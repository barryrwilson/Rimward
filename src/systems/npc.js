import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { styleFor, FACTION_STYLE } from '../game/faction-style.js'; // wave 37: faction visual identity
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
import { epicEffects } from '../game/epics.js';
import { spawnPod } from '../game/pods.js';
import {
  isBeautiful,
  sculptGrownHull,
  makePetalGeometry,
  makeTendrilGeometry,
  organicMaterials,
  tagSway,
  tagBreath,
  collectOrganic,
  animateOrganic,
} from './organic.js';

/**
 * NPC system — live NPC ships: procedural meshes + AI (doc §6.7, §7).
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
 * Wave 27 (Beautiful Ones organic technology): beautiful-faction ships are
 * GROWN, not built — buildBeautifulShip sculpts nacre hulls, orchid-petal
 * sail fins, and tendril tails from the organic.js toolkit instead of the
 * box/cone placeholder switch. Pirate-role beautiful ships use the
 * `tarnished` material variant (the fallen-Beautiful look). Grown groups
 * are named 'beautiful-ship' with userData.organic = { classKey, role,
 * tarnished }, a mint engine glow, and per-part sway/breath animated from
 * the update loop via animateOrganic (zero-alloc, frozen under
 * ctx.settings.reducedMotion). Geometries/materials are module-scope
 * cached and shared (factionMaterials pattern — never disposed).
 *
 * Wave 30 (§29 product test — "I paid one off, bluffed the other with hidden
 * mounts"): a hunting pirate that closes to U.TARGET_RANGE of the player
 * opens ONE demand hail before pressing the attack — 'payTribute' /
 * 'showTeeth' (only when ctx.world.concealedMounts === true) / 'refuseFight',
 * resolved in hail.js. While the card is open the pirate holds position
 * weapons-cold (ai.demanding); the parley voids if the player lands a hit,
 * and record.demandedAt (JSON-plain, persisted) enforces a per-record
 * cooldown across despawn/re-instantiation. Every pirate/ace entry into flee
 * mode (capitulate or hail resolution) also stamps record.wakeSite
 * { position: [x,y,z], found: false } — current position + forward heading ×
 * WAKE_SITE_DISTANCE (1400 = U.DEINSTANTIATE_RANGE in state.js, the range at
 * which traffic.js folds live ships back into records, so the site outlives
 * the fleeing ship) — the wake-trailing contract consumed by wakes.js.
 */

/**
 * Wave 47 (faction visual plan Phase 7): every faction ship renders from a
 * per-faction detail sculpt under src/systems/ships/<faction>.js. Ten factions
 * have authored sculpts (freehold, veridian, ferrous, redledger, gilded,
 * congregation, assembly, lamplighter, independent, hollow). Two channels:
 * `hull` (vertex-coloured MeshStandardMaterial, colours from FACTION_STYLE via
 * the SHADES/weather ladder) and `lights` (additive material in faction glow,
 * vertex-coloured near-whites that the material multiplies). Child order is
 * fixed: [0] hull mesh, [1] lights mesh (if the sculpt produced one), [2]
 * engine-glow sphere (always last, always userData.glow). Two materials total.
 *
 * Pirate-role ships bake a dulled variant via the same sculpt with
 * dullStyleFor (hull positions byte-identical, colours desaturated; lights
 * positions and colours unchanged because the lights channel carries no st
 * values). Factions without a sculpt (unknown keys) fall back to the wave-37
 * VC_PARTS tuple pipeline, producing a hull mesh and engine-glow sphere only.
 *
 * The unknowables faction has no hull (wave 42) and renders via
 * buildUnknowablesField. Beautiful factions delegate to buildBeautifulShip
 * (wave 27). Assets are module-shared and never disposed.
 */

import { detailBuilder } from './station-detail.js';
import { freeholdShip } from './ships/freehold.js';
import { veridianShip } from './ships/veridian.js';
import { ferrousShip } from './ships/ferrous.js';
import { redledgerShip } from './ships/redledger.js';
import { gildedShip } from './ships/gilded.js';
import { congregationShip } from './ships/congregation.js';
import { assemblyShip } from './ships/assembly.js';
import { lamplighterShip } from './ships/lamplighter.js';
import { independentShip } from './ships/independent.js';
import { hollowShip } from './ships/hollow.js';

// Wave 47: ten factions with authored ship sculpts. This table stays in lockstep
// with station.js DETAIL_STATIONS (10 keys) and gate.js OVERLAY_FACTIONS (9 keys).
// The two lore factions (independent, hollow) now have both station and ship art.
const DETAIL_SHIPS = {
  freehold: freeholdShip,
  veridian: veridianShip,
  ferrous: ferrousShip,
  redledger: redledgerShip,
  gilded: gildedShip,
  congregation: congregationShip,
  assembly: assemblyShip,
  lamplighter: lamplighterShip,
  independent: independentShip,
  hollow: hollowShip,
};

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

// ---------- procedural meshes (§13.1 silhouette-readable) ----------
// Wave 37 (user: "hard-core option"): built (non-organic) faction ships bake
// their FACTION_STYLE palette into VERTEX COLORS on merged geometry per
// faction×classKey (module-cached, shared, never disposed), so colour lives in
// the mesh and one shared MeshStandardMaterial dresses every hull in the game.
// Patchwork factions (freehold, redledger, lamplighter…) cycle style.patch
// across plates and pods.
// Wave 47 corrects the draw-call arithmetic this comment used to claim: a
// sculpt ship is THREE meshes — hull, lights, engine glow — on TWO materials
// (vcMaterial plus the faction's additive glow material, which the lights chunk
// and the glow sphere share). A fallback ship is two meshes on those same two
// materials. The material CAP is what the wave-39 resource pin cares about;
// mesh count was never the constraint.
const vcMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.60, metalness: 0.28,
});
vcMaterial.userData.shared = true;

// Part spec: [makeGeometry, colorRole, x,y,z, rx,ry,rz, sx,sy,sz]. colorRole
// is a FACTION_STYLE key or 'patch0'..'patchN' (cycled modulo patch length).
// Rotations/scales are BAKED into the merged geometry (Euler order matches
// the old mesh.rotation semantics via Matrix4).
const VC_PARTS = {
  freighter: [
    [() => new THREE.BoxGeometry(3.6, 3, 9), 'hull'],
    [() => new THREE.BoxGeometry(2.2, 1.4, 2), 'trim', 0, 1.9, -2.5], // cab
    [() => new THREE.BoxGeometry(1.4, 1.4, 2.6), 'patch0', -2.4, 0, 1.6],
    [() => new THREE.BoxGeometry(1.4, 1.4, 2.6), 'patch1', 2.4, 0, 1.6],
    [() => new THREE.BoxGeometry(1.4, 1.4, 2.6), 'patch2', -2.4, 0, -1.6],
    [() => new THREE.BoxGeometry(1.4, 1.4, 2.6), 'patch0', 2.4, 0, -1.6],
  ],
  cutter: [
    [() => new THREE.ConeGeometry(1.1, 7, 6), 'hull', 0, 0, 0, -Math.PI / 2],
    [() => new THREE.BoxGeometry(3.4, 0.15, 1.6), 'trim', 0, 0, 2.2],
    [() => new THREE.BoxGeometry(0.15, 1.6, 1.4), 'accent', 0, 0.7, 2.4],
  ],
  heavy: [
    [() => new THREE.BoxGeometry(7, 2, 6), 'hull'],
    [() => new THREE.ConeGeometry(2.6, 4, 4), 'hullDark', 0, 0, -5, -Math.PI / 2, Math.PI / 4, 0, 1.35, 0.55, 1],
    [() => new THREE.BoxGeometry(8.6, 0.4, 2.4), 'trim', 0, 0.9, 1.6],
  ],
  frigate: [
    [() => new THREE.BoxGeometry(24.5, 7, 21), 'hull'],
    [() => new THREE.ConeGeometry(9.1, 14, 4), 'hullDark', 0, 0, -17.5, -Math.PI / 2, Math.PI / 4, 0, 1.35, 0.55, 1],
    [() => new THREE.BoxGeometry(30.1, 1.4, 8.4), 'trim', 0, 3.15, 5.6],
  ],
  ace: [
    [() => new THREE.OctahedronGeometry(1.6, 0), 'hull', 0, 0, 0, 0, 0, 0, 0.9, 0.55, 3.2],
    [() => new THREE.TorusGeometry(1.3, 0.14, 6, 18), 'accent', 0, 0, 0.6],
    [() => new THREE.BoxGeometry(0.14, 1.8, 1.8), 'trim', 0, 0.8, 2.4],
  ],
  light: [
    [() => new THREE.ConeGeometry(0.9, 5, 6), 'hull', 0, 0, 0, -Math.PI / 2],
    [() => new THREE.BoxGeometry(2.4, 0.12, 1.2), 'trim', 0, 0, 1.6],
  ],
};
const GLOW_Z = { freighter: 4.8, cutter: 3.6, heavy: 3.2, frigate: 11.2, ace: 4.6, light: 2.8 };


const _vcColor = new THREE.Color();
const _vcMatrix = new THREE.Matrix4();
const _vcEuler = new THREE.Euler();

/** Bake one part spec into a positioned, vertex-colored geometry. */
function colorPart(spec, st) {
  const [make, role, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1] = spec;
  let geo = make();
  if (geo.index) { const ni = geo.toNonIndexed(); geo.dispose(); geo = ni; } // mergeGeometries needs uniform indexing
  if (sx !== 1 || sy !== 1 || sz !== 1) geo.scale(sx, sy, sz);
  if (rx || ry || rz) geo.applyMatrix4(_vcMatrix.makeRotationFromEuler(_vcEuler.set(rx, ry, rz)));
  geo.translate(x, y, z);
  const hex = role === 'hull' ? st.hull
    : role === 'hullDark' ? st.hullDark
    : role === 'trim' ? st.trim
    : role === 'accent' ? st.accent
    : role === 'glow' ? st.glow // wave 38: emissive-tint parts (domes, optics, lamps)
    : role === 'beacon' ? st.beacon
    : st.patch[(Number(role.slice(5)) || 0) % st.patch.length];
  _vcColor.setHex(hex);
  const n = geo.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    col[i * 3] = _vcColor.r; col[i * 3 + 1] = _vcColor.g; col[i * 3 + 2] = _vcColor.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

// Wave 38: pirate-role kit ships bake a scarred/dulled variant of the same
// spec (the tarnished-Beautiful precedent, within the 2-material cap) — same
// FACTION_STYLE fields, desaturated ~50% toward their own luminance and
// dimmed to 72%, cached once per faction (never disposed).
const _dullColor = new THREE.Color();
function dullHex(hex) {
  _dullColor.setHex(hex);
  const l = _dullColor.r * 0.3 + _dullColor.g * 0.59 + _dullColor.b * 0.11;
  _dullColor.r += (l - _dullColor.r) * 0.5;
  _dullColor.g += (l - _dullColor.g) * 0.5;
  _dullColor.b += (l - _dullColor.b) * 0.5;
  _dullColor.multiplyScalar(0.72);
  return _dullColor.getHex();
}
// faction → dulled style record (hull/hullDark/trim/accent/patch). Keyed by the
// canonical faction, own-key read: see canonFaction and glowMatFor.
const dulledStyles = {};
function dullStyleFor(faction) {
  const key = canonFaction(faction);
  let d = Object.hasOwn(dulledStyles, key) ? dulledStyles[key] : undefined;
  if (!d) {
    const st = styleFor(key);
    d = {
      hull: dullHex(st.hull), hullDark: dullHex(st.hullDark),
      trim: dullHex(st.trim), accent: dullHex(st.accent),
      glow: st.glow, beacon: st.beacon, // running lights stay lit
      patch: st.patch.map(dullHex),
    };
    dulledStyles[key] = d;
  }
  return d;
}

// ---------- per-sculpt collision proxy derivation ----------
// Radial percentile q: drives rx and ry (the ellipse semi-axes in local XY).
// Verified across all 18 rebuilt sculpts (veridian, ferrous, freehold × 6
// classes) — at 0.90, every sculpt clears radial coverage and proxyFit ≤
// +25/+25/+35. Typical radial coverage at 0.90 is 88-91%.
const PROXY_PERCENTILE = 0.90;
// Longitudinal percentile q_z: target for the halfLen computation, applied
// before the fit-ceiling cap (see deriveProxy). Must be high enough that pz
// reaches or exceeds the ceiling for wide/stocky ships; 0.97 is sufficient.
const PROXY_PERCENTILE_Z = 0.97;

/**
 * Derive an elliptical collision proxy from a hull geometry.
 *
 * Returns { rx, ry, halfLen } in object-local units:
 *   rx      = scaling × spanX/2  where scaling is PROXY_PERCENTILE-th percentile of
 *             the normalised 2-D radial distance sqrt((x/hX)²+(y/hY)²) over all vertices
 *   ry      = scaling × spanY/2
 *   halfLen = min( PROXY_PERCENTILE_Z-th percentile of |z|,
 *                  0.67 · spanZ − max(rx, ry) )   clamped ≥ 0
 *
 *   The second operand of min() approximates the proxyFit +35% length ceiling
 *   (exact limit is 0.675 · spanZ; 0.67 is used for IEEE-754 robustness, giving
 *   ≤ +34% and eliminating rounding past the strict ≤ 35 check).
 *   For wide/stocky ships the ceiling is the binding constraint; for slender ships it
 *   is not reached and halfLen = pz (no correction from max(rx,ry) at all, because
 *   max_r is small relative to spanZ).
 *
 * WHY THE NORMALISED RADIAL, NOT INDEPENDENT AXIS PERCENTILES.
 * Taking the q-th percentile of |x| and |y| separately (the marginal approach)
 * cannot achieve 80 % coverage for hulls whose primary mass fills the bounding-box
 * corners — a hammerhead gunship or a broad freighter hull can leave 40–50 % of
 * its vertices outside the inscribed marginal-percentile ellipse at any fixed q.
 * The 2-D normalised radial distance sqrt((x/(spanX/2))²+(y/(spanY/2))²) folds the
 * two axes into a single distribution whose q-th percentile gives the smallest ellipse
 * (with aspect ratio matching the hull's own span) that encloses q-fraction of the
 * primary mass — exactly the coverage condition.
 *
 * WHY A PERCENTILE AND NOT A BOUNDING BOX.
 * Thin appendages (antennae, masts, cranes, docking spars, field wakes) contribute
 * very few vertices relative to the primary hull shell.  They therefore sit in the
 * high tail of the radial distribution and fall outside the PROXY_PERCENTILE-th ellipse
 * automatically.  A bolt can pass through a mast without registering a hull hit (bible §6),
 * and this is how that guarantee is preserved while the coverage pin still passes.
 *
 * WHY THE FIT CEILING BOUNDS halfLen.
 * A true capsule test (proxyCover) measures whether hull vertices lie inside the
 * ellipsoidal end caps as well as the cylindrical body.  For wide/stocky ships with
 * large max(rx,ry), the old formula halfLen = pz − max(rx,ry) placed the cap centres
 * so close to the hull origin that the majority of vertices fell in the end-cap zone
 * and failed the strict cap test, giving coverage as low as 44%.  Setting halfLen to
 * the proxyFit ceiling maximises the cylindrical body while remaining within the
 * agreed ≤+35% length overshoot, and drives coverage above 80% for all 18 sculpts.
 *
 * Deterministic and O(n) in vertex count (plus two O(n log n) sorts), runs once per
 * cached bake.  Trader and pirate bakes share byte-identical position data (the dulled
 * variant only changes vertex colours) and therefore derive the same proxy.
 */
export function deriveProxy(hullGeometry) {
  const pos = hullGeometry.attributes.position;
  const n = pos.count;

  // Guard: reject invalid hulls rather than caching NaN or zero semi-axes.
  // An empty buffer gives idx = -1 → NaN in typed-array read. A single-vertex
  // hull forces hiX = loX and hiY = loY, giving hX = 0 and hY = 0, and
  // testNpcHits divides by both semi-axes. Any such hull would produce a
  // corrupt proxy — return null so every caller falls back to
  // SHIP_SCALE[classKey].proxy, the same path used by hull-less ships such as
  // the Unknowables energy field. That fallback is deliberate and commented at
  // every call site.
  if (n < 1) return null;

  // Pass 1: bounding-box spans in X, Y, and Z.
  // X/Y half-spans normalise the radial distance; spanZ enforces the proxyFit
  // length ceiling when computing halfLen below.
  let hiX = -Infinity, loX = Infinity;
  let hiY = -Infinity, loY = Infinity;
  let hiZ = -Infinity, loZ =  Infinity;
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (x > hiX) hiX = x; if (x < loX) loX = x;
    if (y > hiY) hiY = y; if (y < loY) loY = y;
    if (z > hiZ) hiZ = z; if (z < loZ) loZ = z;
  }
  const hX = (hiX - loX) * 0.5; // half-span X — scale reference for radial
  const hY = (hiY - loY) * 0.5; // half-span Y
  const spanZ = hiZ - loZ;      // full Z span — used for fit-ceiling cap below

  // A hull with zero X or Y span yields rx or ry = 0; testNpcHits divides by
  // both semi-axes on every hit test — reject rather than cache a zero divisor.
  if (hX === 0 || hY === 0) return null;

  // Pass 2: normalised 2-D radial distances and |z| into typed arrays (in-place sort,
  // zero extra allocation beyond the two arrays).
  const radii = new Float32Array(n);
  const az    = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = x / hX;
    const ny = y / hY;
    radii[i] = Math.sqrt(nx * nx + ny * ny);
    az[i]    = Math.abs(z);
  }
  radii.sort();
  az.sort();

  // Radial semi-axes: PROXY_PERCENTILE of the normalised radial distribution.
  const idxR = Math.min(Math.floor(PROXY_PERCENTILE   * n), n - 1);
  const s    = radii[idxR]; // scale factor: PROXY_PERCENTILE-th normalised radial
  const rx   = s * hX;
  const ry   = s * hY;

  // halfLen: target pz (high z-percentile), capped safely below the proxyFit +35% ceiling.
  //
  // The fit ceiling expressed as a halfLen limit:
  //   2·(halfLen + max(rx,ry)) ≤ 1.35·spanZ  →  halfLen ≤ 0.675·spanZ − max(rx,ry)
  //
  // We use 0.67 (giving ≤ 34% length overshoot) rather than the exact 0.675.
  // 0.675·spanZ is not exactly representable in IEEE 754 so the computed lengthPct
  // lands at 35.0000...01 and the harness's strict ≤ 35 check fails.  The 1% margin
  // is free — it costs negligible halfLen (≤ 0.035 u for a 7-unit hull) while making
  // the fit pass robust to the sculpt's specific FP environment.
  //
  // For wide/stocky ships, pz always exceeds this ceiling so halfLen is capped here —
  // maximising the cylindrical body (and therefore coverage) without exceeding the fit
  // budget.  For slender ships pz is below the ceiling and halfLen = pz (no correction
  // from max(rx,ry) at all, because max_r is small relative to spanZ).
  const idxZ      = Math.min(Math.floor(PROXY_PERCENTILE_Z * n), n - 1);
  const pz        = az[idxZ]; // PROXY_PERCENTILE_Z-th percentile of |z|
  const maxHalfLen = 0.67 * spanZ - Math.max(rx, ry); // proxyFit ≤ +34% — FP-safe margin
  const halfLen   = Math.max(0, Math.min(pz, maxHalfLen));
  return { rx, ry, halfLen };
}

// 'faction:classKey[:pirate]' → { hull, lights } (shared, never disposed). Both
// halves of the key are save-controlled, so the key is JSON — `faction:'a:b',
// classKey:'c'` and `faction:'a', classKey:'b:c'` would collide under plain
// concatenation and silently render each other's hull.
const shipGeos = {};

/**
 * The faction a lookup should actually use. record.faction is save-controlled
 * and may be any string, including a prototype-chain name; every key that is
 * not a sculpt faction renders the SAME fallback bake, because styleFor()
 * answers with the independent palette for all of them. Collapsing them here
 * keeps the never-disposed caches bounded by the faction table rather than by
 * whatever a save file happens to contain.
 */
function canonFaction(faction) {
  if (Object.hasOwn(DETAIL_SHIPS, faction)) return faction;
  return Object.hasOwn(FACTION_STYLE, faction) ? faction : 'independent';
}

function shipGeosFor(classKey, faction, pirate = false) {
  // own-key lookups throughout: record.faction/classKey are save-controlled
  // strings, and a raw bracket read resolves '__proto__'/'constructor'/
  // 'toString' through Object.prototype to a truthy non-spec value.
  const kit = Object.hasOwn(DETAIL_SHIPS, faction) ? DETAIL_SHIPS[faction] : undefined;
  const dulled = pirate && kit !== undefined;
  const key = JSON.stringify([kit ? faction : 'unknown', classKey, dulled]);
  const cached = Object.hasOwn(shipGeos, key) ? shipGeos[key] : undefined;
  if (cached) return cached;

  // Fallback: unknown faction keys render the wave-37 VC_PARTS pipeline
  if (!kit) {
    const st = styleFor(canonFaction(faction));
    const spec = Object.hasOwn(VC_PARTS, classKey) ? VC_PARTS[classKey] : VC_PARTS.light;
    const parts = spec.map((p) => colorPart(p, st));
    const hull = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    shipGeos[key] = { hull, lights: null, proxy: deriveProxy(hull) };
    return shipGeos[key];
  }

  // Detail sculpt path: call the kit's build through the detail builder
  const st = dulled ? dullStyleFor(faction) : styleFor(faction);
  const classSpec = Object.hasOwn(kit, classKey) ? kit[classKey] : kit.light;
  const b = detailBuilder();
  classSpec.build(b, st);
  const geos = b.build();

  // Require both channels — a missing one throws, naming the sculpt and channel
  if (!geos.hull) throw new Error(`${faction} ${classKey} ship sculpt emitted no 'hull' chunk`);
  if (!geos.lights) throw new Error(`${faction} ${classKey} ship sculpt emitted no 'lights' chunk`);

  shipGeos[key] = { ...geos, proxy: deriveProxy(geos.hull) };
  return shipGeos[key];
}

/** Stern offset for the engine glow: per-sculpt glowZ, else the wave-37 GLOW_Z table. */
function glowZFor(classKey, faction) {
  const kit = Object.hasOwn(DETAIL_SHIPS, faction) ? DETAIL_SHIPS[faction] : undefined;
  if (kit) return (Object.hasOwn(kit, classKey) ? kit[classKey] : kit.light).glowZ;
  return Object.hasOwn(GLOW_Z, classKey) ? GLOW_Z[classKey] : GLOW_Z.light;
}
// faction → engine glow material in style.glow (shared, never disposed). Keyed by
// the CANONICAL faction (see shipGeosFor): every unknown key wears the
// independent palette, so they share one material instead of minting one per
// bogus string. Own-key reads only — `vcGlowMats['__proto__']` would otherwise
// return the cache object's prototype and hand a non-Material to a live Mesh.
const vcGlowMats = {};
function glowMatFor(faction) {
  const key = canonFaction(faction);
  let m = Object.hasOwn(vcGlowMats, key) ? vcGlowMats[key] : undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({
      color: styleFor(key).glow,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });
    m.userData.shared = true;
    vcGlowMats[key] = m;
  }
  return m;
}

// Wave 42: cell offsets for the 6 floating cells (shared by geometry cache and builder)
const UNKNOWABLES_CELL_OFFSETS = [
  { x: 1.2, y: 0.4, z: 0.8 },
  { x: -0.9, y: 0.6, z: 1.0 },
  { x: 0.5, y: -0.5, z: 1.1 },
  { x: -0.7, y: 0.3, z: -0.6 },
  { x: 0.8, y: 0.7, z: -0.4 },
  { x: -1.0, y: -0.4, z: 0.5 },
];
// Wave 42: per-part animation axes for the unknowables field (loops and arcs
// spin on their own axis; cells drift on a cycled axis). Read by
// buildUnknowablesField when it allocates the per-ship animation records.
const LOOP_AXES = ['x', 'y', 'z'];
const ARC_AXES = ['z', 'x'];
const CELL_AXES = ['x', 'y', 'z'];

// Wave 42 (unknowables field): no-hull energy field — nested magnetic loops,
// lensing arcs, floating cells, core. Geometries cached per classKey, materials
// shared globally. No VC kit, no ':pirate' bake. All resources are module-shared
// and never disposed.
const unknowablesGeos = {}; // classKey → { loops, arcs, cells, core, scale } (shared, never disposed)
const unknowablesMats = {}; // material type → shared MeshBasicMaterial

function unknowablesMatFor(colorHex) {
  // colorHex is a number from FACTION_STYLE, so it cannot name a prototype
  // member — but the cache is read own-key anyway, for the same reason as its
  // siblings: one bracket read on an unguarded object is the whole bug class.
  let m = Object.hasOwn(unknowablesMats, colorHex) ? unknowablesMats[colorHex] : undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    m.userData.shared = true;
    unknowablesMats[colorHex] = m;
  }
  return m;
}

function unknowablesGeosFor(classKey) {
  // own-key read: classKey is save-controlled, and `unknowablesGeos['__proto__']`
  // would return the cache object's prototype, which buildUnknowablesField then
  // dereferences as `spec.loops[0]`.
  const cached = Object.hasOwn(unknowablesGeos, classKey) ? unknowablesGeos[classKey] : undefined;
  if (cached) return cached;

  // Size scale based on classKey (frigate > heavy > freighter > cutter/ace > light)
  const scales = {
    frigate: 3.2,
    heavy: 2.2,
    freighter: 1.8,
    cutter: 1.2,
    ace: 1.0,
    light: 0.8,
  };
  const scale = Object.hasOwn(scales, classKey) ? scales[classKey] : 1.0;

  // Nested magnetic loops: three rings on MUTUALLY PERPENDICULAR planes
  // (a gyroscope, not three near-coplanar hoops — small offsets collapse
  // into one ring at flight distance). Radii step inward and the outermost
  // sits forward of the innermost so the field carries a heading along -Z.
  const loops = [
    new THREE.TorusGeometry(2.4 * scale, 0.055 * scale, 6, 28),
    new THREE.TorusGeometry(1.9 * scale, 0.05 * scale, 6, 24),
    new THREE.TorusGeometry(1.4 * scale, 0.045 * scale, 6, 20),
  ];
  loops[0].translate(0, 0, -0.9 * scale); // bow ring, in the XY plane
  loops[1].rotateX(Math.PI / 2); // XZ plane
  loops[2].rotateY(Math.PI / 2); // YZ plane
  loops[2].translate(0, 0, 0.9 * scale); // stern ring
  loops.forEach(g => { g.userData.shared = true; });

  // Lensing arcs: two wide sweeps OUTSIDE the loop cage, thick enough to
  // read as gravitational distortion rather than more wire.
  const arcs = [
    new THREE.TorusGeometry(3.3 * scale, 0.13 * scale, 6, 28, 0, Math.PI * 0.75),
    new THREE.TorusGeometry(2.9 * scale, 0.10 * scale, 6, 24, 0, Math.PI * 0.55),
  ];
  arcs[0].rotateY(-Math.PI / 5);
  arcs[1].rotateX(Math.PI / 3);
  arcs.forEach(g => { g.userData.shared = true; });

  // Floating cells: small sparks inside the cage, not blocks. Alternating
  // sizes so the swarm reads as depth instead of a row of identical dice.
  const cells = [];
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.OctahedronGeometry((i % 2 === 0 ? 0.11 : 0.08) * scale, 0);
    geo.userData.shared = true;
    cells.push(geo);
  }

  // Core: the bright heart of the field (and the AI's engine-glow handle).
  const core = new THREE.SphereGeometry(0.42 * scale, 10, 8);
  core.userData.shared = true;

  const spec = { loops, arcs, cells, core, scale };
  unknowablesGeos[classKey] = spec;
  return spec;
}

// Wave 42: animate the Unknowables energy field. Zero-alloc — mutates mesh
// transforms in place. Parts preallocated at build time in fieldParts array.
// Under reducedMotion, returns immediately without resetting (parts freeze at
// their accumulated values). Materials are shared — never mutate them.
function animateField(parts, elapsed, reducedMotion) {
  if (reducedMotion) return;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const mesh = p.mesh;

    if (p.rotAxis) {
      // Rotating part (loops, arcs)
      const r = elapsed * p.rotHz * Math.PI * 2;
      switch (p.rotAxis) {
        case 'x':
          mesh.rotation.x = r;
          break;
        case 'y':
          mesh.rotation.y = r;
          break;
        case 'z':
          mesh.rotation.z = r;
          break;
      }
    } else if (p.driftAmp > 0 && (p.driftAxis === 'x' || p.driftAxis === 'y' || p.driftAxis === 'z')) {
      // Drifting cell (sine wave on its phase)
      const t = elapsed + p.phase;
      const s = Math.sin(t * 0.8) * p.driftAmp;
      switch (p.driftAxis) {
        case 'x':
          mesh.position.x = p.baseX + s;
          break;
        case 'y':
          mesh.position.y = p.baseY + s;
          break;
        case 'z':
          mesh.position.z = p.baseZ + s;
          break;
      }
    }
  }
}

let glowGeo = null;
let flashGeo = null;

// The engine-glow sphere is shared by every ship path. Wave 47: the faction
// glow material carries vertexColors (the lights chunk rides it too), and a
// vertexColors material with no colour attribute renders BLACK — so the shared
// geometry is baked all-white once, by whichever path asks for it first. The
// beautiful path's own material ignores the attribute and is unaffected.
function glowGeoShared() {
  if (!glowGeo) {
    glowGeo = new THREE.SphereGeometry(0.55, 8, 6);
    const n = glowGeo.attributes.position.count;
    glowGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  }
  return glowGeo;
}

// ---------- Beautiful Ones grown ships (wave 27) ----------
// Beautiful technology is grown, not built: sculpted nacre hulls,
// orchid-petal sail fins, tendril tails, gilt veining — zero straight
// edges. All geometry is cached per classKey at module scope and shared
// across every spawn (factionMaterials pattern — NEVER disposed); the
// tarnished ("fallen Beautiful" pirate) variant reuses the SAME geometries
// with the tarnished organicMaterials() set. Animation is part-level only
// (fin/tendril sway, hull/pod breath) — no per-vertex mutation, which stays
// unique to the player ship (ship.js). The shared veinGlow/membrane/flesh/
// gilt materials are never tagPulse'd (pulse params live on material
// userData — one slot; these are shared).
const beautifulGeos = {}; // classKey → { hull, fins, extras, tail, glowZ } (shared, never disposed)
let beautifulGlowMat = null; // mint engine glow (shared, never disposed)

function beautifulGeosFor(classKey) {
  let c = beautifulGeos[classKey];
  if (c) return c;
  switch (classKey) {
    case 'freighter': {
      // Salon barge: broad heavy hull, two grand petal sail fins swept
      // up/back, four pearl blister cargo pods slung ventrally, gilt keel.
      const hull = sculptGrownHull({
        spine: 2.3, midWiden: 2.8, tailStart: 1.4, tailRate: 1.0,
        flatten: 0.42, camber: 0.22, headBulge: 0.12,
      }).geo;
      hull.scale(1.8, 1.8, 1.8);
      const blister = new THREE.SphereGeometry(1, 18, 12);
      blister.scale(1.15, 0.75, 1.55);
      const keel = new THREE.SphereGeometry(1, 12, 8);
      keel.scale(0.16, 0.16, 3.4);
      const sailA = makePetalGeometry({ length: 5.4, width: 2.6, curl: 1.2, cup: 0.55 });
      const sailB = makePetalGeometry({ length: 5.4, width: 2.6, curl: 1.2, cup: 0.55 });
      c = {
        hull,
        glowZ: 3.9,
        fins: [
          { geo: sailA, x: 1.6, y: 0.8, z: 0.4, rx: -0.15, ry: -0.2, rz: -1.05, axis: 'z', amp: 0.07, hz: 0.32 },
          { geo: sailB, x: -1.6, y: 0.8, z: 0.4, rx: -0.15, ry: 0.2, rz: 1.05, axis: 'z', amp: 0.07, hz: 0.32 },
        ],
        extras: [
          { geo: blister, mat: 'flesh', x: 2.6, y: -0.85, z: 1.4, breath: { depth: 0.05, hz: 0.22 } },
          { geo: blister, mat: 'flesh', x: -2.6, y: -0.85, z: 1.4, breath: { depth: 0.05, hz: 0.22 } },
          { geo: blister, mat: 'flesh', x: 2.6, y: -0.85, z: -1.4, breath: { depth: 0.05, hz: 0.22 } },
          { geo: blister, mat: 'flesh', x: -2.6, y: -0.85, z: -1.4, breath: { depth: 0.05, hz: 0.22 } },
          { geo: keel, mat: 'gilt', x: 0, y: -0.8, z: 0.2 },
        ],
        tail: { geo: makeTendrilGeometry({ length: 3.4, radius: 0.22, sway: 0.4, taper: 0.25 }), x: 0, y: 0, z: 3.1, amp: 0.05, hz: 0.4 },
      };
      break;
    }
    case 'cutter': {
      // Slim predator ray: narrow fast profile (low midWiden, hard tail
      // whip), two swept petal fins, one dorsal petal crest.
      const hull = sculptGrownHull({
        spine: 2.5, midWiden: 1.5, tailStart: 1.1, tailRate: 2.3,
        flatten: 0.26, camber: 0.12, headBulge: 0.05,
      }).geo;
      hull.scale(1.2, 1.2, 1.2);
      const finA = makePetalGeometry({ length: 3.6, width: 1.5, curl: 0.55, cup: 0.3 });
      const finB = makePetalGeometry({ length: 3.6, width: 1.5, curl: 0.55, cup: 0.3 });
      c = {
        hull,
        glowZ: 2.85,
        fins: [
          { geo: finA, x: 0.9, y: 0.1, z: 0.1, rx: 0, ry: 0.85, rz: -0.25, axis: 'z', amp: 0.1, hz: 0.55 },
          { geo: finB, x: -0.9, y: 0.1, z: 0.1, rx: 0, ry: -0.85, rz: 0.25, axis: 'z', amp: 0.1, hz: 0.55 },
          { geo: makePetalGeometry({ length: 2.6, width: 0.9, curl: 0.7, cup: 0.25 }), x: 0, y: 0.4, z: -0.2, rx: -1.0, ry: 0, rz: 0, axis: 'y', amp: 0.06, hz: 0.5 },
        ],
        extras: [],
        tail: { geo: makeTendrilGeometry({ length: 3.4, radius: 0.12, sway: 0.55, taper: 0.2 }), x: 0, y: 0, z: 2.2, amp: 0.07, hz: 0.5 },
      };
      break;
    }
    case 'heavy':
    case 'frigate': {
      // Grand swan-manta: broad hull, tall dorsal sail crest curling
      // forward like a swan neck, gilt vein spine. Frigate runs ~1.6×
      // (mirroring the placeholder's larger relative scale; class size
      // ordering preserved).
      const k = classKey === 'frigate' ? 1.6 : 1;
      const s = 2.0 * k;
      const hull = sculptGrownHull({
        spine: 2.2, midWiden: 2.5, tailStart: 1.3, tailRate: 1.3,
        flatten: 0.34, camber: 0.2, headBulge: 0.1,
      }).geo;
      hull.scale(s, s, s);
      const spineGeo = new THREE.SphereGeometry(1, 12, 8);
      spineGeo.scale(0.14 * k, 0.14 * k, 2.8 * k);
      const finA = makePetalGeometry({ length: 4.4 * k, width: 1.7 * k, curl: 0.7 * k, cup: 0.35 * k });
      const finB = makePetalGeometry({ length: 4.4 * k, width: 1.7 * k, curl: 0.7 * k, cup: 0.35 * k });
      c = {
        hull,
        glowZ: 2.2 * s * 0.95,
        fins: [
          { geo: finA, x: 2.2 * k, y: 0.1 * k, z: 0.3 * k, rx: 0, ry: 0.7, rz: -0.2, axis: 'z', amp: 0.08, hz: 0.4 },
          { geo: finB, x: -2.2 * k, y: 0.1 * k, z: 0.3 * k, rx: 0, ry: -0.7, rz: 0.2, axis: 'z', amp: 0.08, hz: 0.4 },
          { geo: makePetalGeometry({ length: 5.0 * k, width: 1.6 * k, curl: 1.7 * k, cup: 0.4 * k }), x: 0, y: 0.95 * k, z: -0.4 * k, rx: -0.9, ry: 0, rz: 0, axis: 'y', amp: 0.05, hz: 0.3 },
        ],
        extras: [
          { geo: spineGeo, mat: 'gilt', x: 0, y: 0.95 * k, z: 0.9 * k },
        ],
        tail: { geo: makeTendrilGeometry({ length: 3.8 * k, radius: 0.18 * k, sway: 0.45 * k, taper: 0.22 }), x: 0, y: 0, z: 3.3 * k, amp: 0.05, hz: 0.35 },
      };
      break;
    }
    case 'ace': {
      // Duelist ray: elegant narrow hull; the placeholder's gilt crest ring
      // becomes a crown of gilt tendrils arcing back over the head —
      // recognizable at distance.
      const hull = sculptGrownHull({
        spine: 2.7, midWiden: 1.7, tailStart: 1.2, tailRate: 1.9,
        flatten: 0.24, camber: 0.14, headBulge: 0.07,
      }).geo;
      hull.scale(1.3, 1.3, 1.3);
      const crown = makeTendrilGeometry({ length: 1.8, radius: 0.07, sway: 0.5, taper: 0.12 });
      const finA = makePetalGeometry({ length: 3.4, width: 1.3, curl: 0.6, cup: 0.3 });
      const finB = makePetalGeometry({ length: 3.4, width: 1.3, curl: 0.6, cup: 0.3 });
      c = {
        hull,
        glowZ: 3.3,
        fins: [
          { geo: finA, x: 1.1, y: 0.1, z: 0.1, rx: 0, ry: 0.9, rz: -0.3, axis: 'z', amp: 0.12, hz: 0.6 },
          { geo: finB, x: -1.1, y: 0.1, z: 0.1, rx: 0, ry: -0.9, rz: 0.3, axis: 'z', amp: 0.12, hz: 0.6 },
        ],
        extras: [
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.55, ry: -0.6, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.55, ry: -0.3, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.62, ry: 0, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.55, ry: 0.3, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.55, ry: 0.6, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
        ],
        tail: { geo: makeTendrilGeometry({ length: 3.2, radius: 0.12, sway: 0.45, taper: 0.2 }), x: 0, y: 0, z: 2.6, amp: 0.06, hz: 0.55 },
      };
      break;
    }
    default: {
      // Light / unknown: small dart-ray.
      const hull = sculptGrownHull({
        spine: 2.1, midWiden: 1.9, tailStart: 1.2, tailRate: 1.8,
        flatten: 0.3, camber: 0.14, headBulge: 0.08,
      }).geo;
      const finA = makePetalGeometry({ length: 2.4, width: 1.1, curl: 0.45, cup: 0.28 });
      const finB = makePetalGeometry({ length: 2.4, width: 1.1, curl: 0.45, cup: 0.28 });
      c = {
        hull,
        glowZ: 2.0,
        fins: [
          { geo: finA, x: 0.7, y: 0.05, z: 0, rx: 0, ry: 0.95, rz: -0.3, axis: 'z', amp: 0.14, hz: 0.7 },
          { geo: finB, x: -0.7, y: 0.05, z: 0, rx: 0, ry: -0.95, rz: 0.3, axis: 'z', amp: 0.14, hz: 0.7 },
        ],
        extras: [],
        tail: { geo: makeTendrilGeometry({ length: 2.4, radius: 0.1, sway: 0.4, taper: 0.25 }), x: 0, y: 0, z: 1.6, amp: 0.08, hz: 0.6 },
      };
      break;
    }
  }
  c.proxy = deriveProxy(c.hull);
  beautifulGeos[classKey] = c;
  return c;
}

/**
 * Grow a Beautiful Ones ship (wave 27). Nose -Z, class-comparable scale.
 * `role` selects the material variant: pirates are tarnished (fallen
 * Beautiful). Every fin mesh is named 'beautiful-fin' and sway-tagged; the
 * hull breathes; the tendril tail sways gently. Sets userData.glow (mint,
 * shared geometry/material — consumers mutate scale/visible only),
 * userData.organic, and userData.organicParts for the update loop.
 */
function buildBeautifulShip(classKey, role) {
  role = role ?? SHIP_CLASSES[classKey]?.role ?? 'trader';
  const tarnished = role === 'pirate';
  const mats = organicMaterials({ tarnished });
  const spec = beautifulGeosFor(classKey);
  const g = new THREE.Group();
  g.name = 'beautiful-ship';

  // Nacre hull + mint vein-glow overlay shell riding just off the skin
  // (child of the hull so it inherits the breath scale).
  const hull = new THREE.Mesh(spec.hull, mats.flesh);
  tagBreath(hull, { depth: 0.012, hz: 0.16, phase: Math.random() * Math.PI * 2 });
  const veins = new THREE.Mesh(spec.hull, mats.veinGlow);
  veins.scale.setScalar(1.018);
  hull.add(veins);
  g.add(hull);

  // Petal fins: translucent membrane over a veinGlow liner that glows
  // through. Each fin sways on its tagged axis around its rest rotation.
  for (let i = 0; i < spec.fins.length; i++) {
    const f = spec.fins[i];
    const fin = new THREE.Mesh(f.geo, mats.membrane);
    fin.name = 'beautiful-fin';
    fin.position.set(f.x, f.y, f.z);
    fin.rotation.set(f.rx, f.ry, f.rz);
    tagSway(fin, { axis: f.axis, amp: f.amp, hz: f.hz, phase: Math.random() * Math.PI * 2 });
    const liner = new THREE.Mesh(f.geo, mats.veinGlow);
    liner.scale.set(0.92, 0.92, 0.97);
    liner.position.y = 0.02;
    fin.add(liner);
    g.add(fin);
  }

  // Class extras: blister cargo pods (breathing), gilt keel/vein spine,
  // ace gilt tendril crown (swaying).
  for (let i = 0; i < spec.extras.length; i++) {
    const e = spec.extras[i];
    const mesh = new THREE.Mesh(e.geo, e.mat === 'gilt' ? mats.gilt : mats.flesh);
    mesh.position.set(e.x, e.y, e.z);
    mesh.rotation.set(e.rx ?? 0, e.ry ?? 0, e.rz ?? 0);
    if (e.breath) tagBreath(mesh, { depth: e.breath.depth, hz: e.breath.hz, phase: Math.random() * Math.PI * 2 });
    if (e.sway) tagSway(mesh, { axis: e.sway.axis, amp: e.sway.amp, hz: e.sway.hz, phase: Math.random() * Math.PI * 2 });
    g.add(mesh);
  }

  // Tendril tail, gently swaying at the sculpted stern.
  const tail = new THREE.Mesh(spec.tail.geo, mats.flesh);
  tail.position.set(spec.tail.x, spec.tail.y, spec.tail.z);
  tagSway(tail, { axis: 'y', amp: spec.tail.amp, hz: spec.tail.hz, phase: Math.random() * Math.PI * 2 });
  g.add(tail);

  // Mint engine glow at the sculpted tail — same shared-geometry contract
  // as the standard glow (consumers mutate scale/visible only, so a second
  // shared material is safe).
  beautifulGlowMat ??= new THREE.MeshBasicMaterial({
    color: 0x7fe0a8,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeoShared(), beautifulGlowMat);
  glow.position.set(0, 0, spec.glowZ);
  g.add(glow);
  g.userData.glow = glow;

  // Proxy derived from the hull geometry; cached alongside the sculpt spec so
  // this is a cache hit on every build after the first.
  g.userData.proxy = spec.proxy;
  g.userData.organic = { classKey, role, tarnished };
  g.userData.organicParts = collectOrganic(g);
  return g;
}

/**
 * Build an Unknowables energy field ship (wave 42, Decision D3). No hull:
 * the group is a nested energy field (magnetic loops, lensing arcs, floating
 * cells, core). The core mesh at (0,0,0) serves two purposes: it is the visual
 * heart of the field AND the AI engine-glow handle (userData.glow), so its
 * scale and visibility belong exclusively to the AI glow contract (updateRoute,
 * engageTarget, updateDuel, updateDisabled all write live.object.userData.glow).
 * animateField must never touch the core, or the AI would overwrite it in the
 * same frame. Therefore fieldParts holds 11 animation records for the 11 moving
 * parts (3 loops + 2 arcs + 6 cells) while the group has 12 mesh children.
 *
 * @param {string} classKey - Ship class key
 * @returns {THREE.Group} Named 'unknowables-field', userData.fieldParts === 11
 */
function buildUnknowablesField(classKey) {
  const g = new THREE.Group();
  g.name = 'unknowables-field';

  const spec = unknowablesGeosFor(classKey);
  const style = styleFor('unknowables');

  // Materials from FACTION_STYLE.unknowables
  const loopMat = unknowablesMatFor(style.patch[0]); // ultraviolet
  const loopMatGlow = unknowablesMatFor(style.glow);  // blue glow
  const arcMat = unknowablesMatFor(style.accent);     // electric cyan
  const cellMat = unknowablesMatFor(style.beacon);    // white-gold
  const coreMat = unknowablesMatFor(style.beacon);    // white-gold core

  // Nested magnetic loops (3 tori)
  for (let i = 0; i < 3; i++) {
    const loop = new THREE.Mesh(spec.loops[i], i % 2 === 0 ? loopMat : loopMatGlow);
    loop.name = 'unknowables-loop';
    g.add(loop);
  }

  // Lensing arcs (2 partial tori)
  for (let i = 0; i < 2; i++) {
    const arc = new THREE.Mesh(spec.arcs[i], arcMat);
    arc.name = 'unknowables-arc';
    g.add(arc);
  }

  // Floating cells (6 octahedra)
  for (let i = 0; i < 6; i++) {
    const cell = new THREE.Mesh(spec.cells[i], cellMat);
    cell.name = 'unknowables-cell';
    cell.position.set(
      UNKNOWABLES_CELL_OFFSETS[i].x * spec.scale,
      UNKNOWABLES_CELL_OFFSETS[i].y * spec.scale,
      UNKNOWABLES_CELL_OFFSETS[i].z * spec.scale
    );
    g.add(cell);
  }

  // Core at center (0, 0, 0). This mesh is both the visual heart of the field
  // AND the AI engine-glow handle (userData.glow). Its scale and visibility
  // belong exclusively to the AI glow contract (updateRoute, engageTarget,
  // updateDuel, updateDisabled all write live.object.userData.glow).
  // animateField must never touch this mesh, or the AI would overwrite it
  // in the same frame. Therefore the core is NOT in fieldParts.
  const core = new THREE.Mesh(spec.core, coreMat);
  core.name = 'unknowables-core';
  g.add(core);
  g.userData.glow = core;

  // Per-ship animation records — allocated here, at build time, and mutated
  // in place by animateField (the shared caches are never written to after
  // they are filled). Child order is the boot-pinned order above:
  // loops 0-2, arcs 3-4, cells 5-10, core 11 (NOT animated — see ruling above).
  // fieldParts.length === 11 for the 11 moving parts only.
  const parts = [];
  for (let i = 0; i < 3; i++) {
    parts.push({
      mesh: g.children[i], rotAxis: LOOP_AXES[i], rotHz: 0.15 + i * 0.08,
      phase: 0, driftAmp: 0, driftAxis: null, baseX: 0, baseY: 0, baseZ: 0,
    });
  }
  for (let i = 0; i < 2; i++) {
    parts.push({
      mesh: g.children[3 + i], rotAxis: ARC_AXES[i], rotHz: 0.08 + i * 0.04,
      phase: 0, driftAmp: 0, driftAxis: null, baseX: 0, baseY: 0, baseZ: 0,
    });
  }
  for (let i = 0; i < 6; i++) {
    const off = UNKNOWABLES_CELL_OFFSETS[i];
    parts.push({
      mesh: g.children[5 + i], rotAxis: null, rotHz: 0,
      phase: i * (Math.PI * 2 / 6), driftAmp: 0.15 * spec.scale,
      driftAxis: CELL_AXES[i % 3],
      baseX: off.x * spec.scale, baseY: off.y * spec.scale, baseZ: off.z * spec.scale,
    });
  }
  // Child 11 (the core) is deliberately absent from `parts` — it is
  // userData.glow and belongs to the AI glow contract (updateRoute,
  // engageTarget, updateDuel, updateDisabled all write it every frame).
  g.userData.fieldParts = parts;

  return g;
}

/**
 * Build a faction-colored ship mesh. Nose points along local -Z (ship.js
 * convention). Beautiful-Ones factions delegate to buildBeautifulShip
 * (wave 27: grown organic hulls; `role` selects the tarnished fallen-
 * Beautiful material variant for pirates); `unknowables` delegates to
 * buildUnknowablesField (wave 42: the no-hull energy field). Every other
 * faction renders from a detail sculpt under src/systems/ships/<faction>.js.
 * Two channels: hull (vertex-coloured MeshStandardMaterial) and lights
 * (additive material in faction glow, vertex-coloured near-whites). Child
 * order is fixed: [0] hull mesh, [1] lights mesh (if the sculpt produced one),
 * [2] engine-glow sphere (always last, always userData.glow). Two materials
 * total. Pirate role builds a dulled variant via the same sculpt (hull colours
 * desaturated; lights unchanged). Factions without a sculpt fall back to the
 * wave-37 VC_PARTS pipeline (hull mesh + engine-glow sphere only).
 */
export function buildShipMesh(classKey, faction, role) {
  if (isBeautiful(faction)) return buildBeautifulShip(classKey, role);
  // Unknowables: no hull geometry — buildUnknowablesField returns a pure energy
  // field with no 'hull' channel, so no proxy can be derived.  userData.proxy is
  // left unset; testNpcHits falls back to SHIP_SCALE[classKey].proxy.
  if (faction === 'unknowables') return buildUnknowablesField(classKey);
  const g = new THREE.Group();
  const { hull, lights, proxy } = shipGeosFor(classKey, faction, role === 'pirate');
  g.add(new THREE.Mesh(hull, vcMaterial));
  if (lights) g.add(new THREE.Mesh(lights, glowMatFor(faction)));

  // Small engine-glow point at the stern, in the faction's style.glow.
  // Animated via scale/visible only so the material stays shared across
  // every ship of the faction. The material MULTIPLIES vertex colours, so
  // the shared geometry needs an all-white color attribute or it renders black.
  const glow = new THREE.Mesh(glowGeoShared(), glowMatFor(faction));
  glow.position.set(0, 0, glowZFor(classKey, faction));
  g.add(glow);
  g.userData.glow = glow;
  // Proxy derived once from the hull geometry by deriveProxy (npc.js) and
  // cached in shipGeos alongside the merged geometry — this is a cache hit.
  g.userData.proxy = proxy;
  return g;
}

/**
 * Drive one ship mesh's own animation outside the AI loop — the models
 * browser shows a hull with nobody flying it, and a Beautiful hull that does
 * not breathe or an Unknowables field that does not turn reads as a bug.
 * This is the visual half of update()'s per-ship block: the organic sway/
 * breath walk and the energy-field spin. Engine-glow scale/visibility stays
 * out — that channel belongs to the AI (updateRoute/engageTarget/updateDuel/
 * updateDisabled all write userData.glow every frame) and has no meaning for
 * a parked model. Zero-alloc; both helpers freeze under reducedMotion.
 */
export function animateShipMesh(object, elapsed, reducedMotion = false) {
  const op = object.userData.organicParts;
  if (op) animateOrganic(op, elapsed, reducedMotion);
  const fp = object.userData.fieldParts;
  if (fp) animateField(fp, elapsed, reducedMotion);
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
  const object = record.qship === true && !record.revealed
    ? buildShipMesh(record.coverClass ?? 'freighter', record.coverFaction ?? record.faction, 'trader')
    : buildShipMesh(record.classKey, record.faction, record.role ?? SHIP_CLASSES[record.classKey]?.role ?? 'trader');
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
  if (st.cargo.length > 0) intents.push('demandCargo');
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
        // Wave 27: grown Beautiful-Ones ships breathe/sway. Driven BEFORE the
        // disabled branch — a surrendered/engine-out living hull still
        // breathes (it is alive, not destroyed). ctx.elapsed is the
        // visual-animation clock (ship.js/gate.js/station.js convention;
        // `now` is the game-logic clock). Zero-alloc; no-op under
        // reducedMotion.
        const op = live.object.userData.organicParts;
        if (op) animateOrganic(op, ctx.elapsed, reducedMotion);
        // Wave 42: Unknowables energy field animation.
        const fp = live.object.userData.fieldParts;
        if (fp) animateField(fp, ctx.elapsed, reducedMotion);
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
