/**
 * Issue #339 focused regression — system scale/population Phase 2 tiers.
 *
 * Covers the acceptance criteria that can be pinned headlessly:
 *  - near/mid/far caps and distances are one shared source (NEAR_CAP 10,
 *    MID_CAP 40, FAR_CAP 256; 900/2500 u) and are observable in the dev-only
 *    perf tier readout;
 *  - mid-traffic is ONE instanced layer at 8 Hz, capacity 30-40, nearest-first
 *    capped, per-instance faction colour, coarse heading, hidden while the
 *    record is live/terminal or beyond MID_RANGE;
 *  - Phase 4 (#341) contract extension: an uninstantiated, non-terminal record
 *    inside NEAR_RANGE (<=900 u) is now drawn by that same mid layer, so station
 *    approach lanes read as traffic with no new layer and no simulation. This
 *    is a deliberate bounded pin update, not a weakened test: the live/terminal
 *    exclusions and the >2500 u far split below are unchanged, and the near
 *    record is expected in the mid visible set only because it is uninstantiated
 *    (traffic.js caps live hulls at 10 and only instantiates state 'enroute');
 *  - far-traffic only draws beyond MID_RANGE so mid and far never draw the
 *    same record, and both layers dispose/rebuild on 'systemLoaded';
 *  - no persistent field is added to ctx or ctx.world; the live near cap and
 *    the abstract record bank are untouched by the presentation layers.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-339-tier-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installDomStubs, seedBootRandom } from './lib/boot-harness.mjs';

seedBootRandom();
installDomStubs();

const { createCtx } = await import('../src/core/ctx.js');
const { U } = await import('../src/game/state.js');
const tiers = await import('../src/game/traffic-tiers.js');
const { initMidTraffic, shouldShowMidProxy } = await import('../src/systems/mid-traffic.js');
const { initFarTraffic, shouldShowImpostor } = await import('../src/systems/far-traffic.js');
const { tierLayerStats } = await import('../src/systems/perf.js');

const rendererStub = () => ({
  domElement: { style: {} }, setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {},
});

function scopedCtx(systemId = 'freehold', opts = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const ctx = createCtx({ scene, camera, renderer: rendererStub() });
  ctx.systems = { freehold: { id: 'freehold' }, veridian: { id: 'veridian' } };
  ctx.world.currentSystem = systemId;
  ctx.world.time = 0;
  ctx.settings.reducedMotion = opts.reducedMotion === true;
  ctx.ship.object = new THREE.Object3D();
  if (Array.isArray(opts.player)) ctx.ship.object.position.fromArray(opts.player);
  return ctx;
}

function mkRec(id, x, extra = {}) {
  return {
    id, faction: 'freehold', classKey: 'cutter', state: 'enroute', system: 'freehold',
    route: [{ x, y: 0, z: 0 }, { x: x + 100, y: 0, z: 0 }],
    leg: 0, legT: 0.5, dir: 1,
    ...extra,
  };
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
  });
  return { captured, disposed };
}

const checks = [];
const check = (name, fn) => {
  try { fn(); checks.push({ name, ok: true }); }
  catch (e) { checks.push({ name, ok: false, error: e.message }); }
};

// ---------------------------------------------------------------------------
// 1. Tier constants: one shared source for caps/distances.
// ---------------------------------------------------------------------------
check('tiers: near cap is the live full-sim cap', () => {
  assert.equal(tiers.NEAR_CAP, 10);
  assert.equal(tiers.NEAR_RANGE, U.INSTANTIATE_RANGE);
  assert.equal(tiers.NEAR_RANGE, 900);
});
check('tiers: mid band 900-2500 and capacity 30-40', () => {
  assert.equal(tiers.MID_RANGE, 2500);
  assert.ok(tiers.MID_CAP >= 30 && tiers.MID_CAP <= 40);
});
check('tiers: far capacity 150-300', () => assert.ok(tiers.FAR_CAP >= 150 && tiers.FAR_CAP <= 300));

// ---------------------------------------------------------------------------
// 2. Mid-traffic: one instanced layer, capacity, cheap proxy, colour.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [0, 0, 0] });
  const ctxKeysBefore = new Set(Object.keys(ctx));
  ctx.world.records = [mkRec('mid', 1500), mkRec('near', 500), mkRec('far', 2600)];
  const inst = initMidTraffic(ctx);
  const mesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');
  check('mid: one instanced layer', () => assert.ok(mesh && mesh.isInstancedMesh));
  check('mid: no new ctx field', () => assert.deepEqual(Object.keys(ctx).filter((k) => !ctxKeysBefore.has(k)), []));
  check('mid: capacity 30-40', () => assert.equal(mesh.count, tiers.MID_CAP));
  check('mid: cheap proxy (<=200 tris)', () => {
    const tris = mesh.geometry.index ? mesh.geometry.index.count / 3 : 0;
    assert.ok(tris > 0 && tris <= 200);
  });
  check('mid: 8 Hz refresh cadence', () => assert.equal(mesh.userData.refreshSeconds, 1 / 8));
  check('mid: per-instance faction colour', () => {
    assert.ok(mesh.instanceColor);
    const c = mesh.instanceColor.array;
    assert.ok(c[0] + c[1] + c[2] > 0);
  });
  check('mid: handoff helper pins the Phase 4 near/mid/far boundaries', () => {
    const rec = { state: 'enroute' };
    // Phase 4 (#341): uninstantiated near records draw in this layer too.
    assert.equal(shouldShowMidProxy(rec, 0), true);
    assert.equal(shouldShowMidProxy(rec, 150), true);
    assert.equal(shouldShowMidProxy(rec, 900), true);
    assert.equal(shouldShowMidProxy(rec, 900.01), true);
    assert.equal(shouldShowMidProxy(rec, 2499), true);
    assert.equal(shouldShowMidProxy(rec, 2500), true);
    assert.equal(shouldShowMidProxy(rec, 2500.01), false);
    assert.equal(shouldShowMidProxy(rec, Infinity), false);
    // Live/terminal exclusions are unchanged: no duplicate hull, no ghost.
    assert.equal(shouldShowMidProxy({ state: 'enroute', live: true }, 150), false);
    assert.equal(shouldShowMidProxy({ state: 'enroute', live: true }, 1500), false);
    assert.equal(shouldShowMidProxy({ state: 'dead' }, 150), false);
    assert.equal(shouldShowMidProxy({ state: 'dead' }, 1500), false);
    assert.equal(shouldShowMidProxy({ state: 'captured' }, 1500), false);
    assert.equal(shouldShowMidProxy({ state: 'inTransit' }, 1500), false);
  });
  check('mid: visible set is the near + mid records, nearest first', () => {
    // Phase 4 (#341): 'near' (500 u) is uninstantiated in this scoped ctx, so
    // the approach-lane proxy now draws; 'mid' (1500 u) still draws.
    assert.equal(mesh.userData.visibleCount, 2);
    assert.deepEqual(mesh.userData.visibleRecordIds, ['near', 'mid']);
    assert.equal(mesh.userData.instanceRecordIds[0], 'near');
    assert.equal(mesh.userData.instanceRecordIds[1], 'mid');
    assert.equal(mesh.userData.nearProxyCount, 1);
    assert.deepEqual(mesh.userData.nearProxyIds, ['near']);
  });
  check('mid: hidden slots are zero-scaled', () => {
    const m = new THREE.Matrix4();
    mesh.getMatrixAt(2, m); // slot 2 is the far record; only near/mid draw
    assert.equal(m.elements[0], 0);
    assert.equal(m.elements[5], 0);
    assert.equal(m.elements[10], 0);
  });
  check('mid: 8 Hz cadence, not per-frame', () => {
    const before = mesh.userData.instanceRecordIds;
    inst.update(0.1);
    assert.equal(mesh.userData.instanceRecordIds, before);
    inst.update(0.03);
    assert.notEqual(mesh.userData.instanceRecordIds, before);
  });
  check('mid: coarse heading points at the next waypoint', () => {
    // Slot 0 is the nearest visible proxy (the Phase 4 near record). Route runs
    // +X; the proxy nose (+Z local) must point +X, i.e. a yaw of +pi/2. Read
    // the composed matrix and verify its local +Z maps to +X.
    const m = new THREE.Matrix4();
    mesh.getMatrixAt(0, m);
    const dir = new THREE.Vector3(0, 0, 1).applyMatrix4(new THREE.Matrix4().extractRotation(m));
    assert.ok(Math.abs(dir.x) > 0.9);
  });
}

// ---------------------------------------------------------------------------
// 3. No duplicate: mid and far split the band; live records hide both.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [0, 0, 0] });
  ctx.world.records = [
    mkRec('near', 500),
    mkRec('mid', 1500),
    mkRec('far', 2600),
    mkRec('liveMid', 1500, { live: true }),
    mkRec('deadMid', 1500, { state: 'dead' }),
  ];
  const mid = initMidTraffic(ctx);
  const far = initFarTraffic(ctx);
  const midMesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');
  const farMesh = ctx.scene.children.find((o) => o.name === 'far-traffic-impostors');
  check('split: mid visible ids are the uninstantiated near + mid records', () => {
    // Phase 4 (#341): the near record is uninstantiated in this scoped ctx, so
    // it draws in the existing mid layer; live/terminal records still do not.
    assert.deepEqual(midMesh.userData.visibleRecordIds, ['near', 'mid']);
    assert.equal(midMesh.userData.nearProxyCount, 1);
    assert.deepEqual(midMesh.userData.nearProxyIds, ['near']);
  });
  check('split: far visible ids are exactly the far record', () => {
    assert.deepEqual(farMesh.userData.visibleRecordIds, ['far']);
  });
  check('split: no record is drawn by both layers', () => {
    const midIds = new Set(midMesh.userData.visibleRecordIds);
    for (const id of farMesh.userData.visibleRecordIds) assert.ok(!midIds.has(id), id + ' duplicated');
  });
  check('split: near record is drawn by mid only (far keeps >2500 u)', () => {
    assert.ok(midMesh.userData.visibleRecordIds.includes('near'));
    assert.ok(!farMesh.userData.visibleRecordIds.includes('near'));
  });
  check('split: live/terminal records are hidden by both', () => {
    for (const id of ['liveMid', 'deadMid']) {
      assert.ok(!midMesh.userData.visibleRecordIds.includes(id));
      assert.ok(!farMesh.userData.visibleRecordIds.includes(id));
    }
  });
  check('split: tier readout reports caps and layer counts', () => {
    const tiersOut = tierLayerStats(ctx);
    assert.deepEqual(tiersOut.caps, { near: tiers.NEAR_CAP, mid: tiers.MID_CAP, far: tiers.FAR_CAP });
    assert.equal(tiersOut.midProxies.capacity, tiers.MID_CAP);
    assert.equal(tiersOut.midProxies.visible, 2);
    assert.equal(tiersOut.farImpostors.capacity, tiers.FAR_CAP);
    assert.equal(tiersOut.farImpostors.visible, 1);
  });
  check('split: layers add no persistent world field', () => {
    assert.equal(Object.hasOwn(ctx.world, 'midTraffic'), false);
    assert.equal(Object.hasOwn(ctx.world, 'farTraffic'), false);
  });
}

// ---------------------------------------------------------------------------
// 4. Mid capacity is enforced nearest-first (40 of 50 qualifying records).
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [0, 0, 0] });
  ctx.world.records = [];
  for (let i = 0; i < 50; i++) ctx.world.records.push(mkRec('r' + i, 1000 + i * 20));
  initMidTraffic(ctx);
  const mesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');
  check('mid: cap enforced at MID_CAP', () => {
    assert.equal(mesh.userData.visibleCount, tiers.MID_CAP);
    assert.equal(mesh.userData.visibleRecordIds.length, tiers.MID_CAP);
  });
  check('mid: nearest records win the capped slots', () => {
    for (let i = 0; i < tiers.MID_CAP; i++) assert.equal(mesh.userData.visibleRecordIds[i], 'r' + i);
    assert.ok(!mesh.userData.visibleRecordIds.includes('r' + tiers.MID_CAP));
  });
}

// ---------------------------------------------------------------------------
// 5. systemLoaded rebuild/dispose for both layers, one mesh each.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [0, 0, 0] });
  ctx.world.records = [mkRec('mid', 1500), mkRec('far', 2600)];
  const mid = initMidTraffic(ctx);
  const far = initFarTraffic(ctx);
  const midMesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');
  const farMesh = ctx.scene.children.find((o) => o.name === 'far-traffic-impostors');
  const midDispose = captureDisposals(midMesh);
  const farDispose = captureDisposals(farMesh);
  ctx.world.currentSystem = 'veridian';
  ctx.world.records = [mkRec('vMid', 1500, { system: 'veridian' }), mkRec('vFar', 2600, { system: 'veridian' })];
  ctx.lastEvents = [{ type: 'systemLoaded', to: 'veridian' }];
  mid.update(0.016);
  far.update(0.016);
  check('rebuild: old mid layer leaves the scene', () => assert.equal(midMesh.parent, null));
  check('rebuild: old far layer leaves the scene', () => assert.equal(farMesh.parent, null));
  check('rebuild: old mid resources disposed', () => assert.ok(midDispose.captured.length > 0 && midDispose.captured.every((r) => midDispose.disposed.has(r))));
  check('rebuild: old far resources disposed', () => assert.ok(farDispose.captured.length > 0 && farDispose.captured.every((r) => farDispose.disposed.has(r))));
  check('rebuild: exactly one mid and one far layer in the new system', () => {
    const mids = ctx.scene.children.filter((o) => o.name === 'mid-traffic-proxies');
    const fars = ctx.scene.children.filter((o) => o.name === 'far-traffic-impostors');
    assert.equal(mids.length, 1);
    assert.equal(fars.length, 1);
    assert.equal(mids[0].userData.system, 'veridian');
    assert.equal(fars[0].userData.system, 'veridian');
  });
}

// ---------------------------------------------------------------------------
// 6. reducedMotion must not freeze the abstract-position refresh.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [0, 0, 0], reducedMotion: true });
  const rec = mkRec('mover', 1500);
  ctx.world.records = [rec];
  const inst = initMidTraffic(ctx);
  const mesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');
  const before = new THREE.Matrix4();
  mesh.getMatrixAt(0, before);
  rec.legT = 0.8;
  inst.update(1 / 8);
  const after = new THREE.Matrix4();
  mesh.getMatrixAt(0, after);
  check('reducedMotion: mid proxies still follow abstract records', () => {
    assert.notDeepEqual(before.elements, after.elements);
  });
}

// ---------------------------------------------------------------------------
// 7. Presentation-only: no live ships are created or mutated.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [0, 0, 0] });
  ctx.world.records = [mkRec('mid', 1500), mkRec('far', 2600)];
  const shipsBefore = ctx.ships.length;
  const recordJson = JSON.stringify(ctx.world.records);
  initMidTraffic(ctx);
  initFarTraffic(ctx);
  check('presentation: no live ships created', () => assert.equal(ctx.ships.length, shipsBefore));
  check('presentation: records are not mutated', () => assert.equal(JSON.stringify(ctx.world.records), recordJson));
}

const failures = checks.filter((c) => !c.ok);
for (const c of checks) console.log((c.ok ? 'ok ' : 'FAIL ') + c.name + (c.ok ? '' : ' — ' + c.error));
if (failures.length > 0) {
  console.error('ISSUE #339 TIERS FAIL (' + failures.length + ' of ' + checks.length + ')');
  process.exit(1);
}
console.log('ISSUE #339 TIERS PASS (' + checks.length + ' checks)');
