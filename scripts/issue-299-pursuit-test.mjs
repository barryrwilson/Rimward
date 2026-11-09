/**
 * Issue #299 — a fresh bounty target flees past targeting range before the
 * combat lease can engage. The lease could not even START past 600 u
 * (no-sample is honest and stays) and DIED the moment an active quarry
 * crossed the ceiling, so a starter hull never closed a mover.
 *
 * The fix: an active attack lease whose hull crosses the targeting ceiling
 * PURSUES on the same public HUD digest (hud.js publishes it at any range) —
 * full chase, fireBlocked 'range' — and re-arms to intercept the moment the
 * hull is inside 600 u again. A same-target renewal continues an authorized
 * pursuit past the ceiling; every acquisition refusal is unchanged.
 *
 * Fixture discipline: the issue-61 synthetic lease harness (controls.update
 * only — no ship physics) for the contract pins, and the real flight
 * integrator for the close-and-re-arm measurement. No outcome is stamped that
 * the tested code should produce.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-299-pursuit-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState, U, WEAPONS } from '../src/game/state.js';
import { localDir } from '../src/game/agent-schema.js';
import { losCloseRate } from '../src/game/los-close.js';
import { installDomStubs } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';
import { initShip } from '../src/systems/ship.js';

let checks = 0;
function test(name, run) { run(); console.log('PASS', name); checks++; }

function fixture() {
  const dom = installDomStubs(), docEvents = {};
  document.addEventListener = (name, fn) => (docEvents[name] ??= []).push(fn);
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 5000) };
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3();
  ctx.ship.speed = 80;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  const target = { id: 'pursuit-fixture', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  target.object.position.set(0, 0, -300); ctx.ships = [target]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  function sample(extra = {}) {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time, weaponGroup: ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 80, closing: 0,
      bearing: localDir(ctx.ship.object.quaternion, p.x-o.x, p.y-o.y, p.z-o.z), ...extra };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const start = (args = {}) => act('setCombatIntent', { seq: ++seq, ttl: 45, targetId: target.id, intent: 'engage', ...args });
  const status = () => agentControlStatus(ctx);
  const tick = (seconds = 1/60, fresh = true, extra = {}) => {
    ctx.world.time += seconds;
    if (fresh) sample(extra);
    controls.update(seconds);
  };
  return { ctx, target, act, start, status, tick, sample, api };
}

test('acquisition beyond the ceiling still refuses no-sample with the same detail', () => {
  const f = fixture();
  f.target.object.position.z = -(U.TARGET_RANGE + 120);
  f.sample();
  const r = f.start();
  assert.equal(r.ok, false);
  assert.equal(r.token, 'no-sample');
  assert.match(r.detail ?? '', new RegExp('target range \\d+ u exceeds targeting range ' + U.TARGET_RANGE + ' u'));
  assert.equal(f.status().owner, 'none');
});

test('a lease whose hull crosses the ceiling pursues instead of dying', () => {
  const f = fixture();
  assert.equal(f.start().ok, true);
  f.tick();
  assert.equal(f.status().owner, 'combat');
  // The hull crosses the ceiling mid-lease, digest still fresh and identity-bound.
  f.target.object.position.z = -(U.TARGET_RANGE + 200);
  f.tick();
  const s = f.status();
  assert.equal(s.owner, 'combat', 'the lease survives the range exit');
  assert.equal(s.combat.phase, 'pursuit');
  assert.equal(f.ctx.input.fireHeld, false, 'pursuit never fires');
  assert(f.ctx.input.throttle > 0, 'pursuit chases at ordinary thrust');
});

test('pursuit steering flies toward the published bearing', () => {
  const f = fixture();
  assert.equal(f.start().ok, true);
  f.tick();
  // Hull beyond the ceiling, off to the +X side: steerX must read positive (nose right).
  f.target.object.position.set(U.TARGET_RANGE + 300, 0, -(U.TARGET_RANGE + 300));
  for (let n = 0; n < 180; n++) f.tick(); // three seconds: the throttle setpoint ramps at the player 0.5/s rate
  assert.equal(f.status().combat.phase, 'pursuit');
  assert(f.ctx.input.steerX > 0, 'the chase turns toward the hull: steerX ' + f.ctx.input.steerX);
  assert(f.ctx.input.throttle >= 0.85, 'the chase closes at the ordinary cap after ramping: ' + f.ctx.input.throttle);
});

test('fire stays blocked by range during pursuit and re-arms on re-entry', () => {
  const f = fixture();
  f.target.object.position.set(0, 0, -(U.TARGET_RANGE + 150));
  assert.equal(f.start().ok, true);
  f.tick();
  assert.equal(f.status().combat.phase, 'pursuit');
  assert.equal(f.status().combat.fireBlocked, 'range', 'beyond weapon reach the block names range');
  // The hull brakes back inside the WEAPON envelope: the lease re-arms at once.
  f.target.object.position.set(0, 0, -420);
  f.tick();
  const s = f.status();
  assert.equal(s.owner, 'combat');
  assert(['intercept', 'pass'].includes(s.combat.phase), 're-entry restarts the ordinary in-envelope machinery: ' + s.combat.phase);
  assert.equal(s.combat.fireBlocked, '', 'an aligned, in-range hull arms fire again');
  assert.equal(f.ctx.input.fireHeld, true);
});

test('a stale digest during pursuit still ends the lease target-lost', () => {
  const f = fixture();
  f.target.object.position.set(0, 0, -(U.TARGET_RANGE + 150));
  assert.equal(f.start({ ttl: 10 }).ok, true);
  f.tick();
  assert.equal(f.status().combat.phase, 'pursuit');
  f.tick(1/60, false); // no fresh sample on purpose
  f.ctx.targets.aim.t -= 1;
  f.tick(1/60, false);
  assert.equal(f.status().reason, 'target-lost');
  assert.equal(f.ctx.input.fireHeld, false);
  assert.equal(f.ctx.input.throttle, 0);
});

test('roster removal and lock change during pursuit keep their meanings', () => {
  const a = fixture();
  a.target.object.position.set(0, 0, -(U.TARGET_RANGE + 150));
  assert.equal(a.start().ok, true); a.tick();
  assert.equal(a.status().combat.phase, 'pursuit');
  a.ctx.targets.current = null; a.tick(1/60, false);
  assert.equal(a.status().reason, 'target-lost');

  const b = fixture();
  b.target.object.position.set(0, 0, -(U.TARGET_RANGE + 150));
  assert.equal(b.start().ok, true); b.tick();
  b.ctx.targets.current = { ...b.target }; b.tick(1/60, false);
  assert.equal(b.status().reason, 'target-changed');

  const c = fixture();
  c.target.object.position.set(0, 0, -(U.TARGET_RANGE + 150));
  assert.equal(c.start().ok, true); c.tick();
  c.ctx.ships = []; c.tick(1/60, false);
  assert.equal(c.status().reason, 'target-lost');
});

test('withdrawal intents keep the old range-exit endings', () => {
  const r = fixture();
  r.target.object.position.z = 450; r.sample({ closing: 5 });
  assert.equal(r.start({ intent: 'retreat' }).ok, true);
  r.tick(1/60, true, { closing: 5 });
  r.target.object.position.z = U.TARGET_RANGE + 100; r.sample({ closing: 5 });
  r.tick();
  assert.equal(r.status().reason, 'retreated', 'a retreat whose target leaves sensor range completes');

  const b = fixture();
  b.target.object.position.set(0, 0, -(U.TARGET_RANGE + 150));
  assert.equal(b.start().ok, true); b.tick();
  assert.equal(b.status().combat.phase, 'pursuit');
  // A defense withdrawal latch ends the pursuit through the pre-existing branch.
  b.ctx.lastEvents = [{ type: 'playerHit', damage: 90, family: 'energy', t: b.ctx.world.time }];
  b.ctx.player.hull = 10; // critical: the withdrawal latch
  b.tick();
  b.tick(1/60, false); // the latched withdrawal drops the lease on the next applied frame
  assert.notEqual(b.status().owner, 'combat', 'a critical withdrawal ends the pursuit lease');
});

test('a live pursuit may be renewed past the ceiling; a fresh grant may not', () => {
  const f = fixture();
  f.target.object.position.set(0, 0, -(U.TARGET_RANGE + 150));
  assert.equal(f.start({ ttl: 3 }).ok, true);
  f.tick();
  assert.equal(f.status().combat.phase, 'pursuit');
  // Same-target renewal of the authorized pursuit: accepted beyond the ceiling.
  const renew = f.start({ ttl: 30 });
  assert.equal(renew.ok, true, 'an authorized pursuit continues: ' + JSON.stringify(renew));
  f.tick();
  assert.equal(f.status().combat.phase, 'pursuit');
  // End the lease, then a FRESH acquisition beyond the ceiling refuses again.
  f.act('clearControl');
  const fresh = f.start({ ttl: 30 });
  assert.equal(fresh.ok, false);
  assert.equal(fresh.token, 'no-sample');
});

test('surrendered and destroyed hulls end a pursuit exactly as before', () => {
  const a = fixture();
  a.target.object.position.set(0, 0, -(U.TARGET_RANGE + 150));
  assert.equal(a.start().ok, true); a.tick();
  a.target.state.surrendered = true; a.tick(1/60, false);
  assert.equal(a.status().reason, 'target-surrendered');
  const b = fixture();
  b.target.object.position.set(0, 0, -(U.TARGET_RANGE + 150));
  assert.equal(b.start().ok, true); b.tick();
  b.target.state.destroyed = true; b.tick(1/60, false);
  assert.equal(b.status().reason, 'target-destroyed');
});

test('real flight closes on a braking runner and re-arms inside the envelope', () => {
  const f = fixture(), ctx = f.ctx;
  ctx.config.world.shipSpawn = new THREE.Vector3(); ctx.config.world.stationPosition = new THREE.Vector3(5000, 5000, 5000);
  const flight = initShip(ctx);
  // The runner starts inside the ceiling at speed, crosses it while fleeing,
  // then brakes to a stop; the lease must survive the exit, pursue, re-arm.
  ctx.ship.velocity.set(0, 0, -100); ctx.ship.speed = 100; ctx.input.throttle = 0.9;
  f.target.object.position.set(0, 0, -500);
  f.sample();
  assert.equal(f.start({ ttl: 60 }).ok, true);
  f.target.object.position.set(0, 0, -(U.TARGET_RANGE + 500));
  f.tick();
  let sawPursuit = false, minPursuitRange = Infinity, reArmed = null;
  for (let n = 0; n < 40 * 60; n++) {
    f.tick(1/60, true, { speed: 0, closing: losCloseRate(ctx.ship.object.position, f.target.object.position, { x: 0, y: 0, z: 100 }) });
    const s = f.status();
    if (s.owner !== 'combat') throw Error('lease dropped at ' + n / 60 + 's: ' + s.reason);
    if (s.combat.phase === 'pursuit') { sawPursuit = true; minPursuitRange = Math.min(minPursuitRange, f.ctx.targets.aim.dist); }
    if (s.combat.phase === 'intercept' && sawPursuit && f.ctx.targets.aim.dist <= U.TARGET_RANGE) { reArmed = n / 60; break; }
    flight.update(1/60);
    // The runner cruises away for the first stretch, then brakes hard.
    if (n < 10 * 60) f.target.object.position.z -= 120 / 60;
    // after that it sits (braked at its refuge)
  }
  assert(sawPursuit, 'the lease pursued beyond the ceiling');
  assert(minPursuitRange > U.TARGET_RANGE, 'pursuit operated outside the envelope');
  assert(reArmed !== null, 'the lease re-armed once the runner was back inside');
  assert(f.status().combat.phase === 'intercept' || f.status().combat.phase === 'pass', 'ordinary in-envelope machinery resumed');
});

console.log('issue-299 pursuit: ' + checks + ' checks passed');
