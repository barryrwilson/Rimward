/**
 * Issue #341 focused regression — Phase 4 station approach-lane traffic.
 *
 * Pins the approach-lane half of the issue:
 *  - the EXISTING mid-traffic instanced layer (one mesh, MID_CAP 40, 8 Hz)
 *    also draws uninstantiated, non-terminal records inside NEAR_RANGE
 *    (<=900 u), so a docked/queued station-hold trader reads as traffic while
 *    the player is docked and traffic.js cannot instantiate it (live cap 10,
 *    only state 'enroute' instantiates);
 *  - a live near record hides its proxy, terminal near records never draw, and
 *    far (>2500 u) stays in far-traffic's band so mid and far never draw the
 *    same id;
 *  - promoting a near record to live hides its proxy on the next update;
 *  - nearProxyCount/nearProxyIds evidence is exact and shrinks with the slot;
 *  - presentation-only: one layer, class scale/heading/faction colour, no new
 *    ctx field, no live ships, no record mutation.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-341-approach-lane-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installDomStubs, seedBootRandom } from './lib/boot-harness.mjs';

seedBootRandom();
installDomStubs();

const { createCtx } = await import('../src/core/ctx.js');
const { SYSTEMS, U } = await import('../src/game/state.js');
const tiers = await import('../src/game/traffic-tiers.js');
const { initMidTraffic, shouldShowMidProxy } = await import('../src/systems/mid-traffic.js');
const { initFarTraffic } = await import('../src/systems/far-traffic.js');
const { recordPosition } = await import('../src/game/world.js');
const { writeStationHold } = await import('../src/game/traffic-feel.js');
const { scaleFor } = await import('../src/game/ship-scale.js');
const { styleFor } = await import('../src/game/faction-style.js');

// Realistic Freehold geometry: authored station [120,20,620] and primary gate.
const STATION = SYSTEMS.freehold.station.position;
const GATE = SYSTEMS.freehold.gates[0].position;
const PLAYER = STATION;

const rendererStub = () => ({
  domElement: { style: {} }, setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {},
});

function scopedCtx(opts = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const ctx = createCtx({ scene, camera, renderer: rendererStub() });
  ctx.systems = { freehold: SYSTEMS.freehold };
  ctx.world.currentSystem = 'freehold';
  ctx.world.time = 0;
  ctx.settings.reducedMotion = opts.reducedMotion === true;
  ctx.flags.docked = opts.docked === true;
  ctx.ship.object = new THREE.Object3D();
  ctx.ship.object.position.set(...PLAYER);
  ctx.world.records = opts.records ?? [];
  return ctx;
}

function mkRec(id, route, extra = {}) {
  return {
    id, faction: 'freehold', classKey: 'cutter', state: 'enroute', system: 'freehold',
    route, leg: 0, legT: 0.5, dir: 1,
    ...extra,
  };
}

function holdFor(classKey) {
  return writeStationHold({ x: 0, y: 0, z: 0 }, STATION, classKey, GATE);
}

function mkDocked(id, classKey) {
  const hold = holdFor(classKey);
  return mkRec(id, [hold, { x: GATE[0], y: GATE[1], z: GATE[2] }], {
    state: 'docked', classKey, leg: 0, legT: 0,
  });
}

function mkLane(id, offsetX, classKey) {
  const px = PLAYER[0] + offsetX;
  return mkRec(id, [
    { x: px, y: PLAYER[1], z: PLAYER[2] },
    { x: px + 100, y: PLAYER[1], z: PLAYER[2] },
  ], { classKey, legT: 0.5 });
}

function distanceOf(rec, playerPos) {
  const p = new THREE.Vector3();
  recordPosition(rec, p);
  return p.distanceTo(playerPos);
}

function expectedVisible(records, playerPos) {
  const out = [];
  for (const rec of records) {
    const d = distanceOf(rec, playerPos);
    if (shouldShowMidProxy(rec, d)) out.push({ id: rec.id, distance: d });
  }
  out.sort((a, b) => a.distance - b.distance);
  return out;
}

const checks = [];
const check = (name, fn) => {
  try { fn(); checks.push({ name, ok: true }); }
  catch (e) { checks.push({ name, ok: false, error: e.message }); }
};

// ---------------------------------------------------------------------------
// 1. The docked station approach lane is visible in the existing mid layer
//    while the player is docked — realistic station-hold geometry.
// ---------------------------------------------------------------------------
{
  const records = [
    mkDocked('dock-freighter', 'freighter'),
    mkDocked('dock-cutter', 'cutter'),
    mkLane('lane-enroute', 500, 'cutter'),
    mkLane('lane-queue', 800, 'freighter'),
    mkLane('live-near', 200, 'cutter'),
    mkRec('dead-near', [{ x: PLAYER[0] + 300, y: PLAYER[1], z: PLAYER[2] },
      { x: PLAYER[0] + 400, y: PLAYER[1], z: PLAYER[2] }], { state: 'dead' }),
    mkRec('captured-near', [{ x: PLAYER[0] + 400, y: PLAYER[1], z: PLAYER[2] },
      { x: PLAYER[0] + 500, y: PLAYER[1], z: PLAYER[2] }], { state: 'captured' }),
    mkRec('transit-near', [{ x: PLAYER[0] + 600, y: PLAYER[1], z: PLAYER[2] },
      { x: PLAYER[0] + 700, y: PLAYER[1], z: PLAYER[2] }], { state: 'inTransit' }),
    mkRec('far-lane', [{ x: PLAYER[0] + 3000, y: PLAYER[1], z: PLAYER[2] },
      { x: PLAYER[0] + 3100, y: PLAYER[1], z: PLAYER[2] }]),
  ];
  records[4].live = true;
  const ctx = scopedCtx({ records, docked: true });
  const playerPos = ctx.ship.object.position;
  const expected = expectedVisible(records, playerPos);
  const expectedNear = expected.filter((e) => e.distance <= tiers.NEAR_RANGE);
  const ctxKeys = new Set(Object.keys(ctx));
  const worldKeys = new Set(Object.keys(ctx.world));
  const shipsBefore = ctx.ships.length;
  const jsonBefore = JSON.stringify(ctx.world.records);
  const inst = initMidTraffic(ctx);
  const mesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');

  check('approach: one existing instanced mid layer, no new render system', () => {
    const layers = ctx.scene.children.filter((o) => o.name === 'mid-traffic-proxies');
    assert.equal(layers.length, 1);
    assert.ok(mesh && mesh.isInstancedMesh);
  });
  check('approach: capacity MID_CAP 40 and 8 Hz cadence kept', () => {
    assert.equal(mesh.count, tiers.MID_CAP);
    assert.equal(mesh.userData.capacity, tiers.MID_CAP);
    assert.equal(mesh.userData.refreshSeconds, 1 / 8);
    assert.equal(tiers.MID_CAP, 40);
  });
  check('approach: station hold sits inside NEAR_RANGE (~150 u approach)', () => {
    for (const id of ['dock-freighter', 'dock-cutter']) {
      const rec = records.find((r) => r.id === id);
      const d = distanceOf(rec, playerPos);
      assert.ok(d > 0 && d <= tiers.NEAR_RANGE, id + ' hold distance ' + d);
      assert.ok(d <= 200, id + ' hold is not a station approach distance: ' + d);
    }
  });
  check('approach: docked station-hold traders draw as near proxies while docked', () => {
    assert.equal(ctx.flags.docked, true);
    for (const id of ['dock-freighter', 'dock-cutter']) {
      assert.ok(mesh.userData.visibleRecordIds.includes(id), id + ' not drawn');
      assert.ok(mesh.userData.nearProxyIds.includes(id), id + ' not near');
    }
  });
  check('approach: queued/over-cap near lane records draw too', () => {
    for (const id of ['lane-enroute', 'lane-queue']) {
      assert.ok(mesh.userData.visibleRecordIds.includes(id), id + ' not drawn');
      assert.ok(mesh.userData.nearProxyIds.includes(id), id + ' not near');
    }
  });
  check('approach: visible set is exactly the nearest-first uninstantiated set', () => {
    assert.deepEqual(mesh.userData.visibleRecordIds, expected.map((e) => e.id));
    assert.equal(mesh.userData.visibleCount, expected.length);
  });
  check('approach: nearProxyCount/nearProxyIds are exact', () => {
    assert.equal(mesh.userData.nearProxyCount, expectedNear.length);
    assert.deepEqual(mesh.userData.nearProxyIds, expectedNear.map((e) => e.id));
    assert.ok(mesh.userData.nearProxyIds.every((id) => mesh.userData.visibleRecordIds.includes(id)));
  });
  check('approach: visible proxies have non-zero instance matrices', () => {
    const m = new THREE.Matrix4();
    for (const id of expected.map((e) => e.id)) {
      const slot = mesh.userData.instanceRecordIds.indexOf(id);
      assert.ok(slot >= 0, id + ' missing slot');
      mesh.getMatrixAt(slot, m);
      const scale = new THREE.Vector3();
      m.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
      assert.ok(scale.z > 0, id + ' zero-scaled');
    }
  });
  check('approach: class scale/heading/faction colour are preserved', () => {
    const slot = mesh.userData.instanceRecordIds.indexOf('lane-enroute');
    assert.ok(slot >= 0);
    const m = new THREE.Matrix4();
    mesh.getMatrixAt(slot, m);
    const scale = new THREE.Vector3();
    m.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
    const target = scaleFor('cutter').target;
    assert.ok(scale.z >= target * 0.45 && scale.z <= target * 0.55, 'length scale ' + scale.z);
    assert.ok(Math.abs(scale.x / scale.z - 0.8) < 1e-6, 'beam ratio');
    assert.ok(Math.abs(scale.y / scale.z - 0.5) < 1e-6, 'height ratio');
    // Route runs +X; the proxy nose (+Z local) must point +X.
    const dir = new THREE.Vector3(0, 0, 1)
      .applyMatrix4(new THREE.Matrix4().extractRotation(m));
    assert.ok(dir.x > 0.9, 'heading not toward next waypoint: ' + dir.x);
    const actual = new THREE.Color();
    mesh.getColorAt(slot, actual);
    const base = new THREE.Color().setHex(styleFor('freehold').accent);
    const ratio = actual.r / base.r;
    assert.ok(ratio >= 0.79 && ratio <= 1.16, 'faction colour ratio ' + ratio);
    assert.ok(Math.abs(actual.g / base.g - ratio) < 1e-6);
    assert.ok(Math.abs(actual.b / base.b - ratio) < 1e-6);
  });
  check('approach: far (>2500 u) record is not drawn by mid', () => {
    assert.ok(!mesh.userData.visibleRecordIds.includes('far-lane'));
    assert.ok(!mesh.userData.nearProxyIds.includes('far-lane'));
  });
  check('approach: live near record is hidden (no duplicate hull/proxy)', () => {
    assert.ok(!mesh.userData.visibleRecordIds.includes('live-near'));
    assert.ok(!mesh.userData.nearProxyIds.includes('live-near'));
  });
  check('approach: terminal near records are hidden', () => {
    for (const id of ['dead-near', 'captured-near', 'transit-near']) {
      assert.ok(!mesh.userData.visibleRecordIds.includes(id), id);
      assert.ok(!mesh.userData.nearProxyIds.includes(id), id);
    }
  });
  check('approach: no new ctx/world field', () => {
    assert.deepEqual(Object.keys(ctx).filter((k) => !ctxKeys.has(k)), []);
    assert.deepEqual(Object.keys(ctx.world).filter((k) => !worldKeys.has(k)), []);
    assert.equal(Object.hasOwn(ctx.world, 'midTraffic'), false);
  });
  check('approach: no live ships created', () => assert.equal(ctx.ships.length, shipsBefore));
  check('approach: records JSON unchanged', () => {
    assert.equal(JSON.stringify(ctx.world.records), jsonBefore);
  });

  // Mid/far handoff: far-traffic owns >2500 u only.
  const far = initFarTraffic(ctx);
  const farMesh = ctx.scene.children.find((o) => o.name === 'far-traffic-impostors');
  check('approach: far layer draws only the >2500 u record', () => {
    assert.deepEqual(farMesh.userData.visibleRecordIds, ['far-lane']);
  });
  check('approach: mid and far never draw the same id', () => {
    const midIds = new Set(mesh.userData.visibleRecordIds);
    for (const id of farMesh.userData.visibleRecordIds) assert.ok(!midIds.has(id), id + ' duplicated');
  });
  check('approach: live/terminal records are hidden by both layers', () => {
    for (const id of ['live-near', 'dead-near', 'captured-near', 'transit-near']) {
      assert.ok(!mesh.userData.visibleRecordIds.includes(id), id + ' mid');
      assert.ok(!farMesh.userData.visibleRecordIds.includes(id), id + ' far');
    }
  });

  // 8 Hz cadence, not per-frame.
  const before = mesh.userData.instanceRecordIds;
  inst.update(0.1);
  check('approach: no refresh before the 8 Hz cadence', () => {
    assert.equal(mesh.userData.instanceRecordIds, before);
  });
  inst.update(0.03);
  check('approach: refresh at the 8 Hz cadence', () => {
    assert.notEqual(mesh.userData.instanceRecordIds, before);
  });

  check('approach: helper pins the Phase 4 predicate boundaries', () => {
    const rec = { state: 'enroute' };
    assert.equal(shouldShowMidProxy(rec, 0), true);
    assert.equal(shouldShowMidProxy(rec, 150), true);
    assert.equal(shouldShowMidProxy(rec, tiers.NEAR_RANGE), true);
    assert.equal(shouldShowMidProxy(rec, tiers.MID_RANGE), true);
    assert.equal(shouldShowMidProxy(rec, tiers.MID_RANGE + 0.01), false);
    assert.equal(shouldShowMidProxy(rec, Infinity), false);
    assert.equal(shouldShowMidProxy({ state: 'enroute', live: true }, 150), false);
    assert.equal(shouldShowMidProxy({ state: 'dead' }, 150), false);
  });
}

// ---------------------------------------------------------------------------
// 2. Promoting a near record to live hides its proxy on the next update and
//    shrinks the near evidence on that same frame.
// ---------------------------------------------------------------------------
{
  const records = [mkLane('promote-near', 500, 'cutter'), mkLane('stay-near', 700, 'freighter')];
  const ctx = scopedCtx({ records });
  const inst = initMidTraffic(ctx);
  const mesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');
  const nearBefore = mesh.userData.nearProxyCount;
  const visibleBefore = mesh.userData.visibleCount;
  check('promotion: both near records start visible', () => {
    assert.deepEqual(mesh.userData.visibleRecordIds, ['promote-near', 'stay-near']);
    assert.equal(nearBefore, 2);
    assert.equal(visibleBefore, 2);
  });
  records[0].live = true;
  inst.update(1 / 60);
  check('promotion: live near proxy is hidden on the next update', () => {
    assert.ok(!mesh.userData.visibleRecordIds.includes('promote-near'));
    assert.ok(!mesh.userData.nearProxyIds.includes('promote-near'));
    const slot = mesh.userData.instanceRecordIds.indexOf('promote-near');
    assert.equal(slot, -1);
    const m = new THREE.Matrix4();
    mesh.getMatrixAt(0, m);
    assert.equal(m.elements[0], 0);
  });
  check('promotion: nearProxyCount/nearProxyIds shrink with the hidden slot', () => {
    assert.equal(mesh.userData.nearProxyCount, 1);
    assert.deepEqual(mesh.userData.nearProxyIds, ['stay-near']);
    assert.equal(mesh.userData.visibleCount, 1);
  });
  inst.update(1 / 8);
  check('promotion: the promoted record stays hidden through the 8 Hz refresh', () => {
    assert.ok(!mesh.userData.visibleRecordIds.includes('promote-near'));
    assert.deepEqual(mesh.userData.visibleRecordIds, ['stay-near']);
  });
}

// ---------------------------------------------------------------------------
// 3. reducedMotion must not freeze the approach-lane refresh.
// ---------------------------------------------------------------------------
{
  const rec = mkLane('mover', 500, 'cutter');
  const ctx = scopedCtx({ records: [rec], reducedMotion: true });
  const inst = initMidTraffic(ctx);
  const mesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');
  const before = new THREE.Matrix4();
  mesh.getMatrixAt(0, before);
  rec.legT = 0.9;
  inst.update(1 / 8);
  const after = new THREE.Matrix4();
  mesh.getMatrixAt(0, after);
  check('reducedMotion: near proxies still follow abstract records', () => {
    assert.notDeepEqual(before.elements, after.elements);
  });
}

const failures = checks.filter((c) => !c.ok);
for (const c of checks) console.log((c.ok ? 'ok ' : 'FAIL ') + c.name + (c.ok ? '' : ' — ' + c.error));
if (failures.length > 0) {
  console.error('ISSUE #341 APPROACH LANE FAIL (' + failures.length + ' of ' + checks.length + ')');
  process.exit(1);
}
console.log('ISSUE #341 APPROACH LANE PASS (' + checks.length + ' checks)');
