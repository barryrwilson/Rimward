// Extra rescue edges the main probe does not pin. Does not touch src/.
import { RESCUE, FACTIONS } from '../../../src/game/state.js';
import {
  applySurvivorRescue,
  survivorUnitsForFaction,
  holdUnits,
  isMarketCommodity,
  priceOf,
} from '../../../src/systems/station.js';

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

function stub(cargo, reputation) {
  const events = [];
  return {
    cargo,
    cargoCapacity: 20,
    world: { time: 0, prices: { provisions: 100 }, reputation: reputation ?? { freehold: 0, gilded: 0, veridian: 0 } },
    events,
    emit(type, data = {}) { events.push({ type, ...data }); },
  };
}

const gilded = stub([
  { commodity: 'survivor', units: 2, faction: 'gilded', source: 'other' },
], { gilded: 0, freehold: 0 });
const gRes = applySurvivorRescue(gilded, 'gilded');
ok('gilded.repIsRescueTable', gRes?.repDelta === RESCUE.otherRep * 2 && gilded.world.reputation.gilded === 8);
ok('gilded.notSellMult', gRes?.repDelta !== Math.round(2 * 1.15));
ok('gilded.noCreditsField', gilded.world.credits == null);

const missingSrc = stub([
  { commodity: 'survivor', units: 1, faction: 'freehold' },
], { freehold: 0 });
const miss = applySurvivorRescue(missingSrc, 'freehold');
ok('missingSource.smallBump', miss?.repDelta === RESCUE.playerKillRep, String(miss?.repDelta));

const twice = stub([
  { commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' },
], { freehold: 0 });
applySurvivorRescue(twice, 'freehold');
const second = applySurvivorRescue(twice, 'freehold');
ok('secondApply.noop', second === null && twice.world.reputation.freehold === 4);

const zero = stub([
  { commodity: 'survivor', units: 0, faction: 'freehold', source: 'other' },
], { freehold: 0 });
ok('zeroUnits.left', applySurvivorRescue(zero, 'freehold') === null && zero.cargo.length === 1);

const neg = stub([
  { commodity: 'survivor', units: -3, faction: 'freehold', source: 'other' },
], { freehold: 0 });
ok('negUnits.left', applySurvivorRescue(neg, 'freehold') === null && neg.world.reputation.freehold === 0);

const frac = stub([
  { commodity: 'survivor', units: 1.9, faction: 'freehold', source: 'other' },
], { freehold: 0 });
const fRes = applySurvivorRescue(frac, 'freehold');
ok('fracUnits.floor', fRes?.count === 1 && frac.world.reputation.freehold === RESCUE.otherRep);

const empty = stub([], { freehold: 5 });
ok('empty.noop', applySurvivorRescue(empty, 'freehold') === null && empty.world.reputation.freehold === 5);

const stacks = stub([
  { commodity: 'survivor', units: 1, faction: 'veridian', source: 'other' },
  { commodity: 'survivor', units: 1, faction: 'veridian', source: 'other' },
], { veridian: 0 });
const sRes = applySurvivorRescue(stacks, 'veridian');
ok('twoStacks.other', sRes?.count === 2 && stacks.world.reputation.veridian === 8 && survivorUnitsForFaction(stacks, 'veridian') === 0);

const hold = stub([
  { commodity: 'survivor', units: 2, faction: 'freehold', source: 'other' },
  { commodity: 'provisions', units: 3 },
]);
ok('holdUnits.survivorCounts', holdUnits(hold, 'survivor') === 2);
ok('holdUnits.stapleClean', holdUnits(hold, 'provisions') === 3);
ok('stillNotMarket', isMarketCommodity('survivor') === false);
ok('priceStillZero', priceOf(hold, 'survivor') === 0);

ok('factionNames', FACTIONS.gilded.name === 'Gilded Chain' && FACTIONS.freehold.name === 'Freehold Compact');

if (fails.length === 0) {
  console.log('EXTRA CLEAN');
  process.exit(0);
}
console.log('EXTRA FAIL');
console.log(fails.join('\n'));
process.exit(1);
