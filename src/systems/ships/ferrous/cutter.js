/**
 * Cutter — patrol launch: A stout customs/boarding vessel with a protected bow
 * lock, side-by-side maneuvering engines, nonlethal projector housings, and a
 * small rescue airlock.
 *
 * Body plan: STOUT NOTCHED TUG. Broad, deep-bellied and short for its length —
 * the only heavy-set hull under the frigate. Its read is the BOW NOTCH: a
 * U-shaped recess cut back into the bow face, with the protected boarding lock
 * seated INSIDE it and two armour horns flanking it. Below, a deep ventral belly
 * (crew, medical, holding). Above, a flat dorsal WORKING DECK with a real rail run
 * — this is a ship people work on the outside of. The stern carries TWO engine
 * housings set side by side, low and wide, not one axial drive. Side view: high
 * bow shoulders dropping aft to a low working deck. Nothing else in the family
 * has a cavity cut into its bow or a flat open deck.
 *
 * Charter: 10.8 span, 6,000-34,000 hull verts, 400+ lights, singleMass cell 0.8.
 */

import {
  loftHull, loftPlating, loftRib, sectionAt,
  armourBlock, beltedHull, armourCourse,
} from './body.js';
import {
  LAMP, GLASS, OPTIC, DIM,
  citadelArmour, wedgeProw, weaponBlock, recognitionBand,
  serviceHonour, rescueLock, pointDefence, commandStep,
  containerBlock, driveBattery,
} from './motifs.js';
import {
  weather, box, cyl, torus, sphere,
  railing, ladder, windowRow, pipeRun, radiatorPanel,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const ferrousCutter = {
  // Glow zone reaches the working deck.
  glowZ: 5.2,

  build(b, st) {
    // Extents: Z ~11.4 (−5.8 horns to +5.4 hull), X ~5.0, Y varies
    // Bow top rises to ~1.65, working deck drops to ~0.65 — dramatic sheer step
    const stations = [
      { z: -5.40, w: 2.30, h: 2.00, y: 0.65, c: 0.28 }, // bow shoulders (HIGH — raised 0.30 for sheer step)
      { z: -4.20, w: 2.45, h: 2.20, y: 0.15, c: 0.26 }, // shoulders dropping fast
      { z: -2.40, w: 2.50, h: 2.25, y: -0.35, c: 0.26 }, // belly deep
      { z: -0.60, w: 2.50, h: 2.10, y: -0.40, c: 0.26 }, // working deck (LOWER)
      { z:  1.20, w: 2.35, h: 1.90, y: -0.25, c: 0.28 }, // deck continues low
      { z:  3.00, w: 2.00, h: 1.55, y: -0.10, c: 0.28 }, // stern housing base
      { z:  4.50, w: 1.60, h: 1.25, y:  0.05, c: 0.30 }, // stern transition
      { z:  5.40, w: 1.30, h: 1.05, y:  0.10, c: 0.30 }, // stern (dual engines)
    ];
    const hullHexes = [
      st.hull,
      weather(st.hull, 1),
      weather(st.hull, 2),
      st.hullDark,
      weather(st.hullDark, 1),
      st.trim,              // Pale structural steel for tonal range
      weather(st.trim, 1), // Weathered trim
      weather(st.trim, 2), // Darker trim step
    ];
    // BASE HULL — belted shell
    beltedHull(b, 'hull', hullHexes, {
      stations,
      belt: 0.10,
      beltAt: -0.15,
      trim: 0.15,
      seg: 0,
      capFore: true,
      capAft: true,
    });

    // ARMOUR COURSES — vertex engine on flanks and belly
    // Forward flank course
    armourCourse(b, 'hull', hullHexes, {
      stations,
      from: -5.0,
      to: -2.0,
      rows: 2,
      cols: 3,
      t: 0.07,
      inset: 0.14,
      seed: 1,
    });

    // Mid belly course
    armourCourse(b, 'hull', hullHexes, {
      stations,
      from: -2.5,
      to: 1.5,
      rows: 3,
      cols: 2,
      t: 0.08,
      inset: 0.16,
      seed: 2,
    });

    // Aft flank course
    armourCourse(b, 'hull', hullHexes, {
      stations,
      from: 1.0,
      to: 4.5,
      rows: 2,
      cols: 2,
      t: 0.07,
      inset: 0.14,
      seed: 3,
    });

    // STRUCTURAL RIBS — at bulkhead frames
    loftRib(b, 'hull', st.trim, { stations, z: -2.40, out: 0.08, thick: 0.14 });
    loftRib(b, 'hull', st.trim, { stations, z: 0.60, out: 0.08, thick: 0.14 });
    loftRib(b, 'hull', st.trim, { stations, z: 3.60, out: 0.08, thick: 0.14 });

    // BOW NOTCH — U-shaped cavity. Fork/claw visible in SIDE silhouette.
    //
    // For a void to appear in the side (Y-Z) projection, geometry must protrude
    // FORWARD of the hull's bow face (z=-5.40) in two separate Y bands with
    // empty space between them:
    //
    //   z=-6.00 (tip)  z=-5.40 (hull bow)  z=-3.60 (back wall)
    //     [HORNS]       [=======hull==========]  ← upper prong, y ≈ +0.48 to +0.92
    //     [void ]       [notch cavity         ]  ← void, y ≈ −0.37 to +0.48  (≈0.85 units)
    //     [KEEL ]       [=======hull==========]  ← lower prong, y ≈ −0.73 to −0.37
    //
    // Both prongs reach z=-6.00 so the fork reads at thumbnail scale.
    // Total Z span = 6.00 + 5.40 = 11.40 (within 9.57-11.88).

    // --- ARMOUR HORNS — upper prong of the fork ---
    // Center z=-5.20, d=1.60 → reaches z=-6.00 forward, z=-4.40 aft.
    for (const sx of [1, -1]) {
      b.push(sx * 1.80, 0.50, -5.20);
        // Horn main block: trim-coloured structure
        armourBlock(b, 'hull', [st.trim, weather(st.trim, 1)], {
          w: 0.58, h: 0.72, d: 1.60, c: 0.14, taper: 0.60, y: 0.20,
        });
        // Lamination step on the inward face — pale stripe
        box(b, 'hull', weather(st.trim, 2), 0.40, 0.56, 1.30, {
          x: sx * 0.28, y: 0.18, z: -0.20,
        });
        // Trim collar at the horn root (overlaps hull surface)
        box(b, 'hull', st.trim, 0.55, 0.08, 0.75, { y: 0.22, z: 0.45 });
      b.pop();
    }

    // --- KEEL CHIN PLATE — lower prong of the fork ---
    // Center z=-5.20, d=1.60 → reaches z=-6.00 forward, z=-4.40 aft.
    b.push(0, -0.55, -5.20);
      box(b, 'hull', weather(st.hull, 1), 1.40, 0.36, 1.60, { c: 0.12 });
      // Keel rib — trim
      box(b, 'hull', st.trim, 1.30, 0.06, 1.52, { y: 0.18 });
    b.pop();

    // --- NOTCH CAVITY — boarding tunnel interior ---
    // Spans z=-5.40 (bow face) to z=-3.60 (back wall), 1.80 units deep.
    // Cheek walls, overhead, and floor bite into the hull and each other.
    const notchW = 1.60;   // horizontal width of the void
    const notchH = 1.35;   // vertical height of the void
    const notchCZ = -4.50; // cavity centre Z  (−5.40 + 1.80/2)
    const notchD  =  1.80; // depth (z span of the cavity)

    // Cheek walls — flank the void, full depth
    for (const sx of [1, -1]) {
      b.push(sx * notchW * 0.52, 0.0, notchCZ);
        box(b, 'hull', weather(st.hull, 1), 0.28, notchH * 0.88, notchD, { c: 0.16 });
      b.pop();
    }

    // Overhead plate — upper lip, closes the top of the cavity
    b.push(0, notchH * 0.42, notchCZ);
      box(b, 'hull', weather(st.hull, 2), notchW * 0.88, 0.30, notchD, { c: 0.14 });
    b.pop();

    // Floor plate — lower lip (continuation of the keel chin inside the hull)
    b.push(0, -0.50, notchCZ);
      box(b, 'hull', weather(st.hullDark, 1), notchW * 0.92, 0.30, notchD, { c: 0.12 });
    b.pop();

    // Back wall trim collar — frame that receives the boarding collar
    b.push(0, 0, -3.62);
      box(b, 'hull', st.trim, notchW * 0.90, notchH * 0.78, 0.14, { c: 0.10 });
    b.pop();

    // Boarding collar on the back wall — lit so eye is drawn into the cavity
    b.push(0, 0, -3.58);
      cyl(b, 'hull', st.trim, HUMAN.collarR, HUMAN.collarR, 0.45, 8, { rx: Math.PI / 2 });
      torus(b, 'hull', weather(st.trim, 1), HUMAN.collarR + 0.05, 0.06, 8, 12, undefined, {
        rx: Math.PI / 2, z: 0.12,
      });
      // Approach lamps ringing the collar
      const lampCount = Math.round((Math.PI * 2 * HUMAN.collarR) / HUMAN.lampGap);
      for (let i = 0; i < lampCount; i++) {
        const ang = (i / lampCount) * Math.PI * 2;
        b.push(Math.cos(ang) * HUMAN.collarR, Math.sin(ang) * HUMAN.collarR, 0.18);
          sphere(b, 'lights', LAMP, HUMAN.lampSize, 8, 6);
        b.pop();
      }
      box(b, 'hull', weather(st.hullDark, 1), HUMAN.doorW, HUMAN.doorH, 0.32, { z: 0.08 });
    b.pop();

    // RECOGNITION BAND — narrow crimson on bow shoulders
    b.push(0, 0.7, -4.5, Math.PI / 2, 0, 0);
      recognitionBand(b, st, { len: 2.8, w: 0.18, p: 0.04 });
    b.pop();

    // CABIN WINDOWS — along each flank of raised bow section
    const bowSection = sectionAt(stations, -3.6);
    for (const sx of [1, -1]) {
      const windowCount = Math.floor(1.8 / HUMAN.windowGap);
      for (let i = 0; i < windowCount; i++) {
        const wz = -4.2 + i * HUMAN.windowGap;
        b.push(sx * (bowSection.w - 0.12), bowSection.y + 0.25, wz);
          box(b, 'hull', weather(st.trim, 0), HUMAN.windowW, HUMAN.windowH, HUMAN.windowD, { c: 0.1 });
        b.pop();
      }
    }

    // NONLETHAL PROJECTOR HOUSINGS — symmetric pairs on bow shoulders
    // Modified weaponBlock: shorter barrels, capped, fewer of them
    for (const sx of [1, -1]) {
      b.push(sx * 1.9, 0.5, -4.4);
        // Barbette base — trim for structure
        armourBlock(b, 'hull', [st.trim, weather(st.trim, 1)], {
          w: 0.55, h: 0.5, d: 0.7, c: 0.14, y: 0,
        });
        
        // Recessed mount
        box(b, 'hull', weather(st.hullDark, 1), 0.38, 0.3, 0.35, { z: -0.2 });
        
        // Projector snout — stubby, capped, non-barrel look
        cyl(b, 'hull', st.trim, 0.15, 0.18, 0.25, 8, {
          rx: Math.PI / 2, y: -0.05, z: -0.4,
        });
        
        // Emitter cap — flat face, not a muzzle opening
        cyl(b, 'hull', weather(st.hullDark, 2), 0.12, 0.12, 0.06, 8, {
          rx: Math.PI / 2, y: -0.05, z: -0.55,
        });
        
        // OPTIC telltale
        box(b, 'lights', OPTIC, HUMAN.lampSize * 1.5, HUMAN.lampSize, HUMAN.lampSize * 0.5, {
          y: 0.1, z: -0.22,
        });
      b.pop();
    }

    // FLAT DORSAL WORKING DECK — overlaps hull, real rail
    const deckZ = -0.6;
    const deckLen = 3.0;
    const deckW = 2.8;
    const deckSection = sectionAt(stations, deckZ);
    // Deck plate centre is at hull top so the lower half embeds in the shell (attached).
    const deckY = deckSection.y + deckSection.h / 2;

    // Deck plate — trim colour so it reads as structure against dark hull
    b.push(0, deckY, deckZ);
      box(b, 'hull', weather(st.trim, 1), deckW * 1.02, 0.14, deckLen, { c: 0.1 });
    b.pop();

    // Railing at deck edge — follows the deck, not diagonal
    for (const sx of [1, -1]) {
      b.push(sx * deckW * 0.48, deckY + HUMAN.railH * 0.5, deckZ);
        railing(b, 'hull', st.trim, {
          ax: 0, ay: 0, az: deckLen * 0.45,
          bx: 0, ay: 0, bz: -deckLen * 0.45,
          height: HUMAN.railH, posts: 4, rail: HUMAN.railPost,
        });
      b.pop();
      
      // Ladder down to flank
      b.push(sx * deckW * 0.42, deckY - 0.2, deckZ);
        ladder(b, 'hull', weather(st.trim, 2), {
          w: HUMAN.ladderW, h: 1.2, rungs: 4,
          ry: sx * Math.PI / 2,
        });
      b.pop();
    }

    // Work lamps along deck edge — spaced by lampGap
    const deckLampCount = Math.floor(deckLen / HUMAN.lampGap);
    for (const sx of [1, -1]) {
      for (let i = 0; i < deckLampCount; i++) {
        const lz = deckZ - deckLen * 0.4 + i * HUMAN.lampGap;
        b.push(sx * deckW * 0.48, deckY + 0.25, lz);
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize * 0.6);
        b.pop();
      }
    }

    // RESCUE LOCK — on port flank amidships
    b.push(-2.5, 0, -0.3, 0, Math.PI / 2, 0);
      rescueLock(b, st, { len: 0.55, ry: 0 });
    b.pop();

    // SERVICE HONOUR beside the rescue lock
    b.push(-2.5, 0.6, -0.3);
      serviceHonour(b, st, { lit: true, ry: 0 });
    b.pop();

    // SIDE-BY-SIDE ENGINES — two driveBattery housings at stern
    const sternZ = 4.2;
    const engineW = 0.85;
    const engineH = 0.75;
    const engineLen = 1.1;
    const engineGap = 0.4;

    for (const sx of [1, -1]) {
      const ex = sx * (engineW + engineGap * 0.5);
      b.push(ex, 0, sternZ);
        driveBattery(b, st, {
          w: engineW,
          h: engineH,
          len: engineLen,
          throats: 3,
          c: 0.28,
          seed: 20 + sx,
        });
      b.pop();
      
      // Recognition band on each engine housing
      b.push(ex, 0, sternZ + engineLen * 0.3);
        recognitionBand(b, st, { len: 1.2, w: 0.16, p: 0.035, ry: Math.PI / 2 });
      b.pop();
    }

    // SERVICE PLUMBING — lines along the hull
    for (const sx of [1, -1]) {
      pipeRun(b, 'hull', weather(st.trim, 2), {
        ax: sx * 2.0, ay: -0.8, az: -2.0,
        bx: sx * 1.8, by: -0.6, bz: 2.5,
        r: 0.06, seg: 8, collars: 4,
      });
    }

    // RADIATOR PANELS — on ventral and dorsal surfaces
    for (const sy of [1, -1]) {
      b.push(0, sy * 1.6, 0.6);
        radiatorPanel(b, 'hull', weather(st.trim, 1), weather(st.hullDark, 1), {
          w: 2.4, h: 1.8, fins: 5, ry: 0, thick: 0.08,
        });
      b.pop();
    }
  },
};
