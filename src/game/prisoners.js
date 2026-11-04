import { FACTIONS } from './state.js';

/**
 * Issue #273 — the employer dock's prisoner desk.
 *
 * A hunt kill drops an escape pod for the quarry's crew (npc.js
 * spawnShipSurvivor -> pods.js spawnSurvivorPod). Wave 60 lets those people go
 * home only at their own faction's People desk (station.js applySurvivorRescue);
 * the Gilded Chain buys them at a fence (trafficking.js applySurvivorSale).
 * Neither outlet sits on the hunter's route, and nothing tied the pod to the
 * contract. This module gives the dock that posted the hunt a way to take the
 * quarry's crew as prisoners for a small fee and standing.
 *
 * The contract tie is read from durable evidence the world already keeps: the
 * quarry's own dead or captured pirate record in this system's record bank
 * (world.js). A player-killed survivor row whose faction owns such a record was
 * crew of a local pirate this dock posted against. No new persisted field, no
 * new save key, no new event: the cargo row keeps its wave-60 shape
 * ({ commodity: 'survivor', units, faction, source, name }) and only the dock's
 * credits and reputation move.
 *
 * No DOM. The People desk copy and button live in station.js renderRescue.
 */

export const PRISONER_HANDOVER = Object.freeze({
  uuPerHead: 60,
  repPerHead: 1,
});

const SURVIVOR_COMMODITY = 'survivor';
const SOURCE_KILL = 'playerKill';

const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

function isSurvivorCargo(row) {
  return !!row && row.commodity === SURVIVOR_COMMODITY;
}

function isFactionKey(value) {
  return typeof value === 'string' && value.length > 0 && !RESERVED_IDS.has(value);
}

function holdCap(ctx) {
  const cap = Number(ctx?.cargoCapacity);
  return Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : 99;
}

/** Same corrupt-row rule as the traffic desk: a row over the hold cap counts 0. */
function survivorUnitCount(row, cap) {
  const n = Number(row?.units);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const u = Math.floor(n);
  return u > cap ? 0 : u;
}

/**
 * The origin system's record bank, read exactly as station.js huntBank reads it:
 * a per-system bank if one exists, else the live current-system records. Never
 * generates a bank.
 */
function originBank(ctx, origin) {
  const world = ctx?.world;
  if (!world || typeof world !== 'object' || Array.isArray(world)) return null;
  if (typeof origin !== 'string' || !origin) return null;
  const banks = world.recordBanks;
  if (banks && typeof banks === 'object' && !Array.isArray(banks)
    && Object.hasOwn(banks, origin) && Array.isArray(banks[origin])) {
    return banks[origin];
  }
  if (world.currentSystem === origin && Array.isArray(world.records)) {
    return world.records;
  }
  return null;
}

/**
 * A local pirate the dock posted against, now broken: ordinary pirate role, no
 * Named Gun, in this system's bank, dead or captured. The ace family stays out
 * of the hunt board (Msn02HuntDesign), so its crew is not a hunt prisoner.
 */
function isQuarryRecord(rec, origin) {
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return false;
  if (rec.role !== 'pirate') return false;
  if (rec.role === 'ace' || rec.classKey === 'ace') return false;
  if (rec.system !== origin) return false;
  if (rec.state !== 'dead' && rec.state !== 'captured') return false;
  return true;
}

/**
 * Factions whose local quarry is dead or captured in the origin bank — the
 * durable evidence that this dock posted against their people.
 */
export function prisonerFactions(ctx, origin) {
  const bank = originBank(ctx, origin);
  if (!bank) return new Set();
  const out = new Set();
  for (let i = 0; i < bank.length; i++) {
    const rec = bank[i];
    if (!isQuarryRecord(rec, origin)) continue;
    const faction = rec.faction;
    if (!isFactionKey(faction)) continue;
    if (!Object.hasOwn(FACTIONS, faction)) continue;
    if (faction === 'unknowables') continue;
    out.add(faction);
  }
  return out;
}

/**
 * Units in the hold the employer dock would take. Player-killed survivors only:
 * the hunt pays on a witnessed player kill, so a crew pod recovered from a hull
 * somebody else broke is a rescue, not a capture.
 */
export function prisonerUnits(ctx, origin) {
  const factions = prisonerFactions(ctx, origin);
  if (factions.size === 0) return 0;
  const cargo = ctx?.cargo;
  if (!Array.isArray(cargo)) return 0;
  const cap = holdCap(ctx);
  let n = 0;
  for (let i = 0; i < cargo.length; i++) {
    const row = cargo[i];
    if (!isSurvivorCargo(row)) continue;
    if (row.source !== SOURCE_KILL) continue;
    if (!factions.has(row.faction)) continue;
    n += survivorUnitCount(row, cap);
  }
  return n;
}

/**
 * Hand the employer dock every eligible prisoner in one action. Mutates the live
 * cargo array in place (the same discipline as removeSurvivorsForFaction) and
 * moves only credits and reputation. Fails closed on a missing world, a
 * non-finite credit balance, an empty eligible set, or a corrupt row set.
 *
 * Returns { faction, count, credits, repDelta, line } or null. The line is the
 * spoken receipt; the caller decides where to show it.
 */
export function applyPrisonerHandover(ctx, origin, dockFaction) {
  const factions = prisonerFactions(ctx, origin);
  if (factions.size === 0) return null;
  const world = ctx?.world;
  if (!world || typeof world !== 'object' || Array.isArray(world)) return null;
  const cargo = ctx?.cargo;
  if (!Array.isArray(cargo)) return null;
  const credits = world.credits;
  if (typeof credits !== 'number' || !Number.isFinite(credits)) return null;
  const cap = holdCap(ctx);
  const keep = [];
  let count = 0;
  for (let i = 0; i < cargo.length; i++) {
    const row = cargo[i];
    if (isSurvivorCargo(row) && row.source === SOURCE_KILL && factions.has(row.faction)) {
      const units = survivorUnitCount(row, cap);
      if (units > 0) {
        count += units;
        continue;
      }
    }
    keep.push(row);
  }
  if (count === 0) return null;
  const total = count * PRISONER_HANDOVER.uuPerHead;
  if (!Number.isFinite(total) || !Number.isFinite(credits + total)) return null;

  cargo.length = 0;
  for (let i = 0; i < keep.length; i++) cargo.push(keep[i]);
  world.credits = credits + total;

  const repDelta = count * PRISONER_HANDOVER.repPerHead;
  let repApplied = 0;
  const bag = world.reputation;
  if (bag && typeof bag === 'object' && !Array.isArray(bag)
    && isFactionKey(dockFaction) && Object.hasOwn(FACTIONS, dockFaction)) {
    const cur = Number(bag[dockFaction]);
    bag[dockFaction] = (Number.isFinite(cur) ? cur : 0) + repDelta;
    repApplied = repDelta;
  }

  const fname = Object.hasOwn(FACTIONS, dockFaction) ? FACTIONS[dockFaction].name : 'the dock';
  const heads = count === 1 ? 'One prisoner' : count + ' prisoners';
  const line = heads + ' handed over. The ' + fname + ' pays ' + total + ' UU'
    + (repApplied > 0 ? ' and remembers — standing +' + repApplied : '') + '.';
  if (typeof ctx?.emit === 'function') {
    ctx.emit('commLine', { text: line, from: 'station' });
  }
  return { faction: dockFaction, count, credits: total, repDelta: repApplied, line };
}
