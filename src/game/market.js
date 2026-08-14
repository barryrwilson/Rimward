import { COMMODITIES, PRICE_BAND, SYSTEMS, HERMIT } from './state.js';

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
 * Exports: initPrices(ctx), tickPrices(ctx, dt), applyEventPressure(ctx, kind, systemId?).
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

export function applyEventPressure(ctx, kind, systemId) {
  const id = ctx.world.currentSystem;
  if (kind === 'clear') {
    // Clear the EVENT's system, not the current one: the player can jump
    // away mid-event, and clearing only the current system leaked the
    // departed system's pressure forever (a hush commodityGlut pinned its
    // provisions dev at the −PRICE_BAND clamp for the rest of the session —
    // surfaced as the wave-9 hermit-walk boot flake, driftH reading 9 from
    // the clamped floor instead of 13). Events predating this stamp (never
    // persisted; module state only) fall back to the old current-system
    // behavior via the ?? below.
    delete pressureBySystem[systemId ?? id];
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
      // Rich deposit floods the market with cheap ore (§8.5). Wave 51: a
      // surface strike also floods the h2 ores a basic head can cut —
      // slagIron and brineIce — but never the h3/h4 exotics; a lucky strike
      // does not put void platinum on the board.
      pressure.rawOre = -0.75;
      pressure.livingRock = 0.4; // miners flush with UU feed their hulls well
      pressure.slagIron = -0.5;
      pressure.brineIce = -0.4;
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
      // Wave 51: the h2/h3 ores crash too, the valuable ones less; and with
      // every miner chasing easy ore, the h4 pair nobody can cut gets
      // scarcer, not cheaper — a small positive pressure.
      pressure.rawOre = -0.6;
      pressure.refinedMetals = 0.35;
      pressure.slagIron = -0.45;
      pressure.brineIce = -0.4;
      pressure.chromeSalt = -0.35;
      pressure.emberglass = -0.32;
      pressure.gildvein = -0.3;
      pressure.voidPlatinum = 0.15;
      pressure.wakeglass = 0.15;
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
  // Wave 9: a hermit system (SYSTEMS[id].hermit) has no traffic — its random
  // walk runs at HERMIT.walkMult rate. Event-pressure pull is untouched.
  const walkMult = SYSTEMS[id]?.hermit ? HERMIT.walkMult : 1;

  for (const key of COMMODITY_KEYS) {
    const base = baselineFor(ctx, id, key);
    let dev = devs[key];
    if (dev === undefined) dev = ((prices[key] ?? Math.round(base)) - base) / base;
    // Mean-reverting random walk (fractional — see devBySystem note).
    dev += (Math.random() - 0.5) * 2 * WALK_RATE * walkMult * dt;
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
