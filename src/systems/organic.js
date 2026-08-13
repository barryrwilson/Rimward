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
