// Wave 74 persist: reputation heal + data cargo rows. Run:
// node --import ./scripts/with-css-stub.mjs out/w74/persist/probe.mjs
import { createShipState, cargoValue } from '../../../src/game/state.js';
import {
  restore,
  sanitizeCargoList,
  sanitizeReputation,
  WORLD_FIELDS,
} from '../../../src/game/save.js';
import {
  cargoValueSafe,
  copyDataCargoEntry,
  dataRowsMatch,
  hasDataDropRate,
  maybeSpawnDataFromWreck,
  spawnDataPod,
  standingRead,
} from '../../../src/game/data-trade.js';
import { mergePodContents } from '../../../src/game/pods.js';
import { spillShipCargo } from '../../../src/systems/npc.js';

const results = {};
const fails = [];

function pin(name, cond, extra = '') {
  results[name] = !!cond;
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function ctxBase() {
  return {
    flags: {},
    world: { currentSystem: 'freehold', credits: 350, fear: 0 },
    systems: { freehold: {} },
    cargo: [],
    cargoCapacity: 80,
    bio: {
      hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0,
      speedFactor: 1, turnFactor: 1,
    },
    player: createShipState('light', { name: 'W74Persist' }),
    ship: { object: null, velocity: { set() {} }, speed: 0 },
    emit() {},
    ships: [],
    pods: [],
    scene: { add() {} },
  };
}

function withProtoKey(base) {
  const bag = { ...base };
  Object.defineProperty(bag, '__proto__', {
    value: 99,
    enumerable: true,
    configurable: true,
    writable: true,
  });
  return bag;
}

// --- reputation ---
{
  const ctx = ctxBase();
  ctx.world.reputation = withProtoKey({
    freehold: 4,
    constructor: 8,
    prototype: 7,
    notAFaction: 3,
    veridian: Number.NaN,
    redledger: Number.POSITIVE_INFINITY,
    hollow: -40,
  });
  sanitizeReputation(ctx);
  const bag = ctx.world.reputation;
  pin('rep.protoDropped', !Object.hasOwn(bag, '__proto__') && bag.__proto__ !== 99);
  pin('rep.constructorDropped', !Object.hasOwn(bag, 'constructor') || bag.constructor !== 8);
  pin('rep.prototypeDropped', !Object.hasOwn(bag, 'prototype'));
  pin('rep.unknownDropped', !Object.hasOwn(bag, 'notAFaction'));
  pin('rep.nanDropped', !Object.hasOwn(bag, 'veridian'));
  pin('rep.infDropped', !Object.hasOwn(bag, 'redledger'));
  pin('rep.freeholdKept', bag.freehold === 4);
  pin('rep.markedKept', bag.hollow === -40);
  pin('rep.beautifulMissing', !Object.hasOwn(bag, 'beautiful'));
  pin('rep.standingReadMissing', standingRead(bag, 'beautiful') === 0);
  pin('rep.standingReadFinite', standingRead(bag, 'freehold') === 4);
  pin('rep.standingReadReserved', standingRead(bag, '__proto__') === 0);
}

{
  const ctx = ctxBase();
  ctx.world.reputation = undefined;
  sanitizeReputation(ctx);
  pin('rep.missingBecomesObject', ctx.world.reputation && typeof ctx.world.reputation === 'object'
    && !Array.isArray(ctx.world.reputation)
    && Object.keys(ctx.world.reputation).length === 0);
}

{
  const ctx = ctxBase();
  ctx.world.reputation = [{ freehold: 1 }];
  sanitizeReputation(ctx);
  pin('rep.arrayBecomesEmpty', Object.keys(ctx.world.reputation).length === 0);
}

{
  const dest = ctxBase();
  const stuffed = withProtoKey({ freehold: 12, veridian: Number.NaN });
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold', credits: 10, fear: 0, reputation: stuffed },
    cargo: [],
  });
  pin('rep.restore.protoDropped', !Object.hasOwn(dest.world.reputation, '__proto__')
    || dest.world.reputation.__proto__ !== 99);
  pin('rep.restore.nanDropped', !Object.hasOwn(dest.world.reputation, 'veridian'));
  pin('rep.restore.freehold', dest.world.reputation.freehold === 12);
  pin('rep.restore.beautifulMissing', !Object.hasOwn(dest.world.reputation, 'beautiful'));
}

pin('rep.noCrimeScoreField', !WORLD_FIELDS.includes('crimeScore')
  && !WORLD_FIELDS.includes('wanted')
  && !WORLD_FIELDS.includes('heat')
  && !WORLD_FIELDS.includes('police'));
pin('rep.reputationFieldKept', WORLD_FIELDS.includes('reputation'));

// --- cargo sanitize ---
{
  const listed = sanitizeCargoList([
    { commodity: 'provisions', units: 4, extra: true },
    { commodity: 'rawOre', units: 0 },
    { commodity: 'notASku', units: 2 },
    { commodity: '__proto__', units: 3 },
    { commodity: 'constructor', units: 3 },
    { commodity: 'survivor', units: 2, faction: 'veridian', source: 'playerKill', name: 'Ilyra' },
    {
      commodity: 'dataCrystal',
      units: 2,
      source: 'captured',
      originFaction: 'unknowables',
      name: '<b>x</b>',
      faction: 'veridian',
      playerKill: true,
      price: 9,
    },
    { commodity: 'dataCube', units: 1, originFaction: 'assembly' },
    { commodity: 'dataCube', units: 1, source: 'hacked', originFaction: 'assembly' },
    { commodity: 'dataCube', units: 1, source: 'legal', originFaction: '__proto__' },
    { commodity: 'dataCube', units: 1, source: 'legal', originFaction: 'freehold' },
    { commodity: 'dataCube', units: 1, source: 'stolen', originFaction: 'assembly' },
    { commodity: 'dataCrystal', units: 0, source: 'legal', originFaction: 'unknowables' },
    null,
    ['dataCrystal'],
  ]);
  const ordinary = listed.filter((r) => r.commodity === 'provisions');
  const unknown = listed.filter((r) => r.commodity === 'notASku');
  const protoRow = listed.filter((r) => r.commodity === '__proto__');
  const survivors = listed.filter((r) => r.commodity === 'survivor');
  const crystals = listed.filter((r) => r.commodity === 'dataCrystal');
  const cubes = listed.filter((r) => r.commodity === 'dataCube');
  pin('cargo.ordinarySurvives', ordinary.length === 1 && ordinary[0].units === 4
    && Object.keys(ordinary[0]).sort().join(',') === 'commodity,units');
  pin('cargo.zeroUnitsDrop', !listed.some((r) => r.commodity === 'rawOre'));
  pin('cargo.unknownDrops', unknown.length === 0);
  pin('cargo.protoCommodityDrops', protoRow.length === 0);
  pin('cargo.survivorUnchanged', survivors.length === 1
    && survivors[0].faction === 'veridian'
    && survivors[0].source === 'playerKill'
    && survivors[0].name === 'Ilyra');
  pin('cargo.dataRoundtrip', crystals.length === 1
    && crystals[0].source === 'captured'
    && crystals[0].originFaction === 'unknowables'
    && crystals[0].units === 2
    && Object.keys(crystals[0]).sort().join(',') === 'commodity,originFaction,source,units');
  pin('cargo.missingSourceDrops', !listed.some((r) => r.commodity === 'dataCube' && !r.source));
  pin('cargo.badSourceDrops', !listed.some((r) => r.source === 'hacked' || r.source === 'legal' && r.originFaction === 'freehold'));
  pin('cargo.stolenAllowlisted', cubes.length === 1 && cubes[0].source === 'stolen' && cubes[0].originFaction === 'assembly');
}

{
  const dest = ctxBase();
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold', credits: 10, fear: 0 },
    cargo: [
      { commodity: 'dataCube', units: 3, source: 'legal', originFaction: 'assembly', name: 'nope' },
      { commodity: 'dataCrystal', units: 1, originFaction: 'unknowables' },
      { commodity: 'provisions', units: 1 },
      { commodity: 'ghostSku', units: 9 },
      { commodity: 'survivor', units: 1, faction: 'gilded', source: 'other' },
    ],
  });
  pin('restore.dataKeepsProvenance', dest.cargo.some((r) => r.commodity === 'dataCube'
    && r.source === 'legal' && r.originFaction === 'assembly' && !('name' in r)));
  pin('restore.missingSourceNotLegal', !dest.cargo.some((r) => r.commodity === 'dataCrystal'));
  pin('restore.unknownDropped', !dest.cargo.some((r) => r.commodity === 'ghostSku'));
  pin('restore.ordinaryKept', dest.cargo.some((r) => r.commodity === 'provisions' && r.units === 1));
  pin('restore.survivorKept', dest.cargo.some((r) => r.commodity === 'survivor' && r.faction === 'gilded' && r.source === 'other'));
}

// --- scoop ---
{
  const hold = [];
  mergePodContents(hold, [
    { commodity: 'dataCrystal', units: 1, source: 'captured', originFaction: 'unknowables', name: 'x' },
    { commodity: 'dataCrystal', units: 1, source: 'captured', originFaction: 'unknowables' },
    { commodity: 'dataCrystal', units: 1, source: 'legal', originFaction: 'unknowables' },
    { commodity: 'dataCube', units: 1, source: 'captured', originFaction: 'assembly' },
    { commodity: 'dataCube', units: 1, source: 'captured', originFaction: '__proto__' },
    { commodity: 'survivor', units: 1, faction: 'veridian', source: 'other', name: 'A' },
    { commodity: 'provisions', units: 2 },
  ]);
  const crystalsCaptured = hold.filter((r) => r.commodity === 'dataCrystal' && r.source === 'captured');
  const crystalsLegal = hold.filter((r) => r.commodity === 'dataCrystal' && r.source === 'legal');
  pin('scoop.dataStacksSameTriple', crystalsCaptured.length === 1 && crystalsCaptured[0].units === 2
    && !('name' in crystalsCaptured[0]));
  pin('scoop.dataDoesNotCrossSource', crystalsLegal.length === 1 && crystalsLegal[0].units === 1);
  pin('scoop.reservedOriginDropped', !hold.some((r) => r.originFaction === '__proto__'));
  pin('scoop.survivorUnchanged', hold.some((r) => r.commodity === 'survivor' && r.faction === 'veridian' && r.name === 'A'));
  pin('dataRowsMatchTriple', dataRowsMatch(
    { commodity: 'dataCube', units: 1, source: 'stolen', originFaction: 'assembly' },
    { commodity: 'dataCube', units: 4, source: 'stolen', originFaction: 'assembly' },
  ));
  pin('copyDataDropsBadOrigin', copyDataCargoEntry({
    commodity: 'dataCube', units: 1, source: 'legal', originFaction: 'constructor',
  }) === null);
}

// --- cargoValue fail-closed ---
{
  const prices = { dataCrystal: 99999, dataCube: 88888, provisions: 100 };
  const hold = [
    { commodity: 'dataCrystal', units: 3, source: 'legal', originFaction: 'unknowables' },
    { commodity: 'provisions', units: 2 },
  ];
  pin('value.rawWouldHonorStuff', cargoValue(hold, prices) === 99999 * 3 + 200);
  pin('value.safeZerosData', cargoValueSafe(hold, prices) === 200);
  pin('value.safeEmpty', cargoValueSafe(null, prices) === 0);
}

// --- spawn skip ---
{
  pin('spawn.rateUnset', hasDataDropRate() === false);
  const pods = [];
  const live = {
    record: { faction: 'assembly' },
    state: {
      faction: 'assembly',
      cargo: [
        { commodity: 'dataCube', units: 1, source: 'captured', originFaction: 'assembly' },
        { commodity: 'provisions', units: 2 },
      ],
    },
    object: { position: { x: 0, y: 0, z: 0 } },
  };
  const world = ctxBase();
  world.pods = pods;
  world.spawned = [];
  pin('spawn.directNull', spawnDataPod(world, live) === null);
  pin('spawn.maybeNull', maybeSpawnDataFromWreck(world, live) === null);
  const n = spillShipCargo(world, live);
  pin('spawn.spillSkipsDataRow', n === 1);
  pin('spawn.noDataPodFromSpill', world.pods.every((p) => {
    const rows = p.contents || [];
    return rows.every((r) => r.commodity !== 'dataCrystal' && r.commodity !== 'dataCube');
  }));
  pin('spawn.holdCleared', live.state.cargo.length === 0);
}

if (fails.length) {
  console.error('FAIL', fails);
  process.exit(1);
}
console.log('PASS', Object.keys(results).length, 'pins');
console.log(JSON.stringify(results, null, 2));
