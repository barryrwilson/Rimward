// Wave 58: station-end trader/miner waypoints sit outside the D5 cylinder.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SYSTEMS } from '../../../src/game/state.js';
import { traderRouteWaypoints } from '../../../src/game/world.js';
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
const fails = [];
const ok = (name, cond, extra = '') => {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
};

const freightR = hullRadiusFor('freighter');
const minDist = PHY.STATION_CYL_RADIUS + freightR + STATION_HOLD_PAD - 0.01;
const fh = SYSTEMS.freehold;
const fhStation = fh.station.position;
const planned = traderRouteWaypoints(fh, 0);
const home = planned.waypoints[0];
const gateWp = planned.waypoints[1];
const dest = fh.gates[0];

ok('export.traderRouteWaypoints', worldSrc.includes('export function traderRouteWaypoints'));
ok('export.stationHoldPoint', feelSrc.includes('export function stationHoldPoint'));
ok('feel.noThree', !feelSrc.includes('three'));
ok('hold.padBand', STATION_HOLD_PAD >= 10 && STATION_HOLD_PAD <= 16, `${STATION_HOLD_PAD}`);

ok('fh.wp0.notStation', home.x !== fhStation[0] || home.y !== fhStation[1] || home.z !== fhStation[2]);
const xz = Math.hypot(home.x - fhStation[0], home.z - fhStation[2]);
ok('fh.wp0.xz', xz >= minDist, `xz=${xz} min=${minDist}`);
ok('fh.wp0.yNear', Math.abs(home.y - fhStation[1]) < 0.01, `y=${home.y}`);
ok(
  'fh.gatePos',
  gateWp.x === dest.position[0] && gateWp.y === dest.position[1] && gateWp.z === dest.position[2],
);
ok('fh.outboundTo', planned.outboundTo === dest.to, `${planned.outboundTo}`);
ok('fh.physicalGate', fh.gates.some((g) => g.to === planned.outboundTo));

for (const [sysId, def] of Object.entries(SYSTEMS)) {
  if (!def.gates?.length || !def.station) continue;
  const n = def.gates.length;
  for (let i = 0; i < n; i++) {
    const row = traderRouteWaypoints(def, i);
    const s = def.station.position;
    const g = def.gates[i];
    const wp0 = row.waypoints[0];
    const wp1 = row.waypoints[1];
    const d = Math.hypot(wp0.x - s[0], wp0.z - s[2]);
    ok(`${sysId}[${i}].len`, row.waypoints.length === 2, `${row.waypoints.length}`);
    ok(`${sysId}[${i}].to`, row.outboundTo === g.to, `${row.outboundTo}`);
    ok(
      `${sysId}[${i}].gate`,
      wp1.x === g.position[0] && wp1.y === g.position[1] && wp1.z === g.position[2],
    );
    ok(`${sysId}[${i}].hold`, d >= minDist, `xz=${d}`);
    ok(`${sysId}[${i}].y`, Math.abs(wp0.y - s[1]) < 0.01, `y=${wp0.y}`);
    ok(`${sysId}[${i}].physical`, def.gates.some((gate) => gate.to === row.outboundTo));
  }
}

const helper = stationHoldPoint({ x: 10, y: 4, z: -8 }, 'freighter', { x: 100, y: 80, z: -8 });
ok('helper.plain', helper && Number.isFinite(helper.x) && Number.isFinite(helper.z));
ok(
  'helper.xz',
  Math.hypot(helper.x - 10, helper.z + 8) >= minDist,
  `${Math.hypot(helper.x - 10, helper.z + 8)}`,
);
ok('helper.y', helper.y === 4, `${helper.y}`);
ok('helper.unknownIsLight', stationHoldPoint({ x: 0, y: 0, z: 0 }, 'nope', { x: 50, y: 0, z: 0 }).x
  === stationHoldPoint({ x: 0, y: 0, z: 0 }, 'light', { x: 50, y: 0, z: 0 }).x);

const fallback = stationHoldPoint({ x: 0, y: 5, z: 0 }, 'light', { x: 0, y: 9, z: 0 });
ok('fallback.plusX', fallback.x > 0 && Math.abs(fallback.z) < 1e-9, `${fallback.x},${fallback.z}`);

const out = { x: 0, y: 0, z: 0 };
const same = writeStationHold(out, { x: 2, y: 1, z: 3 }, 'freighter', { x: 2, y: 1, z: 90 });
ok('write.mutates', same === out && out.z > 3);

const arrivalSrc = worldSrc.slice(
  worldSrc.indexOf('function traderArrivalWaypoints'),
  worldSrc.indexOf('function stationPoint'),
);
ok('src.arrivalHold', arrivalSrc.includes('stationHoldVec(station, gate)'));
ok('src.arrivalNoCenter', !arrivalSrc.includes('station.clone()'));
ok('src.minerHold', worldSrc.includes('writeStationHold(new THREE.Vector3()'));
ok('src.patrolCenter', worldSrc.includes('route: [station.clone(), jitter(gate.clone(), 50), jitter(planet.clone(), 60)]'));
ok('src.plainRoute', worldSrc.includes('return waypoints.map((w) => ({ x: Math.round(w.x), y: Math.round(w.y), z: Math.round(w.z) }))'));

if (fails.length) {
  console.log('FAIL');
  for (const f of fails) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log('CLEAN');
}
