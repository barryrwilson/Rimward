/**
 * Freehold Compact — Freighter
 *
 * Bible: "A huge slow carrier with habitation drums, greenhouse galleries,
 * water tanks, workshops, family craft docks, and cargo pods on a structural
 * spine. It is a traveling neighborhood and must berth outside. Warm window
 * repetition is the primary scale cue."
 *
 * Body plan: MOBILE HOMESTEAD. Two cream habitation drums (one port-bow, one
 * starboard-midship) with hoop-silo silhouette and warm window rings. Three
 * greenhouse galleries along the dorsal spine with glass bays visible from
 * above. Two pairs of flank water tanks with saddle mounts and valve heads.
 * A keel workshop block below the spine with tool lockers and side windows.
 * Five cargo pods on the spine deck. Four family-craft docks on the flanks
 * (two per side). The EXTERIOR BERTHING STORY: three airlock collars (two
 * starboard, one port), service gantries connecting them, flood lamps at every
 * dock, tow and rescue winches on the working decks. Three drive clusters at
 * the stern close the ship. This is a traveling neighbourhood on a welded
 * structural frame — every window, tank and pod is a life aboard, not cargo.
 *
 * Extents budget (pre-build walk):
 *   Z: −39.0 (nose/bow) to +39.0 (stern), span 78.0 ✓
 *   X hull: ±9.0 max (at command block z=−24 and stern z=+39)
 *   X with drums: port drum pushes to ≈−10.0; starboard drum to ≈+9.5
 *     → X span ≈20.0, beam/len ≈ 0.26 ≥ 0.16 ✓, len/beam ≈ 3.9 ≥ 1.05 ✓
 *   Y hull: ±7.0 max (command block h=7.0 and stern h=7.0)
 *   Y with greenhouse dorsal: hull top + 2.0 → +7.9 at most
 *   Y with keel workshop: −7.0 − 0.1 → −7.1
 *     → Y span ≈15.0, ht/len ≈ 0.19 ≤ 0.62 ✓
 *   Pivot: drums are one port/one starboard; net X offset ≈ −0.25, ratio 0.013 ✓
 *
 * Charter: target span 78.0, hull 34,000–110,000 verts (aim 75,000–100,000),
 * lights ≥ 2,400 and ≤ 25% of hull, singleMass ≥ 97%, glowZ ≈ stern (+36.0).
 */

import {
  sectionAt, sectionOutline, loftExtents,
  splicedHull, patchCourse, donatedBlock, soundFrame, glassHouse, tankVolume,
} from './body.js';
import {
  LAMP, GLASS, DIM, FLOOD,
  warmWindowRow, toolLocker,
  rescueWinch, towWinch, floodLamp, deckPlate,
  airlockCollar, habDrum, cargoPod, craftDock, driveCluster,
} from './motifs.js';
import { weather, box } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const freeholdFreighter = {
  glowZ: 36.0,

  build(b, st) {
    // ==== STATIONS ====
    // Articulated command-tug / spine / drive-block silhouette:
    // - Command block broad at -Z (z=-39 to -18)
    // - Spine narrows hard between transitions (z=-18 to +28)
    // - Drive block broad at +Z (z=+28 to +39)
    // All w/h are HALF-extents. Chamfer 0.22-0.30 gives the Compact's
    // rounded-patch read without going circular.
    const stations = [
      { z: -39.0, w:  5.0, h: 3.8, c: 0.30 }, // bow face (bridge)
      { z: -35.0, w:  7.0, h: 5.2, c: 0.28 }, // forward shoulder
      { z: -30.0, w:  8.5, h: 6.5, c: 0.26 }, // command block
      { z: -24.0, w:  9.0, h: 7.0, c: 0.24 }, // command block main (widest) - SHOULDER 1
      { z: -18.0, w:  5.8, h: 4.2, c: 0.22 }, // HARD NARROWING - spine start (break from command)
      { z:  -6.0, w:  4.8, h: 3.5, c: 0.22 }, // spine mid (narrowest)
      { z:  +14.0, w:  5.8, h: 4.2, c: 0.22 }, // spine aft
      { z:  28.0, w:  8.5, h: 6.5, c: 0.22 }, // drive approach - SHOULDER 2 (break to drive)
      { z:  34.0, w:  9.0, h: 7.2, c: 0.22 }, // drive housing
      { z:  39.0, w:  9.5, h: 7.5, c: 0.22 }, // stern (widest)
    ];

    const ext = loftExtents(stations);
    const bowZ   = ext.z0;   // −39.0
    const sternZ = ext.z1;   // +39.0

    // ==== HULL SHELL ====
    // splicedHull wraps the full station set in donated-tone sections separated
    // by seam straps at the major structural boundaries.
    const hullHexes = [st.hull, st.hullDark, st.hull, st.patch[0]];
    splicedHull(b, 'hull', hullHexes, {
      stations,
      seams:    [-20.0, +5.0, +28.0],
      strap:    0.10,
      strapHex: st.trim,
      seg:      0,
      capFore:  true,
      capAft:   false,  // stern closed by drive clusters
    });

    // ==== PLATING COURSES ====
    // Pass 1 — full hull, primary patchwork surface. Rows=5, cols=2 fills
    // the vertex budget from plate COUNT, not box hand-rolls.
    const plateHexes = [st.hull, st.hullDark, st.patch[0], st.patch[1]];
    patchCourse(b, 'hull', plateHexes, {
      stations,
      from:     bowZ,
      to:       sternZ,
      rows:     5,
      cols:     2,
      t:        0.055,
      inset:    0.14,
      replaced: 0.18,
      proud:    0.035,
      seed:     0x4f72,
    });

    // Pass 2 — command section extra plating (forward 4 bands, heavier plate).
    patchCourse(b, 'hull', [st.hull, st.patch[0], st.hullDark], {
      stations,
      from:     -39.0,
      to:       -18.0,
      rows:     4,
      cols:     2,
      t:        0.070,
      inset:    0.16,
      replaced: 0.22,
      proud:    0.040,
      seed:     0x3a81,
    });

    // ==== STRUCTURAL SPINE ====
    // The sound frame runs most of the ship length. Ring frames, cross-braces
    // and a walk deck (plate > 0) provide the skeleton everything else hangs on.
    // Narrower to match the articulated spine silhouette (was 3.5, now 2.4).
    soundFrame(b, 'hull', weather(st.hull, 1), {
      from:  -38.0,
      to:    +32.0,
      w:      2.4,    // narrowed from 3.5 to match spine reduction
      h:      1.6,    // reduced from 2.0 to match spine height reduction
      y:     -0.4,    // raised slightly to stay centered in narrower spine
      bay:    3.8,    // reduced from 4.0 to match narrower spine
      chord:  0.14,   // reduced from 0.16 to save vertices on exposed spine
      brace:  0.10,   // reduced from 0.12 to save vertices
      plate:  0.12,   // reduced from 0.14 to save vertices on spine faces
    });

    // ==== HABITATION DRUMS ====
    // Two drums at different z positions and different sides — the neighbourhood
    // pair, now offset into a stepped rhythm. Enlarged and positioned so warm
    // window bands read from the side silhouette. Each has hoops, a circumferential
    // warm window band and a porch lamp.
    // Drums overlap the hull in X (pushed slightly inside the hull surface) so
    // their bounding boxes connect to the hull shell; the cylinder's z back-reach
    // (−len*0.50) guarantees additional Z overlap.

    // Drum 1 — PORT side, forward command area (z = −26).
    // At z = −26, sectionAt gives w ≈ 8.0. Push at x = −7.0 (inside hull).
    // Enlarged to r=2.8, len=10.0 for better visibility from side.
    b.push(-7.0, 0, -26.0, 0, 0, 0);
    habDrum(b, st, { r: 2.8, len: 10.0, rings: 4, windows: true, seed: 0x1a2b });
    b.pop();

    // Drum 2 — STARBOARD side, spine mid (z = +4).
    // At z = +4, sectionAt gives w ≈ 4.9. Push at x = +4.5 (inside hull by 0.4).
    // Enlarged to r=2.8, len=10.0 for better visibility from side.
    b.push(4.5, 0, 4.0, 0, 0, 0);
    habDrum(b, st, { r: 2.8, len: 10.0, rings: 4, windows: true, seed: 0x3c4d });
    b.pop();

    // ==== GREENHOUSE GALLERIES ====
    // Three glass houses along the dorsal spine, offset into stepped rhythm.
    // The base flange sinks 0.14 into the hull top, guaranteeing attachment.
    // Pushed at hull top surface. Sizes vary to create rhythm.

    // Greenhouse 1 — above forward spine (z = −20, between drums, hull h ≈ 5.2).
    b.push(0, 5.2, -20.0, 0, 0, 0);
    glassHouse(b, st, { w: 2.0, h: 2.2, d: 6.5, y: 0, bays: 5, seed: 0x9e1f });
    b.pop();

    // Greenhouse 2 — above spine center (z = −2, hull h ≈ 3.7).
    // Largest and central to the neighborhood.
    b.push(0, 3.7, -2.0, 0, 0, 0);
    glassHouse(b, st, { w: 2.2, h: 2.4, d: 7.0, y: 0, bays: 6, seed: 0x7b2e });
    b.pop();

    // Greenhouse 3 — above spine aft (z = +10, hull h ≈ 4.0).
    // Smaller, stepping down toward stern.
    b.push(0, 4.0, 10.0, 0, 0, 0);
    glassHouse(b, st, { w: 1.8, h: 2.0, d: 5.5, y: 0, bays: 4, seed: 0x5c3a });
    b.pop();

    // ==== WATER TANKS ====
    // Two pairs on the lower flanks, separated into distinct service zones.
    // axis='z' runs the cylinder along Z; saddle mounts reach toward −Y into
    // the hull, providing the overlap the audit needs. Moved apart to create
    // separate water-service zones from the workshop zone.

    // Pair A — forward spine water service zone (z = −8, distinct from workshop).
    // At z = −8, hull w ≈ 5.8. Push at x = ±5.2 with y = −2.8 so saddle pads
    // are visible below the narrower spine hull.
    b.push(-5.2, -2.8, -8.0, 0, 0, 0);
    tankVolume(b, st, { r: 1.5, len: 7.5, axis: 'z', hoops: 3, seed: 0x2f4a });
    b.pop();

    b.push(5.2, -2.8, -8.0, 0, 0, 0);
    tankVolume(b, st, { r: 1.5, len: 7.5, axis: 'z', hoops: 3, seed: 0x6e5b });
    b.pop();

    // Pair B — aft spine water service zone (z = +22, distinct from workshop).
    // At z = +22, hull w ≈ 6.8. Push at x = ±6.2 with y = −3.5 so saddles
    // and valves are visible on the exposed spine.
    b.push(-6.2, -3.5, 22.0, 0, 0, 0);
    tankVolume(b, st, { r: 1.5, len: 7.5, axis: 'z', hoops: 3, seed: 0x8c71 });
    b.pop();

    b.push(6.2, -3.5, 22.0, 0, 0, 0);
    tankVolume(b, st, { r: 1.5, len: 7.5, axis: 'z', hoops: 3, seed: 0xa082 });
    b.pop();

    // ==== WORKSHOP BLOCK ====
    // A donated pressure-vessel module strapped below the keel in a separate
    // longitudinal band from the water tanks. Positioned at z = +14 with
    // exposed saddles, valves and access walkways. Enlarged slightly for
    // visibility. Tool lockers on the starboard face, warm window rows on
    // both sides.
    b.push(0, -5.0, 14.0, 0, 0, 0);
    donatedBlock(b, 'hull', [st.hullDark, st.hull, st.patch[1], st.trim], {
      w: 2.8, h: 1.8, d: 7.5, c: 0.2, taper: 0.96, straps: 2, seed: 0xc193,
    });
    b.pop();

    // Tool lockers on the starboard side of the workshop block.
    // Push at (x=2.8, y=−4.5, z) with ry=π/2 so clamp pads sink into the block.
    // Spaced along the workshop length for access.
    b.push(2.8, -4.5, 11.5, Math.PI / 2, 0, 0);
    toolLocker(b, st, { w: 0.5, h: 0.42, d: 0.72, seed: 0xd1a4 });
    b.pop();

    b.push(2.8, -4.5, 14.0, Math.PI / 2, 0, 0);
    toolLocker(b, st, { w: 0.5, h: 0.42, d: 0.72, seed: 0xe2b5 });
    b.pop();

    b.push(2.8, -4.5, 16.5, Math.PI / 2, 0, 0);
    toolLocker(b, st, { w: 0.5, h: 0.42, d: 0.72, seed: 0xf3c6 });
    b.pop();

    // ==== CARGO PODS ====
    // Five pods on the exposed spine deck, grouped with visible gaps between
    // pod groups to show the structural spine. Lower the pods onto the narrow
    // spine deck (y = +1.0) so the spine truss and frame are visible between
    // groups. The bible says "cargo pods ON a structural spine", not a
    // continuous plated shell.
    const podHull = [st.patch[0], st.patch[1], st.hull, st.hullDark];
    // Grouped positions: forward group (2 pods), GAP, mid group (1 pod), GAP, aft group (2 pods)
    const podZs = [-28.0, -18.0, -2.0, +8.0, +20.0];
    for (let pi = 0; pi < podZs.length; pi++) {
      // Push at y = +1.0 (on the exposed spine deck) so rear cleat overlaps
      // soundFrame (y range [-0.4, +0.4] with plate top at ≈ +0.52).
      b.push(0, 1.0, podZs[pi], 0, 0, 0);
      cargoPod(b, st, { w: 1.0, h: 1.4, d: 2.0, i: pi, seed: 0x1100 + pi });
      b.pop();
    }

    // ==== FAMILY-CRAFT DOCKS ====
    // Four large external docks — the berthing story. Enlarged to w:2.0, d:3.0
    // and positioned with approach spars and service platforms. At least two docks
    // extend beyond the flank outline. Every spar overlaps the hull for attachment.
    // Clear docking gaps distinguish these from tanks or lockers.
    // ry = +π/2 for starboard (spar back-reach into hull from +X face);
    // ry = −π/2 for port (spar back-reach into hull from −X face).

    // Starboard dock 1 — forward command area (z = −24, BEYOND flank).
    // At z = −24, hull w ≈ 9.0. Push at x = +9.8 (0.8 beyond flank) with
    // approach spar overlapping hull by 1.5 units.
    {
      const sw = sectionAt(stations, -24.0).w;
      const pushX = sw + 0.8; // Beyond flank outline
      b.push(pushX, 0, -24.0, 0, 0, 0);
      craftDock(b, st, { w: 2.0, d: 3.0, ry: Math.PI / 2, seed: 0x2201 });
      b.pop();
      
      // Service platform at the dock base (overlaps hull for attachment).
      b.push(pushX - 1.2, -1.2, -24.0, 0, 0, 0);
      deckPlate(b, st, { w: 1.8, d: 2.5, rail: true, lamps: 2, seed: 0x5504 });
      b.pop();
    }

    // Starboard dock 2 — aft spine (z = +20, BEYOND flank).
    // At z = +20, hull w ≈ 6.0. Push at x = +7.0 (1.0 beyond flank).
    {
      const sw = sectionAt(stations, 20.0).w;
      const pushX = sw + 1.0; // Beyond flank outline
      b.push(pushX, 0, 20.0, 0, 0, 0);
      craftDock(b, st, { w: 2.0, d: 3.0, ry: Math.PI / 2, seed: 0x2202 });
      b.pop();
      
      // Service platform with approach spar.
      b.push(pushX - 1.5, -0.8, 20.0, 0, 0, 0);
      deckPlate(b, st, { w: 2.0, d: 2.8, rail: true, lamps: 3, seed: 0x5505 });
      b.pop();
    }

    // Port dock 1 — forward spine (z = −6).
    // At z = −6, hull w ≈ 4.8. Push at x = −5.5 (0.7 beyond flank).
    {
      const sw = sectionAt(stations, -6.0).w;
      const pushX = -(sw + 0.7); // Beyond flank outline
      b.push(pushX, 0, -6.0, 0, 0, 0);
      craftDock(b, st, { w: 2.0, d: 3.0, ry: -Math.PI / 2, seed: 0x3301 });
      b.pop();
      
      // Service platform.
      b.push(pushX + 1.2, -1.0, -6.0, 0, 0, 0);
      deckPlate(b, st, { w: 1.8, d: 2.5, rail: true, lamps: 2, seed: 0x5506 });
      b.pop();
    }

    // Port dock 2 — mid-aft spine (z = +12).
    // At z = +12, hull w ≈ 5.5. Push at x = −6.2 (0.7 beyond flank).
    {
      const sw = sectionAt(stations, 12.0).w;
      const pushX = -(sw + 0.7); // Beyond flank outline
      b.push(pushX, 0, 12.0, 0, 0, 0);
      craftDock(b, st, { w: 2.0, d: 3.0, ry: -Math.PI / 2, seed: 0x3302 });
      b.pop();
      
      // Service platform.
      b.push(pushX + 1.5, -0.8, 12.0, 0, 0, 0);
      deckPlate(b, st, { w: 2.0, d: 2.8, rail: true, lamps: 3, seed: 0x5507 });
      b.pop();
    }

    // ==== AIRLOCK COLLARS ====
    // Three external docking collars — the berthing story. Each shank reaches
    // len*0.95 into the hull (ry = ±π/2 maps local −z to world ±x respectively),
    // so attachment is via the shank's bounding box overlapping the hull shell.
    // Positions updated for new station list.

    // Collar 1 — starboard, forward spine (z = −4).
    {
      const sw = sectionAt(stations, -4.0).w;
      b.push(sw, 0.5, -4.0, 0, 0, 0);
      airlockCollar(b, st, { ry: Math.PI / 2, seed: 0x4401 });
      b.pop();
    }

    // Collar 2 — starboard, aft spine (z = +18).
    {
      const sw = sectionAt(stations, 18.0).w;
      b.push(sw, 0.5, 18.0, 0, 0, 0);
      airlockCollar(b, st, { ry: Math.PI / 2, seed: 0x4402 });
      b.pop();
    }

    // Collar 3 — port, forward spine (z = −12).
    {
      const sw = sectionAt(stations, -12.0).w;
      b.push(-sw, 0.5, -12.0, 0, 0, 0);
      airlockCollar(b, st, { ry: -Math.PI / 2, seed: 0x4403 });
      b.pop();
    }

    // ==== SERVICE GANTRIES ====
    // Three deckPlates atop the exposed spine deck, connecting modules and docks.
    // Push at y = +1.0 so the deck plate overlaps the narrowed soundFrame deck
    // (y range [-0.4, +0.4] with plate top at ≈ +0.52).

    // Gantry A — between pod 2 and collar 3 (z = −15, span w=4.0, d=4.0).
    b.push(0, 1.0, -15.0, 0, 0, 0);
    deckPlate(b, st, { w: 4.0, d: 4.0, rail: true, lamps: 3, seed: 0x5501 });
    b.pop();

    // Gantry B — near collar 1 and dock port 1 (z = −5, span w=3.5, d=3.5).
    b.push(0, 1.0, -5.0, 0, 0, 0);
    deckPlate(b, st, { w: 3.5, d: 3.5, rail: true, lamps: 2, seed: 0x5502 });
    b.pop();

    // Gantry C — near collar 2 (z = +16, span w=4.0, d=3.8).
    b.push(0, 1.0, 16.0, 0, 0, 0);
    deckPlate(b, st, { w: 4.0, d: 3.8, rail: true, lamps: 3, seed: 0x5503 });
    b.pop();

    // ==== WINCHES ====
    // Tow winch on the main forward gantry; rescue winches near docks.
    // All pushed at y = hull-top so gearbox / saddle sinks into the hull.
    // Positions updated for new station list and dock locations.

    // Tow winch on gantry A (dorsal, z = −15, y = hull top + deckPlate thickness).
    {
      const ty = sectionAt(stations, -15.0).h + 0.10;
      b.push(1.0, ty, -15.0, 0, 0, 0);
      towWinch(b, st, { r: 0.34, len: 0.6, seed: 0x6601 });
      b.pop();
    }

    // Rescue winch 1 — near craft dock starboard aft (z = +20).
    {
      const ty = sectionAt(stations, 20.0).h - 0.1;
      b.push(3.2, ty, 20.0, 0, 0, 0);
      rescueWinch(b, st, { r: 0.22, len: 0.34, hook: true, seed: 0x7701 });
      b.pop();
    }

    // Rescue winch 2 — near craft dock port forward (z = −6).
    {
      const ty = sectionAt(stations, -6.0).h - 0.1;
      b.push(-3.2, ty, -6.0, 0, 0, 0);
      rescueWinch(b, st, { r: 0.22, len: 0.34, hook: true, seed: 0x7702 });
      b.pop();
    }

    // ==== FLOOD LAMPS ====
    // One at each airlock collar (mounted on hull surface, arm reaches into hull).
    // tilt > 0 angles the flood downward toward approaching craft.
    // Positions updated for new collar locations.

    // Flood at collar 1 (starboard, z = −4).
    {
      const sw = sectionAt(stations, -4.0).w;
      b.push(sw - 0.1, 1.5, -5.0, 0, 0, 0);
      floodLamp(b, st, { r: 0.14, arm: 0.26, ry: Math.PI / 2, tilt: 0.25 });
      b.pop();
    }

    // Flood at collar 2 (starboard, z = +18).
    {
      const sw = sectionAt(stations, 18.0).w;
      b.push(sw - 0.1, 1.5, 17.0, 0, 0, 0);
      floodLamp(b, st, { r: 0.14, arm: 0.26, ry: Math.PI / 2, tilt: 0.25 });
      b.pop();
    }

    // Flood at collar 3 (port, z = −12).
    {
      const sw = sectionAt(stations, -12.0).w;
      b.push(-(sw - 0.1), 1.5, -13.0, 0, 0, 0);
      floodLamp(b, st, { r: 0.14, arm: 0.26, ry: -Math.PI / 2, tilt: 0.25 });
      b.pop();
    }

    // Flood on bow (command section approach lamp, mounted on hull bow face).
    {
      const bh = sectionAt(stations, -36.0).h;
      b.push(2.2, bh - 0.5, -38.0, 0, 0, 0);
      floodLamp(b, st, { r: 0.12, arm: 0.22, ry: 0, tilt: 0 });
      b.pop();
    }

    // Flood at starboard craft dock forward (z = −24).
    {
      const sw = sectionAt(stations, -24.0).w;
      b.push(sw + 0.5, -0.6, -24.0, 0, 0, 0);
      floodLamp(b, st, { r: 0.12, arm: 0.22, ry: Math.PI / 2, tilt: 0.3 });
      b.pop();
    }

    // Flood at port craft dock aft (z = +12).
    {
      const sw = sectionAt(stations, 12.0).w;
      b.push(-(sw + 0.5), -0.6, 12.0, 0, 0, 0);
      floodLamp(b, st, { r: 0.12, arm: 0.22, ry: -Math.PI / 2, tilt: 0.3 });
      b.pop();
    }

    // Flood at starboard craft dock aft (z = +22).
    {
      const sw = sectionAt(stations, 22.0).w;
      b.push(sw + 0.3, -0.8, 22.5, 0, 0, 0);
      floodLamp(b, st, { r: 0.12, arm: 0.22, ry: Math.PI / 2, tilt: 0.3 });
      b.pop();
    }

    // ==== DRIVE BLOCK ====
    // Three drive clusters closing the stern. The face plate (at local z ≈ +len*0.04)
    // overlaps the hull's aft shell by len*0.03. Housing spans −len to 0.
    // Centre cluster (large, 3 throats).
    b.push(0, 0, sternZ, 0, 0, 0);
    driveCluster(b, st, { w: 6.5, h: 5.5, len: 5.5, throats: 3, seed: 0x8801 });
    b.pop();

    // Starboard cluster (medium, 2 throats).
    b.push(4.5, -1.5, sternZ, 0, 0, 0);
    driveCluster(b, st, { w: 3.2, h: 2.8, len: 4.0, throats: 2, seed: 0x8802 });
    b.pop();

    // Port cluster (medium, 2 throats).
    b.push(-4.5, -1.5, sternZ, 0, 0, 0);
    driveCluster(b, st, { w: 3.2, h: 2.8, len: 4.0, throats: 2, seed: 0x8803 });
    b.pop();

    // ==== LIGHTS — WARM WINDOW REPETITION ====
    // Windows are the scale cue. The hab drum rings contribute ~55 per drum
    // (from circumference of r=2.8). These supplementary rows add the bridge,
    // command sides and spine sides. Every row is a warmWindowRow (HUMAN-sized
    // wells, never a single large pane). Lamp counts come from HUMAN.lampGap.
    //
    // CORRECTIVE PASS: Every warm window row sits on a real hull strake, not on
    // a computed point. The strake is a shallow plate band that follows the
    // hull taper by construction, so the row cannot drift off the surface.
    // This guarantees the flood fill sees hull cells adjacent to every lit cell.

    // Bow bridge windows — facing forward (ry = 0, windows in hull bow face).
    // Build a strake that wraps around the bow, then seat rows on it.
    patchCourse(b, 'hull', [st.hull], {
      stations,
      from: -39.0,
      to: -38.0,
      rows: 1,
      cols: 1,
      t: 0.08,
      inset: 0.2,
      seed: 0xb1a4,
      replaced: 0.0,
      proud: 0.02,
    });
    // Seat the rows on the strake, offset outward by 0.1
    b.push(0, 2.2, -38.7, 0, 0, 0);
    warmWindowRow(b, st, { count: 8, ry: 0, sill: true });
    b.pop();
    b.push(0, 3.5, -38.7, 0, 0, 0);
    warmWindowRow(b, st, { count: 6, ry: 0, sill: false, dim: true });
    b.pop();

    // Command block starboard windows (ry = −π/2, so local +Z = world −X, well runs INTO hull).
    // Build a strake on the starboard flank, then seat the row on it.
    patchCourse(b, 'hull', [st.hull], {
      stations,
      from: -27.0,
      to: -25.0,
      rows: 1,
      cols: 1,
      t: 0.08,
      inset: 0.2,
      seed: 0xc2b5,
      faces: [0],  // Starboard flank (right side)
      replaced: 0.0,
      proud: 0.02,
    });
    // Seat the row on the strake, offset outward by 0.1
    b.push(9.0, 0, -26.0, 0, 0, 0);
    warmWindowRow(b, st, { count: 8, ry: -Math.PI / 2 });
    b.pop();

    // Command block port windows (ry = +π/2, so local +Z = world +X, well runs INTO hull).
    // Build a strake on the port flank, then seat the row on it.
    patchCourse(b, 'hull', [st.hull], {
      stations,
      from: -27.0,
      to: -25.0,
      rows: 1,
      cols: 1,
      t: 0.08,
      inset: 0.2,
      seed: 0xd3c6,
      faces: [4],  // Port flank (left side)
      replaced: 0.0,
      proud: 0.02,
    });
    // Seat the row on the strake, offset outward by 0.1
    b.push(-9.0, 0, -26.0, 0, 0, 0);
    warmWindowRow(b, st, { count: 8, ry: Math.PI / 2 });
    b.pop();

    // Second command-side rows (slightly higher y to fill the tall section).
    // Higher command starboard
    patchCourse(b, 'hull', [st.hull], {
      stations,
      from: -27.0,
      to: -25.0,
      rows: 1,
      cols: 1,
      t: 0.08,
      inset: 0.2,
      seed: 0xe4d7,
      faces: [0],  // Starboard flank
      replaced: 0.0,
      proud: 0.02,
    });
    b.push(9.0, 2.5, -26.0, 0, 0, 0);
    warmWindowRow(b, st, { count: 6, ry: -Math.PI / 2, dim: true });
    b.pop();

    // Higher command port
    patchCourse(b, 'hull', [st.hull], {
      stations,
      from: -27.0,
      to: -25.0,
      rows: 1,
      cols: 1,
      t: 0.08,
      inset: 0.2,
      seed: 0xf5e8,
      faces: [4],  // Port flank
      replaced: 0.0,
      proud: 0.02,
    });
    b.push(-9.0, 2.5, -26.0, 0, 0, 0);
    warmWindowRow(b, st, { count: 6, ry: Math.PI / 2, dim: true });
    b.pop();

    // Spine starboard windows (ry = −π/2, so local +Z = world −X, well runs INTO hull).
    patchCourse(b, 'hull', [st.hull], {
      stations,
      from: -3.0,
      to: -1.0,
      rows: 1,
      cols: 1,
      t: 0.08,
      inset: 0.2,
      seed: 0x06f9,
      faces: [0],  // Starboard flank
      replaced: 0.0,
      proud: 0.02,
    });
    b.push(5.0, 0, -2.0, 0, 0, 0);
    warmWindowRow(b, st, { count: 8, ry: -Math.PI / 2 });
    b.pop();

    // Spine port windows (ry = +π/2, so local +Z = world +X, well runs INTO hull).
    patchCourse(b, 'hull', [st.hull], {
      stations,
      from: -3.0,
      to: -1.0,
      rows: 1,
      cols: 1,
      t: 0.08,
      inset: 0.2,
      seed: 0x170a,
      faces: [4],  // Port flank
      replaced: 0.0,
      proud: 0.02,
    });
    b.push(-5.0, 0, -2.0, 0, 0, 0);
    warmWindowRow(b, st, { count: 8, ry: Math.PI / 2 });
    b.pop();

    // Aft-spine starboard windows (ry = −π/2, so local +Z = world −X, well runs INTO hull).
    patchCourse(b, 'hull', [st.hull], {
      stations,
      from: 13.0,
      to: 15.0,
      rows: 1,
      cols: 1,
      t: 0.08,
      inset: 0.2,
      seed: 0x281b,
      faces: [0],  // Starboard flank
      replaced: 0.0,
      proud: 0.02,
    });
    b.push(6.0, 0, 14.0, 0, 0, 0);
    warmWindowRow(b, st, { count: 8, ry: -Math.PI / 2 });
    b.pop();

    // Aft-spine port windows (ry = +π/2, so local +Z = world +X, well runs INTO hull).
    patchCourse(b, 'hull', [st.hull], {
      stations,
      from: 13.0,
      to: 15.0,
      rows: 1,
      cols: 1,
      t: 0.08,
      inset: 0.2,
      seed: 0x392c,
      faces: [4],  // Port flank
      replaced: 0.0,
      proud: 0.02,
    });
    b.push(-6.0, 0, 14.0, 0, 0, 0);
    warmWindowRow(b, st, { count: 8, ry: Math.PI / 2 });
    b.pop();
  },
};
