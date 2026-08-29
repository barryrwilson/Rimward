import { SYSTEMS, U } from '../game/state.js';
import { pickReticleLock } from '../game/reticle-aim.js';
import { tryEngageAutomine, disengageAutomine, amLine } from '../game/automine.js';
import { dropPartIfNotShip, toggleEnginePart } from '../game/subsys-aim.js';
import { acceptedMiningOreKeys, fieldHasMatchingOre, rockMatchesOreKeys } from '../game/mining-ore-keys.js';
import {
  canOpenPlayCard,
  hailDigitsAllowed,
  playSurfaceBlocked,
  settingsOwnsScreen,
} from './overlay-policy.js';
import { decodeKeyCode } from './key-code.js';
import { COMMANDS, codeOf, conflictFor } from './bindings.js';

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
 *   T (tap)      → cycle target (hostiles first in combat; asteroids too in group 3)
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

const CONTROLS_OWNED = Object.freeze([
  'strafeUp', 'strafeDown', 'strafeLeft', 'strafeRight',
  'rollLeft', 'rollRight', 'throttleUp', 'throttleDown',
  'afterburner', 'drift', 'fire',
  'wpn1', 'wpn2', 'wpn3', 'wpn4', 'wpn5',
  'targetCycle', 'reticleLock', 'automine', 'enginePart',
  'hail', 'dock', 'camera', 'matchSpeed',
]);

const YARD_CHROME_CODE = 'Key' + 'Y';

const snap = {
  strafeUp: 'KeyW',
  strafeDown: 'KeyS',
  strafeLeft: 'KeyA',
  strafeRight: 'KeyD',
  rollLeft: 'KeyQ',
  rollRight: 'KeyE',
  throttleUp: 'KeyR',
  throttleDown: 'KeyF',
  afterburner: 'Space',
  drift: 'ShiftLeft',
  fire: 'Mouse0',
};
const codeToOwned = new Map();
let fireMouseButton = 0;
let fireKeyCode = '';

function seedIdentityTracked() {
  TRACKED.clear();
  const seed = [
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF',
    'KeyQ', 'KeyE',
    'KeyT', 'KeyH', 'KeyC', 'KeyX', 'KeyV', 'KeyN', 'KeyK', 'KeyJ',
    'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
    'ShiftLeft', 'ShiftRight',
    'Space',
  ];
  for (let i = 0; i < seed.length; i++) TRACKED.add(seed[i]);
  PREVENT_DEFAULT.clear();
  PREVENT_DEFAULT.add('Space');
  fireMouseButton = 0;
  fireKeyCode = '';
  snap.strafeUp = 'KeyW';
  snap.strafeDown = 'KeyS';
  snap.strafeLeft = 'KeyA';
  snap.strafeRight = 'KeyD';
  snap.rollLeft = 'KeyQ';
  snap.rollRight = 'KeyE';
  snap.throttleUp = 'KeyR';
  snap.throttleDown = 'KeyF';
  snap.afterburner = 'Space';
  snap.drift = 'ShiftLeft';
  snap.fire = 'Mouse0';
  codeToOwned.clear();
  codeToOwned.set('KeyW', 'strafeUp');
  codeToOwned.set('KeyS', 'strafeDown');
  codeToOwned.set('KeyA', 'strafeLeft');
  codeToOwned.set('KeyD', 'strafeRight');
  codeToOwned.set('KeyQ', 'rollLeft');
  codeToOwned.set('KeyE', 'rollRight');
  codeToOwned.set('KeyR', 'throttleUp');
  codeToOwned.set('KeyF', 'throttleDown');
  codeToOwned.set('Space', 'afterburner');
  codeToOwned.set('ShiftLeft', 'drift');
  codeToOwned.set('ShiftRight', 'drift');
  codeToOwned.set('Digit1', 'wpn1');
  codeToOwned.set('Digit2', 'wpn2');
  codeToOwned.set('Digit3', 'wpn3');
  codeToOwned.set('Digit4', 'wpn4');
  codeToOwned.set('Digit5', 'wpn5');
  codeToOwned.set('KeyT', 'targetCycle');
  codeToOwned.set('KeyV', 'reticleLock');
  codeToOwned.set('KeyN', 'automine');
  codeToOwned.set('KeyK', 'enginePart');
  codeToOwned.set('KeyH', 'hail');
  codeToOwned.set('KeyJ', 'dock');
  codeToOwned.set('KeyC', 'camera');
  codeToOwned.set('KeyX', 'matchSpeed');
}

function isMouseFireCode(code) {
  return code === 'Mouse0' || code === 'Mouse1' || code === 'Mouse2';
}

/** Rebuild TRACKED / PREVENT_DEFAULT from the live bind map. Fail closed to identity. */
export function rebuildTrackedFromBindings(ctx) {
  try {
    TRACKED.clear();
    PREVENT_DEFAULT.clear();
    codeToOwned.clear();
    fireMouseButton = -1;
    fireKeyCode = '';
    for (let i = 0; i < CONTROLS_OWNED.length; i++) {
      const id = CONTROLS_OWNED[i];
      const code = codeOf(ctx, id);
      if (Object.hasOwn(snap, id)) snap[id] = code;
      if (!code || conflictFor(ctx && ctx.settings && ctx.settings.bindings, id, code) === 'reserved') {
        continue;
      }
      if (id === 'fire' && isMouseFireCode(code)) {
        fireMouseButton = code === 'Mouse1' ? 1 : code === 'Mouse2' ? 2 : 0;
        continue;
      }
      TRACKED.add(code);
      codeToOwned.set(code, id);
      if (id === 'fire') fireKeyCode = code;
      if (id === 'drift' && code === 'ShiftLeft') {
        TRACKED.add('ShiftRight');
        codeToOwned.set('ShiftRight', 'drift');
      }
    }
    for (let i = 0; i < COMMANDS.length; i++) {
      if (codeOf(ctx, COMMANDS[i].id) === 'Space') {
        PREVENT_DEFAULT.add('Space');
        break;
      }
    }
  } catch {
    seedIdentityTracked();
  }
}

function stationOrHailOwns(ctx) {
  try {
    const f = ctx && ctx.flags;
    if (f && f.docked === true) return true;
    if (f && f.hailOpen === true) return true;
    return false;
  } catch {
    return false;
  }
}

function isMenuDigitCode(code) {
  if (typeof code !== 'string' || code.length !== 6 || !code.startsWith('Digit')) return false;
  const d = code.charCodeAt(5);
  return d >= 48 && d <= 57;
}

function skipStationHailCode(code) {
  if (code === 'KeyB' || code === YARD_CHROME_CODE) return true;
  return isMenuDigitCode(code);
}

const THROTTLE_RAMP_RATE = 0.5; // setpoint/s while R or F held (§5.1)
const DOUBLE_TAP_MS = 350; // F double-tap window → full stop (§5.1)
const RETICLE_RADIUS_FRACTION = 0.35; // of min(vw, vh)

const PULSE_EDGES = new Set(['dock', 'hail', 'target', 'reticleLock', 'afterburner']);

// Shared with KeyT/H/J/V/Space. agentPulse sets these; next update publishes one frame.
let pendingTarget = false;
let pendingHail = false;
let pendingDock = false;
let pendingReticleLock = false;
let pendingAfterburner = false;

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

/** In-range cycle candidates: ships, plus rocks when mining group is 3. Sort later. */
function collectCycleCands(ctx) {
  const cands = [];
  const shipObj = ctx && ctx.ship && ctx.ship.object;
  if (!shipObj || !shipObj.position) return cands;
  const p = shipObj.position;
  const range2 = U.TARGET_RANGE * U.TARGET_RANGE;
  const ships = ctx.ships;
  if (ships) {
    for (const s of ships) {
      if (!s?.object || !s.object.position || s.state?.destroyed) continue;
      const d2 = s.object.position.distanceToSquared(p);
      if (!Number.isFinite(d2) || d2 > range2) continue;
      cands.push({ ref: s, d2 });
    }
  }
  // Mining group (3) may also target asteroids (§6.2 mining beam).
  // When an accepted mining job still has a matching rock in the field,
  // skip other ores so KeyT does not hunt brine ice first.
  if (ctx.input && ctx.input.weaponGroup === 3 && ctx.asteroids?.list) {
    const list = ctx.asteroids.list;
    let oreKeys = null;
    let matchOn = false;
    try {
      oreKeys = acceptedMiningOreKeys(ctx);
      matchOn = !!(oreKeys && oreKeys.size > 0 && fieldHasMatchingOre(list, oreKeys));
    } catch {
      matchOn = false;
      oreKeys = null;
    }
    for (const a of list) {
      if (!a || !a.position) continue;
      if (matchOn) {
        let ok = false;
        try { ok = rockMatchesOreKeys(a, oreKeys); } catch { ok = false; }
        if (!ok) continue;
      }
      const d2 = a.position.distanceToSquared(p);
      if (!Number.isFinite(d2) || d2 > range2) continue;
      cands.push({ ref: a, d2 });
    }
  }
  return cands;
}

/** Live ship with hostile intent. Rocks and kind locks are never hostile. Missing ai is false. Never throw. */
function isCycleHostile(ref) {
  try {
    if (!ref || !ref.object || ref.lockKind) return false;
    if (!ref.state || ref.state.destroyed) return false;
    if (ref.ai && ref.ai.intent === true) return true;
    return false;
  } catch {
    return false;
  }
}

/** Cycle ctx.targets.current through in-range candidates. Hostiles first when any is in envelope. */
function cycleTarget(ctx) {
  try {
    const cands = collectCycleCands(ctx);
    if (!cands.length) {
      if (ctx && ctx.targets) ctx.targets.current = null;
      return;
    }
    let gated = false;
    for (let i = 0; i < cands.length; i++) {
      if (isCycleHostile(cands[i] && cands[i].ref)) {
        gated = true;
        break;
      }
    }
    if (gated) {
      cands.sort((a, b) => {
        const ha = isCycleHostile(a && a.ref) ? 0 : 1;
        const hb = isCycleHostile(b && b.ref) ? 0 : 1;
        if (ha !== hb) return ha - hb;
        return a.d2 - b.d2;
      });
    } else {
      cands.sort((a, b) => a.d2 - b.d2);
    }
    const cur = ctx && ctx.targets ? ctx.targets.current : null;
    const idx = cands.findIndex((c) => c.ref === cur);
    ctx.targets.current = cands[(idx + 1) % cands.length].ref;
  } catch {
    /* never throw */
  }
}

function hailPulseBlocked(ctx) {
  try {
    if (typeof playSurfaceBlocked === 'function' && playSurfaceBlocked(ctx) === true) return true;
    if (typeof canOpenPlayCard === 'function' && canOpenPlayCard(ctx, 'hail') === false) return true;
    return false;
  } catch {
    return true;
  }
}

function idsEqual(want, got) {
  if (got === undefined || got === null) return false;
  if (want === got) return true;
  if (typeof want === 'number' && typeof got === 'number') return want === got;
  if (typeof want === 'string' && typeof got === 'string') return want === got;
  if (typeof want === 'number' && Number.isInteger(want) && typeof got === 'string' && got === String(want)) {
    return true;
  }
  if (typeof got === 'number' && Number.isInteger(got) && typeof want === 'string' && want === String(got)) {
    return true;
  }
  return false;
}

function matchCycleCand(ctx, cands, id) {
  const list = ctx && ctx.asteroids && ctx.asteroids.list;
  for (let i = 0; i < cands.length; i++) {
    const ref = cands[i] && cands[i].ref;
    if (!ref) continue;
    if (ref.object && ref.state && !ref.lockKind) {
      const sid = Object.hasOwn(ref, 'id') ? ref.id : undefined;
      if (idsEqual(id, sid)) return ref;
      continue;
    }
    if (list) {
      const idx = list.indexOf(ref);
      if (idx >= 0 && idsEqual(id, idx)) return ref;
    }
  }
  return null;
}

/** Agent AP/AM engage: clear the double-tap F latch. Does not write throttle. */
export function agentClearFullStop(ctx) {
  try {
    if (!ctx || !ctx.input || typeof ctx.input !== 'object') return;
    ctx.input.fullStop = false;
  } catch {
    /* ignore */
  }
}

/**
 * Authored pulse: dock | hail | target | reticleLock | afterburner.
 * Same pending* flags as KeyJ/H/T/V/Space. Next update publishes *Pressed one frame, then clears.
 */
export function agentPulse(ctx, edge) {
  try {
    if (typeof edge !== 'string' || !PULSE_EDGES.has(edge)) return 'unknown';
    if (edge === 'dock') {
      if (shouldSkipDockPulse(ctx)) return 'no-service';
      pendingDock = true;
      return '';
    }
    if (edge === 'hail') {
      if (hailPulseBlocked(ctx)) return 'no-service';
      pendingHail = true;
      return '';
    }
    if (edge === 'target') {
      pendingTarget = true;
      return '';
    }
    if (edge === 'reticleLock') {
      pendingReticleLock = true;
      return '';
    }
    if (edge === 'afterburner') {
      pendingAfterburner = true;
      return '';
    }
    return 'unknown';
  } catch {
    return edge === 'dock' || edge === 'hail' ? 'no-service' : 'unknown';
  }
}

/** Digit1–5 law. Writes ctx.input.weaponGroup only. Token on skip or bad n. */
export function agentSetWeaponGroup(ctx, n) {
  try {
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 5) return 'bad-qty';
    if (shouldSkipWeaponGroupDigits(ctx)) return 'no-service';
    if (!ctx || !ctx.input || typeof ctx.input !== 'object') return 'no-service';
    ctx.input.weaponGroup = n;
    return '';
  } catch {
    return 'no-service';
  }
}

/** Cycle (no id) pulses KeyT. id selects an in-range cycle candidate. Does not warp. */
export function agentSelectTarget(ctx, id) {
  try {
    if (ctx && ctx.flags && ctx.flags.docked === true) return 'docked';
    if (!ctx || !ctx.targets || typeof ctx.targets !== 'object') return 'no-service';
    const cands = collectCycleCands(ctx);
    if (!cands.length) return 'no-service';
    if (id === undefined) {
      pendingTarget = true;
      return '';
    }
    if (typeof id !== 'string' && typeof id !== 'number') return 'no-service';
    if (typeof id === 'string' && reservedToken(id)) return 'no-service';
    if (typeof id === 'number' && !Number.isFinite(id)) return 'no-service';
    const hit = matchCycleCand(ctx, cands, id);
    if (!hit) return 'no-service';
    ctx.targets.current = hit;
    return '';
  } catch {
    return 'no-service';
  }
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
  rebuildTrackedFromBindings(ctx);

  // Mouse reticle state (null = not moved yet → treated as screen center).
  let mouseX = null;
  let mouseY = null;
  let fireDown = false;

  // One-frame edge pulses, captured in handlers and published in update().
  // pendingTarget/Hail/Dock/ReticleLock/Afterburner live at module scope (agentPulse).
  let pendingCamera = false;
  let pendingMatchSpeed = false;
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
    const code = decodeKeyCode(e);
    // Space (or any rebound owner) is swallowed iff it is a stored command code.
    if (PREVENT_DEFAULT.has(code)) e.preventDefault();
    try {
      // Intentional Settings mutex (RW-002 PR1): skip all TRACKED while open.
      if (typeof settingsOwnsScreen === 'function' && settingsOwnsScreen() === true) return;
    } catch { /* helper miss: keep flight keys */ }
    if (e.repeat || !TRACKED.has(code)) return;
    if (stationOrHailOwns(ctx) && skipStationHailCode(code)) return;
    pressed.add(code);

    const id = codeToOwned.get(code);
    if (id === 'afterburner') pendingAfterburner = true;
    else if (id === 'targetCycle') pendingTarget = true;
    else if (id === 'hail') pendingHail = true;
    else if (id === 'dock') {
      if (!shouldSkipDockPulse(ctx)) pendingDock = true;
    } else if (id === 'camera') pendingCamera = true;
    else if (id === 'matchSpeed') pendingMatchSpeed = true;
    else if (id === 'reticleLock') pendingReticleLock = true;
    else if (id === 'automine') {
      if (!reticleLockBlocked(ctx)) pendingAutomine = true;
    } else if (id === 'enginePart') pendingEnginePart = true;
    else if (id === 'throttleDown') {
      const now = performance.now();
      if (now - lastFTapAt <= DOUBLE_TAP_MS) {
        input.throttle = 0;
        input.fullStop = true; // doc §5.1: double-tap commands FULL stop (not creep)
      }
      lastFTapAt = now;
    } else if (id === 'wpn1' || id === 'wpn2' || id === 'wpn3' || id === 'wpn4' || id === 'wpn5') {
      if (!(isMenuDigitCode(code) && shouldSkipWeaponGroupDigits(ctx))) {
        input.weaponGroup = id.charCodeAt(3) - 48;
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const code = decodeKeyCode(e);
    if (!code) return;
    pressed.delete(code);
  });

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('mousedown', (e) => {
    if (fireMouseButton >= 0 && e.button === fireMouseButton) fireDown = true;
    if (fireMouseButton === 1 && e.button === 1) e.preventDefault();
    if (fireMouseButton === 2 && e.button === 2) e.preventDefault();
  });

  window.addEventListener('mouseup', (e) => {
    if (fireMouseButton >= 0 && e.button === fireMouseButton) fireDown = false;
  });

  window.addEventListener('auxclick', (e) => {
    if (fireMouseButton === 1 && e.button === 1) e.preventDefault();
  });

  window.addEventListener('contextmenu', (e) => {
    if (fireMouseButton === 2) e.preventDefault();
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
    'T — cycle target (hostiles first in combat)',
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
      // Agent act({ name:'dock' }) sets pendingDock; this publish is the next update.
      input.afterburnerPressed = pendingAfterburner;
      input.targetPressed = pendingTarget;
      input.hailPressed = pendingHail;
      input.dockPressed = pendingDock;
      input.cameraPressed = pendingCamera;
      input.matchSpeedPressed = pendingMatchSpeed;
      input.reticleLockPressed = pendingReticleLock;
      const automineTap = pendingAutomine;
      const enginePartTap = pendingEnginePart;
      input.throttleHeld = has(snap.throttleUp) || has(snap.throttleDown);
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
      let sx = ox / radius; // >0 = reticle right
      let sy = -oy / radius; // >0 = reticle up (screen y is down-positive)
      let gain = ctx.settings && ctx.settings.mouseSensitivity;
      if (typeof gain !== 'number' || !Number.isFinite(gain)) gain = 1;
      if (gain < 0.25) gain = 0.25;
      if (gain > 3) gain = 3;
      sx = Math.max(-1, Math.min(1, sx * gain));
      sy = Math.max(-1, Math.min(1, sy * gain));
      if (ctx.settings && ctx.settings.invertX === true) sx = -sx;
      if (ctx.settings && ctx.settings.invertY === true) sy = -sy;
      input.steerX = sx;
      input.steerY = sy;
      // Pixel offset from screen center (0,0 = centered) — HUD re-centers it.
      // Helm invert/gain must not move the pip; KeyV still locks under the cursor.
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

      input.strafeX = (has(snap.strafeRight) ? 1 : 0) - (has(snap.strafeLeft) ? 1 : 0);
      input.strafeY = (has(snap.strafeUp) ? 1 : 0) - (has(snap.strafeDown) ? 1 : 0);
      input.roll = (has(snap.rollRight) ? 1 : 0) - (has(snap.rollLeft) ? 1 : 0);

      // --- Held buttons.
      input.driftHeld = has(snap.drift) || (snap.drift === 'ShiftLeft' && has('ShiftRight'));
      // Chart overlay: flag is the contract (not a DOM class sniff). Held LMB
      // from before KeyM must not keep firing while the map is open.
      const fireHeldNow = fireMouseButton >= 0 ? fireDown : has(fireKeyCode);
      input.fireHeld = fireHeldNow && ctx.flags.chartOpen !== true;

      // --- Persistent throttle setpoint: hold-to-ramp (§5.1).
      const throttleDir = (has(snap.throttleUp) ? 1 : 0) - (has(snap.throttleDown) ? 1 : 0);
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
