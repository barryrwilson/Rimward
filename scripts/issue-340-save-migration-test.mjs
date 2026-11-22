/**
 * Issue #340 — save envelope v2 migration pins (P5a uniform x2 playable
 * extent, save-migration decision: transform persisted positions x2 at load;
 * envelope v2 accepting v1; no bank regeneration).
 *
 * Pinned here:
 *   - snapshot() writes the v2 envelope and adds no persisted field beyond it;
 *   - a v1 fixture (record routes/anchors/wakeSite/derelict/escape/threatAt,
 *     incidents, aftermath, ship position) is upgraded x2 on x/z exactly once;
 *   - y, velocities, quaternions, nav, jobs, cargo are untouched;
 *   - legLens is recomputed for the scaled route, so lane progress stays valid;
 *   - record identity/state/cargo and the hunt job's recordId bind survive the
 *     real boot load (world.records and recordBanks stay one record set);
 *   - a re-saved v2 blob is never transformed again (no double scale), and a
 *     second load of the same v1 blob scales exactly once per load;
 *   - the v1 berth mirror and manual slot load through the same migration;
 *   - malformed/missing positions fail safe (no throw, no NaN, untouched).
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-340-save-migration-test.mjs
 */
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 900));
}
const clone = (v) => JSON.parse(JSON.stringify(v));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const shipPos = (ctx) => [ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z];

// ---- 1. v2 envelope write + persisted-shape audit -------------------------
seedBootRandom();
const dom1 = installDomStubs();
const boot1 = await bootGameSystems();
const { ctx: ctx1, binds } = boot1;
const { snapshot, restore } = binds;
const migrate = await import('../src/game/save-migrate.js');
const { SAVE_VERSION, V1_POSITION_SCALE, scaleSnapshotPositions, migrateSnapshotV1ToV2, demoteSnapshotV2ToV1 } = migrate;
const { ESCAPE, DERELICT, SYSTEMS } = await import('../src/game/state.js');
const { WORLD_FIELDS, hasAutosave, readRecoveryPlan } = await import('../src/game/save.js');
const KEY = 'rimward-save-v1';
const BERTH_KEY = 'rimward-save-v1-berth';
const SLOT1 = 'rimward-save-v1-slot-1';

pin('SAVE_VERSION is 2 and V1_POSITION_SCALE is 2', SAVE_VERSION === 2 && V1_POSITION_SCALE === 2);

const v2Write = snapshot(ctx1);
pin('snapshot writes envelope v2', v2Write.v === 2, v2Write.v);
pin('snapshot savedAt is finite', Number.isFinite(v2Write.savedAt), v2Write.savedAt);
pin('snapshot top-level keys unchanged (no new persisted field)',
  eq(Object.keys(v2Write).sort(), ['bio', 'cargo', 'cargoCapacity', 'player', 'savedAt', 'ship', 'v', 'world']),
  Object.keys(v2Write).sort());
pin('snapshot world keys are all declared WORLD_FIELDS',
  Object.keys(v2Write.world).every((k) => WORLD_FIELDS.includes(k)),
  Object.keys(v2Write.world).filter((k) => !WORLD_FIELDS.includes(k)));
pin('snapshot is JSON-plain',
  JSON.stringify(JSON.parse(JSON.stringify(v2Write))) === JSON.stringify(v2Write));

// ---- 2. build the v2 reference fixture with every persisted position ------
const expected = clone(v2Write);
const bank = expected.world.recordBanks.freehold;
const pirate = bank.find((r) => r.role === 'pirate' && r.system === 'freehold' && r.state === 'enroute' && r.classKey !== 'ace');
const trader = bank.find((r) => r.role === 'trader' && r.system === 'freehold');
pin('fixture bank has a pirate and a trader record', !!pirate && !!trader,
  { count: bank.length, roles: bank.map((r) => r.role).slice(0, 8) });

const gate = SYSTEMS.freehold.gates[0];
const gateTo = gate.to;
const gatePos = gate.position;

if (pirate) {
  pirate.wakeSite = { position: [1200, 40, -800], found: false, kind: 'gate', to: gateTo, from: 'freehold' };
  pirate.escape = {
    v: ESCAPE.version, phase: 'route', kind: 'gate', to: gateTo, from: 'freehold',
    dest: [gatePos[0], gatePos[1], gatePos[2]],
    pos: [300, 20, -100], vel: [0, 0, 50], speed: 50, charge: 0,
    reason: 'no-route', threat: 'ship', threatId: 'rec-0', threatAt: [280, 20, -120],
    cond: null, peace: null,
  };
}
if (trader) {
  trader.state = 'derelict';
  trader.derelict = {
    v: DERELICT.version, since: 100, due: 400, claimAt: 250, reason: 'crewPods',
    pos: [900, 0, -1200], vel: [0, 0, -8], hull: 30, wreckId: null, outcome: null,
    resolvedAt: null, claimant: null,
  };
}
expected.world.incidents = [{
  id: 'inc-fixture', t: 12, kind: 'destroyed', name: 'Fixture Wreck', faction: 'freehold',
  role: 'pirate', position: { x: 500, y: 10, z: -300 }, causer: 'player',
}];
expected.world.aftermath = [{
  id: 'aft-fixture', incidentId: 'inc-fixture', kind: 'wreck',
  position: { x: 500, y: 10, z: -300 }, system: 'freehold', createdAt: 12, expiresAt: 400,
}];
expected.world.nav = { dest: gateTo, path: ['freehold', gateTo], remaining: 1, status: 'plotted', autopilot: false };
const huntJob = {
  id: 'hunt-freehold-0', kind: 'hunt', state: 'accepted',
  title: 'Hunt the Fixture Pirate', detail: 'Bring the marked hull down in Freehold space.',
  reward: 250, need: 1, progress: 0, originSystem: 'freehold', slot: 0,
  recordId: pirate ? pirate.id : 'rec-0', target: pirate ? pirate.name : 'Fixture',
  deadline: expected.world.time + 600,
};
expected.world.jobs = [huntJob];
expected.ship.position = [1000, 200, -1500];
expected.world.records = clone(bank);

const fixtureV1 = demoteSnapshotV2ToV1(clone(expected));
pin('v1 fixture is stamped v:1', fixtureV1.v === 1, fixtureV1.v);
pin('v1 fixture positions are half-scale',
  fixtureV1.ship.position[0] === 500 && fixtureV1.ship.position[2] === -750, fixtureV1.ship.position);

// ---- 3. pure migration: every enumerated position, exactly once -----------
const migrated = migrateSnapshotV1ToV2(clone(fixtureV1));
pin('migrate v1 fixture -> envelope v2', migrated.v === 2, migrated.v);
pin('ship position scaled x2 on x/z, y untouched',
  eq(migrated.ship.position, [1000, 200, -1500]), migrated.ship.position);
const mBank = migrated.world.recordBanks.freehold;
const mP = mBank.find((r) => r.id === (pirate ? pirate.id : 'rec-0'));
const mT = mBank.find((r) => r.id === (trader ? trader.id : 'rec-0'));
pin('record route scaled x2 exactly once', !!mP && eq(mP.route, pirate.route), mP && mP.route);
pin('record anchor scaled x2 exactly once', !!mP && eq(mP.anchor, pirate.anchor), mP && mP.anchor);
pin('wakeSite.position scaled x2 exactly once', !!mP && eq(mP.wakeSite.position, pirate.wakeSite.position), mP && mP.wakeSite);
pin('escape pos and dest scaled x2 exactly once',
  !!mP && eq(mP.escape.pos, pirate.escape.pos) && eq(mP.escape.dest, pirate.escape.dest), mP && mP.escape);
pin('escape threatAt scaled x2 exactly once', !!mP && eq(mP.escape.threatAt, pirate.escape.threatAt), mP && mP.escape.threatAt);
pin('derelict pos scaled x2; derelict vel (motion vector) untouched',
  !!mT && eq(mT.derelict.pos, trader.derelict.pos) && eq(mT.derelict.vel, trader.derelict.vel),
  mT && mT.derelict);
pin('incident position scaled x2 exactly once',
  eq(migrated.world.incidents[0].position, expected.world.incidents[0].position), migrated.world.incidents[0]);
pin('aftermath position scaled x2 exactly once',
  eq(migrated.world.aftermath[0].position, expected.world.aftermath[0].position), migrated.world.aftermath[0]);
pin('legLens recomputed from the scaled route',
  !!mP && eq(mP.legLens, pirate.legLens) && !!mT && eq(mT.legLens, trader.legLens),
  { p: mP && mP.legLens, want: pirate && pirate.legLens });
pin('nav has no positions and is untouched', eq(migrated.world.nav, expected.world.nav), migrated.world.nav);
pin('jobs are untouched by the position walk', eq(migrated.world.jobs, expected.world.jobs), migrated.world.jobs);
pin('migrated v1 fixture deep-equals the v2 reference snapshot', eq(migrated, expected));

// ---- 4. idempotence + fail-safe entry points ------------------------------
pin('a v2 snapshot is never transformed again', eq(migrateSnapshotV1ToV2(migrated), migrated));
pin('migrate is a safe no-op on non-snapshot input',
  migrateSnapshotV1ToV2(null) === null && migrateSnapshotV1ToV2(undefined) === undefined
    && migrateSnapshotV1ToV2(42) === 42 && migrateSnapshotV1ToV2('blob') === 'blob'
    && eq(migrateSnapshotV1ToV2([1, 2]), [1, 2]));
pin('an unknown envelope version is left for the caller to reject',
  migrateSnapshotV1ToV2({ v: 3, world: {} }).v === 3);
pin('scaleSnapshotPositions rejects a bad factor without throwing',
  eq(scaleSnapshotPositions({ v: 2, ship: { position: [4, 0, 6] } }, 0).ship.position, [4, 0, 6]));

// shared live arrays (records === recordBanks[current]) must not double-scale
const shared = {
  v: 2,
  world: {
    records: [{ id: 'rec-s', route: [{ x: 10, y: 0, z: 20 }], anchor: { x: 1, y: 0, z: 2 } }],
    recordBanks: {},
  },
};
shared.world.recordBanks.freehold = shared.world.records;
scaleSnapshotPositions(shared, 0.5);
pin('shared record array is scaled exactly once (dedupe)',
  shared.world.records[0].route[0].x === 5 && shared.world.records[0].route[0].z === 10
    && shared.world.records[0].anchor.x === 0.5 && shared.world.records[0].anchor.z === 1,
  shared.world.records[0]);

// malformed persisted values: untouched where malformed, finite parts scaled,
// no throw and no NaN invented.
const bad = {
  v: 1,
  ship: { position: [10, 20, null], quaternion: [0, 0, 0, 1] },
  world: {
    records: [
      {
        id: 'rec-bad',
        route: [{ x: 10, y: 5, z: -20 }, { x: 'bad', y: 2, z: null }],
        legLens: [1],
        anchor: { x: 3, y: 0, z: 4 },
        wakeSite: { position: [1, 2] },
        derelict: { pos: 'nope', vel: [1, 2, 3] },
        escape: { pos: [4, 0, 6], vel: [0, 0, 1], threatAt: [1, 'x', 3] },
      },
      null,
      42,
    ],
    recordBanks: { freehold: [] },
    incidents: [{ position: null }, { position: { x: 'a', z: 2 } }],
    aftermath: 'nope',
  },
};
const badOut = migrateSnapshotV1ToV2(bad);
pin('malformed v1 blob migrates without throwing and stamps v2', badOut.v === 2);
pin('malformed ship position: finite x/z scaled, null y untouched',
  badOut.ship.position[0] === 20 && badOut.ship.position[1] === 20 && badOut.ship.position[2] === null,
  badOut.ship.position);
pin('malformed route: finite waypoint scaled, malformed waypoint untouched, legLens kept',
  badOut.world.records[0].route[0].x === 20 && badOut.world.records[0].route[0].z === -40
    && badOut.world.records[0].route[1].x === 'bad' && badOut.world.records[0].route[1].z === null
    && eq(badOut.world.records[0].legLens, [1]), badOut.world.records[0]);
pin('malformed anchor scaled; short wakeSite array untouched; non-array derelict.pos untouched',
  badOut.world.records[0].anchor.x === 6 && badOut.world.records[0].anchor.z === 8
    && eq(badOut.world.records[0].wakeSite.position, [1, 2])
    && badOut.world.records[0].derelict.pos === 'nope'
    && eq(badOut.world.records[0].derelict.vel, [1, 2, 3]), badOut.world.records[0]);
pin('malformed escape vectors: finite parts scaled, strings untouched, vel untouched',
  eq(badOut.world.records[0].escape.pos, [8, 0, 12])
    && eq(badOut.world.records[0].escape.threatAt, [2, 'x', 6])
    && eq(badOut.world.records[0].escape.vel, [0, 0, 1]), badOut.world.records[0].escape);
pin('malformed incidents/aftermath fail safe',
  badOut.world.incidents[0].position === null
    && badOut.world.incidents[1].position.x === 'a' && badOut.world.incidents[1].position.z === 4
    && badOut.world.aftermath === 'nope', badOut.world.incidents);
pin('malformed output stays JSON-plain',
  JSON.stringify(JSON.parse(JSON.stringify(badOut))) === JSON.stringify(badOut));
const finiteWalk = (value) => {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finiteWalk);
  if (value && typeof value === 'object') return Object.values(value).every(finiteWalk);
  return true;
};
pin('no NaN invented anywhere in the malformed migration', finiteWalk(badOut));
const nanIn = { v: 1, ship: { position: [NaN, 1, 2] }, world: {} };
const nanOut = migrateSnapshotV1ToV2(nanIn);
pin('NaN input stays untouched rather than becoming a new NaN',
  Number.isNaN(nanOut.ship.position[0]) && nanOut.ship.position[1] === 1 && nanOut.ship.position[2] === 4);

// ---- 5. real boot load of a v1 autosave -----------------------------------
const fixtureJson = JSON.stringify(fixtureV1);
const dom2 = installDomStubs();
localStorage.setItem(KEY, fixtureJson);
seedBootRandom();
const boot2 = await bootGameSystems();
const ctx2 = boot2.ctx;
const systems2 = boot2.systems;

pin('boot: v1 autosave is restorable (hasAutosave accepts v1)', hasAutosave() === true);
pin('boot: restored system is freehold', ctx2.world.currentSystem === 'freehold', ctx2.world.currentSystem);
pin('boot: ship position upgraded x2 once from the v1 blob',
  eq(shipPos(ctx2), [1000, 200, -1500]), shipPos(ctx2));
pin('boot: quaternion is not scaled',
  eq(ctx2.ship.object.quaternion.toArray(), v2Write.ship.quaternion), ctx2.ship.object.quaternion.toArray());

const bank2 = ctx2.world.recordBanks.freehold;
const p2 = bank2.find((r) => r.id === (pirate ? pirate.id : 'rec-0'));
const t2 = bank2.find((r) => r.id === (trader ? trader.id : 'rec-0'));
pin('boot: record route upgraded x2 exactly once', !!p2 && eq(p2.route, pirate.route), p2 && p2.route);
pin('boot: record anchor upgraded x2 exactly once', !!p2 && eq(p2.anchor, pirate.anchor), p2 && p2.anchor);
pin('boot: wakeSite.position upgraded x2 exactly once', !!p2 && eq(p2.wakeSite.position, pirate.wakeSite.position), p2 && p2.wakeSite);
pin('boot: escape pos/dest upgraded x2 exactly once',
  !!p2 && eq(p2.escape.pos, pirate.escape.pos) && eq(p2.escape.dest, pirate.escape.dest), p2 && p2.escape);
pin('boot: escape threatAt upgraded x2 exactly once',
  !!p2 && eq(p2.escape.threatAt, pirate.escape.threatAt), p2 && p2.escape.threatAt);
pin('boot: derelict pos upgraded x2; vel untouched',
  !!t2 && eq(t2.derelict.pos, trader.derelict.pos) && eq(t2.derelict.vel, trader.derelict.vel), t2 && t2.derelict);
pin('boot: incident position upgraded x2 exactly once',
  eq(ctx2.world.incidents[0].position, expected.world.incidents[0].position), ctx2.world.incidents[0]);
pin('boot: aftermath position upgraded x2 exactly once',
  eq(ctx2.world.aftermath[0].position, expected.world.aftermath[0].position), ctx2.world.aftermath[0]);
pin('boot: legLens matches the upgraded route',
  !!p2 && eq(p2.legLens, pirate.legLens), p2 && p2.legLens);
pin('boot: record identity/state/cargo preserved',
  !!p2 && eq(
    [p2.id, p2.name, p2.classKey, p2.faction, p2.role, p2.bounty, p2.state, p2.cargo, p2.system],
    [pirate.id, pirate.name, pirate.classKey, pirate.faction, pirate.role, pirate.bounty, pirate.state, pirate.cargo, pirate.system],
  ), p2 && { id: p2.id, name: p2.name, state: p2.state, cargo: p2.cargo });
pin('boot: derelict record identity/state preserved',
  !!t2 && t2.id === trader.id && t2.name === trader.name && t2.state === 'derelict'
    && eq(t2.cargo, trader.cargo), t2 && { id: t2.id, state: t2.state });
pin('boot: world.records and recordBanks stay one record set',
  ctx2.world.recordBanks.freehold === ctx2.world.records);
const j2 = (ctx2.world.jobs || []).find((j) => j.id === 'hunt-freehold-0');
pin('boot: hunt job survives with its recordId bind',
  !!j2 && j2.state === 'accepted' && j2.recordId === huntJob.recordId && j2.target === huntJob.target,
  j2);
pin('boot: job bind resolves to the same record identity in the restored bank',
  !!j2 && !!bank2.find((r) => r.id === j2.recordId && r.name === huntJob.target), j2 && j2.recordId);
pin('boot: nav route untouched (no system-local positions)', eq(ctx2.world.nav, expected.world.nav), ctx2.world.nav);
pin('boot: every restored bank record has finite route and consistent legLens',
  bank2.every((rec) => !rec.route || (Array.isArray(rec.route)
    && rec.route.every((w) => w && Number.isFinite(w.x) && Number.isFinite(w.y) && Number.isFinite(w.z))
    && Array.isArray(rec.legLens) && rec.legLens.length === rec.route.length - 1
    && rec.legLens.every((n) => Number.isFinite(n) && n >= 0))),
  bank2.filter((rec) => rec.route && (!Array.isArray(rec.legLens)
    || rec.legLens.length !== rec.route.length - 1)).map((rec) => rec.id).slice(0, 6));

// ---- world.js legacy heals still work on migrated coordinates -------------
const { healPadHome, normalizeTraderRecord } = await import('../src/game/world.js');
const st = SYSTEMS.freehold.station.position;
const healRec = {
  id: 'rec-heal', role: 'trader', system: 'freehold', classKey: 'freighter',
  route: [{ x: st[0], y: st[1], z: st[2] }, { x: st[0] + 800, y: st[1], z: st[2] - 600 }],
  legLens: [1000], leg: 0, legT: 0.5, dir: 1, outboundTo: null,
};
const onPad = Math.hypot(healRec.route[0].x - st[0], healRec.route[0].z - st[2]);
healPadHome(healRec);
pin('legacy pad-home heal still rewrites a migrated pad waypoint',
  onPad <= 0.5 && Math.hypot(healRec.route[0].x - st[0], healRec.route[0].z - st[2]) > 0.5
    && healRec.legLens.every((n) => Number.isFinite(n) && n >= 0), healRec.route[0]);
const threeWp = clone(healRec);
threeWp.route = [{ x: 0, y: 0, z: 0 }, { x: 800, y: 0, z: 0 }, { x: 1600, y: 0, z: 0 }];
threeWp.legLens = [800, 800];
threeWp.leg = 2;
threeWp.legT = 0.5;
normalizeTraderRecord(threeWp);
pin('legacy 3-waypoint trader clamp still works on scaled routes',
  threeWp.route.length === 2 && threeWp.leg === 0 && threeWp.legT === 1
    && threeWp.legLens.length === 1 && threeWp.legLens.every((n) => Number.isFinite(n) && n >= 0), threeWp);

// ---- 6. re-save v2 + v2 re-load: never double-scale ----------------------
const resaved = snapshot(ctx2);
pin('re-save after a v1 load writes v2', resaved.v === 2, resaved.v);
const rsP = resaved.world.recordBanks.freehold.find((r) => r.id === (pirate ? pirate.id : 'rec-0'));
const rsT = resaved.world.recordBanks.freehold.find((r) => r.id === (trader ? trader.id : 'rec-0'));
pin('re-save keeps ship position (no second x2)',
  eq(resaved.ship.position, [1000, 200, -1500]), resaved.ship.position);
pin('re-save keeps record route/anchor/wakeSite/derelict positions (no second x2)',
  !!rsP && eq(rsP.route, pirate.route) && eq(rsP.anchor, pirate.anchor)
    && eq(rsP.wakeSite.position, pirate.wakeSite.position)
    && !!rsT && eq(rsT.derelict.pos, trader.derelict.pos), rsP && rsP.route);
pin('re-save keeps incident/aftermath positions (no second x2)',
  eq(resaved.world.incidents[0].position, expected.world.incidents[0].position)
    && eq(resaved.world.aftermath[0].position, expected.world.aftermath[0].position));
restore(ctx2, clone(resaved));
pin('loading the re-saved v2 blob does not transform it again',
  eq(shipPos(ctx2), [1000, 200, -1500])
    && eq(ctx2.world.recordBanks.freehold.find((r) => r.id === (pirate ? pirate.id : 'rec-0')).route, pirate.route));

// a second load of the same v1 blob scales once per load (no cumulative drift)
localStorage.setItem(KEY, fixtureJson);
const v1Again = readRecoveryPlan(ctx2, expected.world.time + 60);
pin('v1 autosave readRecoveryPlan returns the autosave', v1Again.source === 'autosave', v1Again.source);
pin('v1 autosave re-read upgrades x2 exactly once',
  v1Again.snap.v === 2 && eq(v1Again.snap.ship.position, [1000, 200, -1500]), v1Again.snap && v1Again.snap.ship);
restore(ctx2, v1Again.snap);
pin('restoring that migrated autosave keeps the x2 position',
  eq(shipPos(ctx2), [1000, 200, -1500]), shipPos(ctx2));

// ---- 7. berth mirror migration -------------------------------------------
const berthV1 = clone(fixtureV1);
berthV1.berth = true;
berthV1.berthSavedAt = berthV1.savedAt;
const autoV1 = clone(fixtureV1);
autoV1.savedAt = berthV1.savedAt + 10;
autoV1.berthSavedAt = berthV1.savedAt;
localStorage.setItem(KEY, JSON.stringify(autoV1));
localStorage.setItem(BERTH_KEY, JSON.stringify(berthV1));
const planBerth = readRecoveryPlan(ctx2, expected.world.time + 60);
pin('v1 berth mirror is chosen by the lineage plan', planBerth.source === 'berth', planBerth.source);
pin('v1 berth mirror migrates x2 exactly once',
  planBerth.snap.v === 2 && eq(planBerth.snap.ship.position, [1000, 200, -1500]),
  planBerth.snap && planBerth.snap.ship);
pin('v1 berth record route migrates x2 exactly once',
  eq(planBerth.snap.world.recordBanks.freehold.find((r) => r.id === (pirate ? pirate.id : 'rec-0')).route, pirate.route));

// ---- 8. manual slot migration through the real LOAD button ---------------
function tick(ctx, systems, n, dt = 1 / 60) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += dt;
    ctx.elapsed += dt;
    for (const [, sys] of systems) sys?.update?.(dt, ctx);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
function calm(ctx, systems) {
  if (!ctx.flags.combat) return true;
  ctx.ship.object.position.set(0, 30000, 0);
  ctx.ship.velocity.set(0, 0, 0);
  for (let i = 0; i < 240 && ctx.flags.combat; i++) tick(ctx, systems, 1);
  return !ctx.flags.combat;
}
function findSlotLoad(dom, slot) {
  let panel = null;
  for (const node of dom.walkDom(document.body)) {
    if (node.id === 'rw-berth-records') { panel = node; break; }
  }
  if (!panel) return null;
  const rows = [...dom.walkDom(panel)].filter((n) => typeof n.className === 'string'
    && n.className.split(' ').includes('rw-berth-row'));
  const row = rows.find((n) => n.dataset && n.dataset.slot === slot);
  if (!row) return null;
  return [...dom.walkDom(row)].find((n) => n.tagName === 'BUTTON'
    && typeof n.className === 'string' && n.className.split(' ').includes('rw-berth-load')) || null;
}

ctx2.flags.paused = false;
pin('slot fixture: combat calm enough for a manual load', calm(ctx2, systems2));
localStorage.setItem(SLOT1, fixtureJson);
const slotBtn = findSlotLoad(dom2, '1');
pin('slot 1 LOAD button exists in the berth panel', !!slotBtn);
if (slotBtn) slotBtn.click();
pin('v1 manual slot migrated through the real load path',
  eq(shipPos(ctx2), [1000, 200, -1500])
    && eq(ctx2.world.recordBanks.freehold.find((r) => r.id === (pirate ? pirate.id : 'rec-0')).route, pirate.route)
    && eq(ctx2.world.incidents[0].position, expected.world.incidents[0].position), shipPos(ctx2));
pin('slot load emitted the restored toast',
  ctx2.events.some((e) => e.type === 'commLine' && e.text === 'Berth record restored.'));

const slotResave = snapshot(ctx2);
pin('slot re-save writes v2', slotResave.v === 2, slotResave.v);
localStorage.setItem(SLOT1, JSON.stringify(slotResave));
const slotBtn2 = findSlotLoad(dom2, '1');
if (slotBtn2) slotBtn2.click();
pin('re-saved v2 slot load does not double-scale',
  eq(shipPos(ctx2), [1000, 200, -1500])
    && eq(ctx2.world.recordBanks.freehold.find((r) => r.id === (pirate ? pirate.id : 'rec-0')).route, pirate.route)
    && eq(ctx2.world.incidents[0].position, expected.world.incidents[0].position), shipPos(ctx2));

// ---- 9. unknown/corrupt envelopes fail closed ----------------------------
localStorage.setItem(KEY, JSON.stringify({ v: 3, world: { currentSystem: 'freehold' } }));
pin('an unknown envelope version is not restorable', hasAutosave() === false);
localStorage.setItem(KEY, 'not json');
pin('a corrupt blob is not restorable', hasAutosave() === false);
localStorage.setItem(KEY, JSON.stringify({ v: 1 }));
pin('a v1 blob with no world is not restorable', hasAutosave() === false);

console.log(fails === 0 ? 'PASS issue-340 save migration (' + 'all pins)' : 'FAIL issue-340 save migration (' + fails + ' failing)');
if (fails !== 0) process.exit(1);
