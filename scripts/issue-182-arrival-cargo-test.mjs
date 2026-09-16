/** Issue #182: a delivery pays for a RUN, not for an errand at the far market.
 * Docking empty and buying the destination's own stock no longer settles a trade
 * agreement or the unique `haul-provisions` consignment. What each agreement may
 * spend is the arrival manifest: the units aboard on entry to the system,
 * spent down as goods leave the hold — a delivery, a consignment, a
 * market sale — so a sold-and-rebought unit and two competing agreements can
 * never claim the same entitlement twice.
 *
 * Real station DOM closures, the real market desk (`stationDesk.trade`), the
 * real accept path and the real throttled delivery tick. Every payout is
 * asserted against the exact quote each row locked at acceptance. Fixtures are
 * disclosed cash/cargo/clock and disclosed commodity/destination stamps on
 * accepted rows; every purchase and sale goes through the public desk action.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-182-arrival-cargo-test.mjs
 * Boot pin: the same file with `--boot-pin` runs the berths once and prints a
 * single WAVE182 JSON line for `scripts/boot-test.mjs` to assert against.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS } from '../src/game/state.js';
import { postingHopsOk } from '../src/game/job-distance.js';
import { snapshot, restore as restoreSave } from '../src/game/save.js';

seedBootRandom();
const dom = installDomStubs();
const bootPin = process.argv.includes('--boot-pin');
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];

const HAUL_UNITS = 5;
const say = (...a) => { if (!bootPin) console.log(...a); };
const check = (label, fn) => { fn(); say('PASS', label); };

function step(count = 1) {
  for (let i = 0; i < count; i++) {
    ctx.world.time += 1 / 60;
    ctx.elapsed += 1 / 60;
    station.update(1 / 60);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

function dock(system = ctx.world.currentSystem) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  // Fixture: place the hull at the safe berth. The real dock path, the real
  // market desk and the real delivery tick still own every mutation.
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
const stateOf = (id) => jobById(id)?.state ?? 'gone';
const settledHere = (id) => stateOf(id) !== 'accepted';
const holdOf = (commodity) => ctx.cargo
  .filter((r) => r.commodity === commodity).reduce((n, r) => n + r.units, 0);
const setHold = (rows) => {
  ctx.cargo.length = 0;
  for (const [commodity, units] of rows) ctx.cargo.push({ commodity, units });
};
/** The live desk notice as the PLAYER sees it: the rendered station-notice node
 * out of the stub DOM, cross-checked against the public desk view. */
function deskNotice() {
  let drawn = '';
  for (const node of dom.walkDom(document.body)) {
    if ((node.className || '') !== 'station-notice') continue;
    if (typeof node.textContent === 'string' && node.textContent) { drawn = node.textContent; break; }
  }
  const view = ctx.stationDesk.peekView()?.notice ?? '';
  assert.equal(drawn, view, 'the drawn desk notice and the public desk view agree');
  return drawn;
}
const ARRIVAL_LINE = /must arrive with the ship/i;

/** Buy through the PUBLIC market desk — no direct hold writes. */
function buy(commodity, qty) {
  const before = holdOf(commodity);
  const res = ctx.stationDesk.trade({ commodity, qty, side: 'buy' });
  assert.equal(res.ok, true, `bought ${qty} ${commodity} at the dock: ${JSON.stringify(res)}`);
  assert.equal(holdOf(commodity), before + qty, 'the purchase landed in the hold');
  return res;
}
function sell(commodity, qty) {
  const res = ctx.stationDesk.trade({ commodity, qty, side: 'sell' });
  assert.equal(res.ok, true, `sold ${qty} ${commodity} at the dock: ${JSON.stringify(res)}`);
  return res;
}

// ---------------------------------------------------------------------------
// Fixture berth: the unique consignment plus two ordinary trade rows, all bound
// for the dock under test. Quotes are locked by the real accept path.
// ---------------------------------------------------------------------------
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.combat = false;
ctx.world.credits = 200000;

const HOME = 'freehold';
dock(HOME);
openBoard();
step(2);
openBoard();
assert.ok([...dom.walkDom(document.body)].some((n) => /Buy at another station or hold .* before the jump; deliver to/.test(n.textContent || '')),
  'offered trade card explains that goods must be aboard before the jump');

// Issue 206: the unique `haul-provisions` posting is retired, so a fresh board
// no longer offers it. The agreement this berth is about can still exist — an
// OLD SAVE that was carrying it when the posting went — so it is seeded here in
// the verbatim shape the retired accept path used to stamp: the origin dock,
// the Provisions price paid there, and the quote the REAL desk locks at that
// dock. Nothing below is relaxed; every payout is still measured against it.
function seedLegacyHaul(origin) {
  const row = {
    id: 'haul-provisions',
    kind: 'haul',
    title: 'Haul provisions',
    detail: "Provisions are worth more a gate away. Accept here, buy 5 Provisions, and dock at the other system's station — paid at 140% of your buy cost on delivery.",
    reward: 0,
    need: HAUL_UNITS,
    progress: 0,
    state: 'offered',
    originSystem: null,
    originPrice: 0,
  };
  ctx.world.jobs.push(row);
  const quote = ctx.stationDesk.peekJobReward(row);
  assert.ok(Number.isFinite(quote) && quote > 0, 'the desk quoted the legacy consignment');
  Object.assign(row, {
    state: 'accepted',
    originSystem: origin,
    originPrice: ctx.world.prices.provisions,
    payQuoted: quote,
  });
  // The retired posting can never be taken again, whatever an old save holds.
  const refused = ctx.stationDesk.acceptJob('haul-provisions');
  assert.equal(refused.ok, false, JSON.stringify(refused));
  assert.equal(row.state, 'accepted', 'and the refusal never touched the agreement');
  return row;
}
seedLegacyHaul(HOME);
const DEST = SYSTEMS[HOME].gates[0].to;
assert.ok(Object.hasOwn(SYSTEMS, DEST), 'the primary gate names a real dock');
const ALT = Object.keys(SYSTEMS).find((id) => id !== HOME && id !== DEST && postingHopsOk(HOME, id));
assert.ok(ALT, 'the board can legally post a second destination');

function acceptOffered(kind, n) {
  const out = [];
  for (const job of ctx.world.jobs) {
    if (out.length >= n) break;
    if (!job || job.kind !== kind || job.state !== 'offered') continue;
    if (job.originSystem !== HOME) continue;
    if (ctx.stationDesk.acceptJob(job.id).ok) out.push(job);
  }
  assert.equal(out.length, n, `accepted ${n} ${kind} rows (got ${out.length})`);
  return out;
}

const trades = acceptOffered('trade', 2);
const parties = acceptOffered('passenger', 1);
// Disclosed fixture: both trade rows are bound for the unique consignment's own
// dock and both carry the commodity the consignment needs, so the arrival
// manifest is genuinely shared. The party proves #181 still settles alongside.
for (const job of [...trades, ...parties]) job.destSystem = DEST;
for (const job of trades) { job.commodity = 'provisions'; job.need = HAUL_UNITS; }

const HAUL = 'haul-provisions';
const TRADE_A = trades[0].id;
const TRADE_B = trades[1].id;
const PARTY = parties[0].id;
const OPEN = [HAUL, TRADE_A, TRADE_B, PARTY];
const stamped = OPEN.map((id) => JSON.parse(JSON.stringify(jobById(id))));

const lockedPay = (id) => {
  const row = stamped.find((r) => r.id === id);
  assert.ok(Number.isFinite(row.payQuoted), `${id} locked a quote at acceptance`);
  return row.payQuoted;
};
const sumPay = (...ids) => ids.reduce((n, id) => n + lockedPay(id), 0);

/** Re-seed the four agreements verbatim from the accept-path snapshot. */
const restore = () => {
  for (const row of stamped) {
    for (let i = ctx.world.jobs.length - 1; i >= 0; i--) {
      if (ctx.world.jobs[i] && ctx.world.jobs[i].id === row.id) ctx.world.jobs.splice(i, 1);
    }
    ctx.world.jobs.push(JSON.parse(JSON.stringify(row)));
  }
};

/** Arrive at `system` carrying exactly `rows`, then run the delivery tick. */
function arrive(rows, system = DEST, ticks = 240) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  // Disclosed transit fixture: a new arrival must actually change systems.
  // Same-system systemLoaded and redocking must never renew eligibility.
  if (ctx.world.currentSystem === system) {
    ctx.world.currentSystem = system === HOME ? DEST : HOME;
    step(1);
  }
  restore();
  setHold(rows);
  dock(system);
  step(ticks);
}

// ---------------------------------------------------------------------------
// A. The reported exploit: dock empty, buy the dock's own stock, get paid.
// ---------------------------------------------------------------------------
check('A1 docking empty and buying here does not pay the unique consignment', () => {
  restore();
  setHold([]);
  dock(DEST);
  step(60);
  const credits = ctx.world.credits;
  buy('provisions', HAUL_UNITS * 2); // enough for the consignment AND a trade row
  const spent = credits - ctx.world.credits;
  assert.ok(spent > 0, 'the market charged for the stock');
  const afterBuy = ctx.world.credits;
  step(240);
  assert.equal(stateOf(HAUL), 'accepted', 'the unique consignment did not settle');
  assert.equal(stateOf(TRADE_A), 'accepted', 'the trade row did not settle');
  assert.equal(stateOf(TRADE_B), 'accepted', 'the second trade row did not settle');
  assert.equal(ctx.world.credits, afterBuy, 'not one UU of delivery margin was paid');
  assert.equal(holdOf('provisions'), HAUL_UNITS * 2, 'and no cargo was taken');
});

check('A2 the desk says plainly that the goods must arrive with the ship', () => {
  const line = deskNotice();
  assert.ok(ARRIVAL_LINE.test(line), `the berth explains the refusal: ${JSON.stringify(line)}`);
  assert.ok(/Provisions/.test(line), 'and names the commodity');
});

check('A3 repeated ticks never pay and never re-spam the notice', () => {
  const credits = ctx.world.credits;
  // The player does something else at the desk. The delivery tick runs twice a
  // second; if the arrival line were re-latched per pass it would stamp over
  // this refusal within half a second.
  const other = ctx.stationDesk.acceptJob('no-such-posting');
  assert.equal(other.ok, false, 'a refused desk action leaves its own notice');
  assert.equal(ARRIVAL_LINE.test(deskNotice()), false, 'the arrival line stepped aside');
  const parked = deskNotice();
  step(600); // ten seconds: twenty delivery passes
  assert.equal(ctx.world.credits, credits, 'ten seconds of ticks paid nothing');
  assert.equal(deskNotice(), parked, 'and the latched line never came back');
  assert.equal(holdOf('provisions'), HAUL_UNITS * 2, 'the bought stock is still the player\'s');
});

check('A4 destination purchases stay unpaid across launch, flight and redock', () => {
  const credits = ctx.world.credits;
  ctx.stationDesk.undock();
  assert.equal(ctx.flags.docked, false, 'real launch succeeded');
  step(1200);
  dock(DEST);
  step(240);
  assert.equal(ctx.world.credits, credits, 'twenty seconds out and redock paid nothing');
  assert.equal(holdOf('provisions'), HAUL_UNITS * 2, 'destination cargo stayed aboard');
  assert.ok([HAUL, TRADE_A, TRADE_B].every((id) => stateOf(id) === 'accepted'));
});

// ---------------------------------------------------------------------------
// B. The legitimate run still pays — once.
// ---------------------------------------------------------------------------
check('B1 goods that arrived with the ship pay exactly the locked quotes, once', () => {
  const credits = ctx.world.credits;
  arrive([['provisions', HAUL_UNITS * 3]]);
  assert.equal(settledHere(HAUL), true, 'the unique consignment paid');
  assert.equal(settledHere(TRADE_A) && settledHere(TRADE_B), true, 'both trade rows paid');
  assert.equal(settledHere(PARTY), true, 'issue 181: the party disembarks in the same berth');
  assert.equal(ctx.world.credits - credits, sumPay(...OPEN),
    'the berth paid exactly the four locked quotes');
  assert.equal(holdOf('provisions'), 0, 'the fifteen arrived units were spent');
  const settledCredits = ctx.world.credits;
  step(600);
  assert.equal(ctx.world.credits, settledCredits, 'a settled berth is never paid again');
});

// ---------------------------------------------------------------------------
// C. Partial top-up: the run was short, and buying the difference here does not
//    complete it.
// ---------------------------------------------------------------------------
check('C1 arriving short and topping up at the dock is still refused', () => {
  arrive([['provisions', HAUL_UNITS - 2]], DEST, 60);
  const beforeBuy = ctx.world.credits;
  buy('provisions', 2);
  assert.equal(holdOf('provisions'), HAUL_UNITS, 'five Provisions are aboard');
  const afterBuy = ctx.world.credits;
  assert.ok(afterBuy < beforeBuy, 'the top-up cost real UU');
  step(240);
  assert.equal(stateOf(HAUL), 'accepted', 'a topped-up consignment does not settle');
  assert.equal(stateOf(TRADE_A), 'accepted', 'nor a topped-up trade row');
  assert.equal(ctx.world.credits, afterBuy, 'no margin was paid on a part-bought run');
  assert.equal(holdOf('provisions'), HAUL_UNITS, 'and no cargo was taken');
  assert.ok(ARRIVAL_LINE.test(deskNotice()), 'the desk names the reason');
});

check('C2 a partial arrival remains short after another berth visit', () => {
  const credits = ctx.world.credits;
  dock(DEST);
  step(240);
  assert.equal(ctx.world.credits, credits, 'redocking cannot qualify the local top-up');
  assert.equal(stateOf(HAUL), 'accepted');
  assert.equal(holdOf('provisions'), HAUL_UNITS);
});

// ---------------------------------------------------------------------------
// D. One arrival manifest, shared. Competing agreements cannot double-spend it,
//    and #181's batch priority still decides who gets it first.
// ---------------------------------------------------------------------------
check('D1 five arrived units fund ONE agreement, and #181 gives the consignment first claim', () => {
  const credits = ctx.world.credits;
  arrive([['provisions', HAUL_UNITS]]);
  assert.equal(settledHere(HAUL), true, 'issue 181: the unique consignment settles first');
  assert.equal(stateOf(TRADE_A), 'accepted', 'the first trade row is unfunded');
  assert.equal(stateOf(TRADE_B), 'accepted', 'the second trade row is unfunded');
  assert.equal(settledHere(PARTY), true, 'a party is never held by a cargo agreement');
  assert.equal(ctx.world.credits - credits, sumPay(HAUL, PARTY),
    'exactly the consignment and the party were paid');
  assert.equal(holdOf('provisions'), 0, 'the consignment spent the five arrived units');
});

check('D2 buying a second set here cannot fund the row the manifest could not', () => {
  const afterHaul = ctx.world.credits;
  buy('provisions', HAUL_UNITS);
  const afterBuy = ctx.world.credits;
  step(240);
  assert.equal(stateOf(TRADE_A), 'accepted', 'the leftover trade row is still unpaid');
  assert.equal(stateOf(TRADE_B), 'accepted', 'and so is the other');
  assert.equal(ctx.world.credits, afterBuy, 'no second payout from the same berth');
  assert.ok(afterBuy < afterHaul, 'the player is simply out the purchase price');
  assert.equal(holdOf('provisions'), HAUL_UNITS, 'the bought stock stays the player\'s cargo');
});

check('D3 ten arrived units fund exactly two agreements, not three', () => {
  const credits = ctx.world.credits;
  arrive([['provisions', HAUL_UNITS * 2]]);
  const paidRows = [HAUL, TRADE_A, TRADE_B].filter(settledHere);
  assert.equal(paidRows.length, 2, `two cargo rows settled: ${paidRows.join(', ')}`);
  assert.equal(settledHere(HAUL), true, 'the consignment took the first five');
  assert.equal(ctx.world.credits - credits, sumPay(...paidRows, PARTY),
    'the berth paid exactly the funded quotes plus the party');
  assert.equal(holdOf('provisions'), 0, 'both funded rows spent arrived units');
});

// ---------------------------------------------------------------------------
// E. Selling depletes the manifest: a unit sold at the dock is gone from the
//    run even if an identical unit is bought straight back.
// ---------------------------------------------------------------------------
check('E1 selling the arrived cargo and rebuying it does not restore the run', () => {
  arrive([['provisions', HAUL_UNITS]], DEST, 0);
  assert.equal(stateOf(HAUL), 'accepted', 'read before the first delivery pass runs');
  sell('provisions', HAUL_UNITS);
  assert.equal(holdOf('provisions'), 0, 'the arrived cargo left the hold');
  buy('provisions', HAUL_UNITS);
  const afterRebuy = ctx.world.credits;
  step(240);
  assert.equal(stateOf(HAUL), 'accepted', 'the rebought units are not the run');
  assert.equal(stateOf(TRADE_A), 'accepted', 'and cannot fill a trade row either');
  // The party rode in and disembarks here (issue 181); no CARGO row was paid.
  assert.equal(ctx.world.credits - afterRebuy, lockedPay(PARTY),
    'only the party was paid — no delivery margin on rebought stock');
  assert.equal(holdOf('provisions'), HAUL_UNITS, 'and no cargo was taken');
  assert.ok(ARRIVAL_LINE.test(deskNotice()), 'the desk names the reason');
});

// ---------------------------------------------------------------------------
// F. Issue 219: the manifest survives redocks and same-system load events.
// ---------------------------------------------------------------------------
check('F1 redocking with local stock cannot renew its arrival eligibility', () => {
  const credits = ctx.world.credits;
  dock(DEST); // emits a same-system systemLoaded too: neither is an arrival
  step(240);
  assert.equal(stateOf(HAUL), 'accepted', 'local stock is still unpaid');
  assert.equal(stateOf(TRADE_A), 'accepted', 'trade stock is still unpaid');
  assert.equal(ctx.world.credits, credits, 'no redock profit');
  assert.equal(holdOf('provisions'), HAUL_UNITS, 'local cargo is retained');
  openBoard();
  const states = [...dom.walkDom(document.body)].filter((n) => (n.className || '').includes('job-state')).map((n) => n.textContent);
  assert.ok(states.some((s) => /eligible 0 of 5 aboard/.test(s)), 'trade row explains ineligible cargo');
});

check('F2 no arrival manifest is persisted in the save schema', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const saveSrc = readFileSync(join(here, '..', 'src/game/save.js'), 'utf8');
  for (const token of ['arrivalHold', 'arrivedUnits', 'arrivalNotices', 'arrivalManifest']) {
    assert.equal(saveSrc.includes(token), false, `save.js carries no ${token} field`);
  }
  const stationSrc = readFileSync(join(here, '..', 'src/systems/station.js'), 'utf8');
  assert.equal(/ctx\.world\.arrival|world\.arrivalHold/.test(stationSrc), false,
    'the manifest never lands on ctx.world');
  assert.ok(stationSrc.includes('let arrivalHold = null'), 'the manifest is module-scoped session state');
});

check('F3 session reload deliberately initializes from restored cargo', () => {
  const snap = JSON.parse(JSON.stringify(snapshot(ctx)));
  const credits = ctx.world.credits;
  restoreSave(ctx, snap);
  step(240);
  assert.equal(settledHere(HAUL), true, 'restored cargo initializes session eligibility');
  assert.equal(ctx.world.credits - credits, lockedPay(HAUL), 'known reload limitation is explicit');
});

// ---------------------------------------------------------------------------
// Boot pin: the exploit berth and the honest berth, as one JSON line.
// ---------------------------------------------------------------------------
if (bootPin) {
  // 1. Dock empty, buy the dock's own stock: nothing settles, and the desk says why.
  arrive([], DEST, 0);
  step(60);
  ctx.stationDesk.selectService('jobs');
  const creditsA = ctx.world.credits;
  ctx.stationDesk.trade({ commodity: 'provisions', qty: HAUL_UNITS * 2, side: 'buy' });
  const afterBuy = ctx.world.credits;
  step(240);
  const bought = {
    boughtHere: holdOf('provisions') === HAUL_UNITS * 2 && afterBuy < creditsA,
    noRowSettled: [HAUL, TRADE_A, TRADE_B].every((id) => stateOf(id) === 'accepted'),
    noMarginPaid: ctx.world.credits === afterBuy,
    cargoUntouched: holdOf('provisions') === HAUL_UNITS * 2,
    deskExplains: ARRIVAL_LINE.test(deskNotice()),
  };
  dock(DEST);
  step(240);
  bought.sameSystemRedockUnpaid = [HAUL, TRADE_A, TRADE_B].every((id) => stateOf(id) === 'accepted')
    && ctx.world.credits === afterBuy && holdOf('provisions') === HAUL_UNITS * 2;

  // 2. The same goods, actually carried in: every row settles for its quote.
  const creditsB = ctx.world.credits;
  arrive([['provisions', HAUL_UNITS * 3]]);
  const arrived = {
    arrivedAllSettled: OPEN.every(settledHere),
    arrivedExactPay: ctx.world.credits - creditsB === sumPay(...OPEN),
    arrivedCargoSpent: holdOf('provisions') === 0,
    neverUndocked: ctx.flags.docked === true,
  };
  const settledCredits = ctx.world.credits;
  step(600);
  arrived.noRepay = ctx.world.credits === settledCredits;

  // 3. One manifest, shared: five arrived units fund ONE row (issue 181 order),
  //    and buying a second set in the same berth funds nothing.
  const creditsC = ctx.world.credits;
  arrive([['provisions', HAUL_UNITS]]);
  const shared = {
    sharedConsignmentFirst: settledHere(HAUL) && stateOf(TRADE_A) === 'accepted'
      && stateOf(TRADE_B) === 'accepted',
    sharedPaidExactly: ctx.world.credits - creditsC === sumPay(HAUL, PARTY),
  };
  const afterShared = ctx.world.credits;
  ctx.stationDesk.trade({ commodity: 'provisions', qty: HAUL_UNITS, side: 'buy' });
  const afterTopUp = ctx.world.credits;
  step(240);
  shared.topUpFundsNothing = ctx.world.credits === afterTopUp && afterTopUp < afterShared
    && stateOf(TRADE_A) === 'accepted' && stateOf(TRADE_B) === 'accepted';

  // 4. Sell the arrived cargo and buy it straight back: the run is still gone.
  arrive([['provisions', HAUL_UNITS]], DEST, 0);
  ctx.stationDesk.trade({ commodity: 'provisions', qty: HAUL_UNITS, side: 'sell' });
  ctx.stationDesk.trade({ commodity: 'provisions', qty: HAUL_UNITS, side: 'buy' });
  const afterRebuy = ctx.world.credits;
  step(240);
  const resold = {
    resoldNotPaid: ctx.world.credits - afterRebuy === lockedPay(PARTY)
      && stateOf(HAUL) === 'accepted' && stateOf(TRADE_A) === 'accepted',
    resoldCargoKept: holdOf('provisions') === HAUL_UNITS,
  };

  console.log('WAVE182 ' + JSON.stringify({ ...bought, ...arrived, ...shared, ...resold }));
  process.exit(0);
}

console.log('ISSUE-182 ARRIVAL CARGO OK');
