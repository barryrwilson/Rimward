/**
 * Extra verifier cases the worker probe left thin.
 * Node-only. No Vite.
 */
import * as THREE from 'three';
import { initNpc, removeLiveShip, animateShipMesh } from '../../../../src/systems/npc.js';

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
  world: { time: 10, currentSystem: 'freehold', reputation: { freehold: 0 }, fear: 0 },
  settings: { reducedMotion: true },
  ship: { object: player, velocity: new THREE.Vector3() },
  gate: { jumping: true },
  ships: [],
  flags: { docked: true, combat: false, paused: false },
  lastEvents: [],
  events,
  targets: { current: null },
  config: { world: { stationPosition: new THREE.Vector3(120, 20, 620), sunPosition: new THREE.Vector3() } },
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

function run(label, ships, lastEvents = []) {
  ctx.ships = ships;
  ctx.lastEvents = lastEvents;
  ctx.events = [];
  ctx.elapsed += dt;
  ctx.world.time += dt;
  try {
    npc.update(dt);
    pin(label, true);
    return true;
  } catch (e) {
    pin(label, false, `${e.message}`);
    console.log(e.stack?.split('\n').slice(0, 6).join('\n') ?? '');
    return false;
  }
}

function makeLive(opts = {}) {
  const obj = new THREE.Object3D();
  obj.position.copy(origin).add(new THREE.Vector3(-40, 0, 10));
  obj.userData = {
    glow: { scale: { setScalar() {} } },
  };
  scene.add(obj);
  return {
    id: opts.id || 'probe-live',
    object: obj,
    state: {
      destroyed: false, disabled: false, classKey: opts.classKey || 'light',
      name: 'PROBE LIVE', hull: 100, hullMax: 100, screen: 40, screenMax: 40,
      shell: 0, shellMax: 0, heat: 0, engine: 100, engineMax: 100,
      lastHitAt: opts.lastHitAt ?? -1e9, lastCombatAt: -1e9,
    },
    record: {
      classKey: opts.classKey || 'light',
      role: opts.role || 'trader',
      faction: 'independent',
      name: 'PROBE LIVE',
    },
    role: opts.role || 'trader',
    ai: {
      mode: opts.mode || 'loiter',
      role: opts.role || 'trader',
      t: 0,
      phase: opts.phase ?? null,
      intent: false,
      demanding: opts.demanding === true,
      demandOutcome: opts.demandOutcome ?? null,
      demandPeaceAt: opts.demandPeaceAt ?? 0,
      resolveBoost: 0,
      resolveAt: 1e9,
      fireAt: 0,
      turretFireAt: 0,
      velocity: opts.velocity === undefined ? new THREE.Vector3() : opts.velocity,
      driftVel: new THREE.Vector3(),
      weaveSeed: 0,
      wp: 0,
      waypoints: [origin.clone(), origin.clone().add(new THREE.Vector3(20, 0, 0))],
      target: opts.target ?? null,
      deathHandled: false,
      survivorsSpawned: false,
    },
  };
}

const dummy = {
  object: { position: origin.clone(), parent: scene },
  state: { destroyed: false, radius: 4, name: 'W74 CYCLE' },
  record: { id: 'w74-pin-ship', name: 'W74 CYCLE', classKey: 'light', faction: 'independent', role: 'trader' },
};

run('velocity-plain-object', [{
  object: new THREE.Object3D(),
  state: { destroyed: false, disabled: false, classKey: 'light' },
  record: { classKey: 'light', role: 'trader' },
  ai: { velocity: {}, mode: 'loiter', role: 'trader', resolveAt: 1e9 },
}]);

run('velocity-length-number', [{
  object: new THREE.Object3D(),
  state: { destroyed: false, disabled: false, classKey: 'light' },
  record: { classKey: 'light' },
  ai: { velocity: { length: 3 }, mode: 'loiter', role: 'trader', resolveAt: 1e9 },
}]);

run('hailClosed-with-null-hole', [null, dummy], [{ type: 'hailClosed', ship: dummy }]);
run('hailOpened-with-null-hole', [undefined, dummy], [{ type: 'hailOpened', ship: dummy }]);
run('hailClosed-dummy-only', [dummy], [{ type: 'hailClosed' }]);

const huntAcq = makeLive({ role: 'pirate', mode: 'hunt', target: null });
huntAcq.ai.role = 'pirate';
const huntHoleOk = run('hunt-acquire-with-null-hole', [null, huntAcq, undefined, dummy]);
if (huntHoleOk) {
  pin('hunt-acquire-did-not-throw', true);
}

const hailHunt = makeLive({
  role: 'pirate',
  mode: 'hunt',
  demanding: true,
  demandOutcome: 'paid',
  lastHitAt: -1e9,
});
const hailHuntOk = run('hailClosed-hunt-with-null-hole', [null, hailHunt, undefined], [
  { type: 'hailClosed', ship: hailHunt },
]);
if (hailHuntOk) {
  pin('hailClosed-hunt-hold-released', hailHunt.ai.demanding === false);
}

const wreck = {
  state: { destroyed: true, surrendered: false },
  record: { role: 'trader', faction: 'independent' },
  ai: { lastAttacker: null, role: 'trader', deathHandled: false, survivorsSpawned: false },
  role: 'trader',
};
run('destroyed-no-object-spawn-survivor-path', [wreck]);

try {
  removeLiveShip(ctx, { state: { destroyed: true } });
  removeLiveShip(ctx, null);
  pin('removeLiveShip-no-object', true);
} catch (e) {
  pin('removeLiveShip-no-object', false, e.message);
}

try {
  animateShipMesh(null, 1, true, camera, 0);
  animateShipMesh({ position: origin.clone() }, 1, true, camera, 0);
  pin('animateShipMesh-no-userData', true);
} catch (e) {
  pin('animateShipMesh-no-userData', false, e.message);
}

const demandLive = makeLive({
  role: 'pirate',
  mode: 'hunt',
  demanding: true,
  demandPeaceAt: 1,
  lastHitAt: 100,
});
const demandOk = run('demanding-live-hailClosed-emit', [dummy, demandLive]);
if (demandOk) {
  const closed = ctx.events.filter((e) => e.type === 'hailClosed' && e.ship === demandLive);
  pin('demanding-emits-hailClosed', closed.length === 1, `count=${closed.length}`);
  pin('demanding-cleared', demandLive.ai.demanding === false);
}

const holdLive = makeLive({
  role: 'pirate',
  mode: 'hunt',
  demanding: true,
  demandOutcome: 'paid',
  lastHitAt: -1e9,
});
const holdOk = run('hailClosed-event-releases-stamped-hold', [dummy, holdLive], [
  { type: 'hailClosed', ship: holdLive },
]);
if (holdOk) {
  pin('stamped-hold-released', holdLive.ai.demanding === false);
}

const unkClass = makeLive({ id: 'unk-class', role: 'trader', mode: 'loiter', classKey: 'nope' });
unkClass.state.classKey = 'nope';
unkClass.record.classKey = 'nope';
const unkOk = run('speedCap-unknown-classKey', [unkClass]);
if (unkOk) {
  pin('speedCap-unknown-class-finite', Number.isFinite(unkClass.ai.velocity.length()));
}

const hunterPrey = makeLive({
  id: 'hunter-prey',
  role: 'trader',
  mode: 'loiter',
});
const hunterOf = makeLive({
  id: 'hunter-of',
  role: 'pirate',
  mode: 'hunt',
  target: hunterPrey,
});
hunterOf.ai.role = 'pirate';
run('findHunterOf-trader-with-null-hole', [null, hunterOf, undefined, hunterPrey]);

ctx.flags.docked = false;
ctx.config.world.stationPosition.set(20000, 0, 0);
const patrolWork = makeLive({
  id: 'patrol-work',
  role: 'patrol',
  mode: 'loiter',
});
const pirateWork = makeLive({
  id: 'pirate-work',
  role: 'pirate',
  mode: 'hunt',
  target: 'player',
});
pirateWork.ai.role = 'pirate';
run('findPirateWork-patrol-with-null-hole', [null, patrolWork, pirateWork]);

const pirate = makeLive({
  role: 'pirate',
  mode: 'hunt',
  classKey: 'heavy',
  target: 'player',
  phase: null,
});
pirate.object.position.copy(player.position).add(new THREE.Vector3(40, 0, 0));
const beforeVel = pirate.ai.velocity.clone();
const huntOk = run('pirate-hunt-telegraph', [dummy, pirate]);
if (huntOk) {
  pin('telegraph-phase-set', pirate.ai.phase === 'telegraph', `phase=${pirate.ai.phase}`);
  pin('telegraph-no-npcFire', ctx.events.every((e) => e.type !== 'npcFire'), JSON.stringify(ctx.events.map((e) => e.type)));
  pin('live-velocity-copy-after-dummy', pirate.ai.velocity instanceof THREE.Vector3);
  pin('live-velocity-moved-or-kept', Number.isFinite(pirate.ai.velocity.length()));
}

if (failures.length) {
  console.log(`EXTRA FAIL — ${failures.length}: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('EXTRA PROBE PASS');
