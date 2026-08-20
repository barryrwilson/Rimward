// Wave 69 PR1 — extra verifier edges (does not change production source).
// node --import ./scripts/with-css-stub.mjs out/w69/pr1/verify-edges.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { SYSTEMS, ORE_TYPES } from '../../../src/game/state.js';
import { initAsteroids } from '../../../src/systems/asteroids.js';
import { restore, snapshot, WORLD_FIELDS } from '../../../src/game/save.js';
import { PHY } from '../../../src/game/physics.js';
import { cylinderOverlap, torusOverlap } from '../../../src/game/collision.js';
import { PLANET_SLOT_COUNT } from '../../../src/systems/solarsystem.js';
import { initPods } from '../../../src/game/pods.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

const LIVE_SLOTS = [
  { radius: 9, orbitRadius: 250 },
  { radius: 14, orbitRadius: 420 },
  { radius: 16, orbitRadius: 640 },
  { radius: 12, orbitRadius: 920 },
  { radius: 30, orbitRadius: 1400 },
];

function scopedCtx(systemId) {
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
  return ctx;
}

function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

function first8(list) {
  return list.slice(0, 8).map((e) => [e.oreKey, e.radius, e.ore]);
}

function meshNames(scene) {
  return scene.children.filter((o) => o.isInstancedMesh).map((o) => o.name).sort();
}

function dumpHeadAsteroids() {
  const raw = execFileSync('git', ['show', 'HEAD:src/systems/asteroids.js'], {
    encoding: 'utf8',
    cwd: process.cwd(),
  });
  const rewritten = raw
    .replaceAll("from '../game/state.js'", "from '../../../src/game/state.js'")
    .replaceAll("from '../game/pods.js'", "from '../../../src/game/pods.js'")
    .replaceAll("from './rock-surface.js'", "from '../../../src/systems/rock-surface.js'");
  writeFileSync(new URL('./asteroids-head.js', import.meta.url), rewritten);
}

dumpHeadAsteroids();
const { initAsteroids: initHead } = await import('./asteroids-head.js');

const ctxHead = scopedCtx('freehold');
initHead(ctxHead);
const head8 = first8(ctxHead.asteroids.list);

const ctxLive = scopedCtx('freehold');
const astLive = initAsteroids(ctxLive);
const live8 = first8(ctxLive.asteroids.list);
pin('w51.headVsLive', JSON.stringify(head8) === JSON.stringify(live8), `head=${JSON.stringify(head8)} live=${JSON.stringify(live8)}`);
pin('w51.headOreKeys', head8.every((row, i) => row[0] === live8[i][0]));

const astSrc = readFileSync(new URL('../../../src/systems/asteroids.js', import.meta.url), 'utf8');
const updateFn = astSrc.slice(astSrc.indexOf('update(dt)'), astSrc.lastIndexOf('return {'));
pin('pr1.noUpdateOrbit', !updateFn.includes('writeOrbitPose'), 'update calls writeOrbitPose');
pin('pr1.buildOrbit', astSrc.includes('writeOrbitPose(position, rock.orbitR'));

const list = ctxLive.asteroids.list;
const pos0 = list[0].position;
pos0.set(123.5, 456.25, 789.125);
const meshes = ctxLive.scene.children.filter((o) => o.isInstancedMesh);
let translated = false;
astLive.update(0.016);
const _m = new THREE.Matrix4();
for (const mesh of meshes) {
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, _m);
    const e = _m.elements;
    if (Math.abs(e[12] - 123.5) < 1e-6 && Math.abs(e[13] - 456.25) < 1e-6 && Math.abs(e[14] - 789.125) < 1e-6) {
      translated = true;
    }
  }
}
pin('identity.listIsRockPos', translated, 'tumble matrix did not follow list[0].position');
pos0.set(0, 0, 0);

const ctxSlide = scopedCtx('freehold');
const astSlide = initAsteroids(ctxSlide);
const x0 = ctxSlide.asteroids.list.map((e) => e.position.x);
const y0 = ctxSlide.asteroids.list.map((e) => e.position.y);
const z0 = ctxSlide.asteroids.list.map((e) => e.position.z);
ctxSlide.world.time = 1000;
astSlide.update(1);
const slid = ctxSlide.asteroids.list.some((e, i) => e.position.x !== x0[i] || e.position.y !== y0[i] || e.position.z !== z0[i]);
pin('pr1.noSlide', !slid, 'positions moved on update with world.time');

const srcSlots = astSrc.match(/const PLANET_SLOTS = \[[\s\S]*?\];/)[0];
pin('slots.copy', LIVE_SLOTS.every((s) => srcSlots.includes(`radius: ${s.radius}`) && srcSlots.includes(`orbitRadius: ${s.orbitRadius}`)));
pin('slots.count', srcSlots.split('orbitRadius').length - 1 === PLANET_SLOT_COUNT);

const keepTries = astSrc.includes('KEEP_TRIES = 8') && astSrc.includes('rng()') && /Keep-out mutates r\/phase0 only/.test(astSrc);
pin('keep.noExtraRngComment', keepTries);
const keepBlock = astSrc.slice(astSrc.indexOf('Keep-out mutates'), astSrc.indexOf('rocks.push(rock)'));
pin('keep.noRngInKeepout', !/\brng\s*\(/.test(keepBlock), keepBlock.slice(0, 80));

function keepHits(ctx, sysId) {
  const def = SYSTEMS[sysId];
  const list = ctx.asteroids.list;
  const ov = { hit: false, nx: 0, ny: 1, nz: 0, overlap: 0 };
  let sunHit = 0, stHit = 0, gateHit = 0, planetHit = 0;
  const sunR = def.sunRadius;
  const stp = def.station.position;
  const planetN = Math.min(def.planetCount, PLANET_SLOT_COUNT, LIVE_SLOTS.length);
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const pad = e.radius + 20;
    const dSun = Math.hypot(e.position.x, e.position.y, e.position.z);
    if (dSun < sunR * PHY.SUN_HEAT_MULT + pad) sunHit += 1;
    cylinderOverlap(
      e.position.x, e.position.y, e.position.z, pad,
      stp[0], stp[1], stp[2], PHY.STATION_CYL_RADIUS, PHY.STATION_CYL_Y0, PHY.STATION_CYL_Y1,
      ov,
    );
    if (ov.hit) stHit += 1;
    const gates = def.gates || [];
    for (let g = 0; g < gates.length; g++) {
      const p = gates[g].position;
      torusOverlap(e.position.x, e.position.y, e.position.z, pad, p[0], p[1], p[2], PHY.GATE_BORE, PHY.GATE_TUBE, ov);
      if (ov.hit) gateHit += 1;
    }
    if (def.hub && def.hub.position) {
      const p = def.hub.position;
      torusOverlap(e.position.x, e.position.y, e.position.z, pad, p[0], p[1], p[2], PHY.GATE_BORE, PHY.GATE_TUBE, ov);
      if (ov.hit) gateHit += 1;
    }
    const hx = Math.hypot(e.position.x, e.position.z);
    for (let s = 0; s < planetN; s++) {
      if (Math.abs(hx - LIVE_SLOTS[s].orbitRadius) < LIVE_SLOTS[s].radius + 40) planetHit += 1;
    }
  }
  return { sunHit, stHit, gateHit, planetHit, n: list.length };
}

for (const id of ['freehold', 'veridian', 'hollowreach', 'hush', 'verge']) {
  const c = scopedCtx(id);
  initAsteroids(c);
  const h = keepHits(c, id);
  pin(`keep.${id}`, h.sunHit + h.stHit + h.gateHit + h.planetHit === 0, JSON.stringify(h));
  const def = SYSTEMS[id];
  const az = Math.atan2(def.field.center[2], def.field.center[0]);
  let inS = 0;
  for (const e of c.asteroids.list) {
    if (angDiff(Math.atan2(e.position.z, e.position.x), az) <= 0.7) inS += 1;
  }
  const need = (def.band ?? 0) >= 3 ? 0.5 : 0.6;
  pin(`sector.${id}`, inS / c.asteroids.list.length >= need, `frac=${inS / c.asteroids.list.length} need=${need}`);
  pin(`count.${id}`, c.asteroids.list.length === def.field.count);
}

const origCount = SYSTEMS.freehold.field.count;
SYSTEMS.freehold.field.count = 200;
const ctxCap = scopedCtx('freehold');
initAsteroids(ctxCap);
pin('cap.160', ctxCap.asteroids.list.length === 160, `n=${ctxCap.asteroids.list.length}`);
SYSTEMS.freehold.field.count = origCount;

const origKind = SYSTEMS.freehold.field.kind;
SYSTEMS.freehold.field.kind = '__proto__';
const ctxKind = scopedCtx('freehold');
initAsteroids(ctxKind);
pin('kind.proto', ctxKind.asteroids.list.length === origCount);
SYSTEMS.freehold.field.kind = 'nope';
const ctxKind2 = scopedCtx('freehold');
initAsteroids(ctxKind2);
const azFh = Math.atan2(SYSTEMS.freehold.field.center[2], SYSTEMS.freehold.field.center[0]);
let inK = 0;
for (const e of ctxKind2.asteroids.list) {
  if (angDiff(Math.atan2(e.position.z, e.position.x), azFh) <= 0.7) inK += 1;
}
pin('kind.typoBelt', inK / ctxKind2.asteroids.list.length >= 0.6, `frac=${inK / ctxKind2.asteroids.list.length}`);
SYSTEMS.freehold.field.kind = origKind;

const ctxNaN = scopedCtx('freehold');
ctxNaN.world.time = Number.NaN;
initAsteroids(ctxNaN);
pin('time.nanBuild', ctxNaN.asteroids.list.every((e) => Number.isFinite(e.position.x) && Number.isFinite(e.position.y) && Number.isFinite(e.position.z)));

const ctxT = scopedCtx('freehold');
ctxT.world.time = 12.5;
const astT = initAsteroids(ctxT);
const pT = ctxT.asteroids.list[0].position.clone();
astT.update(0.5);
pin('time.buildPoseStable', ctxT.asteroids.list[0].position.distanceTo(pT) === 0);

const ctxO = scopedCtx('freehold');
const astO = initAsteroids(ctxO);
const seeded = ctxO.asteroids.list.map((e) => e.ore);
ctxO.world.fieldOre = { freehold: { 5: 1 } };
astO.update(0);
pin('overlay.oneIndex', ctxO.asteroids.list[5].ore === 1, `ore=${ctxO.asteroids.list[5].ore}`);
pin('overlay.missingSeeded', ctxO.asteroids.list.every((e, i) => i === 5 || e.ore === seeded[i]));
const listRef = ctxO.asteroids.list;
const namesBefore = meshNames(ctxO.scene).join(',');
ctxO.flags.saveRestored = true;
restore(ctxO, {
  v: 1,
  world: {
    time: 0,
    currentSystem: 'freehold',
    fieldOre: { freehold: { 5: 0, 6: 2 } },
    credits: 350,
    fear: 0,
  },
  cargo: [],
});
pin('restore.noSystemLoaded', ctxO.events.every((e) => e.type !== 'systemLoaded'));
astO.update(0);
pin('restore.sameList', ctxO.asteroids.list === listRef);
pin('restore.noDispose', meshNames(ctxO.scene).join(',') === namesBefore);
pin('restore.overlay5', ctxO.asteroids.list[5].ore === 0);
pin('restore.overlay6', ctxO.asteroids.list[6].ore === 2);
pin('restore.otherSeeded', ctxO.asteroids.list[0].ore === seeded[0]);
restore(ctxO, {
  v: 1,
  world: {
    time: 0,
    currentSystem: 'freehold',
    fieldOre: { freehold: { 0: 64 } },
    credits: 350,
    fear: 0,
  },
  cargo: [],
});
astO.update(0);
pin('restore.noMint', ctxO.asteroids.list[0].ore === seeded[0], `ore=${ctxO.asteroids.list[0].ore} seed=${seeded[0]}`);

const mined = ctxO.asteroids.list[7].ore;
ctxO.world.fieldOre = { freehold: { 7: mined } };
astO.update(0);
restore(ctxO, {
  v: 1,
  world: { time: 0, currentSystem: 'freehold', credits: 10, fear: 0 },
  cargo: [],
});
pin(
  'restore.missingDeletes',
  ctxO.world.fieldOre === undefined,
  `fieldOre=${JSON.stringify(ctxO.world.fieldOre)} (contract 6.3: omitted key must delete live bag)`,
);
astO.update(0);
pin(
  'restore.missingRefill',
  ctxO.asteroids.list[7].ore === seeded[7],
  `ore=${ctxO.asteroids.list[7].ore} seed=${seeded[7]}`,
);
pin('restore.missingSameList', ctxO.asteroids.list === listRef);

restore(ctxO, {
  v: 1,
  world: { time: Number.NaN, currentSystem: 'freehold', fieldOre: [1, 2, 3], credits: 10, fear: 0 },
  cargo: [],
});
pin('sanitize.arrayDeletes', ctxO.world.fieldOre === undefined, `fieldOre=${JSON.stringify(ctxO.world.fieldOre)}`);
pin('sanitize.timeNaN', ctxO.world.time === 0, `time=${ctxO.world.time}`);

restore(ctxO, {
  v: 1,
  world: {
    time: -4,
    currentSystem: 'freehold',
    fieldOre: {
      prototype: { 0: 1 },
      constructor: { 0: 1 },
      freehold: { 0: 2, '01': 3, '1e2': 1, '8': Infinity, '9': Number.NaN, '10': -1 },
    },
    credits: 10,
    fear: 0,
  },
  cargo: [],
});
pin('sanitize.negTime', ctxO.world.time === 0, `time=${ctxO.world.time}`);
pin('sanitize.dropPrototype', ctxO.world.fieldOre && !Object.hasOwn(ctxO.world.fieldOre, 'prototype'));
pin('sanitize.dropCtorSys', ctxO.world.fieldOre && !Object.hasOwn(ctxO.world.fieldOre, 'constructor'));
const fh = ctxO.world.fieldOre && ctxO.world.fieldOre.freehold;
pin('sanitize.keepInt', fh && fh['0'] === 2);
pin('sanitize.dropPadded', fh && fh['01'] === undefined);
pin('sanitize.dropSci', fh && fh['1e2'] === undefined);
pin('sanitize.dropInf', fh && fh['8'] === undefined);
pin('sanitize.dropNaN', fh && fh['9'] === undefined);
pin('sanitize.dropNeg', fh && fh['10'] === undefined);

const ctxX = scopedCtx('freehold');
initPods(ctxX);
const astX = initAsteroids(ctxX);
const idx = ctxX.asteroids.list.findIndex((e) => e.ore > 2);
const seedX = ctxX.asteroids.list[idx].ore;
ctxX.emit('mineHit', { asteroidId: idx, extractPerSec: 50, point: ctxX.asteroids.list[idx].position });
ctxX.lastEvents = ctxX.events;
ctxX.events = [];
astX.update(ORE_TYPES[ctxX.asteroids.list[idx].oreKey].extractResist / 50);
const bag = ctxX.world.fieldOre && ctxX.world.fieldOre.freehold;
pin('extract.sparseOnlyChanged', bag && Object.keys(bag).length === 1 && bag[String(idx)] === seedX - 1, JSON.stringify(ctxX.world.fieldOre));

const snap = snapshot(ctxX);
pin('snap.hasFieldOre', snap.world && snap.world.fieldOre && snap.world.fieldOre.freehold);
pin('world.fields.includes', WORLD_FIELDS.includes('fieldOre'));
pin('noNewStorageKey', astSrc.includes("rimward-save-v1") === false);
const saveSrc = readFileSync(new URL('../../../src/game/save.js', import.meta.url), 'utf8');
pin('save.keyUnchanged', saveSrc.includes("const KEY = 'rimward-save-v1'"));
pin('save.noNewKey', !saveSrc.includes('fieldOre-') && saveSrc.includes("const KEY = 'rimward-save-v1'"));
pin(
  'noNewEvent',
  !astSrc.includes("emit('orbitsReady")
    && !astSrc.includes("emit('fieldOreApplied")
    && !astSrc.includes("emit('saveRestored"),
);

if (fails.length) {
  console.error('FAIL edges', fails.join('\n'));
  process.exit(1);
}
console.log('PASS w69 pr1 edges', `head8=${JSON.stringify(head8)}`);
process.exit(0);
