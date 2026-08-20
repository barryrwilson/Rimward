import { FACTIONS } from './state.js';

/**
 * Gilded Chain people transfer. Authored UU / standing / fear tables and the
 * sale mutator. Wave 66 PR2. No DOM. Station UI is PR3.
 */

export const TRAFFIC_LIST_UU = Object.freeze({ other: 160, playerKill: 240 });
export const TRAFFIC_REP = Object.freeze({
  victimOther: 0,
  victimPlayerKill: -8,
  gildedPerUnit: 2,
});
export const TRAFFIC_FEAR = Object.freeze({ other: 1, playerKill: 2 });

const MILESTONE_ID = 'peopleTrafficked';
const MILESTONE_LINE = 'The Chain recorded a transfer.';
const SOURCE_KILL = 'playerKill';
const SOURCE_OTHER = 'other';
const BUYER = 'gilded';

const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

let saleInFlight = false;

function isSurvivorCargo(row) {
  return !!row && row.commodity === 'survivor';
}

function isFactionKey(value) {
  return typeof value === 'string' && value.length > 0 && !RESERVED_IDS.has(value);
}

function normalizeSource(source) {
  return source === SOURCE_KILL ? SOURCE_KILL : SOURCE_OTHER;
}

function holdCap(ctx) {
  const cap = Number(ctx?.cargoCapacity);
  return Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : 99;
}

function survivorUnitCount(row, cap) {
  const n = Number(row?.units);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const u = Math.floor(n);
  return u > cap ? 0 : u;
}

function unitPriceOf(source) {
  return source === SOURCE_KILL ? TRAFFIC_LIST_UU.playerKill : TRAFFIC_LIST_UU.other;
}

function victimRepPer(source) {
  return source === SOURCE_KILL ? TRAFFIC_REP.victimPlayerKill : TRAFFIC_REP.victimOther;
}

function fearDeltaOf(source) {
  return source === SOURCE_KILL ? TRAFFIC_FEAR.playerKill : TRAFFIC_FEAR.other;
}

function emit(ctx, name, payload) {
  if (typeof ctx?.emit === 'function') ctx.emit(name, payload);
}

function canWriteRep(bag, key) {
  return !!bag
    && typeof bag === 'object'
    && !Array.isArray(bag)
    && isFactionKey(key)
    && Object.hasOwn(FACTIONS, key);
}

function addRep(bag, key, delta) {
  if (!canWriteRep(bag, key) || !Number.isFinite(delta) || delta === 0) return;
  const cur = Number(bag[key]);
  bag[key] = (Number.isFinite(cur) ? cur : 0) + delta;
}

function successLine(ctx, n, total) {
  if (ctx?.settings?.reducedMotion === true) return `Transferred. ${total} UU.`;
  return `The Chain takes them. ${n} transferred. ${total} UU.`;
}

export function isTrafficEligible(row, cap) {
  if (!isSurvivorCargo(row)) return false;
  const faction = row.faction;
  if (typeof faction !== 'string' || !isFactionKey(faction)) return false;
  if (!Object.hasOwn(FACTIONS, faction)) return false;
  if (faction === 'unknowables') return false;
  return survivorUnitCount(row, cap) >= 1;
}

export function trafficLots(ctx) {
  const cargo = ctx?.cargo;
  if (!Array.isArray(cargo)) return [];
  const cap = holdCap(ctx);
  const lots = [];
  const index = new Map();
  for (const row of cargo) {
    if (!isTrafficEligible(row, cap)) continue;
    const faction = row.faction;
    const source = normalizeSource(row.source);
    const units = survivorUnitCount(row, cap);
    const key = `${faction}\0${source}`;
    let lot = index.get(key);
    if (!lot) {
      const unitPrice = unitPriceOf(source);
      lot = { faction, source, units: 0, unitPrice, total: 0 };
      index.set(key, lot);
      lots.push(lot);
    }
    lot.units += units;
    lot.total = lot.unitPrice * lot.units;
  }
  return lots;
}

function findLot(ctx, faction, source) {
  if (typeof faction !== 'string' || !isFactionKey(faction)) return null;
  const want = normalizeSource(source);
  for (const lot of trafficLots(ctx)) {
    if (lot.faction === faction && lot.source === want) return lot;
  }
  return null;
}

function removeLotRows(ctx, faction, source) {
  const cargo = ctx.cargo;
  if (!Array.isArray(cargo)) return 0;
  const cap = holdCap(ctx);
  let removed = 0;
  let w = 0;
  for (let r = 0; r < cargo.length; r++) {
    const row = cargo[r];
    if (
      isTrafficEligible(row, cap)
      && row.faction === faction
      && normalizeSource(row.source) === source
    ) {
      removed += survivorUnitCount(row, cap);
      continue;
    }
    cargo[w++] = row;
  }
  cargo.length = w;
  return removed;
}

function applySurvivorSaleUnlocked(ctx, faction, source, dockFaction) {
  if (dockFaction !== BUYER) return null;
  const lot = findLot(ctx, faction, source);
  if (!lot || lot.units === 0) return null;
  const world = ctx.world;
  if (!world || typeof world !== 'object') return null;
  const credits = world.credits;
  if (typeof credits !== 'number' || !Number.isFinite(credits)) return null;
  const unitPrice = unitPriceOf(lot.source);
  const listed = unitPrice * lot.units;
  if (!Number.isFinite(listed) || listed < 0 || !Number.isFinite(credits + listed)) return null;

  const count = removeLotRows(ctx, lot.faction, lot.source);
  if (count === 0) return null;
  const total = unitPrice * count;
  world.credits = credits + total;

  const bag = world.reputation;
  const victimDelta = victimRepPer(lot.source) * count;
  addRep(bag, lot.faction, victimDelta);
  addRep(bag, BUYER, TRAFFIC_REP.gildedPerUnit * count);

  const fearDelta = fearDeltaOf(lot.source);
  const fearCur = Number(world.fear);
  const fearBase = Number.isFinite(fearCur) ? fearCur : 0;
  world.fear = Math.max(0, Math.min(100, fearBase + fearDelta));
  emit(ctx, 'fearChanged', { fear: world.fear });

  if (Array.isArray(world.milestones) && !world.milestones.includes(MILESTONE_ID)) {
    world.milestones.push(MILESTONE_ID);
    emit(ctx, 'milestone', { id: MILESTONE_ID, line: MILESTONE_LINE });
  }

  const line = successLine(ctx, count, total);
  const payload = {
    faction: lot.faction,
    source: lot.source,
    count,
    credits: total,
    repDelta: victimDelta,
    line,
  };
  emit(ctx, 'survivorSold', payload);
  emit(ctx, 'commLine', { text: line, from: 'station' });
  return payload;
}

export function applySurvivorSale(ctx, faction, source, dockFaction) {
  if (saleInFlight) return null;
  saleInFlight = true;
  try {
    return applySurvivorSaleUnlocked(ctx, faction, source, dockFaction);
  } finally {
    saleInFlight = false;
  }
}
