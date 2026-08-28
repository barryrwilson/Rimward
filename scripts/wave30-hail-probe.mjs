// RW-006 targeted WAVE30 demand/pay probe.
// Boots a headless graph, reproduces the soak-era shared fail pair, then
// runs the pinned demand+pay path 20 times. Does not change production RNG.
import * as THREE from 'three';
import { readFile } from 'node:fs/promises';
import { createCtx } from '../src/core/ctx.js';

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
      if (this.type === 'checkbox') {
        this.checked = !this.checked;
        for (const fn of this._listeners.change ?? []) fn({ type: 'change', target: this });
      }
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
const { initNpc, spawnLiveShip, removeLiveShip, expireSessionDeathCalm } = await import('../src/systems/npc.js');
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
const { dropDeferredHail } = await import('../src/systems/overlay-policy.js');
const { SYSTEMS, ECON, COMMODITIES, U, HIDDEN_MOUNTS, cargoValue } = await import('../src/game/state.js');

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

function isHostile(s) {
  return s.role === 'pirate' || s.role === 'ace'
    || s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
}
function hailBtn(frag) {
  for (const n of walkDom(document.body)) {
    if (n.tagName === 'BUTTON' && typeof n.textContent === 'string' && n.textContent.startsWith(frag)) return n;
  }
  return null;
}
function hailDisplay() {
  const btn = hailBtn('[1]');
  if (!btn) return 'none';
  let r = btn;
  while (r.parent && r.parent !== document.body) r = r.parent;
  return r.style?.display ?? null;
}
function spawnPirate(suffix, offset = [250, 0, 0]) {
  const p = ctx.ship.object.position;
  const rec = {
    id: `wave30-probe-${suffix}-${frame}`,
    name: `Wave30 probe ${suffix}`,
    classKey: 'cutter',
    faction: 'redledger',
    role: 'pirate',
    resolve: 50,
    personality: 95,
    alwaysHuntsPlayer: true,
  };
  const live = spawnLiveShip(ctx, rec, new THREE.Vector3(p.x + offset[0], p.y + offset[1], p.z + offset[2]));
  ctx.ships.push(live);
  return live;
}
function removeShip(live) {
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  removeLiveShip(ctx, live);
}
function demandEvs(live, maxFrames, label) {
  const evs = [];
  for (let i = 0; i < maxFrames; i++) {
    tick(1, label);
    evs.push(...ctx.lastEvents);
    if (evs.some((e) => e.type === 'hailOpened' && e.ship === live)) break;
  }
  return evs;
}
function undock() {
  dispatchKey('Escape');
  if (ctx.flags.docked) dispatchKey('Escape');
  tick(2, 'undock');
}
function expireGrace() {
  if (Number.isFinite(ctx.world.time) && ctx.world.time < 180) ctx.world.time = 180;
  expireSessionDeathCalm();
}
let demandExpected = 0;
function pinDemandScene(mounts) {
  if (ctx.flags.docked) undock();
  ctx.ship.object.position.set(0, 30000, 0);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.input.throttle = 0;
  ctx.input.fullStop = true;
  for (let i = 0; i < 240 && ctx.flags.combat; i++) tick(1, 'probe calm');
  ctx.world.jumpGraceUntil = 0;
  expireGrace();
  ctx.input.hailPressed = false;
  ctx.player.hullMax = 1e9; ctx.player.hull = 1e9;
  ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
  ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
  ctx.input.weaponGroup = 1;
  ctx.world.credits = 4000;
  ctx.world.fear = 0;
  ctx.world.concealedMounts = mounts === true;
  ctx.world.activeEvent = null;
  ctx.cargo.length = 0;
  ctx.cargo.push({ commodity: 'provisions', units: 10 });
  ctx.world.prices.provisions = COMMODITIES.provisions.base;
  ctx.flags.paused = false;
  ctx.flags.chartOpen = false;
  ctx.flags.berthOpen = false;
  ctx.flags.hailOpen = false;
  dropDeferredHail();
  ctx.emit('hailClosed', {});
  tick(2, 'probe hail close');
  dropDeferredHail();
  ctx.emit('hailClosed', {});
  tick(1, 'probe hail close settle');
  for (const s of ctx.ships) if (s?.object) s.object.position.set(9000, 9000, 9000);
  ctx.flags.hailOpen = false;
  ctx.world.prices.provisions = COMMODITIES.provisions.base;
  demandExpected = Math.max(
    HIDDEN_MOUNTS.demandMin,
    Math.round(ECON.tributeRate * cargoValue(ctx.cargo, ctx.world.prices) * 10),
  );
  const playerPos = ctx.ship.object.position;
  const nearbyHostile = ctx.ships.some((s) => s?.object && isHostile(s)
    && s.object.position.distanceTo(playerPos) < U.ENCOUNTER_BUBBLE);
  return {
    undocked: ctx.flags.docked !== true,
    hailOverlayClosed: hailDisplay() === 'none' && ctx.flags.hailOpen !== true,
    chartClosed: ctx.flags.chartOpen !== true,
    berthClosed: ctx.flags.berthOpen !== true,
    pausedOff: ctx.flags.paused !== true,
    graceExpired: ctx.world.time >= (ctx.world.jumpGraceUntil ?? 0),
    cargoPinned: ctx.cargo.length === 1 && ctx.cargo[0].commodity === 'provisions' && ctx.cargo[0].units === 10,
    pricesPinned: ctx.world.prices.provisions === COMMODITIES.provisions.base,
    creditsPinned: ctx.world.credits === 4000,
    mountsPinned: ctx.world.concealedMounts === (mounts === true),
    demandAboveFloor: demandExpected > HIDDEN_MOUNTS.demandMin,
    noNearbyHostiles: nearbyHostile === false,
  };
}

function failedKeys(checks) {
  return Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
}

// --- Reproduce leftover hail (old 10-frame wait, no overlay pin) ----------
const leftoverSetup = pinDemandScene(false);
const leftover = spawnPirate('leftover-card');
demandEvs(leftover, 60, 'probe leftover open');
const pDemand = spawnPirate('demand-behind-leftover');
const pDemandEvs = demandEvs(pDemand, 10, 'probe demand 10-frame');
const pDemandHail = pDemandEvs.find((e) => e.type === 'hailOpened' && e.ship === pDemand) ?? null;
const refuseBtn = hailBtn('[2] Refuse — and fight');
refuseBtn?.click();
tick(2, 'probe leftover refuse click');
const leftoverDemand = {
  leftoverCardOpen: hailDisplay() === 'block',
  hailOpenedEvent: !!pDemandHail,
  refusedOutcome: pDemand.ai.demandOutcome === 'refused' && pDemand.ai.demanding === false,
  cardClosedAfterRefuse: hailDisplay() === 'none',
};
pinDemandScene(true);
const leftoverPayCard = spawnPirate('leftover-pay-card');
demandEvs(leftoverPayCard, 60, 'probe leftover pay open');
const pPay = spawnPirate('pay-behind-leftover');
const pPayEvs = demandEvs(pPay, 10, 'probe pay 10-frame');
const pPayHail = pPayEvs.find((e) => e.type === 'hailOpened' && e.ship === pPay) ?? null;
const payBtn = hailBtn('[1] Pay tribute');
const payLabel = payBtn?.textContent ?? null;
payBtn?.click();
const leftoverPay = {
  leftoverCardOpen: hailDisplay() === 'block',
  hailOpenedEvent: !!pPayHail,
  payButtonLabeled: payLabel === `[1] Pay tribute — ${demandExpected} UU`,
  creditsPaidExact: ctx.world.credits === 4000 - demandExpected,
  pirateFleesPaid: pPay.ai.mode === 'flee' && pPay.ai.demandOutcome === 'paid',
};
const leftoverPairFails = leftoverDemand.refusedOutcome === false && leftoverPay.pirateFleesPaid === false;
console.log('wave30 probe leftover hail demand:', JSON.stringify(leftoverDemand));
console.log('wave30 probe leftover hail pay:', JSON.stringify(leftoverPay));
console.log('wave30 probe leftover shared pair:', leftoverPairFails);
removeShip(leftover); removeShip(pDemand); removeShip(leftoverPayCard); removeShip(pPay);

// --- Reproduce jump-grace acquire block (old 10-frame wait) ----------------
pinDemandScene(false);
ctx.world.jumpGraceUntil = ctx.world.time + 60;
const pGraceD = spawnPirate('grace-demand');
const graceDemandEvs = demandEvs(pGraceD, 10, 'probe grace demand');
const graceDemandOpened = graceDemandEvs.some((e) => e.type === 'hailOpened' && e.ship === pGraceD);
removeShip(pGraceD);
ctx.world.concealedMounts = true;
const pGraceP = spawnPirate('grace-pay');
const gracePayEvs = demandEvs(pGraceP, 10, 'probe grace pay');
const gracePayOpened = gracePayEvs.some((e) => e.type === 'hailOpened' && e.ship === pGraceP);
removeShip(pGraceP);
const gracePairFails = graceDemandOpened === false && gracePayOpened === false;
console.log('wave30 probe jump grace:', JSON.stringify({ graceDemandOpened, gracePayOpened, sharedPair: gracePairFails }));

// --- Reproduce cargo-floor drift ------------------------------------------
pinDemandScene(false);
ctx.cargo.length = 0;
const emptyExpected = Math.max(
  HIDDEN_MOUNTS.demandMin,
  Math.round(ECON.tributeRate * cargoValue(ctx.cargo, ctx.world.prices) * 10),
);
const pCargo = spawnPirate('empty-cargo');
const cargoEvs = demandEvs(pCargo, 60, 'probe empty cargo');
const cargoHail = cargoEvs.find((e) => e.type === 'hailOpened' && e.ship === pCargo) ?? null;
const cargoDemandRolled = cargoHail?.demand === emptyExpected && emptyExpected > HIDDEN_MOUNTS.demandMin;
removeShip(pCargo);
ctx.world.concealedMounts = true;
ctx.world.credits = 4000;
ctx.cargo.length = 0;
const pCargoPay = spawnPirate('empty-cargo-pay');
const cargoPayEvs = demandEvs(pCargoPay, 60, 'probe empty cargo pay');
const cargoPayHail = cargoPayEvs.find((e) => e.type === 'hailOpened' && e.ship === pCargoPay) ?? null;
const cargoPayBtn = hailBtn('[1] Pay tribute');
const cargoPayLabeled = cargoPayBtn?.textContent === `[1] Pay tribute — ${emptyExpected} UU`;
const cargoPairFails = cargoDemandRolled === false && (cargoPayLabeled === false || emptyExpected <= HIDDEN_MOUNTS.demandMin);
console.log('wave30 probe cargo floor:', JSON.stringify({
  emptyExpected, cargoDemandRolled, cargoPayLabeled, hailDemand: cargoHail?.demand ?? null, cargoPayHail: !!cargoPayHail, sharedPair: cargoPairFails,
}));
removeShip(pCargoPay);

if (!leftoverSetup.demandAboveFloor) {
  console.log('WAVE30 HAIL PROBE FAIL leftover setup');
  errors++;
}
if (!leftoverPairFails && !gracePairFails && !cargoPairFails) {
  console.log('WAVE30 HAIL PROBE FAIL no shared-pair reproduction');
  errors++;
} else {
  console.log('wave30 probe reproduced shared pair via', JSON.stringify({
    leftoverHail: leftoverPairFails, jumpGrace: gracePairFails, cargoFloor: cargoPairFails,
  }));
}

// --- Pinned demand+pay, 20 consecutive loops ------------------------------
let pinnedFail = 0;
for (let n = 1; n <= 20; n++) {
  const demandSetup = pinDemandScene(false);
  if (!Object.values(demandSetup).every(Boolean)) {
    pinnedFail++;
    console.log(`WAVE30 HAIL PROBE LOOP ${n} DEMAND SETUP FAIL`, JSON.stringify(demandSetup), failedKeys(demandSetup));
    continue;
  }
  const dShip = spawnPirate(`loop${n}-demand`);
  const dEvs = demandEvs(dShip, 60, `probe loop ${n} demand`);
  const dHail = dEvs.find((e) => e.type === 'hailOpened' && e.ship === dShip) ?? null;
  const dBtn = hailBtn('[2] Refuse — and fight');
  dBtn?.click();
  tick(2, `probe loop ${n} demand close`);
  const demandChecks = {
    hailOpened: !!dHail,
    demandLine: dHail?.line === 'Your cargo or your hull.',
    intentsWithoutMounts: JSON.stringify(dHail?.intents) === JSON.stringify(['payTribute', 'refuseFight']),
    demandRolledOnce: dHail?.demand === demandExpected && demandExpected > HIDDEN_MOUNTS.demandMin,
    refuseButtonFound: !!dBtn,
    refusedOutcome: dShip.ai.demandOutcome === 'refused' && dShip.ai.demanding === false,
  };
  if (!Object.values(demandChecks).every(Boolean)) {
    pinnedFail++;
    console.log(`WAVE30 HAIL PROBE LOOP ${n} DEMAND HAIL FAIL`, JSON.stringify(demandChecks), failedKeys(demandChecks));
  }
  removeShip(dShip);

  const paySetup = pinDemandScene(true);
  if (!Object.values(paySetup).every(Boolean)) {
    pinnedFail++;
    console.log(`WAVE30 HAIL PROBE LOOP ${n} PAY SETUP FAIL`, JSON.stringify(paySetup), failedKeys(paySetup));
    continue;
  }
  const pShip = spawnPirate(`loop${n}-pay`);
  const pEvs = demandEvs(pShip, 60, `probe loop ${n} pay`);
  const pHail = pEvs.find((e) => e.type === 'hailOpened' && e.ship === pShip) ?? null;
  const pBtn = hailBtn('[1] Pay tribute');
  const pLabel = pBtn?.textContent ?? null;
  pBtn?.click();
  const payChecks = {
    hailOpened: !!pHail,
    intentsWithMounts: JSON.stringify(pHail?.intents) === JSON.stringify(['payTribute', 'showTeeth', 'refuseFight']),
    payButtonLabeled: pLabel === `[1] Pay tribute — ${demandExpected} UU`,
    creditsPaidExact: ctx.world.credits === 4000 - demandExpected,
    pirateFleesPaid: pShip.ai.mode === 'flee' && pShip.ai.demandOutcome === 'paid',
  };
  if (!Object.values(payChecks).every(Boolean)) {
    pinnedFail++;
    console.log(`WAVE30 HAIL PROBE LOOP ${n} PAYTRIBUTE FAIL`, JSON.stringify(payChecks), failedKeys(payChecks));
  }
  removeShip(pShip);
  console.log(`wave30 probe loop ${n} ok demand=${demandExpected}`);
}

if (pinnedFail > 0) {
  console.log(`WAVE30 HAIL PROBE FAIL pinned loops failed=${pinnedFail}`);
  errors += pinnedFail;
} else {
  console.log('WAVE30 HAIL PROBE PINNED 20/20 PASS');
}

if (errors > 0) {
  console.log(`WAVE30 HAIL PROBE FAIL errors=${errors}`);
  process.exit(1);
}
console.log('WAVE30 HAIL PROBE PASS');
