/**
 * Ferrous Hegemony — the BODY PLAN core.
 *
 * Brief: docs/FactionShipDesignBible.md §4.2. Charter: src/game/ship-scale.js.
 *
 * WHY THIS FILE EXISTS.
 *
 * A Ferrous body is BLUNT mass and layered armour, not a constant-section tube.
 * The Hegemony builds from rectangular unit volumes (citadel steps, weapon blocks,
 * container blocks, tug bodies) and wraps them in proud-standing armour belts that
 * stop short of bow and stern so the fleet's prows read as reinforced wedges.
 *
 * This layer comes first. Motifs in ./motifs.js decorate the body; they cannot
 * make one. A class writes a station list, reads its extents, and only then adds
 * equipment. Silhouette before greeble.
 *
 * GEOMETRY CONTRACT. Everything is emitted through the loft core (../loft.js),
 * which produces non-indexed BufferGeometry carrying position, normal and uv —
 * the same attribute set as THREE's primitives. Winding is decided per triangle
 * against an outward reference, so station lists authored in either handedness
 * still render solid under the front-side-only hull material.
 */

import * as THREE from 'three';

import {
  sectionAt, loftExtents, loftHull, loftPlating,
} from '../loft.js';

// Re-export the faction-agnostic sweep core so class files have one import source.
export {
  tri,
  quad,
  emitMesh,
  sectionOutline,
  sectionAt,
  loftExtents,
  loftHull,
  loftPlating,
  loftRib,
} from '../loft.js';

/**
 * A chamfered rectangular armour box — the Hegemony's unit volume.
 *
 * Centred on the current frame, `d` long on Z. This is a two-station loft
 * built with the Ferrous chamfer default (0.14) rather than the Veridian
 * chamfer (0.3) because Ferrous mass is BLUNT, not machined-elegant.
 *
 * Use this for citadel steps, weapon blocks, container blocks, and tug bodies
 * so a class's add-on volumes speak the same construction language as its hull.
 * The `taper` parameter lets a block narrow toward one end, useful for prow
 * reinforcement where the forward face is a thinner impact plate.
 */
export function armourBlock(b, ch, hexes, { w, h, d, c = 0.14, taper = 1, y = 0 }) {
  loftHull(b, ch, hexes, {
    stations: [
      { z: -d / 2, w: w * taper, h: h * taper, y, c },
      { z: d / 2, w, h, y, c },
    ],
  });
}

/**
 * The Ferrous signature LAYERED hull — a base shell wrapped by a proud-standing
 * armour belt band.
 *
 * Sweeps the station list twice: first as the base shell (`loftHull`), then
 * a second, shorter, proud-standing sweep forming a continuous belt around the
 * hull. The belt stops visibly short of bow and stern — a belt that runs the
 * full length is just a bigger hull.
 *
 * The belt is a separate part chain, so it must OVERLAP the base shell. It is
 * grown from the same sections (w and h grown by `belt`, y shifted by `beltAt`),
 * so it overlaps by construction. The belt's colour comes from the second entry
 * of `hexes` when the caller passes a list; otherwise it shares the base colour.
 *
 * This is the Ferrous citadel doctrine: the protected core is visible as a
 * distinct band around the ship's midsection, leaving the bow and stern clear
 * for prow reinforcement and drive hardware.
 *
 * @param {Object} options - Belt options.
 * @param {number} [options.trim=0.15] - Fraction of each end to exclude from the belt.
 *   The belt spans the central (1−2·trim) portion of the hull length.
 *   End sections are interpolated at the exact trim positions; filtering original
 *   stations would make the belt disappear on coarse station lists or land at
 *   arbitrary positions depending on station spacing.
 */
export function beltedHull(b, ch, hexes, {
  stations,
  belt = 0.10,
  beltAt = 0.0,
  trim = 0.15,
  seg = 0,
  capFore = true,
  capAft = true,
}) {
  // Base shell.
  loftHull(b, ch, hexes, { stations, seg, capFore, capAft });

  // Belt: grow w/h by `belt`, shift y by `beltAt`, span the trimmed band.
  const list = Array.isArray(hexes) ? hexes : [hexes];
  const beltColor = list.length > 1 ? list[1] : list[0];
  const extents = loftExtents(stations);
  const len = extents.len;

  // Guard against degenerate hulls (zero length or single-point station list).
  if (len <= 0) return;

  const zFore = extents.z0 + len * trim;
  const zAft = extents.z1 - len * trim;

  // If the trim margins meet or cross, emit no belt.
  if (zFore >= zAft) return;

  // Interpolate the exact end sections at the trim positions.
  const sFore = sectionAt(stations, zFore);
  const sAft = sectionAt(stations, zAft);

  // Build belt stations: interpolated ends plus all interior stations.
  const beltStations = [];

  // Fore end (interpolated).
  beltStations.push({
    z: sFore.z,
    w: sFore.w + belt,
    h: sFore.h + belt,
    y: (sFore.y ?? 0) + beltAt,
    c: sFore.c ?? 0.3,
  });

  // Interior original stations that fall strictly between the trim marks.
  for (const s of stations) {
    if (s.z > zFore && s.z < zAft) {
      beltStations.push({
        z: s.z,
        w: s.w + belt,
        h: s.h + belt,
        y: (s.y ?? 0) + beltAt,
        c: s.c ?? 0.3,
      });
    }
  }

  // Aft end (interpolated).
  beltStations.push({
    z: sAft.z,
    w: sAft.w + belt,
    h: sAft.h + belt,
    y: (sAft.y ?? 0) + beltAt,
    c: sAft.c ?? 0.3,
  });

  // Emit the belt as a proud-standing sweep with no end caps.
  loftHull(b, ch, beltColor, { stations: beltStations, seg, capFore: false, capAft: false });
}

/**
 * A plating course restricted to a Z RANGE of a station list.
 *
 * This lets a class armour its citadel heavily and leave its tail lighter.
 * The Ferrous doctrine is "protect the vital spine and drive, not every cargo
 * box", so this is the class author's main vertex engine.
 *
 * Does NOT reimplement plate emission: builds a sub-station-list by clipping/
 * interpolating `stations` between `from` and `to` (using `sectionAt` for the
 * two cut sections and keeping every original station strictly between them)
 * and delegates to `loftPlating`.
 *
 * Per the context file, this must never be switched off to meet a budget —
 * the faction's surface language IS the plating.
 */
export function armourCourse(b, ch, hexes, {
  stations,
  from,
  to,
  rows,
  cols,
  t = 0.07,
  inset = 0.14,
  seed = 1,
  faces = null,
}) {
  // Build a sub-station-list for the range [from, to].
  const sub = [];
  const extents = loftExtents(stations);
  const z0 = extents.z0;
  const z1 = extents.z1;

  // Clamp from/to to station range.
  const startZ = Math.max(z0, from);
  const endZ = Math.min(z1, to);

  if (startZ >= endZ) return; // Empty range.

  // Add interpolated start section if from is not exactly on a station.
  const startOnStation = stations.some(s => Math.abs(s.z - startZ) < 1e-4);
  if (!startOnStation) {
    sub.push(sectionAt(stations, startZ));
  }

  // Add all stations strictly inside the range.
  for (const s of stations) {
    if (s.z > startZ && s.z < endZ) {
      sub.push(s);
    }
  }

  // Add interpolated end section if to is not exactly on a station.
  const endOnStation = stations.some(s => Math.abs(s.z - endZ) < 1e-4);
  if (!endOnStation) {
    sub.push(sectionAt(stations, endZ));
  }

  // Delegate to loftPlating.
  if (sub.length >= 2) {
    loftPlating(b, ch, hexes, { stations: sub, seg: 0, rows, cols, t, inset, seed, faces });
  }
}

/**
 * The fleet logistics carrier's structural train — an armoured spine.
 *
 * Same lattice idea as Veridian's `openKeel` (four longitudinal chords on a
 * `w` x `h` rectangle, a closed frame every `bay` units, alternating diagonal
 * bracing) but DOCTRINALLY DIFFERENT: bible §4.2 says "Armor the vital spine
 * and drive, not every cargo box", so this version adds a continuous armour
 * shroud over the spine's dorsal and ventral chord pairs — box plates of
 * half-thickness `plate` running bay to bay — leaving the flanks open lattice.
 *
 * Members are plain boxes so the attach audit sees a dense chain of overlapping
 * parts. Symmetry doctrine: every side member goes inside `for (const sx of [1, -1])`.
 *
 * This is a BODY, not a decoration — the freighter's open industrial spine is
 * what makes it read as a logistics train, not another plated tube.
 */
export function armouredSpine(b, ch, hexes, {
  from,
  to,
  w,
  h,
  bay = 3.6,
  chord = 0.42,
  brace = 0.26,
  plate = 0.5,
}) {
  const list = Array.isArray(hexes) ? hexes : [hexes];
  const len = to - from;
  const bays = Math.max(1, Math.round(len / bay));
  const step = len / bays;

  // Helper: emit a box with all three dimensions explicit (no unit-cube hazards).
  const box3 = (hex, cx, cy, cz, sx, sy, sz) => {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    b.add(ch, g, hex, { x: cx, y: cy, z: cz });
  };

  // Chords — four longitudinal corners.
  for (const sx of [1, -1]) {
    for (const sy of [1, -1]) {
      box3(list[0], sx * w, sy * h, from + len / 2, chord, chord, len);
    }
  }

  // Frames and bracing.
  for (let i = 0; i <= bays; i++) {
    const z = from + i * step;

    // Four frame ribs (top, bottom, left, right).
    box3(list[1 % list.length], 0, h, z, w * 2 + chord, chord * 0.86, chord * 0.86);
    box3(list[1 % list.length], 0, -h, z, w * 2 + chord, chord * 0.86, chord * 0.86);
    box3(list[1 % list.length], w, 0, z, chord * 0.86, h * 2 + chord, chord * 0.86);
    box3(list[1 % list.length], -w, 0, z, chord * 0.86, h * 2 + chord, chord * 0.86);

    // Diagonal bracing in each bay (skip after the last frame).
    if (i === bays) continue;
    const flip = i % 2 === 0 ? 1 : -1;
    const diag = Math.hypot(step, h * 2);
    const diagW = Math.hypot(step, w * 2);
    const ang = Math.atan2(h * 2, step) * flip;
    const angW = Math.atan2(w * 2, step) * flip;

    // Side diagonals (XZ planes).
    for (const sx of [1, -1]) {
      const g = new THREE.BoxGeometry(brace, brace, diag);
      b.add(ch, g, list[2 % list.length], { x: sx * w, y: 0, z: z + step / 2, rx: ang });
    }

    // Top/bottom diagonals (YZ planes).
    for (const sy of [1, -1]) {
      const g = new THREE.BoxGeometry(brace, brace, diagW);
      b.add(ch, g, list[2 % list.length], { x: 0, y: sy * h, z: z + step / 2, ry: -angW });
    }
  }

  // Armour shroud — cover dorsal and ventral chord pairs.
  // Shroud plates run bay-to-bay, half-thickness, overlapping the chords.
  const shroudHex = list[(list.length - 1) % list.length];
  for (let i = 0; i < bays; i++) {
    const z0 = from + i * step;
    const z1 = z0 + step;

    // Dorsal shroud (covers the two top chords).
    box3(shroudHex, 0, h + chord * 0.5, (z0 + z1) / 2, w * 2 + chord, plate, step + plate);

    // Ventral shroud (covers the two bottom chords).
    box3(shroudHex, 0, -h - chord * 0.5, (z0 + z1) / 2, w * 2 + chord, plate, step + plate);
  }
}
