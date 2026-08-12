/**
 * Ferrous Hegemony — Light Picket
 *
 * Bible: "A compact armored wedge with paired sensor cheeks, a narrow cockpit slit, and small rescue panniers. It should look overbuilt for its size."
 *
 * Body plan: SOLID WEDGE — a doorstop. The whole ship is one wedge of armour. Mass sits at the STERN: the hull is widest and tallest at the aft frame and tapers continuously forward to a small FLAT vertical strike face at the bow — never a point, never a needle. Side view: flat ventral plane, dorsal surface sloping down and forward, so the profile is a doorstop. Plan view: a broad isoceles wedge. It is the only class in the family with a single monotonic taper and no separate superstructure — that is its read. Overbuilt for its size means the armour is visibly thick relative to the hull it protects: heavy laminated flanks, a cutwater rib down the bow centreline, a belt that looks like it belongs on something bigger.
 *
 * Charter: target span 7.0 (largest on Z), hull 4,000–14,000 verts, lights >=260 and <=25% of hull, singleMass cell 0.6, glowZ 3.4.
 */

import {
  loftHull, loftPlating, loftRib, sectionAt, loftExtents,
  armourBlock, beltedHull, armourCourse,
} from './body.js';
import {
  LAMP, GLASS, OPTIC,
  citadelArmour, wedgeProw, weaponBlock, recognitionBand,
  serviceHonour, rescueLock, driveBattery,
} from './motifs.js';
import {
  weather, box, lampString, windowRow,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const ferrousLight = {
  glowZ: 3.4,

  build(b, st) {
    // ==== STATIONS ====
    // Solid wedge: monotonic taper from stern to bow. Flat ventral plane (y constant),
    // height grows upward as we go aft. Low chamfer for blunt Ferrous mass.
    // Extents budget: Z ~7.0 (-3.5 to +3.5), X ~3.2, Y ~1.7
    const stations = [
      { z: -3.45, w: 0.36, h: 0.42, c: 0.14 },  // bow strike face
      { z: -2.80, w: 0.64, h: 0.54, c: 0.14 },  // forward cheek mount
      { z: -1.80, w: 0.98, h: 0.74, c: 0.15 },  // mid taper
      { z: -0.60, w: 1.34, h: 0.98, c: 0.15 },  // main body
      { z:  0.80, w: 1.56, h: 1.18, c: 0.16 },  // aft body
      { z:  2.40, w: 1.58, h: 1.34, c: 0.16 },  // stern (widest)
      { z:  3.45, w: 1.58, h: 1.34, c: 0.16 },  // stern cap
    ];

    const extents = loftExtents(stations);
    const sternZ = extents.z1;
    const bowZ = extents.z0;

    // ==== HULL SHELL ====
    const hullHex = [st.hull, st.hullDark, st.hull];

    // Belted hull for the layered Ferrous look — this is a picket that should look overbuilt
    beltedHull(b, 'hull', hullHex, {
      stations,
      belt: 0.12,
      beltAt: 0.0,
      trim: 0.15,
      seg: 0,
      capFore: true,
      capAft: true,
    });

    // ==== ARMOUR COURSES ====
    // Tonal palette: one plate in four reads pale steel against iron gray.
    const toneHull = [st.hull, weather(st.hull, 1), st.trim, weather(st.trim, 2), st.hullDark];
    const toneLow  = [st.hull, weather(st.hull, 1), st.trim, st.hullDark, weather(st.hull, 2)];

    // Dorsal crown (face 2) — full hull length, generous panel count.
    armourCourse(b, 'hull', toneHull, {
      stations, from: -3.449, to: 3.449, rows: 3, cols: 2, t: 0.10, inset: 0.16, seed: 3, faces: [2],
    });

    // Upper chamfers (faces 1, 3) — bind dorsal crown to the flank belt.
    armourCourse(b, 'hull', toneHull, {
      stations, from: -3.449, to: 3.449, rows: 2, cols: 2, t: 0.09, inset: 0.15, seed: 9, faces: [1, 3],
    });

    // Flanks (faces 0, 4) forward of belt — belt spans ≈ z −2.415 to +2.415.
    armourCourse(b, 'hull', toneHull, {
      stations, from: -3.449, to: -2.42, rows: 2, cols: 2, t: 0.10, inset: 0.16, seed: 5, faces: [0, 4],
    });

    // Flanks aft of belt.
    armourCourse(b, 'hull', toneHull, {
      stations, from: 2.42, to: 3.449, rows: 2, cols: 2, t: 0.10, inset: 0.16, seed: 13, faces: [0, 4],
    });

    // Lower chamfers (faces 5, 7) — underside construction language.
    armourCourse(b, 'hull', toneLow, {
      stations, from: -3.449, to: 3.449, rows: 2, cols: 1, t: 0.09, inset: 0.15, seed: 19, faces: [5, 7],
    });

    // Ventral keel strake (face 6) — structural trim running full length.
    armourCourse(b, 'hull', st.trim, {
      stations, from: -3.449, to: 3.449, rows: 1, cols: 1, t: 0.10, inset: 0.12, seed: 23, faces: [6],
    });

    // ==== RIB FRAMES ====

    // Bow frame — at forward cheek mount
    loftRib(b, 'hull', st.trim, { stations, z: -2.80, out: 0.08, thick: 0.14 });

    // Forward-mid frame — early taper
    loftRib(b, 'hull', st.trim, { stations, z: -1.80, out: 0.09, thick: 0.15 });

    // Mid frame — where taper rate changes
    loftRib(b, 'hull', st.trim, { stations, z: -0.60, out: 0.10, thick: 0.16 });

    // Aft-mid frame — approach to stern
    loftRib(b, 'hull', st.trim, { stations, z: 0.80, out: 0.10, thick: 0.17 });

    // Stern frame — largest cross-section
    loftRib(b, 'hull', st.trim, { stations, z: 2.40, out: 0.10, thick: 0.18 });

    // ==== WEDGE PROW ====
    // Blunt reinforced bow — overlaps the forward hull cap
    const bowSection = sectionAt(stations, -3.10);
    wedgeProw(b, st, {
      w: bowSection.w * 0.9,
      h: bowSection.h * 0.9,
      len: 0.65,
      ry: 0,
      seed: 5,
    });

    // ==== PAIRED SENSOR CHEEKS ====
    // Armoured blisters on bow shoulders with bezel rings and sunk OPTIC apertures
    for (const sx of [1, -1]) {
      b.push(0, 0, -2.60, 0, 0, sx * 15);
      const cheekSection = sectionAt(stations, -2.60);
      // Cheek body
      armourBlock(b, 'hull', [st.hull, st.hullDark, st.hull], {
        w: 0.36,
        h: 0.34,
        d: 0.42,
        c: 0.14,
        taper: 0.8,
        y: cheekSection.y + 0.10,
      });
      // Bezel ring around optic
      b.push(0.18, 0, 0, 0, 0, 0);
      box(b, 'hull', st.trim, 0.08, 0.16, 0.16);
      b.pop();
      // Sunk OPTIC aperture recessed into cheek face
      b.push(0.14, 0, 0, 0, 0, 0);
      box(b, 'lights', OPTIC, 0.12, 0.10, 0.06);
      b.pop();
      // Second telltale — range-finder pip below the main aperture
      b.push(0.14, -0.06, 0.10, 0, 0, 0);
      box(b, 'lights', OPTIC, 0.05, 0.05, 0.04);
      b.pop();
      b.pop();
    }

    // ==== COCKPIT SLIT ====
    // Narrow horizontal window band across dorsal bow — properly recessed
    b.push(0, 0, -2.20, 0, 0, 0);
    // Dark recessed well
    box(b, 'hull', st.hullDark, 0.90, 0.18, 0.28);
    // Window slit recessed into dark well
    b.push(0, -0.06, -0.06, 0, 0, 0);
    windowRow(b, 'lights', GLASS, 3, {
      w: HUMAN.windowW,
      h: HUMAN.windowH,
      d: HUMAN.windowD,
      gap: HUMAN.windowGap,
    });
    b.pop();
    // Armoured brow of trim above cockpit
    b.push(0, 0.12, 0.02, 0, 0, 0);
    box(b, 'hull', st.trim, 0.88, 0.10, 0.24);
    b.pop();
    b.pop();

    // ==== RESCUE PANNIERS ====
    // Small armoured pods low on aft flanks — the class's rescue capability
    for (const sx of [1, -1]) {
      b.push(0, 0, 1.20, 0, 0, sx * 20);
      const pannierSection = sectionAt(stations, 1.20);
      // Pannier body
      armourBlock(b, 'hull', [st.hull, st.hullDark, st.hull], {
        w: 0.52,
        h: 0.48,
        d: 0.76,
        c: 0.14,
        taper: 1,
        y: pannierSection.y - 0.34,
      });
      // Rescue lock on starboard flank (sx=1 only)
      if (sx === 1) {
        b.push(0.28, -0.10, 0, 0, 0, -90);
        rescueLock(b, st, { len: 0.42, ry: 0 });
        b.pop();
        // Service honour beside lock
        b.push(0.48, -0.08, 0.12, 0, 0, 0);
        serviceHonour(b, st, { lit: true, ry: 0 });
        b.pop();
      }
      // Grab rail on port side
      if (sx === -1) {
        b.push(0.28, -0.10, 0, 0, 0, -90);
        b.push(0, 0.16, 0, 0, 0, 0);
        box(b, 'hull', st.trim, 0.34, 0.04, 0.04);
        box(b, 'hull', st.trim, 0.04, 0.16, 0.04);
        b.pop();
        b.pop();
      }
      b.pop();
    }

    // ==== CREW HATCH ====
    // HUMAN-scale hatch recessed into starboard flank for scale cue
    b.push(0, 0, 0.40, 0, 0, 90);
    const hatchSection = sectionAt(stations, 0.40);
    b.push(hatchSection.w - 0.08, hatchSection.y - 0.12, 0, 0, 0, 0);
    // Dark recessed well
    box(b, 'hull', st.hullDark, HUMAN.doorW + 0.04, HUMAN.doorH + 0.04, 0.06);
    // Hatch door
    b.push(0, -0.02, 0.01, 0, 0, 0);
    box(b, 'hull', weather(st.trim, 1), HUMAN.doorW, HUMAN.doorH, 0.04);
    b.pop();
    b.pop();
    b.pop();

    // ==== GRAB RAILS ====
    // HUMAN-scale grab rails on dorsal spine for scale cues
    const railZ = -1.20;
    const railSection = sectionAt(stations, railZ);
    b.push(0, railSection.y + railSection.h + 0.08, railZ, 0, 0, 0);
    // Forward rail
    box(b, 'hull', st.trim, 0.48, 0.04, 0.04);
    box(b, 'hull', st.trim, 0.04, 0.12, 0.04);
    // Aft rail
    b.push(0.32, 0, 0.60, 0, 0, 0);
    box(b, 'hull', st.trim, 0.48, 0.04, 0.04);
    box(b, 'hull', st.trim, 0.04, 0.12, 0.04);
    box(b, 'hull', st.trim, 0.04, 0.12, 0.04);
    b.pop();
    b.pop();

    // ==== RECOGNITION BAND ====
    // Single narrow crimson band on centreline
    b.push(0, 0, -0.40, 0, 0, 0);
    recognitionBand(b, st, { len: 0.58, w: 0.18, p: 0.04, ry: 0 });
    b.pop();

    // ==== WEAPON BLOCKS ====
    // Two small formally paired weapon blocks — restraint for a picket
    for (const sx of [1, -1]) {
      b.push(0, 0, 0.60, 0, 0, sx * 25);
      const weaponSection = sectionAt(stations, 0.60);
      b.push(weaponSection.w - 0.28, weaponSection.y + 0.14, 0, 0, 0, 0);
      weaponBlock(b, st, {
        w: 0.42,
        h: 0.38,
        d: 0.46,
        barrels: 2,
        yaw: 0,
        seed: 11 + sx,
      });
      b.pop();
      b.pop();
    }

    // ==== DRIVE BATTERY ====
    // Closed stern with 2 throats
    const sternSection = sectionAt(stations, sternZ - 0.20);
    driveBattery(b, st, {
      w: sternSection.w * 0.7,
      h: sternSection.h * 0.5,
      len: 0.84,
      throats: 2,
      c: 0.28,
      seed: 17,
    });

    // ==== RUNNING LAMPS ====
    // Dorsal spine lamp run using lampString for efficiency
    const lampRunStart = -2.00;
    const lampRunEnd = 1.80;
    const lampRunLength = lampRunEnd - lampRunStart;
    const lampCount = Math.floor(lampRunLength / HUMAN.lampGap);

    // Place lamps at HUMAN spacing on dorsal spine
    for (let i = 0; i < lampCount; i++) {
      const lampZ = lampRunStart + i * HUMAN.lampGap;
      const lampSection = sectionAt(stations, lampZ);
      b.push(0, lampSection.y + lampSection.h + 0.02, lampZ, 0, 0, 0);
      box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
      b.pop();
    }

    // ==== VENTRAL CHINE LAMPS ====
    // Short lamp run along the keel strake — seated on the ventral plating.
    const vLampStart = -1.80;
    const vLampEnd   =  1.50;
    const vLampCount = Math.floor((vLampEnd - vLampStart) / HUMAN.lampGap);
    for (let i = 0; i < vLampCount; i++) {
      const lz = vLampStart + i * HUMAN.lampGap;
      const ls = sectionAt(stations, lz);
      b.push(0, -(ls.h + 0.02), lz, 0, 0, 0);
      box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
      b.pop();
    }
  },
};
