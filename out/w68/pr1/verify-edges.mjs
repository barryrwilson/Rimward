// Independent PR1 persist edges. node out/w68/pr1/verify-edges.mjs
import { register } from 'node:module';
register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const hangar = await import('../../../src/game/hangar.js');
const { restore, snapshot, WORLD_FIELDS } = await import('../../../src/game/save.js');
const { createShipState } = await import('../../../src/game/state.js');

const {
  sanitizeHangarRecord,
  sanitizeHangar,
  parkMounted,
  healPlayerHullKind,
  rebuildStarterHangar,
  syncMountedWeaponMirrors,
  writeMountedGear,
  switchTo,
  registerPlayerRemount,
} = hangar;

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
    player: extra.player ?? createShipState('light', { name: 'V' }),
    ship: { object: null },
    emit() {},
    ships: [],
    config: extra.config ?? { ship: { maxSpeed: 120, creep: 30, acceleration: 90, damping: 0.5, afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 } } },
  };
}

// Fresh literal: extra / nested keys must not leak.
const polluted = sanitizeHangarRecord({
  id: 'p1',
  classKey: 'heavy',
  launcher: 'dart',
  missileAmmo: 4,
  turret: 'auto',
  loadout: { missile: 1, launcher: 'dart' },
  extra: 1,
});
pin('literal.noLoadout', !('loadout' in polluted));
pin('literal.noExtra', !('extra' in polluted));
pin('literal.keys', ['id', 'faction', 'classKey', 'name', 'scanner', 'miningLaser', 'concealedMounts', 'launcher', 'turret', 'missileAmmo', 'cargoCapacity', 'cargo', 'hullMax', 'screenMax', 'shellMax', 'engineMax', 'hull', 'screen', 'shell', 'engine', 'heat'].every((k) => Object.prototype.hasOwnProperty.call(polluted, k)));

const protoRaw = Object.create({ launcher: 'dart', missileAmmo: 8, turret: 'auto', classKey: 'heavy' });
protoRaw.id = 'inh1';
const fromProto = sanitizeHangarRecord(protoRaw);
pin('own.noInherit', fromProto && fromProto.launcher === '' && fromProto.missileAmmo === 0 && fromProto.turret === '');

pin('reserved.toString', sanitizeHangarRecord({ id: 'toString', classKey: 'heavy', launcher: 'dart' }) === null);
pin('reserved.valueOf', sanitizeHangarRecord({ id: 'valueOf', classKey: 'heavy' }) === null);
pin('reserved.defineGetter', sanitizeHangarRecord({ id: '__defineGetter__', classKey: 'heavy' }) === null);

pin('turret.true', sanitizeHangarRecord({ id: 'tt', classKey: 'heavy', turret: true }).turret === '');
pin('turret.obj', sanitizeHangarRecord({ id: 'to', classKey: 'heavy', turret: { id: 'auto' } }).turret === '');
pin('launcher.protoStr', sanitizeHangarRecord({ id: 'lp', classKey: 'heavy', launcher: '__proto__' }).launcher === '');
pin('light.turret', sanitizeHangarRecord({ id: 'lt', classKey: 'light', turret: 'auto' }).turret === '');
pin('ace.keep', (() => {
  const r = sanitizeHangarRecord({ id: 'a1', classKey: 'ace', launcher: 'dart', missileAmmo: 3, turret: 'auto' });
  return r.launcher === 'dart' && r.missileAmmo === 3 && r.turret === 'auto';
})());
pin('ammo.neg', sanitizeHangarRecord({ id: 'an', classKey: 'heavy', launcher: 'dart', missileAmmo: -1 }).missileAmmo === 0);

// writeMountedGear must ignore launcher / ammo / turret.
{
  const ctx = makeCtx({ player: createShipState('heavy', { name: 'H' }) });
  ctx.world.hangar = {
    mountedId: 'h1',
    hulls: [{ id: 'h1', classKey: 'heavy', faction: 'independent', launcher: '', missileAmmo: 0, turret: '' }],
  };
  sanitizeHangar(ctx);
  const before = { ...ctx.world.hangar.hulls[0] };
  const row = writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 8, turret: 'auto', scanner: 1 });
  pin('wmg.scanner', row.scanner === 1 && ctx.world.scanner === 1);
  pin('wmg.noLauncher', row.launcher === '' && ctx.world.launcher === '');
  pin('wmg.noAmmo', row.missileAmmo === 0 && ctx.world.missileAmmo === 0);
  pin('wmg.noTurret', row.turret === '' && ctx.world.turret === '');
  pin('wmg.rowSame', before.launcher === row.launcher && before.missileAmmo === row.missileAmmo);
}

// Snapshot persist + restore keeps mounted mirrors for a seated class.
{
  const ctx = makeCtx({
    player: createShipState('heavy', { name: 'H' }),
    launcher: 'dart',
    missileAmmo: 4,
    turret: 'auto',
  });
  ctx.world.hangar = {
    mountedId: 'h1',
    hulls: [{ id: 'h1', classKey: 'heavy', faction: 'independent', launcher: 'dart', missileAmmo: 4, turret: 'auto' }],
  };
  const snap = snapshot(ctx);
  pin('snap.worldFields', WORLD_FIELDS.includes('launcher') && WORLD_FIELDS.includes('missileAmmo') && WORLD_FIELDS.includes('turret'));
  pin('snap.mirrors', snap.world.launcher === 'dart' && snap.world.missileAmmo === 4 && snap.world.turret === 'auto');
  pin('snap.row', snap.world.hangar.hulls[0].launcher === 'dart' && snap.world.hangar.hulls[0].missileAmmo === 4 && snap.world.hangar.hulls[0].turret === 'auto');
  pin('snap.noPlayerExtras', !Object.prototype.hasOwnProperty.call(snap.player, 'launcher')
    && !Object.prototype.hasOwnProperty.call(snap.player, 'turret')
    && !Object.prototype.hasOwnProperty.call(snap.player, 'missileAmmo'));

  const dest = makeCtx({ launcher: 'keep', missileAmmo: 7, turret: 'keep', player: createShipState('light', { name: 'L' }) });
  dest.player.launcher = 'keep';
  restore(dest, JSON.parse(JSON.stringify(snap)));
  pin('round.launcher', dest.world.launcher === 'dart');
  pin('round.ammo', dest.world.missileAmmo === 4);
  pin('round.turret', dest.world.turret === 'auto');
  pin('round.playerClass', dest.player.classKey === 'heavy');
  pin('round.noPlayerExtras', !Object.prototype.hasOwnProperty.call(dest.player, 'launcher')
    && !Object.prototype.hasOwnProperty.call(dest.player, 'turret')
    && !Object.prototype.hasOwnProperty.call(dest.player, 'missileAmmo'));
}

// World dart + no hangar on restore forces empty racks.
{
  const dest = makeCtx({ launcher: 'dart', missileAmmo: 8, turret: 'auto', player: createShipState('heavy', { name: 'H' }) });
  dest.world.hangar = {
    mountedId: 'old',
    hulls: [{ id: 'old', classKey: 'heavy', launcher: 'dart', missileAmmo: 8, turret: 'auto' }],
  };
  restore(dest, { v: 1, world: { currentSystem: 'freehold', launcher: 'dart', missileAmmo: 8, turret: 'auto' } });
  pin('nohang.world', dest.world.launcher === '' && dest.world.missileAmmo === 0 && dest.world.turret === '');
  pin('nohang.row', dest.world.hangar.hulls[0].launcher === '' && dest.world.hangar.hulls[0].missileAmmo === 0 && dest.world.hangar.hulls[0].turret === '');
}

// Switch rollback snapshot includes world mirrors.
{
  const ctx = makeCtx({
    player: createShipState('heavy', { name: 'H' }),
    launcher: 'dart',
    missileAmmo: 4,
    turret: 'auto',
    flags: { docked: true },
  });
  ctx.world.hangar = {
    mountedId: 'h1',
    hulls: [
      { id: 'h1', classKey: 'heavy', faction: 'independent', launcher: 'dart', missileAmmo: 4, turret: 'auto' },
      { id: 'h2', classKey: 'heavy', faction: 'independent' },
    ],
  };
  sanitizeHangar(ctx);
  registerPlayerRemount(() => { throw new Error('remount-fail'); });
  const result = switchTo(ctx, 'h2');
  pin('switch.fail', result.ok === false && result.reason === 'failed', result.reason);
  pin('switch.snap.world', ctx.world.launcher === 'dart' && ctx.world.missileAmmo === 4 && ctx.world.turret === 'auto');
  pin('switch.snap.mounted', ctx.world.hangar.mountedId === 'h1');
  registerPlayerRemount(null);
}

// Successful switch copies row mirrors onto world (capture includes them on the way back).
{
  const ctx = makeCtx({
    player: createShipState('heavy', { name: 'H' }),
    launcher: 'dart',
    missileAmmo: 4,
    turret: 'auto',
    flags: { docked: true },
  });
  ctx.world.hangar = {
    mountedId: 'h1',
    hulls: [
      { id: 'h1', classKey: 'heavy', faction: 'independent', launcher: 'dart', missileAmmo: 4, turret: 'auto' },
      { id: 'h2', classKey: 'heavy', faction: 'independent', launcher: '', missileAmmo: 0, turret: 'auto' },
    ],
  };
  sanitizeHangar(ctx);
  const ok = switchTo(ctx, 'h2');
  pin('switch.ok', ok.ok === true, ok.reason);
  pin('switch.h2.world', ctx.world.launcher === '' && ctx.world.missileAmmo === 0 && ctx.world.turret === 'auto');
}

// rebuildStarterHangar clears live dart racks.
{
  const ctx = makeCtx({ launcher: 'dart', missileAmmo: 8, turret: 'auto', player: createShipState('heavy') });
  rebuildStarterHangar(ctx);
  pin('rebuild.world', ctx.world.launcher === '' && ctx.world.missileAmmo === 0 && ctx.world.turret === '');
}

// Missing mounted row helper forces empty.
{
  const ctx = makeCtx({ launcher: 'dart', missileAmmo: 8, turret: 'auto' });
  ctx.world.hangar = { mountedId: 'gone', hulls: [] };
  syncMountedWeaponMirrors(ctx);
  pin('missingRow.world', ctx.world.launcher === '' && ctx.world.missileAmmo === 0 && ctx.world.turret === '');
}

healPlayerHullKind({ player: { classKey: 'heavy', faction: 'independent', launcher: 'dart', turret: 'auto', missileAmmo: 2 } });

if (fails.length) {
  console.log('W68 PR1 EDGES FAIL');
  for (const f of fails) console.log('  ', f);
  process.exit(1);
}
console.log('W68 PR1 EDGES PASS', fails.length);
process.exit(0);
