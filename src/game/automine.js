/**
 * Automine command computer. Owns the live automine channel.
 * Does not move the mesh. Does not write input.* / ship.* / world.nav.
 */

import * as THREE from 'three';
import { miningLaserFor } from './state.js';

const STEER_BREAK = 0.65;
const FACE_DOT = 0.92;
const INSIDE_PAD = 8;
const STEER_GAIN = 1.35;

const CHANNEL_KEYS = Object.freeze([
  'engaged', 'yaw', 'pitch', 'throttle', 'wantMine', 'reason',
]);

export const AM_LINES = Object.freeze({
  noRock: 'Automine refused — lock an asteroid first.',
  noShip: 'Automine refused — no ship.',
  docked: 'Automine refused — docked.',
  jumping: 'Automine refused — jump in progress.',
  paused: 'Automine refused — game paused.',
  match: 'Automine refused — MATCH is on.',
  autopilot: 'Automine refused — autopilot is on.',
  hardness: 'Automine refused — laser cannot cut this rock.',
  empty: 'Automine refused — asteroid is empty.',
  cargo: 'Automine refused — hold is full.',
  cancel: 'Automine cancelled.',
  input: 'Automine cancelled — manual helm.',
  depleted: 'Automine cancelled — asteroid depleted.',
  cargoBreak: 'Automine cancelled — hold is full.',
  lostLock: 'Automine cancelled — asteroid lock lost.',
  autopilotBreak: 'Automine cancelled — autopilot.',
});

const BREAK_LINE = Object.freeze({
  cancel: AM_LINES.cancel,
  input: AM_LINES.input,
  depleted: AM_LINES.depleted,
  cargo: AM_LINES.cargoBreak,
  lostLock: AM_LINES.lostLock,
  autopilot: AM_LINES.autopilotBreak,
});

const _aim = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _local = new THREE.Vector3();
const _inv = new THREE.Quaternion();
const _fwd = new THREE.Vector3();
const _rockPos = new THREE.Vector3();
const _hold = new THREE.Vector3();
const _radial = new THREE.Vector3();
const _toRock = new THREE.Vector3();

let steerArmed = true;

function emptyChannel() {
  return {
    engaged: false,
    yaw: 0,
    pitch: 0,
    throttle: 0,
    wantMine: false,
    reason: '',
  };
}

function bindChannel(ctx) {
  const cur = ctx.automine;
  if (!cur || typeof cur !== 'object' || Array.isArray(cur)) {
    ctx.automine = emptyChannel();
    return ctx.automine;
  }
  const names = Object.keys(cur);
  for (let i = 0; i < names.length; i++) {
    const k = names[i];
    if (!CHANNEL_KEYS.includes(k)) delete cur[k];
  }
  if (!Object.hasOwn(cur, 'reason')) cur.reason = '';
  if (!Object.hasOwn(cur, 'wantMine')) cur.wantMine = false;
  return cur;
}

function zeroCmd(am) {
  am.yaw = 0;
  am.pitch = 0;
  am.throttle = 0;
  am.wantMine = false;
}

function sayLine(ctx, text) {
  if (!text) return;
  ctx.emit('commLine', { text });
}

function navAutopilotOn(ctx) {
  const nav = ctx && ctx.world && ctx.world.nav;
  return !!(nav && typeof nav === 'object' && !Array.isArray(nav) && nav.autopilot === true);
}

function laserOf(ctx) {
  const world = ctx && ctx.world;
  return miningLaserFor(world && world.miningLaser);
}

function isRockLock(ctx, t) {
  if (!t || !t.position) return false;
  const list = ctx && ctx.asteroids && ctx.asteroids.list;
  if (!list || list.indexOf(t) < 0) return false;
  if (t.lockKind === 'rock') return true;
  if (t.lockKind) return false;
  return !t.object && !t.state;
}

function lockedRock(ctx) {
  const t = ctx && ctx.targets && ctx.targets.current;
  return isRockLock(ctx, t) ? t : null;
}

function reservedId(value) {
  return value === '__proto__' || value === 'constructor' || value === 'prototype';
}

function primitiveRockId(rock) {
  if (!rock) return undefined;
  const id = rock.id;
  if (typeof id === 'number' && Number.isFinite(id)) return id;
  if (typeof id === 'string' && id && !reservedId(id)) return id;
  return undefined;
}

function cargoUnits(ctx) {
  const rows = ctx && ctx.cargo;
  if (!Array.isArray(rows)) return Infinity;
  let n = 0;
  for (let i = 0; i < rows.length; i++) {
    const u = rows[i] && rows[i].units;
    n += Number.isFinite(u) ? u : 0;
  }
  return n;
}

function cargoFull(ctx) {
  const cap = ctx && ctx.cargoCapacity;
  if (!Number.isFinite(cap)) return true;
  return cargoUnits(ctx) >= cap;
}

function rockEmpty(rock) {
  return !(rock && rock.ore > 0);
}

function posOk(p) {
  return !!(p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
}

function overheated(ctx) {
  return !!(ctx.player && ctx.player.overheated);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function inputBreak(ctx) {
  const input = ctx.input;
  if (!input) return '';
  const chartOpen = ctx.flags && ctx.flags.chartOpen === true;
  if (chartOpen) {
    steerArmed = false;
  } else if (!steerArmed) {
    if (Math.hypot(input.steerX || 0, input.steerY || 0) < STEER_BREAK) {
      steerArmed = true;
    }
  }
  if (input.strafeX || input.strafeY) return 'input';
  if (input.roll) return 'input';
  if (input.throttleHeld) return 'input';
  if (input.afterburnerPressed) return 'input';
  if (input.driftHeld) return 'input';
  if (input.fullStop) return 'input';
  if (steerArmed && Math.hypot(input.steerX || 0, input.steerY || 0) >= STEER_BREAK) {
    return 'input';
  }
  return '';
}

export function amRefuseToken(ctx) {
  const rock = lockedRock(ctx);
  if (!rock) return 'noRock';
  if (!ctx.ship || !ctx.ship.object) return 'noShip';
  if (ctx.flags && ctx.flags.docked) return 'docked';
  if (ctx.gate && ctx.gate.jumping) return 'jumping';
  if (ctx.flags && ctx.flags.paused) return 'paused';
  if (ctx.flags && ctx.flags.matchSpeed) return 'match';
  if (navAutopilotOn(ctx)) return 'autopilot';
  const laser = laserOf(ctx);
  const hard = Number.isFinite(rock.hardness) ? rock.hardness : 1;
  if (hard > laser.tier) return 'hardness';
  if (rockEmpty(rock)) return 'empty';
  if (cargoFull(ctx)) return 'cargo';
  return '';
}

export function amLine(token) {
  if (!token) return '';
  if (Object.hasOwn(AM_LINES, token)) return AM_LINES[token];
  return '';
}

export function guardAutomineSpace(e) {
  if (!e || e.code !== 'Space') return;
  e.preventDefault();
}

export function disengageAutomine(ctx, reason) {
  if (!ctx) return;
  const am = bindChannel(ctx);
  const was = am.engaged === true;
  am.engaged = false;
  zeroCmd(am);
  am.reason = reason || '';
  if (!was) return;
  if (reason && reason !== 'restore') {
    ctx.emit('automineDisengaged', { reason: String(reason) });
    const line = Object.hasOwn(BREAK_LINE, reason) ? BREAK_LINE[reason] : '';
    sayLine(ctx, line);
  }
}

export function tryEngageAutomine(ctx) {
  if (!ctx) return 'noShip';
  const am = bindChannel(ctx);
  const token = amRefuseToken(ctx);
  if (token) return token;
  const rock = lockedRock(ctx);
  am.engaged = true;
  am.reason = '';
  zeroCmd(am);
  steerArmed = ctx.flags && ctx.flags.chartOpen === true ? false : true;
  const asteroidId = primitiveRockId(rock);
  if (asteroidId !== undefined) ctx.emit('automineEngaged', { asteroidId });
  else ctx.emit('automineEngaged', {});
  return '';
}

function minerHoldPoint(shipPos, rockPos, stand, out) {
  _radial.subVectors(shipPos, rockPos);
  const lenSq = _radial.lengthSq();
  if (lenSq < 1e-6) {
    out.copy(rockPos);
    out.x += stand;
    return;
  }
  out.copy(rockPos).addScaledVector(_radial, stand / Math.sqrt(lenSq));
}

function flyAim(ctx, am, dt) {
  const obj = ctx.ship && ctx.ship.object;
  const rock = lockedRock(ctx);
  if (!obj || !rock || !posOk(obj.position) || !posOk(rock.position)) {
    disengageAutomine(ctx, obj ? 'lostLock' : 'cancel');
    return;
  }

  const laser = laserOf(ctx);
  const range = laser.range;
  const radius = rock.radius || 8;
  const stand = clamp(range * 0.62, radius + 18, range * 0.88);

  _rockPos.set(rock.position.x, rock.position.y, rock.position.z);
  minerHoldPoint(obj.position, _rockPos, stand, _hold);

  const distRock = obj.position.distanceTo(_rockPos);
  const holdDist = obj.position.distanceTo(_hold);
  const inRange = distRock <= range;

  // Inside laser range, point at the rock so the beam can hit. Else fly the hold.
  if (inRange) _aim.copy(_rockPos);
  else _aim.copy(_hold);

  _inv.copy(obj.quaternion).invert();
  _dir.copy(_aim).sub(obj.position);
  _local.copy(_dir).applyQuaternion(_inv);
  const yawErr = Math.atan2(_local.x, -_local.z);
  const pitchErr = Math.atan2(_local.y, Math.hypot(_local.x, _local.z) || 1e-8);
  am.yaw = clamp(yawErr * STEER_GAIN, -1, 1);
  am.pitch = clamp(pitchErr * STEER_GAIN, -1, 1);

  let throttle = 0;
  if (distRock < stand * 0.85) {
    throttle = 0;
  } else {
    const far = Math.max(40, stand);
    throttle = clamp(holdDist / far, 0, 1);
  }
  am.throttle = throttle;

  _fwd.set(0, 0, -1).applyQuaternion(obj.quaternion);
  _toRock.copy(_rockPos).sub(obj.position);
  const toLen = _toRock.length();
  const facing = toLen > 1e-8 ? _fwd.dot(_toRock) / toLen : 0;
  const outside = distRock > radius + INSIDE_PAD;
  am.wantMine = !!(
    inRange
    && outside
    && facing > FACE_DOT
    && !rockEmpty(rock)
    && !overheated(ctx)
  );
  void dt;
}

function flyTick(ctx, dt) {
  const am = bindChannel(ctx);
  if (!am.engaged) {
    zeroCmd(am);
    return;
  }

  if (navAutopilotOn(ctx)) { disengageAutomine(ctx, 'autopilot'); return; }

  const brk = inputBreak(ctx);
  if (brk) { disengageAutomine(ctx, brk); return; }

  if ((ctx.flags && ctx.flags.paused) || (ctx.flags && ctx.flags.docked) || (ctx.gate && ctx.gate.jumping)) {
    zeroCmd(am);
    return;
  }

  const rock = lockedRock(ctx);
  if (!rock || !posOk(rock.position)) { disengageAutomine(ctx, 'lostLock'); return; }
  if (rockEmpty(rock)) { disengageAutomine(ctx, 'depleted'); return; }
  if (cargoFull(ctx)) { disengageAutomine(ctx, 'cargo'); return; }

  flyAim(ctx, am, dt);
}

export function initAutomine(ctx) {
  const am = bindChannel(ctx);
  am.engaged = false;
  zeroCmd(am);
  if (!Object.hasOwn(am, 'reason')) am.reason = '';
  steerArmed = true;
  return {
    update(_dt, next) {
      const c = next || ctx;
      bindChannel(c);
      if (c.automine && c.automine.engaged) flyTick(c, _dt);
      else {
        const ch = c.automine;
        ch.engaged = false;
        zeroCmd(ch);
      }
    },
  };
}
