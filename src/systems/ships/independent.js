/**
 * Independent Drifters — "the lash-up" (wave 47 round-2 reshape)
 *
 * Long working hulls from donated plating, visible patch welds, external cargo
 * netted down, one amber lamp run. Neutral gray palette read through value
 * contrast on the SHADES ladder — not hue.
 *
 * Palette roles (FACTION_STYLE):
 *   hull       0x6a7076  neutral gray  (structure)
 *   hullDark   0x3a3f45  charcoal      (ribs, seams)
 *   trim       0xd7e4ea  pale alloy    (plating, cladding)
 *   accent     0x9aa7b8  cool gray     (secondary trim)
 *   glow       0xffa54a  warm amber    (running lights — unused here)
 *
 * Lights channel: near-neutral tints only (every sRGB channel >= 0.6).
 * Nose at -Z, stern at +Z; glowZ inside [0.55·sternZ, sternZ+1.2].
 */

import {
  weather, box, cyl, cone, ribBands,
  windowGrid, portholeRing, panelSkin, panelPatches, truss, railing,
  antenna, ladder, lampString, airlock, pipeRun,
} from '../station-detail.js';

export const independentShip = {

  // -------------------------------------------------------------------- light
  // THE STRIPPED RACER: cockpit bolted to a huge engine, external fuel pod,
  // one lamp run. Two seats, a reactor, and hope.
  // x ±1.14  y −0.84…0.78  z −2.70…3.38  spanZ/spanX ≈ 2.72
  light: {
    glowZ: 2.8,
    build(b, st) {
      const GRAY = st.hull, DARK = st.hullDark, PALE = st.trim, COOL = st.accent;
      const W = weather;
      const P_GRAY = [GRAY, W(GRAY,1), W(GRAY,2)];
      const P_PALE = [PALE, W(PALE,1), W(GRAY,2), W(GRAY,3)];
      const P_MIX  = [GRAY, W(GRAY,1), PALE, W(PALE,1), W(COOL,1)];
      const LIT = 0xffffff, LIT_WARM = 0xfff2e2, LIT_DIM = 0xe8dcc8;

      // Nose cone — base (r=0.55) at z=−2.70, apex at z=−0.65
      cone(b, 'hull', W(PALE,1), 0.55, 2.05, 14, { z: -1.675, rx: Math.PI/2 });

      // Cockpit pressure drum — bridges cone to fuselage
      cyl(b, 'hull', W(GRAY,1), 0.64, 0.59, 1.30, 14, { z: -0.275, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_GRAY, { r: 0.66, from: -0.90, to: 0.35, rows: 2, cols: 8,
        seed: 0xA001, t: 0.10, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 0.67, from: -0.80, to: 0.25,
        count: 2, seed: 0xA011, w: 0.50, h: 0.38, t: 0.12, axis: 'z' });
      // Cockpit windows — on the flat of the pressure drum
      windowGrid(b, 'lights', LIT_WARM, { rows: 1, cols: 2, rowGap: 0.32, colGap: 0.44,
        w: 0.28, h: 0.22, d: 0.22, x: 0.54, y: 0.18, z: -0.30, axis: 'z' });
      // Top hatch
      box(b, 'hull', W(PALE,1), 0.44, 0.18, 0.34, { y: 0.66, z: -0.30 });

      // Main fuselage tube — the long body of the racer
      cyl(b, 'hull', W(PALE,1), 0.70, 0.63, 2.90, 16, { z: 1.02, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_MIX, { r: 0.72, from: -0.38, to: 2.42, rows: 4, cols: 9,
        seed: 0xA002, t: 0.10, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 0.73, from: 0.20, to: 2.30,
        count: 4, seed: 0xA012, w: 0.54, h: 0.42, t: 0.12, axis: 'z' });
      ribBands(b, 'hull', DARK, { r: 0.73, tube: 0.07, from: 0.30, to: 2.20,
        count: 3, axis: 'z', tseg: 14 });

      // External fuel pod on the belly — clamped below the fuselage
      cyl(b, 'hull', W(GRAY,2), 0.20, 0.20, 1.50, 10, { y: -0.62, z: 0.65, rx: Math.PI/2 });
      b.push(0, -0.62, 0.65);
      ribBands(b, 'hull', DARK, { r: 0.20, tube: 0.05, from: -0.55, to: 0.55,
        count: 2, axis: 'z', tseg: 8 });
      b.pop();
      // Piperun connecting pod to fuselage
      pipeRun(b, 'hull', W(PALE,1), { ax: 0, ay: -0.42, az: 0.30,
        bx: 0, by: -0.62, bz: 0.30, r: 0.06, seg: 4, collars: 0 });

      // Wing bracing tabs — slender struts
      box(b, 'hull', W(DARK,1), 0.36, 0.11, 0.68, { x:  1.00, y: 0.06, z: 0.72 });
      box(b, 'hull', W(DARK,1), 0.36, 0.11, 0.68, { x: -1.00, y: 0.06, z: 0.72 });
      box(b, 'hull', W(GRAY,2), 0.22, 0.10, 0.20, { x:  1.00, y: 0.06, z: 0.44 });
      box(b, 'hull', W(GRAY,1), 0.20, 0.10, 0.20, { x: -1.00, y: 0.06, z: 0.98 });
      // Wingtip running lamps
      box(b, 'lights', LIT, 0.12, 0.11, 0.12, { x:  1.11, y: 0.06, z: 0.90 });
      box(b, 'lights', LIT, 0.12, 0.11, 0.12, { x: -1.11, y: 0.06, z: 0.90 });

      // Engine block at the stern — boxy salvaged unit
      box(b, 'hull', W(GRAY,1), 1.06, 0.82, 1.06, { z: 2.70 });
      panelSkin(b, 'hull', P_PALE, { r: 0.60, from: 2.20, to: 3.20, rows: 2, cols: 8,
        seed: 0xA003, t: 0.10, axis: 'z' });
      // Exhaust nozzle — sternmost hull point ≈ z 3.38
      cyl(b, 'hull', DARK, 0.32, 0.42, 0.44, 12, { z: 3.16, rx: Math.PI/2 });
      // Engine glow lamps (lights channel)
      box(b, 'lights', LIT_WARM, 0.18, 0.18, 0.14, { x:  0.25, y: 0.10, z: 3.00 });
      box(b, 'lights', LIT_WARM, 0.18, 0.18, 0.14, { x: -0.25, y: 0.10, z: 3.00 });

      // Single amber lamp run along the spine
      lampString(b, 'lights', LIT_DIM, { ax: 0, ay: 0.60, az: -1.80,
        bx: 0, by: 0.60, bz: 2.60, count: 7, size: 0.14 });
    },
  },

  // ------------------------------------------------------------------ cutter
  // THE SURVIVOR: donated hull sections bolted over a working frame, mismatched
  // cargo drum, external tanks, patched plating.
  // x ±1.40  y −1.04…0.94  z −3.15…4.95  spanZ/spanX ≈ 2.90
  cutter: {
    glowZ: 4.2,
    build(b, st) {
      const GRAY = st.hull, DARK = st.hullDark, PALE = st.trim, COOL = st.accent;
      const W = weather;
      const P_GRAY = [GRAY, W(GRAY,1), W(GRAY,2)];
      const P_PALE = [PALE, W(PALE,1), W(GRAY,2), W(GRAY,3)];
      const P_COOL = [COOL, W(COOL,1), W(COOL,2), W(GRAY,2)];
      const P_MIX  = [GRAY, W(GRAY,1), PALE, W(PALE,1), W(COOL,1)];
      const LIT = 0xffffff, LIT_WARM = 0xfff2e2, LIT_DIM = 0xe8dcc8;

      // Nose cone — base (r=0.68) at z=−3.15, apex at z=−0.75
      cone(b, 'hull', W(PALE,1), 0.68, 2.40, 14, { z: -1.95, rx: Math.PI/2 });

      // Forward cockpit drum — salvaged pressure section
      cyl(b, 'hull', W(GRAY,1), 0.76, 0.70, 1.50, 14, { z: -0.00, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_GRAY, { r: 0.78, from: -0.73, to: 0.73, rows: 2, cols: 8,
        seed: 0xB001, t: 0.10, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 0.79, from: -0.60, to: 0.60,
        count: 2, seed: 0xB011, w: 0.52, h: 0.40, t: 0.12, axis: 'z' });
      windowGrid(b, 'lights', LIT_WARM, { rows: 2, cols: 2, rowGap: 0.34, colGap: 0.42,
        w: 0.28, h: 0.22, d: 0.22, x: 0.66, y: 0.18, z: 0.00, axis: 'z' });
      box(b, 'hull', W(PALE,1), 0.58, 0.20, 0.46, { y: 0.78, z: 0.00 });
      // Side airlock stub — welded-on access hatch
      box(b, 'hull', W(GRAY,2), 0.26, 0.46, 0.36, { x: -0.74, y: 0.06, z: 0.00 });

      // Main hull body — the donated pressure cylinder
      cyl(b, 'hull', W(PALE,1), 0.86, 0.78, 4.60, 18, { z: 2.30, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_MIX, { r: 0.88, from: 0.06, to: 4.54, rows: 5, cols: 10,
        seed: 0xB002, t: 0.12, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 0.82, from: 0.40, to: 4.20,
        count: 5, seed: 0xB012, w: 0.60, h: 0.46, t: 0.14, axis: 'z' });
      ribBands(b, 'hull', DARK, { r: 0.89, tube: 0.09, from: 0.50, to: 4.10,
        count: 4, axis: 'z', tseg: 12 });

      // External fuel tank on belly
      cyl(b, 'hull', W(COOL,1), 0.26, 0.26, 2.20, 12, { y: -0.82, z: 1.90, rx: Math.PI/2 });

      // Cargo pod (starboard) — salvaged drum bolted to hull
      b.push(0.90, 0.50, 1.60);
      cyl(b, 'hull', W(GRAY,2), 0.36, 0.36, 1.60, 12, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_COOL, { r: 0.38, from: -0.70, to: 0.70, rows: 2, cols: 7,
        seed: 0xB003, t: 0.10, axis: 'z' });
      portholeRing(b, 'lights', LIT_DIM, { r: 0.38, count: 4, size: 0.14, y: 0, tilt: 0.08 });
      b.pop();

      // Wing bracing struts — flat, slightly swept
      box(b, 'hull', W(DARK,1), 0.40, 0.12, 0.90, { x:  1.20, y: 0.08, z: 1.90 });
      box(b, 'hull', W(DARK,1), 0.40, 0.12, 0.90, { x: -1.20, y: 0.08, z: 1.90 });
      box(b, 'hull', W(GRAY,2), 0.26, 0.10, 0.22, { x:  1.20, y: 0.08, z: 1.50 });
      box(b, 'hull', W(PALE,1), 0.24, 0.10, 0.22, { x: -1.20, y: 0.08, z: 2.26 });
      // Wingtip lamps
      box(b, 'lights', LIT, 0.16, 0.12, 0.12, { x:  1.32, y: 0.08, z: 2.18 });
      box(b, 'lights', LIT, 0.16, 0.12, 0.12, { x: -1.32, y: 0.08, z: 2.18 });

      // Service ladder on the hull
      ladder(b, 'hull', DARK, { x: 0.80, y: -0.42, z: 3.20, h: 1.40, w: 0.46, rungs: 3, ry: 0.3 });

      // Engine block — mismatched salvaged unit
      box(b, 'hull', W(GRAY,1), 1.60, 1.12, 0.80, { z: 4.20 });
      panelSkin(b, 'hull', P_PALE, { r: 0.68, from: 3.82, to: 4.58, rows: 2, cols: 8,
        seed: 0xB004, t: 0.10, axis: 'z' });
      // Exhaust nozzles — sternmost hull point ≈ z 4.95
      cyl(b, 'hull', DARK, 0.38, 0.50, 0.35, 12, { x:  0.36, z: 4.68, rx: Math.PI/2 });
      cyl(b, 'hull', DARK, 0.38, 0.50, 0.35, 12, { x: -0.36, z: 4.68, rx: Math.PI/2 });
      // Engine glow lamps
      box(b, 'lights', LIT_WARM, 0.24, 0.24, 0.20, { x:  0.36, z: 4.88 });
      box(b, 'lights', LIT_WARM, 0.24, 0.24, 0.20, { x: -0.36, z: 4.88 });
      box(b, 'lights', LIT_DIM,  0.20, 0.20, 0.16, { y:  0.48, z: 4.20 });
      box(b, 'lights', LIT_DIM,  0.20, 0.20, 0.16, { y: -0.48, z: 4.20 });
      // Amber lamp runs — port and starboard
      lampString(b, 'lights', LIT_DIM, { ax: 0, ay: 0.72, az: -1.60,
        bx: 0, by: 0.72, bz: 4.10, count: 9, size: 0.18 });
      lampString(b, 'lights', LIT_DIM, { ax: 0, ay: -0.72, az: -1.60,
        bx: 0, by: -0.72, bz: 4.10, count: 9, size: 0.18 });
    },
  },

  // --------------------------------------------------------------------- ace
  // THE STRIPPED-OUT RACER: tapered fuselage, single large engine, radiator
  // panels, minimal armour. Everything removed to shave mass.
  // x ±1.72  y −1.17…1.20  z −4.40…5.70  spanZ/spanX ≈ 2.94
  ace: {
    glowZ: 5.2,
    build(b, st) {
      const GRAY = st.hull, DARK = st.hullDark, PALE = st.trim, COOL = st.accent;
      const W = weather;
      const P_GRAY = [GRAY, W(GRAY,1), W(GRAY,2)];
      const P_PALE = [PALE, W(PALE,1), W(GRAY,2), W(GRAY,3)];
      const P_MIX  = [GRAY, W(GRAY,1), PALE, W(PALE,1), W(COOL,1)];
      const LIT = 0xffffff, LIT_WARM = 0xfff2e2, LIT_DIM = 0xe8dcc8;

      // Nose cone — base at z=−4.40, apex at z=−2.00
      cone(b, 'hull', W(PALE,1), 0.92, 2.40, 14, { z: -3.20, rx: Math.PI/2 });

      // Forward cockpit fairing — narrow armoured section
      cyl(b, 'hull', W(GRAY,1), 0.94, 0.88, 2.40, 16, { z: -0.80, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_GRAY, { r: 0.96, from: -1.95, to: 0.35, rows: 3, cols: 9,
        seed: 0xC001, t: 0.10, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 0.97, from: -1.70, to: 0.20,
        count: 3, seed: 0xC011, w: 0.60, h: 0.46, t: 0.12, axis: 'z' });
      // Cockpit canopy — a series of small cylinders (segmented glass)
      for (let i = 0; i < 6; i++) {
        const cz = -1.70 + i * 0.30;
        cyl(b, 'lights', LIT_WARM, 0.32, 0.32, 0.28, 8,
          { x: 0, y: 0.66, z: cz, rx: Math.PI/2 });
      }
      // Canopy mullions
      box(b, 'hull', DARK, 0.04, 0.68, 1.70, { x: 0.30, y: 0.68, z: -1.25 });
      box(b, 'hull', DARK, 0.04, 0.68, 1.70, { x: -0.30, y: 0.68, z: -1.25 });

      // Main fuselage — the tapered racing hull
      cyl(b, 'hull', W(PALE,1), 1.10, 0.95, 7.00, 18, { z: 1.50, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_MIX, { r: 1.12, from: -1.92, to: 4.92, rows: 5, cols: 11,
        seed: 0xC002, t: 0.12, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 1.13, from: -1.60, to: 4.60,
        count: 6, seed: 0xC012, w: 0.66, h: 0.52, t: 0.14, axis: 'z' });
      ribBands(b, 'hull', DARK, { r: 1.13, tube: 0.10, from: -0.90, to: 4.40,
        count: 4, axis: 'z', tseg: 14 });

      // Fuel pod on belly
      cyl(b, 'hull', W(GRAY,2), 0.22, 0.22, 1.60, 10,
        { y: -0.95, z: 0.70, rx: Math.PI/2 });
      b.push(0, -0.95, 0.70);
      ribBands(b, 'hull', DARK, { r: 0.22, tube: 0.05, from: -0.60, to: 0.60,
        count: 2, axis: 'z', tseg: 8 });
      b.pop();

      // External radiator panels — thin fins on flanks
      box(b, 'hull', W(PALE,1), 0.06, 1.26, 2.40, { x:  1.60, z: 1.80 });
      box(b, 'hull', W(PALE,1), 0.06, 1.26, 2.40, { x: -1.60, z: 1.80 });
      box(b, 'hull', W(COOL,1), 0.06, 1.20, 2.30, { x:  1.66, z: 1.80 });
      box(b, 'hull', W(COOL,1), 0.06, 1.20, 2.30, { x: -1.66, z: 1.80 });
      // Truss bracing from fuselage to radiator
      truss(b, 'hull', DARK, { ax: 0.95, ay: 0.00, az: 0.50,
        bx: 1.60, by: 0.00, bz: 2.40, bays: 3, thickness: 0.16, spread: 0.20 });
      truss(b, 'hull', DARK, { ax: -0.95, ay: 0.00, az: 0.50,
        bx: -1.60, by: 0.00, bz: 2.40, bays: 3, thickness: 0.16, spread: 0.20 });

      // Large engine block
      box(b, 'hull', W(GRAY,2), 2.04, 1.52, 0.70, { z: 5.25 });
      panelSkin(b, 'hull', P_PALE, { r: 1.06, from: 4.92, to: 5.58, rows: 2, cols: 10,
        seed: 0xC003, t: 0.12, axis: 'z' });
      // Exhaust nozzle — sternmost hull point ≈ z 5.70
      cyl(b, 'hull', DARK, 0.44, 0.56, 0.30, 14, { z: 5.55, rx: Math.PI/2 });
      ribBands(b, 'hull', W(DARK,1), { r: 0.57, tube: 0.08, from: 5.42, to: 5.68,
        count: 2, axis: 'z', tseg: 12 });

      // Engine glow cluster
      box(b, 'lights', LIT_WARM, 0.34, 0.34, 0.28, { z: 5.48, y: 0.20 });
      box(b, 'lights', LIT_WARM, 0.34, 0.34, 0.28, { z: 5.48, y: -0.20 });
      box(b, 'lights', LIT,      0.30, 0.30, 0.26, { z: 5.50 });

      // Radiator edge lamps
      box(b, 'lights', LIT_DIM, 0.12, 0.12, 0.12, { x:  1.62, y: 0.56, z: 0.60 });
      box(b, 'lights', LIT_DIM, 0.12, 0.12, 0.12, { x: -1.62, y: 0.56, z: 0.60 });
      box(b, 'lights', LIT_DIM, 0.12, 0.12, 0.12, { x:  1.62, y: 0.56, z: 2.90 });
      box(b, 'lights', LIT_DIM, 0.12, 0.12, 0.12, { x: -1.62, y: 0.56, z: 2.90 });
      // Spine lamp run
      lampString(b, 'lights', LIT_DIM, { ax: 0, ay: 0.80, az: -2.40,
        bx: 0, by: 0.80, bz: 5.00, count: 11, size: 0.18 });
    },
  },

  // --------------------------------------------------------------- freighter
  // THE REPURPOSED HAULER: boxy cargo drum cut down and patched into a minimal
  // transport — rib-banded hull, mismatched plating, crane bolted to the spine.
  // x ±2.30  y −1.80…1.92  z −6.40…7.00  spanZ/spanX ≈ 2.91
  freighter: {
    glowZ: 6.5,
    build(b, st) {
      const GRAY = st.hull, DARK = st.hullDark, PALE = st.trim, COOL = st.accent;
      const W = weather;
      const P_GRAY = [GRAY, W(GRAY,1), W(GRAY,2)];
      const P_PALE = [PALE, W(PALE,1), W(GRAY,2), W(GRAY,3)];
      const P_COOL = [COOL, W(COOL,1), W(COOL,2), W(GRAY,2)];
      const P_MIX  = [GRAY, W(GRAY,1), PALE, W(PALE,1), W(COOL,1)];
      const LIT = 0xffffff, LIT_WARM = 0xfff2e2, LIT_DIM = 0xe8dcc8;

      // Nose section — tapered bow
      cone(b, 'hull', W(PALE,1), 1.28, 3.00, 16, { z: -4.90, rx: Math.PI/2 });

      // Forward cockpit drum
      cyl(b, 'hull', W(GRAY,1), 1.30, 1.22, 2.80, 16, { z: -1.30, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_GRAY, { r: 1.32, from: -2.68, to: 0.08, rows: 3, cols: 10,
        seed: 0xD001, t: 0.12, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 1.33, from: -2.40, to: -0.20,
        count: 4, seed: 0xD011, w: 0.72, h: 0.56, t: 0.14, axis: 'z' });
      windowGrid(b, 'lights', LIT_WARM, { rows: 2, cols: 3, rowGap: 0.44, colGap: 0.60,
        w: 0.36, h: 0.28, d: 0.28, x: 1.12, y: 0.24, z: -1.30, axis: 'z' });
      // Top hatch on cockpit
      box(b, 'hull', W(PALE,1), 0.90, 0.28, 0.70, { y: 1.32, z: -1.30 });
      // Side airlock
      box(b, 'hull', W(GRAY,2), 0.34, 0.62, 0.50, { x: -1.26, y: 0.10, z: -1.30 });

      // Main cargo drum — the repurposed hauler body
      cyl(b, 'hull', W(PALE,1), 1.55, 1.42, 9.20, 20, { z: 2.30, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_MIX, { r: 1.57, from: -2.28, to: 6.50, rows: 6, cols: 12,
        seed: 0xD002, t: 0.14, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 1.59, from: -1.80, to: 5.80,
        count: 8, seed: 0xD012, w: 0.82, h: 0.62, t: 0.16, axis: 'z' });

      // Cargo pods strapped to the deck (three drums)
      for (let i = 0; i < 3; i++) {
        const pz = -0.80 + i * 2.40;
        b.push(0.00, 1.20, pz);
        cyl(b, 'hull', W(COOL, 1 + (i % 2)), 0.46, 0.46, 1.60, 12, { rx: Math.PI/2 });
        panelSkin(b, 'hull', P_COOL, { r: 0.48, from: -0.68, to: 0.68, rows: 2, cols: 7,
          seed: 0xD003 ^ (i * 0x111), t: 0.10, axis: 'z' });
        portholeRing(b, 'lights', LIT_DIM, { r: 0.48, count: 2, size: 0.14, y: 0, tilt: 0.10 });
        b.pop();
        // Deck straps holding cargo pods
        box(b, 'hull', DARK, 0.10, 0.86, 0.10, { x:  0.40, y: 1.10, z: pz });
        box(b, 'hull', DARK, 0.10, 0.86, 0.10, { x: -0.40, y: 1.10, z: pz });
      }

      // Undercarriage wing stubs — wide flat extensions
      box(b, 'hull', W(DARK,1), 0.54, 0.14, 1.40, { x:  2.30, y: 0.08, z: 1.60 });
      box(b, 'hull', W(DARK,1), 0.54, 0.14, 1.40, { x: -2.30, y: 0.08, z: 1.60 });
      box(b, 'hull', W(GRAY,2), 0.36, 0.12, 0.26, { x:  2.30, y: 0.08, z: 0.98 });
      box(b, 'hull', W(PALE,1), 0.34, 0.12, 0.24, { x: -2.30, y: 0.08, z: 2.20 });

      // Fuel tanks on the belly
      cyl(b, 'hull', W(GRAY,2), 0.26, 0.26, 1.80, 12,
        { x:  0.70, y: -1.40, z: 1.50, rx: Math.PI/2 });
      cyl(b, 'hull', W(GRAY,2), 0.26, 0.26, 1.80, 12,
        { x: -0.70, y: -1.40, z: 1.50, rx: Math.PI/2 });

      // Bridge deck on top — lowered, no railings
      box(b, 'hull', W(DARK,1), 2.80, 0.38, 1.80, { y: 1.62, z: -0.60 });

      // Service ladders
      ladder(b, 'hull', DARK, { x: 1.50, y: -0.45, z: 3.50, h: 2.00, w: 0.48, rungs: 4, ry: 0.4 });
      ladder(b, 'hull', DARK, { x: 1.50, y: -0.45, z: -1.00, h: 2.00, w: 0.48, rungs: 4, ry: -0.4 });

      // Engine block at stern
      box(b, 'hull', W(GRAY,1), 2.36, 1.74, 1.00, { z: 6.52 });
      panelSkin(b, 'hull', P_PALE, { r: 1.06, from: 6.04, to: 7.00, rows: 2, cols: 10,
        seed: 0xD004, t: 0.12, axis: 'z' });
      // Exhaust nozzles — sternmost hull point ≈ z 7.00
      cyl(b, 'hull', DARK, 0.54, 0.68, 0.30, 14, { x:  0.56, z: 6.87, rx: Math.PI/2 });
      cyl(b, 'hull', DARK, 0.54, 0.68, 0.30, 14, { x: -0.56, z: 6.87, rx: Math.PI/2 });
      // Engine glow lamps
      box(b, 'lights', LIT_WARM, 0.32, 0.32, 0.26, { x:  0.56, z: 6.94 });
      box(b, 'lights', LIT_WARM, 0.32, 0.32, 0.26, { x: -0.56, z: 6.94 });
      box(b, 'lights', LIT_DIM,  0.26, 0.26, 0.22, { y:  0.80, z: 6.52 });
      box(b, 'lights', LIT_DIM,  0.26, 0.26, 0.22, { y: -0.80, z: 6.52 });

      // Undercarriage truss spine
      truss(b, 'hull', DARK, { ax: -1.55, ay: -1.35, az: 0.00,
        bx: 1.55, by: -1.35, bz: 0.00, bays: 7, thickness: 0.22, spread: 0.80 });

      // Lamp runs — double spine along the hull
      lampString(b, 'lights', LIT_DIM, { ax: 0, ay: 1.20, az: -3.20,
        bx: 0, by: 1.20, bz: 6.30, count: 14, size: 0.22 });
      lampString(b, 'lights', LIT_DIM, { ax: 0, ay: -1.20, az: -3.20,
        bx: 0, by: -1.20, bz: 6.30, count: 14, size: 0.22 });
      lampString(b, 'lights', LIT_WARM, { ax: -1.40, ay: 1.82, az: -1.40,
        bx: 1.40, by: 1.82, bz: -1.40, count: 5, size: 0.20 });
    },
  },

  // -------------------------------------------------------------------- heavy
  // THE BOLTED-ON GUNSHIP: freighter hull with weapons and armour added after
  // the fact — weapon pods on the wings, reinforced truss, second engine.
  // x ±3.40  y −2.12…2.06  z −8.30…8.75  spanZ/spanX ≈ 2.52
  heavy: {
    glowZ: 7.5,
    build(b, st) {
      const GRAY = st.hull, DARK = st.hullDark, PALE = st.trim, COOL = st.accent;
      const W = weather;
      const P_GRAY = [GRAY, W(GRAY,1), W(GRAY,2)];
      const P_PALE = [PALE, W(PALE,1), W(GRAY,2), W(GRAY,3)];
      const P_COOL = [COOL, W(COOL,1), W(COOL,2), W(GRAY,2)];
      const P_MIX  = [GRAY, W(GRAY,1), PALE, W(PALE,1), W(COOL,1)];
      const LIT = 0xffffff, LIT_WARM = 0xfff2e2, LIT_DIM = 0xe8dcc8;

      // Nose cone — base at z=−8.30, apex at z=−5.10
      cone(b, 'hull', W(PALE,1), 1.60, 3.20, 16, { z: -6.70, rx: Math.PI/2 });

      // Forward cockpit / bridge section
      cyl(b, 'hull', W(GRAY,1), 1.64, 1.54, 3.60, 16, { z: -3.30, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_GRAY, { r: 1.66, from: -5.08, to: -1.52, rows: 3, cols: 10,
        seed: 0xE001, t: 0.12, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 1.67, from: -4.80, to: -1.80,
        count: 4, seed: 0xE011, w: 0.72, h: 0.56, t: 0.14, axis: 'z' });
      windowGrid(b, 'lights', LIT_WARM, { rows: 2, cols: 3, rowGap: 0.48, colGap: 0.62,
        w: 0.36, h: 0.28, d: 0.28, x: 1.44, y: 0.28, z: -3.30, axis: 'z' });
      // Armoured bridge deck
      box(b, 'hull', W(DARK,1), 3.00, 0.56, 2.20, { y: 1.72, z: -3.30 });
      panelSkin(b, 'hull', P_PALE, { r: 1.16, from: -4.38, to: -2.22, rows: 2, cols: 8,
        seed: 0xE021, t: 0.12, axis: 'z' });
      railing(b, 'hull', PALE, { ax: -1.50, ay: 1.94, az:  0.90,
        bx: 1.50, by: 1.94, bz:  0.90, height: 0.36, posts: 6, rail: 0.06 });
      railing(b, 'hull', PALE, { ax: -1.50, ay: 1.94, az: -0.90,
        bx: 1.50, by: 1.94, bz: -0.90, height: 0.36, posts: 6, rail: 0.06 });

      // Main hull body
      cyl(b, 'hull', W(PALE,1), 1.90, 1.72, 12.40, 20, { z: 1.10, rx: Math.PI/2 });
      panelSkin(b, 'hull', P_MIX, { r: 1.92, from: -5.08, to: 7.28, rows: 6, cols: 12,
        seed: 0xE002, t: 0.14, axis: 'z' });
      panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 1.94, from: -4.60, to: 6.80,
        count: 10, seed: 0xE012, w: 0.90, h: 0.68, t: 0.16, axis: 'z' });
      ribBands(b, 'hull', DARK, { r: 1.93, tube: 0.13, from: -4.40, to: 6.60,
        count: 6, axis: 'z', tseg: 14 });

      // Weapon pods on the wings — bolted on after the fact
      for (const side of [-1, 1]) {
        // Wing strut
        box(b, 'hull', W(DARK,1), 0.54, 0.16, 2.00,
          { x: side * 2.40, y: 0.10, z: 0.50 });
        panelPatches(b, 'hull', [W(GRAY,2)], { r: 1.50, from: -0.90, to: 1.90,
          count: 3, seed: 0xE003 ^ (side === 1 ? 0 : 1), w: 0.70, h: 0.40, t: 0.14,
          axis: 'z' });
        // Weapon pod
        b.push(side * 2.54, 0.00, 0.50);
        cyl(b, 'hull', W(COOL,1), 0.80, 0.80, 2.80, 14, { rx: Math.PI/2 });
        panelSkin(b, 'hull', P_COOL, { r: 0.82, from: -1.28, to: 1.28, rows: 2, cols: 8,
          seed: 0xE004 ^ (side === 1 ? 0 : 1), t: 0.12, axis: 'z' });
        // Weapon barrels
        cyl(b, 'hull', DARK, 0.24, 0.24, 1.60, 8, { y:  0.38, z: 1.80, rx: Math.PI/2 });
        cyl(b, 'hull', DARK, 0.24, 0.24, 1.60, 8, { y: -0.38, z: 1.80, rx: Math.PI/2 });
        b.pop();
        // Truss bracing from hull to weapon pod
        truss(b, 'hull', DARK,
          { ax: side * 1.90, ay: -0.50, az: -0.50,
            bx: side * 2.54, by: -0.50, bz:  0.50,
            bays: 3, thickness: 0.18, spread: 0.55 });
        // Wingtip lamp
        box(b, 'lights', LIT, 0.20, 0.18, 0.18,
          { x: side * 3.40, y: 0.00, z: 0.50 });
      }

      // Additional pressure drums for crew and ammo (belly)
      b.push(0.00, -1.60, 1.80);
      cyl(b, 'hull', W(GRAY,2), 0.50, 0.50, 2.80, 14, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_GRAY, { r: 0.52, from: -1.20, to: 1.20, rows: 3, cols: 9,
        seed: 0xE005, t: 0.12, axis: 'z' });
      portholeRing(b, 'lights', LIT_DIM, { r: 0.52, count: 7, size: 0.16, y: 0, tilt: 0.12 });
      b.pop();

      b.push(0.00, -1.60, -1.20);
      cyl(b, 'hull', W(PALE,2), 0.44, 0.44, 2.40, 14, { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_PALE, { r: 0.46, from: -1.00, to: 1.00, rows: 3, cols: 8,
        seed: 0xE006, t: 0.12, axis: 'z' });
      portholeRing(b, 'lights', LIT_DIM, { r: 0.46, count: 6, size: 0.14, y: 0, tilt: 0.15 });
      b.pop();

      // Dual engine cluster at stern
      box(b, 'hull', W(GRAY,1), 3.00, 2.24, 1.40, { z: 8.00 });
      panelSkin(b, 'hull', P_MIX, { r: 1.44, from: 7.32, to: 8.68, rows: 2, cols: 10,
        seed: 0xE007, t: 0.14, axis: 'z' });
      // Dual exhaust nozzles — sternmost hull point ≈ z 8.75
      cyl(b, 'hull', DARK, 0.68, 0.84, 0.44, 14, { x:  0.68, z: 8.53, rx: Math.PI/2 });
      cyl(b, 'hull', DARK, 0.68, 0.84, 0.44, 14, { x: -0.68, z: 8.53, rx: Math.PI/2 });
      // Engine glow cluster
      box(b, 'lights', LIT_WARM, 0.36, 0.36, 0.30, { x:  0.68, z: 8.68 });
      box(b, 'lights', LIT_WARM, 0.36, 0.36, 0.30, { x: -0.68, z: 8.68 });
      box(b, 'lights', LIT,      0.32, 0.32, 0.28, { z: 8.68 });

      // Reinforced truss undercarriage
      truss(b, 'hull', DARK, { ax: -1.90, ay: -2.10, az: 0.00,
        bx: 1.90, by: -2.10, bz: 0.00, bays: 9, thickness: 0.24, spread: 0.90 });

      // Lamp runs — port, starboard, bridge deck
      lampString(b, 'lights', LIT_DIM, { ax: 0, ay: 1.08, az: -3.60,
        bx: 0, by: 1.08, bz: 7.80, count: 14, size: 0.22 });
      lampString(b, 'lights', LIT_DIM, { ax: 0, ay: -1.08, az: -3.60,
        bx: 0, by: -1.08, bz: 7.80, count: 14, size: 0.22 });
      lampString(b, 'lights', LIT_WARM, { ax: -1.50, ay: 2.02, az: -4.30,
        bx: 1.50, by: 2.02, bz: -4.30, count: 6, size: 0.20 });
      lampString(b, 'lights', LIT_WARM, { ax: -0.80, ay: 2.02, az: -2.20,
        bx: 0.80, by: 2.02, bz: -2.20, count: 4, size: 0.20 });

      // Service ladders
      ladder(b, 'hull', DARK, { x: 1.80, y: -0.48, z: 5.50, h: 2.40, w: 0.52, rungs: 5, ry: 0.4 });
      ladder(b, 'hull', DARK, { x: 1.80, y: -0.48, z: -2.50, h: 2.40, w: 0.52, rungs: 5, ry: -0.4 });
    },
  },

  // ----------------------------------------------------------------- frigate
  // THE SALVAGED WARSHIP: a massive derelict hauler repurposed as a capital
  // ship — long plated spine, mismatched pressure drums, weapons pods,
  // bridge tower bolted to the deck, cargo netting, jury-rigged menace.
  // x ±6.20  y −2.30…5.10  z −13.0…22.30  spanZ/spanX ≈ 2.81
  frigate: {
    glowZ: 20.0,
    build(b, st) {
      const GRAY = st.hull, DARK = st.hullDark, PALE = st.trim, COOL = st.accent;
      const W = weather;
      const P_GRAY = [GRAY, W(GRAY,1), W(GRAY,2)];
      const P_PALE = [PALE, W(PALE,1), W(GRAY,2), W(GRAY,3)];
      const P_COOL = [COOL, W(COOL,1), W(COOL,2), W(GRAY,2)];
      const P_MIX  = [GRAY, W(GRAY,1), PALE, W(PALE,1), W(COOL,1)];
      const LIT = 0xffffff, LIT_WARM = 0xfff2e2, LIT_DIM = 0xe8dcc8;

      // ── Keel spine ──────────────────────────────────────────────────────
      // Long armoured box spine — the backbone of the salvage hull
      // z from -13 (bow) to +22 (stern engine face), centre at z=4.5
      box(b, 'hull', W(GRAY,1), 4.00, 2.80, 35.00, { x: -0.80, z: 4.50 });
      panelSkin(b, 'hull', P_MIX, { r: 2.50, from: -12.50, to: 21.50, rows: 5, cols: 24,
        seed: 0xF001, t: 0.16, axis: 'z' });
      ribBands(b, 'hull', DARK, { r: 2.60, tube: 0.18, from: -12.00, to: 21.00,
        count: 6, axis: 'z', tseg: 14 });
      // Cargo hardpoints along the keel
      for (let kz = -10; kz <= 18; kz += 4.5) {
        box(b, 'hull', W(PALE,1), 1.00, 0.50, 2.20, { x: -0.80, y: 0.90, z: kz });
      }

      // ── Pressure drums clamped along the spine ───────────────────────────
      const DRUMS = [
        { z: -8.0, x:  0.6, r: 2.5, l:  8.0, skin: GRAY,         plates: P_GRAY },
        { z: -0.5, x: -0.4, r: 2.8, l: 11.0, skin: W(PALE,1),    plates: P_PALE },
        { z:  8.0, x:  0.6, r: 2.6, l: 10.0, skin: COOL,         plates: P_COOL },
        { z: 15.0, x: -0.5, r: 2.4, l:  8.0, skin: W(GRAY,2),    plates: P_MIX  },
      ];
      DRUMS.forEach((d, i) => {
        b.push(d.x, 0.50, d.z);
        cyl(b, 'hull', d.skin, d.r, d.r * 0.88, d.l, 16, { rx: Math.PI/2 });
        panelSkin(b, 'hull', d.plates, {
          r: d.r * 1.05, from: d.l / -2 + 0.8, to: d.l / 2 - 0.8,
          rows: 3, cols: 12, seed: 0xF002 ^ (i * 0x111), t: 0.18, axis: 'z' });
        panelPatches(b, 'hull', [DARK, W(DARK,1)], {
          r: d.r * 1.08, from: d.l / -2 + 1.4, to: d.l / 2 - 1.4,
          count: 4, seed: 0xF003 ^ (i * 0x222), w: 1.80, h: 1.30, t: 0.24, axis: 'z' });
        ribBands(b, 'hull', DARK, {
          r: d.r * 1.10, tube: 0.14, from: d.l / -2 + 1.2, to: d.l / 2 - 1.2,
          count: 2, axis: 'z', tseg: 14 });
        // Window fields
        windowGrid(b, 'lights', LIT_WARM, {
          rows: 2, cols: 4, rowGap: 0.90, colGap: 1.30, w: 0.60, h: 0.44, d: 0.50,
          x: d.r * 0.82, y: d.r * 0.28, z: 0, axis: 'z' });
        // Airlocks connecting drum to keel spine
        airlock(b, 'hull', W(PALE,1), DARK, {
          ax: 0, ay: -d.r * 0.88, az: 0,
          bx: 0, by: -1.40, bz: -d.x,
          r: 1.00, seg: 10, rings: 1 });
        b.pop();
      });

      // Inter-drum connectors
      for (let i = 0; i < DRUMS.length - 1; i++) {
        const d0 = DRUMS[i], d1 = DRUMS[i + 1];
        airlock(b, 'hull', W(PALE,2), DARK, {
          ax: d0.x, ay: 0.50, az: d0.z + d0.l / 2,
          bx: d1.x, by: 0.50, bz: d1.z - d1.l / 2,
          r: 1.20, seg: 12, rings: 2 });
      }

      // ── Bridge tower bolted to deck ─────────────────────────────────────
      b.push(0.00, 2.80, -3.00);
      // Tower base
      box(b, 'hull', W(DARK,1), 3.40, 1.80, 2.60, { y: 0.70 });
      panelSkin(b, 'hull', P_GRAY, { r: 1.50, from: -1.28, to: 1.28, rows: 2, cols: 7,
        seed: 0xF004, t: 0.14, axis: 'z' });
      // Bridge module
      box(b, 'hull', W(PALE,1), 2.80, 1.40, 2.00, { y: 2.20 });
      panelSkin(b, 'hull', P_PALE, { r: 1.20, from: -0.98, to: 0.98, rows: 2, cols: 6,
        seed: 0xF005, t: 0.14, axis: 'z' });
      // Bridge windows
      windowGrid(b, 'lights', LIT_WARM, { rows: 2, cols: 4, rowGap: 0.52, colGap: 0.80,
        w: 0.44, h: 0.36, d: 0.36, x: 1.22, y: 2.80, z: 0, axis: 'z' });
      // Railings
      railing(b, 'hull', PALE, { ax: -1.40, ay: 1.82, az: -0.90,
        bx: 1.40, by: 1.82, bz: -0.90, height: 0.60, posts: 6, rail: 0.07 });
      railing(b, 'hull', PALE, { ax: -1.40, ay: 1.82, az:  0.90,
        bx: 1.40, by: 1.82, bz:  0.90, height: 0.60, posts: 6, rail: 0.07 });
      b.pop();

      // ── Weapon pods bolted to the hull ──────────────────────────────────
      for (const side of [-1, 1]) {
        // Bow weapon cluster
        b.push(side * 4.20, 1.00, -9.00);
        cyl(b, 'hull', W(COOL,1), 1.50, 1.50, 3.40, 14, { rx: Math.PI/2 });
        panelSkin(b, 'hull', P_COOL, { r: 1.52, from: -1.58, to: 1.58, rows: 3, cols: 9,
          seed: 0xF006 ^ (side === 1 ? 0 : 1), t: 0.16, axis: 'z' });
        for (let ww = 0; ww < 3; ww++) {
          cyl(b, 'hull', DARK, 0.30, 0.30, 2.00, 8,
            { y: (ww - 1) * 0.66, z: 1.90, rx: Math.PI/2 });
        }
        b.pop();
        // Truss bracing bow weapon pod to spine
        truss(b, 'hull', DARK,
          { ax: side * 2.50, ay: 0.40, az: -9.80,
            bx: side * 4.20, by: 0.40, bz: -8.20,
            bays: 3, thickness: 0.20, spread: 0.60 });

        // Broadside weapon bank
        b.push(side * 4.40, 1.50, 3.00);
        box(b, 'hull', W(GRAY,2), 3.60, 1.20, 1.60);
        panelPatches(b, 'hull', [DARK, W(DARK,1)], { r: 0.90, from: -2.20, to: 2.20,
          count: 4, seed: 0xF007 ^ (side === 1 ? 0 : 1), w: 1.10, h: 0.70, t: 0.18, axis: 'z' });
        for (let p = 0; p < 3; p++) {
          cyl(b, 'hull', DARK, 0.40, 0.40, 1.60, 8,
            { z: -1.50 + p * 1.10, rx: Math.PI/2 });
        }
        b.pop();
        // Truss supporting broadside pod
        truss(b, 'hull', DARK,
          { ax: side * 2.50, ay: 0.40, az: 2.20,
            bx: side * 4.40, by: 0.40, bz: 3.80,
            bays: 3, thickness: 0.18, spread: 0.55 });
      }

      // ── Stern castle and engine cluster ────────────────────────────────
      b.push(0.00, 1.20, 13.00);
      // Stern castle box
      box(b, 'hull', W(GRAY,1), 5.60, 2.00, 4.20, { y: 0.60 });
      panelSkin(b, 'hull', P_MIX, { r: 1.50, from: -2.90, to: 2.90, rows: 3, cols: 10,
        seed: 0xF008, t: 0.16, axis: 'z' });
      // Superstructure
      box(b, 'hull', W(PALE,1), 3.60, 1.60, 2.60, { y: 1.80, z: -1.20 });
      panelSkin(b, 'hull', P_PALE, { r: 1.30, from: -2.42, to: -0.02, rows: 2, cols: 7,
        seed: 0xF009, t: 0.14, axis: 'z' });
      // Engine bridge keel connecting stern castle to engine cluster
      box(b, 'hull', W(DARK,1), 1.20, 1.20, 9.00, { y: 0.20, z: 6.30 });
      // Massive engine cluster
      b.push(0.00, 0.00, 7.50);
      box(b, 'hull', W(DARK,1), 3.80, 2.90, 3.60);
      panelSkin(b, 'hull', P_GRAY, { r: 1.60, from: -1.78, to: 1.78, rows: 3, cols: 9,
        seed: 0xF00A, t: 0.16, axis: 'z' });
      // Four main exhausts — stern hull z ≈ 13+7.5+2.0+0.9=23.4 < 26 ✓
      for (const ex of [[-0.55,-0.65],[-0.55,0.65],[0.55,-0.65],[0.55,0.65]]) {
        cyl(b, 'hull', DARK, 1.00, 1.20, 1.80, 14,
          { z: 2.00, y: ex[0], x: ex[1], rx: Math.PI/2 });
        ribBands(b, 'hull', W(DARK,1), { r: 1.22, tube: 0.14, from: 1.12, to: 1.88,
          count: 2, axis: 'z', tseg: 12 });
      }
      // Engine glow — one per exhaust
      for (const ex of [[-0.55,-0.65],[-0.55,0.65],[0.55,-0.65],[0.55,0.65]]) {
        box(b, 'lights', LIT_WARM, 0.46, 0.46, 0.40,
          { z: 2.82, y: ex[0], x: ex[1] });
        box(b, 'lights', LIT, 0.40, 0.40, 0.36,
          { z: 2.82, y: ex[0] * 1.2, x: ex[1] * 1.2 });
      }
      b.pop(); // inner push (engine cluster)
      b.pop(); // outer push (stern castle)

      // ── Cargo netting with spare tanks ──────────────────────────────────
      b.push(0.00, 3.20, 8.00);
      box(b, 'hull', DARK, 4.60, 0.22, 2.60, { y: -1.10 });
      for (let i = 0; i < 3; i++) {
        cyl(b, 'hull', [W(COOL,1), W(GRAY,2), W(PALE,2)][i], 0.52, 0.52, 1.60, 12,
          { z: -1.60 + i * 1.10, rx: Math.PI/2 });
      }
      pipeRun(b, 'hull', W(PALE,1), { ax: -2.10, ay: -0.90, az: 0,
        bx: -2.10, by: -2.20, bz: 0, r: 0.09, seg: 6, collars: 1 });
      pipeRun(b, 'hull', W(PALE,1), { ax:  2.10, ay: -0.90, az: 0,
        bx:  2.10, by: -2.20, bz: 0, r: 0.09, seg: 6, collars: 1 });
      b.pop();

      // ── Antenna masts ───────────────────────────────────────────────────
      antenna(b, 'hull', DARK, W(PALE,1), { x:  1.80, y: 1.80, z: -8.00, h: 3.20, r: 0.11 });
      antenna(b, 'hull', DARK, W(PALE,1), { x: -1.80, y: 1.80, z:  7.00, h: 3.20, r: 0.11 });

      // ── Lamp runs ────────────────────────────────────────────────────────
      lampString(b, 'lights', LIT_DIM, { ax: 0, ay: 1.60, az: -11.00,
        bx: 0, by: 1.60, bz: 20.00, count: 24, size: 0.22 });
      lampString(b, 'lights', LIT_WARM, { ax: 0, ay: 1.60, az:  -8.00,
        bx: 0, by: 1.60, bz: 18.00, count: 20, size: 0.20 });
      lampString(b, 'lights', LIT_WARM, { ax: 0, ay: 3.50, az:  -5.00,
        bx: 0, by: 3.50, bz:  8.00, count: 10, size: 0.20 });
      lampString(b, 'lights', LIT_DIM,  { ax: 0, ay: 1.55, az:   3.00,
        bx: 0, by: 1.55, bz: 10.00, count:  6, size: 0.18 });

      // ── Service ladders ──────────────────────────────────────────────────
      ladder(b, 'hull', DARK, { x:  3.00, y: 0.40, z:  -3.50, h: 2.60, w: 0.55, rungs: 6 });
      ladder(b, 'hull', DARK, { x: -3.00, y: 0.40, z:   8.00, h: 2.60, w: 0.55, rungs: 6 });
    },
  },

};
