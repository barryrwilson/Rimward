// Targeted WAVE83 missile pins (combat pool, HUD toast, NPC gate). Not a full boot.
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createCtx } from '../../../src/core/ctx.js';
import { createShipState } from '../../../src/game/state.js';
import { initCombat } from '../../../src/systems/combat.js';
import { initHud } from '../../../src/systems/hud.js';
import { initNpc, spawnLiveShip, removeLiveShip } from '../../../src/systems/npc.js';
import {
  NPC_FACTIONS, NPC_CLASSES, configureShipAssetFileReader, primeShipAsset,
} from '../../../src/systems/ship-assets.js';
import { readFile } from 'node:fs/promises';

function makeEl(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    parent: null,
    _listeners: {},
    _attrs: {},
    style: { setProperty(k, v) { this[k] = v; } },
    classList: {
      _s: new Set(),
      _commit() { el.className = [...this._s].join(' '); },
      add(...c) { c.forEach((x) => this._s.add(x)); this._commit(); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); this._commit(); },
      toggle(c, f) { (f ?? !this._s.has(c)) ? this._s.add(c) : this._s.delete(c); this._commit(); },
      contains(c) { return this._s.has(c); },
    },
    dataset: {},
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    setAttribute(k, v) { el._attrs[k] = String(v); if (k.startsWith('data-')) el.dataset[k.slice(5)] = String(v); },
    getAttribute(k) { return Object.hasOwn(el._attrs, k) ? el._attrs[k] : null; },
    addEventListener() {},
    getBoundingClientRect() { return { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 }; },
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
  let className = '';
  Object.defineProperty(el, 'className', {
    get() { return className; },
    set(v) { className = String(v); el.classList._s = new Set(className.split(/\s+/).filter(Boolean)); },
  });
  let text = '';
  Object.defineProperty(el, 'textContent', {
    get() { return text; },
    set(v) { text = String(v); },
  });
  return el;
}
const elements = new Map();
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, makeEl());
    return elements.get(id);
  },
  head: makeEl('head'),
  body: makeEl('body'),
  addEventListener() {},
};
globalThis.window = {
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  addEventListener() {},
};
globalThis.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

function* walkDom(node) {
  yield node;
  for (const c of node.children ?? []) yield* walkDom(c);
}

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(here, '../../..', rel), 'utf8');
const combatSrc = src('src/systems/combat.js');
const npcSrc = src('src/systems/npc.js');
const hudSrc = src('src/systems/hud.js');
const songSrc = src('src/systems/song.js');
const ctxSrc = src('src/core/ctx.js');
const npcFireCase = hudSrc.slice(hudSrc.indexOf("case 'npcFire':"), hudSrc.indexOf("case 'sunHeat':"));

let errors = 0;
function pin(name, ok) {
  if (!ok) { errors++; console.log('FAIL', name); }
}

pin('poolCap', /const NPC_MISSILE_POOL = 4/.test(combatSrc) && /const MISSILE_POOL = 8/.test(combatSrc));
pin('spawnNpcMissile', /function spawnNpcMissile/.test(combatSrc));
pin('spawnNpcShotRefuses', /if \(wkey === 'missile'/.test(combatSrc));
pin('noSpendInNpcSpawn', !combatSrc.slice(
  combatSrc.indexOf('function spawnNpcMissile'),
  combatSrc.indexOf('function liveMissileLock'),
).includes('spendMissileAmmo'));
pin('vsPlayerSplit', combatSrc.includes('tickSeekerPool') && /p\.fromPlayer \|\| !p\.vsPlayer/.test(combatSrc));
pin('lastAttacker', combatSrc.includes("s.ai.lastAttacker = p.fromPlayer ? 'player' : (p.shooter || 'npc')"));
pin('ctxDoc', ctxSrc.includes("weapon:'cannon'|'missile'") && ctxSrc.includes('missiles always set target'));
pin('dartGate', npcSrc.includes('function canNpcDart') && npcSrc.includes("weapon: 'missile', target: 'player'"));
pin('toastLiteral', hudSrc.includes("INCOMING_DART_TOAST = 'Incoming dart.'")
  && npcFireCase.includes('INCOMING_DART_TOAST')
  && !npcFireCase.includes('innerHTML')
  && !npcFireCase.includes('e.from')
  && !npcFireCase.includes('state.name'));
pin('toastGap', hudSrc.includes('DART_TOAST_GAP = 2.5'));
pin('noNewHudNode', !/rw-incoming|rw-inbound|aspect-ring|lock-box/.test(hudSrc));
pin('songBranch', songSrc.includes('npcFireMissile') && songSrc.includes("ev.weapon === 'missile'"));

function count(scene, tag, visibleOnly) {
  let n = 0;
  scene.traverse((o) => {
    if (o.userData && o.userData.pool === tag) {
      if (!visibleOnly || o.visible) n++;
    }
  });
  return n;
}

const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
function harness(faction) {
  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(70, 1, 0.1, 5000);
  const c = createCtx({ scene: sc, camera: cam, renderer });
  c.player = createShipState('light', { name: 'W83' });
  c.ship.object = new THREE.Object3D();
  sc.add(c.ship.object);
  c.world.launcher = 'dart';
  c.world.missileAmmo = 8;
  const combat = initCombat(c);
  const obj = new THREE.Object3D();
  obj.position.set(0, 0, 40);
  sc.add(obj);
  const ship = { object: obj, state: createShipState('cutter', { faction, name: 'DartP' }) };
  return { sc, c, combat, ship };
}

const poolH = harness('redledger');
for (let i = 0; i < 5; i++) poolH.c.emit('npcFire', { ship: poolH.ship, weapon: 'missile', target: 'player' });
poolH.combat.update(1 / 60);
pin('drop5th', count(poolH.sc, 'npcMissile', true) === 4);
pin('npcPool4', count(poolH.sc, 'npcMissile', false) === 4);
pin('playerPool8', count(poolH.sc, 'playerMissile', false) === 8 && count(poolH.sc, 'playerMissile', true) === 0);
pin('ammoUntouched', poolH.c.world.missileAmmo === 8);

const missH = harness('redledger');
missH.c.emit('npcFire', { ship: missH.ship, weapon: 'missile' });
missH.combat.update(1 / 60);
pin('missingTargetDrops', count(missH.sc, 'npcMissile', true) === 0);

const unkH = harness('unknowables');
unkH.c.emit('npcFire', { ship: unkH.ship, weapon: 'missile', target: 'player' });
unkH.combat.update(1 / 60);
pin('unkCombatDrop', count(unkH.sc, 'npcMissile', true) === 0);

const hud = initHud(poolH.c);
pin('noInboundClass', ![...walkDom(document.getElementById('hud'))].some((n) =>
  /incoming|inbound|aspect-ring|lock-box|lockbox|missile-gauge/i.test(n.className || '')));
poolH.c.elapsed = 10;
for (let i = 0; i < 5; i++) poolH.c.emit('npcFire', { weapon: 'missile', target: 'player' });
hud.update(1 / 60);
const dartToasts = [...walkDom(document.getElementById('hud'))].filter((n) =>
  (n.className || '').includes('rw-toast') && (n.className || '').includes('show')
  && n.textContent === 'Incoming dart.');
pin('toastCopy', dartToasts.length === 1 && dartToasts[0].textContent === 'Incoming dart.');
const shownBeforeCannon = dartToasts.length;
poolH.c.emit('npcFire', { weapon: 'cannon', target: 'player' });
hud.update(1 / 60);
const shownAfterCannon = [...walkDom(document.getElementById('hud'))].filter((n) =>
  (n.className || '').includes('show') && n.textContent === 'Incoming dart.').length;
pin('cannonNoDartToast', shownAfterCannon === shownBeforeCannon);

configureShipAssetFileReader((assetPath) => readFile(new URL(`../../../public${assetPath}`, import.meta.url)));
await Promise.all(NPC_FACTIONS.flatMap((faction) => NPC_CLASSES.flatMap((classKey) => [
  primeShipAsset(faction, classKey, 'trader'),
  primeShipAsset(faction, classKey, 'pirate'),
])));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 20000);
const ctx = createCtx({ scene, camera, renderer });
ctx.player = createShipState('light');
ctx.ship.object = new THREE.Object3D();
scene.add(ctx.ship.object);
const npcSys = initNpc(ctx);
const combatSys = initCombat(ctx);
const dt = 1 / 60;
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.elapsed += dt;
    ctx.world.time += dt;
    npcSys.update(dt);
    combatSys.update(dt);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
const st = ctx.config.world.stationPosition;
ctx.flags.docked = false;
ctx.world.jumpGraceUntil = 0;
ctx.ship.object.position.set(st.x, st.y, st.z + 500);

function spawnRole(role, faction, suffix) {
  const p = ctx.ship.object.position;
  const rec = {
    id: `w83-${suffix}`, name: `W83 ${suffix}`, classKey: role === 'ace' ? 'ace' : 'cutter',
    faction, role, resolve: 80, alwaysHuntsPlayer: true,
  };
  const live = spawnLiveShip(ctx, rec, new THREE.Vector3(p.x, p.y, p.z + 100));
  if (!live) return null;
  ctx.ships.push(live);
  live.ai.demandSent = true;
  live.ai.demanding = false;
  live.ai.band = 'defiant';
  live.ai.playerRolled = true;
  live.ai.playerInterested = true;
  live.ai.target = 'player';
  live.ai.phase = 'telegraph';
  live.ai.phaseStart = ctx.world.time - 3.05;
  live.ai.fireAt = 0;
  live.ai.dartSpent = false;
  live.ai.intent = true;
  live.state.personality = 10;
  live.state.resolve = 80;
  live.ai.resolveAt = ctx.world.time + 1e6;
  live.ai.hailed = true;
  live.object.quaternion.identity();
  return live;
}
function fires(live, n) {
  const evs = [];
  for (let i = 0; i < n && live; i++) {
    live.object.quaternion.identity();
    live.object.position.set(ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z + 100);
    tick(1);
    evs.push(...ctx.lastEvents);
  }
  return evs.filter((e) => e.type === 'npcFire' && e.ship === live);
}
function drop(live) {
  if (!live) return;
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  removeLiveShip(ctx, live);
}

const pirate = spawnRole('pirate', 'redledger', 'pirate');
const pirateFires = fires(pirate, 90);
drop(pirate);
pin('pirateSpawn', !!pirate);
pin('pirateOneDart', pirateFires.filter((e) => e.weapon === 'missile').length === 1
  && pirateFires[0]?.weapon === 'missile' && pirateFires[0]?.target === 'player'
  && pirateFires.filter((e) => e.weapon === 'cannon').length >= 1);

const ace = spawnRole('ace', 'redledger', 'ace');
const aceFires = fires(ace, 90);
drop(ace);
pin('aceOneDart', !!ace && aceFires[0]?.weapon === 'missile' && aceFires[0]?.target === 'player');

const unk = spawnRole('pirate', 'unknowables', 'unk');
const unkFires = fires(unk, 90);
drop(unk);
pin('unkNeverMissile', !!unk && !unkFires.some((e) => e.weapon === 'missile'));

const trader = spawnRole('trader', 'veridian', 'trader');
if (trader) { trader.ai.mode = 'hunt'; trader.ai.target = 'player'; }
const traderFires = fires(trader, 40);
drop(trader);
const miner = spawnRole('miner', 'veridian', 'miner');
if (miner) { miner.ai.mode = 'hunt'; miner.ai.target = 'player'; }
const minerFires = fires(miner, 40);
drop(miner);
const patrol = spawnRole('patrol', 'freehold', 'patrol');
if (patrol) {
  patrol.ai.mode = 'hunt';
  patrol.ai.scratched = true;
  patrol.ai.lastAttacker = 'player';
  patrol.ai.target = 'player';
}
const patrolFires = fires(patrol, 90);
drop(patrol);
pin('civilianNeverMissile', !traderFires.some((e) => e.weapon === 'missile')
  && !minerFires.some((e) => e.weapon === 'missile')
  && !patrolFires.some((e) => e.weapon === 'missile'));

if (errors === 0) console.log('WAVE83 PROBE PASS');
else console.log(`WAVE83 PROBE FAIL — ${errors} errors`);
process.exit(errors === 0 ? 0 : 1);
