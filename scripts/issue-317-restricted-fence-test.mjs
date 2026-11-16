/**
 * Issue #317 focused regression suite — restricted locker gate legibility and
 * the People-desk fence sell verb.
 *
 * Playtest finding: a restricted-cargo sale flipped from refused to allowed
 * between dock visits with no surfaced reason, and there was no fence sell
 * verb. The fix is copy/API surfacing only: the refusal names the live gate
 * and every unlock, the market pane shows why the row is refused, the agent
 * API carries the same reason, and the Freehold fence offers an ordinary
 * market sale of the player's restricted cargo.
 *
 * This suite boots the real station system through the shared boot harness
 * (real closures, real DOM builders) with disclosed fixtures only: berth
 * placement, fear, Freehold standing, cargo and credits. No natural flight,
 * no campaign progression, no price tuning is claimed.
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS, COMMODITIES, ECON, FACTIONS } from '../src/game/state.js';
import { initAgentApi } from '../src/systems/agent-api.js';
import { addFavor, contactsForSystem } from '../src/game/contacts.js';

seedBootRandom(317);
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];

// Start a fresh session on the Greenhand (Freehold) origin.
for (const n of dom.walkDom(document.body)) if (n.dataset?.titleAction === 'new') { n.click(); break; }
dom.dispatchKey('Digit1');
ctx.agent.optIn = true;
initAgentApi(ctx);
const api = window.rimward;
const act = (name, args = {}) => api.act({ v: 2, name, args });

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const texts = () => nodes().map((n) => n.textContent).filter((t) => typeof t === 'string' && t);
let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

// Pin the gate copy from its two named sources: ECON.fear.tributeOpensAt in
// state.js and station.js's RESTRICTED_REP_GATE (-25), plus the Freehold
// faction display name. The issue-317 suite owns the exact copy pin.
const OPEN_AT = ECON.fear.tributeOpensAt;
const RESTRICTED_REP_GATE = -25;
const FREEHOLD_NAME = FACTIONS.freehold.name;
assert.equal(OPEN_AT, 40, 'the gate threshold this suite pins');
assert.equal(FREEHOLD_NAME, 'Freehold Compact', 'the faction name the refusal speaks');
const gateClause = (fear) =>
  `fear ${fear}/${OPEN_AT} (opens at ${OPEN_AT}); a burned ${FREEHOLD_NAME} name (standing below ${RESTRICTED_REP_GATE}) or a fence's favor at the People desk opens it too`;
const gateLine = (fear) => `Restricted locker closed — ${gateClause(fear)}.`;
const refusalLine = (fear) =>
  `“Not while the Compact watches,” the dockmaster says. “${gateLine(fear)}”`;

function dockFreehold() {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.world.currentSystem = 'freehold';
  const p = SYSTEMS.freehold.station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  station.update(1 / 60);
  ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true, 'docked at Freehold');
}

function fixture({ fear = 38, rep = 0, units = 4, credits = 5000 } = {}) {
  ctx.flags.combat = false;
  ctx.world.currentSystem = 'freehold';
  ctx.world.fear = fear;
  ctx.world.reputation.freehold = rep;
  ctx.world.credits = credits;
  ctx.cargoCapacity = 100;
  ctx.cargo.splice(0, ctx.cargo.length,
    ...(units > 0 ? [{ commodity: 'restrictedComponents', units }] : []));
  ctx.world.marketSupply = {};
}

const restrictedUnits = () =>
  ctx.cargo.filter((c) => c.commodity === 'restrictedComponents').reduce((n, c) => n + c.units, 0);
const snapshot = () => JSON.stringify([ctx.world.credits, ctx.cargo, ctx.world.marketSupply]);

dockFreehold();

// ---- 1. the refusal states the gate, the unlocks and mutates nothing -------
check('a restricted sell refuses with the gate line and token restricted, mutating nothing', () => {
  fixture({ fear: 38, rep: 0, units: 4 });
  ctx.stationDesk.selectService('market');
  const before = snapshot();
  for (const side of ['buy', 'sell']) {
    const receipt = act('trade', { commodity: 'restrictedComponents', qty: 1, side });
    assert.equal(receipt.ok, false, side + ' refused');
    assert.equal(receipt.token, 'restricted', side + ' token');
    assert.equal(receipt.error, refusalLine(38), side + ' exact gate line');
    // The dockmaster prefix is the one the playtest knew; it must survive.
    assert.ok(receipt.error.startsWith('“Not while the Compact watches,” the dockmaster says. “Restricted locker closed — '));
    assert.match(receipt.error, /opens at 40/);
    assert.match(receipt.error, /standing below -25/);
    assert.match(receipt.error, /People desk/);
  }
  assert.equal(snapshot(), before, 'no credits, cargo or stock moved');
});

// ---- 2. availability reports the same reason, empty when allowed ----------
check('peekTradeAvailability states tradeAllowedReason only while closed', () => {
  fixture({ fear: 38, rep: 0, units: 4 });
  const closed = ctx.stationDesk.peekTradeAvailability('restrictedComponents');
  assert.equal(closed.tradeAllowed, false);
  assert.equal(closed.tradeAllowedReason, gateLine(38));
  const legal = ctx.stationDesk.peekTradeAvailability('provisions');
  assert.equal(legal.tradeAllowed, true);
  assert.equal(legal.tradeAllowedReason, '', 'allowed rows carry an empty reason');
});

// ---- 3. the market pane visibly says why, keeping the pinned span ---------
check('the market pane keeps the exact trade refused span and adds a visible gate reason', () => {
  fixture({ fear: 38, rep: 0, units: 4 });
  ctx.stationDesk.selectService('market');
  const refused = nodes().filter((n) => n.textContent === 'trade refused');
  assert.equal(refused.length, 1, 'exactly one trade refused element');
  assert.ok(String(refused[0].className).split(' ').includes('market-refusal'));
  const title = refused[0].title ?? refused[0].getAttribute?.('title');
  assert.equal(title, gateLine(38), 'the full gate line rides the refused span');
  const reasons = byClass('market-refusal-reason');
  assert.equal(reasons.length, 1, 'one visible reason element');
  assert.equal(reasons[0].textContent, 'closed — fear 38/40');
  const note = texts().find((t) => t.startsWith('The dockmaster keeps the restricted locker closed — '));
  assert.equal(note, `The dockmaster keeps the restricted locker closed — ${gateClause(38)}.`);
  // The structured station view (agent API v2) captures the same reason text.
  const view = api.observe().station.view;
  assert.ok(view, 'docked station view');
  assert.ok(view.rows.some((r) => r.cls === 'market-refusal-reason' && r.text === 'closed — fear 38/40'),
    'station.view rows carry the visible reason');
});

// ---- 4. the agent market rows carry the reason only when refused ----------
check('observe().market rows carry tradeAllowedReason only on refused rows', () => {
  fixture({ fear: 38, rep: 0, units: 4 });
  ctx.stationDesk.selectService('market');
  const rows = api.observe().market.rows;
  const restricted = rows.find((r) => r.commodity === 'restrictedComponents');
  assert.ok(restricted, 'restricted row is present');
  assert.equal(restricted.tradeAllowed, false);
  assert.equal(restricted.tradeAllowedReason, gateLine(38));
  const allowed = rows.filter((r) => r.tradeAllowed === true);
  assert.ok(allowed.length > 0, 'legal rows are present and allowed');
  for (const row of allowed) assert.equal(Object.hasOwn(row, 'tradeAllowedReason'), false);
});

// ---- 5. fear 40 opens the gate: availability, pane and sale agree ---------
check('fear 40 opens the locker and the sale succeeds', () => {
  fixture({ fear: 40, rep: 0, units: 4 });
  ctx.stationDesk.selectService('market');
  const availability = ctx.stationDesk.peekTradeAvailability('restrictedComponents');
  assert.equal(availability.tradeAllowed, true);
  assert.equal(availability.tradeAllowedReason, '');
  assert.equal(byClass('market-refusal').length, 0, 'no refused span at the open gate');
  assert.equal(byClass('market-refusal-reason').length, 0, 'no visible reason at the open gate');
  const row = api.observe().market.rows.find((r) => r.commodity === 'restrictedComponents');
  assert.equal(row.tradeAllowed, true);
  assert.equal(Object.hasOwn(row, 'tradeAllowedReason'), false);
  const before = ctx.world.credits;
  const receipt = act('trade', { commodity: 'restrictedComponents', qty: 1, side: 'sell' });
  assert.equal(receipt.ok, true);
  assert.equal(restrictedUnits(), 3);
  assert.ok(ctx.world.credits > before);
});

// ---- 6. a burned Freehold name opens it at fear 0 -------------------------
check('Freehold standing -30 opens the locker at fear 0 and the sale succeeds', () => {
  fixture({ fear: 0, rep: -30, units: 2 });
  ctx.stationDesk.selectService('market');
  const availability = ctx.stationDesk.peekTradeAvailability('restrictedComponents');
  assert.equal(availability.tradeAllowed, true);
  assert.equal(availability.tradeAllowedReason, '');
  const before = ctx.world.credits;
  const receipt = act('trade', { commodity: 'restrictedComponents', qty: 1, side: 'sell' });
  assert.equal(receipt.ok, true);
  assert.equal(restrictedUnits(), 1);
  assert.ok(ctx.world.credits > before);
});

// ---- 7. the People desk offers the sell verb, refused while closed --------
check('the People-desk fence row offers the sell verb and refuses with the gate line while closed', () => {
  fixture({ fear: 38, rep: 0, units: 4 });
  ctx.stationDesk.selectService('people');
  const action = api.observe().station.view.actions.find((a) => a.label === 'Sell restricted cargo (4)');
  assert.ok(action, 'the fence card offers Sell restricted cargo (4)');
  const before = snapshot();
  const receipt = ctx.stationDesk.perform({ n: action.n, expect: action.label });
  assert.equal(receipt.ok, false, 'the click is a refusal');
  assert.equal(receipt.token, 'restricted');
  assert.equal(receipt.notice, refusalLine(38));
  assert.equal(snapshot(), before, 'the refused click moves nothing');
  // The agent path agrees with the player click.
  const again = api.observe().station.view.actions.find((a) => a.label === 'Sell restricted cargo (4)');
  assert.ok(again);
  const viaApi = act('stationAction', { n: again.n, expect: again.label });
  assert.equal(viaApi.ok, false);
  assert.equal(viaApi.token, 'restricted');
  assert.equal(viaApi.error, refusalLine(38));
  assert.equal(snapshot(), before, 'the agent refusal moves nothing');
  assert.equal(ctx.stationDesk.peekTradeAvailability('restrictedComponents').tradeAllowed, false);
});

// ---- 8. a fence favor opens the locker and the row sells all four ---------
check('a fence favor opens the locker and the fence row sells all four units', () => {
  fixture({ fear: 38, rep: 0, units: 4 });
  const fence = contactsForSystem(ctx, 'freehold').find((c) => c.role === 'fence');
  assert.ok(fence, 'the Freehold fence is on the People roster');
  addFavor(ctx, fence, 1);
  assert.ok(fence.favors >= 1, 'one favor is banked');
  ctx.stationDesk.selectService('people');
  const favor = api.observe().station.view.actions.find((a) => a.label === 'Call in a favor');
  assert.ok(favor, 'the fence card offers Call in a favor');
  const called = ctx.stationDesk.perform({ n: favor.n, expect: favor.label });
  assert.equal(called.ok, true);
  assert.equal(ctx.station.fenceUnlocked, true, 'the favor opens the locker for this visit');
  const availability = ctx.stationDesk.peekTradeAvailability('restrictedComponents');
  assert.equal(availability.tradeAllowed, true);
  assert.equal(availability.tradeAllowedReason, '');
  const sell = api.observe().station.view.actions.find((a) => a.label === 'Sell restricted cargo (4)');
  assert.ok(sell, 'the sell verb is still offered while the hold carries four');
  const before = ctx.world.credits;
  const sold = ctx.stationDesk.perform({ n: sell.n, expect: sell.label });
  assert.equal(sold.ok, true);
  assert.match(sold.notice, /^Sold 4 Restricted components for \d+ UU\.$/);
  assert.equal(restrictedUnits(), 0, 'all four units left the hold');
  assert.ok(ctx.world.credits > before, 'credits rose by the market fill');
  // With nothing left to sell the row is not offered.
  ctx.stationDesk.selectService('people');
  assert.equal(api.observe().station.view.actions.some((a) => a.label.startsWith('Sell restricted cargo')), false);
});

console.log(`ISSUE-317 RESTRICTED FENCE PASS (${checks} scenarios)`);
