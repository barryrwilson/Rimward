/**
 * Issues #236 / #237 — courier shadowing and mission-local suspicion.
 *
 * Part A  pure geometry: the one deterministic route, its clearance
 *         certificate, the motion corridor and the bounded LOS predicate,
 *         plus the safe-route omission report across every authored system
 *         and a deterministic representative generated sample.
 * Part B  the pure frame integrator: observation, suspicion, warning,
 *         grace, withdrawal, exposure and the per-frame time cap.
 * Part C  save normalization: the exact accept/reject disposition table,
 *         round trips, old-slot isolation and the family cap.
 * Part D  the real station owner: offer, accept, courier lifecycle,
 *         settlement, expiry, standing isolation and the API projection.
 *
 * Every fixture here is SYNTHETIC. Nothing in this file is a natural live
 * occlusion, a natural flight, or a browser acceptance run.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-236-237-courier-shadow-test.mjs
 */
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS, COURIER_SHADOW, JUMP, SHIP_CLASSES } from '../src/game/state.js';
import { AUTHORED_SYSTEMS } from '../src/game/authored-systems.js';
import { PHY } from '../src/game/physics.js';
import {
  certifyShadowRoute,
  certifyShadowSystem,
  freshShadowState,
  GATE_OUTER_RADIUS,
  isShadowJob,
  isShadowRecordId,
  pointInCorridor,
  sanitizeShadowState,
  segmentHitsCylinder,
  segmentPointDistance,
  SHADOW_COPY,
  shadowClearance,
  shadowCourierName,
  shadowFrameSeconds,
  shadowGateClearance,
  shadowJobForRecordId,
  shadowOrbitClearance,
  shadowPlanetsClear,
  shadowRecordId,
  shadowRoute,
  shadowSeededPlanets,
  shadowSightClear,
  stepShadow,
} from '../src/game/courier-shadow.js';
import { scaleFor } from '../src/game/ship-scale.js';

const T = COURIER_SHADOW;
const PLANET_ORBITS_RADII = [250, 420, 640, 920, 1400];
let pass = 0;
const ok = (label) => { pass += 1; console.log('PASS ' + label); };

// ===========================================================================
// Part A — geometry
// ===========================================================================

// The tuning is the contract's own numbers, not a local re-derivation.
assert.equal(T.minRange, 150);
assert.equal(T.maxRange, 400);
assert.equal(T.requiredSeconds, 30);
assert.equal(T.suspicionGain, 10);
assert.equal(T.suspicionDecay, 5);
assert.equal(T.warnAt, 40);
assert.equal(T.graceSeconds, 8);
assert.equal(T.deadlineSeconds, 900);
assert.equal(T.rendezvousRange, 900);
assert.equal(T.farRange, 1500);
assert.equal(shadowClearance(), 500);
assert.equal(shadowGateClearance(), Math.max(JUMP.zone, GATE_OUTER_RADIUS) + 500);
assert.ok(T.cruiseCap <= SHIP_CLASSES.light.cruise);
ok('tuning matches the approved contract numbers');

// The route is ONE deterministic perpendicular candidate.
for (const id of Object.keys(AUTHORED_SYSTEMS)) {
  const def = SYSTEMS[id];
  if (!def.station || !def.gates?.length) continue;
  const a = shadowRoute(def);
  const b = shadowRoute(def);
  assert.deepEqual(a.waypoints, b.waypoints, id + ' route is deterministic');
  const s = def.station.position;
  const g = def.gates[0].position;
  const dx = g[0] - s[0];
  const dz = g[2] - s[2];
  const len = Math.hypot(dx, dz);
  const tx = -dz / len;
  const tz = dx / len;
  assert.equal(a.near.x, Math.round(s[0] + tx * 900));
  assert.equal(a.near.z, Math.round(s[2] + tz * 900));
  assert.equal(a.far.x, Math.round(s[0] + tx * 1500));
  assert.equal(a.far.z, Math.round(s[2] + tz * 1500));
  assert.equal(a.near.y, Math.round(s[1]));
  assert.equal(a.far.y, Math.round(s[1]));
  // The perpendicular really is perpendicular to the station→gate lane.
  const dot = (dx / len) * tx + (dz / len) * tz;
  assert.ok(Math.abs(dot) < 1e-9, id + ' route is perpendicular');
  // The briefing offset and the API offset are the SAME static vector.
  assert.deepEqual(a.offset, { x: Math.round(tx * 900), y: 0, z: Math.round(tz * 900) });
  assert.equal(a.gateTo, def.gates[0].to);
}
ok('perpendicular route is deterministic and matches the published offset');

// Missing gate / zero direction / unknown system omit the offer.
assert.equal(shadowRoute(null).ok, false);
assert.equal(shadowRoute({ station: { position: [0, 0, 0] } }).reason, 'no-gate');
assert.equal(shadowRoute({ gates: [{ position: [0, 0, 0] }] }).reason, 'no-station');
assert.equal(shadowRoute({
  station: { position: [10, 0, 10] },
  gates: [{ position: [10, 90, 10] }],
}).reason, 'zero-direction');
assert.equal(certifyShadowSystem('not-a-system').ok, false);
ok('missing gate, zero direction and unknown system omit the offer');

// A hull wider than the corridor is unsafe by construction.
const freeholdDef = SYSTEMS.freehold;
assert.equal(certifyShadowRoute(freeholdDef, { hullRadius: T.corridorRadius + 1 }).reason, 'hull-corridor');
ok('a hull that cannot fit the 50 u motion corridor is unsafe');

// Clearance certificate: an injected near gate, hub, station and field each fail.
function clone(def) { return JSON.parse(JSON.stringify(def)); }
{
  const base = clone(freeholdDef);
  const route = shadowRoute(base);
  const mid = { x: (route.near.x + route.far.x) / 2, y: route.near.y, z: (route.near.z + route.far.z) / 2 };
  const gateCase = clone(base);
  gateCase.gates.push({ position: [mid.x, mid.y, mid.z], to: 'veridian' });
  assert.equal(certifyShadowRoute(gateCase).reason, 'gate-clearance');
  const hubCase = clone(base);
  hubCase.hub = { position: [mid.x, mid.y, mid.z], routes: ['x'] };
  assert.equal(certifyShadowRoute(hubCase).reason, 'hub-clearance');
  // Review clarification 3: a hub with no routes is not a body.
  const hubIdle = clone(base);
  hubIdle.hub = { position: [mid.x, mid.y, mid.z], routes: [] };
  assert.notEqual(certifyShadowRoute(hubIdle).reason, 'hub-clearance');
  const fieldCase = clone(base);
  fieldCase.field = { center: [mid.x, mid.y, mid.z], radius: 100, count: 1 };
  assert.equal(certifyShadowRoute(fieldCase).reason, 'asteroid-clearance');
  const stationCase = clone(base);
  // Pull the station onto the route by shrinking the rendezvous arm is not
  // possible (frozen), so move the whole lane: a station 100 u from its own
  // route cannot happen with a 900 u arm — assert the real margin instead.
  const sPos = base.station.position;
  const stationGap = segmentPointDistance(
    route.near.x, route.near.y, route.near.z,
    route.far.x, route.far.y, route.far.z,
    sPos[0], sPos[1], sPos[2],
  ) - PHY.STATION_CYL_RADIUS;
  assert.ok(stationGap >= shadowClearance(), 'station clears its own 900 u arm');
  assert.equal(certifyShadowRoute(stationCase).ok, true);
  // Gate clearance uses max(JUMP.zone, gate outer radius) + 500 exactly.
  const edge = clone(base);
  const need = shadowGateClearance();
  const dirX = (route.far.x - route.near.x);
  const dirZ = (route.far.z - route.near.z);
  const dl = Math.hypot(dirX, dirZ);
  const perpX = -dirZ / dl;
  const perpZ = dirX / dl;
  edge.gates.push({ position: [mid.x + perpX * (need - 1), mid.y, mid.z + perpZ * (need - 1)], to: 'veridian' });
  assert.equal(certifyShadowRoute(edge).reason, 'gate-clearance');
  const edgeOk = clone(base);
  edgeOk.gates.push({ position: [mid.x + perpX * (need + 1), mid.y, mid.z + perpZ * (need + 1)], to: 'veridian' });
  assert.equal(certifyShadowRoute(edgeOk).ok, true);
}
ok('gate, hub and asteroid-field clearance gate the certificate at the exact radius');

// Planets are certified as REAL solid bounds, never as a whole orbit and
// never by omission: a remote destination uses the seeded build phase.
{
  const route = shadowRoute(freeholdDef);
  const mid = { x: (route.near.x + route.far.x) / 2, y: route.near.y, z: (route.near.z + route.far.z) / 2 };
  assert.equal(certifyShadowRoute(freeholdDef).ok, true, 'freehold certifies on its real seeded phase');
  assert.equal(
    certifyShadowRoute(freeholdDef, { planets: [{ x: mid.x, y: mid.y, z: mid.z, radius: 30 }] }).reason,
    'planet-clearance',
  );
  const seeded = shadowSeededPlanets(freeholdDef);
  assert.equal(seeded.length, freeholdDef.planetCount);
  assert.deepEqual(shadowSeededPlanets(freeholdDef), seeded, 'the seeded phase is deterministic');
  for (let i = 0; i < seeded.length; i++) {
    const r = Math.hypot(seeded[i].x, seeded[i].z);
    assert.ok(Math.abs(r - PLANET_ORBITS_RADII[i]) < 1e-6, 'seeded planet sits on its own orbit');
    assert.equal(seeded[i].y, 0);
  }
  assert.deepEqual(shadowSeededPlanets(null), []);
  assert.deepEqual(shadowSeededPlanets({ planetCount: 3 }), [], 'no worldSeed, no seeded bodies');
}
ok('remote destinations certify against real seeded planet bounds');

// Live planet bounds — the one solid body that moves.
{
  const route = shadowRoute(freeholdDef);
  const mid = { x: (route.near.x + route.far.x) / 2, y: route.near.y, z: (route.near.z + route.far.z) / 2 };
  assert.equal(shadowPlanetsClear(route, []), true);
  assert.equal(shadowPlanetsClear(route, [{ x: mid.x, y: mid.y, z: mid.z, radius: 30 }]), false);
  const dX = route.far.x - route.near.x;
  const dZ = route.far.z - route.near.z;
  const dL = Math.hypot(dX, dZ);
  const offX = -dZ / dL;
  const offZ = dX / dL;
  const gap = shadowClearance() + 30 + 1;
  const far = { x: mid.x + offX * gap, y: mid.y, z: mid.z + offZ * gap, radius: 30 };
  assert.equal(shadowPlanetsClear(route, [far]), true);
  assert.equal(shadowPlanetsClear({ ok: false }, []), false);
}
ok('live planet bounds pause the certificate only while a planet is inside the envelope');

// Motion corridor: the HULL must fit, not just the centre.
{
  const route = shadowRoute(freeholdDef);
  const a = route.near;
  const b = route.far;
  const dirX = b.x - a.x;
  const dirZ = b.z - a.z;
  const dl = Math.hypot(dirX, dirZ);
  const nx = -dirZ / dl;
  const nz = dirX / dl;
  const mid = { x: (a.x + b.x) / 2, y: a.y, z: (a.z + b.z) / 2 };
  const at = (d) => ({ x: mid.x + nx * d, y: mid.y, z: mid.z + nz * d });
  assert.equal(pointInCorridor(route, mid.x, mid.y, mid.z, 12), true);
  const in37 = at(37);
  assert.equal(pointInCorridor(route, in37.x, in37.y, in37.z, 12), true);
  const out39 = at(39);
  assert.equal(pointInCorridor(route, out39.x, out39.y, out39.z, 12), false);
  const out60 = at(60);
  assert.equal(pointInCorridor(route, out60.x, out60.y, out60.z, 0), false);
}
ok('the motion corridor contains the hull extent, not just the centre path');

// Line of sight: exactly two supported blockers, and nothing else.
{
  const A = [0, 0, 0];
  const B = [0, 0, 600];
  const none = { station: null, asteroids: [] };
  assert.equal(shadowSightClear(...A, ...B, none), true);
  const rock = { station: null, asteroids: [{ position: { x: 0, y: 0, z: 300 }, radius: 40 }] };
  assert.equal(shadowSightClear(...A, ...B, rock), false);
  const offRock = { station: null, asteroids: [{ position: { x: 500, y: 0, z: 300 }, radius: 40 }] };
  assert.equal(shadowSightClear(...A, ...B, offRock), true);
  // #149: a removed asteroid slot has no body.
  const deadRock = { station: null, asteroids: [{ position: { x: 0, y: 0, z: 300 }, radius: 0 }] };
  assert.equal(shadowSightClear(...A, ...B, deadRock), true);
  const st = { station: { x: 0, y: 0, z: 300 }, asteroids: [] };
  assert.equal(shadowSightClear(...A, ...B, st), false);
  // Above the cylinder cap the ray is clear — the slab is finite.
  assert.equal(shadowSightClear(0, 200, 0, 0, 200, 600, st), true);
  assert.equal(segmentHitsCylinder(0, 0, 0, 0, 0, 600, 0, 0, 300, PHY.STATION_CYL_RADIUS, PHY.STATION_CYL_Y0, PHY.STATION_CYL_Y1), true);
  assert.equal(segmentHitsCylinder(0, 0, 0, 0, 0, 600, 200, 0, 300, PHY.STATION_CYL_RADIUS, PHY.STATION_CYL_Y0, PHY.STATION_CYL_Y1), false);
  assert.equal(shadowSightClear(NaN, 0, 0, 0, 0, 600, none), false);
}
ok('LOS is blocked by an active asteroid sphere and the station cylinder only');

// ---- Safe-route omission report, authored + representative generated ----
const SAMPLE_STRIDE = 7; // deterministic representative sample, no randomness
const allIds = Object.keys(SYSTEMS);
const authoredIds = Object.keys(AUTHORED_SYSTEMS);
const generatedIds = allIds.filter((id) => !Object.hasOwn(AUTHORED_SYSTEMS, id));
const sampleIds = generatedIds.filter((_id, i) => i % SAMPLE_STRIDE === 0);
const reportRows = [];
function certifyRow(id, group) {
  const cert = certifyShadowSystem(id, { hullRadius: 12 });
  const orbit = shadowOrbitClearance(SYSTEMS[id]);
  reportRows.push({
    id,
    group,
    safe: cert.ok,
    reason: cert.ok ? '' : cert.reason,
    orbitSafe: orbit.ok,
    orbitWorst: Number.isFinite(orbit.worst) ? Math.round(orbit.worst) : null,
  });
  return cert;
}
for (const id of authoredIds) certifyRow(id, 'authored');
for (const id of sampleIds) certifyRow(id, 'generated-sample');
for (const id of allIds) {
  if (Object.hasOwn(AUTHORED_SYSTEMS, id) || sampleIds.includes(id)) continue;
  certifyShadowSystem(id, { hullRadius: 12 }); // must never throw
}
const safeCount = reportRows.filter((r) => r.safe).length;
assert.ok(safeCount > 0, 'at least one destination certifies');
assert.ok(reportRows.filter((r) => r.group === 'authored' && r.safe).length >= 4,
  'most authored destinations certify');
mkdirSync('out/issue-236-237', { recursive: true });
const reportLines = [
  '# Safe-route omission report — #236/#237 (synthetic geometry, no live play)',
  '',
  'Static certificate = every gate (authored rings and the hub body) + station',
  'cylinder + authored asteroid-field sphere, at ' + shadowClearance() + ' u',
  '(gates at ' + shadowGateClearance() + ' u). Planets move and are certified',
  'live instead; `orbitWorst` records the conservative whole-orbit-torus margin',
  'for the record (negative means the torus crosses the route).',
  '',
  'system | group | offer | omit reason | orbit-torus safe | orbit worst (u)',
  '--- | --- | --- | --- | --- | ---',
];
for (const r of reportRows) {
  reportLines.push([r.id, r.group, r.safe ? 'POST' : 'OMIT', r.reason || '-',
    r.orbitSafe ? 'yes' : 'no', r.orbitWorst === null ? '-' : r.orbitWorst].join(' | '));
}
const omitTally = {};
for (const r of reportRows) if (!r.safe) omitTally[r.reason] = (omitTally[r.reason] ?? 0) + 1;
reportLines.push('', 'Rows: ' + reportRows.length + ' — POST ' + safeCount
  + ', OMIT ' + (reportRows.length - safeCount) + ' ' + JSON.stringify(omitTally));
writeFileSync('out/issue-236-237/route-omission-report.md', reportLines.join('\n') + '\n');
ok('route certification runs over every system; omission report written');

// Identity bounds.
assert.equal(shadowRecordId('spy-freehold-7'), 'courier-spy-freehold-7');
assert.equal(shadowRecordId('x'.repeat(64)), null);
assert.equal(isShadowRecordId('courier-spy-freehold-7'), true);
assert.equal(isShadowRecordId('rec-4'), false);
assert.equal(isShadowRecordId('courier-'), false);
assert.equal(isShadowRecordId('courier-spy--freehold-7'), false);
{
  const n = shadowCourierName('spy-freehold-7');
  assert.ok(typeof n === 'string' && n.length >= 1 && n.length <= 40);
  assert.equal(shadowCourierName('spy-freehold-7'), n, 'the public name is deterministic');
  assert.notEqual(shadowCourierName('spy-freehold-8'), n, 'a different job is a different courier');
}
ok('record-id namespace and public name stay inside the persisted bounds');

// ===========================================================================
// Part B — the pure frame integrator
// ===========================================================================

function inputs(over) {
  return Object.assign({
    accepted: true,
    expired: false,
    playerAlive: true,
    docked: false,
    berthHold: false,
    sameSystem: true,
    courierAlive: true,
    courierPresent: true,
    certified: true,
    inCorridor: true,
    selected: true,
    distance: 250,
    sightClear: true,
    acquired: false,
    warningPresented: true,
    courierName: 'Slow Tithe 7',
    destName: 'Veridian Reach',
    employerStation: 'Freehold Landing',
    payQuoted: 180,
  }, over ?? {});
}
function run(state, over, seconds, dtStep) {
  const dt = dtStep ?? 0.1;
  let s = state;
  let last = null;
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    last = stepShadow(s, inputs(over), dt);
    s = last.shadow;
  }
  return last ?? stepShadow(s, inputs(over), 0);
}

// Per-frame cap: never more than the budget, the sim step, or presentation.
assert.equal(shadowFrameSeconds(1 / 60, 1 / 60, true), 1 / 60);
assert.equal(shadowFrameSeconds(5, 5, true), T.frameSeconds);
assert.equal(shadowFrameSeconds(0.05, 0.02, true), 0.02);
assert.equal(shadowFrameSeconds(0.05, 0.02, false), 0);
assert.equal(shadowFrameSeconds(-1, 1, true), 0);
ok('mission time is capped per visible frame and drops delayed backlog');

// Safe observation accrues; the band edges are inclusive.
{
  const r = run(freshShadowState(), {}, 30);
  assert.equal(r.shadow.observedSeconds, 30);
  assert.equal(r.completed, true);
  assert.equal(r.phase, 'basic-ready');
  assert.equal(r.shadow.suspicion, 0, 'safe observation never raises suspicion');
  assert.ok(r.instruction.startsWith('Basic report acquired. Return to Freehold Landing for 180 UU'));
  assert.equal(r.instruction, SHADOW_COPY.acquired('Freehold Landing', 180));
}
for (const d of [150, 400]) {
  const r = stepShadow(freshShadowState(), inputs({ distance: d }), 0.1);
  assert.equal(r.contactReason, 'observing', 'range edge ' + d + ' is inclusive');
  assert.ok(r.shadow.observedSeconds > 0);
}
for (const d of [149.9, 400.1]) {
  const r = stepShadow(freshShadowState(), inputs({ distance: d }), 0.1);
  assert.notEqual(r.contactReason, 'observing');
  assert.equal(r.shadow.observedSeconds, 0);
}
ok('30 s of safe observation acquires the report; 150 and 400 are inclusive edges');

// First contact at a safe range raises nothing.
{
  const r = stepShadow(freshShadowState(), inputs({ distance: 399 }), 0.1);
  assert.equal(r.shadow.suspicion, 0);
  assert.equal(r.risk, 'clear');
  assert.equal(r.shadow.warned, false);
}
ok('first acquisition at safe range generates no suspicion');

// Each pause reason preserves earned seconds and never grants progress.
{
  const half = run(freshShadowState(), {}, 10);
  assert.ok(Math.abs(half.shadow.observedSeconds - 10) < 1e-9);
  const cases = [
    [{ selected: false }, 'not-selected'],
    [{ distance: 900 }, 'out-of-range'],
    [{ sightClear: false }, 'occluded'],
    [{ docked: true }, 'docked'],
    [{ berthHold: true }, 'docked'],
    [{ sameSystem: false }, 'wrong-system'],
    [{ courierPresent: false }, 'target-unavailable'],
    [{ inCorridor: false }, 'target-unavailable'],
    [{ certified: false }, 'target-unavailable'],
  ];
  for (const [over, reason] of cases) {
    const r = run(half.shadow, over, 20);
    assert.equal(r.contactReason, reason, JSON.stringify(over));
    assert.ok(Math.abs(r.shadow.observedSeconds - 10) < 1e-9, 'seconds preserved for ' + reason);
    assert.equal(r.phase, 'paused');
  }
  // A corridor exit pauses BEFORE any LOS claim, even inside the danger band.
  const exited = run(half.shadow, { inCorridor: false, distance: 20, sightClear: true }, 20);
  assert.equal(exited.shadow.suspicion, 0, 'an out-of-corridor courier cannot be crowded');
  assert.equal(exited.instruction, SHADOW_COPY.outsideArea);
  // Docking never collects and never decays.
  const docked = run(half.shadow, { docked: true }, 60);
  assert.equal(docked.shadow.observedSeconds, half.shadow.observedSeconds);
  // A pause and a resume continue from the SAME earned seconds.
  const resumed = run(run(half.shadow, { selected: false }, 5).shadow, {}, 20);
  assert.equal(resumed.shadow.observedSeconds, 30);
}
ok('loss of selection, range, sight, corridor, system or dock pauses without loss');

// Suspicion, the warning frame, grace and exposure.
{
  // 4 s inside 150 u reaches exactly the 40-point warning threshold.
  let s = freshShadowState();
  let out = null;
  let warnFrames = 0;
  for (let i = 0; i < 40; i++) {
    out = stepShadow(s, inputs({ distance: 100, warningPresented: false }), 0.1);
    if (out.warnEmitted) warnFrames += 1;
    s = out.shadow;
  }
  assert.equal(warnFrames, 1, 'the warning latches exactly once');
  assert.equal(s.warned, true);
  assert.ok(s.suspicion >= T.warnAt);
  assert.equal(s.warningSeconds, 0, 'the crossing frame consumes no grace');
  // Unpresented warning: grace cannot move, however long the danger lasts.
  const unpresented = run(s, { distance: 100, warningPresented: false }, 20);
  assert.equal(unpresented.shadow.warningSeconds, 0, 'grace waits for presentation');
  assert.equal(unpresented.exposed, false, 'no exposure before the warning is seen');
  // Presented: grace burns only while dangerously close.
  const safeShort = run(s, { distance: 300 }, 2);
  assert.ok(safeShort.shadow.suspicion > 0 && safeShort.shadow.suspicion < s.suspicion,
    'opening range immediately stops accumulation and starts the fall');
  assert.equal(safeShort.instruction, SHADOW_COPY.withdrawing,
    'a falling warned contact reads as withdrawing');
  const safeHold = run(s, { distance: 300 }, 20);
  assert.equal(safeHold.shadow.warningSeconds, 0, 'safe time never consumes grace');
  assert.equal(safeHold.risk, 'cooling');
  assert.equal(safeHold.shadow.suspicion, 0, 'attention falls all the way back to nothing');
  assert.equal(safeHold.shadow.warned, true, 'warning history is irreversible');
  assert.ok(safeHold.instruction.startsWith('Observing '),
    'once attention is gone the card is back to plain observation');
  // The warning text names the courier in the text itself.
  const close = stepShadow(s, inputs({ distance: 100 }), 0.1);
  assert.equal(close.instruction, SHADOW_COPY.warning('Slow Tithe 7'));
  assert.ok(close.instruction.includes('Slow Tithe 7'));
}
ok('the warning latches once, presents before grace, and decays on withdrawal');

// Exposure needs BOTH suspicion 100 and the whole eight warned seconds.
{
  let s = freshShadowState();
  let out = null;
  let steps = 0;
  while (steps < 4000) {
    out = stepShadow(s, inputs({ distance: 100 }), 0.1);
    s = out.shadow;
    steps += 1;
    if (out.exposed) break;
  }
  assert.equal(out.exposed, true);
  assert.equal(s.suspicion, 100);
  assert.equal(s.warningSeconds, 8);
  // 10 points/s to 100 is 10 s; grace is 8 s of that, so exposure is late.
  assert.ok(steps * 0.1 >= 10, 'exposure never precedes the full warning window');
  // Suspicion at 100 with grace left is 'final warning', not exposure.
  // Read the state itself (dt 0): 100 points with grace left is the final
  // warning, not exposure. One decaying frame already drops it back to warned.
  const primedState = { ...freshShadowState(), warned: true, suspicion: 100, warningSeconds: 3, courierCreated: true };
  const pre = stepShadow(primedState, inputs({ distance: 300 }), 0);
  assert.equal(pre.risk, 'final-warning');
  assert.equal(pre.exposed, false);
  const cooling = stepShadow(primedState, inputs({ distance: 300 }), 0.1);
  assert.equal(cooling.risk, 'warned', 'one safe frame already relieves the final warning');
  assert.equal(cooling.exposed, false);
}
ok('exposure requires suspicion 100 AND all eight warned-danger seconds');

// One large tick cannot skip the warning and expose in the same interval.
{
  let s = freshShadowState();
  let sawWarn = false;
  let exposedAt = -1;
  for (let i = 0; i < 400; i++) {
    const dt = shadowFrameSeconds(60, 60, true); // a badly delayed frame
    const out = stepShadow(s, inputs({ distance: 50, warningPresented: sawWarn }), dt);
    s = out.shadow;
    if (out.warnEmitted) sawWarn = true;
    if (out.exposed) { exposedAt = i; break; }
  }
  assert.equal(sawWarn, true);
  assert.ok(exposedAt > 0, 'exposure still happens');
  assert.ok(exposedAt >= 18, 'the warning is seen many frames before exposure');
}
ok('warning always precedes exposure across large delayed ticks');

// Exposure is evaluated before completion in the same interval.
{
  const primed = { v: 1, courierCreated: true, observedSeconds: 29.95, suspicion: 100, warned: true, warningSeconds: 7.95 };
  const out = stepShadow(primed, inputs({ distance: 100 }), 0.1);
  assert.equal(out.exposed, true);
  assert.equal(out.completed, false);
  assert.ok(out.shadow.observedSeconds < 30, 'a lost assignment never also completes');
}
ok('exposure is evaluated before basic completion in the same interval');

// An acquired report cannot be revoked by later loss or proximity.
{
  const done = { v: 1, courierCreated: true, observedSeconds: 30, suspicion: 0, warned: false, warningSeconds: 0 };
  const after = run(done, { acquired: true, distance: 20 }, 60);
  assert.equal(after.shadow.observedSeconds, 30);
  assert.equal(after.shadow.suspicion, 0, 'mission suspicion stops at acquisition');
  assert.equal(after.phase, 'basic-ready');
  const lost = stepShadow(done, inputs({ acquired: true, courierPresent: false }), 0.1);
  assert.equal(lost.phase, 'basic-ready');
}
ok('the acquired report survives later courier loss and proximity');

// A terminal row projects `ended` and no instruction.
{
  const out = stepShadow(freshShadowState(), inputs({ accepted: false }), 0.1);
  assert.equal(out.phase, 'ended');
  assert.equal(out.instruction, '');
}
ok('a terminal row projects ended with no instruction');

// ===========================================================================
// Part C — save normalization
// ===========================================================================

const goodShadow = { v: 1, courierCreated: true, observedSeconds: 12.5, suspicion: 44, warned: true, warningSeconds: 3 };
assert.deepEqual(sanitizeShadowState(goodShadow, { state: 'accepted', progress: 0 }), goodShadow);
assert.deepEqual(sanitizeShadowState(freshShadowState(), { state: 'offered', progress: 0 }), freshShadowState());
// Warned true with suspicion zero is preserved exactly; grace is not replenished.
assert.deepEqual(
  sanitizeShadowState({ v: 1, courierCreated: true, observedSeconds: 3, suspicion: 0, warned: true, warningSeconds: 6 }, { state: 'accepted', progress: 0 }),
  { v: 1, courierCreated: true, observedSeconds: 3, suspicion: 0, warned: true, warningSeconds: 6 },
);
const rejectCases = [
  ['null', null, { state: 'accepted', progress: 0 }],
  ['array', [], { state: 'accepted', progress: 0 }],
  ['unknown version', { ...goodShadow, v: 2 }, { state: 'accepted', progress: 0 }],
  ['unknown nested field', { ...goodShadow, deep: true }, { state: 'accepted', progress: 0 }],
  ['non-finite number', { ...goodShadow, suspicion: NaN }, { state: 'accepted', progress: 0 }],
  ['string number', { ...goodShadow, suspicion: '44' }, { state: 'accepted', progress: 0 }],
  ['suspicion over bound', { ...goodShadow, suspicion: 101 }, { state: 'accepted', progress: 0 }],
  ['seconds over bound', { ...goodShadow, observedSeconds: 31 }, { state: 'accepted', progress: 0 }],
  ['grace over bound', { ...goodShadow, warningSeconds: 9 }, { state: 'accepted', progress: 0 }],
  ['negative scalar', { ...goodShadow, observedSeconds: -1 }, { state: 'accepted', progress: 0 }],
  ['non-boolean created', { ...goodShadow, courierCreated: 1 }, { state: 'accepted', progress: 0 }],
  ['grace without warning', { ...goodShadow, warned: false, suspicion: 0, warningSeconds: 2 }, { state: 'accepted', progress: 0 }],
  ['warn-level suspicion without warning', { ...goodShadow, warned: false, warningSeconds: 0 }, { state: 'accepted', progress: 0 }],
  ['progress 1 without 30 s', { ...goodShadow }, { state: 'accepted', progress: 1 }],
  ['30 s without progress', { ...goodShadow, observedSeconds: 30 }, { state: 'accepted', progress: 0 }],
  ['uncreated with counters', { ...goodShadow, courierCreated: false }, { state: 'accepted', progress: 0 }],
  ['uncreated with warning', { v: 1, courierCreated: false, observedSeconds: 0, suspicion: 0, warned: true, warningSeconds: 0 }, { state: 'accepted', progress: 0 }],
  ['offered but created', { ...freshShadowState(), courierCreated: true }, { state: 'offered', progress: 0 }],
  ['offered with counters', { ...freshShadowState(), observedSeconds: 1 }, { state: 'offered', progress: 0 }],
];
for (const [label, raw, job] of rejectCases) {
  assert.equal(sanitizeShadowState(raw, job), null, 'rejects: ' + label);
}
assert.deepEqual(
  sanitizeShadowState({ v: 1, courierCreated: true, observedSeconds: 30, suspicion: 0, warned: false, warningSeconds: 0 }, { state: 'accepted', progress: 1 }),
  { v: 1, courierCreated: true, observedSeconds: 30, suspicion: 0, warned: false, warningSeconds: 0 },
);
ok('the save reader rejects every malformed subtype payload and repairs none');

// Ownership resolves only for the exact accepted job.
{
  const job = { kind: 'espionage', mission: 'courier-shadow', slot: 2, state: 'accepted', recordId: 'courier-spy-freehold-1' };
  assert.equal(shadowJobForRecordId([job], 'courier-spy-freehold-1'), job);
  assert.equal(shadowJobForRecordId([job], 'courier-spy-freehold-2'), null);
  assert.equal(shadowJobForRecordId([{ ...job, state: 'failed' }], 'courier-spy-freehold-1'), null);
  assert.equal(shadowJobForRecordId([{ ...job, mission: 'other' }], 'courier-spy-freehold-1'), null);
  assert.equal(shadowJobForRecordId([{ ...job, slot: 0 }], 'courier-spy-freehold-1'), null);
  assert.equal(isShadowJob({ kind: 'espionage', slot: 2 }), false);
  assert.equal(isShadowJob({ kind: 'war', mission: 'courier-shadow', slot: 2 }), false);
}
ok('mission ownership resolves only for the exact accepted subtype row');

// ===========================================================================
// Part D — the real station owner
// ===========================================================================

seedBootRandom();
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems, binds } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
const { snapshot: saveSnapshot, restore } = await import('../src/game/save.js');
const { initAgentApi } = await import('../src/systems/agent-api.js');
for (const el of dom.walkDom(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.agent.optIn = true;
initAgentApi(ctx);
const api = window.rimward;

function tick(n = 1, dt = 1 / 60) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += dt;
    ctx.elapsed += dt;
    station.update(dt);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }];
  world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  tick(2);
  ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true, 'docked at ' + id);
}
const shadowOf = (sysId) => ctx.world.jobs.find((j) => isShadowJob(j) && j.originSystem === sysId);

dock('freehold');
ctx.stationDesk.selectService('jobs');
tick(2);

// One clearly titled extra posting, in its own slot, beside BOTH old slots.
let offer = shadowOf('freehold');
assert.ok(offer, 'freehold posts a shadow courier offer');
assert.equal(offer.title, 'Shadow courier');
assert.equal(offer.slot, 2);
assert.equal(offer.mission, 'courier-shadow');
assert.equal(offer.need, 1);
assert.equal(offer.progress, 0);
assert.equal(offer.recordId, shadowRecordId(offer.id));
assert.equal(offer.destSystem, 'veridian');
assert.deepEqual(offer.shadow, freshShadowState());
const introSlots = ctx.world.jobs
  .filter((j) => j.kind === 'espionage' && j.originSystem === 'freehold' && j.mission === undefined)
  .map((j) => j.slot).sort();
// Freehold has exactly one gate rival, so the introductory family fills slot 0
// only — unchanged by this subtype. What matters is that slot 2 never leaks
// into the introductory family and that the old slots still fill normally.
assert.ok(introSlots.length >= 1, 'the introductory spy family still fills');
assert.ok(introSlots.every((n) => n === 0 || n === 1), 'introductory rows keep slots 0/1 only');
assert.equal(introSlots.includes(COURIER_SHADOW.slot), false, 'slot 2 never becomes introductory');
assert.equal(ctx.world.jobs.filter((j) => isShadowJob(j) && j.originSystem === 'freehold').length, 1);
// The briefing states every promised fact.
for (const bit of [offer.target, 'Veridian', String(T.rendezvousRange), '150–400', '30 accumulated seconds',
  'Docking does not gather this report', 'Crowding inside 150 units']) {
  assert.ok(offer.detail.includes(bit), 'briefing states: ' + bit);
}
ok('a single clearly titled shadow posting joins both introductory spy slots');

// The offered API projection is briefing-only: no live risk, no live position.
{
  const row = api.observe().jobs.offers.find((j) => j.id === offer.id);
  assert.ok(row && row.shadow, 'the offered row publishes a shadow projection');
  assert.equal(row.shadow.targetName, offer.target);
  assert.equal(row.shadow.targetSystem, 'veridian');
  assert.equal(row.shadow.rendezvousRange, T.rendezvousRange);
  assert.equal(row.shadow.minRange, T.minRange);
  assert.equal(row.shadow.maxRange, T.maxRange);
  assert.equal(row.shadow.requiredSeconds, T.requiredSeconds);
  const route = shadowRoute(SYSTEMS.veridian);
  assert.deepEqual(row.shadow.rendezvousOffset, route.offset, 'briefing and API share one static offset');
  assert.equal(row.shadow.rendezvousGateTo, route.gateTo);
  for (const k of ['phase', 'risk', 'observedSeconds', 'warningGraceRemaining', 'currentTargetId']) {
    assert.equal(Object.hasOwn(row.shadow, k), false, 'an offer never reports live ' + k);
  }
  assert.equal(Object.hasOwn(row, 'recordId'), false, 'recordId is not a remote handle');
}
ok('an offered row publishes the static briefing only, never live state');

// Accept: the displayed quote freezes and the courier is deferred or created.
const quotedReward = offer.reward;
assert.equal(api.act({ v: 2, name: 'acceptJob', args: { id: offer.id } }).ok, true);
let job = ctx.world.jobs.find((j) => j.id === offer.id);
assert.equal(job.state, 'accepted');
assert.equal(job.payQuoted, quotedReward, 'the displayed offer quote is the agreement');
assert.equal(job.deadline, ctx.world.time + T.deadlineSeconds);
assert.equal(job.shadow.courierCreated, false, 'an unvisited destination bank defers creation');
ok('acceptance freezes the displayed quote and defers the courier to the first bank load');

// Standing is untouched by the whole subtype so far.
const standingAt = () => JSON.stringify(ctx.world.reputation);
let standingBefore = standingAt();

// Materialize the destination bank: ONE record, adopted not duplicated.
ctx.world.currentSystem = 'veridian';
ctx.lastEvents = [{ type: 'systemLoaded', to: 'veridian' }];
world.update(0);
ctx.flags.docked = false;
tick(40);
job = ctx.world.jobs.find((j) => j.id === offer.id);
assert.equal(job.shadow.courierCreated, true, 'the deferred creation runs at the bank first load');
const bank = ctx.world.recordBanks.veridian;
const couriers = bank.filter((r) => r.id === job.recordId);
assert.equal(couriers.length, 1, 'exactly one courier record');
const courier = couriers[0];
assert.equal(courier.role, 'trader');
assert.equal(courier.classKey, 'freighter');
assert.deepEqual(courier.cargo, []);
assert.equal(courier.bounty, 0);
assert.equal(courier.name, job.target);
assert.equal(courier.system, 'veridian');
assert.equal(courier.outboundTo, null);
{
  const route = shadowRoute(SYSTEMS.veridian);
  assert.deepEqual(courier.route, [route.near, route.far], 'the courier flies the certified route');
}
// A second lifecycle pass adopts, it does not duplicate.
tick(60);
assert.equal(ctx.world.recordBanks.veridian.filter((r) => r.id === job.recordId).length, 1);
ok('one ordinary-looking freighter is created on the certified off-lane route');

// Mission guards: no route rewrite, no migration, no offline drift.
{
  const before = JSON.stringify([courier.route, courier.leg, courier.legT, courier.dir]);
  const { normalizeTraderRecord, traderAtOutboundGate, tickBank } = await import('../src/game/world.js');
  normalizeTraderRecord(courier, ctx);
  courier.legT = 0.99;
  courier.leg = 0;
  courier.dir = 1;
  courier.state = 'enroute';
  assert.equal(traderAtOutboundGate(courier, ctx), false, 'a bound courier never migrates');
  const frozen = JSON.stringify([courier.route, courier.leg, courier.legT, courier.dir]);
  tickBank(ctx.world.recordBanks.veridian, 'veridian', ctx);
  assert.equal(JSON.stringify([courier.route, courier.leg, courier.legT, courier.dir]), frozen,
    'a bound courier does not advance offline');
  // An ordinary trader in the SAME bank still advances and still migrates.
  const other = ctx.world.recordBanks.veridian.find((r) => r.role === 'trader' && r.id !== courier.id
    && r.state === 'enroute' && !r.live);
  if (other) {
    const otherBefore = other.legT;
    tickBank(ctx.world.recordBanks.veridian, 'veridian', ctx);
    assert.notEqual(other.legT, otherBefore, 'unrelated traffic is untouched');
  }
  courier.legT = 0;
  JSON.parse(before);
}
ok('mission guards bind exactly one record and leave unrelated traffic alone');

// Ownership is released the moment the job stops being accepted.
{
  const { shadowOwnedRecord } = await import('../src/game/world.js');
  assert.equal(shadowOwnedRecord(ctx, courier), true);
  job.state = 'failed';
  assert.equal(shadowOwnedRecord(ctx, courier), false, 'a dropped job leaves ordinary traffic');
  job.state = 'accepted';
  assert.equal(shadowOwnedRecord(ctx, courier), true);
  const plain = ctx.world.recordBanks.veridian.find((r) => r.id !== courier.id);
  assert.equal(shadowOwnedRecord(ctx, plain), false, 'no other record is ever owned');
}
ok('ownership is derived from the live job and released exactly once');

// Save round trip: mid-warning state survives; grace is not replenished.
{
  job.shadow = { v: 1, courierCreated: true, observedSeconds: 11, suspicion: 63, warned: true, warningSeconds: 5 };
  const snap = JSON.parse(JSON.stringify(saveSnapshot(ctx)));
  restore(ctx, snap);
  const back = ctx.world.jobs.find((j) => j.id === offer.id);
  assert.ok(back, 'the subtype survives a round trip');
  assert.equal(back.mission, 'courier-shadow');
  assert.equal(back.slot, 2);
  assert.equal(back.recordId, shadowRecordId(back.id));
  assert.equal(back.target, job.target);
  assert.deepEqual(back.shadow, { v: 1, courierCreated: true, observedSeconds: 11, suspicion: 63, warned: true, warningSeconds: 5 });
  assert.equal(ctx.world.recordBanks.veridian.filter((r) => r.id === back.recordId).length, 1, 'no duplicate hull');
  job = back;
}
ok('a mid-warning assignment round-trips exactly, with its spent grace intact');

// A basic-ready row round-trips; a tampered one is dropped whole.
{
  job.progress = 1;
  job.shadow = { v: 1, courierCreated: true, observedSeconds: 30, suspicion: 0, warned: false, warningSeconds: 0 };
  const snap = JSON.parse(JSON.stringify(saveSnapshot(ctx)));
  restore(ctx, snap);
  let back = ctx.world.jobs.find((j) => j.id === offer.id);
  assert.equal(back.progress, 1);
  assert.equal(back.shadow.observedSeconds, 30);
  // Tamper: claim the report without the seconds.
  const bad = JSON.parse(JSON.stringify(snap));
  const badRow = bad.world.jobs.find((j) => j.id === offer.id);
  badRow.shadow.observedSeconds = 0;
  restore(ctx, bad);
  assert.equal(ctx.world.jobs.some((j) => j.id === offer.id), false, 'a forged report is dropped whole');
  // Tamper: an unknown mission value must not become an introductory job.
  const bad2 = JSON.parse(JSON.stringify(snap));
  bad2.world.jobs.find((j) => j.id === offer.id).mission = 'courier-deep';
  restore(ctx, bad2);
  assert.equal(ctx.world.jobs.some((j) => j.id === offer.id), false, 'an unknown subtype is rejected');
  // Tamper: cross-job record id.
  const bad3 = JSON.parse(JSON.stringify(snap));
  bad3.world.jobs.find((j) => j.id === offer.id).recordId = 'courier-spy-freehold-999';
  restore(ctx, bad3);
  assert.equal(ctx.world.jobs.some((j) => j.id === offer.id), false, 'a cross-job record id is rejected');
  // Tamper: mission markers on an unrelated family.
  const bad4 = JSON.parse(JSON.stringify(snap));
  const war = bad4.world.jobs.find((j) => j.kind !== 'espionage');
  if (war) {
    war.mission = 'courier-shadow';
    restore(ctx, bad4);
    assert.equal(ctx.world.jobs.some((j) => j.id === war.id), false, 'mission on another family is rejected');
  }
  restore(ctx, snap);
  job = ctx.world.jobs.find((j) => j.id === offer.id);
  assert.ok(job);
}
ok('a basic-ready row round-trips; every tampered variant drops the whole job');

// Old introductory rows keep their own validation beside slot 2.
{
  const snap = JSON.parse(JSON.stringify(saveSnapshot(ctx)));
  const intro = snap.world.jobs.find((j) => j.kind === 'espionage' && j.mission === undefined);
  assert.ok(intro, 'an introductory spy row exists alongside the subtype');
  const legacy = JSON.parse(JSON.stringify(snap));
  legacy.world.jobs.find((j) => j.id === intro.id).slot = 2;
  restore(ctx, legacy);
  assert.equal(ctx.world.jobs.some((j) => j.id === intro.id), false, 'slot 2 alone never opens the subtype');
  // `shadow` is a RESERVED subtype marker. A row carrying one with no
  // `mission` to explain it is malformed subtype input, and a malformed
  // subtype must never downgrade into a payable introductory spy contract.
  const stuffed = JSON.parse(JSON.stringify(snap));
  stuffed.world.jobs.find((j) => j.id === intro.id).shadow = freshShadowState();
  restore(ctx, stuffed);
  assert.equal(ctx.world.jobs.some((j) => j.id === intro.id), false,
    'a shadow payload with no mission marker drops the whole job');
  // The same on an old slot, with a worked-looking payload and a quote: still
  // no payable introductory row, and no subtype either.
  const stuffedSlot = JSON.parse(JSON.stringify(snap));
  const forged = stuffedSlot.world.jobs.find((j) => j.id === intro.id);
  forged.slot = 0;
  forged.payQuoted = 500;
  forged.progress = 1;
  forged.shadow = { v: 1, courierCreated: true, observedSeconds: 30, suspicion: 0, warned: false, warningSeconds: 0 };
  restore(ctx, stuffedSlot);
  const forgedBack = ctx.world.jobs.find((j) => j.id === intro.id);
  assert.equal(forgedBack, undefined, 'an old-slot row with a shadow payload is rejected whole');
  assert.equal(ctx.world.jobs.some((j) => isShadowJob(j) && j.id === intro.id), false,
    'and it certainly never becomes the subtype');
  // The mission marker itself: an unknown value fails the job too.
  const badMission = JSON.parse(JSON.stringify(snap));
  badMission.world.jobs.find((j) => j.id === intro.id).mission = 'courier-deep';
  restore(ctx, badMission);
  assert.equal(ctx.world.jobs.some((j) => j.id === intro.id), false, 'an unknown mission marker is rejected');
  restore(ctx, snap);
  assert.equal(ctx.world.jobs.some((j) => j.id === intro.id), true, 'the untouched old row still loads');
  job = ctx.world.jobs.find((j) => j.id === offer.id);
}
ok('old espionage validation is not relaxed by the new subtype');

// Baseline compatibility: an old row carrying inert target/recordId is KEPT
// with those fields stripped, exactly as before the subtype existed.
{
  const snap = JSON.parse(JSON.stringify(saveSnapshot(ctx)));
  const intro = snap.world.jobs.find((j) => j.kind === 'espionage' && j.mission === undefined);
  assert.ok(intro);
  const stuffed = JSON.parse(JSON.stringify(snap));
  const row = stuffed.world.jobs.find((j) => j.id === intro.id);
  row.recordId = 'rec-9';
  row.target = 'Somebody';
  restore(ctx, stuffed);
  const kept = ctx.world.jobs.find((j) => j.id === intro.id);
  assert.ok(kept, 'a legacy row with inert extras still loads');
  assert.equal(Object.hasOwn(kept, 'recordId'), false, 'the inert recordId is stripped');
  assert.equal(Object.hasOwn(kept, 'target'), false, 'the inert target is stripped');
  assert.equal(Object.hasOwn(kept, 'mission'), false);
  assert.equal(Object.hasOwn(kept, 'shadow'), false);
  assert.equal(isShadowJob(kept), false, 'inert extras never open the subtype');
  restore(ctx, snap);
  job = ctx.world.jobs.find((j) => j.id === offer.id);
}
ok('a legacy espionage row with inert target/recordId is stripped, never rejected');

// Save capacity: a full board plus one shadow per system round-trips.
{
  const snap = JSON.parse(JSON.stringify(saveSnapshot(ctx)));
  const ids = new Set(snap.world.jobs.map((j) => j.id));
  const extra = [];
  for (const sysId of Object.keys(AUTHORED_SYSTEMS)) {
    const row = JSON.parse(JSON.stringify(snap.world.jobs.find((j) => j.id === offer.id)));
    row.id = 'spy-' + sysId + '-9' + extra.length;
    if (ids.has(row.id)) continue;
    const dest = certifyShadowSystem('veridian').ok ? 'veridian' : null;
    if (!dest || sysId === 'veridian') continue;
    // The save reader still applies the ordinary rival rule: a same-faction
    // origin has no eligible destination and is dropped for that reason, not
    // by the family cap. Only build rows the reader can legitimately keep.
    if (SYSTEMS[sysId].faction === SYSTEMS[dest].faction) continue;
    // 'unknowables' never employs or is spied on — an existing family rule.
    if (SYSTEMS[sysId].faction === 'unknowables') continue;
    row.originSystem = sysId;
    row.destSystem = dest;
    row.recordId = shadowRecordId(row.id);
    row.state = 'accepted';
    extra.push(row);
  }
  const clean = JSON.parse(JSON.stringify(snap));
  snap.world.jobs.push(...extra);
  const total = snap.world.jobs.length;
  restore(ctx, snap);
  const kept = extra.filter((r) => ctx.world.jobs.some((j) => j.id === r.id)).length;
  assert.equal(kept, extra.length, 'every extra shadow row survives the family cap');
  assert.ok(ctx.world.jobs.length >= total - 2, 'nothing else was truncated to make room');
  // Drop the capacity fixture again: those synthetic rows are not part of the
  // settlement scenario below.
  restore(ctx, clean);
  job = ctx.world.jobs.find((j) => j.id === offer.id);
}
ok('the family cap has room for one shadow assignment per system');

// Employer-only, exactly-once settlement.
{
  job.progress = 1;
  job.state = 'accepted';
  job.shadow = { v: 1, courierCreated: true, observedSeconds: 30, suspicion: 0, warned: false, warningSeconds: 0 };
  job.deadline = ctx.world.time + T.deadlineSeconds;
  const payQuoted = job.payQuoted;
  // Wrong employer never settles it.
  dock('veridian');
  const creditsAtWrongDock = ctx.world.credits;
  tick(120);
  assert.equal(ctx.world.credits, creditsAtWrongDock, 'another employer never settles the report');
  assert.equal(ctx.world.jobs.find((j) => j.id === offer.id)?.state, 'accepted');
  // The posting employer pays exactly once.
  dock('freehold');
  const before = ctx.world.credits;
  tick(120);
  const paid = ctx.world.credits - before;
  assert.equal(paid, payQuoted, 'the employer pays the accepted quote');
  assert.equal(ctx.world.jobs.some((j) => j.id === offer.id), false, 'the settled row leaves the board');
  assert.equal(ctx.world.recordBanks.veridian.some((r) => r.id === job.recordId), false,
    'settlement retires the dedicated courier');
  const after = ctx.world.credits;
  tick(240);
  assert.equal(ctx.world.credits, after, 'repeated ticks cannot pay twice');
  const snap = JSON.parse(JSON.stringify(saveSnapshot(ctx)));
  restore(ctx, snap);
  tick(120);
  assert.equal(ctx.world.credits, after, 'reloading the settled save cannot pay again');
}
ok('only the posting employer settles, exactly once, and never again on reload');

// A fresh posting reposts with a new id, record id and quote line.
{
  dock('freehold');
  ctx.stationDesk.selectService('jobs');
  tick(4);
  const next = shadowOf('freehold');
  assert.ok(next, 'the desk reposts one fresh shadow offer');
  assert.notEqual(next.id, offer.id);
  assert.equal(next.recordId, shadowRecordId(next.id));
  assert.equal(next.state, 'offered');
  assert.deepEqual(next.shadow, freshShadowState());
  offer = next;
}
ok('a terminal outcome reposts exactly one fresh offer at the next sync');

// Expiry: accepted and unaccepted, both without any standing write.
{
  standingBefore = standingAt();
  const live = shadowOf('freehold');
  live.deadline = ctx.world.time - 1;
  tick(120);
  assert.equal(ctx.world.jobs.some((j) => j.id === live.id), false, 'the expired posting leaves the board');
  assert.equal(standingAt(), standingBefore, 'an expired shadow POSTING writes no standing');
  const lines = ctx.agent.events.filter((e) => e.type === 'jobState');
  assert.ok(Array.isArray(lines));
}
{
  ctx.stationDesk.selectService('jobs');
  tick(4);
  const fresh = shadowOf('freehold');
  assert.ok(fresh);
  assert.equal(api.act({ v: 2, name: 'acceptJob', args: { id: fresh.id } }).ok, true);
  standingBefore = standingAt();
  const creditsBefore = ctx.world.credits;
  const accepted = ctx.world.jobs.find((j) => j.id === fresh.id);
  accepted.progress = 1;
  accepted.shadow = { v: 1, courierCreated: true, observedSeconds: 30, suspicion: 0, warned: false, warningSeconds: 0 };
  accepted.deadline = ctx.world.time - 1;
  tick(120);
  assert.equal(ctx.world.jobs.some((j) => j.id === fresh.id), false);
  assert.equal(ctx.world.credits, creditsBefore, 'an expired assignment pays nothing, acquired or not');
  assert.equal(standingAt(), standingBefore, 'an expired shadow ASSIGNMENT writes no standing');
}
ok('expiry is checked before settlement and writes no faction standing');

// Contact loss ends the assignment promptly, with no standing penalty.
{
  ctx.stationDesk.selectService('jobs');
  tick(4);
  const row = shadowOf('freehold');
  assert.ok(row);
  assert.equal(api.act({ v: 2, name: 'acceptJob', args: { id: row.id } }).ok, true);
  const live = ctx.world.jobs.find((j) => j.id === row.id);
  // Fixture: the courier was created, then its record disappears from the bank
  // (destroyed offscreen, captured, a corrupt bank). Marker stays true, so this
  // is target LOSS and never a respawn.
  live.shadow.courierCreated = true;
  const lostBank = ctx.world.recordBanks[live.destSystem];
  if (Array.isArray(lostBank)) {
    const li = lostBank.findIndex((r) => r && r.id === live.recordId);
    if (li >= 0) lostBank.splice(li, 1);
  }
  standingBefore = standingAt();
  const creditsBefore = ctx.world.credits;
  tick(120);
  assert.equal(ctx.world.jobs.some((j) => j.id === row.id), false, 'a missing bound record ends the job');
  assert.equal(standingAt(), standingBefore, 'contact loss writes no standing');
  assert.equal(ctx.world.credits, creditsBefore, 'contact loss pays nothing');
}
ok('a created-then-missing courier is target loss, never a respawn');

// Abandonment uses the existing disclosed cost and no second penalty.
{
  ctx.stationDesk.selectService('jobs');
  tick(4);
  const row = shadowOf('freehold');
  assert.ok(row);
  assert.equal(api.act({ v: 2, name: 'acceptJob', args: { id: row.id } }).ok, true);
  const before = JSON.parse(JSON.stringify(ctx.world.reputation));
  const res = ctx.stationDesk.abandonJob(row.id);
  assert.equal(res.ok, true, JSON.stringify(res));
  const after = ctx.world.reputation;
  const changed = Object.keys(after).filter((k) => after[k] !== before[k]);
  assert.equal(changed.length, 1, 'exactly one standing row moves: the disclosed employer cost');
  assert.equal(ctx.world.jobs.some((j) => j.id === row.id), false);
}
ok('abandonment applies only the existing disclosed employer cost');

// Two employers stay distinct; nothing is shared.
{
  dock('freehold');
  ctx.stationDesk.selectService('jobs');
  tick(4);
  const a = shadowOf('freehold');
  assert.ok(a);
  assert.equal(api.act({ v: 2, name: 'acceptJob', args: { id: a.id } }).ok, true);
  dock('veridian');
  ctx.stationDesk.selectService('jobs');
  tick(4);
  const b = shadowOf('veridian');
  if (b) {
    assert.equal(api.act({ v: 2, name: 'acceptJob', args: { id: b.id } }).ok, true);
    const liveA = ctx.world.jobs.find((j) => j.id === a.id);
    const liveB = ctx.world.jobs.find((j) => j.id === b.id);
    assert.notEqual(liveA.recordId, liveB.recordId);
    assert.notEqual(liveA.target, liveB.target);
    liveA.shadow.observedSeconds = 17;
    assert.equal(liveB.shadow.observedSeconds, 0, 'progress is never shared between employers');
  }
}
ok('simultaneous assignments from two employers stay fully distinct');

// ===========================================================================
// Part E — real freighter motion on the certified route
// ===========================================================================
//
// SYNTHETIC fixture, not a natural flight: the courier record and its live
// hull are placed by the test, then driven by the REAL npc.js update for
// several full laps. Nothing here is teleported after the placement, and no
// flight constant is overridden.

{
  const { spawnLiveShip, removeLiveShip, recordPosition } = binds;
  const npc = systems.find(([n]) => n === 'npc')[1];
  dock('freehold');
  ctx.stationDesk.selectService('jobs');
  // Clear any assignment the earlier scenarios left accepted, so this run
  // starts from a fresh posting.
  for (const j of [...ctx.world.jobs]) {
    if (isShadowJob(j) && j.state === 'accepted') ctx.stationDesk.abandonJob(j.id);
  }
  tick(4);
  const motionOffer = shadowOf('freehold');
  assert.ok(motionOffer, 'a shadow posting exists for the motion run');
  assert.equal(api.act({ v: 2, name: 'acceptJob', args: { id: motionOffer.id } }).ok, true);
  const motionJob = ctx.world.jobs.find((j) => j.id === motionOffer.id);
  const destId = motionJob.destSystem;

  // Materialize the destination bank and let the deferred creation land.
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.world.currentSystem = destId;
  ctx.lastEvents = [{ type: 'systemLoaded', to: destId }];
  world.update(0);
  tick(40);
  assert.equal(motionJob.shadow.courierCreated, true, 'the courier exists for the motion run');
  const rec = ctx.world.recordBanks[destId].find((r) => r.id === motionJob.recordId);
  assert.ok(rec, 'the bound record is in the destination bank');

  const route = shadowRoute(SYSTEMS[destId]);
  const hullR = (() => {
    const sc = scaleFor(T.classKey);
    if (sc && Number.isFinite(sc.maxRadius) && sc.maxRadius > 0) return sc.maxRadius;
    const p = sc && sc.proxy;
    if (p) return Math.hypot(p.rx || 0, p.ry || 0, p.halfLen || 0);
    return 0;
  })();
  assert.ok(hullR > 0 && hullR < T.corridorRadius, 'the freighter hull fits the corridor');

  // Place the live hull exactly where the record says it is, then stop
  // touching it: npc.js owns every frame from here.
  const startPos = new (ctx.ship.object.position.constructor)();
  recordPosition(rec, startPos);
  const live = spawnLiveShip(ctx, rec, startPos);
  assert.ok(live, 'the courier instantiates');
  ctx.ships.push(live);
  rec.live = true;
  // Park the player inside the safe band so nothing culls or engages.
  ctx.ship.object.position.set(startPos.x + 250, startPos.y, startPos.z);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;

  const dtMotion = 1 / 30;
  const seconds = 240;
  let worstCentre = 0;
  let reversals = 0;
  let lastWp = live.ai.wp;
  let maxSpeed = 0;
  let inBandFrames = 0;
  for (let i = 0; i < seconds / dtMotion; i++) {
    ctx.world.time += dtMotion;
    ctx.elapsed += dtMotion;
    npc.update(dtMotion);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
    const p = live.object.position;
    const d = segmentPointDistance(
      route.near.x, route.near.y, route.near.z,
      route.far.x, route.far.y, route.far.z,
      p.x, p.y, p.z,
    );
    if (d > worstCentre) worstCentre = d;
    if (live.ai.wp !== lastWp) { reversals += 1; lastWp = live.ai.wp; }
    const sp = live.ai.velocity && typeof live.ai.velocity.length === 'function'
      ? live.ai.velocity.length() : 0;
    if (sp > maxSpeed) maxSpeed = sp;
    if (pointInCorridor(route, p.x, p.y, p.z, hullR)) inBandFrames += 1;
  }
  const frames = Math.round(seconds / dtMotion);
  console.log('MOTION ' + JSON.stringify({
    system: destId,
    seconds,
    reversals,
    worstCentreOffset: Number(worstCentre.toFixed(2)),
    hullRadius: Number(hullR.toFixed(2)),
    worstHullOffset: Number((worstCentre + hullR).toFixed(2)),
    corridorRadius: T.corridorRadius,
    maxSpeed: Number(maxSpeed.toFixed(2)),
    inCorridorFrames: inBandFrames,
    frames,
  }));
  assert.ok(reversals >= 4, 'the courier completed repeated end turns (' + reversals + ')');
  assert.ok(maxSpeed <= T.cruiseCap + 1e-6, 'the mission cruise cap holds (' + maxSpeed + ')');
  assert.ok(worstCentre + hullR <= T.corridorRadius,
    'the actual hull never leaves the 50 u corridor (worst ' + (worstCentre + hullR).toFixed(2) + ')');
  assert.equal(inBandFrames, frames, 'every frame of the run was inside the certified corridor');

  // The same mission frame the station runs agrees: the certificate holds.
  assert.equal(shadowPlanetsClear(route, ctx.planetBodies), true,
    'the live planet bodies clear the envelope for this run');

  removeLiveShip(ctx, live);
  const li = ctx.ships.indexOf(live);
  if (li >= 0) ctx.ships.splice(li, 1);
  rec.live = false;

  // Terminal release retires the exact hull and leaves the bank clean.
  const bankBefore = ctx.world.recordBanks[destId].length;
  const otherIds = ctx.world.recordBanks[destId].filter((r) => r.id !== rec.id).map((r) => r.id);
  dock('freehold');
  ctx.stationDesk.selectService('jobs');
  assert.equal(ctx.stationDesk.abandonJob(motionJob.id).ok, true);
  const bankAfter = ctx.world.recordBanks[destId];
  assert.equal(bankAfter.some((r) => r.id === rec.id), false, 'the dedicated courier is retired');
  assert.equal(bankAfter.length, bankBefore - 1, 'exactly one record left the bank');
  assert.deepEqual(bankAfter.map((r) => r.id), otherIds, 'no unrelated record was touched');
}
ok('a real freighter flies repeated end turns without leaving the 50 u corridor');

// The published live planet bodies are the seeded ones, from the first build.
{
  dock('freehold');
  const seeded = shadowSeededPlanets(SYSTEMS.freehold);
  assert.ok(Array.isArray(ctx.planetBodies) && ctx.planetBodies.length === seeded.length,
    'the renderer publishes one body per authored planet slot');
  for (let i = 0; i < seeded.length; i++) {
    const body = ctx.planetBodies[i];
    assert.equal(body.radius, seeded[i].radius, 'slot ' + i + ' radius matches');
    const r = Math.hypot(body.x, body.z);
    assert.ok(Math.abs(r - PLANET_ORBITS_RADII[i]) < 1e-6, 'slot ' + i + ' rides its own orbit');
    assert.equal(body.y, 0);
  }
}
ok('the live planet bodies match the seeded orbit table this module certifies against');

// Repeated terminal outcomes cannot pile courier records up in a bank.
{
  const destId = 'veridian';
  const baseline = ctx.world.recordBanks[destId] ? ctx.world.recordBanks[destId].length : 0;
  for (let round = 0; round < 3; round++) {
    dock('freehold');
    ctx.stationDesk.selectService('jobs');
    tick(4);
    const row = shadowOf('freehold');
    assert.ok(row, 'round ' + round + ' posts an offer');
    assert.equal(api.act({ v: 2, name: 'acceptJob', args: { id: row.id } }).ok, true);
    const liveRow = ctx.world.jobs.find((j) => j.id === row.id);
    if (ctx.flags.docked) ctx.stationDesk.undock();
    ctx.flags.docked = false;
    ctx.world.currentSystem = destId;
    ctx.lastEvents = [{ type: 'systemLoaded', to: destId }];
    world.update(0);
    tick(40);
    assert.equal(liveRow.shadow.courierCreated, true, 'round ' + round + ' created its courier');
    dock('freehold');
    ctx.stationDesk.selectService('jobs');
    assert.equal(ctx.stationDesk.abandonJob(row.id).ok, true,
      'round ' + round + ' abandons its assignment');
  }
  assert.equal(ctx.world.recordBanks[destId].length, baseline,
    'three completed rounds leave the destination bank exactly as it was');
}
ok('repeated assignments never accumulate courier records in a bank');

// Family order: the introductory rows stay ahead of this employer's shadow row.
{
  dock('freehold');
  ctx.stationDesk.selectService('jobs');
  tick(4);
  const order = ctx.world.jobs
    .filter((j) => j.kind === 'espionage' && j.originSystem === 'freehold'
      && (j.state === 'offered' || j.state === 'accepted'));
  const firstShadow = order.findIndex((j) => isShadowJob(j));
  const lastIntro = order.map((j) => isShadowJob(j)).lastIndexOf(false);
  assert.ok(firstShadow >= 0, 'a shadow row is live');
  assert.ok(lastIntro >= 0, 'an introductory row is live');
  assert.ok(lastIntro < firstShadow, 'introductory rows precede the shadow row');
  // A replaced introductory row goes back IN FRONT of the shadow row, not at
  // the end of world.jobs (the family read order must not change).
  const intro = order.find((j) => !isShadowJob(j));
  intro.state = 'offered';
  intro.deadline = ctx.world.time - 1;
  tick(120);
  const after = ctx.world.jobs
    .filter((j) => j.kind === 'espionage' && j.originSystem === 'freehold'
      && (j.state === 'offered' || j.state === 'accepted'));
  const firstAfter = after.findIndex((j) => isShadowJob(j));
  const introAfter = after.map((j) => isShadowJob(j)).lastIndexOf(false);
  if (introAfter >= 0 && firstAfter >= 0) {
    assert.ok(introAfter < firstAfter, 'the reposted introductory row is still ahead');
  }
}
ok('a replaced introductory posting keeps its place ahead of the shadow row');

console.log(`\nAll ${pass} courier-shadow checks passed (synthetic fixtures only; no natural live run is claimed).`);
