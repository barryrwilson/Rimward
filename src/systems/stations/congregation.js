/**
 * Congregation of the Further Shore — "Pilgrim Cathedral-Ark", a flying sanctuary.
 *
 * Reference art: docs/FactionExamples/09-congregation-further-shore-station.png
 *
 * Tiers (4 stacked vertical levels plus ring):
 *   TIER 0 — BELLY: Five pilgrim dormitory drums (along X) at y=-10, water tanks, keel truss,
 *             and belly pipe runs form the pressurised undercarriage of the ark.
 *   TIER 1 — SECT BAYS (lower): Six chapel drums packed and overlapping around the keep base,
 *             each with ribbed dome, porthole ring and window band; three carry cupola lanterns.
 *   TIER 2 — CENTRAL KEEP: Radius-8 drum 14 units tall with 7-row panelSkin plating,
 *             7 clerestory window-grid columns, and a ribbed lantern crown at y=15 carrying
 *             the beacon glow cube and a cone spire.
 *   TIER 3 — OBSERVATION NAVE: Radius-5.5 barrel reaching +Z from z=-3 to z=21 (centre z=9),
 *             5-row panelSkin, dense clerestory grid on both flanks, faceted prow with 16-pane
 *             violet rose window behind dark tracery and a centre-glow cylinder.
 *   TIER 4 — SECT SHRINES: Six folded-sail shrines on plated spars at y=10, each with
 *             4 violet vane panels (Wakeglass, dulled, mullioned) and candle lamp at core.
 *   TIER 5 — CROWN: Antenna forest (9 masts); surface greebles (65 hatches/vents) scattered
 *             over entire mass.
 *
 * Ring concept — PROCESSION (ringY = -15.0):
 *   Six intimate chapel pods on a radius-12 hoop with dark silver plating. Each pod carries
 *   three glazed violet Wakeglass panes (dulled, with dark mullions) and two near-white
 *   candle lamps. Six radial spokes tie pods to a plated silver hub; 18 rim lamps line the
 *   outer torus. The whole ring precesses rimward on the belly of the ark at 0.05 rad/s.
 *
 * Palette roles:
 *   hull       0x232a44 midnight blue (structure)
 *   hullDark   0x161b2e midnight black (ribs, seams, truss)
 *   trim       0xa8b0b8 weathered silver (plating, cladding)
 *   accent     0xd8a25a candle amber (service lamps, fixtures)
 *   patch[0]   0x8a7bd8 violet Wakeglass (sacred material — glaze only)
 *   patch[1]   0xa8b0b8 (duplicate of trim, weathered silver)
 *   Deduplicated base set: 5 colours × 4 SHADES = 20 allowed hull values.
 *
 * Glow channels use near-neutral tints (0xffffff, 0xfff2e2, 0xe8dcc8) so the amber pulse
 * remains amber. Violet Wakeglass (0x8a7bd8) lives in glaze channels only — dulled,
 * mullioned, never one saturated slab (rose window: 16 panes; shrine vanes: 4 per shrine;
 * ring pods: 3 panes each).
 *
 * Measured (wave 45 self-check):
 *   parts 2513 | totalVerts 291390 | glowVerts 31356
 *   bbox x [-21.4, 22.2] | y [-16.8, 26.3] | z [-17.1, 28.3]
 *   strays [] | isolated 0/589 (0.00%) | orphanGlow 0.00% | orphanGlaze 0.00%
 *
 * Seed: 4505 for rng() and panelSkin.
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone, ribBands,
  windowRow, windowGrid, portholeRing, panelSkin, panelPatches, truss, railing,
  bridge, airlock, pipeRun, antenna, ladder, radiatorPanel, lampString, crate,
} from '../station-detail.js';

export const congregationStation = {
  ringY: -15.0,
  build(b, ringB, st) {
    const rand = rng(4505);
    const W = weather;

    // Base palette (FACTION_STYLE)
    const MIDNIGHT = st.hull;       // 0x232a44 midnight blue
    const DARK = st.hullDark;       // 0x161b2e midnight black
    const SILVER = st.trim;         // 0xa8b0b8 weathered silver
    const AMBER = st.accent;        // 0xd8a25a candle amber
    const VIOLET = st.patch[0];     // 0x8a7bd8 violet Wakeglass (sacred material)

    // Plate sets: mottled skins, every entry derived from a BASE colour
    const P_MIDNIGHT = [MIDNIGHT, MIDNIGHT, W(MIDNIGHT, 1), W(MIDNIGHT, 2), W(MIDNIGHT, 3)];
    const P_SILVER = [SILVER, SILVER, W(SILVER, 1), W(SILVER, 2), W(SILVER, 3)];
    const P_MIX = [MIDNIGHT, SILVER, W(MIDNIGHT, 1), W(SILVER, 1), W(MIDNIGHT, 2), W(SILVER, 2)];
    const P_VIOLET = [VIOLET, W(VIOLET, 1), W(VIOLET, 2), W(SILVER, 3)]; // violet in glaze, not hull

    // Window tints — near-neutral so the amber pulse keeps its hue
    const LIT = 0xffffff;
    const LIT_WARM = 0xfff2e2;
    const LIT_DIM = 0xe8dcc8;

    // -------------------------------------------------------------- drum module --
    // Pressurised drum: barrel, plate skin, rib bands, end caps with bolt rings, window fields
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
        torus(b, 'hull', W(SILVER, 1), r * 0.78, 0.09, 6, 20, undefined, ring);
        torus(b, 'hull', DARK, r * 0.34, 0.08, 6, 14, undefined, ring);
        cyl(b, 'hull', W(SILVER, 2), r * 0.2, r * 0.2, 0.5, 12, alongX ? { x: s * (l / 2 + 0.7), rz: Math.PI / 2 } : { z: s * (l / 2 + 0.7), rx: Math.PI / 2 });
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

    // ----------------------------------------------------------- chapel module --
    // Chapel drum: plated collar, ribbed dome cap, porthole ring, window band
    const chapel = (o) => {
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
        cyl(b, 'hull', SILVER, r * 0.3, r * 0.34, 2.4, 14, { y: r * 0.92 + 1.6 });
        portholeRing(b, 'glow', LIT, { r: r * 0.35, count: 8, size: 0.26, y: r * 0.92 + 1.8 });
        hemi(b, 'hull', cap, r * 0.33, 14, 8, { y: r * 0.92 + 2.8 });
      }
      b.pop();
    };

    // -------------------------------------------------------------- tank module --
    const tank = (x, y, z, r, skin, plates, seed) => {
      b.push(x, y, z, 0, 0, 0);
      sphere(b, 'hull', skin, r, 20, 14);
      ribBands(b, 'hull', DARK, { r: r * 1.01, tube: 0.14, from: -r * 0.55, to: r * 0.55, count: 3, axis: 'y', tseg: 20 });
      panelSkin(b, 'hull', plates, { r: r * 0.97, from: -r * 0.45, to: r * 0.45, rows: 2, cols: 12, seed, t: 0.14, axis: 'y' });
      portholeRing(b, 'glow', LIT_DIM, { r: r * 1.01, count: 8, size: 0.26, y: r * 0.35 });
      cyl(b, 'hull', DARK, 0.42, 0.42, r * 1.6, 8, { y: -r * 1.15 });
      b.pop();
    };

    // ---------------------------------------------------------- TIER 0: BELLY --
    // Pilgrim dormitory drums (5 along X), water tanks, pipe runs
    const BELLY = [
      { z: -12, l: 22, x: 1, skin: SILVER, cap: W(MIDNIGHT, 1), roof: W(MIDNIGHT, 2), plates: P_SILVER },
      { z: -5, l: 28, x: -1.2, skin: W(SILVER, 1), cap: SILVER, roof: MIDNIGHT, plates: P_SILVER },
      { z: 2, l: 31, x: 0.3, skin: MIDNIGHT, cap: SILVER, roof: W(MIDNIGHT, 1), plates: P_MIDNIGHT },
      { z: 9, l: 27, x: -1.5, skin: SILVER, cap: W(MIDNIGHT, 1), roof: W(MIDNIGHT, 2), plates: P_SILVER },
      { z: 16, l: 23, x: 0.8, skin: W(SILVER, 2), cap: SILVER, roof: MIDNIGHT, plates: P_MIX },
    ];
    BELLY.forEach((d, i) => drum({
      x: d.x, y: -10, z: d.z, r: 4.8, l: d.l, axis: 'x',
      skin: d.skin, cap: d.cap, roof: d.roof, plates: d.plates,
      rows: 5, cols: 16, winRows: 3, winCols: 11, seed: 4510 + i,
    }));

    // Airlock collars stitching neighbouring belly drums
    for (let i = 0; i < BELLY.length - 1; i++) {
      for (const ax of [-7, 7]) {
        airlock(b, 'hull', W(SILVER, 1), DARK, {
          ax, ay: -10, az: BELLY[i].z + 1.4, bx: ax, by: -10, bz: BELLY[i + 1].z - 1.4, r: 1.5, seg: 12, rings: 2,
        });
      }
    }

    // Water tanks at belly edges
    tank(-18, -7.5, -10, 3.2, W(SILVER, 1), P_SILVER, 4540);
    tank(-17, -6.8, 8, 2.8, SILVER, P_MIX, 4541);
    tank(19, -7.2, -6, 3.0, W(SILVER, 2), P_SILVER, 4542);
    tank(18, -6.5, 11, 2.6, SILVER, P_MIX, 4543);

    // Belly pipe runs
    const BELLY_PIPES = [
      [-18, -5.2, -10, -12, -4.8, -5], [-17, -4.8, 8, -10, -4.4, 6],
      [19, -5.0, -6, 14, -4.6, -2], [18, -4.6, 11, 13, -4.2, 8],
    ];
    for (const [x0, y0, z0, x1, y1, z1] of BELLY_PIPES) {
      pipeRun(b, 'hull', W(SILVER, 1), { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, r: 0.19, seg: 8, collars: 4 });
    }

    // ------------------------------------------------------ TIER 1: SECT BAYS --
    // Six chapel drums packed around the keep base (y = -4 to 2)
    const SECT_BAYS = [
      { x: -9, z: -6, r: 4.2 }, { x: 8, z: -7, r: 4.0 },
      { x: -7, z: 5, r: 3.8 }, { x: 10, z: 4, r: 4.1 },
      { x: 0, z: -9, r: 3.6 }, { x: 2, z: 8, r: 3.9 },
    ];
    SECT_BAYS.forEach((d, i) => chapel({
      x: d.x, y: -3.5, z: d.z, r: d.r, skin: W(SILVER, 1 + (i % 2)), cap: W(MIDNIGHT, 1 + (i % 3)), plates: P_SILVER, seed: 4520 + i, cupola: i < 3, ribs: 6 + i,
    }));

    // Airlocks connecting sect bays to belly
    for (const d of SECT_BAYS) {
      airlock(b, 'hull', W(SILVER, 2), DARK, { ax: d.x, ay: -5.5, az: d.z, bx: d.x, by: -7.5, bz: d.z, r: 1.3, seg: 10, rings: 1 });
    }

    // Bridges between neighbouring sect bays
    const SECT_BRIDGES = [
      [-9, -2.8, -6, -7, -2.6, 5], [8, -2.8, -7, 10, -2.6, 4],
      [0, -2.8, -9, 2, -2.6, 8], [-7, -2.8, 5, 0, -2.6, 8],
    ];
    for (const [x0, y0, z0, x1, y1, z1] of SECT_BRIDGES) {
      bridge(b, 'hull', W(MIDNIGHT, 1), DARK, { ax: x0, ay: y0, az: z0, bx: x1, by: y1, bz: z1, w: 1.6, railH: 0.75, posts: 5 });
    }

    // ---------------------------------------------------- TIER 2: CENTRAL KEEP --
    // Tall plated drum with lantern crown
    b.push(0, 6, 0, 0, 0, 0);
    cyl(b, 'hull', W(MIDNIGHT, 1), 7.5, 8.0, 14, 24);
    panelSkin(b, 'hull', P_MIDNIGHT, { r: 8.0, from: -6.5, to: 6.5, rows: 7, cols: 20, seed: 4530, t: 0.22, axis: 'y' });
    ribBands(b, 'hull', DARK, { r: 8.1, tube: 0.22, from: -6, to: 6, count: 7, axis: 'y', tseg: 24 });
    // Clerestory windows on keep flanks
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      windowGrid(b, 'glow', LIT, { rows: 4, cols: 2, rowGap: 2.0, colGap: 1.0, w: 0.8, h: 1.2, d: 0.7,
        x: Math.cos(a) * 8.15, y: 0, z: Math.sin(a) * 8.15, axis: 'y', ry: a });
    }
    // Lantern crown
    cyl(b, 'hull', SILVER, 4.0, 4.5, 4.0, 18, { y: 9.0 });
    panelSkin(b, 'hull', P_SILVER, { r: 4.5, from: -1.8, to: 1.8, rows: 2, cols: 12, seed: 4531, t: 0.18, axis: 'y' });
    ribBands(b, 'hull', DARK, { r: 4.6, tube: 0.18, from: -1.5, to: 1.5, count: 2, axis: 'y', tseg: 18 });
    portholeRing(b, 'glow', LIT_WARM, { r: 4.6, count: 12, size: 0.42, y: 9.5 });
    // Beacon atop lantern
    cyl(b, 'hull', DARK, 0.5, 0.7, 2.5, 12, { y: 13.0 });
    box(b, 'glow', LIT, 0.8, 0.8, 0.8, { y: 14.5 });
    cone(b, 'hull', W(MIDNIGHT, 1), 0.3, 1.8, 8, { y: 15.5 });
    b.pop();

    // Airlocks from keep to sect bays
    for (const d of SECT_BAYS) {
      airlock(b, 'hull', W(SILVER, 1), DARK, { ax: d.x * 0.6, ay: 0.5, az: d.z * 0.6, bx: d.x, by: -1.5, bz: d.z, r: 1.4, seg: 12, rings: 2 });
    }

    // -------------------------------------------------- TIER 3: OBSERVATION NAVE --
    // Long barrel reaching +Z, clerestory windows, rose window at prow
    b.push(0, 4, 9, 0, 0, 0);
    const NAVE_LEN = 24;
    cyl(b, 'hull', W(SILVER, 1), 5.5, 5.5, NAVE_LEN, 22, { rx: Math.PI / 2 });
    panelSkin(b, 'hull', P_SILVER, { r: 5.7, from: -NAVE_LEN / 2 + 1.0, to: NAVE_LEN / 2 - 1.0, rows: 5, cols: 18, seed: 4532, t: 0.2, axis: 'z' });
    ribBands(b, 'hull', DARK, { r: 5.8, tube: 0.2, from: -NAVE_LEN / 2 + 2, to: NAVE_LEN / 2 - 2, count: 6, axis: 'z', tseg: 22 });
    // Clerestory windows — 4 banded strips along nave flanks, sunk to cylinder face.
    // 22-seg r=5.5: flat face at 5.5*cos(π/22)≈5.44. 2-row band H=0.75+0.60=1.35 → NX≈5.27.
    // Cols run along nave Z (4 per strip × 4 strips × 2 rows × 2 sides = 64 boxes).
    {
      const NRF = 5.5 * Math.cos(Math.PI / 22);          // flat-face radius ≈ 5.44
      const NX  = Math.sqrt(NRF * NRF - 1.35 * 1.35);    // sunk centre ≈ 5.27
      // strip centres sit between the 6 rib bands (local z ≈ −10,−6,−2,2,6,10)
      for (const side of [-1, 1]) {
        const bx  = side * NX;
        const bry = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        // Dark buttress pilasters between the four strips
        for (const pz of [-5.75, -1.0, 4.0]) {
          box(b, 'hull', DARK, 0.22, 3.6, 0.20, { x: side * NRF, y: 1.2, z: pz, ry: bry });
        }
        for (const sz of [-8.0, -3.5, 1.5, 6.5]) {
          for (let ri = 0; ri < 2; ri++) {
            const wy  = 1.2 + (ri === 0 ? -0.75 : 0.75);
            const lit = ri === 0 ? LIT : LIT_WARM;
            for (let ci = 0; ci < 4; ci++) {
              box(b, 'glow', lit, 0.78, 1.2, 0.7, { x: bx, y: wy, z: sz + (ci - 1.5) * 1.0, ry: bry });
            }
          }
        }
      }
    }
    // Faceted prow with rose window
    b.push(0, 0, NAVE_LEN / 2 + 2, 0, 0, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      box(b, 'hull', DARK, 0.3, 6.0, 0.3, { x: Math.cos(a) * 4.8, y: 0, z: 2.5, ry: a });
    }
    // Rose window — glazed violet panes behind dark tracery
    const ROSE_R = 3.8;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
      // Dark tracery ribs
      box(b, 'hull', DARK, 0.18, ROSE_R * 0.7, 0.18, { x: Math.cos(a) * ROSE_R * 0.4, y: 0, z: ROSE_R * 0.4 + 2.5, ry: a });
      // Violet panes (dulled, mullioned)
      b.push(Math.cos(a) * ROSE_R * 0.65, 0, ROSE_R * 0.65 + 2.5, 0, 0, 0);
      box(b, 'glaze', W(VIOLET, 2), 0.6, 1.2, 0.12, { ry: a });
      b.pop();
    }
    // Centre glow of rose window
    cyl(b, 'glow', LIT_WARM, 0.8, 0.8, 0.3, 12, { z: 2.5 });
    b.pop();
    b.pop(); // Close nave frame

    // Airlock from nave to keep
    airlock(b, 'hull', W(SILVER, 1), DARK, { ax: 0, ay: 4, az: 2, bx: 0, by: 5, bz: 5, r: 1.6, seg: 12, rings: 2 });

    // ---------------------------------------------------- TIER 4: SECT SHRINES --
    // Folded-sail shrines: glazed violet vanes cupped toward keep
    const SHRINE_SITES = [
      { x: -11, z: -10 }, { x: 12, z: -9 }, { x: -10, z: 9 },
      { x: 13, z: 8 }, { x: -4, z: -13 }, { x: 5, z: 12 },
    ];
    SHRINE_SITES.forEach((site, i) => {
      b.push(site.x, 10, site.z, 0, 0, 0);
      // Plated spar
      box(b, 'hull', W(MIDNIGHT, 1), 2.5, 0.4, 3.5, { y: -0.5 });
      cyl(b, 'hull', SILVER, 0.4, 0.4, 4.0, 8, { y: 1.5 });
      // Folded vanes of glazed violet
      for (let v = 0; v < 4; v++) {
        if (site.x < 0 && v === 2) continue; // omit radially-outward blade on −X shrines
        const va = (v / 4) * Math.PI * 2;
        b.push(0, 2.5, 0, 0, va, 0);
        box(b, 'glaze', W(VIOLET, 2), 2.8, 1.8, 0.15, { x: 1.4, rx: -0.3 });
        // Dark mullions
        box(b, 'hull', DARK, 0.12, 1.6, 0.18, { x: 2.0, rx: -0.3 });
        box(b, 'hull', DARK, 0.12, 1.6, 0.18, { x: 0.8, rx: -0.3 });
        b.pop();
      }
      // Candle lamp at shrine heart
      box(b, 'glow', LIT_WARM, 0.4, 0.4, 0.4, { y: 0.8 });
      b.pop();
      // Airlock to keep
      airlock(b, 'hull', W(SILVER, 2), DARK, { ax: site.x * 0.7, ay: 6.5, az: site.z * 0.7, bx: site.x, by: 9.5, bz: site.z, r: 1.2, seg: 10, rings: 1 });
    });

    // ---------------------------------------------------- TIER 5: LANTERN CROWN --
    // Antenna forest atop keep and surrounding structures
    const ANTENNAS = [
      [-9, -2.8, -6, 8, 0], [8, -2.8, -7, 9, 1.2], [0, -2.8, -9, 10, 0],
      [0, 14, 0, 12, 0], [-11, 10, -10, 7, 0], [12, 10, -9, 8, 1.4],
      [0, 4, 19, 9, 0], [-4, 10, -13, 6, 0], [5, 10, 12, 7, 1.1],
    ];
    for (const [ax0, ay0, az0, ah, adish] of ANTENNAS) {
      antenna(b, 'hull', DARK, W(SILVER, 1), { x: ax0, y: ay0, z: az0, h: ah, r: 0.14, tip: 0.34, dish: adish });
    }

    // Surface greebles over the whole mass
    for (let i = 0; i < 65; i++) {
      const gx = -16 + rand() * 32;
      const gz = -14 + rand() * 28;
      const gy = -8 + rand() * 20;
      box(b, 'hull', [DARK, W(SILVER, 2), W(MIDNIGHT, 1), DARK][i % 4],
        0.6 + rand() * 0.8, 0.45 + rand() * 0.5, 0.45 + rand() * 0.6,
        { x: gx, y: gy, z: gz, ry: rand() * Math.PI });
      if (i % 3 === 0) box(b, 'glow', LIT_DIM, 0.36, 0.28, 0.26, { x: gx + 0.5, y: gy + 0.3, z: gz });
    }

    // ------------------------------------------------------------ BELLY GIRDERS --
    // Trusswork under belly, connecting structure
    truss(b, 'hull', DARK, { ax: -18, ay: -14.5, az: 0, bx: 18, by: -14.5, bz: 0, bays: 9, thickness: 0.34, spread: 1.2 });
    for (const kx of [-12, -3, 6, 14]) {
      truss(b, 'hull', DARK, { ax: kx, ay: -14.5, az: -11, bx: kx, by: -14.5, bz: 11, bays: 5, thickness: 0.26, spread: 0.9 });
      airlock(b, 'hull', W(SILVER, 2), DARK, { ax: kx, ay: -12.8, az: 0, bx: kx, by: -14.5, bz: 0, r: 1.1, seg: 10, rings: 1 });
    }

    // ------------------------------------------------------------- PROCESSION --
    // Six chapel pods on radius-12 hoop, each with glazed violet window and candle lamp
    const R = 12;
    torus(ringB, 'ringHull', W(MIDNIGHT, 1), R, 1.0, 8, 36, undefined, { rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DARK, R, 0.30, 6, 36, undefined, { y: 0.85, rx: Math.PI / 2 });
    torus(ringB, 'ringHull', DARK, R, 0.30, 6, 36, undefined, { y: -0.85, rx: Math.PI / 2 });
    // Plated hub
    cyl(ringB, 'ringHull', SILVER, 2.0, 2.2, 1.8, 16);
    panelSkin(ringB, 'ringHull', P_SILVER, { r: 2.4, from: -0.8, to: 0.8, rows: 2, cols: 10, seed: 4560, t: 0.14, axis: 'y' });
    ribBands(ringB, 'ringHull', DARK, { r: 2.5, tube: 0.14, from: -0.6, to: 0.6, count: 2, axis: 'y', tseg: 16 });
    // Spokes
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(ringB, 'ringHull', DARK, R - 2.0, 0.38, 0.32, { x: Math.cos(a) * (R / 2), z: Math.sin(a) * (R / 2), ry: -a });
    }
    // Six chapel pods
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ringB.push(Math.cos(a) * R, 0, Math.sin(a) * R, -a, 0, 0);
      // Pod hull
      box(ringB, 'ringHull', W(SILVER, 1), 2.0, 0.35, 3.4, { y: 0.4 });
      // Glazed violet window (dulled, mullioned)
      for (let p = 0; p < 3; p++) {
        ringB.push(0, 1.2, -1.2 + p * 1.2, 0, 0, 0);
        box(ringB, 'ringGlaze', W(VIOLET, 2), 0.8, 0.9, 0.12, { z: 0.6 });
        box(ringB, 'ringHull', DARK, 0.10, 0.8, 0.14, { z: 0.95 });
        box(ringB, 'ringHull', DARK, 0.10, 0.8, 0.14, { z: 0.25 });
        ringB.pop();
      }
      // Candle lamps
      box(ringB, 'ringGlow', LIT_WARM, 0.32, 0.24, 0.24, { y: 0.25, z: 1.4 });
      box(ringB, 'ringGlow', LIT_WARM, 0.32, 0.24, 0.24, { y: 0.25, z: -1.4 });
      ringB.pop();
    }
    // Rim lamps
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + Math.PI / 18;
      box(ringB, 'ringGlow', LIT, 0.28, 0.28, 0.24, { x: Math.cos(a) * (R + 0.9), z: Math.sin(a) * (R + 0.9), ry: -a });
    }

    // Airlock from station belly to ring
    airlock(b, 'hull', W(SILVER, 2), DARK, { ax: 0, ay: -12.8, az: 0, bx: 0, by: -15.0, bz: 0, r: 1.5, seg: 12, rings: 2 });
  },
};
