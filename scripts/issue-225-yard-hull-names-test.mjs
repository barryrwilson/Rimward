import assert from 'node:assert/strict';
import { createShipState, YARD_HULL_NAMES } from '../src/game/state.js';
import { purchaseYardHull, yardStockFor } from '../src/game/shipyard.js';
import { sanitizeHangar, switchTo } from '../src/game/hangar.js';
import { renderShipyardDesk } from '../src/systems/shipyard-desk.js';

function fixture(faction) {
  return {
    flags: { docked: true },
    world: { currentSystem: 'yard', credits: 1000000, shipName: 'she',
      reputation: { [faction]: 100 },
      hangar: { mountedId: 'hull_starter', hulls: [
        { id: 'hull_starter', hullKind: 'living', classKey: 'light', faction: 'independent', name: 'she' },
      ] } },
    systems: { yard: { faction } },
    player: createShipState('light', { name: 'she', faction: 'independent' }),
    cargo: [], cargoCapacity: 20, ships: [], gate: {}, emit() {},
  };
}

for (const faction of Object.keys(YARD_HULL_NAMES)) {
  for (const classKey of yardStockFor(faction)) {
    const ctx = fixture(faction);
    const result = purchaseYardHull(ctx, classKey);
    assert.equal(result.ok, true, `${faction}/${classKey} purchase`);
    assert(YARD_HULL_NAMES[faction].includes(result.row.name));
    assert.notEqual(result.row.name, classKey);
    assert.equal(ctx.world.shipName, 'she', 'purchase leaves mounted starter alone');
    assert.equal(ctx.world.hangar.hulls[0].name, 'she');
    assert.equal(ctx.world.credits, 1000000 - result.price);
    assert.equal(switchTo(ctx, result.row.id).ok, true);
    assert.equal(ctx.world.shipName, result.row.name);
    assert.equal(ctx.player.name, result.row.name);
    ctx.world.hangar = JSON.parse(JSON.stringify(ctx.world.hangar));
    sanitizeHangar(ctx);
    assert.equal(ctx.world.hangar.hulls.find(r => r.id === result.row.id).name, result.row.name);
    const elements = [];
    const h = (tag, cls, parent, text) => { const el = { tag, cls, text }; elements.push(el); return el; };
    renderShipyardDesk(h, () => {}, {}, ctx, {}, () => {});
    assert(elements.some(el => el.cls === 'shipyard-hull-name' && el.text === result.row.name));
    assert(elements.some(el => el.cls === 'shipyard-hull-meta' && el.text.startsWith(`${classKey} ·`) && el.text.endsWith(' · mounted')));
    assert.equal(switchTo(ctx, 'hull_starter').ok, true);
    assert.equal(ctx.world.shipName, 'she');
  }
}

const random = Math.random;
try {
  Math.random = () => 0;
  const ctx = fixture('freehold');
  const first = purchaseYardHull(ctx, 'freighter');
  const second = purchaseYardHull(ctx, 'freighter');
  assert.equal(second.row.name, `${first.row.name} 2`, 'same name roll stays distinct within hangar');
  const before = JSON.stringify(ctx.world);
  ctx.flags.docked = false;
  assert.equal(purchaseYardHull(ctx, 'freighter').ok, false);
  assert.equal(JSON.stringify(ctx.world), before, 'refusal leaves names and credits alone');
} finally { Math.random = random; }
console.log('PASS issue #225: 60 faction/class purchases, name/class rendering, mounting, starter preservation, JSON persistence, duplicate rolls and refusal');
