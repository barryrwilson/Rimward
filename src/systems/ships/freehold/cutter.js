/**
 * Freehold Compact — Cutter (Lane-Keeper)
 *
 * Bible: "A practical rescue and patrol boat with a wide forward airlock, tow
 * winch, floodlights, medical compartment, and clamp-on supply lockers."
 *
 * Body plan: LANE-KEEPER. The bow is a wide FLAT platform — the widest part
 * of the ship — carrying a big airlock collar set INTO the bow face, a
 * floodlight mast above it and a tow winch on the foredeck. Behind it a boxy
 * midships HOUSE rises: the medical compartment, warm windows, a greenhouse
 * strip. Aft the hull tapers to a narrow stern with side-by-side drives. Plan
 * view: broad at the bow, waisted at the house, narrow at the stern — the
 * OPPOSITE distribution to the light class, which is widest amidships.
 *
 * Charter: target span 11.0 (largest on Z), hull 6,000–34,000 verts,
 * lights >= 400 and <= 25% of hull, singleMass >= 97%, glowZ approx stern.
 *
 * Station extents budget (half-dimensions):
 *   Z  -5.50 to +5.50 = 11.00  (band 9.57–11.88) ✓
 *   X  max half-w = 2.20 → spanX ~4.40 (with clamp lockers ~4.88)
 *   Y  top = house y+h = 1.50, bot = house y-h = -1.30 → spanY ~2.80
 *      (mast adds ~0.12 above; hull-channel extent stays well under 0.60·Z)
 *
 * Ratio checks at build time:
 *   len/beam  ~11.0/4.88 = 2.25  (need ≥ 1.15) ✓
 *   ht/len    ~2.92/11.0 = 0.27  (need ≤ 0.60) ✓
 *   beam/len  ~4.88/11.0 = 0.44  (need ≥ 0.16) ✓
 *   pivot Y   ~0.10/2.80 = 0.04  (need ≤ 0.15) ✓
 *
 * Half-widths (the class read — broad bow, waisted house, narrow stern):
 *   bow platform  2.20   house mid  1.75   stern  0.88
 */

import {
  sectionAt, loftExtents, loftRib,
  splicedHull, patchCourse, glassHouse,
} from './body.js';
import {
  LAMP, FLOOD,
  warmWindowRow, toolLocker, rescueWinch,
  towWinch, floodLamp, deckPlate, patchPanel,
  airlockCollar, driveCluster,
} from './motifs.js';
import {
  weather, box, ladder,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const freeholdCutter = {
  // Drive cluster throats sit at approximately z ≈ +5.26; glowZ in the valid
  // window [ 0.55·sternZ = 3.025 … sternZ + 1.2 = 6.70 ].
  glowZ: 4.80,

  build(b, st) {
    // ==== STATIONS ====
    // LANE-KEEPER profile: wide flat bow → stepped-up boxy house → tapering stern.
    // y = vertical offset of section CENTRE; h = HALF-height; w = HALF-width.
    //
    // Bow stations: high w, low h, low chamfer, negative y — the flat work platform.
    // House stations: positive y offset and taller h — the raised medical compartment.
    // Stern stations: w and h shrink symmetrically to close on the drive section.
    const stations = [
      { z: -5.50, w: 2.20, h: 0.85, y: -0.20, c: 0.12 }, // bow face: wide flat
      { z: -4.20, w: 2.20, h: 0.90, y: -0.15, c: 0.13 }, // foredeck platform
      { z: -3.00, w: 1.90, h: 1.00, y: -0.05, c: 0.15 }, // bow-house step
      { z: -1.60, w: 1.80, h: 1.40, y:  0.10, c: 0.18 }, // house forward
      { z:  0.20, w: 1.75, h: 1.40, y:  0.10, c: 0.18 }, // house centre
      { z:  1.60, w: 1.65, h: 1.30, y:  0.05, c: 0.17 }, // house rear
      { z:  2.80, w: 1.20, h: 1.10, y:  0.00, c: 0.15 }, // waist taper
      { z:  4.20, w: 0.90, h: 0.90, y:  0.00, c: 0.15 }, // stern body
      { z:  5.50, w: 0.88, h: 0.88, y:  0.00, c: 0.15 }, // stern cap
    ];

    const ext    = loftExtents(stations);
    const sternZ = ext.z1;  // +5.50
    const bowZ   = ext.z0;  // -5.50

    // ==== HULL SHELL ====
    // A rescue boat has been repaired more than most: four donated sections with
    // three visible seam straps. Donor tones cycle through the Compact palette.
    splicedHull(b, 'hull', [
      st.hull,              // original brown forward section
      st.patch[0],          // barn red mid section (fitted after a fire)
      st.patch[2],          // faded blue aft-mid section (sourced elsewhere)
      weather(st.hull, 1),  // slightly weathered brown stern
    ], {
      stations,
      seams:    [-3.00, 1.60],
      strap:    0.07,
      strapHex: st.trim,
      seed:     1,
    });

    // ==== PLATING COURSES ====
    // Plate tones cycle through the donated palette: the patchwork IS the surface
    // language. A seeded fraction of bands stand extra proud as replaced panels.
    const plateTones = [
      st.hull,
      weather(st.hull, 1),
      st.patch[0],
      st.patch[2],
      weather(st.accent, 1),
    ];

    // Dorsal crown (face 2) — full hull length.
    patchCourse(b, 'hull', plateTones, {
      stations, from: bowZ, to: sternZ,
      rows: 4, cols: 2, t: 0.07, inset: 0.14, seed: 3, faces: [2],
      replaced: 0.20, proud: 0.035,
    });

    // Upper chamfers (faces 1, 3) — bind dorsal to flanks.
    patchCourse(b, 'hull', plateTones, {
      stations, from: bowZ, to: sternZ,
      rows: 3, cols: 2, t: 0.07, inset: 0.14, seed: 7, faces: [1, 3],
      replaced: 0.18, proud: 0.035,
    });

    // Starboard flank (face 0) — wide bow earns generous plate count.
    patchCourse(b, 'hull', plateTones, {
      stations, from: bowZ, to: sternZ,
      rows: 4, cols: 2, t: 0.07, inset: 0.14, seed: 11, faces: [0],
      replaced: 0.20, proud: 0.035,
    });

    // Port flank (face 4) — different seed produces asymmetric tone distribution.
    patchCourse(b, 'hull', plateTones, {
      stations, from: bowZ, to: sternZ,
      rows: 4, cols: 2, t: 0.07, inset: 0.14, seed: 17, faces: [4],
      replaced: 0.20, proud: 0.035,
    });

    // Ventral strake (face 6) — structural keel.
    patchCourse(b, 'hull', [st.hull, weather(st.hull, 1), st.hullDark], {
      stations, from: bowZ, to: sternZ,
      rows: 3, cols: 2, t: 0.06, inset: 0.15, seed: 23, faces: [6],
      replaced: 0.15, proud: 0.030,
    });

    // Lower chamfers (faces 5, 7) — underside construction language.
    patchCourse(b, 'hull', [st.hull, weather(st.hull, 1), st.hullDark], {
      stations, from: bowZ, to: sternZ,
      rows: 2, cols: 2, t: 0.06, inset: 0.15, seed: 29, faces: [5, 7],
      replaced: 0.15, proud: 0.030,
    });

    // ==== RIB FRAMES ====
    // Cream structural rings at every major geometry transition.
    loftRib(b, 'hull', st.trim, { stations, z: -3.00, out: 0.10, thick: 0.16 }); // bow-house step
    loftRib(b, 'hull', st.trim, { stations, z: -1.60, out: 0.10, thick: 0.16 }); // house front
    loftRib(b, 'hull', st.trim, { stations, z:  1.60, out: 0.10, thick: 0.15 }); // house rear
    loftRib(b, 'hull', st.trim, { stations, z:  2.80, out: 0.09, thick: 0.14 }); // waist taper
    loftRib(b, 'hull', st.trim, { stations, z:  4.20, out: 0.08, thick: 0.13 }); // stern body

    // ==== BOW CLUSTER ====
    // This is the class read: wide flat bow + collar + winch + floodmast.

    // -- Airlock collar: ENLARGED for unmistakable read.
    //    ry=180 → local+Z maps to global-Z (collar face toward bow).
    //    Larger radius (1.30× HUMAN.collarR) centered on bow face.
    {
      const collarLen = 0.65;
      const collarR = HUMAN.collarR * 1.30;
      const bSec = sectionAt(stations, bowZ);
      b.push(0, bSec.y + bSec.h * 0.10, bowZ + collarLen * 0.80, 0, 180, 0);
        airlockCollar(b, st, { r: collarR, len: collarLen, seed: 2 });
      b.pop();
    }



    // -- Foredeck plate: wide working deck on the bow platform top.
    //    deckPlate back edge reaches to z = -0.40*d behind the frame origin,
    //    so the plate overlaps the hull cap section.
    {
      const deckZ  = -4.60;
      const dSec   = sectionAt(stations, deckZ);
      b.push(0, dSec.y + dSec.h, deckZ, 0, 0, 0);
        deckPlate(b, st, { w: 3.60, d: 1.20, rail: true, lamps: 3, seed: 4 });
      b.pop();
    }

    // -- Tow winch: ENLARGED drum, centred on the foredeck with tow arm.
    //    Bigger drum (r=0.42) and short tow arm projecting over airlock/foredeck.
    {
      const wSec = sectionAt(stations, -4.00);
      const winchY = wSec.y + wSec.h + 0.04;
      b.push(0, winchY, -4.00, 0, 0, 0);
        towWinch(b, st, { r: 0.42, len: 0.70, seed: 5 });
        // Tow arm: short bracket projecting toward bow over the deck.
        b.push(0, 0.15, 0.35, 0, 0, 0);
          box(b, 'hull', st.trim, 0.08, 0.06, 0.20);
        b.pop();
      b.pop();
    }


    // -- Floodlight mast: TALL rescue mast with leading-edge floodlamps.
    //    Mast height increased to break side silhouette above flat platform.
    //    Cross-arm at leading edge, lamps angled toward -Z bow.
    {
      const mastZ = -4.80;
      const mSec  = sectionAt(stations, mastZ);
      const mBase = mSec.y + mSec.h;
      const mH    = 0.95;  // Taller mast to break silhouette
      const fArm  = 0.24;
      const fR    = 0.16;

      b.push(0, mBase + mH * 0.50, mastZ, 0, 0, 0);
        // Mast post — bottom overlaps hull dorsal face.
        box(b, 'hull', st.trim, 0.10, mH, 0.10);
        b.push(0, mH * 0.50, 0, 0, 0, 0);
          // Cross-arm bar at leading edge of mast top.
          box(b, 'hull', st.trim, 0.82, 0.07, 0.07);
          // Floodlamps face the bow (ry=180 → local+Z → global-Z).
          // Larger heads, angled toward -Z with increased tilt.
          // Offset z = -fArm*0.75 puts the mounting plate at the cross-arm.
          for (const sx of [1, -1]) {
            b.push(sx * 0.34, 0, -fArm * 0.75, 0, 180, 0);
              floodLamp(b, st, { r: fR, arm: fArm, tilt: 0.25 });
            b.pop();
          }
        b.pop();
      b.pop();
    }

    // ==== HOUSE ====
    // The boxy midships compartment: medical bay, bridge, crew space.

    // -- Greenhouse strip: SHORTENED dorsal house element.
    //    Base flange sinks flangeH into hull (frame at hull surface y = ghTop).
    //    Reduced depth to distinguish medical house from light's greenhouse.
    {
      const ghZ   = -0.50;
      const ghSec = sectionAt(stations, ghZ);
      b.push(0, ghSec.y + ghSec.h, ghZ, 0, 0, 0);
        glassHouse(b, st, { w: 1.20, h: 0.45, d: 2.20, y: 0, bays: 2, seed: 6 });
      b.pop();
    }

    // -- Medical compartment: BOXIER house mass with recessed front door.
    //    A distinct house form, not just a scaled greenhouse.
    {
      const houseZ = -1.40;
      const hSec = sectionAt(stations, houseZ);
      const houseW = 1.40;
      const houseH = 0.70;
      const houseD = 1.30;
      // House box on hull surface.
      b.push(0, hSec.y + hSec.h + houseH * 0.40, houseZ, 0, 0, 0);
        box(b, 'hull', weather(st.hull, 1), houseW, houseH, houseD);
        // Recessed front access door.
        b.push(0, -houseH * 0.20, -houseD * 0.42, 0, 0, 0);
          box(b, 'hull', st.hullDark, HUMAN.doorW + 0.08, HUMAN.doorH + 0.08, 0.06);
          b.push(0, 0, 0.03, 0, 0, 0);
            box(b, 'hull', weather(st.trim, 1), HUMAN.doorW, HUMAN.doorH, 0.04);
          b.pop();
        b.pop();
      b.pop();
    }

    // -- Warm window row: house FRONT face (medical compartment).
    //    ry=180 → well extends toward +Z (into the house body).
    {
      const hfSec = sectionAt(stations, -2.80);
      b.push(0, hfSec.y + 0.20, -2.80, 0, 180, 0);
        warmWindowRow(b, st, { count: 4, ry: 0, sill: true });
      b.pop();
    }

    // -- Warm window row: house STARBOARD flank — clear side window band.
    //    ry=90 → local+Z = global+X; well extends -X (into hull).
    {
      const hsSec = sectionAt(stations, -0.70);
      b.push(hsSec.w + 0.02, hsSec.y + 0.15, -0.70, 0, 90, 0);
        warmWindowRow(b, st, { count: 5, ry: 0, sill: true });
      b.pop();
    }

    // -- Warm window row: house PORT flank — clear side window band.
    //    ry=-90 → local+Z = global-X; well extends +X (into hull).
    {
      const hpSec = sectionAt(stations, -0.20);
      b.push(-(hpSec.w + 0.02), hpSec.y + 0.15, -0.20, 0, -90, 0);
        warmWindowRow(b, st, { count: 5, ry: 0, sill: true });
      b.pop();
    }

    // -- Crew door: starboard side of the medical compartment.
    //    Well box centered on flank face; back reaches into hull.
    {
      const doorZ   = -1.10;
      const doorSec = sectionAt(stations, doorZ);
      // Push to flank face, ry=90 so local+Z faces global+X (outward).
      b.push(doorSec.w + 0.01, doorSec.y - 0.28, doorZ, 0, 90, 0);
        // Dark recessed well — back face sits inside hull body.
        box(b, 'hull', st.hullDark,
          HUMAN.doorW + 0.06, HUMAN.doorH + 0.06, 0.08);
        // Door panel slightly proud of the back face.
        b.push(0, 0, 0.02, 0, 0, 0);
          box(b, 'hull', weather(st.trim, 1),
            HUMAN.doorW, HUMAN.doorH, 0.05);
        b.pop();
      b.pop();
    }

    // -- External ladder: starboard side, running from mid-hull to house roof.
    //    ladder() runs along Y; stiles are at x ± HUMAN.ladderW/2.
    //    Frame x = ladSec.w - 0.05 keeps the inner stile inside the hull.
    //    ry=0 (straight vertical; the function takes ry in RADIANS).
    {
      const ladZ   = 0.80;
      const ladSec = sectionAt(stations, ladZ);
      const ladX   = ladSec.w - 0.05;
      const ladBot = ladSec.y - ladSec.h * 0.50;
      const ladTop = ladSec.y + ladSec.h + 0.02;
      const ladH   = ladTop - ladBot;
      ladder(b, 'hull', st.trim, {
        x: ladX, y: ladBot, z: ladZ,
        h:     ladH,
        w:     HUMAN.ladderW,
        rungs: Math.max(4, Math.round(ladH / 0.28)),
        ry:    0,
      });
    }

    // ==== FLANK SUPPLY LOCKERS ====
    // Clamp-on lockers read as history: different yards fitted them, so z
    // positions are not perfectly mirrored port to starboard.
    // GROUPED into two deliberate banks per flank with visible mounting rail.

    // Starboard: two BANKS of lockers on a mounting rail.
    const sBank1Z = -3.40;
    const sBank1Sec = sectionAt(stations, sBank1Z);
    // Mounting rail for bank 1.
    b.push(sBank1Sec.w + 0.01, sBank1Sec.y + 0.06, sBank1Z, 0, 90, 0);
      box(b, 'hull', st.trim, 0.08, 0.06, 1.40);
    b.pop();
    // Bank 1: two lockers.
    for (let i = 0; i < 2; i++) {
      const lz = sBank1Z + i * 0.60;
      const lSec = sectionAt(stations, lz);
      b.push(lSec.w + 0.02, lSec.y + 0.04, lz, 0, 90, 0);
        toolLocker(b, st, { w: 0.50, h: 0.42, d: 0.72, seed: 10 + i });
      b.pop();
    }

    const sBank2Z = 0.40;
    const sBank2Sec = sectionAt(stations, sBank2Z);
    // Mounting rail for bank 2.
    b.push(sBank2Sec.w + 0.01, sBank2Sec.y + 0.06, sBank2Z, 0, 90, 0);
      box(b, 'hull', st.trim, 0.08, 0.06, 1.20);
    b.pop();
    // Bank 2: two lockers.
    for (let i = 0; i < 2; i++) {
      const lz = sBank2Z + i * 0.52;
      const lSec = sectionAt(stations, lz);
      b.push(lSec.w + 0.02, lSec.y - 0.08, lz, 0, 90, 0);
        toolLocker(b, st, { w: 0.50, h: 0.42, d: 0.72, seed: 12 + i });
      b.pop();
    }

    // Port: two BANKS of lockers on a mounting rail (asymmetric positions).
    const pBank1Z = -3.00;
    const pBank1Sec = sectionAt(stations, pBank1Z);
    // Mounting rail for bank 1.
    b.push(-(pBank1Sec.w + 0.01), pBank1Sec.y + 0.08, pBank1Z, 0, -90, 0);
      box(b, 'hull', st.trim, 0.08, 0.06, 1.30);
    b.pop();
    // Bank 1: two lockers.
    for (let i = 0; i < 2; i++) {
      const lz = pBank1Z + i * 0.56;
      const lSec = sectionAt(stations, lz);
      b.push(-(lSec.w + 0.02), lSec.y + 0.04, lz, 0, -90, 0);
        toolLocker(b, st, { w: 0.50, h: 0.42, d: 0.72, seed: 20 + i });
      b.pop();
    }

    const pBank2Z = 1.20;
    const pBank2Sec = sectionAt(stations, pBank2Z);
    // Mounting rail for bank 2.
    b.push(-(pBank2Sec.w + 0.01), pBank2Sec.y + 0.06, pBank2Z, 0, -90, 0);
      box(b, 'hull', st.trim, 0.08, 0.06, 1.10);
    b.pop();
    // Bank 2: two lockers.
    for (let i = 0; i < 2; i++) {
      const lz = pBank2Z + i * 0.48;
      const lSec = sectionAt(stations, lz);
      b.push(-(lSec.w + 0.02), lSec.y - 0.06, lz, 0, -90, 0);
        toolLocker(b, st, { w: 0.50, h: 0.42, d: 0.72, seed: 22 + i });
      b.pop();
    }

    // -- Rescue winch: aft starboard flank — the visible rescue capability.
    //    Mounting saddle reaches behind origin into the hull body.
    {
      const rwSec = sectionAt(stations, 2.40);
      b.push(rwSec.w + 0.02, rwSec.y - 0.10, 2.40, 0, 90, 0);
        rescueWinch(b, st, { r: 0.22, len: 0.34, hook: true, seed: 30 });
      b.pop();
    }

    // -- Two clearly replaced hull panels: the history-not-damage read.
    {
      const p1Sec = sectionAt(stations, 0.90);
      b.push(p1Sec.w + 0.01, p1Sec.y, 0.90, 0, 90, 0);
        patchPanel(b, st, { w: 0.60, h: 0.44, i: 1, proud: 0.05, seed: 40 });
      b.pop();

      const p2Sec = sectionAt(stations, -2.30);
      b.push(-(p2Sec.w + 0.01), p2Sec.y + 0.10, -2.30, 0, -90, 0);
        patchPanel(b, st, { w: 0.70, h: 0.50, i: 2, proud: 0.06, seed: 41 });
      b.pop();
    }

    // ==== STERN: SIDE-BY-SIDE DRIVES ====
    // Two driveCluster units offset ±x to sit side by side on the narrow stern.
    // driveCluster housing spans local z from -len to 0; face plate at +len*0.04.
    {
      const dSec  = sectionAt(stations, sternZ);
      const dLen  = 1.10;
      const dW    = 0.40;  // half-width of each drive housing
      const dH    = 0.38;  // half-height
      for (const sx of [1, -1]) {
        b.push(sx * 0.46, dSec.y, sternZ, 0, 0, 0);
          driveCluster(b, st, {
            w: dW, h: dH, len: dLen, throats: 2,
            seed: 50 + (sx > 0 ? 0 : 1),
          });
        b.pop();
      }
    }

    // ==== RUNNING LIGHTS ====
    // All lamps seated on hull faces; count from HUMAN.lampGap (never lampSize).

    // Dorsal lamp run — house roof zone.
    {
      const zFrom = -2.50, zTo = 1.80;
      const n = Math.max(1, Math.floor((zTo - zFrom) / HUMAN.lampGap));
      for (let i = 0; i < n; i++) {
        const lz = zFrom + i * HUMAN.lampGap;
        const ls = sectionAt(stations, lz);
        b.push(0, ls.y + ls.h + 0.03, lz, 0, 0, 0);
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
    }

    // Foredeck dorsal lamp run — bow platform.
    {
      const zFrom = -5.30, zTo = -3.10;
      const n = Math.max(1, Math.floor((zTo - zFrom) / HUMAN.lampGap));
      for (let i = 0; i < n; i++) {
        const lz = zFrom + i * HUMAN.lampGap;
        const ls = sectionAt(stations, lz);
        b.push(0, ls.y + ls.h + 0.03, lz, 0, 0, 0);
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
    }

    // Starboard flank lamp run — seated on hull face, house zone.
    {
      const zFrom = -2.40, zTo = 1.60;
      const n = Math.max(1, Math.floor((zTo - zFrom) / HUMAN.lampGap));
      for (let i = 0; i < n; i++) {
        const lz = zFrom + i * HUMAN.lampGap;
        const ls = sectionAt(stations, lz);
        b.push(ls.w - 0.05, ls.y - ls.h * 0.30, lz, 0, 0, 0);
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
    }

    // Port flank lamp run — symmetric zone.
    {
      const zFrom = -2.40, zTo = 1.60;
      const n = Math.max(1, Math.floor((zTo - zFrom) / HUMAN.lampGap));
      for (let i = 0; i < n; i++) {
        const lz = zFrom + i * HUMAN.lampGap;
        const ls = sectionAt(stations, lz);
        b.push(-(ls.w - 0.05), ls.y - ls.h * 0.30, lz, 0, 0, 0);
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
    }

    // Ventral keel lamp run — keel strake, full working length.
    {
      const zFrom = -4.20, zTo = 4.20;
      const n = Math.max(1, Math.floor((zTo - zFrom) / HUMAN.lampGap));
      for (let i = 0; i < n; i++) {
        const lz = zFrom + i * HUMAN.lampGap;
        const ls = sectionAt(stations, lz);
        b.push(0, ls.y - ls.h - 0.03, lz, 0, 0, 0);
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
    }
  },
};
