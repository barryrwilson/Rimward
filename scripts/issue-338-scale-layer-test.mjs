/**
 * Issue #338 focused regression — system scale/population Phase 1.
 *
 * Covers the acceptance criteria that can be pinned headlessly:
 *  - deep field builds per system, is deterministic, stays inside the issue
 *    budget (≤20 draw calls / ≤30k triangles), disposes every resource on
 *    'systemLoaded' and adds no ctx/persistent field;
 *  - far-traffic impostors are one instanced layer (capacity 150–300, 1 Hz,
 *    faction colour) and never duplicate a real hull at the 900 u handoff;
 *  - asteroid density reaches the 600–800 cap with the near instanced set
 *    bounded, the far belt as one Points layer, range-gated matrix writes at or
 *    below the Phase-0 baseline, and a save index bound that covers the total.
 *
 * The starfield extent tie and reducedMotion parity are checked where cheap.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installDomStubs, seedBootRandom } from './lib/boot-harness.mjs';

seedBootRandom();
installDomStubs();

const { createCtx } = await import('../src/core/ctx.js');
const { SYSTEMS, U } = await import('../src/game/state.js');
const { initDeepField } = await import('../src/systems/deepfield.js');
const { initStarfield, starfieldScaleFor, systemExtent } = await import('../src/systems/starfield.js');
const { initFarTraffic, shouldShowImpostor } = await import('../src/systems/far-traffic.js');
const { initAsteroids } = await import('../src/systems/asteroids.js');
const fields = await import('../src/game/asteroid-fields.js').catch(() => ({}));

const rendererStub = () => ({
  domElement: { style: {} }, setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {},
});

function scopedCtx(systemId = 'freehold', opts = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const ctx = createCtx({ scene, camera, renderer: rendererStub() });
  ctx.systems = SYSTEMS;
  ctx.world.currentSystem = systemId;
  ctx.world.time = 0;
  ctx.settings.reducedMotion = opts.reducedMotion === true;
  ctx.ship.object = new THREE.Object3D();
  if (Array.isArray(opts.player)) ctx.ship.object.position.fromArray(opts.player);
  ctx.perf = { metrics: {} };
  return ctx;
}

function triangleCount(geometry) {
  if (!geometry) return 0;
  if (geometry.index) return geometry.index.count / 3;
  const pos = geometry.getAttribute && geometry.getAttribute('position');
  return pos ? pos.count / 3 : 0;
}

function renderableChildren(root) {
  const out = [];
  root.traverse((o) => {
    if (o.isMesh || o.isSprite || o.isPoints || o.isLine) out.push(o);
  });
  return out;
}

function captureDisposals(root) {
  const captured = [];
  const disposed = new Set();
  root.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    const resources = [o.geometry, ...mats].filter(Boolean);
    for (const res of resources) {
      const orig = res.dispose.bind(res);
      res.dispose = () => { disposed.add(res); orig(); };
      captured.push(res);
    }
    for (const mat of mats) {
      for (const key of Object.keys(mat)) {
        const value = mat[key];
        if (value && value.isTexture) {
          const orig = value.dispose.bind(value);
          value.dispose = () => { disposed.add(value); orig(); };
          captured.push(value);
        }
      }
    }
  });
  return { captured, disposed };
}

const checks = [];
const check = (name, fn) => {
  try { fn(); checks.push({ name, ok: true }); }
  catch (e) { checks.push({ name, ok: false, error: e.message }); }
};

// ---------------------------------------------------------------------------
// 1. Deep field: budget, determinism, reducedMotion, teardown, no new fields.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold');
  const ctxKeysBefore = new Set(Object.keys(ctx));
  const df = initDeepField(ctx);
  const group = ctx.scene.children.find((o) => o.name === 'deepfield');
  check('deepfield: one group built on init', () => assert.ok(group));
  check('deepfield: no new ctx field', () => assert.deepEqual(Object.keys(ctx).filter((k) => !ctxKeysBefore.has(k)), []));

  const stats = group?.userData?.deepfield ?? {};
  check('deepfield: 2-4 planets', () => assert.ok(stats.planets >= 2 && stats.planets <= 4));
  check('deepfield: 1-2 ring/mega silhouettes', () => assert.ok(stats.rings >= 1 && stats.rings <= 2));
  check('deepfield: 3-6 nebula sprites', () => assert.ok(stats.nebula >= 3 && stats.nebula <= 6));
  check('deepfield: 6-12 station lights', () => assert.ok(stats.stationLights >= 6 && stats.stationLights <= 12));
  check('deepfield: one beacon chain', () => assert.ok(group.children.some((o) => o.name === 'deepfield-beacons')));
  check('deepfield: one lights layer', () => assert.ok(group.children.some((o) => o.name === 'deepfield-lights')));
  check('deepfield: <=20 draw calls', () => assert.ok(stats.drawCalls > 0 && stats.drawCalls <= 20));
  check('deepfield: <=30k triangles', () => assert.ok(stats.triangles > 0 && stats.triangles <= 30000));
  check('deepfield: drawCalls matches traversal', () => assert.equal(stats.drawCalls, renderableChildren(group).length));

  // Determinism: a second build of the same system must match positions/counts.
  const ctx2 = scopedCtx('freehold');
  initDeepField(ctx2);
  const group2 = ctx2.scene.children.find((o) => o.name === 'deepfield');
  const pose = (root) => root.children.map((o) => [o.name, ...o.position.toArray().map((v) => +v.toFixed(6)), ...o.scale.toArray().map((v) => +v.toFixed(6))]);
  check('deepfield: deterministic run-to-run', () => {
    assert.deepEqual(group2.userData.deepfield, group.userData.deepfield);
    assert.deepEqual(pose(group2), pose(group));
  });

  // Slow drift is present by default (rotation, no per-frame allocation).
  df.update(0.5);
  check('deepfield: normal drift is slow', () => assert.ok(Math.abs(group.rotation.y) > 0 && Math.abs(group.rotation.y) < 0.01));

  // Teardown on jump: old resources disposed, old group removed, new build only.
  const { captured, disposed } = captureDisposals(group);
  ctx.lastEvents = [{ type: 'systemLoaded', to: 'veridian' }];
  df.update(0.016);
  check('deepfield: old group leaves the scene', () => assert.equal(group.parent, null));
  check('deepfield: every old resource disposed', () => assert.ok(captured.length > 0 && captured.every((r) => disposed.has(r))));
  check('deepfield: exactly one new deepfield group', () => {
    const groups = ctx.scene.children.filter((o) => o.name === 'deepfield');
    assert.equal(groups.length, 1);
    assert.equal(groups[0].userData.deepfield.system, 'veridian');
  });
  check('deepfield: no persistent world field', () => {
    assert.equal(Object.hasOwn(ctx.world, 'deepfield'), false);
    assert.equal(Object.hasOwn(ctx.world, 'farTraffic'), false);
  });
}

// ReducedMotion parity: the module's own update must freeze rotation.
{
  const ctx = scopedCtx('freehold', { reducedMotion: true });
  const inst = initDeepField(ctx);
  const group = ctx.scene.children.find((o) => o.name === 'deepfield');
  const rot = group.rotation.y;
  const planet = group.children.find((o) => o.name?.startsWith('deepfield-planet-'));
  const spin = planet ? planet.rotation.y : 0;
  inst.update(0.5);
  check('deepfield: reducedMotion freezes rotation', () => {
    assert.equal(group.rotation.y, rot);
    if (planet) assert.equal(planet.rotation.y, spin);
  });
}

// ---------------------------------------------------------------------------
// 2. Starfield extent tie: bounded scale, per-system pure helper.
// ---------------------------------------------------------------------------
{
  check('starfield: extent tie is bounded', () => {
    let min = Infinity, max = -Infinity;
    for (const id of Object.keys(SYSTEMS)) {
      const s = starfieldScaleFor(SYSTEMS[id]);
      assert.ok(Number.isFinite(s));
      min = Math.min(min, s); max = Math.max(max, s);
    }
    assert.ok(min >= 0.9 && max <= 1.15);
  });
  check('starfield: extent helper finite for every system', () => {
    for (const id of Object.keys(SYSTEMS)) assert.ok(systemExtent(SYSTEMS[id]) > 0);
  });
  const ctx = scopedCtx('freehold');
  initStarfield(ctx);
  const group = ctx.scene.children.find((o) => o.name === 'starfield');
  check('starfield: built group carries the extent scale', () => {
    assert.ok(group);
    const s = starfieldScaleFor(SYSTEMS.freehold);
    assert.ok(Math.abs(group.scale.x - s) < 1e-9);
  });
}

// ---------------------------------------------------------------------------
// 3. Far-traffic impostors: one instanced layer, 1 Hz, faction colour, >2500 handoff.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [0, 0, 0] });
  const ctxKeysBefore = new Set(Object.keys(ctx));
  const mkRec = (id, x, extra = {}) => ({
    id, faction: 'freehold', state: 'enroute', system: 'freehold',
    route: [{ x, y: 0, z: 0 }, { x: x + 200, y: 0, z: 0 }], leg: 0, legT: 0.5, ...extra,
  });
  ctx.world.records = [
    mkRec('far', 2600),
    mkRec('near', 500),
    mkRec('live', 2700, { live: true }),
    mkRec('dead', 2800, { state: 'dead' }),
  ];
  const inst = initFarTraffic(ctx);
  const mesh = ctx.scene.children.find((o) => o.name === 'far-traffic-impostors');
  check('impostor: one instanced layer', () => assert.ok(mesh && mesh.isInstancedMesh));
  check('impostor: no new ctx field', () => assert.deepEqual(Object.keys(ctx).filter((k) => !ctxKeysBefore.has(k)), []));
  check('impostor: capacity 150-300', () => assert.ok(mesh.count >= 150 && mesh.count <= 300));
  check('impostor: cheap proxy (<=200 tris)', () => {
    const tris = mesh.geometry.index ? mesh.geometry.index.count / 3 : 0;
    assert.ok(tris > 0 && tris <= 200);
  });
  check('impostor: handoff helper pins the Phase-2 2500 boundary', () => {
    const rec = { state: 'enroute' };
    assert.equal(shouldShowImpostor(rec, 900), false);
    assert.equal(shouldShowImpostor(rec, 900.01), false);
    assert.equal(shouldShowImpostor(rec, 2499), false);
    assert.equal(shouldShowImpostor(rec, 2500), false);
    assert.equal(shouldShowImpostor(rec, 2500.01), true);
    assert.equal(shouldShowImpostor({ state: 'enroute', live: true }, 2500.01), false);
    assert.equal(shouldShowImpostor({ state: 'dead' }, 2500.01), false);
  });
  check('impostor: visible set excludes near/live/dead', () => {
    assert.equal(mesh.userData.visibleCount, 1);
    assert.deepEqual(mesh.userData.visibleRecordIds, ['far']);
    assert.equal(mesh.userData.instanceRecordIds[0], 'far');
    assert.equal(mesh.userData.instanceRecordIds[1], null);
  });
  check('impostor: hidden slots are zero-scaled', () => {
    const m = new THREE.Matrix4();
    mesh.getMatrixAt(1, m);
    assert.equal(m.elements[0], 0);
    assert.equal(m.elements[5], 0);
    assert.equal(m.elements[10], 0);
  });
  check('impostor: per-instance faction colour', () => {
    assert.ok(mesh.instanceColor);
    const c = mesh.instanceColor.array;
    assert.ok(c[0] + c[1] + c[2] > 0);
  });
  check('impostor: 1 Hz cadence', () => {
    const before = mesh.userData.instanceRecordIds;
    ctx.world.time += 0.4;
    inst.update(0.4);
    assert.equal(mesh.userData.instanceRecordIds, before);
    ctx.world.time += 0.7;
    inst.update(0.7);
    assert.notEqual(mesh.userData.instanceRecordIds, before);
  });
  check('impostor: systemLoaded rebuild disposes the old layer', () => {
    const { captured, disposed } = captureDisposals(mesh);
    ctx.world.currentSystem = 'veridian';
    ctx.world.records = [mkRec('v1', 2600, { system: 'veridian' })];
    ctx.lastEvents = [{ type: 'systemLoaded', to: 'veridian' }];
    inst.update(0.016);
    assert.equal(mesh.parent, null);
    assert.ok(captured.length > 0 && captured.every((r) => disposed.has(r)));
    const meshes = ctx.scene.children.filter((o) => o.name === 'far-traffic-impostors');
    assert.equal(meshes.length, 1);
    assert.equal(meshes[0].userData.system, 'veridian');
  });
}

// ---------------------------------------------------------------------------
// 4. Asteroid density: 600-800 system total via one far Points belt, the
//    minable instanced belt + save caps unchanged, range-gated matrix writes.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [120, 20, 620] });
  const ast = initAsteroids(ctx);
  const list = ctx.asteroids.list;
  const total = typeof fields.asteroidTotalCount === 'function' ? fields.asteroidTotalCount(SYSTEMS.freehold) : null;
  const nearCap = fields.ASTEROID_NEAR_CAP ?? 160;
  const totalCap = fields.ASTEROID_TOTAL_CAP ?? 800;
  const farLayer = ctx.scene.children.find((o) => o.name === 'asteroid-belt-far');
  const farCount = farLayer?.userData?.count ?? 0;

  check('asteroids: far belt is one Points layer', () => assert.ok(farLayer && farLayer.isPoints));
  check('asteroids: 2-3 far fields', () => assert.ok(farLayer.userData.fields >= 2 && farLayer.userData.fields <= 3));
  check('asteroids: system total 600-800', () => assert.ok(list.length + farCount >= 600 && list.length + farCount <= totalCap));
  check('asteroids: total matches layout helper', () => {
    assert.ok(total !== null);
    assert.equal(total, list.length + farCount);
  });
  check('asteroids: minable list stays the authored field (save caps unchanged)', () => {
    assert.equal(list.length, SYSTEMS.freehold.field.count);
    assert.ok(list.length <= nearCap);
  });
  check('asteroids: id === array index', () => assert.ok(list.every((e, i) => e.id === i)));
  check('asteroids: entries well formed', () => assert.ok(list.every((e) => e.oreKey && e.commodity && e.hardness >= 1 && e.ore >= 1 && e.radius > 0)));

  // Determinism: identical ore sequence and far-belt positions run-to-run.
  const ctx2 = scopedCtx('freehold', { player: [120, 20, 620] });
  initAsteroids(ctx2);
  check('asteroids: deterministic ore sequence', () => {
    assert.equal(ctx2.asteroids.list.length, list.length);
    assert.equal(ctx2.asteroids.list.map((e) => e.oreKey).join(','), list.map((e) => e.oreKey).join(','));
  });
  check('asteroids: deterministic far belt', () => {
    const far2 = ctx2.scene.children.find((o) => o.name === 'asteroid-belt-far');
    assert.ok(far2);
    assert.equal(far2.userData.count, farCount);
    const a = farLayer.geometry.getAttribute('position').array;
    const b = far2.geometry.getAttribute('position').array;
    assert.equal(a.length, b.length);
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) assert.fail('far belt position ' + i + ' differs');
  });

  const fieldMeshes = [];
  ctx.scene.traverse((o) => { if (o.name?.startsWith('asteroid-field-')) fieldMeshes.push(o); });
  const nearInstances = fieldMeshes.reduce((n, m) => n + m.count, 0);
  check('asteroids: near instanced set bounded', () => assert.ok(nearInstances === list.length && nearInstances <= nearCap));

  // Range gating: writes must not exceed the Phase-0 max (191/frame).
  ast.update(1 / 60);
  const writesNear = ctx.perf.metrics.asteroidMatrixWrites;
  check('asteroids: matrix writes <= Phase-0 max', () => assert.ok(Number.isFinite(writesNear) && writesNear <= 191));

  // Fly far away: the range gate drops every near-belt matrix write.
  ctx.ship.object.position.set(5000, 0, 5000);
  ast.update(1 / 60);
  const writesFar = ctx.perf.metrics.asteroidMatrixWrites;
  check('asteroids: range gating cuts far writes', () => assert.ok(writesFar < writesNear && writesFar === 0));

  check('asteroids: far belt disposed on jump', () => {
    const disposed = new Set();
    for (const res of [farLayer.geometry, farLayer.material]) {
      const orig = res.dispose.bind(res);
      res.dispose = () => { disposed.add(res); orig(); };
    }
    ctx.lastEvents = [{ type: 'systemLoaded', to: 'veridian' }];
    ast.update(0.016);
    assert.equal(farLayer.parent, null);
    assert.ok(disposed.has(farLayer.geometry) && disposed.has(farLayer.material));
    const next = ctx.scene.children.find((o) => o.name === 'asteroid-belt-far');
    assert.ok(next && next !== farLayer.points);
  });

  check('asteroids: no new persistent world field', () => {
    assert.equal(Object.hasOwn(ctx.world, 'asteroidBelt'), false);
    assert.equal(Object.hasOwn(ctx.world, 'deepfield'), false);
  });
}

// ---------------------------------------------------------------------------
const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log((c.ok ? 'ok ' : 'FAIL ') + c.name + (c.ok ? '' : ' — ' + c.error));
console.log('ISSUE338 ' + (failed.length === 0 ? 'PASS' : 'FAIL — ' + failed.length + ' pins'));
if (failed.length > 0) process.exitCode = 1;
