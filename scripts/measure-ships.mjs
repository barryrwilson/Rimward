/**
 * Ship asset measurement — pins every LOD0 GLB against the SHIP_SCALE charter.
 *
 * Loads public/assets/ships/<faction>/<class>/lod0.glb for each faction and
 * class, derives scene-space hull extents and area-neutral triangle-centre samples,
 * then checks:
 *   - span bands against SHIP_SCALE[class].span
 *   - silhouette proportions via proportionFor(class, faction)
 *   - pivot offset: |bbox-centre / span| ≤ maxPivotOffset
 *   - proxy coverage ≥ 80% of hull surface samples (proxy derived from bounds)
 *   - proxy fit: each axis ≤ +25% / +25% / +35% overshoot
 *   - class size ladder per faction: light ≤ ace < cutter < heavy < frigate < freighter
 *
 * Usage: node scripts/measure-ships.mjs [faction ...]
 *   node scripts/measure-ships.mjs veridian ferrous
 *   node scripts/measure-ships.mjs           # all 12 factions
 *
 * All output to stdout. No files written.
 */

import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import {
  P, proportionFor, scaleFor, CLASS_ORDER, FACTION_REBUILD_ORDER,
} from '../src/game/ship-scale.js';
import { measure, proxyCover, proxyFit } from './ship-metrics.mjs';

// ---- GLB loading -----------------------------------------------------------

const GLB_ROOT = new URL('../public/assets/ships/', import.meta.url);

async function loadGlb(faction, classKey, lod = 'lod0') {
  const path = new URL(`${faction}/${classKey}/${lod}.glb`, GLB_ROOT);
  const data = await readFile(path);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return loader.parseAsync(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    '',
  );
}

// ---- Geometry extraction ---------------------------------------------------

/** True if obj is inside the RIMWARD_ENGINE_GLOW node's subtree. */
function inGlowSubtree(obj) {
  let cur = obj;
  while (cur) {
    if (cur.name === 'RIMWARD_ENGINE_GLOW') return true;
    cur = cur.parent;
  }
  return false;
}

/**
 * Collect hull extents and one area-neutral sample per hull triangle.
 *
 * The exporter shares vertices between many faces. Counting raw vertices gives
 * bevel corners and triangulation seams more weight than the hull surfaces that
 * collision must cover. Triangle centres give each authored surface facet one
 * stable vote. Engine glow stays outside both sets.
 */
function collectHullGeometry(scene) {
  scene.updateMatrixWorld(true);
  const extentPoints = [];
  const coverPoints = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  scene.traverse((obj) => {
    if (!obj.isMesh || inGlowSubtree(obj)) return;
    const geo = obj.geometry;
    const pos = geo?.attributes?.position;
    if (!pos) return;
    const index = geo.index;
    const point = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      point.fromBufferAttribute(pos, i).applyMatrix4(obj.matrixWorld);
      extentPoints.push(point.x, point.y, point.z);
    }
    const triangleCount = index ? index.count / 3 : pos.count / 3;
    for (let triangle = 0; triangle < triangleCount; triangle++) {
      const base = triangle * 3;
      const ia = index ? index.getX(base) : base;
      const ib = index ? index.getX(base + 1) : base + 1;
      const ic = index ? index.getX(base + 2) : base + 2;
      a.fromBufferAttribute(pos, ia).applyMatrix4(obj.matrixWorld);
      b.fromBufferAttribute(pos, ib).applyMatrix4(obj.matrixWorld);
      c.fromBufferAttribute(pos, ic).applyMatrix4(obj.matrixWorld);
      a.add(b).add(c).multiplyScalar(1 / 3);
      coverPoints.push(a.x, a.y, a.z);
    }
  });
  if (extentPoints.length === 0 || coverPoints.length === 0) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(extentPoints), 3));
  const coverGeometry = new THREE.BufferGeometry();
  coverGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(coverPoints), 3));
  return { geometry, coverGeometry };
}

// ---- Proxy derivation ------------------------------------------------------
// Mirrors ship-assets.js proxyFor exactly. The radial axes cover primary mass;
// the axial cylinder ends inside the rounded capsule caps.

function deriveProxy(h) {
  return {
    rx: Math.max(h.spanX * 0.62, 0.1),
    ry: Math.max(h.spanY * 0.62, 0.1),
    halfLen: Math.max(h.spanZ * 0.67 - Math.max(h.spanX * 0.62, h.spanY * 0.62), 0.1),
  };
}

// ---- Main loop -------------------------------------------------------------

const want = process.argv.slice(2);
const targets = want.length > 0 ? want : [...FACTION_REBUILD_ORDER];
let failures = 0;

for (const faction of targets) {
  const sizes = {};

  for (const ck of CLASS_ORDER) {
    let gltf;
    try {
      gltf = await loadGlb(faction, ck);
    } catch (err) {
      console.log(`${faction} ${ck}: GLB LOAD FAIL — ${err.message}`);
      failures++;
      continue;
    }

    const hull = collectHullGeometry(gltf.scene);
    if (!hull) {
      console.log(`${faction} ${ck}: no hull geometry in LOD0`);
      failures++;
      continue;
    }
    const geo = hull.geometry;
    const h = measure(geo);
    const size = Math.max(h.spanX, h.spanY, h.spanZ);
    sizes[ck] = size;
    const sizeAxis = h.spanX >= h.spanY && h.spanX >= h.spanZ ? 'X'
      : h.spanY >= h.spanZ ? 'Y' : 'Z';

    const proxy = deriveProxy(h);
    const coverPct = proxyCover(hull.coverGeometry, proxy);
    const fit = proxyFit(h, proxy);

    const charter = scaleFor(ck);
    const rule = proportionFor(ck, faction);
    const bad = [];

    // Span band
    if (size < charter.span[0] || size > charter.span[1]) {
      bad.push(
        `size=${size.toFixed(1)}(${sizeAxis}) outside [${charter.span[0]},${charter.span[1]}]`
        + ` (${(size / P).toFixed(2)}P, want ${charter.pBand[0]}-${charter.pBand[1]}P)`,
      );
    }

    // Silhouette proportions
    if (h.spanX > 0 && h.spanZ > 0) {
      const lob = h.spanZ / h.spanX;
      if (lob < rule.minLengthOverBeam) {
        bad.push(`spanZ/spanX=${lob.toFixed(2)} < ${rule.minLengthOverBeam}`);
      }
      const bol = h.spanX / h.spanZ;
      if (bol < rule.minBeamOverLength) {
        bad.push(`spanX/spanZ=${bol.toFixed(2)} < ${rule.minBeamOverLength}`);
      }
    }
    if (h.spanY > 0 && h.spanZ > 0) {
      const hol = h.spanY / h.spanZ;
      if (hol > rule.maxHeightOverLength) {
        bad.push(`spanY/spanZ=${hol.toFixed(2)} > ${rule.maxHeightOverLength}`);
      }
    }

    // Pivot offset
    const mp = rule.maxPivotOffset;
    if (h.spanX > 0 && Math.abs(h.centre.x) > mp * h.spanX) {
      bad.push(`pivotX=${(h.centre.x / h.spanX).toFixed(2)} > ±${mp}`);
    }
    if (h.spanY > 0 && Math.abs(h.centre.y) > mp * h.spanY) {
      bad.push(`pivotY=${(h.centre.y / h.spanY).toFixed(2)} > ±${mp}`);
    }
    if (h.spanZ > 0 && Math.abs(h.centre.z) > mp * h.spanZ) {
      bad.push(`pivotZ=${(h.centre.z / h.spanZ).toFixed(2)} > ±${mp}`);
    }

    // Proxy coverage and fit
    if (coverPct < 80) {
      bad.push(
        `proxyCover=${coverPct.toFixed(1)}% < 80`
        + ` (rx=${proxy.rx.toFixed(2)} ry=${proxy.ry.toFixed(2)} halfLen=${proxy.halfLen.toFixed(2)})`,
      );
    }
    if (!fit.pass) {
      bad.push(
        `proxyFit w=${fit.widthPct.toFixed(0)}% h=${fit.heightPct.toFixed(0)}%`
        + ` l=${fit.lengthPct.toFixed(0)}% exceeds +25%/+25%/+35%`,
      );
    }

    // Census line
    const ratios = h.spanX > 0 && h.spanZ > 0
      ? `len/beam=${(h.spanZ / h.spanX).toFixed(2)}`
        + ` ht/len=${(h.spanY / h.spanZ).toFixed(2)}`
        + ` beam/len=${(h.spanX / h.spanZ).toFixed(2)}`
      : 'n/a';
    const line = `${faction.padEnd(13)} ${ck.padEnd(10)}`
      + ` verts=${String(h.verts).padStart(6)} size=${size.toFixed(1)}(${sizeAxis})`
      + ` ${ratios}`
      + ` ctr x=${h.centre.x.toFixed(1)} y=${h.centre.y.toFixed(1)} z=${h.centre.z.toFixed(1)}`
      + ` cover=${coverPct.toFixed(1)}%`
      + ` fit:w=${fit.widthPct.toFixed(0)}%,h=${fit.heightPct.toFixed(0)}%,l=${fit.lengthPct.toFixed(0)}%`;

    if (bad.length > 0) {
      failures++;
      console.log(`${line}\n  FAIL: ${bad.join(' | ')}`);
    } else {
      console.log(line);
    }

    geo.dispose();
    hull.coverGeometry.dispose();
  }

  // Per-faction class size ladder check.
  // Rule: light ≤ ace (within 15%) < cutter < heavy < frigate < freighter.
  const orderBad = [];
  const ls = sizes.light;
  const as_ = sizes.ace;
  if (ls !== undefined && as_ !== undefined && as_ < ls * 0.85) {
    orderBad.push(`ace(${as_.toFixed(1)}) < light(${ls.toFixed(1)}) by more than 15%`);
  }
  for (const [prev, next] of [
    ['ace', 'cutter'], ['cutter', 'heavy'], ['heavy', 'frigate'], ['frigate', 'freighter'],
  ]) {
    if (sizes[prev] !== undefined && sizes[next] !== undefined && sizes[next] <= sizes[prev]) {
      orderBad.push(`${next}(${sizes[next].toFixed(1)}) <= ${prev}(${sizes[prev].toFixed(1)})`);
    }
  }
  if (orderBad.length > 0) {
    failures++;
    console.log(`${faction} CLASS ORDER FAIL: ${orderBad.join(' | ')}`);
  } else {
    const ladder = CLASS_ORDER
      .filter((ck) => sizes[ck] !== undefined)
      .map((ck) => `${ck}=${sizes[ck].toFixed(1)}`)
      .join(' < ');
    console.log(`${faction} class order OK: ${ladder}`);
  }
}

console.log(
  failures === 0
    ? 'measure-ships: ALL PASS'
    : `measure-ships: ${failures} FAILING`,
);
process.exitCode = failures === 0 ? 0 : 1;
