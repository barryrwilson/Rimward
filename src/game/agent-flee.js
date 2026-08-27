/**
 * Agent flee helm. Session only. Not persist. Not pad auto-dock.
 * Samples headings, prefers a sun-clear run to the station ring, then
 * the caller pulses the live Space afterburner. Never writes input or pose.
 */

import * as THREE from 'three';
import { PHY } from './physics.js';
import { U } from './state.js';
import { collectBodies, distSq } from './collision.js';
import { sphereChordHit } from './ap-path.js';
import { berthHeld } from '../systems/overlay-policy.js';
import { agentPulse } from '../systems/controls.js';
import { disengage as disengageAp } from './autopilot.js';

const _steerDir = new THREE.Vector3();
const _steerLocal = new THREE.Vector3();
const _steerInv = new THREE.Quaternion();

const LOOK = 720;
const RING_PAD = 8;
const ROCK_MIN_R = 10;
const STEER_GAIN = 1.35;
const YAW_STEPS = 8;
const PITCHS = Object.freeze([-0.4, 0, 0.4]);
const CHANNEL_KEYS = Object.freeze([
  'engaged', 'yaw', 'pitch', 'throttle', 'until', 'reason',
]);

const _bodies = { count: 0, items: [] };
const _aim = { x: 0, y: 0, z: 0 };
const _dir = { x: 0, y: 0, z: 0 };
const _best = { x: 0, y: 0, z: 0, score: -Infinity };

function emptyChannel() {
  return {
    engaged: false,
    yaw: 0,
    pitch: 0,
    throttle: 0,
    until: 0,
    reason: '',
  };
}

function bindChannel(ctx) {
  const cur = ctx && ctx.flee;
  if (!cur || typeof cur !== 'object' || Array.isArray(cur)) {
    if (ctx) ctx.flee = emptyChannel();
    return ctx ? ctx.flee : emptyChannel();
  }
  const names = Object.keys(cur);
  for (let i = 0; i < names.length; i++) {
    const k = names[i];
    if (!CHANNEL_KEYS.includes(k)) delete cur[k];
  }
  return cur;
}

function zeroCmd(ch) {
  ch.yaw = 0;
  ch.pitch = 0;
  ch.throttle = 0;
}

function finite3(x, y, z) {
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z);
}

function hypot3(x, y, z) {
  return Math.hypot(x, y, z);
}

function addSun(ctx, bag) {
  const world = ctx && ctx.config && ctx.config.world;
  const sun = world && world.sunPosition;
  const sys = ctx && ctx.systems && ctx.world && ctx.systems[ctx.world.currentSystem];
  let sunR0 = sys && Number.isFinite(sys.sunRadius) ? sys.sunRadius : 0;
  if (!(sunR0 > 0) && world && Number.isFinite(world.sunRadius)) sunR0 = world.sunRadius;
  if (!sun || !(sunR0 > 0)) return;
  if (!Number.isFinite(sun.x) || !Number.isFinite(sun.y) || !Number.isFinite(sun.z)) return;
  const i = bag.count;
  let slot = bag.items[i];
  if (!slot) {
    slot = { kind: '', x: 0, y: 0, z: 0, r: 0, y0: 0, y1: 0, id: 0 };
    bag.items[i] = slot;
  }
  slot.kind = 'sun';
  slot.x = sun.x;
  slot.y = sun.y;
  slot.z = sun.z;
  slot.r = sunR0 * PHY.SUN_HEAT_MULT;
  slot.y0 = 0;
  slot.y1 = 0;
  slot.id = 0;
  bag.count = i + 1;
}

function keepFor(body) {
  if (!body) return 0;
  const kind = body.kind;
  if (kind === 'player' || kind === 'ship' || kind === 'gate') return 0;
  if (!finite3(body.x, body.y, body.z)) return 0;
  let r = Number.isFinite(body.r) && body.r > 0 ? body.r : 0;
  if (kind === 'station') {
    const hy = Math.max(Math.abs(body.y0 || 0), Math.abs(body.y1 || 0));
    r = Math.hypot(r, hy);
    return r + PHY.PLAYER_RADIUS + RING_PAD;
  }
  if (kind === 'sun') {
    return r + PHY.PLAYER_RADIUS + 20;
  }
  if (kind === 'asteroid') {
    if (!(r >= ROCK_MIN_R)) return 0;
    return r + PHY.PLAYER_RADIUS + 6;
  }
  return 0;
}

function fillBag(ctx) {
  collectBodies(ctx, _bodies);
  addSun(ctx, _bodies);
  return _bodies;
}

function chordClearance(px, py, pz, qx, qy, qz, bag) {
  let worst = 1;
  const n = bag.count;
  for (let i = 0; i < n; i++) {
    const body = bag.items[i];
    const keep = keepFor(body);
    if (!(keep > 0)) continue;
    const hit = sphereChordHit(px, py, pz, qx, qy, qz, body.x, body.y, body.z, keep);
    if (!hit || !hit.hit) continue;
    if (hit.inside === true && body.kind === 'sun') return 0;
    const t = Number.isFinite(hit.t) ? hit.t : 0;
    if (t < worst) worst = t;
  }
  return worst < 0 ? 0 : worst;
}

function sunPos(ctx) {
  const sun = ctx && ctx.config && ctx.config.world && ctx.config.world.sunPosition;
  if (!sun || !Number.isFinite(sun.x) || !Number.isFinite(sun.y) || !Number.isFinite(sun.z)) return null;
  return sun;
}

function stationPos(ctx) {
  const st = ctx && ctx.station && ctx.station.position;
  if (st && Number.isFinite(st.x) && Number.isFinite(st.y) && Number.isFinite(st.z)) return st;
  const cfg = ctx && ctx.config && ctx.config.world && ctx.config.world.stationPosition;
  if (cfg && Number.isFinite(cfg.x) && Number.isFinite(cfg.y) && Number.isFinite(cfg.z)) return cfg;
  return null;
}

function threatAway(ctx, px, py, pz, dx, dy, dz) {
  const ships = ctx && ctx.ships;
  if (!ships) return 0;
  let best = 0;
  let minD = Infinity;
  for (let i = 0; i < ships.length; i++) {
    const s = ships[i];
    if (!s || !s.ai || s.ai.intent !== true) continue;
    if (s.state && s.state.destroyed) continue;
    const p = s.object && s.object.position;
    if (!p || !finite3(p.x, p.y, p.z)) continue;
    const d2 = distSq(px, py, pz, p.x, p.y, p.z);
    if (!(d2 < minD)) continue;
    minD = d2;
    const len = Math.sqrt(d2) || 1;
    best = -((p.x - px) * dx + (p.y - py) * dy + (p.z - pz) * dz) / len;
  }
  return best;
}

function consider(px, py, pz, qx, qy, qz, bag, ctx, stationBias, sun, outBest) {
  const dx = qx - px;
  const dy = qy - py;
  const dz = qz - pz;
  const len = hypot3(dx, dy, dz);
  if (!(len > 1e-6)) return;
  const inv = 1 / len;
  const hx = dx * inv;
  const hy = dy * inv;
  const hz = dz * inv;
  const clear = chordClearance(px, py, pz, qx, qy, qz, bag);
  let sunRadial = 0;
  if (sun) {
    const d0 = hypot3(px - sun.x, py - sun.y, pz - sun.z);
    const d1 = hypot3(qx - sun.x, qy - sun.y, qz - sun.z);
    sunRadial = (d1 - d0) / (LOOK || 1);
  }
  const away = threatAway(ctx, px, py, pz, hx, hy, hz);
  const score = clear * 2.4 + sunRadial * 1.6 + away * 0.7 + stationBias;
  if (score > outBest.score) {
    outBest.score = score;
    outBest.x = qx;
    outBest.y = qy;
    outBest.z = qz;
  }
}

function pickAim(ctx, obj) {
  const p = obj && obj.position;
  if (!p || !finite3(p.x, p.y, p.z)) return null;
  const bag = fillBag(ctx);
  const sun = sunPos(ctx);
  const st = stationPos(ctx);
  _best.score = -Infinity;
  _best.x = p.x;
  _best.y = p.y;
  _best.z = p.z;

  if (st) {
    const vx = p.x - st.x;
    const vy = p.y - st.y;
    const vz = p.z - st.z;
    const len = hypot3(vx, vy, vz) || 1;
    const ring = Math.max(U.DOCK_RANGE, PHY.STATION_CYL_RADIUS + RING_PAD);
    const qx = st.x + (vx / len) * ring;
    const qy = st.y + (vy / len) * ring;
    const qz = st.z + (vz / len) * ring;
    let sunBlocked = false;
    if (sun) {
      const sys = ctx.systems && ctx.world && ctx.systems[ctx.world.currentSystem];
      const sunR0 = sys && Number.isFinite(sys.sunRadius) ? sys.sunRadius : 0;
      const heat = ((sunR0 > 0 ? sunR0 : 50) * PHY.SUN_HEAT_MULT) + PHY.PLAYER_RADIUS + 20;
      const hit = sphereChordHit(p.x, p.y, p.z, qx, qy, qz, sun.x, sun.y, sun.z, heat);
      sunBlocked = !!(hit && hit.hit && hit.inside !== true && hit.t < 0.92);
    }
    if (!sunBlocked && finite3(qx, qy, qz)) {
      return { x: qx, y: qy, z: qz };
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rx = st.x + Math.cos(a) * ring;
      const ry = st.y;
      const rz = st.z + Math.sin(a) * ring;
      const clear = chordClearance(p.x, p.y, p.z, rx, ry, rz, bag);
      if (clear < 0.28) continue;
      consider(p.x, p.y, p.z, rx, ry, rz, bag, ctx, 8 + clear, sun, _best);
    }
  }

  for (let i = 0; i < YAW_STEPS; i++) {
    const yaw = (i / YAW_STEPS) * Math.PI * 2;
    for (let j = 0; j < PITCHS.length; j++) {
      const pitch = PITCHS[j];
      const cp = Math.cos(pitch);
      const hx = Math.sin(yaw) * cp;
      const hy = Math.sin(pitch);
      const hz = Math.cos(yaw) * cp;
      consider(
        p.x, p.y, p.z,
        p.x + hx * LOOK, p.y + hy * LOOK, p.z + hz * LOOK,
        bag, ctx, 0, sun, _best,
      );
    }
  }

  if (!(_best.score > -Infinity) || !finite3(_best.x, _best.y, _best.z)) return null;
  return { x: _best.x, y: _best.y, z: _best.z };
}

function writeSteer(ch, obj, aim) {
  if (!ch || !obj || !aim) {
    if (ch) zeroCmd(ch);
    return;
  }
  const q = obj.quaternion;
  const p = obj.position;
  if (!q || !p) {
    zeroCmd(ch);
    return;
  }
  _steerDir.set(aim.x - p.x, aim.y - p.y, aim.z - p.z);
  if (!(_steerDir.lengthSq() > 1e-8)) {
    zeroCmd(ch);
    return;
  }
  _steerInv.copy(q).invert();
  _steerLocal.copy(_steerDir).applyQuaternion(_steerInv);
  const yawErr = Math.atan2(_steerLocal.x, -_steerLocal.z);
  const pitchErr = Math.atan2(_steerLocal.y, Math.hypot(_steerLocal.x, _steerLocal.z) || 1e-8);
  ch.yaw = Math.max(-1, Math.min(1, yawErr * STEER_GAIN));
  ch.pitch = Math.max(-1, Math.min(1, pitchErr * STEER_GAIN));
}

function inputBreak(ctx) {
  const input = ctx && ctx.input;
  if (!input) return '';
  if (input.strafeX || input.strafeY) return 'input';
  if (input.roll) return 'input';
  if (input.throttleHeld) return 'input';
  if (input.driftHeld) return 'input';
  if (input.fullStop) return 'input';
  return '';
}

function deathOpen(ctx) {
  if (ctx && ctx.player && ctx.player.destroyed === true) return true;
  const api = ctx && ctx.deathApi;
  if (!api || typeof api.isOpen !== 'function') return false;
  try {
    return api.isOpen() === true;
  } catch {
    return true;
  }
}

function sawDestroyed(ctx) {
  const evs = ctx && ctx.lastEvents;
  if (!evs || !evs.length) return false;
  for (let i = 0; i < evs.length; i++) {
    if (evs[i] && evs[i].type === 'playerDestroyed') return true;
  }
  return false;
}

export function disengageFlee(ctx, reason) {
  try {
    const ch = bindChannel(ctx);
    ch.engaged = false;
    ch.until = 0;
    ch.reason = reason || '';
    zeroCmd(ch);
  } catch {
    /* never throw */
  }
}

export function tryEngageFlee(ctx) {
  try {
    const ch = bindChannel(ctx);
    if (!ctx || !ctx.ship || !ctx.ship.object) return 'no-service';
    if (ctx.flags && ctx.flags.docked === true) return 'docked';
    if (ctx.flags && ctx.flags.paused === true) return 'paused';
    if (berthHeld(ctx)) return 'held';
    if (ctx.gate && ctx.gate.jumping) return 'jumping';
    try { disengageAp(ctx, 'input'); } catch { /* AP off is enough */ }
    const cfg = ctx.config && ctx.config.ship && ctx.config.ship.afterburner;
    const burn = cfg && Number.isFinite(cfg.burnTime) ? cfg.burnTime : 6;
    const now = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
    ch.engaged = true;
    ch.until = now + burn + 1;
    ch.reason = '';
    const aim = pickAim(ctx, ctx.ship.object);
    if (aim) writeSteer(ch, ctx.ship.object, aim);
    else zeroCmd(ch);
    return '';
  } catch {
    return 'refuse';
  }
}

function flyTick(ctx) {
  const ch = bindChannel(ctx);
  if (!ch.engaged) {
    zeroCmd(ch);
    return;
  }
  if (deathOpen(ctx) || sawDestroyed(ctx)) {
    disengageFlee(ctx, 'destroyed');
    return;
  }
  if (ctx.flags && (ctx.flags.docked === true || ctx.flags.paused === true)) {
    disengageFlee(ctx, 'docked');
    return;
  }
  if (berthHeld(ctx)) {
    disengageFlee(ctx, 'held');
    return;
  }
  const brk = inputBreak(ctx);
  if (brk) {
    disengageFlee(ctx, brk);
    return;
  }
  const now = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  if (Number.isFinite(ch.until) && now >= ch.until) {
    disengageFlee(ctx, 'done');
    return;
  }
  const obj = ctx.ship && ctx.ship.object;
  const aim = pickAim(ctx, obj);
  if (aim) {
    _aim.x = aim.x;
    _aim.y = aim.y;
    _aim.z = aim.z;
    writeSteer(ch, obj, _aim);
  } else {
    zeroCmd(ch);
  }
  const st = stationPos(ctx);
  const p = obj && obj.position;
  let throttle = 1;
  if (st && p && finite3(p.x, p.y, p.z)) {
    const d = hypot3(p.x - st.x, p.y - st.y, p.z - st.z);
    if (d < U.DOCK_RANGE * 2) throttle = 0.22;
    if (d < U.DOCK_RANGE + 10) throttle = 0.08;
  }
  ch.throttle = throttle;
  try {
    if (ctx.station && ctx.station.inZone === true && ctx.flags && ctx.flags.docked !== true) {
      agentPulse(ctx, 'dock');
    }
  } catch {
    /* never throw */
  }
}

export function initAgentFlee(ctx) {
  const ch = bindChannel(ctx);
  ch.engaged = false;
  zeroCmd(ch);
  if (ctx && typeof ctx.on === 'function') {
    try {
      ctx.on('playerDestroyed', () => { disengageFlee(ctx, 'destroyed'); });
    } catch {
      /* no live subscribe API */
    }
  }
  return {
    update(_dt, next) {
      try {
        const cur = next || ctx;
        if (sawDestroyed(cur)) disengageFlee(cur, 'destroyed');
        flyTick(cur);
      } catch {
        disengageFlee(next || ctx, 'refuse');
      }
    },
  };
}
