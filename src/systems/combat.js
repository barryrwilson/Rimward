import * as THREE from 'three';
import { WEAPONS, HEAT, DEFENSE, U, applyHit, tickShipState, MINING_LASERS, miningLaserFor, ORE_TYPES } from '../game/state.js';
import { reticleAimPoint } from '../game/reticle-aim.js';
import { scaleFor } from '../game/ship-scale.js';
import { isUnknowable } from '../game/faction-style.js';
import { PHY } from '../game/physics.js';
import { sunZone } from '../game/collision.js';
import { spendMissileAmmo } from '../game/hangar.js';
import { isLauncherId, isTurretId, LAUNCHER_IDS, TURRET_IDS } from '../game/weapon-fit.js';
import {
  HULL_MARK_POOL,
  HULL_MARK_SIZE,
  HULL_MARK_LIFT,
  isFiniteVec3,
  worldHitToLocal,
  liftLocalOffset,
  nextMarkSlot,
} from '../game/hull-marks.js';

/**
 * Combat system — player weapons + ALL projectile simulation (player & NPC).
 * Doc §6: projectile-based, dodgeable, readable family identity, no hitscan
 * (the mining beam is an industrial tool, not a weapon).
 *
 * Player aim follows the HUD reticle ray (camera through the glass point),
 * not ship local −Z. Chase and third-person place the reticle off the nose;
 * first-person recenters it so the two coincide.
 *
 * Generosity flows toward the player (§6.1): player projectiles get
 * DEFENSE.playerHitPadding (1.25×) hit volumes vs NPCs; NPC projectiles use
 * the player's true visual bounds (PLAYER_HIT_RADIUS, no padding).
 *
 * Consumes same-frame ctx.events 'npcFire' { ship, weapon, target } from npc.js
 * (NPCs never spawn projectiles themselves). target is 'player' (or missing,
 * legacy) or a live ship. Player-aimed bolts use testPlayerHit only;
 * ship-aimed bolts use testNpcHits and never testPlayerHit. Emits mineHit { asteroidId,
 * point } for asteroids.js (read next frame via ctx.lastEvents). Emits
 * playerFire { weapon } only when a player cannon/disruptor/missile/turret
 * shot actually leaves a pool (not dry-fire, heat-lock, mining, or a dropped shot).
 * Translates applyHit() descriptors into the frozen ctx event vocabulary.
 *
 * Zero per-frame allocation: projectiles/flashes/sparks are pooled, all
 * scratch vectors are module-scope, the mining beam mutates its buffer in
 * place. Wave-6 polish: every pooled projectile carries an additive glow
 * sprite (attached at init, family-tinted, visible iff the bolt is live —
 * it rides as a child of the bolt mesh), and every ship impact spawns a
 * small spark burst from a pooled set of THREE.Points (per-burst material
 * created at init, positions/velocities preallocated). Sparks animate, so
 * they are suppressed under ctx.settings.reducedMotion.
 *
 * Wave-51 mining pass (§6.3 + ORE_TYPES/MINING_LASERS in state.js):
 * - HEAD LADDER: the beam resolves the INSTALLED cutting head via
 *   miningLaserFor(ctx.world.miningLaser) EVERY call (save restores swap
 *   world fields wholesale, so the entry is never cached). Range, heat,
 *   beam colour/width all come from that entry; a mid-flight purchase
 *   retints/reshapes the live beam the next frame.
 * - HARDNESS GATE: a rock whose ORE_TYPES hardness exceeds the head's tier
 *   scatters the beam and yields nothing. The world tells first (§13.1):
 *   'mineBlocked' { asteroidId, oreKey, hardness, needs, line } fires at
 *   most once per second per asteroid id (a pair of scalars — mining
 *   touches one rock at a time — reset on 'systemLoaded'), while amber
 *   sparks kick BACK along the beam and no dust comes off the rock.
 * - BEAM LOOK (wave 55): a thin additive quad strip (4 verts, rebuilt
 *   in place around the camera-facing right vector) with a 1D edge-fade
 *   map so the lance is not a hard rectangle. Half-widths stay in the
 *   pencil band (Mk I ~0.08 muzzle / ~0.11 contact). A bright 2-vertex
 *   core line rides the centre. Contact glow is the shared makeGlowDot
 *   radial sprite — never an untextured square — tinted ore sparkColor
 *   while cutting or BLOCKED_TINT while scattered. Pooled Points rings
 *   throw chips and dust. Pools keep integrating after the beam turns
 *   off so bursts finish naturally; under reducedMotion nothing emits,
 *   live particles still expire, and pulse opacities pin to midpoints.
 *
 * Wave 53 PHY: same-frame bodyHit (ship.js) applies impact damage through
 * applyHit family 'impact' (not a WEAPONS key — 1:1 shields then hull),
 * throttled to one scrape / 0.2 s. sunZone heat ticks DPS while undocked
 * and not jumping; the lethal core emits sunKill once and reuses the
 * existing playerDestroyed / save.js death path. sunHeat is toast-throttled
 * to 2.5 s. Zero new per-frame allocations (module-scope _sunOut).
 *
 * Wave 54 FX-01: pooled muzzle flashes (family-tinted, ~0.1 s, nose spawn,
 * cannon/disruptor only — mining stays the industrial tool), stretched
 * bolt glow/streak (PROJ_RADIUS / segment-vs-capsule unchanged), shield
 * ripple when screen or shell > 0 at impact, stronger hull sparks on
 * unshielded ship hits. reducedMotion: no new spark emission; muzzle and
 * ripple snap one static frame then hide. Emits playerFire { weapon }
 * only when a player bolt actually leaves the pool.
 *
 * Wave 59 FX-DECALS: a fixed pool of dark scorch sprites parents to the
 * scored hull (shields already down). Recycle oldest. Park on
 * npcDestroyed / player death / despawn so teardown cannot dispose them.
 */

// ---- module-scope scratch (reused every frame) ----
const _fwd = new THREE.Vector3();
const _nose = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _lead = new THREE.Vector3();
const _oc = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _targetFwd = new THREE.Vector3();
// NPC ships use capsule proxies (radius + half-length along local Z). A 900 u/s
// bolt steps ~15 u per 60 fps frame — larger than a proxy sphere — so hits
// are tested segment-vs-capsule (previous position → new position), never point tests.
const _prev = new THREE.Vector3();
const _seg = new THREE.Vector3();
const _f = new THREE.Vector3();
const _closest = new THREE.Vector3();
// Capsule-proxy scratch: axis, segment midpoint, closest point on axis,
// projection scalar, plus ship-local right (_right) and up (_up) vectors
// for projecting the offset onto the ellipse cross-section axes.
// NPC hulls are flat by charter (SHIP_PROPORTION caps spanY/spanZ at 0.60;
// sculpts run 0.19-0.47). A circular cross-section sized to reach the flanks
// must stand equally far above the deck — the veridian cutter's circular
// hitbox was 2.3× the hull's height and scored hits on bolts passing visibly
// over it. The proxy cross-section is therefore an ELLIPSE: rx (half-beam,
// local X) and ry (half-height, local Y) are sized independently so the
// hitbox stays close to the actual hull silhouette.
// These alias with sweptHit scratch — capsule resolution runs first, then
// sweptHit clobbers _seg/_f/_closest. Zero per-frame allocation.
const _axis = new THREE.Vector3();
const _right = new THREE.Vector3();   // ship local X in world space
const _up = new THREE.Vector3();      // ship local Y in world space
const _mid = new THREE.Vector3();
const _cap = new THREE.Vector3();
let _proj = 0;
// mineHit point payloads rotate through this ring: emitted events are read
// NEXT frame via ctx.lastEvents, so a single scratch vector would be mutated
// under the consumer. A ring of 3 outlasts the one-frame rotation.
const _minePoints = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
let _minePointIdx = 0;
// Wave 51 mining scratch: beam endpoint, camera forward, the camera-facing
// ribbon right vector, the -beamDir launch axis for chips/scatter, a dust
// drift direction, per-particle velocity assembly, and a hex→rgb staging
// colour for the particle color buffers. Zero per-frame allocation.
const _beamEnd = new THREE.Vector3();
const _camFwd = new THREE.Vector3();
const _beamRight = new THREE.Vector3();
const _away = new THREE.Vector3();
const _dustDir = new THREE.Vector3();
const _pvel = new THREE.Vector3();
const _pcol = new THREE.Color();
// mineBlocked throttle: mining touches one rock at a time, so a pair of
// scalars (not a Map) caps the refusal at one emit/second per asteroid id.
// Reset on 'systemLoaded' — a fresh field reuses ids.
let _lastBlockedId = -1;
let _lastBlockedAt = -1e9;
// Wave 53 PHY: sunZone writes here (no per-frame object). Impact and heat
// toasts are throttled so scrapes / lingering heat do not flood the HUD.
const _sunOut = { zone: 0, t: 0, dist: 0 };
const IMPACT_GAP = 0.2;
const SUN_HEAT_TOAST_GAP = 2.5;
let _lastImpactAt = -1e9;
let _lastSunHeatAt = -1e9;
let _sunKillEmitted = false;
// Hull-mark stamp scratch. Combat writes sprite.position from these.
const _markPose = { px: 0, py: 0, pz: 0, qx: 0, qy: 0, qz: 0, qw: 1, sx: 1, sy: 1, sz: 1 };
const _markLocal = { x: 0, y: 0, z: 0 };
// Seeker scratch — module-scope, no per-frame alloc on the missile path.
const _seekFwd = new THREE.Vector3();
const _seekWant = new THREE.Vector3();

const POOL_SIZE = 64;
const MISSILE_POOL = 8; // separate cap; do not share the 64-bolt pool
const TURRET_LIVE_CAP = 2; // turret bolts share the 64-pool; leave room for cannon
const FLASH_POOL = 16;
const MUZZLE_POOL = 16;
const RIPPLE_POOL = 16;
const PROJ_RADIUS = 0.4;
const PLAYER_HIT_RADIUS = 2.4; // true visual bounds of the living hull (§6.1)
const NOSE_OFFSET = 3.0; // projectile spawns just past the nose
const AIM_ERROR = Math.tan((2 * Math.PI) / 180); // ±2° NPC aim error
const CONVERGE_DOT = 0.72; // ~44° frontal cone — chase targets sit wider than 32°

const GROUP_WEAPON = { 1: 'cannon', 2: 'disruptor', 3: 'mining' };
// GROUP_WEAPON[4] maps to the seated launcher wkey ('missile' for dart).
// Empty group 4: no missile shot (HUD later shows 4 · —). Do not fall through to cannon via ?? 'cannon'.
// §6.3 family identity: cannon = cyan bolt, disruptor = violet, mining = salvage green, missile = amber.
const FAMILY_COLORS = { energy: 0x53f2ff, disruptor: 0xc86bff, mining: 0x51ff9e, missile: 0xff8a2a };

// Impact sparks (wave-54: stronger than wave-6 6 / 0.35 s / 16 u/s).
const SPARKS_PER_BURST = 11;
const SPARK_TTL = 0.48; // s
const SPARK_SPEED = 24; // u/s outward drift
const SPARK_SIZE = 0.85;
const MUZZLE_TTL = 0.1; // s — short pop, 0.08–0.12 band
const RIPPLE_TTL = 0.2; // s — brief expanding shield ring
const GLOW_SCALE_ENERGY = 7.2;
const GLOW_SCALE_DISRUPTOR = 9.0;
const GLOW_SCALE_MISSILE = 8.6;
const STREAK_LEN = 8.4;
const _boltAxis = new THREE.Vector3(0, 0, -1);

/**
 * Turn vel toward lockPos, cap |Δθ| at turn*dt. lockPos null → ballistic (vel unchanged).
 * Mutates vel in place. Reuses module scratch; no alloc.
 */
export function steerSeekerVel(vel, pos, lockPos, speed, turn, dt) {
  if (!lockPos) return;
  _seekWant.subVectors(lockPos, pos);
  const w2 = _seekWant.lengthSq();
  if (w2 < 1e-8) return;
  _seekWant.multiplyScalar(1 / Math.sqrt(w2));
  const v2 = vel.lengthSq();
  if (v2 < 1e-8) {
    vel.copy(_seekWant).multiplyScalar(speed);
    return;
  }
  _seekFwd.copy(vel).multiplyScalar(1 / Math.sqrt(v2));
  const maxTurn = turn * dt;
  const dot = Math.max(-1, Math.min(1, _seekFwd.dot(_seekWant)));
  const ang = Math.acos(dot);
  if (ang <= maxTurn || ang < 1e-8) {
    vel.copy(_seekWant).multiplyScalar(speed);
    return;
  }
  const k = maxTurn / ang;
  _seekFwd.lerp(_seekWant, k);
  const n2 = _seekFwd.lengthSq();
  if (n2 < 1e-8) return;
  _seekFwd.multiplyScalar(1 / Math.sqrt(n2));
  vel.copy(_seekFwd).multiplyScalar(speed);
}

function groupWeapon(ctx) {
  const g = ctx.input.weaponGroup;
  if (g === 4) {
    const id = ctx.world.launcher;
    if (!isLauncherId(id)) return null;
    return LAUNCHER_IDS[id].wkey;
  }
  return GROUP_WEAPON[g] ?? 'cannon';
}

// Mining particles (wave 51): two THREE.Points rings — ore-tinted chips and
// slower rock-powder dust — plus the held-contact emission cadence.
const MINE_SPARKS = 48;
const MINE_DUST = 32;
const MINE_SPARK_INTERVAL = 0.07; // s between chip bursts on a held contact
const MINE_DUST_INTERVAL = 0.16;  // s between dust puffs
const MINE_SPARK_TTL = 0.45;      // chip lifetime
const MINE_DUST_TTL = 1.2;        // rock-powder lifetime
const BLOCKED_TINT = 0xff9a3a;    // hostile amber: too-hard rock scatters the beam
// Wave 55 lance: beamWidth is a unitless head scale (Mk I 0.22 … Mk IV 0.34).
// Half-widths = beamWidth × these factors. Contact stays under ~0.18 even on Mk IV.
const LANCE_W0 = 0.36;
const LANCE_W1 = 0.52;
const LANCE_GLOW = 3.4;
const LANCE_GLOW_PULSE = 0.65;

/** Fill live._proxyRx/_proxyRy/_proxyHalf from mesh proxy or class fallback. */
function ensureShipProxy(s) {
  if (s._proxyRx !== undefined) return;
  const scale = s.object.scale?.x || 1;
  const proxy = s.object.userData.proxy ?? scaleFor(s.state.classKey).proxy;
  s._proxyRx = proxy.rx * scale;
  s._proxyRy = proxy.ry * scale;
  s._proxyHalf = proxy.halfLen * scale;
}

/**
 * First t along a unit ray that enters the ship's cached elliptical capsule.
 * Returns -1 when the ray misses or the hit sits past maxT.
 */
function rayProxyT(origin, dir, s, maxT) {
  ensureShipProxy(s);
  const rx = s._proxyRx;
  const ry = s._proxyRy;
  const halfLen = s._proxyHalf;
  _axis.set(0, 0, 1).applyQuaternion(s.object.quaternion);
  _right.set(1, 0, 0).applyQuaternion(s.object.quaternion);
  _up.set(0, 1, 0).applyQuaternion(s.object.quaternion);

  _oc.subVectors(origin, s.object.position);
  const da = dir.dot(_axis);
  const ocDir = _oc.dot(dir);
  const ocA = _oc.dot(_axis);
  const den = 1 - da * da;
  let tClosest;
  let u;
  if (den < 1e-8) {
    tClosest = 0;
    u = ocA;
  } else {
    tClosest = (da * ocA - ocDir) / den;
    u = ocA - da * ocDir;
    u /= den;
  }
  if (u < -halfLen) u = -halfLen;
  else if (u > halfLen) u = halfLen;
  _cap.copy(s.object.position).addScaledVector(_axis, u);

  let tSamp = tClosest;
  if (tSamp < 0) tSamp = 0;
  else if (tSamp > maxT) tSamp = maxT;
  _tmp.copy(origin).addScaledVector(dir, tSamp).sub(_cap);
  const dx = _tmp.dot(_right);
  const dy = _tmp.dot(_up);
  const d2 = dx * dx + dy * dy;
  let rEff;
  if (d2 < 1e-8) {
    rEff = rx < ry ? rx : ry;
  } else {
    const invD = 1 / Math.sqrt(d2);
    const cx = dx * invD;
    const cy = dy * invD;
    rEff = 1 / Math.sqrt((cx / rx) * (cx / rx) + (cy / ry) * (cy / ry));
  }

  _oc.subVectors(origin, _cap);
  const b = _oc.dot(dir);
  const c = _oc.lengthSq() - rEff * rEff;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const sq = Math.sqrt(disc);
  let th = -b - sq;
  if (th < 0) th = -b + sq;
  if (th < 0 || th > maxT) return -1;
  return th;
}

/** Soft radial dot sprite shared by projectile glows and spark points. */
function makeGlowDot() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 1D fade across the ribbon so the quad edges read as a soft lance. */
function makeBeamRibbon() {
  const w = 64;
  const h = 4;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  const grad = g.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.42, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(0.58, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** Soft dark scorch atlas. Material tint supplies the brown; alpha is the chip. */
function makeScorchDot() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const c = size / 2;
  const grad = g.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.32, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.14)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Additive ring sprite: hollow centre, bright band — shield ripple only. */
function makeRippleRing() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const c = size / 2;
  const grad = g.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.52, 'rgba(255,255,255,0)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.86, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initCombat(ctx) {
  const { scene } = ctx;

  // --- Projectile pool: shared geometry, two shared family materials ---
  const projGeo = new THREE.SphereGeometry(PROJ_RADIUS, 8, 6);
  const projMats = {
    energy: new THREE.MeshBasicMaterial({
      color: FAMILY_COLORS.energy,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
    disruptor: new THREE.MeshBasicMaterial({
      color: FAMILY_COLORS.disruptor,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
    missile: new THREE.MeshBasicMaterial({
      color: FAMILY_COLORS.missile,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  };
  // Additive glow sprites: two shared family materials, one sprite child per
  // pooled bolt (built at init; visible iff the bolt is live via the parent).
  const glowTex = makeGlowDot();
  const glowMats = {
    energy: new THREE.SpriteMaterial({
      map: glowTex,
      color: FAMILY_COLORS.energy,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    }),
    disruptor: new THREE.SpriteMaterial({
      map: glowTex,
      color: FAMILY_COLORS.disruptor,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    }),
    missile: new THREE.SpriteMaterial({
      map: glowTex,
      color: FAMILY_COLORS.missile,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    }),
  };
  // Visual-only streak: hit tests still use PROJ_RADIUS on mesh.position.
  const streakGeo = new THREE.CylinderGeometry(0.05, 0.2, STREAK_LEN, 6, 1, true);
  streakGeo.rotateX(-Math.PI / 2); // cylinder +Y → local −Z (bolt forward)
  const streakMats = {
    energy: new THREE.MeshBasicMaterial({
      color: FAMILY_COLORS.energy,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    disruptor: new THREE.MeshBasicMaterial({
      color: FAMILY_COLORS.disruptor,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    missile: new THREE.MeshBasicMaterial({
      color: FAMILY_COLORS.missile,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  };
  const pool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const mesh = new THREE.Mesh(projGeo, projMats.energy);
    mesh.visible = false;
    const glow = new THREE.Sprite(glowMats.energy);
    glow.scale.set(GLOW_SCALE_ENERGY, GLOW_SCALE_ENERGY, 1);
    mesh.add(glow); // child: hides/shows with the bolt, zero extra bookkeeping
    const streak = new THREE.Mesh(streakGeo, streakMats.energy);
    streak.position.set(0, 0, STREAK_LEN * 0.32); // trail sits behind the core
    mesh.add(streak);
    scene.add(mesh);
    pool.push({
      mesh,
      glow,
      streak,
      active: false,
      vel: new THREE.Vector3(),
      shooterPos: new THREE.Vector3(), // for aft/fore facet at hit time
      shooter: null, // live ship that fired; testNpcHits skips this ref
      vsPlayer: false, // NPC bolt aimed at the player (legacy / hunt)
      fromPlayer: true,
      wkey: 'cannon', // WEAPONS key (applyHit family lookup)
      family: 'energy', // §6.3 identity string (events/flash color)
      damage: 0,
      speed: 0,
      range: 0,
      traveled: 0,
    });
  }

  // Separate missile pool (cap 8). Sharing the 64-bolt pool would starve cannon.
  const missilePool = [];
  for (let i = 0; i < MISSILE_POOL; i++) {
    const mesh = new THREE.Mesh(projGeo, projMats.missile);
    mesh.visible = false;
    const glow = new THREE.Sprite(glowMats.missile);
    glow.scale.set(GLOW_SCALE_MISSILE, GLOW_SCALE_MISSILE, 1);
    mesh.add(glow);
    const streak = new THREE.Mesh(streakGeo, streakMats.missile);
    streak.position.set(0, 0, STREAK_LEN * 0.32);
    mesh.add(streak);
    scene.add(mesh);
    missilePool.push({
      mesh,
      glow,
      streak,
      active: false,
      vel: new THREE.Vector3(),
      shooterPos: new THREE.Vector3(),
      shooter: null,
      vsPlayer: false,
      fromPlayer: true,
      wkey: 'missile',
      family: 'missile',
      damage: 0,
      speed: 0,
      range: 0,
      traveled: 0,
      lock: null,
    });
  }

  // --- Impact flash pool: per-sprite materials (opacity animated per sprite) ---
  const flashes = [];
  for (let i = 0; i < FLASH_POOL; i++) {
    const mat = new THREE.SpriteMaterial({
      color: FAMILY_COLORS.energy,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    scene.add(sprite);
    flashes.push({ sprite, t: 0, ttl: 0.18 });
  }

  // --- Muzzle flash pool (wave 54): short family-tinted pop at the nose.
  const muzzleTex = glowTex;
  const muzzles = [];
  for (let i = 0; i < MUZZLE_POOL; i++) {
    const mat = new THREE.SpriteMaterial({
      map: muzzleTex,
      color: FAMILY_COLORS.energy,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    scene.add(sprite);
    muzzles.push({ sprite, t: 0, ttl: MUZZLE_TTL, snap: false, seen: false, base: 2.4, grow: 3.2 });
  }

  // --- Shield ripple pool (wave 54): expanding ring, shielded hits only.
  const rippleTex = makeRippleRing();
  const ripples = [];
  for (let i = 0; i < RIPPLE_POOL; i++) {
    const mat = new THREE.SpriteMaterial({
      map: rippleTex,
      color: FAMILY_COLORS.energy,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    scene.add(sprite);
    ripples.push({ sprite, t: 0, ttl: RIPPLE_TTL, snap: false, seen: false });
  }

  // --- Impact spark pool (wave-6): one burst per flash, each a THREE.Points
  // with preallocated position/velocity buffers and a per-burst material
  // (opacity animated per burst). Built once; reused ring-style.
  const sparks = [];
  for (let i = 0; i < FLASH_POOL; i++) {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(SPARKS_PER_BURST * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({
      color: FAMILY_COLORS.energy,
      size: SPARK_SIZE,
      map: glowTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    pts.visible = false;
    pts.frustumCulled = false; // burst can sit anywhere; skip stale culling
    scene.add(pts);
    sparks.push({ pts, arr, vel: new Float32Array(SPARKS_PER_BURST * 3), t: 0, active: false });
  }

  // --- Hull-mark pool (wave 59): tiny dark sprites, parented to the hit
  // hull so they ride with it. Shared texture + material; slots recycle.
  // Hidden pool root holds idle slots so teardown of a live ship cannot
  // dispose them. userData.shared on root / texture / material.
  const hullMarkTex = makeScorchDot();
  hullMarkTex.userData.shared = true;
  const hullMarkMat = new THREE.SpriteMaterial({
    map: hullMarkTex,
    color: 0x1a120e,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  hullMarkMat.userData.shared = true;
  const hullMarkRoot = new THREE.Group();
  hullMarkRoot.name = 'hull-mark-pool';
  hullMarkRoot.visible = false;
  hullMarkRoot.userData.shared = true;
  scene.add(hullMarkRoot);
  const hullMarks = [];
  for (let i = 0; i < HULL_MARK_POOL; i++) {
    const sprite = new THREE.Sprite(hullMarkMat);
    sprite.visible = false;
    sprite.frustumCulled = false;
    sprite.scale.set(HULL_MARK_SIZE, HULL_MARK_SIZE, 1);
    hullMarkRoot.add(sprite);
    hullMarks.push({ sprite, live: false, stampAt: -1, host: null });
  }

  // --- Wave 51 mining beam: layered, tapered, pulsing (module header) ---
  // Inner core: the crisp 2-vertex centre line, buffer mutated in place.
  const beamCoreGeo = new THREE.BufferGeometry();
  const beamArr = new Float32Array(6);
  beamCoreGeo.setAttribute('position', new THREE.BufferAttribute(beamArr, 3));
  const beamCore = new THREE.Line(
    beamCoreGeo,
    new THREE.LineBasicMaterial({
      color: MINING_LASERS[0].coreColor,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    }),
  );
  beamCore.name = 'mine-beam-core';
  beamCore.visible = false;
  beamCore.frustumCulled = false; // endpoints move every frame; skip stale culling
  scene.add(beamCore);

  // Outer beam: a thin tapered quad strip (4 verts / 2 indexed tris,
  // DoubleSide additive + 1D edge-fade map). Rebuilt in place each frame
  // around the camera-facing right vector — a focusing cone, not a slab.
  const ribbonTex = makeBeamRibbon();
  const beamQuadGeo = new THREE.BufferGeometry();
  const beamQuadArr = new Float32Array(12);
  beamQuadGeo.setAttribute('position', new THREE.BufferAttribute(beamQuadArr, 3));
  beamQuadGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
    0, 0, 1, 0, 0, 1, 1, 1,
  ]), 2));
  beamQuadGeo.setIndex([0, 2, 1, 1, 2, 3]);
  const beamMesh = new THREE.Mesh(
    beamQuadGeo,
    new THREE.MeshBasicMaterial({
      map: ribbonTex,
      color: MINING_LASERS[0].beamColor,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }),
  );
  beamMesh.name = 'mine-beam';
  beamMesh.visible = false;
  beamMesh.frustumCulled = false;
  scene.add(beamMesh);

  // Contact glow: shared radial makeGlowDot map so the flare is a circle
  // from any camera angle. Tint per contact (ore sparkColor / BLOCKED_TINT);
  // scale is a tight flare, not a billboard that swallows the rock.
  const beamGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: MINING_LASERS[0].beamColor,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    }),
  );
  beamGlow.name = 'mine-glow';
  beamGlow.scale.set(0.8, 0.8, 1);
  beamGlow.visible = false;
  scene.add(beamGlow);

  // Mining particle pools: single THREE.Points rings with position + color
  // attributes (per-particle fade multiplies toward black — under additive
  // blending black is gone). All buffers preallocated; a ring cursor hands
  // out slots. `drag` is the per-second velocity decay; `live` gates the
  // tick and the visible flag.
  function makeMinePoints(count, size, drag) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size,
        map: glowTex,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    pts.visible = false;
    pts.frustumCulled = false; // particles can sit anywhere; skip stale culling
    scene.add(pts);
    return {
      pts,
      pos,
      col,
      vel: new Float32Array(count * 3),
      base: new Float32Array(count * 3), // pre-fade particle colour
      life: new Float32Array(count),
      ttl: new Float32Array(count),
      live: 0,
      cursor: 0,
      drag,
    };
  }
  const mineSparks = makeMinePoints(MINE_SPARKS, 0.9, 2.8); // fast chips
  mineSparks.pts.name = 'mine-sparks';
  const mineDust = makeMinePoints(MINE_DUST, 2.4, 0.6); // big slow powder
  mineDust.pts.name = 'mine-dust';
  // Emission clocks ride the contact; primed to the interval so the first
  // contact frame bursts immediately. Reset by hideMiningFx().
  let mineSparkClock = MINE_SPARK_INTERVAL;
  let mineDustClock = MINE_DUST_INTERVAL;

  /** Ring-emit `count` particles from `point` along `dir` (jittered cone). */
  function emitMineParticles(pool, point, dir, count, colorHex, speed, spread, ttl) {
    _pcol.setHex(colorHex);
    const n = pool.ttl.length;
    for (let k = 0; k < count; k++) {
      const i = pool.cursor;
      pool.cursor = (pool.cursor + 1) % n;
      if (pool.life[i] <= 0) pool.live++;
      const i3 = i * 3;
      pool.pos[i3] = point.x;
      pool.pos[i3 + 1] = point.y;
      pool.pos[i3 + 2] = point.z;
      _pvel.copy(dir).multiplyScalar(speed * (0.7 + 0.6 * Math.random()));
      _pvel.x += (Math.random() * 2 - 1) * spread;
      _pvel.y += (Math.random() * 2 - 1) * spread;
      _pvel.z += (Math.random() * 2 - 1) * spread;
      pool.vel[i3] = _pvel.x;
      pool.vel[i3 + 1] = _pvel.y;
      pool.vel[i3 + 2] = _pvel.z;
      pool.base[i3] = _pcol.r;
      pool.base[i3 + 1] = _pcol.g;
      pool.base[i3 + 2] = _pcol.b;
      pool.col[i3] = _pcol.r;
      pool.col[i3 + 1] = _pcol.g;
      pool.col[i3 + 2] = _pcol.b;
      pool.life[i] = ttl;
      pool.ttl[i] = ttl;
    }
    pool.pts.visible = true;
    pool.pts.geometry.attributes.position.needsUpdate = true;
    pool.pts.geometry.attributes.color.needsUpdate = true;
  }

  /** Integrate + fade a ring. Under `hide` (reducedMotion) particles stay
   * hidden and frozen but still expire — bursts never strand mid-air. */
  function tickMinePool(pool, dt, hide) {
    if (pool.live <= 0) {
      pool.pts.visible = false;
      return;
    }
    let live = 0;
    for (let i = 0; i < pool.life.length; i++) {
      if (pool.life[i] <= 0) continue;
      pool.life[i] -= dt;
      const i3 = i * 3;
      if (pool.life[i] <= 0) {
        pool.col[i3] = pool.col[i3 + 1] = pool.col[i3 + 2] = 0; // additive black = gone
        continue;
      }
      live++;
      if (hide) continue; // no particle motion under reducedMotion
      const dragK = Math.max(0, 1 - pool.drag * dt);
      pool.pos[i3] += pool.vel[i3] * dt;
      pool.pos[i3 + 1] += pool.vel[i3 + 1] * dt;
      pool.pos[i3 + 2] += pool.vel[i3 + 2] * dt;
      pool.vel[i3] *= dragK;
      pool.vel[i3 + 1] *= dragK;
      pool.vel[i3 + 2] *= dragK;
      const f = pool.life[i] / pool.ttl[i];
      pool.col[i3] = pool.base[i3] * f;
      pool.col[i3 + 1] = pool.base[i3 + 1] * f;
      pool.col[i3 + 2] = pool.base[i3 + 2] * f;
    }
    pool.live = live;
    pool.pts.visible = !hide && live > 0;
    pool.pts.geometry.attributes.position.needsUpdate = true;
    pool.pts.geometry.attributes.color.needsUpdate = true;
  }

  /** Tight radial flare at the cut. Mutates the pooled sprite only. */
  function paintContactGlow(hex, reduced, width) {
    beamGlow.position.copy(_beamEnd);
    const gs = (reduced ? LANCE_GLOW : LANCE_GLOW + LANCE_GLOW_PULSE * Math.sin(ctx.elapsed * 18)) * width;
    beamGlow.scale.set(gs, gs, 1);
    beamGlow.material.color.setHex(hex);
    beamGlow.visible = true;
  }

  /** Beam off: hide every beam-layer visual and re-prime the emission
   * clocks. Particle pools are NOT touched — live bursts finish naturally. */
  function hideMiningFx() {
    beamMesh.visible = false;
    beamCore.visible = false;
    beamGlow.visible = false;
    mineSparkClock = MINE_SPARK_INTERVAL;
    mineDustClock = MINE_DUST_INTERVAL;
  }

  // Per-weapon fire cooldowns (rof), in world time.
  const nextFireAt = { cannon: 0, disruptor: 0, missile: 0, turret: 0 };

  // ---------- helpers ----------

  function addHeat(amount) {
    const p = ctx.player;
    if (!p) return;
    p.heat += amount;
    if (p.heat >= HEAT.max) {
      p.heat = HEAT.max;
      p.overheated = true; // lockout until HEAT.overheatUnlockAt (§6.3); tickShipState cools/clears
    }
  }

  function spawnProjectile(fromPlayer, wkey, w, origin, dir, shooterPos) {
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (p.active) continue;
      p.active = true;
      p.fromPlayer = fromPlayer;
      p.shooter = null;
      p.vsPlayer = false;
      p.wkey = wkey;
      p.family = w.family;
      p.damage = w.damage;
      p.speed = w.speed;
      p.range = w.range;
      p.traveled = 0;
      p.vel.copy(dir).multiplyScalar(w.speed);
      p.shooterPos.copy(shooterPos);
      p.mesh.material = projMats[w.family] ?? projMats.energy;
      p.glow.material = glowMats[w.family] ?? glowMats.energy;
      p.streak.material = streakMats[w.family] ?? streakMats.energy;
      const gs = w.family === 'disruptor' ? GLOW_SCALE_DISRUPTOR
        : w.family === 'missile' ? GLOW_SCALE_MISSILE
        : GLOW_SCALE_ENERGY;
      p.glow.scale.set(gs, gs, 1);
      p.streak.scale.set(w.family === 'disruptor' ? 1.2 : 1, w.family === 'disruptor' ? 1.2 : 1, w.family === 'disruptor' ? 0.78 : 1);
      p.mesh.position.copy(origin);
      orientBolt(p);
      p.mesh.visible = true;
      return p;
    }
    return null; // pool exhausted: shot dropped, no allocation
  }

  function deactivate(p) {
    p.active = false;
    p.mesh.visible = false;
    if (p.lock !== undefined) p.lock = null;
  }

  /** Align the visual streak to velocity. Hit tests ignore mesh rotation. */
  function orientBolt(p) {
    const len2 = p.vel.lengthSq();
    if (len2 < 1e-8) return;
    _tmp.copy(p.vel).multiplyScalar(1 / Math.sqrt(len2));
    p.mesh.quaternion.setFromUnitVectors(_boltAxis.set(0, 0, -1), _tmp);
  }

  /** Spark burst at a hit point: random outward velocities, no allocation. */
  function spawnSparks(pos, family) {
    if (ctx.settings?.reducedMotion) return; // animated burst — hidden under reduced motion
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      if (s.active) continue;
      s.active = true;
      s.t = 0;
      s.pts.material.color.set(FAMILY_COLORS[family] ?? FAMILY_COLORS.energy);
      s.pts.material.opacity = 1;
      for (let j = 0; j < SPARKS_PER_BURST; j++) {
        const j3 = j * 3;
        s.arr[j3] = pos.x;
        s.arr[j3 + 1] = pos.y;
        s.arr[j3 + 2] = pos.z;
        // Random direction on the sphere, written straight into the buffer.
        const a = Math.random() * Math.PI * 2;
        const b = Math.acos(2 * Math.random() - 1);
        const sp = SPARK_SPEED * (0.5 + Math.random());
        const sb = Math.sin(b);
        s.vel[j3] = sb * Math.cos(a) * sp;
        s.vel[j3 + 1] = Math.cos(b) * sp;
        s.vel[j3 + 2] = sb * Math.sin(a) * sp;
      }
      s.pts.geometry.attributes.position.needsUpdate = true;
      s.pts.visible = true;
      return;
    }
  }

  function spawnFlash(pos, family) {
    for (let i = 0; i < flashes.length; i++) {
      const f = flashes[i];
      if (f.sprite.visible) continue;
      f.t = 0;
      f.sprite.material.color.set(FAMILY_COLORS[family] ?? FAMILY_COLORS.energy);
      f.sprite.material.opacity = 1; // reset — the fade mutates this per-sprite material
      f.sprite.scale.set(1.5, 1.5, 1);
      f.sprite.position.copy(pos);
      f.sprite.visible = true;
      return;
    }
  }

  /** Muzzle pop at the existing nose point. Mining never calls this.
   * First-person camera sits on the nose (FIRST_PERSON_NOSE z=−2.8); a
   * full-size sprite there fills the glass, so the pop sits a short step
   * along the shot and stays small. */
  function spawnMuzzle(pos, family) {
    const reduced = ctx.settings?.reducedMotion === true;
    const fp = ctx.flags.firstPerson === true;
    for (let i = 0; i < muzzles.length; i++) {
      const f = muzzles[i];
      if (f.sprite.visible) continue;
      f.t = 0;
      f.ttl = MUZZLE_TTL;
      f.snap = reduced;
      f.seen = false;
      f.base = fp ? 1.15 : 2.4;
      f.grow = fp ? 1.5 : 3.2;
      f.sprite.material.color.set(FAMILY_COLORS[family] ?? FAMILY_COLORS.energy);
      f.sprite.material.opacity = reduced ? 0.85 : 1;
      const s = reduced ? f.base + f.grow * 0.35 : f.base;
      f.sprite.scale.set(s, s, 1);
      f.sprite.position.copy(pos);
      if (fp) f.sprite.position.addScaledVector(_dir, 2.4);
      f.sprite.visible = true;
      return;
    }
  }

  /** Expanding shield ring. Skip when both layers are already 0. */
  function spawnRipple(pos, family) {
    const reduced = ctx.settings?.reducedMotion === true;
    for (let i = 0; i < ripples.length; i++) {
      const f = ripples[i];
      if (f.sprite.visible) continue;
      f.t = 0;
      f.ttl = RIPPLE_TTL;
      f.snap = reduced;
      f.seen = false;
      f.sprite.material.color.set(FAMILY_COLORS[family] ?? FAMILY_COLORS.energy);
      f.sprite.material.opacity = reduced ? 0.75 : 1;
      const s = reduced ? 5.5 : 2.2;
      f.sprite.scale.set(s, s, 1);
      f.sprite.position.copy(pos);
      f.sprite.visible = true;
      return;
    }
  }

  /** Ship impact: ripple if shielded, hull sparks + lasting mark otherwise. */
  function spawnHitFx(pos, family, shielded, host) {
    spawnFlash(pos, family);
    if (shielded) spawnRipple(pos, family);
    else {
      spawnSparks(pos, family);
      stampHullMark(pos, host);
    }
  }

  function parkHullMark(slot) {
    slot.live = false;
    slot.host = null;
    slot.sprite.visible = false;
    if (slot.sprite.parent !== hullMarkRoot) hullMarkRoot.add(slot.sprite);
  }

  function parkMarksOnHost(host) {
    if (!host) return;
    for (let i = 0; i < hullMarks.length; i++) {
      if (hullMarks[i].host === host) parkHullMark(hullMarks[i]);
    }
  }

  function parkAllHullMarks() {
    for (let i = 0; i < hullMarks.length; i++) parkHullMark(hullMarks[i]);
  }

  function stampHullMark(worldPos, host) {
    if (!host || !worldPos) return;
    const wx = worldPos.x, wy = worldPos.y, wz = worldPos.z;
    if (!isFiniteVec3(wx, wy, wz)) return;
    const p = host.position;
    const q = host.quaternion;
    const s = host.scale;
    if (!p || !q || !s) return;
    _markPose.px = p.x; _markPose.py = p.y; _markPose.pz = p.z;
    _markPose.qx = q.x; _markPose.qy = q.y; _markPose.qz = q.z; _markPose.qw = q.w;
    _markPose.sx = s.x; _markPose.sy = s.y; _markPose.sz = s.z;
    if (!worldHitToLocal(wx, wy, wz, _markPose, _markLocal)) return;
    liftLocalOffset(_markLocal, HULL_MARK_LIFT);
    if (!isFiniteVec3(_markLocal.x, _markLocal.y, _markLocal.z)) return;
    const idx = nextMarkSlot(hullMarks);
    if (idx < 0) return;
    const slot = hullMarks[idx];
    if (slot.live) parkHullMark(slot);
    slot.sprite.position.set(_markLocal.x, _markLocal.y, _markLocal.z);
    host.add(slot.sprite);
    slot.sprite.visible = true;
    slot.live = true;
    slot.host = host;
    slot.stampAt = ctx.world.time;
  }

  function reclaimFromEvents(evs) {
    if (!evs) return;
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      if (e.type === 'npcDestroyed' && e.ship?.object) parkMarksOnHost(e.ship.object);
      else if (e.type === 'playerDestroyed') parkMarksOnHost(ctx.ship?.object);
      else if (e.type === 'systemLoaded') parkAllHullMarks();
    }
  }

  function reclaimHullMarks() {
    for (let i = 0; i < hullMarks.length; i++) {
      const slot = hullMarks[i];
      if (!slot.live) continue;
      if (!slot.host || slot.host.parent == null) parkHullMark(slot);
    }
    reclaimFromEvents(ctx.lastEvents);
    reclaimFromEvents(ctx.events);
    if (ctx.player?.destroyed) parkMarksOnHost(ctx.ship?.object);
  }

  /** Nose + reticle ray (same as guns). Writes _fwd/_nose/_dir. Does not snap spawn onto a lock. */
  function playerMuzzleDir(w, playerObj) {
    _fwd.set(0, 0, -1).applyQuaternion(playerObj.quaternion); // nose = local -Z
    _nose.copy(playerObj.position).addScaledVector(_fwd, NOSE_OFFSET);
    reticleAimPoint(ctx, w.range || U.WEAPON_EXCHANGE, _aim);
    _dir.subVectors(_aim, _nose);
    if (_dir.lengthSq() < 1e-6) _dir.copy(_fwd);
    else _dir.normalize();
    // Slight convergence toward the target's lead point (§6.2), frontal cone only.
    const t = ctx.targets.current;
    if (t?.object && t.state && !t.state.destroyed) {
      _tmp.subVectors(t.object.position, _nose);
      const dist = _tmp.length();
      if (dist > 1 && dist < U.TARGET_RANGE) {
        _tmp.divideScalar(dist);
        if (_tmp.dot(_fwd) > CONVERGE_DOT) {
          // Relative lead, same as the HUD pip. NPC ai.velocity is the
          // commanded heading×speed from steerLive.
          const tof = dist / w.speed;
          _lead.copy(t.object.position);
          const tv = t.ai?.velocity;
          if (tv) _lead.addScaledVector(tv, tof);
          const pv = ctx.ship?.velocity;
          if (pv) _lead.addScaledVector(pv, -tof);
          _dir.subVectors(_lead, _nose).normalize();
        }
      }
    }
  }

  function firePlayerGun(wkey, w, playerObj) {
    playerMuzzleDir(w, playerObj);
    const bolt = spawnProjectile(true, wkey, w, _nose, _dir, playerObj.position);
    if (bolt) {
      spawnMuzzle(_nose, w.family);
      ctx.emit('playerFire', { weapon: wkey });
    }
    addHeat(w.heatPerShot);
  }

  function spawnMissile(wkey, w, origin, dir, shooterPos) {
    for (let i = 0; i < missilePool.length; i++) {
      const p = missilePool[i];
      if (p.active) continue;
      p.active = true;
      p.fromPlayer = true;
      p.shooter = null;
      p.vsPlayer = false;
      p.lock = null;
      p.wkey = wkey;
      p.family = w.family;
      p.damage = w.damage;
      p.speed = w.speed;
      p.range = w.range;
      p.traveled = 0;
      p.vel.copy(dir).multiplyScalar(w.speed);
      p.shooterPos.copy(shooterPos);
      p.mesh.material = projMats[w.family] ?? projMats.missile;
      p.glow.material = glowMats[w.family] ?? glowMats.missile;
      p.streak.material = streakMats[w.family] ?? streakMats.missile;
      p.glow.scale.set(GLOW_SCALE_MISSILE, GLOW_SCALE_MISSILE, 1);
      p.mesh.position.copy(origin);
      orientBolt(p);
      p.mesh.visible = true;
      return p;
    }
    return null; // dry pool: no ammo, no heat
  }

  /** Live ship lock in launcher range. Asteroid / gate / no lock → null. */
  function liveMissileLock(playerObj, range) {
    const t = ctx.targets.current;
    if (!t?.object || !t.object.parent || !t.state || t.state.destroyed) return null;
    if (playerObj.position.distanceToSquared(t.object.position) > range * range) return null;
    return t;
  }

  // spend-on-spawn-only: ammo and heat only after a missile actually leaves the pool.
  function tryPlayerMissile(wkey, now, playerObj) {
    if (now < nextFireAt.missile) return;
    const w = WEAPONS[wkey];
    if (!w) return;
    if (!Number.isInteger(ctx.world.missileAmmo) || ctx.world.missileAmmo <= 0) return;
    const lock = liveMissileLock(playerObj, w.range);
    if (!lock) return;
    playerMuzzleDir(w, playerObj);
    const dart = spawnMissile(wkey, w, _nose, _dir, playerObj.position);
    if (!dart) return; // dry pool: no ammo, no heat
    const spent = spendMissileAmmo(ctx, 1);
    if (!spent) {
      deactivate(dart);
      return;
    }
    dart.lock = lock;
    addHeat(w.heatPerShot);
    ctx.emit('playerFire', { weapon: wkey });
    nextFireAt.missile = now + 1 / w.rof;
    spawnMuzzle(_nose, w.family);
  }

  function countLiveTurretBolts() {
    let n = 0;
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].active && pool[i].wkey === 'turret') n++;
    }
    return n;
  }

  /** Nearest hostile live ship in the forward cone. Does not track aft. */
  function pickTurretTarget(playerObj, range) {
    const range2 = range * range;
    _fwd.set(0, 0, -1).applyQuaternion(playerObj.quaternion);
    let best = null;
    let bestD2 = Infinity;
    for (let i = 0; i < ctx.ships.length; i++) {
      const s = ctx.ships[i];
      if (!s?.object || !s.state || s.state.destroyed) continue;
      if (!s.ai?.intent) continue;
      if (isUnknowable(s.state.faction)) continue;
      _tmp.subVectors(s.object.position, playerObj.position);
      const d2 = _tmp.lengthSq();
      if (d2 > range2 || d2 < 1) continue;
      _tmp.multiplyScalar(1 / Math.sqrt(d2));
      if (_tmp.dot(_fwd) < CONVERGE_DOT) continue;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = s;
      }
    }
    return best;
  }

  function tryPlayerTurret(now, playerObj) {
    if (now < nextFireAt.turret) return;
    if (!isTurretId(ctx.world.turret)) return;
    const wkey = TURRET_IDS[ctx.world.turret].wkey;
    const w = WEAPONS[wkey] || WEAPONS.turret;
    const tgt = pickTurretTarget(playerObj, w.range);
    if (!tgt) return;
    if (countLiveTurretBolts() >= TURRET_LIVE_CAP) return;
    _fwd.set(0, 0, -1).applyQuaternion(playerObj.quaternion);
    _nose.copy(playerObj.position).addScaledVector(_fwd, NOSE_OFFSET);
    _dir.subVectors(tgt.object.position, _nose);
    if (_dir.lengthSq() < 1e-6) return;
    _dir.normalize();
    const bolt = spawnProjectile(true, wkey, w, _nose, _dir, playerObj.position);
    if (!bolt) return; // dry pool: no heat
    spawnMuzzle(_nose, w.family);
    addHeat(w.heatPerShot);
    ctx.emit('playerFire', { weapon: wkey });
    nextFireAt.turret = now + 1 / w.rof;
  }

  function spawnNpcShot(ship, weapon, aimObj) {
    if (!aimObj?.position) return;
    const wkey = WEAPONS[weapon] ? weapon : 'cannon';
    const w = WEAPONS[wkey];
    _fwd.set(0, 0, -1).applyQuaternion(ship.object.quaternion);
    _nose.copy(ship.object.position).addScaledVector(_fwd, NOSE_OFFSET);
    _dir.subVectors(aimObj.position, _nose);
    const dist = _dir.length();
    if (dist < 1) return;
    _dir.divideScalar(dist);
    // Aim error ±2° (§assignment): random angular jitter, then renormalize.
    _dir.x += (Math.random() * 2 - 1) * AIM_ERROR;
    _dir.y += (Math.random() * 2 - 1) * AIM_ERROR;
    _dir.z += (Math.random() * 2 - 1) * AIM_ERROR;
    _dir.normalize();
    const bolt = spawnProjectile(false, wkey, w, _nose, _dir, ship.object.position);
    if (bolt) {
      bolt.shooter = ship;
      spawnMuzzle(_nose, w.family);
    }
    return bolt;
  }

  /** Ray-sphere vs asteroid list; returns true while the beam is on. */
  function updateMining(dt, playerObj) {
    // The INSTALLED cutting head, resolved every call: save restores swap
    // world fields wholesale, so caching this entry across frames goes stale.
    const laser = miningLaserFor(ctx.world.miningLaser);
    _fwd.set(0, 0, -1).applyQuaternion(playerObj.quaternion);
    _nose.copy(playerObj.position).addScaledVector(_fwd, NOSE_OFFSET * 0.8);
    reticleAimPoint(ctx, laser.range, _aim);
    _dir.subVectors(_aim, _nose);
    if (_dir.lengthSq() < 1e-6) _dir.copy(_fwd);
    else _dir.normalize();
    // Locked rock / Unknowable still pulls if it sits in the reticle cone.
    const t = ctx.targets.current;
    if (t && t.position && !t.object) {
      _tmp.subVectors(t.position, _nose);
      const d = _tmp.length();
      if (d > 1e-3 && _tmp.divideScalar(d).dot(_dir) > CONVERGE_DOT) _dir.copy(_tmp);
    } else if (t?.object && t.state && !t.state.destroyed && isUnknowable(t.state.faction)) {
      _tmp.subVectors(t.object.position, _nose);
      const d = _tmp.length();
      if (d > 1e-3 && _tmp.divideScalar(d).dot(_dir) > CONVERGE_DOT) _dir.copy(_tmp);
    }
    // Closest hit along the beam among rocks and Unknowable fields.
    const list = ctx.asteroids?.list;
    let bestT = laser.range;
    let bestEntry = null;
    let bestShip = null;
    if (list) {
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        _oc.subVectors(_nose, a.position);
        const b = _oc.dot(_dir);
        const c = _oc.lengthSq() - a.radius * a.radius;
        const disc = b * b - c;
        if (disc < 0) continue;
        const sq = Math.sqrt(disc);
        let th = -b - sq;
        if (th < 0) th = -b + sq; // origin inside the sphere
        if (th < 0 || th > bestT) continue;
        bestT = th;
        bestEntry = a;
        bestShip = null;
      }
    }
    for (let i = 0; i < ctx.ships.length; i++) {
      const s = ctx.ships[i];
      if (!s?.object || !s.state || s.state.destroyed) continue;
      if (!isUnknowable(s.state.faction)) continue;
      const th = rayProxyT(_nose, _dir, s, bestT);
      if (th < 0 || th > bestT) continue;
      bestT = th;
      bestShip = s;
      bestEntry = null;
    }
    _beamEnd.copy(_nose).addScaledVector(_dir, bestT); // contact point / reach cap

    // Per-frame head re-application: a mid-flight outfitter purchase (or a
    // save restore) retints/reshapes the live beam immediately. setHex on the
    // existing material colours — never a new THREE.Color per frame.
    beamMesh.material.color.setHex(laser.beamColor);
    beamCore.material.color.setHex(laser.coreColor);

    // Core line endpoints (the original 2-vertex buffer, mutated in place).
    beamArr[0] = _nose.x;
    beamArr[1] = _nose.y;
    beamArr[2] = _nose.z;
    beamArr[3] = _beamEnd.x;
    beamArr[4] = _beamEnd.y;
    beamArr[5] = _beamEnd.z;
    beamCoreGeo.attributes.position.needsUpdate = true;

    // Tapered ribbon: right = normalise(cross(beamDir, cameraForward)). The
    // degenerate beam-straight-at-camera case falls back to the camera's
    // world X so the strip never collapses to a sliver of NaNs.
    ctx.camera.getWorldDirection(_camFwd);
    _beamRight.crossVectors(_dir, _camFwd);
    if (_beamRight.lengthSq() < 1e-6) _beamRight.set(1, 0, 0).applyQuaternion(ctx.camera.quaternion);
    else _beamRight.normalize();
    const w0 = laser.beamWidth * LANCE_W0; // muzzle half-width
    const w1 = laser.beamWidth * LANCE_W1; // contact half-width (focusing cone)
    beamQuadArr[0] = _nose.x + _beamRight.x * w0;
    beamQuadArr[1] = _nose.y + _beamRight.y * w0;
    beamQuadArr[2] = _nose.z + _beamRight.z * w0;
    beamQuadArr[3] = _nose.x - _beamRight.x * w0;
    beamQuadArr[4] = _nose.y - _beamRight.y * w0;
    beamQuadArr[5] = _nose.z - _beamRight.z * w0;
    beamQuadArr[6] = _beamEnd.x + _beamRight.x * w1;
    beamQuadArr[7] = _beamEnd.y + _beamRight.y * w1;
    beamQuadArr[8] = _beamEnd.z + _beamRight.z * w1;
    beamQuadArr[9] = _beamEnd.x - _beamRight.x * w1;
    beamQuadArr[10] = _beamEnd.y - _beamRight.y * w1;
    beamQuadArr[11] = _beamEnd.z - _beamRight.z * w1;
    beamQuadGeo.attributes.position.needsUpdate = true;

    // Working-frequency breathing. The thin lance leans on the bright core
    // so it still reads at range. reducedMotion pins both to midpoints.
    const reduced = ctx.settings?.reducedMotion === true;
    if (reduced) {
      beamMesh.material.opacity = 0.68;
      beamCore.material.opacity = 0.95;
    } else {
      beamMesh.material.opacity = 0.62 + 0.16 * Math.sin(ctx.elapsed * 26);
      beamCore.material.opacity = 0.92 + 0.08 * Math.sin(ctx.elapsed * 31);
    }
    beamMesh.visible = true;
    beamCore.visible = true;

    if (bestShip) {
      const now = ctx.world.time;
      const dmg = laser.damage * dt * (WEAPONS.mining.rof || 4);
      _targetFwd.set(0, 0, -1).applyQuaternion(bestShip.object.quaternion);
      _tmp.subVectors(playerObj.position, bestShip.object.position);
      const facet = _targetFwd.dot(_tmp) < 0 ? 'aft' : 'fore';
      const events = applyHit(bestShip.state, { damage: dmg, family: 'mining', facet, now });
      if (bestShip.ai) bestShip.ai.lastAttacker = 'player';
      ctx.emit('npcHit', { ship: bestShip, damage: dmg });
      for (const ev of events) {
        if (ev.type === 'shieldDown') ctx.emit('shieldDown', { layer: ev.layer, ship: bestShip });
        else if (ev.type === 'engineOut') ctx.emit('engineOut', { ship: bestShip });
        else if (ev.type === 'disabled') ctx.emit('npcDisabled', { ship: bestShip });
        else if (ev.type === 'destroyed') ctx.emit('npcDestroyed', { ship: bestShip });
      }
      paintContactGlow(laser.coreColor, reduced, laser.beamWidth);
      addHeat(laser.heatPerShot * WEAPONS.mining.rof * dt);
    } else if (bestEntry) {
      const oreKey = bestEntry.oreKey ?? 'rawOre';
      const hardness = bestEntry.hardness ?? 1;
      const oreDef = ORE_TYPES[oreKey];
      const blocked = hardness > laser.tier; // wave-51 hardness gate
      paintContactGlow(blocked ? BLOCKED_TINT : oreDef.sparkColor, reduced, laser.beamWidth);
      addHeat(laser.heatPerShot * WEAPONS.mining.rof * dt); // tiny continuous heat while on rock

      if (blocked) {
        // The rock scatters the beam and yields nothing. The world tells
        // first (§13.1): one mineBlocked per second per asteroid id.
        const now = ctx.world.time;
        if (bestEntry.id !== _lastBlockedId || now - _lastBlockedAt >= 1) {
          _lastBlockedId = bestEntry.id;
          _lastBlockedAt = now;
          let needs = MINING_LASERS[MINING_LASERS.length - 1];
          for (let i = 0; i < MINING_LASERS.length; i++) {
            if (MINING_LASERS[i].tier >= hardness) { needs = MINING_LASERS[i]; break; }
          }
          ctx.emit('mineBlocked', { asteroidId: bestEntry.id, oreKey, hardness, needs, line: oreDef.blockedLine });
        }
        // Legible without a word of UI: amber chips kick BACK along the
        // beam, faster and shorter-lived — and NO dust (nothing comes off).
        if (!reduced) {
          mineSparkClock += dt;
          if (mineSparkClock >= MINE_SPARK_INTERVAL) {
            mineSparkClock -= MINE_SPARK_INTERVAL;
            _away.copy(_dir).negate();
            emitMineParticles(mineSparks, _beamEnd, _away, 4 + ((Math.random() * 3) | 0), BLOCKED_TINT, 30, 4, MINE_SPARK_TTL * 0.6);
          }
        }
        mineDustClock = MINE_DUST_INTERVAL;
      } else {
        // Productive contact: asteroids.js extracts at extractPerSec ÷
        // ORE_TYPES.extractResist (its side of the contract).
        const pt = _minePoints[_minePointIdx];
        _minePointIdx = (_minePointIdx + 1) % _minePoints.length;
        pt.copy(_beamEnd);
        ctx.emit('mineHit', { asteroidId: bestEntry.id, point: pt, laserTier: laser.tier, extractPerSec: laser.extractPerSec });
        if (!reduced) {
          mineSparkClock += dt;
          if (mineSparkClock >= MINE_SPARK_INTERVAL) {
            mineSparkClock -= MINE_SPARK_INTERVAL;
            // Chips thrown back off the surface, ore-tinted.
            _away.copy(_dir).negate();
            emitMineParticles(mineSparks, _beamEnd, _away, 5 + ((Math.random() * 3) | 0), oreDef.sparkColor, 14, 7, MINE_SPARK_TTL);
          }
          mineDustClock += dt;
          if (mineDustClock >= MINE_DUST_INTERVAL) {
            mineDustClock -= MINE_DUST_INTERVAL;
            // Rock powder drifting perpendicular to the beam, dust-tinted.
            _dustDir.copy(_beamRight).multiplyScalar(Math.random() < 0.5 ? -1 : 1);
            emitMineParticles(mineDust, _beamEnd, _dustDir, 2 + ((Math.random() * 2) | 0), oreDef.dustColor, 2.5, 1.6, MINE_DUST_TTL);
          }
        }
      }
    } else {
      beamGlow.visible = false;
      mineSparkClock = MINE_SPARK_INTERVAL; // primed: first contact frame bursts
      mineDustClock = MINE_DUST_INTERVAL;
    }
    return true;
  }

  /** Swept hit: closest point on this frame's travel segment to center ≤ radius? */
  function sweptHit(p, center, radius) {
    _seg.subVectors(p.mesh.position, _prev);
    const len2 = _seg.lengthSq();
    _f.subVectors(_prev, center);
    const t = len2 > 0 ? Math.max(0, Math.min(1, -_f.dot(_seg) / len2)) : 0;
    _closest.copy(_prev).addScaledVector(_seg, t);
    if (_closest.distanceToSquared(center) > radius * radius) return false;
    p.mesh.position.copy(_closest); // snap to true impact point
    return true;
  }

  function testNpcHits(p, now) {
    for (let i = 0; i < ctx.ships.length; i++) {
      const s = ctx.ships[i];
      if (!s?.object || !s.state || s.state.destroyed) continue;
      if (p.shooter && s === p.shooter) continue; // shooter does not hit itself
      // Projectile passes through an Unknowable field. Do not consume the bolt.
      if (isUnknowable(s.state.faction)) continue;

      // Cache per live ship: elliptical proxy (rx, ry, halfLen) × object scale.
      // rx = half-beam (local X), ry = half-height (local Y). Both scale uniformly.
      //
      // Source: s.object.userData.proxy, set by buildShipMesh from deriveProxy().
      // This is read from the MESH rather than from scaleFor(state.classKey).proxy,
      // which fixes a genuine bug: a disguised Q-ship is built with its COVER class
      // and COVER faction (see spawnLiveShip), so the mesh's actual geometry — and
      // the proxy derived from it — belong to the cover hull, not to state.classKey.
      // scaleFor(state.classKey) would have used the hidden cutter proxy while the
      // ship was visually a freighter; reading userData gets this right automatically.
      //
      // Proxy cache is invalidated by revealQship (npc.js) on every mesh swap: it
      // resets _proxyRx to undefined so this branch re-reads on the next hit test.
      //
      // Fallback to SHIP_SCALE[classKey].proxy when userData.proxy is absent or
      // null: degenerate hulls return null from deriveProxy; hull-less meshes
      // omit the field. Unknowable fields never reach this cache (skipped above).
      ensureShipProxy(s);
      const rx = s._proxyRx;
      const ry = s._proxyRy;
      const halfLen = s._proxyHalf;

      // Resolve elliptical capsule to closest axis point, then derive an
      // effective isotropic radius in the offset's local-XY direction for sweptHit.
      // Ship's local Z is the capsule axis (stern-ward, symmetric).
      //
      // Per-frame axis cache: NPC movement completes before this loop, so all three
      // applyQuaternion calls yield identical results for every projectile against the
      // same ship in the same frame. Cache the 9 axis-component floats on the live
      // ship object keyed by now (= ctx.world.time, fixed for the whole update call).
      // No per-frame allocation: components are plain numbers written onto an existing
      // object; the module-scope scratch vectors _axis/_right/_up are reused as before.
      // The cache cannot go stale within a frame because now is monotonically increasing
      // across frames and is never mutated during the projectile loop.
      if (s._axisFt !== now) {
        _axis.set(0, 0, 1).applyQuaternion(s.object.quaternion);
        _right.set(1, 0, 0).applyQuaternion(s.object.quaternion);
        _up.set(0, 1, 0).applyQuaternion(s.object.quaternion);
        s._axisAx = _axis.x; s._axisAy = _axis.y; s._axisAz = _axis.z;
        s._axisRx = _right.x; s._axisRy = _right.y; s._axisRz = _right.z;
        s._axisUx = _up.x;   s._axisUy = _up.y;   s._axisUz = _up.z;
        s._axisFt = now;
      } else {
        _axis.set(s._axisAx, s._axisAy, s._axisAz);
        _right.set(s._axisRx, s._axisRy, s._axisRz);
        _up.set(s._axisUx, s._axisUy, s._axisUz);
      }
      _mid.addVectors(_prev, p.mesh.position).multiplyScalar(0.5); // projectile segment midpoint
      _tmp.subVectors(_mid, s.object.position); // midpoint → ship centre
      _proj = _tmp.dot(_axis); // scalar projection onto axis
      _proj = Math.max(-halfLen, Math.min(halfLen, _proj)); // clamp to capsule segment
      _cap.copy(s.object.position).addScaledVector(_axis, _proj); // closest point on axis
      _tmp.subVectors(_mid, _cap); // offset from closest axis point to projectile midpoint
      const dx = _tmp.dot(_right); // local-X component of offset
      const dy = _tmp.dot(_up);   // local-Y component of offset

      // Effective ellipse radius along the offset direction in the local XY plane.
      // Exact for an ellipse: rEff = 1 / sqrt((cx/rx)^2 + (cy/ry)^2) where (cx,cy)
      // is the normalised direction. Guard the degenerate case (offset on the axis,
      // dx≈dy≈0) by falling back to the minor semi-axis.
      const d2 = dx * dx + dy * dy;
      let rEff;
      if (d2 < 1e-8) {
        rEff = Math.min(rx, ry); // on-axis: use minor radius
      } else {
        const invD = 1 / Math.sqrt(d2);
        const cx = dx * invD, cy = dy * invD;   // normalised local-XY direction
        rEff = 1 / Math.sqrt((cx / rx) * (cx / rx) + (cy / ry) * (cy / ry));
      }

      const rr = rEff * DEFENSE.playerHitPadding + PROJ_RADIUS; // padded vs NPCs (§6.1)
      if (!sweptHit(p, _cap, rr)) continue;

      // Facet: attacker aft when the shooter sits behind the target's forward.
      _targetFwd.set(0, 0, -1).applyQuaternion(s.object.quaternion);
      _tmp.subVectors(p.shooterPos, s.object.position);
      const facet = _targetFwd.dot(_tmp) < 0 ? 'aft' : 'fore';

      const shielded = s.state.screen > 0 || s.state.shell > 0;
      const events = applyHit(s.state, { damage: p.damage, family: p.wkey, facet, now });
      if (s.ai) s.ai.lastAttacker = p.fromPlayer ? 'player' : (p.shooter || 'npc');
      ctx.emit('npcHit', { ship: s, damage: p.damage });
      for (const ev of events) {
        if (ev.type === 'shieldDown') ctx.emit('shieldDown', { layer: ev.layer, ship: s });
        else if (ev.type === 'engineOut') ctx.emit('engineOut', { ship: s });
        else if (ev.type === 'disabled') ctx.emit('npcDisabled', { ship: s });
        else if (ev.type === 'destroyed') ctx.emit('npcDestroyed', { ship: s });
      }
      spawnHitFx(p.mesh.position, p.family, shielded, s.object);
      if (s.state.destroyed) parkMarksOnHost(s.object);
      return true;
    }
    return false;
  }

  /** Translate applyHit descriptors into the frozen player event vocabulary. */
  function emitPlayerApplyHits(events) {
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (ev.type === 'shieldDown') ctx.emit('shieldDown', { layer: ev.layer, player: true });
      else if (ev.type === 'engineOut') ctx.emit('engineOut', { player: true });
      else if (ev.type === 'destroyed') ctx.emit('playerDestroyed', {}); // save.js owns the reload flow
    }
  }

  function testPlayerHit(p, now, player, playerObj) {
    if (!player || player.destroyed || !playerObj) return false;
    const rr = PLAYER_HIT_RADIUS + PROJ_RADIUS; // TRUE bounds, no padding (§6.1)
    if (!sweptHit(p, playerObj.position, rr)) return false;

    _targetFwd.set(0, 0, -1).applyQuaternion(playerObj.quaternion);
    _tmp.subVectors(p.shooterPos, playerObj.position);
    const fromAft = _targetFwd.dot(_tmp) < 0;
    const shielded = player.screen > 0 || player.shell > 0;

    const events = applyHit(player, { damage: p.damage, family: p.wkey, facet: fromAft ? 'aft' : 'fore', now });
    // HUD owns all pixels (incl. subtle screen-edge flash on shield hits) — emit only.
    ctx.emit('playerHit', { damage: p.damage, family: p.family, fromAft, shielded });
    emitPlayerApplyHits(events);
    spawnHitFx(p.mesh.position, p.family, shielded, playerObj);
    if (player.destroyed) parkMarksOnHost(playerObj);
    return true;
  }

  // ---------- per-frame ----------

  return {
    update(dt) {
      const now = ctx.world.time;
      reclaimHullMarks();
      // Wave 51: a fresh field reuses asteroid ids — reset the mineBlocked
      // throttle so the first refusal in the new system fires immediately.
      for (let i = 0; i < ctx.lastEvents.length; i++) {
        if (ctx.lastEvents[i].type === 'systemLoaded') {
          _lastBlockedId = -1;
          _lastBlockedAt = -1e9;
          _sunKillEmitted = false;
          parkAllHullMarks();
          break;
        }
      }
      if (ctx.flags.docked) {
        // Station owns the screen while docked: weapons cold, sim frozen.
        hideMiningFx();
        return;
      }
      const player = ctx.player;
      const playerObj = ctx.ship.object;

      // 1. Shared ship-state ticking: shield recharge, heat cooling, engine recovery.
      if (player) tickShipState(player, now, dt);
      for (let i = 0; i < ctx.ships.length; i++) {
        const st = ctx.ships[i]?.state;
        if (st) tickShipState(st, now, dt);
      }

      // 1b. Body impact (same-frame bodyHit from ship.js; combat ticks after ship).
      // Family 'impact' is not a WEAPONS key — applyHit falls back to 1:1
      // screen/shell then hull. One damaging scrape per IMPACT_GAP.
      if (player && !player.destroyed && now - _lastImpactAt >= IMPACT_GAP) {
        for (let i = 0; i < ctx.events.length; i++) {
          const e = ctx.events[i];
          if (e.type !== 'bodyHit' || e.kind === 'player') continue;
          const speed = e.speed || 0;
          if (speed < PHY.IMPACT_MIN_SPEED) continue;
          const damage = speed * PHY.IMPACT_SCREEN_PER_U;
          const events = applyHit(player, { damage, family: 'impact', facet: 'fore', now });
          e.damage = damage;
          ctx.emit('playerHit', { damage, family: 'impact', fromAft: false });
          emitPlayerApplyHits(events);
          _lastImpactAt = now;
          break;
        }
      }

      // 1c. Star heat / lethal core. Skip while jumping; docked already returned.
      if (player && !player.destroyed && !ctx.gate?.jumping && playerObj) {
        // Live star only. Scoped harness ctxs copy SYSTEMS but never
        // init solarsystem, so sunRadius stays 0 and mining pins do not
        // die at the origin.
        const sunR = ctx.config.world.sunRadius;
        const sun = ctx.config.world.sunPosition;
        if (sunR > 0 && sun) {
          sunZone(playerObj.position.x, playerObj.position.y, playerObj.position.z, sun.x, sun.y, sun.z, sunR, _sunOut);
          if (_sunOut.zone === 1) {
            const dps = PHY.SUN_HEAT_DPS + _sunOut.t * PHY.SUN_HEAT_RAMP;
            const events = applyHit(player, { damage: dps * dt, family: 'impact', facet: 'fore', now });
            emitPlayerApplyHits(events);
            if (now - _lastSunHeatAt >= SUN_HEAT_TOAST_GAP) {
              _lastSunHeatAt = now;
              ctx.emit('sunHeat', { t: _sunOut.t, dps });
            }
          } else if (_sunOut.zone === 2) {
            const packet = player.hullMax + player.screenMax + player.shellMax + 1;
            const events = applyHit(player, { damage: packet, family: 'impact', facet: 'fore', now });
            emitPlayerApplyHits(events);
            if (!_sunKillEmitted) {
              _sunKillEmitted = true;
              ctx.emit('sunKill', { reason: 'sun' });
            }
          }
        }
      }

      // 2. NPC fire requests (same-frame events from npc.js, which runs earlier).
      for (let i = 0; i < ctx.events.length; i++) {
        const e = ctx.events[i];
        if (e.type !== 'npcFire') continue;
        const ship = e.ship;
        if (!ship?.object || !ship.state || ship.state.destroyed || ship.state.disabled) continue;
        const tgt = e.target;
        if (tgt === 'player' || tgt == null) {
          if (!playerObj) continue;
          const bolt = spawnNpcShot(ship, e.weapon, playerObj);
          if (bolt) bolt.vsPlayer = true;
        } else if (tgt.object && tgt.state && !tgt.state.destroyed) {
          const bolt = spawnNpcShot(ship, e.weapon, tgt.object);
          if (bolt) bolt.vsPlayer = false;
        }
      }

      // 3. Player weapons (fire while held, rof-gated, heat-locked §6.3).
      let beamOn = false;
      if (ctx.input.fireHeld && player && !player.destroyed && !player.overheated && playerObj) {
        const wkey = groupWeapon(ctx);
        // Empty group 4: wkey is null — no missile shot, no ammo, no heat. Do not fall through to cannon.
        if (wkey === 'mining') {
          beamOn = updateMining(dt, playerObj);
        } else if (wkey && WEAPONS[wkey]?.family === 'missile') {
          tryPlayerMissile(wkey, now, playerObj);
        } else if (wkey && now >= nextFireAt[wkey]) {
          const w = WEAPONS[wkey];
          nextFireAt[wkey] = now + 1 / w.rof;
          firePlayerGun(wkey, w, playerObj);
        }
      }
      if (!beamOn) hideMiningFx(); // covers destroyed/overheated too (gate above)

      // 3b. Auto turret — not a weapon group. Skip if unseated / docked / dead / overheated.
      if (player && !player.destroyed && !player.overheated && playerObj) {
        tryPlayerTurret(now, playerObj);
      }

      // 4. Projectiles: integrate, then sphere-vs-sphere hit tests.
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;
        _prev.copy(p.mesh.position); // swept segment start (no tunneling)
        p.mesh.position.addScaledVector(p.vel, dt);
        p.traveled += p.speed * dt;
        if (p.traveled >= p.range) {
          deactivate(p);
          continue;
        }
        orientBolt(p);
        const hit = (p.fromPlayer || !p.vsPlayer)
          ? testNpcHits(p, now)
          : testPlayerHit(p, now, player, playerObj);
        if (hit) deactivate(p);
      }

      // 4b. Missiles: seeker then ballistic. Simulate even under reducedMotion (combat, not decoration).
      for (let i = 0; i < missilePool.length; i++) {
        const p = missilePool[i];
        if (!p.active) continue;
        const lock = p.lock;
        const lockLive = !!(lock?.object?.parent && lock.state && !lock.state.destroyed);
        if (!lockLive) p.lock = null;
        steerSeekerVel(p.vel, p.mesh.position, lockLive ? lock.object.position : null, p.speed, WEAPONS.missile.turn, dt);
        _prev.copy(p.mesh.position);
        p.mesh.position.addScaledVector(p.vel, dt);
        p.traveled += p.speed * dt;
        if (p.traveled >= p.range) {
          deactivate(p);
          continue;
        }
        orientBolt(p);
        if (testNpcHits(p, now)) deactivate(p);
      }

      // 5. Impact flashes: grow + fade (per-sprite material, mutated in place).
      for (let i = 0; i < flashes.length; i++) {
        const f = flashes[i];
        if (!f.sprite.visible) continue;
        f.t += dt;
        const k = f.t / f.ttl;
        if (k >= 1) {
          f.sprite.visible = false;
          continue;
        }
        const s = 1.5 + 3 * k;
        f.sprite.scale.set(s, s, 1);
        f.sprite.material.opacity = 1 - k;
      }

      // 5b. Muzzle pops + shield ripples. reducedMotion snaps one frame.
      for (let i = 0; i < muzzles.length; i++) {
        const f = muzzles[i];
        if (!f.sprite.visible) continue;
        if (f.snap) {
          if (f.seen) {
            f.sprite.visible = false;
            f.snap = false;
            continue;
          }
          f.seen = true;
          continue;
        }
        f.t += dt;
        const k = f.t / f.ttl;
        if (k >= 1) {
          f.sprite.visible = false;
          continue;
        }
        const s = f.base + f.grow * k;
        f.sprite.scale.set(s, s, 1);
        f.sprite.material.opacity = 1 - k;
      }
      for (let i = 0; i < ripples.length; i++) {
        const f = ripples[i];
        if (!f.sprite.visible) continue;
        if (f.snap) {
          if (f.seen) {
            f.sprite.visible = false;
            f.snap = false;
            continue;
          }
          f.seen = true;
          continue;
        }
        f.t += dt;
        const k = f.t / f.ttl;
        if (k >= 1) {
          f.sprite.visible = false;
          continue;
        }
        const s = 2.2 + 7.2 * k;
        f.sprite.scale.set(s, s, 1);
        f.sprite.material.opacity = 1 - k * k;
      }

      // 6. Impact sparks: ballistic drift + fade, in-place buffer writes.
      // Suppressed under reducedMotion (they animate, so hide them).
      const hideSparks = ctx.settings?.reducedMotion === true;
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        if (!s.active) continue;
        s.t += dt;
        const k = s.t / SPARK_TTL;
        if (k >= 1) {
          s.active = false;
          s.pts.visible = false;
          continue;
        }
        if (hideSparks) {
          s.pts.visible = false;
          continue;
        }
        s.pts.visible = true;
        for (let j = 0; j < s.arr.length; j++) s.arr[j] += s.vel[j] * dt;
        s.pts.geometry.attributes.position.needsUpdate = true;
        s.pts.material.opacity = 1 - k;
      }

      // 7. Mining chips + dust (wave 51): the pools keep integrating after
      // the beam turns off so bursts finish naturally rather than vanishing.
      // Under reducedMotion nothing new emits (updateMining gates it) and
      // live particles expire hidden instead of moving.
      const hideMineFx = ctx.settings?.reducedMotion === true;
      tickMinePool(mineSparks, dt, hideMineFx);
      tickMinePool(mineDust, dt, hideMineFx);
    },
  };
}
