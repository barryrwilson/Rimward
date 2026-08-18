import * as THREE from 'three';
import {
  TAU, EMPTY, GEO, poiRand, tagPiece, makeAssembler, hullMat, emitMat,
  factionPalette, makeHalo, makeGlazeGlow, glazeRoot, finishGlaze,
  attachMerged, industrialGlow, glowTextures,
} from './kit.js';
import {
  organicMaterials, makePetalGeometry, makeTendrilGeometry,
  tagSway, tagBreath, tagPulse,
} from '../organic.js';

function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
function cyl(rt, rb, h, seg = 8) { return new THREE.CylinderGeometry(rt, rb, h, seg); }
function sph(r, w = 8, hs = 6) { return new THREE.SphereGeometry(r, w, hs); }
function tet(r) { return new THREE.TetrahedronGeometry(r); }
function cone(r, h, seg = 8) { return new THREE.ConeGeometry(r, h, seg); }
function torus(r, t, rs = 6, ts = 12, arc = Math.PI * 2) {
  return new THREE.TorusGeometry(r, t, rs, ts, arc);
}
function octa(r) { return new THREE.OctahedronGeometry(r); }

function addWreckBody(as, pal, ox, oy, oz, tumbled, rand) {
  const hull = pal.hull;
  const dark = pal.hullDark;
  const trim = pal.trim;
  const rust = pal.weather(pal.accent, 2);

  as.add('hull', box(18, 3.4, 5.2), hull, { x: ox, y: oy, z: oz, rx: tumbled ? 0.35 : 0.18, rz: tumbled ? 0.22 : 0.08 });
  as.add('hull', box(7.5, 2.4, 4.4), dark, { x: ox - 9.2, y: oy + 0.2, z: oz, rx: 0.1, rz: 0.4 });
  as.add('hull', box(6.5, 2.2, 4.0), dark, { x: ox + 9.4, y: oy - 0.4, z: oz + 0.3, rx: -0.15, rz: -0.55 });

  for (let i = 0; i < 4; i++) {
    const t = (i - 1.5) * 3.6;
    as.add('trim', torus(2.6, 0.16, 5, 10, Math.PI), trim, {
      x: ox + t, y: oy + 0.4, z: oz, rx: Math.PI / 2, rz: tumbled ? 0.2 : 0.05,
    });
  }

  as.add('hull', cone(1.8, 3.2, 8), dark, {
    x: ox - 12.4, y: oy - 0.2, z: oz, rz: Math.PI / 2, rx: 0.15,
  });
  as.add('trim', cyl(1.5, 1.7, 0.6, 8), rust, {
    x: ox - 10.6, y: oy - 0.15, z: oz, rz: Math.PI / 2,
  });

  as.add('hull', box(5.5, 0.18, 3.4), rust, {
    x: ox + 2, y: oy + 2.1, z: oz + 0.4, rx: 0.9, rz: 0.35,
  });
  as.add('hull', box(4.2, 0.16, 2.6), dark, {
    x: ox - 1.5, y: oy + 1.6, z: oz - 1.8, rx: -0.7, ry: 0.4,
  });
  as.add('trim', box(1.1, 0.7, 0.12), pal.weather(trim, 1), {
    x: ox + 3.2, y: oy + 0.9, z: oz + 2.55,
  });
  as.add('trim', box(1.1, 0.7, 0.12), pal.weather(trim, 2), {
    x: ox + 1.6, y: oy + 0.85, z: oz + 2.55,
  });

  const chips = 8 + (rand() * 4 | 0);
  for (let i = 0; i < chips; i++) {
    const geo = i % 2 ? tet(0.55 + rand() * 0.45) : box(0.8 + rand() * 0.9, 0.35, 0.55);
    as.add('hull', geo, i % 3 ? dark : rust, {
      x: ox + (rand() - 0.5) * 16,
      y: oy - 2.4 - rand() * 0.8,
      z: oz + (rand() - 0.5) * 10,
      rx: rand() * TAU, ry: rand() * TAU, rz: rand() * TAU,
    });
  }
}

export function buildWreck(def, h, faction) {
  const pal = factionPalette(faction);
  const rand = poiRand(def.id);
  const tumbled = rand() > 0.5;
  const as = makeAssembler();
  addWreckBody(as, pal, 0, 0, 0, tumbled, rand);
  const geos = as.build();
  const root = new THREE.Group();
  const hm = hullMat(h, { roughness: 0.82, metalness: pal.metalness });
  const tm = hullMat(h, { roughness: 0.58, metalness: pal.metalness });
  attachMerged(root, def, 'wreck', geos, h, { hull: hm, trim: tm });
  h.registerDimmable(def.id, 'visited', EMPTY, [
    { mat: hm, base: hm.color.clone() },
    { mat: tm, base: tm.color.clone() },
  ]);
  return root;
}

export function addBeaconRig(as, pal, ox, oy, oz, {
  height = 22, dishTilt = 0.45, dishYaw = 0, lampHex, cageHex, frost = false,
}) {
  const hull = pal.hull;
  const dark = pal.hullDark;
  const trim = pal.trim;
  as.add('hull', cyl(2.4, 3.1, 1.8, 8), dark, { x: ox, y: oy + 0.4, z: oz });
  as.add('hull', box(5.2, 0.55, 5.2), hull, { x: ox, y: oy - 0.35, z: oz });
  as.add('trim', box(1.4, 0.18, 0.9), trim, { x: ox + 1.6, y: oy + 0.15, z: oz + 2.1 });

  as.add('trim', cyl(0.28, 0.34, height, 6), trim, { x: ox, y: oy + height * 0.5, z: oz });
  for (let i = 0; i < 3; i++) {
    const y = oy + 4 + i * (height - 8) / 2;
    as.add('trim', box(1.8, 0.12, 0.12), pal.weather(trim, 1), { x: ox, y, z: oz });
    as.add('trim', box(0.12, 0.12, 1.8), pal.weather(trim, 1), { x: ox, y, z: oz });
  }

  const top = oy + height;
  as.add('hull', cyl(0.7, 0.55, 1.1, 8), dark, { x: ox, y: top - 0.2, z: oz });
  as.add('trim', torus(1.15, 0.08, 6, 12), cageHex ?? trim, { x: ox, y: top + 0.9, z: oz, rx: Math.PI / 2 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    as.add('trim', box(0.08, 1.7, 0.08), cageHex ?? trim, {
      x: ox + Math.cos(a) * 1.1, y: top + 0.9, z: oz + Math.sin(a) * 1.1,
    });
  }
  as.add('emit', sph(0.72, 10, 8), lampHex ?? pal.lamp, { x: ox, y: top + 0.95, z: oz });

  as.add('trim', cyl(1.7, 1.7, 0.16, 10), pal.weather(trim, 1), {
    x: ox + 0.2, y: top - 1.4, z: oz + 0.8,
    rx: dishTilt, ry: dishYaw,
  });
  as.add('hull', sph(1.55, 8, 6), dark, {
    x: ox + 0.2, y: top - 1.4, z: oz + 0.8,
    rx: dishTilt + Math.PI, ry: dishYaw, sy: 0.42,
  });

  as.add('trim', cyl(0.06, 0.06, 16.5, 4), pal.weather(trim, 2), {
    x: ox + 1.6, y: oy + height * 0.38, z: oz + 1.6, rz: 0.28, rx: -0.18,
  });
  as.add('trim', cyl(0.06, 0.06, 16.5, 4), pal.weather(trim, 2), {
    x: ox - 1.6, y: oy + height * 0.38, z: oz + 1.6, rz: -0.28, rx: -0.18,
  });

  if (frost) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      as.add('hull', box(0.55, 0.08, 1.4), pal.weather(hull, 2), {
        x: ox + Math.cos(a) * 0.45, y: oy + 6 + (i % 3) * 3.2, z: oz + Math.sin(a) * 0.45,
        ry: a, rz: 0.4,
      });
    }
  }

  return { lampY: top + 0.95 };
}

export function buildBeacon(def, h, faction) {
  const pal = factionPalette(faction);
  const rand = poiRand(def.id);
  const as = makeAssembler();
  const { lampY } = addBeaconRig(as, pal, 0, 0, 0, {
    height: 20 + rand() * 3,
    dishTilt: 0.35 + rand() * 0.25,
    dishYaw: (rand() - 0.5) * 0.8,
  });
  const geos = as.build();
  const root = new THREE.Group();
  const hm = hullMat(h, { roughness: 0.7, metalness: pal.metalness });
  const tm = hullMat(h, { roughness: 0.5, metalness: pal.metalness });
  const em = emitMat(h, { intensity: 1.2 });
  attachMerged(root, def, 'beacon', geos, h, { hull: hm, trim: tm, emit: em });
  const halo = makeHalo(h, def, 'beacon', industrialGlow().amber, 7.5, new THREE.Vector3(0, lampY, 0));
  root.add(halo.sprite);
  const d = h.registerDimmable(def.id, 'visited', [{ mat: em, base: 1.2 }], [
    { mat: halo.mat, base: halo.mat.color.clone() },
  ]);
  h.addPulse(em, 1.2, d, 2.2, rand() * TAU);
  return root;
}

function addMonumentShaft(as, pal, ox, oy, oz, lean, tall = 30) {
  const stone = pal.hullDark;
  const face = pal.hull;
  const band = pal.trim;
  as.add('stone', box(6.4, 1.6, 6.4), stone, { x: ox, y: oy + 0.4, z: oz, rz: lean });
  as.add('stone', box(4.6, 1.1, 4.6), pal.weather(stone, 1), { x: ox, y: oy + 1.4, z: oz, rz: lean });
  as.add('stone', box(3.4, tall, 2.2), face, { x: ox, y: oy + 2.1 + tall * 0.5, z: oz, rz: lean * 0.7 });
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    as.add('trim', box(3.55, 0.18, 2.35), pal.weather(band, i % 3), {
      x: ox, y: oy + 6 + i * (tall - 8) / (bands - 1), z: oz, rz: lean * 0.7,
    });
    for (let c = 0; c < 4; c++) {
      as.add('hull', box(0.55, 0.7, 0.08), pal.weather(stone, 2), {
        x: ox - 1.1 + c * 0.72,
        y: oy + 5.2 + i * (tall - 8) / (bands - 1),
        z: oz + 1.16,
        rz: lean * 0.7,
      });
    }
  }
  as.add('stone', box(3.8, 0.7, 2.5), pal.weather(face, 1), {
    x: ox, y: oy + 2.1 + tall + 0.2, z: oz, rz: lean * 0.5,
  });
  as.add('trim', box(2.2, 0.12, 1.1), band, {
    x: ox + 2.4, y: oy + 3.1, z: oz, rz: lean,
  });
}

export function buildMonument(def, h, faction) {
  const pal = factionPalette(faction);
  const rand = poiRand(def.id);
  const lean = (rand() - 0.5) * 0.12;
  const as = makeAssembler();
  addMonumentShaft(as, pal, 0, 0, 0, lean, 28 + rand() * 5);
  const geos = as.build();
  const root = new THREE.Group();
  const sm = hullMat(h, { roughness: 0.88, metalness: 0.12 });
  const hm = hullMat(h, { roughness: 0.8, metalness: 0.14 });
  const tm = hullMat(h, { roughness: 0.55, metalness: pal.metalness });
  attachMerged(root, def, 'monument', geos, h, { stone: sm, hull: hm, trim: tm });
  h.registerDimmable(def.id, 'visited', EMPTY, [
    { mat: sm, base: sm.color.clone() },
    { mat: hm, base: hm.color.clone() },
    { mat: tm, base: tm.color.clone() },
  ]);
  return root;
}

export function addAnomalyCore(as, pal, ox, oy, oz, scale = 1) {
  as.add('emit', octa(2.4 * scale), pal.glow, { x: ox, y: oy, z: oz });
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    as.add('hull', tet(1.1 * scale), pal.hullDark, {
      x: ox + Math.cos(a) * 5.4 * scale,
      y: oy + Math.sin(i * 1.7) * 1.6 * scale,
      z: oz + Math.sin(a) * 5.4 * scale,
      rx: a, ry: a * 0.7, rz: 0.4,
    });
  }
}

export function buildAnomaly(def, h, faction) {
  const pal = factionPalette(faction);
  const rand = poiRand(def.id);
  const root = new THREE.Group();
  const as = makeAssembler();
  addAnomalyCore(as, pal, 0, 0, 0, 1);
  const geos = as.build();
  const hm = hullMat(h, { roughness: 0.48, metalness: 0.08 });
  const em = emitMat(h, { intensity: 0.55, opacity: 0.78, transparent: true });
  attachMerged(root, def, 'anomaly', geos, h, { hull: hm, emit: em });

  const frames = new THREE.Group();
  tagPiece(frames, def, 'anomaly');
  const frameMat = h.ownMat(new THREE.MeshStandardMaterial({
    color: pal.trim, roughness: 0.4, metalness: 0.2,
    emissive: pal.glow, emissiveIntensity: 0.18,
  }));
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(h.ownGeo(new THREE.TorusGeometry(5.2 + i * 1.3, 0.11, 6, 24)), frameMat);
    ring.rotation.set(0.4 + i * 0.5, i * 0.9, i * 0.35);
    tagPiece(ring, def, 'anomaly');
    frames.add(ring);
    h.addSpin(ring, i % 2 ? 'y' : 'x', (i % 2 ? 0.18 : -0.13) * (1 + i * 0.15));
  }
  root.add(frames);

  const halo = makeHalo(h, def, 'anomaly', industrialGlow().violet, 14, new THREE.Vector3(0, 0.4, 0));
  root.add(halo.sprite);
  const d = h.registerDimmable(def.id, 'visited', [{ mat: em, base: 0.55 }, { mat: frameMat, base: 0.18 }], [
    { mat: hm, base: hm.color.clone() },
    { mat: halo.mat, base: halo.mat.color.clone() },
  ]);
  h.addPulse(em, 0.55, d, 0.9, rand() * TAU);
  return root;
}

export function buildClue(def, h) {
  const rand = poiRand(def.id);
  const root = new THREE.Group();
  const mat = h.ownMat(new THREE.MeshStandardMaterial({
    color: 0x060a10, emissive: 0x9ab4ff, emissiveIntensity: 0.9,
    roughness: 0.45, metalness: 0.0,
  }));
  const mote = new THREE.Mesh(h.ownGeo(new THREE.OctahedronGeometry(1.15)), mat);
  mote.scale.set(0.85, 1.35, 0.7);
  tagPiece(mote, def, 'clue');
  root.add(mote);
  const halo = makeHalo(h, def, 'clue', industrialGlow().cool, 4.2, new THREE.Vector3(0, 0, 0));
  halo.mat.opacity = 0.45;
  root.add(halo.sprite);
  const d = h.registerDimmable(def.id, 'found', [{ mat, base: 0.9 }], [
    { mat: halo.mat, base: halo.mat.color.clone() },
  ]);
  h.addPulse(mat, 0.9, d, 1.3, rand() * TAU);
  return root;
}

export function glazeWreck(def, h) {
  const rand = poiRand(def.id);
  const mats = organicMaterials();
  const tarnished = organicMaterials({ tarnished: true });
  const root = glazeRoot(def, 'wreck');

  const keel = new THREE.Mesh(
    h.ownGeo(makeTendrilGeometry({ length: 34, radius: 1.15, sway: 2.4, taper: 0.32, tubularSegs: 36 })),
    mats.flesh);
  keel.position.z = -17;
  keel.scale.y = 0.55;
  tagPiece(keel, def, 'wreck');
  root.add(keel);

  const ribs = 5 + (rand() * 2 | 0);
  let biggest = null;
  let biggestLen = 0;
  let hang = null;
  for (let i = 0; i < ribs; i++) {
    const t = ribs === 1 ? 0.5 : i / (ribs - 1);
    const len = 13 + rand() * 7;
    const rib = new THREE.Mesh(
      h.ownGeo(makePetalGeometry({ length: len, width: 3.4 + rand() * 1.8, curl: 4.6 + rand() * 2.6, cup: 1.25, segs: 10 })),
      mats.flesh);
    rib.position.set((rand() - 0.5) * 2.2, 0.45, -14 + t * 28);
    rib.rotation.x = -Math.PI / 2 + 0.22;
    rib.rotation.z = (rand() - 0.5) * 0.85;
    if (i === ribs - 1) {
      rib.rotation.z += 1.1;
      rib.position.y -= 1.2;
      hang = rib;
    }
    tagPiece(rib, def, 'wreck');
    root.add(rib);
    if (len > biggestLen) { biggestLen = len; biggest = rib; }
  }
  if (hang) tagSway(hang, { axis: 'z', amp: 0.05, hz: 0.12, phase: rand() * TAU });

  const blisters = 6 + (rand() * 4 | 0);
  for (let i = 0; i < blisters; i++) {
    const b = new THREE.Mesh(GEO.blister, mats.flesh);
    b.position.set((rand() - 0.5) * 6.5, rand() * 1.6, (rand() - 0.5) * 28);
    b.scale.set(1.3 + rand() * 1.9, 0.5 + rand() * 0.5, 1.3 + rand() * 1.9);
    tagPiece(b, def, 'wreck');
    root.add(b);
  }

  const chandelier = new THREE.Group();
  tagPiece(chandelier, def, 'wreck');
  chandelier.position.copy(biggest.position);
  chandelier.position.y = biggest.position.y + biggestLen * 0.42;
  const frame = new THREE.Mesh(
    h.ownGeo(makeTendrilGeometry({ length: 6.2, radius: 0.38, sway: 1.15, taper: 0.5 })),
    tarnished.gilt);
  frame.rotation.x = Math.PI / 2;
  tagPiece(frame, def, 'wreck');
  chandelier.add(frame);
  const tex = glowTextures();
  const colors = [];
  const buds = 3 + (rand() * 2 | 0);
  for (let i = 0; i < buds; i++) {
    const g = makeGlazeGlow(h, def, 'wreck', tex.mint, i === 0 ? 6.2 : 3.6);
    g.sprite.position.set((rand() - 0.5) * 2.6, -4.6 - rand() * 1.3, (rand() - 0.5) * 2.6);
    tagPulse(g.mat, { base: 0.88, amp: 0.14, hz: 0.28 + rand() * 0.25, phase: rand() * TAU });
    colors.push({ mat: g.mat, base: g.mat.color.clone() });
    chandelier.add(g.sprite);
  }
  tagSway(chandelier, { axis: 'z', amp: 0.06, hz: 0.15, phase: rand() * TAU });
  root.add(chandelier);
  return finishGlaze(root, colors, h);
}

export function glazeBeacon(def, h) {
  const rand = poiRand(def.id);
  const mats = organicMaterials();
  const root = glazeRoot(def, 'beacon');

  const globe = new THREE.Mesh(GEO.blister, mats.membrane);
  globe.scale.setScalar(5.6);
  globe.position.y = 9;
  tagPiece(globe, def, 'beacon');
  root.add(globe);

  const stem = new THREE.Mesh(
    h.ownGeo(makeTendrilGeometry({ length: 10, radius: 0.55, sway: 0.8, taper: 0.45, tubularSegs: 20 })),
    mats.gilt);
  stem.rotation.x = -Math.PI / 2;
  tagPiece(stem, def, 'beacon');
  root.add(stem);

  const arms = 5 + (rand() * 2 | 0);
  for (let i = 0; i < arms; i++) {
    const arm = new THREE.Mesh(
      h.ownGeo(makeTendrilGeometry({ length: 15, radius: 0.42, sway: 2.2, taper: 0.38 })),
      mats.gilt);
    arm.rotation.order = 'YXZ';
    arm.rotation.x = -Math.PI / 2 + 0.28;
    arm.rotation.y = (i / arms) * TAU + rand() * 0.18;
    tagPiece(arm, def, 'beacon');
    root.add(arm);
  }

  const tex = glowTextures();
  const core = makeGlazeGlow(h, def, 'beacon', tex.mint, 14);
  core.sprite.position.y = 9;
  tagPulse(core.mat, { base: 0.95, amp: 0.1, hz: 0.5, phase: rand() * TAU });
  root.add(core.sprite);

  const pivot = new THREE.Group();
  tagPiece(pivot, def, 'beacon');
  pivot.position.y = 9;
  const motes = 3 + (rand() * 2 | 0);
  for (let i = 0; i < motes; i++) {
    const mote = new THREE.Mesh(GEO.blister, mats.veinGlow);
    mote.scale.setScalar(0.5 + rand() * 0.4);
    const a = rand() * TAU;
    mote.position.set(
      Math.cos(a) * (7 + rand() * 2),
      (rand() - 0.5) * 4,
      Math.sin(a) * (7 + rand() * 2));
    tagPiece(mote, def, 'beacon');
    pivot.add(mote);
  }
  tagSway(pivot, { axis: 'y', amp: 0.6, hz: 0.08, phase: rand() * TAU });
  root.add(pivot);

  return finishGlaze(root, [{ mat: core.mat, base: core.mat.color.clone() }], h);
}

export function glazeMonument(def, h) {
  const rand = poiRand(def.id);
  const mats = organicMaterials();
  const root = glazeRoot(def, 'monument');

  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const petal = new THREE.Mesh(
      h.ownGeo(makePetalGeometry({ length: 22 + rand() * 4, width: 5.5 + rand() * 2.2, curl: 4.2 + rand() * 2.2, cup: 1.4, segs: 12 })),
      mats.flesh);
    petal.rotation.order = 'YXZ';
    petal.rotation.x = -Math.PI / 2 + 0.08 + rand() * 0.08;
    petal.rotation.y = (i / petals) * TAU + rand() * 0.12;
    tagPiece(petal, def, 'monument');
    tagSway(petal, { axis: 'z', amp: 0.012, hz: 0.1, phase: rand() * TAU });
    root.add(petal);
  }

  const spine = new THREE.Mesh(
    h.ownGeo(makeTendrilGeometry({ length: 32, radius: 0.6, sway: 1.2, taper: 0.22, tubularSegs: 32 })),
    mats.gilt);
  spine.rotation.x = -Math.PI / 2;
  tagPiece(spine, def, 'monument');
  root.add(spine);

  const cap = new THREE.Mesh(GEO.blister, mats.gilt);
  cap.position.y = 28;
  cap.scale.set(1.8, 0.7, 1.8);
  tagPiece(cap, def, 'monument');
  root.add(cap);

  const tex = glowTextures();
  const crown = makeGlazeGlow(h, def, 'monument', tex.opal, 8.5);
  crown.sprite.position.y = 28.4;
  tagPulse(crown.mat, { base: 0.82, amp: 0.18, hz: 0.25, phase: rand() * TAU });
  root.add(crown.sprite);

  return finishGlaze(root, [{ mat: crown.mat, base: crown.mat.color.clone() }], h);
}

export function glazeAnomaly(def, h) {
  const rand = poiRand(def.id);
  const mats = organicMaterials();
  const root = glazeRoot(def, 'anomaly');

  const bloom = new THREE.Group();
  tagPiece(bloom, def, 'anomaly');
  const petals = 7 + (rand() * 2 | 0);
  for (let i = 0; i < petals; i++) {
    const petal = new THREE.Mesh(
      h.ownGeo(makePetalGeometry({ length: 14 + rand() * 4, width: 8 + rand() * 2.5, curl: 6.5 + rand() * 2.5, cup: 2.8 + rand() * 1.2, segs: 12 })),
      mats.membrane);
    petal.rotation.order = 'YXZ';
    petal.rotation.x = -Math.PI / 2 + 0.72 + rand() * 0.2;
    petal.rotation.y = (i / petals) * TAU + rand() * 0.2;
    petal.position.set(0, 0.4, 0);
    petal.scale.setScalar(0.9 + rand() * 0.25);
    tagPiece(petal, def, 'anomaly');
    bloom.add(petal);
  }
  tagBreath(bloom, { depth: 0.035, hz: 0.18, phase: rand() * TAU });
  root.add(bloom);

  const tex = glowTextures();
  const drift = new THREE.Group();
  tagPiece(drift, def, 'anomaly');
  const colors = [];
  const inner = makeGlazeGlow(h, def, 'anomaly', tex.mint, 5.5);
  inner.sprite.position.set(0, 1.6, 0);
  tagPulse(inner.mat, { base: 0.7, amp: 0.18, hz: 0.28, phase: rand() * TAU });
  colors.push({ mat: inner.mat, base: inner.mat.color.clone() });
  drift.add(inner.sprite);
  const glows = 2;
  for (let i = 0; i < glows; i++) {
    const g = makeGlazeGlow(h, def, 'anomaly', tex.opal, 5 + rand() * 2);
    g.sprite.position.set((rand() - 0.5) * 3.2, 2 + rand() * 2.5, (rand() - 0.5) * 3.2);
    tagPulse(g.mat, { base: 0.62, amp: 0.16, hz: 0.26 + rand() * 0.2, phase: rand() * TAU });
    colors.push({ mat: g.mat, base: g.mat.color.clone() });
    drift.add(g.sprite);
  }
  tagSway(drift, { axis: 'y', amp: 0.7, hz: 0.06, phase: rand() * TAU });
  root.add(drift);

  return finishGlaze(root, colors, h);
}

export function buildKind(kind, def, h, faction) {
  switch (kind) {
    case 'wreck': return buildWreck(def, h, faction);
    case 'beacon': return buildBeacon(def, h, faction);
    case 'monument': return buildMonument(def, h, faction);
    case 'anomaly': return buildAnomaly(def, h, faction);
    case 'clue': return buildClue(def, h);
    default: return null;
  }
}

export function glazeKind(kind, def, h) {
  switch (kind) {
    case 'wreck': return glazeWreck(def, h);
    case 'beacon': return glazeBeacon(def, h);
    case 'monument': return glazeMonument(def, h);
    case 'anomaly': return glazeAnomaly(def, h);
    default: return null;
  }
}
