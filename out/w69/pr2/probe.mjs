// Wave 69 PR2 — closed-form orbit pose from world.time.
// node --import ./scripts/with-css-stub.mjs out/w69/pr2/probe.mjs
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { SYSTEMS } from '../../../src/game/state.js';
import { initAsteroids } from '../../../src/systems/asteroids.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

const W51_FIRST8 = [
  ['brineIce', 8.330197296655475, 8],
  ['livingRock', 6.9844691390487315, 5],
  ['slagIron', 3.7710742510987254, 11],
  ['livingRock', 4.248511092880373, 7],
  ['rawOre', 11.858896609068687, 11],
  ['slagIron', 5.547035800152279, 10],
  ['rawOre', 11.52513813834408, 4],
  ['slagIron', 3.4849928163142665, 9],
];

const EPS = 1e-9;

function scopedCtx(systemId, time) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 20000);
  const renderer = {
    domElement: { style: {} },
    setSize() {},
    setPixelRatio() {},
    setAnimationLoop() {},
    render() {},
  };
  const ctx = createCtx({ scene, camera, renderer });
  ctx.systems = SYSTEMS;
  ctx.world.currentSystem = systemId;
  if (time != null) ctx.world.time = time;
  return ctx;
}

function xyzOf(list) {
  const out = new Array(list.length);
  for (let i = 0; i < list.length; i++) {
    const p = list[i].position;
    out[i] = [p.x, p.y, p.z];
  }
  return out;
}

function xyzEqual(a, b, eps) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const d = Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1], a[i][2] - b[i][2]);
    if (d > eps) return false;
  }
  return true;
}

function xyzFinite(list) {
  for (let i = 0; i < list.length; i++) {
    const p = list[i].position;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) return false;
  }
  return true;
}

function matricesMatchList(scene, list) {
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const hit = new Array(list.length);
  for (let i = 0; i < hit.length; i++) hit[i] = false;
  scene.traverse((obj) => {
    if (!obj.isInstancedMesh) return;
    const name = obj.name || '';
    if (name.indexOf('asteroid-field-') !== 0) return;
    for (let i = 0; i < obj.count; i++) {
      obj.getMatrixAt(i, m);
      m.decompose(p, q, s);
      for (let j = 0; j < list.length; j++) {
        if (hit[j]) continue;
        const lp = list[j].position;
        if (Math.hypot(lp.x - p.x, lp.y - p.y, lp.z - p.z) <= 1e-3) {
          hit[j] = true;
          break;
        }
      }
    }
  });
  for (let i = 0; i < hit.length; i++) if (!hit[i]) return false;
  return true;
}

const def = SYSTEMS.freehold;

const ctxA = scopedCtx('freehold', 100);
const astA = initAsteroids(ctxA);
const listA = ctxA.asteroids.list;
const xyzA = xyzOf(listA);

const ctxB = scopedCtx('freehold', 100);
initAsteroids(ctxB);
pin('sameSeedTime.xyz', xyzEqual(xyzA, xyzOf(ctxB.asteroids.list), EPS));

const ctx0 = scopedCtx('freehold', 0);
const ast0 = initAsteroids(ctx0);
const list0 = ctx0.asteroids.list;
pin('id.index', list0.every((e, i) => e.id === i));
pin('count', list0.length === def.field.count && list0.length <= 160);
const pos0 = list0[0].position;
const first8 = list0.slice(0, 8).map((e) => [e.oreKey, e.radius, e.ore]);
pin('w51.first8', JSON.stringify(first8) === JSON.stringify(W51_FIRST8), JSON.stringify(first8));

const xzT = [];
function pushXz(list) {
  const row = new Array(list.length);
  for (let i = 0; i < list.length; i++) row[i] = Math.hypot(list[i].position.x, list[i].position.z);
  xzT.push(row);
}
pushXz(list0);

ctx0.world.time = 100;
ast0.update(0.016);
pin('pos.identity', list0[0].position === pos0 && ctx0.asteroids.list === list0);
pin('closed.vsBuild100', xyzEqual(xyzOf(list0), xyzA, EPS));
pin('finite.t100', xyzFinite(list0));
pin('matrix.t100', matricesMatchList(ctx0.scene, list0));

const snapDt = xyzOf(list0);
ctx0.world.time = 100;
ast0.update(10);
pin('closed.ignoresDt', xyzEqual(xyzOf(list0), snapDt, EPS));
pushXz(list0);

ctx0.settings.reducedMotion = true;
ctx0.world.time = 250;
ast0.update(0.5);
pin('reduced.moves', !xyzEqual(xyzOf(list0), xyzA, EPS));
pin('finite.reduced', xyzFinite(list0));
pushXz(list0);

ctx0.settings.reducedMotion = false;
const times = [0, 40, 80, 120, 400, 900];
for (let k = 0; k < times.length; k++) {
  ctx0.world.time = times[k];
  ast0.update(1);
  pushXz(list0);
  pin('finite.t' + times[k], xyzFinite(list0));
}

let spiral = 0;
for (let i = 0; i < list0.length; i++) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let k = 0; k < xzT.length; k++) {
    const r = xzT[k][i];
    if (r < lo) lo = r;
    if (r > hi) hi = r;
  }
  const mid = 0.5 * (lo + hi);
  if (!(mid > 1) || (hi - lo) / mid > 0.35) spiral += 1;
}
pin('circular.xz', spiral === 0, `out=${spiral}`);

const ctxN = scopedCtx('freehold', 0);
const astN = initAsteroids(ctxN);
ctxN.world.time = 1e6;
astN.update(0.016);
pin('finite.largeT', xyzFinite(ctxN.asteroids.list));
pin('id.afterMotion', ctxN.asteroids.list.every((e, i) => e.id === i));
pin('count.afterMotion', ctxN.asteroids.list.length === def.field.count);

if (fails.length) {
  console.error('FAIL', fails.join('\n'));
  process.exit(1);
}
console.log('PASS', 'w69 pr2 pins true', `n=${list0.length}`);
process.exit(0);
