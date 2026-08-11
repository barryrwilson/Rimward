/**
 * Assembly Probe-Foundry ships — descendants of an ancient self-replicating probe.
 * Faction character: recursive self-assembly at multiple scales, with antenna
 * forests, daughter pods, and structural trusses connecting cells.
 *
 * Round-2 reshape: cell height reduced (0.6 base), lateral radiator fins added,
 * circular ribBands replaced with flat girder caps — cells now read WIDE not round.
 *
 * Channel contract: exactly 'hull' and 'lights', no third channel.
 * Hull colours come ONLY from st.* roles through weather(hex, 0..3).
 * Lights are near-whites (sRGB channels >= 0.6) and live ONLY in lights channel.
 */

import {
  weather, box, cyl, torus, cone,
  ribBands, windowGrid, portholeRing, truss, antenna,
} from '../station-detail.js';

// ---------- Recursive Assembly Cell ----------
/**
 * One Assembly module cell at any scale.
 * width=2.0, height=0.6 — wide-beam, low-profile hull (3.3:1 ratio).
 * Flat girder caps replace the old circular ribBands that made X span = Y span.
 * Lateral radiator fins extend X without growing Y.
 */
function assemblyCell(b, st, {
  width    = 2.0,   // cell X span (beam)
  height   = 0.6,   // cell Y span (height) — much smaller than width
  depth    = 2.0,   // cell Z span
  detail   = 1,
  hasOptic = false,
}) {
  const scale = detail;
  const rw = width  * scale;
  const rh = height * scale;
  const rd = depth  * scale;

  // Colours
  const hullWeathered   = weather(st.hull,     1);
  const hullDim         = weather(st.hull,     2);
  const darkWeathered   = weather(st.hullDark, 1);
  const darkDim         = weather(st.hullDark, 2);
  const trimWeathered   = weather(st.trim,     1);
  const accentDim       = weather(st.accent,   2);
  const warmWhite       = 0xfff2d8;
  const coolWhite       = 0xe8f0ff;

  const ribThick  = 0.14 * scale;
  const bandThick = 0.12 * scale;

  // ── Main body box ─────────────────────────────────────────────────────────
  box(b, 'hull', hullWeathered, rw, rh, rd);

  // 12 dark edge ribs — structural frame
  // bottom
  box(b, 'hull', darkWeathered, rw + ribThick * 2, ribThick, ribThick, { x: 0, y: -rh / 2 - ribThick / 2, z: -rd / 2 - ribThick / 2 });
  box(b, 'hull', darkWeathered, rw + ribThick * 2, ribThick, ribThick, { x: 0, y: -rh / 2 - ribThick / 2, z:  rd / 2 + ribThick / 2 });
  box(b, 'hull', darkWeathered, ribThick, ribThick, rd + ribThick * 2, { x: -rw / 2 - ribThick / 2, y: -rh / 2 - ribThick / 2, z: 0 });
  box(b, 'hull', darkWeathered, ribThick, ribThick, rd + ribThick * 2, { x:  rw / 2 + ribThick / 2, y: -rh / 2 - ribThick / 2, z: 0 });
  // top
  box(b, 'hull', darkWeathered, rw + ribThick * 2, ribThick, ribThick, { x: 0, y:  rh / 2 + ribThick / 2, z: -rd / 2 - ribThick / 2 });
  box(b, 'hull', darkWeathered, rw + ribThick * 2, ribThick, ribThick, { x: 0, y:  rh / 2 + ribThick / 2, z:  rd / 2 + ribThick / 2 });
  box(b, 'hull', darkWeathered, ribThick, ribThick, rd + ribThick * 2, { x: -rw / 2 - ribThick / 2, y:  rh / 2 + ribThick / 2, z: 0 });
  box(b, 'hull', darkWeathered, ribThick, ribThick, rd + ribThick * 2, { x:  rw / 2 + ribThick / 2, y:  rh / 2 + ribThick / 2, z: 0 });
  // vertical
  box(b, 'hull', darkWeathered, ribThick, rh + ribThick * 2, ribThick, { x: -rw / 2 - ribThick / 2, y: 0, z: -rd / 2 - ribThick / 2 });
  box(b, 'hull', darkWeathered, ribThick, rh + ribThick * 2, ribThick, { x:  rw / 2 + ribThick / 2, y: 0, z: -rd / 2 - ribThick / 2 });
  box(b, 'hull', darkWeathered, ribThick, rh + ribThick * 2, ribThick, { x: -rw / 2 - ribThick / 2, y: 0, z:  rd / 2 + ribThick / 2 });
  box(b, 'hull', darkWeathered, ribThick, rh + ribThick * 2, ribThick, { x:  rw / 2 + ribThick / 2, y: 0, z:  rd / 2 + ribThick / 2 });

  // ── Flat girder caps (replaces circular ribBands) ─────────────────────────
  // Wide flat strips at bow/stern ends. Extend X slightly, add NO Y beyond ribs.
  // accentDim = weathered teal (faction maintenance-band colour).
  const gw = rw + 0.22 * scale;   // 0.11*scale beyond body on each side in X
  const gh = bandThick;
  const gd = bandThick;
  box(b, 'hull', accentDim, gw, gh, gd, { x: 0, y:  rh / 2 + gh / 2, z: -rd / 2 - gd / 2 });
  box(b, 'hull', accentDim, gw, gh, gd, { x: 0, y:  rh / 2 + gh / 2, z:  rd / 2 + gd / 2 });
  box(b, 'hull', accentDim, gw, gh, gd, { x: 0, y: -rh / 2 - gh / 2, z: -rd / 2 - gd / 2 });
  box(b, 'hull', accentDim, gw, gh, gd, { x: 0, y: -rh / 2 - gh / 2, z:  rd / 2 + gd / 2 });
  // Faded-orange (trim) maintenance band — long run along mid-Z top and bottom
  box(b, 'hull', trimWeathered, rw + 0.06 * scale, gh * 0.8, rd * 0.52,
      { x: 0, y:  rh / 2 + gh * 0.4, z: 0 });
  box(b, 'hull', trimWeathered, rw + 0.06 * scale, gh * 0.8, rd * 0.52,
      { x: 0, y: -rh / 2 - gh * 0.4, z: 0 });

  // ── Lateral radiator fins (extend X, NO Y growth) ─────────────────────────
  // Thin flat plates on each flank — the Assembly wide-beam silhouette.
  const finW = 0.15 * scale;
  const finH = rh * 0.55;
  const finZ = rd - 0.28 * scale;
  box(b, 'hull', hullDim,   finW, finH, finZ, { x: -(rw / 2 + finW / 2), y: 0, z: 0 });
  box(b, 'hull', hullDim,   finW, finH, finZ, { x:  (rw / 2 + finW / 2), y: 0, z: 0 });
  // Teal accent stripe on each fin
  box(b, 'hull', accentDim, finW * 0.65, finH * 0.22, finZ * 0.62,
      { x: -(rw / 2 + finW / 2), y: finH * 0.26, z: 0 });
  box(b, 'hull', accentDim, finW * 0.65, finH * 0.22, finZ * 0.62,
      { x:  (rw / 2 + finW / 2), y: finH * 0.26, z: 0 });

  // ── Front face (−Z): raised panel tiles ───────────────────────────────────
  const tileW = rw * 0.34;
  const tileH = rh * 0.44;
  const tileD = 0.14 * scale;
  box(b, 'hull', hullDim, tileW, tileH, tileD, { x: -rw * 0.22, y:  rh * 0.16, z: -rd / 2 - tileD / 2 });
  box(b, 'hull', hullDim, tileW, tileH, tileD, { x:  rw * 0.22, y:  rh * 0.16, z: -rd / 2 - tileD / 2 });
  box(b, 'hull', hullDim, tileW, tileH, tileD, { x: -rw * 0.22, y: -rh * 0.09, z: -rd / 2 - tileD / 2 });
  box(b, 'hull', hullDim, tileW, tileH, tileD, { x:  rw * 0.22, y: -rh * 0.09, z: -rd / 2 - tileD / 2 });

  // Front windows
  windowGrid(b, 'lights', warmWhite, {
    rows: 1, cols: 2,
    rowGap: 0.12 * scale, colGap: 0.12 * scale,
    w: 0.22 * scale, h: 0.16 * scale, d: 0.14 * scale,
    x: 0, y: rh * 0.30, z: -rd / 2 - 0.08,
    axis: 'x',
  });

  // ── Bow sensor optic (teal) ───────────────────────────────────────────────
  if (hasOptic) {
    const opticR = 0.36 * scale;
    portholeRing(b, 'hull', darkWeathered, { r: opticR + 0.07, count: 4, size: 0.09 * scale, y: 0, tilt: 0, seg: 6 });
    cyl(b, 'lights', coolWhite, opticR * 0.55, opticR * 0.55, 0.18 * scale, 8, { x: 0, y: 0, z: -rd / 2 - 0.12, rx: Math.PI / 2 });
    torus(b, 'hull', trimWeathered, opticR + 0.1, 0.05 * scale, 8, 6, Math.PI * 2, { x: 0, y: 0, z: -rd / 2 - 0.10 });
  }

  // ── Rear face (+Z) ────────────────────────────────────────────────────────
  windowGrid(b, 'lights', warmWhite, {
    rows: 1, cols: 2,
    rowGap: 0.10 * scale, colGap: 0.10 * scale,
    w: 0.20 * scale, h: 0.14 * scale, d: 0.12 * scale,
    x: 0, y: rh * 0.10, z: rd / 2 + 0.08,
    axis: 'x',
  });
  box(b, 'lights', coolWhite, 0.20 * scale, 0.15 * scale, 0.10 * scale, { x: 0, y: -rh * 0.22, z: rd / 2 + 0.07 });

  // ── Side cooling vents (non-rotated — no X blowout) ───────────────────────
  for (let i = 0; i < 3; i++) {
    const vy = -rh * 0.06 + i * 0.14 * scale;
    box(b, 'hull', darkDim, 0.06 * scale, 0.07 * scale, rd * 0.20, { x: -(rw / 2 + 0.03 * scale), y: vy, z: 0 });
    box(b, 'hull', darkDim, 0.06 * scale, 0.07 * scale, rd * 0.20, { x:  (rw / 2 + 0.03 * scale), y: vy, z: 0 });
  }

  // Side windows
  windowGrid(b, 'lights', warmWhite, {
    rows: 1, cols: 2,
    rowGap: 0.10 * scale, colGap: 0.10 * scale,
    w: 0.18 * scale, h: 0.13 * scale, d: 0.09 * scale,
    x: -rw / 2 - 0.07, y: rh * 0.08, z: 0,
    axis: 'z', ry: Math.PI / 2,
  });
  windowGrid(b, 'lights', warmWhite, {
    rows: 1, cols: 2,
    rowGap: 0.10 * scale, colGap: 0.10 * scale,
    w: 0.18 * scale, h: 0.13 * scale, d: 0.09 * scale,
    x:  rw / 2 + 0.07, y: rh * 0.08, z: 0,
    axis: 'z', ry: Math.PI / 2,
  });

  // ── Top hatch + collar ────────────────────────────────────────────────────
  box(b, 'hull', accentDim, 0.35 * scale, 0.07 * scale, 0.35 * scale, { x: 0, y: rh / 2 + 0.05, z: 0 });
  cyl(b, 'hull', darkWeathered, 0.15 * scale, 0.15 * scale, 0.25 * scale, 7, { x: 0, y: rh / 2 + 0.18, z: 0 });
  cyl(b, 'lights', coolWhite,   0.10 * scale, 0.10 * scale, 0.07 * scale, 7, { x: 0, y: rh / 2 + 0.34, z: 0 });

  // ── Extra hull panel density (keeps lights ≤ 25 % of hull after ribBands removal) ──
  // Rear face panel tiles — mirror of front
  box(b, 'hull', hullDim, tileW, tileH, tileD, { x: -rw * 0.22, y:  rh * 0.16, z: rd / 2 + tileD / 2 });
  box(b, 'hull', hullDim, tileW, tileH, tileD, { x:  rw * 0.22, y:  rh * 0.16, z: rd / 2 + tileD / 2 });
  box(b, 'hull', hullDim, tileW, tileH, tileD, { x: -rw * 0.22, y: -rh * 0.09, z: rd / 2 + tileD / 2 });
  box(b, 'hull', hullDim, tileW, tileH, tileD, { x:  rw * 0.22, y: -rh * 0.09, z: rd / 2 + tileD / 2 });
  // Top deck service panels — at body surface, no Y blowout
  box(b, 'hull', darkWeathered, rw * 0.22, 0.06 * scale, rd * 0.24, { x:  0,        y: rh / 2, z: -rd * 0.28 });
  box(b, 'hull', darkWeathered, rw * 0.22, 0.06 * scale, rd * 0.24, { x:  0,        y: rh / 2, z:  rd * 0.28 });
  box(b, 'hull', hullDim,       rw * 0.15, 0.04 * scale, rd * 0.18, { x: -rw * 0.32, y: rh / 2, z: 0 });
  box(b, 'hull', hullDim,       rw * 0.15, 0.04 * scale, rd * 0.18, { x:  rw * 0.32, y: rh / 2, z: 0 });
  // Side recessed service panels — flush with body surface, no X blowout
  box(b, 'hull', darkDim, 0.08 * scale, rh * 0.42, rd * 0.28, { x: -(rw / 2 - 0.04 * scale), y: 0, z: -rd * 0.30 });
  box(b, 'hull', darkDim, 0.08 * scale, rh * 0.42, rd * 0.28, { x:  (rw / 2 - 0.04 * scale), y: 0, z: -rd * 0.30 });
  box(b, 'hull', darkDim, 0.08 * scale, rh * 0.42, rd * 0.28, { x: -(rw / 2 - 0.04 * scale), y: 0, z:  rd * 0.30 });
  box(b, 'hull', darkDim, 0.08 * scale, rh * 0.42, rd * 0.28, { x:  (rw / 2 - 0.04 * scale), y: 0, z:  rd * 0.30 });
}

// ---------- Spine Builder ----------
/**
 * Build the ship spine: N cells strung along the Z axis.
 * cellH passed to addAntennaForest so mast push_y is consistent.
 */
function buildSpine(b, st, cellCount, scale, spacing, bowOptic = true) {
  const zStart = -((cellCount - 1) * spacing) / 2;
  for (let i = 0; i < cellCount; i++) {
    const z = zStart + i * spacing;
    b.push(0, 0, z);
    assemblyCell(b, st, {
      width:  2.0,
      height: 0.6,
      depth:  2.0,
      detail: scale,
      hasOptic: bowOptic && (i === 0),
      isDaughter: false,
    });
    b.pop();
  }
}

// ---------- Antenna Forest ----------
/**
 * Masts on alternating interior cells.
 * cellH: unscaled cell height (0.6 for buildSpine cells).
 */
function addAntennaForest(b, st, cellCount, scale, spacing, cellH = 0.6) {
  const zStart = -((cellCount - 1) * spacing) / 2;
  const darkWeathered = weather(st.hullDark, 1);
  const trimWeathered = weather(st.trim,     1);
  const coolWhite     = 0xe8f0ff;

  for (let i = 1; i < cellCount - 1; i++) {
    if (i % 2 !== 1) continue;
    const z    = zStart + i * spacing;
    const topY = (cellH * scale) / 2;   // top of cell body at this scale
    b.push(0, topY, z);
    antenna(b, 'hull', darkWeathered, trimWeathered, {
      x: 0, y: 0, z: 0,
      h: 0.35 * scale, r: 0.06 * scale, tip: 0.12 * scale, dish: 0.20 * scale,
    });
    box(b, 'lights', coolWhite, 0.08 * scale, 0.08 * scale, 0.08 * scale,
        { x: 0, y: 0.37 * scale, z: 0 });
    b.pop();
  }
}

// ---------- Daughter Pods ----------
/**
 * Side-mounted pods touching the spine flank for singleMass connectivity.
 * spineHW = 1.0 * scale matches the new cell half-width (width=2.0).
 * Pod rim (pw + 0.04*scale) stays within the x ceiling at every scale.
 */
function addDaughterPods(b, st, podCount, scale, cellSpacing) {
  const hullWeathered = weather(st.hull,     1);
  const darkWeathered = weather(st.hullDark, 1);
  const accentDim     = weather(st.accent,   2);
  const coolWhite     = 0xe8f0ff;

  const spineHW = 1.0  * scale;   // matches new cell half-width
  const pw      = 0.22 * scale;   // pod width  (X)
  const ph      = 0.28 * scale;   // pod height (Y)
  const pd      = 0.42 * scale;   // pod depth  (Z)
  const offset  = spineHW + pw / 2;   // inner face touches spine

  const halfSpan = ((podCount - 1) / 2) * cellSpacing;
  const step     = podCount > 1 ? (2 * halfSpan) / (podCount - 1) : 0;

  for (let i = 0; i < podCount; i++) {
    const side = (i % 2 === 0) ? 1 : -1;
    const z    = -halfSpan + i * step;
    b.push(side * offset, 0, z);
    box(b, 'hull', hullWeathered, pw, ph, pd);
    box(b, 'hull', darkWeathered, pw + 0.04 * scale, 0.04 * scale, pd + 0.04 * scale,
        { x: 0, y: ph / 2 + 0.02 * scale, z: 0 });
    box(b, 'hull', accentDim, pw * 0.6, 0.03 * scale, pd * 0.6,
        { x: 0, y: -ph / 2 - 0.015 * scale, z: 0 });
    box(b, 'lights', coolWhite, 0.06 * scale, 0.06 * scale, 0.06 * scale,
        { x: 0, y: ph / 2 + 0.05 * scale, z: pd * 0.28 });
    b.pop();
  }
}

// ---------- Spine Truss ----------
function addSpineTruss(b, st, cellCount, scale, spacing) {
  if (cellCount < 3) return;
  const zStart = -((cellCount - 1) * spacing) / 2;
  const darkWeathered = weather(st.hullDark, 1);
  for (let i = 0; i < cellCount - 1; i++) {
    if (i % 2 !== 0) continue;
    const z1 = zStart + i * spacing;
    const z2 = zStart + (i + 1) * spacing;
    truss(b, 'hull', darkWeathered, {
      ax: -0.5 * scale, ay: 0.28 * scale, az: z1 + 0.4 * scale,
      bx: -0.5 * scale, by: 0.28 * scale, bz: z2 - 0.4 * scale,
      thickness: 0.10 * scale, bays: 2, spread: 0.22 * scale,
    });
    truss(b, 'hull', darkWeathered, {
      ax:  0.5 * scale, ay: 0.28 * scale, az: z1 + 0.4 * scale,
      bx:  0.5 * scale, by: 0.28 * scale, bz: z2 - 0.4 * scale,
      thickness: 0.10 * scale, bays: 2, spread: 0.22 * scale,
    });
  }
}

// ---------- EXPORT: Six Class Keys ----------
export const assemblyShip = {

  // Spine: 3 cells × 1.8 spacing, scale 1.1
  // Cell: rw=2.2 → body ±1.10, fin to ±1.265, gird to ±1.21 — all ≤ 1.3 ✓
  // No pods (would push X over 1.3 ceiling). Bow mast kept under abs_y 0.9.
  // Expected: span x≈2.5 y≈1.45 z≈6.1  tooTall: 1.45≤0.75×2.5=1.875 ✓
  light: {
    glowZ: 2.9,
    build(b, st) {
      buildSpine(b, st, 3, 1.1, 1.8, true);
      // Single short mast on top — position just above top hatch cyl (≈0.71)
      const darkWeathered = weather(st.hullDark, 1);
      const trimWeathered = weather(st.trim,     1);
      const coolWhite     = 0xe8f0ff;
      b.push(0, 0.72, 0);
      antenna(b, 'hull', darkWeathered, trimWeathered, {
        x: 0, y: 0, z: 0, h: 0.10, r: 0.045, tip: 0.07, dish: 0.05,
      });
      box(b, 'lights', coolWhite, 0.08, 0.08, 0.08, { x: 0, y: 0.12, z: 0 });
      b.pop();
    },
  },

  // Spine: 4 cells × 2.0 spacing, scale 1.3
  // Expected: span x≈3.0 y≈1.6 z≈9.0  tooTall: 1.6≤0.75×3.0=2.25 ✓
  cutter: {
    glowZ: 4.3,
    build(b, st) {
      buildSpine(b, st, 4, 1.3, 2.0, true);
      addAntennaForest(b, st, 4, 1.3, 2.0, 0.6);
      addDaughterPods(b, st, 2, 1.3, 2.0);
    },
  },

  // Spine: 3 cells × 3.0 spacing, scale 1.5
  // Expected: span x≈3.5 y≈1.9 z≈9.4  tooTall: 1.9≤0.75×3.5=2.625 ✓
  ace: {
    glowZ: 4.5,
    build(b, st) {
      buildSpine(b, st, 3, 1.5, 3.0, true);
      addAntennaForest(b, st, 3, 1.5, 3.0, 0.6);
      addDaughterPods(b, st, 3, 1.5, 3.0);
      // Bow spine mast — stay under abs_y 1.3 ceiling
      // rh/2 = 0.45; top cyl top ≈ 0.96; antenna adds 0.22 above push at 0.78
      const darkWeathered = weather(st.hullDark, 1);
      const trimWeathered = weather(st.trim,     1);
      const coolWhite     = 0xe8f0ff;
      b.push(0, 0.78, -3.0);
      antenna(b, 'hull', darkWeathered, trimWeathered, {
        x: 0, y: 0, z: 0, h: 0.14, r: 0.058, tip: 0.10, dish: 0.18,
      });
      box(b, 'lights', coolWhite, 0.10, 0.10, 0.10, { x: 0, y: 0.16, z: 0 });
      b.pop();
    },
  },

  // Spine: 4 cells × 3.0 spacing, scale 1.8
  // Expected: span x≈4.2 y≈2.2 z≈13.1  tooTall: 2.2≤0.75×4.2=3.15 ✓
  freighter: {
    glowZ: 6.3,
    build(b, st) {
      buildSpine(b, st, 4, 1.8, 3.0, true);
      addAntennaForest(b, st, 4, 1.8, 3.0, 0.6);
      addSpineTruss(b, st, 4, 1.8, 3.0);
      addDaughterPods(b, st, 4, 1.8, 3.0);
    },
  },

  // Spine: 5 cells × 2.8 spacing, scale 2.0
  // Expected: span x≈4.7 y≈2.4 z≈15.8  tooTall: 2.4≤0.75×4.7=3.525 ✓
  heavy: {
    glowZ: 8.0,
    build(b, st) {
      buildSpine(b, st, 5, 2.0, 2.8, true);
      addAntennaForest(b, st, 5, 2.0, 2.8, 0.6);
      addSpineTruss(b, st, 5, 2.0, 2.8);
      addDaughterPods(b, st, 5, 2.0, 2.8);
    },
  },

  // Spine: 10 cells × 4.2 spacing, scale 3.5
  // Bow ring radius 2.8 (tube 0.24) → abs_y from ring = 3.04 ≤ 6.0 ✓
  // Pod offset = 3.5+0.385=3.885, rim to 4.27 → span_x ≈ 8.54 ≥ ring span_y 6.08/0.75=8.11 ✓
  // Expected: span x≈8.5 y≈6.1 z≈48.5  tooTall: 6.1≤0.75×8.5=6.375 ✓
  frigate: {
    glowZ: 22.4,
    build(b, st) {
      buildSpine(b, st, 10, 3.5, 4.2, true);
      addAntennaForest(b, st, 10, 3.5, 4.2, 0.6);
      addSpineTruss(b, st, 10, 3.5, 4.2);
      addDaughterPods(b, st, 8, 3.5, 4.2);

      const darkWeathered   = weather(st.hullDark, 1);
      const accentWeathered = weather(st.accent,   1);

      // Lateral spine trusses connecting fore and aft
      for (let side = -1; side <= 1; side += 2) {
        truss(b, 'hull', darkWeathered, {
          ax: side * 2.5, ay: 1.0, az: -18.9,
          bx: side * 2.5, by: 1.0, bz:  18.9,
          thickness: 0.20, bays: 10, spread: 0.5,
        });
      }

      // Bow sensor ring — radius 2.8 (was 4.0).
      // abs_y = r + tube = 3.04 keeps span_y under 0.75 * span_x from pods.
      b.push(0, 0, -22.4);
      ribBands(b, 'hull', accentWeathered, {
        r: 2.8, from: -0.4, to: 0.4, count: 2, axis: 'z', tube: 0.24, tseg: 10,
      });
      b.pop();

      // Stern engine block
      b.push(0, 0, 22.4);
      box(b, 'hull', darkWeathered, 4.0, 2.8, 2.5, { x: 0, y: 0, z: 1.8 });
      for (let y = -0.8; y <= 0.8; y += 1.6) {
        cone(b, 'hull', darkWeathered, 0.8, 1.5, 7, { x: 0, y, z: 2.2, rx: Math.PI / 2 });
      }
      b.pop();
    },
  },
};
