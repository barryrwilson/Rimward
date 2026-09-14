/** #170/#178 real station owner, rendered DOM, and v2 receipts regression.
 * node --import ./scripts/with-css-stub.mjs scripts/issue-170-desk-test.mjs
 * Relocation is a fixture; launch and desk decisions use real owners.
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
for (const el of dom.walkDom(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
const rw = window.rimward;
function tick() { station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = []; }
function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }]; world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.dockPressed = true; tick(); tick(); ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true);
  assert.equal(ctx.world.currentSystem, id);
}
const act = (name, args = {}) => rw.act({ v: 2, name, args });
function refused(r, token) {
  assert.equal(r.ok, false, JSON.stringify(r));
  assert.ok(r.token && r.error, JSON.stringify(r));
  if (token) assert.equal(r.token, token);
}
dock('freehold');
ctx.stationDesk.selectService('jobs');
const remote = ctx.world.jobs.find(j => j.originSystem === 'freehold' && j.state === 'offered');
assert.ok(remote);
dock('veridian');
for (const [name, args] of [['acceptJob', { id: remote.id }], ['trade', { commodity: 'provisions', qty: 1, side: 'buy' }], ['repairAll', {}], ['feed', { kind: 'biomass' }]]) refused(act(name, args), 'no-service');
assert.equal(act('openService', { id: 'jobs' }).ok, true);
assert.ok(!rw.observe().jobs.offers.some(j => j.id === remote.id));
refused(act('acceptJob', { id: remote.id }), 'not-offered');
for (const id of ['haul-provisions', 'ferry-consignment', 'bounty-ace', 'patrol-lane']) {
  const j = ctx.world.jobs.find(j => j.id === id);
  if (j?.state === 'offered') assert.ok(rw.observe().jobs.offers.some(row => row.id === id), 'relay ' + id);
}
const haul = ctx.world.jobs.find(j => j.kind === 'trade' && j.state === 'offered' && j.originSystem === 'veridian');
assert.ok(haul);
const original = rw.observe().jobs.offers.find(j => j.id === haul.id).reward;
ctx.world.prices[haul.commodity] += 37;
assert.equal(rw.observe().jobs.offers.find(j => j.id === haul.id).reward, original, 'offer matches drawn card between refreshes');
ctx.stationDesk.selectService('jobs');
const quote = rw.observe().jobs.offers.find(j => j.id === haul.id).reward;
assert.notEqual(quote, original, 'price drift affects live offer');
const cards = [...dom.walkDom(document.body)].filter(el => el.className === 'job-card');
const card = cards.find(el => [...dom.walkDom(el)].some(n => n.className === 'job-title' && n.textContent.includes(haul.title)));
assert.ok(card);
assert.ok([...dom.walkDom(card)].some(n => n.className === 'job-reward' && n.textContent.includes(`pays ${quote} UU`)), 'DOM reward equals observation');
const receipt = act('acceptJob', { id: haul.id });
assert.equal(receipt.ok, true, JSON.stringify(receipt));
assert.ok(receipt.notice.includes(`pays ${quote} UU`), 'receipt agrees');
assert.equal(haul.payQuoted, quote);
ctx.world.prices[haul.commodity] += 61;
assert.equal(rw.observe().jobs.active.find(j => j.id === haul.id).reward, quote, 'accepted reward frozen');
refused(act('acceptJob', { id: haul.id }), 'not-offered');
const uniqueHaul = ctx.world.jobs.find(j => j.id === 'haul-provisions' && j.state === 'offered');
assert.ok(uniqueHaul);
ctx.world.prices.provisions += 29;
ctx.stationDesk.selectService('jobs');
const uniqueQuote = rw.observe().jobs.offers.find(j => j.id === uniqueHaul.id).reward;
assert.ok([...dom.walkDom(document.body)].some(n => n.className === 'job-reward'
  && n.textContent.startsWith('Haul 5 Provisions') && n.textContent.includes(`pays ${uniqueQuote} UU`)));
const uniqueReceipt = act('acceptJob', { id: uniqueHaul.id });
assert.equal(uniqueReceipt.ok, true);
assert.ok(uniqueReceipt.notice.includes(`pays ${uniqueQuote} UU`));
assert.equal(uniqueHaul.payQuoted, uniqueQuote, 'unique haul locks displayed destination rate');
console.log('PASS #178 live quote: desk, observation, acceptance and frozen agreement', { original, quote });
// Generated-system origins use the same board owner, including standing gates.
const generated = Object.keys(ctx.systems).find(id => !['freehold', 'veridian', 'redmarch', 'dustfall', 'cinder', 'solace'].includes(id));
if (generated) {
  dock(generated); ctx.stationDesk.selectService('jobs');
  const seen = rw.observe().jobs.offers;
  assert.deepEqual(seen.map(j => j.id), ctx.stationDesk.peekOffers().map(j => j.id));
  assert.ok(!seen.some(j => j.id === remote.id));
}
// An open pane launches directly when clearance is available; no second press.
dock('freehold');
ctx.ships.length = 0; ctx.asteroids.list.length = 0;
for (const pane of ['market', 'jobs', 'repair', 'feed', 'outfitting', 'bar', 'people', 'shipyard']) {
  if (!ctx.flags.docked) dock('freehold');
  ctx.stationDesk.selectService(pane);
  const r = act('undock');
  assert.equal(r.ok, true, pane + ': ' + JSON.stringify(r));
  assert.equal(ctx.flags.docked, false);
  assert.equal(ctx.stationDesk.peekService(), null);
}
console.log('PASS #170 closed panes, remote offers, relays, repeat refusal, and service-pane launch');
