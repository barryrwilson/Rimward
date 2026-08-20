// Wave 68 PR0 — catalog pins. No persist, no UI, no fire.
// node out/w68/pr0/probe.mjs
import {
  WEAPONS,
  MINING_LASERS,
  SHIP_CLASSES,
  MOUNT_TABLE,
  applyHit,
  createShipState,
} from '../../../src/game/state.js';
import {
  LAUNCHER_IDS,
  TURRET_IDS,
  canSeat,
  isLauncherId,
  isTurretId,
  launcherAmmoMax,
  healMissileAmmo,
} from '../../../src/game/weapon-fit.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function keysOf(obj) {
  return Object.keys(obj).sort().join(',');
}

const cannon = {
  name: 'Energy cannon', damage: 8, rof: 6, speed: 900, range: 500, heatPerShot: 4, family: 'energy',
};
const disruptor = {
  name: 'Disruptor', damage: 10, rof: 2.5, speed: 700, range: 350, heatPerShot: 6,
  family: 'disruptor', shieldMult: 2, engineMult: 2, hullMult: 0.25,
};

pin('cannon.byte', JSON.stringify(WEAPONS.cannon) === JSON.stringify(cannon));
pin('disruptor.byte', JSON.stringify(WEAPONS.disruptor) === JSON.stringify(disruptor));
pin('mining.derived.name', WEAPONS.mining.name === MINING_LASERS[0].name);
pin('mining.derived.damage', WEAPONS.mining.damage === MINING_LASERS[0].damage);
pin('mining.derived.range', WEAPONS.mining.range === MINING_LASERS[0].range);
pin('mining.derived.heat', WEAPONS.mining.heatPerShot === MINING_LASERS[0].heatPerShot);
pin('mining.derived.extract', WEAPONS.mining.extractPerSec === MINING_LASERS[0].extractPerSec);
pin('mining.beam', WEAPONS.mining.beam === true && WEAPONS.mining.family === 'mining'
  && WEAPONS.mining.rof === 4 && WEAPONS.mining.speed === 0);

pin('missile.exists', Object.hasOwn(WEAPONS, 'missile'));
pin('turret.exists', Object.hasOwn(WEAPONS, 'turret'));
pin('missile.family', WEAPONS.missile.family === 'missile');
pin('missile.notBeam', WEAPONS.missile.beam !== true);
pin('missile.nums', WEAPONS.missile.damage === 22 && WEAPONS.missile.rof === 0.45
  && WEAPONS.missile.speed === 260 && WEAPONS.missile.range === 720
  && WEAPONS.missile.heatPerShot === 14 && WEAPONS.missile.name === 'Dart rack');
pin('missile.turn', typeof WEAPONS.missile.turn === 'number'
  && WEAPONS.missile.turn < SHIP_CLASSES.cutter.turn);
pin('turret.family', WEAPONS.turret.family === 'energy');
pin('turret.notBeam', WEAPONS.turret.beam !== true);
pin('turret.nums', WEAPONS.turret.damage === 4 && WEAPONS.turret.rof === 3
  && WEAPONS.turret.speed === 800 && WEAPONS.turret.range === 380
  && WEAPONS.turret.heatPerShot === 2 && WEAPONS.turret.name === 'Auto turret');

const dummy = createShipState('light', { name: 'PR0' });
let applyOk = true;
try {
  applyHit(dummy, { damage: 22, family: 'missile', facet: 'fore', now: 0 });
  applyHit(dummy, { damage: 4, family: 'turret', facet: 'fore', now: 0 });
} catch (err) {
  applyOk = false;
  fails.push(`applyHit.throw: ${err.message}`);
}
pin('applyHit.lookup', applyOk);

const unk = createShipState('light', { name: 'U', faction: 'unknowables' });
const missed = applyHit(unk, { damage: 22, family: 'missile', facet: 'fore', now: 1 });
pin('unknowable.missileMiss', Array.isArray(missed) && missed.length === 0 && unk.hull === unk.hullMax);

pin('mount.light.missile', MOUNT_TABLE.light.missile === 0);
pin('mount.heavy.missile', MOUNT_TABLE.heavy.missile === 2);
pin('mount.ace.turret', MOUNT_TABLE.ace.turret === 1);
pin('mount.freighter.turret', MOUNT_TABLE.freighter.turret === 0);
pin('mount.noGod', !Object.hasOwn(MOUNT_TABLE, 'god') && !Object.hasOwn(MOUNT_TABLE, '__proto__'));
pin('mount.frozen', Object.isFrozen(MOUNT_TABLE) && Object.isFrozen(MOUNT_TABLE.light));
pin('class.noPower', !Object.hasOwn(SHIP_CLASSES.light, 'power')
  && !Object.hasOwn(SHIP_CLASSES.heavy, 'kW'));

pin('launcher.dart', Object.hasOwn(LAUNCHER_IDS, 'dart') === true);
pin('launcher.god', Object.hasOwn(LAUNCHER_IDS, 'god') === false);
pin('launcher.proto', Object.hasOwn(LAUNCHER_IDS, '__proto__') === false);
pin('launcher.constructor', Object.hasOwn(LAUNCHER_IDS, 'constructor') === false);
pin('turret.auto', Object.hasOwn(TURRET_IDS, 'auto') === true);
pin('turret.god', Object.hasOwn(TURRET_IDS, 'god') === false);
pin('turret.proto', Object.hasOwn(TURRET_IDS, '__proto__') === false);

pin('heal.99', healMissileAmmo('dart', 99) === 8);
pin('heal.str2', healMissileAmmo('dart', '2') === 0);
pin('heal.empty', healMissileAmmo('', 4) === 0);
pin('heal.frac', healMissileAmmo('dart', 2.9) === 0);
pin('heal.zero', healMissileAmmo('dart', 0) === 0);
pin('heal.neg', healMissileAmmo('dart', -1) === 0);
pin('ammoMax.dart', launcherAmmoMax('dart') === 8);
pin('ammoMax.god', launcherAmmoMax('god') === 0);
pin('isLauncher.dart', isLauncherId('dart') === true);
pin('isLauncher.god', isLauncherId('god') === false);
pin('isLauncher.proto', isLauncherId('__proto__') === false);
pin('isTurret.auto', isTurretId('auto') === true);
pin('isTurret.proto', isTurretId('constructor') === false);

pin('canSeat.light.missile', canSeat('light', 'missile') === false);
pin('canSeat.heavy.missile', canSeat('heavy', 'missile') === true);
pin('canSeat.ace.turret', canSeat('ace', 'turret') === true);
pin('canSeat.freighter.turret', canSeat('freighter', 'turret') === false);
pin('canSeat.god.missile', canSeat('god', 'missile') === false);
pin('canSeat.cutter.turret', canSeat('cutter', 'turret') === false);

pin('sku.dart.cost', LAUNCHER_IDS.dart.cost === 6500 && LAUNCHER_IDS.dart.confirm === true);
pin('sku.auto.cost', TURRET_IDS.auto.cost === 4200 && TURRET_IDS.auto.confirm === true);
pin('sku.noHtml', !String(LAUNCHER_IDS.dart.line).includes('<')
  && !String(TURRET_IDS.auto.line).includes('<'));
pin('sku.frozen', Object.isFrozen(LAUNCHER_IDS) && Object.isFrozen(LAUNCHER_IDS.dart)
  && Object.isFrozen(TURRET_IDS) && Object.isFrozen(TURRET_IDS.auto));
pin('sku.keys', keysOf(LAUNCHER_IDS.dart) === 'ammoMax,confirm,cost,line,name,restockCost,restockUnit,wkey');

if (fails.length) {
  console.error('FAIL', fails.join('\n'));
  process.exit(1);
}
console.log('PASS', 'all PR0 pins true');
process.exit(0);
