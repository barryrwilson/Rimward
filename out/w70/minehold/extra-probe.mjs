// Verifier extra pins — lost lock, rest-frame command, no auto-steer.
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { initShip } from '../../../src/systems/ship.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeCtx2d() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {
      canvas: null,
      createRadialGradient: () => gradient,
      createLinearGradient: () => gradient,
      measureText: () => ({ width: 10 }),
    },
    {
      get(target, prop) {
        if (prop in target) return typeof prop === 'string' && !(prop in target)
          ? function () {}
          : target[prop];
        return typeof prop === 'string' ? function () {} : undefined;
      },
      set() { return true; },
    },
  );
}

function makeEl(tag = 'div') {
  return {
    tagName: String(tag).toUpperCase(),
    style: {},
    width: 8,
    height: 8,
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
  };
}

if (!globalThis.document) {
  globalThis.document = {
    createElement: (t) => makeEl(t),
    createElementNS: (_, t) => makeEl(t),
    body: makeEl('body'),
    hidden: false,
  };
}
if (!globalThis.window) {
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    addEventListener() {},
    removeEventListener() {},
  };
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 20000);
const renderer = {
  domElement: { style: {} },
  setSize() {},
  setPixelRatio() {},
  setAnimationLoop() {},
  render() {},
};
const ctx = createCtx({ scene, camera, renderer });
ctx.asteroids = { list: [] };
const shipSys = initShip(ctx);
const dt = 1 / 60;

function step(n, extra = {}) {
  for (let i = 0; i < n; i++) {
    ctx.elapsed += dt;
    ctx.world.time += dt;
    ctx.input.matchSpeedPressed = extra.match === true && i === 0;
    if (extra.throttleHeld != null) ctx.input.throttleHeld = extra.throttleHeld;
    shipSys.update(dt);
    ctx.input.matchSpeedPressed = false;
  }
}

ctx.flags.docked = false;
ctx.gate.jumping = false;
ctx.input.throttle = 0;
ctx.input.fullStop = false;
ctx.input.throttleHeld = false;
ctx.input.strafeX = 0;
ctx.input.strafeY = 0;
ctx.input.steerX = 0;
ctx.input.steerY = 0;
ctx.input.roll = 0;
ctx.ship.velocity.set(0, 0, 0);
ctx.ship.object.quaternion.identity();

const rock = {
  position: ctx.ship.object.position.clone().add(new THREE.Vector3(80, 0, -40)),
  radius: 6,
};
ctx.targets.current = rock;
step(1, { match: true });
pin('arm.rock', ctx.flags.matchSpeed === true);

const q0 = ctx.ship.object.quaternion.clone();
const vx = 48;
for (let i = 0; i < 90; i++) {
  rock.position.x += vx * dt;
  step(1);
}
const q = ctx.ship.object.quaternion;
pin('steer.noAutoYaw', Math.abs(q.x - q0.x) < 1e-6 && Math.abs(q.y - q0.y) < 1e-6
  && Math.abs(q.z - q0.z) < 1e-6 && Math.abs(q.w - q0.w) < 1e-6,
  `q=${q.x},${q.y},${q.z},${q.w}`);
pin('hold.sideways', ctx.ship.velocity.x > 20 && Math.abs(ctx.ship.velocity.z) < Math.abs(ctx.ship.velocity.x));

ctx.targets.current = null;
step(1);
pin('cancel.lostLock', ctx.flags.matchSpeed === false);

ctx.targets.current = rock;
ctx.ship.velocity.set(0, 0, 0);
ctx.ship.object.quaternion.identity();
ctx.input.throttle = 0;
step(1, { match: true });
ctx.gate.jumping = true;
step(1);
pin('cancel.jumpArmed', ctx.flags.matchSpeed === false);
ctx.gate.jumping = false;

step(1, { match: true });
ctx.flags.docked = true;
step(1);
pin('cancel.dockArmed', ctx.flags.matchSpeed === false);
ctx.flags.docked = false;

ctx.input.throttle = 1;
ctx.input.fullStop = false;
ctx.ship.velocity.set(0, 0, 0);
ctx.ship.object.quaternion.identity();
ctx.ship.object.position.set(0, 5000, 0);
rock.position.set(80, 5000, -40);
ctx.flags.matchSpeed = false;
step(2, { match: true });
pin('rest.armed', ctx.flags.matchSpeed === true);
for (let i = 0; i < 120; i++) {
  rock.position.x += vx * dt;
  step(1);
}
const sv = ctx.ship.velocity;
pin('rest.matchOn', ctx.flags.matchSpeed === true);
pin('rest.keepSlideX', sv.x > 20, `vx=${sv.x.toFixed(2)}`);
pin('rest.addNoseZ', sv.z < -40, `vz=${sv.z.toFixed(2)}`);
pin('rest.notShipScalarOnly', Math.abs(sv.x) > 15 && Math.abs(sv.z) > 15,
  `v=${sv.x.toFixed(2)},${sv.z.toFixed(2)}`);

const thr = ctx.input.throttle;
pin('throttle.untouched', thr === 1, `throttle=${thr}`);

if (fails.length) {
  console.error('FAIL extra', fails.join('\n'));
  process.exit(1);
}
console.log('PASS extra', `restV=${sv.x.toFixed(1)},${sv.z.toFixed(1)}`);
process.exit(0);
