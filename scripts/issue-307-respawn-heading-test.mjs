/**
 * Issue #307 — the #95 respawn-heading half.
 *
 * Both deaths of the 2026-11-09 salvager run were solar kills on the departure
 * leg. #95 fixed the fresh BOOT heading and parked the respawn heading. This
 * focused boot test pins the two respawn paths against the live star bearing and
 * the release axis the berth hands back:
 *
 *   1  fresh start after a death with no save: the restored hull faces away
 *      from the sun and its ordinary half-throttle flight never takes heat.
 *   2  death rewind to a sunward berth/launch checkpoint: the restored heading
 *      faces away from the sun and the ordinary flight never takes heat.
 *   3  a berth parked on the sunward side: the release ray clears the star's
 *      heat zone by LAUNCH_SUN_MARGIN while the #65 outward release contract
 *      (dot(nose, radial-away) = 1) and the five-second station clearance hold.
 *   4  an ordinary boot load still restores the exact saved heading, so the
 *      respawn guard never leaks into the saved-pose contract.
 *
 * Real systems only: the real title/origin API, the real dock/undock closures,
 * the real save system consuming docked/undocked/playerDestroyed events, and
 * the real per-frame flight. Fixtures are disclosed where they exist.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-307-respawn-heading-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS } from '../src/game/state.js';
import { PHY } from '../src/game/physics.js';
import { cylinderOverlap } from '../src/game/collision.js';
// Namespace import so this regression test also runs against pre-fix code (the
// release-axis constant did not exist before issue #307); the 8 fallback mirrors
// the production LAUNCH_SUN_MARGIN.
import * as launchClearance from '../src/game/launch-clearance.js';

const KEY = 'rimward-save-v1';
const BERTH_KEY = 'rimward-save-v1-berth';
const DT = 1 / 60;
const FREEHOLD = SYSTEMS.freehold;
const SUN = new THREE.Vector3(0, 0, 0);
const STATION = new THREE.Vector3(...FREEHOLD.station.position);
const SUN_MARGIN = typeof launchClearance.LAUNCH_SUN_MARGIN === 'number' ? launchClearance.LAUNCH_SUN_MARGIN : 8;
const HEAT_CLEAR = FREEHOLD.sunRadius * PHY.SUN_HEAT_MULT + SUN_MARGIN;

seedBootRandom();
let dom = installDomStubs();

function tick(ctx, systems, n, only) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    ctx.elapsed += DT;
    for (const [name, sys] of systems) {
      if (only && !only.includes(name)) continue;
      sys.update?.(DT);
    }
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
const nose = (ctx) => new THREE.Vector3(0, 0, -1).applyQuaternion(ctx.ship.object.quaternion).normalize();
const outward = (ctx) => ctx.ship.object.position.clone().sub(SUN).normalize();
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
/** Closest distance from the sun to the ray (start + t*dir, t>=0). */
function rayClosestSun(start, dir) {
  const ox = start.x - SUN.x, oy = start.y - SUN.y, oz = start.z - SUN.z;
  const along = ox * dir.x + oy * dir.y + oz * dir.z;
  if (along <= 0) return Math.hypot(ox, oy, oz);
  return Math.hypot(
    oy * dir.z - oz * dir.y,
    oz * dir.x - ox * dir.z,
    ox * dir.y - oy * dir.x,
  );
}
function startOrigin(ctx, systems) {
  ctx.titleApi.start();
  assert.equal(ctx.originsApi.choose('greenhand'), '');
  tick(ctx, systems, 30);
}
function clearTraffic(ctx, systems, binds) {
  const sweep = () => {
    for (const live of [...ctx.ships]) {
      const i = ctx.ships.indexOf(live);
      if (i >= 0) ctx.ships.splice(i, 1);
      binds.removeLiveShip(ctx, live);
    }
  };
  sweep();
  tick(ctx, systems, 1);
  // Issue #339: that tick refills the near tier from ambient crowd records, and
  // a hull spawned into the departure lane holds the launch. The fixture wants
  // an empty lane, so sweep the refill too; traffic respawns on the next tick.
  sweep();
}
/** Park on a chosen approach side and run the REAL dock. */
function dockFrom(ctx, systems, dir, range = 36) {
  if (ctx.flags.docked) {
    const r = ctx.stationDesk.undock();
    assert.equal(r.ok, true, 'fixture undock: ' + JSON.stringify(r));
  }
  const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  ctx.ship.object.position.set(
    STATION.x + (dir[0] / len) * range,
    STATION.y + (dir[1] / len) * range,
    STATION.z + (dir[2] / len) * range,
  );
  ctx.input.dockPressed = true;
  tick(ctx, systems, 1);
  ctx.input.dockPressed = false;
  tick(ctx, systems, 2);
  assert.equal(ctx.flags.docked, true, 'dock at ' + JSON.stringify(dir));
}
function undock(ctx, systems, binds) {
  clearTraffic(ctx, systems, binds);
  const r = ctx.stationDesk.undock();
  assert.equal(r.ok, true, 'launch refused: ' + JSON.stringify(r));
  return r;
}
/** Fly the ordinary first throttle flight with no steering, real systems. */
function ordinaryFlight(ctx, systems, seconds = 60) {
  ctx.input.throttle = 0.5;
  ctx.input.throttleHeld = true;
  ctx.input.fullStop = false;
  const events = [];
  const startSun = ctx.ship.object.position.distanceTo(SUN);
  const startStation = ctx.ship.object.position.distanceTo(STATION);
  for (let i = 0; i < seconds * 60; i++) {
    tick(ctx, systems, 1);
    for (const ev of ctx.lastEvents) {
      if (['sunHeat', 'sunKill', 'playerDestroyed'].includes(ev.type)) events.push(ev.type);
    }
    if (ctx.player.destroyed) break;
  }
  return {
    events,
    startSun,
    endSun: ctx.ship.object.position.distanceTo(SUN),
    startStation,
    endStation: ctx.ship.object.position.distanceTo(STATION),
    hull: ctx.player.hull,
    destroyed: ctx.player.destroyed,
  };
}
function die(ctx, systems, dom) {
  // The real death state is flying (a docked hull cannot be destroyed).
  ctx.flags.docked = false;
  ctx.ship.object.position.set(2600, 0, 0);
  tick(ctx, systems, 30 * 60, []); // no save runs: the stored record is untouched
  ctx.emit('playerDestroyed', {});
  tick(ctx, systems, 2, ['save']);
  assert.equal(ctx.deathApi.isOpen(), true, 'the death overlay opened');
  dom.dispatchKey('Enter');
  tick(ctx, systems, 2, ['save', 'controls']);
  const rec = ctx.agent.events.filter((e) => e.type === 'recovered').slice(-1)[0];
  assert.ok(rec, 'a recovered receipt was emitted');
  return rec;
}
const stationOverlap = (ctx) => {
  const p = ctx.ship.object.position;
  const ov = { hit: false, nx: 0, ny: 1, nz: 0, overlap: 0 };
  cylinderOverlap(
    p.x, p.y, p.z, PHY.PLAYER_RADIUS,
    STATION.x, STATION.y, STATION.z, PHY.STATION_CYL_RADIUS, PHY.STATION_CYL_Y0, PHY.STATION_CYL_Y1,
    ov,
  );
  return ov;
};

let pass = 0;
const ok = (label) => { pass++; console.log('PASS', label); };

// ---------------------------------------------------------------------------
// 1. Fresh start after a death with no save.
// ---------------------------------------------------------------------------
{
  dom.store.delete(KEY);
  dom.store.delete(BERTH_KEY);
  let { ctx, systems } = await bootGameSystems();
  startOrigin(ctx, systems);
  const rec = die(ctx, systems, dom);
  assert.equal(rec.source, 'fresh', 'no save means a fresh start');
  const p = ctx.ship.object.position;
  assert.ok(Math.abs(p.x - 120) < 1e-6 && Math.abs(p.z - 680) < 1e-6, 'fresh hull waits at the Freehold pad: ' + JSON.stringify(p.toArray()));
  const out = outward(ctx);
  assert.ok(dot(nose(ctx), out) > 0.9999, 'fresh respawn faces away from the sun (dot=' + dot(nose(ctx), out).toFixed(6) + ')');
  const flight = ordinaryFlight(ctx, systems, 60);
  assert.deepEqual(flight.events, [], 'fresh respawn ordinary flight takes no solar damage: ' + JSON.stringify(flight.events));
  assert.equal(flight.destroyed, false, 'fresh respawn survives the ordinary flight');
  assert.ok(flight.endSun > flight.startSun + 100, 'fresh respawn ordinary flight increases sun distance');
  assert.ok(flight.endStation > flight.startStation + 100, 'fresh respawn ordinary flight leaves the pad (no station stall)');
  ok('fresh respawn faces outward and flies the ordinary first throttle flight clear');
}

// ---------------------------------------------------------------------------
// 2a. Death rewind to a sunward DOCK checkpoint. The saved heading is a real
// approach heading: the hull came at the station from the outer side, nose on
// the sun. The respawn must not hand that heading back to the pilot.
// ---------------------------------------------------------------------------
{
  dom.store.delete(KEY);
  dom.store.delete(BERTH_KEY);
  let { ctx, systems, binds } = await bootGameSystems();
  startOrigin(ctx, systems);
  const out = outward(ctx);
  // Park on the outer side of the station and face the sun, exactly what a
  // run inbound from the origin spawn leaves at the berth.
  ctx.ship.object.position.copy(STATION).addScaledVector(out, 36);
  ctx.ship.object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), out.clone().negate());
  ctx.input.dockPressed = true;
  tick(ctx, systems, 1);
  ctx.input.dockPressed = false;
  tick(ctx, systems, 2);
  assert.equal(ctx.flags.docked, true, 'docked from the outer side');
  tick(ctx, systems, 2, ['save']);
  const saved = JSON.parse(dom.store.get(BERTH_KEY));
  assert.ok(saved && saved.berth === true, 'the dock checkpoint is the berth mirror');
  const savedNose = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion().fromArray(saved.ship.quaternion));
  assert.ok(dot(savedNose, out) < -0.9, 'the saved dock heading points at the sun (dot=' + dot(savedNose, out).toFixed(3) + ')');
  const rec = die(ctx, systems, dom);
  assert.equal(rec.source, 'berth', 'the rewind names the berth checkpoint');
  const restored = outward(ctx);
  assert.ok(dot(nose(ctx), restored) > 0.9999, 'rewound hull faces away from the sun (dot=' + dot(nose(ctx), restored).toFixed(6) + ')');
  const flight = ordinaryFlight(ctx, systems, 60);
  assert.deepEqual(flight.events, [], 'rewound hull ordinary flight takes no solar damage: ' + JSON.stringify(flight.events));
  assert.equal(flight.destroyed, false, 'rewound hull survives the ordinary flight');
  assert.ok(flight.endSun > flight.startSun + 100, 'rewound ordinary flight increases sun distance');
  ok('death rewind to a sunward dock checkpoint faces outward and flies clear');
}

// ---------------------------------------------------------------------------
// 2b. Death rewind to a LAUNCH checkpoint written before the release-axis fix.
// The stored quaternion is forged to the old sunward release (a disclosed
// fixture); every stamp stays real, so readRecoveryPlan still trusts it. This
// is the exact shape of the salvager run's second death.
// ---------------------------------------------------------------------------
{
  dom.store.delete(KEY);
  dom.store.delete(BERTH_KEY);
  let { ctx, systems, binds } = await bootGameSystems();
  startOrigin(ctx, systems);
  const out = outward(ctx);
  const sunward = out.clone().negate();
  dockFrom(ctx, systems, [-sunward.x, -sunward.y, -sunward.z]);
  undock(ctx, systems, binds);
  tick(ctx, systems, 2, ['save']);
  const launch = JSON.parse(dom.store.get(BERTH_KEY));
  assert.ok(launch && launch.berth === true && launch.ship, 'the launch checkpoint is the berth mirror');
  assert.equal(launch.ship.position.length, 3, 'the launch checkpoint carries the release pose');
  // Disclosed fixture: rotate only the stored ship heading back to the old
  // sunward release. savedAt/world.time stamps are untouched.
  launch.ship.quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), sunward).toArray();
  dom.store.set(BERTH_KEY, JSON.stringify(launch));
  const rec = die(ctx, systems, dom);
  assert.equal(rec.source, 'berth', 'the rewind names the launch checkpoint');
  const restored = outward(ctx);
  assert.ok(dot(nose(ctx), restored) > 0.9999, 'rewound launch hull faces away from the sun (dot=' + dot(nose(ctx), restored).toFixed(6) + ')');
  const flight = ordinaryFlight(ctx, systems, 60);
  assert.deepEqual(flight.events, [], 'rewound launch ordinary flight takes no solar damage: ' + JSON.stringify(flight.events));
  assert.equal(flight.destroyed, false, 'rewound launch hull survives the ordinary flight');
  ok('death rewind to a pre-fix sunward launch checkpoint faces outward and flies clear');
}

// ---------------------------------------------------------------------------
// 3. A berth parked on the exact sunward side. The #65 outward release is kept
// (nose on the actual release radial), the release ray clears the heat zone by
// LAUNCH_SUN_MARGIN, and the hands-off five-second station clearance still
// holds.
// ---------------------------------------------------------------------------
{
  dom.store.delete(KEY);
  dom.store.delete(BERTH_KEY);
  let { ctx, systems, binds } = await bootGameSystems();
  startOrigin(ctx, systems);
  const out = outward(ctx);
  const sunward = out.clone().negate();
  dockFrom(ctx, systems, [sunward.x, sunward.y, sunward.z]);
  undock(ctx, systems, binds);
  const p = ctx.ship.object.position;
  const dir = nose(ctx);
  const radial = p.clone().sub(STATION).normalize();
  assert.ok(dot(dir, radial) > 0.9999, '#65 outward release contract holds (dot=' + dot(dir, radial).toFixed(6) + ')');
  const closest = rayClosestSun(p, dir);
  assert.ok(closest >= HEAT_CLEAR - 1e-6, 'release ray clears the heat zone by the margin: ' + closest.toFixed(2) + ' >= ' + HEAT_CLEAR.toFixed(2));
  let contacts = 0;
  for (let i = 0; i < Math.ceil(5 / DT); i++) {
    tick(ctx, systems, 1);
    if (stationOverlap(ctx).hit) contacts++;
  }
  assert.equal(contacts, 0, 'hands-off release stays clear of the station cylinder for five seconds');
  const flight = ordinaryFlight(ctx, systems, 60);
  assert.deepEqual(flight.events, [], 'sunward-berth ordinary flight takes no solar damage: ' + JSON.stringify(flight.events));
  assert.equal(flight.destroyed, false, 'sunward-berth ordinary flight survives');
  ok('sunward berth releases sun-clear, outward, and hands-off station-safe');
}

// ---------------------------------------------------------------------------
// 4. An ordinary boot load still restores the exact saved heading. The respawn
// guard must never leak into the saved-pose contract.
// ---------------------------------------------------------------------------
{
  const savedPose = {
    position: [1900, 400, 2500],
    quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0.7, -0.3)).toArray(),
  };
  dom = installDomStubs();
  const snapshot = {
    v: 1,
    savedAt: 1,
    berth: true,
    berthSavedAt: 1,
    world: { time: 1, currentSystem: 'freehold' },
    ship: savedPose,
    cargo: [],
  };
  localStorage.setItem(KEY, JSON.stringify(snapshot));
  const { ctx } = await bootGameSystems();
  assert.equal(ctx.flags.saveRestored, true, 'the boot restore ran');
  assert.deepEqual(ctx.ship.object.position.toArray(), savedPose.position, 'boot load preserves the saved position');
  assert.deepEqual(ctx.ship.object.quaternion.toArray(), savedPose.quaternion, 'boot load preserves the saved heading');
  ok('boot load preserves the exact saved heading (respawn guard stays out of the load path)');
}

console.log('ISSUE-307 RESPAWN HEADING PASS — ' + pass + ' checks');
