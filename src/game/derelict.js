import { DERELICT, ESCAPE, FACTIONS } from './state.js';
import { cancelEscape } from './npc-escape.js';

/**
 * Derelicts (issue #148).
 *
 * A yielded hull whose crew is GONE is a derelict: nobody is left to fly it,
 * so it does not run for a refuge (issue #146) and it does not resume its
 * lane. The RECORD owns the derelict: `rec.state === 'derelict'` and a
 * JSON-plain `rec.derelict` blob carry the moment it became one, the fold
 * deadline, the salvager's arrival time, the dead-stick position and coast,
 * the hull that is left and the aftermath wreck id the recovery board posts
 * against. That is what survives a range cull, a save/restore and the
 * cross-system fold — the live mesh is only ever a view of it.
 *
 * Claims:
 *   • the player, through the issue #74 recovery flow. markDerelict stages a
 *     'wreck' aftermath entry (derelictId set) so station.js posts the same
 *     recovery card, the same marker pod and the same receipts a real kill
 *     posts. When that contract's pod is scooped (job.collected) the derelict
 *     resolves 'recovered' and the hull leaves the lane;
 *   • an NPC salvager from the local station, after DERELICT.npcClaimAfter
 *     plus a random spread rolled ONCE at marking time (persisted, so a
 *     restore does not re-roll it). The tug defers while the player holds an
 *     accepted, uncollected recovery contract on the hull (jobs stay
 *     solvable) or keeps the live hull locked. Abstract: one comm line and
 *     the hull is under tow ('salvaged').
 * Timer: an unclaimed derelict folds away at `due` ('expired'). Every
 * resolution flips the record into the existing terminal vocabulary — 'dead'
 * for expired/destroyed, 'captured' (towed away) for salvaged/recovered — so
 * traffic.js's despawn pass retires the live hull and world.js never advances
 * or migrates it again. `rec.derelict.outcome` keeps the truthful word.
 *
 * Nothing here imports npc.js or world.js (both import this module). The
 * live hull is never removed directly: the terminal state does it through the
 * one existing removal boundary.
 */

export const DERELICT_REASONS = Object.freeze(['crewPods', 'crewTaken']);
export const DERELICT_OUTCOMES = Object.freeze(['expired', 'salvaged', 'recovered', 'destroyed']);

const REASON_SET = new Set(DERELICT_REASONS);
const OUTCOME_SET = new Set(DERELICT_OUTCOMES);
const STRING_MAX = 64;
const MAX_AFTERMATH = 24; // mirrors world.js: the oldest entry makes room

// Per-ctx sweep clock. Session-only: a restore simply sweeps on its next tick.
const nextSweep = new WeakMap();

function fin(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function coord(n) {
  return fin(n) && Math.abs(n) <= ESCAPE.maxCoord;
}

function vec3ok(a) {
  return Array.isArray(a) && a.length === 3 && coord(a[0]) && coord(a[1]) && coord(a[2]);
}

function cleanVec3(src, fallback) {
  if (vec3ok(src)) return [src[0], src[1], src[2]];
  if (src && typeof src === 'object' && coord(src.x) && coord(src.y) && coord(src.z)) return [src.x, src.y, src.z];
  return fallback;
}

/** The derelict blob of a record that IS a derelict right now, else null. */
export function derelictOf(rec) {
  return rec && rec.state === 'derelict' && rec.derelict && typeof rec.derelict === 'object'
    ? rec.derelict : null;
}

/** Terminal in the existing vocabulary: a resolved derelict never respawns. */
function terminalStateFor(outcome) {
  return outcome === 'expired' || outcome === 'destroyed' ? 'dead' : 'captured';
}

function findWreck(ctx, wreckId) {
  const list = ctx.world && ctx.world.aftermath;
  if (!Array.isArray(list) || typeof wreckId !== 'string') return null;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a && a.id === wreckId) return a;
  }
  return null;
}

/**
 * Stage the aftermath entry the recovery board reads. Same shape world.js
 * stageAftermath writes for a real kill (kind 'wreck', system, expiresAt) plus
 * derelictId, which world.js uses to skip the ember mesh — the hull itself is
 * the visual. Over the cap the OLDEST entry is expired rather than spliced so
 * world.js's own lifecycle loop tears its mesh down.
 */
function stageDerelictWreck(ctx, rec, d, sysId) {
  const list = ctx.world.aftermath ?? (ctx.world.aftermath = []);
  const now = ctx.world.time;
  const entry = {
    id: `aft-${Math.round(now * 10)}-${(Math.random() * 1e6) | 0}`,
    kind: 'wreck',
    derelictId: typeof rec.id === 'string' ? rec.id : null,
    position: { x: Math.round(d.pos[0]), y: Math.round(d.pos[1]), z: Math.round(d.pos[2]) },
    system: sysId,
    createdAt: now,
    expiresAt: d.due,
  };
  list.push(entry);
  if (list.length > MAX_AFTERMATH) {
    const oldest = list[0];
    if (oldest && oldest !== entry) oldest.expiresAt = now;
  }
  d.wreckId = entry.id;
  return entry;
}

/**
 * Flip a LIVE yielded hull into a derelict. Called at the moment its crew is
 * gone (npc.js capitulate, crewPods; the companion issue #147's crew-taken
 * path uses the same door with reason 'crewTaken'). Returns the blob, or null
 * when the record cannot become one (no record, already ended).
 */
export function markDerelict(ctx, live, reason) {
  const rec = live && live.record;
  const st = live && live.state;
  const obj = live && live.object;
  if (!ctx || !rec || !st || !obj) return null;
  if (rec.state === 'dead' || rec.state === 'captured' || rec.state === 'inTransit') return null;
  if (rec.state === 'derelict' && rec.derelict) return rec.derelict;
  const now = ctx.world.time;
  const ai = live.ai;
  const vel = ai && ai.driftVel ? ai.driftVel : null;
  const p = obj.position;
  const d = {
    v: DERELICT.version,
    since: now,
    due: now + DERELICT.foldAfter,
    claimAt: now + DERELICT.npcClaimAfter + Math.random() * DERELICT.npcClaimSpan,
    reason: REASON_SET.has(reason) ? reason : 'crewPods',
    pos: [coord(p.x) ? p.x : 0, coord(p.y) ? p.y : 0, coord(p.z) ? p.z : 0],
    vel: vel && fin(vel.x) && fin(vel.y) && fin(vel.z) ? [vel.x, vel.y, vel.z] : [0, 0, 0],
    hull: fin(st.hull) ? Math.max(0, st.hull) : null,
    wreckId: null,
    outcome: null,
    resolvedAt: null,
    claimant: null,
  };
  // A lingering escape plan (the hull may have run before it broke) must not
  // steer a dead hull off-screen or hand back a stale position on re-entry.
  cancelEscape(rec);
  // The hold spilled with the crew: the abstract manifest is empty too, so a
  // re-instantiated derelict never grows its cargo back.
  if (Array.isArray(rec.cargo)) rec.cargo.length = 0;
  rec.state = 'derelict';
  rec.derelict = d;
  stageDerelictWreck(ctx, rec, d, rec.system ?? ctx.world.currentSystem);
  const name = rec.name ?? st.name ?? 'Unknown hull';
  ctx.emit('commLine', {
    text: `${name} is a derelict — crew gone, engines cold. Salvage rights to whoever gets there first.`,
    from: 'Echo',
  });
  return d;
}

/**
 * Put a derelict record's truth onto a freshly built (or same-system
 * restored) live hull: yielded, hold empty, the hull it had left, crew pods
 * already spawned, dead-stick drift with the engines dark. Used by
 * spawnLiveShip and by save.js's same-system restore heal.
 */
export function applyDerelictLive(rec, live) {
  const d = derelictOf(rec);
  const st = live && live.state;
  const ai = live && live.ai;
  if (!d || !st || !ai) return false;
  st.surrendered = true;
  if (Array.isArray(st.cargo)) st.cargo.length = 0;
  if (fin(d.hull) && fin(st.hullMax)) st.hull = Math.max(1, Math.min(st.hullMax, d.hull));
  ai.mode = 'drift';
  ai.surrenderDone = true;
  ai.survivorsSpawned = true;
  ai.intent = false;
  ai.phase = null;
  ai.target = null;
  ai.fleeFrom = null;
  ai.demanding = false;
  if (ai.driftVel && vec3ok(d.vel)) ai.driftVel.set(d.vel[0], d.vel[1], d.vel[2]);
  ai.disabledInit = true;
  if (ai.velocity && typeof ai.velocity.set === 'function') ai.velocity.set(0, 0, 0);
  const glow = live.object && live.object.userData && live.object.userData.glow;
  if (glow) glow.visible = false;
  return true;
}

/**
 * Per-frame for a LIVE derelict (npc.js, after updateDrift): bleed the
 * dead-stick coast off so the hull settles where its recovery marker is
 * posted, and keep the record equal to the hull. In-place writes only.
 */
export function tickDerelictLive(live, dt) {
  const rec = live && live.record;
  const d = derelictOf(rec);
  const ai = live && live.ai;
  if (!d || !ai || !ai.driftVel || !live.object) return;
  const v = ai.driftVel;
  const k = 1 - DERELICT.driftDecay * dt;
  v.multiplyScalar(k > 0 ? k : 0);
  if (v.lengthSq() < DERELICT.driftStop * DERELICT.driftStop) v.set(0, 0, 0);
  syncDerelictLive(live);
}

/** Capture the live hull's position, coast and hull into its record. */
export function syncDerelictLive(live) {
  const rec = live && live.record;
  const d = derelictOf(rec);
  if (!d || !live.object) return false;
  const p = live.object.position;
  if (coord(p.x) && coord(p.y) && coord(p.z)) {
    if (!vec3ok(d.pos)) d.pos = [0, 0, 0];
    d.pos[0] = p.x;
    d.pos[1] = p.y;
    d.pos[2] = p.z;
  }
  const v = live.ai && live.ai.driftVel;
  if (v && fin(v.x) && fin(v.y) && fin(v.z)) {
    if (!vec3ok(d.vel)) d.vel = [0, 0, 0];
    d.vel[0] = v.x;
    d.vel[1] = v.y;
    d.vel[2] = v.z;
  }
  const st = live.state;
  if (st && fin(st.hull)) d.hull = Math.max(0, st.hull);
  return true;
}

/** Where the derelict sits, for traffic's re-instantiation. Writes `out`. */
export function writeDerelictPosition(rec, out) {
  const d = derelictOf(rec);
  if (!d || !vec3ok(d.pos)) return false;
  out.set(d.pos[0], d.pos[1], d.pos[2]);
  return true;
}

function liveOf(ctx, rec) {
  if (!rec.live || !Array.isArray(ctx.ships)) return null;
  for (let i = 0; i < ctx.ships.length; i++) {
    if (ctx.ships[i].record === rec) return ctx.ships[i];
  }
  return null;
}

function recoveryJobFor(ctx, wreckId) {
  const jobs = ctx.world.jobs;
  if (!Array.isArray(jobs) || typeof wreckId !== 'string') return null;
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (j && j.kind === 'recovery' && j.wreckId === wreckId && j.state === 'accepted') return j;
  }
  return null;
}

/**
 * Resolve a derelict. The record takes the existing terminal word so every
 * reader that already knows 'dead' / 'captured' (traffic despawn, bank
 * advance, migration, quarry checks) needs no new case; the blob keeps the
 * truthful outcome. The wreck entry is expired, not spliced, so world.js's
 * lifecycle loop pulls the recovery card through the ordinary path.
 */
export function resolveDerelict(ctx, rec, outcome, claimant = null) {
  const d = rec && rec.derelict;
  if (!d || typeof d !== 'object' || !OUTCOME_SET.has(outcome)) return false;
  if (d.outcome) return false;
  const now = ctx.world.time;
  d.outcome = outcome;
  d.resolvedAt = now;
  d.claimant = typeof claimant === 'string' ? claimant.slice(0, STRING_MAX) : null;
  if (rec.state === 'derelict') rec.state = terminalStateFor(outcome);
  const entry = findWreck(ctx, d.wreckId);
  if (entry && entry.expiresAt > now) entry.expiresAt = now;
  return true;
}

function claimantFactionFor(ctx, sysId) {
  const sys = ctx.systems && sysId ? ctx.systems[sysId] : null;
  const key = sys && typeof sys.faction === 'string' ? sys.faction : 'independent';
  return key;
}

function announce(ctx, rec, sysId, text) {
  if (sysId !== ctx.world.currentSystem) return;
  ctx.emit('commLine', { text, from: 'Echo' });
}

function sweepBank(ctx, bank, sysId, now) {
  for (let i = 0; i < bank.length; i++) {
    const rec = bank[i];
    if (!rec || !rec.derelict || typeof rec.derelict !== 'object') continue;
    const d = rec.derelict;
    if (rec.state !== 'derelict') {
      // Ended by another path while it was a derelict: a kill (world.js
      // consumeIncidents → 'dead', which stages its own wreck) or a player
      // capture ('captured'). Keep the truthful word and pull the stale card.
      if (!d.outcome && (rec.state === 'dead' || rec.state === 'captured')) {
        resolveDerelict(ctx, rec, rec.state === 'dead' ? 'destroyed' : 'recovered', rec.state === 'captured' ? 'player' : null);
      }
      continue;
    }
    const name = rec.name ?? 'Unknown hull';
    // The recovery board's entry may have been pruned (an old save, the
    // aftermath cap). Re-stage it while the derelict still stands.
    let entry = findWreck(ctx, d.wreckId);
    if (!entry && now < d.due) entry = stageDerelictWreck(ctx, rec, d, sysId);
    if (entry && vec3ok(d.pos)) {
      entry.position.x = Math.round(d.pos[0]);
      entry.position.y = Math.round(d.pos[1]);
      entry.position.z = Math.round(d.pos[2]);
    }
    const job = recoveryJobFor(ctx, d.wreckId);
    // Player claim: the contract's marker pod is aboard.
    if (job && job.collected === true) {
      resolveDerelict(ctx, rec, 'recovered', 'player');
      announce(ctx, rec, sysId, `${name} is yours — recovery marker aboard. The hull leaves the lane.`);
      continue;
    }
    // Timer: nothing claimed it.
    if (now >= d.due) {
      resolveDerelict(ctx, rec, 'expired');
      if (liveOf(ctx, rec)) announce(ctx, rec, sysId, `${name} — derelict gone dark. Nothing left to claim.`);
      continue;
    }
    // NPC claim.
    if (now >= d.claimAt) {
      if (job && job.state === 'accepted' && fin(job.deadline) && now < job.deadline) continue; // the player is on the way
      const live = liveOf(ctx, rec);
      if (live && ctx.targets && ctx.targets.current === live) {
        d.claimAt = now + DERELICT.claimDefer;
        continue;
      }
      const key = claimantFactionFor(ctx, sysId);
      resolveDerelict(ctx, rec, 'salvaged', key);
      const facName = Object.hasOwn(FACTIONS, key) ? FACTIONS[key].name : key;
      announce(ctx, rec, sysId, `${facName} salvage tug takes ${name} under tow.`);
    }
  }
}

/**
 * The derelict clock. Sweeps EVERY record bank on a DERELICT.tickEvery
 * cadence — a derelict in a system the player left keeps counting, so the
 * timer survives the cross-system fold — and resolves claims and expiries.
 * Runs from world.js's update, before traffic.js so a live hull whose record
 * ended this frame is retired by the same frame's despawn pass.
 */
export function tickDerelicts(ctx) {
  if (!ctx || !ctx.world) return;
  const now = ctx.world.time;
  const at = nextSweep.get(ctx);
  if (fin(at) && now < at) return;
  nextSweep.set(ctx, now + DERELICT.tickEvery);
  const banks = ctx.world.recordBanks;
  const seen = new Set();
  const sweep = (bank, sysId) => {
    if (!Array.isArray(bank) || seen.has(bank)) return;
    seen.add(bank);
    sweepBank(ctx, bank, sysId, now);
  };
  if (banks && typeof banks === 'object' && !Array.isArray(banks)) {
    for (const key in banks) {
      if (Object.hasOwn(banks, key)) sweep(banks[key], key);
    }
  }
  sweep(ctx.world.records, ctx.world.currentSystem);
}

/**
 * Restore-time validation (save.js). The field is OPTIONAL — a legacy record
 * has none. A corrupt or foreign-version blob fails SAFE: the blob is dropped
 * and, when the record claimed to be a derelict, the record ends ('dead') so
 * no hull is ever rebuilt from an unbounded position or an impossible hull.
 * A blob that already carries an outcome pins the matching terminal state.
 */
export function sanitizeDerelictRecord(rec) {
  if (!rec || typeof rec !== 'object') return false;
  if (!Object.hasOwn(rec, 'derelict')) {
    if (rec.state === 'derelict') rec.state = 'dead';
    return false;
  }
  const raw = rec.derelict;
  const bad = () => {
    delete rec.derelict;
    if (rec.state === 'derelict') rec.state = 'dead';
    return false;
  };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.v !== DERELICT.version) return bad();
  if (!fin(raw.since) || !fin(raw.due) || raw.due <= raw.since) return bad();
  const pos = cleanVec3(raw.pos, null);
  if (!pos) return bad();
  const d = {
    v: DERELICT.version,
    since: raw.since,
    due: raw.due,
    claimAt: fin(raw.claimAt) ? raw.claimAt : raw.since + DERELICT.npcClaimAfter,
    reason: REASON_SET.has(raw.reason) ? raw.reason : 'crewPods',
    pos,
    vel: cleanVec3(raw.vel, [0, 0, 0]),
    hull: fin(raw.hull) && raw.hull >= 0 ? raw.hull : null,
    wreckId: typeof raw.wreckId === 'string' ? raw.wreckId.slice(0, STRING_MAX) : null,
    outcome: OUTCOME_SET.has(raw.outcome) ? raw.outcome : null,
    resolvedAt: fin(raw.resolvedAt) ? raw.resolvedAt : null,
    claimant: typeof raw.claimant === 'string' ? raw.claimant.slice(0, STRING_MAX) : null,
  };
  rec.derelict = d;
  if (d.outcome && rec.state === 'derelict') rec.state = terminalStateFor(d.outcome);
  if (!d.outcome && rec.state !== 'derelict' && rec.state !== 'dead' && rec.state !== 'captured') {
    // A blob with no outcome on a record that is not a derelict is a stale
    // leftover; the record's own state wins and the blob goes.
    delete rec.derelict;
    return false;
  }
  return true;
}
