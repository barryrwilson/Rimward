import * as THREE from 'three';
import { FACTIONS, cargoValue } from './state.js';
import { spawnPod } from './pods.js';

/** Data cargo tokens and persist helpers. Tokens are not COMMODITIES keys. */

export const DATA_CRYSTAL = 'dataCrystal';
export const DATA_CUBE = 'dataCube';

export const DATA_LABELS = Object.freeze({
  dataCrystal: 'Data crystal',
  dataCube: 'Data cube',
});

export const DATA_SOURCES = Object.freeze(['legal', 'captured', 'stolen']);
export const DATA_ORIGIN_FACTIONS = Object.freeze(['unknowables', 'assembly']);

/** Owner Wave 82: destroy/jettison of Assembly or Unknowables hulls. */
export const DATA_DROP_RATE = 0.20;

/** Owner Wave 82: legal cube / legal crystal at origin desk. */
export const ARCHIVE_OWN_UU = 400;
/** Owner Wave 82: Assembly pays this for Unknowable crystals. */
export const ARCHIVE_RIVAL_UU = 900;
/** Owner Wave 82: fixer marks one captured lot legal. */
export const LAUNDER_UU = 250;

const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

const _dataPodPos = new THREE.Vector3();

function reservedId(value) {
  return typeof value === 'string' && (RESERVED_IDS.has(value) || value === '__proto__');
}

function sanitizeUnits(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  const u = Math.trunc(n);
  if (u < 0) return 0;
  return u > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : u;
}

export function isDataCommodity(key) {
  return key === DATA_CRYSTAL || key === DATA_CUBE;
}

export function isDataCargo(entry) {
  return !!entry && isDataCommodity(entry.commodity);
}

export function isDataSource(value) {
  return value === 'legal' || value === 'captured' || value === 'stolen';
}

export function isDataOriginFaction(value) {
  if (typeof value !== 'string' || !value) return false;
  if (reservedId(value)) return false;
  if (value !== 'unknowables' && value !== 'assembly') return false;
  return Object.hasOwn(FACTIONS, value);
}

export function dataCommodityLabel(key) {
  if (!isDataCommodity(key)) return '';
  return DATA_LABELS[key];
}

/** Missing own key, reserved id, or non-finite → 0. */
export function standingRead(bag, faction) {
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return 0;
  if (typeof faction !== 'string' || !faction) return 0;
  if (reservedId(faction)) return 0;
  if (!Object.hasOwn(FACTIONS, faction)) return 0;
  if (!Object.hasOwn(bag, faction)) return 0;
  const n = bag[faction];
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export function sanitizeDataCargoRow(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const commodity = raw.commodity;
  if (!isDataCommodity(commodity) || reservedId(commodity)) return null;
  const units = sanitizeUnits(raw.units);
  if (units < 1) return null;
  if (!isDataSource(raw.source)) return null;
  if (!isDataOriginFaction(raw.originFaction)) return null;
  return {
    commodity,
    units,
    source: raw.source,
    originFaction: raw.originFaction,
  };
}

export function copyDataCargoEntry(entry) {
  return sanitizeDataCargoRow(entry);
}

export function dataRowsMatch(held, incoming) {
  return isDataCargo(held)
    && isDataCargo(incoming)
    && held.commodity === incoming.commodity
    && isDataSource(held.source)
    && held.source === incoming.source
    && isDataOriginFaction(held.originFaction)
    && held.originFaction === incoming.originFaction;
}

/** Data keys contribute 0 even if world.prices is stuffed. */
export function cargoValueSafe(cargo, prices) {
  if (!Array.isArray(cargo)) return 0;
  const filtered = [];
  for (let i = 0; i < cargo.length; i++) {
    const row = cargo[i];
    if (!row || isDataCommodity(row.commodity)) continue;
    filtered.push(row);
  }
  return cargoValue(filtered, prices);
}

export function hasDataDropRate() {
  return typeof DATA_DROP_RATE === 'number' && Number.isFinite(DATA_DROP_RATE) && DATA_DROP_RATE > 0;
}

function wreckFaction(live) {
  const rec = live && live.record;
  if (rec && typeof rec === 'object' && !Array.isArray(rec)
    && Object.hasOwn(rec, 'faction') && isDataOriginFaction(rec.faction)) {
    return rec.faction;
  }
  const st = live && live.state;
  if (st && typeof st === 'object' && !Array.isArray(st)
    && Object.hasOwn(st, 'faction') && isDataOriginFaction(st.faction)) {
    return st.faction;
  }
  return null;
}

function dataTokenForOrigin(faction) {
  if (faction === 'assembly') return DATA_CUBE;
  if (faction === 'unknowables') return DATA_CRYSTAL;
  return null;
}

/**
 * One captured data pod from an Assembly or Unknowables hull.
 * Untinted steel. Fail closed on missing faction, reserved ids, or no scene.
 */
export function spawnDataPod(ctx, live) {
  if (!ctx || !live) return null;
  if (!ctx.scene || !Array.isArray(ctx.pods) || !ctx.world) return null;
  const faction = wreckFaction(live);
  if (!faction) return null;
  const commodity = dataTokenForOrigin(faction);
  if (!commodity) return null;
  const row = sanitizeDataCargoRow({
    commodity,
    units: 1,
    source: 'captured',
    originFaction: faction,
  });
  if (!row) return null;
  const pos = live.object && live.object.position;
  if (!pos) return null;
  const x = Number(pos.x);
  const y = Number(pos.y);
  const z = Number(pos.z);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  _dataPodPos.set(
    x + (Math.random() - 0.5) * 8,
    y + (Math.random() - 0.5) * 8,
    z + (Math.random() - 0.5) * 8,
  );
  return spawnPod(ctx, [row], _dataPodPos);
}

export function maybeSpawnDataFromWreck(ctx, live) {
  if (!hasDataDropRate()) return null;
  if (Math.random() >= DATA_DROP_RATE) return null;
  return spawnDataPod(ctx, live);
}

export function archiveFilePrice(verb, commodity, source, originFaction) {
  if (verb === 'buy') {
    if (commodity === DATA_CUBE && source === 'legal' && originFaction === 'assembly') {
      return ARCHIVE_OWN_UU;
    }
    return null;
  }
  if (verb !== 'sell') return null;
  if (commodity === DATA_CUBE && source === 'legal' && originFaction === 'assembly') {
    return ARCHIVE_OWN_UU;
  }
  if (commodity === DATA_CRYSTAL && originFaction === 'unknowables' && isDataSource(source)) {
    return ARCHIVE_RIVAL_UU;
  }
  return null;
}

export function addDataCargoRow(cargo, row) {
  if (!Array.isArray(cargo)) return false;
  const clean = sanitizeDataCargoRow(row);
  if (!clean) return false;
  for (let i = 0; i < cargo.length; i++) {
    const held = cargo[i];
    if (!dataRowsMatch(held, clean)) continue;
    const next = sanitizeUnits(sanitizeUnits(held.units) + clean.units);
    if (next < 1) return false;
    held.units = next;
    return true;
  }
  cargo.push(clean);
  return true;
}

export function removeDataCargoUnits(cargo, spec, units) {
  if (!Array.isArray(cargo)) return false;
  const want = sanitizeDataCargoRow({
    commodity: spec && spec.commodity,
    source: spec && spec.source,
    originFaction: spec && spec.originFaction,
    units: 1,
  });
  const need = sanitizeUnits(units);
  if (!want || need < 1) return false;
  let have = 0;
  for (let i = 0; i < cargo.length; i++) {
    if (dataRowsMatch(cargo[i], want)) have += sanitizeUnits(cargo[i].units);
  }
  if (have < need) return false;
  let left = need;
  for (let i = 0; i < cargo.length && left > 0; i++) {
    const row = cargo[i];
    if (!dataRowsMatch(row, want)) continue;
    const take = Math.min(sanitizeUnits(row.units), left);
    row.units = sanitizeUnits(row.units) - take;
    left -= take;
  }
  let w = 0;
  for (let r = 0; r < cargo.length; r++) {
    const row = cargo[r];
    if (isDataCargo(row) && sanitizeUnits(row.units) < 1) continue;
    cargo[w++] = row;
  }
  cargo.length = w;
  return true;
}

/** Flip matching captured rows to legal. Merge stacks. */
export function launderDataLot(cargo, spec) {
  if (!Array.isArray(cargo)) return false;
  if (!spec || spec.source !== 'captured') return false;
  const want = sanitizeDataCargoRow({
    commodity: spec.commodity,
    source: 'captured',
    originFaction: spec.originFaction,
    units: 1,
  });
  if (!want) return false;
  let flipped = 0;
  for (let i = 0; i < cargo.length; i++) {
    const row = cargo[i];
    if (!dataRowsMatch(row, want)) continue;
    const next = sanitizeDataCargoRow({
      commodity: row.commodity,
      units: row.units,
      source: 'legal',
      originFaction: row.originFaction,
    });
    if (!next) continue;
    cargo[i] = next;
    flipped += 1;
  }
  if (flipped < 1) return false;
  for (let i = 0; i < cargo.length; i++) {
    const a = cargo[i];
    if (!isDataCargo(a) || a.source !== 'legal') continue;
    for (let j = i + 1; j < cargo.length; j++) {
      const b = cargo[j];
      if (!dataRowsMatch(a, b)) continue;
      a.units = sanitizeUnits(sanitizeUnits(a.units) + sanitizeUnits(b.units));
      cargo.splice(j, 1);
      j -= 1;
    }
  }
  return true;
}
