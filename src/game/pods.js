import * as THREE from 'three';
import { U } from './state.js';
import { copyDataCargoEntry, dataRowsMatch, isDataCargo } from './data-trade.js';

/**
 * Cargo pods — shared infrastructure (orchestrator-owned).
 * Any system may spawn pods via spawnPod (imports this module read-only):
 * jettisoned surrenders (npc.js), mined ore (asteroids.js), aftermath (world.js).
 *
 * Pods drift, glitter, and auto-scoop within U.SCOOP_RANGE of the player ship
 * (doc §4.1 "scoop" verb made physical; cargo capacity enforced).
 *
 * Wave 51: spawnPod takes an optional 5th `tint` (hex int) so mined ore reads
 * as what it is while it drifts — asteroids.js passes ORE_TYPES[oreKey].podTint.
 * Tinted materials come from a per-tint cache below. A 4-argument call
 * yields the default worn-steel hull. Ore pods still take podTint so a
 * scooped rock can be named by colour, but the skin is the same dirty
 * metal (dirt, dings, dock scrapes) on every pod.
 *
 * Wave 60: survivor cargo is JSON-plain
 * `{ commodity: 'survivor', units, faction, source, name? }`.
 * `source` is `playerKill` or `other`. Scoop merges two survivors only when
 * faction+source match. Empty `[]` pods stay flavor and add nothing.
 * Use spawnSurvivorPod for crew pods; spawnPod([], …) stays valid.
 *
 * Geometry is one shared IcosahedronGeometry (r=0.9, detail 0). Each of the
 * 20 faces maps to its own cell in a shared plate atlas, so wear is unique
 * per panel (some plates stay almost clean).
 */

const _toPlayer = new THREE.Vector3();
let podGeo = null;
let podMaps = null;

const POD_RADIUS = 0.9;
const FACE_COUNT = 20;
const ATLAS_COLS = 5;
const ATLAS_ROWS = 4;
const CELL = 256;
const ATLAS_W = ATLAS_COLS * CELL;
const ATLAS_H = ATLAS_ROWS * CELL;
const POD_STEEL = 0x8e939b;
const POD_STEEL_EMIT = 0x2a2c30;
// Muted cabin cyan — not an ore podTint, still readable against space.
const SURVIVOR_POD_TINT = 0x4a6e82;
const SURVIVOR_COMMODITY = 'survivor';
const SOURCE_PLAYER_KILL = 'playerKill';
const SOURCE_OTHER = 'other';
// Local UVs inside one atlas cell (OpenGL v-up). Painted with (1-v) into the canvas.
const UV_A = [0.08, 0.10];
const UV_B = [0.92, 0.10];
const UV_C = [0.50, 0.90];

function setPx(data, w, h, x, y, r, g, b, a = 255) {
  const ix = x | 0;
  const iy = y | 0;
  if (ix < 0 || iy < 0 || ix >= w || iy >= h) return;
  const o = (iy * w + ix) * 4;
  data[o] = r;
  data[o + 1] = g;
  data[o + 2] = b;
  data[o + 3] = a;
}

function distToSeg(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1)));
  const dx = px - (ax + abx * t);
  const dy = py - (ay + aby * t);
  return Math.hypot(dx, dy);
}

function inward(ax, ay, bx, by, cx, cy) {
  let nx = by - ay;
  let ny = ax - bx;
  const mx = (ax + bx) * 0.5;
  const my = (ay + by) * 0.5;
  if ((cx - mx) * nx + (cy - my) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const len = Math.hypot(nx, ny) || 1;
  return [nx / len, ny / len];
}

function hash21(ix, iy) {
  let n = Math.imul(ix | 0, 374761393) + Math.imul(iy | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash21(x0, y0);
  const b = hash21(x0 + 1, y0);
  const c = hash21(x0, y0 + 1);
  const d = hash21(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function baryPoint(ax, ay, bx, by, cx, cy, w0, w1, w2) {
  return [ax * w0 + bx * w1 + cx * w2, ay * w0 + by * w1 + cy * w2];
}

function faceProfile(face) {
  const r = hash21(face, 1);
  if (r < 0.22) return 'clean';
  if (r < 0.48) return 'light';
  if (r < 0.78) return 'worn';
  return 'beat';
}

/** One unique plate. Rivet layout is shared; dings and dirt use `seed`. */
function paintPlateCell(albedo, bump, rough, ox, oy, seed, profile) {
  const toPx = (uv) => [ox + uv[0] * (CELL - 1), oy + (1 - uv[1]) * (CELL - 1)];
  const [ax, ay] = toPx(UV_A);
  const [bx, by] = toPx(UV_B);
  const [cx, cy] = toPx(UV_C);
  const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
  const edges = [
    [ax, ay, bx, by, cx, cy],
    [bx, by, cx, cy, ax, ay],
    [cx, cy, ax, ay, bx, by],
  ];
  const rivets = [];
  const rivetR = CELL * 0.026;
  for (const [x0, y0, x1, y1, ox2, oy2] of edges) {
    const [nx, ny] = inward(x0, y0, x1, y1, ox2, oy2);
    for (const t of [0.22, 0.4, 0.6, 0.78]) {
      rivets.push([x0 + (x1 - x0) * t + nx * rivetR * 1.55, y0 + (y1 - y0) * t + ny * rivetR * 1.55]);
    }
  }

  const h = (a, b) => hash21(seed * 19 + a, b);
  let dingTries = 0;
  let scrapeTries = 0;
  let dirtGain = 0.35;
  let streakGain = 0.2;
  let grimeGain = 0.55;
  if (profile === 'clean') {
    dingTries = 0;
    scrapeTries = 0;
    dirtGain = 0.12;
    streakGain = 0;
    grimeGain = 0.25;
  } else if (profile === 'light') {
    dingTries = h(2, 3) < 0.45 ? 0 : 1;
    scrapeTries = h(4, 5) < 0.4 ? 0 : 1;
    dirtGain = 0.35;
    streakGain = 0.25;
    grimeGain = 0.5;
  } else if (profile === 'worn') {
    dingTries = 2 + (h(2, 3) * 3 | 0);
    scrapeTries = 1 + (h(4, 5) * 3 | 0);
    dirtGain = 0.7;
    streakGain = 0.7;
    grimeGain = 0.85;
  } else {
    dingTries = 4 + (h(2, 3) * 4 | 0);
    scrapeTries = 3 + (h(4, 5) * 3 | 0);
    dirtGain = 1;
    streakGain = 1;
    grimeGain = 1;
  }

  const dings = [];
  for (let i = 0; i < dingTries; i++) {
    const u = 0.16 + h(i, 11) * 0.68;
    const v = 0.14 + h(i, 13) * 0.62;
    const w = 1 - u - v;
    if (u < 0.11 || v < 0.11 || w < 0.11) continue;
    const [dx, dy] = baryPoint(ax, ay, bx, by, cx, cy, u, v, w);
    dings.push({
      x: dx,
      y: dy,
      rx: CELL * (0.03 + h(i, 17) * 0.04),
      ry: CELL * (0.018 + h(i, 19) * 0.028),
      rot: h(i, 23) * Math.PI,
      depth: 0.4 + h(i, 29) * 0.5,
    });
  }

  const scrapes = [];
  for (let i = 0; i < scrapeTries; i++) {
    const u0 = 0.16 + h(i, 31) * 0.42;
    const v0 = 0.16 + h(i, 37) * 0.48;
    const u1 = u0 + 0.1 + h(i, 41) * 0.32;
    const v1 = v0 + (h(i, 43) - 0.48) * 0.4;
    const w0 = 1 - u0 - v0;
    const w1 = 1 - u1 - v1;
    if (w0 < 0.1 || w1 < 0.1 || u1 < 0.1 || v1 < 0.08) continue;
    const [sx0, sy0] = baryPoint(ax, ay, bx, by, cx, cy, u0, v0, w0);
    const [sx1, sy1] = baryPoint(ax, ay, bx, by, cx, cy, u1, v1, w1);
    scrapes.push({ x0: sx0, y0: sy0, x1: sx1, y1: sy1, w: CELL * (0.005 + h(i, 47) * 0.008) });
  }

  const nxOff = seed * 13.7;
  const nyOff = seed * 9.3;

  for (let ly = 0; ly < CELL; ly++) {
    for (let lx = 0; lx < CELL; lx++) {
      const x = ox + lx;
      const y = oy + ly;
      const w0 = ((bx - x) * (cy - y) - (cx - x) * (by - y)) / area;
      const w1 = ((cx - x) * (ay - y) - (ax - x) * (cy - y)) / area;
      const w2 = 1 - w0 - w1;
      const inside = w0 >= -0.002 && w1 >= -0.002 && w2 >= -0.002;
      let edgeD = Infinity;
      for (const [x0, y0, x1, y1] of edges) {
        const d = distToSeg(x, y, x0, y0, x1, y1);
        if (d < edgeD) edgeD = d;
      }
      const seamW = CELL * 0.038;
      const seam = inside ? Math.max(0, 1 - edgeD / seamW) : 1;
      const corner = inside ? Math.max(0, 0.22 - Math.min(w0, w1, w2)) / 0.22 : 0;
      const grain = valueNoise(x * 0.09 + nxOff, y * 0.09 + nyOff) * 0.55
        + valueNoise(x * 0.31 + nxOff, y * 0.28 + nyOff) * 0.45;
      const dirt = valueNoise(x * 0.04 + 9 + nxOff, y * 0.055 + 4 + nyOff);
      const streak = valueNoise(x * 0.025 + 2 + nxOff, y * 0.14 + nyOff);

      let alb = inside ? 164 + grain * 28 : 70;
      alb -= seam * 52;
      alb -= corner * 18 * grimeGain;
      alb -= dirt * 18 * dirtGain;
      alb -= Math.max(0, streak - 0.58) * 26 * streakGain;
      let bmp = inside ? 128 + grain * 18 - seam * 48 : 60;
      let rgh = inside ? 140 + dirt * 40 * dirtGain + seam * 35 : 200;
      let cr = alb;
      let cg = alb;
      let cb = alb;
      const grime = Math.min(1, (seam * 0.65 + corner * 0.5 + Math.max(0, dirt - 0.55) * 0.8) * grimeGain);
      cr += grime * 14;
      cg += grime * 4;
      cb -= grime * 10;

      for (const ding of dings) {
        const ddx = x - ding.x;
        const ddy = y - ding.y;
        const cs = Math.cos(ding.rot);
        const sn = Math.sin(ding.rot);
        const px = (ddx * cs + ddy * sn) / ding.rx;
        const py = (-ddx * sn + ddy * cs) / ding.ry;
        const d = Math.hypot(px, py);
        if (d >= 1) continue;
        const fall = (1 - d) * ding.depth;
        cr -= fall * 32;
        cg -= fall * 36;
        cb -= fall * 30;
        bmp -= fall * 70;
        rgh += fall * 28;
        if (d > 0.72) {
          cr += 10;
          cg += 10;
          cb += 8;
          bmp += 12;
        }
      }

      for (const sc of scrapes) {
        const d = distToSeg(x, y, sc.x0, sc.y0, sc.x1, sc.y1);
        if (d >= sc.w + 0.8) continue;
        const n = d / (sc.w + 0.8);
        if (n < 0.45) {
          cr += 22;
          cg += 22;
          cb += 18;
          bmp += 16;
          rgh -= 50;
        } else {
          cr -= 16;
          cg -= 18;
          cb -= 14;
          bmp -= 10;
          rgh += 12;
        }
      }

      for (const [rx, ry] of rivets) {
        const d = Math.hypot(x - rx, y - ry);
        if (d > rivetR + 1.2) continue;
        const n = d / rivetR;
        if (n < 0.38) {
          cr = 186; cg = 184; cb = 178;
          bmp = 188;
          rgh = 110;
        } else if (n < 0.72) {
          cr = 92; cg = 90; cb = 86;
          bmp = 82;
          rgh = 165;
        } else if (n < 1) {
          cr = 138; cg = 136; cb = 130;
          bmp = 112;
          rgh = 140;
        }
        const hx = x - (rx - rivetR * 0.28);
        const hy = y - (ry - rivetR * 0.28);
        if (Math.hypot(hx, hy) < rivetR * 0.2) {
          cr = 200; cg = 198; cb = 190;
          bmp = 200;
        }
      }

      cr = Math.max(40, Math.min(255, cr));
      cg = Math.max(40, Math.min(255, cg));
      cb = Math.max(40, Math.min(255, cb));
      bmp = Math.max(28, Math.min(255, bmp));
      rgh = Math.max(70, Math.min(230, rgh));
      setPx(albedo, ATLAS_W, ATLAS_H, x, y, cr, cg, cb, 255);
      setPx(bump, ATLAS_W, ATLAS_H, x, y, bmp, bmp, bmp, 255);
      setPx(rough, ATLAS_W, ATLAS_H, x, y, rgh, rgh, rgh, 255);
    }
  }
}

function paintAtlas(albedo, bump, rough) {
  albedo.fill(58);
  for (let i = 3; i < albedo.length; i += 4) albedo[i] = 255;
  bump.fill(48);
  for (let i = 3; i < bump.length; i += 4) bump[i] = 255;
  rough.fill(200);
  for (let i = 3; i < rough.length; i += 4) rough[i] = 255;

  for (let face = 0; face < FACE_COUNT; face++) {
    const col = face % ATLAS_COLS;
    const row = (face / ATLAS_COLS) | 0;
    paintPlateCell(albedo, bump, rough, col * CELL, row * CELL, face + 1, faceProfile(face));
  }
}

function canvasFromRgba(data, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g || typeof g.createImageData !== 'function' || typeof g.putImageData !== 'function') return null;
  const img = g.createImageData(w, h);
  if (!img?.data || img.data.length < data.length) return null;
  img.data.set(data);
  g.putImageData(img, 0, 0);
  if (typeof g.getImageData !== 'function') return null;
  const check = g.getImageData(0, 0, 1, 1);
  if (!check?.data || check.data[0] !== data[0] || check.data[3] !== data[3]) return null;
  return c;
}

function makeTex(data, w, h, srgb) {
  const canvas = (typeof document !== 'undefined' && document.createElement)
    ? canvasFromRgba(data, w, h)
    : null;
  let tex;
  if (canvas) {
    tex = new THREE.CanvasTexture(canvas);
  } else {
    tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.flipY = true;
  }
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

function cellUv(face, local) {
  const col = face % ATLAS_COLS;
  const row = (face / ATLAS_COLS) | 0;
  return [
    (col + local[0]) / ATLAS_COLS,
    (ATLAS_ROWS - row - 1 + local[1]) / ATLAS_ROWS,
  ];
}

function ensurePodMaps() {
  if (podMaps) return podMaps;
  const albedo = new Uint8ClampedArray(ATLAS_W * ATLAS_H * 4);
  const bump = new Uint8ClampedArray(ATLAS_W * ATLAS_H * 4);
  const rough = new Uint8ClampedArray(ATLAS_W * ATLAS_H * 4);
  paintAtlas(albedo, bump, rough);
  podMaps = {
    albedo: makeTex(albedo, ATLAS_W, ATLAS_H, true),
    bump: makeTex(bump, ATLAS_W, ATLAS_H, false),
    rough: makeTex(rough, ATLAS_W, ATLAS_H, false),
  };
  return podMaps;
}

function ensurePodGeo() {
  if (podGeo) return podGeo;
  const src = new THREE.IcosahedronGeometry(POD_RADIUS, 0);
  const geo = src.index ? src.toNonIndexed() : src;
  if (geo !== src) src.dispose();
  const n = geo.getAttribute('position').count;
  const uv = new Float32Array(n * 2);
  const plate = [UV_A, UV_B, UV_C];
  for (let i = 0; i < n; i += 3) {
    const face = (i / 3) | 0;
    for (let k = 0; k < 3; k++) {
      const p = cellUv(face, plate[k]);
      const vi = i + k;
      uv[vi * 2] = p[0];
      uv[vi * 2 + 1] = p[1];
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  podGeo = geo;
  return podGeo;
}

// Wave 51: tint-keyed material cache. The `null` key is the default worn-steel
// hull (jettisoned cargo and aftermath pods). Any other key is an ore podTint
// hex int and overrides `color` / `emissive` on a clone of those settings.
// Geometry stays a single shared singleton — only materials vary.
// Shared plate textures ride on every cached material; clones share them too.
//
// The cache is process-lifetime and INTENTIONALLY never cleared: one default,
// the ore tints, and the survivor tint, shared by every pod in every system.
// Do not "fix" this into a leak-avoidance dispose loop.
const podMats = new Map();

function podMaterialFor(tint) {
  let mat = podMats.get(tint);
  if (mat) return mat;
  const maps = ensurePodMaps();
  mat = new THREE.MeshStandardMaterial({
    color: POD_STEEL,
    map: maps.albedo,
    bumpMap: maps.bump,
    bumpScale: 0.055,
    roughnessMap: maps.rough,
    emissive: POD_STEEL_EMIT,
    roughness: 0.58,
    metalness: 0.72,
  });
  if (tint != null) {
    mat.color.setHex(tint);
    // Dimmer emissive matched to the tint — same half-brightness relationship
    // the default keeps between color and emissive.
    mat.emissive.setHex(tint).multiplyScalar(0.5);
  }
  podMats.set(tint, mat);
  return mat;
}

export function isSurvivorCargo(entry) {
  return !!entry && entry.commodity === SURVIVOR_COMMODITY;
}

/** Stable merge key, or null when `entry` is not survivor cargo. */
export function survivorKey(entry) {
  if (!isSurvivorCargo(entry)) return null;
  const faction = typeof entry.faction === 'string' ? entry.faction : '';
  const source = entry.source === SOURCE_PLAYER_KILL ? SOURCE_PLAYER_KILL : SOURCE_OTHER;
  return `${faction}:${source}`;
}

function isFactionKey(value) {
  return typeof value === 'string'
    && value.length > 0
    && value !== '__proto__'
    && value !== 'constructor'
    && value !== 'prototype';
}

function normalizeSurvivorSource(source) {
  return source === SOURCE_PLAYER_KILL ? SOURCE_PLAYER_KILL : SOURCE_OTHER;
}

function cargoRowsMatch(held, incoming) {
  if (isSurvivorCargo(held) || isSurvivorCargo(incoming)) {
    return isSurvivorCargo(held)
      && isSurvivorCargo(incoming)
      && isFactionKey(held.faction)
      && held.faction === incoming.faction
      && normalizeSurvivorSource(held.source) === normalizeSurvivorSource(incoming.source);
  }
  if (isDataCargo(held) || isDataCargo(incoming)) {
    return dataRowsMatch(held, incoming);
  }
  return held.commodity === incoming.commodity;
}

function copyCargoEntry(c) {
  if (isDataCargo(c)) return copyDataCargoEntry(c);
  const row = { commodity: c.commodity, units: c.units };
  if (isSurvivorCargo(c)) {
    if (!isFactionKey(c.faction)) return null;
    row.faction = c.faction;
    row.source = normalizeSurvivorSource(c.source);
    if (typeof c.name === 'string' && c.name.length > 0) row.name = c.name;
  }
  return row;
}

/** Scoop merge. Survivors stack on faction+source; data stacks on commodity+source+originFaction. */
export function mergePodContents(cargo, contents) {
  if (!contents || contents.length === 0) return;
  for (let i = 0; i < contents.length; i++) {
    const c = contents[i];
    if (!c) continue;
    const existing = cargo.find((x) => cargoRowsMatch(x, c));
    if (existing) existing.units += c.units;
    else {
      const row = copyCargoEntry(c);
      if (row) cargo.push(row);
    }
  }
}

function makePod(ctx, contents, position, drift, tint, meshName) {
  const mesh = new THREE.Mesh(ensurePodGeo(), podMaterialFor(tint));
  if (meshName) mesh.name = meshName;
  mesh.position.copy(position);
  ctx.scene.add(mesh);
  const pod = {
    mesh,
    contents, // [{ commodity, units }] or survivor rows
    velocity: drift ? drift.clone() : new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3),
    bornAt: ctx.world.time,
    ttl: 300, // world-seconds before fading out
  };
  ctx.pods.push(pod);
  ctx.emit('podSpawned', { pod });
  return pod;
}

export function spawnPod(ctx, contents, position, drift = null, tint = null) {
  return makePod(ctx, contents, position, drift, tint, null);
}

export function spawnSurvivorPod(ctx, position, spec, drift = null) {
  const faction = spec && spec.faction;
  if (!isFactionKey(faction)) return null;
  const source = normalizeSurvivorSource(spec && spec.source);
  const entry = { commodity: SURVIVOR_COMMODITY, units: 1, faction, source };
  if (spec && typeof spec.name === 'string' && spec.name.length > 0) entry.name = spec.name;
  return makePod(ctx, [entry], position, drift, SURVIVOR_POD_TINT, 'survivor-pod');
}
/**
 * Build a standalone pod mesh for the models browser (no ctx, no scene, no shared state).
 * Returns a cloned material so emissive drive doesn't affect live pods.
 * Wave 51: optional `tint` is a raw hex int matching spawnPod's parameter —
 * the browser model clones from the same cached per-tint material live pods
 * use. The label stays 'Cargo pod' either way (COMMODITIES has no hex→key
 * index, so a hex cannot be named here).
 * @returns {{ object: THREE.Object3D, update: (elapsed: number, reducedMotion: boolean) => void, label: string }}
 */
export function buildPodModel(tint = null) {
  // Clone material: browser pod's emissive drive must not mutate live pods.
  const browserMat = podMaterialFor(tint).clone();
  const object = new THREE.Mesh(ensurePodGeo(), browserMat);

  let spin = 0;

  function update(elapsed, reducedMotion) {
    if (reducedMotion) {
      spin = 0;
      browserMat.emissiveIntensity = 0.8;
      return;
    }
    // Live path: spin accumulates per-frame (line 46), each pod gets offset rotation.
    // We mirror index 0: spin * 0.7 + 0 for x, spin * 1.1 + 0 for y, z always 0.
    spin += 0.016; // dt ≈ 0.016 at 60fps
    object.rotation.set(spin * 0.7, spin * 1.1, 0);
    // Glitter: same math as line 52 for index 0 (spin * 3 + 0).
    browserMat.emissiveIntensity = 0.8 + 0.4 * Math.sin(spin * 3);
  }

  return { object, update, label: 'Cargo pod' };
}


export function initPods(ctx) {
  ctx.pods = ctx.pods ?? [];
  let spin = 0;

  return {
    update(dt) {
      spin += dt;
      const playerObj = ctx.ship.object;
      for (let i = ctx.pods.length - 1; i >= 0; i--) {
        const pod = ctx.pods[i];
        pod.mesh.position.addScaledVector(pod.velocity, dt);
        pod.mesh.rotation.set(spin * 0.7 + i, spin * 1.1 + i * 2, 0);
        pod.mesh.material.emissiveIntensity = 0.8 + 0.4 * Math.sin(spin * 3 + i); // glitter

        if (ctx.world.time - pod.bornAt > pod.ttl) {
          ctx.scene.remove(pod.mesh);
          ctx.pods.splice(i, 1);
          continue;
        }

        // Auto-scoop: magnet in, collect at contact. Respects cargo capacity.
        if (playerObj && !ctx.flags.docked) {
          _toPlayer.subVectors(playerObj.position, pod.mesh.position);
          const dist = _toPlayer.length();
          if (dist < U.SCOOP_RANGE * 3) pod.mesh.position.addScaledVector(_toPlayer.normalize(), dt * 15);
          if (dist < U.SCOOP_RANGE) {
            const used = ctx.cargo.reduce((n, c) => n + c.units, 0);
            const incoming = pod.contents.reduce((n, c) => n + c.units, 0);
            if (used + incoming <= ctx.cargoCapacity) {
              mergePodContents(ctx.cargo, pod.contents);
              ctx.emit('podCollected', { pod });
              ctx.scene.remove(pod.mesh);
              ctx.pods.splice(i, 1);
            }
          }
        }
      }
    },
  };
}
