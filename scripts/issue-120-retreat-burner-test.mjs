/** Issue #120: a withdrawal intent may hold the afterburner.
 * `setCombatIntent { intent: 'retreat'|'break-off', burner: true }` lets the
 * controller start and hold the ordinary burner once the nose is off the
 * pursuer, bounded by the same power/cooldown/burn-time/clearance rules a
 * Space press gets. Default off; attack intents refuse the flag; the raw
 * `afterburner` pulse still answers `helm` under a combat lease, now with a
 * detail naming the permission. Synthetic contact and HUD digest; the real
 * controls update and the public v2 dispatcher apply every request. ship.js
 * does not run here, so the tests drive the public burner gauges by hand and
 * assert the controller's input request (afterburnerPressed edge and
 * agentBurnerHeld hold), which is exactly what ship.js consumes.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState, POWER } from '../src/game/state.js';
import { localDir } from '../src/game/agent-schema.js';
import { installDomStubs } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';
import { COMMAND_SPECS } from '../src/game/agent-schema.js';

let checks = 0;
function test(name, run) { run(); console.log('PASS', name); checks++; }

function fixture({ aft = true, closing = -10 } = {}) {
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
  // The playtest geometry: an ace pacing the retreat from dead astern.
  target.object.position.set(0, 0, aft ? 300 : -300); ctx.ships = [target]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  const f = { closing };
  function sample() {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time, weaponGroup: ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 80, closing: f.closing,
      bearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z) };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const tick = (seconds = 1 / 60) => { ctx.world.time += seconds; sample(); controls.update(seconds); };
  const status = () => agentControlStatus(ctx);
  const intent = (extra = {}) => act('setCombatIntent', { seq: ++seq, ttl: 60, targetId: target.id, intent: 'retreat', defense: 'evade', ...extra });
  /** What ship.js does on an accepted edge with the hold: the burn starts. */
  const engage = () => { assert.equal(ctx.input.afterburnerPressed, true); assert.equal(ctx.input.agentBurnerHeld, true); ctx.ship.burnerActive = true; };
  /** What ship.js does when the burn time ends or the hold is released. */
  const cutoff = () => { ctx.ship.burnerActive = false; ctx.ship.burnerReadyAt = ctx.world.time + ctx.config.ship.afterburner.cooldown; };
  const burner = () => status().combat.burner;
  Object.assign(f, { ctx, target, api, act, tick, status, intent, engage, cutoff, burner, nextSeq: () => ++seq });
  return f;
}

test('burner is optional, boolean, and only for withdrawal intents', () => {
  const f = fixture();
  let r = f.intent({ burner: 'yes' });
  assert.equal(r.token, 'bad-args'); assert.match(r.detail, /burner must be a boolean/);
  r = f.intent({ intent: 'engage', burner: true });
  assert.equal(r.token, 'bad-args'); assert.match(r.detail, /only with intent 'break-off'\|'retreat'/);
  r = f.intent({ intent: 'disable', burner: true });
  assert.equal(r.token, 'bad-args');
  r = f.intent({ burn: true });
  assert.equal(r.token, 'bad-args'); assert.match(r.detail, /unknown argument burn/);
  assert.equal(f.api.observe().control.owner, 'none');
  // Attack intents may carry burner: false and simply never burn.
  assert.equal(f.intent({ intent: 'engage', burner: false }).ok, true);
  f.tick();
  assert.deepEqual(f.burner(), { allowed: false, held: false, blocked: 'not-allowed' });
});

test('the default is unchanged: a retreat without the flag never requests the burner', () => {
  const f = fixture();
  assert.equal(f.intent().ok, true);
  for (let i = 0; i < 60; i++) f.tick();
  assert.equal(f.ctx.input.afterburnerPressed, false);
  assert.equal(f.ctx.input.agentBurnerHeld, false);
  const o = f.api.observe();
  assert.equal(o.control.combat.phase, 'retreat');
  assert.deepEqual(o.control.combat.burner, { allowed: false, held: false, blocked: 'not-allowed' });
});

test('a permitted retreat with the pursuer astern requests the edge, holds, and rides the ship burn to its cutoff', () => {
  const f = fixture();
  const r = f.intent({ burner: true });
  assert.equal(r.ok, true); assert.equal(r.owner, 'combat');
  f.tick();
  assert.equal(f.status().combat.phase, 'retreat');
  assert.deepEqual(f.burner(), { allowed: true, held: true, blocked: '' });
  f.engage();
  f.tick();
  // No second edge while the burn runs; the hold stays.
  assert.equal(f.ctx.input.afterburnerPressed, false);
  assert.equal(f.ctx.input.agentBurnerHeld, true);
  assert.equal(f.api.observe().control.combat.burner.held, true);
  // The pursuer falls behind during the burn: an owned burn is not cut short.
  f.closing = 60; f.tick();
  assert.equal(f.ctx.input.agentBurnerHeld, true);
  assert.equal(f.burner().blocked, '');
  // ship.js ends the burn on its own clock: cooldown holds the next request.
  f.cutoff(); f.tick();
  assert.equal(f.ctx.input.agentBurnerHeld, false);
  assert.equal(f.ctx.input.afterburnerPressed, false);
  assert.deepEqual(f.burner(), { allowed: true, held: false, blocked: 'cooldown' });
  // Once separating, the cooldown ending is not enough: no burn is spent.
  f.tick(f.ctx.config.ship.afterburner.cooldown);
  assert.deepEqual(f.burner(), { allowed: true, held: false, blocked: 'separating' });
  // The pursuer closes again: a second burn is requested through the same gate.
  f.closing = -5; f.tick();
  assert.deepEqual(f.burner(), { allowed: true, held: true, blocked: '' });
  assert.equal(f.ctx.input.afterburnerPressed, true);
});

test('break-off accepts the flag with the same rule', () => {
  const f = fixture();
  assert.equal(f.intent({ intent: 'break-off', burner: true }).ok, true);
  f.tick();
  assert.equal(f.status().combat.phase, 'break-off');
  assert.deepEqual(f.burner(), { allowed: true, held: true, blocked: '' });
});

test('each unmet condition is named and requests nothing', () => {
  let f = fixture({ aft: false });
  assert.equal(f.intent({ burner: true }).ok, true); f.tick();
  assert.equal(f.burner().blocked, 'alignment', 'nose still on the pursuer');
  assert.equal(f.ctx.input.agentBurnerHeld, false);
  f = fixture({ closing: 40 });
  assert.equal(f.intent({ burner: true }).ok, true); f.tick();
  assert.equal(f.burner().blocked, 'separating');
  f = fixture();
  f.ctx.player.power = POWER.afterburnerMin - 1;
  assert.equal(f.intent({ burner: true }).ok, true); f.tick();
  assert.equal(f.burner().blocked, 'power');
  f = fixture();
  f.ctx.ship.burnerReadyAt = f.ctx.world.time + 5;
  assert.equal(f.intent({ burner: true }).ok, true); f.tick();
  assert.equal(f.burner().blocked, 'cooldown');
  f = fixture();
  f.ctx.ship.driftActive = true; f.ctx.input.driftHeld = false;
  assert.equal(f.intent({ burner: true }).token, 'helm', 'a live human drift still refuses acquisition');
  f.ctx.ship.driftActive = false;
  assert.equal(f.intent({ burner: true }).ok, true); f.tick();
  f.ctx.ship.driftActive = true; f.tick();
  assert.equal(f.burner().blocked, 'drift');
  f = fixture();
  assert.equal(f.intent({ burner: true, ttl: 1 }).ok, true); f.tick();
  assert.equal(f.burner().blocked, 'authorization');
  assert.equal(f.ctx.input.afterburnerPressed, false);
  f = fixture();
  f.ctx.player.engineOut = true;
  assert.equal(f.intent({ burner: true }).ok, true); f.tick();
  assert.equal(f.burner().blocked, 'engine');
});

test('a body inside the boosted lookahead blocks the burn even when ordinary steering is clear', () => {
  const f = fixture();
  // The sun sits 330 u ahead: outside the 80 u/s steering lookahead, inside
  // the 240 u/s burn lookahead. No burn starts toward it.
  f.ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, -330), sunRadius: 40 };
  assert.equal(f.intent({ burner: true }).ok, true); f.tick();
  assert.equal(f.status().combat.movementBlocked, '');
  assert.deepEqual(f.burner(), { allowed: true, held: false, blocked: 'obstructed' });
  assert.equal(f.ctx.input.afterburnerPressed, false);
  // Move the sun clear: the request follows on the next tick.
  f.ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 9000) };
  f.tick();
  assert.deepEqual(f.burner(), { allowed: true, held: true, blocked: '' });
});

test('an owned burn survives renewal; revoking the permission releases it; a human burn still refuses', () => {
  const f = fixture();
  assert.equal(f.intent({ burner: true }).ok, true); f.tick(); f.engage(); f.tick();
  assert.equal(f.ctx.input.agentBurnerHeld, true);
  // Same maneuver renewed with the permission: not a foreign burner (no helm).
  const r = f.intent({ burner: true });
  assert.equal(r.ok, true); assert.equal(r.token, '');
  f.tick();
  assert.equal(f.ctx.input.agentBurnerHeld, true);
  assert.equal(f.burner().held, true);
  // Revoke on renewal: the hold drops on the next applied tick and ship.js
  // would cut the burn through its ordinary cutoff.
  assert.equal(f.intent({ burner: false }).ok, true);
  f.tick();
  assert.equal(f.ctx.input.agentBurnerHeld, false);
  assert.deepEqual(f.burner(), { allowed: false, held: false, blocked: 'not-allowed' });
  f.cutoff();
  // Grant again on the same live maneuver after the cooldown: still one session.
  f.tick(f.ctx.config.ship.afterburner.cooldown + 0.1);
  assert.equal(f.intent({ burner: true }).ok, true); f.tick();
  assert.equal(f.burner().held, true);
  // A burner nobody in the session requested is a human flight setting.
  const h = fixture();
  h.ctx.ship.burnerActive = true;
  assert.equal(h.intent({ burner: true }).token, 'helm');
});

test('the raw afterburner pulse still answers helm under a combat lease, with a detail naming the permission', () => {
  const f = fixture();
  assert.equal(f.intent().ok, true); f.tick();
  const r = f.act('afterburner');
  assert.equal(r.ok, false); assert.equal(r.token, 'helm');
  assert.match(r.detail, /burner: true/);
  assert.equal(f.ctx.input.afterburnerPressed, false);
  assert.equal(f.api.observe().control.owner, 'combat');
});

test('release ends the hold and the completed view carries no held burner', () => {
  const f = fixture();
  assert.equal(f.intent({ burner: true }).ok, true); f.tick(); f.engage(); f.tick();
  assert.equal(f.act('clearControl').ok, true);
  assert.equal(f.ctx.input.agentBurnerHeld, false);
  assert.equal(f.ctx.input.afterburnerPressed, false);
  const o = f.api.observe();
  assert.equal(o.control.owner, 'none');
  assert.equal(o.control.combat.burner.held, false);
  assert.equal(o.control.combat.burner.allowed, true);
  assert.equal(o.flags.fullStop, true);
});

test('the manifest documents the flag, the view and every block token', () => {
  const m = COMMAND_SPECS.setCombatIntent;
  assert.match(m.args.burner, /optional boolean/);
  assert.deepEqual([...m.burnerBlocks], ['', 'not-allowed', 'engine', 'obstructed', 'drift', 'power', 'cooldown', 'alignment', 'separating', 'authorization']);
  assert.match(m.burner.view, /combat\.burner/);
});

console.log(`issue-120 retreat burner: ${checks} groups passed`);
