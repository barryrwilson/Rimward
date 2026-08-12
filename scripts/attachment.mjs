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
