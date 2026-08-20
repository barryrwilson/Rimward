// Extra verifier edges (not the worker probe). Restore-past-deadline, expire while docked.
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { SYSTEMS, createShipState } from '../../../src/game/state.js';
import { initStation, holdUnits } from '../../../src/systems/station.js';
import { restore, snapshot } from '../../../src/game/save.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

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
    tagName: String(tag).toUpperCase(),
    children: [],
    parent: null,
    _listeners: {},
    _attrs: {},
    style: { setProperty(k, v) { this[k] = v; } },
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); },
      contains(c) { return this._s.has(c); },
    },
    dataset: {},
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn); },
    removeEventListener(type, fn) {
      const a = this._listeners[type];
      if (!a) return;
      const i = a.indexOf(fn);
      if (i >= 0) a.splice(i, 1);
    },
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return Object.hasOwn(this._attrs, k) ? this._attrs[k] : null; },
    click() {
      for (const fn of this._listeners.click ?? []) fn({ type: 'click', target: this });
    },
    getBoundingClientRect() {
      return { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 };
    },
    focus() {},
  };
  let className = '';
  Object.defineProperty(el, 'className', {
    get() { return className; },
    set(v) { className = String(v); },
  });
  let text = '';
  Object.defineProperty(el, 'textContent', {
    get() { return text; },
    set(v) {
      text = String(v);
      if (v === '') el.children.length = 0;
    },
  });
  Object.defineProperty(el, 'firstElementChild', {
    get() { return el.children[0] ?? null; },
  });
  el.scrollTop = 0;
  return el;
}

const winListeners = {};
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  body: makeEl('body'),
  getElementById: () => makeEl(),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  hidden: false,
};
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener(type, fn) { (winListeners[type] ??= []).push(fn); },
  removeEventListener(type, fn) {
    const a = winListeners[type];
    if (!a) return;
    const i = a.indexOf(fn);
    if (i >= 0) a.splice(i, 1);
  },
  dispatchEvent() {},
};
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const dt = 1 / 60;
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.elapsed += dt;
    ctx.world.time += dt;
    station.update(dt);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const renderer = {
  domElement: makeEl('canvas'),
  setSize() {},
  setPixelRatio() {},
  setAnimationLoop() {},
  render() {},
};
const ctx = createCtx({ scene, camera, renderer });
const comms = [];
const _emit = ctx.emit.bind(ctx);
ctx.emit = (type, payload) => {
  if (type === 'commLine') comms.push(payload?.text ?? '');
  return _emit(type, payload);
};
ctx.systems = SYSTEMS;
ctx.world.currentSystem = 'freehold';
ctx.player = createShipState('light', { name: 'Wave71Pr3Edge' });
ctx.ship.object = new THREE.Object3D();
ctx.world.contacts = [];
ctx.world.records = [];
ctx.world.aftermath = [];
ctx.world.incidents = [];
ctx.world.prices = {};
ctx.cargoCapacity = 20;
ctx.cargo = [];

const station = initStation(ctx);

function dispatchKey(code) {
  for (const fn of winListeners.keydown ?? []) fn({ code, repeat: false, preventDefault() {} });
}

function parkAt(sysId) {
  const st = SYSTEMS[sysId].station.position;
  ctx.ship.object.position.set(st[0] + 36, st[1], st[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
}

function dockHere() {
  parkAt(ctx.world.currentSystem);
  ctx.input.dockPressed = true;
  tick(1);
  ctx.input.dockPressed = false;
  tick(2);
  dispatchKey('Digit2');
  tick(1);
}

function miningLive(sysId) {
  return ctx.world.jobs.filter((j) => j.kind === 'mining' && j.originSystem === sysId
    && (j.state === 'offered' || j.state === 'accepted'));
}

dockHere();
tick(1);
const offered = miningLive('freehold')[0];
pin('edge.docked', ctx.flags.docked === true);
pin('edge.offered', offered?.state === 'offered');
const dockSlot = offered.slot;
const dockObj = offered;
const credits0 = ctx.world.credits;
const rep0 = ctx.world.reputation.freehold ?? 0;
ctx.cargo.push({ commodity: offered.commodity, units: 4 });
const cargo0 = holdUnits(ctx, offered.commodity);
offered.deadline = ctx.world.time - 1;
comms.length = 0;
tick(40);
const replDock = miningLive('freehold').find((j) => j.slot === dockSlot);
pin('edge.expireDocked.gone', !ctx.world.jobs.includes(dockObj));
pin('edge.expireDocked.noPay', ctx.world.credits === credits0);
pin('edge.expireDocked.noRep', (ctx.world.reputation.freehold ?? 0) === rep0);
pin('edge.expireDocked.cargoKept', holdUnits(ctx, offered.commodity) === cargo0);
pin('edge.expireDocked.replace', replDock?.state === 'offered' && replDock !== dockObj && replDock.slot === dockSlot);
pin('edge.expireDocked.comm', comms.some((t) => t.includes('posting withdrawn')));
pin('edge.expireDocked.noDone', ctx.world.jobs.every((j) => j.kind !== 'mining' || (j.state !== 'done' && j.state !== 'failed')));

// Past deadline on restore: snapshot, poke deadline, restore, next tick expires fail-closed.
const liveAcc = miningLive('freehold').find((j) => j.state === 'offered');
liveAcc.state = 'accepted';
liveAcc.payQuoted = 1000;
liveAcc.deadline = 0;
const accId = liveAcc.id;
const accSlot = liveAcc.slot;
const snap = snapshot(ctx);
snap.world.time = ctx.world.time;
const miningSnap = (snap.world.jobs || []).find((j) => j.id === accId);
pin('edge.snap.keepsPastDeadline', miningSnap?.deadline === liveAcc.deadline && miningSnap?.state === 'accepted');

restore(ctx, snap);
const restored = ctx.world.jobs.find((j) => j.id === accId);
pin('edge.restore.kept', !!restored && restored.state === 'accepted' && restored.deadline < ctx.world.time);
const creditsR = ctx.world.credits;
const cargoR = ctx.cargo.map((c) => ({ ...c }));
const repR = ctx.world.reputation.freehold ?? 0;
comms.length = 0;
tick(40);
const afterR = ctx.world.jobs.find((j) => j.id === accId);
const replR = miningLive('freehold').find((j) => j.slot === accSlot);
pin('edge.restore.expiredGone', !afterR);
pin('edge.restore.noPay', ctx.world.credits === creditsR);
pin('edge.restore.noRep', (ctx.world.reputation.freehold ?? 0) === repR);
pin('edge.restore.cargoUnchanged', JSON.stringify(ctx.cargo) === JSON.stringify(cargoR));
pin('edge.restore.replace', replR?.state === 'offered' && replR?.id !== accId && replR !== restored);
pin('edge.restore.comm', comms.some((t) => t.includes('contract lapsed')));

if (fails.length) {
  console.log(`FAIL ${fails.length} ${fails.join('; ')}`);
  process.exit(1);
}
console.log('OK');
