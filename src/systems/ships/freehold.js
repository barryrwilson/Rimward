/**
 * The Freehold Compact — the homestead workboat.
 *
 * Reference: docs/FactionExamples/03-freehold-compact-ship.png, and the freehold
 * panel of overview-ships.jpg. A chunky tug: the boxiest hull of the ten
 * factions, but still clearly longer than it is wide. A glass cab sits forward
 * and LOW, mismatched donated plates in barn red, weathered cream and faded blue
 * (st.patch, cycled) cover a working frame, external tanks ride the flanks,
 * scaffold rails run the length, and every class above an ace tows a pod on a
 * boom behind the stern.
 *
 * WHY IT LOOKS LIKE THIS (wave 47 — the failures are the design notes):
 *   LENGTH DOMINATES. Round 1 authored this fleet as vertical drums: the frigate
 *   measured 30 wide by 19 tall by 34 long and rendered in-game as a plated
 *   barrel with a flat disc for a face. Every ship in the reference art is 4 to 6
 *   times longer than its beam with its height well under its beam, so the
 *   harness now pins the ratios (spanZ >= 2.4 * spanX, spanY <= 0.75 * spanX).
 *   Nothing else catches a drum: density, envelope, packing and palette were all
 *   green on the barrels.
 *   THE BUILDER TAKES THE ENVELOPE, NOT A UNIT. `hull()` receives the class's
 *   FINAL half-extents (X, Y) and z range, and every part is a fraction of them.
 *   The first hand-written attempt parameterised on a keel unit instead and its
 *   flank tanks, rails and cab dome multiplied that unit into a beam 2.7 times
 *   the ceiling — the envelope has to be an input, not an outcome.
 *   ONE BUILDER, SIX SIZES. A homesteader fleet is the same boat at six scales —
 *   that IS the faction. A class is six numbers, so the silhouette cannot drift
 *   between classes. The other nine factions author each class separately;
 *   freehold does not need to.
 *   PATCHWORK IS THE TEXTURE, NOT THE SHAPE. The plate cycle rides a regular
 *   frame: `bays` hull segments each take the next patch shade, so the ship reads
 *   as mismatched panels on a straight keel rather than as a lumpy mass. Plate
 *   choice comes from the bay INDEX, never from a colour value, because the
 *   pirate bake calls this same build with a dulled palette and the positions
 *   must come out byte-identical.
 *   AMBER BELONGS TO THE LIGHTS CHANNEL. The cab glass and the lamp runs are the
 *   faction's signature warmth, and the lights material is already
 *   FACTION_STYLE.freehold.glow (0xffb454) multiplying its vertex colours — so
 *   those parts are authored NEAR-WHITE and the material supplies the amber. A
 *   saturated amber in the vertex colours would square the hue, and st.glow is
 *   not on the hull's SHADES ladder anyway.
 *   LIT PARTS SIT ON PLATE FACES. The seatedLights pin measures in ABSOLUTE
 *   units (a 1.0-unit cell) at every class size, so a lamp offset that looks
 *   snug on a light ship floats free on a frigate. Every lit part here is placed
 *   at a plate's own face and inset by `min(0.12, 0.03 * X)`.
 *
 * CLASS TABLE (X = half beam, Y = half height, both hull extremes):
 *   class          X      Y     z range          bays  towed pod
 *   light        1.24   0.86   -3.25 .. +2.95      5   no
 *   cutter       1.74   1.16   -4.60 .. +4.05      6   no
 *   ace          2.14   1.26   -5.30 .. +4.70      6   no
 *   freighter    2.72   1.94   -6.40 .. +6.00      8   yes
 *   heavy        3.50   2.32   -8.40 .. +8.00      9   yes
 *   frigate      8.80   5.80  -24.20 .. +22.20    14   yes
 */

import {
  rng, weather, box, cyl, hemi, cone,
  windowRow, truss, railing, pipeRun, ladder, radiatorPanel, lampString, crate,
} from '../station-detail.js';

// Near-whites for the lights channel. The additive material's colour is the
// faction's amber glow and MULTIPLIES these, so they stay near-neutral (every
// sRGB channel >= 0.6, the harness's litNearWhite pin).
const GLASS = 0xfff2d8;
const LAMP = 0xffffff;
const DIM = 0xe8dcc8;

/**
 * One freehold hull. `s` carries the class geometry:
 *   X/Y     half beam / half height, the hull's own extremes
 *   z0/z1   nose / stern extreme
 *   bays    hull plate segments along the keel (drives vertex density)
 *   pod     tow a pod behind the stern
 *   seed    literal RNG seed — never Math.random, never derived from a colour
 */
function hull(b, st, s) {
  const rand = rng(s.seed);
  const W = weather;
  const { X, Y, z0, z1, bays } = s;
  const len = z1 - z0;
  const mid = (z0 + z1) / 2;
  const bayLen = len / bays;
  const patch = st.patch;
  // Lit parts inset from the face they sit on: absolute, because the orphan
  // test's cell is absolute.
  const inset = Math.min(0.12, 0.03 * X);
  // Flank plate outer face, and the tank axis just inside it.
  const px = 0.80 * X;
  const pt = 0.14 * X; // plate thickness (half)
  const face = px + pt;

  // ---- keel: the straight working frame everything else bolts onto ----
  box(b, 'hull', W(st.hullDark, 1), 0.62 * X, 0.42 * Y, len * 0.99, { z: mid });
  box(b, 'hull', W(st.hull, 0), 0.55 * X, 0.52 * Y, len * 0.9, { z: mid + len * 0.02 });
  box(b, 'hull', W(st.hullDark, 2), 0.3 * X, 0.16 * Y, len * 0.82, { y: -0.5 * Y, z: mid });

  // ---- donated plating: one bay, one patch shade, both flanks + deck ----
  for (let i = 0; i < bays; i++) {
    const zc = z0 + bayLen * (i + 0.5);
    const hex = W(patch[i % patch.length], i % 4);
    const dark = W(st.hullDark, 1 + (i % 3));
    const pl = bayLen * 0.84;
    for (const sx of [-1, 1]) {
      box(b, 'hull', hex, pt, 0.40 * Y, pl, { x: sx * px, z: zc });
      box(b, 'hull', dark, pt * 0.7, 0.46 * Y, bayLen * 0.14, { x: sx * px, z: zc + pl / 2 });
      windowRow(b, 'hull', W(st.trim, 2), {
        count: 4, spacing: pl / 4, w: pt * 0.6, h: 0.07 * Y, d: 0.07 * Y,
        x: sx * face, y: 0.24 * Y, z: zc, axis: 'z',
      });
      box(b, 'hull', W(patch[(i + 2) % patch.length], (i + 1) % 4), pt * 0.8, 0.2 * Y, pl * 0.7,
        { x: sx * px, y: -0.34 * Y, z: zc });
    }
    box(b, 'hull', W(patch[(i + 1) % patch.length], (i + 2) % 4), 0.6 * X, 0.09 * Y, pl, { y: 0.55 * Y, z: zc });
    box(b, 'hull', dark, 0.64 * X, 0.06 * Y, bayLen * 0.12, { y: 0.58 * Y, z: zc + pl / 2 });
    box(b, 'hull', W(patch[(i + 2) % patch.length], (i + 1) % 4), 0.44 * X, 0.08 * Y, pl, { y: -0.55 * Y, z: zc });
    // deck ribs: cheap length detail, and they hold the plate seams apart
    box(b, 'hull', W(st.trim, 3), 0.5 * X, 0.05 * Y, bayLen * 0.1, { y: 0.62 * Y, z: zc - pl * 0.3 });
  }

  // ---- cab, forward and LOW: stepped boxes, then the glass ----
  const cabZ = z0 + len * 0.14;
  box(b, 'hull', W(st.trim, 0), 0.58 * X, 0.24 * Y, len * 0.14, { y: 0.5 * Y, z: cabZ });
  box(b, 'hull', W(st.trim, 1), 0.44 * X, 0.16 * Y, len * 0.1, { y: 0.68 * Y, z: cabZ - len * 0.01 });
  box(b, 'hull', W(st.accent, 1), 0.5 * X, 0.05 * Y, len * 0.15, { y: 0.66 * Y, z: cabZ });
  hemi(b, 'hull', W(st.accent, 0), 0.16 * Y, 10, 6, { y: 0.72 * Y, z: cabZ - len * 0.01 });
  windowRow(b, 'lights', GLASS, {
    count: 5, spacing: 0.2 * X, w: 0.14 * X, h: 0.14 * Y, d: 0.05 * Y,
    y: 0.5 * Y, z: cabZ - len * 0.07 + inset, axis: 'x',
  });
  windowRow(b, 'lights', GLASS, {
    count: 3, spacing: 0.22 * X, w: 0.15 * X, h: 0.1 * Y, d: 0.05 * Y,
    y: 0.68 * Y, z: cabZ - len * 0.05 + inset, axis: 'x',
  });

  // ---- nose: a tapered ram guard, not a flat lid ----
  box(b, 'hull', W(st.hull, 1), 0.42 * X, 0.34 * Y, len * 0.05, { z: z0 + len * 0.035 });
  cone(b, 'hull', W(st.hullDark, 0), 0.36 * X, len * 0.08, 6, { z: z0 + len * 0.02, rx: -Math.PI / 2 });
  box(b, 'hull', W(st.trim, 3), 0.2 * X, 0.06 * Y, len * 0.07, { y: 0.2 * Y, z: z0 + len * 0.05 });

  // ---- flank tanks: donated pressure vessels lashed on ----
  const tanks = Math.max(2, Math.round(bays * 0.5));
  for (let i = 0; i < tanks; i++) {
    const zc = z0 + len * (0.3 + 0.52 * (i / Math.max(1, tanks - 1)));
    const sx = i % 2 === 0 ? -1 : 1;
    cyl(b, 'hull', W(patch[(i + 1) % patch.length], 1), 0.13 * X, 0.13 * X, bayLen * 0.66, 8,
      { x: sx * (px - 0.02 * X), y: -0.12 * Y, z: zc, rx: Math.PI / 2 });
    cyl(b, 'hull', W(st.trim, 2), 0.15 * X, 0.15 * X, bayLen * 0.09, 8,
      { x: sx * (px - 0.02 * X), y: -0.12 * Y, z: zc + bayLen * 0.28, rx: Math.PI / 2 });
    pipeRun(b, 'hull', W(st.hullDark, 0), {
      ax: sx * 0.5 * X, ay: -0.12 * Y, az: zc,
      bx: sx * (px - 0.02 * X), by: -0.12 * Y, bz: zc, r: 0.04 * X, seg: 5, collars: 1,
    });
  }

  // ---- scaffold rails and a service ladder: the homestead read ----
  for (const sx of [-1, 1]) {
    railing(b, 'hull', W(st.hullDark, 1), {
      ax: sx * 0.58 * X, ay: 0.6 * Y, az: z0 + len * 0.26,
      bx: sx * 0.58 * X, by: 0.6 * Y, bz: z1 - len * 0.12,
      height: 0.16 * Y, posts: bays + 1, rail: 0.03 * X,
    });
    truss(b, 'hull', W(st.trim, 3), {
      ax: sx * 0.66 * X, ay: -0.5 * Y, az: z0 + len * 0.3,
      bx: sx * 0.66 * X, by: -0.5 * Y, bz: z1 - len * 0.16,
      thickness: 0.04 * X, bays: Math.max(3, bays - 2), spread: 0.1 * Y,
    });
  }
  ladder(b, 'hull', W(st.trim, 2), {
    x: 0.5 * X, y: 0.62 * Y, z: z0 + len * 0.24, h: 0.2 * Y, w: 0.18 * X, rungs: 4, rail: 0.025 * X,
  });

  // ---- radiators and crates on the after deck ----
  radiatorPanel(b, 'hull', W(st.hullDark, 0), W(st.trim, 1), {
    x: 0, y: 0.66 * Y, z: z1 - len * 0.24, w: 0.7 * X, h: 0.2 * Y, fins: 5, ry: 0, thick: 0.05 * Y,
  });
  const crates = Math.max(2, Math.round(bays * 0.45));
  for (let i = 0; i < crates; i++) {
    crate(b, 'hull', W(patch[(i + 2) % patch.length], 2), {
      x: (i % 2 === 0 ? -1 : 1) * 0.3 * X, y: 0.66 * Y, z: z1 - len * (0.14 + 0.09 * i),
      s: 0.18 * Y, ry: 0.2 + rand() * 0.4, bands: 2, bandHex: W(st.hullDark, 0),
    });
  }

  // ---- stern: engine block, nozzles, and the tow boom ----
  const sz = z1 - len * 0.06;
  box(b, 'hull', W(st.hullDark, 0), 0.6 * X, 0.5 * Y, len * 0.1, { z: sz });
  box(b, 'hull', W(st.trim, 1), 0.64 * X, 0.09 * Y, len * 0.05, { y: 0.44 * Y, z: sz });
  for (const sx of [-1, 1]) {
    cyl(b, 'hull', W(st.hullDark, 1), 0.18 * X, 0.22 * X, len * 0.06, 8,
      { x: sx * 0.3 * X, y: -0.05 * Y, z: z1 - len * 0.025, rx: Math.PI / 2 });
    cyl(b, 'lights', DIM, 0.12 * X, 0.12 * X, len * 0.01, 8,
      { x: sx * 0.3 * X, y: -0.05 * Y, z: z1 - len * 0.008 - inset, rx: Math.PI / 2 });
  }
  if (s.pod) {
    // The pod hangs off a boom that reaches it — a detached pod would read as
    // junk floating behind the ship and would break the singleMass pin.
    const podZ = z1 - len * 0.02;
    pipeRun(b, 'hull', W(st.hullDark, 2), {
      ax: 0, ay: -0.3 * Y, az: sz, bx: 0, by: -0.62 * Y, bz: podZ, r: 0.05 * X, seg: 6, collars: 2,
    });
    box(b, 'hull', W(patch[0], 1), 0.34 * X, 0.22 * Y, len * 0.05, { y: -0.7 * Y, z: podZ });
    box(b, 'hull', W(st.trim, 2), 0.36 * X, 0.05 * Y, len * 0.022, { y: -0.46 * Y, z: podZ });
  }

  // ---- lamp runs: seated on the deck seam and the flank plate faces ----
  for (const sx of [-1, 1]) {
    lampString(b, 'lights', LAMP, {
      ax: sx * 0.58 * X, ay: 0.62 * Y + inset, az: z0 + len * 0.28,
      bx: sx * 0.58 * X, by: 0.62 * Y + inset, bz: z1 - len * 0.14,
      count: bays, size: 0.07 * Y,
    });
    windowRow(b, 'lights', DIM, {
      count: bays, spacing: bayLen * 0.9, w: pt * 0.5, h: 0.12 * Y, d: 0.05 * Y,
      x: sx * (face - inset), y: -0.05 * Y, z: mid, axis: 'z',
    });
  }
  lampString(b, 'lights', DIM, {
    ax: 0, ay: -0.56 * Y - inset, az: z0 + len * 0.3,
    bx: 0, by: -0.56 * Y - inset, bz: z1 - len * 0.2, count: Math.max(3, bays - 2), size: 0.06 * Y,
  });
}

export const freeholdShip = {
  light: {
    glowZ: 2.9,
    build(b, st) { hull(b, st, { X: 1.24, Y: 0.86, z0: -3.25, z1: 2.95, bays: 5, pod: false, seed: 4701 }); },
  },
  cutter: {
    glowZ: 3.9,
    build(b, st) { hull(b, st, { X: 1.74, Y: 1.16, z0: -4.60, z1: 4.05, bays: 6, pod: false, seed: 4702 }); },
  },
  ace: {
    glowZ: 4.5,
    build(b, st) { hull(b, st, { X: 2.14, Y: 1.26, z0: -5.30, z1: 4.70, bays: 6, pod: false, seed: 4703 }); },
  },
  freighter: {
    glowZ: 5.8,
    build(b, st) { hull(b, st, { X: 2.58, Y: 1.94, z0: -6.40, z1: 6.00, bays: 8, pod: true, seed: 4704 }); },
  },
  heavy: {
    glowZ: 7.8,
    build(b, st) { hull(b, st, { X: 3.50, Y: 2.32, z0: -8.40, z1: 8.00, bays: 9, pod: true, seed: 4705 }); },
  },
  frigate: {
    glowZ: 21.6,
    build(b, st) { hull(b, st, { X: 8.80, Y: 5.80, z0: -24.20, z1: 22.20, bays: 14, pod: true, seed: 4706 }); },
  },
};
