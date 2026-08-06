import { COMMODITIES, PRICE_BAND } from './state.js';

/**
 * Market — per-system commodity prices (doc §8.4, §9.3, §10.1, §15).
 *
 * Each star system has its own price table in ctx.world.markets[systemId].
 * Tables are built lazily from SYSTEMS[id].priceBase × COMMODITIES.base, so
 * the arbitrage spread is real: provisions baseline 100 UU at Freehold
 * Landing, 135 UU at Veridian Spire (§10.1 — buy low here, sell high there).
 *
 * ctx.world.prices is a LIVE REFERENCE to the current system's table
 * (markets[ctx.world.currentSystem]); station.js and hail/npc cargo math keep
 * reading ctx.world.prices unchanged. tickPrices rebinds the reference when a
 * 'systemLoaded' event appears in ctx.lastEvents (jump.js → gate travel).
 *
 * Each table does a slow mean-reverting random walk pulled by event pressure,
 * clamped inside ±PRICE_BAND (±40%) of its SYSTEM baseline (not the global
 * COMMODITIES.base). Only the CURRENT system's table walks — the other
 * system's prices freeze while you're away and resume on return, which is the
 * correct continuation. Pressure is transient per-system module state: after
 * a load, prices resume walking from their restored values.
 *
 * Exports: initPrices(ctx), tickPrices(ctx, dt), applyEventPressure(ctx, kind).
 * world.js wires init/tick into its update loop. update path allocates nothing.
 */

// Random-walk rate: max ~4% baseline drift per second of noise.
const WALK_RATE = 0.008;
// How strongly an active event pulls prices toward its target deviation.
const PRESSURE_PULL = 0.06;
// Throttle for 'marketShift' chatter so hud.js isn't spammed.
const SHIFT_INTERVAL = 30;
const SHIFT_THRESHOLD = 0.15; // |deviation| from baseline that counts as a shift

const COMMODITY_KEYS = Object.keys(COMMODITIES);

// systemId → commodity → target deviation as a fraction of PRICE_BAND (-1..1).
// Written by applyEventPressure, read by tickPrices. Zero/missing = no pull.
// Transient: events are of-the-moment; restored games re-roll them.
const pressureBySystem = {};

// systemId → commodity → current fractional deviation from system baseline.
// Prices are stored as rounded integers, but per-tick walk/pull steps are
// sub-1 UU — recomputing deviation from the rounded price would round every
// step back to zero and pin the market forever. The fractional state keeps
// the walk honest; it rehydrates from restored prices after a load.
const devBySystem = {};

let lastShiftAt = -1e9;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** System-adjusted baseline for a commodity (SYSTEMS[id].priceBase × base). */
function baselineFor(ctx, systemId, key) {
  const mult = ctx.systems?.[systemId]?.priceBase?.[key] ?? 1;
  return COMMODITIES[key].base * mult;
}

function buildTable(ctx, systemId) {
  const table = {};
  for (const key of COMMODITY_KEYS) {
    table[key] = Math.round(baselineFor(ctx, systemId, key));
  }
  return table;
}

/** Ensure the per-system table exists (lazily built from the system def). */
function ensureMarket(ctx, systemId) {
  const markets = (ctx.world.markets ??= {});
  if (!markets[systemId]) markets[systemId] = buildTable(ctx, systemId);
  return markets[systemId];
}

export function initPrices(ctx) {
  const id = ctx.world.currentSystem;
  const markets = (ctx.world.markets ??= {});
  if (!markets[id]) {
    // Legacy save: a bare world.prices with no markets — adopt the restored
    // values as the current system's table so the drift isn't lost.
    const restored = ctx.world.prices;
    if (restored && COMMODITY_KEYS.some((k) => typeof restored[k] === 'number')) {
      const adopted = buildTable(ctx, id);
      for (const key of COMMODITY_KEYS) {
        if (typeof restored[key] === 'number') adopted[key] = restored[key];
      }
      markets[id] = adopted;
    } else {
      markets[id] = buildTable(ctx, id);
    }
  }
  ctx.world.prices = markets[id];
}

export function applyEventPressure(ctx, kind) {
  const id = ctx.world.currentSystem;
  if (kind === 'clear') {
    delete pressureBySystem[id];
    return;
  }
  const pressure = (pressureBySystem[id] ??= {});
  switch (kind) {
    case 'pirateBlockade':
      // Lane choked: everything that moves by ship costs more (§8.5).
      pressure.provisions = 0.6;
      pressure.refinedMetals = 0.6;
      pressure.restrictedComponents = 0.5;
      break;
    case 'strikeRush':
      // Rich deposit floods the market with cheap ore (§8.5).
      pressure.rawOre = -0.75;
      pressure.livingRock = 0.4; // miners flush with UU feed their hulls well
      break;
    case 'laborStrike':
      // Station trade volume down: staples scarce, metals pile up unsold.
      pressure.provisions = 0.85;
      pressure.refinedMetals = -0.3;
      break;
    case 'convoySurge':
      // Convoy floods the market: staples cheap, metals dip on oversupply.
      pressure.provisions = -0.5;
      pressure.refinedMetals = -0.2;
      break;
    case 'oreRush':
      // Miners flood the market: ore crashes, smelted metals ride the boom.
      pressure.rawOre = -0.6;
      pressure.refinedMetals = 0.35;
      break;
    case 'commodityGlut': {
      // One commodity crashes toward the -40% floor; chosen at event start.
      pressure[COMMODITY_KEYS[(Math.random() * COMMODITY_KEYS.length) | 0]] = -1;
      break;
    }
    default:
      break;
  }
}

export function tickPrices(ctx, dt) {
  // Rebind the live table on system swap (jump.js emits 'systemLoaded';
  // consumed a frame later via lastEvents like every other module).
  for (const ev of ctx.lastEvents) {
    if (ev.type === 'systemLoaded' && ev.to) {
      ctx.world.prices = ensureMarket(ctx, ev.to);
    }
  }

  const id = ctx.world.currentSystem;
  const prices = ctx.world.prices ?? (ctx.world.prices = ensureMarket(ctx, id));
  const pressure = pressureBySystem[id];
  const devs = (devBySystem[id] ??= {});
  const now = ctx.world.time;

  for (const key of COMMODITY_KEYS) {
    const base = baselineFor(ctx, id, key);
    let dev = devs[key];
    if (dev === undefined) dev = ((prices[key] ?? Math.round(base)) - base) / base;
    // Mean-reverting random walk (fractional — see devBySystem note).
    dev += (Math.random() - 0.5) * 2 * WALK_RATE * dt;
    // Event pressure pull.
    const target = (pressure?.[key] ?? 0) * PRICE_BAND;
    dev += (target - dev) * PRESSURE_PULL * dt;
    dev = clamp(dev, -PRICE_BAND, PRICE_BAND);
    devs[key] = dev;
    prices[key] = Math.round(base * (1 + dev));
  }

  // Occasional marketShift signal when anything has moved meaningfully.
  if (now - lastShiftAt >= SHIFT_INTERVAL) {
    for (const key of COMMODITY_KEYS) {
      if (Math.abs(devs[key] ?? 0) >= SHIFT_THRESHOLD) {
        lastShiftAt = now;
        ctx.emit('marketShift', {});
        break;
      }
    }
  }
}
