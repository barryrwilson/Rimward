/**
 * FRIGATE — line escort: A compact naval capital ship with a stepped command
 * tower, layered central citadel, rescue-capable ventral hangar, and rigorously
 * paired batteries. It should be impressive, not gigantic.
 *
 * Charter: size band 26.40-36.30 (target 28.0, largest span Z), hull 16,000-60,000
 * verts, lights >= 1,100 and <= 25% of hull, singleMass cell 1.8, glowZ 13.6.
 *
 * Body plan: TOWERED SPINE. A long, low-slung armoured hull with genuine VERTICAL
 * layering — the only class in the family that builds both upward and downward off
 * its hull line. Above: a three-step command tower rising off the dorsal midbody,
 * built from stacked commandStep calls, each step narrower and shorter than the one
 * below and overlapping it. Below: a recessed ventral HANGAR CAVITY — a real opening
 * in the hull with deck floor, side walls, overhead, and lit deck interior. Side view:
 * long and low with a tower above and a notch below. It must clearly outrank the
 * heavy without approaching the freighter.
 *
 * Extents (measured):
 *   Z: -14.0 to +14.0 (span 28.0)
 *   X: ±6.7 (span 13.4)
 *   Y: -3.8 to +6.86 (span 10.66, includes tower)
 * Bounding-box centre offsets within 0.15 of span on all axes.
 *
 * Tower Z range: -4.0 to +2.0 (dorsal midbody, three overlapping steps)
 * Hangar Z range: -6.0 to +2.0 (ventral cavity, half the class read)
 */

import {
  loftHull, loftPlating, loftRib, sectionAt, loftExtents, armourCourse,
} from './body.js';
import {
  LAMP, GLASS, DIM,
  citadelArmour, wedgeProw, weaponBlock, recognitionBand,
  serviceHonour, rescueLock, pointDefence, commandStep,
  driveBattery,
} from './motifs.js';
import {
  box, lampString, weather, windowRow, railing, ladder,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const ferrousFrigate = {
  glowZ: 13.6,

  build(b, st) {
    // ---------- Station list: long low hull with modest height, broad beam through citadel ----------
    const stations = [
      { z: -14.0, w: 1.2, h: 1.8, y: 0.0, c: 0.28 },  // bow tip
      { z: -12.0, w: 2.1, h: 2.4, y: 0.0, c: 0.28 },
      { z: -10.0, w: 2.8, h: 2.8, y: 0.0, c: 0.28 },
      { z: -8.0,  w: 3.5, h: 3.0, y: 0.0, c: 0.26 },
      { z: -6.0,  w: 4.2, h: 3.2, y: 0.0, c: 0.24 },  // hangar cavity starts
      { z: -4.0,  w: 4.8, h: 3.4, y: 0.0, c: 0.22 },  // tower base
      { z: -2.0,  w: 4.9, h: 3.5, y: 0.0, c: 0.20 },  // citadel peak
      { z:  0.0,  w: 4.8, h: 3.4, y: 0.0, c: 0.20 },
      { z:  2.0,  w: 4.6, h: 3.3, y: 0.0, c: 0.20 },  // hangar cavity ends
      { z:  4.0,  w: 4.3, h: 3.2, y: 0.0, c: 0.22 },
      { z:  6.0,  w: 3.8, h: 3.0, y: 0.0, c: 0.24 },
      { z:  8.0,  w: 3.2, h: 2.8, y: 0.0, c: 0.26 },
      { z: 10.0, w: 2.5, h: 2.5, y: 0.0, c: 0.28 },
      { z: 12.0, w: 1.8, h: 2.2, y: 0.0, c: 0.28 },
      { z: 14.0, w: 1.2, h: 1.8, y: 0.0, c: 0.28 },  // stern tip
    ];

    // ---------- Base hull with layered armour ----------
    loftHull(b, 'hull', st.hull, { stations, seg: 6 });
    loftPlating(b, 'hull', [st.hull, weather(st.hull, 1), st.trim, weather(st.trim, 2), st.hullDark], { stations, seg: 6 });

    // Layered central citadel — doubled armour course over the protected core
    armourCourse(b, 'hull', st.hullDark, {
      stations, from: -6.0, to: 6.0, rows: 3, cols: 2, t: 0.10, inset: 0.18, seed: 1,
    });

    // Second proud-standing course over the heart of the citadel
    armourCourse(b, 'hull', st.hullDark, {
      stations, from: -4.0, to: 4.0, rows: 2, cols: 2, t: 0.10, inset: 0.22, seed: 2,
    });

    // Fore and aft lighter plating
    armourCourse(b, 'hull', st.hull, {
      stations, from: -14.0, to: -8.0, rows: 2, cols: 2, t: 0.08, inset: 0.20, seed: 3,
    });
    armourCourse(b, 'hull', st.hull, {
      stations, from: 8.0, to: 14.0, rows: 2, cols: 2, t: 0.08, inset: 0.20, seed: 4,
    });

    // Wedge prow at the bow
    const bowSection = sectionAt(stations, -12.0);
    wedgeProw(b, st, { w: bowSection.w * 2, h: bowSection.h * 1.8, len: 2.8, ry: 0, seed: 1 });

    // ---------- Command tower — three stacked steps on dorsal midbody ----------
    // Base step (widest and longest)
    const baseTowerZ = -4.0;
    const baseSection = sectionAt(stations, baseTowerZ);
    b.push(0, baseSection.y + baseSection.h, baseTowerZ, 0);
    commandStep(b, st, {
      w: 3.2, h: 1.4, len: 5.2, ry: 0, seed: 5,
    });
    recognitionBand(b, st, { len: 5.0, w: 0.16, p: 0.04, ry: 0 });
    b.pop();

    // Middle step (narrower and shorter, overlapping base)
    const midTowerZ = -2.0;
    const midSection = sectionAt(stations, midTowerZ);
    b.push(0, baseSection.y + baseSection.h + 1.2, midTowerZ, 0);
    commandStep(b, st, {
      w: 2.4, h: 1.1, len: 3.8, ry: 0, seed: 6,
    });
    recognitionBand(b, st, { len: 3.6, w: 0.14, p: 0.03, ry: 0 });
    b.pop();

    // Top step (narrowest and shortest, overlapping middle)
    const topTowerZ = -1.0;
    const topSection = sectionAt(stations, topTowerZ);
    b.push(0, baseSection.y + baseSection.h + 1.2 + 0.9, topTowerZ, 0);
    commandStep(b, st, {
      w: 1.6, h: 0.8, len: 2.4, ry: 0, seed: 7,
    });
    // Running lamps up the tower's aft face
    const lampStartZ = topTowerZ - 1.0;
    const lampEndZ = topTowerZ + 1.0;
    const lampCount = Math.floor(Math.abs(lampEndZ - lampStartZ) / HUMAN.lampGap) + 1;
    // Position lamps on the aft face of the tower step, overlapping the surface
    b.push(-0.6, 0.05, 0, 0);
    lampString(b, 'lights', LAMP, {
      ax: 0, ay: 0, az: lampStartZ - topTowerZ,
      bx: 0, by: 0, bz: lampEndZ - topTowerZ,
      count: lampCount, size: HUMAN.lampSize,
    });
    b.pop();
    b.pop();

    // ---------- Ventral hangar cavity — a genuine opening ----------
    // Design: the surround sits at the hull BOTTOM (overlapping hull mesh).
    // All interior parts hang below it in a connected chain. This ensures
    // analyseContact sees a single connected component: hull → surround →
    // walls/floor → door. The cavity extends BELOW the hull bottom, making
    // a clear notch in the ventral silhouette.
    const hangarFrom = -6.0;
    const hangarTo = 2.0;
    const hangarLength = hangarTo - hangarFrom;          // 8.0
    const hangarWidth = 3.2;                             // opening width
    const hangarDropDepth = 1.5;                         // depth below hull bottom

    const hangarDeckZ = (hangarFrom + hangarTo) / 2;     // -2.0
    const hangarSection = sectionAt(stations, hangarDeckZ);
    // Hull bottom for the 6-sided ellipse (seg=6): y - h*sin(60°)
    const hullBottomY = hangarSection.y - hangarSection.h * 0.866;  // ≈ -3.03
    const hangarFloorY = hullBottomY - hangarDropDepth;             // ≈ -4.53

    // SURROUND — wide lip at the hull bottom, overlapping the hull mesh surface.
    // This is the attachment root: hull bottom vertices (y ≈ -3.03 at z=-2)
    // are in an adjacent fine-grid cell to the surround top (y ≈ -2.88).
    b.push(0, hullBottomY, hangarDeckZ, 0);
    box(b, 'hull', st.trim, hangarWidth + 0.6, 0.3, hangarLength + 0.6);

    // AFT WALL (bow end of hangar) — vertical face at the hangar entrance
    b.push(0, -hangarDropDepth / 2, hangarFrom - hangarDeckZ, 0);
    box(b, 'hull', st.hullDark, hangarWidth, hangarDropDepth, 0.2);
    // Service door on the aft wall — inside the aft wall frame, overlapping it
    b.push(-(hangarWidth / 4), 0, 0.12, 0);
    box(b, 'hull', st.trim, HUMAN.doorW + 0.4, HUMAN.doorH + 0.3, 0.15);
    // Door glazing
    b.push(0, 0, 0.08, 0);
    box(b, 'lights', GLASS, HUMAN.doorW * 0.7, HUMAN.doorH * 0.6, 0.05);
    b.pop();
    b.pop();  // end door
    b.pop();  // end aft wall

    // FLOOR — below hull, connected to surround via side walls
    b.push(0, -hangarDropDepth, 0, 0);
    box(b, 'hull', st.hull, hangarWidth, 0.2, hangarLength);
    b.pop();  // end floor

    // PORT SIDE WALL — connects surround to floor on the port side
    b.push(-(hangarWidth / 2) - 0.05, -hangarDropDepth / 2, 0, 0);
    box(b, 'hull', st.hullDark, 0.2, hangarDropDepth, hangarLength);
    b.pop();

    // STARBOARD SIDE WALL — mirror of port
    b.push(hangarWidth / 2 + 0.05, -hangarDropDepth / 2, 0, 0);
    box(b, 'hull', st.hullDark, 0.2, hangarDropDepth, hangarLength);
    b.pop();

    // SMALL CRAFT CRADLE on the floor
    b.push(hangarWidth / 4, -hangarDropDepth, hangarTo - hangarDeckZ - 1.0, 0);
    box(b, 'hull', st.trim, 0.8, 0.12, 1.4);
    b.push(0, 0.1, 0, 0);
    box(b, 'hull', st.hullDark, 0.6, 0.08, 0.3);
    b.pop();
    b.pop();  // end cradle

    // Running lamps along the port lip of the surround
    const lipLampCount = Math.floor(hangarLength / HUMAN.lampGap) + 1;
    b.push(-(hangarWidth / 2) - 0.2, 0, hangarFrom - hangarDeckZ, 0);
    lampString(b, 'lights', LAMP, {
      ax: 0, ay: 0, az: 0,
      bx: 0, by: 0, bz: hangarLength,
      count: lipLampCount, size: HUMAN.lampSize,
    });
    b.pop();

    b.pop();  // end surround frame

    // ---------- Rigorously paired batteries — six weaponBlocks in three symmetric pairs ----------
    const batteryZPositions = [-8.0, -2.0, 6.0];
    const batteryYOffsets = [0.8, 1.2, 0.6];

    for (let pairIdx = 0; pairIdx < batteryZPositions.length; pairIdx++) {
      const bz = batteryZPositions[pairIdx];
      const by = batteryYOffsets[pairIdx];
      const batSection = sectionAt(stations, bz);
      const sponsonX = batSection.w + 0.4;

      for (const sx of [1, -1]) {
        b.push(sx * sponsonX, batSection.y + by, bz, sx > 0 ? 0 : Math.PI);
        weaponBlock(b, st, {
          w: 1.4, h: 1.1, d: 2.2, barrels: 2, yaw: 0, seed: 10 + pairIdx,
        });
        b.pop();
      }
    }

    // ---------- Point defence — six to eight tubs symmetric ----------
    const pdZPositions = [-10.0, -5.0, 3.0, 9.0];
    const pdYOffsets = [1.4, 1.8, 1.6, 1.2];

    for (let pdIdx = 0; pdIdx < pdZPositions.length; pdIdx++) {
      const pdz = pdZPositions[pdIdx];
      const pdy = pdYOffsets[pdIdx];
      const pdSection = sectionAt(stations, pdz);
      const pdX = pdSection.w - 0.2;

      for (const sx of [1, -1]) {
        b.push(sx * pdX, pdSection.y + pdy, pdz, sx > 0 ? 0 : Math.PI);
        pointDefence(b, st, {
          r: 0.28, h: 0.28, ry: 0, seed: 20 + pdIdx,
        });
        b.pop();
      }
    }

    // ---------- Rescue capability — rescueLock on both flanks plus hangar ----------
    const rescueZPositions = [-3.0, 5.0];

    for (const rz of rescueZPositions) {
      const rSection = sectionAt(stations, rz);
      const rX = rSection.w + 0.2;

      for (const sx of [1, -1]) {
        b.push(sx * rX, rSection.y + 0.6, rz, sx > 0 ? -Math.PI / 2 : Math.PI / 2);
        rescueLock(b, st, { len: 0.5, ry: 0 });
        b.pop();

        // Service honour beside each lock
        b.push(sx * (rX + 0.4), rSection.y + 0.8, rz, 0);
        serviceHonour(b, st, { lit: true, ry: 0 });
        b.pop();
      }
    }

    // ---------- Drive battery closing the stern ----------
    const sternZ = 13.0;
    const sternSection = sectionAt(stations, sternZ);
    const sternWidth = sternSection.w * 2;
    const sternHeight = sternSection.h * 1.2;

    b.push(0, sternSection.y, sternZ, 0);
    driveBattery(b, st, {
      w: sternWidth, h: sternHeight, len: 1.8, throats: 5, c: 0.28, seed: 1,
    });
    b.pop();

    // ---------- Crew windows — windowRows along citadel flanks ----------
    const windowZPositions = [-5.0, -1.0, 3.0];
    const windowYOffsets = [1.0, 1.2, 1.0];

    for (let wIdx = 0; wIdx < windowZPositions.length; wIdx++) {
      const wz = windowZPositions[wIdx];
      const wy = windowYOffsets[wIdx];
      const wSection = sectionAt(stations, wz);
      const windowX = wSection.w - 1.0; // Move inside hull boundary

      for (const sx of [1, -1]) {
        b.push(sx * windowX, wSection.y + wy, wz, sx > 0 ? -Math.PI / 2 : Math.PI / 2);
        const windowCount = Math.floor(2.8 / HUMAN.windowGap) + 1;
        windowRow(b, 'lights', GLASS, {
          count: windowCount, spacing: HUMAN.windowGap, w: HUMAN.windowW, h: HUMAN.windowH, d: 0.1,
          x: 0, y: 0, z: 0, axis: 'z', ry: 0,
        });
        b.pop();
      }
    }

    // ---------- Dorsal service walkway — deck, rail, lamps, ladder ----------
    // Walkway built as multiple segments following hull contour, not one long wing
    const walkwayStartZ = -12.0;
    const walkwayEndZ = 12.0;
    const walkwaySegmentLength = 4.0; // Build in 4-unit segments
    const walkwayWidth = 0.6;
    const walkwayThickness = 0.12;
    
    for (const sx of [1, -1]) {
      // Build walkway as chain of segments following hull taper
      for (let segZ = walkwayStartZ; segZ < walkwayEndZ; segZ += walkwaySegmentLength) {
        const segEndZ = Math.min(segZ + walkwaySegmentLength, walkwayEndZ);
        const segMidZ = (segZ + segEndZ) / 2;
        const segSection = sectionAt(stations, segMidZ);
        
        // Position deck against local hull skin, not outboard wing
        const deckX = sx * (segSection.w - 0.3); // Just 0.3 off hull skin
        const deckY = segSection.y + segSection.h - 0.5; // Top of flank
        
        b.push(deckX, deckY, segMidZ, 0);
        // Deck segment overlapping hull
        box(b, 'hull', st.trim, walkwayWidth, walkwayThickness, segEndZ - segZ + 0.1);
        
        // Railing on this segment
        b.push(0, walkwayThickness, 0, 0);
        railing(b, 'hull', st.hullDark, {
          w: walkwayWidth, d: segEndZ - segZ + 0.1, h: HUMAN.railH, post: HUMAN.railPost,
        });
        b.pop();
        b.pop();
      }
      
      // Running lamps along walkway length, placed at hull-following positions
      const lampCount = Math.floor((walkwayEndZ - walkwayStartZ) / HUMAN.lampGap) + 1;
      for (let lampIdx = 0; lampIdx < lampCount; lampIdx++) {
        const lampZ = walkwayStartZ + lampIdx * HUMAN.lampGap;
        const lampSection = sectionAt(stations, lampZ);
        const lampX = sx * (lampSection.w - 0.3);
        const lampY = lampSection.y + lampSection.h - 0.5 + HUMAN.railH - 0.08;
        
        b.push(lampX, lampY, lampZ, 0);
        box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize, HUMAN.lampSize);
        b.pop();
      }
      
      // Ladder from walkway down to flank at one point per side
      const ladderZ = 6.0; // SYMMETRIC ladder placement
      const ladderSection = sectionAt(stations, ladderZ);
      const ladderDeckX = sx * (ladderSection.w - 0.3);
      const ladderDeckY = ladderSection.y + ladderSection.h - 0.5;
      
      b.push(ladderDeckX, ladderDeckY, ladderZ, sx > 0 ? Math.PI / 2 : -Math.PI / 2);
      // Ladder reaches down to the flank
      b.push(0, 0, 0, 0);
      ladder(b, 'hull', st.trim, {
        w: HUMAN.ladderW, h: 1.5, d: 0.1,
      });
      b.pop();
      b.pop();
    }
  },
};
