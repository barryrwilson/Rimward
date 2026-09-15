/**
 * Charted authored-ring distance for cross-system job postings (MSN-02).
 *
 * The job board posts work to a NAMED far station. Before wave 176 every
 * trade, ferry and passenger posting used `otherSystemId` — the primary gate —
 * so a destination was always exactly one jump away. This module owns the one
 * extra step: the shortest gate distance between two authored, charted systems,
 * so a board can post a single two-gate run and price it for the distance.
 *
 * The walk is confined to AUTHORED_SYSTEMS entries that carry a `chart` array
 * and a `station`. Generated/procedural systems are deliberately excluded: a
 * posting must never route a player through an uncharted detour, and the
 * authored ring is the only topology the board copy can name honestly.
 *
 * Distance is DERIVED, never persisted. A job already stores `originSystem`
 * and `destSystem`; `authoredHops` turns that pair back into a jump count, so
 * no new persisted field exists for saves to carry or an attacker to stuff.
 *
 * Pure data + pure functions. The only import is the zero-import authored
 * system table, so save.js and station.js can both read this without a cycle.
 */
import { AUTHORED_SYSTEMS } from './authored-systems.js';

/** The farthest a generated posting may name. Two gates, never three. */
export const JOB_MAX_HOPS = 2;

/**
 * Pay multiplier by jump count, relative to the one-jump agreement. Trade
 * already pays HAUL_MARGIN 1.4 at one jump, so 1.25 here reads 175% at two —
 * the issue-176 ladder (140% / 175%).
 */
const HOP_PAY_MULT = [1, 1, 1.25];

const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

function reservedId(value) {
  if (typeof value !== 'string' || !value) return true;
  return RESERVED_IDS.has(value) || RESERVED_IDS.has(value.toLowerCase());
}

/** The authored, charted, stationed system for `id`, or null. */
function chartedDef(id) {
  if (reservedId(id) || !Object.hasOwn(AUTHORED_SYSTEMS, id)) return null;
  const def = AUTHORED_SYSTEMS[id];
  if (!def || typeof def !== 'object' || Array.isArray(def)) return null;
  if (!Array.isArray(def.chart) || def.chart.length !== 2) return null;
  if (!def.station || typeof def.station !== 'object') return null;
  return def;
}

/** True when `id` is an authored charted system a posting may name. */
export function chartedAuthored(id) {
  return chartedDef(id) !== null;
}

/** Charted authored ids, in the authored table's own stable order. */
function chartedIds() {
  return Object.keys(AUTHORED_SYSTEMS).filter(chartedAuthored);
}

/** Outbound charted-ring links: gate rings first, then hub routes. */
function neighborsOf(id) {
  const def = chartedDef(id);
  const out = [];
  if (!def) return out;
  const seen = new Set();
  const add = (to) => {
    if (typeof to !== 'string' || to === id || seen.has(to)) return;
    if (!chartedAuthored(to)) return;
    seen.add(to);
    out.push(to);
  };
  const gates = def.gates;
  if (Array.isArray(gates)) {
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i];
      if (!g || typeof g !== 'object' || Array.isArray(g)) continue;
      add(g.to);
    }
  }
  const hub = def.hub;
  if (hub && typeof hub === 'object' && !Array.isArray(hub) && Array.isArray(hub.routes)) {
    for (let i = 0; i < hub.routes.length; i++) add(hub.routes[i]);
  }
  return out;
}

/**
 * Whole-ring BFS table, built once. Six authored systems make this trivially
 * small, and building it at module load keeps the per-frame board refresh out
 * of a search loop entirely.
 */
const HOPS = (() => {
  const table = new Map();
  const ids = chartedIds();
  for (let i = 0; i < ids.length; i++) {
    const from = ids[i];
    const dist = new Map([[from, 0]]);
    const queue = [from];
    let qi = 0;
    while (qi < queue.length) {
      const cur = queue[qi++];
      const ns = neighborsOf(cur);
      const next = dist.get(cur) + 1;
      for (let k = 0; k < ns.length; k++) {
        if (dist.has(ns[k])) continue;
        dist.set(ns[k], next);
        queue.push(ns[k]);
      }
    }
    table.set(from, dist);
  }
  return table;
})();

/**
 * Shortest gate distance inside the charted authored ring.
 * 0 for the same system, a positive count when reachable, null otherwise.
 */
export function authoredHops(from, to) {
  if (!chartedAuthored(from) || !chartedAuthored(to)) return null;
  const dist = HOPS.get(from);
  if (!dist || !dist.has(to)) return null;
  return dist.get(to);
}

/** Charted authored ids exactly `JOB_MAX_HOPS` gates from `origin`. */
export function longRunDests(origin) {
  const dist = chartedAuthored(origin) ? HOPS.get(origin) : null;
  if (!dist) return [];
  const out = [];
  for (const id of chartedIds()) {
    if (dist.get(id) === JOB_MAX_HOPS) out.push(id);
  }
  return out;
}

/** True when `dest` is a destination a board at `origin` is allowed to post. */
export function postingHopsOk(origin, dest) {
  const hops = authoredHops(origin, dest);
  return hops !== null && hops >= 1 && hops <= JOB_MAX_HOPS;
}

/** The jump count a posted origin/dest pair represents; 1 when underivable. */
export function postingHops(origin, dest) {
  const hops = authoredHops(origin, dest);
  if (hops === null || hops < 1 || hops > JOB_MAX_HOPS) return 1;
  return hops;
}

/** Pay multiplier for a jump count, relative to the one-jump agreement. */
export function hopPayMult(hops) {
  const n = Number.isInteger(hops) && hops >= 1 ? Math.min(hops, JOB_MAX_HOPS) : 1;
  return HOP_PAY_MULT[n];
}

/** Deadline multiplier for a jump count: one generous window per gate. */
export function hopSpanMult(hops) {
  return Number.isInteger(hops) && hops >= 1 ? Math.min(hops, JOB_MAX_HOPS) : 1;
}

/** Player-facing distance phrase for contract copy. */
export function hopsLabel(hops) {
  const n = Number.isInteger(hops) && hops >= 1 ? hops : 1;
  return n === 1 ? '1 jump' : `${n} jumps`;
}
