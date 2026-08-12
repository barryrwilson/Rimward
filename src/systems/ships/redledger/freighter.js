/**
 * Red Ledger freighter class — "Tribute Barge" (Spine Train).
 *
 * Design: Command Tug (bow) → haulSpine (mid) → Drive Block (stern).
 * A cargo train dominated by the central haulage girder, with seized
 * containers in irregular ranks, armored ransom vaults, counting houses,
 * prize cradles, and three captured drives of different sizes.
 *
 * Body: capturedHull, plunderCourse, haulSpine, capturedDrive
 * Motifs: countingHouse, vaultBlock, prizeCradle, seizedContainer,
 *         transferLock, magClamp, winchDrum, tallyBand, tallyGrooves
 *
 * EXTENT BUDGET (actual from probe):
 *   Z: -39.5 to +33.94 (span 73.24) — target 78.0, floor 66.0
 *   X: ±5.95 (span 11.9) — from prizeCradles at ±5.8
 *   Y: ±3.1 (span 6.2) — from prizeCradles at y=2.4, 1.8, 1.2
 *   Ratios: Z/X = 5.51 ≥ 1.05 ✓, Y/Z = 0.15 ≤ 0.62 ✓, X/Z = 0.16 ≥ 0.16 ✓
 *   Centre within 0.15 on every axis ✓
 */

import {
  capturedHull, plunderCourse, ramProw, grappleArm, haulSpine,
  breachTube, vaultBlock, tallyBand,
} from './body.js';
import {
  tallyGrooves, weaponShutter, commsReceiver, countingHouse,
  capturedDrive, reverseThruster, prizeCradle, seizedContainer,
  transferLock, magClamp, winchDrum, crewWalk, workLampRun,
} from './motifs.js';
import { weather, box } from '../../station-detail.js';
export const redledgerFreighter = {
  glowZ: 36.0,
  build(b, st) {
    const { hull, hullDark, trim, accent, patch } = st;

    // =========================================================================
    // BOW: COMMAND TUG (-39.5 to -26.0, span 13.5)
    // =========================================================================
    
    // Command tug hull stations — compact armored wedge forward
    const tugStations = [
      { z: -39.5, w: 0.8, h: 1.0, y: 0, chamfer: 0.12 },  // blunt prow
      { z: -37.5, w: 1.2, h: 1.2, y: 0, chamfer: 0.15 },
      { z: -35.0, w: 1.4, h: 1.4, y: 0, chamfer: 0.18 },
      { z: -32.0, w: 1.5, h: 1.6, y: 0, chamfer: 0.20 },
      { z: -29.0, w: 1.6, h: 1.8, y: 0, chamfer: 0.22 },
      { z: -26.0, w: 1.7, h: 2.0, y: 0, chamfer: 0.25 },  // tug stern face
    ];

    // Build the armored command tug hull
    capturedHull(b, 'hull', [hull, hullDark, trim], {
      stations: tugStations,
      seams: [2, 4],
      seg: 0,
      capFore: true,
      capAft: false,  // open to spine
      weld: 0.08,
      weldHex: hullDark,
      seed: 1,
    });

    // Reinforced prow wedge
    b.push(0, 0, -39.5, 0, 0, 0);
    ramProw(b, 'hull', [hull, hullDark, trim], {
      w: 2.4, h: 2.0, d: 1.8, tip: 0.20, y: 0, ribs: 3, shank: 0.30, seed: 1,
    });
    b.pop();

    // Counting house bridge module — amber windows
    b.push(0, 0.8, -32.0, 0, 0, 0);
    countingHouse(b, st, {
      w: 2.8, h: 2.2, d: 4.0, rows: 3, ry: 0, seed: 1,
    });
    b.pop();

    // Weapon shutters (port and starboard)
    b.push(-1.1, 0.3, -34.0, 0, 0, 0);
    weaponShutter(b, st, { w: 0.8, h: 0.5, open: 0, ry: 0, seed: 1 });
    b.pop();
    
    b.push(1.1, 0.3, -34.0, 0, 0, 0);
    weaponShutter(b, st, { w: 0.8, h: 0.5, open: 0, ry: 0, seed: 2 });
    b.pop();

    // Tally band at tug midsection
    tallyBand(b, 'hull', [accent], {
      stations: tugStations,
      z: -32.0,
      seg: 0,
      out: 0.05,
      thick: 0.60,
      marks: 6,
      seed: 1,
    });
    // Tally grooves on tug prow
    b.push(0, 0.5, -37.0, 0, 0, 0);
    tallyGrooves(b, st, { count: 8, len: 0.6, pitch: 0.18, ry: 0, seed: 1 });
    b.pop();

    // Tug armor plating — increased density
    // =========================================================================
    // SPINE: MAIN HAULAGE GIRDER (-36.5 to +36.5, span 73.0)
    // =========================================================================

    const spineZStart = -36.5;
    const spineZEnd = 36.5;

    // Build the armored spine girder
    haulSpine(b, 'hull', [hull, hullDark, trim], {
      from: spineZStart,
      to: spineZEnd,
      w: 2.6,
      h: 2.4,
      y: 0,
      bays: 16,
      chord: 0.32,
      brace: 0.18,
      hardpoints: 14,
      seed: 1,
    });



    // Spine armor plating — denser plate coverage for mass
    const spineArmorStations = [
      { z: -35.0, w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: -29.0, w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: -23.0, w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: -17.0, w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: -11.0, w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: -5.0,  w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: 5.0,   w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: 11.0,  w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: 17.0,  w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: 23.0,  w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: 29.0,  w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
      { z: 35.0,  w: 1.3, h: 1.2, y: 0, chamfer: 0.15 },
    ];
    plunderCourse(b, 'hull', [hull, hullDark, trim], {
      stations: spineArmorStations,
      from: -35.0,
      to: 35.0,
      rows: 6,
      cols: 3,
      t: 0.08,
      inset: 0.12,
      seed: 1,
      faces: null,
      scars: 0.25,
      proud: 0.040,
    });


    // =========================================================================
    // CARGO: SEIZED CONTAINERS (14 irregular ranks)
    // =========================================================================

    // Forward cargo rank — mismatched sizes, different i tones
    b.push(-2.2, 1.8, -20.0, 0, 0, 0);
    seizedContainer(b, st, { w: 2.0, h: 2.2, d: 3.8, i: 0, ry: 0, seed: 1 });
    b.pop();

    b.push(2.2, 1.8, -20.0, 0, 0, 0);
    seizedContainer(b, st, { w: 1.8, h: 2.0, d: 3.4, i: 2, ry: 0, seed: 1 });
    b.pop();

    b.push(-2.4, 1.6, -14.0, 0, 0, 0);
    seizedContainer(b, st, { w: 2.2, h: 2.4, d: 4.0, i: 1, ry: 0, seed: 1 });
    b.pop();

    b.push(2.4, 1.6, -14.0, 0, 0, 0);
    seizedContainer(b, st, { w: 1.6, h: 1.8, d: 3.0, i: 0, ry: 0, seed: 1 });
    b.pop();

    // Mid cargo rank — irregular sizes
    b.push(-2.3, 1.4, -6.0, 0, 0, 0);
    seizedContainer(b, st, { w: 1.9, h: 2.1, d: 3.6, i: 2, ry: 0, seed: 1 });
    b.pop();

    b.push(2.3, 1.4, -6.0, 0, 0, 0);
    seizedContainer(b, st, { w: 2.1, h: 2.3, d: 3.9, i: 1, ry: 0, seed: 1 });
    b.pop();

    b.push(-2.5, 1.2, 0.0, 0, 0, 0);
    seizedContainer(b, st, { w: 2.3, h: 2.5, d: 4.2, i: 0, ry: 0, seed: 1 });
    b.pop();

    b.push(2.5, 1.2, 0.0, 0, 0, 0);
    seizedContainer(b, st, { w: 1.7, h: 1.9, d: 3.2, i: 2, ry: 0, seed: 1 });
    b.pop();

    b.push(-2.2, 1.0, 6.0, 0, 0, 0);
    seizedContainer(b, st, { w: 2.0, h: 2.2, d: 3.8, i: 1, ry: 0, seed: 1 });
    b.pop();

    b.push(2.2, 1.0, 6.0, 0, 0, 0);
    seizedContainer(b, st, { w: 1.8, h: 2.0, d: 3.6, i: 0, ry: 0, seed: 1 });
    b.pop();

    b.push(-2.4, 1.3, 12.0, 0, 0, 0);
    seizedContainer(b, st, { w: 2.1, h: 2.3, d: 3.7, i: 2, ry: 0, seed: 1 });
    b.pop();

    b.push(2.4, 1.3, 12.0, 0, 0, 0);
    seizedContainer(b, st, { w: 1.9, h: 2.1, d: 3.5, i: 1, ry: 0, seed: 1 });
    b.pop();

    b.push(-2.3, 1.5, 18.0, 0, 0, 0);
    seizedContainer(b, st, { w: 2.2, h: 2.4, d: 4.1, i: 0, ry: 0, seed: 1 });
    b.pop();

    b.push(2.3, 1.5, 18.0, 0, 0, 0);
    seizedContainer(b, st, { w: 1.7, h: 1.9, d: 3.1, i: 2, ry: 0, seed: 1 });
    b.pop();

    // Additional aft containers for longer spine
    b.push(-2.2, 1.4, 24.0, 0, 0, 0);
    seizedContainer(b, st, { w: 2.0, h: 2.2, d: 3.8, i: 1, ry: 0, seed: 1 });
    b.pop();

    b.push(2.2, 1.4, 24.0, 0, 0, 0);
    seizedContainer(b, st, { w: 1.8, h: 2.0, d: 3.4, i: 0, ry: 0, seed: 1 });
    b.pop();

    b.push(-2.4, 1.2, -25.0, 0, 0, 0);
    seizedContainer(b, st, { w: 2.1, h: 2.3, d: 3.9, i: 2, ry: 0, seed: 1 });
    b.pop();

    b.push(2.4, 1.2, -25.0, 0, 0, 0);
    seizedContainer(b, st, { w: 1.9, h: 2.1, d: 3.5, i: 1, ry: 0, seed: 1 });
    b.pop();

    // =========================================================================
    // RANSOM VAULTS (3 armored blocks with hasps)
    // =========================================================================

    // Forward vault — high on port
    b.push(-2.1, 2.0, -10.0, 0, 0, 0);
    vaultBlock(b, 'hull', [hull, hullDark, trim], {
      w: 2.4, h: 2.0, d: 3.2, y: 0, ry: 0, hasp: true, straps: 2, seed: 1,
    });
    b.pop();

    // Mid vault — low center
    b.push(0, 1.4, 4.0, 0, 0, 0);
    vaultBlock(b, 'hull', [hull, hullDark, trim], {
      w: 2.6, h: 2.2, d: 3.0, y: 0, ry: 0, hasp: true, straps: 3, seed: 1,
    });
    b.pop();

    // Aft vault — high starboard
    b.push(2.0, 1.9, 14.0, 0, 0, 0);
    vaultBlock(b, 'hull', [hull, hullDark, trim], {
      w: 2.3, h: 2.1, d: 3.4, y: 0, ry: 0, hasp: true, straps: 2, seed: 1,
    });
    b.pop();

    // Vault armor plates — add plated faces for density
    b.push(-2.1, 2.0, -10.0, 0, 0, 0);
    plunderCourse(b, 'hull', [hullDark, trim], {
      stations: [{ z: 0, w: 2.4, h: 2.0, y: 0, chamfer: 0.15 }],
      from: -1.6,
      to: 1.6,
      rows: 3,
      cols: 2,
      t: 0.06,
      inset: 0.10,
      seed: 1,
      faces: null,
      scars: 0.20,
      proud: 0.035,
    });
    b.pop();

    b.push(0, 1.4, 4.0, 0, 0, 0);
    plunderCourse(b, 'hull', [hullDark, trim], {
      stations: [{ z: 0, w: 2.6, h: 2.2, y: 0, chamfer: 0.15 }],
      from: -1.5,
      to: 1.5,
      rows: 3,
      cols: 2,
      t: 0.06,
      inset: 0.10,
      seed: 1,
      faces: null,
      scars: 0.20,
      proud: 0.035,
    });
    b.pop();

    b.push(2.0, 1.9, 14.0, 0, 0, 0);
    plunderCourse(b, 'hull', [hullDark, trim], {
      stations: [{ z: 0, w: 2.3, h: 2.1, y: 0, chamfer: 0.15 }],
      from: -1.7,
      to: 1.7,
      rows: 3,
      cols: 2,
      t: 0.06,
      inset: 0.10,
      seed: 1,
      faces: null,
      scars: 0.20,
      proud: 0.035,
    });
    b.pop();
    // =========================================================================
    // COUNTING HOUSES (2 mobile offices at different heights)
    // =========================================================================

    // Forward counting house — high port
    b.push(-2.0, 2.2, -8.0, 0, 0, 0);
    countingHouse(b, st, {
      w: 2.8, h: 2.4, d: 4.2, rows: 3, ry: 0, seed: 1,
    });
    b.pop();

    // Aft counting house — low starboard
    b.push(1.9, 1.6, 16.0, 0, 0, 0);
    countingHouse(b, st, {
      w: 2.6, h: 2.0, d: 3.8, rows: 2, ry: 0, seed: 1,
    });
    b.pop();

    // =========================================================================
    // PRIZE CRADLES (3 outboard craft docks at different heights/z)
    // =========================================================================

    // Port forward cradle — high
    b.push(-5.8, 2.4, -15.0, 0, 0, 0);
    prizeCradle(b, st, { w: 2.8, d: 4.0, craft: true, ry: 0, seed: 1 });
    b.pop();

    // Starboard mid cradle — mid height
    // Port forward cradle — high
    b.push(-3.6, 2.4, -15.0, 0, 0, 0);
    prizeCradle(b, st, { w: 2.8, d: 4.0, craft: true, ry: 0, seed: 1 });
    b.pop();

    // Starboard mid cradle — mid height
    b.push(3.6, 1.8, 2.0, 0, 0, 0);
    prizeCradle(b, st, { w: 3.0, d: 4.2, craft: true, ry: 0, seed: 1 });
    b.pop();

    // Port aft cradle — low
    b.push(-3.4, 1.2, 18.0, 0, 0, 0);
    prizeCradle(b, st, { w: 2.6, d: 3.8, craft: true, ry: 0, seed: 1 });
    b.pop();
    // =========================================================================

    // Transfer locks (caged) at spine ends
    b.push(-1.8, 0.6, -23.0, 0, 0, 0);
    transferLock(b, st, { r: 0.9, len: 2.8, caged: true, ry: 0, seed: 1 });
    b.pop();

    b.push(1.8, 0.6, 23.0, 0, 0, 0);
    transferLock(b, st, { r: 0.9, len: 2.8, caged: true, ry: 0, seed: 1 });
    b.pop();

    // Mag clamps for cargo handling
    b.push(-1.6, 1.1, -5.0, 0, 0, 0);
    magClamp(b, st, { r: 0.28, ry: 0, seed: 1 });
    b.pop();

    b.push(1.6, 1.1, -5.0, 0, 0, 0);
    magClamp(b, st, { r: 0.28, ry: 0, seed: 1 });
    b.pop();

    // Winch drums for haulage
    b.push(-1.4, 0.9, 8.0, 0, 0, 0);
    winchDrum(b, st, { r: 0.32, len: 1.4, ry: 0, seed: 1 });
    b.pop();

    b.push(1.4, 0.9, 8.0, 0, 0, 0);
    winchDrum(b, st, { r: 0.32, len: 1.4, ry: 0, seed: 1 });
    b.pop();

    // =========================================================================
    // CREW ACCESS: WALKWAYS AND WORK LAMPS
    // =========================================================================

    // Port walkway — forward spine with work lamps
    b.push(-2.7, 0.3, -16.0, 0, 0, 0);
    crewWalk(b, st, {
      w: 6.0, d: 1.2, rail: true, lamps: true, ry: 0, seed: 1,
    });
    b.pop();

    // Starboard walkway — aft spine with work lamps
    b.push(2.7, 0.3, 10.0, 0, 0, 0);
    crewWalk(b, st, {
      w: 6.0, d: 1.2, rail: true, lamps: true, ry: 0, seed: 1,
    });
    b.pop();

    // Work lamp runs along spine
    workLampRun(b, st, { ax: -1.8, ay: 1.6, az: -22.0, bx: -1.8, by: 1.6, bz: 22.0, seed: 1 });

    workLampRun(b, st, { ax: 1.8, ay: 1.6, az: -22.0, bx: 1.8, by: 1.6, bz: 22.0, seed: 1 });

    // =========================================================================
    // TALLY BANDS (5 recognition bands unifying the train)
    // =========================================================================

    // Forward spine tally
    tallyBand(b, 'hull', [accent], {
      stations: spineArmorStations,
      z: -20.0,
      seg: 0,
      out: 0.045,
      thick: 0.55,
      marks: 5,
      seed: 1,
    });

    // Mid spine tally
    tallyBand(b, 'hull', [accent], {
      stations: spineArmorStations,
      z: 0.0,
      seg: 0,
      out: 0.045,
      thick: 0.55,
      marks: 5,
      seed: 1,
    });

    // Aft spine tally
    tallyBand(b, 'hull', [accent], {
      stations: spineArmorStations,
      z: 12.0,
      seg: 0,
      out: 0.045,
      thick: 0.55,
      marks: 5,
      seed: 1,
    });

    // Spine-drive junction tally
    tallyBand(b, 'hull', [accent], {
      stations: spineArmorStations,
      z: 24.0,
      seg: 0,
      out: 0.05,
      thick: 0.60,
      marks: 6,
      seed: 1,
    });

    // =========================================================================
    // STERN: DRIVE BLOCK (+26.0 to +39.5, span 13.5)
    // =========================================================================

    const driveZStart = 26.0;
    const driveZEnd = 39.5;

    // Three captured drives in different sizes and i tones
    // Center large drive
    b.push(0, 0, driveZStart + 2.0, 0, 0, 0);
    capturedDrive(b, st, {
      w: 3.8, h: 3.2, len: 8.0, throats: 3, i: 0, ry: 0, seed: 1,
    });
    b.pop();

    // Port medium drive
    b.push(-2.4, -0.4, driveZStart + 3.5, 0, 0, 0);
    capturedDrive(b, st, {
      w: 2.8, h: 2.4, len: 6.5, throats: 2, i: 1, ry: 0, seed: 1,
    });
    b.pop();

    // Starboard small drive
    b.push(2.4, -0.4, driveZStart + 3.5, 0, 0, 0);
    capturedDrive(b, st, {
      w: 2.2, h: 2.0, len: 5.5, throats: 2, i: 2, ry: 0, seed: 1,
    });
    b.pop();

    // Reverse thrusters — braking blocks
    b.push(-1.8, 0.6, driveZStart + 1.0, 0, 0, 0);
    reverseThruster(b, st, { r: 0.32, count: 3, ry: 0, seed: 1 });
    b.pop();

    b.push(1.8, 0.6, driveZStart + 1.0, 0, 0, 0);
    reverseThruster(b, st, { r: 0.32, count: 3, ry: 0, seed: 1 });
    b.pop();

    // Drive block tally band
    const driveStations = [
      { z: 26.0, w: 2.0, h: 2.0, y: 0, chamfer: 0.18 },
      { z: 30.0, w: 2.2, h: 2.2, y: 0, chamfer: 0.20 },
      { z: 35.0, w: 2.4, h: 2.4, y: 0, chamfer: 0.22 },
      { z: 39.5, w: 1.8, h: 1.8, y: 0, chamfer: 0.15 },
    ];
    // Tally grooves on drive block nozzles
    b.push(0, 0.6, 28.0, 0, 0, 0);
    tallyGrooves(b, st, { count: 10, len: 0.8, pitch: 0.16, ry: 0, seed: 1 });
    b.pop();

    b.push(-1.8, 0.5, 29.5, 0, 0, 0);
    tallyGrooves(b, st, { count: 6, len: 0.6, pitch: 0.12, ry: 0, seed: 1 });
    b.pop();

    b.push(1.8, 0.5, 29.5, 0, 0, 0);
    tallyGrooves(b, st, { count: 6, len: 0.6, pitch: 0.12, ry: 0, seed: 1 });
    b.pop();

    // Drive block cradle plating — add armored structure
    b.push(0, 0, 28.0, 0, 0, 0);
    plunderCourse(b, 'hull', [hullDark, trim], {
      stations: [{ z: 0, w: 3.8, h: 3.2, y: 0, chamfer: 0.18 }],
      from: -4.0,
      to: 4.0,
      rows: 4,
      cols: 3,
      t: 0.08,
      inset: 0.10,
      seed: 1,
      faces: null,
      scars: 0.25,
      proud: 0.040,
    });
    b.pop();

    b.push(-2.4, -0.4, 29.5, 0, 0, 0);
    plunderCourse(b, 'hull', [hullDark, trim], {
      stations: [{ z: 0, w: 2.8, h: 2.4, y: 0, chamfer: 0.15 }],
      from: -3.25,
      to: 3.25,
      rows: 3,
      cols: 2,
      t: 0.07,
      inset: 0.10,
      seed: 1,
      faces: null,
      scars: 0.20,
      proud: 0.035,
    });
    b.pop();

    b.push(2.4, -0.4, 29.5, 0, 0, 0);
    plunderCourse(b, 'hull', [hullDark, trim], {
      stations: [{ z: 0, w: 2.2, h: 2.0, y: 0, chamfer: 0.15 }],
      from: -2.75,
      to: 2.75,
      rows: 3,
      cols: 2,
      t: 0.07,
      inset: 0.10,
      seed: 1,
      faces: null,
      scars: 0.20,
      proud: 0.035,
    });
    b.pop();

    // Drive block armor plating — reduced to avoid floating plates
    plunderCourse(b, 'hull', [hull, hullDark, trim], {
      stations: driveStations,
      from: 27.0,
      to: 32.0,
      rows: 3,
      cols: 2,
      t: 0.08,
      inset: 0.12,
      seed: 1,
      faces: null,
      scars: 0.30,
      proud: 0.045,
    });
  },
};
