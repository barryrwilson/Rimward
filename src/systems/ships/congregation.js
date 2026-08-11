/**
 * Congregation of the Further Shore — Pilgrim Ships, flying sanctuaries.
 *
 * Design language: long pilgrim hull — forward observation dome, weathered silver rib rings
 * banding the midships, amber keel shrine, midnight blue plating.
 * Sails (freighter, heavy, frigate only): flat panels swept aft along +Z.
 *
 * Round-2 proportions: spanZ >= 2.4 * spanX; spanY <= 0.75 * spanX.
 * Nose at -Z, stern at +Z. All hull vertices within the per-class envelope.
 *
 * Palette roles (via st):
 *   hull      0x232a44  midnight blue  (spine, slab)
 *   hullDark  0x161b2e  midnight black (ribs shaded, stern block)
 *   trim      0xa8b0b8  weathered silver (dome, rib rings, shrine housing, sails)
 *   accent    0xd8a25a  candle amber   (shrine cores)
 * Lights: CANDLE 0xfff8f0 (near-white, all sRGB >= 0.6).
 */

import {
  weather, box, cyl, sphere, ribBands,
  panelPatches, lampString,
} from '../station-detail.js';

const HPI = Math.PI / 2;

export const congregationShip = {

  // ---------- LIGHT (scout) ----------
  // Envelope: x ±1.3  y ±0.9  z ±3.4   radius 2.2–3.5
  // Spine cyl r=0.65, h=6.4 (z ±3.2).  Slab x ±1.20.
  // Ribs r=0.68, tube=0.10 → y_outer=0.78.
  // Keel bottom y=-0.86. PanelPatch max|y|=0.79.
  // spanX=2.40  spanY=1.65  spanZ=6.73
  // tooTall: 1.65 ≤ 0.75*2.40=1.80 ✓   tooStubby: 6.73 ≥ 2.4*2.40=5.76 ✓
  // maxAbsX=1.20 ≤ 1.3 ✓  maxAbsY=0.86 ≤ 0.9 ✓  maxAbsZ=3.375 ≤ 3.4 ✓
  // max radius ≈ 3.42 ∈ [2.2, 3.5] ✓
  // glowZ=2.6  sternZ=3.375  [1.856, 4.575] ✓
  light: {
    glowZ: 2.6,
    build(b, st) {
      const W = weather;
      const MIDNIGHT = st.hull;
      const DEEP    = st.hullDark;
      const SILVER  = st.trim;
      const AMBER   = st.accent;
      const CANDLE  = 0xfff8f0;

      // ── HULL ─────────────────────────────────────────────────────
      // Spine cylinder: r=0.65, h=6.4, along Z (rx:HPI)
      cyl(b, 'hull', W(MIDNIGHT, 0), 0.65, 0.65, 6.4, 24, { rx: HPI });

      // Wide hull slab — extends beam to x ±1.20, spanX=2.40
      box(b, 'hull', W(MIDNIGHT, 1), 2.40, 0.50, 6.0);

      // Observation dome: sphere center z=-2.85, r=0.50 → tip z=-3.35
      b.push(0, 0, -2.85);
      sphere(b, 'hull', W(SILVER, 1), 0.50, 14, 9);
      b.pop();

      // 5 silver rib rings along midships; outer y=0.78 ≤ 0.9 ✓
      ribBands(b, 'hull', W(SILVER, 0), { r: 0.68, tube: 0.10, from: -2.4, to: 2.4, count: 5, axis: 'z' });

      // Keel shrine housing: center y=-0.78, bottom y=-0.86 ≤ 0.9 ✓
      b.push(0, -0.78, 0.4);
      box(b, 'hull', W(SILVER, 2), 0.60, 0.16, 0.80);
      cyl(b, 'hull', W(AMBER, 1), 0.12, 0.12, 0.55, 8, { rx: HPI });
      b.pop();

      // Stern engine nub: z_max = 3.20+0.175 = 3.375 ≤ 3.4 ✓
      b.push(0, 0, 3.20);
      box(b, 'hull', W(DEEP, 1), 1.10, 0.38, 0.35);
      b.pop();

      // Hull plating on spine cylinder (r+t/2=0.70, max|y|≈0.79 ≤ 0.9 ✓)
      panelPatches(b, 'hull', [W(MIDNIGHT, 0), W(MIDNIGHT, 1), W(SILVER, 2), W(SILVER, 3)], {
        r: 0.65, from: -2.8, to: 2.8, count: 28, seed: 7201, w: 0.55, h: 0.45, t: 0.10, axis: 'z',
      });
      panelPatches(b, 'hull', [W(MIDNIGHT, 2), W(DEEP, 0), W(DEEP, 1)], {
        r: 0.65, from: -1.8, to: 1.8, count: 20, seed: 7211, w: 0.45, h: 0.38, t: 0.08, axis: 'z',
      });

      // ── LIGHTS ───────────────────────────────────────────────────
      // Nose dome glow — seated inside sphere
      b.push(0, 0, -2.70);
      sphere(b, 'lights', CANDLE, 0.28, 7, 5);
      b.pop();

      // Shrine amber lamp — inside shrine housing
      b.push(0, -0.76, 0.4);
      sphere(b, 'lights', CANDLE, 0.12, 6, 4);
      b.pop();

      // Running lights on 3 rib ring positions
      lampString(b, 'lights', CANDLE, { ax: -0.68, ay: 0, az: -2.4, bx: 0.68, by: 0, bz: -2.4, count: 3, size: 0.09 });
      lampString(b, 'lights', CANDLE, { ax: -0.68, ay: 0, az:  0.0, bx: 0.68, by: 0, bz:  0.0, count: 3, size: 0.09 });
      lampString(b, 'lights', CANDLE, { ax: -0.68, ay: 0, az:  2.4, bx: 0.68, by: 0, bz:  2.4, count: 3, size: 0.09 });

      // Stern running lights — within 0.25 of stern block and slab edge
      b.push(-0.95, 0, 3.20);
      sphere(b, 'lights', CANDLE, 0.08, 4, 3);
      b.pop();
      b.push( 0.95, 0, 3.20);
      sphere(b, 'lights', CANDLE, 0.08, 4, 3);
      b.pop();
    },
  },

  // ---------- CUTTER (patrol) ----------
  // Envelope: x ±1.8  y ±1.2  z ±5.0   radius 3.0–5.0
  // Spine cyl r=0.92, h=9.0 (z ±4.5).  Slab x ±1.55.
  // Ribs r=0.95, tube=0.11 → y_outer=1.06.
  // Keel bottom y=-1.15. PanelPatch max|y|≈1.05.
  // spanX=3.10  spanY=2.21  spanZ=9.45
  // tooTall: 2.21 ≤ 0.75*3.10=2.325 ✓  tooStubby: 9.45 ≥ 2.4*3.10=7.44 ✓
  // maxAbsX=1.55 ≤ 1.8 ✓  maxAbsY=1.15 ≤ 1.2 ✓  maxAbsZ=4.85 ≤ 5.0 ✓
  // max radius ≈ 4.85 ∈ [3.0, 5.0] ✓
  // glowZ=3.8  sternZ=4.60  [2.53, 5.80] ✓
  cutter: {
    glowZ: 3.8,
    build(b, st) {
      const W = weather;
      const MIDNIGHT = st.hull;
      const DEEP    = st.hullDark;
      const SILVER  = st.trim;
      const AMBER   = st.accent;
      const CANDLE  = 0xfff8f0;

      // Spine cylinder: r=0.92, h=9.0
      cyl(b, 'hull', W(MIDNIGHT, 0), 0.92, 0.92, 9.0, 28, { rx: HPI });

      // Wide hull slab — x ±1.55, spanX=3.10
      box(b, 'hull', W(MIDNIGHT, 1), 3.10, 0.70, 8.5);

      // Observation dome: center z=-4.10, r=0.75 → tip z=-4.85
      b.push(0, 0, -4.10);
      sphere(b, 'hull', W(SILVER, 1), 0.75, 16, 10);
      b.pop();

      // 6 silver rib rings; outer y=1.06 ≤ 1.2 ✓
      ribBands(b, 'hull', W(SILVER, 0), { r: 0.95, tube: 0.11, from: -3.6, to: 3.6, count: 6, axis: 'z' });

      // Keel shrine: center y=-1.02, bottom y=-1.15 ≤ 1.2 ✓
      b.push(0, -1.02, 0.5);
      box(b, 'hull', W(SILVER, 2), 0.80, 0.25, 1.20);
      cyl(b, 'hull', W(AMBER, 1), 0.16, 0.16, 0.80, 8, { rx: HPI });
      b.pop();

      // Stern engine block: z_max = 4.40+0.20 = 4.60 ≤ 5.0 ✓
      b.push(0, 0, 4.40);
      box(b, 'hull', W(DEEP, 1), 1.50, 0.52, 0.40);
      b.pop();

      // Hull plating (max|y| from patches ≈ 1.05 ≤ 1.2 ✓)
      panelPatches(b, 'hull', [W(MIDNIGHT, 0), W(MIDNIGHT, 1), W(SILVER, 2), W(SILVER, 3)], {
        r: 0.92, from: -4.0, to: 4.0, count: 32, seed: 7202, w: 0.60, h: 0.50, t: 0.11, axis: 'z',
      });
      panelPatches(b, 'hull', [W(MIDNIGHT, 2), W(DEEP, 0), W(DEEP, 1)], {
        r: 0.92, from: -2.5, to: 2.5, count: 22, seed: 7212, w: 0.50, h: 0.40, t: 0.09, axis: 'z',
      });

      // ── LIGHTS ───────────────────────────────────────────────────
      b.push(0, 0, -3.85);
      sphere(b, 'lights', CANDLE, 0.34, 7, 5);
      b.pop();

      b.push(0, -1.00, 0.5);
      sphere(b, 'lights', CANDLE, 0.15, 6, 4);
      b.pop();

      lampString(b, 'lights', CANDLE, { ax: -0.95, ay: 0, az: -3.6, bx: 0.95, by: 0, bz: -3.6, count: 3, size: 0.10 });
      lampString(b, 'lights', CANDLE, { ax: -0.95, ay: 0, az:  0.0, bx: 0.95, by: 0, bz:  0.0, count: 3, size: 0.10 });
      lampString(b, 'lights', CANDLE, { ax: -0.95, ay: 0, az:  3.6, bx: 0.95, by: 0, bz:  3.6, count: 3, size: 0.10 });

      b.push(-1.25, 0, 4.40);
      sphere(b, 'lights', CANDLE, 0.10, 4, 3);
      b.pop();
      b.push( 1.25, 0, 4.40);
      sphere(b, 'lights', CANDLE, 0.10, 4, 3);
      b.pop();
    },
  },

  // ---------- ACE (interceptor) ----------
  // Envelope: x ±2.2  y ±1.3  z ±5.8   radius 4.4–5.8
  // Spine cyl r=1.05, h=10.6 (z ±5.3).  Slab x ±1.90.
  // Ribs r=1.08, tube=0.12 → y_outer=1.20.
  // Keel bottom y=-1.26. PanelPatch max|y|≈1.19.
  // spanX=3.80  spanY=2.46  spanZ=11.03
  // tooTall: 2.46 ≤ 0.75*3.80=2.85 ✓  tooStubby: 11.03 ≥ 2.4*3.80=9.12 ✓
  // maxAbsX=1.90 ≤ 2.2 ✓  maxAbsY=1.26 ≤ 1.3 ✓  maxAbsZ=5.60 ≤ 5.8 ✓
  // max radius ≈ 5.60 ∈ [4.4, 5.8] ✓
  // glowZ=4.5  sternZ=5.425  [2.984, 6.625] ✓
  ace: {
    glowZ: 4.5,
    build(b, st) {
      const W = weather;
      const MIDNIGHT = st.hull;
      const DEEP    = st.hullDark;
      const SILVER  = st.trim;
      const AMBER   = st.accent;
      const CANDLE  = 0xfff8f0;

      // Spine cylinder: r=1.05, h=10.6
      cyl(b, 'hull', W(MIDNIGHT, 0), 1.05, 1.05, 10.6, 32, { rx: HPI });

      // Wide hull slab — x ±1.90, spanX=3.80
      box(b, 'hull', W(MIDNIGHT, 1), 3.80, 0.88, 10.0);

      // Observation dome: center z=-4.70, r=0.90 → tip z=-5.60
      b.push(0, 0, -4.70);
      sphere(b, 'hull', W(SILVER, 1), 0.90, 16, 10);
      b.pop();

      // 7 silver rib rings; outer y=1.20 ≤ 1.3 ✓
      ribBands(b, 'hull', W(SILVER, 0), { r: 1.08, tube: 0.12, from: -4.2, to: 4.2, count: 7, axis: 'z' });

      // Keel shrine: center y=-1.12, bottom y=-1.26 ≤ 1.3 ✓
      b.push(0, -1.12, 0.5);
      box(b, 'hull', W(SILVER, 2), 1.00, 0.28, 1.60);
      cyl(b, 'hull', W(AMBER, 1), 0.18, 0.18, 1.10, 8, { rx: HPI });
      b.pop();

      // Stern engine block: z_max = 5.20+0.225 = 5.425 ≤ 5.8 ✓
      b.push(0, 0, 5.20);
      box(b, 'hull', W(DEEP, 1), 1.90, 0.62, 0.45);
      b.pop();

      // Hull plating (max|y| ≈ 1.19 ≤ 1.3 ✓)
      panelPatches(b, 'hull', [W(MIDNIGHT, 0), W(MIDNIGHT, 1), W(SILVER, 2), W(SILVER, 3)], {
        r: 1.05, from: -4.6, to: 4.6, count: 36, seed: 7203, w: 0.65, h: 0.55, t: 0.12, axis: 'z',
      });
      panelPatches(b, 'hull', [W(MIDNIGHT, 2), W(DEEP, 0), W(DEEP, 1)], {
        r: 1.05, from: -3.0, to: 3.0, count: 24, seed: 7213, w: 0.55, h: 0.45, t: 0.10, axis: 'z',
      });

      // ── LIGHTS ───────────────────────────────────────────────────
      b.push(0, 0, -4.45);
      sphere(b, 'lights', CANDLE, 0.40, 8, 6);
      b.pop();

      b.push(0, -1.10, 0.5);
      sphere(b, 'lights', CANDLE, 0.18, 6, 4);
      sphere(b, 'lights', CANDLE, 0.18, 6, 4, { z: 0.70 });
      b.pop();

      lampString(b, 'lights', CANDLE, { ax: -1.08, ay: 0, az: -4.2, bx: 1.08, by: 0, bz: -4.2, count: 4, size: 0.11 });
      lampString(b, 'lights', CANDLE, { ax: -1.08, ay: 0, az:  0.0, bx: 1.08, by: 0, bz:  0.0, count: 4, size: 0.11 });
      lampString(b, 'lights', CANDLE, { ax: -1.08, ay: 0, az:  4.2, bx: 1.08, by: 0, bz:  4.2, count: 4, size: 0.11 });

      b.push(-1.55, 0, 5.20);
      sphere(b, 'lights', CANDLE, 0.11, 4, 3);
      b.pop();
      b.push( 1.55, 0, 5.20);
      sphere(b, 'lights', CANDLE, 0.11, 4, 3);
      b.pop();
    },
  },

  // ---------- FREIGHTER ----------
  // Envelope: x ±2.8  y ±2.0  z ±7.4   radius 4.4–7.2
  // Spine cyl r=1.45, h=13.0 (z ±6.5).  Slab x ±2.55.
  // Ribs r=1.48, tube=0.14 → y_outer=1.62.
  // Sails (2): y_center=1.68, top y=1.74. Keel bottom y=-1.91.
  // spanX=5.10  spanY=3.65  spanZ=13.48
  // tooTall: 3.65 ≤ 0.75*5.10=3.825 ✓  tooStubby: 13.48 ≥ 2.4*5.10=12.24 ✓
  // maxAbsX=2.55 ≤ 2.8 ✓  maxAbsY=1.91 ≤ 2.0 ✓  maxAbsZ=6.90 ≤ 7.4 ✓
  // max radius ≈ 6.90 ∈ [4.4, 7.2] ✓
  // glowZ=5.5  sternZ=6.575  [3.616, 7.775] ✓
  freighter: {
    glowZ: 5.5,
    build(b, st) {
      const W = weather;
      const MIDNIGHT = st.hull;
      const DEEP    = st.hullDark;
      const SILVER  = st.trim;
      const AMBER   = st.accent;
      const CANDLE  = 0xfff8f0;

      // Spine cylinder: r=1.45, h=13.0
      cyl(b, 'hull', W(MIDNIGHT, 0), 1.45, 1.45, 13.0, 36, { rx: HPI });

      // Wide hull slab — x ±2.55, spanX=5.10
      box(b, 'hull', W(MIDNIGHT, 1), 5.10, 1.10, 12.5);

      // Observation dome: center z=-5.80, r=1.10 → tip z=-6.90
      b.push(0, 0, -5.80);
      sphere(b, 'hull', W(SILVER, 1), 1.10, 18, 12);
      b.pop();

      // 8 silver rib rings; outer y=1.62 ≤ 2.0 ✓
      ribBands(b, 'hull', W(SILVER, 0), { r: 1.48, tube: 0.14, from: -5.5, to: 5.5, count: 8, axis: 'z' });

      // Keel shrine: center y=-1.65, bottom y=-1.91 ≤ 2.0 ✓
      b.push(0, -1.65, 0.5);
      box(b, 'hull', W(SILVER, 2), 1.20, 0.52, 1.50);
      cyl(b, 'hull', W(AMBER, 1), 0.22, 0.22, 1.10, 8, { rx: HPI });
      b.pop();

      // Stern engine block: z_max = 6.30+0.275 = 6.575 ≤ 7.4 ✓
      b.push(0, 0, 6.30);
      box(b, 'hull', W(DEEP, 1), 2.70, 0.95, 0.55);
      b.pop();

      // Sails — 2 flat panels swept aft; top y=1.74 ≤ 2.0 ✓
      b.push(0, 1.68, -1.50);
      box(b, 'hull', W(SILVER, 0), 5.00, 0.12, 2.00);
      b.pop();
      b.push(0, 1.68,  2.50);
      box(b, 'hull', W(SILVER, 1), 5.00, 0.12, 2.00);
      b.pop();

      // Hull plating (max|y| from patches ≈ 1.59 ≤ 2.0 ✓)
      panelPatches(b, 'hull', [W(MIDNIGHT, 0), W(MIDNIGHT, 1), W(MIDNIGHT, 2), W(SILVER, 2), W(SILVER, 3)], {
        r: 1.45, from: -5.8, to: 5.8, count: 45, seed: 7204, w: 0.72, h: 0.58, t: 0.14, axis: 'z',
      });
      panelPatches(b, 'hull', [W(MIDNIGHT, 1), W(DEEP, 0), W(DEEP, 1)], {
        r: 1.45, from: -3.5, to: 3.5, count: 30, seed: 7214, w: 0.60, h: 0.48, t: 0.11, axis: 'z',
      });

      // ── LIGHTS ───────────────────────────────────────────────────
      b.push(0, 0, -5.55);
      sphere(b, 'lights', CANDLE, 0.50, 8, 6);
      b.pop();

      // Shrine lamp — inside shrine housing
      b.push(0, -1.62, 0.5);
      sphere(b, 'lights', CANDLE, 0.20, 6, 4);
      sphere(b, 'lights', CANDLE, 0.20, 6, 4, { z: 0.60 });
      b.pop();

      // Rib ring running lights — at 4 of the 8 ring positions
      lampString(b, 'lights', CANDLE, { ax: -1.48, ay: 0, az: -5.5,  bx: 1.48, by: 0, bz: -5.5,  count: 4, size: 0.12 });
      lampString(b, 'lights', CANDLE, { ax: -1.48, ay: 0, az: -1.86, bx: 1.48, by: 0, bz: -1.86, count: 4, size: 0.12 });
      lampString(b, 'lights', CANDLE, { ax: -1.48, ay: 0, az:  1.86, bx: 1.48, by: 0, bz:  1.86, count: 4, size: 0.12 });
      lampString(b, 'lights', CANDLE, { ax: -1.48, ay: 0, az:  5.5,  bx: 1.48, by: 0, bz:  5.5,  count: 4, size: 0.12 });

      // Sail edge lights — seated on the sail panel surface
      lampString(b, 'lights', CANDLE, { ax: -2.50, ay: 1.68, az: -1.50, bx: 2.50, by: 1.68, bz: -1.50, count: 5, size: 0.11 });
      lampString(b, 'lights', CANDLE, { ax: -2.50, ay: 1.68, az:  2.50, bx: 2.50, by: 1.68, bz:  2.50, count: 5, size: 0.11 });

      // Stern running lights
      b.push(-2.20, 0, 6.30);
      sphere(b, 'lights', CANDLE, 0.12, 4, 3);
      b.pop();
      b.push( 2.20, 0, 6.30);
      sphere(b, 'lights', CANDLE, 0.12, 4, 3);
      b.pop();
    },
  },

  // ---------- HEAVY ----------
  // Envelope: x ±3.6  y ±2.4  z ±8.8   radius 6.0–9.0
  // Spine cyl r=1.80, h=16.0 (z ±8.0).  Slab x ±3.15.
  // Ribs r=1.84, tube=0.16 → y_outer=2.00.
  // Sails (3): y_center=2.02, top y=2.09. Keel bottom y=-2.36.
  // spanX=6.30  spanY=4.45  spanZ=16.60
  // tooTall: 4.45 ≤ 0.75*6.30=4.725 ✓  tooStubby: 16.60 ≥ 2.4*6.30=15.12 ✓
  // maxAbsX=3.15 ≤ 3.6 ✓  maxAbsY=2.36 ≤ 2.4 ✓  maxAbsZ=8.50 ≤ 8.8 ✓
  // max radius ≈ 8.50 ∈ [6.0, 9.0] ✓
  // glowZ=6.8  sternZ=8.10  [4.455, 9.30] ✓
  heavy: {
    glowZ: 6.8,
    build(b, st) {
      const W = weather;
      const MIDNIGHT = st.hull;
      const DEEP    = st.hullDark;
      const SILVER  = st.trim;
      const AMBER   = st.accent;
      const CANDLE  = 0xfff8f0;

      // Spine cylinder: r=1.80, h=16.0
      cyl(b, 'hull', W(MIDNIGHT, 0), 1.80, 1.80, 16.0, 40, { rx: HPI });

      // Wide hull slab — x ±3.15, spanX=6.30
      box(b, 'hull', W(MIDNIGHT, 1), 6.30, 1.40, 15.5);

      // Observation dome: center z=-7.00, r=1.50 → tip z=-8.50
      b.push(0, 0, -7.00);
      sphere(b, 'hull', W(SILVER, 1), 1.50, 20, 12);
      b.pop();

      // 10 silver rib rings; outer y=2.00 ≤ 2.4 ✓
      ribBands(b, 'hull', W(SILVER, 0), { r: 1.84, tube: 0.16, from: -6.5, to: 6.5, count: 10, axis: 'z' });

      // Keel shrine: center y=-2.05, bottom y=-2.36 ≤ 2.4 ✓
      b.push(0, -2.05, 0.5);
      box(b, 'hull', W(SILVER, 2), 1.60, 0.62, 2.00);
      cyl(b, 'hull', W(AMBER, 1), 0.26, 0.26, 1.60, 8, { rx: HPI });
      b.pop();

      // Stern engine block: z_max = 7.80+0.30 = 8.10 ≤ 8.8 ✓
      b.push(0, 0, 7.80);
      box(b, 'hull', W(DEEP, 1), 3.50, 1.15, 0.60);
      b.pop();

      // Sails — 3 flat panels swept aft; top y=2.09 ≤ 2.4 ✓
      b.push(0, 2.02, -3.00);
      box(b, 'hull', W(SILVER, 0), 6.00, 0.14, 2.50);
      b.pop();
      b.push(0, 2.02,  0.50);
      box(b, 'hull', W(SILVER, 1), 6.00, 0.14, 2.50);
      b.pop();
      b.push(0, 2.02,  4.00);
      box(b, 'hull', W(SILVER, 2), 6.00, 0.14, 2.50);
      b.pop();

      // Hull plating (max|y| ≈ 1.96 ≤ 2.4 ✓)
      panelPatches(b, 'hull', [W(MIDNIGHT, 0), W(MIDNIGHT, 1), W(MIDNIGHT, 2), W(SILVER, 2), W(SILVER, 3)], {
        r: 1.80, from: -7.0, to: 7.0, count: 50, seed: 7205, w: 0.85, h: 0.65, t: 0.15, axis: 'z',
      });
      panelPatches(b, 'hull', [W(MIDNIGHT, 1), W(DEEP, 0), W(DEEP, 1)], {
        r: 1.80, from: -4.5, to: 4.5, count: 35, seed: 7215, w: 0.70, h: 0.55, t: 0.12, axis: 'z',
      });

      // ── LIGHTS ───────────────────────────────────────────────────
      b.push(0, 0, -6.70);
      sphere(b, 'lights', CANDLE, 0.60, 9, 7);
      b.pop();

      // Shrine lamps
      b.push(0, -2.02, 0.5);
      sphere(b, 'lights', CANDLE, 0.24, 6, 4);
      sphere(b, 'lights', CANDLE, 0.24, 6, 4, { z:  0.70 });
      sphere(b, 'lights', CANDLE, 0.24, 6, 4, { z: -0.70 });
      b.pop();

      // Rib ring lights — 5 strings at every other ring position
      for (let i = 0; i < 5; i++) {
        const z = -6.5 + i * 3.25;
        lampString(b, 'lights', CANDLE, { ax: -1.84, ay: 0, az: z, bx: 1.84, by: 0, bz: z, count: 4, size: 0.13 });
      }

      // Sail edge lights — 1 string per sail
      lampString(b, 'lights', CANDLE, { ax: -3.00, ay: 2.02, az: -3.00, bx: 3.00, by: 2.02, bz: -3.00, count: 5, size: 0.12 });
      lampString(b, 'lights', CANDLE, { ax: -3.00, ay: 2.02, az:  0.50, bx: 3.00, by: 2.02, bz:  0.50, count: 5, size: 0.12 });
      lampString(b, 'lights', CANDLE, { ax: -3.00, ay: 2.02, az:  4.00, bx: 3.00, by: 2.02, bz:  4.00, count: 5, size: 0.12 });

      // Stern lights
      b.push(-2.80, 0, 7.80);
      sphere(b, 'lights', CANDLE, 0.15, 4, 3);
      b.pop();
      b.push( 2.80, 0, 7.80);
      sphere(b, 'lights', CANDLE, 0.15, 4, 3);
      b.pop();
    },
  },

  // ---------- FRIGATE ----------
  // Envelope: x ±9.0  y ±6.0  z ±26.0   radius 21.0–32.0
  // Spine cyl r=4.50, h=44.0 (z ±22.0).  Slab x ±7.0.
  // Ribs r=4.60, tube=0.28 → y_outer=4.88.
  // Sails (5): y_center=4.95, top y=5.05. Keel bottom y=-5.25.
  // spanX=14.0  spanY=10.30  spanZ=47.20
  // tooTall: 10.30 ≤ 0.75*14.0=10.50 ✓  tooStubby: 47.20 ≥ 2.4*14.0=33.60 ✓
  // maxAbsX=7.0 ≤ 9.0 ✓  maxAbsY=5.25 ≤ 6.0 ✓  maxAbsZ=25.0 ≤ 26.0 ✓
  // max radius ≈ 25.0 ∈ [21.0, 32.0] ✓
  // glowZ=20.5  sternZ=22.20  [12.21, 23.40] ✓
  frigate: {
    glowZ: 20.5,
    build(b, st) {
      const W = weather;
      const MIDNIGHT = st.hull;
      const DEEP    = st.hullDark;
      const SILVER  = st.trim;
      const AMBER   = st.accent;
      const CANDLE  = 0xfff8f0;

      // Spine cylinder: r=4.50, h=44.0
      cyl(b, 'hull', W(MIDNIGHT, 0), 4.50, 4.50, 44.0, 52, { rx: HPI });

      // Wide hull slab — x ±7.0, spanX=14.0
      box(b, 'hull', W(MIDNIGHT, 1), 14.00, 3.50, 43.0);

      // Observation dome: center z=-20.0, r=5.0 → tip z=-25.0
      b.push(0, 0, -20.0);
      sphere(b, 'hull', W(SILVER, 1), 5.00, 24, 14);
      b.pop();

      // 16 silver rib rings; outer y=4.88 ≤ 6.0 ✓
      ribBands(b, 'hull', W(SILVER, 0), { r: 4.60, tube: 0.28, from: -18.0, to: 18.0, count: 16, axis: 'z' });

      // Keel shrine: center y=-4.65, bottom y=-5.25 ≤ 6.0 ✓
      b.push(0, -4.65, 1.0);
      box(b, 'hull', W(SILVER, 2), 3.50, 1.20, 4.50);
      cyl(b, 'hull', W(AMBER, 1), 0.55, 0.55, 1.20, 10, { rx: HPI, z: -1.2 });
      cyl(b, 'hull', W(AMBER, 2), 0.55, 0.55, 1.20, 10, { rx: HPI, z:  0.0 });
      cyl(b, 'hull', W(AMBER, 3), 0.55, 0.55, 1.20, 10, { rx: HPI, z:  1.2 });
      b.pop();

      // Stern engine block: z_max = 21.80+0.40 = 22.20 ≤ 26.0 ✓
      b.push(0, 0, 21.80);
      box(b, 'hull', W(DEEP, 1), 8.00, 3.00, 0.80);
      b.pop();

      // Sails — 5 flat panels swept aft; top y=5.05 ≤ 6.0 ✓
      // Integer sailZ so that sailZ±1.75 always lands in an adjacent z-cell:
      // e.g. sailZ=5 → upper z-face at 6.75 → floor(6.75)=6, one step from floor(5)=5.
      const sailZ = [-10.0, -5.0, 0.0, 5.0, 10.0];
      for (let i = 0; i < 5; i++) {
        b.push(0, 4.95, sailZ[i]);
        box(b, 'hull', W(SILVER, i % 4), 14.00, 0.20, 3.50);
        b.pop();
      }

      // Hull plating (max|y| ≈ 4.84 ≤ 6.0 ✓)
      panelPatches(b, 'hull', [W(MIDNIGHT, 0), W(MIDNIGHT, 1), W(MIDNIGHT, 2), W(SILVER, 2), W(SILVER, 3)], {
        r: 4.50, from: -19.0, to: 19.0, count: 80, seed: 7206, w: 2.20, h: 1.80, t: 0.24, axis: 'z',
      });
      panelPatches(b, 'hull', [W(MIDNIGHT, 1), W(DEEP, 0), W(DEEP, 1)], {
        r: 4.50, from: -12.0, to: 12.0, count: 50, seed: 7216, w: 1.80, h: 1.40, t: 0.20, axis: 'z',
      });

      // ── LIGHTS ───────────────────────────────────────────────────
      // Nose dome lights — placed near the dome sphere surface so they are
      // within 1 cell of hull material (dome hull r=5.0 from z=-20.0).
      // (Interior spheres are orphaned; the dome shell is hollow.)
      b.push(0, 0, -24.5);          // 0.5 inside dome tip at (0,0,-25.0)
      sphere(b, 'lights', CANDLE, 0.25, 5, 4);
      b.pop();
      b.push(0, 4.0, -22.0);        // near cylinder front-cap rim at (0,4.50,-22.0)
      sphere(b, 'lights', CANDLE, 0.25, 5, 4);
      b.pop();

      // Shrine lamps — inside shrine housing
      b.push(0, -4.60, 1.0);
      sphere(b, 'lights', CANDLE, 0.48, 6, 4, { z: -1.2 });
      sphere(b, 'lights', CANDLE, 0.48, 6, 4, { z: -0.6 });
      sphere(b, 'lights', CANDLE, 0.48, 6, 4, { z:  0.0 });
      sphere(b, 'lights', CANDLE, 0.48, 6, 4, { z:  0.6 });
      sphere(b, 'lights', CANDLE, 0.48, 6, 4, { z:  1.2 });
      b.pop();

      // Rib ring lights — endpoints only (count=2), seated on the cylinder
      // surface at x=±4.60 (0.10 outside the r=4.50 cylinder → same cell).
      // count=4 placed inner lamps at r=1.53, far from hull — orphaned.
      for (let i = 0; i < 8; i++) {
        const z = -18.0 + i * (36.0 / 7);
        lampString(b, 'lights', CANDLE, { ax: -4.60, ay: 0, az: z, bx: 4.60, by: 0, bz: z, count: 2, size: 0.18 });
      }

      // Sail edge lights — 1 string per sail panel
      for (let i = 0; i < 5; i++) {
        lampString(b, 'lights', CANDLE, { ax: -7.00, ay: 4.95, az: sailZ[i], bx: 7.00, by: 4.95, bz: sailZ[i], count: 5, size: 0.16 });
      }

      // Stern running lights
      b.push(-6.00, 0, 21.80);
      sphere(b, 'lights', CANDLE, 0.30, 5, 4);
      b.pop();
      b.push( 6.00, 0, 21.80);
      sphere(b, 'lights', CANDLE, 0.30, 5, 4);
      b.pop();
    },
  },

};
