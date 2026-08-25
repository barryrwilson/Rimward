// PHY kernel pin checks. Imports game modules only. Does not start the boot harness.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHY } from '../../src/game/physics.js';
import {
  distSq,
  sphereOverlap,
  cylinderOverlap,
  torusOverlap,
  resolveVelocity,
  sunZone,
  collectBodies,
  resolveMover,
} from '../../src/game/collision.js';

const near = (a, b, e = 1e-3) => Number.isFinite(a) && Math.abs(a - b) < e;
const fails = [];
function check(name, ok, detail) {
  if (!ok) fails.push({ name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` ${detail}` : ''}`);
}

const PHY_KEYS = {
  PLAYER_RADIUS: 2.4,
  STATION_CYL_RADIUS: 32,
  STATION_CYL_Y0: -26,
  STATION_CYL_Y1: 33,
  IMPACT_SCREEN_PER_U: 0.35,
  IMPACT_MIN_SPEED: 8,
  RESTITUTION: 0.15,
  SLIDE_FRICTION: 0.85,
  SUN_HEAT_MULT: 2.4,
  SUN_LETHAL_MULT: 1.12,
  SUN_HEAT_DPS: 6,
  SUN_HEAT_RAMP: 18,
  AVOID_LOOKAHEAD: 40,
  AVOID_GAIN: 1.4,
  GATE_BORE: 30,
  GATE_TUBE: 2.2,
};

check('phyFrozen', Object.isFrozen(PHY), `frozen=${Object.isFrozen(PHY)}`);
const phyKeys = Object.keys(PHY);
check(
  'phyKeySet',
  phyKeys.length === Object.keys(PHY_KEYS).length
    && Object.keys(PHY_KEYS).every((k) => phyKeys.includes(k)),
  JSON.stringify(phyKeys),
);
for (const [k, v] of Object.entries(PHY_KEYS)) {
  check(`phy.${k}`, PHY[k] === v, `${PHY[k]}`);
}

check('export.distSq', typeof distSq === 'function' && distSq.length === 6, `arity=${distSq.length}`);
check('export.sphereOverlap', typeof sphereOverlap === 'function' && sphereOverlap.length === 9, `arity=${sphereOverlap.length}`);
check('export.cylinderOverlap', typeof cylinderOverlap === 'function' && cylinderOverlap.length === 11, `arity=${cylinderOverlap.length}`);
check('export.torusOverlap', typeof torusOverlap === 'function' && torusOverlap.length === 10, `arity=${torusOverlap.length}`);
check('export.resolveVelocity', typeof resolveVelocity === 'function' && resolveVelocity.length === 9, `arity=${resolveVelocity.length}`);
check('export.sunZone', typeof sunZone === 'function' && sunZone.length === 8, `arity=${sunZone.length}`);
check('export.collectBodies', typeof collectBodies === 'function' && collectBodies.length === 2, `arity=${collectBodies.length}`);
check('export.resolveMover', typeof resolveMover === 'function' && resolveMover.length === 11, `arity=${resolveMover.length}`);

check('distSq.3u', near(distSq(0, 0, 0, 3, 0, 0), 9), `${distSq(0, 0, 0, 3, 0, 0)}`);

const so = { hit: false, nx: 0, ny: 0, nz: 0, overlap: 0 };
sphereOverlap(0, 0, 0, 2, 3, 0, 0, 2, so);
check('sphereOverlap.hit', so.hit === true && near(so.overlap, 1), JSON.stringify(so));

const soMiss = { hit: true, nx: 0, ny: 0, nz: 0, overlap: 0 };
sphereOverlap(0, 0, 0, 2, 5, 0, 0, 2, soMiss);
check('sphereOverlap.miss', soMiss.hit === false, JSON.stringify(soMiss));

const cyHit = { hit: false, nx: 0, ny: 0, nz: 0, overlap: 0 };
cylinderOverlap(33, 0, 0, 2, 0, 0, 0, 32, PHY.STATION_CYL_Y0, PHY.STATION_CYL_Y1, cyHit);
check('cylinderOverlap.hit', cyHit.hit === true && near(cyHit.overlap, 1), JSON.stringify(cyHit));

const cyHigh = { hit: true, nx: 0, ny: 0, nz: 0, overlap: 0 };
cylinderOverlap(0, PHY.STATION_CYL_Y1 + 80, 0, 2, 0, 0, 0, 32, PHY.STATION_CYL_Y0, PHY.STATION_CYL_Y1, cyHigh);
check('cylinderOverlap.highMiss', cyHigh.hit === false, JSON.stringify(cyHigh));

const rv = { vx: 0, vy: 0, vz: 0 };
resolveVelocity(-10, 0, 0, 1, 0, 0, 0.15, 0, rv);
check('resolveVelocity.bounce', near(rv.vx, 1.5) && near(rv.vy, 0) && near(rv.vz, 0), JSON.stringify(rv));

const R = 100;
const sz0 = { zone: -1, t: -1, dist: -1 };
const sz1 = { zone: -1, t: -1, dist: -1 };
const sz2 = { zone: -1, t: -1, dist: -1 };
sunZone(2.4 * R, 0, 0, 0, 0, 0, R, sz0);
sunZone(1.5 * R, 0, 0, 0, 0, 0, R, sz1);
sunZone(1.0 * R, 0, 0, 0, 0, 0, R, sz2);
check('sunZone.2.4R', sz0.zone === 0 || sz0.zone === 1, JSON.stringify(sz0));
check('sunZone.1.5R', sz1.zone === 1, JSON.stringify(sz1));
check('sunZone.1.0R', sz2.zone === 2, JSON.stringify(sz2));
check('sunZone.tRamp', sz0.t < sz1.t && sz1.t < sz2.t && sz2.t === 1, `t0=${sz0.t} t1=${sz1.t} t2=${sz2.t}`);

let nanThrew = false;
const nanSo = { hit: true, nx: 0, ny: 0, nz: 0, overlap: 0 };
const nanCy = { hit: true, nx: 0, ny: 0, nz: 0, overlap: 0 };
const nanRv = { vx: 9, vy: 9, vz: 9 };
const nanSz = { zone: 9, t: 9, dist: 9 };
const nanMv = { px: 9, py: 9, pz: 9, vx: 9, vy: 9, vz: 9, hit: true, kind: 'x', speed: 9, nx: 0, ny: 0, nz: 0, overlap: 0 };
try {
  sphereOverlap(Number.NaN, 0, 0, 2, 0, 0, 0, 2, nanSo);
  cylinderOverlap(Number.NaN, 0, 0, 2, 0, 0, 0, 32, -26, 33, nanCy);
  resolveVelocity(Number.NaN, 0, 0, 1, 0, 0, 0.15, 0.85, nanRv);
  sunZone(Number.NaN, 0, 0, 0, 0, 0, R, nanSz);
  resolveMover(Number.NaN, 0, 0, -10, 0, 0, 2, { count: 0, items: [] }, null, null, nanMv);
} catch (err) {
  nanThrew = true;
  console.log('NaN threw', err);
}
check(
  'nanSafe',
  !nanThrew && nanSo.hit === false && nanCy.hit === false && nanSz.zone === 0 && nanRv.vx === 0,
  `threw=${nanThrew} so=${nanSo.hit} cy=${nanCy.hit} sz=${nanSz.zone} rv=${nanRv.vx}`,
);

const dest = {
  count: 1,
  items: [{
    kind: 'station',
    x: 0, y: 0, z: 0,
    r: PHY.STATION_CYL_RADIUS,
    y0: PHY.STATION_CYL_Y0,
    y1: PHY.STATION_CYL_Y1,
    id: 0,
  }],
};
const mv = { px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, hit: false, kind: null, speed: 0, nx: 0, ny: 1, nz: 0, overlap: 0 };
resolveMover(33, 0, 0, -10, 0, 0, 2, dest, 'player', -1, mv);
check(
  'resolveMover.station',
  mv.hit === true && near(mv.px, 34, 0.05) && mv.vx > 0 && mv.kind === 'station',
  JSON.stringify({ px: mv.px, py: mv.py, pz: mv.pz, vx: mv.vx, hit: mv.hit, kind: mv.kind }),
);

// Intended: skip is AND of skipKind + skipId. station id 0 must not skip asteroid 0.
const destMix = {
  count: 2,
  items: [
    { kind: 'station', x: 0, y: 0, z: 0, r: 32, y0: -26, y1: 33, id: 0 },
    { kind: 'asteroid', x: 33, y: 0, z: 0, r: 2, y0: 0, y1: 0, id: 0 },
  ],
};
const skipStation = { px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, hit: false, kind: null, speed: 0, nx: 0, ny: 1, nz: 0, overlap: 0 };
resolveMover(33, 0, 0, 0, 0, 0, 2, destMix, 'station', 0, skipStation);
check(
  'resolveMover.skipAnd',
  skipStation.hit === true && skipStation.kind === 'asteroid',
  JSON.stringify({ hit: skipStation.hit, kind: skipStation.kind }),
);

const emptyDest = { count: 0, items: [] };
collectBodies({}, emptyDest);
check('collectBodies.empty', emptyDest.count === 0, `count=${emptyDest.count}`);

const liveDest = { count: 0, items: [] };
collectBodies({
  station: { position: { x: 0, y: 0, z: 0 } },
  ship: { object: { position: { x: 10, y: 0, z: 0 } } },
}, liveDest);
let hasStation = false;
let hasPlayer = false;
for (let i = 0; i < liveDest.count; i++) {
  if (liveDest.items[i]?.kind === 'station') hasStation = true;
  if (liveDest.items[i]?.kind === 'player') hasPlayer = true;
}
check('collectBodies.stationPlayer', hasStation && hasPlayer && liveDest.count >= 2, `count=${liveDest.count}`);

const npcSrc = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../src/systems/npc.js'),
  'utf8',
);
check(
  'phy04.avoidKeysUnchanged',
  PHY.AVOID_LOOKAHEAD === 40 && PHY.AVOID_GAIN === 1.4,
  `look=${PHY.AVOID_LOOKAHEAD} gain=${PHY.AVOID_GAIN}`,
);
check(
  'phy04.midSample',
  npcSrc.includes('function addMidChordHit') && /const mid = look \* 0\.5/.test(npcSrc),
);
check('phy04.bounceLive', npcSrc.includes('if (_phyOn) bounceLive(live, dt)'));
check(
  'phy04.noNavmeshPlan',
  !npcSrc.includes('planApPath') && !/navmesh/i.test(npcSrc),
);
check(
  'phy04.sunRadii',
  PHY.SUN_HEAT_MULT === 2.4 && PHY.SUN_LETHAL_MULT === 1.12,
  `heat=${PHY.SUN_HEAT_MULT} lethal=${PHY.SUN_LETHAL_MULT}`,
);

console.log(`\n${fails.length === 0 ? 'KERNEL PINS PASS' : `KERNEL PINS FAIL ${fails.length}`}`);
if (fails.length) console.log(JSON.stringify(fails, null, 2));
process.exit(fails.length === 0 ? 0 : 1);
