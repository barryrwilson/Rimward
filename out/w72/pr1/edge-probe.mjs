// Wave 72 PR1 extra edges — verifier only.
// node --import ./scripts/with-css-stub.mjs out/w72/pr1/edge-probe.mjs
import { readFileSync } from 'node:fs';
import { createShipState } from '../../../src/game/state.js';
import {
  sanitizeHangar,
  sanitizeHangarRecord,
  parkMounted,
  healPlayerHullKind,
  syncMountedToPlayer,
  switchTo,
  addPurchasedHull,
  writeMountedGear,
  applyMountedFlight,
} from '../../../src/game/hangar.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function hasGrafted(obj) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, 'grafted');
}

function makeCtx(extra = {}) {
  return {
    flags: extra.flags ?? {},
    gate: extra.gate ?? {},
    world: {
      currentSystem: 'freehold',
      credits: 350,
      fear: 0,
      scanner: extra.scanner ?? 0,
      miningLaser: extra.miningLaser ?? 0,
      concealedMounts: extra.concealedMounts ?? false,
      reputation: extra.reputation ?? { freehold: 0, redledger: 0, veridian: 0, hollow: 0 },
      ...(extra.world ?? {}),
    },
    systems: { freehold: {} },
    cargo: extra.cargo ?? [],
    cargoCapacity: extra.cargoCapacity ?? 20,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: extra.player ?? createShipState('light', { name: 'Probe' }),
    ship: { object: null },
    emit() {},
    ships: [],
    config: { ship: { maxSpeed: 120, creep: 30, afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 } } },
  };
}

function rowOf(id, extra = {}) {
  return { id, hullKind: 'built', classKey: 'light', faction: 'gilded', ...extra };
}

{
  const rec = sanitizeHangarRecord({ ...rowOf('hull_strtrue'), grafted: 'true' });
  pin('omit.stringTrue', rec && !hasGrafted(rec));
}

{
  const rec = sanitizeHangarRecord({ ...rowOf('hull_obj'), grafted: {} });
  pin('omit.object', rec && !hasGrafted(rec));
}

{
  const rec = sanitizeHangarRecord({ ...rowOf('hull_arr'), grafted: [] });
  pin('omit.array', rec && !hasGrafted(rec));
}

{
  const rec = sanitizeHangarRecord({ ...rowOf('hull_boxed'), grafted: new Boolean(true) });
  pin('omit.boxedTrue', rec && !hasGrafted(rec));
}

{
  const rec = sanitizeHangarRecord({ ...rowOf('hull_null'), grafted: null });
  pin('omit.null', rec && !hasGrafted(rec));
}

{
  const rec = sanitizeHangarRecord({ ...rowOf('hull_undef'), grafted: undefined });
  pin('omit.undefined', rec && !hasGrafted(rec));
}

{
  const rec = sanitizeHangarRecord({
    ...rowOf('hull_extras'),
    grafted: true,
    grafts: [{ id: 'tissue' }],
    extraKey: 'leak',
    reputation: { beautiful: 99 },
    hullKind: 'built',
  });
  pin('extras.keepTrue', rec?.grafted === true);
  pin('extras.noGrafts', rec && !Object.prototype.hasOwnProperty.call(rec, 'grafts'));
  pin('extras.noUnknown', rec && !Object.prototype.hasOwnProperty.call(rec, 'extraKey'));
  pin('extras.noRepOnRow', rec && !Object.prototype.hasOwnProperty.call(rec, 'reputation'));
}

{
  const rec = sanitizeHangarRecord({
    id: 'hull_omitkind',
    classKey: 'light',
    faction: 'gilded',
    grafted: true,
  });
  pin('omitKind.noHullKind', rec && !Object.prototype.hasOwnProperty.call(rec, 'hullKind'));
  pin('omitKind.keepsGrafted', rec?.grafted === true);
}

{
  const rec = sanitizeHangarRecord({
    id: 'prototype',
    hullKind: 'built',
    grafted: true,
    classKey: 'light',
    faction: 'gilded',
  });
  pin('proto.prototype', rec === null);
}

{
  const rec = sanitizeHangarRecord({
    id: 'toString',
    hullKind: 'built',
    grafted: true,
    classKey: 'light',
  });
  pin('proto.toString', rec === null);
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), {
      hullKind: 'built',
      grafted: 'true',
      faction: 'gilded',
    }),
  });
  ctx.world.hangar = {
    mountedId: 'hull_built',
    hulls: [{ id: 'hull_built', hullKind: 'built', classKey: 'light', faction: 'gilded' }],
  };
  sanitizeHangar(ctx);
  parkMounted(ctx);
  const packed = ctx.world.hangar.hulls[0];
  pin('pack.stringTrueDrop', packed && !hasGrafted(packed) && packed.hullKind === 'built');
}

{
  const ctx = makeCtx({
    flags: { docked: true },
    player: Object.assign(createShipState('light'), { hullKind: 'living', faction: 'independent' }),
  });
  ctx.world.hangar = {
    mountedId: 'hull_a',
    hulls: [
      { id: 'hull_a', hullKind: 'living', classKey: 'light', faction: 'independent' },
      { id: 'hull_b', hullKind: 'built', grafted: true, classKey: 'light', faction: 'gilded' },
    ],
  };
  const onto = switchTo(ctx, 'hull_b');
  pin('switch.ontoOk', onto.ok === true);
  pin('switch.copyTrue', ctx.player.grafted === true && ctx.player.hullKind === 'built');
  const back = switchTo(ctx, 'hull_a');
  pin('switch.backOk', back.ok === true);
  pin('switch.dropOnLiving', !hasGrafted(ctx.player) && ctx.player.hullKind === 'living');
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), {
      hullKind: 'built',
      grafted: true,
      faction: 'unknowables',
    }),
  });
  applyMountedFlight(ctx);
  pin('flight.unkLiving', ctx.player.hullKind === 'living');
  pin(
    'flight.unkDropGrafted',
    !hasGrafted(ctx.player),
    hasGrafted(ctx.player) ? 'applyMountedFlight left grafted on Unknowables' : '',
  );
}

{
  const ctx = makeCtx();
  const beforeRep = JSON.parse(JSON.stringify(ctx.world.reputation));
  addPurchasedHull(ctx, {
    id: 'hull_buy',
    hullKind: 'built',
    grafted: true,
    classKey: 'light',
    faction: 'gilded',
    grafts: [],
    extraKey: 1,
  });
  const rec = ctx.world.hangar.hulls.find((r) => r.id === 'hull_buy');
  pin('buy.grafted', rec?.grafted === true && rec.hullKind === 'built');
  pin('buy.noGrafts', rec && !Object.prototype.hasOwnProperty.call(rec, 'grafts'));
  pin('buy.noRepWrite', JSON.stringify(ctx.world.reputation) === JSON.stringify(beforeRep));
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'built', grafted: true, faction: 'gilded' }),
  });
  ctx.world.hangar = {
    mountedId: 'hull_g',
    hulls: [{ id: 'hull_g', hullKind: 'built', grafted: true, classKey: 'light', faction: 'gilded' }],
  };
  sanitizeHangar(ctx);
  const before = ctx.world.hangar.hulls[0].grafted;
  writeMountedGear(ctx, { grafted: false, grafts: [], scanner: 1 });
  const row = ctx.world.hangar.hulls[0];
  pin('gear.ignoreGraftedPatch', row.grafted === true && before === true);
  pin('gear.noGraftsKey', !Object.prototype.hasOwnProperty.call(row, 'grafts'));
  pin('gear.scanner', row.scanner === 1);
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'built', grafted: true, faction: 'gilded' }),
  });
  ctx.world.hangar = {
    mountedId: 'hull_g',
    hulls: [{ id: 'hull_g', hullKind: 'built', grafted: true, classKey: 'light', faction: 'gilded' }],
  };
  const beforeRep = { ...ctx.world.reputation, beautiful: 12 };
  ctx.world.reputation = { ...beforeRep };
  sanitizeHangar(ctx);
  syncMountedToPlayer(ctx);
  healPlayerHullKind(ctx);
  pin('rep.untouched', ctx.world.reputation.beautiful === 12);
}

{
  const src = readFileSync(new URL('../../../src/game/hangar.js', import.meta.url), 'utf8');
  pin('src.noWorldRepAssign', !/world\.reputation/.test(src) && !/ctx\.world\.reputation/.test(src));
  pin('src.noGraftsArrayPersist', !/grafts\s*:/.test(src));
}

if (fails.length) {
  console.log('W72 PR1 EDGE FAIL');
  for (const f of fails) console.log('  ', f);
  process.exit(1);
}
console.log('W72 PR1 EDGE PASS', fails.length);
process.exit(0);
