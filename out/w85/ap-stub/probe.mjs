import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { initAutopilot } from '../../../src/game/autopilot.js';
import { WORLD_FIELDS } from '../../../src/game/save.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const ALLOW = Object.freeze([
  'engaged', 'yaw', 'pitch', 'throttle', 'wantJump', 'cycleHub', 'reason',
]);

const results = {};

function keysOk(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const names = Object.keys(obj);
  if (names.length !== ALLOW.length) return false;
  for (let i = 0; i < ALLOW.length; i++) {
    if (!Object.hasOwn(obj, ALLOW[i])) return false;
  }
  return true;
}

function dummyRenderer() {
  return {
    domElement: { style: {} },
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
  ctx.input.throttle = 0.4;
  ctx.targets.current = { id: 'sentinel-lock' };
  ctx.ship.object = { position: { x: 11, y: 22, z: 33 } };
  ctx.world.currentSystem = 'freehold';
  return ctx;
}

const ctxSrc = src('src/core/ctx.js');
const apSrc = src('src/game/autopilot.js');
const mainSrc = src('src/main.js');
const saveSrc = src('src/game/save.js');
const stateSrc = src('src/game/state.js');

results.channelDefaults = (() => {
  const ctx = freshCtx();
  const ap = ctx.autopilot;
  return keysOk(ap)
    && ap.engaged === false
    && ap.yaw === 0
    && ap.pitch === 0
    && ap.throttle === 0
    && ap.wantJump === false
    && ap.cycleHub === false
    && ap.reason === '';
})();

results.stubIdleZeros = (() => {
  const ctx = freshCtx();
  ctx.world.nav = {
    dest: 'veridian',
    path: ['freehold', 'veridian'],
    remaining: 1,
    status: 'plotted',
    autopilot: false,
  };
  const api = initAutopilot(ctx);
  api.update(0.016, ctx);
  const ap = ctx.autopilot;
  return keysOk(ap)
    && ap.engaged === false
    && ap.yaw === 0
    && ap.pitch === 0
    && ap.throttle === 0
    && ap.wantJump === false
    && ap.cycleHub === false;
})();

results.mirrorPersistFlag = (() => {
  const ctx = freshCtx();
  ctx.world.nav = {
    dest: 'veridian',
    path: ['freehold', 'veridian'],
    remaining: 1,
    status: 'plotted',
    autopilot: true,
  };
  const api = initAutopilot(ctx);
  api.update(0.016, ctx);
  return ctx.autopilot.engaged === true
    && ctx.autopilot.yaw === 0
    && ctx.autopilot.pitch === 0
    && ctx.autopilot.throttle === 0
    && ctx.autopilot.wantJump === false
    && ctx.autopilot.cycleHub === false
    && ctx.world.nav.autopilot === true;
})();

results.stringAutopilotNotEngaged = (() => {
  const ctx = freshCtx();
  ctx.world.nav = { dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'plotted', autopilot: 'true' };
  initAutopilot(ctx).update(0.016, ctx);
  return ctx.autopilot.engaged === false;
})();

results.noInputThrottleWrite = (() => {
  const ctx = freshCtx();
  ctx.input.throttle = 0.73;
  ctx.world.nav = { dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'plotted', autopilot: true };
  initAutopilot(ctx).update(0.016, ctx);
  return ctx.input.throttle === 0.73;
})();

results.noJumpRequested = (() => {
  const ctx = freshCtx();
  ctx.world.nav = { dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'plotted', autopilot: true };
  ctx.gate.inZone = true;
  ctx.gate.nearTo = 'veridian';
  initAutopilot(ctx).update(0.016, ctx);
  return ctx.events.every((e) => e.type !== 'jumpRequested')
    && !/emit\s*\(\s*['"]jumpRequested['"]/.test(apSrc);
})();

results.noTargetsWrite = (() => {
  const ctx = freshCtx();
  const lock = ctx.targets.current;
  ctx.world.nav = { dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'plotted', autopilot: true };
  initAutopilot(ctx).update(0.016, ctx);
  return ctx.targets.current === lock
    && !apSrc.includes('targets.current');
})();

results.noMeshWrite = (() => {
  const ctx = freshCtx();
  initAutopilot(ctx).update(0.016, ctx);
  const p = ctx.ship.object.position;
  return p.x === 11 && p.y === 22 && p.z === 33
    && ctx.world.currentSystem === 'freehold'
    && !apSrc.includes('object.position')
    && !apSrc.includes('currentSystem');
})();

results.noInnerHTML = !apSrc.includes('innerHTML')
  && !ctxSrc.includes('innerHTML')
  && !mainSrc.includes('innerHTML');

results.noTypeSmashInStub = !apSrc.includes('...data')
  && !apSrc.includes('emit(')
  && ctxSrc.includes("emit(type, data = {})")
  && ctxSrc.includes("'autopilotEngaged'")
  && ctxSrc.includes("'autopilotDisengaged'")
  && ctxSrc.includes("'navRoute'")
  && ctxSrc.includes('flags.chartOpen');

results.tickOrder = /initGate[\s\S]{0,40}initControls[\s\S]{0,40}initAutopilot[\s\S]{0,80}initShip/.test(mainSrc)
  && mainSrc.includes("import { initAutopilot } from './game/autopilot.js'");

results.noSecondWorldField = WORLD_FIELDS.includes('nav')
  && WORLD_FIELDS.filter((k) => k === 'nav').length === 1
  && !WORLD_FIELDS.includes('autopilot')
  && !WORLD_FIELDS.includes('ap')
  && WORLD_FIELDS.indexOf('nav') === WORLD_FIELDS.lastIndexOf('nav');

results.stateUntouched = (() => {
  const diff = execSync('git diff -- src/game/state.js', { cwd: root, encoding: 'utf8' });
  return diff === ''
    && !apSrc.includes("from './state.js'")
    && !apSrc.includes('from "../game/state.js"')
    && !/export const AP\b/.test(stateSrc);
})();

results.allowlistStrip = (() => {
  const ctx = freshCtx();
  ctx.autopilot.__proto__ = ctx.autopilot.__proto__;
  ctx.autopilot.polluted = 1;
  initAutopilot(ctx).update(0.016, ctx);
  return keysOk(ctx.autopilot) && ctx.autopilot.polluted === undefined;
})();

console.log('wave85 ap-stub probe:', JSON.stringify(results, null, 2));
const failed = Object.entries(results).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) {
  console.log('FAIL', failed.join(','));
  process.exit(1);
}
console.log('PASS');
