/**
 * Gilded Chain — "Auction Pavilion", ceremonial orbital station with observation rotunda.
 *
 * Reference art: docs/FactionExamples/05-gilded-chain-station.png
 * Silhouette: broad circular plinth + central ribbed dome + ivory glazed rotunda +
 * slender spire; radial gallery arms around plinth rim; six-pod carousel ring below.
 *
 * Tiers (bottom to top):
 *   0. Belly — vault drums, cargo cradles and keel truss beneath the plinth (y ~ -12 to -5)
 *   1. Plinth — broad black ceramic disc with gold rim, ivory scale skirt,
 *               8 gallery pods + 4 colonnade drums packed around the rim (y ~ -5 to 0)
 *   2. Rotunda — great ivory gallery cylinder, windowed all around with dense
 *               near-white LED grids and turquoise glaze panes behind dark mullions (y ~ 0 to 7)
 *   3. Dome — great ribbed black ceramic dome with gold meridian ribs and
 *             glazed skylight panes (y ~ 7 to 16)
 *   4. Crown — ivory observation rotunda + gold-banded spire + needle finial (y ~ 16 to 26)
 *
 * Ring concept: Observation carousel (ringY -8, radius 16) — six ivory gallery arms
 * on a gold-banded hoop, each a plated pod with glazed turquoise viewing panes
 * (ringGlaze) and near-white rim lamps (ringGlow), spoked to a plated hub.
 *
 * Measured: parts 3878, totalVerts 372960, glowVerts 54672, bbox x -17.1/17.1 y -12.6/25.3 z -17.1/17.1,
 * strays 0, isolated 0.00%, orphanGlow 0.00%, orphanGlaze 0.00%, ringY -8.0.
 */

import {
  rng, weather, box, cyl, sphere, hemi, torus, cone,
  ribBands, windowGrid, portholeRing, panelSkin, truss, railing, bridge,
  airlock, pipeRun, antenna, ladder, lampString, crate,
} from '../station-detail.js';

export const gildedStation = {
  ringY: -8.0,
  build(b, ringB, st) {
    const rand = rng(4504);

    // Base palette — all four FACTION_STYLE bases, deduplicated.
    const BK = st.hull;       // 0x14161a black ceramic (dominant hull)
    const BD = st.hullDark;   // 0x0b0d0e dark shadow ceramic
    const IV = st.trim;       // 0xa09b8a ivory (structural bright)
    const GD = st.accent;     // 0xc9a86a old gold (ribs, rims, trim)
    const W  = weather;

    // Plate arrays — every entry derived from a BASE colour only.
    const P_BK  = [BK, BK, W(BK,1), W(BD,1)];
    const P_IV  = [IV, IV, W(IV,1), W(IV,2)];
    const P_GD  = [GD, W(GD,1), W(GD,2), W(IV,1)];
    const P_MIX = [IV, GD, W(IV,1), W(GD,1), W(BK,1)];

    // Glow tints — all sRGB channels >= 0.6 (multiplied by pulsed glow colour).
    const LIT = 0xffffff;   // pure white
    const LW  = 0xfff2e2;   // warm white
    const LC  = 0xf0f8ff;   // cool white (cyan-adjacent)
    const LD  = 0xe8dcc8;   // dim warm white

    // Glaze tint — dulled turquoise, unlit, never animated.
    const GLZ = 0x2b4a4e;

    // ---------------------------------------------------------------- helpers --

    // Vault drum: bare horizontal drum for belly storage.
    const vaultDrum = ({ x, y, z, r, l, ax = 'x', seed }) => {
      const aX = ax === 'x';
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', BK, r, r, l, 18, aX ? { rz: Math.PI/2 } : { rx: Math.PI/2 });
      panelSkin(b, 'hull', P_BK, { r, from: -l/2+0.8, to: l/2-0.8, rows: 4, cols: 12, seed, t: 0.16, axis: ax });
      ribBands(b, 'hull', GD, { r: r+0.14, tube: 0.16, from: -l/2+1.5, to: l/2-1.5, count: 4, axis: ax, tseg: 18 });
      for (const s of [-1, 1]) {
        cyl(b, 'hull', W(BK,1), r*1.04, r*0.88, 0.9, 18,
          aX ? { x: s*l/2, rz: Math.PI/2 } : { z: s*l/2, rx: Math.PI/2 });
        torus(b, 'hull', GD, r*0.8, 0.1, 5, 16, undefined,
          aX ? { x: s*(l/2+0.5), ry: Math.PI/2 } : { z: s*(l/2+0.5) });
      }
      // Glow strips — per-yaw, seated on hull. H_row=1.0 → depth=sqrt(r²-1)
      const gap = (l - 3) / 8;
      const vDepth = Math.sqrt(r * r - 1.0);
      for (let vi = 0; vi < 2; vi++) {
        const vφ = vi * Math.PI;
        const vClr = vi === 0 ? LW : LD;
        if (aX) {
          b.push(0, 0, 0, vφ, 0, 0);
          windowGrid(b, 'glow', vClr, { rows: 2, cols: 8, rowGap: 1.4, colGap: gap, w: 0.5, h: 0.6, d: 0.45, x: 0, y: 0, z: vDepth, axis: 'x' });
          b.pop();
        } else {
          b.push(0, 0, 0, 0, 0, vφ);
          b.push(0, 0, 0, 0, Math.PI / 2, 0);
          windowGrid(b, 'glow', vClr, { rows: 2, cols: 8, rowGap: 1.4, colGap: gap, w: 0.5, h: 0.6, d: 0.45, x: 0, y: 0, z: vDepth, axis: 'x' });
          b.pop();
          b.pop();
        }
      }
      b.pop();
    };

    // Gallery pod: box pod with glazed front and dense window grids.
    const galleryPod = ({ x, y, z, w, d, h, plates, seed, ry = 0 }) => {
      b.push(x, y, z, 0, ry, 0);
      box(b, 'hull', IV, w, h, d);
      panelSkin(b, 'hull', plates, { r: d/2+0.5, from: -w/2+0.5, to: w/2-0.5, rows: 3, cols: 9, seed, t: 0.14, axis: 'x' });
      ribBands(b, 'hull', GD, { r: d/2+0.12, tube: 0.13, from: -w/2+0.9, to: w/2-0.9, count: 3, axis: 'x', tseg: 16 });
      // Gold trim cornice
      torus(b, 'hull', GD, d/2+0.06, 0.13, 5, 16, undefined, { y: h/2+0.1, rx: Math.PI/2 });
      // Turquoise glaze panes (many small, dark mullions between)
      for (let i = 0; i < 5; i++) {
        box(b, 'glaze', GLZ, (w-1.4)/5*0.78, h*0.44, 0.2,
          { x: -w/2+0.8 + i*(w-1.4)/5 + (w-1.4)/10, y: h*0.05, z: d/2+0.05 });
      }
      for (let i = 0; i <= 5; i++) {
        box(b, 'hull', BD, 0.12, h*0.46, 0.24,
          { x: -w/2+0.7 + i*(w-1.4)/5, y: h*0.05, z: d/2 });
      }
      // Dense glow grids both faces
      windowGrid(b, 'glow', LIT, { rows: 3, cols: 7, rowGap: 0.85, colGap: 0.75, w: 0.44, h: 0.52, d: 0.38, x: 0, y: h*0.07, z: d/2, axis: 'x' });
      windowGrid(b, 'glow', LW,  { rows: 3, cols: 7, rowGap: 0.85, colGap: 0.75, w: 0.44, h: 0.52, d: 0.38, x: 0, y: h*0.07, z: -d/2, axis: 'x' });
      // Rim lamps
      lampString(b, 'glow', LC, { ax: -w/2+0.5, ay: h*0.44, az: d/2-0.45, bx: w/2-0.5, by: h*0.44, bz: d/2-0.45, count: 5, size: 0.2 });
      b.pop();
    };

    // Colonnade drum: cylindrical with ring windows and gold bands.
    const colonnade = ({ x, y, z, r, h, plates, seed }) => {
      b.push(x, y, z, 0, 0, 0);
      cyl(b, 'hull', IV, r, r, h, 24);
      panelSkin(b, 'hull', plates, { r, from: -h/2+0.7, to: h/2-0.7, rows: 5, cols: 22, seed, t: 0.15, axis: 'y' });
      ribBands(b, 'hull', GD, { r: r+0.13, tube: 0.17, from: -h/2+1.1, to: h/2-1.1, count: 4, axis: 'y', tseg: 24 });
      torus(b, 'hull', GD, r*1.08, 0.18, 7, 24, undefined, { y: h/2+0.12, rx: Math.PI/2 });
      torus(b, 'hull', GD, r*0.92, 0.16, 6, 24, undefined, { y: -h/2-0.12, rx: Math.PI/2 });
      // Dense window grids — 12 per-facet, each seated on the hull
      // H_tan=(2-1)*0.7/2+0.48/2=0.59 → depth=sqrt(r²-0.3481)
      {
        const cHtan = 0.59, cDepth = Math.sqrt(r * r - cHtan * cHtan);
        for (let ci = 0; ci < 12; ci++) {
          b.push(0, 0, 0, 0, (ci / 12) * Math.PI * 2, 0);
          windowGrid(b, 'glow', ci % 2 === 0 ? LIT : LW,
            { rows: 3, cols: 2, rowGap: 1.5, colGap: 0.7, w: 0.48, h: 0.62, d: 0.4, x: 0, y: 0, z: cDepth, axis: 'x' });
          b.pop();
        }
      }
      portholeRing(b, 'glow', LD, { r: r*1.01, count: 14, size: 0.3, y: h*0.34, tilt: 0 });
      portholeRing(b, 'glow', LD, { r: r*1.01, count: 14, size: 0.3, y: -h*0.34, tilt: 0 });
      b.pop();
    };

    // ---------------------------------------------------- tier 0: belly vaults --
    vaultDrum({ x: -8, y: -9.2, z: -5, r: 2.8, l: 13, ax: 'x', seed: 4510 });
    vaultDrum({ x:  5, y: -9.6, z:  6, r: 2.6, l: 12, ax: 'z', seed: 4511 });
    vaultDrum({ x: -3, y: -9.0, z:  8, r: 2.4, l: 11, ax: 'x', seed: 4512 });
    vaultDrum({ x: 10, y: -9.4, z: -4, r: 2.5, l: 12, ax: 'z', seed: 4513 });

    // Keel truss grid
    truss(b, 'hull', BD, { ax: -13, ay: -12, az: 0, bx: 13, by: -12, bz: 0, bays: 8, thickness: 0.3, spread: 1.1 });
    truss(b, 'hull', BD, { ax: 0, ay: -12, az: -9, bx: 0, by: -12, bz: 9, bays: 6, thickness: 0.26, spread: 0.9 });

    // Cargo cradles
    for (const [cx, cz, seed] of [[-9,-5,4514],[8,7,4515],[-3,9,4516],[11,-3,4517]]) {
      b.push(cx, -11, cz, 0, 0, 0);
      cyl(b, 'hull', W(BK,1), 1.7, 1.7, 3.2, 12);
      ribBands(b, 'hull', GD, { r: 1.76, tube: 0.13, from: -1.3, to: 1.3, count: 3, axis: 'y', tseg: 12 });
      panelSkin(b, 'hull', P_BK, { r: 1.7, from: -1.2, to: 1.2, rows: 2, cols: 8, seed, t: 0.12, axis: 'y' });
      box(b, 'glow', LD, 0.4, 0.3, 0.3, { y: 0.4, z: 1.5 });
      b.pop();
    }

    // ----------------------------------------------------- tier 1: plinth disc --
    const PR = 14; // plinth radius
    b.push(0, -3, 0, 0, 0, 0);
    // Main disc
    cyl(b, 'hull', BK, PR, PR*0.9, 5.2, 32);
    panelSkin(b, 'hull', P_BK, { r: PR, from: -2.4, to: 2.4, rows: 6, cols: 30, seed: 4520, t: 0.17, axis: 'y' });
    // Gold rim band at top
    torus(b, 'hull', GD, PR, 0.38, 8, 32, undefined, { y: 2.5, rx: Math.PI/2 });
    // Ivory scale skirt flange
    cyl(b, 'hull', IV, PR*1.05, PR, 2.1, 32, { y: -3.4 });
    panelSkin(b, 'hull', P_IV, { r: PR, from: -1.0, to: 1.0, rows: 3, cols: 26, seed: 4521, t: 0.15, axis: 'y' });
    ribBands(b, 'hull', GD, { r: PR*1.09, tube: 0.15, from: -0.9, to: 0.9, count: 2, axis: 'y', tseg: 32 });
    torus(b, 'hull', BD, PR*0.92, 0.26, 6, 32, undefined, { y: -4.3, rx: Math.PI/2 });
    // Plinth under-deck lamp strip
    lampString(b, 'glow', LW, { ax: -PR+1, ay: -2.5, az: 0, bx: PR-1, by: -2.5, bz: 0, count: 10, size: 0.25 });
    lampString(b, 'glow', LC, { ax: 0, ay: -2.5, az: -PR+1, bx: 0, by: -2.5, bz: PR-1, count: 10, size: 0.25 });
    b.pop();

    // ---- gallery pods (8) packed around the plinth rim ----
    const PODS = [
      { x: 10,  y:-1.4, z: 10,  w:5.5, d:4.5, h:3.3, plates:P_IV,  seed:4530, ry: Math.PI/4   },
      { x:-11,  y:-1.0, z:  8,  w:6.0, d:4.0, h:3.6, plates:P_MIX, seed:4531, ry:-Math.PI/5   },
      { x:  9,  y:-2.0, z:-11,  w:5.2, d:4.8, h:3.2, plates:P_IV,  seed:4532, ry:-Math.PI/4   },
      { x:-10,  y:-1.5, z: -9,  w:5.8, d:4.2, h:3.4, plates:P_MIX, seed:4533, ry: Math.PI/6   },
      { x:  0,  y:-0.8, z: 13,  w:7.0, d:4.2, h:3.9, plates:P_IV,  seed:4534, ry: 0            },
      { x:  0,  y:-2.0, z:-13,  w:6.5, d:4.5, h:3.3, plates:P_MIX, seed:4535, ry: 0            },
      { x: 13,  y:-1.8, z:  2,  w:4.5, d:5.0, h:3.1, plates:P_IV,  seed:4536, ry: Math.PI/2   },
      { x:-13,  y:-1.2, z: -1,  w:4.8, d:4.8, h:3.5, plates:P_MIX, seed:4537, ry: Math.PI/2   },
    ];
    PODS.forEach(p => galleryPod(p));

    // ---- colonnade drums (4) between pods ----
    const COLS = [
      { x: 6.5, y:-0.4, z: 6.5, r:3.2, h:4.6, plates:P_IV,  seed:4540 },
      { x:-7.0, y:-0.2, z: 5.0, r:3.1, h:4.9, plates:P_MIX, seed:4541 },
      { x: 5.5, y:-0.6, z:-7.0, r:2.9, h:4.3, plates:P_IV,  seed:4542 },
      { x:-6.0, y:-0.4, z:-6.0, r:3.0, h:4.7, plates:P_MIX, seed:4543 },
    ];
    COLS.forEach(c => colonnade(c));

    // Airlocks from pods to plinth core
    for (const p of PODS) {
      airlock(b, 'hull', W(IV,1), BD, { ax: p.x*0.82, ay: -0.9, az: p.z*0.82, bx: p.x*0.66, by: -2.7, bz: p.z*0.66, r: 1.3, seg: 12, rings: 2 });
    }

    // Bridges between adjacent pods (catwalks)
    bridge(b, 'hull', IV,      GD, { ax: 10,  ay:1.0, az: 10, bx: 6.5,  by:0.8, bz: 6.5, w:1.6, railH:0.75, posts:5 });
    bridge(b, 'hull', W(IV,1), GD, { ax:-11,  ay:1.2, az:  8, bx:-7.0,  by:1.0, bz: 5.0, w:1.5, railH:0.70, posts:4 });
    bridge(b, 'hull', IV,      GD, { ax:  9,  ay:0.6, az:-11, bx: 5.5,  by:0.8, bz:-7.0, w:1.6, railH:0.75, posts:5 });
    bridge(b, 'hull', W(IV,1), GD, { ax:  0,  ay:1.2, az: 13, bx: 6.5,  by:0.9, bz: 6.5, w:1.7, railH:0.80, posts:6 });
    bridge(b, 'hull', IV,      GD, { ax:  0,  ay:0.6, az:-13, bx:-6.0,  by:0.8, bz:-6.0, w:1.6, railH:0.75, posts:5 });

    // ---------------------------------------------------- tier 2: rotunda ------
    const RR = 10; // rotunda radius
    const RH = 6;  // rotunda height
    b.push(0, 3.5, 0, 0, 0, 0);
    // Ivory cylinder
    cyl(b, 'hull', IV, RR, RR, RH, 32);
    panelSkin(b, 'hull', P_IV, { r: RR, from: -RH/2+0.7, to: RH/2-0.7, rows: 6, cols: 26, seed: 4550, t: 0.15, axis: 'y' });
    ribBands(b, 'hull', GD, { r: RR+0.13, tube: 0.17, from: -RH/2+1.0, to: RH/2-1.0, count: 5, axis: 'y', tseg: 32 });
    // Gold collar rings at top and bottom
    torus(b, 'hull', GD, RR*1.08, 0.2, 8, 32, undefined, { y: RH/2+0.15, rx: Math.PI/2 });
    cyl(b, 'hull', W(IV,1), RR*1.1, RR, 0.9, 32, { y: RH/2+0.55 });
    torus(b, 'hull', GD, RR*0.93, 0.18, 6, 32, undefined, { y: -RH/2-0.15, rx: Math.PI/2 });
    // Turquoise glaze rings with dark mullions (14 panes)
    for (let i = 0; i < 14; i++) {
      const gy = -RH/2+0.65 + i*(RH-1.3)/13;
      cyl(b, 'glaze', GLZ, RR-0.2, RR-0.2, 0.36, 20, { y: gy, rx: Math.PI/2 });
    }
    for (let i = 0; i <= 14; i++) {
      torus(b, 'hull', BD, RR-0.08, 0.14, 5, 28, undefined, { y: -RH/2+0.45 + i*(RH-0.9)/14, rx: Math.PI/2 });
    }
    // DENSE GLOW: 16 per-facet window grids, each seated on the rotunda hull
    // H_tan=(3-1)*0.72/2+0.52/2=0.98 → depth=sqrt(100-0.9604)=9.9519
    {
      const rHtan = 0.98, rDepth = Math.sqrt(RR * RR - rHtan * rHtan);
      for (let ri = 0; ri < 16; ri++) {
        b.push(0, 0, 0, 0, (ri / 16) * Math.PI * 2, 0);
        windowGrid(b, 'glow', ri % 2 === 0 ? LIT : LW,
          { rows: 3, cols: 3, rowGap: 1.0, colGap: 0.72, w: 0.52, h: 0.62, d: 0.42, x: 0, y: 0.1, z: rDepth, axis: 'x' });
        b.pop();
      }
    }
    // Porthole rings
    portholeRing(b, 'glow', LC, { r: RR*1.01, count: 16, size: 0.32, y:  RH*0.36 });
    portholeRing(b, 'glow', LD, { r: RR*1.01, count: 16, size: 0.32, y: -RH*0.36 });
    b.pop();

    // Airlocks: rotunda to colonnade / pods
    airlock(b, 'hull', W(IV,1), BD, { ax: 6.5, ay: 2.0, az: 6.5, bx: 8.0, by: 0.8, bz: 8.5, r: 1.4, seg: 12, rings: 2 });
    airlock(b, 'hull', IV,      BD, { ax:-7.0, ay: 2.0, az: 5.0, bx:-8.5, by: 0.9, bz: 6.0, r: 1.3, seg: 12, rings: 2 });
    airlock(b, 'hull', W(IV,1), BD, { ax: 0,   ay: 2.0, az:10.5, bx: 0,   by: 0.7, bz:12.5, r: 1.5, seg: 12, rings: 2 });

    // --------------------------------------------------- tier 3: ribbed dome ---
    const DR = 9.2; // dome radius
    const DBY = 6.6; // dome base y
    b.push(0, DBY, 0, 0, 0, 0);
    // Dome collar
    cyl(b, 'hull', W(BK,1), DR*0.97, DR, 1.4, 28);
    panelSkin(b, 'hull', P_BK, { r: DR, from: -0.6, to: 0.6, rows: 2, cols: 24, seed: 4560, t: 0.15, axis: 'y' });
    ribBands(b, 'hull', GD, { r: DR+0.13, tube: 0.17, from: -0.5, to: 0.5, count: 2, axis: 'y', tseg: 28 });
    // Main dome hemisphere
    hemi(b, 'hull', BK, DR*0.93, 28, 18, { y: 0.7 });
    panelSkin(b, 'hull', P_BK, { r: DR*0.93, from: 0.8, to: DR*0.93*0.95, rows: 5, cols: 26, seed: 4561, t: 0.13, axis: 'y' });
    // Gold meridian ribs (12 ribs, each as a torus arc arc segment along the dome surface)
    for (let ri = 0; ri < 12; ri++) {
      const ang = (ri / 12) * Math.PI * 2;
      for (let ti = 0; ti < 7; ti++) {
        const phi = 0.08 + (ti / 7) * (Math.PI/2 - 0.08);
        const ry2 = Math.sin(phi) * DR * 0.9 + 0.7;
        const rh2 = Math.cos(phi) * DR * 0.9;
        torus(b, 'hull', GD, rh2, 0.11, 5, 18, Math.PI/7, { y: ry2, ry: ang, rx: Math.PI/2 });
      }
    }
    // Skylight glaze on the hemisphere surface — portholeRing at 3 polar elevations
    // phi=0.38: r=DHS*cos*0.97=7.732, y=3.916; phi=0.78: r=5.873, y=7.325; phi=1.18: r=3.202, y=9.246
    // tilt=cos(phi)/sin(phi) orients the cylinder normal to the dome surface
    {
      const DHS = DR * 0.93;
      for (const [phi, cnt, sz] of [[0.38, 10, 0.5], [0.78, 8, 0.46], [1.18, 5, 0.42]]) {
        const py = 0.7 + DHS * Math.sin(phi);
        const pr = DHS * Math.cos(phi) * 0.97;
        const pt = Math.cos(phi) / Math.sin(phi);
        portholeRing(b, 'glaze', GLZ, { r: pr, count: cnt, size: sz, y: py, tilt: pt });
        torus(b, 'hull', GD, pr, 0.09, 4, Math.max(16, cnt * 2), undefined, { y: py, rx: Math.PI/2 });
      }
    }
    // Crown ring at dome apex
    torus(b, 'hull', GD, 1.6, 0.14, 6, 18, undefined, { y: DR*0.93+0.56, rx: Math.PI/2 });
    // Dome porthole ring
    portholeRing(b, 'glow', LC, { r: DR*1.01, count: 20, size: 0.3, y: 0.4 });
    b.pop();

    // --------------------------------------------------- tier 4: crown spire ---
    const SBY = DBY + DR*0.93 + 0.65; // spire base y ≈ 16.25
    b.push(0, SBY, 0, 0, 0, 0);
    // Observation rotunda
    const OR = 2.8;
    const OH = 3.6;
    cyl(b, 'hull', IV, OR, OR, OH, 20);
    panelSkin(b, 'hull', P_IV, { r: OR, from: -OH/2+0.5, to: OH/2-0.5, rows: 3, cols: 16, seed: 4570, t: 0.13, axis: 'y' });
    ribBands(b, 'hull', GD, { r: OR+0.1, tube: 0.13, from: -OH/2+0.8, to: OH/2-0.8, count: 2, axis: 'y', tseg: 20 });
    torus(b, 'hull', GD, OR*1.1, 0.14, 6, 20, undefined, { y: OH/2+0.12, rx: Math.PI/2 });
    torus(b, 'hull', GD, OR*0.9, 0.12, 5, 20, undefined, { y: -OH/2-0.12, rx: Math.PI/2 });
    // Window grids all around obs rotunda — 10 per-facet, each seated on the hull
    // H_tan=(2-1)*0.45/2+0.36/2=0.405 → depth=sqrt(2.8²-0.164)=2.771
    {
      const oHtan = 0.405, oDepth = Math.sqrt(OR * OR - oHtan * oHtan);
      for (let oi = 0; oi < 10; oi++) {
        b.push(0, 0, 0, 0, (oi / 10) * Math.PI * 2, 0);
        windowGrid(b, 'glow', oi % 2 === 0 ? LIT : LW,
          { rows: 2, cols: 2, rowGap: 0.9, colGap: 0.45, w: 0.36, h: 0.5, d: 0.32, x: 0, y: 0.2, z: oDepth, axis: 'x' });
        b.pop();
      }
    }
    // Spire mast
    cyl(b, 'hull', IV, 0.27, 0.42, 5.8, 12, { y: OH/2+0.5 });
    ribBands(b, 'hull', GD, { r: 0.48, tube: 0.1, from: OH/2+0.8, to: OH/2+5.7, count: 5, axis: 'y', tseg: 12 });
    // Needle finial (top: SBY + OH/2 + 0.5 + 5.8/2 + 0.5 + 2.0/2 ≈ 16.25+1.8+0.5+2.9+0.5+1.0 = 22.95 < 29.5 ✓)
    cone(b, 'hull', GD, 0.11, 2.0, 8, { y: OH/2 + 5.8 + 0.9 });
    // Lamp at spire base
    cyl(b, 'glow', LC, 0.16, 0.16, 0.38, 10, { y: OH/2 + 0.3 });
    // Glaze observation slots in spire
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      box(b, 'glaze', GLZ, 0.32, 0.75, 0.38, { x: Math.cos(ang)*0.28, y: OH/2+2.2, z: Math.sin(ang)*0.28, ry: ang });
    }
    b.pop();

    // Airlock: rotunda to spire base
    airlock(b, 'hull', W(IV,1), BD, { ax: 0, ay: 6.4, az: 0, bx: 0, by: SBY-0.5, bz: 0, r: 1.1, seg: 12, rings: 2 });

    // ----------------------------------------------------- decorative pinnacles --
    const PINNACLES = [
      [  9, 1.5,  12, 7.5 ],
      [ -10, 1.8,   9, 7.0 ],
      [   9, 1.4, -11, 7.8 ],
      [ -11, 1.7,  -8, 7.2 ],
      [  12, 2.0,   3, 6.5 ],
      [ -12, 1.9,  -2, 6.8 ],
    ];
    for (const [px, py, pz, ph] of PINNACLES) {
      b.push(px, py, pz, 0, 0, 0);
      cyl(b, 'hull', IV, 0.2, 0.32, ph, 10);
      ribBands(b, 'hull', GD, { r: 0.38, tube: 0.08, from: -ph/2+0.5, to: ph/2-1.2, count: 4, axis: 'y', tseg: 10 });
      cone(b, 'hull', GD, 0.1, 1.1, 6, { y: ph/2 + 0.35 });
      box(b, 'glaze', GLZ, 0.26, 0.48, 0.3, { y: ph*0.38, z: 0.22 });
      b.pop();
    }

    // --------------------------------------------------------------- pipe runs --
    const PIPES = [
      [ -8,-6.5,-5,  -6,-4.5,-3 ],
      [  5,-7.0, 6,   3,-5.2, 4 ],
      [ 10,-6.8,-4,   8,-5.5,-2 ],
      [-10,-7.2, 8,  -8,-5.8, 6 ],
      [  0,-4.5, 0,   0, 1.0, 0 ],
      [  8, 0.5, 6,  10, 1.8, 8 ],
      [ -6, 0.8, 5,  -4, 2.0, 6 ],
      [  6, 1.2,-7,   8, 2.8,-5 ],
      [ -9,-1.5,-5,  -6, 0.0,-4 ],
      [  9,-1.2, 5,   6, 0.2, 4 ],
    ];
    for (const [x0,y0,z0,x1,y1,z1] of PIPES) {
      pipeRun(b, 'hull', W(IV,1), { ax:x0, ay:y0, az:z0, bx:x1, by:y1, bz:z1, r:0.17, seg:8, collars:3 });
    }

    // -------------------------------------------------------- surface greebles --
    for (let i = 0; i < 90; i++) {
      const gx = -12 + rand()*24;
      const gz = -12 + rand()*24;
      const gy = -10 + rand()*22;
      const col = [BD, W(IV,2), GD, BK][i % 4];
      box(b, 'hull', col, 0.5+rand()*0.7, 0.4+rand()*0.45, 0.4+rand()*0.55,
        { x: gx, y: gy, z: gz, ry: rand()*Math.PI });
      if (i % 3 === 0) box(b, 'glow', LD, 0.3, 0.22, 0.22, { x: gx+0.4, y: gy+0.22, z: gz });
    }

    // Extra lamp strings throughout tiers
    const LAMPS = [
      [ -PR+1, -2.8,  PR-2,  PR-1, -2.8,  PR-2 ],
      [  PR-1, -2.8,  PR-2, -PR+1, -2.8,  PR-2 ],
      [  -8.0,  0.8,  10.5,   8.0,  0.8,  10.5 ],
      [  -8.0,  0.8, -10.5,   8.0,  0.8, -10.5 ],
      [  10.5,  0.8,  -8.0,  10.5,  0.8,   8.0 ],
      [ -10.5,  0.8,  -8.0, -10.5,  0.8,   8.0 ],
    ];
    for (const [x0,y0,z0,x1,y1,z1] of LAMPS) {
      lampString(b, 'glow', LC, { ax:x0, ay:y0, az:z0, bx:x1, by:y1, bz:z1, count: 8, size: 0.22 });
    }

    // ------------------------------------------------- observation carousel ring --
    const RingR = 16;
    // Main hoop
    torus(ringB, 'ringHull', W(IV,1), RingR, 1.1, 8, 36, undefined, { rx: Math.PI/2 });
    torus(ringB, 'ringHull', GD, RingR, 0.26, 6, 36, undefined, { y:  0.65, rx: Math.PI/2 });
    torus(ringB, 'ringHull', GD, RingR, 0.26, 6, 36, undefined, { y: -0.65, rx: Math.PI/2 });
    // Hub
    cyl(ringB, 'ringHull', IV, 2.3, 2.7, 1.8, 16);
    panelSkin(ringB, 'ringHull', P_IV, { r: 2.7, from: -0.7, to: 0.7, rows: 2, cols: 12, seed: 4580, t: 0.13, axis: 'y' });
    ribBands(ringB, 'ringHull', GD, { r: 2.85, tube: 0.13, from: -0.5, to: 0.5, count: 2, axis: 'y', tseg: 16 });

    // Six gallery arms on the hoop
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const midR = (RingR + 3.5) / 2;
      ringB.push(Math.cos(angle) * midR, 0, Math.sin(angle) * midR, -angle, 0, 0);
      const armW = (RingR - 5) * 0.4;
      // Pod body
      box(ringB, 'ringHull', IV, armW, 1.4, 3.8, { y: 0.3 });
      panelSkin(ringB, 'ringHull', P_IV, { r: 2.2, from: -armW/2+0.4, to: armW/2-0.4, rows: 2, cols: 8, seed: 4590+i, t: 0.11, axis: 'x' });
      ribBands(ringB, 'ringHull', GD, { r: 2.3, tube: 0.12, from: -armW/2+0.6, to: armW/2-0.6, count: 2, axis: 'x', tseg: 16 });
      // Gold cornice band
      torus(ringB, 'ringHull', GD, 2.3, 0.12, 5, 16, undefined, { y: 0.8, ry: Math.PI/2 });
      // Glazed viewing panes (5 panes behind dark mullions)
      for (let p = 0; p < 5; p++) {
        box(ringB, 'ringGlaze', GLZ, armW/6*0.76, 0.9, 0.2, { x: -armW/2+0.5 + (p+0.5)*armW/6, y: 0.5, z: 1.55 });
      }
      for (let p = 0; p <= 5; p++) {
        box(ringB, 'ringHull', BD, 0.1, 0.94, 0.24, { x: -armW/2+0.42 + p*armW/6, y: 0.5, z: 1.55 });
      }
      // Rim lamps (near-white for ringGlow)
      lampString(ringB, 'ringGlow', LC, { ax: -armW/2+0.4, ay: 0.9, az:  1.3, bx: armW/2-0.4, by: 0.9, bz:  1.3, count: 5, size: 0.2 });
      lampString(ringB, 'ringGlow', LW, { ax: -armW/2+0.4, ay: 0.9, az: -1.3, bx: armW/2-0.4, by: 0.9, bz: -1.3, count: 5, size: 0.2 });
      ringB.pop();
      // Spoke
      truss(ringB, 'ringHull', GD, {
        ax: Math.cos(angle)*(RingR-1.5), ay: 0, az: Math.sin(angle)*(RingR-1.5),
        bx: Math.cos(angle)*3.8,         by: 0, bz: Math.sin(angle)*3.8,
        bays: 3, thickness: 0.22, spread: 0.7,
      });
    }

    // Outer rim lamp ring
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      box(ringB, 'ringGlow', LIT, 0.28, 0.28, 0.24, { x: Math.cos(ang)*(RingR+0.8), z: Math.sin(ang)*(RingR+0.8), ry: -ang });
    }

    // Hub glow detail
    portholeRing(ringB, 'ringGlow', LC, { r: 2.75, count: 10, size: 0.26, y: 0.5 });

    // Carousel stem airlock from plinth belly
    airlock(b, 'hull', W(IV,1), BD, { ax: 0, ay: -3.5, az: 0, bx: 0, by: -7.2, bz: 0, r: 1.5, seg: 12, rings: 2 });
  },
};
