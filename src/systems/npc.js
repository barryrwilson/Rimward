import * as THREE from 'three';
import {
  SHIP_CLASSES,
  FACTIONS,
  U,
  WEAPONS,
  ECON,
  NAMED_GUNS,
  createShipState,
  tickShipState,
  computeResolve,
  resolveBand,
  cargoValue,
  HIDDEN_MOUNTS,
  ORIGIN_ARCS,
  MINING_LASERS,
} from '../game/state.js';
import { buildShipAsset, isShipAssetReady, releaseShipAsset, updateShipAsset } from './ship-assets.js';
import { epicEffects } from '../game/epics.js';
import { spawnPod, spawnSurvivorPod } from '../game/pods.js';
import { turnRateFor } from '../game/flight-feel.js';
import { scaleFor } from '../game/ship-scale.js';
import { PHY } from '../game/physics.js';
import { collectBodies, resolveMover } from '../game/collision.js';

/**
 * NPC system — live GLB ship assets and AI (doc §6.7, §7).
 *
 * Exports the cross-worker API traffic.js imports:
 *   spawnLiveShip(ctx, record, position) → { id, record, object, state, role, ai }
 *   removeLiveShip(ctx, liveShip)
 *
 * record fields read: { id?, classKey, role ('trader'|'patrol'|'pirate'|'ace'|'miner'),
 *   name?, faction?, cargo?, resolve?, personality?, bounty?, route?: Vector3[],
 *   anchor?: Vector3 }
 *
 * AI modes: route (trader), loiter (patrol), hunt (pirate), duel (ace),
 * mine (miner), plus surrender modes flee/drift. Hostiles telegraph ≥3 s before the first
 * shot (§6.1): direct approach + flashing engine glow + a commLine. Fire is
 * emitted as 'npcFire' { ship, weapon:'cannon', target } — combat.js
 * aims at target ('player' or a live ship) and spawns the projectile.
 *
 * Resolve (§7.2–7.5) is recomputed ~1 Hz for hostiles-with-intent and for any
 * ship recently in combat. Bands drive behavior: defiant presses, shaken
 * weaves with visible power waver, bargaining opens one combat hail,
 * capitulate picks a §7.5 outcome (cut engines / jettison / flee / crew pods).
 *
 * update() performs zero allocations: all scratch vectors/quaternions are
 * module-scope; allocations happen only on spawn, hail, or capitulation
 * (event-time, not per-frame). Death FX is a fixed pool. PHY-02 lookahead
 * steer and resolveMover bounce reuse module dest/out records.
 *
 * GLB templates provide all NPC hull forms. Each live root exposes its
 * collision proxy, outer engine-effect group, and LOD visual to AI and combat.
 */


// ---------- module-scope scratch (no per-frame allocation) ----------
const NEG_Z = new THREE.Vector3(0, 0, -1);
const UP = new THREE.Vector3(0, 1, 0);
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _aimAvoid = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _toT = new THREE.Vector3();
const _away = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _bodies = { count: 0, items: [] };
let _gax = 0;
let _gay = 0;
let _gaz = 1;
const _hit = {
  px: 0, py: 0, pz: 0,
  vx: 0, vy: 0, vz: 0,
  hit: false, kind: null, speed: 0,
  nx: 0, ny: 0, nz: 0, overlap: 0,
};

let _phyOn = false;

const TELEGRAPH_SECONDS = 3; // §6.1 minimum hostile-intent warning
const NPC_FIRE_INTERVAL = 1 / (WEAPONS.cannon.rof * 0.5); // ~0.5× player rof
const ACE_FURY_INTERVAL = NPC_FIRE_INTERVAL * 0.65;
const LAW_ZONE_RADIUS = 300; // station law zone: no hostile intent develops
const HOSTILE_STANDING = -10; // patrols hunt the player at or below this standing
const RESOLVE_INTERVAL = 1; // s between resolve recomputes
const THREAT_MEMORY = 12; // s a ship stays wary after last combat
const TRADER_FLEE_HIT = 10; // s a graze keeps a trader in flee after lastHitAt
const FIRE_FACE_DOT = 0.92; // must roughly face target to fire
const DEATH_CHIP_COUNT = 8; // chips emitted per kill
const DEATH_BURST_SLOTS = 3; // concurrent bursts; ring-reused
const CHIP_LIFE_MIN = 0.4;
const CHIP_LIFE_MAX = 0.8;
const DEMAND_COOLDOWN = 300; // s before the same pirate record may demand the player again (record.demandedAt)
const WAKE_SITE_DISTANCE = 1400; // = U.DEINSTANTIATE_RANGE (state.js; traffic.js despawns there) — the wake site sits beyond the fold
// Abeam offsets stay inside ~35° of LOS at typical fight range so a chase
// keeps the hull on glass. Old 160/240 parked them just off-screen.
const ENVELOPE_ABEAM = 110;
const ENVELOPE_EXTEND_DIST = 140;
const ENVELOPE_CLOSE_DIST = 220;
const ENVELOPE_CLOSE_RATE = 40; // u/s along LOS
const ENVELOPE_EXTEND_ABEAM = 140;
const ENVELOPE_EXTEND_PAST = 120;
const ENVELOPE_APPROACH_DIST = 350;
const ENVELOPE_APPROACH_OFFSET = 60;
const ACE_HELIX_R = 180;
const ENV_PRESS = 0;
const ENV_EXTEND = 1;
const ENV_APPROACH = 2;
const GUN_PASS_MIN = 80;
const GUN_PASS_HOLD = 1.35; // readable attack run through the player's sights
const TELEGRAPH_HOLD = 200; // stay in cannon range, facing, during the warning // below this, extend only — no hull as flight dest
const MINER_CARGO_CAP = 8;
const MINER_RANGE = MINING_LASERS[0].range;
const MINER_HIT_INTERVAL = 0.22;
const MINER_EXTRACT_PER_SEC = Math.min(0.6, MINING_LASERS[0].extractPerSec);
const MINER_FACE_DOT = 0.88;
const MINER_WORK_TIME = 12;
const MINER_BEAM_MAX = 2;
const MINER_HOLD_PAD = 12; // extra stand-off beyond cylinder + hull
const MINER_HOLD_ARRIVE = 28; // dock when this close to the hold, not the pad
const GATE_TUBE_FALLBACK = 2.2; // RING_TUBE if body.y0 is missing
const _minePts = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
let _minePtIdx = 0;
const _minerBeams = [];
const _minerBeamMat = new THREE.LineBasicMaterial({
  color: MINING_LASERS[0].beamColor,
  blending: THREE.AdditiveBlending,
  transparent: true,
  opacity: 0.72,
  depthWrite: false,
});
let _minerBeamCursor = 0;

// Player-interest model (wave 32): pirates no longer lock the player on
// sight — always-on pursuit read as instant attack on every system entry.
// Each live pirate decides ONCE per instantiation whether the player is
// worth its attention; the rest hunt the lane's traders or loiter. The roll
// is biased by the record's persisted temper (greed), the player's current
// manifest, and fear (they have heard of you). Injected hunters
// (record.alwaysHuntsPlayer — the Ledger's collector) never roll.
const INTEREST = {
  base: 0.25, // a drifter with an empty hold is still sometimes worth a look
  temperSpan: 0.35, // per-record greed weight — record.temper (persisted, lazy-rolled)
  cargoSpan: 0.3, // a rich manifest draws the lane's eyes
  cargoNormUU: 800, // manifest value that maxes the draw
  fearRepel: 0.004, // per fear point — your name precedes you
  min: 0.05, // the rim keeps its teeth: never fully safe
  max: 0.9, // and never a certainty
};

let nextShipId = 1;

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}


/**
 * Build an NPC hull from its already-primed GLB template. The root pivot,
 * collision proxy, outer engine-effect group, and LOD visual stay stable for
 * combat, traffic, and Q-ship replacement.
 */
export function buildShipMesh(classKey, faction, role) {
  return buildShipAsset(classKey, faction, role);
}

/** Player plated hull from the NPC builder. Null if the SKU is not primed. */
export function buildPlayerPlatedMesh(classKey, faction) {
  const role = 'trader';
  if (!isShipAssetReady(faction, classKey, role)) return null;
  return buildShipMesh(classKey, faction, role);
}

/** Advance asset animation and choose the active distance LOD. */
export function animateShipMesh(object, elapsed, reducedMotion = false, camera) {
  updateShipAsset(object, elapsed, reducedMotion, camera);
}

// ---------- AI construction ----------
function ring(center, radius, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(
      new THREE.Vector3(
        center.x + Math.cos(a) * radius,
        center.y + (Math.random() - 0.5) * 24,
        center.z + Math.sin(a) * radius,
      ),
    );
  }
  return pts;
}

function makeAi(ctx, record, startPos) {
  const role = record.role ?? 'trader';
  const mode = role === 'pirate' ? 'hunt'
    : role === 'ace' ? 'duel'
    : role === 'trader' ? 'route'
    : role === 'miner' ? 'mine'
    : 'loiter';
  const ai = {
    mode,
    role,
    t: 0,
    phase: null, // null | 'telegraph' | 'attack'
    phaseStart: 0,
    acePhase: 1,
    target: null, // 'player' | live ship
    intent: false, // hostile intent toward the player (drives ctx.flags.combat)
    commSent: false,
    recognitionSent: false, // ace recognition/rematch line fires once per instance
    hailed: false,
    surrenderDone: false,
    demandSent: false, // wave 30: one demand hail per instantiation (reset never)
    demanding: false, // demand card open: hold position, weapons cold
    demandOutcome: null, // stamped by hail.js: 'paid'|'bluffed'|'refused'|'failed'
    demandPeaceAt: 0, // demand open time; a player hit after this voids the parley
    resolveBoost: 0, // wave 30: failed-bluff sting (hail.js showTeeth); see updateResolve for lifecycle
    playerRolled: false, // wave 32: the interest decision is made once per instantiation
    playerInterested: false,
    scratched: false, // hull or screen dipped this instance (trader/patrol memory)
    lastAttacker: null, // 'player' | live ship | 'npc' — instance only, not saved
    survivorsSpawned: false, // one crew pod per hull; crewPods and destroy share this
    fleeFrom: null, // 'player' | live ship — trader job flee source
    band: 'defiant',
    resolveAt: 0,
    fireAt: 0,
    gunPassUntil: 0,
    velocity: new THREE.Vector3(),
    wp: 0,
    waypoints: null,
    calmUntil: 0,
    disabledInit: false,
    driftVel: new THREE.Vector3(),
    weaveSeed: Math.random() * Math.PI * 2,
  };
  if ((mode === 'route' || mode === 'mine') && Array.isArray(record.route) && record.route.length > 0) {
    ai.waypoints = record.route;
  } else if (mode === 'route' || mode === 'mine') {
    ai.waypoints = ring(startPos, 90, 3);
  } else {
    ai.waypoints = ring(record.anchor ?? ctx.config.world.stationPosition, 80 + Math.random() * 70, 4);
  }
  return ai;
}

// ---------- cross-worker API (imported by traffic.js) ----------
// Contract (agreed with world/traffic owner): spawnLiveShip ONLY constructs —
// scene add, state, ai. traffic.js owns the ctx.ships list and pushes the
// returned object itself. removeLiveShip removes the mesh only; traffic
// splices the list (its splice is defensive if the entry is already gone).
export function spawnLiveShip(ctx, record, position) {
  // Disguised Q-ship (wave 31, contract with world.js/hud.js): a pirate
  // record flagged qship and not yet revealed spawns in its COVER identity —
  // freighter mesh, cover faction, trader-looking hull. State below stays
  // REAL (createShipState(record.classKey, …): cutter stats under the
  // freighter skin — the overpowered engines are the in-fiction tell), and
  // live.role stays record.role ('pirate') so other pirates never hunt it.
  const cover = record.qship === true && !record.revealed;
  const meshClass = cover ? (record.coverClass ?? 'freighter') : record.classKey;
  const meshFaction = cover ? (record.coverFaction ?? record.faction) : record.faction;
  const meshRole = cover ? 'trader' : (record.role ?? SHIP_CLASSES[record.classKey]?.role ?? 'trader');
  if (!isShipAssetReady(meshFaction, meshClass, meshRole)) return null;
  const object = buildShipMesh(meshClass, meshFaction, meshRole);
  object.position.copy(position);
  ctx.scene.add(object);
  // createShipState reads { name, faction, cargo, resolve, personality,
  // bounty } — record carries personality/bounty; records carry resolveSeed
  // (0..1), which createShipState does not read, so map it onto resolve.
  const state = createShipState(record.classKey, {
    ...record,
    resolve: record.resolve ?? Math.round((record.resolveSeed ?? 0.5) * 100),
  });
  // Illyx rematch ladder: he fled a defeat and comes back harder, up to TWO
  // bumps (+15 resolve each, capped at 95). Each bump requires one more
  // recorded ace defeat than bumps already taken. record.rematchCount
  // (JSON-plain, persisted) counts bumps taken; the bump is written back onto
  // record.resolve, which createShipState prefers on every later
  // instantiation, so despawn/re-instantiation reuses it instead of
  // stacking another +15.
  if (
    record.name === 'Carver Illyx' &&
    (record.rematchCount ?? 0) < 2 &&
    (ctx.world.aceRivalry?.defeats ?? 0) > (record.rematchCount ?? 0) &&
    record.state !== 'dead' &&
    record.state !== 'captured'
  ) {
    record.rematchCount = (record.rematchCount ?? 0) + 1;
    record.resolve = Math.min(95, (record.resolve ?? 55) + 15);
    state.resolve = record.resolve;
  }
  // Wave 32: the Ledger's collector never rolls for interest — he has your
  // vector. Name-keyed so saves written before alwaysHuntsPlayer existed
  // self-heal on his next instantiation (world.js injectCollector stamps
  // the flag at injection for new records).
  if (record.name === ORIGIN_ARCS.ledgerDebt.collector.name) record.alwaysHuntsPlayer = true;
  const live = {
    id: record.id ?? `npc-${nextShipId++}`,
    record,
    object,
    state,
    role: record.role ?? SHIP_CLASSES[record.classKey]?.role ?? 'trader',
    ai: null,
  };
  live.ai = makeAi(ctx, record, position);
  return live;
}

export function removeLiveShip(ctx, liveShip) {
  releaseShipAsset(liveShip.object);
  ctx.scene.remove(liveShip.object);
}

// ---------- shared helpers ----------
function say(ctx, live, text) {
  ctx.emit('commLine', { text, from: live.state.name });
}

function bumpFear(ctx, delta) {
  ctx.world.fear = Math.max(0, Math.min(100, ctx.world.fear + delta));
  ctx.emit('fearChanged', { fear: ctx.world.fear });
}

/**
 * Flee wake-site stamping (wave 30, contract with wakes.js): when a pirate
 * or ace breaks off, stamp where its wake can later be trailed — current
 * position + forward heading × WAKE_SITE_DISTANCE (1400 = U.DEINSTANTIATE_RANGE,
 * so the site sits beyond traffic.js's despawn fold). Overwritten on each
 * flee. JSON-plain only (plain array — records serialize through save.js);
 * allocation is event-time, never per-frame. Skips null records and
 * non-pirate/ace ships. Exported for hail.js, which resolves several of the
 * flee entries.
 */
export function stampWakeSite(live) {
  const rec = live.record;
  if (!rec) return;
  const role = live.role ?? rec.role;
  if (role !== 'pirate' && role !== 'ace') return;
  _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
  const p = live.object.position;
  rec.wakeSite = {
    position: [p.x + _fwd.x * WAKE_SITE_DISTANCE, p.y + _fwd.y * WAKE_SITE_DISTANCE, p.z + _fwd.z * WAKE_SITE_DISTANCE],
    found: false,
  };
}

/**
 * Reveal a disguised Q-ship (wave 31, contract with world.js/hud.js):
 * world.js stamps rec.qship/coverClass/coverName/coverFaction on designated
 * pirate records; hud.js reads rec.revealed for the CONCEALED MOUNTS tell.
 * Fires exactly once per record — rec.revealed is JSON-plain/persisted, the
 * lane saw it, it stays seen — on the first hostile act (updateHunt
 * acquisition) or the first hull/screen scratch. The mesh is rebuilt in the
 * REAL identity in place; shared geometries/materials are never disposed
 * (removeLiveShip precedent — just scene.remove). userData.glow is set by
 * the builder and every consumer looks it up per-call from live.object, so
 * the swap is safe. say() reads state.name — the REAL name, correct at
 * reveal. The milestone is once-EVER, not per ship.
 *
 * Proxy cache invalidation: testNpcHits caches the proxy on live._proxyRx/Ry/Half
 * and only refreshes when _proxyRx is undefined. Swapping the mesh changes
 * userData.proxy; clear all three fields here so the next hit test re-reads from
 * the new hull's proxy, not from the cover mesh.
 */
function revealQship(ctx, live) {
  const rec = live.record;
  if (!rec?.qship || rec.revealed) return;
  rec.revealed = true; // persisted — the lane saw it, it stays seen
  const object = buildShipMesh(rec.classKey, rec.faction, rec.role ?? SHIP_CLASSES[rec.classKey]?.role ?? 'trader');
  object.position.copy(live.object.position);
  object.quaternion.copy(live.object.quaternion);
  releaseShipAsset(live.object);
  ctx.scene.remove(live.object);
  ctx.scene.add(object);
  live.object = object;
  // Invalidate the per-ship proxy cache (testNpcHits, combat.js). The cache is
  // keyed to the mesh: a cover freighter proxy must not survive the swap to the
  // real cutter hull. Setting _proxyRx back to undefined triggers a fresh read
  // from live.object.userData.proxy on the very next hit test.
  live._proxyRx  = undefined;
  live._proxyRy  = undefined;
  live._proxyHalf = undefined;
  say(ctx, live, 'The manifest lied.');
  if (!ctx.world.milestones.includes('qshipUnmasked')) {
    ctx.world.milestones.push('qshipUnmasked');
    ctx.emit('milestone', { id: 'qshipUnmasked', line: 'The lane wears masks. You saw one come off.' });
  }
}

function speedCap(live) {
  const cls = SHIP_CLASSES[live.state.classKey];
  return live.state.engineOut ? cls.cruise * 0.3 : cls.cruise;
}

/** Collision sphere for bounce/avoid. Prefer scale.maxRadius; else 3. */
function npcRadius(live) {
  const sc = scaleFor(live.state.classKey);
  if (sc && Number.isFinite(sc.maxRadius) && sc.maxRadius > 0) return sc.maxRadius;
  const p = sc && sc.proxy;
  if (p) {
    const r = Math.hypot(p.rx || 0, p.ry || 0, p.halfLen || 0);
    if (r > 0) return r;
  }
  return 3;
}

function skipAvoidBody(live, body) {
  if (body.kind === 'ship' && body.id === live.id) return true;
  const target = live.ai.target;
  if (target === 'player' && body.kind === 'player') return true;
  if (target && target !== 'player' && body.kind === 'ship' && body.id === target.id) return true;
  return false;
}

function writeGateAxis(body) {
  const axis = body && body.axis;
  let ax;
  let ay;
  let az;
  if (axis && Number.isFinite(axis.x) && Number.isFinite(axis.y) && Number.isFinite(axis.z)) {
    ax = axis.x;
    ay = axis.y;
    az = axis.z;
  } else if (Array.isArray(axis) && axis.length >= 3) {
    ax = axis[0];
    ay = axis[1];
    az = axis[2];
  } else {
    ax = -(body.x || 0);
    ay = -(body.y || 0);
    az = -(body.z || 0);
  }
  const len = Math.hypot(ax, ay, az);
  if (len < 1e-8) {
    _gax = 0;
    _gay = 0;
    _gaz = 1;
    return;
  }
  _gax = ax / len;
  _gay = ay / len;
  _gaz = az / len;
}

function gateTubeR(body) {
  const t = body && body.y0;
  return Number.isFinite(t) && t > 0 ? t : GATE_TUBE_FALLBACK;
}

/** Torus vs gate ring. Bore is empty; tube is solid. */
export function gateProbeHits(px, py, pz, rad, body) {
  if (!body) return false;
  const R = Number.isFinite(body.r) ? body.r : 0;
  const tube = gateTubeR(body);
  const pr = rad > 0 ? rad : 0;
  writeGateAxis(body);
  const dx = px - body.x;
  const dy = py - body.y;
  const dz = pz - body.z;
  const axial = dx * _gax + dy * _gay + dz * _gaz;
  const rx = dx - axial * _gax;
  const ry = dy - axial * _gay;
  const rz = dz - axial * _gaz;
  const rho = Math.hypot(rx, ry, rz);
  return Math.hypot(rho - R, axial) < tube + pr;
}

/** Nearest point on the ring centerline. Writes out. */
function nearestGateRing(px, py, pz, body, out) {
  writeGateAxis(body);
  const R = Number.isFinite(body.r) ? body.r : 0;
  const dx = px - body.x;
  const dy = py - body.y;
  const dz = pz - body.z;
  const axial = dx * _gax + dy * _gay + dz * _gaz;
  let rx = dx - axial * _gax;
  let ry = dy - axial * _gay;
  let rz = dz - axial * _gaz;
  let rho = Math.hypot(rx, ry, rz);
  if (rho < 1e-8) {
    rx = -_gaz;
    ry = 0;
    rz = _gax;
    rho = Math.hypot(rx, ry, rz);
    if (rho < 1e-8) {
      rx = 1;
      ry = 0;
      rz = 0;
      rho = 1;
    }
  }
  const s = R / rho;
  out.x = body.x + rx * s;
  out.y = body.y + ry * s;
  out.z = body.z + rz * s;
  return out;
}

function stationCylHits(px, py, pz, rad, body) {
  let ymin = body.y + body.y0;
  let ymax = body.y + body.y1;
  if (ymin > ymax) {
    const tmp = ymin;
    ymin = ymax;
    ymax = tmp;
  }
  const pr = rad > 0 ? rad : 0;
  if (py < ymin - pr || py > ymax + pr) return false;
  const rr = body.r + pr;
  const dx = px - body.x;
  const dz = pz - body.z;
  return dx * dx + dz * dz < rr * rr;
}

/** 0 none, 1 path/probe, 2 hull already inside the keep-out. */
function stationKeepOutHits(px, py, pz, sx, sy, sz, rad, body) {
  if (stationCylHits(sx, sy, sz, rad, body)) return 2;
  if (stationCylHits(px, py, pz, rad, body)) return 1;
  let ymin = body.y + body.y0;
  let ymax = body.y + body.y1;
  if (ymin > ymax) {
    const tmp = ymin;
    ymin = ymax;
    ymax = tmp;
  }
  const pr = rad > 0 ? rad : 0;
  if (Math.max(sy, py) < ymin - pr || Math.min(sy, py) > ymax + pr) return 0;
  const abx = px - sx;
  const abz = pz - sz;
  const apx = body.x - sx;
  const apz = body.z - sz;
  const ab2 = abx * abx + abz * abz;
  let t = 0;
  if (ab2 > 1e-12) t = (apx * abx + apz * abz) / ab2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const qx = sx + abx * t - body.x;
  const qz = sz + abz * t - body.z;
  const rr = body.r + pr;
  return qx * qx + qz * qz < rr * rr ? 1 : 0;
}

function probeHitsBody(px, py, pz, rad, body) {
  if (body.kind === 'station') return stationCylHits(px, py, pz, rad, body);
  if (body.kind === 'gate') return gateProbeHits(px, py, pz, rad, body);
  const rr = body.r + rad;
  const dx = px - body.x;
  const dy = py - body.y;
  const dz = pz - body.z;
  return dx * dx + dy * dy + dz * dz < rr * rr;
}

function addLateralAway(ox, oy, oz, px, py, pz) {
  _away.set(px - ox, py - oy, pz - oz);
  _away.addScaledVector(_fwd, -_away.dot(_fwd));
  if (_away.lengthSq() < 1e-8) {
    _away.crossVectors(_fwd, UP);
    if (_away.lengthSq() < 1e-8) _away.set(1, 0, 0);
  }
  const len = Math.sqrt(_away.lengthSq());
  _v2.addScaledVector(_away, 1 / len);
}

function addStationOutXZ(sx, sz, cx, cz) {
  let ox = sx - cx;
  let oz = sz - cz;
  let len = Math.hypot(ox, oz);
  if (len < 1e-8) {
    ox = -_fwd.x;
    oz = -_fwd.z;
    len = Math.hypot(ox, oz);
    if (len < 1e-8) {
      ox = 1;
      oz = 0;
      len = 1;
    }
  }
  _v2.x += (ox / len) * 2;
  _v2.z += (oz / len) * 2;
}

/**
 * Bias an aim point laterally around the nearest lookahead obstacle.
 * Writes outAim. Does not replace combat / waypoint aims — only adds offset.
 */
function applyAvoidBias(live, targetPos, outAim) {
  outAim.copy(targetPos);
  if (!_phyOn) return outAim;
  const object = live.object;
  const pos = object.position;
  _fwd.copy(NEG_Z).applyQuaternion(object.quaternion);
  const look = PHY.AVOID_LOOKAHEAD;
  const px = pos.x + _fwd.x * look;
  const py = pos.y + _fwd.y * look;
  const pz = pos.z + _fwd.z * look;
  const rad = npcRadius(live);
  _v2.set(0, 0, 0);
  let hits = 0;
  let insideStation = false;
  const n = _bodies.count;
  for (let i = 0; i < n; i++) {
    const body = _bodies.items[i];
    if (!body || skipAvoidBody(live, body)) continue;
    if (body.kind === 'station') {
      const how = stationKeepOutHits(px, py, pz, pos.x, pos.y, pos.z, rad, body);
      if (!how) continue;
      if (how === 2) {
        insideStation = true;
        addStationOutXZ(pos.x, pos.z, body.x, body.z);
      } else {
        addLateralAway(body.x, body.y, body.z, px, py, pz);
      }
      hits += 1;
      continue;
    }
    if (!probeHitsBody(px, py, pz, rad, body)) continue;
    if (body.kind === 'gate') {
      nearestGateRing(px, py, pz, body, _v3);
      addLateralAway(_v3.x, _v3.y, _v3.z, px, py, pz);
    } else {
      addLateralAway(body.x, body.y, body.z, px, py, pz);
    }
    hits += 1;
  }
  if (hits > 0 && _v2.lengthSq() > 1e-8) {
    _v2.normalize();
    const gain = insideStation ? look * PHY.AVOID_GAIN * 2 : look * PHY.AVOID_GAIN;
    outAim.addScaledVector(_v2, gain);
  }
  return outAim;
}

function appendSunBody(ctx) {
  const sun = ctx.config && ctx.config.world && ctx.config.world.sunPosition;
  const sys = ctx.systems && ctx.systems[ctx.world.currentSystem];
  const sunR0 = sys && sys.sunRadius;
  if (!sun || !Number.isFinite(sunR0) || sunR0 <= 0) return;
  if (!Number.isFinite(sun.x) || !Number.isFinite(sun.y) || !Number.isFinite(sun.z)) return;
  const i = _bodies.count;
  let slot = _bodies.items[i];
  if (!slot) {
    slot = { kind: '', x: 0, y: 0, z: 0, r: 0, y0: 0, y1: 0, id: 0 };
    _bodies.items[i] = slot;
  }
  slot.kind = 'sun';
  slot.x = sun.x;
  slot.y = sun.y;
  slot.z = sun.z;
  slot.r = sunR0 * PHY.SUN_HEAT_MULT;
  slot.y0 = 0;
  slot.y1 = 0;
  slot.id = 0;
  _bodies.count = i + 1;
}

/** Safety-net slide. Derives vel from last pos; folds bounce vel into heading. */
function bounceLive(live, dt) {
  const object = live.object;
  const p = object.position;
  const ai = live.ai;
  let vx;
  let vy;
  let vz;
  if (Number.isFinite(ai._px) && dt > 1e-8) {
    vx = (p.x - ai._px) / dt;
    vy = (p.y - ai._py) / dt;
    vz = (p.z - ai._pz) / dt;
  } else if (live.state.disabled || ai.mode === 'drift') {
    vx = ai.driftVel.x;
    vy = ai.driftVel.y;
    vz = ai.driftVel.z;
  } else {
    _fwd.copy(NEG_Z).applyQuaternion(object.quaternion);
    const spd = speedCap(live);
    vx = _fwd.x * spd;
    vy = _fwd.y * spd;
    vz = _fwd.z * spd;
  }
  if (!Number.isFinite(vx) || !Number.isFinite(vy) || !Number.isFinite(vz)) {
    vx = 0;
    vy = 0;
    vz = 0;
  }
  resolveMover(p.x, p.y, p.z, vx, vy, vz, npcRadius(live), _bodies, 'ship', live.id, _hit);
  if (_hit.hit && Number.isFinite(_hit.px) && Number.isFinite(_hit.py) && Number.isFinite(_hit.pz)) {
    p.set(_hit.px, _hit.py, _hit.pz);
    const n = Math.hypot(_hit.vx, _hit.vy, _hit.vz);
    const oldN = Math.hypot(vx, vy, vz);
    const dirChanged = n > 1e-4 && (oldN <= 1e-4 || (vx * _hit.vx + vy * _hit.vy + vz * _hit.vz) < 0.995 * oldN * n);
    if (dirChanged) {
      _v1.set(_hit.vx / n, _hit.vy / n, _hit.vz / n);
      _q.setFromUnitVectors(NEG_Z, _v1);
      if (Number.isFinite(_q.x)) object.quaternion.copy(_q);
    }
    if ((live.state.disabled || ai.mode === 'drift') && Number.isFinite(_hit.vx)) {
      ai.driftVel.set(_hit.vx, _hit.vy, _hit.vz);
    }
  }
  ai._px = p.x;
  ai._py = p.y;
  ai._pz = p.z;
}

/** Rotate toward target and advance along -Z. Returns distance to target. */
function steer(object, targetPos, speed, turnRate, dt) {
  _v1.subVectors(targetPos, object.position);
  const dist = _v1.length();
  if (dist > 1e-3) {
    _v1.divideScalar(dist);
    _q.setFromUnitVectors(NEG_Z, _v1);
    object.quaternion.rotateTowards(_q, turnRate * dt);
  }
  if (speed > 0) {
    _fwd.copy(NEG_Z).applyQuaternion(object.quaternion);
    object.position.addScaledVector(_fwd, speed * dt);
  }
  return dist;
}

function steerLive(live, targetPos, speed, dt) {
  const aim = _phyOn ? applyAvoidBias(live, targetPos, _aimAvoid) : targetPos;
  const dist = steer(live.object, aim, speed, turnRateFor(live.state.classKey, speed), dt);
  _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
  live.ai.velocity.copy(_fwd).multiplyScalar(speed);
  return dist;
}

function abeamSign(ai) {
  return Math.sin(ai.weaveSeed) >= 0 ? 1 : -1;
}

/** Writes unit LOS into _toT. Returns distance. */
function losTo(fromPos, targetPos) {
  _toT.subVectors(targetPos, fromPos);
  const dist = _toT.length();
  if (dist > 1e-3) _toT.divideScalar(dist);
  else _toT.set(0, 0, 1);
  return dist;
}

/** Horizontal unit offset from LOS. Writes _v3. */
function setAbeam(sign) {
  _v3.crossVectors(_toT, UP);
  const lenSq = _v3.lengthSq();
  if (lenSq < 1e-6) _v3.set(sign, 0, 0);
  else _v3.multiplyScalar(sign / Math.sqrt(lenSq));
}

/**
 * Defiant / ace combat aim. Writes outAim. Returns ENV_PRESS | ENV_EXTEND | ENV_APPROACH.
 * targetVel may be null. Uses current heading for "past" vs inbound.
 */
function applyCombatEnvelope(object, targetPos, speed, targetVel, sign, outAim) {
  const dist = losTo(object.position, targetPos);
  setAbeam(sign);
  _fwd.copy(NEG_Z).applyQuaternion(object.quaternion);
  let closing = _fwd.dot(_toT) * speed;
  if (targetVel) closing -= targetVel.dot(_toT);
  const extend = dist < ENVELOPE_EXTEND_DIST || (dist < ENVELOPE_CLOSE_DIST && closing > ENVELOPE_CLOSE_RATE);
  if (extend) {
    if (_fwd.dot(_toT) < 0) {
      outAim.copy(targetPos).addScaledVector(_fwd, ENVELOPE_EXTEND_PAST).addScaledVector(_v3, ENVELOPE_EXTEND_ABEAM);
    } else {
      outAim.copy(targetPos).addScaledVector(_v3, ENVELOPE_EXTEND_ABEAM).addScaledVector(_toT, ENVELOPE_EXTEND_PAST);
    }
    return ENV_EXTEND;
  }
  if (dist > ENVELOPE_APPROACH_DIST) {
    outAim.copy(targetPos).addScaledVector(_v3, ENVELOPE_APPROACH_OFFSET);
    return ENV_APPROACH;
  }
  if (dist < ENVELOPE_ABEAM) {
    outAim.copy(targetPos).addScaledVector(_v3, ENVELOPE_ABEAM);
    return ENV_PRESS;
  }
  outAim.copy(targetPos);
  return ENV_PRESS;
}

/** Attack gun-pass: nose on target so FIRE_FACE_DOT can land, then extend. */
function canGunPass(ai, now, dist) {
  if (ai.phase !== 'attack' || ai.demanding) return false;
  if (ai.band === 'bargaining') return false;
  if (now < (ai.gunPassUntil ?? 0)) return true;
  if (now < (ai.fireAt ?? 0)) return false;
  if (dist >= GUN_PASS_MIN && dist < WEAPONS.cannon.range) {
    ai.gunPassUntil = now + GUN_PASS_HOLD;
    return true;
  }
  return false;
}

function facingDot(object, targetPos) {
  _fwd.copy(NEG_Z).applyQuaternion(object.quaternion);
  _toT.subVectors(targetPos, object.position).normalize();
  return _fwd.dot(_toT);
}

function hideMinerBeams() {
  for (let i = 0; i < _minerBeams.length; i++) _minerBeams[i].visible = false;
  _minerBeamCursor = 0;
}

function showMinerBeam(ctx, from, to, reducedMotion) {
  if (reducedMotion) return;
  if (_minerBeamCursor >= MINER_BEAM_MAX) return;
  let line = _minerBeams[_minerBeamCursor];
  if (!line) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    line = new THREE.Line(geo, _minerBeamMat);
    line.name = 'npc-mine-beam';
    line.frustumCulled = false;
    _minerBeams.push(line);
  }
  if (ctx.scene && line.parent !== ctx.scene) ctx.scene.add(line);
  const arr = line.geometry.attributes.position.array;
  arr[0] = from.x; arr[1] = from.y; arr[2] = from.z;
  arr[3] = to.x; arr[4] = to.y; arr[5] = to.z;
  line.geometry.attributes.position.needsUpdate = true;
  line.visible = true;
  _minerBeamCursor++;
}

function nearestSoftRock(ctx, fromPos) {
  const list = ctx.asteroids && ctx.asteroids.list;
  if (!list) return null;
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a || (a.hardness ?? 1) > 1) continue;
    if ((a.ore ?? 1) <= 0) continue;
    const p = a.position;
    if (!p) continue;
    const dx = p.x - fromPos.x;
    const dy = p.y - fromPos.y;
    const dz = p.z - fromPos.z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) {
      best = a;
      bestD = d;
    }
  }
  return best;
}

function minerHoldPoint(livePos, rockPos, rockRadius, out) {
  _v2.subVectors(livePos, rockPos);
  const stand = Math.max(MINER_RANGE * 0.62, (rockRadius || 8) + 18);
  const lenSq = _v2.lengthSq();
  if (lenSq < 1e-6) {
    out.copy(rockPos);
    out.x += stand;
    return;
  }
  out.copy(rockPos).addScaledVector(_v2, stand / Math.sqrt(lenSq));
}

function dockMiner(live, now) {
  const rec = live.record;
  if (!rec) return;
  rec.state = 'docked';
  rec.leg = 0;
  rec.legT = 0;
  rec.dir = 1;
  rec.mineHold = false;
  rec.dwellUntil = now + 30 + Math.random() * 30;
}

/** Station hold outside the cylinder. Writes out. Never aims through the pad. */
export function minerHoldFromStation(station, livePos, hullR, out) {
  if (!out || !station) return out;
  const hull = Number.isFinite(hullR) && hullR > 0 ? hullR : 0;
  const pad = PHY.STATION_CYL_RADIUS + hull + MINER_HOLD_PAD;
  let ox = 0;
  let oz = 0;
  if (livePos) {
    ox = livePos.x - station.x;
    oz = livePos.z - station.z;
  }
  const len = Math.hypot(ox, oz);
  if (len < 1e-6) {
    ox = 1;
    oz = 0;
  } else {
    ox /= len;
    oz /= len;
  }
  out.x = station.x + ox * pad;
  out.y = Number.isFinite(station.y) ? station.y : 0;
  out.z = station.z + oz * pad;
  return out;
}

function holdApproachPos(live, station, out) {
  const p = live.object.position;
  const dx = p.x - station.x;
  const dz = p.z - station.z;
  if (dx * dx + dz * dz > 1e-8) {
    live.ai._holdOx = dx;
    live.ai._holdOz = dz;
    out.x = p.x;
    out.y = p.y;
    out.z = p.z;
    return out;
  }
  const lx = live.ai._holdOx;
  const lz = live.ai._holdOz;
  if (Number.isFinite(lx) && Number.isFinite(lz) && lx * lx + lz * lz > 1e-8) {
    out.x = station.x + lx;
    out.y = p.y;
    out.z = station.z + lz;
    return out;
  }
  _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
  let hx = -_fwd.x;
  let hz = -_fwd.z;
  if (hx * hx + hz * hz < 1e-8) {
    hx = 1;
    hz = 0;
  }
  out.x = station.x + hx;
  out.y = p.y;
  out.z = station.z + hz;
  return out;
}

function steerMinerHome(ctx, live, dt, now, reducedMotion) {
  const station = ctx.config && ctx.config.world && ctx.config.world.stationPosition;
  if (!station) {
    updateRoute(ctx, live, dt, now, reducedMotion);
    return;
  }
  holdApproachPos(live, station, _v3);
  minerHoldFromStation(station, _v3, npcRadius(live), _aim);
  const pos = live.object.position;
  const holdDist = Math.hypot(pos.x - _aim.x, pos.y - _aim.y, pos.z - _aim.z);
  steerLive(live, _aim, speedCap(live) * 0.85, dt);
  if (holdDist < MINER_HOLD_ARRIVE) {
    dockMiner(live, now);
    live.ai.haul = false;
    live.ai.workUntil = 0;
  }
}

function updateMine(ctx, live, dt, now, reducedMotion) {
  const ai = live.ai;
  const rec = live.record;
  if (rec && rec.state === 'docked') return;
  if (rec) rec.cargo ??= [];
  const cargo = rec?.cargo ?? live.state.cargo;
  const pos = live.object.position;

  if (ai.haul) {
    steerMinerHome(ctx, live, dt, now, reducedMotion);
    return;
  }

  const rock = nearestSoftRock(ctx, pos);
  if (!rock) {
    if (cargoUnitsOf(cargo) > 0) {
      ai.haul = true;
      steerMinerHome(ctx, live, dt, now, reducedMotion);
      return;
    }
    updateRoute(ctx, live, dt, now, reducedMotion);
    return;
  }

  minerHoldPoint(pos, rock.position, rock.radius, _aim);
  const dist = pos.distanceTo(rock.position);
  steerLive(live, _aim, speedCap(live) * 0.7, dt);

  const inRange = dist <= MINER_RANGE;
  const facing = facingDot(live.object, rock.position) > MINER_FACE_DOT;
  if (!inRange || !facing) return;

  _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
  _v1.copy(pos).addScaledVector(_fwd, 6);
  const pt = _minePts[_minePtIdx];
  _minePtIdx = (_minePtIdx + 1) % _minePts.length;
  pt.copy(rock.position);
  _v2.subVectors(pos, rock.position);
  if (_v2.lengthSq() > 1e-6) _v2.normalize();
  else _v2.set(0, 1, 0);
  pt.addScaledVector(_v2, rock.radius || 4);
  showMinerBeam(ctx, _v1, pt, reducedMotion);

  if (now >= (ai.fireAt || 0)) {
    ai.fireAt = now + MINER_HIT_INTERVAL;
    ctx.emit('mineHit', {
      asteroidId: rock.id,
      point: pt,
      laserTier: 0,
      extractPerSec: MINER_EXTRACT_PER_SEC,
    });
    if (Array.isArray(cargo) && cargoUnitsOf(cargo) < MINER_CARGO_CAP) {
      if (now - (ai.mineAt || 0) >= 2) {
        ai.mineAt = now;
        addMinerOre(cargo, rock.oreKey || 'rawOre', 1);
      }
    } else {
      if (!ai.workUntil) ai.workUntil = now + MINER_WORK_TIME;
      if (now >= ai.workUntil) ai.haul = true;
    }
  }
  if ((rock.ore ?? 1) <= 0 && cargoUnitsOf(cargo) > 0) ai.haul = true;
}

function playerNear(ctx, live, range) {
  const o = ctx.ship.object;
  return !!o && live.object.position.distanceTo(o.position) < range;
}

/** Live faction standing. Missing table, missing faction, or non-finite → 0. */
export function standingOf(ctx, live) {
  const fac = live.record?.faction ?? live.state?.faction;
  const table = ctx.world && ctx.world.reputation;
  const raw = table && fac != null ? table[fac] : 0;
  return Number.isFinite(raw) ? raw : 0;
}

/** Who last damaged this hull. Dead ship refs clear. Instance-only. */
export function lastAttackerOf(live) {
  const ai = live && live.ai;
  if (!ai) return null;
  const a = ai.lastAttacker;
  if (a === 'player' || a === 'npc') return a;
  if (a && a.state && !a.state.destroyed) return a;
  if (a) ai.lastAttacker = null;
  return null;
}

/** Latch + read: hull or screen went below max this instantiation. */
export function isScratched(live) {
  const ai = live.ai;
  if (!ai) return false;
  if (ai.scratched) return true;
  const st = live.state;
  if (!st) return false;
  const hullLow = Number.isFinite(st.hull) && Number.isFinite(st.hullMax) && st.hull < st.hullMax;
  const screenLow = Number.isFinite(st.screen) && Number.isFinite(st.screenMax) && st.screen < st.screenMax;
  if (hullLow || screenLow) {
    ai.scratched = true;
    return true;
  }
  return false;
}

/**
 * Whether this hull may lock the player as a hunt target.
 * Traders and miners never. Patrols only if the player scratched them or standing ≤ -10.
 * An NPC scratch does not authorize a player hunt. Pirates/aces remain
 * eligible; interest/retaliation still decide.
 */
function isCivilianRole(role) {
  return role === 'trader' || role === 'miner';
}

export function mayHuntPlayer(ctx, live) {
  const role = live?.ai?.role ?? live?.role ?? live?.record?.role;
  if (isCivilianRole(role)) return false;
  if (role === 'patrol') {
    if (standingOf(ctx, live) <= HOSTILE_STANDING) return true;
    return isScratched(live) && lastAttackerOf(live) === 'player';
  }
  return role === 'pirate' || role === 'ace';
}

function hunterRole(other) {
  return other.role ?? other.record?.role;
}

/** Pirate/ace currently working a trader or the player. */
export function hunterHasWork(other, station) {
  const role = hunterRole(other);
  if (role !== 'pirate' && role !== 'ace') return false;
  const ai = other.ai;
  if (!ai) return false;
  if (ai.mode === 'flee' || ai.mode === 'drift') return false;
  const t = ai.target;
  if (!t) return false;
  if (station && other.object && other.object.position.distanceTo(station) < LAW_ZONE_RADIUS) return false;
  if (t === 'player') return ai.intent === true || ai.mode === 'hunt' || ai.mode === 'duel';
  const tRole = t.role ?? t.record?.role;
  return isCivilianRole(tRole) && !t.state?.destroyed;
}

/** First live pirate/ace whose hunt target is this hull. */
export function findHunterOf(ctx, live) {
  const ships = ctx.ships;
  if (!ships) return null;
  for (let i = 0; i < ships.length; i++) {
    const other = ships[i];
    if (other === live || !other.ai) continue;
    const st = other.state;
    if (!st || st.destroyed || st.disabled || st.surrendered) continue;
    const role = hunterRole(other);
    if (role !== 'pirate' && role !== 'ace') continue;
    if (other.ai.target === live) return other;
  }
  return null;
}

/** Nearest in-bubble pirate/ace working a trader or the player. */
export function findPirateWork(ctx, live) {
  const ships = ctx.ships;
  if (!ships || !live.object) return null;
  const station = ctx.config && ctx.config.world && ctx.config.world.stationPosition;
  const pos = live.object.position;
  let best = null;
  let bestD = U.ENCOUNTER_BUBBLE;
  for (let i = 0; i < ships.length; i++) {
    const other = ships[i];
    if (other === live || !other.ai || !other.object) continue;
    const st = other.state;
    if (!st || st.destroyed || st.disabled || st.surrendered) continue;
    if (!hunterHasWork(other, station)) continue;
    const d = pos.distanceTo(other.object.position);
    if (d < bestD) {
      best = other;
      bestD = d;
    }
  }
  return best;
}

/** Recent graze or shields still down — not a lasting hull scratch. */
export function traderHitPanic(st, now) {
  if (!st) return false;
  const hitAt = st.lastHitAt;
  if (Number.isFinite(hitAt) && Number.isFinite(now) && now - hitAt >= 0 && now - hitAt <= TRADER_FLEE_HIT) {
    return true;
  }
  return Number.isFinite(st.screen) && Number.isFinite(st.screenMax) && st.screen < st.screenMax;
}

export function tickTraderJob(ctx, live) {
  const ai = live.ai;
  const st = live.state;
  if (!ai || !st || st.surrendered || ai.mode === 'drift') return;
  const hunter = findHunterOf(ctx, live);
  const now = ctx.world && ctx.world.time;
  if (hunter || traderHitPanic(st, now)) {
    if (ai.mode !== 'flee') {
      ai.mode = 'flee';
      ai.phase = null;
      ai.intent = false;
    }
    ai.fleeFrom = hunter || 'player';
    return;
  }
  if (ai.mode === 'flee') {
    ai.mode = 'route';
    ai.fleeFrom = null;
    breakOff(ai);
  }
}

function cargoUnitsOf(cargo) {
  if (!Array.isArray(cargo)) return 0;
  let n = 0;
  for (let i = 0; i < cargo.length; i++) n += cargo[i].units | 0;
  return n;
}

function addMinerOre(cargo, key, units) {
  if (!Array.isArray(cargo) || units <= 0) return;
  for (let i = 0; i < cargo.length; i++) {
    if (cargo[i].commodity === key) {
      cargo[i].units = (cargo[i].units | 0) + units;
      return;
    }
  }
  cargo.push({ commodity: key, units });
}

export function tickMinerJob(ctx, live) {
  const ai = live.ai;
  const st = live.state;
  if (!ai || !st || st.surrendered || ai.mode === 'drift') return;
  const hunter = findHunterOf(ctx, live);
  const now = ctx.world && ctx.world.time;
  if (hunter || traderHitPanic(st, now)) {
    if (ai.mode !== 'flee') {
      ai.mode = 'flee';
      ai.phase = null;
      ai.intent = false;
    }
    ai.fleeFrom = hunter || 'player';
    return;
  }
  if (ai.mode === 'flee') {
    ai.mode = 'mine';
    ai.fleeFrom = null;
    breakOff(ai);
  }
}

function tickPatrolJob(ctx, live) {
  const ai = live.ai;
  const st = live.state;
  if (!ai || !st || st.surrendered || ai.mode === 'drift' || ai.mode === 'flee') return;
  if (mayHuntPlayer(ctx, live) || findPirateWork(ctx, live)) {
    if (ai.mode !== 'hunt') ai.mode = 'hunt';
    return;
  }
  if (ai.mode === 'hunt') {
    ai.mode = 'loiter';
    breakOff(ai);
  }
}

// ---------- resolve & the fear economy (§7.2–7.5) ----------
function updateResolve(ctx, live, now) {
  const st = live.state;
  const ai = live.ai;
  const hostile = (ai.mode === 'hunt' || ai.mode === 'duel') && ai.intent;
  const threatened = now - st.lastCombatAt < THREAT_MEMORY;
  // resolveBoost lifecycle (wave 30, failed-bluff sting): instance-scoped —
  // unlike the Illyx rematch ladder it is never written to record, so it
  // dies with the live ship on despawn. It lives only while the ship keeps
  // pressing the fight; every stand-down clears it here: intent dropped
  // (flee/drift via capitulate, breakOff, or a hail resolution) or a calm
  // window (paid off, bluffed, tribute, respect). Disabled ships never
  // reach this function — the update loop clears the boost there instead.
  if (!hostile || now < ai.calmUntil) ai.resolveBoost = 0;
  if (!hostile && !threatened) return;
  if (now < ai.calmUntil) return;

  const shieldFrac = (st.screen + st.shell) / (st.screenMax + st.shellMax);
  const defense = shieldFrac * 0.5 + (st.hull / st.hullMax) * 0.35 + (st.engine / st.engineMax) * 0.15;
  let force = 0.5;
  const p = ctx.player;
  if (p) {
    const playerFrac = ((p.screen + p.shell) / (p.screenMax + p.shellMax)) * 0.5 + (p.hull / p.hullMax) * 0.5;
    const ownFrac = shieldFrac * 0.5 + (st.hull / st.hullMax) * 0.5;
    force = clamp01(0.5 + (playerFrac - ownFrac) * 0.5);
  }
  // Pirate resolve gets the faction epic's pirateResolveMod as an additive
  // nudge alongside personality (Red Ledger epic stage 3 = -10: they yield
  // sooner). epicEffects is pure — reads ctx.world.epics, writes nothing.
  st.resolve = computeResolve(
    {
      defense: clamp01(defense),
      force,
      fear: clamp01(ctx.world.fear / 100),
      cargoAtStake: clamp01(cargoValue(st.cargo, ctx.world.prices) / 2000),
      doctrine: FACTIONS[st.faction]?.doctrine ?? 0.5,
    },
    ai.role === 'pirate'
      // Wave 9: no Named Guns left, every pirate has heard — additive -5
      // alongside the epic mod while 'rimWithoutGuns' stands.
      ? st.personality + (epicEffects(ctx, live.record?.faction ?? st.faction).pirateResolveMod ?? 0)
        + (ctx.world.milestones.includes('rimWithoutGuns') ? NAMED_GUNS.brokenResolveMod : 0)
      : st.personality,
  );
  // Failed-bluff sting (wave 30): applied AFTER the recompute so this 1s
  // loop can't erase it; capped at 95 like every resolve write. Cleared on
  // the stand-down gate above, so a paid-off or bluffed-into-flight pirate
  // never carries it — one that fights on keeps it for the encounter.
  st.resolve = Math.min(95, st.resolve + (ai.resolveBoost ?? 0));
  const band = resolveBand(st.resolve);
  if (band === ai.band) return;
  ai.band = band;
  if (band === 'bargaining' && !ai.hailed && !ai.demanding && playerNear(ctx, live, U.TARGET_RANGE)) {
    ai.hailed = true;
    say(ctx, live, 'Terms. Name them.');
    ctx.emit('hailOpened', { ship: live, intents: intentsFor(ctx, live), line: 'They are breaking.' });
  } else if (band === 'capitulate') {
    capitulate(ctx, live);
  }
}

function intentsFor(ctx, live) {
  const st = live.state;
  const intents = [];
  intents.push('demandRansom');
  if (cargoValue(st.cargo, ctx.world.prices) > 0) intents.push('acceptTribute');
  // Named-ace respect: a feared pilot can ask a Named Gun to stand down.
  if ((live.record?.role ?? live.role) === 'ace' && ctx.world.fear >= 15) intents.push('respect');
  intents.push('letGo', 'keepFiring');
  return intents;
}

/**
 * Demand-hail intents (wave 30): the pirate's opening offer to the player.
 * 'showTeeth' — the hidden-mounts Q-ship bluff — exists only once the player
 * owns concealed mounts (ctx.world.concealedMounts, worker-B contract).
 */
function demandIntentsFor(ctx, live) {
  const intents = ['payTribute'];
  if (ctx.world.concealedMounts === true) intents.push('showTeeth');
  intents.push('refuseFight');
  return intents;
}

function jettison(ctx, live, crewPods) {
  spillShipCargo(ctx, live);
  if (crewPods) spawnShipSurvivor(ctx, live);
}

function survivorSourceOf(live) {
  return lastAttackerOf(live) === 'player' ? 'playerKill' : 'other';
}

/**
 * One escape-pod survivor from a live hull. Unknowables have no conventional
 * crew. A missing faction (dead wreck record) skips. crewPods and destroy
 * share ai.survivorsSpawned so a later kill cannot dump crew twice.
 */
export function spawnShipSurvivor(ctx, live, drift = null) {
  if (!ctx || !live) return null;
  const ai = live.ai;
  if (ai && ai.survivorsSpawned) return null;
  const faction = live.record?.faction ?? live.state?.faction;
  if (!faction || faction === 'unknowables') return null;
  const pos = live.object && live.object.position;
  if (!pos) return null;
  const source = survivorSourceOf(live);
  const name = live.record?.name;
  const spec = { faction, source };
  if (name) spec.name = name;
  _v1.set(
    pos.x + (Math.random() - 0.5) * 6,
    pos.y + (Math.random() - 0.5) * 6,
    pos.z + (Math.random() - 0.5) * 6,
  );
  const pod = spawnSurvivorPod(ctx, _v1, spec, drift);
  if (ai) ai.survivorsSpawned = true;
  return pod;
}

/**
 * Spill a live ship's remaining manifest as scoopable pods. Empty holds
 * spawn nothing (no fake loot). Returns the number of cargo pods created.
 * Salvage hail and destroy share this so a dump cannot pay twice.
 */
export function spillShipCargo(ctx, live) {
  const st = live && live.state;
  const cargo = st && st.cargo;
  const pos = live && live.object && live.object.position;
  if (!cargo || !pos) return 0;
  let n = 0;
  for (const entry of cargo) {
    const units = entry && (entry.units | 0);
    if (units <= 0 || !entry.commodity) continue;
    _v1.set(pos.x + (Math.random() - 0.5) * 8, pos.y + (Math.random() - 0.5) * 8, pos.z + (Math.random() - 0.5) * 8);
    spawnPod(ctx, [{ commodity: entry.commodity, units }], _v1);
    n++;
  }
  cargo.length = 0;
  return n;
}

function capitulate(ctx, live) {
  const st = live.state;
  const ai = live.ai;
  if (ai.surrenderDone) return;
  ai.surrenderDone = true;
  st.surrendered = true;
  ai.phase = null;
  ai.intent = false;
  ai.target = null;

  // §7.5: critical hull → crew pods; intact cargo → jettison; pirates/aces run.
  let outcome;
  if (st.hull / st.hullMax < 0.4) outcome = 'crewPods';
  else if (st.cargo.length > 0) outcome = 'jettison';
  else if (ai.role === 'pirate' || ai.role === 'ace') outcome = 'flee';
  else outcome = 'cutEngines';

  const glow = live.object.userData.glow;
  if (outcome === 'jettison' || outcome === 'crewPods') jettison(ctx, live, outcome === 'crewPods');
  if (outcome === 'flee') {
    ai.mode = 'flee';
    stampWakeSite(live);
    say(ctx, live, 'Breaking off.');
  } else {
    ai.mode = 'drift';
    _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
    ai.driftVel.copy(_fwd).multiplyScalar(8); // dead-stick drift
    glow.visible = false; // engines cut
    say(ctx, live, outcome === 'crewPods' ? 'Abandoning ship.' : outcome === 'jettison' ? 'Cargo loose.' : 'We yield.');
  }
  bumpFear(ctx, ECON.fear.capitulation); // witnessed capitulation +2
  ctx.emit('npcSurrendered', { ship: live, outcome });
}

// ---------- movement modes ----------
function updateRoute(ctx, live, dt, now, reducedMotion) {
  const ai = live.ai;
  const cap = speedCap(live);
  const glow = live.object.userData.glow;
  const wp = ai.waypoints[ai.wp];
  let speed = cap * 0.85;
  _aim.copy(wp);
  if (ai.band === 'bargaining') {
    speed = cap * 0.12; // holding, waiting on the hail
    glow.scale.setScalar(0.8);
  } else if (ai.band === 'shaken') {
    // wider evasion + power waver (§7.3)
    _v2.subVectors(wp, live.object.position);
    if (_v2.lengthSq() < 1e-6) _v2.set(0, 0, 1);
    else _v2.normalize();
    _v3.crossVectors(_v2, UP);
    if (_v3.lengthSq() < 1e-6) _v3.set(1, 0, 0);
    else _v3.normalize();
    _aim.addScaledVector(_v3, Math.sin(now * 2.1 + ai.weaveSeed) * 40);
    speed = cap * (0.85 + 0.15 * Math.sin(now * 5 + ai.weaveSeed));
    glow.scale.setScalar(reducedMotion ? 1 : 1 + 0.45 * Math.sin(now * 8 + ai.weaveSeed));
  } else {
    glow.scale.setScalar(1);
  }
  const dist = steerLive(live, _aim, speed, dt);
  if (dist < 25) ai.wp = (ai.wp + 1) % ai.waypoints.length;
}

function updateLoiter(live, dt) {
  const ai = live.ai;
  const speed = speedCap(live) * 0.5;
  const dist = steerLive(live, ai.waypoints[ai.wp], speed, dt);
  if (dist < 25) ai.wp = (ai.wp + 1) % ai.waypoints.length;
}

function breakOff(ai) {
  ai.target = null;
  ai.phase = null;
  ai.intent = false;
}

export function setTarget(ai, target) {
  if (target === 'player' && isCivilianRole(ai.role)) return;
  ai.target = target;
  ai.phase = null;
  ai.intent = false;
}

function engageTarget(ctx, live, dt, now, targetPos, reducedMotion) {
  const ai = live.ai;
  const glow = live.object.userData.glow;
  if (!ai.phase) {
    ai.phase = 'telegraph';
    ai.phaseStart = now;
    ai.commSent = false;
  }
  ai.intent = ai.target === 'player';
  const dist = live.object.position.distanceTo(targetPos);
  const cap = speedCap(live);
  let speed = cap;
  _aim.copy(targetPos);

  const shaken = ai.band === 'shaken' || (ai.band === 'bargaining' && ai.hailed);
  if ((ai.band === 'bargaining' && !ai.hailed) || ai.demanding) {
    // mid-offer / demand hail open (wave 30): hold position, weapons cold
    speed = cap * 0.15;
    glow.scale.setScalar(0.7);
  } else if (shaken) {
    // wider evasion + visible power waver (§7.3)
    _v2.subVectors(targetPos, live.object.position);
    if (_v2.lengthSq() < 1e-6) _v2.set(0, 0, 1);
    else _v2.normalize();
    _v3.crossVectors(_v2, UP);
    if (_v3.lengthSq() < 1e-6) _v3.set(1, 0, 0);
    else _v3.normalize();
    _aim.addScaledVector(_v3, Math.sin(now * 2.2 + ai.weaveSeed) * 70).addScaledVector(UP, Math.cos(now * 1.7 + ai.weaveSeed) * 35);
    speed = cap * (0.8 + 0.2 * Math.sin(now * 5 + ai.weaveSeed));
    glow.scale.setScalar(reducedMotion ? 1 : 1 + 0.5 * Math.sin(now * 9 + ai.weaveSeed));
  } else if (ai.phase === 'telegraph') {
    // Warning: face the target. Creep in; do not ram. The first attack
    // shot needs FIRE_FACE_DOT after the 3 s freeze-after-demand.
    _aim.copy(targetPos);
    speed = dist > TELEGRAPH_HOLD ? cap * 0.35 : cap * 0.12;
  } else {
    // defiant: offset approach, abeam press, extend on close/high closure.
    const targetVel = ai.target === 'player' ? ctx.ship?.velocity : null;
    const mode = applyCombatEnvelope(live.object, targetPos, cap, targetVel, abeamSign(ai), _aim);
    speed = mode === ENV_EXTEND ? cap * 0.70 : cap;
    glow.scale.setScalar(1.3);
  }
  if (canGunPass(ai, now, dist)) {
    _aim.copy(targetPos);
    if (speed > cap * 0.45) speed = cap * 0.45;
  }
  steerLive(live, _aim, speed, dt);

  if (ai.phase === 'telegraph') {
    if (ai.demanding) {
      ai.phaseStart = now; // demand hold: telegraph stays frozen, weapons cold
      return;
    }
    if (!ai.commSent) {
      ai.commSent = true;
      say(ctx, live, ai.role === 'ace' ? 'Run if you like.' : 'Heave to. Cargo or hull.');
    }
    glow.scale.setScalar(reducedMotion ? 1 : Math.max(0.3, 1 + 0.7 * Math.sin(now * 14))); // flashing warning
    if (now - ai.phaseStart >= TELEGRAPH_SECONDS) ai.phase = 'attack';
    return;
  }
  if (ai.band === 'bargaining' || ai.demanding) return; // no fire while talking
  const interval = ai.acePhase === 3 && ai.mode === 'duel' ? ACE_FURY_INTERVAL : shaken ? NPC_FIRE_INTERVAL * 1.5 : NPC_FIRE_INTERVAL;
  if (now >= ai.fireAt && dist < WEAPONS.cannon.range && facingDot(live.object, targetPos) > FIRE_FACE_DOT) {
    ai.fireAt = now + interval;
    ctx.emit('npcFire', { ship: live, weapon: 'cannon', target: ai.target });
  }
}

/**
 * The chance a pirate takes an interest in the player (wave 32). Reads the
 * record's persisted temper and live world state; the ONLY write is the
 * lazy temper stamp (finite-guarded — old saves roll it on first sight, a
 * hand-edited non-numeric temper re-rolls instead of NaN-ing the chance
 * (wave-32 security LOW, closed wave 34); the spawnLiveShip rematch
 * write-back discipline). Exported for the boot test.
 */
export function playerInterestChance(ctx, record) {
  if (record?.alwaysHuntsPlayer === true) return 1; // injected hunters (the Ledger's collector)
  // per-record greed — rolled once ever, persisted; non-finite heals
  if (record && !Number.isFinite(record.temper)) record.temper = Math.random();
  const cargo = clamp01(cargoValue(ctx.cargo, ctx.world.prices) / INTEREST.cargoNormUU);
  const p = INTEREST.base + (record?.temper ?? 0.5) * INTEREST.temperSpan
    + cargo * INTEREST.cargoSpan - ctx.world.fear * INTEREST.fearRepel;
  return Math.min(INTEREST.max, Math.max(INTEREST.min, p));
}

/** Roll once per instantiation whether this pirate hunts the player. */
function playerInterestedIn(ctx, live) {
  const ai = live.ai;
  if (!ai.playerRolled) {
    ai.playerRolled = true;
    ai.playerInterested = Math.random() < playerInterestChance(ctx, live.record);
  }
  return ai.playerInterested;
}

function updateHunt(ctx, live, dt, now, reducedMotion) {
  const ai = live.ai;
  const station = ctx.config.world.stationPosition;

  // A damage scratch strips the facade (wave 31): screen recharges in
  // combat, but this runs every frame — any hit is caught next frame.
  const st = live.state;
  if (live.record?.qship && !live.record.revealed && (st.hull < st.hullMax || st.screen < st.screenMax)) {
    revealQship(ctx, live);
  }

  // Retaliation (wave 32 / 57): a player scratch overrides the interest
  // roll for the rest of the instantiation. NPC bolts stamp lastAttacker
  // on the victim; only lastAttacker === 'player' turns a pirate/ace or a
  // scratched patrol onto the player. A pirate that shoots a patrol must
  // not send that patrol after the player — they keep pirate work or
  // return to loiter. Law-zone pacifism still holds: no intent develops
  // inside the zone. setTarget re-arms the telegraph. Traders never
  // enter this path. Patrols do not latch pirate interest.
  if (
    ai.role !== 'patrol' &&
    !isCivilianRole(ai.role) &&
    ai.target !== 'player' &&
    lastAttackerOf(live) === 'player' &&
    (st.hull < st.hullMax || st.screen < st.screenMax) &&
    ctx.ship.object &&
    !ctx.flags.docked &&
    ctx.ship.object.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
    live.object.position.distanceTo(station) >= LAW_ZONE_RADIUS
  ) {
    ai.playerRolled = true; // the scratch IS the roll — no dice after notice
    ai.playerInterested = true;
    setTarget(ai, 'player');
  } else if (
    ai.role === 'patrol' &&
    ai.target !== 'player' &&
    isScratched(live) &&
    lastAttackerOf(live) === 'player' &&
    ctx.ship.object &&
    !ctx.flags.docked &&
    ctx.ship.object.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
    live.object.position.distanceTo(station) >= LAW_ZONE_RADIUS
  ) {
    setTarget(ai, 'player');
  }

  // Hostile/scratched patrols drop pirate work only when a player hunt is legal.
  if (
    ai.role === 'patrol' &&
    ai.target &&
    ai.target !== 'player' &&
    mayHuntPlayer(ctx, live)
  ) {
    const pObj = ctx.ship.object;
    if (
      pObj &&
      !ctx.flags.docked &&
      now >= (ctx.world.jumpGraceUntil ?? 0) &&
      pObj.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
      live.object.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
      live.object.position.distanceTo(pObj.position) < U.ENCOUNTER_BUBBLE
    ) {
      setTarget(ai, 'player');
    }
  }

  // Validate current target.
  let targetPos = null;
  if (ai.target === 'player') {
    if (ctx.ship.object && !ctx.flags.docked) targetPos = ctx.ship.object.position;
    else breakOff(ai);
  } else if (ai.target) {
    const t = ai.target;
    if (t.state.destroyed || t.state.disabled || t.state.surrendered || !ctx.ships.includes(t)) breakOff(ai);
    else targetPos = t.object.position;
  }

  if (targetPos) {
    const inLaw =
      targetPos.distanceTo(station) < LAW_ZONE_RADIUS ||
      live.object.position.distanceTo(station) < LAW_ZONE_RADIUS;
    if (inLaw) breakOff(ai); // station law zone: hostile intent never develops
    else if (live.object.position.distanceTo(targetPos) >= U.ENCOUNTER_BUBBLE) breakOff(ai);
  }

  // Acquire (wave 32): the interest roll decides whether this pirate bothers
  // with the player at all — the rest hunt the lane's traders. Arrival grace
  // shields the player from the roll itself: JUMP.graceSeconds' 'no hostile
  // intent on arrival' now covers targeting, not just the wave-30 demand.
  // Patrols never roll interest and never hunt traders. Traders never acquire.
  if (!ai.target) {
    const pObj = ctx.ship.object;
    if (ai.role === 'patrol') {
      if (
        mayHuntPlayer(ctx, live) &&
        pObj &&
        !ctx.flags.docked &&
        now >= (ctx.world.jumpGraceUntil ?? 0) &&
        pObj.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
        live.object.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
        live.object.position.distanceTo(pObj.position) < U.ENCOUNTER_BUBBLE
      ) {
        setTarget(ai, 'player');
        targetPos = pObj.position;
      } else {
        const work = findPirateWork(ctx, live);
        if (work) {
          setTarget(ai, work);
          targetPos = work.object.position;
        }
      }
    } else if (!isCivilianRole(ai.role)) {
      if (
        pObj &&
        !ctx.flags.docked &&
        now >= (ctx.world.jumpGraceUntil ?? 0) &&
        pObj.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
        live.object.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
        live.object.position.distanceTo(pObj.position) < U.ENCOUNTER_BUBBLE &&
        playerInterestedIn(ctx, live)
      ) {
        setTarget(ai, 'player');
        targetPos = pObj.position;
        // Reveal BEFORE the wave-30 demand-hail block below runs this frame —
        // the hail and bracket already show true colors: a 'freighter' closes,
        // flips, then 'Your cargo or your hull.'
        revealQship(ctx, live);
      } else {
        let best = null;
        let bestD = U.ENCOUNTER_BUBBLE;
        for (const other of ctx.ships) {
          if (other === live || !isCivilianRole(other.role)) continue;
          if (other.state.destroyed || other.state.disabled || other.state.surrendered) continue;
          if (other.object.position.distanceTo(station) < LAW_ZONE_RADIUS) continue;
          const d = live.object.position.distanceTo(other.object.position);
          if (d < bestD) {
            best = other;
            bestD = d;
          }
        }
        if (best) {
          setTarget(ai, best);
          targetPos = best.object.position;
          // Hostile act against a trader strips the disguise (wave 31).
          revealQship(ctx, live);
        }
      }
    }
  }

  if (!targetPos) {
    ai.phase = null;
    ai.intent = false;
    updateLoiter(live, dt);
    return;
  }

  // Demand hail (wave 30, §29 Q-ship beat): a hunting pirate that closes on
  // the player opens ONE demand hail before pressing the attack — tribute,
  // hidden-mount bluff, or refuse-and-fight, resolved in hail.js. Guards:
  // once per instantiation (ai.demandSent), per-record cooldown across
  // re-instantiation (record.demandedAt), never while docked or inside the
  // law zone (both already broken off above), never during jump grace, and
  // only inside U.TARGET_RANGE. The demand amount is rolled ONCE here so the
  // offer is stable (hail.js ransom pattern): 10× the tribute rate on the
  // player's cargo value, floored at HIDDEN_MOUNTS.demandMin.
  if (
    ai.target === 'player' &&
    ai.role === 'pirate' &&
    !ai.demandSent &&
    now >= (ctx.world.jumpGraceUntil ?? 0) &&
    now - (live.record?.demandedAt ?? -Infinity) >= DEMAND_COOLDOWN &&
    live.object.position.distanceTo(targetPos) < U.TARGET_RANGE
  ) {
    ai.demandSent = true; // reset never — one demand per instantiation
    ai.demanding = true;
    ai.demandOutcome = null;
    ai.demandPeaceAt = now; // a player hit stamped after this voids the parley
    if (live.record) live.record.demandedAt = now;
    const demand = Math.max(
      HIDDEN_MOUNTS.demandMin,
      Math.round(ECON.tributeRate * cargoValue(ctx.cargo, ctx.world.prices) * 10),
    );
    ctx.emit('hailOpened', { ship: live, intents: demandIntentsFor(ctx, live), line: 'Your cargo or your hull.', demand });
  }

  engageTarget(ctx, live, dt, now, targetPos, reducedMotion);
}

function updateDuel(ctx, live, dt, now, reducedMotion) {
  const ai = live.ai;
  const st = live.state;
  const cls = SHIP_CLASSES[st.classKey];
  const pObj = ctx.ship.object;
  if (!pObj || ctx.flags.docked) {
    ai.intent = false;
    updateLoiter(live, dt);
    return;
  }
  const playerPos = pObj.position;
  const station = ctx.config.world.stationPosition;
  const dist = live.object.position.distanceTo(playerPos);

  // Wait outside the law zone; approach from beyond the bubble without intent.
  if (playerPos.distanceTo(station) < LAW_ZONE_RADIUS || live.object.position.distanceTo(station) < LAW_ZONE_RADIUS) {
    ai.intent = false;
    ai.phase = null;
    updateLoiter(live, dt);
    return;
  }
  if (dist > U.ENCOUNTER_BUBBLE) {
    ai.intent = false;
    ai.phase = null;
    const approachSpeed = speedCap(live);
    steerLive(live, playerPos, approachSpeed, dt);
    return;
  }

  // Ace phase from own hull fraction (§6.7): helix → feint at 2/3 → fury at 1/3.
  const hullFrac = st.hull / st.hullMax;
  const phase = hullFrac > 2 / 3 ? 1 : hullFrac > 1 / 3 ? 2 : 3;
  if (phase !== ai.acePhase) {
    ai.acePhase = phase;
    if (phase === 2) say(ctx, live, 'Not bad.');
    if (phase === 3) say(ctx, live, 'Enough.');
  }

  ai.target = 'player';
  if (!ai.phase) {
    ai.phase = 'telegraph';
    ai.phaseStart = now;
    ai.commSent = false;
  }
  ai.intent = true;
  const glow = live.object.userData.glow;
  const cap = speedCap(live);
  const burning = !st.engineOut;
  let speed = cap;

  if (ai.band === 'bargaining') {
    speed = cap * 0.15;
    glow.scale.setScalar(0.7);
    _aim.copy(playerPos);
    steerLive(live, _aim, speed, dt);
    return; // no fire while bargaining (capitulation handled globally)
  }

  const sign = abeamSign(ai);
  const pVel = ctx.ship?.velocity ?? null;
  if (ai.acePhase === 1) {
    // Helix around the player.
    const a = now * 0.9 + ai.weaveSeed;
    _aim.set(
      playerPos.x + Math.cos(a) * ACE_HELIX_R,
      playerPos.y + Math.sin(now * 2.3 + ai.weaveSeed) * 40,
      playerPos.z + Math.sin(a) * ACE_HELIX_R,
    );
    if (dist < ENVELOPE_EXTEND_DIST) {
      applyCombatEnvelope(live.object, playerPos, cap, pVel, sign, _aim);
      speed = cap * 0.70;
    }
  } else if (ai.acePhase === 2) {
    // Feint: rush in, then break away on a ~6 s cycle. Extend inside 140 u.
    const cycle = (now + ai.weaveSeed) % 6;
    if (dist < ENVELOPE_EXTEND_DIST) {
      applyCombatEnvelope(live.object, playerPos, cap, pVel, sign, _aim);
      speed = cap * 0.70;
    } else if (cycle < 3) {
      _aim.copy(playerPos);
      speed = burning ? cls.burn : cap;
    } else {
      _v2.subVectors(live.object.position, playerPos).normalize();
      _aim.copy(playerPos).addScaledVector(_v2, 250);
      speed = cap;
    }
  } else {
    // Fury: abeam / extend, never copy the player position.
    const mode = applyCombatEnvelope(live.object, playerPos, burning ? cls.burn : cap, pVel, sign, _aim);
    speed = mode === ENV_EXTEND ? cap * 0.70 : burning ? cls.burn : cap;
  }
  if (canGunPass(ai, now, dist)) _aim.copy(playerPos);
  steerLive(live, _aim, speed, dt);

  if (ai.phase === 'telegraph') {
    if (!ai.commSent) {
      ai.commSent = true;
      // Recognition: a Named Gun acknowledges a known/hunted pilot. Priority:
      // aspirant (wave 10, a new name defines itself against the player) >
      // Sister Vane's first-ever encounter > Illyx lineage/rematch > fear
      // recognition > the generic line.
      let line = 'Run if you like.';
      if (!ai.recognitionSent) {
        ai.recognitionSent = true;
        const recName = live.record?.name;
        if (live.record?.aspirant) {
          // Aspirant cycle (wave 10): no mantle, no lineage — the new name
          // takes its measure from the pilot who broke the old lines.
          line = 'No mantle. No lineage. I take my name from yours.';
        } else if (recName === 'Sister Vane') {
          // Lineage generation: each fallen Vane is succeeded by the next.
          const gen = ctx.world.aceRivalry?.hunterGeneration ?? 0;
          line = gen >= 2
            ? 'The third Vane does not run, legend.'
            : gen === 1
              ? 'You killed her. The name you will have to kill again.'
              : 'The Ledger bought my wing for you.';
        } else if (recName === 'Carver Illyx' && (ctx.world.aceRivalry?.defeats ?? 0) > 0) {
          // Freehold lineage: the successor acknowledges the name he carries
          // before any rematch talk.
          line = (ctx.world.aceRivalry?.illyxGeneration ?? 0) >= 1
            ? 'I fly his wing now. You know how this ends.'
            : (live.record?.rematchCount ?? 0) < 2 ? 'Again.' : 'Again. Again.';
        } else if (ctx.world.fear >= 25) {
          line = 'They pay me to end you. Nothing personal, legend.';
        } else if (ctx.world.fear >= 15) {
          line = 'I know that hull. The whisper runs ahead of you.';
        }
      }
      say(ctx, live, line);
    }
    glow.scale.setScalar(reducedMotion ? 1 : Math.max(0.3, 1 + 0.7 * Math.sin(now * 14)));
    if (now - ai.phaseStart >= TELEGRAPH_SECONDS) ai.phase = 'attack';
    return;
  }
  glow.scale.setScalar(1.3);
  const interval = ai.acePhase === 3 ? ACE_FURY_INTERVAL : NPC_FIRE_INTERVAL;
  if (now >= ai.fireAt && dist < WEAPONS.cannon.range && facingDot(live.object, playerPos) > FIRE_FACE_DOT) {
    ai.fireAt = now + interval;
    ctx.emit('npcFire', { ship: live, weapon: 'cannon' });
  }
}

function threatPos(ctx, live) {
  const src = live.ai.fleeFrom;
  if (src && src !== 'player' && src.object && !src.state?.destroyed) return src.object.position;
  if (src === 'player') {
    const o = ctx.ship && ctx.ship.object;
    if (o) return o.position;
  }
  const pObj = ctx.ship && ctx.ship.object;
  return pObj ? pObj.position : null;
}

function updateFlee(ctx, live, dt) {
  const st = live.state;
  const cls = SHIP_CLASSES[st.classKey];
  const threat = threatPos(ctx, live);
  if (threat) {
    _v2.subVectors(live.object.position, threat);
    if (_v2.lengthSq() < 1e-6) {
      const station = ctx.config && ctx.config.world && ctx.config.world.stationPosition;
      if (station) _v2.subVectors(station, live.object.position);
    }
    if (_v2.lengthSq() < 1e-6) {
      _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
      _v2.copy(_fwd);
    } else {
      _v2.normalize();
    }
    _aim.copy(live.object.position).addScaledVector(_v2, 300);
  } else {
    const station = ctx.config && ctx.config.world && ctx.config.world.stationPosition;
    if (station) {
      minerHoldFromStation(station, live.object.position, npcRadius(live), _aim);
    } else {
      _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
      _aim.copy(live.object.position).addScaledVector(_fwd, 300);
    }
  }
  const fleeSpeed = st.engineOut ? cls.cruise * 0.3 : cls.burn;
  steerLive(live, _aim, fleeSpeed, dt);
  live.object.userData.glow.scale.setScalar(1.6);
  // traffic.js despawns at DEINSTANTIATE_RANGE — we just run.
}

function updateDrift(live, dt, reducedMotion) {
  // Surrendered, engines cut: drift and gentle tumble, glow dark.
  live.object.position.addScaledVector(live.ai.driftVel, dt);
  if (!reducedMotion) {
    live.object.rotation.x += dt * 0.12;
    live.object.rotation.z += dt * 0.08;
  }
}

function updateDisabled(live, dt, now, reducedMotion) {
  const ai = live.ai;
  if (!ai.disabledInit) {
    ai.disabledInit = true;
    _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
    ai.driftVel.copy(_fwd).multiplyScalar(6);
  }
  live.object.position.addScaledVector(ai.driftVel, dt);
  if (!reducedMotion) {
    live.object.rotation.x += dt * 0.35; // slow tumble
    live.object.rotation.y += dt * 0.22;
  }
  // dim flickering lights, no fire (reducedMotion: freeze dark, engines dead)
  live.object.userData.glow.visible = reducedMotion ? false : (now * 6 + ai.weaveSeed) % 1 < 0.18;
}

function hash01(n) {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

/** Fixed chip + flash meshes. Built once; visibility toggled, never spliced. */
function makeDeathBurstPool(scene) {
  const chipGeo = new THREE.BoxGeometry(1, 0.5, 0.12);
  const flashGeo = new THREE.SphereGeometry(1, 10, 8);
  const chips = [];
  const nChips = DEATH_BURST_SLOTS * DEATH_CHIP_COUNT;
  for (let i = 0; i < nChips; i++) {
    const mesh = new THREE.Mesh(
      chipGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffa060,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    );
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    chips.push({
      mesh,
      vel: new THREE.Vector3(),
      spinX: 0,
      spinY: 0,
      spinZ: 0,
      age: 0,
      life: 0,
    });
  }
  const flashes = [];
  for (let i = 0; i < DEATH_BURST_SLOTS; i++) {
    const mesh = new THREE.Mesh(
      flashGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffc080,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    flashes.push({ mesh, age: 0, life: 0, motion: true, s0: 2, s1: 10 });
  }
  return { chips, flashes, chipCursor: 0, flashCursor: 0 };
}

/** Visible death-flash size at typical chase-cam range, keyed to hull size. */
export function deathBurstScale(live, reducedMotion) {
  const proxy = (live && live.object && live.object.userData && live.object.userData.proxy)
    || (live && live.state && scaleFor(live.state.classKey).proxy)
    || null;
  const hullR = proxy
    ? Math.max(proxy.halfLen || 0, proxy.rx || 0, proxy.ry || 0, 2)
    : npcRadius(live);
  if (reducedMotion) {
    const flash = Math.max(14, hullR * 3.4);
    return { hullR, flash0: flash, flash1: flash, chipSize: 0 };
  }
  return {
    hullR,
    flash0: Math.max(7, hullR * 1.8),
    flash1: Math.max(18, hullR * 4.8),
    chipSize: Math.max(0.5, hullR * 0.14),
  };
}

function emitDeathBurst(pool, live, reducedMotion) {
  if (!live || !live.object) return;
  const origin = live.object.position;
  const sc = deathBurstScale(live, reducedMotion);

  const f = pool.flashes[pool.flashCursor];
  pool.flashCursor = (pool.flashCursor + 1) % pool.flashes.length;
  f.mesh.position.copy(origin);
  f.mesh.scale.setScalar(sc.flash0);
  f.mesh.material.opacity = 0.95;
  f.mesh.visible = true;
  f.age = 0;
  f.life = reducedMotion ? 0.45 : 0.32;
  f.motion = !reducedMotion;
  f.s0 = sc.flash0;
  f.s1 = sc.flash1;

  if (reducedMotion) return;

  const chipSize = sc.chipSize;
  const px = origin.x;
  const py = origin.y;
  const pz = origin.z;
  for (let i = 0; i < DEATH_CHIP_COUNT; i++) {
    const c = pool.chips[pool.chipCursor];
    pool.chipCursor = (pool.chipCursor + 1) % pool.chips.length;
    const h1 = hash01(px * 12.9898 + py * 78.233 + pz * 37.719 + i * 17.13);
    const h2 = hash01(px * 4.1414 + py * 19.19 + pz * 9.17 + i * 23.7);
    const h3 = hash01(px * 9.2 + py * 3.7 + pz * 11.3 + i * 5.9);
    const theta = h1 * Math.PI * 2;
    const phi = Math.acos(h2 * 2 - 1);
    const sinPhi = Math.sin(phi);
    _v3.set(sinPhi * Math.cos(theta), Math.cos(phi), sinPhi * Math.sin(theta));
    c.vel.copy(_v3).multiplyScalar(12 + sc.hullR * 1.6 + h3 * 24);
    c.mesh.position.copy(origin).addScaledVector(_v3, sc.hullR * (0.2 + h1 * 0.55));
    c.mesh.rotation.set(h1 * 6.2832, h2 * 6.2832, h3 * 6.2832);
    c.mesh.scale.setScalar(chipSize * (0.7 + h2 * 0.6));
    c.mesh.material.color.setRGB(1, 0.55 + h2 * 0.25, 0.3 + h3 * 0.2);
    c.mesh.material.opacity = 1;
    c.mesh.visible = true;
    c.age = 0;
    c.life = CHIP_LIFE_MIN + h3 * (CHIP_LIFE_MAX - CHIP_LIFE_MIN);
    c.spinX = (h1 - 0.5) * 8;
    c.spinY = (h2 - 0.5) * 8;
    c.spinZ = (h3 - 0.5) * 6;
  }
}

function tickDeathBurst(pool, dt, reducedMotion) {
  const chips = pool.chips;
  for (let i = 0; i < chips.length; i++) {
    const c = chips[i];
    if (c.life <= 0) continue;
    if (reducedMotion) {
      c.life = 0;
      c.mesh.visible = false;
      continue;
    }
    c.age += dt;
    if (c.age >= c.life) {
      c.life = 0;
      c.mesh.visible = false;
      continue;
    }
    c.mesh.position.addScaledVector(c.vel, dt);
    c.mesh.rotation.x += c.spinX * dt;
    c.mesh.rotation.y += c.spinY * dt;
    c.mesh.rotation.z += c.spinZ * dt;
    c.vel.multiplyScalar(Math.max(0, 1 - 1.4 * dt));
    c.mesh.material.opacity = 1 - c.age / c.life;
  }
  const flashes = pool.flashes;
  for (let i = 0; i < flashes.length; i++) {
    const f = flashes[i];
    if (f.life <= 0) continue;
    f.age += dt;
    if (f.age >= f.life) {
      f.life = 0;
      f.mesh.visible = false;
      continue;
    }
    const k = f.age / f.life;
    if (!reducedMotion && f.motion) {
      const s0 = f.s0 ?? 2;
      const s1 = f.s1 ?? 10;
      f.mesh.scale.setScalar(s0 + k * (s1 - s0));
    }
    f.mesh.material.opacity = 0.95 * (1 - k);
  }
}

function handleDestroyed(ctx, live, burst, reducedMotion) {
  // combat.js normally emits npcDestroyed on the killing blow (it runs after
  // us); emit only if nobody else has, so the event fires exactly once.
  let seen = false;
  for (const e of ctx.events) {
    if (e.type === 'npcDestroyed' && e.ship === live) {
      seen = true;
      break;
    }
  }
  if (!seen) {
    for (const e of ctx.lastEvents) {
      if (e.type === 'npcDestroyed' && e.ship === live) {
        seen = true;
        break;
      }
    }
  }
  if (!seen) ctx.emit('npcDestroyed', { ship: live });

  // §7.7 fear consequences of the kill.
  if (live.state.surrendered) bumpFear(ctx, ECON.fear.killedSurrendered);
  else if (live.role === 'ace') bumpFear(ctx, ECON.fear.aceDefeated);

  // Remaining manifest becomes scoopable pods. Salvage already emptied
  // the hold, so this is a no-op after a dump (no double loot). Empty
  // cargo still yields no fake pods. Crew leave as one survivor pod
  // unless capitulate already dumped them (ai.survivorsSpawned).
  spillShipCargo(ctx, live);
  spawnShipSurvivor(ctx, live);

  // Brief burst; world.js stages the lasting aftermath, we don't.
  emitDeathBurst(burst, live, reducedMotion);

  removeLiveShip(ctx, live);
}

// ---------- system ----------
export function initNpc(ctx) {
  const burst = makeDeathBurstPool(ctx.scene);

  return {
    update(dt) {
      const now = ctx.world.time;
      const reducedMotion = ctx.settings.reducedMotion;
      const playerObj = ctx.ship.object;
      _phyOn = !ctx.gate.jumping;
      if (_phyOn) {
        collectBodies(ctx, _bodies);
        appendSunBody(ctx);
      } else {
        _bodies.count = 0;
      }
      let combat = false;
      hideMinerBeams();
      for (let i = ctx.ships.length - 1; i >= 0; i--) {
        const live = ctx.ships[i];
        const st = live.state;
        if (st.destroyed) {
          // traffic.js splices destroyed ships from the list on its own
          // schedule, so guard against processing the same wreck twice.
          if (!live.ai.deathHandled) {
            live.ai.deathHandled = true;
            handleDestroyed(ctx, live, burst, reducedMotion === true);
          }
          continue;
        }
        tickShipState(st, now, dt);
        const ai = live.ai;
        animateShipMesh(live.object, ctx.elapsed, reducedMotion, ctx.camera);
        // Wave 30 demand-hail upkeep: the parley dies with the hail target
        // (disabled here; destroyed/despawned discard the ai outright, and
        // hail.js's own timeout closes the card on those same conditions),
        // and opening fire on the demanding pirate voids the offer — any hit
        // stamped after the demand opened ends the hold and closes the card.
        if (ai.demanding) {
          if (st.disabled) {
            ai.demanding = false;
          } else if (st.lastHitAt > ai.demandPeaceAt) {
            ai.demanding = false;
            ctx.emit('hailClosed', { ship: live }); // card closes; the fight is on — ship-scoped (wave 35)
          }
        }
        if (st.disabled) {
          ai.resolveBoost = 0; // stand-down: a disabled hull drops the bluff sting (updateResolve never runs here)
          updateDisabled(live, dt, now, reducedMotion);
          if (_phyOn) bounceLive(live, dt);
          continue;
        }
        ai.t += dt;
        if (now >= ai.resolveAt) {
          ai.resolveAt = now + RESOLVE_INTERVAL;
          updateResolve(ctx, live, now);
        }
        if (ai.role === 'trader') tickTraderJob(ctx, live);
        else if (ai.role === 'miner') tickMinerJob(ctx, live);
        else if (ai.role === 'patrol') tickPatrolJob(ctx, live);
        switch (ai.mode) {
          case 'hunt':
            updateHunt(ctx, live, dt, now, reducedMotion);
            break;
          case 'duel':
            updateDuel(ctx, live, dt, now, reducedMotion);
            break;
          case 'flee':
            updateFlee(ctx, live, dt);
            break;
          case 'drift':
            updateDrift(live, dt, reducedMotion);
            break;
          case 'route':
            updateRoute(ctx, live, dt, now, reducedMotion);
            break;
          case 'mine':
            updateMine(ctx, live, dt, now, reducedMotion);
            break;
          default:
            updateLoiter(live, dt);
        }
        if (_phyOn) bounceLive(live, dt);
        if (ai.intent && playerObj && live.object.position.distanceTo(playerObj.position) < U.ENCOUNTER_BUBBLE) {
          combat = true;
        }
      }
      ctx.flags.combat = combat;

      // Backstop: traffic.js runs before us each frame and may splice a wreck
      // out of ctx.ships before our loop sees it. Catch combat.js's
      // npcDestroyed event so the flash/fear bookkeeping still happens once.
      for (const e of ctx.lastEvents) {
        if (e.type === 'npcDestroyed' && e.ship && e.ship.ai && !e.ship.ai.deathHandled) {
          e.ship.ai.deathHandled = true;
          handleDestroyed(ctx, e.ship, burst, reducedMotion === true); // emit is skipped: event already seen
        }
      }

      // Demand-hail release (wave 30, cross-system via ctx.lastEvents):
      // hail.js resolves demand intents and stamps live.ai.demandOutcome —
      // 'failed'/'refused' clear ai.demanding themselves and press the
      // attack; 'paid'/'bluffed' are already fleeing. On 'hailClosed',
      // release any OUTCOME-STAMPED hold still standing (outcome-gated so a
      // stale hailClosed never steals a demand that opened this frame).
      // Wave 35: the event is ship-scoped — a close names its own ship, and
      // only that ship's hold releases (an unscoped payload is a legacy
      // backstop that releases all). On a 'hailOpened' for ANOTHER ship the
      // single hail card was stolen — release the hold so the pirate stops
      // waiting on a dead parley.
      for (const e of ctx.lastEvents) {
        if (e.type === 'hailClosed') {
          for (const s of ctx.ships) {
            if (s.ai && s.ai.demanding && s.ai.demandOutcome && (!e.ship || s === e.ship)) s.ai.demanding = false;
          }
        } else if (e.type === 'hailOpened') {
          for (const s of ctx.ships) {
            if (s.ai && s.ai.demanding && s !== e.ship) s.ai.demanding = false;
          }
        }
      }

      // Target availability: drop a stale selected live ship (asteroid refs
      // have no .record/.state and are left alone).
      const cur = ctx.targets.current;
      if (cur && cur.record && cur.state && (cur.state.destroyed || !ctx.ships.includes(cur))) {
        ctx.targets.current = null;
      }

      tickDeathBurst(burst, dt, reducedMotion === true);
    },
  };
}
