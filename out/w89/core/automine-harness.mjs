/**
 * Throwaway Node harness for src/game/automine.js.
 * Run: node out/w89/core/automine-harness.mjs
 */
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { miningLaserFor } from '../../../src/game/state.js';
import {
  initAutomine,
  tryEngageAutomine,
  disengageAutomine,
  amRefuseToken,
} from '../../../src/game/automine.js';

const results = [];
const protoPolluteBefore = Object.prototype.polluted;

function record(name, pass, extra) {
  const row = { name, pass: !!pass, extra: extra ?? null };
  results.push(row);
  console.log(`${pass ? 'ok' : 'FAIL'} ${name}${extra ? ` ${JSON.stringify(extra)}` : ''}`);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function standOff(range, radius) {
  return clamp(range * 0.62, radius + 18, range * 0.88);
}

function aimNoseAt(obj, target) {
  const dir = new THREE.Vector3().subVectors(target, obj.position);
  if (dir.lengthSq() < 1e-12) return;
  dir.normalize();
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
}

function makeRock(id, extra = {}) {
  return {
    id,
    lockKind: 'rock',
    ore: 40,
    hardness: 1,
    radius: 8,
    position: new THREE.Vector3(0, 0, 0),
    ...extra,
  };
}

function trackWrites(obj, bag, prefix) {
  return new Proxy(obj, {
    set(t, p, v) {
      bag.push(`${prefix}.${String(p)}`);
      t[p] = v;
      return true;
    },
    deleteProperty(t, p) {
      bag.push(`delete ${prefix}.${String(p)}`);
      return delete t[p];
    },
  });
}

function makeCtx(opts = {}) {
  const ctx = createCtx({ scene: {}, camera: {}, renderer: {} });
  ctx.player = { hull: 80, hullMax: 100, overheated: false };
  ctx.cargo = [];
  ctx.cargoCapacity = 20;
  ctx.world.nav = { dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'plotted', autopilot: false };
  ctx.world.miningLaser = 0;
  const rock = opts.rock === undefined ? makeRock(42) : opts.rock;
  ctx.asteroids = { list: rock ? [rock] : [] };
  ctx.targets.current = rock || null;
  const obj = new THREE.Object3D();
  obj.position.set(0, 0, opts.shipZ ?? 400);
  if (rock && opts.aim !== false) aimNoseAt(obj, rock.position);
  ctx.ship.object = obj;
  if (opts.patch) opts.patch(ctx, rock);
  return { ctx, rock, obj };
}

function eventsOf(ctx, type) {
  return ctx.events.filter((e) => e && e.type === type);
}

function snapshotNav(nav) {
  return JSON.stringify(nav);
}

// --- 1. No rock ---
{
  const { ctx } = makeCtx({ rock: null });
  initAutomine(ctx);
  const token = tryEngageAutomine(ctx);
  record('1 noRock', token === 'noRock' && ctx.automine.engaged === false, { token, engaged: ctx.automine.engaged });
}

// --- 2. Valid soft rock lock ---
{
  const { ctx } = makeCtx();
  initAutomine(ctx);
  const token = tryEngageAutomine(ctx);
  const ev = eventsOf(ctx, 'automineEngaged');
  const id = ev[0] && ev[0].asteroidId;
  const prim = typeof id === 'number' || typeof id === 'string';
  record(
    '2 engage empty-token + event primitive asteroidId',
    token === '' && ctx.automine.engaged === true && ev.length === 1 && id === 42 && prim,
    { token, engaged: ctx.automine.engaged, ev: ev[0], idType: typeof id },
  );
}

// --- 3. Hardness > laser.tier ---
{
  const { ctx } = makeCtx({ rock: makeRock(7, { hardness: 2 }) });
  initAutomine(ctx);
  const token = tryEngageAutomine(ctx);
  record('3 hardness', token === 'hardness' && ctx.automine.engaged === false, { token });
}

// --- 4. ore <= 0 ---
{
  const { ctx } = makeCtx({ rock: makeRock(8, { ore: 0 }) });
  initAutomine(ctx);
  record('4 empty ore0', tryEngageAutomine(ctx) === 'empty');
  const { ctx: ctx2 } = makeCtx({ rock: makeRock(9, { ore: -1 }) });
  initAutomine(ctx2);
  record('4b empty ore-1', tryEngageAutomine(ctx2) === 'empty');
}

// --- 5. cargo full ---
{
  const { ctx } = makeCtx({
    patch(c) {
      c.cargoCapacity = 10;
      c.cargo = [{ commodity: 'rawOre', units: 10 }];
    },
  });
  initAutomine(ctx);
  record('5 cargo full', tryEngageAutomine(ctx) === 'cargo');
}

// --- 6. world.nav.autopilot ---
{
  const { ctx } = makeCtx({
    patch(c) { c.world.nav.autopilot = true; },
  });
  initAutomine(ctx);
  record('6 autopilot refuse', tryEngageAutomine(ctx) === 'autopilot');
}

// --- 7. flags.matchSpeed ---
{
  const { ctx } = makeCtx({
    patch(c) { c.flags.matchSpeed = true; },
  });
  initAutomine(ctx);
  record('7 match refuse', tryEngageAutomine(ctx) === 'match');
}

// --- extra refuse tokens listed in the prompt ---
{
  const { ctx } = makeCtx({ patch(c) { c.flags.combat = true; } });
  initAutomine(ctx);
  const token = tryEngageAutomine(ctx);
  record('7b combat does not refuse', token === '' && ctx.automine.engaged === true, { token });
}

// --- 8. Far away: high throttle, wantMine false ---
{
  const writes = [];
  const { ctx, obj, rock } = makeCtx({ shipZ: 500, aim: false });
  obj.position.set(80, 12, 500);
  const laser = miningLaserFor(ctx.world.miningLaser);
  const input0 = { ...ctx.input };
  const shipPos0 = obj.position.clone();
  const nav0 = snapshotNav(ctx.world.nav);
  ctx.input = trackWrites(ctx.input, writes, 'input');
  ctx.ship = trackWrites(ctx.ship, writes, 'ship');
  ctx.world.nav = trackWrites(ctx.world.nav, writes, 'nav');
  const sys = initAutomine(ctx);
  const token = tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  const am = ctx.automine;
  const farOk = token === '' && am.engaged === true && am.throttle >= 0.85 && am.wantMine === false;
  const noInputShipNav = writes.length === 0
    && ctx.input.steerX === input0.steerX
    && obj.position.equals(shipPos0)
    && snapshotNav(ctx.world.nav) === nav0;
  record('8 far throttle high wantMine false', farOk, {
    token, throttle: am.throttle, wantMine: am.wantMine, yaw: am.yaw, pitch: am.pitch,
    dist: obj.position.distanceTo(rock.position), range: laser.range,
  });
  record('8b no write input/ship/nav while flying far', noInputShipNav, { writes });
}

// --- 9. Hold range, nose at rock: wantMine true ---
{
  const { ctx, obj, rock } = makeCtx({ aim: true });
  const laser = miningLaserFor(ctx.world.miningLaser);
  const stand = standOff(laser.range, rock.radius || 8);
  obj.position.set(0, 0, stand);
  aimNoseAt(obj, rock.position);
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  const am = ctx.automine;
  const dist = obj.position.distanceTo(rock.position);
  record('9 hold range facing wantMine true', am.engaged === true && am.wantMine === true, {
    wantMine: am.wantMine, throttle: am.throttle, yaw: am.yaw, pitch: am.pitch,
    dist, stand, range: laser.range, faceHint: 'nose -Z at rock',
  });
}

// --- 9b. Inside laser range, facing, outside mesh but not exactly hold ---
{
  const { ctx, obj, rock } = makeCtx();
  const laser = miningLaserFor(ctx.world.miningLaser);
  obj.position.set(0, 0, laser.range * 0.9);
  aimNoseAt(obj, rock.position);
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  record('9b inside range facing outside mesh wantMine true', ctx.automine.wantMine === true, {
    wantMine: ctx.automine.wantMine,
    dist: obj.position.distanceTo(rock.position),
    range: laser.range,
    throttle: ctx.automine.throttle,
  });
}

// --- 10. Too close inside mesh: wantMine false ---
{
  const { ctx, obj, rock } = makeCtx();
  obj.position.set(0, 0, 2);
  aimNoseAt(obj, rock.position);
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  const dist = obj.position.distanceTo(rock.position);
  record('10 inside mesh wantMine false', ctx.automine.engaged === true && ctx.automine.wantMine === false, {
    wantMine: ctx.automine.wantMine, dist, radius: rock.radius, throttle: ctx.automine.throttle,
  });
}

// --- 11. Strafe input while engaged → input ---
{
  const { ctx } = makeCtx({ shipZ: 60 });
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  ctx.events.length = 0;
  ctx.input.strafeX = 1;
  sys.update(0.016, ctx);
  const ev = eventsOf(ctx, 'automineDisengaged');
  record(
    '11 strafe disengage input',
    ctx.automine.engaged === false && ctx.automine.reason === 'input' && ev[0] && ev[0].reason === 'input',
    { engaged: ctx.automine.engaged, reason: ctx.automine.reason, ev: ev[0] },
  );
}

// --- 12. Clear lock from asteroid list → lostLock ---
{
  const { ctx } = makeCtx({ shipZ: 60 });
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  ctx.events.length = 0;
  ctx.asteroids.list = [];
  sys.update(0.016, ctx);
  const ev = eventsOf(ctx, 'automineDisengaged');
  record(
    '12 lostLock after list clear',
    ctx.automine.engaged === false && ctx.automine.reason === 'lostLock' && ev[0] && ev[0].reason === 'lostLock',
    { reason: ctx.automine.reason, ev: ev[0] },
  );
}

// --- 12b. Clear targets.current ---
{
  const { ctx } = makeCtx({ shipZ: 60 });
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  ctx.events.length = 0;
  ctx.targets.current = null;
  sys.update(0.016, ctx);
  record('12b lostLock after current null', ctx.automine.reason === 'lostLock' && ctx.automine.engaged === false, {
    reason: ctx.automine.reason,
  });
}

// --- 13. Channel extra keys stripped ---
{
  const { ctx } = makeCtx();
  ctx.automine.wantJump = true;
  ctx.automine.cycleHub = 1;
  ctx.automine.foo = 'bar';
  ctx.automine.__sneak = 1;
  const sys = initAutomine(ctx);
  sys.update(0.016, ctx);
  const keys = Object.keys(ctx.automine).sort();
  const extra = keys.filter((k) => !['engaged', 'yaw', 'pitch', 'throttle', 'wantMine', 'reason'].includes(k));
  record('13 extra channel keys stripped', extra.length === 0, { keys, extra });
}

// --- 14. reservedToken rock id is not an event key ---
{
  const reserved = ['__proto__', 'constructor', 'prototype'];
  let allOk = true;
  const details = [];
  for (const id of reserved) {
    const { ctx } = makeCtx({ rock: makeRock(id) });
    initAutomine(ctx);
    const token = tryEngageAutomine(ctx);
    const ev = eventsOf(ctx, 'automineEngaged')[0] || null;
    const names = ev ? Object.getOwnPropertyNames(ev) : [];
    const usedAsKey = !!(ev && (Object.prototype.hasOwnProperty.call(ev, id) || names.includes(id)));
    const asteroidIdPresent = !!(ev && Object.prototype.hasOwnProperty.call(ev, 'asteroidId'));
    const protoPolluted = Object.prototype.polluted !== undefined;
    const rowOk = token === '' && ctx.automine.engaged === true && ev && !usedAsKey && !asteroidIdPresent && !protoPolluted;
    if (!rowOk) allOk = false;
    details.push({ id, token, usedAsKey, asteroidIdPresent, names, ev });
  }
  record('14 reserved id not used as event key', allOk, details);
}

// --- disengage reasons listed in the prompt ---
function engageThen(patch, expectReason) {
  const { ctx } = makeCtx({ shipZ: 60 });
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  ctx.events.length = 0;
  patch(ctx);
  sys.update(0.016, ctx);
  const ev = eventsOf(ctx, 'automineDisengaged')[0];
  const ok = ctx.automine.engaged === false && ctx.automine.reason === expectReason && ev && ev.reason === expectReason;
  record(`disengage ${expectReason}`, ok, { reason: ctx.automine.reason, ev });
  return ctx;
}

{
  const { ctx } = makeCtx({ shipZ: 60 });
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  ctx.events.length = 0;
  ctx.flags.combat = true;
  sys.update(0.016, ctx);
  const ev = eventsOf(ctx, 'automineDisengaged')[0];
  record('combat does not disengage', ctx.automine.engaged === true && !ev, {
    engaged: ctx.automine.engaged,
    reason: ctx.automine.reason,
    ev,
  });
}
engageThen((c) => { c.cargo = [{ commodity: 'rawOre', units: 20 }]; }, 'cargo');
engageThen((c) => { c.targets.current.ore = 0; }, 'depleted');
engageThen((c) => { c.world.nav.autopilot = true; }, 'autopilot');
function holdThen(patch, name) {
  const { ctx } = makeCtx({ shipZ: 60 });
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  ctx.events.length = 0;
  patch(ctx);
  sys.update(0.016, ctx);
  const ev = eventsOf(ctx, 'automineDisengaged')[0];
  record(`${name} does not disengage`, ctx.automine.engaged === true && !ev, {
    engaged: ctx.automine.engaged,
    reason: ctx.automine.reason,
    ev,
  });
}
holdThen((c) => { c.flags.docked = true; }, 'dock');
holdThen((c) => { c.flags.paused = true; }, 'pause');
holdThen((c) => { c.gate.jumping = true; }, 'jumping');
holdThen((c) => { c.player.overheated = true; }, 'overheat');
holdThen((c) => { c.player.hull = 40; c.player.hullMax = 100; }, 'hull');
holdThen((c) => { c.lastEvents = [{ type: 'hailOpened' }]; }, 'hail');
holdThen((c) => { c.lastEvents = [{ type: 'sunHeat' }]; }, 'sun');
holdThen((c) => { c.lastEvents = [{ type: 'bodyHit', kind: 'asteroid', speed: 12 }]; }, 'impact');
engageThen((c) => { c.input.roll = 1; }, 'input');
engageThen((c) => { c.input.throttleHeld = true; }, 'input');
engageThen((c) => { c.input.fullStop = true; }, 'input');

// --- refuse docked / paused / jumping / noShip / hull ---
{
  const { ctx } = makeCtx({ patch(c) { c.flags.docked = true; } });
  initAutomine(ctx);
  record('refuse docked', tryEngageAutomine(ctx) === 'docked');
}
{
  const { ctx } = makeCtx({ patch(c) { c.flags.paused = true; } });
  initAutomine(ctx);
  record('refuse paused', tryEngageAutomine(ctx) === 'paused');
}
{
  const { ctx } = makeCtx({ patch(c) { c.gate.jumping = true; } });
  initAutomine(ctx);
  record('refuse jumping', tryEngageAutomine(ctx) === 'jumping');
}
{
  const { ctx } = makeCtx({ patch(c) { c.ship.object = null; } });
  initAutomine(ctx);
  record('refuse noShip', tryEngageAutomine(ctx) === 'noShip');
}
{
  const { ctx } = makeCtx({ patch(c) { c.player.hull = 50; c.player.hullMax = 100; } });
  initAutomine(ctx);
  record('hull does not refuse', tryEngageAutomine(ctx) === '' && ctx.automine.engaged === true);
}

// --- non-rock lock ---
{
  const npc = { id: 99, object: {}, state: {}, position: new THREE.Vector3(1, 0, 0) };
  const { ctx } = makeCtx({ rock: npc, patch(c) { c.asteroids.list = [npc]; } });
  initAutomine(ctx);
  record('refuse npc lock as noRock', tryEngageAutomine(ctx) === 'noRock');
}

// --- hardness equal to tier allowed ---
{
  const { ctx } = makeCtx({ rock: makeRock(3, { hardness: 1 }) });
  initAutomine(ctx);
  record('hardness equal to mk1 tier engages', tryEngageAutomine(ctx) === '');
}

// --- yaw/pitch change when not facing ---
{
  const { ctx, obj, rock } = makeCtx({ aim: false, shipZ: 500 });
  obj.position.set(120, 40, 500);
  obj.quaternion.identity();
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  record('yaw/pitch nonzero when not facing', Math.abs(ctx.automine.yaw) > 0.05 || Math.abs(ctx.automine.pitch) > 0.05, {
    yaw: ctx.automine.yaw, pitch: ctx.automine.pitch, wantMine: ctx.automine.wantMine,
    dist: obj.position.distanceTo(rock.position),
  });
}

// --- live asteroid list row (no lockKind, no object/state) ---
{
  const live = {
    id: 0,
    position: new THREE.Vector3(0, 0, 0),
    radius: 8,
    ore: 12,
    commodity: 'rawOre',
    oreKey: 'rawOre',
    hardness: 1,
  };
  const { ctx, obj } = makeCtx({ rock: live, shipZ: 55.8 });
  aimNoseAt(obj, live.position);
  const sys = initAutomine(ctx);
  const token = tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  const ev = eventsOf(ctx, 'automineEngaged')[0];
  record('live list row no lockKind engages', token === '' && ctx.automine.engaged === true && ev && ev.asteroidId === 0, {
    token, ev, wantMine: ctx.automine.wantMine,
  });
}

// --- steerX helm break ---
{
  const { ctx } = makeCtx({ shipZ: 60 });
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  ctx.events.length = 0;
  ctx.input.steerX = 0.65;
  sys.update(0.016, ctx);
  record('helm steerX disengage input', ctx.automine.engaged === false && ctx.automine.reason === 'input', {
    reason: ctx.automine.reason,
  });
}

// --- contract: source must not assign input/ship/nav ---
{
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../../../src/game/automine.js', import.meta.url), 'utf8');
  const bad = [];
  if (/\bctx\.input\.[A-Za-z0-9_]+\s*=/.test(src)) bad.push('ctx.input write');
  if (/\bctx\.ship\.[A-Za-z0-9_]+\s*=/.test(src)) bad.push('ctx.ship write');
  if (/\bworld\.nav\.[A-Za-z0-9_]+\s*=/.test(src)) bad.push('world.nav write');
  if (/\bnav\.autopilot\s*=(?!=)/.test(src)) bad.push('nav.autopilot write');
  if (/\bobj\.position\.(set|copy|add)\b/.test(src)) bad.push('mesh position write');
  record('source contract no input/ship/nav writes', bad.length === 0, { bad });
}

// --- engaged emit payload is primitives only ---
{
  const { ctx } = makeCtx({ rock: makeRock('rock-12') });
  initAutomine(ctx);
  tryEngageAutomine(ctx);
  const ev = eventsOf(ctx, 'automineEngaged')[0];
  const vals = Object.values(ev).filter((v) => v !== undefined);
  const allPrim = vals.every((v) => v === null || ['string', 'number', 'boolean'].includes(typeof v));
  record('engage payload primitives only', allPrim && ev.asteroidId === 'rock-12', ev);
}

// --- disengage restore does not emit ---
{
  const { ctx } = makeCtx({ shipZ: 60 });
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  ctx.events.length = 0;
  disengageAutomine(ctx, 'restore');
  record('restore silent', eventsOf(ctx, 'automineDisengaged').length === 0 && ctx.automine.engaged === false, {
    events: ctx.events,
  });
  void sys;
}

// --- wantMine false when not facing at hold ---
{
  const { ctx, obj, rock } = makeCtx({ aim: false });
  const laser = miningLaserFor(ctx.world.miningLaser);
  const stand = standOff(laser.range, rock.radius || 8);
  obj.position.set(0, 0, stand);
  obj.quaternion.identity();
  obj.rotateY(Math.PI); // +Z toward rock, nose away
  const sys = initAutomine(ctx);
  tryEngageAutomine(ctx);
  sys.update(0.016, ctx);
  record('wantMine false when nose away at hold', ctx.automine.wantMine === false && ctx.automine.engaged === true, {
    wantMine: ctx.automine.wantMine, yaw: ctx.automine.yaw,
  });
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILED:');
  for (const f of failed) console.log(' -', f.name, f.extra ? JSON.stringify(f.extra) : '');
}

if (Object.prototype.polluted !== protoPolluteBefore) {
  console.log('PROTO POLLUTION DETECTED', Object.prototype.polluted);
}

const out = {
  passed: results.length - failed.length,
  total: results.length,
  failed: failed.map((f) => ({ name: f.name, extra: f.extra })),
  results,
};
await import('node:fs/promises').then((fs) => fs.writeFile(
  new URL('./automine-harness.json', import.meta.url),
  JSON.stringify(out, null, 2),
  'utf8',
));
process.exitCode = failed.length ? 1 : 0;
