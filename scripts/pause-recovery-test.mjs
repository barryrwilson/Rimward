// Issue #51: death recovery must DEFER while paused and complete exactly once
// on the first unpaused frame. main.js freezes the system loop under
// ctx.flags.paused but keeps rotating the event queue, so a mid-pause
// recover() → restore() emits 'systemLoaded' into a queue that rotates out
// unseen — currentSystem flips to the autosave's system while the
// environment/station/gates stay built for the old one.
//
// Focused fixture: initSave(ctx) on a bare createCtx plus a real
// createShipState player record and THREE ship object, with minimal
// DOM/storage stubs. No system-graph boot. Timers are faked (restored in
// `finally`) so the 2500ms hold, skip-request, and cancel semantics are
// exercised deterministically without real sleeps. frame()/pausedFrame()
// reproduce main.js exactly: systems read ctx.lastEvents, the queue rotates
// after the loop, and paused frames rotate without updating. A minimal
// systemLoaded consumer stands in for station/solarsystem rebuilds.
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState, SYSTEMS } from '../src/game/state.js';
import { initSave } from '../src/game/save.js';

// ---- minimal DOM stub (only what initSave touches) ----
function makeEl(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    parent: null,
    _listeners: {},
    _attrs: {},
    style: {},
    dataset: {},
    className: '',
    id: '',
    type: '',
    disabled: false,
    textContent: '',
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    append(...c) { for (const x of c) if (x && typeof x === 'object') x.parent = el; this.children.push(...c); },
    setAttribute(k, v) { el._attrs[k] = String(v); },
    getAttribute(k) { return Object.hasOwn(el._attrs, k) ? el._attrs[k] : null; },
    addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn); },
    removeEventListener(type, fn) { const a = this._listeners[type]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
    click() { for (const fn of this._listeners.click ?? []) fn({ type: 'click', target: this }); },
  };
  return el;
}
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  getElementById: () => null,
  body: makeEl('body'),
  addEventListener() {},
};
const winListeners = {};
globalThis.window = {
  addEventListener(type, fn) { (winListeners[type] ??= []).push(fn); },
  removeEventListener(type, fn) { const a = winListeners[type]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
};
function dispatchKey(code) {
  for (const fn of winListeners.keydown ?? []) fn({ code, repeat: false, preventDefault() {} });
  for (const fn of winListeners.keyup ?? []) fn({ code, preventDefault() {} });
}
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

// ---- fake timers: deterministic hold/cancel semantics ----
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
let now = 0;
let timerSeq = 0;
const timers = new Map();
globalThis.setTimeout = (fn, ms) => {
  const id = ++timerSeq;
  timers.set(id, { fn, due: now + (ms ?? 0), cancelled: false });
  return id;
};
globalThis.clearTimeout = (id) => { const t = timers.get(id); if (t) t.cancelled = true; };
function advance(ms) {
  now += ms;
  for (const t of timers.values()) {
    if (!t.cancelled && t.due <= now) { t.cancelled = true; t.fn(); }
  }
}
function pendingTimers() {
  let n = 0;
  for (const t of timers.values()) if (!t.cancelled) n++;
  return n;
}

// ---- ctx: bare createCtx + real player record + real ship transform ----
const ctx = createCtx({ scene: null, camera: null, renderer: null });
ctx.systems = SYSTEMS; // mirrors main.js boot line
ctx.player = createShipState('light', { name: 'Testship', faction: 'freehold' });
ctx.ship.object = new THREE.Object3D();
ctx.ship.object.position.set(10, 20, 30);

// ---- main.js frame model + minimal systemLoaded consumer ----
const dt = 1 / 60;
const KEY = 'rimward-save-v1';
let fails = 0;
let recoveredCount = 0;
const recoveredSources = [];
let rebuiltTo = null; // environment consumer: last system it rebuilt into
function collect() {
  for (const ev of ctx.lastEvents) {
    if (ev.type === 'recovered') { recoveredCount++; recoveredSources.push(ev.source); }
  }
}
function pin(name, ok) {
  if (ok) { console.log('ok —', name); return; }
  fails++;
  console.log('FAIL —', name);
}
// Live frame: save.update reads lastEvents, the consumer rebuilds from
// lastEvents, then the queue rotates (main.js order).
function frame() {
  save.update(dt);
  for (const ev of ctx.lastEvents) if (ev.type === 'systemLoaded') rebuiltTo = ev.to;
  ctx.lastEvents = ctx.events;
  ctx.events = [];
  collect();
}
// Paused frame: main.js skips the system loop but keeps rotating the queue.
function pausedFrame() {
  ctx.lastEvents = ctx.events;
  ctx.events = [];
  collect();
}
function* walkDom(node) {
  yield node;
  for (const c of node.children ?? []) yield* walkDom(c);
}
function deathOverlay() {
  for (const n of walkDom(document.body)) {
    if (typeof n.className === 'string' && n.className.includes('death-overlay')) return n;
  }
  return null;
}
function overlayShown() {
  const ov = deathOverlay();
  return !!ov && ov.style.display === 'flex';
}

// Autosave berthed at Freehold (credits 500 distinguish it from the live 350).
const AUTOSAVE = JSON.stringify({
  v: 1,
  savedAt: Date.now(),
  world: {
    time: 42, credits: 500, fear: 0,
    reputation: { freehold: 3, redledger: 0, veridian: 0, hollow: 0 },
    currentSystem: 'freehold',
    markets: {}, recordBanks: { freehold: [] }, records: [],
    incidents: [], aftermath: [], prices: {}, jobs: [],
    scanner: 0, shipName: 'Testship',
  },
  cargo: [],
  cargoCapacity: 20,
  bio: { mood: 'keen', hunger: 0.2, wounds: 0, bond: 0.3, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1, songEvent: null },
  player: createShipState('light', { name: 'Testship', faction: 'freehold' }),
  ship: { position: [1, 2, 3], quaternion: [0, 0, 0, 1] },
});
function seedAutosave() { localStorage.setItem(KEY, AUTOSAVE); }
function liveInVeridian() { ctx.world.currentSystem = 'veridian'; }
// main.js delivers an emitted event to lastEvents on the NEXT frame's
// rotation; save.update consumes it the frame after that.
function destroy() {
  ctx.emit('playerDestroyed', {});
  frame();
  frame();
}

const save = initSave(ctx); // empty storage: no boot restore

try {
  // ---- A. Hold timer expires while paused → defer; resume completes once ----
  seedAutosave();
  liveInVeridian();
  destroy();
  pin('A: death overlay opens and hold timer arms', ctx.deathApi.isOpen() === true
    && overlayShown() && pendingTimers() === 1);
  ctx.flags.paused = true; // P during the 2500ms hold
  const beforeA = recoveredCount;
  advance(2600); // hold timer fires while paused
  pausedFrame();
  pausedFrame();
  pin('A: hold timer defers while paused (no premature restore)', ctx.deathApi.isOpen() === true
    && ctx.world.currentSystem === 'veridian'
    && overlayShown()
    && rebuiltTo === null
    && recoveredCount === beforeA);
  // A leaked update while paused must still not restore (recover re-checks).
  save.update(dt);
  pin('A: leaked paused update still defers', ctx.deathApi.isOpen() === true
    && ctx.world.currentSystem === 'veridian'
    && recoveredCount === beforeA);
  // Repeated manual recovery requests while paused neither fire nor stack.
  dispatchKey('Enter');
  deathOverlay().click();
  dispatchKey('Space');
  dispatchKey('Digit1');
  pausedFrame();
  pin('A: repeated paused skip inputs neither restore nor duplicate', ctx.deathApi.isOpen() === true
    && ctx.world.currentSystem === 'veridian'
    && recoveredCount === beforeA);
  ctx.flags.paused = false; // resume
  frame();
  pin('A: resume completes deferred recovery exactly once', ctx.deathApi.isOpen() === false
    && ctx.world.currentSystem === 'freehold'
    && !overlayShown()
    && recoveredCount === beforeA + 1
    && recoveredSources[recoveredSources.length - 1] === 'autosave');
  pin('A: systemLoaded queued for subsequent consumers', ctx.lastEvents.some((e) => e.type === 'systemLoaded' && e.to === 'freehold'));
  pin('A: zero-cost recovery keeps berth credits', ctx.world.credits === 500);
  pin('A: autosave aftermath leaves her anxious', ctx.bio.mood === 'anxious');
  pin('A: recovered lands on the agent session ring', ctx.agent.events.some((e) => e.type === 'recovered' && e.source === 'autosave'));
  frame(); // the consumer's frame: rebuild into the restored system
  pin('A: consumer rebuilds into freehold after resume', rebuiltTo === 'freehold');
  frame();
  pin('A: no duplicate recovery after settle', recoveredCount === beforeA + 1);

  // ---- B. Manual request while paused with the hold timer still pending ----
  seedAutosave();
  liveInVeridian();
  destroy();
  ctx.flags.paused = true;
  const beforeB = recoveredCount;
  dispatchKey('Digit1'); // manual request while paused, timer still pending
  pausedFrame();
  pin('B: paused manual request defers, timer survives', ctx.deathApi.isOpen() === true
    && ctx.world.currentSystem === 'veridian'
    && recoveredCount === beforeB
    && pendingTimers() === 1);
  ctx.flags.paused = false;
  frame();
  pin('B: resume completes once and cancels the pending timer', ctx.deathApi.isOpen() === false
    && ctx.world.currentSystem === 'freehold'
    && recoveredCount === beforeB + 1
    && pendingTimers() === 0);
  advance(5000); // the cancelled timer's window elapses
  frame();
  frame();
  pin('B: cancelled hold timer never re-fires', recoveredCount === beforeB + 1
    && ctx.deathApi.isOpen() === false);

  // ---- C. Unpaused normal path is unchanged ----
  seedAutosave();
  liveInVeridian();
  destroy();
  const beforeC1 = recoveredCount;
  dispatchKey('Enter'); // skip the hold, unpaused → immediate recovery
  pin('C: unpaused Enter recovers immediately', ctx.deathApi.isOpen() === false
    && ctx.world.currentSystem === 'freehold'
    && pendingTimers() === 0);
  frame();
  pin('C: unpaused Enter emits recovered once', recoveredCount === beforeC1 + 1
    && recoveredSources[recoveredSources.length - 1] === 'autosave');

  seedAutosave();
  liveInVeridian();
  destroy();
  const beforeC2 = recoveredCount;
  advance(2600); // hold timer fires while unpaused → immediate recovery
  pin('C: unpaused hold timer recovers after the hold', ctx.deathApi.isOpen() === false
    && ctx.world.currentSystem === 'freehold'
    && !overlayShown());
  frame();
  pin('C: hold-timer path emits recovered once', recoveredCount === beforeC2 + 1);

  // ---- D. Fresh fallback through the deferred path (no autosave) ----
  localStorage.removeItem(KEY);
  liveInVeridian();
  destroy();
  pin('D: death overlay opens without a berth record', ctx.deathApi.isOpen() === true);
  ctx.flags.paused = true;
  const beforeD = recoveredCount;
  const woundsBefore = ctx.bio.wounds;
  advance(2600); // hold timer fires while paused, no autosave present
  pausedFrame();
  pin('D: fresh-path hold timer defers while paused', ctx.deathApi.isOpen() === true
    && ctx.world.currentSystem === 'veridian'
    && recoveredCount === beforeD);
  ctx.flags.paused = false;
  frame();
  pin('D: resume completes the fresh fallback exactly once', ctx.deathApi.isOpen() === false
    && ctx.world.currentSystem === 'freehold'
    && recoveredCount === beforeD + 1
    && recoveredSources[recoveredSources.length - 1] === 'fresh'
    && ctx.bio.mood === 'pained'
    && ctx.bio.wounds > woundsBefore);
} finally {
  globalThis.setTimeout = realSetTimeout;
  globalThis.clearTimeout = realClearTimeout;
}

if (fails) {
  console.log(`PAUSE RECOVERY FAIL (${fails})`);
  process.exit(1);
}
console.log('PAUSE RECOVERY PASS');
