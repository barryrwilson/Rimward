import { COMMODITIES, SYSTEMS, MARKET_SUPPLY } from './state.js';

const SYSTEM_IDS = Object.keys(SYSTEMS);
const COMMODITY_KEYS = Object.keys(COMMODITIES);
const plain = (v) => v !== null && typeof v === 'object'
  && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const clock = (v) => Number.isFinite(v) && v >= 0 ? v : 0;
const missing = Symbol('missing');
// Only authored own data properties: prototype paths and accessors are not saves.
function own(v, key) {
  const d = Object.getOwnPropertyDescriptor(v, key);
  return d ? (Object.hasOwn(d, 'value') ? d.value : null) : missing;
}

export function supplyCapacity(key) {
  if (!Object.hasOwn(COMMODITIES, key)) return 0;
  return COMMODITIES[key].bulk ? MARKET_SUPPLY.bulkCapacity : MARKET_SUPPLY.otherCapacity;
}

function rowAt(raw, capacity, now, absent = false) {
  if (absent) return { units: capacity, updatedAt: now };
  if (plain(raw)) {
    const units = own(raw, 'units');
    const updatedAt = own(raw, 'updatedAt');
    if (Number.isFinite(units) && units >= 0 && units <= Number.MAX_SAFE_INTEGER
      && Number.isFinite(updatedAt) && updatedAt >= 0) return { units, updatedAt };
  }
  return { units: 0, updatedAt: now };
}

/** Bounded, deep JSON copy for saves/restores; absent legacy rows stay lazy/full.
 * Malformed present containers become empty known rows, never legacy defaults.
 * A future timestamp is bounded to restored time without granting elapsed time.
 */
export function normalizeMarketSupply(raw, time, present = raw !== undefined) {
  const now = clock(time);
  const out = {};
  if (!present) return out;
  const rootValid = plain(raw);
  for (const id of SYSTEM_IDS) {
    const system = rootValid ? own(raw, id) : null;
    if (system === missing) continue;
    const systemValid = plain(system);
    const rows = {};
    for (const key of COMMODITY_KEYS) {
      const value = systemValid ? own(system, key) : null;
      if (value === missing) continue;
      const row = rowAt(value, supplyCapacity(key), now);
      row.updatedAt = Math.min(now, row.updatedAt);
      rows[key] = row;
    }
    out[id] = rows;
  }
  return out;
}

/** Read-only effective stock at saved simulation time. No reservation or writes. */
export function marketSupplyAt(world, systemId, key) {
  const capacity = supplyCapacity(key);
  const now = clock(world.time);
  if (!capacity || !Object.hasOwn(SYSTEMS, systemId)) return { units: 0, available: 0, capacity: 0, updatedAt: now };
  const raw = own(world, 'marketSupply');
  const system = raw === missing ? missing : plain(raw) ? own(raw, systemId) : null;
  const value = system === missing ? missing : plain(system) ? own(system, key) : null;
  const row = rowAt(value, capacity, now, value === missing);
  const elapsed = Math.max(0, now - row.updatedAt);
  const recovery = elapsed * capacity / MARKET_SUPPLY.refillSeconds;
  const units = row.units > capacity
    ? Math.max(capacity, row.units - recovery)
    : Math.min(capacity, row.units + recovery);
  return { units, available: Math.floor(units), capacity, updatedAt: Math.max(now, row.updatedAt) };
}

/** Call only after full order validation. Writes one complete supply receipt. */
export function commitMarketSupply(world, systemId, key, stock, delta) {
  if (!Object.hasOwn(SYSTEMS, systemId) || !supplyCapacity(key)) return;
  // Normalizing also prevents malformed sibling containers becoming fresh stock.
  if (!plain(world.marketSupply)) {
    world.marketSupply = normalizeMarketSupply(world.marketSupply, world.time, Object.hasOwn(world, 'marketSupply'));
  }
  const root = world.marketSupply;
  if (!Object.hasOwn(root, systemId)) root[systemId] = {};
  if (!plain(root[systemId])) {
    root[systemId] = normalizeMarketSupply({ [systemId]: root[systemId] }, world.time)[systemId];
  }
  root[systemId][key] = {
    units: Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, stock.units + delta)),
    updatedAt: stock.updatedAt,
  };
}

/** Scarcity raises asks; surplus lowers bids. One bounded pressure curve, with
 * each side anchored at equilibrium so buying then selling cannot pump bids.
 * Nominal capacity is the recovery target, not a ceiling on delivered goods.
 */
export function marketSupplyMultiplier(stock, buying) {
  if (!stock.capacity) return 1;
  const pressure = Math.max(-1, Math.min(1, 1 - stock.units / stock.capacity));
  return 1 + MARKET_SUPPLY.pricePressure * (buying ? Math.max(0, pressure) : Math.min(0, pressure));
}
