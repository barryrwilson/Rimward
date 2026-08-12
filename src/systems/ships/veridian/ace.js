/**
 * Ace — Veridian patent demonstrator. An unusually seamless scout built around
 * one oversized emerald sensor aperture and twin high-output drives. Fewer visible
 * seams than the rest of the fleet; one unmistakable split-tail profile.
 *
 * Charter: 5.94-7.59 (target 7.2), hull 4,000-15,000 verts,
 * lights ≥260 and ≤25% of hull, singleMass 0.6, glowZ ~2.8.
 *
 * Body plan: Seamless teardrop that forks at the stern into twin drive booms.
 * The main body uses seg=14 so its cross-section is a genuine smooth ellipse
 * (seg=0 produces 8-point chamfered octagon; seg<4 collapses; seg=14 reads as
 * smooth at any reviewer distance). Booms use seg=0 (chamfered-octagon), splayed
 * to x±0.95 so the fork gap is unmistakable in plan view. Each boom root overlaps
 * the main body at z≈0.10 where body width ≈0.82 and the boom inner chamfer vertex
 * sits at world x≈0.66, well inside the body — the attachment audit sees one
 * connected mass without any bridge piece.
 */

import {
  loftHull, loftPlating, chamferBlock, sectionAt,
} from './body.js';
import {
  LAMP, GLASS, OPTIC,
  rangingVane, surveyAperture, driveSection,
} from './motifs.js';
import { weather, box, windowRow, lampString } from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const veridianAce = {
  glowZ: 2.8,

  build(b, st) {
    const ch = 'hull';
    const hl = 'lights';

    // Main body stations — lifting-body teardrop: flat belly, domed spine.
    // The ventral line (y - h) stays at about -0.28 along the length,
    // giving a wing-section profile in side view that no sibling has.
    const mainStations = [
      { z: -2.5, w: 0.18, h: 0.14, y: -0.14 },  // tip — aperture mount
      { z: -0.4, w: 0.96, h: 0.58, y: 0.30 },  // widest cross-section
      { z:  0.2, w: 0.78, h: 0.52, y: 0.24 },  // taper toward fork
      { z:  0.7, w: 0.60, h: 0.42, y: 0.14 },  // fork base — reduced for booms
      { z:  2.0, w: 0.44, h: 0.32, y: 0.04 },  // aft notch
    ];
    const seg = 8;  // cross-section reads as smooth at ship scale; seamless is about panel joints, not vertex count

    // ===== MAIN HULL — smooth ellipse shell =====
    loftHull(b, ch, [st.hull, weather(st.hull, 1)], {
      stations: mainStations, seg, capFore: true, capAft: true,
    });

    // Coarse, large, precisely-fitted plating — the ace hallmark.
    // Low row count (1) = big panels. Small t = tight fitment. Large inset = deep seams.
    loftPlating(b, ch, [st.trim, weather(st.hull, 1), weather(st.hull, 2)], {
      stations: mainStations, seg,
      rows: 1, cols: 1, t: 0.028, inset: 0.60, seed: 7,
    });

    // ===== SURVEY APERTURE — the instrument this ship exists to carry =====
    // Pushed at the tip station; shank anchors back through the hull.
    // r=0.88 on body max-width 0.96 → 91.7% fill — largest aperture-to-hull ratio
    // in the Veridian family.  face:true gives the full detail package: bezel,
    // sunk iris, retaining ring, six mounting bosses, calibration target, cabling.
    b.push(0, 0, -2.5);
    surveyAperture(b, st, { r: 0.88, depth: 1.4, dir: -1, face: true });
    b.pop();

    // ===== CREW VOLUME — faired cabin blended into dorsal body =====
    // chamferBlock, no serial plate — the one ship in the fleet without one.
    const cabinZ = -1.5;
    const cabinS = sectionAt(mainStations, cabinZ);
    const cabinYtop = cabinS.y + cabinS.h;
    b.push(0, cabinYtop - 0.10, cabinZ);
    chamferBlock(b, ch, [weather(st.hull, 0), weather(st.hull, 1)], {
      w: 0.46, h: 0.28, d: 0.72, c: 0.30, taper: 0.82,
    });
    b.pop();
    // Cabin windows — both flanks, lights channel only
    const cwX = 0.44;
    for (const sx of [1, -1]) {
      b.push(sx * cwX, cabinYtop - 0.10, cabinZ);
      // The HUMAN dimensions are not optional: windowRow destructures w/h/d,
      // and omitting them builds BoxGeometry(undefined, undefined, undefined),
      // which THREE defaults to 1x1x1 — two one-unit glowing cubes on a
      // seven-unit hull. It rendered as a white slab over the whole nose.
      windowRow(b, hl, GLASS, {
        count: 2, spacing: HUMAN.windowGap,
        w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD,
        x: 0, y: 0, z: 0, axis: 'z',
      });
      b.pop();
    }

    // Hatch — HUMAN-scaled, starboard flank below cabin line
    b.push(cwX + 0.02, cabinYtop - 0.34, cabinZ + 0.18);
    box(b, ch, st.hullDark, HUMAN.doorW + 0.06, HUMAN.doorH + 0.04, 0.10, { x: 0, y: 0, z: 0 });
    b.pop();

    // ===== RANGING VANES — one pair, no more; this ship is clean =====
    // Roots seated at the body's widest station.
    const vaneZ = -0.4;
    const vaneS = sectionAt(mainStations, vaneZ);
    const vaneX = vaneS.w - 0.10;   // root flush with the skin
    b.push(vaneX, vaneS.y, vaneZ);
    rangingVane(b, st, { len: 1.1, chord: 0.38, thick: 0.06, ry: 0, lit: true, root: 0.44 });
    b.pop();
    b.push(-vaneX, vaneS.y, vaneZ);
    rangingVane(b, st, { len: 1.1, chord: 0.38, thick: 0.06, ry: Math.PI, lit: true, root: 0.44 });
    b.pop();

    // ===== TWIN DRIVE BOOMS — the signature fork =====
    // Splayed to x±0.95; the gap between them is obvious in top view.
    // Root at z=-0.20 where body w≈0.78, boom inner chamfer at world x≈0.62 —
    // inside the body, so attachment is by physical overlap, not a connector.
    const boomStations = [
      { z: -0.20, w: 0.44, h: 0.36, c: 0.30 },  // root — overlaps main body further forward
      { z:  1.50, w: 0.36, h: 0.30, c: 0.30 },  // mid, slight taper
      { z:  3.20, w: 0.28, h: 0.24, c: 0.30 },  // aft — drive section mount
    ];
    for (const sx of [1, -1]) {
      b.push(sx * 0.95, 0, 0);
      loftHull(b, ch, [st.hullDark, weather(st.hullDark, 1)], {
        stations: boomStations, seg: 0, capFore: true, capAft: false,
      });

      // Drive section — high-output, two recessed throat nozzles per boom.
      // len=0.55 keeps driveSection loftPlating at rows=1, matching the main
      // body's coarse-panel language.
      b.push(0, 0, 3.20);
      driveSection(b, st, {
        r: 0.28, len: 0.55, throats: 2, seed: sx > 0 ? 4 : 3,
        w: 0.28, h: 0.24, c: 0.30,
      });
      b.pop();

      // Running lamp — boom underside at mid-station; seated ON the boom, never
      // strung across the open gap between them. Positioned relative to boom center.
      box(b, hl, LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize,
        { x: 0, y: -0.30, z: 1.50 });
      b.pop();  // pop boom position
    }

    // ===== DORSAL RUNNING LAMPS — on the body plating, forward of the fork =====
    // Two lamps seated on the hull top between cabin and boom roots.
    const dlampZ = 0.3;
    const dlampS = sectionAt(mainStations, dlampZ);
    lampString(b, hl, LAMP, {
      ax: -0.12, ay: dlampS.y + dlampS.h + 0.02, az: dlampZ - 0.20,
      bx:  0.12, by: dlampS.y + dlampS.h + 0.02, bz: dlampZ - 0.20,
      count: 2, size: HUMAN.lampSize,
    });
  },
};
