// Wave 72 PR2 extra edges — verifier only. Does not edit src/.
// node --import ./scripts/with-css-stub.mjs out/w72/pr2/edge-probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShipState, ORIGINS } from '../../../src/game/state.js';
import { sanitizeHangar } from '../../../src/game/hangar.js';
import {
  hullKindFor,
  listYardOffers,
  purchaseYardHull,
  yardStockFor,
  YARD_LIST_UU,
} from '../../../src/game/shipyard.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const results = {};
const fails = [];

function pin(name, cond, extra = '') {
  results[name] = !!cond;
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
}

function starterRow() {
  return {
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
  };
}

function mockDock(faction, extra = {}) {
  const systemId = extra.systemId ?? `${faction}_dock`;
  const player = extra.player ?? createShipState('light', { name: 'starter', faction: 'independent' });
  player.hullKind = extra.hullKind ?? 'living';
  return {
    flags: { docked: true, combat: false, paused: false, ...(extra.flags ?? {}) },
    world: {
      currentSystem: systemId,
      credits: extra.credits ?? 200000,
      reputation: extra.reputation ?? { [faction]: extra.rep ?? 0 },
      hangar: extra.hangar ?? {
        mountedId: 'hull_starter',
        hulls: [starterRow()],
      },
      shipName: 'starter',
      scanner: 0,
      miningLaser: 0,
      concealedMounts: false,
    },
    systems: extra.systems ?? { [systemId]: { faction } },
    cargo: extra.cargo ?? [],
    cargoCapacity: extra.cargoCapacity ?? 20,
    bio: {
      hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0,
      speedFactor: 1, turnFactor: 1,
    },
    player,
    ship: { object: null },
    emit() {},
    ships: [],
    gate: { jumping: false },
  };
}

function hasGrafted(obj) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, 'grafted');
}

function srcText(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

{
  const stock = yardStockFor('freehold');
  pin('ctrl.freehold.stock.hasFrigate', stock.includes('frigate'), stock.join(','));
  pin('ctrl.freehold.stock.hasAce', stock.includes('ace'));
  const offers = listYardOffers(mockDock('freehold'));
  pin('ctrl.freehold.offers.hasFrigate', offers.some((o) => o.classKey === 'frigate'));
  pin('ctrl.freehold.frigate.built', offers.find((o) => o.classKey === 'frigate')?.hullKind === 'built');
  pin('ctrl.freehold.kind.built', hullKindFor('freehold') === 'built');
  pin('ctrl.veridian.stock.hasFrigate', yardStockFor('veridian').includes('frigate'));
  pin('ctrl.gilded.stock.hasFrigate', yardStockFor('gilded').includes('frigate'));
}

{
  const ctx = mockDock('freehold', { credits: 200000, rep: 25 });
  sanitizeHangar(ctx);
  const mountedBefore = ctx.world.hangar.mountedId;
  const playerKind = ctx.player.hullKind;
  const bought = purchaseYardHull(ctx, 'frigate');
  const row = ctx.world.hangar.hulls.find((h) => h.id !== mountedBefore);
  pin('ctrl.freehold.frigate.buy.ok', bought.ok === true, JSON.stringify(bought));
  pin('ctrl.freehold.frigate.buy.built', row?.hullKind === 'built' && row?.classKey === 'frigate');
  pin('ctrl.freehold.frigate.buy.noRemount', ctx.world.hangar.mountedId === mountedBefore
    && ctx.player.hullKind === playerKind);
}

{
  const cutter = mockDock('beautiful', { credits: 100000, rep: 0 });
  const bioSnap = { ...cutter.bio };
  const playerKind = cutter.player.hullKind;
  const playerClass = cutter.player.classKey;
  const cutterBuy = purchaseYardHull(cutter, 'cutter');
  const cutterRow = cutter.world.hangar.hulls.find((h) => h.id !== 'hull_starter');
  const starter = cutter.world.hangar.hulls.find((h) => h.id === 'hull_starter');
  pin('edge.beautiful.cutter.ok', cutterBuy.ok === true, JSON.stringify(cutterBuy));
  pin('edge.beautiful.cutter.living', cutterRow?.hullKind === 'living' && cutterRow?.classKey === 'cutter');
  pin('edge.beautiful.cutter.noRemount', cutter.world.hangar.mountedId === 'hull_starter'
    && cutter.player.hullKind === playerKind
    && cutter.player.classKey === playerClass);
  pin('edge.beautiful.cutter.starterLiving', starter?.hullKind === 'living');
  pin('edge.beautiful.cutter.noGrafted', !hasGrafted(cutterRow) && cutterRow?.grafted !== true);
  pin('edge.beautiful.cutter.bioSame', cutter.bio.hunger === bioSnap.hunger
    && cutter.bio.bond === bioSnap.bond
    && cutter.bio.wounds === bioSnap.wounds
    && cutter.bio.growth === bioSnap.growth
    && cutter.bio.fedCount === bioSnap.fedCount);

  const heavy = mockDock('beautiful', { credits: 100000, rep: 0 });
  const heavyKind = heavy.player.hullKind;
  const heavyClass = heavy.player.classKey;
  const heavyBuy = purchaseYardHull(heavy, 'heavy');
  const heavyRow = heavy.world.hangar.hulls.find((h) => h.id !== 'hull_starter');
  pin('edge.beautiful.heavy.ok', heavyBuy.ok === true, JSON.stringify(heavyBuy));
  pin('edge.beautiful.heavy.living', heavyRow?.hullKind === 'living' && heavyRow?.classKey === 'heavy');
  pin('edge.beautiful.heavy.noRemount', heavy.world.hangar.mountedId === 'hull_starter'
    && heavy.player.hullKind === heavyKind
    && heavy.player.classKey === heavyClass);
  pin('edge.beautiful.heavy.noGrafted', !hasGrafted(heavyRow) && heavyRow?.grafted !== true);
}

{
  const ctx = mockDock('beautiful', { credits: 100000, rep: 0 });
  const bought = purchaseYardHull(ctx, 'light');
  const row = bought.row;
  pin('edge.buy.noGrafted.row', bought.ok === true && !hasGrafted(row) && row?.grafted !== true);
  pin('edge.buy.noGrafted.player', !hasGrafted(ctx.player));
  const starter = ctx.world.hangar.hulls.find((h) => h.id === 'hull_starter');
  pin('edge.buy.noGrafted.starter', !hasGrafted(starter));

  const unk = mockDock('unknowables', { credits: 100000, rep: 0 });
  const unkBuy = purchaseYardHull(unk, 'light');
  pin('edge.unk.buy.noGrafted', unkBuy.ok === true && !hasGrafted(unkBuy.row) && unkBuy.row?.grafted !== true);
}

{
  pin('edge.price.light8000', YARD_LIST_UU.light === 8000, String(YARD_LIST_UU.light));
  const ctx = mockDock('beautiful', { credits: 100000, rep: 0 });
  const creditsBefore = ctx.world.credits;
  const bought = purchaseYardHull(ctx, 'light');
  pin('edge.price.beautiful.light.debit', bought.ok === true && bought.price === 8000
    && ctx.world.credits === creditsBefore - 8000);
}

{
  const origins = srcText('src/game/origins.js');
  pin('edge.origin.noHullKindWrite', !/\bhullKind\b/.test(origins));
  pin('edge.origin.noRemount', !/\bremount\b/i.test(origins));
  pin('edge.origin.noGrafted', !/\bgrafted\b/.test(origins));
  pin('edge.origin.noSwitchTo', !/\bswitchTo\b/.test(origins));
  pin('edge.origin.noPlayerFactionAssign', !/player\.faction\s*=/.test(origins));

  const fx = ORIGINS.beautiful?.effects ?? {};
  pin('edge.origin.beautiful.bond', fx.setBond === 0.35);
  pin('edge.origin.beautiful.hunger', fx.setHunger === 0.4);
  pin('edge.origin.beautiful.livingRock', Array.isArray(fx.addCargo)
    && fx.addCargo.some((c) => c.commodity === 'livingRock' && c.units === 2));
  pin('edge.origin.beautiful.noHullKindFx', !Object.prototype.hasOwnProperty.call(fx, 'hullKind')
    && !Object.prototype.hasOwnProperty.call(fx, 'classKey')
    && !Object.prototype.hasOwnProperty.call(fx, 'faction'));
}

console.log(JSON.stringify(results, null, 2));
if (fails.length) {
  console.log('WAVE72 PR2 EDGE FAIL', fails.join('; '));
  process.exit(1);
}
console.log('PASS');
console.log(JSON.stringify({ allTrue: true, nPins: Object.keys(results).length }));
