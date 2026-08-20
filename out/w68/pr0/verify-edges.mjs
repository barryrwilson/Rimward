// Independent verifier edges — not the worker probe.
import { WEAPONS, MINING_LASERS, SHIP_CLASSES, MOUNT_TABLE, applyHit, createShipState } from '../../../src/game/state.js';
import { LAUNCHER_IDS, TURRET_IDS, canSeat, isLauncherId, isTurretId, launcherAmmoMax, healMissileAmmo } from '../../../src/game/weapon-fit.js';
import { readFileSync } from 'node:fs';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

const cannon = {
  name: 'Energy cannon', damage: 8, rof: 6, speed: 900, range: 500, heatPerShot: 4, family: 'energy',
};
const disruptor = {
  name: 'Disruptor', damage: 10, rof: 2.5, speed: 700, range: 350, heatPerShot: 6,
  family: 'disruptor', shieldMult: 2, engineMult: 2, hullMult: 0.25,
};

pin('inv.cannon', JSON.stringify(WEAPONS.cannon) === JSON.stringify(cannon));
pin('inv.disruptor', JSON.stringify(WEAPONS.disruptor) === JSON.stringify(disruptor));
pin('inv.mining.derived',
  WEAPONS.mining.name === MINING_LASERS[0].name
  && WEAPONS.mining.damage === MINING_LASERS[0].damage
  && WEAPONS.mining.range === MINING_LASERS[0].range
  && WEAPONS.mining.heatPerShot === MINING_LASERS[0].heatPerShot
  && WEAPONS.mining.extractPerSec === MINING_LASERS[0].extractPerSec
  && WEAPONS.mining.beam === true
  && WEAPONS.mining.family === 'mining'
  && WEAPONS.mining.rof === 4
  && WEAPONS.mining.speed === 0);

pin('missile.notBeam', WEAPONS.missile.beam !== true);

const expectedMount = {
  light: { general: 2, mining: 1, scanner: 1, qship: 1, missile: 0, turret: 0 },
  cutter: { general: 2, mining: 1, scanner: 1, qship: 1, missile: 0, turret: 0 },
  freighter: { general: 2, mining: 1, scanner: 1, qship: 1, missile: 0, turret: 0 },
  heavy: { general: 2, mining: 1, scanner: 1, qship: 1, missile: 2, turret: 2 },
  ace: { general: 2, mining: 1, scanner: 1, qship: 1, missile: 2, turret: 1 },
  frigate: { general: 2, mining: 1, scanner: 1, qship: 1, missile: 4, turret: 4 },
};
pin('mount.keys', Object.keys(MOUNT_TABLE).sort().join(',') === Object.keys(expectedMount).sort().join(','));
for (const k of Object.keys(expectedMount)) {
  pin(`mount.${k}`, JSON.stringify(MOUNT_TABLE[k]) === JSON.stringify(expectedMount[k]));
}
pin('mount.classesMatch', Object.keys(SHIP_CLASSES).sort().join(',') === Object.keys(MOUNT_TABLE).sort().join(','));

pin('heal.empty', healMissileAmmo('', 4) === 0);
pin('heal.str2', healMissileAmmo('dart', '2') === 0);
pin('heal.frac', healMissileAmmo('dart', 2.9) === 0);
pin('heal.99', healMissileAmmo('dart', 99) === 8);
pin('heal.god', healMissileAmmo('god', 4) === 0);
pin('heal.proto', healMissileAmmo('__proto__', 8) === 0);
pin('heal.constructor', healMissileAmmo('constructor', 4) === 0);
pin('heal.prototype', healMissileAmmo('prototype', 4) === 0);
pin('heal.nullLauncher', healMissileAmmo(null, 4) === 0);
pin('canSeat.undef', canSeat(undefined, 'missile') === false);
pin('canSeat.null', canSeat(null, 'missile') === false);
pin('canSeat.proto', canSeat('__proto__', 'missile') === false);
pin('canSeat.frigate.missile', canSeat('frigate', 'missile') === true);
pin('canSeat.frigate.turret', canSeat('frigate', 'turret') === true);
pin('canSeat.cutter.missile', canSeat('cutter', 'missile') === false);
pin('isLauncher.null', isLauncherId(null) === false);
pin('isLauncher.undef', isLauncherId(undefined) === false);
pin('isLauncher.empty', isLauncherId('') === false);
pin('isTurret.null', isTurretId(null) === false);
pin('proto.launchers', Object.getPrototypeOf(LAUNCHER_IDS) === null);
pin('proto.turrets', Object.getPrototypeOf(TURRET_IDS) === null);
pin('in.proto.false', !('__proto__' in LAUNCHER_IDS) && !('constructor' in LAUNCHER_IDS));
pin('ammoMax.god', launcherAmmoMax('god') === 0);

const dummy = createShipState('light', { name: 'V' });
let applyOk = true;
try {
  applyHit(dummy, { damage: 22, family: 'missile', facet: 'fore', now: 0 });
  applyHit(dummy, { damage: 4, family: 'turret', facet: 'fore', now: 0 });
} catch (err) {
  applyOk = false;
  fails.push(`applyHit.throw: ${err.message}`);
}
pin('applyHit.lookup', applyOk && dummy.screen < dummy.screenMax && dummy.hull === dummy.hullMax);

const unk = createShipState('light', { name: 'U', faction: 'unknowables' });
const missed = applyHit(unk, { damage: 22, family: 'missile', facet: 'fore', now: 1 });
pin('unk.missile', Array.isArray(missed) && missed.length === 0 && unk.hull === unk.hullMax && unk.lastHitAt === -1e9);

const src = readFileSync(new URL('../../../src/game/weapon-fit.js', import.meta.url), 'utf8');
pin('fit.noDom', !/\bdocument\b|\binnerHTML\b|\blocalStorage\b|\bsessionStorage\b/.test(src));
pin('fit.noCtxWrite', !/\bctx\./.test(src));
pin('fit.noSaveImport', !/from ['"]\.\/save\.js['"]/.test(src));

if (fails.length) {
  console.error('FAIL', fails.join('\n'));
  process.exit(1);
}
console.log('PASS independent edges');
process.exit(0);
