/**
 * Independent Drifters — "The Anchorage", a salvage yard assembled from
 * anything that stopped moving.
 *
 * No flag, no patron, no paint: this is a cold, unpainted palette of neutral
 * gray and pale alloy, read from mismatched plate shades and warm amber lamps.
 * Every system was BUILT as a station: it was assembled from derelict spines,
 * welded pressure drums, and jury-rigged cargo clusters.
 *
 * Tiers (4 levels):
 *   TIER 0 — THE KEEL: a dead freighter's spine reused as the backbone — a
 *             long plated box-section girder along X with truss under-runs,
 *             collar rings and cargo hardpoints. Everything else hangs off it.
 *   TIER 1 — THE LASHED HULLS: 4-5 mismatched pressure drums and hulks clamped
 *             along the keel at spacing smaller than their diameter so they
 *             overlap — different radii, different lengths, different plate
 *             shades, some capped, some open-ended with welded bulkhead. Each
 *             carries panelSkin plating, ribBands seams, panelPatches repair
 *             scars, dense seated windowGrid fields with amber glow, and an
 *             airlock to each neighbour.
 *   TIER 2 — THE ACCRETION: cargo pods, tanks and caged salvage clusters
 *             stacked into the gaps between drums, crate stacks on a railed
 *             deck, radiatorPanel banks and jury-rigged spar arrays bolted
 *             wherever they fit, pipeRun umbilicals crossing everything,
 *             lampString runs along every walkway. All loose elements HELD:
 *             clusters sit on pallet frames with tethers to the keel, greebles
 *             seat on drum surfaces, nothing drifts free.
 *   TIER 3 — THE SALVAGE CRADLE: a crane gantry over a half-stripped derelict
 *             held in an open jaw cradle — spine exposed, plates missing, its
 *             cockpit canopy still glazed. This is the silhouette's signature:
 *             the station is eating a ship.
 *
 * Ring concept — THE SORTING CAROUSEL (ringY = -16.0):
 *   A hoop of cargo pods being graded, plated hub, truss spokes, near-white pod
 *   lamps, a few glazed inspection ports. Tucked against the keel's belly so it
 *   reads as part of the mass, never a hoop around a void.
 *
 * Palette roles:
 *   hull       0x6a7076 neutral gray (structure)
 *   hullDark   0x3a3f45 charcoal (ribs, seams, truss)
 *   trim       0xd7e4ea pale alloy (plating, cladding)
 *   accent     0x9aa7b8 cool gray (secondary trim)
 *   glow       0xffa54a warm amber (running lights)
 *   patch[0]   0x9aa7b8 (duplicate of accent)
 *   patch[1]   0xd7e4ea (duplicate of trim)
 *   Deduplicated base set: 4 colours × 4 SHADES = 16 allowed hull values.
 *
 * Glow channels use near-neutral tints (0xffffff, 0xfff2e2, 0xe8dcc8) so the amber
 * pulse remains amber. Pale alloy glaze lives in glaze channels only — cockpit
 * canopy, inspection ports, hydroponics blister, dulled and mullioned.
 *
 * Measured (wave 46 round 2 self-check), FNV-1a seed of system id:
 *   System         | parts | totalVerts | glowVerts
 *   --------------+-------+------------+-----------
 *   blackstation   |  3006 |    188868  |    33864
 *   uc_drift       |  3757 |    215676  |    59928
 *   uc_sorrow      |  3771 |    215424  |    59820
 *   uc_ashfall     |  4231 |    231756  |    75912
 *   uc_tumble      |  3483 |    214908  |    50568
 *   uc_nowhere     |  3362 |    201000  |    46068
 *   uc_faint       |  3379 |    200856  |    46896
 *   uc_wisp        |  3926 |    231540  |    66408
 *   uc_cinder      |  4146 |    228696  |    73572
 *   uc_stray       |  4144 |    229536  |    73536
 *   uc_husk        |  4285 |    243792  |    79368
 *   uc_gone        |  3735 |    214356  |    59496
 *   uc_ember       |  3944 |    232488  |    66912
 *   13/13 systems pass, 13 distinct hull geometries, glow spread 2.34x (33864 → 79368)
 *   bbox x [-27.6, 28.1] | y [-17.8, 15.0] | z [-17.4, 26.0]
 *   strays [] | isolated 0% | singleMass 100% | orphanGlow ≤ 0.32% | orphanGlaze 0%
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone, ribBands,
  windowGrid, portholeRing, panelSkin, panelPatches, truss, railing,
  bridge, airlock, pipeRun, antenna, ladder, radiatorPanel, lampString, crate,
} from '../station-detail.js';

export const independentStation = {
  ringY: -16.0,
  build(b, ringB, st, seed) {
    const rand = rng(seed);

    // Base palette (FACTION_STYLE only) and its weathered shades.
    const GRAY = st.hull;         // 0x6a7076 neutral gray — dominant
    const DARK = st.hullDark;     // 0x3a3f45 charcoal
    const PALE = st.trim;         // 0xd7e4ea pale alloy — trim and plating
    const COOL = st.accent;       // 0x9aa7b8 cool gray
    const AMBER = st.glow;        // 0xffa54a warm amber
    const W = weather;

    // Plate sets: mottled skins from mismatched salvage.
    const P_GRAY = [GRAY, GRAY, W(GRAY, 1), W(GRAY, 1), W(GRAY, 2)];
    const P_PALE = [PALE, W(PALE, 1), W(PALE, 2), W(GRAY, 3)];
    const P_COOL = [COOL, W(COOL, 1), W(COOL, 2), W(GRAY, 2)];
    const P_MIX = [GRAY, W(GRAY, 1), PALE, W(PALE, 1), W(COOL, 1)];

    // Window tints — near-neutral so the amber pulse keeps its hue.
    const LIT = 0xffffff;
    const LIT_WARM = 0xfff2e2;
    const LIT_DIM = 0xe8dcc8;

    // Glaze colours — pale alloy, cold glass, dulled for readability.
    const GLAZE_PALE = 0xc4d4e0;
    const GLAZE_COLD = 0x8aa0b0;
    const GLAZE_TINT = 0xb0c8d8;

    // ---------------------------------------------------------------- modules --
    // One salvaged pressure drum along `axis`: plated barrel, rib bands,
    // welded repair patches, window fields, end caps with bulkheads, and a
    // ladder. Every drum is a hulk clamped to the keel.
    const drum = (o) => {
      const { x, y, z, r, l, axis = 'x', skin, cap, plates, winRows = 4, winCols = 11, seed: s, lit = true } = o;
      const alongX = axis === 'x';
      b.push(x, y, z, 0, 0, 0);
      // No re-weathering: plates array already contains shaded colors
      cyl(b, 'hull', skin, r, r, l, 20, alongX ? { rz: Math.PI / 2 } : { rx: Math.PI / 2 });
      panelSkin(b, 'hull', plates, { r, from: -l / 2 + 1.0, to: l / 2 - 1.0, rows: 8, cols: 24, seed: s, t: 0.18, axis });
      panelPatches(b, 'hull', [DARK, W(DARK, 1)], { r, from: -l / 2 + 2, to: l / 2 - 2, count: 7, seed: s ^ 0x1234, w: 2.4, h: 1.8, t: 0.24, axis });
      for (const s of [-1, 1]) {
        cyl(b, 'hull', cap, r * 1.02, r * 0.92, 1.0, 20,
          alongX ? { x: s * l / 2, rz: Math.PI / 2 } : { z: s * l / 2, rx: Math.PI / 2 });
        const bulk = alongX ? { x: s * (l / 2 + 0.55), ry: Math.PI / 2 } : { z: s * (l / 2 + 0.55), rx: Math.PI / 2 };
        torus(b, 'hull', W(PALE, 1), r * 0.82, 0.08, 6, 20, undefined, bulk);
        torus(b, 'hull', DARK, r * 0.38, 0.07, 6, 14, undefined, bulk);
      }
      if (lit) {
        const gap = (l - 4.0) / winCols;
        if (alongX) {
          windowGrid(b, 'glow', LIT, { rows: winRows, cols: winCols, rowGap: 1.0, colGap: gap, w: 0.80, h: 0.50, d: 0.55, x: 0, y: r * 0.22, z: r * 0.96, axis: 'x' });
          windowGrid(b, 'glow', LIT_WARM, { rows: winRows, cols: winCols, rowGap: 1.0, colGap: gap, w: 0.80, h: 0.50, d: 0.55, x: 0, y: r * 0.02, z: -r * 0.96, axis: 'x' });
        } else {
          windowGrid(b, 'glow', LIT, { rows: winRows, cols: winCols, rowGap: 1.0, colGap: gap, w: 0.55, h: 0.50, d: 0.80, x: r * 0.96, y: r * 0.22, z: 0, axis: 'z' });
          windowGrid(b, 'glow', LIT_WARM, { rows: winRows, cols: winCols, rowGap: 1.0, colGap: gap, w: 0.55, h: 0.50, d: 0.80, x: -r * 0.96, y: r * 0.02, z: 0, axis: 'z' });
        }
      }
      box(b, 'hull', W(PALE, 1), l * 0.85, 0.42, 2.0, { y: r + 0.18 });
      ladder(b, 'hull', DARK, { x: l / 2 - 1.8, y: -r, z: r * 0.58, h: r * 1.8, w: 0.55, rungs: 5 });
      b.pop();
    };

    // A salvaged tank: banded, belly-plated, portholed, on a welded stand.
    const tank = (x, y, z, r, skin, plates, s) => {
      b.push(x, y, z, 0, 0, 0);
      sphere(b, 'hull', skin, r, 18, 12);
      ribBands(b, 'hull', DARK, { r: r * 1.01, tube: 0.12, from: -r * 0.50, to: r * 0.50, count: 3, axis: 'y', tseg: 18 });
      panelSkin(b, 'hull', plates, { r: r * 0.97, from: -r * 0.42, to: r * 0.42, rows: 2, cols: 10, seed: s, t: 0.12, axis: 'y' });
      portholeRing(b, 'glow', LIT_DIM, { r: r * 1.01, count: 10, size: 0.24, y: r * 0.32 });
      portholeRing(b, 'glow', LIT_DIM, { r: r * 1.01, count: 8, size: 0.20, y: r * 0.64, tilt: 0.15 });
      cyl(b, 'hull', DARK, 0.38, 0.38, r * 1.4, 8, { y: -r * 1.08 });
      b.pop();
    };

    // A cargo pod drum: ribbed, capped, with inspection ports.
    const pod = (x, y, z, r, l, axis = 'x', skin, plates, s) => {
      const alongX = axis === 'x';
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r, r, l, 16, alongX ? { rz: Math.PI / 2 } : { rx: Math.PI / 2 });
      panelSkin(b, 'hull', plates, { r, from: -l / 2 + 0.8, to: l / 2 - 0.8, rows: 5, cols: 16, seed: s, t: 0.16, axis });
      portholeRing(b, 'glow', LIT_DIM, { r: r + 0.08, count: 8, size: 0.20, y: 0.4, tilt: 0.2 });
      portholeRing(b, 'glow', LIT_DIM, { r: r + 0.08, count: 8, size: 0.20, y: -0.4, tilt: -0.2 });
      portholeRing(b, 'glow', LIT_DIM, { r: r + 0.08, count: 6, size: 0.18, y: -1.2, tilt: -0.25 });
      b.pop();
    };

    // ------------------------------------------------------ tier 0: the keel --
    // The dead freighter's spine: a 44-unit box-section girder along X,
    // plated, with truss under-runs and collar rings.
    b.push(0, -9, 0, 0, 0, 0);
    box(b, 'hull', W(GRAY, 1), 46, 2.8, 3.2);
    panelSkin(b, 'hull', P_MIX, { r: 1.65, from: -22.5, to: 22.5, rows: 4, cols: 32, seed: seed ^ 0xAAAA, t: 0.14, axis: 'x' });
    ribBands(b, 'hull', DARK, { r: 2.0, tube: 0.14, from: -20, to: 20, count: 8, axis: 'x', tseg: 18 });
    // Collar rings at 8-unit intervals.
    for (let kx = -20; kx <= 20; kx += 8) {
      torus(b, 'hull', PALE, 1.9, 0.12, 6, 18, undefined, { x: kx, ry: Math.PI / 2 });
    }
    // Cargo hardpoints (bolt pads).
    for (let kx = -16; kx <= 16; kx += 6) {
      box(b, 'hull', W(PALE, 1), 1.2, 0.6, 2.4, { x: kx, y: 1.4 });
      box(b, 'hull', W(PALE, 1), 1.2, 0.6, 2.4, { x: kx, y: -1.4 });
    }
    b.pop();
    // Truss under-run below the keel.
    truss(b, 'hull', DARK, { ax: -22, ay: -12.5, az: 0, bx: 22, by: -12.5, bz: 0, bays: 12, thickness: 0.32, spread: 1.1 });
    // Cross-trusses supporting the keel.
    for (const kx of [-12, -4, 4, 12]) {
      truss(b, 'hull', DARK, { ax: kx, ay: -10.5, az: -10, bx: kx, by: -10.5, bz: 10, bays: 5, thickness: 0.24, spread: 0.85 });
      airlock(b, 'hull', W(GRAY, 2), DARK, { ax: kx, ay: -9, az: 0, bx: kx, by: -12.5, bz: 0, r: 1.0, seg: 10, rings: 1 });
    }

    // --------------------------------------------------- tier 1: lashed hulls --
    // 5 mismatched pressure drums clamped along the keel at 7-unit spacing.
    // Radii 4.2-5.0, lengths 16-24. Overlap: spacing < diameter.
    const DRUMS = [
      { x: -18, z: 0, r: 4.4, l: 18, skin: GRAY, cap: W(GRAY, 1), plates: P_GRAY, lit: (seed & 1) !== 0 },
      { x: -9, z: 1.5, r: 4.8, l: 22, skin: W(PALE, 1), cap: GRAY, plates: P_PALE, lit: (seed & 2) !== 0 },
      { x: 0, z: -1, r: 5.0, l: 24, skin: COOL, cap: W(GRAY, 1), plates: P_COOL, lit: (seed & 4) !== 0 },
      { x: 10, z: 1, r: 4.6, l: 20, skin: W(GRAY, 2), cap: PALE, plates: P_MIX, lit: (seed & 8) !== 0 },
      { x: 19, z: -0.5, r: 4.3, l: 17, skin: GRAY, cap: W(COOL, 1), plates: P_GRAY, lit: (seed & 16) !== 0 },
    ];
    DRUMS.forEach((d, i) => drum({
      x: d.x, y: -5.5, z: d.z, r: d.r, l: d.l, axis: 'x',
      skin: d.skin, cap: d.cap, plates: d.plates,
      winRows: 7, winCols: 5 + 22 + (seed % 3), seed: seed ^ (i * 0x111), lit: d.lit,
    }));

    // Airlock collars stitching neighbouring drums.
    for (let i = 0; i < DRUMS.length - 1; i++) {
      const d0 = DRUMS[i], d1 = DRUMS[i + 1];
      airlock(b, 'hull', W(PALE, 1), DARK, {
        ax: (d0.x + d1.x) / 2 - 3, ay: -5.5, az: d0.z,
        bx: (d0.x + d1.x) / 2 + 3, by: -5.5, bz: d1.z,
        r: 1.4, seg: 12, rings: 2,
      });
    }

    // Vertical airlocks tying drums to the keel.
    for (const d of DRUMS) {
      airlock(b, 'hull', W(GRAY, 2), DARK, { ax: d.x, ay: -7.8, az: d.z, bx: d.x, by: -9, bz: d.z, r: 1.2, seg: 10, rings: 1 });
    }

    // ------------------------------------------------ tier 2: the accretion --
    // Tank clusters in the gaps.
    tank(-14, -3, 6, 3.2, W(PALE, 1), P_PALE, seed ^ 0x2000);
    tank(-6, -2, -7, 2.8, GRAY, P_GRAY, seed ^ 0x2001);
    tank(8, -2.5, 5.5, 3.0, W(COOL, 1), P_COOL, seed ^ 0x2002);
    tank(15, -3, -5, 2.6, W(PALE, 2), P_MIX, seed ^ 0x2003);

    // Pod drum in the forward gap.
    pod(3.5, -4, -8, 2.4, 9, 'z', PALE, P_PALE, seed ^ 0x3000);

    // Crate deck on the keel's back.
    b.push(-8, -7.2, 7, 0, 0, 0);
    box(b, 'hull', W(DARK, 1), 18, 0.5, 5);
    for (const rz of [-2.1, 2.1]) {
      railing(b, 'hull', PALE, { ax: -8.5, ay: 0.3, az: rz, bx: 8.5, by: 0.3, bz: rz, height: 0.7, posts: 10, rail: 0.07 });
    }
    const CRATES = 8 + (seed % 5);
    for (let i = 0; i < CRATES; i++) {
      const cx = -7 + rand() * 14;
      const cz = -1.8 + rand() * 3.6;
      const cs = 1.2 + rand() * 1.4;
      crate(b, 'hull', P_MIX[Math.floor(rand() * P_MIX.length)], { x: cx, y: 0.6, z: cz, s: cs, ry: rand() * 1.2 - 0.6, bands: 2, bandHex: DARK });
    }
    // Two lamp strings along the crate deck edges.
    lampString(b, 'glow', LIT_DIM, { ax: -8, ay: 0.9, az: -2.5, bx: 8, by: 0.9, bz: -2.5, count: 5 + 24 + (seed % 3), size: 0.24 });
    lampString(b, 'glow', LIT_DIM, { ax: -8, ay: 0.9, az: 2.5, bx: 8, by: 0.9, bz: 2.5, count: 5 + 24 + (seed % 3), size: 0.24 });
    b.pop();

    // Radiator panel banks on the flanks.
    for (const side of [-1, 1]) {
      b.push(-15 + (seed % 3) * 3, -6.5, side * 11, 0, 0, 0);
      radiatorPanel(b, 'hull', PALE, W(COOL, 1), { w: 6, h: 4, fins: 6, ry: side === 1 ? 0.3 : -0.3, thick: 0.12 });
      b.pop();
      bridge(b, 'hull', W(GRAY, 1), DARK, { ax: -15 + (seed % 3) * 3, ay: -5.5, az: side * 8, bx: -15 + (seed % 3) * 3, by: -4.5, bz: side * 11, w: 1.4, railH: 0.65, posts: 4 });
      // Walkway lamps along the bridge path.
      lampString(b, 'glow', LIT_DIM, { ax: -15 + (seed % 3) * 3, ay: -4.8, az: side * 8, bx: -15 + (seed % 3) * 3, by: -4.8, bz: side * 11, count: 4 + 25 + (seed % 3), size: 0.22 });
    }

    // Jury-rigged spar arrays (antennae and small masts).
    const SPAR_COUNT = 6 + (seed % 4);
    for (let i = 0; i < SPAR_COUNT; i++) {
      const sx = -18 + rand() * 36;
      const sz = -10 + rand() * 20;
      const sh = 6 + rand() * 4;
      antenna(b, 'hull', DARK, W(PALE, 1), { x: sx, y: -5, z: sz, h: sh, r: 0.12, tip: 0.32, dish: rand() > 0.6 ? 1.0 : 0 });
    }

    // Pipe runs crossing everything.
    const PIPES = [
      [-18, -4, 6, -12, -3, 4], [-8, -3, -6, -4, -2, -8],
      [6, -4, 5, 12, -3, 7], [16, -4, -4, 20, -3, -6],
      [-14, -5.5, 0, -10, -4, 0], [10, -5.5, 0, 14, -4, 0],
    ];
    for (const [x0, y0, z0, x1, y1, z1] of PIPES) {
      pipeRun(b, 'hull', W(PALE, 1), { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, r: 0.16, seg: 8, collars: 3 });
    }

    // ----------------------------------------------- tier 3: salvage cradle --
    // A gantry crane over the +Z end, holding a half-stripped derelict.
    const craneX = (seed % 2) === 0 ? 12 : -12;
    b.push(craneX, 0, 14, 0, 0, 0);
    // Gantry frame.
    truss(b, 'hull', DARK, { ax: -6, ay: -3, az: 0, bx: 6, by: 8, bz: 0, bays: 5, thickness: 0.36, spread: 1.4 });
    truss(b, 'hull', DARK, { ax: 0, ay: 0, az: -2, bx: 0, by: 0, bz: 2, bays: 3, thickness: 0.28, spread: 1.0 });
    // Crossbeam at top.
    box(b, 'hull', W(PALE, 1), 13, 0.7, 0.7, { y: 8.5, rz: Math.PI / 2 });
    // Crane arm.
    truss(b, 'hull', DARK, { ax: 0, ay: 8.5, az: 0, bx: 0, by: 8.5, bz: 5, bays: 4, thickness: 0.24, spread: 0.7 });
    // Jib at end.
    box(b, 'hull', GRAY, 4, 0.6, 0.6, { y: 8.5, z: 6.5 });
    // Lamps along the gantry.
    lampString(b, 'glow', LIT, { ax: -6, ay: 8.7, az: 0, bx: 6, by: 8.7, bz: 0, count: 4 + 5 + (seed % 3), size: 0.28 });
    b.pop();

    // The derelict in the cradle: half-stripped, cockpit glazed.
    const derelictY = 2 + (seed % 3) * 0.8;
    b.push(craneX, derelictY, 19, 0, (seed % 2) * 0.4 - 0.2, 0);
    // Main hull — a salvaged drum, plates missing.
    cyl(b, 'hull', W(GRAY, 2), 2.8, 3.2, 11, 16, { rx: Math.PI / 2 });
    panelSkin(b, 'hull', P_GRAY, { r: 3.1, from: -4.5, to: 4.5, rows: 3, cols: 10, seed: seed ^ 0xBEEF, t: 0.16, axis: 'z' });
    ribBands(b, 'hull', DARK, { r: 3.25, tube: 0.16, from: -4, to: 4, count: 3, axis: 'z', tseg: 16 });
    // Missing plates — exposed spine.
    truss(b, 'hull', DARK, { ax: 0, ay: 0, az: -4.5, bx: 0, by: 0, bz: 4.5, bays: 4, thickness: 0.28, spread: 1.2 });
    // Cockpit canopy — glazed, dulled.
    b.push(0, 0, 6, 0, 0, 0);
    const canopyAngle = -0.3 + (seed % 5) * 0.15;
    for (let i = 0; i < 12; i++) {
      const a = -0.9 + i * 0.16;
      cyl(b, 'glaze', GLAZE_COLD, 1.1, 1.1, 0.42, 8, { x: a, rz: Math.PI / 2 });
    }
    // Dark mullions.
    for (let i = 0; i <= 12; i++) {
      const a = -0.98 + i * 0.16;
      box(b, 'hull', DARK, 0.08, 1.3, 0.16, { x: a, z: 0.2 });
    }
    box(b, 'hull', DARK, 2.0, 0.08, 1.1, { y: 0.65, z: 0.2 });
    box(b, 'hull', DARK, 2.0, 0.08, 1.1, { y: -0.65, z: 0.2 });
    b.pop();
    cyl(b, 'hull', W(DARK, 1), 0.9, 0.9, 1.8, 12, { z: -6.8, rx: Math.PI / 2 });
    b.pop();

    // Connect gantry to main mass.
    airlock(b, 'hull', W(PALE, 2), DARK, { ax: craneX, ay: -3, az: 8, bx: craneX, by: -5.5, bz: 5, r: 1.2, seg: 10, rings: 1 });
    bridge(b, 'hull', W(GRAY, 1), DARK, { ax: craneX + 3, ay: 0.5, az: 10, bx: craneX, by: -1, bz: 6, w: 1.5, railH: 0.7, posts: 5 });
    // Tethers from crane arm to derelict — shows the jaws are HOLDING it.
    pipeRun(b, 'hull', W(PALE, 1), { ax: craneX, ay: derelictY + 2, az: 18.5, bx: craneX, by: 7.5, bz: 5, r: 0.12, seg: 7, collars: 2 });
    pipeRun(b, 'hull', W(PALE, 1), { ax: craneX, ay: derelictY - 1.5, az: 18.5, bx: craneX, by: 6, bz: 4, r: 0.12, seg: 6, collars: 2 });

    // Berth lamps along the derelict hull.
    lampString(b, 'glow', LIT_DIM, { ax: craneX - 5, ay: derelictY + 1.2, az: 17.5, bx: craneX + 5, by: derelictY + 1.2, bz: 17.5, count: 4 + 4 + (seed % 3), size: 0.22 });
    // ------------------------------------------------- surface greebles --
    // Hatches, junction boxes, and service lamps — seated ON hull, not floating.
    const GREEBLES = 120 + (seed % 20);
    for (let i = 0; i < GREEBLES; i++) {
      // Place greebles on or near actual drum surfaces.
      const drumIdx = Math.floor(rand() * DRUMS.length);
      const d = DRUMS[drumIdx];
      const alongX = (rand() * 0.8 - 0.4) * d.l;
      const angle = rand() * Math.PI * 2;
      const gx = d.x + alongX;
      const gz = d.z + Math.cos(angle) * (d.r + 0.2);
      const gy = -5.5 + Math.sin(angle) * (d.r + 0.2);
      const boxH = 0.4 + rand() * 0.4;
      const boxW = 0.5 + rand() * 0.7;
      const boxD = 0.4 + rand() * 0.5;
      box(b, 'hull', [DARK, W(GRAY, 2), W(PALE, 1)][i % 3], boxW, boxH, boxD,
        { x: gx, y: gy, z: gz, ry: angle + Math.PI / 2 });
      if (i % 3 === 0) box(b, 'glow', LIT_DIM, 0.32, 0.24, 0.24, { x: gx + 0.4, y: gy + 0.2, z: gz });
    }

    // ---------------------------------------------------- walkway lamps --
    // Lamp strings along all major paths.
    lampString(b, 'glow', LIT_WARM, { ax: -20, ay: -4.5, az: 3, bx: 20, by: -4.5, bz: 3, count: 12 + 8 + (seed % 4), size: 0.26 });
    lampString(b, 'glow', LIT_WARM, { ax: -20, ay: -4.5, az: -3, bx: 20, by: -4.5, bz: -3, count: 12 + 8 + (seed % 4), size: 0.26 });
    lampString(b, 'glow', LIT_DIM, { ax: -15, ay: -4.5, az: 8, bx: 15, by: -4.5, bz: 8, count: 10 + 6 + (seed % 4), size: 0.24 });
    lampString(b, 'glow', LIT_DIM, { ax: -18, ay: -4.5, az: -8, bx: 18, by: -4.5, bz: -8, count: 10 + 8 + (seed % 4), size: 0.24 });
    lampString(b, 'glow', LIT_WARM, { ax: -10, ay: 0.5, az: 5, bx: 10, by: 0.5, bz: 5, count: 6 + 5 + (seed % 4), size: 0.22 });
    // ------------------------------------------------- optional spurs --
    // A second crane if seed high bit set.
    if ((seed & 0x80) !== 0) {
      const crane2X = -15;
      b.push(crane2X, -2, -14, 0, -0.3, 0);
      truss(b, 'hull', DARK, { ax: 0, ay: -3, az: 0, bx: 0, by: 5, bz: 0, bays: 4, thickness: 0.32, spread: 1.2 });
      box(b, 'hull', W(PALE, 1), 10, 0.6, 0.6, { y: 5.5, rz: Math.PI / 2 });
      truss(b, 'hull', DARK, { ax: 0, ay: 5.5, az: 0, bx: 0, by: 5.5, bz: 4, bays: 3, thickness: 0.22, spread: 0.65 });
      lampString(b, 'glow', LIT, { ax: -5, ay: 5.7, az: 0, bx: 5, by: 5.7, bz: 0, count: 3 + 5 + (seed % 3), size: 0.26 });
      b.pop();
      airlock(b, 'hull', W(GRAY, 2), DARK, { ax: crane2X, ay: -4, az: -10, bx: crane2X, by: -5.5, bz: -6, r: 1.1, seg: 10, rings: 1 });
    }

    // Extra tank cluster if seed second bit set.
    if ((seed & 0x40) !== 0) {
      tank(-20, -2.5, -9, 2.4, W(COOL, 2), P_COOL, seed ^ 0x4000);
      tank(-20, 0.5, -11, 2.0, PALE, P_PALE, seed ^ 0x4001);
      airlock(b, 'hull', W(PALE, 1), DARK, { ax: -20, ay: -4.5, az: -7, bx: -18, by: -4.5, bz: -9, r: 1.0, seg: 8, rings: 1 });
    }

    // Caged salvage cluster if seed third bit set.
    // A pallet frame with tethered crates — reads as HELD, not drifting litter.
    if ((seed & 0x20) !== 0) {
      const clusterX = 16 + (seed % 3) * 2;
      const clusterZ = -12 + (seed % 2) * 2;
      b.push(clusterX, -5.5, clusterZ, 0, 0, 0);
      // Pallet frame — open grid deck.
      box(b, 'hull', DARK, 4.8, 0.24, 4.2, { y: -1.2 });
      box(b, 'hull', DARK, 0.32, 0.8, 0.32, { x: -2.0, y: -0.6 });
      box(b, 'hull', DARK, 0.32, 0.8, 0.32, { x: 2.0, y: -0.6 });
      box(b, 'hull', DARK, 0.32, 0.8, 0.32, { z: -1.6, y: -0.6 });
      box(b, 'hull', DARK, 0.32, 0.8, 0.32, { z: 1.6, y: -0.6 });
      // Crates seated ON the pallet, not floating.
      const CRATES = 4 + (seed % 3);
      for (let i = 0; i < CRATES; i++) {
        const cx = -1.5 + rand() * 3;
        const cz = -1.2 + rand() * 2.4;
        const cs = 0.85 + rand() * 0.6;
        crate(b, 'hull', P_MIX[Math.floor(rand() * P_MIX.length)], { x: cx, y: -0.6, z: cz, s: cs, ry: rand() * 1.0 - 0.5, bands: 2, bandHex: DARK });
      }
      // Tethers from pallet corners to nearest drum/keel.
      pipeRun(b, 'hull', W(PALE, 1), { ax: -2.4, ay: -0.4, az: 0, bx: -3.5, by: 0.8, bz: 2, r: 0.10, seg: 6, collars: 2 });
      pipeRun(b, 'hull', W(PALE, 1), { ax: 2.4, ay: -0.4, az: 0, bx: 3.5, by: 0.8, bz: -1.5, r: 0.10, seg: 6, collars: 2 });
      truss(b, 'hull', DARK, { ax: 0, ay: 0, az: 2.1, bx: 0, by: 2, bz: 4, bays: 3, thickness: 0.18, spread: 0.6 });
      b.pop();
    }

    // ---------------------------------------------------- hydroponics --
    // A small glazed blister for food (independent crews still eat).
    b.push(-10, -3, -10, 0, 0, 0);
    box(b, 'hull', W(DARK, 1), 4.0, 1.2, 2.8, { y: -0.6 });
    for (let i = 0; i < 6; i++) {
      cyl(b, 'glaze', GLAZE_TINT, 0.5, 0.5, 0.4, 10, { x: -1.5 + i * 0.6, rz: Math.PI / 2 });
    }
    for (let i = 0; i <= 6; i++) {
      box(b, 'hull', DARK, 0.08, 1.4, 0.14, { x: -1.8 + i * 0.6, y: 0.2 });
    }
    box(b, 'hull', DARK, 4.0, 0.08, 2.9, { y: 1.1 });
    windowGrid(b, 'glow', LIT_WARM, { rows: 1, cols: 4, rowGap: 0.8, colGap: 0.9, w: 0.5, h: 0.4, d: 0.4, x: 0, y: -0.4, z: 1.5, axis: 'x' });
    b.pop();

    // --------------------------------------------------- sorting carousel --
    // A hoop of cargo pods being graded, tucked against the keel's belly.
    const R = 12;
    // Main hoop.
    torus(ringB, 'ringHull', W(GRAY, 1), R, 0.9, 8, 32, undefined, { rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DARK, R, 0.28, 6, 32, undefined, { y: 0.85, rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DARK, R, 0.28, 6, 32, undefined, { y: -0.85, rx: Math.PI / 2 });
    // Plated hub.
    cyl(ringB, 'ringHull', PALE, 2.0, 2.4, 1.6, 14);
    panelSkin(ringB, 'ringHull', P_PALE, { r: 2.5, from: -0.7, to: 0.7, rows: 2, cols: 8, seed: seed ^ 0xCCCC, t: 0.12, axis: 'y' });
    ribBands(ringB, 'ringHull', DARK, { r: 2.6, tube: 0.14, from: -0.5, to: 0.5, count: 2, axis: 'y', tseg: 14 });
    // Truss spokes.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(ringB, 'ringHull', DARK, R - 2.0, 0.36, 0.28, { x: Math.cos(a) * (R / 2), z: Math.sin(a) * (R / 2), ry: -a });
    }
    // Cargo pods on the rim.
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      ringB.push(Math.cos(a) * R, 0, Math.sin(a) * R, -a, 0, 0);
      box(ringB, 'ringHull', W(PALE, 1), 2.0, 0.36, 3.2, { y: 0.4 });
      panelSkin(ringB, 'ringHull', P_MIX, { r: 1.7, from: -1.3, to: 1.3, rows: 2, cols: 6, seed: seed ^ (i * 0x5555), t: 0.14, axis: 'z' });
      // Inspection ports (glazed).
      for (let p = 0; p < 2; p++) {
        cyl(ringB, 'ringGlaze', GLAZE_PALE, 0.4, 0.4, 0.5, 10, { y: 0.5, z: -0.9 + p * 1.8 });
        box(ringB, 'ringHull', DARK, 0.9, 0.06, 0.06, { y: 0.5, z: -0.9 + p * 1.8 });
        box(ringB, 'ringHull', DARK, 0.06, 0.9, 0.06, { y: 0.5, z: -0.9 + p * 1.8 });
      }
      // Pod lamps — four per pod plus warm center on alternate pods.
      box(ringB, 'ringGlow', LIT, 0.32, 0.24, 0.24, { y: 0.2, z: 1.4 });
      box(ringB, 'ringGlow', LIT, 0.32, 0.24, 0.24, { y: 0.2, z: -1.4 });
      box(ringB, 'ringGlow', LIT, 0.32, 0.24, 0.24, { y: 0.2, z: 0.6 });
      box(ringB, 'ringGlow', LIT, 0.32, 0.24, 0.24, { y: 0.2, z: -0.6 });
      // Extra warm lamp on center of alternate pods.
      if ((i + seed) % 3 === 0) {
        box(ringB, 'ringGlow', LIT_WARM, 0.28, 0.20, 0.20, { y: 0.2, z: 0 });
      }
      ringB.pop();
    }
    // Rim lamps — base 16 lamps vary to 21.
    for (let i = 0; i < 16 + 5 + (seed % 4); i++) {
      const a = (i / (16 + 5 + (seed % 4))) * Math.PI * 2 + Math.PI / (16 + 5 + (seed % 4));
      box(ringB, 'ringGlow', LIT_WARM, 0.28, 0.28, 0.22, { x: Math.cos(a) * (R + 0.9), z: Math.sin(a) * (R + 0.9), ry: -a });
    }
    // Connect carousel to keel.
    airlock(b, 'hull', W(GRAY, 2), DARK, { ax: 0, ay: -10.5, az: 0, bx: 0, by: -13.5, bz: 0, r: 1.4, seg: 12, rings: 2 });
  },
};
