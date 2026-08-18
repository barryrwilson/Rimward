// Wave 59 extra pad-home cases. Logs only. No production edits.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { SYSTEMS } from '../../../src/game/state.js';
import {
  normalizeTraderRecord,
  normalizeMinerRecord,
  healPadHome,
} from '../../../src/game/world.js';
import {
  hullRadiusFor,
  writeStationHold,
  STATION_HOLD_PAD,
} from '../../../src/game/traffic-feel.js';
import { PHY } from '../../../src/game/physics.js';

const here = dirname(fileURLToPath(import.meta.url));
const worldSrc = readFileSync(resolve(here, '../../../src/game/world.js'), 'utf8');
const lines = [];
const fails = [];
const log = (s) => lines.push(s);
const ok = (name, cond, extra = '') => {
  const msg = extra ? `${name}: ${extra}` : name;
  if (!cond) {
    fails.push(msg);
    log(`FAIL ${msg}`);
  } else {
    log(`CLEAN ${name}`);
  }
};

const fh = SYSTEMS.freehold;
const s = fh.station.position;
const g0 = fh.gates[0].position;
const g1 = fh.gates[1] ? fh.gates[1].position : g0;
const station = { x: s[0], y: s[1], z: s[2] };
const gate = { x: g0[0], y: g0[1], z: g0[2] };
const gateB = { x: g1[0], y: g1[1], z: g1[2] };
const pad = { x: s[0], y: s[1], z: s[2] };

const minXZ = (classKey) => PHY.STATION_CYL_RADIUS + hullRadiusFor(classKey) + STATION_HOLD_PAD - 0.01;
const xzOf = (p) => Math.hypot(p.x - station.x, p.z - station.z);
const samePt = (a, b, eps = 1e-3) =>
  Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.z - b.z) < eps;
const isPlain = (p) =>
  !!p
  && typeof p === 'object'
  && p.isVector3 !== true
  && !(p instanceof THREE.Vector3)
  && Number.isFinite(p.x)
  && Number.isFinite(p.y)
  && Number.isFinite(p.z);

const rebuildSrc = worldSrc.slice(
  worldSrc.indexOf('function rebuildTransitRegistry'),
  worldSrc.indexOf('function rebuildTransitRegistry') + 700,
);
const tickSrc = worldSrc.slice(
  worldSrc.indexOf('export function tickBank'),
  worldSrc.indexOf('export function tickBank') + 900,
);
const ensureSrc = worldSrc.slice(
  worldSrc.indexOf('function ensureBank'),
  worldSrc.indexOf('function ensureBank') + 220,
);
const healSrc = worldSrc.slice(
  worldSrc.indexOf('export function healPadHome'),
  worldSrc.indexOf('export function normalizeTraderRecord'),
);

ok('src.rebuild.trader', rebuildSrc.includes("if (rec.role === 'trader') normalizeTraderRecord(rec)"));
ok('src.rebuild.miner', rebuildSrc.includes("if (rec.role === 'miner') normalizeMinerRecord(rec)"));
ok('src.tick.trader', tickSrc.includes("if (rec.role === 'trader') normalizeTraderRecord(rec)"));
ok('src.tick.miner', /if \(rec\.role === 'miner'\)/.test(tickSrc) && tickSrc.includes('normalizeMinerRecord(rec)'));
ok('src.initWorld.rebuild', worldSrc.includes('rebuildTransitRegistry(ctx)'));
ok('src.ensureBank.noNormalize', !ensureSrc.includes('normalizeTraderRecord') && !ensureSrc.includes('normalizeMinerRecord'));
ok('src.heal.roleGuard', healSrc.includes("role !== 'trader'") && healSrc.includes("role !== 'miner'"));
ok('src.heal.plainOut', healSrc.includes('writeStationHold({ x: 0, y: 0, z: 0 }'));

// Cutter miner uses cutter hull, not light or freighter.
const cutter = {
  role: 'miner',
  classKey: 'cutter',
  system: 'freehold',
  route: [{ ...pad }, { ...gate }],
};
normalizeMinerRecord(cutter);
const expectCutter = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'cutter', gate);
ok('heal.cutter.xz', xzOf(cutter.route[0]) >= minXZ('cutter'), `xz=${xzOf(cutter.route[0])}`);
ok('heal.cutter.matchesWrite', samePt(cutter.route[0], expectCutter), JSON.stringify(cutter.route[0]));
ok('heal.cutter.gtLight', xzOf(cutter.route[0]) > minXZ('light') + 0.5);
ok('heal.cutter.ltFreight', xzOf(cutter.route[0]) < minXZ('freighter'));
ok('heal.cutter.plain', isPlain(cutter.route[0]));
ok('heal.cutter.gateEnd', samePt(cutter.route[1], gate));

// Trader always freighter even if classKey is light.
const lightTrader = {
  role: 'trader',
  classKey: 'light',
  system: 'freehold',
  outboundTo: fh.gates[0].to,
  route: [{ ...pad }, { ...gate }],
};
const keepTo = lightTrader.outboundTo;
normalizeTraderRecord(lightTrader);
const expectFreight = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'freighter', gate);
ok('heal.traderIgnoresClass', samePt(lightTrader.route[0], expectFreight));
ok('heal.trader.outboundKept', lightTrader.outboundTo === keepTo);
ok('heal.trader.gateEnd', samePt(lightTrader.route[1], gate));
ok('heal.trader.plain', isPlain(lightTrader.route[0]));

// Unknown miner classKey falls back to light.
const oddMiner = {
  role: 'miner',
  classKey: 'frigate',
  system: 'freehold',
  route: [{ ...pad }, { ...gate }],
};
normalizeMinerRecord(oddMiner);
const expectLight = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'light', gate);
ok('heal.minerFallbackLight', samePt(oddMiner.route[0], expectLight));

// fromPos is route[1] (second gate), not gates[0].
const viaB = {
  role: 'trader',
  classKey: 'freighter',
  system: 'freehold',
  outboundTo: fh.gates[1] ? fh.gates[1].to : fh.gates[0].to,
  route: [{ ...pad }, { ...gateB }],
};
normalizeTraderRecord(viaB);
const expectViaB = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'freighter', gateB);
ok('heal.fromPos.route1', samePt(viaB.route[0], expectViaB));
ok('heal.fromPos.notGate0', !samePt(viaB.route[0], expectFreight) || samePt(gate, gateB));

// Missing route[1] uses gates[0].
const noSecond = {
  role: 'miner',
  classKey: 'light',
  system: 'freehold',
  route: [{ ...pad }],
};
normalizeMinerRecord(noSecond);
const expectGate0 = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'light', gate);
ok('heal.fromPos.gateFallback', samePt(noSecond.route[0], expectGate0));
ok('heal.fromPos.singleLen', noSecond.route.length === 1);

// NaN route[1] also falls back to gate.
const nanSecond = {
  role: 'trader',
  classKey: 'freighter',
  system: 'freehold',
  outboundTo: fh.gates[0].to,
  route: [{ ...pad }, { x: NaN, y: 0, z: NaN }],
};
normalizeTraderRecord(nanSecond);
ok('heal.fromPos.nanWp1', samePt(nanSecond.route[0], expectFreight));
ok('heal.fromPos.nanWp1.kept', Number.isNaN(nanSecond.route[1].x) && Number.isNaN(nanSecond.route[1].z));

// Already-good cutter hold stays put (including object identity of route[1]).
const goodCutterHold = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'cutter', gate);
const goodCutter = {
  role: 'miner',
  classKey: 'cutter',
  system: 'freehold',
  route: [{ x: goodCutterHold.x, y: goodCutterHold.y, z: goodCutterHold.z }, { ...gate }],
};
const goodWp1 = goodCutter.route[1];
normalizeMinerRecord(goodCutter);
ok('keep.cutter.hold', samePt(goodCutter.route[0], goodCutterHold));
ok('keep.cutter.wp1Ident', goodCutter.route[1] === goodWp1);

// Slightly off pad (1u) stays; inside-cylinder is not auto-healed.
const near = {
  role: 'trader',
  classKey: 'freighter',
  system: 'freehold',
  outboundTo: fh.gates[0].to,
  route: [{ x: station.x + 1, y: station.y, z: station.z }, { ...gate }],
};
normalizeTraderRecord(near);
ok('keep.nearPad', samePt(near.route[0], { x: station.x + 1, y: station.y, z: station.z }));

// Patrol / ace pad homes are not rewritten.
const patrolRoute = [{ ...pad }, { ...gate }, { x: gate.x + 10, y: gate.y, z: gate.z }];
const patrol = { role: 'patrol', classKey: 'heavy', system: 'freehold', route: patrolRoute.map((p) => ({ ...p })) };
const ace = {
  role: 'ace',
  classKey: 'ace',
  system: 'freehold',
  route: [{ ...pad }, { ...gate }],
};
healPadHome(patrol);
healPadHome(ace);
normalizeTraderRecord(patrol);
normalizeMinerRecord(ace);
ok('leave.patrol.pad', samePt(patrol.route[0], pad));
ok('leave.patrol.mid', samePt(patrol.route[1], gate));
ok('leave.ace.pad', samePt(ace.route[0], pad));

// Vector3 on pad is replaced with a plain object.
const vPad = new THREE.Vector3(station.x, station.y, station.z);
const vGate = new THREE.Vector3(gate.x, gate.y, gate.z);
const vRec = {
  role: 'trader',
  classKey: 'freighter',
  system: 'freehold',
  outboundTo: fh.gates[0].to,
  route: [vPad, vGate],
};
normalizeTraderRecord(vRec);
ok('heal.vec3.replaced', isPlain(vRec.route[0]) && vRec.route[0] !== vPad);
ok('heal.vec3.gateEnd', vRec.route[1] === vGate && vGate.x === gate.x && vGate.z === gate.z);

// Missing system / NaN wp0 do nothing and do not throw.
const missing = { role: 'trader', system: 'nope', outboundTo: 'x', route: [{ ...pad }, { ...gate }] };
const nanWp0 = { role: 'miner', classKey: 'light', system: 'freehold', route: [{ x: NaN, y: station.y, z: NaN }, { ...gate }] };
const copyMissing = JSON.stringify(missing);
let threw = false;
try {
  healPadHome(missing);
  healPadHome(nanWp0);
  normalizeTraderRecord({ role: 'trader', system: 'nope', route: [{ ...pad }, { ...gate }] });
  normalizeMinerRecord(nanWp0);
} catch {
  threw = true;
}
ok('nan.noThrow.extra', !threw);
ok('miss.system.unchanged', JSON.stringify(missing) === copyMissing);
ok('nan.wp0.unchanged', Number.isNaN(nanWp0.route[0].x) && Number.isNaN(nanWp0.route[0].z));

// Y-only NaN on pad still heals XZ.
const nanY = {
  role: 'miner',
  classKey: 'light',
  system: 'freehold',
  route: [{ x: station.x, y: NaN, z: station.z }, { ...gate }],
};
normalizeMinerRecord(nanY);
ok('heal.nanY.xz', xzOf(nanY.route[0]) >= minXZ('light') && Number.isFinite(nanY.route[0].y));

if (fails.length) {
  console.log('FAIL');
  for (const f of fails) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log('CLEAN');
}
for (const line of lines) console.log(line);
