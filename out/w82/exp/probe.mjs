// Wave 82 EXP economy: drop, Archive UU, fixer launder.
// node --import ./scripts/with-css-stub.mjs out/w82/exp/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import {
  DATA_DROP_RATE,
  ARCHIVE_OWN_UU,
  ARCHIVE_RIVAL_UU,
  LAUNDER_UU,
  DATA_CUBE,
  DATA_CRYSTAL,
  hasDataDropRate,
  spawnDataPod,
  maybeSpawnDataFromWreck,
  sanitizeDataCargoRow,
  archiveFilePrice,
  addDataCargoRow,
  removeDataCargoUnits,
  launderDataLot,
  cargoValueSafe,
} from '../../../src/game/data-trade.js';
import {
  confirmArchivePending,
  confirmLaunderPending,
  cancelDataPending,
  cancelLaunderPending,
  archiveDeskAllowed,
  priceOf,
} from '../../../src/systems/station.js';

const results = {};
const fails = [];
function pin(name, cond, extra = '') {
  results[name] = !!cond;
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const tradeSrc = readFileSync(join(root, 'src/game/data-trade.js'), 'utf8');
const stationSrc = readFileSync(join(root, 'src/systems/station.js'), 'utf8');

pin('drop.rate', DATA_DROP_RATE === 0.20 && hasDataDropRate() === true);
pin('uu.own', ARCHIVE_OWN_UU === 400);
pin('uu.rival', ARCHIVE_RIVAL_UU === 900);
pin('uu.launder', LAUNDER_UU === 250);

pin('price.buyCube', archiveFilePrice('buy', DATA_CUBE, 'legal', 'assembly') === 400);
pin('price.sellCube', archiveFilePrice('sell', DATA_CUBE, 'legal', 'assembly') === 400);
pin('price.sellCrystalLegal', archiveFilePrice('sell', DATA_CRYSTAL, 'legal', 'unknowables') === 900);
pin('price.sellCrystalCaptured', archiveFilePrice('sell', DATA_CRYSTAL, 'captured', 'unknowables') === 900);
pin('price.refuseCapturedCube', archiveFilePrice('sell', DATA_CUBE, 'captured', 'assembly') == null);
pin('price.refuseBuyCrystal', archiveFilePrice('buy', DATA_CRYSTAL, 'legal', 'unknowables') == null);

const stuffed = { world: { prices: { dataCube: 9999, dataCrystal: 8888 } } };
pin('priceOf.data0', priceOf(stuffed, 'dataCube') === 0 && priceOf(stuffed, 'dataCrystal') === 0);
pin('value.safe', cargoValueSafe([
  { commodity: 'dataCube', units: 3, source: 'legal', originFaction: 'assembly' },
  { commodity: 'provisions', units: 2 },
], { dataCube: 99999, provisions: 100 }) === 200);

pin('sanitize.proto', sanitizeDataCargoRow({
  commodity: 'dataCube', units: 1, source: 'legal', originFaction: '__proto__',
}) === null);
pin('sanitize.missingSource', sanitizeDataCargoRow({
  commodity: 'dataCube', units: 1, originFaction: 'assembly',
}) === null);

{
  const hold = [];
  pin('add.legal', addDataCargoRow(hold, {
    commodity: DATA_CUBE, units: 1, source: 'legal', originFaction: 'assembly',
  }) === true && hold.length === 1 && hold[0].units === 1);
  pin('remove.unit', removeDataCargoUnits(hold, {
    commodity: DATA_CUBE, source: 'legal', originFaction: 'assembly',
  }, 1) === true && hold.length === 0);
}

{
  const hold = [{
    commodity: DATA_CUBE, units: 2, source: 'captured', originFaction: 'assembly',
  }];
  pin('launder.flip', launderDataLot(hold, {
    commodity: DATA_CUBE, source: 'captured', originFaction: 'assembly',
  }) === true && hold[0].source === 'legal' && hold[0].units === 2);
}

function podCtx() {
  const scene = new THREE.Scene();
  return {
    scene,
    pods: [],
    world: { time: 0 },
    emit() {},
  };
}

function liveOf(faction, extra = {}) {
  return {
    record: extra.record ?? { faction },
    state: extra.state ?? { faction },
    object: { position: { x: 1, y: 2, z: 3 } },
  };
}

pin('spawn.missingFaction', spawnDataPod(podCtx(), liveOf(null, { record: {}, state: {} })) === null);
pin('spawn.reserved', spawnDataPod(podCtx(), liveOf('__proto__')) === null);
pin('spawn.pirate', spawnDataPod(podCtx(), liveOf('freehold')) === null);

const asmPod = spawnDataPod(podCtx(), liveOf('assembly'));
pin('spawn.assemblyCube', !!(asmPod && asmPod.contents && asmPod.contents[0]
  && asmPod.contents[0].commodity === DATA_CUBE
  && asmPod.contents[0].source === 'captured'
  && asmPod.contents[0].originFaction === 'assembly'
  && asmPod.contents[0].units === 1));

const unkPod = spawnDataPod(podCtx(), liveOf('unknowables'));
pin('spawn.unknowableCrystal', !!(unkPod && unkPod.contents && unkPod.contents[0]
  && unkPod.contents[0].commodity === DATA_CRYSTAL
  && unkPod.contents[0].source === 'captured'
  && unkPod.contents[0].originFaction === 'unknowables'));

const origRand = Math.random;
Math.random = () => 0.99;
pin('maybe.miss', maybeSpawnDataFromWreck(podCtx(), liveOf('assembly')) === null);
Math.random = () => 0;
const hit = maybeSpawnDataFromWreck(podCtx(), liveOf('assembly'));
pin('maybe.hit', !!(hit && hit.contents && hit.contents[0] && hit.contents[0].commodity === DATA_CUBE));
Math.random = origRand;

pin('desk.assembly', archiveDeskAllowed('assembly') === true);
pin('desk.unknowables', archiveDeskAllowed('unknowables') === false);

function archiveUi(pending) {
  return { dataPending: pending, dataBusy: false, notice: '' };
}

{
  const ctx = {
    cargo: [],
    cargoCapacity: 10,
    world: { credits: 500, reputation: { assembly: 0 } },
  };
  const ui = archiveUi({ verb: 'buy', commodity: DATA_CUBE, source: 'legal', originFaction: 'assembly' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('archive.buy.debit', ctx.world.credits === 100);
  pin('archive.buy.row', ctx.cargo.length === 1
    && ctx.cargo[0].commodity === DATA_CUBE
    && ctx.cargo[0].source === 'legal'
    && ctx.cargo[0].originFaction === 'assembly'
    && ctx.cargo[0].units === 1);
  pin('archive.buy.busyClear', ui.dataBusy === false && ui.dataPending === null);
}

{
  const ctx = {
    cargo: [{ commodity: DATA_CUBE, units: 2, source: 'legal', originFaction: 'assembly' }],
    cargoCapacity: 10,
    world: { credits: 10, reputation: { assembly: 1 } },
  };
  const ui = archiveUi({ verb: 'sell', commodity: DATA_CUBE, source: 'legal', originFaction: 'assembly' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('archive.sell.credit', ctx.world.credits === 410);
  pin('archive.sell.remove', ctx.cargo.length === 1 && ctx.cargo[0].units === 1);
}

{
  const ctx = {
    cargo: [{ commodity: DATA_CRYSTAL, units: 1, source: 'captured', originFaction: 'unknowables' }],
    cargoCapacity: 10,
    world: { credits: 0, reputation: { assembly: 0 } },
  };
  const ui = archiveUi({ verb: 'sell', commodity: DATA_CRYSTAL, source: 'captured', originFaction: 'unknowables' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('archive.rival.credit', ctx.world.credits === 900 && ctx.cargo.length === 0);
}

{
  const ctx = {
    cargo: [{ commodity: DATA_CUBE, units: 2, source: 'captured', originFaction: 'assembly' }],
    cargoCapacity: 10,
    world: { credits: 50, reputation: { assembly: 0 } },
  };
  const ui = archiveUi({ verb: 'sell', commodity: DATA_CUBE, source: 'captured', originFaction: 'assembly' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('archive.illegal.stay', ctx.world.credits === 50 && ctx.cargo[0].units === 2 && ctx.cargo[0].source === 'captured');
}

{
  const ctx = {
    cargo: [],
    cargoCapacity: 10,
    world: { credits: 5000, reputation: { assembly: -1 } },
  };
  const ui = archiveUi({ verb: 'buy', commodity: DATA_CUBE, source: 'legal', originFaction: 'assembly' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('archive.hostile.noSale', ctx.world.credits === 5000 && ctx.cargo.length === 0 && ui.notice === 'No sale.');
}

{
  const ctx = {
    cargo: [{ commodity: 'provisions', units: 10 }],
    cargoCapacity: 10,
    world: { credits: 5000, reputation: { assembly: 0 } },
  };
  const ui = archiveUi({ verb: 'buy', commodity: DATA_CUBE, source: 'legal', originFaction: 'assembly' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('archive.hold.full', ctx.world.credits === 5000 && ctx.cargo.length === 1 && ui.notice === 'Hold is full.');
}

{
  const ctx = {
    cargo: [],
    cargoCapacity: 10,
    world: { credits: 100, reputation: { assembly: 0 } },
  };
  const ui = archiveUi({ verb: 'buy', commodity: DATA_CUBE, source: 'legal', originFaction: 'assembly' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('archive.credits.short', ctx.world.credits === 100 && ctx.cargo.length === 0);
}

{
  const ui = { dataPending: { verb: 'buy', commodity: DATA_CUBE, source: 'legal', originFaction: 'assembly' }, notice: 'x' };
  pin('archive.esc', cancelDataPending(ui) === true && ui.dataPending === null);
}

{
  const ctx = {
    cargo: [{ commodity: DATA_CUBE, units: 3, source: 'captured', originFaction: 'assembly' }],
    world: {
      credits: 300,
      currentSystem: 'veridian',
      contacts: [{ id: 'contact-veridian-fixer', role: 'fixer', system: 'veridian' }],
    },
  };
  const ui = { launderPending: { commodity: DATA_CUBE, source: 'captured', originFaction: 'assembly' }, launderBusy: false, notice: '' };
  confirmLaunderPending(ctx, ui, 'veridian');
  pin('launder.debit', ctx.world.credits === 50);
  pin('launder.legal', ctx.cargo[0].source === 'legal' && ctx.cargo[0].units === 3);
}

{
  const ctx = {
    cargo: [{ commodity: DATA_CUBE, units: 1, source: 'captured', originFaction: 'assembly' }],
    world: {
      credits: 100,
      currentSystem: 'veridian',
      contacts: [{ id: 'contact-veridian-fixer', role: 'fixer', system: 'veridian' }],
    },
  };
  const ui = { launderPending: { commodity: DATA_CUBE, source: 'captured', originFaction: 'assembly' }, launderBusy: false, notice: '' };
  confirmLaunderPending(ctx, ui, 'veridian');
  pin('launder.short', ctx.world.credits === 100 && ctx.cargo[0].source === 'captured');
}

{
  const ctx = {
    cargo: [{ commodity: DATA_CUBE, units: 1, source: 'captured', originFaction: 'assembly' }],
    world: { credits: 400, currentSystem: 'freehold', contacts: [] },
  };
  const ui = { launderPending: { commodity: DATA_CUBE, source: 'captured', originFaction: 'assembly' }, launderBusy: false, notice: '' };
  confirmLaunderPending(ctx, ui, 'freehold');
  pin('launder.noFixer', ctx.world.credits === 400 && ctx.cargo[0].source === 'captured' && ui.notice === 'No fixer at this dock.');
}

{
  const ui = { launderPending: { commodity: DATA_CUBE, source: 'captured', originFaction: 'assembly' }, notice: 'x' };
  pin('launder.esc', cancelLaunderPending(ui) === true && ui.launderPending === null);
}

const confirmBody = stationSrc.slice(
  stationSrc.indexOf('export function confirmArchivePending'),
  stationSrc.indexOf('export function renderArchiveDesk'),
);
const launderBody = stationSrc.slice(
  stationSrc.indexOf('export function confirmLaunderPending'),
  stationSrc.indexOf('export function renderFixerLaunder'),
);

pin('src.noInnerHTML', !/innerHTML/.test(tradeSrc) && !/innerHTML/.test(confirmBody) && !/innerHTML/.test(launderBody));
pin('src.noAddCargoPay', !confirmBody.includes('addCargo(') && !confirmBody.includes('removeCargo(') && !confirmBody.includes('tryTrade'));
pin('src.noSurvivorHelper', !launderBody.includes('applySurvivorSale') && !launderBody.includes('confirmTrafficTransfer'));
pin('src.busy', confirmBody.includes('dataBusy') && launderBody.includes('launderBusy'));
pin('src.copyNoUnset', !stationSrc.includes('UU unset'));
pin('src.digit7', stationSrc.includes("ui.service === 'people'") && stationSrc.includes("contact.role !== 'fixer'"));
pin('src.noNewDigit', /DOCK_KEY_SERVICES = Object.freeze\(\[/.test(stationSrc)
  && stationSrc.includes("'market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard'"));

if (fails.length) {
  console.error('FAIL', fails);
  process.exit(1);
}
console.log('PASS', Object.keys(results).length, 'pins');
console.log(JSON.stringify(results, null, 2));
