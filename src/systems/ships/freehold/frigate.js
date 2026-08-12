/**
 * Freehold Compact — Convoy Keeper (Frigate)
 *
 * Bible: "A community-funded escort with a long repaired keel, several
 * different yard modules, a proper command cabin, rescue hangar, and
 * replaceable side armor. It should feel like several towns contributed
 * to one dependable ship."
 *
 * Body plan: CONVOY KEEPER. ONE REPAIRED KEEL carries SEVERAL DIFFERENT
 * YARD MODULES. The keel (soundFrame) runs most of the hull length, visible
 * below and through the repaired hull. Modules bolted along it are deliberately
 * unlike each other and NOT mirrored port to starboard — a different town
 * paid for each one:
 *   Command cabin   (donatedBlock, raised forward, all-face glazed):  z −12.5 to −7.5
 *   Greenhouse      (glassHouse, starboard-dorsal):                   z −5.0  to  +1.0
 *   Armoured module (donatedBlock, starboard flank):                  z  +2.0  to  +6.0
 *   Habitation drum (habDrum, port):                                  z  +1.0  to  +5.0
 *   Cargo pod rack  (cargoPod × 3, port-ventral):                     z  +6.5  to +10.5
 *   Tank pair       (tankVolume × 2, different sizes, each side):     z  −4.0  to   0.0
 * Rescue hangar opens in the aft ventral. Replaceable armour panels
 * (boltOnArmour) bolt along both flanks — asymmetric: starboard has one
 * extra aft panel that port does not.
 *
 * Charter: target span 32.0 (Z −16.0 to +16.0), hull 16,000–60,000 verts,
 * lights ≥ 1,100 and ≤ 25% of hull, glowZ 15.5.
 */

import {
  sectionAt, loftExtents, loftRib,
  splicedHull, patchCourse, donatedBlock, soundFrame, glassHouse, tankVolume,
} from './body.js';
import {
  LAMP, FLOOD,
  warmWindowRow, toolLocker, rescueWinch, towWinch, floodLamp,
  deckPlate, patchPanel, boltOnArmour, militiaTurret, airlockCollar,
  habDrum, cargoPod, craftDock, driveCluster,
} from './motifs.js';
import { weather, box, lampString } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const freeholdFrigate = {
  glowZ: 15.5,

  build(b, st) {
    // ================================================================
    // STATIONS — long repaired hull, working prow, proper stern
    // Z span: −16.0 to +16.0 = 32.0 (target 32.0 ✓).
    // X max: ±4.4 (beam 8.8). Y hull: −3.2 to 2.8 (span 6.0).
    // Modules add ~1.8 above and ~0.5 below → total Y ~8.0.
    // len/beam = 32/8.8 = 3.6 ≥ 1.15 ✓   beam/len = 0.28 ≥ 0.16 ✓
    // ht/len ≈ 8.0/32 = 0.25 ≤ 0.60 ✓
    // ================================================================
    const stations = [
      { z: -16.0, w: 1.0,  h: 1.2,  y: -0.2, c: 0.22 }, // bow working prow
      { z: -13.5, w: 2.4,  h: 2.0,  y: -0.2, c: 0.26 }, // bow cheek
      { z:  -9.0, w: 3.8,  h: 2.8,  y: -0.2, c: 0.28 }, // forward shoulder
      { z:  -4.0, w: 4.4,  h: 3.0,  y: -0.2, c: 0.28 }, // mid-forward (widest)
      { z:   0.0, w: 4.4,  h: 3.0,  y: -0.2, c: 0.28 }, // centre
      { z:   4.0, w: 4.0,  h: 2.6,  y: -0.2, c: 0.28 }, // MODULE BREAK — command cabin to greenhouse
      { z:   5.0, w: 4.2,  h: 2.9,  y: -0.2, c: 0.28 }, // mid-aft
      { z:  10.0, w: 3.8,  h: 2.7,  y: -0.2, c: 0.26 }, // aft body
      { z:  11.0, w: 3.6,  h: 2.5,  y: -0.2, c: 0.26 }, // hangar approach
      { z:  12.0, w: 3.4,  h: 1.9,  y: -0.9, c: 0.24 }, // hangar mouth (deep ventral notch)
      { z:  13.5, w: 3.2,  h: 2.3,  y: -0.2, c: 0.24 }, // stern approach  
      { z:  16.0, w: 3.0,  h: 2.3,  y: -0.2, c: 0.24 }, // stern
    ];

    const extents = loftExtents(stations);
    const sternZ  = extents.z1;  // +16.0
    const bowZ    = extents.z0;  // −16.0

    // ================================================================
    // ================================================================
    // KEEL FRAME — soundFrame: the visible repaired spine
    // Chords at ±0.9 (X) and ±0.5 (Y) around y=−3.8.
    // Top chord at y=−3.3 (visible gap below hull ventral at −2.9) → exposed structure ✓.
    // Bottom chord at y=−4.3 → distinct keel member ✓.
    // plate=0.07 adds a walkway deck plate on the upper chords.
    // ================================================================
    soundFrame(b, 'hull', st.hullDark, {
      from:  -14.0,
      to:     14.0,
      w:       0.9,
      h:       0.5,
      y:      -3.8,
      bay:     2.5,
      chord:   0.15,
      brace:   0.11,
      plate:   0.07,
    });

    // ================================================================
    // HULL SHELL — splicedHull with 4 seams (5 donor sections)
    // Each section a different yard tone: warm brown / barn red /
    // faded blue / slightly dark / dark stern — patchwork is history.
    // ================================================================
    const splicedHex = [
      weather(st.hull, 0),     // z −16 to −7   — warm brown forward
      st.accent,               // z  −7 to  −1  — barn red second section
      weather(st.patch[2], 0), // z  −1 to  +5  — faded blue centre
      weather(st.hull, 1),     // z  +5 to +10.5 — slightly darker aft
      weather(st.hullDark, 0), // z +10.5 to +16 — dark structural stern
    ];

    splicedHull(b, 'hull', splicedHex, {
      stations,
      seams:   [-7.0, -1.0, 5.0, 10.5],
      strap:    0.07,
      strapHex: st.trim,
      seg:      0,
      capFore:  true,
      capAft:   true,
      seed:     49,
    });

    // ================================================================
    // PATCH COURSES — the plating skin. Multiple passes build up
    // the donated-panel texture. patchCourse is the vertex engine.
    // ================================================================
    const hullHex  = [st.hull, weather(st.hull, 1), weather(st.hull, 2), st.hullDark];
    const flankHex = [
      st.hull, weather(st.hull, 1), st.patch[0],
      weather(st.patch[2], 1), weather(st.hull, 2), st.hullDark,
    ];

    // Dorsal crown (face 2) — full hull length
    patchCourse(b, 'hull', hullHex, {
      stations, from: bowZ, to: sternZ,
      rows: 4, cols: 2, t: 0.06, inset: 0.15, seed: 1, faces: [2],
    });

    // Upper chamfers (1, 3) — full length
    patchCourse(b, 'hull', hullHex, {
      stations, from: bowZ, to: sternZ,
      rows: 3, cols: 2, t: 0.06, inset: 0.14, seed: 3, faces: [1, 3],
    });

    // Flanks (0, 4) — full length, barn-red and faded-blue cycling
    patchCourse(b, 'hull', flankHex, {
      stations, from: bowZ, to: sternZ,
      rows: 3, cols: 2, t: 0.06, inset: 0.15, seed: 5, faces: [0, 4],
      replaced: 0.20, proud: 0.038,
    });

    // Lower chamfers (5, 7) — full length
    patchCourse(b, 'hull', hullHex, {
      stations, from: bowZ, to: sternZ,
      rows: 3, cols: 2, t: 0.06, inset: 0.14, seed: 7, faces: [5, 7],
    });

    // Ventral strake (6) — full length, dark keel emphasis
    patchCourse(b, 'hull', [st.hullDark, weather(st.hull, 2), st.hullDark], {
      stations, from: bowZ, to: sternZ,
      rows: 3, cols: 2, t: 0.06, inset: 0.14, seed: 11, faces: [6],
    });
    // ================================================================
    for (const ribZ of [-13.5, -9.0, -4.0, 0.0, 5.0, 10.0]) {
      loftRib(b, 'hull', st.trim, { stations, z: ribZ, out: 0.09, thick: 0.14 });
    }

    // ================================================================
    // BOLT-ON ARMOUR — replaceable panels, deliberately asymmetric.
    // Outer push ry=±π/2 rotates local +Z to point outward from hull:
    //   STARBOARD (4 panels, ry=+π/2): local z+ → world +X → slab outboard ✓
    //   PORT      (3 panels, ry=−π/2): local z+ → world −X → slab outboard ✓
    // Starboard has one extra aft panel — a different town paid for it.
    // ================================================================

    // Starboard panels — 4 total
    for (const [zc, panelH, seed] of [
      [-10.0, 2.6, 41],
      [ -3.0, 2.8, 43],
      [  5.0, 2.6, 45],
      [ 11.5, 2.4, 47],  // extra aft panel port does NOT have
    ]) {
      const s = sectionAt(stations, zc);
      b.push(s.w, s.y, zc, Math.PI / 2, 0, 0);
        boltOnArmour(b, st, { w: 3.8, h: panelH, d: 0.18, ry: 0, stand: 0.10, seed });
      b.pop();
    }

    // Port panels — 3 total
    for (const [zc, panelH, seed] of [
      [ -7.0, 2.6, 51],
      [  3.0, 2.8, 53],
      [  9.0, 2.6, 55],
    ]) {
      const s = sectionAt(stations, zc);
      b.push(-s.w, s.y, zc, -Math.PI / 2, 0, 0);
        boltOnArmour(b, st, { w: 3.8, h: panelH, d: 0.18, ry: 0, stand: 0.10, seed });
      b.pop();
    }

    // ================================================================
    // PATCH PANELS — four clearly replaced hull sections
    // Outer push ry=±π/2 (flanks) or rx=−π/2 (dorsal) orientates
    // the panel's local +Z outward so the strap reaches into the hull.
    // ================================================================
    {
      // #1 — port flank, forward zone (ry=−π/2: local+Z → world−X)
      const s1 = sectionAt(stations, -6.5);
      b.push(-s1.w, s1.y + s1.h * 0.25, -6.5, -Math.PI / 2, 0, 0);
        patchPanel(b, st, { w: 1.60, h: 1.20, i: 0, proud: 0.055, seed: 61 });
      b.pop();

      // #2 — starboard flank, aft zone (ry=+π/2: local+Z → world+X)
      const s2 = sectionAt(stations, 2.5);
      b.push(s2.w, s2.y + s2.h * 0.35, 2.5, Math.PI / 2, 0, 0);
        patchPanel(b, st, { w: 1.40, h: 1.00, i: 1, proud: 0.050, seed: 63 });
      b.pop();

      // #3 — dorsal, mid-aft (rx=−π/2: local+Z → world+Y, up out of hull)
      const s3 = sectionAt(stations, 7.5);
      b.push(0.8, s3.y + s3.h, 7.5, 0, -Math.PI / 2, 0);
        patchPanel(b, st, { w: 2.00, h: 1.30, i: 2, proud: 0.060, seed: 65 });
      b.pop();

      // #4 — port flank, forward-mid (ry=−π/2)
      const s4 = sectionAt(stations, -11.5);
      b.push(-s4.w, s4.y - s4.h * 0.15, -11.5, -Math.PI / 2, 0, 0);
        patchPanel(b, st, { w: 1.20, h: 1.00, i: 0, proud: 0.050, seed: 67 });
      b.pop();
    }
    // MODULE 1 — COMMAND CABIN (donatedBlock, raised forward, centre)
    // Raised WELL above hull top at z=−10, windowed on all four faces.
    // Distinct stepped bridge front gives proper escort profile.
    // cabinY = hull_top + h − overlap ensures bottom overlaps hull.
    // ================================================================
    {
      const cabinZ  = -10.0;
      const cabSec  = sectionAt(stations, cabinZ);
      const cabTop  = cabSec.y + cabSec.h;       // hull top at z=−10 ≈ 2.42
      const cabH    = 1.50;                       // donatedBlock half-height (raised more)
      const cabW    = 2.80;                       // donatedBlock half-width
      const cabD    = 5.00;                       // donatedBlock depth (fore-aft)
      const cabY    = cabTop + cabH - 0.30;       // bottom overlaps hull by 0.30 (raised higher)

      b.push(0, cabY, cabinZ, 0, 0, 0);

        // Cabin body — mismatched donated tonnage, two strap bands
        donatedBlock(b, 'hull',
          [weather(st.hull, 1), st.hullDark, st.patch[0]],
          { w: cabW, h: cabH, d: cabD, c: 0.18, taper: 1, y: 0, straps: 2, seed: 71 });

        // STEPPED BRIDGE FRONT — distinctive forward superstructure
        // A raised bridge extension on the forward face (−Z = nose direction)
        b.push(0, 0, -cabD / 2, Math.PI, 0, 0);
          // Bridge extension box (wider, shorter)
          box(b, 'hull', st.hull, 1.60, 0.70, 0.80);
          // Windscreen windows on the bridge
          b.push(0, 0.35, 0, Math.PI, 0, 0);
            warmWindowRow(b, st, { count: 3, ry: 0, sill: true });
          b.pop();
        b.pop();

        // Forward face windows below bridge (ry=π rotates so windows face −Z)
        b.push(0, -0.50, -cabD / 2, Math.PI, 0, 0);
          warmWindowRow(b, st, { count: 2, ry: 0, sill: true });
        b.pop();

        // Starboard face (+X): ry=+π/2 → face normal points world +X
        b.push(cabW, 0, 0, Math.PI / 2, 0, 0);
          warmWindowRow(b, st, { count: 3, ry: 0, sill: true });
        b.pop();

        // Port face (−X): ry=−π/2 → face normal points world −X
        b.push(-cabW, 0, 0, -Math.PI / 2, 0, 0);
          warmWindowRow(b, st, { count: 3, ry: 0, sill: true });
        b.pop();

        // Aft face (+Z): ry=0, face normal points world +Z (default)
        b.push(0, 0, cabD / 2, 0, 0, 0);
          warmWindowRow(b, st, { count: 3, ry: 0, sill: false, dim: true });
        b.pop();

      b.pop();
    }


    // ================================================================
    // MODULE 2 — GREENHOUSE GALLERY (glassHouse, STARBOARD-DORSAL)
    // z −5.0 to +1.0 (d=6.0), offset 1.5 to starboard of centreline.
    // glassHouse base flange sinks flangeH into hull for connectivity.
    // ================================================================
    {
      const ghZ   = -2.0;
      const ghSec = sectionAt(stations, ghZ);
      const ghTop = ghSec.y + ghSec.h;           // hull dorsal at z=−2 ≈ 2.80

      b.push(1.5, ghTop, ghZ, 0, 0, 0);
        glassHouse(b, st, { w: 1.40, h: 1.40, d: 6.0, y: 0, bays: 4, seed: 73 });
      b.pop();
    }
    {
      const amZ   = 4.0;
      const amSec = sectionAt(stations, amZ);

      b.push(amSec.w + 0.80, 0, amZ, 0, 0, 0);

        donatedBlock(b, 'hull',
          [st.patch[0], weather(st.hullDark, 1), weather(st.hull, 1)],
          { w: 1.40, h: 2.20, d: 4.0, c: 0.15, taper: 1, straps: 2, seed: 75 });

        // Window band on the outward starboard face (ry=+π/2 in inner frame)
        b.push(1.40, 0.60, 0, Math.PI / 2, 0, 0);
          warmWindowRow(b, st, { count: 2, ry: 0, sill: true });
        b.pop();

      b.pop();
    }

    // ================================================================
    // MODULE 4 — HABITATION DRUM (habDrum, PORT)
    // z +1.0 to +5.0 (len=4.0). Push at x=−5.0:
    // drum x range [−6.2, −3.8]; hull port at −4.4 → overlap 0.6 ✓.
    // ================================================================
    b.push(-5.0, 0.0, 3.0, 0, 0, 0);
      habDrum(b, st, { r: 1.20, len: 4.0, ry: 0, rings: 3, windows: true, seed: 77 });
    b.pop();

    // ================================================================
    // MODULE 5 — CARGO POD RACK (cargoPod × 3, PORT-VENTRAL)
    // Three pods at z=6.5, 8.0, 9.5. Push at x=−4.0, y=−2.8:
    // pod x [−4.5, −3.5]; hull port at −3.8 → overlap 0.3 ✓.
    // Different i values pick different donor tones.
    // ================================================================
    for (let pi = 0; pi < 3; pi++) {
      const podZ = 6.5 + pi * 1.5;
      b.push(-4.0, -2.8, podZ, 0, 0, 0);
        cargoPod(b, st, { w: 1.00, h: 0.90, d: 1.30, i: pi, seed: 79 + pi });
      b.pop();
    }

    // ================================================================
    // MODULE 6 — TANK VOLUMES (two, different sizes — asymmetric)
    // Port tank: r=0.55, len=4.0 at z=−2.0 (longer, larger yard).
    // Starboard tank: r=0.50, len=3.0 at z=−0.5 (shorter, different yard).
    // Each pushed so the cylinder overlaps the hull flank.
    // ================================================================
    {
      // Port tank (larger): x=−4.5, r=0.55 → x range [−5.05, −3.95];
      // hull port at z=−2: w≈4.4. Overlap at x=−4.4 to −3.95 ✓.
      b.push(-4.50, -1.80, -2.0, 0, 0, 0);
        tankVolume(b, st, { r: 0.55, len: 4.0, y: 0, axis: 'z', hoops: 3, seed: 83 });
      b.pop();

      // Starboard tank (shorter): x=+4.50, r=0.50 → x range [+4.0, +5.0];
      // hull starboard at z=−0.5: w≈4.4. Overlap at x=+4.0 to +4.4 ✓.
      b.push(4.50, -1.80, -0.5, 0, 0, 0);
        tankVolume(b, st, { r: 0.50, len: 3.0, y: 0, axis: 'z', hoops: 2, seed: 85 });
      b.pop();
    }

    // ================================================================
    // RESCUE HANGAR — aft ventral cavity (z +11 to +13.5)
    // Cavity cut UPWARD into the hull: all interior parts sit inside
    // the hull envelope, above the ventral skin line. The mouth opens
    // downward, creating a visible notch in the ventral silhouette.
    // ================================================================
    {
      // Hangar spans the mouth notch (z=11 to z=13.5)
      const hangarFrom   = 11.0;
      const hangarTo     = 13.5;
      const hangarLength = hangarTo - hangarFrom;          // 2.5
      const hangarWidth  = 2.8;                             // opening width

      const hangarDeckZ = (hangarFrom + hangarTo) / 2;     // 12.25
      const hangarSection = sectionAt(stations, hangarDeckZ);
      // Hull bottom for the 6-sided ellipse (seg=6): y - h*sin(60°)
      const hullBottomY = hangarSection.y - hangarSection.h * 0.866;  // ≈ -2.4

      // Cavity is deep and prominent — clearly reads as interior space
      const cavityCeilingY = hullBottomY + 2.8;            // deep inside hull
      const cavityFloorY   = hullBottomY + 0.3;            // just above skin line
      const cavityHeight   = cavityCeilingY - cavityFloorY; // ≈ 2.5

      // BACK WALL (aft end of hangar) — positioned to stay above hull bottom
      const backWallH = cavityHeight * 0.75;
      const backWallY = hullBottomY + backWallH * 0.5;  // bottom exactly at hull bottom
      b.push(0, backWallY, hangarFrom, 0);
      box(b, 'hull', st.hullDark, hangarWidth + 0.3, backWallH, 0.22);
      // RESCUE DOOR — prominent bright frame, clearly visible entrance
      const doorW = HUMAN.doorW + 1.0;
      const doorH = HUMAN.doorH + 0.8;
      b.push(0, -backWallH * 0.35, 0.22, 0);
      // Door frame — bright trim around opening
      box(b, 'hull', st.trim, doorW + 0.3, doorH + 0.3, 0.05);
      // Door opening — bright emissive, draws eye into cavity
      b.push(0, 0, 0.03, 0);
      box(b, 'lights', 0xffffff, doorW, doorH, 0.02);
      b.pop();
      b.pop();
      b.pop();

      // PORT SIDE WALL — tall and prominent, lines the cavity
      const sideWallH = cavityHeight * 0.8;
      const sideWallY = hullBottomY + sideWallH * 0.5;  // stays above hull bottom
      b.push(-(hangarWidth / 2) - 0.25, sideWallY, hangarDeckZ, 0);
      box(b, 'hull', st.hullDark, 0.28, sideWallH, hangarLength - 0.2);
      b.pop();

      // STARBOARD SIDE WALL — mirror
      b.push(hangarWidth / 2 + 0.25, sideWallY, hangarDeckZ, 0);
      box(b, 'hull', st.hullDark, 0.28, sideWallH, hangarLength - 0.2);
      b.pop();

      // THIN MOUTH PLATE — defines cavity opening at hull skin line
      const mouthH = 0.08;
      const mouthY = hullBottomY + mouthH * 0.5;  // centered at hull bottom
      b.push(0, mouthY, hangarDeckZ, 0);
      box(b, 'hull', st.trim, hangarWidth * 0.9, mouthH, hangarLength - 0.3);
      b.pop();

      // NO FLOOR DECK — cavity opens downward through ventral skin
      b.push(-hangarWidth / 4, hullBottomY + 0.8, hangarTo - hangarDeckZ - 0.7, 0);
      box(b, 'hull', st.trim, 0.5, 0.08, 0.9);
      b.push(0, 0.06, 0, 0);
      box(b, 'hull', weather(st.hullDark, 0), 0.35, 0.05, 0.18);
      b.pop();
      b.pop();

      // BAY LAMPS — interior lighting along the side walls
      const bayLampCount = Math.floor(hangarLength / HUMAN.lampGap) + 1;
      // Port side lamps
      // Seated on the port side wall's inner face, not floating in the void:
      // the wall spans sideWallY ± sideWallH/2, so a lamp run above its top
      // edge has no hull cell to neighbour and scores as an orphan.
      b.push(-(hangarWidth / 2) - 0.15, sideWallY + sideWallH * 0.4, hangarFrom, 0);
      lampString(b, 'lights', LAMP, {
        ax: 0, ay: 0, az: 0,
        bx: 0, by: 0, bz: hangarLength - 0.4,
        count: bayLampCount, size: HUMAN.lampSize,
      });
      b.pop();
      // Starboard side lamps
      b.push(hangarWidth / 2 + 0.15, sideWallY + sideWallH * 0.4, hangarFrom, 0);
      lampString(b, 'lights', LAMP, {
        ax: 0, ay: 0, az: 0,
        bx: 0, by: 0, bz: hangarLength - 0.4,
        count: bayLampCount, size: HUMAN.lampSize,
      });
      b.pop();
    }


    // ================================================================
    // RESCUE GEAR & DECK EQUIPMENT
    // ================================================================
    {
      // Tow winch — dorsal forward deck (z=−5, on hull top)
      const twS = sectionAt(stations, -5.0);
      b.push(0, twS.y + twS.h + 0.02, -5.0, 0, 0, 0);
        towWinch(b, st, { r: 0.34, len: 0.60, seed: 93 });
      b.pop();

      // Rescue winch — starboard forward (z=−8)
      const rw1 = sectionAt(stations, -8.0);
      b.push(rw1.w * 0.55, rw1.y + rw1.h + 0.02, -8.0, 0, 0, 0);
        rescueWinch(b, st, { r: 0.22, len: 0.34, seed: 95 });
      b.pop();

      // Rescue winch — port aft (z=+7)
      const rw2 = sectionAt(stations, 7.0);
      b.push(-rw2.w * 0.55, rw2.y + rw2.h + 0.02, 7.0, 0, 0, 0);
        rescueWinch(b, st, { r: 0.22, len: 0.34, seed: 97 });
      b.pop();

      // Tool lockers — three at different longitudinal stations
      for (const [tlz, tlx, tlSeed] of [
        [-11.0,  1.20, 99],
        [  2.5, -1.00, 100],
        [  8.5,  0.00, 101],
      ]) {
        const tlS = sectionAt(stations, tlz);
        b.push(tlx, tlS.y + tlS.h + 0.02, tlz, 0, 0, 0);
          toolLocker(b, st, { w: 0.50, h: 0.42, d: 0.72, seed: tlSeed });
        b.pop();
      }

      // Flood lamps — three along dorsal, slightly offset for interest
      for (const [flz, flx, flSeed] of [
        [ -7.0,  0.80, 102],
        [  0.0, -0.60, 103],
        [  7.0,  0.40, 104],
      ]) {
        const flS = sectionAt(stations, flz);
        b.push(flx, flS.y + flS.h + 0.02, flz, 0, 0, 0);
          floodLamp(b, st, { r: 0.14, arm: 0.26, tilt: 0 });
        b.pop();
      }

      // Militia turrets — community escort armament (3, dorsal)
      // Mounting flange reaches back past frame origin (z=−h*0.495 behind)
      // and the flange bounding box overlaps the hull at y ≈ hull_top ✓.
      {
        const t1 = sectionAt(stations, -6.0);
        b.push(-1.50, t1.y + t1.h + 0.08, -6.0, 0, 0, 0);
          militiaTurret(b, st, { r: 0.30, h: 0.28, barrels: 2, seed: 105 });
        b.pop();
      }
      {
        const t2 = sectionAt(stations, 1.0);
        b.push(1.60, t2.y + t2.h + 0.08, 1.0, 0, 0, 0);
          militiaTurret(b, st, { r: 0.28, h: 0.26, barrels: 2, seed: 107 });
        b.pop();
      }
      {
        const t3 = sectionAt(stations, 9.0);
        b.push(-1.20, t3.y + t3.h + 0.08, 9.0, 0, 0, 0);
          militiaTurret(b, st, { r: 0.28, h: 0.26, barrels: 2, seed: 109 });
        b.pop();
      }
    }

    // ================================================================
    // STERN DRIVES — three driveCluster, closes the stern face
    // Drive housing spans z = [sternZ − len, sternZ]; face plate at
    // sternZ + len*0.04 overlaps hull for connectivity ✓.
    // glowZ = 15.5: 0.55×16 = 8.8 ≤ 15.5 ≤ 16+1.2 = 17.2 ✓.
    // ================================================================
    {
      const sS = sectionAt(stations, sternZ - 0.10);

      // Centre drive (2 throats)
      b.push(0, sS.y, sternZ, 0, 0, 0);
        driveCluster(b, st, { w: 1.50, h: 1.30, len: 1.20, throats: 2, seed: 111 });
      b.pop();

      // Port drive (1 throat — different yard, different size)
      b.push(-sS.w * 0.60, sS.y - 0.10, sternZ - 0.20, 0, 0, 0);
        driveCluster(b, st, { w: 1.10, h: 1.00, len: 1.00, throats: 1, seed: 113 });
      b.pop();

      // Starboard drive (1 throat)
      b.push(sS.w * 0.60, sS.y - 0.10, sternZ - 0.20, 0, 0, 0);
        driveCluster(b, st, { w: 1.10, h: 1.00, len: 1.00, throats: 1, seed: 115 });
      b.pop();
    }

    // ================================================================
    // LIGHTS — warm window repetition, keel walkway lamps, dorsal
    // running lamps, hangar interior glow, drive throats (inside above).
    // ================================================================
    // Keel walkway lamp run — lamps seated ON the keel top chord plate.
    // Keel at y=-3.8, h=0.5 → top chord at y=-3.3. Lamp center at −3.30;
    // bottom at −3.35, overlaps top chord at −3.30 ✓.
    {
      const keelY = -3.8 + 0.5;       // keel top chord Y (actual keel at y=-3.8, h=0.5)
      const kA    = -13.0;
      const kB    =  13.0;
      const kN    = Math.floor((kB - kA) / HUMAN.lampGap);
      for (let i = 0; i < kN; i++) {
        const lz = kA + i * HUMAN.lampGap;
        b.push(0, keelY, lz, 0, 0, 0);
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
    }

    // Dorsal running lamps — fore run (bow to cabin) and aft run (cabin to stern).
    // Lamps centered at y = hull_top + 0.04; bottom at hull_top − 0.01 ✓.
    {
      // Fore run: bow to just before cabin
      const fA = bowZ;
      const fB = -12.5;
      const fN = Math.floor((fB - fA) / HUMAN.lampGap);
      for (let i = 0; i < fN; i++) {
        const lz = fA + i * HUMAN.lampGap;
        const ls = sectionAt(stations, lz);
        b.push(0, ls.y + ls.h + 0.04, lz, 0, 0, 0);
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }

      // Aft run: just past cabin to stern approach
      const aA = -6.5;
      const aB =  13.5;
      const aN = Math.floor((aB - aA) / HUMAN.lampGap);
      for (let i = 0; i < aN; i++) {
        const lz = aA + i * HUMAN.lampGap;
        const ls = sectionAt(stations, lz);
        b.push(0, ls.y + ls.h + 0.04, lz, 0, 0, 0);
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
    }
  },
};
