/** Issue #121: observe() says when the simulation is suspended.
 * A hidden Browser pane stops the render loop: `t` freezes, `flags.paused`
 * stays false and the HUD shows the last frame, while the combat lease's
 * wall deadline keeps running. main.js now stamps ctx.frameWallMs /
 * ctx.frameGapMs each frame; observe() publishes `frameAgeMs` and
 * `flags.suspended` (frame older than SUSPEND_AFTER_MS), and a wall deadline
 * crossed while no frame ran ends the lease with reason `suspended` instead
 * of `expired`. The wall bound itself is unchanged: focus does not renew a
 * grant. Synthetic contact and HUD digest; the real controls update and the
 * public v2 dispatcher apply every request; performance.now() is offset by
 * hand to cross the wall deadline without sleeping.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState } from '../src/game/state.js';
import { localDir, COMMAND_SPECS } from '../src/game/agent-schema.js';
import { installDomStubs } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus, SUSPEND_AFTER_MS } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';

let checks = 0;
function test(name, run) { run(); console.log('PASS', name); checks++; }

// Wall clock under test control: the real monotonic clock plus an offset.
const realNow = performance.now.bind(performance);
let wallOffsetMs = 0;
performance.now = () => realNow() + wallOffsetMs;
const advanceWall = (ms) => { wallOffsetMs += ms; };

function fixture() {
  installDomStubs();
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 9000) };
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3(0, 0, -80); ctx.ship.speed = 80;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  const target = { id: 'rec-7', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  target.object.position.set(0, 0, -300); ctx.ships = [target]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  function sample() {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time, weaponGroup: ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 80, closing: 10,
      bearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z) };
  }
  sample();
  /** What main.js does at the top of every render-loop frame. */
  const frame = () => {
    const now = performance.now();
    ctx.frameGapMs = ctx.frameWallMs > 0 ? now - ctx.frameWallMs : 0;
    ctx.frameWallMs = now;
  };
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  /** One rendered simulation frame: stamp, advance sim time, refresh the digest, run controls. */
  const tick = (seconds = 1 / 60) => { frame(); ctx.world.time += seconds; sample(); controls.update(seconds); };
  const status = () => agentControlStatus(ctx);
  const intent = (extra = {}) => act('setCombatIntent', { seq: ++seq, ttl: 1, targetId: target.id, intent: 'engage', defense: 'off', ...extra });
  return { ctx, target, api, act, tick, frame, status, intent, controls, nextSeq: () => ++seq };
}

test('the schema lists the new terminal reason and the threshold is one second', () => {
  assert.ok(COMMAND_SPECS.setCombatIntent.terminalReasons.includes('suspended'));
  assert.ok(COMMAND_SPECS.setCombatIntent.terminalReasons.includes('expired'));
  assert.match(COMMAND_SPECS.setCombatIntent.args.ttl, /suspended/);
  assert.equal(SUSPEND_AFTER_MS, 1000);
});

test('observe() publishes frameAgeMs and flags.suspended; no frame yet reads 0 / false', () => {
  const f = fixture();
  const o = f.api.observe();
  assert.equal(o.frameAgeMs, 0);
  assert.equal(o.flags.suspended, false);
  assert.equal(o.flags.paused, false);
});

test('a live loop reads a small frame age and suspended false', () => {
  const f = fixture();
  f.tick();
  advanceWall(50);
  const o = f.api.observe();
  assert.ok(o.frameAgeMs >= 50 && o.frameAgeMs < SUSPEND_AFTER_MS, 'frameAgeMs ' + o.frameAgeMs);
  assert.equal(o.flags.suspended, false);
});

test('a stalled loop reads suspended true with t frozen and paused false', () => {
  const f = fixture();
  f.tick();
  const t0 = f.api.observe().t;
  advanceWall(45000);
  const o = f.api.observe();
  assert.equal(o.t, t0);
  assert.equal(o.flags.paused, false);
  assert.equal(o.flags.suspended, true);
  assert.ok(o.frameAgeMs >= 45000, 'frameAgeMs ' + o.frameAgeMs);
  assert.ok(Number.isInteger(o.frameAgeMs));
  // The next frame clears the flag; observe() is read-only for the clock.
  f.tick();
  const back = f.api.observe();
  assert.equal(back.flags.suspended, false);
  assert.ok(back.frameAgeMs < SUSPEND_AFTER_MS);
  assert.ok(back.t > t0);
});

test('a wall deadline crossed while no frame ran ends the lease with reason suspended', () => {
  const f = fixture();
  f.tick();
  assert.equal(f.intent().ok, true);
  f.tick();
  assert.equal(f.status().state, 'active');
  assert.equal(f.status().owner, 'combat');
  // The pane goes hidden: no frames, no sim time, the wall clock runs on.
  advanceWall(5000);
  const o = f.api.observe();
  assert.equal(o.flags.suspended, true);
  assert.equal(o.control.owner, 'none');
  assert.equal(o.control.state, 'expired');
  assert.equal(o.control.reason, 'suspended');
  assert.equal(o.control.expiresIn, 0);
  assert.equal(o.control.fire, false);
  assert.equal(o.control.combat.fireBlocked, 'suspended');
  assert.equal(o.control.combat.defense.phase, 'completed');
  // The release is the normal full stop; nothing stays live.
  assert.equal(f.ctx.input.fireHeld, false);
  assert.equal(f.ctx.input.fullStop, true);
  assert.equal(f.ctx.input.throttle, 0);
  // Focus does not renew the grant: the first frame back keeps the terminal.
  f.tick();
  const after = f.api.observe();
  assert.equal(after.control.owner, 'none');
  assert.equal(after.control.reason, 'suspended');
  assert.equal(after.flags.suspended, false);
});

test('the first frame that ends a gap also names the crossing suspended', () => {
  const f = fixture();
  f.tick();
  assert.equal(f.intent().ok, true);
  f.tick();
  advanceWall(5000);
  // No observe() during the gap: the controls update is the first reader.
  f.tick();
  const o = f.api.observe();
  assert.equal(o.control.owner, 'none');
  assert.equal(o.control.reason, 'suspended');
  assert.ok(f.ctx.frameGapMs >= 5000);
  assert.equal(o.flags.suspended, false);
});

test('a wall deadline crossed with frames running still reads expired', () => {
  const f = fixture();
  f.tick();
  assert.equal(f.intent().ok, true);
  f.tick();
  // Frames keep running while the wall clock walks past the ttl.
  for (let i = 0; i < 6; i++) { advanceWall(250); f.frame(); }
  const o = f.api.observe();
  assert.equal(o.flags.suspended, false);
  assert.equal(o.control.owner, 'none');
  assert.equal(o.control.state, 'expired');
  assert.equal(o.control.reason, 'expired');
});

test('a simulation-time expiry reads expired even while the loop is stalled', () => {
  const f = fixture();
  f.tick();
  assert.equal(f.intent().ok, true);
  // Sim time crosses the ttl before the wall clock does; then the pane hides.
  f.ctx.world.time += 1.5;
  advanceWall(5000);
  const o = f.api.observe();
  assert.equal(o.flags.suspended, true);
  assert.equal(o.control.owner, 'none');
  assert.equal(o.control.reason, 'expired');
});

test('a fresh intent after a suspended terminal is accepted and replaces the note', () => {
  const f = fixture();
  f.tick();
  assert.equal(f.intent().ok, true);
  f.tick();
  advanceWall(5000);
  assert.equal(f.api.observe().control.reason, 'suspended');
  f.tick();
  assert.equal(f.intent().ok, true);
  const o = f.api.observe();
  assert.equal(o.control.owner, 'combat');
  assert.equal(o.control.state, 'active');
  assert.equal(o.control.reason, '');
});

test('the raw manual lease has no wall clock: a stall leaves it active with its sim time intact', () => {
  const f = fixture();
  f.tick();
  const r = f.act('setControl', { seq: f.nextSeq(), ttl: 5, steerX: 0.5 });
  assert.equal(r.ok, true, JSON.stringify(r));
  f.tick();
  const before = f.api.observe().control;
  assert.equal(before.owner, 'manual');
  advanceWall(45000);
  const o = f.api.observe();
  assert.equal(o.flags.suspended, true);
  assert.equal(o.control.owner, 'manual');
  assert.equal(o.control.state, 'active');
  assert.equal(o.control.expiresIn, before.expiresIn);
});

console.log(`issue-121 suspended clock: ${checks} groups passed`);
