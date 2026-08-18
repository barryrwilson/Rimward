import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeOrganicGlowTexture, animateOrganic, collectOrganic } from '../organic.js';
import { styleFor } from '../../game/faction-style.js';
import { weather } from '../station-detail.js';

export const TAU = Math.PI * 2;
export const DIM = 0.35;
export const EMPTY = [];

export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function poiRand(id) {
  let s = (hashSeed(String(id)) % 2147483646) + 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export const GEO = {
  blister: new THREE.SphereGeometry(1, 12, 10),
};

for (const g of Object.values(GEO)) g.userData = { shared: true };

let TEX_GLOW_MINT = null;
let TEX_GLOW_OPAL = null;
let TEX_INDUSTRIAL = null;

export function glowTextures() {
  if (!TEX_GLOW_MINT) {
    TEX_GLOW_MINT = makeOrganicGlowTexture('#b8ffd8', 'rgba(127,224,168,0)');
    TEX_GLOW_MINT.userData = { shared: true };
    TEX_GLOW_OPAL = makeOrganicGlowTexture('#f0e6ff', 'rgba(216,200,240,0)');
    TEX_GLOW_OPAL.userData = { shared: true };
  }
  return { mint: TEX_GLOW_MINT, opal: TEX_GLOW_OPAL };
}

export function industrialGlow() {
  if (!TEX_INDUSTRIAL) {
    TEX_INDUSTRIAL = {
      amber: makeOrganicGlowTexture('#ffc070', 'rgba(255,160,60,0)'),
      cool: makeOrganicGlowTexture('#c8e0ff', 'rgba(140,180,255,0)'),
      violet: makeOrganicGlowTexture('#8a6aff', 'rgba(100,70,200,0)'),
    };
    for (const t of Object.values(TEX_INDUSTRIAL)) t.userData = { shared: true };
  }
  return TEX_INDUSTRIAL;
}

export function tagPiece(obj, def, kind) {
  obj.userData.poiId = def.id;
  if (kind === 'clue') {
    obj.userData.poiType = 'clue';
  } else {
    obj.userData.poiType = 'landmark';
    obj.userData.kind = kind;
  }
  return obj;
}

export function createSession() {
  return {
    ownedMats: [],
    ownedGeos: [],
    pulse: [],
    spins: [],
    ghosts: [],
    organicRoots: [],
    dimmables: [],
  };
}

export function helpersFor(session) {
  function ownMat(mat) {
    session.ownedMats.push(mat);
    return mat;
  }
  function ownGeo(geo) {
    session.ownedGeos.push(geo);
    return geo;
  }
  function registerDimmable(id, list, mats, colors) {
    const d = { id, list, dim: 1, mats, colors };
    session.dimmables.push(d);
    return d;
  }
  function addPulse(mat, base, dimRef, speed, phase) {
    session.pulse.push({ mat, base, dimRef, speed, phase });
  }
  function addSpin(obj, axis, speed) {
    session.spins.push({ obj, axis, speed, base: obj.rotation[axis] });
  }
  function addGhost(mat, base, dimRef, speed, phase) {
    session.ghosts.push({ mat, base, dimRef, speed, phase });
  }
  return { session, ownMat, ownGeo, registerDimmable, addPulse, addSpin, addGhost };
}

export function disposeSession(session) {
  if (!session) return;
  for (let i = 0; i < session.ownedMats.length; i++) {
    const m = session.ownedMats[i];
    if (!m.userData.shared) m.dispose();
  }
  for (let i = 0; i < session.ownedGeos.length; i++) {
    const g = session.ownedGeos[i];
    if (!g.userData.shared) g.dispose();
  }
}

export function applyDim(d, discovered) {
  d.dim = discovered ? DIM : 1;
  for (let i = 0; i < d.colors.length; i++) {
    const c = d.colors[i];
    c.mat.color.copy(c.base).multiplyScalar(d.dim);
  }
}

export function tickSession(session, elapsed, reducedMotion) {
  for (let i = 0; i < session.pulse.length; i++) {
    const p = session.pulse[i];
    p.mat.emissiveIntensity =
      p.base * p.dimRef.dim * (0.75 + 0.25 * Math.sin(elapsed * p.speed + p.phase));
  }
  if (!reducedMotion) {
    for (let i = 0; i < session.spins.length; i++) {
      const s = session.spins[i];
      s.obj.rotation[s.axis] = s.base + elapsed * s.speed;
    }
    for (let i = 0; i < session.ghosts.length; i++) {
      const g = session.ghosts[i];
      g.mat.opacity = g.base * g.dimRef.dim * (0.35 + 0.25 * Math.sin(elapsed * g.speed + g.phase));
    }
  }
  for (let i = 0; i < session.organicRoots.length; i++) {
    const parts = session.organicRoots[i].userData.organicParts;
    if (parts) animateOrganic(parts, elapsed, reducedMotion);
  }
}

const _c = new THREE.Color();
const _m = new THREE.Matrix4();
const _e = new THREE.Euler();

export function makeAssembler() {
  const ch = { hull: [], trim: [], emit: [], stone: [] };
  function add(channel, geo, hex, o = {}) {
    const {
      x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0,
      sx = 1, sy = 1, sz = 1,
    } = o;
    let g = geo;
    if (g.index) {
      const ni = g.toNonIndexed();
      g.dispose();
      g = ni;
    }
    if (sx !== 1 || sy !== 1 || sz !== 1) g.scale(sx, sy, sz);
    if (rx || ry || rz) g.applyMatrix4(_m.makeRotationFromEuler(_e.set(rx, ry, rz)));
    if (x || y || z) g.translate(x, y, z);
    _c.setHex(hex);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = _c.r;
      col[i * 3 + 1] = _c.g;
      col[i * 3 + 2] = _c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (!ch[channel]) ch[channel] = [];
    ch[channel].push(g);
  }
  function build() {
    const out = {};
    for (const k of Object.keys(ch)) {
      if (!ch[k].length) continue;
      out[k] = mergeGeometries(ch[k], false);
      for (const g of ch[k]) g.dispose();
    }
    return out;
  }
  return { add, build };
}

export function hullMat(h, { roughness = 0.72, metalness = 0.22 } = {}) {
  return h.ownMat(new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness, metalness: Math.min(metalness, 0.35),
  }));
}

export function emitMat(h, { intensity = 1.05, opacity = 1, transparent = false } = {}) {
  return h.ownMat(new THREE.MeshStandardMaterial({
    color: 0x121214,
    vertexColors: true,
    emissive: 0xffffff,
    emissiveIntensity: intensity,
    roughness: 0.42,
    metalness: 0.08,
    transparent,
    opacity,
    depthWrite: !transparent,
  }));
}

export function factionPalette(faction) {
  const st = styleFor(faction);
  return {
    hull: st.hull,
    hullDark: st.hullDark,
    trim: st.trim,
    accent: st.accent,
    glow: st.glow,
    lamp: st.beacon,
    metalness: Math.min(st.metalness ?? 0.22, 0.35),
    roughness: st.roughness ?? 0.62,
    weather: (hex, i) => weather(hex, i),
  };
}

export function makeHalo(h, def, kind, tex, scale, pos) {
  const mat = h.ownMat(new THREE.SpriteMaterial({
    map: tex, color: 0xffffff, transparent: true, opacity: 0.72,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale, 1);
  if (pos) sprite.position.copy(pos);
  tagPiece(sprite, def, kind);
  return { sprite, mat };
}

export function makeGlazeGlow(h, def, kind, tex, scale) {
  const mat = h.ownMat(new THREE.SpriteMaterial({
    map: tex, color: 0xffffff, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale, 1);
  tagPiece(sprite, def, kind);
  return { sprite, mat };
}

export function glazeRoot(def, kind) {
  const root = new THREE.Group();
  root.name = 'beautiful-landmark';
  root.userData.organic = true;
  tagPiece(root, def, kind);
  return root;
}

export function finishGlaze(root, colors, h) {
  h.registerDimmable(root.userData.poiId, 'visited', EMPTY, colors);
  root.userData.organicParts = collectOrganic(root);
  h.session.organicRoots.push(root);
  return root;
}

export function attachMerged(root, def, kind, geos, h, mats) {
  for (const key of Object.keys(geos)) {
    const geo = h.ownGeo(geos[key]);
    const mat = mats[key];
    if (!mat) continue;
    const mesh = new THREE.Mesh(geo, mat);
    tagPiece(mesh, def, kind);
    root.add(mesh);
  }
  return root;
}

export function markAuthored(root, def, kind) {
  tagPiece(root, def, kind);
  root.userData.authored = def.id;
  return root;
}
