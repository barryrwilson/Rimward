// Wave 68 PR1 — hangar persist pins. No UI, no fire.
// node out/w68/pr1/probe.mjs
import { register } from 'node:module';
register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const {
  sanitizeHangarRecord,
  sanitizeHangar,
  parkMounted,
  healPlayerHullKind,
  rebuildStarterHangar,
  syncMountedWeaponMirrors,
  switchTo,
} = await import('../../../src/game/hangar.js');
const { restore, WORLD_FIELDS } = await import('../../../src/game/save.js');
const { createShipState } = await import('../../../src/game/state.js');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeCtx(extra = {}) {
  return {
    flags: extra.flags ?? {},
    world: {
      currentSystem: 'freehold',
      credits: 350,
      fear: 0,
      scanner: extra.scanner ?? 0,
      miningLaser: extra.miningLaser ?? 0,
      concealedMounts: extra.concealedMounts ?? false,
      launcher: extra.launcher ?? '',
      missileAmmo: extra.missileAmmo ?? 0,
      turret: extra.turret ?? '',
      ...(extra.world ?? {}),
    },
    systems: { freehold: {} },
    cargo: extra.cargo ?? [],
    cargoCapacity: extra.cargoCapacity ?? 20,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: extra.player ?? createShipState('light', { name: 'PR1' }),
    ship: { object: null },
    emit() {},
    ships: [],
  };
}

const lightDart = sanitizeHangarRecord({
  id: 'l1', classKey: 'light', launcher: 'dart', missileAmmo: 8,
});
pin('1.light.launcher', lightDart.launcher === '');
pin('1.light.ammo', lightDart.missileAmmo === 0);

const cutterDart = sanitizeHangarRecord({
  id: 'c1', classKey: 'cutter', launcher: 'dart', missileAmmo: 8, turret: 'auto',
});
const freightDart = sanitizeHangarRecord({
  id: 'f1', classKey: 'freighter', launcher: 'dart', missileAmmo: 8, turret: 'auto',
});
pin('1.cutter.empty', cutterDart.launcher === '' && cutterDart.missileAmmo === 0 && cutterDart.turret === '');
pin('1.freighter.empty', freightDart.launcher === '' && freightDart.missileAmmo === 0 && freightDart.turret === '');

const god = sanitizeHangarRecord({ id: 'h_god', classKey: 'heavy', launcher: 'god' });
pin('2.god', god.launcher === '' && god.missileAmmo === 0);

const ammo99 = sanitizeHangarRecord({
  id: 'h99', classKey: 'heavy', launcher: 'dart', missileAmmo: 99,
});
pin('3.ammo99', ammo99.launcher === 'dart' && ammo99.missileAmmo === 8);

const ammoStr = sanitizeHangarRecord({
  id: 'hstr', classKey: 'heavy', launcher: 'dart', missileAmmo: '2',
});
pin('4.ammoStr', ammoStr.launcher === 'dart' && ammoStr.missileAmmo === 0);

const ammoFloat = sanitizeHangarRecord({
  id: 'hflt', classKey: 'heavy', launcher: 'dart', missileAmmo: 2.9,
});
pin('5.ammoFloat', ammoFloat.launcher === 'dart' && ammoFloat.missileAmmo === 0);

const nested = sanitizeHangarRecord({
  id: 'hnest', classKey: 'heavy', loadout: { missile: 1 },
});
pin('6.loadoutDropped', !('loadout' in nested) && nested.launcher === '' && nested.missileAmmo === 0);

const turretTrue = sanitizeHangarRecord({
  id: 'ht', classKey: 'heavy', turret: true,
});
pin('7.turretTrue', turretTrue.turret === '');

pin('8.protoNull', sanitizeHangarRecord({ id: '__proto__', classKey: 'heavy', launcher: 'dart' }) === null);
pin('8.ctorNull', sanitizeHangarRecord({ id: 'constructor', classKey: 'heavy' }) === null);
pin('8.prototypeNull', sanitizeHangarRecord({ id: 'prototype', classKey: 'heavy' }) === null);

{
  const ctx = makeCtx({
    player: createShipState('heavy', { name: 'H' }),
    launcher: 'dart',
    missileAmmo: 4,
    flags: { docked: true },
  });
  ctx.world.hangar = {
    mountedId: 'h1',
    hulls: [
      { id: 'h1', classKey: 'heavy', faction: 'independent' },
      { id: 'h2', classKey: 'heavy', faction: 'independent' },
    ],
  };
  sanitizeHangar(ctx);
  parkMounted(ctx);
  const parked = ctx.world.hangar.hulls.find((h) => h.id === 'h1');
  pin('9.park.row', parked.launcher === 'dart' && parked.missileAmmo === 4 && parked.turret === '');
  const toH2 = switchTo(ctx, 'h2');
  pin('9.switch.h2', toH2.ok === true, toH2.reason);
  pin('9.h2.world', ctx.world.launcher === '' && ctx.world.missileAmmo === 0 && ctx.world.turret === '');
  const toH1 = switchTo(ctx, 'h1');
  pin('9.switch.h1', toH1.ok === true, toH1.reason);
  const loaded = ctx.world.hangar.hulls.find((h) => h.id === 'h1');
  pin('9.load.row', loaded.launcher === 'dart' && loaded.missileAmmo === 4);
  pin('9.load.world', ctx.world.launcher === 'dart' && ctx.world.missileAmmo === 4 && ctx.world.turret === '');
}

{
  const ctx = makeCtx({ launcher: 'dart', missileAmmo: 8, turret: 'auto' });
  ctx.world.hangar = {
    mountedId: 'l1',
    hulls: [{ id: 'l1', classKey: 'light', faction: 'independent' }],
  };
  sanitizeHangar(ctx);
  syncMountedWeaponMirrors(ctx);
  pin('10.helper.launcher', ctx.world.launcher === '');
  pin('10.helper.ammo', ctx.world.missileAmmo === 0);
  pin('10.helper.turret', ctx.world.turret === '');
}

{
  const dest = makeCtx({ launcher: 'keep', missileAmmo: 7, turret: 'keep' });
  restore(dest, {
    v: 1,
    world: {
      currentSystem: 'freehold',
      launcher: 'dart',
      missileAmmo: 99,
      turret: 'auto',
      hangar: {
        mountedId: 'l1',
        hulls: [{ id: 'l1', classKey: 'light', faction: 'independent' }],
      },
    },
  });
  pin('10.restore.launcher', dest.world.launcher === '');
  pin('10.restore.ammo', dest.world.missileAmmo === 0);
  pin('10.restore.turret', dest.world.turret === '');
}

{
  const dest = makeCtx({ launcher: 'dart', missileAmmo: 8, turret: 'auto' });
  dest.world.hangar = { mountedId: 'old', hulls: [{ id: 'old', classKey: 'heavy', launcher: 'dart' }] };
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold', launcher: 'dart', missileAmmo: 8, turret: 'auto' },
  });
  pin('11.missing.launcher', dest.world.launcher === '');
  pin('11.missing.ammo', dest.world.missileAmmo === 0);
  pin('11.missing.turret', dest.world.turret === '');
  pin('11.missing.starter', dest.world.hangar.hulls.length === 1
    && dest.world.hangar.hulls[0].launcher === ''
    && dest.world.hangar.hulls[0].missileAmmo === 0
    && dest.world.hangar.hulls[0].turret === '');
}

{
  const ctx = makeCtx({ launcher: 'dart', missileAmmo: 8, turret: 'auto' });
  rebuildStarterHangar(ctx);
  pin('11.rebuild.world', ctx.world.launcher === '' && ctx.world.missileAmmo === 0 && ctx.world.turret === '');
  pin('11.rebuild.row', ctx.world.hangar.hulls[0].launcher === ''
    && ctx.world.hangar.hulls[0].missileAmmo === 0
    && ctx.world.hangar.hulls[0].turret === '');
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), { launcher: 'dart', turret: 'auto', missileAmmo: 8 }),
  });
  healPlayerHullKind(ctx);
  pin('12.player.launcher', !Object.prototype.hasOwnProperty.call(ctx.player, 'launcher'));
  pin('12.player.turret', !Object.prototype.hasOwnProperty.call(ctx.player, 'turret'));
  pin('12.player.ammo', !Object.prototype.hasOwnProperty.call(ctx.player, 'missileAmmo'));
}

{
  const dest = makeCtx();
  dest.player.launcher = 'dart';
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold' },
    player: { ...dest.player, launcher: 'dart', turret: 'auto', missileAmmo: 3 },
  });
  pin('12.restore.player', !Object.prototype.hasOwnProperty.call(dest.player, 'launcher')
    && !Object.prototype.hasOwnProperty.call(dest.player, 'turret')
    && !Object.prototype.hasOwnProperty.call(dest.player, 'missileAmmo'));
}

const keepGear = sanitizeHangarRecord({
  id: 'gear1',
  classKey: 'heavy',
  scanner: 2,
  miningLaser: 3,
  concealedMounts: true,
  launcher: 'dart',
  missileAmmo: 4,
  turret: 'auto',
  damage: 99,
  rof: 12,
  mass: 4,
  power: 8,
  loadout: { missile: 1 },
});
pin('legacy.scanner', keepGear.scanner === 2);
pin('legacy.mining', keepGear.miningLaser === 3);
pin('legacy.qship', keepGear.concealedMounts === true);
pin('legacy.noCombatStats', !('damage' in keepGear) && !('rof' in keepGear)
  && !('mass' in keepGear) && !('power' in keepGear));
pin('legacy.autoTurret', keepGear.turret === 'auto');
pin('worldFields', WORLD_FIELDS.includes('launcher')
  && WORLD_FIELDS.includes('missileAmmo')
  && WORLD_FIELDS.includes('turret'));

if (fails.length) {
  console.log('W68 PR1 PROBE FAIL');
  for (const f of fails) console.log('  ', f);
  process.exit(1);
}
console.log('W68 PR1 PROBE PASS', fails.length);
process.exit(0);
