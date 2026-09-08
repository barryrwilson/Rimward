import { ESCAPE, JUMP, SYSTEMS, SHIP_CLASSES, DEFENSE, U } from './state.js';
import {
  writeStationHold, visualClassFor, hullRadiusFor, STATION_HOLD_PAD,
} from './traffic-feel.js';
import { PHY } from './physics.js';
import {
  LAUNCH_HOLD_SECONDS, LAUNCH_RELEASE_MARGIN, LAUNCH_CORRIDOR_MARGIN,
  LAUNCH_STEP, LAUNCH_SPEED_HEADROOM, LAUNCH_FALLBACK_CREEP,
} from './launch-clearance.js';

/**
 * NPC escape plan — issue #68 (gate OR station refuge).
 *
 * Pure data + math. No THREE, no DOM, no ctx, no emits. Vectors are plain
 * `{x,y,z}` or JSON arrays so everything here rides save.js untouched.
 *
 * ONE plan owns a fleeing hull's destination, movement and condition:
 *
 *   rec.escape = {
 *     v, phase, kind, to, from, dest[3], pos[3], vel[3], speed, charge,
 *     dwellUntil, reason, threat, chosenAt, checkedAt, updatedAt,
 *     announced, sheltered, departed, cond{…}, peace{…}
 *   }
 *
 * phase   'route'  flying the committed leg
 *         'charge' physically arrived at the gate bore, spooling JUMP.chargeTime
 *         'hold'   parked in the station holding lane outside the cylinder
 *         'evade'  no viable route: away-from-threat run, retried on a cadence
 *         'done'   resolved (departed, sheltered-and-dwelt, or cancelled).
 *                  'done' still CARRIES cond/peace so a re-instantiated hull
 *                  never respawns healed or freshly hostile.
 * kind    'gate' | 'station' | null
 * reason  'gate' | 'station' | 'blocked' | 'no-route' | 'departed' |
 *         'sheltered' | 'cancelled'
 *
 * The plan is scoped to ships that actually flee. A legacy record without
 * `escape` keeps today's ordinary behavior everywhere.
 *
 * Nothing in this module heals a hull: `applyCondition` only ever writes back
 * values `captureCondition` read off the live ship, clamped to their own max.
 */

export const ESCAPE_VERSION = ESCAPE.version;

export const ESCAPE_PHASES = Object.freeze(['route', 'charge', 'hold', 'evade', 'done']);
export const ESCAPE_KINDS = Object.freeze(['gate', 'station']);
export const ESCAPE_REASONS = Object.freeze([
  'gate', 'station', 'blocked', 'no-route', 'departed', 'sheltered', 'cancelled',
]);

const PHASE_SET = new Set(ESCAPE_PHASES);
const KIND_SET = new Set(ESCAPE_KINDS);
const REASON_SET = new Set(ESCAPE_REASONS);
/** Phases where the plan owns movement, route progress and migration policy. */
const MOVING = new Set(['route', 'charge', 'hold', 'evade']);

/** Whitelisted condition scalars. Paired cur/max keys clamp on restore. */
const COND_NUMBERS = Object.freeze([
  'hull', 'hullMax', 'screen', 'screenMax', 'shell', 'shellMax',
  'engine', 'engineMax', 'heat', 'power', 'resolve',
  'lastHitAt', 'lastCombatAt', 'disabledDamage',
]);
const COND_PAIRS = Object.freeze([
  ['hull', 'hullMax'], ['screen', 'screenMax'], ['shell', 'shellMax'], ['engine', 'engineMax'],
]);
const COND_FLAGS = Object.freeze(['engineOut', 'disabled', 'destroyed', 'surrendered']);
/** Bounded peace/hail continuity. AI target refs stay session-only, never here. */
const PEACE_FLAGS = Object.freeze(['surrenderDone', 'demandSent', 'hailed', 'scratched', 'revealedByFlight']);
const DEMAND_OUTCOMES = new Set([
  'paid', 'bluffed', 'refused', 'failed', 'expired', 'docked', 'jumped', 'voided',
]);

const STRING_MAX = 48;

function fin(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function coord(n) {
  return fin(n) && Math.abs(n) <= ESCAPE.maxCoord;
}

/**
 * Validate a stored [x,y,z] IN PLACE — no allocation, so every per-frame
 * reader (position, movement, phase machine) uses this one.
 */
function vec3ok(a) {
  return Array.isArray(a) && a.length === 3 && coord(a[0]) && coord(a[1]) && coord(a[2]);
}

/**
 * Finite bounded [x,y,z] from an array or {x,y,z}. Null otherwise.
 * ALLOCATES: event-time only (planning, choice, restore sanitation). Frame
 * readers use vec3ok / writeEscapePosition instead.
 */
export function escapeVec(src) {
  if (!src || typeof src !== 'object') return null;
  const x = Array.isArray(src) ? src[0] : src.x;
  const y = Array.isArray(src) ? src[1] : src.y;
  const z = Array.isArray(src) ? src[2] : src.z;
  if (!coord(x) || !coord(y) || !coord(z)) return null;
  return [x, y, z];
}

function knownSystem(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= STRING_MAX
    && Object.hasOwn(SYSTEMS, id);
}

/** Cheap per-frame read. Returns the plan or null; never throws. */
export function readEscape(rec) {
  const plan = rec && typeof rec === 'object' ? rec.escape : null;
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return null;
  if (plan.v !== ESCAPE_VERSION) return null;
  if (!PHASE_SET.has(plan.phase)) return null;
  return plan;
}

/** True while the plan owns movement/route/migration for this record. */
export function escapeActive(rec) {
  const plan = readEscape(rec);
  return !!plan && MOVING.has(plan.phase);
}

/** True while the plan is committed to a real destination (not evading). */
export function escapeRouted(rec) {
  const plan = readEscape(rec);
  return !!plan && MOVING.has(plan.phase) && KIND_SET.has(plan.kind) && vec3ok(plan.dest);
}

/** Tracked escape position → out {x,y,z}. False when the plan has none. */
export function writeEscapePosition(plan, out) {
  if (!plan || !out || !vec3ok(plan.pos)) return false;
  out.x = plan.pos[0];
  out.y = plan.pos[1];
  out.z = plan.pos[2];
  return true;
}

/** Tracked distance to the committed destination. Infinity with no route. */
export function escapeRemaining(plan) {
  if (!plan || !vec3ok(plan.pos) || !vec3ok(plan.dest)) return Infinity;
  const d = Math.hypot(plan.dest[0] - plan.pos[0], plan.dest[1] - plan.pos[1], plan.dest[2] - plan.pos[2]);
  return fin(d) ? d : Infinity;
}

// ---------- destination choice ----------

/**
 * Distance from `t` to segment a→b plus the normalized projection along it.
 * Writes into the shared scratch record (no allocation) and returns it.
 */
const _clear = { dist: 0, t: 0 };
export function segmentClearance(ax, ay, az, bx, by, bz, tx, ty, tz) {
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;
  const len2 = abx * abx + aby * aby + abz * abz;
  let t = 0;
  if (len2 > 1e-9) t = ((tx - ax) * abx + (ty - ay) * aby + (tz - az) * abz) / len2;
  if (!fin(t)) t = 0;
  const ct = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + abx * ct - tx;
  const qy = ay + aby * ct - ty;
  const qz = az + abz * ct - tz;
  _clear.dist = Math.hypot(qx, qy, qz);
  _clear.t = t;
  return _clear;
}

/** The pursuer sits on this leg: reject the route while another exists. */
function legScreened(from, dest, threat) {
  if (!threat) return false;
  const c = segmentClearance(from[0], from[1], from[2], dest[0], dest[1], dest[2], threat[0], threat[1], threat[2]);
  return c.dist < ESCAPE.threatBubble && c.t > ESCAPE.threatAheadMin && c.t <= 1;
}

function towardness(from, dest, threat) {
  if (!threat) return 0;
  const dx = dest[0] - from[0];
  const dy = dest[1] - from[1];
  const dz = dest[2] - from[2];
  const tx = threat[0] - from[0];
  const ty = threat[1] - from[1];
  const tz = threat[2] - from[2];
  const dl = Math.hypot(dx, dy, dz);
  const tl = Math.hypot(tx, ty, tz);
  if (!(dl > 1e-6) || !(tl > 1e-6)) return 0;
  const dot = (dx * tx + dy * ty + dz * tz) / (dl * tl);
  return dot > 0 ? dot : 0;
}

// ---------- escape-only station refuge ring (issue #68) ----------
//
// An ordinary traffic hold clears the station cylinder, which is all a MOVING
// ship needs. An escapee PARKS in its refuge, and a stationary hull anywhere
// inside the berth's release march plus its five-second hands-off creep run
// refuses the player's launch for as long as it sits there (diagnostic-boot:
// Redmarch rec-49 at 83 u, planLaunch blocker=ship). The refuge therefore sits
// beyond that whole envelope. writeStationHold and ordinary traffic points are
// untouched; launch clearance itself is untouched and only lends its tuning.

/**
 * Widest hands-off creep run any SHIPPED class can make in the launch window.
 * Taken over the catalogue, not the hull in the seat, so a saved refuge stays
 * legal across a refit.
 */
const MAX_LAUNCH_CORRIDOR = (() => {
  let creep = LAUNCH_FALLBACK_CREEP;
  for (const key of Object.keys(SHIP_CLASSES)) {
    const c = SHIP_CLASSES[key].creep;
    if (fin(c) && c > creep) creep = c;
  }
  return creep * LAUNCH_SPEED_HEADROOM * LAUNCH_HOLD_SECONDS;
})();
/** Centred bounding SPHERE of the station body — every berth bearing, not the waist. */
const STATION_BOUND = Math.hypot(PHY.STATION_CYL_RADIUS,
  Math.max(Math.abs(PHY.STATION_CYL_Y0), Math.abs(PHY.STATION_CYL_Y1)));
/** Furthest out the release march can legitimately place the departing hull. */
const RELEASE_BOUND = Math.max(U.DOCK_RANGE,
  STATION_BOUND + PHY.PLAYER_RADIUS + LAUNCH_RELEASE_MARGIN + LAUNCH_STEP);
/** End of the swept corridor: no launch probe ever reaches past this. */
const LANE_BOUND = RELEASE_BOUND + MAX_LAUNCH_CORRIDOR;

/**
 * Minimum distance from the station centre for a refuge a `classKey` hull may
 * PARK in. The whole arrival ball is budgeted, not just the destination point:
 * a hull that stops ESCAPE.stationArrive short of the centre still leaves its
 * own radius and the swept player probe outside LANE_BOUND, with the hold pad
 * left over. `hullClass` is the real hull behind a Q-ship cover — masking
 * never buys a smaller clearance. hullRadiusFor is the visible target radius,
 * which for every shipped row is the larger of the visible and collision
 * radii; the hold pad carries the remaining headroom.
 */
export function escapeRefugeRadius(classKey, hullClass) {
  let r = hullRadiusFor(classKey);
  if (typeof hullClass === 'string' && hullClass !== classKey) {
    const alt = hullRadiusFor(hullClass);
    if (alt > r) r = alt;
  }
  return LANE_BOUND + PHY.PLAYER_RADIUS + LAUNCH_CORRIDOR_MARGIN + r
    + ESCAPE.stationArrive + STATION_HOLD_PAD;
}

/**
 * The refuge point: writeStationHold's stable, hull-safe bearing (station →
 * runner in XZ, y clamped into the cylinder band), extended out to the refuge
 * radius. Same lane, same bearing, far enough out to be parked in.
 */
function escapeStationRefuge(station, classKey, from, hullClass) {
  const hold = writeStationHold({ x: 0, y: 0, z: 0 },
    { x: station[0], y: station[1], z: station[2] },
    classKey, { x: from[0], y: from[1], z: from[2] });
  const dx = hold.x - station[0];
  const dz = hold.z - station[2];
  const len = Math.hypot(dx, dz);
  const want = escapeRefugeRadius(classKey, hullClass);
  if (len > 1e-6 && len < want) {
    const k = want / len;
    hold.x = station[0] + dx * k;
    hold.z = station[2] + dz * k;
  }
  return hold;
}

/**
 * Is a COMMITTED station destination still outside the launch envelope? A hold
 * saved before this ring existed, or one a collision pushed inward, is not a
 * legal place to park any more and must be re-chosen rather than flown to.
 */
export function stationRefugeSafe(rec, sysId, dest) {
  if (!vec3ok(dest)) return false;
  if (!knownSystem(sysId)) return false;
  const station = SYSTEMS[sysId].station;
  const at = station && escapeVec(station.position);
  if (!at) return true; // no authored station: nothing to clear
  const need = escapeRefugeRadius(escapeHullClass(rec), rec && rec.classKey);
  return Math.hypot(dest[0] - at[0], dest[1] - at[1], dest[2] - at[2]) >= need - 1e-6;
}

/** Data-side gate list for a system, or null. Hub routes are never included. */
export function escapeGatesOf(sysId) {
  if (!knownSystem(sysId)) return null;
  const gates = SYSTEMS[sysId].gates;
  return Array.isArray(gates) && gates.length > 0 ? gates : null;
}

/** A physical edge back to `sysId` makes the crossing followable both ways. */
function hasReturnEdge(to, sysId) {
  const gates = escapeGatesOf(to);
  if (!gates) return false;
  for (let i = 0; i < gates.length; i++) if (gates[i] && gates[i].to === sysId) return true;
  return false;
}

/**
 * The AUTHORED physical gate of `sysId` leading to `to`, or null. This is the
 * only source of a gate position anywhere in the escape path — a restored or
 * hand-edited plan can carry any coordinates it likes, so both the terminal
 * departure guard and the revalidation pass re-derive the real edge here.
 */
export function authoredGate(sysId, to) {
  const gates = escapeGatesOf(sysId);
  if (!gates || !knownSystem(to) || to === sysId) return null;
  for (let i = 0; i < gates.length; i++) {
    const g = gates[i];
    if (g && g.to === to && escapeVec(g.position)) return g;
  }
  return null;
}

/**
 * Is the COMMITTED leg still worth flying? A commitment is abandoned only
 * when the destination stopped being real or the pursuer actually moved onto
 * the leg — not because the runner drifted a few units and a recomputed
 * endpoint would land somewhere marginally different. Called on the
 * revalidate cadence, never per frame.
 */
export function escapeLegViable(plan, sysId, fromPos, threatPos, rec) {
  if (!plan || !KIND_SET.has(plan.kind) || !vec3ok(plan.dest)) return false;
  const from = escapeVec(fromPos);
  if (!from) return false;
  if (plan.kind === 'gate') {
    const g = authoredGate(sysId, plan.to);
    const at = g && escapeVec(g.position);
    if (!at) return false;
    if (Math.hypot(at[0] - plan.dest[0], at[1] - plan.dest[1], at[2] - plan.dest[2]) > 1) return false;
  } else if (rec && !stationRefugeSafe(rec, sysId, plan.dest)) {
    // A hold inside the launch envelope (a legacy save, or one a collision
    // pushed inward) is no longer a legal place to park: re-choose.
    return false;
  }
  return !legScreened(from, plan.dest, escapeVec(threatPos));
}

/**
 * Score the viable physical gates of `sysId` and the station holding lane
 * against each other, and commit to one.
 *
 * opts: { sysId, fromPos, threatPos?, stationPos?, classKey?, engineOut? }
 * Returns { ok, kind, to, dest[3], reason, index, blocked } — `ok:false` with
 * reason 'blocked' (every candidate screened by the pursuer) or 'no-route'
 * (no candidate exists at all). Never invents a destination.
 */
export function chooseEscapeDestination(opts) {
  const sysId = opts && opts.sysId;
  const from = escapeVec(opts && opts.fromPos);
  const out = { ok: false, kind: null, to: null, dest: null, reason: 'no-route', index: -1, blocked: 0 };
  if (!from || !knownSystem(sysId)) return out;
  const threat = escapeVec(opts.threatPos);
  const engineOut = opts.engineOut === true;
  const gates = escapeGatesOf(sysId);
  let best = null;
  let bestScore = Infinity;
  let candidates = 0;
  let blocked = 0;

  const consider = (kind, to, dest, index, returnEdge) => {
    candidates++;
    if (legScreened(from, dest, threat)) {
      blocked++;
      return;
    }
    const dist = Math.hypot(dest[0] - from[0], dest[1] - from[1], dest[2] - from[2]);
    if (!fin(dist)) return;
    let score = dist * (1 + ESCAPE.threatBearingWeight * towardness(from, dest, threat));
    if (kind === 'gate' && !returnEdge) score *= ESCAPE.noReturnPenalty;
    if (kind === 'station' && engineOut) score *= ESCAPE.engineOutStationBias;
    if (!fin(score)) return;
    // Stable order breaks ties: gates in authored order, station last.
    if (score < bestScore) {
      bestScore = score;
      best = { kind, to, dest, index };
    }
  };

  if (gates) {
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i];
      if (!g || typeof g !== 'object') continue;
      const to = g.to;
      if (!knownSystem(to) || to === sysId) continue; // unknown / self destinations are not routes
      const dest = escapeVec(g.position);
      if (!dest) continue;
      consider('gate', to, dest, i, hasReturnEdge(to, sysId));
    }
  }
  const station = escapeVec(opts.stationPos);
  if (station) {
    const dest = escapeVec(escapeStationRefuge(station, opts.classKey, from, opts.hullClass));
    if (dest) consider('station', null, dest, gates ? gates.length : 0, false);
  }

  out.blocked = blocked;
  if (!best) {
    out.reason = candidates > 0 ? 'blocked' : 'no-route';
    return out;
  }
  out.ok = true;
  out.kind = best.kind;
  out.to = best.to;
  out.dest = best.dest;
  out.index = best.index;
  out.reason = best.kind;
  return out;
}

/**
 * Did this hull's retained snapshot record a peace the player actually earned?
 * Capitulation sets the surrender flags, but a REAL paid ransom/tribute or a
 * landed bluff (hail.js) sets neither — it stamps demandOutcome and a calm
 * window, then flees. The calm expires inside a 60-120 s crossing, so without
 * this the same hull came back through the gate hunting the player who had
 * just bought it off. Bounded to the two outcomes that are a bought peace.
 */
export function escapeYielded(plan) {
  if (!plan) return false;
  const flags = plan.cond && plan.cond.flags;
  if (flags && flags.surrendered === true) return true;
  const peace = plan.peace;
  if (!peace) return false;
  return peace.surrenderDone === true
    || peace.demandOutcome === 'paid' || peace.demandOutcome === 'bluffed';
}

/**
 * Tagged escape trail for a committed refuge. Shared by the live stamp
 * (npc.js) and the off-screen re-choice (world.js) so a rerouted runner never
 * leaves a trail naming the destination it abandoned. Pirate/ace only — the
 * wave-30 wake contract — and JSON-plain.
 */
export function writeEscapeWakeSite(rec, plan, role) {
  if ((role !== 'pirate' && role !== 'ace') || !rec) return false;
  if (!plan || !KIND_SET.has(plan.kind) || !vec3ok(plan.dest)) return false;
  rec.wakeSite = {
    position: [plan.dest[0], plan.dest[1], plan.dest[2]],
    found: false,
    kind: plan.kind,
    to: plan.kind === 'gate' ? plan.to : null,
    from: rec.system ?? null,
  };
  return true;
}

/**
 * The role default a hull flies when nothing else owns it. ONE copy, shared by
 * npc.js (construction and escape resolution) and save.js's restore heal.
 */
export function escapeRoleMode(role) {
  if (role === 'pirate') return 'hunt';
  if (role === 'ace') return 'duel';
  if (role === 'trader') return 'route';
  if (role === 'miner') return 'mine';
  return 'loiter';
}

/**
 * The one choose-and-commit both runners use: the live hull (npc.js) and the
 * off-screen record (world.js) derived the station refuge, the visible hull
 * class and the engine-out weighting separately and then called the same two
 * functions in the same order. This is that sequence, once.
 */
export function replanEscape(rec, opts) {
  const sysId = opts && opts.sysId;
  if (!rec || !knownSystem(sysId)) return null;
  const station = SYSTEMS[sysId].station;
  const choice = chooseEscapeDestination({
    sysId,
    fromPos: opts.pos,
    threatPos: opts.threatPos ?? null,
    stationPos: station ? station.position : null,
    classKey: escapeHullClass(rec),
    hullClass: rec.classKey,
    engineOut: opts.engineOut === true,
  });
  return writeEscapePlan(rec, choice, { now: opts.now, pos: opts.pos, sysId });
}

/** Hull class the lane actually sees (a masked Q-ship uses its cover hull). */
export function escapeHullClass(rec) {
  const key = visualClassFor(rec);
  return typeof key === 'string' && Object.hasOwn(SHIP_CLASSES, key) ? key : 'light';
}

// ---------- plan lifecycle ----------

function emptyCond() {
  return { flags: {} };
}

/**
 * Commit `choice` onto the record. Reuses the existing plan object (and its
 * cond/peace snapshots) so a reroute keeps the encounter's condition and never
 * allocates per frame — planning happens at flee entry and on the revalidate
 * cadence only.
 */
export function writeEscapePlan(rec, choice, info) {
  if (!rec || typeof rec !== 'object') return null;
  const now = fin(info && info.now) ? info.now : 0;
  const pos = escapeVec(info && info.pos) || [0, 0, 0];
  let plan = readEscape(rec);
  if (!plan) {
    plan = {
      v: ESCAPE_VERSION,
      phase: 'route',
      kind: null,
      to: null,
      from: null,
      dest: null,
      pos: [pos[0], pos[1], pos[2]],
      vel: [0, 0, 0],
      speed: 0,
      charge: 0,
      dwellUntil: 0,
      reason: 'no-route',
      threat: null,
      threatId: null,
      threatAt: null,
      chosenAt: now,
      checkedAt: now,
      updatedAt: now,
      announced: false,
      sheltered: false,
      departed: false,
      cond: null,
      peace: null,
    };
    rec.escape = plan;
  }
  const routed = !!(choice && choice.ok);
  // The station hold is derived from the runner's own bearing, so a hull that
  // moved a few units recomputes a point a few units away. That is the SAME
  // physical endpoint, not a new decision: treat it as unchanged and keep the
  // committed coordinates, or every revalidation would re-announce the route,
  // reset the phase and re-fire the arrival receipt.
  // A hull that has already REACHED its holding lane is a stronger case of the
  // same thing: the hold is derived from the runner's own bearing, so once it
  // is sitting IN the lane every re-derivation names a different point on that
  // circle — up to two hold radii away, well past sameDest. Re-committing to
  // it would knock the phase back to 'route' and walk a sheltering hull around
  // the station forever, every time renewed pressure re-runs the choice. This
  // is the SAME refuge: keep the point it is holding at. The choice is still
  // genuinely re-run — if the chooser now prefers a gate (or any other
  // destination) the kind/to comparison below abandons the hold as before.
  // …but only while the point it is holding is still a LEGAL place to park.
  // An unsafe hold (legacy save, or one a collision pushed inside the launch
  // envelope) must be allowed to move to the new refuge.
  const holding = plan.phase === 'hold' && plan.kind === 'station' && vec3ok(plan.dest)
    && stationRefugeSafe(rec, plan.from ?? (info && info.sysId), plan.dest);
  const changed = !routed
    || plan.kind !== choice.kind
    || plan.to !== choice.to
    || !vec3ok(plan.dest)
    || (!(holding && choice.kind === 'station')
      && Math.hypot(plan.dest[0] - choice.dest[0], plan.dest[1] - choice.dest[1],
        plan.dest[2] - choice.dest[2]) > ESCAPE.sameDest);
  plan.from = knownSystem(info && info.sysId) ? info.sysId : plan.from;
  // plan.threat/threatId/threatAt are owned by captureCondition, which reads
  // the runner's actual pursuer; a re-choice must not wipe who it is fleeing.
  plan.pos[0] = pos[0];
  plan.pos[1] = pos[1];
  plan.pos[2] = pos[2];
  plan.checkedAt = now;
  plan.updatedAt = now;
  if (routed) {
    // A genuinely NEW escape episode: the previous run resolved (arrival keeps
    // the plan, and its departure latch with it) and this record is committing
    // to a fresh route. Clear the terminal receipt latch HERE and only here —
    // a restore, a revalidation or a re-commit of the same run never reaches a
    // 'done' phase, so the old crossing stays idempotent.
    if (plan.phase === 'done') {
      if (plan.departed === true) plan.departed = false;
      plan.sheltered = false;
      plan.dwellUntil = 0;
    }
    if (changed) {
      plan.chosenAt = now;
      plan.announced = false;
      plan.charge = 0;
      // The arrival latch belongs to the EPISODE, not to the endpoint. Moving
      // an already-sheltered hull to a legal hold at the SAME station — a
      // legacy inner hold clearing the launch envelope, or one a collision
      // pushed inward — is the same shelter it already announced, so it must
      // not fire a second arrival receipt. A new episode cleared the latch
      // above, with everything else.
      if (!(plan.sheltered === true && choice.kind === 'station')) {
        plan.sheltered = false;
        plan.dwellUntil = 0;
      }
    }
    plan.kind = choice.kind;
    plan.to = choice.kind === 'gate' ? choice.to : null;
    plan.dest = plan.dest && plan.dest.length === 3 ? plan.dest : [0, 0, 0];
    // Only a REAL change moves the endpoint; otherwise the committed
    // coordinates stand so the hull keeps flying the leg it announced.
    if (changed) {
      plan.dest[0] = choice.dest[0];
      plan.dest[1] = choice.dest[1];
      plan.dest[2] = choice.dest[2];
      plan.phase = 'route';
    } else if (plan.phase !== 'charge' && plan.phase !== 'hold') {
      plan.phase = 'route';
    }
    plan.reason = choice.kind;
  } else {
    const reason = choice && choice.reason === 'blocked' ? 'blocked' : 'no-route';
    // Announce a LOSS of route once, not on every revalidation tick: the
    // no-route line repeats only when the situation actually changed.
    if (plan.kind !== null || plan.reason !== reason || plan.phase !== 'evade') plan.announced = false;
    plan.kind = null;
    plan.to = null;
    plan.dest = null;
    plan.charge = 0;
    plan.sheltered = false;
    plan.dwellUntil = 0;
    plan.reason = reason;
    plan.phase = 'evade';
  }
  return plan;
}

/**
 * Retire the movement plan but KEEP the condition/peace snapshots: a resolved
 * escapee must not respawn healed, nor forget that it already yielded.
 */
export function finishEscape(rec, reason) {
  const plan = readEscape(rec);
  if (!plan) return null;
  plan.phase = 'done';
  plan.kind = null;
  plan.to = null;
  plan.dest = null;
  plan.charge = 0;
  plan.dwellUntil = 0;
  plan.reason = REASON_SET.has(reason) ? reason : 'cancelled';
  return plan;
}

/** A destroyed/captured hull cannot escape; drop the plan outright. */
export function cancelEscape(rec) {
  if (rec && typeof rec === 'object' && rec.escape) delete rec.escape;
}

// ---------- condition + peace continuity ----------

/**
 * Snapshot the live hull's actual condition onto the plan. In-place writes
 * only — allocation happens once, on the first capture for a record.
 */
export function captureCondition(plan, state, ai, now) {
  if (!plan || !state) return null;
  const cond = plan.cond && typeof plan.cond === 'object' ? plan.cond : (plan.cond = emptyCond());
  if (!cond.flags || typeof cond.flags !== 'object') cond.flags = {};
  for (let i = 0; i < COND_NUMBERS.length; i++) {
    const key = COND_NUMBERS[i];
    const v = state[key];
    if (fin(v)) cond[key] = v;
  }
  for (let i = 0; i < COND_FLAGS.length; i++) {
    const key = COND_FLAGS[i];
    cond.flags[key] = state[key] === true;
  }
  cond.disabledSince = fin(state.disabledSince) ? state.disabledSince : null;
  if (ai) {
    const peace = plan.peace && typeof plan.peace === 'object' ? plan.peace : (plan.peace = {});
    for (let i = 0; i < PEACE_FLAGS.length; i++) {
      const key = PEACE_FLAGS[i];
      if (ai[key] !== undefined) peace[key] = ai[key] === true;
    }
    peace.demandOutcome = DEMAND_OUTCOMES.has(ai.demandOutcome) ? ai.demandOutcome : null;
    peace.calmUntil = fin(ai.calmUntil) ? ai.calmUntil : 0;
    // WHO the runner is fleeing. The live handle is session-only, so what
    // persists is the pursuer's own record id and the last position actually
    // observed — enough to re-find the same hull, or to keep running from
    // where it was last seen, instead of falling back on the player.
    const src = ai.fleeFrom;
    if (src && typeof src === 'object') {
      const id = (src.record && src.record.id) ?? src.id;
      const p = src.object && src.object.position;
      plan.threat = 'ship';
      plan.threatId = typeof id === 'string' ? id.slice(0, STRING_MAX) : null;
      if (p && coord(p.x) && coord(p.y) && coord(p.z)) {
        if (!vec3ok(plan.threatAt)) plan.threatAt = [0, 0, 0];
        plan.threatAt[0] = p.x;
        plan.threatAt[1] = p.y;
        plan.threatAt[2] = p.z;
      }
    } else if (src === 'player') {
      plan.threat = 'player';
      plan.threatId = null;
      plan.threatAt = null;
    } else if (plan.threat !== 'ship') {
      plan.threat = null;
      plan.threatId = null;
      plan.threatAt = null;
    }
    // else: a remembered NPC hunter that simply is not live right now. makeAi
    // leaves the handle null in exactly that case and threatPos falls back on
    // the saved id/position — so the ordinary sync, save and removal that
    // follow must NOT erase the memory they exist to carry. It is replaced
    // only by a new pursuer or by the player becoming the threat.
  }
  if (fin(now)) plan.updatedAt = now;
  return cond;
}

/**
 * Fold a LIVE hull's real position, velocity and condition into its plan.
 * Zero allocation, in-place writes only. This is the ONE capture used by the
 * per-frame sync, by the removal boundary (range cull and the player's own
 * jump) and by the save snapshot — so a blob, a despawn and a restore all
 * see the ship as it is right now, including damage or a hail outcome
 * applied earlier in the SAME frame.
 */
export function captureEscapeLive(plan, object, state, ai, now) {
  if (!plan || typeof plan !== 'object') return false;
  const p = object && object.position;
  if (p && vec3ok(plan.pos) && coord(p.x) && coord(p.y) && coord(p.z)) {
    plan.pos[0] = p.x;
    plan.pos[1] = p.y;
    plan.pos[2] = p.z;
  }
  // A DARK hull's real motion is its drift, not the velocity the steering
  // loop last wrote: updateDisabled coasts the wreck along ai.driftVel and
  // never touches ai.velocity again. Capturing the stale steering vector made
  // the fold and the save disagree with what the player was watching, and the
  // off-screen record then had no drift to continue.
  const drifting = !!state && (state.disabled === true || (ai && ai.mode === 'drift'));
  const v = ai && (drifting && ai.driftVel ? ai.driftVel : ai.velocity);
  if (v && vec3ok(plan.vel) && fin(v.x) && fin(v.y) && fin(v.z)) {
    plan.vel[0] = v.x;
    plan.vel[1] = v.y;
    plan.vel[2] = v.z;
    const sp = Math.hypot(v.x, v.y, v.z);
    plan.speed = fin(sp) ? Math.min(sp, ESCAPE.maxSpeed) : 0;
  }
  captureCondition(plan, state, ai, now);
  return true;
}

function clampPair(state, curKey, maxKey) {
  const max = state[maxKey];
  if (!fin(max) || max < 0) return;
  let cur = state[curKey];
  if (!fin(cur)) return;
  if (cur < 0) cur = 0;
  if (cur > max) cur = max;
  state[curKey] = cur;
}

/**
 * Re-apply the snapshot to a freshly constructed live ship. createShipState
 * hands back a nominal hull; this puts the real damage, engine, disable and
 * surrender status back, plus the bounded hail/peace outcome so a paid-off
 * pirate does not wake up hostile. Returns true when a snapshot was applied.
 */
export function applyCondition(plan, state, ai) {
  if (!plan || typeof plan !== 'object') return false;
  const cond = plan.cond && typeof plan.cond === 'object' ? plan.cond : null;
  let applied = false;
  if (cond && state) {
    applied = true;
    for (let i = 0; i < COND_NUMBERS.length; i++) {
      const key = COND_NUMBERS[i];
      const v = cond[key];
      if (fin(v)) state[key] = v;
    }
    for (let i = 0; i < COND_PAIRS.length; i++) clampPair(state, COND_PAIRS[i][0], COND_PAIRS[i][1]);
    const flags = cond.flags && typeof cond.flags === 'object' ? cond.flags : null;
    if (flags) {
      for (let i = 0; i < COND_FLAGS.length; i++) {
        const key = COND_FLAGS[i];
        if (flags[key] !== undefined) state[key] = flags[key] === true;
      }
    }
    state.disabledSince = fin(cond.disabledSince) ? cond.disabledSince : null;
  }
  if (ai) {
    applied = true;
    const peace = plan.peace;
    if (peace && typeof peace === 'object') {
      for (let i = 0; i < PEACE_FLAGS.length; i++) {
        const key = PEACE_FLAGS[i];
        if (peace[key] !== undefined) ai[key] = peace[key] === true;
      }
      ai.demandOutcome = DEMAND_OUTCOMES.has(peace.demandOutcome) ? peace.demandOutcome : null;
      if (fin(peace.calmUntil)) ai.calmUntil = peace.calmUntil;
    }
    // The open card and the target reference are session objects: a restored
    // plan re-enters the world stood down, never mid-parley.
    ai.demanding = false;
  }
  return applied;
}

/** Keep a persisted resolve ladder bump visible in the retained snapshot. */
export function syncCondResolve(plan, resolve) {
  if (!plan || !plan.cond || !fin(resolve)) return;
  plan.cond.resolve = resolve;
}

// ---------- movement + phase machine ----------

/** Advance the tracked position toward the destination. Off-screen only. */
export function stepEscapeToward(plan, speed, dt) {
  if (!plan || !vec3ok(plan.pos) || !vec3ok(plan.dest)) return Infinity;
  const pos = plan.pos;
  const dest = plan.dest;
  const dx = dest[0] - pos[0];
  const dy = dest[1] - pos[1];
  const dz = dest[2] - pos[2];
  const dist = Math.hypot(dx, dy, dz);
  if (!fin(dist)) return Infinity;
  const step = fin(speed) && fin(dt) && speed > 0 && dt > 0 ? speed * dt : 0;
  if (step <= 0 || dist <= 1e-6) return dist;
  if (step >= dist) {
    plan.pos[0] = dest[0];
    plan.pos[1] = dest[1];
    plan.pos[2] = dest[2];
    plan.vel[0] = 0;
    plan.vel[1] = 0;
    plan.vel[2] = 0;
    plan.speed = 0;
    return 0;
  }
  const inv = step / dist;
  plan.pos[0] = pos[0] + dx * inv;
  plan.pos[1] = pos[1] + dy * inv;
  plan.pos[2] = pos[2] + dz * inv;
  plan.vel[0] = (dx / dist) * speed;
  plan.vel[1] = (dy / dist) * speed;
  plan.vel[2] = (dz / dist) * speed;
  plan.speed = speed;
  return dist - step;
}

/**
 * Unit heading of the plan's persisted velocity into `out` ({x,y,z}); false
 * when it carries no usable motion. Both re-entry paths — traffic.js's
 * re-instantiation and save.js's live heal — point a returning hull's nose
 * along the way it was actually going, and this is the one derivation they
 * share instead of each carrying its own copy.
 */
export function escapeHeading(plan, out) {
  if (!plan || !out || !vec3ok(plan.vel)) return false;
  const n = Math.hypot(plan.vel[0], plan.vel[1], plan.vel[2]);
  if (!fin(n) || n <= 1e-3) return false;
  out.x = plan.vel[0] / n;
  out.y = plan.vel[1] / n;
  out.z = plan.vel[2] / n;
  return true;
}

/**
 * Coast the tracked position along the plan's OWN velocity. Off-screen only.
 *
 * This is not navigation: there is no destination, no steering and no arrival.
 * It exists because two off-screen states genuinely keep moving and used to
 * stand perfectly still — a disabled hull, which drifts on the vector
 * updateDisabled gave it, and an evading runner, which is flying its last
 * heading until the retry cadence comes round. `cap` holds the coast to the
 * same speed contract the flight would obey live. Returns true if it moved.
 */
export function driftEscape(plan, dt, cap) {
  if (!plan || !vec3ok(plan.pos) || !vec3ok(plan.vel)) return false;
  const v = plan.vel;
  const sp = Math.hypot(v[0], v[1], v[2]);
  if (!fin(sp) || sp <= 1e-6 || !fin(dt) || dt <= 0) return false;
  let speed = Math.min(sp, ESCAPE.maxSpeed);
  if (fin(cap) && cap >= 0 && cap < speed) speed = cap;
  const step = (speed * dt) / sp;
  plan.pos[0] += v[0] * step;
  plan.pos[1] += v[1] * step;
  plan.pos[2] += v[2] * step;
  plan.speed = speed;
  return true;
}

/** Arrival radius for the committed destination kind. */
export function escapeArriveRadius(plan) {
  return plan && plan.kind === 'gate' ? ESCAPE.gateArrive : ESCAPE.stationArrive;
}

/**
 * One phase step, shared by the live ship and the off-screen galaxy tick.
 *
 * `dist` is the REAL distance to the committed destination, measured AFTER
 * the frame's steering and physical bounce (the live hull's own, or the
 * tracked one). Returns a token the caller turns into world effects:
 * '' | 'replan' | 'gate-ready' | 'sheltered' | 'dwell-over' | 'pressed'.
 *
 * The charge only accrues while the engine is operational and the hull is not
 * disabled; either condition CLEARS an accrued timer, so a hull cannot finish
 * a jump on a charge it banked before losing its engine.
 */
export function tickEscape(plan, opts) {
  if (!plan || !MOVING.has(plan.phase)) return '';
  const now = fin(opts && opts.now) ? opts.now : 0;
  const dt = fin(opts && opts.dt) && opts.dt > 0 ? opts.dt : 0;
  if (plan.phase === 'evade') {
    if (now - plan.checkedAt >= ESCAPE.revalidate) return 'replan';
    return '';
  }
  if (!vec3ok(plan.dest) || !KIND_SET.has(plan.kind)) {
    plan.phase = 'evade';
    plan.reason = 'no-route';
    plan.checkedAt = now;
    return 'replan';
  }
  const dist = fin(opts && opts.dist) ? opts.dist : Infinity;
  const arrive = escapeArriveRadius(plan);
  plan.updatedAt = now;

  const pressed = opts && opts.pressure === true;

  if (plan.kind === 'station') {
    if (dist > arrive) {
      if (plan.phase !== 'route') plan.phase = 'route';
      return '';
    }
    if (plan.phase !== 'hold') {
      plan.phase = 'hold';
      plan.dwellUntil = now + ESCAPE.dwellMin + (plan.chosenAt % 1) * ESCAPE.dwellSpan;
      if (!fin(plan.dwellUntil)) plan.dwellUntil = now + ESCAPE.dwellMin;
      if (!plan.sheltered) {
        plan.sheltered = true;
        return 'sheltered';
      }
      return '';
    }
    // The dwell is a CALM wait, not a countdown to safety: renewed pressure
    // pushes the deadline out and asks the caller to re-run the choice, so a
    // pursuer arriving at the holding lane cannot be waited out in place.
    if (pressed) {
      plan.dwellUntil = now + ESCAPE.dwellMin;
      return now - plan.checkedAt >= ESCAPE.revalidate ? 'pressed' : '';
    }
    if (fin(plan.dwellUntil) && now >= plan.dwellUntil) return 'dwell-over';
    return '';
  }

  // gate
  if (dist > arrive) {
    if (plan.phase !== 'route') plan.phase = 'route';
    plan.charge = 0; // pushed back out of the zone: the spool does not persist
    return '';
  }
  if (plan.phase !== 'charge') plan.phase = 'charge';
  if (opts && opts.canCharge === true) {
    plan.charge = (fin(plan.charge) ? plan.charge : 0) + dt;
  } else {
    plan.charge = 0; // engineOut / disabled: cancelled, not banked
    return '';
  }
  if (plan.charge >= JUMP.chargeTime) return 'gate-ready';
  return '';
}

// ---------- readable status (HUD + public observation share this) ----------

function systemName(id) {
  return knownSystem(id) ? String(SYSTEMS[id].name || id) : '';
}

/**
 * The one status word pair the HUD prints and the public observation
 * publishes. Empty label = nothing to say. No private AI state is exposed.
 */
export function escapeStatus(rec) {
  const plan = readEscape(rec);
  if (!plan || !MOVING.has(plan.phase)) return null;
  const dest = plan.kind === 'gate' ? systemName(plan.to) : '';
  // The snapshot is refreshed every live frame, so the word can tell the
  // truth about WHY a hull sitting in the gate bore is not spooling: a
  // disabled or engine-out runner reads DISABLED / ENGINE OUT, never the
  // misleading GATE CHARGE it cannot actually perform.
  const flags = plan.cond && plan.cond.flags;
  const stalled = !!flags && (flags.disabled === true || flags.engineOut === true);
  const why = flags && flags.disabled === true ? 'DISABLED' : 'ENGINE OUT';
  let label = '';
  let phase = plan.phase;
  if (plan.phase === 'evade') label = 'EVADING — NO ROUTE';
  else if (plan.kind === 'gate') {
    const where = dest ? dest.toUpperCase() : 'GATE';
    if (plan.phase === 'charge') {
      label = stalled ? `AT ${where} GATE — ${why}` : `GATE CHARGE — ${where}`;
      if (stalled) phase = 'stalled';
    } else {
      label = stalled ? `RUNNING FOR ${where} GATE — ${why}` : `RUNNING FOR ${where} GATE`;
    }
  } else if (plan.kind === 'station') {
    label = plan.phase === 'hold' ? 'STATION HOLD' : 'RUNNING FOR STATION';
    if (stalled && plan.phase !== 'hold') label += ` — ${why}`;
  }
  if (!label) return null;
  return {
    kind: KIND_SET.has(plan.kind) ? plan.kind : null,
    to: plan.kind === 'gate' && knownSystem(plan.to) ? plan.to : null,
    destName: dest,
    phase,
    reason: REASON_SET.has(plan.reason) ? plan.reason : 'no-route',
    label: label.slice(0, 64),
  };
}

/**
 * The identity a receipt may carry: EXACTLY the name the player was already
 * reading on the bracket. This mirrors hud.js 2604-2618 and
 * agent-observe.js shipDisplayName — a masked Q-ship publishes its cover name
 * (the receipt must never be the thing that unmasks a hull), a Wolfeye Mk II
 * that already pierced the mask publishes the real one, and a record with no
 * cover string publishes its OWN name rather than a substitute identity.
 * `scanner` is the ctx.world.scanner tier; omitted (an off-screen departure,
 * which the player is not watching) means unpierced. Bounded strings.
 */
export function escapePublicIdentity(rec, scanner) {
  const src = rec && typeof rec === 'object' ? rec : null;
  const tier = fin(scanner) ? scanner : 0;
  const masked = !!src && src.qship === true && src.revealed !== true && tier < 2;
  let name = '';
  if (masked && typeof src.coverName === 'string') name = src.coverName;
  if (!name && src && typeof src.name === 'string') name = src.name;
  const id = src && (typeof src.id === 'string' || typeof src.id === 'number') ? src.id : null;
  return {
    id: typeof id === 'string' ? id.slice(0, 64) : id,
    // HUD bracket law: an unnamed contact reads CONTACT. A NAMED hull never does.
    name: (name || 'CONTACT').slice(0, 40),
  };
}

// ---------- persistence hygiene ----------

/**
 * Authored maxima for a record's class, or null for an unknown class. Mirrors
 * createShipState's own derivation (screen = the outer DEFENSE.screenFraction
 * of the class shield) WITHOUT calling it — createShipState rolls a random
 * personality, and a restore must not consume the RNG.
 */
function classMaxima(rec) {
  const key = rec && rec.classKey;
  if (typeof key !== 'string' || !Object.hasOwn(SHIP_CLASSES, key)) return null;
  const cls = SHIP_CLASSES[key];
  const screenMax = Math.round(cls.shield * DEFENSE.screenFraction);
  return {
    hull: cls.hull, hullMax: cls.hull,
    screen: screenMax, screenMax,
    shell: cls.shield - screenMax, shellMax: cls.shield - screenMax,
    engine: cls.engine, engineMax: cls.engine,
  };
}

/**
 * Rebuild the whitelisted condition snapshot. Anything not on the list — an
 * unknown key, a nested object, an inherited field, a giant or negative hull,
 * a maximum larger than the class was ever built with — simply does not
 * survive into the returned record, so a hand-edited save can never restore
 * an impossible ship.
 */
function cleanCond(raw, ref) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const cond = { flags: {} };
  for (let i = 0; i < COND_NUMBERS.length; i++) {
    const key = COND_NUMBERS[i];
    if (!Object.hasOwn(raw, key)) continue;
    let v = raw[key];
    if (!fin(v)) continue;
    if (key === 'lastHitAt' || key === 'lastCombatAt') {
      // Timestamps may be the createShipState -1e9 sentinel; bound the range.
      if (Math.abs(v) > ESCAPE.maxCoord * 1e3) continue;
      cond[key] = v;
      continue;
    }
    if (v < 0) v = 0;
    // A max is capped by what this class is actually built with; a current
    // value is then capped by its own max. Unknown class: cap by the stored
    // max alone, which is itself bounded below.
    const authored = ref && fin(ref[key]) ? ref[key] : null;
    if (authored !== null && v > authored) v = authored;
    if (key === 'heat' || key === 'power' || key === 'resolve' || key === 'disabledDamage') {
      if (v > ESCAPE.maxSpeed * 10) v = ESCAPE.maxSpeed * 10;
    }
    cond[key] = v;
  }
  for (let i = 0; i < COND_PAIRS.length; i++) {
    const cur = COND_PAIRS[i][0];
    const max = COND_PAIRS[i][1];
    if (!fin(cond[max])) delete cond[cur];
    else if (fin(cond[cur]) && cond[cur] > cond[max]) cond[cur] = cond[max];
  }
  const flags = raw.flags;
  if (flags && typeof flags === 'object' && !Array.isArray(flags)) {
    for (let i = 0; i < COND_FLAGS.length; i++) {
      const key = COND_FLAGS[i];
      cond.flags[key] = flags[key] === true;
    }
  }
  cond.disabledSince = fin(raw.disabledSince) ? raw.disabledSince : null;
  return cond;
}

/** Rebuild the bounded peace snapshot; no unknown keys ride along. */
function cleanPeace(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const peace = {};
  for (let i = 0; i < PEACE_FLAGS.length; i++) {
    const key = PEACE_FLAGS[i];
    if (Object.hasOwn(raw, key)) peace[key] = raw[key] === true;
  }
  peace.demandOutcome = DEMAND_OUTCOMES.has(raw.demandOutcome) ? raw.demandOutcome : null;
  peace.calmUntil = fin(raw.calmUntil) ? Math.max(0, raw.calmUntil) : 0;
  return peace;
}

/**
 * Restore-time validation. A corrupt or foreign optional escape blob fails
 * SAFE: the field is dropped and the record simply keeps ordinary behavior.
 * Legacy records (no escape field) are untouched.
 *
 * The plan is REBUILT from a whitelist rather than patched in place, so no
 * unbounded persisted key, extra array or nested object from a hand-edited
 * save survives into the live game — and applyCondition, which writes maxima
 * onto a live hull, can only ever see values this pass produced.
 */
export function sanitizeEscapeRecord(rec) {
  if (!rec || typeof rec !== 'object' || !Object.hasOwn(rec, 'escape')) return false;
  const raw = rec.escape;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)
    || raw.v !== ESCAPE_VERSION || !PHASE_SET.has(raw.phase)) {
    delete rec.escape;
    return false;
  }
  const pos = escapeVec(raw.pos);
  if (!pos) {
    delete rec.escape;
    return false;
  }
  let kind = KIND_SET.has(raw.kind) ? raw.kind : null;
  let to = kind === 'gate' && knownSystem(raw.to) ? raw.to : null;
  let dest = escapeVec(raw.dest);
  if (kind === 'gate' && !to) kind = null;
  if (!kind || !dest) {
    kind = null;
    to = null;
    dest = null;
  }
  let phase = raw.phase;
  if (!kind && (phase === 'route' || phase === 'charge' || phase === 'hold')) phase = 'evade';
  const plan = {
    v: ESCAPE_VERSION,
    phase,
    kind,
    to,
    from: knownSystem(raw.from) ? raw.from : null,
    dest,
    pos,
    vel: escapeVec(raw.vel) || [0, 0, 0],
    speed: fin(raw.speed) ? Math.max(0, Math.min(ESCAPE.maxSpeed, raw.speed)) : 0,
    charge: fin(raw.charge) ? Math.max(0, Math.min(JUMP.chargeTime, raw.charge)) : 0,
    dwellUntil: fin(raw.dwellUntil) ? raw.dwellUntil : 0,
    reason: REASON_SET.has(raw.reason) ? raw.reason : (kind || 'no-route'),
    threat: typeof raw.threat === 'string' ? raw.threat.slice(0, STRING_MAX) : null,
    // WHICH hull was chasing it (record id + the last position actually seen),
    // so a restored runner re-finds the same pursuer instead of inheriting the
    // player. Bounded string, bounded vector, nothing else rides along.
    threatId: typeof raw.threatId === 'string' ? raw.threatId.slice(0, STRING_MAX) : null,
    threatAt: escapeVec(raw.threatAt),
    chosenAt: fin(raw.chosenAt) ? raw.chosenAt : 0,
    checkedAt: fin(raw.checkedAt) ? raw.checkedAt : 0,
    updatedAt: fin(raw.updatedAt) ? raw.updatedAt : 0,
    announced: raw.announced === true,
    sheltered: raw.sheltered === true,
    departed: raw.departed === true,
    cond: cleanCond(raw.cond, classMaxima(rec)),
    peace: cleanPeace(raw.peace),
  };
  // A station hold saved before the refuge ring cleared the launch envelope is
  // not a legal place to park any more. Drop only the DESTINATION — identity,
  // damage, peace, dwell, sheltered and the tracked position all stand, so the
  // hull is never teleported, never healed and never re-announces an arrival —
  // and let the ordinary re-choice fly it out to the new refuge.
  if (plan.kind === 'station' && !stationRefugeSafe(rec, plan.from ?? rec.system, plan.dest)) {
    plan.kind = null;
    plan.dest = null;
    plan.phase = 'evade';
    plan.reason = 'no-route';
  }
  // A record that already ended cannot resume an escape.
  if (rec.state === 'dead' || rec.state === 'captured') {
    plan.phase = 'done';
    plan.kind = null;
    plan.to = null;
    plan.dest = null;
    plan.charge = 0;
  }
  rec.escape = plan;
  return true;
}
