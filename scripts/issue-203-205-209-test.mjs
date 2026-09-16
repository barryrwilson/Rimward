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
const p = SYSTEMS.freehold.station.position;
ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
ctx.ship.velocity.set(0, 0, 0);
ctx.ship.speed = 0;
ctx.input.dockPressed = true;
station.update(1 / 60);
assert.equal(ctx.flags.docked, true);
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
const spy = api.observe().jobs.offers.find(j => j.kind === 'espionage');
assert.ok(spy);
assert.equal(act('acceptJob', { id: spy.id }).ok, true);
for (const progress of [0, 1]) {
  ctx.world.jobs.find(j => j.id === spy.id).progress = progress;
  ctx.stationDesk.selectService('jobs');
  const row = api.observe().jobs.active.find(j => j.id === spy.id);
  assert.equal(row.payAt, 'freehold');
  assert.match(row.status, new RegExp(SYSTEMS.freehold.station.name));
  const deskLines = [...dom.walkDom(document.body)].map(n => n.textContent || '');
  assert.ok(deskLines.some(t => t.includes(`file at ${SYSTEMS.freehold.station.name}`)));
}
ctx.stationDesk.undock();
assert.equal(api.observe().jobs.active.find(j => j.id === spy.id).payAt, 'freehold');
const fixtureRows = [];
for (const kind of ['mining', 'explore', 'espionage', 'recovery', 'trade', 'passenger', 'ferry', 'hunt', 'war']) {
  fixtureRows.push({ id: `fixture-${kind}`, kind, state: 'accepted', originSystem: 'veridian', destSystem: 'freehold', need: 1, progress: 0 });
}
fixtureRows.push({ id: 'fixture-invalid', kind: 'espionage', state: 'accepted', originSystem: '__proto__' });
ctx.world.jobs.push(...fixtureRows);
const active = api.observe().jobs.active;
for (const j of fixtureRows) {
  const row = active.find(r => r.id === j.id);
  if (['mining', 'explore', 'espionage', 'recovery'].includes(j.kind) && j.originSystem === 'veridian') {
    assert.equal(row.payAt, 'veridian');
    assert.ok(row.status.includes(SYSTEMS.veridian.station.name));
  } else assert.equal(Object.hasOwn(row, 'payAt'), false);
}
console.log('PASS return-origin instructions persist in flight and omit destination/kill/invalid cases');
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
