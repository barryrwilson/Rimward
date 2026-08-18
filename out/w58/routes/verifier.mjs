// Wave 58 extra route cases. Logs only. No production edits.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { SYSTEMS } from '../../../src/game/state.js';
import {
  traderRouteWaypoints,
  normalizeTraderRecord,
} from '../../../src/game/world.js';
import {
  hullRadiusFor,
  stationHoldPoint,
  writeStationHold,
  STATION_HOLD_PAD,
} from '../../../src/game/traffic-feel.js';
import { PHY } from '../../../src/game/physics.js';

const here = dirname(fileURLToPath(import.meta.url));
const worldSrc = readFileSync(resolve(here, '../../../src/game/world.js'), 'utf8');
const feelSrc = readFileSync(resolve(here, '../../../src/game/traffic-feel.js'), 'utf8');
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

const freightR = hullRadiusFor('freighter');
const minDist = PHY.STATION_CYL_RADIUS + freightR + STATION_HOLD_PAD - 0.01;

function plusXOf(station) {
  return { x: station.x + 1, y: station.y, z: station.z };
}
function stationHoldVec(station, fromPos) {
  const hold = new THREE.Vector3();
  writeStationHold(hold, station, 'freighter', fromPos);
  return hold;
}
function stationPoint(def) {
  const p = def.station.position;
  return new THREE.Vector3(p[0], p[1], p[2]);
}
const arrivalSrc = worldSrc.slice(
  worldSrc.indexOf('function traderArrivalWaypoints'),
  worldSrc.indexOf('function stationPoint'),
);
// Rehydrate the unexported helper so we test the authored body.
const traderArrivalWaypoints = eval(`(${arrivalSrc})`);

for (const id of ['freehold', 'veridian', 'hush', 'verge']) {
  const def = SYSTEMS[id];
  ok(`${id}.exists`, !!(def && def.station && def.gates?.length));
  const n = def.gates.length;
  for (let i = 0; i < n; i++) {
    const row = traderRouteWaypoints(def, i);
    const s = def.station.position;
    const d = Math.hypot(row.waypoints[0].x - s[0], row.waypoints[0].z - s[2]);
    ok(`${id}[${i}].hold`, d >= minDist, `xz=${d} min=${minDist}`);
    ok(`${id}[${i}].to`, row.outboundTo === def.gates[i].to);
    ok(`${id}[${i}].notHub`, !String(row.outboundTo).startsWith('fh_') && row.outboundTo !== 'fh_hearth');
  }
}

const fh = SYSTEMS.freehold;
const vd = SYSTEMS.veridian;
const fromFh = traderArrivalWaypoints(vd, 'freehold');
const fromRm = traderArrivalWaypoints(vd, 'redmarch');
const fromMiss = traderArrivalWaypoints(vd, 'nope');
ok('arrive.freeholdGate', fromFh.outboundTo === 'freehold', `${fromFh.outboundTo}`);
ok(
  'arrive.freeholdPos',
  fromFh.waypoints[1].x === vd.gates[0].position[0]
    && fromFh.waypoints[1].y === vd.gates[0].position[1]
    && fromFh.waypoints[1].z === vd.gates[0].position[2],
);
ok('arrive.redmarchGate', fromRm.outboundTo === 'redmarch', `${fromRm.outboundTo}`);
ok(
  'arrive.redmarchPos',
  fromRm.waypoints[1].x === vd.gates[1].position[0]
    && fromRm.waypoints[1].y === vd.gates[1].position[1]
    && fromRm.waypoints[1].z === vd.gates[1].position[2],
);
ok('arrive.missFallback0', fromMiss.outboundTo === vd.gates[0].to, `${fromMiss.outboundTo}`);

const s = { x: 10, y: 4, z: -8 };
const same = stationHoldPoint(s, 'freighter', { x: 10, y: 99, z: -8 });
ok('degen.finite', Number.isFinite(same.x) && Number.isFinite(same.y) && Number.isFinite(same.z));
ok('degen.outside', Math.hypot(same.x - 10, same.z + 8) >= minDist, `${Math.hypot(same.x - 10, same.z + 8)}`);
ok('degen.y', same.y === 4, `${same.y}`);
// coincident with station: origin fallback then +X if station at origin
const at0 = stationHoldPoint({ x: 0, y: 5, z: 0 }, 'light', { x: 0, y: 9, z: 0 });
ok('degen.plusX', at0.x > 0 && Math.abs(at0.z) < 1e-9, `${at0.x},${at0.z}`);

let threw = false;
let nanOut = null;
try {
  nanOut = stationHoldPoint({ x: NaN, y: NaN, z: NaN }, 'freighter', { x: NaN, y: NaN, z: NaN });
} catch {
  threw = true;
}
ok('nan.noThrow', !threw);
ok(
  'nan.finite',
  nanOut && Number.isFinite(nanOut.x) && Number.isFinite(nanOut.y) && Number.isFinite(nanOut.z),
  JSON.stringify(nanOut),
);

const lightHold = writeStationHold({ x: 0, y: 0, z: 0 }, s, 'light', { x: 100, y: 4, z: -8 });
const cutterHold = writeStationHold({ x: 0, y: 0, z: 0 }, s, 'cutter', { x: 100, y: 4, z: -8 });
const freightHold = writeStationHold({ x: 0, y: 0, z: 0 }, s, 'freighter', { x: 100, y: 4, z: -8 });
const dLight = Math.hypot(lightHold.x - s.x, lightHold.z - s.z);
const dCut = Math.hypot(cutterHold.x - s.x, cutterHold.z - s.z);
const dFr = Math.hypot(freightHold.x - s.x, freightHold.z - s.z);
ok('miner.lightCloserThanFreight', dLight < dFr, `light=${dLight} freight=${dFr}`);
ok('miner.cutterCloserThanFreight', dCut < dFr, `cutter=${dCut} freight=${dFr}`);

ok('src.minerClassHold', worldSrc.includes("writeStationHold(new THREE.Vector3(), station, i % 2 === 0 ? 'light' : 'cutter', destWp)"));
ok('src.traderFreighter', worldSrc.includes("writeStationHold(hold, station, 'freighter', fromPos)"));
ok('src.patrolCenter', worldSrc.includes('route: [station.clone(), jitter(gate.clone(), 50), jitter(planet.clone(), 60)]'));
ok('src.pirateGate', worldSrc.includes('route: [jitter(gate.clone(), 90), laneMid, jitter(gate.clone(), 120)]'));
ok('src.aceGate', worldSrc.includes('route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)]'));
ok('src.plainRoute', worldSrc.includes('return waypoints.map((w) => ({ x: Math.round(w.x), y: Math.round(w.y), z: Math.round(w.z) }))'));
ok('src.pickMigrant', worldSrc.includes('function pickMigrant'));
ok('src.gateLinger', worldSrc.includes('rec.gateLinger'));
ok('src.hubClosed', worldSrc.includes('hub routes are never') && worldSrc.includes('physical gates ONLY'));
ok('feel.noThreeImport', !/from ['\"]three['\"]/.test(feelSrc));
ok('feel.noThreeNew', !feelSrc.includes('new THREE'));

const old = {
  role: 'trader',
  id: 'rec-old',
  system: 'freehold',
  state: 'enroute',
  outboundTo: undefined,
  route: [
    { x: fh.station.position[0], y: fh.station.position[1], z: fh.station.position[2] },
    { x: fh.gates[0].position[0], y: fh.gates[0].position[1], z: fh.gates[0].position[2] },
    { x: 1, y: 2, z: 3 },
  ],
  leg: 2,
  legT: 1,
  dir: 1,
};
normalizeTraderRecord(old);
ok('heal.keepsWp0AtPad', old.route[0].x === fh.station.position[0] && old.route[0].z === fh.station.position[2]);
ok('heal.clampsToTwo', old.route.length === 2, `${old.route.length}`);
ok('heal.outboundPhysical', fh.gates.some((g) => g.to === old.outboundTo), `${old.outboundTo}`);
ok('heal.lingerFlag', old.gateLinger === false);

const stored = {
  x: Math.round(freightHold.x),
  y: Math.round(freightHold.y),
  z: Math.round(freightHold.z),
};
const storedD = Math.hypot(stored.x - s.x, stored.z - s.z);
ok('stored.outsideCyl', storedD >= PHY.STATION_CYL_RADIUS, `xz=${storedD}`);

const summary = fails.length ? `FAIL ${fails.length}` : 'CLEAN';
log(summary);
writeFileSync(resolve(here, 'verifier.log'), `${lines.join('\n')}\n`, 'utf8');
console.log(summary);
if (fails.length) {
  for (const f of fails) console.log(`  ${f}`);
  process.exitCode = 1;
}
