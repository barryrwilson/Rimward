/**
 * Cutter — inspection launch: A flat-blade enforcement hull with a forward
 * docking/impound collar, evidence lockers along the spine, and paired survey
 * drones nested flush into the sides.
 *
 * Body plan: wide, shallow, flat plank — a working launch that comes alongside.
 * The bow carries a full impound collar ring standing proud of a flat bow face.
 * Drone bays are recessed cutouts in the flanks, not bolted-on additions.
 * Evidence lockers run in a row under the deck. A dorsal working deck earns the
 * flat form with railings, hatch, and lamp runs.
 *
 * Charter: 11.0 span, 6,000-34,000 hull verts, 400+ lights, singleMass cell 0.8.
 */

import {
  loftHull, loftPlating, loftRib, chamferBlock,
  sectionAt,
} from './body.js';
import {
  LAMP, GLASS, DIM,
  hexModule, surveyAperture, driveSection, moduleLatch,
} from './motifs.js';
import {
  weather, box, torus, sphere,
  railing, windowRow, ladder,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const veridianCutter = {
  // Glow zone reaches into the drive section, not beyond.
  glowZ: 5.0,

  build(b, st) {
    const stations = [
      { z: -5.50, w: 1.45, h: 0.30, c: 0.30 }, // flat wide bow face
      { z: -4.60, w: 1.75, h: 0.40, c: 0.28 },
      { z: -2.20, w: 2.10, h: 0.50, c: 0.26 }, // widest
      { z:  0.60, w: 2.00, h: 0.54, c: 0.26 },
      { z:  3.00, w: 1.50, h: 0.50, c: 0.28 },
      { z:  4.20, w: 1.05, h: 0.44, c: 0.30 },
    ];



    // HULL — plated chamfered shell in Combine graphite with weathered bands
    const hullHexes = [st.hull, st.hullDark, st.trim];
    const bandHexes = [
      st.hull,
      weather(st.hull, 1),
      weather(st.hull, 2),
      st.hullDark,
    ];

    loftHull(b, 'hull', bandHexes, { stations, seg: 0, capFore: true, capAft: true });
    
    loftPlating(b, 'hull', hullHexes, {
      stations,
      seg: 0,
      rows: 2,
      cols: 2,
      t: 0.06,
      inset: 0.16,
      seed: 1,
      faces: null,
    });

    // Structural rib at midship bulkhead
    loftRib(b, 'hull', st.trim, { stations, z: -2.20, seg: 0, out: 0.08, thick: 0.14 });
    loftRib(b, 'hull', st.trim, { stations, z: 0.60, seg: 0, out: 0.08, thick: 0.14 });


    // DRIVE SECTION at stern — grows out of the aft station cross-section
    const aftSt = sectionAt(stations, 4.20);
    b.push(0, 0, 4.20);
    driveSection(b, st, {
      r: 0.85,
      len: 1.30,
      throats: 4,
      seed: 7,
      w: aftSt.w,
      h: aftSt.h,
      c: aftSt.c,
    });
    b.pop();

    // IMPOUND COLLAR at bow — proud ring recessed into flat bow face

    const collarR = HUMAN.collarR * 1.8; // enforcement collar scaled to ship width
    
    // Mating well recessed into bow face
    b.push(0, 0, -5.50 - 0.3);
    box(b, 'hull', st.hullDark, 1.2, 1.0, 0.3, { y: 0 });
    b.pop();

    // The proud ring standing clear of the bow face
    b.push(0, 0, -5.50 - 0.35);
    torus(b, 'hull', st.trim, collarR, 0.18, 20, 8, Math.PI * 2, { rx: 0 });
    b.pop();

    // Guide lips on the ring
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      const gx = Math.cos(ang) * collarR;
      const gy = Math.sin(ang) * collarR;
      b.push(gx, gy, -5.50 - 0.35);
      box(b, 'hull', st.accent, 0.12, 0.22, 0.08, { ry: ang });
      b.pop();
    }

    // Capture lugs — 4 at cardinal points
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI * 2) / 8 + Math.PI / 8;
      const lx = Math.cos(ang) * (collarR + 0.14);
      const ly = Math.sin(ang) * (collarR + 0.14);
      b.push(lx, ly, -5.50 - 0.35);
      box(b, 'hull', st.hullDark, 0.10, 0.10, 0.16, { ry: ang });
      b.pop();
    }

    // Approach lamps on the ring
    const lampCount = Math.round((Math.PI * 2 * collarR) / HUMAN.lampGap);
    for (let i = 0; i < lampCount; i++) {
      const ang = (i / lampCount) * Math.PI * 2;
      const lampX = Math.cos(ang) * collarR;
      const lampY = Math.sin(ang) * collarR;
      b.push(lampX, lampY, -5.50 - 0.35);
      sphere(b, 'lights', LAMP, HUMAN.lampSize, 8, 6);
      b.pop();
    }

    // INSPECTION OPTICS flanking the collar — asymmetric pair
    // Primary aperture offset to starboard
    b.push(0.85, 0.15, -5.45);
    surveyAperture(b, st, { r: 0.7, depth: 0.4, dir: -1, face: true });
    b.pop();

    // Secondary aperture offset to port, smaller
    b.push(-0.65, -0.10, -5.42);
    surveyAperture(b, st, { r: 0.5, depth: 0.35, dir: -1, face: true });
    b.pop();

    // SURVEY DRONES nested flush into flank recesses
    // Starboard drone bay
    const droneZ = -2.0;
    const droneRecess = sectionAt(stations, droneZ);
    
    // Recess cutout in starboard flank
    b.push(droneRecess.w - 0.08, droneRecess.y, droneZ);
    chamferBlock(b, 'hull', st.hullDark, {
      w: 0.75,
      h: 0.55,
      d: 1.00,
      c: 0.25,
      taper: 0.9,
      y: 0,
    });
    b.pop();

    // Starboard drone nested inside
    b.push(droneRecess.w - 0.35, droneRecess.y, droneZ);
    hexModule(b, st, {
      r: 0.32,
      len: 0.7,
      seed: 12,
      shade: 1,
      windows: 0,
      serial: true,
    });
    b.pop();

    // Drone's sensor aperture
    b.push(droneRecess.w - 0.15, droneRecess.y, droneZ + 0.2);
    surveyAperture(b, st, { r: 0.18, depth: 0.2, dir: 1, face: false });
    b.pop();

    // Module latch proving drone deploys
    b.push(droneRecess.w - 0.35, droneRecess.y + 0.35, droneZ, 0, 0, Math.PI / 2);
    moduleLatch(b, st, { ry: 0, lit: true, s: 0.6 });
    b.pop();

    // Port drone bay — mirrored but offset slightly
    const portDroneZ = -1.5;
    const portRecess = sectionAt(stations, portDroneZ);
    
    // Recess cutout in port flank
    b.push(-portRecess.w + 0.08, portRecess.y, portDroneZ);
    chamferBlock(b, 'hull', st.hullDark, {
      w: 0.75,
      h: 0.55,
      d: 1.00,
      c: 0.25,
      taper: 0.9,
      y: 0,
    });
    b.pop();

    // Port drone nested inside
    b.push(-portRecess.w + 0.35, portRecess.y, portDroneZ);
    hexModule(b, st, {
      r: 0.32,
      len: 0.7,
      seed: 13,
      shade: 1,
      windows: 0,
      serial: true,
    });
    b.pop();

    // Port drone sensor
    b.push(-portRecess.w + 0.15, portRecess.y, portDroneZ + 0.2);
    surveyAperture(b, st, { r: 0.18, depth: 0.2, dir: 1, face: false });
    b.pop();

    // Port module latch
    b.push(-portRecess.w + 0.35, portRecess.y + 0.35, portDroneZ, 0, 0, -Math.PI / 2);
    moduleLatch(b, st, { ry: 0, lit: true, s: 0.6 });
    b.pop();

    // EVIDENCE LOCKERS along ventral face — row of four
    const lockerCount = 4;
    const lockerStart = -1.2;
    const lockerSpacing = 0.85;
    for (let i = 0; i < lockerCount; i++) {
      const lockerZ = lockerStart + i * lockerSpacing;
      const lockerSt = sectionAt(stations, lockerZ);
      const lockerY = lockerSt.y - lockerSt.h - 0.12;
      
      // Locker body
      b.push(0, lockerY, lockerZ);
      chamferBlock(b, 'hull', st.hullDark, {
        w: 0.55,
        h: 0.30,
        d: 0.65,
        c: 0.3,
        taper: 1,
        y: 0,
      });
      b.pop();

      // Serialized latch showing it opens
      b.push(0, lockerY + 0.25, lockerZ);
      moduleLatch(b, st, { ry: 0, lit: true, s: 0.7 });
      b.pop();
    }

    // DORSAL WORKING DECK — flat walkway flush to hull surface
    const deckSegZ = [1.0, 1.8, 2.6];
    
    for (let i = 0; i < deckSegZ.length - 1; i++) {
      const z1 = deckSegZ[i];
      const z2 = deckSegZ[i + 1];
      const s1 = sectionAt(stations, z1);
      const s2 = sectionAt(stations, z2);
      const segY = (s1.y + s1.h + s2.y + s2.h) / 2 + 0.04;
      const segW = Math.min(s1.w, s2.w) * 0.65;
      const segLen = z2 - z1 + 0.15;
      const midZ = (z1 + z2) / 2;
      
      // Deck plate segment
      b.push(0, segY, midZ);
      box(b, 'hull', st.trim, segW, 0.10, segLen, { y: 0 });
      b.pop();
    }

    // Railings at deck level — keep HUMAN.railH absolute
    for (let i = 0; i < deckSegZ.length - 1; i++) {
      const z1 = deckSegZ[i];
      const z2 = deckSegZ[i + 1];
      const s1 = sectionAt(stations, z1);
      const s2 = sectionAt(stations, z2);
      const segY = (s1.y + s1.h + s2.y + s2.h) / 2 + 0.04;
      const railY = segY + HUMAN.railH;
      const segW = Math.min(s1.w, s2.w) * 0.65;
      
      railing(b, 'hull', st.trim, {
        ax: -segW / 2 + 0.15,
        ay: railY,
        az: z1,
        bx: segW / 2 - 0.15,
        by: railY,
        bz: z2,
        height: HUMAN.railH,
        posts: 2,
        rail: 0.08,
      });
    }

    // Crew hatch at a single position
    const hatchZ = 1.4;
    const hatchSt = sectionAt(stations, hatchZ);
    const hatchY = hatchSt.y + hatchSt.h + 0.04;
    b.push(-0.5, hatchY + 0.12, hatchZ);
    box(b, 'hull', st.hullDark, HUMAN.doorW, HUMAN.doorH, 0.08, { y: HUMAN.doorH / 2 });
    b.pop();
    
    // Hatch frame
    b.push(-0.5, hatchY + 0.12, hatchZ + 0.02);
    box(b, 'hull', st.trim, HUMAN.doorW + 0.08, HUMAN.doorH + 0.08, 0.04, { y: HUMAN.doorH / 2 });
    b.pop();

    // CABIN WINDOWS — lit panes on both flanks of the crewed volume
    const crewSt = sectionAt(stations, -3.5);
    // Starboard cabin windows
    windowRow(b, 'lights', GLASS, {
      count: 3,
      spacing: HUMAN.windowGap,
      w: HUMAN.doorW * 0.6,
      h: HUMAN.doorH * 0.5,
      d: 0.06,
      x: crewSt.w,
      y: crewSt.y,
      z: -3.5,
      axis: 'z',
      ry: Math.PI / 2,
    });
    // Port cabin windows
    windowRow(b, 'lights', GLASS, {
      count: 3,
      spacing: HUMAN.windowGap,
      w: HUMAN.doorW * 0.6,
      h: HUMAN.doorH * 0.5,
      d: 0.06,
      x: -crewSt.w,
      y: crewSt.y,
      z: -3.5,
      axis: 'z',
      ry: -Math.PI / 2,
    });
    // Impound-lock observation windows on the flanks beside the collar
    const lockSt = sectionAt(stations, -4.9);
    windowRow(b, 'lights', GLASS, {
      count: 2,
      spacing: HUMAN.windowGap,
      w: HUMAN.doorW * 0.5,
      h: HUMAN.doorH * 0.5,
      d: 0.06,
      x: lockSt.w,
      y: lockSt.y,
      z: -4.9,
      axis: 'z',
      ry: Math.PI / 2,
    });
    windowRow(b, 'lights', GLASS, {
      count: 2,
      spacing: HUMAN.windowGap,
      w: HUMAN.doorW * 0.5,
      h: HUMAN.doorH * 0.5,
      d: 0.06,
      x: -lockSt.w,
      y: lockSt.y,
      z: -4.9,
      axis: 'z',
      ry: -Math.PI / 2,
    });

    // DECK LADDER — runs from below the hull equator up to the dorsal deck;
    // overlaps both the hull flank and the deck plate so it reads as installed.
    const ladderZ = 1.35;
    const ladderSt = sectionAt(stations, ladderZ);
    const deckTop = ladderSt.y + ladderSt.h + 0.04;
    const ladderBase = ladderSt.y - ladderSt.h * 0.3;
    ladder(b, 'hull', st.trim, {
      x: ladderSt.w,
      y: ladderBase,
      z: ladderZ,
      h: deckTop - ladderBase,
      w: HUMAN.ladderW,
      rungs: 4,
      ry: Math.PI / 2,
    });

    // Deck lamps along working deck
    const lampZs = [1.2, 1.8, 2.4];
    for (const lz of lampZs) {
      const lampSt = sectionAt(stations, lz);
      const lampY = lampSt.y + lampSt.h + 0.04;
      b.push(0, lampY + 0.12, lz);
      sphere(b, 'lights', LAMP, HUMAN.lampSize, 6, 4);
      b.pop();
    }

    // Navigation lamps at bow
    const bowNavSt = sectionAt(stations, -5.50);
    b.push(0, bowNavSt.y + bowNavSt.h + 0.15, -5.50);
    sphere(b, 'lights', LAMP, HUMAN.lampSize * 1.5, 8, 6);
    b.pop();
    
    b.push(0, bowNavSt.y - bowNavSt.h - 0.15, -5.50);
    sphere(b, 'lights', DIM, HUMAN.lampSize * 0.8, 6, 4);
    b.pop();

    // Side navigation lamps
    const sideNavSt = sectionAt(stations, -2.0);
    b.push(sideNavSt.w, sideNavSt.y, -2.0);
    sphere(b, 'lights', LAMP, HUMAN.lampSize * 1.2, 6, 4);
    b.pop();
    
    b.push(-sideNavSt.w, sideNavSt.y, -2.0);
    sphere(b, 'lights', LAMP, HUMAN.lampSize * 1.2, 6, 4);
    b.pop();
  },
};
