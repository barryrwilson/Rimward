// Wave 69 PR5 — AST boot pins (same checks as scripts/boot-test.mjs WAVE69).
// node --import ./scripts/with-css-stub.mjs out/w69/pr5/probe.mjs
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCtx } from '../../../src/core/ctx.js';
import { SYSTEMS } from '../../../src/game/state.js';
import { initAsteroids } from '../../../src/systems/asteroids.js';
import { WORLD_FIELDS } from '../../../src/game/save.js';
import { PHY } from '../../../src/game/physics.js';

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
  ctx.world.time = 0;
  return ctx;
}

function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const boot = readFileSync(join(root, 'scripts/boot-test.mjs'), 'utf8');
const jumpSrc = readFileSync(join(root, 'src/game/jump.js'), 'utf8');
const hudSrc = readFileSync(join(root, 'src/systems/hud.js'), 'utf8');
const controlsSrc = readFileSync(join(root, 'src/systems/controls.js'), 'utf8');

pin('boot.hasWave69', boot.includes("console.log('wave69 ast:'"));
pin('boot.failTag', boot.includes('WAVE69 AST FAIL'));

const ctx = scopedCtx('freehold');
ctx.config.world.sunRadius = SYSTEMS.freehold.sunRadius;
const ast = initAsteroids(ctx);
const list = ctx.asteroids.list;
const field = SYSTEMS.freehold.field;
const [cx, , cz] = field.center;
const R = Math.hypot(cx, cz);
const az0 = Math.atan2(cz, cx);
let sumR = 0;
let inSector = 0;
let sunHit = 0;
const heatR = ctx.config.world.sunRadius * PHY.SUN_HEAT_MULT;
for (let i = 0; i < list.length; i++) {
  const p = list[i].position;
  const hx = Math.hypot(p.x, p.z);
  sumR += hx;
  if (angDiff(Math.atan2(p.z, p.x), az0) <= 0.7) inSector += 1;
  if (hx < heatR) sunHit += 1;
}
const meanR = list.length ? sumR / list.length : 0;
const first8 = list.slice(0, 8).map((e) => [e.oreKey, e.radius, e.ore]);

const seeded0 = list[0] ? list[0].ore : NaN;
ctx.world.fieldOre = { freehold: { '0': 0 } };
ast.update(0);
const oreZeroed = list[0] && list[0].ore === 0;
delete ctx.world.fieldOre;
ast.update(0);
let oreRefilled = list[0] && list[0].ore === seeded0;
if (!oreRefilled) {
  ctx.flags.saveRestored = true;
  ast.update(0);
  oreRefilled = list[0] && list[0].ore === seeded0;
}

let cap160 = false;
const savedCount = field.count;
try {
  field.count = 200;
  const ctxCap = scopedCtx('freehold');
  ctxCap.config.world.sunRadius = ctx.config.world.sunRadius;
  initAsteroids(ctxCap);
  cap160 = ctxCap.asteroids.list.length === 160;
} finally {
  field.count = savedCount;
}

const w69 = {
  idEqIndex: list.length > 0 && list.every((e, i) => e.id === i),
  countFreehold: list.length === field.count && field.count === 130 && list.length <= 160,
  notClump: meanR > 0.6 * R,
  workSector: list.length > 0 && inSector / list.length >= 0.6,
  wave51tuples: JSON.stringify(first8) === JSON.stringify(W51_FIRST8),
  fieldOreWorldField: WORLD_FIELDS.includes('fieldOre'),
  depleteRoundtrip: oreZeroed && oreRefilled,
  sunMiss: Number.isFinite(heatR) && heatR > 0 && sunHit === 0,
  cap160,
  beltLine: jumpSrc.includes('Belt lies'),
  hudMineCue: hudSrc.includes('Mine · belt'),
  staleLock: controlsSrc.includes('dropStaleRockLock'),
};

console.log('wave69 ast:', JSON.stringify(w69));
for (const [k, v] of Object.entries(w69)) pin(k, v === true, String(v));
pin('allBoolean', Object.values(w69).every((v) => typeof v === 'boolean'));
pin('fieldCountRestored', field.count === 130, `count=${field.count}`);

if (fails.length) {
  console.error('FAIL', fails.join('\n'));
  process.exit(1);
}
console.log('PASS', 'w69 pr5 pins true', `n=${list.length} meanR=${meanR.toFixed(1)} R=${R.toFixed(1)} sector=${(inSector / list.length).toFixed(3)}`);
process.exit(0);
