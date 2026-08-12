// RED LEDGER ACE — low blade pursuit hull with offset captured engines,
// boarding spike, retractable gun ports, and tally grooves on port flank.
//
// Body plan: flat shoulders tapering to narrow stern, chisel bow.
// Stations: z ≈ −2.95 (chisel bow w≈0.35, h≈0.20) → z ≈ −0.45 (broad shoulder w≈1.35, h≈0.45)
//           → z ≈ +2.95 (stern w≈0.70, h≈0.40).
//
// EXTENT BUDGET (span target 7.5, ace band 4.32–10.08):
//   X: ±1.35 → spanX 2.70   (measured 3.37 incl. pylons)
//   Y: ±0.48 → spanY 0.96   (measured 1.98 incl. drives)
//   Z: −4.25 to +3.20 → spanZ 7.45  (spike −2.95−1.30=−4.25, port drive 2.5+0.7=3.20)
//   Center: (0, 0, 0) → offsets ≤ 0.15  (measured z=−0.106)
//
// RATIOS (limits: spanZ/spanX ≥ 1.15, spanY/spanZ ≤ 0.60, spanX/spanZ ≥ 0.16):
//   spanZ/spanX = 2.22 ≥ 1.15 ✓  (measured)
//   spanY/spanZ = 0.27 ≤ 0.60 ✓  (measured)
//   spanX/spanZ = 0.45 ≥ 0.16 ✓  (measured)

import { box } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';
import {
  capturedHull,
  plunderCourse,
  tallyBand,
  sectionAt,
} from './body.js';
import {
  LAMP,
  tallyGrooves,
  weaponShutter,
  capturedDrive,
  reverseThruster,
  lockBox,
  crewWalk,
  boardingSpike,
} from './motifs.js';

export const redledgerAce = {
  glowZ: 3.20, // Stern reach of port drive

  build(b, st) {
    const { hull, hullDark, trim, accent } = st;

    // === STATIONS ===
    const stations = [
      { z: -2.95, w: 0.35, h: 0.20, y: 0, c: 0.10 },   // Chisel bow (thicker tip, shorter taper)
      { z: -2.15, w: 0.55, h: 0.25, y: 0, c: 0.10 },
      { z: -1.35, w: 0.90, h: 0.35, y: 0, c: 0.10 },
      { z: -0.45, w: 1.35, h: 0.45, y: 0, c: 0.12 },   // Broad shoulder
      { z: +0.45, w: 1.10, h: 0.44, y: 0, c: 0.12 },
      { z: +1.65, w: 0.90, h: 0.43, y: 0, c: 0.11 },
      { z: +2.65, w: 0.75, h: 0.42, y: 0, c: 0.11 },   // Stern
      { z: +2.95, w: 0.70, h: 0.40, y: 0, c: 0.10 },   // Stern tip
    ];
    capturedHull(b, 'hull', [hull, hullDark, trim], {
      stations,
      seams: [3],
      seg: 0,
      capFore: true,
      capAft: true,
      weld: 0.06,
      weldHex: accent,
      seed: 1,
    });

    // === DORSAL PLATING ===
    plunderCourse(b, 'hull', [hull, hullDark, trim], {
      stations,
      from: -1.4,
      to: +2.6,
      rows: 6,
      cols: 3,
      t: 0.06,
      inset: 0.15,
      seed: 2,
      faces: [2],
      scars: 0.2,
      proud: 0.035,
    });

    // === BOARDING SPIKE (centreline bow) ===
    // r=0.28 so it reads as one solid machined instrument, not a bundle of guide rails.
    b.push(0, 0, -2.95, 0, 0, 0);
    boardingSpike(b, st, { len: 1.30, r: 0.28, ry: 0, seed: 3 });
    b.pop();

    // === OFFSET CAPTURED DRIVES — asymmetry must read at thumbnail ===
    // Port (i:0): LARGER, LOWER, FURTHER AFT, on a TALL visible pylon.
    const portDriveZ = 2.50;
    const portDriveY = -0.22;                            // Lower than centreline
    const portSection = sectionAt(stations, portDriveZ);
    const portMountX  = portSection.w * 0.52;

    // Tall pylon — three-part stand-off from the flank
    b.push(-(portMountX + 0.05), portDriveY + 0.12, portDriveZ - 0.15, 0, 0, 0);
    box(b, 'hull', st.hullDark, 0.12, 0.30, 0.38);      // Pylon body (tall, narrow)
    b.pop();
    b.push(-(portMountX + 0.12), portDriveY + 0.12, portDriveZ - 0.15, 0, 0, 0);
    box(b, 'hull', st.trim,      0.10, 0.10, 0.36);      // Pylon face plate
    b.pop();

    // Port drive
    b.push(-(portMountX + 0.18), portDriveY, portDriveZ, 0, 0, 0);
    capturedDrive(b, st, { w: 1.10, h: 0.70, len: 0.70, throats: 2, i: 0, ry: 0, seed: 4 });
    b.pop();

    // Starboard (i:1): SMALLER, HIGHER, FURTHER FORWARD, on a short pylon.
    const starDriveZ = 1.70;                             // 0.80 units forward of port
    const starDriveY = 0.20;                             // Higher than centreline
    const starSection = sectionAt(stations, starDriveZ);
    const starMountX  = starSection.w * 0.52;

    // Short pylon
    b.push(starMountX + 0.05, starDriveY - 0.10, starDriveZ - 0.10, 0, 0, 0);
    box(b, 'hull', st.hullDark, 0.10, 0.18, 0.26);      // Pylon body (short)
    b.pop();
    b.push(starMountX + 0.12, starDriveY - 0.10, starDriveZ - 0.10, 0, 0, 0);
    box(b, 'hull', st.trim,    0.08, 0.08, 0.24);        // Pylon face plate
    b.pop();

    // Starboard drive
    b.push(starMountX + 0.18, starDriveY, starDriveZ, 0, 0, 0);
    capturedDrive(b, st, { w: 0.75, h: 0.48, len: 0.55, throats: 2, i: 1, ry: 0, seed: 5 });
    b.pop();

    // === TALLY GROOVES (port flank, three z positions) ===
    b.push(-1.1,  -0.08, -0.45, 0, 0, 0);
    tallyGrooves(b, st, { count: 6, len: 0.40, pitch: 0.12, ry: 0, seed: 10 });
    b.pop();

    b.push(-1.05,  0.00, -0.10, 0, 0, 0);
    tallyGrooves(b, st, { count: 7, len: 0.40, pitch: 0.12, ry: 0, seed: 11 });
    b.pop();

    b.push(-1.00,  0.08,  0.30, 0, 0, 0);
    tallyGrooves(b, st, { count: 8, len: 0.40, pitch: 0.12, ry: 0, seed: 12 });
    b.pop();

    // === WEAPON SHUTTERS (two open starboard, two closed port) ===
    b.push( 1.05,  0.25, -0.45, 0, 0, 0);
    weaponShutter(b, st, { w: 0.5, h: 0.35, open: 0.7, ry: 0, seed: 20 });
    b.pop();

    b.push( 1.08, -0.12, -0.15, 0, 0, 0);
    weaponShutter(b, st, { w: 0.5, h: 0.35, open: 0.7, ry: 0, seed: 21 });
    b.pop();

    b.push(-1.05,  0.25, -0.45, 0, 0, 0);
    weaponShutter(b, st, { w: 0.5, h: 0.35, open: 0,   ry: 0, seed: 22 });
    b.pop();

    b.push(-1.08, -0.12, -0.15, 0, 0, 0);
    weaponShutter(b, st, { w: 0.5, h: 0.35, open: 0,   ry: 0, seed: 23 });
    b.pop();

    // === TALLY BAND (midships accent ring) ===
    tallyBand(b, 'hull', [accent, trim], {
      stations,
      z: -0.45,
      seg: 0,
      out: 0.045,
      thick: 0.55,
      marks: 5,
      seed: 30,
    });

    // === REVERSE THRUSTERS (shoulder pair) ===
    b.push(-1.15,  0.08, -0.45, 0, 0, 0);
    reverseThruster(b, st, { r: 0.2, count: 3, ry: 0, seed: 40 });
    b.pop();

    b.push( 1.15,  0.08, -0.45, 0, 0, 0);
    reverseThruster(b, st, { r: 0.2, count: 3, ry: 0, seed: 41 });
    b.pop();

    // === LOCK BOX with CREW WALK ===
    b.push(0, 0.38, 2.00, 0, 0, 0);
    lockBox(b, st, { w: 0.6, h: 0.35, d: 0.4, ry: 0, seed: 50 });
    b.pop();

    b.push(0, 0.42, 1.10, 0, 0, 0);
    crewWalk(b, st, {
      w: 0.5,
      d: 1.2,
      rail: true,
      lamps: Math.round(1.2 / HUMAN.lampGap),
      ry: 0,
      seed: 51,
    });
    b.pop();

    // === STERN WORK LAMP ===
    b.push(0, 0.28, 2.95, 0, 0, 0);
    box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
    b.pop();
  },
};
