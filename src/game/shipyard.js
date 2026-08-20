import { createShipState, SHIP_CLASSES, rankFor } from './state.js';
import { requestAutosave } from './save.js';
import {
  HANGAR_CAP,
  sanitizeHangar,
  sanitizeHangarRecord,
  canAcceptPurchase,
  addPurchasedHull,
} from './hangar.js';

/**
 * Authored yard catalog. Prices and min-rep live here, not on the save blob.
 * Plated CORE_STOCK includes frigate (Trusted). Beautiful Ones and Unknowables omit it.
 */

export const YARD_LIST_UU = Object.freeze({
  light: 8000,
  cutter: 11000,
  heavy: 20000,
  ace: 28000,
  freighter: 24000,
  frigate: 80000,
});

const CORE_STOCK = Object.freeze(['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']);
const LIVING_STOCK = Object.freeze(['light', 'cutter', 'heavy']);
const UNKNOWABLES_STOCK = Object.freeze(['light']);

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
    cargoCapacity: 20,
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

export { HANGAR_CAP };
