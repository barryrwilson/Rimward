// Extra AP-path pins (MATCH refuse, no teleport, cancel keeps route).
import * as THREE from 'three';
import { createCtx } from '../../../../src/core/ctx.js';
import { SYSTEMS } from '../../../../src/game/state.js';
import { plotRoute } from '../../../../src/game/nav.js';
import { initGate, lookupLiveNavGate } from '../../../../src/systems/gate.js';
import { initAutopilot, tryEngage, disengage, apRefuseToken } from '../../../../src/game/autopilot.js';

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
    style: {},
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    dataset: {},
    _attrs: {},
    _listeners: {},
    appendChild(c) { this.children.push(c); if (c) c.parent = this; return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn); },
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return Object.hasOwn(this._attrs, k) ? this._attrs[k] : null; },
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
  };
  return el;
}

if (!globalThis.document) {
  globalThis.document = {
    createElement: (t) => makeEl(t),
    createElementNS: (_, t) => makeEl(t),
    body: makeEl('body'),
    getElementById: () => makeEl(),
    hidden: false,
  };
}
if (!globalThis.window) {
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 720,
    addEventListener() {},
    removeEventListener() {},
  };
}

function dummyRenderer() {
  return {
    domElement: makeEl('canvas'),
    setSize() {},
    setPixelRatio() {},
    setAnimationLoop() {},
    render() {},
  };
}

function freshCtx() {
  const ctx = createCtx({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(70, 1, 0.1, 20000),
    renderer: dummyRenderer(),
  });
  ctx.systems = SYSTEMS;
  ctx.world.currentSystem = 'freehold';
  ctx.ship.object = new THREE.Object3D();
  ctx.player = { hull: 100, hullMax: 100 };
  ctx.flags.docked = false;
  ctx.flags.paused = false;
  ctx.flags.combat = false;
  ctx.flags.matchSpeed = false;
  return ctx;
}

const results = {};
const fails = [];
function pin(name, ok) {
  results[name] = !!ok;
  if (!ok) fails.push(name);
}

{
  const ctx = freshCtx();
  initGate(ctx);
  initAutopilot(ctx);
  plotRoute(ctx, 'veridian');
  ctx.flags.matchSpeed = true;
  pin('match.token', apRefuseToken(ctx) === 'match');
  pin('match.engage', tryEngage(ctx) === 'match');
  pin('match.noFly', ctx.world.nav.autopilot === false);
}

{
  const ctx = freshCtx();
  initGate(ctx);
  initAutopilot(ctx);
  plotRoute(ctx, 'veridian');
  ctx.ship.object.position.set(11, 22, 33);
  const tok = tryEngage(ctx);
  const p = ctx.ship.object.position;
  pin('engage.ok', tok === '' && ctx.world.nav.autopilot === true);
  pin('engage.noTeleport', p.x === 11 && p.y === 22 && p.z === 33);
  const path = ctx.world.nav.path.slice();
  const dest = ctx.world.nav.dest;
  disengage(ctx, 'cancel');
  pin(
    'cancel.keepsRoute',
    ctx.world.nav.autopilot === false
    && ctx.world.nav.dest === dest
    && Array.isArray(ctx.world.nav.path)
    && ctx.world.nav.path.join(',') === path.join(','),
  );
}

{
  const ctx = freshCtx();
  initGate(ctx);
  const liveH = lookupLiveNavGate('fh_hearth');
  pin(
    'hearth.liveHubJunction',
    !!liveH && liveH.x === 120 && liveH.y === 70 && liveH.z === -820,
  );
}

console.log(JSON.stringify(results, null, 2));
if (fails.length) {
  console.log('EXTRA PINS FAIL', fails.join(','));
  process.exit(1);
}
console.log('EXTRA PINS PASS');
