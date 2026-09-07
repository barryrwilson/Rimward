/**
 * Issue #53 — market spread regression.
 *
 * Pins station.js's trade invariant: at ONE dock with an unchanged market, the
 * rounded SELL fill never exceeds the rounded BUY fill, while a real price
 * difference BETWEEN markets still pays. Every trade under test runs through
 * the rendered market panel (arrow keys + Q/W/A/S) or the public
 * window.rimward trade action, and is checked against actual credits, actual
 * cargo, and the panel's own BUY/SELL cells and notice line.
 *
 * TEST SETUP (labelled inline): purse, hold capacity, reputation, epic stage
 * counters, contact trust and the current system's price table are written
 * directly. Those are inputs to the pricing chain — no fill is faked.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-53-market-spread-test.mjs
 */
import {
  seedBootRandom, installDomStubs, bootGameSystems, makeTick, makeNavHelpers,
} from './lib/boot-harness.mjs';

seedBootRandom();
const { dispatchKey, walkDom } = installDomStubs();
const boot = await bootGameSystems();
const { ctx, systems } = boot;
const {
  SYSTEMS, rankFor, COMMODITIES, FACTION_SERVICES, HERMIT, epicEffects,
  contactsForSystem, KEEPER_COMP_TRUST,
} = boot.binds;
const { AUTHORED_SYSTEMS } = await import('../src/game/authored-systems.js');

// Mirrors of station.js's private restricted-sale constants. The 29 -> 30
// crossing below verifies the threshold empirically rather than trusting these.
const FIXER_CUT_TRUST = 30;
const FIXER_MARKUP = 1.10;

let errors = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok  ', name); return; }
  errors++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 900));
}
function group(name, checks, detail) {
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  pin(name, failed.length === 0, { failed, ...(detail ?? {}) });
}

const dt = 1 / 60;
let frame = 0;
const tick = makeTick(ctx, systems, {
  get frame() { return frame; }, set frame(v) { frame = v; },
}, dt, (e, frameNo, label) => {
  errors++;
  console.log(`UPDATE ERR frame ${frameNo} (${label}): ${e.message}`);
});
const { dockAtCurrentStation, undockStation, tickUntilJumpDone } = makeNavHelpers({
  ctx, SYSTEMS, tick, dispatchKey,
  onRouteError: (msg) => { console.log(msg); errors++; },
});

// ---- Front door (the focused-runner boot path) -----------------------------
for (const n of walkDom(document.body)) {
  if (n.dataset?.titleAction === 'new') { n.click(); break; }
}
dispatchKey('Digit1'); // [1] Freehold Greenhand
if (ctx.world.origin !== 'greenhand' || ctx.flags.paused !== false) {
  console.log(`FRONT DOOR FAIL — origin=${ctx.world.origin} paused=${ctx.flags.paused}`);
  process.exit(1);
}
tick(120, 'boot idle');
ctx.agent.optIn = true; // TEST SETUP: stands in for the trusted opt-in click

// ---- Panel readers (boot-test market-cell convention) ----------------------
const COMMODITY_KEYS = Object.keys(COMMODITIES);
const CELL_BUY = 2;
const CELL_SELL = 3;
const CELL_TRADE = 5;

function overlay() {
  for (const n of walkDom(document.body)) {
    if (typeof n.className === 'string' && n.className.includes('station-overlay')) return n;
  }
  return null;
}
function rowCell(comName, offset) {
  const ov = overlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (n.textContent === comName && typeof n.className === 'string'
      && n.className.includes('market-cell') && n.parent) {
      const kids = n.parent.children ?? [];
      const i = kids.indexOf(n);
      if (i >= 0 && kids.length > i + offset) return kids[i + offset];
    }
  }
  return null;
}
function cellUU(comName, offset) {
  const m = (rowCell(comName, offset)?.textContent ?? '').match(/^(-?\d+) UU$/);
  return m ? Number(m[1]) : null;
}
function noticeText() {
  const ov = overlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (typeof n.className === 'string' && n.className.includes('station-notice')) return n.textContent;
  }
  return null;
}
function selectedRowName() {
  const ov = overlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (typeof n.className === 'string' && n.className.includes('market-row-sel')) return n.textContent;
  }
  return null;
}
const held = (key) => ctx.cargo.reduce((n, c) => n + (c.commodity === key ? c.units : 0), 0);

// ---- The expectation, spelled out from state.js data ----------------------
// Buy chain, full sell chain, and the capped fill. Independent of station.js's
// code path, so a change on either side of the counter fails here.
function chainFor(key) {
  const id = ctx.world.currentSystem;
  const def = SYSTEMS[id];
  const svc = AUTHORED_SYSTEMS[id] ? null : (FACTION_SERVICES[def.faction] ?? null);
  const fx = epicEffects(ctx, def.faction);
  const price = ctx.world.prices[key] ?? COMMODITIES[key].base;
  const people = contactsForSystem(ctx, id);
  const keeperTrust = people.find((c) => c.role === 'dockmaster')?.trust ?? 0;
  const hermitBuy = def.hermit && keeperTrust < KEEPER_COMP_TRUST ? HERMIT.buyMult : 1;
  const buy = Math.round(price * (fx.buyMult ?? 1) * (svc?.buyMult ?? 1) * hermitBuy);

  const tier = rankFor(ctx.world.reputation?.[def.faction] ?? 0).tier;
  let raw = price * (fx.sellMult ?? 1) * (tier > 0 ? 1 + 0.02 * tier : 1);
  if (svc) raw *= svc.sellMult ?? 1;
  if (def.hermit) raw *= HERMIT.sellMult;
  if (key === 'restrictedComponents') {
    raw *= fx.restrictedSellMult ?? 1;
    if (def.tradesRestricted === true) {
      const fixer = people.find((c) => c.role === 'fixer');
      if (fixer && fixer.trust >= FIXER_CUT_TRUST) raw *= FIXER_MARKUP;
    }
  }
  const sellRaw = Math.round(raw);
  return { price, buy, sellRaw, sell: Math.min(sellRaw, buy), capBinds: sellRaw > buy };
}

// ---- Navigation / panel plumbing -----------------------------------------
// TEST SETUP: ride the game's own jump sequence straight to a dock. jump.js
// accepts any known system id, so this is the production swap (despawn,
// relocate, systemLoaded, price-table rebind) without the intervening legs.
function warpTo(id, label) {
  if (ctx.flags.docked) undockStation();
  if (ctx.world.currentSystem === id) return true;
  ctx.emit('jumpRequested', { to: id });
  if (tickUntilJumpDone(id, label)) return true;
  console.log(`WARP FAIL — ${id} (${label})`); errors++; return false;
}
function reopenMarket() { dispatchKey('Escape'); dispatchKey('Digit1'); }
function openMarketAt(id, label) {
  if (!warpTo(id, label)) return false;
  dockAtCurrentStation(`dock ${id} (${label})`);
  if (!ctx.flags.docked) { console.log(`DOCK FAIL — ${id}`); errors++; return false; }
  dispatchKey('Digit1'); // market (DOCK_KEY_SERVICES[0])
  return !!overlay();
}
function selectRow(comName) {
  for (let i = 0; i <= COMMODITY_KEYS.length; i++) {
    if (selectedRowName() === comName) return true;
    dispatchKey('ArrowDown');
  }
  console.log(`ROW FAIL — ${comName}`); errors++; return false;
}
/** TEST SETUP: purse and hold that never refuse a trade under test. */
function fund(units) {
  ctx.world.credits = 5_000_000;
  ctx.cargoCapacity = Math.max(200, units + 40);
}
/** TEST SETUP: pin this market's quote, then re-render so the cells are live. */
function pinPrice(key, price) { ctx.world.prices[key] = price; reopenMarket(); }

// Each trade path returns the size of its LAST leg, so the notice line (which
// reports one leg) can be checked exactly even for chunked orders.
const keys = (code, comName, per) => (key, qty) => {
  if (!selectRow(comName)) return per;
  for (let i = 0; i < qty / per; i++) dispatchKey(code);
  return per;
};
const api = (side) => (key, qty) => {
  const r = globalThis.window.rimward.act({ v: 2, name: 'trade', args: { commodity: key, qty, side } });
  if (r?.ok !== true) { console.log(`ACT FAIL — ${side} ${qty} ${key}: ${JSON.stringify(r)}`); errors++; }
  return qty;
};
const chunks = (side, list) => (key, qty) => {
  let moved = 0;
  for (const n of list) { api(side)(key, n); moved += n; }
  if (moved !== qty) { console.log(`CHUNK FAIL — ${moved} != ${qty}`); errors++; }
  return list[list.length - 1];
};

/**
 * Buy `qty` then sell it back at the same dock, asserting cell == notice ==
 * actual cash and cargo movement, the capped fill, and no round-trip gain.
 */
function roundTrip(label, key, qty, buyFn, sellFn) {
  const name = COMMODITIES[key].name;
  reopenMarket();
  const q = chainFor(key);
  const cellBuy = cellUU(name, CELL_BUY);
  const cellSell = cellUU(name, CELL_SELL);
  const credits0 = ctx.world.credits;
  const held0 = held(key);

  const buyLeg = buyFn(key, qty);
  const charged = credits0 - ctx.world.credits;
  const heldMid = held(key);
  const buyNotice = noticeText();
  const cellSellMid = cellUU(name, CELL_SELL);
  const credits1 = ctx.world.credits;

  const sellLeg = sellFn(key, qty);
  const paid = ctx.world.credits - credits1;
  const sellNotice = noticeText();

  group(label, {
    buyCellIsChain: cellBuy === q.buy,
    sellCellIsChain: cellSell === q.sell,
    sellCellStableAfterBuy: cellSellMid === q.sell,
    chargedIsCellTimesQty: charged === q.buy * qty,
    paidIsCellTimesQty: paid === q.sell * qty,
    buyNoticeTotal: buyNotice === `Bought ${buyLeg} ${name} for ${q.buy * buyLeg} UU.`,
    sellNoticeTotal: sellNotice === `Sold ${sellLeg} ${name} for ${q.sell * sellLeg} UU.`,
    cargoRose: heldMid === held0 + qty,
    cargoReturned: held(key) === held0,
    sellNeverBeatsBuy: q.sell <= q.buy,
    sellIsCappedMin: q.sell === Math.min(q.sellRaw, q.buy),
    noRoundTripGain: ctx.world.credits <= credits0,
  }, { qty, key, cellBuy, cellSell, charged, paid, chain: q, buyNotice, sellNotice });
}

/** Every tradable row at this dock: cells agree with the chain and sell <= buy. */
function pinPanel(label) {
  const bad = [];
  for (const key of COMMODITY_KEYS) {
    const name = COMMODITIES[key].name;
    const b = cellUU(name, CELL_BUY);
    const s = cellUU(name, CELL_SELL);
    if (b === null || s === null) { bad.push(`${key}:missing`); continue; }
    const q = chainFor(key);
    if (b !== q.buy) bad.push(`${key}:buy ${b}!=${q.buy}`);
    if (s !== q.sell) bad.push(`${key}:sell ${s}!=${q.sell}`);
    if (s > b) bad.push(`${key}:spread ${s}>${b}`);
  }
  pin(label, bad.length === 0, { bad: bad.slice(0, 10), rows: COMMODITY_KEYS.length });
}

// ---- Docks, found by flag rather than by hardcoded id ---------------------
const generated = Object.keys(SYSTEMS).filter((id) => !AUTHORED_SYSTEMS[id] && SYSTEMS[id]?.station);
const byFaction = (f) => generated.find((id) => SYSTEMS[id].faction === f) ?? null;
const AUCTION = generated.find((id) => SYSTEMS[id].station?.name === 'The Grand Auction') ?? byFaction('gilded');
const BEACON = byFaction('lamplighter');
const SALON = byFaction('beautiful');
group('docks found', {
  grandAuction: !!AUCTION && SYSTEMS[AUCTION].faction === 'gilded',
  lampBeacon: !!BEACON,
  beautifulSalon: !!SALON,
  gildedPremium: FACTION_SERVICES.gilded.sellMult === 1.15,
  lampDiscount: FACTION_SERVICES.lamplighter.buyMult === 0.85,
  salonDiscount: FACTION_SERVICES.beautiful.sellMult === 0.85,
  redmarchFixer: contactsForSystem(ctx, 'redmarch').some((c) => c.role === 'fixer'),
  redmarchRestricted: SYSTEMS.redmarch.tradesRestricted === true,
  vergeHermit: SYSTEMS.verge.hermit === true,
}, { AUCTION, BEACON, SALON });

// ===== A. The Grand Auction: 216 in, 216 back (was 248) ====================
console.log('--- A. The Grand Auction (gilded sell x1.15) ---');
if (AUCTION && openMarketAt(AUCTION, 'A auction')) {
  fund(200);
  ctx.world.reputation.gilded = 0; // TEST SETUP: no goodwill tier in the arithmetic
  pinPrice('provisions', 216);     // TEST SETUP: the reported quote
  const q = chainFor('provisions');
  const credits0 = ctx.world.credits;
  selectRow('Provisions');
  dispatchKey('KeyQ'); // human buy 1
  const charged = credits0 - ctx.world.credits;
  const credits1 = ctx.world.credits;
  dispatchKey('KeyA'); // human sell 1
  const paid = ctx.world.credits - credits1;
  group('A1 216 -> 216, not 216 -> 248', {
    buyQuoteIs216: q.buy === 216 && cellUU('Provisions', CELL_BUY) === 216,
    fullSellChainStillIs248: q.sellRaw === 248,
    sellQuoteIs216: q.sell === 216 && cellUU('Provisions', CELL_SELL) === 216,
    actualChargedIs216: charged === 216,
    actualPaidIs216: paid === 216,
    roundTripIsFlat: ctx.world.credits === credits0,
    holdEmptied: held('provisions') === 0,
  }, { q, charged, paid });
  pinPanel('A2 auction panel: every row sell <= buy, cells match the chain');

  pinPrice('provisions', 216);
  roundTrip('A3 keyboard Q/A qty 1', 'provisions', 1, keys('KeyQ', 'Provisions', 1), keys('KeyA', 'Provisions', 1));
  pinPrice('provisions', 216);
  roundTrip('A4 keyboard W/S qty 5', 'provisions', 5, keys('KeyW', 'Provisions', 5), keys('KeyS', 'Provisions', 5));
  pinPrice('provisions', 216);
  roundTrip('A5 public handle qty 1', 'provisions', 1, api('buy'), api('sell'));
  pinPrice('provisions', 216);
  roundTrip('A6 public handle qty 5', 'provisions', 5, api('buy'), api('sell'));
  pinPrice('provisions', 216);
  roundTrip('A7 public handle qty 99', 'provisions', 99, api('buy'), api('sell'));
  pinPrice('provisions', 216);
  roundTrip('A8 buy 99+61, sell 50+50+50+10 (160 units)', 'provisions', 160,
    chunks('buy', [99, 61]), chunks('sell', [50, 50, 50, 10]));

  const before = ctx.world.credits;
  const refused = [0, -1, 100, 1.5, '5', null].map((qty) =>
    globalThis.window.rimward.act({ v: 2, name: 'trade', args: { commodity: 'provisions', qty, side: 'buy' } }));
  group('A9 public trade still validates 1..99', {
    allRefused: refused.every((r) => r?.ok === false),
    nothingSpent: ctx.world.credits === before,
    holdUntouched: held('provisions') === 0,
  }, { refused });
}

// ===== B. The cap is targeted, not a blanket sell = buy ====================
console.log('--- B. Beautiful Ones salon (sell x0.85) ---');
if (SALON && openMarketAt(SALON, 'B salon')) {
  fund(20);
  ctx.world.reputation.beautiful = 0;
  pinPrice('provisions', 200);
  const q = chainFor('provisions');
  group('B1 a below-par payer is untouched', {
    buyIsQuote: q.buy === 200 && cellUU('Provisions', CELL_BUY) === 200,
    sellIsDiscounted: q.sell === 170 && cellUU('Provisions', CELL_SELL) === 170,
    capDoesNotBind: q.capBinds === false && q.sell < q.buy,
  }, q);
  pinPrice('provisions', 200);
  roundTrip('B2 the loss-making round trip still costs UU', 'provisions', 5, api('buy'), api('sell'));
}

// ===== C. Faction service buy discount + standing goodwill ================
console.log('--- C. The Last Beacon (lamplighter buy x0.85) + top standing ---');
if (BEACON && openMarketAt(BEACON, 'C beacon')) {
  fund(120);
  ctx.world.reputation.lamplighter = 50; // TEST SETUP: tier 3 -> goodwill 1.06
  pinPrice('provisions', 200);
  const q = chainFor('provisions');
  group('C1 discounted counter, goodwill in the sell chain', {
    standingTierIsTop: rankFor(ctx.world.reputation.lamplighter).tier === 3,
    buyIsDiscounted: q.buy === 170,
    chainCarriesGoodwill: q.sellRaw === 212,
    cappedToBuy: q.sell === 170 && q.capBinds === true,
    panelAgrees: cellUU('Provisions', CELL_SELL) === 170,
  }, q);
  pinPrice('provisions', 200);
  roundTrip('C2 beacon round trip qty 99', 'provisions', 99, api('buy'), api('sell'));
  pinPanel('C3 beacon panel: every row sell <= buy');
}

// ===== D. Epics: a sell premium, and a discounted buy paired with one =====
console.log('--- D. Epic modifiers ---');
if (openMarketAt('freehold', 'D freehold')) {
  fund(20);
  ctx.world.epics.freehold = 4;      // TEST SETUP: capstone sellMult 1.15
  ctx.world.reputation.freehold = 50;
  pinPrice('provisions', 200);
  const q = chainFor('provisions');
  group('D1 freehold capstone sell premium capped at its own counter', {
    epicSellIs115: (epicEffects(ctx, 'freehold').sellMult ?? 1) === 1.15,
    buyIsPlainQuote: q.buy === 200,
    chainIsRicher: q.sellRaw === Math.round(200 * 1.15 * 1.06),
    cappedToBuy: q.sell === 200 && q.capBinds === true,
  }, q);
  pinPrice('provisions', 200);
  roundTrip('D2 freehold round trip qty 5 (keyboard)', 'provisions', 5,
    keys('KeyW', 'Provisions', 5), keys('KeyS', 'Provisions', 5));
}
if (openMarketAt('hollowreach', 'D hollowreach')) {
  fund(120);
  ctx.world.epics.hollow = 2;        // TEST SETUP: buyMult 0.9 AND sellMult 1.15
  ctx.world.reputation.hollow = 0;
  pinPrice('provisions', 200);
  const q = chainFor('provisions');
  group('D3 discounted epic buy paired with an epic sell premium', {
    epicPair: (epicEffects(ctx, 'hollow').buyMult ?? 1) === 0.9
      && (epicEffects(ctx, 'hollow').sellMult ?? 1) === 1.15,
    buyIsDiscounted: q.buy === 180,
    chainIsRicher: q.sellRaw === 230,
    cappedToBuy: q.sell === 180 && q.capBinds === true,
  }, q);
  pinPrice('provisions', 200);
  roundTrip('D4 hollowreach round trip qty 99', 'provisions', 99, api('buy'), api('sell'));
}

// ===== E. Hermit scarcity and the keeper-trust waiver at 60 ===============
console.log('--- E. The Vigil: keeper trust 59 vs 60, actual sell at the waived quote ---');
if (openMarketAt('verge', 'E verge')) {
  fund(120);
  const keeper = contactsForSystem(ctx, 'verge').find((c) => c.role === 'dockmaster') ?? null;
  pin('E0 verge keeper found', !!keeper);
  if (keeper) {
    ctx.world.epics.hollow = 2;
    ctx.world.reputation.hollow = 0;
    keeper.trust = KEEPER_COMP_TRUST - 1; // TEST SETUP: 59
    pinPrice('provisions', 200);
    const lo = chainFor('provisions');
    keeper.trust = KEEPER_COMP_TRUST;     // TEST SETUP: 60
    pinPrice('provisions', 200);
    const hi = chainFor('provisions');
    // The actual comped fill: buy one and sell it straight back at trust 60.
    const credits0 = ctx.world.credits;
    selectRow('Provisions');
    dispatchKey('KeyQ');
    const charged = credits0 - ctx.world.credits;
    const credits1 = ctx.world.credits;
    dispatchKey('KeyA');
    const paid = ctx.world.credits - credits1;
    group('E1 the waiver moves the buy quote and the sell fill follows it', {
      untrustedBuyHasScarcity: lo.buy === Math.round(200 * 0.9 * HERMIT.buyMult),
      trustedBuyIsComped: hi.buy === Math.round(200 * 0.9),
      waiverLowersBuy: hi.buy < lo.buy,
      hermitPremiumStillInChain: lo.sellRaw === Math.round(200 * 1.15 * HERMIT.sellMult)
        && hi.sellRaw === lo.sellRaw,
      bothCapped: lo.sell === lo.buy && hi.sell === hi.buy,
      actualChargedIsWaivedQuote: charged === hi.buy,
      actualPaidIsWaivedQuote: paid === hi.buy,
      flatRoundTrip: ctx.world.credits === credits0,
    }, { lo, hi, charged, paid, comp: KEEPER_COMP_TRUST });

    keeper.trust = KEEPER_COMP_TRUST - 1;
    pinPrice('provisions', 200);
    roundTrip('E2 uncomped hermit dock qty 99', 'provisions', 99, api('buy'), api('sell'));
    pinPanel('E3 hermit panel: every row sell <= buy');
  }
}

// ===== F. Restricted components: epic multiplier + fixer threshold ========
console.log('--- F. Redmarch: restrictedComponents, fixer trust 29 vs 30 ---');
if (openMarketAt('redmarch', 'F redmarch')) {
  fund(200);
  const fixer = contactsForSystem(ctx, 'redmarch').find((c) => c.role === 'fixer') ?? null;
  pin('F0 redmarch fixer found', !!fixer);
  if (fixer) {
    // TEST SETUP: Redledger capstone — buyMult 0.85 (stage 4) with
    // restrictedSellMult 1.1 (stage 1) — plus top standing.
    ctx.world.epics.redledger = 4;
    ctx.world.reputation.redledger = 50;
    const fx = epicEffects(ctx, 'redledger');
    const RC = COMMODITIES.restrictedComponents.name;

    fixer.trust = FIXER_CUT_TRUST - 1; // 29
    pinPrice('restrictedComponents', 400);
    const under = chainFor('restrictedComponents');
    fixer.trust = FIXER_CUT_TRUST;     // 30
    pinPrice('restrictedComponents', 400);
    const at = chainFor('restrictedComponents');
    group('F1 the fixer cut still crosses at 30; both sides stay capped', {
      epicPair: (fx.buyMult ?? 1) === 0.85 && (fx.restrictedSellMult ?? 1) === 1.1,
      buyIsDiscounted: under.buy === 340 && at.buy === 340,
      chainUnderCut: under.sellRaw === Math.round(400 * 1.06 * 1.1),
      chainAtCut: at.sellRaw === Math.round(400 * 1.06 * 1.1 * FIXER_MARKUP),
      cutRaisesTheChain: at.sellRaw > under.sellRaw,
      bothCappedToBuy: under.sell === 340 && at.sell === 340,
      panelAgrees: cellUU(RC, CELL_SELL) === 340 && cellUU(RC, CELL_BUY) === 340,
    }, { under, at, cut: FIXER_CUT_TRUST });

    // Stable at trust 30 across the quantity ladder (each sale bumps the
    // fixer, so the trust pin is restated before every leg).
    for (const qty of [1, 5, 99]) {
      fixer.trust = FIXER_CUT_TRUST;
      pinPrice('restrictedComponents', 400);
      roundTrip(`F2 restricted round trip at fixer trust 30, qty ${qty}`,
        'restrictedComponents', qty, api('buy'), api('sell'));
    }
    fixer.trust = FIXER_CUT_TRUST;
    pinPrice('restrictedComponents', 400);
    roundTrip('F3 restricted buy 99+61, sell 80+80 (160 units)', 'restrictedComponents', 160,
      chunks('buy', [99, 61]), chunks('sell', [80, 80]));
    pinPanel('F4 redmarch panel: every row sell <= buy');
  }
}

// ===== G. Rounding: low values and fractional source quotes ===============
console.log('--- G. Rounding boundaries ---');
if (openMarketAt(AUCTION ?? 'redmarch', 'G rounding')) {
  fund(120);
  ctx.world.reputation[SYSTEMS[ctx.world.currentSystem].faction] = 0;
  // TEST SETUP: market.js only writes integers, so a fractional quote can only
  // be planted. priceOf reads the table verbatim — the cap must hold on it.
  const boundaries = [1, 2, 3, 4, 7, 0.5, 1.4, 1.5, 2.5, 8.7, 216.49, 999.5];
  const bad = [];
  for (const price of boundaries) {
    pinPrice('provisions', price);
    const q = chainFor('provisions');
    if (cellUU('Provisions', CELL_BUY) !== q.buy) bad.push(`${price}:buycell`);
    if (cellUU('Provisions', CELL_SELL) !== q.sell) bad.push(`${price}:sellcell`);
    if (q.sell > q.buy) bad.push(`${price}:spread ${q.sell}>${q.buy}`);
    if (q.sell !== Math.min(q.sellRaw, q.buy)) bad.push(`${price}:notmin`);
    if (!Number.isInteger(q.buy) || !Number.isInteger(q.sell)) bad.push(`${price}:frac`);
  }
  pin('G1 every rounding boundary holds sell <= buy with integer fills',
    bad.length === 0, { bad, boundaries });
  pinPrice('provisions', 1);
  roundTrip('G2 a 1 UU commodity at qty 99', 'provisions', 99, api('buy'), api('sell'));
}

// ===== H. A real price difference between markets still pays ==============
console.log('--- H. Inter-market route profit ---');
{
  const origin = BEACON ?? 'freehold';
  const dest = AUCTION ?? 'redmarch';
  let leg = null;
  if (openMarketAt(origin, 'H origin')) {
    fund(120);
    ctx.world.reputation[SYSTEMS[origin].faction] = 0;
    pinPrice('provisions', 100); // TEST SETUP: a cheap origin market
    const q = chainFor('provisions');
    const credits0 = ctx.world.credits;
    api('buy')('provisions', 99);
    leg = { unit: q.buy, spent: credits0 - ctx.world.credits, held: held('provisions') };
  }
  if (leg && openMarketAt(dest, 'H destination')) {
    ctx.world.reputation[SYSTEMS[dest].faction] = 0;
    pinPrice('provisions', 300); // TEST SETUP: a rich destination market
    const q = chainFor('provisions');
    const credits0 = ctx.world.credits;
    api('sell')('provisions', 99);
    const paid = ctx.world.credits - credits0;
    group('H1 the haul still pays', {
      boughtAll: leg.held === 99,
      originUnitDiscounted: leg.unit === 85,
      spentExact: leg.spent === 85 * 99,
      destPaysItsQuote: q.sell === 300 && cellUU('Provisions', CELL_SELL) === 300,
      capDidNotBiteBelowOrigin: q.sell > leg.unit,
      paidExact: paid === 300 * 99,
      routeProfitable: paid > leg.spent,
      noticeTotal: noticeText() === `Sold 99 ${COMMODITIES.provisions.name} for ${300 * 99} UU.`,
      holdEmptied: held('provisions') === 0,
    }, { leg, paid, q, profit: paid - leg.spent });
  } else if (!leg) {
    pin('H1 the haul still pays', false, { reason: 'origin leg did not open' });
  }
}

console.log(errors === 0
  ? '\nISSUE-53 MARKET SPREAD PASS — sell <= buy per dock, quote == fill, routes intact'
  : `\nISSUE-53 MARKET SPREAD FAIL — ${errors} errors`);
process.exit(errors === 0 ? 0 : 1);
