import { COMMODITIES, SYSTEMS } from './state.js';

const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const own = (value, key) => plain(value) && Object.hasOwn(value, key) ? value[key] : undefined;
const clock = value => Number.isFinite(value) && value >= 0 ? value : 0;

// Historical SELL quotes only. Never consult markets, prices, or current standing.
export function normalizePriceMemory(raw, time) {
  const out = {};
  for (const id of Object.keys(SYSTEMS)) {
    const entry = own(raw, id);
    if (!plain(entry) || !Number.isFinite(entry.at) || entry.at < 0) continue;
    const prices = {};
    for (const key of Object.keys(COMMODITIES)) {
      const sell = own(entry.prices, key);
      if (Number.isSafeInteger(sell) && sell >= 0) prices[key] = sell;
    }
    if (Object.keys(prices).length) out[id] = { at: Math.min(clock(time), entry.at), prices };
  }
  return out;
}

// Called by the rendered market, never by the agent observer or chart.
export function rememberMarket(ctx, prices) {
  const id = ctx.world.currentSystem;
  if (!ctx.flags.docked || !Object.hasOwn(SYSTEMS, id)) return;
  const memory = normalizePriceMemory(ctx.world.priceMemory, ctx.world.time);
  const captured = normalizePriceMemory({ [id]: { at: clock(ctx.world.time), prices } }, ctx.world.time);
  ctx.world.priceMemory = { ...memory, ...captured };
}

export function priceAge(seconds) {
  const minutes = Math.floor(clock(seconds) / 60);
  return minutes < 1 ? 'just now' : `${minutes} min ago`;
}

export function rememberedPrices(world, id) {
  if (typeof id !== 'string' || !Object.hasOwn(SYSTEMS, id)) return [];
  const entry = normalizePriceMemory(world?.priceMemory, world?.time)[id];
  if (!entry) return [];
  return priceRows(world, id, entry);
}

function priceRows(world, id, entry) {
  const ageSeconds = Math.max(0, clock(world?.time) - entry.at);
  return Object.entries(entry.prices).map(([commodity, sell]) => ({
    commodity, systemId: id, station: SYSTEMS[id].station?.name || SYSTEMS[id].name,
    sell, at: entry.at, ageSeconds, age: priceAge(ageSeconds),
  }));
}

export function bestRememberedPrices(world) {
  const best = {};
  for (const [id, entry] of Object.entries(normalizePriceMemory(world?.priceMemory, world?.time))) {
    if (id === world?.currentSystem) continue;
    for (const { commodity, ...row } of priceRows(world, id, entry)) {
      const previous = best[commodity];
      if (!previous || row.sell > previous.sell || (row.sell === previous.sell && row.at > previous.at)) {
        best[commodity] = row;
      }
    }
  }
  return best;
}
