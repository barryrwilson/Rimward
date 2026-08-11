import * as THREE from 'three';

/**
 * Organic toolkit (wave 27) — the shared look/animation module for the
 * Beautiful Ones, whose technology is grown, not built. Every beautiful-
 * faction ship, station, gate overgrowth, and landmark sculpts from these
 * primitives instead of the box/cone/cylinder placeholder modeling used by
 * the other factions.
 *
 * DESIGN LANGUAGE (faded glamor — beauty kept past its usefulness):
 *   grown nacre/pearl shell, sweeping ray/swan curves, orchid-petal sail
 *   fins, tendril tails, chandelier light clusters, gilt veining. Zero
 *   straight edges on organic parts. Palette lives in ORGANIC below; the
 *   faction color is mint 0x7fe0a8. The `tarnished` material variant is the
 *   "fallen Beautiful" pirate look: nacre dulled toward grey-mauve, mint
 *   bioluminescence dimmed.
 *
 * ANIMATION CONTRACT: NPC organics animate by PART-LEVEL TRANSFORMS ONLY
 * (fin/tendril sway, whole-part breath scale, emissive/opacity pulse) —
 * per-vertex hull mutation stays unique to the player ship (ship.js).
 * Producers tag parts with tagSway/tagBreath/tagPulse at build time, walk
 * the assembly ONCE with collectOrganic, then call animateOrganic(parts, t,
 * ctx.settings.reducedMotion) per frame. animateOrganic mutates only
 * transforms/material scalars from stashed bases: ZERO allocation per call
 * (no closures, arrays, or object literals), and a complete no-op under
 * reducedMotion (stashed bases remain in effect — everything freezes).
 *
 * Geometry builders allocate at build time only. Materials from
 * organicMaterials() are cached per variant at module scope and shared
 * across instances; they are NEVER disposed. All canvas textures are
 * deterministic (seeded PRNG, ship.js makeVeinTexture pattern) so the look
 * is stable run-to-run.
 */

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

/** Beautiful Ones organic palette. */
export const ORGANIC = {
  nacre: 0xe9dccf, // pearl flesh
  nacreShadow: 0x8a7a6d, // shaded nacre
  deepFlesh: 0x24423c, // deep body / emissive floor
  mint: 0x7fe0a8, // faction bioluminescence
  mintHot: 0xb8ffd8, // hot bioluminescent core
  gilt: 0xc9a86a, // aged gold veining/trim
  opal: 0xd8c8f0, // opal accent
  // Wave 33 (bloom station v2): the glassy lagoon-teal + warm-amber look of
  // the reference render — translucent veined petal-arms over lit golden
  // chambers, teal node orbs at the arm roots.
  lagoon: 0x2e8f86, // glassy deep teal skin (translucent)
  lagoonHot: 0x6fe0d0, // glowing node-orb teal
  amber: 0xffc978, // warm golden interior glow (lit chambers)
  // Wave 48 (the Bloom detail pass): the reference's coral colonies on the
  // bone lattice. Accents ONLY — they colonise the filigree, they are never a
  // structural colour, and they are the two additions the bloomPaletteOrganic
  // pin allows beyond nacre/nacreShadow/gilt/deepFlesh.
  coral: 0xd98aa0, // rose coral stem
  coralDeep: 0x9a5f8c, // violet coral head
};

// Tarnished ("fallen Beautiful") shifts.
const TARNISHED_NACRE = 0x9a8a8c; // grey-mauve
const TARNISHED_GILT = 0x8a7452;
const TARNISHED_DIM = 0.6; // mint dimmed ~40%

const TAU = Math.PI * 2;

/** faction id check — the only consumer of the beautiful look. */
export function isBeautiful(faction) {
  return faction === 'beautiful';
}

// ---------------------------------------------------------------------------
// Deterministic PRNG (ship.js mulberry/Lehmer-style; guards the seed-0 trap)
// ---------------------------------------------------------------------------
function makeRand(seed) {
  let s = ((seed | 0) % 2147483646) + 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// ---------------------------------------------------------------------------
// Canvas textures (deterministic, sRGB)
// ---------------------------------------------------------------------------

/**
 * Subtle pearl iridescence: soft vertical cream/pink/mint bands with faint
 * noise speckle. Tiles horizontally (RepeatWrapping both ways).
 */
export function makeNacreTexture() {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');

  // Cream base.
  g.fillStyle = '#e9dccf';
  g.fillRect(0, 0, w, h);

  // Soft vertical iridescent bands: hue drifts cream → pink → mint → opal
  // along x via layered sines; wrap-safe because the blend is periodic.
  const rand = makeRand(4177);
  for (let x = 0; x < w; x++) {
    const t = x / w;
    const a = Math.sin(t * TAU * 3 + 0.7) * 0.5 + 0.5; // pink band phase
    const b = Math.sin(t * TAU * 5 + 2.1) * 0.5 + 0.5; // mint band phase
    const c = Math.sin(t * TAU * 2 + 4.4) * 0.5 + 0.5; // opal band phase
    const r = 233 + (244 - 233) * a - 10 * b;
    const gg = 220 + (214 - 220) * a + (240 - 220) * b - 8 * c;
    const bl = 207 + (228 - 207) * a + (216 - 207) * b + (240 - 207) * c * 0.6;
    g.fillStyle = `rgba(${r | 0},${gg | 0},${bl | 0},0.35)`;
    g.fillRect(x, 0, 1, h);
  }

  // Faint nacre noise speckle (deterministic).
  for (let i = 0; i < 900; i++) {
    const light = rand() > 0.5;
    g.fillStyle = light ? 'rgba(255,250,240,0.05)' : 'rgba(120,100,90,0.045)';
    g.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Bioluminescent vein texture: ship.js makeVeinTexture generalized —
 * branching random-walk lines on a dark background, wrap-safe across UV
 * seams, fully deterministic from `seed`. Default colors are the mint
 * family with an occasional opal thread.
 */
export function makeOrganicVeinTexture({ seed = 1337, colors, count = 42 } = {}) {
  const palette = colors || ['#7fe0a8', '#b8ffd8', '#d8c8f0'];
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

  const rand = makeRand(seed);

  for (let vein = 0; vein < count; vein++) {
    // Every 6th vein takes the accent color (opal by default), mirroring
    // ship.js's every-6th-magenta rhythm.
    const color = vein % 6 === 0 ? palette[2 % palette.length] : palette[vein % 2 === 0 ? 0 : 1 % palette.length];
    g.strokeStyle = color;
    g.shadowColor = color;
    g.lineWidth = 1 + rand() * 1.6;
    g.globalAlpha = 0.35 + rand() * 0.5;

    let x = rand() * w;
    let y = rand() * h;
    let angle = rand() * TAU;
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

/** Additive radial-gradient sprite texture (glow halos, chandelier buds). */
export function makeOrganicGlowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Sculpted geometry
// ---------------------------------------------------------------------------

/**
 * Sculpt a sphere into a grown hull (nose -Z, tail +Z): ship.js
 * makeLivingHull generalized with a tunable profile. Defaults reproduce the
 * living-ship silhouette exactly. Returns the geometry plus per-vertex
 * animation metadata: `base` is the PRISTINE deformed-position Float32Array
 * (mutate positions relative to it, never in place), `zNorm` runs 0 at nose
 * → 1 at tail, `wingness` runs 0 on the spine → 1 at the widest disc edge.
 *
 *   spine      z elongation (2.1 = living ship)
 *   midWiden   manta mid-body disc widen factor (2.3)
 *   tailStart  z past which the tail whips narrow (1.2)
 *   tailRate   tail width compression rate (1.6)
 *   flatten    vertical flatten factor (0.3)
 *   camber     dorsal camber height (0.16)
 *   headBulge  nose brow bulge height (0.08)
 *   widthSegs/heightSegs  sphere tessellation (64/40)
 */
export function sculptGrownHull({
  spine = 2.1,
  midWiden = 2.3,
  tailStart = 1.2,
  tailRate = 1.6,
  flatten = 0.3,
  camber = 0.16,
  headBulge = 0.08,
  widthSegs = 64,
  heightSegs = 40,
} = {}) {
  const geo = new THREE.SphereGeometry(1, widthSegs, heightSegs);
  const pos = geo.attributes.position;
  const count = pos.count;
  const base = new Float32Array(pos.array); // pristine copy
  const zNorm = new Float32Array(count); // 0 at nose → 1 at tail
  const wingness = new Float32Array(count); // 0 on spine → 1 at wingtips

  let zMin = Infinity;
  let zMax = -Infinity;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = base[i3];
    let y = base[i3 + 1];
    let z = base[i3 + 2];

    // Elongate into a spine.
    z *= spine;
    // Manta disc: widen mid-body, keep nose and tail narrow.
    const mid = Math.exp(-(z * z) * 0.35);
    x *= 1 + midWiden * mid;
    // Whip tail: compress width hard past tailStart.
    if (z > tailStart) x *= Math.exp(-(z - tailStart) * tailRate);
    // Flatten vertically; slight dorsal camber so the back is rounded.
    y *= flatten;
    y += camber * Math.exp(-(x * x * 0.4 + z * z * 0.3)) * (y > 0 ? 1 : 0.4);
    // Head bulge near the nose.
    if (z < -tailStart) y += headBulge * Math.exp(-((z + 1.6) * (z + 1.6)) * 2);

    base[i3] = x;
    base[i3 + 1] = y;
    base[i3 + 2] = z;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }

  const zSpan = zMax - zMin;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    zNorm[i] = (base[i3 + 2] - zMin) / zSpan;
    const w = (Math.abs(base[i3]) - 0.7) / midWiden;
    wingness[i] = Math.pow(Math.min(Math.max(w, 0), 1), 1.5);
  }

  pos.array.set(base);
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return { geo, base, zNorm, wingness, count };
}

/**
 * Hand-built parametric membrane petal/sail fin (orchid-petal look). Root
 * at the origin, extending along local +Z, width across local X, cupping
 * toward +Y. A (segs+1)² vertex grid, indexed and uv-mapped; cupped
 * parabolically across its width, curled progressively along its length,
 * tapering to a rounded closed tip. No three/examples imports.
 *
 *   length  root→tip extent along +Z (2)
 *   width   max span across X (1)
 *   curl    progressive +Y bend, ~world units at the tip (0.35)
 *   cup     cross-width parabolic lift of the edges (0.25)
 *   segs    grid resolution per axis (12)
 */
export function makePetalGeometry({ length = 2, width = 1, curl = 0.35, cup = 0.25, segs = 12 } = {}) {
  const n = segs + 1;
  const vcount = n * n;
  const positions = new Float32Array(vcount * 3);
  const uvs = new Float32Array(vcount * 2);
  const indices = new (vcount > 65535 ? Uint32Array : Uint16Array)(segs * segs * 6);

  for (let i = 0; i < n; i++) {
    const u = i / segs; // 0 root → 1 tip
    // Rounded-petal width profile: closed at root and tip, widest forward
    // of mid-length.
    const profile = Math.sin(Math.PI * Math.pow(u, 0.8));
    const curlY = curl * u * u; // progressive bend, zero at the root
    for (let j = 0; j < n; j++) {
      const v = j / segs; // 0..1 across the width
      const edge = 2 * v - 1; // -1..1
      const idx = i * n + j;
      positions[idx * 3] = edge * (width * 0.5) * profile;
      // Cup edges toward +Y; fade with profile so the tip closes cleanly.
      positions[idx * 3 + 1] = curlY + cup * edge * edge * profile;
      positions[idx * 3 + 2] = u * length;
      uvs[idx * 2] = u;
      uvs[idx * 2 + 1] = v;
    }
  }

  let k = 0;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * n + j;
      const b = (i + 1) * n + j;
      const c = i * n + j + 1;
      const d = (i + 1) * n + j + 1;
      indices[k++] = a;
      indices[k++] = b;
      indices[k++] = c;
      indices[k++] = b;
      indices[k++] = d;
      indices[k++] = c;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  return geo;
}

// Module-scope scratch for the tendril taper pass (build-time only).
const _taperCenter = new THREE.Vector3();

/**
 * Tendril tail: a tapered tube along a gentle S-curve. Root at the origin,
 * growing along local +Z with lateral S sway. Built from CatmullRomCurve3 +
 * TubeGeometry (both core three), then a second pass over the position
 * attribute scales each ring toward the curve centerline so the radius
 * falls from `radius` at the root to `radius * taper` at the tip.
 *
 *   length       root→tip extent along +Z (3)
 *   radius       tube radius at the root (0.12)
 *   sway         lateral S amplitude (0.35)
 *   taper        tip radius multiplier (0.3)
 *   radialSegs   ring resolution (6)
 *   tubularSegs  length resolution (24)
 */
export function makeTendrilGeometry({
  length = 3,
  radius = 0.12,
  sway = 0.35,
  taper = 0.3,
  radialSegs = 6,
  tubularSegs = 24,
} = {}) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(sway, sway * 0.15, length * 0.33),
    new THREE.Vector3(-sway * 0.8, -sway * 0.1, length * 0.66),
    new THREE.Vector3(sway * 0.4, 0, length),
  ]);
  const geo = new THREE.TubeGeometry(curve, tubularSegs, radius, radialSegs, false);

  // Taper pass: uv.x runs along the tube in TubeGeometry (uv.y is around
  // the ring), so scale each vertex toward the curve point at its u.
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    const s = 1 - (1 - taper) * u; // 1 at root → taper at tip
    curve.getPointAt(u, _taperCenter);
    pos.setXYZ(
      i,
      _taperCenter.x + (pos.getX(i) - _taperCenter.x) * s,
      _taperCenter.y + (pos.getY(i) - _taperCenter.y) * s,
      _taperCenter.z + (pos.getZ(i) - _taperCenter.z) * s,
    );
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Starfish arm: a tapered tube whose spine starts at the origin heading
 * local +Z, bends monotonically downward (−Y) to ≈ −droop at the tip
 * (z ≈ length), and carries one gentle lateral sinusoidal wave in X with
 * amplitude ≈ curl * length. Ring radius lerps rootRadius → tipRadius
 * with a slight mid-length bulge (r *= 1 + 0.15 * sin(π * t)) — the
 * starfish-arm profile. Built ring-by-ring along the spine with frames
 * from the analytic tangent (the bend is shallow, so a fixed up reference
 * is stable). Indexed, uv-mapped (u along the arm, v around the ring).
 *
 *   length       root→tip extent along +Z (22)
 *   rootRadius   ring radius at the root (3.2)
 *   tipRadius    ring radius at the tip (0.35)
 *   droop        downward −Y drop at the tip (7)
 *   curl         lateral wave amplitude factor, × length (0.12)
 *   radialSegs   ring resolution (10)
 *   tubularSegs  length resolution (28)
 */
export function makeStarfishArmGeometry({
  length = 22,
  rootRadius = 3.2,
  tipRadius = 0.35,
  droop = 7,
  curl = 0.12,
  radialSegs = 10,
  tubularSegs = 28,
} = {}) {
  const rings = tubularSegs + 1;
  const ringVerts = radialSegs + 1; // duplicate seam for clean uvs
  const vcount = rings * ringVerts;
  const positions = new Float32Array(vcount * 3);
  const uvs = new Float32Array(vcount * 2);
  const indices = new (vcount > 65535 ? Uint32Array : Uint16Array)(tubularSegs * radialSegs * 6);

  const curlAmp = curl * length;
  for (let i = 0; i < rings; i++) {
    const t = i / tubularSegs; // 0 root → 1 tip
    // Spine: monotonic downward bend (t² keeps the root tangent flat along
    // +Z) plus one half-wave of lateral curl in X.
    const cx = curlAmp * Math.sin(Math.PI * t);
    const cy = -droop * t * t;
    const cz = t * length;
    // Analytic spine tangent.
    const tx = curlAmp * Math.PI * Math.cos(Math.PI * t);
    const ty = -2 * droop * t;
    const tz = length;
    const tl = Math.hypot(tx, ty, tz);
    const nx = tx / tl;
    const ny = ty / tl;
    const nz = tz / tl;
    // Frame: side = normalize(cross(up, tangent)), up2 = cross(tangent, side).
    // Tangent stays near +Z so the (0,1,0) reference never degenerates.
    let sx = nz; // cross((0,1,0),(nx,ny,nz)) = (nz, 0, -nx)
    let sz = -nx;
    const sl = Math.hypot(sx, sz);
    sx /= sl;
    sz /= sl;
    const ux = ny * sz - nz * 0; // cross(tangent, side) with side.y = 0
    const uy = nz * sx - nx * sz;
    const uz = -ny * sx;
    // Radius: root→tip lerp with a slight mid-length bulge.
    const r = (rootRadius + (tipRadius - rootRadius) * t) * (1 + 0.15 * Math.sin(Math.PI * t));
    for (let j = 0; j < ringVerts; j++) {
      const v = j / radialSegs;
      const a = v * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const idx = i * ringVerts + j;
      positions[idx * 3] = cx + (ca * sx + sa * ux) * r;
      positions[idx * 3 + 1] = cy + sa * uy * r;
      positions[idx * 3 + 2] = cz + (ca * sz + sa * uz) * r;
      uvs[idx * 2] = t;
      uvs[idx * 2 + 1] = v;
    }
  }

  let k = 0;
  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * ringVerts + j;
      const b = (i + 1) * ringVerts + j;
      const c = i * ringVerts + j + 1;
      const d = (i + 1) * ringVerts + j + 1;
      indices[k++] = a;
      indices[k++] = b;
      indices[k++] = c;
      indices[k++] = b;
      indices[k++] = d;
      indices[k++] = c;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Web membrane: a fan/sector in the local XZ plane, centered on the +Z
 * axis, spanning `spread` radians with radius inner → outer. The surface
 * dips from 0 at the inner edge to −droop at the outer rim (radial t^1.5
 * so the inner margin stays level) and carries a gentle sinusoidal ruffle
 * (~2 waves across the arc) that grows toward the rim — grown membrane,
 * not machined. Indexed polar grid, uv-mapped (u along the radius, v
 * across the arc); pair with a DoubleSide material.
 *
 *   inner   inner radius (4)
 *   outer   outer radius / rim (20)
 *   spread  angular span in radians, centered on +Z (π/5)
 *   droop   downward −Y dip at the rim (2.5)
 *   ruffle  ruffle amplitude at the rim (0.6)
 *   segs    grid resolution per axis (12)
 */
export function makeWebGeometry({
  inner = 4,
  outer = 20,
  spread = Math.PI / 5,
  droop = 2.5,
  ruffle = 0.6,
  segs = 12,
} = {}) {
  const n = segs + 1;
  const vcount = n * n;
  const positions = new Float32Array(vcount * 3);
  const uvs = new Float32Array(vcount * 2);
  const indices = new (vcount > 65535 ? Uint32Array : Uint16Array)(segs * segs * 6);

  for (let i = 0; i < n; i++) {
    const t = i / segs; // 0 inner → 1 rim
    const radius = inner + (outer - inner) * t;
    const dip = -droop * Math.pow(t, 1.5);
    for (let j = 0; j < n; j++) {
      const v = j / segs; // 0..1 across the arc
      const angle = (v - 0.5) * spread; // -spread/2..+spread/2 off +Z
      const idx = i * n + j;
      positions[idx * 3] = radius * Math.sin(angle);
      // Ruffle: ~2 waves across the arc, amplitude growing with radial t.
      positions[idx * 3 + 1] = dip + ruffle * Math.sin(v * Math.PI * 4) * t;
      positions[idx * 3 + 2] = radius * Math.cos(angle);
      uvs[idx * 2] = t;
      uvs[idx * 2 + 1] = v;
    }
  }

  let k = 0;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * n + j;
      const b = (i + 1) * n + j;
      const c = i * n + j + 1;
      const d = (i + 1) * n + j + 1;
      indices[k++] = a;
      indices[k++] = b;
      indices[k++] = c;
      indices[k++] = b;
      indices[k++] = d;
      indices[k++] = c;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// Wave 48 — merged organic detail primitives (visual plan Phase 7)
//
// These build the Bloom's DENSITY layer. Every one returns plain indexed
// BufferGeometries carrying position/normal/uv, ready to hand to
// station-detail.js `detailBuilder.add()`, which bakes a vertex colour and
// merges them into one chunk per channel. The uv attribute is not optional:
// mergeGeometries refuses to merge geometries whose attribute sets differ, and
// every core three geometry in the same channel carries one.
//
// A merged chunk is static within itself but is an ordinary Object3D, so
// parenting it into an arm's flex group makes it ride the sway — the animation
// contract (part-level transforms only) is untouched.
//
// Each builder returns NAMED PIECES rather than one geometry, so the caller
// picks the palette per piece (ribs nacre, struts nacreShadow, lamps mint) at
// the add() site instead of the primitive knowing anything about colour.
// ---------------------------------------------------------------------------

const _swpTan = new THREE.Vector3();
const _swpNrm = new THREE.Vector3();
const _swpBin = new THREE.Vector3();
const _swpSeed = new THREE.Vector3();

/** Growable position/uv/index accumulator; one per emitted piece. */
function _acc() {
  return { pos: [], uv: [], idx: [] };
}

function _accGeo(acc) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(acc.pos);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(acc.uv), 2));
  const Index = positions.length / 3 > 65535 ? Uint32Array : Uint16Array;
  geo.setIndex(new THREE.BufferAttribute(Index.from(acc.idx), 1));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sweep a round cross-section along a polyline, appending into `acc`.
 *
 * `pts` is a FLAT xyz array. Frames are rotation-minimising (parallel
 * transport): the seed normal is transported by projecting out the tangent
 * component at each step, so the tube never flips when the path turns through
 * vertical — which the arm ribs and the closed hoops both do. A closed path
 * ends with a small residual twist; on a circular cross-section that is
 * invisible.
 *
 *   radius  tube radius, or a function of t (0..1 along the path)
 *   sides   cross-section resolution (the ring carries sides+1 verts: the
 *           duplicated seam keeps uvs clean)
 */
function _sweep(acc, pts, radius, sides, { closed = false } = {}) {
  const n = pts.length / 3;
  if (n < 2) return;
  const radiusFn = typeof radius === 'function' ? radius : null;
  const ringVerts = sides + 1;
  const base = acc.pos.length / 3;

  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0;
    // Tangent by central difference; a closed path wraps instead of clamping.
    const i0 = closed ? (i - 1 + n) % n : Math.max(0, i - 1);
    const i1 = closed ? (i + 1) % n : Math.min(n - 1, i + 1);
    _swpTan.set(
      pts[i1 * 3] - pts[i0 * 3],
      pts[i1 * 3 + 1] - pts[i0 * 3 + 1],
      pts[i1 * 3 + 2] - pts[i0 * 3 + 2],
    ).normalize();
    if (i === 0) {
      // Seed normal from whichever axis is least aligned with the tangent.
      _swpSeed.set(Math.abs(_swpTan.x) < 0.9 ? 1 : 0, Math.abs(_swpTan.x) < 0.9 ? 0 : 1, 0);
      _swpNrm.copy(_swpSeed).cross(_swpTan).normalize();
    } else {
      _swpNrm.addScaledVector(_swpTan, -_swpNrm.dot(_swpTan)).normalize();
    }
    _swpBin.copy(_swpTan).cross(_swpNrm).normalize();

    const r = radiusFn ? radiusFn(t) : radius;
    const px = pts[i * 3];
    const py = pts[i * 3 + 1];
    const pz = pts[i * 3 + 2];
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * TAU;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      acc.pos.push(
        px + (_swpNrm.x * ca + _swpBin.x * sa) * r,
        py + (_swpNrm.y * ca + _swpBin.y * sa) * r,
        pz + (_swpNrm.z * ca + _swpBin.z * sa) * r,
      );
      acc.uv.push(t, j / sides);
    }
  }

  const spans = closed ? n : n - 1;
  for (let i = 0; i < spans; i++) {
    const ringA = base + (i % n) * ringVerts;
    const ringB = base + ((i + 1) % n) * ringVerts;
    for (let j = 0; j < sides; j++) {
      acc.idx.push(ringA + j, ringB + j, ringA + j + 1);
      acc.idx.push(ringB + j, ringB + j + 1, ringA + j + 1);
    }
  }
}

/** Append an existing geometry's triangles into `acc`, transformed by `m`. */
function _blit(acc, geo, m) {
  const src = geo.index ? geo.toNonIndexed() : geo;
  const p = src.attributes.position;
  const uv = src.attributes.uv;
  const base = acc.pos.length / 3;
  for (let i = 0; i < p.count; i++) {
    _swpSeed.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(m);
    acc.pos.push(_swpSeed.x, _swpSeed.y, _swpSeed.z);
    acc.uv.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
  }
  for (let i = 0; i < p.count; i++) acc.idx.push(base + i);
  if (src !== geo) src.dispose();
}

const _blitM = new THREE.Matrix4();
const _blitQ = new THREE.Quaternion();
const _blitS = new THREE.Vector3();
const _blitP = new THREE.Vector3();
const _euler0 = new THREE.Euler();

/**
 * A point on (or just off) a starfish arm's surface, in arm-local space.
 *
 * The spine and radius profile are read straight off makeStarfishArmGeometry,
 * so anything seated with this hugs the arm mesh exactly — pass the SAME
 * length/rootRadius/tipRadius/droop/curl the arm was built with or the detail
 * floats. `swell` scales the surface radius (1 sits on the skin, 1.05 rides
 * just outside it, 0.9 sits inside).
 *
 *   t      0 root → 1 tip along the spine
 *   angle  radians around the arm; 0 is the +side, π/2 the dorsal top
 */
export function starfishArmPoint(t, angle, {
  length = 22, rootRadius = 3.2, tipRadius = 0.35, droop = 7, curl = 0.12, swell = 1,
} = {}, target = new THREE.Vector3()) {
  const curlAmp = curl * length;
  const cx = curlAmp * Math.sin(Math.PI * t);
  const cy = -droop * t * t;
  const cz = t * length;
  // Analytic tangent, and the same side/up frame the arm rings are built on.
  const tx = curlAmp * Math.PI * Math.cos(Math.PI * t);
  const ty = -2 * droop * t;
  const tz = length;
  const tl = Math.hypot(tx, ty, tz);
  const nx = tx / tl;
  const ny = ty / tl;
  const nz = tz / tl;
  let sx = nz;
  let sz = -nx;
  const sl = Math.hypot(sx, sz);
  sx /= sl;
  sz /= sl;
  const ux = ny * sz;
  const uy = nz * sx - nx * sz;
  const uz = -ny * sx;
  const r = (rootRadius + (tipRadius - rootRadius) * t) * (1 + 0.15 * Math.sin(Math.PI * t)) * swell;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  return target.set(
    cx + (ca * sx + sa * ux) * r,
    cy + sa * uy * r,
    cz + (ca * sz + sa * uz) * r,
  );
}

const _latP = new THREE.Vector3();

/**
 * Openwork trellis wrapped over a starfish arm — the coral-lace read that
 * carries most of the reference's perceived density (visual plan 7.0 item 3).
 *
 * Longitudinal RIBS run root→tip at fixed angles, each weaving a little in
 * angle as it goes (grown, never machined); HOOPS ring the arm at intervals.
 * The holes are simply what the two families leave between them — no explicit
 * gap logic, so the openwork tightens where the arm narrows, exactly like the
 * reference. NODES are small beads at a subset of the crossings, meant for the
 * glow channel so the lattice carries lamps.
 *
 * Ribs come back split by parity (`ribs` / `ribsAlt`) so the caller can weave
 * two colours through one family — pearl and gold alternating, as in the
 * reference — without the primitive knowing what a palette is.
 *
 * Arm parameters must match the arm mesh (see starfishArmPoint). `swell` lifts
 * the lattice just clear of the skin so the glass still reads underneath.
 *
 *   ribs/hoops    family counts (9 / 9)
 *   ribSegs       samples per rib (26)
 *   hoopSegs      samples per hoop ring (20)
 *   strut         rib tube radius (0.16); hoops run at `strut * 0.8`
 *   weave         angular wander of a rib along its length, radians (0.22)
 *   tMin/tMax     spine span the lattice covers (0.04 / 0.98)
 *   nodeEvery     bead at every Nth crossing (3); 0 emits none
 */
export function latticeShell({
  length = 20, rootRadius = 3.4, tipRadius = 0.4, droop = 6.5, curl = 0.12,
  ribs = 9, hoops = 9, ribSegs = 26, hoopSegs = 20,
  strut = 0.16, swell = 1.06, weave = 0.22, tMin = 0.04, tMax = 0.98,
  nodeEvery = 3, nodeSize = 0.26,
} = {}) {
  const arm = { length, rootRadius, tipRadius, droop, curl, swell };
  const ribAcc = _acc();
  const ribAltAcc = _acc(); // odd ribs, so the caller can weave two colours
  const strutAcc = _acc();
  const nodeAcc = _acc();

  // Ribs: constant angle plus one slow half-wave of wander, so neighbouring
  // ribs converge and part along the arm instead of running parallel rails.
  const ribPts = new Float64Array(ribSegs * 3);
  for (let k = 0; k < ribs; k++) {
    const a0 = (k / ribs) * TAU;
    const wobble = weave * (k % 2 ? 1 : -1);
    for (let i = 0; i < ribSegs; i++) {
      const s = i / (ribSegs - 1);
      const t = tMin + (tMax - tMin) * s;
      starfishArmPoint(t, a0 + wobble * Math.sin(Math.PI * s), arm, _latP);
      ribPts[i * 3] = _latP.x;
      ribPts[i * 3 + 1] = _latP.y;
      ribPts[i * 3 + 2] = _latP.z;
    }
    // Ribs thin toward the tip with the arm itself.
    _sweep(k % 2 ? ribAltAcc : ribAcc, ribPts, (s) => strut * (1 - 0.45 * s), 5);
  }

  // Hoops: closed rings around the arm, alternately phase-shifted so the
  // openwork cells stagger rather than stacking into a grid.
  const hoopPts = new Float64Array(hoopSegs * 3);
  for (let h = 0; h < hoops; h++) {
    const t = tMin + (tMax - tMin) * ((h + 0.5) / hoops);
    const phase = (h % 2) * (Math.PI / hoopSegs);
    for (let i = 0; i < hoopSegs; i++) {
      starfishArmPoint(t, phase + (i / hoopSegs) * TAU, arm, _latP);
      hoopPts[i * 3] = _latP.x;
      hoopPts[i * 3 + 1] = _latP.y;
      hoopPts[i * 3 + 2] = _latP.z;
    }
    _sweep(strutAcc, hoopPts, strut * 0.8 * (1 - 0.4 * (h / hoops)), 5, { closed: true });
  }

  // Beads at a subset of rib × hoop crossings — the lattice's lamps.
  if (nodeEvery > 0) {
    // Icosahedron, not octahedron: at this size the extra facets are what let
    // a bead read as a round lamp rather than a chip of glass.
    const beadGeo = new THREE.IcosahedronGeometry(nodeSize, 0);
    let n = 0;
    for (let h = 0; h < hoops; h++) {
      const t = tMin + (tMax - tMin) * ((h + 0.5) / hoops);
      const s = (t - tMin) / (tMax - tMin);
      for (let k = 0; k < ribs; k++) {
        if (n++ % nodeEvery !== 0) continue;
        const wobble = weave * (k % 2 ? 1 : -1);
        starfishArmPoint(t, (k / ribs) * TAU + wobble * Math.sin(Math.PI * s), arm, _latP);
        _blitM.compose(_latP, _blitQ.identity(), _blitS.setScalar(1 - 0.4 * s));
        _blit(nodeAcc, beadGeo, _blitM);
      }
    }
    beadGeo.dispose();
  }

  const out = { ribs: _accGeo(ribAcc), ribsAlt: _accGeo(ribAltAcc), struts: _accGeo(strutAcc) };
  if (nodeAcc.pos.length > 0) out.nodes = _accGeo(nodeAcc);
  return out;
}

/**
 * Raised vein ridges along a petal — the reference's gilt filigree (7.0 item
 * 3, petal half). Runs the SAME parametric surface as makePetalGeometry, so
 * the ridges sit on the petal wherever the petal is, and lift a hair along
 * +Y so they read as relief rather than z-fighting stripes.
 *
 * Pass the petal's own length/width/curl/cup. `veins` are interior ridges
 * spread across the width; `rim` adds the two edge ribs, which is what makes
 * a petal read as an outlined membrane at range.
 */
export function veinFiligree({
  length = 26, width = 11, curl = 8, cup = 3.2,
  veins = 5, segs = 20, strut = 0.13, lift = 0.06, rim = true,
} = {}) {
  const veinAcc = _acc();
  const rimAcc = _acc();
  const pts = new Float64Array(segs * 3);

  // makePetalGeometry's surface, evaluated directly: u root→tip, v across.
  const surf = (u, v, out) => {
    const profile = Math.sin(Math.PI * Math.pow(u, 0.8));
    const edge = 2 * v - 1;
    out.set(
      edge * (width * 0.5) * profile,
      curl * u * u + cup * edge * edge * profile + lift,
      u * length,
    );
  };

  const runVein = (acc, v, radius) => {
    for (let i = 0; i < segs; i++) {
      const u = 0.02 + (0.97 - 0.02) * (i / (segs - 1));
      surf(u, v, _latP);
      pts[i * 3] = _latP.x;
      pts[i * 3 + 1] = _latP.y;
      pts[i * 3 + 2] = _latP.z;
    }
    _sweep(acc, pts, (s) => radius * (1 - 0.5 * s), 4);
  };

  for (let k = 0; k < veins; k++) {
    // Spread across the middle of the width; the edges belong to the rim.
    const v = 0.5 + ((k + 1) / (veins + 1) - 0.5) * 0.7;
    runVein(veinAcc, v, strut);
  }
  if (rim) {
    runVein(rimAcc, 0.03, strut * 1.35);
    runVein(rimAcc, 0.97, strut * 1.35);
  }

  const out = { veins: _accGeo(veinAcc) };
  if (rim) out.rim = _accGeo(rimAcc);
  return out;
}

/**
 * Leaf-cell pod: a teardrop cell with a glowing internal vein fan (7.0 item
 * 5). Built along local +Z, widest at z ≈ 0.38·length, closing to a point at
 * the tip and a stem at the root — the reference's hung seed-pods.
 *
 * Pieces: `rim` (the nacre bezel ring around the pod's waist plus the stem),
 * `shell` (the pod body, for the hull channel), `veins` (the fan, for the
 * glow or glaze channel).
 */
export function cellPod({
  length = 3.2, width = 1.5, height = 0.7, segs = 14, rings = 12,
  fan = 5, strut = 0.07, seed = 11,
} = {}) {
  const shellAcc = _acc();
  const rimAcc = _acc();
  const veinAcc = _acc();
  const rand = makeRand(seed);

  // Teardrop profile: closed at both ends, fat forward of the root.
  const profile = (u) => Math.sin(Math.PI * Math.pow(u, 0.62));

  const ringVerts = segs + 1;
  const base = 0;
  for (let i = 0; i <= rings; i++) {
    const u = i / rings;
    const p = profile(u);
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * TAU;
      shellAcc.pos.push(
        Math.cos(a) * width * 0.5 * p,
        Math.sin(a) * height * 0.5 * p,
        u * length,
      );
      shellAcc.uv.push(u, j / segs);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = base + i * ringVerts + j;
      const b = base + (i + 1) * ringVerts + j;
      shellAcc.idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  // Bezel: a closed ring at the waist, and a short stem at the root.
  const waist = 0.38;
  const wp = profile(waist);
  const ringPts = new Float64Array(segs * 3);
  for (let j = 0; j < segs; j++) {
    const a = (j / segs) * TAU;
    ringPts[j * 3] = Math.cos(a) * width * 0.5 * wp;
    ringPts[j * 3 + 1] = Math.sin(a) * height * 0.5 * wp;
    ringPts[j * 3 + 2] = waist * length;
  }
  _sweep(rimAcc, ringPts, strut * 1.6, 5, { closed: true });
  _sweep(rimAcc, new Float64Array([0, 0, -length * 0.16, 0, 0, length * 0.12]), strut * 2, 5);

  // Vein fan: ribs from the stem out toward the tip, curving with the shell,
  // each one seated just inside the surface so the glaze glows through it.
  const fanPts = new Float64Array(10 * 3);
  for (let k = 0; k < fan; k++) {
    const a = ((k + 0.5) / fan) * Math.PI - Math.PI / 2 + (rand() - 0.5) * 0.25;
    const reach = 0.72 + rand() * 0.24;
    for (let i = 0; i < 10; i++) {
      const u = 0.06 + (reach - 0.06) * (i / 9);
      const p = profile(u) * 0.72;
      fanPts[i * 3] = Math.cos(a) * width * 0.5 * p;
      fanPts[i * 3 + 1] = Math.sin(a) * height * 0.5 * p;
      fanPts[i * 3 + 2] = u * length;
    }
    _sweep(veinAcc, fanPts, (s) => strut * (1 - 0.6 * s), 4);
  }

  return { shell: _accGeo(shellAcc), rim: _accGeo(rimAcc), veins: _accGeo(veinAcc) };
}

/**
 * Coral tuft: a small branching clump for colonising the lattice (7.0 item
 * 6). Grows along local +Y from a single foot, so the caller seats the FOOT
 * on a surface it has already built — this is the greebleScatter anchor
 * discipline, and the wave-47 rule that nothing is ever volume-scattered.
 *
 * Pieces: `stems` (the branches) and `tips` (the bud beads), so the caller
 * can run the two in different colours — the reference's rose stems into
 * violet heads.
 */
export function coralTuft({
  height = 1.6, branches = 4, splits = 2, strut = 0.09, spread = 0.55, seed = 7,
} = {}) {
  const stemAcc = _acc();
  const tipAcc = _acc();
  const rand = makeRand(seed);
  const budGeo = new THREE.OctahedronGeometry(1, 0);
  const pts = new Float64Array(6 * 3);

  // One branch: a slightly curved run from `from` toward `dir`, recursing.
  const grow = (fx, fy, fz, dx, dy, dz, len, radius, depth) => {
    const bend = (rand() - 0.5) * 0.5;
    for (let i = 0; i < 6; i++) {
      const s = i / 5;
      pts[i * 3] = fx + dx * len * s + bend * len * s * s;
      pts[i * 3 + 1] = fy + dy * len * s;
      pts[i * 3 + 2] = fz + dz * len * s - bend * len * s * s * 0.6;
    }
    _sweep(stemAcc, pts, (s) => radius * (1 - 0.5 * s), 4);
    const tx = pts[15];
    const ty = pts[16];
    const tz = pts[17];
    if (depth <= 0) {
      _blitM.compose(_blitP.set(tx, ty, tz), _blitQ.identity(), _blitS.setScalar(radius * 2.1));
      _blit(tipAcc, budGeo, _blitM);
      return;
    }
    for (let k = 0; k < 2; k++) {
      const a = rand() * TAU;
      const off = spread * (0.6 + rand() * 0.8);
      const nx = dx + Math.cos(a) * off;
      const nz = dz + Math.sin(a) * off;
      const ny = dy + 0.25;
      const nl = Math.hypot(nx, ny, nz) || 1;
      grow(tx, ty, tz, nx / nl, ny / nl, nz / nl, len * 0.68, radius * 0.7, depth - 1);
    }
  };

  for (let b = 0; b < branches; b++) {
    const a = (b / branches) * TAU + rand() * 0.6;
    const lean = 0.3 + rand() * 0.35;
    const dx = Math.cos(a) * lean;
    const dz = Math.sin(a) * lean;
    const dy = 1;
    const dl = Math.hypot(dx, dy, dz);
    grow(0, 0, 0, dx / dl, dy / dl, dz / dl, height * (0.7 + rand() * 0.5), strut, splits);
  }
  budGeo.dispose();

  return { stems: _accGeo(stemAcc), tips: _accGeo(tipAcc) };
}

/**
 * Arcade ring: arched openings around a circle (7.0 item 4) — the one
 * architecture note in the whole station, and the place the existing amber
 * hearth palette becomes legible as habitation rather than diffuse glow.
 *
 * Pieces: `piers` (the columns, their arch shoulders, and the sill and lintel
 * bands — hull channel) and `arches` (the lit opening behind each arch, a
 * curved panel for the glow channel). Centred on the local origin, ring in
 * the XZ plane, arcade rising +Y from `y`.
 */
export function arcadeRing({
  radius = 6, piers = 12, y = 0, height = 2.2, pierWidth = 0.5, pierDepth = 0.55,
  arcSegs = 6, band = 0.3,
} = {}) {
  const pierAcc = _acc();
  const archAcc = _acc();
  const step = TAU / piers;

  // Sill and lintel: two closed rings tying every pier into one band, which is
  // what stops an arcade reading as a circle of loose posts.
  const bandPts = new Float64Array(piers * 4 * 3);
  const bandRing = (yy, r) => {
    for (let i = 0; i < piers * 4; i++) {
      const a = (i / (piers * 4)) * TAU;
      bandPts[i * 3] = Math.cos(a) * r;
      bandPts[i * 3 + 1] = yy;
      bandPts[i * 3 + 2] = Math.sin(a) * r;
    }
    _sweep(pierAcc, bandPts, band * 0.5, 6, { closed: true });
  };
  bandRing(y, radius);
  bandRing(y + height, radius);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const archPts = new Float64Array((arcSegs + 1) * 3);
  for (let i = 0; i < piers; i++) {
    const a = i * step;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    // Pier: a column standing on the sill, tangent to the ring.
    _blitM.compose(
      _blitP.set(ca * radius, y + height * 0.5, sa * radius),
      _blitQ.setFromEuler(_euler0.set(0, -a, 0)),
      _blitS.set(pierDepth, height, pierWidth),
    );
    _blit(pierAcc, boxGeo, _blitM);

    // Arch: a half-ring bridging this pier to the next, swept as a thin tube.
    const mid = a + step * 0.5;
    const span = step * 0.5 * radius;
    for (let j = 0; j <= arcSegs; j++) {
      const s = j / arcSegs;
      const ang = mid + (s - 0.5) * step;
      const rise = Math.sin(Math.PI * s) * Math.min(span, height * 0.45);
      archPts[j * 3] = Math.cos(ang) * radius;
      archPts[j * 3 + 1] = y + height * 0.62 + rise;
      archPts[j * 3 + 2] = Math.sin(ang) * radius;
    }
    _sweep(pierAcc, archPts, band * 0.4, 5);

    // The lit room behind the opening: a flat panel set back from the ring,
    // spanning pier to pier under the arch.
    _blitM.compose(
      _blitP.set(Math.cos(mid) * (radius - pierDepth * 0.55), y + height * 0.46, Math.sin(mid) * (radius - pierDepth * 0.55)),
      _blitQ.setFromEuler(_euler0.set(0, -mid, 0)),
      _blitS.set(0.12, height * 0.78, step * radius * 0.62),
    );
    _blit(archAcc, boxGeo, _blitM);
  }
  boxGeo.dispose();

  return { piers: _accGeo(pierAcc), arches: _accGeo(archAcc) };
}

// ---------------------------------------------------------------------------
// Shared materials (cached per variant, NEVER disposed)
// ---------------------------------------------------------------------------

const _materialCache = { standard: null, tarnished: null };

/**
 * The shared Beautiful Ones material set. Cached at module scope per
 * variant ('standard' | 'tarnished') and shared across every instance with
 * the same look — these are NEVER disposed (per-assembly materials, where
 * required, belong to the consumer's rebuild/teardown path).
 *
 *   flesh     nacre pearl shell: nacre map, roughness ~0.45, metalness
 *             ~0.05, subtle deepFlesh emissive.
 *   membrane  translucent nacre for petals/fins: opacity 0.55, DoubleSide,
 *             depthWrite off.
 *   gilt      aged gold: 0xc9a86a, metalness 0.85, roughness 0.35.
 *   veinGlow  mint vein texture on a transparent MeshBasicMaterial —
 *             bioluminescent parts; set blending to AdditiveBlending per
 *             mesh when a pure additive overlay is wanted.
 *
 * `tarnished: true` dulls the nacre toward grey-mauve (~0x9a8a8c) and dims
 * the mint ~40% — the fallen-Beautiful pirate look.
 */
export function organicMaterials({ tarnished } = {}) {
  const key = tarnished ? 'tarnished' : 'standard';
  const cached = _materialCache[key];
  if (cached) return cached;

  const nacreTex = makeNacreTexture();
  const veinTex = makeOrganicVeinTexture({ seed: tarnished ? 9021 : 1337 });
  const fleshColor = tarnished ? TARNISHED_NACRE : ORGANIC.nacre;
  const dim = tarnished ? TARNISHED_DIM : 1;

  const flesh = new THREE.MeshStandardMaterial({
    color: fleshColor,
    map: nacreTex,
    roughness: tarnished ? 0.6 : 0.45,
    metalness: 0.05,
    emissive: ORGANIC.deepFlesh,
    emissiveIntensity: tarnished ? 0.12 : 0.25,
  });

  const membrane = new THREE.MeshStandardMaterial({
    color: fleshColor,
    map: nacreTex,
    roughness: 0.5,
    metalness: 0,
    emissive: ORGANIC.deepFlesh,
    emissiveIntensity: tarnished ? 0.08 : 0.15,
    transparent: true,
    opacity: tarnished ? 0.45 : 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const gilt = new THREE.MeshStandardMaterial({
    color: tarnished ? TARNISHED_GILT : ORGANIC.gilt,
    metalness: tarnished ? 0.7 : 0.85,
    roughness: tarnished ? 0.55 : 0.35,
  });

  const veinGlow = new THREE.MeshBasicMaterial({
    map: veinTex,
    // White carries the mint map at full brightness; tarnished dims ~40%.
    color: new THREE.Color(dim, dim, dim),
    transparent: true,
    opacity: 0.9,
    // The vein texture is black-background: additive blending makes black
    // read as transparent so overlays cloak nothing (ship.js uses the same
    // texture as an emissiveMap — black = no emission there).
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const set = { flesh, membrane, gilt, veinGlow };
  // Shared-resource marking: these materials (and their cached textures)
  // are NEVER disposed. Consumer teardown paths that traverse-and-dispose
  // (station.js teardownMesh, landmarks.js ownMat, gate.js rebuild) MUST
  // skip any material/map carrying userData.shared. Never tagPulse these —
  // pulse params live on material.userData, so per-assembly pulsing needs a
  // per-assembly material (created at build, disposed by that module's
  // teardown). tagSway/tagBreath are per-object and safe anywhere.
  for (const k in set) {
    const mat = set[k];
    mat.userData.shared = true;
    if (mat.map) mat.map.userData = { shared: true };
  }
  _materialCache[key] = set;
  return set;
}

// ---------------------------------------------------------------------------
// Animation tagging + driver (zero per-frame allocation)
// ---------------------------------------------------------------------------

/**
 * Tag an object for rotation sway: `rotation[axis]` oscillates around its
 * CURRENT value (stashed as base). Returns the object for chaining.
 */
export function tagSway(object, { axis, amp, hz, phase = 0 }) {
  object.userData.sway = { axis, amp, hz, phase, base: object.rotation[axis] };
  return object;
}

/** Tag an object for uniform breath scale around its CURRENT scale.x. */
export function tagBreath(object, { depth, hz, phase = 0 }) {
  object.userData.breath = { depth, hz, phase, baseScale: object.scale.x };
  return object;
}

/**
 * Tag a material for emissive/opacity pulse. Pulses emissiveIntensity when
 * the material has one (MeshStandardMaterial), otherwise opacity
 * (MeshBasicMaterial). Base is stashed at tag time. Returns the material.
 */
export function tagPulse(material, { base, amp, hz, phase = 0 }) {
  const prop = material.emissiveIntensity !== undefined ? 'emissiveIntensity' : 'opacity';
  material.userData.pulse = { prop, base: base !== undefined ? base : (material.emissiveIntensity ?? material.opacity), amp, hz, phase };
  return material;
}

/**
 * Walk an assembly ONCE, collecting every tagged part into plain arrays:
 * sway/breath entries are the tagged objects, pulse entries are the tagged
 * materials (material arrays supported). Reuse the returned lists for the
 * assembly's lifetime; animateOrganic performs zero allocation.
 */
export function collectOrganic(root) {
  const parts = { sway: [], breath: [], pulse: [] };
  root.traverse((node) => {
    const ud = node.userData;
    if (ud.sway) parts.sway.push(node);
    if (ud.breath) parts.breath.push(node);
    const mat = node.material;
    if (mat) {
      if (Array.isArray(mat)) {
        for (let i = 0; i < mat.length; i++) {
          if (mat[i].userData && mat[i].userData.pulse) parts.pulse.push(mat[i]);
        }
      } else if (mat.userData && mat.userData.pulse) {
        parts.pulse.push(mat);
      }
    }
  });
  return parts;
}

/**
 * Drive all tagged parts. Mutates ONLY transforms/material scalars from the
 * stashed bases — no closures, arrays, or object literals per call. Under
 * reducedMotion it returns immediately: bases stay, everything freezes.
 */
export function animateOrganic(parts, t, reducedMotion) {
  if (reducedMotion) return;

  const sway = parts.sway;
  for (let i = 0; i < sway.length; i++) {
    const obj = sway[i];
    const s = obj.userData.sway;
    obj.rotation[s.axis] = s.base + Math.sin(TAU * s.hz * t + s.phase) * s.amp;
  }

  const breath = parts.breath;
  for (let i = 0; i < breath.length; i++) {
    const obj = breath[i];
    const b = obj.userData.breath;
    obj.scale.setScalar(b.baseScale * (1 + b.depth * Math.sin(TAU * b.hz * t + b.phase)));
  }

  const pulse = parts.pulse;
  for (let i = 0; i < pulse.length; i++) {
    const mat = pulse[i];
    const p = mat.userData.pulse;
    const v = p.base + p.amp * Math.sin(TAU * p.hz * t + p.phase);
    if (p.prop === 'emissiveIntensity') mat.emissiveIntensity = v;
    else mat.opacity = v;
  }
}
