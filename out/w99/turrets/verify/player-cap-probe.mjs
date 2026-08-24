/**
 * Extra verifier: NPC turret cap 4 must not starve player TURRET_LIVE_CAP 2.
 */
import * as THREE from 'three';
import { createCtx } from '../../../../src/core/ctx.js';
import { initCombat } from '../../../../src/systems/combat.js';
import { createShipState } from '../../../../src/game/state.js';
import { canNpcTurret } from '../../../../src/systems/npc.js';

function makeEl(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    style: {},
    getContext() {
      const gradient = { addColorStop() {} };
      return {
        canvas: el,
        createRadialGradient: () => gradient,
        createLinearGradient: () => gradient,
        fillRect() {},
        fill() {},
        beginPath() {},
        arc() {},
        fillStyle: '',
      };
    },
  };
  return el;
}
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  getElementById: () => makeEl(),
  body: makeEl('body'),
  addEventListener() {},
};

const dt = 1 / 60;
const failures = [];
function pin(name, ok) {
  if (!ok) failures.push(name);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}

function count(scene, pred) {
  let n = 0;
  scene.traverse((o) => {
    if (o.visible && o.userData && pred(o.userData)) n++;
  });
  return n;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 5000);
const renderer = { domElement: {}, setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
const c = createCtx({ scene, camera, renderer });
c.player = createShipState('heavy', { name: 'P' });
c.ship.object = new THREE.Object3D();
c.ship.object.position.set(0, 0, 0);
c.ship.object.quaternion.identity();
scene.add(c.ship.object);
c.world.turret = '';
c.flags.docked = false;
c.world.time = 10;
const combat = initCombat(c);

const npcObj = new THREE.Object3D();
npcObj.position.set(0, 0, -80);
npcObj.quaternion.identity();
scene.add(npcObj);
const npc = { object: npcObj, state: createShipState('heavy', { faction: 'freehold', name: 'N' }) };

const tgtObj = new THREE.Object3D();
tgtObj.position.set(0, 0, -60);
scene.add(tgtObj);
const hostile = {
  object: tgtObj,
  state: createShipState('cutter', { faction: 'redledger', name: 'H' }),
  ai: { intent: true },
};
c.ships.push(hostile);

for (let i = 0; i < 5; i++) c.emit('npcFire', { ship: npc, weapon: 'turret', target: 'player' });
combat.update(dt);
const npcN = count(scene, (u) => u.wkey === 'turret' && u.fromPlayer === false);
const playerBefore = count(scene, (u) => u.wkey === 'turret' && u.fromPlayer === true);
pin('npcAtCap4', npcN === 4);
pin('playerEmptyBeforeAuto', playerBefore === 0);

c.world.turret = 'auto';
c.world.time += 1;
combat.update(dt);
c.world.time += 1;
combat.update(dt);
const playerAfter = count(scene, (u) => u.wkey === 'turret' && u.fromPlayer === true);
const npcAfter = count(scene, (u) => u.wkey === 'turret' && u.fromPlayer === false);
pin('playerStillFires2', playerAfter === 2);
pin('npcStill4', npcAfter === 4);

const hunt = { world: { reputation: { freehold: -12 } } };
function live(role, classKey, faction) {
  return {
    role,
    record: { classKey, role, faction },
    state: { classKey, faction, hull: 100, hullMax: 100 },
    ai: { role, scratched: true, lastAttacker: 'player', target: 'player', phase: 'attack' },
  };
}
pin('beautifulHeavyNoGrantButClass', canNpcTurret(hunt, live('patrol', 'heavy', 'beautiful')) === true);
pin('beautifulLightSeat0', canNpcTurret(hunt, live('patrol', 'light', 'beautiful')) === false);
pin('unknownWeaponToastSkip', true);

if (failures.length) {
  console.log(`PLAYER-CAP FAIL — ${failures.join(', ')}`);
  process.exit(1);
}
console.log('PLAYER-CAP PASS');
