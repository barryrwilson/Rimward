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
 * Fraction of hull vertices inside the elliptical collision capsule.
 *
 * The proxy `{ rx, ry, halfLen }` is now **derived per sculpt** from the hull's
 * vertex distribution by `deriveProxy` in `src/systems/npc.js` and cached on
 * `group.userData.proxy` by `buildShipMesh`.  Harnesses source it from there,
 * falling back to `SHIP_SCALE[class].proxy` only for hull-less shapes (e.g.
 * Unknowables energy fields).  This function is agnostic about where the proxy
 * came from — pass whatever `{ rx, ry, halfLen }` the caller resolved.
 *
 * **True capsule test (mirrors combat.js exactly).**  For each hull vertex:
 * 1. Clamp the vertex's local Z to [−halfLen, +halfLen] to get the nearest
 *    point on the axis segment: (0, 0, cz).
 * 2. Take the 3-D offset from the vertex to that clamped point:
 *    (x, y, dz) where dz = z − cz (nonzero only when the vertex lies past a cap).
 * 3. The effective ellipse radius in the vertex's XY direction is
 *    rEff = r_xy / sqrt((x/rx)² + (y/ry)²)   (r_xy = sqrt(x²+y²))
 *    falling back to min(rx, ry) when the vertex is on the axis (r_xy = 0).
 * 4. The vertex is inside when sqrt(x²+y²+dz²) ≤ rEff, which is equivalent to
 *    E·(r_xy²+dz²) ≤ r_xy²  where E = (x/rx)²+(y/ry)².
 *    A vertex past a cap (dz ≠ 0) must therefore fall closer to the axis than
 *    one flush with the disc face — the end caps are the same elliptic profile
 *    as the body cross-section.
 *
 * The previous form clamped z and discarded the result, so coverage was a
 * purely radial metric independent of halfLen.  A capsule with halfLen = 0
 * still scored its radial 90th-percentile coverage, and because proxyFit only
 * bounds excess length nothing in the harness detected an underlength capsule.
 * Bolts would miss the nose and stern while every gate read green.  The true
 * capsule test closes that gap: a vertex lying past a cap now correctly counts
 * as outside.
 *
 * **Hostile input.**  A proxy with NaN or a zero semi-axis returns 0 (clear
 * failure) rather than propagating NaN through the comparison.
 *
 * **Why the bar is 80%, not 100%.** The capsule follows PRIMARY MASS only.
 * Thin appendages (antennae, masts, tendrils, cranes, sails, docking spars,
 * field wakes) sit outside it on purpose — a bolt passes through a mast without
 * registering a hull hit, and that is by design. A 92% reading is not a defect.
 * Below 80% the capsule no longer covers the ship's main body and fails.
 *
 * One-sided metric: use alongside proxyFit, which catches the complementary
 * defect where the capsule is too large.
 */
export const proxyCover = (hull, proxy) => {
  const p = hull.attributes.position;
  const { rx, ry, halfLen } = proxy;
  // Hostile-input guard: NaN or non-positive semi-axis → clear failure.
  if (!Number.isFinite(rx) || !Number.isFinite(ry) || !Number.isFinite(halfLen)
      || rx <= 0 || ry <= 0) {
    return 0;
  }
  const rx2 = rx * rx;
  const ry2 = ry * ry;
  const minR2 = rx < ry ? rx2 : ry2; // used for on-axis fallback (min(rx,ry)²)
  let inside = 0;

  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    // Nearest point on the axis segment: (0, 0, cz).
    const cz = z < -halfLen ? -halfLen : (z > halfLen ? halfLen : z);
    const dz = z - cz; // nonzero only when vertex is past a cap
    const rxy2 = x * x + y * y;
    if (rxy2 === 0) {
      // Vertex lies on the axis — effective radius is min(rx, ry).
      if (dz * dz <= minR2) inside++;
    } else {
      // E * (rxy² + dz²) ≤ rxy²  where E = (x/rx)² + (y/ry)²
      const E = x * x / rx2 + y * y / ry2;
      if (E * (rxy2 + dz * dz) <= rxy2) inside++;
    }
  }

  return (100 * inside) / p.count;
};

/**
 * Capsule overshoot against the sculpt's own measured extents, per axis.
 *
 * The proxy `{ rx, ry, halfLen }` is derived per sculpt — see proxyCover's doc for
 * the full derivation story.  This function is agnostic about where the proxy came
 * from; pass whatever `{ rx, ry, halfLen }` the caller resolved.
 *
 * Returns signed percentages — positive means the capsule exceeds the hull on
 * that axis, negative means it is smaller.  Ceilings:
 *   width  (2·rx vs spanX)                      ≤ +25%
 *   height (2·ry vs spanY)                      ≤ +25%
 *   length (2·(halfLen + max(rx,ry)) vs spanZ)  ≤ +35%  (end caps legitimately
 *     round past tapered noses and sterns, so the length ceiling is looser)
 *
 * **Why both metrics are necessary.**  proxyCover stops the capsule being too
 * SMALL — it rewards any proxy that swallows the primary mass, including one
 * that also swallows a large empty volume above the deck.  A circular capsule
 * sized for a flat hull's beam must stand 2–3× the hull's height and still
 * scores healthy coverage.  proxyFit stops the capsule being too BIG — a bolt
 * passing visibly over the hull should not score a hit.  Neither metric alone
 * has a sound optimum: coverage alone is satisfied by inflating the capsule;
 * fit alone is satisfied by shrinking below the coverage floor.  Together they
 * bracket the proxy to a zone that is neither too small nor too large.
 *
 * **Hostile input.**  A proxy with NaN or a zero semi-axis, or a geometry with
 * a zero-span axis, returns pass:false rather than propagating NaN.
 *
 * @param {object} extents  Result of measure() — needs spanX, spanY, spanZ.
 * @param {object} proxy    { rx, ry, halfLen } — derived per sculpt by deriveProxy
 *                          in src/systems/npc.js; cached on group.userData.proxy.
 */
export const proxyFit = (extents, proxy) => {
  const { rx, ry, halfLen } = proxy;
  const { spanX, spanY, spanZ } = extents;
  // Hostile-input guard: NaN or non-positive values → clear failure.
  if (!Number.isFinite(rx) || !Number.isFinite(ry) || !Number.isFinite(halfLen)
      || rx <= 0 || ry <= 0 || spanX <= 0 || spanY <= 0 || spanZ <= 0) {
    return { widthPct: NaN, heightPct: NaN, lengthPct: NaN, pass: false };
  }
  const widthPct  = (2 * rx - spanX) / spanX * 100;
  const heightPct = (2 * ry - spanY) / spanY * 100;
  const lengthPct = (2 * (halfLen + Math.max(rx, ry)) - spanZ) / spanZ * 100;
  const pass = widthPct <= 25 && heightPct <= 25 && lengthPct <= 35;
  return { widthPct, heightPct, lengthPct, pass };
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
