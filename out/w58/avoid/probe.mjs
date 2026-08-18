// Wave 58: station/gate avoid + miner hold.
// Source-contract + isolated math replica of npc.js gateProbeHits / minerHoldFromStation.
// Replica numbers match GATE_BORE 30, RING_TUBE 2.2, STATION_CYL_RADIUS 32, HOLD_PAD 12.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const npcPath = resolve(here, '../../../src/systems/npc.js');
const npcSrc = readFileSync(npcPath, 'utf8');
const fails = [];

function ok(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  else console.log(`CLEAN ${name}`);
}

// --- source contract ---
ok('src.probeHitsBody.gate', /if \(body\.kind === 'gate'\) return gateProbeHits/.test(npcSrc));
ok('src.applyAvoidBias.gate', /if \(body\.kind === 'gate'\) \{\s*nearestGateRing/.test(npcSrc));
ok('src.skipAvoid.noStation', !/body\.kind === 'station'.*return true/.test(
  npcSrc.slice(npcSrc.indexOf('function skipAvoidBody'), npcSrc.indexOf('function writeGateAxis')),
));
ok('src.skipAvoid.noGate', !/body\.kind === 'gate'/.test(
  npcSrc.slice(npcSrc.indexOf('function skipAvoidBody'), npcSrc.indexOf('function writeGateAxis')),
));
ok('src.steerMinerHome.hold', npcSrc.includes('minerHoldFromStation(station, _v3, npcRadius(live), _aim)'));
ok('src.steerMinerHome.arriveHold', npcSrc.includes('if (holdDist < MINER_HOLD_ARRIVE)'));
ok('src.steerMinerHome.noPadAim', !/steerLive\(\s*live,\s*station/.test(npcSrc));
ok('src.flee.hold', npcSrc.includes('minerHoldFromStation(station, live.object.position, npcRadius(live), _aim)'));
ok('src.stationKeepOut', npcSrc.includes('function stationKeepOutHits'));
ok('src.envelope.abeam', npcSrc.includes('const ENVELOPE_ABEAM = 110'));
ok('src.npcFire', /emit\('npcFire',\s*\{\s*ship:\s*live,\s*weapon:\s*'cannon',\s*target:\s*ai\.target\s*\}/.test(npcSrc));

const avoidFn = npcSrc.slice(npcSrc.indexOf('function applyAvoidBias'), npcSrc.indexOf('function appendSunBody'));
ok('src.avoid.noNewThree', !/new THREE\./.test(avoidFn));
const holdFn = npcSrc.slice(npcSrc.indexOf('export function minerHoldFromStation'), npcSrc.indexOf('function updateMine'));
ok('src.hold.noNewThree', !/new THREE\./.test(holdFn));
const probeFn = npcSrc.slice(npcSrc.indexOf('export function gateProbeHits'), npcSrc.indexOf('function stationCylHits'));
ok('src.torus.noNewThree', !/new THREE\./.test(probeFn));

// --- replica of gateProbeHits (npc.js) ---
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

// --- replica of minerHoldFromStation (npc.js) ---
function replicaMinerHold(station, livePos, hullR, out) {
  const hull = Number.isFinite(hullR) && hullR > 0 ? hullR : 0;
  const pad = 32 + hull + 12;
  let ox = livePos.x - station.x;
  let oz = livePos.z - station.z;
  const len = Math.hypot(ox, oz);
  if (len < 1e-6) {
    ox = 1;
    oz = 0;
  } else {
    ox /= len;
    oz /= len;
  }
  out.x = station.x + ox * pad;
  out.y = station.y;
  out.z = station.z + oz * pad;
  return out;
}

const gateBody = {
  kind: 'gate',
  x: 400,
  y: 20,
  z: 0,
  r: 30,
  y0: 2.2,
  y1: 0,
  id: 0,
  axis: { x: -1, y: 0, z: 0 },
};

ok('replica.gateCenterMiss', replicaGateProbeHits(400, 20, 0, 1, gateBody) === false);
ok('replica.gateTubeHit', replicaGateProbeHits(400, 20, 30, 1, gateBody) === true);
ok('replica.gateBoreMiss', replicaGateProbeHits(400, 20, 10, 1, gateBody) === false);

const station = { x: 120, y: 20, z: 620 };
const hold = replicaMinerHold(station, { x: 200, y: 20, z: 620 }, 39.3, { x: 0, y: 0, z: 0 });
const holdR = Math.hypot(hold.x - station.x, hold.z - station.z);
ok('replica.holdOutsideCyl', holdR > 32 + 39.3, `r=${holdR}`);
ok('replica.holdY', hold.y === 20);

// Freighter aimed through station: replica of applyAvoidBias station keep-out + addLateralAway.
const look = 40;
const gain = 1.4;
const hull = 15;
const stBody = { kind: 'station', x: 0, y: 20, z: 0, r: 32, y0: -26, y1: 33, id: 0 };
const sx = 80;
const sy = 20;
const sz = 0;
const fwdX = -1;
const fwdY = 0;
const fwdZ = 0;
const px = sx + fwdX * look;
const py = sy + fwdY * look;
const pz = sz + fwdZ * look;
function replicaCylHits(qx, qy, qz, rad, body) {
  let ymin = body.y + body.y0;
  let ymax = body.y + body.y1;
  if (ymin > ymax) {
    const tmp = ymin;
    ymin = ymax;
    ymax = tmp;
  }
  if (qy < ymin - rad || qy > ymax + rad) return false;
  const rr = body.r + rad;
  const dx = qx - body.x;
  const dz = qz - body.z;
  return dx * dx + dz * dz < rr * rr;
}
const stationHit = replicaCylHits(px, py, pz, hull, stBody) || replicaCylHits(sx, sy, sz, hull, stBody);
ok('replica.stationPathHit', stationHit === true, `probe=(${px},${py},${pz})`);

// addLateralAway replica
let ax = px - stBody.x;
let ay = py - stBody.y;
let az = pz - stBody.z;
const fdot = ax * fwdX + ay * fwdY + az * fwdZ;
ax -= fwdX * fdot;
ay -= fwdY * fdot;
az -= fwdZ * fdot;
if (ax * ax + ay * ay + az * az < 1e-8) {
  ax = 0;
  ay = 0;
  az = 1;
}
const alen = Math.hypot(ax, ay, az);
ax /= alen;
ay /= alen;
az /= alen;
const aimX = 0 + ax * look * gain;
const aimZ = 0 + az * look * gain;
ok('replica.avoidLateral', Math.hypot(aimX, aimZ) > 1e-4, `aim=(${aimX},${ay},${aimZ})`);

let imported = false;
try {
  const npc = await import('../../../src/systems/npc.js');
  imported = true;
  ok('import.gateCenter', npc.gateProbeHits(400, 20, 0, 1, gateBody) === false);
  ok('import.gateTube', npc.gateProbeHits(400, 20, 30, 1, gateBody) === true);
  const liveHold = npc.minerHoldFromStation(station, { x: 200, y: 20, z: 620 }, 39.3, { x: 0, y: 0, z: 0 });
  const liveR = Math.hypot(liveHold.x - station.x, liveHold.z - station.z);
  ok('import.holdOutside', liveR > 32 + 39.3, `r=${liveR}`);
  ok('import.holdMatch', Math.abs(liveHold.x - hold.x) < 1e-9 && Math.abs(liveHold.z - hold.z) < 1e-9);
} catch (err) {
  ok('import.npc', false, String(err && err.message ? err.message : err));
}

if (!imported) {
  console.log('NOTE import skipped after failure; replica + source contract still ran');
}

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  for (const f of fails) console.log(`  ${f}`);
  process.exit(1);
}
console.log('ALL CLEAN');
