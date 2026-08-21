import { FACTIONS } from './state.js';
import { standingRead } from './data-trade.js';
import { applyAbominationStanding } from './hangar.js';

/** Owner kill standing integer. Not persisted. */
export const KILL_STANDING_DELTA = -5;

/** Destroy-Abomination Beautiful bonus. Skip when victim faction is already beautiful. */
export const ABOMINATION_DESTROY_BEAUTIFUL_DELTA = 5;

const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

const PIRACY_ROLES = new Set(['trader', 'miner', 'patrol']);

function reservedId(value) {
  return typeof value === 'string' && (RESERVED_IDS.has(value) || value === '__proto__');
}

function ownString(obj, key) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  if (!Object.hasOwn(obj, key)) return undefined;
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}

function isFactionKey(value) {
  return typeof value === 'string' && value.length > 0 && !reservedId(value);
}

function canWriteRep(bag, key) {
  return !!bag
    && typeof bag === 'object'
    && !Array.isArray(bag)
    && isFactionKey(key)
    && Object.hasOwn(FACTIONS, key);
}

function graftedOwnTrue(obj) {
  return !!obj
    && typeof obj === 'object'
    && !Array.isArray(obj)
    && Object.hasOwn(obj, 'grafted')
    && obj.grafted === true;
}

function hangarHasGraft(hangar) {
  if (!hangar || typeof hangar !== 'object' || Array.isArray(hangar)) return false;
  if (graftedOwnTrue(hangar)) return true;
  if (!Object.hasOwn(hangar, 'hulls')) return false;
  const hulls = hangar.hulls;
  if (!Array.isArray(hulls)) return false;
  for (const row of hulls) {
    if (graftedOwnTrue(row)) return true;
  }
  return false;
}

/** Hangar rows or player-style own grafted: true only. */
function victimGrafted(ship) {
  if (!ship || typeof ship !== 'object') return false;
  if (graftedOwnTrue(ship.state)) return true;
  if (graftedOwnTrue(ship.player)) return true;
  if (hangarHasGraft(ship.hangar)) return true;
  const st = ship.state;
  if (st && typeof st === 'object' && !Array.isArray(st) && hangarHasGraft(st.hangar)) {
    return true;
  }
  return false;
}

function applyBeautifulAbominationBonus(bag, victimFaction) {
  if (victimFaction === 'beautiful') return;
  if (!canWriteRep(bag, 'beautiful')) return;
  bag.beautiful = standingRead(bag, 'beautiful') + ABOMINATION_DESTROY_BEAUTIFUL_DELTA;
}

/** Witness is lastAttackerOf === 'player'. Do not use incident causer. */
function playerLastAttacker(ship) {
  const ai = ship && ship.ai;
  if (!ai || typeof ai !== 'object') return false;
  if (!Object.hasOwn(ai, 'lastAttacker')) return false;
  return ai.lastAttacker === 'player';
}

function victimFaction(ship) {
  const raw = ownString(ship.record, 'faction') ?? ownString(ship.state, 'faction');
  if (typeof raw !== 'string' || !raw) return null;
  if (reservedId(raw) || raw === '__proto__') return null;
  if (raw === 'independent') return null;
  if (!Object.hasOwn(FACTIONS, raw)) return null;
  return raw;
}

function victimRole(ship) {
  return ownString(ship.record, 'role') ?? ownString(ship, 'role') ?? ownString(ship.ai, 'role');
}

function skipHuntVictim(ship) {
  const role = victimRole(ship);
  if (role === 'pirate' || role === 'ace') return true;
  const classKey = ownString(ship.record, 'classKey')
    ?? ownString(ship.state, 'classKey')
    ?? ownString(ship, 'classKey');
  if (classKey === 'ace') return true;
  return false;
}

function emitStandingLine(ctx, faction) {
  if (!ctx || typeof ctx.emit !== 'function') return;
  if (!Object.hasOwn(FACTIONS, faction)) return;
  const rec = FACTIONS[faction];
  if (!rec || typeof rec !== 'object' || !Object.hasOwn(rec, 'name')) return;
  const name = rec.name;
  if (typeof name !== 'string' || !name) return;
  if (/[\u0000-\u001f\u007f]/.test(name)) return;
  ctx.emit('commLine', { text: `Standing with ${name} shifted.` });
}

/**
 * Player last-attacker destruction of a civilian/patrol hull.
 * Fail closed while KILL_STANDING_DELTA is not a finite non-zero number.
 * Grafted victims also add Beautiful standing, except Beautiful victims.
 */
export function applyPlayerKillStanding(ctx, ship) {
  if (typeof KILL_STANDING_DELTA !== 'number'
    || !Number.isFinite(KILL_STANDING_DELTA)
    || KILL_STANDING_DELTA === 0) {
    return { ok: false, reason: 'no-delta' };
  }
  const st = ship && ship.state;
  if (!st || typeof st !== 'object' || Array.isArray(st)) {
    return { ok: false, reason: 'skip' };
  }
  if (!Object.hasOwn(st, 'destroyed') || st.destroyed !== true) {
    return { ok: false, reason: 'skip' };
  }
  if (!playerLastAttacker(ship)) {
    return { ok: false, reason: 'skip' };
  }
  if (skipHuntVictim(ship)) {
    return { ok: false, reason: 'skip' };
  }
  const role = victimRole(ship);
  if (!PIRACY_ROLES.has(role)) {
    return { ok: false, reason: 'skip' };
  }
  const faction = victimFaction(ship);
  if (!faction) {
    return { ok: false, reason: 'skip' };
  }
  const world = ctx && ctx.world;
  if (!world) {
    return { ok: false, reason: 'skip' };
  }
  let bag = world.reputation;
  if (bag == null || typeof bag !== 'object' || Array.isArray(bag)) {
    bag = {};
    world.reputation = bag;
  }
  if (!canWriteRep(bag, faction)) {
    return { ok: false, reason: 'skip' };
  }
  const cur = standingRead(bag, faction);
  bag[faction] = cur + KILL_STANDING_DELTA;
  if (victimGrafted(ship)) {
    applyBeautifulAbominationBonus(bag, faction);
  }
  applyAbominationStanding(ctx);
  emitStandingLine(ctx, faction);
  return { ok: true, faction };
}
