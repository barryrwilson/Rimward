import { createShipState } from '../../../src/game/state.js';
import {
  restore,
  sanitizeCargoList,
  sanitizeFaction,
  WORLD_FIELDS,
} from '../../../src/game/save.js';

const reserved = [
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
];

function ctx() {
  return {
    flags: {},
    world: { currentSystem: 'freehold', credits: 350, fear: 0 },
    systems: { freehold: {} },
    cargo: [],
    cargoCapacity: 80,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: createShipState('light', { name: 'Wave66Probe' }),
    ship: { object: null },
    emit() {},
    ships: [],
  };
}

const results = {};

results.factionRejectsReserved = reserved.every((id) => sanitizeFaction(id) === null);
results.factionKeepsGilded = sanitizeFaction('gilded') === 'gilded';
results.factionRejectsEmpty = sanitizeFaction('') === null && sanitizeFaction(null) === null;

const listed = sanitizeCargoList([
  { commodity: 'survivor', units: 2, faction: 'gilded', source: 'other', price: 9, loadout: { x: 1 } },
  { commodity: 'survivor', units: 15, faction: '__proto__', source: 'other' },
  { commodity: 'survivor', units: 16, faction: 'constructor', source: 'other' },
  { commodity: 'survivor', units: 17, faction: 'prototype', source: 'other' },
  { commodity: 'survivor', units: 18, faction: 'toString', source: 'other' },
  { commodity: 'survivor', units: 19, faction: 'valueOf', source: 'other' },
  { commodity: 'survivor', units: 20, faction: 'hasOwnProperty', source: 'other' },
  { commodity: 'rawOre', units: 5, faction: 'gilded', source: 'playerKill', name: 'nope', price: 1 },
  { commodity: 'survivor', units: 0, faction: 'gilded', source: 'other' },
]);
const byU = (n) => listed.find((r) => r.units === n);
results.listDropsReservedRows = !byU(15) && !byU(16) && !byU(17) && !byU(18) && !byU(19) && !byU(20);
results.listKeepsValid = byU(2)?.faction === 'gilded' && byU(2)?.source === 'other'
  && Object.keys(byU(2)).sort().join(',') === 'commodity,faction,source,units'
  && byU(2).price === undefined;
results.oreNoLeak = listed.some((r) => r.commodity === 'rawOre'
  && Object.keys(r).sort().join(',') === 'commodity,units');
results.zeroUnitsDropped = !listed.some((r) => r.units === 0);
results.noWorldPeopleField = !WORLD_FIELDS.includes('peopleTrafficked');

const dirty = ctx();
const extraRow = {
  commodity: 'survivor', units: 11, faction: 'gilded', source: 'other',
  price: 99, loadout: { x: 1 },
};
Object.defineProperty(extraRow, '__proto__', { value: { polluted: true }, enumerable: true });
restore(dirty, {
  v: 1,
  world: { currentSystem: 'freehold', peopleTrafficked: 7 },
  cargoCapacity: 80,
  cargo: [
    extraRow,
    { commodity: 'survivor', units: 15, faction: '__proto__', source: 'other' },
    { commodity: 'survivor', units: 16, faction: 'constructor', source: 'other' },
    { commodity: 'survivor', units: 17, faction: 'prototype', source: 'other' },
  ],
});
const extra = dirty.cargo.find((r) => r.units === 11);
results.restoreDropsReserved = !dirty.cargo.some((r) =>
  r.faction === '__proto__' || r.faction === 'constructor' || r.faction === 'prototype');
results.restoreKeepsValid = extra?.faction === 'gilded'
  && Object.keys(extra).sort().join(',') === 'commodity,faction,source,units';
results.enumerableProtoDrop = extra && !Object.prototype.hasOwnProperty.call(extra, '__proto__')
  && extra.polluted !== true && Object.prototype.polluted !== true;
results.peopleTraffickedNotRestored = dirty.world.peopleTrafficked === undefined;

const omit = sanitizeCargoList([
  { commodity: 'survivor', units: 3, source: 'other' },
]);
results.omitFactionKeepsRow = omit.length === 1 && omit[0].units === 3 && !('faction' in omit[0]);

const protoCase = sanitizeCargoList([
  { commodity: 'survivor', units: 4, faction: '__PROTO__', source: 'other' },
]);
results.upperProtoIsOwnKeyNotPollution = protoCase.length === 1
  && protoCase[0].faction === '__PROTO__'
  && Object.prototype.polluted !== true;

console.log(JSON.stringify(results, null, 2));
const failed = Object.entries(results).filter(([, v]) => v !== true).map(([k]) => k);
if (failed.length) {
  console.log('PROBE FAIL', failed.join(','));
  process.exit(1);
}
console.log('PROBE PASS');
