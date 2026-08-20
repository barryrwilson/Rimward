// Wave 69 PR1 — orbit seed, keep-out, identity, fieldOre persist.
// node --import ./scripts/with-css-stub.mjs out/w69/pr1/probe.mjs
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { SYSTEMS, ORE_TYPES } from '../../../src/game/state.js';
import { initAsteroids } from '../../../src/systems/asteroids.js';
import { restore, WORLD_FIELDS } from '../../../src/game/save.js';
import { PHY } from '../../../src/game/physics.js';
import { cylinderOverlap, torusOverlap } from '../../../src/game/collision.js';
import { PLANET_SLOT_COUNT } from '../../../src/systems/solarsystem.js';
import { initPods } from '../../../src/game/pods.js';

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

const PLANET_SLOTS = [
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

const ctx = scopedCtx('freehold');
const ast = initAsteroids(ctx);
const list = ctx.asteroids.list;
const def = SYSTEMS.freehold;
const [cx, cy, cz] = def.field.center;
const R = Math.hypot(cx, cz);
const az0 = Math.atan2(cz, cx);

pin('id.index', list.every((e, i) => e.id === i));
pin('count', list.length === def.field.count && list.length <= 160);
pin('pos.vector3', list.every((e) => e.position instanceof THREE.Vector3));
const pos0 = list[0].position;
ast.update(0);
pin('pos.identity', list[0].position === pos0 && ctx.asteroids.list === list);

const first8 = list.slice(0, 8).map((e) => [e.oreKey, e.radius, e.ore]);
pin(
  'w51.first8',
  JSON.stringify(first8) === JSON.stringify(W51_FIRST8),
  JSON.stringify(first8),
);

let sum = 0;
let inSector = 0;
const ov = { hit: false, nx: 0, ny: 1, nz: 0, overlap: 0 };
let sunHit = 0;
let stHit = 0;
let gateHit = 0;
let planetHit = 0;
const sunR = def.sunRadius;
const stp = def.station.position;
const planetN = Math.min(def.planetCount, PLANET_SLOT_COUNT, PLANET_SLOTS.length);
for (let i = 0; i < list.length; i++) {
  const e = list[i];
  const hx = Math.hypot(e.position.x, e.position.z);
  sum += hx;
  if (angDiff(Math.atan2(e.position.z, e.position.x), az0) <= 0.7) inSector += 1;
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
    torusOverlap(
      e.position.x, e.position.y, e.position.z, pad,
      p[0], p[1], p[2], PHY.GATE_BORE, PHY.GATE_TUBE,
      ov,
    );
    if (ov.hit) gateHit += 1;
  }
  if (def.hub && def.hub.position) {
    const p = def.hub.position;
    torusOverlap(
      e.position.x, e.position.y, e.position.z, pad,
      p[0], p[1], p[2], PHY.GATE_BORE, PHY.GATE_TUBE,
      ov,
    );
    if (ov.hit) gateHit += 1;
  }
  for (let s = 0; s < planetN; s++) {
    if (Math.abs(hx - PLANET_SLOTS[s].orbitRadius) < PLANET_SLOTS[s].radius + 40) planetHit += 1;
  }
}
const meanR = sum / list.length;
pin('belt.meanR', Math.abs(meanR - R) < def.field.radius + 80, `mean=${meanR} R=${R}`);
pin('belt.notClump', meanR > 200, `mean=${meanR}`);
pin('work.sector', inSector / list.length >= 0.6, `frac=${inSector / list.length}`);
pin('keep.sun', sunHit === 0, `hits=${sunHit}`);
pin('keep.station', stHit === 0, `hits=${stHit}`);
pin('keep.gate', gateHit === 0, `hits=${gateHit}`);
pin('keep.planet', planetHit === 0, `hits=${planetHit}`);

pin('world.fields.fieldOre', WORLD_FIELDS.includes('fieldOre'));
pin('world.fields.noDup', WORLD_FIELDS.filter((k) => k === 'fieldOre').length === 1);

const seeded0 = list[0].ore;
ctx.world.fieldOre = { freehold: { 0: 0 } };
ast.update(0);
pin('overlay.zero', list[0].ore === 0, `ore=${list[0].ore}`);
pin('overlay.listSame', ctx.asteroids.list === list);

ctx.world.fieldOre = { freehold: { 0: 64 } };
ast.update(0);
pin('overlay.noMint', list[0].ore === seeded0, `ore=${list[0].ore} seed=${seeded0}`);

ctx.world.fieldOre = { freehold: { 0: 0 } };
ast.update(0);
pin('overlay.zeroAgain', list[0].ore === 0);

restore(ctx, {
  v: 1,
  world: { time: 0, currentSystem: 'freehold', credits: 350, fear: 0 },
  cargo: [],
});
pin('restore.missingDeletes', ctx.world.fieldOre === undefined, `fieldOre=${JSON.stringify(ctx.world.fieldOre)}`);
ast.update(0);
pin('restore.missingRefill', list[0].ore === seeded0, `ore=${list[0].ore} seed=${seeded0}`);
pin('restore.missingSameList', ctx.asteroids.list === list);

const ctx2 = scopedCtx('freehold');
initPods(ctx2);
const ast2 = initAsteroids(ctx2);
const list2 = ctx2.asteroids.list;
const rawIdx = list2.findIndex((e) => e.oreKey === 'rawOre' && e.ore > 1);
pin('extract.hasRaw', rawIdx >= 0, `idx=${rawIdx}`);
if (rawIdx >= 0) {
  const before = list2[rawIdx].ore;
  ctx2.emit('mineHit', {
    asteroidId: rawIdx,
    extractPerSec: 50,
    point: list2[rawIdx].position,
  });
  ctx2.lastEvents = ctx2.events;
  ctx2.events = [];
  ast2.update(ORE_TYPES.rawOre.extractResist / 50);
  pin('extract.drop', list2[rawIdx].ore === before - 1, `ore=${list2[rawIdx].ore} before=${before}`);
  const bag = ctx2.world.fieldOre && ctx2.world.fieldOre.freehold;
  pin(
    'extract.write',
    bag && bag[String(rawIdx)] === before - 1,
    JSON.stringify(ctx2.world.fieldOre),
  );
}

const ctxS = scopedCtx('freehold');
ctxS.world.time = null;
ctxS.world.fieldOre = JSON.parse('{"__proto__":{"polluted":1},"constructor":{"0":1},"freehold":{"0":3,"nope":1,"99":2,"-1":1},"notASystem":{"0":1}}');
ctxS.world.fieldOre.freehold['1'] = 99;
ctxS.world.fieldOre.freehold['2'] = 1.5;
ctxS.world.fieldOre.freehold['3'] = 0;
ctxS.world.fieldOre.freehold['130'] = 4;
Object.prototype.polluteCheck = undefined;
restore(ctxS, {
  v: 1,
  world: {
    time: null,
    currentSystem: 'freehold',
    fieldOre: ctxS.world.fieldOre,
    credits: 350,
    fear: 0,
  },
  cargo: [],
});
pin('sanitize.time', ctxS.world.time === 0, `time=${ctxS.world.time}`);
pin('sanitize.protoKey', !Object.hasOwn(ctxS.world.fieldOre, '__proto__'));
pin('sanitize.protoPollute', Object.prototype.polluted === undefined);
pin('sanitize.protoOwn', Object.prototype.polluteCheck === undefined);
pin('sanitize.unknownSys', !Object.hasOwn(ctxS.world.fieldOre, 'notASystem'));
pin('sanitize.constructor', !Object.hasOwn(ctxS.world.fieldOre, 'constructor'));
const fh = ctxS.world.fieldOre.freehold;
pin('sanitize.keep0', fh && fh['0'] === 3);
pin('sanitize.drop99', fh && fh['1'] === undefined);
pin('sanitize.dropFrac', fh && fh['2'] === undefined);
pin('sanitize.keepZero', fh && fh['3'] === 0);
pin('sanitize.dropNope', fh && fh.nope === undefined);
pin('sanitize.dropOob', fh && fh['130'] === undefined);
delete Object.prototype.polluteCheck;

const ctxH = scopedCtx('hollowreach');
initAsteroids(ctxH);
const listH = ctxH.asteroids.list;
const defH = SYSTEMS.hollowreach;
const azH = Math.atan2(defH.field.center[2], defH.field.center[0]);
let inH = 0;
for (let i = 0; i < listH.length; i++) {
  if (angDiff(Math.atan2(listH[i].position.z, listH[i].position.x), azH) <= 0.7) inH += 1;
}
pin('sparse.sector', inH / listH.length >= 0.6, `frac=${inH / listH.length}`);
pin('sparse.count', listH.length === defH.field.count);

if (fails.length) {
  console.error('FAIL', fails.join('\n'));
  process.exit(1);
}
console.log('PASS', 'w69 pr1 pins true', `n=${list.length} meanR=${meanR.toFixed(1)} sector=${(inSector / list.length).toFixed(3)}`);
process.exit(0);
