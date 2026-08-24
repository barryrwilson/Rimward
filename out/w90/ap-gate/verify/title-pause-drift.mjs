/**
 * Title-pause drift: currentSystem swaps while paused, lastEvents has no
 * systemLoaded, and the main loop skips gate.update until unpause.
 * Run: node --import ./scripts/with-css-stub.mjs out/w90/ap-gate/verify/title-pause-drift.mjs
 */
import * as THREE from 'three';
import { createCtx } from '../../../../src/core/ctx.js';
import { SYSTEMS } from '../../../../src/game/state.js';
import { initGate, lookupLiveNavGate } from '../../../../src/systems/gate.js';
import { resolveAuthoredNavGate, resolveNavGatePos } from '../../../../src/systems/nav-guidance.js';

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

function freshCtx(systemId) {
  const ctx = createCtx({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(70, 1, 0.1, 20000),
    renderer: dummyRenderer(),
  });
  ctx.systems = SYSTEMS;
  ctx.world.currentSystem = systemId;
  ctx.ship.object = new THREE.Object3D();
  ctx.player = { hull: 100, hullMax: 100, classKey: 'light' };
  ctx.flags.docked = false;
  ctx.flags.paused = false;
  ctx.flags.combat = false;
  ctx.flags.matchSpeed = false;
  ctx.gate.jumping = false;
  ctx.gate.inZone = false;
  ctx.lastEvents = [];
  return ctx;
}

function hubWorld(scene) {
  let found = null;
  scene.traverse((o) => {
    if (found || !o || o.name !== 'lamplighter-junction') return;
    found = { x: o.position.x, y: o.position.y, z: o.position.z, parent: !!o.parent, visible: o.visible };
  });
  return found;
}

function near3(a, b, eps) {
  if (!a || !b) return false;
  const e = Number.isFinite(eps) ? eps : 1e-6;
  return Math.abs(a.x - b.x) <= e && Math.abs(a.y - b.y) <= e && Math.abs(a.z - b.z) <= e;
}

const results = {};
const fails = [];
function pin(name, ok, extra) {
  results[name] = !!ok;
  if (!ok) fails.push(name);
  if (extra) results[name + ':extra'] = extra;
}

const auctionHub = { x: 368, y: 76, z: -747 };
const freeholdGate0 = SYSTEMS.freehold && SYSTEMS.freehold.gates && SYSTEMS.freehold.gates[0]
  ? {
    x: SYSTEMS.freehold.gates[0].position[0],
    y: SYSTEMS.freehold.gates[0].position[1],
    z: SYSTEMS.freehold.gates[0].position[2],
  }
  : null;

{
  const ctx = freshCtx('freehold');
  const gateApi = initGate(ctx);
  gateApi.update(0, ctx);

  pin(
    'pause.start.freeholdLive',
    lookupLiveNavGate('bt_cradle') == null && lookupLiveNavGate('bt_cradle', 'gc_auction') == null,
  );
  pin(
    'pause.start.notHubMesh',
    !near3(hubWorld(ctx.scene), auctionHub),
    hubWorld(ctx.scene),
  );

  ctx.flags.paused = true;
  ctx.world.currentSystem = 'gc_auction';
  ctx.lastEvents = [{ type: 'titleNoise' }];

  pin(
    'pause.events.noSystemLoaded',
    !ctx.lastEvents.some((e) => e && e.type === 'systemLoaded'),
  );
  pin(
    'pause.noUpdate.expectSystemNull',
    lookupLiveNavGate('bt_cradle', 'gc_auction') == null,
  );
  pin(
    'pause.noUpdate.resolveNavNull',
    resolveNavGatePos(ctx, 'bt_cradle') == null,
    resolveNavGatePos(ctx, 'bt_cradle'),
  );
  pin(
    'pause.authoredGhostStillHub',
    near3(resolveAuthoredNavGate(ctx, 'bt_cradle'), auctionHub),
    resolveAuthoredNavGate(ctx, 'bt_cradle'),
  );
  pin(
    'pause.noUpdate.notFreeholdCoord',
    !near3(lookupLiveNavGate('bt_cradle'), freeholdGate0),
  );

  ctx.flags.paused = false;
  ctx.lastEvents = [];
  gateApi.update(0, ctx);

  const live = lookupLiveNavGate('bt_cradle', 'gc_auction');
  const pos = resolveNavGatePos(ctx, 'bt_cradle');
  const hubMesh = hubWorld(ctx.scene);
  pin(
    'pause.unpause.liveHubOrigin',
    near3(live, auctionHub) && near3(pos, auctionHub) && near3(hubMesh, auctionHub),
    { live, pos, hubMesh },
  );
  pin(
    'pause.unpause.notNull',
    live != null && pos != null,
  );
  pin(
    'pause.unpause.notFreeholdCoord',
    !near3(live, freeholdGate0),
    { live, freeholdGate0 },
  );
}

console.log(JSON.stringify(results, null, 2));
if (fails.length) {
  console.log('W90 TITLE-PAUSE DRIFT FAIL', fails.join(','));
  process.exit(1);
}
console.log('W90 TITLE-PAUSE DRIFT PASS');
