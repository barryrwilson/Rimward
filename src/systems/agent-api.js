/**
 * Agent play handle. Owns ctx.agent (session; not persist; not a helm).
 * Does not write ctx.input, ship transform, credits, or flags.berthHold.
 */

import { buildObservation } from '../game/agent-observe.js';
import {
  VERSION,
  EVENT_CAP,
  emptyLastIntent,
  noCtxObservation,
  actResult,
  sanitizeEvent,
  pushRing,
  isForbiddenName,
  str,
} from '../game/agent-schema.js';

function hostWindow() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.window) return globalThis.window;
  } catch {
    /* ignore */
  }
  return typeof globalThis !== 'undefined' ? globalThis : null;
}

function queryOptIn() {
  try {
    const w = hostWindow();
    const loc = (typeof globalThis !== 'undefined' && globalThis.location)
      || (w && w.location)
      || null;
    if (!loc) return false;
    let search = '';
    if (typeof loc.search === 'string' && loc.search) search = loc.search;
    else if (typeof loc.href === 'string') {
      const href = loc.href;
      const q = href.indexOf('?');
      if (q >= 0) {
        const hash = href.indexOf('#', q);
        search = hash >= 0 ? href.slice(q, hash) : href.slice(q);
      }
    }
    if (!search) return false;
    const raw = search.charAt(0) === '?' ? search.slice(1) : search;
    const sp = new URLSearchParams(raw);
    return sp.get('agent') === '1';
  } catch {
    return false;
  }
}

function ensureAgent(ctx) {
  if (!ctx || typeof ctx !== 'object') return null;
  if (!ctx.agent || typeof ctx.agent !== 'object') {
    ctx.agent = { optIn: false, lastIntent: emptyLastIntent(), events: [] };
    return ctx.agent;
  }
  if (ctx.agent.optIn !== true) ctx.agent.optIn = false;
  if (!Array.isArray(ctx.agent.events)) ctx.agent.events = [];
  if (!ctx.agent.lastIntent || typeof ctx.agent.lastIntent !== 'object') {
    ctx.agent.lastIntent = emptyLastIntent();
  }
  return ctx.agent;
}

function harvest(ctx) {
  const agent = ensureAgent(ctx);
  if (!agent) return;
  const queue = ctx.events;
  if (!Array.isArray(queue)) return;
  for (let i = 0; i < queue.length; i++) {
    const row = sanitizeEvent(queue[i]);
    if (row) pushRing(agent.events, row, EVENT_CAP);
  }
}

function remember(ctx, result) {
  const agent = ensureAgent(ctx);
  if (!agent) return result;
  const t = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  agent.lastIntent = {
    name: str(result.name),
    ok: result.ok === true,
    error: str(result.error),
    token: str(result.token),
    t,
  };
  return result;
}

function fail(ctx, name, token, error) {
  return remember(ctx, actResult({ ok: false, error: error ?? token, name, token }));
}

function ok(ctx, name) {
  return remember(ctx, actResult({ ok: true, error: '', name, token: '' }));
}

function commandName(command) {
  if (!command || typeof command !== 'object') return '';
  const name = Object.hasOwn(command, 'name') ? command.name : '';
  return typeof name === 'string' ? name : '';
}

/** Public handle follows window.__ctx when present; else the first install ctx. */
function readLiveCtx(fallback) {
  try {
    const w = hostWindow();
    const live = w && w.__ctx;
    if (live && typeof live === 'object') return live;
  } catch {
    /* ignore */
  }
  return fallback && typeof fallback === 'object' ? fallback : null;
}

function isPublicHandle(value) {
  return !!(
    value
    && typeof value === 'object'
    && value.version === VERSION
    && typeof value.observe === 'function'
    && typeof value.act === 'function'
  );
}

function dispatchAct(ctx, command) {
  const name = commandName(command);
  if (isForbiddenName(name)) {
    try { console.warn('rimward: forbidden act', name); } catch { /* ignore */ }
    return fail(ctx, name, 'forbidden');
  }

  const agent = ensureAgent(ctx);
  if (!agent || agent.optIn !== true) return fail(ctx, name, 'opt-in');

  if (name === 'ping') return ok(ctx, name);

  if (name === 'disable') {
    agent.optIn = false;
    return ok(ctx, name);
  }

  const flags = ctx.flags && typeof ctx.flags === 'object' ? ctx.flags : {};
  if (flags.paused === true) return fail(ctx, name, 'paused');
  if (flags.berthHold === true) return fail(ctx, name, 'held');

  return fail(ctx, name, 'unknown');
}

export function initAgentApi(ctx) {
  if (!ctx || typeof ctx !== 'object') {
    return { update() {} };
  }
  const agent = ensureAgent(ctx);
  if (agent && queryOptIn()) agent.optIn = true;

  const w = hostWindow();
  if (w && !isPublicHandle(w.rimward)) {
    function observe() {
      try {
        return buildObservation(readLiveCtx(ctx));
      } catch {
        return noCtxObservation();
      }
    }

    function act(command) {
      try {
        return dispatchAct(readLiveCtx(ctx), command);
      } catch {
        const name = commandName(command);
        return actResult({ ok: false, error: 'refuse', name, token: 'refuse' });
      }
    }

    function enable(ev) {
      try {
        const live = readLiveCtx(ctx);
        const trusted = !!(ev && ev.isTrusted === true);
        if (!trusted) return fail(live, 'enable', 'opt-in');
        const bag = ensureAgent(live);
        if (bag) bag.optIn = true;
        return ok(live, 'enable');
      } catch {
        return actResult({ ok: false, error: 'refuse', name: 'enable', token: 'refuse' });
      }
    }

    function disable() {
      try {
        const live = readLiveCtx(ctx);
        const bag = ensureAgent(live);
        if (bag) bag.optIn = false;
        return ok(live, 'disable');
      } catch {
        return actResult({ ok: false, error: 'refuse', name: 'disable', token: 'refuse' });
      }
    }

    const api = Object.freeze({
      version: VERSION,
      observe,
      act,
      enable,
      disable,
    });
    try { w.rimward = api; } catch { /* ignore */ }
  }

  return {
    update(_dt, live) {
      try {
        harvest(live || ctx);
      } catch {
        /* never throw into the flight loop */
      }
    },
  };
}
