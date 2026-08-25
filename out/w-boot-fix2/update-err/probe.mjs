/**
 * Isolated NPC update probe: dummy / missing ai / missing velocity / missing object.
 * Node-only. No Vite. No boot harness.
 *
 *   node --import ./scripts/with-css-stub.mjs out/w-boot-fix2/update-err/probe.mjs
 */
import * as THREE from 'three';
import { initNpc } from '../../../src/systems/npc.js';

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
  emit(type, payload) { events.push({ type, ...(payload && typeof payload === 'object' ? payload : {}) }); },
};

const npc = initNpc(ctx);
const dt = 1 / 60;

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
    console.log(e.stack?.split('\n').slice(0, 4).join('\n') ?? '');
    return false;
  }
}

const origin = new THREE.Vector3(0, 30, 800);
const fakeShip74 = {
  object: {
    position: origin.clone().add(new THREE.Vector3(25, 0, -15)),
    parent: scene,
  },
  state: { destroyed: false, radius: 4, name: 'W74 CYCLE' },
  record: {
    id: 'w74-pin-ship', name: 'W74 CYCLE', classKey: 'light',
    faction: 'independent', role: 'trader',
  },
};

const liveObj = new THREE.Object3D();
liveObj.position.copy(origin).add(new THREE.Vector3(-40, 0, 10));
scene.add(liveObj);
const liveNpc = {
  id: 'probe-live',
  object: liveObj,
  state: {
    destroyed: false, disabled: false, classKey: 'light', name: 'PROBE LIVE',
    hull: 100, hullMax: 100, screen: 40, screenMax: 40, shell: 0, shellMax: 0,
    heat: 0, engine: 100, engineMax: 100, lastHitAt: -1e9, lastCombatAt: -1e9,
  },
  record: { classKey: 'light', role: 'trader', faction: 'independent', name: 'PROBE LIVE' },
  role: 'trader',
  ai: {
    mode: 'loiter',
    role: 'trader',
    t: 0,
    phase: null,
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
    target: null,
  },
};

run('wave74-dummy-alone', [fakeShip74]);
run('no-ai', [{ object: liveObj, state: { destroyed: false }, record: {} }]);
run('ai-without-velocity', [{
  object: liveObj,
  state: { destroyed: false, disabled: false, classKey: 'light' },
  record: { classKey: 'light', role: 'trader' },
  ai: { role: 'trader', lastAttacker: 'player', mode: 'hunt' },
}]);
run('missing-object', [{
  state: { destroyed: false, disabled: false, classKey: 'light' },
  record: { classKey: 'light' },
  ai: { velocity: new THREE.Vector3(), mode: 'loiter', role: 'trader', resolveAt: 1e9 },
}]);
run('missing-state', [{
  object: liveObj,
  ai: { velocity: new THREE.Vector3() },
}]);
run('hole-in-list', [null, undefined, fakeShip74]);
run('hailClosed-with-null-hole', [null, fakeShip74], [{ type: 'hailClosed', ship: fakeShip74 }]);
run('hailOpened-with-null-hole', [undefined, fakeShip74], [{ type: 'hailOpened', ship: fakeShip74 }]);
run('destroyed-wreck-no-object', [{
  state: { destroyed: true, surrendered: false },
  record: { role: 'trader', faction: 'independent' },
  ai: { lastAttacker: null, role: 'trader', deathHandled: false, survivorsSpawned: true },
  role: 'trader',
}]);
run('mix-dummy-and-live', [fakeShip74, liveNpc, {
  object: liveObj,
  state: { destroyed: false },
  ai: { role: 'trader' },
}]);
run('live-npc-still-ticks', [liveNpc]);
pin('live-velocity-written-or-kept', liveNpc.ai.velocity instanceof THREE.Vector3);

const unkObj = new THREE.Object3D();
unkObj.position.copy(origin).add(new THREE.Vector3(10, 0, 20));
scene.add(unkObj);
const unkNpc = {
  id: 'probe-unk-class',
  object: unkObj,
  state: {
    destroyed: false, disabled: false, classKey: 'nope', name: 'UNK CLASS',
    hull: 100, hullMax: 100, screen: 40, screenMax: 40, shell: 0, shellMax: 0,
    heat: 0, engine: 100, engineMax: 100, lastHitAt: -1e9, lastCombatAt: -1e9,
  },
  record: { classKey: 'nope', role: 'trader', faction: 'independent', name: 'UNK CLASS' },
  role: 'trader',
  ai: {
    mode: 'loiter',
    role: 'trader',
    t: 0,
    phase: null,
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
    target: null,
  },
};
const unkOk = run('speedCap-unknown-classKey', [unkNpc]);
if (unkOk) {
  pin('speedCap-unknown-class-finite', Number.isFinite(unkNpc.ai.velocity.length()));
}

function makeWalkLive(opts) {
  const obj = new THREE.Object3D();
  obj.position.copy(origin).add(opts.offset || new THREE.Vector3(0, 0, 0));
  obj.userData = { glow: { scale: { setScalar() {} } } };
  scene.add(obj);
  return {
    id: opts.id,
    object: obj,
    state: {
      destroyed: false, disabled: false, surrendered: false, classKey: 'light',
      name: opts.id, hull: 100, hullMax: 100, screen: 40, screenMax: 40,
      lastHitAt: -1e9, lastCombatAt: -1e9,
    },
    record: { classKey: 'light', role: opts.role, faction: 'independent', name: opts.id },
    role: opts.role,
    ai: {
      mode: opts.mode,
      role: opts.role,
      t: 0,
      phase: null,
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
      waypoints: [obj.position.clone()],
      target: opts.target ?? null,
    },
  };
}

const hunter = makeWalkLive({
  id: 'probe-hunter',
  role: 'pirate',
  mode: 'hunt',
  offset: new THREE.Vector3(400, 0, 0),
});
const prey = makeWalkLive({
  id: 'probe-prey',
  role: 'trader',
  mode: 'loiter',
  offset: new THREE.Vector3(440, 0, 0),
});
hunter.ai.target = prey;
run('findHunterOf-trader-with-null-hole', [null, hunter, undefined, prey]);

const patrol = makeWalkLive({
  id: 'probe-patrol',
  role: 'patrol',
  mode: 'loiter',
  offset: new THREE.Vector3(-400, 0, 0),
});
const workPirate = makeWalkLive({
  id: 'probe-work-pirate',
  role: 'pirate',
  mode: 'hunt',
  offset: new THREE.Vector3(-360, 0, 0),
  target: 'player',
});
run('findPirateWork-patrol-with-null-hole', [null, patrol, workPirate]);

if (failures.length) {
  console.log(`PROBE FAIL — ${failures.length}: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
