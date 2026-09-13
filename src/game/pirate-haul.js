import { COMMODITIES, ECON, PIRATE_HAUL, cargoHoldFor } from './state.js';
import { marketSupplyAt, commitMarketSupply } from './market-supply.js';

/**
 * Pirate haul (issue #151) — the record-side half of "a pirate collects what
 * it took": the hold test that sends a pirate to fence, the sale itself, and
 * the save-time sanitizer for the one persisted field this adds
 * (`rec.credits`). The flying — scoop steering, the station run — lives in
 * npc.js beside the hunt loop; nothing here touches a live hull or a mesh.
 *
 * Persistence contract: the pirate's hold IS `rec.cargo` (createShipState
 * hands the record's own array to the live state, so a scoop writes straight
 * through), and the purse is `rec.credits`, a finite non-negative integer.
 * Both are JSON-plain and ride the record through a cull, a save/restore
 * and the cross-system fold with no new bookkeeping.
 */

const CREDITS_MAX = 1e9;

export function cargoUnits(cargo) {
  if (!Array.isArray(cargo)) return 0;
  let n = 0;
  for (let i = 0; i < cargo.length; i++) {
    const u = cargo[i] && cargo[i].units;
    if (typeof u === 'number' && Number.isFinite(u) && u > 0) n += Math.floor(u);
  }
  return n;
}

/** Spare units in a pirate hold: class hold minus what is aboard. */
export function holdFree(classKey, cargo) {
  return Math.max(0, cargoHoldFor(classKey) - cargoUnits(cargo));
}

/** True once the hold is PIRATE_HAUL.fenceAt full: time to fence. */
export function holdHeavy(classKey, cargo) {
  const cap = cargoHoldFor(classKey);
  return cap > 0 && cargoUnits(cargo) >= Math.ceil(cap * PIRATE_HAUL.fenceAt);
}

/** A row a fence will buy: a priced market good, never people or data. */
function fenceable(row) {
  if (!row || typeof row.commodity !== 'string') return false;
  if (row.commodity === 'survivor') return false;
  if (!Object.hasOwn(COMMODITIES, row.commodity)) return false;
  return typeof row.units === 'number' && Number.isFinite(row.units) && row.units > 0;
}

/** One fenced return rate, rolled per sale inside ECON.fenceRate. */
export function rollFenceRate(rand = Math.random) {
  const [lo, hi] = ECON.fenceRate;
  const r = lo + (hi - lo) * rand();
  return Number.isFinite(r) ? Math.min(hi, Math.max(lo, r)) : lo;
}

/**
 * Sell the record's hold at the station of `systemId`. Every fenceable row
 * pays `round(price × rate) × units` where price is that system's live
 * market price (world.markets[systemId], the same table the player trades
 * against); the market takes the units through commitMarketSupply exactly
 * as a player sale does. Rows a fence will not buy (survivors, unknown keys)
 * stay aboard. Returns { units, credits } — zero when nothing sold.
 */
export function fenceHaul(world, rec, systemId, rate = rollFenceRate()) {
  const out = { units: 0, credits: 0 };
  if (!world || !rec || !Array.isArray(rec.cargo)) return out;
  const table = world.markets && typeof world.markets === 'object' ? world.markets[systemId] : null;
  const keep = [];
  for (let i = 0; i < rec.cargo.length; i++) {
    const row = rec.cargo[i];
    if (!fenceable(row)) {
      keep.push(row);
      continue;
    }
    const key = row.commodity;
    const units = Math.floor(row.units);
    const book = table && typeof table[key] === 'number' && Number.isFinite(table[key])
      ? table[key] : COMMODITIES[key].base;
    const unit = Math.max(0, Math.round(book * rate));
    const stock = marketSupplyAt(world, systemId, key);
    commitMarketSupply(world, systemId, key, stock, units);
    out.units += units;
    out.credits += unit * units;
  }
  if (out.units === 0) return out;
  rec.cargo.length = 0;
  for (let i = 0; i < keep.length; i++) rec.cargo.push(keep[i]);
  creditRecord(rec, out.credits);
  return out;
}

/** Add to the record's purse; the field is created on first credit. */
export function creditRecord(rec, amount) {
  if (!rec) return 0;
  const have = readCredits(rec);
  const add = typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
  rec.credits = Math.min(CREDITS_MAX, have + add);
  return rec.credits;
}

/** The record's purse as a finite non-negative integer; anything else is 0. */
export function readCredits(rec) {
  const v = rec && rec.credits;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return 0;
  return Math.min(CREDITS_MAX, Math.floor(v));
}

/**
 * Save-time heal (save.js): a purse that is not a finite non-negative
 * number is dropped, never adopted; a present good one is kept as an
 * integer. Absent stays absent — a legacy record simply has no purse.
 */
export function sanitizeHaulRecord(rec) {
  if (!rec || typeof rec !== 'object') return;
  if (!Object.hasOwn(rec, 'credits')) return;
  const v = rec.credits;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    delete rec.credits;
    return;
  }
  rec.credits = Math.min(CREDITS_MAX, Math.floor(v));
}
