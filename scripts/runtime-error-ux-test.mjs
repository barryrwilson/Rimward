/**
 * Deterministic coverage for the index.html fatal trap (RW-004).
 * Does not boot the sim. Evaluates the inline trap against a mock DOM.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAVE_KEY = 'rimward-save-v1';

let fails = 0;
function pin(name, ok) {
  if (ok) console.log('ok', name);
  else {
    fails += 1;
    console.log('FAIL', name);
  }
}

function makeEl(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [],
    parent: null,
    _listeners: {},
    _attrs: {},
    hidden: false,
    inert: false,
    tabIndex: -1,
    type: '',
    className: '',
    style: { display: 'none', setProperty(k, v) { this[k] = v; } },
    classList: {
      _s: new Set(),
      contains(c) { return this._s.has(c); },
      add(...c) {
        for (const x of c) this._s.add(x);
        el.className = [...this._s].join(' ');
      },
      remove(...c) {
        for (const x of c) this._s.delete(x);
        el.className = [...this._s].join(' ');
      },
    },
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    removeChild(c) {
      const i = this.children.indexOf(c);
      if (i >= 0) this.children.splice(i, 1);
      return c;
    },
    addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn); },
    setAttribute(k, v) {
      this._attrs[k] = String(v);
      if (k === 'id') el.id = String(v);
      if (k === 'class') el.className = String(v);
      if (k === 'hidden') el.hidden = true;
      if (k === 'inert') el.inert = true;
      if (k === 'tabindex') el.tabIndex = Number(v);
    },
    getAttribute(k) { return Object.hasOwn(this._attrs, k) ? this._attrs[k] : null; },
    removeAttribute(k) {
      delete this._attrs[k];
      if (k === 'hidden') el.hidden = false;
    },
    focus() {
      el._focused = true;
      if (globalThis.document) globalThis.document.activeElement = el;
    },
    click() {
      for (const fn of this._listeners.click ?? []) fn({ type: 'click', target: this });
    },
  };
  let id = '';
  Object.defineProperty(el, 'id', {
    get() { return id; },
    set(v) {
      id = String(v);
      el._attrs.id = id;
      elements.set(id, el);
    },
  });
  let text = '';
  Object.defineProperty(el, 'textContent', {
    get() {
      if (el.children.length) return el.children.map((c) => c.textContent).join('');
      return text;
    },
    set(v) {
      text = String(v);
      if (v === '') el.children.length = 0;
    },
  });
  return el;
}

const elements = new Map();
const store = new Map();
const winListeners = {};
let reloads = 0;

function installHarness() {
  elements.clear();
  store.clear();
  reloads = 0;
  for (const k of Object.keys(winListeners)) delete winListeners[k];
  const app = makeEl('div');
  app.id = 'app';
  const hud = makeEl('div');
  hud.id = 'hud';
  const title = makeEl('div');
  title.id = 'rw-title';
  const titleNew = makeEl('button');
  titleNew.id = 'rw-title-new';
  title.appendChild(titleNew);
  const fatal = makeEl('div');
  fatal.id = 'fatal';
  fatal.hidden = true;
  fatal.className = 'rw-fatal';
  const body = makeEl('body');
  body.appendChild(app);
  body.appendChild(hud);
  body.appendChild(title);
  body.appendChild(fatal);
  const doc = {
    body,
    activeElement: null,
    getElementById: (id) => elements.get(id) || null,
    createElement: (t) => makeEl(t),
  };
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const win = {
    __rimwardBooted: false,
    location: { reload() { reloads += 1; } },
    addEventListener(type, fn, opts) {
      const cap = opts === true || (opts && opts.capture);
      const key = cap ? type + ':capture' : type;
      (winListeners[key] ??= []).push(fn);
    },
  };
  globalThis.window = win;
  globalThis.document = doc;
  globalThis.localStorage = localStorage;
  return { win, doc, fatal };
}

function extractTrapScript() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const re = /<script(?![^>]*type=["']module["'])[^>]*>([\s\S]*?)<\/script>/g;
  const blocks = [];
  let m;
  while ((m = re.exec(html))) blocks.push(m[1]);
  pin('index has one inline trap script', blocks.length === 1);
  const src = blocks[0] || '';
  pin('trap script avoids innerHTML', !/innerHTML|insertAdjacentHTML|document\.write/.test(src));
  pin('trap documents boot flag rule', src.includes('__rimwardBooted'));
  return src;
}

function loadTrap(src) {
  const harness = installHarness();
  const run = new Function(src);
  run();
  return harness;
}

function fire(type, event, capture) {
  const key = capture ? type + ':capture' : type;
  for (const fn of winListeners[key] ?? []) fn(event);
}

const src = extractTrapScript();
const mainJs = fs.readFileSync(path.join(ROOT, 'src/main.js'), 'utf8');
pin('main.js sets boot-complete flag', /window\.__rimwardBooted\s*=\s*true/.test(mainJs));
pin('style.css stacks fatal above overlays', /z-index:\s*99/.test(fs.readFileSync(path.join(ROOT, 'src/style.css'), 'utf8')));

{
  const { win } = loadTrap(src);
  pin('startup keeps __websimFatal', typeof win.__websimFatal === 'function');
  win.__websimFatal('boot exploded');
  pin('startup title', document.getElementById('rw-fatal-title')?.textContent === 'RIMWARD failed to start');
  pin('startup body', document.getElementById('rw-fatal-body')?.textContent === 'The game did not finish starting.');
  pin('startup unknown save', document.getElementById('rw-fatal-save')?.textContent === 'Save state on this machine is unknown.');
  pin('startup shows detail', document.getElementById('rw-fatal-detail')?.textContent === 'boot exploded');
  const btn = document.getElementById('rw-fatal-reload');
  pin('reload is a button', btn && btn.tagName === 'BUTTON' && btn.type === 'button');
  pin('reload label', btn && btn.textContent === 'Reload');
  pin('reload is in tab order (no tabindex -1)', btn && btn.getAttribute('tabindex') !== '-1');
  pin('reload focused for keyboard', btn && btn._focused === true);
  const detail = document.getElementById('rw-fatal-detail');
  pin('detail is in tab order', detail && detail.getAttribute('tabindex') === '0');
  pin('app is inert', document.getElementById('app')?.inert === true);
  pin('hud is inert', document.getElementById('hud')?.inert === true);
  pin('title chrome is inert', document.getElementById('rw-title')?.inert === true);
  pin('app aria-hidden', document.getElementById('app')?.getAttribute('aria-hidden') === 'true');
  pin('hud aria-hidden', document.getElementById('hud')?.getAttribute('aria-hidden') === 'true');
  pin('title aria-hidden', document.getElementById('rw-title')?.getAttribute('aria-hidden') === 'true');
  pin('fatal is not aria-hidden', document.getElementById('fatal')?.getAttribute('aria-hidden') !== 'true');
  pin('fatal is not inert', document.getElementById('fatal')?.inert !== true);
  pin('overlay open class', document.getElementById('fatal')?.classList.contains('is-open') === true);
  pin('overlay unhidden', document.getElementById('fatal')?.hidden === false);
  pin('alertdialog role', document.getElementById('fatal')?.getAttribute('role') === 'alertdialog');
  btn.click();
  pin('reload calls location.reload', reloads === 1);
}

{
  const { win } = loadTrap(src);
  win.__rimwardBooted = true;
  win.__websimFatal('mid-flight');
  pin('runtime title', document.getElementById('rw-fatal-title')?.textContent === 'Something broke');
  pin('runtime body', document.getElementById('rw-fatal-body')?.textContent === 'The session stopped.');
  pin('runtime unknown save', document.getElementById('rw-fatal-save')?.textContent === 'Save state on this machine is unknown.');
}

{
  const savedAt = 1_700_000_000_000;
  const { win } = loadTrap(src);
  win.__rimwardBooted = true;
  store.set(SAVE_KEY, JSON.stringify({ v: 1, savedAt, world: { credits: 10 } }));
  win.__websimFatal('after title');
  const expected = 'Last save on this machine: ' + new Date(savedAt).toLocaleString() + '.';
  pin('runtime known save stamp', document.getElementById('rw-fatal-save')?.textContent === expected);
}

{
  const savedAt = 1_700_000_000_000;
  const { win } = loadTrap(src);
  store.set(SAVE_KEY, JSON.stringify({ v: 1, savedAt }));
  win.__websimFatal('startup with save');
  const expected = 'Last save on this machine: ' + new Date(savedAt).toLocaleString() + '.';
  pin('startup known save stamp', document.getElementById('rw-fatal-save')?.textContent === expected);
}

function pinUnknown(name, raw) {
  const { win } = loadTrap(src);
  if (raw === undefined) store.delete(SAVE_KEY);
  else store.set(SAVE_KEY, raw);
  win.__rimwardBooted = true;
  win.__websimFatal('x');
  pin(name, document.getElementById('rw-fatal-save')?.textContent === 'Save state on this machine is unknown.');
}

pinUnknown('missing save is unknown', undefined);
pinUnknown('corrupt json is unknown', '{not json');
pinUnknown('wrong envelope version is unknown', JSON.stringify({ v: 2, savedAt: Date.now() }));
pinUnknown('non-finite savedAt is unknown', JSON.stringify({ v: 1, savedAt: Infinity }));
pinUnknown('string savedAt is unknown', JSON.stringify({ v: 1, savedAt: 'yesterday' }));
pinUnknown('array envelope is unknown', JSON.stringify([{ v: 1, savedAt: 1 }]));

{
  const { win } = loadTrap(src);
  const protoBefore = Object.prototype.polluted;
  store.set(SAVE_KEY, '{"v":1,"savedAt":1700000000000,"__proto__":{"polluted":true}}');
  win.__websimFatal('proto');
  pin('json __proto__ does not pollute Object.prototype', Object.prototype.polluted === protoBefore);
  pin('__proto__ payload still yields a save line or unknown', typeof document.getElementById('rw-fatal-save')?.textContent === 'string');
  delete Object.prototype.polluted;
}

{
  const { win } = loadTrap(src);
  win.__websimFatal('first');
  win.__websimFatal('second');
  pin('keeps first diagnostic', document.getElementById('rw-fatal-detail')?.textContent === 'first');
}

{
  const { win } = loadTrap(src);
  win.__websimFatal('AGENT_TOKEN=super-secret\nboom');
  pin('redacts agent token in detail', document.getElementById('rw-fatal-detail')?.textContent === 'AGENT_TOKEN=<redacted>\nboom');
}

{
  loadTrap(src);
  fire('error', { message: 'kaboom', filename: '/src/main.js', lineno: 12 });
  pin('error event copy is startup before boot flag', document.getElementById('rw-fatal-title')?.textContent === 'RIMWARD failed to start');
  pin('error event includes file:line', document.getElementById('rw-fatal-detail')?.textContent === 'kaboom\n/src/main.js:12');
}

{
  const { win } = loadTrap(src);
  win.__rimwardBooted = true;
  fire('unhandledrejection', { reason: new Error('promise died') });
  pin('rejection uses runtime copy after boot flag', document.getElementById('rw-fatal-title')?.textContent === 'Something broke');
  pin('rejection shows error message', (document.getElementById('rw-fatal-detail')?.textContent || '').includes('promise died'));
}

{
  const { win } = loadTrap(src);
  win.__rimwardBooted = true;
  win.__websimFatal('open');
  const tab = {
    code: 'Tab',
    key: 'Tab',
    stopImmediatePropagation() { this._stopped = true; },
    preventDefault() { this._prevented = true; },
  };
  fire('keydown', tab, true);
  pin('open overlay capture-stops later key handlers', tab._stopped === true);
  pin('Tab preventDefault while overlay open', tab._prevented === true);
  pin('Tab does not reload', reloads === 0);
  pin('Tab from Reload focuses detail', document.activeElement === document.getElementById('rw-fatal-detail'));
  pin('Tab never focuses title', document.activeElement?.id !== 'rw-title-new' && !document.getElementById('rw-title-new')?._focused);

  fire('keydown', {
    code: 'Tab',
    key: 'Tab',
    shiftKey: false,
    stopImmediatePropagation() { this._stopped = true; },
    preventDefault() { this._prevented = true; },
  }, true);
  pin('Tab from detail focuses Reload', document.activeElement === document.getElementById('rw-fatal-reload'));

  fire('keydown', {
    code: 'Tab',
    key: 'Tab',
    shiftKey: true,
    stopImmediatePropagation() { this._stopped = true; },
    preventDefault() { this._prevented = true; },
  }, true);
  pin('Shift+Tab from Reload focuses detail', document.activeElement === document.getElementById('rw-fatal-detail'));

  fire('keydown', {
    code: 'Tab',
    key: 'Tab',
    shiftKey: true,
    stopImmediatePropagation() { this._stopped = true; },
    preventDefault() { this._prevented = true; },
  }, true);
  pin('Shift+Tab from detail focuses Reload', document.activeElement === document.getElementById('rw-fatal-reload'));

  const enter = {
    code: 'Enter',
    key: 'Enter',
    stopImmediatePropagation() { this._stopped = true; },
    preventDefault() { this._prevented = true; },
  };
  fire('keydown', enter, true);
  pin('Enter preventDefault while overlay open', enter._prevented === true);
  pin('Enter activates reload', reloads === 1);

  const space = {
    code: 'Space',
    key: ' ',
    stopImmediatePropagation() { this._stopped = true; },
    preventDefault() { this._prevented = true; },
  };
  fire('keydown', space, true);
  pin('Space activates reload', reloads === 2);

  document.getElementById('rw-fatal-detail').focus();
  const spaceOnDetail = {
    code: 'Space',
    key: ' ',
    stopImmediatePropagation() { this._stopped = true; },
    preventDefault() { this._prevented = true; },
  };
  fire('keydown', spaceOnDetail, true);
  pin('Space on detail does not reload', reloads === 2);
}

if (fails) {
  console.error(fails + ' runtime-error-ux pin(s) failed');
  process.exit(1);
}
console.log('runtime-error-ux pins passed');
