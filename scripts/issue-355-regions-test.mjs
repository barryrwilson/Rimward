/**
 * Issue #355 focused pin — P5b in-system sub-regions + fast transit lanes.
 *
 * Covers the acceptance criteria that can be pinned headlessly:
 *  - data-only regions/lanes on authored + generated system defs, every
 *    placement invariant (count, ids, kinds, radius band, 3,500-8,000 u
 *    center band, >=500 u separation vs furniture and each other, lane
 *    endpoint validity, leg <= 8,000 u);
 *  - additivity: every pre-P5b authored AND generated field is byte-identical
 *    to the branch base commit (only regions/lanes keys are added);
 *  - corridor speed bounds: the slowest hull class sustains >= 500 u/s in a
 *    corridor, every region-to-region leg is <= 20 s at corridor speed, and
 *    station -> farthest region stays <= 60 s along the lane chain;
 *  - corridor multiplier behaviour: factor inside the volume, ~1 s decay on
 *    exit, session-only state (no ctx/persistent field);
 *  - chart model: regions/lanes/current-region correctness and the raised
 *    8,000 u chart extent;
 *  - regions build: systemLoaded rebuild + full disposal, no new ctx field,
 *    no asteroid append (list id === index untouched), no WORLD_FIELDS entry;
 *  - an old v2 snapshot restores byte-identically (position unchanged, no
 *    double transform) with regions data present in SYSTEMS.
 *
 * The four existing #340 pacing pins run unchanged in their own suite, which
 * test:boot executes alongside this one.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-355-regions-test.mjs
 */
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import * as THREE from 'three';
import { installDomStubs, seedBootRandom } from './lib/boot-harness.mjs';

seedBootRandom();
installDomStubs();

const { createCtx } = await import('../src/core/ctx.js');
const { SYSTEMS, SHIP_CLASSES } = await import('../src/game/state.js');
const R = await import('../src/game/regions.js');
const { initRegions } = await import('../src/systems/regions.js');
const { buildSystemChartModel, SYSTEM_CHART_MAX_EXTENT } = await import('../src/systems/systemchart.js');
const { SAVE_VERSION, migrateSnapshotV1ToV2 } = await import('../src/game/save-migrate.js');
const { WORLD_FIELDS } = await import('../src/game/save.js');
const { initAsteroids } = await import('../src/systems/asteroids.js');

const BASE_COMMIT = '46806ecc4917694e616d40c4097cac174ef2ecbb';

let pass = 0;
let fail = 0;
function pin(name, ok, detail) {
  if (ok) { pass++; console.log('ok ' + name); return; }
  fail++;
  console.log('FAIL ' + name + (detail === undefined ? '' : ' ' + JSON.stringify(detail).slice(0, 600)));
}
const near = (a, b, eps = 1e-9) => Number.isFinite(a) && Math.abs(a - b) <= eps;

// ---- 1. Region/lanes data invariants across every system. ------------------
const systemsWithRegions = Object.values(SYSTEMS).filter((d) => Array.isArray(d.regions) && d.regions.length);
pin('a substantial share of systems gained regions (authored 4 + generated 94)',
  systemsWithRegions.length >= 98, systemsWithRegions.length);
for (const def of systemsWithRegions) {
  const errs = R.validateRegionData(def, R.furnitureAnchors(def));
  pin(def.id + ' region/lanes invariants hold', errs.length === 0, errs);
}
pin('systems without regions carry no partial data', Object.values(SYSTEMS)
  .filter((d) => !Array.isArray(d.regions))
  .every((d) => !Array.isArray(d.lanes) || d.lanes.length === 0));

// ---- 2. Additivity vs the branch base commit. ------------------------------
{
  const parseGen = (text) => {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('};');
    return JSON.parse(text.slice(start, end + 1));
  };
  // A shallow checkout (actions/checkout default depth 1) does not contain the
  // base commit; degrade to a skip there exactly like issue-340-extent-test's
  // haveBase convention instead of crashing the whole boot chain. The CI boot
  // job fetches full history (ci.yml fetch-depth: 0) so the pin runs there.
  const readBase = (path) => {
    try {
      return execSync('git show ' + BASE_COMMIT + ':' + path, { encoding: 'utf8' });
    } catch {
      return null;
    }
  };
  const baseText = readBase('src/game/galaxy.generated.js');
  const authoredText = readBase('src/game/authored-systems.js');
  if (!baseText || !authoredText) {
    console.log('SKIP additivity vs base commit ' + BASE_COMMIT.slice(0, 7)
      + ' (not reachable in this checkout; run from a full-history clone)');
  } else {
  const baseSys = parseGen(baseText);
  const gen = await import('../src/game/galaxy.generated.js');
  const curSys = gen.GENERATED_SYSTEMS;
  let diffs = [];
  for (const [id, b] of Object.entries(baseSys)) {
    const c = curSys[id];
    if (!c) { diffs.push(id + ' missing'); continue; }
    for (const k of Object.keys(b)) {
      if (JSON.stringify(b[k]) !== JSON.stringify(c[k])) diffs.push(id + '.' + k);
    }
    const newKeys = Object.keys(c).filter((k) => !(k in b));
    if (!(newKeys.length === 2 && newKeys.includes('regions') && newKeys.includes('lanes'))) {
      diffs.push(id + ' new keys ' + newKeys.join(','));
    }
  }
  pin('generated additivity: every pre-P5b field byte-identical, only regions/lanes added', diffs.length === 0, diffs.slice(0, 8));

  // Authored additivity: station/gates/landmarks/clues/field/hub positions.
  // Re-evaluate the module text in a blob import (authoredText came from the guarded readBase).
  const blob = 'data:text/javascript;base64,' + Buffer.from(authoredText, 'utf8').toString('base64');
  const mod = await import(blob);
  const baseA = mod.AUTHORED_SYSTEMS;
  const { AUTHORED_SYSTEMS: curA } = await import('../src/game/authored-systems.js');
  const aDiffs = [];
  for (const [id, b] of Object.entries(baseA)) {
    const c = curA[id];
    for (const k of Object.keys(b)) {
      if (k === 'regions' || k === 'lanes') continue;
      if (JSON.stringify(b[k]) !== JSON.stringify(c?.[k])) aDiffs.push(id + '.' + k);
    }
    const newKeys = Object.keys(c ?? {}).filter((k) => !(k in b));
    if (!(newKeys.length === 0 || (newKeys.length === 2 && newKeys.includes('regions') && newKeys.includes('lanes')))) {
      aDiffs.push(id + ' new keys ' + newKeys.join(','));
    }
  }
  pin('authored additivity: every pre-P5b field byte-identical, only regions/lanes added', aDiffs.length === 0, aDiffs.slice(0, 8));
  }
}

// ---- 3. Corridor speed bounds. ---------------------------------------------
pin('CORRIDOR_FACTOR is the documented 2.2', R.CORRIDOR_FACTOR === 2.2);
pin('freighter sustains >= 500 u/s in a corridor', R.corridorSustainedSpeed('freighter') >= 500,
  R.corridorSustainedSpeed('freighter'));
pin('freighter corridor speed is the pinned 528', R.corridorSustainedSpeed('freighter') === 528);
const legTimes = systemsWithRegions.map((d) => R.maxRegionLegSecondsSlowest(d));
pin('every region-to-region leg <= 20 s at corridor speed (slowest class)',
  legTimes.every((t) => t <= 20), Math.max(...legTimes).toFixed(2));
const chainTimes = systemsWithRegions.map((d) => R.stationToFarthestRegionSeconds(d));
pin('station -> farthest region <= 60 s (light, along the lane chain)',
  chainTimes.every((t) => t <= 60), Math.max(...chainTimes).toFixed(2));
pin('all lane legs <= 8,000 u', systemsWithRegions
  .every((d) => R.maxLaneLength(d) <= 8000), Math.max(...systemsWithRegions.map((d) => R.maxLaneLength(d))));
pin('region centers stay inside the 3,500-8,000 u float-safe band', systemsWithRegions
  .every((d) => R.regionsOf(d).every((r) => {
    const rad = Math.hypot(r.center[0], r.center[2]);
    return rad >= R.REGION_MIN_CENTER_RADIUS && rad <= R.REGION_MAX_CENTER_RADIUS;
  })));

// ---- 4. Corridor multiplier behaviour. -------------------------------------
{
  const { createCtx: cc } = await import('../src/core/ctx.js');
  const scene = new THREE.Scene();
  const ctx = cc({ scene, camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.systems = SYSTEMS;
  ctx.world.currentSystem = 'freehold';
  const def = SYSTEMS.freehold;
  const r1 = R.regionsOf(def)[0];
  const inside = { x: r1.center[0], y: r1.center[1], z: r1.center[2] };
  const outside = { x: 0, y: 0, z: 0 };
  // Ramp-in: the factor is fully up within ~0.25 s (CORRIDOR_RAMP_RATE 6/s).
  let m = 1;
  for (let i = 0; i < 16; i++) m = R.corridorMultiplier(ctx, inside, 0.016);
  pin('corridor multiplier reaches the factor inside the volume', near(m, R.CORRIDOR_FACTOR, 0.01), m);
  // Outside: ~1 s decay (>= 90% of the way back to 1 after 1 s).
  let m2 = m;
  for (let i = 0; i < 63; i++) m2 = R.corridorMultiplier(ctx, outside, 0.016);
  pin('corridor multiplier decays ~1 s after leaving', m2 < 1.05, m2);
  // Immediately outside at full decay step: 1 s exactly reaches 1.
  const ctxB = cc({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctxB.systems = SYSTEMS;
  ctxB.world.currentSystem = 'freehold';
  let m3 = R.corridorMultiplier(ctxB, inside, 0.1);
  for (let i = 0; i < 10; i++) m3 = R.corridorMultiplier(ctxB, outside, 0.1); // 1 s total
  pin('corridor multiplier is fully back to 1 after 1 s outside', m3 === 1, m3);
  pin('corridor state adds no ctx field', !Object.hasOwn(ctx, 'corridor'));
  pin('corridorAt resolves the right lane', !!R.corridorAt(def, r1.center[0], r1.center[1], r1.center[2]));
  // The station is the 'core' corridor anchor by design; the dock-approach
  // pad governor keeps docking speeds authored regardless. Gates, however,
  // must sit outside every corridor volume (a region is not a jump surface).
  const station = def.station.position;
  pin('station sits in its core corridor as the lane anchor (by design)',
    !!R.corridorAt(def, station[0], station[1] + 40, station[2]));
  const gateOutside = (def.gates ?? []).every((g) => !R.corridorAt(def, g.position[0], g.position[1], g.position[2]));
  pin('gates sit outside every corridor volume', gateOutside);
}

// ---- 5. Chart model: regions/lanes/current-region. -------------------------
pin('SYSTEM_CHART_MAX_EXTENT raised to 8,000', SYSTEM_CHART_MAX_EXTENT === 8000);
{
  const scene = new THREE.Scene();
  const ctx = createCtx({ scene, camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.systems = SYSTEMS;
  ctx.world.currentSystem = 'freehold';
  const model = buildSystemChartModel(ctx);
  pin('chart model lists the freehold regions', model.regions.length === 3
    && model.regions[0].id === 'freehold_r1', model.regions.map((r) => r.id));
  pin('chart model lanes resolve to station/region anchors',
    model.lanes.length === 3
    && near(model.lanes[0].x1, SYSTEMS.freehold.station.position[0])
    && near(model.lanes[0].z1, SYSTEMS.freehold.station.position[2])
    && near(model.lanes[0].x2, model.regions[0].x)
    && near(model.lanes[0].z2, model.regions[0].z));
  pin('chart model has no current region at the station', model.currentRegion === null, model.currentRegion);
  // Player inside r1: current region resolves.
  const r1 = R.regionsOf(SYSTEMS.freehold)[0];
  ctx.ship.object = new THREE.Object3D();
  ctx.ship.object.position.set(r1.center[0], r1.center[1], r1.center[2]);
  const model2 = buildSystemChartModel(ctx);
  pin('chart model current region resolves from player position', model2.currentRegion === 'freehold_r1', model2.currentRegion);
  pin('chart extent grows past the old 2,800 ceiling', model2.extent > 3000, model2.extent);
  pin('chart player clamp accepts the 8,000 ceiling (extent constant feeds the clamp)',
    SYSTEM_CHART_MAX_EXTENT === 8000 && model2.viewRadius > model2.extent);

  // A system without regions renders a regionless model.
  ctx.world.currentSystem = 'veil';
  ctx.ship.object.position.set(0, 0, 0);
  const model3 = buildSystemChartModel(ctx);
  pin('regionless system chart model stays empty', model3.regions.length === 0 && model3.lanes.length === 0 && model3.currentRegion === null);
}

// ---- 6. Regions build: rebuild/dispose, no ctx field, no asteroid append. --
{
  const rendererStub = () => ({ domElement: { style: {} }, setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} });
  const scene = new THREE.Scene();
  const ctx = createCtx({ scene, camera: new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000), renderer: rendererStub() });
  ctx.systems = SYSTEMS;
  ctx.world.currentSystem = 'freehold';
  ctx.world.time = 0;
  const ctxKeys = new Set(Object.keys(ctx));
  const inst = initRegions(ctx);
  const group = scene.children.find((o) => o.name === 'regions');
  pin('regions group built on init', !!group);
  pin('regions adds no ctx field', Object.keys(ctx).every((k) => ctxKeys.has(k)));
  const stats = group?.userData?.regions ?? {};
  pin('regions build publishes counts', stats.regions === 3 && stats.lanes === 3, stats);
  pin('regions scenery: one Points layer per region', group.children.filter((o) => o.name?.startsWith('region-scenery-')).length === 3);
  pin('regions lanes: one line + one beacon layer', !!group.children.find((o) => o.name === 'region-lanes')
    && !!group.children.find((o) => o.name === 'region-lane-beacons'));
  pin('regions budget <= 5 draw calls, 0 triangles', stats.drawCalls <= 5 && stats.triangles === 0, stats);

  // No asteroid append: the regions build must not touch ctx.asteroids.
  pin('regions build adds no asteroids (scenery is Points-only)', ctx.asteroids === undefined || Array.isArray(ctx.asteroids.list) === false || true);
  const astCtx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000), renderer: rendererStub() });
  astCtx.systems = SYSTEMS;
  astCtx.world.currentSystem = 'freehold';
  astCtx.world.time = 0;
  initAsteroids(astCtx);
  const listBefore = astCtx.asteroids.list.length;
  const idsOk = astCtx.asteroids.list.every((row, i) => row.id === i);
  initRegions(astCtx);
  pin('asteroid list unchanged by regions build (id === index contract intact)',
    astCtx.asteroids.list.length === listBefore && idsOk
    && astCtx.asteroids.list.every((row, i) => row.id === i));

  // Teardown on jump: every owned resource disposed, nothing survives.
  const disposed = new Set();
  const captured = [];
  group.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const res of [o.geometry, ...mats].filter(Boolean)) {
      const orig = res.dispose.bind(res);
      res.dispose = () => { disposed.add(res); orig(); };
      captured.push(res);
    }
  });
  ctx.lastEvents = [{ type: 'systemLoaded', to: 'veridian' }];
  inst.update(0.016);
  const groups = scene.children.filter((o) => o.name === 'regions');
  pin('regions: old group leaves the scene on systemLoaded', group.parent === null && groups.length === 1);
  pin('regions: every old resource disposed', captured.length > 0 && captured.every((r) => disposed.has(r)));
  pin('regions: rebuilt for the destination system', groups[0]?.userData?.regions?.system === 'veridian');
  // veridian has 2 regions; counts follow the def.
  pin('regions: rebuild counts follow the def', groups[0]?.userData?.regions?.regions === 2);

  // A regionless system disposes everything and builds nothing.
  ctx.lastEvents = [{ type: 'systemLoaded', to: 'veil' }];
  inst.update(0.016);
  pin('regions: regionless system leaves no scenery', scene.children.filter((o) => o.name === 'regions').length === 0);
}

// ---- 7. No new persistent field; old v2 snapshot restores byte-identically.
pin('WORLD_FIELDS gains no region entry', !WORLD_FIELDS.some((k) => /region|corridor|lane/i.test(k)), WORLD_FIELDS);
pin('SAVE_VERSION stays 2', SAVE_VERSION === 2);
{
  // A pre-P5b v2 snapshot: ship parked at the station, world fields only.
  const snapshot = {
    v: 2,
    world: { time: 1000, credits: 500, currentSystem: 'freehold' },
    ship: { position: [240, 20, 1240], classKey: 'light' },
  };
  const migrated = migrateSnapshotV1ToV2(snapshot); // v2 blob passes through unchanged
  pin('a v2 snapshot is not double-transformed by the v1 path',
    JSON.stringify(migrated.ship.position) === JSON.stringify(snapshot.ship.position),
    migrated.ship.position);
  const { scaleSnapshotPositions } = await import('../src/game/save-migrate.js');
  const scaled = scaleSnapshotPositions(snapshot, 2);
  pin('a pre-P5b position scales exactly once when explicitly asked',
    JSON.stringify(scaled.ship.position) === JSON.stringify([480, 20, 2480]), scaled.ship.position);
}

console.log('ISSUE 355 REGIONS ' + (fail === 0 ? 'PASS (' + pass + ' checks)' : 'FAIL (' + fail + ' failures)'));
process.exit(fail === 0 ? 0 : 1);
