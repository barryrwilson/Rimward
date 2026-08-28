// RW-007 targeted WAVE127 ringHeld + WAVE132 dockOneFrame probe.
// Boots a headless graph, reproduces leftover-state fails, then runs the
// pinned observe/pulse path 20 times. Does not change production Agent API.
import * as THREE from 'three';
import { readFile } from 'node:fs/promises';
import { createCtx } from '../src/core/ctx.js';
import { EVENT_CAP, COMM_LINE_CAP } from '../src/game/agent-schema.js';

function makeCtx2d() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {
      canvas: null,
      createRadialGradient: () => gradient,
      createLinearGradient: () => gradient,
      createPattern: () => null,
      measureText: () => ({ width: 10 }),
      getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }),
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, (w || 1) * (h || 1) * 4)) }),
    },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        return typeof prop === 'string' ? function () {} : undefined;
      },
      set() { return true; },
    },
  );
}

function makeEl(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    parent: null,
    _listeners: {},
    _attrs: {},
    style: { setProperty(k, v) { this[k] = v; } },
    classList: {
      _s: new Set(),
      _commit() { el.className = [...this._s].join(' '); },
      add(...c) { c.forEach((x) => this._s.add(x)); this._commit(); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); this._commit(); },
      toggle(c, f) { (f ?? !this._s.has(c)) ? this._s.add(c) : this._s.delete(c); this._commit(); },
      contains(c) { return this._s.has(c); },
    },
    dataset: {},
    innerHTML: '',
    value: '',
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    append(...c) { for (const x of c) if (x && typeof x === 'object') x.parent = el; this.children.push(...c); },
    prepend(...c) { for (const x of c) if (x && typeof x === 'object') x.parent = el; this.children.unshift(...c); },
    insertAdjacentHTML() {},
    insertAdjacentElement() {},
    closest() { return null; },
    cloneNode() { return makeEl(this.tagName); },
    contains() { return false; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    remove() { const p = this.parent; if (p) { const i = p.children.indexOf(this); if (i >= 0) p.children.splice(i, 1); } },
    addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn); },
    removeEventListener(type, fn) { const a = this._listeners[type]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
    setAttribute(k, v) {
      const val = String(v);
      if (k === 'class') { el.className = val; return; }
      el._attrs[k] = val;
      if (k.startsWith('data-')) el.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
    },
    getAttribute(k) { return Object.hasOwn(el._attrs, k) ? el._attrs[k] : null; },
    removeAttribute(k) { delete el._attrs[k]; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 }; },
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
    focus() {},
    click() {
      for (const fn of this._listeners.click ?? []) fn({ type: 'click', target: this });
    },
  };
  let className = '';
  Object.defineProperty(el, 'className', {
    get() { return className; },
    set(v) {
      className = String(v);
      el._attrs.class = className;
      el.classList._s = new Set(className.split(/\s+/).filter(Boolean));
    },
  });
  let text = '';
  Object.defineProperty(el, 'textContent', {
    get() { return text; },
    set(v) { text = String(v); if (v === '') el.children.length = 0; },
  });
  return el;
}

const elements = new Map();
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  createDocumentFragment: () => makeEl('fragment'),
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, makeEl());
    return elements.get(id);
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  body: makeEl('body'),
  addEventListener() {},
  hidden: false,
};
const winListeners = {};
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  location: { search: '', href: 'http://127.0.0.1/boot' },
  addEventListener(type, fn) { (winListeners[type] ??= []).push(fn); },
  removeEventListener(type, fn) { const a = winListeners[type]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
  dispatchEvent() {},
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
const sessionStore = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (sessionStore.has(k) ? sessionStore.get(k) : null),
  setItem: (k, v) => sessionStore.set(k, String(v)),
  removeItem: (k) => sessionStore.delete(k),
};

const { initStarfield } = await import('../src/systems/starfield.js');
const { initSolarSystem } = await import('../src/systems/solarsystem.js');
const { initAsteroids } = await import('../src/systems/asteroids.js');
const { initStation } = await import('../src/systems/station.js');
const { initLandmarks } = await import('../src/systems/landmarks.js');
const { initControls } = await import('../src/systems/controls.js');
const { initSettings } = await import('../src/systems/settings.js');
const { initBio } = await import('../src/game/bio.js');
const { initShip } = await import('../src/systems/ship.js');
const { initWorld } = await import('../src/game/world.js');
const { initContacts } = await import('../src/game/contacts.js');
const { initMystery } = await import('../src/game/mystery.js');
const { initEpics } = await import('../src/game/epics.js');
const { initGate } = await import('../src/systems/gate.js');
const { initJump } = await import('../src/game/jump.js');
const { initNav } = await import('../src/game/nav.js');
const { initAutopilot } = await import('../src/game/autopilot.js');
const { initAgentFlee } = await import('../src/game/agent-flee.js');
const { initTraffic } = await import('../src/game/traffic.js');
const {
  NPC_FACTIONS, NPC_CLASSES, configureShipAssetFileReader, primeShipAsset,
} = await import('../src/systems/ship-assets.js');
configureShipAssetFileReader((assetPath) => readFile(new URL(`../public${assetPath}`, import.meta.url)));
await Promise.all(NPC_FACTIONS.flatMap((faction) => NPC_CLASSES.flatMap((classKey) => [
  primeShipAsset(faction, classKey, 'trader'),
  primeShipAsset(faction, classKey, 'pirate'),
])));
const { initNpc } = await import('../src/systems/npc.js');
const { initCombat } = await import('../src/systems/combat.js');
const { initPods } = await import('../src/game/pods.js');
const { initHail } = await import('../src/systems/hail.js');
const { initSong } = await import('../src/systems/song.js');
const { initSave } = await import('../src/game/save.js');
const { initOrigins } = await import('../src/game/origins.js');
const { initOnboarding } = await import('../src/systems/onboarding.js');
const { initGalaxyChart } = await import('../src/systems/galaxychart.js');
const { initWakes } = await import('../src/systems/wakes.js');
const { initTitle } = await import('../src/systems/title.js');
const { initAgentApi } = await import('../src/systems/agent-api.js');
const { initHud } = await import('../src/systems/hud.js');
const { SYSTEMS, U } = await import('../src/game/state.js');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
const ctx = createCtx({ scene, camera, renderer });
ctx.systems = SYSTEMS;

const inits = [
  ['title', initTitle],
  ['starfield', initStarfield], ['solarsystem', initSolarSystem], ['asteroids', initAsteroids],
  ['station', initStation], ['landmarks', initLandmarks], ['gate', initGate], ['controls', initControls], ['autopilot', initAutopilot], ['flee', initAgentFlee], ['settings', initSettings], ['bio', initBio],
  ['ship', initShip], ['world', initWorld], ['contacts', initContacts], ['mystery', initMystery], ['epics', initEpics], ['jump', initJump], ['nav', initNav], ['traffic', initTraffic],
  ['npc', initNpc], ['combat', initCombat], ['pods', initPods], ['wakes', initWakes], ['hail', initHail],
  ['song', initSong], ['save', initSave], ['origins', initOrigins], ['onboarding', initOnboarding], ['galaxychart', initGalaxyChart], ['agentapi', initAgentApi], ['hud', initHud],
];
const systems = [];
for (const [name, init] of inits) systems.push([name, init(ctx)]);

const dt = 1 / 60;
let frame = 0;
let errors = 0;
function tick(n, label) {
  for (let i = 0; i < n; i++) {
    frame++;
    ctx.elapsed += dt;
    ctx.world.time += dt;
    try {
      for (const [, s] of systems) s?.update?.(dt, ctx);
    } catch (e) {
      errors++;
      console.log(`UPDATE ERR frame ${frame} (${label}): ${e.message}`);
    }
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

function* walkDom(node) {
  yield node;
  for (const c of node.children ?? []) yield* walkDom(c);
}
function titleActionBtn(action) {
  for (const n of walkDom(document.body)) if (n.dataset?.titleAction === action) return n;
  return null;
}
titleActionBtn('new')?.click();
dispatchKey('Digit1');
tick(30, 'probe boot idle');

const rw = globalThis.window?.rimward;
if (!ctx.agent || typeof ctx.agent !== 'object') ctx.agent = { optIn: false, lastIntent: {}, events: [] };
if (!Array.isArray(ctx.agent.events)) ctx.agent.events = [];

function parkAllShips() {
  for (const s of ctx.ships ?? []) {
    if (s?.object?.position) s.object.position.set(9000, 9000, 9000);
  }
}

function fillRingLikePriorWaves() {
  ctx.agent.events.length = 0;
  for (let i = 0; i < COMM_LINE_CAP; i++) {
    ctx.agent.events.push({ type: 'commLine', t: i, text: `leftover-comm-${i}`, from: 'Noise' });
  }
  while (ctx.agent.events.length < EVENT_CAP) {
    ctx.agent.events.push({ type: 'playerFire', t: ctx.agent.events.length, weapon: 'cannon' });
  }
}

function dirtyObserveScene() {
  ctx.flags.paused = false;
  ctx.flags.berthHold = false;
  ctx.agent.optIn = true;
  ctx.input.fireHeld = true;
  fillRingLikePriorWaves();
}

function pinObserveScene() {
  ctx.flags.paused = false;
  ctx.flags.berthHold = false;
  ctx.agent.optIn = true;
  ctx.input.fireHeld = false;
  parkAllShips();
  tick(1, 'w127 pin park');
  ctx.agent.events.length = 0;
}

function runObserve(tag, pauseHold = false) {
  ctx.emit('commLine', { text: 'wave127-ring', from: 'Echo' });
  tick(1, `${tag} harvest`);
  const harvested = Array.isArray(ctx.agent?.events)
    && ctx.agent.events.some((e) => e && e.type === 'commLine' && e.text === 'wave127-ring');
  const savedPause = ctx.flags.paused === true;
  if (pauseHold) ctx.flags.paused = true;
  tick(30, `${tag} ring hold`);
  if (pauseHold) ctx.flags.paused = savedPause;
  const ringHeld = Array.isArray(ctx.agent?.events)
    && ctx.agent.events.some((e) => e && e.type === 'commLine' && e.text === 'wave127-ring');
  return {
    harvested: !!harvested,
    ringHeld: !!(harvested && ringHeld),
    n: Array.isArray(ctx.agent?.events) ? ctx.agent.events.length : 0,
    types: Array.isArray(ctx.agent?.events) ? ctx.agent.events.map((e) => e && e.type) : [],
  };
}

function dirtyDockScene() {
  ctx.flags.berthHold = false;
  ctx.flags.paused = false;
  ctx.flags.docked = false;
  ctx.flags.hailOpen = false;
  ctx.flags.chartOpen = false;
  ctx.flags.berthOpen = false;
  ctx.agent.optIn = true;
  ctx.input.dockPressed = false;
  ctx.input.hailPressed = false;
  if (ctx.ship?.object?.position) ctx.ship.object.position.set(800, 40, 800);
  if (ctx.station) ctx.station.inZone = false;
}

function pinDockScene() {
  ctx.flags.berthHold = false;
  ctx.flags.paused = false;
  ctx.flags.docked = false;
  ctx.flags.hailOpen = false;
  ctx.flags.chartOpen = false;
  ctx.flags.berthOpen = false;
  ctx.agent.optIn = true;
  ctx.input.dockPressed = false;
  ctx.input.hailPressed = false;
  // Hull stays outside DOCK_RANGE*2 so station does not snap/berth.
  if (ctx.ship?.object?.position) ctx.ship.object.position.set(800, 40, 800);
  tick(1, 'w132 flush pendingDock');
  ctx.input.dockPressed = false;
  ctx.input.hailPressed = false;
  // act('dock') reads the stale inZone flag, not live distance.
  ctx.station.inZone = true;
}

function runDock(tag) {
  let dockAct = null;
  let threw = false;
  try { dockAct = rw.act({ v: 1, name: 'dock', args: {} }); } catch { threw = true; }
  const dockNotSameTick = ctx.input.dockPressed !== true && ctx.flags.docked !== true;
  tick(1, `${tag} dock pulse`);
  const dockEdgeOn = ctx.input.dockPressed === true;
  tick(1, `${tag} dock clear`);
  const dockOneFrame = dockAct?.ok === true
    && dockAct?.token === ''
    && dockNotSameTick
    && dockEdgeOn
    && ctx.input.dockPressed === false;
  return {
    dockOneFrame: !!dockOneFrame,
    threw,
    token: dockAct?.token ?? null,
    ok: dockAct?.ok === true,
    dockNotSameTick: !!dockNotSameTick,
    dockEdgeOn: !!dockEdgeOn,
    dockPressedAfter: ctx.input.dockPressed === true,
    inZoneAtAct: true,
  };
}

dirtyObserveScene();
ctx.emit('commLine', { text: 'wave127-ring', from: 'Echo' });
tick(1, 'repro127 harvest');
const reproHarvested = Array.isArray(ctx.agent?.events)
  && ctx.agent.events.some((e) => e && e.type === 'commLine' && e.text === 'wave127-ring');
for (let i = 0; i < 8; i++) {
  ctx.emit('commLine', { text: `flood-${i}`, from: 'Noise' });
  tick(1, 'repro127 flood');
}
const repro127 = {
  harvested: !!reproHarvested,
  ringHeld: !!(reproHarvested && Array.isArray(ctx.agent?.events)
    && ctx.agent.events.some((e) => e && e.type === 'commLine' && e.text === 'wave127-ring')),
  n: Array.isArray(ctx.agent?.events) ? ctx.agent.events.length : 0,
  types: Array.isArray(ctx.agent?.events) ? ctx.agent.events.map((e) => e && e.type) : [],
};
console.log('REPRO wave127 dirty ring:', JSON.stringify(repro127));

dirtyDockScene();
const repro132 = runDock('repro132');
console.log('REPRO wave132 dirty inZone:', JSON.stringify(repro132));

let pass127 = 0;
let pass132 = 0;
for (let i = 1; i <= 20; i++) {
  dirtyObserveScene();
  pinObserveScene();
  const o = runObserve(`pin127-${i}`, true);
  if (o.ringHeld) pass127++;
  else console.log(`PIN FAIL observe loop ${i}:`, JSON.stringify(o));

  dirtyDockScene();
  pinDockScene();
  const d = runDock(`pin132-${i}`);
  if (d.dockOneFrame) pass132++;
  else console.log(`PIN FAIL dock loop ${i}:`, JSON.stringify(d));
}

const reproOk = repro127.ringHeld === false && repro132.dockOneFrame === false;
const pinOk = pass127 === 20 && pass132 === 20 && errors === 0;
console.log('RW-007 probe:', JSON.stringify({
  eventCap: EVENT_CAP,
  commLineCap: COMM_LINE_CAP,
  dockRange: U.DOCK_RANGE,
  repro127Held: repro127.ringHeld,
  repro132Dock: repro132.dockOneFrame,
  repro132Token: repro132.token,
  pass127,
  pass132,
  updateErrors: errors,
  reproOk,
  pinOk,
}));
if (!reproOk || !pinOk) process.exit(1);
console.log('RW-007 PROBE PASS');
