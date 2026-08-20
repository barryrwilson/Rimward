// Wave 71 PR2 — extra hunt: double-pay, stuffed faction, leak, no reshuffle.
// node --import ./scripts/with-css-stub.mjs out/w71/pr2/hunt.mjs
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { COMMODITIES, ORE_TYPES, SYSTEMS, FACTIONS, createShipState } from '../../../src/game/state.js';
import { initStation, holdUnits } from '../../../src/systems/station.js';

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
ctx.player = createShipState('light', { name: 'Wave71Pr2Hunt' });
ctx.ship.object = new THREE.Object3D();
ctx.world.contacts = [];
ctx.world.records = [];
ctx.world.aftermath = [];
ctx.world.incidents = [];
ctx.world.prices = {};
ctx.cargoCapacity = 20;
ctx.cargo = [];

const station = initStation(ctx);
const SOFT = Object.keys(ORE_TYPES).filter((k) =>
  ORE_TYPES[k].hardness <= 1 && Object.hasOwn(COMMODITIES, k));
const UNIQUE = ['bounty-ace', 'patrol-lane', 'haul-provisions', 'ferry-consignment'];

function parkAt(sysId) {
  const st = SYSTEMS[sysId].station.position;
  ctx.ship.object.position.set(st[0] + 36, st[1], st[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
}

function dockHere() {
  parkAt(ctx.world.currentSystem);
  ctx.input.dockPressed = true;
  tick(1, station);
  ctx.input.dockPressed = false;
  tick(2, station);
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

function openJobs() {
  dispatchKey('Digit2');
  tick(1, station);
}

dockHere();
openJobs();

const snap1 = miningJobs('freehold', ['offered']).map((j) => ({
  id: j.id, commodity: j.commodity, slot: j.slot, need: j.need, title: j.title,
}));
openJobs();
const snap2 = miningJobs('freehold', ['offered']).map((j) => ({
  id: j.id, commodity: j.commodity, slot: j.slot, need: j.need, title: j.title,
}));
pin('hunt.noCommodityReshuffle', JSON.stringify(snap1) === JSON.stringify(snap2),
  `${JSON.stringify(snap1)} vs ${JSON.stringify(snap2)}`);
pin('hunt.softOnly', snap1.every((j) => SOFT.includes(j.commodity)));
pin('hunt.softKeys.rawOre.livingRock',
  SOFT.length === 2 && SOFT.includes('rawOre') && SOFT.includes('livingRock'));

goSystem('veridian');
dockHere();
openJobs();
const fhOff = miningJobs('freehold', ['offered']);
const vText = overlayText();
pin('hunt.foreignOfferedHidden', fhOff.length === 2 && fhOff.every((j) =>
  !vText.includes(j.detail) && !vText.includes(j.id)));
pin('hunt.veridian.noFreeholdId', !vText.includes('mine-freehold-'));

const vOff = miningJobs('veridian', ['offered']);
const vJob = vOff[0];
const vAccept = vJob ? findAcceptButton(vJob.title) : null;
const cargo0 = ctx.cargo.length;
vAccept?.click();
tick(1, station);
pin('hunt.accept.veridian', vJob?.state === 'accepted');
pin('hunt.accept.noFront', ctx.cargo.length === cargo0);

const expectedPay = vJob
  ? Math.round(vJob.need * (ctx.world.prices[vJob.commodity] ?? COMMODITIES[vJob.commodity].base) * 1.4)
  : NaN;
// Authored docks skip FACTION_SERVICES jobPayMult (station.js jobPayFor).
pin('hunt.payQuoted.originHaulMargin', vJob?.payQuoted === expectedPay,
  `quoted=${vJob?.payQuoted} expected=${expectedPay} need=${vJob?.need} c=${vJob?.commodity}`);

vJob.faction = 'freehold';
const fhRep0 = ctx.world.reputation.freehold ?? 0;
const vdRep0 = ctx.world.reputation.veridian ?? 0;
const credits0 = ctx.world.credits;
ctx.cargo.push({ commodity: vJob.commodity, units: 4 });
tick(40, station);
pin('hunt.deliver.once', ctx.world.credits === credits0 + vJob.payQuoted,
  `${credits0}->${ctx.world.credits} pay=${vJob.payQuoted}`);
pin('hunt.deliver.done', vJob.state === 'done');
pin('hunt.rep.employer.notStuffed',
  (ctx.world.reputation.veridian ?? 0) === vdRep0 + 2
  && (ctx.world.reputation.freehold ?? 0) === fhRep0,
  `vd=${ctx.world.reputation.veridian} fh=${ctx.world.reputation.freehold} stuffed=${vJob.faction}`);
pin('hunt.rep.keyIsSystemsFaction', SYSTEMS.veridian.faction === 'veridian'
  && Object.hasOwn(FACTIONS, SYSTEMS.veridian.faction));

const credits1 = ctx.world.credits;
ctx.cargo.push({ commodity: vJob.commodity, units: 4 });
tick(80, station);
pin('hunt.noDoublePay', ctx.world.credits === credits1 && vJob.state === 'done',
  `${credits1}->${ctx.world.credits} state=${vJob.state}`);
pin('hunt.staleAcceptDoesNotMatter', vJob.state !== 'accepted');

const other = miningJobs('freehold', ['offered'])[0];
goSystem('freehold');
dockHere();
openJobs();
const acc = findAcceptButton(other.title);
acc?.click();
tick(1, station);
goSystem('veridian');
dockHere();
openJobs();
const credits2 = ctx.world.credits;
const cargoBefore = holdUnits(ctx, other.commodity);
if (holdUnits(ctx, other.commodity) < 4) ctx.cargo.push({ commodity: other.commodity, units: 4 });
tick(40, station);
pin('hunt.noPayAtForeignDock', other.state === 'accepted'
  && ctx.world.credits === credits2
  && holdUnits(ctx, other.commodity) >= cargoBefore,
  `state=${other.state} credits ${credits2}->${ctx.world.credits} hold=${holdUnits(ctx, other.commodity)}`);

goSystem('freehold');
dockHere();
openJobs();
const vTextHome = overlayText();
pin('hunt.acceptedShowsAtHome', other.state === 'accepted' && vTextHome.includes(other.title));
pin('hunt.unique.four', UNIQUE.every((id) => ctx.world.jobs.some((j) => j.id === id)));

const liveFh = miningJobs('freehold', ['offered', 'accepted']);
pin('hunt.slots.le.2.live', liveFh.length <= 2, `n=${liveFh.length}`);

const ids = ctx.world.jobs.filter((j) => j.kind === 'mining').map((j) => j.id);
pin('hunt.ids.unique', new Set(ids).size === ids.length, ids.join(','));
pin('hunt.ids.grammar', ids.every((id) => /^mine-[a-z0-9_]+-(0|[1-9][0-9]*)$/i.test(id)));
pin('hunt.no.asteroidId', ctx.world.jobs.filter((j) => j.kind === 'mining').every((j) => !Object.hasOwn(j, 'asteroidId')));

const failed = fails.length;
console.log(JSON.stringify(results, null, 2));
if (failed) {
  console.log(`FAIL ${failed} ${fails.join('; ')}`);
  process.exit(1);
}
console.log('OK');
