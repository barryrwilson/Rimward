// Wave 71 PR4 — mining board remaining time + have/need copy.
// node --import ./scripts/with-css-stub.mjs out/w71/pr4/probe.mjs
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
    getAttribute(k) { return this._attrs[k] ?? null; },
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

function cardTexts() {
  const ov = stationOverlay();
  const cards = [];
  if (!ov) return cards;
  for (const n of walkDom(ov)) {
    if (n.className !== 'job-card') continue;
    const parts = [];
    for (const d of walkDom(n)) {
      if (typeof d.textContent === 'string' && d.textContent) parts.push(d.textContent);
    }
    cards.push(parts.join('\n'));
  }
  return cards;
}

function miningCardTexts() {
  return cardTexts().filter((t) => /Mine (Raw ore|Living rock|ore)/.test(t));
}

function uniqueCardTexts() {
  return cardTexts().filter((t) =>
    t.includes('Patrol the lane')
    || t.includes('Haul provisions')
    || t.includes('Ferry a consignment')
    || t.includes('Bounty:'));
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

function reopenJobs() {
  dispatchKey('Escape');
  dispatchKey('Digit2');
  tick(1, station);
}

const dt = 1 / 60;
function tick(n, stationApi) {
  for (let i = 0; i < n; i++) {
    ctx.elapsed += dt;
    ctx.world.time += dt;
    stationApi.update(dt);
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
ctx.player = createShipState('light', { name: 'Wave71Pr4' });
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

const UNIQUE = ['bounty-ace', 'patrol-lane', 'haul-provisions', 'ferry-consignment'];

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const stationSrc = readFileSync(join(root, 'src/systems/station.js'), 'utf8');

pin('src.no.innerHTML', !/innerHTML/.test(stationSrc));
pin('src.h.textContent', /node\.textContent = text/.test(stationSrc));
pin('src.timeLeft.helper', /function miningTimeLeftLabel\(ctx, job\)/.test(stationSrc));
pin('src.scheme.120s', /sec < 120/.test(stationSrc));
pin('src.no.anim.jobs', !/renderJobs[\s\S]{0,2500}requestAnimationFrame/.test(stationSrc));
pin('src.digit2.jobs', DOCK_KEY_SERVICES[1] === 'jobs');
pin('src.digit0.shipyard', DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1] === 'shipyard');
pin('src.two.levels', /level: 1, \/\/ 1 = services, 2 = service detail/.test(stationSrc));
pin('src.unique.makeJobs', UNIQUE.every((id) => stationSrc.includes(`id: '${id}'`)));
pin('src.unique.lines.intact',
  stationSrc.includes("title: 'Patrol the lane'")
  && stationSrc.includes("title: 'Haul provisions'")
  && stationSrc.includes("title: 'Ferry a consignment'")
  && stationSrc.includes('Haul ${HAUL_UNITS} Provisions to')
  && stationSrc.includes('Ferry ${FERRY_UNITS} fronted Provisions to')
  && stationSrc.includes('ACCEPTED — ${job.progress}/${job.need}')
  && stationSrc.includes('ACCEPTED — deliver to ${destName}')
  && stationSrc.includes('ACCEPTED — consignment to ${destName}'));
pin('src.no.SAFE_ID.full', !/SAFE_ID\.test\(\s*job\.id/.test(stationSrc) && !/SAFE_ID\.test\(id\)/.test(stationSrc));
pin('src.pay.untouched', /clampJobPay\(job\.payQuoted\)/.test(stationSrc) && /function replaceMiningJob/.test(stationSrc));
pin('src.expire.untouched', /Mining contract lapsed/.test(stationSrc) && /posting withdrawn/.test(stationSrc));

dockHere('freehold');
dispatchKey('Digit2');
tick(1, station);

const offered0 = miningJobs('freehold', ['offered']);
pin('fill.count2', offered0.length === 2, `n=${offered0.length}`);
pin('unique.four', UNIQUE.every((id) => ctx.world.jobs.some((j) => j.id === id)));

const offeredCards = miningCardTexts();
pin('offered.cards.2', offeredCards.length === 2, `n=${offeredCards.length}`);
pin('offered.time', offeredCards.every((t) => /\d+m left|\d+s left/.test(t)), offeredCards[0]?.slice(0, 200));
pin('offered.minutes.scheme', offeredCards.every((t) => t.includes('10m left')));
pin('offered.accept', offeredCards.every((t) => /Accept \(\d+\)/.test(t)));
pin('offered.title.allowlist', offered0.every((j) => {
  const name = COMMODITIES[j.commodity].name;
  return offeredCards.some((t) => t.includes(`Mine ${name}`));
}));
pin('offered.detail.station', offeredCards.every((t) => t.includes(SYSTEMS.freehold.station.name)));
pin('offered.reward', offeredCards.every((t) => /Deliver 4 .+ here — pays \d+ UU/.test(t)));

const uniqueCards = uniqueCardTexts();
pin('unique.cards.4', uniqueCards.length === 4, `n=${uniqueCards.length} text=${overlayText().slice(0, 120)}`);
pin('unique.patrol.line', uniqueCards.some((t) => t.includes('Patrol the lane') && t.includes('Reward:') && t.includes('Accept (')));
pin('unique.haul.line', uniqueCards.some((t) => t.includes('Haul provisions') && t.includes('Haul 5 Provisions to')));
pin('unique.ferry.line', uniqueCards.some((t) => t.includes('Ferry a consignment') && t.includes('Ferry 4 fronted Provisions to')));
pin('unique.ace.line', uniqueCards.some((t) => t.includes('Bounty:') && t.includes('Reward:')));
pin('unique.no.mining.clock', uniqueCards.every((t) => !/\d+m left|\d+s left/.test(t)));

const toAccept = miningJobs('freehold', ['offered'])[0];
const acceptBtn = toAccept ? findAcceptButton(toAccept.title) : null;
acceptBtn?.click();
tick(1, station);
pin('accept.clicked', !!acceptBtn);
pin('accept.state', toAccept?.state === 'accepted');

ctx.cargo.push({ commodity: toAccept.commodity, units: 2 });
reopenJobs();
const accCards = cardTexts().filter((t) => t.includes('ACCEPTED — deliver'));
const accLine = accCards.find((t) => t.includes(COMMODITIES[toAccept.commodity].name)) ?? '';
pin('accepted.haveNeed', /ACCEPTED — deliver 4 .+ here \(have 2\)/.test(accLine), accLine.slice(0, 240));
pin('accepted.time', /ACCEPTED — deliver 4 .+ here \(have 2\) · \d+m left/.test(accLine)
  || /ACCEPTED — deliver 4 .+ here \(have 2\) · \d+s left/.test(accLine), accLine.slice(0, 240));
pin('accepted.minutes.scheme', / · \d+m left/.test(accLine) && !/ · \d+s left/.test(accLine), accLine.slice(0, 240));

toAccept.deadline = ctx.world.time + 90;
reopenJobs();
const acc90 = cardTexts().find((t) => t.includes('ACCEPTED — deliver') && t.includes(COMMODITIES[toAccept.commodity].name)) ?? '';
pin('accepted.seconds.scheme', / · \d+s left/.test(acc90) && !/ · \d+m left/.test(acc90), acc90.slice(0, 240));

const prevDeadline = toAccept.deadline;
toAccept.deadline = Number.NaN;
reopenJobs();
const accNaN = cardTexts().find((t) => t.includes('ACCEPTED — deliver') && t.includes(COMMODITIES[toAccept.commodity].name)) ?? '';
pin('accepted.failClosed.nan', accNaN.includes('ACCEPTED — deliver') && accNaN.includes('(have 2)')
  && !accNaN.includes('NaN') && !accNaN.includes('undefined') && !/ · .+ left/.test(accNaN), accNaN.slice(0, 240));
toAccept.deadline = Infinity;
reopenJobs();
const accInf = cardTexts().find((t) => t.includes('ACCEPTED — deliver') && t.includes(COMMODITIES[toAccept.commodity].name)) ?? '';
pin('accepted.failClosed.inf', !accInf.includes('Infinity') && !/ · .+ left/.test(accInf), accInf.slice(0, 240));
delete toAccept.deadline;
reopenJobs();
const accMissing = cardTexts().find((t) => t.includes('ACCEPTED — deliver') && t.includes(COMMODITIES[toAccept.commodity].name)) ?? '';
pin('accepted.failClosed.missing', accMissing.includes('(have 2)') && !/ · .+ left/.test(accMissing), accMissing.slice(0, 240));
toAccept.deadline = prevDeadline;

const slotKept = toAccept.slot;
const originKept = toAccept.originSystem;
const oldId = toAccept.id;
const pay = toAccept.payQuoted;
const credits0 = ctx.world.credits;
ctx.cargo.length = 0;
ctx.cargo.push({ commodity: toAccept.commodity, units: 4 });
toAccept.deadline = ctx.world.time + 600;
comms.length = 0;
tick(40, station);
const live = miningJobs('freehold', ['offered', 'accepted']);
const replacement = live.find((j) => j.slot === slotKept);
pin('complete.credits', ctx.world.credits === credits0 + pay, `${credits0}->${ctx.world.credits} pay=${pay}`);
pin('complete.gone', !ctx.world.jobs.includes(toAccept));
pin('complete.replacement.offered', replacement?.state === 'offered');
const postCompleteCards = miningCardTexts();
const replTitle = replacement ? `Mine ${COMMODITIES[replacement.commodity].name}` : '\0';
const replCard = postCompleteCards.find((t) => t.includes(replTitle) && t.includes('Accept (')) ?? '';
pin('complete.replacement.deadlineLine', /\d+m left|\d+s left/.test(replCard), replCard.slice(0, 240));
pin('unique.four.afterComplete', UNIQUE.every((id) => ctx.world.jobs.some((j) => j.id === id)));

undock();
const offeredExp = miningJobs('freehold', ['offered'])[0];
const expSlot = offeredExp.slot;
const expObj = offeredExp;
offeredExp.deadline = ctx.world.time - 1;
comms.length = 0;
tick(40, station);
const replExp = miningJobs('freehold', ['offered', 'accepted']).find((j) => j.slot === expSlot);
pin('expire.offered.gone', !ctx.world.jobs.includes(expObj));
pin('expire.offered.replacement', replExp?.state === 'offered' && replExp.originSystem === 'freehold');

parkAt('freehold');
dockHere('freehold-after-expire');
dispatchKey('Digit2');
tick(1, station);
const afterExpireCards = miningCardTexts();
pin('expire.replacement.deadlineLine', afterExpireCards.every((t) => /\d+m left|\d+s left/.test(t))
  && afterExpireCards.length >= 2, afterExpireCards.map((t) => t.split('\n')[0]).join(' | '));
pin('unique.four.afterExpire', uniqueCardTexts().length === 4);

pin('src.no.innerHTML.final', !/innerHTML/.test(stationSrc));

const failed = fails.length;
console.log(JSON.stringify(results, null, 2));
if (failed) {
  console.log(`FAIL ${failed} ${fails.join('; ')}`);
  process.exit(1);
}
console.log('OK');
