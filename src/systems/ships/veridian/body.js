/**
 * Veridian Combine — the BODY PLAN core.
 *
 * Brief: docs/FactionShipDesignBible.md §4.1. Charter: src/game/ship-scale.js.
 *
 * WHY THIS FILE EXISTS.
 *
 * Wave 49 built all six Veridian classes as a plated hexagonal tube — one
 * `hexSpine` call — and then hung the faction's motifs off it. Every review of
 * that fleet said the same thing: the classes are the same shape wearing
 * different greeble. The bible is explicit that this is the failure mode
 * ("Do not make one faction hull and uniformly scale it into six classes…
 * each must have anatomy appropriate to its job"), and raising vertex ceilings
 * only bought more detail on the same cylinder.
 *
 * The fix is a tool that makes SHAPE instead of surface. Everything here sweeps
 * a rectangular cross-section with cut corners — the Combine's chamfered
 * pressure-vessel language — along Z through a list of STATIONS, each with its
 * own half-width, half-height, vertical offset and chamfer. That single
 * parameter set spans every body plan the brief asks for:
 *
 *   a wide instrument head over a slim tail       → light
 *   a smooth teardrop that forks into two booms   → ace
 *   a broad flat blade                            → cutter
 *   an anvil that is widest at the prow           → heavy
 *   twin keels under a central citadel            → frigate
 *
 * The freighter is the exception the brief names: "a gigantic OPEN industrial
 * spine", so it uses `openKeel` below — a real lattice, not a skin.
 *
 * A class author writes a station list FIRST, reads the extents off it, and
 * only then decorates with ./motifs.js. Silhouette before greeble.
 *
 * GEOMETRY CONTRACT. Everything is emitted through `emitMesh`, which produces a
 * non-indexed BufferGeometry carrying position, normal and uv — the same
 * attribute set as THREE's own primitives, because `mergeGeometries` silently
 * returns null when one member of a channel disagrees. Winding is decided per
 * triangle against an outward reference direction rather than by point order,
 * so a station list authored in either handedness still renders solid under the
 * front-side-only hull material.
 */

import * as THREE from 'three';
import { rng } from '../../station-detail.js';

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _n = new THREE.Vector3();

/**
 * Append triangle (p, q, r) to `out`, wound so its face normal agrees with the
 * outward reference `ref`. Winding is never trusted to the caller: a station
 * list read from bow to stern and one read from stern to bow produce opposite
 * orders, and a back-facing hull panel is invisible rather than obviously wrong.
 */
function tri(out, p, q, r, ref) {
  _a.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  _b.set(r[0] - p[0], r[1] - p[1], r[2] - p[2]);
  _n.crossVectors(_a, _b);
  if (_n.x * ref[0] + _n.y * ref[1] + _n.z * ref[2] >= 0) {
    out.push(p[0], p[1], p[2], q[0], q[1], q[2], r[0], r[1], r[2]);
  } else {
    out.push(p[0], p[1], p[2], r[0], r[1], r[2], q[0], q[1], q[2]);
  }
}

/** Append the quad (p, q, r, s) as two triangles with a shared outward reference. */
function quad(out, p, q, r, s, ref) {
  tri(out, p, q, r, ref);
  tri(out, p, r, s, ref);
}

/**
 * Hand a raw triangle soup to the builder as one part. `tris` is a flat array
 * of 9 numbers per triangle in the CURRENT frame's local space; normals are
 * computed flat (the geometry is non-indexed, so nothing is smoothed across an
 * edge) and uv is zero-filled purely to match the primitive attribute set.
 */
export function emitMesh(b, ch, hex, tris) {
  if (tris.length === 0) return;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tris), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((tris.length / 3) * 2), 2));
  geo.computeVertexNormals();
  b.add(ch, geo, hex);
}

/**
 * One cross-section outline in the XY plane, centred on (0, `y`).
 *
 * `c` is the chamfer as a fraction of the half-extent: 0 gives a rectangle,
 * 1 gives a diamond, and the family sits around 0.3 — the cut corner that makes
 * a Veridian pressure hull read as machined rather than extruded. `seg`
 * overrides the chamfered octagon with a smooth `seg`-point ellipse, which is
 * how the ace gets its seamless shell without changing any other code path.
 */
export function sectionOutline(w, h, c = 0.3, y = 0, seg = 0) {
  const pts = [];
  if (seg > 0) {
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pts.push([Math.cos(a) * w, y + Math.sin(a) * h]);
    }
    return pts;
  }
  const cw = w * (1 - c);
  const chh = h * (1 - c);
  pts.push([w, y - chh], [w, y + chh], [cw, y + h], [-cw, y + h],
    [-w, y + chh], [-w, y - chh], [-cw, y - h], [cw, y - h]);
  return pts;
}

/** Station defaults. A station is `{ z, w, h, y = 0, c = 0.3 }`. */
const stn = (s) => ({ z: s.z, w: Math.max(1e-4, s.w), h: Math.max(1e-4, s.h), y: s.y ?? 0, c: s.c ?? 0.3 });

/**
 * The interpolated cross-section at longitudinal position `z`, clamped to the
 * end stations. A class uses this to seat detail ON the skin instead of guessing
 * at it: a vane root goes at `x = sectionAt(S, z).w - 0.1`, a dorsal walkway at
 * `y = sectionAt(S, z).y + h`. Guessing is what produced floating parts in
 * wave 49; the attach audit reads them as islands and the render shows daylight.
 */
export function sectionAt(stations, z) {
  const S = stations.map(stn);
  if (z <= S[0].z) return S[0];
  if (z >= S[S.length - 1].z) return S[S.length - 1];
  for (let i = 0; i < S.length - 1; i++) {
    const a = S[i];
    const d = S[i + 1];
    if (z >= a.z && z <= d.z) {
      const t = d.z === a.z ? 0 : (z - a.z) / (d.z - a.z);
      return {
        z,
        w: a.w + (d.w - a.w) * t,
        h: a.h + (d.h - a.h) * t,
        y: a.y + (d.y - a.y) * t,
        c: a.c + (d.c - a.c) * t,
      };
    }
  }
  return S[S.length - 1];
}

/** Bow z, stern z, and the widest/tallest half-extents a station list reaches. */
export function loftExtents(stations) {
  const S = stations.map(stn);
  let w = 0;
  let z0 = Infinity;
  let z1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const s of S) {
    if (s.w > w) w = s.w;
    if (s.z < z0) z0 = s.z;
    if (s.z > z1) z1 = s.z;
    if (s.y - s.h < y0) y0 = s.y - s.h;
    if (s.y + s.h > y1) y1 = s.y + s.h;
  }
  return { z0, z1, len: z1 - z0, w, y0, y1, h: (y1 - y0) / 2 };
}

const ringAt = (s, seg) => sectionOutline(s.w, s.h, s.c, s.y, seg)
  .map(([x, y]) => [x, y, s.z]);

/**
 * Sweep `stations` into a closed shell — the ship's actual body.
 *
 * `hexes` may be a single colour or a list cycled band by band, which gives the
 * hull its plate-tone variation without any surface geometry at all. Each band
 * between two stations is emitted as ONE part, so the attach audit sees a chain
 * of overlapping boxes down the hull rather than several thousand slivers.
 *
 * `seg` (see `sectionOutline`) swaps the chamfered octagon for a smooth ellipse.
 * `capFore` / `capAft` close the ends; a class that mounts an aperture or a
 * drive over an end can leave that cap off, but only if the covering part is
 * genuinely larger than the opening.
 */
export function loftHull(b, ch, hexes, { stations, seg = 0, capFore = true, capAft = true }) {
  const S = stations.map(stn);
  const list = Array.isArray(hexes) ? hexes : [hexes];
  const rings = S.map((s) => ringAt(s, seg));
  const n = rings[0].length;

  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i];
    const B = rings[i + 1];
    const az = S[i].z;
    const ay = S[i].y;
    const by = S[i + 1].y;
    const out = [];
    for (let f = 0; f < n; f++) {
      const g = (f + 1) % n;
      // Outward reference: from the section axis to the face's midpoint. The
      // axis is the interpolated centre, not the origin — an offset station
      // (a keel slung under a citadel) would otherwise flip its own top face.
      const mx = (A[f][0] + A[g][0] + B[f][0] + B[g][0]) / 4;
      const my = (A[f][1] + A[g][1] + B[f][1] + B[g][1]) / 4;
      quad(out, A[f], A[g], B[g], B[f], [mx, my - (ay + by) / 2, 0]);
    }
    emitMesh(b, ch, list[i % list.length], out);
    void az;
  }

  if (capFore || capAft) {
    const ends = [];
    if (capFore) ends.push([0, -1]);
    if (capAft) ends.push([rings.length - 1, 1]);
    for (const [idx, dir] of ends) {
      const R = rings[idx];
      const c = [0, S[idx].y, S[idx].z];
      const out = [];
      for (let f = 0; f < n; f++) tri(out, c, R[f], R[(f + 1) % n], [0, 0, dir]);
      emitMesh(b, ch, list[idx % list.length], out);
    }
  }
}

/**
 * Plating that FOLLOWS the loft. `panelSkin` in station-detail.js can only lay
 * plates on a cylinder of constant radius, which is half of why wave 49's hulls
 * were cylinders: the vertex engine only worked on one shape. This lays the same
 * language on any swept body, and it is where a lofted class's hull vertex count
 * honestly comes from — `bands x rows x faces x cols` plates, 36 vertices each.
 *
 * Each plate is a slab standing `t` proud of the skin, inset from its cell by
 * `inset` so the seams read as seams. `faces` selects which cross-section faces
 * are plated (default all): a class can leave a flank bare for a bay door.
 */
export function loftPlating(b, ch, hexes, {
  stations, seg = 0, rows = 2, cols = 1, t = 0.06, inset = 0.16, seed = 1, faces = null,
}) {
  const S = stations.map(stn);
  const list = Array.isArray(hexes) ? hexes : [hexes];
  const rnd = rng(seed);
  const rings = S.map((s) => ringAt(s, seg));
  const n = rings[0].length;
  const want = faces ? new Set(faces) : null;

  const lerp3 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u];

  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i];
    const B = rings[i + 1];
    const cy = (S[i].y + S[i + 1].y) / 2;
    for (let f = 0; f < n; f++) {
      if (want && !want.has(f)) continue;
      const g = (f + 1) % n;
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          // Cell corners on the skin, then inset toward the cell centre.
          const u0 = (r + inset * 0.5) / rows;
          const u1 = (r + 1 - inset * 0.5) / rows;
          const v0 = (k + inset * 0.5) / cols;
          const v1 = (k + 1 - inset * 0.5) / cols;
          const e0 = lerp3(A[f], B[f], u0);
          const e1 = lerp3(A[g], B[g], u0);
          const e2 = lerp3(A[g], B[g], u1);
          const e3 = lerp3(A[f], B[f], u1);
          const p00 = lerp3(e0, e1, v0);
          const p01 = lerp3(e0, e1, v1);
          const p11 = lerp3(e3, e2, v1);
          const p10 = lerp3(e3, e2, v0);
          const mx = (p00[0] + p01[0] + p11[0] + p10[0]) / 4;
          const my = (p00[1] + p01[1] + p11[1] + p10[1]) / 4;
          // Outward direction in the XY plane; a plate never grows along Z.
          const d = Math.hypot(mx, my - cy) || 1;
          const ox = (mx / d) * t;
          const oy = ((my - cy) / d) * t;
          const q00 = [p00[0] + ox, p00[1] + oy, p00[2]];
          const q01 = [p01[0] + ox, p01[1] + oy, p01[2]];
          const q11 = [p11[0] + ox, p11[1] + oy, p11[2]];
          const q10 = [p10[0] + ox, p10[1] + oy, p10[2]];
          const out = [];
          const ctr = [mx + ox * 0.5, my + oy * 0.5, (p00[2] + p11[2]) / 2];
          const ref = (a, bb, cc) => [
            (a[0] + bb[0] + cc[0]) / 3 - ctr[0],
            (a[1] + bb[1] + cc[1]) / 3 - ctr[1],
            (a[2] + bb[2] + cc[2]) / 3 - ctr[2],
          ];
          const face4 = (a, bb, cc, dd) => {
            tri(out, a, bb, cc, ref(a, bb, cc));
            tri(out, a, cc, dd, ref(a, cc, dd));
          };
          face4(q00, q01, q11, q10); // outer
          face4(p00, p01, p11, p10); // inner
          face4(p00, p01, q01, q00);
          face4(p01, p11, q11, q01);
          face4(p11, p10, q10, q11);
          face4(p10, p00, q00, q10);
          emitMesh(b, ch, list[Math.floor(rnd() * list.length)], out);
        }
      }
    }
  }
}

/**
 * A structural rib standing proud of the loft at longitudinal position `z` —
 * the Combine's frame language carried onto a swept body. `out` is how far it
 * stands off the skin, `thick` its extent along Z. It is a two-station loft of
 * the enlarged section, so it hugs a taper exactly instead of hooping it.
 */
export function loftRib(b, ch, hex, { stations, z, seg = 0, out = 0.08, thick = 0.14 }) {
  const s = sectionAt(stations, z);
  const grow = { w: s.w + out, h: s.h + out, y: s.y, c: s.c };
  loftHull(b, ch, hex, {
    seg,
    stations: [{ ...grow, z: z - thick / 2 }, { ...grow, z: z + thick / 2 }],
  });
}

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
