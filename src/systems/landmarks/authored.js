import * as THREE from 'three';
import {
  TAU, EMPTY, poiRand, tagPiece, makeAssembler, hullMat, emitMat,
  factionPalette, makeHalo, attachMerged, markAuthored, industrialGlow,
} from './kit.js';
import { addBeaconRig, addAnomalyCore } from './kinds.js';

function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
function cyl(rt, rb, h, seg = 8) { return new THREE.CylinderGeometry(rt, rb, h, seg); }
function sph(r, w = 8, hs = 6) { return new THREE.SphereGeometry(r, w, hs); }
function tet(r) { return new THREE.TetrahedronGeometry(r); }
function cone(r, h, seg = 8) { return new THREE.ConeGeometry(r, h, seg); }
function torus(r, t, rs = 6, ts = 12, arc = Math.PI * 2) {
  return new THREE.TorusGeometry(r, t, rs, ts, arc);
}

function matsFor(h, pal) {
  return {
    hull: hullMat(h, { roughness: Math.max(pal.roughness, 0.62), metalness: pal.metalness }),
    trim: hullMat(h, { roughness: 0.5, metalness: pal.metalness }),
    stone: hullMat(h, { roughness: 0.9, metalness: 0.1 }),
    emit: emitMat(h, { intensity: 1.15 }),
  };
}

function dimColor(h, def, mats, extra = []) {
  const colors = [];
  for (const m of extra) colors.push({ mat: m, base: m.color.clone() });
  for (const k of ['hull', 'trim', 'stone']) {
    if (mats[k]) colors.push({ mat: mats[k], base: mats[k].color.clone() });
  }
  return h.registerDimmable(def.id, 'visited',
    mats.emit ? [{ mat: mats.emit, base: mats.emit.emissiveIntensity }] : EMPTY,
    colors);
}

function addShepherdFamily(as, pal, ox, oz, {
  height, dishYaw, lampHex, cageHex, frost, replyMast = false, plaque = true,
}) {
  const { lampY } = addBeaconRig(as, pal, ox, 0, oz, {
    height, dishTilt: 0.55, dishYaw, lampHex, cageHex, frost,
  });
  // Extra nested dishes — the lane antenna stack.
  const top = height;
  as.add('trim', cyl(2.4, 2.4, 0.14, 12), pal.weather(pal.trim, 1), {
    x: ox + 0.15, y: top - 2.6, z: oz + 1.1, rx: 0.62, ry: dishYaw,
  });
  as.add('trim', cyl(3.1, 3.1, 0.12, 12), pal.weather(pal.trim, 2), {
    x: ox + 0.2, y: top - 3.6, z: oz + 1.4, rx: 0.7, ry: dishYaw,
  });
  if (plaque) {
    as.add('trim', box(1.6, 1.0, 0.12), pal.weather(pal.trim, 0), {
      x: ox + 2.35, y: 1.1, z: oz + 0.2,
    });
    as.add('hull', box(1.2, 0.7, 0.06), pal.hullDark, {
      x: ox + 2.38, y: 1.1, z: oz + 0.28,
    });
  }
  if (replyMast) {
    addBeaconRig(as, pal, ox + 5.2, 0, oz - 1.4, {
      height: height * 0.62, dishTilt: 0.5, dishYaw: dishYaw + Math.PI,
      lampHex: pal.weather(lampHex ?? pal.lamp, 1), frost,
    });
  }
  return lampY;
}

function buildShepherd(def, h) {
  const pal = factionPalette('freehold');
  const as = makeAssembler();
  const lampY = addShepherdFamily(as, pal, 0, 0, {
    height: 26, dishYaw: 0, lampHex: 0xffdca0, cageHex: 0x9a4436,
  });
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'beacon');
  const mats = matsFor(h, pal);
  attachMerged(root, def, 'beacon', geos, h, mats);
  const halo = makeHalo(h, def, 'beacon', industrialGlow().amber, 9, new THREE.Vector3(0, lampY, 0));
  root.add(halo.sprite);
  const d = dimColor(h, def, mats, [halo.mat]);
  h.addPulse(mats.emit, 1.15, d, 1.7, 0.4);
  return root;
}

function buildLanesEnd(def, h) {
  const pal = factionPalette('hollow');
  const free = factionPalette('freehold');
  // Hollow weather on Freehold bones: mix palettes.
  const mixed = {
    ...pal,
    hull: free.weather(free.hull, 2),
    hullDark: pal.hullDark,
    trim: pal.weather(free.trim, 1),
    weather: pal.weather,
    metalness: pal.metalness,
    roughness: 0.74,
  };
  const as = makeAssembler();
  const lampY = addShepherdFamily(as, mixed, 0, 0, {
    height: 27, dishYaw: Math.PI, lampHex: 0xe0d0ea, cageHex: pal.trim,
    frost: true, replyMast: true, plaque: true,
  });
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'beacon');
  const mats = matsFor(h, mixed);
  attachMerged(root, def, 'beacon', geos, h, mats);
  const halo = makeHalo(h, def, 'beacon', industrialGlow().cool, 8.5, new THREE.Vector3(0, lampY, 0));
  root.add(halo.sprite);
  const d = dimColor(h, def, mats, [halo.mat]);
  h.addPulse(mats.emit, 1.05, d, 1.4, 1.2);
  return root;
}

function addRefineryHulk(as, pal, x) {
  const hull = pal.hull;
  const dark = pal.hullDark;
  const trim = pal.trim;
  as.add('hull', box(14, 3.6, 5.4), hull, { x, y: 0.2, z: 0 });
  as.add('hull', box(10, 2.8, 4.6), dark, { x: x - 1.2, y: 2.4, z: 0 });
  as.add('trim', cyl(1.3, 1.5, 8.5, 8), trim, { x: x - 4.2, y: 5.4, z: 1.4 });
  as.add('trim', cyl(1.3, 1.5, 8.5, 8), trim, { x: x - 4.2, y: 5.4, z: -1.4 });
  as.add('hull', box(3.2, 1.6, 3.2), dark, { x: x + 5.6, y: 1.4, z: 0 });
  for (let i = 0; i < 4; i++) {
    as.add('hull', box(1.1, 0.85, 0.08), pal.weather(pal.accent, 3), {
      x: x - 2 + i * 1.8, y: 1.5, z: 2.75,
    });
  }
  as.add('trim', box(13.2, 0.12, 0.18), pal.weather(trim, 1), { x, y: -1.4, z: 2.2 });
  as.add('trim', box(13.2, 0.12, 0.18), pal.weather(trim, 1), { x, y: -1.4, z: -2.2 });
}

function buildHulkRow(def, h) {
  const pal = factionPalette('veridian');
  const as = makeAssembler();
  const spacing = 18;
  for (let i = 0; i < 5; i++) addRefineryHulk(as, pal, (i - 2) * spacing);
  as.add('trim', cyl(0.35, 0.45, 16, 6), pal.trim, { x: -2 * spacing - 10, y: 7, z: 0 });
  as.add('trim', box(1.8, 0.2, 1.8), pal.weather(pal.trim, 1), { x: -2 * spacing - 10, y: 15.2, z: 0 });
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'wreck');
  const mats = matsFor(h, pal);
  attachMerged(root, def, 'wreck', geos, h, { hull: mats.hull, trim: mats.trim });
  h.registerDimmable(def.id, 'visited', EMPTY, [
    { mat: mats.hull, base: mats.hull.color.clone() },
    { mat: mats.trim, base: mats.trim.color.clone() },
  ]);
  return root;
}

function buildTitheStone(def, h) {
  const pal = factionPalette('redledger');
  const as = makeAssembler();
  as.add('stone', box(10, 2.2, 8), pal.hullDark, { y: 0.6 });
  as.add('trim', box(10.4, 0.28, 8.4), pal.trim, { y: 1.75 });
  as.add('stone', box(6.2, 38, 3.4), pal.hull, { y: 21 });
  as.add('trim', box(6.5, 0.22, 3.6), pal.accent, { y: 40.2 });

  const cols = 2;
  const rows = 14;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const unfinished = c === 1 && r >= 8;
      if (unfinished && r >= 11) continue;
      const hex = unfinished ? pal.weather(pal.hull, 0) : pal.weather(pal.hullDark, 2);
      as.add('hull', box(2.15, 1.55, 0.16), hex, {
        x: -1.55 + c * 3.15,
        y: 5.2 + r * 2.25,
        z: 1.78,
      });
      if (!unfinished) {
        as.add('trim', box(1.7, 0.12, 0.05), pal.accent, {
          x: -1.55 + c * 3.15,
          y: 5.2 + r * 2.25,
          z: 1.9,
        });
      }
    }
  }
  as.add('trim', box(2.4, 0.18, 1.2), pal.trim, { x: 4.6, y: 3.4, z: 0 });
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'monument');
  const mats = matsFor(h, pal);
  attachMerged(root, def, 'monument', geos, h, {
    stone: mats.stone, hull: mats.hull, trim: mats.trim,
  });
  h.registerDimmable(def.id, 'visited', EMPTY, [
    { mat: mats.stone, base: mats.stone.color.clone() },
    { mat: mats.hull, base: mats.hull.color.clone() },
    { mat: mats.trim, base: mats.trim.color.clone() },
  ]);
  return root;
}

function buildQuietBeacon(def, h) {
  const pal = factionPalette('hollow');
  const as = makeAssembler();
  addBeaconRig(as, pal, 0, 0, 0, {
    height: 24, dishTilt: 2.35, dishYaw: 0.2,
    lampHex: 0xb09ac0, cageHex: pal.trim, frost: true,
  });
  // Hearing array: extra spikes around the lamp.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    as.add('trim', cyl(0.07, 0.04, 4.2, 4), pal.trim, {
      x: Math.cos(a) * 1.6, y: 26.2, z: Math.sin(a) * 1.6,
      rx: Math.cos(a) * 0.7, rz: Math.sin(a) * 0.7,
    });
  }
  // Cipher studs — pattern only.
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU;
    const on = i % 3 !== 1;
    if (!on) continue;
    as.add('hull', sph(0.12, 5, 4), pal.hullDark, {
      x: Math.cos(a) * 1.35, y: 25.1, z: Math.sin(a) * 1.35,
    });
  }
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'beacon');
  const mats = matsFor(h, pal);
  attachMerged(root, def, 'beacon', geos, h, mats);
  const halo = makeHalo(h, def, 'beacon', industrialGlow().violet, 6.5, new THREE.Vector3(0, 25.1, 0));
  halo.mat.opacity = 0.4;
  root.add(halo.sprite);
  const d = dimColor(h, def, mats, [halo.mat]);
  h.addPulse(mats.emit, 0.7, d, 1.05, 2.1);
  return root;
}

function buildFirstWreck(def, h) {
  const pal = factionPalette('hollow');
  const as = makeAssembler();
  const alloy = 0x2a2630;
  const alloyLite = 0x3e3848;
  const crystal = 0x9a88c0;
  as.add('hull', box(36, 2.2, 4.2), alloy, { y: 0.2, rz: 0.08, rx: 0.04 });
  for (let i = 0; i < 7; i++) {
    const t = (i - 3) * 4.6;
    as.add('hull', box(3.4 + (i % 2) * 1.2, 3.6, 5.4), i % 2 ? alloy : alloyLite, {
      x: t, y: 1.1, z: (i % 3 - 1) * 0.35, ry: (i - 3) * 0.08, rz: 0.12,
    });
  }
  as.add('hull', tet(2.8), alloyLite, { x: 18.4, y: 0.6, z: 0.2, rx: 0.4, ry: 0.8 });
  as.add('hull', tet(2.2), alloy, { x: -18.6, y: 0.2, z: -0.4, rx: 1.1 });
  // Crystal hairline along the spine.
  for (let i = 0; i < 18; i++) {
    as.add('emit', box(1.4, 0.07, 0.07), crystal, {
      x: -16 + i * 1.9, y: 1.55 + Math.sin(i * 0.7) * 0.15, z: 0.15, rz: 0.08,
    });
  }
  const rand = poiRand(def.id);
  for (let i = 0; i < 6; i++) {
    as.add('hull', tet(0.7 + rand() * 0.5), alloy, {
      x: (rand() - 0.5) * 20, y: -2.2, z: (rand() - 0.5) * 8,
      rx: rand() * TAU, ry: rand() * TAU,
    });
  }
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'wreck');
  const mats = {
    hull: hullMat(h, { roughness: 0.55, metalness: 0.28 }),
    emit: emitMat(h, { intensity: 0.28 }),
  };
  attachMerged(root, def, 'wreck', geos, h, mats);
  const d = h.registerDimmable(def.id, 'visited', [{ mat: mats.emit, base: 0.28 }], [
    { mat: mats.hull, base: mats.hull.color.clone() },
  ]);
  h.addPulse(mats.emit, 0.28, d, 0.55, 0.2);
  return root;
}

function addMenhir(as, pal, x, z, hgt, lean, thin = false) {
  const w = thin ? 0.85 : 1.6;
  const d = thin ? 0.7 : 1.15;
  as.add('stone', box(w, hgt, d), pal.weather(pal.hull, 1), {
    x, y: hgt * 0.5, z, rz: lean, rx: lean * 0.4,
  });
  as.add('stone', box(w * 1.15, 0.45, d * 1.15), pal.hullDark, {
    x, y: 0.2, z, rz: lean,
  });
}

function buildFirstGarden(def, h) {
  const pal = factionPalette('hollow');
  const as = makeAssembler();
  const count = 7;
  for (let i = 1; i < count; i++) {
    const a = (i / count) * TAU;
    addMenhir(as, pal, Math.cos(a) * 9.5, Math.sin(a) * 9.5, 7 + (i % 3) * 1.6, Math.sin(a) * 0.08);
  }
  as.add('stone', sph(3.2, 10, 8), pal.weather(pal.hullDark, 1), { y: -0.4, sy: 0.45 });
  as.add('hull', cone(0.9, 3.4, 6), pal.weather(pal.accent, 2), { y: 2.1 });
  as.add('hull', sph(0.7, 8, 6), pal.weather(pal.hull, 2), { y: 3.6, sx: 1.3, sy: 0.7, sz: 1.3 });
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'monument');
  const mats = matsFor(h, pal);
  attachMerged(root, def, 'monument', geos, h, { stone: mats.stone, hull: mats.hull });
  h.registerDimmable(def.id, 'visited', EMPTY, [
    { mat: mats.stone, base: mats.stone.color.clone() },
    { mat: mats.hull, base: mats.hull.color.clone() },
  ]);
  return root;
}

function buildChoirStones(def, h) {
  const pal = factionPalette('hollow');
  const as = makeAssembler();
  const heights = [14, 10, 17, 12, 19, 9, 15, 11];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    addMenhir(as, pal, Math.cos(a) * 8.2, Math.sin(a) * 8.2, heights[i], Math.sin(a + 0.4) * 0.12, true);
  }
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'monument');
  const mats = matsFor(h, pal);
  attachMerged(root, def, 'monument', geos, h, { stone: mats.stone });

  const ghosts = industrialGlow().cool;
  const dimRef = h.registerDimmable(def.id, 'visited', EMPTY, [
    { mat: mats.stone, base: mats.stone.color.clone() },
  ]);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.3;
    const halo = makeHalo(h, def, 'monument', ghosts, 3.4,
      new THREE.Vector3(Math.cos(a) * 5.4, 8 + (i % 3) * 2.2, Math.sin(a) * 5.4));
    halo.mat.opacity = 0.22;
    root.add(halo.sprite);
    h.addGhost(halo.mat, 0.22, dimRef, 0.7 + i * 0.11, i * 0.8);
  }
  return root;
}

function buildUnfinished(def, h) {
  const pal = factionPalette('hollow');
  const as = makeAssembler();
  as.add('stone', box(8.5, 2.0, 8.5), pal.hullDark, { y: 0.5 });
  as.add('stone', box(5.2, 3.4, 5.2), pal.hull, { y: 2.6 });
  as.add('trim', torus(7.2, 0.28, 6, 20, Math.PI * 1.15), pal.trim, {
    y: 6.4, rx: Math.PI / 2, ry: 0.35,
  });
  as.add('trim', cyl(0.28, 0.28, 8.5, 6), pal.trim, {
    x: 5.4, y: 5.2, z: 2.1, rz: 0.55,
  });
  as.add('trim', cyl(0.28, 0.28, 6.2, 6), pal.trim, {
    x: -3.6, y: 6.8, z: -4.4, rz: -0.85, rx: 0.3,
  });
  addAnomalyCore(as, pal, 0.8, 5.8, -0.4, 0.72);
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'anomaly');
  const mats = {
    stone: hullMat(h, { roughness: 0.88, metalness: 0.1 }),
    trim: hullMat(h, { roughness: 0.45, metalness: 0.22 }),
    hull: hullMat(h, { roughness: 0.5, metalness: 0.1 }),
    emit: emitMat(h, { intensity: 0.48, opacity: 0.8, transparent: true }),
  };
  attachMerged(root, def, 'anomaly', geos, h, mats);
  const halo = makeHalo(h, def, 'anomaly', industrialGlow().violet, 12, new THREE.Vector3(0.8, 5.8, -0.4));
  root.add(halo.sprite);
  const d = h.registerDimmable(def.id, 'visited', [{ mat: mats.emit, base: 0.48 }], [
    { mat: mats.stone, base: mats.stone.color.clone() },
    { mat: mats.trim, base: mats.trim.color.clone() },
    { mat: mats.hull, base: mats.hull.color.clone() },
    { mat: halo.mat, base: halo.mat.color.clone() },
  ]);
  h.addPulse(mats.emit, 0.48, d, 0.7, 0.9);
  return root;
}

function buildConvergence(def, h) {
  const pal = factionPalette('hollow');
  const as = makeAssembler();
  // Heading line: tally, plate, garden stone, then void.
  as.add('stone', box(0.7, 3.4, 2.2), pal.weather(pal.hull, 1), { x: -8, y: 1.8, z: 4, rz: 0.08 });
  as.add('trim', box(0.08, 2.4, 1.6), pal.accent, { x: -7.55, y: 1.9, z: 4 });
  as.add('hull', box(3.2, 0.18, 2.1), pal.hull, { x: -3.2, y: 0.6, z: 1.6, ry: 0.4, rx: 0.3 });
  as.add('stone', box(1.4, 2.6, 0.9), pal.hullDark, { x: 1.2, y: 1.2, z: -0.8, rz: -0.12 });
  addAnomalyCore(as, pal, 6.4, 2.4, -3.6, 0.85);
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'anomaly');
  const mats = {
    stone: hullMat(h, { roughness: 0.86, metalness: 0.1 }),
    hull: hullMat(h, { roughness: 0.7, metalness: 0.2 }),
    trim: hullMat(h, { roughness: 0.5, metalness: 0.22 }),
    emit: emitMat(h, { intensity: 0.6, opacity: 0.8, transparent: true }),
  };
  attachMerged(root, def, 'anomaly', geos, h, mats);

  const ring = new THREE.Mesh(
    h.ownGeo(new THREE.TorusGeometry(3.6, 0.1, 6, 20)),
    h.ownMat(new THREE.MeshStandardMaterial({
      color: pal.trim, emissive: pal.glow, emissiveIntensity: 0.22, roughness: 0.4, metalness: 0.18,
    })));
  ring.position.set(6.4, 2.4, -3.6);
  ring.rotation.x = 0.8;
  tagPiece(ring, def, 'anomaly');
  root.add(ring);
  h.addSpin(ring, 'z', 0.22);

  const halo = makeHalo(h, def, 'anomaly', industrialGlow().violet, 11, new THREE.Vector3(6.4, 2.4, -3.6));
  root.add(halo.sprite);
  const d = h.registerDimmable(def.id, 'visited', [{ mat: mats.emit, base: 0.6 }, { mat: ring.material, base: 0.22 }], [
    { mat: mats.stone, base: mats.stone.color.clone() },
    { mat: mats.hull, base: mats.hull.color.clone() },
    { mat: mats.trim, base: mats.trim.color.clone() },
    { mat: halo.mat, base: halo.mat.color.clone() },
  ]);
  h.addPulse(mats.emit, 0.6, d, 0.8, 0.3);
  return root;
}

function buildAnswer(def, h) {
  const pal = factionPalette('hollow');
  const as = makeAssembler();
  as.add('hull', torus(6.4, 0.32, 6, 22, Math.PI * 1.45), 0x8a6a4a, {
    y: 2.2, rx: 0.55, ry: 0.2,
  });
  as.add('trim', torus(6.4, 0.32, 6, 22, Math.PI * 1.45), 0x6a7090, {
    y: 2.2, rx: -0.55, ry: 0.2, rz: 0.4,
  });
  as.add('emit', sph(1.6, 10, 8), pal.glow, { y: 2.2 });
  const geos = as.build();
  const root = markAuthored(new THREE.Group(), def, 'anomaly');
  const mats = {
    hull: hullMat(h, { roughness: 0.55, metalness: 0.16 }),
    trim: hullMat(h, { roughness: 0.5, metalness: 0.16 }),
    emit: emitMat(h, { intensity: 0.42, opacity: 0.75, transparent: true }),
  };
  attachMerged(root, def, 'anomaly', geos, h, mats);
  const halo = makeHalo(h, def, 'anomaly', industrialGlow().cool, 16, new THREE.Vector3(0, 2.2, 0));
  halo.mat.opacity = 0.35;
  root.add(halo.sprite);
  const d = h.registerDimmable(def.id, 'visited', [{ mat: mats.emit, base: 0.42 }], [
    { mat: mats.hull, base: mats.hull.color.clone() },
    { mat: mats.trim, base: mats.trim.color.clone() },
    { mat: halo.mat, base: halo.mat.color.clone() },
  ]);
  h.addPulse(mats.emit, 0.42, d, 0.55, 1.6);
  return root;
}

export const AUTHORED = {
  fh_shepherd: buildShepherd,
  vd_hulk_row: buildHulkRow,
  rm_tithe_stone: buildTitheStone,
  hr_quiet_beacon: buildQuietBeacon,
  hr_first_wreck: buildFirstWreck,
  th_lanes_end: buildLanesEnd,
  th_first_garden: buildFirstGarden,
  vg_choir_stones: buildChoirStones,
  vg_unfinished: buildUnfinished,
  convergence: buildConvergence,
  deepening: buildAnswer,
};
