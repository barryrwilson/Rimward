import { SYSTEMS } from './state.js';
import { SAFE_ID, ID_MAX, stripControlChars } from './save.js';

/**
 * Galaxy route persist + BFS. Owns world.nav. No chart UI. No state.js write.
 * Jump ownership stays jump.js / gate.js. Autopilot restore is always false.
 */

const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

const NAV_STATUS = new Set(['plotted', 'blocked', 'arrived']);

function systemCount() {
  return Object.keys(SYSTEMS).length;
}

function own(raw, key) {
  return Object.hasOwn(raw, key) ? raw[key] : undefined;
}

function reservedId(value) {
  if (typeof value !== 'string' || !value) return true;
  return RESERVED_IDS.has(value) || RESERVED_IDS.has(value.toLowerCase()) || value === '__proto__';
}

export function sanitizeSystemId(value) {
  if (typeof value !== 'string' || !value || value.length > ID_MAX) return null;
  if (reservedId(value)) return null;
  if (!SAFE_ID.test(value)) return null;
  if (!Object.hasOwn(SYSTEMS, value)) return null;
  return value;
}

function isCharted(id) {
  if (!id || !Object.hasOwn(SYSTEMS, id)) return false;
  const def = SYSTEMS[id];
  return !!def && Array.isArray(def.chart);
}

function dropNav(world) {
  delete world.nav;
}

function writeNav(world, dest, path, remaining, status) {
  world.nav = {
    dest,
    path,
    remaining,
    status,
    autopilot: false,
  };
}

function emitNavRoute(ctx, dest, hops, status) {
  if (!ctx || typeof ctx.emit !== 'function') return;
  ctx.emit('navRoute', { dest, hops, status });
}

function systemName(id) {
  const sid = sanitizeSystemId(id);
  const fallback = sid || 'unknown';
  const def = sid && Object.hasOwn(SYSTEMS, sid) ? SYSTEMS[sid] : null;
  const raw = def && typeof def.name === 'string' ? def.name : fallback;
  const cleaned = stripControlChars(raw);
  return cleaned || fallback;
}

function jumpPhrase(n) {
  return n === 1 ? '1 jump' : `${n} jumps`;
}

function emitComm(ctx, text) {
  if (!ctx || typeof ctx.emit !== 'function') return;
  ctx.emit('commLine', { text, from: 'Echo' });
}

function neighborsOf(id) {
  const out = [];
  const seen = new Set();
  if (!id || !Object.hasOwn(SYSTEMS, id)) return out;
  const def = SYSTEMS[id];
  if (!def || typeof def !== 'object') return out;
  const gates = def.gates;
  if (Array.isArray(gates)) {
    for (let i = 0; i < gates.length; i++) {
      if (!Object.hasOwn(gates, i)) continue;
      const g = gates[i];
      if (!g || typeof g !== 'object' || Array.isArray(g)) continue;
      const to = sanitizeSystemId(own(g, 'to'));
      if (!to || seen.has(to)) continue;
      seen.add(to);
      out.push(to);
    }
  }
  const hub = def.hub;
  if (hub && typeof hub === 'object' && !Array.isArray(hub)) {
    const routes = own(hub, 'routes');
    if (Array.isArray(routes)) {
      for (let i = 0; i < routes.length; i++) {
        if (!Object.hasOwn(routes, i)) continue;
        const to = sanitizeSystemId(routes[i]);
        if (!to || seen.has(to)) continue;
        seen.add(to);
        out.push(to);
      }
    }
  }
  return out;
}

/** True when `from` has outbound hardware to `to` (gate ring or hub route). */
export function canTransit(from, to) {
  const here = sanitizeSystemId(from);
  const dest = sanitizeSystemId(to);
  if (!here || !dest) return false;
  const ns = neighborsOf(here);
  for (let i = 0; i < ns.length; i++) {
    if (ns[i] === dest) return true;
  }
  return false;
}

function pathEdgesOk(path) {
  if (!Array.isArray(path) || path.length < 2) return false;
  for (let i = 1; i < path.length; i++) {
    if (!canTransit(path[i - 1], path[i])) return false;
  }
  return true;
}

function bfsPath(from, dest) {
  const cap = systemCount();
  if (!from || !dest || from === dest) return null;
  const prev = new Map();
  prev.set(from, null);
  const q = [from];
  let qi = 0;
  while (qi < q.length) {
    const cur = q[qi++];
    if (cur === dest) break;
    const ns = neighborsOf(cur);
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i];
      if (prev.has(n)) continue;
      prev.set(n, cur);
      q.push(n);
    }
  }
  if (!prev.has(dest)) return null;
  const rev = [];
  let walk = dest;
  while (walk != null) {
    rev.push(walk);
    if (rev.length > cap) return null;
    walk = prev.get(walk);
  }
  rev.reverse();
  if (rev.length < 2 || rev.length > cap) return null;
  if (rev[0] !== from || rev[rev.length - 1] !== dest) return null;
  return rev;
}

function sanitizePath(rawPath) {
  if (!Array.isArray(rawPath)) return null;
  const cap = systemCount();
  if (rawPath.length > cap) return null;
  const path = [];
  for (let i = 0; i < rawPath.length; i++) {
    if (!Object.hasOwn(rawPath, i)) return null;
    const id = sanitizeSystemId(rawPath[i]);
    if (!id) return null;
    if (i > 0 && id === path[i - 1]) return null;
    path.push(id);
  }
  return path;
}

function sanitizeRemaining(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  let n = Math.trunc(value);
  if (n < 0) n = 0;
  const cap = systemCount();
  if (n > cap) n = cap;
  return n;
}

/** Heal world.nav. Idle is omit. Autopilot is always false after a keep. */
export function sanitizeNav(ctx) {
  const world = ctx && ctx.world;
  if (!world || typeof world !== 'object') return;
  const raw = world.nav;
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    dropNav(world);
    return;
  }
  const dest = sanitizeSystemId(own(raw, 'dest'));
  if (!dest) {
    dropNav(world);
    return;
  }
  const status = own(raw, 'status');
  if (typeof status !== 'string' || !NAV_STATUS.has(status)) {
    dropNav(world);
    return;
  }
  const path = sanitizePath(own(raw, 'path'));
  if (!path) {
    dropNav(world);
    return;
  }
  if (sanitizeRemaining(own(raw, 'remaining')) == null) {
    dropNav(world);
    return;
  }
  const here = sanitizeSystemId(world.currentSystem);
  if (status === 'blocked') {
    writeNav(world, dest, [], 0, 'blocked');
    return;
  }
  if (status === 'arrived') {
    if (!here || dest !== here) {
      dropNav(world);
      return;
    }
    writeNav(world, dest, [dest], 0, 'arrived');
    return;
  }
  // plotted
  if (path[path.length - 1] !== dest) {
    dropNav(world);
    return;
  }
  let idx = -1;
  if (here) {
    for (let i = 0; i < path.length; i++) {
      if (path[i] === here) {
        idx = i;
        break;
      }
    }
  }
  if (idx < 0) {
    writeNav(world, dest, [], 0, 'blocked');
    return;
  }
  const sliced = path.slice(idx);
  if (here === dest) {
    writeNav(world, dest, [dest], 0, 'arrived');
    return;
  }
  if (sliced.length < 2 || sliced[sliced.length - 1] !== dest || sliced[0] !== here) {
    dropNav(world);
    return;
  }
  if (!pathEdgesOk(sliced)) {
    const fresh = bfsPath(here, dest);
    if (!fresh) {
      writeNav(world, dest, [], 0, 'blocked');
      return;
    }
    writeNav(world, dest, fresh, fresh.length - 1, 'plotted');
    return;
  }
  writeNav(world, dest, sliced, sliced.length - 1, 'plotted');
}

export function clearRoute(ctx) {
  if (!ctx || !ctx.world || typeof ctx.world !== 'object') return;
  dropNav(ctx.world);
  emitNavRoute(ctx, '', 0, 'idle');
  emitComm(ctx, 'Route cleared.');
}

/** Plot dest from currentSystem. Uncharted / unknown dest fail closed (no write). */
export function plotRoute(ctx, dest) {
  if (!ctx || !ctx.world || typeof ctx.world !== 'object') return;
  const id = sanitizeSystemId(dest);
  if (!id) return;
  if (!isCharted(id)) return;
  const here = sanitizeSystemId(ctx.world.currentSystem);
  if (!here) return;
  if (id === here) {
    clearRoute(ctx);
    return;
  }
  const path = bfsPath(here, id);
  if (!path) {
    writeNav(ctx.world, id, [], 0, 'blocked');
    emitNavRoute(ctx, id, 0, 'blocked');
    emitComm(ctx, `No route to ${systemName(id)} from here.`);
    return;
  }
  writeNav(ctx.world, id, path, path.length - 1, 'plotted');
  emitNavRoute(ctx, id, path.length - 1, 'plotted');
  emitComm(ctx, `Route plotted: ${jumpPhrase(path.length - 1)} to ${systemName(id)}.`);
}

/** Recalc after a successful jump. Does not teleport. Does not request a jump. */
export function recalcOnLoad(ctx, event) {
  if (!ctx || !ctx.world || typeof ctx.world !== 'object') return;
  const bag = ctx.world.nav;
  if (bag == null || typeof bag !== 'object' || Array.isArray(bag)) return;
  const dest = sanitizeSystemId(own(bag, 'dest'));
  if (!dest) return;
  let here = null;
  if (event && typeof event === 'object' && !Array.isArray(event)) {
    here = sanitizeSystemId(own(event, 'to'));
  }
  if (!here) here = sanitizeSystemId(ctx.world.currentSystem);
  if (!here) return;
  if (here === dest) {
    writeNav(ctx.world, dest, [here], 0, 'arrived');
    emitNavRoute(ctx, dest, 0, 'arrived');
    emitComm(ctx, `Arrived at ${systemName(dest)}.`);
    return;
  }
  const path = bfsPath(here, dest);
  if (!path) {
    writeNav(ctx.world, dest, [], 0, 'blocked');
    emitNavRoute(ctx, dest, 0, 'blocked');
    emitComm(ctx, `No route to ${systemName(dest)} from here.`);
    return;
  }
  writeNav(ctx.world, dest, path, path.length - 1, 'plotted');
  emitNavRoute(ctx, dest, path.length - 1, 'plotted');
  emitComm(ctx, `Route updated: ${jumpPhrase(path.length - 1)} to ${systemName(dest)}.`);
}

function recalcIfNeeded(ctx) {
  if (!ctx || !ctx.world || typeof ctx.world !== 'object') return;
  const bag = ctx.world.nav;
  if (bag == null || typeof bag !== 'object' || Array.isArray(bag)) return;
  const dest = sanitizeSystemId(own(bag, 'dest'));
  if (!dest) return;
  const here = sanitizeSystemId(ctx.world.currentSystem);
  const status = own(bag, 'status');
  if (status === 'plotted' && Array.isArray(bag.path) && here && bag.path[0] === here
      && bag.path[bag.path.length - 1] === dest) {
    return;
  }
  if (status === 'arrived' && here === dest) return;
  if (status === 'blocked' && here && here !== dest) {
    const path = bfsPath(here, dest);
    if (!path) return;
  }
  recalcOnLoad(ctx, { to: here });
}

/** After jump.js so same-frame systemLoaded is visible. */
export function initNav(ctx) {
  let didFirst = false;
  function update() {
    let loaded = false;
    const ev = ctx && ctx.events;
    if (Array.isArray(ev)) {
      for (let i = 0; i < ev.length; i++) {
        if (!Object.hasOwn(ev, i)) continue;
        const e = ev[i];
        if (!e || typeof e !== 'object' || Array.isArray(e)) continue;
        if (e.type === 'systemLoaded') {
          recalcOnLoad(ctx, e);
          loaded = true;
        }
      }
    }
    if (!didFirst) {
      didFirst = true;
      if (!loaded) recalcIfNeeded(ctx);
    }
  }
  return { update };
}
