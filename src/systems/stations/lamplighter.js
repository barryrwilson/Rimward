/**
 * Lamplighter Guild — "Gate-Service Depot", the infrastructure crew who keep
 * jump gates lit.
 *
 * Reference art: docs/FactionExamples/10-lamplighter-guild-station.png.
 *
 * A WORKING YARD: spare gate-ring segments in plated jigs, parts yard packed
 * with crate rows, gantry cranes straddling the deck, workshop drums with
 * cobalt diagnostic bays, and a soot depot hub striped in utility-yellow.
 * Every module overlaps its neighbour; every adjacency gets an airlock; every
 * gap a bridge. The station reads as an active maintenance facility, not a
 * habitat.
 *
 * Tiers (4 levels):
 *   0. Parts yard deck — broad soot deck, crate rows, spare plates, reels,
 *      drums, and railing with lamp strings on all four sides.
 *   1. Depot hub drum — main horizontal drum (r=5.5, l=26) plated and belted
 *      with yellow hazard stripes; machine-shop tier on crown; beacon-mast base.
 *   2. Workshop/diagnostic bays — four capped workshop drums clamped to hub
 *      flanks; arc-welding bay; spare gate-ring segments in jigs with
 *      scaffolding, catwalks and inspection lamps; two gantry cranes.
 *   3. Service towers, beacon mast, and antenna array — four plated service
 *      towers; beacon mast completion; antenna thicket on crowns.
 *
 * Ring concept (radius 11, ringY = -18): service ring stack being rebuilt —
 * a soot hoop of 8 plated segments with alternating yellow replacement panels,
 * cobalt diagnostic glaze panes at every fourth joint, near-white guide lamps
 * at every joint, spoked to a plated hub. Tucked under the station belly and
 * connected via a plated structural stem so it reads as part of the mass.
 *
 * Palette base (5 deduplicated colours × 4 SHADES = 20 allowed hull values):
 *   SOOT   0x24211c  hull
 *   DARK   0x171410  hullDark
 *   YELLOW 0xd8a83a  trim = patch[0]
 *   WARM   0xffc06a  accent = glow
 * Measured (self-check, 2026-08-10, round-3 cage fix):
 *   parts=2635 | tot=245232 | glow=38004
 *   bbox x -22.4 20.4 | y -19.7 18.3 | z -17.5 18.7
 *   strays [] | iso 2/406 0.49%
 *   orphanGlow 0.09% | orphanGlaze 0.00%
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone, ribBands,
  windowGrid, portholeRing, panelSkin, panelPatches, truss, railing,
  bridge, airlock, pipeRun, antenna, ladder, lampString, crate,
} from '../station-detail.js';

export const lamplighterStation = {
  ringY: -18,
  build(b, ringB, st) {
    const rand = rng(4507);
    const W = weather;

    // Base palette — soot-black infrastructure, utility-yellow hazard stripes,
    // cobalt diagnostics. Read colours from st only.
    const SOOT   = st.hull;         // 0x24211c soot-black structure
    const DARK   = st.hullDark;     // 0x171410 recessed soot
    const YELLOW = st.trim;         // 0xd8a83a utility yellow (= patch[0])
    const WARM   = st.accent;       // 0xffc06a warm lamp  (= glow)
    const COBALT = st.patch[1];     // 0x5a8ae0 diagnostic blue

    // Plate arrays — every entry derived from a BASE colour.
    const P_SOOT   = [SOOT, SOOT, W(SOOT, 1), W(SOOT, 1), W(SOOT, 2)];
    const P_YELLOW = [YELLOW, W(YELLOW, 1), W(YELLOW, 2), W(SOOT, 3)];
    const P_COBALT = [COBALT, W(COBALT, 1), W(COBALT, 2), W(SOOT, 2)];
    const P_MIX    = [SOOT, W(SOOT, 1), YELLOW, W(YELLOW, 1), W(COBALT, 1)];

    // Near-neutral glow tints.
    const LIT      = 0xffffff;
    const LIT_WARM = 0xfff2e2;
    const LIT_DIM  = 0xe8dcc8;

    // Dulled glaze colours.
    const DIAG     = 0x3a5a80;
    const ARC_WELD = 0x2a3a50;

    // ---------------------------------------------------------------- modules --

    // A pressurised depot drum with dense all-round window coverage.
    // Windows use facet-sink arithmetic: placement depth = r*cos(π/seg)*0.98
    // so corners stay within the hull polygon for rows=2, rowGap=0.68.
    const depotDrum = (o) => {
      const { x, y, z, r, l, axis = 'x', skin, cap, roof, plates,
        rows = 4, cols = 12, winCols = 10, seed } = o;
      const alongX = axis === 'x';
      const SEG = 20;
      // Facet-sink depth: flat face of a 20-seg cylinder is at r*cos(π/20).
      // Two rows rowGap=0.68 → H=0.56 < r*sin(π/20)=r*0.156, so corners stay on-face.
      const zFace = r * Math.cos(Math.PI / SEG) * 0.98;
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r, r, l, SEG, alongX ? { rz: Math.PI / 2 } : { rx: Math.PI / 2 });
      panelSkin(b, 'hull', plates, { r, from: -l / 2 + 0.8, to: l / 2 - 0.8, rows, cols, seed, t: 0.22, axis });
      ribBands(b, 'hull', DARK, { r: r + 0.14, tube: 0.22, from: -l / 2 + 2.2, to: l / 2 - 2.2, count: 5, axis, tseg: SEG });
      for (const s of [-1, 1]) {
        cyl(b, 'hull', cap, r * 1.06, r * 0.88, 1.4, SEG,
          alongX ? { x: s * l / 2, rz: Math.PI / 2 } : { z: s * l / 2, rx: Math.PI / 2 });
        const ringO = alongX
          ? { x: s * (l / 2 + 0.75), ry: Math.PI / 2 }
          : { z: s * (l / 2 + 0.75), rx: Math.PI / 2 };
        torus(b, 'hull', W(SOOT, 1), r * 0.8,  0.1, 6, SEG, undefined, ringO);
        torus(b, 'hull', YELLOW,     r * 0.36, 0.1, 6, 16, undefined, ringO);
        cyl(b, 'hull', W(SOOT, 2), r * 0.22, r * 0.22, 0.6, 12,
          alongX ? { x: s * (l / 2 + 0.85), rz: Math.PI / 2 }
                 : { z: s * (l / 2 + 0.85), rx: Math.PI / 2 });
      }
      // Facet-sunk window coverage: 4 faces (±z and ±y on x-drum, or ±x and ±y on z-drum).
      // rows=2 keeps H < r*sin(π/20) so no corner exceeds hull radius.
      const gap = (l - 3.2) / winCols;
      if (alongX) {
        // z-facing faces (top and bottom)
        windowGrid(b, 'glow', LIT,      { rows: 2, cols: winCols, rowGap: 0.68, colGap: gap, w: 0.62, h: 0.44, d: 0.40, x: 0, y: 0, z:  zFace, axis: 'x' });
        windowGrid(b, 'glow', LIT_WARM, { rows: 2, cols: winCols, rowGap: 0.68, colGap: gap, w: 0.62, h: 0.44, d: 0.40, x: 0, y: 0, z: -zFace, axis: 'x' });
        // y-facing faces: axis='y' → cols step x (along drum), rows step z
        windowGrid(b, 'glow', LIT_DIM,  { rows: 2, cols: winCols, rowGap: 0.68, colGap: gap, w: 0.62, h: 0.44, d: 0.40, x: 0, y:  zFace, z: 0, axis: 'y' });
        windowGrid(b, 'glow', LIT_DIM,  { rows: 2, cols: winCols, rowGap: 0.68, colGap: gap, w: 0.62, h: 0.44, d: 0.40, x: 0, y: -zFace, z: 0, axis: 'y' });
        box(b, 'hull', roof, l * 0.88, 0.6, 2.2, { y: r + 0.28 });
        railing(b, 'hull', DARK, { ax: -l / 2 + 1.4, ay: r + 0.6, az: 0, bx: l / 2 - 1.4, by: r + 0.6, bz: 0, height: 0.85, posts: 8, rail: 0.09 });
        ladder(b, 'hull', DARK, { x: l / 2 - 2.0, y: -r, z: r * 0.58, h: r * 1.85, w: 0.55, rungs: 6 });
      } else {
        windowGrid(b, 'glow', LIT,      { rows: 2, cols: winCols, rowGap: 0.68, colGap: gap, w: 0.40, h: 0.44, d: 0.62, x:  zFace, y: 0, z: 0, axis: 'y' });
        windowGrid(b, 'glow', LIT_WARM, { rows: 2, cols: winCols, rowGap: 0.68, colGap: gap, w: 0.40, h: 0.44, d: 0.62, x: -zFace, y: 0, z: 0, axis: 'y' });
        windowGrid(b, 'glow', LIT_DIM,  { rows: 2, cols: winCols, rowGap: 0.68, colGap: gap, w: 0.40, h: 0.44, d: 0.62, x: 0, y:  zFace, z: 0, axis: 'y' });
        windowGrid(b, 'glow', LIT_DIM,  { rows: 2, cols: winCols, rowGap: 0.68, colGap: gap, w: 0.40, h: 0.44, d: 0.62, x: 0, y: -zFace, z: 0, axis: 'y' });
        box(b, 'hull', roof, 2.2, 0.6, l * 0.88, { y: r + 0.28 });
        railing(b, 'hull', DARK, { ax: 0, ay: r + 0.6, az: -l / 2 + 1.4, bx: 0, by: r + 0.6, bz: l / 2 - 1.4, height: 0.85, posts: 8, rail: 0.09 });
        ladder(b, 'hull', DARK, { x: r * 0.58, y: -r, z: l / 2 - 2.0, h: r * 1.85, w: 0.55, rungs: 6, ry: Math.PI / 2 });
      }
      b.pop();
    };

    // Workshop bay: vertical drum with portholeRing windows (correctly seated on
    // the curved hull) and cobalt diagnostic glaze.
    const workshopBay = (o) => {
      const { x, y, z, r, skin, plates, seed, hasCobalt = true } = o;
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r * 0.96, r, 3.4, 22);
      panelSkin(b, 'hull', plates, { r, from: -1.6, to: 1.6, rows: 2, cols: 14, seed, t: 0.2, axis: 'y' });
      ribBands(b, 'hull', DARK, { r: r + 0.14, tube: 0.22, from: -1.4, to: 1.4, count: 2, axis: 'y', tseg: 22 });
      hemi(b, 'hull', W(SOOT, 1), r * 0.94, 22, 12, { y: 1.7 });
      for (let i = 0; i < 8; i++) {
        torus(b, 'hull', DARK, r * 0.95, 0.14, 6, 20, Math.PI, { y: 1.7, ry: (i * Math.PI) / 8 });
      }
      // portholeRing: pucks placed on explicit radial basis — never floats.
      // Three rings spread over drum height give dense all-round glow.
      portholeRing(b, 'glow', LIT,      { r: r * 0.99, count: 14, size: 0.34, y:  0.8 });
      portholeRing(b, 'glow', LIT_WARM, { r: r * 0.99, count: 14, size: 0.30, y:  0.0 });
      portholeRing(b, 'glow', LIT_DIM,  { r: r * 0.99, count: 12, size: 0.28, y: -0.7 });
      // Dome porthole ring
      portholeRing(b, 'glow', LIT_DIM, { r: r + 0.1, count: 12, size: 0.32, y: 0.6 });
      // Cobalt diagnostic screens behind mullions
      if (hasCobalt) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          b.push(0, 0, 0, 0, a, 0);
          box(b, 'glaze', DIAG, 1.1, 0.75, 0.16, { x: r * 0.98, y: 0.5, z: 0 });
          box(b, 'hull', DARK, 1.1, 0.08, 0.1, { x: r * 0.985, y: 0.3,  z: 0 });
          box(b, 'hull', DARK, 1.1, 0.08, 0.1, { x: r * 0.985, y: 0.72, z: 0 });
          b.pop();
        }
      }
      b.pop();
    };

    // Spare gate-ring segment in a cradle jig with scaffolding and inspection lamps.
    const ringSegmentJig = (o) => {
      const { x, y, z, r, arc, seed, ry: jigRy = 0 } = o;
      b.push(x, y, z, 0, jigRy, 0);
      // Cradle base
      box(b, 'hull', W(SOOT, 1), r * 2.4, 0.8, 2.8, { y: -1.2 });
      box(b, 'hull', DARK, r * 2.2, 0.4, 0.4, { y: -0.7, z:  1.2 });
      box(b, 'hull', DARK, r * 2.2, 0.4, 0.4, { y: -0.7, z: -1.2 });
      // Spare ring segment (torus arc)
      torus(b, 'hull', SOOT, r, 1.2, 12, 32, arc, { y: 0.6, rx: Math.PI / 2 });
      panelSkin(b, 'hull', P_MIX, { r: r + 0.1, from: -arc / 2 + 0.2, to: arc / 2 - 0.2, rows: 3, cols: 8, seed, t: 0.18, axis: 'y' });
      ribBands(b, 'hull', DARK, { r: r + 0.14, tube: 0.2, from: -arc / 2 + 0.5, to: arc / 2 - 0.5, count: 3, axis: 'y', tseg: 24 });
      // Scaffolding posts at each quadrant
      for (let i = 0; i < 4; i++) {
        const a = -arc / 2 + (i + 0.5) * (arc / 4);
        const sx = Math.cos(a) * r;
        const sz = Math.sin(a) * r;
        box(b, 'hull', W(SOOT, 2), 0.5, 3.5, 0.5, { x: sx, y: 1.8, z: sz });
        box(b, 'hull', YELLOW, 0.6, 0.35, 0.35, { x: sx, y: 3.6, z: sz });
        lampString(b, 'glow', LIT, { ax: sx - 0.8, ay: 3.8, az: sz, bx: sx + 0.8, by: 3.8, bz: sz, count: 3, size: 0.22 });
      }
      // Catwalk along segment crown
      bridge(b, 'hull', W(SOOT, 1), DARK, { ax: -r + 1, ay: 2.8, az: 0, bx: r - 1, by: 2.8, bz: 0, w: 1.4, railH: 0.75, posts: 5 });
      // Inspection lamp strings
      lampString(b, 'glow', LIT, { ax: -r * 0.7, ay: 4.2, az:  0.8, bx: r * 0.7, by: 4.2, bz:  0.8, count: 7, size: 0.26 });
      lampString(b, 'glow', LIT, { ax: -r * 0.7, ay: 4.2, az: -0.8, bx: r * 0.7, by: 4.2, bz: -0.8, count: 7, size: 0.26 });
      b.pop();
    };

    // Gantry crane: plated column, yellow jib, cable, hook, dense work lamps.
    const gantryCrane = (o) => {
      const { x, y, z, h, jibLen, dir = 1 } = o;
      b.push(x, y, z, 0, 0, 0);
      // Column base bedded into deck
      cyl(b, 'hull', W(SOOT, 1), 0.85, 1.1, 1.6, 14);
      box(b, 'hull', DARK, 2.4, 0.8, 2.4, { y: -0.7 });
      ribBands(b, 'hull', YELLOW, { r: 1.15, tube: 0.18, from: 1.0, to: h - 2, count: 4, axis: 'y', tseg: 14 });
      // Main column
      cyl(b, 'hull', SOOT, 0.75, 0.85, h, 14);
      panelSkin(b, 'hull', P_SOOT, { r: 0.88, from: 1.5, to: h - 3, rows: 4, cols: 6, seed: 4507 + Math.abs(Math.floor(x)), t: 0.16, axis: 'y' });
      // Jib platform
      box(b, 'hull', W(SOOT, 2), 1.6, 0.6, 1.6, { y: h - 1.5 });
      torus(b, 'hull', YELLOW, 1.2, 0.12, 6, 16, undefined, { y: h - 1.1, rx: Math.PI / 2 });
      // Jib beam
      box(b, 'hull', YELLOW, jibLen, 0.55, 0.9, { x: dir * (jibLen / 2 - 0.8), y: h - 0.9, z: 0 });
      // Cable
      pipeRun(b, 'hull', DARK, { ax: 0, ay: h - 0.6, az: 0, bx: dir * (jibLen - 2), by: h - 4.5, bz: 0, r: 0.08, seg: 8, collars: 0 });
      // Hook housing
      box(b, 'hull', W(SOOT, 2), 0.9, 1.2, 0.9, { x: dir * (jibLen - 2), y: h - 5.2, z: 0 });
      cone(b, 'hull', YELLOW, 0.4, 0.8, 8, { x: dir * (jibLen - 2), y: h - 6.0, z: 0 });
      // Dense work lamp strings
      lampString(b, 'glow', LIT, { ax: dir * 1.5, ay: h - 0.4, az:  0.6, bx: dir * (jibLen - 2.5), by: h - 0.4, bz:  0.6, count: 8, size: 0.24 });
      lampString(b, 'glow', LIT, { ax: dir * 1.5, ay: h - 0.4, az: -0.6, bx: dir * (jibLen - 2.5), by: h - 0.4, bz: -0.6, count: 8, size: 0.24 });
      lampString(b, 'glow', LIT_WARM, { ax: dir * 1.0, ay: h - 3.0, az: 0, bx: dir * (jibLen - 2), by: h - 5.5, bz: 0, count: 6, size: 0.22 });
      // Column indicator lights
      for (let i = 0; i < 6; i++) {
        box(b, 'glow', LIT_DIM, 0.28, 0.24, 0.24, { x: 0.92, y: 1.5 + i * 2.0, z: 0 });
      }
      // Ladder
      ladder(b, 'hull', DARK, { x: 0.95, y: 0, z: 0, h: h - 2, w: 0.5, rungs: 8, ry: Math.PI / 2 });
      b.pop();
    };

    // ============================================================ tier 0: yard ==

    // Broad parts-yard deck at y = -8.
    b.push(0, -8, 0, 0, 0, 0);
    box(b, 'hull', SOOT, 36, 0.9, 28);
    box(b, 'hull', W(SOOT, 1), 34, 0.5, 26, { y: 0.6 });
    // Deck surface plating — panel strips lying flat on the top face.
    // axis:'x' cylinders at r=17+ create full 36-unit cages; use boxes instead.
    for (let i = 0; i < 8; i++) {
      box(b, 'hull', P_SOOT[i % P_SOOT.length], 3.8, 0.12, 26, { x: -15.75 + i * 4.5, y: 0.52 });
    }
    // Structural grid: Z-running cross-beams and X-running longerons
    for (let i = 0; i < 6; i++) {
      box(b, 'hull', DARK, 34, 0.18, 0.42, { y: 0.50, z: -13 + i * 5.2 });
    }
    for (let i = 0; i < 5; i++) {
      box(b, 'hull', DARK, 0.42, 0.18, 26, { y: 0.50, x: -12 + i * 6 });
    }
    // Safety-yellow kerb bars at deck perimeter
    box(b, 'hull', YELLOW, 36, 0.38, 0.32, { y: 0.72, z:  13.9 });
    box(b, 'hull', YELLOW, 36, 0.38, 0.32, { y: 0.72, z: -13.9 });
    box(b, 'hull', YELLOW, 0.32, 0.38, 26, { y: 0.72, x:  17.9 });
    box(b, 'hull', YELLOW, 0.32, 0.38, 26, { y: 0.72, x: -17.9 });
    // Extra floor-level machinery: transformer bays and junction boxes at deck corners
    for (let i = 0; i < 4; i++) {
      const cx = (i < 2 ? -1 : 1) * 15;
      const cz = (i % 2 === 0 ? -1 : 1) * 10;
      box(b, 'hull', W(SOOT, 1), 2.8, 2.0, 1.8, { x: cx, y: 1.45, z: cz });
      box(b, 'hull', YELLOW,     2.8, 0.22, 1.8, { x: cx, y: 2.56, z: cz });
      box(b, 'glow', LIT_DIM, 0.42, 0.30, 0.22, { x: cx, y: 1.5,  z: cz + (cz > 0 ? -0.91 : 0.91) });
      box(b, 'glow', LIT_DIM, 0.42, 0.30, 0.22, { x: cx, y: 1.96, z: cz + (cz > 0 ? -0.91 : 0.91) });
    }

    // Crate rows — more bays than before for a packed yard read.
    const CRATE_BAYS = [
      { x: -13, z: -9, rows: 4, cols: 4 }, { x:  -6, z: -9, rows: 4, cols: 4 },
      { x:   3, z: -9, rows: 4, cols: 4 }, { x:  10, z: -9, rows: 4, cols: 4 },
      { x: -13, z:  3, rows: 3, cols: 4 }, { x:  -4, z:  3, rows: 3, cols: 4 },
      { x:   5, z:  3, rows: 3, cols: 4 }, { x:  12, z:  3, rows: 3, cols: 3 },
      { x: -13, z:  9, rows: 2, cols: 5 }, { x:   4, z:  9, rows: 2, cols: 5 },
    ];
    let crateIdx = 0;
    for (const bay of CRATE_BAYS) {
      for (let rr = 0; rr < bay.rows; rr++) {
        for (let c = 0; c < bay.cols; c++) {
          const col = [SOOT, YELLOW, W(SOOT, 1), W(YELLOW, 1)][(crateIdx + rr + c) % 4];
          crate(b, 'hull', col, { x: bay.x + c * 2.1, y: 1.0, z: bay.z + rr * 2.1, s: 1.4 + rand() * 0.4, ry: rand() * 0.4 - 0.2, bands: 2, bandHex: DARK });
        }
      }
      crateIdx += bay.rows * bay.cols;
    }

    // Stacked spare chevron plates — thicker piles on both sides.
    for (let i = 0; i < 12; i++) {
      box(b, 'hull', YELLOW, 2.4, 0.22, 1.5, { x: -15 + i * 0.32, y: 0.6 + (i % 4) * 0.22, z: -12, ry: rand() * 0.3 - 0.15 });
    }
    for (let i = 0; i < 10; i++) {
      box(b, 'hull', W(SOOT, 1), 2.0, 0.22, 1.2, { x:  9 + i * 0.28, y: 0.6 + (i % 3) * 0.22, z: 11, ry: rand() * 0.3 - 0.15 });
    }
    // Extra chevron stack beside port crane
    for (let i = 0; i < 8; i++) {
      box(b, 'hull', W(YELLOW, 1), 2.0, 0.22, 1.2, { x: -14 + i * 0.28, y: 0.6 + (i % 3) * 0.22, z:  6, ry: rand() * 0.3 - 0.15 });
    }

    // Storage reels and cable drums — two rows for yard depth.
    for (let i = 0; i < 6; i++) {
      cyl(b, 'hull', YELLOW, 0.8, 0.8, 1.6, 12, { x: -9 + i * 2.2, y: 1.2, z: 12, rz: Math.PI / 2 });
      torus(b, 'hull', DARK, 0.86, 0.1, 6, 12, undefined, { x: -9 + i * 2.2, y: 0.6, z: 12 });
      torus(b, 'hull', DARK, 0.86, 0.1, 6, 12, undefined, { x: -9 + i * 2.2, y: 1.8, z: 12 });
    }
    for (let i = 0; i < 4; i++) {
      cyl(b, 'hull', W(SOOT, 1), 1.0, 1.0, 2.0, 12, { x: -6 + i * 2.6, y: 1.4, z: -11, rz: Math.PI / 2 });
      torus(b, 'hull', YELLOW, 1.06, 0.1, 6, 12, undefined, { x: -6 + i * 2.6, y: 0.6, z: -11 });
      torus(b, 'hull', YELLOW, 1.06, 0.1, 6, 12, undefined, { x: -6 + i * 2.6, y: 2.2, z: -11 });
    }

    // Perimeter lamp strings — all four sides plus interior yard runs.
    lampString(b, 'glow', LIT,      { ax: -16, ay: 2.4, az: -12, bx:  16, by: 2.4, bz: -12, count: 14, size: 0.28 });
    lampString(b, 'glow', LIT,      { ax: -16, ay: 2.4, az:  11, bx:  16, by: 2.4, bz:  11, count: 14, size: 0.28 });
    lampString(b, 'glow', LIT,      { ax: -16, ay: 2.4, az: -12, bx: -16, by: 2.4, bz:  11, count:  8, size: 0.28 });
    lampString(b, 'glow', LIT,      { ax:  16, ay: 2.4, az: -12, bx:  16, by: 2.4, bz:  11, count:  8, size: 0.28 });
    lampString(b, 'glow', LIT_WARM, { ax: -14, ay: 2.4, az:  -3, bx:  14, by: 2.4, bz:  -3, count: 10, size: 0.26 });
    lampString(b, 'glow', LIT_WARM, { ax: -14, ay: 2.4, az:   3, bx:  14, by: 2.4, bz:   3, count: 10, size: 0.26 });
    lampString(b, 'glow', LIT_DIM,  { ax:   0, ay: 2.4, az: -12, bx:   0, by: 2.4, bz:  11, count:  8, size: 0.24 });
    lampString(b, 'glow', LIT_DIM,  { ax:  -8, ay: 2.4, az: -12, bx:  -8, by: 2.4, bz:  11, count:  8, size: 0.24 });
    lampString(b, 'glow', LIT_DIM,  { ax:   8, ay: 2.4, az: -12, bx:   8, by: 2.4, bz:  11, count:  8, size: 0.24 });
    b.pop();

    // ============================================================ tier 1: hub ==

    // Central depot hub drum (r=5.5, l=26) with yellow hazard stripes.
    depotDrum({
      x: 0, y: -2.5, z: 0, r: 5.5, l: 26, axis: 'x',
      skin: SOOT, cap: W(SOOT, 1), roof: YELLOW, plates: P_MIX,
      rows: 5, cols: 14, winCols: 12, seed: 4520,
    });
    // Hazard stripe boxes
    for (let i = 0; i < 6; i++) {
      const xPos = -11 + i * 4.4;
      box(b, 'hull', YELLOW, 0.7, 10.8, 0.5, { x: xPos, y: 0, z:  5.5 });
      box(b, 'hull', YELLOW, 0.7, 10.8, 0.5, { x: xPos, y: 0, z: -5.5 });
    }
    // Machine-shop tier on hub crown
    box(b, 'hull', W(SOOT, 1), 8, 1.8, 5, { y: 4.2, z: 1.5 });
    panelSkin(b, 'hull', P_YELLOW, { r: 2.6, from: -3.8, to: 3.8, rows: 2, cols: 8, seed: 4521, t: 0.18, axis: 'x' });
    windowGrid(b, 'glow', LIT_WARM, { rows: 2, cols: 6, rowGap: 0.65, colGap: 1.1, w: 0.55, h: 0.42, d: 0.45, x: 0, y: 4.4, z:  4.0, axis: 'x' });
    windowGrid(b, 'glow', LIT_DIM,  { rows: 2, cols: 6, rowGap: 0.65, colGap: 1.1, w: 0.55, h: 0.42, d: 0.45, x: 0, y: 4.4, z: -1.0, axis: 'x' });
    // Beacon mast base
    b.push(0, 5.8, 0, 0, 0, 0);
    cyl(b, 'hull', W(SOOT, 2), 0.85, 1.1, 4.5, 12);
    ribBands(b, 'hull', YELLOW, { r: 1.2, tube: 0.14, from: -2, to: 2, count: 3, axis: 'y', tseg: 12 });
    lampString(b, 'glow', LIT, { ax: 0.95, ay: -1.8, az: 0, bx: 0.95, by: 1.8, bz: 0, count: 6, size: 0.26 });
    lampString(b, 'glow', LIT, { ax:-0.95, ay: -1.8, az: 0, bx:-0.95, by: 1.8, bz: 0, count: 6, size: 0.26 });
    b.pop();

    // ======================================= tier 2a: workshop and diagnostic bays ==

    workshopBay({ x: -14, y: 3.5, z:  3, r: 4.2, skin: W(SOOT, 1), plates: P_COBALT, seed: 4540, hasCobalt: true });
    workshopBay({ x:  14, y: 3.5, z: -2, r: 3.8, skin:      SOOT,   plates: P_YELLOW, seed: 4541, hasCobalt: true });
    workshopBay({ x:  -6, y: 4.2, z: -8, r: 3.2, skin: W(SOOT, 2), plates: P_MIX,    seed: 4542, hasCobalt: true });
    workshopBay({ x:   9, y: 4.0, z:  7, r: 3.5, skin:      SOOT,   plates: P_COBALT, seed: 4543, hasCobalt: true });

    // Arc-welding bay
    b.push(4, 4.8, -5, 0, 0, 0);
    box(b, 'hull', W(SOOT, 1), 5, 3.5, 3.8);
    panelPatches(b, 'hull', P_MIX, { r: 2.1, from: -1.5, to: 1.5, count: 8, seed: 4544, w: 1.4, h: 1.0, t: 0.18, axis: 'z' });
    for (let i = 0; i < 5; i++) {
      box(b, 'glaze', ARC_WELD, 1.1, 0.75, 0.16, { x: -2.0 + i * 1.05, y: 0.4, z:  1.95 });
      box(b, 'hull',  DARK,     0.1, 0.75, 0.08, { x: -2.0 + i * 1.05, y: 0.4, z:  1.97 });
    }
    windowGrid(b, 'glow', LIT_DIM, { rows: 2, cols: 4, rowGap: 0.75, colGap: 1.0, w: 0.48, h: 0.38, d: 0.42, x: 0, y: 0.8, z: -1.95, axis: 'x' });
    windowGrid(b, 'glow', LIT_WARM, { rows: 2, cols: 3, rowGap: 0.65, colGap: 1.0, w: 0.42, h: 0.38, d: 0.42, x: 2.5, y: 0.4, z: 0, axis: 'y' });
    b.pop();

    // ======================================= tier 2b: spare gate-ring segments ==

    // Three ring-segment jigs, the last one angled to add visual variety.
    ringSegmentJig({ x: -14, y: -6.5, z: -10, r: 7,   arc: Math.PI / 2,   seed: 4530 });
    ringSegmentJig({ x:  12, y: -6.5, z:  -9, r: 6,   arc: Math.PI / 1.8, seed: 4531 });
    ringSegmentJig({ x:  -8, y: -6.5, z:  11, r: 6.5, arc: Math.PI / 1.6, seed: 4532 });
    // Extra arc-segment jig clamped at angle — the "being installed" piece.
    ringSegmentJig({ x: 6, y: -6.5, z: 10, r: 5.5, arc: Math.PI / 1.4, seed: 4533, ry: 0.35 });

    // ======================================= tier 2c: gantry cranes ==

    gantryCrane({ x: -18, y: -8, z: -5, h: 16, jibLen: 14, dir:  1 });
    gantryCrane({ x:  18, y: -8, z:  6, h: 15, jibLen: 13, dir: -1 });

    // ============================================================ connections ==

    // Workshop airlocks
    airlock(b, 'hull', W(SOOT, 1), DARK, { ax: -14, ay: 1.2, az:  3, bx:  -9, by: -0.5, bz:  1.5, r: 1.5, seg: 12, rings: 2 });
    airlock(b, 'hull', W(SOOT, 1), DARK, { ax:  14, ay: 1.2, az: -2, bx:   9, by: -0.5, bz:  -1,  r: 1.4, seg: 12, rings: 2 });
    airlock(b, 'hull', W(SOOT, 2), DARK, { ax:  -6, ay: 2.0, az: -8, bx:  -3, by: -0.3, bz:  -5,  r: 1.3, seg: 12, rings: 2 });
    airlock(b, 'hull', W(SOOT, 2), DARK, { ax:   9, ay: 1.8, az:  7, bx:   5, by: -0.4, bz:   4,  r: 1.4, seg: 12, rings: 2 });
    airlock(b, 'hull', W(SOOT, 2), DARK, { ax:   4, ay: 1.2, az: -5, bx:   2, by: -0.4, bz:  -3,  r: 1.2, seg: 10, rings: 2 });
    // Yard-to-hub airlocks
    airlock(b, 'hull', W(SOOT, 2), DARK, { ax:  -8, ay: -6.5, az:  -8, bx:  -6, by: -3.5, bz:  -5, r: 1.6, seg: 12, rings: 2 });
    airlock(b, 'hull', W(SOOT, 2), DARK, { ax:   8, ay: -6.5, az:   8, bx:   6, by: -3.5, bz:   5, r: 1.6, seg: 12, rings: 2 });
    // Yard-side bridges
    bridge(b, 'hull', W(SOOT, 1), DARK, { ax: -16, ay: -5.2, az: 0, bx: -14, by: 0.8, bz: 0, w: 1.8, railH: 0.8, posts: 5 });
    bridge(b, 'hull', W(SOOT, 1), DARK, { ax:  16, ay: -5.2, az: 0, bx:  14, by: 0.8, bz: 0, w: 1.8, railH: 0.8, posts: 5 });
    bridge(b, 'hull', W(SOOT, 1), DARK, { ax: -10, ay: -4.5, az: -12, bx: -8, by: 1.2, bz: -8, w: 1.7, railH: 0.75, posts: 6 });
    bridge(b, 'hull', W(SOOT, 1), DARK, { ax:  10, ay: -4.5, az:  12, bx:  8, by: 1.2, bz:  8, w: 1.7, railH: 0.75, posts: 6 });

    // ============================================================ tier 3 ==

    // Beacon mast completion
    b.push(0, 10.3, 0, 0, 0, 0);
    cyl(b, 'hull', DARK, 0.28, 0.38, 8.5, 8);
    ribBands(b, 'hull', YELLOW, { r: 0.45, tube: 0.1, from: -3.5, to: 3.5, count: 4, axis: 'y', tseg: 8 });
    cyl(b, 'glow', LIT, 0.65, 0.65, 1.4, 12, { y: 4.6 });
    cone(b, 'hull', YELLOW, 0.18, 2.2, 6, { y: 5.5 });
    lampString(b, 'glow', LIT_DIM, { ax: 0.45, ay: -3, az: 0, bx: 0.45, by: 3.5, bz: 0, count: 8, size: 0.22 });
    b.pop();

    // Service towers at four positions
    const TOWER_SITES = [
      { x: -11, z:  8, h: 12 }, { x: 11, z: -7, h: 11 },
      { x:  -7, z: -10, h: 10 }, { x:  8, z:  9, h: 11 },
    ];
    for (const site of TOWER_SITES) {
      b.push(site.x, 3.5, site.z, 0, 0, 0);
      cyl(b, 'hull', W(SOOT, 1), 0.7, 0.9, site.h, 12);
      panelSkin(b, 'hull', P_SOOT, { r: 0.95, from: 0, to: site.h - 2, rows: 4, cols: 5, seed: 4550 + Math.abs(Math.floor(site.x)), t: 0.15, axis: 'y' });
      ribBands(b, 'hull', DARK, { r: 1.05, tube: 0.16, from: 1, to: site.h - 3, count: 3, axis: 'y', tseg: 12 });
      // Indicator windows on vertical face: panelSkin provides hull at z=0.95,
      // so window placed at z=0.95 is against hull material.
      windowGrid(b, 'glow', LIT_DIM, { rows: 4, cols: 1, rowGap: 2.0, colGap: 1.0, w: 0.38, h: 0.44, d: 0.42, x: 0, y: site.h * 0.3, z: 0.95, axis: 'y' });
      windowGrid(b, 'glow', LIT_DIM, { rows: 4, cols: 1, rowGap: 2.0, colGap: 1.0, w: 0.38, h: 0.44, d: 0.42, x: 0, y: site.h * 0.3, z:-0.95, axis: 'y' });
      box(b, 'glow', LIT, 0.4, 0.4, 0.4, { y: site.h - 0.5 });
      cone(b, 'hull', YELLOW, 0.14, 1.8, 6, { y: site.h + 0.2 });
      ladder(b, 'hull', DARK, { x: 0.8, y: 0, z: 0, h: site.h - 1, w: 0.45, rungs: 7, ry: Math.PI / 2 });
      b.pop();
      airlock(b, 'hull', W(SOOT, 2), DARK, { ax: site.x, ay: 3.2, az: site.z, bx: site.x * 0.6, by: 0.5, bz: site.z * 0.5, r: 1.2, seg: 10, rings: 2 });
    }

    // Antenna array
    const ANTENNAS = [
      { x: -15, y: 8.5, z:  -4, h: 9   },
      { x:  15, y: 8.0, z:   3, h: 8   },
      { x:  -4, y: 9.2, z: -11, h: 7   },
      { x:   6, y: 8.8, z:  10, h: 7.5 },
    ];
    for (const ant of ANTENNAS) {
      antenna(b, 'hull', DARK, W(SOOT, 1), { x: ant.x, y: ant.y, z: ant.z, h: ant.h, r: 0.12, tip: 0.32, dish: 0.8 });
    }

    // ============================================================ pipe runs ==

    const PIPES = [
      [-14, 0.8,  3, -10, -2.0,  2], [ 14, 0.8, -2,  10, -2.0, -1],
      [ -6, 1.5, -8,  -4, -3.0, -6], [  9, 1.2,  7,   7, -3.0,  5],
      [  4, 1.8, -5,   4, -4.0, -3], [-18,-5.5, -5, -16, -7.0, -3],
      [ 18,-5.5,  6,  16, -7.0,  4], [ -8,-6.0, -8,  -6, -5.0, -5],
    ];
    for (const [x0, y0, z0, x1, y1, z1] of PIPES) {
      pipeRun(b, 'hull', W(SOOT, 1), { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, r: 0.15, seg: 8, collars: 3 });
    }

    // ============================================================ greebles ==

    for (let i = 0; i < 60; i++) {
      const gx = -20 + rand() * 40;
      const gz = -14 + rand() * 28;
      const gy = -7  + rand() * 17;
      box(b, 'hull', [DARK, W(SOOT, 2), YELLOW, DARK][i % 4],
        0.5 + rand() * 0.6, 0.4 + rand() * 0.45, 0.4 + rand() * 0.5,
        { x: gx, y: gy, z: gz, ry: rand() * Math.PI });
      if (i % 4 === 0) box(b, 'glow', LIT_DIM, 0.3, 0.22, 0.22, { x: gx + 0.4, y: gy + 0.25, z: gz });
    }

    // ============================================================ ring stem ==
    // Plated structural column connecting depot hub bottom (y=-8) to the service
    // ring (world y = ringY = -18). Four truss arms spread from the stem base
    // toward the ring, reading as a cradle that holds the ring under the hull.

    b.push(0, -13, 0, 0, 0, 0);
    cyl(b, 'hull', W(SOOT, 1), 1.3, 1.7, 10, 14);
    panelSkin(b, 'hull', P_SOOT, { r: 1.75, from: -4.5, to: 4.5, rows: 6, cols: 8, seed: 4545, t: 0.16, axis: 'y' });
    ribBands(b, 'hull', YELLOW, { r: 1.8, tube: 0.14, from: -4, to: 4, count: 5, axis: 'y', tseg: 14 });
    lampString(b, 'glow', LIT, { ax: 1.85, ay: -4.2, az: 0, bx: 1.85, by: 4.2, bz: 0, count: 10, size: 0.20 });
    lampString(b, 'glow', LIT, { ax:-1.85, ay: -4.2, az: 0, bx:-1.85, by: 4.2, bz: 0, count: 10, size: 0.20 });
    b.pop();

    // Four diagonal truss cradle arms from the stem base toward the ring
    // radius. Both endpoints land on hull material (stem cylinder and arm-end box).
    const R_ARM = 7.5; // intermediate reach (not full ring radius, just cradle)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const ex = Math.cos(a) * R_ARM;
      const ez = Math.sin(a) * R_ARM;
      // Arm-end anchor box (provides hull material at arm endpoint)
      box(b, 'hull', W(SOOT, 2), 1.4, 0.7, 1.4, { x: ex, y: -17.8, z: ez });
      box(b, 'hull', YELLOW,     1.2, 0.22, 1.2, { x: ex, y: -17.4, z: ez });
      // Truss arm: stem radius 1.7 → arm end box
      truss(b, 'hull', W(SOOT, 2), {
        ax: Math.cos(a) * 1.7, ay: -17.5, az: Math.sin(a) * 1.7,
        bx: ex, by: -17.8, bz: ez,
        thickness: 0.22, bays: 3, spread: 0.5,
      });
      // Lamp string along each arm
      lampString(b, 'glow', LIT_DIM, {
        ax: Math.cos(a) * 1.8, ay: -17.2, az: Math.sin(a) * 1.8,
        bx: ex, by: -17.5, bz: ez,
        count: 4, size: 0.20,
      });
    }

    // ======================================================= service ring (ringB) ==
    // Radius-11 soot hoop: 8 plated segments with alternating yellow replacement
    // panels, cobalt diagnostic glaze panes at every fourth joint, near-white
    // guide lamps at every joint, spoked to a plated hub. Tucked at ringY=-18
    // so the depot yard and cranes above are fully visible from outside.

    const R = 11;

    // Main ring body — thinner tube (0.9) than the old R=18 version.
    torus(ringB, 'ringHull', W(SOOT, 1), R, 0.9, 10, 36, undefined, { rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DARK, R, 0.28, 8, 36, undefined, { y:  0.5, rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DARK, R, 0.28, 8, 36, undefined, { y: -0.5, rx: Math.PI / 2 });
    // Plated hub
    cyl(ringB, 'ringHull', SOOT, 1.8, 2.2, 1.4, 14);
    panelSkin(ringB, 'ringHull', P_SOOT, { r: 2.2, from: -0.6, to: 0.6, rows: 2, cols: 10, seed: 4560, t: 0.16, axis: 'y' });
    ribBands(ringB, 'ringHull', DARK, { r: 2.3, tube: 0.16, from: -0.5, to: 0.5, count: 2, axis: 'y', tseg: 14 });
    // Six spokes spanning hub→ring
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(ringB, 'ringHull', W(SOOT, 2), R - 2.4, 0.4, 0.32, { x: Math.cos(a) * (R / 2), z: Math.sin(a) * (R / 2), ry: -a });
    }
    // Hub ring indicator lamps
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      box(ringB, 'ringGlow', LIT, 0.26, 0.26, 0.20, { x: Math.cos(a) * 2.25, z: Math.sin(a) * 2.25 });
    }

    // 8 ring segments — fewer, wider angular gaps so the depot shows through.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ringB.push(Math.cos(a) * R, 0, Math.sin(a) * R, -a, 0, 0);

      // Segment plate — alternating yellow "replacement" panels
      const segCol    = i % 2 === 0 ? SOOT   : YELLOW;
      const segPlates = i % 2 === 0 ? P_SOOT : P_YELLOW;
      // Smaller box (2.8 radial × 1.2 tall × 1.4 tangential) vs old 4.2×1.9×1.8
      box(ringB, 'ringHull', segCol, 2.8, 1.2, 1.4, { y: 0.1 });
      panelSkin(ringB, 'ringHull', segPlates, { r: 1.4, from: -1.2, to: 1.2, rows: 2, cols: 5, seed: 4570 + i, t: 0.16, axis: 'z' });
      ribBands(ringB, 'ringHull', DARK, { r: 1.5, tube: 0.14, from: -1.0, to: 1.0, count: 2, axis: 'z', tseg: 12 });

      // Cobalt glaze panes every fourth segment (2 of 8)
      if (i % 4 === 0) {
        box(ringB, 'ringGlaze', DIAG, 0.85, 0.55, 0.12, { y: 0.55, z:  0.18 });
        box(ringB, 'ringGlaze', DIAG, 0.85, 0.55, 0.12, { y: 0.55, z: -0.18 });
        box(ringB, 'ringHull', DARK, 0.85, 0.07, 0.08, { y: 0.32, z:  0.20 });
        box(ringB, 'ringHull', DARK, 0.85, 0.07, 0.08, { y: 0.77, z:  0.20 });
        box(ringB, 'ringHull', DARK, 0.85, 0.07, 0.08, { y: 0.32, z: -0.20 });
        box(ringB, 'ringHull', DARK, 0.85, 0.07, 0.08, { y: 0.77, z: -0.20 });
      }

      // Window grids on both inner and outer faces — well within segment box bounds
      windowGrid(ringB, 'ringGlow', LIT_WARM, { rows: 2, cols: 3, rowGap: 0.55, colGap: 0.80, w: 0.40, h: 0.32, d: 0.36, x: 0, y: 0.1, z:  0.08, axis: 'z' });
      windowGrid(ringB, 'ringGlow', LIT,      { rows: 2, cols: 2, rowGap: 0.55, colGap: 0.80, w: 0.40, h: 0.32, d: 0.36, x: 0, y: 0.1, z: -0.08, axis: 'z' });

      // Guide lamp at each joint
      box(ringB, 'ringGlow', LIT, 0.30, 0.30, 0.24, { y: 0.35, z:  0.28, x: -1.3 });
      box(ringB, 'ringGlow', LIT, 0.30, 0.30, 0.24, { y: 0.35, z: -0.28, x: -1.3 });

      ringB.pop();
    }

    // Perimeter guide lamps — scaled to R=11 (24 lamps instead of 36)
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + Math.PI / 48;
      box(ringB, 'ringGlow', LIT, 0.28, 0.28, 0.22, { x: Math.cos(a) * (R + 0.55), z: Math.sin(a) * (R + 0.55), ry: -a });
    }
    // Inner ring lamps
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.PI / 32;
      box(ringB, 'ringGlow', LIT_DIM, 0.24, 0.24, 0.20, { x: Math.cos(a) * (R - 0.9), z: Math.sin(a) * (R - 0.9), ry: -a });
    }
    // Rim lamp strings along two arcs
    lampString(ringB, 'ringGlow', LIT_WARM, { ax: R, ay: 0.7, az: 0, bx: R * Math.cos(Math.PI / 4), by: 0.7, bz: R * Math.sin(Math.PI / 4), count: 4, size: 0.20 });
    lampString(ringB, 'ringGlow', LIT_WARM, { ax: -R, ay: 0.7, az: 0, bx: -R * Math.cos(Math.PI / 4), by: 0.7, bz: R * Math.sin(Math.PI / 4), count: 4, size: 0.20 });
  },
};
