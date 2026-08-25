/**
 * Autopilot command computer. Owns the live autopilot channel.
 * Does not move the mesh. Does not write input.*. Does not emit jumpRequested.
 */

import * as THREE from 'three';
import { PHY } from './physics.js';
import { collectBodies } from './collision.js';
import { JUMP } from './state.js';
import { applyAvoidBias, appendSunBody } from '../systems/npc.js';
import { resolveNavGatePos, navSystemName } from '../systems/nav-guidance.js';
import { lookupLiveNavHopKind } from '../systems/gate.js';
import { planApPath, throttleForPath, keepRadius, sphereChordHit } from './ap-path.js';

export const AP_STEER_BREAK = 0.65;

const CHANNEL_KEYS = Object.freeze([
  'engaged', 'yaw', 'pitch', 'throttle', 'wantJump', 'cycleHub', 'reason',
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

function emptyChannel() {
  return {
    engaged: false,
    yaw: 0,
    pitch: 0,
    throttle: 0,
    wantJump: false,
    cycleHub: false,
    reason: '',
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
  if (!Object.hasOwn(cur, 'reason')) cur.reason = '';
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
  ap.wantJump = false;
  ap.cycleHub = false;
}

function resetApproach() {
  hubWrap = 0;
  hubHop = '';
  pathHop = '';
  pathSign = 0;
}

function sayLine(ctx, text) {
  if (!text) return;
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

function inputBreak(ctx) {
  const input = ctx.input;
  if (!input) return '';
  const chartOpen = ctx.flags && ctx.flags.chartOpen === true;
  if (chartOpen) {
    steerArmed = false;
  } else if (!steerArmed) {
    if (Math.hypot(input.steerX || 0, input.steerY || 0) < AP_STEER_BREAK) {
      steerArmed = true;
    }
  }
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
  const was = flyingFlag(ctx);
  const nav = navBag(ctx);
  if (nav) nav.autopilot = false;
  ap.engaged = false;
  zeroCmd(ap);
  ap.reason = reason || '';
  resetApproach();
  if (!was) return;
  if (reason && reason !== 'restore') {
    ctx.emit('autopilotDisengaged', { reason: String(reason) });
    const line = Object.hasOwn(BREAK_LINE, reason) ? BREAK_LINE[reason] : '';
    sayLine(ctx, line);
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
  ap.reason = '';
  zeroCmd(ap);
  resetApproach();
  steerArmed = ctx.flags && ctx.flags.chartOpen === true ? false : true;
  ctx.emit('autopilotEngaged', { dest: String(dest) });
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
  const yawErr = Math.atan2(_local.x, -_local.z);
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

function flyTick(ctx, dt) {
  const ap = bindChannel(ctx);
  const nav = navBag(ctx);
  if (!flyingFlag(ctx) || !nav) {
    ap.engaged = false;
    zeroCmd(ap);
    return;
  }
  ap.engaged = true;

  const brk = inputBreak(ctx);
  if (brk) { disengage(ctx, brk); return; }

  if ((ctx.flags && ctx.flags.paused) || (ctx.flags && ctx.flags.docked)) {
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
      if (flyingFlag(c)) flyTick(c, _dt);
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
