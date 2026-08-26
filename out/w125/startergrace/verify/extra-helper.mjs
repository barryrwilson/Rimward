// Extra helper cases the worker probe does not cover.
import * as THREE from 'three';
import { starterGraceBlocksAcquire, initNpc } from '../../../../src/systems/npc.js';

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

const pirate = { record: {} };
const dresk = { record: { alwaysHuntsPlayer: true } };
const ctx = (over) => ({ world: { time: 10, origin: 'greenhand', currentSystem: 'freehold', jumpGraceUntil: 0, ...over } });

ok('beautiful.t10.blocks', starterGraceBlocksAcquire(ctx({ origin: 'beautiful' }), pirate, 10) === true);
ok('ledgerDebt.t10.noExtra', starterGraceBlocksAcquire(ctx({ origin: 'ledgerDebt' }), pirate, 10) === false);
ok('drifter.redmarch.t10.noExtra', starterGraceBlocksAcquire(ctx({ origin: 'drifter', currentSystem: 'redmarch' }), pirate, 10) === false);
ok('greenhand.t179.blocks', starterGraceBlocksAcquire(ctx({ time: 179 }), pirate, 179) === true);
ok('greenhand.t180.extraOff', starterGraceBlocksAcquire(ctx({ time: 180 }), pirate, 180) === false);
ok('nanTime.noExtra', starterGraceBlocksAcquire(ctx({ time: NaN }), pirate, 10) === false);
ok('dresk.beautiful.bypassExtra', starterGraceBlocksAcquire(ctx({ origin: 'beautiful' }), dresk, 10) === false);

const huge = { time: 200, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: 1e15 };
ok('hugeHop.now200.failClosed', starterGraceBlocksAcquire({ world: huge }, pirate, 200) === false);
ok('hugeHop.now380.failClosed', starterGraceBlocksAcquire({ world: huge }, pirate, 380) === false);
const still = starterGraceBlocksAcquire({ world: huge }, pirate, 10000);
ok('hugeHop.now10000.mustNotGodMode', still === false, still);

ok('infHop.failClosed', starterGraceBlocksAcquire({ world: { ...huge, jumpGraceUntil: Infinity } }, pirate, 200) === false);

const scene = new THREE.Scene();
const extraPirate = {
  role: 'pirate',
  record: {},
  state: { destroyed: false },
  ai: {
    role: 'pirate',
    target: 'player',
    playerRolled: true,
    playerInterested: true,
    calmUntil: 12,
    velocity: new THREE.Vector3(),
  },
};
const extraDresk = {
  role: 'pirate',
  record: { alwaysHuntsPlayer: true },
  state: { destroyed: false },
  ai: {
    role: 'pirate',
    target: 'player',
    playerRolled: true,
    playerInterested: true,
    calmUntil: 0,
    velocity: new THREE.Vector3(),
  },
};
const deathCtx = {
  scene,
  world: { time: 5000, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: 0 },
  settings: { reducedMotion: true },
  ship: { object: null },
  flags: { docked: false, combat: false },
  gate: { jumping: true },
  ships: [extraPirate, extraDresk],
  events: [{ type: 'playerDestroyed' }],
  lastEvents: [],
  elapsed: 0,
  targets: { current: null },
  emit() {},
};
const npc = initNpc(deathCtx);
npc.update(0);
deathCtx.world.time = 10;
ok('death.rewindDoesNotClear', starterGraceBlocksAcquire(deathCtx, extraPirate, 10) === true);
ok('death.rewindStillHonorsDresk', starterGraceBlocksAcquire(deathCtx, extraDresk, 10) === true);
deathCtx.events = [];
deathCtx.lastEvents = [];
npc.update(90);
ok('death.dt90ExpiresDespiteRewind', starterGraceBlocksAcquire(deathCtx, extraPirate, 10) === false);
ok('death.dt90ExpiresDresk', starterGraceBlocksAcquire(deathCtx, extraDresk, 10) === false);

if (fails.length) {
  console.error(`FAIL ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PASS extra-helper');
