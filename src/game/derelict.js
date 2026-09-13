import { DERELICT, ECON, ESCAPE, FACTIONS, PRIZE_CLAIM, SHIP_CLASSES, cargoHoldFor, createShipState } from './state.js';
import { cancelEscape } from './npc-escape.js';
import { hullPrizeValue, rollHullRate } from './prize.js';
import { addPurchasedHull, canAcceptPurchase } from './hangar.js';
import { hullKindFor, yardStockFor } from './shipyard.js';
import { requestAutosave } from './save.js';
import { canSeat } from './weapon-fit.js';

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

// ---------- issue #147 follow-up: a passing ship claims a crewless hull ----------
export const CLAIMED_HULL_VERSION = 1;

/** The player's claimed-hull ledger (world.claimedHulls), created lazily. */
export function claimedHullsOf(world, create = false) {
  if (!world || typeof world !== 'object') return [];
  if (!Array.isArray(world.claimedHulls)) {
    if (!create) return [];
    world.claimedHulls = [];
  }
  return world.claimedHulls;
}

/**
 * May the player claim this live hull by hail? A derelict record (crew gone,
 * not yet resolved), no recovery contract of the player's on it (that
 * contract's marker IS the claim), and room on the ledger.
 */
export function claimableDerelict(ctx, live) {
  const rec = live && live.record;
  const d = derelictOf(rec);
  if (!ctx || !d || d.outcome) return false;
  if (!live.state || live.state.destroyed) return false;
  if (recoveryJobFor(ctx, d.wreckId)) return false;
  return claimedHullsOf(ctx.world).length < PRIZE_CLAIM.max;
}

function repBag(ctx) {
  const w = ctx.world;
  if (!w.reputation || typeof w.reputation !== 'object' || Array.isArray(w.reputation)) w.reputation = {};
  return w.reputation;
}

function addRep(ctx, faction, delta) {
  if (typeof faction !== 'string' || !Object.hasOwn(FACTIONS, faction) || !fin(delta) || delta === 0) return 0;
  const bag = repBag(ctx);
  const cur = fin(bag[faction]) ? bag[faction] : 0;
  bag[faction] = cur + delta;
  return delta;
}

function factionName(key) {
  return typeof key === 'string' && Object.hasOwn(FACTIONS, key) ? FACTIONS[key].name : 'Unknown';
}

/**
 * The player claims a live derelict (hail verb `claimHull`). The derelict
 * resolves 'recovered' with claimant 'player' (the record ends 'captured':
 * traffic retires the hull, the recovery card is pulled), a ledger entry is
 * written, and the hull's faction docks the standing. Returns the entry, or
 * null when the claim is refused (nothing moves).
 */
export function claimDerelict(ctx, live) {
  if (!claimableDerelict(ctx, live)) return null;
  const rec = live.record;
  const d = rec.derelict;
  const now = ctx.world.time;
  const sysId = rec.system ?? ctx.world.currentSystem;
  const faction = typeof rec.faction === 'string' && Object.hasOwn(FACTIONS, rec.faction) ? rec.faction : null;
  const entry = {
    v: CLAIMED_HULL_VERSION,
    id: typeof rec.id === 'string' ? rec.id.slice(0, STRING_MAX) : null,
    name: typeof rec.name === 'string' ? rec.name.slice(0, STRING_MAX) : null,
    classKey: Object.hasOwn(SHIP_CLASSES, rec.classKey) ? rec.classKey : 'light',
    faction,
    reason: REASON_SET.has(d.reason) ? d.reason : 'crewPods',
    claimedAt: now,
    system: typeof sysId === 'string' ? sysId.slice(0, STRING_MAX) : null,
    repHit: 0,
  };
  if (!resolveDerelict(ctx, rec, 'recovered', 'player')) return null;
  entry.repHit = faction ? -addRep(ctx, faction, -PRIZE_CLAIM.repHit) : 0;
  claimedHullsOf(ctx.world, true).push(entry);
  const name = entry.name ?? 'the hull';
  ctx.emit('derelictClaimed', {
    targetId: entry.id, targetName: name, classKey: entry.classKey, faction, repHit: entry.repHit, system: entry.system,
  });
  ctx.emit('commLine', {
    text: `${name} is yours — salvage claim logged. Her troubles come with her.${faction ? ` The ${factionName(faction)} will not thank you.` : ''}`,
    from: 'Echo',
  });
  return entry;
}

/** The three ways a claimed hull leaves the ledger at a berth (issue #159). */
export const CLAIM_VERBS = Object.freeze(['keep', 'sell', 'return']);

/** The hot-hull rate for one sale, clamped into ECON.hotHullFence (rolled when none is given). */
export function claimSaleRate(rate) {
  const [lo, hi] = ECON.hotHullFence;
  if (!fin(rate)) return rollHullRate();
  return Math.min(hi, Math.max(lo, rate));
}

/** The UU a yard pays for a claimed hull at `rate` (the same figure the sale pays). */
export function claimSalePrice(entry, rate) {
  if (!entry || typeof entry !== 'object') return 0;
  return Math.max(0, Math.round(hullPrizeValue(entry.classKey) * claimSaleRate(rate)));
}

/**
 * What the berth offers for one ledger entry (issue #159). Sell works at any
 * berth. Return only at a station of the hull's own faction. Keep needs a
 * yard (a hull catalog — the same test the #158 sale uses) and room in the
 * hangar; the refusal names which. Pure: nothing moves.
 */
export function claimedHullOptions(ctx, entry, stationFaction) {
  const home = !!entry && typeof stationFaction === 'string' && stationFaction === entry.faction;
  let keep = null;
  if (yardStockFor(stationFaction).length === 0) keep = 'stock';
  else if (!canAcceptPurchase(ctx)) keep = 'full';
  return { keep, sell: null, return: home ? null : 'faction' };
}

function findClaimed(ctx, id) {
  const list = claimedHullsOf(ctx.world);
  if (typeof id !== 'string') return -1;
  return list.findIndex((e) => e && e.id === id);
}

/** A hangar id for a kept prize that no row uses yet. */
function nextPrizeHullId(hangar) {
  const used = new Set();
  for (const row of hangar?.hulls ?? []) if (typeof row?.id === 'string') used.add(row.id);
  for (let i = 1; i < 1000; i++) {
    const id = `hull_prize_${i}`;
    if (!used.has(id)) return id;
  }
  return null;
}

/**
 * A hangar row for a kept claimed hull: her class and faction, her name, the
 * kit her class implies and class-fresh vitals. An NPC record carries no
 * per-ship loadout — its weapons are class defaults (every hull a cannon; a
 * class that seats a turret fires one; a class that seats a launcher fires
 * missiles) — and nobody strips a derelict's mounts, so the row gets what
 * the ship fought with: the auto turret where the class seats a turret, the
 * dart rack with an EMPTY magazine where it seats a launcher (she fired
 * them), tier-0 scanner and laser (no NPC hull carries either), no racks, an
 * empty hold (the manifest emptied when she became a derelict). Owner
 * decision on PR #161. `hot: true` rides the row for good: the hull's
 * faction standing stays docked and a later sale (issue #158) pays the
 * hot-hull rate wherever it is sold.
 */
function prizeHangarRow(ctx, entry) {
  const id = nextPrizeHullId(ctx.world?.hangar);
  if (!id) return null;
  const classKey = Object.hasOwn(SHIP_CLASSES, entry.classKey) ? entry.classKey : 'light';
  const faction = entry.faction ?? 'independent';
  const fresh = createShipState(classKey, { name: entry.name ?? classKey, faction });
  return {
    id,
    hullKind: hullKindFor(faction),
    faction,
    classKey,
    name: entry.name ?? classKey,
    scanner: 0,
    miningLaser: 0,
    concealedMounts: false,
    launcher: canSeat(classKey, 'missile') ? 'dart' : '',
    missileAmmo: 0,
    turret: canSeat(classKey, 'turret') ? 'auto' : '',
    cargoCapacity: cargoHoldFor(classKey),
    cargo: [],
    hull: fresh.hull,
    hullMax: fresh.hullMax,
    screen: fresh.screen,
    screenMax: fresh.screenMax,
    shell: fresh.shell,
    shellMax: fresh.shellMax,
    engine: fresh.engine,
    engineMax: fresh.engineMax,
    heat: 0,
    hot: true,
  };
}

/**
 * Settle ONE claimed hull at a berth by the player's choice (issue #159;
 * shipyard-desk.js Claimed hulls pane). Nothing settles on dock any more.
 *   • 'keep'   — the hull joins the hangar as an owned `hot` row with the
 *                kit her class implies (prizeHangarRow). Refused with
 *                'stock' at a berth with no yard and
 *                'full' when the hangar has no room. The standing stays
 *                docked: the risk comes with the hull.
 *   • 'sell'   — the yard pays ECON.hotHullFence of hullPrizeValue at
 *                opts.hotRate (clamped; rolled when absent) — the same figure
 *                claimSalePrice quotes.
 *   • 'return' — only at a station of the hull's own faction: no pay, and the
 *                standing the claim cost comes back. Refused 'faction'
 *                elsewhere.
 * Every refusal moves nothing and names the reason; a settled entry leaves
 * the ledger and emits `hullSettled` (outcome kept | sold | returned).
 */
export function settleClaimedHull(ctx, id, verb, opts = {}) {
  if (!ctx?.world) return { ok: false, reason: 'missing' };
  if (!CLAIM_VERBS.includes(verb)) return { ok: false, reason: 'verb' };
  if (!ctx.flags?.docked) return { ok: false, reason: 'dock' };
  const list = claimedHullsOf(ctx.world);
  const idx = findClaimed(ctx, id);
  if (idx < 0) return { ok: false, reason: 'missing' };
  const e = list[idx];
  const systemId = typeof opts.systemId === 'string' ? opts.systemId : ctx.world.currentSystem;
  const stationFaction = Object.hasOwn(opts, 'stationFaction') ? opts.stationFaction : (ctx.systems?.[systemId]?.faction ?? null);
  const options = claimedHullOptions(ctx, e, stationFaction);
  if (options[verb]) return { ok: false, reason: options[verb] };
  const name = e.name ?? 'the hull';
  let credits = 0;
  let repBack = 0;
  let hullId = null;
  let line;
  if (verb === 'keep') {
    const row = prizeHangarRow(ctx, e);
    const added = row ? addPurchasedHull(ctx, row) : { ok: false, reason: 'full' };
    if (!added.ok) return { ok: false, reason: added.reason === 'full' ? 'full' : 'invalid' };
    hullId = added.row.id;
    line = `${name} is on your papers now. Hangar has her — hot, and the ${factionName(e.faction)} still want a word.`;
  } else if (verb === 'return') {
    repBack = e.repHit > 0 ? addRep(ctx, e.faction, e.repHit) : 0;
    line = `${factionName(e.faction)} yard takes ${name} back. No pay — but they note you brought her home.`;
  } else {
    credits = claimSalePrice(e, opts.hotRate);
    const purse = fin(ctx.world.credits) ? ctx.world.credits : 0;
    ctx.world.credits = purse + credits;
    line = `Yard takes ${name} off your hands. ${credits} UU, no questions.`;
  }
  list.splice(idx, 1);
  const outcome = verb === 'keep' ? 'kept' : verb === 'sell' ? 'sold' : 'returned';
  const s = { targetId: e.id, targetName: name, classKey: e.classKey, faction: e.faction, outcome, credits, repBack, hullId, system: systemId, line };
  ctx.emit('hullSettled', s);
  ctx.emit('commLine', { text: line, from: 'station' });
  requestAutosave(ctx);
  return { ok: true, outcome, credits, repBack, hullId, receipt: s };
}

/** Save-time heal (save.js): a corrupt ledger is dropped, corrupt entries are skipped, the cap holds. */
export function sanitizeClaimedHulls(world) {
  if (!world || typeof world !== 'object' || !Object.hasOwn(world, 'claimedHulls')) return false;
  const raw = world.claimedHulls;
  if (!Array.isArray(raw)) {
    delete world.claimedHulls;
    return false;
  }
  const clean = [];
  for (let i = 0; i < raw.length && clean.length < PRIZE_CLAIM.max; i++) {
    const e = raw[i];
    if (!e || typeof e !== 'object' || Array.isArray(e) || e.v !== CLAIMED_HULL_VERSION) continue;
    clean.push({
      v: CLAIMED_HULL_VERSION,
      id: typeof e.id === 'string' ? e.id.slice(0, STRING_MAX) : null,
      name: typeof e.name === 'string' ? e.name.slice(0, STRING_MAX) : null,
      classKey: Object.hasOwn(SHIP_CLASSES, e.classKey) ? e.classKey : 'light',
      faction: typeof e.faction === 'string' && Object.hasOwn(FACTIONS, e.faction) ? e.faction : null,
      reason: REASON_SET.has(e.reason) ? e.reason : 'crewPods',
      claimedAt: fin(e.claimedAt) ? e.claimedAt : 0,
      system: typeof e.system === 'string' ? e.system.slice(0, STRING_MAX) : null,
      repHit: fin(e.repHit) && e.repHit >= 0 ? Math.min(100, e.repHit) : 0,
    });
  }
  world.claimedHulls = clean;
  return true;
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
