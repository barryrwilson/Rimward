/**
 * Diagnose live Auction gate assemblies vs authored hub / AP aim.
 * Run: node --import ./scripts/with-css-stub.mjs out/w90/ap-gate/diagnose.mjs
 */
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { SYSTEMS, JUMP } from '../../../src/game/state.js';
import { PHY } from '../../../src/game/physics.js';
import { plotRoute } from '../../../src/game/nav.js';
import { initGate, lookupLiveNavGate } from '../../../src/systems/gate.js';
import {
  resolveAuthoredNavGate, resolveNavGatePos, readNavGuidance,
} from '../../../src/systems/nav-guidance.js';
import { initAutopilot, tryEngage, disengage } from '../../../src/game/autopilot.js';
import { planApPath, AP_KEEP_PAD, keepRadius, sphereChordHit } from '../../../src/game/ap-path.js';
import { collectBodies } from '../../../src/game/collision.js';
import { appendSunBody } from '../../../src/systems/npc.js';

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

function dumpAssemblies(scene) {
  const rows = [];
  scene.traverse((o) => {
    if (!o || !o.isObject3D) return;
    if (o.name !== 'lamplighter-junction' && !String(o.name || '').endsWith('-gate')) return;
    o.updateWorldMatrix(true, true);
    const wp = new THREE.Vector3();
    o.getWorldPosition(wp);
    const box = new THREE.Box3().setFromObject(o);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    let childNames = [];
    o.children.forEach((c) => childNames.push(c.name || c.type));
    rows.push({
      name: o.name,
      visible: o.visible,
      parent: o.parent && o.parent.name,
      local: [o.position.x, o.position.y, o.position.z],
      world: [wp.x, wp.y, wp.z],
      boxMin: box.isEmpty() ? null : [box.min.x, box.min.y, box.min.z],
      boxMax: box.isEmpty() ? null : [box.max.x, box.max.y, box.max.z],
      size: box.isEmpty() ? null : [size.x, size.y, size.z],
      center: box.isEmpty() ? null : [center.x, center.y, center.z],
      childCount: o.children.length,
      childNames,
    });
  });
  return rows;
}

const ctx = createCtx({
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(70, 1, 0.1, 20000),
  renderer: dummyRenderer(),
});
ctx.systems = SYSTEMS;
ctx.world.currentSystem = 'gc_auction';
ctx.ship.object = new THREE.Object3D();
ctx.ship.object.position.set(225, 205, -169);
ctx.player = { hull: 100, hullMax: 100, classKey: 'light' };
ctx.flags.docked = false;
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.flags.matchSpeed = false;
ctx.gate.jumping = false;
ctx.gate.inZone = false;

const def = SYSTEMS.gc_auction;
console.log('authored.gates', def.gates.map((g) => ({ to: g.to, p: g.position })));
console.log('authored.hub', def.hub);

const gateApi = initGate(ctx);
gateApi.update(0, ctx);
const apApi = initAutopilot(ctx);

const assemblies = dumpAssemblies(ctx.scene);
console.log('scene.assemblies', JSON.stringify(assemblies, null, 2));

const hops = ['bt_cradle', 'veridian', 'gc_lot7', 'gc_provenance', 'gc_appraisal', 'missing_hop'];
for (const hop of hops) {
  const live = lookupLiveNavGate(hop);
  const auth = resolveAuthoredNavGate(ctx, hop);
  const pos = resolveNavGatePos(ctx, hop);
  console.log('resolve', hop, { live, auth, pos });
}

plotRoute(ctx, 'bt_cradle');
console.log('nav.path', ctx.world.nav);
const guide = readNavGuidance(ctx);
console.log('guidance', guide);

const bodies = { count: 0, items: [] };
collectBodies(ctx, bodies);
appendSunBody(ctx, bodies);
const bodyBrief = [];
for (let i = 0; i < bodies.count; i++) {
  const b = bodies.items[i];
  bodyBrief.push({
    kind: b.kind, x: b.x, y: b.y, z: b.z, r: b.r,
    keep: keepRadius(b, PHY.PLAYER_RADIUS, AP_KEEP_PAD),
  });
}
console.log('bodies', bodyBrief);

const hub = def.hub.position;
const planned = planApPath({
  px: 225, py: 205, pz: -169,
  gx: hub[0], gy: hub[1], gz: hub[2],
  hx: 0, hy: 0, hz: -1,
  bodies,
  shipR: PHY.PLAYER_RADIUS,
  classKey: 'light',
  speed: 80,
  zone: JUMP.zone,
});
console.log('plan.screenshot', planned);
const chord = sphereChordHit(225, 205, -169, planned.ax, planned.ay, planned.az, hub[0], hub[1], hub[2], 1);
console.log('aim-vs-hub', {
  aimD: Math.hypot(planned.ax - hub[0], planned.ay - hub[1], planned.az - hub[2]),
  shipToHub: Math.hypot(225 - hub[0], 205 - hub[1], -169 - hub[2]),
  shipToAim: Math.hypot(planned.ax - 225, planned.ay - 205, planned.az + 169),
  chord,
});

const tok = tryEngage(ctx);
apApi.update(0.016, ctx);
console.log('ap.engage', tok, ctx.autopilot);

disengage(ctx, 'cancel');
plotRoute(ctx, 'veridian');
const tokV = tryEngage(ctx);
apApi.update(0.016, ctx);
console.log('ap.veridian', tokV, {
  live: lookupLiveNavGate('veridian'),
  pos: resolveNavGatePos(ctx, 'veridian'),
  guide: readNavGuidance(ctx),
  ap: ctx.autopilot,
});
