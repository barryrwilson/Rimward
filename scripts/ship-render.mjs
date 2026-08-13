/**
 * Shaded review print — flat-shaded LOD0 GLB render from three-quarter view.
 *
 * Loads public/assets/ships/<faction>/<class>/lod0.glb, extracts mesh geometry
 * by material slot (RIMWARD_HULL → shaded gray, RIMWARD_EMISSIVE → glow tint),
 * and CPU rasterises with one key light and one fill. No WebGL, no browser.
 *
 * The hull is rendered with a neutral gray base, Lambert shading from baked
 * vertex normals, and a gamma lift so plate courses, rib frames, and armour
 * steps read on a white page. The emissive channel is composited additively in
 * the faction's glow colour (from FACTION_STYLE), depth-tested against hull but
 * not writing depth — the same two-channel contract as the in-game PBR render.
 *
 * Usage: node scripts/ship-render.mjs <faction> [class ...]
 *   node scripts/ship-render.mjs veridian
 *   node scripts/ship-render.mjs ferrous cutter heavy
 *
 * Output: out/silhouettes/<faction>-render.png
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';
import { CLASS_ORDER } from '../src/game/ship-scale.js';
import { canvas, clearDepth, tri, label, png } from './raster.mjs';

const CELL_W = 700;
const CELL_H = 380;
const PAD = 10;

// ---- Camera ----------------------------------------------------------------
// Three-quarter view: above, ahead, and off the starboard bow.

const norm = (v) => { const d = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/d, v[1]/d, v[2]/d]; };
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const dot   = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];

const FORWARD = norm([-0.72, -0.42,  0.62]);
const RIGHT   = norm(cross(FORWARD, [0, 1, 0]));
const UP      = cross(RIGHT, FORWARD);
const KEY     = norm([-0.5,  0.75,  0.42]);
const FILL    = norm([ 0.6, -0.25,  0.3]);

// Neutral base colour for hull (linear). Applied before gamma lift.
const HULL_BASE = [0.72, 0.71, 0.68];

// ---- CLI args --------------------------------------------------------------

const [faction, ...want] = process.argv.slice(2);
if (!faction) {
  console.log('usage: node scripts/ship-render.mjs <faction> [class ...]');
  process.exit(2);
}
const classes = want.length > 0 ? want : [...CLASS_ORDER];
const st = FACTION_STYLE[faction];
if (!st) {
  console.log(`Unknown faction: ${faction}`);
  process.exit(2);
}
const glowRGB = [(st.glow >> 16) & 255, (st.glow >> 8) & 255, st.glow & 255];

// ---- GLB loading -----------------------------------------------------------

const GLB_ROOT = new URL('../public/assets/ships/', import.meta.url);

async function loadGlb(classKey) {
  const path = new URL(`${faction}/${classKey}/lod0.glb`, GLB_ROOT);
  const data = await readFile(path);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return loader.parseAsync(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    '',
  );
}

// ---- Geometry extraction ---------------------------------------------------

function inGlowSubtree(obj) {
  let cur = obj;
  while (cur) {
    if (cur.name === 'RIMWARD_ENGINE_GLOW') return true;
    cur = cur.parent;
  }
  return false;
}

/**
 * Expand all non-glow meshes from a GLTF scene into non-indexed triangle
 * vertex arrays in scene space, split by material slot.
 *
 * Returns:
 *   hullPos, hullNor — Float32Array of hull (RIMWARD_HULL) vertices + normals
 *   emisPos, emisNor — Float32Array of emissive (RIMWARD_EMISSIVE) vertices + normals
 *   other meshes (RIMWARD_FIELD etc.) are composited with hull shading
 */
function expandMeshData(scene) {
  scene.updateMatrixWorld(true);
  const hull = { pos: [], nor: [], col: [] };
  const emis = { pos: [], nor: [] };
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  scene.traverse((obj) => {
    if (!obj.isMesh || inGlowSubtree(obj)) return;
    const matName = obj.material?.name ?? '';
    const target = matName === 'RIMWARD_EMISSIVE' ? emis : hull;

    let geo = obj.geometry;
    if (!geo?.attributes?.position) return;
    if (geo.index) geo = geo.toNonIndexed();

    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const col = target === hull ? geo.attributes.color : null;
    const mat = obj.matrixWorld;
    const nmat = new THREE.Matrix3().getNormalMatrix(mat);

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mat);
      target.pos.push(v.x, v.y, v.z);
      if (nor) {
        n.fromBufferAttribute(nor, i).applyNormalMatrix(nmat).normalize();
        target.nor.push(n.x, n.y, n.z);
      } else {
        target.nor.push(0, 1, 0);
      }
      if (col) {
        hull.col.push(col.getX(i), col.getY(i), col.getZ(i));
      } else if (target === hull) {
        hull.col.push(1, 1, 1);
      }
    }

    if (geo !== obj.geometry) geo.dispose();
  });

  return {
    hullPos: new Float32Array(hull.pos),
    hullNor: new Float32Array(hull.nor),
    hullCol: new Float32Array(hull.col),
    emisPos: new Float32Array(emis.pos),
    emisNor: new Float32Array(emis.nor),
  };
}

// ---- Sheet setup -----------------------------------------------------------

mkdirSync('out/silhouettes', { recursive: true });

const cols = classes.length <= 2 ? 1 : 2;
const rows = Math.ceil(classes.length / cols);
const sheet = canvas(PAD + cols * (CELL_W + PAD), PAD + rows * (CELL_H + PAD), 246);

for (let idx = 0; idx < classes.length; idx++) {
  const ck = classes[idx];

  let gltf;
  try {
    gltf = await loadGlb(ck);
  } catch (err) {
    console.log(`${faction} ${ck}: GLB LOAD FAIL — ${err.message}`);
    continue;
  }

  const { hullPos, hullNor, hullCol, emisPos } = expandMeshData(gltf.scene);

  // Project hull into screen space to compute framing bounds.
  const project = (x, y, z) => [dot([x,y,z], RIGHT), dot([x,y,z], UP), dot([x,y,z], FORWARD)];

  let loU = Infinity; let hiU = -Infinity;
  let loV = Infinity; let hiV = -Infinity;
  for (let i = 0; i + 2 < hullPos.length; i += 3) {
    const [u, v2] = project(hullPos[i], hullPos[i+1], hullPos[i+2]);
    if (u < loU) loU = u; if (u > hiU) hiU = u;
    if (v2 < loV) loV = v2; if (v2 > hiV) hiV = v2;
  }
  if (!Number.isFinite(loU)) {
    console.log(`${faction} ${ck}: no hull geometry`);
    continue;
  }

  const scale = Math.min(
    (CELL_W - 46) / Math.max(hiU - loU, 1e-3),
    (CELL_H - 40) / Math.max(hiV - loV, 1e-3),
  );
  const ox = PAD + (idx % cols) * (CELL_W + PAD) + CELL_W / 2 - ((loU + hiU) / 2) * scale;
  const oy = PAD + Math.floor(idx / cols) * (CELL_H + PAD) + CELL_H / 2 + ((loV + hiV) / 2) * scale;

  const toPx = (x, y, z) => {
    const [u, v2, d] = project(x, y, z);
    return [ox + u * scale, oy - v2 * scale, d];
  };

  clearDepth(sheet);

  // Hull: flat-shaded, vertex colour × base tint, reduced lift for tonal range.
  for (let i = 0; i + 8 < hullPos.length; i += 9) {
    const a = toPx(hullPos[i],   hullPos[i+1], hullPos[i+2]);
    const b = toPx(hullPos[i+3], hullPos[i+4], hullPos[i+5]);
    const c = toPx(hullPos[i+6], hullPos[i+7], hullPos[i+8]);

    // Average face normal (from per-vertex normals after toNonIndexed).
    const nx = (hullNor[i]   + hullNor[i+3] + hullNor[i+6]) / 3;
    const ny = (hullNor[i+1] + hullNor[i+4] + hullNor[i+7]) / 3;
    const nz = (hullNor[i+2] + hullNor[i+5] + hullNor[i+8]) / 3;
    const nl = Math.hypot(nx, ny, nz) || 1;
    const fn = [nx/nl, ny/nl, nz/nl];

    // Reduced ambient so dark armour reads darker than pale alloy.
    const lit = 0.22 + 0.78 * Math.max(0, dot(fn, KEY)) + 0.28 * Math.max(0, dot(fn, FILL));

    // Average face vertex colour; falls back to 1,1,1 when no COLOR_0 present.
    const cr = (hullCol[i]   + hullCol[i+3] + hullCol[i+6]) / 3;
    const cg = (hullCol[i+1] + hullCol[i+4] + hullCol[i+7]) / 3;
    const cb = (hullCol[i+2] + hullCol[i+5] + hullCol[i+8]) / 3;

    const shade = (ch, c) => Math.min(255, Math.round(255 * Math.pow(Math.min(1, ch * c * lit), 1/1.9)));

    tri(sheet, a, b, c,
      [shade(HULL_BASE[0], cr), shade(HULL_BASE[1], cg), shade(HULL_BASE[2], cb)],
      [a[2], b[2], c[2]]);
  }

  // Emissive channel: additive glow composite, depth-tested against hull.
  for (let i = 0; i + 8 < emisPos.length; i += 9) {
    const a = toPx(emisPos[i],   emisPos[i+1], emisPos[i+2]);
    const b = toPx(emisPos[i+3], emisPos[i+4], emisPos[i+5]);
    const c = toPx(emisPos[i+6], emisPos[i+7], emisPos[i+8]);
    tri(sheet, a, b, c,
      [Math.round(glowRGB[0] * 0.85), Math.round(glowRGB[1] * 0.85), Math.round(glowRGB[2] * 0.85)],
      [a[2] - 0.01, b[2] - 0.01, c[2] - 0.01],
      true);
  }

  label(sheet, ck,
    PAD + (idx % cols) * (CELL_W + PAD) + 8,
    PAD + Math.floor(idx / cols) * (CELL_H + PAD) + 8,
    2, [20, 20, 20]);
}

writeFileSync(`out/silhouettes/${faction}-render.png`, png(sheet));
console.log(`${faction}: out/silhouettes/${faction}-render.png (${classes.join(', ')})`);
