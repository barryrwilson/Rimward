import * as THREE from 'three';
import { createShipState, U, POWER } from '../game/state.js';
import { hoverTurnRateFor } from '../game/flight-feel.js';
import { PHY } from '../game/physics.js';
import { collectBodies, resolveMover } from '../game/collision.js';
import { P, SHIP_SCALE, scaleFor } from '../game/ship-scale.js';
import {
  applyFlightEnvelope,
  registerPlayerRemount,
} from '../game/hangar.js';
import { buildPlayerPlatedMesh, animateShipMesh } from './npc.js';
import { releaseShipAsset } from './ship-assets.js';
import {
  LIVING_CADENCE,
  SWIM_IDLE_HZ,
  SWIM_CRUISE_HZ,
  cadenceFor,
  classCruise,
} from '../game/living-cadence.js';
import { LIVING_GAIT, gaitFor } from '../game/living-gait.js';
import { berthHeld } from './overlay-policy.js';

export { applyFlightEnvelope };

/**
 * Ship system — a LIVING ship: grown, not built. Swims through space like a
 * manta/whale/amoeba hybrid. The hull is a sculpted sphere deformed per-frame
 * by four layered motion fields, all of which run forever — the ship is never
 * still, even at zero throttle:
 *
 *   1. Swim wave  — whale-like traveling wave along the spine, growing toward
 *                   the tail; frequency/amplitude scale with speed but have a
 *                   nonzero idle floor.
 *   2. Wing flap  — manta-like flap of the wing membranes, tips lagging root.
 *   3. Breathing  — slow (~4 s) radial expansion/contraction; the emissive
 *                   veins brighten on the exhale.
 *   4. Heartbeat  — subtle ~1.1 Hz thump layered on the breath + vein glow.
 *   No propulsion organs: thrust reads as a bioluminescent surge through the
 *   vein network and a faster, deeper swim stroke. No nozzle, no glow pods.
 *   Plus a low-amplitude amoeba shimmer on the skin and an idle hover bob
 *   (fades out with speed) applied to the flesh child so the flight transform
 *   and chase cam are unaffected. Mood (ctx.bio.mood, §14.6) modulates the
 *   swim/flap rate, vein emissive tint/intensity, and idle jitter.
 *
 * FLIGHT (doc §5): fun-first, non-Newtonian, full 6DOF. Mouse offset
 * pitches and yaws the nose. Q/E rolls around the nose so the player
 * sets what “up” is. Chase and third cameras use the ship's up, not
 * world Y. Yaw/pitch/roll rate is hoverTurnRateFor(class, speed) from
 * flight-feel.js. Velocity eases toward
 * forward × (creep + throttle × (maxSpeed − creep)) with an acceleration
 * clamp plus artificial drag so she settles in ~stopTime at zero throttle.
 * Signature verbs: afterburner (§5.2, ×2 for 6 s, 8 s cooldown, FOV kick
 * §5.4) and vector-hold drift (§5.2, 4 s max, 6 s cooldown, velocity
 * re-aligns to facing over 0.8 s on release). Lateral/vertical strafe
 * rides along the ship's right/up axes.
 *
 * Afterburner trail (wave-6 polish): a pooled THREE.Points ring buffer
 * (preallocated position/color buffers + per-point life array) emitted at
 * the tail while ctx.ship.burnerActive, aged and faded in place via the
 * color buffer (additive blending: black = gone). Hidden otherwise, and
 * suppressed entirely under ctx.settings.reducedMotion.
 *
 * Owns ctx.ship (object/velocity/speed/burner/drift state) and ctx.player
 * (state record via createShipState); positions ctx.camera every frame.
 * Hit shake is a decaying camera-local offset after chase/third/first
 * placement (lastEvents only; reducedMotion / docked / jump → 0).
 * Weapon recoil (playerFire cannon/disruptor) is a decaying flesh-child
 * kick (local +Z / +Y) plus a small camera punch on the same shake path.
 * It never writes ship.velocity, input.throttle, or flags.matchSpeed.
 * Ship nose points along local -Z; the chase cam sits behind at local
 * (0, 4, 12). All scratch objects are module/init-scope — update() performs
 * zero allocations (vertex data is mutated in place).
 */

// Module-scope scratch (reused every frame; no per-frame allocation).
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _targetVelocity = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _realignFrom = new THREE.Vector3();
const _camAnchor = new THREE.Vector3();
const _camOffset = new THREE.Vector3(0, 4, 12); // chase: on-axis, behind + above
// Past the hull tip (ellipsoid z radius ~2.1). Eyes at z=-1.45 must not fill glass.
export const FIRST_PERSON_NOSE = new THREE.Vector3(0, 0.45, -2.8);
const _noseOffset = FIRST_PERSON_NOSE;
const _lockLast = new THREE.Vector3();
const _lockInst = new THREE.Vector3();
const _lockVel = new THREE.Vector3(); // smoothed lock world velocity (rock MATCH)
const _lookTarget = new THREE.Vector3();
const _moodColor = new THREE.Color(0x4fe0c8); // lerped toward the mood tint
const _targetColor = new THREE.Color();

// Hull bounce: reused every frame. collectBodies / resolveMover write in place.
const _bodies = { count: 0, items: [] };
const _hit = {
  px: 0, py: 0, pz: 0,
  vx: 0, vy: 0, vz: 0,
  hit: false, kind: null, speed: 0,
  nx: 0, ny: 0, nz: 0, overlap: 0,
};
const BODY_HIT_EMIT_GAP = 0.15;
let lastEmitAt = -1;

// Bio-expression tuning (§14: alive before a status label).
const COLOR_LERP_RATE = 3; // 1/s — mood color easing
const GROWTH_SCALE_MAX = 0.15; // hull grows up to +15% with ctx.bio.growth
const BREATH_SCALE_LERP = 4; // 1/s — smooths breath-depth pops on mood change
const SCAR_THRESHOLD_STEP = 0.18; // wounds per revealed scar patch
// Fixed scar anchor points on the hull (dorsal/ventral/flank), revealed by
// wound severity. Meshes are built once; per-frame work is visibility only.
const SCAR_ANCHORS = [
  [1.15, 0.28, -0.9],
  [-1.6, 0.22, 0.1],
  [0.45, 0.34, 0.85],
  [-0.75, -0.24, -0.5],
  [2.05, 0.14, 0.45],
];

const CAMERA_LERP_RATE = 6; // 1/s — frame-rate independent smoothing
const LOOK_AHEAD = 25; // chase: units in front of the ship the camera aims at
// Hit shake (FX-01): decaying local offset after placement. Caps keep the
// aim glass usable. Decay ~0.2 s (e^{-12·0.2} ≈ 0.09 leftover).
const SHAKE_DECAY = 12; // 1/s
const SHAKE_HIT_PER_DMG = 0.03; // playerHit — cannon 8 → 0.24 u
const SHAKE_BODY_PER_SPEED = 0.012; // bodyHit scrape
const SHAKE_BODY_PER_DMG = 0.03; // bodyHit after combat fills damage
const SHAKE_WRECK_AMP = 0.07; // nearby npcDestroyed rumble
const SHAKE_WRECK_DIST = 80;
const SHAKE_CHASE_MAX = 0.35;
const SHAKE_FIRST_MAX = 0.12;
const SHAKE_FIRE_CANNON = 0.055; // playerFire punch — well under first-person cap
const SHAKE_FIRE_DISRUPTOR = 0.08;
const RECOIL_DECAY = 12; // 1/s — ~0.2 s envelope, same as SHAKE_DECAY
const RECOIL_CANNON_Z = 0.16; // flesh local +Z = backward (nose = −Z)
const RECOIL_CANNON_Y = 0.07;
const RECOIL_DISRUPTOR_Z = 0.22;
const RECOIL_DISRUPTOR_Y = 0.1;
const _shakeWorld = new THREE.Vector3(); // last applied world offset (un-applied before lerp)
// Third: above and behind, steeper than the first (7.2, 8.4, 15) 29° follow.
// ~61° elevation. Look-at ahead so the hull sits in the bottom 25% (NDC y ≈ −0.70).
const THIRD_HEIGHT = 18;
const THIRD_BACK = 10;
const THIRD_LOOK_AHEAD = 16;
const THIRD_SHIP_SCALE = 0.55; // visual only — root / flight stay 1
const FOV_LERP_RATE = 5; // 1/s — afterburner FOV kick easing (§5.4)

// Flight feel (§5.1/§5.3). Live yaw/pitch/roll: hoverTurnRateFor in flight-feel.js.
const AUTOBANK_LERP_RATE = 7; // 1/s — ease leftover visual bank back to 0
const ENGINE_OUT_THRUST = 0.3; // §6.5: engine-out caps thrust at 30%

// Living-motion tuning. Idle/cruise Hz live in living-cadence.js (BIO-06).
const BREATH_HZ = 0.25; // ~4 s breath cycle
const HEART_HZ = 1.1; // resting heartbeat

// Mood visuals (§14.6): swim/flap rate multiplier, vein emissive tint +
// intensity multiplier, idle jitter amplitude, anxious flicker flag, and
// whole-body breath rate/depth. Serene is the baseline look.
const MOOD_VISUALS = {
  serene: { rate: 1.0, tint: 0x4fe0c8, glow: 1.0, jitter: 0, flicker: 0, breathHz: 0.2, breathDepth: 0.015 }, // warm teal, slow/deep
  keen: { rate: 1.25, tint: 0xb8ffe8, glow: 1.25, jitter: 0, flicker: 0, breathHz: 0.35, breathDepth: 0.012 }, // bright, eager
  anxious: { rate: 1.0, tint: 0xd8dce8, glow: 1.0, jitter: 1, flicker: 1, breathHz: 0.65, breathDepth: 0.006 }, // pale, flickering, fast/shallow
  pained: { rate: 0.6, tint: 0x8a86a0, glow: 0.6, jitter: 0, flicker: 0, breathHz: 0.16, breathDepth: 0.008 }, // slow, dim
  feral: { rate: 1.5, tint: 0xff2a66, glow: 1.1, jitter: 0, flicker: 0, breathHz: 0.55, breathDepth: 0.02 }, // hot red-violet, fast/deep
};
const ANXIOUS_JITTER_AMP = 0.05; // world units of idle flesh tremor

// Afterburner trail (wave-6): pooled ring buffer, teal-white in the
// bioluminescence family, faded via the color buffer (additive: black = gone).
const TRAIL_COUNT = 120; // ring-buffer capacity
const TRAIL_LIFE = 0.9; // s per point
const TRAIL_EMIT = 2; // points emitted per frame while burning
const TRAIL_TAIL = 2.3; // units behind ship center (nose = -Z)
const TRAIL_SPREAD = 0.55; // emission jitter
const TRAIL_R = 0.62; // teal-white tint (vein family)
const TRAIL_G = 1.0;
const TRAIL_B = 0.9;

/**
 * Bioluminescent vein texture: branching random-walk lines on dark flesh.
 *
 * Exported so the Models Browser can build the Player hull as the rebuild's
 * scale anchor (docs/FactionShipRebuildPlan.md §5). Forking this sculpt into a
 * second copy would let the yardstick drift away from the ship it measures.
 */
export function makeVeinTexture() {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.lineCap = 'round';
  g.shadowBlur = 6;

  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647; // deterministic
    return seed / 2147483647;
  };

  for (let vein = 0; vein < 42; vein++) {
    const magenta = vein % 6 === 0;
    const color = magenta ? '#c86bff' : '#46ffe0';
    g.strokeStyle = color;
    g.shadowColor = color;
    g.lineWidth = 1 + rand() * 1.6;
    g.globalAlpha = 0.35 + rand() * 0.5;

    let x = rand() * w;
    let y = rand() * h;
    let angle = rand() * Math.PI * 2;
    g.beginPath();
    g.moveTo(x, y);
    const segments = 24 + (rand() * 40) | 0;
    for (let s = 0; s < segments; s++) {
      angle += (rand() - 0.5) * 0.9;
      x += Math.cos(angle) * 7;
      y += Math.sin(angle) * 7;
      // wrap so veins flow across UV seams
      if (x < 0) x += w;
      if (x >= w) x -= w;
      if (y < 0) y += h;
      if (y >= h) y -= h;
      g.lineTo(x, y);
    }
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Small soft radial dot sprite for the afterburner trail points. */
function makeSoftDotTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Rest-pose scale vs light. Light stays 1 so this sculpt remains P.
 * Other classes use charter target / P. classKey is save-controlled.
 */
function livingRestScale(classKey) {
  const row = scaleFor(classKey);
  if (row === SHIP_SCALE.light) return 1;
  return row.target / P;
}

/** Modest class silhouette on the light sculpt. Light is identity. */
function livingSilhouette(classKey) {
  if (classKey === 'cutter') return { x: 0.88, y: 0.78, z: 1.16 };
  if (classKey === 'heavy') return { x: 1.10, y: 1.32, z: 1.06 };
  return { x: 1, y: 1, z: 1 };
}

/**
 * Sculpt a sphere into a manta/whale hull (nose -Z, tail +Z) and return the
 * geometry plus per-vertex animation metadata (base positions, normalized
 * spine coordinate, wingness factor). Animation then mutates positions
 * relative to the base every frame.
 *
 * Default classKey 'light' is P (src/game/ship-scale.js). Models Browser
 * calls with no args so the yardstick stays this exact light sculpt.
 */
export function makeLivingHull(classKey = 'light') {
  const geo = new THREE.SphereGeometry(1, 64, 40);
  const pos = geo.attributes.position;
  const count = pos.count;
  const base = new Float32Array(pos.array); // pristine copy
  const zNorm = new Float32Array(count); // 0 at nose → 1 at tail
  const wingness = new Float32Array(count); // 0 on spine → 1 at wingtips
  const restScale = livingRestScale(classKey);
  const sil = livingSilhouette(classKey);
  const sx = restScale * sil.x;
  const sy = restScale * sil.y;
  const sz = restScale * sil.z;

  let zMin = Infinity;
  let zMax = -Infinity;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = base[i3];
    let y = base[i3 + 1];
    let z = base[i3 + 2];

    // Elongate into a spine.
    z *= 2.1;
    // Manta disc: widen mid-body, keep nose and tail narrow.
    const mid = Math.exp(-(z * z) * 0.35);
    x *= 1 + 2.3 * mid;
    // Whip tail: compress width hard past z=1.2.
    if (z > 1.2) x *= Math.exp(-(z - 1.2) * 1.6);
    // Flatten vertically; slight dorsal camber so the back is rounded.
    y *= 0.3;
    y += 0.16 * Math.exp(-(x * x * 0.4 + z * z * 0.3)) * (y > 0 ? 1 : 0.4);
    // Head bulge near the nose.
    if (z < -1.2) y += 0.08 * Math.exp(-((z + 1.6) * (z + 1.6)) * 2);

    x *= sx;
    y *= sy;
    z *= sz;

    base[i3] = x;
    base[i3 + 1] = y;
    base[i3 + 2] = z;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }

  const zSpan = zMax - zMin;
  const wingStart = 0.7 * sx;
  const wingSpan = 2.3 * sx;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    zNorm[i] = (base[i3 + 2] - zMin) / zSpan;
    const w = (Math.abs(base[i3]) - wingStart) / wingSpan;
    wingness[i] = Math.pow(Math.min(Math.max(w, 0), 1), 1.5);
  }

  pos.array.set(base);
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return { geo, base, zNorm, wingness, count, restScale, sx, sy, sz };
}

let currentRig = null;
const _platedBox = new THREE.Box3();
const _platedSize = new THREE.Vector3();

function publishHullPath(ship, rig) {
  if (!ship) return;
  ship.hullPath = rig.kind;
  if (rig.kind === 'living') {
    ship.living = {
      swim: true,
      breath: true,
      heartbeat: true,
      base: rig.base,
      zNorm: rig.zNorm,
      wingness: rig.wingness,
      count: rig.count,
    };
  } else {
    ship.living = null;
  }
}

function makeFallbackPlated() {
  const root = new THREE.Group();
  root.name = 'player-plated-fallback';
  const geo = new THREE.BoxGeometry(2.4, 0.6, 3.6);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6a7380,
    metalness: 0.7,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  root.add(mesh);
  root.userData.platedFallback = true;
  return root;
}

function scalePlatedToPlayer(wrap, restScale) {
  wrap.updateMatrixWorld(true);
  _platedBox.setFromObject(wrap);
  _platedBox.getSize(_platedSize);
  const longest = Math.max(_platedSize.x, _platedSize.y, _platedSize.z, 1e-6);
  const s = restScale > 0 ? restScale : 1;
  wrap.scale.multiplyScalar((P * s) / longest);
}

function buildLivingVisual(classKey = 'light') {
  const root = new THREE.Object3D();
  const flesh = new THREE.Object3D();
  root.add(flesh);

  const { geo, base, zNorm, wingness, count, restScale, sx, sy, sz } =
    makeLivingHull(classKey);
  const veinTex = makeVeinTexture();
  const fleshMat = new THREE.MeshPhysicalMaterial({
    color: 0x2b2145, // deep violet flesh
    roughness: 0.5,
    metalness: 0.05,
    clearcoat: 0.7, // wet, organic sheen
    clearcoatRoughness: 0.35,
    emissive: 0xffffff,
    emissiveMap: veinTex, // bioluminescent veins
    emissiveIntensity: 0.8,
  });
  const hull = new THREE.Mesh(geo, fleshMat);
  flesh.add(hull);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x9ffff0 });
  const eyeGeo = new THREE.SphereGeometry(0.09 * restScale, 10, 8);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * 0.42 * sx, 0.14 * sy, -1.45 * sz);
    flesh.add(eye);
  }

  const underLight = new THREE.PointLight(0x40ffd8, 20, 28 * restScale);
  underLight.position.set(0, -0.9 * sy, 0.4 * sz);
  flesh.add(underLight);

  const scarGeo = new THREE.PlaneGeometry(0.55 * restScale, 0.34 * restScale);
  const scarMat = new THREE.MeshBasicMaterial({
    color: 0x070410, // dead flesh
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const scars = [];
  for (let i = 0; i < SCAR_ANCHORS.length; i++) {
    const a = SCAR_ANCHORS[i];
    const scar = new THREE.Mesh(scarGeo, scarMat);
    _delta.set(a[0] / 9, a[1] / 0.16, a[2] / 4.41).normalize();
    scar.position.set(a[0] * sx, a[1] * sy, a[2] * sz).addScaledVector(_delta, 0.05 * restScale);
    _targetVelocity.copy(scar.position).add(_delta);
    scar.lookAt(_targetVelocity);
    scar.visible = false;
    flesh.add(scar);
    scars.push(scar);
  }

  const posAttr = geo.attributes.position;
  return {
    kind: 'living',
    root,
    flesh,
    hull,
    geo,
    base,
    zNorm,
    wingness,
    count,
    restScale,
    posAttr,
    arr: posAttr.array,
    fleshMat,
    veinTex,
    eyeGeo,
    eyeMat,
    scarGeo,
    scarMat,
    scars,
    underLight,
    plated: null,
    platedIsAsset: false,
  };
}

function buildBuiltVisual(classKey, faction) {
  const root = new THREE.Object3D();
  const flesh = new THREE.Object3D();
  root.add(flesh);
  const wrap = new THREE.Group();
  wrap.name = 'player-plated';
  let inner = buildPlayerPlatedMesh(classKey, faction);
  let platedIsAsset = false;
  if (inner) {
    platedIsAsset = true;
  } else {
    inner = makeFallbackPlated();
  }
  wrap.add(inner);
  const restScale = livingRestScale(classKey);
  scalePlatedToPlayer(wrap, restScale);
  flesh.add(wrap);
  return {
    kind: 'built',
    root,
    flesh,
    hull: wrap,
    geo: null,
    base: null,
    zNorm: null,
    wingness: null,
    count: 0,
    posAttr: null,
    arr: null,
    fleshMat: null,
    veinTex: null,
    eyeGeo: null,
    eyeMat: null,
    scarGeo: null,
    scarMat: null,
    scars: [],
    underLight: null,
    plated: inner,
    platedIsAsset,
    restScale,
  };
}

function disposeUniqueNode(node) {
  if (!node) return;
  if (node.geometry) node.geometry.dispose();
  const mats = Array.isArray(node.material) ? node.material : (node.material ? [node.material] : []);
  for (const m of mats) {
    if (!m) continue;
    m.map?.dispose?.();
    m.emissiveMap?.dispose?.();
    m.dispose?.();
  }
}

function disposeRig(ctx, rig) {
  if (!rig?.root) return;
  if (rig.platedIsAsset && rig.plated) releaseShipAsset(rig.plated);
  ctx.scene?.remove(rig.root);
  if (rig.kind === 'living') {
    rig.geo?.dispose();
    rig.veinTex?.dispose();
    rig.fleshMat?.dispose();
    rig.eyeGeo?.dispose();
    rig.eyeMat?.dispose();
    rig.scarGeo?.dispose();
    rig.scarMat?.dispose();
  } else if (rig.plated && !rig.platedIsAsset) {
    rig.plated.traverse((node) => {
      if (node.isMesh) disposeUniqueNode(node);
    });
  }
}

function meshKindFor(ctx) {
  const p = ctx.player;
  if (p?.faction === 'unknowables') return 'living';
  if (p?.hullKind === 'built') return 'built';
  return 'living';
}

/**
 * Replace the player mesh. Keep dock transform. Zero velocity.
 * Unknowables force living before this branch.
 */
export function remountPlayerHull(ctx) {
  const ship = ctx.ship;
  if (!ctx.scene || !ship?.object) return;

  if (ctx.player?.faction === 'unknowables') ctx.player.hullKind = 'living';
  const kind = meshKindFor(ctx);

  const oldRoot = ship.object;
  const prev = ship.hullRig || (currentRig && currentRig.root === oldRoot ? currentRig : null);
  const pos = oldRoot.position;
  const quat = oldRoot.quaternion;

  const next = kind === 'built'
    ? buildBuiltVisual(ctx.player?.classKey || 'light', ctx.player?.faction || 'independent')
    : buildLivingVisual(ctx.player?.classKey || 'light');

  next.root.position.copy(pos);
  next.root.quaternion.copy(quat);

  ctx.scene.add(next.root);
  ship.object = next.root;
  ship.hullRig = next;
  ship.velocity?.set(0, 0, 0);
  ship.speed = 0;
  ship.camSnap = true;
  publishHullPath(ship, next);

  if (!currentRig || currentRig.root === oldRoot) currentRig = next;
  if (prev && prev.root === oldRoot) disposeRig(ctx, prev);
  else if (oldRoot !== next.root) ctx.scene.remove(oldRoot);
}

export function initShip(ctx) {
  const { scene, camera, config, input, ship } = ctx;
  const shipCfg = config.ship;

  // --- Living hull (nose toward local -Z). Boot default stays living. ---
  const born = buildLivingVisual();
  let root = born.root;
  currentRig = born;
  ship.hullRig = born;
  publishHullPath(ship, born);

  root.position.copy(config.world.shipSpawn);
  scene.add(root);

  // --- Afterburner trail (wave-6): pooled Points ring buffer, built once.
  // Positions/colors/life are preallocated; per-frame work is in-place
  // buffer writes + needsUpdate. World-space (NOT parented to the ship) so
  // the trail lingers along the flight path.
  const trailGeo = new THREE.BufferGeometry();
  const trailPos = new Float32Array(TRAIL_COUNT * 3);
  const trailCol = new Float32Array(TRAIL_COUNT * 3); // starts black = gone
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
  const trailLife = new Float32Array(TRAIL_COUNT); // >0 = live
  const trailPoints = new THREE.Points(
    trailGeo,
    new THREE.PointsMaterial({
      size: 0.7,
      map: makeSoftDotTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  trailPoints.frustumCulled = false; // points roam; skip stale culling
  trailPoints.visible = false;
  scene.add(trailPoints);
  let trailHead = 0; // ring-buffer write cursor

  ship.object = root;
  ship.velocity.set(0, 0, 0);
  ship.speed = 0;
  registerPlayerRemount(remountPlayerHull);

  // Player ship state record (§5.3 light row; combat.js/state.js mutate it).
  ctx.player = createShipState('light');

  const baseFov = camera.fov;
  let cameraSnapped = false; // snap (not lerp) on the first frame
  let lastCamMode = ''; // resnap when C cycles chase / third / first
  let shakeAmp = 0; // remaining hit-shake amplitude (world units)
  let shakePhase = 0; // steps on each impulse so hits do not share a waveform
  let recoilZ = 0; // remaining flesh kick, local +Z (backward)
  let recoilY = 0; // remaining flesh kick, local +Y (up)
  let swimPhase = 0; // accumulated (frequency varies with speed + mood)
  let bankAngle = 0; // smoothed auto-bank visual roll
  let burnerEndsAt = 0; // ctx.world.time when the current burn cuts out
  let driftEndsAt = 0; // ctx.world.time when vector-hold force-releases
  let realigning = false; // drift release: swinging velocity back to facing
  let realignT = 0; // seconds into the re-align window
  let breathScale = 1; // smoothed whole-body breath + growth scale
  let lockRef = null;
  let lockSpeed = 0;

  return {
    update(dt) {
      // Player destroyed: save.js owns the death/reload flow — emit nothing,
      // move nothing (combat.js emits 'playerDestroyed').
      if (ctx.player?.destroyed) {
        trailPoints.visible = false; // no ghost trail frozen on the death frame
        return;
      }

      root = ship.object || root;
      const rig = ship.hullRig || currentRig || born;
      const flesh = rig.flesh;
      const hull = rig.hull;
      const geo = rig.geo;
      const base = rig.base;
      const zNorm = rig.zNorm;
      const wingness = rig.wingness;
      const count = rig.count;
      const fleshMat = rig.fleshMat;
      const underLight = rig.underLight;
      const scars = rig.scars;
      const posAttr = rig.posAttr;
      const arr = rig.arr;
      const living = rig.kind === 'living' && base && posAttr && arr;
      const restScale = rig.restScale > 0 ? rig.restScale : 1;

      const time = ctx.world.time;
      const docked = ctx.flags.docked;
      // ctx.bio may briefly hold defaults before bio.js init — read with
      // fallbacks so the visuals never crash and always mean something.
      const bio = ctx.bio ?? {};
      const mood = MOOD_VISUALS[bio.mood] ?? MOOD_VISUALS.serene;
      const bioWounds = bio.wounds ?? 0;
      const bioGrowth = bio.growth ?? 0;

      // Engine-out (§6.5): thrust capped at 30% while the engine is down.
      const engineOut = ctx.player?.engineOut === true;
      const thrustCap = engineOut ? ENGINE_OUT_THRUST : 1;

      // ======================= FLIGHT =======================
      // Match-speed: ship.js owns flags.matchSpeed. Do not write input.throttle.
      const lock = ctx.targets.current;
      const liveLock = !!(lock && !lock.lockKind && lock.object && lock.state && !lock.state.destroyed);
      // Rock lock: asteroid list row only. Station/gate/pod/landmark refuse.
      const rockList = ctx.asteroids && ctx.asteroids.list;
      const rockListed = !!(lock && rockList && rockList.indexOf(lock) >= 0);
      const rockLock = !!(rockListed && lock.position
        && (lock.lockKind === 'rock' || (!lock.lockKind && !lock.object && !lock.state)));
      const lockPos = liveLock ? lock.object.position : (rockLock ? lock.position : null);
      const lockPosOk = !!(lockPos
        && Number.isFinite(lockPos.x)
        && Number.isFinite(lockPos.y)
        && Number.isFinite(lockPos.z));
      if ((liveLock || rockLock) && lockPosOk) {
        if (lock !== lockRef) {
          lockRef = lock;
          _lockLast.copy(lockPos);
          lockSpeed = 0;
          _lockVel.set(0, 0, 0);
        } else if (dt > 0) {
          const vdt = Math.min(dt, 0.1);
          _lockInst.copy(lockPos).sub(_lockLast).divideScalar(vdt);
          const instOk = Number.isFinite(_lockInst.x)
            && Number.isFinite(_lockInst.y)
            && Number.isFinite(_lockInst.z);
          if (instOk) {
            const k = Math.min(1, vdt * 8);
            if (liveLock) {
              lockSpeed += (_lockInst.length() - lockSpeed) * k;
            } else {
              // Same dt clamp / gain as lockSpeed, but keep the world vector.
              _lockVel.x += (_lockInst.x - _lockVel.x) * k;
              _lockVel.y += (_lockInst.y - _lockVel.y) * k;
              _lockVel.z += (_lockInst.z - _lockVel.z) * k;
            }
            _lockLast.copy(lockPos);
          }
        }
      } else {
        lockRef = null;
        lockSpeed = 0;
        _lockVel.set(0, 0, 0);
      }
      const velOk = Number.isFinite(_lockVel.x)
        && Number.isFinite(_lockVel.y)
        && Number.isFinite(_lockVel.z);
      // NaN rock pose: fail closed. Ships still match on liveLock alone.
      const matchLive = liveLock || (rockLock && lockPosOk && velOk);
      const flee = ctx.flee;
      const fleeOn = !!(flee && flee.engaged === true);
      const ap = ctx.autopilot;
      const apOn = !fleeOn && !!((ap && ap.engaged === true)
        || (ctx.world && ctx.world.nav && ctx.world.nav.autopilot === true));
      const am = ctx.automine;
      // Flee wins during an agent afterburner evade. Else autopilot, then automine.
      const amOn = !apOn && !fleeOn && !!(am && am.engaged === true);
      if (input.matchSpeedPressed && !apOn && !amOn && !fleeOn) {
        if (ctx.flags.matchSpeed) ctx.flags.matchSpeed = false;
        else if (matchLive && !docked && !ctx.gate.jumping && !input.throttleHeld) {
          ctx.flags.matchSpeed = true;
        }
      }
      if (ctx.flags.matchSpeed
        && (docked || ctx.gate.jumping || !matchLive || input.throttleHeld || amOn || fleeOn)) {
        ctx.flags.matchSpeed = false;
      }

      const held = berthHeld(ctx);
      if (!docked && !held) {
        // --- Afterburner state machine (§5.2): tap Space → ×2 for burnTime,
        // then cooldown before the next burn is allowed.
        if (
          input.afterburnerPressed &&
          !ship.burnerActive &&
          time >= ship.burnerReadyAt &&
          (ctx.player?.power ?? 0) >= POWER.afterburnerMin
        ) {
          ship.burnerActive = true;
          input.fullStop = false; // burn is a thrust command — cancels full stop
          burnerEndsAt = time + shipCfg.afterburner.burnTime;
        }
        if (ship.burnerActive) {
          const p = ctx.player;
          if (p) {
            p.powerDrainThisFrame = true;
            const cur = Number.isFinite(p.power) ? p.power : 0;
            p.power = Math.max(0, cur - POWER.afterburnerPerSec * dt);
            if (p.power <= 0) {
              ship.burnerActive = false;
              ship.burnerReadyAt = time + shipCfg.afterburner.cooldown;
            }
          }
        }
        if (ship.burnerActive && time >= burnerEndsAt) {
          ship.burnerActive = false;
          ship.burnerReadyAt = time + shipCfg.afterburner.cooldown;
        }
        const burnMult = ship.burnerActive ? shipCfg.afterburner.multiplier : 1;

        // --- Vector-hold drift (§5.2): while held (and off cooldown) the
        // velocity vector is frozen while facing turns freely. On release
        // (or the 4 s cap) velocity re-aligns to facing over `realign` s.
        if (
          !ship.driftActive &&
          !realigning &&
          input.driftHeld &&
          time >= ship.driftReadyAt
        ) {
          ship.driftActive = true;
          driftEndsAt = time + shipCfg.drift.duration;
        }
        if (ship.driftActive && (!input.driftHeld || time >= driftEndsAt)) {
          ship.driftActive = false;
          ship.driftReadyAt = time + shipCfg.drift.cooldown;
          realigning = true;
          realignT = 0;
          _realignFrom.copy(ship.velocity);
        }

        // --- Steering: yaw/pitch toward the reticle, roll on Q/E.
        // Mouse up always pitches the nose up in ship space.
        let turn =
          hoverTurnRateFor(ctx.player?.classKey || 'light', ship.speed) *
          ctx.bio.turnFactor;
        // Locked hull in front but off the nose: a small extra pull so a
        // chase can finish the last degrees into the sights.
        if (liveLock) {
          _forward.set(0, 0, -1).applyQuaternion(root.quaternion);
          _lockInst.copy(lock.object.position).sub(root.position);
          const lockDist = _lockInst.length();
          if (lockDist > 1) {
            _lockInst.multiplyScalar(1 / lockDist);
            const align = _forward.dot(_lockInst);
            if (align > 0.08 && align < 0.97) turn *= 1.22;
          }
        }
        const rs = turn * dt;
        const holdApJump = apOn && ctx.gate.jumping;
        const steerY = holdApJump ? 0 : (apOn && ap ? ap.pitch : (amOn ? am.pitch : (fleeOn ? flee.pitch : input.steerY)));
        const steerX = holdApJump ? 0 : (apOn && ap ? ap.yaw : (amOn ? am.yaw : (fleeOn ? flee.yaw : input.steerX)));
        const throttleSet = holdApJump ? 0 : (apOn && ap ? ap.throttle : (amOn ? am.throttle : (fleeOn ? flee.throttle : input.throttle)));
        if (steerY) root.rotateX(steerY * rs);
        if (steerX) root.rotateY(-steerX * rs);
        if (!apOn && !amOn && !fleeOn && input.roll) root.rotateZ(input.roll * rs);

        // --- Velocity.
        _forward.set(0, 0, -1).applyQuaternion(root.quaternion);
        if (ship.driftActive) {
          // Vector-hold: velocity keeps its vector; facing is free.
        } else if (realigning) {
          // Swing the held vector back onto the nose over `realign` seconds,
          // preserving magnitude.
          realignT += dt;
          const k = Math.min(realignT / shipCfg.drift.realign, 1);
          const ease = k * k * (3 - 2 * k); // smoothstep
          _targetVelocity.copy(_forward).multiplyScalar(_realignFrom.length());
          ship.velocity.copy(_realignFrom).lerp(_targetVelocity, ease);
          if (k >= 1) realigning = false;
        } else {
          // Ease toward forward × (creep + throttle × (maxSpeed − creep)),
          // plus strafe along the ship's right/up axes (§5.1). Full stop
          // (double-tap F) overrides the creep floor — she holds station.
          const throttleEff = throttleSet * thrustCap;
          _right.set(1, 0, 0).applyQuaternion(root.quaternion);
          _up.set(0, 1, 0).applyQuaternion(root.quaternion);
          const amIdle = amOn && throttleSet < 0.02;
          const apIdle = apOn && ap && ap.mode === 'dock' && ap.idle === true
            && throttleSet < 0.02;
          const helmIdle = amIdle || apIdle;
          const rockMatch = (ctx.flags.matchSpeed || amOn) && rockLock && lockPosOk && velOk;
          if (rockMatch) {
            // Hold the rock's world vector. Scalar-along-nose misses a slide.
            // Creep/throttle/strafe ride in the rock rest frame; idle holds.
            const relFwd = (input.fullStop || helmIdle || throttleEff < 0.02)
              ? 0
              : (shipCfg.creep + throttleEff * (shipCfg.maxSpeed - shipCfg.creep)) *
                ctx.bio.speedFactor *
                burnMult;
            _targetVelocity
              .copy(_lockVel)
              .addScaledVector(_forward, relFwd)
              .addScaledVector(_right, input.strafeX * shipCfg.strafeSpeed)
              .addScaledVector(_up, input.strafeY * shipCfg.strafeSpeed);
          } else {
            let fwdSpeed;
            if (ctx.flags.matchSpeed && liveLock) {
              // Hold lock world speed. Creep floor uses a full-stop *effect*
              // without writing input.fullStop. Cruise clamp, no burn.
              fwdSpeed = lockSpeed < shipCfg.creep
                ? 0
                : Math.min(lockSpeed, shipCfg.maxSpeed);
            } else {
              fwdSpeed = (input.fullStop || helmIdle)
                ? 0
                : (shipCfg.creep + throttleEff * (shipCfg.maxSpeed - shipCfg.creep)) *
                  ctx.bio.speedFactor *
                  burnMult;
            }
            _targetVelocity
              .copy(_forward)
              .multiplyScalar(fwdSpeed)
              .addScaledVector(_right, input.strafeX * shipCfg.strafeSpeed)
              .addScaledVector(_up, input.strafeY * shipCfg.strafeSpeed);
          }

          _delta.subVectors(_targetVelocity, ship.velocity);
          const deltaLen = _delta.length();
          const maxStep = shipCfg.acceleration * dt;
          if (deltaLen > maxStep) _delta.multiplyScalar(maxStep / deltaLen);
          ship.velocity.add(_delta);

          // Artificial drag at (near) zero throttle: settle in ~stopTime
          // instead of drifting forever (§5.1, §5.3 light row).
          // Rock MATCH: damping would bleed the hold back to world rest.
          if (throttleSet < 0.02 && !rockMatch) {
            ship.velocity.multiplyScalar(Math.exp(-shipCfg.damping * dt));
          }
        }

        // --- Integrate position; publish speed for the HUD.
        root.position.addScaledVector(ship.velocity, dt);
        ship.speed = ship.velocity.length();

        // Sphere vs world bodies. Apply the slide every frame; throttle bodyHit.
        if (root && !ctx.flags.docked && !ctx.gate.jumping && !ctx.input.dockPressed) {
          collectBodies(ctx, _bodies);
          let kept = 0;
          for (let i = 0; i < _bodies.count; i++) {
            const body = _bodies.items[i];
            if (body.kind === 'sun') continue;
            _bodies.items[kept] = body;
            kept++;
          }
          _bodies.count = kept;
          resolveMover(
            root.position.x,
            root.position.y,
            root.position.z,
            ship.velocity.x,
            ship.velocity.y,
            ship.velocity.z,
            PHY.PLAYER_RADIUS,
            _bodies,
            'player',
            -1,
            _hit,
          );
          if (_hit.hit) {
            root.position.set(_hit.px, _hit.py, _hit.pz);
            ship.velocity.set(_hit.vx, _hit.vy, _hit.vz);
            ship.speed = ship.velocity.length();
            if (time - lastEmitAt >= BODY_HIT_EMIT_GAP || time < lastEmitAt) {
              lastEmitAt = time;
              ctx.emit('bodyHit', { kind: _hit.kind, speed: _hit.speed, damage: 0 });
            }
          }
        }

        // Player roll is a real axis now. Do not add a fake visual bank.
        bankAngle += (0 - bankAngle) * (1 - Math.exp(-AUTOBANK_LERP_RATE * dt));
      } else if (held && !docked) {
        // Berth hold: skip player flight integrate. Keep velocity for RESUME.
        bankAngle += (0 - bankAngle) * (1 - Math.exp(-AUTOBANK_LERP_RATE * dt));
        _forward.set(0, 0, -1).applyQuaternion(root.quaternion);
      } else {
        // Docked: park — no thrust, drift, or steering; hold position.
        ship.velocity.set(0, 0, 0);
        ship.speed = 0;
        ship.driftActive = false;
        ship.burnerActive = false;
        ctx.flags.matchSpeed = false;
        realigning = false;
        bankAngle += (0 - bankAngle) * (1 - Math.exp(-AUTOBANK_LERP_RATE * dt));
        _forward.set(0, 0, -1).applyQuaternion(root.quaternion);
      }

      // ================= LIVING MOTION =================
      const t = ctx.elapsed;
      const speedNorm = Math.min(ship.speed / shipCfg.maxSpeed, 1.5);

      // Swim wave: frequency/amplitude scale with speed, never reach zero.
      // Mood paces the stroke (§14.6): keen/feral faster, pained slower.
      // Light (and unknown → light) keeps the live Hz envelope bit-identical.
      const cadence = cadenceFor(ctx.player?.classKey);
      let swimHz;
      let flapAmp;
      if (cadence !== LIVING_CADENCE.light) {
        const cruise = classCruise(ctx.player?.classKey);
        const spd = Number.isFinite(ship.speed) ? Math.max(ship.speed, 0) : 0;
        const hz =
          (SWIM_IDLE_HZ + (SWIM_CRUISE_HZ - SWIM_IDLE_HZ) * Math.min(spd / cruise, 1)) *
          cadence.hzScale;
        swimHz = hz * mood.rate;
        flapAmp = (0.16 + 0.5 * Math.min(speedNorm, 1.5)) * restScale * cadence.sweepScale;
      } else {
        swimHz =
          (SWIM_IDLE_HZ + (SWIM_CRUISE_HZ - SWIM_IDLE_HZ) * Math.min(speedNorm, 1)) *
          mood.rate;
        flapAmp = (0.16 + 0.5 * speedNorm) * restScale;
      }
      swimPhase += dt * Math.PI * 2 * swimHz;
      const bodyAmp = (0.1 + 0.22 * speedNorm) * restScale;

      // Breath + heartbeat (always on).
      const breathPhase = t * Math.PI * 2 * BREATH_HZ;
      const breath = Math.sin(breathPhase);
      const heart = Math.pow(Math.max(Math.sin(t * Math.PI * 2 * HEART_HZ), 0), 6);
      const radialScale = 1 + 0.035 * breath + 0.02 * heart;

      if (living) {
        // Deform vertices in place: breath/heart scale → spine wave → wing flap
        // → amoeba shimmer. Light (and unknown → light) stays bit-identical.
        // Other living remounts multiply spine/flap by gait and add Z + radial.
        const playerClass = ctx.player?.classKey;
        const gait =
          typeof playerClass === 'string' &&
          playerClass !== 'light' &&
          Object.hasOwn(LIVING_GAIT, playerClass)
            ? gaitFor(playerClass)
            : null;
        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const bx = base[i3];
          const by = base[i3 + 1];
          const bz = base[i3 + 2];

          let x = bx * radialScale;
          let y = by * radialScale;
          let z = bz * radialScale;

          const zn = zNorm[i];
          const w = wingness[i];
          if (gait) {
            x += bodyAmp * zn * zn * Math.sin(6.9 * zn - swimPhase) * gait.spineX;
            if (w > 0) y += flapAmp * w * Math.sin(swimPhase - 1.4 * Math.abs(bx)) * gait.flapY;
            z += bodyAmp * zn * zn * Math.sin(swimPhase - 2.1 * zn) * gait.kickZ;
            const pulse = 1 + 0.04 * gait.radial * Math.sin(swimPhase);
            x *= pulse;
            y *= pulse;
            z *= pulse;
          } else {
            x += bodyAmp * zn * zn * Math.sin(6.9 * zn - swimPhase);
            if (w > 0) y += flapAmp * w * Math.sin(swimPhase - 1.4 * Math.abs(bx));
          }

          y += 0.03 * restScale * Math.sin(1.7 * bx + t * 0.9) * Math.sin(2.3 * bz - t * 1.3);

          arr[i3] = x;
          arr[i3 + 1] = y;
          arr[i3 + 2] = z;
        }
        posAttr.needsUpdate = true;
        geo.computeVertexNormals();

        // Bioluminescence follows mood (§14.6): the vein color EASES toward
        // the mood target each frame, so a mood shift reads as a feeling
        // washing over the hull, not a switch. Scratch colors — no allocation.
        _targetColor.setHex(mood.tint);
        const colorK = 1 - Math.exp(-COLOR_LERP_RATE * dt);
        _moodColor.lerp(_targetColor, colorK);
        fleshMat.emissive.copy(_moodColor);
        underLight.color.lerp(_targetColor, colorK);

        // Veins brighten on the exhale, thump with the heartbeat (mood-scaled).
        // Anxious light is unsteady (flicker); wounds dim the whole network.
        let glow = (0.65 + 0.25 * breath + 0.35 * heart) * mood.glow;
        if (mood.flicker) {
          glow *= 1 - 0.35 * (0.5 + 0.5 * Math.sin(t * 31.7) * Math.sin(t * 17.3));
        }
        fleshMat.emissiveIntensity = glow * (1 - 0.5 * bioWounds);

        // Wound scars: reveal one dark patch per severity threshold.
        for (let i = 0; i < scars.length; i++) {
          scars[i].visible = bioWounds >= (i + 1) * SCAR_THRESHOLD_STEP;
        }

        const thrust =
          input.throttle *
          thrustCap *
          (ship.burnerActive ? shipCfg.afterburner.multiplier : 1);
        fleshMat.emissiveIntensity += 0.6 * Math.min(thrust, 1);
        underLight.intensity = 5 + thrust * 22 + heart * 5;
      } else if (rig.kind === 'built' && rig.plated) {
        animateShipMesh(rig.plated, t, ctx.settings?.reducedMotion === true, camera);
      }

      // Idle hover: gentle bob + sway while (nearly) stationary, fading out
      // with speed. Anxious adds a tremor (§14.6). Applied to the flesh child
      // so flight + camera are clean.
      const idleWeight = 1 - Math.min(ship.speed / 3, 1);
      flesh.position.y = Math.sin(t * 0.8) * 0.12 * idleWeight;
      const jitter = ANXIOUS_JITTER_AMP * mood.jitter * idleWeight;
      flesh.position.x = jitter * Math.sin(t * 37.3) * Math.sin(t * 21.7);
      flesh.position.z = jitter * Math.sin(t * 29.1 + 1.3);
      flesh.rotation.z =
        bankAngle + Math.sin(t * 0.5) * 0.03 * idleWeight; // auto-bank + idle sway

      // Whole-body breath + growth (§14): a subtle scale pulse whose rate
      // and depth follow mood, composed over a hull that grows up to +15%
      // with ctx.bio.growth. Applied to the flesh child only — flight
      // transforms (root position/rotation) are never touched.
      const breathTarget =
        (1 + bioGrowth * GROWTH_SCALE_MAX) *
        (1 + mood.breathDepth * Math.sin(t * Math.PI * 2 * mood.breathHz));
      breathScale += (breathTarget - breathScale) * (1 - Math.exp(-BREATH_SCALE_LERP * dt));
      flesh.scale.setScalar(breathScale);
      // ================================================

      // --- Afterburner trail (wave-6): emit at the tail while burning;
      // age + fade in place. reducedMotion → no emission, trail hidden.
      const reducedMotion = ctx.settings?.reducedMotion === true;
      let trailTouched = false;
      if (!reducedMotion && ship.burnerActive && !docked) {
        _delta.copy(root.position).addScaledVector(_forward, -TRAIL_TAIL * restScale);
        for (let n = 0; n < TRAIL_EMIT; n++) {
          const i = trailHead;
          trailHead = (trailHead + 1) % TRAIL_COUNT;
          const i3 = i * 3;
          trailPos[i3] = _delta.x + (Math.random() - 0.5) * TRAIL_SPREAD;
          trailPos[i3 + 1] = _delta.y + (Math.random() - 0.5) * TRAIL_SPREAD;
          trailPos[i3 + 2] = _delta.z + (Math.random() - 0.5) * TRAIL_SPREAD;
          trailLife[i] = TRAIL_LIFE;
        }
        trailTouched = true;
      }
      let trailLive = 0;
      for (let i = 0; i < TRAIL_COUNT; i++) {
        if (trailLife[i] <= 0) continue;
        trailLife[i] -= dt;
        const i3 = i * 3;
        if (trailLife[i] <= 0) {
          trailCol[i3] = 0;
          trailCol[i3 + 1] = 0;
          trailCol[i3 + 2] = 0;
          trailTouched = true;
          continue;
        }
        const f = trailLife[i] / TRAIL_LIFE;
        trailCol[i3] = TRAIL_R * f;
        trailCol[i3 + 1] = TRAIL_G * f;
        trailCol[i3 + 2] = TRAIL_B * f;
        trailLive++;
      }
      trailPoints.visible = trailLive > 0 && !reducedMotion;
      if (trailTouched) {
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.color.needsUpdate = true;
      }

      // --- Afterburner FOV kick (§5.4): +12° while burning, ease back after.
      const fovTarget = baseFov + (ship.burnerActive ? shipCfg.fovKick : 0);
      if (Math.abs(camera.fov - fovTarget) > 0.01) {
        camera.fov += (fovTarget - camera.fov) * (1 - Math.exp(-FOV_LERP_RATE * dt));
        camera.updateProjectionMatrix();
      }

      // --- Camera: C cycles chase → third → first.
      // Chase: on-axis follow. Third: above and behind at a steeper angle
      // than the first attempt; hull sits in the bottom 25%. First: nose.
      const camMode = ctx.flags.camera || (ctx.flags.firstPerson ? 'first' : 'chase');
      if (camMode !== lastCamMode) {
        lastCamMode = camMode;
        cameraSnapped = false;
      }
      if (ship.camSnap) {
        cameraSnapped = false;
        ship.camSnap = false;
      }
      const viewScale = camMode === 'third' ? THIRD_SHIP_SCALE : 1;
      flesh.scale.setScalar(breathScale * viewScale);
      if (camMode === 'first') {
        flesh.visible = false;
        hull.visible = false;
        if (underLight) underLight.visible = false;
        for (let si = 0; si < scars.length; si++) scars[si].visible = false;
        _up.set(0, 1, 0).applyQuaternion(root.quaternion);
        camera.up.copy(_up);
        _camAnchor.copy(_noseOffset).multiplyScalar(restScale)
          .applyQuaternion(root.quaternion).add(root.position);
        camera.position.copy(_camAnchor);
        camera.quaternion.copy(root.quaternion);
      } else {
        // Ship-up, not world Y. World-up lookAt locks the horizon and
        // refuses a nose-down attitude (look dir ≈ world ±Y).
        flesh.visible = true;
        hull.visible = true;
        if (underLight) underLight.visible = true;
        _forward.set(0, 0, -1).applyQuaternion(root.quaternion);
        _up.set(0, 1, 0).applyQuaternion(root.quaternion);
        camera.up.copy(_up);
        if (camMode === 'third') {
          _camAnchor.copy(root.position)
            .addScaledVector(_up, THIRD_HEIGHT * restScale)
            .addScaledVector(_forward, -THIRD_BACK * restScale);
          _lookTarget.copy(root.position).addScaledVector(_forward, THIRD_LOOK_AHEAD * restScale);
        } else {
          _camAnchor.copy(_camOffset).multiplyScalar(restScale)
            .applyQuaternion(root.quaternion).add(root.position);
          _lookTarget.copy(root.position).addScaledVector(_forward, LOOK_AHEAD * restScale);
        }
        // Soft padlock: keep a forward lock on glass so a crossing chase
        // does not sit just off the frame.
        if (liveLock) {
          _lockInst.copy(lock.object.position).sub(root.position);
          const lookDist = _lockInst.length();
          if (lookDist > 12 && lookDist < U.TARGET_RANGE) {
            _lockInst.multiplyScalar(1 / lookDist);
            const align = _forward.dot(_lockInst);
            if (align > 0.2) {
              const k = align - 0.2;
              _lookTarget.lerp(lock.object.position, k < 0.5 ? k : 0.5);
            }
          }
        }
        if (!cameraSnapped) {
          camera.position.copy(_camAnchor);
          cameraSnapped = true;
        } else {
          // Strip last frame's shake so the follow lerp does not smear it.
          camera.position.sub(_shakeWorld);
          camera.position.lerp(_camAnchor, 1 - Math.exp(-CAMERA_LERP_RATE * dt));
        }
        camera.lookAt(_lookTarget);
      }

      // Hit shake + fire recoil: lastEvents only (combat.js emits playerHit
      // / playerFire after this system, so a same-frame event lands next
      // frame). Camera-local offset after placement. Recoil overlays the
      // flesh child only — root / velocity / throttle stay put.
      if (reducedMotion || docked || ctx.gate.jumping) {
        shakeAmp = 0;
        recoilZ = 0;
        recoilY = 0;
        _shakeWorld.set(0, 0, 0);
      } else {
        const evs = ctx.lastEvents;
        let impulse = 0;
        let fireZ = 0;
        let fireY = 0;
        for (let i = 0; i < evs.length; i++) {
          const ev = evs[i];
          if (ev.type === 'playerHit') {
            const dmg = ev.damage || 0;
            const a = Math.min(dmg * SHAKE_HIT_PER_DMG, SHAKE_CHASE_MAX);
            if (a > impulse) impulse = a;
          } else if (ev.type === 'bodyHit') {
            const dmg = ev.damage || 0;
            const spd = ev.speed || 0;
            const a = dmg > 0
              ? Math.min(dmg * SHAKE_BODY_PER_DMG, SHAKE_CHASE_MAX)
              : Math.min(spd * SHAKE_BODY_PER_SPEED, SHAKE_CHASE_MAX);
            if (a > impulse) impulse = a;
          } else if (ev.type === 'npcDestroyed') {
            const wreck = ev.ship?.object;
            if (wreck) {
              if (wreck.position.distanceToSquared(root.position) < SHAKE_WRECK_DIST * SHAKE_WRECK_DIST) {
                if (SHAKE_WRECK_AMP > impulse) impulse = SHAKE_WRECK_AMP;
              }
            }
          } else if (ev.type === 'playerFire') {
            const w = ev.weapon;
            if (w === 'cannon' || w === 'disruptor') {
              const dis = w === 'disruptor';
              const a = dis ? SHAKE_FIRE_DISRUPTOR : SHAKE_FIRE_CANNON;
              if (a > impulse) impulse = a;
              const z = dis ? RECOIL_DISRUPTOR_Z : RECOIL_CANNON_Z;
              const y = dis ? RECOIL_DISRUPTOR_Y : RECOIL_CANNON_Y;
              if (z > fireZ) fireZ = z;
              if (y > fireY) fireY = y;
            }
          }
        }
        shakeAmp *= Math.exp(-SHAKE_DECAY * dt);
        if (impulse > 0) {
          shakeAmp = Math.max(shakeAmp, impulse);
          shakePhase += 1.7;
        }
        if (shakeAmp < 1e-4) shakeAmp = 0;
        recoilZ *= Math.exp(-RECOIL_DECAY * dt);
        recoilY *= Math.exp(-RECOIL_DECAY * dt);
        if (fireZ > recoilZ) recoilZ = fireZ;
        if (fireY > recoilY) recoilY = fireY;
        if (recoilZ < 1e-4) recoilZ = 0;
        if (recoilY < 1e-4) recoilY = 0;
        flesh.position.z += recoilZ;
        flesh.position.y += recoilY;
        const peak = camMode === 'first' ? SHAKE_FIRST_MAX : SHAKE_CHASE_MAX;
        const amp = shakeAmp > peak ? peak : shakeAmp;
        if (amp > 0) {
          const ox = Math.sin(t * 73.1 + shakePhase) * amp;
          const oy = Math.cos(t * 61.7 + shakePhase * 1.7) * amp * 0.7;
          const oz = Math.sin(t * 47.3 + shakePhase * 0.4) * amp * 0.15;
          const px = camera.position.x;
          const py = camera.position.y;
          const pz = camera.position.z;
          camera.translateX(ox);
          camera.translateY(oy);
          camera.translateZ(oz);
          _shakeWorld.set(camera.position.x - px, camera.position.y - py, camera.position.z - pz);
        } else {
          _shakeWorld.set(0, 0, 0);
        }
      }
    },
  };
}
