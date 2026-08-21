// Wave 74 TGT-05 — pick math, KeyV edge, cycle-T preserve.
// node --import ./scripts/with-css-stub.mjs out/w74/tgt05/probe.mjs
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCtx } from '../../../src/core/ctx.js';
import { U } from '../../../src/game/state.js';
import { pickReticleLock, reticleAimPoint, RETICLE_EDGE } from '../../../src/game/reticle-aim.js';
import { initControls } from '../../../src/systems/controls.js';

const fails = [];
const results = {};
function pin(name, cond, extra = '') {
  results[name] = !!cond;
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

if (!globalThis.window) {
  const listeners = {};
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 720,
    addEventListener(type, fn) {
      (listeners[type] ??= []).push(fn);
    },
    _listeners: listeners,
  };
}
if (!globalThis.document) {
  globalThis.document = { getElementById() { return null; } };
}
if (!globalThis.performance) {
  globalThis.performance = { now() { return 0; } };
}

function makeCam() {
  const cam = new THREE.PerspectiveCamera(60, 1280 / 720, 0.1, 5000);
  cam.position.set(0, 0, 100);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return cam;
}

function makeCtx() {
  const camera = makeCam();
  const ctx = createCtx({ scene: new THREE.Scene(), camera, renderer: {} });
  ctx.ship.object = { position: new THREE.Vector3(0, 0, 80) };
  ctx.asteroids = { list: [] };
  ctx.ships = [];
  ctx.emit = (type, data = {}) => {
    ctx.events.push({ type, t: ctx.world.time, ...data });
  };
  return ctx;
}

function shipAt(pos, extra = {}) {
  return {
    id: extra.id ?? 's1',
    record: { name: extra.name ?? 'Probe' },
    object: { position: pos.clone(), parent: {} },
    state: { destroyed: !!extra.destroyed, disabled: !!extra.disabled, radius: extra.radius ?? 4, name: extra.name ?? 'Probe' },
  };
}

function rockAt(i, pos, extra = {}) {
  return {
    id: i,
    position: pos.clone(),
    radius: extra.radius ?? 8,
    ore: extra.ore ?? 4,
    commodity: 'rawOre',
    oreKey: 'raw',
    hardness: 1,
  };
}

// --- source pins ---
const controlsSrc = src('src/systems/controls.js');
const ctxSrc = src('src/core/ctx.js');
const aimSrc = src('src/game/reticle-aim.js');
const combatSrc = src('src/systems/combat.js');
const stateSrc = src('src/game/state.js');
const hudSrc = src('src/systems/hud.js');
const songSrc = src('src/systems/song.js');

pin('keyt-cycle-unchanged', /function cycleTarget\(ctx\) \{[\s\S]*?weaponGroup === 3[\s\S]*?cands\.sort\(\(a, b\) => a\.d2 - b\.d2\)/.test(controlsSrc));
pin('tracked-has-v', controlsSrc.includes("'KeyV'"));
pin('tracked-keeps-t', controlsSrc.includes("'KeyT'"));
pin('no-stolen-keys', !/\bKeyG\b|\bKeyM\b|\bKeyL\b|\bKeyP\b|\bKeyO\b|\bDigit0\b/.test(
  controlsSrc.slice(controlsSrc.indexOf('const TRACKED'), controlsSrc.indexOf('const PREVENT_DEFAULT')),
));
pin('new-edge-not-reuse', controlsSrc.includes('reticleLockPressed') && controlsSrc.includes('pendingReticleLock'));
pin('ctx-edge-field', ctxSrc.includes('reticleLockPressed: false'));
pin('ctx-event-comment', ctxSrc.includes("'reticleLock' { hit }"));
pin('no-cone-const', !aimSrc.includes('CONVERGE_DOT') && !aimSrc.includes('RETICLE_LOCK_CONE'));
pin('no-full-raycaster', !aimSrc.includes('Raycaster'));
pin('range-is-u-target', aimSrc.includes('U.TARGET_RANGE') && /TARGET_RANGE:\s*600/.test(stateSrc));
pin('state-no-new-u', !/RETICLE_LOCK/.test(stateSrc));
pin('missile-still-ship', combatSrc.includes('function liveMissileLock') && combatSrc.includes('t.state.destroyed'));
pin('hud-textcontent-v', hudSrc.includes("pKey = 'V'") && hudSrc.includes("pVerb = 'Lock'") && !/innerHTML/.test(hudSrc));
pin('song-cue-band', (() => {
  const m = songSrc.match(/reticleLock:\s*\[\['square',\s*[\d.]+,\s*[\d.]+,\s*([\d.]+),\s*([\d.]+)/);
  if (!m) return false;
  return Number(m[1]) <= 0.35 && Number(m[2]) <= 0.08;
})());
pin('song-not-family-gated', !/FAMILY_CUES\s*=\s*\{[^}]*reticleLock/.test(songSrc.replace(/\n/g, ' ')));
pin('reticle-edge-44', RETICLE_EDGE === 44);
pin('world-fields-no-targets', !/\btargets\b/.test(src('src/game/save.js').match(/export const WORLD_FIELDS = \[[\s\S]*?\];/)[0]));

// --- pick math ---
{
  const ctx = makeCtx();
  const npc = shipAt(new THREE.Vector3(0, 0, 0));
  ctx.ships = [npc];
  const hit = pickReticleLock(ctx);
  pin('pick-ship-center', hit === npc);
}

{
  const ctx = makeCtx();
  ctx.input.weaponGroup = 1;
  const rock = rockAt(0, new THREE.Vector3(0, 0, 0));
  ctx.asteroids.list = [rock];
  const hit = pickReticleLock(ctx);
  pin('pick-rock-group1', hit === rock && ctx.asteroids.list.indexOf(hit) === 0 && hit.id === 0);
}

{
  const ctx = makeCtx();
  const dead = shipAt(new THREE.Vector3(0, 0, 0), { destroyed: true });
  ctx.ships = [dead];
  pin('pick-skip-destroyed', pickReticleLock(ctx) === null);
}

{
  const ctx = makeCtx();
  const far = shipAt(new THREE.Vector3(0, 0, -800));
  ctx.ships = [far];
  pin('pick-range-cap', pickReticleLock(ctx) === null && U.TARGET_RANGE === 600);
}

{
  const ctx = makeCtx();
  const near = shipAt(new THREE.Vector3(0, 0, 40), { id: 'near' });
  const far = shipAt(new THREE.Vector3(0, 0, 0), { id: 'far' });
  ctx.ships = [far, near];
  const hit = pickReticleLock(ctx);
  pin('pick-nearer-wins', hit === near);
}

{
  const ctx = makeCtx();
  const npc = shipAt(new THREE.Vector3(0, 0, 0));
  ctx.ships = [npc];
  ctx.targets.reticleScreen.x = 400;
  ctx.targets.reticleScreen.y = 0;
  ctx.flags.firstPerson = false;
  pin('pick-offset-miss', pickReticleLock(ctx) === null);
  ctx.flags.firstPerson = true;
  pin('pick-fp-centered', pickReticleLock(ctx) === npc);
}

{
  const ctx = makeCtx();
  ctx.station = { position: new THREE.Vector3(0, 0, 0), name: 'Dock' };
  ctx.pods = [{ mesh: { position: new THREE.Vector3(0, 0, 0) } }];
  pin('pick-skips-station-pod', pickReticleLock(ctx) === null);
}

{
  const ctx = makeCtx();
  const npc = shipAt(new THREE.Vector3(0, 0, 0));
  ctx.ships = [npc];
  const out = new THREE.Vector3();
  const ref = reticleAimPoint(ctx, 400, out);
  pin('aim-returns-ref', ref === npc);
}

// --- controls edge ---
{
  const ctx = makeCtx();
  const npc = shipAt(new THREE.Vector3(0, 0, 0));
  ctx.ships = [npc];
  const ctl = initControls(ctx);
  const kd = window._listeners.keydown[window._listeners.keydown.length - 1];
  kd({ code: 'KeyV', repeat: false, preventDefault() {} });
  ctl.update(0.016);
  pin('v-locks-ship', ctx.targets.current === npc);
  pin('v-pulse-one-frame', ctx.input.reticleLockPressed === true);
  const lockEv = ctx.events.filter((e) => e.type === 'reticleLock');
  pin('v-hit-event', lockEv.length === 1 && lockEv[0].hit === true && !('ship' in lockEv[0]) && !('name' in lockEv[0]));
  ctx.events.length = 0;
  ctl.update(0.016);
  pin('v-pulse-clears', ctx.input.reticleLockPressed === false);
}

{
  const ctx = makeCtx();
  ctx.targets.current = { keep: true };
  const ctl = initControls(ctx);
  const kd = window._listeners.keydown[window._listeners.keydown.length - 1];
  kd({ code: 'KeyV', repeat: false, preventDefault() {} });
  ctl.update(0.016);
  pin('miss-no-steal', ctx.targets.current && ctx.targets.current.keep === true);
  const miss = ctx.events.find((e) => e.type === 'commLine');
  pin('miss-commline', !!(miss && miss.text === 'Nothing under the reticle.'));
  const lockEv = ctx.events.find((e) => e.type === 'reticleLock');
  pin('miss-event-hit-false', !!(lockEv && lockEv.hit === false));
}

{
  const ctx = makeCtx();
  ctx.flags.docked = true;
  const npc = shipAt(new THREE.Vector3(0, 0, 0));
  ctx.ships = [npc];
  const ctl = initControls(ctx);
  const kd = window._listeners.keydown[window._listeners.keydown.length - 1];
  kd({ code: 'KeyV', repeat: false, preventDefault() {} });
  ctl.update(0.016);
  pin('docked-refuse', ctx.targets.current === null);
}

{
  const ctx = makeCtx();
  const npc = shipAt(new THREE.Vector3(40, 0, 40), { id: 'a' });
  const npc2 = shipAt(new THREE.Vector3(-40, 0, 40), { id: 'b' });
  const rock = rockAt(0, new THREE.Vector3(0, 20, 40));
  ctx.ships = [npc, npc2];
  ctx.asteroids.list = [rock];
  ctx.input.weaponGroup = 1;
  const ctl = initControls(ctx);
  const kd = window._listeners.keydown[window._listeners.keydown.length - 1];
  kd({ code: 'KeyT', repeat: false, preventDefault() {} });
  ctl.update(0.016);
  pin('t-cycle-ships-g1', ctx.targets.current === npc || ctx.targets.current === npc2);
  pin('t-no-rock-g1', ctx.targets.current !== rock);
  ctx.input.weaponGroup = 3;
  kd({ code: 'KeyT', repeat: false, preventDefault() {} });
  ctl.update(0.016);
  kd({ code: 'KeyT', repeat: false, preventDefault() {} });
  ctl.update(0.016);
  kd({ code: 'KeyT', repeat: false, preventDefault() {} });
  ctl.update(0.016);
  const seen = new Set();
  // wrap three times from current
  let cur = ctx.targets.current;
  seen.add(cur);
  kd({ code: 'KeyT', repeat: false, preventDefault() {} });
  ctl.update(0.016);
  seen.add(ctx.targets.current);
  kd({ code: 'KeyT', repeat: false, preventDefault() {} });
  ctl.update(0.016);
  seen.add(ctx.targets.current);
  pin('t-cycle-rocks-g3', seen.has(rock) && seen.size >= 2);
}

console.log('---');
console.log(fails.length ? `FAIL ${fails.length}` : 'OK');
if (fails.length) {
  for (const f of fails) console.log(' ', f);
  process.exit(1);
}
