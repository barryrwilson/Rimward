// Clone WAVE83 pirate spawn; pin why pirateOneDart fails in late-boot state.
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { createShipState, computeResolve, resolveBand, FACTIONS, NAMED_GUNS } from '../../../src/game/state.js';
import { initCombat } from '../../../src/systems/combat.js';
import { initNpc, spawnLiveShip, removeLiveShip } from '../../../src/systems/npc.js';
import {
  NPC_FACTIONS, NPC_CLASSES, configureShipAssetFileReader, primeShipAsset,
} from '../../../src/systems/ship-assets.js';
import { epicEffects } from '../../../src/game/epics.js';
import { readFile } from 'node:fs/promises';

function makeEl(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    dataset: {},
    appendChild(c) { this.children.push(c); return c; },
    setAttribute() {},
    getAttribute() { return null; },
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
  Object.defineProperty(el, 'textContent', { get() { return ''; }, set() {} });
  Object.defineProperty(el, 'className', { get() { return ''; }, set() {} });
  return el;
}
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  getElementById: () => makeEl(),
  head: makeEl('head'),
  body: makeEl('body'),
  addEventListener() {},
};
globalThis.window = { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener() {} };
globalThis.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

configureShipAssetFileReader((assetPath) => readFile(new URL(`../../../public${assetPath}`, import.meta.url)));
await Promise.all(NPC_FACTIONS.flatMap((faction) => NPC_CLASSES.flatMap((classKey) => [
  primeShipAsset(faction, classKey, 'trader'),
  primeShipAsset(faction, classKey, 'pirate'),
])));

const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };

function worldResolve(fear, personality, pirateMods) {
  const defense = 1;
  const force = 0.5;
  const doctrine = FACTIONS.redledger.doctrine;
  const r = computeResolve(
    { defense, force, fear: fear / 100, cargoAtStake: 0, doctrine },
    personality + pirateMods,
  );
  return { r, band: resolveBand(r) };
}

function runCase(label, setup) {
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
  ctx.flags.docked = false;
  ctx.world.jumpGraceUntil = 0;
  const st = ctx.config.world.stationPosition;
  ctx.ship.object.position.set(st.x, st.y, st.z + 500);
  setup(ctx);

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
    live.object.quaternion.identity();
    if (setup.pinResolve !== false) {
      live.state.personality = 10;
      live.state.resolve = 80;
      live.ai.resolveAt = ctx.world.time + 1e6;
      live.ai.hailed = true;
    }
    return live;
  }
  function fires(live, n) {
    const evs = [];
    const snaps = [];
    for (let i = 0; i < n && live; i++) {
      live.object.quaternion.identity();
      live.object.position.set(ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z + 100);
      tick(1);
      evs.push(...ctx.lastEvents);
      if (i === 0 || i === 1 || i === 20) {
        snaps.push({
          i,
          band: live.ai.band,
          phase: live.ai.phase,
          demanding: live.ai.demanding,
          dartSpent: live.ai.dartSpent,
          resolve: live.state.resolve,
          mode: live.ai.mode,
          target: live.ai.target === 'player' ? 'player' : typeof live.ai.target,
        });
      }
    }
    const firesEv = evs.filter((e) => e.type === 'npcFire' && e.ship === live);
    return { firesEv, snaps, live };
  }

  const pirate = spawnRole('pirate', 'redledger', 'pirate');
  const pirateRun = fires(pirate, 90);
  const pirateMissile = pirateRun.firesEv.filter((e) => e.weapon === 'missile');
  const pirateCannon = pirateRun.firesEv.filter((e) => e.weapon === 'cannon');
  if (pirate) {
    const i = ctx.ships.indexOf(pirate);
    if (i >= 0) ctx.ships.splice(i, 1);
    removeLiveShip(ctx, pirate);
  }
  const ace = spawnRole('ace', 'redledger', 'ace');
  const aceRun = fires(ace, 90);
  const pin = !!pirate && pirateMissile.length === 1
    && pirateRun.firesEv[0]?.weapon === 'missile' && pirateRun.firesEv[0]?.target === 'player'
    && pirateCannon.length >= 1;
  const acePin = !!ace && aceRun.firesEv[0]?.weapon === 'missile' && aceRun.firesEv[0]?.target === 'player';
  console.log(JSON.stringify({
    label,
    pin,
    acePin,
    pirateN: pirateRun.firesEv.length,
    pirateW: pirateRun.firesEv.map((e) => e.weapon),
    pirateSnaps: pirateRun.snaps,
    aceW: aceRun.firesEv.slice(0, 3).map((e) => e.weapon),
    fear: ctx.world.fear,
    ms: ctx.world.milestones,
    epic: ctx.world.epics,
    mods: epicEffects(ctx, 'redledger').pirateResolveMod ?? 0,
  }));
}

const fear50 = worldResolve(50, 0, NAMED_GUNS.brokenResolveMod);
const fear50ace = worldResolve(50, 0, 0);
const fear50p10 = worldResolve(50, 10, NAMED_GUNS.brokenResolveMod);
console.log('math', JSON.stringify({ fear50, fear50ace, fear50p10 }));

runCase('probe-default', () => {});
const repro = (ctx) => {
  ctx.world.fear = 50;
  ctx.world.milestones = ['rimWithoutGuns'];
  ctx.world.epics = { redledger: 3 };
};
repro.pinResolve = false;
runCase('late-boot-unpinned', repro);
const pinned = (ctx) => {
  ctx.world.fear = 50;
  ctx.world.milestones = ['rimWithoutGuns'];
  ctx.world.epics = { redledger: 3 };
};
runCase('late-boot-bootspawn', pinned);
