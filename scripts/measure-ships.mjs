/**
 * Ship sculpt measurement — the wave-47 instrument, kept.
 *
 * Builds every `src/systems/ships/<faction>.js` sculpt directly through
 * detailBuilder and reports the numbers the Phase 7 pins care about, per
 * faction x classKey: hull/lights vertices, spans, radius (max distance from
 * the local origin), envelope, proportion, single-mass share over an
 * EDGE-SAMPLED occupancy grid (raw vertices are far too sparse at ship scale),
 * orphan-lights share, palette strays, lights tints below the 0.6 floor, and
 * determinism.
 *
 * scripts/boot-test.mjs pins the same contract inside the real spawn path and
 * is the authority. This exists because it runs in 3 seconds across 60 sculpts
 * and names the offending class, which is what makes a bring-up loop possible:
 * waves 43-47 all learned the same lesson, that a sculpt is only as good as the
 * last measurement someone actually ran. Use it while authoring; use the boot
 * test before committing.
 *
 * Usage: node scripts/measure-ships.mjs [faction ...]
 */

import * as THREE from 'three';
import { detailBuilder } from '../src/systems/station-detail.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';

const FACTIONS = ['freehold', 'veridian', 'ferrous', 'redledger', 'gilded',
  'congregation', 'assembly', 'lamplighter', 'independent', 'hollow'];
const CLASSES = ['light', 'cutter', 'ace', 'freighter', 'heavy', 'frigate'];

const SPEC = {
  light: { env: [1.3, 0.9, 3.4], hull: [3000, 12000], lit: 200, cell: 0.6, rad: [2.2, 3.5] },
  cutter: { env: [1.8, 1.2, 5.0], hull: [4000, 16000], lit: 260, cell: 0.7, rad: [3.0, 5.0] },
  ace: { env: [2.2, 1.3, 5.8], hull: [4000, 16000], lit: 260, cell: 0.7, rad: [4.4, 5.8] },
  freighter: { env: [2.8, 2.0, 7.4], hull: [6000, 24000], lit: 400, cell: 0.9, rad: [4.4, 7.2] },
  heavy: { env: [3.6, 2.4, 8.8], hull: [7000, 28000], lit: 460, cell: 1.0, rad: [6.0, 9.0] },
  frigate: { env: [9.0, 6.0, 26.0], hull: [15000, 60000], lit: 900, cell: 2.0, rad: [21.0, 32.0] },
};
const SHADES = [1.0, 0.86, 0.72, 0.6];
const allowedHull = (faction) => {
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
  probe.setRGB(r, g, b, THREE.LinearSRGBColorSpace);
  return probe.getHex(THREE.SRGBColorSpace);
};

/** Distinct sRGB hexes in a geometry's colour attribute. */
const hexesOf = (geo) => {
  const c = geo.attributes.color;
  const out = new Set();
  const seen = new Set();
  for (let i = 0; i < c.count; i++) {
    const key = `${c.getX(i)},${c.getY(i)},${c.getZ(i)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.add(toHex(c.getX(i), c.getY(i), c.getZ(i)));
  }
  return out;
};

/**
 * Occupancy grid over EDGE SAMPLES. A BoxGeometry carries vertices only at its
 * 8 corners, so a vertex-only grid at these cell sizes reads a solid spine as a
 * chain of islands. Walking every triangle edge in half-cell steps keeps the
 * measurement honest at ship scale.
 */
const massShare = (geo, cell) => {
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
  // Name the islands: a singleMass failure is always ONE part that misses the
  // hull, and its bounding box is the fastest way to find which one.
  const islands = comps.slice(1, 4).map((c) => `${c.size} cells`
    + ` x[${c.min[0].toFixed(1)},${c.max[0].toFixed(1)}]`
    + ` y[${c.min[1].toFixed(1)},${c.max[1].toFixed(1)}]`
    + ` z[${c.min[2].toFixed(1)},${c.max[2].toFixed(1)}]`).join(' + ');
  return { share: grid.size > 0 ? largest / grid.size : 0, cells: grid.size, comps: comps.length, islands };
};

/** Share of `detail` vertices with no hull material in their 3x3x3 cell block. */
const orphanPct = (hull, detail, cell = 1.0) => {
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

const measure = (geo) => {
  const p = geo.attributes.position;
  let maxX = 0; let maxY = 0; let maxZ = 0; let sternZ = 0; let r2 = 0;
  let loX = Infinity; let hiX = -Infinity; let loY = Infinity; let hiY = -Infinity;
  let loZ = Infinity; let hiZ = -Infinity;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
    if (Math.abs(x) > maxX) maxX = Math.abs(x);
    if (Math.abs(y) > maxY) maxY = Math.abs(y);
    if (Math.abs(z) > maxZ) maxZ = Math.abs(z);
    if (z > sternZ) sternZ = z; // stern reach (+Z)
    if (x < loX) loX = x; if (x > hiX) hiX = x;
    if (y < loY) loY = y; if (y > hiY) hiY = y;
    if (z < loZ) loZ = z; if (z > hiZ) hiZ = z;
    const d = x * x + y * y + z * z;
    if (d > r2) r2 = d;
  }
  return {
    verts: p.count, maxX, maxY, maxZ, sternZ, radius: Math.sqrt(r2),
    spanX: hiX - loX, spanY: hiY - loY, spanZ: hiZ - loZ,
  };
};

const want = process.argv.slice(2);
const targets = want.length > 0 ? want : FACTIONS;
let failures = 0;

for (const faction of targets) {
  let mod;
  try {
    mod = await import(`../src/systems/ships/${faction}.js`);
  } catch (err) {
    console.log(`${faction}: MODULE LOAD FAIL — ${err.message}`);
    failures++;
    continue;
  }
  const kit = mod[`${faction}Ship`];
  if (!kit) {
    console.log(`${faction}: no export named ${faction}Ship (got ${Object.keys(mod).join(',')})`);
    failures++;
    continue;
  }
  const allowed = allowedHull(faction);
  for (const ck of CLASSES) {
    const spec = SPEC[ck];
    const entry = kit[ck];
    if (!entry || typeof entry.build !== 'function' || typeof entry.glowZ !== 'number') {
      console.log(`${faction} ${ck}: MISSING or malformed entry`);
      failures++;
      continue;
    }
    let geos;
    let geosB;
    try {
      const b = detailBuilder();
      entry.build(b, FACTION_STYLE[faction]);
      geos = b.build();
      const b2 = detailBuilder();
      entry.build(b2, FACTION_STYLE[faction]);
      geosB = b2.build();
    } catch (err) {
      console.log(`${faction} ${ck}: BUILD THREW — ${err.message}`);
      failures++;
      continue;
    }
    const bad = [];
    if (!geos.hull) bad.push('no hull chunk');
    if (!geos.lights) bad.push('no lights chunk');
    const extra = Object.keys(geos).filter((k) => k !== 'hull' && k !== 'lights');
    if (extra.length > 0) bad.push(`extra channels ${extra.join(',')}`);
    if (!geos.hull) {
      console.log(`${faction} ${ck}: ${bad.join('; ')}`);
      failures++;
      continue;
    }
    const h = measure(geos.hull);
    const l = geos.lights ? measure(geos.lights) : { verts: 0 };
    const mass = massShare(geos.hull, spec.cell);
    const orphan = geos.lights ? orphanPct(geos.hull, geos.lights) : 100;

    if (h.verts < spec.hull[0]) bad.push(`hull ${h.verts} < ${spec.hull[0]}`);
    if (h.verts > spec.hull[1]) bad.push(`hull ${h.verts} > ${spec.hull[1]}`);
    if (l.verts < spec.lit) bad.push(`lights ${l.verts} < ${spec.lit}`);
    if (l.verts > h.verts * 0.25) bad.push(`lights ${l.verts} > 25% of hull`);
    if (h.maxX > spec.env[0]) bad.push(`x ${h.maxX.toFixed(2)} > ${spec.env[0]}`);
    if (h.maxY > spec.env[1]) bad.push(`y ${h.maxY.toFixed(2)} > ${spec.env[1]}`);
    if (h.maxZ > spec.env[2]) bad.push(`z ${h.maxZ.toFixed(2)} > ${spec.env[2]}`);
    // PROPORTION — the round-2 pins. Round 1 passed every other check and
    // rendered ten fleets of plated drums: height came out equal to beam and
    // length barely exceeded either. Every ship on overview-ships.jpg is 4-6x
    // longer than its beam with its height well under its beam.
    if (h.spanZ < 2.4 * h.spanX) {
      bad.push(`tooStubby ${h.spanZ.toFixed(1)} long vs ${h.spanX.toFixed(1)} beam (need >= 2.4x)`);
    }
    if (h.spanY > 0.75 * h.spanX) {
      bad.push(`tooTall ${h.spanY.toFixed(1)} tall vs ${h.spanX.toFixed(1)} beam (need <= 0.75x)`);
    }
    // The absolute band is the authored contract. The ratio against the
    // VC_PARTS fallback bake was dropped in wave 47 closeout: the bands were
    // derived from hand-computed fallback radii, the hand arithmetic was 15%
    // out for `heavy`, and once measured the derived band came out tighter than
    // the authored ceiling and overruled it. See the plan doc, `radiusBand`.
    if (h.radius < spec.rad[0]) bad.push(`radius ${h.radius.toFixed(2)} < class floor ${spec.rad[0]}`);
    if (h.radius > spec.rad[1]) bad.push(`radius ${h.radius.toFixed(2)} > class ceiling ${spec.rad[1]}`);
    if (!(entry.glowZ > 0 && entry.glowZ <= h.sternZ + 1.2 && entry.glowZ >= 0.55 * h.sternZ)) {
      bad.push(`glowZ ${entry.glowZ} vs stern ${h.sternZ.toFixed(2)}`);
    }
    if (mass.share < 0.97) bad.push(`singleMass ${(100 * mass.share).toFixed(1)}% (${mass.comps} comps; islands: ${mass.islands})`);
    if (orphan > 2) bad.push(`orphanLights ${orphan.toFixed(2)}%`);

    const strays = [...hexesOf(geos.hull)].filter((hex) => !allowed.has(hex));
    if (strays.length > 0) {
      bad.push(`hull strays ${strays.slice(0, 4).map((x) => `#${x.toString(16).padStart(6, '0')}`).join(',')}`);
    }
    if (geos.lights) {
      const dim = [...hexesOf(geos.lights)].filter((hex) => Math.min((hex >> 16) & 255, (hex >> 8) & 255, hex & 255) / 255 < 0.6);
      if (dim.length > 0) {
        bad.push(`lights below 0.6 ${dim.slice(0, 4).map((x) => `#${x.toString(16).padStart(6, '0')}`).join(',')}`);
      }
    }
    if (geosB.hull) {
      const a1 = geos.hull.attributes.position.array;
      const b1 = geosB.hull.attributes.position.array;
      const same = a1.length === b1.length && a1.every((v, i) => v === b1[i]);
      if (!same) bad.push('non-deterministic');
    }

    const line = `${faction.padEnd(13)} ${ck.padEnd(10)}`
      + ` hull=${String(h.verts).padStart(6)} lights=${String(l.verts).padStart(5)}`
      + ` r=${h.radius.toFixed(1).padStart(5)}`
      + ` span=${h.spanX.toFixed(1)}x${h.spanY.toFixed(1)}x${h.spanZ.toFixed(1)}`
      + ` stern=${h.sternZ.toFixed(1)} glowZ=${entry.glowZ}`
      + ` mass=${(100 * mass.share).toFixed(1)}%`
      + ` orphan=${orphan.toFixed(1)}%`;
    if (bad.length > 0) { failures++; console.log(`${line}\n    FAIL: ${bad.join(' | ')}`); } else console.log(line);
    for (const g of [...Object.values(geos), ...Object.values(geosB)]) g.dispose();
  }
}
console.log(failures === 0 ? 'measure-ships: ALL PASS' : `measure-ships: ${failures} FAILING SCULPTS`);
