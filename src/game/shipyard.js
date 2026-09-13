import { createShipState, SHIP_CLASSES, rankFor, cargoHoldFor, ECON, HULL_RESALE } from './state.js';
import { requestAutosave } from './save.js';
import {
  HANGAR_CAP,
  sanitizeHangar,
  sanitizeHangarRecord,
  canAcceptPurchase,
  addPurchasedHull,
  removeHangarRow,
} from './hangar.js';
import { hullPrizeValue, rollHullRate } from './prize.js';

/**
 * Authored yard catalog. Prices and min-rep live here, not on the save blob.
 * Beautiful Ones and Unknowables sell the full live class set as living hulls.
 */

export const YARD_LIST_UU = Object.freeze({
  light: 8000,
  cutter: 11000,
  heavy: 20000,
  ace: 28000,
  freighter: 24000,
  frigate: 80000,
});

/** Gilded graft list price. Frozen owner integer. */
export const GRAFT_LIST_UU = 4000;

const CORE_STOCK = Object.freeze(['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']);
export const LIVING_STOCK = Object.freeze(['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']);
const UNKNOWABLES_STOCK = LIVING_STOCK;

/** Other living stock keys. Same class is never a dest. */
export function livingTrainDests(fromClass) {
  if (typeof fromClass !== 'string' || !LIVING_STOCK.includes(fromClass)) return [];
  if (!hasOwn(SHIP_CLASSES, fromClass)) return [];
  const dests = [];
  for (const key of LIVING_STOCK) {
    if (key === fromClass) continue;
    if (!hasOwn(SHIP_CLASSES, key)) continue;
    dests.push(key);
  }
  return dests;
}

/** First dest in livingTrainDests, or null. */
export function livingTrainDest(fromClass) {
  const dests = livingTrainDests(fromClass);
  return dests.length ? dests[0] : null;
}

const YARD_STOCK = Object.freeze({
  freehold: CORE_STOCK,
  veridian: CORE_STOCK,
  redledger: CORE_STOCK,
  ferrous: CORE_STOCK,
  gilded: CORE_STOCK,
  assembly: CORE_STOCK,
  congregation: CORE_STOCK,
  lamplighter: CORE_STOCK,
  beautiful: LIVING_STOCK,
  unknowables: UNKNOWABLES_STOCK,
});

const MIN_REP = Object.freeze({
  light: 0,
  cutter: 0,
  heavy: 0,
  freighter: 0,
  ace: 10,
  frigate: 25,
});

let buyInFlight = false;

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

export function dockFactionOf(ctx) {
  const id = ctx?.world?.currentSystem;
  const raw = ctx?.systems?.[id]?.faction;
  return typeof raw === 'string' ? raw : '';
}

export function yardStockFor(faction) {
  if (typeof faction !== 'string' || !hasOwn(YARD_STOCK, faction)) return [];
  const list = YARD_STOCK[faction];
  return Array.isArray(list) ? list.slice() : [];
}

export function hullKindFor(faction) {
  if (faction === 'beautiful' || faction === 'unknowables') return 'living';
  return 'built';
}

export function minRepFor(classKey) {
  if (!hasOwn(MIN_REP, classKey)) return 0;
  const n = MIN_REP[classKey];
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export function dockReputation(ctx, faction) {
  const bag = ctx?.world?.reputation;
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return 0;
  if (typeof faction !== 'string' || !hasOwn(bag, faction)) return 0;
  const n = bag[faction];
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export function yardPrice(classKey, rep) {
  if (!hasOwn(YARD_LIST_UU, classKey)) return null;
  const list = YARD_LIST_UU[classKey];
  if (!Number.isFinite(list) || list < 0) return null;
  const rank = rankFor(typeof rep === 'number' && Number.isFinite(rep) ? rep : 0);
  let disc = 0;
  if (rank.tier >= 3) disc = 0.15;
  else if (rank.tier >= 2) disc = 0.1;
  else if (rank.tier >= 1) disc = 0.05;
  return Math.round(list * (1 - disc));
}

/** Train debit. Reuses live dest yardPrice. No new integer. */
export function trainListPrice(beautifulRep, dest) {
  if (typeof dest !== 'string' || !LIVING_STOCK.includes(dest)) return null;
  return yardPrice(dest, beautifulRep);
}

export function canReleaseSku(classKey, hullKind) {
  if (!hasOwn(SHIP_CLASSES, classKey)) return false;
  return hullKind === 'living' || hullKind === 'built';
}

export function listYardOffers(ctx) {
  const faction = dockFactionOf(ctx);
  const stock = yardStockFor(faction);
  const offers = [];
  for (const classKey of stock) {
    if (!hasOwn(SHIP_CLASSES, classKey)) continue;
    if (!hasOwn(YARD_LIST_UU, classKey)) continue;
    offers.push({
      classKey,
      minRep: minRepFor(classKey),
      hullKind: hullKindFor(faction),
    });
  }
  return offers;
}

function nextHullId(hangar, classKey) {
  const used = new Set();
  for (const row of hangar?.hulls ?? []) {
    if (typeof row?.id === 'string') used.add(row.id);
  }
  const stem = typeof classKey === 'string' && /^[a-z0-9_]+$/i.test(classKey) ? classKey : 'hull';
  for (let i = 1; i < 100; i++) {
    const id = `hull_${stem}_${i}`;
    if (!used.has(id)) return id;
  }
  for (let n = 1; n < 1000; n++) {
    const id = `hull_yard_${n}`;
    if (!used.has(id)) return id;
  }
  return null;
}

function buildStockRow(ctx, classKey, faction, hullKind) {
  const hangar = ctx.world?.hangar;
  const id = nextHullId(hangar, classKey);
  if (!id) return null;
  const fresh = createShipState(classKey, { name: classKey, faction });
  const raw = {
    id,
    hullKind,
    faction,
    classKey,
    name: classKey,
    scanner: 0,
    miningLaser: 0,
    concealedMounts: false,
    launcher: '',
    missileAmmo: 0,
    turret: '',
    cargoCapacity: cargoHoldFor(classKey),
    cargo: [],
    hull: fresh.hull,
    hullMax: fresh.hullMax,
    screen: fresh.screen,
    screenMax: fresh.screenMax,
    shell: fresh.shell,
    shellMax: fresh.shellMax,
    engine: fresh.engine,
    engineMax: fresh.engineMax,
    heat: 0,
  };
  const rec = sanitizeHangarRecord(raw);
  if (!rec) return null;
  if (faction === 'unknowables') rec.hullKind = 'living';
  return rec;
}

function purchaseYardHullUnlocked(ctx, classKey) {
  if (!ctx?.world || !ctx.flags?.docked) return { ok: false, reason: 'dock' };
  if (typeof classKey !== 'string' || !hasOwn(SHIP_CLASSES, classKey)) {
    return { ok: false, reason: 'stock' };
  }
  const faction = dockFactionOf(ctx);
  const stock = yardStockFor(faction);
  if (!stock.includes(classKey)) return { ok: false, reason: 'stock' };
  const hullKind = hullKindFor(faction);
  if (faction === 'unknowables' && hullKind !== 'living') {
    return { ok: false, reason: 'release' };
  }
  if (!canReleaseSku(classKey, hullKind)) return { ok: false, reason: 'release' };

  sanitizeHangar(ctx);
  if (!canAcceptPurchase(ctx)) return { ok: false, reason: 'full' };

  const rep = dockReputation(ctx, faction);
  if (rep < 0 || rep < minRepFor(classKey)) return { ok: false, reason: 'reputation' };

  const price = yardPrice(classKey, rep);
  if (price == null || !Number.isInteger(price) || price < 0) {
    return { ok: false, reason: 'stock' };
  }
  const credits = ctx.world.credits;
  if (typeof credits !== 'number' || !Number.isFinite(credits) || credits < price) {
    return { ok: false, reason: 'credits' };
  }

  const row = buildStockRow(ctx, classKey, faction, hullKind);
  if (!row) return { ok: false, reason: 'release' };
  if (faction === 'unknowables' && row.hullKind !== 'living') {
    return { ok: false, reason: 'release' };
  }
  if (row.classKey !== classKey) return { ok: false, reason: 'release' };

  const mountedId = ctx.world.hangar.mountedId;
  const added = addPurchasedHull(ctx, row);
  if (!added.ok) return { ok: false, reason: added.reason === 'full' ? 'full' : 'release' };
  if (ctx.world.hangar.mountedId !== mountedId) ctx.world.hangar.mountedId = mountedId;

  ctx.world.credits = credits - price;
  if (!(ctx.world.credits >= 0)) ctx.world.credits = 0;

  requestAutosave(ctx);
  return { ok: true, price, row: added.row };
}

/** Add a stock hangar row. Does not remount. One debit. */
export function purchaseYardHull(ctx, classKey) {
  if (buyInFlight) return { ok: false, reason: 'busy' };
  buyInFlight = true;
  try {
    return purchaseYardHullUnlocked(ctx, classKey);
  } finally {
    buyInFlight = false;
  }
}

// ---------- Issue #158: sell an owned hull from the hangar ----------

/** Living hulls are traded where living hulls are sold. */
const LIVING_YARDS = Object.freeze(['beautiful', 'unknowables']);
/** A grafted plated hull is traded only by the yard that grafts. */
const GRAFT_YARDS = Object.freeze(['gilded']);

/** Clamp a hot-hull rate into ECON.hotHullFence; a bad rate rolls fresh. */
export function clampHotRate(rate) {
  const [lo, hi] = ECON.hotHullFence;
  if (typeof rate !== 'number' || !Number.isFinite(rate)) return rollHullRate();
  return Math.min(hi, Math.max(lo, rate));
}

/**
 * Why THIS yard will not quote THIS row, or null when it will. Reads the dock
 * banner only; the mounted check lives in sellHangarHull (the pane never
 * offers the mounted row).
 */
export function hullResaleRefusal(ctx, row) {
  if (!row || typeof row !== 'object') return 'missing';
  const faction = dockFactionOf(ctx);
  if (yardStockFor(faction).length === 0) return 'stock';
  if (!hasOwn(YARD_LIST_UU, row.classKey)) return 'stock';
  if (row.hot === true) return null;
  if (row.grafted === true && !GRAFT_YARDS.includes(faction)) return 'grafted';
  if (row.hullKind === 'living' && !LIVING_YARDS.includes(faction)) return 'living';
  return null;
}

/**
 * The yard's offer for one hangar row: { price, kind, rate } or null when
 * refused. kind 'home' = HULL_RESALE.homeRate of the class list (the row
 * flies this yard's banner), 'foreign' = foreignRate, 'hot' =
 * ECON.hotHullFence x the prize book (hullPrizeValue); the hot rate is
 * supplied by the caller so a shown quote is the paid quote.
 */
export function hullResaleQuote(ctx, row, hotRate) {
  if (hullResaleRefusal(ctx, row) !== null) return null;
  if (row.hot === true) {
    const rate = clampHotRate(hotRate);
    return { price: Math.max(0, Math.round(hullPrizeValue(row.classKey) * rate)), kind: 'hot', rate };
  }
  const list = YARD_LIST_UU[row.classKey];
  if (!Number.isFinite(list) || list < 0) return null;
  const home = dockFactionOf(ctx) === row.faction;
  const rate = home ? HULL_RESALE.homeRate : HULL_RESALE.foreignRate;
  return { price: Math.max(0, Math.round(list * rate)), kind: home ? 'home' : 'foreign', rate };
}

let sellInFlight = false;

function sellHangarHullUnlocked(ctx, id, opts) {
  if (!ctx?.world || !ctx.flags?.docked) return { ok: false, reason: 'dock' };
  if (ctx.flags?.combat) return { ok: false, reason: 'combat' };
  if (ctx.gate?.jumping) return { ok: false, reason: 'jump' };
  if (ctx.player?.destroyed) return { ok: false, reason: 'destroyed' };
  if (ctx.flags?.paused) return { ok: false, reason: 'paused' };
  sanitizeHangar(ctx);
  const hangar = ctx.world.hangar;
  if (!hangar || !Array.isArray(hangar.hulls)) return { ok: false, reason: 'missing' };
  if (typeof id !== 'string') return { ok: false, reason: 'missing' };
  const row = hangar.hulls.find((h) => h.id === id);
  if (!row) return { ok: false, reason: 'missing' };
  if (hangar.mountedId === id) return { ok: false, reason: 'mounted' };
  const refusal = hullResaleRefusal(ctx, row);
  if (refusal) return { ok: false, reason: refusal };
  const quote = hullResaleQuote(ctx, row, opts?.hotRate);
  if (!quote || !Number.isInteger(quote.price) || quote.price < 0) {
    return { ok: false, reason: 'stock' };
  }
  const credits = ctx.world.credits;
  const purse = typeof credits === 'number' && Number.isFinite(credits) ? credits : 0;

  const removed = removeHangarRow(ctx, id);
  if (!removed.ok) return { ok: false, reason: removed.reason === 'mounted' ? 'mounted' : 'missing' };
  ctx.world.credits = purse + quote.price;

  const sold = removed.row;
  const name = sold.name || sold.classKey;
  const systemId = ctx.world.currentSystem;
  const line = quote.kind === 'hot'
    ? `Yard takes ${name} off your hands. ${quote.price} UU, no questions.`
    : `Yard buys ${name}. ${quote.price} UU.`;
  const receipt = {
    hullId: sold.id,
    name,
    classKey: sold.classKey,
    faction: sold.faction,
    hullKind: sold.hullKind === 'living' ? 'living' : 'built',
    grafted: sold.grafted === true,
    hot: sold.hot === true,
    kind: quote.kind,
    credits: quote.price,
    system: typeof systemId === 'string' ? systemId : null,
    line,
  };
  if (typeof ctx.emit === 'function') {
    ctx.emit('hullSold', receipt);
    ctx.emit('commLine', { text: line, from: 'station' });
  }
  requestAutosave(ctx);
  return { ok: true, price: quote.price, kind: quote.kind, row: sold, receipt };
}

/**
 * Sell one UNMOUNTED hangar row to this yard. One credit. Equipment and hold
 * aboard the row go with it. opts.hotRate fixes the hot-hull roll so the
 * pane's quote is the paid amount. Never remounts; the mirrors belong to the
 * mounted hull, which is never sold.
 */
export function sellHangarHull(ctx, id, opts) {
  if (sellInFlight) return { ok: false, reason: 'busy' };
  sellInFlight = true;
  try {
    return sellHangarHullUnlocked(ctx, id, opts);
  } finally {
    sellInFlight = false;
  }
}

export { HANGAR_CAP };
