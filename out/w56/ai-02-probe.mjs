// Wave 56 AI-02: trader routes end at a physical gate; pickMigrant-only transit.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { SYSTEMS } from '../../src/game/state.js';
import {
  traderRouteWaypoints,
  normalizeTraderRecord,
  traderOutboundDest,
  traderAtOutboundGate,
  beginTransit,
  recordPosition,
  initWorld,
} from '../../src/game/world.js';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, '../../src/game/world.js'), 'utf8');
const fails = [];
const ok = (name, cond, extra = '') => {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
};

// --- waypoint helper: station + dest gate, dest is gates[n].to ----------
for (const [sysId, def] of Object.entries(SYSTEMS)) {
  if (!def.gates?.length || !def.station) continue;
  const n = def.gates.length;
  for (let i = 0; i < n * 2; i++) {
    const planned = traderRouteWaypoints(def, i);
    const dest = def.gates[i % n];
    ok(
      `${sysId}[${i}].len`,
      planned.waypoints.length === 2,
      `got ${planned.waypoints.length}`,
    );
    ok(`${sysId}[${i}].to`, planned.outboundTo === dest.to, `${planned.outboundTo}`);
    ok(
      `${sysId}[${i}].gatePos`,
      planned.waypoints[1].x === dest.position[0]
        && planned.waypoints[1].y === dest.position[1]
        && planned.waypoints[1].z === dest.position[2],
    );
    const hubRoutes = def.hub?.routes ?? [];
    ok(
      `${sysId}[${i}].notHubOnly`,
      !hubRoutes.length || def.gates.some((g) => g.to === planned.outboundTo),
    );
  }
}

// --- old 3-waypoint save heal --------------------------------------------
const old = {
  role: 'trader',
  id: 'rec-9',
  system: 'veridian',
  state: 'enroute',
  dir: 1,
  leg: 1,
  legT: 0.7,
  outboundTo: undefined,
  route: [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 50, z: 900 },
    { x: 100, y: 10, z: 1400 },
  ],
  legLens: [910, 520],
};
normalizeTraderRecord(old);
ok('heal.routeLen', old.route.length === 2, `${old.route.length}`);
ok('heal.leg', old.leg === 0 && old.legT === 1);
ok('heal.outbound', SYSTEMS.veridian.gates.some((g) => g.to === old.outboundTo), `${old.outboundTo}`);
ok('heal.legLens', old.legLens.length === 1);
ok('heal.atGate', traderAtOutboundGate(old) === true);
ok('heal.lingerFlag', old.gateLinger === false);

const mid = {
  role: 'trader',
  id: 'rec-2',
  system: 'freehold',
  state: 'enroute',
  dir: 1,
  leg: 0,
  legT: 0.4,
  route: [
    { x: 120, y: 20, z: 620 },
    { x: 0, y: 60, z: -900 },
    { x: 50, y: 10, z: -1400 },
  ],
};
normalizeTraderRecord(mid);
ok('healMid.routeLen', mid.route.length === 2);
ok('healMid.progress', mid.leg === 0 && mid.legT === 0.4);
ok('healMid.notAtGate', traderAtOutboundGate(mid) === false);

const pos = recordPosition(old, new THREE.Vector3());
ok('recordPosition.gate', Number.isFinite(pos.x) && Number.isFinite(pos.y) && Number.isFinite(pos.z));

// --- beginTransit: physical dest only, finite eta, no pirate --------------
const ctx = { world: { time: 100, currentSystem: 'freehold' } };
const trader = {
  role: 'trader',
  id: 'rec-1',
  system: 'freehold',
  state: 'enroute',
  outboundTo: 'veridian',
};
ok('transit.ok', beginTransit(ctx, trader, 'veridian') === true);
ok('transit.state', trader.state === 'inTransit' && trader.transitTo === 'veridian');
ok('transit.eta', Number.isFinite(trader.transitEta) && trader.transitEta > ctx.world.time);
ok('transit.noDouble', beginTransit(ctx, trader, 'veridian') === false);

const pirate = { role: 'pirate', system: 'freehold', state: 'enroute' };
ok('transit.noPirate', beginTransit(ctx, pirate, 'veridian') === false);

const hubOnly = { role: 'trader', system: 'freehold', state: 'enroute' };
ok('transit.noHub', beginTransit(ctx, hubOnly, 'fh_hearth') === false);
ok('transit.noProto', beginTransit(ctx, { role: 'trader', system: 'freehold', state: 'enroute' }, '__proto__') === false);
ok('transit.noMissing', beginTransit(ctx, { role: 'trader', system: 'freehold', state: 'enroute' }, 'no-such-system') === false);

const nanCtx = { world: { time: NaN, currentSystem: 'freehold' } };
const nanRec = { role: 'trader', system: 'freehold', state: 'enroute' };
ok('transit.nanTime', beginTransit(nanCtx, nanRec, 'veridian') === true);
ok('transit.nanEta', Number.isFinite(nanRec.transitEta));

ok('dest.rejectHub', traderOutboundDest({ role: 'trader', outboundTo: 'fh_hearth', id: 'rec-3' }, 'freehold') === 'veridian');

// --- source contracts: pickMigrant is the only transit start --------------
ok('src.pickPrefersGate', src.includes('traderAtOutboundGate(rec)'));
ok('src.skipIfNone', /if\s*\(\s*!chosen\s*\)\s*return/.test(src));
ok('src.arriveTwoWp', src.includes('traderArrivalWaypoints(def, fromId)'));
ok('src.noTraderPlanetLoop', !/role:\s*'trader'[\s\S]{0,400}jitter\(planet/.test(src));
ok('src.patrolKeepsPlanet', /role:\s*'patrol'[\s\S]{0,250}jitter\(planet/.test(src));
ok('src.wave22Gates', src.includes('physical gates ONLY'));
ok('src.healRebuild', src.includes('normalizeTraderRecord(rec)'));
ok('src.gateHold', src.includes('GATE_HOLD'));
const gTick = src.match(/function galaxyTick\(ctx\) \{[\s\S]*?\n  \}/);
ok('src.noGalaxyTransit', !!(gTick && !gTick[0].includes('beginTransit')));
ok('src.lingerThenReverse', !!(gTick && gTick[0].includes('gateLinger') && gTick[0].includes('dir = -1')));
const beginSites = [...src.matchAll(/beginTransit\s*\(/g)];
ok('src.beginTransitOnlyPick', beginSites.length === 2, `calls=${beginSites.length}`); // def + pickMigrant

// --- 180s Freehold drain: must not empty the trader cast ------------------
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
const seeded = sim.world.records.filter((r) => r.role === 'trader').length;
ok('drain.seeded', seeded === SYSTEMS.freehold.cast.traders, `seeded=${seeded}`);

let minLocal = seeded;
for (let i = 0; i < 180; i++) {
  sim.world.time += 1;
  sim.elapsed += 1;
  sim.lastEvents.length = 0;
  world.update(1);
  const localNow = sim.world.records.filter((r) => r.role === 'trader' && r.state !== 'inTransit' && r.state !== 'dead' && r.state !== 'captured').length;
  if (localNow < minLocal) minLocal = localNow;
}
const local = sim.world.records.filter((r) => r.role === 'trader' && (r.state === 'enroute' || r.state === 'docked'));
const transitHere = sim.world.records.filter((r) => r.role === 'trader' && r.state === 'inTransit');
const arrived = (sim.world.recordBanks.veridian ?? []).filter((r) => r.role === 'trader' && r.state !== 'inTransit');
const departed = transitHere.length + arrived.length;
const maxDepart = Math.floor(180 / (90 * 0.75)) + 1; // first pick + min-interval repeats

ok('drain.localRemain', local.length > 0, `local=${local.length}`);
ok('drain.notEmptied', local.length >= seeded - maxDepart, `local=${local.length} seeded=${seeded} departed=${departed}`);
ok('drain.minLocal', minLocal > 0, `minLocal=${minLocal}`);
ok('drain.cap', departed <= maxDepart, `departed=${departed} cap=${maxDepart}`);
ok(
  'drain.noInstantEmpty',
  minLocal > 0 && (sim.world.time >= 180),
  `minLocal=${minLocal}`,
);

const pass = fails.length === 0;
console.log(JSON.stringify({
  pass,
  fails,
  drain: { seeded, local: local.length, transitHere: transitHere.length, arrived: arrived.length, departed, minLocal, maxDepart },
  sample: {
    freehold: traderRouteWaypoints(SYSTEMS.freehold, 0).outboundTo,
    veridian0: traderRouteWaypoints(SYSTEMS.veridian, 0).outboundTo,
    veridian1: traderRouteWaypoints(SYSTEMS.veridian, 1).outboundTo,
    healedTo: old.outboundTo,
  },
}, null, 2));
process.exit(pass ? 0 : 1);
