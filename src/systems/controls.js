import { U } from '../game/state.js';

/**
 * Controls system — mouse/keyboard → ctx.input (design doc §5.1/§5.5).
 *
 * STEERING IS RETICLE-BASED (no pointer lock): the mouse cursor is a reticle;
 * its offset from screen center (clamped to a radius of ~35% of the smaller
 * viewport dimension) becomes steerX/steerY in [-1, 1]. The clamped pixel
 * offset FROM SCREEN CENTER (0,0 = centered) is published to
 * ctx.targets.reticleScreen for the HUD reticle element (orchestrator ruling:
 * the HUD re-centers it, e.g. in first-person mode).
 *
 * Bindings (mirrored into ctx.config.controls for the HUD):
 *   Mouse        → steer toward reticle
 *   W / S        → vertical strafe (W = up)
 *   A / D        → lateral strafe (D = right)   — no roll axis (§5.1)
 *   R / F (hold) → throttle setpoint ramp 0.5/s; double-tap F = full stop
 *   Space (tap)  → afterburner (edge)
 *   Shift (hold) → vector-hold drift
 *   LMB (hold)   → fire current weapon group
 *   1 / 2 / 3    → weapon group (cannon / disruptor / mining)
 *   T (tap)      → cycle target (nearest first; asteroids too in group 3)
 *   H (tap)      → hail   ·   D (tap) → dock   ·   C (tap) → camera toggle
 *
 * Edge inputs (afterburnerPressed/targetPressed/hailPressed/dockPressed/
 * cameraPressed) pulse for exactly one frame: captured in event handlers,
 * published (and cleared) at the top of update() so later systems in the
 * same frame still see them. Window blur zeroes axes/fire/drift so the ship
 * never runs away while unfocused; the throttle setpoint persists (§5.1).
 */

// Keys this system owns; everything else is left to the browser.
const TRACKED = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF',
  'KeyT', 'KeyH', 'KeyC',
  'Digit1', 'Digit2', 'Digit3',
  'ShiftLeft', 'ShiftRight',
  'Space',
]);

// Only Space scrolls the page — swallow it, nothing else.
const PREVENT_DEFAULT = new Set(['Space']);

const THROTTLE_RAMP_RATE = 0.5; // setpoint/s while R or F held (§5.1)
const DOUBLE_TAP_MS = 350; // F double-tap window → full stop (§5.1)
const RETICLE_RADIUS_FRACTION = 0.35; // of min(vw, vh)

/** Cycle ctx.targets.current through in-range candidates, nearest first. */
function cycleTarget(ctx) {
  const shipObj = ctx.ship.object;
  if (!shipObj) {
    ctx.targets.current = null;
    return;
  }
  const p = shipObj.position;
  const range2 = U.TARGET_RANGE * U.TARGET_RANGE;
  const cands = [];
  for (const s of ctx.ships) {
    if (!s?.object || s.state?.destroyed) continue;
    const d2 = s.object.position.distanceToSquared(p);
    if (d2 <= range2) cands.push({ ref: s, d2 });
  }
  // Mining group (3) may also target asteroids (§6.2 mining beam).
  if (ctx.input.weaponGroup === 3 && ctx.asteroids?.list) {
    for (const a of ctx.asteroids.list) {
      const d2 = a.position.distanceToSquared(p);
      if (d2 <= range2) cands.push({ ref: a, d2 });
    }
  }
  if (!cands.length) {
    ctx.targets.current = null;
    return;
  }
  cands.sort((a, b) => a.d2 - b.d2);
  const idx = cands.findIndex((c) => c.ref === ctx.targets.current);
  ctx.targets.current = cands[(idx + 1) % cands.length].ref;
}

export function initControls(ctx) {
  const { input, config } = ctx;
  const pressed = new Set();

  // Mouse reticle state (null = not moved yet → treated as screen center).
  let mouseX = null;
  let mouseY = null;
  let fireDown = false;

  // One-frame edge pulses, captured in handlers and published in update().
  let pendingAfterburner = false;
  let pendingTarget = false;
  let pendingHail = false;
  let pendingDock = false;
  let pendingCamera = false;

  let lastFTapAt = -Infinity; // performance.now() ms of previous F tap

  const zeroAxesFireDrift = () => {
    pressed.clear();
    fireDown = false;
    pendingAfterburner = pendingTarget = pendingHail = pendingDock = pendingCamera = false;
    input.steerX = 0;
    input.steerY = 0;
    input.strafeX = 0;
    input.strafeY = 0;
    input.fireHeld = false;
    input.driftHeld = false;
    // Throttle setpoint deliberately persists (§5.1 persistent setpoint).
  };

  window.addEventListener('keydown', (e) => {
    if (e.repeat || !TRACKED.has(e.code)) return;
    pressed.add(e.code);
    if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();

    switch (e.code) {
      case 'Space':
        pendingAfterburner = true;
        break;
      case 'KeyT':
        pendingTarget = true;
        break;
      case 'KeyH':
        pendingHail = true;
        break;
      case 'KeyD':
        pendingDock = true;
        break;
      case 'KeyC':
        pendingCamera = true;
        break;
      case 'KeyF': {
        const now = performance.now();
        if (now - lastFTapAt <= DOUBLE_TAP_MS) {
          input.throttle = 0;
          input.fullStop = true; // doc §5.1: double-tap commands FULL stop (not creep)
        }
        lastFTapAt = now;
        break;
      }
      case 'Digit1':
        input.weaponGroup = 1;
        break;
      case 'Digit2':
        input.weaponGroup = 2;
        break;
      case 'Digit3':
        input.weaponGroup = 3;
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    pressed.delete(e.code);
  });

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) fireDown = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) fireDown = false;
  });

  window.addEventListener('blur', zeroAxesFireDrift);

  // Human-readable lines for the HUD (filled once here, per contract).
  config.controls.push(
    'Mouse — steer toward reticle',
    'W/S — vertical strafe (W = up)',
    'A/D — lateral strafe (D = right)',
    'R/F (hold) — throttle up / down · double-tap F — full stop',
    'Space — afterburner',
    'Shift (hold) — vector-hold drift',
    'LMB (hold) — fire',
    '1/2/3 — weapon group: cannon / disruptor / mining',
    'T — cycle target',
    'H — hail · D — dock · C — camera (chase / first-person)',
    'G — cycle hub route at a Lamplighter junction',
    'M — galaxy chart',
    'L — berth records (save/load)',
    'P — pause',
  );

  return {
    update(dt) {
      const has = (code) => pressed.has(code);

      // --- Publish one-frame edge pulses (later systems see them this frame).
      input.afterburnerPressed = pendingAfterburner;
      input.targetPressed = pendingTarget;
      input.hailPressed = pendingHail;
      input.dockPressed = pendingDock;
      input.cameraPressed = pendingCamera;
      pendingAfterburner = pendingTarget = pendingHail = pendingDock = pendingCamera = false;

      if (input.cameraPressed) ctx.flags.firstPerson = !ctx.flags.firstPerson;
      if (input.targetPressed) cycleTarget(ctx);

      // --- Reticle steering: offset from screen center, clamped to radius.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = vw / 2;
      const cy = vh / 2;
      const radius = RETICLE_RADIUS_FRACTION * Math.min(vw, vh);
      let ox = (mouseX ?? cx) - cx;
      let oy = (mouseY ?? cy) - cy;
      const len = Math.hypot(ox, oy);
      if (len > radius) {
        ox *= radius / len;
        oy *= radius / len;
      }
      input.steerX = ox / radius; // >0 = reticle right
      input.steerY = -oy / radius; // >0 = reticle up (screen y is down-positive)
      // Pixel offset from screen center (0,0 = centered) — HUD re-centers it.
      ctx.targets.reticleScreen.x = ox;
      ctx.targets.reticleScreen.y = oy;

      // --- Strafe axes (no roll axis — Q/E unbound, §5.1).
      input.strafeX = (has('KeyD') ? 1 : 0) - (has('KeyA') ? 1 : 0);
      input.strafeY = (has('KeyW') ? 1 : 0) - (has('KeyS') ? 1 : 0);

      // --- Held buttons.
      input.driftHeld = has('ShiftLeft') || has('ShiftRight');
      input.fireHeld = fireDown;

      // --- Persistent throttle setpoint: hold-to-ramp (§5.1).
      const throttleDir = (has('KeyR') ? 1 : 0) - (has('KeyF') ? 1 : 0);
      if (throttleDir > 0) input.fullStop = false; // thrust command cancels full stop
      if (throttleDir !== 0) {
        input.throttle = Math.min(
          1,
          Math.max(0, input.throttle + throttleDir * THROTTLE_RAMP_RATE * dt),
        );
      }
    },
  };
}
