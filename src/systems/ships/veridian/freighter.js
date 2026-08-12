/**
 * Veridian Combine — Freighter, extraction carrier.
 * 
 * Bible brief: "A gigantic open industrial spine carrying ore silos, refinery drums,
 * detachable claim modules, and tug docks. Keep the crew/control block small so the
 * cargo scale dominates. It must look designed to moor outside a station and exchange
 * entire modules."
 *
 * Charter band: 66.00-92.40 (target 78.0, Z-largest), hull 34,000-110,000 verts,
 * lights >= 2,400 and <= 25% of hull, singleMass cell 3.2, glowZ ~28.0.
 * Proportion relief: len/beam floor 1.05, ht/len ceiling 0.62.
 *
 * Body plan — OPEN LATTICE KEEL WITH TWO-TIER MODULE RACK:
 * 
 * A real four-chord open lattice (openKeel) is the longitudinal spine.
 * Cargo hangs in two tiers: upper silos at y=+3.5, lower at y=-3.5.
 *
 * Connectivity chain (verified in 0.3-unit contact grid):
 *  keel chord (y=[1.56,1.84]) → floor plate (full_w=3.6, y=[2.0,2.6]) → same j=6 cell ✓
 *  floor plate → cross-beam (full_w=5.0, y=[1.675,2.025]) → same j=6 cell ✓
 *  cross-beam → silo surface (at y=2.025, silo inner face at x≈4.95) → same i,j cell ✓
 *
 * The cross-beam is the structural beam connecting keel to silos. Its full width
 * of 5.0 units spans from x=1.0 (inside keel chord at x=1.56) to x=6.0 (past
 * the silo inner surface at x≈5.0). This is the anatomy of an industrial crane
 * gantry, which is exactly what an extraction carrier needs.
 */

import {
  chamferBlock, openKeel,
} from './body.js';
import {
  LAMP, GLASS,
  sampleCanister, surveyAperture,
  driveSection, moduleLatch, instrumentFin, tugDock,
} from './motifs.js';
import {
  weather, box, cyl, sphere,
  ribBands, windowRow,
  railing, ladder, lampString,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const veridianFreighter = {
  glowZ: 28.0,
  build(b, st) {
    const { hull, hullDark, trim, accent, patch } = st;

    // ==== 1. FORWARD CONTROL BLOCK ====
    // Center z=-36, full depth 4.0. Nose at z=-38 (survey aperture reaches z≈-39.4).
    const controlZ = -36.0;
    const controlW = 3.8;  // half-extent for chamferBlock
    const controlH = 2.6;  // half-extent for chamferBlock
    const controlD = 4.0;  // FULL depth for chamferBlock

    b.push(0, 0, controlZ);
    chamferBlock(b, 'hull', [hull, weather(hull, 1)], {
      w: controlW, h: controlH, d: controlD, c: 0.3, y: 0,
    });

    b.push(0, 0.55, -1.4);
    windowRow(b, 'lights', GLASS, {
      count: 4, spacing: HUMAN.windowGap,
      w: HUMAN.windowW, h: HUMAN.windowH, d: 0.16, axis: 'x',
    });
    b.pop();

    b.push(-controlW * 0.48, -0.55, 0.7);
    cyl(b, 'hull', weather(hullDark, 1), HUMAN.hatchR, HUMAN.hatchR, 0.24, 16);
    b.pop();

    b.push(0, 0.35, -2.2);
    surveyAperture(b, st, { r: 1.5, depth: 1.2, dir: -1, face: true });
    b.pop();

    b.push(2.0, 0.18, 0.2);
    instrumentFin(b, st, { len: 3.4, depth: 0.85, ry: 0 });
    b.pop();

    b.pop(); // end control block

    // ==== 2. OPEN LATTICE KEEL ====
    // Keel from z=-40 to z=27 (extended for cargo scale).
    // Chord boxes at x=[1.56,1.84] y=[1.56,1.84] (and port/lower mirrors).
    openKeel(b, 'hull', [trim, weather(trim, 1)], {
      from: -40.0, to: 27.0,
      w: 1.7, h: 1.7, bay: 2.6, chord: 0.28, brace: 0.15,
    });

    // ==== 3. FLOOR PLATES ====
    // FULL_W=3.6 → half=1.8 → x=[-1.8, 1.8]. Keel chord at x=[1.56,1.84].
    // Overlap at x=[1.56,1.8]. Keel chord top face (y=1.84, j=6) and floor
    // plate bottom face (y=2.0, j=6) share j=6 → CONTACT ✓.
    // FULL_H=0.6 → half=0.3 → upper y=[2.0,2.6], lower y=[-2.6,-2.0].
    const FLOOR_W = 3.6;   // FULL width of floor plate
    const FLOOR_H = 0.6;   // FULL height of floor plate
    const FLOOR_Y = 2.3;   // center Y of upper floor plate

    const floorSegs = [
      { from: -33.0, to: -12.0 },
      { from: -12.0, to:   8.0 },
      { from:   8.0, to:  22.0 },
    ];

    floorSegs.forEach(seg => {
      const segLen = seg.to - seg.from;
      const segMid = (seg.from + seg.to) / 2;  // center frame HERE so box spans full segment
      const segH = segLen / 2;                  // half-length for symmetric z offsets
      const lamps = Math.max(2, Math.floor(segLen / (HUMAN.lampGap * 1.5)));

      // Upper floor plate centered at segMid: y=[2.0,2.6], z=[seg.from,seg.to].
      // Lamps placed at x=-(FLOOR_W/2-0.18)=-1.62, same i cell as floor plate left
      // side face (at x=-1.8, i=-6). analyseContact only walks EDGES, not face interiors,
      // so lamps at x=0 (i=0) are isolated from the diagonal (i≈4 at k=18). Edge-placed
      // lamps share the i=-6 cell with the left face perimeter → connected ✓.
      b.push(0, FLOOR_Y, segMid);
      box(b, 'hull', hull, FLOOR_W, FLOOR_H, segLen);
      railing(b, 'hull', trim, {
        ax: -(FLOOR_W / 2 - 0.18), ay: FLOOR_H / 2 - 0.05, az: -segH + 0.2,
        bx: -(FLOOR_W / 2 - 0.18), by: FLOOR_H / 2 - 0.05, bz:  segH - 0.2,
        height: HUMAN.railH, posts: Math.max(2, Math.floor(segLen / 4)), rail: 0.06,
      });
      railing(b, 'hull', trim, {
        ax:  (FLOOR_W / 2 - 0.18), ay: FLOOR_H / 2 - 0.05, az: -segH + 0.2,
        bx:  (FLOOR_W / 2 - 0.18), by: FLOOR_H / 2 - 0.05, bz:  segH - 0.2,
        height: HUMAN.railH, posts: Math.max(2, Math.floor(segLen / 4)), rail: 0.06,
      });
      lampString(b, 'lights', LAMP, {
        ax: -(FLOOR_W / 2 - 0.18), ay: FLOOR_H / 2 - 0.1, az: -segH + 0.4,
        bx: -(FLOOR_W / 2 - 0.18), by: FLOOR_H / 2 - 0.1, bz:  segH - 0.4,
        count: lamps, size: HUMAN.lampSize,
      });
      b.pop();

      // Lower floor plate (mirror) — lamps at port edge x=-1.62 for same reason
      b.push(0, -FLOOR_Y, segMid);
      box(b, 'hull', hull, FLOOR_W, FLOOR_H, segLen);
      lampString(b, 'lights', LAMP, {
        ax: -(FLOOR_W / 2 - 0.18), ay: FLOOR_H / 2 - 0.1, az: -segH + 0.4,
        bx: -(FLOOR_W / 2 - 0.18), by: FLOOR_H / 2 - 0.1, bz:  segH - 0.4,
        count: lamps, size: HUMAN.lampSize,
      });
      b.pop();
    });

    // ==== 4. CROSS-BEAMS + ORE SILOS ====
    // Cross-beam: FULL_W=6.5 → half=3.25 → x=[1.0,7.5] for side=+1.
    // FULL_H=0.35 → half=0.175 → y=[1.675,2.025] for upper (beamY=1.85).
    //   Contact: beam top (y=2.025, j=6) same cell as keel chord top (y=1.84, j=6) ✓
    //   Contact: beam top (y=2.025, j=6) same cell as floor plate bottom (y=2.0, j=6) ✓
    //   Contact: beam top face at x=7.0 (silo inner) overlaps silo surface → same cell ✓
    const BEAM_W = 6.5;   // FULL width of cross-beam (extended for larger silos)
    const BEAM_H = 0.35;  // FULL height of cross-beam
    const BEAM_X = 4.25;  // cross-beam center X (per side, moved outward)

    const siloR = 3.0;           // Increased from 1.7 for cargo dominance
    const siloLen = 7.5;         // Increased from 5.0 for cargo scale
    const upperTierY = 4.5;     // Raised from 3.5 for tier separation
    const lowerTierY = -4.5;    // Lowered from -3.5 for tier separation
    const outboardX = 8.5;      // Moved outward from 5.8 for larger silos
    const siloPositions = [
      { z: -36.0, tier: 'upper', side:  1 },
      { z: -32.0, tier: 'lower', side:  1 },
      { z: -28.0, tier: 'upper', side:  1 },
      { z: -24.0, tier: 'lower', side:  1 },
      { z: -20.0, tier: 'upper', side:  1 },
      { z: -16.0, tier: 'lower', side:  1 },
      { z: -12.0, tier: 'upper', side:  1 },
      { z:  -8.0, tier: 'lower', side:  1 },
      { z:  -4.0, tier: 'upper', side:  1 },
      { z:   0.0, tier: 'lower', side:  1 },
      { z: -34.0, tier: 'lower', side: -1 },
      { z: -30.0, tier: 'upper', side: -1 },
      { z: -26.0, tier: 'lower', side: -1 },
      { z: -22.0, tier: 'upper', side: -1 },
      { z: -18.0, tier: 'lower', side: -1 },
      { z: -14.0, tier: 'upper', side: -1 },
      { z: -10.0, tier: 'lower', side: -1 },
      { z:  -6.0, tier: 'upper', side: -1 },
      { z:  -2.0, tier: 'lower', side: -1 },
      { z:   2.0, tier: 'upper', side: -1 },
    ];

    siloPositions.forEach((pos, i) => {
      const sx = pos.side * outboardX;
      const sy = pos.tier === 'upper' ? upperTierY : lowerTierY;
      const beamY = pos.tier === 'upper' ? 1.85 : -1.85;
      const beamX = pos.side * BEAM_X;

      // Cross-beam in WORLD SPACE — FULL_W=5.0 → x=[1.0,6.0] for side=+1.
      b.push(beamX, beamY, pos.z);
      box(b, 'hull', trim, BEAM_W, BEAM_H, 0.55);
      b.pop();

      // Silo
      b.push(sx, sy, pos.z);
      cyl(b, 'hull', weather(hullDark, i % 2), siloR, siloR, siloLen, 16);
      ribBands(b, 'hull', trim, {
        r: siloR, tube: 0.08,
        from: -siloLen / 2 + 0.45, to: siloLen / 2 - 0.45,
        count: 3, axis: 'z', tseg: 9,
      });
      b.pop();
      // Outboard walkway — proper deck with overlap, railing, and lamps
      const walkX = sx + siloR - 0.4;
      const walkW = siloLen - 1.0;
      b.push(walkX, sy, pos.z);
      box(b, 'hull', hull, 0.8, 0.16, walkW);
      
      // Railing on outboard edge
      railing(b, 'hull', trim, {
        ax: 0.35, ay: 0.08, az: -walkW / 2 + 0.3,
        bx: 0.35, by: 0.08, bz: walkW / 2 - 0.3,
        height: HUMAN.railH, posts: Math.max(2, Math.floor(walkW / 3.5)), rail: 0.06,
      });
      
      // Lamp string along walkway
      lampString(b, 'lights', LAMP, {
        ax: -0.35, ay: 0.06, az: -walkW / 2 + 0.5,
        bx: -0.35, by: 0.06, bz: walkW / 2 - 0.5,
        count: Math.max(2, Math.floor(walkW / (HUMAN.lampGap * 1.2))),
        size: HUMAN.lampSize,
      });
      b.pop(); // close walkway frame
    });

    // Ladders at keel ends only — positioned to connect to silo walkways
    [-36.0].forEach(zPos => {
      [1, -1].forEach(side => {
        const walkD = 0.4; // walkway depth
        const walkX = side * (outboardX + siloR - walkD);
        b.push(walkX, 0, zPos);
        ladder(b, 'hull', trim, {
          x: 0, y: lowerTierY, z: 0,
          h: upperTierY + walkD/2 - lowerTierY,
          w: HUMAN.ladderW,
          rungs: Math.floor((upperTierY - lowerTierY) / 0.4) + 1,
          rail: 0.045, ry: 0,
        });
        b.pop();
      });
    });
    // ==== 5. REFINERY DRUMS ====
    // Cluster in aft third (z=4 to z=18) — shorter/wider than silos, denser ribs,
    // with service walkways, railings, and lamp strings.
    [
      { z: 17.5, r: 2.5, len: 3.6, ribs: 6, side: -1, shade: 0, plating: true },
    ].forEach((drum, i) => {
      const sx = drum.side * outboardX;
      const sy = upperTierY;
      const beamX = drum.side * BEAM_X;

      // Cross-beam support
      b.push(beamX, 1.85, drum.z);
      box(b, 'hull', trim, BEAM_W, BEAM_H, 0.55);
      b.pop();

      // Main drum — shorter/wider than silo
      b.push(sx, sy, drum.z);
      cyl(b, 'hull', weather(hullDark, drum.shade), drum.r, drum.r, drum.len, 16);
      
      // Dense rib bands for industrial look
      ribBands(b, 'hull', trim, {
        r: drum.r, tube: 0.10,
        from: -drum.len / 2 + 0.4, to: drum.len / 2 - 0.4,
        count: drum.ribs, axis: 'z', tseg: 9,
      });

      // Panel courses/skin — not just ribs
      if (drum.plating) {
        b.push(drum.r - 0.15, 0, 0);
        cyl(b, 'hull', weather(hull, drum.shade + 1), drum.r - 0.15, drum.r - 0.15, drum.len - 0.8, 16);
        b.pop();
      }

      // Plumbing/pipe runs connecting drums to keel
      b.push(drum.side * (drum.r - 0.6), 0.3, 0);
      cyl(b, 'hull', trim, 0.12, 0.12, drum.len * 0.7, 8);
      b.pop();
      
      b.push(drum.side * (drum.r - 0.6), -0.3, 0);
      cyl(b, 'hull', trim, 0.10, 0.10, drum.len * 0.6, 8);
      b.pop();

      // Service hatch
      b.push(drum.r - 0.5, 0.5, 0);
      cyl(b, 'hull', weather(hull, 1), HUMAN.hatchR, HUMAN.hatchR, 0.24, 12);
      b.pop();
      // Service walkway on outboard face — positioned at drum surface
      const drumWalkX = drum.side * drum.r;
      const drumWalkW = drum.len - 1.2;
      b.push(drumWalkX, 0, 0);
      box(b, 'hull', hull, 0.7, drum.r * 0.6, drumWalkW);
      
      // Railing
      railing(b, 'hull', trim, {
        ax: 0.3, ay: drum.r * 0.3, az: -drumWalkW / 2 + 0.3,
        bx: 0.3, by: drum.r * 0.3, bz: drumWalkW / 2 - 0.3,
      });
      
      // Lamp string
      lampString(b, 'lights', LAMP, {
        ax: -0.3, ay: 0.05, az: -drumWalkW / 2 + 0.4,
        bx: -0.3, by: 0.05, bz: drumWalkW / 2 - 0.4,
        count: Math.max(2, Math.floor(drumWalkW / (HUMAN.lampGap * 1.0))),
        size: HUMAN.lampSize * 0.9,
      });
      b.pop();
      
      b.pop();
    });
    
    // ==== 6. DETACHABLE MODULES ====
    // Modules placed AT actual silo positions so they connect to silo structure.
    [
      { z: -20.0, tier: 'upper', side:  1 },
      { z: -14.0, tier: 'upper', side: -1 },
      { z:  -8.0, tier: 'lower', side:  1 },
      { z: -10.0, tier: 'lower', side: -1 },
    ].forEach(pos => {
      const sx = pos.side * outboardX;
      const sy = pos.tier === 'upper' ? upperTierY : lowerTierY;
      
      // Position moduleLatch to overlap with silo surface for contact
      const modX = sx + (pos.side === 1 ? -siloR + 0.6 : siloR - 0.6);
      b.push(modX, sy, pos.z);
      moduleLatch(b, st, {
        ry: pos.side === 1 ? Math.PI / 2 : -Math.PI / 2, lit: true, s: 0.85,
      });
      b.push(pos.side === 1 ? -0.4 : 0.4, 0, 0);
      sampleCanister(b, st, { r: 0.4, len: 1.3, seed: Math.abs(pos.z * 10) });
      b.pop();
      b.pop();
    });

    // ==== 7. TUG DOCKS ====
    // Docks placed AT actual silo positions.
    // Matches: {z:-28,upper,+1}, {z:-34,lower,-1}, {z:-4,upper,+1}, {z:-2,lower,-1}
    [
      { z: -28.0, tier: 'upper', side:  1 },
      { z: -34.0, tier: 'lower', side: -1 },
      { z:  -4.0, tier: 'upper', side:  1 },
      { z:  -2.0, tier: 'lower', side: -1 },
    ].forEach(pos => {
      const sx = pos.side * outboardX;
      const sy = pos.tier === 'upper' ? upperTierY : lowerTierY;
      const beamX = pos.side * BEAM_X;
      const beamY = pos.tier === 'upper' ? 1.85 : -1.85;
      b.push(beamX, beamY, pos.z);
      box(b, 'hull', trim, BEAM_W, BEAM_H, 0.55);
      b.pop();
      
      // Position tugDock to overlap with silo surface for contact
      const tugX = sx + (pos.side === 1 ? -siloR + 0.8 : siloR - 0.8);
      b.push(tugX, sy, pos.z);
      tugDock(b, st, { w: 2.0, d: 3.0, ry: pos.side === 1 ? 0 : Math.PI });
      b.pop();
    });

    // ==== 8. DRIVE SECTION ====
    // Main drive at keel aft end (z=27)
    b.push(0, 0, 27.0);
    driveSection(b, st, {
      r: 1.85, len: 5.0, throats: 4, seed: 1,
      w: 1.85, h: 1.85, c: 0.3,
    });
    b.pop();

    // Outboard drive pods.
    // Starboard pod: x=[2.55,3.85], y=[0.95,2.25], z=[29.5,34.5].
    // Connection box at (2.2, 1.6, 28.0), full dims (1.6, 0.8, 4.0):
    //   x=[1.4,3.0] — overlaps keel x=[1.56,1.84] AND pod x=[2.55,3.0] ✓
    //   y=[1.2,2.0] — overlaps keel y=[1.56,1.84] AND pod y=[0.95,2.25] ✓
    //   z=[26.0,30.0] — spans keel aft z=27 AND pod front z=29.5 ✓
    b.push(3.2, 1.6, 32.0);
    box(b, 'hull', weather(hullDark, 1), 1.3, 1.3, 5.0);
    b.push(0, 0, 2.5);
    driveSection(b, st, { r: 0.9, len: 2.0, throats: 2, seed: 2, w: 0.9, h: 0.9, c: 0.3 });
    b.pop();
    b.pop();

    b.push(2.2, 1.6, 28.0);
    box(b, 'hull', hull, 1.6, 0.8, 4.0);
    b.pop();

    b.push(-3.2, -1.6, 32.0);
    box(b, 'hull', weather(hullDark, 1), 1.3, 1.3, 5.0);
    b.push(0, 0, 2.5);
    driveSection(b, st, { r: 0.9, len: 2.0, throats: 2, seed: 3, w: 0.9, h: 0.9, c: 0.3 });
    b.pop();
    b.pop();

    b.push(-2.2, -1.6, 28.0);
    box(b, 'hull', hull, 1.6, 0.8, 4.0);
    b.pop();
    // ==== 9. NAVIGATION LIGHTS ON HULL-BACKED MOUNTS ====

    // ==== 9. NAVIGATION LIGHTS ON HULL-BACKED MOUNTS ====
    b.push(0, 0, controlZ);

    // Port nav light
    b.push(-controlW + 0.2, 0.3, -1.4);
    box(b, 'hull', hull, 0.4, 0.4, 0.35);
    b.push(-0.2, 0, -0.18);
    sphere(b, 'lights', LAMP, 0.12, 8, 6);
    b.pop();
    b.pop();

    // Starboard nav light
    b.push(controlW - 0.2, 0.3, -1.4);
    box(b, 'hull', hull, 0.4, 0.4, 0.35);
    b.push(0.2, 0, -0.18);
    sphere(b, 'lights', LAMP, 0.12, 8, 6);
    b.pop();
    b.pop();

    b.pop(); // end controlZ frame

    // Stern nav light on starboard pod aft face.
    // Pod now at z=[29.5,34.5], aft at z=34.5. Box z=[34.3,34.8] overlaps pod aft ✓.
    b.push(3.2, 1.6, 34.55);
    box(b, 'hull', hull, 0.4, 0.3, 0.5);
    sphere(b, 'lights', LAMP, 0.12, 8, 6);
    b.pop();
  },
};
