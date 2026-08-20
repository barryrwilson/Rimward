// HUD-02 PR1 family hook pins. Headless.
// Run: node --import ./scripts/with-css-stub.mjs out/w62/hook/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { hudFamily, initHud } from '../../../src/systems/hud.js';

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

function makeEl(tag = 'div') {
  const node = {
    tagName: String(tag).toUpperCase(),
    children: [],
    parent: null,
    style: {},
    dataset: {},
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); node.className = [...this._s].join(' '); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); node.className = [...this._s].join(' '); },
      toggle(c, f) { (f ?? !this._s.has(c)) ? this._s.add(c) : this._s.delete(c); node.className = [...this._s].join(' '); },
      contains(c) { return this._s.has(c); },
    },
    appendChild(c) { c.parent = node; this.children.push(c); return c; },
    addEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
  };
  let className = '';
  Object.defineProperty(node, 'className', {
    get() { return className; },
    set(v) { className = String(v); node.classList._s = new Set(className.split(/\s+/).filter(Boolean)); },
  });
  let text = '';
  Object.defineProperty(node, 'textContent', {
    get() { return text; },
    set(v) { text = String(v); },
  });
  return node;
}

const store = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const hudRoot = makeEl('div');
hudRoot.id = 'hud';
const head = makeEl('head');
globalThis.document = {
  head,
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  getElementById: (id) => (id === 'hud' ? hudRoot : null),
};
globalThis.window = { innerWidth: 1280, innerHeight: 720, addEventListener() {}, removeEventListener() {} };

ok('independent.bio', hudFamily({ player: { faction: 'independent' } }) === 'bio');
ok('beautiful.bio', hudFamily({ player: { faction: 'beautiful' } }) === 'bio');
ok('built.mech', hudFamily({ player: { hullKind: 'built', faction: 'freehold' } }) === 'mech');
ok('living.bio', hudFamily({ player: { hullKind: 'living', faction: 'unknowables' } }) === 'bio');
ok('noPlayer.bio', hudFamily({ player: null }) === 'bio');

sessionStorage.setItem('rw-hud-family', 'mech');
ok('override.mech', hudFamily({ player: { faction: 'independent' } }) === 'mech');
sessionStorage.removeItem('rw-hud-family');
ok('override.off.bio', hudFamily({ player: { faction: 'independent' } }) === 'bio');

const prevGet = sessionStorage.getItem;
sessionStorage.getItem = () => { throw new Error('blocked'); };
let blockedBio = false;
try { blockedBio = hudFamily({ player: { faction: 'independent' } }) === 'bio'; }
catch { blockedBio = false; }
sessionStorage.getItem = prevGet;
ok('storage.blocked.bio', blockedBio);

const here = dirname(fileURLToPath(import.meta.url));
const hudSrc = readFileSync(join(here, '../../../src/systems/hud.js'), 'utf8');
ok('no.hullKind.write', !/hullKind\s*=(?!=)/.test(hudSrc));
ok('no.innerHTML', !/innerHTML/.test(hudSrc));
ok('no.throttle.write', !/input\.throttle\s*=/.test(hudSrc));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {} };
const ctx = createCtx({ scene, camera, renderer });
ctx.player = { faction: 'independent' };
ctx.events = [];
ctx.lastEvents = [];
ctx.elapsed = 0;
ctx.world.mystery = { found: [], charted: [] };
const hud = initHud(ctx);
ok('init.default.bio', hudRoot.dataset.family === 'bio');
ok('init.hair.self', hudRoot.children.some((n) => n.classList.contains('rw-combat-self') && n.classList.contains('rw-hair-off')));
ok('init.hair.tgt', hudRoot.children.some((n) => n.classList.contains('rw-combat-target') && n.classList.contains('rw-hair-off')));

ctx.player.hullKind = 'built';
hud.update(0.21);
ok('hz5.built.mech', hudRoot.dataset.family === 'mech');
delete ctx.player.hullKind;
hud.update(0.21);
ok('hz5.restore.bio', hudRoot.dataset.family === 'bio');

if (fails.length) {
  console.log(`PROBE FAIL — ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
