import { SYSTEMS, FACTIONS } from './state.js';
import { standingRead } from './data-trade.js';
import { applyAbominationStanding } from './hangar.js';

export const RESTITUTION_UU = 1200;

export function offendedFaction(systemId) {
  if (typeof systemId !== 'string' || !Object.hasOwn(SYSTEMS, systemId)) return null;
  const key = SYSTEMS[systemId].faction;
  if (typeof key !== 'string' || !Object.hasOwn(FACTIONS, key)) return null;
  return key;
}

export function restitutionStanding(ctx, systemId) {
  const faction = offendedFaction(systemId);
  if (!faction) return 0;
  return standingRead(ctx?.world?.reputation, faction);
}

function finiteCredits(ctx) {
  const n = ctx?.world?.credits;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export function restitutionOffered(ctx, systemId) {
  if (!ctx?.flags?.docked) return false;
  const faction = offendedFaction(systemId);
  if (!faction) return false;
  if (standingRead(ctx.world?.reputation, faction) >= 0) return false;
  return finiteCredits(ctx) >= RESTITUTION_UU;
}

export function restitutionShort(ctx, systemId) {
  if (!ctx?.flags?.docked) return false;
  const faction = offendedFaction(systemId);
  if (!faction) return false;
  if (standingRead(ctx.world?.reputation, faction) >= 0) return false;
  return finiteCredits(ctx) < RESTITUTION_UU;
}

/**
 * Pay RESTITUTION_UU at the offended dock. Sets that FACTIONS key to 0 if it
 * was negative, then reapplies the graft Beautiful cap.
 */
export function applyRestitution(ctx, systemId) {
  if (!ctx?.flags?.docked) return { ok: false, reason: 'dock' };
  const faction = offendedFaction(systemId);
  if (!faction) return { ok: false, reason: 'faction' };
  if (ctx.world.currentSystem !== systemId) return { ok: false, reason: 'dock' };
  const world = ctx.world;
  if (!world) return { ok: false, reason: 'dock' };
  let bag = world.reputation;
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) {
    bag = {};
    world.reputation = bag;
  }
  const cur = standingRead(bag, faction);
  if (cur >= 0) return { ok: false, reason: 'standing' };
  const credits = finiteCredits(ctx);
  if (credits < RESTITUTION_UU) return { ok: false, reason: 'short' };
  world.credits = credits - RESTITUTION_UU;
  bag[faction] = 0;
  applyAbominationStanding(ctx);
  const line = `Restitution posted — ${RESTITUTION_UU} UU. Standing with the dock flag returns to 0.`;
  if (typeof ctx.emit === 'function') ctx.emit('commLine', { text: line });
  return { ok: true, faction, line };
}
