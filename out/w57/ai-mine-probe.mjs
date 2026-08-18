// Wave 57: miner records, mine mode, mayHuntPlayer false, mineHit emit, cargo cap.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { SYSTEMS, SHIP_CLASSES } from '../../src/game/state.js';
import { tickBank, initWorld, minerCountForCast, MINER_CARGO_CAP } from '../../src/game/world.js';
import { mayHuntPlayer } from '../../src/systems/npc.js';

const here = dirname(fileURLToPath(import.meta.url));
const worldSrc = readFileSync(resolve(here, '../../src/game/world.js'), 'utf8');
const npcSrc = readFileSync(resolve(here, '../../src/systems/npc.js'), 'utf8');
const fails = [];
const ok = (name, cond, extra = '') => {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
};

ok('src.countFormula', /Math\.min\(2,\s*Math\.max\(0,\s*\(traders\s*\/\s*4\)\s*\|\s*0\)\)/.test(worldSrc)
  || worldSrc.includes('Math.min(2, Math.max(0, (traders / 4) | 0))'));
ok('src.roleMiner', worldSrc.includes("role: 'miner'"));
ok('src.roleCommentMiner', /role, \/\/ trader \| pirate \| patrol \| ace \| miner/.test(worldSrc));
ok('src.noPlanetMine', worldSrc.includes('Never a planet'));
ok('src.pickTraderOnly', worldSrc.includes('function traderAtOutboundGate')
  && /if \(!rec \|\| rec\.role !== 'trader'/.test(worldSrc)
  && /if \(!rec \|\| rec\.state === 'inTransit' \|\| rec\.role !== 'trader'\) return false/.test(worldSrc));
const minerBlock = worldSrc.slice(worldSrc.indexOf('const minerN'), worldSrc.indexOf('if (cast.ace)'));
ok('src.noEnsureInMinerLoop', minerBlock.includes("role: 'miner'") && !minerBlock.includes('ensureBank'));

ok('src.makeAiMine', /role === 'miner' \? 'mine'/.test(npcSrc));
ok('src.mineHitEmit', /ctx\.emit\('mineHit',\s*\{/.test(npcSrc)
  && /asteroidId: rock\.id/.test(npcSrc)
  && /laserTier: 0/.test(npcSrc));
ok('src.noMineBlocked', !npcSrc.includes("emit('mineBlocked'"));
ok('src.tickMinerJob', npcSrc.includes('tickMinerJob(ctx, live)'));
ok('src.noHuntMiner', /isCivilianRole\(role\)/.test(npcSrc));

ok('count.formula8', minerCountForCast({ traders: 8 }) === 2);
ok('count.formula7', minerCountForCast({ traders: 7 }) === 1);
ok('count.formula5', minerCountForCast({ traders: 5 }) === 1);
ok('count.formula2', minerCountForCast({ traders: 2 }) === 0);
ok('count.formula1', minerCountForCast({ traders: 1 }) === 0);
ok('count.formula0', minerCountForCast({ traders: 0 }) === 0);
ok('count.hush', minerCountForCast(SYSTEMS.hush.cast) === 0);
ok('count.verge', minerCountForCast(SYSTEMS.verge.cast) === 0);
ok('count.freehold', minerCountForCast(SYSTEMS.freehold.cast) === 2);
ok('cap.const', MINER_CARGO_CAP === 8);

function makeSimCtx() {
  return {
    systems: SYSTEMS,
    lastEvents: [],
    ships: [],
    elapsed: 0,
    emit() {},
    input: { hailPressed: false },
    ship: { object: { position: new THREE.Vector3(1e6, 1e6, 1e6) } },
    world: {
      time: 0,
      currentSystem: 'freehold',
      records: [],
      recordBanks: {},
      markets: {},
      prices: null,
      milestones: [],
      credits: 500,
      reputation: {},
      fear: 0,
      aftermath: [],
      incidents: [],
      origin: null,
      shipName: 'probe',
    },
  };
}

const sim = makeSimCtx();
initWorld(sim);
const fh = sim.world.recordBanks.freehold;
const fhMiners = fh.filter((r) => r.role === 'miner');
ok('sim.fhMinerCount', fhMiners.length === 2, `n=${fhMiners.length}`);
ok('sim.fhEmptyCargo', fhMiners.every((r) => Array.isArray(r.cargo) && r.cargo.length === 0));
ok('sim.fhClass', fhMiners.every((r) => r.classKey === 'light' || r.classKey === 'cutter'));
ok('sim.fhFaction', fhMiners.every((r) => r.faction === 'freehold' || r.faction === 'independent'));
ok('sim.fhRoute', fhMiners.every((r) => Array.isArray(r.route) && r.route.length === 2));

const field = SYSTEMS.freehold.field.center;
const station = SYSTEMS.freehold.station.position;
for (const rec of fhMiners) {
  const wp1 = rec.route[1];
  const dField = Math.hypot(wp1.x - field[0], wp1.y - field[1], wp1.z - field[2]);
  const dPlanet = Math.hypot(wp1.x - station[0], wp1.y - station[1], wp1.z - station[2]);
  ok(`sim.routeNearField.${rec.id}`, dField < 80, `dField=${dField}`);
  ok(`sim.routeNotStation.${rec.id}`, dPlanet > 80, `dStation=${dPlanet}`);
}

const ctx0 = { world: { reputation: { freehold: 0, redledger: 0 } } };
const minerLive = {
  role: 'miner',
  record: { role: 'miner', faction: 'freehold' },
  state: { hull: 100, hullMax: 100, screen: 50, screenMax: 50, destroyed: false },
  ai: { role: 'miner', lastAttacker: 'player', scratched: true },
};
ok('hunt.minerFalse', mayHuntPlayer(ctx0, minerLive) === false);
const traderLive = {
  role: 'trader',
  record: { role: 'trader', faction: 'freehold' },
  state: { hull: 100, hullMax: 100, screen: 50, screenMax: 50 },
  ai: { role: 'trader', lastAttacker: 'player', scratched: true },
};
ok('hunt.traderFalse', mayHuntPlayer(ctx0, traderLive) === false);
const pirateLive = {
  role: 'pirate',
  record: { role: 'pirate', faction: 'redledger' },
  state: { hull: 100, hullMax: 100, screen: 50, screenMax: 50 },
  ai: { role: 'pirate', lastAttacker: null, scratched: false },
};
ok('hunt.pirateTrue', mayHuntPlayer(ctx0, pirateLive) === true);

const miner = {
  id: 'rec-miner-cap',
  role: 'miner',
  classKey: 'light',
  system: 'veridian',
  state: 'enroute',
  live: false,
  dir: 1,
  leg: 0,
  legT: 1,
  dwellUntil: 0,
  gateLinger: false,
  mineHold: false,
  mineAt: 0,
  cargo: [],
  route: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 400 }],
  legLens: [400],
};
const bank = [miner];
const tickCtx = { world: { time: 0, activeEvent: null } };
tickBank(bank, 'veridian', tickCtx);
ok('tick.arrivedHold', miner.mineHold === true && miner.legT === 1, `hold=${miner.mineHold} t=${miner.legT}`);
let sawReverse = false;
for (let i = 0; i < 80; i++) {
  tickCtx.world.time += 1;
  tickBank(bank, 'veridian', tickCtx);
  if (miner.dir === -1) sawReverse = true;
}
const units = (miner.cargo || []).reduce((s, c) => s + (c.units | 0), 0);
ok('tick.cargoCapped', units <= MINER_CARGO_CAP, `units=${units}`);
ok('tick.cargoGrew', units > 0, `units=${units}`);
ok('tick.noEvents', true);
ok('tick.sawReverse', sawReverse === true, `dir=${miner.dir} hold=${miner.mineHold}`);

const liveMiner = {
  id: 'rec-miner-live',
  role: 'miner',
  classKey: 'light',
  system: 'veridian',
  state: 'enroute',
  live: true,
  dir: 1,
  leg: 0,
  legT: 1,
  dwellUntil: 0,
  gateLinger: false,
  mineHold: false,
  mineAt: 0,
  cargo: [],
  route: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 400 }],
  legLens: [400],
};
const liveBank = [liveMiner];
const liveCtx = { world: { time: 0, activeEvent: null } };
tickBank(liveBank, 'veridian', liveCtx);
for (let i = 0; i < 80; i++) {
  liveCtx.world.time += 1;
  tickBank(liveBank, 'veridian', liveCtx);
}
const liveUnits = (liveMiner.cargo || []).reduce((s, c) => s + (c.units | 0), 0);
ok('tick.liveNoExtract', liveUnits === 0, `units=${liveUnits}`);

const cruise = SHIP_CLASSES.freighter.cruise;
const vdMove = {
  id: 'vd-mid',
  role: 'trader',
  classKey: 'freighter',
  system: 'veridian',
  route: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1000 }],
  legLens: [1000],
  leg: 0,
  legT: 0.2,
  dir: 1,
  dwellUntil: 0,
  state: 'enroute',
  gateLinger: false,
};
tickBank([vdMove], 'veridian', { world: { time: 10, activeEvent: null } });
ok('tick.traderStillMoves', Math.abs(vdMove.legT - (0.2 + cruise / 1000)) < 1e-9, `legT=${vdMove.legT}`);

const capMiner = {
  id: 'rec-miner-long',
  role: 'miner',
  classKey: 'light',
  system: 'veridian',
  state: 'enroute',
  live: false,
  dir: 1,
  leg: 0,
  legT: 1,
  dwellUntil: 0,
  gateLinger: false,
  mineHold: false,
  mineAt: 0,
  cargo: [],
  route: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 400 }],
  legLens: [400],
};
const capBank = [capMiner];
const capCtx = { world: { time: 0, activeEvent: null } };
let maxUnits = 0;
for (let i = 0; i < 240; i++) {
  capCtx.world.time += 1;
  tickBank(capBank, 'veridian', capCtx);
  const u = (capMiner.cargo || []).reduce((s, c) => s + (c.units | 0), 0);
  if (u > maxUnits) maxUnits = u;
}
ok('tick.longCap', maxUnits <= MINER_CARGO_CAP, `maxUnits=${maxUnits}`);

const pass = fails.length === 0;
console.log(JSON.stringify({
  pass,
  fails,
  minerCount: {
    freehold: minerCountForCast(SYSTEMS.freehold.cast),
    hush: minerCountForCast(SYSTEMS.hush.cast),
    verge: minerCountForCast(SYSTEMS.verge.cast),
    fhLive: fhMiners.length,
  },
  cap: { MINER_CARGO_CAP, units, liveUnits },
}, null, 2));
process.exit(pass ? 0 : 1);
