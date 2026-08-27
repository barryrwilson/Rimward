/**
 * Accepted mining commodities for the current system. Read-only.
 * Unknown / reserved keys skip. Never throws.
 */
import { SYSTEMS, COMMODITIES, ORE_TYPES } from './state.js';

function reservedKey(value) {
  return value === '__proto__' || value === 'constructor' || value === 'prototype';
}

function authoredOreKey(value) {
  if (typeof value !== 'string' || !value || reservedKey(value)) return '';
  if (!Object.hasOwn(ORE_TYPES, value) || !Object.hasOwn(COMMODITIES, value)) return '';
  return value;
}

/** Authored ore keys on accepted mining jobs in the current system. */
export function acceptedMiningOreKeys(ctx) {
  const keys = new Set();
  try {
    const world = ctx && ctx.world;
    const jobs = world && world.jobs;
    const current = world && world.currentSystem;
    if (!Array.isArray(jobs) || typeof current !== 'string') return keys;
    if (reservedKey(current) || !Object.hasOwn(SYSTEMS, current)) return keys;
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      if (!job || job.kind !== 'mining' || job.state !== 'accepted') continue;
      const origin = job.originSystem;
      if (typeof origin !== 'string' || reservedKey(origin)) continue;
      if (!Object.hasOwn(SYSTEMS, origin) || origin !== current) continue;
      const key = authoredOreKey(job.commodity);
      if (key) keys.add(key);
    }
  } catch {
    keys.clear();
  }
  return keys;
}

/** True when the rock's commodity or oreKey is an authored member of keys. */
export function rockMatchesOreKeys(rock, keys) {
  try {
    if (!rock || !keys || keys.size === 0) return false;
    const a = authoredOreKey(rock.commodity);
    if (a && keys.has(a)) return true;
    const b = authoredOreKey(rock.oreKey);
    if (b && keys.has(b)) return true;
    return false;
  } catch {
    return false;
  }
}

/** True when any list rock with ore > 0 matches keys. */
export function fieldHasMatchingOre(list, keys) {
  try {
    if (!list || !keys || keys.size === 0) return false;
    const n = list.length;
    for (let i = 0; i < n; i++) {
      const a = list[i];
      if (!a || !(a.ore > 0)) continue;
      if (rockMatchesOreKeys(a, keys)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** COMMODITIES[commodity].name, else 'ore'. */
export function authoredOreName(commodity) {
  try {
    const key = authoredOreKey(commodity);
    if (!key) return 'ore';
    const n = COMMODITIES[key].name;
    return (typeof n === 'string' && n) ? n : 'ore';
  } catch {
    return 'ore';
  }
}
