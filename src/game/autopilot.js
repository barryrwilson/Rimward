/**
 * Autopilot command computer. Owns the live autopilot channel.
 * Does not move the mesh. Does not write input.*. Does not emit jumpRequested.
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
import { agentPulse } from '../systems/controls.js';
import {
  DOCK_STAGE_ARRIVE,
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
  impact: 'Dock approach cancelled — impact detected.',
  'dock-refused': 'Dock approach cancelled — dock pulse was refused.',
  cancel: 'Dock approach cancelled.',
  input: 'Dock approach cancelled — manual helm.',
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
let dockPulseAt = 0;
let dockPhase = '';
let dockRecovering = false;
let dockDetourValid = false;
let dockDetourX = 0;
let dockDetourY = 0;
let dockDetourZ = 0;

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
  dockStartRange = 0;
  dockStartSystem = '';
  dockStationName = '';
  dockBestRange = Infinity;
  dockBestHeading = Infinity;
  dockProgressAt = 0;
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
  if (input.afterburnerPressed) return 'input';
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
  if (ctx.ship.burnerActive === true) return 'afterburner';
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
  const range = dockDistance(ctx.ship.object.position, station);
  if (range === null) return 'stale';
  const nav = navBag(ctx);
  if (nav) nav.autopilot = false;
  ap.engaged = true;
  ap.mode = 'dock';
  ap.phase = ctx.station.inZone === true ? 'settle' : 'stage';
  ap.reason = '';
  ap.startSystem = station.system;
  ap.startRange = range;
  ap.range = range;
  ap.progress = 0;
  zeroCmd(ap);
  ap.idle = true;
  dockStartRange = range;
  dockStartSystem = station.system;
  dockStationName = station.name;
  dockBestRange = Infinity;
  dockBestHeading = Infinity;
  dockProgressAt = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  dockPulseAt = 0;
  dockPhase = ap.phase;
  resetApproach();
  steerArmed = helmSteerLatched(ctx) ? false : true;
  return '';
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

function stationBlocksStageChord(p, stage) {
  const count = _apBodies.count || 0;
  for (let i = 0; i < count; i++) {
    const body = _apBodies.items[i];
    if (!body || body.kind !== 'station') continue;
    const keep = keepRadius(body, PHY.PLAYER_RADIUS);
    if (!(keep > 0)) return false;
    const hit = sphereChordHit(
      p.x, p.y, p.z, stage.x, stage.y, stage.z,
      body.x, body.y, body.z, keep,
    );
    return !!hit.hit;
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
}

function dockMakingProgress(ctx, ap, range, yawAbs) {
  const now = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  if (dockPhase !== ap.phase) resetDockWatch(ctx, ap);
  let improved = false;
  if (Number.isFinite(range) && range <= dockBestRange - 1) {
    dockBestRange = range;
    improved = true;
  }
  if (Number.isFinite(yawAbs) && yawAbs <= dockBestHeading - 0.05) {
    dockBestHeading = yawAbs;
    improved = true;
  }
  if (improved) dockProgressAt = now;
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
  if (scanEvents(ctx, 'bodyHit')) {
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

  if (ap.phase === 'stage') {
    const planned = planApPath({
      px: p.x, py: p.y, pz: p.z,
      gx: points.stage.x, gy: points.stage.y, gz: points.stage.z,
      hx: _fwd.x, hy: _fwd.y, hz: _fwd.z,
      bodies: _apBodies,
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
    if (planned.hold === 'detour' && !dockDetourValid) {
      dockDetourValid = true;
      dockDetourX = planned.ax;
      dockDetourY = planned.ay;
      dockDetourZ = planned.az;
    }
    let detouring = dockDetourValid && stationBlocksStageChord(p, points.stage);
    if (!detouring) dockDetourValid = false;
    if (dockRecovering) {
      detouring = false;
      _aim.copy(points.stage);
    } else if (detouring) {
      _aim.set(dockDetourX, dockDetourY, dockDetourZ);
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
    const braking = dockShouldBrake(
      stageDistance, speed, acceleration, DOCK_STAGE_BRAKE_BUFFER,
    );
    const aligned = steer.align >= 0.97;
    // A far-side detour must keep creep, or the hull stops on the keep ring
    // and the 10 s blocked watch fires before it reaches +X. A clear chord
    // from live spawn must idle-turn first: spawn faces the station, and
    // thrusting off-axis dives past the pad at 30 u/s.
    const needTurn = !aligned && !detouring;
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
    // Dock stage never inherits route cruise. Throttle stays 0: idle is a
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
    if (!dockMakingProgress(ctx, ap, stageDistance, steer.yawAbs)) return;
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
      disengage(ctx, 'arrive');
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
