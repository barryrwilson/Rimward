/**
 * Ship sculpt metrics — the shared measurement kernel.
 *
 * scripts/measure-ships.mjs walks the whole fleet and pins it; this module is
 * the arithmetic underneath, split out so a SINGLE class can be measured on its
 * own. That matters while a faction family is being re-authored: the fleet
 * harness imports every class of every faction at once, so one half-written
 * sculpt makes the report useless for the five siblings being worked on beside
 * it. scripts/probe-class.mjs imports one class module and reports on it alone.
 *
 * Nothing here has an opinion about pass or fail. The pins live in the harness.
 */

import * as THREE from 'three';
import { FACTION_STYLE } from '../src/game/faction-style.js';

export const SHADES = [1.0, 0.86, 0.72, 0.6];

/** Build the set of allowed hull-colour hexes for a built faction. */
export const allowedHull = (faction) => {
  const st = FACTION_STYLE[faction];
  const set = new Set();
  for (const hex of new Set([st.hull, st.hullDark, st.trim, st.accent, ...st.patch])) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    for (const s of SHADES) {
      set.add(((Math.round(r * s) << 16) | (Math.round(g * s) << 8) | Math.round(b * s)) >>> 0);
    }
  }
  return set;
};

const probe = new THREE.Color();
const toHex = (r, g, b) => {
  probe.setRGB(r, g, b);
  return probe.getHex();
};

/**
 * Distinct sRGB hexes in a geometry's colour attribute.
 */
export const hexesOf = (geo) => {
  if (!geo.attributes.color) return new Set([0xffffff]);
  const attr = geo.attributes.color;
  const seen = new Set();
  for (let i = 0; i < attr.count; i++) {
    seen.add(toHex(attr.getX(i), attr.getY(i), attr.getZ(i)));
  }
  return seen;
};

/**
 * Occupancy grid over EDGE SAMPLES. A BoxGeometry carries vertices only at its
 * 8 corners, so a vertex-only grid at these cell sizes reads a solid spine as a
 * chain of islands. Walking every TRIANGLE edge in half-cell steps keeps the
 * measurement honest at ship scale — and it must stay byte-identical in spirit
 * to boot-test.mjs's w49edgeSampledOccupancy, which is the authority.
 */
export const massShare = (geo, cell) => {
  const p = geo.attributes.position;
  const grid = new Set();
  const mark = (x, y, z) => grid.add(`${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`);
  const step = cell / 2;
  for (let t = 0; t < p.count; t += 3) {
    for (let e = 0; e < 3; e++) {
      const i = t + e;
      const j = t + ((e + 1) % 3);
      const ax = p.getX(i); const ay = p.getY(i); const az = p.getZ(i);
      const bx = p.getX(j); const by = p.getY(j); const bz = p.getZ(j);
      const d = Math.hypot(bx - ax, by - ay, bz - az);
      const n = Math.max(1, Math.ceil(d / step));
      for (let k = 0; k <= n; k++) {
        const f = k / n;
        mark(ax + (bx - ax) * f, ay + (by - ay) * f, az + (bz - az) * f);
      }
    }
  }
  const neighbours = (key) => {
    const [ix, iy, iz] = key.split(',').map(Number);
    return [`${ix + 1},${iy},${iz}`, `${ix - 1},${iy},${iz}`, `${ix},${iy + 1},${iz}`,
      `${ix},${iy - 1},${iz}`, `${ix},${iy},${iz + 1}`, `${ix},${iy},${iz - 1}`];
  };
  const seen = new Set();
  const comps = []; // { size, min:[x,y,z], max:[x,y,z] } in world units
  for (const start of grid) {
    if (seen.has(start)) continue;
    let size = 0;
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    const stack = [start];
    seen.add(start);
    while (stack.length > 0) {
      const cur = stack.pop();
      size++;
      const idx = cur.split(',').map(Number);
      for (let a = 0; a < 3; a++) {
        if (idx[a] * cell < lo[a]) lo[a] = idx[a] * cell;
        if ((idx[a] + 1) * cell > hi[a]) hi[a] = (idx[a] + 1) * cell;
      }
      for (const n of neighbours(cur)) {
        if (grid.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
      }
    }
    comps.push({ size, min: lo, max: hi });
  }
  comps.sort((a, b) => b.size - a.size);
  const largest = comps.length > 0 ? comps[0].size : 0;
  // Name the islands: a singleMass failure is almost always ONE part that
  // misses the hull, and its bounding box is the fastest way to find which.
  const islands = comps.slice(1, 4).map((c) => `${c.size} cells`
    + ` x[${c.min[0].toFixed(1)},${c.max[0].toFixed(1)}]`
    + ` y[${c.min[1].toFixed(1)},${c.max[1].toFixed(1)}]`
    + ` z[${c.min[2].toFixed(1)},${c.max[2].toFixed(1)}]`).join(' + ');
  return { share: grid.size > 0 ? largest / grid.size : 0, cells: grid.size, comps: comps.length, islands };
};

/**
 * Share of `detail` vertices with no hull vertex in their 3x3x3 cell block.
 * Math.floor, not Math.round — the boot test's w49orphanPct floors, and the two
 * harnesses have to agree or a sculpt passes one gate and fails the other.
 */
export const orphanPct = (hull, detail, cell = 1.0) => {
  const hp = hull.attributes.position;
  const occupied = new Set();
  for (let i = 0; i < hp.count; i++) {
    occupied.add(`${Math.floor(hp.getX(i) / cell)},${Math.floor(hp.getY(i) / cell)},${Math.floor(hp.getZ(i) / cell)}`);
  }
  const dp = detail.attributes.position;
  if (dp.count === 0) return 100;
  let orphans = 0;
  for (let i = 0; i < dp.count; i++) {
    const ix = Math.floor(dp.getX(i) / cell);
    const iy = Math.floor(dp.getY(i) / cell);
    const iz = Math.floor(dp.getZ(i) / cell);
    let near = false;
    for (let dx = -1; dx <= 1 && !near; dx++) {
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dz = -1; dz <= 1 && !near; dz++) {
          if (occupied.has(`${ix + dx},${iy + dy},${iz + dz}`)) near = true;
        }
      }
    }
    if (!near) orphans++;
  }
  return (100 * orphans) / dp.count;
};

/**
 * Measure a geometry: vertex count, ABSOLUTE half-extents per axis (what the
 * legacy envelope pins compare against), full spans, bbox centre (the pivot
 * pin), max radius from the local origin, and stern reach (largest positive z).
 *
 * maxX/maxY/maxZ are max(|coord|), NOT bbox.max — a hull whose nose reaches
 * z=-9 and stern z=+3 has a legacy maxZ of 9, and reading bbox.max.z would
 * silently pass a sculpt that is half again too long forward.
 */
export const measure = (geo) => {
  const p = geo.attributes.position;
  let maxX = 0; let maxY = 0; let maxZ = 0; let sternZ = 0; let r2 = 0;
  let loX = Infinity; let hiX = -Infinity;
  let loY = Infinity; let hiY = -Infinity;
  let loZ = Infinity; let hiZ = -Infinity;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
    if (Math.abs(x) > maxX) maxX = Math.abs(x);
    if (Math.abs(y) > maxY) maxY = Math.abs(y);
    if (Math.abs(z) > maxZ) maxZ = Math.abs(z);
    if (z > sternZ) sternZ = z;
    if (x < loX) loX = x; if (x > hiX) hiX = x;
    if (y < loY) loY = y; if (y > hiY) hiY = y;
    if (z < loZ) loZ = z; if (z > hiZ) hiZ = z;
    const d = x * x + y * y + z * z;
    if (d > r2) r2 = d;
  }
  return {
    verts: p.count, maxX, maxY, maxZ, sternZ, radius: Math.sqrt(r2),
    spanX: hiX - loX, spanY: hiY - loY, spanZ: hiZ - loZ,
    centre: { x: (loX + hiX) / 2, y: (loY + hiY) / 2, z: (loZ + hiZ) / 2 },
  };
};
