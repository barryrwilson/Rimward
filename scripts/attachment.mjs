/**
 * Per-part attachment analysis — the instrument that sees a floating greeble.
 *
 * WHY THIS EXISTS. `singleMass` floods an edge-sampled occupancy grid and joins
 * cells by 6-neighbour ADJACENCY. Its cell runs from 0.6 units on a light craft
 * to 3.2 on a freighter, so two parts sitting in neighbouring cells count as one
 * connected mass even when a reviewer can plainly see a gap between them. Wave 49
 * shipped a Veridian family that measured 100% single mass and rendered with
 * detached hull sections and greebles floating beside the plating.
 *
 * The honest question is per PART, not per cell: is every part actually touching
 * something else? That is what this measures, using the axis-aligned bounding box
 * `detailBuilder({ track: true })` records for each part.
 *
 * WHAT IT MEASURES, AND ITS LIMITS. Two parts are treated as joined when their
 * boxes overlap after inflating each by TOUCH_EPS. Box overlap is a NECESSARY
 * condition for surfaces to touch, not a sufficient one — two long members
 * crossing at a distance can overlap in AABB without meeting. So this metric
 * cannot prove a sculpt is connected; it can only prove that a part is NOT. That
 * is the direction that matters: every failure it reports is real, and it reports
 * the offending part's call site.
 *
 * TOUCH_EPS is deliberately small and ABSOLUTE. Attachment is a physical
 * question, not a class-relative one: a bracket half a unit (1.8 m) off the
 * plating is floating on a scout and on a freighter alike. Scaling the tolerance
 * with the class is the mistake that let the occupancy grid pass this fleet.
 */

/** Absolute overlap tolerance, world units. ~0.29 m at 1 unit = 3.64 m. */
export const TOUCH_EPS = 0.08;

const overlaps = (a, bx, eps) => (
  a.min[0] - eps <= bx.max[0] + eps && a.max[0] + eps >= bx.min[0] - eps
  && a.min[1] - eps <= bx.max[1] + eps && a.max[1] + eps >= bx.min[1] - eps
  && a.min[2] - eps <= bx.max[2] + eps && a.max[2] + eps >= bx.min[2] - eps
);

const fmt = (p) => `${p.channel} `
  + `x[${p.min[0].toFixed(2)},${p.max[0].toFixed(2)}] `
  + `y[${p.min[1].toFixed(2)},${p.max[1].toFixed(2)}] `
  + `z[${p.min[2].toFixed(2)},${p.max[2].toFixed(2)}] @ ${p.site}`;

/**
 * Analyse a tracked builder's parts.
 *
 * @param {Array} parts `builder.parts()` from `detailBuilder({ track: true })`
 * @param {number} eps overlap tolerance, defaults to TOUCH_EPS
 * @returns {{
 *   total: number, lonely: number, components: number, largest: number,
 *   attachedPct: number, lonelyList: string[], strayList: string[],
 * }}
 *   `lonely` counts parts that overlap NOTHING else — an unambiguous floater.
 *   `components` is the number of connected groups in the overlap graph;
 *   `largest` is the biggest group's size and `attachedPct` its share, so a
 *   detached CLUSTER (a whole silo plus its plating) is caught as well as a lone
 *   greeble. `lonelyList` and `strayList` name up to six offenders each, with
 *   their boxes and the source line that added them.
 */
export function analyseAttachment(parts, eps = TOUCH_EPS) {
  const n = parts.length;
  if (n === 0) {
    return {
      total: 0, lonely: 0, components: 0, largest: 0, attachedPct: 0,
      lonelyList: ['builder was not tracking parts'], strayList: [],
    };
  }

  // Adjacency by box overlap. O(n^2) on ~1-3k parts is a few million cheap
  // integer comparisons — well under the cost of the occupancy grid it replaces.
  const adj = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (overlaps(parts[i], parts[j], eps)) {
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  const lonelyIdx = [];
  for (let i = 0; i < n; i++) if (adj[i].length === 0) lonelyIdx.push(i);

  // Connected components over the overlap graph.
  const comp = new Int32Array(n).fill(-1);
  const sizes = [];
  for (let s = 0; s < n; s++) {
    if (comp[s] !== -1) continue;
    const id = sizes.length;
    let size = 0;
    const stack = [s];
    comp[s] = id;
    while (stack.length > 0) {
      const cur = stack.pop();
      size++;
      for (const k of adj[cur]) {
        if (comp[k] === -1) { comp[k] = id; stack.push(k); }
      }
    }
    sizes.push(size);
  }
  let largest = 0;
  let largestId = -1;
  for (let i = 0; i < sizes.length; i++) {
    if (sizes[i] > largest) { largest = sizes[i]; largestId = i; }
  }

  // Strays: parts outside the main component but not lonely — a detached
  // cluster, which is the harder defect to spot by eye in a wireframe.
  const strayIdx = [];
  for (let i = 0; i < n; i++) {
    if (comp[i] !== largestId && adj[i].length > 0) strayIdx.push(i);
  }

  return {
    total: n,
    lonely: lonelyIdx.length,
    components: sizes.length,
    largest,
    attachedPct: (100 * largest) / n,
    lonelyList: lonelyIdx.slice(0, 6).map((i) => fmt(parts[i])),
    strayList: strayIdx.slice(0, 6).map((i) => fmt(parts[i])),
  };
}

/**
 * Contact analysis on a FIXED FINE occupancy grid.
 *
 * This is the decisive connectivity metric, and it exists because the other two
 * both have blind spots:
 *
 *   - `singleMass` in the harnesses scales its cell with the class (0.6 to 3.2
 *     units) and joins cells by ADJACENCY, so it passes parts with visible gaps.
 *   - `analyseAttachment` above compares part BOUNDING BOXES. Box overlap is
 *     necessary but not sufficient for contact: a vane whose root box just grazes
 *     the hull's box scores as attached while the render shows daylight between
 *     them. That false negative shipped detached ranging vanes on the Veridian
 *     light craft after the box test had already reported ALL PARTS ATTACHED.
 *
 * Here every triangle edge is walked in half-cell steps into a grid of FIXED
 * CELL SIZE, and cells are joined only when they are the same cell or immediate
 * neighbours. At CONTACT_CELL = 0.3 units (~1.1 m, roughly the human module) a
 * hairline tangent still registers, but a gap of one cell does not. The cell is
 * absolute for the same reason the lights-seating cell is: contact is physical,
 * not class-relative.
 *
 * Cost is proportional to total edge length, not to class size, and it runs in
 * well under a second even on a 100k-vertex freighter.
 */
export const CONTACT_CELL = 0.3;

export function analyseContact(geometries, cell = CONTACT_CELL) {
  const grid = new Map(); // key -> index into cellList
  const cellList = []; // [ix, iy, iz]
  const step = cell / 2;

  const mark = (x, y, z) => {
    const ix = Math.floor(x / cell);
    const iy = Math.floor(y / cell);
    const iz = Math.floor(z / cell);
    const key = `${ix},${iy},${iz}`;
    if (!grid.has(key)) {
      grid.set(key, cellList.length);
      cellList.push([ix, iy, iz]);
    }
  };

  for (const geo of geometries) {
    if (!geo) continue;
    const p = geo.attributes.position;
    for (let t = 0; t + 2 < p.count; t += 3) {
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
  }

  const total = cellList.length;
  if (total === 0) {
    return { cells: 0, components: 0, largest: 0, attachedPct: 0, islands: [] };
  }

  const seen = new Uint8Array(total);
  const comps = []; // { size, min:[x,y,z], max:[x,y,z] } in world units
  for (let s = 0; s < total; s++) {
    if (seen[s]) continue;
    let size = 0;
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    const stack = [s];
    seen[s] = 1;
    while (stack.length > 0) {
      const cur = stack.pop();
      const [ix, iy, iz] = cellList[cur];
      size++;
      for (let a = 0; a < 3; a++) {
        const v = [ix, iy, iz][a];
        if (v * cell < lo[a]) lo[a] = v * cell;
        if ((v + 1) * cell > hi[a]) hi[a] = (v + 1) * cell;
      }
      // 26-neighbourhood: a diagonal touch is still a touch. Using only the 6
      // face neighbours would split a part meeting another at a corner.
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && dy === 0 && dz === 0) continue;
            const k = grid.get(`${ix + dx},${iy + dy},${iz + dz}`);
            if (k !== undefined && !seen[k]) { seen[k] = 1; stack.push(k); }
          }
        }
      }
    }
    comps.push({ size, min: lo, max: hi });
  }

  comps.sort((a, b) => b.size - a.size);
  const largest = comps[0].size;
  return {
    cells: total,
    components: comps.length,
    largest,
    attachedPct: (100 * largest) / total,
    islands: comps.slice(1, 8).map((c) => ({
      size: c.size,
      label: `${c.size} cells`
        + ` x[${c.min[0].toFixed(2)},${c.max[0].toFixed(2)}]`
        + ` y[${c.min[1].toFixed(2)},${c.max[1].toFixed(2)}]`
        + ` z[${c.min[2].toFixed(2)},${c.max[2].toFixed(2)}]`,
      min: c.min,
      max: c.max,
    })),
  };
}

/** Parts whose box intersects an island box — names what is floating. */
export function blameIsland(parts, island, eps = TOUCH_EPS) {
  const box = { min: island.min, max: island.max };
  return parts
    .filter((p) => overlaps(p, box, eps))
    .slice(0, 4)
    .map((p) => fmt(p));
}
