/**
 * Issue #339 Phase 2 focused regression — abstract tick LOD in world.js.
 *
 * Pins the acceptance criteria that can be checked headlessly:
 *  - the CURRENT system's record bank keeps the original 1 Hz galaxy tick
 *    cadence (GALAXY_TICK=1 per-tick progress semantics unchanged);
 *  - every other visited bank advances only on every 5th galaxy tick (0.2 Hz),
 *    never on the current bank's cadence;
 *  - a jump changes which bank is throttled and resets the off-screen phase so
 *    the new current bank ticks on the ordinary 1 Hz cadence;
 *  - docked dwell / gate linger still resolve, at the documented reduced
 *    fidelity for off-screen banks;
 *  - the in-transit registry survives a same-system recordBanks swap (save.js
 *    restore path) and migrants still arrive;
 *  - no persistent field / save-format change: the accumulators live in the
 *    initWorld closure, not on ctx.world, and never appear in a snapshot.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-339-abstract-tick-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SHIP_CLASSES } from '../src/game/state.js';

seedBootRandom();
installDomStubs();

const { ctx, systems, binds } = await bootGameSystems();
const { ensureBank, beginTransit } = await import('../src/game/world.js');
const { SYSTEMS, snapshot } = binds;
const world = systems.find(([name]) => name === 'world')[1];

const DT = 1 / 60;
const CUTTER_CRUISE = SHIP_CLASSES.cutter.cruise; // the tickBank speed source; issue #340 doubled it
const LEG_LEN = 100000; // long leg so legT never reaches 1 inside the test
const PER_TICK_LEGT = CUTTER_CRUISE / LEG_LEN; // one galaxy tick's progress

ctx.flags.paused = false;
ctx.world.activeEvent = null;
ctx.lastEvents = [];
ctx.events = [];

function step(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    ctx.elapsed += DT;
    world.update(DT);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

/** A minimal route pirate: tickBank advances legT by speed/legLen per tick. */
function makePirate(system, id, state = 'enroute', dwellUntil = 0) {
  return {
    id, name: id, classKey: 'cutter', faction: 'redledger', role: 'pirate',
    state, system, dwellUntil,
    route: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: LEG_LEN }],
    legLens: [LEG_LEN], leg: 0, legT: 0, dir: 1, gateLinger: false,
  };
}

function closeTo(actual, expected, what) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9,
    what + ': expected ' + expected + ', got ' + actual);
}

/** Run frames, recording legT changes and their per-change deltas. */
function run(seconds, watch) {
  const frames = Math.round(seconds / DT);
  const state = watch.map((rec) => ({ rec, last: rec.legT, changes: 0, deltas: [] }));
  for (let i = 0; i < frames; i++) {
    step(1);
    for (const s of state) {
      if (s.rec.legT !== s.last) {
        s.changes += 1;
        s.deltas.push(s.rec.legT - s.last);
        s.last = s.rec.legT;
      }
    }
  }
  return state;
}

function assertPerTickProgress(entry, label) {
  assert.ok(entry.changes > 0, label + ': tickBank never advanced the record');
  for (const delta of entry.deltas) {
    closeTo(delta, PER_TICK_LEGT, label + ': per-tick progress must stay GALAXY_TICK=1');
  }
}

const worldKeysBefore = Object.keys(ctx.world).sort();
const checks = [];
function pin(name, fn) {
  try { fn(); checks.push({ name, ok: true }); console.log('PASS ' + name); }
  catch (e) { checks.push({ name, ok: false, error: e.message }); console.log('FAIL ' + name + ' — ' + e.message); }
}

// ---------------------------------------------------------------------------
// Fixtures: one route pirate in the current bank, one in a foreign bank, and a
// docked pirate in the foreign bank (dwell/gate-linger fidelity pin).
// ---------------------------------------------------------------------------
const currentBank = ctx.world.records; // freehold: the player's current system
const otherBank = ensureBank(ctx, 'veridian');
const curRec = makePirate('freehold', 't339-abs-current');
const otherRec = makePirate('veridian', 't339-abs-other');
const otherDocked = makePirate('veridian', 't339-abs-other-docked', 'docked', ctx.world.time + 0.2);
currentBank.push(curRec);
otherBank.push(otherRec, otherDocked);
const recKeysBefore = Object.keys(curRec).sort();
const otherRecKeysBefore = Object.keys(otherRec).sort();

// ---------------------------------------------------------------------------
// 1. Current bank 1 Hz, other banks 0.2 Hz (never on the current cadence).
// ---------------------------------------------------------------------------
pin('current system bank advances on the original 1 Hz galaxy tick', () => {
  const [cur] = run(4, [curRec]);
  assert.ok(cur.changes >= 3 && cur.changes <= 5, 'about four 1 Hz ticks in four seconds, got ' + cur.changes);
  assertPerTickProgress(cur, 'current bank');
});
pin('off-screen bank does not advance on the current bank cadence', () => {
  assert.equal(otherRec.legT, 0, 'off-screen bank still untouched after four seconds');
});
pin('off-screen bank advances on every 5th galaxy tick (0.2 Hz)', () => {
  const [cur, other] = run(2, [curRec, otherRec]);
  assert.ok(cur.changes >= 1 && cur.changes <= 3, 'current bank kept ticking, got ' + cur.changes);
  assert.equal(other.changes, 1, 'exactly one off-screen tick on the 5th galaxy tick');
  assertPerTickProgress(other, 'off-screen bank');
});
pin('off-screen bank cadence holds over a longer window (1/5 rate)', () => {
  const [cur, other] = run(5, [curRec, otherRec]);
  assert.ok(cur.changes >= 4 && cur.changes <= 6, 'current bank kept its 1 Hz cadence, got ' + cur.changes);
  assert.equal(other.changes, 1, 'one more off-screen tick in the next five seconds, got ' + other.changes);
});
pin('docked dwell resolves on the current bank tick, late on an off-screen bank', () => {
  otherDocked.state = 'docked';
  otherDocked.dwellUntil = ctx.world.time + 0.2;
  const [cur] = run(1, [curRec]);
  assert.ok(cur.changes >= 1, 'current bank ticked');
  assert.equal(otherDocked.state, 'docked', 'off-screen dwell waits for its own 5 s tick (0.2 Hz fidelity tradeoff)');
  run(3, [curRec]); // reaches the next off-screen window
  assert.equal(otherDocked.state, 'enroute', 'off-screen dwell resolves on its own 5 s tick');
});
pin('off-screen bank never double-ticks with the current bank', () => {
  const [cur, other] = run(6, [curRec, otherRec]);
  assert.ok(cur.changes >= 5, 'current bank 1 Hz, got ' + cur.changes);
  assert.ok(other.changes >= 1 && other.changes <= 2, 'off-screen at 0.2 Hz, got ' + other.changes);
  assert.ok(other.changes * 4 <= cur.changes + 1, 'off-screen cadence is materially slower');
});

// ---------------------------------------------------------------------------
// 2. A jump changes which bank is throttled; the off-screen phase resets.
// ---------------------------------------------------------------------------
pin('jump swaps the current bank and resets the off-screen throttle phase', () => {
  ctx.world.currentSystem = 'veridian';
  ctx.lastEvents = [{ type: 'systemLoaded', to: 'veridian' }];
  step(1);
  assert.equal(ctx.world.records, otherBank, 'veridian bank became the live current bank');
  // The just-outgoing freehold bank is now off-screen; the reset means it must
  // not tick for the first four galaxy ticks after the jump.
  const [cur, old] = run(4, [otherRec, curRec]);
  assert.ok(cur.changes >= 3 && cur.changes <= 5, 'new current bank ticks at 1 Hz, got ' + cur.changes);
  assert.equal(old.changes, 0, 'outgoing bank stays off-screen for the first four ticks');
  assertPerTickProgress(cur, 'new current bank');
  const [, oldNext] = run(2, [otherRec, curRec]);
  assert.equal(oldNext.changes, 1, 'outgoing bank resumes at 0.2 Hz on the 5th tick');
});
pin('current bank is unaffected by other-bank throttling', () => {
  const [cur] = run(5, [otherRec]);
  assert.ok(cur.changes >= 4 && cur.changes <= 6, 'current bank 1 Hz, got ' + cur.changes);
  assertPerTickProgress(cur, 'current bank after jump');
});

// ---------------------------------------------------------------------------
// 3. In-transit registry survives a same-system recordBanks swap (restore path)
//    and the migrant still arrives.
// ---------------------------------------------------------------------------
pin('same-system restore swap rebuilds transit registry and migrants arrive', () => {
  const dest = (SYSTEMS.veridian.gates ?? []).map((g) => g.to).find((to) => to && to !== 'veridian');
  assert.ok(dest, 'veridian has a physical outbound gate');
  const trader = ctx.world.records.find((r) => r.role === 'trader');
  assert.ok(trader, 'current bank carries a trader');
  trader.state = 'enroute';
  trader.dwellUntil = 0;
  assert.equal(beginTransit(ctx, trader, dest, 'veridian'), true, 'migration registered');
  assert.equal(trader.state, 'inTransit');
  trader.transitEta = ctx.world.time + 0.5;
  // save.js restore path: a wholesale recordBanks reference swap with no
  // 'systemLoaded'. The update loop must rebuild the registry from the banks.
  ctx.world.recordBanks = { ...ctx.world.recordBanks };
  step(1);
  step(Math.ceil(1.2 / DT));
  assert.notEqual(trader.state, 'inTransit', 'migrant arrived after the eta');
  assert.equal(trader.state, 'enroute');
  assert.equal(trader.system, dest, 'migrant re-homed into the destination system');
  assert.ok(ctx.world.recordBanks[dest]?.includes(trader), 'record rides the destination bank');
});

// ---------------------------------------------------------------------------
// 4. No persistent field, no save-format change, no ctx/world field.
// ---------------------------------------------------------------------------
pin('session-only accumulators: no ctx/world field and no snapshot field', () => {
  assert.equal(Object.hasOwn(ctx, 'otherTickCount'), false);
  assert.equal(Object.hasOwn(ctx, 'tickAccum'), false);
  assert.deepEqual(Object.keys(ctx.world).sort(), worldKeysBefore, 'no new ctx.world field');
  const snap = JSON.stringify(snapshot(ctx));
  assert.ok(!snap.includes('otherTickCount'), 'snapshot never carries the off-screen counter');
  assert.ok(!snap.includes('tickAccum'), 'snapshot never carries the current tick accumulator');
});
pin('record schema unchanged: no new persistent record fields', () => {
  assert.deepEqual(Object.keys(curRec).sort(), recKeysBefore, 'current pirate record keys unchanged');
  assert.deepEqual(Object.keys(otherRec).sort(), otherRecKeysBefore, 'off-screen pirate record keys unchanged');
});

const failed = checks.filter((c) => !c.ok);
console.log('');
console.log('issue-339 abstract tick LOD: ' + (checks.length - failed.length) + '/' + checks.length + ' pins passed');
if (failed.length) {
  console.log('FAILED:', failed.map((c) => c.name + ' — ' + c.error).join(' | '));
  process.exit(1);
}
console.log('issue-339 abstract tick LOD: PASS (current bank 1 Hz, other banks 0.2 Hz, jump re-throttles, restore registry + arrivals intact, session-only state)');
