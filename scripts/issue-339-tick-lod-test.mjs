/**
 * Issue #339 Phase 2 focused regression — AI tick LOD in src/systems/npc.js.
 *
 * Pins the acceptance criteria that can be checked headlessly:
 *  - a live hull inside U.INSTANTIATE_RANGE (900 u) keeps the full-frame path:
 *    its AI/state step advances by the real frame dt and its mesh animation
 *    advances every frame;
 *  - a live hull beyond 900 u (only possible inside the 900–1400 u despawn
 *    hysteresis band or as the selected escapee) takes one immediate boundary
 *    step, then updates AI/physics/state at 8 Hz from a session-only
 *    accumulator; between ticks only its last commanded velocity dead-reckons
 *    the pose (no AI/collision/state), and its mesh animation still advances
 *    every frame;
 *  - combat (ctx.flags.combat) is near-only, and death handling still runs for
 *    a far hull;
 *  - escape-phase progression advances with the accumulated dt at the reduced
 *    rate (never per frame);
 *  - no persisted field or ctx field is added (ai.lodAccum is session-only) and
 *    traffic.js's MAX_LIVE cap is unchanged.
 *
 * Every fixture below stages a real hull through spawnLiveShip against the full
 * booted system graph, so the near path stays byte-behavior-identical.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-339-tick-lod-test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

seedBootRandom();
installDomStubs();

const { ctx, systems, binds } = await bootGameSystems();
const npc = systems.find(([name]) => name === 'npc')[1];
const { spawnLiveShip, removeLiveShip, SYSTEMS, U } = binds;
const { enterEscapeFlee } = await import('../src/systems/npc.js');
const { NEAR_CAP } = await import('../src/game/traffic-tiers.js');

const DT = 1 / 60;
const LOD_HZ = 8;
const LOD_INTERVAL = 1 / LOD_HZ;
const LOD_FRAMES = Math.round(LOD_INTERVAL / DT); // 8 frames at 60 fps

ctx.flags.paused = false;
ctx.settings.reducedMotion = false;
ctx.world.time = 300; // past the starter grace window
ctx.lastEvents = [];
ctx.events = [];

const station = SYSTEMS.freehold.station.position;
const playerPos = new THREE.Vector3(station[0], station[1], station[2]);
ctx.ship.object.position.copy(playerPos);
if (ctx.ship.velocity && typeof ctx.ship.velocity.set === 'function') ctx.ship.velocity.set(0, 0, 0);

function step(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.elapsed += DT;
    ctx.world.time += DT;
    npc.update(DT);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

function spawn(record, offset) {
  const pos = new THREE.Vector3(playerPos.x + offset[0], playerPos.y + offset[1], playerPos.z + offset[2]);
  const live = spawnLiveShip(ctx, record, pos);
  assert.ok(live, 'spawnLiveShip returned a live hull');
  ctx.ships.push(live); // traffic owns this list in production; the harness drives by hand
  return live;
}

function drop(live) {
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  removeLiveShip(ctx, live);
}

function closeTo(actual, expected, what) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9,
    what + ': expected ' + expected + ', got ' + actual);
}

/** The real per-frame animation clock published by the asset update. */
function thruster(live) {
  const th = live.object && live.object.userData && live.object.userData.thruster;
  assert.ok(th, 'hull carries a real thruster animation surface');
  return th;
}

function makeRecord(id, role) {
  return {
    id, name: id, classKey: 'cutter', faction: 'redledger', role,
    resolve: 50, personality: 0, alwaysHuntsPlayer: true, state: 'enroute',
  };
}

const checks = [];
function pin(name, fn) {
  try { fn(); checks.push({ name, ok: true }); console.log('PASS ' + name); }
  catch (e) { checks.push({ name, ok: false, error: e.message }); console.log('FAIL ' + name + ' — ' + e.message); }
}

// ---------------------------------------------------------------------------
// 1. Near hull (<= 900 u): full-frame AI/state and animation, combat flag.
// ---------------------------------------------------------------------------
{
  const rec = makeRecord('t339-near', 'pirate');
  const live = spawn(rec, [150, 0, 0]);
  const recKeysBefore = Object.keys(rec).sort();
  live.ai.mode = 'loiter';
  live.ai.intent = true; // hostile intent toward the player, in the bubble
  const th = thruster(live);
  assert.equal(th.lastElapsed, null, 'animation clock starts unadvanced');
  const pos0 = live.object.position.clone();

  pin('near hull: AI/state step advances by the real frame dt', () => {
    step(1);
    closeTo(live.ai.t, DT, 'near ai.t after one frame');
    assert.notEqual(live.object.position.x, pos0.x, 'near hull steered this frame');
    assert.equal(live.ai.lodAccum, -1, 'near hull is not accumulating far-band debt');
  });
  pin('near hull: mesh animation advances every frame', () => {
    assert.equal(th.lastElapsed, ctx.elapsed, 'animation follows the frame clock');
    step(1);
    assert.equal(th.lastElapsed, ctx.elapsed, 'animation advanced again next frame');
    closeTo(live.ai.t, 2 * DT, 'near ai.t after two frames');
  });
  pin('near hull: hostile intent in the encounter bubble raises ctx.flags.combat', () => {
    assert.equal(ctx.flags.combat, true);
  });
  pin('near hull: no new record field', () => {
    assert.deepEqual(Object.keys(rec).sort(), recKeysBefore);
  });
  drop(live);
}

// ---------------------------------------------------------------------------
// 2. Far live hull (900–1400 u band): boundary step, then 8 Hz sim with
//    dead-reckoned pose only between ticks, animation every frame, no combat.
// ---------------------------------------------------------------------------
{
  const rec = makeRecord('t339-far', 'pirate');
  const live = spawn(rec, [1300, 0, 0]);
  const recKeysBefore = Object.keys(rec).sort();
  live.ai.mode = 'loiter';
  live.ai.intent = true; // intent alone must not raise the combat flag far out
  const th = thruster(live);
  assert.equal(th.lastElapsed, null, 'animation clock starts unadvanced');

  pin('far hull: the boundary frame steps immediately (no tier-edge freeze)', () => {
    step(1);
    closeTo(live.ai.t, DT, 'boundary step uses the real frame dt');
    assert.ok(live.ai.velocity.length() > 0, 'boundary step commanded a velocity');
    assert.equal(ctx.flags.combat, false, 'combat stays near-only');
  });
  pin('far hull: no AI/collision/state between 8 Hz ticks', () => {
    const vel = live.ai.velocity.clone();
    const tAtBoundary = live.ai.t;
    for (let frame = 2; frame <= LOD_FRAMES; frame++) {
      const before = live.object.position.clone();
      step(1);
      closeTo(live.ai.t, tAtBoundary, 'AI frozen between ticks');
      assert.deepEqual(live.ai.velocity.toArray(), vel.toArray(), 'no steering between ticks');
      const moved = live.object.position.clone().sub(before);
      const expected = vel.clone().multiplyScalar(DT);
      assert.ok(moved.distanceTo(expected) < 1e-9,
        'between ticks only the last commanded velocity dead-reckons the pose');
      assert.equal(ctx.flags.combat, false, 'combat stays near-only');
    }
  });
  pin('far hull: mesh animation still advances every frame', () => {
    assert.equal(th.lastElapsed, ctx.elapsed, 'animation follows the frame clock while the sim waits');
  });
  pin('far hull: one sim tick at 8 Hz with the accumulated dt', () => {
    step(1); // frame 9: the next 8 Hz window
    closeTo(live.ai.t, (LOD_FRAMES + 1) * DT, 'far ai.t after the 8 Hz tick');
    assert.equal(live.ai.lodAccum, 0, 'accumulator consumed by the tick');
    assert.equal(ctx.flags.combat, false, 'combat still near-only');
  });
  pin('far hull: no further sim until the next 8 Hz window', () => {
    const afterTick = live.ai.t;
    for (let frame = 1; frame <= LOD_FRAMES - 1; frame++) {
      step(1);
      closeTo(live.ai.t, afterTick, 'ai.t frozen between ticks');
      assert.equal(ctx.flags.combat, false);
    }
    step(1);
    closeTo(live.ai.t, (2 * LOD_FRAMES + 1) * DT, 'far ai.t after the second 8 Hz tick');
  });
  pin('far hull: no new record field', () => {
    assert.deepEqual(Object.keys(rec).sort(), recKeysBefore);
    assert.equal(Object.hasOwn(rec, 'lodAccum'), false);
  });
  drop(live);
}

// ---------------------------------------------------------------------------
// 3. Escape phase machine advances at the reduced rate, from the accumulated dt.
// ---------------------------------------------------------------------------
{
  const rec = makeRecord('t339-escape', 'pirate');
  const live = spawn(rec, [1300, 0, 0]);
  const plan = enterEscapeFlee(ctx, live, 'player');
  assert.ok(plan, 'enterEscapeFlee committed a plan');
  assert.equal(live.ai.mode, 'flee');
  // Pin the hull at its own committed endpoint so the gate-charge branch of the
  // real escape machine runs immediately; only the dt cadence is under test.
  plan.kind = 'gate'; // pin the gate-charge branch (the chooser may pick a station hold)
  plan.dest = [live.object.position.x, live.object.position.y, live.object.position.z];
  plan.phase = 'route';
  plan.charge = 0;
  plan.checkedAt = ctx.world.time;

  pin('escape: the boundary frame banks the real frame dt', () => {
    step(1);
    assert.equal(plan.phase, 'charge', 'arrival decided on the real end-of-frame position');
    closeTo(plan.charge, DT, 'boundary step charge');
  });
  pin('escape: charge does not advance between the 8 Hz ticks', () => {
    step(LOD_FRAMES - 1); // frames 2..8
    closeTo(plan.charge, DT, 'no per-frame charge banking');
    assert.equal(plan.phase, 'charge');
  });
  pin('escape: phase machine advances with the accumulated dt at 8 Hz', () => {
    step(1); // frame 9
    closeTo(plan.charge, (LOD_FRAMES + 1) * DT, 'charge advanced by the accumulated tick');
    step(LOD_FRAMES - 1); // frames 10..16
    closeTo(plan.charge, (LOD_FRAMES + 1) * DT, 'charge frozen between ticks');
    step(1); // frame 17
    closeTo(plan.charge, (2 * LOD_FRAMES + 1) * DT, 'charge advanced by the second accumulated tick');
  });
  drop(live);
}

// ---------------------------------------------------------------------------
// 4. Death handling still runs for a far hull (never throttled).
// ---------------------------------------------------------------------------
{
  const rec = makeRecord('t339-death', 'pirate');
  const live = spawn(rec, [1300, 0, 0]);
  live.state.destroyed = true;
  pin('far hull: death handling runs immediately, not on the LOD tick', () => {
    step(1);
    assert.equal(live.ai.deathHandled, true, 'handleDestroyed ran on the first frame');
    assert.equal(live.object.parent, null, 'wreck mesh removed from the scene');
  });
  drop(live);
}

// ---------------------------------------------------------------------------
// 5. Session-only state, no ctx field, unchanged live cap.
// ---------------------------------------------------------------------------
{
  const rec = makeRecord('t339-session', 'pirate');
  const live = spawn(rec, [150, 0, 0]);
  const ctxKeysBefore = Object.keys(ctx).sort();
  const worldKeysBefore = Object.keys(ctx.world).sort();
  pin('session-only accumulator: no persisted record field, no ctx field', () => {
    assert.ok(Object.hasOwn(live.ai, 'lodAccum'), 'ai carries the session-only accumulator');
    assert.equal(Object.hasOwn(ctx, 'lodAccum'), false);
    step(2);
    assert.deepEqual(Object.keys(ctx).sort(), ctxKeysBefore, 'no new ctx field');
    assert.deepEqual(Object.keys(ctx.world).sort(), worldKeysBefore, 'no new world field');
    const snap = JSON.stringify(binds.snapshot(ctx));
    assert.ok(!snap.includes('lodAccum'), 'snapshot never carries the accumulator');
  });
  pin('live cap unchanged: traffic.js still caps full hulls at MAX_LIVE = 10', () => {
    const trafficSrc = readFileSync(new URL('../src/game/traffic.js', import.meta.url), 'utf8');
    // Issue #339 tier refactor shares the constant (MAX_LIVE = NEAR_CAP); the
    // value must stay the pre-Phase-2 cap of 10.
    assert.match(trafficSrc, /const MAX_LIVE = (?:NEAR_CAP|10);/);
    assert.equal(NEAR_CAP, 10, 'near full-sim cap stays at the pre-Phase-2 value');
    assert.equal(U.INSTANTIATE_RANGE, 900, 'near/full boundary unchanged');
    assert.equal(U.DEINSTANTIATE_RANGE, 1400, 'despawn hysteresis unchanged');
    assert.ok(ctx.ships.length <= NEAR_CAP, 'fixture stays within the live cap');
  });
  drop(live);
}

const failed = checks.filter((c) => !c.ok);
console.log('');
console.log('issue-339 tick LOD: ' + (checks.length - failed.length) + '/' + checks.length + ' pins passed');
if (failed.length) {
  console.log('FAILED:', failed.map((c) => c.name + ' — ' + c.error).join(' | '));
  process.exit(1);
}
console.log('issue-339 tick LOD: PASS (near full-rate; far boundary step then 8 Hz sim with dead-reckoned pose and per-frame animation; near-only combat; reduced-rate escape; session-only accumulator; MAX_LIVE unchanged)');
