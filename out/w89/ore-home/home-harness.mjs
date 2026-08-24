import * as THREE from 'three';
import { spawnPod, initPods } from '../../../src/game/pods.js';
import { U } from '../../../src/game/state.js';

const scene = { add() {}, remove() {} };
const shipObj = { position: new THREE.Vector3(0, 0, 0) };
const ctx = {
  scene,
  ship: { object: shipObj, velocity: new THREE.Vector3(40, 0, 0) },
  flags: { docked: false },
  world: { time: 0 },
  cargo: [],
  cargoCapacity: 50,
  pods: [],
  events: [],
  emit(type, data = {}) { this.events.push({ type, ...data }); },
};

const sys = initPods(ctx);

// Ride with a moving hull, then close the gap. After 3s at 32 u/s from 70u,
// the pod must sit on the ship, not lag behind on -X.
const start = new THREE.Vector3(0, 0, 70);
const pod = spawnPod(ctx, [{ commodity: 'rawOre', units: 1 }], start, new THREE.Vector3(0, 0, 0));
pod.home = true;

const dt = 1 / 60;
let t = 0;
while (t < 3) {
  shipObj.position.x += 40 * dt;
  ctx.world.time += dt;
  sys.update(dt);
  t += dt;
  if (!ctx.pods.includes(pod)) break;
}

const collected = ctx.events.some((e) => e.type === 'podCollected');
const left = ctx.pods[0];
const dist = left
  ? left.mesh.position.distanceTo(shipObj.position)
  : 0;
const shipX = shipObj.position.x;
const lagged = left && left.mesh.position.x < shipX - 20;

const ok = collected || (dist < U.SCOOP_RANGE && !lagged);
console.log(JSON.stringify({
  ok, collected, dist, shipX,
  podX: left ? left.mesh.position.x : null,
  lagged,
}, null, 2));
if (!ok) process.exit(1);
