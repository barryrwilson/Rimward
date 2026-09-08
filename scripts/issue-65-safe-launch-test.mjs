/**
 * Issue #65: safe departure clearance for the ordinary station Launch and the
 * agent API undock. Everything here runs the REAL systems — the real dock, the
 * real Launch button closure, the real agent handle, and real per-frame
 * updates — so the five-second hands-off claim is measured on actual
 * simulation, not on a plan record.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-65-safe-launch-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import {
  planLaunch,
  launchCorridorLength,
  berthOwnersReady,
  applyBerthFlight,
  applyBerthInput,
  LAUNCH_HOLD_SECONDS,
  LAUNCH_RELEASE_MARGIN,
} from '../src/game/launch-clearance.js';
import { PHY } from '../src/game/physics.js';
import { collectBodies, cylinderOverlap } from '../src/game/collision.js';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { SYSTEMS, spawnLiveShip, removeLiveShip } = binds;
const DT = 1 / 60;

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;

let pass = 0;
function ok(label) { pass++; console.log('PASS', label); }

function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
const shipPos = () => ctx.ship.object.position;
const stationPos = () => ctx.station.position;
const distToStation = () => shipPos().distanceTo(stationPos());
/** Unit nose vector (ship local -Z). */
function nose() {
  const q = ctx.ship.object.quaternion;
  const x = 0, y = 0, z = -1;
  const ix = q.w * x + q.y * z - q.z * y;
  const iy = q.w * y + q.z * x - q.x * z;
  const iz = q.w * z + q.x * y - q.y * x;
  const iw = -q.x * x - q.y * y - q.z * z;
  return {
    x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
    y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
    z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
  };
}
function radialAway() {
  const p = shipPos(); const s = stationPos();
  const d = { x: p.x - s.x, y: p.y - s.y, z: p.z - s.z };
  const len = Math.hypot(d.x, d.y, d.z) || 1;
  return { x: d.x / len, y: d.y / len, z: d.z / len };
}
function outwardDot() {
  const n = nose(); const r = radialAway();
  return n.x * r.x + n.y * r.y + n.z * r.z;
}
/** Park on a chosen approach side and run the REAL dock. */
function dockFrom(systemId, dir, range = 36) {
  if (ctx.flags.docked) launchOrThrow();
  if (ctx.world.currentSystem !== systemId) {
    ctx.world.currentSystem = systemId;
    tick(3);
  }
  const s = SYSTEMS[systemId].station.position;
  const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  ctx.ship.object.position.set(
    s[0] + (dir[0] / len) * range,
    s[1] + (dir[1] / len) * range,
    s[2] + (dir[2] / len) * range,
  );
  ctx.input.dockPressed = true;
  tick(1);
  ctx.input.dockPressed = false;
  tick(2);
  assert.equal(ctx.flags.docked, true, `dock at ${systemId} from ${dir}`);
}
function launchOrThrow() {
  const result = ctx.stationDesk.undock();
  assert.equal(result.ok, true, 'launch refused: ' + JSON.stringify(result));
  return result;
}
const notice = () => (ctx.stationDesk.peekView()?.notice ?? '');

// Real finite-cylinder clearance, the same primitive flight collides with.
// Radial distance alone would call a hull "clear" while it sat over a cap.
const _ov = { hit: false, nx: 0, ny: 1, nz: 0, overlap: 0 };
function stationOverlap() {
  const p = shipPos();
  const s = stationPos();
  cylinderOverlap(
    p.x, p.y, p.z, PHY.PLAYER_RADIUS,
    s.x, s.y, s.z, PHY.STATION_CYL_RADIUS, PHY.STATION_CYL_Y0, PHY.STATION_CYL_Y1,
    _ov,
  );
  return { hit: _ov.hit === true, overlap: _ov.overlap };
}
/** The one fixture hull this test owns, inserted the way the harness does. */
const _fixtureBodies = { count: 0, items: [] };
function addFixtureShip(id, name, pos) {
  const live = spawnLiveShip(
    ctx,
    { id, name, classKey: 'heavy', faction: 'freehold', role: 'trader', resolve: 50 },
    pos,
  );
  assert.ok(live, `${name} spawned`);
  // traffic.js owns ctx.ships in production; a fixture inserts and removes its
  // own hull by hand. The production collector is untouched — so prove the hull
  // really reaches it before relying on a refusal.
  ctx.ships.push(live);
  collectBodies(ctx, _fixtureBodies);
  let seen = false;
  for (let i = 0; i < _fixtureBodies.count; i++) {
    const b = _fixtureBodies.items[i];
    if (b.kind === 'ship' && b.id === id) { seen = true; break; }
  }
  assert.equal(seen, true, `${name} is visible to collectBodies as a ship body`);
  return live;
}
function removeFixtureShip(live) {
  const i = ctx.ships.indexOf(live);
  assert.ok(i >= 0, 'fixture hull was in ctx.ships');
  ctx.ships.splice(i, 1);
  removeLiveShip(ctx, live);
}

// ---------------------------------------------------------------------------
// 1. Docking parks the ship in the same synchronous call — no next frame.
{
  const s = SYSTEMS.freehold.station.position;
  ctx.world.currentSystem = 'freehold';
  tick(2);
  ctx.ship.object.position.set(s[0] + 36, s[1], s[2]);
  // Stale motion and stale movement input, exactly what an approach leaves.
  ctx.ship.velocity.set(11, -4, 7);
  ctx.ship.speed = 13.6;
  ctx.input.throttle = 0.8;
  ctx.input.strafeX = 1;
  ctx.input.strafeY = -1;
  ctx.input.roll = 1;
  ctx.input.steerX = 0.6;
  ctx.input.steerY = -0.4;
  ctx.input.fireHeld = true;
  ctx.input.driftHeld = true;
  ctx.ship.driftActive = true;
  ctx.flags.matchSpeed = true;

  ctx.stationDesk.selectService('__none__'); // no-op guard: not docked yet
  ctx.input.dockPressed = true;
  // Drive ONLY station.update: no ship.update may run before we look.
  ctx.world.time += DT;
  const stationSys = systems.find(([n]) => n === 'station')[1];
  stationSys.update(DT);
  assert.equal(ctx.flags.docked, true, 'station.update docks on the edge');
  assert.equal(ctx.ship.velocity.length(), 0, 'dock zeroes velocity in the same call');
  assert.equal(ctx.ship.speed, 0, 'dock zeroes published speed in the same call');
  assert.equal(ctx.input.throttle, 0, 'dock clears the throttle setpoint');
  assert.equal(ctx.input.strafeX, 0, 'dock clears strafe');
  assert.equal(ctx.input.strafeY, 0, 'dock clears vertical strafe');
  assert.equal(ctx.input.roll, 0, 'dock clears roll');
  assert.equal(ctx.input.steerX, 0, 'dock clears steering');
  assert.equal(ctx.input.steerY, 0, 'dock clears steering');
  assert.equal(ctx.input.fireHeld, false, 'dock clears fire');
  assert.equal(ctx.input.driftHeld, false, 'dock clears drift');
  assert.equal(ctx.ship.driftActive, false, 'dock ends vector-hold');
  assert.equal(ctx.flags.matchSpeed, false, 'dock drops match-speed');
  ctx.input.dockPressed = false;
  ctx.lastEvents = ctx.events; ctx.events = [];
  tick(2);
  ok('dock parks the ship and clears movement input synchronously');
}

// ---------------------------------------------------------------------------
// 2 + 3. Outward release and a five-second hands-off run, at several approach
// orientations, at two different stations.
const ORIENTATIONS = [
  [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
  [0.707, 0.2, 0.707], [-0.6, -0.3, 0.74],
];
function fiveSecondRun(systemId, dir) {
  dockFrom(systemId, dir);
  const before = { x: shipPos().x, y: shipPos().y, z: shipPos().z };
  const plan = planLaunch(ctx);
  assert.equal(plan.ok, true, `plan clear at ${systemId} ${dir}`);
  launchOrThrow();
  assert.equal(ctx.flags.docked, false, 'launch leaves the berth');

  const dot = outwardDot();
  assert.ok(dot > 0.9999, `nose points straight out (dot=${dot}) at ${systemId} ${dir}`);
  assert.ok(
    distToStation() >= Math.hypot(before.x - stationPos().x, before.y - stationPos().y, before.z - stationPos().z) - 1e-6,
    'release never pulls the hull inward',
  );
  assert.equal(ctx.ship.velocity.length(), 0, 'launch starts from rest');

  // Hands-off: no further input at all, real updates for five seconds.
  // Geometry is sampled EVERY frame with the real finite-cylinder test, so a
  // contact cannot hide behind the 0.15 s bodyHit emit throttle. The event
  // count is kept as a separate, independent signal.
  const frames = Math.ceil(LAUNCH_HOLD_SECONDS / DT);
  let geomContacts = 0;
  let worstOverlap = 0;
  let hitEvents = 0;
  const startDist = distToStation();
  assert.equal(stationOverlap().hit, false, `release point is clear geometry at ${systemId} ${dir}`);
  for (let i = 0; i < frames; i++) {
    tick(1);
    const ov = stationOverlap();
    if (ov.hit) { geomContacts++; worstOverlap = Math.max(worstOverlap, ov.overlap); }
    for (const ev of ctx.lastEvents) {
      if (ev.type === 'bodyHit' && ev.kind === 'station') hitEvents++;
    }
  }
  const moved = distToStation() - startDist;
  assert.equal(
    geomContacts, 0,
    `no station cylinder contact on any of ${frames} frames at ${systemId} ${dir} `
    + `(worst overlap ${worstOverlap.toFixed(3)})`,
  );
  assert.equal(hitEvents, 0, `and no bodyHit was emitted either at ${systemId} ${dir}`);
  assert.ok(moved >= -1e-6, `hands-off drift is never inward (moved=${moved.toFixed(2)}) at ${systemId} ${dir}`);
  return { dot, frames, moved };
}
for (const dir of ORIENTATIONS) {
  const r = fiveSecondRun('freehold', dir);
  console.log(`  freehold ${JSON.stringify(dir)} dot=${r.dot.toFixed(6)} frames=${r.frames} moved=${r.moved.toFixed(2)} contacts=0`);
}
ok('Freehold: every approach orientation launches outward and stays clear for five real seconds');
for (const dir of ORIENTATIONS) {
  const r = fiveSecondRun('veridian', dir);
  console.log(`  veridian ${JSON.stringify(dir)} dot=${r.dot.toFixed(6)} frames=${r.frames} moved=${r.moved.toFixed(2)} contacts=0`);
}
ok('Veridian: a second station behaves the same at every approach orientation');

// ---------------------------------------------------------------------------
// 4. Dock and launch inside ONE tick, with no settling frames between them.
//    Only station.update runs; ship.js and controls.js get no chance to tidy
//    anything up, so both transitions must be complete on their own.
{
  if (ctx.flags.docked) launchOrThrow();
  ctx.world.currentSystem = 'freehold';
  tick(3);
  const s = SYSTEMS.freehold.station.position;
  const stationSys = systems.find(([n]) => n === 'station')[1];

  ctx.ship.object.position.set(s[0], s[1], s[2] + 36); // approach from +Z
  // Stale everything an approach can leave behind, including a live
  // vector-hold and the realign window that follows its release.
  ctx.ship.velocity.set(-18, 6, -22);
  ctx.ship.speed = 28.9;
  ctx.ship.driftActive = true;
  ctx.input.driftHeld = true;
  ctx.input.throttle = 0.9;
  ctx.input.strafeX = -1;
  ctx.input.steerY = 0.8;
  ctx.flags.matchSpeed = true;
  ctx.input.dockPressed = true;

  ctx.world.time += DT;
  stationSys.update(DT); // the only update in this tick
  assert.equal(ctx.flags.docked, true, 'the berth took the ship');
  ctx.input.dockPressed = false;

  // Launch immediately, still inside the same tick.
  const result = ctx.stationDesk.undock();
  assert.equal(result.ok, true, 'same-tick launch: ' + JSON.stringify(result));
  assert.equal(ctx.flags.docked, false, 'same-tick dock then launch releases');
  assert.equal(ctx.ship.velocity.length(), 0, 'no stale velocity survives the pair');
  assert.equal(ctx.ship.speed, 0, 'no stale speed survives the pair');
  assert.equal(ctx.ship.driftActive, false, 'the vector-hold is closed, not left running');
  assert.equal(ctx.flags.matchSpeed, false, 'match-speed is dropped');
  assert.equal(ctx.input.throttle, 0, 'the stale setpoint cannot deliver into the lane');
  assert.equal(ctx.input.strafeX, 0, 'stale strafe is gone');
  assert.equal(ctx.input.steerY, 0, 'stale steering is gone');
  assert.equal(stationOverlap().hit, false, 'the release point is clear geometry');
  const dot = outwardDot();
  assert.ok(dot > 0.9999, `same-tick pair still leaves nose-out (dot=${dot})`);

  ctx.lastEvents = ctx.events; ctx.events = [];
  let contacts = 0;
  for (let i = 0; i < 60; i++) { tick(1); if (stationOverlap().hit) contacts++; }
  assert.equal(contacts, 0, 'and it stays clear once the frames resume');
  ok('dock and launch inside one tick leaves no stale drift, realign, or input');
}

// ---------------------------------------------------------------------------
// 5. A fouled lane holds the berth, atomically, and the retry works.
{
  dockFrom('freehold', [1, 0, 0]);
  const s = stationPos();
  const before = {
    pos: shipPos().clone(),
    quat: ctx.ship.object.quaternion.clone(),
    docked: ctx.flags.docked,
    fence: ctx.station.fenceUnlocked,
    keeper: ctx.station.keeperComp,
    throttle: ctx.input.throttle,
    credits: ctx.world.credits,
  };
  // A hull parked in the departure lane, well clear of the station itself.
  const blocker = addFixtureShip('issue65-lane', 'Issue65 Lane Blocker', new THREE.Vector3(s.x + 90, s.y, s.z));
  tick(1);
  const plan = planLaunch(ctx);
  assert.equal(plan.ok, false, 'a hull in the lane refuses the plan');
  assert.equal(plan.token, 'blocked', 'refusal token is blocked');
  assert.equal(plan.blocker, 'ship', 'the blocking body is named');

  const held = ctx.stationDesk.undock();
  assert.equal(held.ok, false, 'Launch is held');
  assert.equal(held.token, 'blocked', 'the desk reports the obstruction');
  assert.match(held.notice, /^Launch held/, 'the player gets an actionable line');
  assert.match(notice(), /^Launch held/, 'the panel shows it too');

  assert.equal(ctx.flags.docked, true, 'a held launch stays docked');
  assert.deepEqual(
    [shipPos().x, shipPos().y, shipPos().z],
    [before.pos.x, before.pos.y, before.pos.z],
    'a held launch does not move the ship',
  );
  assert.equal(ctx.ship.object.quaternion.equals(before.quat), true, 'a held launch does not turn the ship');
  assert.equal(ctx.ship.velocity.length(), 0, 'a held launch leaves the ship parked');
  assert.equal(ctx.station.fenceUnlocked, before.fence, 'per-visit fence state survives a hold');
  assert.equal(ctx.station.keeperComp, before.keeper, 'per-visit keeper state survives a hold');
  assert.equal(ctx.world.credits, before.credits, 'a hold moves no credits');
  assert.equal(ctx.stationDesk.peekView()?.level, 1, 'the panel is still open at the top level');

  // Retry after the lane clears.
  removeFixtureShip(blocker);
  tick(1);
  const freed = ctx.stationDesk.undock();
  assert.equal(freed.ok, true, 'the retry launches once the lane is clear');
  assert.equal(ctx.flags.docked, false, 'the retry leaves the berth');
  ok('a fouled lane holds the berth atomically, explains itself, and retries clean');
}

// ---------------------------------------------------------------------------
// 6. The refusal propagates through the agent API, and success does too.
{
  const api = globalThis.window.rimward;
  assert.ok(api && typeof api.act === 'function', 'agent handle present');
  ctx.agent.optIn = true;

  dockFrom('freehold', [1, 0, 0]);
  const s = stationPos();
  const blocker = addFixtureShip('issue65-api', 'Issue65 API Blocker', new THREE.Vector3(s.x + 90, s.y, s.z));
  tick(1);
  const refused = api.act({ name: 'undock' });
  assert.equal(refused.ok, false, 'API undock reports the refusal');
  assert.equal(refused.token, 'blocked', 'API token is blocked');
  assert.match(refused.error, /^Launch held/, 'API error carries the player-visible reason');
  assert.equal(ctx.flags.docked, true, 'API refusal leaves the ship docked');
  assert.equal(ctx.agent.lastIntent.ok, false, 'the receipt records the refusal');
  assert.equal(ctx.agent.lastIntent.token, 'blocked', 'the receipt carries the token');

  removeFixtureShip(blocker);
  tick(1);
  const flew = api.act({ name: 'undock' });
  assert.equal(flew.ok, true, 'API undock succeeds on a clear lane');
  assert.equal(ctx.flags.docked, false, 'API undock actually leaves the berth');
  assert.ok(outwardDot() > 0.9999, 'API undock uses the same outward release');
  const again = api.act({ name: 'undock' });
  assert.equal(again.ok, false, 'undocking twice refuses');
  assert.equal(again.token, 'no-service', 'the second call is a no-service, not a launch');
  ok('agent API propagates both the obstruction refusal and the successful launch');
}

// ---------------------------------------------------------------------------
// 7. Missing world / missing owner hooks fail closed.
{
  const bare = { flags: { docked: true }, world: { time: 0 } };
  assert.equal(berthOwnersReady(bare), false, 'a context with no hooks has no owners');
  assert.equal(planLaunch(bare).token, 'no-service', 'no owners means no plan');
  assert.equal(applyBerthFlight(bare, { x: 0, y: 0, z: 0, dirX: 1, dirY: 0, dirZ: 0 }), false, 'no flight owner refuses');
  assert.equal(applyBerthInput(bare, 'launch'), false, 'no input owner refuses');

  // A live context whose station position is unreadable also refuses.
  const savedStation = ctx.station;
  ctx.station = { position: { x: NaN, y: 0, z: 0 }, name: 'broken' };
  const broken = planLaunch(ctx);
  assert.equal(broken.ok, false, 'an unreadable station refuses');
  assert.equal(broken.token, 'no-service', 'and it refuses as no-service');
  ctx.station = savedStation;
  ok('missing world state and missing owner hooks fail closed');
}

// ---------------------------------------------------------------------------
// 8. Ordinary collision damage is untouched — no invulnerability was added.
{
  if (ctx.flags.docked) launchOrThrow();
  ctx.world.currentSystem = 'freehold';
  tick(3);
  const s = stationPos();
  // Fly at the hull for real: nose IN, throttle up. Simply writing a velocity
  // would be undone by the flight integrator easing back onto the nose.
  const start = 90;
  ctx.ship.object.position.set(s.x + start, s.y, s.z);
  // THREE's Object3D.lookAt aims local +Z at the target (only cameras/lights
  // use -Z), and the ship's nose is local -Z. Aim +Z at the mirrored point so
  // the nose ends up on the station.
  ctx.ship.object.lookAt(s.x + 2 * start, s.y, s.z);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.throttle = 1;
  ctx.input.fullStop = false;
  // Shields absorb first (screen, then shell) and only then hull. Empty them
  // explicitly so this measures collision damage, not shield capacity.
  ctx.player.screen = 0;
  ctx.player.shell = 0;
  const before = {
    hull: ctx.player.hull,
    screen: ctx.player.screen,
    shell: ctx.player.shell,
  };
  let hits = 0;
  let frames = 0;
  for (; frames < 600 && hits === 0; frames++) {
    tick(1);
    for (const ev of ctx.lastEvents) if (ev.type === 'bodyHit' && ev.kind === 'station') hits++;
  }
  const absorbed = (before.screen - ctx.player.screen) + (before.shell - ctx.player.shell);
  const hullLost = before.hull - ctx.player.hull;
  assert.ok(hits > 0, `flying into the station still registers a hit (after ${frames} frames)`);
  assert.ok(hullLost > 0, `and it still costs hull (lost ${hullLost}, shields absorbed ${absorbed})`);
  ctx.input.throttle = 0;
  console.log(`  collision: frames=${frames} hits=${hits} hullLost=${hullLost} shieldAbsorbed=${absorbed}`);
  ok('ordinary station collision damage is preserved outside the berth');
}

// ---------------------------------------------------------------------------
// 9. Hooks are per context (kept last: it boots a second full system graph): a second boot must not steer the first ship.
{
  assert.equal(berthOwnersReady(ctx), true, 'the live context has both owners');
  const second = await bootGameSystems();
  assert.equal(berthOwnersReady(second.ctx), true, 'the second context registers its own owners');
  assert.notEqual(second.ctx, ctx, 'two distinct contexts');
  const firstBefore = shipPos().clone();
  const placed = applyBerthFlight(second.ctx, {
    x: 12345, y: 6789, z: -4321, dirX: 0, dirY: 1, dirZ: 0,
  });
  assert.equal(placed, true, "the second context's own hook answers");
  assert.deepEqual(
    [shipPos().x, shipPos().y, shipPos().z],
    [firstBefore.x, firstBefore.y, firstBefore.z],
    "a second context's launch never moves the first context's ship",
  );
  assert.equal(second.ctx.ship.object.position.x, 12345, 'it moved its own ship instead');
  ok('berth hooks are keyed per context, so extra boots cannot cross wires');
}

// ---------------------------------------------------------------------------
// 10. The corridor actually covers the hands-off creep run.
{
  const corridor = launchCorridorLength(ctx);
  const creep = ctx.config.ship.creep;
  assert.ok(corridor >= creep * LAUNCH_HOLD_SECONDS, 'the checked lane covers five seconds of creep');
  assert.ok(LAUNCH_RELEASE_MARGIN > 0, 'the release point keeps real clearance');
  ok(`departure lane is ${corridor} u for a ${creep} u/s creep over ${LAUNCH_HOLD_SECONDS}s`);
}

console.log(`ISSUE-65 SAFE LAUNCH PASS — ${pass} checks`);
