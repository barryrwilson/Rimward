// Wave 57: dest banks tick; pickMigrant may take a gate-ready trader from any existing bank.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { SYSTEMS, SHIP_CLASSES } from '../../src/game/state.js';
import { tickBank, initWorld, traderAtOutboundGate } from '../../src/game/world.js';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, '../../src/game/world.js'), 'utf8');
const fails = [];
const ok = (name, cond, extra = '') => {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
};

const gtStart = src.indexOf('function galaxyTick');
const gtEnd = src.indexOf('return {', gtStart);
const galaxyTickSrc = gtStart >= 0 && gtEnd > gtStart ? src.slice(gtStart, gtEnd) : '';
const pickStart = src.indexOf('function pickMigrant');
const pickEnd = src.indexOf('function arriveMigrants');
const pickSrc = pickStart >= 0 && pickEnd > pickStart ? src.slice(pickStart, pickEnd) : '';
const tbStart = src.indexOf('export function tickBank');
const tbEnd = src.indexOf('function fireMilestone', tbStart);
const tickBankSrc = tbStart >= 0 && tbEnd > tbStart ? src.slice(tbStart, tbEnd) : '';

ok('src.tickBankExport', src.includes('export function tickBank'));
ok('src.galaxyVisitsBanks', galaxyTickSrc.includes('recordBanks') && galaxyTickSrc.includes('tickBank('));
ok('src.galaxyMoreThanRecords', galaxyTickSrc.includes('recordBanks') && !/for\s*\(\s*const rec of ctx\.world\.records\s*\)/.test(galaxyTickSrc));
ok('src.noGalaxyTransit', galaxyTickSrc.includes('gateLinger') && !galaxyTickSrc.includes('beginTransit('));
ok('src.tickBankNoTransit', tickBankSrc.includes('gateLinger') && !tickBankSrc.includes('beginTransit'));
ok('src.pickAllBanks', pickSrc.includes('recordBanks') && pickSrc.includes('for (const sysId in banks)'));
ok('src.pickStartsTransit', pickSrc.includes('beginTransit(ctx, chosen'));
ok('src.pickSourceBank', pickSrc.includes('beginTransit(ctx, chosen, dest, chosenSys)'));
ok('src.noEnsureInTick', !tickBankSrc.includes('ensureBank') && !galaxyTickSrc.includes('ensureBank') && !pickSrc.includes('ensureBank'));

// --- isolated tickBank: dest-system legT moves; hurry is event-system only ---
function stubRoute(legLen = 1000) {
  return {
    route: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: legLen }],
    legLens: [legLen],
    leg: 0,
    legT: 0.2,
    dir: 1,
    dwellUntil: 0,
    state: 'enroute',
    gateLinger: false,
  };
}

const vdMove = { id: 'vd-mid', role: 'trader', classKey: 'freighter', system: 'veridian', ...stubRoute(1000) };
const startT = vdMove.legT;
tickBank([vdMove], 'veridian', { world: { time: 10, activeEvent: null } });
const cruise = SHIP_CLASSES.freighter.cruise;
ok('tick.vdMoved', vdMove.legT > startT, `legT=${vdMove.legT}`);
ok('tick.vdDelta', Math.abs(vdMove.legT - (startT + cruise / 1000)) < 1e-9, `legT=${vdMove.legT}`);

const pFh = { id: 'p-fh', role: 'pirate', classKey: 'cutter', system: 'freehold', ...stubRoute(1000) };
const pVd = { id: 'p-vd', role: 'pirate', classKey: 'cutter', system: 'veridian', ...stubRoute(1000) };
const evCtx = { world: { time: 0, activeEvent: { kind: 'pirateBlockade', system: 'freehold' } } };
tickBank([pFh], 'freehold', evCtx);
tickBank([pVd], 'veridian', evCtx);
const cutter = SHIP_CLASSES.cutter.cruise;
ok('hurry.eventSys', Math.abs(pFh.legT - (0.2 + (cutter * 1.6) / 1000)) < 1e-9, `fh=${pFh.legT}`);
ok('hurry.otherSys', Math.abs(pVd.legT - (0.2 + cutter / 1000)) < 1e-9, `vd=${pVd.legT}`);

const skip = { id: 'dead', role: 'trader', classKey: 'freighter', state: 'inTransit', route: stubRoute().route, legLens: [1000], leg: 0, legT: 0.5, dir: 1, dwellUntil: 0 };
tickBank([skip], 'veridian', { world: { time: 1, activeEvent: null } });
ok('tick.skipTransit', skip.legT === 0.5);

// --- 180 s two-bank sim: player stays in Freehold; Veridian already generated ---
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
const world = initWorld(sim);
const fhBank = sim.world.recordBanks.freehold;
ok('sim.recordsIsBank', fhBank === sim.world.records);
ok('sim.onlyFreeholdAtBoot', Object.keys(sim.world.recordBanks).join(',') === 'freehold');

const vdDef = SYSTEMS.veridian;
const vdStation = { x: vdDef.station.position[0], y: vdDef.station.position[1], z: vdDef.station.position[2] };
const vdGateFh = vdDef.gates[0];
const vdGatePos = { x: vdGateFh.position[0], y: vdGateFh.position[1], z: vdGateFh.position[2] };
const vdLeg = Math.hypot(vdGatePos.x - vdStation.x, vdGatePos.y - vdStation.y, vdGatePos.z - vdStation.z);

const vdMid = {
  id: 'rec-vd-mid',
  name: 'Probe Loom',
  classKey: 'freighter',
  faction: 'veridian',
  role: 'trader',
  system: 'veridian',
  state: 'enroute',
  live: false,
  dir: -1,
  leg: 0,
  legT: 0.4,
  dwellUntil: 0,
  outboundTo: 'freehold',
  gateLinger: false,
  route: [vdStation, vdGatePos],
  legLens: [vdLeg],
};
const vdReady = {
  id: 'rec-vd-ready',
  name: 'Probe Ansel',
  classKey: 'freighter',
  faction: 'veridian',
  role: 'trader',
  system: 'veridian',
  state: 'enroute',
  live: false,
  dir: 1,
  leg: 0,
  legT: 1,
  dwellUntil: 1e9, // stay gate-ready through the first pick window
  outboundTo: 'freehold',
  gateLinger: true,
  route: [vdStation, vdGatePos],
  legLens: [vdLeg],
};
sim.world.recordBanks.veridian = [vdMid, vdReady];
ok('ready.atGate', traderAtOutboundGate(vdReady) === true);
ok('mid.notAtGate', traderAtOutboundGate(vdMid) === false);

for (const rec of sim.world.records) {
  if (rec.role !== 'trader') continue;
  rec.leg = 0;
  rec.legT = 0.12;
  rec.dir = 1;
  rec.gateLinger = false;
  rec.state = 'enroute';
  rec.dwellUntil = 1e9; // park Freehold traders; dest pick must be the only option
}

const seededFh = sim.world.records.filter((r) => r.role === 'trader').length;
const vdStartT = vdMid.legT;
const bankKeysStart = Object.keys(sim.world.recordBanks).slice().sort().join(',');

let minLocal = seededFh;
let pickedReady = false;
let pickAt = null;
for (let i = 0; i < 180; i++) {
  sim.world.time += 1;
  sim.elapsed += 1;
  sim.lastEvents.length = 0;
  world.update(1);
  const localNow = sim.world.records.filter((r) => r.role === 'trader' && r.state !== 'inTransit' && r.state !== 'dead' && r.state !== 'captured').length;
  if (localNow < minLocal) minLocal = localNow;
  if (!pickedReady && (vdReady.state === 'inTransit' || vdReady.system !== 'veridian')) {
    pickedReady = true;
    pickAt = sim.world.time;
  }
}

const local = sim.world.records.filter((r) => r.role === 'trader' && (r.state === 'enroute' || r.state === 'docked'));
const transitHere = sim.world.records.filter((r) => r.role === 'trader' && r.state === 'inTransit');
const banks = sim.world.recordBanks;
const bankKeysEnd = Object.keys(banks).slice().sort().join(',');
const transitAll = [];
const arrivedHome = [];
for (const sysId of Object.keys(banks)) {
  for (const r of banks[sysId]) {
    if (r.role !== 'trader') continue;
    if (r.state === 'inTransit') transitAll.push({ id: r.id, from: sysId, to: r.transitTo });
    if (r.id === 'rec-vd-ready' && sysId !== 'veridian' && r.state !== 'inTransit') arrivedHome.push({ id: r.id, sys: sysId });
  }
}
const departed = transitAll.length + arrivedHome.length + (vdReady.state !== 'inTransit' && vdReady.system !== 'veridian' && !arrivedHome.length ? 1 : 0);
const maxDepart = Math.floor(180 / (90 * 0.75)) + 1;
const extraBanks = Object.keys(banks).filter((k) => k !== 'freehold' && k !== 'veridian');

ok('dest.legTMoved', vdMid.legT !== vdStartT || vdMid.dir !== 1 || vdMid.state === 'docked', `legT=${vdMid.legT} dir=${vdMid.dir} state=${vdMid.state}`);
ok('dest.stillVeridian', vdMid.system === 'veridian' && (banks.veridian ?? []).includes(vdMid));
ok('dest.pickReady', pickedReady, `state=${vdReady.state} system=${vdReady.system}`);
ok('dest.pickDestPhysical', !pickedReady || vdReady.transitTo === 'freehold' || vdReady.system === 'freehold', `to=${vdReady.transitTo} sys=${vdReady.system}`);
ok('dest.noUnvisited', extraBanks.length === 0, `extra=${extraBanks.join(',')}`);
ok('dest.bankKeys', bankKeysEnd === 'freehold,veridian' || bankKeysStart === 'freehold,veridian');
ok('drain.localRemain', local.length > 0, `local=${local.length}`);
ok('drain.minLocal', minLocal > 0, `minLocal=${minLocal}`);
ok('drain.notEmptied', local.length >= seededFh - maxDepart, `local=${local.length} seeded=${seededFh}`);
ok('drain.cap', departed <= maxDepart, `departed=${departed} cap=${maxDepart}`);
ok('stay.freehold', sim.world.currentSystem === 'freehold');

const pass = fails.length === 0;
console.log(JSON.stringify({
  pass,
  fails,
  dest: {
    vdStartT,
    vdMidT: vdMid.legT,
    vdMidDir: vdMid.dir,
    vdMidState: vdMid.state,
    vdReadyState: vdReady.state,
    vdReadySys: vdReady.system,
    vdReadyTo: vdReady.transitTo,
    pickAt,
    extraBanks,
    bankKeysEnd,
  },
  drain: {
    seededFh,
    local: local.length,
    transitHere: transitHere.length,
    transitAll: transitAll.length,
    arrivedHome: arrivedHome.length,
    departed,
    minLocal,
    maxDepart,
  },
}, null, 2));
process.exit(pass ? 0 : 1);
