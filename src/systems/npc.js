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
} from '../game/state.js';
import { buildShipAsset, isShipAssetReady, releaseShipAsset, updateShipAsset } from './ship-assets.js';
import { epicEffects } from '../game/epics.js';
import { spawnPod } from '../game/pods.js';

/**
 * NPC system — live GLB ship assets and AI (doc §6.7, §7).
 *
 * Exports the cross-worker API traffic.js imports:
 *   spawnLiveShip(ctx, record, position) → { id, record, object, state, role, ai }
 *   removeLiveShip(ctx, liveShip)
 *
 * record fields read: { id?, classKey, role ('trader'|'patrol'|'pirate'|'ace'),
 *   name?, faction?, cargo?, resolve?, personality?, bounty?, route?: Vector3[],
 *   anchor?: Vector3 }
 *
 * AI modes: route (trader), loiter (patrol), hunt (pirate), duel (ace),
 * plus surrender modes flee/drift. Hostiles telegraph ≥3 s before the first
 * shot (§6.1): direct approach + flashing engine glow + a commLine. Fire is
 * emitted as 'npcFire' { ship, weapon:'cannon' } — combat.js spawns the
 * actual projectile.
 *
 * Resolve (§7.2–7.5) is recomputed ~1 Hz for hostiles-with-intent and for any
 * ship recently in combat. Bands drive behavior: defiant presses, shaken
 * weaves with visible power waver, bargaining opens one combat hail,
 * capitulate picks a §7.5 outcome (cut engines / jettison / flee / crew pods).
 *
 * update() performs zero allocations: all scratch vectors/quaternions are
 * module-scope; allocations happen only on spawn, hail, capitulation, or
 * destruction (event-time, not per-frame).
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
const _fwd = new THREE.Vector3();
const _toT = new THREE.Vector3();
const _q = new THREE.Quaternion();

const TELEGRAPH_SECONDS = 3; // §6.1 minimum hostile-intent warning
const NPC_FIRE_INTERVAL = 1 / (WEAPONS.cannon.rof * 0.5); // ~0.5× player rof
const ACE_FURY_INTERVAL = NPC_FIRE_INTERVAL * 0.65;
const LAW_ZONE_RADIUS = 300; // station law zone: no hostile intent develops
const RESOLVE_INTERVAL = 1; // s between resolve recomputes
const THREAT_MEMORY = 12; // s a ship stays wary after last combat
const FIRE_FACE_DOT = 0.92; // must roughly face target to fire
const FLASH_LIFE = 0.6; // s debris flash on destruction
const DEMAND_COOLDOWN = 300; // s before the same pirate record may demand the player again (record.demandedAt)
const WAKE_SITE_DISTANCE = 1400; // = U.DEINSTANTIATE_RANGE (state.js; traffic.js despawns there) — the wake site sits beyond the fold

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
  const mode = role === 'pirate' ? 'hunt' : role === 'ace' ? 'duel' : role === 'trader' ? 'route' : 'loiter';
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
    band: 'defiant',
    resolveAt: 0,
    fireAt: 0,
    wp: 0,
    waypoints: null,
    calmUntil: 0,
    disabledInit: false,
    driftVel: new THREE.Vector3(),
    weaveSeed: Math.random() * Math.PI * 2,
  };
  if (mode === 'route' && Array.isArray(record.route) && record.route.length > 0) {
    ai.waypoints = record.route;
  } else if (mode === 'route') {
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

function facingDot(object, targetPos) {
  _fwd.copy(NEG_Z).applyQuaternion(object.quaternion);
  _toT.subVectors(targetPos, object.position).normalize();
  return _fwd.dot(_toT);
}

function playerNear(ctx, live, range) {
  const o = ctx.ship.object;
  return !!o && live.object.position.distanceTo(o.position) < range;
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
  const st = live.state;
  const pos = live.object.position;
  for (const entry of st.cargo) {
    _v1.set(pos.x + (Math.random() - 0.5) * 8, pos.y + (Math.random() - 0.5) * 8, pos.z + (Math.random() - 0.5) * 8);
    spawnPod(ctx, [{ commodity: entry.commodity, units: entry.units }], _v1);
  }
  st.cargo.length = 0;
  if (crewPods) {
    for (let k = 0; k < 2; k++) {
      _v1.set(pos.x + (Math.random() - 0.5) * 6, pos.y + (Math.random() - 0.5) * 6, pos.z + (Math.random() - 0.5) * 6);
      spawnPod(ctx, [], _v1); // flavor: crew escape pods
    }
  }
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
  const cls = SHIP_CLASSES[live.state.classKey];
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
    _v2.subVectors(wp, live.object.position).normalize();
    _v3.crossVectors(_v2, UP).normalize();
    _aim.addScaledVector(_v3, Math.sin(now * 2.1 + ai.weaveSeed) * 40);
    speed = cap * (0.85 + 0.15 * Math.sin(now * 5 + ai.weaveSeed));
    glow.scale.setScalar(reducedMotion ? 1 : 1 + 0.45 * Math.sin(now * 8 + ai.weaveSeed));
  } else {
    glow.scale.setScalar(1);
  }
  const dist = steer(live.object, _aim, speed, cls.turn, dt);
  if (dist < 25) ai.wp = (ai.wp + 1) % ai.waypoints.length;
}

function updateLoiter(live, dt) {
  const ai = live.ai;
  const cls = SHIP_CLASSES[live.state.classKey];
  const dist = steer(live.object, ai.waypoints[ai.wp], speedCap(live) * 0.5, cls.turn, dt);
  if (dist < 25) ai.wp = (ai.wp + 1) % ai.waypoints.length;
}

function breakOff(ai) {
  ai.target = null;
  ai.phase = null;
  ai.intent = false;
}

function setTarget(ai, target) {
  ai.target = target;
  ai.phase = null;
  ai.intent = false;
}

function engageTarget(ctx, live, dt, now, targetPos, reducedMotion) {
  const ai = live.ai;
  const st = live.state;
  const cls = SHIP_CLASSES[st.classKey];
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
    _v2.subVectors(targetPos, live.object.position).normalize();
    _v3.crossVectors(_v2, UP).normalize();
    _aim.addScaledVector(_v3, Math.sin(now * 2.2 + ai.weaveSeed) * 70).addScaledVector(UP, Math.cos(now * 1.7 + ai.weaveSeed) * 35);
    speed = cap * (0.8 + 0.2 * Math.sin(now * 5 + ai.weaveSeed));
    glow.scale.setScalar(reducedMotion ? 1 : 1 + 0.5 * Math.sin(now * 9 + ai.weaveSeed));
  } else {
    // defiant: aggressive press into weapon-exchange range
    speed = dist > 220 ? cap : cap * 0.6;
    if (ai.phase !== 'telegraph') glow.scale.setScalar(1.3);
  }
  steer(live.object, _aim, speed, cls.turn, dt);

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
    ctx.emit('npcFire', { ship: live, weapon: 'cannon' });
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

  // Retaliation (wave 32): apathy is not a death sentence. Damage overrides
  // the interest roll for the rest of the instantiation — being shot is the
  // loudest notice there is, and a pirate's only damage source IS the player
  // (patrols loiter, NPC fire hits only its target). Law-zone pacifism still
  // holds: no intent develops inside the zone, so a zone-side pirate only
  // routs. setTarget re-arms the telegraph — the §6.1 warning still precedes
  // any fire. Fleeing/disabled/demanding ships never reach this: flee and
  // disabled are other modes, and a demanding pirate already targets you.
  if (
    ai.target !== 'player' &&
    (st.hull < st.hullMax || st.screen < st.screenMax) &&
    ctx.ship.object &&
    !ctx.flags.docked &&
    ctx.ship.object.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
    live.object.position.distanceTo(station) >= LAW_ZONE_RADIUS
  ) {
    ai.playerRolled = true; // the scratch IS the roll — no dice after notice
    ai.playerInterested = true;
    setTarget(ai, 'player');
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
  if (!ai.target) {
    const pObj = ctx.ship.object;
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
        if (other === live || other.role !== 'trader') continue;
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
    steer(live.object, playerPos, speedCap(live), cls.turn, dt);
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
    steer(live.object, _aim, speed, cls.turn, dt);
    return; // no fire while bargaining (capitulation handled globally)
  }

  if (ai.acePhase === 1) {
    // Helix around the player.
    const a = now * 0.9 + ai.weaveSeed;
    _aim.set(
      playerPos.x + Math.cos(a) * 130,
      playerPos.y + Math.sin(now * 2.3 + ai.weaveSeed) * 40,
      playerPos.z + Math.sin(a) * 130,
    );
  } else if (ai.acePhase === 2) {
    // Feint: rush in, then break away on a ~6 s cycle.
    const cycle = (now + ai.weaveSeed) % 6;
    if (cycle < 3) {
      _aim.copy(playerPos);
      speed = burning ? cls.burn : cap;
    } else {
      _v2.subVectors(live.object.position, playerPos).normalize();
      _aim.copy(live.object.position).addScaledVector(_v2, 200);
      speed = cap;
    }
  } else {
    // Fury: direct press.
    _aim.copy(playerPos);
    speed = burning ? cls.burn : cap;
  }
  steer(live.object, _aim, speed, cls.turn, dt);

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

function updateFlee(ctx, live, dt) {
  const ai = live.ai;
  const st = live.state;
  const cls = SHIP_CLASSES[st.classKey];
  const pObj = ctx.ship.object;
  if (pObj) {
    _v2.subVectors(live.object.position, pObj.position).normalize();
    _aim.copy(live.object.position).addScaledVector(_v2, 300);
  } else {
    _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
    _aim.copy(live.object.position).addScaledVector(_fwd, 300);
  }
  steer(live.object, _aim, st.engineOut ? cls.cruise * 0.3 : cls.burn, cls.turn, dt);
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

function handleDestroyed(ctx, live, flashes) {
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

  // Brief debris flash; world.js stages the lasting aftermath, we don't.
  flashGeo ??= new THREE.SphereGeometry(1, 10, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffc080,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(flashGeo, mat);
  mesh.position.copy(live.object.position);
  ctx.scene.add(mesh);
  flashes.push({ mesh, age: 0 });

  removeLiveShip(ctx, live);
}

// ---------- system ----------
export function initNpc(ctx) {
  const flashes = [];

  return {
    update(dt) {
      const now = ctx.world.time;
      const reducedMotion = ctx.settings.reducedMotion;
      const playerObj = ctx.ship.object;
      let combat = false;
      for (let i = ctx.ships.length - 1; i >= 0; i--) {
        const live = ctx.ships[i];
        const st = live.state;
        if (st.destroyed) {
          // traffic.js splices destroyed ships from the list on its own
          // schedule, so guard against processing the same wreck twice.
          if (!live.ai.deathHandled) {
            live.ai.deathHandled = true;
            handleDestroyed(ctx, live, flashes);
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
          continue;
        }
        ai.t += dt;
        if (now >= ai.resolveAt) {
          ai.resolveAt = now + RESOLVE_INTERVAL;
          updateResolve(ctx, live, now);
        }
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
          default:
            updateLoiter(live, dt);
        }
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
          handleDestroyed(ctx, e.ship, flashes); // emit is skipped: event already seen
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

      // Debris flashes.
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.age += dt;
        const k = f.age / FLASH_LIFE;
        if (k >= 1) {
          ctx.scene.remove(f.mesh);
          f.mesh.material.dispose();
          flashes.splice(i, 1);
          continue;
        }
        f.mesh.scale.setScalar(1 + k * 26);
        f.mesh.material.opacity = 0.9 * (1 - k);
      }
    },
  };
}
