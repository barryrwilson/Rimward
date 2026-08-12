/**
 * Ferrous Hegemony — Freighter, fleet logistics carrier.
 * 
 * Bible brief §4.2: "A very large armored logistics train: standardized container
 * blocks and fuel tanks behind a protected command tug. Armor the vital spine and
 * drive, not every cargo box. Repetition and formation discipline should create scale."
 *
 * Charter band: 66.00-92.40 (target 77.6, Z-largest), hull 34,000-110,000 verts,
 * lights >= 2,400 and <= 25% of hull, singleMass cell 3.2, glowZ 37.5.
 * Proportion relief: len/beam floor 1.05, ht/len ceiling 0.62.
 *
 * Body plan — ARTICULATED TRAIN:
 * 
 * THREE ZONES ALONG Z, each countable in side silhouette:
 * 1. Bow — the protected command tug: compact, heavily armoured, with its own
 *    wedge prow, two-step tower, bridge windows, and rescue lock.
 * 2. Middle — the train: an armoured spine carrying, in disciplined repetition,
 *    standardized container block ranks alternating with symmetric pairs of
 *    cylindrical fuel tanks, separated by visible inter-block frames.
 * 3. Stern — the drive block: a massive armoured drive section with 6 throats,
 *    radiator wings, and point-defence tubs.
 *
 * Z LAYOUT (author z about -38.8 to +38.8, span 77.6):
 *   -38.8 to -29.0: Command tug (9.8 units) — wedge prow, tower, rescue lock
 *   -29.0 to +25.0: Spine train (54.0 units) — 5 container ranks, 4 fuel tank pairs, 4 frames
 *   +25.0 to +38.8: Drive block (13.8 units) — armoured core, 6 throats, radiators
 *
 * Exterior berthing story (bible §2, acceptance test 7):
 *   - Three external docking collars along the spine
 *   - Boarding gantry with deck plate and railing
 *   - Rescue locks on tug and spine
 *   - Awkward service structures that could never fit inside a station
 */

import {
  sectionAt, loftExtents, loftHull, loftPlating, loftRib,
  tri, quad, emitMesh,
} from '../loft.js';
import {
  armourBlock, beltedHull, armourCourse, armouredSpine,
} from './body.js';
import {
  LAMP, GLASS, OPTIC, DIM,
  citadelArmour, wedgeProw, recognitionBand, serviceHonour,
  rescueLock, pointDefence, commandStep, containerBlock, driveBattery,
} from './motifs.js';
import {
  weather, box, cyl, torus, ribBands, windowRow, panelSkin,
  pipeRun, railing, radiatorPanel, lampString, crate,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const ferrousFreighter = {
  glowZ: 37.5,

  build(b, st) {
    const hullTones = [st.hull, weather(st.hull, 1), weather(st.hull, 2), st.trim, weather(st.trim, 1), st.hullDark];
    const trimTones = [st.trim, weather(st.trim, 1), weather(st.trim, 2)];

    // Z LAYOUT (span 77.6, author z -38.8 to +38.8):
    //   -38.8 to -29.0: Command tug (9.8 units) — NARROW, DEEP, compact
    //   -29.0 to +25.0: Spine train (54.0 units) — WIDE and lower, 4 stations
    //   +25.0 to +38.8: Drive block (13.8 units) — TALLEST, WIDEST, steps up from train
    // Extents: X ~22, Y ~17, Z ~77.6
    //
    // THREE DISTINCT CROSS-SECTIONS:
    //   TUG:   w=2.8-4.8  h=4.8-6.2  (narrow and deep)
    //   NECK:  w=4.2      h=5.4      (pinch point - clear step)
    //   TRAIN: w=6.8-8.2  h=5.0-5.6  (wide and flat)
    //   DRIVE: w=10.0-10.8 h=7.5-8.4 (tallest and widest - steps up)
    const stations = [
      // ZONE 1: COMMAND TUG — narrower and deeper cross-section
      { z: -38.8, w: 2.8, h: 4.8, y: 0, c: 0.30 },
      { z: -36.0, w: 3.8, h: 5.4, y: 0, c: 0.25 },
      { z: -33.0, w: 4.5, h: 5.8, y: 0, c: 0.20 },
      { z: -30.5, w: 4.8, h: 6.2, y: 0, c: 0.18 },
      // NECK — clear pinch before train begins
      { z: -29.5, w: 4.4, h: 5.6, y: 0, c: 0.15 },
      { z: -29.0, w: 4.2, h: 5.4, y: 0, c: 0.15 },
      // ZONE 2: SPINE TRAIN — wider and flatter cross-section
      { z: -10.0, w: 6.8, h: 5.0, y: 0, c: 0.10 },
      { z:   7.0, w: 7.5, h: 5.2, y: 0, c: 0.10 },
      { z:  20.0, w: 8.0, h: 5.4, y: 0, c: 0.12 },
      { z:  25.0, w: 8.2, h: 5.6, y: 0, c: 0.15 },
      // ZONE 3: DRIVE BLOCK — tallest and widest, steps up clearly
      { z:  27.5, w: 10.0, h: 7.5, y: 0, c: 0.18 },
      { z:  31.5, w: 10.8, h: 8.4, y: 0, c: 0.20 },
      { z:  35.0, w:  9.5, h: 7.0, y: 0, c: 0.22 },
      { z:  38.8, w:  7.5, h: 5.5, y: 0, c: 0.25 },
    ];

    // Base hull shell.
    loftHull(b, 'hull', hullTones, { stations, seg: 0, capFore: true, capAft: true });
    loftPlating(b, 'hull', hullTones, {
      stations,
      rows: 4, cols: 2, t: 0.08, inset: 0.18, seed: 42,
    });

    // Zone-boundary ribs in trim tones — emphasise the three distinct sections.
    loftRib(b, 'hull', trimTones[2], { stations, z: -29.0, out: 0.12, thick: 0.22 }); // Tug→train
    loftRib(b, 'hull', trimTones[0], { stations, z: -10.0, out: 0.10, thick: 0.18 }); // Train mid
    loftRib(b, 'hull', trimTones[1], { stations, z:   7.0, out: 0.10, thick: 0.18 }); // Train mid
    loftRib(b, 'hull', trimTones[0], { stations, z:  20.0, out: 0.10, thick: 0.18 }); // Train end
    loftRib(b, 'hull', trimTones[2], { stations, z:  27.5, out: 0.14, thick: 0.24 }); // Drive shoulder

    // ==================== ZONE 1: COMMAND TUG ====================
    // Wedge prow — the Ferrous blunt reinforced bow.
    const prowSection = sectionAt(stations, -34.0);
    b.push(0, 0, -34.0, 0, 0, 0);
      wedgeProw(b, st, {
        w: prowSection.w * 0.95, h: prowSection.h * 0.9, len: 5.2,
        ry: 0, seed: 101,
      });
    b.pop();

    // Armour courses on the tug.
    armourCourse(b, 'hull', hullTones, {
      stations, from: -38.8, to: -29.0,
      rows: 2, cols: 1, t: 0.09, inset: 0.16, seed: 102,
    });

    // Two-step command tower on dorsal spine.
    const towerBaseZ = -32.5;
    const towerSection = sectionAt(stations, towerBaseZ);
    b.push(0, towerSection.h * 0.5, towerBaseZ, 0, 0, 0);
      commandStep(b, st, {
        w: towerSection.w * 0.6, h: 2.8, len: 3.5,
        ry: 0, seed: 103,
      });
      b.push(0, 2.4, -1.8, 0, 0, 0);
        commandStep(b, st, {
          w: towerSection.w * 0.4, h: 2.0, len: 2.8,
          ry: 0, seed: 104,
        });
      b.pop();
    b.pop();

    // Rescue lock on the tug port flank.
    b.push(-towerSection.w * 0.85, 0, -31.5, 0, 0, 0);
      rescueLock(b, st, { len: 0.6, ry: 0 });
    b.pop();

    // Service honour plaque.
    b.push(0, towerSection.h * 0.6, -32.0, 0, 0, 0);
      serviceHonour(b, st, { lit: true, ry: 0 });
    b.pop();

    // Recognition band on the tug.
    b.push(0, 0, -33.0, Math.PI / 2, 0, 0);
      recognitionBand(b, st, { len: 4.5, w: 0.18, p: 0.04, ry: 0 });
    b.pop();

    // ==================== ZONE 2: SPINE TRAIN ====================
    // Armoured spine — trim-tone chords visible between ranks.
    armouredSpine(b, 'hull', [st.hull, st.trim, weather(st.hull, 1)], {
      from: -29.0, to: 25.0,
      w: 5.5, h: 3.8, bay: 3.6,
      chord: 0.42, brace: 0.26, plate: 0.5,
    });

    // Light armour on spine for tonal coverage.
    armourCourse(b, 'hull', hullTones, {
      stations, from: -29.0, to: 25.0,
      rows: 1, cols: 1, t: 0.07, inset: 0.15, seed: 201,
    });

    // Container ranks and fuel tanks — disciplined repetition.
    const containerZ = [-25.0, -18.0, -10.5, -3.0, 4.5];
    const tankZ = [-21.5, -13.8, -6.2, 1.5];

    // Container ranks — alternate trim tone rank-by-rank so repetition is countable.
    for (let i = 0; i < containerZ.length; i++) {
      const cz = containerZ[i];
      const spineSection = sectionAt(stations, cz);
      const rankTone = i % 2 === 0 ? trimTones[0] : trimTones[1];

      for (const sx of [1, -1]) {
        b.push(sx * spineSection.w * 0.95, spineSection.h * 0.6, cz, 0, 0, 0);
          containerBlock(b, st, { rows: 3, cols: 3, seed: 300 + i });
        b.pop();

        // Rank longerons — trim accent marking each rank corner.
        b.push(sx * spineSection.w * 0.85, 0, cz, 0, 0, 0);
          box(b, 'hull', rankTone, 0.12, spineSection.h * 0.8, 0.12, { y: 0, z: 0 });
        b.pop();
      }

      // Recognition band at each container boundary.
      b.push(0, 0, cz, Math.PI / 2, 0, 0);
        recognitionBand(b, st, { len: 9.5, w: 0.16, p: 0.035, ry: 0 });
      b.pop();
    }

    // Fuel tank pairs — round and taller than containers, vary silhouette.
    for (let i = 0; i < tankZ.length; i++) {
      const tz = tankZ[i];
      const spineSection = sectionAt(stations, tz);
      const tankR = 0.85;
      const tankLen = 2.8;

      for (const sx of [1, -1]) {
        b.push(sx * (spineSection.w * 0.95 + tankR * 0.1), 0, tz, 0, 0, 0);
          cyl(b, 'hull', weather(st.hull, 1), tankR, tankR, tankLen, 8, {
            rx: Math.PI / 2,
          });
          cyl(b, 'hull', st.trim, tankR * 0.9, tankR * 0.9, 0.25, 8, {
            rx: Math.PI / 2, z: -tankLen / 2 - 0.12,
          });
          cyl(b, 'hull', st.trim, tankR * 0.9, tankR * 0.9, 0.25, 8, {
            rx: Math.PI / 2, z: tankLen / 2 + 0.12,
          });
          for (let tc = 0; tc <= 1; tc++) {
            const collarZ = -tankLen / 2 + tc * tankLen;
            torus(b, 'hull', weather(st.trim, 1), tankR + 0.06, 0.05, 8, 10, undefined, {
              rx: Math.PI / 2, z: collarZ,
            });
          }
          pipeRun(b, 'hull', st.trim, {
            ax: sx * tankR, ay: 0, az: 0,
            bx: sx * (spineSection.w * 0.4), by: 0, bz: 0,
            r: 0.04, seg: 6, collars: 2,
          });
        b.pop();
      }
    }

    // Inter-block frames — visible structural dividers, alternating trim tones.
    const frameZ = [-23.0, -15.5, -7.8, -0.2];
    for (let i = 0; i < frameZ.length; i++) {
      const fz = frameZ[i];
      const frameSection = sectionAt(stations, fz);
      const frameTone = i % 2 === 0 ? trimTones[0] : trimTones[1];

      box(b, 'hull', frameTone, frameSection.w * 2.1, frameSection.h * 2.1, 0.20, {
        y: 0, z: fz,
      });
      for (const sx of [1, -1]) {
        box(b, 'hull', trimTones[2], 0.38, frameSection.h * 1.8, 0.28, {
          x: sx * frameSection.w * 0.95, y: 0, z: fz,
        });
      }
    }

    // ==================== EXTERIOR BERTHING ====================
    // Three docking collars along the spine.
    const collarZ = [-20.0, -5.0, 10.0];
    for (let i = 0; i < collarZ.length; i++) {
      const cz = collarZ[i];
      const collarSection = sectionAt(stations, cz);

      for (const sx of [1, -1]) {
        b.push(sx * collarSection.w * 0.85, 0, cz, 0, 0, 0);
          cyl(b, 'hull', st.trim, HUMAN.collarR, HUMAN.collarR, 0.8, 8, {
            rx: Math.PI / 2, z: 0,
          });
          torus(b, 'hull', weather(st.trim, 1), HUMAN.collarR + 0.05, 0.05, 8, 12, undefined, {
            rx: Math.PI / 2, z: 0.35,
          });
          for (const sy of [1, -1]) {
            box(b, 'lights', DIM, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize * 0.5, {
              x: HUMAN.collarR * 0.7, y: sy * HUMAN.collarR * 0.7, z: 0.45,
            });
          }
        b.pop();
      }
    }

    // Boarding gantry.
    const gantryZ = 8.0;
    const gantrySection = sectionAt(stations, gantryZ);
    b.push(0, 0, gantryZ, 0, 0, 0);
      box(b, 'hull', weather(st.trim, 1), 2.8, gantrySection.h * 0.5, 2.0, {
        y: gantrySection.h * 0.25, z: 0,
      });
      box(b, 'hull', weather(st.trim, 1), 2.5, 0.12, 1.8, {
        y: gantrySection.h * 0.52, z: 0,
      });
      railing(b, 'hull', st.trim, {
        ax: -1.1, ay: gantrySection.h * 0.58, az: 0.7,
        bx:  1.1, by: gantrySection.h * 0.58, bz: 0.7,
        height: HUMAN.railH, posts: 4, rail: HUMAN.railPost,
      });
      box(b, 'hull', weather(st.hull, 1), 0.8, 0.6, 0.5, {
        x: 1.4, y: gantrySection.h * 0.7, z: 0.2,
      });
      box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize * 0.5, {
        x: 1.4, y: gantrySection.h * 0.9, z: 0.2,
      });
    b.pop();

    // Rescue lock on the spine mid-train.
    const rescueSection = sectionAt(stations, -12.0);
    b.push(rescueSection.w * 0.88, 0, -12.0, 0, 0, 0);
      rescueLock(b, st, { len: 0.5, ry: 0 });
    b.pop();

    // Work lamps at collar positions — boss+lamp so they always overlap hull.
    for (const lz of collarZ) {
      const lampSection = sectionAt(stations, lz);
      for (const sx of [1, -1]) {
        b.push(sx * lampSection.w * 0.82, 0, lz, 0, 0, 0);
          box(b, 'hull', weather(st.trim, 1), HUMAN.lampSize * 1.2, HUMAN.lampSize * 1.2, HUMAN.lampSize * 0.8, {
            y: 0.1, z: 0,
          });
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize * 0.5, {
            y: 0.2, z: 0,
          });
        b.pop();
      }
    }

    // Rank telltales — boss+lamp at hull flank so each lamp overlaps hull.
    for (let i = 0; i < containerZ.length; i++) {
      const cz = containerZ[i];
      const rankSection = sectionAt(stations, cz);
      for (const sx of [1, -1]) {
        b.push(sx * rankSection.w * 0.82, 0, cz, 0, 0, 0);
          box(b, 'hull', weather(st.trim, 1), HUMAN.lampSize * 1.2, HUMAN.lampSize * 1.2, HUMAN.lampSize * 0.8, {
            y: 0.1, z: 0,
          });
          box(b, 'lights', OPTIC, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize * 0.5, {
            y: 0.2, z: 0,
          });
        b.pop();
      }
    }

    // ==================== ZONE 3: DRIVE BLOCK ====================
    // Large armoured core — trim tones on the armour panels.
    const driveZ = 31.5;
    const driveSection = sectionAt(stations, driveZ);

    b.push(0, 0, driveZ, 0, 0, 0);
      armourBlock(b, 'hull', [st.hull, weather(st.hull, 1), st.trim], {
        w: driveSection.w * 0.88, h: driveSection.h * 0.88, d: 13.0,
        c: 0.18, taper: 0.85, y: 0,
      });
      // Radiator wings — break the drive outline.
      for (const sx of [1, -1]) {
        radiatorPanel(b, 'hull', st.hullDark, weather(st.trim, 1), {
          x: sx * driveSection.w * 0.78, y: 0, z: 0,
          w: 3.5, h: 4.0, fins: 5, ry: 0,
        });
      }
    b.pop();

    // Drive battery — 6 throats.
    const batteryZ = 34.5;
    const batterySection = sectionAt(stations, batteryZ);
    b.push(0, 0, batteryZ, 0, 0, 0);
      driveBattery(b, st, {
        w: batterySection.w * 0.8, h: batterySection.h * 0.8,
        len: 5.5, throats: 6, c: 0.25, seed: 402,
      });
    b.pop();

    // Point-defence tubs — symmetric on drive block dorsal surface.
    // The motif creates two distinct meshes (base tub + gun barrel) with a gap.
    // A hull stanchion bridging the hull surface to the gun barrel top ensures
    // both meshes share cells with hull geometry → no floating.
    const pdZ = 28.5;
    const pdSection = sectionAt(stations, pdZ);
    for (const sx of [1, -1]) {
      const pdX = sx * pdSection.w * 0.5;
      const pdY = pdSection.h * 0.5; // Hull top surface level
      // Stanchion: hull boss reaching from hull surface up into the gun region.
      box(b, 'hull', weather(st.trim, 1), 0.8, 1.0, 0.8, {
        x: pdX, y: pdY + 0.3, z: pdZ,
      });
      // Point-defence tub mounted on the stanchion.
      b.push(pdX, pdY, pdZ, 0, 0, 0);
        pointDefence(b, st, { ry: 0, seed: 500 + (sx < 0 ? 1 : 0) });
      b.pop();
    }

    // Recognition band at the drive block shoulder.
    b.push(0, 0, 25.0, Math.PI / 2, 0, 0);
      recognitionBand(b, st, { len: 12.0, w: 0.18, p: 0.04, ry: 0 });
    b.pop();

    // Final stern recognition band.
    b.push(0, 0, 38.0, Math.PI / 2, 0, 0);
      recognitionBand(b, st, { len: 9.0, w: 0.16, p: 0.035, ry: 0 });
    b.pop();
  },
};
