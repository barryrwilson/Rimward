// Wave 72 PR2 — BIO obtain pins (contract §12 PR2 / §3.2 / §8 / §3.3 gift defer).
// node --import ./scripts/with-css-stub.mjs out/w72/pr2/probe.mjs
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShipState } from '../../../src/game/state.js';
import {
  HANGAR_CAP,
  sanitizeHangar,
} from '../../../src/game/hangar.js';
import {
  hullKindFor,
  listYardOffers,
  purchaseYardHull,
  yardStockFor,
} from '../../../src/game/shipyard.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const results = {};
const fails = [];

function pin(name, cond, extra = '') {
  results[name] = !!cond;
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
}

function eqList(got, want) {
  return Array.isArray(got) && got.length === want.length && want.every((k, i) => got[i] === k);
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
      credits: extra.credits ?? 100000,
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

function fullHangar() {
  const hulls = [];
  for (let i = 1; i <= HANGAR_CAP; i++) {
    hulls.push({
      id: `hull_full_${i}`,
      hullKind: 'living',
      classKey: 'light',
      faction: 'independent',
      name: 'full',
      scanner: 0,
      miningLaser: 0,
      concealedMounts: false,
      cargoCapacity: 20,
      cargo: [],
    });
  }
  return { mountedId: 'hull_full_1', hulls };
}

function srcText(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const BEAUTIFUL = ['light', 'cutter', 'heavy'];
const UNKNOWABLES = ['light'];

const beauStock = yardStockFor('beautiful');
pin('1.beautiful.stock.exact', eqList(beauStock, BEAUTIFUL), Array.isArray(beauStock) ? beauStock.join(',') : String(beauStock));
pin('1.beautiful.stock.noFrigate', !beauStock.includes('frigate'));
pin('1.beautiful.stock.noAce', !beauStock.includes('ace'));
pin('1.beautiful.stock.noFreighter', !beauStock.includes('freighter'));

const beauOffers = listYardOffers(mockDock('beautiful'));
const beauKeys = beauOffers.map((o) => o.classKey);
pin('1.beautiful.offers.exact', eqList(beauKeys, BEAUTIFUL), beauKeys.join(','));
pin('1.beautiful.offers.noFrigate', !beauKeys.includes('frigate'));
pin('1.beautiful.offers.len', beauOffers.length === 3);

const unkStock = yardStockFor('unknowables');
pin('2.unknowables.stock.exact', eqList(unkStock, UNKNOWABLES), Array.isArray(unkStock) ? unkStock.join(',') : String(unkStock));
pin('2.unknowables.stock.noFrigate', !unkStock.includes('frigate'));
pin('2.unknowables.stock.noCutter', !unkStock.includes('cutter'));
pin('2.unknowables.stock.noHeavy', !unkStock.includes('heavy'));

const unkOffers = listYardOffers(mockDock('unknowables'));
const unkKeys = unkOffers.map((o) => o.classKey);
pin('2.unknowables.offers.exact', eqList(unkKeys, UNKNOWABLES), unkKeys.join(','));
pin('2.unknowables.offers.noFrigate', !unkKeys.includes('frigate'));
pin('2.unknowables.offers.len', unkOffers.length === 1);

pin('3.kind.beautiful.living', hullKindFor('beautiful') === 'living');
pin('3.kind.unknowables.living', hullKindFor('unknowables') === 'living');
pin('3.kind.freehold.built', hullKindFor('freehold') === 'built');
pin('3.kind.veridian.built', hullKindFor('veridian') === 'built');
pin('3.kind.gilded.built', hullKindFor('gilded') === 'built');

pin('4.beautiful.offers.allLiving', beauOffers.length > 0 && beauOffers.every((o) => o.hullKind === 'living'));
pin('4.unknowables.offers.allLiving', unkOffers.length > 0 && unkOffers.every((o) => o.hullKind === 'living'));
pin('4.freehold.offers.built', listYardOffers(mockDock('freehold')).every((o) => o.hullKind === 'built'));

{
  const ctx = mockDock('beautiful', { credits: 100000, rep: 0 });
  sanitizeHangar(ctx);
  const mountedBefore = ctx.world.hangar.mountedId;
  const lenBefore = ctx.world.hangar.hulls.length;
  const starterBefore = ctx.world.hangar.hulls.find((h) => h.id === mountedBefore);
  const playerKindBefore = ctx.player.hullKind;
  const playerClassBefore = ctx.player.classKey;
  const bought = purchaseYardHull(ctx, 'light');
  const starterAfter = ctx.world.hangar.hulls.find((h) => h.id === mountedBefore);
  const newRows = ctx.world.hangar.hulls.filter((h) => h.id !== mountedBefore);
  pin('5.beautiful.buy.ok', bought.ok === true, JSON.stringify(bought));
  pin('5.beautiful.buy.reasonAbsent', bought.reason === undefined);
  pin('5.beautiful.hangar.plusOne', ctx.world.hangar.hulls.length === lenBefore + 1);
  pin('5.beautiful.row.new', newRows.length === 1);
  pin('5.beautiful.row.living', newRows[0]?.hullKind === 'living');
  pin('5.beautiful.row.class', newRows[0]?.classKey === 'light');
  pin('5.beautiful.row.faction', newRows[0]?.faction === 'beautiful');
  pin('5.beautiful.row.idNew', typeof newRows[0]?.id === 'string' && newRows[0].id !== mountedBefore);
  pin('5.beautiful.mounted.starter', ctx.world.hangar.mountedId === mountedBefore && mountedBefore === 'hull_starter');
  pin('5.beautiful.starter.living', starterAfter?.hullKind === 'living' && starterBefore?.hullKind === 'living');
  pin('5.beautiful.player.living', ctx.player.hullKind === 'living' && playerKindBefore === 'living');
  pin('5.beautiful.player.classSame', ctx.player.classKey === playerClassBefore);
  pin('5.beautiful.noRemount', ctx.world.hangar.mountedId === mountedBefore
    && ctx.player.hullKind === playerKindBefore
    && ctx.player.classKey === playerClassBefore);
}

{
  const ctx = mockDock('unknowables', { credits: 100000, rep: 0 });
  sanitizeHangar(ctx);
  const mountedBefore = ctx.world.hangar.mountedId;
  const lenBefore = ctx.world.hangar.hulls.length;
  const playerKindBefore = ctx.player.hullKind;
  const bought = purchaseYardHull(ctx, 'light');
  const newRow = ctx.world.hangar.hulls.find((h) => h.id !== mountedBefore);
  pin('6.unknowables.buy.ok', bought.ok === true, JSON.stringify(bought));
  pin('6.unknowables.hangar.plusOne', ctx.world.hangar.hulls.length === lenBefore + 1);
  pin('6.unknowables.row.living', newRow?.hullKind === 'living' && bought.row?.hullKind === 'living');
  pin('6.unknowables.row.forceLiving', newRow?.hullKind === 'living' && newRow?.faction === 'unknowables');
  pin('6.unknowables.row.class', newRow?.classKey === 'light');
  pin('6.unknowables.noRemount', ctx.world.hangar.mountedId === mountedBefore && ctx.player.hullKind === playerKindBefore);
}

{
  const ctx = mockDock('beautiful', { credits: 100000, rep: 50 });
  sanitizeHangar(ctx);
  const lenBefore = ctx.world.hangar.hulls.length;
  const mountedBefore = ctx.world.hangar.mountedId;
  const creditsBefore = ctx.world.credits;
  const bought = purchaseYardHull(ctx, 'frigate');
  pin('7.beautiful.frigate.okFalse', bought.ok === false, JSON.stringify(bought));
  pin('7.beautiful.frigate.stock', bought.reason === 'stock', String(bought.reason));
  pin('7.beautiful.frigate.hangarSame', ctx.world.hangar.hulls.length === lenBefore);
  pin('7.beautiful.frigate.mountedSame', ctx.world.hangar.mountedId === mountedBefore);
  pin('7.beautiful.frigate.noDebit', ctx.world.credits === creditsBefore);
}

{
  const cutterCtx = mockDock('unknowables', { credits: 100000, rep: 50 });
  sanitizeHangar(cutterCtx);
  const cutterLen = cutterCtx.world.hangar.hulls.length;
  const cutterBuy = purchaseYardHull(cutterCtx, 'cutter');
  pin('8.unknowables.cutter.okFalse', cutterBuy.ok === false, JSON.stringify(cutterBuy));
  pin('8.unknowables.cutter.stock', cutterBuy.reason === 'stock', String(cutterBuy.reason));
  pin('8.unknowables.cutter.hangarSame', cutterCtx.world.hangar.hulls.length === cutterLen);

  const frigCtx = mockDock('unknowables', { credits: 100000, rep: 50 });
  sanitizeHangar(frigCtx);
  const frigLen = frigCtx.world.hangar.hulls.length;
  const frigBuy = purchaseYardHull(frigCtx, 'frigate');
  pin('8.unknowables.frigate.okFalse', frigBuy.ok === false, JSON.stringify(frigBuy));
  pin('8.unknowables.frigate.stock', frigBuy.reason === 'stock', String(frigBuy.reason));
  pin('8.unknowables.frigate.hangarSame', frigCtx.world.hangar.hulls.length === frigLen);
}

{
  const ctx = mockDock('beautiful', { credits: 100000, rep: -1 });
  sanitizeHangar(ctx);
  const lenBefore = ctx.world.hangar.hulls.length;
  const creditsBefore = ctx.world.credits;
  const bought = purchaseYardHull(ctx, 'light');
  pin('9.beautiful.repNeg.okFalse', bought.ok === false, JSON.stringify(bought));
  pin('9.beautiful.repNeg.reputation', bought.reason === 'reputation', String(bought.reason));
  pin('9.beautiful.repNeg.noRow', ctx.world.hangar.hulls.length === lenBefore);
  pin('9.beautiful.repNeg.noDebit', ctx.world.credits === creditsBefore);
}

{
  const hostile = mockDock('beautiful', { credits: 100000, rep: -5 });
  sanitizeHangar(hostile);
  const hostileLen = hostile.world.hangar.hulls.length;
  const hostileBuy = purchaseYardHull(hostile, 'cutter');
  pin('10.hostile.okFalse', hostileBuy.ok === false, JSON.stringify(hostileBuy));
  pin('10.hostile.reputation', hostileBuy.reason === 'reputation', String(hostileBuy.reason));
  pin('10.hostile.noRow', hostile.world.hangar.hulls.length === hostileLen);

  const broke = mockDock('beautiful', { credits: 100, rep: 0 });
  sanitizeHangar(broke);
  const brokeLen = broke.world.hangar.hulls.length;
  const brokeCredits = broke.world.credits;
  const brokeBuy = purchaseYardHull(broke, 'light');
  pin('10.credits.okFalse', brokeBuy.ok === false, JSON.stringify(brokeBuy));
  pin('10.credits.reason', brokeBuy.reason === 'credits', String(brokeBuy.reason));
  pin('10.credits.noRow', broke.world.hangar.hulls.length === brokeLen);
  pin('10.credits.noDebit', broke.world.credits === brokeCredits);

  const full = mockDock('beautiful', {
    credits: 100000,
    rep: 0,
    hangar: fullHangar(),
  });
  sanitizeHangar(full);
  const fullLen = full.world.hangar.hulls.length;
  const fullCredits = full.world.credits;
  const fullBuy = purchaseYardHull(full, 'light');
  pin('10.full.cap', fullLen === HANGAR_CAP && HANGAR_CAP === 8);
  pin('10.full.okFalse', fullBuy.ok === false, JSON.stringify(fullBuy));
  pin('10.full.reason', fullBuy.reason === 'full', String(fullBuy.reason));
  pin('10.full.noRow', full.world.hangar.hulls.length === fullLen);
  pin('10.full.noDebit', full.world.credits === fullCredits);

  const undocked = mockDock('beautiful', { credits: 100000, rep: 0, flags: { docked: false } });
  sanitizeHangar(undocked);
  const undockedLen = undocked.world.hangar.hulls.length;
  const undockedBuy = purchaseYardHull(undocked, 'light');
  pin('10.dock.okFalse', undockedBuy.ok === false, JSON.stringify(undockedBuy));
  pin('10.dock.reason', undockedBuy.reason === 'dock', String(undockedBuy.reason));
  pin('10.dock.noRow', undocked.world.hangar.hulls.length === undockedLen);
}

{
  // This worker writes out/w72/pr2 only. Parallel PR1 persist may dirty hangar.js.
  function srcPaths(text) {
    const out = [];
    for (const raw of String(text).split(/\r?\n/)) {
      const norm = raw.replace(/\\/g, '/');
      const i = norm.indexOf('src/');
      if (i < 0) continue;
      const path = norm.slice(i).split(' -> ').pop().replace(/^"/, '').replace(/"$/, '').trim();
      if (path) out.push(path);
    }
    return out;
  }
  const names = srcPaths(execSync('git diff --name-only -- src', { encoding: 'utf8', cwd: root }));
  const cached = srcPaths(execSync('git diff --cached --name-only -- src', { encoding: 'utf8', cwd: root }));
  const porcelain = srcPaths(execSync('git status --porcelain -- src', { encoding: 'utf8', cwd: root }));
  const dirty = [...new Set([...names, ...cached, ...porcelain])];
  const other = dirty.filter((n) => n !== 'src/game/hangar.js');
  pin('11.src.shipyardClean', !dirty.includes('src/game/shipyard.js'), dirty.join(','));
  pin('11.src.originsClean', !dirty.includes('src/game/origins.js'), dirty.join(','));
  pin('11.src.worker.noOtherSrc', other.length === 0, other.join(','));
  pin('11.src.siblingHangarOrClean', other.length === 0, dirty.join(','));
}

{
  const shipyard = srcText('src/game/shipyard.js');
  const hangar = srcText('src/game/hangar.js');
  const origins = srcText('src/game/origins.js');
  pin('12.gift.shipyard.absent', !shipyard.includes('hull_seed_gift'));
  pin('12.gift.hangar.absent', !hangar.includes('hull_seed_gift'));
  pin('12.gift.origins.absent', !origins.includes('hull_seed_gift'));
}

{
  const mut = yardStockFor('beautiful');
  mut.push('frigate');
  pin('stock.slice.noMutateCatalog', eqList(yardStockFor('beautiful'), BEAUTIFUL));
}

{
  const cutter = mockDock('beautiful', { credits: 100000, rep: 0 });
  const cutterBuy = purchaseYardHull(cutter, 'cutter');
  const cutterRow = cutter.world.hangar.hulls.find((h) => h.id !== 'hull_starter');
  pin('extra.beautiful.cutter.ok', cutterBuy.ok === true, JSON.stringify(cutterBuy));
  pin('extra.beautiful.cutter.living', cutterRow?.hullKind === 'living' && cutterRow?.classKey === 'cutter');
  pin('extra.beautiful.cutter.noRemount', cutter.world.hangar.mountedId === 'hull_starter');

  const heavy = mockDock('beautiful', { credits: 100000, rep: 0 });
  const heavyBuy = purchaseYardHull(heavy, 'heavy');
  const heavyRow = heavy.world.hangar.hulls.find((h) => h.id !== 'hull_starter');
  pin('extra.beautiful.heavy.ok', heavyBuy.ok === true, JSON.stringify(heavyBuy));
  pin('extra.beautiful.heavy.living', heavyRow?.hullKind === 'living' && heavyRow?.classKey === 'heavy');
  pin('extra.beautiful.heavy.noRemount', heavy.world.hangar.mountedId === 'hull_starter');
}

console.log(JSON.stringify(results, null, 2));
if (fails.length) {
  console.log('WAVE72 PR2 OBTAIN FAIL', fails.join('; '));
  process.exit(1);
}
console.log('PASS');
console.log(JSON.stringify({ allTrue: true, nPins: Object.keys(results).length }));
