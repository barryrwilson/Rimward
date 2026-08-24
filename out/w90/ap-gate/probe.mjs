/**
 * Live jump-zone origin pins (Auction hub vs physical ring).
 * Run: node --import ./scripts/with-css-stub.mjs out/w90/ap-gate/probe.mjs
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
import { initAutopilot, tryEngage, disengage, apRefuseToken } from '../../../src/game/autopilot.js';
import { planApPath } from '../../../src/game/ap-path.js';

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

function physicalWorld(scene, faction, index) {
  const hits = [];
  scene.traverse((o) => {
    if (o && o.name === `${faction}-gate`) hits.push(o);
  });
  const o = hits[index];
  if (!o) return null;
  return { x: o.position.x, y: o.position.y, z: o.position.z };
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
const auctionVeridian = { x: 987, y: 48, z: 394 };

{
  const ctx = freshCtx('gc_auction');
  const gateApi = initGate(ctx);
  const apApi = initAutopilot(ctx);
  gateApi.update(0, ctx);

  const hubMesh = hubWorld(ctx.scene);
  pin('auction.hub.meshAtOrigin', near3(hubMesh, auctionHub) && hubMesh.parent && hubMesh.visible, hubMesh);

  const liveCradle = lookupLiveNavGate('bt_cradle');
  const posCradle = resolveNavGatePos(ctx, 'bt_cradle');
  const authCradle = resolveAuthoredNavGate(ctx, 'bt_cradle');
  pin('auction.cradle.liveEqualsHubMesh', near3(liveCradle, hubMesh) && near3(posCradle, hubMesh), { liveCradle, posCradle, hubMesh });
  pin('auction.cradle.authStillHub', near3(authCradle, auctionHub));

  const liveV = lookupLiveNavGate('veridian');
  const posV = resolveNavGatePos(ctx, 'veridian');
  const ring0 = physicalWorld(ctx.scene, 'gilded', 0);
  pin('auction.veridian.physicalRing', near3(liveV, auctionVeridian) && near3(posV, liveV) && near3(ring0, auctionVeridian), { liveV, posV, ring0 });
  pin('auction.veridian.notHub', !near3(liveV, auctionHub));

  const liveMissing = lookupLiveNavGate('no_such_hop');
  const posMissing = resolveNavGatePos(ctx, 'no_such_hop');
  pin('missing.hop.null', liveMissing == null && posMissing == null);
  pin('reserved.proto.null', lookupLiveNavGate('__proto__') == null && resolveNavGatePos(ctx, 'constructor') == null);

  plotRoute(ctx, 'bt_cradle');
  const guide = readNavGuidance(ctx);
  pin(
    'guidance.cradle.liveHub',
    guide.kind === 'plotted' && guide.nextId === 'bt_cradle' && near3(guide.pos, hubMesh),
    guide,
  );

  ctx.ship.object.position.set(225, 205, -169);
  ctx.ship.object.quaternion.identity();
  ctx.ship.speed = 80;
  const planned = planApPath({
    px: 225, py: 205, pz: -169,
    gx: posCradle.x, gy: posCradle.y, gz: posCradle.z,
    hx: 0, hy: 0, hz: -1,
    bodies: { count: 0, items: [] },
    shipR: PHY.PLAYER_RADIUS,
    classKey: 'light',
    speed: 80,
    zone: JUMP.zone,
  });
  const aimD = Math.hypot(planned.ax - posCradle.x, planned.ay - posCradle.y, planned.az - posCradle.z);
  pin(
    'ap.aim.clearChord.isHubOrigin',
    planned.ok && planned.hold === 'none' && aimD < 1e-6,
    { hold: planned.hold, aimD, distGate: planned.distGate },
  );

  const tok = tryEngage(ctx);
  apApi.update(0.016, ctx);
  pin('ap.engage.cradle', tok === '' && ctx.world.nav.autopilot === true);
  pin('ap.noWantJumpFar', ctx.autopilot.wantJump === false);
  disengage(ctx, 'cancel');

  plotRoute(ctx, 'veridian');
  const tokV = tryEngage(ctx);
  apApi.update(0.016, ctx);
  pin('ap.engage.veridian', tokV === '' && ctx.world.nav.path[1] === 'veridian');
  pin('ap.veridian.aimPhysical', near3(resolveNavGatePos(ctx, 'veridian'), auctionVeridian));
  disengage(ctx, 'cancel');

  ctx.world.nav = {
    dest: 'freehold',
    path: ['gc_auction', 'freehold'],
    remaining: 1,
    status: 'plotted',
    autopilot: false,
  };
  pin('ap.refuse.missingLiveHop', apRefuseToken(ctx) === 'missingHop' && tryEngage(ctx) === 'missingHop');
}

{
  const ctx = freshCtx('freehold');
  const gateApi = initGate(ctx);
  gateApi.update(0, ctx);
  const auth = resolveAuthoredNavGate({ world: { currentSystem: 'gc_auction' } }, 'bt_cradle');
  pin('stale.authGhostExists', near3(auth, auctionHub));
  pin('stale.liveCradleNull', lookupLiveNavGate('bt_cradle') == null);
  ctx.world.currentSystem = 'gc_auction';
  ctx.lastEvents = [];
  pin(
    'stale.resolveNullBeforeRebuild',
    resolveNavGatePos(ctx, 'bt_cradle') == null,
    resolveNavGatePos(ctx, 'bt_cradle'),
  );
  gateApi.update(0, ctx);
  const live = lookupLiveNavGate('bt_cradle');
  const hubMesh = hubWorld(ctx.scene);
  pin('stale.rebuildOnSystemDrift', near3(live, auctionHub) && near3(hubMesh, auctionHub), { live, hubMesh });
  pin('stale.resolveAfterRebuild', near3(resolveNavGatePos(ctx, 'bt_cradle'), hubMesh));
}

{
  const main = freshCtx('freehold');
  const gateApi = initGate(main);
  const apApi = initAutopilot(main);
  const steal = freshCtx('gc_auction');
  initGate(steal);
  main.world.currentSystem = 'freehold';
  main.lastEvents = [{ type: 'systemLoaded', t: 0, to: 'freehold' }];
  gateApi.update(1 / 60, main);
  main.lastEvents = [];
  const liveV = lookupLiveNavGate('veridian');
  const liveH = lookupLiveNavGate('fh_hearth');
  pin(
    'boot.liveMatch',
    !!liveV && liveV.x === 0 && liveV.y === 60 && liveV.z === -900
    && !!liveH && liveH.x === 120 && liveH.y === 70 && liveH.z === -820
    && lookupLiveNavGate('vd_survey') == null,
    { liveV, liveH, survey: lookupLiveNavGate('vd_survey') },
  );
  pin(
    'boot.posUsesLive',
    !!resolveNavGatePos(main, 'veridian') && resolveNavGatePos(main, 'veridian').z === liveV.z,
  );

  let zoneJump = false;
  if (liveV) {
    main.world.nav = undefined;
    plotRoute(main, 'veridian');
    main.ship.object.position.set(liveV.x, liveV.y, liveV.z);
    const ok = tryEngage(main);
    if (ok === '') {
      for (let i = 0; i < 3; i++) {
        gateApi.update(1 / 60, main);
        apApi.update(1 / 60, main);
        const hit = main.events.find((e) => e.type === 'jumpRequested')
          || main.lastEvents.find((e) => e.type === 'jumpRequested');
        main.lastEvents = main.events;
        main.events = [];
        if (hit && hit.to === 'veridian') {
          zoneJump = true;
          break;
        }
      }
    }
    pin('boot.zoneJump', zoneJump === true, { ok, zoneJump, events: main.lastEvents });
    disengage(main, 'cancel');
  } else {
    pin('boot.zoneJump', false);
  }

  main.world.nav = undefined;
  plotRoute(main, 'veridian');
  main.gate.inZone = false;
  main.gate.nearTo = null;
  main.ship.object.position.set(80, 60, -900);
  main.ship.object.quaternion.identity();
  main.ship.speed = 30;
  const tok = tryEngage(main);
  apApi.update(1 / 60, main);
  const ch = main.autopilot;
  pin(
    'boot.noOrbitCmd',
    tok === '' && ch.throttle <= 0.02 && Math.abs(ch.yaw) >= 0.9 && ch.wantJump === false,
    { tok, th: ch.throttle, yaw: ch.yaw, wantJump: ch.wantJump },
  );
  disengage(main, 'cancel');
}

console.log(JSON.stringify(results, null, 2));
if (fails.length) {
  console.log('W90 AP GATE PROBE FAIL', fails.join(','));
  process.exit(1);
}
console.log('W90 AP GATE PROBE PASS');
