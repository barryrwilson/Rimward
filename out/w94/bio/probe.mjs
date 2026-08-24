// Headless Wave 94 STOCK + TRAIN + SEED probe.
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

register(new URL('./css-register.mjs', import.meta.url));

const { createShipState, SHIP_CLASSES, COMMODITIES } = await import('../../../src/game/state.js');
const {
  HANGAR_CAP,
  nextTrainClass,
  registerPlayerRemount,
  trainMounted,
  grantLivingSeedRow,
} = await import('../../../src/game/hangar.js');
const {
  LIVING_STOCK,
  hullKindFor,
  livingTrainDest,
  livingTrainDests,
  listYardOffers,
  minRepFor,
  purchaseYardHull,
  trainListPrice,
  yardPrice,
  yardStockFor,
  YARD_LIST_UU,
} = await import('../../../src/game/shipyard.js');
const {
  cancelTrainPending,
  handleShipyardDigit,
  setShipyardPane,
  SHIPYARD_PANE_BUY,
  SHIPYARD_PANE_HANGAR,
} = await import('../../../src/systems/shipyard-desk.js');
const {
  GIFT_HULL_ID,
  GIFT_FULL_LINE,
  grantMarketSeed,
  isMarketSeedVisible,
  MARKET_SEED_STEM,
  SEED_MARKET_UU,
  seedNoticeFor,
  SEED_OK_LINE,
} = await import('../../../src/game/bio-seed.js');

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(here, '../../..', rel), 'utf8');

const fails = [];
function ok(name, cond) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'ok' : 'FAIL'} ${name}`);
}

const WANT_STOCK = ['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate'];

function eqList(got, want) {
  return Array.isArray(got) && got.length === want.length && want.every((k, i) => got[i] === k);
}

function shipCfg() {
  return {
    maxSpeed: 120,
    creep: 30,
    acceleration: 90,
    damping: 0.5,
    afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 },
  };
}

function ctxOf(extra = {}) {
  const classKey = extra.classKey ?? 'light';
  const player = extra.player ?? createShipState(classKey, {
    name: 'Probe',
    faction: extra.playerFaction ?? 'independent',
  });
  player.hullKind = extra.hullKind ?? 'living';
  player.classKey = classKey;
  if (extra.playerFaction) player.faction = extra.playerFaction;
  const hulls = extra.hulls ?? [{
    id: 'hull_starter',
    hullKind: extra.hullKind ?? 'living',
    classKey,
    faction: extra.rowFaction ?? 'independent',
    name: 'She',
    cargoCapacity: extra.cargoCapacity ?? 30,
    cargo: extra.cargo ?? [{ commodity: 'rawOre', units: 4 }],
    grafted: extra.grafted,
  }];
  return {
    flags: {
      docked: extra.docked !== false,
      combat: extra.combat === true,
      paused: extra.paused === true,
    },
    gate: { jumping: extra.jumping === true },
    world: {
      currentSystem: extra.systemId ?? 'probe',
      credits: extra.credits ?? 120000,
      reputation: extra.reputation ?? { beautiful: extra.rep ?? 50 },
      hangar: extra.hangar ?? { mountedId: hulls[0].id, hulls },
    },
    systems: { [extra.systemId ?? 'probe']: { faction: extra.faction ?? 'beautiful' } },
    cargo: extra.liveCargo ?? [{ commodity: 'rawOre', units: 4 }],
    cargoCapacity: extra.cargoCapacity ?? 30,
    player,
    bio: { growth: extra.growth ?? 1, bond: 1, fedCount: 8 },
    config: { ship: extra.shipCfg ?? shipCfg() },
    remounts: { n: 0 },
    emit() {},
  };
}

function fill(n, classKey = 'light') {
  return Array.from({ length: n }, (_, i) => ({
    id: i === 0 ? 'hull_starter' : `hull_fill_${i}`,
    hullKind: 'living',
    classKey,
    faction: 'independent',
    name: 'Fill',
  }));
}

ok('stock.const', eqList(LIVING_STOCK, WANT_STOCK));
ok('stock.beautiful', eqList(yardStockFor('beautiful'), WANT_STOCK));
ok('stock.unk', eqList(yardStockFor('unknowables'), WANT_STOCK));
ok('kind.living', hullKindFor('beautiful') === 'living' && hullKindFor('unknowables') === 'living');
ok('price.table', YARD_LIST_UU.freighter === 24000 && YARD_LIST_UU.ace === 28000
  && YARD_LIST_UU.frigate === 80000);
ok('minRep.table', minRepFor('freighter') === 0 && minRepFor('ace') === 10
  && minRepFor('frigate') === 25);
ok('offers.beautiful', eqList(listYardOffers(ctxOf()).map((o) => o.classKey), WANT_STOCK)
  && listYardOffers(ctxOf()).every((o) => o.hullKind === 'living'));
ok('offers.unk', eqList(listYardOffers(ctxOf({ faction: 'unknowables' })).map((o) => o.classKey), WANT_STOCK));

const buyFrig = ctxOf({ credits: 200000, rep: 25 });
const mountedBuy = buyFrig.world.hangar.mountedId;
const buyRes = purchaseYardHull(buyFrig, 'frigate');
ok('buy.frigate', buyRes.ok === true && buyRes.row?.classKey === 'frigate'
  && buyRes.row?.hullKind === 'living' && buyRes.row?.faction === 'beautiful');
ok('buy.noremount', buyFrig.world.hangar.mountedId === mountedBuy && buyFrig.player.classKey === 'light');
ok('buy.ace.rank', purchaseYardHull(ctxOf({ credits: 200000, rep: 0 }), 'ace').reason === 'reputation');
ok('buy.hostile', purchaseYardHull(ctxOf({ credits: 200000, rep: -1 }), 'light').reason === 'reputation');

const destsLight = livingTrainDests('light');
ok('dests.light', eqList(destsLight, ['cutter', 'heavy', 'freighter', 'ace', 'frigate']));
ok('dests.same', !livingTrainDests('heavy').includes('heavy') && livingTrainDests('heavy').length === 5);
ok('dests.proto', livingTrainDests('__proto__').length === 0 && livingTrainDests('constructor').length === 0);
ok('dest.single', livingTrainDest('light') === destsLight[0] && nextTrainClass('light') === destsLight[0]);
ok('price.dest', trainListPrice(50, 'ace') === yardPrice('ace', 50)
  && trainListPrice(0, 'heavy') === 20000);
ok('price.missing', trainListPrice(50) == null && trainListPrice(50, '__proto__') == null);

registerPlayerRemount((c) => { c.remounts.n += 1; });

const train = ctxOf({ classKey: 'light', credits: 120000, rep: 50 });
const trainMountedId = train.world.hangar.mountedId;
const trainRep = train.world.reputation.beautiful;
const acePrice = trainListPrice(50, 'ace');
const trainRes = trainMounted(train, 'ace');
ok('train.ok', trainRes.ok === true && trainRes.dest === 'ace' && trainRes.price === acePrice);
ok('train.class', train.player.classKey === 'ace' && train.world.hangar.hulls[0].classKey === 'ace');
ok('train.kind', train.player.hullKind === 'living' && train.world.hangar.hulls[0].hullKind === 'living');
ok('train.mounted', train.world.hangar.mountedId === trainMountedId);
ok('train.cargo', train.cargo.some((c) => c.commodity === 'rawOre' && c.units === 4));
ok('train.envelope', train.config.ship.maxSpeed === SHIP_CLASSES.ace.cruise
  && train.config.ship.afterburner.multiplier === SHIP_CLASSES.ace.burn / SHIP_CLASSES.ace.cruise);
ok('train.debit', train.world.credits === 120000 - acePrice);
ok('train.stand', train.world.reputation.beautiful === trainRep);
ok('train.same', trainMounted(ctxOf(), 'light').reason === 'class');
ok('train.minrep', trainMounted(ctxOf({ rep: 0 }), 'frigate').reason === 'reputation');
ok('train.hostile', trainMounted(ctxOf({ rep: -1 }), 'cutter').reason === 'reputation');
ok('train.short', trainMounted(ctxOf({ credits: 2 }), 'cutter').reason === 'credits');
ok('train.unk', trainMounted(ctxOf({ rowFaction: 'unknowables' }), 'heavy').reason === 'faction');
ok('train.graft', trainMounted(ctxOf({ hullKind: 'built', grafted: true }), 'heavy').reason === 'living');
ok('train.nodest', trainMounted(ctxOf()).reason === 'class');
ok('train.full', trainMounted(ctxOf({ hulls: fill(HANGAR_CAP) }), 'cutter').ok === true);

ok('seed.price', SEED_MARKET_UU === 40000 && MARKET_SEED_STEM === 'seed_market');
ok('seed.notCommodity', !Object.prototype.hasOwnProperty.call(COMMODITIES, 'seed')
  && !Object.prototype.hasOwnProperty.call(COMMODITIES, 'seed_market'));

const seed = ctxOf({ credits: 90000, rep: 0 });
const seedMounted = seed.world.hangar.mountedId;
const seedKind = seed.player.hullKind;
const seedRes = grantMarketSeed(seed);
const seedRow = seed.world.hangar.hulls.find((h) => String(h.id).startsWith('hull_seed_market_'));
ok('seed.ok', seedRes.ok === true && seedNoticeFor(seedRes) === SEED_OK_LINE);
ok('seed.row', seedRow?.hullKind === 'living' && seedRow?.classKey === 'light'
  && seedRow?.faction === 'beautiful' && seedRow.id !== GIFT_HULL_ID);
ok('seed.id', typeof seedRow?.id === 'string' && seedRow.id.indexOf('hull_seed_market_') === 0);
ok('seed.noremount', seed.world.hangar.mountedId === seedMounted && seed.player.hullKind === seedKind);
ok('seed.debit', seed.world.credits === 90000 - SEED_MARKET_UU);
ok('seed.repeat', grantMarketSeed(seed).ok === true
  && seed.world.hangar.hulls.filter((h) => String(h.id).startsWith('hull_seed_market_')).length === 2);
ok('seed.hostile', grantMarketSeed(ctxOf({ rep: -1, credits: 90000 })).reason === 'reputation'
  && seedNoticeFor({ reason: 'reputation' }) === 'No sale.');
ok('seed.credits', grantMarketSeed(ctxOf({ credits: 10, rep: 0 })).reason === 'credits'
  && seedNoticeFor({ reason: 'credits' }) === 'Not enough credits.');
ok('seed.visible', isMarketSeedVisible(ctxOf({ rep: 0 })) === true
  && isMarketSeedVisible(ctxOf({ rep: -1 })) === false
  && isMarketSeedVisible(ctxOf({ faction: 'freehold', rep: 50 })) === false);
ok('seed.banner', grantMarketSeed(ctxOf({ faction: 'freehold', credits: 90000 })).reason === 'denied');
const seedFull = ctxOf({ hulls: fill(HANGAR_CAP), credits: 90000, rep: 0 });
ok('seed.full', grantMarketSeed(seedFull).reason === 'full'
  && seedNoticeFor({ reason: 'full' }) === GIFT_FULL_LINE
  && seedFull.world.hangar.hulls.length === HANGAR_CAP
  && seedFull.world.credits === 90000);
ok('seed.giftIntact', typeof grantLivingSeedRow === 'function');

const ui = {
  shipyardPane: SHIPYARD_PANE_HANGAR,
  trainPending: { fromClass: 'light', destClass: 'ace', mountedId: 'hull_starter' },
  notice: '',
};
ok('digit.swallow', handleShipyardDigit(3, train, ui) === true && ui.trainPending != null);
setShipyardPane(ui, SHIPYARD_PANE_BUY);
ok('pane.clear', ui.trainPending == null);
ui.trainPending = { fromClass: 'light', destClass: 'ace', mountedId: 'hull_starter' };
ok('cancel', cancelTrainPending(ui) === true && ui.trainPending == null);

const hangarSrc = src('src/game/hangar.js');
const deskSrc = src('src/systems/shipyard-desk.js');
const stationSrc = src('src/systems/station.js');
const shipyardSrc = src('src/game/shipyard.js');
const bioSrc = src('src/game/bio-seed.js');
ok('src.stock', shipyardSrc.includes("['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']"));
ok('src.dests', shipyardSrc.includes('export function livingTrainDests')
  && deskSrc.includes('livingTrainDests(row.classKey)')
  && deskSrc.includes('trainMounted(ctx, dest)')
  && hangarSrc.includes('export function trainMounted(ctx, destClass)'));
ok('src.noHardHeavy', !deskSrc.includes("dest !== 'heavy'") && !deskSrc.includes("dest === 'heavy'"));
ok('src.seedConst', bioSrc.includes('SEED_MARKET_UU = 40000') && bioSrc.includes("MARKET_SEED_STEM = 'seed_market'"));
ok('src.seedMarket', stationSrc.includes('renderSeedPapers') && stationSrc.includes('grantMarketSeed')
  && stationSrc.includes('seedPending') && stationSrc.includes('Confirm papers'));
ok('src.giftPeople', stationSrc.includes('renderGiftPapers') && stationSrc.includes('grantSwornGift'));
ok('src.noInner', !/innerHTML/.test(hangarSrc) && !/innerHTML/.test(deskSrc)
  && !/innerHTML/.test(bioSrc) && stationSrc.includes('node.textContent = text'));
ok('src.digit0', stationSrc.includes('DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1]'));
ok('src.envelope', hangarSrc.includes('cls.burn / cls.cruise') && hangarSrc.includes('applyFlightEnvelope(ctx, dest)'));
ok('src.noSwitch', /export function trainMounted[\s\S]*?export function grantLivingSeedRow/.test(hangarSrc)
  && !/switchTo\(/.test(hangarSrc.slice(
    hangarSrc.indexOf('export function trainMounted'),
    hangarSrc.indexOf('export function grantLivingSeedRow'),
  )));

if (fails.length) {
  console.log('PROBE FAIL', fails.join(','));
  process.exit(1);
}
console.log('PROBE PASS');
