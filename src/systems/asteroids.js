import * as THREE from 'three';
import { WEAPONS, SYSTEMS, ORE_TYPES, COMMODITIES, pickOreType, oreKeysForBand } from '../game/state.js';
import { spawnPod } from '../game/pods.js';
import { PHY } from '../game/physics.js';
import { cylinderOverlap, torusOverlap } from '../game/collision.js';
import { applyRockSurface } from './rock-surface.js';
import { PLANET_SLOT_COUNT } from './solarsystem.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Asteroid field — one InstancedMesh PER ORE TYPE of tumbling rocks, built
 * from SYSTEMS[ctx.world.currentSystem].field plus the system's band
 * (doc §6.8 terrain, §10.3 miner, §13.1 world-tells-first, §15.1 identity).
 *
 * Wave 51: per-ore mesh fan-out. Field composition is driven by the system
 * BAND (def.band ?? 0) through ORE_BAND_WEIGHTS: a first pass draws one ore
 * key per rock via pickOreType(band, rng()) so the RNG draw order — and thus
 * the mix — is deterministic per worldSeed. Each ore type that drew ≥1 rock
 * gets its own InstancedMesh named 'asteroid-field-<oreKey>' with
 * userData.oreKey set (boot harness contract); empty meshes are never
 * allocated. Geometry shape, colour band, roughness/metalness/emissive and
 * scaleMult all come from ORE_TYPES[oreKey].rock — this file holds no
 * per-ore constants of its own.
 *
 * Wave 2: per-system rebuild. On ctx.lastEvents 'systemLoaded' { to } EVERY
 * per-ore mesh is removed from the scene and disposed (geometry + material)
 * before the new field builds — a leaked mesh across a jump is a hard
 * failure. ctx.asteroids.list is REPLACED with a new array so combat.js
 * never holds stale entries. oreMult scales ore per rock (Veridian 1.5 →
 * ×1.5 rounded up: richer rock).
 *
 * Hardness/resist extraction maths (§6.3): combat.js emits 'mineHit'
 * { asteroidId, point, laserTier, extractPerSec } — the raw head rate. The
 * effective rate for a rock is extractPerSec / ORE_TYPES[oreKey].extractResist,
 * so hard rock is slow even with the right head. Rocks harder than the
 * installed head never reach this file: combat.js emits 'mineBlocked'
 * instead. Pods spawn tinted with the ore's podTint (spawnPod's 5th arg).
 *
 * Heat glow (§13.1): a rock being cut warms its instance colour toward the
 * ore's sparkColor (heat += dt*2.5 while hit, cools at dt*1.2 otherwise, so
 * the tint fades ~0.8 s after the beam leaves). Tracked in a small reused
 * active-index array (cap 24 — mining hits one rock at a time). Under
 * ctx.settings.reducedMotion the animated lerp is skipped but a static
 * bright tint is still applied while hot: the feedback survives, the motion
 * does not. Depletion darkens as before and, unless reducedMotion is set,
 * collapses over ~0.4 s with a quadratic ease-out instead of snapping.
 *
 * Ownership: writes ctx.asteroids = { list } (combat.js raycasts its mining
 * beam against list entries { id, position, radius, ore, commodity, oreKey,
 * hardness }); consumes 'mineHit' events from ctx.lastEvents; spawns ore
 * pods via spawnPod. Never touches ctx.input, ctx.ship, ctx.camera.
 *
 * Perf: zero per-frame allocations. Tumble matrices are recomputed for a
 * round-robin subset of the FLAT rock array each frame using module-scope
 * scratch objects; each touched rock writes its own mesh's slot and the
 * mesh is marked instanceMatrix-dirty once per frame via a reused array.
 */

const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();
const _podPos = new THREE.Vector3();
const _drift = new THREE.Vector3();

// Heat-glow bookkeeping cap: mining hits one rock at a time, so 24 listed
// rocks is generous headroom for beam flicker across overlapping frames.
const HEAT_CAP = 24;
const ORBIT_K = 1500; // local copy of solarsystem Kepler constant; do not import
const KEEP_TRIES = 8;
const WORK_HALF = 0.7;
const TUMBLE_RANGE2 = 1200 * 1200; // 1.5 * ENCOUNTER_BUBBLE; skip far spin only
const FIELD_KINDS = { belt: true, sparse: true, cloud: true };
// Mirrors solarsystem.js SLOTS (not exported). Keep-out uses live count via PLANET_SLOT_COUNT.
const PLANET_SLOTS = [
  { radius: 9, orbitRadius: 250 },
  { radius: 14, orbitRadius: 420 },
  { radius: 16, orbitRadius: 640 },
  { radius: 12, orbitRadius: 920 },
  { radius: 30, orbitRadius: 1400 },
];
const _keepOut = { hit: false, nx: 0, ny: 1, nz: 0, overlap: 0 };

function kindFromDef(def) {
  const k = def && def.field && def.field.kind;
  if (typeof k === 'string' && Object.hasOwn(FIELD_KINDS, k)) return k;
  const band = def && def.band != null ? def.band : 0;
  if (band <= 1) return 'belt';
  if (band === 2) return 'sparse';
  return 'cloud';
}

function writeOrbitPose(pos, r, inc, node, phase0, omega, y0, time) {
  const phase = phase0 + omega * time;
  const cP = Math.cos(phase);
  const sP = Math.sin(phase);
  const cN = Math.cos(node);
  const sN = Math.sin(node);
  const cI = Math.cos(inc);
  const sI = Math.sin(inc);
  pos.x = r * cP * cN - r * sP * cI * sN;
  pos.z = r * cP * sN + r * sP * cI * cN;
  pos.y = r * sP * sI + y0;
}

function omegaForR(r) {
  if (!(r > 0)) return 0;
  return ORBIT_K * r ** -1.5;
}

// Deterministic RNG (mulberry32, same pattern as solarsystem.js) so the
// field layout is stable run-to-run and per system seed.
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// PolyhedronGeometry is non-indexed: verts = faces × (detail+1)² × 3.
// One geometry is shared by a whole ore InstancedMesh, so its vertex
// count is paid ONCE at build time — 130 instances reuse the same
// 1500-vert geometry, the per-frame cost is the instancing pipeline,
// not the vertex count. The default budget stays at the Wave 51 ~400
// (icosa caps at detail 1 = 240, octa at detail 3 = 384) so legacy
// shapes keep their exact vertices; the lumpy crater path opts into
// 1600, letting icosa detail 4 (20×(4+1)²×3 = 1500) through — the
// silhouette must carry crater bowls and rim notches, and detail 3's
// 960 verts left the bowls too shallow to read.
function polyDetail(faces, detail, budget = 400) {
  let d = detail;
  while (d > 1 && faces * (d + 1) * (d + 1) * 3 > budget) d--;
  return d;
}

// Integer-lattice hash → [0,1). Pure bitwise ops (no Math.sin hashing),
// so the noise field is deterministic across runs and platforms.
function hash3(ix, iy, iz) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Tiny 3D value noise: lattice hashes trilinearly interpolated with
// smoothstep weights (first derivative dies at cell boundaries, so the
// displaced surface has no visible grid seams). Returns [0,1).
function valueNoise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const sz = fz * fz * (3 - 2 * fz);
  const c000 = hash3(ix, iy, iz), c100 = hash3(ix + 1, iy, iz);
  const c010 = hash3(ix, iy + 1, iz), c110 = hash3(ix + 1, iy + 1, iz);
  const c001 = hash3(ix, iy, iz + 1), c101 = hash3(ix + 1, iy, iz + 1);
  const c011 = hash3(ix, iy + 1, iz + 1), c111 = hash3(ix + 1, iy + 1, iz + 1);
  const x00 = c000 + (c100 - c000) * sx;
  const x10 = c010 + (c110 - c010) * sx;
  const x01 = c001 + (c101 - c001) * sx;
  const x11 = c011 + (c111 - c011) * sx;
  const y0 = x00 + (x10 - x00) * sy;
  const y1 = x01 + (x11 - x01) * sy;
  return y0 + (y1 - y0) * sz;
}

// PolyhedronGeometry is non-indexed (vertices duplicated per face), so a
// plain computeVertexNormals leaves per-face facet normals. Averaging the
// normals of vertices that share a position welds the duplicates: the
// rock reads smooth and the fine detail is left to the fragment-shader
// bump (rock-surface.js). Build-time only; the lumpy path opts in via
// userData.smoothNormals, other shapes keep their exact facet normals.
function weldRockNormals(geo) {
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const byPos = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = pos.getX(i).toFixed(5) + ',' + pos.getY(i).toFixed(5) + ',' + pos.getZ(i).toFixed(5);
    let e = byPos.get(key);
    if (!e) { e = { x: 0, y: 0, z: 0, idx: [] }; byPos.set(key, e); }
    e.x += norm.getX(i); e.y += norm.getY(i); e.z += norm.getZ(i);
    e.idx.push(i);
  }
  for (const e of byPos.values()) {
    const l = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z) || 1;
    for (const i of e.idx) norm.setXYZ(i, e.x / l, e.y / l, e.z / l);
  }
}

/**
 * Real-rock silhouette for the Wave 52 rawOre pilot. Starts from a unit
 * icosahedron and displaces every vertex along its own direction by the
 * SUM of three mechanisms, then clamps to the [0.55, 1.30] radial
 * contract (the mining raycast treats rock.radius as a sphere, so no
 * vertex may exceed 1.30):
 *
 *  LOBES — 4 low-frequency sine/cosine terms of the direction
 *  (amplitude ~0.22-0.28 total) make the body non-convex and
 *  asymmetric, so the silhouette reads as a broken rock, never a
 *  wobbled ball. The fourth term mixes all three components into one
 *  oblique argument, so the field has NO mirror symmetry about any
 *  axis plane.
 *
 *  fBm — 4 octaves of valueNoise3 sampled on the unit direction
 *  (amplitudes 0.20 / 0.10 / 0.05 / 0.025, frequencies
 *  2.1 / 4.3 / 9.1 / 18.7) supply the mid- and small-scale lumps.
 *  profile.wobble [min,max] maps to an overall amplitude scale
 *  (mid = base radius, (max-min)/0.4 = amplitude multiplier), so the
 *  profile keeps its Wave 51 meaning.
 *
 *  CRATERS — only when profile.craters exists: `count` bowls carved by
 *  angular distance from random surface points. Bowl depth SCALES with
 *  the crater's own angular radius (0.24 rad reference): a large
 *  crater is a real basin whose floor sits at ~0.60-0.70 of the local
 *  undisplaced radius, a small one stays a shallow pit. Each rim is a
 *  narrow raised ridge (gaussian peaked at 0.92 of the crater's
 *  angular radius, half-width ~0.135 of it) so the silhouette shows
 *  notches. All crater deltas on a vertex are summed, then CLAMPED to
 *  [-0.42, +0.14] before applying, so overlapping craters deepen a
 *  basin a little but can never stack into a spike or a through-hole.
 *  When `count` >= 4, 2-3 extra SMALL craters (drawn fractions of the
 *  already-drawn radii) are added — real asteroids are cratered at
 *  several scales.
 *
 * ALL rng draws happen up front (noise offset, lobe phases/amplitudes,
 * crater centres/radii, small-crater count/centres/fractions), so the
 * vertex loop draws nothing and vertex order can never change the draw
 * count for a given seed.
 */
function makeLumpyRock(rng, profile) {
  const [wMin, wMax] = profile.wobble;
  const mid = (wMin + wMax) * 0.5;
  const amp = (wMax - wMin) / 0.4; // wobble [0.80,1.20] == full swing

  // Depth/rim normalisation: a crater whose angular radius equals this
  // reference bites exactly profile.craters.depth of the local radius.
  // 0.19 rad sits at the small end of typical radius bands, so the
  // largest drawn craters reach ~2.3× depth — a floor near 0.60-0.65
  // of the local radius, a genuine basin — while the smallest stay
  // shallow.
  const CRATER_DEPTH_REF = 0.19;
  // Combined crater contribution per vertex, clamped before applying:
  // overlaps may deepen a basin slightly and rims may stack onto one
  // ridge, but never into spikes or through-holes.
  const CRATER_CLAMP_LO = -0.46, CRATER_CLAMP_HI = 0.14;

  // --- every rng draw for this geometry, in fixed order ---
  const ox = rng() * 64, oy = rng() * 64, oz = rng() * 64; // noise offset
  const p1 = rng() * Math.PI * 2, p2 = rng() * Math.PI * 2, p3 = rng() * Math.PI * 2;
  const p4 = rng() * Math.PI * 2;
  const a1 = 0.06 + rng() * 0.02, a2 = 0.06 + rng() * 0.02;
  const a3 = 0.05 + rng() * 0.02, a4 = 0.05 + rng() * 0.02; // total 0.22..0.28
  const craterCfg = profile.craters;
  let craters = null;
  if (craterCfg) {
    craters = [];
    const [rMin, rMax] = craterCfg.radius;
    for (let c = 0; c < craterCfg.count; c++) {
      // uniform direction on the sphere: z uniform in [-1,1], theta uniform
      const cz = rng() * 2 - 1;
      const ct = rng() * Math.PI * 2;
      const cs = Math.sqrt(1 - cz * cz);
      const rad = rMin + rng() * (rMax - rMin); // angular radius, radians
      craters.push({
        x: cs * Math.cos(ct), y: cs * Math.sin(ct), z: cz,
        rad, cosCut: Math.cos(rad * 1.45), // skip verts beyond rim falloff
      });
    }
    // Small-scale cratering: with at least 4 profile craters, add 2-3
    // pits whose radii are drawn fractions of the main radii, so the
    // body carries impacts at more than one scale.
    if (craterCfg.count >= 4) {
      const extra = 2 + Math.floor(rng() * 2);
      for (let c = 0; c < extra; c++) {
        const cz = rng() * 2 - 1;
        const ct = rng() * Math.PI * 2;
        const cs = Math.sqrt(1 - cz * cz);
        const frac = 0.30 + rng() * 0.25; // fraction of a drawn radius
        const rad = craters[c % craterCfg.count].rad * frac;
        craters.push({
          x: cs * Math.cos(ct), y: cs * Math.sin(ct), z: cz,
          rad, cosCut: Math.cos(rad * 1.45),
        });
      }
    }
  }
  // --- no rng below this line ---

  // Cratered rock needs a silhouette that can resolve bowls and rim
  // notches: request one subdivision ABOVE the profile (detail 3 -> 4,
  // 20×(4+1)²×3 = 1500 verts). The geometry is built once and shared
  // by the ore's whole InstancedMesh, so the extra verts are paid once
  // at build time, never per instance or per frame.
  const geo = new THREE.IcosahedronGeometry(1, polyDetail(20, Math.max(4, profile.detail + 1), 1600));
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    const dx = x / len, dy = y / len, dz = z / len;
    const lobe = a1 * Math.sin(2.1 * dx + p1)
      + a2 * Math.cos(1.7 * dy + p2)
      + a3 * Math.sin(1.3 * dz + 0.9 * dx + p3)
      + a4 * Math.sin(2.3 * (0.7 * dx - 0.6 * dy + 0.4 * dz) + p4);
    const fbm = 0.20 * (valueNoise3(dx * 2.1 + ox, dy * 2.1 + oy, dz * 2.1 + oz) * 2 - 1)
      + 0.10 * (valueNoise3(dx * 4.3 + ox, dy * 4.3 + oy, dz * 4.3 + oz) * 2 - 1)
      + 0.05 * (valueNoise3(dx * 9.1 + ox, dy * 9.1 + oy, dz * 9.1 + oz) * 2 - 1)
      + 0.025 * (valueNoise3(dx * 18.7 + ox, dy * 18.7 + oy, dz * 18.7 + oz) * 2 - 1);
    let r = mid + amp * (lobe + fbm);
    if (craters) {
      let delta = 0; // combined crater contribution, clamped below
      for (const c of craters) {
        const dot = dx * c.x + dy * c.y + dz * c.z;
        if (dot <= c.cosCut) continue;
        const ang = Math.acos(dot > 1 ? 1 : dot);
        const t = ang / c.rad; // 0 at centre, 1 at the crater edge
        // Bowl depth measured against the crater's own angular radius,
        // so a wide crater is a deep basin, not a wide shallow dent.
        const bite = craterCfg.depth * c.rad / CRATER_DEPTH_REF;
        if (t < 1) delta -= bite * (0.5 + 0.5 * Math.cos(Math.PI * t));
        // Rim: narrow gaussian ridge peaked at 0.92 of the radius,
        // half-width ~0.135 of it, height scaled like the bowl so big
        // craters notch the silhouette.
        const g = (t - 0.92) / 0.135;
        delta += craterCfg.rim * (c.rad / CRATER_DEPTH_REF) * Math.exp(-g * g);
      }
      if (delta < CRATER_CLAMP_LO) delta = CRATER_CLAMP_LO;
      else if (delta > CRATER_CLAMP_HI) delta = CRATER_CLAMP_HI;
      r += delta;
    }
    if (r > 1.30) r = 1.30; else if (r < 0.55) r = 0.55; // raycast contract
    let vx = dx * r, vy = dy * r, vz = dz * r;
    // The radial clamp alone cannot honour the [0.55, 1.30] bounding
    // contract exactly: |d| drifts a few ulps from 1 when normalising,
    // and the position attribute is Float32, whose cast can shift a
    // component ~6e-8. Re-measure the vector actually written and pull
    // it inside the bound with enough margin (~2e-7) that the float32
    // cast cannot push the stored length back outside.
    const h = Math.hypot(vx, vy, vz);
    if (h > 1.30) {
      const s = (1.30 - 2e-7) / h;
      vx *= s; vy *= s; vz *= s;
    } else if (h < 0.55) {
      const s = (0.55 + 2e-7) / h;
      vx *= s; vy *= s; vz *= s;
    }
    pos.setXYZ(i, vx, vy, vz);
  }
  geo.userData.smoothNormals = true; // shared tail welds facet normals
  return geo;
}

/**
 * Grown-body silhouette for the bloom ores (livingRock, wakeglass). A
 * bloom rock is not a broken stone: it ACCRETED, so the body is a fused
 * cluster of growth lobes with grooves where they met, and NO impact
 * craters — a grown surface heals, or was never solid enough to keep
 * one. Built once per ore and shared by the whole InstancedMesh.
 *
 * LOBES — 4-6 bulges, each a gaussian in angular distance around a
 * drawn surface direction: angular width 0.45-0.85 rad and height
 * 0.22-0.40 of the unit radius. Centres are drawn with REJECTION
 * SPACING: a candidate centre that lands within ~0.6 rad of an
 * already-accepted one is redrawn, up to a FIXED attempt count (the
 * last candidate stands if every attempt is crowded), so neighbouring
 * bulges can no longer fuse back into a featureless ball. The summed
 * displacement's analytic sphere mean (~height x width^2/4 per lobe)
 * is subtracted so the body stays centred on mid: high-amplitude
 * profiles keep the variance they were drawn to carry instead of
 * clamping their crests flat at 1.30.
 *
 * SEAMS — where the two STRONGEST lobe contributions at a vertex are
 * comparable, the fusion line reads as a groove: a crease of drawn
 * depth (0.06-0.10 of the radius at its floor, applied AFTER the
 * amplitude scale so both ores hit the same visual depth) gated by
 * exp(-((1 - weaker/stronger)/w)^2), so it cuts exactly on the seam
 * and dies inside either lobe. The gate width w GROWS as the weaker
 * contribution thins toward the base of the fusion, so the groove
 * opens into a fold low down instead of staying a uniform scratch,
 * and a final gate on the absolute weaker strength kills the crease
 * entirely where only one lobe is present.
 *
 * ASYMMETRY — one very-low-frequency sinusoid along a drawn axis (no
 * mirror symmetry survives) plus a mild anisotropic scale (axis ratios
 * within 0.85-1.0, largest normalised to exactly 1), so no view of
 * the body reads as a circle.
 *
 * SURFACE — 3 octaves of valueNoise3 at LOW amplitude (this skin is
 * smooth compared with stone): it breaks up the crests without adding
 * pits or facets.
 *
 * CRATERS — profile.craters is deliberately IGNORED: neither bloom ore
 * has one, and a cratered bloom would contradict the grown read. If a
 * bloom ore ever gains the field the shape still builds unchanged; the
 * recipe is simply never consulted here.
 *
 * BOUNDING — the anisotropic scale factor along the vertex direction
 * divides the clamp bounds, so the SCALED length honours the [0.50,
 * 1.30] radial contract exactly (0.05 below the lumpy stone floor: a
 * seam trough may dip further than broken rock, but the mining
 * raycast sphere still holds), then the float32-safe re-measure
 * makeLumpyRock uses, so the stored Float32 length can never land
 * outside the contract.
 *
 * SMOOTH NORMALS — geo.userData.smoothNormals opts into the shared
 * tail's weld: both bloom ores render with flatShading: false and let
 * the fragment bump carry the fine detail, so crisp facet normals
 * would only add glitter that fights the soft body. The drawn lobe
 * table is also published on geo.userData.bloom so the wave-52
 * silhouette checks can measure lobe/seam geometry without
 * re-deriving the rng stream; the renderer never reads it.
 *
 * ALL rng draws happen up front in a fixed-count block (noise offset,
 * lobe count, per-lobe direction attempts/width/height, asymmetry
 * axis/phase/amplitude, anisotropic ratios, seam depth): every lobe
 * direction attempt is drawn whether or not an earlier one was
 * accepted, so the vertex loop draws nothing and the draw count for a
 * given seed can never depend on the values drawn.
 */
function makeBloomRock(rng, profile) {
  const [wMin, wMax] = profile.wobble;
  const mid = (wMin + wMax) * 0.5;
  const amp = (wMax - wMin) / 0.4; // wobble [0.80,1.20] == full swing

  // Lobe-centre rejection spacing. A weak lobe is buried by a strong
  // neighbour's tail unless the centres sit far enough apart, so the
  // rejection distance GROWS with the pair's disparity instead of
  // staying a flat ~0.6 rad:
  //  A (height rule) — lobe i's contribution at j's centre must stay
  //     under 0.55 of j's own height: d >= w_i*sqrt(ln(h_i/(0.55*h_j))).
  //  B (slope rule) — the tail SLOPE i exerts at j's centre must stay
  //     under 0.8 of j's maximum restoring slope (a gaussian's steepest
  //     self-gradient, ~0.857*h_j/w_j) MINUS the dipole's slope budget,
  //     so the background lean cannot help a neighbour flatten j:
  //     bisected on the far branch d >= w_i/sqrt(2), where tail slope
  //     falls monotonically.
  //  C (bridge rule) — d >= 1.30*max(w_i, w_j): the overlap discount
  //     below already shaves 30% off any shared region, and past this
  //     distance the discounted midpoint sum stays under both crests,
  //     so the pair cannot pour into one bridge maximum.
  // Both rules run in both directions per pair, floored at MIN_SEP and
  // capped at MAX_SEP (past the cap the spread goes too even and the
  // body loses variance). The attempt count is FIXED and every attempt
  // is drawn whether or not an earlier one passed, so the rng draw
  // count never depends on the values drawn; if no attempt clears
  // every accepted centre, the candidate with the LARGEST clearance
  // margin stands, so the lobe is never silently dropped and the
  // placement degrades gracefully.
  const MIN_SEP = 0.66;
  const MAX_SEP = 1.35;
  const DIRECTION_ATTEMPTS = 6;
  // Required separation of centre a from centre b (one direction of one
  // pair; the caller takes the max over both directions and all pairs).
  // dipoleSlope = the background lean's worst tangential slope, drawn
  // below but constant per geometry.
  let dipoleSlope = 0.15;
  const pairSep = (a, b) => {
    let need = MIN_SEP;
    const wMax = a.width > b.width ? a.width : b.width;
    if (1.30 * wMax > need) need = 1.30 * wMax;
    if (a.height > 0.55 * b.height) {
      const dA = a.width * Math.sqrt(Math.log(a.height / (0.55 * b.height)));
      if (dA > need) need = dA;
    }
    const limit = Math.max(0.05, 0.686 * b.height / b.width - dipoleSlope);
    const d0 = a.width / Math.SQRT2; // steepest point of a's tail
    const slope = (d) => a.height * Math.exp(-(d / a.width) * (d / a.width)) * 2 * d / (a.width * a.width);
    if (slope(d0) > limit) {
      let lo = d0, hi = Math.PI; // slope(lo) > limit >= slope(hi)
      for (let it = 0; it < 24; it++) {
        const m = 0.5 * (lo + hi);
        if (slope(m) > limit) lo = m; else hi = m;
      }
      if (hi > need) need = hi;
    }
    return need > MAX_SEP ? MAX_SEP : need;
  };

  // --- every rng draw for this geometry, in fixed order ---
  const ox = rng() * 64, oy = rng() * 64, oz = rng() * 64; // noise offset
  const lobeCount = 4 + Math.floor(rng() * 3); // 4..6 growth lobes
  // Asymmetry: a LINEAR dipole along a drawn axis, not a sinusoid. Its
  // tangential slope is the same everywhere, so it never grows a local
  // maximum of its own out on a plain — its single crest sits exactly
  // at the axis pole, and the FIRST lobe is planted on it below. The
  // axis hugs the anisotropy frame's LONG axis (x, ratio 1.0) with a
  // small drawn tilt: the term reinforces the largest principal extent
  // instead of fighting it, and no mirror symmetry survives.
  const ty = 0.3 * (rng() - 0.5), tz = 0.3 * (rng() - 0.5);
  const al = Math.sqrt(1 + ty * ty + tz * tz);
  const asym = { x: 1 / al, y: ty / al, z: tz / al, amp: 0.20 + rng() * 0.06 };
  dipoleSlope = asym.amp; // the spacing rule budgets against this lean
  // Anisotropic scale: mild, largest ratio exactly 1 so the 1.30
  // bounding contract keeps its full headroom, and the smallest ratio
  // hugs 0.85 so the principal extents can never collapse to a circle.
  const scaleX = 1.0;
  const scaleY = 0.85 + rng() * 0.13;
  const scaleZ = 0.85 + rng() * 0.03;
  // Seam crease depth in RADIUS units (applied after the amplitude
  // scale): 0.06-0.10 of the body radius at the groove floor, deep
  // enough to read as a fold in silhouette.
  const seamDepth = 0.06 + rng() * 0.04;
  const lobes = [];
  for (let l = 0; l < lobeCount; l++) {
    // Width skews NARROW (u*u) inside the 0.45-0.85 band: a narrow
    // bulge keeps a steeper restoring slope, so neighbours and the
    // dipole background cannot flatten its crest, and the peak-to-plain
    // contrast carries the body's variance. Height draws full range.
    // Both draw BEFORE the direction: the spacing rule needs the
    // candidate's own shape to judge crowding.
    const wu = rng();
    const width = 0.45 + 0.40 * wu * wu;   // angular width, radians
    // The planted crest lobe draws from the TOP of the height band: one
    // dominant growth centre anchors the body's lean and variance.
    // Other lobes skew LOW inside the band for peak-to-peak contrast,
    // but a wide lobe is never allowed to be weak: the width-correlated
    // floor keeps every lobe's restoring slope (~0.857*h/w) above the
    // dipole's lean, so no crest can be flattened by the background.
    const v = rng();
    const wideFloor = 0.22 + 0.13 * (width - 0.45) / 0.40;
    let height = l === 0 ? 0.32 + 0.08 * v : 0.22 + 0.18 * v * v;
    if (height < wideFloor) height = wideFloor;
    if (l === 0) {
      // First lobe planted at the dipole crest (+asym axis) with a
      // small drawn offset: the background's only maximum always
      // coincides with a real lobe instead of growing a phantom bump
      // out on a plain.
      const oa = rng() * Math.PI * 2;
      const orad = 0.25 * rng();
      // tangent frame around the asym axis (deterministic, no draws)
      let ux = -asym.y, uy = asym.x, uz = 0;
      const ul = Math.sqrt(ux * ux + uy * uy) || 1;
      ux /= ul; uy /= ul;
      const vx = asym.y * 0 - asym.z * uy, vy = asym.z * ux - asym.x * 0, vz = asym.x * uy - asym.y * ux;
      const ox2 = orad * Math.cos(oa), oy2 = orad * Math.sin(oa);
      let dx0 = asym.x + ox2 * ux + oy2 * vx;
      let dy0 = asym.y + ox2 * uy + oy2 * vy;
      let dz0 = asym.z + ox2 * uz + oy2 * vz;
      const dl = Math.sqrt(dx0 * dx0 + dy0 * dy0 + dz0 * dz0) || 1;
      lobes.push({ x: dx0 / dl, y: dy0 / dl, z: dz0 / dl, width, height });
      continue;
    }
    // uniform direction on the sphere: z uniform in [-1,1], theta uniform
    let bx = 0, by = 0, bz = 1, bMargin = -1e9;
    for (let a = 0; a < DIRECTION_ATTEMPTS; a++) {
      const lz = rng() * 2 - 1;
      const lt = rng() * Math.PI * 2;
      const ls = Math.sqrt(1 - lz * lz);
      const cx = ls * Math.cos(lt), cy = ls * Math.sin(lt), cz = lz;
      let margin = 1e9;
      for (const o of lobes) {
        const dot = cx * o.x + cy * o.y + cz * o.z;
        const d = Math.acos(dot > 1 ? 1 : dot < -1 ? -1 : dot);
        const req = Math.max(pairSep(o, { width, height }), pairSep({ width, height }, o));
        if (d - req < margin) margin = d - req;
      }
      // Rule D (lean exposure): the dipole's tangential slope peaks at
      // 90 degrees from its axis, and the anisotropic squash damps a
      // lobe's own restoring slope by the local scale factor. A
      // candidate whose crest cannot hold against the lean plus a
      // noise budget is rejected toward the dipole's poles, where the
      // lean has no tangential pull.
      const kx = cy * asym.z - cz * asym.y, ky = cz * asym.x - cx * asym.z, kz = cx * asym.y - cy * asym.x;
      const sinTheta = Math.sqrt(kx * kx + ky * ky + kz * kz);
      const ex = cx * scaleX, ey = cy * scaleY, ez = cz * scaleZ;
      const damp = Math.sqrt(ex * ex + ey * ey + ez * ez);
      const mD = (0.857 * height / width * damp - dipoleSlope * sinTheta - 0.10) * 2;
      if (mD < margin) margin = mD;
      if (margin >= 0) { bx = cx; by = cy; bz = cz; bMargin = margin; break; }
      if (margin > bMargin) { bx = cx; by = cy; bz = cz; bMargin = margin; }
    }
    lobes.push({ x: bx, y: by, z: bz, width, height });
  }
  // Analytic mean of the lobe field over the sphere: a gaussian bulge of
  // angular width w and height h averages ~h*w^2/4 over the whole
  // surface. Subtracting it CENTRES the displacement on mid, so
  // high-amplitude profiles (wakeglass) do not push the lobe crests
  // into the 1.30 clamp and flatten the silhouette variance they were
  // drawn to carry.
  let lobeMean = 0, lobeHMax = 0;
  for (const l of lobes) {
    lobeMean += l.height * l.width * l.width * 0.25;
    if (l.height > lobeHMax) lobeHMax = l.height;
  }
  // --- no rng below this line ---

  // A grown body needs enough silhouette resolution to carry the lobe
  // bulges and seam grooves: same subdivision contract as the lumpy
  // path — request one subdivision ABOVE the profile (detail 3 -> 4,
  // 20x(4+1)^2x3 = 1500 verts), paid once at build time and shared by
  // the ore's whole InstancedMesh, never per instance or per frame.
  const geo = new THREE.IcosahedronGeometry(1, polyDetail(20, Math.max(4, profile.detail + 1), 1600));
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    const dx = x / len, dy = y / len, dz = z / len;
    // Lobe sum plus the THREE strongest contributions (s1 >= s2 >= s3)
    // the seam crease below is gated on.
    let lobeSum = 0, s1 = 0, s2 = 0, s3 = 0;
    for (const l of lobes) {
      const dot = dx * l.x + dy * l.y + dz * l.z;
      const ang = Math.acos(dot > 1 ? 1 : dot < -1 ? -1 : dot);
      const t = ang / l.width; // 0 at the lobe axis, 1 at its edge
      const c = l.height * Math.exp(-t * t);
      lobeSum += c;
      if (c > s1) { s3 = s2; s2 = s1; s1 = c; }
      else if (c > s2) { s3 = s2; s2 = c; }
      else if (c > s3) s3 = c;
    }
    // Seam: two parts. (1) An OVERLAP DISCOUNT proportional to the
    // second-plus-third strongest lobe contributions: wherever two or
    // three bulges occupy the same surface, the fusion is cheaper than
    // the sum, which digs the fold lines and stops three tails from
    // piling into a phantom dome between lobes. It scales with the
    // overlap, so lone-lobe plains pay nothing. (2) A NARROW groove
    // gated by the balance of the two strongest contributions: it cuts
    // deepest exactly where they meet at equal strength and vanishes
    // inside either lobe; the gate width grows as the weaker
    // contribution thins toward the base of the fusion (fold, not
    // scratch), and the absolute-strength gate removes it where only
    // one lobe is present at all.
    let seam = 0;
    if (s2 > 1e-4) {
      const ratio = s2 / s1;
      const base = 1 - Math.min(1, s2 / lobeHMax); // 0 at strong fusion, 1 at the base
      const wBal = 0.16 * (1 + 1.3 * base);
      const g = (1 - ratio) / wBal;
      seam = -(amp * 0.45 * (s2 + s3) + seamDepth * Math.exp(-g * g) * (s2 / (s2 + 0.02)));
    }
    // Smooth skin: 3 LOW-amplitude octaves, all at cell sizes under
    // 0.3 rad, so the texture breaks up crests without growing bumps
    // big enough to read as extra lobes.
    const fbm = 0.009 * (valueNoise3(dx * 3.9 + ox, dy * 3.9 + oy, dz * 3.9 + oz) * 2 - 1)
      + 0.010 * (valueNoise3(dx * 7.3 + ox, dy * 7.3 + oy, dz * 7.3 + oz) * 2 - 1)
      + 0.005 * (valueNoise3(dx * 12.1 + ox, dy * 12.1 + oy, dz * 12.1 + oz) * 2 - 1);
    // Dipole: constant-slope lean along the drawn axis; its only crest
    // is the pole, where lobe 0 was planted.
    const asymTerm = asym.amp * (dx * asym.x + dy * asym.y + dz * asym.z);
    let r = mid + amp * (lobeSum - lobeMean + fbm + asymTerm);
    // Anisotropic scale: the clamp bounds are divided by the local
    // scale factor |S*d|, so the SCALED length honours the radial
    // contract exactly instead of drifting under the squash.
    const sx = dx * scaleX, sy = dy * scaleY, sz = dz * scaleZ;
    const sd = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
    const rHi = 1.30 / sd, rLo = 0.50 / sd; // raycast contract
    // Soft knee at the TOP bound, applied BEFORE the seam: a hard clamp
    // would plane every overshooting crest into a flat plateau (a
    // plateau's rim reads as several maxima instead of one lobe), and a
    // knee over the seam would compress the groove depth away exactly
    // where the body is tallest. The knee is C1 at the join and
    // strictly monotonic, so crests keep their order and stay distinct
    // while never crossing the bound; the seam then cuts at full
    // depth. The floor keeps the hard clamp: trough plateaus are
    // minima and harmless.
    if (r > rHi - 0.12) {
      const over = r - (rHi - 0.12);
      r = rHi - 0.12 + 0.12 * over / (0.12 + over);
    }
    r += seam;
    if (r < rLo) r = rLo;
    let vx = sx * r, vy = sy * r, vz = sz * r;
    // Same float32-safe re-measure as makeLumpyRock: the radial clamp
    // alone cannot honour the [0.50, 1.30] bounding contract exactly —
    // |d| drifts a few ulps from 1 when normalising, and the position
    // attribute is Float32. Re-measure the vector actually written and
    // pull it inside the bound with ~2e-7 margin.
    const h = Math.hypot(vx, vy, vz);
    if (h > 1.30) {
      const s = (1.30 - 2e-7) / h;
      vx *= s; vy *= s; vz *= s;
    } else if (h < 0.50) {
      const s = (0.50 + 2e-7) / h;
      vx *= s; vy *= s; vz *= s;
    }
    pos.setXYZ(i, vx, vy, vz);
  }
  geo.userData.smoothNormals = true; // shared tail welds facet normals
  // Verification diagnostic (renderer never reads this): the drawn lobe
  // table lets the wave-52 silhouette checks measure lobe spacing and
  // seam depth straight from buildAsteroidModel output.
  geo.userData.bloom = { lobes };
  return geo;
}

/**
 * BLOCKY geometry (slagIron, voidPlatinum): a FRACTURED metal-rich body,
 * not a rounded die. The build starts from a subdivided box and layers
 * five mechanisms, all displaced analytically per vertex:
 *
 * 1. SPHERIFY BLEND (0.55-0.75, drawn per geometry): each vertex is
 *    lerped from its box position toward the sphere of radius `mid`
 *    (the wobble midpoint). Weaker than the legacy 0.7 for some seeds,
 *    so flat plate faces and hard box edges survive; stronger seeds
 *    round the silhouette without ever reaching a sphere.
 * 2. PER-PLATE OFFSETS: the six box faces are the body's armour plates.
 *    Each vertex's plate is the dominant axis of its direction; the
 *    whole plate is then shifted along its own outward axis by a drawn
 *    offset of ±0.06, so plates sit at slightly different depths and
 *    read as broken slabs rather than a smooth shell.
 * 3. ROUGHNESS: 3 octaves of valueNoise3 (weights 0.06/0.03/0.015,
 *    scaled by the wobble amplitude like makeLumpyRock) push vertices
 *    radially, giving the plates a cast-metal skin.
 * 4. CRATERS (when profile.craters exists — both blocky ores have one):
 *    the SAME angular-distance bowl+rim mathematics makeLumpyRock uses,
 *    copied locally: cosine-tapered bowls whose bite scales with the
 *    crater's angular radius against CRATER_DEPTH_REF, gaussian rims
 *    peaked at 0.92 of the radius, combined delta clamped to
 *    [CRATER_CLAMP_LO, CRATER_CLAMP_HI] so overlaps deepen a basin but
 *    never spike.
 * 5. CLEAVAGE PLANES (3-5, drawn up front): random unit normals with
 *    offsets in [0.30, 0.75]. Applied LAST among the shape terms, every
 *    vertex outside a plane is flattened onto it (strength 0.88-1.0),
 *    which cuts large flat fracture faces through plates, noise and
 *    crater rims alike. Where two planes meet the surface shows a sharp
 *    arris — the main fractured-metal read.
 *
 * Finally a non-uniform axis scale is baked in (never a cube) and every
 * vertex is clamped to the [0.40, 1.30] bounding contract (rock.radius
 * is the mining raycast sphere) using the float32-safe re-measure
 * pattern from makeLumpyRock: the position attribute is Float32, so the
 * written vector is re-measured and pulled ~2e-7 inside the bound.
 *
 * Vertex budget: BoxGeometry(1.6, 1.6, 1.6, 6, 6, 6) has 6×6 quads per
 * face × 6 faces × 2 triangles × 3 verts = 1296 non-indexed verts —
 * under the 1600 cap (s = 7 would be 1764), fine enough to resolve
 * crater bowls and cleavage arrises, paid once per ore InstancedMesh.
 *
 * ALL rng draws happen up front in a fixed-count block (noise offset,
 * spherify, plane count, per-plane normal/offset/strength, six plate
 * offsets, crater centres/radii, small-crater extras, axis scale), so
 * the vertex loop draws nothing and a seed always yields the same mesh.
 * The geometry stays FACETED on purpose: no userData.smoothNormals —
 * blocky wants crisp per-face normals under flatShading.
 */
function makeBlockyRock(rng, profile) {
  const [wMin, wMax] = profile.wobble;
  const mid = (wMin + wMax) * 0.5;
  const amp = (wMax - wMin) / 0.4; // wobble [0.80,1.20] == full swing

  // Same crater normalisation contract as makeLumpyRock: a crater whose
  // angular radius equals the reference bites exactly profile.craters.depth
  // of the local radius; the combined delta clamp permits overlap but
  // never spikes or through-holes.
  const CRATER_DEPTH_REF = 0.19;
  const CRATER_CLAMP_LO = -0.46, CRATER_CLAMP_HI = 0.14;

  // --- every rng draw for this geometry, in fixed order ---
  const ox = rng() * 64, oy = rng() * 64, oz = rng() * 64; // noise offset
  const spherify = 0.55 + rng() * 0.20; // keep flat plates and hard edges
  // Cleavage planes: uniform-direction unit normals (z uniform in
  // [-1,1], theta uniform), offset = plane distance from the origin,
  // flat = how far outside verts are pushed onto the plane.
  const planeCount = 3 + Math.floor(rng() * 3);
  const planes = [];
  for (let p = 0; p < planeCount; p++) {
    const pz = rng() * 2 - 1;
    const pt = rng() * Math.PI * 2;
    const ps = Math.sqrt(1 - pz * pz);
    planes.push({
      x: ps * Math.cos(pt), y: ps * Math.sin(pt), z: pz,
      off: 0.30 + rng() * 0.45,
      flat: 0.88 + rng() * 0.12,
    });
  }
  // One depth offset per armour plate (+x,-x,+y,-y,+z,-z), applied
  // along the plate's own outward axis.
  const plateOff = [];
  for (let p = 0; p < 6; p++) plateOff.push((rng() - 0.5) * 0.12);
  const craterCfg = profile.craters;
  let craters = null;
  if (craterCfg) {
    craters = [];
    const [rMin, rMax] = craterCfg.radius;
    for (let c = 0; c < craterCfg.count; c++) {
      // uniform direction on the sphere: z uniform in [-1,1], theta uniform
      const cz = rng() * 2 - 1;
      const ct = rng() * Math.PI * 2;
      const cs = Math.sqrt(1 - cz * cz);
      const rad = rMin + rng() * (rMax - rMin); // angular radius, radians
      craters.push({
        x: cs * Math.cos(ct), y: cs * Math.sin(ct), z: cz,
        rad, cosCut: Math.cos(rad * 1.45), // skip verts beyond rim falloff
      });
    }
    // Small-scale cratering: with at least 4 profile craters, add 2-3
    // pits whose radii are drawn fractions of the main radii (both
    // blocky ores qualify, so the fracture faces carry impact pits).
    if (craterCfg.count >= 4) {
      const extra = 2 + Math.floor(rng() * 2);
      for (let c = 0; c < extra; c++) {
        const cz = rng() * 2 - 1;
        const ct = rng() * Math.PI * 2;
        const cs = Math.sqrt(1 - cz * cz);
        const frac = 0.30 + rng() * 0.25; // fraction of a drawn radius
        const rad = craters[c % craterCfg.count].rad * frac;
        craters.push({
          x: cs * Math.cos(ct), y: cs * Math.sin(ct), z: cz,
          rad, cosCut: Math.cos(rad * 1.45),
        });
      }
    }
  }
  // Non-uniform axis scale (never a cube), same bands as the legacy slab.
  const sx = 1.05 + rng() * 0.5, sy = 0.55 + rng() * 0.3, sz = 0.8 + rng() * 0.4;
  // --- no rng below this line ---

  // 1296 non-indexed verts (see the header comment for the arithmetic).
  // Non-indexed from the start so the shared tail's computeVertexNormals
  // leaves crisp per-face normals — the fracture facets must read.
  const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6, 6, 6, 6).toNonIndexed();
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    const dx = x / len, dy = y / len, dz = z / len;
    // 1. Spherify: blend the box point toward the sphere of radius mid.
    let vx = x + (dx * mid - x) * spherify;
    let vy = y + (dy * mid - y) * spherify;
    let vz = z + (dz * mid - z) * spherify;
    // 2. Plate offset: dominant axis of the direction picks the plate;
    // shift along that axis (outward sign) so plates sit at own depths.
    const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
    let axis = 0, sgn = dx < 0 ? -1 : 1;
    if (ay > ax && ay >= az) { axis = 1; sgn = dy < 0 ? -1 : 1; }
    else if (az > ax && az > ay) { axis = 2; sgn = dz < 0 ? -1 : 1; }
    const po = plateOff[axis * 2 + (sgn < 0 ? 1 : 0)] * sgn;
    if (axis === 0) vx += po; else if (axis === 1) vy += po; else vz += po;
    // 3. Radial roughness: 3 octaves of value noise at moderate amplitude.
    const fbm = 0.06 * (valueNoise3(dx * 2.1 + ox, dy * 2.1 + oy, dz * 2.1 + oz) * 2 - 1)
      + 0.03 * (valueNoise3(dx * 4.3 + ox, dy * 4.3 + oy, dz * 4.3 + oz) * 2 - 1)
      + 0.015 * (valueNoise3(dx * 9.1 + ox, dy * 9.1 + oy, dz * 9.1 + oz) * 2 - 1);
    let radial = amp * fbm;
    // 4. Craters: local copy of makeLumpyRock's bowl+rim maths — cosine
    // bowls scaled by angular radius, narrow gaussian rims at 0.92 of
    // the radius, combined delta clamped before applying.
    if (craters) {
      let delta = 0; // combined crater contribution, clamped below
      for (const c of craters) {
        const dot = dx * c.x + dy * c.y + dz * c.z;
        if (dot <= c.cosCut) continue;
        const ang = Math.acos(dot > 1 ? 1 : dot);
        const t = ang / c.rad; // 0 at centre, 1 at the crater edge
        const bite = craterCfg.depth * c.rad / CRATER_DEPTH_REF;
        if (t < 1) delta -= bite * (0.5 + 0.5 * Math.cos(Math.PI * t));
        const g = (t - 0.92) / 0.135;
        delta += craterCfg.rim * (c.rad / CRATER_DEPTH_REF) * Math.exp(-g * g);
      }
      if (delta < CRATER_CLAMP_LO) delta = CRATER_CLAMP_LO;
      else if (delta > CRATER_CLAMP_HI) delta = CRATER_CLAMP_HI;
      radial += delta;
    }
    vx += dx * radial; vy += dy * radial; vz += dz * radial;
    // 5. Cleavage planes, applied last so they cut through every earlier
    // term: vertices outside a plane are flattened onto it, leaving a
    // large exact fracture face; plane pairs meet in sharp arrises.
    for (const pl of planes) {
      const t = vx * pl.x + vy * pl.y + vz * pl.z;
      if (t > pl.off) {
        const push = (t - pl.off) * pl.flat;
        vx -= pl.x * push; vy -= pl.y * push; vz -= pl.z * push;
      }
    }
    // Baked non-uniform axis scale (never a cube).
    vx *= sx; vy *= sy; vz *= sz;
    // Bounding contract, float32-safe: re-measure the vector actually
    // written and pull it ~2e-7 inside [0.40, 1.30] so the Float32 cast
    // cannot push the stored length back outside (see makeLumpyRock).
    const h = Math.hypot(vx, vy, vz);
    if (h > 1.30) {
      const sc = (1.30 - 2e-7) / h;
      vx *= sc; vy *= sc; vz *= sc;
    } else if (h < 0.40) {
      const sc = (0.40 + 2e-7) / h;
      vx *= sc; vy *= sc; vz *= sc;
    }
    pos.setXYZ(i, vx, vy, vz);
  }
  // Faceted on purpose: userData.smoothNormals stays unset, so the
  // shared tail welds nothing and flatShading reads the arrises.
  return geo;
}

/**
 * CRYSTAL geometry (chromeSalt): a salt-crystal ASTEROID — a rocky core
 * whose surface is crowded with short, blocky crystal growth, merged into
 * ONE non-indexed geometry (the ore's InstancedMesh takes exactly one
 * geometry and one material, so there are no groups and no second
 * material). The Wave 51 cluster read as a caltrop — 5-9 needle prisms
 * up to 1.25 long on a 0.45-0.6 core — so the proportions are rebuilt
 * around a dominant body. Three mechanisms:
 *
 *  CORE — a low-detail icosahedron (detail 1) displaced by 2 octaves of
 *  valueNoise3 at radius ~0.78-0.82 (drawn base radius modulated
 *  0.95-1.05 of itself). The core holds the median vertex (measured
 *  0.73-0.92 of the 1.26 bounding radius on seeds 1-5), so the BODY
 *  owns the silhouette and the prisms read as growth on it, not as
 *  the rock.
 *
 *  PRISMS — 12-20 stubby columns crowded over the whole sphere, in two
 *  tiers. The review gate (only 4-20% of vertices may exceed 1.05 =
 *  0.833 of the 1.26 bounding radius, while the median vertex must sit
 *  ≥ 0.72) forces a clean radial split, so lengths are not one band:
 *  2-3 TALL prisms (the first tallCount slots, spread apart by the
 *  golden spiral) stand on a drawn ABSOLUTE tip radius of 1.32-1.38
 *  with narrow blunt tips (base 0.14-0.17, taper 0.50-0.75), and the
 *  rest form a STUBBLE reaching 0.18-0.21 past the core with thick
 *  bases (0.14-0.30) and tip radius clamped ≤ 0.16 so no stubble
 *  vertex can stray into the tall tier. Growth directions come from the
 *  golden-spiral sweep (phase drawn once) plus a drawn per-prism
 *  jitter, and each column TILTS 0-8 degrees off its surface normal
 *  (drawn angle + azimuth) so the cluster never reads as a hedgehog of
 *  radial spikes; neighbours may interpenetrate. Every tip ring
 *  carries a FLAT polygon cap (a salt-crystal facet) instead of the
 *  old pinch-to-a-point needle, and each column is translated along
 *  its TILTED axis so the cap face lands exactly on its drawn radius.
 *  The base is sunk 0.06-0.16 into the core, so no bottom cap is ever
 *  visible and none is built.
 *
 *  MERGE — every part is made non-indexed and stripped to position-only
 *  (the shared computeVertexNormals tail rebuilds the normals, which
 *  also keeps the crystal FACETS crisp), then concatenated with
 *  BufferGeometryUtils.mergeGeometries.
 *
 *  VERTEX ARITHMETIC — core icosa detail 1: 20 × (1+1)² × 3 = 240.
 *  Each prism contributes sides quads × 2 triangles × 3 verts for the
 *  open column (sides × 6) plus a sides-triangle cap fan (sides × 3),
 *  i.e. 36 (square) to 54 (hex). Range: 240 + 12 × 36 = 672 up to
 *  240 + 20 × 54 = 1320 — inside the 1600-vert opt-in budget, paid once
 *  at build time and shared by the ore's whole InstancedMesh.
 *
 *  BOUNDING CONTRACT — after the merge the whole cluster is normalised
 *  so the furthest vertex (always a prism tip) lands at 1.26, then
 *  every vertex is re-measured with Math.hypot and pulled into
 *  [0.40 + 2e-7, 1.30 - 2e-7] exactly as makeLumpyRock does, so the
 *  float32 position cast can never push a stored length outside the
 *  mining-raycast sphere contract (rock.radius). No vertex should ever
 *  land below 0.40 (prism bases stop at coreR - embed ≥ 0.62), but the
 *  floor clamp stays as the cheap guarantee.
 *
 * ALL rng draws happen up front in one fixed-order block (3 core noise
 * offsets + core radius; prism count, spiral phase, tall count; then 10
 * draws per prism), so the vertex loops draw nothing and a seed always
 * reproduces the same draw count and the same position bytes.
 */
function makeCrystalRock(rng, profile) {
  // --- every rng draw for this geometry, in fixed order ---
  const ox = rng() * 64, oy = rng() * 64, oz = rng() * 64; // core noise offset
  const coreR = 0.78 + rng() * 0.04; // core base radius — the body dominates
  const prismCount = 12 + Math.floor(rng() * 9); // 12..20 prisms
  const phase = rng() * Math.PI * 2; // golden-spiral phase
  const tallCount = 2 + Math.floor(rng() * 2); // 2..3 prisms stand taller
  const prisms = [];
  for (let p = 0; p < prismCount; p++) {
    const dz = (rng() - 0.5) * 0.36; // jitter off the spiral latitude
    const dtheta = (rng() - 0.5) * 0.7; // jitter around the spiral
    const sides = rng() < 0.5 ? 4 : 6; // square or hexagonal section
    const reach = rng(), rBaseD = rng(), taperD = rng();
    const embed = 0.06 + rng() * 0.10; // base sunk this far into the core
    const twist = rng() * Math.PI * 2; // section roll about the growth axis
    const tilt = rng() * 0.14; // 0..~8 degrees off the surface normal
    const tiltAz = rng() * Math.PI * 2; // azimuth of that tilt
    // Two tiers, both bands drawn every pass so the draw count stays
    // fixed. The first tallCount prisms (spread apart by the golden
    // spiral) stand on a drawn ABSOLUTE tip radius of 1.32-1.38, so the
    // cluster's normalisation always leaves them as the few far tips;
    // the rest form a 0.18-0.21 stubble just past the core whose tip
    // rings are clamped narrow enough (tip radius ≤ 0.16) that no
    // stubble vert can reach the tall tier — many small tips, no hero
    // spikes. Tips stay within ~0.18-0.6 of the core surface.
    const tall = p < tallCount;
    const rBase = tall ? 0.14 + 0.03 * rBaseD : 0.14 + 0.16 * rBaseD;
    const taper = tall
      ? 0.50 + 0.20 * taperD
      : Math.min(0.45 + 0.40 * taperD, 0.16 / rBase);
    const tipDist = tall ? 1.32 + 0.06 * reach : coreR + 0.18 + 0.03 * reach * reach;
    prisms.push({ dz, dtheta, sides, tipDist, rBase, taper, embed, twist, tilt, tiltAz });
  }
  // --- no rng below this line ---

  const parts = [];

  // Core: unit icosa detail 1 (240 verts), displaced radially by 2
  // octaves of valueNoise3 on the unit direction, radius ~0.86-0.98.
  const core = new THREE.IcosahedronGeometry(1, 1);
  const cpos = core.attributes.position;
  for (let i = 0; i < cpos.count; i++) {
    const x = cpos.getX(i), y = cpos.getY(i), z = cpos.getZ(i);
    const cl = Math.hypot(x, y, z) || 1;
    const ux = x / cl, uy = y / cl, uz = z / cl;
    const n = 0.65 * valueNoise3(ux * 2.3 + ox, uy * 2.3 + oy, uz * 2.3 + oz)
      + 0.35 * valueNoise3(ux * 5.1 + ox, uy * 5.1 + oy, uz * 5.1 + oz);
    const r = coreR * (0.95 + 0.10 * n);
    cpos.setXYZ(i, ux * r, uy * r, uz * r);
  }
  parts.push(core);

  // Prisms: golden-spiral growth directions (full-sphere coverage) plus
  // the drawn jitter. Each column is built along +Y with a hand-laid cap
  // fan closing the tip ring (a flat polygon face — salt crystals
  // terminate in facets, not points), rolled by its twist, tilted a few
  // degrees off the growth normal in the drawn azimuth, rotated onto its
  // direction and placed so the tip reaches `ext` past the core surface
  // while the base ring lies `embed` inside it.
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const UP = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const axis = new THREE.Vector3();
  const tiltAxis = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const tiltQuat = new THREE.Quaternion();
  for (let i = 0; i < prisms.length; i++) {
    const pr = prisms[i];
    let zz = 1 - 2 * (i + 0.5) / prisms.length + pr.dz;
    if (zz > 0.98) zz = 0.98; else if (zz < -0.98) zz = -0.98;
    const ss = Math.sqrt(1 - zz * zz);
    const th = phase + i * GOLDEN + pr.dtheta;
    dir.set(ss * Math.cos(th), ss * Math.sin(th), zz);
    // The column spans [coreR - embed, tipDist] along its tilted axis, so
    // the cap face lands exactly tipDist from the origin and the base
    // ring stays buried in the core.
    const baseD = coreR - pr.embed;
    const colLen = pr.tipDist - baseD;
    const tipR = pr.rBase * pr.taper;
    const tipY = colLen * 0.5;
    const col = new THREE.CylinderGeometry(tipR, pr.rBase, colLen, pr.sides, 1, true);
    // Flat cap fan over the tip ring. CylinderGeometry lays ring verts at
    // theta = 2*pi*j/sides with x = r*sin(theta), z = r*cos(theta); the
    // winding center -> ring[j] -> ring[j+1] faces +Y (outward).
    const cap = new Float32Array(pr.sides * 9);
    for (let j = 0; j < pr.sides; j++) {
      const a0 = (j / pr.sides) * Math.PI * 2;
      const a1 = ((j + 1) / pr.sides) * Math.PI * 2;
      const o = j * 9;
      cap[o] = 0; cap[o + 1] = tipY; cap[o + 2] = 0;
      cap[o + 3] = tipR * Math.sin(a0); cap[o + 4] = tipY; cap[o + 5] = tipR * Math.cos(a0);
      cap[o + 6] = tipR * Math.sin(a1); cap[o + 7] = tipY; cap[o + 8] = tipR * Math.cos(a1);
    }
    const capGeo = new THREE.BufferGeometry();
    capGeo.setAttribute('position', new THREE.BufferAttribute(cap, 3));
    col.rotateY(pr.twist);
    capGeo.rotateY(pr.twist);
    // Tilt in the column's local frame first (a few degrees off the
    // surface normal), then rotate onto the growth direction.
    quat.setFromUnitVectors(UP, dir);
    tiltAxis.set(Math.cos(pr.tiltAz), 0, Math.sin(pr.tiltAz));
    tiltQuat.setFromAxisAngle(tiltAxis, pr.tilt);
    quat.multiply(tiltQuat);
    col.applyQuaternion(quat);
    capGeo.applyQuaternion(quat);
    axis.copy(UP).applyQuaternion(quat); // the tilted growth axis
    const centerD = (pr.tipDist + baseD) * 0.5;
    col.translate(axis.x * centerD, axis.y * centerD, axis.z * centerD);
    capGeo.translate(axis.x * centerD, axis.y * centerD, axis.z * centerD);
    parts.push(col, capGeo);
  }

  // Merge: non-indexed, position-only parts (normals/uv stripped — the
  // shared tail rebuilds facet normals) concatenated into one geometry.
  const stripped = parts.map((part) => {
    const g = part.index ? part.toNonIndexed() : part;
    g.deleteAttribute('normal');
    g.deleteAttribute('uv');
    return g;
  });
  const geo = mergeGeometries(stripped, false);

  // Bounding contract: normalise the cluster so the furthest vertex (the
  // longest prism's tip) sits at 1.26, then float32-safe re-measure every
  // vertex into [0.40, 1.30] — same pattern as makeLumpyRock.
  const pos = geo.attributes.position;
  let maxLen = 0;
  for (let i = 0; i < pos.count; i++) {
    const h = Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i));
    if (h > maxLen) maxLen = h;
  }
  const norm = 1.26 / maxLen;
  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i) * norm, vy = pos.getY(i) * norm, vz = pos.getZ(i) * norm;
    const h = Math.hypot(vx, vy, vz);
    if (h > 1.30) {
      const s = (1.30 - 2e-7) / h;
      vx *= s; vy *= s; vz *= s;
    } else if (h < 0.40) {
      const s = (0.40 + 2e-7) / h;
      vx *= s; vy *= s; vz *= s;
    }
    pos.setXYZ(i, vx, vy, vz);
  }
  // Faceted on purpose: userData.smoothNormals stays unset, so the
  // shared tail welds nothing and the crystal faces stay crisp.
  geo.userData.prismCount = prismCount; // built-prism count, for review
  return geo;
}

/**
 * Splintered glass (brineIce shard, emberglass shard): a BROKEN SLAB, not
 * a symmetric gem. The Wave 51 shard was an octahedron with two world axes
 * rescaled, so every rock read as the same axis-aligned glass crystal. The
 * rebuilt body carries four fracture mechanisms, all baked into the one
 * geometry a whole ore InstancedMesh shares, so they are paid once at
 * build time:
 *
 * SPLINTER FRAME — a random ORTHONORMAL frame (u, e1, e2): u is the
 * splinter axis (uniform direction on the sphere), e2 the crush axis, e1
 * the remaining side axis, with e1/e2 twisted by a drawn angle around u
 * so nothing ever aligns with the world axes. Vertex coordinates are
 * decomposed into the frame, scaled (u ×1.80-1.90, e2 ×0.35-0.40,
 * e1 ×0.62-0.78) and recomposed — a splinter stretched along one random
 * direction and crushed across another, so the vertex cloud's
 * largest-to-smallest principal extent ratio stays ≥ 2.2.
 *
 * CONCHOIDAL FRACTURE — FOUR cutting planes, one CAP + one SHEAR per
 * end. Normals are drawn in the frame itself: a tilt from ±u (caps
 * 0.14-0.34 rad, shears 0.42-0.80 rad) and an azimuth stepped by the
 * golden angle so successive cuts never collide and cannibalise each
 * other's face. A vertex is projected exactly onto the plane it violates
 * DEEPEST (argmax v·n - off): single-plane ownership partitions the
 * fracture into azimuth wedges, so every plane owns one intact dead-flat
 * face that terminates in a sharp edge where it meets its neighbours —
 * the hallmark of broken glass and ice. (Sequential projection onto
 * every violated plane was tried and rejected: each projection pulls the
 * vertex back inside the later planes, so the last planes own nothing
 * and the faces starve.) Ends ALTERNATE by index — a free end draw can
 * stack 3+ nested caps on one end whose wedges starve each other — and
 * the plane count is FIXED at 4 because a drawn 5th/6th plane only
 * re-partitions the same fracture area into slivers below the
 * 2.5%-of-surface flat-face bar. Offsets are asymmetric on purpose: the
 * STRUCK end breaks nearer the body (cap 0.65-0.90, shear 0.53-0.78)
 * where the slab is wide, while the RUN-OUT end cuts far out (cap
 * 1.00-1.30, shear 0.72-0.97) and its uncut azimuth wedges keep a long
 * tapered point.
 *
 * TERRACE STEPS — fracture leaves steps along the break: a low-frequency
 * ridged valueNoise3 term (1 - |2n-1|, amplitude 0.030 × damp) sampled
 * mostly along the stretched splinter coordinate bu, so the sharp ridge
 * lines run across the slab. 2-3 small CHIPS (angular-distance bowls on
 * the direction sphere, radii 0.10-0.22 rad, depth 0.40×radius×damp)
 * notch the silhouette like tiny craters.
 *
 * ROUGHNESS — a 2-octave valueNoise3 radial term (amplitudes 0.018 and
 * 0.008 × damp) before the cuts keeps uncut surface from being perfectly
 * flat, and a micro 2-octave term (0.002 / 0.001 × damp, ≤ ~2° of tilt)
 * AFTER the cuts keeps the fracture faces inside their 5° normal clusters
 * without being mathematically perfect.
 *
 * ALL rng draws happen up front in a fixed-count block (frame, scales,
 * twist, noise offset, 3 draws per plane, chip count + 3 per chip); the
 * vertex loop draws nothing, so one seed always yields the same
 * positions and the same rng draw count.
 *
 * Bounding contract: final vertex lengths are re-measured and clamped to
 * [0.40, 1.30] with the float32-safe margin makeLumpyRock uses — the
 * floor sits below lumpy's 0.55 because a slab must read thin, but never
 * below 0.40. Faceted on purpose: userData.smoothNormals stays UNSET, so
 * the shared tail keeps per-face normals and the material's flatShading
 * reads the broken plates.
 */
function makeShardRock(rng, profile) {
  const [wMin, wMax] = profile.wobble;
  const amp = (wMax - wMin) / 0.4; // wobble [0.80,1.20] == full swing
  // Relief amplitude: the shard ores draw wobble bands up to ±0.40
  // (amp 2.0), which would pile ~0.3 of noise onto a slab only
  // 0.70-0.80 thick and bury the splinter silhouette. All relief
  // (terraces, chips, roughness) is capped at amp 1.4.
  const damp = amp > 1.4 ? 1.4 : amp;

  // --- every rng draw for this geometry, in fixed order ---
  const uz = rng() * 2 - 1; // splinter axis u: uniform on the sphere
  const ut = rng() * Math.PI * 2;
  // Wave 52 review fix: 1.80× elongation on a scaled sphere is what made
  // the body read as a smooth blimp/loaf. A broken glass fragment is a
  // chunky wedge, so the stretch drops to ×1.32-1.54 and the crush axis
  // thickens to ×0.40-0.50: still clearly a splinter, no longer a hull.
  const elong = 1.32 + rng() * 0.22; // splinter axis stretch
  const crush = 0.40 + rng() * 0.10; // crush axis (slab thickness)
  const side = 0.62 + rng() * 0.18;  // side axis
  const twist = rng() * Math.PI * 2; // e1/e2 rotation around u
  const ox = rng() * 64, oy = rng() * 64, oz = rng() * 64; // noise offset
  // TEN cuts, uniform over the WHOLE direction sphere. The old four cuts
  // were all drawn within ~45° of ±u, so they only shaved the two tips
  // and left the broad sides as untouched sphere — the loaf. Spreading
  // the normals means every direction of the body is truncated, so the
  // fragment is a convex polyhedron of flat conchoidal faces meeting in
  // sharp arrises, which is what broken glass actually looks like.
  //
  // Each offset is a FRACTION of the body's own support distance along
  // that normal (support(n) = |(elong·n·u, side·n·e1, crush·n·e2)| for
  // the scaled ellipsoid), not an absolute distance. An absolute offset
  // never cuts the thin axis — its support is only ~0.45 — so those
  // faces stayed round; a relative one guarantees every drawn plane
  // owns a real face no matter which way it points.
  const planeCount = 10;
  const planeDraws = [];
  for (let p = 0; p < planeCount; p++) {
    planeDraws.push({
      nz: rng() * 2 - 1,             // normal: uniform on the sphere
      nt: rng() * Math.PI * 2,
      frac: 0.74 + rng() * 0.18,     // cut at 74-92% of the local support
    });
  }
  const chipCount = 2 + Math.floor(rng() * 2); // 2-3 chipped notches
  const chips = [];
  for (let c = 0; c < chipCount; c++) {
    const cz = rng() * 2 - 1; // chip centre: uniform on the sphere
    const ct = rng() * Math.PI * 2;
    const cs = Math.sqrt(1 - cz * cz);
    const rad = 0.10 + rng() * 0.12; // angular radius, radians
    chips.push({
      x: cs * Math.cos(ct), y: cs * Math.sin(ct), z: cz,
      rad, cosCut: Math.cos(rad), depth: 0.40 * rad * damp,
    });
  }
  // --- no rng below this line ---

  // Orthonormal splinter frame: u from the sphere draw, then a reference
  // axis chosen away from u, orthogonalised and rotated around u by the
  // twist draw (Rodrigues), so e1/e2 never line up with world axes.
  const us = Math.sqrt(1 - uz * uz);
  const ux = us * Math.cos(ut), uy = us * Math.sin(ut);
  const rx = Math.abs(ux) < 0.9 ? 1 : 0, ry = 1 - rx; // ref (1,0,0)|(0,1,0)
  const ru = rx * ux + ry * uy; // ref·u (ref has no z component)
  let v0x = rx - ux * ru, v0y = ry - uy * ru, v0z = -uz * ru;
  const v0l = Math.hypot(v0x, v0y, v0z) || 1;
  v0x /= v0l; v0y /= v0l; v0z /= v0l;
  const kx = uy * v0z - uz * v0y; // u × v0
  const ky = uz * v0x - ux * v0z;
  const kz = ux * v0y - uy * v0x;
  const cw = Math.cos(twist), sw = Math.sin(twist);
  const e1x = v0x * cw + kx * sw, e1y = v0y * cw + ky * sw, e1z = v0z * cw + kz * sw;
  const e2x = uy * e1z - uz * e1y; // e2 = u × e1
  const e2y = uz * e1x - ux * e1z;
  const e2z = ux * e1y - uy * e1x;

  // Resolve each drawn direction to a unit normal and a cut distance. The
  // normal is used as drawn (uniform on the sphere), and the distance is
  // its fraction of the body's SUPPORT along that normal: decompose the
  // normal into the splinter frame, and the scaled ellipsoid's support is
  // |(elong·du, side·d1, crush·d2)|. Cutting at 74-92% of the support
  // therefore removes a real cap in every direction, thin axis included,
  // and the fragment ends up bounded by ten flat faces.
  const planes = [];
  for (const pd of planeDraws) {
    const ns = Math.sqrt(1 - pd.nz * pd.nz);
    const nx = ns * Math.cos(pd.nt), ny = ns * Math.sin(pd.nt), nz = pd.nz;
    const du = nx * ux + ny * uy + nz * uz;
    const d1 = nx * e1x + ny * e1y + nz * e1z;
    const d2 = nx * e2x + ny * e2y + nz * e2z;
    const support = Math.hypot(elong * du, side * d1, crush * d2);
    planes.push({ nx, ny, nz, off: support * pd.frac });
  }

  // Octahedron one subdivision ABOVE the profile, budget 1600 like the
  // lumpy crater path: detail 6 → 8×7²×3 = 1176 non-indexed verts, enough
  // to resolve cut edges, terrace steps and chips. Shared by the ore's
  // whole InstancedMesh, so the cost is paid once at build time.
  const geo = new THREE.OctahedronGeometry(1, polyDetail(8, Math.max(6, profile.detail + 1), 1600));
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Decompose into the splinter frame, scale per axis, recompose.
    const su = x * ux + y * uy + z * uz;
    const s1 = x * e1x + y * e1y + z * e1z;
    const s2 = x * e2x + y * e2y + z * e2z;
    const bu = su * elong, b1 = s1 * side, b2 = s2 * crush;
    let bx = ux * bu + e1x * b1 + e2x * b2;
    let by = uy * bu + e1y * b1 + e2y * b2;
    let bz = uz * bu + e1z * b1 + e2z * b2;
    const len = Math.hypot(bx, by, bz) || 1;
    const dx = bx / len, dy = by / len, dz = bz / len;
    // Terrace steps: ridged noise following the stretched splinter
    // coordinate bu, so the sharp ridge lines run ACROSS the slab.
    const sn = valueNoise3(bu * 1.7 + ox, b1 * 0.4 + oy, b2 * 0.4 + oz);
    let disp = 0.030 * damp * ((1 - Math.abs(2 * sn - 1)) - 0.5);
    // Chips: narrow angular bowls on the direction sphere, tiny craters.
    for (const c of chips) {
      const dot = dx * c.x + dy * c.y + dz * c.z;
      if (dot <= c.cosCut) continue;
      const t = Math.acos(dot > 1 ? 1 : dot) / c.rad; // 0 centre, 1 edge
      disp -= c.depth * (0.5 + 0.5 * Math.cos(Math.PI * t));
    }
    // Pre-cut roughness: no uncut face is perfectly flat.
    disp += 0.018 * damp * (valueNoise3(dx * 2.6 + ox, dy * 2.6 + oy, dz * 2.6 + oz) * 2 - 1)
      + 0.008 * damp * (valueNoise3(dx * 6.1 + ox, dy * 6.1 + oy, dz * 6.1 + oz) * 2 - 1);
    let nl = len + disp;
    if (nl < 0.05) nl = 0.05; // stacked chips never tunnel through origin
    bx = dx * nl; by = dy * nl; bz = dz * nl;
    // Conchoidal cuts: the vertex is projected onto the plane it violates
    // DEEPEST (argmax v·n - off). Single-plane ownership partitions the
    // fracture into wedges by azimuth — every plane that cuts anything
    // owns one intact dead-flat face terminating in sharp edges. Naive
    // projection onto EVERY violated plane in index order was rejected:
    // each projection pulls the vertex back inside the later planes, so
    // the last planes own nothing and their faces starve.
    //
    // Wave 52 fin fix: ONE argmax projection is not enough. Where two
    // cuts meet at the splinter tip, folding a vertex onto its deepest
    // plane can leave it still outside a second, nearly parallel plane —
    // that surviving overhang is what rendered as paper-thin fins
    // sticking out of the ends. Re-running the argmax (never a fixed
    // index order, so ownership still goes to the deepest violation each
    // time) until nothing protrudes removes the overhang and leaves the
    // wedge lying flat in its owner face. Three passes bound the work;
    // with four planes the third pass has never found a violation.
    for (let pass = 0; pass < 3; pass++) {
      let worst = -1, worstD = 1e-6; // ignore float-noise violations
      for (let p = 0; p < planes.length; p++) {
        const pl = planes[p];
        const d = bx * pl.nx + by * pl.ny + bz * pl.nz - pl.off;
        if (d > worstD) { worstD = d; worst = p; }
      }
      if (worst < 0) break;
      const pl = planes[worst];
      bx -= pl.nx * worstD; by -= pl.ny * worstD; bz -= pl.nz * worstD;
    }
    // Micro-roughness AFTER the cuts (≤ ~3° of tilt): fracture faces stay
    // inside their 5° normal clusters but are not mathematically perfect.
    const l2 = Math.hypot(bx, by, bz) || 1;
    const mr = 0.002 * damp * (valueNoise3(bx * 3.2 + ox, by * 3.2 + oy, bz * 3.2 + oz) * 2 - 1)
      + 0.001 * damp * (valueNoise3(bx * 7.3 + ox, by * 7.3 + oy, bz * 7.3 + oz) * 2 - 1);
    const l3 = (l2 + mr) / l2;
    bx *= l3; by *= l3; bz *= l3;
    // Bounding contract [0.40, 1.30]: re-measure the vector actually
    // written and pull it inside the bound with ~2e-7 of margin, so the
    // float32 cast of the position attribute cannot push the stored
    // length back outside (same pattern as makeLumpyRock).
    const h = Math.hypot(bx, by, bz);
    if (h > 1.30) {
      const s = (1.30 - 2e-7) / h;
      bx *= s; by *= s; bz *= s;
    } else if (h < 0.40) {
      const s = (0.40 + 2e-7) / h;
      bx *= s; by *= s; bz *= s;
    }
    pos.setXYZ(i, bx, by, bz);
  }
  // Wave 52 sliver collapse: clipping a non-indexed octahedron leaves a
  // handful of needle triangles where a cut edge crosses a face — seen
  // edge-on they render as thin bright wedges apparently sticking out of
  // the body (the artifact reviewed on brine ice and emberglass). They
  // cannot be deleted from a non-indexed buffer, so each one is snapped
  // to its own centroid: zero area, nothing rasterised, no neighbouring
  // triangle moves because every vertex is private to its face. The
  // quality measure is 4·sqrt(3)·A / (a²+b²+c²) — 1 for an equilateral
  // triangle, →0 for a needle — and the 0.05 bar sits an order of
  // magnitude below the ~0.6 of a healthy octahedron face.
  const arr = pos.array;
  for (let t = 0; t < pos.count; t += 3) {
    const i0 = t * 3, i1 = i0 + 3, i2 = i0 + 6;
    const ax = arr[i1] - arr[i0], ay = arr[i1 + 1] - arr[i0 + 1], az = arr[i1 + 2] - arr[i0 + 2];
    const cx2 = arr[i2] - arr[i0], cy2 = arr[i2 + 1] - arr[i0 + 1], cz2 = arr[i2 + 2] - arr[i0 + 2];
    const nx = ay * cz2 - az * cy2, ny = az * cx2 - ax * cz2, nz = ax * cy2 - ay * cx2;
    const twiceArea = Math.hypot(nx, ny, nz);
    const bx2 = arr[i2] - arr[i1], by2 = arr[i2 + 1] - arr[i1 + 1], bz2 = arr[i2 + 2] - arr[i1 + 2];
    const sumSq = ax * ax + ay * ay + az * az + cx2 * cx2 + cy2 * cy2 + cz2 * cz2
      + bx2 * bx2 + by2 * by2 + bz2 * bz2;
    if (sumSq <= 0 || 2 * Math.sqrt(3) * twiceArea / sumSq >= 0.05) continue;
    const gx = (arr[i0] + arr[i1] + arr[i2]) / 3;
    const gy = (arr[i0 + 1] + arr[i1 + 1] + arr[i2 + 1]) / 3;
    const gz = (arr[i0 + 2] + arr[i1 + 2] + arr[i2 + 2]) / 3;
    arr[i0] = gx; arr[i0 + 1] = gy; arr[i0 + 2] = gz;
    arr[i1] = gx; arr[i1 + 1] = gy; arr[i1 + 2] = gz;
    arr[i2] = gx; arr[i2 + 1] = gy; arr[i2 + 2] = gz;
  }
  return geo; // faceted: smoothNormals deliberately unset
}


/**
 * Geometry recipe per ORE_TYPES[oreKey].rock.shape. All variants return a
 * computeVertexNormals()'d, flatShading-safe geometry; legacy shapes stay
 * ≤ ~400 vertices, the lumpy crater path may use up to ~1600 (see
 * polyDetail — the geometry is shared by one InstancedMesh per ore, so
 * the 1500-vert crater mesh is paid once). profile.wobble is [min,max]
 * radial scale; profile.detail is subdivision.
 */
function makeRockGeometry(rng, profile) {
  const [wMin, wMax] = profile.wobble;
  const wobble = () => wMin + rng() * (wMax - wMin);
  let geo;
  switch (profile.shape) {
    case 'blocky': {
      // Fractured metal slab: cleavage planes over spherified plates —
      // see makeBlockyRock above.
      geo = makeBlockyRock(rng, profile);
      break;
    }
    case 'crystal': {
      // Salt-crystal cluster: rocky core + interpenetrating prisms —
      // see makeCrystalRock above.
      geo = makeCrystalRock(rng, profile);
      break;
    }
    case 'shard': {
      // Splintered glass (brineIce, emberglass): broken slab with a
      // random splinter frame, conchoidal cut faces, terrace steps and
      // chips — see makeShardRock.
      geo = makeShardRock(rng, profile);
      break;
    }
    case 'bloom': {
      // Grown body (livingRock, wakeglass): fused growth lobes with soft
      // seams, no craters — see makeBloomRock.
      geo = makeBloomRock(rng, profile);
      break;
    }
    case 'lumpy':
    default: {
      if (profile.craters) {
        // Wave 52 real-rock path (rawOre pilot): lobes + fBm + craters.
        geo = makeLumpyRock(rng, profile);
      } else {
        // Classic rock: icosahedron with per-vertex radial wobble. Kept
        // byte-for-byte for lumpy profiles without a craters recipe —
        // same legacy vertex budget, same per-vertex rng draws.
        geo = new THREE.IcosahedronGeometry(1, polyDetail(20, profile.detail));
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const k = wobble();
          pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
        }
      }
      break;
    }
  }
  geo.computeVertexNormals();
  // The lumpy path opts into welded (smooth) normals — PolyhedronGeometry
  // is non-indexed, so plain computeVertexNormals leaves per-face facets.
  if (geo.userData.smoothNormals) weldRockNormals(geo);
  return geo;
}

/**
 * Material recipe per ORE_TYPES[oreKey].rock. Colour stays WHITE: the live
 * field tints per-instance via setColorAt. Emissive is skipped entirely
 * when the profile's emissive is 0.
 * Wave 52: a profile with a `surface` recipe takes its flatShading from
 * surface.flat — crisp-facet styles (metal, ice, facet, ember) set it true,
 * smooth-body styles (regolith, vein, bloom, wake) leave it falsy and let
 * the injected shader bump carry the detail. Profiles without `surface`
 * keep the old shape-based rule untouched.
 */
function makeRockMaterial(profile) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: profile.roughness,
    metalness: profile.metalness,
    flatShading: profile.surface ? !!profile.surface.flat : profile.shape === 'lumpy' || profile.shape === 'blocky' || profile.shape === 'shard',
  });
  if (profile.emissive) {
    mat.emissive = new THREE.Color(profile.emissive);
    mat.emissiveIntensity = profile.emissiveIntensity;
  }
  applyRockSurface(mat, profile);
  return mat;
}

/**
 * Build a standalone asteroid mesh for the models browser (deterministic per seed).
 * Wave 51: optional oreKey selects the ore's geometry/material/colour recipe.
 * @returns {{ object: THREE.Object3D, update: (elapsed: number, reducedMotion: boolean) => void, label: string }}
 */
export function buildAsteroidModel(seed = 1, oreKey = 'rawOre') {
  const key = ORE_TYPES[oreKey] ? oreKey : 'rawOre';
  const profile = ORE_TYPES[key].rock;
  const rng = makeRng(seed);
  const geo = makeRockGeometry(rng, profile);
  const mat = makeRockMaterial(profile);
  // Standalone mesh has no instance colours — bake the ore's HSL band in.
  mat.color.setHSL(
    profile.hue[0] + rng() * profile.hue[1],
    profile.sat[0] + rng() * profile.sat[1],
    profile.light[0] + rng() * profile.light[1],
  );
  const object = new THREE.Mesh(geo, mat);

  // Per-instance axis ratios + static tilt, mirroring the live field's
  // real-rock pilot so the reviewed prop matches what ships. Gated on
  // profile.axisJitter — absent or 0 draws nothing and yields the old
  // uniform scale and identity tilt, so the other ores' props are
  // byte-for-byte unchanged. The largest ratio is normalised to exactly 1:
  // the live path's rock.radius is the mining bounding sphere, and the prop
  // honours the same never-exceed-radius contract.
  const scaleVec = new THREE.Vector3(1, 1, 1);
  const tilt = new THREE.Quaternion();
  const jitter = profile.axisJitter ?? 0;
  if (jitter > 0) {
    const rx = 1 - rng() * jitter;
    const ry = 1 - rng() * jitter;
    const rz = 1 - rng() * jitter;
    const maxR = Math.max(rx, ry, rz);
    scaleVec.set(rx / maxR, ry / maxR, rz / maxR);
    tilt.setFromEuler(new THREE.Euler(
      rng() * Math.PI * 2,
      rng() * Math.PI * 2,
      rng() * Math.PI * 2,
    ));
  }

  // Midpoint of instance scale range (2..14 → 8). Live path uses baseScale = radius.
  object.scale.copy(scaleVec).multiplyScalar(8 * profile.scaleMult);

  // Tumble state mirrors live rock structure.
  const axis = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
  const spin = (0.1 + rng() * 0.35) * (rng() < 0.5 ? -1 : 1);
  let angle = rng() * Math.PI * 2;

  const _quat = new THREE.Quaternion();

  function update(elapsed, reducedMotion) {
    if (reducedMotion) return;
    // Live path amortizes over ~4 frames (n/chunk ≈ 4); we advance every frame.
    angle += spin * 0.016 * 4; // dt ≈ 0.016 at 60fps, n/chunk ≈ 4
    _quat.setFromAxisAngle(axis, angle).multiply(tilt);
    object.quaternion.copy(_quat);
  }

  return { object, update, label: COMMODITIES[key].name + ' asteroid' };
}

export function initAsteroids(ctx) {
  // Mutable build state, swapped wholesale on rebuild.
  let bundles = []; // per-ore { oreKey, mesh, nextSlot, hot, matrixDirty }
  let rocks = []; // flat render+sim state, indexed 0..count-1
  let list = []; // flat ctx.asteroids.list, SAME index as rocks
  let chunk = 1;
  let cursor = 0;
  let builtSys = ctx.world.currentSystem;
  let builtSeed = SYSTEMS[builtSys] && SYSTEMS[builtSys].worldSeed;
  let lastOreRef = ctx.world.fieldOre;
  let sawSaveRestored = ctx.flags.saveRestored;
  // Reused bookkeeping arrays — reset on build, never reallocated per frame.
  const dirtyBundles = [];
  const activeHeat = []; // rock indices with heat > 0, capped at HEAT_CAP
  const collapseList = []; // rock indices mid-collapse animation
  // Teardown list: every live per-ore InstancedMesh for THIS ctx. rebuild()
  // disposes and empties it, so no mesh leaks across a system jump. This is
  // per-ctx closure state, NOT module state: the boot harness builds several
  // contexts against this one module, and a shared list would let one ctx's
  // rebuild dispose another ctx's live geometry while it is still rendering.
  const fieldMeshes = [];

  function writeFieldOre(sys, index, remaining, seeded) {
    if (typeof sys !== 'string' || !Object.hasOwn(SYSTEMS, sys)) return;
    let bag = ctx.world.fieldOre;
    if (!bag || typeof bag !== 'object' || Array.isArray(bag)) {
      bag = {};
      ctx.world.fieldOre = bag;
      lastOreRef = bag;
    }
    const key = String(index);
    if (remaining === seeded) {
      if (!Object.hasOwn(bag, sys)) return;
      const child = bag[sys];
      if (child && typeof child === 'object' && !Array.isArray(child) && Object.hasOwn(child, key)) {
        delete child[key];
        if (Object.keys(child).length === 0) delete bag[sys];
      }
      return;
    }
    let child = Object.hasOwn(bag, sys) ? bag[sys] : null;
    if (!child || typeof child !== 'object' || Array.isArray(child)) {
      child = {};
      bag[sys] = child;
    }
    child[key] = remaining;
  }

  function overlayFieldOre(sys) {
    const bag = ctx.world.fieldOre;
    let child = null;
    if (bag && typeof bag === 'object' && !Array.isArray(bag) && typeof sys === 'string'
        && Object.hasOwn(bag, sys)) {
      const c = bag[sys];
      if (c && typeof c === 'object' && !Array.isArray(c)) child = c;
    }
    for (let i = 0; i < rocks.length; i++) {
      const rock = rocks[i];
      const seeded = rock.seedOre;
      let remaining = seeded;
      if (child) {
        const key = String(i);
        if (Object.hasOwn(child, key)) {
          const v = child[key];
          if (Number.isFinite(v)) remaining = Math.min(seeded, Math.max(0, Math.trunc(v)));
        }
      }
      rock.ore = remaining;
      if (list[i]) list[i].ore = remaining;
      if (remaining <= 0) {
        if (!rock.depleted) deplete(i, rock);
      } else if (rock.depleted) {
        rock.depleted = false;
        rock.collapseT = -1;
        if (rock.collapseListed) {
          rock.collapseListed = false;
          const ix = collapseList.indexOf(i);
          if (ix >= 0) {
            collapseList[ix] = collapseList[collapseList.length - 1];
            collapseList.pop();
          }
        }
        rock.radius = rock.baseScale;
        if (list[i]) list[i].radius = rock.radius;
        _color.copy(rock.baseColor);
        rock.mesh.setColorAt(rock.instanceIndex, _color);
        rock.mesh.instanceColor.needsUpdate = true;
        _quat.setFromAxisAngle(rock.axis, rock.angle).multiply(rock.tilt);
        _scale.copy(rock.scaleVec).multiplyScalar(rock.radius);
        _mat4.compose(rock.position, _quat, _scale);
        rock.mesh.setMatrixAt(rock.instanceIndex, _mat4);
        rock.mesh.instanceMatrix.needsUpdate = true;
      }
    }
    lastOreRef = ctx.world.fieldOre;
  }

  function build(def) {
    const field = def.field;
    const count = Math.min(Math.max(0, field.count | 0), 160);
    const [cx, cy, cz] = field.center;
    const oreMult = field.oreMult ?? 1;
    const band = def.band ?? 0; // §15 band drives composition (wave 51)
    const rng = makeRng(0xa57e000 + def.worldSeed);
    const kind = kindFromDef(def);
    let workFrac = field.workFrac;
    if (!Number.isFinite(workFrac)) workFrac = kind === 'cloud' ? 0.50 : 0.60;
    if (workFrac < 0) workFrac = 0;
    if (workFrac > 1) workFrac = 1;
    const workN = Math.ceil(workFrac * count);
    const az0 = Math.atan2(cz, cx);
    const beltR = Math.hypot(cx, cz);
    const halfW = field.radius;
    const rLo = Math.max(0, beltR - halfW);
    const rHi = beltR + halfW;
    const incAmp = kind === 'cloud' ? 0.55 : 0.12;
    let tNow = ctx.world.time;
    if (!Number.isFinite(tNow) || tNow < 0) tNow = 0;
    let sunR = ctx.config.world.sunRadius;
    if (!Number.isFinite(sunR) || sunR <= 0) sunR = def.sunRadius || 0;
    const planetCount = Math.min(def.planetCount | 0, PLANET_SLOT_COUNT, PLANET_SLOTS.length);
    let sx = ctx.config.world.stationPosition.x;
    let sy = ctx.config.world.stationPosition.y;
    let sz = ctx.config.world.stationPosition.z;
    const stp = def.station && def.station.position;
    if (stp) {
      sx = stp[0];
      sy = stp[1];
      sz = stp[2];
    }
    const gateList = [];
    const gates = def.gates;
    if (gates) {
      for (let g = 0; g < gates.length; g++) {
        const p = gates[g] && gates[g].position;
        if (!p) continue;
        if (Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2])) {
          gateList.push(p);
        }
      }
    }
    const hub = def.hub;
    if (hub && hub.routes && hub.routes.length && hub.position) {
      const p = hub.position;
      if (Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2])) {
        gateList.push(p);
      }
    }

    // FIRST PASS — draw every rock's ore key before anything else so the
    // RNG draw order (and thus field composition) is deterministic.
    const draws = new Array(count);
    const perOre = new Map(); // oreKey -> rocks drawn
    for (let i = 0; i < count; i++) {
      const oreKey = pickOreType(band, rng());
      draws[i] = oreKey;
      perOre.set(oreKey, (perOre.get(oreKey) ?? 0) + 1);
    }

    // One InstancedMesh per ore type that actually drew ≥1 rock — never an
    // empty mesh. oreKeysForBand order keeps mesh creation deterministic.
    bundles = [];
    const bundleByOre = new Map();
    for (const oreKey of oreKeysForBand(band)) {
      const slots = perOre.get(oreKey);
      if (!slots) continue;
      const ore = ORE_TYPES[oreKey];
      const mesh = new THREE.InstancedMesh(
        makeRockGeometry(rng, ore.rock),
        makeRockMaterial(ore.rock),
        slots,
      );
      mesh.name = 'asteroid-field-' + oreKey; // boot harness contract
      mesh.userData.oreKey = oreKey;
      mesh.frustumCulled = false; // instances span the whole field
      ctx.scene.add(mesh);
      const bundle = {
        oreKey,
        mesh,
        nextSlot: 0,
        // Heat-glow target: the ore's spark colour, scaled bright.
        hot: new THREE.Color(ore.sparkColor).multiplyScalar(1.6),
        matrixDirty: false,
      };
      bundles.push(bundle);
      bundleByOre.set(oreKey, bundle);
      fieldMeshes.push(mesh);
    }

    // SECOND PASS — flat rocks/list arrays; index i IS the asteroidId.
    rocks = [];
    list = [];
    for (let i = 0; i < count; i++) {
      const oreKey = draws[i];
      const ore = ORE_TYPES[oreKey];
      const profile = ore.rock;
      const bundle = bundleByOre.get(oreKey);
      // Five orbit-element draws (replaces theta, r, xz/y jitter). Next draw is radius.
      const uR = rng();
      const uInc = rng();
      const uNode = rng();
      const uPhase = rng();
      const uY = rng();
      const rFrac = kind === 'sparse' ? uR : Math.pow(uR, 0.7);
      let orbitR = rLo + (rHi - rLo) * rFrac;
      const inc = (uInc - 0.5) * 2 * incAmp;
      const node = uNode * Math.PI * 2;
      const y0 = cy + (uY - 0.5) * (kind === 'cloud' ? 20 : 8);
      const inWork = i < workN;
      const sectorOff = inWork ? (uPhase - 0.5) * 2 * WORK_HALF : uPhase * Math.PI * 2;
      let omega = omegaForR(orbitR);
      let phase0 = inWork ? az0 + sectorOff - node : sectorOff;
      const position = new THREE.Vector3();
      // scaleMult sizes the ore's rocks (wakeglass small, slagIron chunky).
      const radius = (2 + Math.pow(rng(), 1.6) * 12) * profile.scaleMult;
      const baseColor = new THREE.Color().setHSL(
        profile.hue[0] + rng() * profile.hue[1],
        profile.sat[0] + rng() * profile.sat[1],
        profile.light[0] + rng() * profile.light[1],
      );

      // Per-rock axis ratios + static tilt (real-rock pilot): one shared
      // geometry per ore would otherwise render as a crowd of clones.
      // Gated on profile.axisJitter — absent or 0 draws NOTHING, so the
      // other ores keep the exact old uniform (1,1,1) scale and identity
      // tilt, and their rng stream is untouched. The draws sit at ONE
      // fixed point (after baseColor, before the rock literal) so the
      // existing draw order for position/radius/colour/axis/spin/ore is
      // preserved. Ratios fall in [1 - axisJitter, 1] and are normalised
      // so the LARGEST component is exactly 1: rock.radius is the mining
      // raycast's bounding sphere, so no axis may ever scale past it.
      const scaleVec = new THREE.Vector3(1, 1, 1);
      const tilt = new THREE.Quaternion();
      const jitter = profile.axisJitter ?? 0;
      if (jitter > 0) {
        const rx = 1 - rng() * jitter;
        const ry = 1 - rng() * jitter;
        const rz = 1 - rng() * jitter;
        const maxR = Math.max(rx, ry, rz);
        scaleVec.set(rx / maxR, ry / maxR, rz / maxR);
        tilt.setFromEuler(new THREE.Euler(
          rng() * Math.PI * 2,
          rng() * Math.PI * 2,
          rng() * Math.PI * 2,
        ));
      }

      const rock = {
        position,
        radius,
        baseScale: radius, // geometry radius is ~1 → scale == world radius
        scaleVec, // per-rock axis ratios; max component exactly 1 (above)
        tilt, // per-rock static tilt, composed under the tumble quaternion
        axis: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
        spin: (0.1 + rng() * 0.35) * (rng() < 0.5 ? -1 : 1), // rad/s, slow tumble
        angle: rng() * Math.PI * 2,
        // oreMult rounds up: Veridian's 1.5 yields visibly richer rock;
        // unitsMult thins the exotics (wakeglass 0.35 — precious, not bulk).
        ore: Math.max(1, Math.ceil((4 + Math.floor(rng() * 9)) * oreMult * ore.unitsMult)),
        orbitR,
        inc,
        node,
        phase0,
        omega,
        y0,
        oreKey,
        commodity: oreKey,
        bundle,
        mesh: bundle.mesh,
        instanceIndex: bundle.nextSlot++,
        hotColor: bundle.hot, // shared per-ore, read-only
        rawRate: WEAPONS.mining.extractPerSec, // until a mineHit names the head
        extract: 0, // fractional extraction accumulator
        depleted: false,
        hitThisFrame: false,
        heatedThisFrame: false,
        hitPoint: null, // last mineHit point (borrowed ref, cloned on pod spawn)
        baseColor,
        heat: 0, // 0..1 heat-glow amount
        heatListed: false, // in activeHeat[]
        collapseT: -1, // <0 = not collapsing
        collapseListed: false, // in collapseList[]
      };
      rock.seedOre = rock.ore;
      // Keep-out mutates r/phase0 only — no extra rng after the look stream.
      const pad = radius + 20;
      const sunMin = sunR * PHY.SUN_HEAT_MULT + pad;
      const bumpR = (r) => {
        let next = r < sunMin ? sunMin : r + Math.max(8, pad * 0.25);
        if (next < sunMin) next = sunMin;
        for (let s = 0; s < planetCount; s++) {
          const orb = PLANET_SLOTS[s].orbitRadius;
          const bandW = PLANET_SLOTS[s].radius + 40;
          if (Math.abs(next - orb) < bandW) next = orb + bandW;
        }
        return next;
      };
      const radialHit = (r) => {
        if (r < sunMin) return true;
        for (let s = 0; s < planetCount; s++) {
          if (Math.abs(r - PLANET_SLOTS[s].orbitRadius) < PLANET_SLOTS[s].radius + 40) return true;
        }
        return false;
      };
      const planetTorusHit = () => {
        const hx = Math.hypot(position.x, position.z);
        for (let s = 0; s < planetCount; s++) {
          if (Math.abs(hx - PLANET_SLOTS[s].orbitRadius) < PLANET_SLOTS[s].radius + 40) return true;
        }
        return false;
      };
      const bodyHit = () => {
        const pr = radius + 20;
        cylinderOverlap(
          position.x, position.y, position.z, pr,
          sx, sy, sz, PHY.STATION_CYL_RADIUS, PHY.STATION_CYL_Y0, PHY.STATION_CYL_Y1,
          _keepOut,
        );
        if (_keepOut.hit) return true;
        for (let g = 0; g < gateList.length; g++) {
          const gp = gateList[g];
          torusOverlap(
            position.x, position.y, position.z, pr,
            gp[0], gp[1], gp[2], PHY.GATE_BORE, PHY.GATE_TUBE,
            _keepOut,
          );
          if (_keepOut.hit) return true;
        }
        return false;
      };
      const reanchor = () => {
        rock.omega = omegaForR(rock.orbitR);
        if (inWork) rock.phase0 = az0 + sectorOff - node;
        // Keep-out at t=0 so orbit elements do not depend on world.time.
        writeOrbitPose(position, rock.orbitR, inc, node, rock.phase0, rock.omega, y0, 0);
      };
      reanchor();
      for (let k = 0; k < KEEP_TRIES; k++) {
        const rad = radialHit(rock.orbitR) || planetTorusHit();
        const bod = bodyHit();
        if (!rad && !bod) break;
        rock.orbitR = bumpR(rock.orbitR);
        if (bod && !inWork) rock.phase0 += 0.37;
        reanchor();
      }
      let guard = 0;
      while ((radialHit(rock.orbitR) || planetTorusHit() || bodyHit()) && guard < 24) {
        rock.orbitR = bumpR(rock.orbitR);
        reanchor();
        guard += 1;
      }
      writeOrbitPose(position, rock.orbitR, inc, node, rock.phase0, rock.omega, y0, tNow);
      rocks.push(rock);
      list.push({
        id: i,
        position,
        radius,
        ore: rock.ore,
        commodity: oreKey,
        oreKey,
        hardness: ore.hardness,
      });

      // Initial instance transform + colour, into the rock's OWN mesh slot.
      // Tilt is pre-multiplied under the tumble so the shared geometry's
      // canonical orientation differs per rock; scaleVec keeps every axis
      // at or under the radius bounding sphere.
      _quat.setFromAxisAngle(rock.axis, rock.angle).multiply(rock.tilt);
      _scale.copy(rock.scaleVec).multiplyScalar(radius);
      _mat4.compose(position, _quat, _scale);
      bundle.mesh.setMatrixAt(rock.instanceIndex, _mat4);
      bundle.mesh.setColorAt(rock.instanceIndex, baseColor);
    }
    for (let b = 0; b < bundles.length; b++) {
      bundles[b].mesh.instanceMatrix.needsUpdate = true;
      if (bundles[b].mesh.instanceColor) bundles[b].mesh.instanceColor.needsUpdate = true;
    }

    // Replace (never mutate) so combat.js drops stale entries immediately.
    ctx.asteroids = { list };
    builtSys = def.id ?? ctx.world.currentSystem;
    builtSeed = def.worldSeed;
    overlayFieldOre(builtSys);

    // Tumble budget: recompose ~1/4 of instances per frame (full sweep ≈
    // every 4 frames ≈ 15 Hz at 60 fps) — smooth motion, flat cost.
    chunk = Math.ceil(count / 4);
    cursor = 0;
    dirtyBundles.length = 0;
    activeHeat.length = 0;
    collapseList.length = 0;
  }

  function rebuild(to) {
    // Wave 51 teardown rule: remove AND dispose every per-ore mesh
    // (geometry + material) before building the new field — leaking a mesh
    // across a jump is a hard failure.
    for (let m = 0; m < fieldMeshes.length; m++) {
      const mesh = fieldMeshes[m];
      ctx.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    fieldMeshes.length = 0;
    bundles = [];
    build(SYSTEMS[to]);
  }

  // Mark a rock's mesh instanceMatrix-dirty exactly once per frame.
  function markDirty(rock) {
    const bundle = rock.bundle;
    if (!bundle.matrixDirty) {
      bundle.matrixDirty = true;
      dirtyBundles.push(bundle);
    }
  }

  function deplete(i, rock) {
    rock.depleted = true;
    rock.heat = 0; // the heat sweep unlists it and restores the darkened tint
    list[i].ore = 0;
    // Darken immediately: world-tells-first depletion cue (§13.1).
    _color.copy(rock.baseColor).multiplyScalar(0.35);
    rock.mesh.setColorAt(rock.instanceIndex, _color);
    rock.mesh.instanceColor.needsUpdate = true;
    if (ctx.settings.reducedMotion) {
      // Accessibility: no collapse animation — snap to the depleted husk.
      rock.radius = rock.baseScale * 0.3;
      list[i].radius = rock.radius;
      _quat.setFromAxisAngle(rock.axis, rock.angle).multiply(rock.tilt);
      _scale.copy(rock.scaleVec).multiplyScalar(rock.radius);
      _mat4.compose(rock.position, _quat, _scale);
      rock.mesh.setMatrixAt(rock.instanceIndex, _mat4);
      rock.mesh.instanceMatrix.needsUpdate = true; // direct: the per-frame flush already ran
    } else {
      // Ease-out collapse over ~0.4 s, driven by the update loop below.
      rock.collapseT = 0;
      if (!rock.collapseListed) {
        rock.collapseListed = true;
        collapseList.push(i);
      }
    }
  }

  build(SYSTEMS[ctx.world.currentSystem]);

  return {
    update(dt) {
      // --- System swap (jump.js midpoint event, consumed next frame) ---
      for (let e = 0; e < ctx.lastEvents.length; e++) {
        const ev = ctx.lastEvents[e];
        if (ev.type === 'systemLoaded') {
          rebuild(ev.to);
          break; // fresh field: nothing else in this queue can apply to it
        }
      }
      const restoring = ctx.flags.saveRestored && !sawSaveRestored;
      sawSaveRestored = ctx.flags.saveRestored;
      if (ctx.world.fieldOre !== lastOreRef || restoring) {
        const sys = ctx.world.currentSystem;
        const seed = SYSTEMS[sys] && SYSTEMS[sys].worldSeed;
        if (sys === builtSys && seed === builtSeed) overlayFieldOre(sys);
        else lastOreRef = ctx.world.fieldOre;
      }

      const reduced = ctx.settings.reducedMotion;
      const n = rocks.length;
      const tWorld = ctx.world.time;
      const tOrbit = Number.isFinite(tWorld) ? tWorld : 0;

      // Closed-form orbit for every rock. Mutate the live Vector3.
      for (let i = 0; i < n; i++) {
        const rock = rocks[i];
        writeOrbitPose(
          rock.position,
          rock.orbitR,
          rock.inc,
          rock.node,
          rock.phase0,
          rock.omega,
          rock.y0,
          tOrbit,
        );
        _quat.setFromAxisAngle(rock.axis, rock.angle).multiply(rock.tilt);
        _scale.copy(rock.scaleVec).multiplyScalar(rock.radius);
        _mat4.compose(rock.position, _quat, _scale);
        rock.mesh.setMatrixAt(rock.instanceIndex, _mat4);
        markDirty(rock);
      }

      // Slow tumble, round-robin ~1/4. Skip far rocks. Orbit already posed.
      const pObj = ctx.ship && ctx.ship.object;
      const pPos = pObj && pObj.position;
      const end = Math.min(cursor + chunk, n);
      for (let i = cursor; i < end; i++) {
        const rock = rocks[i];
        if (rock.depleted) continue;
        if (pPos) {
          const dx = rock.position.x - pPos.x;
          const dy = rock.position.y - pPos.y;
          const dz = rock.position.z - pPos.z;
          if (dx * dx + dy * dy + dz * dz > TUMBLE_RANGE2) continue;
        }
        if (reduced) continue;
        rock.angle += rock.spin * dt * (n / chunk); // amortized over skipped frames
        _quat.setFromAxisAngle(rock.axis, rock.angle).multiply(rock.tilt);
        _scale.copy(rock.scaleVec).multiplyScalar(rock.baseScale);
        _mat4.compose(rock.position, _quat, _scale);
        rock.mesh.setMatrixAt(rock.instanceIndex, _mat4);
        markDirty(rock);
      }
      cursor = end >= n ? 0 : end;

      // --- Depletion collapse: ease-out shrink ~0.4 s (skipped under
      //     reducedMotion — deplete() snaps instead) ---
      for (let k = collapseList.length - 1; k >= 0; k--) {
        const i = collapseList[k];
        const rock = rocks[i];
        rock.collapseT += dt / 0.4;
        let t = rock.collapseT;
        if (t >= 1) {
          t = 1;
          rock.collapseListed = false;
          collapseList[k] = collapseList[collapseList.length - 1]; // swap-remove
          collapseList.pop();
        }
        const ease = 1 - (1 - t) * (1 - t); // quadratic ease-out
        rock.radius = rock.baseScale * (1 - 0.7 * ease); // → baseScale × 0.3
        list[i].radius = rock.radius;
        _quat.setFromAxisAngle(rock.axis, rock.angle).multiply(rock.tilt);
        _scale.copy(rock.scaleVec).multiplyScalar(rock.radius);
        _mat4.compose(rock.position, _quat, _scale);
        rock.mesh.setMatrixAt(rock.instanceIndex, _mat4);
        markDirty(rock);
      }

      // Flush per-mesh matrix dirtiness accumulated this frame.
      for (let b = 0; b < dirtyBundles.length; b++) {
        dirtyBundles[b].mesh.instanceMatrix.needsUpdate = true;
        dirtyBundles[b].matrixDirty = false;
      }
      dirtyBundles.length = 0;

      // --- Mining: consume combat's 'mineHit' beam contacts (§6.3) ---
      for (let e = 0; e < ctx.lastEvents.length; e++) {
        const ev = ctx.lastEvents[e];
        if (ev.type === 'mineHit') {
          const rock = rocks[ev.asteroidId];
          if (rock && !rock.depleted) {
            rock.hitThisFrame = true;
            // The installed head's raw rate (wave 51 contract); fall back to
            // the stock Mk I numbers when the event predates the field.
            rock.rawRate = ev.extractPerSec ?? WEAPONS.mining.extractPerSec;
            if (ev.point) rock.hitPoint = ev.point;
          }
        }
      }
      const yieldUnits = ctx.world.activeEvent?.kind === 'strikeRush' ? 2 : 1; // strike-rush hook
      for (let i = 0; i < n; i++) {
        const rock = rocks[i];
        if (!rock.hitThisFrame) continue;
        rock.hitThisFrame = false;
        // Heat glow (§13.1): the rock warms toward its spark tint while cut.
        rock.heat = Math.min(1, rock.heat + dt * 2.5);
        rock.heatedThisFrame = true;
        if (!rock.heatListed) {
          if (activeHeat.length < HEAT_CAP) {
            rock.heatListed = true;
            activeHeat.push(i);
          } else {
            rock.heatedThisFrame = false; // unlisted: no sweep will clear it
          }
        }
        // Hard rock resists: effective rate = head rate / extractResist.
        rock.extract += (rock.rawRate / ORE_TYPES[rock.oreKey].extractResist) * dt;
        while (rock.extract >= 1 && rock.ore > 0) {
          rock.extract -= 1;
          rock.ore -= 1;
          list[i].ore = rock.ore;
          writeFieldOre(builtSys, i, rock.ore, rock.seedOre);
          // Pod spawns at the beam contact point (or near the rock) with a
          // small random drift so the player scoops it on a flyby. Wave 51:
          // the pod carries the ore's tint (spawnPod's optional 5th arg).
          if (rock.hitPoint) {
            _podPos.copy(rock.hitPoint);
          } else {
            _podPos.copy(rock.position);
          }
          _podPos.x += (Math.random() - 0.5) * rock.baseScale;
          _podPos.y += (Math.random() - 0.5) * rock.baseScale;
          _podPos.z += (Math.random() - 0.5) * rock.baseScale;
          _drift.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(4);
          spawnPod(ctx, [{ commodity: rock.oreKey, units: yieldUnits }], _podPos, _drift, ORE_TYPES[rock.oreKey].podTint);
          if (rock.ore <= 0) deplete(i, rock);
        }
      }

      // --- Heat glow sweep: listed rocks cool ~0.8 s after the beam leaves ---
      for (let k = activeHeat.length - 1; k >= 0; k--) {
        const i = activeHeat[k];
        const rock = rocks[i];
        if (!rock.heatedThisFrame) rock.heat = Math.max(0, rock.heat - dt * 1.2);
        rock.heatedThisFrame = false;
        if (rock.heat <= 0) {
          rock.heatListed = false;
          activeHeat[k] = activeHeat[activeHeat.length - 1]; // swap-remove
          activeHeat.pop();
          _color.copy(rock.baseColor);
          if (rock.depleted) _color.multiplyScalar(0.35);
          rock.mesh.setColorAt(rock.instanceIndex, _color);
          rock.mesh.instanceColor.needsUpdate = true;
          continue;
        }
        if (reduced) {
          // Accessibility: static bright tint while hot, no animated lerp.
          _color.copy(rock.hotColor);
        } else {
          _color.copy(rock.baseColor).lerp(rock.hotColor, rock.heat * 0.85);
        }
        rock.mesh.setColorAt(rock.instanceIndex, _color);
        rock.mesh.instanceColor.needsUpdate = true;
      }
    },
  };
}
