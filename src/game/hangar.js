import { createShipState, SHIP_CLASSES, FACTIONS, cargoHoldFor, cargoHoldMax, HOLD_RACK_STEP } from './state.js';
import {
  sanitizeCargoList,
  sanitizeFaction,
  stripControlChars,
  requestAutosave,
  SAFE_ID,
  ID_MAX,
  NAME_MAX,
} from './save.js';
import {
  isLauncherId,
  isTurretId,
  healMissileAmmo,
  canSeat,
} from './weapon-fit.js';
import { GRAFT_LIST_UU, livingTrainDests, minRepFor, trainListPrice } from './shipyard.js';

/**
 * Hangar persist + switch helpers — JSON-plain hull rows on ctx.world.hangar.
 * Wave 64: sanitize, park, starter migrate, player hullKind allowlist, switchTo.
 * Outfitter writes mounted-row gear, then mirrors to world. Envelope is authored
 * SHIP_CLASSES numbers. Mesh remount lives in ship.js. No THREE. SHP owns
 * player.hullKind; HUD reads only.
 */

export const HANGAR_CAP = 8;
const STARTER_ID = 'hull_starter';
const GIFT_HULL_ID = 'hull_seed_gift';
const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

function own(raw, key) {
  return Object.prototype.hasOwnProperty.call(raw, key) ? raw[key] : undefined;
}

function classKeyOf(value) {
  return Object.prototype.hasOwnProperty.call(SHIP_CLASSES, value) ? value : 'light';
}

function healScanner(value) {
  return [0, 1, 2].includes(value) ? value : 0;
}

function healMiningLaser(value) {
  return [0, 1, 2, 3].includes(value) ? value : 0;
}

function healConcealed(value) {
  return value === true;
}

function healLauncher(classKey, value) {
  if (!canSeat(classKey, 'missile')) return '';
  return isLauncherId(value) ? value : '';
}

function healTurret(classKey, value) {
  if (!canSeat(classKey, 'turret')) return '';
  return isTurretId(value) ? value : '';
}

function healCargoCapacity(value, classKey) {
  const floor = cargoHoldFor(classKey);
  const max = cargoHoldMax(classKey);
  if (typeof value !== 'number' || !Number.isFinite(value)) return floor;
  let n = value;
  if (n < floor) {
    const racks = Math.max(0, Math.round((n - 20) / HOLD_RACK_STEP) * HOLD_RACK_STEP);
    n = floor + Math.min(racks, HOLD_RACK_STEP * 2);
  }
  if (n < floor) n = floor;
  if (n > max) n = max;
  return n;
}

function trimCargoToCapacity(list, cap) {
  const out = [];
  let used = 0;
  for (const row of list) {
    if (used >= cap) break;
    const take = Math.min(row.units, cap - used);
    if (take <= 0) continue;
    if (take === row.units) out.push(row);
    else out.push({ ...row, units: take });
    used += take;
  }
  return out;
}

function graftedOwnTrue(obj) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, 'grafted') && obj.grafted === true;
}

function applyUnknowablesKind(obj, faction) {
  if (faction === 'unknowables') {
    obj.hullKind = 'living';
    delete obj.grafted;
  }
}

/** grafted: true only. Living / Unknowables never keep the flag. */
function applyGraftedAllowlist(row, raw) {
  if (graftedOwnTrue(raw)) row.grafted = true;
  if (row.hullKind === 'living') delete row.grafted;
  applyUnknowablesKind(row, row.faction);
}

function copyGraftedFromRow(p, row) {
  if (graftedOwnTrue(row)) p.grafted = true;
  else delete p.grafted;
  if (p.hullKind === 'living' || p.faction === 'unknowables') delete p.grafted;
}

function healPlayerGrafted(p) {
  if (!graftedOwnTrue(p)) delete p.grafted;
  if (p.hullKind === 'living' || p.faction === 'unknowables') delete p.grafted;
}

/** Patrol hunt floor. Same value as npc.js HOSTILE_STANDING (not exported). */
const HOSTILE_STANDING = -10;

function dockBannerOf(ctx) {
  const id = ctx?.world?.currentSystem;
  const raw = ctx?.systems?.[id]?.faction;
  return typeof raw === 'string' ? raw : '';
}

function standingOf(ctx, faction) {
  const bag = ctx?.world?.reputation;
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return 0;
  if (typeof faction !== 'string' || !Object.prototype.hasOwnProperty.call(bag, faction)) return 0;
  if (RESERVED_IDS.has(faction)) return 0;
  const n = bag[faction];
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

/** True when any sanitized hangar row still owns grafted: true. */
export function anyGrafted(ctx) {
  const hulls = ctx?.world?.hangar?.hulls;
  if (!Array.isArray(hulls)) return false;
  for (const row of hulls) {
    if (graftedOwnTrue(row)) return true;
  }
  return false;
}

/** Cap Beautiful standing at HOSTILE_STANDING while any grafted row remains. */
export function applyAbominationStanding(ctx) {
  if (!anyGrafted(ctx)) return;
  const world = ctx.world;
  if (!world) return;
  let bag = world.reputation;
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) {
    bag = {};
    world.reputation = bag;
  }
  const key = 'beautiful';
  if (RESERVED_IDS.has(key)) return;
  if (!Object.prototype.hasOwnProperty.call(FACTIONS, key)) return;
  const raw = Object.prototype.hasOwnProperty.call(bag, key) ? bag[key] : 0;
  const current = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
  bag[key] = Math.min(current, HOSTILE_STANDING);
}

function sanitizeName(value, classKey) {
  if (typeof value !== 'string') return SHIP_CLASSES[classKey]?.role ?? 'hull';
  const cleaned = stripControlChars(value).trim().slice(0, NAME_MAX);
  return cleaned || (SHIP_CLASSES[classKey]?.role ?? 'hull');
}

function isSafeHullId(value) {
  if (typeof value !== 'string' || !value || value.length > ID_MAX) return false;
  if (RESERVED_IDS.has(value)) return false;
  return SAFE_ID.test(value);
}

function vitalsFromClass(classKey, raw) {
  const fresh = createShipState(classKey);
  const out = {
    hullMax: fresh.hullMax,
    screenMax: fresh.screenMax,
    shellMax: fresh.shellMax,
    engineMax: fresh.engineMax,
  };
  for (const k of ['hull', 'screen', 'shell', 'engine']) {
    const n = raw && typeof raw[k] === 'number' && Number.isFinite(raw[k]) ? raw[k] : fresh[k];
    out[k] = Math.min(n, out[k + 'Max']);
  }
  const heat = raw && typeof raw.heat === 'number' && Number.isFinite(raw.heat) && raw.heat >= 0
    ? raw.heat
    : 0;
  out.heat = heat;
  return out;
}

/** True when hangar can take one more purchased row. */
export function canAcceptPurchase(ctx) {
  if (!ctx?.world) return false;
  sanitizeHangar(ctx);
  const hulls = ctx.world.hangar?.hulls;
  return Array.isArray(hulls) && hulls.length < HANGAR_CAP;
}

/** Park the live mount, then append a sanitized row. Does not remount. */
export function addPurchasedHull(ctx, raw) {
  sanitizeHangar(ctx);
  const rec = sanitizeHangarRecord(raw);
  if (!rec) return { ok: false, reason: 'invalid' };
  const hangar = ctx.world.hangar;
  if (!hangar || !Array.isArray(hangar.hulls) || hangar.hulls.length >= HANGAR_CAP) {
    return { ok: false, reason: 'full' };
  }
  parkMounted(ctx);
  hangar.hulls.push(rec);
  return { ok: true, row: rec };
}

/** Fresh allowlisted hull row, or null if the id is unusable. */
export function sanitizeHangarRecord(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = own(raw, 'id');
  if (!isSafeHullId(id)) return null;
  const classKey = classKeyOf(own(raw, 'classKey'));
  const factionRaw = sanitizeFaction(own(raw, 'faction'));
  const faction = (factionRaw && !RESERVED_IDS.has(factionRaw)) ? factionRaw : 'independent';
  const vitals = vitalsFromClass(classKey, raw);
  const cargoCapacity = healCargoCapacity(own(raw, 'cargoCapacity'), classKey);
  const launcher = healLauncher(classKey, own(raw, 'launcher'));
  const turret = healTurret(classKey, own(raw, 'turret'));
  const row = {
    id,
    faction,
    classKey,
    name: sanitizeName(own(raw, 'name'), classKey),
    scanner: healScanner(own(raw, 'scanner')),
    miningLaser: healMiningLaser(own(raw, 'miningLaser')),
    concealedMounts: healConcealed(own(raw, 'concealedMounts')),
    launcher,
    turret,
    missileAmmo: healMissileAmmo(launcher, own(raw, 'missileAmmo')),
    cargoCapacity,
    cargo: trimCargoToCapacity(sanitizeCargoList(own(raw, 'cargo')), cargoCapacity),
    ...vitals,
  };
  const kind = own(raw, 'hullKind');
  if (kind === 'living' || kind === 'built') row.hullKind = kind;
  applyGraftedAllowlist(row, raw);
  return row;
}

function packLiveHull(ctx, rowId) {
  const p = ctx.player;
  const world = ctx.world ?? {};
  const classKey = classKeyOf(p?.classKey);
  const factionRaw = sanitizeFaction(p?.faction);
  const faction = (factionRaw && !RESERVED_IDS.has(factionRaw)) ? factionRaw : 'independent';
  const raw = {
    id: rowId,
    faction,
    classKey,
    name: typeof world.shipName === 'string' ? world.shipName : p?.name,
    scanner: world.scanner,
    miningLaser: world.miningLaser,
    concealedMounts: world.concealedMounts,
    launcher: world.launcher,
    missileAmmo: world.missileAmmo,
    turret: world.turret,
    cargoCapacity: ctx.cargoCapacity,
    cargo: ctx.cargo,
    hull: p?.hull,
    hullMax: p?.hullMax,
    screen: p?.screen,
    screenMax: p?.screenMax,
    shell: p?.shell,
    shellMax: p?.shellMax,
    engine: p?.engine,
    engineMax: p?.engineMax,
    heat: p?.heat,
    hullKind: p?.hullKind,
  };
  if (graftedOwnTrue(p)) raw.grafted = true;
  return sanitizeHangarRecord(raw);
}

function buildStarterRow(ctx, { stock = false } = {}) {
  const p = ctx.player;
  const world = ctx.world ?? {};
  const classKey = classKeyOf(p?.classKey);
  const factionRaw = sanitizeFaction(p?.faction);
  const faction = (factionRaw && !RESERVED_IDS.has(factionRaw)) ? factionRaw : 'independent';
  const raw = {
    id: STARTER_ID,
    faction,
    classKey,
    name: typeof world.shipName === 'string' ? world.shipName : p?.name,
    scanner: stock ? 0 : world.scanner,
    miningLaser: stock ? 0 : world.miningLaser,
    concealedMounts: stock ? false : world.concealedMounts,
    cargoCapacity: stock ? cargoHoldFor(classKey) : ctx.cargoCapacity,
    cargo: stock ? [] : ctx.cargo,
    hull: p?.hull,
    hullMax: p?.hullMax,
    screen: p?.screen,
    screenMax: p?.screenMax,
    shell: p?.shell,
    shellMax: p?.shellMax,
    engine: p?.engine,
    engineMax: p?.engineMax,
    heat: p?.heat,
    hullKind: 'living',
  };
  const row = sanitizeHangarRecord(raw);
  if (row) {
    row.hullKind = 'living';
    delete row.grafted;
    applyUnknowablesKind(row, row.faction);
    return row;
  }
  const fallback = sanitizeHangarRecord({
    id: STARTER_ID,
    hullKind: 'living',
    faction: 'independent',
    classKey: 'light',
  });
  fallback.hullKind = 'living';
  delete fallback.grafted;
  return fallback;
}

function capHulls(rows, mountedId) {
  if (rows.length <= HANGAR_CAP) return rows;
  const extra = [];
  for (const row of rows) {
    if (row.id === mountedId) continue;
    extra.push(row);
    if (extra.length >= HANGAR_CAP - 1) break;
  }
  const keep = new Set([mountedId, ...extra.map((r) => r.id)]);
  return rows.filter((r) => keep.has(r.id));
}

function writeStarterHangar(ctx, { stock = false } = {}) {
  const starter = buildStarterRow(ctx, { stock });
  ctx.world.hangar = { mountedId: starter.id, hulls: [starter] };
  // Starter migrate is living. Align the player so a later park cannot wipe it.
  if (ctx.player) {
    ctx.player.hullKind = 'living';
    delete ctx.player.grafted;
  }
  return starter;
}

/**
 * Rebuild ctx.world.hangar to `{ mountedId, hulls }`.
 * Missing / empty hangar → one living starter from live player + world mirrors.
 */
export function sanitizeHangar(ctx) {
  if (!ctx.world) return;
  const rawHangar = ctx.world.hangar;
  if (!rawHangar || typeof rawHangar !== 'object' || Array.isArray(rawHangar)) {
    writeStarterHangar(ctx, { stock: false });
    applyAbominationStanding(ctx);
    return;
  }
  const src = own(rawHangar, 'hulls');
  if (!Array.isArray(src)) {
    writeStarterHangar(ctx, { stock: false });
    applyAbominationStanding(ctx);
    return;
  }
  const seen = new Set();
  const rows = [];
  for (const item of src) {
    const rec = sanitizeHangarRecord(item);
    if (!rec) continue;
    if (seen.has(rec.id)) continue;
    seen.add(rec.id);
    rows.push(rec);
  }
  if (rows.length === 0) {
    writeStarterHangar(ctx, { stock: false });
    applyAbominationStanding(ctx);
    return;
  }
  const want = own(rawHangar, 'mountedId');
  let mountedId = typeof want === 'string' && seen.has(want) ? want : rows[0].id;
  const hulls = capHulls(rows, mountedId);
  if (!hulls.some((r) => r.id === mountedId)) mountedId = hulls[0].id;
  ctx.world.hangar = { mountedId, hulls };
  applyAbominationStanding(ctx);
}

/** Missing hangar → one living starter. Existing hangar is sanitized. */
export function ensureHangar(ctx) {
  sanitizeHangar(ctx);
}

/** Copy live mounted hull into its hangar row. JSON only. */
export function parkMounted(ctx) {
  const hangar = ctx.world?.hangar;
  if (!hangar || !Array.isArray(hangar.hulls)) return;
  const packed = packLiveHull(ctx, hangar.mountedId);
  if (!packed) return;
  const idx = hangar.hulls.findIndex((h) => h.id === hangar.mountedId);
  if (idx < 0) hangar.hulls.unshift(packed);
  else hangar.hulls[idx] = packed;
}

/**
 * Player hullKind allowlist. Extra tokens deleted. Unknowables → living.
 * Live hold is ctx.cargo — drop player.cargo if present.
 */
export function healPlayerHullKind(ctx) {
  const p = ctx.player;
  if (!p) return;
  p.classKey = classKeyOf(p.classKey);
  const factionRaw = sanitizeFaction(p.faction);
  p.faction = (factionRaw && !RESERVED_IDS.has(factionRaw)) ? factionRaw : 'independent';
  if (p.hullKind !== 'living' && p.hullKind !== 'built') delete p.hullKind;
  if (p.faction === 'unknowables') p.hullKind = 'living';
  healPlayerGrafted(p);
  if (Object.prototype.hasOwnProperty.call(p, 'cargo')) delete p.cargo;
  if (Object.prototype.hasOwnProperty.call(p, 'hangarId')) delete p.hangarId;
  if (Object.prototype.hasOwnProperty.call(p, 'launcher')) delete p.launcher;
  if (Object.prototype.hasOwnProperty.call(p, 'turret')) delete p.turret;
  if (Object.prototype.hasOwnProperty.call(p, 'missileAmmo')) delete p.missileAmmo;
}

/** After hangar sanitize: mounted row identity wins on the player. */
export function syncMountedToPlayer(ctx) {
  const p = ctx.player;
  const hangar = ctx.world?.hangar;
  if (!p || !hangar || !Array.isArray(hangar.hulls)) return;
  const row = hangar.hulls.find((h) => h.id === hangar.mountedId);
  if (!row) return;
  p.faction = row.faction;
  p.classKey = row.classKey;
  if (row.hullKind === 'living' || row.hullKind === 'built') p.hullKind = row.hullKind;
  else delete p.hullKind;
  if (row.faction === 'unknowables' || p.faction === 'unknowables') p.hullKind = 'living';
  copyGraftedFromRow(p, row);
  if (!Array.isArray(ctx.cargo)) ctx.cargo = [];
  else ctx.cargo.length = 0;
  for (const item of row.cargo) ctx.cargo.push({ ...item });
  ctx.cargoCapacity = row.cargoCapacity;
}

function mirrorStarterGear(ctx, starter) {
  ctx.world.scanner = starter.scanner;
  ctx.world.miningLaser = starter.miningLaser;
  ctx.world.concealedMounts = starter.concealedMounts;
  ctx.world.launcher = starter.launcher;
  ctx.world.missileAmmo = starter.missileAmmo;
  ctx.world.turret = starter.turret;
}

function mountedHangarRow(ctx) {
  const hangar = ctx.world?.hangar;
  if (!hangar || !Array.isArray(hangar.hulls)) return null;
  return hangar.hulls.find((h) => h.id === hangar.mountedId) ?? null;
}

/** Hangar row wins. Missing hangar / starter rebuild force empty racks. */
export function syncMountedWeaponMirrors(ctx) {
  const world = ctx?.world;
  if (!world) return;
  const row = mountedHangarRow(ctx);
  if (!row) {
    world.launcher = '';
    world.missileAmmo = 0;
    world.turret = '';
    return;
  }
  world.launcher = row.launcher;
  world.missileAmmo = row.missileAmmo;
  world.turret = row.turret;
}

/**
 * Write allowlisted scanner / miningLaser / concealedMounts / cargoCapacity
 * plus launcher / missileAmmo / turret on the mounted hangar row, then mirror
 * those fields to world (and hold). Unknown patch keys are ignored. Does not
 * remount. Does not write combat stats. Does not accept loadout.
 */
export function writeMountedGear(ctx, patch) {
  if (!ctx?.world || !patch || typeof patch !== 'object' || Array.isArray(patch)) return null;
  ensureHangar(ctx);
  const row = mountedHangarRow(ctx);
  if (!row) return null;
  if (Object.prototype.hasOwnProperty.call(patch, 'scanner')) {
    row.scanner = healScanner(patch.scanner);
    ctx.world.scanner = row.scanner;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'miningLaser')) {
    row.miningLaser = healMiningLaser(patch.miningLaser);
    ctx.world.miningLaser = row.miningLaser;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'concealedMounts')) {
    row.concealedMounts = healConcealed(patch.concealedMounts);
    ctx.world.concealedMounts = row.concealedMounts;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'cargoCapacity')) {
    row.cargoCapacity = healCargoCapacity(patch.cargoCapacity, row.classKey);
    row.cargo = trimCargoToCapacity(sanitizeCargoList(row.cargo), row.cargoCapacity);
    ctx.cargoCapacity = row.cargoCapacity;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'launcher')) {
    row.launcher = healLauncher(row.classKey, patch.launcher);
    ctx.world.launcher = row.launcher;
    row.missileAmmo = healMissileAmmo(row.launcher, row.missileAmmo);
    ctx.world.missileAmmo = row.missileAmmo;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'missileAmmo')) {
    row.missileAmmo = healMissileAmmo(row.launcher, patch.missileAmmo);
    ctx.world.missileAmmo = row.missileAmmo;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'turret')) {
    row.turret = healTurret(row.classKey, patch.turret);
    ctx.world.turret = row.turret;
  }
  return row;
}

/**
 * Decrement mounted hangar missileAmmo and the world mirror together.
 * n must be a positive integer. No hangar / no row / empty launcher / bad n
 * spend 0. Does not add heat.
 */
export function spendMissileAmmo(ctx, n) {
  if (!Number.isInteger(n) || n <= 0) return 0;
  const row = mountedHangarRow(ctx);
  if (!row) return 0;
  if (row.launcher === '') return 0;
  const have = healMissileAmmo(row.launcher, row.missileAmmo);
  const spent = Math.min(n, have);
  row.missileAmmo = have - spent;
  if (ctx.world) ctx.world.missileAmmo = row.missileAmmo;
  return spent;
}

const LIGHT_ACCEL_PER_CRUISE = 90 / 120;

let remountImpl = null;

/** ship.js registers mesh remount. Hangar stays THREE-free. */
export function registerPlayerRemount(fn) {
  remountImpl = typeof fn === 'function' ? fn : null;
}

function callRemount(ctx) {
  if (!remountImpl) return;
  remountImpl(ctx);
}

/**
 * Copy authored SHIP_CLASSES onto ctx.config.ship.
 * Do not persist this object. Do not read cruise/burn/creep/stopTime off a hangar row.
 */
export function applyFlightEnvelope(ctx, classKey) {
  const key = classKeyOf(classKey);
  const cls = SHIP_CLASSES[key];
  const ship = ctx.config?.ship;
  if (!cls || !ship) return key;
  ship.maxSpeed = cls.cruise;
  ship.creep = cls.creep;
  if (!ship.afterburner || typeof ship.afterburner !== 'object') {
    ship.afterburner = { multiplier: 2, burnTime: 6, cooldown: 8 };
  }
  ship.afterburner.multiplier = cls.cruise > 0 ? cls.burn / cls.cruise : 2;
  const stop = cls.stopTime > 0 ? cls.stopTime : 2;
  ship.damping = 1 / stop;
  ship.acceleration = cls.cruise * LIGHT_ACCEL_PER_CRUISE;
  return key;
}

function copyShipCfg(cfg) {
  if (!cfg) return null;
  return {
    maxSpeed: cfg.maxSpeed,
    creep: cfg.creep,
    acceleration: cfg.acceleration,
    damping: cfg.damping,
    afterburner: cfg.afterburner && typeof cfg.afterburner === 'object'
      ? { ...cfg.afterburner }
      : null,
  };
}

function restoreShipCfg(ship, snap) {
  if (!ship || !snap) return;
  if (snap.maxSpeed !== undefined) ship.maxSpeed = snap.maxSpeed;
  if (snap.creep !== undefined) ship.creep = snap.creep;
  if (snap.acceleration !== undefined) ship.acceleration = snap.acceleration;
  if (snap.damping !== undefined) ship.damping = snap.damping;
  if (snap.afterburner && ship.afterburner) Object.assign(ship.afterburner, snap.afterburner);
}

function captureSwitch(ctx) {
  const hangar = ctx.world?.hangar;
  return {
    player: ctx.player ? { ...ctx.player } : null,
    cargo: Array.isArray(ctx.cargo) ? ctx.cargo.map((row) => ({ ...row })) : [],
    cargoCapacity: ctx.cargoCapacity,
    hangar: hangar ? JSON.parse(JSON.stringify(hangar)) : undefined,
    scanner: ctx.world?.scanner,
    miningLaser: ctx.world?.miningLaser,
    concealedMounts: ctx.world?.concealedMounts,
    launcher: ctx.world?.launcher,
    missileAmmo: ctx.world?.missileAmmo,
    turret: ctx.world?.turret,
    shipName: ctx.world?.shipName,
    configShip: copyShipCfg(ctx.config?.ship),
  };
}

function restoreSwitch(ctx, snap) {
  if (!snap) return;
  if (ctx.player && snap.player) {
    for (const k of Object.keys(ctx.player)) delete ctx.player[k];
    Object.assign(ctx.player, snap.player);
  }
  if (!Array.isArray(ctx.cargo)) ctx.cargo = [];
  else ctx.cargo.length = 0;
  for (const row of snap.cargo) ctx.cargo.push({ ...row });
  ctx.cargoCapacity = snap.cargoCapacity;
  if (ctx.world) {
    if (snap.hangar !== undefined) ctx.world.hangar = snap.hangar;
    ctx.world.scanner = snap.scanner;
    ctx.world.miningLaser = snap.miningLaser;
    ctx.world.concealedMounts = snap.concealedMounts;
    ctx.world.launcher = snap.launcher;
    ctx.world.missileAmmo = snap.missileAmmo;
    ctx.world.turret = snap.turret;
    ctx.world.shipName = snap.shipName;
  }
  restoreShipCfg(ctx.config?.ship, snap.configShip);
}

function rebuildCombatFlags(p) {
  if (!p) return;
  p.destroyed = false;
  p.disabled = false;
  p.surrendered = false;
  p.overheated = false;
  p.disabledDamage = 0;
  p.disabledSince = null;
  const max = p.engineMax > 0 ? p.engineMax : 1;
  p.engineOut = (p.engine / max) <= 0.3;
}

function loadMountedRow(ctx, row) {
  const p = ctx.player;
  const personality = p?.personality;
  const baseline = createShipState(row.classKey, { name: row.name, faction: row.faction });
  delete baseline.personality;
  delete baseline.cargo;
  if (p) {
    Object.assign(p, baseline);
    if (personality !== undefined) p.personality = personality;
    else delete p.personality;
    for (const k of ['hull', 'hullMax', 'screen', 'screenMax', 'shell', 'shellMax', 'engine', 'engineMax', 'heat']) {
      p[k] = row[k];
    }
    if (row.hullKind === 'living' || row.hullKind === 'built') p.hullKind = row.hullKind;
    else delete p.hullKind;
    p.faction = row.faction;
    p.classKey = row.classKey;
    if (row.faction === 'unknowables') p.hullKind = 'living';
    copyGraftedFromRow(p, row);
    if (Object.prototype.hasOwnProperty.call(p, 'cargo')) delete p.cargo;
    rebuildCombatFlags(p);
  }
  applyAbominationStanding(ctx);
  if (ctx.world) {
    ctx.world.scanner = row.scanner;
    ctx.world.miningLaser = row.miningLaser;
    ctx.world.concealedMounts = row.concealedMounts;
    ctx.world.launcher = row.launcher;
    ctx.world.missileAmmo = row.missileAmmo;
    ctx.world.turret = row.turret;
    ctx.world.shipName = row.name;
  }
  if (!Array.isArray(ctx.cargo)) ctx.cargo = [];
  else ctx.cargo.length = 0;
  for (const item of sanitizeCargoList(row.cargo)) ctx.cargo.push({ ...item });
  ctx.cargoCapacity = row.cargoCapacity;
}

function switchRefuseReason(ctx, id) {
  if (!ctx.flags?.docked) return 'not-docked';
  if (ctx.flags?.combat) return 'combat';
  if (ctx.gate?.jumping) return 'jump';
  if (ctx.player?.destroyed) return 'destroyed';
  if (ctx.flags?.paused) return 'paused';
  sanitizeHangar(ctx);
  const hangar = ctx.world?.hangar;
  if (!hangar || !Array.isArray(hangar.hulls)) return 'missing';
  const row = hangar.hulls.find((h) => h.id === id);
  if (!row) return 'missing';
  if (hangar.mountedId === id) return 'already-mounted';
  return null;
}

/** Dock-only hangar swap. Station UI calls this. Mesh remount is registered by ship.js. */
export function switchTo(ctx, id) {
  const reason = switchRefuseReason(ctx, id);
  if (reason) return { ok: false, reason };
  const snap = captureSwitch(ctx);
  try {
    parkMounted(ctx);
    sanitizeHangar(ctx);
    const hangar = ctx.world.hangar;
    const row = hangar.hulls.find((h) => h.id === id);
    if (!row) return { ok: false, reason: 'missing' };
    loadMountedRow(ctx, row);
    hangar.mountedId = row.id;
    if (ctx.player?.faction === 'unknowables') ctx.player.hullKind = 'living';
    applyFlightEnvelope(ctx, row.classKey);
    callRemount(ctx);
    applyAbominationStanding(ctx);
    return { ok: true };
  } catch {
    restoreSwitch(ctx, snap);
    try { callRemount(ctx); } catch { /* keep restored records */ }
    return { ok: false, reason: 'failed' };
  }
}

/** Restore / freshStart: envelope from the mounted class, then remount if a mesh exists. */
export function applyMountedFlight(ctx) {
  const key = ctx.player?.classKey;
  applyFlightEnvelope(ctx, key);
  if (ctx.player?.faction === 'unknowables') ctx.player.hullKind = 'living';
  if (ctx.player) healPlayerGrafted(ctx.player);
  applyAbominationStanding(ctx);
  callRemount(ctx);
}

/** Mounted built hull only. Debits GRAFT_LIST_UU. No remount. */
export function graftMounted(ctx) {
  if (!ctx?.flags?.docked) return { ok: false, reason: 'dock' };
  if (ctx.flags?.combat) return { ok: false, reason: 'combat' };
  if (ctx.gate?.jumping) return { ok: false, reason: 'jump' };
  if (ctx.player?.destroyed) return { ok: false, reason: 'destroyed' };
  if (ctx.flags?.paused) return { ok: false, reason: 'paused' };
  if (dockBannerOf(ctx) !== 'gilded') return { ok: false, reason: 'banner' };
  if (standingOf(ctx, 'gilded') < 0) return { ok: false, reason: 'reputation' };
  sanitizeHangar(ctx);
  const hangar = ctx.world?.hangar;
  if (!hangar || !Array.isArray(hangar.hulls)) return { ok: false, reason: 'missing' };
  const row = hangar.hulls.find((h) => h.id === hangar.mountedId);
  if (!row) return { ok: false, reason: 'missing' };
  if (row.faction === 'unknowables' || ctx.player?.faction === 'unknowables') {
    return { ok: false, reason: 'living' };
  }
  if (row.hullKind !== 'built') return { ok: false, reason: 'living' };
  if (graftedOwnTrue(row) || graftedOwnTrue(ctx.player)) return { ok: false, reason: 'already' };
  const price = GRAFT_LIST_UU;
  if (price == null || !Number.isInteger(price) || price < 0) {
    return { ok: false, reason: 'credits' };
  }
  const credits = ctx.world.credits;
  if (typeof credits !== 'number' || !Number.isFinite(credits) || credits < price) {
    return { ok: false, reason: 'credits' };
  }
  row.grafted = true;
  if (ctx.player) copyGraftedFromRow(ctx.player, row);
  ctx.world.credits = credits - price;
  if (!(ctx.world.credits >= 0)) ctx.world.credits = 0;
  applyAbominationStanding(ctx);
  return { ok: true };
}

/** First dest in livingTrainDests, or null. */
export function nextTrainClass(classKey) {
  const dests = livingTrainDests(classKey);
  return dests.length ? dests[0] : null;
}

let trainInFlight = false;

function trainMountedUnlocked(ctx, destClass) {
  if (!ctx?.flags?.docked) return { ok: false, reason: 'dock' };
  if (ctx.flags?.combat) return { ok: false, reason: 'combat' };
  if (ctx.gate?.jumping) return { ok: false, reason: 'jump' };
  if (ctx.player?.destroyed) return { ok: false, reason: 'destroyed' };
  if (ctx.flags?.paused) return { ok: false, reason: 'paused' };
  if (dockBannerOf(ctx) !== 'beautiful') return { ok: false, reason: 'banner' };
  sanitizeHangar(ctx);
  const hangar = ctx.world?.hangar;
  if (!hangar || !Array.isArray(hangar.hulls)) return { ok: false, reason: 'missing' };
  const row = hangar.hulls.find((h) => h.id === hangar.mountedId);
  if (!row) return { ok: false, reason: 'missing' };
  if (row.faction === 'unknowables' || ctx.player?.faction === 'unknowables') {
    return { ok: false, reason: 'faction' };
  }
  if (row.hullKind !== 'living') return { ok: false, reason: 'living' };
  if (graftedOwnTrue(row) || graftedOwnTrue(ctx.player)) return { ok: false, reason: 'living' };
  const dest = typeof destClass === 'string' ? destClass : '';
  const dests = livingTrainDests(row.classKey);
  if (!dest || dest === row.classKey || !dests.includes(dest)
    || !Object.prototype.hasOwnProperty.call(SHIP_CLASSES, dest)) {
    return { ok: false, reason: 'class' };
  }
  const rep = standingOf(ctx, 'beautiful');
  if (rep < 0 || rep < minRepFor(dest)) return { ok: false, reason: 'reputation' };
  const price = trainListPrice(rep, dest);
  if (price == null || !Number.isInteger(price) || price < 0) {
    return { ok: false, reason: 'credits' };
  }
  const credits = ctx.world.credits;
  if (typeof credits !== 'number' || !Number.isFinite(credits) || credits < price) {
    return { ok: false, reason: 'credits' };
  }

  const snap = captureSwitch(ctx);
  try {
    parkMounted(ctx);
    const hangar2 = ctx.world.hangar;
    const idx = hangar2.hulls.findIndex((h) => h.id === hangar2.mountedId);
    if (idx < 0) throw new Error('train-missing');
    const parked = hangar2.hulls[idx];
    if (parked.faction === 'unknowables') throw new Error('train-faction');
    if (parked.hullKind !== 'living' || graftedOwnTrue(parked)) throw new Error('train-living');
    if (!livingTrainDests(parked.classKey).includes(dest)) throw new Error('train-class');
    const raw = {
      id: parked.id,
      hullKind: 'living',
      faction: parked.faction,
      classKey: dest,
      name: parked.name,
      scanner: parked.scanner,
      miningLaser: parked.miningLaser,
      concealedMounts: parked.concealedMounts,
      launcher: parked.launcher,
      missileAmmo: parked.missileAmmo,
      turret: parked.turret,
      cargoCapacity: parked.cargoCapacity,
      cargo: parked.cargo,
      hull: parked.hull,
      hullMax: parked.hullMax,
      screen: parked.screen,
      screenMax: parked.screenMax,
      shell: parked.shell,
      shellMax: parked.shellMax,
      engine: parked.engine,
      engineMax: parked.engineMax,
      heat: parked.heat,
    };
    const rec = sanitizeHangarRecord(raw);
    if (!rec || rec.id !== parked.id || rec.classKey !== dest || rec.hullKind !== 'living') {
      throw new Error('train-record');
    }
    rec.hullKind = 'living';
    delete rec.grafted;
    hangar2.hulls[idx] = rec;
    loadMountedRow(ctx, rec);
    hangar2.mountedId = rec.id;
    applyFlightEnvelope(ctx, dest);
    callRemount(ctx);
    ctx.world.credits = credits - price;
    if (!(ctx.world.credits >= 0)) ctx.world.credits = 0;
    requestAutosave(ctx);
    return { ok: true, dest, price };
  } catch {
    restoreSwitch(ctx, snap);
    try { callRemount(ctx); } catch { /* keep restored records */ }
    return { ok: false, reason: 'failed' };
  }
}

/** Mounted living non-grafted hull. Debits yardPrice(dest). Same-row remount. */
export function trainMounted(ctx, destClass) {
  if (trainInFlight) return { ok: false, reason: 'busy' };
  trainInFlight = true;
  try {
    return trainMountedUnlocked(ctx, destClass);
  } finally {
    trainInFlight = false;
  }
}

function nextSeedId(hangar, stem) {
  if (typeof stem !== 'string' || !/^[a-z0-9_]+$/.test(stem)) return null;
  const used = new Set();
  for (const row of hangar?.hulls ?? []) {
    if (typeof row?.id === 'string') used.add(row.id);
  }
  for (let i = 1; i < 100; i++) {
    const id = `hull_${stem}_${i}`;
    if (!used.has(id) && id !== GIFT_HULL_ID && !RESERVED_IDS.has(id)) return id;
  }
  return null;
}

function livingSeedRaw(id) {
  const fresh = createShipState('light', { name: 'light', faction: 'beautiful' });
  return {
    id,
    hullKind: 'living',
    faction: 'beautiful',
    classKey: 'light',
    name: 'light',
    scanner: 0,
    miningLaser: 0,
    concealedMounts: false,
    launcher: '',
    missileAmmo: 0,
    turret: '',
    cargoCapacity: cargoHoldFor('light'),
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
}

/**
 * Park, then append one living light Beautiful seed. Does not remount.
 * spec.id is an exact hull id. spec.stem mints hull_<stem>_N.
 */
export function grantLivingSeedRow(ctx, spec) {
  if (!ctx?.world) return { ok: false, reason: 'invalid' };
  sanitizeHangar(ctx);
  if (!canAcceptPurchase(ctx)) return { ok: false, reason: 'full' };
  const hangar = ctx.world.hangar;
  if (!hangar || !Array.isArray(hangar.hulls)) return { ok: false, reason: 'full' };

  const wantId = spec && Object.prototype.hasOwnProperty.call(spec, 'id')
    ? spec.id : undefined;
  const stem = spec && Object.prototype.hasOwnProperty.call(spec, 'stem')
    ? spec.stem : undefined;
  let id;
  if (typeof wantId === 'string') id = wantId;
  else if (typeof stem === 'string') id = nextSeedId(hangar, stem);
  else return { ok: false, reason: 'invalid' };
  if (typeof id !== 'string' || !isSafeHullId(id) || RESERVED_IDS.has(id)) {
    return { ok: false, reason: 'invalid' };
  }
  if (typeof stem === 'string' && id === GIFT_HULL_ID) {
    return { ok: false, reason: 'invalid' };
  }
  if (hangar.hulls.some((row) => row && row.id === id)) {
    return { ok: false, reason: 'already' };
  }

  const rec = sanitizeHangarRecord(livingSeedRaw(id));
  if (!rec) return { ok: false, reason: 'invalid' };
  rec.hullKind = 'living';
  delete rec.grafted;
  if (rec.id !== id || rec.classKey !== 'light' || rec.faction !== 'beautiful') {
    return { ok: false, reason: 'invalid' };
  }
  if (rec.hullKind !== 'living') return { ok: false, reason: 'invalid' };

  const mountedId = hangar.mountedId;
  const added = addPurchasedHull(ctx, rec);
  if (!added.ok) return { ok: false, reason: added.reason === 'full' ? 'full' : 'invalid' };
  if (ctx.world.hangar.mountedId !== mountedId) ctx.world.hangar.mountedId = mountedId;
  requestAutosave(ctx);
  return { ok: true, row: added.row };
}

/** Death no-save: one living starter. Do not keep parked rows. */
export function rebuildStarterHangar(ctx) {
  if (!ctx.world) return;
  const starter = writeStarterHangar(ctx, { stock: true });
  mirrorStarterGear(ctx, starter);
  if (!Array.isArray(ctx.cargo)) ctx.cargo = [];
  else ctx.cargo.length = 0;
  ctx.cargoCapacity = cargoHoldFor(starter?.classKey);
}
