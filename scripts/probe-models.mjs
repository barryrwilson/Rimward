/**
 * Models Browser catalog probe.
 *
 * Builds EVERY entry in src/game/model-catalog.js headlessly and reports, per
 * entry: mesh count, triangle count, bounding radius, and whether the object
 * is origin-centred. Then ticks each entry's update() twice to prove the
 * animation hook is callable and allocation-free of exceptions.
 *
 * WHY: the browser builds these lazily, one click at a time, so a sculpt that
 * throws for one faction/class pair would only surface when a player happened
 * to select it. This walks all of them in one pass.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/probe-models.mjs
 */
import * as THREE from 'three';

// ---- Minimal DOM stubs (canvas 2d only — the texture builders need it) ----
function makeCtx2d() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {
      canvas: null,
      createRadialGradient: () => gradient,
      createLinearGradient: () => gradient,
      createPattern: () => null,
      measureText: () => ({ width: 10 }),
      getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }),
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, (w || 1) * (h || 1) * 4)) }),
    },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        return typeof prop === 'string' ? function () {} : undefined;
      },
      set() { return true; },
    },
  );
}
function makeEl(tag = 'div') {
  return {
    tagName: tag.toUpperCase(),
    style: { setProperty() {} },
    width: 0,
    height: 0,
    getContext: (kind) => (kind === '2d' ? makeCtx2d() : null),
    appendChild(c) { return c; },
    addEventListener() {},
    remove() {},
  };
}
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  body: makeEl('body'),
  addEventListener() {},
};
globalThis.window = {
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
};

const { MODEL_CATALOG, MODEL_CATEGORIES } = await import('../src/game/model-catalog.js');

// ---- Catalog shape checks ----
const ids = new Set();
let dupIds = 0;
let badCategory = 0;
for (const e of MODEL_CATALOG) {
  if (ids.has(e.id)) dupIds++;
  ids.add(e.id);
  if (!MODEL_CATEGORIES.includes(e.category)) badCategory++;
}

const only = process.argv[2] ?? null; // optional substring filter
const entries = only ? MODEL_CATALOG.filter((e) => e.id.includes(only)) : MODEL_CATALOG;

const _box = new THREE.Box3();
const _sphere = new THREE.Sphere();
const _center = new THREE.Vector3();

const rows = [];
const failures = [];
const animFailures = [];
let noUpdate = 0;

for (const entry of entries) {
  let built;
  try {
    built = entry.build();
  } catch (err) {
    failures.push({ id: entry.id, why: `build: ${err.message}` });
    continue;
  }
  const object = built?.object;
  if (!object || !object.isObject3D) {
    failures.push({ id: entry.id, why: 'build() returned no Object3D' });
    continue;
  }
  if (object.parent) failures.push({ id: entry.id, why: 'object is parented' });

  let meshes = 0;
  let tris = 0;
  object.traverse((c) => {
    if (c.isMesh) {
      meshes++;
      const g = c.geometry;
      if (g) tris += (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3;
    } else if (c.isPoints || c.isSprite) {
      meshes++;
    }
  });

  object.updateMatrixWorld(true);
  _box.setFromObject(object);
  const empty = _box.isEmpty();
  const radius = empty ? 0 : _box.getBoundingSphere(_sphere).radius;
  const center = empty ? _center.set(0, 0, 0) : _box.getCenter(_center);
  const offset = Math.hypot(center.x, center.y, center.z);

  if (empty) failures.push({ id: entry.id, why: 'empty bounding box (no geometry)' });
  if (!Number.isFinite(radius)) failures.push({ id: entry.id, why: 'non-finite radius' });
  // The browser frames on the bbox centre, so a model may be off-origin — but
  // it must not be off by orders of magnitude more than its own size (that is
  // a builder that forgot to strip its world-record position).
  if (radius > 0 && offset > radius * 8) {
    failures.push({ id: entry.id, why: `far off origin: |c|=${offset.toFixed(1)} r=${radius.toFixed(1)}` });
  }

  if (typeof built.update === 'function') {
    try {
      built.update(0.5, false);
      built.update(1.25, false);
      built.update(2.0, true); // reducedMotion must be a safe no-op path
    } catch (err) {
      animFailures.push({ id: entry.id, why: err.message });
    }
  } else {
    noUpdate++;
  }

  rows.push({ id: entry.id, cat: entry.category, meshes, tris: Math.round(tris), r: radius, off: offset });
}

// ---- Report ----
const byCat = {};
for (const r of rows) {
  const c = (byCat[r.cat] ??= { n: 0, meshes: 0, tris: 0, rMin: Infinity, rMax: 0 });
  c.n++;
  c.meshes += r.meshes;
  c.tris += r.tris;
  c.rMin = Math.min(c.rMin, r.r);
  c.rMax = Math.max(c.rMax, r.r);
}

console.log(`catalog: ${MODEL_CATALOG.length} entries, ${ids.size} unique ids, ${dupIds} duplicates, ${badCategory} bad categories`);
console.log(`probed:  ${entries.length} entries, ${rows.length} built, ${failures.length} failures, ${animFailures.length} animation failures, ${noUpdate} without update()`);
console.log('');
for (const cat of MODEL_CATEGORIES) {
  const c = byCat[cat];
  if (!c) continue;
  console.log(
    `${cat.padEnd(11)} n=${String(c.n).padStart(3)}  meshes=${String(c.meshes).padStart(5)}` +
    `  tris=${String(c.tris).padStart(8)}  radius ${c.rMin.toFixed(2)}..${c.rMax.toFixed(2)}`,
  );
}

const widest = [...rows].sort((a, b) => b.tris - a.tris).slice(0, 8);
console.log('\nheaviest models by triangle count:');
for (const r of widest) console.log(`  ${r.id.padEnd(38)} ${String(r.tris).padStart(7)} tris  r=${r.r.toFixed(1)}`);

if (failures.length) {
  console.log('\nBUILD FAILURES:');
  for (const f of failures) console.log(`  ${f.id}: ${f.why}`);
}
if (animFailures.length) {
  console.log('\nANIMATION FAILURES:');
  for (const f of animFailures) console.log(`  ${f.id}: ${f.why}`);
}

const ok = failures.length === 0 && animFailures.length === 0 && dupIds === 0 && badCategory === 0;
console.log(ok ? '\nMODEL PROBE PASS' : '\nMODEL PROBE FAIL');
process.exit(ok ? 0 : 1);
