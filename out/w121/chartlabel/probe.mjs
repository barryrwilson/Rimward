/**
 * Wave 121 PR1 chart-label headless pins. No Vite.
 * Run: node --import ./scripts/with-css-stub.mjs out/w121/chartlabel/probe.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEMS } from '../../../src/game/state.js';
import { sanitizeSystemId } from '../../../src/game/nav.js';

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

const chartSrc = src('src/systems/galaxychart.js');
const cssSrc = src('src/ui/hud.css');
const overlaySrc = src('src/systems/overlay-policy.js');
const overlayPath = join(rootDir, 'src/systems/overlay-policy.js');

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
    htmlFor: '',
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    append(...c) { for (const x of c) if (x && typeof x === 'object') x.parent = el; this.children.push(...c); },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn); },
    removeEventListener() {},
    setAttribute(k, v) {
      const val = String(v);
      if (k === 'class') { el.className = val; return; }
      if (k === 'id') { el.id = val; return; }
      if (k === 'for') { el.htmlFor = val; el._attrs.for = val; return; }
      el._attrs[k] = val;
      if (k.startsWith('data-')) el.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
    },
    getAttribute(k) {
      if (k === 'class') return el.className || null;
      if (k === 'id') return el.id || null;
      if (k === 'for') return el.htmlFor || el._attrs.for || null;
      return Object.hasOwn(el._attrs, k) ? el._attrs[k] : null;
    },
    removeAttribute(k) { delete el._attrs[k]; },
    contains(n) {
      if (n === el) return true;
      for (const c of el.children) {
        if (c === n) return true;
        if (typeof c.contains === 'function' && c.contains(n)) return true;
      }
      return false;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { x: 0, y: 0, width: 800, height: 500, top: 0, left: 0, right: 800, bottom: 500 }; },
    getContext() { return null; },
    focus() {},
    blur() {},
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

const winListeners = {};
const body = makeEl('body');
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body,
  activeElement: null,
  addEventListener() {},
  hidden: false,
};
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener(type, fn) { (winListeners[type] ??= []).push(fn); },
  removeEventListener(type, fn) {
    const a = winListeners[type];
    if (!a) return;
    const i = a.indexOf(fn);
    if (i >= 0) a.splice(i, 1);
  },
};
globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

function dispatchKey(code) {
  for (const fn of winListeners.keydown ?? []) fn({ code, repeat: false, preventDefault() {} });
}

function walk(n, out = []) {
  out.push(n);
  for (const c of n.children ?? []) walk(c, out);
  return out;
}

function byClass(root, cls) {
  const out = [];
  for (const n of walk(root)) {
    const raw = n.getAttribute?.('class') ?? n.className ?? '';
    if (String(raw).split(/\s+/).includes(cls)) out.push(n);
  }
  return out;
}

const { initGalaxyChart } = await import('../../../src/systems/galaxychart.js');

const ctx = {
  elapsed: 0,
  events: [],
  emit() {},
  flags: { paused: false, docked: false, chartOpen: false, hailOpen: false, berthOpen: false },
  settings: { textScale: 1, reducedMotion: false },
  world: {
    time: 0,
    currentSystem: 'freehold',
    nav: undefined,
    reputation: {},
  },
};

const chart = initGalaxyChart(ctx);
const chartRoot = byClass(body, 'rw-galaxy-chart')[0];
const svg = byClass(chartRoot, 'rw-galaxy-svg')[0];
const labels = byClass(chartRoot, 'rw-galaxy-label');
const destSelect = walk(chartRoot).find((n) => n.id === 'rw-galaxy-dest');
const destLbl = walk(chartRoot).find((n) => n.tagName === 'LABEL' && (n.htmlFor === 'rw-galaxy-dest' || n.getAttribute('for') === 'rw-galaxy-dest'));
const desc = walk(chartRoot).find((n) => n.id === 'rw-galaxy-chart-desc');
const apLive = walk(chartRoot).find((n) => n.id === 'rw-galaxy-ap-live');
const clearBtn = byClass(chartRoot, 'rw-galaxy-clear')[0];

pin('root present', !!chartRoot, true);
pin('labels exist', labels.length > 0, true);
pin('labels have data-system-id', labels.every((n) => !!sanitizeSystemId(n.getAttribute('data-system-id'))), true);
pin('freehold label id', labels.some((n) => n.getAttribute('data-system-id') === 'freehold'), true);
pin('dest select exists', !!destSelect && destSelect.tagName === 'SELECT', true);
pin('dest labelled htmlFor', !!destLbl && destLbl.htmlFor === 'rw-galaxy-dest', true);
pin('dest label copy', destLbl ? destLbl.textContent : null, 'Destination');
const destField = destSelect && destSelect.parent;
pin('dest field after desc', !!(desc && destField && desc.parent === destField.parent && desc.parent.children.indexOf(desc) < desc.parent.children.indexOf(destField)), true);
pin('dest not in actions', destField ? destField.className !== 'rw-galaxy-chart-actions' && destField.parent && destField.parent.className !== 'rw-galaxy-chart-actions' : false, true);

const destIds = (destSelect?.children ?? []).filter((o) => o.value).map((o) => o.value);
const chartedIds = Object.keys(SYSTEMS).filter((id) => {
  if (!Object.hasOwn(SYSTEMS, id)) return false;
  const sys = SYSTEMS[id];
  return !!sys && Array.isArray(sys.chart) && !!sanitizeSystemId(id);
});
pin('dest placeholder first', destSelect?.children?.[0]?.value === '' && destSelect?.children?.[0]?.textContent === 'Plot a system', true);
pin('dest option count', destIds.length, chartedIds.length);
pin('dest has charted ids', chartedIds.every((id) => destIds.includes(id)), true);

const authored = new Set(['freehold', 'veridian', 'redmarch', 'hollowreach', 'hush', 'verge', 'veil']);
const pinned = new Set(['stolenwomb', 'lastbeacon', 'blackstation', 'fx_bastion', 'gc_auction']);
const generated = chartedIds.find((id) => {
  const sys = SYSTEMS[id];
  return !authored.has(id) && !pinned.has(id) && !sys.hub;
});
pin('generated dest option', !!generated && destIds.includes(generated), true);

pin('src isPlotTarget', chartSrc.includes('function isPlotTarget(el)'), true);
pin('src activateSystem', chartSrc.includes('function activateSystem(id)'), true);
pin('src hit or label', chartSrc.includes("parts[i] === 'rw-galaxy-hit' || parts[i] === 'rw-galaxy-label'"), true);
pin('src click isPlotTarget', /svg\.addEventListener\('click'[\s\S]{0,120}isPlotTarget/.test(chartSrc), true);
pin('src hover isPlotTarget', /pointerover[\s\S]{0,120}isPlotTarget/.test(chartSrc), true);
pin('src hover applyHoverId', /pointerover[\s\S]{0,220}applyHoverId\(sanitizeSystemId/.test(chartSrc), true);
pin('src no innerHTML', chartSrc.includes('innerHTML'), false);
pin('src no for-in dest', /for\s*\(\s*(?:const|let|var)\s+\w+\s+in\s+/.test(chartSrc), false);
pin('src HIT 24', /const HIT_CSS_DIAMETER = 24/.test(chartSrc), true);
pin('src import isTypingFocus', chartSrc.includes('isTypingFocus') && chartSrc.includes("from './overlay-policy.js'"), true);
pin('src KeyM typing skip', /if \(open\) \{\s*let typing = false;\s*try \{ typing = isTypingFocus\(\) === true; \}/.test(chartSrc), true);
pin('src dest fallback', chartSrc.includes("ae.id === 'rw-galaxy-dest'"), true);
pin('src Escape still closes', /else if \(e\.code === 'Escape' && open\) \{\s*setOpen\(false\);/.test(chartSrc), true);
pin('src no new KeyM listener', (chartSrc.match(/e\.code === 'KeyM'/g) || []).length, 1);
pin('src showApLive body', /function showApLive\(text\) \{\s*const line = typeof text === 'string' \? text : '';\s*apLive\.textContent = line;\s*apLiveUntil = line \? ctx\.elapsed \+ AP_LIVE_LIFE : 0;\s*\}/.test(chartSrc), true);
pin('src AP success close', /showApLive\(''\);\s*setOpen\(false\);/.test(chartSrc), true);
pin('src no paused write', /flags\.paused\s*=/.test(chartSrc), false);
pin('src no jumpRequested', chartSrc.includes('jumpRequested'), false);
pin('src no tabindex labels', /rw-galaxy-label[\s\S]{0,180}tabindex/.test(chartSrc) || chartSrc.includes('tabIndex'), false);
pin('src dest Object.keys', chartSrc.includes('for (const id of Object.keys(SYSTEMS))'), true);
pin('src dest hasOwn', /for \(const id of Object\.keys\(SYSTEMS\)\) \{\s*if \(!Object\.hasOwn\(SYSTEMS, id\)\) continue;/.test(chartSrc), true);
pin('src dest textContent', /opt\.textContent = rec\.name/.test(chartSrc), true);
pin('src dest empty noop', /destSelect\.addEventListener\('change'[\s\S]{0,80}if \(!v\) return;/.test(chartSrc), true);
pin('src dest sync value', /destSelect\.value = \(st === 'plotted' \|\| st === 'blocked'\) && dest \? dest : ''/.test(chartSrc), true);
pin('overlay untouched import chart', overlaySrc.includes('galaxychart'), false);
pin('overlay isTypingFocus SELECT', overlaySrc.includes("tag === 'SELECT'"), true);
pin('overlay isTypingFocus export', overlaySrc.includes('export function isTypingFocus()'), true);
pin('overlay canOpenPlayCard', overlaySrc.includes('export function canOpenPlayCard'), true);
pin('overlay playSurfaceBlocked', overlaySrc.includes('export function playSurfaceBlocked'), true);
pin('css label pointer-events all', /\.rw-galaxy-label\s*\{[^}]*pointer-events:\s*all/.test(cssSrc), true);
pin('css label not none', /\.rw-galaxy-label\s*\{[^}]*pointer-events:\s*none/.test(cssSrc), false);
pin('css dest focus-visible', cssSrc.includes('.rw-galaxy-dest:focus-visible'), true);
pin('css chart z 30', /\.rw-galaxy-chart\s*\{[\s\S]*?z-index:\s*30;/.test(cssSrc), true);
pin('css no dest animation', /\.rw-galaxy-dest[^{]*\{[^}]*animation/.test(cssSrc), false);
pin('css toast untouched', cssSrc.includes('.rw-toast:not(.show) { visibility: hidden; }'), true);

dispatchKey('KeyM');
chart.update();
pin('opens on KeyM', ctx.flags.chartOpen === true && !chartRoot.classList.contains('is-hidden'), true);

const fhLabel = labels.find((n) => n.getAttribute('data-system-id') === 'freehold');
const vdLabel = labels.find((n) => n.getAttribute('data-system-id') === 'veridian');
const navBeforeHover = ctx.world.nav;
for (const fn of svg._listeners?.pointerover ?? []) {
  fn({ type: 'pointerover', target: vdLabel });
}
pin('hover does not plot', ctx.world.nav, navBeforeHover);

for (const fn of svg._listeners?.click ?? []) {
  fn({ type: 'click', target: vdLabel });
}
pin('label click plots', !!(ctx.world.nav && ctx.world.nav.dest === 'veridian' && ctx.world.nav.status === 'plotted'), true);
pin('dest sync after label', destSelect.value, 'veridian');

const hoverNav = ctx.world.nav;
for (const fn of svg._listeners?.pointerover ?? []) {
  fn({ type: 'pointerover', target: fhLabel });
}
pin('hover after plot no rewrite', ctx.world.nav, hoverNav);

destSelect.value = '';
for (const fn of destSelect._listeners?.change ?? []) fn({ type: 'change', target: destSelect });
pin('empty dest no-op', !!(ctx.world.nav && ctx.world.nav.dest === 'veridian'), true);

if (generated) {
  destSelect.value = generated;
  for (const fn of destSelect._listeners?.change ?? []) fn({ type: 'change', target: destSelect });
  pin('generated dest activate', ctx.world.nav && (ctx.world.nav.dest === generated), true);
}

if (clearBtn) clearBtn.click();
pin('clear still clears', ctx.world.nav === undefined, true);
pin('dest sync after clear', destSelect.value, '');

document.activeElement = destSelect;
dispatchKey('KeyM');
pin('KeyM dest SELECT stays', ctx.flags.chartOpen === true, true);

document.activeElement = { id: 'rw-galaxy-dest', tagName: 'DIV' };
dispatchKey('KeyM');
pin('KeyM dest id fallback stays', ctx.flags.chartOpen === true, true);

document.activeElement = destSelect;
dispatchKey('Escape');
pin('Escape dest still closes', ctx.flags.chartOpen === false, true);

document.activeElement = null;
dispatchKey('KeyM');
pin('KeyM reopen', ctx.flags.chartOpen === true, true);
dispatchKey('KeyM');
pin('KeyM no typing closes', ctx.flags.chartOpen === false, true);

pin('ap live node kept', !!apLive && apLive.id === 'rw-galaxy-ap-live', true);
pin('no overlay rewrite file', overlayPath.endsWith('overlay-policy.js'), true);

if (fails) {
  console.error(`chart-label probe FAIL ${fails}`);
  process.exit(1);
}
console.log('chart-label probe PASS');
