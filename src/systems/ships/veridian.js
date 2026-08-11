/**
 * Veridian Combine — hex-modular corporate survey fleet.
 *
 * Faction identity: industrial assay and survey vessels with hexagonal prism
 * spines, stacked modular pressure drums, thin emerald sensor fins and antenna
 * arrays, graphite plating with pale alloy structural members.
 *
 * Ship orientation: nose at -Z, stern at +Z. Length (long axis) on Z.
 * Hex spines run along Z with rx: Math.PI / 2.
 * Beam (width) on X. Y is kept low (ships are long, not tall).
 *
 * Primitive arity contract (from station-detail.js signatures):
 *   - ONE hex:  box, cyl, sphere, hemi, torus, cone, ribBands, windowRow,
 *               portholeRing, truss, railing, pipeRun, windowGrid, lampString,
 *               crate, panelSkin (uses single hex for the wrap color)
 *               NOTE: panelSkin and panelPatches are DIFFERENT — see below
 *   - ARRAY of hexes: panelSkin, panelPatches (randomly mix shades)
 *   - TWO hexes: antenna(b,ch, hexMast, hexTip), radiatorPanel(b,ch, hexFrame, hexFin)
 *
 * Lights: authored near-whites ONLY, all RGB channels >= 0.6.
 *   Legal: 0xffffff, 0xfff2d8, 0xe8f0ff, 0xe8dcc8
 * Hull palette: st.hull, st.trim, st.accent and weather(hex, 0..3) of same.
 */

import {
  weather, box, cyl, cone,
  ribBands, windowRow, windowGrid, panelPatches,
  pipeRun, antenna, ladder, lampString,
  panelSkin,
} from '../station-detail.js';

export const veridianShip = {
  /**
   * LIGHT SCOUT — minimal survey runner.
   * Contract: x ≤ 1.3 | y ≤ 0.9 | z ≤ 3.4 | radius 2.2–3.5
   * Hull: 3,000–12,000 verts. Lights: 200 – 25% of hull.
   */
  light: {
    glowZ: 2.6,
    build(b, st) {
      const G = st.hull;               // graphite
      const GW = weather(G, 1);        // lighter shade for mix
      const A = st.trim;               // pale alloy
      const AW = weather(A, 1);
      const W = 0xffffff;
      const WS = 0xfff2d8;
      const WD = 0xe8dcc8;
      const WC = 0xe8f0ff;
      const PG = [G, GW];             // panel arrays
      const PA = [A, AW];

      // ── hex prism spine along Z ──────────────────────────────────────
      b.push(0, 0, 0, 0, 0, 0);
        cyl(b, 'hull', G, 0.5, 0.5, 5.5, 6, { rx: Math.PI / 2 });
        panelSkin(b, 'hull', PG, { r: 0.5, from: -2.5, to: 2.5, rows: 7, cols: 8, seed: 101, t: 0.12, axis: 'z' });
        ribBands(b, 'hull', A, { r: 0.56, tube: 0.07, from: -2.4, to: 2.4, count: 7, axis: 'z', tseg: 6 });
      b.pop();

      // ── nose cone ───────────────────────────────────────────────────
      b.push(0, 0, -3.05, 0, 0, 0);
        cone(b, 'hull', A, 0.5, 0.65, 6, { rx: Math.PI / 2 });
      b.pop();

      // ── sensor fins (port + starboard) ─────────────────────────────
      b.push(0.9, 0.1, -0.55, 0, 0.2, 0);
        box(b, 'hull', A, 0.7, 0.08, 1.2);
        box(b, 'lights', W, 0.06, 0.04, 0.7);
      b.pop();
      b.push(-0.9, 0.1, -0.55, 0, -0.2, 0);
        box(b, 'hull', A, 0.7, 0.08, 1.2);
        box(b, 'lights', W, 0.06, 0.04, 0.7);
      b.pop();

      // ── dorsal sensor cluster ───────────────────────────────────────
      b.push(0, 0.55, -0.65, 0, 0, 0);
        box(b, 'hull', A, 0.4, 0.15, 0.8);
        lampString(b, 'lights', WC, { ax: -0.14, ay: 0, az: 0, bx: 0.14, by: 0, bz: 0, count: 2, size: 0.06 });
      b.pop();

      // ── stern engine block ──────────────────────────────────────────
      b.push(0, 0, 2.8, 0, 0, 0);
        cyl(b, 'hull', A, 0.42, 0.34, 0.6, 6, { rx: Math.PI / 2 });
        ribBands(b, 'hull', A, { r: 0.47, tube: 0.06, from: -0.22, to: 0.22, count: 2, axis: 'z', tseg: 6 });
      b.pop();

      // ── running lights ──────────────────────────────────────────────
      lampString(b, 'lights', WS, { ax: -0.7, ay: 0, az: 3.0, bx: 0.7, by: 0, bz: 3.0, count: 3, size: 0.1 });

      // ── windows on hex flat faces ───────────────────────────────────
      const rF = 0.5 * Math.cos(Math.PI / 6);
      b.push(rF, 0, 0, 0, 0, Math.PI / 2);
          windowRow(b, 'lights', WD, { count: 3, spacing: 0.8, w: 0.18, h: 0.1, d: 0.06, x: 0, y: 0, z: 0, axis: 'z' });
      b.pop();
      b.push(-rF, 0, 0, 0, 0, -Math.PI / 2);
          windowRow(b, 'lights', WD, { count: 3, spacing: 0.8, w: 0.18, h: 0.1, d: 0.06, x: 0, y: 0, z: 0, axis: 'z' });
      b.pop();

      // ── detail boxes to reach hull count ───────────────────────────
      b.push(0, 0, 0.5, 0, 0, 0);
        box(b, 'hull', G, 0.5, 0.22, 0.5);
      b.pop();
      b.push(0, 0, -0.5, 0, 0, 0);
        box(b, 'hull', G, 0.45, 0.2, 0.45);
      b.pop();
      b.push(0, 0, 0, 0, 0, 0);
        panelPatches(b, 'hull', PA, { r: 0.52, from: -1.6, to: 1.7, count: 8, seed: 102, w: 0.45, h: 0.35, t: 0.1, axis: 'z' });
      b.pop();
    },
  },

  /**
   * CUTTER — medium survey craft with assay equipment.
   * Contract: x ≤ 1.8 | y ≤ 1.2 | z ≤ 5.0 | radius 3.0–5.0
   * Hull: 4,000–16,000 verts. Lights: 260 – 25% of hull.
   */
  cutter: {
    glowZ: 2.9,
    build(b, st) {
      const G = st.hull;
      const GW = weather(G, 1);
      const A = st.trim;
      const AW = weather(A, 1);
      const W = 0xffffff;
      const WS = 0xfff2d8;
      const WD = 0xe8dcc8;
      const WC = 0xe8f0ff;
      const PG = [G, GW];

      // ── main hex spine ──────────────────────────────────────────────
      b.push(0, 0, 0.15, 0, 0, 0);
        cyl(b, 'hull', G, 0.65, 0.65, 5.3, 6, { rx: Math.PI / 2 });
        panelSkin(b, 'hull', PG, { r: 0.65, from: -2.4, to: 2.25, rows: 5, cols: 11, seed: 201, t: 0.14, axis: 'z' });
        ribBands(b, 'hull', A, { r: 0.72, tube: 0.09, from: -2.2, to: 2.05, count: 3, axis: 'z', tseg: 6 });
      b.pop();

      // ── nose wedge ─────────────────────────────────────────────────
      b.push(0, 0, -2.9, 0, 0, 0);
        cone(b, 'hull', A, 0.65, 0.95, 6, { rx: Math.PI / 2 });
      b.pop();

      // ── ventral assay probe arm ─────────────────────────────────────
      b.push(0, -0.6, -2.45, 0, 0, 0);
        box(b, 'hull', A, 0.38, 0.22, 1.1);
        pipeRun(b, 'hull', A, { ax: 0, ay: 0.12, az: -0.45, bx: 0, by: 0.12, bz: 0.45, r: 0.05, seg: 6, collars: 2 });
      b.pop();
      b.push(0, -0.8, -2.95, 0, 0, 0);
        box(b, 'lights', WC, 0.18, 0.12, 0.35);
      b.pop();

      // ── dorsal module bays ─────────────────────────────────────────
      for (const [i, z] of [-0.85, 0.35, 1.55].entries()) {
        b.push(0, 0.55, z, 0, 0, 0);
          cyl(b, 'hull', A, 0.32, 0.32, 0.9, 6, { rx: Math.PI / 2 });
          panelPatches(b, 'hull', PG, { r: 0.35, from: -0.38, to: 0.38, count: 4, seed: 210 + i, w: 0.45, h: 0.35, t: 0.08, axis: 'z' });
        b.pop();
        b.push(0, 0.87, z, 0, 0, 0);
          antenna(b, 'hull', A, AW, { h: 0.20, r: 0.04, tip: 0.05, dish: 0 });
        b.pop();
      }

      // ── port/starboard sensor arrays ───────────────────────────────
      for (const sx of [-0.85, 0.85]) {
        b.push(sx, 0.22, -0.45, 0, sx > 0 ? 0.22 : -0.22, 0);
          box(b, 'hull', A, 0.95, 0.09, 1.6);
          lampString(b, 'lights', W, { ax: -0.38, ay: 0, az: 0, bx: 0.38, by: 0, bz: 0, count: 2, size: 0.07 });
        b.pop();
        b.push(sx, 0, -1.55, 0, sx > 0 ? 0.22 : -0.22, 0);
          box(b, 'hull', G, 0.42, 0.25, 0.65);
          box(b, 'lights', WD, 0.12, 0.08, 0.35);
        b.pop();
      }

      // ── stern propulsion housing ────────────────────────────────────
      b.push(0, 0, 2.7, 0, 0, 0);
        cyl(b, 'hull', A, 0.54, 0.45, 0.85, 6, { rx: Math.PI / 2 });
        ribBands(b, 'hull', A, { r: 0.59, tube: 0.07, from: -0.32, to: 0.32, count: 2, axis: 'z', tseg: 6 });
      b.pop();

      // ── windows on hull ─────────────────────────────────────────────
      const rF = 0.65 * Math.cos(Math.PI / 6);
      for (let z = -1.8; z <= 1.5; z += 0.9) {
        b.push(rF, 0, z + 0.15, 0, 0, Math.PI / 2);
          windowGrid(b, 'lights', WD, { rows: 1, cols: 2, rowGap: 0.32, colGap: 0.36, w: 0.2, h: 0.14, d: 0.07, x: 0, y: 0, z: 0, axis: 'z' });
        b.pop();
      }

      // ── running lights ─────────────────────────────────────────────
      lampString(b, 'lights', WS, { ax: -1.1, ay: 0, az: 2.8, bx: 1.1, by: 0, bz: 2.8, count: 3, size: 0.13 });
    },
  },

  /**
   * ACE — high-performance survey vessel.
   * Contract: x ≤ 2.2 | y ≤ 1.3 | z ≤ 5.8 | radius 4.4–5.8
   * Hull: 4,000–16,000 verts. Lights: 260 – 25% of hull.
   */
  ace: {
    glowZ: 4.4,
    build(b, st) {
      const G = st.hull;
      const GW = weather(G, 1);
      const A = st.trim;
      const AW = weather(A, 1);
      const W = 0xffffff;
      const WS = 0xfff2d8;
      const WD = 0xe8dcc8;
      const WC = 0xe8f0ff;
      const PG = [G, GW];

      // ── streamlined hex spine along Z ──────────────────────────────
      b.push(0, 0, 0, 0, 0, 0);
        cyl(b, 'hull', G, 0.7, 0.7, 8.5, 6, { rx: Math.PI / 2 });
        panelSkin(b, 'hull', PG, { r: 0.7, from: -3.9, to: 4.2, rows: 6, cols: 12, seed: 301, t: 0.14, axis: 'z' });
        ribBands(b, 'hull', A, { r: 0.78, tube: 0.11, from: -3.7, to: 4.0, count: 4, axis: 'z', tseg: 6 });
      b.pop();

      // ── sharp nose cone ─────────────────────────────────────────────
      b.push(0, 0, -4.5, 0, 0, 0);
        cone(b, 'hull', A, 0.7, 1.0, 6, { rx: Math.PI / 2 });
      b.pop();

      // ── nose sensor cluster ─────────────────────────────────────────
      b.push(0, 0.45, -4.25, 0, 0, 0);
        box(b, 'hull', A, 0.28, 0.14, 0.85);
        box(b, 'lights', WC, 0.15, 0.07, 0.45);
      b.pop();
      b.push(0, -0.35, -4.25, 0, 0, 0);
        box(b, 'hull', A, 0.28, 0.14, 0.85);
        box(b, 'lights', WC, 0.15, 0.07, 0.45);
      b.pop();

      // ── swept sensor fins ───────────────────────────────────────────
      for (const sx of [-0.8, 0.8]) {
        b.push(sx, 0.35, -1.35, 0, sx > 0 ? 0.3 : -0.3, 0);
          box(b, 'hull', A, 1.1, 0.07, 1.6);
          box(b, 'lights', W, 0.07, 0.04, 1.0);
        b.pop();
      }

      // ── dorsal sensor suite — seated on spine ────────────────────
      b.push(0, 0.7, -0.35, 0, 0, 0);
        cyl(b, 'hull', A, 0.38, 0.38, 1.85, 6, { rx: Math.PI / 2 });
        panelPatches(b, 'hull', PG, { r: 0.4, from: -0.8, to: 0.8, count: 5, seed: 305, w: 0.42, h: 0.32, t: 0.07, axis: 'z' });
      b.pop();
      b.push(0, 1.1, -0.35, 0, 0, 0);
        box(b, 'hull', A, 0.22, 0.09, 0.55);
      b.pop();

      // ── side assay modules — touching spine for single mass ─────────
      for (const sx of [-0.72, 0.72]) {
        b.push(sx, 0, 0.85, 0, 0, 0);
          box(b, 'hull', A, 0.55, 0.58, 1.4);
          b.push(0, 0.27, 0, 0, 0, 0);
            windowGrid(b, 'lights', WD, { rows: 1, cols: 2, rowGap: 0.28, colGap: 0.32, w: 0.13, h: 0.1, d: 0.06, x: 0, y: 0, z: 0, axis: 'z' });
          b.pop();
        b.pop();
      }

      // ── stern engine block ──────────────────────────────────────────
      b.push(0, 0, 4.2, 0, 0, 0);
        cyl(b, 'hull', A, 0.6, 0.5, 1.0, 6, { rx: Math.PI / 2 });
        ribBands(b, 'hull', A, { r: 0.65, tube: 0.08, from: -0.42, to: 0.42, count: 2, axis: 'z', tseg: 6 });
      b.pop();

      // ── windows on hull ─────────────────────────────────────────────
      const rF = 0.7 * Math.cos(Math.PI / 6);
      for (let z = -2.5; z <= 2.5; z += 1.1) {
        b.push(rF, 0, z, 0, 0, Math.PI / 2);
          windowRow(b, 'lights', WD, { count: 2, spacing: 0.45, w: 0.18, h: 0.1, d: 0.06, x: 0, y: 0, z: 0, axis: 'z' });
        b.pop();
      }

      // ── running lights ─────────────────────────────────────────────
      lampString(b, 'lights', WS, { ax: -1.1, ay: 0, az: 4.3, bx: 1.1, by: 0, bz: 4.3, count: 3, size: 0.11 });
    },
  },

  /**
   * FREIGHTER — large cargo hauler with assay modules.
   * Contract: x ≤ 2.8 | y ≤ 2.0 | z ≤ 7.4 | radius 4.4–7.2
   * Hull: 6,000–24,000 verts. Lights: 400 – 25% of hull.
   */
  freighter: {
    glowZ: 5.2,
    build(b, st) {
      const G = st.hull;
      const GW = weather(G, 1);
      const A = st.trim;
      const AW = weather(A, 1);
      const W = 0xffffff;
      const WS = 0xfff2d8;
      const WD = 0xe8dcc8;
      const WC = 0xe8f0ff;
      const PG = [G, GW];

      // ── massive central spine along Z ──────────────────────────────
      b.push(0, 0, 0.2, 0, 0, 0);
        cyl(b, 'hull', G, 1.1, 1.1, 10.2, 6, { rx: Math.PI / 2 });
        panelSkin(b, 'hull', PG, { r: 1.1, from: -4.65, to: 4.85, rows: 7, cols: 14, seed: 401, t: 0.16, axis: 'z' });
        ribBands(b, 'hull', A, { r: 1.18, tube: 0.12, from: -4.45, to: 4.65, count: 5, axis: 'z', tseg: 6 });
      b.pop();

      // ── bow section ─────────────────────────────────────────────────
      b.push(0, 0, -5.25, 0, 0, 0);
        cone(b, 'hull', A, 1.1, 1.4, 6, { rx: Math.PI / 2 });
      b.pop();

      // ── broad sensor array on bow ───────────────────────────────────
      b.push(0, 1.05, -4.4, 0, 0, 0);
        box(b, 'hull', A, 1.35, 0.30, 1.15);
        windowGrid(b, 'lights', WC, { rows: 1, cols: 3, rowGap: 0.28, colGap: 0.23, w: 0.15, h: 0.1, d: 0.07, x: 0, y: 0.1, z: 0, axis: 'x' });
      b.pop();
      b.push(0, -0.92, -4.4, 0, 0, 0);
        box(b, 'hull', A, 1.35, 0.30, 1.15);
      b.pop();

      // ── large dorsal module bays ────────────────────────────────────
      for (const [i, z] of [-2.2, 0, 2.2].entries()) {
        b.push(0, 1.0, z, 0, 0, 0);
          cyl(b, 'hull', A, 0.58, 0.58, 1.7, 6, { rx: Math.PI / 2 });
          panelPatches(b, 'hull', PG, { r: 0.62, from: -0.75, to: 0.75, count: 6, seed: 410 + i, w: 0.65, h: 0.52, t: 0.09, axis: 'z' });
          ribBands(b, 'hull', A, { r: 0.66, tube: 0.08, from: -0.62, to: 0.62, count: 2, axis: 'z', tseg: 6 });
        b.pop();
        b.push(0, 1.58, z, 0, 0, 0);
          antenna(b, 'hull', A, AW, { h: 0.20, r: 0.04, tip: 0.06, dish: 0 });
        b.pop();
      }

      // ── side cargo/assay drums ──────────────────────────────────────
      for (const sx of [-1.60, 1.60]) {
        for (const z of [-1.55, 0.75]) {
          b.push(sx, 0.25, z, 0, 0, 0);
            cyl(b, 'hull', A, 0.48, 0.48, 1.4, 6, { rx: Math.PI / 2 });
            panelPatches(b, 'hull', PG, { r: 0.52, from: -0.58, to: 0.58, count: 5, seed: 420 + Math.abs(sx * 10 + z) | 0, w: 0.58, h: 0.45, t: 0.08, axis: 'z' });
          b.pop();
        }

        // sensor fins
        b.push(sx, 0, -2.8, 0, sx > 0 ? 0.22 : -0.22, 0);
          box(b, 'hull', A, 1.35, 0.11, 2.3);
          lampString(b, 'lights', W, { ax: -0.55, ay: 0, az: 0, bx: 0.55, by: 0, bz: 0, count: 2, size: 0.09 });
        b.pop();
      }

      // ── ventral assay equipment ─────────────────────────────────────
      b.push(0, -1.32, -3.0, 0, 0, 0);
        box(b, 'hull', A, 0.98, 0.40, 1.7);
        pipeRun(b, 'hull', A, { ax: -0.32, ay: 0.2, az: -0.6, bx: 0.32, by: 0.2, bz: 0.6, r: 0.07, seg: 6, collars: 2 });
      b.pop();

      // ── stern propulsion ────────────────────────────────────────────
      b.push(0, 0, 5.1, 0, 0, 0);
        cyl(b, 'hull', A, 0.9, 0.78, 1.6, 6, { rx: Math.PI / 2 });
        ribBands(b, 'hull', A, { r: 0.95, tube: 0.1, from: -0.65, to: 0.65, count: 2, axis: 'z', tseg: 6 });
      b.pop();

      // ── windows on hull ─────────────────────────────────────────────
      const rF = 1.1 * Math.cos(Math.PI / 6);
      for (let z = -3.7; z <= 3.5; z += 1.3) {
        b.push(rF, 0, z + 0.2, 0, 0, Math.PI / 2);
          windowGrid(b, 'lights', WD, { rows: 1, cols: 2, rowGap: 0.38, colGap: 0.42, w: 0.22, h: 0.16, d: 0.08, x: 0, y: 0, z: 0, axis: 'z' });
        b.pop();
      }

      // ── running lights ─────────────────────────────────────────────
      lampString(b, 'lights', WS, { ax: -2.0, ay: 0, az: 5.0, bx: 2.0, by: 0, bz: 5.0, count: 4, size: 0.15 });
    },
  },

  /**
   * HEAVY — large armored survey and analysis vessel.
   * Contract: x ≤ 3.6 | y ≤ 2.4 | z ≤ 8.8 | radius 6.0–9.0
   * Hull: 7,000–28,000 verts. Lights: 460 – 25% of hull.
   */
  heavy: {
    glowZ: 6.5,
    build(b, st) {
      const G = st.hull;
      const GW = weather(G, 1);
      const A = st.trim;
      const AW = weather(A, 1);
      const W = 0xffffff;
      const WS = 0xfff2d8;
      const WD = 0xe8dcc8;
      const WC = 0xe8f0ff;
      const PG = [G, GW];

      // ── armored hex spine ───────────────────────────────────────────
      b.push(0, 0, 0.1, 0, 0, 0);
        cyl(b, 'hull', G, 1.4, 1.4, 12.5, 6, { rx: Math.PI / 2 });
        panelSkin(b, 'hull', PG, { r: 1.4, from: -5.8, to: 6.5, rows: 8, cols: 16, seed: 501, t: 0.18, axis: 'z' });
        ribBands(b, 'hull', A, { r: 1.48, tube: 0.13, from: -5.6, to: 6.3, count: 6, axis: 'z', tseg: 6 });
      b.pop();

      // ── armored prow ────────────────────────────────────────────────
      b.push(0, 0, -6.35, 0, 0, 0);
        cone(b, 'hull', A, 1.4, 1.4, 6, { rx: Math.PI / 2 });
      b.pop();

      // ── command bridge (flattened, low Y) ───────────────────────────
      b.push(0, 1.05, -5.25, 0, 0, 0);
        box(b, 'hull', A, 1.5, 0.35, 1.3);
        windowGrid(b, 'lights', WC, { rows: 1, cols: 3, rowGap: 0.28, colGap: 0.23, w: 0.17, h: 0.11, d: 0.07, x: 0, y: 0.1, z: 0.2, axis: 'x' });
      b.pop();
      b.push(0, 1.45, -5.25, 0, 0, 0);
        box(b, 'hull', A, 0.4, 0.16, 0.48);
      b.pop();

      // ── large dorsal superstructure towers ──────────────────────────
      for (const [i, z] of [-3.2, -0.8, 1.6, 4.2].entries()) {
        b.push(0, 1.20, z, 0, 0, 0);
          cyl(b, 'hull', A, 0.7, 0.7, 1.8, 6, { rx: Math.PI / 2 });
          panelPatches(b, 'hull', PG, { r: 0.74, from: -0.78, to: 0.78, count: 7, seed: 510 + i, w: 0.78, h: 0.6, t: 0.1, axis: 'z' });
          ribBands(b, 'hull', A, { r: 0.78, tube: 0.09, from: -0.68, to: 0.68, count: 2, axis: 'z', tseg: 6 });
        b.pop();
        b.push(0, 1.95, z, 0, 0, 0);
          antenna(b, 'hull', A, AW, { h: 0.35, r: 0.05, tip: 0.09, dish: 0 });
        b.pop();
      }

      // ── side module complexes ───────────────────────────────────────
      for (const sx of [-2.0, 2.0]) {
        for (const z of [-2.4, 0, 2.4]) {
          b.push(sx, 0.35, z, 0, 0, 0);
            cyl(b, 'hull', A, 0.65, 0.65, 1.5, 6, { rx: Math.PI / 2 });
            panelPatches(b, 'hull', PG, { r: 0.69, from: -0.62, to: 0.62, count: 6, seed: 530 + (sx * 5 + z * 3 | 0), w: 0.65, h: 0.5, t: 0.09, axis: 'z' });
          b.pop();
        }

        // large sensor fins
        b.push(sx, 0, -3.5, 0, sx > 0 ? 0.18 : -0.18, 0);
          box(b, 'hull', A, 1.7, 0.12, 2.55);
          lampString(b, 'lights', W, { ax: -0.72, ay: 0, az: 0, bx: 0.72, by: 0, bz: 0, count: 3, size: 0.1 });
        b.pop();

        // ventral access
        b.push(sx, -1.0, 0.55, 0, 0, 0);
          box(b, 'hull', A, 0.95, 0.3, 1.32);
          b.push(0, -0.14, 0, 0, 0, 0);
            ladder(b, 'hull', A, { x: 0, y: 0, z: 0.35, h: 0.65, w: 0.27, rungs: 2, ry: Math.PI / 2 });
          b.pop();
        b.pop();
      }

      // ── ventral assay complex ───────────────────────────────────────
      b.push(0, -1.42, -3.5, 0, 0, 0);
        box(b, 'hull', A, 1.3, 0.36, 1.95);
        windowGrid(b, 'lights', WD, { rows: 1, cols: 3, rowGap: 0.32, colGap: 0.23, w: 0.19, h: 0.12, d: 0.07, x: 0, y: 0.1, z: 0, axis: 'x' });
        pipeRun(b, 'hull', A, { ax: -0.48, ay: 0.17, az: -0.72, bx: 0.48, by: 0.17, bz: 0.72, r: 0.08, seg: 6, collars: 3 });
      b.pop();

      // ── stern propulsion cluster ────────────────────────────────────
      b.push(0, 0, 5.85, 0, 0, 0);
        cyl(b, 'hull', A, 1.15, 1.02, 1.75, 6, { rx: Math.PI / 2 });
        ribBands(b, 'hull', A, { r: 1.21, tube: 0.12, from: -0.72, to: 0.72, count: 2, axis: 'z', tseg: 6 });
      b.pop();

      // ── windows on hull ─────────────────────────────────────────────
      const rF = 1.4 * Math.cos(Math.PI / 6);
      for (let z = -5.2; z <= 5.0; z += 1.4) {
        b.push(rF, 0, z + 0.1, 0, 0, Math.PI / 2);
          windowGrid(b, 'lights', WD, { rows: 1, cols: 2, rowGap: 0.33, colGap: 0.37, w: 0.24, h: 0.16, d: 0.08, x: 0, y: 0, z: 0, axis: 'z' });
        b.pop();
      }

      // ── running lights ─────────────────────────────────────────────
      lampString(b, 'lights', WS, { ax: -2.85, ay: 0, az: 5.95, bx: 2.85, by: 0, bz: 5.95, count: 5, size: 0.17 });
    },
  },

  /**
   * FRIGATE — massive flagship survey vessel.
   * Contract: x ≤ 9.0 | y ≤ 6.0 | z ≤ 26.0 | radius 21.0–32.0
   * Hull: 15,000–60,000 verts. Lights: 900 – 25% of hull.
   */
  frigate: {
    glowZ: 17.0,
    build(b, st) {
      const G = st.hull;
      const GW = weather(G, 1);
      const A = st.trim;
      const AW = weather(A, 1);
      const W = 0xffffff;
      const WS = 0xfff2d8;
      const WD = 0xe8dcc8;
      const WC = 0xe8f0ff;
      const PG = [G, GW];

      // ── enormous hex spine along Z ──────────────────────────────────
      b.push(0, 0, 0, 0, 0, 0);
        cyl(b, 'hull', G, 4.5, 4.5, 42.0, 6, { rx: Math.PI / 2 });
        panelSkin(b, 'hull', PG, { r: 4.5, from: -19.5, to: 21.5, rows: 11, cols: 22, seed: 601, t: 0.22, axis: 'z' });
        ribBands(b, 'hull', A, { r: 4.6, tube: 0.16, from: -19.2, to: 21.2, count: 8, axis: 'z', tseg: 6 });
      b.pop();

      // ── massive prow structure ──────────────────────────────────────
      b.push(0, 0, -21.5, 0, 0, 0);
        cone(b, 'hull', A, 4.5, 1.6, 6, { rx: Math.PI / 2 });
      b.pop();

      // ── command bridge complex ──────────────────────────────────────
      b.push(0, 5.5, -19.2, 0, 0, 0);
        box(b, 'hull', A, 3.8, 0.9, 2.7);
        windowGrid(b, 'lights', WC, { rows: 1, cols: 5, rowGap: 0.33, colGap: 0.3, w: 0.22, h: 0.14, d: 0.07, x: 0, y: 0.2, z: 0.55, axis: 'x' });
      b.pop();
      b.push(0, 5.8, -19.2, 0, 0, 0);
        box(b, 'hull', A, 0.72, 0.32, 0.78);
      b.pop();

      // ── dorsal assay towers ─────────────────────────────────────────
      const towerZ = [-15.2, -9.8, -4.2, 2.0, 7.8, 13.5];
      for (const [i, z] of towerZ.entries()) {
        b.push(0, 4.0, z, 0, 0, 0);
          cyl(b, 'hull', A, 1.2, 1.2, 3.1, 6, { rx: Math.PI / 2 });
          panelPatches(b, 'hull', PG, { r: 1.26, from: -1.35, to: 1.35, count: 12, seed: 610 + i, w: 1.28, h: 0.96, t: 0.14, axis: 'z' });
          ribBands(b, 'hull', A, { r: 1.32, tube: 0.12, from: -1.2, to: 1.2, count: 2, axis: 'z', tseg: 6 });
        b.pop();
        b.push(0, 5.5, z, 0, 0, 0);
          antenna(b, 'hull', A, AW, { h: 0.40, r: 0.06, tip: 0.08, dish: 0 });
        b.pop();
      }

      // ── side module complexes ───────────────────────────────────────
      for (const sx of [-6.5, 6.5]) {
        for (const [i, z] of [-13.8, -6.4, 1.6, 8.2].entries()) {
          b.push(sx, 1.1, z, 0, 0, 0);
            cyl(b, 'hull', A, 1.05, 1.05, 2.8, 6, { rx: Math.PI / 2 });
            panelPatches(b, 'hull', PG, { r: 1.1, from: -1.25, to: 1.25, count: 10, seed: 650 + i + (sx < 0 ? 10 : 0), w: 1.1, h: 0.85, t: 0.13, axis: 'z' });
            ribBands(b, 'hull', A, { r: 1.15, tube: 0.11, from: -1.1, to: 1.1, count: 2, axis: 'z', tseg: 6 });
          b.pop();
        }

        // large sensor arrays
        b.push(sx, 0, -15.5, 0, sx > 0 ? 0.15 : -0.15, 0);
          box(b, 'hull', A, 2.95, 0.17, 4.2);
          lampString(b, 'lights', W, { ax: -1.25, ay: 0, az: 0, bx: 1.25, by: 0, bz: 0, count: 3, size: 0.11 });
        b.pop();

        // ventral structures
        b.push(sx, -3.1, -5.2, 0, 0, 0);
          box(b, 'hull', A, 1.8, 0.58, 2.55);
        b.pop();
      }

      // ── central dorsal superstructure — directly on spine ────────
      b.push(0, 5.0, -8.0, 0, 0, 0);
        box(b, 'hull', A, 4.5, 0.82, 8.5);
      b.pop();

      // ── ventral assay complex ───────────────────────────────────────
      b.push(0, -5.2, -14.0, 0, 0, 0);
        box(b, 'hull', A, 3.1, 0.98, 3.85);
        windowGrid(b, 'lights', WD, { rows: 1, cols: 4, rowGap: 0.45, colGap: 0.30, w: 0.24, h: 0.16, d: 0.07, x: 0, y: 0.25, z: 0, axis: 'x' });
        pipeRun(b, 'hull', A, { ax: -1.2, ay: 0.45, az: -1.48, bx: 1.2, by: 0.45, bz: 1.48, r: 0.12, seg: 6, collars: 4 });
      b.pop();

      // ── stern propulsion cluster ────────────────────────────────────
      b.push(0, 0, 19.8, 0, 0, 0);
        cyl(b, 'hull', A, 3.5, 3.1, 3.3, 6, { rx: Math.PI / 2 });
        ribBands(b, 'hull', A, { r: 3.58, tube: 0.15, from: -1.48, to: 1.48, count: 2, axis: 'z', tseg: 6 });
      b.pop();

      // ── running lights — within hull envelope ───────────────────────
      // Limit x to ±4.0 so all lamps stay within main spine r=4.5
      lampString(b, 'lights', WS, { ax: -4.0, ay: 0, az: 20.4, bx: 4.0, by: 0, bz: 20.4, count: 5, size: 0.22 });
      lampString(b, 'lights', WS, { ax: -4.0, ay: 0, az: 20.0, bx: 4.0, by: 0, bz: 20.0, count: 5, size: 0.19 });

      // ── side hull windows — on the ventral assay complex face ────────
      // Box at (0, -5.2, -14.0) is 3.1 wide × 0.98 tall × 3.85 deep.
      // Windows on the +X face at x=1.55, within the box boundary.
      b.push(0, -5.2, -12.3, 0, 0, 0);
        windowGrid(b, 'lights', WD, { rows: 2, cols: 3, rowGap: 0.32, colGap: 0.9, w: 0.22, h: 0.16, d: 0.07, x: 0, y: 0.28, z: 0, axis: 'z' });
      b.pop();
      b.push(0, -5.2, -15.7, 0, 0, 0);
        windowGrid(b, 'lights', WD, { rows: 2, cols: 3, rowGap: 0.32, colGap: 0.9, w: 0.22, h: 0.16, d: 0.07, x: 0, y: 0.28, z: 0, axis: 'z' });
      b.pop();

      // ── side module windows — on module bays (seated on hull cylinders) ─
      for (const sx of [-6.5, 6.5]) {
        for (const z of [-13.8, -6.4, 1.6, 8.2]) {
          // Place window on the +Y face of each module bay cyl (r=1.05, top at y=1.1+1.05=2.15)
          b.push(sx, 2.15, z, 0, 0, 0);
            windowRow(b, 'lights', WD, { count: 2, spacing: 0.65, w: 0.2, h: 0.14, d: 0.07, x: 0, y: 0, z: 0, axis: 'z' });
          b.pop();
        }
      }
    },
  },
};
