// Wave 69 PR5 — scoped WAVE51 G1/G2 + I (re-aim each frame on list[id]).
// node --import ./scripts/with-css-stub.mjs out/w69/pr5/wave51-gi.mjs
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import {
  SYSTEMS, ORE_TYPES, MINING_LASERS, createShipState,
} from '../../../src/game/state.js';
import { initAsteroids } from '../../../src/systems/asteroids.js';
import { initCombat } from '../../../src/systems/combat.js';
import { initPods } from '../../../src/game/pods.js';

const dt = 1 / 60;
const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeCtx2d() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {
      createRadialGradient: () => gradient,
      createLinearGradient: () => gradient,
      fillRect() {},
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

if (!globalThis.window) {
  globalThis.window = { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1 };
}
if (!globalThis.document) {
  globalThis.document = {
    createElement(tag) {
      const el = {
        tagName: String(tag).toUpperCase(),
        style: {},
        width: 0,
        height: 0,
        getContext() { return makeCtx2d(); },
      };
      return el;
    },
  };
}

function scopedCtx(systemId) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
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

function w51ClearLine(list, cand, gap, range) {
  const nose = new THREE.Vector3(cand.position.x, cand.position.y, cand.position.z + cand.radius + gap - 2.4);
  const dir = new THREE.Vector3(0, 0, -1);
  const oc = new THREE.Vector3();
  let bestT = range;
  let best = null;
  for (const a of list) {
    oc.subVectors(nose, a.position);
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
  return best === cand;
}

function w51AimAt(ctxS, rock, gap) {
  ctxS.ship.object.position.set(rock.position.x, rock.position.y, rock.position.z + rock.radius + gap);
  ctxS.ship.object.quaternion.identity();
  ctxS.ship.velocity.set(0, 0, 0);
  ctxS.targets.current = null;
  ctxS.flags.camera = 'first';
  ctxS.flags.firstPerson = true;
  ctxS.targets.reticleScreen = { x: 0, y: 0 };
  ctxS.camera.position.copy(ctxS.ship.object.position);
  ctxS.camera.quaternion.identity();
  ctxS.camera.up.set(0, 1, 0);
  ctxS.camera.updateMatrixWorld();
}

function w51step(ctxS, updates, n, track) {
  const out = [];
  const id = track && Number.isInteger(track.id) ? track.id : -1;
  const gap = track && Number.isFinite(track.gap) ? track.gap : 20;
  for (let i = 0; i < n; i++) {
    if (id >= 0) {
      const rock = ctxS.asteroids.list[id];
      if (rock) w51AimAt(ctxS, rock, gap);
    }
    ctxS.elapsed += dt;
    ctxS.world.time += dt;
    for (const u of updates) u.update(dt);
    out.push(...ctxS.events);
    ctxS.lastEvents = ctxS.events;
    ctxS.events = [];
  }
  return out;
}

const ctxG = scopedCtx('freehold');
const astG = initAsteroids(ctxG);
const combatG = initCombat(ctxG);
initPods(ctxG);
ctxG.player = createShipState('light');
ctxG.ship.object = new THREE.Object3D();
ctxG.scene.add(ctxG.ship.object);
ctxG.world.miningLaser = 0;
ctxG.lastEvents = [{ type: 'systemLoaded', to: 'freehold' }];
w51step(ctxG, [astG, combatG], 1);
const w51hardRock = ctxG.asteroids.list.find((e) => e.hardness > 1
  && w51ClearLine(ctxG.asteroids.list, e, 20, MINING_LASERS[0].range)) ?? null;
pin('g.hardRock', !!w51hardRock);

let mk4Cuts = false;
let oreDrops = false;
let blockedFired = false;
let oreUntouched = false;
if (w51hardRock) {
  w51AimAt(ctxG, w51hardRock, 20);
  ctxG.input.weaponGroup = 3;
  ctxG.input.fireHeld = true;
  const oreBefore = ctxG.asteroids.list[w51hardRock.id].ore;
  const blockedEvs = w51step(ctxG, [astG, combatG], 72, { id: w51hardRock.id, gap: 20 });
  ctxG.input.fireHeld = false;
  const blockedFor = blockedEvs.filter((e) => e.type === 'mineBlocked' && e.asteroidId === w51hardRock.id);
  blockedFired = blockedFor.length >= 1;
  oreUntouched = ctxG.asteroids.list[w51hardRock.id].ore === oreBefore;
  ctxG.world.miningLaser = 3;
  ctxG.input.fireHeld = true;
  const hitEvs = w51step(ctxG, [astG, combatG], 90, { id: w51hardRock.id, gap: 20 });
  ctxG.input.fireHeld = false;
  const hits = hitEvs.filter((e) => e.type === 'mineHit' && e.asteroidId === w51hardRock.id);
  mk4Cuts = hits.length > 0;
  oreDrops = ctxG.asteroids.list[w51hardRock.id].ore < oreBefore;
}

pin('g1.blockedFired', blockedFired);
pin('g1.oreUntouched', oreUntouched);
pin('g2.mk4Cuts', mk4Cuts);
pin('g2.oreDrops', oreDrops);

const ctxI = scopedCtx('freehold');
const astI = initAsteroids(ctxI);
const combatI = initCombat(ctxI);
initPods(ctxI);
ctxI.player = createShipState('light');
ctxI.ship.object = new THREE.Object3D();
ctxI.scene.add(ctxI.ship.object);
ctxI.world.miningLaser = 3;
ctxI.input.weaponGroup = 3;
const W51_FIRE_FRAMES = 120;
const podUnits = () => ctxI.pods.reduce((n, p) => n + p.contents.reduce((m, c) => m + c.units, 0), 0);
const softRock = ctxI.asteroids.list.find((e) => e.oreKey === 'rawOre' && e.ore >= 8
  && w51ClearLine(ctxI.asteroids.list, e, 20, MINING_LASERS[3].range)) ?? null;
const resistRock = ctxI.asteroids.list.find((e) => e.oreKey === 'chromeSalt'
  && w51ClearLine(ctxI.asteroids.list, e, 20, MINING_LASERS[3].range)) ?? null;
let softUnits = 0;
let resistUnits = 0;
if (softRock) {
  w51AimAt(ctxI, softRock, 20);
  ctxI.input.fireHeld = true;
  w51step(ctxI, [astI, combatI], W51_FIRE_FRAMES, { id: softRock.id, gap: 20 });
  ctxI.input.fireHeld = false;
  softUnits = podUnits();
}
ctxI.pods.length = 0;
if (resistRock) {
  w51AimAt(ctxI, resistRock, 20);
  ctxI.input.fireHeld = true;
  w51step(ctxI, [astI, combatI], W51_FIRE_FRAMES, { id: resistRock.id, gap: 20 });
  ctxI.input.fireHeld = false;
  resistUnits = podUnits();
}

pin('i.softFound', !!softRock);
pin('i.resistFound', !!resistRock);
pin('i.softRunProductive', softUnits >= 7, `rawOre=${softUnits}u`);
pin('i.resistRunProductive', resistUnits >= 1, `chromeSalt=${resistUnits}u`);
pin('i.resistStrictlySlower', resistUnits < softUnits, `raw=${softUnits} chrome=${resistUnits}`);

console.log(JSON.stringify({
  mk4Cuts, oreDrops, blockedFired, oreUntouched, softUnits, resistUnits,
}));

if (fails.length) {
  console.error('FAIL', fails.join('\n'));
  process.exit(1);
}
console.log('PASS wave51 G2/I re-aim');
process.exit(0);
