/** Issue #102: actual combat -> agent harvest -> public observation.
 * Privileged fixture positions the ship / live sun and sets shields only.
 * Damage, solar receipts and destruction always come from real combat.
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { buildObservation } from '../src/game/agent-observe.js';
import { sanitizeEvent, pushRing, EVENT_CAP, capabilityManifest } from '../src/game/agent-schema.js';
import { PHY } from '../src/game/physics.js';

let pins = 0;
function pin(name, check) { check(); pins++; console.log('PASS', name); }
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
const DT = 1 / 60;
const combatApi = systems.filter(([name]) => name === 'combat' || name === 'agentapi');
function tick(n = 1, selected = combatApi) {
  for (let i = 0; i < n; i++) {
    // Same pause gate and queue rotation as main.js.
    if (!ctx.flags.paused) {
      ctx.world.time += DT;
      for (const [, system] of selected) system.update?.(DT);
    }
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
tick(3, systems);
const observe = () => window.rimward.observe();
const config = ctx.config.world;
config.sunPosition.set(0, 0, 0); config.sunRadius = 60;
ctx.ship.object.position.set(200, 0, 0);
ctx.flags.docked = false; ctx.flags.berthHold = false;
ctx.ship.velocity.set(0, 0, 0); ctx.input.throttle = 0;
ctx.input.fireHeld = false;
ctx.agent.events = []; ctx.events = []; ctx.lastEvents = [];

pin('additive v2 geometry uses live shared heat/lethal boundaries', () => {
  const o = observe(), sun = o.hazards.sun;
  assert.equal(o.v, 2); assert.deepEqual(sun.position, [0, 0, 0]);
  assert.equal(sun.radius, 60); assert.equal(sun.heatRadius, 60 * PHY.SUN_HEAT_MULT);
  assert.equal(sun.lethalRadius, 60 * PHY.SUN_LETHAL_MULT);
  assert.equal(sun.distance, 200); assert.equal(sun.zone, 'clear'); assert.equal(sun.heatDps, 0);
  assert.ok(capabilityManifest().events.includes('sunHeat'));
  assert.ok(capabilityManifest().events.includes('sunKill'));
});

pin('heat and lethal boundary equality agrees with combat classifier', () => {
  for (const [distance, zone] of [[144.0001, 'clear'], [144, 'heat'], [67.2001, 'heat'], [60 * PHY.SUN_LETHAL_MULT, 'lethal'], [0, 'lethal']]) {
    ctx.ship.object.position.set(distance, 0, 0);
    const s = observe().hazards.sun;
    assert.equal(s.zone, zone, String(distance));
    assert.equal(s.distance, distance);
    if (distance === 144) { assert.equal(s.intensity, 0); assert.equal(s.heatDps, PHY.SUN_HEAT_DPS); }
    if (zone === 'lethal') assert.equal(s.heatDps, null);
  }
});

pin('live relocation and radius changes replace geometry without stale table data', () => {
  config.sunPosition.set(2000, 300, -500); config.sunRadius = 10;
  ctx.ship.object.position.set(2020, 300, -500);
  const s = observe().hazards.sun;
  assert.deepEqual(s.position, [2000, 300, -500]); assert.equal(s.heatRadius, 24);
  assert.equal(s.distance, 20); assert.equal(s.zone, 'heat');
});

pin('snapshot owns detached finite JSON data', () => {
  const a = observe(), b = observe();
  assert.notEqual(a.hazards, b.hazards); assert.notEqual(a.hazards.sun, b.hazards.sun);
  assert.notEqual(a.hazards.sun.position, b.hazards.sun.position);
  a.hazards.sun.position[0] = -123; a.hazards.sun.radius = -1;
  assert.deepEqual(observe().hazards, b.hazards);
  assert.deepEqual(JSON.parse(JSON.stringify(b.hazards)), b.hazards);
  const obj = ctx.ship.object; ctx.ship.object = null;
  const missing = observe().hazards.sun; ctx.ship.object = obj;
  assert.equal(missing.distance, null); assert.equal(missing.zone, null); assert.equal(missing.heatDps, null);
});

pin('no sun / uninitialized / invalid / no context cannot retain previous hazard', () => {
  for (const r of [0, -1, NaN, Infinity, Number.MAX_VALUE]) {
    config.sunRadius = r; assert.equal(observe().hazards.sun, null);
  }
  config.sunRadius = 10; config.sunPosition.x = NaN;
  assert.equal(observe().hazards.sun, null);
  assert.equal(buildObservation({}).hazards.sun, null);
  assert.equal(buildObservation(null).hazards.sun, null);
  config.sunPosition.set(0, 0, 0); config.sunRadius = 60;
});

pin('first real heat tick damages shields and harvests readable timestamped event', () => {
  ctx.ship.object.position.set(136, 0, 0);
  ctx.player.screen = ctx.player.screenMax;
  ctx.player.heat = 0; ctx.player.overheated = false;
  const before = observe(); tick(); const after = observe();
  const event = after.events.find(e => e.type === 'sunHeat');
  assert.ok(after.ship.screen < before.ship.screen);
  assert.ok(event); assert.equal(event.reason, 'sun'); assert.equal(event.t, after.t);
  near(event.intensity, after.hazards.sun.intensity); near(event.dps, after.hazards.sun.heatDps);
  assert.equal(after.ship.heat, 0); assert.equal(after.ship.overheated, false);
  assert.equal(event.count, undefined);
});

pin('heat ticks preserve HUD cadence and public coalescing keeps newest time', () => {
  const first = observe().events.find(e => e.type === 'sunHeat');
  tick(60);
  assert.deepEqual(observe().events.find(e => e.type === 'sunHeat'), first);
  tick(100);
  const events = observe().events.filter(e => e.type === 'sunHeat');
  assert.equal(events.length, 1); assert.equal(events[0].count, 2);
  assert.ok(events[0].t - first.t >= 2.5);
});

pin('docked, berth-held, jumping and paused runs do not apply solar damage', () => {
  for (const [bag, key] of [[ctx.flags, 'docked'], [ctx.flags, 'berthHold'], [ctx.gate, 'jumping'], [ctx.flags, 'paused']]) {
    bag[key] = true;
    const before = observe(); tick(180); const after = observe();
    assert.ok(after.ship.screen >= before.ship.screen, key);
    assert.deepEqual(after.events.filter(e => e.type === 'sunHeat'), before.events.filter(e => e.type === 'sunHeat'), key);
    assert.equal(after.hazards.sun.zone, 'heat', 'geometry remains visible during ' + key);
    bag[key] = false;
  }
});

pin('exit and no-live-sun stop damage while historical receipt stays readable', () => {
  ctx.ship.object.position.set(200, 0, 0);
  const before = observe(); tick(180); const clear = observe();
  assert.equal(clear.hazards.sun.zone, 'clear'); assert.equal(clear.hazards.sun.heatDps, 0);
  assert.ok(clear.ship.screen >= before.ship.screen);
  assert.deepEqual(clear.events.filter(e => e.type === 'sunHeat'), before.events.filter(e => e.type === 'sunHeat'));
  config.sunRadius = 0; ctx.ship.object.position.set(0, 0, 0);
  tick(); assert.equal(observe().hazards.sun, null); assert.equal(ctx.player.destroyed, false);
});

pin('system load resets cooldown and delivers its first heat warning immediately', () => {
  config.sunRadius = 60; ctx.ship.object.position.set(136, 0, 0);
  tick(); const first = observe().events.find(e => e.type === 'sunHeat');
  // A real systemLoaded queue edge is fixture input; the solar receipt is not.
  ctx.lastEvents = [{ type: 'systemLoaded', to: 'freehold', t: ctx.world.time }];
  tick(); const next = observe().events.find(e => e.type === 'sunHeat');
  assert.equal(next.t, ctx.world.time); assert.ok(next.t > first.t);
  assert.equal(next.count, first.count + 1);
});

pin('real lethal core publishes sunKill and playerDestroyed only once', () => {
  ctx.ship.object.position.set(60, 0, 0);
  tick(); const o = observe();
  assert.equal(o.ship.hull, 0); assert.equal(ctx.player.destroyed, true);
  assert.equal(o.hazards.sun.zone, 'lethal');
  assert.ok(o.events.some(e => e.type === 'playerDestroyed'));
  assert.deepEqual(o.events.find(e => e.type === 'sunKill'), { type: 'sunKill', t: o.t, reason: 'sun' });
  tick(5); assert.equal(observe().events.filter(e => e.type === 'sunKill').length, 1);
});

pin('solar sanitization is bounded, own-field only, idempotent and private-data free', () => {
  const input = { type: 'sunHeat', t: 42, intensity: 7, dps: Infinity, reason: { ctx }, ship: ctx.ship, private: ctx };
  const clean = sanitizeEvent(input);
  assert.deepEqual(clean, { type: 'sunHeat', t: 42, reason: 'sun', intensity: 1 });
  assert.deepEqual(sanitizeEvent(clean), clean);
  const inherited = Object.assign(Object.create({ intensity: 0.5, dps: 9 }), { type: 'sunHeat' });
  assert.deepEqual(sanitizeEvent(inherited), { type: 'sunHeat', t: 0, reason: 'sun' });
  const bad = sanitizeEvent({ type: 'sunHeat', intensity: -1, dps: 'hot' });
  assert.deepEqual(bad, { type: 'sunHeat', t: 0, reason: 'sun' });
});

pin('solar spam folds in bounded ring and survives retained combat saturation', () => {
  const ring = [];
  for (let i = 0; i < EVENT_CAP; i++) pushRing(ring, sanitizeEvent({ type: 'shieldDown', t: i, layer: 'screen' }));
  for (let i = 0; i < 100; i++) pushRing(ring, sanitizeEvent({ type: 'sunHeat', t: 100 + i, intensity: 0.5, dps: 15 }));
  assert.equal(ring.length, EVENT_CAP);
  const event = ring.find(e => e.type === 'sunHeat');
  assert.equal(event.count, 100); assert.equal(event.t, 199);
  assert.deepEqual(sanitizeEvent(event), event);
  pushRing(ring, sanitizeEvent({ type: 'sunKill', t: 200, reason: 'sun' }));
  assert.ok(ring.some(e => e.type === 'sunKill')); assert.equal(ring.length, EVENT_CAP);
});

console.log(`ISSUE-102 PASS: ${pins} pins`);
