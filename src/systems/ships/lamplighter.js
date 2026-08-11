/**
 * Lamplighter Guild — "Guild Tug", the infrastructure work vessels.
 *
 * Reference art: docs/FactionExamples/10-lamplighter-guild-ship.png.
 *
 * A WORKING VESSEL: heavy stern engine block, folded repair crane, cable reel,
 * relay mast with lamp, hanging work platform. These are industrial tugs and
 * repair ships — the tools ARE the silhouette. Soot-black hull with utility-yellow
 * hazard stripes, warm lamps and cobalt diagnostics. Every ship reads as active
 * maintenance equipment, not a combat craft.
 *
 * ROUND-2 SHAPE: flat wide barge (spanY <= 0.75 * spanX, spanZ >= 2.4 * spanX).
 * The cross-section is a low flat rectangle, NOT a cylinder. The signature
 * stern ring (torus in XY at the stern) sizes to the hull height — outer radius
 * kept well within max-abs-Y. panelSkin radius is small (< hull half-height)
 * so it adds plate texture on the keel/spine without caging the hull.
 *
 * Palette (5 colours x 4 SHADES = 20 allowed hull values):
 *   SOOT   0x24211c  hull
 *   DARK   0x171410  hullDark
 *   YELLOW 0xd8a83a  trim = patch[0]
 *   WARM   0xffc06a  accent = glow
 *   COBALT 0x5a8ae0  patch[1] (diagnostic blue)
 *
 * Near-neutral glow tints (lights channel only, all sRGB >= 0.6):
 *   LIT      0xffffff
 *   LIT_WARM 0xfff2e2
 *   LIT_DIM  0xe8dcc8
 *   LIT_COOL 0xe8f0ff
 */

import {
  weather, box, cyl, torus,
  ribBands, windowGrid, panelSkin, truss, pipeRun, lampString,
} from '../station-detail.js';

export const lamplighterShip = {
  // ------------------------------------------------------------------ frigate --
  // Long work barge: full crane, cable reel, relay mast, hanging platform
  // Hull 17.0x4.5x46.0  span ~17.4 x 11.8 x 48.9  r~25.9
  frigate: {
    glowZ: 24.0,
    build(b, st) {
      const W = weather;

      const SOOT   = st.hull;
      const DARK   = st.hullDark;
      const YELLOW = st.trim;
      const COBALT = st.patch[1];

      const P_SOOT   = [SOOT, SOOT, W(SOOT, 1), W(SOOT, 2)];
      const P_YELLOW = [YELLOW, W(YELLOW, 1), W(YELLOW, 2)];
      const P_COBALT = [COBALT, W(COBALT, 1)];

      const LIT      = 0xffffff;
      const LIT_WARM = 0xfff2e2;
      const LIT_DIM  = 0xe8dcc8;
      const LIT_COOL = 0xe8f0ff;

      // === MAIN HULL BARGE — 17.0 wide, 4.5 tall, 46.0 long ===
      b.push(0, 0, 0, 0, 0, 0);
      box(b, 'hull', P_SOOT[0], 17.0, 4.5, 46.0);
      panelSkin(b, 'hull', P_SOOT, { r: 2.0, from: -21.0, to: 21.0, rows: 20, cols: 28, seed: 4701, t: 0.18, axis: 'z' });
      b.pop();

      // Hull transverse ribs
      for (const hz of [-16.0, -8.0, 0.0, 8.0, 16.0]) {
        box(b, 'hull', DARK, 17.4, 4.5, 0.30, { x: 0, y: 0, z: hz });
      }

      // Hull armor strakes — keep length short enough that corners stay in radius
      for (const sx of [-1, 1]) {
        box(b, 'hull', W(SOOT, 1), 4.0, 4.6, 44.0, { x: sx * 6.5, y: 0, z: 0 });
      }

      // === STERN ENGINE CYLINDER ===
      b.push(0, 0, 23.0, 0, 0, 0);
      cyl(b, 'hull', P_SOOT[1], 5.5, 5.5, 4.5, 10, { rx: Math.PI / 2 });
      ribBands(b, 'hull', DARK, { r: 5.65, tube: 0.36, from: -1.2, to: 1.2, count: 5, axis: 'z', tseg: 14 });
      b.pop();

      // === STERN RING — signature torus in XY plane, outer y <=6.0 ===
      b.push(0, 0, 25.0, 0, 0, 0);
      torus(b, 'hull', P_SOOT[2], 5.58, 0.40, 10, 18);
      torus(b, 'hull', P_YELLOW[0], 5.58, 0.16, 10, 18);
      b.pop();

      // === ENGINE NOZZLES — five outlets ===
      for (const sx of [-2.5, -0.9, 0.0, 0.9, 2.5]) {
        b.push(sx, 0, 25.6, 0, 0, 0);
        cyl(b, 'hull', P_YELLOW[0], 0.95, 0.65, 0.70, 8, { rx: Math.PI / 2 });
        b.pop();
        // lights kept inside z=26 (push at 25.6, h=0.50 -> from 25.35 to 25.85)
        b.push(sx, 0, 25.6, 0, 0, 0);
        cyl(b, 'lights', LIT_WARM, 0.55, 0.38, 0.50, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === FORWARD SUPERSTRUCTURE — bridge top y=5.85 <=6.0 ===
      // push y=3.4, box h=4.9 -> top at 3.4+2.45=5.85
      b.push(0, 3.4, -19.0, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 10.0, 4.9, 13.0);
      panelSkin(b, 'hull', P_SOOT, { r: 1.8, from: -5.5, to: 5.5, rows: 6, cols: 14, seed: 4702, t: 0.16, axis: 'z' });
      b.pop();

      // Bridge windows (lights — does not count for hull y)
      // Bridge windows — push z=-24.2 (within panelSkin range), cols x<=2.4 within panelSkin coverage
      b.push(0, 4.3, -24.2, 0, 0, 0);
      windowGrid(b, 'lights', LIT, { rows: 2, cols: 5, rowGap: 0.70, colGap: 1.0, w: 0.8, h: 0.6, d: 0.5, axis: 'x' });
      b.pop();

      // === YELLOW HAZARD STRIPES ===
      for (const sx of [-1, 1]) {
        box(b, 'hull', YELLOW, 0.30, 3.8, 44.0, { x: sx * 8.65, y: 0, z: 0 });
      }

      // === FOLDED REPAIR CRANE — on top spine ===
      b.push(-5.0, 3.6, -6.0, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 4.0, 2.2, 10.0);
      b.pop();
      b.push(-5.0, 3.8, -12.0, 0, 0, 0);
      box(b, 'hull', P_YELLOW[1], 3.2, 1.8, 6.0);
      b.pop();
      b.push(-5.0, 4.2, -16.5, 0, 0, 0);
      cyl(b, 'hull', DARK, 0.9, 0.9, 2.4, 10, { rz: Math.PI / 2 });
      b.pop();
      // Crane cable arm
      b.push(-5.0, 3.0, -18.0, 0, 0, 0);
      box(b, 'hull', DARK, 0.6, 2.8, 0.6);
      b.pop();

      // === CABLE REEL ===
      b.push(5.5, 3.0, 4.0, 0, 0, 0);
      cyl(b, 'hull', P_YELLOW[2], 2.2, 2.2, 2.0, 14, { rz: Math.PI / 2 });
      cyl(b, 'hull', DARK, 0.8, 0.8, 2.6, 10, { rz: Math.PI / 2 });
      ribBands(b, 'hull', SOOT, { r: 2.4, tube: 0.20, from: -0.8, to: 0.8, count: 3, axis: 'x', tseg: 14 });
      b.pop();

      // === RELAY MAST WITH LAMP ===
      b.push(0, 2.8, -12.0, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 0.6, 4.8, 0.6);
      b.pop();
      // Lamp — top at y=2.8+2.4+0.4=5.6 <=6.0
      b.push(0, 5.0, -12.0, 0, 0, 0);
      cyl(b, 'lights', LIT, 0.55, 0.55, 0.8, 8);
      b.pop();
      b.push(0, 5.3, -12.0, 0, 0, 0);
      box(b, 'hull', YELLOW, 1.6, 0.32, 1.6);
      b.pop();

      // === HANGING WORK PLATFORM ===
      b.push(0, -3.2, -8.0, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 10.0, 0.6, 14.0);
      truss(b, 'hull', DARK, { ax: 0, ay: 2.0, az: -7.0, bx: -4.0, by: -0.3, bz: -7.0, thickness: 0.28, bays: 4, spread: 1.0 });
      truss(b, 'hull', DARK, { ax: 0, ay: 2.0, az: -7.0, bx:  4.0, by: -0.3, bz: -7.0, thickness: 0.28, bays: 4, spread: 1.0 });
      b.pop();

      // === COBALT DIAGNOSTIC PANELS ===
      b.push(-8.5, 0, 8.0, 0, 0, 0);
      box(b, 'hull', P_COBALT[0], 0.25, 3.0, 6.0);
      b.pop();
      b.push(8.5, 0, 8.0, 0, 0, 0);
      box(b, 'hull', P_COBALT[1], 0.25, 3.0, 6.0);
      b.pop();

      // === VENT STACKS ===
      for (const [vx, vz] of [[-7.0, -10.0], [7.0, -10.0], [-7.0, 10.0], [7.0, 10.0]]) {
        b.push(vx, 2.4, vz, 0, 0, 0);
        cyl(b, 'hull', P_SOOT[1], 0.5, 0.5, 2.0, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === ACCESS HATCHES ===
      for (const [hx, hz] of [[-4.0, 0], [4.0, 0], [0, -14.0], [0, 14.0]]) {
        box(b, 'hull', YELLOW, 2.0, 0.25, 2.0, { x: hx, y: 2.3, z: hz });
      }

      // === PIPES AND CONDUITS ===
      pipeRun(b, 'hull', DARK, { ax: -7.5, ay: 2.4, az: -18.0, bx: 7.5, by: 2.4, bz: 18.0, r: 0.22, seg: 6, collars: 5 });
      pipeRun(b, 'hull', YELLOW, { ax: -8.0, ay: 2.1, az: -16.0, bx: 8.0, by: 2.1, bz: 16.0, r: 0.14, seg: 6, collars: 4 });

      // === LAMP STRINGS — parallel z-runs so every lamp has panelSkin hull nearby ===
      // Centerline: panelSkin at r~2.09 top (0, 2.09, z) is in same cell y=2 as lamp y=2.35
      lampString(b, 'lights', LIT_WARM, { ax: 0, ay: 2.35, az: -22.0, bx: 0, by: 2.35, bz: 22.0, count: 18, size: 0.50 });
      // Side strings at x=+-2: panelSkin plate at ~(1.5, 1.5, z) is adjacent (cell differ 1 in x and y)
      lampString(b, 'lights', LIT_DIM,  { ax: -2.0, ay: 2.35, az: -20.0, bx: -2.0, by: 2.35, bz: 20.0, count: 12, size: 0.42 });
      lampString(b, 'lights', LIT_COOL, { ax:  2.0, ay: 2.35, az: -20.0, bx:  2.0, by: 2.35, bz: 20.0, count: 12, size: 0.42 });
    },
  },

  // ------------------------------------------------------------------ heavy --
  // Stout work barge with large crane, reel and relay mast
  // Hull 6.5x2.2x16.5  span ~6.8 x 4.8 x 17.0  r~8.8
  heavy: {
    glowZ: 8.0,
    build(b, st) {
      const W = weather;

      const SOOT   = st.hull;
      const DARK   = st.hullDark;
      const YELLOW = st.trim;
      const COBALT = st.patch[1];

      const P_SOOT   = [SOOT, SOOT, W(SOOT, 1), W(SOOT, 2)];
      const P_YELLOW = [YELLOW, W(YELLOW, 1), W(YELLOW, 2)];
      const P_COBALT = [COBALT, W(COBALT, 1)];

      const LIT      = 0xffffff;
      const LIT_WARM = 0xfff2e2;
      const LIT_COOL = 0xe8f0ff;

      // === MAIN HULL BARGE ===
      b.push(0, 0, 0, 0, 0, 0);
      box(b, 'hull', P_SOOT[0], 6.5, 2.2, 16.5);
      panelSkin(b, 'hull', P_SOOT, { r: 0.95, from: -7.5, to: 7.5, rows: 12, cols: 20, seed: 4703, t: 0.18, axis: 'z' });
      b.pop();

      // Hull transverse ribs
      for (const hz of [-5.5, 0.0, 5.5]) {
        box(b, 'hull', DARK, 6.7, 2.2, 0.18, { x: 0, y: 0, z: hz });
      }

      // Hull strakes — length 16.0 keeps corners at r=8.71 < 9.0
      for (const sx of [-1, 1]) {
        box(b, 'hull', W(SOOT, 1), 1.6, 2.3, 16.0, { x: sx * 2.45, y: 0, z: 0 });
      }

      // === STERN ENGINE CYLINDER ===
      b.push(0, 0, 8.0, 0, 0, 0);
      cyl(b, 'hull', P_SOOT[1], 2.10, 2.10, 1.40, 10, { rx: Math.PI / 2 });
      ribBands(b, 'hull', DARK, { r: 2.18, tube: 0.12, from: -0.40, to: 0.40, count: 4, axis: 'z', tseg: 12 });
      b.pop();

      // === STERN RING — outer y = 2.25+0.14 = 2.39 <= 2.4 ===
      b.push(0, 0, 8.45, 0, 0, 0);
      torus(b, 'hull', P_SOOT[2], 2.25, 0.13, 10, 16);
      torus(b, 'hull', P_YELLOW[0], 2.25, 0.06, 10, 16);
      b.pop();

      // === ENGINE NOZZLES ===
      for (const sx of [-1.0, 0.0, 1.0]) {
        b.push(sx, 0, 8.70, 0, 0, 0);
        cyl(b, 'hull', P_YELLOW[0], 0.40, 0.28, 0.18, 8, { rx: Math.PI / 2 });
        b.pop();
        b.push(sx, 0, 8.77, 0, 0, 0);
        cyl(b, 'lights', LIT_WARM, 0.25, 0.18, 0.12, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === BRIDGE — top y = 1.3+1.0 = 2.3 <= 2.4 ===
      b.push(0, 1.3, -5.5, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 4.0, 2.0, 5.0);
      b.pop();
      b.push(0, 2.1, -7.5, 0, 0, 0);
      windowGrid(b, 'lights', LIT, { rows: 2, cols: 4, rowGap: 0.55, colGap: 0.8, w: 0.65, h: 0.5, d: 0.28, axis: 'x' });
      b.pop();

      // === YELLOW HAZARD STRIPES ===
      for (const sx of [-1, 1]) {
        box(b, 'hull', YELLOW, 0.14, 1.9, 15.0, { x: sx * 3.3, y: 0, z: 0 });
      }

      // === CRANE ARM — top y ~2.3 <=2.4 ===
      b.push(-2.0, 1.7, -2.0, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 1.6, 1.0, 4.0);
      b.pop();
      b.push(-2.0, 1.8, -4.8, 0, 0, 0);
      box(b, 'hull', P_YELLOW[1], 1.3, 0.8, 2.5);
      b.pop();
      // Crane joint: push y=2.0, cyl r=0.35 -> top 2.35 <=2.4
      b.push(-2.0, 2.0, -6.3, 0, 0, 0);
      cyl(b, 'hull', DARK, 0.35, 0.35, 1.0, 10, { rz: Math.PI / 2 });
      b.pop();

      // === CABLE REEL — center y=1.35, r=0.80 -> top 2.15 <=2.4 ===
      b.push(2.2, 1.35, 1.5, 0, 0, 0);
      cyl(b, 'hull', P_YELLOW[2], 0.80, 0.80, 0.80, 14, { rz: Math.PI / 2 });
      cyl(b, 'hull', DARK, 0.30, 0.30, 1.00, 10, { rz: Math.PI / 2 });
      b.pop();

      // === RELAY MAST — top y = 1.1+1.1 = 2.2 <=2.4 ===
      b.push(0, 1.1, -3.5, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 0.28, 2.2, 0.28);
      b.pop();
      b.push(0, 2.15, -3.5, 0, 0, 0);
      cyl(b, 'lights', LIT, 0.28, 0.28, 0.40, 8);
      b.pop();
      // Mast cap top at 2.18+0.07=2.25 <=2.4
      b.push(0, 2.18, -3.5, 0, 0, 0);
      box(b, 'hull', YELLOW, 0.68, 0.14, 0.68);
      b.pop();

      // === WORK PLATFORM ===
      b.push(0, -1.6, -3.0, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 4.0, 0.25, 5.0);
      truss(b, 'hull', DARK, { ax: 0, ay: 0.9, az: -3.0, bx: -1.6, by: -0.2, bz: -3.0, thickness: 0.12, bays: 3, spread: 0.5 });
      truss(b, 'hull', DARK, { ax: 0, ay: 0.9, az: -3.0, bx:  1.6, by: -0.2, bz: -3.0, thickness: 0.12, bays: 3, spread: 0.5 });
      b.pop();

      // === COBALT PANELS ===
      b.push(-3.3, 0.4, 3.5, 0, 0, 0);
      box(b, 'hull', P_COBALT[0], 0.25, 1.4, 2.5);
      b.pop();
      b.push(3.3, 0.4, 3.5, 0, 0, 0);
      box(b, 'hull', P_COBALT[1], 0.25, 1.4, 2.5);
      b.pop();

      // === VENTS ===
      for (const [vx, vz] of [[-2.8, -3.0], [2.8, -3.0], [-2.8, 3.0], [2.8, 3.0]]) {
        b.push(vx, 1.2, vz, 0, 0, 0);
        cyl(b, 'hull', P_SOOT[1], 0.22, 0.22, 0.70, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === ACCESS HATCHES ===
      for (const [hx, hz] of [[-1.6, 0], [1.6, 0], [0, -5.5], [0, 5.5]]) {
        box(b, 'hull', YELLOW, 0.85, 0.12, 0.85, { x: hx, y: 1.12, z: hz });
      }

      // === PIPES ===
      pipeRun(b, 'hull', DARK, { ax: -3.0, ay: 1.2, az: -6.0, bx: 3.0, by: 1.2, bz: 6.0, r: 0.10, seg: 6, collars: 3 });

      // === LAMP STRINGS ===
      lampString(b, 'lights', LIT_WARM, { ax: -2.8, ay: 1.14, az: -7.5, bx: 2.8, by: 1.14, bz: 7.5, count: 14, size: 0.22 });
      lampString(b, 'lights', LIT_COOL, { ax: -3.2, ay: 1.14, az: -7.0, bx: -3.2, by: 1.14, bz: 7.0, count: 8, size: 0.18 });
    },
  },

  // --------------------------------------------------------------- freighter --
  // Transport tug with engine block and work gear
  // Hull 5.4x1.8x12.6  span ~5.6 x 3.9 x 13.6  r~7.2
  freighter: {
    glowZ: 6.2,
    build(b, st) {
      const W = weather;

      const SOOT   = st.hull;
      const DARK   = st.hullDark;
      const YELLOW = st.trim;
      const COBALT = st.patch[1];

      const P_SOOT   = [SOOT, SOOT, W(SOOT, 1), W(SOOT, 2)];
      const P_YELLOW = [YELLOW, W(YELLOW, 1), W(YELLOW, 2)];
      const P_COBALT = [COBALT, W(COBALT, 1)];

      const LIT      = 0xffffff;
      const LIT_WARM = 0xfff2e2;
      const LIT_COOL = 0xe8f0ff;

      // === MAIN HULL BARGE ===
      b.push(0, 0, 0, 0, 0, 0);
      box(b, 'hull', P_SOOT[0], 5.4, 1.8, 12.6);
      panelSkin(b, 'hull', P_SOOT, { r: 0.80, from: -5.8, to: 5.8, rows: 10, cols: 18, seed: 4704, t: 0.18, axis: 'z' });
      b.pop();

      // Hull transverse ribs
      for (const hz of [-4.0, 0.0, 4.0]) {
        box(b, 'hull', DARK, 5.5, 1.8, 0.14, { x: 0, y: 0, z: hz });
      }

      // Hull strakes — 13.2 long keeps bow at -6.6
      for (const sx of [-1, 1]) {
        box(b, 'hull', W(SOOT, 1), 1.2, 1.9, 13.2, { x: sx * 2.1, y: 0, z: 0 });
      }

      // === STERN ENGINE CYLINDER — r=1.60, h=1.00 so corner at (1.60,0,6.95) r=7.13 <=7.2 ===
      b.push(0, 0, 6.45, 0, 0, 0);
      cyl(b, 'hull', P_SOOT[1], 1.60, 1.60, 1.00, 10, { rx: Math.PI / 2 });
      ribBands(b, 'hull', DARK, { r: 1.68, tube: 0.10, from: -0.40, to: 0.40, count: 4, axis: 'z', tseg: 12 });
      b.pop();

      // === STERN RING — at z=6.80: max_r=sqrt(1.75^2+6.80^2)+0.12=7.14 <=7.2 ===
      b.push(0, 0, 6.80, 0, 0, 0);
      torus(b, 'hull', P_SOOT[2], 1.75, 0.12, 10, 16);
      torus(b, 'hull', P_YELLOW[0], 1.75, 0.05, 10, 16);
      b.pop();

      // === ENGINE NOZZLES — center z=7.05, far end 7.10, vertex r=7.185 <=7.2 ===
      for (const sx of [-0.80, 0.0, 0.80]) {
        b.push(sx, 0, 7.05, 0, 0, 0);
        cyl(b, 'hull', P_YELLOW[0], 0.30, 0.20, 0.10, 8, { rx: Math.PI / 2 });
        b.pop();
        b.push(sx, 0, 7.09, 0, 0, 0);
        cyl(b, 'lights', LIT_WARM, 0.18, 0.12, 0.08, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === BRIDGE ===
      b.push(0, 1.2, -4.2, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 3.0, 1.6, 4.0);
      b.pop();
      b.push(0, 1.7, -5.8, 0, 0, 0);
      windowGrid(b, 'lights', LIT, { rows: 2, cols: 3, rowGap: 0.45, colGap: 0.65, w: 0.55, h: 0.40, d: 0.22, axis: 'x' });
      b.pop();

      // === YELLOW STRIPES ===
      for (const sx of [-1, 1]) {
        box(b, 'hull', YELLOW, 0.12, 1.55, 12.0, { x: sx * 2.74, y: 0, z: 0 });
      }

      // === CRANE ARM ===
      b.push(-1.6, 1.2, -1.5, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 1.2, 0.80, 3.2);
      b.pop();
      b.push(-1.6, 1.35, -3.5, 0, 0, 0);
      box(b, 'hull', P_YELLOW[1], 1.0, 0.65, 2.0);
      b.pop();
      b.push(-1.6, 1.5, -4.7, 0, 0, 0);
      cyl(b, 'hull', DARK, 0.28, 0.28, 0.75, 10, { rz: Math.PI / 2 });
      b.pop();

      // === CABLE REEL ===
      b.push(1.8, 1.2, 1.2, 0, 0, 0);
      cyl(b, 'hull', P_YELLOW[2], 0.75, 0.75, 0.60, 12, { rz: Math.PI / 2 });
      cyl(b, 'hull', DARK, 0.28, 0.28, 0.78, 10, { rz: Math.PI / 2 });
      b.pop();

      // === RELAY MAST ===
      b.push(0, 1.1, -2.8, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 0.22, 1.8, 0.22);
      b.pop();
      b.push(0, 1.88, -2.8, 0, 0, 0);
      cyl(b, 'lights', LIT, 0.22, 0.22, 0.32, 8);
      b.pop();
      b.push(0, 1.9, -2.8, 0, 0, 0);
      box(b, 'hull', YELLOW, 0.52, 0.12, 0.52);
      b.pop();

      // === WORK PLATFORM ===
      b.push(0, -1.3, -2.5, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 3.2, 0.20, 4.0);
      truss(b, 'hull', DARK, { ax: 0, ay: 0.7, az: -2.5, bx: -1.3, by: -0.15, bz: -2.5, thickness: 0.09, bays: 2, spread: 0.4 });
      truss(b, 'hull', DARK, { ax: 0, ay: 0.7, az: -2.5, bx:  1.3, by: -0.15, bz: -2.5, thickness: 0.09, bays: 2, spread: 0.4 });
      b.pop();

      // === COBALT PANELS ===
      b.push(-2.7, 0.25, 3.0, 0, 0, 0);
      box(b, 'hull', P_COBALT[0], 0.20, 1.1, 2.0);
      b.pop();
      b.push(2.7, 0.25, 3.0, 0, 0, 0);
      box(b, 'hull', P_COBALT[1], 0.20, 1.1, 2.0);
      b.pop();

      // === VENTS ===
      for (const [vx, vz] of [[-2.3, -2.0], [2.3, -2.0], [-2.3, 2.0], [2.3, 2.0]]) {
        b.push(vx, 1.0, vz, 0, 0, 0);
        cyl(b, 'hull', P_SOOT[1], 0.18, 0.18, 0.55, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === ACCESS HATCHES ===
      for (const [hx, hz] of [[-1.2, 0], [1.2, 0], [0, -4.0], [0, 4.0]]) {
        box(b, 'hull', YELLOW, 0.70, 0.10, 0.70, { x: hx, y: 0.95, z: hz });
      }

      // === PIPES ===
      pipeRun(b, 'hull', DARK, { ax: -2.5, ay: 1.0, az: -4.5, bx: 2.5, by: 1.0, bz: 4.5, r: 0.08, seg: 6, collars: 3 });

      // === LAMP STRINGS ===
      lampString(b, 'lights', LIT_WARM, { ax: -2.3, ay: 0.92, az: -5.5, bx: 2.3, by: 0.92, bz: 5.5, count: 12, size: 0.20 });
      lampString(b, 'lights', LIT_COOL, { ax: -2.6, ay: 0.92, az: -5.0, bx: -2.6, by: 0.92, bz: 5.0, count: 6, size: 0.16 });
    },
  },

  // ------------------------------------------------------------------- ace --
  // Fast work boat with streamlined crane
  // Hull 4.0x1.2x9.6  span ~4.1 x 2.6 x 10.4  r~5.6
  ace: {
    glowZ: 4.8,
    build(b, st) {
      const W = weather;

      const SOOT   = st.hull;
      const DARK   = st.hullDark;
      const YELLOW = st.trim;
      const COBALT = st.patch[1];

      const P_SOOT   = [SOOT, SOOT, W(SOOT, 1), W(SOOT, 2)];
      const P_YELLOW = [YELLOW, W(YELLOW, 1), W(YELLOW, 2)];
      const P_COBALT = [COBALT, W(COBALT, 1)];

      const LIT      = 0xffffff;
      const LIT_WARM = 0xfff2e2;
      const LIT_COOL = 0xe8f0ff;

      // === MAIN HULL BARGE ===
      b.push(0, 0, 0, 0, 0, 0);
      box(b, 'hull', P_SOOT[0], 4.0, 1.2, 9.6);
      panelSkin(b, 'hull', P_SOOT, { r: 0.55, from: -4.2, to: 4.5, rows: 8, cols: 16, seed: 4705, t: 0.16, axis: 'z' });
      b.pop();

      // Hull transverse ribs
      for (const hz of [-3.0, 0.0, 3.0]) {
        box(b, 'hull', DARK, 4.1, 1.2, 0.12, { x: 0, y: 0, z: hz });
      }

      // Hull strakes
      for (const sx of [-1, 1]) {
        box(b, 'hull', W(SOOT, 1), 0.90, 1.25, 9.8, { x: sx * 1.55, y: 0, z: 0 });
      }

      // === STERN ENGINE CYLINDER ===
      b.push(0, 0, 4.8, 0, 0, 0);
      cyl(b, 'hull', P_SOOT[1], 1.10, 1.10, 1.20, 10, { rx: Math.PI / 2 });
      ribBands(b, 'hull', DARK, { r: 1.15, tube: 0.10, from: -0.35, to: 0.35, count: 3, axis: 'z', tseg: 12 });
      b.pop();

      // === STERN RING — r=1.20, tube=0.08, outer=1.28 <=1.3 ===
      b.push(0, 0, 5.25, 0, 0, 0);
      torus(b, 'hull', P_SOOT[2], 1.20, 0.08, 10, 14);
      torus(b, 'hull', P_YELLOW[0], 1.20, 0.034, 10, 14);
      b.pop();

      // === ENGINE NOZZLES ===
      for (const sx of [-0.65, 0.0, 0.65]) {
        b.push(sx, 0, 5.55, 0, 0, 0);
        cyl(b, 'hull', P_YELLOW[0], 0.24, 0.17, 0.18, 8, { rx: Math.PI / 2 });
        b.pop();
        b.push(sx, 0, 5.62, 0, 0, 0);
        cyl(b, 'lights', LIT_WARM, 0.15, 0.10, 0.12, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === BRIDGE — top y=0.75+0.45=1.20 <=1.3 ===
      b.push(0, 0.75, -3.2, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 2.4, 0.90, 3.0);
      b.pop();
      b.push(0, 1.10, -4.5, 0, 0, 0);
      windowGrid(b, 'lights', LIT, { rows: 2, cols: 3, rowGap: 0.30, colGap: 0.52, w: 0.42, h: 0.28, d: 0.18, axis: 'x' });
      b.pop();

      // === YELLOW STRIPES ===
      for (const sx of [-1, 1]) {
        box(b, 'hull', YELLOW, 0.10, 1.05, 9.2, { x: sx * 2.05, y: 0, z: 0 });
      }

      // === STREAMLINED CRANE ===
      b.push(-1.2, 0.80, -1.0, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 0.85, 0.60, 2.4);
      b.pop();
      b.push(-1.2, 0.90, -2.5, 0, 0, 0);
      box(b, 'hull', P_YELLOW[1], 0.72, 0.50, 1.5);
      b.pop();
      // Crane joint: top y=1.05+0.20=1.25 <=1.3
      b.push(-1.2, 1.05, -3.3, 0, 0, 0);
      cyl(b, 'hull', DARK, 0.20, 0.20, 0.55, 10, { rz: Math.PI / 2 });
      b.pop();

      // === CABLE REEL — center y=0.75, r=0.40 -> top 1.15 <=1.3 ===
      b.push(1.3, 0.75, 0.8, 0, 0, 0);
      cyl(b, 'hull', P_YELLOW[2], 0.40, 0.40, 0.45, 12, { rz: Math.PI / 2 });
      cyl(b, 'hull', DARK, 0.15, 0.15, 0.55, 10, { rz: Math.PI / 2 });
      b.pop();

      // === RELAY MAST — top y=0.65+0.60=1.25 <=1.3 ===
      b.push(0, 0.65, -1.8, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 0.18, 1.20, 0.18);
      b.pop();
      b.push(0, 1.22, -1.8, 0, 0, 0);
      cyl(b, 'lights', LIT, 0.18, 0.18, 0.24, 8);
      b.pop();
      // Mast cap: top 1.22+0.06=1.28 <=1.3
      b.push(0, 1.22, -1.8, 0, 0, 0);
      box(b, 'hull', YELLOW, 0.42, 0.12, 0.42);
      b.pop();

      // === WORK PLATFORM ===
      b.push(0, -0.90, -2.0, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 2.4, 0.16, 3.0);
      truss(b, 'hull', DARK, { ax: 0, ay: 0.48, az: -2.0, bx: -0.95, by: -0.1, bz: -2.0, thickness: 0.07, bays: 2, spread: 0.32 });
      truss(b, 'hull', DARK, { ax: 0, ay: 0.48, az: -2.0, bx:  0.95, by: -0.1, bz: -2.0, thickness: 0.07, bays: 2, spread: 0.32 });
      b.pop();

      // === COBALT PANELS ===
      b.push(-2.0, 0.15, 2.2, 0, 0, 0);
      box(b, 'hull', P_COBALT[0], 0.16, 0.85, 1.5);
      b.pop();
      b.push(2.0, 0.15, 2.2, 0, 0, 0);
      box(b, 'hull', P_COBALT[1], 0.16, 0.85, 1.5);
      b.pop();

      // === VENTS ===
      for (const [vx, vz] of [[-1.8, -1.5], [1.8, -1.5], [-1.8, 1.5], [1.8, 1.5]]) {
        b.push(vx, 0.65, vz, 0, 0, 0);
        cyl(b, 'hull', P_SOOT[1], 0.14, 0.14, 0.42, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === ACCESS HATCHES ===
      for (const [hx, hz] of [[-0.9, 0], [0.9, 0], [0, -3.0], [0, 3.0]]) {
        box(b, 'hull', YELLOW, 0.52, 0.08, 0.52, { x: hx, y: 0.62, z: hz });
      }

      // === PIPES ===
      pipeRun(b, 'hull', DARK, { ax: -1.8, ay: 0.65, az: -3.5, bx: 1.8, by: 0.65, bz: 3.5, r: 0.07, seg: 6, collars: 2 });

      // === LAMP STRINGS ===
      lampString(b, 'lights', LIT_WARM, { ax: -1.7, ay: 0.63, az: -4.2, bx: 1.7, by: 0.63, bz: 4.2, count: 10, size: 0.17 });
      lampString(b, 'lights', LIT_COOL, { ax: -2.0, ay: 0.63, az: -3.8, bx: -2.0, by: 0.63, bz: 3.8, count: 5, size: 0.14 });
    },
  },

  // ----------------------------------------------------------------- cutter --
  // Small utility tug with basic crane
  // Hull 3.2x1.2x7.8  span ~3.3 x 2.4 x 8.6  r~4.7
  cutter: {
    glowZ: 4.0,
    build(b, st) {
      const W = weather;

      const SOOT   = st.hull;
      const DARK   = st.hullDark;
      const YELLOW = st.trim;
      const COBALT = st.patch[1];

      const P_SOOT   = [SOOT, SOOT, W(SOOT, 1), W(SOOT, 2)];
      const P_YELLOW = [YELLOW, W(YELLOW, 1), W(YELLOW, 2)];
      const P_COBALT = [COBALT, W(COBALT, 1)];

      const LIT      = 0xffffff;
      const LIT_WARM = 0xfff2e2;
      const LIT_COOL = 0xe8f0ff;

      // === MAIN HULL BARGE ===
      b.push(0, 0, 0, 0, 0, 0);
      box(b, 'hull', P_SOOT[0], 3.2, 1.2, 7.8);
      panelSkin(b, 'hull', P_SOOT, { r: 0.55, from: -3.6, to: 3.6, rows: 8, cols: 14, seed: 4706, t: 0.16, axis: 'z' });
      b.pop();

      // Hull transverse ribs
      for (const hz of [-2.5, 0.0, 2.5]) {
        box(b, 'hull', DARK, 3.3, 1.2, 0.10, { x: 0, y: 0, z: hz });
      }

      // Hull strakes
      for (const sx of [-1, 1]) {
        box(b, 'hull', W(SOOT, 1), 0.72, 1.25, 7.9, { x: sx * 1.24, y: 0, z: 0 });
      }

      // === STERN ENGINE CYLINDER ===
      b.push(0, 0, 3.8, 0, 0, 0);
      cyl(b, 'hull', P_SOOT[1], 0.90, 0.90, 1.00, 8, { rx: Math.PI / 2 });
      ribBands(b, 'hull', DARK, { r: 0.95, tube: 0.09, from: -0.30, to: 0.30, count: 3, axis: 'z', tseg: 12 });
      b.pop();

      // === STERN RING ===
      b.push(0, 0, 4.25, 0, 0, 0);
      torus(b, 'hull', P_SOOT[2], 1.10, 0.09, 8, 14);
      torus(b, 'hull', P_YELLOW[0], 1.10, 0.04, 8, 14);
      b.pop();

      // === ENGINE NOZZLES ===
      for (const sx of [-0.55, 0.0, 0.55]) {
        b.push(sx, 0, 4.60, 0, 0, 0);
        cyl(b, 'hull', P_YELLOW[0], 0.20, 0.14, 0.18, 8, { rx: Math.PI / 2 });
        b.pop();
        b.push(sx, 0, 4.68, 0, 0, 0);
        cyl(b, 'lights', LIT_WARM, 0.12, 0.08, 0.12, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === BRIDGE ===
      b.push(0, 0.70, -2.6, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 2.0, 0.82, 2.4);
      b.pop();
      b.push(0, 1.0, -3.6, 0, 0, 0);
      windowGrid(b, 'lights', LIT, { rows: 2, cols: 3, rowGap: 0.28, colGap: 0.42, w: 0.34, h: 0.25, d: 0.15, axis: 'x' });
      b.pop();

      // === YELLOW STRIPES ===
      for (const sx of [-1, 1]) {
        box(b, 'hull', YELLOW, 0.10, 1.05, 7.4, { x: sx * 1.65, y: 0, z: 0 });
      }

      // === BASIC CRANE ===
      b.push(-0.95, 0.72, -0.8, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 0.70, 0.50, 1.8);
      b.pop();
      b.push(-0.95, 0.82, -1.9, 0, 0, 0);
      box(b, 'hull', P_YELLOW[1], 0.58, 0.42, 1.1);
      b.pop();
      b.push(-0.95, 0.90, -2.5, 0, 0, 0);
      cyl(b, 'hull', DARK, 0.17, 0.17, 0.44, 8, { rz: Math.PI / 2 });
      b.pop();

      // === SMALL CABLE REEL ===
      b.push(1.1, 0.70, 0.6, 0, 0, 0);
      cyl(b, 'hull', P_YELLOW[2], 0.44, 0.44, 0.36, 12, { rz: Math.PI / 2 });
      cyl(b, 'hull', DARK, 0.16, 0.16, 0.44, 8, { rz: Math.PI / 2 });
      b.pop();

      // === RELAY MAST — center y=0.60, h=1.10, top at 0.60+0.55=1.15 <=1.2 ===
      b.push(0, 0.60, -1.5, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 0.16, 1.10, 0.16);
      b.pop();
      b.push(0, 1.10, -1.5, 0, 0, 0);
      cyl(b, 'lights', LIT, 0.16, 0.16, 0.22, 8);
      b.pop();
      // Mast cap top: 1.10+0.06=1.16 <=1.2
      b.push(0, 1.10, -1.5, 0, 0, 0);
      box(b, 'hull', YELLOW, 0.36, 0.12, 0.36);
      b.pop();

      // === WORK PLATFORM ===
      b.push(0, -0.78, -1.5, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 1.8, 0.14, 2.4);
      truss(b, 'hull', DARK, { ax: 0, ay: 0.42, az: -1.5, bx: -0.72, by: -0.1, bz: -1.5, thickness: 0.06, bays: 2, spread: 0.28 });
      truss(b, 'hull', DARK, { ax: 0, ay: 0.42, az: -1.5, bx:  0.72, by: -0.1, bz: -1.5, thickness: 0.06, bays: 2, spread: 0.28 });
      b.pop();

      // === COBALT PANELS ===
      b.push(-1.6, 0.12, 1.8, 0, 0, 0);
      box(b, 'hull', P_COBALT[0], 0.14, 0.70, 1.2);
      b.pop();
      b.push(1.6, 0.12, 1.8, 0, 0, 0);
      box(b, 'hull', P_COBALT[1], 0.14, 0.70, 1.2);
      b.pop();

      // === VENTS ===
      for (const [vx, vz] of [[-1.4, -1.2], [1.4, -1.2], [-1.4, 1.2], [1.4, 1.2]]) {
        b.push(vx, 0.55, vz, 0, 0, 0);
        cyl(b, 'hull', P_SOOT[1], 0.12, 0.12, 0.36, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === ACCESS HATCHES ===
      for (const [hx, hz] of [[-0.7, 0], [0.7, 0], [0, -2.5], [0, 2.5]]) {
        box(b, 'hull', YELLOW, 0.42, 0.07, 0.42, { x: hx, y: 0.62, z: hz });
      }

      // === PIPES ===
      pipeRun(b, 'hull', DARK, { ax: -1.4, ay: 0.65, az: -2.8, bx: 1.4, by: 0.65, bz: 2.8, r: 0.06, seg: 6, collars: 2 });

      // === LAMP STRINGS ===
      lampString(b, 'lights', LIT_WARM, { ax: -1.3, ay: 0.63, az: -3.4, bx: 1.3, by: 0.63, bz: 3.4, count: 8, size: 0.14 });
      lampString(b, 'lights', LIT_COOL, { ax: -1.6, ay: 0.63, az: -3.0, bx: -1.6, by: 0.63, bz: 3.0, count: 4, size: 0.12 });
    },
  },

  // ------------------------------------------------------------------ light --
  // Minimal work skiff with tiny crane
  // Hull 2.4x0.9x5.6  span ~2.5 x 1.8 x 6.3  r~3.4
  light: {
    glowZ: 3.0,
    build(b, st) {
      const W = weather;

      const SOOT   = st.hull;
      const DARK   = st.hullDark;
      const YELLOW = st.trim;
      const COBALT = st.patch[1];

      const P_SOOT   = [SOOT, SOOT, W(SOOT, 1), W(SOOT, 2)];
      const P_YELLOW = [YELLOW, W(YELLOW, 1), W(YELLOW, 2)];
      const P_COBALT = [COBALT, W(COBALT, 1)];

      const LIT      = 0xffffff;
      const LIT_WARM = 0xfff2e2;
      const LIT_COOL = 0xe8f0ff;

      // === MAIN HULL BARGE ===
      b.push(0, 0, 0, 0, 0, 0);
      box(b, 'hull', P_SOOT[0], 2.4, 0.9, 5.6);
      panelSkin(b, 'hull', P_SOOT, { r: 0.40, from: -2.6, to: 2.6, rows: 6, cols: 12, seed: 4707, t: 0.16, axis: 'z' });
      b.pop();

      // Hull transverse ribs
      for (const hz of [-1.8, 0.0, 1.8]) {
        box(b, 'hull', DARK, 2.5, 0.9, 0.09, { x: 0, y: 0, z: hz });
      }

      // Hull strakes — 5.9 long so bow at -2.95, gives spanZ=6.3 with nozzle at 3.35
      for (const sx of [-1, 1]) {
        box(b, 'hull', W(SOOT, 1), 0.55, 0.92, 5.9, { x: sx * 0.93, y: 0, z: 0 });
      }

      // === STERN ENGINE CYLINDER ===
      b.push(0, 0, 2.85, 0, 0, 0);
      cyl(b, 'hull', P_SOOT[1], 0.65, 0.65, 0.75, 8, { rx: Math.PI / 2 });
      ribBands(b, 'hull', DARK, { r: 0.70, tube: 0.08, from: -0.25, to: 0.25, count: 3, axis: 'z', tseg: 12 });
      b.pop();

      // === STERN RING — outer=0.88 <=0.9 ===
      b.push(0, 0, 3.05, 0, 0, 0);
      torus(b, 'hull', P_SOOT[2], 0.80, 0.08, 8, 14);
      torus(b, 'hull', P_YELLOW[0], 0.80, 0.034, 8, 14);
      b.pop();

      // === ENGINE NOZZLES ===
      for (const sx of [-0.40, 0.0, 0.40]) {
        b.push(sx, 0, 3.25, 0, 0, 0);
        cyl(b, 'hull', P_YELLOW[0], 0.17, 0.12, 0.20, 8, { rx: Math.PI / 2 });
        b.pop();
        b.push(sx, 0, 3.32, 0, 0, 0);
        cyl(b, 'lights', LIT_WARM, 0.10, 0.07, 0.12, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === BRIDGE — top y=0.55+0.28=0.83 <=0.9 (float-safe) ===
      b.push(0, 0.55, -1.8, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 1.6, 0.56, 1.6);
      b.pop();
      b.push(0, 0.78, -2.4, 0, 0, 0);
      windowGrid(b, 'lights', LIT, { rows: 1, cols: 2, rowGap: 0.22, colGap: 0.38, w: 0.28, h: 0.22, d: 0.14, axis: 'x' });
      b.pop();

      // === YELLOW STRIPES — outer x=1.20 <=1.3 ===
      for (const sx of [-1, 1]) {
        box(b, 'hull', YELLOW, 0.10, 0.80, 5.3, { x: sx * 1.15, y: 0, z: 0 });
      }

      // === TINY CRANE ===
      b.push(-0.80, 0.50, -0.7, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 0.55, 0.38, 1.4);
      b.pop();
      b.push(-0.80, 0.58, -1.5, 0, 0, 0);
      box(b, 'hull', P_YELLOW[1], 0.46, 0.30, 0.85);
      b.pop();
      // Crane joint top: 0.65+0.14=0.79 <=0.9
      b.push(-0.80, 0.65, -2.0, 0, 0, 0);
      cyl(b, 'hull', DARK, 0.14, 0.14, 0.36, 8, { rz: Math.PI / 2 });
      b.pop();

      // === SMALL CABLE REEL ===
      b.push(0.85, 0.53, 0.5, 0, 0, 0);
      cyl(b, 'hull', P_YELLOW[2], 0.34, 0.34, 0.30, 12, { rz: Math.PI / 2 });
      cyl(b, 'hull', DARK, 0.12, 0.12, 0.38, 8, { rz: Math.PI / 2 });
      b.pop();

      // === RELAY MAST — center y=0.49, h=0.72, top=0.85 <=0.9 ===
      b.push(0, 0.49, -0.9, 0, 0, 0);
      box(b, 'hull', P_SOOT[1], 0.14, 0.72, 0.14);
      b.pop();
      // Mast lamp (lights — does not count for hull y)
      b.push(0, 0.82, -0.9, 0, 0, 0);
      cyl(b, 'lights', LIT, 0.13, 0.13, 0.16, 8);
      b.pop();
      // Mast cap hull: top=0.82+0.045=0.865 <=0.9
      b.push(0, 0.82, -0.9, 0, 0, 0);
      box(b, 'hull', YELLOW, 0.30, 0.09, 0.30);
      b.pop();

      // === WORK PLATFORM ===
      b.push(0, -0.64, -0.9, 0, 0, 0);
      box(b, 'hull', P_SOOT[2], 1.4, 0.12, 1.8);
      truss(b, 'hull', DARK, { ax: 0, ay: 0.34, az: -0.9, bx: -0.55, by: -0.08, bz: -0.9, thickness: 0.05, bays: 2, spread: 0.22 });
      truss(b, 'hull', DARK, { ax: 0, ay: 0.34, az: -0.9, bx:  0.55, by: -0.08, bz: -0.9, thickness: 0.05, bays: 2, spread: 0.22 });
      b.pop();

      // === COBALT PANELS ===
      b.push(-1.2, 0.08, 1.3, 0, 0, 0);
      box(b, 'hull', P_COBALT[0], 0.14, 0.55, 0.90);
      b.pop();
      b.push(1.2, 0.08, 1.3, 0, 0, 0);
      box(b, 'hull', P_COBALT[1], 0.14, 0.55, 0.90);
      b.pop();

      // === VENTS ===
      for (const [vx, vz] of [[-1.0, -0.9], [1.0, -0.9], [-1.0, 0.9], [1.0, 0.9]]) {
        b.push(vx, 0.44, vz, 0, 0, 0);
        cyl(b, 'hull', P_SOOT[1], 0.10, 0.10, 0.28, 8, { rx: Math.PI / 2 });
        b.pop();
      }

      // === ACCESS HATCHES ===
      for (const [hx, hz] of [[-0.6, 0], [0.6, 0], [0, -1.9], [0, 1.9]]) {
        box(b, 'hull', YELLOW, 0.34, 0.06, 0.34, { x: hx, y: 0.47, z: hz });
      }

      // === PIPES ===
      pipeRun(b, 'hull', DARK, { ax: -1.1, ay: 0.47, az: -2.3, bx: 1.1, by: 0.47, bz: 2.3, r: 0.05, seg: 6, collars: 2 });

      // === LAMP STRINGS ===
      lampString(b, 'lights', LIT_WARM, { ax: -1.0, ay: 0.47, az: -2.5, bx: 1.0, by: 0.47, bz: 2.5, count: 7, size: 0.12 });
      lampString(b, 'lights', LIT_COOL, { ax: -1.2, ay: 0.47, az: -2.2, bx: -1.2, by: 0.47, bz: 2.2, count: 4, size: 0.10 });
    },
  },
};
