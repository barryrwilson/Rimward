/** Issue #181: every eligible delivery bound for the dock the player is
 * standing in settles in the SAME berth as the unique `haul-provisions`
 * consignment. No relaunch. The only thing the unique haul still holds back is
 * the five Provisions it was quoted on, and that hold is named on the desk row
 * and in `observe().jobs.active[].holdReason`.
 *
 * Real station DOM closures, the real jobs board, the real accept path and the
 * real throttled delivery tick. Every payout is asserted against the exact quote
 * each row locked at acceptance. Fixtures are disclosed cash/cargo/clock and
 * disclosed commodity/destination stamps on accepted rows.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-181-same-berth-test.mjs
 * Boot pin: the same file with `--boot-pin` runs the mixed berth once and prints
 * a single WAVE181 JSON line for `scripts/boot-test.mjs` to assert against.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { requestAutosave } from '../src/game/save.js';
import { SYSTEMS } from '../src/game/state.js';
import { postingHopsOk } from '../src/game/job-distance.js';

seedBootRandom();
const dom = installDomStubs();
const KEY = 'rimward-save-v1';
const bootPin = process.argv.includes('--boot-pin');
const rebootOpen = process.argv.includes('--reboot-open');
const rebootSettled = process.argv.includes('--reboot-settled');
const reboot = rebootOpen || rebootSettled;
const input = reboot ? JSON.parse(readFileSync(0, 'utf8')) : null;
if (input) localStorage.setItem(KEY, input.saved);
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];
const save = systems.find(([name]) => name === 'save')[1];

const HAUL_UNITS = 5;
const say = (...a) => { if (!bootPin) console.log(...a); };
const check = (label, fn) => { fn(); say('PASS', label); };

function step(count = 1) {
  for (let i = 0; i < count; i++) {
    ctx.world.time += 1 / 60;
    ctx.elapsed += 1 / 60;
    station.update(1 / 60);
    save.update(1 / 60);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

function dock(system = ctx.world.currentSystem) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  // Fixture: place the hull at the safe berth. The real dock path, the real
  // board refresh and the real delivery tick still own every mutation.
  ctx.world.currentSystem = system;
  ctx.emit('systemLoaded', { to: system });
  const p = ctx.systems[system].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  step(3);
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, 'docked at ' + system);
}

const openBoard = () => ctx.stationDesk.selectService('jobs');
const jobById = (id) => ctx.world.jobs.find((j) => j && j.id === id);
// A settled ordinary row is replaced or removed outright, so 'gone' and any
// non-accepted state both mean the berth closed it.
const stateOf = (id) => jobById(id)?.state ?? 'gone';
const settledHere = (id) => stateOf(id) !== 'accepted';
const holdOf = (commodity) => ctx.cargo
  .filter((r) => r.commodity === commodity).reduce((n, r) => n + r.units, 0);
const setHold = (rows) => {
  ctx.cargo.length = 0;
  for (const [commodity, units] of rows) ctx.cargo.push({ commodity, units });
};
const activeRow = (id) => window.rimward.observe().jobs.active.find((j) => j.id === id);

/** Every rendered card, with its ACCEPTED/DONE state line, out of the stub DOM. */
function stateLines() {
  const out = [];
  for (const node of dom.walkDom(document.body)) {
    if ((node.className || '') !== 'job-card') continue;
    const part = (pred) => [...dom.walkDom(node)]
      .filter((n) => pred(n.className || ''))
      .map((n) => (typeof n.textContent === 'string' ? n.textContent : '')).join(' ');
    out.push({
      title: part((cls) => cls === 'job-title'),
      state: part((cls) => cls.startsWith('job-state')),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reboot legs. `--reboot-open` restores open agreements and settles them in one
// berth; `--reboot-settled` restores a save taken AFTER the berth closed and
// proves no tick repays it.
// ---------------------------------------------------------------------------
if (rebootOpen) {
  for (const id of input.ids) assert.equal(stateOf(id), 'accepted', `restored ${id}`);
  ctx.flags.paused = false;
  ctx.flags.combat = false;
  const credits = ctx.world.credits;
  setHold(input.hold);
  dock(input.dest);
  step(240);
  for (const id of input.funded) assert.equal(settledHere(id), true, `${id} settled in the same berth`);
  assert.equal(ctx.world.credits - credits, input.expectedPay,
    'a restored berth pays exactly the quotes the funded rows locked');
  console.log('PASS F1 a reloaded save settles its funded deliveries in one berth for the locked quotes');
  process.exit(0);
}
if (rebootSettled) {
  for (const id of input.ids) assert.equal(settledHere(id), true, `${id} is still settled after reload`);
  ctx.flags.paused = false;
  ctx.flags.combat = false;
  assert.equal(ctx.world.credits, input.credits, 'the reloaded ledger is the settled ledger');
  setHold(input.hold);
  dock(input.dest);
  step(600);
  assert.equal(ctx.world.credits, input.credits, 'a reloaded settled berth never repays');
  assert.equal(holdOf('provisions'), input.hold.find((r) => r[0] === 'provisions')?.[1] ?? 0,
    'and takes no further cargo');
  console.log('PASS F2 a save reloaded AFTER settlement is never repaid by another tick');
  process.exit(0);
}

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.combat = false;
ctx.world.credits = 20000;

const HOME = 'freehold';
dock(HOME);
openBoard();
step(2);
openBoard();

// The unique consignment names its own destination; that is the berth under
// test, and every ordinary agreement below is stamped to the same dock.
const haulAccept = ctx.stationDesk.acceptJob('haul-provisions');
assert.equal(haulAccept.ok, true, JSON.stringify(haulAccept));
const DEST = SYSTEMS[HOME].gates[0].to;
assert.ok(Object.hasOwn(SYSTEMS, DEST), 'the primary gate names a real dock');
// A second legal posted destination for the same board, used to separate an
// ordinary delivery's dock from the unique consignment's.
const ALT = Object.keys(SYSTEMS).find((id) => id !== HOME && id !== DEST && postingHopsOk(HOME, id));
assert.ok(ALT, 'the board can legally post a second destination');

/** Accept real offered rows of one kind through the real desk path. */
function acceptOffered(kind, n) {
  const out = [];
  for (const job of ctx.world.jobs) {
    if (out.length >= n) break;
    if (!job || job.kind !== kind || job.state !== 'offered') continue;
    if (job.originSystem !== HOME) continue;
    const res = ctx.stationDesk.acceptJob(job.id);
    if (res.ok) out.push(job);
  }
  assert.equal(out.length, n, `accepted ${n} ${kind} rows (got ${out.length})`);
  return out;
}

const trades = acceptOffered('trade', 2);
const parties = acceptOffered('passenger', 2);
const sameTrade = trades[0];
const otherTrade = trades[1];
// Disclosed fixture: both trades and both parties are bound for the unique
// consignment's own dock; one trade carries the commodity the consignment needs
// and one does not. Nothing about the locked quotes is touched.
for (const job of [...trades, ...parties]) job.destSystem = DEST;
sameTrade.commodity = 'provisions';
sameTrade.need = HAUL_UNITS;
otherTrade.commodity = 'refinedMetals';
otherTrade.need = HAUL_UNITS;

const HAUL = 'haul-provisions';
const SAME = sameTrade.id;
const OTHER = otherTrade.id;
const PARTY_A = parties[0].id;
const PARTY_B = parties[1].id;
const OPEN = [HAUL, SAME, OTHER, PARTY_A, PARTY_B];
const stamped = OPEN.map((id) => JSON.parse(JSON.stringify(jobById(id))));

// Every payout below is measured against the quote the row locked at
// acceptance, never against "more than nothing".
const lockedPay = (id) => {
  const row = stamped.find((r) => r.id === id);
  assert.ok(Number.isFinite(row.payQuoted), `${id} locked a quote at acceptance`);
  return row.payQuoted;
};
const sumPay = (...ids) => ids.reduce((n, id) => n + lockedPay(id), 0);

// Settlement replaces or removes an ordinary row, so each scenario re-seeds the
// five agreements verbatim from the snapshot the real accept path produced.
const restore = () => {
  for (const row of stamped) {
    for (let i = ctx.world.jobs.length - 1; i >= 0; i--) {
      if (ctx.world.jobs[i] && ctx.world.jobs[i].id === row.id) ctx.world.jobs.splice(i, 1);
    }
    ctx.world.jobs.push(JSON.parse(JSON.stringify(row)));
  }
};

// ---------------------------------------------------------------------------
// A. The reported berth: a unique haul, two trades and two parties, all bound
//    for this dock, with enough goods aboard for every one of them.
// ---------------------------------------------------------------------------
function settleAll(order) {
  restore();
  // Fixture: array order must not decide who is paid. `front` puts the unique
  // consignment first; `back` puts it last, which is the reported layout.
  const rows = OPEN.map((id) => jobById(id));
  for (const row of rows) ctx.world.jobs.splice(ctx.world.jobs.indexOf(row), 1);
  ctx.world.jobs.push(...(order === 'front' ? rows : [...rows.slice(1), rows[0]]));
  setHold([['provisions', HAUL_UNITS * 2], ['refinedMetals', HAUL_UNITS]]);
  const credits = ctx.world.credits;
  dock(DEST);
  step(240); // one berth, no undock
  return { paid: ctx.world.credits - credits, states: OPEN.map(stateOf), docked: ctx.flags.docked };
}

const ALL_PAY = sumPay(...OPEN);
for (const order of ['front', 'back']) {
  check(`A1 (${order}) every delivery for this dock settles in one berth`, () => {
    const res = settleAll(order);
    assert.equal(res.docked, true, 'never undocked');
    assert.ok(res.states.every((s) => s !== 'accepted'),
      `all five settled: ${OPEN.map((id, i) => id + '=' + res.states[i]).join(', ')}`);
    assert.equal(res.paid, ALL_PAY, 'the berth paid exactly the five locked quotes');
    assert.equal(holdOf('provisions'), 0, 'both provisions deliveries took their units');
    assert.equal(holdOf('refinedMetals'), 0, 'the other-commodity delivery took its units');
  });
}

check('A2 repeated ticks in the same berth never pay a settled row twice', () => {
  const credits = ctx.world.credits;
  step(600);
  assert.equal(ctx.world.credits, credits, 'a settled berth pays nothing more');
});

// ---------------------------------------------------------------------------
// B. Inadequate goods: the unique consignment keeps first claim on Provisions,
//    and the row it holds says so. Nothing else is blocked.
// ---------------------------------------------------------------------------
check('B1 the unique haul takes its five Provisions before the trade row', () => {
  restore();
  setHold([['provisions', HAUL_UNITS], ['refinedMetals', HAUL_UNITS]]);
  const credits = ctx.world.credits;
  dock(DEST);
  step(240);
  assert.equal(settledHere(HAUL), true, 'the unique consignment paid');
  assert.equal(stateOf(SAME), 'accepted', 'the same-commodity trade is unpaid');
  assert.equal(settledHere(OTHER), true, 'Refined metals still settled here');
  assert.equal(settledHere(PARTY_A) && settledHere(PARTY_B), true,
    'a party is never held by a cargo agreement');
  assert.equal(ctx.world.credits - credits, sumPay(HAUL, OTHER, PARTY_A, PARTY_B),
    'exactly the four eligible quotes were paid');
  assert.equal(holdOf('provisions'), 0, 'the unique haul spent the five units');
});

check('B2 four Provisions: the unique haul waits and nothing else is held up', () => {
  restore();
  setHold([['provisions', HAUL_UNITS - 1], ['refinedMetals', HAUL_UNITS]]);
  const credits = ctx.world.credits;
  dock(DEST);
  step(240);
  assert.equal(stateOf(HAUL), 'accepted', 'the short unique consignment stays open');
  assert.equal(stateOf(SAME), 'accepted', 'the short trade row stays open');
  assert.equal(settledHere(OTHER), true, 'Refined metals settled at its dock');
  assert.equal(settledHere(PARTY_A) && settledHere(PARTY_B), true, 'both parties disembarked');
  assert.equal(ctx.world.credits - credits, sumPay(OTHER, PARTY_A, PARTY_B),
    'exactly the three funded quotes were paid');
  assert.equal(holdOf('provisions'), HAUL_UNITS - 1, 'the four units are untouched');
});

check('B3 goods aboard but committed: the desk row and the API name the hold', () => {
  restore();
  // The hold has exactly the units the unique consignment is quoted on, and the
  // player is at the origin, where the consignment cannot settle at all.
  setHold([['provisions', HAUL_UNITS]]);
  dock(HOME);
  openBoard();
  step(2);
  openBoard();
  const reason = ctx.stationDesk.peekJobHold(jobById(SAME));
  assert.ok(typeof reason === 'string' && reason.includes('unique consignment'),
    `a bounded hold reason: ${JSON.stringify(reason)}`);
  const row = stateLines().find((c) => (c.state || '').includes('unique consignment'));
  assert.ok(row, `the desk row prints the hold: ${JSON.stringify(stateLines(), null, 1)}`);
  assert.equal(activeRow(SAME).holdReason, reason, 'observe() carries the same reason');
  assert.ok(!Object.hasOwn(activeRow(OTHER), 'holdReason'), 'an unheld delivery carries no reason');
  assert.ok(!Object.hasOwn(activeRow(PARTY_A), 'holdReason'), 'a party carries no reason');
});

// ---------------------------------------------------------------------------
// C. Destination, expiry and idempotence — the checks the blanket fence used to
//    stand in for.
// ---------------------------------------------------------------------------
check('C1 a delivery for another dock does not pay here', () => {
  restore();
  jobById(SAME).destSystem = ALT;
  jobById(PARTY_A).destSystem = ALT;
  setHold([['provisions', HAUL_UNITS * 2], ['refinedMetals', HAUL_UNITS]]);
  const credits = ctx.world.credits;
  dock(DEST);
  step(240);
  assert.equal(stateOf(SAME), 'accepted', 'the wrong-dock trade is unpaid');
  assert.equal(stateOf(PARTY_A), 'accepted', 'the wrong-dock party is unpaid');
  assert.equal(ctx.world.credits - credits, sumPay(HAUL, OTHER, PARTY_B),
    'only the rows bound for this dock were paid');
  assert.equal(holdOf('provisions'), HAUL_UNITS, 'no cargo was taken for the wrong dock');
});

check('C2 the reservation follows the consignment, not the berth', () => {
  restore();
  // The trade row is bound for a different legal dock, and the hold carries
  // nothing but the five units the unique consignment is quoted on.
  jobById(SAME).destSystem = ALT;
  setHold([['provisions', HAUL_UNITS]]);
  const credits = ctx.world.credits;
  dock(ALT);
  openBoard();
  step(240);
  openBoard();
  assert.equal(stateOf(HAUL), 'accepted', 'the consignment does not settle at this dock');
  assert.equal(stateOf(SAME), 'accepted', 'and its units are not spent by the trade row');
  assert.equal(ctx.world.credits, credits, 'nothing was paid');
  assert.equal(holdOf('provisions'), HAUL_UNITS, 'the reserved units are whole');
  const reason = ctx.stationDesk.peekJobHold(jobById(SAME));
  assert.ok(typeof reason === 'string' && reason.includes('unique consignment'),
    'the desk explains the hold at the trade row\'s own dock');
  assert.equal(activeRow(SAME).holdReason, reason, 'and observe() agrees');
  assert.ok(stateLines().some((c) => (c.state || '').includes('unique consignment')),
    'the rendered row carries it too');

  // Settle the consignment at its own dock: the reservation is released.
  dock(DEST);
  step(240);
  assert.equal(settledHere(HAUL), true, 'the consignment settled at its named dock');
  // Both parties are bound for this dock too, so they disembark in the same
  // berth; the Refined metals row has no cargo aboard and stays open.
  assert.equal(ctx.world.credits - credits, sumPay(HAUL, PARTY_A, PARTY_B),
    'exactly the consignment and the two parties were paid');
  assert.equal(stateOf(OTHER), 'accepted', 'the unfunded metals row is still open');
  assert.equal(ctx.stationDesk.peekJobHold(jobById(SAME)), null, 'the hold reason is gone');

  // The ordinary delivery can now be run on its own goods.
  setHold([['provisions', HAUL_UNITS]]);
  const afterHaul = ctx.world.credits;
  dock(ALT);
  step(240);
  assert.equal(settledHere(SAME), true, 'the freed trade row settles at its dock');
  assert.equal(ctx.world.credits - afterHaul, lockedPay(SAME), 'for exactly its locked quote');
  assert.equal(holdOf('provisions'), 0, 'and it spent the five units');
});

check('C3 an expired agreement pays zero and takes no cargo', () => {
  restore();
  setHold([['provisions', HAUL_UNITS * 2], ['refinedMetals', HAUL_UNITS]]);
  const credits = ctx.world.credits;
  jobById(SAME).deadline = ctx.world.time - 1;
  dock(DEST);
  step(240);
  assert.equal(settledHere(SAME), true, 'the lapsed row is off the agreement list');
  assert.equal(ctx.world.credits - credits, sumPay(HAUL, OTHER, PARTY_A, PARTY_B),
    'the lapsed row added nothing to the four live quotes');
  assert.equal(holdOf('provisions'), HAUL_UNITS,
    'the lapsed trade left its five Provisions in the hold');
});

// ---------------------------------------------------------------------------
// Boot pin: one mixed berth, reported as a single JSON line.
// ---------------------------------------------------------------------------
if (bootPin) {
  // 1. The reported berth: all five deliveries settle together for exactly the
  //    quotes they locked, with no relaunch. Read BEFORE anything re-seeds.
  restore();
  setHold([['provisions', HAUL_UNITS * 2], ['refinedMetals', HAUL_UNITS]]);
  const creditsA = ctx.world.credits;
  dock(DEST);
  step(240);
  const mixed = {
    sameBerthAllSettled: OPEN.every(settledHere),
    sameBerthExactPay: ctx.world.credits - creditsA === ALL_PAY,
    neverUndocked: ctx.flags.docked === true,
  };

  // 2. Four Provisions: the unique consignment simply waits for a fifth unit.
  //    Its five units stay reserved while the agreement is accepted, but the
  //    trade row cannot be filled at four units either, so the ordinary
  //    shortage already explains why it has not delivered and no separate hold
  //    reason is printed.
  restore();
  setHold([['provisions', HAUL_UNITS - 1], ['refinedMetals', HAUL_UNITS]]);
  const creditsB = ctx.world.credits;
  dock(DEST);
  step(240);
  const short = {
    haulStaysOpen: stateOf(HAUL) === 'accepted',
    othersSettled: [OTHER, PARTY_A, PARTY_B].every(settledHere),
    shortPaidExactly: ctx.world.credits - creditsB === sumPay(OTHER, PARTY_A, PARTY_B),
    cargoKept: holdOf('provisions') === HAUL_UNITS - 1,
    noHoldReasonWhenShort: ctx.stationDesk.peekJobHold(jobById(SAME)) === null,
  };

  // 3. Five Provisions aboard at a dock the consignment cannot settle at: the
  //    units ARE reserved, and that is the one case that names a hold reason.
  restore();
  jobById(SAME).destSystem = ALT;
  setHold([['provisions', HAUL_UNITS]]);
  const creditsC = ctx.world.credits;
  dock(ALT);
  openBoard();
  step(240);
  openBoard();
  const reserved = {
    reservedNothingPaid: ctx.world.credits === creditsC,
    reservedCargoWhole: holdOf('provisions') === HAUL_UNITS,
    holdReasonShown: typeof ctx.stationDesk.peekJobHold(jobById(SAME)) === 'string',
    holdReasonInApi: typeof activeRow(SAME)?.holdReason === 'string',
    holdReasonRendered: stateLines().some((c) => (c.state || '').includes('unique consignment')),
  };

  console.log('WAVE181 ' + JSON.stringify({ ...mixed, ...short, ...reserved }));
  process.exit(0);
}

// ---------------------------------------------------------------------------
// F. Save round trips: an open berth restores and settles; a settled berth
//    restores and is never repaid.
// ---------------------------------------------------------------------------
const self = fileURLToPath(import.meta.url);
const runLeg = (flag, payload, label) => {
  const res = spawnSync(process.execPath, ['--import', './scripts/with-css-stub.mjs', self, flag],
    { input: JSON.stringify(payload), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  assert.equal(res.status, 0, label + '\n' + res.stdout + '\n' + res.stderr);
  say(res.stdout.trim());
};

restore();
setHold([]);
dock(HOME);
requestAutosave(ctx, { now: true });
step(2);
// Reload with the agreements still open, then fund only the unique consignment,
// the Refined metals row and one party; that exact sum is what the berth owes.
runLeg('--reboot-open', {
  saved: localStorage.getItem(KEY),
  ids: OPEN,
  funded: [HAUL, OTHER, PARTY_A, PARTY_B],
  hold: [['provisions', HAUL_UNITS], ['refinedMetals', HAUL_UNITS]],
  dest: DEST,
  expectedPay: sumPay(HAUL, OTHER, PARTY_A, PARTY_B),
}, 'F1 a reloaded open berth settles its funded deliveries for the locked quotes');

// Now settle the berth for real, save the closed ledger and reload that.
restore();
setHold([['provisions', HAUL_UNITS * 2], ['refinedMetals', HAUL_UNITS]]);
dock(DEST);
step(240);
assert.equal(OPEN.every(settledHere), true, 'the berth closed before the settled save');
setHold([['provisions', HAUL_UNITS]]);
requestAutosave(ctx, { now: true });
step(2);
runLeg('--reboot-settled', {
  saved: localStorage.getItem(KEY),
  ids: OPEN,
  credits: ctx.world.credits,
  hold: [['provisions', HAUL_UNITS]],
  dest: DEST,
}, 'F2 a save reloaded AFTER settlement is never repaid');

console.log('ISSUE-181 SAME BERTH SETTLEMENT OK');
