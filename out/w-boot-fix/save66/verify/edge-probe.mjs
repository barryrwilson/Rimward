import { createShipState } from '../../../../src/game/state.js';
import { restore, NAME_MAX } from '../../../../src/game/save.js';

function ctxBase() {
  return {
    flags: {},
    world: { currentSystem: 'freehold', credits: 350, fear: 0 },
    systems: { freehold: {} },
    cargo: [],
    cargoCapacity: 80,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: createShipState('light', { name: 'Wave66Edge' }),
    ship: { object: null },
    emit() {},
    ships: [],
  };
}

const snapCargo = [
  { commodity: 'survivor', units: 11, faction: 'gilded', source: 'other' },
  { commodity: 'survivor', units: 12, faction: 'freehold', source: 'hack' },
  { commodity: 'survivor', units: 13, faction: 'freehold', source: 'playerKill' },
  { commodity: 'survivor', units: 14, faction: 'veridian', source: 'other', name: '\u0007' + 'A'.repeat(45) },
  { commodity: 'survivor', units: 15, faction: '__proto__', source: 'other' },
  { commodity: 'survivor', units: 16, faction: 'constructor', source: 'other' },
  { commodity: 'survivor', units: 17, faction: 'prototype', source: 'other' },
  { commodity: 'survivor', units: 2, faction: 'gilded', source: 'other' },
  { commodity: 'rawOre', units: 5, faction: 'gilded', source: 'playerKill', name: 'nope', price: 1 },
];

const omit = ctxBase();
restore(omit, {
  v: 1,
  world: { currentSystem: 'freehold' },
  cargoCapacity: 80,
  cargo: snapCargo,
});
const omitUnits = omit.cargo.map((r) => r.units).sort((a, b) => a - b);
const omitCommodities = omit.cargo.map((r) => r.commodity);
const mounted = omit.world.hangar?.hulls?.find((h) => h.id === omit.world.hangar.mountedId);
const mountedUnits = (mounted?.cargo ?? []).map((r) => r.units).sort((a, b) => a - b);
const omitTotal = omit.cargo.reduce((s, r) => s + r.units, 0);

const present = ctxBase();
restore(present, {
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
const presentMounted = present.world.hangar?.hulls?.find((h) => h.id === present.world.hangar.mountedId);

const nullHangar = ctxBase();
restore(nullHangar, {
  v: 1,
  world: { currentSystem: 'freehold', hangar: null },
  cargoCapacity: 80,
  cargo: snapCargo,
});
const nullUnits = nullHangar.cargo.map((r) => r.units).sort((a, b) => a - b);
const nullTotal = nullHangar.cargo.reduce((s, r) => s + r.units, 0);

const pins = {
  omitKeepsNameCapRow: omit.cargo.some((r) => r.units === 14 && r.name === 'A'.repeat(NAME_MAX)),
  omitKeepsValidTwo: omit.cargo.some((r) => r.units === 2 && r.faction === 'gilded'),
  omitKeepsOre: omit.cargo.some((r) => r.commodity === 'rawOre' && r.units === 5),
  omitDropsReserved: !omit.cargo.some((r) => [15, 16, 17].includes(r.units)),
  omitRowCount: omit.cargo.length === 6,
  omitUnits: JSON.stringify(omitUnits) === JSON.stringify([2, 5, 11, 12, 13, 14]),
  omitMountedMatchesLive: JSON.stringify(mountedUnits) === JSON.stringify(omitUnits),
  omitOverfillsStarterCap: omitTotal > (mounted?.cargoCapacity ?? 0),
  hangarCargoWinsLive: present.cargo.length === 1
    && present.cargo[0].commodity === 'gildvein'
    && present.cargo[0].units === 5
    && !present.cargo.some((r) => r.commodity === 'rawOre'),
  hangarCargoWinsMounted: presentMounted?.cargo?.length === 1
    && presentMounted.cargo[0].commodity === 'gildvein'
    && presentMounted.cargo[0].units === 5
    && !presentMounted.cargo.some((r) => r.commodity === 'rawOre'),
  nullHangarDoesNotReseal: JSON.stringify(nullUnits) !== JSON.stringify(omitUnits)
    || nullTotal <= (nullHangar.world.hangar?.hulls?.[0]?.cargoCapacity ?? 0),
};

console.log('wave66 edge pins:', JSON.stringify(pins, null, 2));
console.log('omit cargoCapacity/mountedCap/total:', omit.cargoCapacity, mounted?.cargoCapacity, omitTotal);
console.log('null units/total/cap:', nullUnits, nullTotal, nullHangar.world.hangar?.hulls?.[0]?.cargoCapacity);
const failed = Object.entries(pins).filter(([, v]) => v !== true).map(([k]) => k);
if (failed.length) {
  console.log('EDGE FAIL', failed.join(','));
  process.exit(1);
}
console.log('EDGE PASS');
