// Wave 65 catalog depth — cutter + ace buy lists.
// Run: node --import ./scripts/with-css-stub.mjs out/w65/catalog/probe.mjs
import {
  YARD_LIST_UU,
  yardStockFor,
  minRepFor,
  yardPrice,
  listYardOffers,
  purchaseYardHull,
  hullKindFor,
} from '../../../src/game/shipyard.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
}

function eqList(got, want) {
  return Array.isArray(got) && got.length === want.length && want.every((k, i) => got[i] === k);
}

const PLATED = [
  'freehold', 'veridian', 'redledger', 'ferrous',
  'gilded', 'assembly', 'congregation', 'lamplighter',
];
const ALL_FACTIONS = [...PLATED, 'beautiful', 'unknowables', 'independent', 'hollow'];
const CORE = ['light', 'cutter', 'heavy', 'freighter', 'ace'];
const LIVING = ['light', 'cutter', 'heavy'];

pin('freehold.stock', eqList(yardStockFor('freehold'), CORE), yardStockFor('freehold').join(','));
pin('beautiful.stock', eqList(yardStockFor('beautiful'), LIVING), yardStockFor('beautiful').join(','));
pin('unknowables.stock', eqList(yardStockFor('unknowables'), ['light']), yardStockFor('unknowables').join(','));
pin('independent.empty', Array.isArray(yardStockFor('independent')) && yardStockFor('independent').length === 0);
pin('hollow.empty', Array.isArray(yardStockFor('hollow')) && yardStockFor('hollow').length === 0);

for (const f of PLATED) {
  pin(`plated.${f}`, eqList(yardStockFor(f), CORE), yardStockFor(f).join(','));
}

for (const f of ALL_FACTIONS) {
  pin(`noFrigate.${f}`, !yardStockFor(f).includes('frigate'));
}

pin('price.cutter', YARD_LIST_UU.cutter === 11000);
pin('price.ace', YARD_LIST_UU.ace === 28000);
pin('price.frigate', YARD_LIST_UU.frigate === 80000);

pin('minRep.ace', minRepFor('ace') === 10);
pin('minRep.cutter', minRepFor('cutter') === 0);
pin('minRep.light', minRepFor('light') === 0);

pin('yardPrice.cutter.stranger', yardPrice('cutter', 0) === 11000);
pin('yardPrice.ace.stranger', yardPrice('ace', 0) === 28000);

pin('beautiful.noAce', !yardStockFor('beautiful').includes('ace'));
pin('unknowables.onlyLight', yardStockFor('unknowables').join(',') === 'light');
pin('unknowables.living', hullKindFor('unknowables') === 'living');
pin('beautiful.living', hullKindFor('beautiful') === 'living');
pin('freehold.built', hullKindFor('freehold') === 'built');

function mockDock(faction, extra = {}) {
  const systemId = extra.systemId ?? 'probe_dock';
  return {
    flags: { docked: true, combat: false, paused: false },
    world: {
      currentSystem: systemId,
      credits: extra.credits ?? 50000,
      reputation: extra.reputation ?? { [faction]: extra.rep ?? 0 },
      hangar: extra.hangar ?? {
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
    },
    systems: { [systemId]: { faction } },
    cargo: [],
    cargoCapacity: 20,
    player: extra.player ?? { classKey: 'light', hullKind: 'living', faction: 'independent' },
    ship: { object: { position: { toArray: () => [0, 0, 0] }, quaternion: { toArray: () => [0, 0, 0, 1] } } },
    emit() {},
    ships: [],
    gate: { jumping: false },
  };
}

const fhOffers = listYardOffers(mockDock('freehold'));
const fhKeys = fhOffers.map((o) => o.classKey);
pin('offers.freehold.cutter', fhKeys.includes('cutter'), fhKeys.join(','));
pin('offers.freehold.ace', fhKeys.includes('ace'), fhKeys.join(','));
pin('offers.freehold.noFrigate', !fhKeys.includes('frigate'));
pin('offers.freehold.order', eqList(fhKeys, CORE), fhKeys.join(','));

const indOffers = listYardOffers(mockDock('independent'));
pin('offers.independent.empty', Array.isArray(indOffers) && indOffers.length === 0);

const beauOffers = listYardOffers(mockDock('beautiful'));
const beauKeys = beauOffers.map((o) => o.classKey);
pin('offers.beautiful.cutter', beauKeys.includes('cutter'));
pin('offers.beautiful.noAce', !beauKeys.includes('ace'));

const hostile = mockDock('freehold', { rep: -1, credits: 50000 });
const hostileBuy = purchaseYardHull(hostile, 'cutter');
pin('hostile.refused', hostileBuy.ok === false && hostileBuy.reason === 'reputation', JSON.stringify(hostileBuy));
pin('hostile.noDebit', hostile.world.credits === 50000);
pin('hostile.noRow', hostile.world.hangar.hulls.length === 1);

const strangerAce = mockDock('freehold', { rep: 0, credits: 50000 });
const aceBuy = purchaseYardHull(strangerAce, 'ace');
pin('ace.minRep.refused', aceBuy.ok === false && aceBuy.reason === 'reputation', JSON.stringify(aceBuy));
pin('ace.minRep.noDebit', strangerAce.world.credits === 50000);

if (fails.length) {
  console.log('FAIL', fails.join('; '));
  process.exitCode = 1;
} else {
  console.log('ALL PINS TRUE');
}
