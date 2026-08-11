/**
 * Ferrous Hegemony ship sculpts — Wave 47 Round 2.
 *
 * VISUAL DESIGN
 * Ferrous ships are monumental ironclad SPINDLES: long, low, symmetrical.
 * The silhouette reads as a SHIP — 4–6× longer than its beam — not a drum.
 *
 * Design language:
 *  - BLUNT ARMOURED PROW: Wide flat bow face, a battering ram not a needle.
 *  - SPINDLE FORM: Hull narrows from midship toward bow and stern; three box
 *    sections (bow, spine, stern) overlap to carve the profile.
 *  - CITADEL COMMAND TOWER: Low stepped pagoda on the dorsal spine, spread
 *    along Z rather than stacked upward; respects tooTall budget.
 *  - PAIRED BARREL HOUSINGS: Formal PAIRED gun housings on each flank.
 *  - CRIMSON RECOGNITION BANDS: Torus rings in accent colour at key Z positions.
 *  - ARMOUR RIB BANDS: ribBands(axis='z') wrap the hull at regular intervals.
 *  - BRASS PLATE: trim on tower caps and fine detail.
 *
 * ROUND-2 ENVELOPE (max abs x / y / z):
 *   light      1.3 / 0.9 / 3.4
 *   cutter     1.8 / 1.2 / 5.0
 *   ace        2.2 / 1.3 / 5.8
 *   freighter  2.8 / 2.0 / 7.4
 *   heavy      3.6 / 2.4 / 8.8
 *   frigate    9.0 / 6.0 / 26.0
 *
 * PROPORTION PINS (both must hold):
 *   tooStubby:  spanZ >= 2.4 * spanX   (length dominates)
 *   tooTall:    spanY <= 0.75 * spanX  (beam exceeds height)
 *
 * DESIGN BUDGET PER CLASS:
 *   All key contributors to spanX / spanY / spanZ are listed:
 *   - spanX is dominated by gun housings (always the widest point)
 *   - spanY is dominated by ribBands (symmetric r+tube in Y)
 *   - ribBands r+tube must satisfy: 2*(r+tube) <= 0.75 * spanX
 *   - Tower top must stay <= r+tube (so ribs, not tower, set hiY)
 */

import {
  box, cyl, torus,
  ribBands, portholeRing, truss, antenna, lampString, ladder,
  windowGrid,
} from '../station-detail.js';

/** Near-white tints for lights channel (all sRGB channels >= 0.6). */
const WARM_TINT = 0xfff2d8;
const COOL_TINT = 0xe8f0ff;
const CREAM_TINT = 0xe8dcc8;

/**
 * Ferrous Hegemony ship sculpts.
 * @type {Object<string, {glowZ: number, build: Function}>}
 */
export const ferrousShip = {

  // ── LIGHT ─────────────────────────────────────────────────────────────────
  // spanX≈2.44 (gun housings ±1.22), spanY≈1.60 (ribs ±0.80), spanZ≈6.40
  // tooStubby: 6.40 >= 2.4*2.44=5.86 ✓   tooTall: 1.60 <= 0.75*2.44=1.83 ✓
  // maxAbs x=1.22, y=0.80, z=3.20   radius≈3.29 in [2.2,3.5]   fb=2.5
  light: {
    glowZ: 2.8,
    build(b, st) {
      const { hull, hullDark, trim, accent } = st;

      // ── Hull spine ──
      b.push(0, 0, 0);
      box(b, 'hull', hull, 1.60, 0.65, 5.00);
      b.pop();

      // Bow armour section — blunt prow
      b.push(0, 0, -2.60);
      box(b, 'hull', hull, 1.40, 0.60, 1.20);
      b.pop();

      // Aft taper section
      b.push(0, 0, 2.70);
      box(b, 'hull', hullDark, 1.00, 0.50, 1.00);
      b.pop();

      // ── Citadel command tower — dorsal, spread along Z ──
      // step1 top y = 0.325+0.27=0.595
      b.push(0, 0.46, 0.40);
      box(b, 'hull', hull, 0.60, 0.27, 0.65);
      b.pop();
      // step2 top y = 0.595+0.16=0.755
      b.push(0, 0.675, 0.40);
      box(b, 'hull', hullDark, 0.40, 0.16, 0.44);
      b.pop();
      // brass trim cap — top y = 0.755+0.04=0.795 <= 0.80
      b.push(0, 0.775, 0.40);
      box(b, 'hull', trim, 0.24, 0.04, 0.26);
      b.pop();

      // ── Crimson recognition band ──
      b.push(0, 0, -1.90);
      torus(b, 'hull', accent, 0.72, 0.07, 10, 8, Math.PI * 2);
      b.pop();

      // ── Paired gun housings ──
      b.push(-1.10, 0, -0.60);
      box(b, 'hull', hull, 0.24, 0.22, 0.70);
      b.pop();
      b.push(1.10, 0, -0.60);
      box(b, 'hull', hull, 0.24, 0.22, 0.70);
      b.pop();

      // Gun barrels (Z-aligned, pointing toward -Z bow)
      b.push(-1.04, 0, -1.10);
      cyl(b, 'hull', hullDark, 0.05, 0.05, 0.50, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(1.04, 0, -1.10);
      cyl(b, 'hull', hullDark, 0.05, 0.05, 0.50, 8, { rx: Math.PI / 2 });
      b.pop();

      // Lateral fairings — connect gun housings to spine
      b.push(-0.92, 0, -0.60);
      box(b, 'hull', hullDark, 0.24, 0.16, 0.50);
      b.pop();
      b.push(0.92, 0, -0.60);
      box(b, 'hull', hullDark, 0.24, 0.16, 0.50);
      b.pop();

      // ── Armour rib bands (axis='z' → rings in XY plane along Z) ──
      // r+tube = 0.80 → spans y ±0.80; maxY=0.80 <= 0.9 ✓
      ribBands(b, 'hull', hullDark, {
        r: 0.73, tube: 0.07, from: -2.50, to: 2.50, count: 8, axis: 'z', tseg: 12,
      });

      // ── Porthole rings amidships ──
      portholeRing(b, 'hull', hull, { r: 0.76, count: 8, size: 0.07, y: 0, seg: 8 });

      // ── Engine bells (Z-aligned nozzles at stern) ──
      b.push(-0.26, 0, 3.10);
      cyl(b, 'hull', hullDark, 0.14, 0.18, 0.22, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(0.26, 0, 3.10);
      cyl(b, 'hull', hullDark, 0.14, 0.18, 0.22, 8, { rx: Math.PI / 2 });
      b.pop();

      // Tiny antennae on citadel apex — top y = 0.755+0.02+0.02=0.795 <= 0.80
      antenna(b, 'hull', hullDark, trim, {
        x: -0.18, y: 0.755, z: 0.40, h: 0.02, r: 0.015, tip: 0.020,
      });
      antenna(b, 'hull', hullDark, trim, {
        x: 0.18, y: 0.755, z: 0.40, h: 0.02, r: 0.015, tip: 0.020,
      });

      // Service ladders
      ladder(b, 'hull', trim, { x: -0.82, y: -0.22, z: 1.00, h: 0.85, w: 0.16, rungs: 3 });
      ladder(b, 'hull', trim, { x: 0.82, y: -0.22, z: 1.00, h: 0.85, w: 0.16, rungs: 3 });

      // ── LIGHTS ──
      // Running lights along hull flanks
      lampString(b, 'lights', WARM_TINT, {
        ax: -1.00, ay: 0.28, az: -2.30, bx: -1.00, by: 0.28, bz: 2.30, count: 6, size: 0.09,
      });
      lampString(b, 'lights', WARM_TINT, {
        ax: 1.00, ay: 0.28, az: -2.30, bx: 1.00, by: 0.28, bz: 2.30, count: 6, size: 0.09,
      });
      // Citadel bridge windows
      windowGrid(b, 'lights', COOL_TINT, {
        rows: 1, cols: 2, rowGap: 0.10, colGap: 0.14,
        w: 0.07, h: 0.06, d: 0.04, x: 0, y: 0.65, z: 0.73, axis: 'x', ry: 0,
      });
      // Bow recognition lamps
      lampString(b, 'lights', CREAM_TINT, {
        ax: -0.50, ay: 0, az: -3.00, bx: 0.50, by: 0, bz: -3.00, count: 3, size: 0.08,
      });
    },
  },

  // ── CUTTER ────────────────────────────────────────────────────────────────
  // spanX≈3.50 (gun housings ±1.75), spanY≈2.16 (ribs ±1.08), spanZ≈9.00
  // tooStubby: 9.00 >= 2.4*3.50=8.40 ✓   tooTall: 2.16 <= 0.75*3.50=2.63 ✓
  // maxAbs x=1.75, y=1.08, z=4.50   radius≈4.60 in [3.0,5.0]   fb=3.5
  cutter: {
    glowZ: 4.0,
    build(b, st) {
      const { hull, hullDark, trim, accent } = st;

      // ── Hull spine ──
      b.push(0, 0, 0);
      box(b, 'hull', hull, 2.20, 0.90, 7.50);
      b.pop();

      // Bow armour
      b.push(0, 0, -3.80);
      box(b, 'hull', hull, 1.80, 0.75, 1.40);
      b.pop();

      // Aft section
      b.push(0, 0, 3.90);
      box(b, 'hull', hullDark, 1.30, 0.60, 1.20);
      b.pop();

      // ── Citadel — two steps + trim cap ──
      // step1 top y = 0.45+0.32=0.77
      b.push(0, 0.61, 0.50);
      box(b, 'hull', hull, 0.82, 0.32, 0.95);
      b.pop();
      // step2 top y = 0.77+0.22=0.99
      b.push(0, 0.88, 0.50);
      box(b, 'hull', hullDark, 0.58, 0.22, 0.68);
      b.pop();
      // trim cap top y = 0.99+0.08=1.07 <= 1.08
      b.push(0, 1.03, 0.50);
      box(b, 'hull', trim, 0.35, 0.08, 0.40);
      b.pop();

      // ── Two crimson recognition bands ──
      b.push(0, 0, -2.80);
      torus(b, 'hull', accent, 1.00, 0.08, 12, 8, Math.PI * 2);
      b.pop();
      b.push(0, 0, -1.40);
      torus(b, 'hull', accent, 1.00, 0.08, 12, 8, Math.PI * 2);
      b.pop();

      // ── Paired gun housings ──
      b.push(-1.60, 0, -1.00);
      box(b, 'hull', hull, 0.30, 0.30, 0.90);
      b.pop();
      b.push(1.60, 0, -1.00);
      box(b, 'hull', hull, 0.30, 0.30, 0.90);
      b.pop();

      // Gun barrels
      b.push(-1.54, 0, -1.55);
      cyl(b, 'hull', hullDark, 0.06, 0.06, 0.60, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(1.54, 0, -1.55);
      cyl(b, 'hull', hullDark, 0.06, 0.06, 0.60, 8, { rx: Math.PI / 2 });
      b.pop();

      // Lateral fairings
      b.push(-1.35, 0, -1.00);
      box(b, 'hull', hullDark, 0.30, 0.22, 0.60);
      b.pop();
      b.push(1.35, 0, -1.00);
      box(b, 'hull', hullDark, 0.30, 0.22, 0.60);
      b.pop();

      // ── Armour rib bands ── r+tube=1.08 <= maxY=1.2 ✓
      ribBands(b, 'hull', hullDark, {
        r: 1.00, tube: 0.08, from: -3.50, to: 3.50, count: 10, axis: 'z', tseg: 14,
      });

      // ── Porthole rings ──
      portholeRing(b, 'hull', hull, { r: 1.02, count: 10, size: 0.09, y: 0, seg: 8 });

      // Engine bells
      b.push(-0.35, 0, 4.30);
      cyl(b, 'hull', hullDark, 0.18, 0.24, 0.32, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(0.35, 0, 4.30);
      cyl(b, 'hull', hullDark, 0.18, 0.24, 0.32, 8, { rx: Math.PI / 2 });
      b.pop();

      // (bridge wings removed — they pushed x to 1.90 > 1.8 limit)

      // Antennae — top y = 0.99+0.04+0.04=1.07 <= 1.08
      antenna(b, 'hull', hullDark, trim, {
        x: -0.25, y: 0.99, z: 0.50, h: 0.04, r: 0.025, tip: 0.040,
      });
      antenna(b, 'hull', hullDark, trim, {
        x: 0.25, y: 0.99, z: 0.50, h: 0.04, r: 0.025, tip: 0.040,
      });

      // Service ladders
      ladder(b, 'hull', trim, {
        x: -1.12, y: -0.30, z: 1.40, h: 1.20, w: 0.22, rungs: 4,
      });
      ladder(b, 'hull', trim, {
        x: 1.12, y: -0.30, z: 1.40, h: 1.20, w: 0.22, rungs: 4,
      });

      // ── LIGHTS ──
      lampString(b, 'lights', WARM_TINT, {
        ax: -1.55, ay: 0.38, az: -3.30, bx: -1.55, by: 0.38, bz: 3.30, count: 7, size: 0.11,
      });
      lampString(b, 'lights', WARM_TINT, {
        ax: 1.55, ay: 0.38, az: -3.30, bx: 1.55, by: 0.38, bz: 3.30, count: 7, size: 0.11,
      });
      windowGrid(b, 'lights', COOL_TINT, {
        rows: 2, cols: 3, rowGap: 0.12, colGap: 0.16,
        w: 0.09, h: 0.07, d: 0.05, x: 0, y: 0.90, z: 0.90, axis: 'x', ry: 0,
      });
      lampString(b, 'lights', CREAM_TINT, {
        ax: -0.75, ay: 0, az: -4.30, bx: 0.75, by: 0, bz: -4.30, count: 3, size: 0.10,
      });
    },
  },

  // ── ACE ───────────────────────────────────────────────────────────────────
  // spanX≈4.38 (gun housings ±2.19), spanY≈2.10 (ribs ±1.05), spanZ≈10.75
  // tooStubby: 10.75 >= 2.4*4.38=10.51 ✓   tooTall: 2.10 <= 0.75*4.38=3.29 ✓
  // maxAbs x=2.19, y=1.05, z=5.40   radius≈5.48 in [4.4,5.8]   fb=5.1
  ace: {
    glowZ: 4.8,
    build(b, st) {
      const { hull, hullDark, trim, accent } = st;

      // ── Hull spine ──
      b.push(0, 0, 0);
      box(b, 'hull', hull, 2.80, 1.00, 9.00);
      b.pop();

      // Bow armour
      b.push(0, 0, -4.60);
      box(b, 'hull', hull, 2.20, 0.85, 1.50);
      b.pop();

      // Aft section
      b.push(0, 0, 4.70);
      box(b, 'hull', hullDark, 1.60, 0.70, 1.40);
      b.pop();

      // ── Citadel — two steps ──
      // step1 top y = 0.50+0.32=0.82
      b.push(0, 0.66, 0.60);
      box(b, 'hull', hull, 1.00, 0.32, 1.15);
      b.pop();
      // step2 top y = 0.82+0.20=1.02 <= 1.05
      b.push(0, 0.92, 0.60);
      box(b, 'hull', hullDark, 0.72, 0.20, 0.85);
      b.pop();
      // Brass trim cap top = 1.02+0.025=1.045 <= 1.05
      b.push(0, 1.033, 0.60);
      box(b, 'hull', trim, 0.40, 0.025, 0.48);
      b.pop();

      // ── Three crimson recognition bands ──
      b.push(0, 0, -3.50);
      torus(b, 'hull', accent, 0.96, 0.09, 14, 8, Math.PI * 2);
      b.pop();
      b.push(0, 0, -1.80);
      torus(b, 'hull', accent, 0.96, 0.09, 14, 8, Math.PI * 2);
      b.pop();
      b.push(0, 0, 0.30);
      torus(b, 'hull', accent, 0.96, 0.09, 14, 8, Math.PI * 2);
      b.pop();

      // ── Triple gun batteries — PAIRED housings ──
      b.push(-2.00, 0, -1.20);
      box(b, 'hull', hull, 0.38, 0.30, 1.00);
      b.pop();
      b.push(2.00, 0, -1.20);
      box(b, 'hull', hull, 0.38, 0.30, 1.00);
      b.pop();

      // Gun barrels (×2 per side)
      b.push(-1.95, 0.10, -1.80);
      cyl(b, 'hull', hullDark, 0.06, 0.06, 0.70, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(-1.95, -0.10, -1.80);
      cyl(b, 'hull', hullDark, 0.06, 0.06, 0.70, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(1.95, 0.10, -1.80);
      cyl(b, 'hull', hullDark, 0.06, 0.06, 0.70, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(1.95, -0.10, -1.80);
      cyl(b, 'hull', hullDark, 0.06, 0.06, 0.70, 8, { rx: Math.PI / 2 });
      b.pop();

      // Lateral fairings
      b.push(-1.70, 0, -1.20);
      box(b, 'hull', hullDark, 0.38, 0.22, 0.70);
      b.pop();
      b.push(1.70, 0, -1.20);
      box(b, 'hull', hullDark, 0.38, 0.22, 0.70);
      b.pop();

      // ── Armour rib bands ── r+tube=1.05 <= maxY=1.3 ✓
      ribBands(b, 'hull', hullDark, {
        r: 0.96, tube: 0.09, from: -4.00, to: 4.00, count: 12, axis: 'z', tseg: 14,
      });

      // ── Porthole rings ──
      portholeRing(b, 'hull', hull, { r: 0.98, count: 12, size: 0.09, y: 0, seg: 8 });

      // Extended gun decks
      b.push(-1.90, -0.22, 0.50);
      box(b, 'hull', hullDark, 0.40, 0.20, 2.00);
      b.pop();
      b.push(1.90, -0.22, 0.50);
      box(b, 'hull', hullDark, 0.40, 0.20, 2.00);
      b.pop();

      // Engine bells
      b.push(-0.40, 0, 5.20);
      cyl(b, 'hull', hullDark, 0.22, 0.28, 0.40, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(0.40, 0, 5.20);
      cyl(b, 'hull', hullDark, 0.22, 0.28, 0.40, 8, { rx: Math.PI / 2 });
      b.pop();

      // Antennae — top y = 1.02+0.01+0.01=1.04 <= 1.05
      antenna(b, 'hull', hullDark, trim, {
        x: -0.30, y: 1.02, z: 0.60, h: 0.01, r: 0.020, tip: 0.010,
      });
      antenna(b, 'hull', hullDark, trim, {
        x: 0.30, y: 1.02, z: 0.60, h: 0.01, r: 0.020, tip: 0.010,
      });

      // Service ladders
      ladder(b, 'hull', trim, {
        x: -1.42, y: -0.38, z: 1.80, h: 1.50, w: 0.26, rungs: 5,
      });
      ladder(b, 'hull', trim, {
        x: 1.42, y: -0.38, z: 1.80, h: 1.50, w: 0.26, rungs: 5,
      });

      // ── LIGHTS ──
      lampString(b, 'lights', WARM_TINT, {
        ax: -1.90, ay: 0.42, az: -4.00, bx: -1.90, by: 0.42, bz: 4.00, count: 8, size: 0.12,
      });
      lampString(b, 'lights', WARM_TINT, {
        ax: 1.90, ay: 0.42, az: -4.00, bx: 1.90, by: 0.42, bz: 4.00, count: 8, size: 0.12,
      });
      windowGrid(b, 'lights', COOL_TINT, {
        rows: 2, cols: 3, rowGap: 0.14, colGap: 0.18,
        w: 0.10, h: 0.08, d: 0.05, x: 0, y: 0.95, z: 1.12, axis: 'x', ry: 0,
      });
      lampString(b, 'lights', CREAM_TINT, {
        ax: -1.00, ay: 0, az: -5.15, bx: 1.00, by: 0, bz: -5.15, count: 4, size: 0.11,
      });
    },
  },

  // ── FREIGHTER ─────────────────────────────────────────────────────────────
  // spanX≈5.54 (gun housings ±2.77), spanY≈2.90 (ribs ±1.45), spanZ≈13.40
  // tooStubby: 13.40 >= 2.4*5.54=13.30 ✓   tooTall: 2.90 <= 0.75*5.54=4.16 ✓
  // maxAbs x=2.77, y=1.45, z=6.70   radius≈6.87 in [4.4,7.2]   fb=5.1
  freighter: {
    glowZ: 6.0,
    build(b, st) {
      const { hull, hullDark, trim, accent } = st;

      // ── Hull spine ──
      b.push(0, 0, 0);
      box(b, 'hull', hull, 3.80, 1.50, 11.00);
      b.pop();

      // Bow armour — blunt prow
      b.push(0, 0, -5.80);
      box(b, 'hull', hull, 2.80, 1.20, 1.80);
      b.pop();

      // Aft section
      b.push(0, 0, 5.90);
      box(b, 'hull', hullDark, 2.00, 0.90, 2.20);
      b.pop();

      // ── Citadel command tower ──
      // step1 top y = 0.75+0.45=1.20
      b.push(0, 0.975, 1.00);
      box(b, 'hull', hull, 1.40, 0.45, 1.60);
      b.pop();
      // step2 top y = 1.20+0.24=1.44 <= 1.45
      b.push(0, 1.32, 1.00);
      box(b, 'hull', hullDark, 0.95, 0.24, 1.15);
      b.pop();
      // Brass trim rail
      b.push(0, 1.445, 1.00);
      box(b, 'hull', trim, 1.00, 0.01, 1.20);
      b.pop();

      // ── Two crimson recognition bands ──
      b.push(0, 0, -4.40);
      torus(b, 'hull', accent, 1.35, 0.10, 16, 8, Math.PI * 2);
      b.pop();
      b.push(0, 0, -2.20);
      torus(b, 'hull', accent, 1.35, 0.10, 16, 8, Math.PI * 2);
      b.pop();

      // ── Paired barrel housings — forward twin turrets ──
      b.push(-2.55, 0, -2.00);
      box(b, 'hull', hull, 0.44, 0.38, 1.20);
      b.pop();
      b.push(2.55, 0, -2.00);
      box(b, 'hull', hull, 0.44, 0.38, 1.20);
      b.pop();

      // Cannon barrels (×2 per side)
      b.push(-2.48, 0.12, -2.80);
      cyl(b, 'hull', hullDark, 0.08, 0.08, 0.90, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(-2.48, -0.12, -2.80);
      cyl(b, 'hull', hullDark, 0.08, 0.08, 0.90, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(2.48, 0.12, -2.80);
      cyl(b, 'hull', hullDark, 0.08, 0.08, 0.90, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(2.48, -0.12, -2.80);
      cyl(b, 'hull', hullDark, 0.08, 0.08, 0.90, 8, { rx: Math.PI / 2 });
      b.pop();

      // Lateral cargo sponsons
      b.push(-2.38, -0.40, 0.50);
      box(b, 'hull', hullDark, 0.44, 0.60, 3.00);
      b.pop();
      b.push(2.38, -0.40, 0.50);
      box(b, 'hull', hullDark, 0.44, 0.60, 3.00);
      b.pop();

      // ── Armour rib bands ── r+tube=1.45 <= maxY=2.0 ✓
      ribBands(b, 'hull', hullDark, {
        r: 1.35, tube: 0.10, from: -5.00, to: 5.00, count: 14, axis: 'z', tseg: 16,
      });

      // ── Porthole rings ──
      portholeRing(b, 'hull', hull, { r: 1.38, count: 12, size: 0.11, y: 0, seg: 10 });
      portholeRing(b, 'hull', hull, { r: 1.38, count: 12, size: 0.11, y: 0, seg: 10 });

      // Bridge wing extensions
      b.push(-2.00, 1.38, 1.50);
      box(b, 'hull', hull, 1.10, 0.12, 0.80);
      b.pop();
      b.push(2.00, 1.38, 1.50);
      box(b, 'hull', hull, 1.10, 0.12, 0.80);
      b.pop();

      // Engine bells
      b.push(-0.65, 0, 6.40);
      cyl(b, 'hull', hullDark, 0.28, 0.36, 0.55, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(0.65, 0, 6.40);
      cyl(b, 'hull', hullDark, 0.28, 0.36, 0.55, 8, { rx: Math.PI / 2 });
      b.pop();

      // (trusses removed — their outer chords reached x=2.92 > 2.8 limit)

      // Service ladders
      ladder(b, 'hull', trim, {
        x: -1.92, y: -0.55, z: 2.20, h: 1.80, w: 0.32, rungs: 6,
      });
      ladder(b, 'hull', trim, {
        x: 1.92, y: -0.55, z: 2.20, h: 1.80, w: 0.32, rungs: 6,
      });

      // ── LIGHTS ──
      lampString(b, 'lights', WARM_TINT, {
        ax: -2.50, ay: 0.56, az: -4.80, bx: -2.50, by: 0.56, bz: 4.80, count: 9, size: 0.14,
      });
      lampString(b, 'lights', WARM_TINT, {
        ax: 2.50, ay: 0.56, az: -4.80, bx: 2.50, by: 0.56, bz: 4.80, count: 9, size: 0.14,
      });
      windowGrid(b, 'lights', COOL_TINT, {
        rows: 2, cols: 4, rowGap: 0.16, colGap: 0.20,
        w: 0.12, h: 0.09, d: 0.06, x: 0, y: 1.22, z: 1.60, axis: 'x', ry: 0,
      });
      lampString(b, 'lights', CREAM_TINT, {
        ax: -1.30, ay: 0, az: -6.40, bx: 1.30, by: 0, bz: -6.40, count: 4, size: 0.12,
      });
    },
  },

  // ── HEAVY ─────────────────────────────────────────────────────────────────
  // spanX≈7.02 (gun housings ±3.51), spanY≈3.54 (ribs ±1.77), spanZ≈17.00
  // tooStubby: 17.00 >= 2.4*7.02=16.85 ✓   tooTall: 3.54 <= 0.75*7.02=5.27 ✓
  // maxAbs x=3.51, y=1.77, z=8.50   radius≈8.74 in [6.0,9.0]   fb=7.0
  heavy: {
    glowZ: 7.5,
    build(b, st) {
      const { hull, hullDark, trim, accent } = st;

      // ── Hull spine ──
      b.push(0, 0, 0);
      box(b, 'hull', hull, 5.20, 1.80, 14.00);
      b.pop();

      // Bow armour — forward castle
      b.push(0, 0, -7.50);
      box(b, 'hull', hull, 3.80, 1.50, 2.00);
      b.pop();

      // Aft section
      b.push(0, 0, 7.60);
      box(b, 'hull', hullDark, 2.60, 1.10, 2.00);
      b.pop();
      // Forward deck deckhouse
      b.push(0, 0.85, -4.00);
      box(b, 'hull', hull, 3.60, 0.38, 2.50);
      b.pop();

      // ── Citadel command tower — two steps ──
      // step1 top y = 0.90+0.55=1.45
      b.push(0, 1.175, 1.00);
      box(b, 'hull', hull, 1.80, 0.55, 2.00);
      b.pop();
      // step2 top y = 1.45+0.30=1.75 <= 1.77
      b.push(0, 1.60, 1.00);
      box(b, 'hull', hullDark, 1.20, 0.30, 1.40);
      b.pop();
      // Brass trim rail
      b.push(0, 1.755, 1.00);
      box(b, 'hull', trim, 1.28, 0.01, 1.48);
      b.pop();

      // ── Three crimson recognition bands ──
      b.push(0, 0, -5.50);
      torus(b, 'hull', accent, 1.65, 0.12, 18, 8, Math.PI * 2);
      b.pop();
      b.push(0, 0, -2.80);
      torus(b, 'hull', accent, 1.65, 0.12, 18, 8, Math.PI * 2);
      b.pop();
      b.push(0, 0, 0.50);
      torus(b, 'hull', accent, 1.65, 0.12, 18, 8, Math.PI * 2);
      b.pop();

      // ── Twin paired gun batteries ──
      b.push(-3.25, 0.50, -1.50);
      box(b, 'hull', hull, 0.52, 0.45, 1.50);
      b.pop();
      b.push(3.25, 0.50, -1.50);
      box(b, 'hull', hull, 0.52, 0.45, 1.50);
      b.pop();

      // Cannon barrels (×2 per side)
      b.push(-3.18, 0.58, -2.40);
      cyl(b, 'hull', hullDark, 0.10, 0.10, 1.10, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(-3.18, 0.35, -2.40);
      cyl(b, 'hull', hullDark, 0.10, 0.10, 1.10, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(3.18, 0.58, -2.40);
      cyl(b, 'hull', hullDark, 0.10, 0.10, 1.10, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(3.18, 0.35, -2.40);
      cyl(b, 'hull', hullDark, 0.10, 0.10, 1.10, 8, { rx: Math.PI / 2 });
      b.pop();

      // Secondary sponson guns
      b.push(-3.10, -0.35, 2.50);
      box(b, 'hull', hull, 0.48, 0.45, 1.20);
      b.pop();
      b.push(3.10, -0.35, 2.50);
      box(b, 'hull', hull, 0.48, 0.45, 1.20);
      b.pop();

      // Lateral fairings
      b.push(-2.90, 0, -1.50);
      box(b, 'hull', hullDark, 0.52, 0.35, 1.00);
      b.pop();
      b.push(2.90, 0, -1.50);
      box(b, 'hull', hullDark, 0.52, 0.35, 1.00);
      b.pop();

      // ── Armour rib bands ── r+tube=1.77 <= maxY=2.4 ✓
      ribBands(b, 'hull', hullDark, {
        r: 1.65, tube: 0.12, from: -6.50, to: 6.50, count: 16, axis: 'z', tseg: 18,
      });

      // ── Porthole rings ──
      portholeRing(b, 'hull', hull, { r: 1.68, count: 14, size: 0.13, y: 0, seg: 10 });
      portholeRing(b, 'hull', hull, { r: 1.68, count: 14, size: 0.13, y: 0, seg: 10 });

      // Flying bridge wings
      // Flying bridge wings (x=±2.70, w=1.20 → maxX=3.30 < gun battery 3.51)
      b.push(-2.70, 1.72, 1.20);
      box(b, 'hull', hull, 1.20, 0.12, 1.10);
      b.pop();
      b.push(2.70, 1.72, 1.20);
      box(b, 'hull', hull, 1.20, 0.12, 1.10);
      b.pop();

      // Engine cluster
      b.push(-0.85, 0, 8.10);
      cyl(b, 'hull', hullDark, 0.36, 0.46, 0.70, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(0.85, 0, 8.10);
      cyl(b, 'hull', hullDark, 0.36, 0.46, 0.70, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(0, 0, 8.10);
      cyl(b, 'hull', hullDark, 0.36, 0.46, 0.70, 8, { rx: Math.PI / 2 });
      b.pop();

      // Antennae — top y = 1.75+0.01+0.01=1.77 = ribMaxY
      antenna(b, 'hull', hullDark, trim, {
        x: -0.55, y: 1.75, z: 1.00, h: 0.01, r: 0.030, tip: 0.010,
      });
      antenna(b, 'hull', hullDark, trim, {
        x: 0.55, y: 1.75, z: 1.00, h: 0.01, r: 0.030, tip: 0.010,
      });

      // (trusses removed — outer chords reached x=3.79 > 3.6 limit)

      // Service ladders
      ladder(b, 'hull', trim, {
        x: -2.62, y: -0.70, z: 2.60, h: 2.20, w: 0.38, rungs: 7,
      });
      ladder(b, 'hull', trim, {
        x: 2.62, y: -0.70, z: 2.60, h: 2.20, w: 0.38, rungs: 7,
      });
      ladder(b, 'hull', trim, {
        x: -2.80, y: -0.50, z: 0.80, h: 1.50, w: 0.32, rungs: 5,
      });
      ladder(b, 'hull', trim, {
        x: 2.80, y: -0.50, z: 0.80, h: 1.50, w: 0.32, rungs: 5,
      });

      // ── LIGHTS ──
      lampString(b, 'lights', WARM_TINT, {
        ax: -2.50, ay: 0.70, az: -6.00, bx: -2.50, by: 0.70, bz: 6.00, count: 10, size: 0.17,
      });
      lampString(b, 'lights', WARM_TINT, {
        ax: 2.50, ay: 0.70, az: -6.00, bx: 2.50, by: 0.70, bz: 6.00, count: 10, size: 0.17,
      });
      windowGrid(b, 'lights', COOL_TINT, {
        rows: 3, cols: 4, rowGap: 0.18, colGap: 0.22,
        w: 0.14, h: 0.11, d: 0.07, x: 0, y: 1.55, z: 1.70, axis: 'x', ry: 0,
      });
      lampString(b, 'lights', CREAM_TINT, {
        ax: -2.00, ay: 0, az: -8.20, bx: 2.00, by: 0, bz: -8.20, count: 5, size: 0.15,
      });
    },
  },

  // ── FRIGATE ───────────────────────────────────────────────────────────────
  // spanX≈16.60 (gun housings ±8.30), spanY≈8.20 (ribs ±4.10), spanZ≈48.00
  // tooStubby: 48.00 >= 2.4*16.60=39.84 ✓  tooTall: 8.20 <= 0.75*16.60=12.45 ✓
  // maxAbs x=8.30, y=4.10, z=24.00   radius≈24.30 in [21,32]   fb=24.6
  frigate: {
    glowZ: 21.0,
    build(b, st) {
      const { hull, hullDark, trim, accent } = st;

      // ── Hull spine ──
      b.push(0, 0, 0);
      box(b, 'hull', hull, 11.00, 4.00, 34.00);
      b.pop();

      // Bow armour — grand prow
      b.push(0, 0, -20.00);
      box(b, 'hull', hull, 7.00, 3.00, 8.00);
      b.pop();

      // Aft section
      b.push(0, 0, 20.50);
      box(b, 'hull', hullDark, 4.50, 2.00, 7.00);
      b.pop();

      // Forward castle deckhouse
      b.push(0, 2.15, -11.00);
      box(b, 'hull', hull, 8.50, 0.90, 6.00);
      b.pop();

      // ── Multi-tiered citadel ──
      // step1 top y = 2.00+1.30=3.30
      b.push(0, 2.65, 2.50);
      box(b, 'hull', hull, 4.60, 1.30, 5.50);
      b.pop();
      // step2 top y = 3.30+0.75=4.05 <= 4.10
      b.push(0, 3.675, 2.50);
      box(b, 'hull', hullDark, 3.00, 0.75, 3.80);
      b.pop();
      // Brass trim rail
      b.push(0, 4.055, 2.50);
      box(b, 'hull', trim, 3.20, 0.01, 4.00);
      b.pop();

      // ── Four crimson recognition bands — grand authority ──
      b.push(0, 0, -15.00);
      torus(b, 'hull', accent, 3.80, 0.30, 28, 10, Math.PI * 2);
      b.pop();
      b.push(0, 0, -8.00);
      torus(b, 'hull', accent, 3.80, 0.30, 28, 10, Math.PI * 2);
      b.pop();
      b.push(0, 0, -1.00);
      torus(b, 'hull', accent, 3.80, 0.30, 28, 10, Math.PI * 2);
      b.pop();
      b.push(0, 0, 6.00);
      torus(b, 'hull', accent, 3.80, 0.30, 28, 10, Math.PI * 2);
      b.pop();

      // ── Quad gun batteries ──
      b.push(-7.80, 0.80, -4.00);
      box(b, 'hull', hull, 1.00, 0.90, 4.00);
      b.pop();
      b.push(7.80, 0.80, -4.00);
      box(b, 'hull', hull, 1.00, 0.90, 4.00);
      b.pop();
      b.push(-7.80, 0.80, 4.00);
      box(b, 'hull', hull, 1.00, 0.90, 4.00);
      b.pop();
      b.push(7.80, 0.80, 4.00);
      box(b, 'hull', hull, 1.00, 0.90, 4.00);
      b.pop();

      // Massive cannon barrels (×2 per battery)
      b.push(-7.60, 1.10, -8.00);
      cyl(b, 'hull', hullDark, 0.30, 0.30, 3.80, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(-7.60, 0.45, -8.00);
      cyl(b, 'hull', hullDark, 0.30, 0.30, 3.80, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(7.60, 1.10, -8.00);
      cyl(b, 'hull', hullDark, 0.30, 0.30, 3.80, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(7.60, 0.45, -8.00);
      cyl(b, 'hull', hullDark, 0.30, 0.30, 3.80, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(-7.60, 1.10, 8.00);
      cyl(b, 'hull', hullDark, 0.30, 0.30, 3.80, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(-7.60, 0.45, 8.00);
      cyl(b, 'hull', hullDark, 0.30, 0.30, 3.80, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(7.60, 1.10, 8.00);
      cyl(b, 'hull', hullDark, 0.30, 0.30, 3.80, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(7.60, 0.45, 8.00);
      cyl(b, 'hull', hullDark, 0.30, 0.30, 3.80, 8, { rx: Math.PI / 2 });
      b.pop();

      // Lateral gun-deck fairings
      b.push(-6.80, 0, -4.00);
      box(b, 'hull', hullDark, 1.00, 0.65, 2.80);
      b.pop();
      b.push(6.80, 0, -4.00);
      box(b, 'hull', hullDark, 1.00, 0.65, 2.80);
      b.pop();
      b.push(-6.80, 0, 4.00);
      box(b, 'hull', hullDark, 1.00, 0.65, 2.80);
      b.pop();
      b.push(6.80, 0, 4.00);
      box(b, 'hull', hullDark, 1.00, 0.65, 2.80);
      b.pop();

      // ── Grand casemate rib bands ── r+tube=4.10 <= maxY=6.0 ✓
      ribBands(b, 'hull', hullDark, {
        r: 3.80, tube: 0.30, from: -16.00, to: 16.00, count: 20, axis: 'z', tseg: 24,
      });

      // ── Porthole rings ──
      portholeRing(b, 'hull', hull, { r: 3.85, count: 16, size: 0.28, y: 0, seg: 12 });
      portholeRing(b, 'hull', hull, { r: 3.85, count: 16, size: 0.28, y: 0, seg: 12 });
      portholeRing(b, 'hull', hull, { r: 3.85, count: 16, size: 0.28, y: 0, seg: 12 });
      portholeRing(b, 'hull', hull, { r: 3.85, count: 16, size: 0.28, y: 0, seg: 12 });

      // Grand flying bridge (x=±7.50, w=1.60 → maxX=8.30 ≤ 9.0)
      b.push(-7.50, 4.00, 4.00);
      box(b, 'hull', hull, 1.60, 0.14, 3.50);
      b.pop();
      b.push(7.50, 4.00, 4.00);
      box(b, 'hull', hull, 1.60, 0.14, 3.50);
      b.pop();

      // Antennae forest — top y = 4.05+0.02+0.02=4.09 <= 4.10
      antenna(b, 'hull', hullDark, trim, {
        x: -1.50, y: 4.05, z: 2.50, h: 0.02, r: 0.120, tip: 0.020,
      });
      antenna(b, 'hull', hullDark, trim, {
        x: 1.50, y: 4.05, z: 2.50, h: 0.02, r: 0.120, tip: 0.020,
      });
      antenna(b, 'hull', hullDark, trim, {
        x: 0, y: 4.05, z: 4.00, h: 0.01, r: 0.110, tip: 0.015,
      });

      // Engine cluster
      b.push(-2.20, 0, 23.00);
      cyl(b, 'hull', hullDark, 1.10, 1.40, 1.80, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(2.20, 0, 23.00);
      cyl(b, 'hull', hullDark, 1.10, 1.40, 1.80, 8, { rx: Math.PI / 2 });
      b.pop();
      b.push(0, 0, 23.00);
      cyl(b, 'hull', hullDark, 1.10, 1.40, 1.80, 8, { rx: Math.PI / 2 });
      b.pop();

      // Stern bulkhead
      b.push(0, 0, 23.50);
      box(b, 'hull', hull, 6.00, 3.00, 0.70);
      b.pop();

      // Grand truss framework
      truss(b, 'hull', trim, {
        ax: -7.00, ay: -1.80, az: -6.00, bx: -7.00, by: -1.80, bz: 6.00,
        thickness: 0.40, bays: 6, spread: 1.20,
      });
      truss(b, 'hull', trim, {
        ax: 7.00, ay: -1.80, az: -6.00, bx: 7.00, by: -1.80, bz: 6.00,
        thickness: 0.40, bays: 6, spread: 1.20,
      });

      // Grand service ladders
      ladder(b, 'hull', trim, {
        x: -5.50, y: -1.50, z: 7.00, h: 4.50, w: 0.70, rungs: 12,
      });
      ladder(b, 'hull', trim, {
        x: 5.50, y: -1.50, z: 7.00, h: 4.50, w: 0.70, rungs: 12,
      });
      ladder(b, 'hull', trim, {
        x: -8.20, y: -0.90, z: 3.00, h: 3.20, w: 0.60, rungs: 9,
      });
      ladder(b, 'hull', trim, {
        x: 8.20, y: -0.90, z: 3.00, h: 3.20, w: 0.60, rungs: 9,
      });

      // ── LIGHTS ──
      // Grand running lights
      // Running lights along spine flanks (x=±5.20 keeps all lamps within
      // 1 cell of spine edge at x=5.50 — avoids orphan at z between batteries)
      lampString(b, 'lights', WARM_TINT, {
        ax: -5.20, ay: 1.80, az: -17.00, bx: -5.20, by: 1.80, bz: 17.00, count: 14, size: 0.32,
      });
      lampString(b, 'lights', WARM_TINT, {
        ax: 5.20, ay: 1.80, az: -17.00, bx: 5.20, by: 1.80, bz: 17.00, count: 14, size: 0.32,
      });
      // Additional spine-adjacent lamps (lower flank)
      // Lower lamps — stay within z=±5 so truss cross posts (z=±6±0.2) keep all within 1 cell
      lampString(b, 'lights', WARM_TINT, {
        ax: -5.20, ay: -1.80, az: -5.00, bx: -5.20, by: -1.80, bz: 5.00, count: 10, size: 0.28,
      });
      lampString(b, 'lights', WARM_TINT, {
        ax: 5.20, ay: -1.80, az: -5.00, bx: 5.20, by: -1.80, bz: 5.00, count: 10, size: 0.28,
      });
      // Grand bridge windows
      windowGrid(b, 'lights', COOL_TINT, {
        rows: 3, cols: 5, rowGap: 0.35, colGap: 0.42,
        w: 0.25, h: 0.18, d: 0.12, x: 0, y: 3.60, z: 5.30, axis: 'x', ry: 0,
      });
      // Recognition lamps at prow
      // Prow recognition beacons — vertical at bow flanks near hull corners at x=±3.40, z=-24
      lampString(b, 'lights', CREAM_TINT, {
        ax: -3.40, ay: -1.20, az: -24.00, bx: -3.40, by: 1.20, bz: -24.00, count: 3, size: 0.30,
      });
      lampString(b, 'lights', CREAM_TINT, {
        ax: 3.40, ay: -1.20, az: -24.00, bx: 3.40, by: 1.20, bz: -24.00, count: 3, size: 0.30,
      });
    },
  },
};
