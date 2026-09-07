// reviews/beautiful-ones/small-ships.js
// Organic concept hulls for the four small Beautiful Ones ships.
// Conventions: forward = -Z, up = +Y, origin near body centre, overall span ~8-12 units.
// All forms are smoothly blended parametric volumes; every extremity is tapered/rounded.

import * as THREE from 'three';
import { materials, surface, ellipsoid, tendril } from './organic.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const n3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

// Rounded organic tube following a mostly z-aligned axis curve.
// radiusAt must approach 0 at both ends; the tiny floor keeps pole normals finite
// and the residual pinhole (<2cm at this scale) is invisible under studio light.
function tube(group, axisAt, radiusAt, material, { uSeg = 44, vSeg = 72, sx = 1, sy = 1, floor = 0.015 } = {}) {
  return surface(group, (u, v) => {
    const a = axisAt(v);
    const r = Math.max(radiusAt(v), floor);
    const th = u * TAU;
    return [a[0] + Math.cos(th) * r * sx, a[1] + Math.sin(th) * r * sy, a[2]];
  }, material, uSeg, vSeg);
}

// Weld the duplicated wrap rows (v=0 and v=1) of a closed surface by averaging
// their normals, so the leading-edge seam shades as one continuous rim.
function weldSeamRows(mesh, uSegments, vSegments) {
  const n = mesh.geometry.getAttribute('normal');
  const stride = vSegments + 1;
  for (let i = 0; i <= uSegments; i++) {
    const a = i * stride;
    const b = a + vSegments;
    const nx = (n.getX(a) + n.getX(b)) * 0.5;
    const ny = (n.getY(a) + n.getY(b)) * 0.5;
    const nz = (n.getZ(a) + n.getZ(b)) * 0.5;
    const l = Math.hypot(nx, ny, nz) || 1;
    n.setXYZ(a, nx / l, ny / l, nz / l);
    n.setXYZ(b, nx / l, ny / l, nz / l);
  }
  n.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// player — VEILRAY (manta ray)
// One closed dorsoventrally flattened wing/body volume: crescent planform with
// a thick lens cross-section (deep belly, domed back), margins meeting at the
// leading and trailing edges, tips curled up, trailing-edge ripple.
// Curled cephalic lobes grown from the front margin, whip tail, dorsal ridge.
// ---------------------------------------------------------------------------
function buildVeilray() {
  const g = new THREE.Group();
  const M = materials('#88dece');
  const SPAN = 5.6;
  // Crescent planform: leading edge sweeps aft, trailing edge curves in to meet
  // it exactly at the wingtips (chord -> 0 at |s| = 1, so no folded tip).
  const zLead = (s) => -3.3 + 2.5 * Math.pow(Math.abs(s), 1.6);
  const zTrail = (s) => 2.3 - 3.1 * Math.pow(Math.abs(s), 1.25);
  // Full-bodied lens cross-section: domed back and deep belly meeting at the
  // margins (~0.8 thick amidships) — a closed volume, never a paper sheet.
  const topY = (s, t) => {
    const a = Math.abs(s);
    const chord = Math.pow(Math.max(0, Math.sin(Math.PI * clamp01(t))), 0.7);
    let y = 0.42 * Math.pow(Math.max(0, 1 - a), 1.05) * chord;              // dorsal dome
    y += 0.34 * Math.pow(a, 2.6);                                            // tips curl up
    y += 0.05 * Math.sin(t * 16 + a * 5) * Math.pow(a, 1.4) * Math.max(0, t - 0.45); // aft ripple
    return y;
  };
  const bellyY = (s, t) => {
    const a = Math.abs(s);
    const chord = Math.pow(Math.max(0, Math.sin(Math.PI * clamp01(t))), 0.75);
    return -0.40 * Math.pow(Math.max(0, 1 - a), 1.15) * chord + 0.34 * Math.pow(a, 2.6);
  };
  // v wraps the chord cross-section: 0 = leading edge, 0.25 = back, 0.5 =
  // trailing edge, 0.75 = belly, 1 = leading edge again (seam welded below).
  const body = (u, v) => {
    const s = u * 2 - 1;
    const wrapped = v * 2;
    const top = wrapped <= 1;
    const t = top ? wrapped : 2 - wrapped;
    return [s * SPAN, top ? topY(s, t) : bellyY(s, t), lerp(zLead(s), zTrail(s), t)];
  };
  weldSeamRows(surface(g, body, M.skin, 140, 64), 140, 64);

  // Curled cephalic lobes — grown from the front margin, curling forward/down/in.
  for (const side of [-1, 1]) {
    const tip = [side * 0.30, -0.30, -4.18];
    tendril(g, [
      [side * 0.55, 0.02, -2.95],
      [side * 0.78, -0.10, -3.55],
      [side * 0.72, -0.26, -4.05],
      [side * 0.48, -0.34, -4.28],
      tip,
    ], 0.19, M.skin, { tip: 0.02, segments: 48 });
    ellipsoid(g, tip, [0.055, 0.045, 0.075], M.warm); // lobe-tip light organ
  }

  // Whip tail and a low dorsal ridge seated on the dome.
  tendril(g, [
    [0, 0.02, 2.10], [0.05, 0.04, 3.3], [-0.06, -0.03, 4.5], [0.05, 0.02, 5.7], [0, 0.08, 6.6],
  ], 0.10, M.skin, { tip: 0.004, segments: 110 });
  tendril(g, [
    [0, 0.26, -2.2], [0, 0.38, -0.9], [0, 0.37, 0.3], [0, 0.15, 1.8], [0, 0.05, 2.3],
  ], 0.045, M.ridge, { tip: 0.015, segments: 48 });

  // Sparse luminous marginal markings along the leading edge + wingtip dots.
  for (const side of [-1, 1]) {
    for (const s of [0.30, 0.55, 0.80]) {
      const t = 0.15 / (zTrail(s) - zLead(s));
      ellipsoid(g, [side * s * SPAN, topY(s, t) + 0.02, zLead(s) + 0.15], [0.06, 0.03, 0.14], M.glow);
    }
    ellipsoid(g, [side * 0.965 * SPAN, 0.32, zLead(0.965) + 0.1], [0.05, 0.03, 0.10], M.glow);
  }
  ellipsoid(g, [0, 0.10, 2.55], [0.05, 0.03, 0.10], M.glow); // tail-base photophore
  return g;
}

// ---------------------------------------------------------------------------
// light — GLASSFIN (pelagic ribbonfish)
// Fusiform, laterally compressed young wayfinder held in a gentle S-spine:
// blunt integrated sensory prow, trunk narrowing to a drawn-out caudal
// peduncle. A long undulating dorsal ribbon rides the whole back, a short
// ventral fin hangs amidships, and the tail is a deeply forked pair of
// sweeping vertical lobes. Small low-set rounded pectoral fins, flush gill
// folds embedded in the flank, sparse lateral-line photophores. Pearl belly
// grading to a teal/indigo back — nothing winged, stalked, or insectoid.
// ---------------------------------------------------------------------------
function buildGlassfin() {
  const g = new THREE.Group();
  const M = materials('#5fc2c9');

  // Body: compressed deep trunk on a gently undulating S-axis; blunt rise at
  // the prow, long taper into the peduncle.
  const axisAt = (t) => [
    0.26 * Math.sin((t * 1.1 - 0.12) * Math.PI),
    -0.06 + 0.20 * Math.sin(t * Math.PI * 0.85),
    -4.6 + 9.6 * t,
  ];
  const radAt = (t) => 1.02 * Math.pow(Math.sin(Math.PI * Math.pow(clamp01(t), 0.72)), 0.62);
  const bodyAt = (t, th, lift = 1) => {
    const a = axisAt(t);
    const r = Math.max(radAt(t), 0.02) * lift;
    return [a[0] + Math.cos(th) * r * 0.40, a[1] + Math.sin(th) * r, a[2]];
  };
  const bodyMaterial = M.skin.clone();
  bodyMaterial.color.set('#ffffff');
  bodyMaterial.vertexColors = true;
  const body = tube(g, axisAt, radAt, bodyMaterial, { uSeg: 48, vSeg: 96, sx: 0.40, sy: 1.0, floor: 0.02 });
  // Countershading belongs to the skin, not to extra shell-like sheets.
  const uv = body.geometry.attributes.uv;
  const colors = new Float32Array(uv.count * 3);
  const flank = new THREE.Color('#3c9c9d');
  const dorsal = new THREE.Color('#1c4766');
  const belly = new THREE.Color('#bbdbcf');
  const color = new THREE.Color();
  for (let i = 0; i < uv.count; i++) {
    const height = Math.sin(uv.getX(i) * TAU);
    color.copy(flank).lerp(height > 0 ? dorsal : belly, Math.pow(Math.abs(height), 0.7));
    color.toArray(colors, i * 3);
  }
  body.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Flush sensory pores half-buried low on the prow — embedded, never stalked.
  for (const side of [-1, 1]) {
    const p = bodyAt(0.025, side > 0 ? -0.28 : Math.PI + 0.28, 1.005);
    ellipsoid(g, p, [0.018, 0.016, 0.025], M.warm);
  }

  // Gill folds: four slim dark pleats lying flush in each flank behind the prow.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const t = 0.085 + i * 0.026;
      const points = [];
      for (let j = 0; j <= 8; j++) {
        const a = -0.72 + j / 8 * 1.44;
        const th = side > 0 ? a : Math.PI - a;
        points.push(bodyAt(t + 0.012 * Math.sin(a), th, 1.004));
      }
      tendril(g, points, 0.009, M.dark, { tip: 0.005, segments: 28, sides: 6 });
    }
  }

  // Lateral line: sparse photophores riding the mid-flank seam.
  for (const side of [-1, 1]) {
    for (const t of [0.20, 0.33, 0.46, 0.59, 0.72, 0.85]) {
      const p = bodyAt(t, side > 0 ? 0 : Math.PI, 1.03);
      ellipsoid(g, [p[0], p[1] + 0.04, p[2]], [0.035, 0.028, 0.075], M.glow);
    }
  }

  // Dorsal ribbon: rooted just behind the prow, running the back to the
  // peduncle; free edge softly undulating, leaning further aft toward its margin.
  const ribbonH = (s) => 1.35 * Math.pow(Math.sin(Math.PI * s), 0.7) * (1 - 0.45 * s);
  surface(g, (u, v) => {
    const t = lerp(0.055, 0.985, u);
    const base = bodyAt(t, Math.PI / 2, 0.94);
    const h = ribbonH(u);
    const wave = 0.14 * Math.sin(u * Math.PI * 5.2 + v * 2.1) * v * v * Math.sin(Math.PI * u);
    const camber = 0.06 * Math.sin(Math.PI * v) * Math.sin(u * Math.PI * 1.1);
    return [base[0] + camber, base[1] + v * h + wave, base[2] + 0.5 * v * h];
  }, M.membrane, 110, 16);
  // Sparse photophores sprinkled along the ribbon's root.
  for (const u of [0.25, 0.5, 0.75]) {
    const p = bodyAt(lerp(0.055, 0.985, u), Math.PI / 2, 1.0);
    ellipsoid(g, [p[0] + 0.055, p[1] + 0.05, p[2]], [0.04, 0.03, 0.07], M.glow);
  }

  // Ventral fin: short, low, swept aft, dying out before the peduncle.
  surface(g, (u, v) => {
    const t = lerp(0.40, 0.88, u);
    const base = bodyAt(t, Math.PI * 1.5, 0.94);
    const h = 0.52 * Math.pow(Math.sin(Math.PI * u), 0.75);
    const wave = 0.06 * Math.sin(u * Math.PI * 3.0 + v) * v * Math.sin(Math.PI * u);
    return [base[0], base[1] - v * h - wave, base[2] + 0.42 * v * h];
  }, M.membrane, 44, 10);

  // Forked caudal: two sweeping vertical lobes off the peduncle tip, each
  // rooted narrow, broad mid-chord, closing to a soft rounded tip — no slabs.
  const ped = axisAt(0.965);
  const tailLobe = (dir, len, rise) => (u, v) => {
    const cx = ped[0] + 0.05 * Math.sin(Math.PI * u);
    const cy = ped[1] + dir * rise * Math.pow(u, 1.3);
    const cz = ped[2] + len * u;
    const dyd = dir * rise * 1.3 * Math.pow(Math.max(u, 0.02), 0.3);
    const pl = Math.hypot(len, dyd) || 1;
    const pY = len / pl;
    const pZ = -dyd / pl;
    const w = 0.92 * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * u)), 0.85);
    const camber = 0.06 * Math.sin(Math.PI * v) * Math.sin(Math.PI * u);
    return [cx + camber, cy + (v - 0.5) * w * pY, cz + (v - 0.5) * w * pZ];
  };
  const upperLobe = tailLobe(1, 2.45, 1.62);
  const lowerLobe = tailLobe(-1, 2.20, 1.38);
  surface(g, upperLobe, M.membrane, 56, 14);
  surface(g, lowerLobe, M.membrane, 56, 14);
  // A slim reinforcing ray along each lobe's leading (outer) edge.
  for (const [fn, edge] of [[upperLobe, 1], [lowerLobe, 0]]) {
    const pts = [0.18, 0.42, 0.66, 0.88, 0.99].map((t) => fn(t, edge));
    tendril(g, pts, 0.030, M.ridge, { tip: 0.007, segments: 40, sides: 8 });
  }

  // Pectoral fins: small, low-set, rounded, swept back along the flank.
  for (const side of [-1, 1]) {
    surface(g, (u, v) => {
      const a = axisAt(0.30);
      const r = radAt(0.30);
      const cx = a[0] + side * (r * 0.40 * 0.96 + 0.58 * u + 0.10 * Math.sin(Math.PI * u));
      const cy = a[1] - r * 0.52 - 0.34 * u - 0.05 * Math.sin(Math.PI * u);
      const cz = a[2] + 1.30 * u;
      const w = 0.60 * Math.pow(Math.sin(Math.PI * (0.10 + 0.90 * u)), 0.8);
      const cd = n3([side * 0.10, 0.38, 0.92]);
      return [cx + (v - 0.5) * w * cd[0], cy + (v - 0.5) * w * cd[1], cz + (v - 0.5) * w * cd[2]];
    }, M.membrane, 30, 12);
  }

  return g;
}

// ---------------------------------------------------------------------------
// ace — NEEDLEWAKE (reef squid)
// Long sleek mantle tapering to a soft point aft; a continuous fin skirt
// wraps the rear two-thirds and ripples around its margin; forward head
// carries eight S-curved arms in a funnel cluster plus two longer sensory
// streamers. Predator-forward silhouette, no rocket tube, no straight rods.
// ---------------------------------------------------------------------------
function buildNeedlewake() {
  const g = new THREE.Group();
  const M = materials('#94b7f0');

  const axisAt = (t) => [0, 0.12 * Math.sin(Math.PI * t), -1.7 + 6.3 * t];
  const radAt = (t) => 0.85 * Math.pow(Math.sin(Math.PI * clamp01(t * 1.02)), 0.75);
  tube(g, axisAt, radAt, M.skin, { uSeg: 48, vSeg: 96, sy: 0.92 });

  // Head volume blending into the mantle front; arms root inside it.
  ellipsoid(g, [0, 0.03, -2.15], [0.60, 0.54, 1.00], M.skin);

  // Two lateral fins: broad fleshy ribbons growing off the rear mantle flanks,
  // swept aft with undulating margins, closing to a rounded point at the tail.
  for (const side of [-1, 1]) {
    surface(g, (u, v) => {
      const t = 0.32 + 0.66 * v;
      const a = axisAt(t);
      const r = Math.max(radAt(t), 0.02);
      // Fin length along the mantle: swells mid-fin, shuts at both ends.
      const fLen = 1.55 * Math.pow(Math.sin(Math.PI * v), 0.8)
        * (1 + 0.07 * Math.sin(v * 13 + side));
      const wave = (fLen / 1.55) * u;
      const x = a[0] + side * (r * 0.85 + fLen * u);
      const y = a[1] + (0.10 * u + 0.22 * u * u) * fLen / 1.55 + 0.16 * Math.sin(v * 7 + u * 2.5 + side * 2) * wave;
      const z = a[2] + u * fLen * 0.55; // progressive aft sweep toward the margin
      return [x, y, z];
    }, M.membrane, 40, 72);
  }

  // Eight arms: each an individual S-curve, flaring then recurving inward
  // into a funnel cluster ahead of the head.
  for (let k = 0; k < 8; k++) {
    const th = (k / 8) * TAU + 0.22;
    const wob = 0.12 * Math.sin(k * 2.7);
    const lenK = 1 + 0.07 * Math.sin(k * 2.3);
    const P = (r, dth, z) => [
      r * Math.cos(th + dth),
      r * Math.sin(th + dth) * 0.92 + 0.02,
      z * lenK,
    ];
    tendril(g, [
      P(0.30, 0.00, -2.75),
      P(0.58, 0.12, -3.45),
      P(0.72, 0.30 + wob, -4.15),
      P(0.60, 0.52 + wob, -4.70),
      P(0.34, 0.72 + wob, -5.00 - 0.15 * Math.sin(k * 1.9)),
    ], 0.085, M.skin, { tip: 0.013, segments: 64 });
  }

  // Two longer sensory streamers with a gentle travelling wave, warm tips.
  for (const side of [-1, 1]) {
    const pts = [];
    for (let j = 0; j <= 6; j++) {
      const t = j / 6;
      pts.push([
        side * (0.28 + 1.15 * t) + 0.12 * Math.sin(t * 8 + side * 2),
        0.28 + 0.55 * t + 0.10 * Math.sin(t * 6 + side),
        -2.6 - 3.7 * t,
      ]);
    }
    tendril(g, pts, 0.05, M.skin, { tip: 0.006, segments: 110 });
    ellipsoid(g, pts[6], [0.05, 0.04, 0.07], M.warm);
  }

  // Sparse lateral-line photophores along the mantle flanks.
  for (const side of [-1, 1]) {
    for (const t of [0.24, 0.42, 0.60, 0.78]) {
      const a = axisAt(t);
      ellipsoid(g, [side * (radAt(t) + 0.01), a[1], a[2]], [0.05, 0.04, 0.11], M.glow);
    }
  }
  return g;
}

// ---------------------------------------------------------------------------
// cutter — BLUE PILGRIM (blue glaucus sea slug)
// Slender flattened sinuous trunk with a soft forward prow and rhinophores;
// three bilateral tiers of cerata — thick rooted stalks fanning
// cups into a guardian cradle, the aft tier sweeps back. A soft lens-shaped
// belly pouch shelters the ventral seam. No starfish ball, no hard fixtures.
// ---------------------------------------------------------------------------
function buildBluePilgrim() {
  const g = new THREE.Group();
  const M = materials('#83cceb');

  const axisAt = (t) => [
    0.22 * Math.sin(t * Math.PI * 1.1 + 0.3),
    0.12 * Math.sin(t * TAU + 1.0),
    -4.5 + 8.4 * t,
  ];
  const radAt = (t) => 0.56 * Math.pow(Math.sin(Math.PI * clamp01(t)), 0.52)
    * (0.92 + 0.85 * Math.exp(-Math.pow((t - 0.09) / 0.10, 2)));
  tube(g, axisAt, radAt, M.skin, { uSeg: 40, vSeg: 84, sx: 1.15, sy: 0.55 });

  // The broad sensory prow is part of the trunk, not a separate head capsule.
  for (const side of [-1, 1]) {
    tendril(g, [
      [side * 0.10, 0.26, -3.75], [side * 0.17, 0.44, -4.10], [side * 0.13, 0.52, -4.40],
    ], 0.040, M.skin, { tip: 0.008, segments: 32 });
  }

  // Three cerata tiers per side. Front tier is the guardian cradle: fingers
  // sweep low and forward, then hook gently inward to shelter the prow —
  // cupped, never weaponised. Mid tier lateral, aft tier swept back.
  const tiers = [
    { t: 0.26, len: 2.20, n: 6, r: 0.130, cradle: true },
    { t: 0.50, len: 1.85, n: 5, r: 0.115, sweep: -0.1 },
    { t: 0.74, len: 1.50, n: 5, r: 0.100, sweep: 0.8 },
  ];
  for (const side of [-1, 1]) {
    for (const tier of tiers) {
      const a = axisAt(tier.t);
      const rr = radAt(tier.t);
      const B = [a[0] + side * rr * 1.0, a[1] + rr * 0.3, a[2]];          // root buried in flank
      const R = [B[0] + side * 0.70, B[1] + (tier.cradle ? 0.30 : 0.50), B[2] - 0.05]; // fan origin
      // Each finger grows from inside the body and follows the same soft root
      // before branching. No separate capped stalk or cuff at the fan junction.

      const mid = Math.floor(tier.n / 2);
      for (let j = 0; j < tier.n; j++) {
        const f = (j / (tier.n - 1)) - 0.5; // -0.5 .. 0.5 across the fan
        const L = tier.len * (1 - 0.22 * Math.abs(f));
        let tip;
        const pts = [
          [B[0] - side * 0.15, B[1] - 0.08, B[2] + f * 0.05],
          [B[0] + side * 0.36, B[1] + 0.19, B[2] - 0.06],
          R,
        ];
        if (tier.cradle) {
          // Low forward fan that dips, then hooks inward — a cupped shelter.
          const dir = n3([side * (0.95 + 0.25 * Math.abs(f)), 0.10 + 0.35 * f, -0.55 + 1.0 * f]);
          pts.push([R[0] + dir[0] * L * 0.36, R[1] + dir[1] * L * 0.36 - 0.06, R[2] + dir[2] * L * 0.36]);
          pts.push([R[0] + dir[0] * L * 0.70, R[1] + dir[1] * L * 0.70 - 0.20, R[2] + dir[2] * L * 0.70 + 0.02]);
          tip = [R[0] + dir[0] * L - side * 0.34, R[1] + dir[1] * L - 0.05, R[2] + dir[2] * L + 0.06];
        } else {
          const dir = n3([side * (0.85 + 0.30 * Math.abs(f)), 0.55 + 0.30 * f, tier.sweep + 1.0 * f]);
          pts.push([R[0] + dir[0] * L * 0.36, R[1] + dir[1] * L * 0.36 + 0.10, R[2] + dir[2] * L * 0.36]);
          pts.push([R[0] + dir[0] * L * 0.70 + side * 0.05, R[1] + dir[1] * L * 0.70 + 0.22, R[2] + dir[2] * L * 0.70 + 0.04]);
          tip = [R[0] + dir[0] * L, R[1] + dir[1] * L + 0.26, R[2] + dir[2] * L + 0.10];
        }
        pts.push(tip);
        tendril(g, pts, tier.r * 1.6, M.skin, { tip: 0.012, segments: 72, sides: 16 });
        if (j === mid) ellipsoid(g, tip, [0.05, 0.045, 0.06], M.warm); // one lit finger per cluster
      }
    }
  }

  // Soft belly pouch: a lens-shaped membrane swelling off the front belly.
  // Edges land flush on the trunk all around; both ends taper shut — no plates.
  surface(g, (u, v) => {
    const t = 0.12 + 0.44 * v;
    const a = axisAt(t);
    const r = Math.max(radAt(t), 0.03);
    const phi = (u * 2 - 1) * 0.95;                     // across the belly width
    const endTaper = Math.pow(Math.sin(Math.PI * clamp01(v)), 0.6);
    const x = a[0] + Math.sin(phi) * r * 1.15;
    const yBelly = a[1] - Math.cos(phi) * r * 0.55;
    const dip = 0.30 * endTaper * Math.pow(Math.sin(Math.PI * u), 1.2);
    return [x, yBelly - dip, a[2]];
  }, M.membrane, 40, 44);

  // Sparse luminous seam riding the pouch, then the open belly aft of it.
  for (const t of [0.24, 0.36, 0.48]) {
    const a = axisAt(t);
    const v = (t - 0.12) / 0.44;
    const dip = 0.30 * Math.pow(Math.sin(Math.PI * clamp01(v)), 0.6);
    ellipsoid(g, [a[0], a[1] - radAt(t) * 0.55 - dip - 0.02, a[2]], [0.04, 0.025, 0.075], M.glow);
  }
  for (const t of [0.64, 0.78, 0.90]) {
    const a = axisAt(t);
    ellipsoid(g, [a[0], a[1] - radAt(t) * 0.55 - 0.01, a[2]], [0.04, 0.025, 0.075], M.glow);
  }
  return g;
}

const BUILDERS = {
  player: buildVeilray,
  light: buildGlassfin,
  ace: buildNeedlewake,
  cutter: buildBluePilgrim,
};

export function buildSmallShip(id) {
  const builder = BUILDERS[id];
  if (!builder) throw new Error(`buildSmallShip: unknown small ship id "${id}"`);
  const group = builder();
  group.name = `concept-${id}`;
  return group;
}
