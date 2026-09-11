/** Issue #103: the persistent raw-control throttle setpoint, as published.
 * The real installed controls update applies every lease, and every reading
 * comes from the public window.rimward observation/act pipeline. Contacts and
 * HUD aim frames for the combat-release check are fixtures; the throttle,
 * full-stop and lease values are not.
 *
 * Run: npm run test:throttle-observability
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState } from '../src/game/state.js';
import { localDir, COMMAND_SPECS } from '../src/game/agent-schema.js';
import { installDomStubs, seedBootRandom } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';

let pins = 0;
function pin(name, run) { run(); pins++; console.log('PASS', name); }

const DT = 1 / 60;
const RAMP = 0.5; // controls.js THROTTLE_RAMP_RATE (§5.1 player rate)

seedBootRandom();

/**
 * One booted flight session: real ctx, real controls, real public handle.
 * initControls resets the module lease state, so fixtures do not leak.
 */
function fixture() {
  const dom = installDomStubs();
  document.addEventListener = () => {};
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  // Fixtures spawn at the origin facing -Z, away from this valid sun.
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 5000), sunRadius: 0 };
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3();
  ctx.ship.speed = 80;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  const target = { id: 'throttle-fixture', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  target.object.position.set(0, 0, -300); ctx.ships = [target]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  function sample() {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = {
      targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time,
      weaponGroup: ctx.input.weaponGroup, dist: p.distanceTo(o), speed: 80, closing: 0,
      bearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z),
    };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const observe = () => api.observe();
  const tick = (n = 1) => {
    for (let i = 0; i < n; i++) {
      ctx.world.time += DT;
      sample();
      controls.update(DT);
    }
  };
  return { ctx, target, api, act, observe, tick, dom, status: () => agentControlStatus(ctx) };
}

pin('the manifest tells a planner that the setpoint persists and clearing does not brake', () => {
  const set = COMMAND_SPECS.setControl, clear = COMMAND_SPECS.clearControl;
  assert.match(set.args.throttle, /observe\(\)\.ship\.throttle/);
  assert.match(set.args.throttle, /omitted or null leaves that setpoint alone/);
  assert.match(set.note, /expiry and clearControl/);
  assert.match(set.note, /throttle 0/);
  assert.deepEqual(clear.args, {});
  assert.deepEqual(clear.roles, ['pilot', 'combat', 'miner', 'explorer', 'rescue']);
  assert.match(clear.note, /For raw leases it does not brake/);
  assert.match(clear.note, /combat lease release applies full stop/);
  assert.match(clear.note, /idempotent/);
  // The handshake is both readings, not zero throttle alone.
  assert.match(clear.note, /ship\.throttle === 0 AND observe\(\)\.flags\.fullStop === true/);
  assert.match(set.note, /flags\.fullStop === true/);
  assert.match(clear.note, /ship\.speed/);
  // Same manifest reaches the public observation.
  const f = fixture();
  const live = f.observe().capabilities.commands;
  assert.equal(live.setControl.note, set.note);
  assert.equal(live.clearControl.note, clear.note);
});

pin('the published setpoint is the live input ramp, not the requested target and not speed', () => {
  const f = fixture();
  assert.equal(f.observe().ship.throttle, 0);
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, throttle: 1 }).ok, true);
  // Accepting a lease writes nothing by itself; only an applied update ramps.
  assert.equal(f.observe().ship.throttle, 0);
  f.tick();
  const one = f.observe();
  assert.equal(one.control.state, 'active');
  assert.ok(Math.abs(one.ship.throttle - RAMP * DT) < 1e-12, String(one.ship.throttle));
  assert.notEqual(one.ship.throttle, 1);
  // Speed is measured velocity from the fixture, unrelated to the setpoint.
  assert.equal(one.ship.speed, 80);
  assert.equal(one.ship.throttle, f.ctx.input.throttle);
  f.tick(30);
  const half = f.observe();
  assert.ok(Math.abs(half.ship.throttle - RAMP * DT * 31) < 1e-9, String(half.ship.throttle));
  assert.ok(half.ship.throttle < 1);
  assert.equal(half.flags.fullStop, false);
});

pin('the ramp reaches the requested target at the player rate and stops there', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, throttle: 0.6 }).ok, true);
  // 0.6 / 0.5 = 1.2 s; a ramp that overshot would keep climbing.
  f.tick(71);
  assert.ok(f.observe().ship.throttle < 0.6);
  f.tick(2);
  assert.equal(f.observe().ship.throttle, 0.6);
  f.tick(60);
  assert.equal(f.observe().ship.throttle, 0.6);
  assert.equal(f.observe().flags.fullStop, false);
});

pin('expiry ends the lease and leaves the ship under thrust at the last applied setpoint', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 0.5, throttle: 0.4, steerX: 1 }).ok, true);
  f.tick();
  const early = f.observe();
  assert.equal(early.control.state, 'active');
  assert.ok(early.ship.throttle > 0);
  assert.equal(f.ctx.input.steerX, 1);
  // Walk real updates one at a time up to the transition, so the comparison
  // below is against the setpoint the LAST live update actually applied and
  // not against an arbitrary earlier point on the ramp.
  let lastLive = early.ship.throttle;
  let gone = null;
  for (let i = 0; i < 200 && gone === null; i++) {
    f.tick();
    const o = f.observe();
    if (o.control.state === 'active') lastLive = o.ship.throttle;
    else gone = o;
  }
  assert.ok(gone, 'the 0.5 s lease never expired inside the bounded tick loop');
  // The ramp really was still climbing while the lease was live.
  assert.ok(lastLive > early.ship.throttle, `${lastLive} <= ${early.ship.throttle}`);
  assert.equal(gone.control.state, 'expired');
  assert.equal(gone.control.reason, 'expired');
  assert.equal(gone.control.owner, 'none');
  // Steering stopped. Thrust did not: exactly the last applied setpoint.
  assert.equal(f.ctx.input.steerX, 0);
  assert.equal(gone.ship.throttle, lastLive);
  assert.equal(gone.flags.fullStop, false);
  f.tick(120);
  assert.equal(f.observe().ship.throttle, lastLive);
});

pin('clearControl releases the lease, is idempotent, and never brakes by itself', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, throttle: 0.8 }).ok, true);
  f.tick(40);
  const flying = f.observe();
  assert.ok(flying.ship.throttle > 0);
  const first = f.act('clearControl');
  assert.equal(first.ok, true); assert.equal(first.status, 'cleared'); assert.equal(first.owner, 'none');
  const second = f.act('clearControl');
  assert.equal(second.ok, true); assert.equal(second.status, 'cleared'); assert.equal(second.owner, 'none');
  assert.equal(f.observe().control.state, 'cleared');
  assert.equal(f.observe().ship.throttle, flying.ship.throttle);
  f.tick(120);
  const after = f.observe();
  assert.equal(after.control.state, 'cleared');
  assert.equal(after.ship.throttle, flying.ship.throttle);
  assert.equal(after.flags.fullStop, false);
});

pin('an omitted or null throttle steers without touching the setpoint', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, throttle: 0.5 }).ok, true);
  f.tick(80);
  assert.equal(f.observe().ship.throttle, 0.5);
  assert.equal(f.act('setControl', { seq: 2, ttl: 5, steerX: -1 }).ok, true);
  f.tick(60);
  assert.equal(f.observe().ship.throttle, 0.5);
  assert.equal(f.ctx.input.steerX, -1);
  assert.equal(f.act('setControl', { seq: 3, ttl: 5, throttle: null, roll: 1 }).ok, true);
  f.tick(60);
  assert.equal(f.observe().ship.throttle, 0.5);
  assert.equal(f.ctx.input.roll, 1);
  assert.equal(f.observe().flags.fullStop, false);
});

pin('an explicit zero is the player full stop and applies on the next update', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, throttle: 0.9 }).ok, true);
  f.tick(120);
  assert.equal(f.observe().ship.throttle, 0.9);
  assert.equal(f.act('setControl', { seq: 2, ttl: 5, throttle: 0 }).ok, true);
  // Still moving until an update applies it.
  assert.equal(f.observe().ship.throttle, 0.9);
  f.tick();
  const stopped = f.observe();
  assert.equal(stopped.ship.throttle, 0);
  assert.equal(stopped.flags.fullStop, true);
  assert.equal(stopped.control.state, 'active');
  // The full stop is a latch that survives the lease ending.
  assert.equal(f.act('clearControl').ok, true);
  f.tick(60);
  const held = f.observe();
  assert.equal(held.ship.throttle, 0);
  assert.equal(held.flags.fullStop, true);
});

pin('clearing before an update discards the commanded zero and the ship flies on', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, throttle: 0.7 }).ok, true);
  f.tick(120);
  assert.equal(f.observe().ship.throttle, 0.7);
  // The documented mistake: request the stop, then clear in the same breath.
  assert.equal(f.act('setControl', { seq: 2, ttl: 5, throttle: 0 }).ok, true);
  assert.equal(f.act('clearControl').ok, true);
  f.tick(180);
  const running = f.observe();
  assert.equal(running.control.state, 'cleared');
  assert.equal(running.ship.throttle, 0.7);
  assert.equal(running.flags.fullStop, false);
  // The supported sequence: ask, let frames run, confirm, then release.
  assert.equal(f.act('setControl', { seq: 3, ttl: 5, throttle: 0 }).ok, true);
  f.tick();
  assert.equal(f.observe().ship.throttle, 0);
  assert.equal(f.observe().flags.fullStop, true);
  assert.equal(f.act('clearControl').ok, true);
  f.tick(180);
  assert.equal(f.observe().ship.throttle, 0);
  assert.equal(f.observe().flags.fullStop, true);
});

pin('a refused throttle leaves the live lease, the setpoint and the full-stop latch intact', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, throttle: 0.5 }).ok, true);
  f.tick(80);
  const before = f.observe();
  assert.equal(before.ship.throttle, 0.5);
  for (const bad of [-0.001, 1.001, NaN, Infinity, -Infinity, '0.5', true, {}, []]) {
    const r = f.act('setControl', { seq: 2, ttl: 5, throttle: bad });
    assert.equal(r.ok, false, JSON.stringify(String(bad)));
    assert.equal(r.token, 'bad-throttle', JSON.stringify(String(bad)));
    f.tick();
    assert.equal(f.observe().ship.throttle, 0.5);
    assert.equal(f.observe().flags.fullStop, false);
    assert.equal(f.observe().control.state, 'active');
  }
  const unknown = f.act('setControl', { seq: 2, ttl: 5, throttle: 0, thrust: 1 });
  assert.equal(unknown.token, 'bad-args');
  f.tick();
  assert.equal(f.observe().ship.throttle, 0.5);
  // A refusal never consumed the sequence.
  assert.equal(f.act('setControl', { seq: 2, ttl: 5, throttle: 0 }).ok, true);
  f.tick();
  assert.equal(f.observe().ship.throttle, 0);
});

pin('combat release still ends in a real full stop', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, throttle: 0.9 }).ok, true);
  f.tick(120);
  assert.equal(f.observe().ship.throttle, 0.9);
  assert.equal(f.act('clearControl').ok, true);
  const start = f.act('setCombatIntent', { seq: 2, ttl: 45, targetId: f.target.id, intent: 'engage' });
  assert.equal(start.ok, true, JSON.stringify(start));
  f.tick(10);
  const fighting = f.observe();
  assert.equal(fighting.control.owner, 'combat');
  // The tactical lease owns the setpoint during the maneuver.
  assert.ok(fighting.ship.throttle > 0);
  assert.equal(f.act('clearControl').ok, true);
  const released = f.observe();
  assert.equal(released.control.state, 'cleared');
  assert.equal(released.ship.throttle, 0);
  assert.equal(released.flags.fullStop, true);
  f.tick(60);
  assert.equal(f.observe().ship.throttle, 0);
  assert.equal(f.observe().flags.fullStop, true);
});

pin('combat expiry also releases into a full stop', () => {
  const f = fixture();
  const start = f.act('setCombatIntent', { seq: 1, ttl: 1, targetId: f.target.id, intent: 'engage' });
  assert.equal(start.ok, true, JSON.stringify(start));
  f.tick(30);
  assert.ok(f.observe().ship.throttle > 0);
  f.tick(60); // past the 1 s TTL
  const done = f.observe();
  assert.equal(done.control.state, 'expired');
  assert.equal(done.ship.throttle, 0);
  assert.equal(done.flags.fullStop, true);
});

pin('the throttle reading is detached, finite and JSON-safe', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, throttle: 0.25 }).ok, true);
  f.tick(120);
  const a = f.observe(), b = f.observe();
  assert.notEqual(a.ship, b.ship);
  assert.equal(a.ship.throttle, 0.25);
  a.ship.throttle = 99; a.flags.fullStop = true;
  assert.equal(f.ctx.input.throttle, 0.25);
  assert.equal(f.observe().ship.throttle, 0.25);
  assert.equal(f.observe().flags.fullStop, false);
  assert.equal(JSON.parse(JSON.stringify(b)).ship.throttle, 0.25);
  // A hostile runtime value cannot escape as a non-number.
  for (const junk of [NaN, Infinity, '1', null, undefined]) {
    f.ctx.input.throttle = junk;
    const o = f.observe();
    assert.equal(typeof o.ship.throttle, 'number');
    assert.ok(Number.isFinite(o.ship.throttle), String(junk));
  }
});

console.log(`ISSUE-103 PASS: ${pins} pins`);
