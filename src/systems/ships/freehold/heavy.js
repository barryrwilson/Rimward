/**
 * Freehold Compact — Heavy Monitor
 *
 * Bible §4.3: "A reinforced work hull carrying bolt-on armor and defensive
 * turrets around an intact civilian core. Keep the greenhouse/cabin warmth
 * visible behind protection."
 *
 * Body plan: MILITIA MONITOR. A chunky, heavy-shouldered RECTANGULAR WORK
 * HULL — the widest, blockiest body under the frigate — wearing BOLT-ON
 * armour slabs over its flanks and bow that deliberately STOP SHORT of the
 * dorsal, leaving the greenhouse gallery and warm window rows of the intact
 * civilian core visible above the armour line. Blunt tug bow. Four militia
 * turrets on clean arcs. Side view: a low armoured mass with a glass house
 * sitting on top — unmistakable against every other class.
 *
 * Charter: target span 17.0 (largest on Z), hull 9,000–48,000 verts,
 * lights >= 600 and <= 25% of hull, singleMass >= 97%, glowZ 8.5.
 *
 * Armour line (y ≈ +1.40) vs greenhouse base (y ≈ +2.41): clear gap of
 * ~1.0 unit showing warm windows above armour and below glass.
 */

import {
  sectionAt, loftExtents, loftRib,
  splicedHull, patchCourse, glassHouse, tankVolume,
} from './body.js';
import {
  LAMP, GLASS, FLOOD,
  warmWindowRow, toolLocker, rescueWinch, boltOnArmour,
  militiaTurret, airlockCollar, deckPlate, driveCluster,
  floodLamp, patchPanel,
} from './motifs.js';
import { weather, box, cyl, torus } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const freeholdHeavy = {
  glowZ: 8.5,

  build(b, st) {
    // ==== STATIONS ====
    // MILITIA MONITOR: blunt tug bow, fast widening to a near-constant heavy
    // midships block, short taper to a broad stern. Low chamfers — a work
    // hull built for duty, not elegance.
    //
    // Budget: Z span 16.8 (−8.4 to +8.4), X span 7.7, Y span 5.1.
    // MILITIA MONITOR: LOW ARMORED BOW, HARD STEP UP TO RAISED MONITOR
    // CITADEL OVER FORWARD-MIDSHIPS, DECISIVE TAPER INTO AFT BLOCK.
    // Silhouette differentiator: bow h=1.50 → armor h=2.00 → HARD STEP h=3.20 → stern h=2.10.
    //
    // Budget: Z span 17.0 (−8.5 to +8.5), X span ~7.7, Y span 6.2.
    // Ratios: Z/X ≥ 1.15, Y/Z ≤ 0.60, X/Z ≥ 0.16.
    // Origin centred on all three axes.
    const stations = [
      { z: -8.5, w: 1.90, h: 1.50, c: 0.15 }, // blunt tug bow face (LOW - lowered from 1.80)
      { z: -7.0, w: 3.00, h: 2.00, c: 0.12 }, // fast widening, armored (LOW - lowered from 2.25)
      { z: -5.5, w: 3.75, h: 2.00, c: 0.10 }, // end of bow armour (LOW - lowered from 2.25)
      { z: -5.0, w: 3.78, h: 2.00, c: 0.05 }, // bow armor height, minimal chamfer for sharp step
      { z: -4.8, w: 3.80, h: 3.20, c: 0.05 }, // HARD STEP UP to citadel (raised from 2.80)
      { z: -1.0, w: 3.85, h: 3.20, c: 0.10 }, // monitor citadel peak (RAISED - from 2.85)
      { z:  1.5, w: 3.75, h: 3.05, c: 0.10 }, // citadel taper begins (raised from 2.70)
      { z:  4.0, w: 3.45, h: 2.65, c: 0.10 }, // decisive taper down (raised from 2.40)
      { z:  6.5, w: 3.15, h: 2.15, c: 0.10 }, // aft block (unchanged)
      { z:  8.5, w: 2.90, h: 2.10, c: 0.10 }, // stern (unchanged)
    ];

    const ext    = loftExtents(stations);
    const sternZ = ext.z1;  // 8.4
    const bowZ   = ext.z0;  // -8.4

    // ==== SPLICED HULL SHELL ====
    // Four donor sections from four different yards, reading left to right:
    // barn red bow, worn brown mid-bow, weathered aft section, faded blue
    // stern — a documented history in three seam straps.
    splicedHull(b, 'hull', [
      st.accent,
      st.hull,
      weather(st.hull, 1),
      st.patch[2],
    ], {
      stations,
      seams:    [-4.5, 1.5, 5.5],
      strap:    0.07,
      strapHex: st.trim,
      seed:     1,
    });

    // ==== PATCH COURSES ====
    // The four large flat faces of a monitor are most of its visible surface.
    // An under-budgeted monitor renders as a black box with guns on it; spend
    // the budget here. Tones cycle through the full donor palette so every
    // face shows the faction's patchwork language.
    const toneMain = [st.hull, weather(st.hull, 1), st.accent, st.patch[2], st.patch[1]];
    const toneDark = [st.hullDark, st.hull, weather(st.hull, 2), st.patch[2]];

    // Flanks (faces 0 and 4) — largest faces, densest plating.
    patchCourse(b, 'hull', toneMain, {
      stations, from: bowZ, to: sternZ,
      rows: 6, cols: 3, t: 0.055, inset: 0.14, seed: 1,
      faces: [0, 4], replaced: 0.18, proud: 0.035,
    });

    // Dorsal (face 2) — visible from above; the civilian layer sits on it.
    patchCourse(b, 'hull', toneMain, {
      stations, from: bowZ, to: sternZ,
      rows: 5, cols: 2, t: 0.050, inset: 0.14, seed: 11,
      faces: [2], replaced: 0.18, proud: 0.030,
    });

    // Ventral (face 6) — keel plating.
    patchCourse(b, 'hull', toneDark, {
      stations, from: bowZ, to: sternZ,
      rows: 5, cols: 2, t: 0.050, inset: 0.14, seed: 22,
      faces: [6], replaced: 0.15, proud: 0.030,
    });

    // Upper chamfers (faces 1 and 3) — armour–to–dorsal transition zone.
    patchCourse(b, 'hull', toneMain, {
      stations, from: bowZ, to: sternZ,
      rows: 3, cols: 2, t: 0.048, inset: 0.14, seed: 33,
      faces: [1, 3], replaced: 0.18, proud: 0.030,
    });

    // Lower chamfers (faces 5 and 7) — keel-side.
    patchCourse(b, 'hull', toneDark, {
      stations, from: bowZ, to: sternZ,
      rows: 3, cols: 1, t: 0.048, inset: 0.14, seed: 44,
      faces: [5, 7], replaced: 0.15, proud: 0.025,
    });

    // Extra flank density on the bow section — the most heavily armoured zone.
    patchCourse(b, 'hull', toneMain, {
      stations, from: bowZ, to: -4.5,
      rows: 3, cols: 2, t: 0.062, inset: 0.14, seed: 55,
      faces: [0, 4], replaced: 0.20, proud: 0.040,
    });

    // Extra dorsal density at the stern — drive mount and deck walkway area.
    patchCourse(b, 'hull', toneMain, {
      stations, from: 4.0, to: sternZ,
      rows: 3, cols: 2, t: 0.050, inset: 0.14, seed: 66,
      faces: [2], replaced: 0.15, proud: 0.025,
    });

    // ==== RIB FRAMES ====
    // A reinforced work hull shows its frames. Seven ribs at structural
    // stations: bow taper, block entry, mid, midships, aft, stern taper, aft.
    for (const [rz, rout, rthick] of [
      [-7.2, 0.08, 0.14],
      [-5.0, 0.09, 0.14],
      [-2.0, 0.10, 0.15],
      [ 0.0, 0.10, 0.15],
      [ 2.0, 0.10, 0.15],
      [ 5.5, 0.09, 0.14],
      [ 7.5, 0.08, 0.14],
    ]) {
      loftRib(b, 'hull', st.trim, { stations, z: rz, out: rout, thick: rthick });
    }

    // ==== BOLT-ON ARMOUR ====
    // Large mismatched slabs on both flanks and across the bow, with VISIBLE
    // GAPS between sections. Bow armour ends at z ≈ -5.0, midship armour begins
    // at z ≈ -2.5, creating a clear STEP in the armour line.
    //
    // Armour covers the lower portion of the flanks (armour top ≈ y +1.25),
    // leaving the raised citadel dorsal clear for the civilian core.
    //
    // Different sizes per side — different supply yards, different plate stock.
    // Stand = 0.14 so pads (back edge at -stand*1.3 = -0.182) reach INTO the
    // hull body, while the slab (at +stand = +0.14) stands visibly proud.
    //
    // Placement: frame origin ON the hull flank surface (x = ±sec.w).
    // ry = Math.PI/2 maps local +Z → world +X (starboard outward).
    // ry = −Math.PI/2 maps local +Z → world −X (port outward).

    // --- Starboard flank slabs ---
    const starbSlabs = [
      // [z_ctr, y_ctr, w_along_Z, h_vert, d, seed]
      [-6.0, -0.35, 2.0, 2.8, 0.18, 101],  // bow armour (ends at z=-5.0)
      [-2.5, -0.30, 2.2, 3.0, 0.20, 102],  // gap: -5.0 to -3.6 visible
      [ 0.5, -0.25, 2.8, 3.1, 0.18, 103],  // midship armour
      [ 3.8, -0.35, 2.4, 2.6, 0.18, 104],  // aft armour
    ];
    for (const [sz, sy, sw, sh, sd, sseed] of starbSlabs) {
      const sec = sectionAt(stations, sz);
      b.push(sec.w, sy, sz, Math.PI / 2, 0, 0);
      boltOnArmour(b, st, { w: sw, h: sh, d: sd, stand: 0.14, seed: sseed });
      b.pop();
    }

    // --- Port flank slabs (slightly different dimensions — different yard) ---
    const portSlabs = [
      [-5.8, -0.25, 2.2, 2.8, 0.18, 201],  // bow armour (ends at z=-4.7)
      [-2.3, -0.30, 2.0, 3.0, 0.18, 202],  // gap: -4.7 to -3.3 visible
      [ 0.8, -0.25, 3.0, 2.9, 0.20, 203],  // midship armour
      [ 4.2, -0.40, 2.2, 2.6, 0.18, 204],  // aft armour
    ];
    for (const [pz, py, pw, ph, pd, pseed] of portSlabs) {
      const sec = sectionAt(stations, pz);
      b.push(-sec.w, py, pz, -Math.PI / 2, 0, 0);
      boltOnArmour(b, st, { w: pw, h: ph, d: pd, stand: 0.14, seed: pseed });
      b.pop();
    }

    // --- Bow face slabs (ry = π so local +Z → world −Z = outward from bow) ---
    // Two slabs: upper and lower. Pads go INTO hull body at z > bowZ.
    b.push(0,  0.40, bowZ, Math.PI, 0, 0);
    boltOnArmour(b, st, { w: 1.50, h: 1.00, d: 0.18, stand: 0.12, seed: 301 });
    b.pop();
    b.push(0, -0.55, bowZ, Math.PI, 0, 0);
    boltOnArmour(b, st, { w: 1.40, h: 0.90, d: 0.18, stand: 0.12, seed: 302 });
    b.pop();

    // ==== PATCH PANELS — clearly replaced hull sections ====
    // Three panels in conspicuously different tones with visible weld straps.
    {
      const pp1 = sectionAt(stations, -4.0);
      b.push(pp1.w, 0.80, -4.0, Math.PI / 2, 0, 0);
      patchPanel(b, st, { w: 0.70, h: 0.85, i: 1, proud: 0.05, seed: 401 });
      b.pop();

      const pp2 = sectionAt(stations, -1.5);
      b.push(-pp2.w, 1.00, -1.5, -Math.PI / 2, 0, 0);
      patchPanel(b, st, { w: 0.80, h: 0.90, i: 0, proud: 0.05, seed: 402 });
      b.pop();

      const pp3 = sectionAt(stations, 2.5);
      b.push(pp3.w, -0.40, 2.5, Math.PI / 2, 0, 0);
      patchPanel(b, st, { w: 0.75, h: 0.80, i: 2, proud: 0.06, seed: 403 });
      b.pop();
    }

    // ==== CIVILIAN CORE — MONITOR BRIDGE AND WARM WINDOW BAND ====
    //
    // With the stepped profile, the citadel rises above the armour line.
    // Armour slabs cover y ≤ +1.25 (bow/forward sections).
    // The monitor bridge cabin sits on the raised citadel at y ≈ +3.0.
    // A prominent warm window band at y ≈ +2.0–+2.3 shows the intact
    // civilian core between bolt-on protection and the bridge.
    //
    // Sequence: armour (≤ +1.25) · window band (+1.9–+2.3) · bare hull
    // transition · monitor bridge (+2.8–+3.5).

    // --- Monitor bridge cabin on the raised citadel, forward-midships ---
    // Smaller than the family greenhouse, reads as a monitor bridge.
    {
      const mbZ   = -1.5;
      const mbSec = sectionAt(stations, mbZ);
      b.push(0, 0, mbZ, 0, 0, 0);
      glassHouse(b, st, {
        w: 0.60, h: 0.65, d: 3.20,
        y: mbSec.y + mbSec.h + 0.15,
        bays: 3, seed: 7,
      });
      b.pop();
    }

    // --- Prominent warm window band between armour and bridge ---
    // Two tall rows per side, positioned in the clear zone above armour
    // and below the monitor bridge. Shows the intact civilian core.
    {
      // Forward window band (where armour mass is highest)
      const wf = sectionAt(stations, -4.0);
      b.push( wf.w, 2.10, -4.0,  Math.PI / 2, 0, 0);
      warmWindowRow(b, st, { count: 5, sill: true });
      b.pop();
      b.push(-wf.w, 2.10, -4.0, -Math.PI / 2, 0, 0);
      warmWindowRow(b, st, { count: 5, sill: true });
      b.pop();

      // Aft window band (still visible on the citadel taper)
      const wa = sectionAt(stations, 1.0);
      b.push( wa.w, 2.00, 1.0,  Math.PI / 2, 0, 0);
      warmWindowRow(b, st, { count: 4, sill: true, dim: true });
      b.pop();
      b.push(-wa.w, 2.00, 1.0, -Math.PI / 2, 0, 0);
      warmWindowRow(b, st, { count: 4, sill: true, dim: true });
      b.pop();
    }

    // --- Deck plate with railing along the dorsal, aft of greenhouse ---
    // Back edge of plate at z = deckZ − d*0.40 overlaps hull dorsal body.
    {
      const dkZ  = 2.5;
      const dkSec = sectionAt(stations, dkZ);
      b.push(0, dkSec.y + dkSec.h, dkZ, 0, 0, 0);
      deckPlate(b, st, { w: 1.60, d: 3.20, rail: true, lamps: 3, seed: 3 });
      b.pop();
    }

    // --- Water tank pair carried on dorsal, aft of greenhouse ---
    // Tanks run along Z, placed either side of the centreline.
    // y = hull_top + r + 0.05 puts the saddle base at hull_top − 0.05,
    // inside the hull dorsal → attach audit sees saddle overlapping hull.
    {
      const tR  = 0.30;
      const tLen = 2.00;
      for (const [tx, tz, tseed] of [[-0.54, 4.0, 11], [0.54, 4.0, 12]]) {
        const tSec = sectionAt(stations, tz);
        b.push(tx, 0, tz, 0, 0, 0);
        tankVolume(b, st, {
          r:    tR,
          len:  tLen,
          y:    tSec.y + tSec.h + tR + 0.05,
          axis: 'z',
          hoops: 3,
          seed: tseed,
        });
        b.pop();
      }
    }
    // ==== MILITIA TURRETS ====
    const tR = 0.50;  // Increased from 0.30 for silhouette prominence
    const tH = 0.45;  // Increased from 0.28 for visible housing
    const tBarbR = 0.38;  // Barbette base radius
    const tBarbH = 0.18;  // Barbette height

    // Four turrets on clean arcs: two forward dorsal shoulders, one aft
    // dorsal, one ventral forward.
    //
    // Each turret's mounting flange (radius r*1.55) is placed with its
    // back edge reaching into the hull body for attachment.
    //
    // Forward starboard shoulder — UPPER BOW SHOULDER on raised citadel.
    // Raised to silhouette above armour line, barrel arc toward bow (−Z).
    {
      const ts = sectionAt(stations, -5.2);
      const ty = ts.y + ts.h + tBarbH;  // Base on citadel top
      
      // Barbette base — solid foundation ring
      b.push(ts.w, ty, -5.2, 0, 0, 0);
      cyl(b, 'hull', weather(st.hull, 1), tBarbR, tBarbR, tBarbH, 8, {
        rx: Math.PI / 2,
      });
      // Barbette top ring — slightly wider trim band
      torus(b, 'hull', st.trim, tBarbR * 1.05, tBarbH * 0.15, 8, 10, undefined, {
        rx: Math.PI / 2,
        y: tBarbH,
      });
      // Main turret housing on top of barbette
      militiaTurret(b, st, { r: tR, h: tH, barrels: 2, ry: 0, seed: 501 });
      b.pop();
    }

    // Forward port shoulder — mirrors starboard on upper citadel.
    {
      const ts = sectionAt(stations, -5.2);
      const ty = ts.y + ts.h + tBarbH;  // Base on citadel top
      
      b.push(-ts.w, ty, -5.2, 0, 0, 0);
      cyl(b, 'hull', weather(st.hull, 1), tBarbR, tBarbR, tBarbH, 8, {
        rx: Math.PI / 2,
      });
      torus(b, 'hull', st.trim, tBarbR * 1.05, tBarbH * 0.15, 8, 10, undefined, {
        rx: Math.PI / 2,
        y: tBarbH,
      });
      militiaTurret(b, st, { r: tR, h: tH, barrels: 2, ry: 0, seed: 502 });
      b.pop();
    }

    // Aft dorsal — on hull top, outer ry=π rotates the barrel arc toward stern.
    {
      const ta = sectionAt(stations, 4.0);
      const ty = ta.y + ta.h + tBarbH;
      
      b.push(0, ty, 4.0, Math.PI, 0, 0);
      cyl(b, 'hull', weather(st.hull, 1), tBarbR, tBarbR, tBarbH, 8, {
        rx: Math.PI / 2,
      });
      torus(b, 'hull', st.trim, tBarbR * 1.05, tBarbH * 0.15, 8, 10, undefined, {
        rx: Math.PI / 2,
        y: tBarbH,
      });
      militiaTurret(b, st, { r: tR, h: tH, barrels: 2, ry: 0, seed: 503 });
      b.pop();
    }

    // Ventral forward — below hull at z = −0.5, fires toward bow (−Z).
    {
      const tv = sectionAt(stations, -0.5);
      const ty = -(tv.y + tv.h) - tBarbH - 0.05;
      
      b.push(0, ty, -0.5, 0, 0, 0);
      cyl(b, 'hull', weather(st.hull, 1), tBarbR, tBarbR, tBarbH, 8, {
        rx: Math.PI / 2,
      });
      torus(b, 'hull', st.trim, tBarbR * 1.05, tBarbH * 0.15, 8, 10, undefined, {
        rx: Math.PI / 2,
        y: tBarbH,
      });
      militiaTurret(b, st, { r: tR, h: tH, barrels: 2, ry: 0, seed: 504 });
      b.pop();
    }

    // ==== RESCUE AND UTILITY GEAR ====

    // Rescue winch on the dorsal, forward of greenhouse.
    // Saddle back edge at z = −r*1.05 reaches into hull body.
    {
      const ws = sectionAt(stations, -2.8);
      b.push(0.55, ws.y + ws.h, -2.8, 0, 0, 0);
      rescueWinch(b, st, { r: 0.22, len: 0.34, seed: 5 });
      b.pop();
    }

    // Airlock collar on starboard mid-hull.
    // ry=π/2 → shank extends into +X hull body; collar ring faces outward.
    {
      const cs = sectionAt(stations, -0.8);
      b.push(cs.w, -0.40, -0.8, Math.PI / 2, 0, 0);
      airlockCollar(b, st, { len: 0.50, seed: 6 });
      b.pop();
    }

    // Tool lockers on flanks (3 total, one in the gaps between armour slabs).
    {
      const lockers = [
        [-5.5,  0.80,  Math.PI / 2, 21],  // starboard, bow block
        [ 2.0, -0.80,  Math.PI / 2, 22],  // starboard, aft block
        [-2.5, -0.60, -Math.PI / 2, 23],  // port, midships
      ];
      for (const [lz, ly, lry, lseed] of lockers) {
        const lSec = sectionAt(stations, lz);
        b.push(lry > 0 ? lSec.w : -lSec.w, ly, lz, lry, 0, 0);
        toolLocker(b, st, { w: 0.50, h: 0.42, d: 0.72, seed: lseed });
        b.pop();
      }
    }

    // Flood lamps on the deck walkway.
    // Mounting plate back edge (z = −arm*0.95) overlaps the deck plate body.
    {
      const fd = sectionAt(stations, 2.5);
      b.push(-0.55, fd.y + fd.h + 0.06, 2.5, 0, 0, 0);
      floodLamp(b, st, { r: 0.14, arm: 0.22, tilt: 0.18 });
      b.pop();
      b.push( 0.55, fd.y + fd.h + 0.06, 2.5, 0, 0, 0);
      floodLamp(b, st, { r: 0.14, arm: 0.22, tilt: 0.18 });
      b.pop();
    }

    // ==== DRIVE CLUSTERS ====
    // Two clusters side by side at the broad stern, 3 throats each.
    // Push at z = sternZ; drive housing extends from z = sternZ − len to
    // z = sternZ, overlapping the stern section of the hull body.
    {
      const ss   = sectionAt(stations, sternZ - 0.10);
      const dW   = ss.w * 0.40;
      const dH   = ss.h * 0.44;
      const dLen = 1.30;
      for (const sx of [-1, 1]) {
        b.push(sx * ss.w * 0.46, 0, sternZ, 0, 0, 0);
        driveCluster(b, st, {
          w: dW, h: dH, len: dLen, throats: 3,
          seed: sx > 0 ? 31 : 36,
        });
        b.pop();
      }
    }

    // ==== LIGHTS ====

    // Dorsal walkway lamp run — on the hull top, bow to stern.
    // Count from HUMAN.lampGap; individual boxes seat on the dorsal surface.
    {
      const lStart = -7.8;
      const lEnd   =  7.8;
      const lCount = Math.floor((lEnd - lStart) / HUMAN.lampGap);
      for (let i = 0; i < lCount; i++) {
        const lz  = lStart + i * HUMAN.lampGap;
        const lSec = sectionAt(stations, lz);
        b.push(0, lSec.y + lSec.h + 0.04, lz, 0, 0, 0);
        box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
    }

    // Ventral lamp run — on the keel underside.
    {
      const vStart = -7.5;
      const vEnd   =  7.5;
      const vCount = Math.floor((vEnd - vStart) / HUMAN.lampGap);
      for (let i = 0; i < vCount; i++) {
        const lz  = vStart + i * HUMAN.lampGap;
        const lSec = sectionAt(stations, lz);
        b.push(0, -(lSec.y + lSec.h) - 0.04, lz, 0, 0, 0);
        box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
    }
  },
};
