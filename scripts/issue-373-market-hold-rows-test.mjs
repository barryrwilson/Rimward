/**
 * Issue #373 — Market pane surfaces held market commodities in a YOUR HOLD
 * summary banner, tags every market row cell with data-commodity / held classes,
 * and emits structured commodity + hold metadata in Agent API station.view.rows.
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS, COMMODITIES } from '../src/game/state.js';
import { addCargo } from '../src/systems/station.js';
import { tickPrices, applyEventPressure } from '../src/game/market.js';
import { initAgentApi } from '../src/systems/agent-api.js';

seedBootRandom(373);
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];

for (const n of dom.walkDom(document.body)) {
  if (n.dataset?.titleAction === 'new') {
    n.click();
    break;
  }
}
dom.dispatchKey('Digit1');
ctx.agent.optIn = true;
initAgentApi(ctx);
const api = window.rimward;
const observe = () => api.observe();
const act = (name, args = {}) => api.act({ v: 2, name, args });

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));

let checks = 0;
const check = (label, fn) => {
  fn();
  checks++;
  console.log('PASS', label);
};

function dockAt(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.combat = false;
  const from = ctx.world.currentSystem;
  ctx.world.currentSystem = id;
  applyEventPressure(ctx, 'clear', id);
  if (from !== id) {
    ctx.lastEvents = [{ type: 'systemLoaded', from, to: id }];
    tickPrices(ctx, 0);
    station.update(1 / 60);
    ctx.lastEvents = [];
  }
  const p = SYSTEMS[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  for (let i = 0; i < 3; i++) {
    station.update(1 / 60);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, `docked at ${id}`);
}

function resetHold({ credits = 5000, fear = 0, freeholdRep = 0, veridianRep = 0 } = {}) {
  ctx.world.credits = credits;
  ctx.world.fear = fear;
  ctx.world.reputation.freehold = freeholdRep;
  ctx.world.reputation.veridian = veridianRep;
  ctx.world.jobs = [];
  ctx.world.marketSupply = {};
  ctx.cargoCapacity = 40;
  ctx.cargo.length = 0;
  applyEventPressure(ctx, 'clear', ctx.world.currentSystem);
}

// Exact filter from the #333 salvager playtest driver
const salvagerDriverFilter = (rows) =>
  rows.filter(
    (x) =>
      x &&
      typeof x.commodity === 'string' &&
      (x.commodity === 'refinedMetals' ||
        /metal|ore|rock|ice|silicate|carbon|biomass/i.test(x.commodity) ||
        x.hold > 0)
  );

// ---- 1. Veridian Spire with 20 rawOre in the hold ---------------------------
check('Veridian Spire market shows YOUR HOLD banner, tagged DOM cells, and station.view.rows metadata for 20 rawOre', () => {
  dockAt('veridian');
  resetHold();
  addCargo(ctx, 'rawOre', 20);
  ctx.stationDesk.selectService('market');

  const banners = byClass('market-hold-summary');
  assert.equal(banners.length, 1, 'renders one .market-hold-summary banner');
  assert.equal(
    banners[0].textContent,
    'YOUR HOLD: Raw ore ×20 — 106 UU/unit (2120 UU)',
    'exact YOUR HOLD banner text at Veridian Spire'
  );

  const rawOreCells = nodes().filter((n) => n.dataset?.commodity === 'rawOre');
  assert.ok(rawOreCells.length >= 6, 'all Raw ore row cells carry data-commodity="rawOre"');
  const topCells = rawOreCells.filter((n) => String(n.className).split(' ').includes('market-cell'));
  assert.equal(topCells.length, 6, '6 market-cell elements in the Raw ore row');
  for (const cell of topCells) {
    assert.ok(
      String(cell.className).split(' ').includes('market-row-held'),
      'each Raw ore market-cell carries market-row-held'
    );
  }

  const holdCells = byClass('market-hold-active');
  assert.equal(holdCells.length, 1, 'only the held commodity HOLD cell has market-hold-active');
  assert.equal(holdCells[0].dataset?.commodity, 'rawOre');
  assert.equal(holdCells[0].textContent, '20');

  const obs = observe();
  assert.equal(obs.station?.view?.service, 'market');
  const rows = obs.station.view.rows;
  const exactRawOreRows = rows.filter((r) => r.commodity === 'rawOre' && r.hold === 20);
  assert.ok(exactRawOreRows.length >= 2, 'station.view.rows carries commodity: rawOre, hold: 20');
  for (const r of exactRawOreRows) {
    assert.equal(r.units, 20);
    assert.equal(r.holdOwned, 20);
  }

  const driverMatches = salvagerDriverFilter(rows);
  assert.ok(
    driverMatches.some((r) => r.commodity === 'rawOre' && r.hold === 20),
    '#333 salvager playtest driver filter finds the rawOre buyer row at Veridian Spire'
  );
});

// ---- 2. Selling 20 rawOre at Veridian Spire clears banner & credits +2120 UU -
check('Selling 20 rawOre via act("trade") credits +2120 UU, clears YOUR HOLD banner, and resets hold to 0', () => {
  const beforeCredits = ctx.world.credits;
  const res = act('trade', { commodity: 'rawOre', qty: 20, side: 'sell' });
  assert.equal(res.ok, true, 'trade sell 20 rawOre succeeds');
  assert.equal(ctx.world.credits - beforeCredits, 2120, '+2120 UU credited at Veridian Spire');

  ctx.stationDesk.selectService('market');
  assert.equal(byClass('market-hold-summary').length, 0, 'YOUR HOLD banner cleared when hold is empty');
  assert.equal(byClass('market-hold-active').length, 0, 'no market-hold-active cells remain');
  assert.equal(byClass('market-row-held').length, 0, 'no market-row-held cells remain');

  const rows = observe().station.view.rows;
  assert.equal(rows.filter((r) => r.commodity === 'rawOre' && r.hold > 0).length, 0);
  const zeroHoldRawOre = rows.filter((r) => r.commodity === 'rawOre' && r.hold === 0);
  assert.ok(zeroHoldRawOre.length >= 2, 'rawOre row hold resets to 0');
  for (const r of zeroHoldRawOre) {
    assert.equal(r.units, 0);
    assert.equal(r.holdOwned, 0);
  }
});

// ---- 3. Freehold Landing with 20 rawOre in the hold -------------------------
check('Freehold Landing market also surfaces 20 rawOre in YOUR HOLD and matches the #333 driver filter', () => {
  dockAt('freehold');
  resetHold();
  addCargo(ctx, 'rawOre', 20);
  ctx.stationDesk.selectService('market');

  const banners = byClass('market-hold-summary');
  assert.equal(banners.length, 1);
  assert.match(banners[0].textContent, /^YOUR HOLD: Raw ore ×20 — \d+ UU\/unit \(\d+ UU\)$/);

  const rows = observe().station.view.rows;
  const exactRawOreRows = rows.filter((r) => r.commodity === 'rawOre' && r.hold === 20);
  assert.ok(exactRawOreRows.length >= 2, 'Freehold station.view.rows includes rawOre with hold === 20');
  assert.ok(
    salvagerDriverFilter(rows).some((r) => r.commodity === 'rawOre' && r.hold === 20),
    '#333 salvager playtest driver filter finds rawOre buyer row at Freehold Landing'
  );
});

// ---- 4. Consigned cargo (provisions with accepted ferry consignment) --------
check('Consigned provisions render accurate YOUR HOLD split and row hold vs holdOwned metadata', () => {
  dockAt('freehold');
  resetHold();
  ctx.world.jobs.push({
    id: 'ferry-test-373',
    kind: 'ferry',
    state: 'accepted',
    need: 4,
  });
  addCargo(ctx, 'provisions', 4);
  ctx.stationDesk.selectService('market');

  let banners = byClass('market-hold-summary');
  assert.equal(banners.length, 1);
  assert.equal(
    banners[0].textContent,
    'YOUR HOLD: Provisions ×4 (0 yours · 4 consigned) — consigned',
    'purely consigned cargo states consigned and split'
  );

  let rows = observe().station.view.rows;
  let provRows = rows.filter((r) => r.commodity === 'provisions' && Number.isInteger(r.hold));
  assert.ok(provRows.length >= 2);
  for (const r of provRows) {
    assert.equal(r.hold, 4);
    assert.equal(r.units, 4);
    assert.equal(r.holdOwned, 0);
  }

  // Add 3 player-owned provisions on top of the 4 consigned (total 7)
  addCargo(ctx, 'provisions', 3);
  ctx.stationDesk.selectService('market');
  banners = byClass('market-hold-summary');
  assert.equal(banners.length, 1);
  assert.match(
    banners[0].textContent,
    /^YOUR HOLD: Provisions ×7 \(3 yours · 4 consigned\) — \d+ UU\/unit \(\d+ UU\)$/
  );

  rows = observe().station.view.rows;
  provRows = rows.filter((r) => r.commodity === 'provisions' && Number.isInteger(r.hold));
  assert.ok(provRows.length >= 2);
  for (const r of provRows) {
    assert.equal(r.hold, 7);
    assert.equal(r.units, 7);
    assert.equal(r.holdOwned, 3);
  }
});

// ---- 5. Restricted cargo (restrictedComponents with locker closed vs open) --
check('Restricted cargo shows "restricted locker closed" when gated and live sell quote when open', () => {
  dockAt('freehold');
  resetHold({ fear: 10, freeholdRep: 0 });
  addCargo(ctx, 'restrictedComponents', 4);
  ctx.stationDesk.selectService('market');

  let banners = byClass('market-hold-summary');
  assert.equal(banners.length, 1);
  assert.equal(
    banners[0].textContent,
    'YOUR HOLD: Restricted components ×4 — restricted locker closed'
  );

  let rows = observe().station.view.rows;
  let rcRows = rows.filter((r) => r.commodity === 'restrictedComponents' && Number.isInteger(r.hold));
  assert.ok(rcRows.length >= 2);
  for (const r of rcRows) {
    assert.equal(r.hold, 4);
    assert.equal(r.units, 4);
    assert.equal(r.holdOwned, 4);
  }

  // Open the locker via fear >= 40
  ctx.world.fear = 45;
  ctx.stationDesk.selectService('market');
  banners = byClass('market-hold-summary');
  assert.equal(banners.length, 1);
  assert.match(
    banners[0].textContent,
    /^YOUR HOLD: Restricted components ×4 — \d+ UU\/unit \(\d+ UU\)$/
  );
});

// ---- 6. Non-market cargo does not pollute YOUR HOLD or market rows ----------
check('Non-market cargo (survivor, dataCube, dataCrystal) never pollutes YOUR HOLD or market rows', () => {
  dockAt('veridian');
  resetHold();
  ctx.cargo.push(
    { commodity: 'survivor', units: 2, faction: 'veridian', source: 'other' },
    { commodity: 'dataCube', units: 1, source: 'legal', originFaction: 'assembly' },
    { commodity: 'dataCrystal', units: 1, source: 'legal', originFaction: 'unknowables' }
  );
  ctx.stationDesk.selectService('market');

  assert.equal(byClass('market-hold-summary').length, 0, 'no YOUR HOLD banner for non-market cargo');
  assert.equal(byClass('market-hold-active').length, 0, 'no active hold cell for non-market cargo');
  assert.equal(byClass('market-row-held').length, 0, 'no held row for non-market cargo');

  const rows = observe().station.view.rows;
  for (const r of rows) {
    if (r.commodity !== undefined) {
      assert.ok(Object.hasOwn(COMMODITIES, r.commodity), `row commodity ${r.commodity} is a valid market commodity`);
      assert.notEqual(r.commodity, 'survivor');
      assert.notEqual(r.commodity, 'dataCube');
      assert.notEqual(r.commodity, 'dataCrystal');
    }
    if (r.hold !== undefined) {
      assert.equal(r.hold, 0, 'every market commodity row reports 0 held units');
    }
  }
});

console.log(`ISSUE-373 MARKET HOLD ROWS PASS (${checks} scenarios)`);
