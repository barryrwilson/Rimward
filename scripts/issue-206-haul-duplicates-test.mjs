/** Issue #206: every board posted a duplicate legacy provisions haul next to the
 * generated trade row. The legacy `haul-provisions` posting is retired.
 *
 *  A. A fresh Freehold and Veridian board posts the GENERATED Provisions trade
 *     row — with the commodity, destination, origin and window an agent can
 *     filter on — and no legacy consignment beside it, at the same pay.
 *  B. An older save's still-OFFERED legacy row is stale paper: it never posts on
 *     a board, it is never observable as an offer, and no accept path takes it.
 *     The saved record itself is left alone; nothing is stamped on it.
 *  C. An older save's ACCEPTED legacy row is a live agreement and is untouched:
 *     it keeps its board card, its named destination, its arrival-cargo guard
 *     and its locked quote, it pays that quote exactly once, and it is persisted
 *     to the save while it is being flown (a real save/restore of a flown
 *     agreement is covered by issue #181 case F).
 *
 * Real station DOM closures, the real jobs board, the real desk accept path, the
 * real agent observation and the real throttled delivery tick. Fixtures are
 * disclosed cash/cargo/clock and an explicitly injected legacy record in the
 * exact shape the retired accept path used to stamp — never a weakened assertion.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-206-haul-duplicates-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { requestAutosave } from '../src/game/save.js';
import { SYSTEMS } from '../src/game/state.js';

seedBootRandom();
const dom = installDomStubs();
const KEY = 'rimward-save-v1';
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
const save = systems.find(([n]) => n === 'save')[1];

const HAUL = 'haul-provisions';
const HAUL_UNITS = 5;
let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

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

/** Berth at `id`. Deliberately clock-free (the #170 dock fixture): section A
 * reads the board a fresh arrival actually rolls, so the generated postings are
 * the same ones the #206 playtest reported. `step` owns the clock. */
function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  // Fixture: place the hull at the safe berth. The real dock path, the real
  // board refresh and the real delivery tick still own every mutation.
  ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }];
  world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, 'docked at ' + id);
  assert.equal(ctx.world.currentSystem, id, 'berthed in ' + id);
}

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const openBoard = () => ctx.stationDesk.selectService('jobs');
const offers = () => window.rimward.observe().jobs.offers;
const active = () => window.rimward.observe().jobs.active;
const jobById = (id) => ctx.world.jobs.find((j) => j && j.id === id);
const stateOf = (id) => jobById(id)?.state ?? 'gone';
const holdOf = (commodity) => ctx.cargo
  .filter((r) => r.commodity === commodity).reduce((n, r) => n + r.units, 0);
const setHold = (rows) => {
  ctx.cargo.length = 0;
  for (const [commodity, units] of rows) ctx.cargo.push({ commodity, units });
};
const dropHaulRows = () => {
  for (let i = ctx.world.jobs.length - 1; i >= 0; i--) {
    if (ctx.world.jobs[i] && ctx.world.jobs[i].id === HAUL) ctx.world.jobs.splice(i, 1);
  }
};
/** The verbatim card copy the retired posting used to draw (station.js §jobs). */
const LEGACY_REWARD_LINE = /^Haul 5 Provisions to /;

/** The retired posting, in the exact shape `makeJobs` used to seed. An old save
 * can legitimately hold this row, so every scenario below starts from it rather
 * than from a hand-loosened stand-in. */
function legacyOfferedRow() {
  return {
    id: HAUL,
    kind: 'haul',
    title: 'Haul provisions',
    detail: 'Provisions are worth more a gate away. Accept here, buy 5 Provisions, and dock at the other system\'s station — paid at 140% of your buy cost on delivery.',
    reward: 0,
    state: 'offered',
    progress: 0,
    need: HAUL_UNITS,
    originSystem: null,
    originPrice: 0,
  };
}

/** The retired posting AFTER the old accept path stamped it: a live agreement
 * with a disclosed origin, a disclosed buy price and a LOCKED quote. */
const LOCKED_PAY = 777;
const LOCKED_PRICE = 100;
function legacyAcceptedRow(origin) {
  return {
    ...legacyOfferedRow(),
    state: 'accepted',
    originSystem: origin,
    originPrice: LOCKED_PRICE,
    payQuoted: LOCKED_PAY,
  };
}

for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;

const HOME = 'freehold';
const DEST = SYSTEMS[HOME].gates[0].to;
assert.ok(Object.hasOwn(SYSTEMS, DEST), 'the primary gate names a real dock');
const ALT = Object.keys(SYSTEMS).find((id) => id !== HOME && id !== DEST);
assert.ok(ALT, 'a third system exists to prove the destination gate still bites');

// ---------------------------------------------------------------------------
// A. A fresh board posts ONE Provisions run, and it is the generated trade row.
// ---------------------------------------------------------------------------
for (const sysId of [HOME, 'veridian']) {
  check(`A1 ${sysId} posts no legacy haul consignment at all`, () => {
    dock(sysId);
    openBoard();
    assert.equal(jobById(HAUL), undefined, 'a fresh game never seeds the retired row');
    assert.equal(ctx.world.jobs.some((j) => j && j.kind === 'haul'), false,
      'and no haul-kind posting exists anywhere in the world');
    assert.equal(offers().some((o) => o.id === HAUL || o.kind === 'haul'), false,
      'the agent observation has no haul offer');
    assert.equal(byClass('job-reward').some((n) => LEGACY_REWARD_LINE.test(n.textContent)), false,
      'and the legacy card is not drawn on the board');
  });

  check(`A2 ${sysId} posts the generated Provisions trade row with every filterable field`, () => {
    const row = offers().find((o) => o.kind === 'trade' && o.commodity === 'provisions');
    assert.ok(row, 'the generated Provisions run is on the board');
    // The fields issue #206 reported missing on the legacy row.
    assert.equal(row.originSystem, sysId, 'it names its origin dock');
    assert.ok(Object.hasOwn(SYSTEMS, row.destSystem), 'it names a real destination');
    assert.equal(row.need, HAUL_UNITS, 'it is the same five-unit run');
    assert.ok(Number.isFinite(row.deadline) && Number.isFinite(row.secondsLeft),
      'it carries a window an agent can plan against');
    assert.ok(Number.isFinite(row.reward) && row.reward > 0, 'it posts a real quote');
    assert.equal(byClass('job-title').filter((n) => /Haul Provisions$/.test(n.textContent)).length, 1,
      'exactly one Provisions run is drawn on the board');
  });

  check(`A3 ${sysId}'s trade row covers the retired posting's own run and pay`, () => {
    // The duplication the issue reported, proven against production code. The
    // retired posting's own quote comes from the real desk quoting path, priced
    // off this dock exactly as a legacy agreement here would have been. The
    // generated row is the same five-Provisions run for at least that money: on
    // the primary gate — the only destination the retired posting could ever
    // name — it is the same money to the UU, and a longer posted run pays the
    // distance premium on top. Nothing the retirement removed is worth less now.
    const row = offers().find((o) => o.kind === 'trade' && o.commodity === 'provisions');
    const legacy = { ...legacyOfferedRow(), state: 'accepted', originSystem: sysId };
    const legacyQuote = ctx.stationDesk.peekJobReward(legacy);
    assert.ok(Number.isFinite(legacyQuote) && legacyQuote > 0,
      'the desk still quotes a legacy haul row');
    if (row.destSystem === SYSTEMS[sysId].gates[0].to) {
      assert.equal(row.reward, legacyQuote,
        'a primary-gate run pays exactly what the retired posting paid');
    } else {
      assert.ok(row.reward > legacyQuote,
        `a longer posted run pays more than the retired posting (${row.reward} vs ${legacyQuote})`);
    }
  });
}

check('A4 a detached legacy handle is refused even when no saved row exists', () => {
  dock(HOME);
  openBoard();
  const credits = ctx.world.credits;
  const res = ctx.stationDesk.acceptJob({ id: HAUL, kind: 'haul' });
  assert.equal(res.ok, false, JSON.stringify(res));
  assert.equal(jobById(HAUL), undefined, 'and no phantom agreement was created');
  assert.equal(ctx.world.credits, credits, 'nothing was paid or fronted');
});

// ---------------------------------------------------------------------------
// B. An old save's still-OFFERED legacy row is stale paper.
// ---------------------------------------------------------------------------
check('B1 a stale offered legacy row is not posted and not observable', () => {
  dropHaulRows();
  ctx.world.jobs.push(legacyOfferedRow());
  dock(HOME);
  openBoard();
  assert.equal(stateOf(HAUL), 'offered', 'the saved record is still there');
  assert.equal(ctx.stationDesk.peekOffers().some((j) => j.id === HAUL), false,
    'the desk does not post it');
  assert.equal(offers().some((o) => o.id === HAUL), false,
    'the agent board does not offer it');
  assert.equal(active().some((o) => o.id === HAUL), false,
    'and it is not reported as an active agreement either');
  assert.equal(byClass('job-reward').some((n) => LEGACY_REWARD_LINE.test(n.textContent)), false,
    'no card is drawn for it');
});

check('B2 no accept path takes a stale offered legacy row, and none mutates it', () => {
  const before = JSON.parse(JSON.stringify(jobById(HAUL)));
  const credits = ctx.world.credits;
  const cargo = holdOf('provisions');
  const byId = ctx.stationDesk.acceptJob(HAUL);
  assert.equal(byId.ok, false, JSON.stringify(byId));
  assert.equal(byId.token, 'not-offered', 'the desk gives the board gate\'s own refusal token');
  const byHandle = ctx.stationDesk.acceptJob({ id: HAUL, kind: 'haul' });
  assert.equal(byHandle.ok, false, JSON.stringify(byHandle));
  // The board accept keys index the POSTED rows, and so do the drawn Accept
  // buttons. The retired row is in neither list, so no key and no click reaches
  // it — there is no board position that names it.
  const posted = ctx.stationDesk.peekOffers();
  assert.equal(posted.some((j) => j.id === HAUL), false, 'no accept key indexes it');
  openBoard();
  assert.deepEqual(jobById(HAUL), before, 'the saved record is byte-identical');
  assert.equal(Object.hasOwn(jobById(HAUL), 'payQuoted'), false, 'no quote was stamped');
  assert.equal(jobById(HAUL).originSystem, null, 'no origin was stamped');
  assert.equal(ctx.world.credits, credits, 'no cash moved');
  assert.equal(holdOf('provisions'), cargo, 'and no cargo was fronted');
});

check('B3 a stale offered legacy row is still written back to the save', () => {
  requestAutosave(ctx);
  step(180);
  const saved = JSON.parse(localStorage.getItem(KEY));
  const row = saved.world.jobs.find((j) => j && j.id === HAUL);
  assert.ok(row, 'retiring the posting does not delete a player\'s saved record');
  assert.equal(row.state, 'offered', 'and does not rewrite its state');
});

// ---------------------------------------------------------------------------
// C. An old save's ACCEPTED legacy row is a live agreement, unchanged.
// ---------------------------------------------------------------------------
check('C1 an accepted legacy agreement keeps its card, with no way to take it again', () => {
  dropHaulRows();
  ctx.world.jobs.push(legacyAcceptedRow(HOME));
  dock(HOME);
  openBoard();
  assert.equal(ctx.stationDesk.peekOffers().some((j) => j.id === HAUL), false,
    'an accepted agreement is not an offer');
  const seen = active().find((o) => o.id === HAUL);
  assert.ok(seen, 'it IS reported as an active agreement');
  assert.equal(seen.reward, LOCKED_PAY, 'and reports the quote it locked at acceptance');
  assert.ok(byClass('job-reward').some((n) => LEGACY_REWARD_LINE.test(n.textContent)),
    'the player can still read the run he is committed to');
  assert.equal(byClass('job-card').some((card) => [...dom.walkDom(card)]
    .some((n) => /^Accept \(/.test(String(n.textContent)))
    && [...dom.walkDom(card)].some((n) => LEGACY_REWARD_LINE.test(String(n.textContent)))), false,
    'but the card offers no Accept button');
  const res = ctx.stationDesk.acceptJob(HAUL);
  assert.equal(res.ok, false, JSON.stringify(res));
  assert.equal(stateOf(HAUL), 'accepted', 'and the agreement is untouched');
});

check('C2 it is persisted to the save while it is being flown', () => {
  requestAutosave(ctx);
  step(180);
  const row = JSON.parse(localStorage.getItem(KEY)).world.jobs.find((j) => j && j.id === HAUL);
  assert.ok(row, 'the agreement is persisted');
  assert.equal(row.state, 'accepted');
  assert.equal(row.originSystem, HOME, 'with its origin');
  assert.equal(row.originPrice, LOCKED_PRICE, 'its buy price');
  assert.equal(row.payQuoted, LOCKED_PAY, 'and its locked quote');
});

check('C3 the named destination still gates the payout', () => {
  const credits = ctx.world.credits;
  setHold([['provisions', HAUL_UNITS]]);
  dock(ALT);
  step(240);
  assert.equal(stateOf(HAUL), 'accepted', `${ALT} is not the named dock, so nothing settled`);
  assert.equal(ctx.world.credits, credits, 'and nothing was paid');
  assert.equal(holdOf('provisions'), HAUL_UNITS, 'the cargo is untouched');
});

check('C4 the arrival-cargo guard still holds at the named destination', () => {
  setHold([]);
  dock(DEST);
  step(60);
  const credits = ctx.world.credits;
  const bought = ctx.stationDesk.trade({ commodity: 'provisions', qty: HAUL_UNITS, side: 'buy' });
  assert.equal(bought.ok, true, JSON.stringify(bought));
  const afterBuy = ctx.world.credits;
  step(240);
  assert.equal(stateOf(HAUL), 'accepted', 'stock bought at the far dock does not settle the run');
  assert.equal(ctx.world.credits, afterBuy, 'not one UU of margin was paid');
  assert.equal(holdOf('provisions'), HAUL_UNITS, 'and no cargo was taken');
  assert.ok(credits > afterBuy, 'the purchase itself was real');
});

check('C5 the run that arrived with the ship pays the locked quote, exactly once', () => {
  // Issue 219: leave the destination system before returning with the cargo.
  // A same-system redock is no longer an arrival fixture.
  dock(HOME);
  setHold([['provisions', HAUL_UNITS]]);
  dock(DEST);
  const credits = ctx.world.credits;
  step(240);
  assert.equal(stateOf(HAUL), 'done', 'the legacy agreement settled at its named dock');
  assert.equal(ctx.world.credits - credits, LOCKED_PAY,
    'and paid the quote the old save locked, not a re-quote');
  assert.equal(holdOf('provisions'), 0, 'the five arrived units were delivered');
  const settled = ctx.world.credits;
  step(600); // ten seconds: twenty delivery passes
  assert.equal(ctx.world.credits, settled, 'a settled agreement is never paid again');
  assert.equal(stateOf(HAUL), 'done', 'and never reopens');
});

check('C6 a paid-out legacy agreement leaves the board for good', () => {
  openBoard();
  assert.equal(byClass('job-reward').some((n) => LEGACY_REWARD_LINE.test(n.textContent)), false,
    'the done card is not redrawn');
  assert.equal(offers().some((o) => o.id === HAUL), false, 'and is not re-offered');
  const res = ctx.stationDesk.acceptJob(HAUL);
  assert.equal(res.ok, false, JSON.stringify(res));
  assert.equal(stateOf(HAUL), 'done', 'no retry reopens the retired posting');
});

console.log(`\nOK issue-206 haul duplicate retirement — ${checks} checks`);
