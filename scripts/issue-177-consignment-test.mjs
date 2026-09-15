/** Issue #177: fronted consignment cargo stays distinct from the player's own
 * stock. Real station DOM closures, the real desk and the real observation,
 * with disclosed deterministic cash/cargo/price fixtures. Not campaign
 * progression.
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-177-consignment-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS } from '../src/game/state.js';
import { buildObservation } from '../src/game/agent-observe.js';
import { cargoSplit, consignedHoldUnits } from '../src/game/consignment.js';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];
const find = id => [...dom.walkDom(document.body)].find(n => n.id === id);
const screenText = () => [...dom.walkDom(document.body)]
  .map(n => (typeof n.textContent === 'string' ? n.textContent : '')).join('\n');
for (const n of dom.walkDom(document.body)) if (n.dataset?.titleAction === 'new') { n.click(); break; }
dom.dispatchKey('Digit1');
ctx.agent.optIn = true;
ctx.flags.combat = false;

const check = (label, fn) => { fn(); console.log('PASS', label); };
const held = key => ctx.cargo.filter(c => c.commodity === key).reduce((n, c) => n + c.units, 0);
const observe = () => buildObservation(ctx);
const cargoRow = key => observe().world.cargo.find(r => r.commodity === key);
const marketRow = key => observe().market?.rows.find(r => r.commodity === key);
const trade = (commodity, qty, side) => ctx.stationDesk.trade({ commodity, qty, side });
const action = prefix => ctx.stationDesk.peekView().actions.find(a => a.label.startsWith(prefix));
const perform = prefix => {
  const a = action(prefix);
  assert.ok(a, `button ${prefix}`);
  return ctx.stationDesk.perform({ n: a.n, expect: a.label });
};

function step(count = 1) {
  for (let i = 0; i < count; i++) {
    ctx.world.time += 1 / 60;
    ctx.elapsed += 1 / 60;
    station.update(1 / 60);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
function dock(id) {
  if (ctx.flags.docked) assert.equal(ctx.stationDesk.undock().ok, true);
  ctx.world.currentSystem = id;
  const p = SYSTEMS[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  step(3);
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, 'docked at ' + id);
}
function fixture() {
  ctx.world.time = 100;
  ctx.world.credits = 20000;
  ctx.cargo.length = 0;
  ctx.world.marketSupply = {};
  ctx.world.prices.provisions = 100;
  ctx.world.fear = 0;
}
const ferryJob = () => ctx.world.jobs.find(j => j.id === 'ferry-consignment');

// ---------------------------------------------------------------------------
// A. Mixed hold: 4 fronted + 3 bought.
// ---------------------------------------------------------------------------
dock('freehold');
fixture();
ctx.stationDesk.selectService('jobs');
assert.equal(ctx.stationDesk.acceptJob('ferry-consignment').ok, true, 'ferry accepted');
const dest = ferryJob().destSystem;
assert.ok(dest && dest !== 'freehold', 'ferry has a far station');
ctx.stationDesk.selectService('market');
assert.equal(trade('provisions', 3, 'buy').ok, true, 'bought 3 provisions');

check('A1 mixed hold derives 3 owned and 4 consigned with no new persisted field', () => {
  assert.equal(held('provisions'), 7);
  assert.deepEqual(cargoSplit(ctx, 'provisions'), { held: 7, consigned: 4, owned: 3 });
  assert.equal(consignedHoldUnits(ctx), 4);
  for (const row of ctx.cargo) {
    assert.deepEqual(Object.keys(row).sort(), ['commodity', 'units'], 'cargo rows gain no field');
  }
});

check('A2 observe() cargo and market rows carry the split', () => {
  assert.deepEqual(cargoRow('provisions'), { commodity: 'provisions', units: 7, owned: 3, consigned: 4 });
  const row = marketRow('provisions');
  assert.equal(row.hold, 7);
  assert.equal(row.holdOwned, 3);
  assert.equal(row.holdConsigned, 4);
  assert.equal(row.sellMax, 3, 'the desk offers only the player\'s own units');
});

check('A3 the market pane and the hold total name the consignment', () => {
  const text = screenText();
  assert.ok(text.includes('3 yours · 4 consigned'), 'market HOLD cell shows the split');
  assert.ok(text.includes('4 consigned'), 'hold total names the fronted units');
});

check('A4 Sell All offers only the 3 owned units', () => {
  find('market-bulk-commodity') || ctx.stationDesk.selectService('market');
  const select = find('market-bulk-commodity');
  assert.ok(select, 'bulk pane present');
  select.value = 'provisions';
  for (const fn of select._listeners.change) fn({ target: select });
  find('market-bulk-sell-all').click();
  assert.equal(find('market-bulk-quantity').value, '3', 'Sell All preset quantity');
  assert.ok(screenText().includes('Held 7 (3 yours · 4 consigned)'), 'bulk preview shows the split');
});

check('A5 a direct sell of more than the owned units is refused, hold untouched', () => {
  const before = held('provisions');
  const credits = ctx.world.credits;
  const result = trade('provisions', 4, 'sell');
  assert.equal(result.ok, false);
  assert.match(result.notice, /consigned to the factor/);
  assert.equal(held('provisions'), before, 'no units moved');
  assert.equal(ctx.world.credits, credits, 'no UU paid');
});

check('A6 selling exactly the owned units succeeds and leaves the consignment whole', () => {
  assert.equal(trade('provisions', 3, 'sell').ok, true);
  assert.equal(held('provisions'), 4);
  assert.deepEqual(cargoSplit(ctx, 'provisions'), { held: 4, consigned: 4, owned: 0 });
});

// ---------------------------------------------------------------------------
// B. Consigned-only hold.
// ---------------------------------------------------------------------------
check('B1 a consigned-only hold sells nothing through the desk, presets or buttons', () => {
  assert.equal(marketRow('provisions').sellMax, 0);
  const one = trade('provisions', 1, 'sell');
  assert.equal(one.ok, false);
  assert.match(one.notice, /^Cannot sell:/);
  find('market-bulk-sell-all').click();
  assert.equal(find('market-bulk-quantity').value, '0', 'Sell All offers nothing');
  assert.equal(find('market-bulk-sell').disabled, true, 'bulk Sell is refused');
  assert.equal(held('provisions'), 4);
});

check('B2 the market row sell buttons refuse the fronted units', () => {
  ctx.stationDesk.selectService('market');
  const credits = ctx.world.credits;
  const minus = perform('−1');
  assert.equal(minus.ok, false, '−1 refused');
  assert.equal(minus.token, 'unavailable');
  assert.equal(held('provisions'), 4);
  assert.equal(ctx.world.credits, credits);
});

check('B3 a hold short of the consignment reports no owned units', () => {
  const row = ctx.cargo.find(c => c.commodity === 'provisions');
  row.units = 2; // fixture: units lost away from the market
  assert.deepEqual(cargoSplit(ctx, 'provisions'), { held: 2, consigned: 2, owned: 0 });
  assert.equal(trade('provisions', 1, 'sell').ok, false, 'a short consignment is still not stock');
  row.units = 4;
});

// ---------------------------------------------------------------------------
// C. Unrelated goods are untouched.
// ---------------------------------------------------------------------------
check('C1 another commodity keeps its full sell ceiling while a consignment runs', () => {
  assert.equal(trade('rawOre', 2, 'buy').ok, true);
  assert.deepEqual(cargoSplit(ctx, 'rawOre'), { held: 2, consigned: 0, owned: 2 });
  assert.deepEqual(cargoRow('rawOre'), { commodity: 'rawOre', units: 2, owned: 2, consigned: 0 });
  const row = marketRow('rawOre');
  assert.equal(row.holdConsigned, 0);
  assert.equal(row.sellMax, 2);
  assert.equal(trade('rawOre', 2, 'sell').ok, true, 'ordinary stock still sells');
  assert.equal(held('rawOre'), 0);
  assert.equal(held('provisions'), 4, 'the consignment is untouched');
});

// ---------------------------------------------------------------------------
// D. Reload, delivery and re-acceptance transitions.
// ---------------------------------------------------------------------------
check('D1 the split survives a JSON round trip of the saved state', () => {
  const restored = { cargo: JSON.parse(JSON.stringify(ctx.cargo)), world: JSON.parse(JSON.stringify(ctx.world)) };
  assert.deepEqual(cargoSplit(restored, 'provisions'), cargoSplit(ctx, 'provisions'));
  assert.ok(!JSON.stringify(restored.cargo).includes('consigned'), 'nothing new is persisted in cargo');
});

check('D2 landing the consignment clears the split and frees later stock', () => {
  dock(dest);
  step(180);
  assert.equal(ferryJob().state, 'done', 'consignment delivered');
  assert.equal(held('provisions'), 0);
  ctx.stationDesk.selectService('market');
  assert.equal(trade('provisions', 5, 'buy').ok, true);
  assert.deepEqual(cargoSplit(ctx, 'provisions'), { held: 5, consigned: 0, owned: 5 });
  assert.equal(marketRow('provisions').sellMax, 5);
  assert.equal(trade('provisions', 5, 'sell').ok, true, 'owned stock sells after delivery');
  assert.ok(!screenText().includes('consigned'), 'no consignment wording once the deal is closed');
});

check('D3 a fresh consignment protects its units again', () => {
  ctx.stationDesk.selectService('jobs');
  assert.equal(ctx.stationDesk.acceptJob('ferry-consignment').ok, true, 'reoffered ferry accepted');
  ctx.stationDesk.selectService('market');
  assert.equal(trade('provisions', 2, 'buy').ok, true);
  assert.deepEqual(cargoSplit(ctx, 'provisions'), { held: 6, consigned: 4, owned: 2 });
  assert.equal(trade('provisions', 3, 'sell').ok, false, 'owned ceiling holds');
  assert.equal(trade('provisions', 2, 'sell').ok, true);
  assert.equal(held('provisions'), 4);
});

check('D4 a short landing leaves the contract open and its units protected', () => {
  const short = ctx.cargo.find(c => c.commodity === 'provisions');
  short.units = 3; // fixture: one unit lost in transit
  dock(ferryJob().destSystem);
  step(180);
  assert.equal(ferryJob().state, 'accepted', 'the contract stays open when the manifest is short');
  ctx.stationDesk.selectService('market');
  assert.deepEqual(cargoSplit(ctx, 'provisions'), { held: 3, consigned: 3, owned: 0 });
  assert.equal(trade('provisions', 1, 'sell').ok, false, 'still not the player\'s to sell');
  assert.equal(trade('provisions', 1, 'buy').ok, true, 'topping the consignment up is allowed');
  assert.deepEqual(cargoSplit(ctx, 'provisions'), { held: 4, consigned: 4, owned: 0 });
});

console.log('OK issue-177 consignment');
