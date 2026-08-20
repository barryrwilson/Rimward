// Wave 69 PR2 — extra verifier edges (does not change production source).
// node --import ./scripts/with-css-stub.mjs out/w69/pr2/verify-edges.mjs
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { SYSTEMS } from '../../../src/game/state.js';
import { initAsteroids } from '../../../src/systems/asteroids.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

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

const astSrc = readFileSync(new URL('../../../src/systems/asteroids.js', import.meta.url), 'utf8');
const updateStart = astSrc.indexOf('update(dt) {');
const updateEnd = astSrc.lastIndexOf('    },\n  };\n}');
const updateFn = updateStart >= 0 && updateEnd > updateStart
  ? astSrc.slice(updateStart, updateEnd)
  : '';
pin('src.updateHasOrbit', updateFn.includes('writeOrbitPose'));
pin('src.updateUsesWorldTime', /tWorld\s*=\s*ctx\.world\.time/.test(updateFn));
pin('src.phaseUsesTimeNotDt', /phase0\s*\+\s*omega\s*\*\s*time/.test(astSrc)
  && !/phase0\s*\+=/.test(updateFn)
  && !/omega\s*\*\s*dt/.test(updateFn.replace(/rock\.spin\s*\*\s*dt/g, '')));
pin('src.noNewVectorInUpdate', !/new THREE\.Vector3/.test(updateFn));
pin('src.noNewArrayInOrbitLoop', !/new Array\(/.test(updateFn) && !/\[\]/.test(updateFn.split('Closed-form')[1]?.split('Slow tumble')[0] || '[]'));
pin('src.orbitAllRocks', /for \(let i = 0; i < n; i\+\+\)/.test(updateFn)
  && updateFn.includes('writeOrbitPose'));
pin('src.tumbleSkipFar', updateFn.includes('TUMBLE_RANGE2') && updateFn.includes('if (rock.depleted) continue'));
pin('src.tumbleSkipReduced', /if \(reduced\) continue/.test(updateFn));
pin('src.keepOutT0', astSrc.includes('writeOrbitPose(position, rock.orbitR, inc, node, rock.phase0, rock.omega, y0, 0)'));
pin('src.tumbleRange1200', astSrc.includes('const TUMBLE_RANGE2 = 1200 * 1200'));

const ctxA = scopedCtx('freehold', 100);
initAsteroids(ctxA);
const xyzA = xyzOf(ctxA.asteroids.list);

const ctx0 = scopedCtx('freehold', 0);
const ast0 = initAsteroids(ctx0);
const list0 = ctx0.asteroids.list;
const posRefs = list0.map((e) => e.position);
const entryRefs = list0.slice();
const listRef = list0;

ctx0.world.time = 100;
ast0.update(0.016);
pin('snap.vsBuild100', xyzEqual(xyzOf(list0), xyzA, EPS));
pin('id.allSameVec', list0.every((e, i) => e.position === posRefs[i]));
pin('id.allSameEntry', list0.every((e, i) => e === entryRefs[i]));
pin('id.listArray', ctx0.asteroids.list === listRef);
pin('id.ids', list0.every((e, i) => e.id === i));

const snap100 = xyzOf(list0);
ctx0.world.time = 100;
ast0.update(0.001);
pin('dt.tiny', xyzEqual(xyzOf(list0), snap100, EPS));
ast0.update(99);
pin('dt.huge', xyzEqual(xyzOf(list0), snap100, EPS));
ast0.update(0);
pin('dt.zero', xyzEqual(xyzOf(list0), snap100, EPS));

const times = [0, 1, 40, 77.5, 250, 1000];
for (let k = 0; k < times.length; k++) {
  const t = times[k];
  const ctxB = scopedCtx('freehold', t);
  initAsteroids(ctxB);
  ctx0.world.time = t;
  ast0.update(k + 0.5);
  pin('snap.t' + t, xyzEqual(xyzOf(list0), xyzOf(ctxB.asteroids.list), EPS));
  pin('finite.t' + t, xyzFinite(list0));
}

ctx0.ship = { object: { position: new THREE.Vector3(50000, 8000, -40000) } };
const ctxFar = scopedCtx('freehold', 333);
initAsteroids(ctxFar);
ctx0.world.time = 333;
ast0.update(0.016);
pin('far.orbitStill', xyzEqual(xyzOf(list0), xyzOf(ctxFar.asteroids.list), EPS));
pin('far.matrix', matricesMatchList(ctx0.scene, list0));
pin('id.afterFar', list0.every((e, i) => e.position === posRefs[i]));

ctx0.settings.reducedMotion = true;
const ctxR = scopedCtx('freehold', 410);
initAsteroids(ctxR);
ctx0.world.time = 410;
ast0.update(0.5);
pin('reduced.orbit', xyzEqual(xyzOf(list0), xyzOf(ctxR.asteroids.list), EPS));
ctx0.settings.reducedMotion = false;

const ctxH = scopedCtx('freehold', 0);
const astH = initAsteroids(ctxH);
const listH = ctxH.asteroids.list;
const huskRefs = listH.map((e) => e.position);
const bag = { freehold: {} };
for (let i = 0; i < listH.length; i++) bag.freehold[String(i)] = 0;
ctxH.world.fieldOre = bag;
astH.update(0.016);
pin('husk.oreZero', listH.every((e) => e.ore === 0));
pin('husk.sameVec', listH.every((e, i) => e.position === huskRefs[i]));
ctxH.world.time = 100;
astH.update(0.016);
pin('husk.vsBuild100', xyzEqual(xyzOf(listH), xyzA, EPS));
pin('husk.matrix', matricesMatchList(ctxH.scene, listH));
pin('husk.finite', xyzFinite(listH));

const ctxN = scopedCtx('freehold', 0);
const astN = initAsteroids(ctxN);
ctxN.world.time = NaN;
astN.update(0.016);
pin('nan.finite', xyzFinite(ctxN.asteroids.list));
const ctxT0 = scopedCtx('freehold', 0);
initAsteroids(ctxT0);
pin('nan.asT0', xyzEqual(xyzOf(ctxN.asteroids.list), xyzOf(ctxT0.asteroids.list), EPS));
ctxN.world.time = Infinity;
astN.update(0.016);
pin('inf.finite', xyzFinite(ctxN.asteroids.list));

if (fails.length) {
  console.error('FAIL', fails.join('\n'));
  process.exit(1);
}
console.log('PASS', 'w69 pr2 edges true', `n=${list0.length}`);
process.exit(0);
