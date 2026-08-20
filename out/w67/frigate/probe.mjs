// Wave 67 plated frigate catalog leftover.
// Run: node --import ./scripts/with-css-stub.mjs out/w67/frigate/probe.mjs
import {
  YARD_LIST_UU,
  yardStockFor,
  minRepFor,
  yardPrice,
  listYardOffers,
  purchaseYardHull,
  hullKindFor,
  canReleaseSku,
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
const CORE = ['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate'];
const LIVING = ['light', 'cutter', 'heavy'];

pin('freehold.stock', eqList(yardStockFor('freehold'), CORE), yardStockFor('freehold').join(','));
pin('core.order', eqList(yardStockFor('freehold').slice(0, 5), CORE.slice(0, 5)));

for (const f of PLATED) {
  pin(`plated.${f}`, eqList(yardStockFor(f), CORE), yardStockFor(f).join(','));
  pin(`plated.${f}.frigate`, yardStockFor(f).includes('frigate'));
}

pin('beautiful.stock', eqList(yardStockFor('beautiful'), LIVING), yardStockFor('beautiful').join(','));
pin('beautiful.noFrigate', !yardStockFor('beautiful').includes('frigate'));
pin('beautiful.noAce', !yardStockFor('beautiful').includes('ace'));
pin('unknowables.onlyLight', yardStockFor('unknowables').join(',') === 'light');
pin('unknowables.noFrigate', !yardStockFor('unknowables').includes('frigate'));
pin('independent.empty', Array.isArray(yardStockFor('independent')) && yardStockFor('independent').length === 0);
pin('hollow.empty', Array.isArray(yardStockFor('hollow')) && yardStockFor('hollow').length === 0);

pin('price.frigate', YARD_LIST_UU.frigate === 80000);
pin('minRep.frigate', minRepFor('frigate') === 25);
pin('minRep.ace', minRepFor('ace') === 10);
pin('minRep.cutter', minRepFor('cutter') === 0);
pin('minRep.light', minRepFor('light') === 0);
pin('minRep.heavy', minRepFor('heavy') === 0);
pin('minRep.freighter', minRepFor('freighter') === 0);

pin('yardPrice.frigate.stranger', yardPrice('frigate', 0) === 80000);
pin('yardPrice.frigate.known', yardPrice('frigate', 10) === Math.round(80000 * 0.95));
pin('yardPrice.frigate.trusted', yardPrice('frigate', 25) === Math.round(80000 * 0.9));
pin('yardPrice.frigate.sworn', yardPrice('frigate', 50) === Math.round(80000 * 0.85));

pin('kind.freehold.built', hullKindFor('freehold') === 'built');
pin('kind.beautiful.living', hullKindFor('beautiful') === 'living');
pin('kind.unknowables.living', hullKindFor('unknowables') === 'living');
pin('release.frigate.built', canReleaseSku('frigate', 'built') === true);
pin('release.frigate.living', canReleaseSku('frigate', 'living') === true);

function hullIndexForDigit(n) {
  if (n === 0) return 7;
  if (n >= 3) return n - 3;
  return -1;
}
pin('digit8.index', hullIndexForDigit(8) === 5 && CORE[5] === 'frigate');
pin('digit3.stillLight', hullIndexForDigit(3) === 0 && CORE[0] === 'light');

function mockDock(faction, extra = {}) {
  const systemId = extra.systemId ?? 'probe_dock';
  return {
    flags: { docked: true, combat: false, paused: false },
    world: {
      currentSystem: systemId,
      credits: extra.credits ?? 100000,
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
pin('offers.freehold.order', eqList(fhKeys, CORE), fhKeys.join(','));
pin('offers.freehold.frigate', fhKeys.includes('frigate'));

const indOffers = listYardOffers(mockDock('independent'));
pin('offers.independent.empty', Array.isArray(indOffers) && indOffers.length === 0);

const beauOffers = listYardOffers(mockDock('beautiful'));
const beauKeys = beauOffers.map((o) => o.classKey);
pin('offers.beautiful.noFrigate', !beauKeys.includes('frigate'));
pin('offers.beautiful.noAce', !beauKeys.includes('ace'));

const unkOffers = listYardOffers(mockDock('unknowables'));
pin('offers.unknowables.noFrigate', !unkOffers.some((o) => o.classKey === 'frigate'));

const stranger = mockDock('freehold', { rep: 0, credits: 100000 });
const strangerBuy = purchaseYardHull(stranger, 'frigate');
pin('stranger.refuse', strangerBuy.ok === false && strangerBuy.reason === 'reputation', JSON.stringify(strangerBuy));
pin('stranger.noDebit', stranger.world.credits === 100000);
pin('stranger.noRow', stranger.world.hangar.hulls.length === 1);

const known = mockDock('freehold', { rep: 10, credits: 100000 });
const knownListed = listYardOffers(known).some((o) => o.classKey === 'frigate');
const knownBuy = purchaseYardHull(known, 'frigate');
pin('known.listed', knownListed);
pin('known.refuse', knownBuy.ok === false && knownBuy.reason === 'reputation', JSON.stringify(knownBuy));
pin('known.noDebit', known.world.credits === 100000);
pin('known.noRow', known.world.hangar.hulls.length === 1);

const trusted = mockDock('freehold', { rep: 25, credits: 100000 });
const beforeMount = trusted.world.hangar.mountedId;
const beforeKind = trusted.player.hullKind;
const beforeClass = trusted.player.classKey;
const trustedPrice = Math.round(80000 * 0.9);
const trustedBuy = purchaseYardHull(trusted, 'frigate');
const trustedRow = trusted.world.hangar.hulls.find((h) => h.id !== beforeMount);
pin('trusted.ok', trustedBuy.ok === true, JSON.stringify(trustedBuy));
pin('trusted.price', trustedBuy.price === trustedPrice, String(trustedBuy.price));
pin('trusted.debit', trusted.world.credits === 100000 - trustedPrice, String(trusted.world.credits));
pin('trusted.rowClass', trustedRow?.classKey === 'frigate');
pin('trusted.cargo20', trustedRow?.cargoCapacity === 20);
pin('trusted.built', trustedRow?.hullKind === 'built');
pin('trusted.noRemount', trusted.world.hangar.mountedId === beforeMount
  && trusted.player.hullKind === beforeKind
  && trusted.player.classKey === beforeClass);

const sworn = mockDock('freehold', { rep: 50, credits: 100000 });
const swornPrice = Math.round(80000 * 0.85);
const swornBuy = purchaseYardHull(sworn, 'frigate');
pin('sworn.ok', swornBuy.ok === true, JSON.stringify(swornBuy));
pin('sworn.price', swornBuy.price === swornPrice, String(swornBuy.price));
pin('sworn.noRemount', sworn.world.hangar.mountedId === 'hull_starter');

const beauFrigate = purchaseYardHull(mockDock('beautiful', { rep: 50, credits: 100000 }), 'frigate');
pin('beautiful.frigate.stock', beauFrigate.ok === false && beauFrigate.reason === 'stock', JSON.stringify(beauFrigate));

const unkFrigate = purchaseYardHull(mockDock('unknowables', { rep: 50, credits: 100000 }), 'frigate');
pin('unknowables.frigate.stock', unkFrigate.ok === false && unkFrigate.reason === 'stock', JSON.stringify(unkFrigate));

const indieFrigate = purchaseYardHull(mockDock('independent', { rep: 50, credits: 100000 }), 'frigate');
pin('independent.frigate.stock', indieFrigate.ok === false && indieFrigate.reason === 'stock', JSON.stringify(indieFrigate));

if (fails.length) {
  console.log('FAIL', fails.join('; '));
  process.exitCode = 1;
} else {
  console.log('ALL PINS TRUE');
}
