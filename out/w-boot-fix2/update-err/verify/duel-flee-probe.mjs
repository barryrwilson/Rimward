/**
 * Reachability: wave116 unknown classKey and WAVE74 dummy hulls vs
 * updateDuel / updateFlee unguarded SHIP_CLASSES[st.classKey].
 * Node-only. No Vite. Does not edit src.
 */
import * as THREE from 'three';
import { SHIP_CLASSES } from '../../../../src/game/state.js';
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

function tryUpdate(ships, lastEvents = []) {
  ctx.ships = ships;
  ctx.lastEvents = lastEvents;
  ctx.events = [];
  ctx.elapsed += dt;
  ctx.world.time += dt;
  try {
    npc.update(dt);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

function run(label, ships, lastEvents = []) {
  const res = tryUpdate(ships, lastEvents);
  if (res.ok) pin(label, true);
  else {
    pin(label, false, `${res.error.message}`);
    console.log(res.error.stack?.split('\n').slice(0, 8).join('\n') ?? '');
  }
  return res;
}

function speedOf(live) {
  const vel = live && live.ai && live.ai.velocity;
  return vel && typeof vel.length === 'function' ? vel.length() : NaN;
}

function makeLive(opts = {}) {
  const obj = new THREE.Object3D();
  obj.position.copy(origin).add(opts.offset || new THREE.Vector3(40, 0, 0));
  obj.userData = { glow: { scale: { setScalar() {} }, visible: true } };
  scene.add(obj);
  return {
    id: opts.id || 'probe-live',
    object: obj,
    state: {
      destroyed: false, disabled: false, surrendered: false,
      classKey: opts.classKey || 'light',
      name: opts.id || 'PROBE LIVE',
      hull: 100, hullMax: 100, screen: 40, screenMax: 40,
      shell: 0, shellMax: 0, heat: 0, engine: 100, engineMax: 100,
      lastHitAt: opts.lastHitAt ?? -1e9, lastCombatAt: -1e9,
    },
    record: {
      classKey: opts.classKey || 'light',
      role: opts.role || 'trader',
      faction: 'independent',
      name: opts.id || 'PROBE LIVE',
    },
    role: opts.role || 'trader',
    ai: {
      mode: opts.mode || 'loiter',
      role: opts.role || 'trader',
      t: 0,
      phase: opts.phase ?? null,
      acePhase: opts.acePhase ?? 1,
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
      fleeFrom: opts.fleeFrom ?? null,
      deathHandled: false,
      survivorsSpawned: false,
    },
  };
}

const dummy = {
  object: { position: origin.clone(), parent: scene },
  state: { destroyed: false, radius: 4, name: 'W74 CYCLE', classKey: 'nope' },
  record: { id: 'w74-pin-ship', name: 'W74 CYCLE', classKey: 'nope', faction: 'independent', role: 'trader' },
};

run('dummy-unknown-class-no-ai', [dummy]);
run('dummy-plus-hole', [null, dummy, undefined]);

const loiterUnk = makeLive({ id: 'loiter-unk', role: 'trader', mode: 'loiter', classKey: 'nope' });
run('loiter-unknown-classKey', [loiterUnk]);

const routeUnk = makeLive({ id: 'route-unk', role: 'trader', mode: 'route', classKey: 'nope' });
run('route-unknown-classKey-wave116-default', [routeUnk]);

const huntUnk = makeLive({
  id: 'hunt-unk',
  role: 'pirate',
  mode: 'hunt',
  classKey: 'nope',
  target: 'player',
});
run('hunt-unknown-classKey', [huntUnk]);

const duelUnk = makeLive({
  id: 'duel-unk',
  role: 'ace',
  mode: 'duel',
  classKey: 'nope',
  acePhase: 1,
});
const duelRes = run('duel-unknown-acePhase1', [duelUnk]);
pin('duel-acePhase1-uses-speedCap', duelRes.ok === true);

const duelP2 = makeLive({
  id: 'duel-p2',
  role: 'ace',
  mode: 'duel',
  classKey: 'nope',
  acePhase: 2,
});
duelP2.state.hull = 50;
const duelP2Res = run('duel-unknown-acePhase2', [duelP2]);
pin('duel-unknown-acePhase2-finite', duelP2Res.ok && Number.isFinite(speedOf(duelP2)), `spd=${speedOf(duelP2)}`);

const duelP3 = makeLive({
  id: 'duel-p3',
  role: 'ace',
  mode: 'duel',
  classKey: 'nope',
  acePhase: 3,
});
duelP3.state.hull = 20;
const duelP3Res = run('duel-unknown-acePhase3', [duelP3]);
pin(
  'duel-unknown-acePhase3-finite-zero',
  duelP3Res.ok && Number.isFinite(speedOf(duelP3)) && speedOf(duelP3) === 0,
  `spd=${speedOf(duelP3)}`,
);

const fleeTrader = makeLive({
  id: 'flee-trader',
  role: 'trader',
  mode: 'flee',
  classKey: 'nope',
  fleeFrom: 'player',
});
const fleeTraderRes = run('flee-trader-no-hunter-stands-down', [fleeTrader]);
pin(
  'flee-trader-stood-down-to-route',
  fleeTraderRes.ok === true && fleeTrader.ai.mode === 'route',
  `mode=${fleeTrader.ai.mode}`,
);

const hailPirate = makeLive({
  id: 'hail-pirate-flee',
  role: 'pirate',
  mode: 'flee',
  classKey: 'nope',
  fleeFrom: 'player',
});
const hailPirateRes = run('hail-or-capitulate-pirate-flee', [hailPirate]);
pin(
  'unknown-pirate-flee-speed-zero',
  hailPirateRes.ok && hailPirate.ai.mode === 'flee' && speedOf(hailPirate) === 0,
  `mode=${hailPirate.ai.mode} spd=${speedOf(hailPirate)}`,
);

const hailAce = makeLive({
  id: 'hail-ace-flee',
  role: 'ace',
  mode: 'flee',
  classKey: 'nope',
  fleeFrom: 'player',
});
const hailAceRes = run('hail-or-capitulate-ace-flee', [hailAce]);
pin(
  'unknown-ace-flee-speed-zero',
  hailAceRes.ok && hailAce.ai.mode === 'flee' && speedOf(hailAce) === 0,
  `mode=${hailAce.ai.mode} spd=${speedOf(hailAce)}`,
);

const prey = makeLive({
  id: 'w116-lock',
  role: 'trader',
  mode: 'route',
  classKey: 'nope',
});
const hunter = makeLive({
  id: 'hunter-of-w116',
  role: 'pirate',
  mode: 'hunt',
  classKey: 'light',
  target: prey,
  offset: new THREE.Vector3(60, 0, 0),
});
hunter.ai.role = 'pirate';
const w116Res = run('wave116-trader-unknown-plus-hunter', [null, hunter, dummy, prey]);
pin('wave116-mode-became-flee', w116Res.ok && prey.ai.mode === 'flee', `mode=${prey.ai.mode}`);
pin(
  'wave116-unknown-flee-finite-zero',
  w116Res.ok && Number.isFinite(speedOf(prey)) && speedOf(prey) === 0,
  `spd=${speedOf(prey)}`,
);

const miner = makeLive({
  id: 'miner-unk',
  role: 'miner',
  mode: 'mine',
  classKey: 'nope',
});
const minerHunter = makeLive({
  id: 'hunter-of-miner',
  role: 'pirate',
  mode: 'hunt',
  classKey: 'light',
  target: miner,
  offset: new THREE.Vector3(70, 0, 0),
});
minerHunter.ai.role = 'pirate';
const minerRes = run('miner-unknown-plus-hunter', [null, minerHunter, miner]);
pin('miner-unknown-became-flee', minerRes.ok && miner.ai.mode === 'flee', `mode=${miner.ai.mode}`);

const protoDuel = makeLive({
  id: 'proto-duel',
  role: 'ace',
  mode: 'duel',
  classKey: '__proto__',
});
const protoRes = run('duel-proto-classKey', [protoDuel]);
if (!protoRes.ok) {
  pin('proto-duel-throws', false, protoRes.error.message);
} else {
  pin('duel-proto-classKey-finite', Number.isFinite(speedOf(protoDuel)), `spd=${speedOf(protoDuel)}`);
}

const cutterBurn = SHIP_CLASSES.cutter && Number.isFinite(SHIP_CLASSES.cutter.burn) ? SHIP_CLASSES.cutter.burn : NaN;
const cutterFlee = makeLive({
  id: 'cutter-flee',
  role: 'pirate',
  mode: 'flee',
  classKey: 'cutter',
  fleeFrom: 'player',
});
const cutterFleeRes = run('known-cutter-flee', [cutterFlee]);
pin(
  'known-cutter-still-flees',
  cutterFleeRes.ok && cutterFlee.ai.mode === 'flee',
  `mode=${cutterFlee.ai.mode}`,
);
pin(
  'known-cutter-flee-uses-burn',
  cutterFleeRes.ok && Number.isFinite(speedOf(cutterFlee)) && Math.abs(speedOf(cutterFlee) - cutterBurn) < 1e-6,
  `spd=${speedOf(cutterFlee)} burn=${cutterBurn}`,
);

const cutterDuel = makeLive({
  id: 'cutter-duel',
  role: 'ace',
  mode: 'duel',
  classKey: 'cutter',
  acePhase: 3,
});
cutterDuel.state.hull = 20;
const cutterDuelRes = run('known-cutter-duel', [cutterDuel]);
pin(
  'known-cutter-still-duels',
  cutterDuelRes.ok && cutterDuel.ai.mode === 'duel',
  `mode=${cutterDuel.ai.mode}`,
);
pin(
  'known-cutter-duel-speed-finite-nonzero',
  cutterDuelRes.ok && Number.isFinite(speedOf(cutterDuel)) && speedOf(cutterDuel) > 0,
  `spd=${speedOf(cutterDuel)}`,
);

if (failures.length) {
  console.log(`DUEL/FLEE FAIL — ${failures.length}: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('DUEL/FLEE PROBE PASS');
