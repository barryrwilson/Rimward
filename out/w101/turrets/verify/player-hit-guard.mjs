/**
 * Extra vsNPC guard: playerHit must stay 0; hull/screen unchanged.
 * Node-only. Writes next to this file.
 */
import * as THREE from 'three';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCtx } from '../../../../src/core/ctx.js';
import { initCombat } from '../../../../src/systems/combat.js';
import { createShipState } from '../../../../src/game/state.js';

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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 5000);
const renderer = { domElement: {}, setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
const c = createCtx({ scene, camera, renderer });
c.player = createShipState('heavy', { name: 'P' });
c.ship.object = new THREE.Object3D();
c.ship.object.position.set(0, 0, 0);
scene.add(c.ship.object);
c.world.turret = 'auto';
c.flags.docked = false;
const combat = initCombat(c);

const shooterObj = new THREE.Object3D();
shooterObj.position.set(0, 0, -80);
scene.add(shooterObj);
const shooter = { object: shooterObj, state: createShipState('heavy', { faction: 'freehold', name: 'N' }) };

const tgt = {
  object: new THREE.Object3D(),
  state: createShipState('frigate', { name: 'T' }),
  ai: { lastAttacker: null, role: 'trader' },
};
tgt.object.position.set(0, 0, 0);
scene.add(tgt.object);
c.ships.push(tgt);

const hull0 = c.player.hull;
const screen0 = c.player.screen;
let playerHits = 0;
let npcHits = 0;
function tally() {
  for (let i = 0; i < c.events.length; i++) {
    const t = c.events[i].type;
    if (t === 'playerHit') playerHits++;
    else if (t === 'npcHit') npcHits++;
  }
  c.events.length = 0;
}

for (let i = 0; i < 4; i++) c.emit('npcFire', { ship: shooter, weapon: 'turret', target: tgt });
combat.update(dt);
tally();
for (let i = 0; i < 40; i++) {
  combat.update(dt);
  tally();
}

pin('noPlayerHitEvent', playerHits === 0);
pin('npcHitFired', npcHits > 0);
pin('playerHullUnchanged', c.player.hull === hull0);
pin('playerScreenUnchanged', c.player.screen === screen0);
pin('lastAttackerNotPlayer', tgt.ai.lastAttacker !== 'player' && tgt.ai.lastAttacker != null);

const here = dirname(fileURLToPath(import.meta.url));
const report = {
  ok: failures.length === 0,
  failures,
  playerHits,
  npcHits,
  lastAttackerIsPlayer: tgt.ai.lastAttacker === 'player',
};
writeFileSync(join(here, 'player-hit-guard.json'), JSON.stringify(report, null, 2));
if (failures.length) {
  console.log(`PLAYER-HIT GUARD FAIL — ${failures.join(', ')}`);
  process.exit(1);
}
console.log('PLAYER-HIT GUARD PASS');
