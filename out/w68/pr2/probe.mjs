// Wave 68 PR2 — writeMountedGear + spendMissileAmmo + stock racks.
// node out/w68/pr2/probe.mjs
import { register } from 'node:module';
register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const {
  sanitizeHangar,
  sanitizeHangarRecord,
  writeMountedGear,
  spendMissileAmmo,
  parkMounted,
  switchTo,
  addPurchasedHull,
} = await import('../../../src/game/hangar.js');
const { createShipState } = await import('../../../src/game/state.js');
const {
  listYardOffers,
  purchaseYardHull,
} = await import('../../../src/game/shipyard.js');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeCtx(extra = {}) {
  const classKey = extra.classKey ?? extra.player?.classKey ?? 'heavy';
  return {
    flags: extra.flags ?? {},
    world: {
      currentSystem: extra.currentSystem ?? 'freehold',
      credits: extra.credits ?? 100000,
      fear: 0,
      scanner: extra.scanner ?? 0,
      miningLaser: extra.miningLaser ?? 0,
      concealedMounts: extra.concealedMounts ?? false,
      launcher: extra.launcher ?? '',
      missileAmmo: extra.missileAmmo ?? 0,
      turret: extra.turret ?? '',
      reputation: extra.reputation ?? { freehold: 0, beautiful: 0 },
      hangar: extra.hangar ?? {
        mountedId: extra.mountedId ?? 'h1',
        hulls: extra.hulls ?? [{
          id: extra.mountedId ?? 'h1',
          classKey,
          faction: 'independent',
          name: classKey,
        }],
      },
      ...(extra.world ?? {}),
    },
    systems: extra.systems ?? { freehold: { faction: 'freehold' }, beau: { faction: 'beautiful' } },
    cargo: extra.cargo ?? [],
    cargoCapacity: extra.cargoCapacity ?? 20,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: extra.player ?? createShipState(classKey, { name: 'PR2' }),
    ship: { object: null },
    emit() {},
    ships: [],
    gate: { jumping: false },
    config: extra.config ?? {
      ship: {
        maxSpeed: 120, creep: 30, acceleration: 90, damping: 0.5,
        afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 },
      },
    },
  };
}

function gearCtx(classKey, extra = {}) {
  const ctx = makeCtx({ classKey, ...extra });
  sanitizeHangar(ctx);
  return ctx;
}

{
  const ctx = gearCtx('heavy');
  const row = writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4 });
  pin('1.row.launcher', row.launcher === 'dart');
  pin('1.row.ammo', row.missileAmmo === 4);
  pin('1.world.launcher', ctx.world.launcher === 'dart');
  pin('1.world.ammo', ctx.world.missileAmmo === 4);
}

{
  const ctx = gearCtx('light');
  const row = writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4 });
  pin('2.light.launcher', row.launcher === '' && ctx.world.launcher === '');
  pin('2.light.ammo', row.missileAmmo === 0 && ctx.world.missileAmmo === 0);
}

{
  const ctx = gearCtx('heavy');
  const row = writeMountedGear(ctx, { launcher: 'god' });
  pin('3.god', row.launcher === '' && ctx.world.launcher === '');
}

{
  const ctx = gearCtx('heavy');
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4 });
  const row = writeMountedGear(ctx, { missileAmmo: '2' });
  pin('4.ammoStr', row.missileAmmo === 0 && ctx.world.missileAmmo === 0 && row.launcher === 'dart');
}

{
  const ctx = gearCtx('heavy');
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4 });
  const row = writeMountedGear(ctx, { missileAmmo: 99 });
  pin('5.ammo99', row.missileAmmo === 8 && ctx.world.missileAmmo === 8);
}

{
  const ctx = gearCtx('heavy');
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4 });
  const row = writeMountedGear(ctx, { launcher: '' });
  pin('6.emptyRack', row.launcher === '' && row.missileAmmo === 0
    && ctx.world.launcher === '' && ctx.world.missileAmmo === 0);
}

{
  const ctx = gearCtx('heavy');
  const row = writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4, damage: 99, rof: 12, loadout: { x: 1 } });
  pin('7.noDamage', !('damage' in row) && !('rof' in row) && !('loadout' in row));
  pin('7.keptLauncher', row.launcher === 'dart' && row.missileAmmo === 4);
}

{
  const ctx = gearCtx('heavy');
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4 });
  const heatBefore = ctx.player.heat;
  const spent = spendMissileAmmo(ctx, 2);
  const row = ctx.world.hangar.hulls.find((h) => h.id === ctx.world.hangar.mountedId);
  pin('8.spent', spent === 2);
  pin('8.row', row.missileAmmo === 2);
  pin('8.world', ctx.world.missileAmmo === 2);
  pin('8.noHeat', ctx.player.heat === heatBefore);
}

{
  const ctx = gearCtx('heavy');
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 2 });
  const spent = spendMissileAmmo(ctx, 9);
  const row = ctx.world.hangar.hulls.find((h) => h.id === ctx.world.hangar.mountedId);
  pin('9.spent', spent === 2);
  pin('9.row', row.missileAmmo === 0);
  pin('9.world', ctx.world.missileAmmo === 0);
}

{
  const ctx = gearCtx('heavy');
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4 });
  const before = ctx.world.missileAmmo;
  pin('10.float', spendMissileAmmo(ctx, 1.5) === 0 && ctx.world.missileAmmo === before);
  pin('10.str', spendMissileAmmo(ctx, '1') === 0 && ctx.world.missileAmmo === before);
  pin('10.zero', spendMissileAmmo(ctx, 0) === 0 && ctx.world.missileAmmo === before);
  pin('10.neg', spendMissileAmmo(ctx, -1) === 0 && ctx.world.missileAmmo === before);
  pin('10.row', ctx.world.hangar.hulls[0].missileAmmo === 4);
}

{
  const empty = (r) => r && r.launcher === '' && r.missileAmmo === 0 && r.turret === '';
  const ctx = makeCtx({
    classKey: 'light',
    flags: { docked: true },
    currentSystem: 'freehold',
    systems: { freehold: { faction: 'freehold' } },
    credits: 100000,
    hangar: {
      mountedId: 'hull_starter',
      hulls: [{
        id: 'hull_starter',
        hullKind: 'living',
        classKey: 'light',
        faction: 'independent',
        name: 'starter',
        scanner: 0,
        miningLaser: 0,
        concealedMounts: false,
        cargoCapacity: 20,
        cargo: [],
      }],
    },
  });
  const bought = purchaseYardHull(ctx, 'light');
  pin('11.buy.ok', bought.ok === true, bought.reason);
  pin('11.buy.racks', empty(bought.row), bought.row && `${bought.row.launcher}/${bought.row.missileAmmo}/${bought.row.turret}`);
  pin('11.buy.notRemount', ctx.world.hangar.mountedId === 'hull_starter');

  const added = addPurchasedHull(ctx, {
    id: 'hull_probe_stock',
    classKey: 'heavy',
    faction: 'freehold',
    hullKind: 'built',
    launcher: '',
    missileAmmo: 0,
    turret: '',
  });
  pin('11.add.ok', added.ok === true, added.reason);
  pin('11.add.racks', empty(added.row));

  const fh = listYardOffers({
    world: { currentSystem: 'freehold' },
    systems: { freehold: { faction: 'freehold' } },
  }).map((o) => o.classKey);
  const beau = listYardOffers({
    world: { currentSystem: 'beau' },
    systems: { beau: { faction: 'beautiful' } },
  }).map((o) => o.classKey);
  pin('11.freehold.frigate', fh.includes('frigate'));
  pin('11.beautiful.noFrigate', !beau.includes('frigate'));
  pin('11.beautiful.stock', beau.join(',') === 'light,cutter,heavy');
}

{
  const ctx = makeCtx({
    classKey: 'heavy',
    flags: { docked: true },
    hulls: [
      { id: 'hA', classKey: 'heavy', faction: 'independent', name: 'A' },
      { id: 'hB', classKey: 'heavy', faction: 'independent', name: 'B' },
    ],
    mountedId: 'hA',
  });
  sanitizeHangar(ctx);
  writeMountedGear(ctx, { launcher: 'dart', missileAmmo: 4 });
  const a = ctx.world.hangar.hulls.find((h) => h.id === 'hA');
  const b = ctx.world.hangar.hulls.find((h) => h.id === 'hB');
  pin('12.a.has', a.launcher === 'dart' && a.missileAmmo === 4);
  pin('12.b.empty', b.launcher === '' && b.missileAmmo === 0 && b.turret === '');
  parkMounted(ctx);
  const swapped = switchTo(ctx, 'hB');
  pin('12.switch', swapped.ok === true, swapped.reason);
  pin('12.world.empty', ctx.world.launcher === '' && ctx.world.missileAmmo === 0 && ctx.world.turret === '');
  const aAfter = ctx.world.hangar.hulls.find((h) => h.id === 'hA');
  const bAfter = ctx.world.hangar.hulls.find((h) => h.id === 'hB');
  pin('12.a.kept', aAfter.launcher === 'dart' && aAfter.missileAmmo === 4);
  pin('12.b.stillEmpty', bAfter.launcher === '' && bAfter.missileAmmo === 0);
}

{
  const ctx = gearCtx('heavy');
  const row = writeMountedGear(ctx, { turret: 'auto' });
  pin('turret.auto', row.turret === 'auto' && ctx.world.turret === 'auto');
  const light = gearCtx('light');
  const lightRow = writeMountedGear(light, { turret: 'auto' });
  pin('turret.light', lightRow.turret === '' && light.world.turret === '');
  pin('spend.emptyLauncher', spendMissileAmmo(ctx, 1) === 0);
  const noHangar = makeCtx();
  delete noHangar.world.hangar;
  pin('spend.noHangar', spendMissileAmmo(noHangar, 1) === 0);
}

if (fails.length) {
  console.log('W68 PR2 PROBE FAIL');
  for (const f of fails) console.log('  ', f);
  process.exit(1);
}
console.log('W68 PR2 PROBE PASS', fails.length);
process.exit(0);
