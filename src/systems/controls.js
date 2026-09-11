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
import { registerBerthInput } from '../game/launch-clearance.js';
import { defenseApplied } from '../game/agent-defense.js';
import { combatWeapon, combatSample, createCombat, combatTick, combatView } from '../game/agent-combat.js';

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
// Default weapon digits are 1–5. Digit 0 stays with the dock's shipyard service.
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
  PREVENT_DEFAULT.clear();
  PREVENT_DEFAULT.add('Space');
  fireMouseButton = 0;
  fireKeyCode = '';
  codeToOwned.clear();
  // bindings supplies the identity defaults; retain this owner's subset.
  for (const { id, defaultCode } of COMMANDS) {
    if (!CONTROLS_OWNED.includes(id)) continue;
    if (Object.hasOwn(snap, id)) snap[id] = defaultCode;
    if (id === 'fire') continue;
    TRACKED.add(defaultCode);
    codeToOwned.set(defaultCode, id);
  }
  TRACKED.add('ShiftRight');
  codeToOwned.set('ShiftRight', 'drift');
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

// Physical fire belongs to flight, not a menu click or a held key carried
// through one. Agent combat authority has its own gates below (including
// its explicit permission to continue through incoming hail and focus loss).
function physicalFireBlocked(ctx) {
  const f = ctx.flags;
  return f.paused === true || f.docked === true || f.berthHold === true
    || f.chartOpen === true || f.berthOpen === true
    || playSurfaceBlocked(ctx) || settingsOwnsScreen();
}

const physicalFireReleases = new WeakMap();

/** Pause freezes update(); its owner must also discard the private fire latch. */
export function clearPhysicalFire(ctx) {
  physicalFireReleases.get(ctx)?.();
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

// ---------------------------------------------------------------------------
// Agent manual-control lease (agent API v2, mission 43b34db25ae32972).
// controls.js stays the sole ctx.input writer. A lease is a bounded, expiring
// bundle of normalized player inputs — steering/strafe/roll axes, a throttle
// setpoint target (ramped at the player rate), fire and drift holds — applied
// by update() at game rate while the outer planner refreshes at low rate.
// It is not a helm: AP/AM/flee ownership is refused, not stolen, and any
// physical flight input wins immediately. Every unsafe lifecycle transition
// (expiry, blur, pause, berth hold, overlays, dock, jump, death, opt-out,
// explicit clear) zeroes the lease before the next combat tick, so fire can
// never stick. Session-only module state; nothing persists.
const LEASE_TTL_MIN = 0.05;
const LEASE_TTL_MAX = 5;
const LEASE_TTL_DEFAULT = 1;
const LEASE_KEYS = new Set([
  'seq', 'ttl',
  'steerX', 'steerY', 'strafeX', 'strafeY', 'roll',
  'throttle', 'fireHeld', 'driftHeld',
]);

let lease = null; // { seq, expiresAt, steerX, steerY, strafeX, strafeY, roll, throttle, fire, drift }
let leaseSeq = 0; // last accepted sequence; stale arrivals refused
let leaseNote = { state: 'idle', seq: 0, reason: '', t: 0 }; // last terminal transition
let combatNote = null;
// Issue #118: human-readable context for the last argument or target refusal
// returned by agentControlSet / agentCombatSet. The token stays the stable
// enum; this string only says which field or which precondition failed.
let refusalDetail = '';
let combatRelease = () => {};
let physicalHeld = () => false;

// Combat release is a normal full stop. Raw lease throttle semantics persist.
function combatNeutral(ctx) {
  const input = ctx.input;
  input.steerX = input.steerY = input.strafeX = input.strafeY = input.roll = input.throttle = 0;
  input.fireHeld = input.driftHeld = input.afterburnerPressed = input.agentBurnerHeld = false;
  input.fullStop = true;
}

function simNow(ctx) {
  return ctx && ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
}

const wallNow = () => performance.now() / 1000;
function expireCombat(ctx) {
  if (lease?.combat && (simNow(ctx) >= lease.expiresAt || wallNow() >= lease.wallExpiresAt)) {
    dropLease(ctx, 'expired');
  }
}

function noteLease(ctx, state, seq, reason) {
  leaseNote = { state, seq, reason, t: simNow(ctx) };
}

/** Idempotent. Returns true when a live lease was dropped. */
function dropLease(ctx, reason) {
  if (!lease) return false;
  const seq = lease.seq;
  if (lease.combat) {
    lease.combat.completedAt = simNow(ctx);
    lease.combat.defense.phase = 'completed';
    lease.combat.defense.maneuver = 'stopped';
    lease.combat.defense.completedAt = simNow(ctx);
    lease.combat.fireBlocked = reason;
    combatNote = combatView(lease.combat);
    combatNeutral(ctx);
    combatRelease();
  }
  lease = null;
  noteLease(ctx, reason === 'expired' ? 'expired' : 'cleared', seq, reason || 'cleared');
  return true;
}

/** Live gates, re-checked every applied tick. '' means the lease may run. */
function leaseGateToken(ctx, combat = false) {
  try {
    const f = ctx && ctx.flags;
    if (!f || typeof f !== 'object') return 'no-service';
    if (f.docked === true) return 'docked';
    if (f.berthHold === true) return 'held';
    if (f.paused === true) return 'paused';
    if (ctx.gate && ctx.gate.jumping === true) return 'jumping';
    // Incoming hail cards leave flight live. Only the combat owner may keep
    // its explicit authorization through them; raw leases retain their gate.
    if ((!combat && f.hailOpen === true) || f.chartOpen === true || f.berthOpen === true) return 'overlay';
    try { if (typeof playSurfaceBlocked === 'function' && playSurfaceBlocked(ctx) === true) return 'overlay'; } catch { /* helper miss */ }
    try { if (typeof settingsOwnsScreen === 'function' && settingsOwnsScreen() === true) return 'overlay'; } catch { /* helper miss */ }
    const death = ctx.deathApi;
    if (death && typeof death.isOpen === 'function' && death.isOpen() === true) return 'dead';
    if (ctx.autopilot && ctx.autopilot.engaged === true) return 'helm';
    if (ctx.world && ctx.world.nav && ctx.world.nav.autopilot === true) return 'helm';
    if (ctx.automine && ctx.automine.engaged === true) return 'helm';
    if (ctx.flee && ctx.flee.engaged === true) return 'helm';
    return '';
  } catch {
    return 'no-service';
  }
}

/** Refuse with a stable token and record the human-readable reason. */
function refuse(token, detail = '') {
  refusalDetail = typeof detail === 'string' ? detail : '';
  return token;
}

/** Detail recorded by the most recent agentControlSet / agentCombatSet refusal. */
export function agentRefusalDetail() { return refusalDetail; }

/**
 * Issue #118: why combatSample() has no fresh HUD digest for a live ship lock.
 * Mirrors the combatSample predicate order so the first failing clause names
 * the cause. hud.js writes the digest once per rendered frame, so a new lock
 * or weapon group needs one rendered frame; a suspended tab renders none.
 */
function sampleGap(ctx, target) {
  const a = ctx.targets?.aim;
  const frame = '; one rendered HUD frame is needed after selectTarget';
  if (!a) return 'no HUD aim digest yet' + frame;
  if (a.targetId !== target.id) {
    return 'HUD aim digest is for ' + (a.targetId == null ? 'no ship' : String(a.targetId)) + ', not ' + String(target.id) + frame;
  }
  if (a.system !== ctx.world.currentSystem) return 'HUD aim digest is from another system' + frame;
  if (a.weaponGroup !== ctx.input.weaponGroup) {
    return 'HUD aim digest is for weapon group ' + String(a.weaponGroup) + ', not ' + String(ctx.input.weaponGroup)
      + '; one rendered HUD frame is needed after setWeaponGroup';
  }
  const age = ctx.world.time - a.t;
  if (!(age >= 0 && age <= 0.25)) {
    return 'HUD aim digest age ' + (Number.isFinite(age) ? age.toFixed(2) + ' s' : 'unknown')
      + ' exceeds 0.25 s; no frame rendered since, the simulation may be suspended';
  }
  if (!(a.dist > 0 && a.dist <= U.TARGET_RANGE)) {
    return 'target range ' + (Number.isFinite(a.dist) ? String(Math.round(a.dist)) : '?') + ' u exceeds targeting range ' + U.TARGET_RANGE + ' u';
  }
  return 'HUD aim digest is incomplete';
}

function leaseAxis(spec, key) {
  if (!Object.hasOwn(spec, key) || spec[key] === undefined) return 0;
  const v = spec[key];
  if (typeof v !== 'number' || !Number.isFinite(v) || v < -1 || v > 1) return null;
  return v;
}

/**
 * Accept a bounded manual-control lease. Returns '' on accept or a stable
 * refusal token. Strict: unknown keys, non-finite/out-of-range axes, stale or
 * non-integer sequence, out-of-bounds TTL, and every gated lifecycle state
 * leave the current input untouched.
 */
export function agentControlSet(ctx, spec) {
  try {
    expireCombat(ctx);
    refusalDetail = '';
    if (!ctx || !ctx.input || typeof ctx.input !== 'object') return 'no-service';
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return refuse('bad-args', 'args must be a plain object');
    for (const k of Object.keys(spec)) {
      if (!LEASE_KEYS.has(k)) return refuse('bad-args', 'unknown argument ' + k);
    }
    const seq = spec.seq;
    if (!Number.isSafeInteger(seq) || seq < 1) return refuse('bad-seq', 'seq must be a safe integer >= 1');
    if (seq <= leaseSeq) return refuse('stale', 'seq must exceed ' + leaseSeq);
    let ttl = LEASE_TTL_DEFAULT;
    if (spec.ttl !== undefined) {
      ttl = spec.ttl;
      if (typeof ttl !== 'number' || !Number.isFinite(ttl) || ttl < LEASE_TTL_MIN || ttl > LEASE_TTL_MAX) {
        return refuse('bad-ttl', 'ttl must be a number in ' + LEASE_TTL_MIN + '..' + LEASE_TTL_MAX + ' seconds');
      }
    }
    const steerX = leaseAxis(spec, 'steerX');
    const steerY = leaseAxis(spec, 'steerY');
    const strafeX = leaseAxis(spec, 'strafeX');
    const strafeY = leaseAxis(spec, 'strafeY');
    const roll = leaseAxis(spec, 'roll');
    if (steerX === null || steerY === null || strafeX === null || strafeY === null || roll === null) {
      const bad = ['steerX', 'steerY', 'strafeX', 'strafeY', 'roll'].find(k => leaseAxis(spec, k) === null);
      return refuse('bad-axis', bad + ' must be a number in -1..1');
    }
    let throttle = null;
    if (spec.throttle !== undefined && spec.throttle !== null) {
      const t = spec.throttle;
      if (typeof t !== 'number' || !Number.isFinite(t) || t < 0 || t > 1) return refuse('bad-throttle', 'throttle must be a number in 0..1');
      throttle = t;
    }
    const gate = leaseGateToken(ctx);
    if (gate) return gate;
    if (lease?.combat) return 'helm';
    leaseSeq = seq;
    combatNote = null;
    lease = {
      seq,
      expiresAt: simNow(ctx) + ttl,
      steerX, steerY, strafeX, strafeY, roll,
      throttle,
      fire: spec.fireHeld === true,
      drift: spec.driftHeld === true,
    };
    noteLease(ctx, 'active', seq, '');
    return '';
  } catch {
    return 'no-service';
  }
}

/** One shared owner/sequence, with a longer *explicit* tactical authorization. */
export function agentCombatSet(ctx, spec) {
  try {
    expireCombat(ctx);
    refusalDetail = '';
    if (!ctx?.input || !ctx.ship?.object) return 'no-service';
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return refuse('bad-args', 'args must be a plain object');
    const unknown = Object.keys(spec).find(k => !['seq', 'ttl', 'targetId', 'intent', 'defense'].includes(k));
    if (unknown !== undefined) return refuse('bad-args', 'unknown argument ' + unknown);
    const missing = ['seq', 'ttl', 'targetId', 'intent'].find(k => !Object.hasOwn(spec, k));
    if (missing !== undefined) return refuse('bad-args', 'missing required argument ' + missing);
    if (!Number.isSafeInteger(spec.seq) || spec.seq < 1) return refuse('bad-seq', 'seq must be a safe integer >= 1');
    if (spec.seq <= leaseSeq) return refuse('stale', 'seq must exceed ' + leaseSeq);
    if (!Number.isFinite(spec.ttl) || spec.ttl < 1 || spec.ttl > 60) return refuse('bad-ttl', 'ttl must be a number in 1..60 seconds');
    if (!['engage', 'disable', 'break-off', 'retreat'].includes(spec.intent)) {
      return refuse('bad-args', "intent must be 'engage'|'disable'|'break-off'|'retreat'");
    }
    if (typeof spec.targetId !== 'string' || !spec.targetId) return refuse('bad-args', 'targetId must be a non-empty string');
    const stance = Object.hasOwn(spec, 'defense') ? spec.defense : 'evade';
    if (!['evade', 'break-off', 'off'].includes(stance)) return refuse('bad-args', "defense must be 'evade'|'break-off'|'off'");
    const prior = lease?.combat;
    const same = prior && prior.intent === spec.intent && prior.targetId === spec.targetId
      && prior.weaponGroup === ctx.input.weaponGroup && prior.defense.stance === stance;
    const gate = leaseGateToken(ctx, true);
    if (gate) return gate;
    if (ctx.agent?.optIn !== true) return 'opt-in';
    if (ctx.player?.destroyed) return 'dead';
    if (physicalHeld()) return 'player-override';
    if (ctx.flags.matchSpeed) return 'match-speed';
    if ((ctx.ship.burnerActive && !(same && prior.defense.burnerRequested && ctx.input.agentBurnerHeld))
        || (ctx.ship.driftActive && !(same && prior.defense.driftRequested && ctx.input.driftHeld))) return 'helm';
    if (lease && !lease.combat) return 'helm';
    // Issue #118: one token per precondition, so a runner can tell "select
    // the hull first" from "wait one HUD frame" from "the hull is gone".
    const target = ctx.targets?.current;
    if (target && (target.lockKind || (!target.object && !target.state))) {
      return refuse('lock-kind', 'current lock is a ' + String(target.lockKind || 'rock') + ', not a ship; selectTarget the hull first');
    }
    if (!target) return refuse('stale-lock', 'no current lock; selectTarget ' + spec.targetId + ' first');
    if (target.id !== spec.targetId) {
      return refuse('stale-lock', 'current lock is ' + String(target.id) + ', not ' + spec.targetId + '; selectTarget it first');
    }
    if (!target.object || !target.state || !ctx.ships.includes(target)) {
      return refuse('target-lost', 'hull ' + spec.targetId + ' is no longer in the live roster');
    }
    if (!combatSample(ctx, target)) return refuse('no-sample', sampleGap(ctx, target));
    if (target.state.destroyed) return 'target-destroyed';
    if (spec.intent === 'engage' || spec.intent === 'disable') {
      if (target.state.surrendered) return 'target-surrendered';
      if (target.state.disabled) return 'target-disabled';
      if (!combatWeapon(ctx)) return 'weapon';
    }
    // Renew only the same live maneuver. An expired grant is a fresh start.
    const keep = prior && lease.expiresAt > simNow(ctx) && prior.target === target
      && prior.record === target.record && prior.system === ctx.world.currentSystem
      && same;
    const combat = keep ? prior : createCombat(ctx, target, spec.intent, stance);
    leaseSeq = spec.seq;
    combatNote = null;
    lease = { seq: spec.seq, expiresAt: simNow(ctx) + spec.ttl, wallExpiresAt: wallNow() + spec.ttl, combat,
      steerX: 0, steerY: 0, strafeX: 0, strafeY: 0, roll: 0,
      throttle: null, fire: false, drift: false };
    // A replacement cannot leave an old firing command live until next frame.
    ctx.input.fireHeld = false;
    // Issue #114: a combat intent is a thrust command. Clear the double-tap F
    // latch on acceptance, exactly like engageAutopilot / engageAutomine, so
    // a hull stopped by the #103 handshake does not hold station under a
    // lease whose view reports an intercept. The first applied tick would
    // clear it anyway; clearing here keeps flags.fullStop honest before it.
    ctx.input.fullStop = false;
    if (!keep) ctx.input.driftHeld = ctx.input.agentBurnerHeld = ctx.input.afterburnerPressed = false;
    noteLease(ctx, 'active', leaseSeq, '');
    return '';
  } catch { return 'no-service'; }
}

export function agentCombatActive(ctx) { expireCombat(ctx); return !!lease?.combat; }

/** Explicit clear. Idempotent; safe to call for any session state. */
export function agentControlClear(ctx, reason = 'explicit') {
  try {
    expireCombat(ctx);
    if (!dropLease(ctx, reason) && !combatNote) noteLease(ctx, 'cleared', leaseSeq, reason);
    return '';
  } catch {
    return 'no-service';
  }
}

/**
 * Issue #114: while a live combat lease is held at rest by the full-stop
 * latch, say so. Physical movement blocks (obstruction, engine) keep priority.
 */
function combatStatusView(ctx, c) {
  const view = combatView(c);
  if (!view.movementBlocked && ctx?.input?.fullStop === true) view.movementBlocked = 'full-stop';
  return view;
}

/** JSON-plain lease status for observe(). Never throws. */
export function agentControlStatus(ctx) {
  try {
    expireCombat(ctx);
    if (lease) {
      return {
        owner: lease.combat ? 'combat' : 'manual',
        state: 'active',
        seq: lease.seq,
        expiresIn: Math.max(0, Math.min(lease.expiresAt - simNow(ctx), lease.combat ? lease.wallExpiresAt - wallNow() : Infinity)),
        fire: lease.fire === true,
        reason: '',
        ...(lease.combat ? { combat: combatStatusView(ctx, lease.combat) } : {}),
      };
    }
    return {
      owner: 'none',
      state: leaseNote.state,
      seq: leaseNote.seq,
      expiresIn: 0,
      fire: false,
      reason: leaseNote.reason,
      ...(combatNote ? { combat: { ...combatNote, defense: { ...combatNote.defense,
        latestCue: combatNote.defense.latestCue ? { ...combatNote.defense.latestCue } : null } } } : {}),
    };
  } catch {
    return { owner: 'none', state: 'idle', seq: 0, expiresIn: 0, fire: false, reason: '' };
  }
}

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
      if (lease?.combat) dropLease(ctx, 'hail');
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
  // Session reset: a fresh boot starts with no lease and no sequence history.
  lease = null;
  leaseSeq = 0;
  combatNote = null;
  noteLease(ctx, 'idle', 0, '');

  // Mouse reticle state (null = not moved yet → treated as screen center).
  let mouseX = null;
  let mouseY = null;
  let fireDown = false;
  const releaseFire = () => {
    fireDown = false;
    if (fireKeyCode) pressed.delete(fireKeyCode);
    input.fireHeld = false;
  };
  physicalFireReleases.set(ctx, releaseFire);
  let hailWasOpen = ctx.flags.hailOpen === true;
  const syncFireOwnership = () => {
    const hailOpen = ctx.flags.hailOpen === true;
    // Hail is a flight-live card: discard the incoming hold, but a fresh
    // flight press must still let the player shoot to break a demand. The
    // card itself already stops mousedown propagation in hail.js.
    if (physicalFireBlocked(ctx) || (hailOpen && !hailWasOpen)) releaseFire();
    hailWasOpen = hailOpen;
  };
  physicalHeld = () => pressed.size > 0 || fireDown;
  combatRelease = () => { mouseX = mouseY = null; pendingAfterburner = false; };

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
    // Explicit bounded combat authority survives focus loss (owner decision,
    // issue #61). Release physical holds without discarding the active pilot.
    if (lease?.combat) { mouseX = mouseY = null; expireCombat(ctx); return; }
    dropLease(ctx, 'blur');
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

  /**
   * Berth transition neutral (issue #65). Clearing ctx.input is not enough:
   * the held-key Set, the reticle pixel position, the fire button, the F
   * double-tap clock, and the pending edge pulses are all private to this
   * closure and would be republished on the very next update() — an off-centre
   * Launch click would re-steer the nose one frame after release, and a key
   * held through the berth would still deliver thrust. Only controls.js can
   * drop them, so dock() and undock() ask for it through the berth hook.
   *
   * The reticle goes to "not moved yet" (null = screen centre), not to the last
   * cursor pixel, so the first frame out of the berth steers nowhere. A real
   * mousemove restores helm control immediately.
   *
   * The throttle setpoint is zeroed at BOTH transitions. §5.1's "persistent
   * setpoint" covers blur, not the berth: a berth that took the ship must not
   * hold a queued thrust command, and on launch a stale setpoint would fly
   * straight past the 5 s lane that was actually verified.
   *
   * input.fullStop is left alone — it is an explicit "hold station" the player
   * commanded, and a launch under full stop simply holds at the cleared
   * release point, which is exactly as collision-safe as creeping out of it.
   */
  const neutralizeForBerth = (mode) => {
    pressed.clear();
    fireDown = false;
    mouseX = null;
    mouseY = null;
    lastFTapAt = -Infinity;
    dropLease(ctx, 'berth');
    pendingAfterburner = pendingTarget = pendingHail = pendingDock = pendingCamera = pendingMatchSpeed = pendingReticleLock = pendingAutomine = pendingEnginePart = false;
    input.steerX = 0;
    input.steerY = 0;
    input.strafeX = 0;
    input.strafeY = 0;
    input.roll = 0;
    input.throttle = 0;
    input.throttleHeld = false;
    input.fireHeld = false;
    input.driftHeld = false;
    input.afterburnerPressed = false;
    input.targetPressed = false;
    input.hailPressed = false;
    input.dockPressed = false;
    input.cameraPressed = false;
    input.matchSpeedPressed = false;
    input.reticleLockPressed = false;
    if (ctx.targets && ctx.targets.reticleScreen) {
      ctx.targets.reticleScreen.x = 0;
      ctx.targets.reticleScreen.y = 0;
    }
  };
  registerBerthInput(ctx, (_ctx, mode) => neutralizeForBerth(mode));

  window.addEventListener('keydown', (e) => {
    // Docked native controls own their keys before flight default prevention.
    // In particular, Space must activate a focused button and arrows must
    // remain available to a select/input. Keyup below still clears old holds.
    if (ctx.flags?.docked === true) {
      const ownsKey = (node) => !!node && (
        /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(node.tagName || '')
        || node.isContentEditable === true
        || !!node.closest?.('input, textarea, select, button, [contenteditable="true"]')
      );
      if (ownsKey(e.target) || ownsKey(document.activeElement)) return;
    }
    const code = decodeKeyCode(e);
    // Space (or any rebound owner) is swallowed iff it is a stored command code.
    if (PREVENT_DEFAULT.has(code)) e.preventDefault();
    if (code === fireKeyCode) {
      syncFireOwnership();
      if (physicalFireBlocked(ctx)) return;
    }
    try {
      // Intentional Settings mutex (RW-002 PR1): skip all TRACKED while open.
      if (typeof settingsOwnsScreen === 'function' && settingsOwnsScreen() === true) return;
    } catch { /* helper miss: keep flight keys */ }
    // Hail responses already own digits 1–9. Deliberate negotiation takes
    // over before their existing menu routing skips the flight handler.
    if (!e.repeat && lease?.combat && ctx.flags.hailOpen && isMenuDigitCode(code)
        && hailDigitsAllowed(ctx) !== false) {
      const n = code.charCodeAt(5) - 48;
      const card = ctx.hailApi?.peek?.();
      if (card?.open && n >= 1 && n <= card.intents?.length) dropLease(ctx, 'player-override');
    }
    if (e.repeat || !TRACKED.has(code)) return;
    // Paused: the system loop is frozen (main.js), so a keydown now must not
    // buffer a gameplay edge or write throttle/weapon state for resume. Pause,
    // settings, and menu listeners are separate window listeners — this handler
    // never stops propagation — and keyup below stays unconditional so a
    // pre-pause hold released during pause is not stuck on resume.
    if (ctx.flags && ctx.flags.paused === true) return;
    if (stationOrHailOwns(ctx) && skipStationHailCode(code)) return;
    if (lease?.combat) dropLease(ctx, 'player-override');
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
    if (lease?.combat) dropLease(ctx, 'player-override');
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('mousedown', (e) => {
    if (lease?.combat) {
      dropLease(ctx, 'player-override');
      if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) {
        mouseX = e.clientX; mouseY = e.clientY;
      }
    }
    if (fireMouseButton >= 0 && e.button === fireMouseButton) {
      syncFireOwnership();
      if (!physicalFireBlocked(ctx)) fireDown = true;
    }
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
      // Discard ownership-crossing holds, rather than merely masking their
      // output: closing the surface requires a fresh press to fire again.
      syncFireOwnership();
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

      // --- Agent control lease (v2). Re-gated every tick; any unsafe
      // transition drops it before the value write, so fire can never stick.
      if (lease) {
        expireCombat(ctx);
      }
      if (lease) {
        if (lease.combat && ctx.agent?.optIn !== true) dropLease(ctx, 'opt-in');
        if (lease?.combat && ctx.player?.destroyed) dropLease(ctx, 'dead');
      }
      if (lease) {
        const now = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
        if (now >= lease.expiresAt) {
          dropLease(ctx, 'expired');
        } else {
          const gate = leaseGateToken(ctx, !!lease.combat);
          if (gate) dropLease(ctx, gate);
        }
        if (lease) {
          const evs = ctx.lastEvents;
          if (Array.isArray(evs)) {
            for (let i = 0; i < evs.length; i++) {
              const typ = evs[i] && evs[i].type;
              if (typ === 'playerDestroyed') { dropLease(ctx, 'dead'); break; }
              if (typ === 'systemLoaded') { dropLease(ctx, 'jump'); break; }
              if (typ === 'docked') { dropLease(ctx, 'docked'); break; }
            }
          }
        }
        // Player emergency input wins: any physical flight key or fire button
        // held this frame drops the lease outright (no silent sharing).
        if (lease && (fireDown || pressed.size > 0)) dropLease(ctx, 'player-override');
      }
      if (lease?.combat) {
        let reason;
        try { reason = combatTick(ctx, lease); } catch { reason = 'no-service'; }
        if (reason) dropLease(ctx, reason);
      }
      if (lease) {
        input.steerX = lease.steerX;
        input.steerY = lease.steerY;
        input.strafeX = lease.strafeX;
        input.strafeY = lease.strafeY;
        input.roll = lease.roll;
        input.fireHeld = lease.fire && ctx.flags.chartOpen !== true;
        input.driftHeld = lease.drift;
        if (lease.combat) {
          input.agentBurnerHeld = lease.burner === true;
          input.afterburnerPressed = lease.burnerEdge === true;
        }
        if (lease.throttle !== null) {
          if (lease.throttle <= 0) {
            // Player-equivalent full stop (double-tap F).
            input.throttle = 0;
            input.fullStop = true;
          } else {
            input.fullStop = false;
            const diff = lease.throttle - input.throttle;
            const step = THROTTLE_RAMP_RATE * dt;
            input.throttle = Math.abs(diff) <= step
              ? lease.throttle
              : input.throttle + Math.sign(diff) * step;
          }
        }
        if (lease.combat) defenseApplied(ctx, lease.combat);
      }
    },
  };
}
