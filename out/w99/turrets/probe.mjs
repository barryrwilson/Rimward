/**
 * Wave 99 NPC turret probe. Node-only. No Vite.
 * Gate, missing-target drop, cap 4, toast matrix, seat-0 never.
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
  FIRE_TOAST_GAP,
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
      target: 'player',
      phase: 'attack',
    },
  };
}

const hunt = { world: { reputation: { freehold: -12 } } };
const calm = { world: { reputation: { freehold: 0 } } };

const here = dirname(fileURLToPath(import.meta.url));
const combatSrc = readFileSync(join(here, '../../../src/systems/combat.js'), 'utf8');
pin('src.npcCap4', combatSrc.includes('const NPC_TURRET_LIVE_CAP = 4')
  && combatSrc.includes("fromPlayer === false && p.wkey === 'turret'"));
pin('src.playerCapFiltered', combatSrc.includes('p.active && p.fromPlayer && p.wkey === \'turret\''));

pin('gate.heavyPatrol', canNpcTurret(hunt, live('patrol', 'heavy', 'freehold')) === true);
pin('gate.ace', canNpcTurret(hunt, live('ace', 'ace', 'redledger')) === true);
pin('gate.frigate', canNpcTurret(hunt, live('patrol', 'frigate', 'freehold')) === true);
pin('gate.cutterPirate', canNpcTurret(hunt, live('pirate', 'cutter', 'redledger')) === false);
pin('gate.seat0', canSeat('cutter', 'turret') === false && canSeat('light', 'turret') === false);
pin('gate.trader', canNpcTurret(hunt, live('trader', 'heavy', 'veridian')) === false);
pin('gate.miner', canNpcTurret(hunt, live('miner', 'heavy', 'veridian')) === false);
pin('gate.unknowable', canNpcTurret(hunt, live('ace', 'ace', 'unknowables')) === false);
pin('gate.unknownClass', canNpcTurret(hunt, live('pirate', 'godhull', 'redledger')) === false);
pin('gate.calmPatrol', canNpcTurret(calm, live('patrol', 'heavy', 'freehold')) === false);

const fly = { elapsed: 10, flags: { docked: false }, gate: { jumping: false } };
function row(e, mem) {
  const t = npcFireToast(e, fly, mem || { lastIncomingDartAt: -1e9, lastIncomingFireAt: -1e9 });
  return t;
}
pin('toast.turretIncomingFire', row({ weapon: 'turret', target: 'player' })?.text === INCOMING_FIRE_TOAST
  && row({ weapon: 'turret', target: 'player' })?.cls === 'warn');
pin('toast.turretOmitDrops', row({ weapon: 'turret' }) === null);
pin('toast.dartUnchanged', row({ weapon: 'missile', target: 'player' })?.text === INCOMING_DART_TOAST);
{
  const mem = { lastIncomingDartAt: -1e9, lastIncomingFireAt: -1e9 };
  const a = npcFireToast({ weapon: 'cannon', target: 'player' }, { ...fly, elapsed: 40 }, mem);
  const b = npcFireToast({ weapon: 'turret', target: 'player' }, { ...fly, elapsed: 41 }, mem);
  const c = npcFireToast({ weapon: 'turret', target: 'player' }, { ...fly, elapsed: 40 + FIRE_TOAST_GAP }, mem);
  pin('toast.sharedFireClock', a?.text === INCOMING_FIRE_TOAST && b === null && c?.text === INCOMING_FIRE_TOAST);
}
pin('toast.dockSuppress', npcFireToast(
  { weapon: 'turret', target: 'player' },
  { elapsed: 50, flags: { docked: true }, gate: { jumping: false } },
  { lastIncomingDartAt: -1e9, lastIncomingFireAt: -1e9 },
) === null);

function countNpcTurret(scene) {
  let n = 0;
  scene.traverse((o) => {
    if (o.visible && o.userData && o.userData.wkey === 'turret' && o.userData.fromPlayer === false) n++;
  });
  return n;
}
function countCannon(scene) {
  let n = 0;
  scene.traverse((o) => {
    if (o.visible && o.userData && o.userData.wkey === 'cannon') n++;
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
  const turret0 = h.c.world.turret;
  h.c.emit('npcFire', { ship: h.ship, weapon: 'turret' });
  h.combat.update(dt);
  pin('combat.missingTargetDrops', countNpcTurret(h.scene) === 0);
  pin('combat.noHangarWrite', h.c.world.turret === turret0);
}
{
  const h = harness();
  h.c.emit('npcFire', { ship: h.ship, weapon: 'cannon' });
  h.combat.update(dt);
  pin('combat.cannonOmitStillHits', countCannon(h.scene) >= 1);
}
{
  const h = harness();
  for (let i = 0; i < 5; i++) h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: 'player' });
  h.combat.update(dt);
  pin('combat.npcCap4', countNpcTurret(h.scene) === 4);
}
{
  const h = harness();
  const tgt = { object: new THREE.Object3D(), state: createShipState('cutter', { name: 'T' }) };
  tgt.object.position.set(0, 0, 40);
  h.scene.add(tgt.object);
  h.c.emit('npcFire', { ship: h.ship, weapon: 'turret', target: tgt });
  h.combat.update(dt);
  pin('combat.vsNpcDrops', countNpcTurret(h.scene) === 0);
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
