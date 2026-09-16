/**
 * Issue #179 — market-pane honesty regressions.
 *
 * Four playtest findings, checked against the real station DOM closures with
 * disclosed cash/cargo/price/stock fixtures. This is not campaign progression.
 *
 *  1. The legacy haul posting is retired (#206) — no card, no buy-in line.
 *  2. Every finite market row states capacity, and the pane states the refill.
 *  3. A bulk refusal does not outlive its cause; an ok offer stays immutable.
 *  4. An event-driven quote is labelled transient on the row it moved.
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS, COMMODITIES, MARKET_SUPPLY } from '../src/game/state.js';
import { supplyCapacity } from '../src/game/market-supply.js';
import { applyEventPressure, marketEventAt } from '../src/game/market.js';

seedBootRandom(179);
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];
const nodes = () => [...dom.walkDom(document.body)];
const find = id => nodes().find(n => n.id === id);
const byClass = cls => nodes().filter(n => String(n.className).split(' ').includes(cls));
const texts = () => nodes().map(n => n.textContent).filter(t => typeof t === 'string' && t);
const lineWith = re => texts().find(t => re.test(t));
let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

for (const n of nodes()) if (n.dataset?.titleAction === 'new') { n.click(); break; }
dom.dispatchKey('Digit1');
ctx.agent.optIn = true;
ctx.flags.combat = false;

function dock(id = 'freehold') {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.world.currentSystem = id;
  const p = SYSTEMS[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  for (let i = 0; i < 3; i++) { station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = []; }
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true);
}
const edit = text => {
  const input = find('market-bulk-quantity');
  input.value = text;
  for (const fn of input._listeners.input) fn({ target: input });
};
const select = key => {
  const input = find('market-bulk-commodity');
  input.value = key;
  for (const fn of input._listeners.change) fn({ target: input });
};
function fixture() {
  ctx.world.time = 100;
  ctx.world.credits = 20000;
  ctx.cargoCapacity = 20;
  ctx.cargo.length = 0;
  ctx.world.marketSupply = {};
  ctx.world.prices.provisions = 100;
  applyEventPressure(ctx, 'clear', ctx.world.currentSystem);
}

dock();
fixture();

// ---- 1. the retired haul buy-in (issue 206) --------------------------------
// #179's first finding was the buy-in line drawn on the OFFERED
// `haul-provisions` card. Issue 206 retired that posting: every board already
// generated a Provisions trade row for the same five-unit run, the same gate
// and the same money, so the consignment was a duplicate. The card is gone, and
// the offered-haul buy-in line went with it. What is pinned here is the
// removal, on a fresh board and on an older save's stale record alike. Carrying
// buy-in guidance over to the generated trade rows is separate product work and
// is tracked as such — it is deliberately NOT asserted here.
const BUY_IN = /^Buy-in/;
check('the retired haul posting draws neither its card nor its buy-in line', () => {
  fixture();
  ctx.stationDesk.selectService('jobs');
  assert.equal(ctx.world.jobs.some(j => j.kind === 'haul'), false, 'no haul posting is seeded');
  assert.equal(lineWith(/^Haul 5 Provisions to /), undefined, 'the legacy card is not drawn');
  assert.equal(lineWith(BUY_IN), undefined, 'and no buy-in line is left behind');
});
check("an older save's stale offered haul record draws nothing either", () => {
  fixture();
  ctx.world.credits = 350;
  const stale = {
    id: 'haul-provisions', kind: 'haul', title: 'Haul provisions',
    detail: "Provisions are worth more a gate away. Accept here, buy 5 Provisions, and dock at the other system's station — paid at 140% of your buy cost on delivery.",
    reward: 0, need: 5, progress: 0, state: 'offered',
    originSystem: null, originPrice: 0,
  };
  ctx.world.jobs.push(stale);
  ctx.stationDesk.selectService('jobs');
  assert.equal(lineWith(/^Haul 5 Provisions to /), undefined, 'a saved stale posting is not posted');
  assert.equal(lineWith(BUY_IN), undefined, 'and states no buy-in');
  assert.equal(stale.state, 'offered', 'and the saved record itself is untouched');
  ctx.world.jobs.splice(ctx.world.jobs.indexOf(stale), 1);
});

// ---- 2. every finite stock row states its capacity and refill ---------------
check('every market row states available/capacity, including the 20-unit rows', () => {
  fixture();
  ctx.stationDesk.selectService('market');
  const cells = byClass('market-stock').map(n => n.textContent);
  assert.equal(cells.length, Object.keys(COMMODITIES).length, 'one stock cell per commodity');
  const caps = new Set(cells.map(t => Number(t.split('/')[1])));
  assert.ok(caps.has(MARKET_SUPPLY.otherCapacity), 'the 20-capacity rows show their cap');
  assert.ok(caps.has(MARKET_SUPPLY.bulkCapacity), 'the 160-capacity rows show their cap');
  for (const [i, key] of Object.keys(COMMODITIES).entries()) {
    assert.equal(cells[i].split('/')[1], String(supplyCapacity(key)), `${key} cap`);
  }
  assert.ok(lineWith(/^Stock replenishes in simulation time; empty to full in 20 minutes\./),
    'the pane states the refill time');
});

// ---- 3. a bulk refusal does not outlive its cause ---------------------------
const previewLine = verb => texts().find(t => t.startsWith(`${verb}:`));
check('a hold-full buy refusal clears once the hold empties', () => {
  fixture();
  ctx.stationDesk.selectService('market');
  select('provisions');
  edit('20');
  find('market-bulk-buy').click();
  assert.equal(ctx.cargo.reduce((n, c) => n + c.units, 0), 20, 'the hold is full');
  edit('5');
  assert.match(previewLine('Buy'), /Only 0 hold units free\./);
  assert.equal(find('market-bulk-buy').disabled, true);
  // Sell the hold back through the market ROWS, which never rebuild the intent.
  for (let i = 0; i < 6; i++) {
    const sell = nodes().find(n => n.textContent === '−5' && !n.disabled);
    if (!sell) break;
    sell.click();
  }
  assert.equal(ctx.cargo.reduce((n, c) => n + c.units, 0), 0, 'the hold is empty');
  const line = previewLine('Buy');
  assert.doesNotMatch(line, /hold units free/, 'the answered refusal is gone');
  assert.match(line, /open again at 500 UU — re-enter the quantity to confirm\./);
  assert.match(find('market-bulk-buy').textContent, /re-enter quantity$/);
  assert.equal(find('market-bulk-buy').disabled, true, 'the frozen token is still the gate');
});
check('a re-entered quantity restores an ordinary confirmation', () => {
  edit('5');
  assert.match(previewLine('Buy'), /^Buy: 100 UU\/unit · 500 UU at displayed quote/);
  assert.equal(find('market-bulk-buy').disabled, false);
  assert.match(find('market-bulk-buy').textContent, /^Buy 5 Provisions · 500 UU$/);
});
check('an ok offer stays immutable while the market moves (issue #56 B6/B9)', () => {
  fixture();
  ctx.stationDesk.selectService('market');
  select('provisions');
  edit('5');
  const label = find('market-bulk-buy').textContent;
  const line = previewLine('Buy');
  ctx.world.prices.provisions = 140;
  ctx.world.credits += 1;
  ctx.stationDesk.selectService('market');
  assert.equal(find('market-bulk-buy').textContent, label, 'the displayed offer does not drift');
  assert.equal(previewLine('Buy'), line);
});

// ---- 4. an event-driven quote is labelled transient -------------------------
check('no live pressure means no label and no note', () => {
  fixture();
  assert.equal(marketEventAt(ctx.world.currentSystem), null);
  ctx.stationDesk.selectService('market');
  assert.equal(byClass('market-event').length, 0);
  assert.equal(lineWith(/is moving the marked rows/), undefined);
});
check('a blockade names itself on every row it pushes, and says the price is temporary', () => {
  fixture();
  applyEventPressure(ctx, 'pirateBlockade');
  const live = marketEventAt(ctx.world.currentSystem);
  assert.equal(live.kind, 'pirateBlockade');
  assert.equal(live.label, 'blockade');
  assert.deepEqual(live.keys, { provisions: 1, refinedMetals: 1, restrictedComponents: 1 });
  assert.throws(() => { live.keys.provisions = -1; }, TypeError, 'the read-only view is frozen');
  ctx.stationDesk.selectService('market');
  const labels = byClass('market-event').map(n => n.textContent);
  assert.deepEqual(labels, ['blockade up — temporary', 'blockade up — temporary', 'blockade up — temporary']);
  assert.match(lineWith(/is moving the marked rows/) ?? '',
    /^A blockade is moving the marked rows\. That price is temporary/);
});
check('a glut labels its crashed row downward', () => {
  fixture();
  applyEventPressure(ctx, 'commodityGlut');
  const live = marketEventAt(ctx.world.currentSystem);
  assert.equal(live.label, 'glut');
  const keys = Object.keys(live.keys);
  assert.equal(keys.length, 1);
  assert.equal(live.keys[keys[0]], -1);
  ctx.stationDesk.selectService('market');
  assert.deepEqual(byClass('market-event').map(n => n.textContent), ['glut down — temporary']);
});
check('the label lives and dies with the pressure it names, per system', () => {
  fixture();
  applyEventPressure(ctx, 'laborStrike');
  assert.equal(marketEventAt(ctx.world.currentSystem).label, 'labor strike');
  assert.equal(marketEventAt('veridian'), null, 'another system is not labelled');
  assert.equal(marketEventAt('__proto__'), null, 'no prototype path is a system');
  applyEventPressure(ctx, 'clear', ctx.world.currentSystem);
  assert.equal(marketEventAt(ctx.world.currentSystem), null);
  ctx.stationDesk.selectService('market');
  assert.equal(byClass('market-event').length, 0, 'the row drops the label when the event ends');
  assert.equal(lineWith(/is moving the marked rows/), undefined);
});
check('an event kind that writes no pressure never labels a row', () => {
  fixture();
  applyEventPressure(ctx, 'notAnEvent');
  assert.equal(marketEventAt(ctx.world.currentSystem), null);
  ctx.stationDesk.selectService('market');
  assert.equal(byClass('market-event').length, 0);
});

applyEventPressure(ctx, 'clear', ctx.world.currentSystem);
console.log(`ISSUE-179 MARKET PANE PASS (${checks} scenarios)`);
