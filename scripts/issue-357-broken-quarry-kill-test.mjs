/**
 * Issue #357 — the engage lease finishes a broken, non-surrendered contract
 * quarry, and a persistent fireBlocked 'alignment' can no longer stall it.
 *
 * The #331 playtest: an engage lease locked the accepted bounty-ace (Carver
 * Illyx) and renewed for 92 minutes while the quarry sat at hull 1, never
 * disabled, never surrendered. The strict fire cone (bearing z <= -0.97 and
 * lead error <= 0.20 rad) cannot be held against a quarry that keeps its own
 * standoff and weaves, the ordinary throttle law clamps to its creep floor at
 * that range, and nothing bounded the block — 1,702 of 1,740 engaged samples
 * read 'alignment', zero shots were fired, 0 of 2,500 UU paid.
 *
 * The fix, three bounded pieces inside the lease (session-only state):
 * 1. an accepted hunt/bounty row binds its quarry the way #325 war rows do,
 *    so the lease keeps firing through the broken states until the kill;
 * 2. after ALIGN_CLOSE_DWELL of continuous alignment blocking the lease
 *    spends the thrust that raises the turn rate and closes the standoff;
 * 3. after ALIGN_FIRE_DWELL the cone falls back to the documented contract
 *    (AgentCombatIntentDesign.md: the target is not astern, z <= 0.7, lead
 *    forward), dropping only the 0.20 rad lead-precision term.
 *
 * Fixture discipline: the #61/#325 synthetic lease harness (controls.update
 * only, no ship physics). The off-nose static case is deterministic precisely
 * because the fixture never rotates the nose: the strict cone stays closed
 * and only the bounded dwell can open it. No outcome is stamped that the
 * tested code should produce.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-357-broken-quarry-kill-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState } from '../src/game/state.js';
import { localDir } from '../src/game/agent-schema.js';
import { isKillContractQuarry } from '../src/game/prize.js';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';

let checks = 0;
async function check(label, fn) {
  await fn();
  checks++;
  console.log('PASS', label);
}

const OFF_NOSE = 40 * Math.PI / 180; // off the nose, inside the documented 0.7 cone, outside the strict one
const QUARRY = { id: 'ace-fixture', name: 'Carver Illyx' };

const huntJob = (recordId, state) => ({
  id: 'hunt-fixture-0', kind: 'hunt', slot: 0, originSystem: 'fixture',
  recordId, target: QUARRY.name, state,
});
const bountyJob = (name, state) => ({
  id: 'bounty-ace', kind: 'bounty', target: name, state, progress: 0, need: 1,
});

/** The #325 combat-lease fixture, parameterized for the #357 geometry. */
function fixture(opts = {}) {
  installDomStubs();
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 5000) };
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3();
  ctx.ship.speed = 80;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  const record = { id: QUARRY.id, name: QUARRY.name };
  const target = { id: QUARRY.id, record, object: new THREE.Object3D(), state: createShipState('light') };
  const dist = opts.dist ?? 300;
  if (opts.offNose) target.object.position.set(Math.sin(OFF_NOSE) * dist, 0, -Math.cos(OFF_NOSE) * dist);
  else target.object.position.set(0, 0, -dist);
  // The observed broken ace: hull 1, never disabled, never surrendered.
  target.state.hull = 1;
  if (opts.disabled) target.state.disabled = true;
  if (opts.surrendered) target.state.surrendered = true;
  ctx.ships = [target]; ctx.targets.current = target;
  ctx.world.jobs = opts.jobs ?? [];
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  function sample() {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time,
      weaponGroup: ctx.input.weaponGroup, dist: p.distanceTo(o), speed: 80, closing: 0,
      bearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z),
      leadBearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z) };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const start = (args = {}) => act('setCombatIntent', { seq: ++seq, ttl: 45, targetId: target.id, intent: 'engage', ...args });
  const status = () => agentControlStatus(ctx);
  const tick = (seconds = 1 / 60, fresh = true) => {
    ctx.world.time += seconds;
    if (fresh) sample();
    controls.update(seconds);
  };
  return { ctx, target, record, act, start, status, tick, sample };
}

// ---------------------------------------------------------------------------
// 0. The kill-contract bind is record/name precise and fails closed.
// ---------------------------------------------------------------------------
await check('isKillContractQuarry binds accepted war/hunt/bounty rows and fails closed', () => {
  assert.equal(isKillContractQuarry({}, { id: 'r1' }), false, 'missing world/jobs fails closed');
  assert.equal(isKillContractQuarry({ world: { jobs: [] } }, null), false, 'missing rec fails closed');
  const war = (state) => [{ kind: 'war', state, recordId: 'r1' }];
  const hunt = (state) => [{ kind: 'hunt', state, recordId: 'r1' }];
  const bounty = (state, name = 'Carver Illyx') => [{ kind: 'bounty', state, target: name }];
  const ctxWith = (jobs) => ({ world: { jobs } });
  assert.equal(isKillContractQuarry(ctxWith(war('accepted')), { id: 'r1' }), true, 'accepted war binds');
  assert.equal(isKillContractQuarry(ctxWith(hunt('accepted')), { id: 'r1' }), true, 'accepted hunt binds');
  assert.equal(isKillContractQuarry(ctxWith(bounty('accepted')), { id: 'r1', name: 'Carver Illyx' }), true, 'accepted bounty binds by the settled name');
  assert.equal(isKillContractQuarry(ctxWith(bounty('accepted')), { id: 'r1', name: 'Other Hull' }), false, 'a bounty does not bind another name');
  assert.equal(isKillContractQuarry(ctxWith(hunt('offered')), { id: 'r1' }), false, 'an offered posting is not a bind');
  assert.equal(isKillContractQuarry(ctxWith(hunt('failed')), { id: 'r1' }), false, 'a lapsed/failed row stops marking');
  assert.equal(isKillContractQuarry(ctxWith(bounty('accepted', 'X')), { id: 'r1', name: '' }), false, 'no name, no bounty bind');
});

// ---------------------------------------------------------------------------
// A. The engage lease finishes the broken, non-surrendered contract quarry.
// ---------------------------------------------------------------------------
await check('A1 an engage lease grants and fires on a broken accepted hunt quarry', () => {
  const f = fixture({ jobs: [huntJob(QUARRY.id, 'accepted')] });
  const r = f.start();
  assert.equal(r.ok, true, 'the lease grants on the broken, non-surrendered quarry: ' + JSON.stringify(r));
  f.tick();
  const s = f.status();
  assert.equal(s.owner, 'combat');
  assert.equal(s.reason, '', 'no terminal reason at hull 1 without a state ending');
  assert.equal(f.ctx.input.fireHeld, true, 'the strict cone opens on an aligned quarry exactly as before');
});

await check('A2 an engage lease grants and fires on a broken accepted bounty quarry (name bind)', () => {
  const f = fixture({ jobs: [bountyJob(QUARRY.name, 'accepted')] });
  const r = f.start();
  assert.equal(r.ok, true, 'the name-bound bounty quarry is accepted broken: ' + JSON.stringify(r));
  f.tick();
  assert.equal(f.status().owner, 'combat');
  assert.equal(f.ctx.input.fireHeld, true);
});

await check('A3 the lease ends target-destroyed when the bound quarry dies', () => {
  const f = fixture({ jobs: [huntJob(QUARRY.id, 'accepted')] });
  assert.equal(f.start().ok, true);
  f.tick();
  assert.equal(f.ctx.input.fireHeld, true, 'fire is held at the broken quarry');
  f.target.state.destroyed = true;
  f.tick(1 / 60, false);
  assert.equal(f.status().owner, 'none');
  assert.equal(f.status().reason, 'target-destroyed');
});

// ---------------------------------------------------------------------------
// B. fireBlocked 'alignment' cannot persist: bounded dwell, bounded standoff.
// ---------------------------------------------------------------------------
await check('B1 the alignment block cannot persist: the documented cone opens after the dwell', () => {
  const f = fixture({ jobs: [huntJob(QUARRY.id, 'accepted')], offNose: true });
  assert.equal(f.start().ok, true);
  f.tick();
  const s = f.status();
  assert.equal(s.owner, 'combat');
  assert.equal(s.combat.fireBlocked, 'alignment', 'the strict cone stays closed off the nose (fixture nose never rotates)');
  assert.equal(f.ctx.input.fireHeld, false);
  // Run 30 simulated seconds; the fixture nose never rotates, so only the
  // bounded dwell can open the documented cone.
  let armedAt = null, longest = 0, run = 0;
  for (let n = 0; n < 30 * 60; n++) {
    f.tick();
    const st = f.status();
    if (st.combat.fireBlocked === 'alignment') { run++; longest = Math.max(longest, run); }
    else run = 0;
    if (f.ctx.input.fireHeld) { armedAt = n / 60; break; }
  }
  assert(armedAt !== null, 'fire arms under the persistent off-nose block');
  assert(armedAt <= 12, 'the dwell opens the cone inside 12 s: armed at ' + armedAt + ' s');
  assert(longest <= 8 * 60 + 60, 'the longest continuous alignment stretch is bounded: ' + (longest / 60).toFixed(1) + ' s');
});

await check('B2 an alignment-blocked standoff spends thrust to close instead of orbiting at the floor', () => {
  const f = fixture({ jobs: [huntJob(QUARRY.id, 'accepted')], offNose: true });
  assert.equal(f.start().ok, true);
  f.tick();
  assert.equal(f.status().combat.fireBlocked, 'alignment');
  // Before the dwell the ordinary law holds its setpoint (creep floor raised
  // only by the aim-error clause).
  for (let n = 0; n < 60; n++) f.tick(); // 1 s < ALIGN_CLOSE_DWELL
  const before = f.ctx.input.throttle;
  assert(before < 0.9, 'no standoff thrust before the dwell: ' + before);
  for (let n = 0; n < 3 * 60; n++) f.tick(); // past ALIGN_CLOSE_DWELL
  assert.equal(f.ctx.input.throttle, 0.9, 'the lease closes the standoff after the dwell');
});

// ---------------------------------------------------------------------------
// C. Guards: other hulls and other intents keep every pre-existing ending.
// ---------------------------------------------------------------------------
await check('C1 a hull breaking without an accepted kill-contract bind still ends target-disabled', () => {
  const f = fixture({ jobs: [huntJob(QUARRY.id, 'offered')] });
  assert.equal(f.start().ok, true);
  f.tick();
  f.target.state.disabled = true;
  f.tick();
  assert.equal(f.status().reason, 'target-disabled');
});

await check('C2 a surrender without a bind still ends target-surrendered', () => {
  const f = fixture({ jobs: [] });
  assert.equal(f.start().ok, true);
  f.tick();
  f.target.state.surrendered = true;
  f.tick();
  assert.equal(f.status().reason, 'target-surrendered');
});

await check('C3 a disable intent on the broken bound quarry still refuses target-disabled', () => {
  const f = fixture({ jobs: [huntJob(QUARRY.id, 'accepted')], disabled: true });
  const r = f.start({ intent: 'disable' });
  assert.equal(r.ok, false);
  assert.equal(r.token, 'target-disabled');
});

await check('C4 an offered hunt row never binds the lease acceptance on a broken hull', () => {
  const f = fixture({ jobs: [huntJob(QUARRY.id, 'offered')], disabled: true });
  const r = f.start();
  assert.equal(r.ok, false, 'an offered row is not a kill bind');
  assert.equal(r.token, 'target-disabled');
});

console.log('issue-357: ' + checks + ' checks passed');
