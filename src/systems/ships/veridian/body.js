/**
 * Veridian Combine — the BODY PLAN core.
 *
 * Brief: docs/FactionShipDesignBible.md §4.1. Charter: src/game/ship-scale.js.
 *
 * WHY THIS FILE EXISTS.
 *
 * The sweep core — the machinery that turns a list of cross-section stations
 * into a hull — now lives in `../loft.js` as the faction-agnostic foundation
 * every rebuild shares. This file carries only the Combine's own construction
 * language, not the general lofting tools.
 *
 * A class author imports the shared functions from this file (`from './body.js'`)
 * so their class files never need to know that the sweep core was extracted.
 */

// Re-export the entire sweep core so every existing importer keeps working.
export {
  tri, quad, emitMesh, sectionOutline, sectionAt, loftExtents, loftHull, loftPlating, loftRib,
} from '../loft.js';

import { loftHull } from '../loft.js';
import * as THREE from 'three';

/**
 * A chamfered block: the Combine's serialized pressure vessel as a rectangular
 * unit rather than a hex prism. Centred on the current frame, `d` long on Z.
 * Use it for vaults, citadels, evidence lockers and control blocks so a class's
 * add-on volumes speak the same construction language as its hull.
 */
export function chamferBlock(b, ch, hexes, { w, h, d, c = 0.3, taper = 1, y = 0 }) {
  loftHull(b, ch, hexes, {
    stations: [
      { z: -d / 2, w: w * taper, h: h * taper, y, c },
      { z: d / 2, w, h, y, c },
    ],
  });
}

/**
 * An OPEN structural keel: four longitudinal chords on a `w` x `h` rectangle,
 * a closed frame every `bay` units, and diagonal bracing in every bay on all
 * four sides. This is the freighter's spine, and the reason it is here rather
 * than in motifs.js is that it is a BODY, not a decoration — the brief asks for
 * "a gigantic open industrial spine", and a plated tube is the opposite of open.
 *
 * Members are plain boxes, so the audit sees a dense chain of overlapping parts
 * and the silhouette reads as a lattice from every angle.
 */
export function openKeel(b, ch, hexes, { from, to, w, h, bay = 3.2, chord = 0.34, brace = 0.2 }) {
  const list = Array.isArray(hexes) ? hexes : [hexes];
  const len = to - from;
  const bays = Math.max(1, Math.round(len / bay));
  const step = len / bays;
  const box3 = (hex, cx, cy, cz, sx, sy, sz) => {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    b.add(ch, g, hex, { x: cx, y: cy, z: cz });
  };
  // Chords.
  for (const sx of [1, -1]) {
    for (const sy of [1, -1]) {
      box3(list[0], sx * w, sy * h, from + len / 2, chord, chord, len);
    }
  }
  // Frames and bracing.
  for (let i = 0; i <= bays; i++) {
    const z = from + i * step;
    box3(list[1 % list.length], 0, h, z, w * 2 + chord, chord * 0.86, chord * 0.86);
    box3(list[1 % list.length], 0, -h, z, w * 2 + chord, chord * 0.86, chord * 0.86);
    box3(list[1 % list.length], w, 0, z, chord * 0.86, h * 2 + chord, chord * 0.86);
    box3(list[1 % list.length], -w, 0, z, chord * 0.86, h * 2 + chord, chord * 0.86);
    if (i === bays) continue;
    // One diagonal per side per bay, alternating direction so the lattice reads
    // as a truss rather than as a stack of identical Ns.
    const flip = i % 2 === 0 ? 1 : -1;
    const diag = Math.hypot(step, h * 2);
    const diagW = Math.hypot(step, w * 2);
    const ang = Math.atan2(h * 2, step) * flip;
    const angW = Math.atan2(w * 2, step) * flip;
    for (const sx of [1, -1]) {
      const g = new THREE.BoxGeometry(brace, brace, diag);
      b.add(ch, g, list[2 % list.length], { x: sx * w, y: 0, z: z + step / 2, rx: ang });
    }
    for (const sy of [1, -1]) {
      const g = new THREE.BoxGeometry(brace, brace, diagW);
      b.add(ch, g, list[2 % list.length], { x: 0, y: sy * h, z: z + step / 2, ry: -angW });
    }
  }
}
