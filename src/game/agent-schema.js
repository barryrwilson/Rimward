/**
 * Agent API v2 schema. Authored names, tokens, JSON-plain helpers.
 * No DOM. No THREE. No persist. Prototype-safe (Object.hasOwn / Set).
 *
 * v2 cutover (mission 43b34db25ae32972): one public contract, no v1 alias.
 * Adds the control lease, full station-service parity, capability discovery,
 * and the outcome ring vocabulary. Every in-repo caller migrated same commit.
 */
import { COMMODITIES, SYSTEMS } from './state.js'; // data only: authored commodity keys and the system-id set

/**
 * The same native Object.freeze, under one local name. This module freezes 160+
 * authored declarations; the alias is the identical operation (freeze does not
 * read its receiver), applied at the same moment, to the same depth, on the
 * same objects, in the same order. Nothing about the frozen result changes.
 */
const freeze = Object.freeze;

export const VERSION = 2;
export const EVENT_CAP = 16;
export const NEARBY_CAP = 12;
export const COMM_LINE_CAP = 4;

export const DOCK_KEY_SERVICES = freeze([
  'market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard',
]);

const DOCK_SERVICE_SET = new Set(DOCK_KEY_SERVICES);

export const COMMAND_NAMES = freeze([
  'ping',
  'disable',
  'plotRoute',
  'clearRoute',
  'engageAutopilot',
  'cancelAutopilot',
  'approachDock',
  'engageAutomine',
  'cancelAutomine',
  'hailResolve',
  'openService',
  'acceptJob',
  'trade',
  'repairAll',
  'feed',
  'undock',
  'dock',
  'hail',
  'selectTarget',
  'pulse',
  'afterburner',
  'setWeaponGroup',
  'startGame',
  'chooseOrigin',
  'recover',
  'setControl',
  'setCombatIntent',
  'clearControl',
  'stationAction',
]);

const COMMAND_SET = new Set(COMMAND_NAMES);
/** PR1's own pair, still its own membership question (isPr1LiveCommand). */
const PR1_LIVE = new Set(['ping', 'disable']);
/**
 * Every authored command is live. The per-wave category sets (PR2/PR3/session/
 * evade/approach/control/station) existed only to be unioned back together
 * here, and that union listed the SAME 28 authored strings a second time — so
 * the union is the authored set. Membership, ordering and every public
 * isAuthored/isLive/isPr1 answer are unchanged; COMMAND_NAMES remains the one
 * authored list, in its authored order.
 */
const LIVE = COMMAND_SET;

export const FORBIDDEN_NAMES = freeze([
  'teleport',
  'setCredits',
  'setHull',
  'setCargo',
  'god',
  'win',
]);

const FORBIDDEN_SET = new Set(FORBIDDEN_NAMES);

const CHEAT_NAME = /^(set|add|give|grant|write|assign|move)(credits|hull|cargo|ammo|position|pos|worldcredits)$/i;

export const EVENT_TYPES = freeze([
  'commLine',
  'docked',
  'undocked',
  'hailOpened',
  'hailClosed',
  'hailMiss',
  'navRoute',
  'autopilotEngaged',
  'autopilotDisengaged',
  'automineEngaged',
  'automineDisengaged',
  'jumpRequested',
  'systemLoaded',
  'playerHit',
  'playerFire',
  'shieldDown',
  'engineOut',
  'npcHit',
  'npcDisabled',
  'npcDestroyed',
  'npcSurrendered',
  // Issue #68 terminal escape receipts. npcEscaped = a validated gate
  // crossing actually began; npcSheltered = the hull reached the station
  // holding lane (still present, still lockable, still damageable).
  'npcEscaped',
  'npcSheltered',
  'mineHit',
  'mineBlocked',
  'podSpawned',
  'podCollected',
  'podBlocked',
  'landmarkFound',
  'clueFound',
  'convergence',
  'deepening',
  'survivorRescued',
  'survivorSold',
  'epicStage',
  'fearChanged',
  'jobState',
  'milestone',
  'originChosen',
  'saveBlocked',
  'reticleLock',
  'playerDestroyed',
  'recovered',
  'bodyHit',
  'sunHeat',
  'sunKill',
]);

const KEEP_RING = new Set([
  'playerDestroyed', 'recovered', 'playerHit', 'bodyHit', 'shieldDown',
  'npcDestroyed', 'npcDisabled', 'npcSurrendered', 'jobState',
  // Issue #68: an escape receipt arrives at the END of a long chase, when the
  // ring is at its most saturated with combat rows. Without keep class the
  // one row explaining where the target went is evicted on arrival.
  'npcEscaped', 'npcSheltered',
  'landmarkFound', 'clueFound', 'survivorRescued', 'survivorSold',
  'epicStage', 'mineBlocked', 'convergence', 'deepening',
  // Session lifecycle receipts (issue #72). An automine run saturates the ring
  // with 16 distinct mineHit rows (foldable, so keep-class); the fresh
  // saveBlocked/docked/undocked row was then the only non-keep row present, so
  // eviction discarded it on arrival and the agent never observed its own
  // dock, undock, or a refused save. These are deliberately NOT collapsed:
  // each row keeps its own reason/t. Retention stays bounded — repeats are
  // capped by EVENT_CAP and enough newer retained traffic ages them out FIFO.
  'saveBlocked', 'docked', 'undocked',
  'sunKill',
  // Scoop receipts (issue #115). For a pirate the scoop IS the payout, and
  // it lands in the middle of a fight: the ring is saturated with npcHit /
  // bodyHit / shieldDown / mineHit rows, so the ordinary-chatter podCollected
  // was evicted on arrival and the agent never observed its own scoops.
  // podBlocked is the previously silent capacity refusal; pods.js emits it
  // once per pod per free-space value, so retention stays bounded.
  'podCollected', 'podBlocked',
]);

/**
 * Keep-class test for one ring row. Most keep decisions are per type, but
 * hailClosed is split: a plain close (comms hung up) is ordinary chatter,
 * while a demand close carries the paid/refused/bluffed/expired outcome the
 * agent acted for. Without keep class, a ring already saturated with keep or
 * foldable rows discards the fresh terminal receipt on arrival, so an agent
 * that pays tribute never observes its own hailResolve result (PR57 receipt).
 * Only the demand rows are retained, so ordinary hail traffic still evicts
 * first and flood behaviour stays bounded.
 */
function isKeepRow(e) {
  if (!e) return false;
  if (KEEP_RING.has(e.type) || Object.hasOwn(COLLAPSE_KEY, e.type)) return true;
  return e.type === 'hailClosed' && typeof e.demandOutcome === 'string' && e.demandOutcome !== '';
}

const EVENT_TYPE_SET = new Set(EVENT_TYPES);

/** Extra primitive keys copied per authored event type. hailOpened never includes ship. */
const EVENT_FIELDS = freeze({
  commLine: freeze(['text', 'from', 'count']),
  docked: freeze([]),
  undocked: freeze([]),
  hailOpened: freeze(['intents', 'salvage']),
  hailClosed: freeze(['demandHail', 'demandOutcome', 'speaker', 'demand']),
  hailMiss: freeze(['name', 'verb', 'reason', 'dist']),
  navRoute: freeze(['dest', 'hops', 'status']),
  autopilotEngaged: freeze(['dest']),
  autopilotDisengaged: freeze(['reason']),
  automineEngaged: freeze(['asteroidId']),
  automineDisengaged: freeze(['reason']),
  jumpRequested: freeze(['to']),
  systemLoaded: freeze(['to']),
  // Issue #117: attackerId/attackerName are primitives derived at the emit
  // site under the bracket masking law; absent for impact/solar damage.
  playerHit: freeze(['damage', 'family', 'fromAft', 'count', 'attackerId', 'attackerName']),
  playerFire: freeze(['weapon', 'count']),
  shieldDown: freeze(['layer', 'player', 'actor', 'targetId']),
  engineOut: freeze(['player', 'targetId', 'targetName']),
  npcHit: freeze(['targetId', 'targetName', 'damage', 'count']),
  npcDisabled: freeze(['targetId', 'targetName']),
  npcDestroyed: freeze(['targetId', 'targetName']),
  npcSurrendered: freeze(['targetId', 'targetName', 'outcome']),
  // Issue #68. `from`/`to` are SYSTEMS ids, `kind` is 'gate'|'station',
  // `reason` matches the word the HUD shows, `eta` is the crossing delay in
  // seconds on the existing migration time scale.
  npcEscaped: freeze(['targetId', 'targetName', 'from', 'to', 'kind', 'reason', 'eta']),
  npcSheltered: freeze(['targetId', 'targetName', 'system', 'kind', 'reason']),
  // Issue #119: NPC miners emit on the same internal channel; only the
  // player's beam reaches the ring (sanitizeEvent drops any other actor).
  mineHit: freeze(['asteroidId', 'actor', 'count']),
  mineBlocked: freeze(['asteroidId', 'oreKey', 'hardness', 'needs', 'line']),
  podSpawned: freeze(['podId']),
  podCollected: freeze(['podId', 'units', 'commodity']),
  podBlocked: freeze(['podId', 'units', 'free']),
  landmarkFound: freeze(['id', 'name', 'line']),
  clueFound: freeze(['id', 'line']),
  convergence: freeze(['id', 'line']),
  deepening: freeze(['id', 'line']),
  survivorRescued: freeze(['faction', 'source', 'count', 'repDelta']),
  survivorSold: freeze(['faction', 'source', 'count', 'credits', 'repDelta']),
  epicStage: freeze(['id', 'faction', 'stage', 'line']),
  fearChanged: freeze(['fear']),
  jobState: freeze(['id', 'kind', 'outcome', 'pay']),
  milestone: freeze(['id', 'line', 'cause', 'targetId', 'targetName']),
  originChosen: freeze(['id', 'line']),
  saveBlocked: freeze(['reason']),
  reticleLock: freeze(['hit']),
  playerDestroyed: freeze(['attackerId', 'attackerName']),
  recovered: freeze(['source']),
  bodyHit: freeze(['kind', 'speed', 'damage', 'count']),
  sunHeat: freeze(['reason', 'intensity', 'dps', 'count']),
  sunKill: freeze(['reason']),
});

/**
 * Ship-carrying events: identity is derived as primitives; ship never copied.
 *
 * Issue #68 escape receipts are members so a ship handle can never leak
 * through them, but their emit sites deliberately pass PRIMITIVES ONLY —
 * derived from the record through npc-escape.js's escapePublicIdentity, which
 * publishes a masked Q-ship's COVER name. An off-screen departure has no live
 * ship at all, so the primitive path is also the only one that works there.
 */
const SHIP_DERIVE = new Set([
  'engineOut', 'npcHit', 'npcDisabled', 'npcDestroyed', 'npcSurrendered',
  'npcEscaped', 'npcSheltered',
]);

/** Pod-carrying events: podId is derived from the live pod; the pod never copies. */
const POD_DERIVE = new Set(['podSpawned', 'podCollected', 'podBlocked']);

/** Repeat-collapse key per type (same key + type folds into count, newest kept). */
const COLLAPSE_KEY = freeze({
  npcHit: 'targetId',
  mineHit: 'asteroidId',
  // Combat spam folds the same way as npcHit/mineHit: without it, sustained
  // playerHit/bodyHit rows (all KEEP_RING) saturate the 16-row ring and
  // eviction discards the agent's own playerFire/npcHit feedback on arrival —
  // the agent goes blind to its own fire exactly in heavy combat. shieldDown
  // is NOT folded: rows differ by ship/layer and that identity matters.
  playerHit: 'family',
  bodyHit: 'kind',
  playerFire: 'weapon',
  sunHeat: 'reason',
});

const RESERVED = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

export function reservedName(value) {
  if (typeof value !== 'string' || !value) return true;
  return RESERVED.has(value) || RESERVED.has(value.toLowerCase());
}

export function isDockService(id) {
  return typeof id === 'string' && DOCK_SERVICE_SET.has(id);
}

export function isAuthoredCommand(name) {
  return typeof name === 'string' && COMMAND_SET.has(name);
}

export function isPr1LiveCommand(name) {
  return typeof name === 'string' && PR1_LIVE.has(name);
}

export function isLiveCommand(name) {
  return typeof name === 'string' && LIVE.has(name);
}

export function isAuthoredEventType(type) {
  return typeof type === 'string' && EVENT_TYPE_SET.has(type);
}

export function isForbiddenName(name) {
  if (typeof name !== 'string' || !name || reservedName(name)) return false;
  if (FORBIDDEN_SET.has(name)) return true;
  if (CHEAT_NAME.test(name.replace(/[_-]/g, ''))) return true;
  const lower = name.toLowerCase();
  if (lower === 'teleport' || lower === 'warp' || lower === 'god' || lower === 'win') return true;
  if (lower === 'setcredits' || lower === 'sethull' || lower === 'setcargo') return true;
  return false;
}

export function num(value, fallback = null) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
}

export function str(value) {
  return typeof value === 'string' ? value : '';
}

export function bool(value) {
  return value === true;
}

export function finiteOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function vec3(src) {
  if (!src || typeof src !== 'object') return null;
  if (Array.isArray(src) && src.length >= 3) {
    const x = num(src[0]);
    const y = num(src[1]);
    const z = num(src[2]);
    if (x === null || y === null || z === null) return null;
    return [x, y, z];
  }
  const x = num(src.x);
  const y = num(src.y);
  const z = num(src.z);
  if (x === null || y === null || z === null) return null;
  return [x, y, z];
}

/** Local −Z through a {x,y,z,w} quaternion. Accessors allowed (THREE getters). */
export function fwdFromQuat(q) {
  if (!q || typeof q !== 'object') return null;
  const x = num(q.x);
  const y = num(q.y);
  const z = num(q.z);
  const w = num(q.w);
  if (x === null || y === null || z === null || w === null) return null;
  const tx = 2 * (y * -1 - z * 0);
  const ty = 2 * (z * 0 - x * -1);
  const tz = 2 * (x * 0 - y * 0);
  const ox = 0 + w * tx + (y * tz - z * ty);
  const oy = 0 + w * ty + (z * tx - x * tz);
  const oz = -1 + w * tz + (x * ty - y * tx);
  if (!Number.isFinite(ox) || !Number.isFinite(oy) || !Number.isFinite(oz)) return null;
  return [ox, oy, oz];
}

/**
 * World direction (dx,dy,dz) through the inverse of quaternion {x,y,z,w} →
 * ship-local unit [x,y,z] (x right, y up, nose -z). Player-visible geometry
 * only: where a visible contact sits relative to the nose. No THREE import.
 */
export function localDir(q, dx, dy, dz) {
  if (!q || typeof q !== 'object') return null;
  const qx = num(q.x);
  const qy = num(q.y);
  const qz = num(q.z);
  const qw = num(q.w);
  if (qx === null || qy === null || qz === null || qw === null) return null;
  const len = Math.hypot(dx, dy, dz);
  if (!Number.isFinite(len) || len < 1e-8) return null;
  let vx = dx / len;
  let vy = dy / len;
  let vz = dz / len;
  // Rotate by the conjugate (inverse for a unit quaternion).
  const cx = -qx;
  const cy = -qy;
  const cz = -qz;
  const tx = 2 * (cy * vz - cz * vy);
  const ty = 2 * (cz * vx - cx * vz);
  const tz = 2 * (cx * vy - cy * vx);
  vx += qw * tx + (cy * tz - cz * ty);
  vy += qw * ty + (cz * tx - cx * tz);
  vz += qw * tz + (cx * ty - cy * tx);
  if (!Number.isFinite(vx) || !Number.isFinite(vy) || !Number.isFinite(vz)) return null;
  return [vx, vy, vz];
}

export function primitiveValue(value) {
  if (value === null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return value;
  return undefined;
}

function stringList(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (typeof item === 'string') out.push(item);
  }
  return out;
}

export function emptyLastIntent() {
  return { name: '', ok: true, error: '', token: '', t: 0 };
}

export function copyLastIntent(raw) {
  const src = raw && typeof raw === 'object' ? raw : null;
  const out = {
    name: src ? str(Object.hasOwn(src, 'name') ? src.name : '') : '',
    ok: src ? Object.hasOwn(src, 'ok') && src.ok !== false : true,
    error: src ? str(Object.hasOwn(src, 'error') ? src.error : '') : '',
    token: src ? str(Object.hasOwn(src, 'token') ? src.token : '') : '',
    t: src ? num(Object.hasOwn(src, 't') ? src.t : 0, 0) : 0,
  };
  const status = src ? str(Object.hasOwn(src, 'status') ? src.status : '') : '';
  if (status) out.status = status;
  // Issue #118: optional refusal context, mirrored from the act receipt.
  const detail = src ? str(Object.hasOwn(src, 'detail') ? src.detail : '') : '';
  if (detail) out.detail = detail;
  return out;
}

export function noCtxObservation() {
  return { v: VERSION, t: 0, ok: false, error: 'no-ctx', agentOptIn: false, hazards: { sun: null }, events: [] };
}

/**
 * One act receipt. `error` is refusal text only; `notice` is the player-visible
 * line a successful action displayed (issue #64) — station success notices used
 * to ride `error`, which read as a failure to every caller. Both are always
 * present strings, filtered through str(), so a receipt never inherits a value
 * from the preceding request. Not a version bump: `notice` is additive.
 * `detail` (issue #118) is an optional human-readable refusal context — the
 * failing argument name or the unmet precondition — present only when the
 * refusing helper supplied one. `token` stays the stable enum.
 */
export function actResult({ ok, error = '', name = '', token = '', status = '', reqId = '', t = null, notice = '', detail = '' }) {
  const out = {
    v: VERSION,
    ok: ok === true,
    error: str(error),
    name: str(name),
    token: str(token),
    notice: str(notice),
  };
  const st = str(status);
  if (st) out.status = st;
  const why = str(detail);
  if (why) out.detail = why;
  const id = str(reqId);
  if (id) out.reqId = id;
  if (typeof t === 'number' && Number.isFinite(t)) out.t = t;
  return out;
}

/**
 * Copy one ctx.emit payload into a JSON-plain ring row.
 * Unknown types → null. Non-primitives stripped. hailOpened never keeps ship.
 */
export function sanitizeEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = Object.hasOwn(raw, 'type') ? raw.type : '';
  if (!isAuthoredEventType(type)) return null;
  // Issue #119: NPC miners share the internal mineHit channel with the
  // player's beam. Only the player's own cut is a public receipt; every other
  // actor (npc, missing, unknown) fails closed. Ring rows carry
  // actor:'player', so the observe() re-sanitize pass is idempotent.
  if (type === 'mineHit' && raw.actor !== 'player') return null;
  const out = {
    type,
    t: num(Object.hasOwn(raw, 't') ? raw.t : 0, 0),
  };
  // Ship/pod identity: derived primitives only; the object refs never copy.
  // Idempotent by contract: copyEvents re-sanitizes ring rows, which carry
  // the derived primitives but no ship — the field skip below must apply
  // only when THIS pass derived identity from a live ship, or the observe()
  // copy silently drops targetId/targetName the harvest already made plain.
  let derivedTarget = false;
  if (SHIP_DERIVE.has(type) && raw.ship && typeof raw.ship === 'object') {
    const ship = raw.ship;
    const rec = ship.record && typeof ship.record === 'object' ? ship.record : null;
    const st = ship.state && typeof ship.state === 'object' ? ship.state : null;
    const id = Object.hasOwn(ship, 'id') ? ship.id : (rec && Object.hasOwn(rec, 'id') ? rec.id : null);
    if (typeof id === 'string' || typeof id === 'number') { out.targetId = id; derivedTarget = true; }
    // Q-ship cover holds on every derived identity: a masked hull publishes
    // the name the bracket is showing, never the real one underneath.
    const masked = !!rec && rec.qship === true && rec.revealed !== true;
    const cover = masked && typeof rec.coverName === 'string' && rec.coverName ? rec.coverName : '';
    const nm = cover
      || (st && typeof st.name === 'string' && st.name)
      || (rec && typeof rec.name === 'string' && rec.name)
      || '';
    if (nm) out.targetName = nm;
  }
  if (POD_DERIVE.has(type)
    && raw.pod && typeof raw.pod === 'object' && Object.hasOwn(raw.pod, 'id')) {
    const pid = raw.pod.id;
    if (typeof pid === 'string' || typeof pid === 'number') out.podId = pid;
  }
  const fields = Object.hasOwn(EVENT_FIELDS, type) ? EVENT_FIELDS[type] : [];
  for (let i = 0; i < fields.length; i++) {
    const key = fields[i];
    if (typeof key !== 'string' || reservedName(key)) continue;
    if ((key === 'targetId' || key === 'targetName') && SHIP_DERIVE.has(type) && Object.hasOwn(out, key)) continue; // derived above
    // Same idempotence rule as targetId/targetName: skip only when THIS pass
    // derived podId from a live pod object. A re-sanitized ring row carries a
    // plain podId and no pod, so an unconditional skip would drop it on the
    // observe() copy and the agent would lose pod identity it already had.
    if (key === 'podId' && Object.hasOwn(out, key) && POD_DERIVE.has(type)) continue; // derived above
    if (!Object.hasOwn(raw, key)) continue;
    if (key === 'intents') {
      out.intents = stringList(raw.intents);
      continue;
    }
    if (key === 'count') {
      const n = primitiveValue(raw.count);
      if (typeof n === 'number' && n >= 2) out.count = Math.floor(n);
      continue;
    }
    if (type === 'recovered' && key === 'source') {
      if (raw.source === 'autosave' || raw.source === 'fresh') out.source = raw.source;
      continue;
    }
    const pv = primitiveValue(raw[key]);
    if (pv !== undefined) out[key] = pv;
  }
  if (ESCAPE_RECEIPTS.has(type)) boundEscapeReceipt(out);
  if (type === 'playerHit' || type === 'playerDestroyed') boundAttacker(out);
  if (type === 'podCollected' || type === 'podBlocked') {
    // Finite non-negative unit counts only; a commodity must be a known key.
    for (const key of ['units', 'free']) {
      if (Object.hasOwn(out, key) && !(typeof out[key] === 'number' && Number.isFinite(out[key]) && out[key] >= 0)) delete out[key];
    }
    if (Object.hasOwn(out, 'commodity') && !(typeof out.commodity === 'string'
      && (out.commodity === 'survivor' || Object.hasOwn(COMMODITIES, out.commodity)))) delete out.commodity;
  }
  if (type === 'sunHeat' || type === 'sunKill') {
    // Fixed cause and finite numeric solar fields only; idempotent on observe copies.
    out.reason = 'sun';
    if (type === 'sunHeat') {
      for (const key of ['intensity', 'dps']) {
        if (typeof out[key] !== 'number' || out[key] < 0) delete out[key];
      }
      if (typeof out.intensity === 'number') out.intensity = Math.min(1, out.intensity);
    }
  }
  return out;
}

const ESCAPE_RECEIPTS = new Set(['npcEscaped', 'npcSheltered']);

/**
 * Issue #117: attacker identity fails closed. An id must be a string (≤ 64)
 * or a number; a name must be a non-empty string (≤ 40) and never travels
 * without its id. Idempotent on observe() copies.
 */
function boundAttacker(out) {
  const id = out.attackerId;
  const idOk = (typeof id === 'string' && id.length > 0 && id.length <= 64) || (typeof id === 'number' && Number.isFinite(id));
  if (!idOk) { delete out.attackerId; delete out.attackerName; return; }
  const nm = out.attackerName;
  if (typeof nm !== 'string' || !nm || nm.length > 40) delete out.attackerName;
}
/** The authored escape vocabulary — the same two words for kind and reason. */
const ESCAPE_WORDS = new Set(['gate', 'station']);
const ESCAPE_ID_MAX = 64;
const ESCAPE_NAME_MAX = 40;
const ESCAPE_ETA_MAX = 100000; // s — far past any authored migration window

/**
 * Issue #68: the receipt sanitizer bounds ITSELF, not just its emitters.
 * A row that reached here from a hostile or buggy caller carries only:
 * a bounded own id/name, AUTHORED system ids, the two authored enums, and a
 * finite non-negative eta. Everything else is dropped rather than coerced
 * into a plausible-looking lie. Idempotent by construction — a second pass
 * over an already-bounded row changes nothing.
 */
/** Bounded own string (id may also be a finite number); anything else drops. */
function boundReceiptText(out, key, max, allowNumber) {
  const v = out[key];
  if (typeof v === 'string') {
    if (v.length === 0) delete out[key];
    else if (v.length > max) out[key] = v.slice(0, max);
  } else if (allowNumber && typeof v === 'number') {
    if (!Number.isFinite(v)) delete out[key];
  } else if (Object.hasOwn(out, key)) {
    delete out[key];
  }
}

function boundEscapeReceipt(out) {
  boundReceiptText(out, 'targetId', ESCAPE_ID_MAX, true);
  boundReceiptText(out, 'targetName', ESCAPE_NAME_MAX, false);
  for (const key of ['from', 'to', 'system']) {
    if (!Object.hasOwn(out, key)) continue;
    const v = out[key];
    if (v === null) continue; // an explicit "unknown" is honest; a fake id is not
    if (typeof v !== 'string' || !Object.hasOwn(SYSTEMS, v)) delete out[key];
  }
  // 'kind' and 'reason' publish the same two authored words.
  for (const key of ['kind', 'reason']) {
    if (Object.hasOwn(out, key) && out[key] !== null && !ESCAPE_WORDS.has(out[key])) delete out[key];
  }
  if (Object.hasOwn(out, 'eta')) {
    const eta = out.eta;
    if (typeof eta !== 'number' || !Number.isFinite(eta) || eta < 0) delete out.eta;
    else out.eta = Math.min(ESCAPE_ETA_MAX, Math.round(eta));
  }
}

function commCountOf(row) {
  const n = row && typeof row.count === 'number' && Number.isFinite(row.count) ? row.count : 1;
  return n >= 1 ? Math.floor(n) : 1;
}

function dropOldestComm(events) {
  for (let i = 0; i < events.length; i++) {
    if (events[i] && events[i].type === 'commLine') {
      events.splice(i, 1);
      return true;
    }
  }
  return false;
}

function countCommLines(events) {
  let n = 0;
  for (let i = 0; i < events.length; i++) {
    if (events[i] && events[i].type === 'commLine') n++;
  }
  return n;
}

export function pushRing(events, row, cap = EVENT_CAP) {
  if (!Array.isArray(events) || !row) return;
  const limit = Number.isFinite(cap) && cap > 0 ? cap : EVENT_CAP;

  const collapseKey = Object.hasOwn(COLLAPSE_KEY, row.type) ? COLLAPSE_KEY[row.type] : '';
  if (row.type === 'commLine') {
    let count = commCountOf(row);
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (!e || e.type !== 'commLine') continue;
      if (e.text === row.text && e.from === row.from) {
        count += commCountOf(e);
        events.splice(i, 1);
      }
    }
    if (count > 1) row.count = count;
    else if (Object.hasOwn(row, 'count')) delete row.count;
    if (countCommLines(events) >= COMM_LINE_CAP) dropOldestComm(events);
  } else if (collapseKey) {
    // Hit spam folds per target; newest row keeps the running count.
    const want = row[collapseKey];
    if (want !== undefined && want !== null) {
      let count = commCountOf(row);
      for (let i = events.length - 1; i >= 0; i--) {
        const e = events[i];
        if (!e || e.type !== row.type) continue;
        if (e[collapseKey] !== want) continue;
        count += commCountOf(e);
        events.splice(i, 1);
      }
      if (count > 1) row.count = count;
      else if (Object.hasOwn(row, 'count')) delete row.count;
    }
  } else if (row.type === 'recovered' || row.type === 'playerDestroyed') {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (!e || e.type !== row.type) continue;
      if (e.t !== row.t) continue;
      if (row.type === 'recovered' && e.source !== row.source) continue;
      events.splice(i, 1);
      break;
    }
  }


  events.push(row);
  while (events.length > limit) {
    if (dropOldestComm(events)) continue;
    let drop = -1;
    for (let i = 0; i < events.length; i++) {
      // Foldable (COLLAPSE_KEY) rows are bounded to one row per key, so they
      // are keep-class too: without this, a ring saturated with KEEP rows
      // discards an incoming playerFire/npcHit on arrival and the agent goes
      // blind to its own fire exactly in heavy combat (wave-142 ring probe).
      if (!isKeepRow(events[i])) {
        drop = i;
        break;
      }
    }
    if (drop < 0) drop = 0;
    events.splice(drop, 1);
  }
}

// -------------------------------------------------------------------------
// v2 capability manifest (static discovery). Dynamic per-moment availability
// is computed in agent-observe.js from phase/dock/service/target/helm state.
// Status vocabulary: 'supported' | 'unavailable' | 'blocked-by-scope'.
// Mission 43b34db25ae32972 owner decision: full existing-action parity is
// authorized — every current player service action rides the same station
// closures, costs, eligibility and confirmations as the keyboard path.

/**
 * One supported role row: status, its authored command list, its note — in
 * that order, frozen at declaration exactly as the written-out literals were.
 * Every row is 'supported'; the repeated field names are what this removes,
 * not any authored value.
 */
const role = (commands, note) => freeze({ status: 'supported', commands: freeze(commands), note });

export const ROLE_STATUS = freeze({
  session: role(
    ['startGame', 'chooseOrigin', 'recover', 'ping', 'disable'],
    'title/origin/death lifecycle; recovery rides the death overlay path',
  ),
  pilot: role(
    [
      'plotRoute', 'clearRoute', 'engageAutopilot', 'cancelAutopilot',
      'approachDock', 'dock', 'undock', 'pulse', 'afterburner',
      'setControl', 'clearControl',
    ],
    'routes/AP/gates plus a bounded expiring manual-control lease',
  ),
  trader: role(
    ['openService', 'trade', 'repairAll', 'feed', 'stationAction'],
    'market fill prices, repair, bio feed; desk rows and notices observed',
  ),
  miner: role(
    ['selectTarget', 'setWeaponGroup', 'engageAutomine', 'cancelAutomine', 'setControl', 'clearControl'],
    'rock identity/ore/hardness, automine channel, cargo/job progress',
  ),
  combat: role(
    ['selectTarget', 'pulse', 'setWeaponGroup', 'setControl', 'setCombatIntent', 'clearControl', 'afterburner', 'hail', 'hailResolve'],
    'HUD-derived aim/lead + lease fireHeld; bounded target-specific combat intent, explicit renewal/cancel; hit/shield/destruction ring outcomes',
  ),
  hail: role(
    ['hail', 'hailResolve'],
    'demand/surrender/salvage/conversation cards: observe speaker, kind and displayed terms; resolve by listed intent, optionally bound to conversationId',
  ),
  missions: role(
    ['openService', 'acceptJob'],
    'board offers docked; active jobs observed in flight; jobState ring terminals',
  ),
  explorer: role(
    ['plotRoute', 'engageAutopilot', 'setControl', 'clearControl', 'pulse'],
    'accepted surveys and recoveries expose jobs.active[].objective: named system, status/reason, and the flight marker range + ship-local bearing (x right, y up, nose -z); use setControl to fly within arrivalRange, then return to originSystem and dock for payment. No scanner required. Unaccepted sites/clues are not enumerated; landmarkFound/clueFound, podCollected and jobState record outcomes. podCollected { podId, units, commodity } and podBlocked { podId, units, free } are keep-class scoop receipts; targets.nearby pod rows carry id and units so a runner can see whether a pod fits the hold before flying to it. Nearby ship rows carry faction/factionName, resolveBand, surrendered, disabled and hailState (the bracket words under the same scanner tiers; numeric resolve, concealedMounts, hail terms and vitals stay on the locked targets.current row); station.bearing and gate.to/kind/source/range/bearing publish ship-local unit bearings (x right, y up, nose -z) to the station and to the active gate (plotted next hop, else nearest live gate) so setControl flight home needs no privileged read',
  ),
  rescue: role(
    ['selectTarget', 'pulse', 'setControl', 'clearControl', 'openService', 'stationAction'],
    'pod identity/range observed; scoop, dock and People desk resolve survivors',
  ),
  services: role(
    ['openService', 'stationAction', 'undock'],
    'bar/outfitting/people/epics/shipyard/launch via exact player closures',
  ),
});

/**
 * One command spec: its argument sketch and the roles that may issue it, in
 * that authored order, each frozen at declaration exactly as the written-out
 * literals were and each a distinct object/array per command. The two specs
 * that carry an extra authored field (setControl's outcomes, stationAction's
 * note) stay written out in full below.
 */
const cmd = (args, roles) => freeze({ args: freeze(args), roles: freeze(roles) });

export const COMMAND_SPECS = freeze({
  ping: cmd({}, ['session']),
  disable: cmd({}, ['session']),
  startGame: cmd({}, ['session']),
  chooseOrigin: cmd({ id: 'origin id string' }, ['session']),
  recover: cmd({}, ['session']),
  plotRoute: cmd({ dest: 'system id string' }, ['pilot', 'explorer']),
  clearRoute: cmd({}, ['pilot']),
  engageAutopilot: cmd({}, ['pilot']),
  cancelAutopilot: cmd({}, ['pilot']),
  approachDock: cmd({}, ['pilot']),
  engageAutomine: cmd({}, ['miner']),
  cancelAutomine: cmd({}, ['miner']),
  dock: cmd({}, ['pilot']),
  undock: cmd({}, ['pilot', 'services']),
  hail: cmd({}, ['hail', 'combat']),
  hailResolve: cmd({
    intent: 'listed intent string',
    index: '1-based intent index (alternative)',
    expectedConversationId: 'optional observe().hail.conversationId; a replaced card refuses token stale',
  }, ['hail', 'combat']),
  selectTarget: freeze({
    args: freeze({ id: 'optional nearby target id; omit to cycle' }),
    roles: freeze(['combat', 'miner', 'rescue']),
    note: 'the lock moves on acceptance, but the HUD aim digest that setCombatIntent needs is written once per rendered frame: after selectTarget (or setWeaponGroup) wait one rendered HUD frame — read observe().t advancing — before setCombatIntent, or expect token no-sample. A hidden or suspended tab renders no frames, so the sample never freshens until it is visible again.',
  }),
  pulse: cmd({ edge: "'dock'|'hail'|'target'|'reticleLock'" }, ['pilot', 'combat', 'miner', 'explorer', 'rescue']),
  afterburner: cmd({}, ['pilot', 'combat']),
  setWeaponGroup: cmd({ n: 'integer 1..5' }, ['combat', 'miner']),
  setControl: freeze({
    args: freeze({
      seq: 'strictly increasing safe integer per session',
      ttl: 'sim seconds 0.05..5 (default 1)',
      steerX: '-1..1 optional', steerY: '-1..1 optional',
      strafeX: '-1..1 optional', strafeY: '-1..1 optional',
      roll: '-1..1 optional',
      throttle: '0..1 target for the persistent ship setpoint published as observe().ship.throttle; omitted or null leaves that setpoint alone; ramps at the player 0.5/s rate while the lease is live; 0 commands the player full stop (observe().flags.fullStop) on the next applied update',
      fireHeld: 'boolean optional', driftHeld: 'boolean optional',
    }),
    roles: freeze(['pilot', 'combat', 'miner', 'explorer', 'rescue']),
    outcomes: freeze(['active', 'cleared', 'expired', 'suppressed']),
    note: 'the throttle setpoint is ship state, not lease state: lease expiry and clearControl end steering and fire but leave observe().ship.throttle where the last applied update left it, so the ship keeps flying. To stop, request throttle 0 on a live lease, then confirm observe().ship.throttle === 0 AND observe().flags.fullStop === true before clearing; zero throttle alone can still be a lease that never applied.',
  }),
  setCombatIntent: freeze({
    args: freeze({
      seq: 'strictly increasing safe integer shared with setControl',
      ttl: 'required seconds 1..60; expires at the earlier simulation or monotonic wall deadline; no implicit renewal; a wall deadline crossed while no frame ran (hidden pane, observe().flags.suspended) ends with reason suspended instead of expired',
      targetId: 'required current visible ship id',
      defense: "optional 'evade' (default)|'break-off'|'off'; local reaction inside the same TTL",
      intent: "'engage'|'disable'|'break-off'|'retreat'; disable shares engage policy, does not select engines, and may destroy the target",
      burner: "optional boolean (default false); only with intent 'break-off'|'retreat' (bad-args otherwise): permits the controller to hold the ordinary afterburner once the nose is off the pursuer, under the normal power, cooldown, burn-time and clearance rules; a renewal may grant or revoke it",
    }),
    roles: freeze(['combat']),
    outcomes: freeze(['active', 'cleared', 'expired']),
    phases: freeze(['intercept', 'pass', 'reposition', 'break-off', 'retreat']),
    terminalReasons: freeze(['target-disabled', 'target-surrendered', 'target-destroyed',
      'target-lost', 'target-changed', 'weapon-changed', 'disengaged', 'retreated',
      'jump', 'jumping', 'match-speed', 'player-override', 'hail', 'expired', 'suspended',
      'explicit', 'paused', 'held', 'berth', 'docked', 'overlay', 'dead', 'opt-in', 'helm', 'no-service']),
    refusalReasons: freeze(['bad-args', 'bad-seq', 'bad-ttl', 'stale', 'weapon',
      'lock-kind', 'stale-lock', 'no-sample',
      'target-lost', 'target-destroyed', 'target-surrendered', 'target-disabled',
      'match-speed', 'player-override', 'opt-in', 'helm', 'no-service', 'docked',
      'held', 'paused', 'jumping', 'overlay', 'dead']),
    targetRefusals: freeze({
      'lock-kind': 'the current lock is a rock, pod, station, gate or landmark, not a ship; selectTarget the hull',
      'stale-lock': 'there is no current lock, or its id is not targetId; selectTarget the hull',
      'target-lost': 'the locked hull left the live roster',
      'no-sample': 'the hull is locked but the HUD aim digest is not fresh: written once per rendered frame for the current lock and weapon group, valid for 0.25 s of simulation time and within 600 u; wait one rendered frame after selectTarget or setWeaponGroup (observe().t must advance); a suspended tab never freshens it',
    }),
    detail: 'refusal receipts for bad-args, bad-seq, bad-ttl, stale, bad-axis, bad-throttle and the four target refusals carry a human-readable detail string naming the failing argument or the unmet precondition; token is the enum, detail is free text',
    fireBlocks: freeze(['', 'alignment', 'range', 'heat', 'weapon', 'reposition', 'break-off', 'retreat', 'obstructed', 'defense']),
    movementBlocks: freeze(['', 'obstructed', 'engine', 'full-stop']),
    burnerBlocks: freeze(['', 'not-allowed', 'engine', 'obstructed', 'drift', 'power', 'cooldown', 'alignment', 'separating', 'authorization']),
    burner: freeze({ view: 'combat.burner { allowed, held, blocked }',
      rule: "issue #120: with burner: true on a 'retreat'|'break-off' intent the controller starts and holds the ordinary afterburner (the same ×2 burn, power drain and cooldown a Space press gets) while the pursuer is within the sensing envelope and not already falling behind (HUD closing <= 20 u/s), the target bearing is aft (local z > 0.7), no drift or obstruction is live, the burner is ready with enough power and more than one second of authorization remains; an owned burn that already started keeps its hold until the ship ends it or a physical block appears; combat.burner.held is the controller output for this frame, not proof the burn engaged (read observe().ship / flags for the burner state); blocked names the first unmet condition; attack intents never burn; the raw afterburner pulse still answers helm while a combat intent owns the helm" }),
    defense: freeze({ phases: freeze(['idle', 'evading', 'reengaging', 'break-off', 'completed']),
      tuning: 'hull <=40%, engine <=30% or engineOut, defenses <=10% latch withdrawal on threat; heat >=90% suppresses fire until <75%; evade 1..3s, 0.75s quiet, 1s reengagement; drift <=0.35s, owned burn <=0.5s with visible clearance and normal power/cooldown' }),
    note: 'outcomes are control.state; terminalReasons are control.reason. Active combat.fireBlocked uses fireBlocks; after completion it copies control.reason. Active combat.movementBlocked uses movementBlocks. A combat intent is a thrust command: acceptance clears observe().flags.fullStop like engageAutopilot and engageAutomine, so a hull stopped by the setControl throttle-0 handshake moves on the first applied update; while a live combat lease is still held at rest by that latch, movementBlocked reads full-stop. Every release of the lease ends in a full stop. Issue #117: playerHit rows carry attackerId/attackerName for a projectile from an NPC hull (a masked Q-ship publishes its cover name until the Mk II eye; impact and solar damage carry none); playerHit still folds per family, so the newest row names the latest shooter. playerDestroyed carries the last attacker of that life the same way.',
  }),
  clearControl: freeze({
    args: freeze({}),
    roles: freeze(['pilot', 'combat', 'miner', 'explorer', 'rescue']),
    note: 'idempotent release of the manual or tactical lease. For raw leases it does not brake; combat lease release applies full stop. A raw release leaves observe().ship.throttle and observe().flags.fullStop as the last applied update left them. Supported stop handshake: setControl throttle 0, then confirm observe().ship.throttle === 0 AND observe().flags.fullStop === true before clearControl. For a ship actually at rest read observe().ship.speed; the full stop commands no thrust, it does not promise instant zero velocity.',
  }),
  openService: cmd({ id: 'dock service id' }, ['trader', 'missions', 'services', 'rescue']),
  acceptJob: cmd({ id: 'offered job id' }, ['missions']),
  trade: cmd(
    { commodity: 'commodity key', qty: 'integer 1..min(99, capacity)', side: "'buy'|'sell'" },
    ['trader'],
  ),
  repairAll: cmd({}, ['trader']),
  feed: cmd({ kind: "'biomass'|'rock'|'tend'" }, ['trader']),
  stationAction: freeze({
    args: freeze({
      n: 'integer action index from observe().station.view.actions',
      expect: 'optional exact button label; mismatch refuses token stale',
    }),
    roles: freeze(['trader', 'missions', 'services', 'rescue']),
    note: 'invokes the exact player button closure of the current docked view; confirmations stay two-step',
  }),
});

/** One supported dock service row: status then its authored action summary. */
const svc = (actions) => freeze({ status: 'supported', actions });

export const SERVICE_SPECS = freeze({
  market: svc('trade + desk buttons (+1/+5/-1/-5, seed/data papers)'),
  jobs: svc('acceptJob + board accept buttons'),
  bar: svc('buyRound'),
  feed: svc('feedBiomass/feedRock/tendWounds'),
  repair: svc('repairAll'),
  outfitting: svc('cargo rack, scanners, concealed mounts, mining heads, launcher/turret papers (arm/confirm/cancel)'),
  people: svc('rescue return, ask around, call in favor, sworn gift/Chain transfer/launder papers'),
  launch: svc('undock'),
  epics: svc('restitution papers (arm/confirm/cancel)'),
  shipyard: svc('hangar mount/graft/train + yard hull papers (arm/confirm/cancel)'),
});

/** Static manifest attached to every v2 observation. */
export function capabilityManifest() {
  return {
    version: VERSION,
    roles: ROLE_STATUS,
    commands: COMMAND_SPECS,
    services: SERVICE_SPECS,
    events: EVENT_TYPES,
  };
}

/** Append one authored row onto the session ring. Does not set optIn. */
export function noteSessionEvent(ctx, raw) {
  if (!ctx || typeof ctx !== 'object' || !raw || typeof raw !== 'object') return null;
  const agent = ctx.agent;
  if (!agent || typeof agent !== 'object') return null;
  if (!Array.isArray(agent.events)) agent.events = [];
  const row = sanitizeEvent(raw);
  if (!row) return null;
  if (!Object.hasOwn(raw, 't') && ctx.world && Number.isFinite(ctx.world.time)) {
    row.t = ctx.world.time;
  }
  pushRing(agent.events, row, EVENT_CAP);
  return row;
}
