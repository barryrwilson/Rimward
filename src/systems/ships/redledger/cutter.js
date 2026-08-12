/**
 * Red Ledger — Cutter (Boarding Talon)
 *
 * Bible §4.4: "The faction's clearest statement: forked grappling arms around
 * a central breaching tube, strong reverse thrust, prisoner/cargo transfer locks,
 * and protected cockpit placement."
 *
 * Body plan: FORKED BOARDING TALON. A stout, compact body from which TWO
 * grappling arms sweep forward, port and starboard, around a central breaching
 * tube on the centreline. In plan view the ship is a claw; in side view a squat
 * body with a long forward reach. The arms grab first, the tube cuts second.
 *
 * Charter: target span 11.4, hull 6,000–47,000 verts, lights ≥ 400 and ≤ 25% of
 * hull, singleMass cell 0.8, glowZ ≈ 4.3.
 *
 * EXTENT BUDGET (measured after build):
 *   Z  -6.55 … +5.46  span 12.01  (claw tips to stern)
 *   X  ±2.79           span 5.58   (arm sweep to opposite arm)
 *   Y  ±1.97           span 3.94   (midships height)
 * Ratios: Z/X 2.15 ≥ 1.15 ✓  Y/Z 0.33 ≤ 0.60 ✓  X/Z 0.46 ≥ 0.16 ✓
 */

import {
  tri, quad, emitMesh, sectionOutline, sectionAt, loftExtents,
  loftHull, loftPlating, loftRib,
} from '../loft.js';
import {
  capturedHull, plunderCourse,
  grappleArm, breachTube,
  tallyBand,
} from './body.js';
import {
  LAMP, WORK, SEAL, DIM,
  tallyGrooves, reverseThruster, transferLock, winchDrum, workLampRun,
  crewWalk, capturedDrive, magClamp,
} from './motifs.js';
import { weather, box } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const redledgerCutter = {
  glowZ: 4.30,

  build(b, st) {
    // ==== STATIONS ====
    // Stout compact body with blunt armoured brow, swelling midships, then
    // tapering to stern. The BODY is short; the ARMS and TUBE carry the length
    // forward to create the talon silhouette.
    //
    // Brow (z -2.60): w 1.30, h 0.95 — blunt armoured face between arm roots
    // Shoulder (z -2.20): w 1.38, h 1.00 — arm mount point
    // Midships (z 0.60): w 1.85, h 1.25 — widest hull section
    // Stern (z 4.40): w 1.55, h 1.10 — drive face
    const stations = [
      { z: -2.60, w: 1.30, h: 0.95, c: 0.20 }, // brow — blunt armoured face
      { z: -2.20, w: 1.38, h: 1.00, c: 0.20 }, // shoulder — arm mount
      { z: -1.00, w: 1.55, h: 1.10, c: 0.22 }, // forward body
      { z:  0.60, w: 1.85, h: 1.25, c: 0.24 }, // MIDSHIPS — widest
      { z:  2.20, w: 1.72, h: 1.18, c: 0.22 }, // aft body
      { z:  4.40, w: 1.55, h: 1.10, c: 0.20 }, // stern
    ];

    const extents = loftExtents(stations);
    const browZ   = extents.z0;  // −2.60
    const sternZ  = extents.z1;  //  +4.40

    // ==== HULL SHELL ====
    // Two seams at z −1.00 and z 2.20 divide the hull into three sections with
    // different captured tones, emphasizing the rebuilt nature. Weld beads at
    // every seam mark the Ledger's scarred-but-purposeful construction.
    capturedHull(b, 'hull', [st.hull, weather(st.hull, 1), weather(st.hull, 2)], {
      stations,
      seams:   [-1.00, 2.20],
      seg:     1,
      capFore: true,
      capAft:  true,
      weld:    0.06,
      weldHex: st.hullDark,
      seed:    1,
    });

    // ==== PLATING COURSES ====
    // Heavy plunderCourse plating with proud scar plates (~25% promoted to
    // scars) covering the entire hull. The high scar fraction emphasizes the
    // "violence with receipts" aesthetic — repairs are battle-won and deliberate.
    plunderCourse(b, 'hull', [st.hull, weather(st.hull, 1), st.patch[0], st.patch[1]], {
      stations, from: browZ, to: sternZ,
      rows:   3,
      cols:   2,
      t:      0.06,
      inset:  0.15,
      scars:  0.25,
      proud:  0.035,
      seed:   2,
    });

    // ==== FORWARD REVERSE THRUST ====
    // Two reverseThruster blocks on the outboard shoulders, facing forward.
    // Positioned at the arm mount points, these provide strong braking and
    // reverse thrust as a silhouette feature.
    const shoulderZ = -2.20;
    const shoulderSec = sectionAt(stations, shoulderZ);

    for (const sx of [1, -1]) {
      const thrustX = sx * (shoulderSec.w + 0.24);
      b.push(thrustX, 0.12, shoulderZ, 0, 0, 0);
      reverseThruster(b, st, { r: 0.34, count: 3, ry: 0, seed: 10 + sx });
      b.pop();
    }

    // ==== FORKED GRAPPLE ARMS ====
    // TWO grappleArm sweeping forward from the shoulders, port and starboard,
    // with sweep bringing the tips INBOARD so the jaws converge around the
    // central breach tube. Their mount collars overlap the hull flanks.
    const armZ = shoulderZ;
    const armSec = sectionAt(stations, armZ);
    const armLen = 3.5;

    const armR = 0.42;

    for (const sx of [1, -1]) {
      // Arm mount: centre at the shoulder, collar overlaps hull
      const armX = sx * (armSec.w + 0.08); // overlap 0.08 inboard
      
      b.push(armX, 0.06, armZ, 0, 0, 0);
      grappleArm(b, 'hull', [st.hull, weather(st.hull, 1), st.trim], {
        len: armLen,
        r: armR,
        knuckles: 2,
        sweep: sx * 0.35, // inboard sweep: port arm sweeps +X, starboard sweeps −X
        ry: 0,
        claw: true,
        seed: 20 + sx,
      });
      b.pop();
    }

    // ==== ARM-ROOT REVERSE THRUST ====

    // the upper surface of the arm mount collars, adding to the forward thrust
    // silhouette.
    for (const sx of [1, -1]) {
      const armX = sx * (armSec.w + 0.08);
      b.push(armX, 0.22, armZ, 0, 0, 0);
      reverseThruster(b, st, { r: 0.32, count: 3, ry: 0, seed: 30 + sx });
      b.pop();
    }

    // ==== CENTRAL BREACHING TUBE ====
    // Single breachTube on the centreline from the bow face. Sits slightly
    // BEHIND the claw tips — the arms grab first, the tube cuts second.
    // Root collar overlaps the brow.
    const tubeZ = browZ;
    const tubeR = 0.8;
    const tubeLen = 3.6;

    b.push(0, 0, tubeZ, 0, 0, 0);
    breachTube(b, 'hull', [st.hull, weather(st.hull, 1), st.trim], {
      r: tubeR,
      len: tubeLen,
      y: 0,
      ry: 0,
      teeth: 12,
      rails: 4,
      seed: 40,
    });
    b.pop();

    // ==== PROTECTED COCKPIT ====
    // Low armoured brow recessed into the dorsal forward hull between the arm
    // roots. A stepped, plated box with a narrow hullDark vision slit and a
    // WORK-lit pane seated in the well. NOT a bubble canopy — the Ledger
    // protects its pilots behind iron.
    const cockpitZ = -2.00;
    const cockpitSec = sectionAt(stations, cockpitZ);

    // Cockpit well — recessed into the dorsal hull
    b.push(0, cockpitSec.h * 0.6, cockpitZ, 0, 0, 0);
    
    // Armoured brow box — stepped structure recessed into hull
    box(b, 'hull', weather(st.hull, 2), 0.70, 0.32, 0.45, { y: 0.18 });
    
    // Vision slit — narrow hullDark opening
    box(b, 'hull', st.hullDark, 0.55, 0.14, 0.06, { y: 0.10 });
    
    // WORK-lit pane seated in the well
    box(b, 'lights', WORK, 0.48, 0.10, 0.04, { y: 0.08 });
    
    b.pop();

    // ==== TALLY BAND AT MIDSHIPS ====
    // Recognition band at midships (z 0.60) with dried-red accent. This
    // divides the hull visually and marks the Ledger's tally culture.
    tallyBand(b, 'hull', st.accent, {
      stations,
      z: 0.60,
      seg: 0,
      out: 0.045,
      thick: 0.55,
      marks: 6,
      seed: 50,
    });

    // ==== TALLY GROOVES ON PORT FLANK ====
    // Signature tally grooves cut into the port flank aft body.
    const grooveZ = 1.80;
    const grooveSec = sectionAt(stations, grooveZ);

    // Yaw −90° in RADIANS, in the ry slot: push is (x, y, z, ry, rx, rz), and
    // the first draft passed degrees into rx, spinning every flank fitting on
    // this hull by 243° about the long axis.
    b.push(-grooveSec.w - 0.06, 0, grooveZ, -Math.PI / 2, 0, 0);
    tallyGrooves(b, st, { count: 7, len: 0.6, pitch: 0.16, ry: 0, seed: 55 });
    b.pop();

    // ==== WINCH DRUM AND CREW DECK ====
    // winchDrum on the dorsal deck between the arm roots, with crewWalk deck
    // under it and workLampRun along the deck.
    const deckZ = -1.40;
    const deckSec = sectionAt(stations, deckZ);

    // Crew walk deck
    b.push(0, deckSec.h + 0.04, deckZ, 0, 0, 0);
    crewWalk(b, st, {
      w: 1.2,
      d: 1.8,
      rail: true,
      lamps: 0, // lamps added separately via workLampRun
      ry: 0,
      seed: 60,
    });
    b.pop();

    // Winch drum on deck
    b.push(0, deckSec.h + 0.18, deckZ, 0, 0, 0);
    winchDrum(b, st, { r: 0.38, len: 0.65, ry: 0, seed: 65 });
    b.pop();

    // Work lamp run along the deck
    const deckStartZ = deckZ - 0.6;
    const deckEndZ = deckZ + 0.8;
    const deckY = deckSec.h + 0.12;
    b.push(0, deckY, deckStartZ, 0, 0, 0);
    workLampRun(b, st, {
      ax: 0, ay: 0, az: 0,
      bx: 0, by: 0, bz: deckEndZ - deckStartZ,
      seed: 70,
    });
    b.pop();

    // ==== TRANSFER LOCKS ====
    // Two transferLock (caged: true) — one ventral aft, one on the starboard
    // flank — for prisoners and seized cargo.

    // Ventral aft transfer lock
    const ventralLockZ = 3.60;
    const ventralLockSec = sectionAt(stations, ventralLockZ);

    b.push(0, -(ventralLockSec.h + 0.12), ventralLockZ, 0, 0, 0);
    transferLock(b, st, { r: HUMAN.collarR, len: 0.5, caged: true, ry: 0, seed: 80 });
    b.pop();

    // Starboard flank transfer lock
    const flankLockZ = 1.20;
    const flankLockSec = sectionAt(stations, flankLockZ);

    b.push(flankLockSec.w + 0.10, 0, flankLockZ, Math.PI / 2, 0, 0);
    transferLock(b, st, { r: HUMAN.collarR, len: 0.5, caged: true, ry: 0, seed: 85 });
    b.pop();

    // ==== CAPTURED DRIVES AT STERN ====
    // Two capturedDrive at the stern, tones by different i (0 and 1) for
    // visual variety. These are mismatched engines — the Ledger's hallmark.
    const driveZ = sternZ - 0.20;
    const driveSec = sectionAt(stations, driveZ);

    // Port drive (lower)
    b.push(-driveSec.w * 0.35, -driveSec.h * 0.2, driveZ, -Math.PI / 18, 0, 0);
    capturedDrive(b, st, { w: 0.9, h: 0.75, len: 0.8, throats: 2, i: 0, ry: 0, seed: 90 });
    b.pop();

    // Starboard drive (upper)
    b.push(driveSec.w * 0.35, driveSec.h * 0.15, driveZ, Math.PI / 18, 0, 0);
    capturedDrive(b, st, { w: 0.85, h: 0.70, len: 0.75, throats: 2, i: 1, ry: 0, seed: 95 });
    b.pop();

    // ==== MAG CLAMP PADS ====
    // magClamp pads on the flanks near midships for securing seized cargo.

    // Port mag clamp
    const portClampZ = 0.20;
    const portClampSec = sectionAt(stations, portClampZ);

    b.push(-portClampSec.w - 0.04, 0, portClampZ, -Math.PI / 2, 0, 0);
    magClamp(b, st, { r: 0.42, ry: 0, seed: 100 });
    b.pop();

    // Starboard mag clamp
    const starClampZ = 0.80;
    const starClampSec = sectionAt(stations, starClampZ);

    b.push(starClampSec.w + 0.04, 0, starClampZ, Math.PI / 2, 0, 0);
    magClamp(b, st, { r: 0.40, ry: 0, seed: 105 });
    b.pop();

    // ==== LIGHTS ====
    // Dorsal lamp run at HUMAN.lampGap spacing, from aft of brow to near stern.
    const lampStart = browZ + 0.40;
    const lampEnd = sternZ - 0.60;
    const lampCount = Math.floor((lampEnd - lampStart) / HUMAN.lampGap);

    for (let i = 0; i < lampCount; i++) {
      const lz = lampStart + i * HUMAN.lampGap;
      const ls = sectionAt(stations, lz);
      b.push(0, ls.h + 0.04, lz, 0, 0, 0);
      box(b, 'lights', WORK, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
      b.pop();
    }

    // Ventral lamp run for docking reference
    const ventralLampCount = Math.floor((lampEnd - lampStart) / HUMAN.lampGap);

    for (let i = 0; i < ventralLampCount; i++) {
      const lz = lampStart + i * HUMAN.lampGap;
      const ls = sectionAt(stations, lz);
      b.push(0, -(ls.h + 0.04), lz, 0, 0, 0);
      box(b, 'lights', DIM, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
      b.pop();
    }
  },
};
