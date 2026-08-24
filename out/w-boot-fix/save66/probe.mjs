import { createShipState } from '../../../src/game/state.js';
import {
  restore,
  sanitizeCargoList,
  WORLD_FIELDS,
  NAME_MAX,
} from '../../../src/game/save.js';

function w66ctx() {
  return {
    flags: {},
    world: { currentSystem: 'freehold', credits: 350, fear: 0 },
    systems: { freehold: {} },
    cargo: [],
    cargoCapacity: 80,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: createShipState('light', { name: 'Wave66' }),
    ship: { object: null },
    emit() {},
    ships: [],
  };
}

const extraRow = {
  commodity: 'survivor', units: 11, faction: 'gilded', source: 'other',
  price: 99, loadout: { x: 1 },
};
Object.defineProperty(extraRow, '__proto__', { value: { polluted: true }, enumerable: true });

const dirty = w66ctx();
restore(dirty, {
  v: 1,
  world: { currentSystem: 'freehold', peopleTrafficked: 7 },
  cargoCapacity: 80,
  cargo: [
    extraRow,
    { commodity: 'survivor', units: 12, faction: 'freehold', source: 'hack' },
    { commodity: 'survivor', units: 13, faction: 'freehold', source: 'playerKill' },
    { commodity: 'survivor', units: 14, faction: 'veridian', source: 'other', name: '\u0007' + 'A'.repeat(45) },
    { commodity: 'survivor', units: 15, faction: '__proto__', source: 'other' },
    { commodity: 'survivor', units: 16, faction: 'constructor', source: 'other' },
    { commodity: 'survivor', units: 17, faction: 'prototype', source: 'other' },
    { commodity: 'survivor', units: 2, faction: 'gilded', source: 'other' },
    { commodity: 'rawOre', units: 5, faction: 'gilded', source: 'playerKill', name: 'nope', price: 1 },
  ],
});
const byU = (n) => dirty.cargo.find((r) => r.units === n);
const extra = byU(11);
const extraKeys = extra ? Object.keys(extra).sort().join(',') : '';
const longName = byU(14);
const valid = byU(2);
const ore = dirty.cargo.find((r) => r.commodity === 'rawOre');
const reservedLanded = dirty.cargo.some((r) =>
  r.faction === '__proto__' || r.faction === 'constructor' || r.faction === 'prototype');

const listed = sanitizeCargoList([
  { commodity: 'survivor', units: 2, faction: 'gilded', source: 'other' },
]);

const w66 = {
  extraKeysDrop: extraKeys === 'commodity,faction,source,units'
    && extra?.price === undefined && extra?.loadout === undefined,
  enumerableProtoDrop: extra && !Object.prototype.hasOwnProperty.call(extra, '__proto__')
    && extra.polluted !== true && Object.prototype.polluted !== true,
  sourceHack: byU(12)?.source === 'other',
  sourceKill: byU(13)?.source === 'playerKill',
  nameCap: longName?.name === 'A'.repeat(NAME_MAX) && NAME_MAX === 40,
  nameControls: longName?.name && !/[\u0000-\u001f]/.test(longName.name),
  reservedFaction: !reservedLanded && !byU(15) && !byU(16) && !byU(17),
  validRoundTrip: valid?.commodity === 'survivor' && valid?.units === 2
    && valid?.faction === 'gilded' && valid?.source === 'other'
    && !('name' in valid) && !('price' in valid)
    && listed.length === 1 && listed[0].faction === 'gilded' && listed[0].source === 'other',
  noWorldPeopleField: !WORLD_FIELDS.includes('peopleTrafficked'),
  peopleTraffickedNotRestored: dirty.world.peopleTrafficked === undefined,
  oreNoLeak: ore?.commodity === 'rawOre' && ore?.units === 5
    && Object.keys(ore).sort().join(',') === 'commodity,units'
    && !('faction' in ore) && !('source' in ore) && !('name' in ore),
};

const hangarCtx = w66ctx();
restore(hangarCtx, {
  v: 1,
  world: {
    currentSystem: 'freehold',
    hangar: {
      mountedId: 'hull_b',
      hulls: [{
        id: 'hull_b', hullKind: 'living', classKey: 'freighter', faction: 'independent',
        cargo: [{ commodity: 'gildvein', units: 5 }], cargoCapacity: 40,
      }],
    },
  },
  cargo: [{ commodity: 'rawOre', units: 2 }],
});
w66.hangarCargoWins = hangarCtx.cargo.length === 1
  && hangarCtx.cargo[0].commodity === 'gildvein'
  && hangarCtx.cargo[0].units === 5
  && !hangarCtx.cargo.some((r) => r.commodity === 'rawOre');

console.log('wave66 save pins:', JSON.stringify(w66));
console.log('cargo dump:', JSON.stringify(dirty.cargo));
const failed = Object.entries(w66).filter(([, v]) => v !== true).map(([k]) => k);
if (failed.length) {
  console.log('WAVE66 SAVE PINS FAIL', failed.join(','));
  process.exit(1);
}
console.log('PROBE PASS');
