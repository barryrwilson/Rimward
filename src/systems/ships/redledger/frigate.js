/**
 * Red Ledger — Frigate (Clan Command Ship)
 *
 * Bible §4.4: "A long raiding command vessel whose forward third is dedicated to
 * pursuit and boarding, middle to weapons and command, and stern to captured drives.
 * Use disciplined red tally bands to unify mismatched parts."
 *
 * Body plan: THREE-ZONE RAIDING COMMAND VESSEL. The ship is legibly divided into
 * thirds along its length, each with a different job and a different section,
 * unified by disciplined dried-red tally bands. Forward third: narrow, low,
 * bristling with boarding gear. Middle third: the tallest mass on the ship — a
 * stepped command citadel over paired weapon batteries. Stern third: a widened
 * rack carrying three mismatched captured drives. The tally bands are the stated
 * device that makes the mismatched parts read as one clan's ship.
 *
 * Charter: target span 31.5, hull 16,000–84,000 verts, lights >= 1,100 and <= 25% of hull,
 * singleMass cell 1.8, grid cell 1.8.
 *
 * EXTENT BUDGET (measured from probe):
 *   Z  -17.10 … +15.70  span ≈ 34.20   (ramProw tip to stern station)
 *   X  ±6.31           span ≈ 12.61   (widest at stern outboard drives)
 *   Y  -3.20 … +5.58   span ≈ 8.96    (keel bottom to centreline drive fin top)
 * Ratios: Z/X 2.71 ≥ 1.15 ✓  Y/Z 0.26 ≤ 0.60 ✓  X/Z 0.37 ≥ 0.16 ✓
 *
 * Zone divisions:
 *   Forward third (-15.7 to -5.2, len ≈ 10.5): Pursuit and boarding — grapple arms,
 *     breach tube, transfer locks, winch drums, crew walk with work lamps.
 *   Middle third (-5.2 to +5.2, len ≈ 10.4): Weapons and command — stepped citadel,
 *     counting house, weapon batteries, mag clamps.
 *   Stern third (+5.2 to +15.7, len ≈ 10.5): Captured drives — three mismatched drives,
 *     reverse thrusters on widened plated rack.
 *
 * Unification: tallyBand at four stations spread over the whole length, tallyGrooves
 * on port flank of each zone.
 */

import {
  capturedHull, plunderCourse, ramProw,
  grappleArm, haulSpine, breachTube, vaultBlock, tallyBand,
  sectionAt, loftExtents,
} from './body.js';
import {
  LAMP, WORK, SEAL, DIM,
  tallyGrooves, weaponShutter, commsReceiver, lockBox, clampJaw, magClamp,
  winchDrum, transferLock, countingHouse, capturedDrive, reverseThruster,
  workLampRun, crewWalk,
} from './motifs.js';
import { rng, weather, box, cyl, lampString } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const redledgerFrigate = {
  glowZ: 15.0,

  build(b, st) {
    const { hull, hullDark, trim, accent, patch } = st;

    // --------------------------------------------------------------------
    // Station list — three zones on one keel, unified by tally bands
    // --------------------------------------------------------------------
    // Station list — three zones with distinctly different cross-sections
    // Forward third: narrow and LOW boarding gallery (h~1.0)
    // Middle third: tallest command mass (h~2.8) with hard step at -5.2
    // Stern third: WIDE flat drive rack (w up to 6.2) with step out at +5.2
    // --------------------------------------------------------------------
    const stations = [
      // FORWARD THIRD: narrow low boarding gallery
      { z: -15.70, w: 1.30, h: 0.85, y: 0, cham: 0.35 },
      { z: -14.00, w: 1.35, h: 0.88, y: 0, cham: 0.36 },
      { z: -12.50, w: 1.42, h: 0.90, y: 0, cham: 0.37 },
      { z: -11.00, w: 1.50, h: 0.92, y: 0, cham: 0.38 },
      { z: -9.50,  w: 1.58, h: 0.94, y: 0, cham: 0.39 },
      { z: -8.00,  w: 1.68, h: 0.96, y: 0, cham: 0.40 },
      { z: -6.50,  w: 1.80, h: 0.98, y: 0, cham: 0.41 },
      { z: -5.20,  w: 1.90, h: 1.00, y: 0, cham: 0.42 }, // seam end of forward zone
      
      // MIDDLE THIRD: tallest command mass with hard step UP
      { z: -3.50,  w: 2.60, h: 2.20, y: 0, cham: 0.50 }, // step up in height
      { z: -1.80,  w: 3.00, h: 2.60, y: 0, cham: 0.55 },
      { z: -0.30,  w: 3.30, h: 2.85, y: 0, cham: 0.60 },
      { z: +1.50,  w: 3.40, h: 2.95, y: 0, cham: 0.65 },
      { z: +3.20,  w: 3.35, h: 2.90, y: 0, cham: 0.63 },
      { z: +5.20,  w: 3.30, h: 2.80, y: 0, cham: 0.60 }, // seam end of middle zone
      
      // STERN THIRD: WIDEST flat drive rack with step OUT in beam
      { z: +7.00,  w: 4.80, h: 2.20, y: 0, cham: 0.58 }, // step out in width
      { z: +9.00,  w: 5.40, h: 1.90, y: 0, cham: 0.56 },
      { z: +11.00, w: 5.80, h: 1.65, y: 0, cham: 0.54 },
      { z: +13.00, w: 6.10, h: 1.45, y: 0, cham: 0.52 },
      { z: +15.00, w: 6.20, h: 1.30, y: 0, cham: 0.50 },
      { z: +15.70, w: 6.20, h: 1.30, y: 0, cham: 0.50 },
    ];

    // --------------------------------------------------------------------
    // Hull core — three captured sections, two seams at zone boundaries
    // --------------------------------------------------------------------
    capturedHull(b, 'hull', [hull, hullDark, trim], {
      stations,
      seams: [-5.2, +5.2],
      seg: 0,
      capFore: true,
      capAft: true,
      weld: 0.06,
      weldHex: accent,
      seed: 1,
    });

    // --------------------------------------------------------------------
    // Zone plating — each zone has different character
    // --------------------------------------------------------------------
    plunderCourse(b, 'hull', [hull, hullDark, trim], {
      stations,
      from: -15.7,
      to: -5.2,
      rows: 4,
      cols: 1,
      t: 0.06,
      inset: 0.15,
      seed: 1,
      faces: null,
      scars: 0.35,
      proud: 0.035,
    });

    plunderCourse(b, 'hull', [hull, hullDark, trim], {
      stations,
      from: -5.2,
      to: +5.2,
      rows: 3,
      cols: 1,
      t: 0.07,
      inset: 0.18,
      seed: 2,
      faces: null,
      scars: 0.18,
      proud: 0.04,
    });

    plunderCourse(b, 'hull', [hull, hullDark, trim], {
      stations,
      from: +5.2,
      to: +15.7,
      rows: 3,
      cols: 1,
      t: 0.065,
      inset: 0.16,
      seed: 3,
      faces: null,
      scars: 0.25,
      proud: 0.038,
    });

    // --------------------------------------------------------------------
    // FORWARD THIRD: pursuit and boarding gear
    // --------------------------------------------------------------------

    b.push(0, 0, -15.70);
    ramProw(b, 'hull', [hull, hullDark, trim], {
      w: 2.6, h: 1.8, d: 2.8, tip: 0.25, y: 0, ribs: 3, shank: 0.35, seed: 1,
    });
    b.pop();

    b.push(-1.68, 0.1, -11.0);
    grappleArm(b, 'hull', [hull, trim], {
      len: 5.0, r: 0.38, knuckles: 2, sweep: 0.25, ry: Math.PI * 0.05, claw: true, seed: 1,
    });
    b.pop();

    b.push(1.68, 0.1, -11.0);
    grappleArm(b, 'hull', [hull, trim], {
      len: 5.0, r: 0.38, knuckles: 2, sweep: -0.25, ry: -Math.PI * 0.05, claw: true, seed: 2,
    });
    b.pop();

    b.push(0, -0.45, -13.0);
    breachTube(b, 'hull', [hull, hullDark, trim], {
      r: 0.9, len: 4.0, y: 0, ry: 0, teeth: 12, rails: 4, seed: 1,
    });
    b.pop();

    b.push(-1.72, 0, -8.5);
    transferLock(b, st, {
      r: HUMAN.collarR, len: 0.6, caged: true, ry: Math.PI * 0.5, seed: 1,
    });
    b.pop();

    b.push(1.72, 0, -8.5);
    transferLock(b, st, {
      r: HUMAN.collarR, len: 0.6, caged: true, ry: -Math.PI * 0.5, seed: 2,
    });
    b.pop();

    b.push(-1.2, 0.55, -9.8);
    winchDrum(b, st, { r: 0.42, len: 0.8, ry: Math.PI * 0.3, seed: 1 });
    b.pop();

    b.push(1.2, 0.55, -9.8);
    winchDrum(b, st, { r: 0.42, len: 0.8, ry: -Math.PI * 0.3, seed: 2 });
    b.pop();

    const walkZ = -7.0;
    const walkSection = sectionAt(stations, walkZ);
    b.push(-walkSection.w - 0.15, 0, walkZ);
    crewWalk(b, st, {
      w: 1.2, d: 2.8, rail: true, lamps: 0, ry: Math.PI * 0.5, seed: 1,
    });
    b.pop();

    b.push(-walkSection.w - 0.15, HUMAN.railH, walkZ);
    workLampRun(b, st, {
      ax: 0.2, ay: HUMAN.railH, az: walkZ - 1.2,
      bx: 0.2, by: HUMAN.railH, bz: walkZ + 1.6,
      seed: 1,
    });
    b.pop();

    // --------------------------------------------------------------------
    // MIDDLE THIRD: weapons and command — THREE-STEP CITADEL
    // --------------------------------------------------------------------

    // Sample hull top at each step's z so each step sits ON the hull surface.
    const s1z = -2.5;  // forward — tallest
    const s2z = -0.8;  // middle
    const s3z = +0.5;  // aft — shortest, carries countingHouse
    const s1 = sectionAt(stations, s1z);
    const s2 = sectionAt(stations, s2z);
    const s3 = sectionAt(stations, s3z);

    // STEP 1 (forward, TALLEST): height 2.4, width 2.2, depth 2.0.
    // Seated on the hull top; forward face at z-1.0, aft face at z+1.0.
    b.push(0, s1.h + 1.2, s1z);
    box(b, 'hull', weather(hullDark, 1), 2.2, 2.4, 2.0);
    box(b, 'hull', weather(trim, 0), 2.25, 0.08, 2.05, 0, 1.21, 0); // copper cornice
    box(b, 'hull', weather(accent, 0), 2.2, 0.12, 0.28, 0, -1.15, 0.80); // dried-red band
    b.pop();

    // STEP 2 (middle, shorter): height 1.6, width 1.7, depth 1.5.
    // Overlaps step 1 in Z (step 2 starts at z-0.75, step 1 ends at z-1.5).
    b.push(0, s2.h + 0.8, s2z);
    box(b, 'hull', weather(hullDark, 0), 1.7, 1.6, 1.5);
    box(b, 'hull', weather(trim, 0), 1.75, 0.08, 1.55, 0, 0.81, 0); // copper cornice
    box(b, 'hull', weather(accent, 0), 1.7, 0.10, 0.25, 0, -0.74, 0.60); // dried-red band
    b.pop();

    // STEP 3 (aft, SHORTEST): height 0.9, width 1.2, depth 1.0. countingHouse on top.
    b.push(0, s3.h + 0.45, s3z);
    box(b, 'hull', weather(hullDark, 1), 1.2, 0.9, 1.0);
    box(b, 'hull', weather(trim, 0), 1.25, 0.08, 1.05, 0, 0.46, 0); // copper cornice
    box(b, 'hull', weather(accent, 0), 1.2, 0.08, 0.22, 0, -0.42, 0.40); // dried-red band
    b.pop();

    // countingHouse on aft step for amber window read
    b.push(-0.45, s3.h + 0.9 + 0.325, s3z + 0.05);
    countingHouse(b, st, { w: 0.7, h: 0.65, d: 0.85, rows: 2, ry: Math.PI * 0.5, seed: 1 });
    b.pop();

    // lockBox mounted on step-1 forward face
    b.push(0.5, s1.h + 1.8, s1z - 0.90);
    lockBox(b, st, { w: 0.45, h: 0.38, d: 0.6, ry: Math.PI * 0.25, seed: 1 });
    b.pop();


    b.push(2.85, 0.4, -3.0);
    weaponShutter(b, st, { w: 0.75, h: 0.45, open: 1, ry: Math.PI * 0.5, seed: 1 });
    b.pop();

    b.push(3.0, 0.6, -1.0);
    weaponShutter(b, st, { w: 0.75, h: 0.45, open: 0, ry: Math.PI * 0.5, seed: 2 });
    b.pop();

    b.push(-2.85, 0.4, -3.0);
    weaponShutter(b, st, { w: 0.75, h: 0.45, open: 0, ry: -Math.PI * 0.5, seed: 3 });
    b.pop();

    b.push(-3.0, 0.6, -1.0);
    weaponShutter(b, st, { w: 0.75, h: 0.45, open: 1, ry: -Math.PI * 0.5, seed: 4 });
    b.pop();

    b.push(0.8, 1.95, -2.5);
    weaponShutter(b, st, { w: 0.7, h: 0.42, open: 1, ry: 0, seed: 5 });
    b.pop();

    b.push(-0.6, s3.h - 0.05, 0.8);
    weaponShutter(b, st, { w: 0.7, h: 0.42, open: 0, ry: Math.PI, seed: 6 });
    b.pop();

    b.push(2.2, 0.15, -3.5);
    magClamp(b, st, { r: 0.48, ry: Math.PI * 0.5, seed: 1 });
    b.pop();

    b.push(-2.2, 0.15, -3.5);
    magClamp(b, st, { r: 0.48, ry: -Math.PI * 0.5, seed: 2 });
    b.pop();

    b.push(2.5, 0.2, 1.0);
    magClamp(b, st, { r: 0.48, ry: Math.PI * 0.5, seed: 3 });
    b.pop();

    b.push(-2.5, 0.2, 1.0);
    magClamp(b, st, { r: 0.48, ry: -Math.PI * 0.5, seed: 4 });
    b.pop();

    // Ventral keel mass to balance the tall citadel and lower CoM
    const keelZ = 1.0;
    const keelSection = sectionAt(stations, keelZ);
    b.push(0, -keelSection.h * 0.70 - 0.30, keelZ);
    box(b, 'hull', weather(hullDark, 0), keelSection.w * 1.05, keelSection.h * 0.50 + 0.25, 10.0);
    b.pop();

    // --------------------------------------------------------------------
    // STERN THIRD: captured drives — must occupy 1/3 of ship mass visually
    // One high centreline drive, two lower outboard; housings break the stern outline
    // --------------------------------------------------------------------
    const rackZ = 9.0;
    const rackSection = sectionAt(stations, rackZ);

    // Drive rack platform — the widened stern base
    b.push(0, -rackSection.h * 0.10, rackZ);
    box(b, 'hull', weather(hullDark, 1), 8.5, 0.45, 8.0);
    b.pop();

    // Top centreline drive — largest, mounted HIGH on the rack centreline
    b.push(0, rackSection.h * 0.55 + 0.5, 10.5);
    capturedDrive(b, st, {
      w: 3.2, h: 2.6, len: 5.5, throats: 3, i: 0, ry: 0, seed: 1,
    });
    b.pop();

    // Starboard lower outboard drive — different size and tilt
    b.push(3.2, -rackSection.h * 0.05, 9.5);
    capturedDrive(b, st, {
      w: 2.6, h: 2.0, len: 4.5, throats: 2, i: 1, ry: Math.PI * 0.08, seed: 2,
    });
    b.pop();

    // Port lower outboard drive — third size mismatch
    b.push(-3.5, rackSection.h * 0.10, 11.0);
    capturedDrive(b, st, {
      w: 2.2, h: 1.8, len: 4.0, throats: 2, i: 2, ry: -Math.PI * 0.06, seed: 3,
    });
    b.pop();
    b.push(1.5, rackSection.h * 0.25, 14.0);
    reverseThruster(b, st, { r: 0.32, count: 3, ry: Math.PI * 0.15, seed: 1 });
    b.pop();

    b.push(-1.5, rackSection.h * 0.25, 14.0);
    reverseThruster(b, st, { r: 0.32, count: 3, ry: -Math.PI * 0.15, seed: 2 });
    b.pop();

    b.push(0, rackSection.h * 0.6, 13.0);
    vaultBlock(b, 'hull', [hull, hullDark, trim], {
      w: 1.4, h: 1.1, d: 1.8, y: 0, ry: 0, hasp: true, straps: 3, seed: 1,
    });
    b.pop();

    // --------------------------------------------------------------------
    // UNIFICATION: tally bands and tally grooves
    // --------------------------------------------------------------------

    tallyBand(b, 'hull', [accent, hull], {
      stations, z: -12.0, seg: 0, out: 0.048, thick: 0.58, marks: 6, seed: 1,
    });

    tallyBand(b, 'hull', [accent, hull], {
      stations, z: -3.0, seg: 0, out: 0.045, thick: 0.55, marks: 5, seed: 2,
    });

    tallyBand(b, 'hull', [accent, hull], {
      stations, z: 3.0, seg: 0, out: 0.045, thick: 0.55, marks: 5, seed: 3,
    });

    tallyBand(b, 'hull', [accent, hull], {
      stations, z: 12.0, seg: 0, out: 0.050, thick: 0.60, marks: 7, seed: 4,
    });

    b.push(0, 0.3, -10.0);
    const fwdSection = sectionAt(stations, -10.0);
    b.push(-fwdSection.w - 0.12, 0, 0);
    tallyGrooves(b, st, { count: 7, len: 0.55, pitch: 0.17, ry: Math.PI * 0.5, seed: 1 });
    b.pop();
    b.pop();

    b.push(0, 0.5, 0.0);
    const midSection = sectionAt(stations, 0.0);
    b.push(-midSection.w - 0.15, 0, 0);
    tallyGrooves(b, st, { count: 6, len: 0.50, pitch: 0.16, ry: Math.PI * 0.5, seed: 2 });
    b.pop();
    b.pop();

    b.push(0, 0.4, 10.0);
    const sternSection = sectionAt(stations, 10.0);
    b.push(-sternSection.w - 0.18, 0, 0);
    tallyGrooves(b, st, { count: 8, len: 0.60, pitch: 0.18, ry: Math.PI * 0.5, seed: 3 });
    b.pop();
    b.pop();

    // --------------------------------------------------------------------
    // Running lights
    // --------------------------------------------------------------------

    lampString(b, 'lights', LAMP, {
      ax: 0, ay: 0.5, az: -14.0,
      bx: 0, by: 0.5, bz: 14.0,
      gap: HUMAN.lampGap,
      seed: 1,
    });

    lampString(b, 'lights', LAMP, {
      ax: -0.8, ay: 0.2, az: -12.0,
      bx: -0.8, by: 0.2, bz: 13.0,
      gap: HUMAN.lampGap,
      seed: 2,
    });

    lampString(b, 'lights', LAMP, {
      ax: 0.8, ay: 0.2, az: -12.0,
      bx: 0.8, by: 0.2, bz: 13.0,
      gap: HUMAN.lampGap,
      seed: 3,
    });
  },
};
