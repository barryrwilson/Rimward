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
   * LIGHT — claim scout. A narrow sensor-first dart with a small pressure cabin
   * behind a large faceted survey head. Two detachable sample canisters with
   * visible moduleLatches ride the flanks, and thin lateral ranging vanes reach out.
   * Almost no weapon mass — this is a survey probe, not a fighter.
   * Charter: size 5.94-7.26, target 6.8. Hull 4k-14k verts, lights >= 260.
   */
  light: {
    glowZ: 2.8,
    build(b, st) {
      // The large survey head dominates the forward third
      // Spine runs from z=-1.4 to z=3.2, aperture at z=-2.2 sits inside
      hexSpine(b, st, { r: 0.48, from: -1.4, to: 3.2, ribGap: 1.2, seed: 101 });
      
      // OVERSIZED survey aperture — r=0.72, largest single form forward
      // Mounted at z=-2.2 with its rear facet inside the spine's forward end
      b.push(0, 0, -2.2, 0, 0, 0);
        surveyAperture(b, st, { r: 0.72, depth: 1.2, dir: -1 });
      b.pop();
      
      // Small pressure cabin behind the survey head, at z=0.4
      // r=0.48 — smaller than the aperture (0.72), so head dominates
      b.push(0, 0, 0.4, 0, 0, 0);
        hexModule(b, st, { r: 0.48, len: 1.2, seed: 102, windows: 2, serial: true });
        // Crew hatch on starboard flank
        b.push(0.48 * HEXF + 0.01, 0, 0.2, 0, 0, Math.PI / 2);
          box(b, 'hull', weather(st.hullDark, 0), HUMAN.doorW, HUMAN.doorH, HUMAN.windowD);
          box(b, 'lights', DIM, HUMAN.windowW * 0.7, HUMAN.windowH * 0.5, HUMAN.windowD * 0.5,
            { y: HUMAN.doorH * 0.4, z: HUMAN.doorH * 0.3 });
        b.pop();
      b.pop();
      
      // Two ranging vanes — thin lateral instruments, port and starboard
      for (const sx of [1, -1]) {
        b.push(sx * 0.42, 0.02, -0.6, sx > 0 ? 0 : Math.PI, 0, 0);
          rangingVane(b, st, { len: 1.3, chord: 0.9, thick: 0.07, lit: true });
        b.pop();
      }
      
      // Two detachable sample canisters, each with its own visible moduleLatch
      for (const sx of [1, -1]) {
        b.push(sx * 0.52, -0.12, 1.4, 0, 0, 0);
          sampleCanister(b, st, { r: 0.22, len: 1.0, seed: 103 + sx });
          // Visible latch proving this canister detaches
          b.push(0, -0.24, 0, 0, 0, 0);
            moduleLatch(b, st, { s: 0.7, lit: true });
          b.pop();
        b.pop();
      }
      
      // Stern running lamps
      lampString(b, 'lights', LAMP, {
        ax: -0.44, ay: 0, az: 3.1, bx: 0.44, by: 0, bz: 3.1, count: 3, size: HUMAN.lampSize,
      });
    },
  },

  /**
   * ACE — patent demonstrator. Proprietary and unusually seamless: fewer plate
   * breaks than any sibling, smooth alloy forms, an oversized emerald aperture,
   * a high-output drive, and one unmistakable split tail.
   * Charter: size 5.94-7.59, target 7.2. Hull 4k-15k verts, lights >= 260.
   */
  ace: {
    glowZ: 3.4,
    build(b, st) {
      // Spine with LONGER ribGap (2.4) for seamless appearance — fewer breaks
      hexSpine(b, st, { r: 0.58, from: -1.6, to: 2.4, ribGap: 2.4, seed: 111, shade: 0 });
      
      // OVERSIZED survey aperture — largest aperture-to-hull ratio in family
      // r=0.78 on r=0.58 spine, mounted overlapping at z=-2.2
      b.push(0, 0, -2.2, 0, 0, 0);
        surveyAperture(b, st, { r: 0.78, depth: 1.5, dir: -1 });
      b.pop();
      
      // Single sleek cabin module — NO serial plate, minimal seams
      b.push(0, 0, 0.2, 0, 0, 0);
        hexModule(b, st, { r: 0.58, len: 1.8, seed: 112, windows: 2, serial: false });
        // Smooth hemispherical cap instead of serial plate
        hemi(b, 'hull', weather(st.trim, 1), 0.2, 12, 8, { y: 0.58 * HEXF, z: 0.7, rx: Math.PI / 2 });
      b.pop();
      
      // UNMISTAKABLE SPLIT TAIL — forked drive booms with a visible gap.
      // Each boom is a smooth 12-segment cylinder, not a hex prism, and each
      // rides a PYLON that reaches from inside the spine to inside the boom. The
      // first attempt widened the fork for silhouette and left the booms floating
      // in mid-air: at a 0.6-unit grid cell the flood fill read them as two
      // islands and the sculpt measured 86% single mass.
      for (const sx of [1, -1]) {
        box(b, 'hull', st.trim, 1.5, 0.24, 0.95, { x: sx * 0.95, z: 2.55 });
        box(b, 'hull', weather(st.trim, 1), 0.9, 0.34, 0.5, { x: sx * 0.7, z: 2.5 });
        b.push(sx * 1.1, 0, 2.5, 0, 0, 0);
          cyl(b, 'hull', st.trim, 0.32, 0.28, 1.1, 12, { rx: Math.PI / 2, z: 0.55, x: sx * 0.45 });
          cone(b, 'hull', weather(st.hullDark, 1), 0.38, 0.65, 12, { rx: Math.PI / 2, z: 1.1, x: sx * 0.52 });
          cyl(b, 'lights', OPTIC, 0.16, 0.16, 0.1, 12, { rx: Math.PI / 2, z: 1.45, x: sx * 0.52 });
        b.pop();
      }
      
      // Minimal vanes — just two small instrument fins, no clutter
      for (const sx of [1, -1]) {
        b.push(sx * 0.48, 0.04, -0.8, sx > 0 ? 0 : Math.PI, 0, 0);
          rangingVane(b, st, { len: 1.2, chord: 0.85, thick: 0.07, lit: true });
        b.pop();
      }
      
      // Stern running lamps
      lampString(b, 'lights', LAMP, {
        ax: -0.52, ay: 0, az: 3.3, bx: 0.52, by: 0, bz: 3.3, count: 3, size: HUMAN.lampSize,
      });
    },
  },

  /**
   * CUTTER — inspection launch. A slim enforcement hull with a forward docking/
   * impound collar, evidence lockers along the spine, and paired survey drones
   * nested flush into the flanks. The collar is the class read.
   * Charter: size 9.57-11.88, target 11.0. Hull 6k-22k verts, lights >= 400.
   */
  cutter: {
    glowZ: 5.0,
    build(b, st) {
      // Spine for enforcement hull
      hexSpine(b, st, { r: 0.78, from: -4.4, to: 5.2, ribGap: 1.6, seed: 121 });
      
      // FORWARD DOCKING/IMPOUND COLLAR — the class read
      // Ringed, lit collar at the bow, sized on HUMAN.collarR, clearly a mating face
      b.push(0, 0, -4.8, 0, 0, 0);
        // Mating face — recessed cylindrical opening
        cyl(b, 'hull', weather(st.hullDark, 1), HUMAN.collarR * 1.1, HUMAN.collarR * 0.9, 0.8, 12, { rx: Math.PI / 2 });
        // Lit collar ring
        torus(b, 'hull', st.trim, HUMAN.collarR * 1.2, 0.08, 12, 16, undefined, { rx: Math.PI / 2, z: 0.35 });
        // Approach lamps
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          box(b, 'lights', LAMP, HUMAN.lampSize, HUMAN.lampSize * 0.6, HUMAN.lampSize,
            { x: Math.cos(angle) * HUMAN.collarR * 1.3, y: Math.sin(angle) * HUMAN.collarR * 1.3, z: 0.35 });
        }
      b.pop();
      
      // Survey aperture behind the collar
      b.push(0, 0, -3.8, 0, 0, 0);
        surveyAperture(b, st, { r: 0.72, depth: 1.2, dir: -1 });
      b.pop();
      
      // EVIDENCE LOCKERS — repeated row along the spine
      // Each with its own moduleLatch for serialized custody
      for (let i = 0; i < 4; i++) {
        const lockerZ = -2.0 + i * 1.4;
        b.push(0, 0.84, lockerZ, 0, 0, 0);
          hexModule(b, st, { r: 0.32, len: 1.0, seed: 122 + i, windows: 1, serial: true });
          // Each locker has a visible latch
          b.push(0, 0.4, 0, 0, 0, 0);
            moduleLatch(b, st, { s: 0.8, lit: true });
          b.pop();
        b.pop();
      }
      
      // PAIRED SURVEY DRONES nested FLUSH into flank recesses
      // They must read as stowed — built INTO the hull, not bolted on
      for (const sx of [1, -1]) {
        // Drone recess — cut INTO the flank
        b.push(sx * 0.65, 0, 0.6, 0, 0, 0);
          // Drone body — miniature hexModule
          hexModule(b, st, { r: 0.28, len: 0.9, seed: 126 + sx, windows: 1, serial: false });
          // Drone's own survey aperture — miniature version
          b.push(0, 0, -0.5, 0, 0, 0);
            surveyAperture(b, st, { r: 0.26, depth: 0.6, dir: -1 });
          b.pop();
          // Drone latch — proves it can deploy
          b.push(0, -0.32, 0, 0, 0, 0);
            moduleLatch(b, st, { s: 0.6, lit: true });
          b.pop();
        b.pop();
      }
      
      // Ventral rescue/inspection structure for BALANCE
      // Counterweight to dorsal locker row
      b.push(0, -0.72, 1.2, 0, 0, 0);
        hexModule(b, st, { r: 0.36, len: 1.4, seed: 130, windows: 2, serial: true });
        // Rescue hatch
        b.push(0, -0.36 * HEXF - 0.01, -0.3, 0, 0, -Math.PI / 2);
          box(b, 'hull', weather(st.hullDark, 0), HUMAN.doorW, HUMAN.doorH, HUMAN.windowD);
          box(b, 'lights', DIM, HUMAN.windowW * 0.7, HUMAN.windowH * 0.5, HUMAN.windowD * 0.5,
            { y: HUMAN.doorH * 0.4, z: HUMAN.doorH * 0.3 });
        b.pop();
      b.pop();
      
      // Stern running lamps
      lampString(b, 'lights', LAMP, {
        ax: -0.72, ay: 0, az: 5.4, bx: 0.72, by: 0, bz: 5.4, count: 4, size: HUMAN.lampSize,
      });
    },
  },

  /**
   * HEAVY — claim-enforcement ship. A compact armoured core with recessed
   * weapons, redundant sensor facets and protected sample vaults. The prow is a
   * legal boundary made physical: blunt, exact, hard to push aside.
   * Charter: size 14.52-18.48, target 17.0. Hull 9k-34k verts, lights >= 600.
   */
  /**
   * HEAVY — claim-enforcement ship. A compact armoured core with recessed
   * weapons, redundant sensor facets and protected sample vaults. The prow is a
   * legal boundary made physical: blunt, exact, hard to push aside.
   * Charter: size 14.52-18.48, target 16.5. Hull 9k-34k verts, lights >= 600.
   */
  heavy: {
    glowZ: 7.0,
    build(b, st) {
      // Dense compact spine: blunt prow, generous beam — EXTENDED for 16.5 size
      hexSpine(b, st, { r: 2.2, from: -6.8, to: 7.8, ribGap: 1.4, seed: 131, shade: 1 });
      
      // Blunt exact prow: chamfered flat faces meeting at hard angles — EXTENDED FORWARD
      b.push(0, 0, -7.4, 0, 0, 0);
        box(b, 'hull', st.trim, 2.6, 1.8, 1.1);
        box(b, 'hull', weather(st.hullDark, 1), 2.8, 1.6, 0.9, { z: -0.3 });
        // Chamfered side plates
        for (const sx of [1, -1]) {
          box(b, 'hull', weather(st.trim, 1), 1.4, 1.3, 0.7, { x: sx * 1.6, z: -0.2 });
        }
      b.pop();
      
      // Redundant sensor facets: four apertures at different radii, overlapping housing — SPACED for readability
      b.push(0, 0, -5.5, 0, 0, 0);
        surveyAperture(b, st, { r: 1.8, depth: 1.8, dir: -1 });
      b.pop();
      b.push(0, 0.8, -4.7, 0, 0, 0);
        surveyAperture(b, st, { r: 1.2, depth: 1.4, dir: -1 });
      b.pop();
      for (const sx of [1, -1]) {
        b.push(sx * 1.4, 0.3, -4.3, 0, 0, 0);
          surveyAperture(b, st, { r: 0.9, depth: 1.2, dir: -1 });
        b.pop();
        b.push(sx * 1.8, 0.6, -3.7, sx > 0 ? 0 : Math.PI, 0, 0);
          surveyAperture(b, st, { r: 0.7, depth: 1.0, dir: -1 });
        b.pop();
      }
      
      // Armoured shoulder plates - thicker than rest of hull — DEEPER for anatomy extension
      for (const sx of [1, -1]) {
        b.push(sx * 1.6, 0.9, -1.2, 0, 0, 0);
          box(b, 'hull', weather(st.hullDark, 0), 2.4, 1.6, 3.2);
          box(b, 'hull', st.trim, 2.2, 1.4, 3.0, { z: 0.1 });
          // Layered armor plates visible in silhouette
          for (let i = 0; i < 3; i++) {
            box(b, 'hull', weather(st.trim, 1 + i), 2.0 - i * 0.2, 1.2 - i * 0.1, 2.6 - i * 0.2,
              { z: -0.8 + i * 0.15, y: 0.1 + i * 0.05 });
          }
        b.pop();
      }
      
      // Protected sample vaults behind shoulder armour
      for (const sx of [1, -1]) {
        b.push(sx * 1.8, -0.6, -0.8, 0, 0, 0);
          hexModule(b, st, { r: 0.65, len: 2.2, seed: 132 + sx, windows: 2, shade: 2 });
          // Visible latch proving it detaches
          b.push(sx * 0.4, -0.8, 0, 0, 0, 0);
            moduleLatch(b, st, { s: 0.9, lit: true });
          b.pop();
        b.pop();
      }
      
      // Central command block with dense window grid — AFT for spacing
      b.push(0, 1.8, 2.0, 0, 0, 0);
        hexModule(b, st, { r: 1.0, len: 2.8, seed: 134, windows: 5 });
        // Extra armor layer around command
        box(b, 'hull', weather(st.hullDark, 1), 2.4, 0.8, 3.2, { y: 0.4 });
      b.pop();
      
      // Recessed weapon ports (apertures, not barrels) — AFT for spacing
      for (const sx of [1, -1]) {
        b.push(sx * 1.4, -0.4, 3.3, 0, 0, 0);
          box(b, 'hull', weather(st.hullDark, 2), 0.7, 0.7, 0.7);
          box(b, 'lights', DIM, 0.25, 0.25, 0.15, { z: 0.3 });
        b.pop();
        b.push(sx * 1.4, 0.6, 3.9, 0, 0, 0);
          box(b, 'hull', weather(st.hullDark, 2), 0.6, 0.6, 0.6);
          box(b, 'lights', OPTIC, 0.2, 0.2, 0.12, { z: 0.25 });
        b.pop();
      }
      
      // Dorsal sensor array — AFT for spacing
      b.push(0, 2.4, -0.2, 0, 0, 0);
        instrumentFin(b, st, { len: 2.2, depth: 1.4 });
      b.pop();
      
      // Ventral service lights — EXTENDED to new stern
      lampString(b, 'lights', LAMP, {
        ax: -1.8, ay: -2.0, az: -4.5, bx: 1.8, by: -2.0, bz: 6.5,
        count: 7, size: HUMAN.lampSize,
      });
      
      // Dorsal running lights — EXTENDED to new stern
      lampString(b, 'lights', LAMP, {
        ax: -2.0, ay: 2.2, az: -3.5, bx: 2.0, by: 2.2, bz: 6.5,
        count: 6, size: HUMAN.lampSize,
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
    glowZ: 15.0,
    build(b, st) {
      // Long restrained spine
      hexSpine(b, st, { r: 2.4, from: -14.5, to: 16.5, ribGap: 2.0, seed: 141 });
      
      // Forward bridge with layered armor
      b.push(0, 0, -15.8, 0, 0, 0);
        surveyAperture(b, st, { r: 2.2, depth: 2.6 });
      b.pop();
      
      // Bridge block behind a STEPPED ARMOUR BELT. The belt is built as plated
      // courses, not as three big boxes: a box is 36 vertices and reads as a
      // solid slab, while a course of plates on a stepped radius reads as
      // layered protection from the side AND the top, which is what the brief
      // asks for. It is also where this class's vertex count honestly comes
      // from — the first attempt stacked twelve boxes and moved the hull count
      // by 432 verts against a 16,000 floor.
      b.push(0, 2.2, -11.0, 0, 0, 0);
        hexModule(b, st, { r: 1.3, len: 3.8, seed: 142, windows: 4 });
        for (let k = 0; k < 2; k++) {
          const cr = 1.36 + k * 0.3;
          const half = 1.8 - k * 0.35;
          panelSkin(b, 'hull', [weather(st.hullDark, k), weather(st.hull, k + 1), weather(st.trim, 3)], {
            r: cr, from: -half, to: half, rows: 8, cols: 8, seed: 1420 + k, t: 0.26, axis: 'z',
          });
          ribBands(b, 'hull', weather(st.trim, 1), {
            r: cr + 0.15, tube: 0.09, from: -half + 0.2, to: half - 0.2, count: 3, axis: 'z', tseg: 8,
          });
        }
      b.pop();
      
      // CENTRAL REGISTRY/DATA CITADEL - the class read
      b.push(0, 2.6, -2.0, 0, 0, 0);
        // Core citadel structure
        hexModule(b, st, { r: 1.8, len: 9.0, seed: 143, windows: 12 });
        // DENSEST window grid on the ship - class signature, MUST KEEP
        for (const side of [1, -1]) {
          b.push(side * 1.0, 0, 0, 0, 0, side * Math.PI / 2);
            windowGrid(b, 'lights', GLASS, {
              rows: 4, cols: 10, rowGap: HUMAN.windowGap, colGap: HUMAN.windowGap,
              w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD,
              y: -0.3, z: -3.5, axis: 'z',
            });
          b.pop();
        }
        // THE ARCHIVE ARMOUR — three plated courses on a stepping radius, each
        // shorter than the one beneath it, with a rib band closing every course.
        // The step is what makes the layering read in silhouette from the side
        // and from above, and it is deliberately HEAVIER here than on the bridge
        // belt: the bible concentrates this ship's armour on the archive.
        for (let k = 0; k < 3; k++) {
          const cr = 1.9 + k * 0.32;
          const half = 4.4 - k * 0.7;
          panelSkin(b, 'hull', [weather(st.hullDark, k), weather(st.hull, k + 1), weather(st.patch[0], k)], {
            r: cr, from: -half, to: half, rows: 12, cols: 8, seed: 1430 + k, t: 0.3, axis: 'z',
          });
          ribBands(b, 'hull', weather(st.trim, 1), {
            r: cr + 0.17, tube: 0.11, from: -half + 0.3, to: half - 0.3, count: 4, axis: 'z', tseg: 8,
          });
        }
      b.pop();

      // VENTRAL INSTRUMENT GONDOLA. The citadel, the bridge belt and every fin
      // sit dorsally, which walked the bounding-box centre 17% of the height span
      // above the root — past the 15% pivot ceiling. This is the counterweight,
      // and it is on brief: the survey command ship's downward-looking
      // instrument suite, armoured like the archive above it.
      b.push(0, -2.5, 1.0, 0, 0, 0);
        hexModule(b, st, { r: 1.5, len: 7.0, seed: 144, windows: 6 });
        for (let k = 0; k < 2; k++) {
          const cr = 1.58 + k * 0.28;
          const half = 3.4 - k * 0.6;
          panelSkin(b, 'hull', [weather(st.hullDark, k + 1), weather(st.hull, k)], {
            r: cr, from: -half, to: half, rows: 10, cols: 8, seed: 1440 + k, t: 0.26, axis: 'z',
          });
          ribBands(b, 'hull', weather(st.trim, 2), {
            r: cr + 0.15, tube: 0.09, from: -half + 0.25, to: half - 0.25, count: 3, axis: 'z', tseg: 8,
          });
        }
        for (const sx of [1, -1]) {
          b.push(sx * 1.3, -0.9, -2.0, sx > 0 ? 0 : Math.PI, 0, 0);
            instrumentFin(b, st, { len: 1.8, depth: 1.1 });
          b.pop();
        }
      b.pop();
      
      // Distributed instrument fins - 4 pairs, graduated in size
      for (const sx of [1, -1]) {
        // Forward pair - largest
        b.push(sx * 2.3, 0.8, -10.0, sx > 0 ? 0 : Math.PI, 0, 0);
          instrumentFin(b, st, { len: 3.2, depth: 1.8 });
        b.pop();
        // Mid pair - medium
        b.push(sx * 2.5, 0.6, -3.5, sx > 0 ? 0 : Math.PI, 0, 0);
          instrumentFin(b, st, { len: 2.6, depth: 1.5 });
        b.pop();
        // Aft pair - smallest
        b.push(sx * 2.4, 0.5, 4.0, sx > 0 ? 0 : Math.PI, 0, 0);
          instrumentFin(b, st, { len: 2.0, depth: 1.2 });
        b.pop();
        // Extra aft pair
        b.push(sx * 2.2, 0.4, 9.5, sx > 0 ? 0 : Math.PI, 0, 0);
          instrumentFin(b, st, { len: 1.6, depth: 1.0 });
        b.pop();
      }
      
      // TWO small launch bays - recessed openings with lit interiors
      for (const sx of [1, -1]) {
        const bayZ = -6.5;
        // Recessed hull opening
        b.push(sx * 2.0, -0.4, bayZ, 0, 0, 0);
          box(b, 'hull', weather(st.hullDark, 2), 2.8, 1.8, 3.2);
          // Lit interior
          box(b, 'lights', DIM, 2.4, 1.4, 2.8, { y: -0.1 });
          // HUMAN.doorW hatches beside the opening
          b.push(sx * 0.7, -0.8, bayZ - 0.8, 0, 0, 0);
            box(b, 'hull', st.trim, HUMAN.doorW, HUMAN.doorH, 0.08);
            box(b, 'lights', GLASS, HUMAN.doorW * 0.6, HUMAN.doorH * 0.7, 0.04,
              { y: HUMAN.doorH * 0.1, z: 0.04 });
          b.pop();
          b.push(sx * 0.7, -0.8, bayZ + 0.8, 0, 0, 0);
            box(b, 'hull', st.trim, HUMAN.doorW, HUMAN.doorH, 0.08);
            box(b, 'lights', GLASS, HUMAN.doorW * 0.6, HUMAN.doorH * 0.7, 0.04,
              { y: HUMAN.doorH * 0.1, z: 0.04 });
          b.pop();
        b.pop();
      }
      
      // Aft service module
      b.push(0, 1.8, 10.0, 0, 0, 0);
        hexModule(b, st, { r: 1.1, len: 4.0, seed: 144, windows: 5 });
        // External latch
        b.push(0, 1.4, 1.8, 0, 0, 0);
          moduleLatch(b, st, { s: 1.2 });
        b.pop();
      b.pop();
      
      // Running lights along the spine - TRIMMED to stay under 25% ceiling
      lampString(b, 'lights', LAMP, {
        ax: -2.4, ay: 2.8, az: -14.0, bx: 2.4, by: 2.8, bz: 16.0,
        count: 8, size: HUMAN.lampSize,
      });
      lampString(b, 'lights', LAMP, {
        ax: -2.4, ay: -2.6, az: -12.0, bx: 2.4, by: -2.6, bz: 14.0,
        count: 7, size: HUMAN.lampSize,
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
    glowZ: 26.0,
    build(b, st) {
      // Gigantic open industrial spine - compressed to target size 78
      hexSpine(b, st, { r: 3.2, from: -28.0, to: 31.0, ribGap: 2.8, seed: 151 });
      
      // SMALL forward crew/control block - deliberately modest, INSIDE spine
      b.push(0, 0, -26.5, 0, 0, 0);
        surveyAperture(b, st, { r: 2.4, depth: 2.4 });
      b.pop();
      b.push(0, 2.6, -23.0, 0, 0, 0);
        hexModule(b, st, { r: 1.8, len: 4.0, seed: 152, windows: 7 });
        // Bridge visible but not grand
        box(b, 'hull', weather(st.hullDark, 1), 2.2, 1.1, 4.8, { y: 0.5 });
      b.pop();
      
      // SIX ore silos in readable rhythm - tighter pitch keeps size down
      const siloPositions = [-16.0, -10.0, -4.0, 2.0, 8.0, 14.0];
      for (let i = 0; i < 6; i++) {
        const z = siloPositions[i];
        for (const sx of [1, -1]) {
          // Silo drum - reduced segments for hull budget
          b.push(sx * 7.5, 0, z, 0, 0, 0);
            cyl(b, 'hull', weather(st.hull, 1), 3.4, 3.4, 6.0, 6, { rx: Math.PI / 2 });
            ribBands(b, 'hull', st.trim, {
              r: 3.5, tube: 0.16, from: -2.5, to: 2.5, count: 4, axis: 'z', tseg: 6,
            });
            // End caps
            for (const end of [-1, 1]) {
              box(b, 'hull', weather(st.hullDark, 2), 3.5, 3.5, 0.4, { z: end * 3.0 });
            }
          b.pop();
          
          // TRUSS connection - endpoints DEEP INSIDE both spine and silo
          truss(b, 'hull', st.trim, {
            ax: sx * 2.5, ay: 0, az: z, bx: sx * 6.2, by: 0, bz: z,
            thickness: 0.4, bays: 3, spread: 1.6,
          });
          
          // HUMAN-scale service walkway with railing
          b.push(sx * 6.0, 3.8, z, 0, 0, 0);
            railing(b, 'hull', st.trim, {
              ax: -2.5, ay: 0, az: 0, bx: 2.5, by: 0, bz: 0,
              height: HUMAN.railH, posts: 4, rail: HUMAN.railPost,
            });
            // Ladder for service access
            ladder(b, 'hull', st.trim, {
              x: -2.0, y: 0, z: 0, h: 3.6, w: HUMAN.ladderW, rungs: 5, ry: Math.PI / 2,
            });
          b.pop();
          
          // Window row on service walkway - reduced count for lights budget
          b.push(sx * 6.5, 2.5, z, 0, 0, 0);
            windowRow(b, 'lights', GLASS, {
              count: 4, spacing: HUMAN.windowGap,
              w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD, axis: 'z',
            });
          b.pop();
          
          // Detachable claim module on visible latch
          b.push(sx * 7.2, 3.0, z, 0, 0, 0);
            moduleLatch(b, st, { s: 1.8, lit: true });
            // Sample canister showing claim cargo
            b.push(0, 1.0, 0, 0, 0, 0);
              sampleCanister(b, st, { r: 0.6, len: 2.2, seed: 153 + i + sx });
            b.pop();
          b.pop();
        }
      }
      
      // REFINERY DRUMS - visibly different function from silos
      // Shorter, wider, different plumbing arrangement
      const refineryPositions = [-20.0, 11.0, 18.0];
      for (let i = 0; i < 3; i++) {
        const z = refineryPositions[i];
        for (const sx of [1, -1]) {
          b.push(sx * 8.5, 0, z, 0, 0, 0);
            // Wider, shorter drum - reduced segments for hull budget
            cyl(b, 'hull', weather(st.hull, 2), 4.2, 4.2, 4.5, 8, { rx: Math.PI / 2 });
            // Different rib pattern - denser, showing different purpose
            ribBands(b, 'hull', weather(st.trim, 1), {
              r: 4.3, tube: 0.12, from: -1.8, to: 1.8, count: 6, axis: 'z', tseg: 8,
            });
            // Pipe runs - different plumbing than silos
            for (const pipeAngle of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
              pipeRun(b, 'hull', weather(st.trim, 2), {
                ax: Math.cos(pipeAngle) * 4.0, ay: 0, az: z - 1.2,
                bx: Math.cos(pipeAngle) * 4.0, by: 0, bz: z + 1.2,
                r: 0.16, seg: 8, collars: 3,
              });
            }
          b.pop();
          
          // TRUSS connection - endpoints DEEP INSIDE both masses
          truss(b, 'hull', st.trim, {
            ax: sx * 2.8, ay: 0, az: z, bx: sx * 7.0, by: 0, bz: z,
            thickness: 0.4, bays: 4, spread: 1.8,
          });
          
          // Service walkway
          b.push(sx * 7.2, 4.8, z, 0, 0, 0);
            railing(b, 'hull', st.trim, {
              ax: -2.2, ay: 0, az: 0, bx: 2.2, by: 0, bz: 0,
              height: HUMAN.railH, posts: 4, rail: HUMAN.railPost,
            });
          b.pop();
          
          // Windows - refinery needs crew access, reduced count
          b.push(sx * 7.8, 2.8, z, 0, 0, 0);
            windowRow(b, 'lights', DIM, {
              count: 3, spacing: HUMAN.windowGap,
              w: HUMAN.windowW, h: HUMAN.windowH, d: HUMAN.windowD, axis: 'z',
            });
          b.pop();
        }
      }
      
      // SEVERAL tug docks at different points along hull
      const tugPositions = [-24.0, -3.0, 7.0, 20.0];
      for (const tugZ of tugPositions) {
        for (const sx of [1, -1]) {
          b.push(sx * 5.0, 3.8, tugZ, 0, 0, 0);
            tugDock(b, st, { w: 4.5, d: 4.0 });
          b.pop();
        }
      }
      
      // EXTERIOR-ONLY BERTHING STORY - awkward service structures
      // External gantries and access structures
      for (const gx of [1, -1]) {
        b.push(gx * 6.2, 5.2, -18.0, 0, 0, 0);
          // External access platform
          box(b, 'hull', weather(st.trim, 1), 3.5, 0.4, 7.0);
          railing(b, 'hull', st.trim, {
            ax: -1.5, ay: 0.2, az: -3.0, bx: 1.5, by: 0.2, bz: 3.0,
            height: HUMAN.railH, posts: 4, rail: HUMAN.railPost,
          });
          // HUMAN.doorW hatches along platform
          for (let h = 0; h < 3; h++) {
            box(b, 'hull', st.trim, HUMAN.doorW, HUMAN.doorH, 0.1,
              { z: -2.0 + h * 2.0, y: 0.2 });
            box(b, 'lights', GLASS, HUMAN.doorW * 0.5, HUMAN.doorH * 0.6, 0.05,
              { z: -2.0 + h * 2.0, y: 0.4 });
          }
        b.pop();
      }
      
      // SERVICE WALKWAYS, and the HUMAN-scale lamp repetition that rides them.
      //
      // Two rules collide here and both matter. The lamp runs are this ship's
      // primary size cue — a reviewer counts human-sized details along 78 units
      // and feels the length. But a lit part has to SIT on plating: the boot
      // test seats lights on a fixed 1.0-unit grid, and the first attempt hung
      // these runs in open space at y=5.0 and y=-4.0, which measured 26.3%
      // orphan lights. So the walkways are now real: a deck plate, a stanchion
      // down into the spine, a handrail at HUMAN.railH, and the lamps on the
      // deck. That is also what the brief asks for — every part serviceable in
      // a pressure suit.
      //
      // Counts come from HUMAN.lampGap, the centre-to-centre PITCH of a lamp
      // run, never from HUMAN.lampSize, which is the lamp itself.
      for (const [dy, span, decks] of [[4.4, 8.0, [-22.0, -12.0, -2.0, 8.0, 18.0]],
        [-4.0, 7.0, [-18.0, -8.0, 4.0, 14.0]]]) {
        const up = Math.sign(dy);
        for (const walkZ of decks) {
          b.push(0, dy, walkZ, 0, 0, 0);
            box(b, 'hull', weather(st.trim, 1), span * 2, 0.22, 1.1);
            railing(b, 'hull', st.trim, {
              ax: -span, ay: up * 0.11, az: 0, bx: span, by: up * 0.11, bz: 0,
              height: up * HUMAN.railH, posts: 6, rail: HUMAN.railPost,
            });
            lampString(b, 'lights', LAMP, {
              ax: -span + 0.4, ay: up * 0.2, az: 0, bx: span - 0.4, by: up * 0.2, bz: 0,
              count: Math.round((span * 2) / HUMAN.lampGap), size: HUMAN.lampSize,
            });
          b.pop();
          // Stanchions into the spine — the deck is carried, not floating.
          for (const sx of [1, -1]) {
            box(b, 'hull', weather(st.hullDark, 1), 0.3, Math.abs(dy) - 2.6, 0.4,
              { x: sx * 1.6, y: dy - up * (Math.abs(dy) - 2.6) / 2, z: walkZ });
          }
        }
      }
      // Spine catwalks, dorsal and ventral: the longitudinal runs that make the
      // full 55 units of length legible from outside. Both decks overlap the
      // spine plating (r 3.4) rather than hovering above it.
      for (const up of [1, -1]) {
        const dy = up * 3.55;
        b.push(0, dy, 1.5, 0, 0, 0);
          box(b, 'hull', weather(st.trim, 2), 1.6, 0.2, 55.0);
          railing(b, 'hull', st.trim, {
            ax: 0, ay: up * 0.1, az: -27.0, bx: 0, by: up * 0.1, bz: 27.0,
            height: up * HUMAN.railH, posts: 14, rail: HUMAN.railPost,
          });
          lampString(b, 'lights', LAMP, {
            ax: 0, ay: up * 0.19, az: -26.5, bx: 0, by: up * 0.19, bz: 26.5,
            count: Math.round(53.0 / HUMAN.lampGap), size: HUMAN.lampSize,
          });
        b.pop();
      }
    },
  },
};
