/**
 * Red Ledger — "The Bookkeeper", a captured industrial refinery turned toll
 * house and tribute vault. Organised piracy with accountant precision.
 *
 * Reference art: docs/FactionExamples/04-red-ledger-station.png.
 *
 * Sculpt tiers:
 *   TIER 0 — The massive 12-sided REFINERY DRUM (r 8.5, l 38, axis X): copper-
 *             banded, iron-hulled, dense panelSkin plate grid, welded trophy-
 *             patch scars, four windowGrid faces, roof truss spine.
 *   TIER 1 — TRIBUTE VAULT sphere (r 5.2) chained beneath the belly; three
 *             overlapping CROSS DRUMS (axis Z) flanking the core; prize-cargo
 *             stack clusters clamped to both flanks.
 *   TIER 2 — TOLL GANTRY (plated box-section arm, world x 14–25): spine,
 *             collar rings, under-truss, cabin, boarding claw, lamp strings;
 *             three REFINERY TOWERS rising from the drum crown;
 *             CRACKING COLUMN with sight-glass glaze; six FLARE STACKS.
 *   TIER 3 — Beacon mast (y 19.5), antenna thicket, surface greeble scatter.
 *
 * Ring: the TALLY COLLAR — a copper hoop (R 11, ringY −13) packed against the
 *       vault belly, hung with trophy hull plates, near-white tally lamps, and
 *       six spokes to a plated hub; four fixed diagonal braces anchor it to the
 *       vault sphere at r 4.5–9.5.
 *
 * Seed base: 4503 for all rng() and panelSkin seed arguments.
 *
 * Measured: parts 2219, totalVerts 165264, glowVerts 30828,
 *   bbox x −19.9 25.1 | y −19.6 26.8 | z −14.8 19.8, isolated 0.00%.
 */

import {
  rng, weather, box, cyl, sphere, torus, cone, ribBands,
  windowGrid, portholeRing, panelSkin, panelPatches, truss, railing,
  bridge, airlock, pipeRun, antenna, ladder, lampString,
} from '../station-detail.js';

export const redledgerStation = {
  ringY: -13.0,
  build(b, ringB, st) {
    const rand = rng(4503);

    // ── Base palette (FACTION_STYLE only) ─────────────────────────────────────
    const IRON   = st.hull;       // 0x2c2118 dark iron — dominant hull
    const DARK   = st.hullDark;   // 0x181210 shadow iron — ribs, seams, shadow
    const COPPER = st.trim;       // 0x946445 tarnished copper — bands, trim
    const BLOOD  = st.accent;     // 0x7e2a20 dried blood — vault skin, claw
    const GREY   = st.patch[2];   // 0x3a3a3c scavenged neutral plate
    const W = weather;

    // Plate palette arrays — every entry from a BASE FACTION_STYLE colour only.
    const P_IRON = [IRON, IRON, W(IRON,1), W(IRON,1), W(IRON,2)];
    const P_COP  = [COPPER, W(COPPER,1), W(COPPER,2), W(IRON,1)];
    const P_SCAV = [IRON, GREY, W(COPPER,1), W(BLOOD,1), W(IRON,2)];
    const P_MIX  = [IRON, COPPER, W(COPPER,1), GREY, W(BLOOD,1)];

    // Glow neutrals (all channels >= 153/255 = 0.6).
    const LIT      = 0xffffff;   // pure white
    const LIT_WARM = 0xfff2e2;   // warm near-white (R 1.0, G 0.949, B 0.886)
    const LIT_DIM  = 0xe8dcc8;   // cool near-white (R 0.910, G 0.863, B 0.784)

    // Glaze colours — unlit channel, any colour acceptable.
    const RFGLASS = 0x8b5a2b;  // dulled amber refinery sight glass
    const VTGLASS = 0x6b4423;  // vault cold inspection glass

    // ── helpers ───────────────────────────────────────────────────────────────

    // 12-sided refinery drum, axis X.
    const rfDrum = ({ x, y, z, r, l, skin, plates, rows=7, cols=18,
      winRows=5, winCols=18, seed }) => {
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r, r, l, 12, { rz: Math.PI/2 });
      ribBands(b, 'hull', COPPER, { r: r+0.22, tube:0.25,
        from: -l/2+2.5, to: l/2-2.5, count:6, axis:'x', tseg:12 });
      panelSkin(b, 'hull', plates,
        { r, from: -l/2+1.5, to: l/2-1.5, rows, cols, seed, t:0.22, axis:'x' });
      panelPatches(b, 'hull', P_SCAV,
        { r, from: -l/2+3, to: l/2-3, count:10, seed: seed+100,
          w:2.5, h:1.9, t:0.26, axis:'x' });
      // End caps with bolt rings
      for (const s of [-1, 1]) {
        cyl(b, 'hull', W(IRON,1), r*0.92, r*0.86, 1.4, 12,
          { x: s*(l/2+0.2), rz: Math.PI/2 });
        torus(b, 'hull', COPPER, r*0.82, 0.15, 6, 12, undefined,
          { x: s*(l/2+0.3), ry: Math.PI/2 });
        torus(b, 'hull', DARK, r*0.68, 0.12, 6, 12, undefined,
          { x: s*(l/2+0.1), ry: Math.PI/2 });
      }
      // Four windowGrid faces — seated on flat facet apothems (12-sided drum, axis X after rz=π/2)
      // rFlat = r·cos(π/12): the flat face sits here, not at r.  H_y ≤ r·sin(π/12)=2.20 for all grids.
      const rFlat = r * Math.cos(Math.PI / 12);
      const gap = (l-4)/winCols;
      // +Z face (0°): rows spread in Y, axis:'x'
      windowGrid(b, 'glow', LIT_WARM,
        { rows:winRows, cols:winCols, rowGap:0.88, colGap:gap,
          w:0.88, h:0.56, d:0.65, x:0, y:0, z: rFlat, axis:'x' });
      // −Z face (180°): rows spread in Y
      windowGrid(b, 'glow', LIT_DIM,
        { rows:winRows, cols:winCols, rowGap:0.92, colGap:gap,
          w:0.88, h:0.56, d:0.65, x:0, y:0, z:-rFlat, axis:'x' });
      // +Y face (90°): rows spread in Z — use axis:'y' so cols→X, rows→Z
      windowGrid(b, 'glow', LIT,
        { rows:3, cols:winCols, rowGap:1.05, colGap:gap,
          w:0.88, h:0.62, d:0.65, x:0, y: rFlat, z:0, axis:'y' });
      // −Y face (270°): rows spread in Z
      windowGrid(b, 'glow', LIT_DIM,
        { rows:3, cols:winCols-2, rowGap:1.05, colGap:gap,
          w:0.85, h:0.56, d:0.65, x:0, y:-rFlat, z:0, axis:'y' });
      // Roof spine
      box(b, 'hull', W(IRON,1), l*0.88, 0.65, 2.85, { y:r+0.32 });
      truss(b, 'hull', DARK,
        { ax:-l/2+2.5, ay:r+0.72, az:0, bx:l/2-2.5, by:r+0.72, bz:0,
          bays:9, thickness:0.26, spread:1.15 });
      ladder(b, 'hull', DARK,
        { x:l/2-2.5, y:-r, z:r*0.65, h:r*2.1, w:0.58, rungs:7 });
      b.pop();
    };

    // 12-sided cross drum, axis Z.
    const csDrum = ({ x, y, z, r, l, skin, plates, rows=5, cols=12,
      winRows=4, winCols=10, seed }) => {
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r, r, l, 12, { rx: Math.PI/2 });
      ribBands(b, 'hull', COPPER,
        { r:r+0.17, tube:0.2, from:-l/2+2, to:l/2-2, count:5, axis:'z', tseg:12 });
      panelSkin(b, 'hull', plates,
        { r, from:-l/2+1.2, to:l/2-1.2, rows, cols, seed, t:0.2, axis:'z' });
      panelPatches(b, 'hull', P_SCAV,
        { r, from:-l/2+2, to:l/2-2, count:6, seed:seed+50,
          w:2.0, h:1.6, t:0.22, axis:'z' });
      for (const s of [-1, 1]) {
        cyl(b, 'hull', W(IRON,1), r*0.92, r*0.86, 1.2, 12,
          { z:s*(l/2+0.2), rx: Math.PI/2 });
        torus(b, 'hull', COPPER, r*0.82, 0.13, 6, 12, undefined,
          { z:s*(l/2+0.3) });
        torus(b, 'hull', DARK, r*0.68, 0.11, 6, 12, undefined,
          { z:s*(l/2+0.1) });
      }
      const gap = (l-4)/winCols;
      // Z-axis drum (rx=π/2): cross-section in XY-plane; +X face apothem at rfzC.
      // axis:'z' in windowGrid maps cols→X (radial for Z-drum) which created the
      // floating slab. Replace with direct box calls: cols along Z (drum axis),
      // rows in Y within H ≤ r·sin(π/12) face halfwidth.
      const rfzC = r * Math.cos(Math.PI / 12);
      for (let ci = 0; ci < winCols; ci++) {
        const zi = -l/2 + 2 + (ci + 0.5) * gap;
        // 3 rows: H_y_max = 0.35+0.26=0.61 < r·sin(π/12) for all cross drums (0.67 min)
        for (const yi of [-0.35, 0, 0.35]) {
          box(b, 'glow', LIT_WARM, 0.48, 0.52, gap * 0.60, { x: rfzC, y: yi, z: zi });
          box(b, 'glow', LIT_DIM,  0.48, 0.52, gap * 0.60, { x:-rfzC, y: yi, z: zi });
        }
      }
      ladder(b, 'hull', DARK,
        { x:r*0.68, y:-r, z:l/2-2.5, h:r*2.0, w:0.55, rungs:6, ry:Math.PI/2 });
      b.pop();
    };

    // ── tier 0: core refinery drum ───────────────────────────────────────────
    rfDrum({ x:0, y:2, z:0, r:8.5, l:38, skin:IRON, plates:P_IRON,
      rows:8, cols:20, winRows:5, winCols:18, seed:4510 });

    // ── tier 1: tribute vault & cargo ────────────────────────────────────────
    // Tribute vault sphere, banded and chained beneath the belly.
    b.push(0, -10.5, 0, 0, 0, 0);
    sphere(b, 'hull', BLOOD, 5.2, 16, 12);
    ribBands(b, 'hull', COPPER,
      { r:5.2*1.02, tube:0.2, from:-5.2*0.6, to:5.2*0.6, count:4, axis:'y', tseg:16 });
    panelSkin(b, 'hull', P_COP,
      { r:5.2*0.96, from:-5.2*0.5, to:5.2*0.5, rows:3, cols:12, seed:4520, t:0.16, axis:'y' });
    portholeRing(b, 'glow', LIT_WARM,
      { r:5.2*1.01, count:18, size:0.32, y: 5.2*0.55 });
    portholeRing(b, 'glow', LIT_DIM,
      { r:5.2*1.01, count:16, size:0.28, y: 0 });
    portholeRing(b, 'glow', LIT,
      { r:5.2*1.01, count:14, size:0.25, y:-5.2*0.45 });
    // Cold inspection panes — dulled amber glass behind DARK hull mullions.
    for (let i = 0; i < 10; i++) {
      const a = (i/10)*Math.PI*2;
      // ry = -a + π/2 makes box depth (d) point radially outward.
      box(b, 'glaze', VTGLASS, 1.6, 1.1, 0.3,
        { x:Math.cos(a)*5.2*0.97, y:5.2*0.15, z:Math.sin(a)*5.2*0.97,
          ry:-a+Math.PI/2 });
      box(b, 'hull', DARK, 1.8, 1.3, 0.18,
        { x:Math.cos(a)*5.2*0.90, y:5.2*0.15, z:Math.sin(a)*5.2*0.90,
          ry:-a+Math.PI/2 });
    }
    // Chain harness running up to a collar yoke.
    for (let i = 0; i < 4; i++) {
      const a = (i/4)*Math.PI*2 + Math.PI/4;
      const cx = Math.cos(a)*5.2*1.35, cz = Math.sin(a)*5.2*1.35;
      pipeRun(b, 'hull', W(COPPER,1),
        { ax:cx, ay:5.2*0.75, az:cz, bx:cx*1.55, by:5.2*2.1, bz:cz*1.55,
          r:0.13, seg:8, collars:3 });
    }
    torus(b, 'hull', COPPER, 5.2*1.5, 0.18, 6, 16, undefined,
      { y:5.2*2.2, rx: Math.PI/2 });
    lampString(b, 'glow', LIT_DIM,
      { ax:0, ay:5.2*2.2, az:5.2*1.5,
        bx:0, by:5.2*2.2, bz:-5.2*1.5, count:12, size:0.26 });
    // Support stand
    cyl(b, 'hull', DARK, 0.5, 0.5, 5.2*1.3, 8, { y:-5.2*1.1 });
    b.pop();

    // Airlock core drum → vault.
    airlock(b, 'hull', W(IRON,1), DARK,
      { ax:0, ay:-4.8, az:0, bx:0, by:-8.5, bz:0, r:1.7, seg:12, rings:2 });

    // Three cross drums overlapping the main core.
    csDrum({ x:-11, y:3, z: 4, r:3.0, l:20, skin:W(COPPER,1), plates:P_COP,
      winRows:4, winCols:10, seed:4531 });
    csDrum({ x: 12, y:4, z:-5, r:2.8, l:18, skin:GREY, plates:P_SCAV,
      winRows:4, winCols: 9, seed:4532 });
    csDrum({ x:  2, y:5, z:11, r:2.6, l:16, skin:IRON, plates:P_IRON,
      winRows:3, winCols: 8, seed:4533 });

    // Airlocks: core → each cross drum.
    airlock(b, 'hull', W(IRON,2), DARK,
      { ax:-9, ay:1.5, az:3, bx:-11, by:2.5, bz:4, r:1.4, seg:12, rings:2 });
    airlock(b, 'hull', W(IRON,2), DARK,
      { ax:10, ay:2.5, az:-4, bx:12, by:3.5, bz:-5, r:1.4, seg:12, rings:2 });
    airlock(b, 'hull', W(IRON,2), DARK,
      { ax:1.5, ay:4, az:9, bx:2, by:4.5, bz:11, r:1.3, seg:10, rings:1 });

    // Prize-cargo drum stacks clamped to flanks.
    const STACKS = [
      { x:-11, z:-8, r:2.4, skin:W(IRON,1), plates:P_SCAV, seed:4540 },
      { x: 14, z: 6, r:2.2, skin:GREY,      plates:P_MIX,  seed:4541 },
      { x: -8, z:10, r:2.0, skin:IRON,      plates:P_IRON, seed:4542 },
    ];
    for (const pd of STACKS) {
      for (let i = 0; i < 3; i++) {
        b.push(pd.x, -6+i*(pd.r*2.4), pd.z, 0, 0, 0);
        cyl(b, 'hull', pd.skin, pd.r, pd.r*0.95, pd.r*2.0, 12,
          { rz: Math.PI/2 });
        panelSkin(b, 'hull', pd.plates,
          { r:pd.r, from:-pd.r*0.75, to:pd.r*0.75, rows:2, cols:10,
            seed:pd.seed+i*5, t:0.18, axis:'x' });
        ribBands(b, 'hull', COPPER,
          { r:pd.r+0.13, tube:0.16, from:-pd.r*0.55, to:pd.r*0.55,
            count:2, axis:'x', tseg:12 });
        box(b, 'glow', LIT_WARM, 0.42, 0.32, 0.26, { x:pd.r*0.8 });
        b.pop();
      }
      // Clamp frame connecting the stack.
      box(b, 'hull', DARK, pd.r*2.6, 0.32, 0.52,
        { x:pd.x, y:-6+pd.r*3.6, z:pd.z });
      box(b, 'hull', COPPER, 0.42, pd.r*3.8, 0.42,
        { x:pd.x-pd.r, y:-6+pd.r*1.9, z:pd.z });
      box(b, 'hull', COPPER, 0.42, pd.r*3.8, 0.42,
        { x:pd.x+pd.r, y:-6+pd.r*1.9, z:pd.z });
      airlock(b, 'hull', W(IRON,2), DARK,
        { ax:pd.x*0.8, ay:-2, az:pd.z*0.8,
          bx:pd.x, by:-4, bz:pd.z, r:1.2, seg:10, rings:1 });
    }

    // ── tier 2: gantry & towers ──────────────────────────────────────────────
    // Toll gantry — plated box-section arm, world x 14→25, within |x|≤26.
    // All geometry in LOCAL space; push centre = mid-spine at (18.5, 3.5, 0).
    b.push(18.5, 3.5, 0, 0, 0, 0);
    // Box-section spine: main web + top & bottom flanges (local x −4.5…+4.5 = world 14…23).
    box(b, 'hull', IRON, 9.5, 2.0, 2.5);
    box(b, 'hull', W(IRON,1), 9.7, 0.48, 2.72, { y: 1.26 });   // top flange
    box(b, 'hull', W(IRON,1), 9.7, 0.48, 2.72, { y:-1.26 });   // bottom flange
    // Collar rings welded around the spine every ~2 u — readable as gantry ribs.
    ribBands(b, 'hull', COPPER,
      { r:1.52, tube:0.22, from:-4.3, to:4.3, count:5, axis:'x', tseg:8 });
    // Scattered trophy plate patches across the arm faces for hull density.
    panelPatches(b, 'hull', P_IRON,
      { r:1.3, from:-4.2, to:4.2, count:14, seed:4561, w:1.5, h:0.85, t:0.24, axis:'x' });
    // Under-truss: lattice girder hanging below the spine for structural depth.
    truss(b, 'hull', DARK,
      { ax:-4.5, ay:-1.28, az:0, bx:4.5, by:-1.28, bz:0, bays:5, thickness:0.2, spread:0.85 });
    // Root collar rings at the arm/drum junction.
    torus(b, 'hull', COPPER, 1.76, 0.28, 6, 10, undefined, { x:-4.5, ry: Math.PI/2 });
    torus(b, 'hull', DARK,   1.44, 0.15, 6, 10, undefined, { x:-4.5, ry: Math.PI/2 });
    // Lamp strings along the spine top edges — lamps PUNCTUATE structure, not replace it.
    lampString(b, 'glow', LIT_WARM,
      { ax:-3.8, ay:1.1, az: 1.22, bx:4.0, by:1.1, bz: 1.22, count:5, size:0.22 });
    lampString(b, 'glow', LIT_WARM,
      { ax:-3.8, ay:1.1, az:-1.22, bx:4.0, by:1.1, bz:-1.22, count:5, size:0.22 });
    // Short mid-arm window band (3 panes only, not a long checkerboard row).
    windowGrid(b, 'glow', LIT_DIM,
      { rows:1, cols:3, rowGap:0.5, colGap:1.05,
        w:0.62, h:0.36, d:0.65, x:-0.5, y:0.1, z:1.28, axis:'x' });
    // Toll-keeper cabin seated on spine tip (local +2.5→+5.05 = world 21→23.6).
    box(b, 'hull', COPPER, 2.6, 2.2, 2.6, { x:3.75, y:1.33 });
    box(b, 'hull', DARK, 2.8, 0.22, 2.8, { x:3.75, y:2.56 });  // cabin roof slab
    // 2×2 window panels on ±Z cabin faces — small, seated, not floating.
    windowGrid(b, 'glow', LIT_WARM,
      { rows:2, cols:2, rowGap:0.52, colGap:0.68,
        w:0.62, h:0.40, d:0.65, x:3.75, y:1.33, z: 1.34, axis:'x' });
    windowGrid(b, 'glow', LIT_DIM,
      { rows:2, cols:2, rowGap:0.52, colGap:0.68,
        w:0.62, h:0.40, d:0.65, x:3.75, y:1.33, z:-1.34, axis:'x' });
    // Topside railing along the spine.
    railing(b, 'hull', COPPER,
      { ax:-3.8, ay:1.56, az:1.24, bx:4.4, by:1.56, bz:1.24,
        height:0.72, posts:5, rail:0.08 });
    // Boarding claw at arm tip (local +4.6→+6.65 = world 23.1–25.15).
    box(b, 'hull', BLOOD, 1.8, 1.6, 2.2, { x:5.1, y:0 });
    for (const jz of [-0.85, 0.85]) {
      box(b, 'hull', DARK, 0.7, 1.8, 0.58, { x:6.3, y:-0.28, z:jz });
    }
    // Amber running light on the claw nose (+z face, seated on claw hull).
    box(b, 'glow', LIT_WARM, 0.42, 0.34, 0.28, { x:5.9, y:0.4, z:1.0 });
    b.pop();
    // Root airlock: drum shoulder → gantry base.
    airlock(b, 'hull', W(IRON,1), DARK,
      { ax:14, ay:2.5, az:0, bx:16, by:3, bz:0, r:1.5, seg:12, rings:2 });

    // Refinery towers rising from drum crown.
    const TOWERS = [
      { x:-8, z: 2, h:14, r:1.8, seed:4551 },
      { x: 6, z:-3, h:11, r:1.5, seed:4552 },
      { x:-3, z: 6, h: 9, r:1.2, seed:4553 },
    ];
    for (const t of TOWERS) {
      b.push(t.x, 10.5, t.z, 0, 0, 0);
      cyl(b, 'hull', IRON, t.r*0.72, t.r, t.h, 12);
      panelSkin(b, 'hull', P_COP,
        { r:t.r, from:-t.h*0.38, to:t.h*0.38,
          rows:5, cols:8, seed:t.seed, t:0.15, axis:'y' });
      ribBands(b, 'hull', COPPER,
        { r:t.r+0.14, tube:0.17, from:-t.h*0.35, to:t.h*0.35,
          count:4, axis:'y', tseg:12 });
      // Y-axis vertical tower: face halfwidth = r·sin(π/12). With cols=3,colGap=1.1
      // H_x=(3-1)·1.1/2+0.25=1.35 >> 0.47 (smallest tower r=1.2) → billboard float.
      // cols:1 gives H_x=0.25 which fits every tower; rows along Y are axial (no float).
      const rfT = t.r * Math.cos(Math.PI / 12);
      windowGrid(b, 'glow', LIT_WARM,
        { rows:5, cols:1, rowGap:1.9, colGap:1.1,
          w:0.48, h:0.65, d:rfT * 0.42, x:0, y:0, z: rfT, axis:'x' });
      windowGrid(b, 'glow', LIT_DIM,
        { rows:4, cols:1, rowGap:2.0, colGap:1.1,
          w:0.48, h:0.60, d:rfT * 0.42, x:0, y:0, z:-rfT, axis:'x' });
      portholeRing(b, 'glow', LIT_DIM,
        { r:t.r*1.01, count:10, size:0.24, y:t.h*0.3 });
      box(b, 'hull', DARK, t.r*1.5, 0.7, t.r*1.5, { y:t.h/2+0.1 });
      torus(b, 'hull', W(COPPER,1), t.r*0.75, 0.13, 6, 12, undefined,
        { y:t.h/2+0.55, rx: Math.PI/2 });
      b.pop();
      airlock(b, 'hull', W(IRON,1), DARK,
        { ax:t.x*0.65, ay:9.5, az:t.z*0.65,
          bx:t.x, by:10, bz:t.z, r:1.2, seg:10, rings:1 });
    }

    // Cracking column with amber-brown sight glass.
    b.push(5, 11.5, 5, 0, 0, 0);
    cyl(b, 'hull', IRON, 1.2, 1.2, 7.5, 10);
    ribBands(b, 'hull', COPPER,
      { r:1.32, tube:0.15, from:-2.8, to:2.8, count:4, axis:'y', tseg:10 });
    for (let i = 0; i < 4; i++) {
      const a = (i/4)*Math.PI*2;
      // Sight glass pane — 4 panels behind mullion frames.
      box(b, 'glaze', RFGLASS, 1.4, 5.0, 0.32,
        { x:Math.cos(a)*1.35, y:0, z:Math.sin(a)*1.35, ry:a });
      box(b, 'hull', DARK, 1.55, 5.2, 0.18,
        { x:Math.cos(a)*1.28, y:0, z:Math.sin(a)*1.28, ry:a });
    }
    portholeRing(b, 'glow', LIT_WARM,
      { r:1.38, count:8, size:0.22, y:1.0 });
    b.pop();
    airlock(b, 'hull', W(IRON,1), DARK,
      { ax:5, ay:9.5, az:5, bx:5, by:11, bz:5, r:1.1, seg:10, rings:1 });

    // Six flare stacks on the drum crown, lit tips.
    for (let i = 0; i < 6; i++) {
      const fx = -12+i*5, fz = -4+(i%2)*8;
      b.push(fx, 11.5, fz, 0, 0, 0);
      cyl(b, 'hull', W(IRON,1), 0.38, 0.55, 8, 8);
      cone(b, 'hull', COPPER, 0.28, 1.6, 6, { y:4.5 });
      box(b, 'glow', LIT, 0.34, 0.34, 0.34, { y:5.8 });
      b.pop();
    }

    // ── tier 3: spires ────────────────────────────────────────────────────────
    // Central beacon mast.
    b.push(0, 19.5, 0, 0, 0, 0);
    cyl(b, 'hull', DARK, 0.32, 0.45, 10, 8);
    ribBands(b, 'hull', COPPER,
      { r:0.52, tube:0.11, from:-4, to:4.5, count:5, axis:'y', tseg:8 });
    lampString(b, 'glow', LIT_DIM,
      { ax:0.6, ay:-4.5, az:0, bx:0.6, by:4.5, bz:0, count:8, size:0.28 });
    torus(b, 'hull', BLOOD, 1.2, 0.2, 6, 12, undefined,
      { y:5.3, rx: Math.PI/2 });
    for (let i = 0; i < 8; i++) {
      const a = (i/8)*Math.PI*2;
      box(b, 'hull', DARK, 0.12, 0.85, 0.12,
        { x:Math.cos(a)*1.15, y:5.6, z:Math.sin(a)*1.15 });
    }
    cyl(b, 'glow', LIT, 0.82, 0.82, 1.4, 12, { y:6.6 });
    b.pop();

    // Antenna thicket on tower crowns and gantry.
    const ANTENNAS = [
      [-8, 18.5,  2,  8, 0  ],
      [ 6, 16.5, -3,  7, 1.2],
      [-3, 14.5,  6,  6, 0  ],
      [22,  4.2,  0,  4, 0.8],
      [-11, 5.5,  4,  5, 0  ],
    ];
    for (const [ax0,ay0,az0,ah,adish] of ANTENNAS) {
      antenna(b, 'hull', DARK, W(COPPER,1),
        { x:ax0, y:ay0, z:az0, h:ah, r:0.12, tip:0.3, dish:adish });
    }

    // ── connective tissue: bridges, pipes, catwalks ───────────────────────────
    const BRIDGES = [
      [22, 4.2,  0,  14,  6, -2],
      [-8, 13,   2,  -3, 13.5, 5],
      [ 6, 12,  -3,   2, 11,   2],
      [-11, 4,   4,  -8,  3,   6],
      [12,  4.5,-5,  10,  5,  -3],
      [-8,  5.5,10,  -5,  6,   8],
      [ 0, 11,  -2,   5, 11.5, 5],
    ];
    for (const [x0,y0,z0,x1,y1,z1] of BRIDGES) {
      bridge(b, 'hull', W(IRON,1), DARK,
        { ax:x0, ay:y0, az:z0, bx:x1, by:y1, bz:z1,
          w:1.6, railH:0.75, posts:5 });
    }

    const PIPES = [
      [ 0, 10.5,  0,   5, 11.5,  5],
      [-8, 11,    2, -11,  7,    4],
      [ 6, 10,   -3,  12,  5,   -5],
      [-11,  2,   4, -11, -5,   -8],
      [12,   3,  -5,  12, -4,   -5],
      [ 0,  -4.2, 0,   0, -8.5,  0],
      [-8,   3,  -8, -11, -2,   -8],
    ];
    for (const [x0,y0,z0,x1,y1,z1] of PIPES) {
      pipeRun(b, 'hull', COPPER,
        { ax:x0, ay:y0, az:z0, bx:x1, by:y1, bz:z1, r:0.17, seg:8, collars:3 });
    }

    // Under-belly service catwalks.
    for (const side of [-1, 1]) {
      bridge(b, 'hull', W(IRON,1), DARK,
        { ax:-14, ay:-5, az:side*6.5, bx:14, by:-5, bz:side*6.5,
          w:1.4, railH:0.7, posts:10 });
    }
    truss(b, 'hull', DARK,
      { ax:-5, ay:-6.5, az:0, bx:5, by:-6.5, bz:0,
        bays:5, thickness:0.24, spread:0.9 });

    // Ambient lamp strings for glow density throughout the mass.
    lampString(b, 'glow', LIT_DIM,
      { ax:-18, ay:2.2, az:0,  bx:18,  by:2.2, bz:0,   count:18, size:0.26 });
    lampString(b, 'glow', LIT_WARM,
      { ax: 0,  ay:2.2, az:-8, bx:0,   by:2.2, bz:8,   count:12, size:0.26 });
    lampString(b, 'glow', LIT_DIM,
      { ax:-11, ay:4.5, az:4,  bx:-11, by:4.5, bz:-8,  count: 8, size:0.24 });
    lampString(b, 'glow', LIT_DIM,
      { ax: 12, ay:5,   az:-5, bx:12,  by:5,   bz:6,   count: 8, size:0.24 });
    lampString(b, 'glow', LIT_WARM,
      { ax:-18, ay:-4,  az:0,  bx:18,  by:-4,  bz:0,   count:16, size:0.24 });
    lampString(b, 'glow', LIT_DIM,
      { ax: 0,  ay:-4,  az:-8, bx:0,   by:-4,  bz:8,   count:10, size:0.24 });

    // Surface greebles: hatches, junction boxes, vents.
    for (let i = 0; i < 90; i++) {
      const gx = -16+rand()*34, gz = -12+rand()*24, gy = -7+rand()*20;
      box(b, 'hull', [DARK, W(IRON,2), COPPER, GREY][i%4],
        0.5+rand()*0.7, 0.38+rand()*0.44, 0.38+rand()*0.52,
        { x:gx, y:gy, z:gz, ry:rand()*Math.PI });
      if (i%4===0) box(b, 'glow', LIT_DIM, 0.3, 0.22, 0.22,
        { x:gx+0.42, y:gy+0.22, z:gz });
    }

    // ── tally collar ring ─────────────────────────────────────────────────────
    // R reduced 14→11 and ringY raised -15→-13 to pack the hoop against the belly.
    // Hub taller (h 2.4→3.6) so its top (local +1.8, world -11.2) embeds in the
    // vault sphere (radius 5.2 at that height → r_xz=4.88 > hub_r=3.2 ✓).
    const R = 11;
    // Main copper hoop in XZ plane (rx=π/2 makes it horizontal).
    torus(ringB, 'ringHull', COPPER, R, 1.2, 10, 32, undefined,
      { rx: Math.PI/2 });
    torus(ringB, 'ringHull', DARK, R, 0.38, 6, 32, undefined,
      { y: 0.88, rx: Math.PI/2 });
    torus(ringB, 'ringHull', DARK, R, 0.38, 6, 32, undefined,
      { y:-0.88, rx: Math.PI/2 });
    // Plated hub — taller so it visually reaches into the vault belly.
    cyl(ringB, 'ringHull', IRON, 2.8, 3.2, 3.6, 14);
    panelSkin(ringB, 'ringHull', P_IRON,
      { r:3.0, from:-1.6, to:1.6, rows:3, cols:12, seed:4580, t:0.16, axis:'y' });
    ribBands(ringB, 'ringHull', COPPER,
      { r:3.15, tube:0.15, from:-1.4, to:1.4, count:3, axis:'y', tseg:14 });
    // Six spokes.
    for (let i = 0; i < 6; i++) {
      const a = (i/6)*Math.PI*2;
      box(ringB, 'ringHull', DARK, R-3.8, 0.46, 0.38,
        { x:Math.cos(a)*(R/2), z:Math.sin(a)*(R/2), ry:-a });
    }
    // Trophy hull plates hung around the hoop.
    for (let i = 0; i < 14; i++) {
      const a = (i/14)*Math.PI*2;
      ringB.push(Math.cos(a)*R, 0, Math.sin(a)*R, -a, 0, 0);
      box(ringB, 'ringHull',
        [IRON, BLOOD, GREY, W(COPPER,1)][i%4], 2.8, 2.1, 0.55);
      // Rivet border dots.
      for (const [rx, ry2] of [[-1.1,-0.8],[1.1,-0.8],[-1.1,0.8],[1.1,0.8]]) {
        cyl(ringB, 'ringHull', COPPER, 0.08, 0.08, 0.16, 6,
          { x:rx, y:ry2, z:0.3 });
      }
      ringB.pop();
    }
    // Tally lamps — near-white, between trophy plates.
    for (let i = 0; i < 14; i++) {
      if (i%2 === 0) {
        const amid = ((i+0.5)/14)*Math.PI*2;
        box(ringB, 'ringGlow', LIT, 0.42, 0.42, 0.38,
          { x:Math.cos(amid)*(R+0.88), z:Math.sin(amid)*(R+0.88), ry:-amid });
      }
    }
    // Rim lamps for ambient glow density.
    for (let i = 0; i < 28; i++) {
      const a = (i/28)*Math.PI*2;
      box(ringB, 'ringGlow', LIT_WARM, 0.3, 0.3, 0.26,
        { x:Math.cos(a)*(R+0.9), z:Math.sin(a)*(R+0.9), ry:-a });
    }
    // Glazed sight panes — refinery amber glass framed in hull copper.
    for (let i = 0; i < 10; i++) {
      const a = (i/10)*Math.PI*2 + Math.PI/10;
      ringB.push(Math.cos(a)*R, 0, Math.sin(a)*R, -a+Math.PI/2, 0, 0);
      box(ringB, 'ringGlaze', RFGLASS, 1.4, 1.0, 0.28);
      ringB.pop();
    }

    // Stem airlock hanging the ring below the vault.
    airlock(b, 'hull', W(IRON,1), DARK,
      { ax:0, ay:-8, az:0, bx:0, by:-12.5, bz:0, r:1.8, seg:12, rings:2 });
    // Four diagonal braces: vault belly (r=4.5, y=-12) → ring inner gutter (r=9.5, y=-13.5).
    // Fixed in b (non-rotating), they visually anchor the hoop to the station mass.
    for (let i = 0; i < 4; i++) {
      const ah = (i/4)*Math.PI*2;
      pipeRun(b, 'hull', DARK,
        { ax: Math.cos(ah)*4.5, ay: -12, az: Math.sin(ah)*4.5,
          bx: Math.cos(ah)*9.5, by: -13.5, bz: Math.sin(ah)*9.5,
          r: 0.18, seg: 8, collars: 2 });
    }
  },
};
