/**
 * Ship asset metrics — shared measurement kernel for GLB-sourced geometry.
 *
 * All functions accept any object whose `attributes.position` carries
 * { count, getX, getY, getZ } — the Three.js BufferAttribute interface.
 * Callers extract geometry from LOD0 GLB scenes; this module has no opinion
 * about pass or fail. Thresholds live in the calling scripts.
 *
 * Removed in the GLB migration: SHADES, allowedHull, hexesOf, massShare,
 * orphanPct. Those measured vertex-colour attributes on procedural geometry.
 * GLB assets carry no vertex colours; material identity is encoded in
 * mesh.material.name (RIMWARD_HULL / RIMWARD_EMISSIVE).
 */

/**
 * Fraction of hull vertices inside the elliptical collision capsule.
 *
 * The proxy { rx, ry, halfLen } mirrors the formula in ship-assets.js proxyFor
 * and the test in combat.js exactly.
 *
 * True capsule test:
 *   1. Clamp vertex Z to [-halfLen, +halfLen] → nearest axis point (0, 0, cz).
 *   2. XY offset (x, y) + cap offset dz = z - cz (nonzero past a cap).
 *   3. E = (x/rx)² + (y/ry)²; inside when E·(rxy²+dz²) ≤ rxy².
 *
 * Why 80% bar: the capsule covers primary mass only. Thin appendages (antennae,
 * cranes, tendrils) are outside by design. Below 80% the capsule misses the
 * main body. Use alongside proxyFit.
 *
 * Hostile input: NaN or non-positive semi-axis → 0 (clear failure).
 */
export const proxyCover = (hull, proxy) => {
  const p = hull.attributes.position;
  const { rx, ry, halfLen } = proxy;
  if (!Number.isFinite(rx) || !Number.isFinite(ry) || !Number.isFinite(halfLen)
      || rx <= 0 || ry <= 0) {
    return 0;
  }
  const rx2 = rx * rx;
  const ry2 = ry * ry;
  const minR2 = rx < ry ? rx2 : ry2;
  let inside = 0;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const cz = z < -halfLen ? -halfLen : (z > halfLen ? halfLen : z);
    const dz = z - cz;
    const rxy2 = x * x + y * y;
    if (rxy2 === 0) {
      if (dz * dz <= minR2) inside++;
    } else {
      const E = x * x / rx2 + y * y / ry2;
      if (E * (rxy2 + dz * dz) <= rxy2) inside++;
    }
  }
  return (100 * inside) / p.count;
};

/**
 * Capsule overshoot against the hull's own measured extents, per axis.
 *
 * Returns signed percentages: positive = capsule exceeds hull on that axis.
 * Ceilings: width ≤ +25%, height ≤ +25%, length ≤ +35% (end caps round past
 * tapered noses and sterns, so length ceiling is looser).
 *
 * Neither metric alone has a sound optimum: coverage rewards inflation, fit
 * rewards deflation. Together they bracket the proxy to the correct zone.
 *
 * Hostile input: NaN or zero semi-axis / zero span → pass:false.
 *
 * @param {{ spanX, spanY, spanZ }} extents  Result of measure().
 * @param {{ rx, ry, halfLen }}     proxy    Derived from the asset bounding box.
 */
export const proxyFit = (extents, proxy) => {
  const { rx, ry, halfLen } = proxy;
  const { spanX, spanY, spanZ } = extents;
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
 * Measure a geometry: vertex count, ABSOLUTE half-extents per axis, full spans,
 * bbox centre (pivot pin), max radius from origin, and stern reach (largest +Z).
 *
 * maxX/maxY/maxZ are max(|coord|), NOT bbox.max — a hull whose nose reaches
 * z=-9 and stern z=+3 has maxZ 9.
 *
 * `centre` is the bbox centroid in the geometry's local space. For a
 * well-authored asset the root pivot sits at (0,0,0) near the centre of mass;
 * a large |centre.x / spanX| signals an off-centre root.
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
