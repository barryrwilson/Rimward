/**
 * Veridian Combine — the detail motif library.
 *
 * Brief: docs/FactionShipDesignBible.md §4.1. Charter: src/game/ship-scale.js.
 *
 * These are the faction's SURFACE and EQUIPMENT language: the serialized
 * pressure module, the survey aperture, the module latch, the ranging vane, the
 * instrument fin, the sample canister, the tug dock, the drive section. They
 * decorate a body; they do NOT make one. Body plans come from
 * ./body.js — see the note at the top of that file for why the two are
 * separate now.
 *
 * Every motif places geometry in the CURRENT builder frame, so a caller wraps
 * it in `b.push(x, y, z, ry, rx, rz)` / `b.pop()` to position it. No motif
 * leaves a frame open.
 */

import {
  rng, weather, box, cyl, torus, ribBands, windowRow, panelSkin,
  pipeRun, railing, radiatorPanel, lampString,
} from '../../station-detail.js';
import { HUMAN } from '../../../game/ship-scale.js';
import { loftHull, loftPlating, loftRib } from './body.js';

// Lights channel near-whites. The additive material's colour is the faction's
// emerald and multiplies these, so they stay near-neutral.
export const LAMP = 0xffffff;  // running / work lamp
export const GLASS = 0xfff2d8; // warm cabin glass
export const OPTIC = 0xe8f0ff; // cool instrument optic
export const DIM = 0xe8dcc8;   // dimmed interior

/** Hex flat-face distance as a fraction of the prism radius. */
export const HEXF = Math.cos(Math.PI / 6);

/**
 * Serialized hexagonal pressure module, centred on the current frame: the
 * Combine's replaceable unit. End collars, a plated skin, a serial plate on the
 * starboard flat face, and optionally a HUMAN window row on both flanks. It has
 * to read as an interchangeable part even with no legible text on it.
 */
export function hexModule(b, st, { r, len, seed = 1, shade = 0, windows = 0, serial = true }) {
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
 * A survey instrument, not a fin: graduation ribs, a stiffening root, one optic
 * strip. Always mounted as a port/starboard pair.
 *
 * THE ROOT REACHES INWARD. The blade used to start at x = 0, so a caller placing
 * the frame on the hull's flat flank got a butt joint against the plating — the
 * fine-grid contact test called that connected and the render showed daylight
 * between the vane and the hull on the claim scout. The blade now starts at
 * `-root` and carries a shoulder fairing straddling x = 0, so the vane is
 * visibly BOLTED THROUGH the flank instead of resting against it.
 */
export function rangingVane(b, st, { len, chord, thick = 0.07, ry = 0, lit = true, root = 0.5 }) {
  b.push(0, 0, 0, ry, 0, 0);
    // Blade, spanning from inside the hull out to full span.
    box(b, 'hull', st.trim, len + root, thick, chord, { x: (len - root) / 2 });
    // Shoulder fairing: a thicker, deeper block straddling the skin line, which
    // is what makes the joint read as structure rather than as a seam.
    box(b, 'hull', weather(st.trim, 1), root * 1.9, thick * 3.2, chord * 0.9, { x: root * 0.1 });
    box(b, 'hull', weather(st.hullDark, 1), root * 1.2, thick * 4.0, chord * 0.55, { x: -root * 0.25 });
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
export function sampleCanister(b, st, { r, len, seed = 1 }) {
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
 * THE SHANK IS NOT DECORATION. Every part of the housing used to sit forward of
 * the frame origin, so a caller placing the frame on the hull's front face got a
 * tangent contact at best — and the occupancy grid happily called that connected
 * while the render showed the whole instrument floating off the nose on three
 * classes. The shank reaches BACKWARD, opposite `dir`, by 0.55 of the depth, so
 * the aperture is bolted through whatever it is mounted on instead of resting
 * against it. scripts/attach-audit.mjs is what catches the difference.
 */
export function surveyAperture(b, st, { r, depth, dir = -1, face: withFace = true }) {
  const shank = depth * 0.55;
  cyl(b, 'hull', weather(st.hull, 1), r * 0.72, r * 0.82, shank, 6,
    { rx: Math.PI / 2, z: -dir * shank * 0.5 });
  ribBands(b, 'hull', weather(st.trim, 2), {
    r: r * 0.86, tube: Math.max(0.03, r * 0.06),
    from: -dir * shank * 0.2, to: -dir * shank * 0.8, count: 2, axis: 'z', tseg: 6,
  });
  cyl(b, 'hull', st.trim, r * 0.88, r, depth * 0.5, 6, { rx: Math.PI / 2, z: dir * depth * 0.25 });
  cyl(b, 'hull', weather(st.hull, 1), r, r * 0.66, depth * 0.42, 6,
    { rx: Math.PI / 2, z: dir * depth * 0.7 });
  ribBands(b, 'hull', weather(st.trim, 1), {
    r: r * 0.96, tube: Math.max(0.03, r * 0.07),
    from: dir * depth * 0.08, to: dir * depth * 0.44, count: 2, axis: 'z', tseg: 6,
  });

  // A drone's stowed aperture is a fraction of a unit across; its bezel, bosses
  // and cabling would cost ~2,700 vertices each and be invisible. `face: false`
  // is for those. Detail belongs where it can be read.
  if (!withFace) {
    cyl(b, 'lights', OPTIC, r * 0.4, r * 0.4, depth * 0.06, 8,
      { rx: Math.PI / 2, z: dir * depth * 0.84 });
    return;
  }

  // THE FACE IS EQUIPMENT, NOT A LIT DISC.
  //
  // This used to end in one hexagonal emissive plate filling 52% of the housing
  // radius, and at any distance it read as a flat green face stuck on the front
  // of a pipe — the first thing a reviewer said about this fleet. An instrument
  // this faction treats as valuable has a bezel, a sunk iris, radial mounting
  // bosses, a calibration target and cabling. The lit element is now a SMALL
  // pupil at 0.24 of the radius, deep inside the bezel, so the light reads as
  // coming out of a machine rather than being painted on one.
  const face = dir * depth * 0.84;
  cyl(b, 'hull', weather(st.trim, 0), r * 0.68, r * 0.62, depth * 0.14, 12,
    { rx: Math.PI / 2, z: face });                                    // bezel
  cyl(b, 'hull', weather(st.hullDark, 1), r * 0.5, r * 0.5, depth * 0.2, 12,
    { rx: Math.PI / 2, z: face + dir * depth * 0.02 });               // sunk iris well
  torus(b, 'hull', weather(st.trim, 1), r * 0.58, Math.max(0.025, r * 0.05), 6, 14, undefined,
    { z: face - dir * depth * 0.06 });                                // retaining ring
  // Radial mounting bosses and their bolts — six, on the hex facet centres.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const bx = Math.cos(a) * r * 0.78;
    const by = Math.sin(a) * r * 0.78;
    box(b, 'hull', weather(st.hull, 0), r * 0.2, r * 0.2, depth * 0.12,
      { x: bx, y: by, z: face - dir * depth * 0.03 });
    cyl(b, 'hull', weather(st.trim, 2), r * 0.055, r * 0.055, depth * 0.1, 6,
      { rx: Math.PI / 2, x: bx, y: by, z: face + dir * depth * 0.03 });
  }
  // Calibration target: an off-centre stepped block. Asymmetry of function, not
  // of construction — it gives the eye something to read the face's roll against.
  box(b, 'hull', weather(st.hullDark, 0), r * 0.26, r * 0.1, depth * 0.16,
    { x: r * 0.34, y: -r * 0.34, z: face + dir * depth * 0.04 });
  // Signal cabling from the bezel back down the shank.
  for (const sx of [1, -1]) {
    pipeRun(b, 'hull', weather(st.trim, 2), {
      ax: sx * r * 0.66, ay: r * 0.2, az: face - dir * depth * 0.1,
      bx: sx * r * 0.5, by: r * 0.2, bz: -dir * shank * 0.6,
      r: Math.max(0.02, r * 0.04), seg: 6, collars: 2,
    });
  }
  cyl(b, 'lights', OPTIC, r * 0.24, r * 0.24, depth * 0.05, 10,
    { rx: Math.PI / 2, z: face + dir * depth * 0.08 });
}

/**
 * Drive section closing the aft end of a hull, occupying z from `-len` to 0 in
 * the current frame and terminating in `throats` recessed thrust throats.
 *
 * WHY THIS MOTIF EXISTS. Wave 49's frigate, gunship and carrier all ended in
 * bare spine wearing rib hoops: the hull simply stopped and trailed off into a
 * cage of rings. A ship's back end needs MASS and FUNCTION, not a dressed cap —
 * a stepped armoured housing wider than the hull, radiator panels shedding
 * drive heat, service plumbing, and thrust throats recessed into their mounts
 * with the light deep inside them.
 *
 * THE SECTION FOLLOWS THE BODY. `w` and `h` are the stern's half-extents and
 * default to a square `r`; a lofted class passes its own aft station so the
 * drive grows out of the hull's cross-section instead of clamping a hex barrel
 * onto a rectangular blade. `c` is the chamfer, matching the hull's.
 */
export function driveSection(b, st, { r, len, throats = 4, seed = 1, w = r, h = r, c = 0.3 }) {
  const hw = w * 1.14; // the drive is the widest thing aft, on both axes
  const hh = h * 1.14;
  const plates = [weather(st.hull, 1), weather(st.hullDark, 1), weather(st.patch[0], 1)];

  // Stepped housing: a long forward course and a shorter, tucked aft course, so
  // the section reads as built up rather than as a sleeve.
  const course = [
    { z: -len, w: w * 1.02, h: h * 1.02, c },
    { z: -len * 0.94, w: hw, h: hh, c },
    { z: -len * 0.26, w: hw, h: hh, c },
    { z: -len * 0.16, w: hw * 0.92, h: hh * 0.92, c },
    { z: 0, w: hw * 0.8, h: hh * 0.8, c },
  ];
  loftHull(b, 'hull', [weather(st.hull, 1), weather(st.hull, 1), weather(st.trim, 2), weather(st.trim, 2)],
    { stations: course, capFore: false, capAft: true });
  loftPlating(b, 'hull', plates, {
    stations: course, rows: Math.max(1, Math.round(len / (Math.max(w, h) * 1.6))), cols: 1,
    t: Math.max(0.05, Math.min(w, h) * 0.08), inset: 0.2, seed,
  });
  loftRib(b, 'hull', st.trim, { stations: course, z: -len * 0.86, out: Math.max(0.05, r * 0.06), thick: Math.max(0.1, len * 0.05) });
  loftRib(b, 'hull', st.trim, { stations: course, z: -len * 0.55, out: Math.max(0.05, r * 0.06), thick: Math.max(0.1, len * 0.05) });
  loftRib(b, 'hull', st.trim, { stations: course, z: -len * 0.3, out: Math.max(0.05, r * 0.06), thick: Math.max(0.1, len * 0.05) });

  // Radiator panels: a drive this size sheds heat, and they break the
  // silhouette along the top and bottom where a bare block would read as a box.
  for (const sy of [1, -1]) {
    for (const sx of [1, -1]) {
      radiatorPanel(b, 'hull', weather(st.trim, 1), weather(st.hullDark, 1), {
        x: sx * hw * 0.62, y: sy * hh * 0.72, z: -len * 0.5,
        w: len * 0.5, h: r * 0.7, fins: 5, ry: Math.PI / 2, thick: Math.max(0.08, r * 0.06),
      });
    }
  }

  // Service plumbing from the housing forward onto the hull.
  for (const sx of [1, -1]) {
    pipeRun(b, 'hull', weather(st.trim, 2), {
      ax: sx * hw * 0.8, ay: 0, az: -len * 0.15,
      bx: sx * w * 0.86, by: 0, bz: -len * 1.05,
      r: Math.max(0.05, r * 0.055), seg: 6, collars: 3,
    });
  }

  // Thrust throats: recessed, ringed, with the emissive core set DEEP inside so
  // the light reads as coming out of a machine. They sit on an ellipse matched
  // to the stern section, which is what keeps a wide blade's exhausts spread
  // across its beam instead of bunched on a circle in the middle of it.
  const tr = Math.min(hw, hh) * (throats > 3 ? 0.3 : 0.4);
  const rx = hw * 0.52;
  const ry = hh * 0.52;
  for (let i = 0; i < throats; i++) {
    const a = (i / throats) * Math.PI * 2 + Math.PI / throats;
    const tx = Math.cos(a) * rx;
    const ty = Math.sin(a) * ry;
    cyl(b, 'hull', weather(st.hull, 0), tr * 1.28, tr * 1.1, len * 0.26, 8,
      { rx: Math.PI / 2, x: tx, y: ty, z: -len * 0.1 });
    cyl(b, 'hull', weather(st.hullDark, 2), tr, tr * 0.82, len * 0.2, 8,
      { rx: Math.PI / 2, x: tx, y: ty, z: -len * 0.04 });
    torus(b, 'hull', weather(st.trim, 0), tr * 1.18, Math.max(0.03, r * 0.04), 6, 10, undefined,
      { x: tx, y: ty, z: -len * 0.02 });
    cyl(b, 'lights', OPTIC, tr * 0.62, tr * 0.62, len * 0.05, 8,
      { rx: Math.PI / 2, x: tx, y: ty, z: -len * 0.16 });
  }
  // Between-throat structure so the aft face is a frame, not a plate.
  for (let i = 0; i < throats; i++) {
    const a = (i / throats) * Math.PI * 2;
    box(b, 'hull', weather(st.trim, 1), Math.min(hw, hh) * 0.22, Math.min(hw, hh) * 0.9, len * 0.18,
      { x: Math.cos(a) * rx * 0.9, y: Math.sin(a) * ry * 0.9, z: -len * 0.12, rz: a });
  }
}

/**
 * Visible serialized attach point on the current frame, pad normal +Y: the
 * proof that a Veridian module comes off. Machined pad, collar at HUMAN.collarR,
 * two lugs, one index lamp. `s` scales the mechanism, never the HUMAN parts.
 */
export function moduleLatch(b, st, { ry = 0, lit = true, s = 1 }) {
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
export function instrumentFin(b, st, { len, depth, ry = 0 }) {
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
export function tugDock(b, st, { w, d, ry = 0 }) {
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
