// Bloom measuring tool (wave 48) — the wave-47 sculpt measurer, bloom mode.
//
// Runs the REAL initStation path for the Beautiful Ones station outside the
// game and reports what the file actually built: per-mesh vertex census by
// channel, the merged-chunk totals, the envelope, detail seating, the hull
// palette, and the resource counts. It exists because of the wave-46 rule —
// measure the FILE, never the report — and because the Bloom is the one
// station whose geometry rides animated parts, so a chunk parented to the
// wrong group is invisible to every static census.
//
// Run: node --import ./scripts/with-css-stub.mjs scripts/measure-bloom.mjs
//
// Throwaway diagnostic, like scripts/boot-test.mjs. Not imported by the game.

import * as THREE from 'three';

// ---- Minimal DOM stub: organic.js paints its textures on a 2d canvas ----
function makeCtx2d() {
  const gradient = { addColorStop() {} };
  return new Proxy({
    canvas: null,
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    createPattern: () => null,
    measureText: () => ({ width: 10 }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, (w || 1) * (h || 1) * 4)) }),
  }, {
    get(t, p) { return p in t ? t[p] : (typeof p === 'string' ? function () {} : undefined); },
    set() { return true; },
  });
}
function makeEl(tag = 'div') {
  return {
    tagName: String(tag).toUpperCase(),
    children: [], style: { setProperty() {} }, dataset: {}, innerHTML: '', textContent: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { this.children.push(c); return c; },
    append(...c) { this.children.push(...c); },
    prepend() {}, remove() {}, removeChild() {}, insertAdjacentHTML() {},
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 }; },
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
    focus() {}, click() {},
  };
}
const els = new Map();
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  createDocumentFragment: () => makeEl('fragment'),
  getElementById: (id) => { if (!els.has(id)) els.set(id, makeEl()); return els.get(id); },
  querySelector: () => null, querySelectorAll: () => [], body: makeEl('body'),
  addEventListener() {}, hidden: false,
};
globalThis.window = {
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
};
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.sessionStorage = globalThis.localStorage;

const { createCtx } = await import('../src/core/ctx.js');
const { SYSTEMS } = await import('../src/game/state.js');
const { initStation } = await import('../src/systems/station.js');
const { ORGANIC } = await import('../src/systems/organic.js');
const { SHADES, weather } = await import('../src/systems/station-detail.js');

const SYSTEM = process.argv[2] || 'bt_cradle';

// ---- Build the station through the real path ----
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
const ctx = createCtx({ scene, camera, renderer });
ctx.systems = SYSTEMS;
ctx.world.currentSystem = SYSTEM;
initStation(ctx);

let group = null;
scene.traverse((o) => { if (o.name === 'beautiful-station') group = o; });
if (!group) {
  console.log(`NO BLOOM at ${SYSTEM} (faction is ${SYSTEMS[SYSTEM]?.faction})`);
  process.exit(1);
}
group.updateMatrixWorld(true);

// ---- 1. Vertex census, per material role ----
// The Bloom mixes animated shells (skin/petal/web/hearth) with merged chunks
// (vertexColors), so the census splits by material rather than by name: a
// merged chunk is exactly a mesh whose material carries vertexColors.
const roleOf = (mesh) => {
  const m = mesh.material;
  if (!m) return 'none';
  if (m.vertexColors) {
    if (m.isMeshStandardMaterial) return 'organicHull';
    if (m.transparent && m.depthWrite === false) return 'organicGlaze';
    return 'organicGlow';
  }
  if (m.isMeshPhysicalMaterial) return 'glass';
  if (m.isMeshStandardMaterial) return 'shell';
  return 'lamp';
};
const census = {};
let total = 0;
let meshes = 0;
let sprites = 0;
group.traverse((o) => {
  if (o.isSprite) { sprites++; return; }
  if (!o.isMesh || !o.geometry) return;
  meshes++;
  const n = o.geometry.attributes.position?.count ?? 0;
  total += n;
  const r = roleOf(o);
  census[r] = (census[r] ?? 0) + n;
});
const merged = (census.organicHull ?? 0) + (census.organicGlow ?? 0) + (census.organicGlaze ?? 0);
const glowTotal = (census.organicGlow ?? 0) + (census.lamp ?? 0);

// ---- 2. Envelope, station-local, over mesh geometry ----
const bb = new THREE.Box3();
const one = new THREE.Box3();
group.traverse((o) => {
  if (!o.isMesh || !o.geometry) return;
  if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
  one.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
  bb.union(one);
});
bb.min.sub(group.position);
bb.max.sub(group.position);

// ---- 3. Seating: every merged glow/glaze vertex near real structure ----
// Hull set = merged organicHull PLUS the animated shells at rest pose (the
// arms, bell, petals and webs are structure too, they just move).
const cell = 2;
const occupied = new Set();
const key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
const world = new THREE.Vector3();
const addOccupied = (mesh) => {
  const p = mesh.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    world.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(mesh.matrixWorld).sub(group.position);
    occupied.add(key(world.x, world.y, world.z));
  }
};
const detail = [];
group.traverse((o) => {
  if (!o.isMesh || !o.geometry) return;
  const r = roleOf(o);
  if (r === 'organicGlow' || r === 'organicGlaze') detail.push(o);
  else addOccupied(o);
});
let orphan = 0;
let detailVerts = 0;
for (const mesh of detail) {
  const p = mesh.geometry.attributes.position;
  detailVerts += p.count;
  for (let i = 0; i < p.count; i++) {
    world.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(mesh.matrixWorld).sub(group.position);
    const ix = Math.floor(world.x / cell);
    const iy = Math.floor(world.y / cell);
    const iz = Math.floor(world.z / cell);
    let near = false;
    for (let dx = -1; dx <= 1 && !near; dx++) {
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dz = -1; dz <= 1 && !near; dz++) {
          if (occupied.has(`${ix + dx},${iy + dy},${iz + dz}`)) near = true;
        }
      }
    }
    if (!near) orphan++;
  }
}
const orphanPct = detailVerts > 0 ? (100 * orphan) / detailVerts : 0;

// ---- 4. Hull palette: ORGANIC bases crossed with the SHADES ladder ----
const BASES = [ORGANIC.nacre, ORGANIC.nacreShadow, ORGANIC.gilt, ORGANIC.deepFlesh, ORGANIC.coral, ORGANIC.coralDeep];
const allowed = new Set();
for (const b of BASES) for (let i = 0; i < SHADES.length; i++) allowed.add(weather(b, i));
const strays = new Map();
const c = new THREE.Color();
group.traverse((o) => {
  if (!o.isMesh || roleOf(o) !== 'organicHull') return;
  const col = o.geometry.attributes.color;
  if (!col) { strays.set('NO COLOR ATTRIBUTE', 1); return; }
  for (let i = 0; i < col.count; i++) {
    c.setRGB(col.getX(i), col.getY(i), col.getZ(i));
    const hex = c.getHex();
    if (!allowed.has(hex)) strays.set(hex, (strays.get(hex) ?? 0) + 1);
  }
});

// ---- 5. Mean hull luminance (the wave-47 at-range value check) ----
let lum = 0;
let lumN = 0;
group.traverse((o) => {
  if (!o.isMesh || roleOf(o) !== 'organicHull') return;
  const col = o.geometry.attributes.color;
  if (!col) return;
  for (let i = 0; i < col.count; i++) {
    lum += 0.2126 * col.getX(i) + 0.7152 * col.getY(i) + 0.0722 * col.getZ(i);
    lumN++;
  }
});

// ---- 6. Resources ----
const geos = new Set();
const mats = new Set();
const texs = new Set();
let lights = 0;
group.traverse((o) => {
  if (o.isLight) lights++;
  if (o.geometry) geos.add(o.geometry);
  const m = o.material;
  if (!m) return;
  for (const mm of Array.isArray(m) ? m : [m]) {
    mats.add(mm);
    for (const k of ['map', 'emissiveMap', 'alphaMap', 'normalMap']) if (mm[k]) texs.add(mm[k]);
  }
});

// ---- Report ----
const fmt = (n) => n.toLocaleString('en-US');
console.log(`bloom @ ${SYSTEM} — ${SYSTEMS[SYSTEM].station?.name ?? '?'}`);
console.log(`  meshes ${meshes}  sprites ${sprites}  geometries ${geos.size}  materials ${mats.size}  textures ${texs.size}  lights ${lights}`);
console.log(`  vertices TOTAL ${fmt(total)}   merged ${fmt(merged)}   animated ${fmt(total - merged)}`);
for (const k of Object.keys(census).sort((a, b) => census[b] - census[a])) {
  console.log(`    ${k.padEnd(14)} ${fmt(census[k])}`);
}
console.log(`  glow (organicGlow + lamps) ${fmt(glowTotal)}`);
console.log(`  envelope  x [${bb.min.x.toFixed(1)}, ${bb.max.x.toFixed(1)}]  y [${bb.min.y.toFixed(1)}, ${bb.max.y.toFixed(1)}]  z [${bb.min.z.toFixed(1)}, ${bb.max.z.toFixed(1)}]`);
console.log(`  seating   ${fmt(detailVerts)} detail verts, ${orphan} orphans (${orphanPct.toFixed(2)}%)`);
console.log(`  palette   ${strays.size === 0 ? 'clean' : `${strays.size} STRAY COLOURS`}`);
for (const [hex, n] of strays) console.log(`    stray ${typeof hex === 'number' ? `0x${hex.toString(16).padStart(6, '0')}` : hex} × ${n}`);
console.log(`  hull mean luminance ${lumN > 0 ? (lum / lumN).toFixed(3) : 'n/a'} (ferrous 0.269, veridian 0.300, hollow 0.276)`);
