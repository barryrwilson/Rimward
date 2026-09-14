import assert from 'node:assert/strict';
import * as THREE from 'three';
import { initAutopilot, tryApproachDock } from '../src/game/autopilot.js';
import { hoverTurnRateFor } from '../src/game/flight-feel.js';
import { collectBodies } from '../src/game/collision.js';
import { sphereChordHit } from '../src/game/ap-path.js';
import { PHY } from '../src/game/physics.js';
import { collectDockCruiseBodies, dockCruiseShouldBrake } from '../src/game/dock-cruise.js';

// Controlled geometry complements the untouched-traffic boot acceptance.
// Ship motion follows the normal hover turn / acceleration / drag equations;
// relative swept spheres detect impacts even when a crossing happens between
// samples. Every case must make progress, so stopping forever cannot pass.
function scenario(kind, crossing, yaw = 0) {
  const station = new THREE.Vector3(0, 0, -2000);
  const start = new THREE.Vector3(0, 0, 1000);
  const forward = new THREE.Vector3(135, 0, -3000).normalize();
  const velocity = crossing ? new THREE.Vector3(-60, 0, 0) : new THREE.Vector3();
  const obstacle = start.clone().addScaledVector(forward, 480).addScaledVector(velocity, -4);
  let radius = 20;
  const body = kind === 'asteroid' ? { id: 0, position: obstacle, radius }
    : { id: 'crossing', object: { position: obstacle }, state: { classKey: 'freighter' }, ai: { velocity } };
  const ctx = {
    flags: { docked: false, paused: false, berthHold: false, matchSpeed: false },
    world: { currentSystem: 'fixture', time: 0, nav: { autopilot: false } },
    systems: { fixture: { station: { position: station.toArray() }, gates: [], sunRadius: 0 } },
    station: { name: 'Fixture', position: station, inZone: false },
    ship: { object: { position: start.clone(), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), forward) },
      velocity: forward.clone().multiplyScalar(120), speed: 120 },
    player: { classKey: 'light' },
    input: {}, gate: { jumping: false }, automine: { engaged: false }, flee: { engaged: false },
    asteroids: { list: kind === 'asteroid' ? [body] : [] }, ships: kind === 'ship' ? [body] : [],
    config: { ship: { acceleration: 90, creep: 30, maxSpeed: 120 }, world: { sunPosition: new THREE.Vector3(), stationPosition: station } },
    events: [], lastEvents: [], emit(type, data = {}) { this.events.push({ type, ...data }); },
  };
  const helm = initAutopilot(ctx);
  ctx.ship.object.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw));
  const actualBodies = { items: [], count: 0 };
  collectBodies(ctx, actualBodies);
  radius = actualBodies.items.find(item => item.kind === kind).r;
  assert.ok(Number.isFinite(radius) && radius > 0);
  assert.equal(tryApproachDock(ctx), '');
  const dt = 1 / 60, targetVelocity = new THREE.Vector3(), delta = new THREE.Vector3();
  const before = new THREE.Vector3(), relativeBefore = new THREE.Vector3(), relativeAfter = new THREE.Vector3();
  let minClearance = Infinity, brakingFrames = 0;
  for (let frame = 0; frame < 720; frame++) {
    helm.update(dt, ctx);
    assert.equal(ctx.autopilot.engaged, true, JSON.stringify(ctx.autopilot));
    before.copy(ctx.ship.object.position);
    relativeBefore.subVectors(before, obstacle);
    const ap = ctx.autopilot, turn = hoverTurnRateFor('light', ctx.ship.speed) * dt;
    if (ap.pitch) ctx.ship.object.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ap.pitch * turn));
    if (ap.yaw) ctx.ship.object.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -ap.yaw * turn));
    targetVelocity.set(0, 0, -1).applyQuaternion(ctx.ship.object.quaternion).multiplyScalar(ap.idle ? 0 : 30 + ap.throttle * 90);
    delta.subVectors(targetVelocity, ctx.ship.velocity);
    if (delta.length() > 90 * dt) delta.setLength(90 * dt);
    ctx.ship.velocity.add(delta);
    if (ap.throttle < 0.02) ctx.ship.velocity.multiplyScalar(Math.exp(-0.5 * dt));
    ctx.ship.object.position.addScaledVector(ctx.ship.velocity, dt);
    ctx.ship.speed = ctx.ship.velocity.length();
    obstacle.addScaledVector(velocity, dt);
    relativeAfter.subVectors(ctx.ship.object.position, obstacle);
    const hit = sphereChordHit(relativeBefore.x, relativeBefore.y, relativeBefore.z,
      relativeAfter.x, relativeAfter.y, relativeAfter.z, 0, 0, 0, radius + PHY.PLAYER_RADIUS);
    minClearance = Math.min(minClearance, hit.dist - radius - PHY.PLAYER_RADIUS);
    assert.equal(hit.hit, false, `${kind}/${crossing} impact at ${frame / 60}s`);
    if (ap.idle) brakingFrames++;
    ctx.world.time += dt; ctx.lastEvents = ctx.events; ctx.events = [];
  }
  assert.ok(ctx.ship.object.position.distanceTo(start) > 800, 'obstacle avoidance must continue its journey');
  console.log('PASS controlled cruise obstacle', JSON.stringify({ kind, crossing, yaw, minClearance, brakingFrames }));
}

scenario('asteroid', false);
scenario('ship', false);
scenario('ship', true);
scenario('asteroid', false, 0.4);
scenario('ship', true, -0.4);

const bag = { count: 1, items: [{ kind: 'asteroid', id: 0, x: 0, y: 0, z: -90, r: 10 }] };
const out = { count: 0, items: [] };
collectDockCruiseBodies(bag, [], 120, 90, out);
assert.equal(dockCruiseShouldBrake({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -120 }, 90, out), true,
  '90u obstacle requires braking before the old 40u lookahead: stopping distance is 80u plus body/ship clearance');
assert.equal(dockCruiseShouldBrake({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 120 }, 90, out), false,
  'a separating obstacle does not stop escape');
assert.equal(collectDockCruiseBodies(bag, [], 120, NaN, out), null);
assert.equal(dockCruiseShouldBrake({}, {}, 90, out), true);
console.log('PASS cruise braking distance and invalid-input guards');
