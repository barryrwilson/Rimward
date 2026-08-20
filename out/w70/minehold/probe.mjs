// Wave 70 — MATCH on a locked rock (no full boot).
// node --import ./scripts/with-css-stub.mjs out/w70/minehold/probe.mjs
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
        if (prop in target) return target[prop];
        return typeof prop === 'string' ? function () {} : undefined;
      },
      set() { return true; },
    },
  );
}

function makeEl(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    style: {},
    width: 8,
    height: 8,
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
  };
  return el;
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

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const shipSrc = readFileSync(join(root, 'src/systems/ship.js'), 'utf8');
const bootSrc = readFileSync(join(root, 'scripts/boot-test.mjs'), 'utf8');
const hudSrc = readFileSync(join(root, 'src/systems/hud.js'), 'utf8');

const matchBlock = shipSrc.slice(
  shipSrc.indexOf('Match-speed: ship.js owns flags.matchSpeed'),
  shipSrc.indexOf('// --- Afterburner state machine'),
);
const velBlock = shipSrc.slice(
  shipSrc.indexOf('const rockMatch = ctx.flags.matchSpeed'),
  shipSrc.indexOf('// --- Integrate position'),
);
const turnBlock = shipSrc.slice(
  shipSrc.indexOf('Locked hull in front but off the nose'),
  shipSrc.indexOf('const rs = turn * dt'),
);

pin('src.rockLockTest', matchBlock.includes('lock.position && !lock.object && !lock.state'));
pin('src.noThrottleWrite', !/input\.throttle\s*=/.test(matchBlock + velBlock));
pin('src.lockVel', velBlock.includes('_lockVel') && velBlock.includes('rockMatch'));
pin('src.shipScalar', velBlock.includes('liveLock') && velBlock.includes('lockSpeed'));
pin('src.turnShipsOnly', turnBlock.includes('if (liveLock)') && turnBlock.includes('turn *= 1.22'));
pin('src.nanFailClosed', matchBlock.includes('lockPosOk') && matchBlock.includes('matchLive'));
pin('boot.wave70', bootSrc.includes("console.log('wave70 minehold:'"));
pin('boot.failTag', bootSrc.includes('WAVE70 MINEHOLD FAIL'));
pin('hud.lampReadsFlag', hudSrc.includes('ctx.flags.matchSpeed'));

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
ctx.ship.velocity.set(0, 0, 0);

ctx.targets.current = null;
ctx.flags.matchSpeed = false;
step(1, { match: true });
pin('arm.noLock', ctx.flags.matchSpeed === false);

const rock = {
  position: ctx.ship.object.position.clone().add(new THREE.Vector3(80, 0, -40)),
  radius: 6,
};
ctx.targets.current = rock;
const thr0 = ctx.input.throttle;
step(1, { match: true });
pin('arm.rock', ctx.flags.matchSpeed === true);
pin('arm.noThrottleWrite', ctx.input.throttle === thr0);

step(1, { throttleHeld: true });
pin('cancel.throttleHeld', ctx.flags.matchSpeed === false);
ctx.input.throttleHeld = false;

step(1, { match: true });
pin('arm.rockAgain', ctx.flags.matchSpeed === true);
rock.position.x = Number.NaN;
step(1);
pin('cancel.nan', ctx.flags.matchSpeed === false);
rock.position.x = ctx.ship.object.position.x + 80;

ctx.flags.docked = true;
step(1, { match: true });
pin('arm.dockedBlocked', ctx.flags.matchSpeed === false);
ctx.flags.docked = false;
ctx.gate.jumping = true;
step(1, { match: true });
pin('arm.jumpBlocked', ctx.flags.matchSpeed === false);
ctx.gate.jumping = false;

ctx.ship.velocity.set(0, 0, 0);
ctx.ship.object.quaternion.identity();
ctx.input.throttle = 0;
ctx.input.fullStop = false;
step(1, { match: true });
pin('hold.armed', ctx.flags.matchSpeed === true);
const vx = 48;
for (let i = 0; i < 90; i++) {
  rock.position.x += vx * dt;
  step(1);
}
const sv = ctx.ship.velocity;
pin('hold.matchOn', ctx.flags.matchSpeed === true);
pin('hold.sidewaysX', sv.x > 20, `vx=${sv.x.toFixed(2)}`);
pin('hold.notNoseCopy', Math.abs(sv.z) < Math.abs(sv.x), `v=${sv.x.toFixed(2)},${sv.z.toFixed(2)}`);
pin('hold.nearRockVx', Math.abs(sv.x - vx) < 12, `vx=${sv.x.toFixed(2)} want ${vx}`);
const rockHold = { x: sv.x, y: sv.y, z: sv.z };

ctx.flags.matchSpeed = false;
ctx.targets.current = {
  object: { position: ctx.ship.object.position.clone().add(new THREE.Vector3(60, 0, -30)) },
  state: { destroyed: false },
};
ctx.ship.velocity.set(0, 0, 0);
ctx.ship.object.quaternion.identity();
step(2, { match: true });
pin('ship.arm', ctx.flags.matchSpeed === true);
const lockPos = ctx.targets.current.object.position;
for (let i = 0; i < 90; i++) {
  lockPos.x += vx * dt;
  step(1);
}
const svs = ctx.ship.velocity;
pin('ship.matchOn', ctx.flags.matchSpeed === true);
pin('ship.alongNose', svs.z < -20 && Math.abs(svs.x) < Math.abs(svs.z),
  `v=${svs.x.toFixed(2)},${svs.z.toFixed(2)}`);

if (fails.length) {
  console.error('FAIL', fails.join('\n'));
  process.exit(1);
}
console.log('PASS', 'w70 minehold', `rockV=${rockHold.x.toFixed(1)},${rockHold.z.toFixed(1)} shipV=${svs.x.toFixed(1)},${svs.z.toFixed(1)}`);
process.exit(0);
