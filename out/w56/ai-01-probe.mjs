// AI-01 traffic clearance pins. Imports game modules only. Does not start Vite.
import {
  hullRadiusFor,
  separationFor,
  spawnBlocked,
  pirateLiveCap,
  visualClassFor,
  closeSpawn,
  SEPARATION_PAD,
  PIRATE_LIVE_SHARE,
  CLOSE_SPAWN_RANGE,
} from '../../src/game/traffic-feel.js';
import { SHIP_SCALE } from '../../src/game/ship-scale.js';

const fails = [];
function check(name, ok, detail) {
  if (!ok) fails.push({ name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` ${detail}` : ''}`);
}

const lightR = hullRadiusFor('light');
const freightR = hullRadiusFor('freighter');
const heavyR = hullRadiusFor('heavy');
check('hull.light = target/2', lightR === SHIP_SCALE.light.target / 2, `${lightR}`);
check('hull.freighter = target/2', freightR === SHIP_SCALE.freighter.target / 2, `${freightR}`);
check('hull.freighter > heavy > light', freightR > heavyR && heavyR > lightR, `f=${freightR} h=${heavyR} l=${lightR}`);
check('hull.unknown falls back to light', hullRadiusFor('no-such-class') === lightR, `${hullRadiusFor('no-such-class')}`);

const sepLL = separationFor('light', 'light');
const sepFF = separationFor('freighter', 'freighter');
const sepLH = separationFor('light', 'heavy');
check('pad in 8..12', SEPARATION_PAD >= 8 && SEPARATION_PAD <= 12, `${SEPARATION_PAD}`);
check('sep.ff > sep.ll', sepFF > sepLL, `ff=${sepFF} ll=${sepLL}`);
check('sep.ll = ra+rb+pad', sepLL === lightR + lightR + SEPARATION_PAD, `${sepLL}`);
check('sep.ff = ra+rb+pad', sepFF === freightR + freightR + SEPARATION_PAD, `${sepFF}`);
check('sep.lh = ra+rb+pad', sepLH === lightR + heavyR + SEPARATION_PAD, `${sepLH}`);

const dummy = [{ object: { position: { x: 0, y: 0, z: 0 } }, state: { classKey: 'freighter' } }];
check('blocked on top of dummy', spawnBlocked({ x: 0, y: 0, z: 0 }, 'freighter', dummy) === true);
check('clear far from dummy', spawnBlocked({ x: 1000, y: 0, z: 0 }, 'freighter', dummy) === false);
check('blocked just inside sep', spawnBlocked({ x: sepFF - 0.01, y: 0, z: 0 }, 'freighter', dummy) === true);
check('clear just outside sep', spawnBlocked({ x: sepFF + 0.01, y: 0, z: 0 }, 'freighter', dummy) === false);

const lightDummy = [{ object: { position: { x: 0, y: 0, z: 0 } }, state: { classKey: 'light' } }];
const mid = (sepLL + sepFF) * 0.5;
check('light packs closer than freighter', mid > sepLL && mid < sepFF);
check('light clear at mid (freighter blocked)', spawnBlocked({ x: mid, y: 0, z: 0 }, 'light', lightDummy) === false);
check('freighter blocked at mid', spawnBlocked({ x: mid, y: 0, z: 0 }, 'freighter', dummy) === true);

check('empty live not blocked', spawnBlocked({ x: 0, y: 0, z: 0 }, 'freighter', []) === false);
check('NaN pos blocked', spawnBlocked({ x: NaN, y: 0, z: 0 }, 'light', dummy) === true);

const qRec = { qship: true, revealed: false, classKey: 'cutter', coverClass: 'freighter' };
const qLive = {
  object: { position: { x: 0, y: 0, z: 0 } },
  state: { classKey: 'cutter' },
  record: qRec,
};
const freightRec = { qship: false, classKey: 'freighter' };
const qSep = separationFor(visualClassFor(qRec), visualClassFor(freightRec));
check('visual.unrevealed qship is cover', visualClassFor(qRec) === 'freighter', `${visualClassFor(qRec)}`);
check('visual.unrevealed qship live is cover', visualClassFor(qLive) === 'freighter', `${visualClassFor(qLive)}`);
check('visual.revealed qship is real', visualClassFor({ ...qRec, revealed: true }) === 'cutter');
check('visual.plain cutter is cutter', visualClassFor({ classKey: 'cutter' }) === 'cutter');
check('qship vs freighter sep == ff', qSep === sepFF, `${qSep} vs ${sepFF}`);
check('qship vs qship sep == ff', separationFor(visualClassFor(qRec), visualClassFor(qRec)) === sepFF);
check('qship cover blocked at ff-eps', spawnBlocked({ x: sepFF - 0.01, y: 0, z: 0 }, visualClassFor(qRec), [qLive]) === true);
check('qship cover clear at ff+eps', spawnBlocked({ x: sepFF + 0.01, y: 0, z: 0 }, visualClassFor(qRec), [qLive]) === false);
const cutterSep = separationFor('cutter', 'cutter');
check('cutter-cutter < freighter-freighter', cutterSep < sepFF, `${cutterSep}`);
check('qship not using cutter sep', spawnBlocked({ x: (cutterSep + sepFF) * 0.5, y: 0, z: 0 }, visualClassFor(qRec), [qLive]) === true);

check('share is ~40%', PIRATE_LIVE_SHARE === 0.4, `${PIRATE_LIVE_SHARE}`);
check('pirate cap blockade infinite', pirateLiveCap(10, true) === Number.POSITIVE_INFINITY);
check('pirate cap 10 -> 4', pirateLiveCap(10, false) === 4, `${pirateLiveCap(10, false)}`);
check('pirate cap 1 -> 1 (lone pirate ok)', pirateLiveCap(1, false) === 1, `${pirateLiveCap(1, false)}`);
check('pirate cap 0 -> 0', pirateLiveCap(0, false) === 0, `${pirateLiveCap(0, false)}`);

check('close band is 80', CLOSE_SPAWN_RANGE === 80, `${CLOSE_SPAWN_RANGE}`);
check('close on player (d=0)', closeSpawn(0) === true);
check('close at band edge', closeSpawn(CLOSE_SPAWN_RANGE) === true);
check('not close just outside band', closeSpawn(CLOSE_SPAWN_RANGE + 1) === false);
check('not close at TARGET_RANGE', closeSpawn(600) === false);
check('NaN dist not close', closeSpawn(NaN) === false);
// traffic.js: closeSpawn(d) skips pirateLiveCap and spawnBlocked.
const overCap = pirateLiveCap(10, false);
check('mix cap still 4 at 10 live', overCap === 4);
check('distant pirate still mix-capped (guard applies)', closeSpawn(200) === false && 4 + 1 > overCap);

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  process.exit(1);
}
console.log('PASS');
process.exit(0);
