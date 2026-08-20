import '../ui/screens.css';
import { createShipState, SHIP_CLASSES, SYSTEMS, FACTIONS, U, JUMP, COMMODITIES, ORE_TYPES } from './state.js';
import {
  sanitizeHangar,
  parkMounted,
  healPlayerHullKind,
  rebuildStarterHangar,
  syncMountedToPlayer,
  syncMountedWeaponMirrors,
  applyMountedFlight,
} from './hangar.js';

/**
 * Save system — localStorage 'rimward-save-v1', {v:1} envelope (doc §4.4).
 *
 * - AUTOSAVE on 'docked'/'undocked' events, on 'systemLoaded' when
 *   JUMP.saveOnJump (gate travel is the dock/undock analog §4.4), and every
 *   60 s idle in space. Consumed via ctx.lastEvents.
 * - SAVE BLOCKED while ctx.gate.jumping (mid-swap state is incoherent — the
 *   'systemLoaded' autosave fires once the jump completes) and during active
 *   encounters: a hostile live ship within U.ENCOUNTER_BUBBLE while the
 *   combat flag is set → emit('saveBlocked', {reason}) and retry in 5 s.
 * - LOAD at init (save.js is constructed second-to-last, after ship/world):
 *   a stored snapshot is restored wholesale — world fields (including
 *   currentSystem, per-system markets, record banks, jumpGraceUntil), cargo,
 *   bio, player state record, ship position/quaternion. When the restored
 *   system differs from the live one, ctx.world.prices is rebound to that
 *   system's market table and 'systemLoaded' is emitted so every module
 *   (station, solarsystem, asteroids, world/traffic, hud) rebuilds into the
 *   saved system on the next frame. Restore also re-adopts any live ships'
 *   record refs into the restored bank (healLiveRecords — live ships can
 *   outlive a restore with orphaned pre-restore record objects) and heals
 *   bank `live` flags, so same-system restores (death recovery, no
 *   'systemLoaded' emit) can't strand a record as never-re-instantiable.
 * - MANUAL SLOTS ("Berth Records", KeyL — SPACE ONLY): three manual slots
 *   beside the autosave, localStorage keys 'rimward-save-v1-slot-1..3' with
 *   the same {v:1} snapshot envelope. KeyL toggles the panel — opens only
 *   while flying (!docked, !paused, not dead; Escape always closes; the
 *   game keeps running underneath). Each row shows its berth's date,
 *   system name, and credits; manual rows get a Save button, every row a
 *   Load button (disabled while the berth is empty or corrupt). Manual
 *   saves share the autosave gating (hostile within the encounter bubble
 *   → 'saveBlocked'), except a mid-jump manual save is refused with a
 *   'Mid-jump — berth record refused.' toast where the autosave stays
 *   silent. The panel closes itself if the ship docks or dies. Boot load
 *   and death recovery still read ONLY the autosave key — manual berths
 *   are only ever restored explicitly from the panel.
 * - TITLE SCREEN (wave 40, src/systems/title.js): queries hasAutosave() to
 *   decide whether to show CONTINUE; a confirmed NEW GAME calls clearAutosave()
 *   then reloads with a sessionStorage marker — manual berths survive this
 *   path, so an explicitly-saved berth is never erased by starting fresh.
 * - DEATH (§4.4): consumes 'playerDestroyed' → 'Ship lost.' overlay → reload
 *   the last save (or a fresh start at the Freehold station with a new player
 *   state record when no save exists). No corpse run, no insurance. Emits the
 *   commLine 'She limped home.' on recovery. The bio companion survives
 *   either path (§ Bio companion): reload-from-save leaves her mood
 *   'anxious'; freshStart keeps her, wounded +0.4, mood 'pained', bond +0.02.
 *
 * The snapshot is pure JSON: world.records/recordBanks/incidents/aftermath/
 * markets must stay JSON-plain (they are — world.js/market.js contract).
 * update() performs no allocation beyond the rare serialize call.
 */

const KEY = 'rimward-save-v1';
const SLOT_KEYS = ['rimward-save-v1-slot-1', 'rimward-save-v1-slot-2', 'rimward-save-v1-slot-3'];
const IDLE_INTERVAL = 60; // s between in-space autosaves
const BLOCK_RETRY = 5; // s before retrying a combat-blocked autosave
const DEATH_HOLD_MS = 2500; // 'Ship lost.' hold before recovery

// Whitelist: only these world fields persist. Anything world.js adds for the
// multi-system swap (recordBanks et al.) must stay JSON-plain to ride along.
// 'mystery' ({found:[clueIds], visited:[landmarkIds]}) is created lazily by
// the mystery module (§25) and persists once present.
export const WORLD_FIELDS = [
  'time', 'credits', 'fear', 'reputation', 'currentSystem', 'markets',
  'recordBanks', 'records', 'incidents', 'aftermath', 'prices',
  'activeEvent', 'milestones', 'jobs', 'scanner', 'shipName',
  'jumpGraceUntil', 'contacts', 'mystery',
  // wave 6: epics {faction:stageCount} (epics.js), origin id (origins.js),
  // onboarding {seen:[hintIds]} (onboarding.js), aceRivalry (world.js ace arc)
  'epics', 'origin', 'onboarding', 'aceRivalry',
  // wave 7: originArc {calls,lastCallAt,debtCleared,collectorSent,...payoff
  // flags} (world.js origin payoff arcs)
  'originArc',
  // wave 30: concealedMounts Q-ship ownership flag (station.js outfitting,
  // §29 hidden-mounts bluff)
  'concealedMounts',
  // wave 51: miningLaser ladder index 0..3 into MINING_LASERS (station.js
  // outfitting; ctx.world.miningLaser is the only writer target)
  'miningLaser',
  // wave 64: magical hangar { mountedId, hulls } — live hull is a row
  'hangar',
  // Write-through mirrors of the mounted row. Restore overwrites from the row.
  'launcher', 'missileAmmo', 'turret',
  // AST: sparse remaining units { [systemId]: { [indexString]: remainingInt } }
  'fieldOre',
];

const SURVIVOR = 'survivor';
export const SAFE_ID = /^[a-z0-9_]+$/i;
export const NAME_MAX = 40;
export const ID_MAX = 64;
const COMMODITY_MAX = 64;
// SAFE_ID matches __proto__; those ids must never become a faction key.
const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);
const FIELD_ORE_INDEX = /^(0|[1-9][0-9]*)$/;
const FIELD_ORE_SYS_CAP = 32;
const FIELD_ORE_MAX_COUNT = 160;
const FIELD_ORE_MAX_REMAINING = 64;
const MINING_SLOTS_PER_SYSTEM = 2;
const JOBS_OVERLAY_HEADROOM = 16;
const JOBS_SANITIZE_MAX = 4
  + MINING_SLOTS_PER_SYSTEM * Object.keys(SYSTEMS).length
  + JOBS_OVERLAY_HEADROOM;
const PAY_QUOTED_MAX = 20000;
const JOB_TITLE_MAX = 240;
const JOB_DETAIL_MAX = 720;
const JOB_KINDS = new Set(['bounty', 'patrol', 'haul', 'ferry', 'recovery', 'mining']);
const JOB_STATES = new Set(['offered', 'accepted', 'done', 'failed']);
const UNIQUE_JOB_KIND = {
  'bounty-ace': 'bounty',
  'patrol-lane': 'patrol',
  'haul-provisions': 'haul',
  'ferry-consignment': 'ferry',
};
const JOB_FIELD_ALLOW = new Set([
  'id', 'kind', 'state', 'title', 'detail', 'reward', 'need', 'progress',
  'originSystem', 'destSystem', 'system', 'payQuoted', 'originPrice',
  'target', 'wreckId', 'collected', 'commodity', 'deadline', 'slot',
]);

function sanitizeFieldOre(ctx) {
  const raw = ctx.world.fieldOre;
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    delete ctx.world.fieldOre;
    return;
  }
  const keep = new Set();
  const cur = ctx.world.currentSystem;
  if (typeof cur === 'string') keep.add(cur);
  const banks = ctx.world.recordBanks;
  if (banks && typeof banks === 'object' && !Array.isArray(banks)) {
    const bk = Object.keys(banks);
    for (let i = 0; i < bk.length; i++) keep.add(bk[i]);
  }
  const out = {};
  const takeSys = (k) => {
    if (Object.keys(out).length >= FIELD_ORE_SYS_CAP) return;
    if (Object.hasOwn(out, k)) return;
    if (RESERVED_IDS.has(k) || k === '__proto__') return;
    if (!Object.hasOwn(SYSTEMS, k)) return;
    const child = Object.hasOwn(raw, k) ? raw[k] : undefined;
    if (child == null || typeof child !== 'object' || Array.isArray(child)) return;
    const def = SYSTEMS[k];
    let maxIdx = FIELD_ORE_MAX_COUNT;
    if (def && def.field && Number.isFinite(def.field.count)) {
      maxIdx = Math.min(Math.max(0, def.field.count | 0), FIELD_ORE_MAX_COUNT);
    }
    const childOut = {};
    const ck = Object.keys(child);
    for (let j = 0; j < ck.length; j++) {
      const ik = ck[j];
      if (RESERVED_IDS.has(ik) || ik === '__proto__') continue;
      if (!FIELD_ORE_INDEX.test(ik)) continue;
      const idx = +ik;
      if (idx < 0 || idx >= maxIdx) continue;
      const v = Object.hasOwn(child, ik) ? child[ik] : undefined;
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > FIELD_ORE_MAX_REMAINING) continue;
      childOut[ik] = v;
    }
    if (Object.keys(childOut).length > 0) out[k] = childOut;
  };
  const keys = Object.keys(raw);
  for (let i = 0; i < keys.length; i++) {
    if (keep.has(keys[i])) takeSys(keys[i]);
  }
  for (let i = 0; i < keys.length; i++) {
    if (!keep.has(keys[i])) takeSys(keys[i]);
  }
  ctx.world.fieldOre = out;
}

function reservedId(value) {
  if (typeof value !== 'string' || !value) return true;
  return RESERVED_IDS.has(value) || RESERVED_IDS.has(value.toLowerCase());
}

/** Hyphen-token job ids. Do not SAFE_ID.test the full string (hyphens on live ids). */
function jobIdTokens(id) {
  if (typeof id !== 'string' || id.length < 1 || id.length > ID_MAX) return null;
  if (id.charAt(0) === '-' || id.charAt(id.length - 1) === '-') return null;
  if (id.includes('--')) return null;
  if (reservedId(id)) return null;
  const tokens = id.split('-');
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t || !SAFE_ID.test(t) || reservedId(t)) return null;
  }
  return tokens;
}

function sanitizeJobSystem(value) {
  if (typeof value !== 'string' || !value || value.length > ID_MAX) return null;
  if (reservedId(value)) return null;
  return Object.hasOwn(SYSTEMS, value) ? value : null;
}

function clampQuoted(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const u = Math.round(value);
  if (u < 0) return 0;
  return u > PAY_QUOTED_MAX ? PAY_QUOTED_MAX : u;
}

function jobText(value, max) {
  if (typeof value !== 'string') return null;
  const cleaned = stripControlChars(value).trim().slice(0, max);
  return cleaned || null;
}

function uniqueJobId(id) {
  return Object.hasOwn(UNIQUE_JOB_KIND, id);
}

function miningNFromId(id) {
  const parts = id.split('-');
  return +parts[parts.length - 1];
}

function sanitizeOneJob(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const keys = Object.keys(raw);
  const src = {};
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (reservedId(k) || k === '__proto__') continue;
    if (!JOB_FIELD_ALLOW.has(k)) continue;
    if (!Object.hasOwn(raw, k)) continue;
    src[k] = raw[k];
  }
  const kind = src.kind;
  const state = src.state;
  if (!JOB_KINDS.has(kind) || !JOB_STATES.has(state)) return null;
  const tokens = jobIdTokens(src.id);
  if (!tokens) return null;
  const id = src.id;
  if (uniqueJobId(id)) {
    if (UNIQUE_JOB_KIND[id] !== kind) return null;
  } else if (kind === 'mining') {
    if (tokens.length !== 3 || tokens[0] !== 'mine') return null;
    if (!Object.hasOwn(SYSTEMS, tokens[1])) return null;
    if (!FIELD_ORE_INDEX.test(tokens[2])) return null;
  } else if (kind === 'bounty') {
    if (!id.startsWith('bounty-pirate-') || tokens.length < 3) return null;
  } else if (kind === 'recovery') {
    if (!id.startsWith('recovery-') || tokens.length < 2) return null;
  } else {
    return null;
  }
  const title = jobText(src.title, JOB_TITLE_MAX);
  const detail = jobText(src.detail, JOB_DETAIL_MAX);
  if (!title || !detail) return null;
  const reward = src.reward;
  const need = src.need;
  const progress = src.progress;
  if (typeof reward !== 'number' || !Number.isFinite(reward)) return null;
  if (typeof need !== 'number' || !Number.isFinite(need) || need < 1) return null;
  if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0) return null;
  const job = {
    id,
    kind,
    state,
    title,
    detail,
    reward,
    need,
    progress: progress > need ? need : progress,
  };
  const origin = src.originSystem === undefined ? undefined : sanitizeJobSystem(src.originSystem);
  const dest = src.destSystem === undefined ? undefined : sanitizeJobSystem(src.destSystem);
  const system = src.system === undefined ? undefined : sanitizeJobSystem(src.system);
  if (kind === 'mining') {
    if (origin !== tokens[1]) return null;
    if (src.slot !== 0 && src.slot !== 1) return null;
    if (!Number.isInteger(src.slot)) return null;
    const commodity = src.commodity;
    if (typeof commodity !== 'string' || reservedId(commodity)) return null;
    if (!Object.hasOwn(ORE_TYPES, commodity) || !Object.hasOwn(COMMODITIES, commodity)) return null;
    job.originSystem = origin;
    job.slot = src.slot;
    job.commodity = commodity;
  } else if (kind === 'recovery') {
    if (!origin) return null;
    const wreckRaw = typeof src.wreckId === 'string' ? stripControlChars(src.wreckId).trim().slice(0, ID_MAX) : '';
    if (!jobIdTokens(wreckRaw)) return null;
    if (src.collected !== undefined && typeof src.collected !== 'boolean') return null;
    job.originSystem = origin;
    job.wreckId = wreckRaw;
    job.collected = src.collected === true;
  } else if (kind === 'bounty' && !uniqueJobId(id)) {
    if (!system) return null;
    job.system = system;
  }
  if (kind !== 'mining' && origin) job.originSystem = origin;
  if (dest) job.destSystem = dest;
  if (kind !== 'bounty' || uniqueJobId(id)) {
    if (system && !job.system) job.system = system;
  }
  if (kind === 'bounty') {
    const target = jobText(src.target, NAME_MAX);
    if (!target) return null;
    job.target = target;
  }
  if (src.payQuoted !== undefined) {
    const pay = clampQuoted(src.payQuoted);
    if (pay !== null) job.payQuoted = pay;
  }
  if (src.originPrice !== undefined) {
    const price = clampQuoted(src.originPrice);
    if (price !== null) job.originPrice = price;
  }
  if (src.deadline !== undefined) {
    const d = src.deadline;
    if (typeof d === 'number' && Number.isFinite(d) && d >= 0) job.deadline = d;
  }
  return job;
}

function extraOfferedMining(jobs) {
  const extra = new Set();
  const bySysSlot = new Map();
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (j.kind !== 'mining') continue;
    if (j.state !== 'offered' && j.state !== 'accepted') continue;
    const key = j.originSystem + '\0' + j.slot;
    let list = bySysSlot.get(key);
    if (!list) {
      list = [];
      bySysSlot.set(key, list);
    }
    list.push(j);
  }
  const keys = [];
  bySysSlot.forEach((_list, key) => { keys.push(key); });
  for (let k = 0; k < keys.length; k++) {
    const list = bySysSlot.get(keys[k]);
    list.sort((a, b) => miningNFromId(a.id) - miningNFromId(b.id));
    for (let i = 1; i < list.length; i++) {
      if (list[i].state !== 'accepted') extra.add(list[i]);
    }
  }
  return extra;
}

function dropJobsUntilCap(jobs, canDrop) {
  if (jobs.length <= JOBS_SANITIZE_MAX) return jobs;
  let extra = jobs.length - JOBS_SANITIZE_MAX;
  const out = [];
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (extra > 0 && canDrop(j)) {
      extra -= 1;
      continue;
    }
    out.push(j);
  }
  return out;
}

function sanitizeJobs(ctx) {
  const raw = ctx.world.jobs;
  if (!Array.isArray(raw)) {
    ctx.world.jobs = [];
    return;
  }
  const out = [];
  const seen = new Set();
  for (let i = 0; i < raw.length; i++) {
    const job = sanitizeOneJob(raw[i]);
    if (!job) continue;
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    out.push(job);
  }
  const extras = extraOfferedMining(out);
  let jobs = dropJobsUntilCap(out, (j) => extras.has(j) && !uniqueJobId(j.id) && j.state !== 'accepted');
  jobs = dropJobsUntilCap(jobs, (j) => (
    j.kind === 'mining' && (j.state === 'done' || j.state === 'failed') && !uniqueJobId(j.id)
  ));
  jobs = dropJobsUntilCap(jobs, (j) => {
    if (uniqueJobId(j.id) || j.state === 'accepted') return false;
    if (j.kind === 'recovery' && j.state === 'done') return true;
    if (j.kind === 'bounty' && j.id.startsWith('bounty-pirate-') && j.state === 'done') return true;
    return false;
  });
  const cur = ctx.world.currentSystem;
  jobs = dropJobsUntilCap(jobs, (j) => {
    if (uniqueJobId(j.id) || j.state === 'accepted') return false;
    if (j.kind === 'mining' && j.state === 'offered' && !extras.has(j)) return false;
    if (j.kind === 'bounty' && j.id.startsWith('bounty-pirate-') && j.state === 'offered') {
      return j.system !== cur;
    }
    if (j.kind === 'recovery' && j.state === 'offered') return j.originSystem !== cur;
    return false;
  });
  ctx.world.jobs = jobs;
}

export function stripControlChars(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 32 || code === 127 || (code >= 128 && code <= 159)) continue;
    if ((code >= 0x200B && code <= 0x200F) || (code >= 0x202A && code <= 0x202E)
        || (code >= 0x2060 && code <= 0x2064) || (code >= 0x2066 && code <= 0x206F)
        || code === 0xFEFF) continue;
    out += s[i];
  }
  return out;
}

function sanitizeUnits(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  const u = Math.trunc(n);
  if (u < 0) return 0;
  return u > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : u;
}

export function sanitizeFaction(value) {
  if (typeof value !== 'string' || !value || value.length > ID_MAX) return null;
  if (RESERVED_IDS.has(value)) return null;
  if (Object.prototype.hasOwnProperty.call(FACTIONS, value)
      || Object.prototype.hasOwnProperty.call(SYSTEMS, value)) {
    return value;
  }
  return SAFE_ID.test(value) ? value : null;
}

function sanitizeSurvivorName(value) {
  if (typeof value !== 'string') return null;
  const cleaned = stripControlChars(value).trim().slice(0, NAME_MAX);
  return cleaned || null;
}

/** JSON-plain cargo row. Ordinary goods stay {commodity, units}; survivors keep faction/source/name. */
function sanitizeCargoRow(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (typeof raw.commodity !== 'string' || !raw.commodity || raw.commodity.length > COMMODITY_MAX) {
    return null;
  }
  const commodity = raw.commodity;
  const units = sanitizeUnits(raw.units);
  if (commodity === SURVIVOR) {
    if (units <= 0) return null;
    // Omit-faction would leave a hold row; reserved ids fail closed.
    if (typeof raw.faction === 'string' && RESERVED_IDS.has(raw.faction)) return null;
    const row = {
      commodity: SURVIVOR,
      units,
      source: raw.source === 'playerKill' ? 'playerKill' : 'other',
    };
    const faction = sanitizeFaction(raw.faction);
    if (faction) row.faction = faction;
    const name = sanitizeSurvivorName(raw.name);
    if (name) row.name = name;
    return row;
  }
  return { commodity, units };
}

export function sanitizeCargoList(list) {
  const out = [];
  if (!Array.isArray(list)) return out;
  for (const raw of list) {
    const row = sanitizeCargoRow(raw);
    if (row) out.push(row);
  }
  return out;
}

export function snapshot(ctx) {
  sanitizeHangar(ctx);
  parkMounted(ctx);
  healPlayerHullKind(ctx);
  const world = {};
  for (const k of WORLD_FIELDS) if (ctx.world[k] !== undefined) world[k] = ctx.world[k];
  return {
    v: 1,
    savedAt: Date.now(),
    world,
    cargo: sanitizeCargoList(ctx.cargo),
    cargoCapacity: ctx.cargoCapacity,
    bio: { ...ctx.bio, songEvent: null },
    player: ctx.player,
    ship: ctx.ship.object
      ? {
          position: ctx.ship.object.position.toArray(),
          quaternion: ctx.ship.object.quaternion.toArray(),
        }
      : null,
  };
}

function loadSnapshot(key = KEY) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    return snap && snap.v === 1 && snap.world ? snap : null;
  } catch {
    return null; // corrupt blob or storage unavailable → fresh start
  }
}

/** Returns true when the autosave key holds a restorable snapshot. */
export function hasAutosave() {
  return loadSnapshot() !== null;
}

function hostileEncounterBlock(ctx) {
  if (!ctx.flags?.combat) return null;
  const shipObj = ctx.ship?.object;
  if (!shipObj) return null;
  const ships = ctx.ships;
  if (!Array.isArray(ships)) return null;
  for (const s of ships) {
    if (!s?.object || s.state?.destroyed) continue;
    const hostile =
      s.role === 'pirate' || s.role === 'ace' ||
      s.record?.role === 'pirate' || s.record?.role === 'ace' ||
      s.ai?.hostile === true;
    if (!hostile) continue;
    if (s.object.position.distanceTo(shipObj.position) <= U.ENCOUNTER_BUBBLE) {
      return 'Hostiles within the encounter bubble — berth record refused.';
    }
  }
  return null;
}

/** Same gates as trySave(autosave key). Does not invent a second storage key. */
export function requestAutosave(ctx) {
  if (!ctx?.player || !ctx.ship?.object || ctx.player.destroyed) return false;
  if (ctx.gate?.jumping) return false;
  const reason = hostileEncounterBlock(ctx);
  if (reason) {
    ctx.emit?.('saveBlocked', { reason });
    return false;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot(ctx)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears only the autosave key; manual berth slots survive so a New Game never
 * destroys an explicitly-saved berth.
 */
export function clearAutosave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage denied — silently fail */
  }
}

/**
 * Rebind ctx.world.prices to the current system's table inside
 * ctx.world.markets — the live-reference invariant market.js maintains.
 * A deserialized snapshot holds twin copies; without the rebind, drift after
 * a load would update prices but never the banked table.
 */
function rebindPrices(ctx) {
  const sys = ctx.world.currentSystem;
  if (!sys) return;
  const markets = (ctx.world.markets ??= {});
  if (!markets[sys] && ctx.world.prices && Object.keys(ctx.world.prices).length) {
    markets[sys] = ctx.world.prices; // table missing: adopt whatever prices we hold
  }
  if (markets[sys]) ctx.world.prices = markets[sys];
}

/**
 * Boundary heal for restored snapshots. Saves cross builds and JSON cannot
 * hold NaN — a NaN written by any past bug lands as null on the next load.
 * Any non-finite numeric on the player record, credits/fear, bio, or the
 * ship transform is reset to its baseline so a corrupt snapshot can never
 * NaN the sim (repair bills, HUD, flight math) again. Same class of guard as
 * the legacy currentSystem/markets handling above.
 */
function sanitizeRestored(ctx) {
  const p = ctx.player;
  if (p) {
    const fresh = createShipState(SHIP_CLASSES[p.classKey] ? p.classKey : 'light', { name: p.name, faction: p.faction });
    for (const k of ['hull', 'hullMax', 'screen', 'screenMax', 'shell', 'shellMax', 'engine', 'engineMax', 'heat', 'lastHitAt', 'lastCombatAt', 'disabledDamage']) {
      if (!Number.isFinite(p[k])) p[k] = fresh[k];
    }
    for (const k of ['hull', 'screen', 'shell', 'engine']) p[k] = Math.min(p[k], p[k + 'Max']);
    if (!Number.isFinite(p.heat) || p.heat < 0) p.heat = 0;
  }
  if (!Number.isFinite(ctx.world.credits)) ctx.world.credits = 350; // fresh-start purse §9
  if (!Number.isFinite(ctx.world.fear)) ctx.world.fear = 0;
  // Wave 30: only a literal true restores the Q-ship flag — anything else
  // (legacy save, corrupted value) heals to unpurchased.
  if (ctx.world.concealedMounts !== true) ctx.world.concealedMounts = false;
  // Wave 34: the Wolfeye ladder is 0/1/2 — a hand-edited scanner (99, '2')
  // would otherwise restore with the Mk II pierce and the station
  // 'installed' note for free (wave-31 security LOW).
  if (![0, 1, 2].includes(ctx.world.scanner)) ctx.world.scanner = 0;
  // Wave 51: the mining-head ladder is 0/1/2/3 — a hand-edited miningLaser
  // (99, '2') would otherwise restore with the Deepcore lance's reach,
  // damage, and hardness-4 access for free (same reasoning as the scanner
  // heal above). Legacy saves with no key land here too and start on the
  // stock head, as intended.
  if (![0, 1, 2, 3].includes(ctx.world.miningLaser)) ctx.world.miningLaser = 0;
  const bio = ctx.bio;
  if (bio) {
    if (!Number.isFinite(bio.hunger)) bio.hunger = 0.15;
    if (!Number.isFinite(bio.wounds)) bio.wounds = 0;
    if (!Number.isFinite(bio.bond)) bio.bond = 0.1;
    if (!Number.isFinite(bio.growth)) bio.growth = 0;
    if (!Number.isFinite(bio.fedCount)) bio.fedCount = 0;
    if (!Number.isFinite(bio.speedFactor)) bio.speedFactor = 1;
    if (!Number.isFinite(bio.turnFactor)) bio.turnFactor = 1;
  }
  const so = ctx.ship.object;
  if (so && ![so.position.x, so.position.y, so.position.z, so.quaternion.x, so.quaternion.y, so.quaternion.z, so.quaternion.w].every(Number.isFinite)) {
    so.position.copy(ctx.config.world.shipSpawn);
    so.quaternion.identity();
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
  }
  if (!Array.isArray(ctx.cargo)) ctx.cargo = [];
  const cargo = sanitizeCargoList(ctx.cargo);
  ctx.cargo.length = 0;
  for (const row of cargo) ctx.cargo.push(row);
  if (!Number.isFinite(ctx.world.time) || ctx.world.time < 0) ctx.world.time = 0;
  sanitizeFieldOre(ctx);
  sanitizeJobs(ctx);
}

/**
 * Boundary heal for live ships surviving a restore. ctx.ships entries
 * instantiated BEFORE the restore (death recovery keeps NPCs running) still
 * point at ORPHANED pre-restore record objects — mutations (state, vouched,
 * callowReturns) never reach the bank, and traffic's despawn would write
 * rec.live = false to the orphan while the restored bank record may carry a
 * serialized stale live: true (snapshot taken while ships were live), which
 * traffic's spawn pass would then refuse to re-instantiate. Traffic only
 * heals stale live flags on 'systemLoaded'; a same-system restore emits no
 * such event. Re-adopt each live ship's bank record by id, then rebuild the
 * live flags: cleared on every record in every bank, set on exactly the
 * records referenced by live ships in the current-system bank.
 */
function healLiveRecords(ctx) {
  const records = ctx.world.records;
  if (!Array.isArray(records)) return;
  // Re-adopt: re-point each live ship's record ref at the restored bank
  // record sharing its id (records carry stable string ids 'rec-N'). Ships
  // whose record id is absent (cannot happen with a coherent snapshot;
  // defensive) are left for traffic's range despawn to retire.
  const byId = new Map();
  for (const rec of records) byId.set(rec.id, rec);
  for (const ship of ctx.ships ?? []) {
    if (!ship.record) continue;
    const bankRec = byId.get(ship.record.id);
    if (bankRec !== undefined && bankRec !== ship.record) ship.record = bankRec;
  }
  // Rebuild live flags: exactly the records referenced by live ships carry
  // live: true across every bank (clears stale serialized live: true).
  const banks = ctx.world.recordBanks ?? { [ctx.world.currentSystem]: records };
  for (const k in banks) {
    const bank = banks[k];
    if (!Array.isArray(bank)) continue;
    for (const rec of bank) rec.live = false;
  }
  const currentBank = ctx.world.recordBanks?.[ctx.world.currentSystem] ?? records;
  for (const ship of ctx.ships ?? []) {
    if (!ship.record) continue;
    let inBank = false;
    for (const rec of currentBank) if (rec === ship.record) { inBank = true; break; }
    if (inBank) ship.record.live = true;
  }
}

export function restore(ctx, snap) {
  if (!snap || typeof snap !== 'object' || !snap.world || typeof snap.world !== 'object') return;
  const fromSystem = ctx.world.currentSystem;
  ctx.flags.saveRestored = true; // origins.js: a restore means no origin pick
  for (const k of WORLD_FIELDS) {
    if (snap.world[k] !== undefined) ctx.world[k] = snap.world[k];
  }
  // Legacy blob with no hangar must not keep a prior session's hulls.
  if (snap.world.hangar === undefined) delete ctx.world.hangar;
  // Omitted fieldOre is missing (contract §6.3) — do not keep a live bag.
  if (snap.world.fieldOre === undefined) delete ctx.world.fieldOre;
  // Omitted jobs is missing (MSN contract §1.2) — do not keep a live board.
  if (snap.world.jobs === undefined) delete ctx.world.jobs;
  // A system id the current build doesn't know (stale/modded save) must not
  // propagate — every module indexes SYSTEMS with it.
  if (!ctx.systems?.[ctx.world.currentSystem]) ctx.world.currentSystem = 'freehold';
  // JSON duplicated the live bank: pre-save ctx.world.records IS
  // recordBanks[currentSystem] (one shared array, swapToSystem discipline),
  // but the snapshot serializes them as two copies. Re-unify so consumers
  // that key on bank-record identity (traffic instantiation, wave-11
  // hermit-pirate beats/vouch) see ONE record set; without this a
  // same-system restore never re-adopts (no systemLoaded → no swapToSystem).
  if (ctx.world.recordBanks && ctx.world.records) {
    ctx.world.recordBanks[ctx.world.currentSystem] = ctx.world.records;
  }
  healLiveRecords(ctx);
  // Legacy save (no markets envelope): adopt the restored prices as the
  // current system's table — otherwise the rebind below would rebind to the
  // fresh baseline table world init built and the restored drift is lost.
  if (snap.world.markets === undefined && snap.world.prices && ctx.world.markets) {
    ctx.world.markets[ctx.world.currentSystem] = ctx.world.prices;
  }
  rebindPrices(ctx);
  if (!Array.isArray(ctx.cargo)) ctx.cargo = [];
  else ctx.cargo.length = 0;
  for (const row of sanitizeCargoList(snap.cargo)) ctx.cargo.push(row);
  if (typeof snap.cargoCapacity === 'number') ctx.cargoCapacity = snap.cargoCapacity;
  if (snap.bio) {
    Object.assign(ctx.bio, snap.bio);
    ctx.bio.songEvent = null;
  }
  if (snap.player && ctx.player) Object.assign(ctx.player, snap.player);
  if (snap.ship && ctx.ship.object) {
    ctx.ship.object.position.fromArray(snap.ship.position);
    ctx.ship.object.quaternion.fromArray(snap.ship.quaternion);
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
  }
  // Announce the system swap so station/solar/asteroid/world modules rebuild
  // into the restored system (consumed via lastEvents next frame). Covers
  // boot (live is 'freehold') and death-recovery in either direction.
  const sys = ctx.world.currentSystem;
  if (sys && sys !== fromSystem) ctx.emit('systemLoaded', { to: sys });
  sanitizeRestored(ctx);
  sanitizeHangar(ctx);
  healPlayerHullKind(ctx);
  syncMountedToPlayer(ctx);
  syncMountedWeaponMirrors(ctx);
  applyMountedFlight(ctx);
}

/** Fresh start at the Freehold station when death finds no save (§4.4). */
function freshStart(ctx) {
  const fromSystem = ctx.world.currentSystem;
  const name = ctx.world.shipName ?? ctx.player?.name;
  if (ctx.player) {
    Object.assign(ctx.player, createShipState('light', { name }));
    healPlayerHullKind(ctx);
    ctx.player.hullKind = 'living';
  }
  ctx.cargo.length = 0;
  ctx.cargoCapacity = 20;
  rebuildStarterHangar(ctx);
  applyMountedFlight(ctx);
  // The companion SURVIVES death wounded — never factory-reset (§ Bio
  // companion: ordinary defeat creates recovery and tenderness, not
  // surprise permanent loss). She carried you home; keep her bond and
  // memories, add the wound.
  const bio = ctx.bio;
  bio.wounds = Math.min(1, (bio.wounds ?? 0) + 0.4);
  bio.mood = 'pained';
  bio.hunger = Math.max(0.4, bio.hunger ?? 0);
  bio.bond = Math.min(1, (bio.bond ?? 0) + 0.02);
  const home = ctx.systems?.freehold?.station?.position ?? [120, 20, 620];
  if (ctx.ship.object) {
    ctx.ship.object.position.set(home[0], home[1] + 10, home[2] + 60);
    ctx.ship.object.quaternion.identity();
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
  }
  // Death always returns you to Freehold Drift — the Compact's berth is home.
  ctx.world.currentSystem = 'freehold';
  rebindPrices(ctx);
  if (fromSystem !== 'freehold') ctx.emit('systemLoaded', { to: 'freehold' });
}

export function initSave(ctx) {
  // ---- death overlay (screens.css shared with station screens) ----
  const overlay = document.createElement('div');
  overlay.className = 'screen-overlay death-overlay';
  overlay.style.display = 'none';
  const panel = document.createElement('div');
  panel.className = 'screen-panel death-panel';
  const title = document.createElement('div');
  title.className = 'death-title';
  title.textContent = 'SHIP LOST';
  const line = document.createElement('div');
  line.className = 'death-line';
  line.textContent = 'Ship lost. The dark keeps what it takes — but not this time.';
  const hint = document.createElement('div');
  hint.className = 'death-hint';
  hint.textContent = 'Returning to your last berth… (Enter to skip)';
  panel.append(title, line, hint);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  let dead = false;
  let deathTimer = 0;

  function recover() {
    if (!dead) return;
    dead = false;
    if (deathTimer) { clearTimeout(deathTimer); deathTimer = 0; }
    overlay.style.display = 'none';
    const snap = loadSnapshot();
    if (snap) {
      restore(ctx, snap);
      // Death-recovery aftermath: she remembers the dark (§ Bio companion).
      // Guarded to this death reload — the boot-time load path never sets it.
      ctx.bio.mood = 'anxious';
    } else {
      freshStart(ctx);
    }
    idleAccum = 0;
    nextDue = IDLE_INTERVAL;
    ctx.emit('commLine', { text: 'She limped home.' });
  }

  function onPlayerDestroyed() {
    if (dead) return;
    dead = true;
    overlay.style.display = 'flex';
    deathTimer = setTimeout(recover, DEATH_HOLD_MS);
  }

  overlay.addEventListener('click', recover);
  window.addEventListener('keydown', (e) => {
    if (!dead) return;
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1') recover();
  });

  // ---- berth records panel (KeyL, space-only) ----
  // Plain DOM in the settings.js inline-style pattern; display:none when
  // closed so it never swallows gameplay input. Manual slots sit beside the
  // autosave under SLOT_KEYS — boot load and death recovery never touch them.
  const berthRoot = document.createElement('div');
  berthRoot.id = 'rw-berth-records';
  berthRoot.style.cssText =
    'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
    'background:rgba(2,5,11,0.72);z-index:60;pointer-events:none;' +
    "font-family:'Consolas','Cascadia Mono','Courier New',monospace;color:#dce8f4;";

  const berthPanel = document.createElement('div');
  berthPanel.style.cssText =
    'pointer-events:auto;min-width:380px;max-width:92vw;max-height:82vh;overflow-y:auto;' +
    'padding:18px 22px 16px;background:linear-gradient(180deg,#101826 0%,#0a101b 100%);' +
    'border:1px solid #2c3d52;border-radius:2px;font-size:13px;line-height:1.5;' +
    'box-shadow:0 0 0 1px rgba(111,210,224,0.06),0 12px 48px rgba(0,0,0,0.65);';
  berthPanel.setAttribute('role', 'dialog');
  berthPanel.setAttribute('aria-label', 'Berth Records');
  // Clicks on the panel must not reach the canvas (fire input).
  berthPanel.addEventListener('mousedown', (e) => e.stopPropagation());
  berthPanel.addEventListener('click', (e) => e.stopPropagation());
  berthRoot.appendChild(berthPanel);

  const berthTitle = document.createElement('div');
  berthTitle.textContent = 'BERTH RECORDS';
  berthTitle.style.cssText =
    'font-size:15px;letter-spacing:0.3em;color:#6fd2e0;margin-bottom:4px;' +
    'border-bottom:1px solid #22303f;padding-bottom:8px;';
  berthPanel.appendChild(berthTitle);

  const berthHint = document.createElement('div');
  berthHint.textContent = 'L or ESC to close — records hold while you fly';
  berthHint.style.cssText = 'color:#5f7185;font-size:11px;letter-spacing:0.1em;margin:6px 0 12px;';
  berthPanel.appendChild(berthHint);

  document.body.appendChild(berthRoot);

  let berthOpen = false;

  function setBerthOpen(next) {
    berthOpen = next;
    berthRoot.style.display = next ? 'flex' : 'none';
    berthRoot.setAttribute('aria-hidden', String(!next));
    if (next) refreshBerth();
  }

  function saveToSlot(slotKey, n) {
    if (trySave(slotKey)) {
      ctx.emit('commLine', { text: 'Berth record sealed — slot ' + n + '.' });
      refreshBerth();
    }
  }

  function loadFromSlot(slotKey) {
    // Paused: system updates are frozen (main.js skips the loop), so a
    // cross-system restore's 'systemLoaded' would rotate out of the event
    // queue unseen — station/gates/environment would stay desynced from the
    // restored world until the next jump. Refuse like the docked gate.
    if (ctx.flags.paused) return;
    if (ctx.gate?.jumping) {
      ctx.emit('saveBlocked', { reason: 'Mid-jump — berth record refused.' });
      return;
    }
    // saveBlockReason does not emit on its own (trySave does) — toast here.
    const reason = saveBlockReason();
    if (reason) {
      ctx.emit('saveBlocked', { reason });
      return;
    }
    const snap = loadSnapshot(slotKey);
    if (!snap) return; // empty or corrupt berth — nothing to restore
    restore(ctx, snap);
    setBerthOpen(false);
    ctx.emit('commLine', { text: 'Berth record restored.' });
  }

  const berthRows = [];
  const BERTH_SLOTS = [
    ['auto', KEY, 'AUTOSAVE'],
    ['1', SLOT_KEYS[0], 'SLOT 1'],
    ['2', SLOT_KEYS[1], 'SLOT 2'],
    ['3', SLOT_KEYS[2], 'SLOT 3'],
  ];
  for (const [slot, slotKey, labelText] of BERTH_SLOTS) {
    const row = document.createElement('div');
    row.className = 'rw-berth-row';
    row.setAttribute('data-slot', slot);
    row.style.cssText =
      'display:flex;align-items:center;gap:10px;padding:8px 2px;' +
      'border-bottom:1px solid #1a2634;';

    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'flex:1;min-width:0;';
    const label = document.createElement('div');
    label.textContent = labelText;
    label.style.cssText = 'color:#9fb2c6;font-size:11px;letter-spacing:0.2em;';
    const meta = document.createElement('div');
    meta.className = 'rw-berth-meta';
    meta.style.cssText = 'color:#7d93ab;font-size:12px;margin-top:2px;';
    textWrap.appendChild(label);
    textWrap.appendChild(meta);
    row.appendChild(textWrap);

    if (slot !== 'auto') {
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'screen-btn rw-berth-save';
      saveBtn.textContent = 'SAVE';
      saveBtn.style.cssText = 'width:auto;padding:4px 12px;';
      saveBtn.addEventListener('click', () => saveToSlot(slotKey, slot));
      row.appendChild(saveBtn);
    }

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.className = 'screen-btn rw-berth-load';
    loadBtn.textContent = 'LOAD';
    loadBtn.style.cssText = 'width:auto;padding:4px 12px;';
    loadBtn.addEventListener('click', () => loadFromSlot(slotKey));
    row.appendChild(loadBtn);

    berthPanel.appendChild(row);
    berthRows.push({ key: slotKey, meta, loadBtn });
  }

  function refreshBerth() {
    for (const row of berthRows) {
      const snap = loadSnapshot(row.key);
      if (snap) {
        const sysId = snap.world.currentSystem;
        const sysName = SYSTEMS[sysId] ? SYSTEMS[sysId].name : sysId;
        row.meta.textContent =
          new Date(snap.savedAt).toLocaleString() + ' · ' + sysName + ' · ' + snap.world.credits + ' UU';
        row.loadBtn.disabled = false;
      } else {
        row.meta.textContent = '— empty berth —';
        row.loadBtn.disabled = true;
      }
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'KeyL') {
      // Never intercept: no preventDefault/stopPropagation. While docked or
      // paused other overlays own the screen, and while dead the death
      // overlay does — only allow closing in those states.
      if (berthOpen) setBerthOpen(false);
      else if (!ctx.flags.docked && !ctx.flags.paused && !dead) setBerthOpen(true);
    } else if (e.code === 'Escape' && berthOpen) {
      setBerthOpen(false);
    }
  });

  // ---- save gating ----

  /** Null when a save is allowed; a refusal reason string when blocked. */
  function saveBlockReason() {
    return hostileEncounterBlock(ctx);
  }

  /** Attempt a save. Returns true when written. */
  function trySave(key = KEY) {
    if (!ctx.player || !ctx.ship.object || dead) return false;
    if (key === KEY) return requestAutosave(ctx);
    // Mid-jump state is incoherent (ships despawned, system half-swapped);
    // the 'systemLoaded' autosave fires the moment the jump completes. The
    // autosave path stays silent; a manual berth save gets a refusal toast.
    if (ctx.gate?.jumping) {
      ctx.emit('saveBlocked', { reason: 'Mid-jump — berth record refused.' });
      return false;
    }
    const reason = saveBlockReason();
    if (reason) {
      ctx.emit('saveBlocked', { reason });
      return false;
    }
    try {
      localStorage.setItem(key, JSON.stringify(snapshot(ctx)));
      return true;
    } catch {
      return false; // storage full/unavailable — stay silent, game continues
    }
  }

  // ---- boot-time load (constructed after ship/world; restores wholesale) ----
  const bootSnap = loadSnapshot();
  if (bootSnap) restore(ctx, bootSnap);

  let idleAccum = 0;
  let nextDue = IDLE_INTERVAL;
  // 'systemLoaded' fires at the jump MIDPOINT while ctx.gate.jumping is still
  // true (jump.js ends the sequence ~half a charge later) — the save must
  // wait for a coherent post-jump state, not be dropped.
  let jumpSavePending = false;
  let pendingRetry = 0;

  return {
    update(dt) {
      if (berthOpen && (ctx.flags.docked || dead)) setBerthOpen(false);
      for (const ev of ctx.lastEvents) {
        if (ev.type === 'playerDestroyed') { onPlayerDestroyed(); continue; }
        if (dead) continue;
        if (ev.type === 'docked' || ev.type === 'undocked') {
          if (trySave()) jumpSavePending = false;
          idleAccum = 0;
          nextDue = IDLE_INTERVAL;
        } else if (ev.type === 'systemLoaded' && JUMP.saveOnJump) {
          jumpSavePending = true;
          pendingRetry = 0;
        }
      }
      // Complete a deferred jump autosave once the swap has finished.
      if (jumpSavePending && !dead) {
        if (!ctx.gate.jumping) {
          pendingRetry += dt;
          if (pendingRetry >= 0.5) { // retry cadence if combat-blocked
            pendingRetry = 0;
            if (trySave()) {
              jumpSavePending = false;
              idleAccum = 0;
              nextDue = IDLE_INTERVAL;
            }
          }
        }
        return;
      }
      // Idle autosave in space only; the dock already saved.
      if (dead || ctx.flags.docked) return;
      idleAccum += dt;
      if (idleAccum >= nextDue) {
        idleAccum = 0;
        nextDue = trySave() ? IDLE_INTERVAL : BLOCK_RETRY;
      }
    },
  };
}
