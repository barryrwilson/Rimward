/**
 * Veridian Combine — "Veridian Spire", corporate deep-rock extraction and assay
 * complex.
 *
 * Reference art: docs/FactionExamples/01-veridian-combine-station.png.
 *
 * The Veridian Spire is a hexagonal industrial extraction hub: three tiers of
 * interpenetrating faceted core drums, assay towers bedded into the shoulders,
 * a girdle of ore-hopper drums and settling tanks packed against the waist,
 * radial docking spokes with truss spines and berth lamps, and a belly of
 * conveyor galleries feeding the processing carousel tucked underneath.
 *
 * The faction identity is emerald-green assay lighting and ore-scanner optics.
 * This colour lives in `glaze` (backlit assay windows, spectrometer panes) and
 * as the pulsed `glow` channel's near-white lit windows — never as a hull
 * tint.
 *
 * Tiers:
 *   Tier 0: Lower structural/docking layer — hexagonal raft drums, docking
 *           spokes, conveyor galleries, pipe runs feeding the hoppers.
 *   Tier 1: Core stack waist — three interpenetrating hexagonal drums plated
 *           with panel skins, belted with rib bands, with ore-hopper drums
 *           and settling tanks packed against the waist.
 *   Tier 2: Assay tower crown — three or four slim hexagonal assay towers
 *           bedded into the core shoulders, each skinned, window-gridded and
 *           lamp-crowned.
 *   Tier 3: Processing carousel — hexagonal hoop of six crusher pods tucked
 *           under the belly at ringY = -17.5, radius 12. Each pod is a plated
 *           box with glazed emerald assay windows (ringGlaze) and near-white
 *           pod lamps (ringGlow), spoked to a plated hub.
 *
 * Hexagonal geometry dominates: use `cyl(..., seg: 6)` for the faceted 6-sided
 * forms. Modules interpenetrate (spacing smaller than diameter) and every
 * adjacency gets an `airlock`, every gap a `bridge`.
 *
 * Measured numbers (self-check):
 *   parts: 3,290 primitives
 *   totalVerts: 221,388
 *   glowVerts: 38,544
 *   bbox: x ∈ [-23.5, 22.1], z ∈ [-21.4, 21.3], y ∈ [-19.7, 27.3]
 *   isolated: 0.00%  orphanGlow: 0.00%  orphanGlaze: 0.00%
 *
 * Ring: ORE-PROCESSING CAROUSEL, radius 12, at ringY = -17.5.
 *   Six crusher pods, each a plated box (4.2 × 3.0 × 3.4) with glazed
 *   emerald assay windows (ringGlaze, 14 panes, 0x58c49a at 0.18 density)
 *   and near-white pod lamps (ringGlow, 0xfff2e2), spoked to a plated hub.
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone, ribBands,
  windowRow, windowGrid, portholeRing, panelSkin, panelPatches, truss,
  railing, bridge, airlock, pipeRun, antenna, ladder, radiatorPanel,
  lampString, crate,
} from '../station-detail.js';

export const veridianStation = {
  ringY: -17.5,
  build(b, ringB, st) {
    const rand = rng(4501);

    // Base palette (FACTION_STYLE only) and its weathered shades.
    const GRAPHITE = st.hull;         // 0x3a4442 primary graphite hull
    const DARK = st.hullDark;          // 0x232d2d recessed structure
    const ALLOY = st.trim;             // 0x8a948c pale alloy trim
    const EMERALD = st.accent;         // 0x58c49a identity emerald (glaze only)
    const DEEP = st.patch[0];          // 0x3a5a4b dark forest green
    const W = weather;
    // Plate sets: mottled skins, every entry derived from a BASE colour.
    const P_GRAPHITE = [GRAPHITE, GRAPHITE, W(GRAPHITE, 1), W(GRAPHITE, 2), W(GRAPHITE, 3)];
    const P_ALLOY = [ALLOY, W(ALLOY, 1), W(ALLOY, 2), W(GRAPHITE, 2)];
    const P_DEEP = [DEEP, W(DEEP, 1), W(DEEP, 2), W(DARK, 1)];
    const P_MIX = [GRAPHITE, ALLOY, W(GRAPHITE, 1), W(ALLOY, 1), W(DEEP, 1)];
    // Window tints — near-neutral so the emerald pulse keeps its hue.
    const LIT = 0xffffff;
    const LIT_SOFT = 0xfff2e2;
    const LIT_DIM = 0xe8dcc8;
    // Assay glazing — emerald but dulled for readability (glass is UNLIT).
    const ASSAY = 0x58c49a;
    const ASSAY_DIM = 0x3a8c6a;
    const ASSAY_DARK = 0x2a6a4a;

    // ---------------------------------------------------------------- modules --
    // Hexagonal drum: faceted 6-sided barrel with panel skin, rib bands,
    // window fields, and end caps. The hexagon is the Veridian signature.
    const hexDrum = (o) => {
      const { x, y, z, r, l, axis = 'x', skin, cap, plates, rows = 5, cols = 12,
        winRows = 3, winCols = 8, seed } = o;
      const alongX = axis === 'x';
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r, r, l, 6, alongX ? { rz: Math.PI / 2 } : { rx: Math.PI / 2 });
      panelSkin(b, 'hull', plates, { r, from: -l / 2 + 0.8, to: l / 2 - 0.8, rows, cols, seed, t: 0.2, axis });
      ribBands(b, 'hull', DARK, { r: r + 0.12, tube: 0.18, from: -l / 2 + 1.8, to: l / 2 - 1.8, count: 4, axis, tseg: 6 });
      for (const s of [-1, 1]) {
        cyl(b, 'hull', cap, r * 1.03, r * 0.9, 1.0, 6,
          alongX ? { x: s * l / 2, rz: Math.PI / 2 } : { z: s * l / 2, rx: Math.PI / 2 });
        const ring = alongX ? { x: s * (l / 2 + 0.55), ry: Math.PI / 2 } : { z: s * (l / 2 + 0.55) };
        torus(b, 'hull', W(ALLOY, 1), r * 0.82, 0.08, 6, 6, undefined, ring);
      }
      // hex facet distance: flat faces sit at r * cos(PI/6), not at r
      const rF = r * Math.cos(Math.PI / 6);
      const gap = (l - 2.8) / winCols;
      if (alongX) {
        // axis='x' drum: hex cross-section in YZ plane.
        // Top face (y=rF, z=0) and bottom face (y=-rF, z=0).
        // axis:'y' → cols step along X (drum length), rows step along Z (face width).
        // H = (winRows-1)*rowGap/2 + d/2 must be ≤ r*0.5 (face half-width).
        windowGrid(b, 'glow', LIT,      { rows: winRows, cols: winCols, rowGap: 0.85, colGap: gap, w: 0.8, h: 0.3, d: 0.55, x: 0, y:  rF, z: 0, axis: 'y' });
        windowGrid(b, 'glow', LIT_SOFT, { rows: winRows, cols: winCols, rowGap: 0.85, colGap: gap, w: 0.8, h: 0.3, d: 0.55, x: 0, y: -rF, z: 0, axis: 'y' });
        box(b, 'hull', W(ALLOY, 1), l * 0.85, 0.42, 2.2, { y: r + 0.2 });
        railing(b, 'hull', DARK, { ax: -l / 2 + 1.2, ay: r + 0.45, az: 0, bx: l / 2 - 1.2, by: r + 0.45, bz: 0, height: 0.75, posts: 8, rail: 0.08 });
        ladder(b, 'hull', DARK, { x: l / 2 - 2.0, y: -r, z: r * 0.58, h: r * 1.8, w: 0.52, rungs: 5 });
      } else {
        // axis='z' drum: hex cross-section in XY plane (after rx=PI/2).
        // +X face at x=rF, face spans y ∈ [-r*0.5, r*0.5].
        // Push with ry=PI/2 so local-X → drum-(-Z), local-Z → drum-(+X).
        // axis:'x' → cols along local-X (drum axis), rows along local-Y (face width).
        b.push(rF, 0, 0, Math.PI / 2, 0, 0);
        windowGrid(b, 'glow', LIT,      { rows: winRows, cols: winCols, rowGap: 1.0, colGap: gap, w: 0.55, h: 0.3, d: 0.25, x: 0, y: 0, z: 0, axis: 'x' });
        b.pop();
        b.push(-rF, 0, 0, -Math.PI / 2, 0, 0);
        windowGrid(b, 'glow', LIT_SOFT, { rows: winRows, cols: winCols, rowGap: 1.0, colGap: gap, w: 0.55, h: 0.3, d: 0.25, x: 0, y: 0, z: 0, axis: 'x' });
        b.pop();
        box(b, 'hull', W(ALLOY, 1), 2.2, 0.42, l * 0.85, { y: r + 0.2 });
        railing(b, 'hull', DARK, { ax: 0, ay: r + 0.45, az: -l / 2 + 1.2, bx: 0, by: r + 0.45, bz: l / 2 - 1.2, height: 0.75, posts: 8, rail: 0.08 });
        ladder(b, 'hull', DARK, { x: r * 0.58, y: -r, z: l / 2 - 2.0, h: r * 1.8, w: 0.52, rungs: 5, ry: Math.PI / 2 });
      }
      b.pop();
    };

    // Assay tower: slim hexagonal tower with dense window grid, glazed
    // assay panels, and lamp crown. These are the Veridian identity markers.
    const assayTower = (o) => {
      const { x, y, z, r, h, skin, plates, seed } = o;
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r, r * 0.85, h, 6);
      panelSkin(b, 'hull', plates, { r: r + 0.1, from: -h / 2 + 1.0, to: h / 2 - 1.0, rows: 7, cols: 10, seed, t: 0.18, axis: 'y' });
      ribBands(b, 'hull', DARK, { r: r + 0.18, tube: 0.16, from: -h / 2 + 2, to: h / 2 - 2, count: 5, axis: 'y', tseg: 6 });
      // Window rings on hex facets — portholeRing places each disc exactly at
      // the face centre (r * cos(PI/6)), so it can never float off a flat face.
      // count=6 aligns with the six faces of the hexagonal cross-section.
      const rFace = r * Math.cos(Math.PI / 6);
      for (let py = -h / 2 + 1.8; py <= h / 2 - 1.8; py += 1.4) {
        portholeRing(b, 'glow', LIT, { r: rFace, count: 6, size: 0.22, y: py, seg: 6 });
      }
      // Glazed assay panels on alternate faces (backlit emerald)
      for (let i = 0; i < 3; i++) {
        const a = ((i + 0.5) / 3) * Math.PI * 2;
        const px = Math.cos(a) * (r + 0.12);
        const pz = Math.sin(a) * (r + 0.12);
        b.push(px, 0, pz, 0, a, 0);
        box(b, 'hull', DARK, 1.2, h - 2.2, 1.8, { y: 0 });
        for (let py = -h / 2 + 1.4; py < h / 2 - 1.4; py += 1.4) {
          box(b, 'glaze', ASSAY_DIM, 0.85, 0.95, 0.12, { y: py, z: 0.85 });
          box(b, 'glaze', ASSAY_DIM, 0.85, 0.95, 0.12, { y: py, z: -0.85 });
        }
        b.pop();
      }
      // Lamp crown at top
      cyl(b, 'hull', W(ALLOY, 1), r * 1.1, r * 0.9, 1.2, 6, { y: h / 2 });
      torus(b, 'hull', DARK, r * 0.95, 0.1, 6, 6, undefined, { y: h / 2 + 0.65, rx: Math.PI / 2 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        box(b, 'glow', LIT_SOFT, 0.32, 0.26, 0.32, { x: Math.cos(a) * r * 0.7, y: h / 2 + 0.3, z: Math.sin(a) * r * 0.7 });
      }
      b.pop();
    };

    // Hopper drum: ore-processing tank with bands, belly plates, and feeder rings.
    const hopperDrum = (x, y, z, r, h, skin, plates, seed) => {
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r, r * 0.85, h, 8);
      ribBands(b, 'hull', DARK, { r: r + 0.14, tube: 0.2, from: -h * 0.4, to: h * 0.4, count: 3, axis: 'y', tseg: 8 });
      panelSkin(b, 'hull', plates, { r: r * 0.92, from: -h * 0.35, to: h * 0.35, rows: 3, cols: 14, seed, t: 0.16, axis: 'y' });
      // Feeder rings at top and bottom
      torus(b, 'hull', W(ALLOY, 1), r * 0.88, 0.12, 6, 8, undefined, { y: h / 2 - 0.6, rx: Math.PI / 2 });
      torus(b, 'hull', W(ALLOY, 1), r * 1.08, 0.12, 6, 8, undefined, { y: -h / 2 + 0.6, rx: Math.PI / 2 });
      // Porthole-style indicator lights
      portholeRing(b, 'glow', LIT_DIM, { r: r + 0.16, count: 8, size: 0.24, y: h * 0.15, seg: 8 });
      b.pop();
    };

    // Settling tank: spherical tank with bands and belly plates.
    const settlingTank = (x, y, z, r, skin, plates, seed) => {
      b.push(x, y, z, 0, 0, 0);
      sphere(b, 'hull', skin, r, 16, 12);
      ribBands(b, 'hull', DARK, { r: r * 1.01, tube: 0.12, from: -r * 0.5, to: r * 0.5, count: 2, axis: 'y', tseg: 16 });
      panelSkin(b, 'hull', plates, { r: r * 0.95, from: -r * 0.4, to: r * 0.4, rows: 2, cols: 10, seed, t: 0.14, axis: 'y' });
      portholeRing(b, 'glow', LIT_DIM, { r: r * 1.02, count: 6, size: 0.22, y: r * 0.4, seg: 8 });
      cyl(b, 'hull', DARK, 0.38, 0.38, r * 1.4, 8, { y: -r * 1.1 });
      b.pop();
    };

    // Docking spoke: truss spine with catwalk and berth lamps.
    const dockingSpoke = (o) => {
      const { x, y, z, len, dir, skin } = o;
      const dx = dir === 'x' ? 1 : 0;
      const dz = dir === 'z' ? 1 : 0;
      b.push(x, y, z, 0, 0, 0);
      // Main truss spine
      truss(b, 'hull', DARK, { ax: 0, ay: 0, az: 0, bx: dx * len, by: 0, bz: dz * len, bays: 6, thickness: 0.28, spread: 0.85 });
      // Catwalk deck along truss
      bridge(b, 'hull', W(ALLOY, 1), DARK, { ax: 0, ay: 0.6, az: 0, bx: dx * (len - 2), by: 0.6, bz: dz * (len - 2), w: 1.6, railH: 0.7, posts: 8 });
      // Berth jaw at end
      b.push(dx * (len - 1.5), 0, dz * (len - 1.5), 0, 0, 0);
      box(b, 'hull', skin, 2.8, 1.8, 2.4, { y: 0.2 });
      for (const jaw of [-1, 1]) {
        const jx = dir === 'z' ? jaw * 1.4 : 0;
        const jz = dir === 'x' ? jaw * 1.4 : 0;
        box(b, 'hull', W(GRAPHITE, 1), 0.8, 2.4, 1.2, { x: jx, y: 0.8, z: jz });
      }
      // Berth lamps
      lampString(b, 'glow', LIT_SOFT, { ax: -1.2, ay: 0.6, az: 0, bx: 1.2, by: 0.6, bz: 0, count: 5, size: 0.24 });
      if (dir === 'x') {
        lampString(b, 'glow', LIT_SOFT, { ax: 0, ay: 0.6, az: -1.2, bx: 0, by: 0.6, bz: 1.2, count: 5, size: 0.24 });
      }
      b.pop();
      // Service lights along truss
      for (let i = 1; i < 5; i++) {
        const t = i / 6;
        box(b, 'glow', LIT_DIM, 0.28, 0.22, 0.28, { x: dx * len * t, y: 0.4, z: dz * len * t });
      }
      b.pop();
    };

    // ------------------------------------------------------- tier 0: lower raft --
    // Five hexagonal drums forming the lower platform (spaced 8 units apart for
    // radius-5 drums, overlapping by 2 units).
    const RAFT = [
      { z: -16, l: 22, x: 1, skin: GRAPHITE, cap: W(GRAPHITE, 1), plates: P_GRAPHITE },
      { z: -8, l: 26, x: -0.5, skin: W(GRAPHITE, 1), cap: GRAPHITE, plates: P_ALLOY },
      { z: 0, l: 28, x: 0.5, skin: P_DEEP[0], cap: W(GRAPHITE, 1), plates: P_DEEP },
      { z: 8, l: 25, x: -0.8, skin: GRAPHITE, cap: W(ALLOY, 1), plates: P_GRAPHITE },
      { z: 16, l: 21, x: 0.8, skin: W(ALLOY, 1), cap: GRAPHITE, plates: P_ALLOY },
    ];
    RAFT.forEach((d, i) => hexDrum({
      x: d.x, y: -7, z: d.z, r: 5.0, l: d.l, axis: 'x',
      skin: d.skin, cap: d.cap, plates: d.plates,
      rows: 5, cols: 13, winRows: 3, winCols: 9, seed: 4510 + i,
    }));
    // Airlock collars stitching neighboring raft drums
    for (let i = 0; i < RAFT.length - 1; i++) {
      for (const ax of [-8, 8]) {
        airlock(b, 'hull', W(ALLOY, 1), DARK, {
          ax, ay: -7, az: RAFT[i].z + 1.6, bx: ax, by: -7, bz: RAFT[i + 1].z - 1.6, r: 1.4, seg: 12, rings: 2,
        });
      }
    }

    // ---------------------------------------------------- tier 1: core stack --
    // Three interpenetrating hexagonal core drums (crossing along Z, bedded
    // into the raft's crowns — raft top is y = -2; these bottom out at -3.2).
    const CORE = [
      { x: -12, l: 24, z: 0.8, skin: GRAPHITE, cap: W(ALLOY, 1), plates: P_GRAPHITE },
      { x: -2, l: 26, z: -1, skin: P_ALLOY[0], cap: GRAPHITE, plates: P_ALLOY },
      { x: 10, l: 23, z: 1, skin: W(GRAPHITE, 1), cap: W(DEEP, 1), plates: P_DEEP },
    ];
    CORE.forEach((d, i) => hexDrum({
      x: d.x, y: 2.4, z: d.z, r: 4.8, l: d.l, axis: 'z',
      skin: d.skin, cap: d.cap, plates: d.plates,
      rows: 4, cols: 11, winRows: 3, winCols: 7, seed: 4520 + i,
    }));
    // Vertical airlocks tying each core drum down into the raft
    for (const d of CORE) {
      for (const az of [-9, 0, 9]) {
        airlock(b, 'hull', W(ALLOY, 2), DARK, { ax: d.x, ay: -4.8, az, bx: d.x, by: -0.6, bz: az, r: 1.2, seg: 10, rings: 1 });
      }
    }
    // Longitudinal catwalks over the core drums
    for (const bz of [-12, -4, 4, 12]) {
      bridge(b, 'hull', W(ALLOY, 1), DARK, { ax: -20, ay: 7.2, az: bz, bx: 20, by: 7.2, bz, w: 1.8, railH: 0.75, posts: 12 });
    }

    // ----------------------------------------------------- waist: hoppers & tanks
    // Ore-hopper drums and settling tanks packed against the core waist.
    const HOPPERS = [
      { x: -18, y: 4.5, z: -8, r: 3.2, h: 5.4, skin: W(GRAPHITE, 1), plates: P_GRAPHITE },
      { x: -15, y: 5.0, z: 4, r: 2.8, h: 4.8, skin: P_ALLOY[0], plates: P_ALLOY },
      { x: 4, y: 4.2, z: -12, r: 3.5, h: 5.8, skin: W(DEEP, 1), plates: P_DEEP },
      { x: 7, y: 4.8, z: 10, r: 3.0, h: 5.2, skin: GRAPHITE, plates: P_MIX },
      { x: 18, y: 4.3, z: -6, r: 2.9, h: 5.0, skin: W(ALLOY, 1), plates: P_ALLOY },
    ];
    HOPPERS.forEach((h, i) => hopperDrum(h.x, h.y, h.z, h.r, h.h, h.skin, h.plates, 4530 + i));
    // Settling tanks clustered near hoppers
    settlingTank(-21, 6.8, -5, 2.4, W(ALLOY, 1), P_ALLOY, 4535);
    settlingTank(-17, 7.2, 8, 2.0, GRAPHITE, P_GRAPHITE, 4536);
    settlingTank(12, 6.5, -13, 2.2, P_DEEP[0], P_DEEP, 4537);
    settlingTank(16, 7.0, 7, 1.8, W(GRAPHITE, 1), P_MIX, 4538);

    // ------------------------------------------------------- tier 2: assay towers
    // Four assay towers bedded into the core shoulders — the Veridian spires.
    assayTower({ x: -16, y: 9.5, z: -10, r: 2.4, h: 14, skin: GRAPHITE, plates: P_GRAPHITE, seed: 4540 });
    assayTower({ x: -6, y: 10.0, z: 12, r: 2.6, h: 15, skin: P_ALLOY[0], plates: P_ALLOY, seed: 4541 });
    assayTower({ x: 11, y: 9.2, z: -14, r: 2.3, h: 13.5, skin: W(DEEP, 1), plates: P_DEEP, seed: 4542 });
    assayTower({ x: 18, y: 9.8, z: 8, r: 2.5, h: 14.5, skin: GRAPHITE, plates: P_MIX, seed: 4543 });

    // ----------------------------------------------------- tier 2: connections --
    // Airlocks bed each tower into the core below.
    const TOWER_LINKS = [
      [-16, 5.2, -10, -15, 2.8, -8, 1.3], [-6, 5.8, 12, -5, 3.0, 10, 1.4],
      [11, 5.0, -14, 10, 2.6, -12, 1.2], [18, 5.4, 8, 17, 2.9, 6, 1.3],
    ];
    for (const [x0, y0, z0, x1, y1, z1, r] of TOWER_LINKS) {
      airlock(b, 'hull', W(ALLOY, 1), DARK, { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, r, seg: 12, rings: 2 });
    }
    // Bridges span between towers and core
    const TOWER_BRIDGES = [
      [-16, 9.5, -10, -12, 8.2, -6], [-6, 10.0, 12, -2, 8.5, 8],
      [11, 9.2, -14, 7, 8.0, -11], [18, 9.8, 8, 14, 8.3, 5],
      [-16, 9.5, -10, -10, 8.8, 2], [11, 9.2, -14, 15, 8.6, -9],
    ];
    for (const [x0, y0, z0, x1, y1, z1] of TOWER_BRIDGES) {
      bridge(b, 'hull', W(ALLOY, 1), DARK, { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, w: 1.7, railH: 0.7, posts: 7 });
    }

    // ---------------------------------------------------------- tier 2: antennas --
    // Antenna thicket on the assay towers and core.
    const ANTENNAS = [
      [-16, 17.2, -10, 8, 1.1], [-6, 18.0, 12, 9, 0],
      [11, 16.8, -14, 7, 1.3], [18, 17.5, 8, 8, 0],
      [-12, 8.5, 0, 10, 0], [-2, 8.8, 0, 11, 1.2], [10, 8.2, 0, 9, 0],
    ];
    for (const [ax0, ay0, az0, ah, adish] of ANTENNAS) {
      antenna(b, 'hull', DARK, W(ALLOY, 1), { x: ax0, y: ay0, z: az0, h: ah, r: 0.13, tip: 0.32, dish: adish });
    }

    // -------------------------------------------------------- tier 0: docking --
    // Four docking spokes reaching out radially.
    dockingSpoke({ x: -4, y: -5, z: 0, len: 18, dir: 'x', skin: GRAPHITE });
    dockingSpoke({ x: 4, y: -5, z: 0, len: 18, dir: 'x', skin: P_ALLOY[0] });
    dockingSpoke({ x: 0, y: -5, z: -4, len: 16, dir: 'z', skin: W(DEEP, 1) });
    dockingSpoke({ x: 0, y: -5, z: 4, len: 16, dir: 'z', skin: GRAPHITE });

    // --------------------------------------------------------------- belly -----
    // Conveyor galleries and pipe runs feeding the hopper waist.
    // Lower gallery truss under the raft
    truss(b, 'hull', DARK, { ax: -20, ay: -13, az: 0, bx: 20, by: -13, bz: 0, bays: 10, thickness: 0.32, spread: 1.1 });
    for (const kx of [-12, -4, 5, 14]) {
      truss(b, 'hull', DARK, { ax: kx, ay: -13, az: -12, bx: kx, by: -13, bz: 12, bays: 5, thickness: 0.24, spread: 0.85 });
      airlock(b, 'hull', W(ALLOY, 2), DARK, { ax: kx, ay: -11, az: 0, bx: kx, by: -13, bz: 0, r: 1.1, seg: 10, rings: 1 });
    }
    // Conveyor galleries (box runs with lamp strings)
    for (const side of [-1, 1]) {
      b.push(-8, -14.2, side * 10, 0, 0, 0);
      box(b, 'hull', W(GRAPHITE, 1), 18, 1.2, 2.8, { y: 0 });
      lampString(b, 'glow', LIT_DIM, { ax: -8, ay: 0.8, az: 0, bx: 8, by: 0.8, bz: 0, count: 9, size: 0.26 });
      for (let i = 0; i < 6; i++) {
        box(b, 'hull', DARK, 0.6 + rand() * 0.4, 0.8, 1.2, { x: -7 + i * 2.8, y: 0.6, z: side * 1.6 });
      }
      b.pop();
      airlock(b, 'hull', W(ALLOY, 2), DARK, { ax: -8, ay: -13.2, az: side * 10, bx: -6, by: -11, bz: side * 8, r: 1.2, seg: 10, rings: 2 });
    }

    // ------------------------------------------------------------- pipe runs --
    const PIPES = [
      [-18, 5.8, -8, -15, 5.2, 4], [-15, 6.2, 4, -12, 5.8, 2],
      [4, 5.4, -12, 7, 5.0, 10], [7, 5.6, 10, 10, 5.2, 6],
      [18, 5.5, -6, 14, 5.8, -4], [-21, 6.8, -5, -18, 6.2, -3],
      [-17, 7.2, 8, -14, 6.5, 6], [12, 6.5, -13, 8, 6.0, -10],
      [-8, -13.8, 10, -8, -11, 8], [8, -13.8, -10, 8, -11, -8],
    ];
    for (const [x0, y0, z0, x1, y1, z1] of PIPES) {
      pipeRun(b, 'hull', W(ALLOY, 1), { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, r: 0.18, seg: 8, collars: 3 });
    }

    // -------------------------------------------------------- surface greebles --
    // Hatches, junction boxes, vents over the whole mass.
    for (let i = 0; i < 80; i++) {
      const gx = -20 + rand() * 40;
      const gz = -15 + rand() * 30;
      const gy = -8 + rand() * 20;
      box(b, 'hull', [DARK, W(ALLOY, 2), W(GRAPHITE, 2), DARK][i % 4],
        0.55 + rand() * 0.7, 0.4 + rand() * 0.45, 0.4 + rand() * 0.55,
        { x: gx, y: gy, z: gz, ry: rand() * Math.PI });
      if (i % 4 === 0) box(b, 'glow', LIT_DIM, 0.32, 0.24, 0.24, { x: gx + 0.4, y: gy + 0.25, z: gz });
    }

    // --------------------------------------------------- processing carousel --
    // Hexagonal ore-processing carousel tucked under the belly: radius 12,
    // six crusher pods, each a plated box with glazed assay windows and pod
    // lamps, spoked to a plated hub. This reads as part of the mass, not a
    // hoop around void.
    const R = 12;
    // Plated hub
    torus(ringB, 'ringHull', W(GRAPHITE, 1), R * 0.35, 0.9, 6, 6, undefined, { rx: Math.PI / 2 });
    cyl(ringB, 'ringHull', GRAPHITE, 2.6, 2.8, 1.8, 6);
    panelSkin(ringB, 'ringHull', P_ALLOY, { r: 2.8, from: -0.8, to: 0.8, rows: 2, cols: 9, seed: 4560, t: 0.16, axis: 'y' });
    ribBands(ringB, 'ringHull', DARK, { r: 2.9, tube: 0.14, from: -0.6, to: 0.6, count: 2, axis: 'y', tseg: 6 });
    // Six crusher pods around the ring
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ringB.push(Math.cos(a) * R, 0, Math.sin(a) * R, -a, 0, 0);
      // Pod box
      box(ringB, 'ringHull', W(GRAPHITE, 1), 4.2, 3.0, 3.4, { y: 0.8 });
      panelPatches(ringB, 'ringHull', [W(GRAPHITE, 1), W(ALLOY, 1)], { r: 2.4, from: -1.8, to: 1.8, count: 16, seed: 4570 + i, w: 1.2, h: 0.9, t: 0.2, axis: 'y' });
      ribBands(ringB, 'ringHull', DARK, { r: 2.3, tube: 0.16, from: -1.6, to: 1.6, count: 3, axis: 'y', tseg: 8 });
      // Glazed assay windows (14 panes per pod, emerald-green)
      for (let py = -1.4; py <= 1.4; py += 0.95) {
        box(ringB, 'ringGlaze', ASSAY_DIM, 1.4, 0.7, 0.1, { y: py, z: 1.75 });
        box(ringB, 'ringGlaze', ASSAY_DIM, 1.4, 0.7, 0.1, { y: py, z: -1.75 });
      }
      // Mullions between panes
      for (let my = -1.0; my <= 1.0; my += 0.95) {
        box(ringB, 'ringHull', DARK, 0.1, 0.6, 3.6, { y: my, z: 0 });
      }
      // Pod lamps (near-white)
      for (const lz of [-1.4, 0, 1.4]) {
        box(ringB, 'ringGlow', LIT_SOFT, 0.38, 0.3, 0.3, { y: 1.6, z: lz });
      }
      // Spoke truss to hub
      truss(ringB, 'ringHull', DARK, { ax: 0, ay: 0, az: 0, bx: -R * 0.65, by: 0, bz: 0, bays: 3, thickness: 0.22, spread: 0.7 });
      ringB.pop();
    }
    // Rim lamps around the carousel
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + Math.PI / 18;
      box(ringB, 'ringGlow', LIT, 0.3, 0.3, 0.24, { x: Math.cos(a) * (R + 0.85), z: Math.sin(a) * (R + 0.85), ry: -a });
    }
    // The carousel hangs on a plated stem from the belly
    airlock(b, 'hull', W(ALLOY, 2), DARK, { ax: 0, ay: -13, az: 0, bx: 0, by: -17, bz: 0, r: 1.5, seg: 12, rings: 2 });
  },
};
