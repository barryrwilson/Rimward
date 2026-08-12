/**
 * Heavy — THE ANVIL, WIDEST AT THE PROW.
 * Bible: "A compact armored core with recessed weapons, redundant sensor facets,
 * and protected sample vaults. The prow should look like a legal boundary made
 * physical: blunt, exact, and difficult to push aside."
 *
 * Charter: size 14.52-18.48 (target 17.0), hull 9k-40k verts, lights >= 600.
 *
 * Body plan: Inverted taper. Widest at the prow (z=-7.60, w=3.45, h=2.15),
 * continuously narrowing toward a compact drive block. In plan view, a trapezoid
 * pointing backward. The boundary face at z=-8.40 is a near-rectangular chamfered
 * slab — the prow arrives before the ship does. Armour steps back in courses
 * from that face, so layering reads from the side AND from above.
 */

import {
  loftHull, loftPlating, loftRib, chamferBlock,
  sectionAt, loftExtents,
} from './body.js';
import {
  LAMP, GLASS, OPTIC, DIM,
  rangingVane, sampleCanister, surveyAperture,
  driveSection, moduleLatch,
} from './motifs.js';
import {
  weather, box, cyl, lampString, windowRow,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';

export const veridianHeavy = {
  glowZ: 7.0,
  
  build(b, st) {
    const stations = [
      { z: -8.40, w: 3.35, h: 2.10, c: 0.10 },  // boundary face — squared, exact, legal
      { z: -7.60, w: 3.40, h: 2.12, c: 0.12 },  // widest at prow — inverted taper
      { z: -5.20, w: 3.38, h: 2.10, c: 0.14 },  // constant forward block
      { z: -4.10, w: 3.38, h: 2.10, c: 0.16 },  // end of forward block
      { z: -3.95, w: 2.00, h: 1.25, c: 0.18 },  // CLIFF — 41% drop over 0.15, anvil profile
      { z: -2.50, w: 1.90, h: 1.20, c: 0.22 },  // slim constant tail
      { z:  0.50, w: 1.88, h: 1.18, c: 0.24 },  // slim constant tail held
      { z:  2.20, w: 1.85, h: 1.15, c: 0.26 },  // approaching drive
      { z:  5.60, w: 1.30, h: 0.95, c: 0.30 },  // compact drive block
    ];
    // Main shell with band colours — WIDENED tonal range
    const hullBands = [
      st.hull,
      weather(st.hull, 1),
      weather(st.hullDark, 1),
      weather(st.hull, 2),
    ];
    
    // Plating — WIDENED tonal range, spend budget on prow
    // Use hullDark and patch for variation, reserve trim for frames
    const plateHexes = [
      st.hull,
      weather(st.hullDark, 1),
      weather(st.hull, 2),
      st.patch[0],
      weather(st.hullDark, 2),
    ];
    
    loftPlating(b, 'hull', plateHexes, {
      stations,
      rows: 2,  // Reduced from 3 to buy vertices for prow detail
      cols: 2,
      t: 0.06,
      inset: 0.16,
      seed: 1,
    });
    
    // ===== ARMOUR COURSES — visible forward buildup, capped at shoulder =====
    // Genuine courses standing proud of skin, stepped back from prow
    // Last course sits at front of shoulder to cap the cliff
    const ribZ = [-7.60, -5.20, -4.10];
    const ribOut = [0.65, 0.45, 0.55];  // proud of skin — reads from side
    const ribThick = [0.40, 0.32, 0.38];
    
    
    for (let i = 0; i < ribZ.length; i++) {
      loftRib(b, 'hull', weather(st.hullDark, 2), {
        stations,
        z: ribZ[i],
        out: ribOut[i],
        thick: ribThick[i],
      });
    }
    
    // ===== DRIVE SECTION — compact stern block =====
    const sternStation = stations[stations.length - 1];
    const driveLen = 3.0;
    
    b.push(0, 0, 5.60 + driveLen);
    driveSection(b, st, {
      r: Math.max(sternStation.w, sternStation.h),
      len: driveLen,
      throats: 3,
      seed: 1,
      w: sternStation.w,
      h: sternStation.h,
      c: sternStation.c,
    });
    b.pop();
    
    // ===== REDUNDANT SENSOR FACETS — ON the boundary face =====
    // Multiple apertures at clearly different radii, arranged asymmetrically
    // Each seated so its shank bolts back through the face (surveyAperture reaches
    // backward by 0.55 * depth from its frame origin)
    const boundaryZ = -8.40;
    const boundaryS = sectionAt(stations, boundaryZ);
    const sensorConfigs = [
      // Large dominant aperture — slightly offset, with full face
      { r: 1.3, x: 0.15, y: 0, face: true },
      // Medium survey aperture — upper right, with full face
      { r: 0.9, x: 0.85, y: 0.55, face: true },
      // Medium-small aperture — lower left, with full face  
      { r: 0.7, x: -0.9, y: -0.5, face: true },
      // Small simple aperture — lower right, no face (instrument cluster)
      { r: 0.5, x: 0.7, y: -0.65, face: false },
    ];
    
    for (const cfg of sensorConfigs) {
      // Clamp to stay within face boundary
      const maxX = boundaryS.w - cfg.r - 0.2;
      const maxY = boundaryS.h/2 - cfg.r - 0.15;
      const cx = Math.max(-maxX, Math.min(maxX, cfg.x));
      const cy = Math.max(-maxY, Math.min(maxY, cfg.y));
      
      b.push(cx, cy + boundaryS.y, boundaryZ);
      surveyAperture(b, st, {
        r: cfg.r,
        depth: 0.9,
        dir: -1,
        face: cfg.face,
      });
      b.pop();
    }
    // ===== MACHINED BOUNDARY FACE — plated course and alloy frame =====
    // The boundary face is a legal boundary made physical: exact, framed, bolted
    const faceZ = -8.38;  // Just behind the absolute prow
    const faceS = sectionAt(stations, faceZ);
    const faceW = faceS.w * 2;
    const faceH = faceS.h;
    
    // Plated course across the boundary face — hand-placed plates for control
    const plateRows = 2;
    const plateCols = 3;
    const plateZW = 0.3;  // Plate depth in Z
    
    for (let pr = 0; pr < plateRows; pr++) {
      for (let pc = 0; pc < plateCols; pc++) {
        // Position plates across the face
        const px = (pc - (plateCols - 1) / 2) * (faceW / plateCols);
        const py = (pr - (plateRows - 1) / 2) * (faceH / plateRows);
        const pw = faceW / plateCols - 0.08;
        const ph = faceH / plateRows - 0.08;
        
        // Skip plates that would intersect large apertures
        if (Math.abs(px - 0.15) < 0.8 && Math.abs(py) < 0.8) continue;  // Large aperture
        if (Math.abs(px - 0.85) < 0.5 && Math.abs(py - 0.55) < 0.5) continue;  // Medium aperture
        
        b.push(px, py + faceS.y, faceZ - plateZW/2);
        box(b, 'hull', [st.hull, weather(st.hullDark, 1), st.patch[0]][(pr + pc) % 3],
          pw, ph, plateZW, { c: 0.15 });
        b.pop();
      }
    }
    
    // Heavy alloy edge frame around perimeter — exactness reads as structure
    const frameThick = 0.12;
    const frameDepth = 0.25;
    
    // Top frame
    b.push(0, faceS.y + faceH/2 + frameThick/2, faceZ);
    box(b, 'hull', st.trim, faceW + frameThick * 2, frameThick, frameDepth, { c: 0.12 });
    b.pop();
    
    // Bottom frame
    b.push(0, faceS.y - frameThick/2, faceZ);
    box(b, 'hull', st.trim, faceW + frameThick * 2, frameThick, frameDepth, { c: 0.12 });
    b.pop();
    
    // Left frame
    b.push(-faceS.w - frameThick/2, faceS.y + faceH/2, faceZ);
    box(b, 'hull', st.trim, frameThick, faceH + frameThick * 2, frameDepth, { c: 0.12 });
    b.pop();
    
    // Right frame
    b.push(faceS.w + frameThick/2, faceS.y + faceH/2, faceZ);
    box(b, 'hull', st.trim, frameThick, faceH + frameThick * 2, frameDepth, { c: 0.12 });
    b.pop();
    
    // Corner boss/bolt fixings — four corner fixings for exactness
    const bossSize = 0.18;
    const bossZ = faceZ - frameDepth/2;
    
    for (const bx of [-1, 1]) {
      for (const by of [-1, 1]) {
        const bossX = bx * (faceS.w + bossSize/2);
        const bossY = faceS.y + by * (faceH/2 + bossSize/2);
        
        b.push(bossX, bossY, bossZ);
        box(b, 'hull', weather(st.hullDark, 2), bossSize, bossSize, bossSize, { c: 0.25 });
        // Bolt head
        b.push(0, 0, bossSize/2);
        cyl(b, 'hull', st.trim, bossSize * 0.35, bossSize * 0.35, 0.04, 6, { rx: Math.PI / 2 });
        b.pop();
        b.pop();
      }
    }
    
    // ===== RECESSED WEAPONS — visible shuttered openings in prow shoulders =====
    // Weapon wells positioned to be READ from the front: dark wells with alloy lip
    // and a small dim optic deep inside — not buried under armour
    const weaponZ = -7.6;  // Forward enough to be visible before shoulder curves
    const weaponS = sectionAt(stations, weaponZ);
    const weaponY = [-0.6, 0.6];
    
    for (const wy of weaponY) {
      for (const wx of [1.25, -1.25]) {
        // Position on forward shoulders where they're visible
        const flankX = wx;
        
        b.push(flankX, wy + weaponS.y, weaponZ, 0, 0, wx > 0 ? 0.2 : Math.PI - 0.2);
        
        // Recessed weapon well — dark opening with alloy lip
        chamferBlock(b, 'hull', [weather(st.hullDark, 3), st.trim], {
          w: 0.55,
          h: 0.45,
          d: 0.7,
          c: 0.30,
          y: wy,
        });
        
        // Small dim lit element deep inside — the optic
        b.push(0, 0, 0.35);
        cyl(b, 'lights', DIM, 0.06, 0.06, 0.08, 8, { rx: Math.PI / 2 });
        b.pop();
        
        b.pop();
      }
    }
    
    // ===== PROTECTED SAMPLE VAULTS — flank recesses =====
    const vaultZ = -4.0;
    const vaultS = sectionAt(stations, vaultZ);
    const vaultY = [-0.4, 0.4];
    
    // Both sides in one loop with proper mirroring
    for (const sx of [1, -1]) {
      for (const vy of vaultY) {
        const vaultX = sx * (vaultS.w - 0.8);
        
        b.push(vaultX, vy + vaultS.y, vaultZ, 0, 0, sx > 0 ? 0 : Math.PI);
        
        // Recessed vault
        chamferBlock(b, 'hull', [st.trim, weather(st.hull, 1)], {
          w: 0.9,
          h: 0.7,
          d: 1.4,
          c: 0.28,
          y: vy,
        });
        
        // Module latch proving detachability
        b.push(0, vy + 0.5, 0);
        moduleLatch(b, st, { ry: Math.PI / 2, lit: true, s: 0.8 });
        b.pop();
        
        // Sample canister visible in cradle
        b.push(-0.15, vy - 0.15, 0.2);
        sampleCanister(b, st, { r: 0.18, len: 0.7, seed: sx > 0 ? 2 : 3 });
        b.pop();
        
        b.pop();
      }
    }
    
    // ===== DORSAL COMMAND BLOCK =====
    const cmdZ = -2.0;
    const cmdS = sectionAt(stations, cmdZ);
    
    b.push(0, cmdS.y + cmdS.h - 0.3, cmdZ);
    
    // Low command block inside armour line
    chamferBlock(b, 'hull', [st.trim, weather(st.hull, 2)], {
      w: 1.2,
      h: 0.7,
      d: 1.8,
      c: 0.30,
      y: 0.35,
    });
    
    // Real lit windows using windowRow in lights channel
    b.push(0, 0.35, 0.6);
    windowRow(b, 'lights', GLASS, {
      count: 3,
      spacing: HUMAN.windowGap,
      w: HUMAN.windowW,
      h: HUMAN.windowH,
      d: HUMAN.windowD,
      x: 0,
      y: 0,
      z: 0,
      axis: 'x',
    });
    b.pop();
    
    b.pop();
    
    // ===== VENTRAL COUNTERWEIGHT =====
    // Keep pivot within 15% of Y span
    // Position to overlap with main hull at bottom
    b.push(0, cmdS.y - cmdS.h - 0.2, 1.0);
    
    chamferBlock(b, 'hull', [weather(st.hullDark, 1), st.trim], {
      w: 1.4,
      h: 0.6,
      d: 1.6,
      c: 0.32,
      y: -0.3,
    });
    
    b.pop();
    
    // ===== SERVICE DECK PLATING AND LAMPS — STEPPED TO FOLLOW TAPER =====
    // Deck plates stepped in short segments using sectionAt per segment
    const lampZStart = -6.0;
    const lampZEnd = 4.0;
    const deckW = 0.4;
    const deckH = 0.12;
    const segmentLen = 2.0; // Short segments to follow taper
    
    // Starboard side — stepped deck plates
    for (let segZ = lampZStart; segZ < lampZEnd; segZ += segmentLen) {
      const segEnd = Math.min(segZ + segmentLen, lampZEnd);
      const midZ = (segZ + segEnd) / 2;
      const segS = sectionAt(stations, midZ);
      const segLen = segEnd - segZ;
      
      const deckX = segS.w + deckW/2;
      b.push(deckX, segS.y, midZ);
      box(b, 'hull', weather(st.hull, 1), deckW, deckH, segLen, {});
      
      // Lamps on this segment
      const lampCount = Math.max(1, Math.floor(segLen / HUMAN.lampGap));
      if (lampCount > 0) {
        b.push(0, deckH/2 + 0.05, -segLen/2 + 0.3);
        lampString(b, 'lights', LAMP, {
          ax: 0,
          ay: 0,
          az: 0,
          bx: 0,
          by: 0,
          bz: segLen - 0.6,
          count: lampCount,
          size: HUMAN.lampSize,
        });
        b.pop();
      }
      
      b.pop();
    }
    
    // Port side — stepped deck plates
    for (let segZ = lampZStart; segZ < lampZEnd; segZ += segmentLen) {
      const segEnd = Math.min(segZ + segmentLen, lampZEnd);
      const midZ = (segZ + segEnd) / 2;
      const segS = sectionAt(stations, midZ);
      const segLen = segEnd - segZ;
      
      const deckX = -(segS.w + deckW/2);
      b.push(deckX, segS.y, midZ);
      box(b, 'hull', weather(st.hull, 1), deckW, deckH, segLen, {});
      
      // Lamps on this segment
      const lampCount = Math.max(1, Math.floor(segLen / HUMAN.lampGap));
      if (lampCount > 0) {
        b.push(0, deckH/2 + 0.05, -segLen/2 + 0.3);
        lampString(b, 'lights', LAMP, {
          ax: 0,
          ay: 0,
          az: 0,
          bx: 0,
          by: 0,
          bz: segLen - 0.6,
          count: lampCount,
          size: HUMAN.lampSize,
        });
        b.pop();
      }
      
      b.pop();
    }
    
    // ===== APPROACH LIGHTS on drive section =====
    b.push(0, 0, 5.60 + driveLen + 0.3);
    
    lampString(b, 'lights', LAMP, {
      ax: -0.6,
      ay: 0,
      az: 0,
      bx: 0.6,
      by: 0,
      bz: 0,
      count: 3,
      size: HUMAN.lampSize,
    });
    
    b.pop();
    
    // ===== RANGING VANES — seated on hull skin =====
    const vaneZ = -6.5;
    const vaneS = sectionAt(stations, vaneZ);
    
    // Starboard vane
    b.push(vaneS.w - 0.15, 0.5, vaneZ, 0, 0, 0);
    rangingVane(b, st, { len: 1.8, chord: 0.6, thick: 0.07, ry: 0.2, lit: true });
    b.pop();
    
    // Port vane - mirror
    b.push(-(vaneS.w - 0.15), 0.5, vaneZ, 0, 0, Math.PI);
    rangingVane(b, st, { len: 1.8, chord: 0.6, thick: 0.07, ry: -0.2, lit: true });
    b.pop();
  }
};
