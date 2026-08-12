/**
 * Red Ledger — the BODY PLAN core.
 *
 * This file is the Ledger's own CONSTRUCTION LANGUAGE, built on top of the
 * shared faction-agnostic sweep core in ../loft.js. It answers one question:
 * how does the Ledger BUILD? Captured hardware re-welded into a deliberate
 * predatory machine — every seam a tonal break, every joint a weld bead, every
 * reused component visibly seized from somewhere else.
 *
 * WHY WELD BEADS INSTEAD OF BOLTED STRAPS. The Freehold uses bolted straps
 * because donated sections are joined by neighbours who had the hardware. The
 * Ledger's sections are SEIZED hardware: the yard cuts them to fit and re-welds
 * them cold. A standing proud weld-bead ring at each seam reads as industrial
 * fusion rather than community repair.
 *
 * WHY SCAR PLATES INSTEAD OF REPLACED PANELS. The Freehold's patchCourse
 * tracks donated panels — a new section in its original colour. The Ledger's
 * plunderCourse tracks damage repaired IN THE FIELD: a plate spot-welded over a
 * breach, heavier than the original, in a contrasting salvage tone. It is not
 * an accident; it is a record of a fight the ship won.
 *
 * WHY GRAPPLE ARMS ARE BODY LANGUAGE. These are not decoration — they are the
 * shape. A Ledger cutter without its grapple arms is a featureless tube with a
 * ram. The arms are anatomy, not motifs.
 *
 * Per-construct story:
 *   capturedHull  — the seized hull shell. Seams are tonal breaks; each break
 *                   is capped with a proud weld-bead ring rather than a strap.
 *   plunderCourse — plating carrying the field-repair record. Scar plates are
 *                   chosen by seed, never by reading a colour value.
 *   ramProw       — the reinforced boarding wedge. Widest at the mount,
 *                   narrowing to a blunt vertical tip. A shank extending +Z
 *                   past the frame origin gives callers real AABB overlap.
 *   grappleArm    — a structural grasping arm. Sweep makes it reach; knuckle
 *                   joints make it flex; the claw closes the intent. Starts
 *                   +0.2 behind origin so callers get real overlap at mount.
 *   haulSpine     — the armoured keel of a tribute barge or prize cradle
 *                   mount. Open box girder with hardpoints for seized cargo.
 *   breachTube    — the boarding tube. Forward-pointing cylinder with a copper
 *                   collar at root (overlaps mount), cutting teeth at rim, and
 *                   longitudinal ram rails on the outside.
 *   vaultBlock    — the unit ransom vault. Chamfered body, copper-banded,
 *                   face-recessed, with a seal hasp. Not a bare box.
 *   tallyBand     — the Ledger's girth recognition mark. Follows the hull
 *                   cross-section via sectionAt/sectionOutline so it hugs every
 *                   taper. Tally-notch marks on the flanks by outline sampling.
 *
 * PALETTE RULE: every hex emitted here comes verbatim from the `hexes` array
 * the CALLER supplies. This file never calls weather() on a caller tone.
 * (wave-3 defect 1 fix — double weathering.)
 *
 * COLOUR SELECTION RULE: tones are picked by INDEX and seed, never by reading
 * a colour value. The pirate bake desaturates the palette; reading RGB causes
 * the two bakes to select different slots. (wave-3 defect 2 fix.)
 *
 * ATTACHMENT RULE: every part's AABB must overlap another. Constructs meant
 * to be mounted INTO or ONTO something carry a shank/collar that reaches past
 * the frame origin toward +Z so a caller mounting on a face gets real box
 * overlap, not tangency. (attach-audit defect 1 fix.)
 *
 * FRAME RULE: all coordinates inside a pushed frame are LOCAL. Never pass an
 * absolute coordinate into a helper while inside b.push/b.pop. (wave-1 defect 4.)
 */

import {
  rng, box, cyl,
} from '../../station-detail.js';

import {
  sectionAt, sectionOutline, loftExtents, loftHull, loftPlating, loftRib,
} from '../loft.js';

import { HUMAN } from '../../../game/ship-scale.js';

// Re-export the faction-agnostic sweep core so class files have ONE import
// source and need not reach into ../loft.js directly. Same convention as
// freehold/body.js — one barrel per faction, not one per concern.
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

// ---------------------------------------------------------------------------
// capturedHull
// ---------------------------------------------------------------------------

/**
 * The Ledger's seized hull shell.
 *
 * Lofts `stations` in sections cut at `seams`. Each section takes one tone
 * from `hexes` chosen by INDEX — adjacent sections are forbidden from drawing
 * the same tone so every seam is a visible tonal break. At each seam a WELD
 * BEAD ring stands `weld` units proud in the tone `weldHex ?? hexes[0]`,
 * reading as a fused joint rather than a bolted strap.
 *
 * capFore / capAft close the outermost ends only; interior section ends are
 * sealed by the weld-bead collar so no buried face is added.
 *
 * Attachment: weld beads use loftRib which follows the station outline exactly.
 * Each bead straddles the seam z, overlapping both adjacent section bodies.
 *
 * @param {import('../../station-detail.js').DetailBuilder} b  - builder
 * @param {string}   ch       - channel ('hull' or 'lights')
 * @param {number|number[]} hexes - caller-supplied tones; emitted verbatim
 * @param {Object}   opts
 * @param {Object[]} opts.stations  - loft station list { z, w, h, y?, c? }
 * @param {number[]} [opts.seams]   - interior seam z values
 * @param {number}   [opts.seg]     - cross-section seg override (0 = octagonal)
 * @param {boolean}  [opts.capFore] - close the fore (-Z) cap
 * @param {boolean}  [opts.capAft]  - close the aft (+Z) cap
 * @param {number}   [opts.weld]    - weld-bead proud height
 * @param {number}   [opts.weldHex] - override bead tone (null → hexes[0])
 * @param {number}   [opts.seed]    - unused; kept for signature parity
 */
export function capturedHull(b, ch, hexes, {
  stations,
  seams    = [],
  seg      = 0,
  capFore  = true,
  capAft   = true,
  weld     = 0.06,
  weldHex  = null,
  seed     = 1,
}) {
  void seed; // tone assignment is by section index alone, not a random draw
  const list = Array.isArray(hexes) ? hexes : [hexes];
  const ext  = loftExtents(stations);

  const validSeams = [...seams]
    .filter(z => z > ext.z0 && z < ext.z1)
    .sort((a, b) => a - b);

  const beadColor = weldHex !== null ? weldHex : list[0];
  const bounds    = [ext.z0, ...validSeams, ext.z1];

  let prevIdx = -1;
  for (let si = 0; si < bounds.length - 1; si++) {
    const zStart = bounds[si];
    const zEnd   = bounds[si + 1];

    // Tone by index; adjacent sections must differ so every seam is readable.
    let idx = si % list.length;
    if (idx === prevIdx && list.length > 1) {
      idx = (idx + 1) % list.length;
    }
    prevIdx = idx;
    const color = list[idx];

    // Sub-station list: always interpolate both endpoints with sectionAt.
    // Interior stations use strict > < to avoid duplicating an endpoint that
    // coincides with a seam (sectionAt already captures it exactly).
    const sub = [sectionAt(stations, zStart)];
    for (const s of stations) {
      if (s.z > zStart && s.z < zEnd) sub.push(s);
    }
    sub.push(sectionAt(stations, zEnd));
    if (sub.length < 2) continue;

    loftHull(b, ch, color, {
      stations: sub,
      seg,
      capFore: si === 0 ? capFore : false,
      capAft:  si === bounds.length - 2 ? capAft : false,
    });
  }

  // Weld bead at each seam: a proud loftRib collar.
  // thick = weld * 0.55 so the bead reads as fused metal, not a ring frame.
  // loftRib follows the station outline exactly; the bead straddles the seam
  // and its AABB overlaps both adjacent section bodies.
  const beadThick = weld * 0.55;
  for (const z of validSeams) {
    loftRib(b, ch, beadColor, { stations, z, seg, out: weld, thick: beadThick });
  }
}

// ---------------------------------------------------------------------------
// plunderCourse
// ---------------------------------------------------------------------------

/**
 * Plating that follows the loft, restricted to a Z RANGE.
 *
 * Wraps loftPlating over the sub-station list from `from` to `to`. BOTH
 * endpoints are always interpolated with sectionAt, and interior stations use
 * strict > < comparisons — a range whose ends coincide with a station z must
 * still emit those bands. (wave-2 defect 3 fix: non-strict comparisons or an
 * epsilon dropped the band adjacent to the clipped end.)
 *
 * A `scars` fraction of inter-station bands is promoted to a SCAR PLATE: a
 * second loftPlating call at t + proud in a contrasting tone from `hexes`.
 * Which bands scar is decided by rng(seed), never by reading a colour value.
 * (wave-3 defect 2 extended: colour-dependent selection breaks the pirate bake.)
 * The scar plate AABB sits on top of the base plate; attach-audit sees overlap.
 *
 * @param {import('../../station-detail.js').DetailBuilder} b  - builder
 * @param {string}   ch      - channel ('hull')
 * @param {number[]} hexes   - caller tones; emitted verbatim, no weather()
 * @param {Object}   opts
 * @param {Object[]} opts.stations - station list
 * @param {number}   opts.from     - fore clamp z (clamped to station range)
 * @param {number}   opts.to       - aft clamp z (clamped to station range)
 * @param {number}   [opts.rows]   - plate rows per inter-station band
 * @param {number}   [opts.cols]   - plate columns per face
 * @param {number}   [opts.t]      - base plate proud height
 * @param {number}   [opts.inset]  - plate inset fraction
 * @param {number}   [opts.seed]   - RNG seed for scar selection
 * @param {number[]} [opts.faces]  - cross-section face subset to plate
 * @param {number}   [opts.scars]  - fraction of bands promoted to scar plates
 * @param {number}   [opts.proud]  - scar plate additional height above base
 */
export function plunderCourse(b, ch, hexes, {
  stations,
  from,
  to,
  rows   = 2,
  cols   = 1,
  t      = 0.06,
  inset  = 0.15,
  seed   = 1,
  faces  = null,
  scars  = 0.2,
  proud  = 0.035,
}) {
  const list   = Array.isArray(hexes) ? hexes : [hexes];
  const ext    = loftExtents(stations);
  const startZ = Math.max(ext.z0, from);
  const endZ   = Math.min(ext.z1, to);
  if (startZ >= endZ) return;

  // Always interpolate BOTH endpoints. Interior stations use strict > < so
  // a station coinciding with an endpoint is not double-added. Wave-2 defect 3:
  // using an epsilon or strict check on BOTH ends silently dropped bands when
  // the range boundary landed on a station z.
  const sub = [sectionAt(stations, startZ)];
  for (const s of stations) {
    if (s.z > startZ && s.z < endZ) sub.push(s);
  }
  sub.push(sectionAt(stations, endZ));
  if (sub.length < 2) return;

  // Base plating. loftPlating picks from the list by seed-based random draw —
  // selection is by index (the draw), not by reading colour values.
  loftPlating(b, ch, list, { stations: sub, rows, cols, t, inset, seed, faces });

  // Scar plates: select bands by rng, never by colour. Each scar emits a
  // second loftPlating at t + proud in a contrasting tone (list[1] or later).
  // The scar plate AABB fully encloses the base plate it sits on (same Z band,
  // taller proud), so attach-audit sees them as one connected stack.
  if (scars > 0 && list.length > 1) {
    const rnd = rng((seed * 7723 + 0x1a4b) >>> 0);
    for (let i = 0; i < sub.length - 1; i++) {
      if (rnd() < scars) {
        // Contrasting tone by index arithmetic — never by reading RGB.
        const offset    = 1 + Math.floor(rnd() * (list.length - 1));
        const scarColor = list[offset % list.length];
        loftPlating(b, ch, scarColor, {
          stations: [sub[i], sub[i + 1]],
          rows, cols,
          t:     t + proud,
          inset,
          seed:  (seed * 17 + i * 53) >>> 0,
          faces,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// ramProw
// ---------------------------------------------------------------------------

/**
 * The reinforced boarding wedge.
 *
 * A faceted lofted wedge — widest and tallest at its base (z = 0, the mounting
 * plane), narrowing forward toward −Z to a blunt VERTICAL tip edge of width
 * `tip`. Built with loftHull (tri/quad + emitMesh under the hood) — not a
 * scaled box primitive.
 *
 * `ribs` transverse reinforcement bands cross the flank faces as loftRib
 * collars, reading as impact-reinforcement frames.
 *
 * SHANK: a box from z = −0.06 to z = +`shank`. The wedge base station extends
 * to z = +0.06 so the wedge body and shank share real AABB overlap. A caller
 * mounting this on a bow face at z = z_bow gets the shank extending to
 * z_bow + shank (into the hull), resolving attach-audit defect 1.
 *
 * @param {import('../../station-detail.js').DetailBuilder} b - builder
 * @param {string}   ch     - channel
 * @param {number[]} hexes  - caller tones; [0] = main body, [1] = rib tone
 * @param {Object}   opts
 * @param {number}   opts.w      - total base width
 * @param {number}   opts.h      - total base height
 * @param {number}   opts.d      - wedge fore-depth from mounting plane
 * @param {number}   [opts.tip]  - tip width at z = −d (default 0.25)
 * @param {number}   [opts.y]    - vertical offset of whole construct
 * @param {number}   [opts.ribs] - reinforcement rib count on flanks
 * @param {number}   [opts.shank]- aft shank length for mount overlap
 * @param {number}   [opts.seed] - unused, signature parity
 */
export function ramProw(b, ch, hexes, {
  w, h, d, tip = 0.25, y = 0, ribs = 3, shank = 0.35, seed = 1,
}) {
  void seed;
  const list      = Array.isArray(hexes) ? hexes : [hexes];
  const mainColor = list[0];
  const ribColor  = list.length > 1 ? list[1] : list[0];

  // sectionOutline uses HALF-widths; w and h are total dimensions.
  const wTip  = tip / 2;
  const wBase = w / 2;
  const hHalf = h / 2;

  // OVERLAP BETWEEN WEDGE AND SHANK:
  // The shank box runs from z = −shankOver to z = +shank.
  // The wedge base station is at z = +shankOver so the wedge body extends into
  // the shank zone. Both AABBs share z ∈ [−shankOver, +shankOver]. ✓
  const shankOver = 0.06;

  // Wedge body: three stations for a faceted taper. loftHull = tri/quad +
  // emitMesh; not a scaled box. Fore cap closed; aft cap omitted (the shank
  // box seals the aft face).
  const wStations = [
    { z: -d,             w: wTip,                 h: hHalf,  y, c: 0.08 },
    { z: -d * 0.45,      w: (wTip + wBase) * 0.5, h: hHalf,  y, c: 0.18 },
    { z: shankOver,      w: wBase,                h: hHalf,  y, c: 0.26 },
  ];
  loftHull(b, ch, mainColor, { stations: wStations, capFore: true, capAft: false });

  // Shank box: runs from z = −shankOver to z = +shank.
  // Depth = shank + shankOver; center at z = (shank − shankOver) / 2.
  const shankLen = shank + shankOver;
  const shankCz  = (shank - shankOver) * 0.5;
  box(b, ch, mainColor, w, h, shankLen, { x: 0, y, z: shankCz });

  // Reinforcement ribs: evenly spaced along the wedge, flanks only.
  // loftRib follows the taper outline exactly so each rib overlaps the body.
  if (ribs > 0) {
    for (let ri = 0; ri < ribs; ri++) {
      const ribZ = -d + (d / (ribs + 1)) * (ri + 1);
      loftRib(b, ch, ribColor, { stations: wStations, z: ribZ, out: 0.055, thick: 0.042 });
    }
  }
}

// ---------------------------------------------------------------------------
// grappleArm
// ---------------------------------------------------------------------------

/**
 * A structural grasping arm reaching FORWARD from its mount.
 *
 * The arm runs from z = +0.2 (behind the frame origin — overlaps the mount)
 * to z = −`len` (forward, −Z direction). It is a chain of tapering cylinder
 * segments separated by `knuckles` joint blocks (a fatter box plus a copper
 * pivot boss at each joint). `sweep` bends the tip outboard in X across the
 * run; a zero sweep is a straight pipe.
 *
 * When `claw`, the forward tip carries three converging jaw fingers so the
 * arm reads as grasping, not just reaching.
 *
 * Attachment: the mount collar spans z ∈ [−0.08, +0.2]. Its aft end (+0.2)
 * sits inside the caller's mount face. Its fore end (−0.08) overlaps the first
 * arm segment, which starts at z = 0. Joint blocks are centred at each knuckle
 * z and overlap both flanking arm segments. Claw fingers overlap the last
 * arm segment (their aft end is shifted +0.15·r into the segment).
 *
 * @param {import('../../station-detail.js').DetailBuilder} b - builder
 * @param {string}   ch       - channel
 * @param {number[]} hexes    - [0] = arm body, [1] = copper pivot boss tone
 * @param {Object}   opts
 * @param {number}   opts.len       - arm forward reach from origin (along −Z)
 * @param {number}   [opts.r]       - arm radius at mount (tapers to 0.60r tip)
 * @param {number}   [opts.knuckles]- joint count
 * @param {number}   [opts.sweep]   - X offset of arm tip relative to base
 * @param {number}   [opts.ry]      - yaw rotation of whole arm about Y axis
 * @param {boolean}  [opts.claw]    - emit three jaw fingers at the tip
 * @param {number}   [opts.seed]    - unused, signature parity
 */
export function grappleArm(b, ch, hexes, {
  len, r = 0.35, knuckles = 2, sweep = 0, ry = 0, claw = true, seed = 1,
}) {
  void seed;
  const list       = Array.isArray(hexes) ? hexes : [hexes];
  const mainColor  = list[0];
  const pivotColor = list.length > 1 ? list[1] : list[0];

  b.push(0, 0, 0, ry, 0, 0);

  // Mount collar: spans z ∈ [−0.08, +0.2]. Height = 0.28, centred at z = 0.06.
  // cyl with rx = π/2 runs the cylinder along Z (Y-axis → +Z after rx=π/2).
  // The +0.2 end sits inside the caller's mount; the −0.08 end overlaps the
  // first arm segment (which starts at z = 0).
  cyl(b, ch, mainColor, r * 1.5, r * 1.5, 0.28, 8, { x: 0, y: 0, z: 0.06, rx: Math.PI / 2 });

  // Arm segments from z = 0 to z = −len in (knuckles + 1) steps.
  const segCount = knuckles + 1;

  for (let i = 0; i < segCount; i++) {
    const t0   = i / segCount;
    const t1   = (i + 1) / segCount;
    // z0 > z1 (z0 is closer to mount, less negative; z1 is closer to tip).
    const z0   = -(len * t0);
    const z1   = -(len * t1);
    const zMid = (z0 + z1) * 0.5;
    const segL = z0 - z1; // positive segment length

    // Radius tapers from r (at mount) to r * 0.60 (at tip).
    const r0 = r * (1.0 - 0.40 * t0); // at z0 (aft end of segment)
    const r1 = r * (1.0 - 0.40 * t1); // at z1 (fore end of segment)

    // X-sweep offset: 0 at base, sweep at tip.
    const xMid = sweep * (t0 + t1) * 0.5;

    // CylinderGeometry runs along Y. After rx = π/2, Y → +Z.
    // rTop (at +Y → +Z = aft end z0) = r0; rBot (at −Y → −Z = fore end z1) = r1.
    cyl(b, ch, mainColor, r0, r1, segL, 6, { x: xMid, y: 0, z: zMid, rx: Math.PI / 2 });

    // Knuckle joint (not after the last segment).
    if (i < knuckles) {
      const jx = sweep * t1;
      const jW = r * 2.2;
      const jH = r * 1.6;
      const jD = r * 0.70;
      // Joint block centred at z1: spans z ∈ [z1−jD/2, z1+jD/2], overlapping
      // the current segment (ends at z1) and the next (starts at z1).
      box(b, ch, mainColor, jW, jH, jD, { x: jx, y: 0, z: z1 });
      // Copper pivot boss: short cylinder along X, port side.
      // Centre x = jx + jW/2 + r*0.12; inner x = jx + jW/2 − r*0.275 < jx + jW/2 → overlaps block.
      // rz = π/2 rotates Y → −X; rz = −π/2 rotates Y → +X for a +X-direction boss.
      cyl(b, ch, pivotColor, r * 0.35, r * 0.35, r * 0.55, 6,
        { x: jx + jW * 0.5 + r * 0.12, y: 0, z: z1, rz: -Math.PI / 2 });
    }
  }

  // Claw: three converging jaw fingers at the tip.
  // Fingers are shifted +r*0.18 in Z toward the last arm segment's aft end
  // so their AABB overlaps the segment.
  if (claw) {
    const tipZ  = -len;
    const tipX  = sweep;
    const fLen  = r * 2.2;
    const fR0   = r * 0.28; // base (aft) radius of finger
    const fR1   = r * 0.10; // tip (fore) radius of finger
    // Shift fingers +r*0.18 so their aft end is at tipZ + r*0.18, overlapping
    // the last arm segment (which extends from tipZ to −len*(segCount−1)/segCount).
    const fShift = r * 0.18;
    for (let f = 0; f < 3; f++) {
      const ang  = (f / 3) * Math.PI * 2;
      const offX = Math.cos(ang) * r * 0.38;
      const offY = Math.sin(ang) * r * 0.38;
      // cyl with rx = π/2: rTop at +Z (aft, closer to arm) = fR0; rBot at −Z (fore) = fR1.
      cyl(b, ch, mainColor, fR0, fR1, fLen, 5, {
        x: tipX + offX * 0.5,
        y: offY * 0.5,
        z: tipZ - fLen * 0.5 + fShift,
        rx: Math.PI / 2,
      });
    }
  }

  b.pop();
}

// ---------------------------------------------------------------------------
// haulSpine
// ---------------------------------------------------------------------------

/**
 * The armoured haulage keel.
 *
 * An open box girder running from z = `from` to z = `to`, cross-section w × h
 * (full dimensions) at vertical offset y. Structure:
 *   - MAIN GIRDER: solid armoured core box, w × h × len.
 *   - CHORD RAILS: top and bottom, slightly wider than the girder, running
 *     full length. Positioned so their inner face overlaps the girder top/
 *     bottom, satisfying attach-audit adjacency.
 *   - BAY FRAMES: (bays + 1) ring frames at evenly-spaced z positions. Each
 *     frame has top, bottom, and two side members sized to overlap both the
 *     girder body and the chord rails at their corners (see soundFrame notes —
 *     spanning past chord centres prevents tangent-only contact).
 *   - DIAGONAL BRACES: criss-cross per bay (four faces), rotated via rx/ry so
 *     brace endpoints sit inside two frame members simultaneously.
 *   - HARDPOINTS: `hardpoints` pairs of flank clamp pads (port + starboard),
 *     evenly spaced. Pad inner faces overlap the girder flanks.
 *
 * Attachment: every member overlaps its neighbours by construction.
 *
 * @param {import('../../station-detail.js').DetailBuilder} b - builder
 * @param {string}   ch      - channel
 * @param {number[]} hexes   - [0] = keel body, [1] = chord rail/clamp tone
 * @param {Object}   opts
 * @param {number}   opts.from        - fore z of keel
 * @param {number}   opts.to          - aft z of keel
 * @param {number}   opts.w           - girder full width
 * @param {number}   opts.h           - girder full height
 * @param {number}   [opts.y]         - vertical offset of girder centre
 * @param {number}   [opts.bays]      - transverse frame count
 * @param {number}   [opts.chord]     - chord rail and frame member thickness
 * @param {number}   [opts.brace]     - diagonal brace cross-section size
 * @param {number}   [opts.hardpoints]- number of clamp pad pairs (port+stbd)
 * @param {number}   [opts.seed]      - unused, signature parity
 */
export function haulSpine(b, ch, hexes, {
  from, to, w, h, y = 0, bays = 4, chord = 0.32, brace = 0.16, hardpoints = 0, seed = 1,
}) {
  void seed;
  const list      = Array.isArray(hexes) ? hexes : [hexes];
  const keelColor = list[0];
  const trimColor = list.length > 1 ? list[1] : list[0];

  const len  = to - from;
  const midZ = (from + to) * 0.5;
  const step = len / bays;
  // Half-extents for position arithmetic.
  const hw = w * 0.5;
  const hh = h * 0.5;

  // Main armoured girder.
  box(b, ch, keelColor, w, h, len, { x: 0, y, z: midZ });

  // Chord rails: top and bottom, wider than girder, overlapping girder faces.
  // Rail centre at y ± (hh + chord*0.4) so the inner rail face sits at
  // y ± hh − chord*0.1, which is inside the girder AABB.
  box(b, ch, trimColor, w + chord * 0.6, chord, len + chord * 0.4,
    { x: 0, y: y + hh + chord * 0.4, z: midZ });
  box(b, ch, trimColor, w + chord * 0.6, chord, len + chord * 0.4,
    { x: 0, y: y - hh - chord * 0.4, z: midZ });

  // Bay ring frames. Top and bottom members are wider than the girder so they
  // overlap the chord rails. Side members span the girder height + chord to
  // reach both top and bottom chord positions.
  const ringT = chord * 0.84;
  for (let i = 0; i <= bays; i++) {
    const fz = from + i * step;
    // Top / bottom horizontal members (span chord rails AND girder top/bottom).
    box(b, ch, keelColor, w + chord * 1.2, ringT, ringT,
      { x: 0, y: y + hh, z: fz });
    box(b, ch, keelColor, w + chord * 1.2, ringT, ringT,
      { x: 0, y: y - hh, z: fz });
    // Port / starboard vertical members.
    box(b, ch, keelColor, ringT, h + chord, ringT,
      { x:  hw, y, z: fz });
    box(b, ch, keelColor, ringT, h + chord, ringT,
      { x: -hw, y, z: fz });
  }

  // Diagonal braces: one per bay per face, criss-cross direction each bay.
  // Side-face (YZ) diagonals at x = ±hw; top/bottom (XZ) at y = y ± hh.
  for (let i = 0; i < bays; i++) {
    const zc   = from + i * step + step * 0.5;
    const flip = i % 2 === 0 ? 1 : -1;

    // YZ-plane diagonals at x = ±hw.
    const diagYZ = Math.hypot(step, h);
    const angYZ  = Math.atan2(h, step) * flip;
    for (const sx of [1, -1]) {
      box(b, ch, trimColor, brace, brace, diagYZ, { x: sx * hw, y, z: zc, rx: angYZ });
    }
    // XZ-plane diagonals at y = y ± hh.
    const diagXZ = Math.hypot(step, w);
    const angXZ  = Math.atan2(w, step) * flip;
    for (const sy of [1, -1]) {
      box(b, ch, trimColor, brace, brace, diagXZ, { x: 0, y: y + sy * hh, z: zc, ry: angXZ });
    }
  }

  // Hardpoints: paired flank clamp pads. Inner pad face overlaps girder flank
  // (pad centre at hw + padW*0.4; inner face at hw + padW*0.4 − padW/2 =
  // hw − padW*0.1 < hw).
  if (hardpoints > 0) {
    const padW = chord * 1.6;
    const padH = h * 0.65;
    const padD = brace * 1.8;
    for (let i = 0; i < hardpoints; i++) {
      const hz  = from + (len / (hardpoints + 1)) * (i + 1);
      const padX = hw + padW * 0.4;
      box(b, ch, trimColor, padW, padH, padD, { x:  padX, y, z: hz });
      box(b, ch, trimColor, padW, padH, padD, { x: -padX, y, z: hz });
    }
  }
}

// ---------------------------------------------------------------------------
// breachTube
// ---------------------------------------------------------------------------

/**
 * The boarding tube.
 *
 * A heavy cylinder of radius r and length `len` running along −Z from the
 * mounting collar at the frame origin. Forward end: z = −`len`. Aft end: z = 0.
 *
 * Elements:
 *   MAIN TUBE    — cylinder from z = −len to z = 0.
 *   COPPER COLLAR — fatter cylinder centred at z = 0, spanning
 *                   z ∈ [−collarD, +collarD]. The +Z half OVERLAPS the caller's
 *                   mount face. Tone is hexes[1] (trim/copper). (attach-audit
 *                   defect 1 fix: the collar provides real box overlap, not
 *                   tangency, when the tube is set against a hull face.)
 *   CUTTING TEETH — `teeth` radially-spaced boxes at the forward rim (z = −len).
 *                   Each tooth centre is at z = −len + toothD/2 so the tooth
 *                   AABB overlaps the tube end.
 *   RAM RAILS    — `rails` longitudinal bars on the outer cylinder surface,
 *                   centred at radius r in XY so their inner half overlaps the
 *                   tube AABB.
 *   BORE RING    — a dark inner ring at z ≈ −len showing the hollow bore.
 *                   Tone from hexes[2] (darkest caller tone).
 *
 * @param {import('../../station-detail.js').DetailBuilder} b - builder
 * @param {string}   ch     - channel
 * @param {number[]} hexes  - [0] = main tube, [1] = collar/rails, [2] = bore ring
 * @param {Object}   opts
 * @param {number}   [opts.r]     - outer tube radius
 * @param {number}   opts.len     - tube length along −Z
 * @param {number}   [opts.y]     - vertical offset
 * @param {number}   [opts.ry]    - yaw rotation
 * @param {number}   [opts.teeth] - cutting-ring tooth count
 * @param {number}   [opts.rails] - longitudinal ram rail count
 * @param {number}   [opts.seed]  - unused, signature parity
 */
export function breachTube(b, ch, hexes, {
  r = 0.8, len, y = 0, ry = 0, teeth = 10, rails = 4, seed = 1,
}) {
  void seed;
  const list       = Array.isArray(hexes) ? hexes : [hexes];
  const mainColor  = list[0];
  const trimColor  = list.length > 1 ? list[1] : list[0];
  const boreColor  = list.length > 2 ? list[2] : list[0];

  b.push(0, y, 0, ry, 0, 0);

  // Main tube body: z ∈ [−len, 0], centred at z = −len/2.
  // cyl with rx = π/2: Y-axis (CylinderGeometry height) maps to +Z.
  cyl(b, ch, mainColor, r, r, len, 12, { x: 0, y: 0, z: -len * 0.5, rx: Math.PI / 2 });

  // Copper collar at the root. collarD = r * 0.55 so the collar reads as a
  // substantial mounting flange. Half span each side of z = 0:
  //   aft half (+Z): overlaps caller's mount face.
  //   fore half (−Z): overlaps main tube AABB.
  const collarD = r * 0.55;
  cyl(b, ch, trimColor, r * 1.22, r * 1.22, collarD * 2, 12,
    { x: 0, y: 0, z: 0, rx: Math.PI / 2 });

  // Cutting teeth at the forward rim (z = −len).
  // Tooth centre z = −len + toothD * 0.5 → tooth spans z ∈ [−len, −len + toothD].
  // Tube spans z ∈ [−len, 0]. Overlap at the fore end. ✓
  const toothH = r * 0.20;
  const toothD = r * 0.22;
  const toothW = r * 0.12;
  for (let ti = 0; ti < teeth; ti++) {
    const ang = (ti / teeth) * Math.PI * 2;
    const tx  = Math.cos(ang) * r;
    const ty  = Math.sin(ang) * r;
    box(b, ch, mainColor, toothW, toothH, toothD,
      { x: tx, y: ty, z: -len + toothD * 0.5 });
  }

  // Longitudinal ram rails: centred on the outer cylinder surface (radius r).
  // At angle 0: rail centre x = r, half-width = railW/2. Rail inner face at
  // x = r − railW/2 < r → inside tube AABB. ✓
  const railW = r * 0.14;
  const railH = r * 0.12;
  for (let ri = 0; ri < rails; ri++) {
    const ang  = (ri / rails) * Math.PI * 2;
    const rlx  = Math.cos(ang) * r;
    const rly  = Math.sin(ang) * r;
    box(b, ch, trimColor, railW, railH, len, { x: rlx, y: rly, z: -len * 0.5 });
  }

  // Bore ring: dark inner cylinder at the forward rim showing the hollow bore.
  // Radius r * 0.78 (inside the tube), centred at z = −len + boreInset/2.
  // Its AABB overlaps the main tube at the fore end. ✓
  const boreLen    = r * 0.14;
  const boreInset  = boreLen * 0.5;
  cyl(b, ch, boreColor, r * 0.78, r * 0.78, boreLen, 12,
    { x: 0, y: 0, z: -len + boreInset, rx: Math.PI / 2 });

  b.pop();
}

// ---------------------------------------------------------------------------
// vaultBlock
// ---------------------------------------------------------------------------

/**
 * The unit ransom / cargo vault.
 *
 * An armoured box w × h × d. Elements:
 *   BODY        — a chamfered loftHull shell (c = 0.18 chamfer). Not a box
 *                 primitive: loftHull produces the characteristic Ledger
 *                 cut corners that read as armour rather than cargo.
 *   STRAPS      — `straps` copper loftRib bands at evenly-spaced interior z
 *                 positions. Each strap overlaps the body it rings.
 *   FACE PANEL  — a slightly smaller inset box on the fore face (z = −d/2),
 *                 reading as the recessed access panel. Its AABB overlaps the
 *                 body fore face.
 *   HASP / SEAL — when `hasp`, a copper mounting plate plus a short lock
 *                 cylinder on the fore face. Both overlap the face panel.
 *
 * Attachment: all elements are sized to overlap their neighbours.
 *
 * @param {import('../../station-detail.js').DetailBuilder} b - builder
 * @param {string}   ch      - channel
 * @param {number[]} hexes   - [0] = body, [1] = copper straps / hasp tone
 * @param {Object}   opts
 * @param {number}   opts.w       - total width
 * @param {number}   opts.h       - total height
 * @param {number}   opts.d       - total depth along Z
 * @param {number}   [opts.y]     - vertical offset
 * @param {number}   [opts.ry]    - yaw rotation
 * @param {boolean}  [opts.hasp]  - emit a seal hasp boss on the fore face
 * @param {number}   [opts.straps]- copper band count
 * @param {number}   [opts.seed]  - unused, signature parity
 */
export function vaultBlock(b, ch, hexes, {
  w, h, d, y = 0, ry = 0, hasp = true, straps = 2, seed = 1,
}) {
  void seed;
  const list       = Array.isArray(hexes) ? hexes : [hexes];
  const bodyColor  = list[0];
  const strapColor = list.length > 1 ? list[1] : list[0];

  b.push(0, y, 0, ry, 0, 0);

  // Chamfered body. sectionOutline uses HALF-widths, so pass w/2 and h/2.
  // c = 0.18 gives noticeable armour chamfers without excessive vertex cost.
  const vSta = [
    { z: -d * 0.5, w: w * 0.5, h: h * 0.5, y: 0, c: 0.18 },
    { z:  d * 0.5, w: w * 0.5, h: h * 0.5, y: 0, c: 0.18 },
  ];
  loftHull(b, ch, bodyColor, { stations: vSta });

  // Copper corner straps: loftRib at evenly-spaced interior z positions.
  // Each rib follows the chamfered outline and overlaps the body it rings.
  for (let si = 0; si < straps; si++) {
    const frac = (si + 1) / (straps + 1);
    const sz   = -d * 0.5 + d * frac;
    loftRib(b, ch, strapColor, { stations: vSta, z: sz, out: 0.036, thick: 0.048 });
  }

  // Recessed face panel on the fore face (z = −d/2).
  // Panel centre z = −d/2 + panelD/2: the panel spans z ∈ [−d/2, −d/2 + panelD].
  // The body spans z ∈ [−d/2, +d/2]. Overlap at z ∈ [−d/2, −d/2 + panelD]. ✓
  // Panel is smaller than the face (0.68w × 0.72h) so its edges read as recessed.
  const panelW = w * 0.68;
  const panelH = h * 0.72;
  const panelD = 0.044;
  box(b, ch, bodyColor, panelW, panelH, panelD,
    { x: 0, y: 0, z: -d * 0.5 + panelD * 0.5 });

  // Hasp / seal boss: a copper plate plus lock cylinder on the fore face.
  // Both are centred at z = −d/2 + haspD/2 so they overlap the panel and body.
  if (hasp) {
    const haspR = Math.min(w, h) * 0.09;
    const haspD = panelD * 2.5;
    // Mounting plate.
    box(b, ch, strapColor, haspR * 3.2, haspR * 1.8, haspD,
      { x: 0, y: -h * 0.22, z: -d * 0.5 + haspD * 0.5 });
    // Lock cylinder. cyl with rx = π/2 runs along Z. Length haspD * 1.4;
    // centre z = −d/2 + haspD * 0.5, so it spans from −d/2 − haspD*0.2 to
    // −d/2 + haspD * 1.2, overlapping both the plate and the body fore face.
    cyl(b, ch, strapColor, haspR, haspR, haspD * 1.4, 8,
      { x: 0, y: -h * 0.22, z: -d * 0.5 + haspD * 0.5, rx: Math.PI / 2 });
  }

  b.pop();
}

// ---------------------------------------------------------------------------
// tallyBand
// ---------------------------------------------------------------------------

/**
 * The Ledger's girth recognition band.
 *
 * A ring standing `out` proud of the loft at longitudinal position `z`,
 * of longitudinal thickness `thick`. The ring follows the hull cross-section
 * by sampling sectionAt and loftRib — never a hand-computed X offset.
 * (wave-3 defect 4 fix: window rows placed at y = 0 while mounting at y ≈ 2.5
 * hung outside the skin on a chamfered outline.)
 *
 * `marks` tally-notch marks are placed evenly around the girth using the
 * surface outline from sectionOutline so their XY positions are hull-relative.
 * Each mark is a small box centred at z on the band surface; its AABB overlaps
 * the ring (same z centre, depth < thick, position inside ring XY AABB).
 *
 * Tones come from `hexes` by INDEX: hexes[0] for the band, hexes[1] for
 * alternate marks. Never reads colour values. (wave-3 defect 2 fix.)
 *
 * @param {import('../../station-detail.js').DetailBuilder} b - builder
 * @param {string}   ch      - channel
 * @param {number[]} hexes   - [0] = band tone (accent), [1] = alternate mark
 * @param {Object}   opts
 * @param {Object[]} opts.stations - station list (for sectionAt / sectionOutline)
 * @param {number}   opts.z        - longitudinal position of band centre
 * @param {number}   [opts.seg]    - cross-section seg (0 = octagonal)
 * @param {number}   [opts.out]    - proud height above loft surface
 * @param {number}   [opts.thick]  - longitudinal band thickness
 * @param {number}   [opts.marks]  - tally notch count around the girth
 * @param {number}   [opts.seed]   - unused; tones selected by index
 */
export function tallyBand(b, ch, hexes, {
  stations, z, seg = 0, out = 0.045, thick = 0.55, marks = 5, seed = 1,
}) {
  void seed;
  const list      = Array.isArray(hexes) ? hexes : [hexes];
  const bandColor = list[0];
  const markColor = list.length > 1 ? list[1] : list[0];

  // Band ring: loftRib samples sectionAt internally, following the chamfered
  // outline at z. No hand-computed X offsets — wave-3 defect 4 fix.
  loftRib(b, ch, bandColor, { stations, z, seg, out, thick });

  // Tally-notch marks: evenly spaced around the girth using sectionOutline so
  // their XY positions follow the hull cross-section at the correct height.
  // Each mark is a small flat box centred at z, depth = thick * 0.65 (inside
  // the ring z range of ± thick/2). The mark centre is at 0.70 * out from
  // the section outline — inside the ring's XY AABB, so AABB overlap holds.
  // Tones by index: m % 2 selects bandColor or markColor. No RGB reading.
  if (marks > 0) {
    const s       = sectionAt(stations, z);
    // Sample the outline at 70% of the band's proud height, inside the ring.
    const outline = sectionOutline(s.w + out * 0.70, s.h + out * 0.70, s.c, s.y, seg);
    const nPts    = outline.length;
    const markW   = HUMAN.windowW * 0.55;
    const markD   = thick * 0.65;
    const markH   = thick * 0.60;
    // Step evenly around the outline; clamp to available points.
    const step    = Math.max(1, Math.floor(nPts / marks));

    for (let m = 0; m < marks; m++) {
      const pt   = outline[(m * step) % nPts];
      // Outward normal in XY, from the section axis toward this outline point.
      const nx   = pt[0];
      const ny   = pt[1] - s.y;
      const nd   = Math.hypot(nx, ny) || 1;
      // Nudge mark slightly outward (12% of out) so it protrudes from the ring.
      const mCol = m % 2 === 0 ? bandColor : markColor;
      box(b, ch, mCol, markW, markH, markD, {
        x: pt[0] + (nx / nd) * out * 0.12,
        y: pt[1] + (ny / nd) * out * 0.12,
        z,
      });
    }
  }
}
