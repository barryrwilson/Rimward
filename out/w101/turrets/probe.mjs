/**
 * Wave 101 NPC turret vsNPC probe. Node-only. No Vite.
 * Live-NPC spawn, missing-target drop, vsPlayer still works, cap 4 shared,
 * Unknowable shooter drop, Wave 57 player hull, lastAttacker !== player.
 */
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { initCombat } from '../../../src/systems/combat.js';
import { canNpcTurret } from '../../../src/systems/npc.js';
import { canSeat } from '../../../src/game/weapon-fit.js';
import { createShipState, applyHit, WEAPONS } from '../../../src/game/state.js';
import {
  npcFireToast,
  INCOMING_FIRE_TOAST,
  INCOMING_DART_TOAST,
} from '../../../src/game/npc-fire-toast.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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

function live(role, classKey, faction, extra = {}) {
  return {
    role,
    record: { classKey, role, faction },
    state: { classKey, faction, hull: 100, hullMax: 100, screen: 100, screenMax: 100 },
    ai: {
      role,
      scratched: extra.scratched === true,
      lastAttacker: extra.lastAttacker ?? null,
      target: extra.target ?? 'player',
      phase: 'attack',
    },
  };
}

const hunt = { world: { reputation: { freehold: -12 } } };
const here = dirname(fileURLToPath(import.meta.url));
const combatSrc = readFileSync(join(here, '../../../src/systems/combat.js'), 'utf8');
const npcSrc = readFileSync(join(here, '../../../src/systems/npc.js'), 'utf8');

pin('src.npcCap4', combatSrc.includes('const NPC_TURRET_LIVE_CAP = 4')
  && combatSrc.includes("fromPlayer === false && p.wkey === 'turret'"));
pin('src.explicitPlayer', npcSrc.includes("weapon: 'turret', target: 'player'"));
pin('src.vsPlayerContinue', combatSrc.includes("if (e.target !== 'player') continue"));
pin('src.vsNpcFalse', combatSrc.includes('bolt.vsPlayer = false'));
pin('gate.heavyPatrol', canNpcTurret(hunt, live('patrol', 'heavy', 'freehold')) === true);
pin('gate.cutterPirate', canNpcTurret(hunt, live('pirate', 'cutter', 'redledger')) === false);
pin('gate.trader', canNpcTurret(hunt, live('trader', 'heavy', 'veridian')) === false);
pin('gate.unknowable', canNpcTurret(hunt, live('ace', 'ace', 'unknowables')) === false);
pin('gate.seat0', canSeat('cutter', 'turret') === false);
pin('huntUnchanged', !npcSrc.slice(
  npcSrc.indexOf('export function mayHuntPlayer'),
  npcSrc.indexOf('function canNpcDart'),
).includes('turret'));

const fly = { elapsed: 10, flags: { docked: false }, gate: { jumping: false } };
pin('toast.vsPlayer', npcFireToast(
  { weapon: 'turret', target: 'player' },
  fly,
  { lastIncomingDartAt: -1e9, lastIncomingFireAt: -1e9 },
)?.text === INCOMING_FIRE_TOAST);
pin('toast.vsNpcNull', npcFireToast(
  { weapon: 'turret', target: { state: {} } },
  fly,
  { lastIncomingDartAt: -1e9, lastIncomingFireAt: -1e9 },
) === null);
pin('toast.dartUnchanged', npcFireToast(
  { weapon: 'missile', target: 'player' },
  fly,
  { lastIncomingDartAt: -1e9, lastIncomingFireAt: -1e9 },
)?.text === INCOMING_DART_TOAST);

function countNpcTurret(scene) {
  let n = 0;
  scene.traverse((o) => {
    if (o.visible && o.userData && o.userData.wkey === 'turret' && o.userData.fromPlayer === false) n++;
  });
  return n;
}
function harness() {
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
  const obj = new THREE.Object3D();
  obj.position.set(0, 0, -80);
  scene.add(obj);
  const ship = { object: obj, state: createShipState('heavy', { faction: 'freehold', name: 'N' }) };
  return { scene, c, combat, ship };
}

{
  const h = harness();
  h.c.emit('npcFire', { ship: h.ship, weapon: 'turret' });
  h.combat.update(dt);
  pin('combat.missingTargetDrops', countNpcTurret(h.scene) === 0);
}
{
  const h = harness();
  h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: 'player' });
  h.combat.update(dt);
  pin('combat.vsPlayerWorks', countNpcTurret(h.scene) === 1);
}
{
  const h = harness();
  const tgt = { object: new THREE.Object3D(), state: createShipState('cutter', { name: 'T' }) };
  tgt.object.position.set(0, 0, 40);
  h.scene.add(tgt.object);
  h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: tgt });
  h.combat.update(dt);
  pin('combat.vsNpcSpawns', countNpcTurret(h.scene) === 1);
}
{
  const h = harness();
  const dead = { object: new THREE.Object3D(), state: createShipState('cutter', { name: 'D' }) };
  dead.state.destroyed = true;
  dead.object.position.set(0, 0, 40);
  h.scene.add(dead.object);
  h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: dead });
  h.combat.update(dt);
  pin('combat.destroyedDrops', countNpcTurret(h.scene) === 0);
}
{
  const h = harness();
  h.ship.state.faction = 'unknowables';
  const tgt = { object: new THREE.Object3D(), state: createShipState('cutter', { name: 'T' }) };
  tgt.object.position.set(0, 0, 40);
  h.scene.add(tgt.object);
  h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: tgt });
  h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: 'player' });
  h.combat.update(dt);
  pin('combat.unkShooterDrops', countNpcTurret(h.scene) === 0);
}
{
  const h = harness();
  const tgt = { object: new THREE.Object3D(), state: createShipState('cutter', { name: 'T' }) };
  tgt.object.position.set(0, 0, 40);
  h.scene.add(tgt.object);
  for (let i = 0; i < 3; i++) h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: 'player' });
  for (let i = 0; i < 2; i++) h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: tgt });
  h.combat.update(dt);
  pin('combat.npcCap4shared', countNpcTurret(h.scene) === 4);
}
{
  const h = harness();
  const hull0 = h.c.player.hull;
  const screen0 = h.c.player.screen;
  const tgt = {
    object: new THREE.Object3D(),
    state: createShipState('frigate', { name: 'T' }),
    ai: { lastAttacker: null, role: 'trader' },
  };
  tgt.object.position.set(0, 0, 0);
  h.scene.add(tgt.object);
  h.c.ships.push(tgt);
  for (let i = 0; i < 4; i++) h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: tgt });
  h.combat.update(dt);
  pin('combat.vsNpcLiveCap', countNpcTurret(h.scene) === 4);
  for (let i = 0; i < 40; i++) h.combat.update(dt);
  pin('combat.playerUnbruised', h.c.player.hull === hull0 && h.c.player.screen === screen0);
  pin('combat.lastAttackerNotPlayer', tgt.ai.lastAttacker !== 'player' && tgt.ai.lastAttacker != null);
}
{
  const unk = createShipState('heavy', { faction: 'unknowables', name: 'U' });
  const hull0 = unk.hull;
  const evs = applyHit(unk, { damage: WEAPONS.turret.damage, family: 'turret', facet: 'fore', now: 1 });
  pin('unknowable.miss', evs.length === 0 && unk.hull === hull0 && WEAPONS.turret.beam !== true);
}

if (failures.length) {
  console.log(`PROBE FAIL — ${failures.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
