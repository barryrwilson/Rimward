// Wave 69 PR3 — stale rock lock, mining ids after orbit motion.
// node --import ./scripts/with-css-stub.mjs out/w69/pr3/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { SYSTEMS } from '../../../src/game/state.js';
import { initAsteroids } from '../../../src/systems/asteroids.js';
import { initControls } from '../../../src/systems/controls.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

if (!globalThis.window) {
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 720,
    addEventListener() {},
    removeEventListener() {},
  };
} else {
  if (!globalThis.window.innerWidth) globalThis.window.innerWidth = 1280;
  if (!globalThis.window.innerHeight) globalThis.window.innerHeight = 720;
  if (!globalThis.window.addEventListener) globalThis.window.addEventListener = () => {};
}

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

/** Same ray-sphere pick as combat.js updateMining (list[i].position, bestEntry.id). */
function closestSphere(list, origin, dir, range) {
  const oc = new THREE.Vector3();
  let bestT = range;
  let best = null;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    oc.subVectors(origin, a.position);
    const b = oc.dot(dir);
    const c = oc.lengthSq() - a.radius * a.radius;
    const disc = b * b - c;
    if (disc < 0) continue;
    const sq = Math.sqrt(disc);
    let th = -b - sq;
    if (th < 0) th = -b + sq;
    if (th < 0 || th > bestT) continue;
    bestT = th;
    best = a;
  }
  return best;
}

function nearestSoftRock(list, fromPos) {
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a || (a.hardness ?? 1) > 1) continue;
    if ((a.ore ?? 1) <= 0) continue;
    const p = a.position;
    if (!p) continue;
    const dx = p.x - fromPos.x;
    const dy = p.y - fromPos.y;
    const dz = p.z - fromPos.z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) {
      best = a;
      bestD = d;
    }
  }
  return best;
}

const combatSrc = src('src/systems/combat.js');
const npcSrc = src('src/systems/npc.js');
const worldSrc = src('src/game/world.js');
const astSrc = src('src/systems/asteroids.js');
const controlsSrc = src('src/systems/controls.js');
const collisionSrc = src('src/game/collision.js');

pin(
  'combat.ray.livePosition',
  combatSrc.includes('_oc.subVectors(_nose, a.position)')
    && combatSrc.includes('bestEntry = a')
    && combatSrc.includes('asteroidId: bestEntry.id'),
);
pin(
  'npc.nearestSoftRock.live',
  npcSrc.includes('function nearestSoftRock')
    && npcSrc.includes('(a.hardness ?? 1) > 1')
    && npcSrc.includes('(a.ore ?? 1) <= 0')
    && npcSrc.includes('const p = a.position')
    && npcSrc.includes('asteroidId: rock.id'),
);
pin(
  'world.fieldPoint.center',
  worldSrc.includes('function fieldPoint(def)')
    && /const c = f && f\.center/.test(worldSrc),
);
pin('asteroids.no.targets.write', !/ctx\.targets/.test(astSrc));
pin(
  'controls.dropStaleRockLock',
  controlsSrc.includes('function dropStaleRockLock')
    && controlsSrc.includes("evs[i].type === 'systemLoaded'"),
);
pin('collision.unedited.collect', collisionSrc.includes('collectBodies'));

// --- Stale rock lock ---
const ctxA = scopedCtx('freehold', 0);
const astA = initAsteroids(ctxA);
const ctlA = initControls(ctxA);
const listA0 = ctxA.asteroids.list;
const oldRock = listA0[0];
pin('lock.setup.rock', !!(oldRock && oldRock.position && !oldRock.object && !oldRock.state));
ctxA.targets.current = oldRock;
ctxA.emit('systemLoaded', { to: 'veridian' });
ctxA.lastEvents = ctxA.events;
ctxA.events = [];
astA.update(0.016);
ctlA.update(0.016);
pin('lock.cleared.afterSwap', ctxA.targets.current === null);
pin('lock.oldNotInNewList', ctxA.asteroids.list.indexOf(oldRock) < 0);
pin('lock.newList.identityDied', ctxA.asteroids.list[0] !== oldRock);

const ctxB = scopedCtx('freehold', 0);
const astB = initAsteroids(ctxB);
const ctlB = initControls(ctxB);
const shipLock = {
  object: new THREE.Object3D(),
  state: { destroyed: false },
};
ctxB.targets.current = shipLock;
ctxB.emit('systemLoaded', { to: 'veridian' });
ctxB.lastEvents = ctxB.events;
ctxB.events = [];
astB.update(0.016);
ctlB.update(0.016);
pin('lock.shipKept', ctxB.targets.current === shipLock);

const ctxC = scopedCtx('freehold', 0);
const astC = initAsteroids(ctxC);
const ctlC = initControls(ctxC);
const liveRock = ctxC.asteroids.list[0];
ctxC.targets.current = liveRock;
ctxC.lastEvents = [];
astC.update(0.016);
ctlC.update(0.016);
pin('lock.liveRockKept', ctxC.targets.current === liveRock);

// Same-system rebuild (systemLoaded to the current id) also replaces the list.
const ctxD = scopedCtx('freehold', 0);
const astD = initAsteroids(ctxD);
const ctlD = initControls(ctxD);
const beforeD = ctxD.asteroids.list[0];
ctxD.targets.current = beforeD;
ctxD.lastEvents = [{ type: 'systemLoaded', to: 'freehold' }];
astD.update(0.016);
ctlD.update(0.016);
pin('lock.sameSystemRebuild', ctxD.targets.current === null);
pin('lock.sameSystem.newObject', ctxD.asteroids.list[0] !== beforeD);

// Rock spliced out of the live list (no event).
const ctxE = scopedCtx('freehold', 0);
initAsteroids(ctxE);
const ctlE = initControls(ctxE);
const gone = ctxE.asteroids.list[2];
ctxE.targets.current = gone;
ctxE.asteroids.list = ctxE.asteroids.list.filter((a) => a !== gone);
ctxE.lastEvents = [];
ctlE.update(0.016);
pin('lock.droppedWhenMissing', ctxE.targets.current === null);

// --- Mining ids after motion ---
const ctxM = scopedCtx('freehold', 0);
const astM = initAsteroids(ctxM);
const listM = ctxM.asteroids.list;
pin('id.index.t0', listM.every((e, i) => e.id === i));
const pickI = 4;
const posRef = listM[pickI].position;
const xyz0 = [posRef.x, posRef.y, posRef.z];
ctxM.world.time = 180;
astM.update(0.016);
pin('id.index.afterMotion', listM.every((e, i) => e.id === i));
pin('pos.sameVector3', listM[pickI].position === posRef);
pin(
  'pos.moved',
  Math.hypot(posRef.x - xyz0[0], posRef.y - xyz0[1], posRef.z - xyz0[2]) > 1e-3,
);

const rock = listM[pickI];
const gap = 20;
const origin = new THREE.Vector3(
  rock.position.x,
  rock.position.y,
  rock.position.z + rock.radius + gap,
);
const dir = new THREE.Vector3(0, 0, -1);
const range = 90;
const hit = closestSphere(listM, origin, dir, range);
pin('mine.closest.isRock', hit === rock);
pin('mine.asteroidId', hit != null && hit.id === pickI && hit.id === listM[pickI].id);

// If the line is blocked, still require the winner's id === its list index.
if (hit && hit !== rock) {
  pin('mine.hit.idEqualsIndex', hit.id === listM[hit.id].id && listM[hit.id] === hit);
}

const def = SYSTEMS.freehold;
const fieldCenter = new THREE.Vector3(def.field.center[0], def.field.center[1], def.field.center[2]);
const soft = nearestSoftRock(listM, fieldCenter);
pin(
  'miner.workSectorSoft',
  !!(soft && (soft.hardness ?? 1) <= 1 && (soft.ore ?? 0) > 0 && Number.isInteger(soft.id) && listM[soft.id] === soft),
);
const softCount = listM.filter((a) => (a.hardness ?? 1) <= 1 && (a.ore ?? 0) > 0).length;
pin('miner.softExists', softCount > 0);

const combatHelpersExported = /export function (updateMining|closestAsteroid)/.test(combatSrc);
pin('combat.helpers.notExported', !combatHelpersExported);
// Combat init needs document canvas textures. Ray clone + source trace is the pin.

if (fails.length) {
  console.log('FAIL w69 pr3 pins', fails);
  process.exit(1);
}
console.log('PASS w69 pr3 pins true n=' + listM.length + ' soft=' + softCount);
