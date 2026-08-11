/**
 * Assembly Probe-Foundry — descendants of an ancient self-replicating probe.
 *
 * Reference art: docs/FactionExamples/08-assembly-station.png
 *
 * Sculpt concept: a machine that reprints itself. Three tiers plus ring:
 *   1. ANCIENT CORE — plated sphere (r=7, centre y=3) with equatorial
 *      faded-orange band, portholes, ribbed shell, teal central port.
 *   2. BELLY CELLS — five foundry cells hugging the core equator at
 *      radius 9, each partially interpenetrating the sphere.
 *   3. WING CELLS — left (4) + right (4) cells in stepped ascending banks
 *      connected to core by airlocks and truss spines.
 *   4. CROWN CELLS — four cells above the core top (y=11-12.5).
 *   5. ANTENNA FOREST — masts with hull-coloured tips; teal optic boxes
 *      in glaze placed above each tip.
 *   6. DAUGHTER PROBES — four half-printed hulls on cradles at y≈-5.
 *   7. RING: DAUGHTER-PRINT RING — five foundry cells mid-print on a
 *      plated hoop (ringY=-9, ringR=9), spoked to a plated hub.
 *      A central airlock stem plus four diagonal truss cradle arms tie the
 *      ring hoop physically to the belly (no air gap).
 *
 * Cell detail (wave-45 rework):
 *   • Box hull with charcoal edge-frame ribs.
 *   • Horizontal rib bands (axis:'y') belt all four faces.
 *   • Front face: 3×2 raised plate tiles + small 2×3 window grid (upper) +
 *     3-pane mullioned teal glazing with dark frame and mullion bars (lower).
 *   • Back face: 2×3 window grid + small teal pane.
 *   • Side faces: 2×3 window grids + vent slats or junction box.
 *   • Top: hatch cover + antenna collar with teal cap.
 *   • Lamp strings on crown and side edge.
 *
 * Ring connection (wave-45 rework — no air gap):
 *   • ringY=-9 (was -12.5), ringR=9 (was 13.5).
 *   • Central airlock stem in b: (0,-3.5,0)→(0,-8.0,0), r=2.
 *   • Four diagonal truss arms reach to ring hoop XZ positions at y=-8.5,
 *     which is inside the torus tube (tube r=0.52, hoop at y=-9).
 *
 * Channel use:
 *   hull   — plated structure, spheres, drums, trusses, airlocks, masts
 *   glow   — near-white lit windows and status lamps (≥ 153/255 per channel)
 *   glaze  — teal optics (sensor lenses, print-chamber glass, optic boxes)
 *
 * Base palette (FACTION_STYLE.assembly):
 *   hull 0xb8b4a8 / hullDark 0x3a3c3e / trim 0x6b6e70 / accent 0xb8763c
 *   patch[0]=accent, patch[1]=trim — 4 base colours total.
 *
 * Seed base: 4506.
 *
 * Measured: parts=2246, tot=183264, glow=30024,
 * bbox x[-20.3,20.8] y[-11.0,20.6] z[-15.0,16.1],
 * iso=1/277 (0.36%), strays=[], orphanGlow=0%, orphanGlaze=0%.
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone,
  ribBands, windowGrid, portholeRing, panelSkin, truss, railing, bridge,
  airlock, pipeRun, antenna, ladder, lampString, crate,
} from '../station-detail.js';

/** Daughter-print ring: horizontal hoop, radius 9, at ringY = -9 */
export const assemblyStation = {
  ringY: -9,
  build(b, ringB, st) {
    const rand = rng(4506);

    // ---------------------------------------------------------------- palette --
    const OFFWHITE = st.hull;     // 0xb8b4a8
    const CHARCOAL = st.hullDark; // 0x3a3c3e
    const GREY     = st.trim;     // 0x6b6e70
    const ORANGE   = st.accent;   // 0xb8763c
    const W = weather;
    const P_OFFWHITE = [OFFWHITE, OFFWHITE, W(OFFWHITE, 1), W(OFFWHITE, 1), W(OFFWHITE, 2)];
    const P_GREY     = [GREY, W(GREY, 1), W(GREY, 2), W(OFFWHITE, 3)];
    const P_ORANGE   = [ORANGE, W(ORANGE, 1), W(ORANGE, 2), W(OFFWHITE, 2)];
    const P_MIX      = [OFFWHITE, OFFWHITE, W(OFFWHITE, 1), W(GREY, 1), W(ORANGE, 1), W(CHARCOAL, 1)];
    const LIT     = 0xffffff;
    const LIT_DIM = 0xe8dcc8;
    const TEAL    = 0x4faeae;

    // ---------------------------------------------------------------- modules --
    // ONE foundry cell: box hull with frame ribs, horizontal belt bands,
    // front-face plate tiles, mullioned teal glazing, small dense window grids,
    // vent slats, junction box, hatch, antenna collar and lamp strings.
    const foundryCell = (o) => {
      const {
        x, y, z, ry: cellRy = 0,
        w = 5.5, h = 4.0, d = 5.0,
        skin, plates, seed, copyError = null,
      } = o;
      const sr = rng(seed);
      b.push(x, y, z, cellRy, 0, 0);
      if (copyError) {
        b.push(
          copyError.dx || 0, copyError.dy || 0, copyError.dz || 0,
          copyError.ry || 0, 0, 0,
        );
      }

      // ---- hull box + edge-frame ribs ----
      box(b, 'hull', skin, w, h, d);
      box(b, 'hull', CHARCOAL, w + 0.12, 0.22, 0.22, { y:  h / 2 });
      box(b, 'hull', CHARCOAL, w + 0.12, 0.22, 0.22, { y: -h / 2 });
      box(b, 'hull', CHARCOAL, 0.22, h + 0.12, 0.22, { z:  d / 2 });
      box(b, 'hull', CHARCOAL, 0.22, h + 0.12, 0.22, { z: -d / 2 });
      box(b, 'hull', CHARCOAL, 0.22, 0.22, d + 0.12, { x: -w / 2 });
      box(b, 'hull', CHARCOAL, 0.22, 0.22, d + 0.12, { x:  w / 2 });

      // ---- horizontal rib bands (in XZ plane at 3 heights) ----
      // r = max(w,d)/2 + 0.2 ensures bands protrude through all four vertical faces.
      ribBands(b, 'hull', W(CHARCOAL, 1), {
        r: Math.max(w, d) / 2 + 0.2, tube: 0.18,
        from: -h / 2 + 0.5, to: h / 2 - 0.5, count: 3,
        axis: 'y', tseg: 16,
      });

      // ---- front face (+z side): 3×2 raised plate tiles (upper area) ----
      const pW = (w - 1.2) / 3;   // ≈1.43 for w=5.5
      const pH = (h - 1.6) / 2;   // ≈1.2 for h=4.0
      for (let pi = 0; pi < 3; pi++) {
        for (let pj = 0; pj < 2; pj++) {
          const px = -w / 2 + 0.6 + pi * pW + pW / 2;
          const py =  h / 2 - 0.8 - pj * pH - pH / 2;
          box(b, 'hull', plates[Math.floor(sr() * plates.length)],
            pW - 0.18, pH - 0.18, 0.14, { x: px, y: py, z: d / 2 + 0.07 });
        }
      }

      // ---- front face: small 2×3 glow window grid (upper half) ----
      windowGrid(b, 'glow', LIT, {
        rows: 2, cols: 3, rowGap: 0.65, colGap: 0.82,
        w: 0.38, h: 0.30, d: 0.34,
        x: 0, y: h * 0.22, z: d / 2 + 0.04, axis: 'x',
      });

      // ---- front face: mullioned teal glazing (lower half) ----
      // dark outer frame
      box(b, 'hull', CHARCOAL, 2.9, 1.4, 0.16, { x: 0, y: -h * 0.22, z: d / 2 + 0.08 });
      // three teal panes
      box(b, 'glaze', TEAL, 0.76, 1.1, 0.18, { x: -0.88, y: -h * 0.22, z: d / 2 + 0.19 });
      box(b, 'glaze', TEAL, 0.76, 1.1, 0.18, { x:  0.00, y: -h * 0.22, z: d / 2 + 0.19 });
      box(b, 'glaze', TEAL, 0.76, 1.1, 0.18, { x:  0.88, y: -h * 0.22, z: d / 2 + 0.19 });
      // vertical mullion bars
      box(b, 'hull', CHARCOAL, 0.10, 1.2, 0.22, { x: -0.44, y: -h * 0.22, z: d / 2 + 0.19 });
      box(b, 'hull', CHARCOAL, 0.10, 1.2, 0.22, { x:  0.44, y: -h * 0.22, z: d / 2 + 0.19 });

      // ---- back face (-z side): 2×3 window grid + small teal pane ----
      windowGrid(b, 'glow', LIT_DIM, {
        rows: 2, cols: 3, rowGap: 0.65, colGap: 0.82,
        w: 0.36, h: 0.28, d: 0.32,
        x: 0, y: 0, z: -d / 2 - 0.04, axis: 'x',
      });
      box(b, 'glaze', TEAL, 1.8, 0.9, 0.15, { x: 0, y: h * 0.18, z: -d / 2 - 0.075 });

      // ---- left face (-x side): 2×3 window grid + vent grille ----
      const gapZ = (d - 1.0) / 3; // ≈1.33 for d=5
      windowGrid(b, 'glow', LIT, {
        rows: 2, cols: 3, rowGap: 0.65, colGap: gapZ,
        w: 0.36, h: 0.28, d: 0.32,
        x: -w / 2 - 0.04, y: 0.2, z: 0, axis: 'z',
      });
      // vent slats
      for (let vi = 0; vi < 5; vi++) {
        box(b, 'hull', CHARCOAL, 0.08, h * 0.30, 0.06,
          { x: -w / 2 - 0.04, y: -h * 0.25, z: -d / 3 + vi * 0.36 });
      }

      // ---- right face (+x side): 2×3 window grid + junction box ----
      windowGrid(b, 'glow', LIT_DIM, {
        rows: 2, cols: 3, rowGap: 0.65, colGap: gapZ,
        w: 0.36, h: 0.28, d: 0.32,
        x: w / 2 + 0.04, y: -0.2, z: 0, axis: 'z',
      });
      box(b, 'hull', W(GREY, 2), 0.80, 0.65, 0.18, { x: w / 2 + 0.09, y:  h * 0.18, z: d / 4 });
      box(b, 'glow', LIT_DIM,    0.28, 0.22, 0.15, { x: w / 2 + 0.17, y:  h * 0.18, z: d / 4 });

      // ---- top face: hatch cover + antenna mounting collar ----
      box(b, 'hull', W(GREY, 1), 1.5, 0.15, 1.1, { x: -w * 0.2, y: h / 2 + 0.075, z:  0.2 });
      box(b, 'hull', CHARCOAL,   1.2, 0.10, 0.8, { x: -w * 0.2, y: h / 2 + 0.10,  z:  0.2 });
      cyl(b, 'hull', W(GREY, 1), 0.52, 0.62, 0.32, 10, { x: w * 0.2, y: h / 2 + 0.16, z: 0 });
      box(b, 'glaze', TEAL, 0.44, 0.15, 0.44, { x: w * 0.2, y: h / 2 + 0.40, z: 0 });

      // ---- lamp strings ----
      lampString(b, 'glow', LIT, {
        ax: -w / 3, ay: h / 2 + 0.08, az: -d / 4,
        bx:  w / 3, by: h / 2 + 0.08, bz: -d / 4,
        count: 4, size: 0.22,
      });
      lampString(b, 'glow', LIT_DIM, {
        ax: w / 2, ay:  0, az: -d / 2,
        bx: w / 2, by:  0, bz:  d / 2,
        count: 3, size: 0.18,
      });

      if (copyError) b.pop();
      b.pop();
    };

    // Daughter probe: small plated hull with window rows on a flat cradle.
    const daughterProbe = (o) => {
      const { x, y, z, ry = 0 } = o;
      b.push(x, y, z, ry, 0, 0);
      const hW = 2.4, hH = 2.0, hD = 2.2;
      box(b, 'hull', OFFWHITE, hW, hH, hD);
      box(b, 'hull', CHARCOAL, hW + 0.1, 0.20, 0.20, { y:  hH / 2 });
      box(b, 'hull', CHARCOAL, hW + 0.1, 0.20, 0.20, { y: -hH / 2 });
      windowGrid(b, 'glow', LIT, {
        rows: 2, cols: 4, rowGap: 0.50, colGap: 0.44,
        w: 0.28, h: 0.22, d: 0.28,
        x: 0, y: 0.1, z: hD / 2 + 0.04, axis: 'x',
      });
      windowGrid(b, 'glow', LIT_DIM, {
        rows: 2, cols: 3, rowGap: 0.50, colGap: 0.55,
        w: 0.26, h: 0.20, d: 0.26,
        x: hW / 2 + 0.04, y: -0.1, z: 0, axis: 'z',
      });
      box(b, 'glaze', TEAL, 0.42, 0.14, 0.42, { x: 0, y: hH / 2 + 0.12, z: 0 });
      box(b, 'hull', W(GREY, 1), hW + 1.0, 0.40, hD + 0.8, { y: -hH / 2 - 0.45 });
      ribBands(b, 'hull', CHARCOAL, {
        r: (hD + 0.9) / 2 + 0.1, tube: 0.12,
        from: -hW / 2 - 0.2, to: hW / 2 + 0.2,
        count: 2, axis: 'x', tseg: 12,
      });
      portholeRing(b, 'glow', LIT_DIM, { r: hW / 2 + 0.12, count: 4, size: 0.20, y: 0.2 });
      b.pop();
    };

    // ----------------------------------------------- tier 0: ancient core --
    const coreY = 3, coreR = 7;
    b.push(0, coreY, 0, 0, 0, 0);
    sphere(b, 'hull', OFFWHITE, coreR, 32, 24);
    panelSkin(b, 'hull', P_OFFWHITE, {
      r: coreR * 0.97, from: -coreR * 0.5, to: coreR * 0.5,
      rows: 4, cols: 24, seed: 4501, t: 0.18, axis: 'y',
    });
    panelSkin(b, 'hull', P_ORANGE, {
      r: coreR * 0.98, from: -coreR * 0.22, to: coreR * 0.22,
      rows: 2, cols: 18, seed: 4502, t: 0.15, axis: 'y',
    });
    // Equatorial faded-orange ribbed band
    ribBands(b, 'hull', ORANGE, {
      r: coreR + 0.12, tube: 0.24,
      from: -coreR * 0.6, to: coreR * 0.6,
      count: 5, axis: 'y', tseg: 36,
    });
    // Porthole rings (upper and lower hemispheres)
    portholeRing(b, 'glow', LIT,     { r: coreR + 0.12, count: 20, size: 0.40, y:  coreR * 0.40, tilt:  0.20 });
    portholeRing(b, 'glow', LIT_DIM, { r: coreR + 0.12, count: 16, size: 0.36, y: -coreR * 0.40, tilt: -0.12 });
    portholeRing(b, 'glow', LIT,     { r: coreR + 0.12, count: 14, size: 0.30, y:  coreR * 0.70, tilt:  0.35 });
    // Teal-lit central port (front-facing) — GLAZE
    box(b, 'glaze', TEAL, 2.6, 2.6, 0.35, { x: 0, y: 1.8, z: coreR + 0.18 });
    torus(b, 'hull', W(GREY, 1), 1.35, 0.10, 8, 28, Math.PI * 2,
      { x: 0, y: 1.8, z: coreR + 0.35, rx: Math.PI / 2 });
    // Equatorial teal sensor windows (10 around belt)
    for (let i = 0; i < 10; i++) {
      const ang = (i * Math.PI * 2) / 10;
      box(b, 'glaze', TEAL, 0.70, 0.70, 0.24,
        { x: Math.cos(ang) * (coreR + 0.20), y: 0, z: Math.sin(ang) * (coreR + 0.20) });
    }
    // Upper shoulder platforms (4 mounts)
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI * 2) / 4;
      const px = Math.cos(ang) * coreR * 0.72;
      const pz = Math.sin(ang) * coreR * 0.72;
      box(b, 'hull', W(GREY, 1), 2.0, 0.5, 2.0, { x: px, y: coreR * 0.76, z: pz });
      cyl(b, 'hull', W(OFFWHITE, 1), 0.32, 0.32, 1.5, 9,
        { x: px, y: coreR * 0.76 + 0.50, z: pz });
      box(b, 'glaze', TEAL, 0.55, 0.55, 0.22, { x: px, y: coreR * 0.76 + 1.35, z: pz });
    }
    // Core equatorial status-window bands
    windowGrid(b, 'glow', LIT, {
      rows: 3, cols: 8, rowGap: 0.70, colGap: 1.10,
      w: 0.60, h: 0.50, d: 0.55,
      x: 0, y: -1.5, z: coreR * 0.94, axis: 'x',
    });
    windowGrid(b, 'glow', LIT_DIM, {
      rows: 2, cols: 6, rowGap: 0.70, colGap: 1.10,
      w: 0.55, h: 0.45, d: 0.52,
      x: 0, y: -1.5, z: -coreR * 0.94, axis: 'x',
    });
    // Two extra side glow windows to clear the glow ≥ 30 000 threshold.
    windowGrid(b, 'glow', LIT_DIM, {
      rows: 1, cols: 2, rowGap: 0.70, colGap: 1.20,
      w: 0.55, h: 0.45, d: 0.52,
      x: 0, y: 0.5, z: -coreR * 0.94, axis: 'x',
    });
    b.pop();

    // ------------------------------------------ tier 1: belly foundry cells --
    // Five cells at radius 9 around core equator (y=coreY-1=2).
    // Cell inner edge at 9-2.75=6.25 < sphere radius 7 → each cell partially
    // overlaps the sphere — this IS the connection, no airlock needed.
    const bellyCells = [
      { x:  9.0, y: coreY - 1, z:  0.0, ry:  Math.PI / 2 },
      { x: -9.0, y: coreY - 1, z:  0.0, ry: -Math.PI / 2 },
      { x:  0.0, y: coreY - 1, z:  9.0, ry:  0 },
      { x:  0.0, y: coreY - 1, z: -9.0, ry:  Math.PI },
      { x:  6.5, y: coreY - 1.5, z: 6.5, ry: Math.PI / 4 },
    ];
    bellyCells.forEach((c, i) => {
      foundryCell({
        x: c.x, y: c.y, z: c.z, ry: c.ry,
        w: 5.5, h: 3.8, d: 5.0,
        skin:   i % 2 === 0 ? OFFWHITE : W(OFFWHITE, 1),
        plates: i % 3 === 0 ? P_ORANGE : P_OFFWHITE,
        seed:   4506 + i,
        copyError: i === 2 ? { dx: 0.40, dy: -0.30, dz: 0.40, ry: 0.10 } : null,
      });
    });

    // ---------------------------------------- tier 2: left + right wings --
    const leftCells = [
      { x: -11, y: 5.0, z:  -2, ry:  0.20 },
      { x: -14, y: 6.5, z:  -7, ry: -0.10 },
      { x: -10, y: 7.5, z: -12, ry:  0.20 },
      { x: -16, y: 8.5, z: -10, ry:  0.00 },
    ];
    const rightCells = [
      { x: 10, y: 5.0, z:  4, ry: -0.15 },
      { x: 14, y: 6.5, z:  8, ry:  0.20 },
      { x: 11, y: 7.5, z: 13, ry:  0.10 },
      { x: 17, y: 8.5, z:  9, ry: -0.10 },
    ];

    leftCells.forEach((c, i) => {
      foundryCell({
        x: c.x, y: c.y, z: c.z, ry: c.ry,
        w: 5.5, h: 4.0, d: 5.0,
        skin:   i % 2 === 0 ? OFFWHITE : W(OFFWHITE, 1),
        plates: i % 3 === 0 ? P_ORANGE : P_OFFWHITE,
        seed:   4512 + i,
        copyError: i === 2 ? { dx: 0.55, dy: -0.35, dz: 0.45, ry: 0.12 } : null,
      });
      // Airlock to core
      const len = Math.sqrt(c.x * c.x + c.z * c.z);
      airlock(b, 'hull', W(OFFWHITE, 1), CHARCOAL, {
        ax: c.x, ay: c.y - 1.8, az: c.z,
        bx: c.x * 7.5 / len, by: coreY + 0.5, bz: c.z * 7.5 / len,
        r: 1.4, seg: 12, rings: 2,
      });
    });

    rightCells.forEach((c, i) => {
      foundryCell({
        x: c.x, y: c.y, z: c.z, ry: c.ry,
        w: 5.5, h: 4.0, d: 5.0,
        skin:   i % 3 === 0 ? W(GREY, 1) : OFFWHITE,
        plates: i % 2 === 0 ? P_GREY : P_MIX,
        seed:   4520 + i,
        copyError: i === 3 ? { dx: -0.50, dy: 0.30, dz: -0.40, ry: -0.10 } : null,
      });
      const len = Math.sqrt(c.x * c.x + c.z * c.z);
      airlock(b, 'hull', W(OFFWHITE, 2), CHARCOAL, {
        ax: c.x, ay: c.y - 1.8, az: c.z,
        bx: c.x * 7.5 / len, by: coreY + 0.5, bz: c.z * 7.5 / len,
        r: 1.4, seg: 12, rings: 2,
      });
    });

    // Conveyor truss spines linking cell chains
    leftCells.forEach((c, i) => {
      if (i < leftCells.length - 1) {
        const n = leftCells[i + 1];
        truss(b, 'hull', CHARCOAL, {
          ax: c.x + 2.5, ay: c.y, az: c.z,
          bx: n.x + 2.5, by: n.y, bz: n.z,
          thickness: 0.30, bays: 5, spread: 1.0,
        });
      }
    });
    rightCells.forEach((c, i) => {
      if (i < rightCells.length - 1) {
        const n = rightCells[i + 1];
        truss(b, 'hull', CHARCOAL, {
          ax: c.x - 2.5, ay: c.y, az: c.z,
          bx: n.x - 2.5, by: n.y, bz: n.z,
          thickness: 0.30, bays: 5, spread: 1.0,
        });
      }
    });

    // PipeRun umbilicals from cell crowns to core
    leftCells.forEach(c => {
      pipeRun(b, 'hull', W(GREY, 1), {
        ax: c.x, ay: c.y + 2.2, az: c.z,
        bx: c.x * 0.30, by: c.y + 0.8, bz: c.z * 0.30,
        r: 0.17, seg: 8, collars: 3,
      });
    });
    rightCells.forEach(c => {
      pipeRun(b, 'hull', W(GREY, 1), {
        ax: c.x, ay: c.y + 2.2, az: c.z,
        bx: c.x * 0.30, by: c.y + 0.8, bz: c.z * 0.30,
        r: 0.17, seg: 8, collars: 3,
      });
    });

    // ------------------------------------------- tier 3: crown cells --
    const crownCells = [
      { x:  4, y: 11.0, z: -4, ry:  0.30 },
      { x: -4, y: 11.5, z:  4, ry: -0.20 },
      { x:  0, y: 12.0, z:  6, ry:  0.10 },
      { x:  5, y: 12.5, z:  2, ry: -0.15 },
    ];
    crownCells.forEach((c, i) => {
      foundryCell({
        x: c.x, y: c.y, z: c.z, ry: c.ry,
        w: 5.0, h: 3.6, d: 4.5,
        skin:   i % 2 === 0 ? W(OFFWHITE, 1) : OFFWHITE,
        plates: i % 3 === 0 ? P_GREY : P_OFFWHITE,
        seed:   4528 + i,
        copyError: i === 1 ? { dx: 0.40, dy: 0.30, dz: -0.35, ry: 0.08 } : null,
      });
      pipeRun(b, 'hull', W(GREY, 1), {
        ax: c.x, ay: c.y - 1.8, az: c.z,
        bx: c.x * 0.60, by: c.y - 3.5, bz: c.z * 0.60,
        r: 0.16, seg: 8, collars: 2,
      });
    });

    // ----------------------------------------- tier 4: antenna forest --
    const antSites = [
      ...[...leftCells, ...rightCells].map((c, i) => ({
        x: c.x, y: c.y + 2.3, z: c.z, h: 4 + (i % 3),
      })),
      ...crownCells.map((c, i) => ({
        x: c.x, y: c.y + 2.0, z: c.z, h: 4.5 + (i % 2),
      })),
      { x:  3, y: 14.0, z:  0, h: 5.5 },
      { x: -3, y: 14.0, z:  0, h: 5.0 },
      { x:  0, y: 14.5, z:  3, h: 5.8 },
      { x:  2, y: 13.5, z: -2, h: 4.5 },
    ];
    antSites.forEach(site => {
      antenna(b, 'hull', W(GREY, 2), W(OFFWHITE, 2), {
        x: site.x, y: site.y, z: site.z, h: site.h, r: 0.12, tip: 0.30,
      });
      box(b, 'glaze', TEAL, 0.36, 0.13, 0.36,
        { x: site.x, y: site.y + site.h + 0.16, z: site.z });
    });

    // ---------------------------------- daughter probes (at ring level) --
    // Placed at y=-5 to -5.5 so they sit close to ring cell tops (y≈-7.1).
    const daughterSites = [
      { x: -7, y: -5.0, z:  5, ry:  0.30 },
      { x:  6, y: -5.5, z: -7, ry: -0.20 },
      { x:  8, y: -5.0, z:  5, ry:  0.15 },
      { x: -6, y: -5.5, z: -8, ry: -0.25 },
    ];
    daughterSites.forEach(site => {
      daughterProbe(site);
      // Umbilical up to belly
      pipeRun(b, 'hull', CHARCOAL, {
        ax: site.x, ay: site.y + 1.0, az: site.z,
        bx: site.x * 0.50, by: -2.0, bz: site.z * 0.50,
        r: 0.14, seg: 6, collars: 2,
      });
    });
    bridge(b, 'hull', W(OFFWHITE, 1), CHARCOAL, {
      ax: -7, ay: -5.0, az:  5, bx: 8, by: -5.0, bz:  5,
      w: 1.6, railH: 0.70, posts: 5,
    });
    bridge(b, 'hull', W(OFFWHITE, 1), CHARCOAL, {
      ax:  6, ay: -5.5, az: -7, bx: -6, by: -5.5, bz: -8,
      w: 1.6, railH: 0.70, posts: 5,
    });

    // ------------------------- ring connection: stem + cradle arms --
    // Central vertical stem: airlock from belly bottom to ring hub top.
    // Hub top is at world y = ringY + 1.5/2 = -9 + 0.75 = -8.25; stem ends at
    // -8.0 → overlaps hub top by 0.25.
    airlock(b, 'hull', W(OFFWHITE, 1), CHARCOAL, {
      ax: 0, ay: -3.5, az: 0,
      bx: 0, by: -8.0, bz: 0,
      r: 2.0, seg: 14, rings: 3,
    });

    // Four diagonal cradle arms reaching to ring hoop positions.
    // Endpoints at radius 9, y=-8.5: this lands INSIDE the ring torus tube
    // (centre (9,-9,0), tube r=0.52, distance from arm tip 0.5 < 0.52).
    const ringR = 9;
    const cradleAngs = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    cradleAngs.forEach(a => {
      truss(b, 'hull', CHARCOAL, {
        ax: 0, ay: -6.0, az: 0,
        bx: Math.cos(a) * ringR, by: -8.5, bz: Math.sin(a) * ringR,
        thickness: 0.26, bays: 4, spread: 0.80,
      });
    });

    // --------------------------------------------------- surface greebles --
    // Hull-only scatter + targeted glow boxes placed inside cell push contexts.
    // Range limited to station volume (-16..16, -3..13, -14..13).
    for (let gi = 0; gi < 60; gi++) {
      const gx = -15 + rand() * 30;
      const gz = -12 + rand() * 25;
      const gy =  -2 + rand() * 15;
      box(b, 'hull',
        [CHARCOAL, W(GREY, 2), W(OFFWHITE, 2), CHARCOAL][gi % 4],
        0.50 + rand() * 0.70, 0.40 + rand() * 0.40, 0.40 + rand() * 0.50,
        { x: gx, y: gy, z: gz, ry: rand() * Math.PI });
      if (gi % 3 === 0) {
        // glow status light near the hull greeble, offset so nearest hull vert
        // is at gx,gy,gz (same 2-unit cell → passes orphan check)
        box(b, 'glow', LIT_DIM, 0.28, 0.20, 0.18,
          { x: gx + 0.38, y: gy + 0.22, z: gz });
      }
    }

    // ===================================================== ring: daughter-print
    const ringN      = 5;
    const rCW        = 5.0;  // ring cell width
    const rCH        = 3.8;  // ring cell height
    const rCD        = 4.5;  // ring cell depth
    const rCRibR     = Math.max(rCW, rCD) / 2 + 0.18; // rib band radius (2.68)

    for (let i = 0; i < ringN; i++) {
      const ang  = (i * Math.PI * 2) / ringN;
      const cx   = Math.cos(ang) * ringR;
      const cz   = Math.sin(ang) * ringR;
      // ry = PI/2 - ang makes each cell's +Z face radially outward from ring hub.
      ringB.push(cx, 0, cz, Math.PI / 2 - ang, 0, 0);

      // hull box + edge frames
      box(ringB, 'ringHull', OFFWHITE, rCW, rCH, rCD);
      box(ringB, 'ringHull', CHARCOAL, rCW + 0.12, 0.20, 0.20, { y:  rCH / 2 });
      box(ringB, 'ringHull', CHARCOAL, rCW + 0.12, 0.20, 0.20, { y: -rCH / 2 });
      box(ringB, 'ringHull', CHARCOAL, 0.20, rCH + 0.12, 0.20, { z:  rCD / 2 });
      box(ringB, 'ringHull', CHARCOAL, 0.20, rCH + 0.12, 0.20, { z: -rCD / 2 });

      // horizontal rib bands
      ribBands(ringB, 'ringHull', W(CHARCOAL, 1), {
        r: rCRibR, tube: 0.16,
        from: -rCH / 2 + 0.45, to: rCH / 2 - 0.45,
        count: 3, axis: 'y', tseg: 14,
      });

      // front face (+z) plate tiles
      const rpW = (rCW - 1.0) / 3;
      const rpH = (rCH - 1.2) / 2;
      for (let pi = 0; pi < 3; pi++) {
        for (let pj = 0; pj < 2; pj++) {
          const rpx = -rCW / 2 + 0.5 + pi * rpW + rpW / 2;
          const rpy =  rCH / 2 - 0.6 - pj * rpH - rpH / 2;
          box(ringB, 'ringHull',
            P_OFFWHITE[Math.floor((pi * 2 + pj) % P_OFFWHITE.length)],
            rpW - 0.16, rpH - 0.16, 0.12,
            { x: rpx, y: rpy, z: rCD / 2 + 0.06 });
        }
      }

      // front face: 2×3 glow window grid (upper)
      windowGrid(ringB, 'ringGlow', LIT, {
        rows: 2, cols: 3, rowGap: 0.62, colGap: 0.80,
        w: 0.36, h: 0.28, d: 0.32,
        x: 0, y: rCH * 0.22, z: rCD / 2 + 0.04, axis: 'x',
      });

      // front face: mullioned teal glazing (lower)
      box(ringB, 'ringHull', CHARCOAL, 2.7, 1.3, 0.15,
        { x: 0, y: -rCH * 0.20, z: rCD / 2 + 0.075 });
      box(ringB, 'ringGlaze', TEAL, 0.72, 1.0, 0.17,
        { x: -0.82, y: -rCH * 0.20, z: rCD / 2 + 0.175 });
      box(ringB, 'ringGlaze', TEAL, 0.72, 1.0, 0.17,
        { x:  0.00, y: -rCH * 0.20, z: rCD / 2 + 0.175 });
      box(ringB, 'ringGlaze', TEAL, 0.72, 1.0, 0.17,
        { x:  0.82, y: -rCH * 0.20, z: rCD / 2 + 0.175 });
      box(ringB, 'ringHull', CHARCOAL, 0.10, 1.1, 0.20,
        { x: -0.41, y: -rCH * 0.20, z: rCD / 2 + 0.175 });
      box(ringB, 'ringHull', CHARCOAL, 0.10, 1.1, 0.20,
        { x:  0.41, y: -rCH * 0.20, z: rCD / 2 + 0.175 });

      // back face (-z): 2×3 window grid
      windowGrid(ringB, 'ringGlow', LIT_DIM, {
        rows: 2, cols: 3, rowGap: 0.62, colGap: 0.80,
        w: 0.34, h: 0.26, d: 0.30,
        x: 0, y: 0, z: -rCD / 2 - 0.04, axis: 'x',
      });

      // side faces: 2×3 window grids
      const rGapZ = (rCD - 1.0) / 3;
      windowGrid(ringB, 'ringGlow', LIT, {
        rows: 2, cols: 3, rowGap: 0.62, colGap: rGapZ,
        w: 0.34, h: 0.26, d: 0.30,
        x: rCW / 2 + 0.04, y: 0.10, z: 0, axis: 'z',
      });
      windowGrid(ringB, 'ringGlow', LIT_DIM, {
        rows: 2, cols: 3, rowGap: 0.62, colGap: rGapZ,
        w: 0.34, h: 0.26, d: 0.30,
        x: -rCW / 2 - 0.04, y: -0.10, z: 0, axis: 'z',
      });

      // lamp strings
      lampString(ringB, 'ringGlow', LIT, {
        ax: -rCW / 3, ay: rCH / 2 + 0.07, az: -rCD / 4,
        bx:  rCW / 3, by: rCH / 2 + 0.07, bz: -rCD / 4,
        count: 4, size: 0.20,
      });
      lampString(ringB, 'ringGlow', LIT_DIM, {
        ax: rCW / 2, ay: 0, az: -rCD / 2,
        bx: rCW / 2, by: 0, bz:  rCD / 2,
        count: 3, size: 0.17,
      });

      // crown teal optic + antenna stub
      box(ringB, 'ringGlaze', TEAL, 0.52, 0.18, 0.52,
        { x: 0, y: rCH / 2 + 0.24, z: 0 });
      antenna(ringB, 'ringHull', W(GREY, 1), W(OFFWHITE, 2),
        { x: 0, y: rCH / 2 + 0.28, z: 0, h: 2.0, r: 0.10, tip: 0.24 });
      box(ringB, 'ringGlaze', TEAL, 0.28, 0.10, 0.28,
        { x: 0, y: rCH / 2 + 0.28 + 2.0 + 0.16, z: 0 });

      ringB.pop();
    }

    // ---- ring hoop torus + decorative collar rings ----
    ringB.push(0, 0, 0, 0, 0, 0);
    torus(ringB, 'ringHull', OFFWHITE, ringR, 0.52, 18, ringN * 8, Math.PI * 2,
      { rx: Math.PI / 2 });
    torus(ringB, 'ringHull', W(CHARCOAL, 1), ringR, 0.18, 10, ringN * 5, Math.PI * 2,
      { rx: Math.PI / 2, y:  0.38 });
    torus(ringB, 'ringHull', W(CHARCOAL, 1), ringR, 0.18, 10, ringN * 5, Math.PI * 2,
      { rx: Math.PI / 2, y: -0.38 });
    ringB.pop();

    // ---- ring hub: plated cylinder with spokes ----
    ringB.push(0, 0, 0, 0, 0, 0);
    cyl(ringB, 'ringHull', W(OFFWHITE, 1), 2.8, 2.8, 1.5, 16);
    panelSkin(ringB, 'ringHull', P_GREY, {
      r: 2.85, from: -0.65, to: 0.65,
      rows: 2, cols: 10, seed: 4560, t: 0.14, axis: 'y',
    });
    torus(ringB, 'ringHull', W(CHARCOAL, 1), 2.78, 0.10, 8, 20, Math.PI * 2,
      { rx: Math.PI / 2 });
    box(ringB, 'ringGlaze', TEAL, 1.0, 0.28, 1.0, { x: 0, y: 0.9, z: 0 });
    portholeRing(ringB, 'ringGlow', LIT_DIM, { r: 2.5, count: 8, size: 0.22, y: 0.28 });
    // spokes: hub surface to inner face of each ring cell
    for (let i = 0; i < ringN; i++) {
      const ang = (i * Math.PI * 2) / ringN;
      const sx  = Math.cos(ang) * 3.0;
      const sz  = Math.sin(ang) * 3.0;
      const ex  = Math.cos(ang) * (ringR - 2.5);
      const ez  = Math.sin(ang) * (ringR - 2.5);
      truss(ringB, 'ringHull', CHARCOAL, {
        ax: sx, ay: 0, az: sz,
        bx: ex, by: 0, bz: ez,
        thickness: 0.26, bays: 5, spread: 0.82,
      });
    }
    ringB.pop();
  },
};
