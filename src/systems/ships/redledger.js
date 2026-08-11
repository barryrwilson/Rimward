/**
 * Red Ledger - captured and rebuilt hardware. Every ship wears somebody else's
 * plating on one side. The Bookkeeper's fleet is a rolling ransom note: forward
 * grappling claw booms for seizure, a ram spike for intimidation, tally stripes
 * counting prizes, asymmetric scarred pods where trophy plates were welded over
 * battle damage. Dark iron hulls blackened by soot and dried blood, tarnished
 * copper trim from seized refineries, amber utility lights scavenged from dead
 * crews. The asymmetry is not elegant - it is the character of repeated field
 * repair, of plates taken from captured ships and bolted on wherever they fit.
 * Reference art: docs/FactionExamples/04-red-ledger-ship.png.
 *
 * ROUND-2 RESHAPE: slab-sided hull (wide flat boxes, NOT cylinders) so that
 * spanX >> spanY and spanZ >= 2.4 * spanX. The cylindrical panelSkin is kept
 * at a very small radius that fits entirely inside the main-hull slab, purely
 * to supply vertex density along the spine. All claw/ram/trophy positions are
 * authored as literals so the pirate-bake gets identical geometry.
 *
 * Seed base: 7812 for all rng() and panelSkin seed arguments.
 */

import {
  rng, weather, box, cone, ribBands,
  windowGrid, panelSkin, railing, lampString, hemi,
} from '../station-detail.js';

export const redledgerShip = {

  // ─────────────────────────────────────────────────────────────────────────
  // LIGHT  max abs 1.3 / 0.9 / 3.4   r=[2.2,3.5]   hull=[3k,12k]
  // ─────────────────────────────────────────────────────────────────────────
  light: {
    glowZ: 3.0,
    build(b, st) {
      const r = rng(7812);
      const hullHex  = weather(st.hull,     r() * 4 | 0);
      const darkHex  = weather(st.hullDark, r() * 4 | 0);
      const trimHex  = weather(st.trim,     r() * 4 | 0);
      const accentHex = weather(st.accent,  r() * 4 | 0);

      // ── Main slab spine: long, flat, low ──────────────────────
      // x:±0.90  y:±0.22  z:-3.2..2.0
      box(b, 'hull', hullHex, 1.8, 0.44, 5.2, { x: 0, y: 0, z: -0.6 });

      // Dorsal crown (narrower, sits on top of spine)
      // y:0.21..0.59
      box(b, 'hull', hullHex, 1.3, 0.38, 4.6, { x: 0, y: 0.40, z: -0.4 });

      // Ventral keel
      // y:-0.41..-0.21
      box(b, 'hull', darkHex, 1.4, 0.20, 4.6, { x: 0, y: -0.31, z: -0.4 });

      // Aft engine block  – sternZ driven here and by ribBands below
      box(b, 'hull', darkHex, 1.2, 0.55, 1.0, { x: 0, y: 0, z: 2.3 });

      // Fine keel-spine panel detail (small-r cylinder for vertex density,
      // stays entirely within the slab hull above).
      panelSkin(b, 'hull', [hullHex, darkHex, trimHex], {
        r: 0.40, from: -2.8, to: 2.0,
        rows: 8, cols: 10, seed: 7812, axis: 'z',
        t: 0.16, inset: 0.20, jitter: 0.12,
      });

      // ── Forward grappling booms ────────────────────────────────
      // x:±0.955 after arms; claw base extends to ±1.09
      box(b, 'hull', hullHex, 0.55, 0.24, 1.4, { x: -0.68, y: 0.20, z: -2.5 });
      box(b, 'hull', hullHex, 0.55, 0.24, 1.4, { x:  0.68, y: 0.20, z: -2.5 });
      cone(b, 'hull', trimHex, 0.14, 0.36, 6, { x: -0.95, y: 0.22, z: -3.0, rx:  0.32 });
      cone(b, 'hull', trimHex, 0.14, 0.36, 6, { x:  0.95, y: 0.22, z: -3.0, rx: -0.32 });
      // Ram spike – rx:-PI/2 → apex in -Z direction
      // apex at z = -3.05 - 0.25 = -3.30  (max|z|=3.30 ≤ 3.4)
      cone(b, 'hull', accentHex, 0.18, 0.50, 8, { x: 0, y: -0.04, z: -3.05, rx: -Math.PI / 2 });

      // ── Tally stripes – port side only (literal coords) ────────
      box(b, 'hull', accentHex, 0.06, 0.42, 0.05, { x: -0.92, y: 0.35, z: -1.6 });
      box(b, 'hull', accentHex, 0.06, 0.38, 0.05, { x: -0.93, y: 0.30, z: -0.9 });

      // ── Asymmetric trophy pod – port, literal position ─────────
      // x:-1.18..-0.66  max|x|=1.18 ≤ 1.3
      box(b, 'hull', trimHex, 0.52, 0.36, 0.90, { x: -0.92, y: -0.22, z: -1.2, ry: 0.08 });

      // ── Dorsal sensor fin ──────────────────────────────────────
      // y: 0.59..0.89  max|y|=0.89 ≤ 0.9
      box(b, 'hull', hullHex, 0.08, 0.30, 0.08, { x: -0.10, y: 0.74, z: -0.4 });

      // ── Aft rib vents (small radius – stays within y budget) ───
      // max|y|=0.57; sternZ ≈ 2.77 but aft block top = 2.80 governs
      ribBands(b, 'hull', darkHex, {
        r: 0.50, tube: 0.07, from: 1.9, to: 2.7, count: 3, axis: 'z',
      });

      // ── Lights ────────────────────────────────────────────────
      lampString(b, 'lights', 0xfff2d8, {
        ax: -0.25, ay: 0.22, az: -3.1, bx: 0.25, by: 0.22, bz: -3.1,
        count: 2, size: 0.12,
      });
      lampString(b, 'lights', 0xffe8c8, {
        ax: -0.92, ay: 0.40, az: -1.6, bx: -0.92, by: 0.40, bz: 0.5,
        count: 3, size: 0.10,
      });
      lampString(b, 'lights', 0xffffff, {
        ax: -0.55, ay: 0.14, az: 2.7, bx: 0.55, by: 0.14, bz: 2.7,
        count: 3, size: 0.09,
      });
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CUTTER  max abs 1.8 / 1.2 / 5.0   r=[3.0,5.0]   hull=[4k,16k]
  // ─────────────────────────────────────────────────────────────────────────
  cutter: {
    glowZ: 5.2,
    build(b, st) {
      const r = rng(7812);
      const hullHex  = weather(st.hull,     r() * 4 | 0);
      const darkHex  = weather(st.hullDark, r() * 4 | 0);
      const trimHex  = weather(st.trim,     r() * 4 | 0);
      const accentHex = weather(st.accent,  r() * 4 | 0);

      // Main slab spine  x:±1.40  z:-4.5..3.1
      box(b, 'hull', hullHex, 2.8, 0.62, 7.4, { x: 0, y: 0, z: -0.8 });

      // Dorsal crown  y:0.31..0.93
      box(b, 'hull', hullHex, 2.2, 0.62, 6.6, { x: 0, y: 0.62, z: -0.6 });

      // Keel  y:-0.59..-0.31
      box(b, 'hull', darkHex, 2.4, 0.28, 6.8, { x: 0, y: -0.45, z: -0.7 });

      // Aft engine block
      box(b, 'hull', hullHex, 2.0, 0.88, 1.2, { x: 0, y: 0, z: 4.1 });

      // Panel skin (vertex density along keel)
      panelSkin(b, 'hull', [hullHex, darkHex, trimHex], {
        r: 0.55, from: -4.2, to: 4.0,
        rows: 10, cols: 12, seed: 7812, axis: 'z',
        t: 0.16, inset: 0.18, jitter: 0.10,
      });

      // Forward grappling booms  arm outer edge x:±1.525
      box(b, 'hull', hullHex, 0.85, 0.32, 1.6, { x: -1.10, y: 0.26, z: -3.7 });
      box(b, 'hull', hullHex, 0.85, 0.32, 1.6, { x:  1.10, y: 0.26, z: -3.7 });
      // Claw base radius 0.20 → max|x|=1.725 ≤ 1.8
      cone(b, 'hull', trimHex, 0.20, 0.55, 6, { x: -1.525, y: 0.30, z: -4.3, rx:  0.28 });
      cone(b, 'hull', trimHex, 0.20, 0.55, 6, { x:  1.525, y: 0.30, z: -4.3, rx: -0.28 });
      // Ram  apex at z=-4.62-0.34=-4.96  (y=0 avoids radius inflation)
      cone(b, 'hull', accentHex, 0.24, 0.68, 8, { x: 0, y: 0, z: -4.62, rx: -Math.PI / 2 });

      // Tally stripes – port
      box(b, 'hull', accentHex, 0.08, 0.72, 0.06, { x: -1.45, y: 0.52, z: -2.8 });
      box(b, 'hull', accentHex, 0.08, 0.60, 0.06, { x: -1.46, y: 0.44, z: -1.8 });

      // Trophy pod – port literal  x:-1.773..-1.073  max|x|=1.773 ≤ 1.8
      box(b, 'hull', trimHex, 0.72, 0.52, 1.3, { x: -1.34, y: -0.40, z: -1.8, ry: 0.10 });

      // Sensor mast  y:0.93..1.15 ≤ 1.2
      box(b, 'hull', hullHex, 0.14, 0.22, 0.14, { x: -0.80, y: 1.04, z: 0.5 });

      // Exhaust ports
      windowGrid(b, 'hull', accentHex, {
        rows: 2, cols: 4, rowGap: 0.24, colGap: 0.26,
        w: 0.20, h: 0.18, d: 0.08, x: 0, y: 0, z: 4.7, axis: 'z',
      });

      // Aft ribs  sternZ ≈ 4.89  max|y|=0.89
      ribBands(b, 'hull', darkHex, {
        r: 0.80, tube: 0.09, from: 4.0, to: 4.8, count: 4, axis: 'z',
      });

      // Lights
      lampString(b, 'lights', 0xfff2d8, {
        ax: -0.60, ay: 0.50, az: -4.2, bx: 0.60, by: 0.50, bz: -4.2,
        count: 2, size: 0.20,
      });
      lampString(b, 'lights', 0xffe8c8, {
        ax: -1.45, ay: 0.58, az: -2.8, bx: -1.45, by: 0.58, bz: 0.5,
        count: 4, size: 0.16,
      });
      lampString(b, 'lights', 0xffffff, {
        ax: -0.90, ay: 0, az: 4.8, bx: 0.90, by: 0, bz: 4.8,
        count: 4, size: 0.14,
      });
      lampString(b, 'lights', 0xfff8e8, {
        ax: 0, ay: 0.88, az: 4.7, bx: 0, by: 0.88, bz: 4.7,
        count: 1, size: 0.20,
      });
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACE  max abs 2.2 / 1.3 / 5.8   r=[4.4,5.8]   hull=[4k,16k]
  // ─────────────────────────────────────────────────────────────────────────
  ace: {
    glowZ: 5.6,
    build(b, st) {
      const r = rng(7812);
      const hullHex  = weather(st.hull,     r() * 4 | 0);
      const darkHex  = weather(st.hullDark, r() * 4 | 0);
      const trimHex  = weather(st.trim,     r() * 4 | 0);
      const accentHex = weather(st.accent,  r() * 4 | 0);

      // Main slab spine  x:±1.50  z:-5.4..3.4
      box(b, 'hull', hullHex, 3.0, 0.80, 8.8, { x: 0, y: 0, z: -1.0 });

      // Dorsal crown  y:0.40..1.14
      box(b, 'hull', hullHex, 2.2, 0.74, 7.8, { x: 0, y: 0.77, z: -0.8 });

      // Keel  y:-0.72..-0.40
      box(b, 'hull', darkHex, 2.4, 0.32, 8.2, { x: 0, y: -0.56, z: -0.9 });

      // Aft engine block
      box(b, 'hull', hullHex, 2.2, 0.96, 1.4, { x: 0, y: 0, z: 4.0 });

      // Panel skin
      panelSkin(b, 'hull', [hullHex, darkHex, trimHex], {
        r: 0.62, from: -4.8, to: 4.2,
        rows: 10, cols: 12, seed: 7812, axis: 'z',
        t: 0.16, inset: 0.16, jitter: 0.10,
      });

      // Grappling booms – aggressive rake  arm outer x:±1.755
      box(b, 'hull', hullHex, 0.95, 0.38, 1.8, { x: -1.28, y: 0.28, z: -4.4 });
      box(b, 'hull', hullHex, 0.95, 0.38, 1.8, { x:  1.28, y: 0.28, z: -4.4 });
      // Claw base r=0.22 → max|x|≈1.975 ≤ 2.2
      cone(b, 'hull', trimHex, 0.22, 0.60, 6, { x: -1.755, y: 0.32, z: -5.0, rx:  0.30 });
      cone(b, 'hull', trimHex, 0.22, 0.60, 6, { x:  1.755, y: 0.32, z: -5.0, rx: -0.30 });
      // Sharpened ram  apex at z=-5.40-0.37=-5.77  (y=0, max|z|=5.77 ≤ 5.8)
      cone(b, 'hull', accentHex, 0.28, 0.74, 8, { x: 0, y: 0, z: -5.40, rx: -Math.PI / 2 });

      // Tally marks – port
      box(b, 'hull', accentHex, 0.10, 0.82, 0.08, { x: -1.50, y: 0.58, z: -2.4 });
      box(b, 'hull', accentHex, 0.10, 0.70, 0.08, { x: -1.52, y: 0.50, z: -1.4 });

      // Scavenged trophy plate – port literal  x:-2.147..-1.273  max|x|=2.147 ≤ 2.2
      box(b, 'hull', trimHex, 0.88, 0.62, 1.5, { x: -1.62, y: -0.46, z: -2.0, ry: 0.12 });

      // Sensor mast  y:1.14..1.28 ≤ 1.3
      box(b, 'hull', hullHex, 0.14, 0.14, 0.14, { x: -0.80, y: 1.21, z: 0.5 });

      // Cockpit blister (starboard, adds character)
      // hemi top at y=1.07+0.14=1.21 ≤ 1.3
      hemi(b, 'hull', trimHex, 0.14, 8, 6, { x: 0.60, y: 1.07, z: 0.8, ry: 0.18 });

      // Thruster pod – port literal
      box(b, 'hull', darkHex, 0.60, 0.40, 0.80, { x: -1.60, y: -0.52, z: 3.0, ry: -0.15 });

      // Exhaust ports
      windowGrid(b, 'hull', accentHex, {
        rows: 2, cols: 4, rowGap: 0.28, colGap: 0.30,
        w: 0.22, h: 0.20, d: 0.08, x: 0, y: 0, z: 5.2, axis: 'z',
      });

      // Aft ribs  sternZ ≈ 5.30  max|y|=1.00
      ribBands(b, 'hull', darkHex, {
        r: 0.90, tube: 0.10, from: 3.8, to: 5.2, count: 5, axis: 'z',
      });

      // Lights
      lampString(b, 'lights', 0xfff2d8, {
        ax: -0.60, ay: 0.42, az: -5.0, bx: 0.60, by: 0.42, bz: -5.0,
        count: 2, size: 0.18,
      });
      lampString(b, 'lights', 0xffe8c8, {
        ax: -1.50, ay: 0.64, az: -2.4, bx: -1.50, by: 0.64, bz: 0.9,
        count: 3, size: 0.15,
      });
      lampString(b, 'lights', 0xffffff, {
        ax: -1.0, ay: 0.30, az: 5.1, bx: 1.0, by: 0.30, bz: 5.1,
        count: 4, size: 0.12,
      });
      lampString(b, 'lights', 0xfff8e8, {
        ax: 0, ay: 0.90, az: 5.0, bx: 0, by: 0.90, bz: 5.0,
        count: 1, size: 0.22,
      });
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FREIGHTER  max abs 2.8 / 2.0 / 7.4   r=[4.4,7.2]   hull=[6k,24k]
  // ─────────────────────────────────────────────────────────────────────────
  freighter: {
    glowZ: 7.0,
    build(b, st) {
      const r = rng(7812);
      const hullHex  = weather(st.hull,     r() * 4 | 0);
      const darkHex  = weather(st.hullDark, r() * 4 | 0);
      const trimHex  = weather(st.trim,     r() * 4 | 0);
      const accentHex = weather(st.accent,  r() * 4 | 0);

      // Main armored spine  x:±1.90  z:-6.1..4.1
      box(b, 'hull', hullHex, 3.8, 0.96, 10.2, { x: 0, y: 0, z: -1.0 });

      // Dorsal crown  y:0.48..1.54
      box(b, 'hull', hullHex, 3.0, 1.06, 9.4, { x: 0, y: 1.01, z: -0.8 });

      // Keel  y:-0.96..-0.48
      box(b, 'hull', darkHex, 3.2, 0.48, 9.6, { x: 0, y: -0.72, z: -0.9 });

      // Aft cargo structure
      box(b, 'hull', hullHex, 3.0, 1.54, 1.8, { x: 0, y: 0.30, z: 5.0 });

      // Panel skin
      panelSkin(b, 'hull', [hullHex, darkHex, trimHex], {
        r: 0.80, from: -5.6, to: 5.4,
        rows: 12, cols: 16, seed: 7812, axis: 'z',
        t: 0.18, inset: 0.16, jitter: 0.10,
      });

      // Grappling booms  arm outer x:±2.50
      box(b, 'hull', hullHex, 1.4, 0.50, 2.8, { x: -1.80, y: 0.38, z: -5.2 });
      box(b, 'hull', hullHex, 1.4, 0.50, 2.8, { x:  1.80, y: 0.38, z: -5.2 });
      // Claw base r=0.22 → max|x|≈2.72 ≤ 2.8
      cone(b, 'hull', trimHex, 0.22, 0.60, 8, { x: -2.50, y: 0.44, z: -6.4, rx:  0.25 });
      cone(b, 'hull', trimHex, 0.22, 0.60, 8, { x:  2.50, y: 0.44, z: -6.4, rx: -0.25 });
      // Ram  apex at z=-6.84-0.35=-7.19  (y=0, r=7.19 ≤ 7.2)
      cone(b, 'hull', accentHex, 0.36, 0.70, 8, { x: 0, y: 0, z: -6.84, rx: -Math.PI / 2 });

      // Tally stripes – port
      box(b, 'hull', accentHex, 0.10, 1.10, 0.08, { x: -1.94, y: 0.80, z: -4.0 });
      box(b, 'hull', accentHex, 0.10, 0.96, 0.08, { x: -1.95, y: 0.72, z: -2.8 });
      box(b, 'hull', accentHex, 0.10, 0.82, 0.08, { x: -1.94, y: 0.64, z: -1.6 });

      // Trophy plate 1 – port literal  x to -2.743 (center -2.28)  max|x|=2.743 ≤ 2.8
      box(b, 'hull', trimHex, 0.80, 0.72, 1.6, { x: -2.28, y: -0.50, z: -3.5, ry:  0.08 });
      box(b, 'hull', darkHex, 0.70, 0.60, 1.4, { x: -2.35, y: -0.45, z: -1.5, ry: -0.06 });

      // Sensor mast  y:1.54..1.94 ≤ 2.0
      box(b, 'hull', hullHex, 0.18, 0.40, 0.18, { x: -1.60, y: 1.74, z: 1.0 });

      // Exhaust grid
      windowGrid(b, 'hull', accentHex, {
        rows: 2, cols: 5, rowGap: 0.30, colGap: 0.32,
        w: 0.26, h: 0.22, d: 0.10, x: 0, y: 0.30, z: 5.9, axis: 'z',
      });

      // Asymmetric cargo pod – port literal
      box(b, 'hull', darkHex, 0.60, 0.54, 1.4, { x: -2.10, y: -0.72, z: 2.8, ry: -0.08 });

      // Aft ribs  sternZ ≈ 6.74  max|y|=1.44
      ribBands(b, 'hull', darkHex, {
        r: 1.30, tube: 0.14, from: 4.8, to: 6.6, count: 7, axis: 'z',
      });

      // Lights
      lampString(b, 'lights', 0xfff2d8, {
        ax: -0.80, ay: 0.60, az: -6.1, bx: 0.80, by: 0.60, bz: -6.1,
        count: 3, size: 0.26,
      });
      lampString(b, 'lights', 0xffe8c8, {
        ax: -1.94, ay: 0.86, az: -4.0, bx: -1.94, by: 0.86, bz: 0.8,
        count: 5, size: 0.22,
      });
      lampString(b, 'lights', 0xffffff, {
        ax: -1.40, ay: 0, az: 6.6, bx: 1.40, by: 0, bz: 6.6,
        count: 5, size: 0.20,
      });
      lampString(b, 'lights', 0xfff8e8, {
        ax: -0.60, ay: 1.44, az: 6.5, bx: 0.60, by: 1.44, bz: 6.5,
        count: 2, size: 0.26,
      });
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HEAVY  max abs 3.6 / 2.4 / 8.8   r=[6.0,9.0]   hull=[7k,28k]
  // ─────────────────────────────────────────────────────────────────────────
  heavy: {
    glowZ: 8.8,
    build(b, st) {
      const r = rng(7812);
      const hullHex  = weather(st.hull,     r() * 4 | 0);
      const darkHex  = weather(st.hullDark, r() * 4 | 0);
      const trimHex  = weather(st.trim,     r() * 4 | 0);
      const accentHex = weather(st.accent,  r() * 4 | 0);

      // Main armored spine  x:±2.80  z:-8.3..4.7
      box(b, 'hull', hullHex, 5.6, 1.18, 13.0, { x: 0, y: 0, z: -1.8 });

      // Dorsal crown  y:0.59..1.85
      box(b, 'hull', hullHex, 4.2, 1.26, 11.8, { x: 0, y: 1.22, z: -1.5 });

      // Keel  y:-1.17..-0.59
      box(b, 'hull', darkHex, 4.8, 0.58, 12.0, { x: 0, y: -0.88, z: -1.6 });

      // Aft engine structure
      box(b, 'hull', hullHex, 4.4, 2.0, 2.4, { x: 0, y: 0.30, z: 5.7 });

      // Panel skin
      panelSkin(b, 'hull', [hullHex, darkHex, trimHex], {
        r: 0.98, from: -7.8, to: 6.8,
        rows: 14, cols: 18, seed: 7812, axis: 'z',
        t: 0.20, inset: 0.16, jitter: 0.10,
      });

      // Heavy grappling arms  arm outer x:±3.025
      box(b, 'hull', hullHex, 1.7, 0.64, 3.4, { x: -2.175, y: 0.46, z: -6.5 });
      box(b, 'hull', hullHex, 1.7, 0.64, 3.4, { x:  2.175, y: 0.46, z: -6.5 });
      // Claw base r=0.30 → max|x|≈3.325 ≤ 3.6
      cone(b, 'hull', trimHex, 0.30, 0.80, 8, { x: -3.025, y: 0.52, z: -7.8, rx:  0.25 });
      cone(b, 'hull', trimHex, 0.30, 0.80, 8, { x:  3.025, y: 0.52, z: -7.8, rx: -0.25 });
      // Ram  apex at z=-8.11-0.64=-8.75  (y=0, max|z|=8.75 ≤ 8.8)
      cone(b, 'hull', accentHex, 0.50, 1.28, 10, { x: 0, y: 0, z: -8.11, rx: -Math.PI / 2 });

      // Heavy tally stripes – port
      box(b, 'hull', accentHex, 0.14, 1.62, 0.10, { x: -2.83, y: 1.12, z: -5.8 });
      box(b, 'hull', accentHex, 0.14, 1.44, 0.10, { x: -2.84, y: 1.00, z: -4.2 });
      box(b, 'hull', accentHex, 0.14, 1.26, 0.10, { x: -2.83, y: 0.88, z: -2.6 });
      box(b, 'hull', accentHex, 0.14, 1.08, 0.10, { x: -2.84, y: 0.76, z: -1.0 });

      // Trophy plates – port literal  x to -3.50  max|x|=3.50 ≤ 3.6
      box(b, 'hull', trimHex, 1.20, 1.10, 2.0, { x: -2.90, y: -0.60, z: -5.5, ry:  0.08 });
      box(b, 'hull', darkHex, 1.00, 0.90, 1.8, { x: -2.85, y: -0.50, z: -3.5, ry: -0.06 });

      // Command tower  y:1.85..2.33 ≤ 2.4
      box(b, 'hull', hullHex, 1.60, 0.48, 1.4, { x: 1.40, y: 2.09, z: 2.0, ry: 0.12 });

      // Sensor mast  y:1.85..2.35 ≤ 2.4
      box(b, 'hull', hullHex, 0.22, 0.50, 0.22, { x: -2.20, y: 2.10, z: 1.5 });

      // Exhaust grid
      windowGrid(b, 'hull', accentHex, {
        rows: 3, cols: 5, rowGap: 0.36, colGap: 0.38,
        w: 0.30, h: 0.26, d: 0.10, x: 0, y: 0.30, z: 6.9, axis: 'z',
      });

      // Cargo pods
      box(b, 'hull', darkHex, 0.90, 0.76, 2.2, { x: -2.80, y: -1.00, z: 3.2, ry: -0.08 });
      box(b, 'hull', trimHex, 0.70, 0.60, 1.8, { x:  2.60, y: -0.82, z: 4.0, ry:  0.06 });

      // Aft ribs  sternZ ≈ 8.18  max|y|=1.98
      ribBands(b, 'hull', darkHex, {
        r: 1.80, tube: 0.18, from: 5.4, to: 8.0, count: 9, axis: 'z',
      });

      // Lights
      lampString(b, 'lights', 0xfff2d8, {
        ax: -1.2, ay: 0.80, az: -7.6, bx: 1.2, by: 0.80, bz: -7.6,
        count: 4, size: 0.32,
      });
      lampString(b, 'lights', 0xffe8c8, {
        ax: -2.83, ay: 1.18, az: -5.8, bx: -2.83, by: 1.18, bz: 1.4,
        count: 6, size: 0.28,
      });
      lampString(b, 'lights', 0xffffff, {
        ax: -2.0, ay: 0, az: 8.0, bx: 2.0, by: 0, bz: 8.0,
        count: 7, size: 0.24,
      });
      lampString(b, 'lights', 0xfff8e8, {
        ax: -0.8, ay: 1.8, az: 7.8, bx: 0.8, by: 1.8, bz: 7.8,
        count: 2, size: 0.30,
      });
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FRIGATE  max abs 9.0 / 6.0 / 26.0   r=[21.0,32.0]   hull=[15k,60k]
  // Worked example from plan: x≈±6.8, spanY≈9, z≈-25..+23
  // ─────────────────────────────────────────────────────────────────────────
  frigate: {
    glowZ: 23.0,
    build(b, st) {
      const r = rng(7812);
      const hullHex  = weather(st.hull,     r() * 4 | 0);
      const darkHex  = weather(st.hullDark, r() * 4 | 0);
      const trimHex  = weather(st.trim,     r() * 4 | 0);
      const accentHex = weather(st.accent,  r() * 4 | 0);

      // Dreadnought spine  x:±6.0  z:-23.0..17.0
      box(b, 'hull', hullHex, 12.0, 3.6, 40.0, { x: 0, y: 0, z: -3.0 });

      // Dorsal crown  y:1.8..5.0
      box(b, 'hull', hullHex, 9.0, 3.2, 36.0, { x: 0, y: 3.4, z: -2.5 });

      // Keel  y:-3.8..-1.8
      box(b, 'hull', darkHex, 9.6, 2.0, 36.0, { x: 0, y: -2.8, z: -2.5 });

      // Cathedral aft structure  z:10..24
      box(b, 'hull', hullHex, 11.0, 5.0, 14.0, { x: 0, y: 0.50, z: 17.0 });

      // Command citadel  y:3.0..6.0  max|y|=6.0
      box(b, 'hull', hullHex, 5.0, 3.0, 5.0, { x: 3.5, y: 4.5, z: 9.0, ry: 0.10 });

      // Fine spine panel skin for vertex density
      panelSkin(b, 'hull', [hullHex, darkHex, trimHex], {
        r: 2.50, from: -20.0, to: 19.0,
        rows: 20, cols: 28, seed: 7812, axis: 'z',
        t: 0.28, inset: 0.18, jitter: 0.12,
      });

      // Massive grappling booms  arm outer x:±7.0  z:-22.0..-10.0
      box(b, 'hull', hullHex, 4.0, 1.8, 12.0, { x: -5.0, y: 1.2, z: -16.0 });
      box(b, 'hull', hullHex, 4.0, 1.8, 12.0, { x:  5.0, y: 1.2, z: -16.0 });
      // Claw base r=1.40 → max|x|≈8.40 ≤ 9.0
      cone(b, 'hull', trimHex, 1.40, 4.0, 10, { x: -7.0, y: 1.5, z: -20.0, rx:  0.20 });
      cone(b, 'hull', trimHex, 1.40, 4.0, 10, { x:  7.0, y: 1.5, z: -20.0, rx: -0.20 });
      // Enormous ram  apex at z=-23.0-3.0=-26.0  r=26.0 ≤ 32
      cone(b, 'hull', accentHex, 2.2, 6.0, 12, { x: 0, y: -0.10, z: -23.0, rx: -Math.PI / 2 });

      // Prize tally – port side only (literal). Center_y + H/2 ≤ 6.0 everywhere.
      box(b, 'hull', accentHex, 0.28, 4.6, 0.18, { x: -6.02, y: 3.50, z: -14.0 });
      box(b, 'hull', accentHex, 0.28, 4.0, 0.18, { x: -6.03, y: 3.20, z:  -9.0 });
      box(b, 'hull', accentHex, 0.28, 3.4, 0.18, { x: -6.02, y: 2.90, z:  -4.0 });
      box(b, 'hull', accentHex, 0.28, 2.8, 0.18, { x: -6.03, y: 2.50, z:   1.0 });
      box(b, 'hull', accentHex, 0.28, 2.2, 0.18, { x: -6.02, y: 2.20, z:   6.0 });

      // Trophy armor plates – port literal.
      // rotated x_extent=(W/2)*cos(ry)+(D/2)*sin(ry); all ≤ 9.0
      box(b, 'hull', trimHex, 4.0, 4.0, 6.0, { x: -6.60, y: -1.5, z: -14.0, ry:  0.06 });
      box(b, 'hull', darkHex, 3.4, 3.2, 5.0, { x: -6.80, y: -1.2, z:  -8.0, ry: -0.04 });
      box(b, 'hull', trimHex, 3.0, 2.6, 4.4, { x: -7.20, y: -1.0, z:  -2.0, ry:  0.05 });

      // Sensor spires  max|y|=5.95 ≤ 6.0
      box(b, 'hull', hullHex, 0.80, 0.95, 0.80, { x: -7.0, y: 5.475, z:  4.0 });
      box(b, 'hull', hullHex, 0.70, 0.90, 0.70, { x:  8.5, y: 5.05,  z:  6.0 });
      box(b, 'hull', hullHex, 0.60, 0.80, 0.60, { x: -3.2, y: 5.10,  z:  8.0 });

      // Cargo bays  x to ±9.0
      box(b, 'hull', darkHex, 4.0, 3.0, 7.0, { x: -7.0, y: -2.0, z: 15.0 });
      box(b, 'hull', trimHex, 3.6, 2.6, 6.0, { x:  6.90, y: -1.8, z: 16.0 });

      // Exhaust cathedral
      windowGrid(b, 'hull', accentHex, {
        rows: 4, cols: 8, rowGap: 0.55, colGap: 0.58,
        w: 0.70, h: 0.60, d: 0.18, x: 0, y: 0.50, z: 24.0, axis: 'z',
      });

      // Access railing
      railing(b, 'hull', trimHex, {
        ax: -5.0, ay: 0, az: 10.0, bx: 5.0, by: 0, bz: 10.0,
        height: 1.2, posts: 8,
      });

      // Aft rib cathedral  sternZ ≈ 23.35  max|y|=4.35 ≤ 6.0
      ribBands(b, 'hull', darkHex, {
        r: 4.0, tube: 0.35, from: 16.0, to: 23.0, count: 15, axis: 'z',
      });

      // Lights
      lampString(b, 'lights', 0xfff2d8, {
        ax: -5.0, ay: 0, az: 19.0, bx: -5.0, by: 0, bz: 22.0,
        count: 3, size: 0.42,
      });
      lampString(b, 'lights', 0xfff2d8, {
        ax:  5.0, ay: 0, az: 19.0, bx:  5.0, by: 0, bz: 22.0,
        count: 3, size: 0.42,
      });
      // Tally lamps at ay=0.20 so the box bottom stays at y=0.04 (floor=0).
      // That puts every vertex in iy=0, adjacent to the tally-stripe hull at iy=1.
      lampString(b, 'lights', 0xffe8c8, {
        ax: -5.8, ay: 0.20, az: -14.0, bx: -5.8, by: 0.20, bz: -14.0,
        count: 1, size: 0.32,
      });
      lampString(b, 'lights', 0xffe8c8, {
        ax: -5.8, ay: 0.20, az:  -9.0, bx: -5.8, by: 0.20, bz:  -9.0,
        count: 1, size: 0.32,
      });
      lampString(b, 'lights', 0xffe8c8, {
        ax: -5.8, ay: 0.20, az:  -4.0, bx: -5.8, by: 0.20, bz:  -4.0,
        count: 1, size: 0.32,
      });
      lampString(b, 'lights', 0xffe8c8, {
        ax: -5.8, ay: 0.20, az:   1.0, bx: -5.8, by: 0.20, bz:   1.0,
        count: 1, size: 0.32,
      });
      lampString(b, 'lights', 0xffe8c8, {
        ax: -5.8, ay: 0.20, az:   6.0, bx: -5.8, by: 0.20, bz:   6.0,
        count: 1, size: 0.32,
      });
      lampString(b, 'lights', 0xffffff, {
        ax: -5.0, ay: 0, az: 21.0, bx: -5.0, by: 0, bz: 22.5,
        count: 5, size: 0.30,
      });
      lampString(b, 'lights', 0xffffff, {
        ax:  5.0, ay: 0, az: 21.0, bx:  5.0, by: 0, bz: 22.5,
        count: 5, size: 0.30,
      });
      lampString(b, 'lights', 0xffffff, {
        ax: 0, ay: 3.8, az: 21.0, bx: 0, by: 3.8, bz: 22.5,
        count: 4, size: 0.30,
      });
      lampString(b, 'lights', 0xfff8e8, {
        ax: -5.0, ay: 0, az: 22.5, bx: -5.0, by: 0, bz: 22.5,
        count: 1, size: 0.40,
      });
      lampString(b, 'lights', 0xfff8e8, {
        ax:  5.0, ay: 0, az: 22.5, bx:  5.0, by: 0, bz: 22.5,
        count: 1, size: 0.40,
      });
      // Bridge lights at x=1.5 and x=5.5 so each is adjacent to a citadel
      // back-face corner (ix=1 or ix=6 at iz=11 from corner at ~11.24..11.74).
      lampString(b, 'lights', 0xffffff, {
        ax: 1.5, ay: 5.5, az: 11.0, bx: 5.5, by: 5.5, bz: 11.0,
        count: 2, size: 0.28,
      });
    },
  },
};
