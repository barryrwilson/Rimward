/**
 * The Hollow — shrouded watcher ships. ROUND 2 reshape.
 *
 * No reference art exists for this faction. Design from lore + wave-46 station
 * lessons (the Vigil):
 *   VALUE NOT DETAIL. `trim` 0x8a7c96 is the dominant plate colour; dark pair
 *   falls to recesses, shutters and seams. A sculpt plated in hull/hullDark
 *   has no value contrast against a band-3 sun.
 *   OUTLINE NOT SURFACE. Masts and dish ears stand clear of the mass so their
 *   edges break the silhouette. The sealed hull reads as a single form.
 *   DIM IS NOT DARK. Many small dim porthole windows; running lights near-white.
 *
 * ROUND-2 HULL SHAPE. The main body is a cylinder oriented along Z (rx: PI/2).
 * Side cheek planks extend spanX well beyond the cylinder radius so that
 * spanY (= 2 * cylinder_radius) stays under 0.75 * spanX. Masts run along
 * the spine (Z axis) rather than vertically, protecting tooTall. The ships
 * are long and slender: spanZ >= 2.4 * spanX.
 *
 * TIERS (approximate z ranges: nose at -Z, stern at +Z):
 *   light      -3.2 …  3.0    small listening craft, spine mast, sealed hull
 *   cutter     -4.3 …  4.3    twin dish spine, wrap panels, few ports
 *   ace        -4.9 …  5.1    forward dish array, sleek shutters
 *   freighter  -6.0 …  6.4    large post, multi-dish spine, sealed bays
 *   heavy      -7.2 …  7.5    command variant, long spine, bridge section
 *   frigate   -19.5 … 23.0   enormous surveillance platform, full spine array
 */

import {
  weather, box, cyl, torus,
  ribBands, windowGrid, panelSkin, panelPatches,
  pipeRun, lampString, windowRow,
} from '../station-detail.js';

export const hollowShip = {
  // ---------------------------------------------------------------- light --
  // R=0.60, L=5.00, planks to x=±1.155 → spanX=2.31 spanY=1.54 spanZ=6.11
  light: {
    glowZ: 2.6,
    build(b, st) {
      const TRIM = st.trim;          // 0x8a7c96 dominant plate
      const DARK = st.hullDark;     // 0x2c2634 recesses, shutters
      const SEAL = st.hull;         // 0x4a4054 sealed hull backing, dishes
      const W = weather;
      const P_TRIM = [TRIM, TRIM, W(TRIM, 1), W(TRIM, 2)];
      const DIM  = 0xe8dcc8;        // dimmest allowed tint
      const WHITE = 0xffffff;

      // — HULL BODY: sealed cylinder along Z (rx:PI/2 = axis along +Z) —
      // center z=0.20, h=5.00 → hull body z: -2.30 to +2.70
      cyl(b, 'hull', TRIM, 0.60, 0.60, 5.00, 14, { z: 0.20, rx: Math.PI / 2 });

      // Nose taper: wide-to-narrow toward -Z (rTop=0.60 at back, rBot=0.08 at tip)
      // center z = -2.30 - 0.85/2 = -2.725 → nose tip at z=-3.15
      cyl(b, 'hull', SEAL, 0.60, 0.08, 0.85, 10, { z: -2.725, rx: Math.PI / 2 });

      // Stern nozzle block (extends sternZ reach)
      // center z = 2.70 + 0.26/2 = 2.83 → vertex at z=2.96
      box(b, 'hull', TRIM, 1.10, 0.64, 0.26, { z: 2.83 });

      // Side cheek planks (wrap panels — extend spanX beyond cylinder radius)
      // x=±0.88, w=0.55 → max abs x = 0.88+0.275 = 1.155; h=0.68 < 2*R=1.20
      box(b, 'hull', W(TRIM, 1), 0.55, 0.68, 4.00, { x:  0.88, z: 0.20 });
      box(b, 'hull', W(TRIM, 1), 0.55, 0.68, 4.00, { x: -0.88, z: 0.20 });

      // Hull plating (panels on cylinder at r=0.65 around Z axis)
      panelSkin(b, 'hull', P_TRIM, {
        r: 0.65, from: -2.00, to: 2.50, rows: 7, cols: 12, seed: 4701, t: 0.12, axis: 'z',
      });

      // Shutter ribs (dark seam hoops, perpendicular to Z)
      ribBands(b, 'hull', DARK, {
        r: 0.65, tube: 0.07, from: -1.80, to: 2.20, count: 5, axis: 'z', tseg: 10,
      });

      // — SPINE MAST: horizontal along Z, above hull top (y = R + 0.05 = 0.65) —
      b.push(0, 0.65, 0, 0, 0, 0);
      // Mast spine along Z: r=0.06, h=3.60 → mast z: -1.80 to +1.80
      cyl(b, 'hull', TRIM, 0.06, 0.06, 3.60, 6, { rx: Math.PI / 2 });
      // Mast stern node
      box(b, 'hull', DARK, 0.14, 0.12, 0.12, { z: 1.80 });
      // Dish ears: horizontal rings in XZ plane (rx:PI/2) — listening ears
      torus(b, 'hull', SEAL, 0.28, 0.05, 8, 8, undefined, { z: -0.80, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.22, 0.04, 8, 6, undefined, { z:  0.60, rx: Math.PI / 2 });
      b.pop(); // spine mast

      // — LIGHTS —
      // Porthole windows along hull sides (x=±0.62, seated on cylinder surface)
      windowRow(b, 'lights', DIM, {
        count: 8, spacing: 0.46, w: 0.11, h: 0.10, d: 0.10,
        x:  0.62, y: 0, z: 0.10, axis: 'z',
      });
      windowRow(b, 'lights', DIM, {
        count: 8, spacing: 0.46, w: 0.11, h: 0.10, d: 0.10,
        x: -0.62, y: 0, z: 0.10, axis: 'z',
      });
      // Stern running lights
      lampString(b, 'lights', WHITE, {
        ax:  0.44, ay: 0, az: 2.70,
        bx: -0.44, by: 0, bz: 2.70,
        count: 2, size: 0.14,
      });
    },
  },

  // --------------------------------------------------------------- cutter --
  // R=0.85, L=7.20, planks to x=±1.63 → spanX=3.26 spanY=2.08 spanZ=8.52
  cutter: {
    glowZ: 3.8,
    build(b, st) {
      const TRIM = st.trim;
      const DARK = st.hullDark;
      const SEAL = st.hull;
      const W = weather;
      const P_TRIM = [TRIM, TRIM, W(TRIM, 1), W(TRIM, 2), W(TRIM, 3)];
      const DIM  = 0xe8dcc8;
      const WHITE = 0xffffff;

      // — HULL BODY: z center=0.35, h=7.20 → body z: -3.25 to +3.95 —
      cyl(b, 'hull', TRIM, 0.85, 0.85, 7.20, 16, { z: 0.35, rx: Math.PI / 2 });

      // Nose taper: center z = -3.25 - 1.00/2 = -3.75 → tip at z=-4.25
      cyl(b, 'hull', SEAL, 0.85, 0.09, 1.00, 12, { z: -3.75, rx: Math.PI / 2 });

      // Stern block: center z = 3.95 + 0.32/2 = 4.11 → vertex at z=4.27
      box(b, 'hull', TRIM, 1.55, 0.90, 0.32, { z: 4.11 });

      // Side cheek planks: x=±1.32, w=0.62 → max abs x = 1.32+0.31 = 1.63
      box(b, 'hull', W(TRIM, 1), 0.62, 0.84, 5.60, { x:  1.32, z: 0.35 });
      box(b, 'hull', W(TRIM, 1), 0.62, 0.84, 5.60, { x: -1.32, z: 0.35 });

      // Hull plating
      panelSkin(b, 'hull', P_TRIM, {
        r: 0.90, from: -3.00, to: 3.60, rows: 8, cols: 14, seed: 4711, t: 0.14, axis: 'z',
      });

      // Shutter ribs
      ribBands(b, 'hull', DARK, {
        r: 0.90, tube: 0.08, from: -2.50, to: 3.10, count: 6, axis: 'z', tseg: 12,
      });

      // — SPINE MAST at y = 0.85 + 0.05 = 0.90 —
      b.push(0, 0.90, 0, 0, 0, 0);
      cyl(b, 'hull', TRIM, 0.07, 0.07, 4.80, 6, { rx: Math.PI / 2 });
      box(b, 'hull', DARK, 0.16, 0.14, 0.14, { z: 2.40 });
      torus(b, 'hull', SEAL, 0.40, 0.06, 8, 10, undefined, { z: -1.20, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.32, 0.05, 8,  8, undefined, { z:  0.80, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.26, 0.05, 8,  8, undefined, { z:  2.20, rx: Math.PI / 2 });
      b.pop(); // spine mast

      // — LIGHTS —
      windowRow(b, 'lights', DIM, {
        count: 10, spacing: 0.50, w: 0.12, h: 0.11, d: 0.11,
        x:  0.87, y: 0, z: 0.35, axis: 'z',
      });
      windowRow(b, 'lights', DIM, {
        count: 10, spacing: 0.50, w: 0.12, h: 0.11, d: 0.11,
        x: -0.87, y: 0, z: 0.35, axis: 'z',
      });
      lampString(b, 'lights', WHITE, {
        ax:  0.60, ay: 0, az: 3.95,
        bx: -0.60, by: 0, bz: 3.95,
        count: 2, size: 0.18,
      });
    },
  },

  // ------------------------------------------------------------------ ace --
  // R=1.00, L=8.50, planks to x=±1.98 → spanX=3.96 spanY=2.38 spanZ=10.02
  ace: {
    glowZ: 4.5,
    build(b, st) {
      const TRIM = st.trim;
      const DARK = st.hullDark;
      const SEAL = st.hull;
      const W = weather;
      const P_TRIM = [TRIM, TRIM, W(TRIM, 1), W(TRIM, 2)];
      const DIM  = 0xe8dcc8;
      const WHITE = 0xffffff;

      // — HULL BODY: z center=0.45, h=8.50 → body z: -3.80 to +4.70 —
      cyl(b, 'hull', TRIM, 1.00, 1.00, 8.50, 16, { z: 0.45, rx: Math.PI / 2 });

      // Nose taper: center z = -3.80 - 1.10/2 = -4.35 → tip at z=-4.90
      cyl(b, 'hull', SEAL, 1.00, 0.10, 1.10, 12, { z: -4.35, rx: Math.PI / 2 });

      // Stern block: center z = 4.70 + 0.42/2 = 4.91 → vertex at z=5.12
      box(b, 'hull', TRIM, 1.90, 1.00, 0.42, { z: 4.91 });

      // Side cheek planks: x=±1.62, w=0.72 → max abs x = 1.62+0.36 = 1.98
      box(b, 'hull', W(TRIM, 1), 0.72, 0.92, 6.50, { x:  1.62, z: 0.45 });
      box(b, 'hull', W(TRIM, 1), 0.72, 0.92, 6.50, { x: -1.62, z: 0.45 });

      // Hull plating
      panelSkin(b, 'hull', P_TRIM, {
        r: 1.05, from: -3.50, to: 4.30, rows: 9, cols: 14, seed: 4721, t: 0.14, axis: 'z',
      });

      // Shutter ribs
      ribBands(b, 'hull', DARK, {
        r: 1.05, tube: 0.09, from: -3.00, to: 3.80, count: 7, axis: 'z', tseg: 12,
      });

      // — SPINE MAST at y = 1.00 + 0.05 = 1.05 —
      b.push(0, 1.05, 0, 0, 0, 0);
      cyl(b, 'hull', TRIM, 0.08, 0.08, 5.50, 6, { rx: Math.PI / 2 });
      box(b, 'hull', DARK, 0.18, 0.14, 0.14, { z: 2.75 });
      torus(b, 'hull', SEAL, 0.50, 0.07, 8, 10, undefined, { z: -1.50, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.40, 0.06, 8,  8, undefined, { z:  0.50, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.34, 0.05, 8,  8, undefined, { z:  2.20, rx: Math.PI / 2 });
      b.pop(); // spine mast

      // — LIGHTS —
      windowRow(b, 'lights', DIM, {
        count: 10, spacing: 0.58, w: 0.13, h: 0.12, d: 0.12,
        x:  1.02, y: 0, z: 0.45, axis: 'z',
      });
      windowRow(b, 'lights', DIM, {
        count: 10, spacing: 0.58, w: 0.13, h: 0.12, d: 0.12,
        x: -1.02, y: 0, z: 0.45, axis: 'z',
      });
      lampString(b, 'lights', WHITE, {
        ax:  0.75, ay: 0, az: 4.70,
        bx: -0.75, by: 0, bz: 4.70,
        count: 2, size: 0.20,
      });
    },
  },

  // ------------------------------------------------------------- freighter --
  // R=1.25, L=10.50, planks to x=±2.51 → spanX=5.02 spanY=2.92 spanZ=12.35
  freighter: {
    glowZ: 5.5,
    build(b, st) {
      const TRIM = st.trim;
      const DARK = st.hullDark;
      const SEAL = st.hull;
      const W = weather;
      const P_TRIM = [TRIM, TRIM, W(TRIM, 1), W(TRIM, 2), W(TRIM, 3), W(TRIM, 1)];
      const P_MIX  = [TRIM, W(TRIM, 1), SEAL, W(SEAL, 1)];
      const DIM  = 0xe8dcc8;
      const WHITE = 0xffffff;

      // — HULL BODY: z center=0.55, h=10.50 → body z: -4.70 to +5.80 —
      cyl(b, 'hull', TRIM, 1.25, 1.25, 10.50, 18, { z: 0.55, rx: Math.PI / 2 });

      // Nose taper: center z = -4.70 - 1.30/2 = -5.35 → tip at z=-6.00
      cyl(b, 'hull', SEAL, 1.25, 0.12, 1.30, 14, { z: -5.35, rx: Math.PI / 2 });

      // Stern block: center z = 5.80 + 0.55/2 = 6.075 → vertex at z=6.35
      box(b, 'hull', TRIM, 2.20, 1.30, 0.55, { z: 6.075 });

      // Side cheek planks: x=±2.05, w=0.92 → max abs x = 2.05+0.46 = 2.51
      box(b, 'hull', W(TRIM, 1), 0.92, 1.12, 8.00, { x:  2.05, z: 0.55 });
      box(b, 'hull', W(TRIM, 1), 0.92, 1.12, 8.00, { x: -2.05, z: 0.55 });

      // Hull plating
      panelSkin(b, 'hull', P_TRIM, {
        r: 1.30, from: -4.30, to: 5.30, rows: 10, cols: 16, seed: 4731, t: 0.16, axis: 'z',
      });

      // Shutter ribs
      ribBands(b, 'hull', DARK, {
        r: 1.30, tube: 0.10, from: -3.80, to: 4.80, count: 8, axis: 'z', tseg: 14,
      });

      // Transverse sensor bars (structural greeble, not vertical)
      box(b, 'hull', P_MIX[2], 1.80, 0.14, 0.14, { z: -1.80 });
      box(b, 'hull', P_MIX[2], 1.80, 0.14, 0.14, { z:  0.80 });

      // — SPINE MAST at y = 1.25 + 0.05 = 1.30 —
      b.push(0, 1.30, 0, 0, 0, 0);
      cyl(b, 'hull', TRIM, 0.09, 0.09, 7.00, 6, { rx: Math.PI / 2 });
      box(b, 'hull', DARK, 0.20, 0.16, 0.16, { z: 3.50 });
      torus(b, 'hull', SEAL, 0.60, 0.08, 8, 10, undefined, { z: -2.00, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.50, 0.07, 8, 10, undefined, { z:  0.00, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.44, 0.07, 8,  8, undefined, { z:  2.50, rx: Math.PI / 2 });
      b.pop(); // spine mast

      // — LIGHTS —
      windowRow(b, 'lights', DIM, {
        count: 14, spacing: 0.55, w: 0.14, h: 0.13, d: 0.13,
        x:  1.28, y: 0, z: 0.55, axis: 'z',
      });
      windowRow(b, 'lights', DIM, {
        count: 14, spacing: 0.55, w: 0.14, h: 0.13, d: 0.13,
        x: -1.28, y: 0, z: 0.55, axis: 'z',
      });
      // Mast status indicators
      box(b, 'lights', DIM, 0.13, 0.13, 0.13, { x:  1.42, y: 0, z: -4.40 });
      box(b, 'lights', DIM, 0.13, 0.13, 0.13, { x: -1.42, y: 0, z: -4.40 });
      lampString(b, 'lights', WHITE, {
        ax:  0.85, ay: 0, az: 5.80,
        bx: -0.85, by: 0, bz: 5.80,
        count: 2, size: 0.22,
      });
    },
  },

  // ----------------------------------------------------------------- heavy --
  // R=1.55, L=12.50, planks to x=±2.81 → spanX=5.62 spanY=3.56 spanZ=14.61
  heavy: {
    glowZ: 6.8,
    build(b, st) {
      const TRIM = st.trim;
      const DARK = st.hullDark;
      const SEAL = st.hull;
      const W = weather;
      const P_TRIM   = [TRIM, TRIM, W(TRIM, 1), W(TRIM, 2), W(TRIM, 3)];
      const P_BRIDGE = [TRIM, W(TRIM, 1), W(TRIM, 2), SEAL];
      const DIM  = 0xe8dcc8;
      const NEAR_WHITE = 0xfff2d8;

      // — HULL BODY: z center=0.60, h=12.50 → body z: -5.65 to +6.85 —
      cyl(b, 'hull', TRIM, 1.55, 1.55, 12.50, 20, { z: 0.60, rx: Math.PI / 2 });

      // Nose taper: center z = -5.65 - 1.45/2 = -6.375 → tip at z=-7.10
      cyl(b, 'hull', SEAL, 1.55, 0.15, 1.45, 16, { z: -6.375, rx: Math.PI / 2 });

      // Stern block: center z = 6.85 + 0.66/2 = 7.18 → vertex at z=7.51
      box(b, 'hull', TRIM, 2.60, 1.60, 0.66, { z: 7.18 });

      // Side cheek planks: x=±2.30, w=1.02 → max abs x = 2.30+0.51 = 2.81
      box(b, 'hull', W(TRIM, 1), 1.02, 1.40, 9.50, { x:  2.30, z: 0.60 });
      box(b, 'hull', W(TRIM, 1), 1.02, 1.40, 9.50, { x: -2.30, z: 0.60 });

      // Hull plating
      panelSkin(b, 'hull', P_TRIM, {
        r: 1.60, from: -5.30, to: 6.30, rows: 12, cols: 18, seed: 4741, t: 0.18, axis: 'z',
      });

      // Shutter ribs
      ribBands(b, 'hull', DARK, {
        r: 1.60, tube: 0.12, from: -4.80, to: 5.80, count: 9, axis: 'z', tseg: 16,
      });

      // Bridge / command section near stern (raised fairing on top of hull)
      b.push(0, 0.0, 3.20, 0, 0, 0);
      box(b, 'hull', TRIM, 1.80, 1.20, 1.40);
      panelPatches(b, 'hull', P_BRIDGE, {
        r: 1.20, from: -0.55, to: 0.55, count: 5, seed: 4743, w: 0.80, h: 0.60, axis: 'z',
      });
      windowGrid(b, 'lights', DIM, {
        rows: 2, cols: 3, rowGap: 0.22, colGap: 0.22,
        w: 0.15, h: 0.15, d: 0.10, x: 0, y: 0.30, z: 0.70, axis: 'z',
      });
      b.pop(); // bridge

      // — SPINE MAST at y = 1.55 + 0.05 = 1.60 —
      b.push(0, 1.60, 0, 0, 0, 0);
      cyl(b, 'hull', TRIM, 0.10, 0.10, 8.50, 8, { rx: Math.PI / 2 });
      box(b, 'hull', DARK, 0.22, 0.18, 0.18, { z: 4.25 });
      torus(b, 'hull', SEAL, 0.70, 0.09, 8, 12, undefined, { z: -2.50, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.60, 0.09, 8, 10, undefined, { z: -0.50, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.50, 0.08, 8, 10, undefined, { z:  2.00, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.44, 0.07, 8,  8, undefined, { z:  3.80, rx: Math.PI / 2 });
      b.pop(); // spine mast

      // — LIGHTS —
      windowRow(b, 'lights', DIM, {
        count: 16, spacing: 0.58, w: 0.15, h: 0.14, d: 0.14,
        x:  1.58, y: 0, z: 0.60, axis: 'z',
      });
      windowRow(b, 'lights', DIM, {
        count: 16, spacing: 0.58, w: 0.15, h: 0.14, d: 0.14,
        x: -1.58, y: 0, z: 0.60, axis: 'z',
      });
      // Bridge windows (near-white)
      lampString(b, 'lights', NEAR_WHITE, {
        ax: 0.40, ay: 0.70, az: 3.90, bx: -0.40, by: 0.70, bz: 3.90,
        count: 3, size: 0.14,
      });
      // Mast tip lamps
      box(b, 'lights', DIM, 0.14, 0.14, 0.14, { x:  1.50, y: 0, z: -4.80 });
      box(b, 'lights', DIM, 0.14, 0.14, 0.14, { x: -1.50, y: 0, z: -4.80 });
      lampString(b, 'lights', NEAR_WHITE, {
        ax:  1.00, ay: 0, az: 6.85, bx: -1.00, by: 0, bz: 6.85,
        count: 2, size: 0.24,
      });
    },
  },

  // --------------------------------------------------------------- frigate --
  // R=4.50, L=35.00, planks to x=±8.75 → spanX=17.50 spanY=9.76 spanZ=42.00
  frigate: {
    glowZ: 21.0,
    build(b, st) {
      const TRIM = st.trim;
      const DARK = st.hullDark;
      const SEAL = st.hull;
      const W = weather;
      const P_HULL = [TRIM, W(TRIM, 1), SEAL, W(SEAL, 1), W(TRIM, 2)];
      const P_TOP  = [TRIM, TRIM, W(TRIM, 1), W(TRIM, 2)];
      const DIM  = 0xe8dcc8;
      const NEAR_WHITE = 0xfff2d8;

      // — HULL BODY: z center=1.50, h=35.00 → body z: -16.00 to +19.00 —
      cyl(b, 'hull', TRIM, 4.50, 4.50, 35.00, 24, { z: 1.50, rx: Math.PI / 2 });

      // Nose taper: center z = -16.00 - 3.50/2 = -17.75 → tip at z=-19.50
      cyl(b, 'hull', SEAL, 4.50, 0.30, 3.50, 20, { z: -17.75, rx: Math.PI / 2 });

      // Stern block: center z = 19.00 + 4.00/2 = 21.00 → vertex at z=23.00
      box(b, 'hull', TRIM, 8.00, 5.00, 4.00, { z: 21.00 });

      // Side cheek planks: x=±7.00, w=3.50 → max abs x = 7.00+1.75 = 8.75
      // h=4.00, d=28.00, center z=1.50 → plank z: -12.50 to +15.50
      box(b, 'hull', W(TRIM, 1), 3.50, 4.00, 28.00, { x:  7.00, z: 1.50 });
      box(b, 'hull', W(TRIM, 1), 3.50, 4.00, 28.00, { x: -7.00, z: 1.50 });

      // Hull plating (extensive — this is a capital ship)
      panelSkin(b, 'hull', P_HULL, {
        r: 4.60, from: -14.00, to: 17.00, rows: 16, cols: 24, seed: 4751, t: 0.28, axis: 'z',
      });

      // Shutter ribs
      ribBands(b, 'hull', DARK, {
        r: 4.60, tube: 0.22, from: -12.00, to: 15.00, count: 14, axis: 'z', tseg: 20,
      });

      // Stern superstructure plating
      panelPatches(b, 'hull', P_TOP, {
        r: 4.60, from: 17.50, to: 22.50, count: 18, seed: 4752, w: 1.80, h: 1.60, axis: 'z',
      });

      // Plank leading/trailing edge reinforcement bars
      box(b, 'hull', SEAL, 3.50, 0.40, 0.40, { x:  7.00, z: -12.50 });
      box(b, 'hull', SEAL, 3.50, 0.40, 0.40, { x:  7.00, z:  15.50 });
      box(b, 'hull', SEAL, 3.50, 0.40, 0.40, { x: -7.00, z: -12.50 });
      box(b, 'hull', SEAL, 3.50, 0.40, 0.40, { x: -7.00, z:  15.50 });

      // Transverse structural frames
      box(b, 'hull', DARK, 4.50, 0.30, 0.30, { z: -10.00 });
      box(b, 'hull', DARK, 4.50, 0.30, 0.30, { z:   0.00 });
      box(b, 'hull', DARK, 4.50, 0.30, 0.30, { z:  10.00 });

      // — PRIMARY SPINE MAST at y = 4.50 + 0.12 = 4.62 —
      b.push(0, 4.62, 0, 0, 0, 0);
      // Mast spine along Z: r=0.18, h=25.00 → z: -12.50 to +12.50
      cyl(b, 'hull', TRIM, 0.18, 0.18, 25.00, 8, { rx: Math.PI / 2 });
      // Mast node boxes at key intervals
      box(b, 'hull', DARK, 0.40, 0.35, 0.35, { z: -10.00 });
      box(b, 'hull', DARK, 0.40, 0.35, 0.35, { z:   0.00 });
      box(b, 'hull', DARK, 0.40, 0.35, 0.35, { z:  10.00 });
      // Dish ear array (eight horizontal rings at intervals along spine)
      torus(b, 'hull', SEAL, 1.60, 0.12, 8, 12, undefined, { z: -9.00, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 1.40, 0.11, 8, 12, undefined, { z: -5.50, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 1.50, 0.12, 8, 12, undefined, { z: -2.00, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 1.30, 0.10, 8, 10, undefined, { z:  1.50, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 1.40, 0.11, 8, 12, undefined, { z:  5.00, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 1.20, 0.10, 8, 10, undefined, { z:  8.50, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 1.10, 0.09, 8, 10, undefined, { z: 11.00, rx: Math.PI / 2 });
      torus(b, 'hull', SEAL, 0.90, 0.08, 8,  8, undefined, { z: 12.50, rx: Math.PI / 2 });
      b.pop(); // primary spine mast

      // Stern sensor cross-frame (backing for stern indicator lights)
      pipeRun(b, 'hull', DARK, {
        ax: -3.50, ay:  0, az: 21.00,
        bx:  3.50, by:  0, bz: 21.00,
        r: 0.12, seg: 6, collars: 4,
      });
      pipeRun(b, 'hull', DARK, {
        ax:  0, ay: -2.00, az: 21.00,
        bx:  0, by:  2.00, bz: 21.00,
        r: 0.12, seg: 6, collars: 3,
      });

      // Plank outer-edge hull rails — provide backing for the lampStrings at
      // x=±8.75. The plank box only has corner vertices (z=-12.50, z=15.50);
      // without these rails any light at intermediate z is orphaned.
      // Rails sit at x=±7.00 (plank center, inside plank) so they do NOT
      // extend spanX beyond the plank's 8.75 maximum.
      pipeRun(b, 'hull', SEAL, {
        ax:  7.00, ay: 0, az: -12.00,
        bx:  7.00, by: 0, bz:  15.00,
        r: 0.12, seg: 4, collars: 14,
      });
      pipeRun(b, 'hull', SEAL, {
        ax: -7.00, ay: 0, az: -12.00,
        bx: -7.00, by: 0, bz:  15.00,
        r: 0.12, seg: 4, collars: 14,
      });

      // — LIGHTS —
      // Porthole rows along hull sides (x=±4.52, seated on cylinder surface)
      windowRow(b, 'lights', DIM, {
        count: 20, spacing: 1.40, w: 0.30, h: 0.26, d: 0.26,
        x:  4.52, y: 0, z: 1.50, axis: 'z',
      });
      windowRow(b, 'lights', DIM, {
        count: 20, spacing: 1.40, w: 0.30, h: 0.26, d: 0.26,
        x: -4.52, y: 0, z: 1.50, axis: 'z',
      });
      // Plank outer-edge running lights (lampString along plank, x=±8.75)
      // Seated via hull rails at x=±7.00 in adjacent x-cell.
      lampString(b, 'lights', DIM, {
        ax:  8.75, ay: 0, az: -11.00,
        bx:  8.75, by: 0, bz:  14.00,
        count: 10, size: 0.18,
      });
      lampString(b, 'lights', DIM, {
        ax: -8.75, ay: 0, az: -11.00,
        bx: -8.75, by: 0, bz:  14.00,
        count: 10, size: 0.18,
      });
      // Stern indicator lights (on cross-frame at z=21.00)
      lampString(b, 'lights', DIM, {
        ax:  3.50, ay: 0, az: 21.00,
        bx: -3.50, by: 0, bz: 21.00,
        count: 6, size: 0.20,
      });
      // Running lights: placed at cylinder surface (x=±4.40, y=0, z=18.60)
      // so the cylinder ring at z=19.00 backs them in an adjacent z-cell.
      lampString(b, 'lights', NEAR_WHITE, {
        ax:  4.40, ay: 0, az: 18.60,
        bx: -4.40, by: 0, bz: 18.60,
        count: 2, size: 0.38,
      });
    },
  },
};
