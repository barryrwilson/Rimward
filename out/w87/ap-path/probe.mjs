// Headless AP pathing probe. No browser.
// node --import ./scripts/with-css-stub.mjs out/w87/ap-path/probe.mjs
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { SYSTEMS, JUMP } from '../../../src/game/state.js';
import { plotRoute, sanitizeNav, canTransit } from '../../../src/game/nav.js';
import { initGate, lookupLiveNavGate } from '../../../src/systems/gate.js';
import {
  resolveAuthoredNavGate, resolveNavGatePos, readNavGuidance,
} from '../../../src/systems/nav-guidance.js';
import { initAutopilot, tryEngage } from '../../../src/game/autopilot.js';
import { initJump } from '../../../src/game/jump.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

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
if (!globalThis.HTMLCanvasElement) globalThis.HTMLCanvasElement = function HTMLCanvasElement() {};

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
  ctx.lastEvents = [];
  return ctx;
}

function drain(ctx) {
  ctx.lastEvents = ctx.events;
  ctx.events = [];
}

const results = {};
const fails = [];
function pin(name, ok) {
  results[name] = !!ok;
  if (!ok) fails.push(name);
}

pin('canTransit.veridian', canTransit('freehold', 'veridian') === true);
pin('canTransit.hubHearth', canTransit('freehold', 'fh_hearth') === true);
pin('canTransit.noPhantomVdSurvey', canTransit('freehold', 'vd_survey') === false);
pin('canTransit.hearthBack', canTransit('fh_hearth', 'freehold') === true);
pin('canTransit.hearthNoReverseHubOnly', canTransit('fh_hearth', 'veridian') === false);

{
  const ctx = freshCtx();
  plotRoute(ctx, 'veridian');
  const p = ctx.world.nav && ctx.world.nav.path;
  pin(
    'bfs.veridian.localGate',
    !!p && p[0] === 'freehold' && p[1] === 'veridian' && p[p.length - 1] === 'veridian',
  );
}

{
  const ctx = freshCtx();
  plotRoute(ctx, 'fh_hearth');
  const p = ctx.world.nav && ctx.world.nav.path;
  pin(
    'bfs.hearth.hubRoute',
    !!p && p[0] === 'freehold' && p[1] === 'fh_hearth' && canTransit('freehold', p[1]),
  );
}

{
  const ctx = freshCtx();
  plotRoute(ctx, 'vd_survey');
  const p = ctx.world.nav && ctx.world.nav.path;
  pin(
    'bfs.vdSurvey.viaVeridian',
    !!p && p[1] === 'veridian' && p[p.length - 1] === 'vd_survey' && canTransit('freehold', p[1]),
  );
}

{
  const ctx = freshCtx();
  ctx.world.nav = {
    dest: 'vd_survey',
    path: ['freehold', 'vd_survey'],
    remaining: 1,
    status: 'plotted',
    autopilot: true,
  };
  sanitizeNav(ctx);
  const p = ctx.world.nav && ctx.world.nav.path;
  pin(
    'sanitize.healPhantomHop',
    !!ctx.world.nav
    && ctx.world.nav.autopilot === false
    && Array.isArray(p)
    && p[1] === 'veridian'
    && p[p.length - 1] === 'vd_survey',
  );
}

const authoredV = resolveAuthoredNavGate({ world: { currentSystem: 'freehold' } }, 'veridian');
const authoredH = resolveAuthoredNavGate({ world: { currentSystem: 'freehold' } }, 'fh_hearth');
pin(
  'authored.veridian',
  !!authoredV && authoredV.x === 0 && authoredV.y === 60 && authoredV.z === -900,
);
pin(
  'authored.hub',
  !!authoredH && authoredH.x === 120 && authoredH.y === 70 && authoredH.z === -820,
);

const ctx = freshCtx();
const gateApi = initGate(ctx);
const apApi = initAutopilot(ctx);
const jumpApi = initJump(ctx);
gateApi.update(0, ctx);
drain(ctx);

const liveV = lookupLiveNavGate('veridian');
const liveH = lookupLiveNavGate('fh_hearth');
const livePhantom = lookupLiveNavGate('vd_survey');
pin(
  'live.veridian.matchesAuthored',
  !!liveV && liveV.x === authoredV.x && liveV.y === authoredV.y && liveV.z === authoredV.z,
);
pin(
  'live.hub.matchesAuthored',
  !!liveH && liveH.x === authoredH.x && liveH.y === authoredH.y && liveH.z === authoredH.z,
);
pin('live.noPhantomVdSurvey', livePhantom == null);

const viaLive = resolveNavGatePos(ctx, 'veridian');
pin(
  'resolveNavGatePos.live',
  !!viaLive && viaLive.x === liveV.x && viaLive.y === liveV.y && viaLive.z === liveV.z,
);

plotRoute(ctx, 'veridian');
const guide = readNavGuidance(ctx);
pin(
  'guidance.pos.liveVeridian',
  guide.kind === 'plotted'
  && guide.nextId === 'veridian'
  && !!guide.pos
  && guide.pos.x === liveV.x
  && guide.pos.y === liveV.y
  && guide.pos.z === liveV.z,
);

ctx.ship.object.position.set(liveV.x, liveV.y, liveV.z);
const tok = tryEngage(ctx);
pin('engage.veridian', tok === '' && ctx.world.nav.autopilot === true);

gateApi.update(1 / 60, ctx);
apApi.update(1 / 60, ctx);
jumpApi.update(1 / 60, ctx);
drain(ctx);
gateApi.update(1 / 60, ctx);
apApi.update(1 / 60, ctx);
jumpApi.update(1 / 60, ctx);
const jumpEv = ctx.lastEvents.find((e) => e.type === 'jumpRequested')
  || ctx.events.find((e) => e.type === 'jumpRequested');
pin(
  'zone.jumpRequested.veridian',
  !!jumpEv && jumpEv.to === 'veridian' && ctx.gate.jumping === true,
);

const apSrc = src('src/game/autopilot.js');
const gateSrc = src('src/systems/gate.js');
pin('ap.noJumpEmit', !/emit\s*\(\s*['"]jumpRequested['"]/.test(apSrc));
pin('gate.soleJumpEmit', /emit\s*\(\s*['"]jumpRequested['"]/.test(gateSrc) && /to:\s*near\.to/.test(gateSrc));
pin('gate.cycleStopsOnHop', gateSrc.includes('zoneHub.to !== nextHop'));
pin('ctx.noLiteral', !src('src/core/ctx.js').includes('ctx.autopilot'));
pin('noInner', !apSrc.includes('innerHTML') && !src('src/systems/nav-guidance.js').includes('innerHTML'));

{
  const hubCtx = freshCtx();
  const g = initGate(hubCtx);
  const ap = initAutopilot(hubCtx);
  const jp = initJump(hubCtx);
  g.update(0, hubCtx);
  drain(hubCtx);
  plotRoute(hubCtx, 'fh_haven');
  const hop = hubCtx.world.nav && hubCtx.world.nav.path && hubCtx.world.nav.path[1];
  pin('bfs.haven.hubHop', hop === 'fh_haven');
  const hubPos = lookupLiveNavGate('fh_haven');
  pin('live.haven.isHub', !!hubPos && hubPos.x === 120 && hubPos.y === 70 && hubPos.z === -820);
  hubCtx.ship.object.position.set(hubPos.x, hubPos.y, hubPos.z);
  const hubTok = tryEngage(hubCtx);
  pin('engage.haven', hubTok === '');
  let sawHop = false;
  let jumped = null;
  for (let i = 0; i < 8; i++) {
    g.update(1 / 60, hubCtx);
    if (hubCtx.gate.nearTo === hop) sawHop = true;
    ap.update(1 / 60, hubCtx);
    jp.update(1 / 60, hubCtx);
    drain(hubCtx);
    const ev = hubCtx.lastEvents.find((e) => e.type === 'jumpRequested');
    if (ev) {
      jumped = ev.to;
      break;
    }
  }
  pin('hub.cycleHitsHop', sawHop === true);
  pin('hub.jumpRequested.haven', jumped === 'fh_haven' && hubCtx.gate.jumping === true);
  pin('hub.noSpinDisengage', hubCtx.world.nav && hubCtx.world.nav.autopilot === true);
}

console.log(JSON.stringify(results, null, 2));
if (fails.length) {
  console.log('AP PATH PROBE FAIL', fails.join(','));
  process.exit(1);
}
console.log('AP PATH PROBE PASS');
