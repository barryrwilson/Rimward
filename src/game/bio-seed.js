import { rankFor } from './state.js';
import {
  grantLivingSeedRow,
  canAcceptPurchase,
  sanitizeHangar,
} from './hangar.js';
import { dockFactionOf, dockReputation } from './shipyard.js';
import { requestAutosave } from './save.js';

/** Owner Wave 82 pirate-seed line. Do not copy the archive data-drop constant. */
export const PIRATE_SEED_DROP_RATE = 0.05;

export const GIFT_HULL_ID = 'hull_seed_gift';
export const PIRATE_SEED_STEM = 'seed_pirate';
export const MARKET_SEED_STEM = 'seed_market';

/** Beautiful Market seed list price. Rank 0. Not a COMMODITIES key. */
export const SEED_MARKET_UU = 40000;

export const GIFT_ARM_LINE = 'The berth answers. Confirm the sworn gift.';
export const GIFT_OK_LINE = 'A living seed rests in the hangar.';
export const GIFT_FULL_LINE = 'The hangar is full.';
export const GIFT_ALREADY_LINE = 'You already carry that gift.';
export const GIFT_NO_LINE = 'No gift.';
export const PIRATE_OK_LINE = 'A living seed is yours. It waits in the hangar.';
export const SEED_ARM_LINE = 'A living seed for the hangar. Confirm papers.';
export const SEED_OK_LINE = 'A living seed rests in the hangar.';

function hullsOf(ctx) {
  const hulls = ctx?.world?.hangar?.hulls;
  return Array.isArray(hulls) ? hulls : null;
}

export function giftNoticeFor(result) {
  if (result && result.ok === true) return GIFT_OK_LINE;
  if (result && result.reason === 'full') return GIFT_FULL_LINE;
  if (result && result.reason === 'already') return GIFT_ALREADY_LINE;
  return GIFT_NO_LINE;
}

/** UI hide is not a grant gate. Helper re-checks dock, banner, rank, cap. */
export function isSwornGiftVisible(ctx) {
  if (dockFactionOf(ctx) !== 'beautiful') return false;
  const rep = dockReputation(ctx, 'beautiful');
  if (typeof rep !== 'number' || !Number.isFinite(rep) || rep < 0) return false;
  return rankFor(rep).min >= 50;
}

function giftGates(ctx) {
  if (!ctx?.flags?.docked) return { ok: false, reason: 'denied' };
  if (dockFactionOf(ctx) !== 'beautiful') return { ok: false, reason: 'denied' };
  const rep = dockReputation(ctx, 'beautiful');
  if (typeof rep !== 'number' || !Number.isFinite(rep) || rep < 0) {
    return { ok: false, reason: 'denied' };
  }
  if (rankFor(rep).min < 50) return { ok: false, reason: 'denied' };
  sanitizeHangar(ctx);
  const hulls = hullsOf(ctx);
  if (!hulls) return { ok: false, reason: 'full' };
  if (hulls.some((row) => row && row.id === GIFT_HULL_ID)) {
    return { ok: false, reason: 'already' };
  }
  if (!canAcceptPurchase(ctx)) return { ok: false, reason: 'full' };
  return { ok: true };
}

/** Sworn gift. Price 0. Does not remount. Does not write player.hullKind. */
export function grantSwornGift(ctx) {
  const gate = giftGates(ctx);
  if (!gate.ok) return gate;
  return grantLivingSeedRow(ctx, { id: GIFT_HULL_ID });
}

export function seedNoticeFor(result) {
  if (result && result.ok === true) return SEED_OK_LINE;
  if (result && result.reason === 'full') return GIFT_FULL_LINE;
  if (result && result.reason === 'credits') return 'Not enough credits.';
  return 'No sale.';
}

/** Rank 0. Hostile Beautiful hides the Offer. Hangar cap still gates Confirm. */
export function isMarketSeedVisible(ctx) {
  if (dockFactionOf(ctx) !== 'beautiful') return false;
  const rep = dockReputation(ctx, 'beautiful');
  if (typeof rep !== 'number' || !Number.isFinite(rep) || rep < 0) return false;
  return true;
}

function marketSeedGates(ctx) {
  if (!ctx?.flags?.docked) return { ok: false, reason: 'dock' };
  if (dockFactionOf(ctx) !== 'beautiful') return { ok: false, reason: 'denied' };
  const rep = dockReputation(ctx, 'beautiful');
  if (typeof rep !== 'number' || !Number.isFinite(rep) || rep < 0) {
    return { ok: false, reason: 'reputation' };
  }
  sanitizeHangar(ctx);
  if (!canAcceptPurchase(ctx)) return { ok: false, reason: 'full' };
  const price = SEED_MARKET_UU;
  if (!Number.isInteger(price) || price < 0) return { ok: false, reason: 'credits' };
  const credits = ctx.world?.credits;
  if (typeof credits !== 'number' || !Number.isFinite(credits) || credits < price) {
    return { ok: false, reason: 'credits' };
  }
  return { ok: true, price, credits };
}

let seedInFlight = false;

function grantMarketSeedUnlocked(ctx) {
  const gate = marketSeedGates(ctx);
  if (!gate.ok) return gate;
  const mountedId = ctx.world?.hangar?.mountedId;
  const result = grantLivingSeedRow(ctx, { stem: MARKET_SEED_STEM });
  if (!result.ok) return result;
  const row = result.row;
  if (!row || typeof row.id !== 'string'
    || row.id === GIFT_HULL_ID
    || row.id.indexOf('hull_seed_market_') !== 0
    || row.hullKind !== 'living'
    || row.classKey !== 'light'
    || row.faction !== 'beautiful') {
    return { ok: false, reason: 'invalid' };
  }
  if (ctx.world.hangar.mountedId !== mountedId) ctx.world.hangar.mountedId = mountedId;
  ctx.world.credits = gate.credits - gate.price;
  if (!(ctx.world.credits >= 0)) ctx.world.credits = 0;
  requestAutosave(ctx);
  return { ok: true, price: gate.price, row };
}

/** Beautiful Market seed. Flat list price. Does not remount. Repeat until cap 8. */
export function grantMarketSeed(ctx) {
  if (seedInFlight) return { ok: false, reason: 'busy' };
  seedInFlight = true;
  try {
    return grantMarketSeedUnlocked(ctx);
  } finally {
    seedInFlight = false;
  }
}

function pirateRateOk() {
  return typeof PIRATE_SEED_DROP_RATE === 'number'
    && Number.isFinite(PIRATE_SEED_DROP_RATE)
    && PIRATE_SEED_DROP_RATE > 0
    && PIRATE_SEED_DROP_RATE <= 1;
}

function lastAttackerIsPlayer(live) {
  return live?.ai?.lastAttacker === 'player';
}

function beautifulShipFaction(live) {
  const rec = live && live.record;
  if (rec && typeof rec === 'object' && !Array.isArray(rec)
    && Object.prototype.hasOwnProperty.call(rec, 'faction')
    && rec.faction === 'beautiful') {
    return 'beautiful';
  }
  const st = live && live.state;
  if (st && typeof st === 'object' && !Array.isArray(st)
    && Object.prototype.hasOwnProperty.call(st, 'faction')
    && st.faction === 'beautiful') {
    return 'beautiful';
  }
  return null;
}

function emitPirateLine(ctx, text) {
  if (!ctx || typeof ctx.emit !== 'function') return;
  ctx.emit('commLine', { text, from: 'echo' });
}

function rollPirate(rng) {
  const fn = typeof rng === 'function' ? rng : Math.random;
  let n;
  try { n = fn(); } catch { return false; }
  if (typeof n !== 'number' || !Number.isFinite(n)) return false;
  return n < PIRATE_SEED_DROP_RATE;
}

/**
 * Rare living seed from player piracy of a Beautiful ship.
 * opts.rng is for pins. Missed rolls stay silent. Hangar full toasts.
 */
export function maybeGrantPirateSeed(ctx, live, opts) {
  if (!ctx?.world || !live) return { ok: false, reason: 'silent' };
  if (live.ai && live.ai.pirateSeedRolled === true) {
    return { ok: false, reason: 'silent' };
  }
  if (!lastAttackerIsPlayer(live)) return { ok: false, reason: 'silent' };
  if (beautifulShipFaction(live) !== 'beautiful') return { ok: false, reason: 'silent' };
  const recFac = live.record && live.record.faction;
  const stFac = live.state && live.state.faction;
  if (recFac === 'unknowables' || stFac === 'unknowables') {
    return { ok: false, reason: 'silent' };
  }
  if (live.role === 'station' || live.kind === 'station') {
    return { ok: false, reason: 'silent' };
  }
  if (!pirateRateOk()) return { ok: false, reason: 'silent' };

  if (live.ai) live.ai.pirateSeedRolled = true;
  const rng = opts && Object.prototype.hasOwnProperty.call(opts, 'rng') ? opts.rng : undefined;
  if (!rollPirate(rng)) return { ok: false, reason: 'silent' };

  sanitizeHangar(ctx);
  if (!canAcceptPurchase(ctx)) {
    emitPirateLine(ctx, GIFT_FULL_LINE);
    return { ok: false, reason: 'full' };
  }

  const result = grantLivingSeedRow(ctx, { stem: PIRATE_SEED_STEM });
  if (!result.ok) {
    if (result.reason === 'full') emitPirateLine(ctx, GIFT_FULL_LINE);
    return { ok: false, reason: result.reason === 'full' ? 'full' : 'silent' };
  }
  const row = result.row;
  if (!row || row.id === GIFT_HULL_ID || typeof row.id !== 'string'
    || row.id.indexOf('hull_seed_pirate_') !== 0
    || row.hullKind !== 'living' || row.classKey !== 'light') {
    return { ok: false, reason: 'silent' };
  }
  emitPirateLine(ctx, PIRATE_OK_LINE);
  return { ok: true, row };
}
