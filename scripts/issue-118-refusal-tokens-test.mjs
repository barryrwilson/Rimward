/** Issue #118: setCombatIntent refusals name their cause.
 * The old `target-lost` folded five preconditions into one token. Now a runner
 * can tell "select the hull first" (stale-lock) from "not a ship lock"
 * (lock-kind) from "wait one rendered HUD frame" (no-sample) from "the hull
 * left the roster" (target-lost). Argument refusals carry a `detail` string
 * naming the failing field. Synthetic contact and HUD digest; the real
 * controls update and the public v2 dispatcher apply every request.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState, U } from '../src/game/state.js';
import { localDir, capabilityManifest, actResult } from '../src/game/agent-schema.js';
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
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3(); ctx.ship.speed = 66;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  // The playtest geometry: Watchful Apt, 215 u ahead, fresh lock, group 1.
  const target = { id: 'rec-13', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  target.object.position.set(0, 0, -215);
  const other = { id: 'rec-6', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  other.object.position.set(60, 0, -273);
  ctx.ships = [target, other]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  /** Write the HUD digest the way hud.js does once per rendered frame. */
  function sample(of = ctx.targets.current, extra = {}) {
    const p = of.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: of.id, system: ctx.world.currentSystem, t: ctx.world.time, weaponGroup: ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 0, closing: 0,
      bearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z), ...extra };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const tick = (seconds = 1 / 60, fresh = true) => { ctx.world.time += seconds; if (fresh) sample(); controls.update(seconds); };
  const status = () => agentControlStatus(ctx);
  const intent = (extra = {}) => act('setCombatIntent', { seq: ++seq, ttl: 40, targetId: target.id, intent: 'engage', defense: 'evade', ...extra });
  return { ctx, target, other, api, act, tick, status, intent, sample, nextSeq: () => ++seq };
}

function refused(r, token) {
  assert.equal(r.ok, false);
  assert.equal(r.token, token);
  assert.equal(r.error, token, 'error stays the token');
  assert.equal(typeof r.detail, 'string', 'detail is present');
  assert.ok(r.detail.length > 0, 'detail is not empty');
  return r.detail;
}

test('the playtest lock is accepted once the HUD digest is fresh', () => {
  const f = fixture();
  const r = f.intent();
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(Object.hasOwn(r, 'detail'), false, 'success carries no detail');
  assert.equal(f.status().owner, 'combat');
});

test('a fresh lock with no digest yet refuses no-sample and names the frame wait', () => {
  const f = fixture();
  // selectTarget moves the lock; hud.js has not rendered since.
  assert.equal(f.act('selectTarget', { id: 'rec-6' }).ok, true);
  assert.equal(f.ctx.targets.current, f.other);
  const detail = refused(f.intent({ targetId: 'rec-6' }), 'no-sample');
  assert.match(detail, /rec-13/); assert.match(detail, /rec-6/); assert.match(detail, /rendered HUD frame/);
  assert.equal(f.status().owner, 'none', 'no lease was taken');
  // One rendered frame later the same request is accepted.
  f.tick();
  assert.equal(f.intent({ targetId: 'rec-6' }).ok, true);
});

test('no digest at all refuses no-sample', () => {
  const f = fixture(); f.ctx.targets.aim = null;
  assert.match(refused(f.intent(), 'no-sample'), /no HUD aim digest/);
});

test('a stale digest (suspended frames) refuses no-sample with the age', () => {
  const f = fixture(); f.ctx.world.time += 1.5;
  assert.match(refused(f.intent(), 'no-sample'), /age 1\.50 s/);
});

test('a digest for another weapon group refuses no-sample and names setWeaponGroup', () => {
  const f = fixture(); f.ctx.input.weaponGroup = 2;
  const detail = refused(f.intent(), 'no-sample');
  assert.match(detail, /weapon group 1, not 2/); assert.match(detail, /setWeaponGroup/);
});

test('a hull beyond targeting range refuses no-sample with the range', () => {
  const f = fixture(); f.target.object.position.z = -(U.TARGET_RANGE + 40); f.sample();
  assert.match(refused(f.intent(), 'no-sample'), new RegExp(`${U.TARGET_RANGE + 40} u exceeds targeting range ${U.TARGET_RANGE} u`));
});

test('an id that is not the current lock refuses stale-lock', () => {
  const f = fixture();
  assert.match(refused(f.intent({ targetId: 'rec-6' }), 'stale-lock'), /current lock is rec-13, not rec-6/);
  f.ctx.targets.current = null;
  assert.match(refused(f.intent({ targetId: 'rec-6' }), 'stale-lock'), /no current lock; selectTarget rec-6/);
});

test('a rock, pod or station lock refuses lock-kind', () => {
  for (const [lock, word] of [
    [{ position: new THREE.Vector3(0, 0, -100) }, 'rock'],
    [{ id: 'pod-4', lockKind: 'pod', position: new THREE.Vector3(0, 0, -100) }, 'pod'],
    [{ id: 'station', lockKind: 'station', position: new THREE.Vector3(0, 0, -100) }, 'station'],
  ]) {
    const f = fixture(); f.ctx.targets.current = lock;
    assert.match(refused(f.intent({ targetId: lock.id || 'rec-13' }), 'lock-kind'), new RegExp(`current lock is a ${word}, not a ship`));
  }
});

test('target-lost is kept for a hull that left the roster', () => {
  const f = fixture(); f.ctx.ships = [f.other];
  assert.match(refused(f.intent(), 'target-lost'), /rec-13 is no longer in the live roster/);
  const g = fixture(); g.target.object = null;
  assert.equal(g.intent().token, 'target-lost');
});

test('argument refusals carry the failing field in detail', () => {
  const f = fixture();
  const cases = [
    [{ defense: 'none' }, 'bad-args', /defense must be 'evade'\|'break-off'\|'off'/],
    [{ intent: 'keepFiring' }, 'bad-args', /intent must be/],
    [{ targetId: '' }, 'bad-args', /targetId must be a non-empty string/],
    [{ burner: true }, 'bad-args', /unknown argument burner/],
    [{ ttl: 61 }, 'bad-ttl', /ttl must be a number in 1\.\.60/],
    [{ seq: 0 }, 'bad-seq', /seq must be a safe integer/],
  ];
  for (const [extra, token, re] of cases) {
    const r = f.intent(extra);
    assert.match(refused(r, token), re, JSON.stringify(r));
    assert.equal(f.status().owner, 'none');
  }
  const missing = f.act('setCombatIntent', { seq: f.nextSeq(), ttl: 40, intent: 'engage' });
  assert.match(refused(missing, 'bad-args'), /missing required argument targetId/);
  const stale = f.intent({ seq: 1 });
  assert.equal(f.intent().ok, true);
  assert.match(refused(f.intent({ seq: 1 }), 'stale'), /seq must exceed/);
  void stale;
});

test('setControl argument refusals carry detail too', () => {
  const f = fixture();
  assert.match(refused(f.act('setControl', { seq: f.nextSeq(), steerX: 2 }), 'bad-axis'), /steerX must be a number in -1\.\.1/);
  assert.match(refused(f.act('setControl', { seq: f.nextSeq(), throttle: 1.5 }), 'bad-throttle'), /throttle must be a number in 0\.\.1/);
  assert.match(refused(f.act('setControl', { seq: f.nextSeq(), ttl: 99 }), 'bad-ttl'), /ttl must be a number in/);
  assert.match(refused(f.act('setControl', { seq: f.nextSeq(), fire: true }), 'bad-args'), /unknown argument fire/);
});

test('detail does not leak across receipts and lastIntent mirrors it', () => {
  const f = fixture();
  const bad = f.intent({ defense: 'none' });
  assert.equal(typeof bad.detail, 'string');
  assert.equal(f.api.observe().lastIntent.detail, bad.detail);
  const good = f.intent();
  assert.equal(good.ok, true);
  assert.equal(Object.hasOwn(good, 'detail'), false);
  assert.equal(Object.hasOwn(f.api.observe().lastIntent, 'detail'), false);
  // A refusal from a helper without a detail (opt-in gate) carries none.
  f.act('clearControl'); f.tick();
  f.ctx.agent.optIn = false;
  const gated = f.api.act({ v: 2, name: 'setCombatIntent', args: { seq: f.nextSeq(), ttl: 40, targetId: 'rec-13', intent: 'engage' } });
  assert.equal(gated.ok, false);
  assert.equal(Object.hasOwn(gated, 'detail'), false, JSON.stringify(gated));
});

test('actResult filters detail like the other strings', () => {
  assert.equal(Object.hasOwn(actResult({ ok: false, name: 'x', token: 'bad-args' }), 'detail'), false);
  assert.equal(Object.hasOwn(actResult({ ok: false, name: 'x', token: 'bad-args', detail: { a: 1 } }), 'detail'), false);
  assert.equal(actResult({ ok: false, name: 'x', token: 'bad-args', detail: 'why' }).detail, 'why');
  assert.equal(JSON.stringify(actResult({ ok: false, name: 'x', token: 'bad-args', detail: 'why' })).includes('"detail":"why"'), true);
});

test('the manifest lists the split tokens and the frame rule', () => {
  const m = capabilityManifest();
  const spec = m.commands.setCombatIntent;
  for (const t of ['lock-kind', 'stale-lock', 'no-sample', 'target-lost']) {
    assert.ok(spec.refusalReasons.includes(t), t);
    assert.equal(typeof spec.targetRefusals[t], 'string');
  }
  assert.match(spec.targetRefusals['no-sample'], /one rendered frame/);
  assert.match(m.commands.selectTarget.note, /one rendered HUD frame/);
  assert.ok(Object.isFrozen(spec.targetRefusals));
  assert.equal(typeof spec.detail, 'string');
});

console.log(`issue-118 refusal tokens: ${checks} groups passed`);
