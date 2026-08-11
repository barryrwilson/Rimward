/**
 * Freehold Compact — "Freehold Landing", the homestead raft.
 *
 * Wave 43 built this as merged, vertex-coloured geometry (station-detail.js),
 * generalising the wave-37 D4 ship ruling to stations. Wave 44 rebuilt the
 * SCULPT as a PACKED pile after the wave-43 scatter was rejected. Wave 45
 * moved it here unchanged: every detail station is now one module under
 * src/systems/stations/, and station.js owns the shared plumbing.
 *
 * Reference art: docs/FactionExamples/03-freehold-compact-station.png.
 *
 * The five rules every detail sculpt follows:
 *   PACKED     — module spacing is smaller than module diameter, so neighbours
 *                overlap. There is no empty space inside the silhouette.
 *   CONNECTED  — every adjacency gets an `airlock` tube; every gap a `bridge`.
 *   SKINNED    — every drum and collar carries a `panelSkin` plate grid; the
 *                plating IS the perceived detail, not the primitive count.
 *   LIT        — `windowGrid` fields, not single window rows.
 *   TIERED     — four levels: hull raft, cross drums, crown, spires.
 *
 * ~2,300 primitives land in six merged chunks — hull / glow / glaze on the
 * group and ringHull / ringGlow / ringGlaze inside the spinning ringGroup — so
 * the whole sculpt still costs 8 geometries and 6 materials. That budget is
 * the point: the wave-39 ten-jump pin constrains RESOURCE count, not part
 * count, so a small box costs 36 vertices and nothing else.
 *
 * Channel discipline: `glow` carries lit elements ONLY, in near-neutral tints.
 * update() pulses lightMat.color (the faction's warm amber) and that
 * multiplies these vertex colours, so a saturated tint there would square the
 * hue. The greenhouse grow-light green therefore lives in `glaze`, whose
 * material is white and never animated.
 *
 * Weathering ladder: structure colours are `weather(paletteHex, i)` over
 * SHADES [1.0, 0.86, 0.72, 0.6] — the reference art is heavily weathered and
 * one flat tone per role read as plastic. scripts/boot-test.mjs recomputes the
 * identical product set with the same Math.round arithmetic and requires exact
 * membership, so every shade must derive from a BASE FACTION_STYLE colour,
 * never from an already-weathered one.
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone,
  ribBands, windowGrid, portholeRing, panelSkin, truss, railing, bridge,
  airlock, pipeRun, antenna, ladder, lampString, crate,
} from '../station-detail.js';

/** Agri carousel: radius 11, tucked under the belly. */
export const freeholdStation = {
  ringY: -17.5,
  build(b, ringB, st) {
    const rand = rng(4403);

    // Base palette (FACTION_STYLE only) and its weathered shades.
    const CREAM = st.trim;        // 0xd8c9a8 weathered panelling — dominant
    const BROWN = st.hull;        // 0x6b4f36 warm structural brown
    const DARK = st.hullDark;     // 0x3a2c1e ribs, seams, truss, shadow
    const RED = st.patch[0];      // 0x9a4436 barn red — dome roofs
    const BLUE = st.patch[2];     // 0x5b7a94 donated faded blue
    const W = weather;
    // Plate sets: mottled skins, every entry derived from a BASE colour.
    const P_CREAM = [CREAM, CREAM, W(CREAM, 1), W(CREAM, 1), W(CREAM, 2)];
    const P_RED = [RED, W(RED, 1), W(RED, 2), W(CREAM, 3)];
    const P_BLUE = [BLUE, W(BLUE, 1), W(BLUE, 2), W(CREAM, 2)];
    const P_MIX = [CREAM, CREAM, W(CREAM, 1), W(BROWN, 1), W(RED, 1), W(BLUE, 1)];
    // Window tints — near-neutral so the amber pulse keeps its hue.
    const LIT = 0xffffff;
    const LIT_WARM = 0xfff2e2;
    const LIT_DIM = 0xe8dcc8;
    const GROW = 0x2b4a30; // grow-light green: a LIGHT colour, not a faction colour

    // ---------------------------------------------------------------- modules --
    // One pressurised drum laid along `axis`: barrel, plate skin, rib bands, end
    // caps with bolt rings, two window fields, a roof spine with railing, and a
    // ladder. Every drum in the raft is one of these.
    const drum = (o) => {
      const { x, y, z, r, l, axis = 'x', skin, cap, roof, plates, rows = 5, cols = 14,
        winRows = 3, winCols = 9, seed } = o;
      const alongX = axis === 'x';
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r, r, l, 20, alongX ? { rz: Math.PI / 2 } : { rx: Math.PI / 2 });
      panelSkin(b, 'hull', plates, { r, from: -l / 2 + 0.9, to: l / 2 - 0.9, rows, cols, seed, t: 0.2, axis });
      ribBands(b, 'hull', DARK, { r: r + 0.14, tube: 0.2, from: -l / 2 + 2, to: l / 2 - 2, count: 5, axis, tseg: 20 });
      for (const s of [-1, 1]) {
        cyl(b, 'hull', cap, r * 1.04, r * 0.88, 1.2, 20,
          alongX ? { x: s * l / 2, rz: Math.PI / 2 } : { z: s * l / 2, rx: Math.PI / 2 });
        const ring = alongX ? { x: s * (l / 2 + 0.65), ry: Math.PI / 2 } : { z: s * (l / 2 + 0.65) };
        torus(b, 'hull', W(CREAM, 1), r * 0.78, 0.09, 6, 20, undefined, ring);
        torus(b, 'hull', DARK, r * 0.34, 0.08, 6, 14, undefined, ring);
        cyl(b, 'hull', W(CREAM, 2), r * 0.2, r * 0.2, 0.5, 12, alongX ? { x: s * (l / 2 + 0.7), rz: Math.PI / 2 } : { z: s * (l / 2 + 0.7), rx: Math.PI / 2 });
      }
      const gap = (l - 3.5) / winCols;
      if (alongX) {
        windowGrid(b, 'glow', LIT, { rows: winRows, cols: winCols, rowGap: 1.1, colGap: gap, w: 0.85, h: 0.55, d: 0.6, x: 0, y: r * 0.25, z: r * 0.94, axis: 'x' });
        windowGrid(b, 'glow', LIT_WARM, { rows: winRows, cols: winCols, rowGap: 1.1, colGap: gap, w: 0.85, h: 0.55, d: 0.6, x: 0, y: r * 0.05, z: -r * 0.94, axis: 'x' });
        box(b, 'hull', roof, l * 0.9, 0.5, 2.4, { y: r + 0.25 });
        railing(b, 'hull', DARK, { ax: -l / 2 + 1.4, ay: r + 0.5, az: 0, bx: l / 2 - 1.4, by: r + 0.5, bz: 0, height: 0.8, posts: 9, rail: 0.09 });
        ladder(b, 'hull', DARK, { x: l / 2 - 2.2, y: -r, z: r * 0.62, h: r * 1.9, w: 0.6, rungs: 6 });
      } else {
        windowGrid(b, 'glow', LIT, { rows: winRows, cols: winCols, rowGap: 1.1, colGap: gap, w: 0.6, h: 0.55, d: 0.85, x: r * 0.94, y: r * 0.25, z: 0, axis: 'z' });
        windowGrid(b, 'glow', LIT_WARM, { rows: winRows, cols: winCols, rowGap: 1.1, colGap: gap, w: 0.6, h: 0.55, d: 0.85, x: -r * 0.94, y: r * 0.05, z: 0, axis: 'z' });
        box(b, 'hull', roof, 2.4, 0.5, l * 0.9, { y: r + 0.25 });
        railing(b, 'hull', DARK, { ax: 0, ay: r + 0.5, az: -l / 2 + 1.4, bx: 0, by: r + 0.5, bz: l / 2 - 1.4, height: 0.8, posts: 9, rail: 0.09 });
        ladder(b, 'hull', DARK, { x: r * 0.62, y: -r, z: l / 2 - 2.2, h: r * 1.9, w: 0.6, rungs: 6, ry: Math.PI / 2 });
      }
      b.pop();
    };

    // A domed habitat: plated collar drum, ribbed dome cap, porthole ring,
    // window band, and an optional lantern cupola.
    const domeModule = (o) => {
      const { x, y, z, r, skin, cap, plates, seed, cupola = false, ribs = 8 } = o;
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', skin, r * 0.97, r, 3.0, 22);
      panelSkin(b, 'hull', plates, { r, from: -1.4, to: 1.4, rows: 2, cols: 16, seed, t: 0.18, axis: 'y' });
      ribBands(b, 'hull', DARK, { r: r + 0.12, tube: 0.2, from: -1.2, to: 1.2, count: 2, axis: 'y', tseg: 22 });
      hemi(b, 'hull', cap, r * 0.96, 22, 14, { y: 1.5 });
      for (let i = 0; i < ribs; i++) {
        torus(b, 'hull', DARK, r * 0.965, 0.12, 6, 20, Math.PI, { y: 1.5, ry: (i * Math.PI) / ribs });
      }
      portholeRing(b, 'glow', LIT_WARM, { r: r + 0.1, count: Math.max(8, Math.round(r * 2.2)), size: 0.38, y: 0.3 });
      windowGrid(b, 'glow', LIT, { rows: 2, cols: 5, rowGap: 0.85, colGap: 1.0, w: 0.6, h: 0.5, d: 0.6, x: 0, y: -0.4, z: r * 0.98, axis: 'x' });
      if (cupola) {
        cyl(b, 'hull', CREAM, r * 0.3, r * 0.34, 2.4, 14, { y: r * 0.92 + 1.6 });
        portholeRing(b, 'glow', LIT, { r: r * 0.35, count: 8, size: 0.26, y: r * 0.92 + 1.8 });
        hemi(b, 'hull', cap, r * 0.33, 14, 8, { y: r * 0.92 + 2.8 });
      }
      b.pop();
    };

    // A spherical tank: banded, belly-plated, portholed, on a stub stand.
    const tank = (x, y, z, r, skin, plates, seed) => {
      b.push(x, y, z, 0, 0, 0);
      sphere(b, 'hull', skin, r, 20, 14);
      ribBands(b, 'hull', DARK, { r: r * 1.01, tube: 0.14, from: -r * 0.55, to: r * 0.55, count: 3, axis: 'y', tseg: 20 });
      panelSkin(b, 'hull', plates, { r: r * 0.97, from: -r * 0.45, to: r * 0.45, rows: 2, cols: 12, seed, t: 0.14, axis: 'y' });
      portholeRing(b, 'glow', LIT_DIM, { r: r * 1.01, count: 8, size: 0.26, y: r * 0.35 });
      cyl(b, 'hull', DARK, 0.42, 0.42, r * 1.6, 8, { y: -r * 1.15 });
      b.pop();
    };

    // ------------------------------------------------------- tier 0: hull raft --
    // Five long drums lying along X, side by side in Z at 7-unit spacing for
    // radius-4.6 barrels — they OVERLAP by 2 units, so the raft is one mass.
    const RAFT = [
      { z: -14, l: 21, x: 1.5, skin: CREAM, cap: W(BROWN, 1), roof: W(RED, 1), plates: P_CREAM },
      { z: -7, l: 27, x: -1, skin: W(CREAM, 1), cap: CREAM, roof: W(BROWN, 1), plates: P_CREAM },
      { z: 0, l: 30, x: 0.5, skin: BLUE, cap: CREAM, roof: RED, plates: P_BLUE },
      { z: 7, l: 27, x: -1.5, skin: CREAM, cap: W(BROWN, 1), roof: W(BROWN, 1), plates: P_CREAM },
      { z: 14, l: 22, x: 1, skin: W(CREAM, 2), cap: CREAM, roof: W(RED, 1), plates: P_MIX },
    ];
    RAFT.forEach((d, i) => drum({
      x: d.x, y: -6, z: d.z, r: 4.6, l: d.l, axis: 'x',
      skin: d.skin, cap: d.cap, roof: d.roof, plates: d.plates,
      rows: 5, cols: 15, winRows: 3, winCols: 10, seed: 4410 + i,
    }));
    // Airlock collars stitching neighbouring raft drums, fore and aft.
    for (let i = 0; i < RAFT.length - 1; i++) {
      for (const ax of [-7, 7]) {
        airlock(b, 'hull', W(CREAM, 1), DARK, {
          ax, ay: -6, az: RAFT[i].z + 1.4, bx: ax, by: -6, bz: RAFT[i + 1].z - 1.4, r: 1.5, seg: 12, rings: 2,
        });
      }
    }

    // ---------------------------------------------------- tier 1: cross drums --
    // Four drums crossing along Z, bedded into the raft's crowns (raft top is
    // y = -1.4; these bottom out at -2.6, so they sink in).
    const CROSS = [
      { x: -15, l: 23, z: 1, skin: CREAM, cap: W(BROWN, 1), roof: W(RED, 1), plates: P_CREAM },
      { x: -5, l: 27, z: -1, skin: W(RED, 1), cap: CREAM, roof: W(BROWN, 2), plates: P_RED },
      { x: 6, l: 26, z: 1.5, skin: W(CREAM, 1), cap: BROWN, roof: W(RED, 1), plates: P_MIX },
      { x: 16, l: 21, z: -1, skin: BLUE, cap: CREAM, roof: W(BROWN, 1), plates: P_BLUE },
    ];
    CROSS.forEach((d, i) => drum({
      x: d.x, y: 1.2, z: d.z, r: 3.8, l: d.l, axis: 'z',
      skin: d.skin, cap: d.cap, roof: d.roof, plates: d.plates,
      rows: 4, cols: 13, winRows: 3, winCols: 9, seed: 4420 + i,
    }));
    // Vertical airlocks tying each cross drum down into the raft below.
    for (const d of CROSS) {
      for (const az of [-8, 0, 8]) {
        airlock(b, 'hull', W(CREAM, 2), DARK, { ax: d.x, ay: -4.4, az, bx: d.x, by: -0.4, bz: az, r: 1.3, seg: 10, rings: 1 });
      }
    }
    // Longitudinal catwalks along the raft crowns, over the cross drums.
    for (const bz of [-10.5, -3.5, 3.5, 10.5]) {
      bridge(b, 'hull', W(BROWN, 1), DARK, { ax: -21, ay: 5.4, az: bz, bx: 21, by: 5.4, bz, w: 1.9, railH: 0.8, posts: 14 });
    }

    // -------------------------------------------------------- tier 2: the crown
    // The barn-red centre dome, a chapel dome, a tank cluster, three short drums
    // and the glazed greenhouse — all bedded into the cross drums below.
    domeModule({ x: 0, y: 6.4, z: -2, r: 7.4, skin: CREAM, cap: RED, plates: P_CREAM, seed: 4430, cupola: true, ribs: 10 });
    domeModule({ x: 14, y: 7.2, z: -9, r: 3.8, skin: W(CREAM, 1), cap: W(RED, 1), plates: P_CREAM, seed: 4431, cupola: true, ribs: 6 });
    domeModule({ x: -17, y: 7.0, z: 9, r: 3.2, skin: BLUE, cap: W(BROWN, 1), plates: P_BLUE, seed: 4432, ribs: 6 });
    tank(-20, 7.6, -7, 3.4, W(CREAM, 1), P_CREAM, 4433);
    tank(-15, 8.8, -3, 2.7, CREAM, P_MIX, 4434);
    tank(-22.5, 6.6, -1.5, 2.3, W(RED, 1), P_RED, 4435);
    drum({ x: 20, y: 7.4, z: 4, r: 2.9, l: 10, axis: 'x', skin: CREAM, cap: W(BROWN, 1), roof: W(RED, 1), plates: P_CREAM, rows: 3, cols: 11, winRows: 2, winCols: 6, seed: 4436 });
    drum({ x: -9, y: 7.6, z: -12, r: 2.6, l: 9, axis: 'z', skin: W(CREAM, 1), cap: CREAM, roof: W(BROWN, 1), plates: P_MIX, rows: 3, cols: 10, winRows: 2, winCols: 6, seed: 4437 });
    drum({ x: 8, y: 7.2, z: 12, r: 3.0, l: 12, axis: 'x', skin: W(CREAM, 2), cap: CREAM, roof: RED, plates: P_CREAM, rows: 3, cols: 11, winRows: 2, winCols: 7, seed: 4438 });

    // ---------------------------------------------------- greenhouse barrel ----
    // A glazed vault: 18 panes behind dark mullions over a planter deck, with
    // amber service lights spilling along both eaves.
    b.push(-4, 9.6, 15.5, 0, 0, 0);
    box(b, 'hull', DARK, 16, 0.7, 6.0, { y: -2.9 });
    box(b, 'hull', W(BROWN, 1), 16, 1.2, 0.8, { y: -2.2, z: 2.8 });
    box(b, 'hull', W(BROWN, 1), 16, 1.2, 0.8, { y: -2.2, z: -2.8 });
    for (let i = 0; i < 14; i++) cyl(b, 'glaze', GROW, 2.7, 2.7, 0.52, 14, { x: -6.83 + i * 1.05, rz: Math.PI / 2 });
    for (let i = 0; i <= 14; i++) torus(b, 'hull', DARK, 2.82, 0.17, 6, 18, undefined, { x: -7.35 + i * 1.05, ry: Math.PI / 2 });
    for (const s2 of [-1, 1]) { // end bulkheads: the vault is glazed, not open-ended
      cyl(b, 'hull', W(BROWN, 1), 2.86, 2.86, 0.5, 16, { x: s2 * 7.6, rz: Math.PI / 2 });
      torus(b, 'hull', DARK, 2.9, 0.2, 6, 18, undefined, { x: s2 * 7.85, ry: Math.PI / 2 });
    }
    box(b, 'hull', DARK, 15.2, 0.45, 0.45, { y: 2.82 });
    for (let i = 0; i < 5; i++) { // longitudinal glazing bars break the tube read
      const a = -1.1 + i * 0.55;
      box(b, 'hull', DARK, 15.2, 0.22, 0.22, { y: Math.cos(a) * 2.84, z: Math.sin(a) * 2.84 });
      box(b, 'hull', DARK, 15.2, 0.22, 0.22, { y: Math.cos(a) * 2.84, z: -Math.sin(a) * 2.84 });
    }
    windowGrid(b, 'glow', LIT_WARM, { rows: 1, cols: 13, rowGap: 1, colGap: 1.15, w: 0.72, h: 0.46, d: 0.5, x: 0, y: -2.1, z: 3.1, axis: 'x' });
    windowGrid(b, 'glow', LIT_DIM, { rows: 1, cols: 11, rowGap: 1, colGap: 1.3, w: 0.66, h: 0.42, d: 0.5, x: 0, y: -2.1, z: -3.1, axis: 'x' });
    b.pop();

    // ------------------------------------------------------ crown connections --
    // Nothing on the crown floats: airlocks bed each module into the tier below,
    // bridges span the walkable gaps.
    const CROWN_LINKS = [
      [0, 3.0, -2, 0, 0.6, -2, 2.0], [14, 4.2, -9, 14, 1.6, -7, 1.4],
      [-17, 4.2, 9, -16, 1.6, 7, 1.4], [-20, 4.6, -7, -18, 1.4, -5, 1.3],
      [20, 4.6, 4, 18, 1.6, 3, 1.3], [-9, 5.2, -12, -8, 2.0, -10, 1.2],
      [8, 4.4, 12, 7, 1.6, 10, 1.3], [-4, 5.8, 15.5, -3, 2.2, 13, 1.4],
    ];
    for (const [x0, y0, z0, x1, y1, z1, r] of CROWN_LINKS) {
      airlock(b, 'hull', W(CREAM, 1), DARK, { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, r, seg: 12, rings: 2 });
    }
    const CROWN_BRIDGES = [
      [7.2, 7.4, -2, 12, 7.4, -8], [-7.2, 7.4, -2, -14, 8.2, -5],
      [0, 8.0, 5.0, -4, 9.4, 12.4], [17, 7.6, 3, 20, 7.6, 3.6],
      [-17, 7.4, 12, -8, 7.6, 15], [8, 7.6, 15, 3, 8.8, 15.5],
    ];
    for (const [x0, y0, z0, x1, y1, z1] of CROWN_BRIDGES) {
      bridge(b, 'hull', W(BROWN, 1), DARK, { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, w: 1.7, railH: 0.75, posts: 6 });
    }

    // -------------------------------------------------------- tier 3: spires ---
    // The lighthouse tower on the +X flank, the centre mast up to the beacon,
    // four dome spires, and an antenna thicket rooted on the crowns.
    b.push(24, 4.5, 11, 0, 0, 0);
    cyl(b, 'hull', CREAM, 0.9, 1.7, 15, 14);
    panelSkin(b, 'hull', P_CREAM, { r: 1.4, from: -6.5, to: 6.5, rows: 6, cols: 8, seed: 4440, t: 0.14, axis: 'y' });
    ribBands(b, 'hull', DARK, { r: 1.5, tube: 0.16, from: -6, to: 6, count: 6, axis: 'y', tseg: 14 });
    windowGrid(b, 'glow', LIT_DIM, { rows: 5, cols: 2, rowGap: 2.2, colGap: 1.2, w: 0.42, h: 0.6, d: 0.5, x: 0, y: 0, z: 1.5, axis: 'x' });
    torus(b, 'hull', DARK, 2.1, 0.18, 6, 18, undefined, { y: 7.6, rx: Math.PI / 2 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      box(b, 'hull', DARK, 0.12, 0.95, 0.12, { x: Math.cos(a) * 2.05, y: 8.1, z: Math.sin(a) * 2.05 });
    }
    cyl(b, 'glow', LIT, 1.2, 1.2, 1.9, 14, { y: 9.4 });
    cyl(b, 'hull', RED, 1.45, 1.45, 0.35, 14, { y: 10.5 });
    hemi(b, 'hull', W(RED, 1), 1.4, 14, 8, { y: 10.7 });
    cone(b, 'hull', DARK, 0.16, 3.0, 6, { y: 13.2 });
    ladder(b, 'hull', DARK, { x: 1.55, y: -7, z: 0, h: 15, w: 0.5, rungs: 11, ry: Math.PI / 2 });
    b.pop();
    airlock(b, 'hull', W(CREAM, 1), DARK, { ax: 24, ay: 1.5, az: 11, bx: 19, by: 1.4, bz: 8, r: 1.4, seg: 12, rings: 2 });
    bridge(b, 'hull', W(BROWN, 1), DARK, { ax: 22.6, ay: 6.2, az: 11, bx: 9.5, by: 6.6, bz: 12.6, w: 1.6, railH: 0.75, posts: 9 });

    // Centre mast: cupola to the beacon, with collar bands and a lamp lane.
    b.push(0, 15.6, -2, 0, 0, 0);
    cyl(b, 'hull', DARK, 0.32, 0.46, 13.5, 8);
    ribBands(b, 'hull', CREAM, { r: 0.55, tube: 0.11, from: -5, to: 5.5, count: 5, axis: 'y', tseg: 8 });
    lampString(b, 'glow', LIT_DIM, { ax: 0.55, ay: -5, az: 0, bx: 0.55, by: 6, bz: 0, count: 7, size: 0.28 });
    b.pop();
    for (let i = 0; i < 4; i++) { // dome spires
      const a = (i / 4) * Math.PI * 2 + 0.4;
      cone(b, 'hull', W(CREAM, 1), 0.3, 6.5, 6, { x: Math.cos(a) * 5.4, y: 13.2, z: -2 + Math.sin(a) * 5.4 });
      box(b, 'glow', LIT, 0.3, 0.3, 0.3, { x: Math.cos(a) * 5.4, y: 16.6, z: -2 + Math.sin(a) * 5.4 });
    }
    const ANTENNAS = [
      [-20, 11.2, -7, 9, 0], [-15, 12.0, -3, 12, 1.4], [14, 11.2, -9, 10, 0],
      [20, 10.6, 4, 8, 1.2], [-9, 10.4, -12, 11, 0], [8, 10.4, 12, 9, 1.1],
      [-17, 10.4, 9, 8, 0],
    ];
    for (const [ax0, ay0, az0, ah, adish] of ANTENNAS) {
      antenna(b, 'hull', DARK, W(CREAM, 1), { x: ax0, y: ay0, z: az0, h: ah, r: 0.14, tip: 0.34, dish: adish });
    }

    // --------------------------------------------------------- berth arms ------
    // Two mooring arms reaching out along Z with cradle jaws and berth lamps —
    // the lateral docking spurs of the reference.
    for (const side of [-1, 1]) {
      b.push(3, -3.5, side * 18, 0, 0, 0);
      airlock(b, 'hull', W(CREAM, 2), DARK, { ax: 0, ay: 0, az: -side * 3, bx: 0, by: 0, bz: side * 6, r: 1.6, seg: 12, rings: 2 });
      truss(b, 'hull', DARK, { ax: 0, ay: -1.6, az: -side * 2, bx: 0, by: -1.6, bz: side * 7, bays: 4, thickness: 0.26, spread: 1.5 });
      box(b, 'hull', CREAM, 3.4, 1.2, 2.0, { z: side * 7.2 });
      for (const jaw of [-1, 1]) {
        box(b, 'hull', W(BROWN, 1), 0.6, 2.8, 1.4, { x: jaw * 1.5, y: 0.4, z: side * 8.3 });
        box(b, 'hull', DARK, 0.5, 0.6, 2.6, { x: jaw * 1.5, y: 1.6, z: side * 9.4 });
      }
      lampString(b, 'glow', LIT, { ax: 1.9, ay: 0.9, az: -side * 1, bx: 1.9, by: 0.9, bz: side * 8, count: 6, size: 0.26 });
      lampString(b, 'glow', LIT, { ax: -1.9, ay: 0.9, az: -side * 1, bx: -1.9, by: 0.9, bz: side * 8, count: 6, size: 0.26 });
      b.pop();
    }

    // --------------------------------------------------------------- belly -----
    // Keel truss under the raft, mooring spars with slung cargo drums, and a
    // railed crate yard at the -X end.
    truss(b, 'hull', DARK, { ax: -22, ay: -12.2, az: 0, bx: 22, by: -12.2, bz: 0, bays: 11, thickness: 0.34, spread: 1.2 });
    for (const kx of [-14, -4, 6, 15]) {
      truss(b, 'hull', DARK, { ax: kx, ay: -12.2, az: -13, bx: kx, by: -12.2, bz: 13, bays: 5, thickness: 0.26, spread: 0.9 });
      airlock(b, 'hull', W(CREAM, 2), DARK, { ax: kx, ay: -10.6, az: 0, bx: kx, by: -12.2, bz: 0, r: 1.1, seg: 10, rings: 1 });
    }
    for (const side of [-1, 1]) {
      b.push(-8, -13.5, side * 8, 0, 0, 0);
      truss(b, 'hull', DARK, { ax: 0, ay: 0, az: 0, bx: 0, by: -3.5, bz: side * 6, bays: 4, thickness: 0.24, spread: 0.8 });
      for (let i = 0; i < 3; i++) {
        b.push(0, -1.6 - i * 0.7, side * (1.6 + i * 2.1), 0, 0, 0);
        cyl(b, 'hull', [W(RED, 1), CREAM, W(BLUE, 1)][i], 1.4, 1.4, 3.2, 12, { rz: Math.PI / 2 });
        ribBands(b, 'hull', DARK, { r: 1.46, tube: 0.12, from: -1.1, to: 1.1, count: 3, axis: 'x', tseg: 12 });
        box(b, 'glow', LIT_DIM, 0.34, 0.26, 0.26, { y: 0.2, z: 1.5 });
        b.pop();
      }
      b.pop();
    }
    b.push(-24, -8.5, 0, 0, 0.18, 0);
    box(b, 'hull', DARK, 9, 0.8, 12);
    for (const rz of [-5.6, 5.6]) {
      railing(b, 'hull', W(CREAM, 1), { ax: -4.2, ay: 0.4, az: rz, bx: 4.2, by: 0.4, bz: rz, height: 0.75, posts: 7, rail: 0.07 });
    }
    const YARD = [[-2.4, 1.4, -3.4, 2.0, W(RED, 1)], [0.6, 1.2, -3.0, 1.6, CREAM], [2.6, 1.3, -0.4, 1.8, W(BLUE, 1)],
      [-2.2, 1.2, 1.0, 1.6, W(BROWN, 1)], [0.4, 3.2, -3.2, 1.6, W(CREAM, 1)], [-2.4, 3.2, -3.4, 1.5, W(BLUE, 2)],
      [2.4, 1.3, 3.6, 1.7, RED], [-0.6, 1.3, 4.2, 1.5, W(BROWN, 1)], [2.2, 3.1, 3.4, 1.4, CREAM],
      [-2.0, 1.2, 4.4, 1.3, W(CREAM, 2)]];
    for (const [cx, cy, cz, cs, col] of YARD) {
      crate(b, 'hull', col, { x: cx, y: cy, z: cz, s: cs, ry: rand() * 1.2 - 0.6, bands: 2, bandHex: DARK });
    }
    lampString(b, 'glow', LIT_DIM, { ax: -3.6, ay: 1.7, az: -4.8, bx: 3.6, by: 1.7, bz: -4.8, count: 6, size: 0.26 });
    b.pop();
    airlock(b, 'hull', W(CREAM, 2), DARK, { ax: -24, ay: -7.4, az: 0, bx: -20, by: -6, bz: 0, r: 1.4, seg: 12, rings: 2 });

    // ------------------------------------------------------------- pipe runs ---
    const PIPES = [
      [-20, 5.2, -7, -14, 4.6, -3], [-15, 5.6, -3, -6, 4.4, -2], [0, 3.4, 4.4, -4, 5.8, 12.4],
      [12, 4.4, -8, 6, 4.2, -3], [18, 4.4, 3, 12, 4.6, -6], [-16, 4.6, 8, -10, 4.4, 12],
      [4, 4.4, 11, 9, 4.4, 8], [-8, -9.6, -8, -2, -9.6, -3], [6, -9.6, 8, 12, -9.6, 4],
      [-22, -6.4, 2, -18, -5.2, 5],
    ];
    for (const [x0, y0, z0, x1, y1, z1] of PIPES) {
      pipeRun(b, 'hull', W(CREAM, 1), { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, r: 0.19, seg: 8, collars: 4 });
    }

    // -------------------------------------------------------- surface greebles -
    // Hatches, junction boxes, vents and inspection ports over the whole mass.
    for (let i = 0; i < 70; i++) {
      const gx = -22 + rand() * 44;
      const gz = -16 + rand() * 32;
      const gy = -9 + rand() * 18;
      box(b, 'hull', [DARK, W(CREAM, 2), W(BROWN, 1), DARK][i % 4],
        0.6 + rand() * 0.8, 0.45 + rand() * 0.5, 0.45 + rand() * 0.6,
        { x: gx, y: gy, z: gz, ry: rand() * Math.PI });
      if (i % 3 === 0) box(b, 'glow', LIT_DIM, 0.36, 0.28, 0.26, { x: gx + 0.5, y: gy + 0.3, z: gz });
    }
    // -------------------------------------------------------- agri carousel ----
    // Compact and tucked under the belly (wave 43's radius-24 hoop enclosed a
    // void the reference does not have): radius 11, ten glazed growing pods,
    // spokes to a plated hub, and a lamp-lined rim.
    const R = 11;
    torus(ringB, 'ringHull', W(BROWN, 1), R, 1.1, 10, 40, undefined, { rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DARK, R, 0.32, 6, 40, undefined, { y: 0.95, rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DARK, R, 0.32, 6, 40, undefined, { y: -0.95, rx: Math.PI / 2 });
    cyl(ringB, 'ringHull', CREAM, 2.4, 2.8, 2.0, 16);
    panelSkin(ringB, 'ringHull', P_CREAM, { r: 2.8, from: -0.9, to: 0.9, rows: 2, cols: 10, seed: 4460, t: 0.14, axis: 'y' });
    ribBands(ringB, 'ringHull', DARK, { r: 2.9, tube: 0.16, from: -0.7, to: 0.7, count: 2, axis: 'y', tseg: 16 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(ringB, 'ringHull', DARK, R - 2.2, 0.42, 0.34, { x: Math.cos(a) * (R / 2), z: Math.sin(a) * (R / 2), ry: -a });
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ringB.push(Math.cos(a) * R, 0, Math.sin(a) * R, -a, 0, 0);
      box(ringB, 'ringHull', W(CREAM, 1), 2.2, 0.4, 3.8, { y: 0.5 });
      cyl(ringB, 'ringGlaze', GROW, 0.7, 0.7, 3.2, 12, { y: 1.4, rx: Math.PI / 2 });
      for (let r2 = 0; r2 < 4; r2++) {
        torus(ringB, 'ringHull', DARK, 0.77, 0.1, 5, 12, undefined, { y: 1.4, z: -1.35 + r2 * 0.9 });
      }
      box(ringB, 'ringGlow', LIT_WARM, 0.36, 0.26, 0.26, { y: 0.3, z: 1.3 });
      box(ringB, 'ringGlow', LIT_WARM, 0.36, 0.26, 0.26, { y: 0.3, z: -1.3 });
      ringB.pop();
    }
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + Math.PI / 20;
      box(ringB, 'ringGlow', LIT, 0.32, 0.32, 0.26, { x: Math.cos(a) * (R + 1.0), z: Math.sin(a) * (R + 1.0), ry: -a });
    }
    // The carousel hangs on a plated stem, not in mid-air.
    airlock(b, 'hull', W(CREAM, 2), DARK, { ax: 0, ay: -12.2, az: 0, bx: 0, by: -17.0, bz: 0, r: 1.6, seg: 12, rings: 2 });
  },
};
