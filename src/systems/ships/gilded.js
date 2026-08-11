/**
 * Gilded Chain - "Auction Chariot", ceremonial black-ceramic scimitar with overlapping
 * ivory and gold scale armor, swept gold stern fins, and cold turquoise gallery strip.
 *
 * Reference art: docs/FactionExamples/05-gilded-chain-ship.png
 * Silhouette: extremely long low predatory blade, ivory cutwater prow taking ~35% of
 * total length, narrow black-ceramic spine body covered in overlapping scale bands,
 * tapered stern with swept gold fins, turquoise side gallery running the full body.
 *
 * Design language:
 * - Hull form: Z-aligned spine cylinder (nose -Z, stern +Z), ivory prow wedge forward
 * - Armor signature: overlapping scale bands using panelSkin/panelPatches, axis:'z'
 * - Ivory forward shell: long narrow wedge at bow with pale tile panelSkin
 * - Black ceramic dorsal and side armor: dark scale plates with gold trim collars
 * - Gold structural filigree: raised ribBands, torus collars framing panel boundaries
 * - Turquoise gallery strip: port-side hull box with centered windowRow, no offset
 * - Stern features: swept gold fin (starboard), raised dorsal sail, Z-aligned propulsion
 *
 * Coordinate system: nose at -Z, stern at +Z, port at -X, starboard at +X, up at +Y.
 *
 * Round-2 envelopes (max abs x/y/z):
 *   light:     1.3 / 0.9 / 3.4   r=2.2-3.5   hull ~5k    lights ~600
 *   cutter:    1.8 / 1.2 / 5.0   r=3.0-5.0   hull ~7k    lights ~780
 *   ace:       2.2 / 1.3 / 5.8   r=4.4-5.8   hull ~8k    lights ~870
 *   freighter: 2.8 / 2.0 / 7.4   r=4.4-7.2   hull ~11k   lights ~1200
 *   heavy:     3.6 / 2.4 / 8.8   r=6.0-9.0   hull ~15k   lights ~1700
 *   frigate:   9.0 / 6.0 / 26.0  r=21-32     hull ~28k   lights ~2800
 */

import {
  weather, box, cyl, torus,
  ribBands, windowRow, panelSkin, panelPatches, lampString,
} from '../station-detail.js';

export const gildedShip = {

  // ─────────────────────────────────────────────────────────────────────────────
  light: {
    glowZ: 2.85,
    build(b, st) {
      const BK = st.hull;      // black ceramic
      const BD = st.hullDark;  // dark shadow
      const IV = st.trim;      // ivory
      const GD = st.accent;    // gold
      const W  = weather;

      const P_BK = [BK, BK, W(BK,1), W(BD,1)];
      const P_IV = [IV, IV, W(IV,1), W(IV,2)];

      const LIT = 0xffffff;
      const LW  = 0xfff2d8;
      const LC  = 0xf0f8ff;
      const LD  = 0xe8dcc8;

      b.push(0, 0, 0, 0, 0, 0);

      // ── Spine (Z-aligned, rx:PI/2) ─ r=0.42, len=4.4, centered at z=-0.1
      // z: -2.3 to +2.1
      cyl(b, 'hull', BK, 0.42, 0.42, 4.4, 9, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.42, from: -2.2, to: 1.8, rows: 4, cols: 9, seed: 7055, t: 0.10, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.50, tube: 0.055, from: -1.6, to: 1.5, count: 3, axis: 'z', tseg: 8 });
      panelPatches(b, 'hull', P_BK, { r: 0.55, from: -0.8, to: 1.6, count: 12, seed: 7057, w: 0.72, h: 0.50, t: 0.09, axis: 'z' });

      // ── Ivory cutwater prow ─ box centered at z=-2.48
      // z: -3.36 to -1.60 (clear of the 3.4 float64 boundary)
      box(b, 'hull', IV, 0.50, 0.35, 1.76, { z: -2.48 });
      panelSkin(b, 'hull', P_IV, { r: 0.36, from: -3.2, to: -1.7, rows: 3, cols: 5, seed: 7056, t: 0.08, axis: 'z' });
      panelPatches(b, 'hull', P_IV, { r: 0.42, from: -2.9, to: -1.8, count: 8, seed: 7058, w: 0.55, h: 0.38, t: 0.08, axis: 'z' });
      torus(b, 'hull', GD, 0.32, 0.045, 3, 5, undefined, { z: -1.68, rx: Math.PI/2 });

      // ── Port-side turquoise gallery strip ─ push(-0.78, 0.08, -0.10)
      // Backing box centered in push frame; windows at x=0, z=0 spread along z
      b.push(-0.88, 0.08, -0.10, 0, 0, 0);
      box(b, 'hull', BK, 0.28, 0.46, 4.50);
      panelSkin(b, 'hull', P_BK, { r: 0.18, from: -2.1, to: 2.1, rows: 2, cols: 6, seed: 7059, t: 0.06, axis: 'z' });
      windowRow(b, 'lights', LC, { count: 5, spacing: 0.62, w: 0.15, h: 0.14, d: 0.16, x: 0, y: 0.19, z: 0, axis: 'z' });
      b.pop();

      // ── Starboard swept stern fin ─ push(0.72, 0, 0, 0, 0.13, 0)
      // Box at local z=2.70; world x_tip≈1.24, world z_tip≈2.97
      b.push(0.72, 0, 0, 0, 0.13, 0);
      box(b, 'hull', IV, 0.27, 0.14, 0.58, { z: 2.70 });
      panelSkin(b, 'hull', P_IV, { r: 0.11, from: 2.38, to: 2.98, rows: 2, cols: 3, seed: 7060, t: 0.05, axis: 'z' });
      torus(b, 'hull', GD, 0.20, 0.036, 3, 5, undefined, { z: 2.45, rx: Math.PI/2 });
      b.pop();

      // ── Dorsal sail ─ push(0, 0.50, -0.10)
      // Box at local z=1.80; max world y=0.64
      b.push(0, 0.50, -0.10, 0, 0, 0);
      box(b, 'hull', BK, 0.52, 0.28, 1.00, { z: 1.80 });
      panelSkin(b, 'hull', P_BK, { r: 0.18, from: 1.22, to: 2.28, rows: 2, cols: 4, seed: 7061, t: 0.05, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.22, tube: 0.038, from: 1.32, to: 2.18, count: 2, axis: 'z', tseg: 5 });
      b.pop();

      // ── Under-hull propulsion ─ push(0, -0.50, 1.80)
      // Z-aligned thruster; min world y=-0.72
      b.push(0, -0.50, 1.80, 0, 0, 0);
      cyl(b, 'hull', BD, 0.22, 0.22, 0.85, 7, { rx: Math.PI/2 });
      cyl(b, 'lights', LC, 0.155, 0.155, 0.60, 7, { rx: Math.PI/2 });
      b.pop();

      // ── Side machinery pods ─ pairs along z at mid-body
      b.push(-0.62, 0.12, 0.40, 0, 0, 0);
      cyl(b, 'hull', BK, 0.24, 0.24, 0.58, 5, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.24, from: -0.24, to: 0.24, rows: 2, cols: 3, seed: 7062, t: 0.05, axis: 'z' });
      cyl(b, 'lights', LD, 0.11, 0.11, 0.32, 5, { rx: Math.PI/2 });
      b.pop();

      b.push(-0.62, 0.12, -0.50, 0, 0, 0);
      cyl(b, 'hull', BK, 0.24, 0.24, 0.58, 5, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.24, from: -0.24, to: 0.24, rows: 2, cols: 3, seed: 7063, t: 0.05, axis: 'z' });
      cyl(b, 'lights', LD, 0.11, 0.11, 0.32, 5, { rx: Math.PI/2 });
      b.pop();

      // ── Running lights + lamp strings
      box(b, 'lights', LIT, 0.08, 0.08, 0.08, { x: -0.88, y: 0.12, z:  0.18 });
      box(b, 'lights', LIT, 0.08, 0.08, 0.08, { x: -0.88, y: 0.12, z: -0.18 });
      box(b, 'lights', LC,  0.10, 0.10, 0.10, { x:  0.72, y: 0.20, z:  2.60 });
      lampString(b, 'lights', LW, { ax: -0.62, ay: 0.54, az: -1.5, bx: 0.46, by: 0.54, bz: 1.8, count: 4, size: 0.09 });

      b.pop();
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  cutter: {
    glowZ: 3.95,
    build(b, st) {
      const BK = st.hull;
      const BD = st.hullDark;
      const IV = st.trim;
      const GD = st.accent;
      const W  = weather;

      const P_BK = [BK, BK, W(BK,1), W(BD,1)];
      const P_IV = [IV, IV, W(IV,1), W(IV,2)];

      const LIT = 0xffffff;
      const LW  = 0xfff2d8;
      const LC  = 0xf0f8ff;
      const LD  = 0xe8dcc8;

      b.push(0, 0, 0, 0, 0, 0);

      // ── Spine ─ r=0.58, len=6.2, centered at z=-0.15
      // z: -3.25 to +2.95
      cyl(b, 'hull', BK, 0.58, 0.58, 6.20, 11, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.58, from: -3.1, to: 2.7, rows: 5, cols: 11, seed: 7010, t: 0.12, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.68, tube: 0.070, from: -2.4, to: 2.2, count: 3, axis: 'z', tseg: 10 });
      panelPatches(b, 'hull', P_BK, { r: 0.74, from: -1.2, to: 2.2, count: 18, seed: 7012, w: 0.92, h: 0.65, t: 0.11, axis: 'z' });

      // ── Ivory prow ─ centered at z=-3.80, z: -4.75 to -2.85
      box(b, 'hull', IV, 0.72, 0.50, 1.90, { z: -3.80 });
      panelSkin(b, 'hull', P_IV, { r: 0.50, from: -4.65, to: -2.95, rows: 3, cols: 6, seed: 7011, t: 0.10, axis: 'z' });
      panelPatches(b, 'hull', P_IV, { r: 0.58, from: -4.55, to: -3.05, count: 10, seed: 7013, w: 0.70, h: 0.50, t: 0.09, axis: 'z' });
      torus(b, 'hull', GD, 0.44, 0.058, 3, 7, undefined, { z: -2.92, rx: Math.PI/2 });

      // ── Port gallery ─ push(-1.08, 0.10, -0.15)
      b.push(-1.08, 0.10, -0.15, 0, 0, 0);
      box(b, 'hull', BK, 0.38, 0.58, 6.50);
      panelSkin(b, 'hull', P_BK, { r: 0.24, from: -3.0, to: 3.0, rows: 2, cols: 8, seed: 7014, t: 0.08, axis: 'z' });
      windowRow(b, 'lights', LC, { count: 7, spacing: 0.68, w: 0.18, h: 0.16, d: 0.18, x: 0, y: 0.24, z: 0, axis: 'z' });
      b.pop();

      // ── Swept fin ─ push(1.00, 0, 0, 0, 0.13, 0)
      // local z=3.40: world x_tip≈1.58, world z_tip≈3.71
      b.push(1.00, 0, 0, 0, 0.13, 0);
      box(b, 'hull', IV, 0.37, 0.19, 0.82, { z: 3.40 });
      panelSkin(b, 'hull', P_IV, { r: 0.14, from: 2.97, to: 3.79, rows: 2, cols: 4, seed: 7015, t: 0.06, axis: 'z' });
      torus(b, 'hull', GD, 0.27, 0.044, 3, 6, undefined, { z: 3.10, rx: Math.PI/2 });
      b.pop();

      // ── Dorsal sail ─ push(0, 0.68, -0.15)
      b.push(0, 0.68, -0.15, 0, 0, 0);
      box(b, 'hull', BK, 0.70, 0.37, 1.40, { z: 2.30 });
      panelSkin(b, 'hull', P_BK, { r: 0.24, from: 1.48, to: 3.08, rows: 2, cols: 5, seed: 7016, t: 0.07, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.28, tube: 0.046, from: 1.60, to: 2.96, count: 2, axis: 'z', tseg: 6 });
      b.pop();

      // ── Propulsion ─ push(0, -0.68, 2.30)
      b.push(0, -0.68, 2.30, 0, 0, 0);
      cyl(b, 'hull', BD, 0.30, 0.30, 1.10, 8, { rx: Math.PI/2 });
      cyl(b, 'lights', LC, 0.21, 0.21, 0.78, 7, { rx: Math.PI/2 });
      b.pop();

      // ── Side pods
      b.push(-0.86, 0.16, 0.55, 0, 0, 0);
      cyl(b, 'hull', BK, 0.32, 0.32, 0.78, 7, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.32, from: -0.32, to: 0.32, rows: 2, cols: 4, seed: 7017, t: 0.06, axis: 'z' });
      cyl(b, 'lights', LD, 0.14, 0.14, 0.42, 6, { rx: Math.PI/2 });
      b.pop();

      b.push(-0.86, 0.16, -0.65, 0, 0, 0);
      cyl(b, 'hull', BK, 0.32, 0.32, 0.78, 7, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.32, from: -0.32, to: 0.32, rows: 2, cols: 4, seed: 7018, t: 0.06, axis: 'z' });
      cyl(b, 'lights', LD, 0.14, 0.14, 0.42, 6, { rx: Math.PI/2 });
      b.pop();

      // ── Running lights + lamp strings
      box(b, 'lights', LIT, 0.11, 0.11, 0.11, { x: -1.08, y: 0.14, z:  0.22 });
      box(b, 'lights', LIT, 0.11, 0.11, 0.11, { x: -1.08, y: 0.14, z: -0.22 });
      box(b, 'lights', LC,  0.13, 0.13, 0.13, { x:  1.00, y: 0.28, z:  3.50 });
      lampString(b, 'lights', LW, { ax: -0.88, ay: 0.72, az: -2.0, bx: 0.60, by: 0.72, bz: 2.5, count: 5, size: 0.12 });

      b.pop();
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  ace: {
    glowZ: 4.65,
    build(b, st) {
      const BK = st.hull;
      const BD = st.hullDark;
      const IV = st.trim;
      const GD = st.accent;
      const W  = weather;

      const P_BK = [BK, BK, W(BK,1), W(BD,1)];
      const P_IV = [IV, IV, W(IV,1), W(IV,2)];

      const LIT = 0xffffff;
      const LW  = 0xfff2d8;
      const LC  = 0xf0f8ff;
      const LD  = 0xe8dcc8;

      b.push(0, 0, 0, 0, 0, 0);

      // ── Spine ─ r=0.62, len=7.20, centered at z=-0.20
      // z: -3.8 to +3.4
      cyl(b, 'hull', BK, 0.62, 0.62, 7.20, 11, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.62, from: -3.6, to: 3.2, rows: 5, cols: 11, seed: 7045, t: 0.12, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.73, tube: 0.075, from: -2.8, to: 2.6, count: 4, axis: 'z', tseg: 10 });
      panelPatches(b, 'hull', P_BK, { r: 0.80, from: -1.5, to: 2.6, count: 20, seed: 7047, w: 1.05, h: 0.72, t: 0.12, axis: 'z' });

      // ── Ivory prow ─ centered at z=-4.60, z: -5.65 to -3.55
      box(b, 'hull', IV, 0.85, 0.60, 2.10, { z: -4.60 });
      panelSkin(b, 'hull', P_IV, { r: 0.58, from: -5.55, to: -3.65, rows: 3, cols: 7, seed: 7046, t: 0.10, axis: 'z' });
      panelPatches(b, 'hull', P_IV, { r: 0.66, from: -5.45, to: -3.75, count: 12, seed: 7048, w: 0.82, h: 0.58, t: 0.10, axis: 'z' });
      torus(b, 'hull', GD, 0.50, 0.064, 3, 8, undefined, { z: -3.62, rx: Math.PI/2 });

      // ── Port gallery ─ push(-1.22, 0.12, -0.20)
      b.push(-1.22, 0.12, -0.20, 0, 0, 0);
      box(b, 'hull', BK, 0.44, 0.66, 7.30);
      panelSkin(b, 'hull', P_BK, { r: 0.28, from: -3.4, to: 3.4, rows: 2, cols: 9, seed: 7049, t: 0.09, axis: 'z' });
      windowRow(b, 'lights', LC, { count: 8, spacing: 0.72, w: 0.20, h: 0.18, d: 0.20, x: 0, y: 0.27, z: 0, axis: 'z' });
      b.pop();

      // ── Swept fin ─ push(1.18, 0, 0, 0, 0.13, 0)
      // local z=4.10: world x_tip≈1.74, world z_tip≈4.47
      b.push(1.18, 0, 0, 0, 0.13, 0);
      box(b, 'hull', IV, 0.44, 0.23, 0.96, { z: 4.10 });
      panelSkin(b, 'hull', P_IV, { r: 0.17, from: 3.58, to: 4.58, rows: 2, cols: 4, seed: 7050, t: 0.07, axis: 'z' });
      torus(b, 'hull', GD, 0.32, 0.050, 3, 6, undefined, { z: 3.72, rx: Math.PI/2 });
      b.pop();

      // ── Dorsal sail ─ push(0, 0.78, -0.20)
      b.push(0, 0.78, -0.20, 0, 0, 0);
      box(b, 'hull', BK, 0.82, 0.42, 1.60, { z: 2.70 });
      panelSkin(b, 'hull', P_BK, { r: 0.28, from: 1.78, to: 3.58, rows: 2, cols: 6, seed: 7051, t: 0.08, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.34, tube: 0.052, from: 1.90, to: 3.46, count: 2, axis: 'z', tseg: 7 });
      b.pop();

      // ── Propulsion ─ push(0, -0.78, 2.80)
      b.push(0, -0.78, 2.80, 0, 0, 0);
      cyl(b, 'hull', BD, 0.34, 0.34, 1.30, 8, { rx: Math.PI/2 });
      cyl(b, 'lights', LC, 0.24, 0.24, 0.92, 7, { rx: Math.PI/2 });
      b.pop();

      // ── Side pods
      b.push(-0.98, 0.18, 0.65, 0, 0, 0);
      cyl(b, 'hull', BK, 0.36, 0.36, 0.88, 7, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.36, from: -0.36, to: 0.36, rows: 2, cols: 4, seed: 7052, t: 0.07, axis: 'z' });
      cyl(b, 'lights', LD, 0.16, 0.16, 0.48, 6, { rx: Math.PI/2 });
      b.pop();

      b.push(-0.98, 0.18, -0.75, 0, 0, 0);
      cyl(b, 'hull', BK, 0.36, 0.36, 0.88, 7, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.36, from: -0.36, to: 0.36, rows: 2, cols: 4, seed: 7053, t: 0.07, axis: 'z' });
      cyl(b, 'lights', LD, 0.16, 0.16, 0.48, 6, { rx: Math.PI/2 });
      b.pop();

      // ── Running lights + lamp strings
      box(b, 'lights', LIT, 0.12, 0.12, 0.12, { x: -1.22, y: 0.16, z:  0.26 });
      box(b, 'lights', LIT, 0.12, 0.12, 0.12, { x: -1.22, y: 0.16, z: -0.26 });
      box(b, 'lights', LC,  0.14, 0.14, 0.14, { x:  1.18, y: 0.34, z:  4.20 });
      lampString(b, 'lights', LW, { ax: -1.00, ay: 0.84, az: -2.4, bx: 0.72, by: 0.84, bz: 3.0, count: 6, size: 0.12 });

      b.pop();
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  freighter: {
    glowZ: 5.90,
    build(b, st) {
      const BK = st.hull;
      const BD = st.hullDark;
      const IV = st.trim;
      const GD = st.accent;
      const W  = weather;

      const P_BK = [BK, BK, W(BK,1), W(BD,1)];
      const P_IV = [IV, IV, W(IV,1), W(IV,2)];

      const LIT = 0xffffff;
      const LW  = 0xfff2d8;
      const LC  = 0xf0f8ff;
      const LD  = 0xe8dcc8;

      b.push(0, 0, 0, 0, 0, 0);

      // ── Spine ─ r=0.80, len=9.50, centered at z=-0.25
      // z: -5.0 to +4.5
      cyl(b, 'hull', BK, 0.80, 0.80, 9.50, 12, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.80, from: -4.8, to: 4.2, rows: 6, cols: 12, seed: 7001, t: 0.14, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.94, tube: 0.090, from: -3.6, to: 3.4, count: 4, axis: 'z', tseg: 12 });
      panelPatches(b, 'hull', P_BK, { r: 1.02, from: -2.0, to: 3.2, count: 26, seed: 7003, w: 1.28, h: 0.90, t: 0.14, axis: 'z' });

      // ── Ivory prow ─ centered at z=-5.90, z: -7.15 to -4.65
      box(b, 'hull', IV, 1.05, 0.74, 2.50, { z: -5.90 });
      panelSkin(b, 'hull', P_IV, { r: 0.72, from: -7.05, to: -4.75, rows: 3, cols: 8, seed: 7002, t: 0.12, axis: 'z' });
      panelPatches(b, 'hull', P_IV, { r: 0.82, from: -6.95, to: -4.85, count: 14, seed: 7004, w: 1.00, h: 0.72, t: 0.12, axis: 'z' });
      torus(b, 'hull', GD, 0.64, 0.078, 3, 9, undefined, { z: -4.72, rx: Math.PI/2 });

      // ── Port gallery ─ push(-1.55, 0.14, -0.25)
      b.push(-1.55, 0.14, -0.25, 0, 0, 0);
      box(b, 'hull', BK, 0.56, 0.82, 9.60);
      panelSkin(b, 'hull', P_BK, { r: 0.36, from: -4.5, to: 4.5, rows: 3, cols: 10, seed: 7005, t: 0.10, axis: 'z' });
      windowRow(b, 'lights', LC, { count: 10, spacing: 0.72, w: 0.22, h: 0.19, d: 0.22, x: 0, y: 0.34, z: 0, axis: 'z' });
      windowRow(b, 'lights', LW, { count:  7, spacing: 0.90, w: 0.20, h: 0.17, d: 0.20, x: 0, y: -0.30, z: 0, axis: 'z' });
      b.pop();

      // ── Swept fin ─ push(1.48, 0, 0, 0, 0.13, 0)
      // local z=4.95: world x_tip≈2.17, world z_tip≈5.43
      b.push(1.48, 0, 0, 0, 0.13, 0);
      box(b, 'hull', IV, 0.56, 0.30, 1.18, { z: 4.95 });
      panelSkin(b, 'hull', P_IV, { r: 0.21, from: 4.33, to: 5.53, rows: 2, cols: 5, seed: 7006, t: 0.08, axis: 'z' });
      torus(b, 'hull', GD, 0.38, 0.060, 3, 7, undefined, { z: 4.52, rx: Math.PI/2 });
      b.pop();

      // ── Dorsal sail ─ push(0, 0.98, -0.25)
      b.push(0, 0.98, -0.25, 0, 0, 0);
      box(b, 'hull', BK, 1.06, 0.54, 2.00, { z: 3.30 });
      panelSkin(b, 'hull', P_BK, { r: 0.36, from: 2.22, to: 4.28, rows: 2, cols: 7, seed: 7007, t: 0.10, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.42, tube: 0.064, from: 2.36, to: 4.14, count: 2, axis: 'z', tseg: 8 });
      b.pop();

      // ── Propulsion (two tubes) ─ push(±0.75, -0.98, 3.50)
      b.push(-0.75, -0.98, 3.50, 0, 0, 0);
      cyl(b, 'hull', BD, 0.40, 0.40, 1.55, 9, { rx: Math.PI/2 });
      cyl(b, 'lights', LC, 0.28, 0.28, 1.10, 8, { rx: Math.PI/2 });
      b.pop();

      b.push(0.62, -0.98, 3.50, 0, 0, 0);
      cyl(b, 'hull', BD, 0.34, 0.34, 1.30, 8, { rx: Math.PI/2 });
      cyl(b, 'lights', LW, 0.24, 0.24, 0.92, 7, { rx: Math.PI/2 });
      b.pop();

      // ── Side machinery pods (two pairs)
      b.push(-1.22, 0.20, 0.80, 0, 0, 0);
      cyl(b, 'hull', BK, 0.48, 0.48, 1.10, 9, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.48, from: -0.48, to: 0.48, rows: 2, cols: 5, seed: 7008, t: 0.09, axis: 'z' });
      cyl(b, 'lights', LD, 0.20, 0.20, 0.60, 7, { rx: Math.PI/2 });
      b.pop();

      b.push(-1.22, 0.20, -0.90, 0, 0, 0);
      cyl(b, 'hull', BK, 0.48, 0.48, 1.10, 9, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.48, from: -0.48, to: 0.48, rows: 2, cols: 5, seed: 7009, t: 0.09, axis: 'z' });
      cyl(b, 'lights', LD, 0.20, 0.20, 0.60, 7, { rx: Math.PI/2 });
      b.pop();

      // ── Running lights + lamp strings
      box(b, 'lights', LIT, 0.14, 0.14, 0.14, { x: -1.55, y: 0.18, z:  0.32 });
      box(b, 'lights', LIT, 0.14, 0.14, 0.14, { x: -1.55, y: 0.18, z: -0.32 });
      box(b, 'lights', LC,  0.16, 0.16, 0.16, { x:  1.48, y: 0.40, z:  5.20 });
      box(b, 'lights', LC,  0.16, 0.16, 0.16, { x:  1.48, y: -0.38, z: 5.20 });
      lampString(b, 'lights', LW, { ax: -1.28, ay: 1.08, az: -3.0, bx: 0.88, by: 1.08, bz: 3.8, count: 6, size: 0.16 });
      lampString(b, 'lights', LC, { ax: -1.10, ay: -0.72, az: 0.60, bx: 0.72, by: -0.72, bz: 0.60, count: 4, size: 0.14 });

      b.pop();
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  heavy: {
    glowZ: 7.40,
    build(b, st) {
      const BK = st.hull;
      const BD = st.hullDark;
      const IV = st.trim;
      const GD = st.accent;
      const W  = weather;

      const P_BK = [BK, BK, W(BK,1), W(BD,1)];
      const P_IV = [IV, IV, W(IV,1), W(IV,2)];

      const LIT = 0xffffff;
      const LW  = 0xfff2d8;
      const LC  = 0xf0f8ff;
      const LD  = 0xe8dcc8;

      b.push(0, 0, 0, 0, 0, 0);

      // ── Spine ─ r=0.98, len=11.50, centered at z=-0.30
      // z: -6.05 to +5.45
      cyl(b, 'hull', BK, 0.98, 0.98, 11.50, 13, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.98, from: -5.8, to: 5.1, rows: 7, cols: 13, seed: 7020, t: 0.15, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 1.14, tube: 0.108, from: -4.5, to: 4.0, count: 5, axis: 'z', tseg: 13 });
      panelPatches(b, 'hull', P_BK, { r: 1.24, from: -2.5, to: 3.8, count: 32, seed: 7022, w: 1.55, h: 1.08, t: 0.15, axis: 'z' });

      // ── Ivory prow ─ centered at z=-7.25, z: -8.70 to -5.80
      box(b, 'hull', IV, 1.30, 0.92, 2.90, { z: -7.25 });
      panelSkin(b, 'hull', P_IV, { r: 0.88, from: -8.60, to: -5.90, rows: 4, cols: 9, seed: 7021, t: 0.13, axis: 'z' });
      panelPatches(b, 'hull', P_IV, { r: 1.00, from: -8.48, to: -6.02, count: 18, seed: 7023, w: 1.20, h: 0.86, t: 0.13, axis: 'z' });
      torus(b, 'hull', GD, 0.78, 0.094, 3, 11, undefined, { z: -5.88, rx: Math.PI/2 });

      // ── Port gallery ─ push(-1.92, 0.16, -0.30)
      b.push(-1.92, 0.16, -0.30, 0, 0, 0);
      box(b, 'hull', BK, 0.70, 1.02, 11.60);
      panelSkin(b, 'hull', P_BK, { r: 0.44, from: -5.5, to: 5.5, rows: 3, cols: 11, seed: 7024, t: 0.11, axis: 'z' });
      windowRow(b, 'lights', LC, { count: 11, spacing: 0.80, w: 0.24, h: 0.20, d: 0.24, x: 0, y: 0.42, z: 0, axis: 'z' });
      windowRow(b, 'lights', LW, { count:  8, spacing: 1.00, w: 0.22, h: 0.18, d: 0.22, x: 0, y: -0.38, z: 0, axis: 'z' });
      b.pop();

      // ── Swept fin ─ push(1.84, 0, 0, 0, 0.13, 0)
      // local z=5.90: world x_tip≈2.56, world z_tip≈6.46
      b.push(1.84, 0, 0, 0, 0.13, 0);
      box(b, 'hull', IV, 0.70, 0.36, 1.44, { z: 5.90 });
      panelSkin(b, 'hull', P_IV, { r: 0.26, from: 5.14, to: 6.62, rows: 2, cols: 6, seed: 7025, t: 0.09, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.58, tube: 0.074, from: 5.28, to: 6.48, count: 2, axis: 'z', tseg: 8 });
      b.pop();

      // ── Dorsal sail ─ push(0, 1.22, -0.30)
      b.push(0, 1.22, -0.30, 0, 0, 0);
      box(b, 'hull', BK, 1.30, 0.66, 2.40, { z: 3.90 });
      panelSkin(b, 'hull', P_BK, { r: 0.44, from: 2.58, to: 5.10, rows: 3, cols: 8, seed: 7026, t: 0.11, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 0.52, tube: 0.076, from: 2.72, to: 4.96, count: 3, axis: 'z', tseg: 9 });
      b.pop();

      // ── Propulsion (two tubes)
      b.push(-0.92, -1.22, 4.20, 0, 0, 0);
      cyl(b, 'hull', BD, 0.50, 0.50, 1.90, 10, { rx: Math.PI/2 });
      cyl(b, 'lights', LC, 0.35, 0.35, 1.35, 9, { rx: Math.PI/2 });
      b.pop();

      b.push(0.76, -1.22, 4.20, 0, 0, 0);
      cyl(b, 'hull', BD, 0.42, 0.42, 1.60, 9, { rx: Math.PI/2 });
      cyl(b, 'lights', LW, 0.30, 0.30, 1.14, 8, { rx: Math.PI/2 });
      b.pop();

      // ── Side machinery clusters (two pairs)
      b.push(-1.52, 0.26, 1.00, 0, 0, 0);
      cyl(b, 'hull', BK, 0.60, 0.60, 1.50, 10, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.60, from: -0.62, to: 0.62, rows: 2, cols: 6, seed: 7027, t: 0.10, axis: 'z' });
      cyl(b, 'lights', LD, 0.25, 0.25, 0.82, 7, { rx: Math.PI/2 });
      b.pop();

      b.push(-1.52, 0.26, -1.10, 0, 0, 0);
      cyl(b, 'hull', BK, 0.60, 0.60, 1.50, 10, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.60, from: -0.62, to: 0.62, rows: 2, cols: 6, seed: 7028, t: 0.10, axis: 'z' });
      cyl(b, 'lights', LD, 0.25, 0.25, 0.82, 7, { rx: Math.PI/2 });
      b.pop();

      b.push(-1.52, 0.26, 2.50, 0, 0, 0);
      cyl(b, 'hull', BK, 0.52, 0.52, 1.28, 9, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.52, from: -0.54, to: 0.54, rows: 2, cols: 5, seed: 7029, t: 0.09, axis: 'z' });
      cyl(b, 'lights', LD, 0.22, 0.22, 0.70, 6, { rx: Math.PI/2 });
      b.pop();

      // ── Running lights + lamp strings
      box(b, 'lights', LIT, 0.16, 0.16, 0.16, { x: -1.92, y: 0.22, z:  0.40 });
      box(b, 'lights', LIT, 0.16, 0.16, 0.16, { x: -1.92, y: 0.22, z: -0.40 });
      box(b, 'lights', LC,  0.20, 0.20, 0.20, { x:  1.84, y: 0.50, z:  6.10 });
      box(b, 'lights', LC,  0.20, 0.20, 0.20, { x:  1.84, y: -0.44, z: 6.10 });
      lampString(b, 'lights', LW, { ax: -1.60, ay: 1.35, az: -3.8, bx: 1.10, by: 1.35, bz: 4.6, count: 7, size: 0.18 });
      lampString(b, 'lights', LC, { ax: -1.40, ay: -0.88, az: 0.76, bx: 0.90, by: -0.88, bz: 0.76, count: 5, size: 0.16 });

      b.pop();
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  frigate: {
    glowZ: 22.00,
    build(b, st) {
      const BK = st.hull;
      const BD = st.hullDark;
      const IV = st.trim;
      const GD = st.accent;
      const W  = weather;

      const P_BK = [BK, BK, W(BK,1), W(BD,1)];
      const P_IV = [IV, IV, W(IV,1), W(IV,2)];

      const LIT = 0xffffff;
      const LW  = 0xfff2d8;
      const LC  = 0xf0f8ff;
      const LD  = 0xe8dcc8;

      b.push(0, 0, 0, 0, 0, 0);

      // ── Spine ─ r=2.80, len=34.00, centered at z=-0.50
      // z: -17.5 to +16.5
      cyl(b, 'hull', BK, 2.80, 2.80, 34.00, 18, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 2.80, from: -17.0, to: 15.8, rows: 10, cols: 18, seed: 7030, t: 0.16, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 3.20, tube: 0.160, from: -13.5, to: 12.5, count: 8, axis: 'z', tseg: 18 });
      panelPatches(b, 'hull', P_BK, { r: 3.55, from: -8.0, to: 11.5, count: 65, seed: 7032, w: 2.50, h: 1.55, t: 0.18, axis: 'z' });

      // ── Ivory prow ─ centered at z=-20.50, z: -24.5 to -16.5
      box(b, 'hull', IV, 4.80, 3.40, 8.00, { z: -20.50 });
      panelSkin(b, 'hull', P_IV, { r: 3.24, from: -24.2, to: -16.8, rows: 5, cols: 14, seed: 7031, t: 0.15, axis: 'z' });
      panelPatches(b, 'hull', P_IV, { r: 3.70, from: -24.0, to: -17.0, count: 42, seed: 7033, w: 2.10, h: 1.35, t: 0.15, axis: 'z' });
      torus(b, 'hull', GD, 2.10, 0.220, 4, 16, undefined, { z: -16.85, rx: Math.PI/2 });

      // ── Port gallery (lower) ─ push(-5.30, 0.60, -0.50)
      // Backing covers z from -14 to +14; windows spread ±9.5
      b.push(-5.30, 0.60, -0.50, 0, 0, 0);
      box(b, 'hull', BK, 2.20, 2.80, 30.00);
      panelSkin(b, 'hull', P_BK, { r: 1.10, from: -14.5, to: 14.5, rows: 6, cols: 14, seed: 7034, t: 0.13, axis: 'z' });
      windowRow(b, 'lights', LC, { count: 20, spacing: 1.00, w: 0.50, h: 0.42, d: 0.48, x: 0, y: 1.22, z: 0, axis: 'z' });
      windowRow(b, 'lights', LW, { count: 14, spacing: 1.20, w: 0.44, h: 0.36, d: 0.42, x: 0, y: -1.00, z: 0, axis: 'z' });
      b.pop();

      // ── Port gallery (upper deck) ─ push(-4.20, 3.60, -0.50)
      b.push(-4.20, 3.60, -0.50, 0, 0, 0);
      box(b, 'hull', BK, 1.90, 2.20, 25.00);
      panelSkin(b, 'hull', P_BK, { r: 0.92, from: -12.0, to: 12.0, rows: 5, cols: 12, seed: 7035, t: 0.12, axis: 'z' });
      windowRow(b, 'lights', LD, { count: 16, spacing: 1.00, w: 0.40, h: 0.34, d: 0.38, x: 0, y: 0.90, z: 0, axis: 'z' });
      b.pop();

      // ── Swept fins (pair) ─ push(4.80, 0, 0, 0, 0.13, 0)
      // local z=19.00: world x_tip≈7.38, world z_tip≈20.86
      b.push(4.80, 0, 0, 0, 0.13, 0);
      box(b, 'hull', IV, 1.80, 0.98, 4.40, { z: 19.00 });
      panelSkin(b, 'hull', P_IV, { r: 0.68, from: 16.76, to: 21.16, rows: 3, cols: 9, seed: 7036, t: 0.11, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 1.42, tube: 0.120, from: 17.0, to: 20.9, count: 3, axis: 'z', tseg: 10 });
      b.pop();

      // ── Dorsal sail ─ push(0, 3.80, -0.50)
      b.push(0, 3.80, -0.50, 0, 0, 0);
      box(b, 'hull', BK, 5.80, 1.60, 8.00, { z: 12.00 });
      panelSkin(b, 'hull', P_BK, { r: 0.94, from: 7.8, to: 15.9, rows: 4, cols: 12, seed: 7037, t: 0.14, axis: 'z' });
      ribBands(b, 'hull', GD, { r: 1.10, tube: 0.130, from: 8.2, to: 15.7, count: 4, axis: 'z', tseg: 12 });
      b.pop();

      // ── Propulsion (three tubes)
      b.push(-2.80, -3.20, 13.00, 0, 0, 0);
      cyl(b, 'hull', BD, 1.20, 1.20, 5.50, 12, { rx: Math.PI/2 });
      cyl(b, 'lights', LC, 0.85, 0.85, 3.90, 10, { rx: Math.PI/2 });
      b.pop();

      b.push(0, -3.20, 13.00, 0, 0, 0);
      cyl(b, 'hull', BD, 1.00, 1.00, 4.60, 11, { rx: Math.PI/2 });
      cyl(b, 'lights', LW, 0.70, 0.70, 3.26, 9, { rx: Math.PI/2 });
      b.pop();

      b.push(2.80, -3.20, 13.00, 0, 0, 0);
      cyl(b, 'hull', BD, 0.88, 0.88, 4.00, 10, { rx: Math.PI/2 });
      cyl(b, 'lights', LC, 0.62, 0.62, 2.84, 8, { rx: Math.PI/2 });
      b.pop();

      // ── Side machinery complexes (two pairs)
      b.push(-5.00, 0.90, 2.00, 0, 0, 0);
      cyl(b, 'hull', BK, 1.10, 1.10, 3.60, 12, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 1.10, from: -1.60, to: 1.60, rows: 2, cols: 8, seed: 7038, t: 0.14, axis: 'z' });
      cyl(b, 'lights', LD, 0.46, 0.46, 2.10, 9, { rx: Math.PI/2 });
      b.pop();

      b.push(-5.00, 0.90, -2.20, 0, 0, 0);
      cyl(b, 'hull', BK, 1.10, 1.10, 3.60, 12, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 1.10, from: -1.60, to: 1.60, rows: 2, cols: 8, seed: 7039, t: 0.14, axis: 'z' });
      cyl(b, 'lights', LD, 0.46, 0.46, 2.10, 9, { rx: Math.PI/2 });
      b.pop();

      b.push(-3.80, 2.40, 1.40, 0, 0, 0);
      cyl(b, 'hull', BK, 0.82, 0.82, 2.80, 10, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.82, from: -1.20, to: 1.20, rows: 2, cols: 6, seed: 7040, t: 0.12, axis: 'z' });
      cyl(b, 'lights', LD, 0.34, 0.34, 1.60, 8, { rx: Math.PI/2 });
      b.pop();

      b.push(-3.80, 2.40, -1.60, 0, 0, 0);
      cyl(b, 'hull', BK, 0.82, 0.82, 2.80, 10, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r: 0.82, from: -1.20, to: 1.20, rows: 2, cols: 6, seed: 7041, t: 0.12, axis: 'z' });
      cyl(b, 'lights', LD, 0.34, 0.34, 1.60, 8, { rx: Math.PI/2 });
      b.pop();

      // ── Running lights + lamp arrays
      box(b, 'lights', LIT, 0.22, 0.22, 0.22, { x: -5.30, y: 0.48, z:  0.62 });
      box(b, 'lights', LIT, 0.22, 0.22, 0.22, { x: -5.30, y: 0.48, z: -0.62 });
      box(b, 'lights', LC,  0.26, 0.26, 0.26, { x:  4.80, y: 0.88, z: 21.00 });
      box(b, 'lights', LC,  0.26, 0.26, 0.26, { x:  4.80, y: -0.68, z: 21.00 });
      lampString(b, 'lights', LW, { ax: -5.00, ay: 4.40, az: -8.0, bx: 3.60, by: 4.40, bz: 13.0, count: 9, size: 0.26 });
      lampString(b, 'lights', LC, { ax: -4.50, ay: -2.40, az: 1.20, bx: 2.80, by: -2.40, bz: 1.20, count: 6, size: 0.22 });
      lampString(b, 'lights', LW, { ax: -4.50, ay: -2.40, az: -1.40, bx: 2.80, by: -2.40, bz: -1.40, count: 6, size: 0.22 });

      b.pop();
    },
  },
};
