/**
 * Agent API v1 schema. Authored names, tokens, JSON-plain helpers.
 * No DOM. No THREE. No persist. Prototype-safe (Object.hasOwn / Set).
 */

export const VERSION = 1;
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
const SESSION_LIVE = new Set(['startGame', 'chooseOrigin']);
const EVADE_LIVE = new Set(['afterburner']);
const APPROACH_LIVE = new Set(['approachDock']);
const LIVE = new Set([
  ...PR1_LIVE, ...PR2_LIVE, ...PR3_LIVE, ...SESSION_LIVE, ...EVADE_LIVE, ...APPROACH_LIVE,
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
  'navRoute',
  'autopilotEngaged',
  'autopilotDisengaged',
  'automineEngaged',
  'automineDisengaged',
  'jumpRequested',
  'systemLoaded',
  'playerHit',
  'shieldDown',
  'milestone',
  'originChosen',
  'saveBlocked',
  'playerFire',
  'reticleLock',
  'playerDestroyed',
  'recovered',
  'bodyHit',
]);

const KEEP_RING = new Set([
  'playerDestroyed', 'recovered', 'playerHit', 'bodyHit', 'shieldDown',
]);

const EVENT_TYPE_SET = new Set(EVENT_TYPES);

/** Extra primitive keys copied per authored event type. hailOpened never includes ship. */
const EVENT_FIELDS = Object.freeze({
  commLine: Object.freeze(['text', 'from', 'count']),
  docked: Object.freeze([]),
  undocked: Object.freeze([]),
  hailOpened: Object.freeze(['intents', 'salvage']),
  hailClosed: Object.freeze([]),
  navRoute: Object.freeze(['dest', 'hops', 'status']),
  autopilotEngaged: Object.freeze(['dest']),
  autopilotDisengaged: Object.freeze(['reason']),
  automineEngaged: Object.freeze(['asteroidId']),
  automineDisengaged: Object.freeze(['reason']),
  jumpRequested: Object.freeze(['to']),
  systemLoaded: Object.freeze(['to']),
  playerHit: Object.freeze(['damage', 'family', 'fromAft']),
  shieldDown: Object.freeze(['layer', 'player', 'actor', 'targetId']),
  milestone: Object.freeze(['id', 'line']),
  originChosen: Object.freeze(['id', 'line']),
  saveBlocked: Object.freeze(['reason']),
  playerFire: Object.freeze(['weapon']),
  reticleLock: Object.freeze(['hit']),
  playerDestroyed: Object.freeze([]),
  recovered: Object.freeze(['source']),
  bodyHit: Object.freeze(['kind', 'speed', 'damage']),
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

export function actResult({ ok, error = '', name = '', token = '', status = '' }) {
  const out = {
    v: VERSION,
    ok: ok === true,
    error: str(error),
    name: str(name),
    token: str(token),
  };
  const st = str(status);
  if (st) out.status = st;
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
  const fields = Object.hasOwn(EVENT_FIELDS, type) ? EVENT_FIELDS[type] : [];
  for (let i = 0; i < fields.length; i++) {
    const key = fields[i];
    if (typeof key !== 'string' || reservedName(key)) continue;
    if (!Object.hasOwn(raw, key)) continue;
    if (key === 'intents') {
      out.intents = stringList(raw.intents);
      continue;
    }
    if (type === 'commLine' && key === 'count') {
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
      if (!events[i] || !KEEP_RING.has(events[i].type)) {
        drop = i;
        break;
      }
    }
    if (drop < 0) drop = 0;
    events.splice(drop, 1);
  }
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
