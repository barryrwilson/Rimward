/** Issue #114: a combat intent is a thrust command.
 * After the documented stop handshake (setControl throttle 0 -> flags.fullStop)
 * an accepted setCombatIntent must clear the double-tap F latch, and while a
 * live combat lease is still held at rest by that latch the public view must
 * say so (control.combat.movementBlocked === 'full-stop') instead of claiming
 * an intercept the hull is not flying. Synthetic contact and HUD digest; the
 * real controls update and the public v2 dispatcher apply every request.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState } from '../src/game/state.js';
import { localDir } from '../src/game/agent-schema.js';
import { installDomStubs } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';

let checks = 0;
function test(name, run) { run(); console.log('PASS', name); checks++; }

function fixture() {
  installDomStubs();
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 5000) };
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3(); ctx.ship.speed = 0;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  const target = { id: 'rec-3', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  // The playtest geometry: a willing hull holding 428 u dead ahead.
  target.object.position.set(0, 0, -428); ctx.ships = [target]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  function sample() {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time, weaponGroup: ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 0, closing: 0,
      bearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z) };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const tick = (seconds = 1 / 60) => { ctx.world.time += seconds; sample(); controls.update(seconds); };
  const status = () => agentControlStatus(ctx);
  const intent = (extra = {}) => act('setCombatIntent', { seq: ++seq, ttl: 60, targetId: target.id, intent: 'disable', defense: 'evade', ...extra });
  /** The documented #103 stop handshake on a raw lease, then release. */
  const stop = () => {
    assert.equal(act('setControl', { seq: ++seq, ttl: 1, throttle: 0 }).ok, true);
    tick();
    const o = api.observe();
    assert.equal(o.ship.throttle, 0); assert.equal(o.flags.fullStop, true);
    assert.equal(act('clearControl').ok, true);
    tick();
    assert.equal(ctx.input.fullStop, true, 'raw release leaves the latch');
  };
  return { ctx, target, api, act, tick, status, intent, stop, nextSeq: () => ++seq };
}

test('accepted setCombatIntent clears the full-stop latch before any update', () => {
  const f = fixture(); f.stop();
  const r = f.intent();
  assert.equal(r.ok, true); assert.equal(r.owner, 'combat');
  assert.equal(f.ctx.input.fullStop, false);
  const o = f.api.observe();
  assert.equal(o.flags.fullStop, false);
  assert.equal(o.control.owner, 'combat');
  assert.equal(o.control.combat.phase, 'intercept');
  assert.equal(o.control.combat.movementBlocked, '');
});

test('the hull thrusts under the combat lease after the handshake', () => {
  const f = fixture(); f.stop();
  assert.equal(f.intent().ok, true);
  for (let i = 0; i < 30; i++) f.tick();
  assert.equal(f.ctx.input.fullStop, false);
  assert.ok(f.ctx.input.throttle > 0, `throttle ramps, got ${f.ctx.input.throttle}`);
  const o = f.api.observe();
  assert.ok(o.ship.throttle > 0);
  assert.equal(o.control.state, 'active');
  assert.equal(o.control.combat.movementBlocked, '');
});

test('a refused setCombatIntent leaves the latch untouched', () => {
  const f = fixture(); f.stop();
  assert.equal(f.intent({ ttl: 61 }).token, 'bad-ttl');
  assert.equal(f.intent({ targetId: 'missing' }).token, 'stale-lock');
  assert.equal(f.ctx.input.fullStop, true);
  assert.equal(f.api.observe().flags.fullStop, true);
  assert.equal(f.api.observe().control.owner, 'none');
});

test('a live combat lease held at rest by the latch publishes movementBlocked full-stop', () => {
  const f = fixture();
  assert.equal(f.intent().ok, true); f.tick();
  assert.equal(f.status().combat.movementBlocked, '');
  // Something latched the hold under the live lease (the player double-tap
  // path writes exactly this). The view must not claim motion.
  f.ctx.input.fullStop = true;
  assert.equal(f.status().combat.movementBlocked, 'full-stop');
  assert.equal(f.api.observe().control.combat.movementBlocked, 'full-stop');
  assert.ok(['intercept', 'pass'].includes(f.api.observe().control.combat.phase));
  // The next applied intercept throttle clears the latch and the block.
  f.tick();
  assert.equal(f.ctx.input.fullStop, false);
  assert.equal(f.status().combat.movementBlocked, '');
});

test('physical movement blocks keep priority over the latch label', () => {
  const f = fixture();
  assert.equal(f.intent().ok, true); f.tick();
  f.ctx.input.fullStop = true;
  const view = f.status();
  assert.equal(view.combat.movementBlocked, 'full-stop');
  // Read-through: the status view never writes the lease's own record.
  f.tick(); f.ctx.input.fullStop = true;
  f.status();
  f.tick();
  assert.equal(f.status().combat.movementBlocked, '');
});

test('combat release still ends in a full stop and the completed view carries no stop label', () => {
  const f = fixture(); f.stop();
  assert.equal(f.intent().ok, true);
  for (let i = 0; i < 10; i++) f.tick();
  assert.equal(f.ctx.input.fullStop, false);
  assert.equal(f.act('clearControl').ok, true);
  assert.equal(f.ctx.input.fullStop, true);
  assert.equal(f.ctx.input.throttle, 0);
  const o = f.api.observe();
  assert.equal(o.control.owner, 'none');
  assert.equal(o.flags.fullStop, true);
  assert.equal(o.control.combat.defense.phase, 'completed');
  assert.ok(Number.isFinite(o.control.combat.completedAt));
  assert.equal(o.control.combat.movementBlocked, '');
});

test('a renewal on the same live maneuver also clears a latch set meanwhile', () => {
  const f = fixture();
  assert.equal(f.intent().ok, true); f.tick();
  f.ctx.input.fullStop = true;
  assert.equal(f.status().combat.movementBlocked, 'full-stop');
  assert.equal(f.intent().ok, true);
  assert.equal(f.ctx.input.fullStop, false);
  assert.equal(f.status().combat.movementBlocked, '');
});

console.log(`issue-114 combat full-stop: ${checks} groups passed`);
