// Wave 60 rescue + market block. Drives station helpers on a stub ctx.
// Run: node --import ./scripts/with-css-stub.mjs out/w60/rescue/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RESCUE, COMMODITIES, FACTIONS } from '../../../src/game/state.js';
import {
  DOCK_KEY_SERVICES,
  priceOf,
  isMarketCommodity,
  isSurvivorCargo,
  holdUnits,
  addCargo,
  removeCargo,
  survivorUnitsForFaction,
  applySurvivorRescue,
} from '../../../src/systems/station.js';

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

function stubCtx(cargo, reputation) {
  const events = [];
  return {
    cargo,
    cargoCapacity: 20,
    world: {
      time: 0,
      prices: { provisions: 100 },
      reputation: reputation ?? { freehold: 0, redledger: 0, veridian: 0, hollow: 0 },
    },
    events,
    emit(type, data = {}) {
      events.push({ type, ...data });
    },
  };
}

const SERVICES = ['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics'];
ok('dock.keys.length', DOCK_KEY_SERVICES.length === 9, String(DOCK_KEY_SERVICES.length));
ok('dock.keys.order', SERVICES.every((k, i) => DOCK_KEY_SERVICES[i] === k), DOCK_KEY_SERVICES.join(','));

ok('rescue.table', RESCUE.otherRep === 4 && RESCUE.playerKillRep === 1);
ok('rescue.lines', typeof RESCUE.lineOther === 'string' && typeof RESCUE.lineKill === 'string');
ok('rescue.noPlayerKillCopy', !/playerKill/i.test(RESCUE.lineOther + RESCUE.lineKill));

ok('market.noSurvivorKey', !Object.hasOwn(COMMODITIES, 'survivor'));
ok('market.isMarket.survivor', isMarketCommodity('survivor') === false);
ok('market.isMarket.provisions', isMarketCommodity('provisions') === true);

const priceCtx = stubCtx([]);
let threw = false;
let survivorPrice;
try { survivorPrice = priceOf(priceCtx, 'survivor'); }
catch { threw = true; }
ok('priceOf.survivor.noThrow', threw === false, String(survivorPrice));
ok('priceOf.survivor.zero', survivorPrice === 0);
ok('priceOf.provisions', priceOf(priceCtx, 'provisions') === 100);

const stack = stubCtx([
  { commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' },
]);
addCargo(stack, 'provisions', 2);
addCargo(stack, 'provisions', 3);
ok(
  'addCargo.noStackOntoSurvivor',
  stack.cargo.length === 2
    && stack.cargo[0].commodity === 'survivor'
    && stack.cargo[0].units === 1
    && stack.cargo[1].commodity === 'provisions'
    && stack.cargo[1].units === 5,
);
removeCargo(stack, 'survivor', 1);
ok('removeCargo.skipsSurvivor', stack.cargo.some((c) => c.commodity === 'survivor'));
ok('holdUnits.provisions', holdUnits(stack, 'provisions') === 5);

const mixed = stubCtx([
  { commodity: 'survivor', units: 2, faction: 'freehold', source: 'playerKill' },
  { commodity: 'provisions', units: 4 },
  { commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' },
  { commodity: 'survivor', units: 1, faction: 'veridian', source: 'other' },
], { freehold: 10, redledger: 0, veridian: 3, hollow: 0 });

ok('detect.survivor', isSurvivorCargo(mixed.cargo[0]) === true);
ok('detect.staple', isSurvivorCargo(mixed.cargo[1]) === false);
ok('units.freehold', survivorUnitsForFaction(mixed, 'freehold') === 3);
ok('units.veridian', survivorUnitsForFaction(mixed, 'veridian') === 1);

const beforeProv = mixed.cargo.find((c) => c.commodity === 'provisions').units;
const result = applySurvivorRescue(mixed, 'freehold');
ok('rescue.removedMatch', survivorUnitsForFaction(mixed, 'freehold') === 0);
ok('rescue.keptWrongFaction', survivorUnitsForFaction(mixed, 'veridian') === 1);
ok('rescue.keptProvisions', holdUnits(mixed, 'provisions') === beforeProv);
ok('rescue.otherRepVsKill', result?.repDelta === RESCUE.otherRep * 1 + RESCUE.playerKillRep * 2, String(result?.repDelta));
ok('rescue.repApplied', mixed.world.reputation.freehold === 10 + RESCUE.otherRep + RESCUE.playerKillRep * 2);
ok('rescue.veridianUntouched', mixed.world.reputation.veridian === 3);
ok('rescue.count', result?.count === 3);
ok('rescue.oneEvent', mixed.events.filter((e) => e.type === 'survivorRescued').length === 1);
const ev = mixed.events.find((e) => e.type === 'survivorRescued');
ok('rescue.eventShape', ev && ev.faction === 'freehold' && ev.count === 3 && typeof ev.repDelta === 'number');
ok('rescue.eventNoLeak', ev && (ev.source === 'other' || ev.source === 'playerKill'));
const spoken = mixed.events.filter((e) => e.type === 'commLine');
ok('rescue.commLine', spoken.length === 1 && spoken[0].text.includes(FACTIONS.freehold.name));
ok('rescue.commNoId', spoken[0] && !spoken[0].text.includes('freehold') && !/playerKill/i.test(spoken[0].text));

const onlyKill = stubCtx([
  { commodity: 'survivor', units: 1, faction: 'redledger', source: 'playerKill' },
], { freehold: 0, redledger: 0, veridian: 0, hollow: 0 });
const killRes = applySurvivorRescue(onlyKill, 'redledger');
ok('rescue.killRep', killRes?.repDelta === RESCUE.playerKillRep && onlyKill.world.reputation.redledger === 1);
ok('rescue.killLine', onlyKill.events.some((e) => e.type === 'commLine' && e.text.includes(FACTIONS.redledger.name)));

const onlyOther = stubCtx([
  { commodity: 'survivor', units: 2, faction: 'hollow', source: 'other' },
], { freehold: 0, redledger: 0, veridian: 0, hollow: 5 });
const otherRes = applySurvivorRescue(onlyOther, 'hollow');
ok('rescue.otherRep', otherRes?.repDelta === RESCUE.otherRep * 2 && onlyOther.world.reputation.hollow === 13);

const bogus = stubCtx([
  { commodity: 'survivor', units: 5, faction: '__proto__', source: 'other' },
], { freehold: 0, redledger: 0, veridian: 0, hollow: 0 });
const bogusRes = applySurvivorRescue(bogus, '__proto__');
ok('rescue.rejectUnknownFaction', bogusRes === null && bogus.cargo.length === 1);
ok('rescue.noProtoRep', !Object.hasOwn(bogus.world.reputation, '__proto__'));

const inf = stubCtx([
  { commodity: 'survivor', units: Infinity, faction: 'freehold', source: 'other' },
], { freehold: 0, redledger: 0, veridian: 0, hollow: 0 });
const infRes = applySurvivorRescue(inf, 'freehold');
ok('rescue.infiniteUnits', infRes === null && inf.world.reputation.freehold === 0);

const fat = stubCtx([
  { commodity: 'survivor', units: 500, faction: 'freehold', source: 'other' },
], { freehold: 0, redledger: 0, veridian: 0, hollow: 0 });
const fatRes = applySurvivorRescue(fat, 'freehold');
ok('rescue.oversizeLeft', fatRes === null && fat.cargo.length === 1 && fat.world.reputation.freehold === 0);

const here = dirname(fileURLToPath(import.meta.url));
const stationSrc = readFileSync(join(here, '..', '..', '..', 'src', 'systems', 'station.js'), 'utf8');
ok('market.tryTradeGuard', stationSrc.includes("if (!isMarketCommodity(key) || key === 'survivor')"));
ok('market.listUsesKeys', stationSrc.includes('COMMODITY_KEYS.forEach') && stationSrc.includes('Object.keys(COMMODITIES)'));
ok('dock.noNewDigit', !/DOCK_KEY_SERVICES\s*=\s*\[[^\]]*'rescue'/.test(stationSrc));
ok('hud.toast', readFileSync(join(here, '..', '..', '..', 'src', 'systems', 'hud.js'), 'utf8').includes("case 'survivorRescued'"));
ok('ctx.eventDoc', readFileSync(join(here, '..', '..', '..', 'src', 'core', 'ctx.js'), 'utf8').includes("'survivorRescued' { faction, source, count, repDelta }"));

if (fails.length === 0) {
  console.log('CLEAN');
  process.exit(0);
}
console.log('FAIL');
console.log(fails.join('\n'));
process.exit(1);
