import { ECON, PRIZE, SHIP_CLASSES } from './state.js';
import { TRAFFIC_LIST_UU } from './trafficking.js';
import { creditRecord, fenceHaul } from './pirate-haul.js';

/**
 * Prizes (issue #147) — the record-side half of "a pirate may take the crew
 * and the hull of a yielded trader": the choice roll, the captives row, the
 * hull prize a pirate carries to the fence, the sale of both, and the
 * save-time sanitizer for the one persisted field this adds (`rec.prize`).
 * The flying — the heave-to, the boarding hold, the break-off — lives in
 * npc.js beside the hunt loop; nothing here touches a live hull or a mesh.
 *
 * Persistence contract: captives are ONE wave-60 survivor row on the
 * pirate's own manifest (`rec.cargo`, the array the live state holds), so
 * they ride a cull, a save/restore and the cross-system fold with no new
 * bookkeeping and save.js's existing cargo sanitizer already knows the
 * shape. The hull prize is `rec.prize = { v, id, name, classKey, takenAt,
 * system }`, JSON-plain, sanitized below; a pirate carries at most one.
 */

export const PRIZE_CHOICES = Object.freeze(['cargo', 'crew', 'hull']);
/** How a pirate likes to be paid: rolled once per record, persisted as rec.taste. */
export const PRIZE_TASTES = Object.freeze(['cargo', 'crew', 'hull']);
export const PRIZE_VERSION = 1;

const STRING_MAX = 64;
const SURVIVOR = 'survivor';

function fin(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** The record's persisted greed, healed exactly as playerInterestChance heals it. */
function temperOf(rec, rand) {
  if (rec && !fin(rec.temper)) rec.temper = rand();
  return rec && fin(rec.temper) ? clamp01(rec.temper) : 0.5;
}

/** Roll a taste from PRIZE.tasteWeights; `r` is 0..1. */
export function rollTaste(r) {
  const w = PRIZE.tasteWeights;
  let total = 0;
  for (let i = 0; i < PRIZE_TASTES.length; i++) total += w[PRIZE_TASTES[i]] ?? 0;
  let x = (fin(r) ? clamp01(r) : 0) * total;
  for (let i = 0; i < PRIZE_TASTES.length; i++) {
    const k = PRIZE_TASTES[i];
    x -= w[k] ?? 0;
    if (x < 0) return k;
  }
  return 'cargo';
}

/**
 * The record's persisted taste — rolled once ever (lazy, like temper) so an
 * old save's pirate gets one on first sight; a hand-edited unknown value
 * re-rolls instead of failing.
 */
export function tasteOf(rec, rand = Math.random) {
  if (!rec || typeof rec !== 'object') return 'cargo';
  if (!PRIZE_TASTES.includes(rec.taste)) rec.taste = rollTaste(rand());
  return rec.taste;
}

/** Chances for a taste and temper: { hull, crew } — the rest is cargo only. */
export function prizeOdds(temper, taste = 'cargo') {
  const t = clamp01(fin(temper) ? temper : 0.5);
  const row = PRIZE.odds[PRIZE_TASTES.includes(taste) ? taste : 'cargo'];
  const hull = clamp01(row.hull[0] + t * row.hull[1]);
  const crew = clamp01(row.crew[0] + t * row.crew[1]);
  return { hull, crew: Math.min(crew, 1 - hull) };
}

/**
 * Roll the pirate's choice once, from its persisted taste and temper. `r`
 * below `hull` takes the hull, below `hull + crew` takes the crew, else cargo
 * only. A pirate already carrying a hull prize never takes a second (the
 * fence sells one); a pirate with no room for a captive takes cargo only.
 */
export function rollPrizeChoice(rec, opts = {}, rand = Math.random) {
  const odds = prizeOdds(temperOf(rec, rand), tasteOf(rec, rand));
  const r = rand();
  let choice = 'cargo';
  if (fin(r)) {
    if (r < odds.hull) choice = 'hull';
    else if (r < odds.hull + odds.crew) choice = 'crew';
  }
  if (choice === 'hull' && (prizeOf(rec) || opts.hullAllowed === false)) choice = 'crew';
  if (choice === 'crew' && opts.captiveRoom === false) choice = 'cargo';
  return choice;
}

/**
 * Is this yielded trader record a prize anyone may take? A named quarry —
 * a hull some posted job names as its target — is excluded so jobs stay
 * solvable (the issue's open question, decided closed). A hull with no
 * conventional crew (Unknowables) cannot be boarded.
 */
export function prizeEligible(ctx, rec) {
  if (!rec || typeof rec !== 'object') return false;
  if (rec.state === 'dead' || rec.state === 'captured' || rec.state === 'inTransit' || rec.state === 'derelict') return false;
  if (typeof rec.faction !== 'string' || rec.faction === 'unknowables') return false;
  if (isJobQuarry(ctx, rec)) return false;
  return true;
}

/** True when any posted or accepted job names this record as its target. */
export function isJobQuarry(ctx, rec) {
  const jobs = ctx && ctx.world && ctx.world.jobs;
  if (!Array.isArray(jobs) || !rec) return false;
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (!j || j.state === 'completed' || j.state === 'failed' || j.state === 'expired') continue;
    if (typeof rec.id === 'string' && (j.targetId === rec.id || j.quarryId === rec.id)) return true;
    if (typeof rec.name === 'string' && rec.name.length > 0 && j.target === rec.name) return true;
  }
  return false;
}

/** The captives row for a boarded trader: the wave-60 survivor row shape. */
export function captivesRowFor(rec) {
  if (!rec || typeof rec.faction !== 'string' || rec.faction === 'unknowables') return null;
  const row = { commodity: SURVIVOR, units: 1, faction: rec.faction, source: 'other' };
  if (typeof rec.name === 'string' && rec.name.length > 0) row.name = rec.name.slice(0, STRING_MAX);
  return row;
}

/** Captive heads aboard a record. */
export function captivesAboard(cargo) {
  if (!Array.isArray(cargo)) return 0;
  let n = 0;
  for (let i = 0; i < cargo.length; i++) {
    const row = cargo[i];
    if (row && row.commodity === SURVIVOR && fin(row.units) && row.units > 0) n += Math.floor(row.units);
  }
  return n;
}

/** The hull prize this record carries, or null. */
export function prizeOf(rec) {
  const p = rec && rec.prize;
  return p && typeof p === 'object' && !Array.isArray(p) ? p : null;
}

/** Book value of a hull as a prize, from the class table alone. */
export function hullPrizeValue(classKey) {
  const cls = Object.hasOwn(SHIP_CLASSES, classKey) ? SHIP_CLASSES[classKey] : SHIP_CLASSES.light;
  const body = (cls.hull ?? 0) + (cls.shield ?? 0) + (cls.engine ?? 0);
  return Math.max(0, Math.round(body * PRIZE.hullValueMult + (cls.cargo ?? 0) * PRIZE.hullCargoMult));
}

/**
 * Put a captured trader's hull on the pirate's record. The trader record
 * takes the existing terminal word ('captured'): traffic retires the live
 * hull, world.js never advances or migrates it again — it leaves the finite
 * population. Returns the prize blob, or null when either side refuses.
 */
export function takePrizeHull(pirateRec, traderRec, now, systemId) {
  if (!pirateRec || !traderRec || prizeOf(pirateRec)) return null;
  if (traderRec.state === 'dead' || traderRec.state === 'captured' || traderRec.state === 'inTransit') return null;
  const classKey = Object.hasOwn(SHIP_CLASSES, traderRec.classKey) ? traderRec.classKey : 'light';
  const p = {
    v: PRIZE_VERSION,
    id: typeof traderRec.id === 'string' ? traderRec.id.slice(0, STRING_MAX) : null,
    name: typeof traderRec.name === 'string' ? traderRec.name.slice(0, STRING_MAX) : null,
    classKey,
    takenAt: fin(now) ? now : 0,
    system: typeof systemId === 'string' ? systemId.slice(0, STRING_MAX) : null,
  };
  traderRec.state = 'captured';
  pirateRec.prize = p;
  return p;
}

/** True when the pirate has anything a fence pays for beyond a heavy hold. */
export function owesPrizeFence(rec) {
  return !!rec && (prizeOf(rec) !== null || captivesAboard(rec.cargo) > 0);
}

/** One laundering rate, rolled per sale inside ECON.hotHullFence. */
export function rollHullRate(rand = Math.random) {
  const [lo, hi] = ECON.hotHullFence;
  const r = lo + (hi - lo) * rand();
  return fin(r) ? Math.min(hi, Math.max(lo, r)) : lo;
}

/**
 * Sell the captives aboard. At a Gilded Chain station the Chain pays its
 * list (TRAFFIC_LIST_UU.other per head, the wave-66 table); anywhere else
 * the pirate ransoms them at PRIZE.captiveRansom per head. Every survivor
 * row leaves the manifest. Returns { captives, credits }.
 */
export function sellCaptives(rec, stationFaction) {
  const out = { captives: 0, credits: 0 };
  if (!rec || !Array.isArray(rec.cargo)) return out;
  const heads = captivesAboard(rec.cargo);
  if (heads === 0) return out;
  const per = stationFaction === 'gilded' ? TRAFFIC_LIST_UU.other : PRIZE.captiveRansom;
  const keep = [];
  for (let i = 0; i < rec.cargo.length; i++) {
    const row = rec.cargo[i];
    if (!(row && row.commodity === SURVIVOR)) keep.push(row);
  }
  rec.cargo.length = 0;
  for (let i = 0; i < keep.length; i++) rec.cargo.push(keep[i]);
  out.captives = heads;
  out.credits = Math.max(0, Math.round(per * heads));
  creditRecord(rec, out.credits);
  return out;
}

/** Sell the hull prize, if any: round(hullPrizeValue × rate). Returns { hull, credits }. */
export function sellPrizeHull(rec, rate = rollHullRate()) {
  const out = { hull: null, credits: 0 };
  const p = prizeOf(rec);
  if (!p) return out;
  out.hull = { id: p.id, name: p.name, classKey: p.classKey };
  out.credits = Math.max(0, Math.round(hullPrizeValue(p.classKey) * rate));
  delete rec.prize;
  creditRecord(rec, out.credits);
  return out;
}

/**
 * The whole sale at one station: market goods (issue #151 fenceHaul), then
 * captives, then the hull prize. Returns the combined receipt; `credits` is
 * the total the purse gained.
 */
export function fencePrize(world, rec, systemId, stationFaction) {
  const goods = fenceHaul(world, rec, systemId);
  const captives = sellCaptives(rec, stationFaction);
  const hull = sellPrizeHull(rec);
  return {
    units: goods.units,
    captives: captives.captives,
    hull: hull.hull,
    credits: goods.credits + captives.credits + hull.credits,
  };
}

/**
 * Save-time heal (save.js): a prize that is not a well-formed blob is
 * dropped, never adopted; strings are bounded; an unknown class falls back
 * to light. Absent stays absent — a legacy record simply carries no prize.
 */
export function sanitizePrizeRecord(rec) {
  if (!rec || typeof rec !== 'object') return false;
  // The taste is a closed word: anything else is dropped and re-rolled on first sight.
  if (Object.hasOwn(rec, 'taste') && !PRIZE_TASTES.includes(rec.taste)) delete rec.taste;
  if (!Object.hasOwn(rec, 'prize')) return false;
  const raw = rec.prize;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.v !== PRIZE_VERSION) {
    delete rec.prize;
    return false;
  }
  rec.prize = {
    v: PRIZE_VERSION,
    id: typeof raw.id === 'string' ? raw.id.slice(0, STRING_MAX) : null,
    name: typeof raw.name === 'string' ? raw.name.slice(0, STRING_MAX) : null,
    classKey: Object.hasOwn(SHIP_CLASSES, raw.classKey) ? raw.classKey : 'light',
    takenAt: fin(raw.takenAt) ? raw.takenAt : 0,
    system: typeof raw.system === 'string' ? raw.system.slice(0, STRING_MAX) : null,
  };
  return true;
}
