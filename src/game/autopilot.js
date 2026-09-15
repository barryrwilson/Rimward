/**
 * Autopilot command computer. Owns the live autopilot channel.
 * Does not move the mesh, write input, or emit jumpRequested. A failed dock
 * approach asks controls to latch the human double-tap F full-stop command.
 */

import * as THREE from 'three';
import { PHY } from './physics.js';
import { collectBodies } from './collision.js';
import { JUMP, U } from './state.js';
import { applyAvoidBias, appendSunBody } from '../systems/npc.js';
import { resolveNavGatePos, navSystemName } from '../systems/nav-guidance.js';
import { lookupLiveNavHopKind } from '../systems/gate.js';
import { planApPath, throttleForPath, keepRadius, sphereChordHit } from './ap-path.js';
import { berthHeld } from '../systems/overlay-policy.js';
import { collectDockCruiseBodies, dockCruiseExitAim, dockCruiseShouldBrake, dockHoldCanAdvance, dockTrafficClears } from './dock-cruise.js';
import { agentPulse, agentCombatActive, agentClearFullStop, commandFullStop, markAgentHelm } from '../systems/controls.js';
import {
  queueDockAt,
  armPendingDock,
  clearQueuedDock,
  queuedDockDest,
  pendingDockDest,
  pendingDockUntil,
} from './dock-queue.js';
import {
  DOCK_STAGE_ARRIVE,
  DOCK_CRUISE_RANGE,
  DOCK_CRUISE_START_RANGE,
  DOCK_STAGE_SPEED,
  DOCK_SETTLE_RANGE,
  DOCK_REQUEST_RANGE,
  DOCK_REQUEST_SPEED,
  DOCK_STAGE_BRAKE_BUFFER,
  DOCK_FINAL_BRAKE_BUFFER,
  DOCK_BLOCK_SECONDS,
  DOCK_PULSE_TIMEOUT,
  DOCK_ALIGN_IN,
  DOCK_CORRIDOR_ALIGN,
  dockApproachPoints,
  dockShouldBrake,
  dockApproachProgress,
  dockDistance,
} from './dock-approach.js';

export const AP_STEER_BREAK = 0.65;

const CHANNEL_KEYS = Object.freeze([
  'engaged', 'mode', 'phase', 'yaw', 'pitch', 'throttle', 'idle',
  'wantJump', 'wantDock', 'cycleHub', 'reason',
  'startSystem', 'startRange', 'range', 'progress',
]);

export const AP_LINES = Object.freeze({
  match: 'Autopilot refused — MATCH is on.',
  noDest: 'Autopilot refused — plot a destination first.',
  here: 'Autopilot refused — already in the destination system.',
  docked: 'Autopilot refused — docked.',
  jumping: 'Autopilot refused — jump in progress.',
  paused: 'Autopilot refused — game paused.',
  missingHop: 'Autopilot refused — next hop is not on the route.',
  missingLookup: 'Autopilot refused — next gate is not in this system.',
  lookupFail: 'Autopilot cancelled — next gate is not in this system.',
  missingPath: 'Autopilot cancelled — approach path failed.',
  missingHub: 'Autopilot cancelled — hub does not list the next hop.',
  hubWrap: 'Autopilot cancelled — hub spoke cycle failed.',
  cancel: 'Autopilot cancelled.',
  input: 'Autopilot cancelled — manual helm.',
  missingGate: 'Autopilot cancelled — next gate is missing.',
  arrive: 'Arrived — autopilot off.',
  dockApproach: 'Autopilot refused — dock approach is on.',
});

export const DOCK_APPROACH_LINES = Object.freeze({
  docked: 'Dock approach refused — already docked.',
  jumping: 'Dock approach refused — jump in progress.',
  paused: 'Dock approach refused — game paused.',
  held: 'Dock approach refused — berth hold is active.',
  match: 'Dock approach refused — MATCH is on.',
  drift: 'Dock approach refused — drift is active.',
  afterburner: 'Dock approach refused — afterburner is active.',
  autopilot: 'Dock approach refused — autopilot is already on.',
  automine: 'Dock approach refused — automine is on.',
  flee: 'Dock approach refused — flee is active.',
  'no-station': 'Dock approach refused — current station is unavailable.',
  stale: 'Dock approach cancelled — station state became invalid.',
  'lost-station': 'Dock approach cancelled — station was lost.',
  blocked: 'Dock approach cancelled — route is blocked.',
  impact: 'Dock approach cancelled: hull contact.',
  'dock-refused': 'Dock approach cancelled — dock pulse was refused.',
  cancel: 'Dock approach cancelled.',
  input: 'Dock approach cancelled — manual helm.',
  // Issue #183: the queued-behind-a-route intent hands over, or gives up.
  'queue-stale': 'Dock approach cancelled — the destination berth never came up.',
  'queue-handoff': 'Route complete — dock approach taking the helm.',
});

const BREAK_LINE = Object.freeze({
  cancel: AP_LINES.cancel,
  input: AP_LINES.input,
  lookupFail: AP_LINES.lookupFail,
  missingPath: AP_LINES.missingPath,
  missingHub: AP_LINES.missingHub,
  hubWrap: AP_LINES.hubWrap,
  missingGate: AP_LINES.missingGate,
  arrive: AP_LINES.arrive,
});

const _aim = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _local = new THREE.Vector3();
const _inv = new THREE.Quaternion();
const _fwd = new THREE.Vector3();
const _apBodies = { count: 0, items: [] };
const _dockBodies = { count: 0, items: [] };
const _cruiseBodies = { count: 0, items: [] };
const _stageTrafficBodies = { count: 0, items: [] };
const _cruiseExitAim = { x: 0, y: 0, z: 0 };
const _playerLive = {
  role: 'player',
  id: -1,
  object: null,
  ai: { target: null },
  avoidHits: 0,
  state: { classKey: 'light' },
};

let steerArmed = true;
let hubWrap = 0;
let hubHop = '';
let pathHop = '';
let pathSign = 0;
let dockStartRange = 0;
let dockStartSystem = '';
let dockStationName = '';
let dockBestRange = Infinity;
let dockBestHeading = Infinity;
let dockProgressAt = 0;
let dockWatchAt = 0;
let dockTrafficWaitUsed = 0;
let dockPulseAt = 0;
let dockPhase = '';
let dockRecovering = false;
let dockDetourValid = false;
let dockDetourX = 0;
let dockDetourY = 0;
let dockDetourZ = 0;
let dockStationArc = null;

function emptyChannel() {
  return {
    engaged: false,
    mode: '',
    phase: '',
    yaw: 0,
    pitch: 0,
    throttle: 0,
    idle: false,
    wantJump: false,
    wantDock: false,
    cycleHub: false,
    reason: '',
    startSystem: '',
    startRange: 0,
    range: 0,
    progress: 0,
  };
}

function bindChannel(ctx) {
  const cur = ctx.autopilot;
  if (!cur || typeof cur !== 'object' || Array.isArray(cur)) {
    ctx.autopilot = emptyChannel();
    return ctx.autopilot;
  }
  const names = Object.keys(cur);
  for (let i = 0; i < names.length; i++) {
    const k = names[i];
    if (!CHANNEL_KEYS.includes(k)) delete cur[k];
  }
  const base = emptyChannel();
  const keys = Object.keys(base);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!Object.hasOwn(cur, key)) cur[key] = base[key];
  }
  return cur;
}

function navBag(ctx) {
  const world = ctx && ctx.world;
  const nav = world && world.nav;
  if (!nav || typeof nav !== 'object' || Array.isArray(nav)) return null;
  return nav;
}

function flyingFlag(ctx) {
  const nav = navBag(ctx);
  return !!(nav && Object.hasOwn(nav, 'autopilot') && nav.autopilot === true);
}

export function autopilotEngaged(ctx) {
  const ap = ctx && ctx.autopilot;
  return !!((ap && typeof ap === 'object' && ap.engaged === true) || flyingFlag(ctx));
}

function nextHopId(nav) {
  const path = nav && Array.isArray(nav.path) ? nav.path : null;
  if (!path || path.length < 2) return '';
  const hop = path[1];
  return typeof hop === 'string' ? hop : '';
}

function destIdOf(nav) {
  return nav && typeof nav.dest === 'string' ? nav.dest : '';
}

function zeroCmd(ap) {
  ap.yaw = 0;
  ap.pitch = 0;
  ap.throttle = 0;
  ap.idle = false;
  ap.wantJump = false;
  ap.wantDock = false;
  ap.cycleHub = false;
}

function resetApproach() {
  hubWrap = 0;
  hubHop = '';
  pathHop = '';
  pathSign = 0;
}

function resetDockScratch() {
  dockStationArc = null;
  dockStartRange = 0;
  dockStartSystem = '';
  dockStationName = '';
  dockBestRange = Infinity;
  dockBestHeading = Infinity;
  dockProgressAt = 0;
  dockWatchAt = 0;
  dockTrafficWaitUsed = 0;
  dockPulseAt = 0;
  dockPhase = '';
  dockRecovering = false;
  dockDetourValid = false;
  dockDetourX = 0;
  dockDetourY = 0;
  dockDetourZ = 0;
}

function sayLine(ctx, text) {
  if (!text || !ctx || typeof ctx.emit !== 'function') return;
  ctx.emit('commLine', { text });
}

function scanEvents(ctx, type) {
  const a = ctx.lastEvents;
  if (a && a.length) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] && a[i].type === type) return a[i];
    }
  }
  return null;
}

// Issue #184: closing on the berth can graze the station hull at creep speed.
// A row with no damage under this floor is contact, not an impact.
const DOCK_TOUCH_SPEED = 1;

function dockTouchHarmless(e, phase) {
  if (phase !== 'stage' && phase !== 'settle') return false;
  if (e.kind !== 'station' || e.damage !== 0) return false;
  return typeof e.speed === 'number' && Number.isFinite(e.speed)
    && Math.abs(e.speed) < DOCK_TOUCH_SPEED;
}

// Every bodyHit row in the frame is judged, so a harmless kiss batched with a
// real impact can never hide it. Anything malformed still cancels.
function dockImpact(ctx, phase) {
  const a = ctx.lastEvents;
  if (!a || !a.length) return false;
  for (let i = 0; i < a.length; i++) {
    const e = a[i];
    if (!e || e.type !== 'bodyHit') continue;
    if (!dockTouchHarmless(e, phase)) return true;
  }
  return false;
}

function helmSteerLatched(ctx) {
  return (ctx.flags && ctx.flags.chartOpen === true)
    || berthHeld(ctx)
    || (ctx.agent && ctx.agent.optIn === true);
}

function inputBreak(ctx) {
  const input = ctx.input;
  if (!input) return '';
  const held = berthHeld(ctx);
  // Unlatch reticle so leftover hypot cannot cancel on close/RESUME/disable.
  if (helmSteerLatched(ctx)) {
    steerArmed = false;
  } else if (!steerArmed) {
    if (Math.hypot(input.steerX || 0, input.steerY || 0) < AP_STEER_BREAK) {
      steerArmed = true;
    }
  }
  if (held) return '';
  if (input.strafeX || input.strafeY) return 'input';
  if (input.roll) return 'input';
  if (input.throttleHeld) return 'input';
  // A raw agent burner pulse does not claim the helm (#171). Physical
  // burner presses still cancel, and route autopilot keeps its old break.
  if (input.afterburnerPressed
    && !(ctx.autopilot?.mode === 'dock' && input.agentAfterburnerPressed === true)) return 'input';
  if (input.driftHeld) return 'input';
  if (input.fullStop) return 'input';
  if (steerArmed && Math.hypot(input.steerX || 0, input.steerY || 0) >= AP_STEER_BREAK) {
    return 'input';
  }
  return '';
}

export function apRefuseToken(ctx) {
  const nav = navBag(ctx);
  const dest = destIdOf(nav);
  const here = ctx.world && ctx.world.currentSystem;
  if (ctx.autopilot && ctx.autopilot.engaged === true && ctx.autopilot.mode === 'dock') {
    return 'dockApproach';
  }
  if (!nav || !dest || !Array.isArray(nav.path) || nav.path.length < 1) return 'noDest';
  if (dest === here) return 'here';
  if (ctx.flags && ctx.flags.docked) return 'docked';
  if (ctx.gate && ctx.gate.jumping) return 'jumping';
  if (ctx.flags && ctx.flags.paused) return 'paused';
  if (ctx.flags && ctx.flags.matchSpeed) return 'match';
  const hop = nextHopId(nav);
  if (dest !== here && !hop) return 'missingHop';
  if (dest !== here && !resolveNavGatePos(ctx, hop)) return 'missingLookup';
  return '';
}

export function disengage(ctx, reason) {
  if (!ctx) return;
  const ap = bindChannel(ctx);
  // Issue #183: every lease cancellation ends the queued dock intent too —
  // cancelAutopilot, the Escape handback, a manual break, a restore, and the
  // dock controller's own failures. flyTick reads the wish BEFORE it calls
  // the 'arrive' disengage, so the one handoff path is not caught here.
  clearQueuedDock();
  const routeWas = flyingFlag(ctx) || (ap.engaged === true && ap.mode === 'route');
  const modeWas = ap.mode;
  const activeWas = ap.engaged === true || routeWas;
  const nav = navBag(ctx);
  if (nav) nav.autopilot = false;
  ap.engaged = false;
  zeroCmd(ap);
  ap.reason = reason || '';
  if (reason === 'restore') {
    ap.mode = '';
    ap.phase = '';
    ap.startSystem = '';
    ap.startRange = 0;
    ap.range = 0;
    ap.progress = 0;
  } else if (modeWas === 'dock') {
    ap.mode = 'dock';
    ap.phase = reason === 'docked' ? 'complete' : 'failed';
  }
  resetApproach();
  resetDockScratch();
  if (!activeWas) return;
  // Releasing an idle dock channel otherwise restores the manual 30 u/s
  // creep floor (or an old throttle setpoint). Preserve higher helm owners.
  if (modeWas === 'dock' && ['impact', 'blocked', 'stale'].includes(reason)
    && ctx.flags?.hailOpen !== true && !agentCombatActive(ctx) && ctx.input) {
    commandFullStop(ctx);
  }
  if (routeWas && reason && reason !== 'restore') {
    ctx.emit('autopilotDisengaged', { reason: String(reason) });
    const line = Object.hasOwn(BREAK_LINE, reason) ? BREAK_LINE[reason] : '';
    sayLine(ctx, line);
  } else if (modeWas === 'dock' && reason && Object.hasOwn(DOCK_APPROACH_LINES, reason)) {
    sayLine(ctx, DOCK_APPROACH_LINES[reason]);
  }
}

export function tryEngage(ctx) {
  const ap = bindChannel(ctx);
  const token = apRefuseToken(ctx);
  if (token) return token;
  const nav = navBag(ctx);
  const dest = destIdOf(nav);
  nav.autopilot = true;
  ap.engaged = true;
  ap.mode = 'route';
  ap.phase = '';
  ap.reason = '';
  ap.startSystem = '';
  ap.startRange = 0;
  ap.range = 0;
  ap.progress = 0;
  zeroCmd(ap);
  resetApproach();
  resetDockScratch();
  steerArmed = helmSteerLatched(ctx) ? false : true;
  ctx.emit('autopilotEngaged', { dest: String(dest) });
  return '';
}

function finitePose(value) {
  return !!value
    && Number.isFinite(value.x)
    && Number.isFinite(value.y)
    && Number.isFinite(value.z);
}

function currentStationPose(ctx) {
  const system = ctx && ctx.world && ctx.world.currentSystem;
  if (typeof system !== 'string' || !system) return null;
  const live = ctx.station;
  const pos = live && live.position;
  const authored = ctx.systems && ctx.systems[system] && ctx.systems[system].station;
  const arr = authored && authored.position;
  if (!finitePose(pos) || !Array.isArray(arr) || arr.length < 3) return null;
  if (!Number.isFinite(arr[0]) || !Number.isFinite(arr[1]) || !Number.isFinite(arr[2])) return null;
  if (Math.hypot(pos.x - arr[0], pos.y - arr[1], pos.z - arr[2]) > 0.01) return null;
  return {
    system,
    name: typeof live.name === 'string' ? live.name : '',
    x: pos.x,
    y: pos.y,
    z: pos.z,
  };
}

export function dockApproachRefuseToken(ctx) {
  if (!ctx) return 'stale';
  if (ctx.flags && ctx.flags.docked === true) return 'docked';
  if (!ctx.ship || !ctx.ship.object || !finitePose(ctx.ship.object.position)) return 'stale';
  if (ctx.flags && ctx.flags.paused === true) return 'paused';
  if (berthHeld(ctx)) return 'held';
  if (ctx.gate && ctx.gate.jumping === true) return 'jumping';
  if (ctx.flags && ctx.flags.matchSpeed === true) return 'match';
  if (ctx.ship.driftActive === true) return 'drift';
  // The ship owner retires an existing raw burn on explicit dock takeover.
  // Combat and flee owners still refuse below.
  if (autopilotEngaged(ctx)) return 'autopilot';
  if (ctx.automine && ctx.automine.engaged === true) return 'automine';
  if (ctx.flee && ctx.flee.engaged === true) return 'flee';
  if (!currentStationPose(ctx)) return 'no-station';
  return '';
}

export function tryApproachDock(ctx) {
  const ap = bindChannel(ctx);
  const token = dockApproachRefuseToken(ctx);
  if (token) return token;
  const station = currentStationPose(ctx);
  const points = dockApproachPoints(station);
  if (!points) return 'stale';
  const range = dockDistance(ctx.ship.object.position, station);
  if (range === null) return 'stale';
  const nav = navBag(ctx);
  if (nav) nav.autopilot = false;
  ap.engaged = true;
  ap.mode = 'dock';
  ap.phase = ctx.station.inZone === true ? 'settle'
    : dockDistance(ctx.ship.object.position, points.stage) > DOCK_CRUISE_START_RANGE
      ? 'cruise' : 'stage';
  ap.reason = '';
  ap.startSystem = station.system;
  ap.startRange = range;
  ap.range = range;
  ap.progress = 0;
  zeroCmd(ap);
  ap.idle = true;
  dockStartRange = range;
  dockStationArc = null;
  dockStartSystem = station.system;
  dockStationName = station.name;
  dockBestRange = Infinity;
  dockBestHeading = Infinity;
  dockProgressAt = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  dockWatchAt = dockProgressAt;
  dockTrafficWaitUsed = 0;
  dockPulseAt = 0;
  dockPhase = ap.phase;
  resetApproach();
  steerArmed = helmSteerLatched(ctx) ? false : true;
  // An accepted retry owns propulsion again. Refused attempts above must
  // leave the cancellation stop latched, including direct helper callers.
  agentClearFullStop(ctx);
  return '';
}

/**
 * Issue #183 — the queued dock intent.
 *
 * `approachDock` used to refuse 'autopilot' while a route lease flew the
 * gates, so an agent could not ask for the berth before it arrived. The wish
 * below is destination-bound and session-only: it survives every intermediate
 * jump, and flyTick hands the helm to the SAME cruise/stage/settle controller
 * once the route's final system is loaded.
 */

// Sim seconds the handoff may spend waiting for the destination berth to come
// up after arrival. A station that never appears cancels rather than coasts.
const DOCK_QUEUE_GRACE = 20;

// Tokens the handoff re-tries: each one clears on its own within a moment of
// a fresh arrival. Anything else is a hard refusal and drops the wish.
const DOCK_QUEUE_RETRY = Object.freeze(['jumping', 'held', 'paused', 'stale', 'no-station']);

function authoredStation(ctx, id) {
  if (typeof id !== 'string' || !id) return null;
  const bank = ctx && ctx.systems;
  if (!bank || typeof bank !== 'object' || !Object.hasOwn(bank, id)) return null;
  const def = bank[id];
  const station = def && typeof def === 'object' ? def.station : null;
  const arr = station && station.position;
  if (!Array.isArray(arr) || arr.length < 3) return null;
  for (let i = 0; i < 3; i++) if (!Number.isFinite(arr[i])) return null;
  return station;
}

/**
 * The live station is the destination's own, rebuilt. currentStationPose
 * already rejects a pose that disagrees with the authored position, but two
 * systems may sit their stations at the same coordinates, so the rebuilt
 * identity is checked as well: a stale prior station can never be docked at.
 */
function destStationReady(ctx, dest) {
  if (!ctx || !ctx.world || ctx.world.currentSystem !== dest) return false;
  const station = authoredStation(ctx, dest);
  if (!station) return false;
  const pose = currentStationPose(ctx);
  if (!pose || pose.system !== dest) return false;
  const name = typeof station.name === 'string' ? station.name : '';
  return pose.name === name;
}

/**
 * Queue a dock approach behind the engaged route lease. Returns '' when the
 * wish is armed, or the refusal token to answer with. Everything that is not
 * a live multi-hop route lease answers 'autopilot' — the refusal this call
 * already gave before issue #183 — so an invalid request fails closed.
 */
export function queueApproachDock(ctx) {
  if (!ctx) return 'stale';
  const nav = navBag(ctx);
  const ap = ctx.autopilot;
  const here = ctx.world && ctx.world.currentSystem;
  const dest = destIdOf(nav);
  if (!flyingFlag(ctx)) return 'autopilot';
  if (!ap || typeof ap !== 'object' || ap.mode === 'dock') return 'autopilot';
  if (!dest || !here || dest === here) return 'autopilot';
  if (!Array.isArray(nav.path) || nav.path.length < 2) return 'autopilot';
  if (nav.path[nav.path.length - 1] !== dest) return 'autopilot';
  if (nav.status !== 'plotted') return 'autopilot';
  // The route helm owns the ship, so 'autopilot' is the expected token here;
  // every other refusal (docked, paused, held, jumping, match, drift, a bad
  // hull pose) still refuses, and the two helms the token order hides are
  // checked by hand.
  const token = dockApproachRefuseToken(ctx);
  if (token && token !== 'autopilot') return token;
  if (ctx.automine && ctx.automine.engaged === true) return 'automine';
  if (ctx.flee && ctx.flee.engaged === true) return 'flee';
  if (!authoredStation(ctx, dest)) return 'no-station';
  queueDockAt(dest);
  return '';
}

/**
 * Open the handoff window. The berth is normally already rebuilt when this
 * runs (station.js consumes the same systemLoaded ahead of autopilot in the
 * system order), so the grace window is only for an arrival the destination
 * station is not up for yet — a jump fade still running, for instance.
 */
function armQueuedDock(ctx, dest) {
  const now = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  armPendingDock(dest, now + DOCK_QUEUE_GRACE);
}

/**
 * One frame of the waiting handoff, run from the autopilot update while no
 * helm owns the ship.
 *
 * Only flyTick's final arrival opens this window. A queued wish NEVER arms
 * itself off the live system id: between legs the pilot may be flying by
 * hand, and a wish that armed there would steal raw propulsion from a helm
 * nobody handed it. Cancellation clears the window with the wish, so nothing
 * can revive it either.
 */
function queuedDockTick(ctx) {
  const ap = ctx.autopilot;
  if ((ap && ap.engaged === true) || flyingFlag(ctx)) return;
  runPendingDock(ctx);
}

/**
 * Success is the ordinary tryApproachDock takeover; the wish is consumed
 * either way, so it can never resurrect on a later route, even one plotted to
 * the same destination. A berth that never comes up cancels at the deadline
 * rather than leaving the hull coasting on an open intent.
 */
function runPendingDock(ctx) {
  const dest = pendingDockDest();
  if (!dest) return;
  if (!ctx.world || ctx.world.currentSystem !== dest) {
    clearQueuedDock();
    return;
  }
  const brk = inputBreak(ctx);
  if (brk) {
    clearQueuedDock();
    sayLine(ctx, DOCK_APPROACH_LINES.input);
    return;
  }
  const ready = destStationReady(ctx, dest);
  const token = ready ? tryApproachDock(ctx) : 'no-station';
  if (!token) {
    clearQueuedDock();
    // The route lease was the agent's; the dock helm it asked for inherits it.
    markAgentHelm(ctx);
    sayLine(ctx, DOCK_APPROACH_LINES['queue-handoff']);
    return;
  }
  if (!DOCK_QUEUE_RETRY.includes(token)) {
    clearQueuedDock();
    sayLine(ctx, dockApproachLine(token));
    return;
  }
  const now = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  if (now >= pendingDockUntil()) {
    clearQueuedDock();
    sayLine(ctx, DOCK_APPROACH_LINES['queue-stale']);
  }
}

export function guardAutopilotSpace(e) {
  if (!e || e.code !== 'Space') return;
  e.preventDefault();
}

export function apLine(token) {
  if (!token) return '';
  if (Object.hasOwn(AP_LINES, token)) return AP_LINES[token];
  return '';
}

export function dockApproachLine(token) {
  if (!token) return '';
  if (Object.hasOwn(DOCK_APPROACH_LINES, token)) return DOCK_APPROACH_LINES[token];
  return '';
}

function aimAtGate(ctx, ap, hop, dt) {
  const obj = ctx.ship && ctx.ship.object;
  const cur = ctx.world && ctx.world.currentSystem;
  const hopKind = lookupLiveNavHopKind(hop, cur);
  const pos = resolveNavGatePos(ctx, hop);
  if (!pos) {
    disengage(ctx, 'lookupFail');
    return;
  }
  if (!obj) {
    zeroCmd(ap);
    return;
  }
  if (ctx.gate && ctx.gate.jumping) {
    zeroCmd(ap);
    return;
  }

  const p = obj.position;
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)
    || !Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) {
    disengage(ctx, 'lookupFail');
    return;
  }

  _playerLive.object = obj;
  _playerLive.avoidHits = 0;
  collectBodies(ctx, _apBodies);
  appendSunBody(ctx, _apBodies);
  _fwd.set(0, 0, -1).applyQuaternion(obj.quaternion);
  const classKey = (ctx.player && ctx.player.classKey) || 'light';
  const speed = ctx.ship && Number.isFinite(ctx.ship.speed) ? ctx.ship.speed : 0;
  const planned = planApPath({
    px: p.x, py: p.y, pz: p.z,
    gx: pos.x, gy: pos.y, gz: pos.z,
    hx: _fwd.x, hy: _fwd.y, hz: _fwd.z,
    bodies: _apBodies,
    shipR: PHY.PLAYER_RADIUS,
    classKey,
    speed,
    zone: JUMP.zone,
    sideHint: hop === pathHop ? pathSign : 0,
  });
  if (!planned.ok || !Number.isFinite(planned.ax) || !Number.isFinite(planned.ay) || !Number.isFinite(planned.az)) {
    disengage(ctx, 'missingPath');
    return;
  }
  if (planned.hold === 'detour' || planned.hold === 'widen') {
    pathHop = hop;
    if (planned.sign) pathSign = planned.sign;
  } else {
    pathSign = 0;
    pathHop = hop;
  }
  _aim.set(planned.ax, planned.ay, planned.az);
  applyAvoidBias(_playerLive, _aim, _aim, _apBodies);
  if (planned.hold === 'detour') {
    const n = _apBodies.count;
    for (let i = 0; i < n; i++) {
      const body = _apBodies.items[i];
      const keep = keepRadius(body, PHY.PLAYER_RADIUS);
      if (!(keep > 0)) continue;
      const hit = sphereChordHit(
        p.x, p.y, p.z, _aim.x, _aim.y, _aim.z,
        body.x, body.y, body.z, keep,
      );
      if (hit.hit && !hit.inside) {
        _aim.set(planned.ax, planned.ay, planned.az);
        break;
      }
    }
  }

  const distGate = planned.distGate;

  _inv.copy(obj.quaternion).invert();
  _dir.copy(_aim).sub(obj.position);
  _local.copy(_dir).applyQuaternion(_inv);
  let yawErr = Math.atan2(_local.x, -_local.z);
  if (Math.abs(yawErr) > 3.05) yawErr = pathSign === -1 ? -Math.PI : Math.PI;
  const pitchErr = Math.atan2(_local.y, Math.hypot(_local.x, _local.z) || 1e-8);
  const yaw = Math.max(-1, Math.min(1, yawErr * 1.35));
  const pitch = Math.max(-1, Math.min(1, pitchErr * 1.35));
  const len = _dir.length() || 1;
  const align = Math.max(0, _fwd.dot(_dir) / len);
  let throttle = throttleForPath(
    planned.hold, planned.intercept, align, distGate, planned.turnR,
  );
  if (ctx.gate && ctx.gate.inZone && (ctx.gate.nearTo === hop || ctx.gate.nearHub)) {
    throttle = Math.min(throttle, 0.35);
  }
  ap.yaw = yaw;
  ap.pitch = pitch;
  ap.throttle = Math.max(0, Math.min(1, throttle));

  const inZone = !!(ctx.gate && ctx.gate.inZone);
  const nearTo = ctx.gate ? ctx.gate.nearTo : null;
  const docked = !!(ctx.flags && ctx.flags.docked);
  ap.wantJump = !!(inZone && !docked && nearTo === hop);

  if (inZone && ctx.gate.nearHub && nearTo !== hop) {
    if (hopKind !== 'hub') {
      ap.cycleHub = false;
    } else if (!nearTo) {
      ap.cycleHub = false;
    } else {
      const sys = ctx.systems && ctx.world && ctx.systems[ctx.world.currentSystem];
      const routes = sys && sys.hub && sys.hub.routes;
      let listed = false;
      if (Array.isArray(routes)) {
        for (let i = 0; i < routes.length; i++) {
          if (routes[i] === hop) { listed = true; break; }
        }
      }
      if (!listed) {
        disengage(ctx, 'missingHub');
        return;
      }
      if (hop !== hubHop) {
        hubHop = hop;
        hubWrap = 0;
      }
      const cap = ctx.gate.nearRouteCount || 0;
      if (hubWrap > cap) {
        disengage(ctx, 'hubWrap');
        return;
      }
      ap.cycleHub = true;
      hubWrap += 1;
    }
  } else {
    ap.cycleHub = false;
    if (!inZone || !ctx.gate.nearHub) {
      hubWrap = 0;
      hubHop = '';
    }
  }
  void dt;
}

function copyDockBodies(skipStation) {
  let n = 0;
  const count = _apBodies.count || 0;
  for (let i = 0; i < count; i++) {
    const body = _apBodies.items[i];
    if (!body || (skipStation && body.kind === 'station')) continue;
    _dockBodies.items[n] = body;
    n += 1;
  }
  _dockBodies.count = n;
  return _dockBodies;
}

function bodyBlocksStageChord(p, stage, kind) {
  const count = _apBodies.count || 0;
  for (let i = 0; i < count; i++) {
    const body = _apBodies.items[i];
    if (!body || (kind && body.kind !== kind)) continue;
    const keep = keepRadius(body, PHY.PLAYER_RADIUS);
    if (!(keep > 0)) continue;
    const hit = sphereChordHit(
      p.x, p.y, p.z, stage.x, stage.y, stage.z,
      body.x, body.y, body.z, keep,
    );
    // Already inside the conservative station keep ring: a straight
    // outward chord is safe. Latching its tangent makes idle-turn aim
    // oscillate against local station avoidance instead of leaving the pad.
    if (body.kind === 'station' && hit.inside
      && (p.x - body.x) * (stage.x - p.x)
        + (p.y - body.y) * (stage.y - p.y)
        + (p.z - body.z) * (stage.z - p.z) >= 0) continue;
    if (hit.hit) return true;
  }
  return false;
}

function aimDockShip(obj, ap, target) {
  if (!obj || !finitePose(obj.position) || !obj.quaternion || !finitePose(target)) return null;
  const q = obj.quaternion;
  if (!Number.isFinite(q.x) || !Number.isFinite(q.y)
    || !Number.isFinite(q.z) || !Number.isFinite(q.w)) return null;
  _fwd.set(0, 0, -1).applyQuaternion(q);
  _dir.copy(target).sub(obj.position);
  const len = _dir.length();
  if (!Number.isFinite(len) || len <= 1e-8) {
    ap.yaw = 0;
    ap.pitch = 0;
    return { align: 1, yawAbs: 0 };
  }
  _inv.copy(q).invert();
  _local.copy(_dir).applyQuaternion(_inv);
  const yawErr = Math.atan2(_local.x, -_local.z);
  const pitchErr = Math.atan2(_local.y, Math.hypot(_local.x, _local.z) || 1e-8);
  if (!Number.isFinite(yawErr) || !Number.isFinite(pitchErr)) return null;
  ap.yaw = Math.max(-1, Math.min(1, yawErr * 1.35));
  ap.pitch = Math.max(-1, Math.min(1, pitchErr * 1.35));
  return {
    align: Math.max(0, Math.min(1, _fwd.dot(_dir) / len)),
    yawAbs: Math.abs(yawErr),
  };
}

function resetDockWatch(ctx, ap) {
  dockPhase = ap.phase;
  dockBestRange = Infinity;
  dockBestHeading = Infinity;
  dockProgressAt = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  dockWatchAt = dockProgressAt;
  dockTrafficWaitUsed = 0;
}

// A committed station tangent can increase literal stage range while its
// direct chord clears the keep sphere. Credit only new geometric clearance,
// using a fixed station/goal for the engagement. The entire [0, keep] interval
// buys at most one watchdog window; loops and new tangent choices cannot refill it.
function dockStationArcCredit(p, goal) {
  if (!dockDetourValid || dockRecovering) return 0;
  let body = null;
  for (let i = 0; i < _apBodies.count; i++) {
    if (_apBodies.items[i].kind === 'station') { body = _apBodies.items[i]; break; }
  }
  if (!body) return 0;
  const keep = keepRadius(body, PHY.PLAYER_RADIUS);
  const geometry = [body.x, body.y, body.z, keep, goal.x, goal.y, goal.z];
  if (!(keep > 0) || !geometry.every(Number.isFinite)) return 0;
  if (dockStationArc && geometry.some((n, i) => n !== dockStationArc.geometry[i])) return 0;
  const dx = goal.x - p.x, dy = goal.y - p.y, dz = goal.z - p.z;
  const lengthSq = dx * dx + dy * dy + dz * dz;
  if (!(lengthSq > 0) || !Number.isFinite(lengthSq)) return 0;
  const along = Math.max(0, Math.min(1,
    ((body.x - p.x) * dx + (body.y - p.y) * dy + (body.z - p.z) * dz) / lengthSq));
  const clearance = Math.min(keep, Math.hypot(p.x + along * dx - body.x,
    p.y + along * dy - body.y, p.z + along * dz - body.z));
  if (!Number.isFinite(clearance)) return 0;
  if (!dockStationArc) { dockStationArc = { geometry, best: clearance }; return 0; }
  if (clearance < dockStationArc.best + 1) return 0;
  const gain = clearance - dockStationArc.best;
  dockStationArc.best = clearance;
  const hit = sphereChordHit(p.x, p.y, p.z, dockDetourX, dockDetourY, dockDetourZ,
    body.x, body.y, body.z, keep);
  const outward = (p.x - body.x) * (dockDetourX - p.x)
    + (p.y - body.y) * (dockDetourY - p.y) + (p.z - body.z) * (dockDetourZ - p.z) >= 0;
  if (hit.hit && (!hit.inside || !outward)) return 0;
  return DOCK_BLOCK_SECONDS * gain / keep;
}

function dockMakingProgress(ctx, ap, range, yawAbs, trafficYield = false, arcCredit = 0) {
  const now = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  if (dockPhase !== ap.phase) resetDockWatch(ctx, ap);
  const elapsed = Math.max(0, Math.min(0.25, now - dockWatchAt));
  dockWatchAt = now;
  let improved = false;
  if (Number.isFinite(range) && range <= dockBestRange - 1) {
    dockBestRange = range;
    dockTrafficWaitUsed = 0;
    improved = true;
  }
  if (Number.isFinite(yawAbs) && yawAbs <= dockBestHeading - 0.05) {
    dockBestHeading = yawAbs;
    improved = true;
  }
  if (improved) dockProgressAt = now;
  else if (ap.phase === 'stage' && Number.isFinite(arcCredit) && arcCredit > 0) {
    dockProgressAt += Math.min(arcCredit, Math.max(0, now - dockProgressAt));
  }
  // Give verified moving traffic at most one watchdog window of waiting
  // credit per episode without distance progress. New blockers or changing
  // headings cannot refill it; a continuously blocked path still times out.
  if (trafficYield && ap.idle && ap.phase === 'stage' && !improved) {
    const credit = Math.min(elapsed, Math.max(0, DOCK_BLOCK_SECONDS - dockTrafficWaitUsed));
    dockTrafficWaitUsed += credit;
    dockProgressAt += credit;
  }
  if (now - dockProgressAt < DOCK_BLOCK_SECONDS) return true;
  disengage(ctx, 'blocked');
  return false;
}

function dockPoseStillValid(ctx, ap) {
  if (scanEvents(ctx, 'systemLoaded')) {
    disengage(ctx, 'lost-station');
    return null;
  }
  const current = ctx.world && ctx.world.currentSystem;
  if (!current || current !== dockStartSystem || current !== ap.startSystem) {
    disengage(ctx, 'lost-station');
    return null;
  }
  const station = currentStationPose(ctx);
  if (!station) {
    disengage(ctx, 'stale');
    return null;
  }
  if (dockStationName && station.name !== dockStationName) {
    disengage(ctx, 'lost-station');
    return null;
  }
  const obj = ctx.ship && ctx.ship.object;
  if (!obj || !finitePose(obj.position)) {
    disengage(ctx, 'stale');
    return null;
  }
  return { station, obj };
}

function dockTick(ctx) {
  const ap = bindChannel(ctx);
  if (!ap.engaged || ap.mode !== 'dock') return;

  if (ctx.flags && ctx.flags.docked === true) {
    disengage(ctx, 'docked');
    return;
  }
  if (dockImpact(ctx, ap.phase)) {
    disengage(ctx, 'impact');
    return;
  }
  const brk = inputBreak(ctx);
  if (brk) {
    disengage(ctx, brk);
    return;
  }
  if ((ctx.flags && ctx.flags.paused) || berthHeld(ctx)) {
    zeroCmd(ap);
    ap.idle = true;
    return;
  }
  if (ctx.gate && ctx.gate.jumping === true) {
    disengage(ctx, 'jumping');
    return;
  }

  const live = dockPoseStillValid(ctx, ap);
  if (!live) return;
  const points = dockApproachPoints(live.station);
  const range = dockDistance(live.obj.position, live.station);
  if (!points || range === null) {
    disengage(ctx, 'stale');
    return;
  }
  const speed = ctx.ship && Number.isFinite(ctx.ship.speed) ? Math.max(0, ctx.ship.speed) : null;
  const acceleration = ctx.config && ctx.config.ship && ctx.config.ship.acceleration;
  if (speed === null || !Number.isFinite(acceleration) || acceleration <= 0) {
    disengage(ctx, 'stale');
    return;
  }
  ap.range = range;
  ap.progress = dockApproachProgress(dockStartRange, range, ap.progress);

  if (ap.phase === 'docking') {
    zeroCmd(ap);
    ap.idle = true;
    const now = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
    if (now - dockPulseAt >= DOCK_PULSE_TIMEOUT) disengage(ctx, 'dock-refused');
    return;
  }

  _playerLive.object = live.obj;
  _playerLive.avoidHits = 0;
  collectBodies(ctx, _apBodies);
  appendSunBody(ctx, _apBodies);
  _fwd.set(0, 0, -1).applyQuaternion(live.obj.quaternion);
  const p = live.obj.position;
  const classKey = (ctx.player && ctx.player.classKey) || 'light';

  if (ap.phase === 'stage' || ap.phase === 'cruise') {
    const stageTransit = ap.phase === 'stage';
    const plannedSpeed = stageTransit ? ctx.config.ship.creep : ctx.config.ship.maxSpeed;
    const planningBodies = collectDockCruiseBodies(_apBodies, ctx.ships,
      Math.max(speed, Number.isFinite(plannedSpeed) ? plannedSpeed : speed),
      acceleration, _cruiseBodies, ctx.asteroids?.list, ctx.world?.time, stageTransit);
    if (!planningBodies) { disengage(ctx, 'stale'); return; }
    const planned = planApPath({
      px: p.x, py: p.y, pz: p.z,
      gx: points.stage.x, gy: points.stage.y, gz: points.stage.z,
      hx: _fwd.x, hy: _fwd.y, hz: _fwd.z,
      // Preserve the station/sun tangent; moving traffic is planned against
      // that chosen transit segment below, never cached as a station detour.
      bodies: stageTransit ? _apBodies : planningBodies,
      shipR: PHY.PLAYER_RADIUS,
      classKey,
      speed,
      zone: DOCK_STAGE_ARRIVE,
      sideHint: pathSign,
    });
    if (!planned.ok || !Number.isFinite(planned.ax)
      || !Number.isFinite(planned.ay) || !Number.isFinite(planned.az)) {
      disengage(ctx, 'blocked');
      return;
    }
    pathSign = planned.sign || pathSign;
    const stationBlocked = bodyBlocksStageChord(p, points.stage, 'station');
    if (planned.hold === 'detour' && stationBlocked && !dockDetourValid && ap.phase !== 'cruise') {
      dockDetourValid = true;
      dockDetourX = planned.ax;
      dockDetourY = planned.ay;
      dockDetourZ = planned.az;
    }
    if (!stationBlocked) dockDetourValid = false;
    const routeDetour = planned.hold === 'detour'
      && (ap.phase === 'cruise' || bodyBlocksStageChord(p, points.stage));
    let detouring = dockDetourValid || routeDetour;
    if (dockRecovering) {
      detouring = false;
      _aim.copy(points.stage);
    } else if (dockDetourValid) {
      _aim.set(dockDetourX, dockDetourY, dockDetourZ);
    } else if (detouring) {
      _aim.set(planned.ax, planned.ay, planned.az);
    } else {
      // Ignore route-AP widen. From Freehold spawn the widen waypoint sits
      // toward the pad, so a still-turning hull dives into the cylinder.
      _aim.copy(points.stage);
    }
    // A far-side detour keeps station lookahead and stays at creep so hull
    // inertia cannot cut the tangent. Once the stage chord is direct, omit
    // station lookahead so it does not fight the planner's already-safe line.
    const stageBodies = detouring ? _apBodies : copyDockBodies(true);
    applyAvoidBias(_playerLive, _aim, _aim, stageBodies);
    // Avoidance is a local bias, not permission to cut the planner's safe
    // tangent through the sun (issue #172) or another blocking body.
    if (routeDetour) {
      for (let i = 0; i < planningBodies.count; i++) {
        const body = planningBodies.items[i];
        const keep = keepRadius(body, PHY.PLAYER_RADIUS);
        if (!(keep > 0)) continue;
        const hit = sphereChordHit(p.x, p.y, p.z, _aim.x, _aim.y, _aim.z,
          body.x, body.y, body.z, keep);
        if (hit.hit && !hit.inside) {
          if (dockDetourValid) _aim.set(dockDetourX, dockDetourY, dockDetourZ);
          else _aim.set(planned.ax, planned.ay, planned.az);
          break;
        }
      }
    }
    let cruiseExitBlocked = false;
    if (!stageTransit) {
      const exit = dockCruiseExitAim(p, _aim, planningBodies, _cruiseExitAim);
      if (exit === 'clear') _aim.set(_cruiseExitAim.x, _cruiseExitAim.y, _cruiseExitAim.z);
      else if (exit === 'blocked') cruiseExitBlocked = true;
    }
    let trafficDetour = false;
    let trafficBlocked = false;
    let trafficYield = false;
    if (stageTransit) {
      let count = 0;
      for (let i = 0; i < planningBodies.count; i++) {
        const body = planningBodies.items[i];
        if (body.kind === 'cruise-obstacle') _stageTrafficBodies.items[count++] = body;
      }
      _stageTrafficBodies.count = count;
      const transit = planApPath({
        px: p.x, py: p.y, pz: p.z, gx: _aim.x, gy: _aim.y, gz: _aim.z,
        hx: _fwd.x, hy: _fwd.y, hz: _fwd.z,
        bodies: _stageTrafficBodies, shipR: PHY.PLAYER_RADIUS,
        classKey, speed, zone: DOCK_STAGE_ARRIVE, sideHint: pathSign,
      });
      if (!transit.ok) { disengage(ctx, 'blocked'); return; }
      if (transit.hold === 'detour') {
        trafficYield = dockTrafficClears(p, _aim, planningBodies, DOCK_BLOCK_SECONDS);
        // A traffic sidestep must not cut the station or sun tangent. Wait
        // for its moving obstruction if neither protected chord is clear.
        for (let i = 0; i < _apBodies.count; i++) {
          const body = _apBodies.items[i];
          const keep = keepRadius(body, PHY.PLAYER_RADIUS);
          if (!(keep > 0)) continue;
          const hit = sphereChordHit(p.x, p.y, p.z, transit.ax, transit.ay, transit.az,
            body.x, body.y, body.z, keep);
          const outward = (p.x - body.x) * (transit.ax - p.x)
            + (p.y - body.y) * (transit.ay - p.y)
            + (p.z - body.z) * (transit.az - p.z) >= 0;
          if (hit.hit && (!hit.inside || !outward)) { trafficBlocked = true; break; }
        }
        if (!trafficBlocked) {
          _aim.set(transit.ax, transit.ay, transit.az);
          trafficDetour = true;
        }
      }
    }
    const stageDistance = dockDistance(p, points.stage);
    if (stageDistance === null) {
      disengage(ctx, 'stale');
      return;
    }
    if (stageDistance <= DOCK_STAGE_ARRIVE && speed <= DOCK_STAGE_SPEED) {
      ap.phase = 'corridor';
      resetDockWatch(ctx, ap);
      zeroCmd(ap);
      ap.idle = true;
      return;
    }
    const steer = aimDockShip(live.obj, ap, _aim);
    if (!steer) {
      disengage(ctx, 'stale');
      return;
    }
    const braking = trafficBlocked || cruiseExitBlocked || (stageTransit
      && dockCruiseShouldBrake(p, ctx.ship.velocity, acceleration, planningBodies)) || dockShouldBrake(
      stageDistance, speed, acceleration, DOCK_STAGE_BRAKE_BUFFER,
    );
    // Cruise is the far leg of the same dock helm. Brake early enough for
    // the existing slow stage and keep nearby station tangents at safe creep.
    const cruise = ap.phase === 'cruise' && stageDistance > DOCK_CRUISE_RANGE
      && (!stationBlocked || range > DOCK_CRUISE_START_RANGE) && !dockRecovering;
    const phase = cruise ? 'cruise' : 'stage';
    if (ap.phase !== phase) { ap.phase = phase; resetDockWatch(ctx, ap); }
    if (cruise) {
      ap.idle = braking || steer.align < 0.97
        || dockCruiseShouldBrake(p, ctx.ship.velocity, acceleration, planningBodies);
      const escapeHold = ap.idle && !ctx.input.fullStop && dockHoldCanAdvance(p, ctx.ship.velocity, _fwd,
        acceleration, ctx.config.ship.creep * (ctx.bio?.speedFactor ?? 1), ctx.config.ship.damping, planningBodies);
      if (escapeHold) { ap.idle = false; ap.yaw = 0; ap.pitch = 0; }
      ap.throttle = ap.idle || escapeHold ? 0 : throttleForPath(
        planned.hold, planned.intercept, steer.align, stageDistance, planned.turnR,
      );
      const cruiseRemaining = stationBlocked
        ? range - DOCK_CRUISE_START_RANGE : stageDistance - DOCK_CRUISE_RANGE;
      if (dockShouldBrake(cruiseRemaining, speed, acceleration,
        DOCK_STAGE_BRAKE_BUFFER)) ap.throttle = 0;
      if (!dockMakingProgress(ctx, ap, stageDistance, steer.yawAbs)) return;
      return;
    }
    const aligned = steer.align >= 0.97;
    // A far-side detour must keep creep, or the hull stops on the keep ring
    // and the 10 s blocked watch fires before it reaches +X. A clear chord
    // from live spawn must idle-turn first: spawn faces the station, and
    // thrusting off-axis dives past the pad at 30 u/s.
    const needTurn = !aligned && (!detouring || trafficDetour);
    const stageOvershot = !dockRecovering
      && !detouring
      && Number.isFinite(dockBestRange)
      && stageDistance > dockBestRange + 2
      && !aligned;
    const now = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
    if (stageOvershot && !dockRecovering) {
      dockRecovering = true;
      dockProgressAt = now;
      dockBestHeading = Infinity;
    }
    // The near dock stage uses creep. Throttle stays 0: idle is a
    // full stop, and aligned non-idle is the 30 u/s creep floor.
    if (dockRecovering) {
      // Recovery stays on the literal stage point through arrival. Leaving
      // recovery as soon as the nose aligns re-enters planner widen at rest
      // and can oscillate forever between two nearby headings.
      ap.idle = braking || !aligned;
      ap.throttle = 0;
    } else {
      ap.idle = braking || stageOvershot || needTurn;
      ap.throttle = 0;
    }
    if (ap.idle && !ctx.input.fullStop && dockHoldCanAdvance(p, ctx.ship.velocity, _fwd,
      acceleration, ctx.config.ship.creep * (ctx.bio?.speedFactor ?? 1), ctx.config.ship.damping, planningBodies)) {
      ap.idle = false; ap.yaw = 0; ap.pitch = 0;
    }
    const arcCredit = dockStationArcCredit(p, points.stage);
    if (!dockMakingProgress(ctx, ap, stageDistance, steer.yawAbs, trafficYield, arcCredit)) return;
    return;
  }

  if (ap.phase !== 'corridor' && ap.phase !== 'settle') {
    disengage(ctx, 'stale');
    return;
  }
  if (ctx.station && ctx.station.inZone === true) ap.phase = 'settle';
  const bodies = copyDockBodies(true);
  const planned = planApPath({
    px: p.x, py: p.y, pz: p.z,
    gx: points.settle.x, gy: points.settle.y, gz: points.settle.z,
    hx: _fwd.x, hy: _fwd.y, hz: _fwd.z,
    bodies,
    shipR: PHY.PLAYER_RADIUS,
    classKey,
    speed,
    zone: DOCK_REQUEST_RANGE - DOCK_SETTLE_RANGE,
    sideHint: 0,
  });
  if (!planned.ok || !Number.isFinite(planned.ax)
    || !Number.isFinite(planned.ay) || !Number.isFinite(planned.az)
    || planned.hold === 'detour') {
    disengage(ctx, 'blocked');
    return;
  }
  _aim.copy(points.settle);
  applyAvoidBias(_playerLive, _aim, _aim, bodies);
  const steer = aimDockShip(live.obj, ap, _aim);
  const settleDistance = dockDistance(p, points.settle);
  if (!steer || settleDistance === null) {
    disengage(ctx, 'stale');
    return;
  }

  if (ap.phase === 'settle'
    && ctx.station.inZone === true
    && range <= DOCK_REQUEST_RANGE
    && speed <= DOCK_REQUEST_SPEED
    && steer.align >= DOCK_ALIGN_IN) {
    const token = agentPulse(ctx, 'dock');
    if (token) {
      disengage(ctx, 'dock-refused');
      return;
    }
    zeroCmd(ap);
    ap.wantDock = true;
    ap.idle = true;
    ap.phase = 'docking';
    dockPhase = 'docking';
    dockPulseAt = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
    return;
  }

  let braking = dockShouldBrake(
    settleDistance, speed, acceleration, DOCK_FINAL_BRAKE_BUFFER,
  ) || steer.align < DOCK_CORRIDOR_ALIGN;
  if (range > DOCK_REQUEST_RANGE && speed <= 1 && settleDistance > 0.5
    && steer.align >= DOCK_CORRIDOR_ALIGN) braking = false;
  ap.idle = braking;
  ap.throttle = 0;
  if (!dockMakingProgress(ctx, ap, settleDistance, steer.yawAbs)) return;
}

function flyTick(ctx, dt) {
  const ap = bindChannel(ctx);
  const nav = navBag(ctx);
  if (!flyingFlag(ctx) || !nav) {
    ap.engaged = false;
    zeroCmd(ap);
    return;
  }
  ap.engaged = true;
  ap.mode = 'route';
  ap.idle = false;

  const brk = inputBreak(ctx);
  if (brk) { disengage(ctx, brk); return; }

  if ((ctx.flags && ctx.flags.paused) || (ctx.flags && ctx.flags.docked) || berthHeld(ctx)) {
    zeroCmd(ap);
    return;
  }

  const loaded = scanEvents(ctx, 'systemLoaded');
  if (loaded) {
    const dest = destIdOf(nav);
    if (ctx.world.currentSystem === dest) {
      // Issue #183: the route helm is held to the final arrival exactly as
      // before, and the arrival receipt is unchanged. A wish bound to THIS
      // destination is read first, because disengage drops it.
      const queued = queuedDockDest() === dest ? dest : '';
      disengage(ctx, 'arrive');
      if (queued) {
        armQueuedDock(ctx, queued);
        runPendingDock(ctx);
      }
      return;
    }
    resetApproach();
  }

  const hop = nextHopId(nav);
  const dest = destIdOf(nav);
  if (!hop || dest === ctx.world.currentSystem) {
    if (dest === ctx.world.currentSystem) disengage(ctx, 'arrive');
    else disengage(ctx, 'missingGate');
    return;
  }

  aimAtGate(ctx, ap, hop, dt);
}

export function initAutopilot(ctx) {
  const ap = bindChannel(ctx);
  ap.engaged = false;
  zeroCmd(ap);
  if (!Object.hasOwn(ap, 'reason')) ap.reason = '';
  return {
    update(_dt, next) {
      const c = next || ctx;
      bindChannel(c);
      if (c.autopilot.engaged === true && c.autopilot.mode === 'dock') dockTick(c);
      else if (flyingFlag(c)) flyTick(c, _dt);
      else {
        const ch = c.autopilot;
        ch.engaged = false;
        zeroCmd(ch);
        // Issue #183: an armed handoff waits here, with no helm engaged.
        queuedDockTick(c);
      }
    },
  };
}

export function apDestName(nav) {
  return navSystemName(destIdOf(nav));
}

export function apNextName(nav) {
  return navSystemName(nextHopId(nav));
}
