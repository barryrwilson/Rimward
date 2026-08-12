/**
 * Red Ledger — Heavy (Tribute Raider)
 *
 * Bible §4.4: "A muscular captured hull rebuilt around a ram, four grappling
 * booms, recessed weapons, and modular ransom/cargo vaults. Deliberately
 * unbalanced secondary machinery is welcome."
 *
 * Body plan: THE HAMMER. A broad, deep, muscular hull built around a heavy
 * wedge RAM at the bow, with four grappling booms — two dorsal, two ventral —
 * of deliberately different lengths, and bolted ransom vaults in modular
 * positions along the back and flanks. Massive where the cutter is skeletal;
 * the ram makes the attack vector unmistakable.
 *
 * Charter: target span 17.4, hull 9,000–78,000 verts, lights >= 600 and <= 25%
 * of hull, singleMass cell 1.1, glowZ ~8.6.
 *
 * EXTENT BUDGET (computed before build):
 *   Z  -8.60 … +8.80  span ≈ 17.40   (ram tip to stern hull face)
 *   X  ±5.55           span ≈ 11.10   (ventral port boom tip)
 *   Y  ±2.64           span ≈ 5.28    (dorsal boom mount + arm)
 * Ratios: Z/X 1.57 ≥ 1.15 ✓  Y/Z 0.303 ≤ 0.60 ✓  X/Z 0.638 ≥ 0.16 ✓
 */

import {
  capturedHull, plunderCourse, ramProw, grappleArm, vaultBlock, tallyBand,
  sectionAt, loftExtents,
} from './body.js';
import {
  LAMP, WORK, SEAL, DIM,
  tallyGrooves, weaponShutter, commsReceiver, lockBox, clampJaw, magClamp,
  winchDrum, transferLock, countingHouse, capturedDrive, reverseThruster,
  boardingSpike, prizeCradle, seizedContainer, workLampRun, crewWalk,
} from './motifs.js';
import { weather, box, cyl, lampString, railing } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const redledgerHeavy = {
  glowZ: 8.6,

  build(b, st) {
    const { hull, hullDark, trim, accent, patch } = st;
    const rngN = (seed) => (seed * 9301 + 49297) % 233280 / 233280;

    // Hex palette: hull, hullDark, trim, accent, and two patches (copper, gunmetal)
    const hullHexes = [hull, hullDark, trim, accent, patch[1], patch[2]];

    // ---------------------------------------------------------------------------
    // STATIONS — THE HAMMER: broad, deep, muscular hull built around the ram
    // Extended stern to hit span target 17.4
    // ---------------------------------------------------------------------------
    const stations = [
      { z: -5.00, w: 1.70, h: 1.30, y: 0,   chamfer: 0.20 },  // Ram mounting plane — stepped down for shoulder
      { z: -4.00, w: 2.00, h: 1.50, y: 0,   chamfer: 0.22 },  // Shoulder step
      { z: -2.80, w: 2.40, h: 1.80, y: 0,   chamfer: 0.24 },
      { z: -1.60, w: 2.75, h: 2.05, y: 0,   chamfer: 0.27 },
      { z: -0.80, w: 3.00, h: 2.25, y: 0,   chamfer: 0.29 },  // Shoulder — widest point
      { z:  0.40, w: 2.95, h: 2.20, y: 0,   chamfer: 0.28 },
      { z:  2.20, w: 2.85, h: 2.10, y: 0,   chamfer: 0.27 },
      { z:  4.10, w: 2.65, h: 1.95, y: 0,   chamfer: 0.26 },
      { z:  6.00, w: 2.45, h: 1.80, y: 0,   chamfer: 0.24 },
      { z:  8.80, w: 2.35, h: 1.85, y: 0,   chamfer: 0.22 },  // Stern hull face (extended for 17.4 span)
    ];

    // ---------------------------------------------------------------------------
    // PRIMARY HULL — three captured sections welded together
    // ---------------------------------------------------------------------------
    // Main hull with three visible seams at z ≈ -2.0, z ≈ 2.1, z ≈ 6.5
    capturedHull(b, 'hull', hullHexes, {
      stations,
      seams: [-2.0, 2.1, 6.5],
      seg: 0,
      capFore: true,
      capAft: true,
      weld: 0.06,
      weldHex: trim,
      seed: 1,
    });

    // Heavy plating on every face with 30% proud scar plates — the most scarred hull
    plunderCourse(b, 'hull', hullHexes, {
      stations,
      from: -5.0,
      to: 8.80,
      rows: 3,
      cols: 2,
      t: 0.06,
      inset: 0.15,
      seed: 2,
      scars: 0.30,
      proud: 0.035,
    });

    // ---------------------------------------------------------------------------
    // RAM PROW — the unmistakable attack vector
    // ---------------------------------------------------------------------------
    // b.push(x, y, z, ry, rx, rz) — mount at bow face (x=0, y=0, z=-5.60)
    b.push(0, 0, -5.00);
    ramProw(b, 'hull', hullHexes, {
      w: 2.50,
      h: 2.00,
      d: 3.60,
      tip: 0.20,
      y: 0,
      ribs: 4,
      shank: 0.35,
      seed: 3,
    });
    b.pop();

    // ---------------------------------------------------------------------------
    // FOUR GRAPPLING BOOMS — deliberately unequal lengths
    // ---------------------------------------------------------------------------
    const boomMountZ = -1.4;  // Forward shoulder — moved aft for better separation
    
    // Dorsal port boom — longest at len 3.6, swept further port
    const dpBoomY = sectionAt(stations, boomMountZ).h * 0.70;
    const dpSection = sectionAt(stations, boomMountZ);
    const dpMountX = -dpSection.w * 0.50;  // Further outboard
    
    b.push(dpMountX, dpBoomY + 0.35, boomMountZ, 0.45);  // Increased sweep ry=0.45
    grappleArm(b, 'hull', hullHexes, {
      len: 3.6,
      r: 0.55,  // Thickened from 0.38
      knuckles: 3,
      sweep: 0.40,  // Increased sweep
      ry: 0.45,
      claw: true,
      seed: 4,
    });
    b.pop();

    // Dorsal starboard boom — len 3.0, swept further starboard
    const dsBoomY = sectionAt(stations, boomMountZ).h * 0.70;
    const dsSection = sectionAt(stations, boomMountZ);
    const dsMountX = dsSection.w * 0.55;  // Further outboard
    
    b.push(dsMountX, dsBoomY + 0.35, boomMountZ, -0.35);  // Increased sweep ry=-0.35
    grappleArm(b, 'hull', hullHexes, {
      len: 3.0,
      r: 0.52,  // Thickened from 0.35
      knuckles: 2,
      sweep: 0.35,  // Increased sweep
      ry: -0.35,
      claw: true,
      seed: 5,
    });
    b.pop();

    // Ventral port boom — len 4.4, longest, swept port and down, furthest outboard
    const vpBoomY = -sectionAt(stations, boomMountZ).h * 0.60;
    const vpSection = sectionAt(stations, boomMountZ);
    const vpMountX = -vpSection.w * 0.45;  // Further outboard
    
    b.push(vpMountX, vpBoomY - 0.40, boomMountZ, 0.50, 0.15);  // Increased sweep ry=0.50
    grappleArm(b, 'hull', hullHexes, {
      len: 4.4,
      r: 0.58,  // Thickened from 0.42
      knuckles: 4,
      sweep: 0.45,  // Increased sweep
      ry: 0.50,
      claw: true,
      seed: 6,
    });
    b.pop();

    // Ventral starboard boom — len 3.8, swept starboard
    const vsBoomY = -sectionAt(stations, boomMountZ).h * 0.60;
    const vsSection = sectionAt(stations, boomMountZ);
    const vsMountX = vsSection.w * 0.50;  // Further outboard
    
    b.push(vsMountX, vsBoomY - 0.40, boomMountZ, -0.40, -0.10);  // Increased sweep ry=-0.40
    grappleArm(b, 'hull', hullHexes, {
      len: 3.8,
      r: 0.56,  // Thickened from 0.40
      knuckles: 3,
      sweep: 0.40,  // Increased sweep
      ry: -0.40,
      claw: true,
      seed: 7,
    });
    b.pop();

    // ---------------------------------------------------------------------------
    // RECESSED WEAPONS — flank wells + dorsal crown
    // ---------------------------------------------------------------------------
    // Four flank weapons in wells (two open, two closed)
    const weaponZ = [-0.5, 2.6, 4.4, 6.3];
    const weaponOpen = [0.8, 0, 0, 0.8];  // Two open, two closed
    const weaponSide = [-1, 1, -1, 1];   // Alternating port/starboard

    for (let i = 0; i < 4; i++) {
      const wz = weaponZ[i];
      const wSection = sectionAt(stations, wz);
      const side = weaponSide[i];
      const wellX = side * (wSection.w * 0.65);
      const wellY = 0;  // Mid-flank

      b.push(wellX, wellY, wz);
      box(b, 'hull', hullDark, 0.95, 0.75, 0.50);  // Hull backing well
      b.push(0, 0, side * 0.25);  // Set into well
      weaponShutter(b, st, {
        w: 0.80,
        h: 0.55,
        open: weaponOpen[i],
        ry: side > 0 ? Math.PI : 0,
        seed: 8 + i,
      });
      b.pop();
      b.pop();
    }

    // Two dorsal crown weapons
    const crownWeaponZ = [0.7, 4.7];
    for (let i = 0; i < 2; i++) {
      const cz = crownWeaponZ[i];
      const cSection = sectionAt(stations, cz);
      const crownX = (i === 0 ? -1 : 1) * cSection.w * 0.28;
      const crownY = cSection.h * 0.45;

      b.push(crownX, crownY, cz);
      box(b, 'hull', hullDark, 0.90, 0.40, 0.70);  // Crown well
      b.push(0, 0.20, 0);
      weaponShutter(b, st, {
        w: 0.75,
        h: 0.35,
        open: 0.6,
        ry: (i === 0 ? -0.3 : 0.3),
        seed: 12 + i,
      });
      b.pop();
      b.pop();
    }

    // ---------------------------------------------------------------------------
    // MODULAR RANSOM VAULTS — three different sizes on mounting grid
    // ---------------------------------------------------------------------------
    // Large vault on dorsal aft deck — stood off on visible pad
    const largeVaultZ = 4.8;
    const largeVaultY = sectionAt(stations, largeVaultZ).h * 0.58;
    b.push(0, largeVaultY, largeVaultZ);
    // Mounting pad/frame — creates visible separation line
    box(b, 'hull', hullDark, 2.60, 0.12, 2.00, { x: 0, y: -0.06, z: 0 });
    b.push(0, 0.06, 0);  // Stand vault off the pad
    vaultBlock(b, 'hull', hullHexes, {
      w: 2.40,
      h: 1.60,
      d: 1.80,
      y: 0,
      ry: 0,
      hasp: true,
      straps: 3,
      seed: 14,
    });
    b.pop();
    b.pop();

    // Medium vault on port flank — stood off on visible pad
    const mediumVaultZ = 1.6;
    const mediumSection = sectionAt(stations, mediumVaultZ);
    const mediumVaultX = -mediumSection.w * 0.58;
    const mediumVaultY = mediumSection.h * 0.18;
    b.push(mediumVaultX, mediumVaultY, mediumVaultZ, Math.PI * 0.5);
    // Mounting pad/frame — creates visible separation line
    box(b, 'hull', hullDark, 0.12, 1.50, 1.50, { x: -0.06, y: 0, z: 0 });
    b.push(0.06, 0, 0);  // Stand vault off the pad
    vaultBlock(b, 'hull', hullHexes, {
      w: 1.80,
      h: 1.30,
      d: 1.40,
      y: 0,
      ry: Math.PI * 0.5,
      hasp: true,
      straps: 2,
      seed: 15,
    });
    b.pop();
    b.pop();

    // Small vault on starboard flank at different z — stood off on visible pad
    const smallVaultZ = 6.2;
    const smallSection = sectionAt(stations, smallVaultZ);
    const smallVaultX = smallSection.w * 0.63;
    const smallVaultY = smallSection.h * 0.12;
    b.push(smallVaultX, smallVaultY, smallVaultZ, -Math.PI * 0.5);
    // Mounting pad/frame — creates visible separation line
    box(b, 'hull', hullDark, 0.12, 1.20, 1.20, { x: 0.06, y: 0, z: 0 });
    b.push(-0.06, 0, 0);  // Stand vault off the pad
    vaultBlock(b, 'hull', hullHexes, {
      w: 1.40,
      h: 1.10,
      d: 1.10,
      y: 0,
      ry: -Math.PI * 0.5,
      hasp: true,
      straps: 2,
      seed: 16,
    });
    b.pop();
    b.pop();

    // ---------------------------------------------------------------------------
    // DELIBERATELY UNBALANCED SECONDARY MACHINERY
    // ---------------------------------------------------------------------------
    // Two captured drives at stern — different sizes and positions
    // Main starboard drive — larger, mounted lower
    b.push(sectionAt(stations, 6.9).w * 0.35, sectionAt(stations, 6.9).h * 0.05, 6.9, 0.15);
    capturedDrive(b, st, {
      w: 2.10,
      h: 1.80,
      len: 2.40,
      throats: 2,
      i: 1,
      ry: 0.15,
      seed: 17,
    });
    b.pop();

    // Secondary port drive — smaller, mounted higher, different patch (i=2)
    b.push(-sectionAt(stations, 6.5).w * 0.40, sectionAt(stations, 6.5).h * 0.45, 6.5, -0.10);
    capturedDrive(b, st, {
      w: 1.60,
      h: 1.40,
      len: 1.90,
      throats: 2,
      i: 2,
      ry: -0.10,
      seed: 18,
    });
    b.pop();

    // Small auxiliary drive on port flank quarter
    b.push(-sectionAt(stations, 2.8).w * 0.65, sectionAt(stations, 2.8).h * 0.20, 2.8, Math.PI * 0.5);
    capturedDrive(b, st, {
      w: 1.20,
      h: 1.00,
      len: 1.40,
      throats: 1,
      i: 0,
      ry: Math.PI * 0.5,
      seed: 19,
    });
    b.pop();

    // ---------------------------------------------------------------------------
    // REVERSE THRUSTERS — shoulder pair
    // ---------------------------------------------------------------------------
    const thrusterZ = -2.2;
    const tSection = sectionAt(stations, thrusterZ);

    // Port shoulder
    b.push(-tSection.w * 0.50, tSection.h * 0.45, thrusterZ, Math.PI * 0.3);
    reverseThruster(b, st, {
      r: 0.35,
      count: 2,
      ry: Math.PI * 0.3,
      seed: 20,
    });
    b.pop();

    // Starboard shoulder
    b.push(tSection.w * 0.50, tSection.h * 0.45, thrusterZ, -Math.PI * 0.3);
    reverseThruster(b, st, {
      r: 0.35,
      count: 2,
      ry: -Math.PI * 0.3,
      seed: 21,
    });
    b.pop();

    // ---------------------------------------------------------------------------
    // MAG CLAMP PADS — flanks
    // ---------------------------------------------------------------------------
    const clampPositions = [
      { z: 0.6, side: -1, yOffset: 0.10 },   // Port forward
      { z: 3.5, side: 1, yOffset: -0.05 },  // Starboard aft
      { z: 5.6, side: -1, yOffset: 0.15 },  // Port aft
    ];

    for (let i = 0; i < clampPositions.length; i++) {
      const pos = clampPositions[i];
      const cSection = sectionAt(stations, pos.z);
      const clampX = pos.side * cSection.w * 0.55;
      const clampY = cSection.h * (0.25 + pos.yOffset);
      const ry = pos.side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;

      b.push(clampX, clampY, pos.z, ry);
      magClamp(b, st, {
        r: 0.50,
        ry,
        seed: 22 + i,
      });
      b.pop();
    }

    // ---------------------------------------------------------------------------
    // TRANSFER LOCK — ventral
    // ---------------------------------------------------------------------------
    b.push(0, -sectionAt(stations, 2.2).h * 0.50, 2.2, Math.PI);
    transferLock(b, st, {
      r: HUMAN.collarR,
      len: 0.55,
      caged: true,
      ry: Math.PI,
      seed: 25,
    });
    b.pop();

    // ---------------------------------------------------------------------------
    // TALLY BANDS — girth recognition bands at two stations
    // ---------------------------------------------------------------------------
    tallyBand(b, 'hull', [accent, hullDark], {
      stations,
      z: -0.8,
      seg: 0,
      out: 0.045,
      thick: 0.55,
      marks: 6,
      seed: 26,
    });

    tallyBand(b, 'hull', [accent, hullDark], {
      stations,
      z: 4.5,
      seg: 0,
      out: 0.045,
      thick: 0.55,
      marks: 7,
      seed: 27,
    });

    // ---------------------------------------------------------------------------
    // TALLY GROOVES — kill ledger on port flank
    // ---------------------------------------------------------------------------
    // Three runs of grooves at different heights
    const grooveRuns = [
      { z: -0.3, y: sectionAt(stations, -0.3).h * 0.30, count: 4, len: 1.2 },
      { z: 3.1, y: sectionAt(stations, 3.1).h * 0.20, count: 6, len: 1.5 },
      { z: 5.8, y: sectionAt(stations, 5.8).h * 0.25, count: 5, len: 1.3 },
    ];

    for (let i = 0; i < grooveRuns.length; i++) {
      const run = grooveRuns[i];
      const gSection = sectionAt(stations, run.z);
      const grooveX = -gSection.w * 0.70;  // Port flank

      b.push(grooveX, run.y, run.z);
      tallyGrooves(b, st, {
        count: run.count,
        len: run.len,
        pitch: 0.16,
        ry: Math.PI * 0.5,
        seed: 28 + i,
      });
      b.pop();
    }

    // ---------------------------------------------------------------------------
    // CREW WALK — dorsal spine linking vaults
    // ---------------------------------------------------------------------------
    const walkY = sectionAt(stations, 3.4).h * 0.62;
    
    b.push(0, walkY, 3.4);
    crewWalk(b, st, {
      w: 1.10,
      d: 4.30,
      rail: true,
      lamps: 0,
      ry: 0,
      seed: 31,
    });
    b.pop();

    // ---------------------------------------------------------------------------
    // WORK LAMP RUN — along the crew walk
    // ---------------------------------------------------------------------------
    const walkStartZ = 1.2;
    const walkEndZ = 5.7;
    const lampY = walkY + 0.25;

    workLampRun(b, st, {
      ax: -0.35,
      ay: lampY,
      az: walkStartZ,
      bx: -0.35,
      by: lampY,
      bz: walkEndZ,
      seed: 32,
    });

    workLampRun(b, st, {
      ax: 0.35,
      ay: lampY,
      az: walkStartZ,
      bx: 0.35,
      by: lampY,
      bz: walkEndZ,
      seed: 33,
    });

    // ---------------------------------------------------------------------------
    // ADDITIONAL DETAIL
    // ---------------------------------------------------------------------------
    // Lockbox on port flank near bow
    b.push(-sectionAt(stations, -2.8).w * 0.55, sectionAt(stations, -2.8).h * 0.25, -2.8, Math.PI * 0.7);
    lockBox(b, st, {
      w: 0.55,
      h: 0.45,
      d: 0.70,
      ry: Math.PI * 0.7,
      seed: 34,
    });
    b.pop();

    // Comms receiver on dorsal crown forward
    b.push(0, sectionAt(stations, -1.4).h * 0.70, -1.4);
    commsReceiver(b, st, {
      r: 0.85,
      depth: 0.38,
      tilt: 0.15,
      ry: 0,
      seed: 35,
    });
    b.pop();

    // Winch drum on starboard flank midships
    b.push(sectionAt(stations, 2.4).w * 0.60, sectionAt(stations, 2.4).h * 0.20, 2.4, -Math.PI * 0.4);
    winchDrum(b, st, {
      r: 0.42,
      len: 0.75,
      ry: -Math.PI * 0.4,
      seed: 36,
    });
    b.pop();

    // ClampJaw at the tip of the ventral port boom (visible grappling hardware)
    b.push(vpMountX, vpBoomY - 0.40, boomMountZ, 0.50, 0.15);  // Match boom mount position
    b.push(4.4, 0, 0);  // Forward to boom tip (local x offset)
    clampJaw(b, st, {
      r: 0.50,
      jaws: 3,
      open: 0.45,
      ry: 0,
      seed: 37,
    });
    b.pop();
    b.pop();
  },
};
