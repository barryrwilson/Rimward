/**
 * Veridian Combine — ownership made physical.
 *
 * Brief: docs/FactionShipDesignBible.md §4.1. Charter: src/game/ship-scale.js.
 * Plan: docs/FactionShipRebuildPlan.md.
 *
 * FIRST READ: calm corporate authority, survey precision, modular extraction
 * hardware. A Veridian ship is a straight load-bearing spine carrying
 * serialized, replaceable hexagonal pressure modules, detachable survey pods,
 * and instruments treated as valuable equipment rather than decoration.
 *
 * WHY IT LOOKS LIKE THIS (the failures are the design notes):
 *   MOTIFS MAKE THE FAMILY, ANATOMY MAKES THE CLASS. The bible forbids one
 *   faction hull scaled six ways, and it also demands the six read as
 *   relatives. Both are satisfied by the MOTIFS section below: every class
 *   composes the same construction logic — hex spine, hex module, module
 *   latch, ranging vane, survey aperture — into a body shaped for its job. A
 *   claim scout is a dart around one instrument; an extraction carrier is an
 *   open industrial spine. They share vocabulary, not proportions.
 *   THE HUMAN MODULE IS THE ONLY CONSTANT RULER. Windows, doors, rails,
 *   ladders, lamps, collars and containers come from HUMAN in
 *   src/game/ship-scale.js and are ABSOLUTE world units. A larger class gets
 *   MORE of them, never bigger ones. That is what lets a reviewer sort the
 *   family by class at thumbnail size with the colour switched off, and it is
 *   why no window literal appears in this file.
 *   EMERALD IS A LIGHT, NOT A PAINT. FACTION_STYLE.veridian.glow is 0x58c49a
 *   and the additive lights material MULTIPLIES its vertex colours, so every
 *   lit part here is authored NEAR-WHITE (every sRGB channel >= 0.6) and the
 *   material supplies the hue. A saturated emerald in the vertex colours would
 *   square the hue, and st.glow is not on the hull's SHADES ladder anyway.
 *   SIZE CAME FROM THE CHARTER, NOT FROM TASTE. Wave 47 made this fleet's
 *   freighter smaller than its heavy. Class size is now the largest span of the
 *   hull and must land inside SHIP_SCALE[class].span; see the class comments.
 *   PARTS MUST OVERLAP, NOT TOUCH. The singleMass pin floods an edge-sampled
 *   occupancy grid whose cell runs from 0.6 units on a light craft to 3.2 on a
 *   freighter. A vane, silo or gantry that meets the hull at a mathematical
 *   tangent reads as a floating island at that resolution, so every mounted
 *   part here is pushed bodily INTO the mass it hangs off.
 *
 * Orientation: nose -Z, stern +Z, root pivot at the stable centre of mass.
 * Hex prisms run along Z via `rx: Math.PI / 2`, which puts a VERTEX at +/-Y and
 * a FLAT FACE at +/-X. Flank detail therefore sits at `r * HEXF`; dorsal detail
 * sits at the ridge radius `r`.
 */

import {
  rng, weather, box, cyl, cone, sphere, hemi, torus,
  ribBands, windowRow, windowGrid, panelSkin, panelPatches, portholeRing,
  pipeRun, truss, railing, antenna, ladder, lampString, crate,
} from '../station-detail.js';
import { HUMAN } from '../../game/ship-scale.js';

// Lights channel near-whites. The additive material's colour is the faction's
// emerald and multiplies these, so they stay near-neutral.
const LAMP = 0xffffff;  // running / work lamp
const GLASS = 0xfff2d8; // warm cabin glass
const OPTIC = 0xe8f0ff; // cool instrument optic
const DIM = 0xe8dcc8;   // dimmed interior

/** Hex flat-face distance as a fraction of the prism radius. */
const HEXF = Math.cos(Math.PI / 6);

// ==== MOTIFS — the Veridian construction logic, shared by all six classes ====
//
// Every motif places geometry in the CURRENT builder frame, so a caller wraps
// it in `b.push(x, y, z, ry, rx, rz)` / `b.pop()` to position it. No motif
// leaves a frame open.

/**
 * Straight load-bearing hex spine from z=`from` to z=`to`. The member every
 * Veridian ship hangs off — ordered, efficient, plated, ribbed at a regular
 * pitch. Rib count follows the length, so the pitch stays constant across
 * classes instead of stretching with the hull.
 */
function hexSpine(b, st, { r, from, to, ribGap = 1.6, seed = 1, shade = 0 }) {
  const len = to - from;
  const body = weather(st.hull, shade);
  const plates = [weather(st.hull, shade), weather(st.hullDark, shade), weather(st.patch[0], shade)];
  b.push(0, 0, (from + to) / 2, 0, 0, 0);
    cyl(b, 'hull', body, r, r, len, 6, { rx: Math.PI / 2 });
    panelSkin(b, 'hull', plates, {
      r, from: -len / 2 + 0.05, to: len / 2 - 0.05,
      rows: Math.max(3, Math.round(len / Math.max(0.5, r * 1.3))), cols: 6,
      seed, t: Math.min(0.12, r * 0.18), axis: 'z',
    });
  b.pop();
  ribBands(b, 'hull', st.trim, {
    r: r + Math.min(0.07, r * 0.1), tube: Math.min(0.06, r * 0.09),
    from: from + ribGap * 0.5, to: to - ribGap * 0.5,
    count: Math.max(2, Math.round(len / ribGap)), axis: 'z', tseg: 6,
  });
}

/**
 * Serialized hexagonal pressure module, centred on the current frame: the
 * Combine's replaceable unit. End collars, a plated skin, a serial plate on the
 * starboard flat face, and optionally a HUMAN window row on both flanks. It has
 * to read as an interchangeable part even with no legible text on it.
 */
function hexModule(b, st, { r, len, seed = 1, shade = 0, windows = 0, serial = true }) {
  const plates = [weather(st.hull, shade), weather(st.patch[0], shade), weather(st.trim, 2 + shade)];
  cyl(b, 'hull', weather(st.hull, shade), r, r, len, 6, { rx: Math.PI / 2 });
  panelSkin(b, 'hull', plates, {
    r, from: -len / 2 + 0.06, to: len / 2 - 0.06,
    rows: Math.max(2, Math.round(len / Math.max(0.45, r * 1.2))), cols: 6,
    seed, t: Math.min(0.1, r * 0.16), axis: 'z',
  });
  for (const z of [-len / 2 + 0.05, len / 2 - 0.05]) {
    ribBands(b, 'hull', st.trim, {
      r: r + Math.min(0.06, r * 0.1), tube: Math.min(0.05, r * 0.09),
      from: z, to: z, count: 1, axis: 'z', tseg: 6,
    });
  }
  const flank = r * HEXF;
  if (serial) {
    // Serial plate: a flat machined pad, always at the same place on the unit.
    b.push(flank + 0.01, 0, len * 0.3, 0, 0, Math.PI / 2);
      box(b, 'hull', st.trim, Math.min(0.42, len * 0.34), 0.03, Math.min(0.26, r * 0.7));
      box(b, 'hull', weather(st.hullDark, 0), Math.min(0.3, len * 0.24), 0.05, Math.min(0.16, r * 0.44));
    b.pop();
  }
  if (windows > 0) {
    for (const side of [1, -1]) {
      b.push(side * (flank - 0.02), 0, 0, 0, 0, side * Math.PI / 2);
        windowRow(b, 'lights', windows > 3 ? DIM : GLASS, {
          count: windows, spacing: HUMAN.windowGap,
          w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD, axis: 'z',
        });
      b.pop();
    }
  }
}

/**
 * Thin lateral ranging vane extending along +X from the current frame origin.
 * A survey instrument, not a fin: it carries graduation ribs, a stiffening
 * root, and one optic strip. Always mounted as a port/starboard pair.
 */
function rangingVane(b, st, { len, chord, thick = 0.07, ry = 0, lit = true }) {
  b.push(0, 0, 0, ry, 0, 0);
    box(b, 'hull', st.trim, len, thick, chord, { x: len / 2 });
    box(b, 'hull', weather(st.trim, 2), len * 0.26, thick * 2.1, chord * 0.62, { x: len * 0.12 });
    for (let i = 0; i < 4; i++) {
      box(b, 'hull', weather(st.hull, 1), len * 0.86, thick * 0.6, chord * 0.055,
        { x: len * 0.53, z: (i - 1.5) * chord * 0.24 });
    }
    if (lit) {
      box(b, 'lights', OPTIC, len * 0.66, thick * 0.5, HUMAN.windowH * 0.55,
        { x: len * 0.5, y: thick * 0.5, z: chord * 0.3 });
    }
  b.pop();
}

/**
 * Detachable sample canister centred on the current frame, long axis on Z.
 * Capped, collared, and lugged so it reads as removable hardware clamped to the
 * hull rather than as part of it.
 */
function sampleCanister(b, st, { r, len, seed = 1 }) {
  const rnd = rng(seed);
  cyl(b, 'hull', weather(st.trim, 1), r, r, len, 8, { rx: Math.PI / 2 });
  for (const s of [-1, 1]) {
    cyl(b, 'hull', weather(st.hull, 1), r * 0.7, r * 0.92, r * 0.55, 8,
      { rx: Math.PI / 2, z: s * (len / 2 + r * 0.24) });
  }
  ribBands(b, 'hull', st.trim, {
    r: r + 0.03, tube: 0.035, from: -len * 0.28, to: len * 0.28,
    count: 2 + Math.floor(rnd() * 2), axis: 'z', tseg: 8,
  });
  for (const sx of [-1, 1]) {
    box(b, 'hull', st.trim, 0.06, r * 0.9, r * 0.55, { x: sx * r * 0.9, y: r * 0.5 });
  }
  box(b, 'lights', DIM, HUMAN.lampSize, HUMAN.lampSize * 0.5, HUMAN.lampSize,
    { y: r + 0.01, z: -len * 0.3 });
}

/**
 * Faceted survey aperture on the current frame, opening toward `dir` on Z
 * (-1 = forward). A stepped six-facet housing with a recessed lit disc: the
 * instrument the ship exists to carry, treated as expensive equipment.
 *
 * The housing reaches back TOWARD the frame origin as well as forward, so a
 * caller mounts it with its frame INSIDE the hull it belongs to — otherwise the
 * aperture becomes a floating island under the singleMass flood fill.
 */
function surveyAperture(b, st, { r, depth, dir = -1 }) {
  cyl(b, 'hull', st.trim, r * 0.88, r, depth * 0.5, 6, { rx: Math.PI / 2, z: dir * depth * 0.25 });
  cyl(b, 'hull', weather(st.hull, 1), r, r * 0.66, depth * 0.42, 6,
    { rx: Math.PI / 2, z: dir * depth * 0.7 });
  ribBands(b, 'hull', weather(st.trim, 1), {
    r: r * 0.96, tube: Math.max(0.03, r * 0.07),
    from: dir * depth * 0.08, to: dir * depth * 0.44, count: 2, axis: 'z', tseg: 6,
  });
  cyl(b, 'lights', OPTIC, r * 0.52, r * 0.52, depth * 0.07, 6,
    { rx: Math.PI / 2, z: dir * depth * 0.86 });
}

/**
 * Visible serialized attach point on the current frame, pad normal +Y: the
 * proof that a Veridian module comes off. Machined pad, collar at HUMAN.collarR,
 * two lugs, one index lamp. `s` scales the mechanism, never the HUMAN parts.
 */
function moduleLatch(b, st, { ry = 0, lit = true, s = 1 }) {
  b.push(0, 0, 0, ry, 0, 0);
    box(b, 'hull', st.trim, HUMAN.collarR * 2.2 * s, 0.09, HUMAN.collarR * 1.6 * s);
    torus(b, 'hull', weather(st.trim, 1), HUMAN.collarR * s, 0.06, 8, 12, undefined,
      { rx: Math.PI / 2, y: 0.05 });
    for (const sx of [-1, 1]) {
      box(b, 'hull', weather(st.hullDark, 0), 0.14, 0.2, HUMAN.collarR * 0.9 * s,
        { x: sx * HUMAN.collarR * 1.0 * s, y: 0.08 });
    }
    if (lit) {
      box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize * 0.6, HUMAN.lampSize,
        { y: 0.11, z: HUMAN.collarR * 0.7 * s });
    }
  b.pop();
}

/**
 * Distributed instrument fin extending along +X from the current frame: an
 * alloy spar carrying three graduated sensor blocks with optic slits. This is
 * what a Veridian ship puts where a warship would put a decorative fin.
 */
function instrumentFin(b, st, { len, depth, ry = 0 }) {
  b.push(0, 0, 0, ry, 0, 0);
    box(b, 'hull', st.trim, len, Math.max(0.08, depth * 0.12), depth, { x: len / 2 });
    for (let i = 0; i < 3; i++) {
      const t = 0.24 + i * 0.29;
      const k = 1 - i * 0.24;
      box(b, 'hull', weather(st.hull, 1), depth * 0.55 * k, depth * 0.46 * k, depth * 0.78 * k,
        { x: len * t });
      box(b, 'lights', OPTIC, HUMAN.windowW * 0.8, HUMAN.windowH * 0.5, HUMAN.windowW * 0.5,
        { x: len * t, y: depth * 0.26 * k });
    }
  b.pop();
}

/**
 * External tug / berthing dock on the current frame, cradle opening +Y: the
 * freighter's exterior-only berthing story made physical. Recessed cradle,
 * guide lips, collar, a HUMAN railing run and approach lamps.
 */
function tugDock(b, st, { w, d, ry = 0 }) {
  b.push(0, 0, 0, ry, 0, 0);
    box(b, 'hull', weather(st.hull, 1), w, d * 0.3, d);
    for (const s of [-1, 1]) {
      box(b, 'hull', st.trim, w, d * 0.2, 0.16, { z: s * d * 0.5 });
    }
    torus(b, 'hull', weather(st.trim, 1), HUMAN.collarR, 0.06, 8, 12, undefined,
      { rx: Math.PI / 2, y: d * 0.17 });
    railing(b, 'hull', st.trim, {
      ax: -w / 2, ay: d * 0.15, az: -d * 0.42, bx: w / 2, by: d * 0.15, bz: -d * 0.42,
      height: HUMAN.railH, posts: Math.max(2, Math.round(w / 1.2)), rail: HUMAN.railPost,
    });
    lampString(b, 'lights', LAMP, {
      ax: -w / 2 + 0.2, ay: d * 0.17, az: d * 0.42, bx: w / 2 - 0.2, by: d * 0.17, bz: d * 0.42,
      count: Math.max(2, Math.round(w / 1.4)), size: HUMAN.lampSize,
    });
  b.pop();
}

// ==== CLASSES ====

export const veridianShip = {
  /**
   * LIGHT — claim scout. A narrow sensor-first dart: a large faceted survey
   * head leads, a small pressure cabin sits behind it, two detachable sample
   * canisters ride the flanks, and thin lateral ranging vanes reach out. Almost
   * no weapon mass.
   * Charter: size 5.94-7.26, target 6.8. Hull 4k-14k verts, lights >= 260.
   */
  light: {
    glowZ: 2.6,
    build(b, st) {
      hexSpine(b, st, { r: 0.5, from: -1.2, to: 3.2, ribGap: 1.1, seed: 101 });
      b.push(0, 0, -1.55, 0, 0, 0);
        hexModule(b, st, { r: 0.56, len: 1.3, seed: 102, windows: 2 });
      b.pop();
      b.push(0, 0, -2.3, 0, 0, 0);
        surveyAperture(b, st, { r: 0.52, depth: 1.0 });
      b.pop();
      for (const sx of [1, -1]) {
        b.push(sx * 0.44, 0.05, -0.4, sx > 0 ? 0 : Math.PI, 0, 0);
          rangingVane(b, st, { len: 1.25, chord: 0.85 });
        b.pop();
        b.push(sx * 0.5, -0.2, 1.1, 0, 0, 0);
          sampleCanister(b, st, { r: 0.2, len: 0.9, seed: 103 });
        b.pop();
      }
      b.push(0, 0.5, 0.6, 0, 0, 0);
        moduleLatch(b, st, { s: 0.5 });
      b.pop();
      lampString(b, 'lights', LAMP, {
        ax: -0.44, ay: 0, az: 3.1, bx: 0.44, by: 0, bz: 3.1, count: 3, size: HUMAN.lampSize,
      });
    },
  },

  /**
   * ACE — patent demonstrator. Proprietary and unusually seamless: fewer plate
   * breaks than any sibling, an oversized emerald aperture, a high-output
   * drive, and one unmistakable split tail.
   * Charter: size 5.94-7.59, target 7.2. Hull 4k-15k verts, lights >= 260.
   */
  ace: {
    glowZ: 3.0,
    build(b, st) {
      hexSpine(b, st, { r: 0.62, from: -1.6, to: 2.4, ribGap: 2.0, seed: 111 });
      b.push(0, 0, -2.2, 0, 0, 0);
        surveyAperture(b, st, { r: 0.68, depth: 1.4 });
      b.pop();
      b.push(0, 0, 0.4, 0, 0, 0);
        hexModule(b, st, { r: 0.66, len: 1.5, seed: 112, windows: 2, serial: false });
      b.pop();
      for (const sx of [1, -1]) {
        b.push(sx * 0.5, 0, 2.5, 0, 0, 0);
          cyl(b, 'hull', st.trim, 0.28, 0.34, 1.5, 6, { rx: Math.PI / 2, x: sx * 0.35, z: 0.6 });
          box(b, 'hull', weather(st.hull, 1), 0.5, 0.16, 1.2, { x: sx * 0.2, z: 0.2 });
          box(b, 'lights', OPTIC, 0.2, 0.1, 0.16, { x: sx * 0.35, z: 1.3 });
        b.pop();
        b.push(sx * 0.54, 0.02, -0.5, sx > 0 ? 0 : Math.PI, 0, 0);
          rangingVane(b, st, { len: 1.5, chord: 1.0 });
        b.pop();
      }
      lampString(b, 'lights', LAMP, {
        ax: -0.5, ay: 0, az: 3.4, bx: 0.5, by: 0, bz: 3.4, count: 3, size: HUMAN.lampSize,
      });
    },
  },

  /**
   * CUTTER — inspection launch. A slim enforcement hull with a forward
   * docking/impound collar, a row of evidence lockers along the spine, and two
   * survey drones nested flush into the flanks.
   * Charter: size 9.57-11.88, target 11.0. Hull 6k-22k verts, lights >= 400.
   */
  cutter: {
    glowZ: 4.6,
    build(b, st) {
      hexSpine(b, st, { r: 0.72, from: -4.2, to: 5.0, ribGap: 1.5, seed: 121 });
      b.push(0, 0, -4.6, 0, 0, 0);
        surveyAperture(b, st, { r: 0.7, depth: 1.1 });
      b.pop();
      b.push(0, 0.72, -3.2, 0, 0, 0);
        moduleLatch(b, st, { s: 1 });
      b.pop();
      for (let i = 0; i < 4; i++) {
        b.push(0, 0.78, -1.4 + i * 1.5, 0, 0, 0);
          hexModule(b, st, { r: 0.3, len: 1.1, seed: 122 + i, windows: 1 });
        b.pop();
      }
      for (const sx of [1, -1]) {
        b.push(sx * 0.62, -0.1, 0.4, 0, 0, 0);
          sampleCanister(b, st, { r: 0.26, len: 1.8, seed: 126 });
        b.pop();
        b.push(sx * 0.62, 0.1, -2.2, sx > 0 ? 0 : Math.PI, 0, 0);
          rangingVane(b, st, { len: 1.4, chord: 1.2 });
        b.pop();
      }
      lampString(b, 'lights', LAMP, {
        ax: -0.64, ay: 0, az: 5.0, bx: 0.64, by: 0, bz: 5.0, count: 4, size: HUMAN.lampSize,
      });
    },
  },

  /**
   * HEAVY — claim-enforcement ship. A compact armoured core with recessed
   * weapons, redundant sensor facets and protected sample vaults. The prow is a
   * legal boundary made physical: blunt, exact, hard to push aside.
   * Charter: size 14.52-18.48, target 17.0. Hull 9k-34k verts, lights >= 600.
   */
  heavy: {
    glowZ: 7.2,
    build(b, st) {
      hexSpine(b, st, { r: 1.5, from: -6.6, to: 7.8, ribGap: 1.8, seed: 131 });
      b.push(0, 0, -7.4, 0, 0, 0);
        surveyAperture(b, st, { r: 1.45, depth: 1.6 });
      b.pop();
      for (const sx of [1, -1]) {
        b.push(sx * 1.3, 0.1, -1.0, sx > 0 ? 0 : Math.PI, 0, 0);
          instrumentFin(b, st, { len: 1.9, depth: 1.1 });
        b.pop();
      }
      b.push(0, 1.5, 1.4, 0, 0, 0);
        hexModule(b, st, { r: 0.85, len: 3.4, seed: 132, windows: 4 });
      b.pop();
      b.push(0, 2.2, -2.4, 0, 0, 0);
        moduleLatch(b, st, { s: 1.3 });
      b.pop();
      lampString(b, 'lights', LAMP, {
        ax: -1.3, ay: 0, az: 7.7, bx: 1.3, by: 0, bz: 7.7, count: 5, size: HUMAN.lampSize,
      });
    },
  },

  /**
   * FRIGATE — survey command frigate. Long and restrained: a central
   * registry/data citadel, distributed instrument fins, two small launch bays,
   * and armour concentrated around the archive and the bridge.
   * Charter: size 26.4-36.3, target 32.0. Hull 16k-60k verts, lights >= 1100.
   */
  frigate: {
    glowZ: 13.5,
    build(b, st) {
      hexSpine(b, st, { r: 2.1, from: -13.0, to: 15.0, ribGap: 2.2, seed: 141 });
      b.push(0, 0, -14.2, 0, 0, 0);
        surveyAperture(b, st, { r: 2.0, depth: 2.4 });
      b.pop();
      b.push(0, 2.1, -1.0, 0, 0, 0);
        hexModule(b, st, { r: 1.5, len: 7.0, seed: 142, windows: 8 });
      b.pop();
      for (const sx of [1, -1]) {
        for (let i = 0; i < 3; i++) {
          b.push(sx * 1.85, 0.1, -8.0 + i * 5.5, sx > 0 ? 0 : Math.PI, 0, 0);
            instrumentFin(b, st, { len: 2.4, depth: 1.3 });
          b.pop();
        }
        b.push(sx * 1.9, -0.5, 6.5, 0, 0, 0);
          sampleCanister(b, st, { r: 0.45, len: 3.6, seed: 143 });
        b.pop();
      }
      b.push(0, 3.5, 3.0, 0, 0, 0);
        moduleLatch(b, st, { s: 1.8 });
      b.pop();
      lampString(b, 'lights', LAMP, {
        ax: -1.9, ay: 0, az: 14.6, bx: 1.9, by: 0, bz: 14.6, count: 6, size: HUMAN.lampSize,
      });
    },
  },

  /**
   * FREIGHTER — extraction carrier. A gigantic open industrial spine carrying
   * ore silos, refinery drums and detachable claim modules, with tug docks and a
   * deliberately small forward control block so cargo volume dominates. It must
   * look designed to moor OUTSIDE a station and exchange whole modules.
   * Charter: size 66.0-92.4, target 78.0. Hull 34k-100k verts, lights >= 2400.
   */
  freighter: {
    glowZ: 33.0,
    build(b, st) {
      hexSpine(b, st, { r: 3.4, from: -34.0, to: 38.0, ribGap: 3.0, seed: 151 });
      b.push(0, 0, -36.0, 0, 0, 0);
        hexModule(b, st, { r: 2.6, len: 4.0, seed: 152, windows: 6 });
      b.pop();
      b.push(0, 0, -38.6, 0, 0, 0);
        surveyAperture(b, st, { r: 2.2, depth: 2.6 });
      b.pop();
      for (let i = 0; i < 6; i++) {
        const z = -24.0 + i * 9.5;
        for (const sx of [1, -1]) {
          b.push(sx * 7.6, 0, z, 0, 0, 0);
            cyl(b, 'hull', weather(st.hull, 1), 3.4, 3.4, 7.4, 12, { rx: Math.PI / 2 });
            ribBands(b, 'hull', st.trim, {
              r: 3.5, tube: 0.14, from: -3.2, to: 3.2, count: 4, axis: 'z', tseg: 12,
            });
          b.pop();
          truss(b, 'hull', st.trim, {
            ax: sx * 3.2, ay: 0, az: z, bx: sx * 4.6, by: 0, bz: z,
            thickness: 0.3, bays: 2, spread: 1.4,
          });
          b.push(sx * 7.6, 3.6, z, 0, 0, 0);
            moduleLatch(b, st, { s: 2.2 });
          b.pop();
        }
      }
      for (const sx of [1, -1]) {
        b.push(sx * 4.0, 3.4, 30.0, 0, 0, 0);
          tugDock(b, st, { w: 4.0, d: 3.4 });
        b.pop();
      }
      lampString(b, 'lights', LAMP, {
        ax: -3.2, ay: 0, az: 37.6, bx: 3.2, by: 0, bz: 37.6, count: 8, size: HUMAN.lampSize,
      });
    },
  },
};
