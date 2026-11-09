/** Issue #300 — helm-lease steering feedback: steer echo + documented signs.
 *
 * Real boot (scripts/lib/boot-harness.mjs fixture style of issue-103): the real
 * installed controls system, the real public window.rimward act/observe
 * pipeline. No copied lease logic.
 *
 * Covered:
 *   1  while a raw lease is live, observe().control echoes the accepted command
 *      (steerX/steerY raw, strafeX/strafeY, roll, throttle) exactly as sent
 *   2  an omitted axis echoes 0; an omitted/null throttle echoes null; a
 *      combat lease publishes its own view and carries no echo
 *   3  after clearControl/expiry the echo is gone (owner 'none' shape unchanged)
 *   4  the documented sign mapping converges: flying by
 *      steerX = k*bearing.x, steerY = -k*bearing.y from observe() alone turns
 *      the ship-local bearing error toward zero through the real flight loop
 *   5  the capability manifest's setControl note documents the sign convention
 *      (bearing y up-positive, steerY down-positive, the negation rule)
 *   6  the control block stays JSON-plain
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-300-helm-heading-feedback-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState } from '../src/game/state.js';
import { localDir, COMMAND_SPECS } from '../src/game/agent-schema.js';
import { installDomStubs, seedBootRandom } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus, agentControlClear } from '../src/systems/controls.js';
import { initShip } from '../src/systems/ship.js';
import { initAgentApi } from '../src/systems/agent-api.js';

let pins = 0;
function pin(name, run) { run(); pins++; console.log('PASS', name); }

const DT = 1 / 60;

seedBootRandom();

function fixture() {
  const dom = installDomStubs();
  document.addEventListener = () => {};
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 5000), sunRadius: 0, shipSpawn: new THREE.Vector3(), stationPosition: new THREE.Vector3(5000, 5000, 5000) };
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3();
  ctx.ship.speed = 0;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  ctx.ships = []; ctx.targets.current = null;
  const controls = initControls(ctx);
  initAgentApi(ctx);
  const flight = initShip(ctx);
  const api = window.rimward;
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const observe = () => api.observe();
  const tick = (n = 1) => {
    for (let i = 0; i < n; i++) {
      ctx.world.time += DT;
      controls.update(DT);
      flight.update(DT);
    }
  };
  return { ctx, api, act, observe, tick, dom };
}

// 1 — the echo matches the accepted command exactly.
pin('raw lease echoes the accepted axes on observe().control', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 2, steerX: 0.5, steerY: -0.25, roll: 0.1, throttle: 0.4 }).ok, true);
  const c = f.observe().control;
  assert.equal(c.owner, 'manual');
  assert.equal(c.state, 'active');
  assert.equal(c.steerX, 0.5);
  assert.equal(c.steerY, -0.25);
  assert.equal(c.strafeX, 0);
  assert.equal(c.strafeY, 0);
  assert.equal(c.roll, 0.1);
  assert.equal(c.throttle, 0.4);
});

// 2a — omitted axis echoes 0, omitted throttle echoes null; 2b — combat view, no echo.
pin('omitted axes echo 0 and an omitted throttle echoes null', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 2, steerX: 1 }).ok, true);
  const c = f.observe().control;
  assert.equal(c.steerX, 1);
  assert.equal(c.steerY, 0);
  assert.equal(c.roll, 0);
  assert.equal(c.throttle, null);
});

pin('a combat lease keeps its own view and carries no steer echo', () => {
  const f = fixture();
  // Fixture target for the HUD aim digest the combat grant needs.
  const target = { id: 'i300-quarry', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  target.object.position.set(0, 0, -300);
  f.ctx.ships = [target]; f.ctx.targets.current = target;
  f.ctx.targets.aim = {
    targetId: target.id, system: f.ctx.world.currentSystem, t: f.ctx.world.time,
    weaponGroup: f.ctx.input.weaponGroup, dist: 300, speed: 0, closing: 0,
    bearing: localDir(f.ctx.ship.object.quaternion, 0, 0, -300),
  };
  assert.equal(f.act('setCombatIntent', { seq: 1, ttl: 30, targetId: 'i300-quarry', intent: 'engage' }).ok, true);
  const c = f.observe().control;
  assert.equal(c.owner, 'combat');
  assert.equal(c.state, 'active');
  assert.equal(c.steerX, undefined);
  assert.equal(c.steerY, undefined);
  assert.ok(c.combat);
});

// 3 — after clearControl the echo is gone; the idle shape is unchanged.
pin('clearControl ends the echo with the unchanged idle shape', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5, steerX: 0.5, throttle: 0.5 }).ok, true);
  assert.equal(f.act('clearControl').ok, true);
  const c = f.observe().control;
  assert.equal(c.owner, 'none');
  assert.equal(c.state, 'cleared');
  assert.equal(c.steerX, undefined);
  assert.equal(c.steerY, undefined);
  assert.equal(c.throttle, undefined);
});

pin('lease expiry ends the echo the same way', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 0.05, steerX: 0.5 }).ok, true);
  f.tick(6); // > 0.1 s of sim time
  const c = f.observe().control;
  assert.equal(c.owner, 'none');
  assert.equal(c.state, 'expired');
  assert.equal(c.steerX, undefined);
});

// 4 — the documented mapping converges through the real flight loop, reading
// only the public observe() surface. No trial-and-error sign test: the sign
// rule comes from the capability note under test.
pin('the documented bearing-to-steer mapping converges from observe() alone', () => {
  const f = fixture();
  // A station far off the nose to the upper right.
  f.ctx.station = {
    inZone: false, name: 'fixture station', systemName: 'fixture',
    position: new THREE.Vector3(4000, 3000, -4000),
  };
  f.ctx.ship.object.quaternion.identity();
  const gain = 2;
  let seq = 0;
  let worst = 0;
  for (let step = 0; step < 12; step++) {
    const obs = f.observe();
    const b = obs.station.bearing;
    assert.ok(Array.isArray(b) && b.every(Number.isFinite), 'station.bearing is a finite unit vector');
    worst = Math.max(worst, Math.hypot(b[0], b[1]));
    assert.ok(obs.control.owner === 'none' || obs.control.expiresIn > 0, 'lease is live or between grants');
    seq += 1;
    assert.equal(f.act('setControl', {
      seq, ttl: 0.5,
      steerX: Math.max(-1, Math.min(1, gain * b[0])),
      steerY: Math.max(-1, Math.min(1, -gain * b[1])),
    }).ok, true);
    f.tick(30);
  }
  const b = f.observe().station.bearing;
  assert.ok(Math.hypot(b[0], b[1]) < 0.05,
    `documented mapping did not converge: lateral bearing error ${Math.hypot(b[0], b[1])}`);
  assert.ok(worst > 0.2, 'fixture started meaningfully off-bearing');
});

// 5 — the capability note documents the sign convention.
pin('the setControl capability note documents the sign convention and the echo', () => {
  const note = COMMAND_SPECS.setControl.note;
  for (const phrase of [
    'Issue #300',
    'y up, nose -z',
    'steerY positive pitches nose DOWN',
    'steerX = clamp(k * bearing[0])',
    'steerY = clamp(-k * bearing[1])',
    'bearing[2] < 0',
    'echoes the accepted command',
    'throttle (null',
  ]) assert.ok(note.includes(phrase), `note lacks: ${phrase}`);
  const steerYArg = COMMAND_SPECS.setControl.args.steerY;
  assert.ok(steerYArg.includes('nose down'), 'steerY arg keeps its down-positive wording');
});

// 6 — the control block stays JSON-plain.
pin('the control block stays JSON-plain with the echo', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 2, steerX: 0.5, steerY: -0.5, throttle: 0.25 }).ok, true);
  const obs = f.observe();
  const round = JSON.parse(JSON.stringify(obs.control));
  assert.deepEqual(round, obs.control);
  assert.equal(agentControlClear(f.ctx), '');
});

console.log(`BOOT TEST PASS (${pins} pins)`);
