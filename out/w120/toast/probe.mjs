/**
 * Wave 120 PR1 toast-flood headless pins. No Vite.
 * Run: node --import ./scripts/with-css-stub.mjs out/w120/toast/probe.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
function src(rel) {
  return readFileSync(join(rootDir, rel), 'utf8');
}

let fails = 0;
function pin(name, got, expect) {
  const pass = Object.is(got, expect);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)} expect ${JSON.stringify(expect)}`);
  if (!pass) fails++;
  return pass;
}

const hudSrc = src('src/systems/hud.js');
const saveSrc = src('src/game/save.js');
const cssSrc = src('src/ui/hud.css');

pin('window const', /const TOAST_DEDUP_WINDOW = 8/.test(hudSrc), true);
pin('lifetime 4', /const TOAST_LIFETIME = 4/.test(hudSrc), true);
pin('slots 5', /const TOAST_SLOTS = 5/.test(hudSrc), true);
pin('no extra slots', /TOAST_SLOTS\s*=\s*6/.test(hudSrc), false);
pin('linger not Map', /new Map\(/.test(hudSrc), false);
pin('no innerHTML hud', /innerHTML/.test(hudSrc), false);
pin('aria-live polite', /setAttribute\('aria-live', 'polite'\)/.test(hudSrc), true);
pin('no assertive', /aria-live',\s*'assertive'/.test(hudSrc), false);
pin('autosave copy', hudSrc.includes("'▲ AUTOSAVE HELD — hostiles near'"), true);
pin('berth copy prefix', hudSrc.includes("'▲ SAVE BLOCKED — '"), true);
pin('autosave emit', saveSrc.includes("source: 'autosave'"), true);
pin('berth emit', (saveSrc.match(/source: 'berth'/g) || []).length >= 4, true);
pin('no WORLD_FIELDS toast', /toastMem/.test(saveSrc), false);
pin('css hide only', cssSrc.includes('.rw-toast:not(.show) { visibility: hidden; }'), true);
pin('css no toast z', /^\s*\.rw-toasts[\s\S]*?z-index/m.test(cssSrc.slice(cssSrc.indexOf('.rw-toasts'))?.split('.rw-toast {')[0] || ''), false);
pin('expire keeps text', /s\.el\.textContent\s*=\s*''/.test(hudSrc) === false, true);
pin('frameLines kept', /mem\.frameLines\.length = 0/.test(hudSrc), true);

function makeEl(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
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
    value: '',
    id: '',
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    append(...c) { for (const x of c) if (x && typeof x === 'object') x.parent = el; this.children.push(...c); },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn); },
    removeEventListener() {},
    setAttribute(k, v) {
      const val = String(v);
      if (k === 'class') { el.className = val; return; }
      if (k === 'id') { el.id = val; elements.set(val, el); }
      el._attrs[k] = val;
    },
    getAttribute(k) { return Object.hasOwn(el._attrs, k) ? el._attrs[k] : null; },
    removeAttribute(k) { delete el._attrs[k]; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 }; },
    getContext() { return null; },
    focus() {},
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
const hudRoot = makeEl('div');
hudRoot.id = 'hud';
elements.set('hud', hudRoot);
const head = makeEl('head');
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  getElementById: (id) => elements.get(id) || null,
  querySelector: () => null,
  querySelectorAll: () => [],
  head,
  body: makeEl('body'),
  addEventListener() {},
  hidden: false,
};
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
};
globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const { initHud } = await import('../../../src/systems/hud.js');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const ctx = {
  scene,
  camera,
  elapsed: 0,
  events: [],
  lastEvents: [],
  emit() {},
  flags: { paused: false, docked: false, combat: false, firstPerson: false, matchSpeed: false },
  gate: { jumping: false },
  settings: { textScale: 1, reducedMotion: false },
  config: { controls: [] },
  world: {
    fear: 0, time: 0, credits: 0, currentSystem: 'freehold', scanner: 0,
    launcher: '', missileAmmo: 0, miningLaser: '',
    mystery: { charted: [], visited: [] },
    nav: null,
  },
  player: { hullKind: 'built', classKey: 'light', faction: 'freehold', destroyed: false },
  ship: {
    object: { position: new THREE.Vector3() },
    velocity: new THREE.Vector3(),
    speed: 0,
    burnerActive: false,
    burnerReadyAt: 0,
  },
  targets: { current: null, reticleScreen: { x: 0.5, y: 0.5 } },
  ships: [],
  input: { weaponGroup: 1 },
  automine: { engaged: false },
};

const hud = initHud(ctx);

function walk(n, out = []) {
  out.push(n);
  for (const c of n.children ?? []) walk(c, out);
  return out;
}
function toastChips() {
  return walk(hudRoot).filter((n) => {
    const c = n.className || '';
    return typeof c === 'string' && /(^|\s)rw-toast(\s|$)/.test(c);
  });
}
function shownToasts() {
  return toastChips().filter((n) => n.classList.contains('show'));
}
function tick(elapsed, events = []) {
  ctx.elapsed = elapsed;
  ctx.world.time = elapsed;
  ctx.events = events;
  ctx.lastEvents = [];
  try { hud.update(0); } catch { /* toast channel runs before the rest of HUD */ }
}

const bootChips = toastChips();
pin('boot five chips', bootChips.length, 5);
pin('boot aria-hidden', bootChips.every((n) => n.getAttribute('aria-hidden') === 'true'), true);
pin('boot no show', bootChips.every((n) => !n.classList.contains('show')), true);
pin('boot live polite', (() => {
  const stack = walk(hudRoot).find((n) => (n.className || '').includes('rw-toasts'));
  return stack ? stack.getAttribute('aria-live') : null;
})(), 'polite');

tick(0, [{ type: 'saveBlocked', source: 'autosave', reason: 'Hostiles within the encounter bubble — berth record refused.' }]);
let shown = shownToasts();
pin('autosave one slot', shown.length, 1);
pin('autosave copy live', shown[0]?.textContent, '▲ AUTOSAVE HELD — hostiles near');
pin('autosave unhidden', shown[0]?.getAttribute('aria-hidden'), 'false');
pin('autosave no berth reason', shown[0]?.textContent.includes('berth record'), false);

const autoText = shown[0]?.textContent;
tick(2, [{ type: 'saveBlocked', source: 'autosave', reason: 'Hostiles within the encounter bubble — berth record refused.' }]);
shown = shownToasts();
pin('visible refresh still one', shown.length, 1);
pin('visible refresh no rewrite', shown[0]?.textContent, autoText);

tick(6.1, []);
shown = shownToasts();
const hiddenHeld = toastChips().find((n) => n.textContent === '▲ AUTOSAVE HELD — hostiles near');
pin('expire hides show', shown.length, 0);
pin('expire aria-hidden', hiddenHeld?.getAttribute('aria-hidden'), 'true');
pin('expire keeps text', hiddenHeld?.textContent, '▲ AUTOSAVE HELD — hostiles near');

tick(7, [{ type: 'saveBlocked', source: 'autosave' }]);
shown = shownToasts();
pin('linger suppress after expire', shown.length, 0);
pin('linger no blink text change', hiddenHeld?.textContent, '▲ AUTOSAVE HELD — hostiles near');

tick(50, [{ type: 'saveBlocked', source: 'autosave' }]);
tick(50.1, [{ type: 'commLine', text: 'Line A' }]);
tick(50.2, [{ type: 'commLine', text: 'Line B' }]);
tick(50.3, [{ type: 'commLine', text: 'Line C' }]);
tick(50.4, [{ type: 'commLine', text: 'Line D' }]);
pin('five distinct slots', shownToasts().length, 5);
tick(55, [{ type: 'saveBlocked', source: 'autosave' }]);
const autoShown = shownToasts().filter((n) => n.textContent.includes('AUTOSAVE HELD') && n.classList.contains('show'));
pin('key linger survives chip reuse', autoShown.length, 0);
pin('still five chips', toastChips().length, 5);

tick(20, [{ type: 'saveBlocked', source: 'berth', reason: 'Mid-jump — berth record refused.' }]);
const berth = shownToasts().find((n) => (n.textContent || '').includes('SAVE BLOCKED'));
pin('berth copy', berth?.textContent, '▲ SAVE BLOCKED — Mid-jump — berth record refused.');

tick(30, [{ type: 'saveBlocked', reason: 'Hostiles within the encounter bubble — berth record refused.' }]);
const missing = shownToasts().find((n) => (n.textContent || '').startsWith('▲ SAVE BLOCKED — Hostiles'));
pin('missing source is berth copy', !!missing, true);

tick(40, [{ type: 'saveBlocked', source: 'unknown', reason: 'nope' }]);
const unk = shownToasts().find((n) => n.textContent === '▲ SAVE BLOCKED — nope');
pin('unknown source is berth copy', !!unk, true);

const shownBeforeEmpty = shownToasts().length;
tick(41, [{ type: 'commLine', text: '' }]);
pin('empty text skip', shownToasts().length, shownBeforeEmpty);
pin('sim not paused', ctx.flags.paused, false);

if (fails) {
  console.log(`FAIL  ${fails} pin(s)`);
  process.exit(1);
}
console.log('PASS  toast-flood probe');
