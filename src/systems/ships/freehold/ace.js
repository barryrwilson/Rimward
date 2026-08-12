/**
 * Freehold Compact - Ace (Local Legend)
 *
 * Bible: "A lovingly rebuilt runabout stripped of unnecessary mass, with
 * hand-fitted fairings, exposed tuned maneuvering clusters, and one personal
 * but non-heraldic paint treatment."
 *
 * Body plan: WAISTED REBUILT RUNABOUT. The open work deck is gone. The body is
 * slim and waisted — pinched at midships, swelling again at the shoulders
 * forward and at the drive aft — with hand-fitted fairings smoothing every
 * joint. A single small bubble canopy sits low and forward. Exposed tuned
 * thruster clusters ride short outrigger stubs at the shoulder. The tail runs
 * long into an oversized two-throat drive for the hull size. Side view: low,
 * lean, and clearly waisted where the light class is boxy; the waist, the
 * canopy and the outrigger stubs make the silhouette unmistakable.
 *
 * Charter: target span 7.2, Z -3.60 to +3.55 = 7.15 hull (+ drive protrusion
 * ≈ 7.45), hull 4,000–15,000 verts, lights ≥ 260 and ≤ 25% of hull,
 * singleMass cell 0.7, glowZ 3.40.
 *
 * EXTENT BUDGET (computed before build):
 *   Z  -3.60 … +3.85  span ≈ 7.45   (drive face plate protrudes past stern)
 *   X  ±1.80           span ≈ 3.60   (thruster mount box outer edge)
 *   Y  ±0.91           span ≈ 1.82   (drive-cluster radiator fin top)
 * Ratios: Z/X 2.07 ≥ 1.15 ✓  Y/Z 0.245 ≤ 0.60 ✓  X/Z 0.483 ≥ 0.16 ✓
 * Waist: shoulder w 0.98 / h 0.78 → waist w 0.58 / h 0.46 (−41%).
 */

import {
  splicedHull, patchCourse, soundFrame, loftRib, loftExtents,
  sectionAt,
} from './body.js';
import {
  LAMP,
  warmWindowRow, thrusterCluster, driveCluster,
  toolLocker, rescueWinch,
} from './motifs.js';
import { weather, box } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const freeholdAce = {
  glowZ: 3.40,

  build(b, st) {
    // ==== STATIONS ====
    // Fine bow; shoulder swell; genuine WAIST (both w and h dip at midships);
    // swell into the drive housing; oversized stern. seg=2 on the loft gives
    // the smooth intermediate rings that read as hand-faired skin.
    //
    // Shoulder (z -1.40): w 0.98, h 0.78
    // Waist front (z -0.20): w 0.58, h 0.46  — dip 0.40 / 0.32 (real waist)
    // Waist rear  (z  0.60): w 0.56, h 0.44  — hold the pinch
    const stations = [
      { z: -3.60, w: 0.28, h: 0.22, c: 0.18 }, // fine bow — nose tip
      { z: -2.60, w: 0.74, h: 0.60, c: 0.22 }, // forward body — growing
      { z: -1.40, w: 0.98, h: 0.78, c: 0.22 }, // SHOULDER — widest fwd
      { z: -0.20, w: 0.58, h: 0.46, c: 0.18 }, // WAIST front — pinch begins
      { z:  0.60, w: 0.56, h: 0.44, c: 0.18 }, // WAIST rear  — hold pinch
      { z:  1.90, w: 0.92, h: 0.82, c: 0.20 }, // drive swell
      { z:  3.55, w: 1.08, h: 0.90, c: 0.18 }, // stern — oversized drive housing
    ];

    const extents = loftExtents(stations);
    const bowZ   = extents.z0;  // −3.60
    const sternZ = extents.z1;  //  +3.55

    // ==== HULL SHELL ====
    // One seam at z 0.90 (just past the waist rear, before the drive swell):
    // forward section in barn red, aft section in a slightly aged donor tone,
    // cream strap at the seam. Fewer seams than the light class signals the
    // re-skin: this hull was properly faired, not bolted panel-by-panel.
    splicedHull(b, 'hull', [st.hull, weather(st.hull, 1), st.trim], {
      stations,
      seams:   [0.90],
      strap:   0.07,
      seg:     2,
      capFore: true,
      capAft:  true,
      seed:    3,
    });

    // ==== COURSES ====

    // ONE personal paint treatment: accent stripe on the dorsal crown (face 2)
    // running the full length — a racing pin-stripe, nothing heraldic.
    // Made wider and more deliberate to stand as the ace's signature.
    patchCourse(b, 'hull', st.accent, {
      stations, from: bowZ, to: sternZ,
      rows: 1, cols: 1, t: 0.10, inset: 0.18, seed: 2, faces: [2],
    });

    // Fairing strips on upper chamfers (faces 1, 3): the hand-fitted read.
    // Cream panels mixed in because the fairing was fitted by a different hand.
    patchCourse(b, 'hull', [st.hull, weather(st.hull, 1), st.trim], {
      stations, from: bowZ, to: sternZ,
      rows: 2, cols: 1, t: 0.08, inset: 0.16, seed: 5, faces: [1, 3],
    });

    // Flank plating (faces 0, 4): donated panel mix, some clearly replaced.
    patchCourse(b, 'hull', [st.hull, st.patch[0], weather(st.hull, 1)], {
      stations, from: bowZ, to: sternZ,
      rows: 3, cols: 1, t: 0.08, inset: 0.14, seed: 7, faces: [0, 4],
    });

    // Lower chamfers (faces 5, 7): underside construction language.
    patchCourse(b, 'hull', [st.hullDark, weather(st.hullDark, 1)], {
      stations, from: bowZ, to: sternZ,
      rows: 2, cols: 1, t: 0.07, inset: 0.14, seed: 11, faces: [5, 7],
    });

    // Ventral keel strake (face 6): cream structural trim, full length.
    patchCourse(b, 'hull', st.trim, {
      stations, from: bowZ, to: sternZ,
      rows: 1, cols: 1, t: 0.07, inset: 0.14, seed: 13, faces: [6],
    });

    // ==== RIB FRAMES ====
    // Cream collar rings at the major geometry transitions. The seam strap
    // (at z 0.90, inside splicedHull) handles that joint; explicit ribs sit
    // at the stations where the hull shape changes fastest.
    loftRib(b, 'hull', st.trim, { stations, z: -2.60, out: 0.07, thick: 0.11 }); // fwd body
    loftRib(b, 'hull', st.trim, { stations, z: -1.40, out: 0.08, thick: 0.12 }); // shoulder
    loftRib(b, 'hull', st.trim, { stations, z:  1.90, out: 0.08, thick: 0.12 }); // drive swell

    // ==== SOUND FRAME ====
    // The structural spine: a welded box girder running inside the skin.
    // Started past the fine bow tip (z −2.80) so the chord half-size (0.055)
    // stays inside the hull envelope at the narrowest point in that range.
    soundFrame(b, 'hull', weather(st.trim, 2), {
      from: -2.80, to: 3.10,
      w: 0.28, h: 0.22, y: 0, bay: 2.4, chord: 0.11, brace: 0.08,
    });

    // ==== OUTRIGGER STUBS AND EXPOSED TUNED CLUSTERS ====
    // Extended stubs riding the shoulder (z −1.40), one port and one starboard.
    // Each stub overlaps the hull in X by ~0.16 units and carries an EXPOSED
    // tuned maneuvering cluster at its tip — the cluster reads as hardware in
    // silhouette, not only as emissive pixels. The stub root has a cream clamp
    // band, and a dorsal plumbing run gives the hand-fitted read.
    const shoulderSec = sectionAt(stations, -1.40); // w 0.98, h 0.78

    for (const sx of [1, -1]) {
      // Frame at the shoulder z.
      b.push(0, 0, -1.40, 0, 0, 0);

      // Stub centre: further outboard for exposed cluster read.
      // Inner edge at ±0.82 (hull w 0.98 → overlap 0.16). Half-width 0.44 in X.
      const stubCX = sx * (shoulderSec.w + 0.16);  // ≈ ±1.14
      b.push(stubCX, 0.08, 0, 0, 0, 0);  // Raised Y for cluster visibility

      // Stub body — extended depth 0.72 (z ±0.36 in stub frame).
      box(b, 'hull', weather(st.hull, 1), 0.88, 0.28, 0.72);

      // Cream clamp band at the stub root (inboard end), flush with hull face.
      box(b, 'hull', st.trim, 0.92, 0.12, 0.14, { z: -0.29 });

      // Dorsal plumbing run — a thin cream pipe strip on the stub top face.
      box(b, 'hull', weather(st.trim, 2), 0.10, 0.06, 0.64, { y: 0.15 });

      // EXPOSED tuned maneuvering cluster at the stub outer tip.
      // Larger radius (0.18) and more nozzles (4) for clear three-part silhouette.
      // Cluster pushed sx * 0.52 outboard from stub centre (world x ≈ ±1.66),
      // giving clear separation from hull while maintaining root overlap.
      b.push(sx * 0.52, -0.02, 0.20, 0, 0, 0);
      thrusterCluster(b, st, { r: 0.18, count: 4, ry: 0, seed: 7 + sx });
      b.pop();

      b.pop(); // stub frame
      b.pop(); // shoulder z frame
    }

    // ==== BUBBLE CANOPY ====
    // A single small canopy: warmWindowRow of 2 windows set into a dark
    // recessed well, with cream sill. Placed low and forward on the dorsal
    // face near the bow — the ONLY glazed volume forward, very different from
    // the light class's wrap-around greenhouse cab. Size unchanged — the ace
    // must not become a smaller light with different paint.
    const canopyZ   = -2.40;
    const canopySec = sectionAt(stations, canopyZ); // h ≈ 0.54
    b.push(0, canopySec.h + 0.02, canopyZ, 0, 0, 0);
    warmWindowRow(b, st, { count: 2, ry: 0, sill: true, dim: false });
    b.pop();

    // ==== STERN / DRIVE CLUSTER ====
    // Deliberately oversized for the hull: w 0.82, h: 0.60, len 0.90, 2 throats.
    // Pushed to sternZ + 0.22 so the housing overlaps the stern body (overlap
    // in Z ≈ 0.23) and the face plate protrudes visibly past the stern cap.
    // Drive housing X half-width 0.886 < stern hull w 1.08; Y fins reach
    // ±0.70, comfortably inside the Y envelope.
    b.push(0, 0, sternZ + 0.22, 0, 0, 0);
    driveCluster(b, st, { w: 0.82, h: 0.60, len: 0.90, throats: 2, ry: 0, seed: 17 });
    b.pop();

    // ==== TOOL LOCKER (RECESSED) ====
    // One recessed locker on the port flank at mid-ship. Scaled down and
    // partially inset so it doesn't compete with the exposed tuned clusters
    // and hand-fitted fairings. The ace brief is stripped mass, not working
    // gear like the light class.
    const lockerZ   = 1.10;
    const lockerSec = sectionAt(stations, lockerZ); // w ≈ 0.72
    b.push(-lockerSec.w - 0.01, 0, lockerZ, 0, -90, 0);
    toolLocker(b, st, { w: 0.36, h: 0.30, d: 0.50, ry: 0, seed: 3 });
    b.pop();

    // ==== RESCUE WINCH (RECESSED) ====
    // Minimum rescue gear: a small winch on the forward ventral face.
    // Scaled down and recessed deeper into the body so the tuned clusters
    // dominate the read. This is functional backup, not the ace's identity.
    const winchZ   = -1.90;
    const winchSec = sectionAt(stations, winchZ); // h ≈ 0.72
    b.push(0, -(winchSec.h + 0.06), winchZ, 0, 0, 0);  // Recessed 0.06 deeper
    rescueWinch(b, st, { r: 0.15, len: 0.24, ry: 0, hook: true, seed: 5 });
    b.pop();

    // ==== LIGHTS ====

    // Canopy glass — emitted to 'lights' by warmWindowRow above.
    // Drive throats — emitted to 'lights' by driveCluster above.
    // Thruster nozzle glows — emitted to 'lights' by thrusterCluster above.

    // Dorsal lamp run at HUMAN.lampGap spacing, bow to stern.
    const lampStart = bowZ  + 0.40;  // −3.20
    const lampEnd   = sternZ - 0.40; //  +3.15
    const lampCount = Math.floor((lampEnd - lampStart) / HUMAN.lampGap); // ≈ 5
    for (let i = 0; i < lampCount; i++) {
      const lz = lampStart + i * HUMAN.lampGap;
      const ls = sectionAt(stations, lz);
      b.push(0, ls.h + 0.03, lz, 0, 0, 0);
      box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
      b.pop();
    }
  },
};
