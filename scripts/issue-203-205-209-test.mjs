/** Issues 203/205/209: exercise the public API against real station closures. */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS, COMMODITIES } from '../src/game/state.js';
import { chainEmployerKeys, chainOriginSystem, makeChainJob } from '../src/game/jobs-chains.js';
import { initAgentApi } from '../src/systems/agent-api.js';
seedBootRandom(203);
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];
for (const n of dom.walkDom(document.body)) if (n.dataset?.titleAction === 'new') { n.click(); break; }
dom.dispatchKey('Digit1');
ctx.agent.optIn = true;
initAgentApi(ctx);
const api = window.rimward;
const act = (name, args = {}) => api.act({ v: 2, name, args });
const dockHere = () => {
  const p = SYSTEMS[ctx.world.currentSystem].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  station.update(1 / 60);
  assert.equal(ctx.flags.docked, true);
};
dockHere();
ctx.world.credits = 100000;
ctx.cargoCapacity = 1000;
ctx.cargo.length = 0;
ctx.world.marketSupply = {};
assert.equal(act('openService', { id: 'market' }).ok, true);
let snap = api.observe();
const quantity = snap.station.view.actions.filter(a => ['+1', '+5', '−1', '−5'].includes(a.label));
assert.ok(quantity.length > 0);
for (const a of quantity) assert.ok(Object.hasOwn(COMMODITIES, a.commodity));
for (const row of snap.market.rows.filter(r => r.tradeAllowed)) {
  assert.deepEqual(quantity.filter(a => a.commodity === row.commodity).map(a => a.label), ['+1', '+5', '−1', '−5']);
}
for (const label of ['Buy Max', 'Sell All']) assert.equal(snap.station.view.actions.find(a => a.label === label).commodity, 'provisions');
assert.ok(snap.station.view.rows.length <= 120);
const buy = quantity.find(a => a.commodity === 'provisions' && a.label === '+5');
assert.equal(act('stationAction', { n: buy.n, expect: buy.label }).ok, true);
assert.equal(ctx.cargo.find(c => c.commodity === 'provisions')?.units, 5);
console.log('PASS market actions bind all commodity rows and invoke the correct trade');
// Disclosed fixture: change the quote after the first persisted 99-unit fill.
// This exercises the real partial-order branch and its captured review closure.
ctx.cargo.length = 0;
ctx.world.marketSupply = {};
ctx.world.prices.provisions = 100;
ctx.stationDesk.selectService('market');
const find = id => [...dom.walkDom(document.body)].find(n => n.id === id);
const input = find('market-bulk-quantity');
input.value = '160';
for (const fn of input._listeners.input) fn({ target: input });
const save = localStorage.setItem;
let fills = 0;
localStorage.setItem = (key, value) => {
  save(key, value);
  if (key === 'rimward-save-v1' && ++fills === 1) ctx.world.prices.provisions = 101;
};
try { find('market-bulk-buy').click(); } finally { localStorage.setItem = save; }
assert.equal(ctx.cargo.find(c => c.commodity === 'provisions')?.units, 99);
const review = api.observe().station.view.actions.find(a => a.label.startsWith('Review remainder: 61'));
assert.ok(review);
assert.equal(review.commodity, 'provisions');
const beforeReview = JSON.stringify([ctx.world.credits, ctx.cargo, ctx.world.marketSupply]);
assert.equal(act('stationAction', { n: review.n, expect: review.label }).ok, true);
assert.equal(JSON.stringify([ctx.world.credits, ctx.cargo, ctx.world.marketSupply]), beforeReview);
assert.ok(api.observe().station.view.actions.some(a => a.label.startsWith('Buy 61 Provisions') && a.commodity === 'provisions'));
console.log('PASS remainder review retains commodity and prepares only the unfilled quantity without trading');

const refusalLine = '“Not while the Compact watches,” the dockmaster says. “Come back when the right people notice you.”';
for (const side of ['buy', 'sell']) {
  const before = JSON.stringify([ctx.world.credits, ctx.cargo, ctx.world.marketSupply]);
  assert.equal(api.observe().market.rows.find(r => r.commodity === 'restrictedComponents').tradeAllowed, false);
  const receipt = act('trade', { commodity: 'restrictedComponents', qty: 1, side });
  assert.equal(receipt.ok, false);
  assert.equal(receipt.token, 'restricted');
  assert.equal(receipt.error, refusalLine);
  assert.equal(JSON.stringify([ctx.world.credits, ctx.cargo, ctx.world.marketSupply]), before);
}
assert.equal(act('trade', { commodity: 'provisions', qty: 0, side: 'buy' }).token, 'bad-qty');
console.log('PASS restricted buy/sell retain prose, agree with market, and mutate no resources');
ctx.stationDesk.selectService('jobs');
const homeName = SYSTEMS.freehold.station.name;
const filing = `Intel acquired—return to ${homeName} to file.`;
const briefing = `Report at ${homeName} for payment after completing the objective.`;
const takeSpy = () => {
  ctx.stationDesk.selectService('jobs');
  const offer = api.observe().jobs.offers.find(j => j.kind === 'espionage');
  assert.ok(offer);
  assert.equal(act('acceptJob', { id: offer.id }).ok, true);
  return ctx.world.jobs.find(j => j.id === offer.id);
};
const spy = takeSpy();
for (const progress of [0, 1]) {
  spy.progress = progress;
  ctx.stationDesk.selectService('jobs');
  const row = api.observe().jobs.active.find(j => j.id === spy.id);
  assert.equal(row.payAt, 'freehold');
  assert.match(row.status, new RegExp(homeName));
  // Issue 235: the collected objective states the filing run outright; the
  // uncollected contract keeps the #205 briefing and its destination fields.
  assert.equal(row.status, progress >= 1 ? filing : briefing);
  assert.equal(row.progress, progress);
  assert.equal(row.need, 1);
  assert.equal(row.destSystem, spy.destSystem);
  assert.equal(row.originSystem, 'freehold');
  assert.ok(row.reward > 0);
  const deskLines = [...dom.walkDom(document.body)].map(n => n.textContent || '');
  assert.ok(deskLines.some(t => t.includes(`file at ${homeName}`)));
  // The API line and the rendered card agree about the same collection state.
  assert.ok(deskLines.some(t => t.includes(progress >= 1 ? 'intel aboard' : 'gather at')));
}
ctx.stationDesk.undock();
const inFlight = api.observe().jobs.active.find(j => j.id === spy.id);
assert.equal(inFlight.payAt, 'freehold');
assert.equal(inFlight.status, filing);
console.log('PASS spy status flips to the filing instruction on collection and agrees with the desk card');
// Abandoned: the collected row leaves active immediately and pays nothing.
spy.progress = 0;
dockHere();
ctx.stationDesk.selectService('jobs');
spy.progress = 1;
const beforeAbandon = ctx.world.credits;
assert.equal(act('abandonJob', { id: spy.id }).ok, true);
assert.equal(ctx.world.credits, beforeAbandon);
assert.equal(api.observe().jobs.active.some(j => j.id === spy.id), false);
assert.equal(ctx.stationDesk.peekJobReturn(spy), null);
assert.equal(ctx.agent.jobNoted[spy.id], 'abandoned');
// Delivered: settlement at the origin pays exactly once and clears the row.
const filed = takeSpy();
filed.progress = 1;
const reward = api.observe().jobs.active.find(j => j.id === filed.id).payQuoted;
assert.ok(Number.isFinite(reward) && reward > 0);
const beforeFiling = ctx.world.credits;
// The delivery sweep runs on its own half-second cadence, not every frame.
const tickJobs = () => station.update(0.5);
tickJobs();
assert.equal(ctx.world.credits - beforeFiling, reward);
assert.equal(ctx.agent.jobNoted[filed.id], 'delivered');
for (let i = 0; i < 5; i++) tickJobs();
assert.equal(ctx.world.credits - beforeFiling, reward);
assert.equal(api.observe().jobs.active.some(j => j.id === filed.id), false);
assert.equal(ctx.stationDesk.peekJobReturn(filed), null);
// Lapsed: an expired collected contract closes without payment.
const lapsed = takeSpy();
lapsed.progress = 1;
lapsed.deadline = ctx.world.time - 1;
const beforeLapse = ctx.world.credits;
tickJobs();
assert.equal(ctx.world.credits, beforeLapse);
assert.equal(ctx.agent.jobNoted[lapsed.id], 'lapsed');
assert.equal(api.observe().jobs.active.some(j => j.id === lapsed.id), false);
assert.equal(ctx.stationDesk.peekJobReturn(lapsed), null);
console.log('PASS delivered, lapsed and abandoned spy records leave active jobs with no duplicate payment');
ctx.stationDesk.undock();
const fixtureRows = [];
for (const kind of ['mining', 'explore', 'espionage', 'recovery', 'trade', 'passenger', 'ferry', 'hunt', 'war']) {
  fixtureRows.push({ id: `fixture-${kind}`, kind, state: 'accepted', originSystem: 'veridian', destSystem: 'freehold', need: 1, progress: 0 });
}
// Collected rows for a second employer and for the other return-for-payment
// families: only espionage changes wording, and always to its own station.
for (const kind of ['mining', 'explore', 'espionage', 'recovery']) {
  fixtureRows.push({ id: `fixture-collected-${kind}`, kind, state: 'accepted', originSystem: 'veridian', destSystem: 'freehold', need: 1, progress: 1 });
}
fixtureRows.push({ id: 'fixture-invalid', kind: 'espionage', state: 'accepted', originSystem: '__proto__' });
ctx.world.jobs.push(...fixtureRows);
const active = api.observe().jobs.active;
const rivalName = SYSTEMS.veridian.station.name;
for (const j of fixtureRows) {
  const row = active.find(r => r.id === j.id);
  if (['mining', 'explore', 'espionage', 'recovery'].includes(j.kind) && j.originSystem === 'veridian') {
    assert.equal(row.payAt, 'veridian');
    assert.ok(row.status.includes(rivalName));
    assert.equal(row.status, j.kind === 'espionage' && j.progress >= 1
      ? `Intel acquired—return to ${rivalName} to file.`
      : `Report at ${rivalName} for payment after completing the objective.`);
    assert.equal(row.status.includes(homeName), false);
  } else assert.equal(Object.hasOwn(row, 'payAt'), false);
}
assert.notEqual(rivalName, homeName);
console.log('PASS return-origin instructions persist in flight, name each employer, and omit destination/kill/invalid cases');
for (const employer of chainEmployerKeys()) {
  for (const step of [1, 2, 3]) {
    const job = makeChainJob(employer, step);
    job.state = 'accepted';
    // The employer identity is authoritative, even with stale origin data.
    job.originSystem = 'freehold';
    ctx.world.jobs = [job];
    const row = api.observe().jobs.active[0];
    if (step === 2) assert.equal(Object.hasOwn(row, 'payAt'), false);
    else assert.equal(row.payAt, chainOriginSystem(employer));
  }
}
console.log('PASS chain reporting instructions use employer origin only for return steps');
console.log('PASS issues 203/205/209 focused regressions');
