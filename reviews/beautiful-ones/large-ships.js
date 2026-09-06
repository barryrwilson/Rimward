// Review-gallery concept geometry for the three large Beautiful Ones hulls.
// Proposal-only alternative body plans (approval gate, not production replacements).
// Conventions: forward = -Z, up = +Y, origin near body center, overall span ~8-12 units.

import * as THREE from 'three';
import { materials, surface, ellipsoid, tendril } from './organic.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const gauss = (x, c, w) => Math.exp(-((x - c) * (x - c)) / (2 * w * w));
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// heavy — "Velvet Bastion", cuttlefish shieldback.
// Broad thick oval mantle, layered muscular dorsal swells, a continuous
// undulating fin skirt blended along the whole flank, and a softly folded
// anterior arm crown. Weight comes from living volume, not armour add-ons.
// ---------------------------------------------------------------------------
function buildHeavy() {
  const group = new THREE.Group();
  const M = materials('#8fe8d8');
  const skin = M.skin.clone();
  skin.color.set('#6d64a6'); // satin violet-teal chromatophore field
  skin.roughness = 0.34;
  const belly = M.underside.clone();
  belly.color.set('#c0b2d6'); // lavender pearl underside
  const finMat = M.membrane.clone();
  finMat.color.set('#7f9fce');

  const L = 8.6;
  const z0 = -4.3;
  const shape = (v) => Math.pow(Math.sin(Math.PI * Math.pow(clamp01(v), 1.22)), 0.72);
  const prof = (v) => ({
    z: z0 + v * L,
    rx: 2.75 * shape(v) + 0.02,
    ry: 1.72 * shape(v) + 0.02,
    cy: 0.12 * Math.sin(Math.PI * v),
  });
  // Dense shielding mass grown INTO the mantle: three overlapping muscular
  // dorsal swellings ride the profile itself, so the silhouette stays one
  // continuously differentiable surface with no add-on lumps.
  const dorsalSwell = (v) =>
    0.16 * gauss(v, 0.3, 0.1) + 0.24 * gauss(v, 0.52, 0.13) + 0.18 * gauss(v, 0.74, 0.1);
  const surfPoint = (th, v, k = 1) => {
    const p = prof(v);
    const f = (1 + dorsalSwell(v) * Math.pow(Math.max(0, Math.sin(th)), 2.2)) * k;
    return [Math.cos(th) * p.rx * f, Math.sin(th) * p.ry * f + p.cy, p.z];
  };

  // Countershaded mantle: single coherent tube, two materials meeting at the flank.
  surface(group, (u, v) => surfPoint(u * Math.PI, v), skin, 56, 56);
  surface(group, (u, v) => surfPoint(Math.PI + u * Math.PI, v), belly, 56, 56);

  // Continuous undulating fin skirt; length fades to zero at nose and tail so
  // the pair reads as one membrane blended along the whole body perimeter.
  for (const side of [-1, 1]) {
    surface(
      group,
      (u, v) => {
        const p = prof(v);
        const len = 1.05 * Math.pow(Math.sin(Math.PI * v), 1.25) + 0.002;
        const x = side * (p.rx * 0.97 + len * u);
        // Soft broad ripples with a faint second harmonic; amplitude swells
        // gently toward the free edge so the skirt flows instead of pleating.
        const edge = smooth(0, 1, u);
        const y =
          p.cy +
          edge * (0.22 * Math.sin(v * Math.PI * 9 + side * 0.6 + u * 2.0) + 0.06 * Math.sin(v * Math.PI * 19 + u * 3.1));
        return [x, y, p.z + 0.06 * u * Math.sin(v * Math.PI * 3)];
      },
      finMat,
      22,
      110,
    );
  }

  // Anterior arm crown: eight short arms curling inward and downward like a
  // half-closed flower bud.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.22;
    const pts = [];
    for (let k = 0; k <= 7; k++) {
      const t = k / 7;
      const rad = 0.34 * (1 - 0.72 * t) + 0.1 * Math.sin(t * 2.6);
      pts.push([
        Math.cos(a) * rad,
        Math.sin(a) * rad * 0.85 + 0.05 - 0.38 * t * t,
        -3.86 - 1.55 * (t - 0.42 * Math.pow(t, 2.4)),
      ]);
    }
    tendril(group, pts, 0.13, skin, { tip: 0.02, segments: 40 });
  }

  // Paired feeding tentacles with soft clubs.
  for (const side of [-1, 1]) {
    const pts = [];
    for (let k = 0; k <= 9; k++) {
      const t = k / 9;
      pts.push([
        side * (0.16 + 0.22 * Math.sin(t * 2.4)),
        -0.24 - 0.3 * t + 0.1 * Math.sin(t * 3.0),
        -3.8 - 1.85 * t + 0.3 * t * t,
      ]);
    }
    tendril(group, pts, 0.085, skin, { tip: 0.05, segments: 48 });
    const tip = pts[9];
    ellipsoid(group, [tip[0], tip[1], tip[2] - 0.16], [0.13, 0.13, 0.32], skin);
  }

  // Flush sensory creases on the head flanks (no protruding eye balls).
  for (const side of [-1, 1]) {
    const pts = [];
    for (let s = 0; s <= 6; s++) {
      const t = s / 6;
      const z = -3.45 + 0.6 * t;
      const v = (z - z0) / L;
      const th = (side > 0 ? 0 : Math.PI) + side * (0.62 + 0.18 * Math.sin(t * Math.PI));
      pts.push(surfPoint(th, v, 1.004));
    }
    tendril(group, pts, 0.022, M.dark, { tip: 0.022, segments: 16, sides: 6 });
  }

  // Sparse lateral photophores (threat-display embers, not a light show).
  for (const side of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      const v = 0.3 + k * 0.115;
      const p = surfPoint(side > 0 ? 0 : Math.PI, v, 1.004);
      ellipsoid(group, [p[0], p[1] - 0.15, p[2]], [0.075, 0.075, 0.11], M.glow);
    }
  }
  return group;
}

// ---------------------------------------------------------------------------
// frigate — "Cathedral", deep-sea jellyfish elder guardian.
// A substantial elongated scalloped bell leads along -Z with a serene inner
// sanctuary core, sparse luminous radial canals, frilled oral arms, and long
// flowing tentacles sweeping toward +Z. The mantle dominates the silhouette.
// ---------------------------------------------------------------------------
function buildFrigate() {
  const group = new THREE.Group();
  const M = materials('#9fd8ff');
  const bellMat = M.membrane.clone();
  bellMat.color.set('#aacbea');
  // Opaque transmission tissue: no alpha sorting, inner core glows through.
  bellMat.transparent = false;
  bellMat.opacity = 1;
  bellMat.transmission = 0.32;
  bellMat.thickness = 0.3;
  bellMat.depthWrite = true;
  const frillMat = M.membrane.clone();
  frillMat.color.set('#c3b4e2');
  const tentMat = M.membrane.clone();
  tentMat.color.set('#b6a4d8');
  tentMat.emissive.set('#8fbcd5');
  tentMat.emissiveIntensity = 0.28;

  const LOBES = 10;
  const zApex = -3.0;
  const zRim = 1.7;
  const bellProf = (v) => ({
    z: zApex + v * (zRim - zApex),
    r: Math.max(2.15 * Math.pow(Math.sin((Math.PI / 2) * Math.pow(clamp01(v), 0.78)), 0.9), 0.02),
  });

  // Elongated scalloped bell with soft radial fluting near the rim.
  surface(
    group,
    (u, v) => {
      const th = u * TAU;
      const p = bellProf(v);
      const flute = 1 + 0.055 * Math.sin(th * LOBES) * smooth(0.45, 1, v);
      const scallop = 0.34 * (0.5 + 0.5 * Math.sin(th * LOBES + Math.PI / LOBES)) * smooth(0.72, 1, v);
      return [Math.cos(th) * p.r * flute, Math.sin(th) * p.r * flute, p.z + scallop];
    },
    bellMat,
    100,
    52,
  );

  // Serene inner sanctuary core, glimpsed through the translucent bell.
  ellipsoid(group, [0, -0.05, -0.85], [0.78, 0.82, 1.65], M.warm);
  ellipsoid(group, [0, 0.38, -1.15], [0.42, 0.34, 0.9], M.ridge);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    ellipsoid(group, [Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0.45], [0.17, 0.17, 0.48], M.glow);
  }

  // Sparse radial canals sit just within the skin's surface relief.
  const canalMat = M.glow.clone();
  canalMat.emissiveIntensity = 0.45;
  for (let i = 0; i < LOBES; i++) {
    const a = (i / LOBES) * TAU + Math.PI / LOBES;
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const v = 0.09 + 0.82 * (k / 8);
      const p = bellProf(v);
      const flute = 1 + 0.055 * Math.sin(a * LOBES) * smooth(0.45, 1, v);
      const scallop = 0.34 * (0.5 + 0.5 * Math.sin(a * LOBES + Math.PI / LOBES)) * smooth(0.72, 1, v);
      pts.push([Math.cos(a) * p.r * flute * 1.002, Math.sin(a) * p.r * flute * 1.002, p.z + scallop]);
    }
    tendril(group, pts, 0.025, canalMat, { tip: 0.01, segments: 48, sides: 8 });
  }

  // Frilled oral arms: a soft core limb with a rippled membrane frill.
  const oralPoint = (i, t) => {
    const ph = i * 1.7;
    return [
      0.22 * Math.cos((i * Math.PI) / 2) * (1 - t) + 0.34 * Math.sin(t * 3.1 + ph) * t,
      -0.15 - 0.5 * t + 0.22 * Math.sin(t * 4.3 + ph * 1.3) * t,
      0.9 + 3.2 * t,
    ];
  };
  for (let i = 0; i < 4; i++) {
    const pts = [];
    for (let k = 0; k <= 10; k++) pts.push(oralPoint(i, k / 10));
    tendril(group, pts, 0.085, frillMat, { tip: 0.02, segments: 48 });
    const rot = (i * Math.PI) / 2 + Math.PI / 4;
    surface(
      group,
      (u, v) => {
        const c = oralPoint(i, v);
        const w = (0.05 + 0.26 * Math.sin(Math.PI * Math.min(1, v * 1.12))) * (1 - 0.35 * v);
        const ripple = 0.09 * Math.sin(v * 10 + u * 5 + i * 2.1);
        return [
          c[0] + Math.cos(rot) * (u - 0.5) * 2 * w,
          c[1] + ripple,
          c[2] + Math.sin(rot) * (u - 0.5) * 2 * w,
        ];
      },
      frillMat,
      10,
      40,
    );
  }

  // Nine long flowing tentacles sweeping back past the rim.
  for (let j = 0; j < 9; j++) {
    const a = (j / 9) * TAU + 0.35;
    const h1 = hash(j * 3 + 1);
    const h2 = hash(j * 3 + 2);
    const h3 = hash(j * 3 + 3);
    const len = 4.4 + 0.9 * h1;
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      pts.push([
        Math.cos(a) * (1.55 + 0.35 * Math.sin(Math.PI * t)) + (0.5 + h2 * 0.3) * Math.sin(t * TAU + j * 0.6) * t,
        Math.sin(a) * (1.55 - 0.1 * t) - 0.2 * t + (0.65 + h3 * 0.35) * Math.sin(t * TAU + j * 0.8) * Math.sin(Math.PI * t),
        1.55 + len * t,
      ]);
    }
    tendril(group, pts, 0.065 + 0.02 * h2, tentMat, { tip: 0.008, segments: 88, sides: 12 });
  }

  // Short inner veil tentacles.
  for (let j = 0; j < 6; j++) {
    const a = (j / 6) * TAU + 0.9;
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      pts.push([
        Math.cos(a) * 0.85 * (1 - 0.3 * t) + 0.2 * Math.sin(t * 3 + j),
        Math.sin(a) * 0.85 * (1 - 0.35 * t) - 0.3 * t + 0.08 * Math.sin(t * 4 + j),
        1.4 + 2.3 * t,
      ]);
    }
    tendril(group, pts, 0.03, tentMat, { tip: 0.006, segments: 40, sides: 8 });
  }

  // Delicate fringe hanging between the rim lobes.
  for (let i = 0; i < LOBES; i++) {
    const a = (i / LOBES) * TAU;
    const pts = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      pts.push([
        Math.cos(a) * (2.05 - 0.35 * t) + 0.04 * Math.sin(t * 3 + i),
        Math.sin(a) * (2.05 - 0.35 * t) + 0.04 * Math.cos(t * 2.4 + i),
        1.62 + 0.75 * t,
      ]);
    }
    tendril(group, pts, 0.02, tentMat, { tip: 0.005, segments: 24, sides: 6 });
  }
  return group;
}

// ---------------------------------------------------------------------------
// freighter — "Orchard", mature spaceborne reef gardenback.
// A colossal filter-feeding leviathan grown into a living carrier: one broad
// muscular body with integrated head and tapered tail, great cradle-like
// pectoral shielding folds, and three terraced reef basins whose folded rims,
// terrace steps, and sheltered floors are deformed directly out of the dorsal
// body surface. Sage fan canopies, branching lavender coral with rounded
// joints, and layered mint ribbon beds rise from the basins; recessed nursery
// pockets shelter inside the flank folds at the dorsal transition.
// ---------------------------------------------------------------------------
function buildFreighter() {
  const group = new THREE.Group();
  const M = materials('#8fd8e8');
  const skin = M.skin.clone();
  skin.color.set('#42557e'); // deep indigo leviathan tissue
  const belly = M.underside; // pearl keel
  const finMat = M.membrane.clone();
  finMat.color.set('#546a92');
  const sageMat = M.membrane.clone();
  sageMat.color.set('#93bfa8'); // sage fan canopies
  const mintMat = M.membrane.clone();
  mintMat.color.set('#a8d9c2'); // mint ribbon fronds
  const coralMat = M.membrane.clone();
  coralMat.color.set('#b3a0cf'); // muted lavender reef coral

  const zN = -6.0;
  const zT = 5.6;
  const L = zT - zN;
  const endcap = (v) => Math.pow(Math.sin(Math.PI * Math.pow(clamp01(v), 0.85)), 0.38);
  const prof = (v) => {
    const e = endcap(v);
    return {
      z: zN + v * L,
      rx: (2.4 - 0.7 * v + 0.5 * gauss(v, 0.16, 0.13) - 0.55 * smooth(0.55, 0.95, v)) * e + 0.02,
      ry: (1.3 + 0.45 * gauss(v, 0.42, 0.18) - 0.5 * smooth(0.6, 0.97, v)) * e + 0.02,
      cy: 0.1 * Math.sin(Math.PI * v) - 0.06 * v,
    };
  };

  // Three terraced garden basins folded straight out of the dorsal body: each
  // combines a broad foundation swell, a raised rim ring, an inner terrace
  // step, and a sheltered recessed floor — all one continuous skin.
  const BASINS = [
    { v: 0.34, lv: 0.105, aw: 0.72, rise: 0.14, rim: 0.07, terrace: 0.05, depth: 0.18 },
    { v: 0.54, lv: 0.12, aw: 0.76, rise: 0.20, rim: 0.08, terrace: 0.07, depth: 0.24 },
    { v: 0.73, lv: 0.10, aw: 0.66, rise: 0.12, rim: 0.06, terrace: 0.05, depth: 0.16 },
  ];
  const gardenLift = (th, v) => {
    const dorsal = smooth(0.05, 0.5, Math.sin(th));
    if (dorsal <= 0) return 0;
    let lift = 0;
    for (const b of BASINS) {
      const dV = (v - b.v) / b.lv;
      const dA = (th - Math.PI / 2) / b.aw;
      const r = Math.sqrt(dV * dV + dA * dA);
      if (r > 2.4) continue;
      lift += b.rise * (1 - smooth(0.7, 1.5, r));
      lift += b.rim * gauss(r, 1.0, 0.18);
      lift += b.terrace * gauss(r, 0.55, 0.14);
      lift -= b.depth * (1 - smooth(0.05, 0.8, r));
    }
    return lift * dorsal;
  };

  // Grown flank pleats: soft longitudinal muscle ridges, plus a lateral keel
  // swelling toward the caudal peduncle.
  const ridgeBump = (th, c) => Math.pow(Math.max(0, Math.cos(th - c)), 6);
  const foldScale = (th, v) => {
    const pleat =
      ridgeBump(th, 0.55) + ridgeBump(th, -0.55) + ridgeBump(th, 1.05) + ridgeBump(th, -1.05) +
      ridgeBump(th, Math.PI - 0.55) + ridgeBump(th, -(Math.PI - 0.55)) +
      ridgeBump(th, Math.PI - 1.05) + ridgeBump(th, -(Math.PI - 1.05));
    const mid = ridgeBump(th, 0) + ridgeBump(th, Math.PI);
    const fade = smooth(0.12, 0.3, v) * (1 - smooth(0.78, 0.92, v));
    const keel = 0.13 * gauss(v, 0.86, 0.05);
    return 1 + (0.045 * pleat + 0.035 * mid) * fade + keel * mid;
  };

  // Sheltered crescents are recesses in the body itself. The offset relief
  // raises their upper lip from the same skin; no attached rings or black pods.
  const shelterAt = (th, v) => {
    let weight = 0;
    for (const center of [0.39, 0.57, 0.73]) {
      for (const angle of [1.04, Math.PI - 1.04]) {
        const dv = (v - center) / 0.031;
        const da = (th - angle) / 0.16;
        weight = Math.max(weight, Math.exp(-0.5 * (dv * dv + da * da)));
      }
    }
    return weight;
  };

  const surfPoint = (th, v, k = 1) => {
    const p = prof(v);
    const f = foldScale(th, v) * k;
    const lift = gardenLift(th, v);
    const widen = 1 + 0.12 * lift; // basin foundations broaden the back itself
    const recess = shelterAt(th, v);
    const upperLip = shelterAt(th + (th < Math.PI / 2 ? -0.17 : 0.17), v);
    return [Math.cos(th) * p.rx * f * widen * (1 - 0.07 * recess),
      Math.sin(th) * p.ry * f + p.cy + lift - 0.25 * recess + 0.12 * upperLip, p.z];
  };

  // One coherent body, countershaded at the flank seam; the terraced basins
  // are this same surface, folded upward, rimmed, and recessed.
  skin.color.set('#ffffff');
  skin.vertexColors = true;
  const back = surface(group, (u, v) => surfPoint(u * Math.PI, v), skin, 96, 128);
  const uv = back.geometry.attributes.uv;
  const pigments = new Float32Array(uv.count * 3);
  const indigo = new THREE.Color('#42557e');
  const reefTissue = new THREE.Color('#4f8586');
  const shadow = new THREE.Color('#193344');
  const pigment = new THREE.Color();
  for (let i = 0; i < uv.count; i++) {
    const th = uv.getX(i) * Math.PI;
    const v = uv.getY(i);
    const reef = Math.pow(Math.sin(th), 8) * smooth(0.18, 0.3, v) * (1 - smooth(0.8, 0.9, v));
    pigment.copy(indigo).lerp(reefTissue, reef * 0.55).lerp(shadow, shelterAt(th, v) * 0.75);
    pigment.toArray(pigments, i * 3);
  }
  back.geometry.setAttribute('color', new THREE.BufferAttribute(pigments, 3));
  surface(group, (u, v) => surfPoint(Math.PI + u * Math.PI, v), belly, 72, 72);

  // Great cradle-like pectoral shielding folds: broad cupped sheets grown
  // from the forward flanks, trailing edges rolling upward like sheltering
  // hands; roots buried deep in the flank, tips rounding to nothing.
  for (const side of [-1, 1]) {
    surface(
      group,
      (u, v) => {
        const taper = Math.sqrt(Math.max(0, 1 - Math.pow(u, 1.8))); // rounded outline
        const x = side * (1.55 + 3.5 * Math.pow(u, 0.95));
        const zLead = -3.9 + 2.7 * Math.pow(u, 1.25);
        const chord = 2.4 * taper + 0.001;
        const cup = 0.5 * Math.pow(Math.sin(Math.PI * v), 1.5) * Math.pow(u, 1.2) * taper;
        const rimCurl = 0.55 * Math.pow(v, 2.2) * (0.3 + 0.7 * u) * taper;
        const y = -0.55 - 0.9 * Math.pow(u, 1.7) + 0.3 * Math.sin(Math.PI * u) + rimCurl - cup * 0.35;
        return [x, y, zLead + v * chord];
      },
      finMat,
      32,
      16,
    );
  }

  // Soft caudal flukes grown from the tapered peduncle: rounded crescent
  // blades, upper larger, gentle camber, no squared edges.
  for (const up of [1, -1]) {
    const spanLen = up > 0 ? 2.0 : 1.4;
    surface(
      group,
      (u, v) => {
        const taper = Math.sqrt(Math.max(0, 1 - Math.pow(u, 1.6)));
        const y = up * spanLen * Math.pow(u, 1.05);
        const back = (up > 0 ? 1.6 : 1.2) * Math.pow(u, 1.35);
        const chord = (up > 0 ? 1.15 : 0.95) * taper * (0.3 + 0.7 * Math.sin(Math.PI * u * 0.8)) + 0.001;
        const x = 0.07 * Math.sin(Math.PI * u) * Math.sin(v * Math.PI);
        return [x, y, 5.2 + back + v * chord];
      },
      finMat,
      28,
      12,
    );
  }

  // Garden growth helpers. Everything roots through surfPoint, so attachment
  // follows the folded basin surface exactly — nothing floats or glues on.
  const fan = (th, v, { w, h, lean = 0.3, phase = 0, lobes = 5, mat = sageMat }) => {
    const root = surfPoint(th, v, 0.97);
    const yaw = phase * 0.83;
    const fanPoint = (u, t) => {
      const angle = (u - 0.5) * 2.65;
      const reach = t * (1 + 0.075 * Math.sin(angle * lobes + phase) * t * t);
      const x = w * Math.sin(angle) * reach;
      const z = lean * t + 0.25 * Math.cos(angle * 2.4 + phase) * t * t + 0.24 * t * t * t;
      const ribs = 0.045 * Math.cos(angle * 14) * t * (1 - 0.35 * t);
      return [root[0] + x * Math.cos(yaw) + z * Math.sin(yaw),
        root[1] + h * (0.18 + 0.82 * Math.cos(angle)) * reach + ribs,
        root[2] - x * Math.sin(yaw) + z * Math.cos(yaw)];
    };
    const tissue = mat.clone();
    tissue.vertexColors = true;
    const canopy = surface(group, fanPoint, tissue, 54, 32);
    const coords = canopy.geometry.attributes.uv;
    const colors = new Float32Array(coords.count * 3);
    for (let i = 0; i < coords.count; i++) {
      const t = coords.getY(i);
      const ribs = 0.06 * Math.cos((coords.getX(i) - 0.5) * 2.65 * 14);
      colors[i * 3] = 0.48 + t * 0.5 + ribs;
      colors[i * 3 + 1] = 0.67 + t * 0.31 + ribs * 0.4;
      colors[i * 3 + 2] = 0.62 + t * 0.34;
    }
    canopy.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  };

  const ribbon = (th, v, { h, lean = 0.3, phase = 0, w0 = 0.17, curl = 0.45, mat = mintMat }) => {
    const root = surfPoint(th, v, 0.985);
    surface(
      group,
      (u, t) => {
        const width =
          w0 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.05 + 0.95 * t)), 0.6) * (1 - 0.8 * smooth(0.65, 1, t));
        const sway = 0.1 * Math.sin(t * 3.6 + phase) * t;
        const tipCurl = curl * Math.pow(smooth(0.55, 1, t), 2); // leaf tip rolls forward
        return [
          root[0] + (u - 0.5) * 2 * width + sway,
          root[1] + t * h - 0.3 * tipCurl * tipCurl,
          root[2] + lean * t + tipCurl,
        ];
      },
      mat,
      10,
      12,
    );
  };

  const coral = (th, v, seed, scale = 1) => {
    const root = surfPoint(th, v, 0.985);
    const h = (0.55 + 0.25 * hash(seed)) * scale;
    const mid = [root[0] + 0.14 * (hash(seed + 3) - 0.5), root[1] + h * 0.55, root[2] + 0.06 + 0.06 * hash(seed + 2)];
    const top = [root[0] + 0.2 * (hash(seed + 1) - 0.5), root[1] + h, root[2] + 0.14 + 0.08 * hash(seed + 7)];
    tendril(
      group,
      [root, [(root[0] + mid[0]) / 2, root[1] + h * 0.3, (root[2] + mid[2]) / 2], mid, top],
      0.085 * scale,
      coralMat,
      { tip: 0.05 * scale, segments: 18, sides: 8 },
    );
    ellipsoid(group, top, [0.09 * scale, 0.085 * scale, 0.09 * scale], coralMat); // rounded crown tip
    for (const s of [-1, 1]) {
      const bh = h * (0.4 + 0.15 * hash(seed + 4 + s));
      const bt = [mid[0] + s * (0.22 + 0.14 * hash(seed + 5 + s)), mid[1] + bh, mid[2] + 0.1 * (hash(seed + 6 + s) - 0.3)];
      tendril(
        group,
        [mid, [(mid[0] + bt[0]) / 2, mid[1] + bh * 0.6, (mid[2] + bt[2]) / 2], bt],
        0.05 * scale,
        coralMat,
        { tip: 0.035 * scale, segments: 12, sides: 8 },
      );
      ellipsoid(group, bt, [0.075 * scale, 0.07 * scale, 0.075 * scale], coralMat); // rounded branch tip
    }
  };

  // Mature reef canopy: three contiguous but distinct gardens, with an open
  // central channel and growth spilling down the shielding flanks. Fans are
  // rooted at different angles so they read as a habitat, not a row of flags.
  for (let b = 0; b < BASINS.length; b++) {
    const basin = BASINS[b];
    const maturity = b === 1 ? 1.12 : b === 0 ? 1 : 0.85;
    for (let j = 0; j < 6; j++) {
      const side = j % 2 === 0 ? -1 : 1;
      const angle = Math.PI / 2 + side * (0.22 + 0.13 * (j % 3));
      const v = basin.v + (Math.floor(j / 2) - 1) * basin.lv * 0.62;
      fan(angle, v, {
        w: (0.88 + 0.25 * hash(b * 29 + j)) * maturity,
        h: (1.22 + 0.48 * hash(b * 43 + j + 8)) * maturity,
        lean: 0.28 + 0.22 * hash(j + b * 17),
        phase: b * 1.8 + j * 1.13,
        lobes: 5 + (j % 3),
        mat: (j + b) % 4 === 0 ? coralMat : (j % 3 === 0 ? mintMat : sageMat),
      });
    }
    for (let j = 0; j < 3; j++) {
      const angle = Math.PI / 2 + (j - 1) * 0.38;
      const v = basin.v + (j % 2 === 0 ? 0.035 : -0.03);
      coral(angle, v, 17 + b * 37 + j * 13, maturity * (1.3 + 0.2 * j));
    }
    for (let j = 0; j < 4; j++) {
      const side = j % 2 === 0 ? -1 : 1;
      ribbon(Math.PI / 2 + side * (0.45 + 0.13 * Math.floor(j / 2)),
        basin.v + (Math.floor(j / 2) - 0.5) * basin.lv, {
          h: (1.1 + 0.22 * j) * maturity, w0: 0.25 + 0.025 * j,
          lean: 0.38 + j * 0.08, phase: b * 2.1 + j * 1.6, curl: 0.75,
        });
    }
  }

  // Sparse constellations of pearl light along the lower flanks, kept well
  // clear of the gardens.
  const rowAngles = [0.45, 0.8];
  for (const side of [1, -1]) {
    for (let r = 0; r < rowAngles.length; r++) {
      const th = side > 0 ? rowAngles[r] : Math.PI - rowAngles[r];
      for (let k = 0; k < 4; k++) {
        const v = 0.2 + (k / 3) * 0.55 + 0.02 * Math.sin(k * 2.3 + r * 4);
        const s = 0.045 + 0.02 * hash(r * 31 + k * 7 + (side > 0 ? 0 : 3));
        ellipsoid(group, surfPoint(th, v, 1.004), [s, s, s * 1.4], M.glow);
      }
    }
  }

  // Fine ventral grooves sweeping along the pearl keel.
  for (const side of [1, -1]) {
    for (const thOff of [0.35, 0.62]) {
      const pts = [];
      for (let s = 0; s <= 10; s++) {
        const v = 0.14 + (s / 10) * 0.6;
        pts.push(surfPoint(Math.PI + side * thOff + side * 0.05 * Math.sin(v * 9), v, 1.003));
      }
      tendril(group, pts, 0.014, M.dark, { tip: 0.01, segments: 24, sides: 6 });
    }
  }

  // Gill folds, small deep-set eyes, and the wide filter-feeding mouth seam.
  for (const side of [1, -1]) {
    for (let k = 0; k < 3; k++) {
      const v = (-3.4 + k * 0.42 - zN) / L;
      const pts = [];
      for (let s = 0; s <= 6; s++) {
        const th = (side > 0 ? 0 : Math.PI) + side * (0.12 + (s / 6) * 0.55);
        pts.push(surfPoint(th, v, 1.004));
      }
      tendril(group, pts, 0.026, M.dark, { tip: 0.026, segments: 16, sides: 6 });
    }
    const eyeTh = side > 0 ? 0.42 : Math.PI - 0.42;
    const eyeV = (-4.35 - zN) / L;
    ellipsoid(group, surfPoint(eyeTh, eyeV, 1.01), [0.09, 0.08, 0.06], M.dark);
    ellipsoid(group, surfPoint(eyeTh, eyeV, 1.02), [0.035, 0.03, 0.025], M.glow);
  }
  tendril(
    group,
    [
      [-1.5, -0.62, -5.0],
      [-0.75, -0.7, -5.25],
      [0, -0.74, -5.3],
      [0.75, -0.7, -5.25],
      [1.5, -0.62, -5.0],
    ],
    0.05,
    M.dark,
    { tip: 0.05, segments: 24, sides: 6 },
  );
  return group;
}

const BUILDERS = { heavy: buildHeavy, frigate: buildFrigate, freighter: buildFreighter };

export function buildLargeShip(id) {
  const build = BUILDERS[id];
  if (!build) throw new Error(`large-ships.js: unknown large ship id "${id}"`);
  return build();
}
