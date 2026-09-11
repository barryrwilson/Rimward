/**
 * Departure clearance (issue #65). THREE-free, allocation-free after warmup.
 *
 * Docking parks the hull wherever the approach ended, still carrying the
 * inbound approach heading. The old launch only flipped `flags.docked`, so the
 * ship resumed flight on that retained heading and crept back into the hull it
 * had just left.
 *
 * This module answers one question and owns no world state:
 *
 *   "Where, and pointing which way, may this berth release the ship so that a
 *    hands-off pilot is still clear of every body five seconds later?"
 *
 * The release direction is the radial from the station centre out through the
 * ship — so every approach orientation gets its own departure lane, and the
 * nose ends up exactly outward (dot(nose, radial-away) = 1). The release POINT
 * is the first point along that ray that clears the real station cylinder
 * (PHY.STATION_CYL_*). Three segments are then checked with the same collision
 * primitives flight uses:
 *
 *   berth → release   the hull is swept out of the envelope; nothing may be
 *                     skipped over on the way
 *   release           the hull must sit clear of every body at rest
 *   release → +creep  the whole five-second hands-off run
 *
 * The march NEVER slides past an obstruction: the first non-station body on
 * any of those segments refuses the launch outright. Sliding further out would
 * be a teleport through whatever is parked at the berth mouth. The ray also
 * starts at the ship's own distance, so a launch never pulls the hull inward.
 *
 * Everything fails closed. A world that cannot be read, an owner hook that is
 * not registered for this context, or any obstruction all return a refusal;
 * the caller holds the berth untouched and explains why. There is no
 * "launch anyway" path — a launch without a verified pose is the bug.
 *
 * Nothing here writes ctx. The flight transform stays ship.js's; ctx.input
 * stays controls.js's — both hand this module a callback at init, keyed by
 * their own ctx, so station.js can ask the real owner to act (see
 * registerBerthFlight / registerBerthInput). Boot fixtures build several
 * contexts, so a hook registered by one context is never used for another.
 */

import { PHY } from './physics.js';
import { collectBodies, cylinderOverlap, sphereOverlap, torusOverlap } from './collision.js';

/** Hands-off window the release point and lane must survive (seconds). */
export const LAUNCH_HOLD_SECONDS = 5;
/** Clearance around the hull where the berth releases it and leaves it at rest. */
export const LAUNCH_RELEASE_MARGIN = 3;
/** Clearance around the hull along a swept segment. */
export const LAUNCH_CORRIDOR_MARGIN = 1.6;
/**
 * Ray march step (world units). Far below the probe diameter
 * (2 × (PHY.PLAYER_RADIUS + LAUNCH_CORRIDOR_MARGIN) = 8), so consecutive
 * probes overlap and no body — however small — can fall between samples.
 */
export const LAUNCH_STEP = 1;
/** Creep headroom: bio.speedFactor tops out at 1.08 (feral). */
export const LAUNCH_SPEED_HEADROOM = 1.1;
/** Hard bound on the outward march so a broken world cannot spin. */
export const LAUNCH_SEARCH_LIMIT = 400;
/** Fallback creep when config.ship is missing (light row, state.js). */
export const LAUNCH_FALLBACK_CREEP = 30;

const _bodies = { count: 0, items: [] };
const _ov = { hit: false, nx: 0, ny: 1, nz: 0, overlap: 0 };
const _plan = {
  ok: false,
  token: '',
  blocker: '',
  // Issue #105: the identity of the hull actually in the lane. blockerId is the
  // collision slot's ship id (collision.js already carries it), resolved back to
  // a LIVE hull before it is published — a stale or reused id names nobody.
  // Live ids are `record.id ?? 'npc-<n>'` (npc.js spawnLiveShip), so an id is a
  // nonempty string OR a finite number; null means "no identity". Every extra
  // field is a primitive, so the whole record stays JSON-safe.
  blockerId: null,
  blockerName: '',
  blockerRange: 0,
  x: 0, y: 0, z: 0,
  dirX: 1, dirY: 0, dirZ: 0,
  dist: 0,
  corridor: 0,
};
/** Slot id of the body the last overlapKind() call hit. null = none/unknown. */
let _blockId = null;
/** Cap on a world name in a player-facing line (save.js NAME_MAX is 24). */
const BLOCKER_NAME_MAX = 32;

const BLOCKER_LINES = Object.freeze({
  ship: 'Launch held — a hull is sitting in the departure lane. Wait for it to move, then launch again.',
  asteroid: 'Launch held — rock is drifting across the departure lane. Wait for it to pass, then launch again.',
  // Berths do not rotate and gate rings do not drift, so "wait and retry" would
  // be a lie for a gate. Say what is true: this lane is fouled by structure.
  gate: 'Launch held — a gate ring stands across this departure lane. The berth will not release you into it.',
  station: 'Launch held — the berth cannot find clear space to release you.',
});
const NO_SERVICE_LINE =
  'Launch held — flight control is not answering the berth. Stay docked and try again.';
const BLOCKER_FALLBACK =
  'Launch held — the departure lane is obstructed. Wait for it to clear, then launch again.';

/**
 * World names reach a player-facing line, so strip control characters and cap
 * the length here as well as at the source. Nothing downstream may build DOM
 * from this string with innerHTML; station.js and hud.js both use textContent.
 */
export function sanitizeBlockerName(value) {
  if (typeof value !== 'string') return '';
  let out = '';
  for (let i = 0; i < value.length && out.length < BLOCKER_NAME_MAX; i++) {
    const c = value.charCodeAt(i);
    if (c < 32 || c === 127) continue;
    out += value.charAt(i);
  }
  return out.trim();
}

/**
 * Player-facing, actionable line for a held launch. Always a non-empty string,
 * always starts with "Launch held" (station.js maps that prefix to a refusal).
 *
 * `detail` (issue #105) is optional identity for a hull in the lane:
 * { name, range, security }. It only ever ADDS truth to the generic line — a
 * missing name, a non-finite range, or a body that is not a hull all fall back
 * to the issue #65 copy, and `security` is only stated when the owner really
 * accepted the request.
 */
export function launchBlockedLine(token, blocker, detail) {
  if (token === 'no-service') return NO_SERVICE_LINE;
  const key = typeof blocker === 'string' ? blocker : '';
  const generic = Object.hasOwn(BLOCKER_LINES, key) ? BLOCKER_LINES[key] : BLOCKER_FALLBACK;
  if (key !== 'ship' || !detail || typeof detail !== 'object') return generic;
  const name = sanitizeBlockerName(detail.name);
  const range = num(detail.range) && detail.range >= 0 ? Math.round(detail.range) : -1;
  if (!name || range < 0) return generic;
  const who = `Launch held — ${name} is sitting in the departure lane, ${range}u out.`;
  return detail.security === true
    ? `${who} Station security has ordered it clear. Wait, then launch again.`
    : `${who} Wait for it to move, then launch again.`;
}

function num(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function readAxis(obj, key) {
  if (!obj || typeof obj !== 'object') return NaN;
  return num(obj[key]) ? obj[key] : NaN;
}

/**
 * Kind of the first body overlapping a probe sphere, '' when clear.
 * `skipStation` drops the station itself, for the segments where leaving the
 * envelope is the point of the march.
 */
function overlapKind(bodies, x, y, z, r, skipStation) {
  const items = bodies && bodies.items;
  const count = bodies && bodies.count ? bodies.count : 0;
  _blockId = null;
  for (let i = 0; i < count; i++) {
    const b = items[i];
    if (!b) continue;
    if (b.kind === 'player') continue;
    if (b.kind === 'station') {
      if (skipStation) continue;
      cylinderOverlap(x, y, z, r, b.x, b.y, b.z, b.r, b.y0, b.y1, _ov);
    } else if (b.kind === 'gate') {
      torusOverlap(x, y, z, r, b.x, b.y, b.z, b.r, b.y0, _ov);
    } else {
      sphereOverlap(x, y, z, r, b.x, b.y, b.z, b.r, _ov);
    }
    if (_ov.hit) {
      _blockId = usableId(b.id) ? b.id : null;
      return b.kind;
    }
  }
  return '';
}

function refuse(token, blocker) {
  _plan.ok = false;
  _plan.token = token;
  _plan.blocker = blocker;
  _plan.blockerId = null;
  _plan.blockerName = '';
  _plan.blockerRange = 0;
  _plan.dist = 0;
  _plan.corridor = 0;
  return _plan;
}

/**
 * A usable live-ship identity: the nonempty string spawnLiveShip mints, or a
 * finite number for records that carry one. Anything else names nobody.
 */
export function usableId(id) {
  if (typeof id === 'string') return id.length > 0;
  return typeof id === 'number' && Number.isFinite(id);
}

/** The live hull behind a collision slot id, or null. Never throws. */
function liveShipById(ctx, id) {
  if (!usableId(id)) return null;
  const ships = ctx && ctx.ships;
  if (!ships || typeof ships.length !== 'number') return null;
  for (let i = 0; i < ships.length; i++) {
    const s = ships[i];
    if (!s || s.id !== id) continue; // strict: '3' is not 3
    if (s.state && s.state.destroyed) return null;
    return s;
  }
  return null;
}

/**
 * Refuse and, for a hull, publish WHICH hull and how far away it is right now.
 * The id comes from the collision slot that actually fouled the march, so the
 * notice can never name a bystander. A body we cannot resolve back to a live
 * hull publishes nothing and the generic issue #65 line stands.
 *
 * The name is the one the player already sees: agent-observe.js
 * shipDisplayName — a masked Q-ship keeps its cover until a Mk II Wolfeye
 * pierces it, then record name, then state name, then 'CONTACT'. A hull with no
 * readable name is still identified, so the evacuation request is never lost
 * over cosmetics. Whether that hull may be ASKED to move is npc.js's call, and
 * a masked Q-ship is excluded there whatever this line displays.
 */
export function blockerDisplayName(ctx, live) {
  const rec = live && live.record;
  const st = live && live.state;
  const scanner = ctx && ctx.world && num(ctx.world.scanner) ? ctx.world.scanner : 0;
  const masked = !!(rec && rec.qship) && !rec.revealed;
  if (masked && !(scanner >= 2)) {
    const cover = sanitizeBlockerName(rec && rec.coverName);
    if (cover) return cover;
  }
  const named = sanitizeBlockerName(rec && rec.name) || sanitizeBlockerName(st && st.name);
  return named || 'CONTACT';
}

function refuseBlocked(ctx, kind, id, px, py, pz) {
  refuse('blocked', kind);
  if (kind !== 'ship') return _plan;
  const live = liveShipById(ctx, id);
  const pos = live && live.object && live.object.position;
  if (!pos || !num(pos.x) || !num(pos.y) || !num(pos.z)) return _plan;
  const range = Math.hypot(pos.x - px, pos.y - py, pos.z - pz);
  if (!num(range)) return _plan; // never publish a non-finite range
  _plan.blockerId = id;
  _plan.blockerName = blockerDisplayName(ctx, live);
  _plan.blockerRange = range;
  return _plan;
}

/** Creep run the lane must clear, in world units. */
export function launchCorridorLength(ctx) {
  const creep = readAxis(ctx && ctx.config && ctx.config.ship, 'creep');
  const base = creep > 0 ? creep : LAUNCH_FALLBACK_CREEP;
  return base * LAUNCH_SPEED_HEADROOM * LAUNCH_HOLD_SECONDS;
}

/**
 * Plan an ordinary departure. Returns a reused record (copy what you keep):
 *   { ok: true,  x, y, z, dirX, dirY, dirZ, dist, corridor }
 *   { ok: false, token: 'blocked' | 'no-service', blocker,
 *     blockerId, blockerName, blockerRange, dirX, dirY, dirZ }
 *
 * Both refusals hold the berth. 'no-service' means the world or an owner hook
 * could not be read — there is no safe pose to release into, so the ship stays
 * docked rather than resuming flight blind.
 */
export function planLaunch(ctx) {
  // Fail closed on the owners first: a plan is worthless if nobody can place
  // the pose or drop the stale input, and refusing here means the berth is
  // never half-mutated.
  if (!berthOwnersReady(ctx)) return refuse('no-service', '');

  const station = ctx && ctx.station && ctx.station.position;
  const obj = ctx && ctx.ship && ctx.ship.object;
  const pos = obj && obj.position;
  const sx = readAxis(station, 'x');
  const sy = readAxis(station, 'y');
  const sz = readAxis(station, 'z');
  const px = readAxis(pos, 'x');
  const py = readAxis(pos, 'y');
  const pz = readAxis(pos, 'z');
  if (!num(sx) || !num(sy) || !num(sz) || !num(px) || !num(py) || !num(pz)) {
    return refuse('no-service', '');
  }

  // Outward radial through the parked hull. A hull exactly on the centre has
  // no radial to preserve, so pick a deterministic axis — every direction
  // leaves a body that contains its own centre.
  let rx = px - sx;
  let ry = py - sy;
  let rz = pz - sz;
  let start = Math.hypot(rx, ry, rz);
  if (!(start > 1e-3)) {
    rx = 1; ry = 0; rz = 0;
    start = 0;
  } else {
    const inv = 1 / start;
    rx *= inv; ry *= inv; rz *= inv;
  }

  // Publish the lane axis BEFORE the marches: a hold hands station.js the same
  // radial the release would have used, so an evacuation request is aimed at the
  // real departure lane and not at a stale direction from an older launch.
  _plan.dirX = rx;
  _plan.dirY = ry;
  _plan.dirZ = rz;

  collectBodies(ctx, _bodies);
  const releaseR = PHY.PLAYER_RADIUS + LAUNCH_RELEASE_MARGIN;
  const laneR = PHY.PLAYER_RADIUS + LAUNCH_CORRIDOR_MARGIN;

  // 1. Release point: the first point on the ray, at or beyond the parked
  //    hull, that clears the station envelope. The berth may legitimately have
  //    parked the hull deep inside, so this march is unbounded (up to the
  //    search limit) — but it is the ONLY thing this march is allowed to walk
  //    past, and it never moves the hull inward.
  let release = -1;
  const outSteps = Math.ceil(Math.max(0, LAUNCH_SEARCH_LIMIT - start) / LAUNCH_STEP);
  for (let i = 0; i <= outSteps; i++) {
    const t = start + i * LAUNCH_STEP;
    if (!overlapKind(_bodies, sx + rx * t, sy + ry * t, sz + rz * t, releaseR, false)) {
      release = t;
      break;
    }
  }
  if (release < 0) {
    // Every sample was fouled. Name the body at the parked hull so the notice
    // is about the thing actually in the way.
    const near = overlapKind(_bodies, px, py, pz, releaseR, true);
    return refuseBlocked(ctx, near || 'station', _blockId, px, py, pz);
  }

  // 2. Berth exit sweep: the hull is placed at the release point in one step,
  //    so the segment it crosses must be free of traffic. Station overlap is
  //    expected here (that is what we are leaving) and is skipped; anything
  //    else refuses rather than being skipped over.
  const exitSteps = Math.ceil(Math.max(0, release - start) / LAUNCH_STEP);
  for (let i = 0; i <= exitSteps; i++) {
    const t = Math.min(start + i * LAUNCH_STEP, release);
    const kind = overlapKind(_bodies, sx + rx * t, sy + ry * t, sz + rz * t, laneR, true);
    if (kind) return refuseBlocked(ctx, kind, _blockId, px, py, pz);
  }

  // 3. The hands-off creep run. The station is convex about its own centre, so
  //    once the ray is outside it stays outside — only traffic, rock, and gate
  //    rings can foul the lane from here.
  const corridor = launchCorridorLength(ctx);
  const laneSteps = Math.ceil(corridor / LAUNCH_STEP);
  for (let i = 1; i <= laneSteps; i++) {
    const t = release + Math.min(i * LAUNCH_STEP, corridor);
    const kind = overlapKind(_bodies, sx + rx * t, sy + ry * t, sz + rz * t, laneR, false);
    if (kind) return refuseBlocked(ctx, kind, _blockId, px, py, pz);
  }

  _plan.ok = true;
  _plan.token = '';
  _plan.blocker = '';
  _plan.blockerId = null;
  _plan.blockerName = '';
  _plan.blockerRange = 0;
  _plan.x = sx + rx * release;
  _plan.y = sy + ry * release;
  _plan.z = sz + rz * release;
  _plan.dirX = rx;
  _plan.dirY = ry;
  _plan.dirZ = rz;
  _plan.dist = release;
  _plan.corridor = corridor;
  return _plan;
}

// ---------------------------------------------------------------------------
// Berth transition hooks. station.js owns the berth but owns neither the
// flight transform nor ctx.input; these let it ask the real owner to act
// synchronously, inside dock()/undock(), with no next-frame dependency.
//
// Registration is PER CONTEXT. Boot fixtures and probes build several contexts
// in one process; a module-global callback would silently answer for whichever
// context initialized last and move the wrong ship. A hook is only ever used
// for the ctx that registered it, and a context with no hook fails closed.

const FLIGHT_HOOKS = new WeakMap();
const INPUT_HOOKS = new WeakMap();

function hookable(ctx) {
  return !!ctx && (typeof ctx === 'object' || typeof ctx === 'function');
}

function hookFor(map, ctx) {
  if (!hookable(ctx)) return null;
  const fn = map.get(ctx);
  return typeof fn === 'function' ? fn : null;
}

/** ship.js only. fn(ctx, pose|null) → boolean. null pose = park at the berth. */
export function registerBerthFlight(ctx, fn) {
  if (!hookable(ctx)) return false;
  if (typeof fn !== 'function') {
    FLIGHT_HOOKS.delete(ctx);
    return false;
  }
  FLIGHT_HOOKS.set(ctx, fn);
  return true;
}

/** controls.js only. fn(ctx, 'dock'|'launch') neutralizes private input latches. */
export function registerBerthInput(ctx, fn) {
  if (!hookable(ctx)) return false;
  if (typeof fn !== 'function') {
    INPUT_HOOKS.delete(ctx);
    return false;
  }
  INPUT_HOOKS.set(ctx, fn);
  return true;
}

/** True when BOTH owners answer for this exact context. */
export function berthOwnersReady(ctx) {
  return !!hookFor(FLIGHT_HOOKS, ctx) && !!hookFor(INPUT_HOOKS, ctx);
}

/** Ask ship.js to park (pose null) or to place the launch pose. Never throws. */
export function applyBerthFlight(ctx, pose) {
  const fn = hookFor(FLIGHT_HOOKS, ctx);
  if (!fn) return false;
  try {
    return fn(ctx, pose || null) === true;
  } catch {
    return false;
  }
}

/**
 * Ask controls.js to drop every held key, pending pulse, and steering latch.
 * `mode` is 'dock' or 'launch'; both clear the throttle setpoint.
 */
export function applyBerthInput(ctx, mode) {
  const fn = hookFor(INPUT_HOOKS, ctx);
  if (!fn) return false;
  try {
    fn(ctx, mode === 'launch' ? 'launch' : 'dock');
    return true;
  } catch {
    return false;
  }
}
