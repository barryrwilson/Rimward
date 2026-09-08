/**
 * Agent API v2 schema. Authored names, tokens, JSON-plain helpers.
 * No DOM. No THREE. No persist. Prototype-safe (Object.hasOwn / Set).
 *
 * v2 cutover (mission 43b34db25ae32972): one public contract, no v1 alias.
 * Adds the control lease, full station-service parity, capability discovery,
 * and the outcome ring vocabulary. Every in-repo caller migrated same commit.
 */

export const VERSION = 2;
export const EVENT_CAP = 16;
export const NEARBY_CAP = 12;
export const COMM_LINE_CAP = 4;

export const DOCK_KEY_SERVICES = Object.freeze([
  'market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard',
]);

const DOCK_SERVICE_SET = new Set(DOCK_KEY_SERVICES);

export const COMMAND_NAMES = Object.freeze([
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
  'clearControl',
  'stationAction',
]);

const COMMAND_SET = new Set(COMMAND_NAMES);
const PR1_LIVE = new Set(['ping', 'disable']);
const PR2_LIVE = new Set([
  'plotRoute',
  'clearRoute',
  'engageAutopilot',
  'cancelAutopilot',
  'engageAutomine',
  'cancelAutomine',
  'hailResolve',
  'openService',
  'acceptJob',
  'trade',
  'repairAll',
  'feed',
  'undock',
]);
const PR3_LIVE = new Set([
  'dock',
  'hail',
  'selectTarget',
  'pulse',
  'setWeaponGroup',
]);
const SESSION_LIVE = new Set(['startGame', 'chooseOrigin', 'recover']);
const EVADE_LIVE = new Set(['afterburner']);
const APPROACH_LIVE = new Set(['approachDock']);
const CONTROL_LIVE = new Set(['setControl', 'clearControl']);
const STATION_LIVE = new Set(['stationAction']);
const LIVE = new Set([
  ...PR1_LIVE, ...PR2_LIVE, ...PR3_LIVE, ...SESSION_LIVE, ...EVADE_LIVE, ...APPROACH_LIVE,
  ...CONTROL_LIVE, ...STATION_LIVE,
]);

export const FORBIDDEN_NAMES = Object.freeze([
  'teleport',
  'setCredits',
  'setHull',
  'setCargo',
  'god',
  'win',
]);

const FORBIDDEN_SET = new Set(FORBIDDEN_NAMES);

const CHEAT_NAME = /^(set|add|give|grant|write|assign|move)(credits|hull|cargo|ammo|position|pos|worldcredits)$/i;

export const EVENT_TYPES = Object.freeze([
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
  'mineHit',
  'mineBlocked',
  'podSpawned',
  'podCollected',
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
]);

const KEEP_RING = new Set([
  'playerDestroyed', 'recovered', 'playerHit', 'bodyHit', 'shieldDown',
  'npcDestroyed', 'npcDisabled', 'npcSurrendered', 'jobState',
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
const EVENT_FIELDS = Object.freeze({
  commLine: Object.freeze(['text', 'from', 'count']),
  docked: Object.freeze([]),
  undocked: Object.freeze([]),
  hailOpened: Object.freeze(['intents', 'salvage']),
  hailClosed: Object.freeze(['demandHail', 'demandOutcome', 'speaker', 'demand']),
  hailMiss: Object.freeze(['name', 'verb', 'reason', 'dist']),
  navRoute: Object.freeze(['dest', 'hops', 'status']),
  autopilotEngaged: Object.freeze(['dest']),
  autopilotDisengaged: Object.freeze(['reason']),
  automineEngaged: Object.freeze(['asteroidId']),
  automineDisengaged: Object.freeze(['reason']),
  jumpRequested: Object.freeze(['to']),
  systemLoaded: Object.freeze(['to']),
  playerHit: Object.freeze(['damage', 'family', 'fromAft', 'count']),
  playerFire: Object.freeze(['weapon', 'count']),
  shieldDown: Object.freeze(['layer', 'player', 'actor', 'targetId']),
  engineOut: Object.freeze(['player', 'targetId', 'targetName']),
  npcHit: Object.freeze(['targetId', 'targetName', 'damage', 'count']),
  npcDisabled: Object.freeze(['targetId', 'targetName']),
  npcDestroyed: Object.freeze(['targetId', 'targetName']),
  npcSurrendered: Object.freeze(['targetId', 'targetName', 'outcome']),
  mineHit: Object.freeze(['asteroidId', 'count']),
  mineBlocked: Object.freeze(['asteroidId', 'oreKey', 'hardness', 'needs', 'line']),
  podSpawned: Object.freeze(['podId']),
  podCollected: Object.freeze(['podId']),
  landmarkFound: Object.freeze(['id', 'name', 'line']),
  clueFound: Object.freeze(['id', 'line']),
  convergence: Object.freeze(['id', 'line']),
  deepening: Object.freeze(['id', 'line']),
  survivorRescued: Object.freeze(['faction', 'source', 'count', 'repDelta']),
  survivorSold: Object.freeze(['faction', 'source', 'count', 'credits', 'repDelta']),
  epicStage: Object.freeze(['id', 'faction', 'stage', 'line']),
  fearChanged: Object.freeze(['fear']),
  jobState: Object.freeze(['id', 'kind', 'outcome', 'pay']),
  milestone: Object.freeze(['id', 'line', 'cause', 'targetId', 'targetName']),
  originChosen: Object.freeze(['id', 'line']),
  saveBlocked: Object.freeze(['reason']),
  reticleLock: Object.freeze(['hit']),
  playerDestroyed: Object.freeze([]),
  recovered: Object.freeze(['source']),
  bodyHit: Object.freeze(['kind', 'speed', 'damage', 'count']),
});

/** Ship-carrying events: identity is derived as primitives; ship never copied. */
const SHIP_DERIVE = new Set([
  'engineOut', 'npcHit', 'npcDisabled', 'npcDestroyed', 'npcSurrendered',
]);

/** Repeat-collapse key per type (same key + type folds into count, newest kept). */
const COLLAPSE_KEY = Object.freeze({
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
  return out;
}

export function noCtxObservation() {
  return { v: VERSION, t: 0, ok: false, error: 'no-ctx', agentOptIn: false, events: [] };
}

/**
 * One act receipt. `error` is refusal text only; `notice` is the player-visible
 * line a successful action displayed (issue #64) — station success notices used
 * to ride `error`, which read as a failure to every caller. Both are always
 * present strings, filtered through str(), so a receipt never inherits a value
 * from the preceding request. Not a version bump: `notice` is additive.
 */
export function actResult({ ok, error = '', name = '', token = '', status = '', reqId = '', t = null, notice = '' }) {
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
    const nm = (st && typeof st.name === 'string' && st.name)
      || (rec && typeof rec.name === 'string' && rec.name)
      || '';
    if (nm) out.targetName = nm;
  }
  if ((type === 'podSpawned' || type === 'podCollected')
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
    if (key === 'podId' && Object.hasOwn(out, key)
      && (type === 'podSpawned' || type === 'podCollected')) continue; // derived above
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
  return out;
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

export const ROLE_STATUS = Object.freeze({
  session: Object.freeze({
    status: 'supported',
    commands: Object.freeze(['startGame', 'chooseOrigin', 'recover', 'ping', 'disable']),
    note: 'title/origin/death lifecycle; recovery rides the death overlay path',
  }),
  pilot: Object.freeze({
    status: 'supported',
    commands: Object.freeze([
      'plotRoute', 'clearRoute', 'engageAutopilot', 'cancelAutopilot',
      'approachDock', 'dock', 'undock', 'pulse', 'afterburner',
      'setControl', 'clearControl',
    ]),
    note: 'routes/AP/gates plus a bounded expiring manual-control lease',
  }),
  trader: Object.freeze({
    status: 'supported',
    commands: Object.freeze(['openService', 'trade', 'repairAll', 'feed', 'stationAction']),
    note: 'market fill prices, repair, bio feed; desk rows and notices observed',
  }),
  miner: Object.freeze({
    status: 'supported',
    commands: Object.freeze(['selectTarget', 'setWeaponGroup', 'engageAutomine', 'cancelAutomine', 'setControl', 'clearControl']),
    note: 'rock identity/ore/hardness, automine channel, cargo/job progress',
  }),
  combat: Object.freeze({
    status: 'supported',
    commands: Object.freeze(['selectTarget', 'pulse', 'setWeaponGroup', 'setControl', 'clearControl', 'afterburner', 'hail', 'hailResolve']),
    note: 'HUD-derived aim/lead + lease fireHeld; hit/shield/destruction ring outcomes',
  }),
  hail: Object.freeze({
    status: 'supported',
    commands: Object.freeze(['hail', 'hailResolve']),
    note: 'demand/surrender/salvage/conversation cards: observe speaker, kind and displayed terms; resolve by listed intent, optionally bound to conversationId',
  }),
  missions: Object.freeze({
    status: 'supported',
    commands: Object.freeze(['openService', 'acceptJob']),
    note: 'board offers docked; active jobs observed in flight; jobState ring terminals',
  }),
  explorer: Object.freeze({
    status: 'supported',
    commands: Object.freeze(['plotRoute', 'engageAutopilot', 'setControl', 'clearControl', 'pulse']),
    note: 'landmark/clue discovery observed via landmarkFound/clueFound ring outcomes',
  }),
  rescue: Object.freeze({
    status: 'supported',
    commands: Object.freeze(['selectTarget', 'pulse', 'setControl', 'clearControl', 'openService', 'stationAction']),
    note: 'pod identity/range observed; scoop, dock and People desk resolve survivors',
  }),
  services: Object.freeze({
    status: 'supported',
    commands: Object.freeze(['openService', 'stationAction', 'undock']),
    note: 'bar/outfitting/people/epics/shipyard/launch via exact player closures',
  }),
});

export const COMMAND_SPECS = Object.freeze({
  ping: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['session']) }),
  disable: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['session']) }),
  startGame: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['session']) }),
  chooseOrigin: Object.freeze({ args: Object.freeze({ id: 'origin id string' }), roles: Object.freeze(['session']) }),
  recover: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['session']) }),
  plotRoute: Object.freeze({ args: Object.freeze({ dest: 'system id string' }), roles: Object.freeze(['pilot', 'explorer']) }),
  clearRoute: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['pilot']) }),
  engageAutopilot: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['pilot']) }),
  cancelAutopilot: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['pilot']) }),
  approachDock: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['pilot']) }),
  engageAutomine: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['miner']) }),
  cancelAutomine: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['miner']) }),
  dock: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['pilot']) }),
  undock: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['pilot', 'services']) }),
  hail: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['hail', 'combat']) }),
  hailResolve: Object.freeze({
    args: Object.freeze({
      intent: 'listed intent string',
      index: '1-based intent index (alternative)',
      expectedConversationId: 'optional observe().hail.conversationId; a replaced card refuses token stale',
    }),
    roles: Object.freeze(['hail', 'combat']),
  }),
  selectTarget: Object.freeze({ args: Object.freeze({ id: 'optional nearby target id; omit to cycle' }), roles: Object.freeze(['combat', 'miner', 'rescue']) }),
  pulse: Object.freeze({ args: Object.freeze({ edge: "'dock'|'hail'|'target'|'reticleLock'" }), roles: Object.freeze(['pilot', 'combat', 'miner', 'explorer', 'rescue']) }),
  afterburner: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['pilot', 'combat']) }),
  setWeaponGroup: Object.freeze({ args: Object.freeze({ n: 'integer 1..5' }), roles: Object.freeze(['combat', 'miner']) }),
  setControl: Object.freeze({
    args: Object.freeze({
      seq: 'strictly increasing integer per session',
      ttl: 'sim seconds 0.05..5 (default 1)',
      steerX: '-1..1 optional', steerY: '-1..1 optional',
      strafeX: '-1..1 optional', strafeY: '-1..1 optional',
      roll: '-1..1 optional',
      throttle: '0..1 setpoint target optional (ramps at player rate)',
      fireHeld: 'boolean optional', driftHeld: 'boolean optional',
    }),
    roles: Object.freeze(['pilot', 'combat', 'miner', 'explorer', 'rescue']),
    outcomes: Object.freeze(['active', 'cleared', 'expired', 'suppressed']),
  }),
  clearControl: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['pilot', 'combat', 'miner', 'explorer', 'rescue']) }),
  openService: Object.freeze({ args: Object.freeze({ id: 'dock service id' }), roles: Object.freeze(['trader', 'missions', 'services', 'rescue']) }),
  acceptJob: Object.freeze({ args: Object.freeze({ id: 'offered job id' }), roles: Object.freeze(['missions']) }),
  trade: Object.freeze({
    args: Object.freeze({ commodity: 'commodity key', qty: 'integer 1..min(99, capacity)', side: "'buy'|'sell'" }),
    roles: Object.freeze(['trader']),
  }),
  repairAll: Object.freeze({ args: Object.freeze({}), roles: Object.freeze(['trader']) }),
  feed: Object.freeze({ args: Object.freeze({ kind: "'biomass'|'rock'|'tend'" }), roles: Object.freeze(['trader']) }),
  stationAction: Object.freeze({
    args: Object.freeze({
      n: 'integer action index from observe().station.view.actions',
      expect: 'optional exact button label; mismatch refuses token stale',
    }),
    roles: Object.freeze(['trader', 'missions', 'services', 'rescue']),
    note: 'invokes the exact player button closure of the current docked view; confirmations stay two-step',
  }),
});

export const SERVICE_SPECS = Object.freeze({
  market: Object.freeze({ status: 'supported', actions: 'trade + desk buttons (+1/+5/-1/-5, seed/data papers)' }),
  jobs: Object.freeze({ status: 'supported', actions: 'acceptJob + board accept buttons' }),
  bar: Object.freeze({ status: 'supported', actions: 'buyRound' }),
  feed: Object.freeze({ status: 'supported', actions: 'feedBiomass/feedRock/tendWounds' }),
  repair: Object.freeze({ status: 'supported', actions: 'repairAll' }),
  outfitting: Object.freeze({ status: 'supported', actions: 'cargo rack, scanners, concealed mounts, mining heads, launcher/turret papers (arm/confirm/cancel)' }),
  people: Object.freeze({ status: 'supported', actions: 'rescue return, ask around, call in favor, sworn gift/Chain transfer/launder papers' }),
  launch: Object.freeze({ status: 'supported', actions: 'undock' }),
  epics: Object.freeze({ status: 'supported', actions: 'restitution papers (arm/confirm/cancel)' }),
  shipyard: Object.freeze({ status: 'supported', actions: 'hangar mount/graft/train + yard hull papers (arm/confirm/cancel)' }),
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
