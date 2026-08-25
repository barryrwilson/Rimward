/**
 * Confirm hunt acquire still binds a complete civilian pirate target
 * while skipping list holes. Node-only. No Vite.
 */
import * as THREE from 'three';
import { initNpc } from '../../../../src/systems/npc.js';

const failures = [];
function pin(name, ok, detail) {
  if (!ok) failures.push(name);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` ${detail}` : ''}`);
}

function makeEl(tag = 'div') {
  return {
    tagName: String(tag).toUpperCase(),
    style: {},
    children: [],
    appendChild(n) { this.children.push(n); return n; },
  };
}

if (!globalThis.document) {
  globalThis.document = {
    createElement: (t) => makeEl(t),
    createElementNS: (_, t) => makeEl(t),
    getElementById: () => makeEl(),
    body: makeEl('body'),
    addEventListener() {},
  };
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 2000);
const player = new THREE.Object3D();
player.position.set(0, 30, 800);
scene.add(player);

const events = [];
const ctx = {
  scene,
  camera,
  elapsed: 1,
  world: { time: 10, currentSystem: 'freehold', reputation: { freehold: 0 }, fear: 0, jumpGraceUntil: 0 },
  settings: { reducedMotion: true },
  ship: { object: player, velocity: new THREE.Vector3() },
  gate: { jumping: true },
  ships: [],
  flags: { docked: false, combat: false, paused: false },
  lastEvents: [],
  events,
  targets: { current: null },
  config: { world: { stationPosition: new THREE.Vector3(20000, 0, 0), sunPosition: new THREE.Vector3() } },
  asteroids: { list: [] },
  emit(type, payload) {
    const row = { type, ...(payload && typeof payload === 'object' ? payload : {}) };
    ctx.events.push(row);
    events.push(row);
  },
};

const npc = initNpc(ctx);
const dt = 1 / 60;
const origin = new THREE.Vector3(0, 30, 800);

function makeLive(opts = {}) {
  const obj = new THREE.Object3D();
  obj.position.copy(origin).add(opts.offset || new THREE.Vector3(-40, 0, 10));
  obj.userData = { glow: { scale: { setScalar() {} } } };
  scene.add(obj);
  return {
    id: opts.id || 'probe-live',
    object: obj,
    state: {
      destroyed: false, disabled: false, classKey: opts.classKey || 'light',
      name: opts.name || 'PROBE LIVE', hull: 100, hullMax: 100, screen: 40, screenMax: 40,
      shell: 0, shellMax: 0, heat: 0, engine: 100, engineMax: 100,
      lastHitAt: -1e9, lastCombatAt: -1e9, surrendered: false,
    },
    record: {
      classKey: opts.classKey || 'light',
      role: opts.role || 'trader',
      faction: 'independent',
      name: opts.name || 'PROBE LIVE',
    },
    role: opts.role || 'trader',
    ai: {
      mode: opts.mode || 'loiter',
      role: opts.role || 'trader',
      t: 0,
      phase: opts.phase ?? null,
      intent: false,
      demanding: false,
      demandOutcome: null,
      demandPeaceAt: 0,
      resolveBoost: 0,
      resolveAt: 1e9,
      fireAt: 0,
      turretFireAt: 0,
      velocity: new THREE.Vector3(),
      driftVel: new THREE.Vector3(),
      weaveSeed: 0,
      wp: 0,
      waypoints: [origin.clone(), origin.clone().add(new THREE.Vector3(20, 0, 0))],
      target: opts.target ?? null,
      deathHandled: false,
      survivorsSpawned: false,
      playerRolled: true,
      playerInterested: false,
    },
  };
}

const pirate = makeLive({
  id: 'hunter',
  name: 'HUNTER',
  role: 'pirate',
  mode: 'hunt',
  offset: new THREE.Vector3(40, 0, 0),
});
const trader = makeLive({
  id: 'prey',
  name: 'PREY',
  role: 'trader',
  mode: 'loiter',
  offset: new THREE.Vector3(80, 0, 0),
});
const dummy = {
  object: { position: origin.clone(), parent: scene },
  state: { destroyed: false, radius: 4, name: 'W74 CYCLE' },
  record: { id: 'w74-pin-ship', name: 'W74 CYCLE', classKey: 'light', faction: 'independent', role: 'trader' },
};

function runOnce(label, ships) {
  pirate.ai.target = null;
  pirate.ai.phase = null;
  pirate.ai.intent = false;
  pirate.ai.mode = 'hunt';
  trader.ai.mode = 'loiter';
  trader.ai.fleeFrom = null;
  ctx.ships = ships;
  ctx.lastEvents = [];
  ctx.events = [];
  ctx.elapsed += dt;
  ctx.world.time += dt;
  try {
    npc.update(dt);
    pin(label, true);
    return true;
  } catch (e) {
    pin(label, false, `${e.message}`);
    console.log(e.stack?.split('\n').slice(0, 12).join('\n') ?? '');
    return false;
  }
}

const noHoleOk = runOnce('hunt-acquire-complete-no-hole', [pirate, dummy, trader]);
if (noHoleOk) {
  pin('hunt-acquired-complete-trader', pirate.ai.target === trader, `target=${pirate.ai.target && pirate.ai.target.id}`);
  pin('incomplete-dummy-not-acquired', pirate.ai.target !== dummy);
}

const holeOk = runOnce('hunt-acquire-complete-with-null-hole', [null, pirate, undefined, dummy, trader]);
if (holeOk) {
  pin('hunt-acquired-complete-trader-with-hole', pirate.ai.target === trader, `target=${pirate.ai.target && pirate.ai.target.id}`);
}

const patrol = makeLive({
  id: 'patrol',
  name: 'PATROL',
  role: 'patrol',
  mode: 'loiter',
  offset: new THREE.Vector3(-80, 0, 0),
});
const patrolHoleOk = runOnce('findPirateWork-with-null-hole', [null, patrol, pirate]);
if (patrolHoleOk) {
  pin('findPirateWork-with-null-hole-did-not-throw', true);
}

if (failures.length) {
  console.log(`HUNT COMPLETE FAIL — ${failures.length}: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('HUNT COMPLETE PROBE PASS');
