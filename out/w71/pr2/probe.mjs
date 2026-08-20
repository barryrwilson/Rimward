// Wave 71 PR2 — mining job cards (sync / accept / deliver).
// node --import ./scripts/with-css-stub.mjs out/w71/pr2/probe.mjs
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCtx } from '../../../src/core/ctx.js';
import { COMMODITIES, ORE_TYPES, SYSTEMS, U, createShipState } from '../../../src/game/state.js';
import { initStation, holdUnits, DOCK_KEY_SERVICES } from '../../../src/systems/station.js';

const fails = [];
const results = {};
function pin(name, cond, extra = '') {
  results[name] = !!cond;
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

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
    tagName: String(tag).toUpperCase(),
    children: [],
    parent: null,
    _listeners: {},
    _attrs: {},
    style: { setProperty(k, v) { this[k] = v; } },
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); },
      contains(c) { return this._s.has(c); },
    },
    dataset: {},
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn); },
    removeEventListener(type, fn) {
      const a = this._listeners[type];
      if (!a) return;
      const i = a.indexOf(fn);
      if (i >= 0) a.splice(i, 1);
    },
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return Object.hasOwn(this._attrs, k) ? this._attrs[k] : null; },
    click() {
      for (const fn of this._listeners.click ?? []) fn({ type: 'click', target: this });
    },
    getBoundingClientRect() {
      return { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 };
    },
    focus() {},
  };
  let className = '';
  Object.defineProperty(el, 'className', {
    get() { return className; },
    set(v) { className = String(v); },
  });
  let text = '';
  Object.defineProperty(el, 'textContent', {
    get() { return text; },
    set(v) {
      text = String(v);
      if (v === '') el.children.length = 0;
    },
  });
  Object.defineProperty(el, 'firstElementChild', {
    get() { return el.children[0] ?? null; },
  });
  el.scrollTop = 0;
  return el;
}

const winListeners = {};
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  body: makeEl('body'),
  getElementById: () => makeEl(),
  querySelector: () => null,
  querySelectorAll: () => [],
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
  dispatchEvent() {},
};
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

function dispatchKey(code) {
  for (const fn of winListeners.keydown ?? []) fn({ code, repeat: false, preventDefault() {} });
}

function* walkDom(node) {
  yield node;
  for (const c of node.children ?? []) yield* walkDom(c);
}

function stationOverlay() {
  for (const n of walkDom(document.body)) {
    if (typeof n.className === 'string' && n.className.includes('station-overlay')) return n;
  }
  return null;
}

function overlayText() {
  const parts = [];
  const ov = stationOverlay();
  if (!ov) return '';
  for (const n of walkDom(ov)) {
    if (typeof n.textContent === 'string' && n.textContent) parts.push(n.textContent);
  }
  return parts.join('\n');
}

function findAcceptButton(titleFrag) {
  const ov = stationOverlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (typeof n.textContent !== 'string' || !n.textContent.includes(titleFrag)) continue;
    for (let card = n.parent; card && card !== ov; card = card.parent) {
      for (const d of walkDom(card)) {
        if (d.tagName === 'BUTTON' && String(d.textContent).startsWith('Accept')) return d;
      }
    }
  }
  return null;
}

const dt = 1 / 60;
function tick(n, station) {
  for (let i = 0; i < n; i++) {
    ctx.elapsed += dt;
    ctx.world.time += dt;
    station.update(dt);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const renderer = {
  domElement: makeEl('canvas'),
  setSize() {},
  setPixelRatio() {},
  setAnimationLoop() {},
  render() {},
};
const ctx = createCtx({ scene, camera, renderer });
ctx.systems = SYSTEMS;
ctx.world.currentSystem = 'freehold';
ctx.player = createShipState('light', { name: 'Wave71Pr2' });
ctx.ship.object = new THREE.Object3D();
ctx.world.contacts = [];
ctx.world.records = [];
ctx.world.aftermath = [];
ctx.world.incidents = [];
ctx.world.prices = {};
ctx.cargoCapacity = 20;
ctx.cargo = [];

const station = initStation(ctx);

function parkAt(sysId) {
  const st = SYSTEMS[sysId].station.position;
  ctx.ship.object.position.set(st[0] + 36, st[1], st[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
}

function dockHere(label) {
  parkAt(ctx.world.currentSystem);
  ctx.input.dockPressed = true;
  tick(1, station);
  ctx.input.dockPressed = false;
  tick(2, station);
  console.log(`dock ${label}: docked=${ctx.flags.docked} sys=${ctx.world.currentSystem}`);
}

function undock() {
  dispatchKey('Escape');
  if (ctx.flags.docked) dispatchKey('Escape');
  tick(2, station);
}

function goSystem(sysId) {
  undock();
  ctx.world.currentSystem = sysId;
  ctx.lastEvents = [{ type: 'systemLoaded', to: sysId }];
  tick(1, station);
}

function miningJobs(sysId, states) {
  const out = [];
  for (const j of ctx.world.jobs) {
    if (j.kind !== 'mining' || j.originSystem !== sysId) continue;
    if (states && !states.includes(j.state)) continue;
    out.push(j);
  }
  return out;
}

const UNIQUE = ['bounty-ace', 'patrol-lane', 'haul-provisions', 'ferry-consignment'];
const SOFT = Object.keys(ORE_TYPES).filter((k) =>
  ORE_TYPES[k].hardness <= 1 && Object.hasOwn(COMMODITIES, k));

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const stationSrc = readFileSync(join(root, 'src/systems/station.js'), 'utf8');

pin('src.no.innerHTML', !/innerHTML/.test(stationSrc));
pin('src.h.textContent', /node\.textContent = text/.test(stationSrc));
pin('src.syncMining', /function syncMiningJobs\(ctx, sysId\)/.test(stationSrc));
pin('src.no.asteroidIdField', !/asteroidId:/.test(stationSrc));
pin('src.no.jobFactionField', !/job\.faction\s*=/.test(stationSrc));
pin('src.no.SAFE_ID.full', !/SAFE_ID\.test\(\s*job\.id/.test(stationSrc) && !/SAFE_ID\.test\(id\)/.test(stationSrc));
pin('src.digit2.jobs', DOCK_KEY_SERVICES[1] === 'jobs');
pin('src.digit0.shipyard', DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1] === 'shipyard');
pin('src.unique.makeJobs', UNIQUE.every((id) => stationSrc.includes(`id: '${id}'`)));
pin('src.haul.stamp.dest', /job\.payQuoted = jobPayFor\(ctx, otherSystemId\(ctx, job\.originSystem\)/.test(stationSrc));
pin('src.ferry.stamp.dest', /job\.payQuoted = jobPayFor\(ctx, job\.destSystem, job\.reward\)/.test(stationSrc));
pin('src.no.spliceReplace', !/replaceMining|splice\(.*,\s*1\).*makeMiningJob/.test(stationSrc));

dockHere('freehold');
dispatchKey('Digit2');
tick(1, station);

const offered = miningJobs('freehold', ['offered']);
const ids1 = offered.map((j) => j.id).slice().sort();
pin('fill.count2', offered.length === 2, `n=${offered.length}`);
pin('fill.ids.grammar', offered.every((j) => /^mine-freehold-(0|[1-9][0-9]*)$/.test(j.id)));
pin('fill.ids.mine-freehold-0', offered.some((j) => j.id === 'mine-freehold-0'));
pin('fill.ids.mine-freehold-1', offered.some((j) => j.id === 'mine-freehold-1'));
pin('fill.slots', new Set(offered.map((j) => j.slot)).has(0) && new Set(offered.map((j) => j.slot)).has(1));
pin('fill.softOre', offered.every((j) => SOFT.includes(j.commodity) && Object.hasOwn(COMMODITIES, j.commodity)));
pin('fill.need4', offered.every((j) => j.need === 4 && j.progress === 0 && j.state === 'offered'));
pin('fill.no.asteroidId', offered.every((j) => !Object.hasOwn(j, 'asteroidId')));
pin('fill.no.faction', offered.every((j) => !Object.hasOwn(j, 'faction')));
pin('fill.origin', offered.every((j) => j.originSystem === 'freehold'));
pin('fill.title.allowlist', offered.every((j) => j.title === `Mine ${COMMODITIES[j.commodity].name}`));
pin('fill.detail.station', offered.every((j) => j.detail.includes(SYSTEMS.freehold.station.name)));
pin('unique.four', UNIQUE.every((id) => ctx.world.jobs.some((j) => j.id === id)));

const homeText = overlayText();
pin('ui.home.showsOffered', offered.every((j) => homeText.includes(j.title)));
pin('ui.home.accept', !!findAcceptButton('Mine '));
pin('ui.no.html', !/[<>]/.test(homeText) || homeText.indexOf('<') === -1);

dispatchKey('Digit2');
tick(1, station);
const ids2 = miningJobs('freehold', ['offered']).map((j) => j.id).slice().sort();
pin('fill.noReshuffle', JSON.stringify(ids1) === JSON.stringify(ids2), `${ids1} vs ${ids2}`);

goSystem('veridian');
dockHere('veridian-offered-hidden');
dispatchKey('Digit2');
tick(1, station);
const vTextOffered = overlayText();
const fhOffered = miningJobs('freehold', ['offered']);
pin('board.hide.foreignOffered', fhOffered.length === 2
  && fhOffered.every((j) => !vTextOffered.includes(j.detail)));
pin('board.veridian.fills', miningJobs('veridian', ['offered']).length === 2);

goSystem('freehold');
dockHere('freehold-accept');
dispatchKey('Digit2');
tick(1, station);
const toAccept = miningJobs('freehold', ['offered'])[0];
const acceptBtn = toAccept ? findAcceptButton(toAccept.title) : null;
const cargoBeforeAccept = ctx.cargo.slice();
acceptBtn?.click();
tick(1, station);
pin('accept.clicked', !!acceptBtn);
pin('accept.state', toAccept?.state === 'accepted');
pin('accept.noFront', cargoBeforeAccept.length === ctx.cargo.length && holdUnits(ctx, toAccept?.commodity) === 0);
pin('accept.origin', toAccept?.originSystem === 'freehold');
pin('accept.payQuoted.finite', Number.isFinite(toAccept?.payQuoted) && toAccept.payQuoted >= 0 && toAccept.payQuoted <= 20000);
pin('accept.identity', ctx.world.jobs.includes(toAccept));
pin('accept.ui.haveNeed', overlayText().includes('ACCEPTED — deliver') && overlayText().includes('(have 0)'));

goSystem('veridian');
dockHere('veridian-accepted-shown');
dispatchKey('Digit2');
tick(1, station);
const vTextAcc = overlayText();
pin('board.show.acceptedForeign', toAccept?.state === 'accepted' && vTextAcc.includes(toAccept.title)
  && vTextAcc.includes('ACCEPTED — deliver'));

goSystem('freehold');
dockHere('freehold-deliver');
dispatchKey('Digit2');
tick(1, station);
const credits0 = ctx.world.credits;
const rep0 = ctx.world.reputation.freehold ?? 0;
ctx.cargo.push({ commodity: toAccept.commodity, units: 4 });
pin('deliver.have4', holdUnits(ctx, toAccept.commodity) === 4);
tick(40, station);
pin('deliver.credits', ctx.world.credits === credits0 + toAccept.payQuoted, `${credits0}->${ctx.world.credits} pay=${toAccept.payQuoted}`);
pin('deliver.cargo', holdUnits(ctx, toAccept.commodity) === 0);
pin('deliver.rep', (ctx.world.reputation.freehold ?? 0) === rep0 + 2, `rep=${ctx.world.reputation.freehold}`);
pin('deliver.done', toAccept.state === 'done');
pin('deliver.employer.freehold', SYSTEMS.freehold.faction === 'freehold');
pin('unique.four.after', UNIQUE.every((id) => ctx.world.jobs.some((j) => j.id === id)));
pin('no.THREE.onJob', !Object.values(toAccept).some((v) => v && typeof v === 'object' && v.isVector3));

const failed = fails.length;
console.log(JSON.stringify(results, null, 2));
if (failed) {
  console.log(`FAIL ${failed} ${fails.join('; ')}`);
  process.exit(1);
}
console.log('OK');
