/**
 * Veridian Combine — Light Scout (claim scout)
 *
 * Bible: "A narrow sensor-first dart with a small pressure cabin behind a large faceted survey head."
 *
 * Body plan: SENSOR-HEAD-DOMINANT DART. The instrument is the ship. The survey head at the bow is the widest and tallest volume; behind it the hull NECKS DOWN HARD into a slim tail boom. Plan view: broad arrowhead on a stick with two long outrigger ranging vanes. Side view: deep forward, shallow aft. The step from head to neck is the class read.
 *
 * Charter: target span 6.8 (largest on Z), hull 9,000-13,000 verts, lights >=260 and <=25% of hull, singleMass cell 0.6, glowZ ~3.0.
 */

import {
  loftHull, loftPlating, loftRib, sectionAt, loftExtents, chamferBlock,
} from './body.js';
import {
  LAMP, GLASS,
  rangingVane, sampleCanister, surveyAperture,
  driveSection,
  moduleLatch,
} from './motifs.js';
import {
  weather, box, lampString, windowRow,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const veridianLight = {
  glowZ: 3.0,
  build(b, st) {
    // ==== STATIONS ====
    // Sensor head dominates the bow, then hard neck step to slim tail boom.
    // Last station pushed aft to balance the forward-heavy survey aperture.
    const stations = [
      { z: -3.30, w: 0.34, h: 0.30, c: 0.38 },  // faceted nose ring
      { z: -3.05, w: 0.66, h: 0.48, c: 0.38 },  // intermediate facet station
      { z: -2.80, w: 1.02, h: 0.68, c: 0.38 },  // faceted head shoulder
      { z: -1.45, w: 1.10, h: 0.74, c: 0.36 },  // faceted head max volume
      { z: -1.30, w: 0.42, h: 0.30, c: 0.28 },  // HARD STEP to slim boom (0.15 apart)
      { z:  0.80, w: 0.42, h: 0.26, c: 0.30 },  // tail boom mid
      { z:  2.90, w: 0.38, h: 0.26, c: 0.32 },  // stern (soft chamfer)
    ];

    const extents = loftExtents(stations);
    const sternZ = extents.z1;

    // ==== HULL SHELL ====
    const hullHex = [st.hull, st.hullDark, st.hull];

    // Main hull shell with fore cap, NO seg parameter so chamfers work
    loftHull(b, 'hull', hullHex, { stations, capFore: true, capAft: false });

    // Plating on the four FLAT faces only, leaving the chamfer strips bare.
    // The class ceiling is 14,000 vertices and the survey aperture's instrument
    // face plus the drive section's own plating already spend most of it, so a
    // full eight-face course does not fit — three authoring passes met that
    // ceiling by switching the plating off entirely, which leaves the body a
    // bare shell wearing equipment. Plating the flats and skipping the cut
    // corners costs 720 vertices, reads as machined panel work exactly where
    // the eye follows the hull line, and is what a small serialized Combine
    // hull would actually be built from.
    // Plating on the four FLAT faces only, leaving the chamfer strips bare.
    // Graphite-dominated palette: mostly hull and weathered hull tones with
    // st.patch[0] for subtle emerald variation. Alloy (st.trim) reserved for
    // STRUCTURE — ribs, collars, walkways — not field plating.
    // Flank plating only. The class ceiling is 14,000 vertices and the survey
    // aperture's instrument face plus the drive section's own plating already
    // spend most of it; a full eight-face course does not fit, and four
    // authoring passes met that ceiling by switching plating off entirely,
    // which leaves the body a bare shell wearing equipment. Plating the two
    // flanks costs 432 vertices and puts the panel work exactly where the side
    // view reads it. The dorsal and ventral crowns carry frames and the service
    // strip instead, which is how a small Combine hull would really be built.
    loftPlating(b, 'hull', [st.hull, weather(st.hull, 1), weather(st.hull, 2), st.patch[0]], {
      stations, rows: 1, cols: 1, t: 0.03, inset: 0.2, seed: 11,
      faces: [0, 4],
    });

    // ==== RIB FRAMES ====
    // Head shoulder — where the hull widens abruptly from the nose ring
    loftRib(b, 'hull', st.trim, { stations, z: -2.80, out: 0.08, thick: 0.14 });
    // Head maximum-volume ring — frames the widest station; visible from the side
    loftRib(b, 'hull', st.trim, { stations, z: -1.45, out: 0.07, thick: 0.12 });
    // Neck step — marks the hard drop from head to tail boom; the class read
    loftRib(b, 'hull', st.trim, { stations, z: -1.30, out: 0.08, thick: 0.12 });
    // Boom forward frame — first tail structure
    loftRib(b, 'hull', st.trim, { stations, z: -0.20, out: 0.06, thick: 0.10 });
    // Boom mid frame — second tail structure
    loftRib(b, 'hull', st.trim, { stations, z: 0.80, out: 0.06, thick: 0.10 });
    // Boom aft frame — third tail structure
    loftRib(b, 'hull', st.trim, { stations, z: 1.80, out: 0.06, thick: 0.10 });
    // Dorsal service strip on boom deck — narrow alloy walkway for tail access
    const stripZ = 0.80;
    const stripS = sectionAt(stations, stripZ);
    b.push(0, stripS.y + stripS.h - 0.04, stripZ - 0.80, 0, 0, 0);
    chamferBlock(b, 'hull', st.trim, { w: 0.16, h: 0.06, d: 1.60, c: 0.25, taper: 1 });
    b.pop();
    // The largest single form on the ship. Pushed 0.30 units inside the nose ring
    // so the housing straddles the tip: the outer cyl covers z -3.60 to -3.00 and
    // the instrument face protrudes ~1.15 units forward of the hull cap.
    b.push(0, 0, -3.00, 0, 0, 0);
    surveyAperture(b, st, { r: 0.78, depth: 1.20, dir: -1, face: true });
    b.pop();

    // ==== PRESSURE CABIN ====
    // Small crew cabin let into dorsal head behind the aperture
    const cabinZ = -2.30;
    const cabinS = sectionAt(stations, cabinZ);
    const cabinR = 0.34;

    // Cabin hull block — chamferBlock overlaps the loft skin
    b.push(0, cabinS.y + cabinS.h - 0.12, cabinZ, 0, 0, 0);
    chamferBlock(b, 'hull', st.hull, { w: cabinR * 2, h: cabinR * 1.4, d: 0.60, c: 0.25, taper: 1 });
    b.pop();

    // Windows on BOTH flanks — axis:'z' so rows run fore-aft; HUMAN.windowGap
    // is the correct centre-to-centre pitch. ry orientates the face outward.
    const windowY = cabinS.y + cabinS.h - 0.12;
    const windowZ = cabinZ;

    // Starboard windows (ry PI/2: face points outward in +X)
    b.push(cabinR - 0.04, windowY, windowZ, 0, 0, 0);
    windowRow(b, 'lights', GLASS, {
      count: 2,
      spacing: HUMAN.windowGap,
      w: HUMAN.windowW,
      h: HUMAN.windowH,
      d: HUMAN.windowD + 0.04,
      x: 0, y: 0, z: 0,
      axis: 'z',
      ry: Math.PI / 2,
    });
    b.pop();

    // Port windows (ry -PI/2: face points outward in -X)
    b.push(-(cabinR - 0.04), windowY, windowZ, 0, 0, 0);
    windowRow(b, 'lights', GLASS, {
      count: 2,
      spacing: HUMAN.windowGap,
      w: HUMAN.windowW,
      h: HUMAN.windowH,
      d: HUMAN.windowD + 0.04,
      x: 0, y: 0, z: 0,
      axis: 'z',
      ry: -Math.PI / 2,
    });
    b.pop();

    // Crew hatch on starboard flank — hull-dark recess panel
    b.push(cabinR + 0.04, cabinS.y + cabinS.h * 0.3, cabinZ + 0.10, 0, 0, 0);
    box(b, 'hull', st.hullDark, HUMAN.doorW + 0.08, HUMAN.doorH + 0.08, 0.12, { x: 0, y: 0, z: 0 });
    b.pop();

    // ==== RANGING VANES ====
    // Long outrigger vanes rooted in head flanks — the arrowhead ears.
    // len 1.45 gives the broad arrowhead plan view the brief asks for.
    const vaneZ = -2.0;
    const vaneS = sectionAt(stations, vaneZ);
    const vaneX = vaneS.w - 0.12;

    // Starboard vane
    b.push(vaneX, vaneS.y, vaneZ, 0, 0, 0);
    rangingVane(b, st, { len: 1.45, chord: 0.36, thick: 0.06, ry: 0, lit: true, root: 0.4 });
    b.pop();

    // Port vane (mirrored 180° around Y)
    b.push(-vaneX, vaneS.y, vaneZ, 0, 0, 0);
    rangingVane(b, st, { len: 1.45, chord: 0.36, thick: 0.06, ry: Math.PI, lit: true, root: 0.4 });
    b.pop();

    // ==== SAMPLE CANISTERS ====
    // Two detachable canisters on tail boom flanks
    const canZ = 0.40;
    const canS = sectionAt(stations, canZ);
    const canX = canS.w - 0.08;

    // Starboard canister
    b.push(canX, canS.y + canS.h * 0.6, canZ, 0, 0, 0);
    sampleCanister(b, st, { r: 0.12, len: 0.42, seed: 1 });
    b.pop();

    // Its latch
    b.push(canX, canS.y + canS.h * 0.6, canZ + 0.21, 0, 0, 0);
    moduleLatch(b, st, { ry: 0, lit: true, s: 0.7 });
    b.pop();

    // Port canister
    b.push(-canX, canS.y + canS.h * 0.6, canZ, 0, 0, 0);
    sampleCanister(b, st, { r: 0.12, len: 0.42, seed: 2 });
    b.pop();

    // Its latch
    b.push(-canX, canS.y + canS.h * 0.6, canZ + 0.21, 0, 0, 0);
    moduleLatch(b, st, { ry: 0, lit: true, s: 0.7 });
    b.pop();

    // ==== DRIVE SECTION ====
    // Shared Veridian family drive — stepped armoured housing with radiator
    // panels, service plumbing, and recessed lit throats. w/h from sectionAt
    // so the housing meets the tail boom cross-section exactly. throats: 2 is
    // modest but still the family's drive language.
    const sternS = sectionAt(stations, sternZ);
    b.push(0, 0, sternZ, 0, 0, 0);
    driveSection(b, st, {
      r: Math.max(sternS.w, sternS.h),
      len: 0.80,
      throats: 2,
      seed: 1,
      w: sternS.w,
      h: sternS.h,
      c: 0.30,
    });
    b.pop();

    // ==== RUNNING LAMPS ====
    // Short lamp run on boom deck
    const boomZ = 0.90;
    const boomS = sectionAt(stations, boomZ);

    lampString(b, 'lights', LAMP, {
      ax: -0.20, ay: boomS.y - boomS.h + 0.06, az: boomZ - 0.30,
      bx: 0.20, by: boomS.y - boomS.h + 0.06, bz: boomZ - 0.30,
      count: 3,
      size: HUMAN.lampSize,
    });
  },
};
