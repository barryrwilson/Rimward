/**
 * Ferrous Hegemony — Heavy Bastion Gunship
 *
 * Bible §4.2: "A short, dense citadel behind a deep wedge prow. Use two or four
 * deliberate weapon blocks and thick shoulder armor; leave clean arcs for point
 * defense."
 *
 * Body plan: HAMMERHEAD ZIGGURAT. The deepest wedge prow in the fleet, then a
 * HARD STEP up and outward into a tall, dense, heavily armoured citadel with
 * pronounced SHOULDERS — armour flares at the citadel's forward corners — and
 * then an abruptly narrower short drive tail. Side view: a stepped ziggurat,
 * short for its mass and taller in proportion than any sibling. Plan view:
 * hammerhead — narrow prow, wide shouldered midbody, narrow tail. The STEP is
 * the class read: you can see exactly where the prow stops and the citadel begins.
 * Dense, blunt, short. No tower, no hangar, no long spine.
 *
 * Charter: target span 15.7 (largest on Z), hull 9,000–40,000 verts,
 * lights >= 600 and <= 25% of hull, singleMass cell 1.1, glowZ ~7.6.
 */

import {
  loftRib, sectionAt, loftExtents,
  beltedHull, armourCourse, armourBlock,
} from './body.js';
import {
  LAMP, GLASS, OPTIC,
  citadelArmour, wedgeProw, weaponBlock, recognitionBand,
  rescueLock, pointDefence, driveBattery,
} from './motifs.js';
import {
  weather, box, lampString, windowRow,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const ferrousHeavy = {
  glowZ: 7.6,

  build(b, st) {
    // ==== STATIONS ====
    // Hammerhead ziggurat: deep prow → HARD STEP → wide tall citadel → narrow tail
    // The prow→citadel step (0.30 apart, w: 2.0→4.0, h: 2.2→2.8) is the class read.
    // Citdael→tail step (0.25 apart, w: 3.6→1.8, h: 2.6→1.4) is the hammerhead rear.
    // Low chamfer (0.14) throughout — Ferrous blunt mass.
    //
    // Extents budget (before decoration):
    //   Z: -7.85 to +7.85  → spanZ = 15.7  (target)
    //   X: -4.0 to +4.0    → spanX = 8.0   (target, ratio 1.96 >= 1.15 ✓)
    //   Y: -2.1 to +2.1    → spanY = 4.2  (tallest-proportion, ratio 0.27 <= 0.60 ✓)
    //   Box centre: (0, 0.15, 0) — hammerhead is front-heavy in volume,
    //     tail pushed aft to balance the bounding box within 0.15 of span ✓
    const stations = [
      // DEEP WEDGE PROW (-7.85 to -5.5, ~2.35 units)
      { z: -7.85, w: 0.6,  h: 0.9,  c: 0.14 },  // prow tip
      { z: -7.00, w: 1.0,  h: 1.4,  c: 0.14 },
      { z: -6.00, w: 1.5,  h: 1.8,  c: 0.14 },
      { z: -5.50, w: 2.0,  h: 2.2,  c: 0.14 },  // prow base
      
      // HARD STEP: prow → citadel (0.30 apart, massive w/h jump)
      { z: -5.20, w: 4.0,  h: 2.8,  y: 0.20, c: 0.14 },  // citadel front shoulder (UP and OUT)
      
      // WIDE TALL CITADEL (-5.2 to +2.0, ~7.2 units)
      { z: -3.50, w: 4.0,  h: 2.8,  y: 0.20, c: 0.14 },  // citadel mid front
      { z: -1.00, w: 3.9,  h: 2.75, y: 0.15, c: 0.14 },  // citadel mid
      { z:  2.00, w: 3.6,  h: 2.6,  y: 0.10, c: 0.14 },  // citadel aft shoulder
      
      // HARD STEP: citadel → narrow tail (0.25 apart, abrupt narrowing)
      { z:  2.25, w: 1.8,  h: 1.4,  y: 0.05, c: 0.14 },  // tail front
      
      // NARROW DRIVE TAIL (2.25 to 7.85, ~5.6 units)
      { z:  4.50, w: 1.6,  h: 1.2,  y: 0.02, c: 0.14 },
      { z:  7.85, w: 1.4,  h: 1.0,  y: 0.00, c: 0.14 },  // stern
    ];

    const extents = loftExtents(stations);
    const sternZ = extents.z1;
    const prowCap = stations[0];  // prow tip station for wedge prow

    // ==== HULL SHELL ====
    const hullHex = [st.hull, st.hullDark, st.hull];

    // Ferrous signature layered hull — proud-standing belt
    beltedHull(b, 'hull', hullHex, {
      stations,
      belt: 0.12,
      beltAt: 0.05,
      trim: 0.10,
      seg: 0,
      capFore: true,
      capAft: true,
    });

    // ==== CITADEL ARMOUR COURSES ====
    // Heavy plating over citadel only (bible: "armour the vital core")
    // Use trim tones for structural visibility — pale steel makes plates readable
    const citadelTones = [
      st.hull, weather(st.hull, 1), st.trim, weather(st.trim, 1),
      weather(st.hull, 2), st.hullDark,
    ];
    
    // Base plating: all 8 faces at moderate density — establishes the plate
    // language on the hull body; the belt (beltedHull, t=0.12) sits above
    // this on faces 0 and 4 in the citadel range.
    armourCourse(b, 'hull', citadelTones, {
      stations, from: -5.2, to: 2.0,
      rows: 3, cols: 2, t: 0.10, inset: 0.14, seed: 42,
    });

    // Forward shoulder reinforcement
    armourCourse(b, 'hull', citadelTones, {
      stations, from: -5.2, to: -4.0,
      rows: 3, cols: 2, t: 0.11, inset: 0.12, seed: 142,
    });

    // Aft citadel quarter reinforcement
    armourCourse(b, 'hull', citadelTones, {
      stations, from: 0.5, to: 2.0,
      rows: 3, cols: 2, t: 0.11, inset: 0.12, seed: 242,
    });

    // Prow — lighter plating, all faces
    armourCourse(b, 'hull', citadelTones, {
      stations, from: -7.85, to: -5.5,
      rows: 2, cols: 1, t: 0.07, inset: 0.16, seed: 43,
    });

    // Tail — lighter plating, all faces
    armourCourse(b, 'hull', citadelTones, {
      stations, from: 2.25, to: 7.85,
      rows: 2, cols: 1, t: 0.07, seed: 44,
    });

    // Upper chamfers (1, 3) and dorsal crown (2) — dense, clear of belt strakes
    armourCourse(b, 'hull', citadelTones, {
      stations, from: -5.2, to: 2.0,
      rows: 4, cols: 3, t: 0.10, inset: 0.14, seed: 300,
      faces: [1, 2, 3],
    });

    // Lower chamfers (5, 7) and ventral keel (6) — dedicated underside plating
    armourCourse(b, 'hull', citadelTones, {
      stations, from: -5.2, to: 2.0,
      rows: 4, cols: 3, t: 0.09, inset: 0.16, seed: 301,
      faces: [5, 6, 7],
    });

    // Flank face 0, 4 — fore of belt (belt starts ~z = -6.28)
    armourCourse(b, 'hull', citadelTones, {
      stations, from: -7.85, to: -6.28,
      rows: 3, cols: 2, t: 0.08, inset: 0.14, seed: 302,
      faces: [0, 4],
    });

    // Flank face 0, 4 — aft of belt (belt ends ~z = +6.28)
    armourCourse(b, 'hull', citadelTones, {
      stations, from: 6.28, to: 7.85,
      rows: 3, cols: 2, t: 0.08, inset: 0.14, seed: 303,
      faces: [0, 4],
    });
    
    // ==== WEDGE PROW ====
    // Deepest prow in the fleet, overlapping the forward cap
    b.push(0, 0, -6.60, 0, 0, 0);
      wedgeProw(b, st, {
        w: prowCap.w, h: prowCap.h, len: 1.9, ry: 0, seed: 45,
      });
    b.pop();
    
    // ==== SHOULDERS ====
    // Symmetric armour flares at citadel's forward corners — thick, layered, stepped
    const shoulderZ = -5.0;
    const shoulderS = sectionAt(stations, shoulderZ);
    
    for (const sx of [1, -1]) {
      const shoulderX = sx * (shoulderS.w - 0.4);
      
      b.push(shoulderX, shoulderS.y + shoulderS.h * 0.85, shoulderZ, sx > 0 ? -0.15 : 0.15, 0, 0);
        // Shoulder core block
        armourBlock(b, 'hull', [st.hull, weather(st.hull, 1)], {
          w: 1.6, h: 1.2, d: 2.4, c: 0.14, taper: 0.8, y: 0,
        });
        
        // Stepped citadelArmour cladding — layered plates with trim tones
        citadelArmour(b, st, {
          w: 0.85, h: 0.65, d: 2.2, rows: 4, cols: 3, courses: 4,
          t: 0.10, inset: 0.16, ry: 0, seed: 46 + sx,
          tones: [st.hull, weather(st.hull, 1), st.trim, weather(st.trim, 1), st.hullDark],
        });
        
        // Trim edge band around the shoulder plate
        box(b, 'hull', st.trim, 1.75, 0.12, 2.5, { x: 0, y: 1.25, z: 0 }); // dorsal trim edge
        box(b, 'hull', st.trim, 0.12, 1.3, 2.5, { x: 1.63, y: 0, z: 0 }); // outer trim edge
      b.pop();
    }

    // ==== CITADEL FRAMES ====
    // Structural rib bands dividing the citadel into readable bays
    // Use trim (pale steel) so frames stand out against dark hull
    const frameZ = [
      -5.2,   // Citadel front bulkhead
      -3.5,   // Mid front frame
      -1.0,   // Center frame
      2.0,    // Citadel aft bulkhead
    ];
    
    for (const z of frameZ) {
      loftRib(b, 'hull', st.trim, { stations, z, seg: 0, out: 0.09, thick: 0.16 });
    }
    // ==== CITADEL FLANK STRUCTURE ====
    // Break the belt-covered flank planes with structure: one horizontal
    // st.trim stringer at mid-height per rib bay, plus one vertical trim
    // frame between the shoulder weapon pair and the aft weapon pair.

    // Horizontal stringers — three segments, one per rib bay.
    // Boxes are seated by using the rib-bay minimum hull width as the inner
    // edge, so they never float at the narrowing aft end of the citadel.
    for (const sx of [1, -1]) {
      // Fore bay z = -5.2 → -3.5 (w = 4.0 constant; inner edge at x = 4.00)
      box(b, 'hull', st.trim, 0.18, 0.12, 1.7, { x: sx * 4.09, y: 0.20,  z: -4.35 });
      // Mid bay z = -3.5 → -1.0 (w tapers 4.0 → 3.9; inner edge at x = 3.90)
      box(b, 'hull', st.trim, 0.18, 0.12, 2.5, { x: sx * 3.99, y: 0.175, z: -2.25 });
      // Aft bay z = -1.0 → +2.0 (w tapers 3.9 → 3.6; inner edge at x = 3.60)
      box(b, 'hull', st.trim, 0.18, 0.12, 3.0, { x: sx * 3.69, y: 0.125, z:  0.50 });
    }

    // Vertical trim frame — at z = -1.9, dividing the mid bay into fore and
    // aft zones, reading as a structural web between the weapon housings.
    for (const sx of [1, -1]) {
      const vfS = sectionAt(stations, -1.9);
      box(b, 'hull', st.trim, 0.18, vfS.h * 2.0, 0.16,
        { x: sx * (vfS.w + 0.09), y: vfS.y, z: -1.9 });
    }

    // ==== WEAPON BLOCKS ====
    // Four paired blocks: two on shoulders, two on citadel aft quarters
    // All with clean forward arcs, formally aligned
    // Shoulder weapons (forward, high arcs)
    for (const sx of [1, -1]) {
      const shoulderS = sectionAt(stations, -4.8);
      const weaponX = sx * (shoulderS.w - 0.5);
      
      b.push(weaponX, shoulderS.y + shoulderS.h * 0.5, -4.8, sx > 0 ? -0.3 : 0.3, 0, 0);
        weaponBlock(b, st, { w: 1.0, h: 0.9, d: 1.6, barrels: 2, yaw: 0, seed: 47 + sx });
      b.pop();
    }


    // Aft citadel quarter weapons (rear, complementary arcs)
    for (const sx of [1, -1]) {
      const aftS = sectionAt(stations, 1.0);
      const weaponX = sx * (aftS.w - 0.6);
      
      b.push(weaponX, aftS.y + aftS.h * 0.4, 1.0, sx > 0 ? 0.4 : -0.4, 0, 0);
        weaponBlock(b, st, { w: 0.9, h: 0.85, d: 1.5, barrels: 2, yaw: 0, seed: 49 + sx });
      b.pop();
    }

    // Telltales on weapon mounts — muzzle indicator lights
    for (const sx of [1, -1]) {
      const shoulderS = sectionAt(stations, -4.8);
      const weaponX = sx * (shoulderS.w - 0.5);

      b.push(weaponX, shoulderS.y + shoulderS.h * 0.5, -4.8, sx > 0 ? -0.3 : 0.3, 0, 0);
        // Two barrel muzzle optics — embedded in weapon block front face
        box(b, 'lights', OPTIC, 0.1, 0.1, 0.1, { x: -0.3, y: 0.15, z: -0.75 });
        box(b, 'lights', OPTIC, 0.1, 0.1, 0.1, { x:  0.3, y: 0.15, z: -0.75 });
      b.pop();

      const aftS = sectionAt(stations, 1.0);
      const aftX = sx * (aftS.w - 0.6);

      b.push(aftX, aftS.y + aftS.h * 0.4, 1.0, sx > 0 ? 0.4 : -0.4, 0, 0);
        box(b, 'lights', OPTIC, 0.1, 0.1, 0.1, { x: -0.25, y: 0.1, z: -0.7 });
        box(b, 'lights', OPTIC, 0.1, 0.1, 0.1, { x:  0.25, y: 0.1, z: -0.7 });
      b.pop();
    }
    // ==== POINT DEFENCE ====
    // Four tubs with visibly unobstructed arcs — not buried between blocks
    // One high on each citadel quadrant, clear sky above
    for (const sx of [1, -1]) {
      for (const sy of [1, -1]) {
        const pdS = sectionAt(stations, sy > 0 ? -4.0 : 0.5);
        const pdX = sx * (pdS.w - 0.8);
        const pdY = pdS.y + sy * pdS.h * 0.7;
        const pdZ = sy > 0 ? -4.0 : 0.5;
        
        b.push(pdX, pdY, pdZ, sx > 0 ? 0.15 : -0.15, 0, 0);
          pointDefence(b, st, { r: 0.35, h: 0.35, ry: 0, seed: 51 + sx + sy * 2 });
        b.pop();
      }
    }

    // ==== RESCUE LOCKS ====
    // One on each flank of the citadel (symmetry doctrine), each with service honour
    for (const sx of [1, -1]) {
      const rescueS = sectionAt(stations, -2.5);
      const rescueX = sx * (rescueS.w - 0.2);
      
      b.push(rescueX, rescueS.y, -2.5, sx > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0);
        rescueLock(b, st, { len: 0.6, ry: 0 });
      b.pop();
    }

    // ==== BRIDGE ====
    // Narrow armoured bridge slit high on citadel front, under heavy brow
    // No tower — that belongs to the frigate
    b.push(0, 2.4, -4.5, 0, 0, 0);
      // Heavy brow above the bridge
      box(b, 'hull', st.trim, 1.2, 0.4, 0.6, { y: 0.55, z: 0.1 });
      box(b, 'hull', weather(st.trim, 1), 1.1, 0.35, 0.55, { y: 0.6, z: 0.12 });
      
      // Bridge windows — three GLASS-lit apertures at HUMAN.windowGap
      for (let i = 0; i < 3; i++) {
        const wx = (i - 1) * HUMAN.windowGap;
        box(b, 'lights', GLASS, HUMAN.windowW, HUMAN.windowH, HUMAN.windowD, {
          x: wx, y: 0.15, z: 0,
        });
      }
    b.pop();

    // ==== RECOGNITION BANDS ====
    // Narrow crimson across citadel front
    b.push(0, 1.0, -4.2, 0, 0, 0);
      recognitionBand(b, st, { len: 3.5, w: 0.20, p: 0.045, ry: 0 });
    b.pop();

    // One around each shoulder
    for (const sx of [1, -1]) {
      const shoulderS = sectionAt(stations, -4.9);
      const shoulderX = sx * (shoulderS.w - 0.7);
      
      b.push(shoulderX, shoulderS.y + shoulderS.h * 0.6, -4.9, 0, 0, 0);
        recognitionBand(b, st, { len: 1.8, w: 0.18, p: 0.04, ry: Math.PI / 2 });
      b.pop();
    }

    // ==== SERVICE RECESSES ====
    // Two per flank — dark wells with trim lips carrying hatches / ladders
    // Use sectionAt for skin-seating so they don't float
    const recessPositions = [-3.5, 0.0];  // forward and aft
    for (const sx of [1, -1]) {
      for (let ri = 0; ri < recessPositions.length; ri++) {
        const rz = recessPositions[ri];
        const rS = sectionAt(stations, rz);
        const rx = sx * (rS.w - 0.1);

        b.push(rx, rS.y, rz, sx > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0);
          // Recess well (dark hullDark inset)
          box(b, 'hull', st.hullDark, 1.2, 0.95, 0.30, { y: 0, z: 0 });
          // Trim lip around the recess
          box(b, 'hull', st.trim, 1.4, 1.10, 0.12, { y: 0, z: -0.09 });
          // Inner hatch
          box(b, 'hull', weather(st.hullDark, 1), 1.0, 0.80, 0.08, { y: 0, z: 0.09 });
          // Brass service honour near hatch
          box(b, 'hull', st.patch[1], 0.12, 0.08, 0.05, { x: 0.45, y: 0.35, z: 0.1 });
          // Work lamp above hatch
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize, { x: 0, y: 0.65, z: 0 });
          // Ladder (4 rungs on recess face)
          for (let ri2 = 0; ri2 < 4; ri2++) {
            const ly = -0.35 + ri2 * 0.22;
            box(b, 'hull', st.trim, HUMAN.ladderW, 0.04, 0.05, { x: 0, y: ly, z: 0.12 });
          }
        b.pop();
      }
    }

    // ==== CREW WINDOWS ====
    // Rows along citadel flanks at HUMAN.windowGap — scale cues
    // Three runs: fore, centre, aft (between frames)
    const windowBays = [
      { z: -4.2, count: 3 },   // Forward bay
      { z: -2.1, count: 4 },   // Center bay
      { z:  0.7, count: 3 },   // Aft bay
    ];

    for (const bay of windowBays) {
      const wS = sectionAt(stations, bay.z);
      // Starboard windows (ry: Math.PI/2 rotates boxes to face the flank)
      windowRow(b, 'lights', GLASS, {
        count: bay.count,
        spacing: HUMAN.windowGap,
        w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD,
        x:  wS.w, y: wS.y + wS.h * 0.05, z: bay.z,
        axis: 'z', ry: Math.PI / 2,
      });
      // Port windows
      windowRow(b, 'lights', GLASS, {
        count: bay.count,
        spacing: HUMAN.windowGap,
        w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD,
        x: -wS.w, y: wS.y + wS.h * 0.05, z: bay.z,
        axis: 'z', ry: -Math.PI / 2,
      });
    }

    // ==== CITADEL LAMPS ====
    // Dorsal run along the citadel top in Z direction
    // Compute the Y positions at fore and aft so the run follows the taper
    const citadelForZ = -5.2;
    const citadelAftZ = 2.0;
    const citadelLen = citadelAftZ - citadelForZ;  // 7.2 units
    const dorsalForS = sectionAt(stations, citadelForZ + 0.5);
    const dorsalAftS = sectionAt(stations, citadelAftZ - 0.5);
    const dorsalLampCount = Math.floor(citadelLen / HUMAN.lampGap);

    // Dorsal run — seated into the hull top (slightly below the surface)
    lampString(b, 'lights', LAMP, {
      ax: 0, ay: dorsalForS.y + dorsalForS.h - HUMAN.lampSize * 0.4, az: citadelForZ + 0.5,
      bx: 0, by: dorsalAftS.y + dorsalAftS.h - HUMAN.lampSize * 0.4, bz: citadelAftZ - 0.5,
      count: dorsalLampCount,
      size: HUMAN.lampSize,
    });

    // Port and starboard work-lamp runs along citadel belt line
    for (const sx of [1, -1]) {
      const flankForS = sectionAt(stations, citadelForZ + 0.5);
      const flankAftS = sectionAt(stations, citadelAftZ - 0.5);
      // Seat the lamps at the belt line, embedded in the flank (inside the hull width)
      const flankLampCount = Math.floor(citadelLen / HUMAN.lampGap);

      lampString(b, 'lights', LAMP, {
        ax: sx * (flankForS.w - HUMAN.lampSize * 0.4),
        ay: flankForS.y,
        az: citadelForZ + 0.5,
        bx: sx * (flankAftS.w - HUMAN.lampSize * 0.4),
        by: flankAftS.y,
        bz: citadelAftZ - 0.5,
        count: flankLampCount,
        size: HUMAN.lampSize,
      });
    }
    // ==== DRIVE BATTERY ====
    const tailS = sectionAt(stations, 7.0);
    
    b.push(0, tailS.y, 7.85, 0, 0, 0);
      driveBattery(b, st, {
        w: tailS.w * 1.8,
        h: tailS.h * 1.6,
        len: 2.8,
        throats: 4,
        c: 0.28,
        seed: 52,
      });
    b.pop();
  }
};
