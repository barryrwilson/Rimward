/**
 * Connectivity probe — find parts of a ship that touch nothing.
 *
 * A delivered ship GLB is two merged meshes, so shared vertices prove nothing:
 * every authored primitive is welded into one buffer without sharing a single
 * vertex with its neighbour. Contact has to be measured in space.
 *
 * Method: rasterise every hull and emissive triangle into a voxel grid, then
 * label 26-connected components. One component means the ship is one solid
 * object. Extra components are floating parts, and each is reported with its
 * voxel count and bounding box so the offending fitting can be found in the
 * builder by coordinate.
 *
 * RIMWARD_ENGINE_GLOW is excluded: the drive flare hangs behind the nozzles by
 * design and is not hull.
 *
 * Usage: node scripts/probe-ship-islands.mjs <faction> <class> [lod] [voxel]
 *   node scripts/probe-ship-islands.mjs freehold cutter
 *   node scripts/probe-ship-islands.mjs ferrous cutter lod0 0.05
 *
 * Exit code 0 when the ship is one component, 1 otherwise.
 */

import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const [faction = 'freehold', classKey = 'cutter', lod = 'lod0', voxelArg] = process.argv.slice(2);
const VOXEL = Number(voxelArg ?? 0.06);
const path = new URL(`../public/assets/ships/${faction}/${classKey}/${lod}.glb`, import.meta.url);

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const buffer = await readFile(path);
const gltf = await loader.parseAsync(
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '',
);

const inGlowSubtree = (obj) => {
  for (let node = obj; node; node = node.parent) {
    if (node.name === 'RIMWARD_ENGINE_GLOW') return true;
  }
  return false;
};

// ---- Voxel rasterisation ---------------------------------------------------
// Each triangle is sampled on a barycentric grid whose step is half a voxel, so
// no voxel a triangle passes through is missed.

const filled = new Set();
const key = (i, j, k) => `${i},${j},${k}`;
const a = new THREE.Vector3();
const b = new THREE.Vector3();
const c = new THREE.Vector3();
const p = new THREE.Vector3();
const ab = new THREE.Vector3();
const ac = new THREE.Vector3();

const mark = (v) => filled.add(key(
  Math.round(v.x / VOXEL), Math.round(v.y / VOXEL), Math.round(v.z / VOXEL),
));

gltf.scene.updateMatrixWorld(true);
let triangles = 0;
gltf.scene.traverse((obj) => {
  if (!obj.isMesh || inGlowSubtree(obj)) return;
  const geo = obj.geometry;
  const pos = geo?.attributes?.position;
  if (!pos) return;
  const index = geo.index;
  const count = index ? index.count / 3 : pos.count / 3;
  for (let t = 0; t < count; t++) {
    const base = t * 3;
    const ia = index ? index.getX(base) : base;
    const ib = index ? index.getX(base + 1) : base + 1;
    const ic = index ? index.getX(base + 2) : base + 2;
    a.fromBufferAttribute(pos, ia).applyMatrix4(obj.matrixWorld);
    b.fromBufferAttribute(pos, ib).applyMatrix4(obj.matrixWorld);
    c.fromBufferAttribute(pos, ic).applyMatrix4(obj.matrixWorld);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    const steps = Math.max(1, Math.ceil(Math.max(ab.length(), ac.length()) / (VOXEL * 0.5)));
    for (let i = 0; i <= steps; i++) {
      for (let j = 0; i + j <= steps; j++) {
        p.copy(a).addScaledVector(ab, i / steps).addScaledVector(ac, j / steps);
        mark(p);
      }
    }
    triangles++;
  }
});

// ---- 26-connected labelling ------------------------------------------------

const offsets = [];
for (let dx = -1; dx <= 1; dx++) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx !== 0 || dy !== 0 || dz !== 0) offsets.push([dx, dy, dz]);
    }
  }
}

const unvisited = new Set(filled);
const islands = [];
for (const start of filled) {
  if (!unvisited.has(start)) continue;
  const stack = [start];
  unvisited.delete(start);
  let size = 0;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  while (stack.length > 0) {
    const cell = stack.pop();
    const [i, j, k] = cell.split(',').map(Number);
    size++;
    lo[0] = Math.min(lo[0], i); hi[0] = Math.max(hi[0], i);
    lo[1] = Math.min(lo[1], j); hi[1] = Math.max(hi[1], j);
    lo[2] = Math.min(lo[2], k); hi[2] = Math.max(hi[2], k);
    for (const [dx, dy, dz] of offsets) {
      const next = key(i + dx, j + dy, k + dz);
      if (unvisited.has(next)) {
        unvisited.delete(next);
        stack.push(next);
      }
    }
  }
  islands.push({ size, lo, hi });
}
islands.sort((x, y) => y.size - x.size);

// ---- Report ---------------------------------------------------------------

const fmt = (n) => (n * VOXEL).toFixed(2).padStart(6);
console.log(`== ${faction}/${classKey}/${lod}  voxel=${VOXEL}  triangles=${triangles}  cells=${filled.size}`);
for (const [rank, island] of islands.entries()) {
  const label = rank === 0 ? 'main ' : `FLOAT`;
  console.log(
    `${label} cells=${String(island.size).padStart(6)}`
    + `  x[${fmt(island.lo[0])},${fmt(island.hi[0])}]`
    + `  y[${fmt(island.lo[1])},${fmt(island.hi[1])}]`
    + `  z[${fmt(island.lo[2])},${fmt(island.hi[2])}]`,
  );
}
const pass = islands.length === 1;
console.log(pass
  ? `probe-ship-islands: ONE CONNECTED BODY`
  : `probe-ship-islands: ${islands.length - 1} FLOATING PART GROUP(S)`);
process.exitCode = pass ? 0 : 1;
