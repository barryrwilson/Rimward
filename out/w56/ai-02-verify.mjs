// Verifier evidence for AI-02. Does not import or edit src except as a consumer.
import * as THREE from 'three';
import { SYSTEMS, SHIP_CLASSES } from '../../src/game/state.js';
import {
  initWorld,
  traderRouteWaypoints,
  normalizeTraderRecord,
  traderOutboundDest,
  traderAtOutboundGate,
  beginTransit,
  recordPosition,
} from '../../src/game/world.js';

const fails = [];
const notes = [];
const ok = (name, cond, extra = '') => {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
};

function makeCtx(sys = 'freehold') {
  const lastEvents = [];
  return {
    systems: SYSTEMS,
    lastEvents,
    ship: { object: { position: new THREE.Vector3(0, 0, 0) } },
    world: {
      time: 0,
      credits: 1000,
      fear: 0,
      reputation: {},
      currentSystem: sys,
      records: [],
      recordBanks: {},
      markets: {},
      prices: {},
      milestones: [],
      aftermath: [],
      incidents: [],
      activeEvent: null,
      origin: null,
    },
    elapsed: 0,
    input: { hailPressed: false },
    ships: [],
    emit() {},
  };
}

// --- dest is a real SYSTEMS key and a physical gates[n].to ---
let gateCount = 0;
let hubOnlyHits = 0;
for (const [sysId, def] of Object.entries(SYSTEMS)) {
  const hubRoutes = new Set(def.hub?.routes ?? []);
  for (const g of def.gates ?? []) {
    gateCount++;
    ok(`${sysId}->${g.to}.exists`, Object.hasOwn(SYSTEMS, g.to), 'dest not a SYSTEMS key');
    ok(`${sysId}->${g.to}.notSelf`, g.to !== sysId);
    if (hubRoutes.has(g.to)) hubOnlyHits++;
  }
  if (!def.gates?.length || !def.station) continue;
  const n = def.cast?.traders ?? 0;
  for (let i = 0; i < n; i++) {
    const planned = traderRouteWaypoints(def, i);
    ok(`${sysId}t${i}.twoWp`, planned.waypoints.length === 2);
    ok(`${sysId}t${i}.destGate`, def.gates.some((g) => g.to === planned.outboundTo));
    ok(`${sysId}t${i}.notHub`, !hubRoutes.has(planned.outboundTo) || def.gates.some((g) => g.to === planned.outboundTo));
  }
}
ok('hubOnly.noneOnGates', hubOnlyHits === 0, `hits=${hubOnlyHits}`);
notes.push({ gateCount, systems: Object.keys(SYSTEMS).length, hubOnlyHits });

// --- recordPosition on 2-point routes ---
const rec2 = {
  role: 'trader',
  route: [{ x: 0, y: 0, z: 0 }, { x: 100, y: 0, z: 0 }],
  leg: 0,
  legT: 0.5,
  state: 'enroute',
  dir: 1,
};
const p = recordPosition(rec2, new THREE.Vector3());
ok('pos.mid', Math.abs(p.x - 50) < 1e-9 && p.y === 0 && p.z === 0, `${p.x}`);
rec2.legT = 1;
recordPosition(rec2, p);
ok('pos.gate', p.x === 100);
rec2.state = 'docked';
recordPosition(rec2, p);
ok('pos.dock', p.x === 0);
rec2.state = 'enroute';
rec2.leg = 1;
recordPosition(rec2, p);
ok('pos.badLegNoThrow', Number.isFinite(p.x));

// --- old 3-wp + missing dest ---
const old = {
  role: 'trader',
  id: 'rec-heal',
  system: 'veridian',
  state: 'enroute',
  dir: 1,
  leg: 2,
  legT: 0.2,
  route: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 }, { x: 9, y: 9, z: 9 }],
  legLens: [1, 2],
};
ok('heal.noThrow', (() => { normalizeTraderRecord(old); return true; })());
ok('heal.kept', old.route.length === 2 && old.state === 'enroute');
ok('heal.dest', SYSTEMS.veridian.gates.some((g) => g.to === old.outboundTo));

const nodest = { role: 'trader', id: 'rec-x', system: 'nope', state: 'enroute', outboundTo: null, route: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], leg: 0, legT: 1, dir: 1 };
normalizeTraderRecord(nodest);
ok('missingSys.kept', nodest.state === 'enroute' && nodest.route.length === 2);
ok('missingSys.destNull', traderOutboundDest(nodest, 'nope') === null);

const ctx0 = { world: { time: 10, currentSystem: 'freehold' } };
ok('begin.missingDest', beginTransit(ctx0, { role: 'trader', system: 'freehold', state: 'enroute' }, null) === false);

// --- live sim: drain + loop + roles ---
const ctx = makeCtx('freehold');
const worldSys = initWorld(ctx);

const startTraders = ctx.world.records.filter((r) => r.role === 'trader');
const startPatrols = ctx.world.records.filter((r) => r.role === 'patrol');
const startPirates = ctx.world.records.filter((r) => r.role === 'pirate');
const startAces = ctx.world.records.filter((r) => r.role === 'ace');
ok('cast.traders', startTraders.length === 8, `${startTraders.length}`);
ok('cast.patrols', startPatrols.length === 2);
ok('spawn.twoWp', startTraders.every((r) => r.route.length === 2));
ok('spawn.dest', startTraders.every((r) => r.outboundTo === 'veridian'));
ok('patrol.threeWp', startPatrols.every((r) => r.route.length === 3));

const patrolSnap = startPatrols.map((r) => ({ id: r.id, routeLen: r.route.length, dest: r.transitTo ?? null }));

function counts() {
  const banks = ctx.world.recordBanks;
  const out = {};
  for (const id of Object.keys(banks)) {
    const recs = banks[id];
    out[id] = {
      traders: recs.filter((r) => r.role === 'trader').length,
      enroute: recs.filter((r) => r.role === 'trader' && r.state === 'enroute').length,
      docked: recs.filter((r) => r.role === 'trader' && r.state === 'docked').length,
      inTransit: recs.filter((r) => r.role === 'trader' && r.state === 'inTransit').length,
      pirates: recs.filter((r) => r.role === 'pirate').length,
      patrols: recs.filter((r) => r.role === 'patrol').length,
      aces: recs.filter((r) => r.role === 'ace').length,
    };
  }
  return out;
}

let firstEmptyAt = null;
let firstTransitAt = null;
let loopHits = 0;
const seenArriveIds = new Set();

for (let t = 0; t < 180; t++) {
  ctx.world.time = t;
  ctx.lastEvents.length = 0;
  worldSys.update(1);

  const fh = ctx.world.recordBanks.freehold;
  const present = fh.filter((r) => r.role === 'trader' && (r.state === 'enroute' || r.state === 'docked'));
  const trans = fh.filter((r) => r.role === 'trader' && r.state === 'inTransit');
  if (trans.length && firstTransitAt == null) firstTransitAt = t;
  if (present.length === 0 && firstEmptyAt == null) firstEmptyAt = t;

  for (const rec of fh) {
    if (rec.role === 'trader' && rec.state === 'inTransit' && rec.transitEta <= ctx.world.time) {
      // arriveMigrants already ran this frame; leftover would be a stall
    }
  }

  const vd = ctx.world.recordBanks.veridian;
  if (vd) {
    for (const rec of vd) {
      if (rec.role !== 'trader') continue;
      if (rec.state === 'enroute' && rec.system === 'veridian' && rec.legT === 1 && rec.dir === -1) {
        if (!seenArriveIds.has(rec.id) && startTraders.some((s) => s.id === rec.id)) {
          seenArriveIds.add(rec.id);
          const pos = recordPosition(rec, new THREE.Vector3());
          const gate = SYSTEMS.veridian.gates.find((g) => g.to === rec.outboundTo);
          rec._arrivePos = { x: pos.x, y: pos.y, z: pos.z, outboundTo: rec.outboundTo, gate };
        }
      }
      // same-frame depart: just arrived (dir -1, at gate) then inTransit again
      if (rec.state === 'inTransit' && seenArriveIds.has(rec.id) && rec.system === 'veridian') {
        loopHits++;
      }
    }
  }
}

const after = counts();
const fhPresent = after.freehold.enroute + after.freehold.docked;
ok('patrols.stayed', after.freehold.patrols === 2);
ok('pirates.stayed', after.freehold.pirates === 4);
ok('ace.stayed', after.freehold.aces === 1);
ok('patrols.noTransit', startPatrols.every((r) => r.state !== 'inTransit' && r.route.length === 3));
ok('pirates.noTransit', startPirates.every((r) => r.state !== 'inTransit'));
ok('ace.noTransit', startAces.every((r) => r.state !== 'inTransit'));
ok('loop.none', loopHits === 0, `hits=${loopHits}`);

// Arrivals should park at dest gate heading station-ward
const arrived = [...seenArriveIds];
ok('arrive.some', arrived.length > 0, 'no freehold trader reached veridian in 180s');
if (arrived.length) {
  const rec = ctx.world.recordBanks.veridian.find((r) => r.id === arrived[0]);
  ok('arrive.dir', rec.dir === -1);
  ok('arrive.legT', rec.legT === 1);
  ok('arrive.leg', rec.leg === 0);
  ok('arrive.outboundHome', rec.outboundTo === 'freehold', `${rec.outboundTo}`);
  ok('arrive.twoWp', rec.route.length === 2);
  const pos = recordPosition(rec, new THREE.Vector3());
  const gate = SYSTEMS.veridian.gates.find((g) => g.to === 'freehold');
  const d = Math.hypot(pos.x - gate.position[0], pos.y - gate.position[1], pos.z - gate.position[2]);
  ok('arrive.nearGate', d < 80, `d=${d.toFixed(2)}`);
}

// Frozen dest: veridian locals should still be enroute (not inTransit) because
// only the current (freehold) bank galaxy-ticks.
if (after.veridian) {
  const vdLocals = ctx.world.recordBanks.veridian.filter((r) => r.role === 'trader' && !startTraders.some((s) => s.id === r.id));
  ok('vd.localsFrozen', vdLocals.every((r) => r.state === 'enroute' || r.state === 'docked'));
  ok('vd.localsNoTransit', vdLocals.every((r) => r.state !== 'inTransit'));
}

// Drain hunt
notes.push({
  firstTransitAt,
  firstEmptyAt,
  after,
  arrived: arrived.length,
  fhPresentAfter180: fhPresent,
  cruise: SHIP_CLASSES.freighter.cruise,
});

// --- force same-frame arrive: eta now, already at dest heading out? ---
const ctx2 = makeCtx('freehold');
const w2 = initWorld(ctx2);
const trader = ctx2.world.records.find((r) => r.role === 'trader');
beginTransit(ctx2, trader, 'veridian', 'freehold');
trader.transitEta = 0;
ctx2.world.time = 5;
w2.update(1);
const inVd = ctx2.world.recordBanks.veridian?.find((r) => r.id === trader.id);
ok('forceArrive.moved', !!inVd && inVd.state === 'enroute', inVd ? inVd.state : 'missing');
ok('forceArrive.notRetransit', inVd && inVd.state !== 'inTransit');
ok('forceArrive.dirNeg', inVd && inVd.dir === -1);
ok('forceArrive.recordKept', !!inVd);

// pickMigrant skip: nobody at gate → no extra transits among mid-lane
const midLane = ctx2.world.records.filter((r) => r.role === 'trader' && r.state === 'enroute');
for (const r of midLane) {
  r.leg = 0;
  r.legT = 0.2;
  r.dir = 1;
  r.dwellUntil = 0;
}
const beforeIds = new Set(midLane.map((r) => r.id));
ctx2.world.time = 200; // past first pickMigrant window
w2.update(1);
const yanked = midLane.filter((r) => r.state === 'inTransit' && beforeIds.has(r.id) && r.legT < 0.98);
ok('pick.skipMidlane', yanked.length === 0, yanked.map((r) => r.id).join(','));

// transitEta finite with NaN world time
const nanRec = { role: 'trader', system: 'freehold', state: 'enroute' };
ok('eta.nan', beginTransit({ world: { time: NaN, currentSystem: 'freehold' } }, nanRec, 'veridian') === true);
ok('eta.finite', Number.isFinite(nanRec.transitEta));

const report = { pass: fails.length === 0, fails, notes };
console.log(JSON.stringify(report, null, 2));
process.exit(fails.length ? 1 : 0);
