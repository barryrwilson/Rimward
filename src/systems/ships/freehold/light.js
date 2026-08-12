/**
 * Freehold Compact — Light Runabout
 *
 * Bible: "A compact cabin-forward craft with a broad greenhouse-like windscreen,
 * tool lockers, a rescue winch, and two clearly replaced hull panels."
 *
 * Body plan: FAMILY RUNABOUT — the pickup truck of the fleet. A tall, broad
 * glazed CAB sits forward and low over a blunt, friendly bow; a glassHouse
 * greenhouse spans the cab dorsal and a warmWindowRow of cabin windows wraps the
 * starboard flank. Behind the cab the body DROPS at a clear step into an open,
 * low working deck with a full railing, tool lockers clamped to each flank, and
 * a rescue winch forward of the greenhouse on the bow cap. A modest driveCluster
 * with two throats closes the stern. Two clearly replaced hull panels — one cream
 * slab on the starboard flank, one faded-blue plate on the ventral deck — mark
 * the Compact's repair history. The hull is spliced in three donated sections
 * with cream seam straps; plating courses pack the surface.
 * Plan view: widest across the cab shoulders, narrowing slightly aft.
 * The cab-then-notch silhouette is the whole class read; no sibling has it.
 *
 * Charter: target span 6.8 (largest on Z), band 5.94–7.26, hull 4,000–18,000
 * verts, lights ≥ 260 and ≤ 25% of hull, singleMass cell 0.6, glowZ ≈ 3.40.
 */

import {
  splicedHull, patchCourse, loftRib, glassHouse,
  sectionAt, loftExtents,
} from './body.js';
import {
  LAMP,
  warmWindowRow, toolLocker, rescueWinch,
  floodLamp, deckPlate, patchPanel, driveCluster,
} from './motifs.js';
import { weather, box } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const freeholdLight = {
  glowZ: 3.40,

  build(b, st) {
    // ==== STATIONS ====
    // Cab-then-notch: the cab section (z −3.40 to z 0.12) stands tall (h ≈ 1.04
    // at the shoulder), then the body drops sharply at z 0.12 into the open work
    // deck (h ≈ 0.60) that runs to the stern. Every y=0 (symmetric about the
    // centreline) so the pivot pin is centred.
    //
    // Budget:
    //   Z span: −3.40 to +3.40 = 6.80   (band 5.94–7.26 ✓)
    //   X span: 2 × 1.54       = 3.08   (len/beam = 6.80/3.08 = 2.21 ✓)
    //   Y span: 2 × 1.04       = 2.08   (ht/len  = 2.08/6.80 = 0.31 ✓)
    //   With greenhouse top (+0.55 above hull): Y1 ≈ 1.59,
    //     yCenter ≈ 0.275, pivot ≈ 0.10 ✓
    const stations = [
      { z: -3.40, w: 0.72, h: 0.72, y: 0.00, c: 0.35 }, // blunt bow
      { z: -2.80, w: 1.22, h: 0.84, y: 0.00, c: 0.28 }, // bow shoulder
      { z: -2.10, w: 1.46, h: 1.08, y: 0.00, c: 0.26 }, // front of cab — taller
      { z: -1.20, w: 1.54, h: 1.18, y: 0.00, c: 0.24 }, // cab shoulder — tallest, widest
      { z: -0.40, w: 1.52, h: 1.12, y: 0.00, c: 0.24 }, // rear cab — taller
      { z:  0.12, w: 1.48, h: 0.56, y: 0.00, c: 0.26 }, // STEP DOWN — deck begins, deeper drop
      { z:  0.60, w: 1.42, h: 0.54, y: 0.00, c: 0.28 }, // forward deck edge — lower
      { z:  2.00, w: 1.36, h: 0.54, y: 0.00, c: 0.28 }, // deck run — lower
      { z:  2.80, w: 1.28, h: 0.56, y: 0.00, c: 0.28 }, // stern shoulder
      { z:  3.40, w: 1.22, h: 0.62, y: 0.00, c: 0.28 }, // stern cap
    ];

    const extents = loftExtents(stations);
    const sternZ  = extents.z1;   // 3.40

    // ==== HULL SHELL — splicedHull ====
    // Three donated sections separated by cream seam straps.
    // Section 1 (bow + cab, z −3.40 → −0.80): worn hull brown.
    // Section 2 (step + forward deck, z −0.80 → +1.40): faded blue.
    // Section 3 (aft deck + stern, z +1.40 → +3.40): barn red.
    const shellTones = [
      st.hull,
      st.patch[2],                   // faded blue
      weather(st.patch[0], 1),       // slightly deeper barn red
    ];
    splicedHull(b, 'hull', shellTones, {
      stations,
      seams:    [-0.80, 1.40],
      strap:    0.07,
      strapHex: st.trim,             // cream weld bead at each seam
      seed:     1,
    });

    // ==== PLATE COURSES — patchCourse ====
    // Tones cycle across all donated shades so every face reads assembled.
    const plateTones = [
      st.hull,
      weather(st.hull, 1),
      st.hullDark,
      st.patch[0],
      weather(st.patch[0], 2),
      st.patch[2],
    ];

    // Dorsal crown (face 2) — full length, three rows: the roof of the cab and
    // the deck surface both show this course from above.
    patchCourse(b, 'hull', plateTones, {
      stations, from: -3.39, to: 3.39,
      rows: 3, cols: 1, t: 0.06, inset: 0.15, seed: 3, faces: [2],
    });

    // Upper chamfers (faces 1, 3) — full length, two rows.
    patchCourse(b, 'hull', plateTones, {
      stations, from: -3.39, to: 3.39,
      rows: 2, cols: 1, t: 0.06, inset: 0.15, seed: 7, faces: [1, 3],
    });

    // Flanks (faces 0, 4) — full length, three rows.
    patchCourse(b, 'hull', plateTones, {
      stations, from: -3.39, to: 3.39,
      rows: 3, cols: 1, t: 0.06, inset: 0.15, seed: 11, faces: [0, 4],
    });

    // Lower chamfers (faces 5, 7) — full length, two rows.
    patchCourse(b, 'hull', plateTones, {
      stations, from: -3.39, to: 3.39,
      rows: 2, cols: 1, t: 0.06, inset: 0.15, seed: 17, faces: [5, 7],
    });

    patchCourse(b, 'hull', plateTones, {
      stations, from: -3.39, to: 3.39,
      rows: 2, cols: 1, t: 0.06, inset: 0.15, seed: 23, faces: [6],
    });
    // A forward-raked, properly framed windscreen with mullions, sill, header,
    // A forward-raked, properly framed windscreen with mullions, sill, header,
    // and corner posts. Multiple panes bring lights count up; cabin side windows
    // add warm glass DNA. Aft edge seats on cabin roof, no overhang.
    const wsZFore    = -2.10;              // front of cab (greenhouse footing)
    const wsZAft     = -0.40;              // rear cab station (seating point)
    const wsSecFore  = sectionAt(stations, wsZFore);
    const wsSecAft   = sectionAt(stations, wsZAft);
    const wsTopFore  = wsSecFore.y + wsSecFore.h;
    const wsTopAft   = wsSecAft.y + wsSecAft.h;
    
    // Windscreen dimensions — footprint fits within cabin beam
    const wsW        = wsSecFore.w * 0.85; // width within cabin
    const wsH        = 0.55;               // overall height
    const wsD        = wsZAft - wsZFore;    // depth = cab front-to-rear
    const rakeAngle  = 0.35;               // forward rake (radians)
    
    // Frame construction
    const postW      = 0.07;               // corner post & mullion width
    const sillThick  = 0.08;               // sill depth
    const headerThick= 0.03;               // header height (minimal to avoid projecting)
    
    // Position: centre of windscreen volume
    const wsCenterZ  = (wsZFore + wsZAft) / 2;
    const wsCenterY  = wsTopAft + wsH / 2;
    
    b.push(0, wsTopAft, wsCenterZ, 0);
    
    // === CORNER POSTS (down to cabin shell) ===
    // Four posts from cabin deck to header, at corners of windscreen footprint
    // Height matches header center so posts terminate at header center
    const postH = wsH - headerThick/2;     // post height (deck TO header center)
    for (const sx of [1, -1]) {
      for (const sz of [1, -1]) {
        const postZ = (sz === 1) ? (wsZFore + wsD * 0.1) : (wsZAft - wsD * 0.1);
        box(b, 'hull', st.trim, postW, postH, postW,
          { x: sx * wsW, y: postH/2, z: postZ - wsCenterZ });
      }
    }
    
    // === SILLS (lower framing) ===
    // Longitudinal sills at deck level, spanning between corner posts
    const sillLen = wsD * 0.8;             // sill length (between posts)
    for (const sx of [1, -1]) {
      box(b, 'hull', st.trim, postW, sillThick, sillLen,
        { x: sx * wsW, y: -sillThick/2, z: 0 });
    }
    
    // Cross-sill (front to back at deck level)
    box(b, 'hull', st.trim, wsW * 2 + postW, sillThick, postW,
      { x: 0, y: -sillThick/2, z: (wsZFore + wsD * 0.1) - wsCenterZ });
    
    // === HEADER (top framing) ===
    // Header beam at top, flush with windscreen top (not above cabin roof)
    box(b, 'hull', st.trim, wsW * 2 + postW, headerThick, postW,
      { x: 0, y: wsH - headerThick/2, z: (wsZFore + wsD * 0.1) - wsCenterZ });
    
    // === MULLIONS (vertical dividers between panes) ===
    // Two mullions per side (3 panes each side) to minimize projection above cabin
    const mullionsPerSide = 2;
    for (let m = 1; m <= mullionsPerSide; m++) {
      const mullZ = wsZFore + wsD * (m / (mullionsPerSide + 1));
      for (const sx of [1, -1]) {
        box(b, 'hull', st.trim, postW, wsH, postW,
          { x: sx * wsW, y: wsH/2, z: mullZ - wsCenterZ });
      }
    }
    
    // === GLASS PANES (lights channel) ===
    // Side panes: 4 per side in mullion bays, raked front face
    const panesPerSide = mullionsPerSide + 1;  // 4 panes
    const paneZStep = wsD / panesPerSide;
    const glassT = 0.024;
    
    for (let p = 0; p < panesPerSide; p++) {
      const paneZFore = wsZFore + p * paneZStep;
      const paneZAft = paneZFore + paneZStep;
      const paneCenterZ = (paneZFore + paneZAft) / 2 - wsCenterZ;
      
      // Raked front glass for each pane bay
      const rakeOffset = Math.tan(rakeAngle) * wsH;
      for (const sx of [1, -1]) {
        // Side glass panels (vertical panes)
        box(b, 'lights', 0xfff2d8, glassT, wsH - sillThick, paneZStep - postW,
          { x: sx * (wsW - postW/2), y: wsH/2, z: paneCenterZ + paneZStep/4, rx: -rakeAngle });
      }
    }
    
    // === ROOF GLASS — a gridded skylight, not one sheet ===
    // The roof pane faces the camera almost square-on in the three-quarter
    // print. On the additive lights channel a large unbroken near-white plane
    // saturates to a flat white blowout with no form, which is what the review
    // caught. Splitting it BOTH ways — fore-aft ribs and a centre spine —
    // keeps the same warm glass area but breaks it with hull-coloured frame,
    // so it reads as a glazed cab roof instead of a lamp.
    const roofPanesForeAft = 3;             // panes fore-to-aft
    const roofPaneStep = (wsD * 0.7) / roofPanesForeAft;
    const roofMullionT = postW;
    const roofHalfW    = wsW - postW / 2;   // glazed half-width, inside the posts

    // Lateral ribs between the fore-aft panes.
    for (let m = 1; m < roofPanesForeAft; m++) {
      const mullZ = wsZFore + wsD * 0.15 + m * roofPaneStep;
      box(b, 'hull', st.trim, wsW * 2 - postW, headerThick, roofMullionT,
        { x: 0, y: wsH - headerThick / 2, z: mullZ - wsCenterZ });
    }

    // Centre spine running fore-aft, splitting every bay into port and
    // starboard panes. Without it each pane is still the cab's full beam.
    box(b, 'hull', st.trim, roofMullionT, headerThick, wsD * 0.7,
      { x: 0, y: wsH - headerThick / 2,
        z: (wsZFore + wsD * 0.15 + wsD * 0.7 / 2) - wsCenterZ });

    // Six panes: three bays fore-aft, port and starboard of the spine.
    const roofPaneW = roofHalfW - roofMullionT;
    for (let p = 0; p < roofPanesForeAft; p++) {
      const paneZCenter = wsZFore + wsD * 0.15 + (p + 0.5) * roofPaneStep;
      for (const sx of [1, -1]) {
        box(b, 'lights', 0xfff2d8, roofPaneW, glassT, roofPaneStep - roofMullionT,
          { x: sx * (roofMullionT / 2 + roofPaneW / 2),
            y: wsH - headerThick / 2, z: paneZCenter - wsCenterZ });
      }
    }
    
    b.pop();

    // ==== CABIN SIDE WINDOWS — warm glass DNA ====
    // Additional cabin windows on both flanks to bring lights count above 1000.
    // Port and starboard cabin side windows, arrayed along the cab section.
    const sideWinZFore = -2.10;
    const sideWinZAft  = -0.40;
    const sideWinCount = 5;               // windows per side
    const sideWinStep  = (sideWinZAft - sideWinZFore) / (sideWinCount + 1);
    
    for (let w = 1; w <= sideWinCount; w++) {
      const winZ = sideWinZFore + w * sideWinStep;
      const winSec = sectionAt(stations, winZ);
      const winY = winSec.y + winSec.h * 0.5; // mid-height on cabin
      
      // Port window (-X side)
      b.push(-winSec.w - 0.02, winY, winZ, -Math.PI / 2, 0, 0);
      box(b, 'lights', 0xfff2d8, 0.025, 0.35, 0.45, { z: 0.02 });
      b.pop();
      
      // Starboard window (+X side)
      b.push(winSec.w + 0.02, winY, winZ, Math.PI / 2, 0, 0);
      box(b, 'lights', 0xfff2d8, 0.025, 0.35, 0.45, { z: 0.02 });
      b.pop();
    }
    // Three cabin windows recessed into the starboard (+X) face of the cab.
    // Frame rotated ry=π/2 so local +Z = world +X (outboard); the well's
    // back edge sinks into the hull and the windows sit flush on the flank.
    const wwrZ   = -1.40;
    const wwrSec = sectionAt(stations, wwrZ);
    b.push(wwrSec.w, wwrSec.y, wwrZ, Math.PI / 2, 0, 0);
    warmWindowRow(b, st, { count: 3, ry: 0, sill: true });
    b.pop();

    // ==== PATCH PANELS — the two clearly replaced hull panels ====
    // Panel 1: cream slab on the starboard cab flank (i=1 → st.patch[1]).
    // Frame at hull starboard surface, ry=π/2 → local +Z = world +X.
    const pp1Z   = -1.80;
    const pp1Sec = sectionAt(stations, pp1Z);
    b.push(pp1Sec.w, 0.10, pp1Z, Math.PI / 2, 0, 0);
    patchPanel(b, st, { w: 0.80, h: 0.60, i: 1, ry: 0, proud: 0.06, seed: 5 });
    b.pop();

    // Panel 2: faded-blue plate on the ventral deck (i=2 → st.patch[2]).
    // rx=π/2 → local +Z = world −Y (downward, away from hull bottom).
    const pp2Z   = 2.00;
    const pp2Sec = sectionAt(stations, pp2Z);
    b.push(0, -(pp2Sec.y + pp2Sec.h) - 0.01, pp2Z, 0, Math.PI / 2, 0);
    patchPanel(b, st, { w: 0.70, h: 0.50, i: 2, ry: 0, proud: 0.05, seed: 7 });
    b.pop();

    // ==== CREW DOOR — port flank ====
    // HUMAN-scale door recessed into the port (−X) cab flank at mid-cab.
    // Frame ry=−π/2 → local +Z = world −X (outboard port). The dark recess
    // sinks inboard and the door panel protrudes slightly outboard.
    const doorZ   = -1.00;
    const doorSec = sectionAt(stations, doorZ);
    b.push(-doorSec.w, doorSec.y - doorSec.h * 0.22, doorZ, -Math.PI / 2, 0, 0);
    box(b, 'hull', st.hullDark, HUMAN.doorW + 0.06, HUMAN.doorH + 0.04, 0.09,
      { z: -0.045 });
    box(b, 'hull', weather(st.trim, 1), HUMAN.doorW, HUMAN.doorH, 0.04,
      { z: 0.02 });
    b.pop();

    // ==== RESCUE WINCH — bow cap ====
    // Large centered foredeck mount projecting from the bow cap as a silhouette cue.
    // Drum, arm and hook project toward −Z while overlapping the bow hull.
    const winchZ   = -3.25;              // forward on bow cap
    const winchSec = sectionAt(stations, winchZ);
    b.push(0, winchSec.y + winchSec.h, winchZ, 0);
    rescueWinch(b, st, { r: 0.32, len: 0.55, ry: 0, hook: true, seed: 5 });
    b.pop();

    // ==== OPEN WORK DECK — deckPlate ====
    // Flat deck slab on top of the low aft body, railing on three sides.
    // Frame at z=0.80 (forward ⅓ of deck area): the slab back edge reaches
    // to z ≈ −0.16, overlapping the step hull for attachment.
    const dkZ   = 0.80;
    const dkSec = sectionAt(stations, dkZ);
    const dkTop = dkSec.y + dkSec.h;
    b.push(0, dkTop, dkZ, 0);
    deckPlate(b, st, { w: 2.50, d: 2.40, rail: true, lamps: 0, seed: 7 });
    b.pop();

    // ==== TOOL LOCKERS — one per flank ====
    // Clamp-on boxes on the mid-deck flanks.  Pads reach inboard into the hull.
    // Frame ry=+π/2 → local +Z = world +X (starboard outboard).
    // Frame ry=−π/2 → local +Z = world −X (port outboard).
    const lkZ   = 1.40;
    const lkSec = sectionAt(stations, lkZ);

    b.push( lkSec.w, lkSec.y, lkZ,  Math.PI / 2, 0, 0);
    toolLocker(b, st, { w: 0.50, h: 0.42, d: 0.72, seed: 11 });
    b.pop();

    b.push(-lkSec.w, lkSec.y, lkZ, -Math.PI / 2, 0, 0);
    toolLocker(b, st, { w: 0.50, h: 0.42, d: 0.72, seed: 13 });
    b.pop();

    // ==== FLOOD LAMP — over the forward deck ====
    // One shrouded floodlight at the cab/deck transition, illuminating the
    // open work area aft.  Mounting plate sinks into the hull cap at the step.
    const flZ   = 0.40;
    const flSec = sectionAt(stations, flZ);
    b.push(0, flSec.y + flSec.h, flZ, 0);
    floodLamp(b, st, { r: 0.14, arm: 0.26, ry: 0, tilt: 0.15 });
    b.pop();

    // ==== STERN DRIVE ====
    // Old but maintained drive cluster closing the stern, 2 throats.
    const sternSec = sectionAt(stations, sternZ);
    b.push(0, 0, sternZ, 0);
    driveCluster(b, st, {
      w:       sternSec.w * 0.70,
      h:       sternSec.h * 0.60,
      len:     0.80,
      throats: 2,
      seed:    17,
    });
    b.pop();

    // ==== RUNNING LAMPS — LIGHTS CHANNEL ====
    // Dorsal lamp run: from bow shoulder through deck to stern shoulder.
    // Count is floored from run-length / HUMAN.lampGap (never from lampSize).
    const dorLampA = -2.60;
    const dorLampB =  2.60;
    const dorLampN = Math.floor((dorLampB - dorLampA) / HUMAN.lampGap);
    for (let i = 0; i < dorLampN; i++) {
      const lz  = dorLampA + i * HUMAN.lampGap;
      const ls  = sectionAt(stations, lz);
      // Position flush with hull top, not above it, to avoid projecting above cabin
      b.push(0, ls.y + ls.h, lz, 0);
      box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
      b.pop();
    }

    // Ventral lamp run: along the open work deck (aft of step).
    const venLampA = 0.20;
    const venLampB = 2.60;
    const venLampN = Math.floor((venLampB - venLampA) / HUMAN.lampGap);
    for (let i = 0; i < venLampN; i++) {
      const lz  = venLampA + i * HUMAN.lampGap;
      const ls  = sectionAt(stations, lz);
      b.push(0, ls.y - ls.h - 0.02, lz, 0);
      box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
      b.pop();
    }
  },
};
