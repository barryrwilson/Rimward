// Wave 58 extra avoid/hold cases. Logs only. No production edits.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const npcPath = resolve(here, '../../../src/systems/npc.js');
const npcSrc = readFileSync(npcPath, 'utf8');
const lines = [];
const fails = [];
const log = (s) => {
  lines.push(s);
  console.log(s);
};
const ok = (name, cond, extra = '') => {
  const msg = extra ? `${name}: ${extra}` : name;
  if (!cond) {
    fails.push(msg);
    log(`FAIL ${msg}`);
  } else {
    log(`CLEAN ${name}`);
  }
};

function replicaGateProbeHits(px, py, pz, rad, body) {
  const R = Number.isFinite(body.r) ? body.r : 0;
  const tube = Number.isFinite(body.y0) && body.y0 > 0 ? body.y0 : 2.2;
  const pr = rad > 0 ? rad : 0;
  const axis = body.axis;
  let ax;
  let ay;
  let az;
  if (axis && Number.isFinite(axis.x)) {
    ax = axis.x;
    ay = axis.y;
    az = axis.z;
  } else {
    ax = -(body.x || 0);
    ay = -(body.y || 0);
    az = -(body.z || 0);
  }
  const len = Math.hypot(ax, ay, az);
  if (len < 1e-8) {
    ax = 0;
    ay = 0;
    az = 1;
  } else {
    ax /= len;
    ay /= len;
    az /= len;
  }
  const dx = px - body.x;
  const dy = py - body.y;
  const dz = pz - body.z;
  const axial = dx * ax + dy * ay + dz * az;
  const rx = dx - axial * ax;
  const ry = dy - axial * ay;
  const rz = dz - axial * az;
  const rho = Math.hypot(rx, ry, rz);
  return Math.hypot(rho - R, axial) < tube + pr;
}

function replicaMinerHold(station, livePos, hullR, out) {
  const hull = Number.isFinite(hullR) && hullR > 0 ? hullR : 0;
  const pad = 32 + hull + 12;
  let ox = 0;
  let oz = 0;
  if (livePos) {
    ox = livePos.x - station.x;
    oz = livePos.z - station.z;
  }
  const len = Math.hypot(ox, oz);
  if (len < 1e-6) {
    ox = 1;
    oz = 0;
  } else {
    ox /= len;
    oz /= len;
  }
  out.x = station.x + ox * pad;
  out.y = Number.isFinite(station.y) ? station.y : 0;
  out.z = station.z + oz * pad;
  return out;
}

const skipSrc = npcSrc.slice(
  npcSrc.indexOf('function skipAvoidBody'),
  npcSrc.indexOf('function writeGateAxis'),
);
const avoidFn = npcSrc.slice(
  npcSrc.indexOf('function applyAvoidBias'),
  npcSrc.indexOf('function appendSunBody'),
);
const holdFn = npcSrc.slice(
  npcSrc.indexOf('export function minerHoldFromStation'),
  npcSrc.indexOf('function updateMine'),
);
const fleeFn = npcSrc.slice(
  npcSrc.indexOf('function updateFlee'),
  npcSrc.indexOf('function updateDrift'),
);

ok('src.skip.self', skipSrc.includes("body.kind === 'ship' && body.id === live.id"));
ok('src.skip.playerTarget', skipSrc.includes("target === 'player' && body.kind === 'player'"));
ok('src.skip.shipTarget', skipSrc.includes("body.kind === 'ship' && body.id === target.id"));
ok('src.skip.noStation', !skipSrc.includes("'station'"));
ok('src.skip.noGate', !skipSrc.includes("'gate'"));
ok('src.gateTorus', npcSrc.includes("if (body.kind === 'gate') return gateProbeHits"));
ok('src.gateRingPush', /if \(body\.kind === 'gate'\) \{\s*nearestGateRing/.test(npcSrc));
ok('src.stationKeepOut.hullPath', npcSrc.includes('stationKeepOutHits(px, py, pz, pos.x, pos.y, pos.z, rad, body)'));
ok('src.stationInsideXZ', npcSrc.includes('addStationOutXZ(pos.x, pos.z, body.x, body.z)'));
ok('src.dockHold', npcSrc.includes('if (holdDist < MINER_HOLD_ARRIVE)'));
ok('src.holdArrive28', npcSrc.includes('const MINER_HOLD_ARRIVE = 28'));
ok('src.noSteerStation', !/steerLive\(\s*live,\s*station/.test(npcSrc));
ok('src.fleeHold', fleeFn.includes('minerHoldFromStation(station, live.object.position, npcRadius(live), _aim)'));
ok('src.phyJump', npcSrc.includes('_phyOn = !ctx.gate.jumping'));
ok('src.avoid.noNewThree', !/new THREE\./.test(avoidFn));
ok('src.hold.noNewThree', !/new THREE\./.test(holdFn));

const farGate = { kind: 'gate', x: 5000, y: 0, z: 0, r: 30, y0: 2.2, y1: 0, id: 0 };
ok('replica.far.centerMiss', replicaGateProbeHits(5000, 0, 0, 1, farGate) === false);
ok('replica.far.tubeY', replicaGateProbeHits(5000, 30, 0, 1, farGate) === true);
ok('replica.far.tubeZ', replicaGateProbeHits(5000, 0, 30, 1, farGate) === true);
ok('replica.far.alongAxisMiss', replicaGateProbeHits(5030, 0, 0, 1, farGate) === false);

const originGate = { kind: 'gate', x: 0, y: 0, z: 0, r: 30, y0: 2.2, y1: 0, id: 0 };
ok('replica.origin.centerMiss', replicaGateProbeHits(0, 0, 0, 1, originGate) === false);
ok('replica.origin.tubeX', replicaGateProbeHits(30, 0, 0, 1, originGate) === true);
ok('replica.origin.plusZmiss', replicaGateProbeHits(0, 0, 30, 1, originGate) === false);

const station = { x: 120, y: 20, z: 620 };
const freightHold = replicaMinerHold(station, { x: 200, y: 20, z: 620 }, 39.3, { x: 0, y: 0, z: 0 });
const freightR = Math.hypot(freightHold.x - station.x, freightHold.z - station.z);
ok('replica.freightHoldOutside', freightR > 32, `r=${freightR}`);
ok('replica.freightHoldPad', Math.abs(freightR - (32 + 39.3 + 12)) < 1e-9, `r=${freightR}`);

const deg = replicaMinerHold(station, { x: 120, y: 20, z: 620 }, 39.3, { x: NaN, y: NaN, z: NaN });
const degR = Math.hypot(deg.x - station.x, deg.z - station.z);
ok('replica.degenFinite', Number.isFinite(deg.x) && Number.isFinite(deg.y) && Number.isFinite(deg.z));
ok('replica.degenOutside', degR > 32 && Math.abs(degR - (32 + 39.3 + 12)) < 1e-9, `r=${degR}`);
ok('replica.degenPlusX', Math.abs(deg.x - (station.x + 32 + 39.3 + 12)) < 1e-9 && Math.abs(deg.z - station.z) < 1e-9);

let imported = false;
try {
  const npc = await import('../../../src/systems/npc.js');
  imported = true;
  ok('import.exports', typeof npc.gateProbeHits === 'function' && typeof npc.minerHoldFromStation === 'function');
  ok('import.far.centerMiss', npc.gateProbeHits(5000, 0, 0, 1, farGate) === false);
  ok('import.far.tubeY', npc.gateProbeHits(5000, 30, 0, 1, farGate) === true);
  ok('import.far.tubeZ', npc.gateProbeHits(5000, 0, 30, 1, farGate) === true);
  ok('import.far.alongAxisMiss', npc.gateProbeHits(5030, 0, 0, 1, farGate) === false);
  ok('import.origin.centerMiss', npc.gateProbeHits(0, 0, 0, 1, originGate) === false);
  ok('import.origin.tubeX', npc.gateProbeHits(30, 0, 0, 1, originGate) === true);
  ok('import.origin.plusZmiss', npc.gateProbeHits(0, 0, 30, 1, originGate) === false);
  const liveHold = npc.minerHoldFromStation(station, { x: 200, y: 20, z: 620 }, 39.3, { x: 0, y: 0, z: 0 });
  const liveR = Math.hypot(liveHold.x - station.x, liveHold.z - station.z);
  ok('import.freightHoldOutside', liveR > 32, `r=${liveR}`);
  const liveDeg = npc.minerHoldFromStation(station, { x: 120, y: 20, z: 620 }, 39.3, { x: 0, y: 0, z: 0 });
  ok(
    'import.degenFinite',
    Number.isFinite(liveDeg.x) && Number.isFinite(liveDeg.y) && Number.isFinite(liveDeg.z) &&
      Math.hypot(liveDeg.x - station.x, liveDeg.z - station.z) > 32,
  );
} catch (err) {
  ok('import.npc', false, String(err && err.message ? err.message : err));
}

if (!imported) {
  log('NOTE import skipped after failure; replica + source contract still ran');
}

const other = ['collision.js', 'physics.js', 'world.js', 'traffic-feel.js'];
for (const name of other) {
  const p = resolve(here, '../../../src/game', name);
  const src = readFileSync(p, 'utf8');
  ok(`scope.noExport.${name}`, !src.includes('gateProbeHits') && !src.includes('minerHoldFromStation'));
}

if (fails.length) {
  log(`FAIL ${fails.length}`);
  for (const f of fails) log(`  ${f}`);
} else {
  log('ALL CLEAN');
}

writeFileSync(resolve(here, 'verifier.log'), `${lines.join('\n')}\n`, 'utf8');
if (fails.length) process.exit(1);
