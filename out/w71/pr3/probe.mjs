// Wave 71 PR3 — mining splice+replace and expire.
// node --import ./scripts/with-css-stub.mjs out/w71/pr3/probe.mjs
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
const comms = [];
const _emit = ctx.emit.bind(ctx);
ctx.emit = (type, payload) => {
  if (type === 'commLine') comms.push(payload?.text ?? '');
  return _emit(type, payload);
};
ctx.systems = SYSTEMS;
ctx.world.currentSystem = 'freehold';
ctx.player = createShipState('light', { name: 'Wave71Pr3' });
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

function miningJobs(sysId, states) {
  const out = [];
  for (const j of ctx.world.jobs) {
    if (j.kind !== 'mining' || j.originSystem !== sysId) continue;
    if (states && !states.includes(j.state)) continue;
    out.push(j);
  }
  return out;
}

function miningBoard(sysId) {
  return ctx.world.jobs.filter((j) => j.kind === 'mining' && j.originSystem === sysId);
}

const UNIQUE = ['bounty-ace', 'patrol-lane', 'haul-provisions', 'ferry-consignment'];

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const stationSrc = readFileSync(join(root, 'src/systems/station.js'), 'utf8');
const worldSrc = readFileSync(join(root, 'src/game/world.js'), 'utf8');

pin('src.no.innerHTML', !/innerHTML/.test(stationSrc));
pin('src.h.textContent', /node\.textContent = text/.test(stationSrc));
pin('src.replaceMiningJob', /function replaceMiningJob\(ctx, job\)/.test(stationSrc));
pin('src.completeJob.done', /function completeJob[\s\S]{0,120}job\.state = 'done'/.test(stationSrc));
pin('src.deadline.600', /const MINING_DEADLINE = 600/.test(stationSrc));
pin('src.cite.WRECK_TTL', /WRECK_TTL/.test(stationSrc));
pin('world.WRECK_TTL.600', /const WRECK_TTL = 600/.test(worldSrc));
pin('src.digit2.jobs', DOCK_KEY_SERVICES[1] === 'jobs');
pin('src.unique.makeJobs', UNIQUE.every((id) => stationSrc.includes(`id: '${id}'`)));
pin('src.no.SAFE_ID.full', !/SAFE_ID\.test\(\s*job\.id/.test(stationSrc) && !/SAFE_ID\.test\(id\)/.test(stationSrc));
pin('src.emit.commLine', /ctx\.emit\('commLine', \{ text:/.test(stationSrc));

dockHere('freehold');
dispatchKey('Digit2');
tick(1, station);

const offered0 = miningJobs('freehold', ['offered']);
pin('fill.count2', offered0.length === 2, `n=${offered0.length}`);
pin('fill.deadline.post', offered0.every((j) => Number.isFinite(j.deadline) && j.deadline === ctx.world.time - dt + 600
  || (Number.isFinite(j.deadline) && j.deadline > ctx.world.time)));
pin('unique.four', UNIQUE.every((id) => ctx.world.jobs.some((j) => j.id === id)));

const toAccept = miningJobs('freehold', ['offered'])[0];
const acceptBtn = toAccept ? findAcceptButton(toAccept.title) : null;
const timeAtAccept = ctx.world.time;
acceptBtn?.click();
tick(1, station);
pin('accept.clicked', !!acceptBtn);
pin('accept.state', toAccept?.state === 'accepted');
pin('accept.deadline.restart', toAccept?.deadline === timeAtAccept + 600, `dl=${toAccept?.deadline} t=${timeAtAccept}`);
pin('accept.payQuoted.finite', Number.isFinite(toAccept?.payQuoted) && toAccept.payQuoted >= 0 && toAccept.payQuoted <= 20000);
pin('accept.identity', ctx.world.jobs.includes(toAccept));

const slotKept = toAccept.slot;
const originKept = toAccept.originSystem;
const oldId = toAccept.id;
const pay = toAccept.payQuoted;
const credits0 = ctx.world.credits;
const rep0 = ctx.world.reputation.freehold ?? 0;
ctx.cargo.push({ commodity: toAccept.commodity, units: 4 });
pin('deliver.have4', holdUnits(ctx, toAccept.commodity) === 4);
comms.length = 0;
tick(40, station);

const after = miningBoard('freehold');
const live = after.filter((j) => j.state === 'offered' || j.state === 'accepted');
const replacement = live.find((j) => j.slot === slotKept);
pin('complete.credits', ctx.world.credits === credits0 + pay, `${credits0}->${ctx.world.credits} pay=${pay}`);
pin('complete.cargo', holdUnits(ctx, toAccept.commodity) === 0);
pin('complete.rep', (ctx.world.reputation.freehold ?? 0) === rep0 + 2, `rep=${ctx.world.reputation.freehold}`);
pin('complete.gone', !ctx.world.jobs.includes(toAccept));
pin('complete.notDone', toAccept.state !== 'done');
pin('complete.noDoneMining', after.every((j) => j.state !== 'done'));
pin('complete.noFailedOnBoard', after.every((j) => j.state !== 'failed'));
pin('complete.slotFilled', live.length === 2, `live=${live.length}`);
pin('complete.replacement.offered', replacement?.state === 'offered');
pin('complete.replacement.origin', replacement?.originSystem === originKept);
pin('complete.replacement.slot', replacement?.slot === slotKept);
pin('complete.replacement.newId', !!replacement && replacement.id !== oldId, `${oldId} -> ${replacement?.id}`);
pin('complete.replacement.newObject', !!replacement && replacement !== toAccept);
pin('complete.commLine', comms.some((t) => t.includes('delivered') && t.includes('UU posted')));
pin('complete.ui.showsOffer', overlayText().includes(replacement?.title ?? '\0'));

const credits1 = ctx.world.credits;
const cargo1 = ctx.cargo.map((c) => ({ ...c }));
tick(40, station);
pin('doubleTick.noPay', ctx.world.credits === credits1);
pin('doubleTick.noCargo', JSON.stringify(ctx.cargo) === JSON.stringify(cargo1));
pin('doubleTick.stillTwo', miningJobs('freehold', ['offered', 'accepted']).length === 2);

undock();
pin('expire.offered.undocked', ctx.flags.docked === false);
const offeredExp = miningJobs('freehold', ['offered'])[0];
const expSlot = offeredExp.slot;
const expId = offeredExp.id;
const expObj = offeredExp;
const creditsExp0 = ctx.world.credits;
const cargoExp0 = holdUnits(ctx, offeredExp.commodity);
const repExp0 = ctx.world.reputation.freehold ?? 0;
offeredExp.deadline = ctx.world.time - 1;
comms.length = 0;
tick(40, station);
const liveExp = miningJobs('freehold', ['offered', 'accepted']);
const replExp = liveExp.find((j) => j.slot === expSlot);
pin('expire.offered.gone', !ctx.world.jobs.includes(expObj));
pin('expire.offered.noPay', ctx.world.credits === creditsExp0);
pin('expire.offered.noRep', (ctx.world.reputation.freehold ?? 0) === repExp0);
pin('expire.offered.noCargo', holdUnits(ctx, offeredExp.commodity) === cargoExp0);
pin('expire.offered.replacement', replExp?.state === 'offered' && replExp.originSystem === 'freehold' && replExp.slot === expSlot);
pin('expire.offered.newObject', !!replExp && replExp !== expObj);
pin('expire.offered.newId', !!replExp && replExp.id !== expId);
pin('expire.offered.comm', comms.some((t) => t.includes('posting withdrawn')));
pin('expire.offered.noFailed', miningBoard('freehold').every((j) => j.state !== 'failed' && j.state !== 'done'));

parkAt('freehold');
dockHere('freehold-accepted-expire');
dispatchKey('Digit2');
tick(1, station);
const toAccExp = miningJobs('freehold', ['offered'])[0];
const accBtn2 = toAccExp ? findAcceptButton(toAccExp.title) : null;
accBtn2?.click();
tick(1, station);
pin('expire.accepted.took', toAccExp?.state === 'accepted');
ctx.cargo.push({ commodity: toAccExp.commodity, units: 4 });
const cargoAcc0 = holdUnits(ctx, toAccExp.commodity);
const creditsAcc0 = ctx.world.credits;
const repAcc0 = ctx.world.reputation.freehold ?? 0;
const accSlot = toAccExp.slot;
const accId = toAccExp.id;
undock();
toAccExp.deadline = ctx.world.time - 1;
comms.length = 0;
tick(40, station);
const liveAcc = miningJobs('freehold', ['offered', 'accepted']);
const replAcc = liveAcc.find((j) => j.slot === accSlot);
pin('expire.accepted.gone', !ctx.world.jobs.includes(toAccExp));
pin('expire.accepted.noPay', ctx.world.credits === creditsAcc0);
pin('expire.accepted.noRep', (ctx.world.reputation.freehold ?? 0) === repAcc0);
pin('expire.accepted.cargoKept', holdUnits(ctx, toAccExp.commodity) === cargoAcc0);
pin('expire.accepted.replacement', replAcc?.state === 'offered' && replAcc.slot === accSlot && replAcc.originSystem === 'freehold');
pin('expire.accepted.newObject', !!replAcc && replAcc !== toAccExp);
pin('expire.accepted.newId', !!replAcc && replAcc.id !== accId);
pin('expire.accepted.comm', comms.some((t) => t.includes('contract lapsed')));
pin('expire.accepted.noFailed', miningBoard('freehold').every((j) => j.state !== 'failed' && j.state !== 'done'));

parkAt('freehold');
dockHere('freehold-ferry');
const ferry = ctx.world.jobs.find((j) => j.id === 'ferry-consignment');
const haul = ctx.world.jobs.find((j) => j.id === 'haul-provisions');
const ace = ctx.world.jobs.find((j) => j.id === 'bounty-ace');
const patrol = ctx.world.jobs.find((j) => j.id === 'patrol-lane');
ferry.state = 'accepted';
ferry.destSystem = 'freehold';
ferry.originSystem = 'veridian';
ferry.payQuoted = 350;
ctx.cargo.push({ commodity: 'provisions', units: 4 });
const creditsFerry0 = ctx.world.credits;
tick(40, station);
pin('unique.ferry.done', ferry.state === 'done');
pin('unique.ferry.paid', ctx.world.credits === creditsFerry0 + 350);
pin('unique.haul.offered', haul.state === 'offered');
pin('unique.ace.offered', ace.state === 'offered');
pin('unique.patrol.offered', patrol.state === 'offered');
pin('unique.four.stillPresent', UNIQUE.every((id) => ctx.world.jobs.some((j) => j.id === id)));

const leftoverFailed = ctx.world.jobs.filter((j) => j.kind === 'mining' && (j.state === 'failed' || j.state === 'done'));
pin('board.noFailedMining', leftoverFailed.length === 0, leftoverFailed.map((j) => j.id).join(','));

dockHere('digit-identity');
dispatchKey('Digit2');
tick(1, station);
const digitJob = miningJobs('freehold', ['offered'])[0];
const digitBtn = digitJob ? findAcceptButton(digitJob.title) : null;
digitBtn?.click();
tick(1, station);
pin('digit.accept.identity', digitJob?.state === 'accepted' && ctx.world.jobs.includes(digitJob));

const failed = fails.length;
console.log(JSON.stringify(results, null, 2));
if (failed) {
  console.log(`FAIL ${failed} ${fails.join('; ')}`);
  process.exit(1);
}
console.log('OK');
