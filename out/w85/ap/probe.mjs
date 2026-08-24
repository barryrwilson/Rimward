import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import {
  initAutopilot, tryEngage, disengage, AP_STEER_BREAK, apLine, apRefuseToken,
} from '../../../src/game/autopilot.js';
import { applyAvoidBias } from '../../../src/systems/npc.js';
import { WORLD_FIELDS } from '../../../src/game/save.js';
import { plotRoute, sanitizeNav } from '../../../src/game/nav.js';
import { SYSTEMS } from '../../../src/game/state.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const results = {};

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
  ctx.systems = SYSTEMS;
  ctx.input.throttle = 0.4;
  ctx.targets.current = { id: 'sentinel-lock' };
  ctx.ship.object = {
    position: new THREE.Vector3(11, 22, 33),
    quaternion: new THREE.Quaternion(),
  };
  ctx.world.currentSystem = 'freehold';
  ctx.player = { hull: 100, hullMax: 100 };
  return ctx;
}

const ctxSrc = src('src/core/ctx.js');
const apSrc = src('src/game/autopilot.js');
const shipSrc = src('src/systems/ship.js');
const gateSrc = src('src/systems/gate.js');
const npcSrc = src('src/systems/npc.js');
const hudSrc = src('src/systems/hud.js');
const chartSrc = src('src/systems/galaxychart.js');
const cssSrc = src('src/ui/hud.css');
const mainSrc = src('src/main.js');
const jumpSrc = src('src/game/jump.js');
const stateSrc = src('src/game/state.js');

results.steerBreakConst = AP_STEER_BREAK === 0.65 && apSrc.includes('AP_STEER_BREAK');
results.disengageExport = typeof disengage === 'function' && typeof tryEngage === 'function';
results.applyAvoidBiasExport = typeof applyAvoidBias === 'function'
  && npcSrc.includes('export function applyAvoidBias');
results.matchLine = apLine('match') === 'Autopilot refused — MATCH is on.';
results.cancelLine = apLine('cancel') === 'Autopilot cancelled.';
results.arriveLine = apLine('arrive') === 'Arrived — autopilot off.';

results.matchRefuse = (() => {
  const ctx = freshCtx();
  initAutopilot(ctx);
  plotRoute(ctx, 'veridian');
  ctx.flags.matchSpeed = true;
  ctx.input.throttle = 0.73;
  const tok = tryEngage(ctx);
  return tok === 'match'
    && ctx.flags.matchSpeed === true
    && ctx.input.throttle === 0.73
    && ctx.world.nav.autopilot === false
    && apRefuseToken(ctx) === 'match';
})();

results.wasdKeepsDest = (() => {
  const ctx = freshCtx();
  initAutopilot(ctx);
  plotRoute(ctx, 'veridian');
  ctx.flags.matchSpeed = false;
  const tok = tryEngage(ctx);
  ctx.input.strafeX = 1;
  initAutopilot(ctx).update(0.016, ctx);
  return tok === ''
    && ctx.world.nav.dest === 'veridian'
    && ctx.world.nav.autopilot === false
    && ctx.autopilot.reason === 'input';
})();

results.chartOpenSuppressesSteer = (() => {
  const ctx = freshCtx();
  const api = initAutopilot(ctx);
  plotRoute(ctx, 'veridian');
  tryEngage(ctx);
  ctx.flags.chartOpen = true;
  ctx.input.steerX = 1;
  api.update(0.016, ctx);
  const still = ctx.world.nav.autopilot === true;
  ctx.flags.chartOpen = false;
  api.update(0.016, ctx);
  const waiting = ctx.world.nav.autopilot === true;
  ctx.input.steerX = 0;
  api.update(0.016, ctx);
  ctx.input.steerX = 1;
  api.update(0.016, ctx);
  return still && waiting && ctx.world.nav.autopilot === false;
})();

results.arriveDisengages = (() => {
  const ctx = freshCtx();
  const api = initAutopilot(ctx);
  plotRoute(ctx, 'veridian');
  tryEngage(ctx);
  ctx.world.currentSystem = 'veridian';
  ctx.lastEvents = [{ type: 'systemLoaded', t: 0, to: 'veridian' }];
  api.update(0.016, ctx);
  return ctx.world.nav.autopilot === false && ctx.autopilot.reason === 'arrive';
})();

results.stuffedRestoreFalse = (() => {
  const ctx = freshCtx();
  ctx.world.nav = {
    dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'plotted', autopilot: true,
  };
  sanitizeNav(ctx);
  return ctx.world.nav && ctx.world.nav.autopilot === false;
})();

results.noJumpFromAp = !/emit\s*\(\s*['"]jumpRequested['"]/.test(apSrc)
  && /emit\s*\(\s*['"]jumpRequested['"]/.test(gateSrc)
  && /to:\s*near\.to/.test(gateSrc)
  && gateSrc.includes('wantJump');

results.wantJumpNextHop = gateSrc.includes('near.to === nextHop')
  && gateSrc.includes('cycleHub');

results.noTargetsWrite = (() => {
  const ctx = freshCtx();
  const lock = ctx.targets.current;
  plotRoute(ctx, 'veridian');
  tryEngage(ctx);
  initAutopilot(ctx).update(0.016, ctx);
  return ctx.targets.current === lock && !apSrc.includes('targets.current');
})();

results.noInputThrottleWrite = !shipSrc.includes('input.throttle =')
  && !apSrc.includes('input.throttle =');

results.noInnerHTML = !hudSrc.includes('innerHTML') && !chartSrc.includes('innerHTML');

results.spaceOnApButtons = apSrc.includes('function guardAutopilotSpace')
  && chartSrc.includes('guardAutopilotSpace')
  && hudSrc.includes('guardAutopilotSpace')
  && !chartSrc.includes('preventDefault(');

results.chipPin = cssSrc.includes('#hud .rw-autopilot')
  && /#hud \.rw-autopilot \{[\s\S]{0,180}top:\s*14px/.test(cssSrc)
  && hudSrc.includes("el('div', 'rw-autopilot is-hidden', root)")
  && !hudSrc.includes('rw-nav-readout rw-autopilot');

results.ctxNoLiteral = !ctxSrc.includes('ctx.autopilot');

results.noSecondWorldField = WORLD_FIELDS.includes('nav')
  && !WORLD_FIELDS.includes('autopilot');

results.stateUntouched = (() => {
  const diff = execSync('git diff -- src/game/state.js', { cwd: root, encoding: 'utf8' });
  return diff === '' && !/export const AP\b/.test(stateSrc);
})();

results.jumpChargeUntouched = jumpSrc.includes('chargeTime')
  && !/currentSystem\s*=(?!=)/.test(apSrc)
  && !apSrc.includes('position.copy')
  && !apSrc.includes('position.set');

results.tickOrder = /initGate[\s\S]{0,40}initControls[\s\S]{0,40}initAutopilot[\s\S]{0,80}initShip/.test(mainSrc);

results.pauseDisengage = mainSrc.includes("disengage(ctx, 'pause')")
  && src('src/systems/title.js').includes("disengage(ctx, 'pause')")
  && src('src/game/origins.js').includes("disengage(ctx, 'pause')")
  && src('src/systems/modelsbrowser.js').includes("disengage(ctx, 'pause')");

console.log('wave85 ap probe:', JSON.stringify(results, null, 2));
const failed = Object.entries(results).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) {
  console.log('FAIL', failed.join(','));
  process.exit(1);
}
console.log('PASS');
