// Headless BIO-02 class-ladder train probe (Wave 92).
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

register(new URL('./css-register.mjs', import.meta.url));

const { createShipState, SHIP_CLASSES } = await import('../../../src/game/state.js');
const {
  grantLivingSeedRow,
  HANGAR_CAP,
  nextTrainClass,
  registerPlayerRemount,
  trainMounted,
} = await import('../../../src/game/hangar.js');
const { livingTrainDest, trainListPrice, yardPrice } = await import('../../../src/game/shipyard.js');
const {
  cancelTrainPending,
  handleShipyardDigit,
  setShipyardPane,
  SHIPYARD_PANE_BUY,
  SHIPYARD_PANE_HANGAR,
} = await import('../../../src/systems/shipyard-desk.js');
const { WORLD_FIELDS } = await import('../../../src/game/save.js');

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(here, '../../..', rel), 'utf8');

const fails = [];
function ok(name, cond) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'ok' : 'FAIL'} ${name}`);
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
  const player = extra.player ?? createShipState(classKey, { name: 'Probe', faction: extra.playerFaction ?? 'independent' });
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
  const remounts = { n: 0 };
  return {
    flags: {
      docked: extra.docked !== false,
      combat: extra.combat === true,
      paused: extra.paused === true,
    },
    gate: { jumping: extra.jumping === true },
    world: {
      currentSystem: 'probe',
      credits: extra.credits ?? 50000,
      reputation: extra.reputation ?? { beautiful: extra.rep ?? 50 },
      hangar: extra.hangar ?? { mountedId: hulls[0].id, hulls },
    },
    systems: { probe: { faction: extra.faction ?? 'beautiful' } },
    cargo: extra.liveCargo ?? [{ commodity: 'rawOre', units: 4 }],
    cargoCapacity: extra.cargoCapacity ?? 30,
    player,
    bio: { growth: extra.growth ?? 1, bond: 1, fedCount: 8 },
    config: { ship: extra.shipCfg ?? shipCfg() },
    remounts,
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

ok('dest.light', nextTrainClass('light') === 'heavy' && livingTrainDest('light') === 'heavy');
ok('dest.cutter', nextTrainClass('cutter') === 'heavy');
ok('dest.heavy', nextTrainClass('heavy') == null);
ok('dest.frigate', nextTrainClass('frigate') == null && livingTrainDest('ace') == null);
ok('dest.proto', nextTrainClass('__proto__') == null && livingTrainDest('constructor') == null);
ok('price.reuse', trainListPrice(50) === yardPrice('heavy', 50) && trainListPrice(50) === 17000);
ok('price.zero', trainListPrice(0) === yardPrice('heavy', 0) && trainListPrice(0) === 20000);

registerPlayerRemount((c) => { c.remounts.n += 1; });

const happy = ctxOf();
const mounted = happy.world.hangar.mountedId;
const growth = happy.bio.growth;
const rep = happy.world.reputation.beautiful;
const price = trainListPrice(50);
const res = trainMounted(happy);
const row = happy.world.hangar.hulls.find((h) => h.id === mounted);
ok('train.ok', res.ok === true && res.dest === 'heavy' && res.price === price);
ok('train.class', row?.classKey === 'heavy' && happy.player.classKey === 'heavy');
ok('train.kind', row?.hullKind === 'living' && happy.player.hullKind === 'living');
ok('train.mounted', happy.world.hangar.mountedId === mounted);
ok('train.cargo', Array.isArray(happy.cargo) && happy.cargo.some((c) => c.commodity === 'rawOre' && c.units === 4));
ok('train.hold', row?.cargo?.some((c) => c.commodity === 'rawOre' && c.units === 4));
ok('train.envelope', happy.config.ship.maxSpeed === SHIP_CLASSES.heavy.cruise
  && happy.config.ship.afterburner.multiplier === SHIP_CLASSES.heavy.burn / SHIP_CLASSES.heavy.cruise);
ok('train.debit', happy.world.credits === 50000 - price);
ok('train.stand', happy.world.reputation.beautiful === rep);
ok('train.bio', happy.bio.growth === growth);
ok('train.remount', happy.remounts.n === 1);

const growthOnly = ctxOf({ growth: 1 });
ok('growth.noTrain', growthOnly.player.classKey === 'light' && growthOnly.bio.growth === 1
  && growthOnly.world.hangar.hulls[0].classKey === 'light');

const cutter = ctxOf({ classKey: 'cutter', cargoCapacity: 32 });
ok('train.cutter', trainMounted(cutter).ok === true && cutter.player.classKey === 'heavy');

const host = ctxOf({ rep: -1, credits: 50000 });
const hostCredits = host.world.credits;
ok('hostile', trainMounted(host).reason === 'reputation'
  && host.player.classKey === 'light' && host.world.credits === hostCredits);

const short = ctxOf({ credits: 3 });
ok('credits', trainMounted(short).reason === 'credits'
  && short.player.classKey === 'light' && short.world.credits === 3);

const unk = ctxOf({ rowFaction: 'unknowables' });
ok('unk.row', trainMounted(unk).reason === 'faction' && unk.player.classKey === 'light');

const unkP = ctxOf({ playerFaction: 'unknowables' });
unkP.player.faction = 'unknowables';
ok('unk.player', trainMounted(unkP).reason === 'faction');

const graft = ctxOf({ hullKind: 'built', grafted: true, classKey: 'light' });
ok('graft.built', trainMounted(graft).reason === 'living' && graft.player.classKey === 'light');

const frig = ctxOf({ classKey: 'frigate' });
ok('frigate', trainMounted(frig).reason === 'class' && frig.player.classKey === 'frigate');

const free = ctxOf({ faction: 'freehold' });
ok('banner', trainMounted(free).reason === 'banner' && free.player.classKey === 'light');

const full = ctxOf({ hulls: fill(HANGAR_CAP) });
const fullRes = trainMounted(full);
ok('full.inPlace', fullRes.ok === true && full.world.hangar.hulls.length === HANGAR_CAP
  && full.player.classKey === 'heavy' && full.world.hangar.mountedId === 'hull_starter');

const combat = ctxOf({ combat: true });
ok('combat', trainMounted(combat).reason === 'combat' && combat.world.credits === 50000);

ok('gift.intact', typeof grantLivingSeedRow === 'function');

const ui = { shipyardPane: SHIPYARD_PANE_HANGAR, trainPending: { fromClass: 'light', destClass: 'heavy', mountedId: 'hull_starter' }, notice: '' };
ok('digit.swallow', handleShipyardDigit(3, happy, ui) === true && ui.trainPending != null);
setShipyardPane(ui, SHIPYARD_PANE_BUY);
ok('pane.clear', ui.trainPending == null);
ui.trainPending = { fromClass: 'light', destClass: 'heavy', mountedId: 'hull_starter' };
ok('cancel', cancelTrainPending(ui) === true && ui.trainPending == null);

const hangarSrc = src('src/game/hangar.js');
const deskSrc = src('src/systems/shipyard-desk.js');
const stationSrc = src('src/systems/station.js');
const shipyardSrc = src('src/game/shipyard.js');
const bioSrc = src('src/game/bio.js');
ok('src.noInner', !/innerHTML/.test(hangarSrc) && !/innerHTML/.test(deskSrc) && stationSrc.includes('node.textContent = text'));
ok('src.noNewField', !WORLD_FIELDS.includes('train') && !WORLD_FIELDS.includes('trainPending') && WORLD_FIELDS.includes('hangar'));
ok('src.growth', !/classKey/.test(bioSrc));
ok('src.gift', hangarSrc.includes('export function grantLivingSeedRow') && stationSrc.includes('giftPending'));
ok('src.noFrigateSku', shipyardSrc.includes("const LIVING_STOCK = Object.freeze(['light', 'cutter', 'heavy'])"));
ok('src.envelope', hangarSrc.includes('cls.burn / cls.cruise') && hangarSrc.includes("applyFlightEnvelope(ctx, dest)"));
ok('src.noSwitch', /export function trainMounted[\s\S]*?export function grantLivingSeedRow/.test(hangarSrc)
  && !/switchTo\(/.test(hangarSrc.slice(hangarSrc.indexOf('export function trainMounted'), hangarSrc.indexOf('export function grantLivingSeedRow'))));

if (fails.length) {
  console.log('PROBE FAIL', fails.join(','));
  process.exit(1);
}
console.log('PROBE PASS');
