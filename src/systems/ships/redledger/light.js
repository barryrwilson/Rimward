/**
 * Red Ledger - Light (Account Runner)
 *
 * Bible: "A lean spotter with a narrow predatory nose, oversized comms
 * receiver, hidden weapon shutters, and one external lockbox for contracts
 * or payment."
 *
 * Body plan: NEEDLE WITH A DISH HUMP. A long, thin, sharply pointed hull
 * whose entire midships is dominated by an OVERSIZED dorsal comms receiver
 * wider than the hull itself. At thumbnail: a needle with a dish growing
 * out of its back and a small lockbox slung beneath. No other Red Ledger
 * class is dish-dominated; nothing else is this thin.
 *
 * Charter: target span 6.9, hull 4,000–25,000 verts (aim 12,000–16,000),
 * lights ≥ 260 and ≤ 25% of hull, singleMass cell 0.6, glowZ 3.5.
 *
 * EXTENT BUDGET (real measurements from probe):
 *   Z  -3.24 … +3.66  span = 6.90   (capturedDrive face plate protrudes past stern)
 *   X  ±0.97           span = 1.95   (commsReceiver dish rim extends beyond hull)
 *   Y  ±1.18           span = 2.36   (commsReceiver/cradle pylon stands proud above hull)
 * Ratios: Z/X 3.54 ≥ 1.15 ✓  Y/Z 0.34 ≤ 0.60 ✓  X/Z 0.28 ≥ 0.16 ✓
 */

import {
  capturedHull, plunderCourse, tallyBand, sectionAt,
} from './body.js';
import {
  LAMP, WORK,
  commsReceiver, weaponShutter, lockBox, tallyGrooves,
  capturedDrive, reverseThruster, workLampRun,
} from './motifs.js';
import { box, weather } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const redledgerLight = {
  glowZ: 3.5,

  build(b, st) {
    const { hull, hullDark, trim, accent, patch } = st;

    // -------------------------------------------------------------------------
    // BODY PLAN — needle with predatory blade bow
    // -------------------------------------------------------------------------
    const stations = [
      // PREDATORY NEEDLE TIP — sharpened for "narrow predatory nose" read
      { z: -3.24, w: 0.08, h: 0.07, y: 0, chamfer: 0.35 },
      { z: -2.95, w: 0.10, h: 0.08, y: 0, chamfer: 0.35 },
      { z: -2.75, w: 0.12, h: 0.10, y: 0, chamfer: 0.35 },
      
      // Growing forward body — still slender
      { z: -2.55, w: 0.16, h: 0.13, y: 0, chamfer: 0.35 },
      { z: -2.30, w: 0.22, h: 0.18, y: 0, chamfer: 0.35 },
      { z: -2.00, w: 0.30, h: 0.24, y: 0, chamfer: 0.35 },
      { z: -1.75, w: 0.38, h: 0.30, y: 0, chamfer: 0.35 },
      { z: -1.55, w: 0.48, h: 0.36, y: 0, chamfer: 0.35 },
      
      // Midships — dish will dominate here
      { z: -1.20, w: 0.56, h: 0.42, y: 0, chamfer: 0.35 },
      { z: -0.80, w: 0.60, h: 0.44, y: 0, chamfer: 0.35 },
      { z: -0.40, w: 0.62, h: 0.46, y: 0, chamfer: 0.35 },
      { z:  0.00, w: 0.64, h: 0.48, y: 0, chamfer: 0.35 },
      { z:  0.40, w: 0.62, h: 0.46, y: 0, chamfer: 0.35 },
      { z:  0.80, w: 0.60, h: 0.44, y: 0, chamfer: 0.35 },
      
      // Aft to stern
      { z:  1.20, w: 0.58, h: 0.42, y: 0, chamfer: 0.35 },
      { z:  1.60, w: 0.56, h: 0.40, y: 0, chamfer: 0.35 },
      { z:  2.00, w: 0.54, h: 0.38, y: 0, chamfer: 0.35 },
      { z:  2.40, w: 0.52, h: 0.36, y: 0, chamfer: 0.35 },
      { z:  2.75, w: 0.50, h: 0.34, y: 0, chamfer: 0.35 },
      { z:  3.00, w: 0.48, h: 0.32, y: 0, chamfer: 0.35 },
      { z:  3.15, w: 0.46, h: 0.30, y: 0, chamfer: 0.35 },
    ];

    // One seam at the nose section (visibly a different capture)
    capturedHull(b, 'hull', [hull, hullDark], {
      stations,
      seams: [0], // Seam after first station (needle tip)
      seg: 0,
      weld: 0.06,
      weldHex: trim,
      seed: 1,
    });

    // Plating over flanks, chamfers, and keel with proud scar plates
    plunderCourse(b, 'hull', [hull, hullDark], {
      stations,
      from: -2.0,
      to: 3.4,
      rows: 3,
      cols: 1,
      t: 0.06,
      inset: 0.15,
      scars: 0.2,
      proud: 0.035,
      seed: 1,
    });

    // -------------------------------------------------------------------------
    // REQUIRED FEATURES
    // -------------------------------------------------------------------------

    // 1. OVERSIZED DORSAL COMMS RECEIVER — DOMINATE THE SIDE SILHOUETTE
    // Mount on visible cradle/pylon ABOVE dorsal line at z ≈ -0.2
    const dishZ = -0.2;
    const dishR = 0.95; // Wider than hull half-width (0.62/2 = 0.31)
    
    // Sample section at dish position for cradle mounting
    const crownSection = sectionAt(stations, dishZ);
    const crownY = crownSection.y + crownSection.h; // Top of hull crown
    
    // Build PROUD CRADLE PYLON — stepped mount block + struts
    // Lower step: base plate on hull crown
    b.push(0, crownY, dishZ, 0, 0, 0);
    box(b, 'hull', trim, 0.45, 0.08, 0.55);
    b.pop();
    
    // Middle step: riser block
    b.push(0, crownY + 0.12, dishZ, 0, 0, 0);
    box(b, 'hull', trim, 0.35, 0.18, 0.40);
    b.pop();
    
    // Support struts (port and starboard)
    b.push(-0.22, crownY + 0.04, dishZ - 0.08, 0, 0, 0);
    box(b, 'hull', trim, 0.08, 0.12, 0.25);
    b.pop();
    
    b.push(0.22, crownY + 0.04, dishZ - 0.08, 0, 0, 0);
    box(b, 'hull', trim, 0.08, 0.12, 0.25);
    b.pop();
    
    // Upper step: dish mounting platform — positions dish CLEAR above hull
    const dishMountY = crownY + 0.28; // 0.28 above crown
    b.push(0, dishMountY, dishZ - 0.08, 0, 0, 0);
    box(b, 'hull', trim, 0.28, 0.08, 0.35);
    b.pop();
    
    // Cable fairing block — covers the cable root so it hugs hull, not arcs
    b.push(0, crownY + 0.02, dishZ - 0.18, 0, 0, 0);
    box(b, 'hull', weather(st.hull, 1), 0.18, 0.06, 0.25);
    b.pop();
    
    // DISH — yawed 180° so the collector OPENING faces forward (the motif
    // builds its bowl opening toward +Z), then tilted nose-down. Radians, not
    // degrees: the first draft passed -5.7 into the rx slot meaning "-5.7
    // degrees" and spun the dish 326°, which rendered as a flat black slab
    // leaning over the hull instead of a collector.
    b.push(0, dishMountY + 0.04, dishZ - 0.12, Math.PI, -0.30, 0);
    commsReceiver(b, st, { r: dishR, depth: 0.5, tilt: -0.10, ry: 0, seed: 1 });
    b.pop();

    // 2. TWO HIDDEN WEAPON SHUTTERS — flush seams on forward flanks
    const weaponZ = -1.8;
    const weaponY = 0.0;
    
    // Port (left, negative X)
    b.push(-0.42, weaponY, weaponZ, Math.PI, 0, 0);
    weaponShutter(b, st, { w: 0.55, h: 0.32, open: 0, ry: 0, seed: 1 });
    b.pop();
    
    // Starboard (right, positive X)
    b.push(0.42, weaponY, weaponZ, 0, 0, 0);
    weaponShutter(b, st, { w: 0.55, h: 0.32, open: 0, ry: 0, seed: 2 });
    b.pop();

    // 3. BELLY LOCKBOX — external contract/payment box
    const lockboxZ = 0.8;
    const keelSection = sectionAt(stations, lockboxZ);
    const lockboxY = keelSection.y - keelSection.h; // Bottom of keel
    
    // Mounting bracket
    b.push(0, lockboxY - 0.08, lockboxZ, 0, 0, 0);
    box(b, 'hull', trim, 0.38, 0.08, 0.32);
    b.pop();
    
    // Lockbox
    b.push(0, lockboxY - 0.18, lockboxZ, 0, 0, 0);
    lockBox(b, st, { w: 0.48, h: 0.38, d: 0.62, ry: 0, seed: 1 });
    b.pop();

    // 4. TALLY GROOVES — one flank only
    b.push(0.52, 0.08, -0.15, 0, 0, 0);
    tallyGrooves(b, st, { count: 6, len: 0.55, pitch: 0.14, ry: 0, seed: 1 });
    b.pop();

    // 5. TALLY BAND — dried red recognition band near stern
    tallyBand(b, 'hull', [accent, trim], {
      stations,
      z: 2.5,
      seg: 0,
      out: 0.045,
      thick: 0.55,
      marks: 5,
      seed: 1,
    });

    // 6. CAPTURED DRIVE at stern
    const sternSection = sectionAt(stations, 3.15);
    b.push(0, 0, 3.15, 0, 0, 0);
    capturedDrive(b, st, {
      w: sternSection.w * 1.3,
      h: sternSection.h * 1.3,
      len: 0.9,
      throats: 2,
      i: 0,
      ry: 0,
      seed: 1,
    });
    b.pop();

    // REVERSE THRUSTERS flanking drive
    b.push(-0.48, 0, 3.25, 0, 0, 0);
    reverseThruster(b, st, { r: 0.20, count: 2, ry: 0, seed: 1 });
    b.pop();
    
    b.push(0.48, 0, 3.25, 0, 0, 0);
    reverseThruster(b, st, { r: 0.20, count: 2, ry: 0, seed: 2 });
    b.pop();

    // 7. WORK LAMP RUN along dorsal spine behind dish
    workLampRun(b, st, {
      ax: 0, ay: crownY + 0.15, az: 0.25,
      bx: 0, by: crownY + 0.15, bz: 0.95,
      seed: 1,
    });
  },
};
