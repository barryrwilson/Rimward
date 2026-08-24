/**
 * Flight verifier harness for automine helm + combat beam.
 * Run: node --import ./scripts/with-css-stub.mjs out/w89/flight/helm-combat-harness.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

function makeCtx2d() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {
      canvas: null,
      createRadialGradient: () => gradient,
      createLinearGradient: () => gradient,
      createPattern: () => null,
      measureText: () => ({ width: 10 }),
      getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }),
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, (w || 1) * (h || 1) * 4)) }),
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
    tagName: tag.toUpperCase(),
    children: [],
    parent: null,
    _listeners: {},
    _attrs: {},
    style: { setProperty(k, v) { this[k] = v; } },
    classList: {
      _s: new Set(),
      _commit() { el.className = [...this._s].join(' '); },
      add(...c) { c.forEach((x) => this._s.add(x)); this._commit(); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); this._commit(); },
      toggle(c, f) { (f ?? !this._s.has(c)) ? this._s.add(c) : this._s.delete(c); this._commit(); },
      contains(c) { return this._s.has(c); },
    },
    dataset: {},
    innerHTML: '',
    value: '',
    width: 64,
    height: 64,
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    append(...c) { for (const x of c) if (x && typeof x === 'object') x.parent = el; this.children.push(...c); },
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return Object.hasOwn(this._attrs, k) ? this._attrs[k] : null; },
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
  };
  let className = '';
  Object.defineProperty(el, 'className', {
    get() { return className; },
    set(v) { className = String(v); },
  });
  return el;
}

globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  getElementById: () => makeEl(),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: makeEl('body'),
  addEventListener() {},
  hidden: false,
};
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
};
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { createCtx } = await import('../../../src/core/ctx.js');
const { initShip } = await import('../../../src/systems/ship.js');
const { initCombat } = await import('../../../src/systems/combat.js');
const { initAutomine } = await import('../../../src/game/automine.js');
const { WORLD_FIELDS, snapshot } = await import('../../../src/game/save.js');

const outDir = path.resolve('out/w89/flight');
const results = [];

function record(name, pass, extra) {
  const row = { name, pass: !!pass, extra: extra ?? null };
  results.push(row);
  console.log(`${pass ? 'ok' : 'FAIL'} ${name}${extra ? ` ${JSON.stringify(extra)}` : ''}`);
}

function makeSceneCtx() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const renderer = {
    domElement: { style: {} },
    setSize() {},
    setPixelRatio() {},
    setAnimationLoop() {},
    render() {},
  };
  const ctx = createCtx({ scene, camera, renderer });
  ctx.world.time = 0;
  ctx.world.nav = {
    dest: 'veridian',
    path: ['freehold', 'veridian'],
    remaining: 1,
    status: 'plotted',
    autopilot: false,
  };
  ctx.world.miningLaser = 0;
  ctx.asteroids = { list: [] };
  ctx.targets.current = null;
  ctx.flags.docked = false;
  ctx.flags.paused = false;
  ctx.flags.combat = false;
  ctx.gate.jumping = false;
  ctx.events = [];
  ctx.lastEvents = [];
  ctx.bio = { turnFactor: 1, speedFactor: 1, mood: 'serene', wounds: 0, growth: 0 };
  return ctx;
}

function tickPair(shipSys, dt, ctx) {
  ctx.world.time += dt;
  ctx.elapsed += dt;
  shipSys.update(dt, ctx);
  ctx.lastEvents = ctx.events;
  ctx.events = [];
}

function yawSign(q) {
  const e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
  return e.y;
}

function setupShip(ctx) {
  const shipSys = initShip(ctx);
  const obj = ctx.ship.object;
  obj.position.set(0, 0, 0);
  obj.quaternion.identity();
  ctx.ship.velocity.set(0, 0, 0);
  ctx.input.steerX = 0;
  ctx.input.steerY = 0;
  ctx.input.throttle = 0;
  ctx.input.fullStop = false;
  ctx.input.throttleHeld = false;
  ctx.input.roll = 0;
  ctx.input.strafeX = 0;
  ctx.input.strafeY = 0;
  ctx.input.fireHeld = false;
  ctx.input.weaponGroup = 1;
  ctx.input.matchSpeedPressed = false;
  return { shipSys, obj };
}

{
  const ctx = makeSceneCtx();
  initAutomine(ctx);
  const { shipSys, obj } = setupShip(ctx);
  ctx.input.steerX = 1;
  ctx.automine.engaged = true;
  ctx.automine.yaw = -1;
  ctx.automine.pitch = 0;
  ctx.automine.throttle = 0;
  ctx.world.nav.autopilot = false;
  tickPair(shipSys, 0.05, ctx);
  const yAm = yawSign(obj.quaternion);
  record('helm automine beats input yaw', yAm > 0.001, { yAm, expect: 'am.yaw=-1 → +Y euler' });
}

{
  const ctx = makeSceneCtx();
  initAutomine(ctx);
  const { shipSys, obj } = setupShip(ctx);
  ctx.input.steerX = -1;
  ctx.automine.engaged = true;
  ctx.automine.yaw = -1;
  ctx.automine.pitch = 0;
  ctx.automine.throttle = 0;
  ctx.world.nav.autopilot = true;
  ctx.autopilot.engaged = true;
  ctx.autopilot.yaw = 1;
  ctx.autopilot.pitch = 0;
  ctx.autopilot.throttle = 0;
  tickPair(shipSys, 0.05, ctx);
  const yAp = yawSign(obj.quaternion);
  record('helm AP wins when both on (sign follows AP yaw=+1 → -Y)', yAp < -0.001, { yAp });
}

{
  const ctx = makeSceneCtx();
  initAutomine(ctx);
  const { shipSys, obj } = setupShip(ctx);
  ctx.input.steerX = 1;
  ctx.automine.engaged = true;
  ctx.automine.yaw = -1;
  ctx.world.nav.autopilot = true;
  ctx.autopilot.yaw = 1;
  ctx.autopilot.pitch = 0;
  ctx.autopilot.throttle = 0;
  tickPair(shipSys, 0.05, ctx);
  const y = yawSign(obj.quaternion);
  record('helm AP beats automine opposite yaw', y < -0.001, { y, note: 'AP yaw+1 vs AM yaw-1' });
}

{
  const ctx = makeSceneCtx();
  initAutomine(ctx);
  const { shipSys } = setupShip(ctx);
  ctx.automine.engaged = true;
  ctx.automine.throttle = 0;
  ctx.input.throttle = 1;
  ctx.input.fullStop = false;
  for (let i = 0; i < 90; i++) tickPair(shipSys, 1 / 60, ctx);
  const speedAm = ctx.ship.speed;
  record('low AM throttle suppresses creep', speedAm < 2, { speedAm });
}

{
  const ctx = makeSceneCtx();
  initAutomine(ctx);
  const { shipSys } = setupShip(ctx);
  ctx.automine.engaged = false;
  ctx.input.throttle = 0;
  ctx.input.fullStop = false;
  for (let i = 0; i < 90; i++) tickPair(shipSys, 1 / 60, ctx);
  const speedCreep = ctx.ship.speed;
  record('manual zero throttle still creeps (control)', speedCreep > 20, { speedCreep });
}

{
  const ctx = makeSceneCtx();
  initAutomine(ctx);
  const { shipSys, obj } = setupShip(ctx);
  const rock = {
    id: 7,
    lockKind: 'rock',
    ore: 40,
    hardness: 1,
    radius: 8,
    position: new THREE.Vector3(0, 0, -80),
  };
  ctx.asteroids.list = [rock];
  ctx.targets.current = rock;
  ctx.automine.engaged = true;
  ctx.automine.throttle = 0;
  ctx.automine.yaw = 0;
  ctx.automine.pitch = 0;
  obj.position.set(0, 0, -40);
  for (let i = 0; i < 5; i++) tickPair(shipSys, 1 / 60, ctx);
  const rockVel = 40;
  for (let i = 0; i < 90; i++) {
    rock.position.x += rockVel * (1 / 60);
    tickPair(shipSys, 1 / 60, ctx);
  }
  const vx = ctx.ship.velocity.x;
  record('rock rest-frame hold tracks rock +X vel', vx > 15, { vx, rockVel });
}

{
  const ctx = makeSceneCtx();
  initAutomine(ctx);
  const { shipSys } = setupShip(ctx);
  const rock = {
    id: 8,
    lockKind: 'rock',
    ore: 10,
    hardness: 1,
    radius: 8,
    position: new THREE.Vector3(0, 0, -50),
  };
  ctx.asteroids.list = [rock];
  ctx.targets.current = rock;
  ctx.flags.matchSpeed = true;
  ctx.automine.engaged = true;
  ctx.automine.throttle = 0;
  tickPair(shipSys, 1 / 60, ctx);
  record('MATCH clears when automine on', ctx.flags.matchSpeed === false, {
    matchSpeed: ctx.flags.matchSpeed,
  });
}

{
  const ctx = makeSceneCtx();
  const { obj } = setupShip(ctx);
  const combat = initCombat(ctx);
  const rock = {
    id: 9,
    lockKind: 'rock',
    ore: 40,
    hardness: 1,
    radius: 8,
    position: new THREE.Vector3(0, 0, -40),
  };
  ctx.asteroids.list = [rock];
  ctx.targets.current = rock;
  obj.position.set(0, 0, 0);
  obj.quaternion.identity();
  ctx.input.fireHeld = false;
  ctx.input.weaponGroup = 1;
  ctx.automine.engaged = true;
  ctx.automine.wantMine = true;
  ctx.flags.docked = false;
  combat.update(1 / 60, ctx);
  const beam = ctx.scene.getObjectByName('mine-beam');
  const core = ctx.scene.getObjectByName('mine-beam-core');
  const beams = [];
  ctx.scene.traverse((o) => {
    if (o.name === 'mine-beam') beams.push(o);
  });
  record('amMine beam on without fireHeld', !!(beam && beam.visible), {
    visible: beam && beam.visible,
    group: ctx.input.weaponGroup,
    fireHeld: ctx.input.fireHeld,
  });
  record('still one mine-beam mesh', beams.length === 1, { count: beams.length });
  record('beam core also on', !!(core && core.visible), { visible: core && core.visible });

  // mine-beam is a ribbon quad; mine-beam-core is the nose→contact line.
  const pos = core.geometry.attributes.position.array;
  const dx = pos[3] - pos[0];
  const dy = pos[4] - pos[1];
  const dz = pos[5] - pos[2];
  const len = Math.hypot(dx, dy, dz) || 1;
  const nz = dz / len;
  record('updateMining aims nose→rock (mostly -Z)', nz < -0.85, { dx, dy, dz, nz, len });

  // Off-axis rock: reticle/camera forward would stay -Z; automine must yaw the beam.
  rock.position.set(40, 0, 0);
  combat.update(1 / 60, ctx);
  const pos2 = core.geometry.attributes.position.array;
  const dx2 = pos2[3] - pos2[0];
  const dz2 = pos2[5] - pos2[2];
  const len2 = Math.hypot(dx2, pos2[4] - pos2[1], dz2) || 1;
  record('updateMining aims at off-axis rock (+X)', dx2 / len2 > 0.85, { dx2, dz2, nx: dx2 / len2 });

  ctx.automine.wantMine = false;
  combat.update(1 / 60, ctx);
  record('beam off when wantMine false and no LMB', beam.visible === false, {
    visible: beam.visible,
  });
}

{
  const ctx = makeSceneCtx();
  setupShip(ctx);
  const combat = initCombat(ctx);
  ctx.input.fireHeld = true;
  ctx.input.weaponGroup = 1;
  ctx.automine.engaged = false;
  ctx.automine.wantMine = false;
  combat.update(1 / 60, ctx);
  const beam = ctx.scene.getObjectByName('mine-beam');
  record('cannon group + LMB does not mine', beam.visible === false, { visible: beam.visible });
}

{
  const listed = WORLD_FIELDS.includes('automine');
  record('WORLD_FIELDS omits automine', listed === false, { listed });
  const ctx = makeSceneCtx();
  ctx.automine.engaged = true;
  ctx.automine.wantMine = true;
  ctx.player = { hull: 100, hullMax: 100, hullKind: 'living' };
  ctx.ship.object = new THREE.Object3D();
  const snap = snapshot(ctx);
  const snapStr = JSON.stringify(snap);
  const hasAm = /automine/i.test(snapStr) || Object.prototype.hasOwnProperty.call(snap, 'automine');
  record('snapshot JSON omits automine', hasAm === false, {
    keys: Object.keys(snap),
    worldKeys: Object.keys(snap.world || {}),
  });
}

const failed = results.filter((r) => !r.pass);
const summary = {
  total: results.length,
  failed: failed.length,
  results,
};
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'helm-combat-harness.json'), JSON.stringify(summary, null, 2));
console.log(`HARNESS ${failed.length ? 'FAIL' : 'PASS'} ${results.length - failed.length}/${results.length}`);
if (failed.length) process.exitCode = 1;
