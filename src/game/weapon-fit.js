import { MOUNT_TABLE } from './state.js';

/**
 * Authored launcher / turret SKUs. Combat stats live on WEAPONS; this module
 * is ids, prices, ammoMax, and seat checks. Feature PRs import (read).
 * No THREE, no DOM, no ctx writes, no persist.
 */

// Same integer as save.js ID_MAX. Do not import save.js (CSS + persist stack).
const ID_MAX = 64;

const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

function freezeIds(rows) {
  const table = Object.create(null);
  for (const id of Object.keys(rows)) {
    if (RESERVED_IDS.has(id) || id.length > ID_MAX) continue;
    table[id] = Object.freeze(rows[id]);
  }
  return Object.freeze(table);
}

function isOwnSku(table, id) {
  if (typeof id !== 'string' || !id || id.length > ID_MAX) return false;
  if (RESERVED_IDS.has(id)) return false;
  return Object.hasOwn(table, id);
}

export const LAUNCHER_IDS = freezeIds({
  dart: {
    wkey: 'missile',
    ammoMax: 8,
    cost: 6500,
    restockCost: 400,
    restockUnit: 2,
    confirm: true,
    name: 'Dart rack',
    line: 'Eight seeker darts. Slow enough that a cutter can still cut.',
  },
});

export const TURRET_IDS = freezeIds({
  auto: {
    wkey: 'turret',
    cost: 4200,
    confirm: true,
    name: 'Auto turret',
    line: 'A small forward gun. Heat-limited. No magazine.',
  },
});

/** True iff MOUNT_TABLE[class][kind] > 0. Unknown classKey uses light. */
export function canSeat(classKey, kind) {
  if (kind !== 'missile' && kind !== 'turret') return false;
  const key = Object.hasOwn(MOUNT_TABLE, classKey) ? classKey : 'light';
  return MOUNT_TABLE[key][kind] > 0;
}

export function isLauncherId(id) {
  return isOwnSku(LAUNCHER_IDS, id);
}

export function isTurretId(id) {
  return isOwnSku(TURRET_IDS, id);
}

export function launcherAmmoMax(id) {
  if (!isLauncherId(id)) return 0;
  const max = LAUNCHER_IDS[id].ammoMax;
  return Number.isInteger(max) && max >= 0 ? max : 0;
}

/**
 * Heal parked missileAmmo. If launcher === '' → 0. Else if Number.isInteger(value)
 * and value >= 0 → min(value, catalogMax). Else 0. Do not trunc.
 */
export function healMissileAmmo(launcher, value) {
  if (launcher === '') return 0;
  if (Number.isInteger(value) && value >= 0) {
    return Math.min(value, launcherAmmoMax(launcher));
  }
  return 0;
}
