import { SYSTEMS, U } from '../game/state.js';
import { pickReticleLock } from '../game/reticle-aim.js';
import { tryEngageAutomine, disengageAutomine, amLine } from '../game/automine.js';
import { dropPartIfNotShip, toggleEnginePart } from '../game/subsys-aim.js';
import {
  hailDigitsAllowed,
  playSurfaceBlocked,
  settingsOwnsScreen,
} from './overlay-policy.js';

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
 *   A / D        → lateral strafe (D = right)
 *   Q / E        → roll left / right (player sets up)
 *   R / F (hold) → throttle setpoint ramp 0.5/s; double-tap F = full stop
 *   Space (tap)  → afterburner (edge)
 *   Shift (hold) → vector-hold drift
 *   LMB (hold)   → fire current weapon group
 *   1 / 2 / 3 / 4 / 5 → weapon group (cannon / disruptor / mining / missiles / psionic)
 *   T (tap)      → cycle target (nearest first; asteroids too in group 3)
 *   V (tap)      → lock under the visible reticle
 *   K (tap)      → engine-select on a live ship lock (Wave 100)
 *   N (tap)      → engage / cancel automine on a locked asteroid
 *   H (tap)      → hail   ·   J (tap) → dock   ·   C (tap) → camera toggle
 *   X (tap)      → match-speed edge (ship.js toggles flags.matchSpeed)
 *
 * Edge inputs (afterburnerPressed/targetPressed/hailPressed/dockPressed/
 * cameraPressed/matchSpeedPressed/reticleLockPressed) pulse for exactly one frame: captured in event handlers,
 * published (and cleared) at the top of update() so later systems in the
 * same frame still see them. Window blur zeroes axes/fire/drift so the ship
 * never runs away while unfocused; the throttle setpoint persists (§5.1).
 */

// Keys this system owns; everything else is left to the browser.
const TRACKED = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF',
  'KeyQ', 'KeyE',
  'KeyT', 'KeyH', 'KeyC', 'KeyX', 'KeyV', 'KeyN', 'KeyK', 'KeyJ',
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
  'ShiftLeft', 'ShiftRight',
  'Space',
]);

// Only Space scrolls the page — swallow it, nothing else.
const PREVENT_DEFAULT = new Set(['Space']);

const THROTTLE_RAMP_RATE = 0.5; // setpoint/s while R or F held (§5.1)
const DOUBLE_TAP_MS = 350; // F double-tap window → full stop (§5.1)
const RETICLE_RADIUS_FRACTION = 0.35; // of min(vw, vh)

/** True only when the title overlay is attached. Create-on-miss getElementById is not open. */
function titleOverlayAttached() {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById('rw-title');
  if (!el) return false;
  if (el.isConnected === true) return true;
  if (el.parentNode) return true;
  if (el.parent) return true;
  return false;
}

/** Title overlay, models filter, or typing focus: do not pulse pendingDock. Never throw. */
function shouldSkipDockPulse(ctx) {
  try {
    const focus = typeof document !== 'undefined' ? document.activeElement : null;
    const typing = !!focus && (
      focus.tagName === 'INPUT' || focus.tagName === 'TEXTAREA' ||
      focus.tagName === 'SELECT' || focus.isContentEditable
    );
    if (typing) return true;
    if (ctx?.models?.isOpen?.()) return true;
    if (titleOverlayAttached()) return true;
    return false;
  } catch {
    return true;
  }
}

/** Digit1–5 stay flight WPN; do not write while a dock menu or play surface owns those digits. Never throw. */
function shouldSkipWeaponGroupDigits(ctx) {
  try {
    const f = ctx && ctx.flags;
    if (f && f.docked === true) return true;
    if (f && f.hailOpen === true) return true;
    try {
      if (typeof hailDigitsAllowed === 'function' && hailDigitsAllowed(ctx) === false) return true;
    } catch { /* helper miss */ }
    try {
      if (typeof playSurfaceBlocked === 'function' && playSurfaceBlocked(ctx) === true) return true;
    } catch { /* */ }
    try {
      if (typeof settingsOwnsScreen === 'function' && settingsOwnsScreen() === true) return true;
    } catch { /* */ }
    if (f && (f.paused === true || f.chartOpen === true || f.berthOpen === true)) return true;
    if (shouldSkipDockPulse(ctx)) return true;
    return false;
  } catch {
    return !!(ctx && ctx.flags && ctx.flags.docked === true);
  }
}

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

function reservedToken(value) {
  return value === '__proto__' || value === 'constructor' || value === 'prototype';
}

function allowedLockKind(t) {
  const k = t && t.lockKind;
  if (k === 'station' || k === 'gate' || k === 'pod' || k === 'landmark') return k;
  return null;
}

/** Rock lock: asteroid list row. Untagged `{position}` is not a rock. */
function isRockLock(t) {
  if (!t || !t.position) return false;
  if (t.lockKind === 'rock') return true;
  if (t.lockKind) return false;
  return !t.object && !t.state;
}

/** Null a rock lock the field no longer holds. Does not touch ship locks. */
function dropStaleRockLock(ctx) {
  const t = ctx.targets.current;
  if (!isRockLock(t)) return;
  const list = ctx.asteroids && ctx.asteroids.list;
  if (!list || list.indexOf(t) < 0) ctx.targets.current = null;
}

function currentSystemDef(ctx) {
  const sysId = ctx.world && ctx.world.currentSystem;
  if (typeof sysId !== 'string' || reservedToken(sysId)) return null;
  if (ctx.systems && Object.hasOwn(ctx.systems, sysId)) return ctx.systems[sysId];
  if (Object.hasOwn(SYSTEMS, sysId)) return SYSTEMS[sysId];
  return null;
}

function dropStaleKindLock(ctx) {
  const t = ctx.targets.current;
  if (!t) return;
  if (t.lockKind == null) return;
  const kind = allowedLockKind(t);
  if (!kind) {
    ctx.targets.current = null;
    return;
  }
  if (kind === 'station') {
    if (!ctx.station || !ctx.station.position) ctx.targets.current = null;
    return;
  }
  if (kind === 'pod') {
    if (!ctx.pods || ctx.pods.indexOf(t.pod) < 0) ctx.targets.current = null;
    return;
  }
  const def = currentSystemDef(ctx);
  if (!def) {
    ctx.targets.current = null;
    return;
  }
  if (kind === 'gate') {
    const to = t.to;
    if (typeof to !== 'string' || reservedToken(to) || !Object.hasOwn(SYSTEMS, to)) {
      ctx.targets.current = null;
      return;
    }
    if (t.hub) {
      const routes = def.hub && def.hub.routes;
      if (!routes || routes.indexOf(to) < 0) ctx.targets.current = null;
      return;
    }
    const gates = def.gates;
    if (!gates) {
      ctx.targets.current = null;
      return;
    }
    for (let i = 0; i < gates.length; i++) {
      if (gates[i] && gates[i].to === to) return;
    }
    ctx.targets.current = null;
    return;
  }
  if (kind === 'landmark') {
    const id = t.id;
    if (typeof id !== 'string' || reservedToken(id)) {
      ctx.targets.current = null;
      return;
    }
    const lms = def.landmarks;
    if (!lms) {
      ctx.targets.current = null;
      return;
    }
    for (let i = 0; i < lms.length; i++) {
      if (lms[i] && lms[i].id === id) return;
    }
    ctx.targets.current = null;
  }
}

const RETICLE_LOCK_MISS = 'Nothing under the reticle.';

function reticleLockBlocked(ctx) {
  if (!ctx.ship?.object) return true;
  if (ctx.flags?.docked) return true;
  if (ctx.gate?.jumping) return true;
  if (ctx.flags?.paused) return true;
  if (ctx.models?.isOpen?.()) return true;
  if (typeof document !== 'undefined' && document.getElementById?.('rw-title')) return true;
  return false;
}

function missReticleLock(ctx) {
  ctx.emit('commLine', { text: RETICLE_LOCK_MISS });
  ctx.emit('reticleLock', { hit: false });
}

/** Direct-hit lock under the visible reticle. Miss does not steal the current lock. */
function tryReticleLock(ctx) {
  if (reticleLockBlocked(ctx)) {
    missReticleLock(ctx);
    return;
  }
  const hit = pickReticleLock(ctx);
  if (!hit) {
    missReticleLock(ctx);
    return;
  }
  if (hit.lockKind != null && !allowedLockKind(hit)) {
    missReticleLock(ctx);
    return;
  }
  ctx.targets.current = hit;
  ctx.emit('reticleLock', { hit: true });
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
  let pendingMatchSpeed = false;
  let pendingReticleLock = false;
  let pendingAutomine = false;
  let pendingEnginePart = false;

  let lastFTapAt = -Infinity; // performance.now() ms of previous F tap

  const zeroAxesFireDrift = () => {
    pressed.clear();
    fireDown = false;
    pendingAfterburner = pendingTarget = pendingHail = pendingDock = pendingCamera = pendingMatchSpeed = pendingReticleLock = pendingAutomine = pendingEnginePart = false;
    input.matchSpeedPressed = false;
    input.reticleLockPressed = false;
    input.throttleHeld = false;
    input.steerX = 0;
    input.steerY = 0;
    input.strafeX = 0;
    input.strafeY = 0;
    input.roll = 0;
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
      case 'KeyJ':
        if (!shouldSkipDockPulse(ctx)) pendingDock = true;
        break;
      case 'KeyC':
        pendingCamera = true;
        break;
      case 'KeyX':
        pendingMatchSpeed = true;
        break;
      case 'KeyV':
        pendingReticleLock = true;
        break;
      case 'KeyN':
        if (!reticleLockBlocked(ctx)) pendingAutomine = true;
        break;
      case 'KeyK':
        pendingEnginePart = true;
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
        if (!shouldSkipWeaponGroupDigits(ctx)) input.weaponGroup = 1;
        break;
      case 'Digit2':
        if (!shouldSkipWeaponGroupDigits(ctx)) input.weaponGroup = 2;
        break;
      case 'Digit3':
        if (!shouldSkipWeaponGroupDigits(ctx)) input.weaponGroup = 3;
        break;
      case 'Digit4':
        // Group 4 is missiles when a launcher is seated.
        if (!shouldSkipWeaponGroupDigits(ctx)) input.weaponGroup = 4;
        break;
      case 'Digit5':
        if (!shouldSkipWeaponGroupDigits(ctx)) input.weaponGroup = 5;
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
    'Q/E — roll left / right (set your up)',
    'R/F (hold) — throttle up / down · double-tap F — full stop',
    'Space — afterburner',
    'Shift (hold) — vector-hold drift',
    'LMB (hold) — fire',
    '1/2/3/4/5 — weapon group: cannon / disruptor / mining / missiles / psionic',
    'T — cycle target',
    'V — lock under reticle',
    'N — automine locked asteroid',
    'H — hail · J — dock · C — camera (chase / third / first-person)',
    'X — match lock speed',
    'K — engine on lock (after shields)',
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
      input.matchSpeedPressed = pendingMatchSpeed;
      input.reticleLockPressed = pendingReticleLock;
      const automineTap = pendingAutomine;
      const enginePartTap = pendingEnginePart;
      input.throttleHeld = has('KeyR') || has('KeyF');
      pendingAfterburner = pendingTarget = pendingHail = pendingDock = pendingCamera = pendingMatchSpeed = pendingReticleLock = pendingAutomine = pendingEnginePart = false;

      if (input.cameraPressed) {
        const order = ['chase', 'third', 'first'];
        const cur = ctx.flags.camera || (ctx.flags.firstPerson ? 'first' : 'chase');
        const i = order.indexOf(cur);
        const next = order[(i < 0 ? 0 : i + 1) % 3];
        ctx.flags.camera = next;
        ctx.flags.firstPerson = next === 'first';
      }

      // Stale rock / kind lock: jump, scoop, despawn, and systemLoaded drop.
      const evs = ctx.lastEvents;
      for (let i = 0; i < evs.length; i++) {
        const typ = evs[i].type;
        if (typ === 'systemLoaded') {
          if (ctx.targets.current && ctx.targets.current.lockKind) ctx.targets.current = null;
          dropStaleRockLock(ctx);
        }
        if (typ === 'podCollected') dropStaleKindLock(ctx);
      }
      dropStaleRockLock(ctx);
      dropStaleKindLock(ctx);

      if (input.targetPressed) cycleTarget(ctx);
      dropPartIfNotShip(ctx);
      if (enginePartTap) toggleEnginePart(ctx);

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

      if (input.reticleLockPressed) tryReticleLock(ctx);

      if (automineTap && !reticleLockBlocked(ctx)) {
        if (ctx.automine && ctx.automine.engaged) {
          disengageAutomine(ctx, 'cancel');
        } else {
          const token = tryEngageAutomine(ctx);
          if (!token) {
            input.weaponGroup = 3;
          } else {
            const line = amLine(token);
            if (line) ctx.emit('commLine', { text: line });
          }
        }
      }

      input.strafeX = (has('KeyD') ? 1 : 0) - (has('KeyA') ? 1 : 0);
      input.strafeY = (has('KeyW') ? 1 : 0) - (has('KeyS') ? 1 : 0);
      input.roll = (has('KeyE') ? 1 : 0) - (has('KeyQ') ? 1 : 0);

      // --- Held buttons.
      input.driftHeld = has('ShiftLeft') || has('ShiftRight');
      // Chart overlay: flag is the contract (not a DOM class sniff). Held LMB
      // from before KeyM must not keep firing while the map is open.
      input.fireHeld = fireDown && ctx.flags.chartOpen !== true;

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
