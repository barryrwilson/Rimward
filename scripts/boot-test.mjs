// Headless full-boot harness for RIMWARD web (throwaway diagnostic).
// Replicates main.js wiring with a stub renderer + stub DOM, then ticks the
// whole system graph with scripted inputs. Catches integration errors that
// per-worker harnesses can't see.
// Wave 6: origin pick at fresh boot, onboarding hints, faction epics +
// Standing service, mystery convergence, Named-Gun ace arc, headless audio
// cues, settings/a11y panel, and the extended save WORLD_FIELDS roundtrip.
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';

// ---- Minimal DOM stubs (enough for hud/station/hail/controls/song) ----
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
        // any other property: no-op method if called, benign value otherwise
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
    style: { setProperty(k, v) { this[k] = v; } },
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); },
      toggle(c, f) { (f ?? !this._s.has(c)) ? this._s.add(c) : this._s.delete(c); },
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
    setAttribute() {},
    getAttribute() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 }; },
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
    focus() {},
    // Fire registered click listeners (station.js buttons route game actions here).
    click() {
      for (const fn of this._listeners.click ?? []) fn({ type: 'click', target: this });
      // Real checkboxes toggle + fire 'change' on click (settings.js panel).
      if (this.type === 'checkbox') {
        this.checked = !this.checked;
        for (const fn of this._listeners.change ?? []) fn({ type: 'change', target: this });
      }
    },
  };
  // textContent mirrors real DOM: assigning '' clears children (render() relies on it).
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
  addEventListener(type, fn) { (winListeners[type] ??= []).push(fn); },
  removeEventListener(type, fn) { const a = winListeners[type]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
  dispatchEvent() {},
};
// Harness-only: fire a synthetic keydown+keyup at every registered window
// listener (station menu chrome, controls.js edges) exactly like real input.
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

// ---- Boot the full system graph ----
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
const {
  initContacts, contactsForSystem, bumpTrust, addFavor, spendFavor, rumorFor, recognitionLine,
} = await import('../src/game/contacts.js');
const { initMystery } = await import('../src/game/mystery.js');
const { initEpics, epicEffects } = await import('../src/game/epics.js');
const { initGate } = await import('../src/systems/gate.js');
const { initJump } = await import('../src/game/jump.js');
const { initTraffic } = await import('../src/game/traffic.js');
const { initNpc } = await import('../src/systems/npc.js');
const { initCombat } = await import('../src/systems/combat.js');
const { initPods } = await import('../src/game/pods.js');
const { initHail } = await import('../src/systems/hail.js');
const { initSong } = await import('../src/systems/song.js');
const { initSave } = await import('../src/game/save.js');
const { initOrigins } = await import('../src/game/origins.js');
const { initOnboarding } = await import('../src/systems/onboarding.js');
const { initHud } = await import('../src/systems/hud.js');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
const ctx = createCtx({ scene, camera, renderer });
const { SYSTEMS, RANK_LADDER, rankFor, ECON, BANDS, CONVERGENCE } = await import('../src/game/state.js');
ctx.systems = SYSTEMS; // mirrors main.js boot line

const inits = [
  ['starfield', initStarfield], ['solarsystem', initSolarSystem], ['asteroids', initAsteroids],
  ['station', initStation], ['landmarks', initLandmarks], ['gate', initGate], ['controls', initControls], ['settings', initSettings], ['bio', initBio],
  ['ship', initShip], ['world', initWorld], ['contacts', initContacts], ['mystery', initMystery], ['epics', initEpics], ['jump', initJump], ['traffic', initTraffic],
  ['npc', initNpc], ['combat', initCombat], ['pods', initPods], ['hail', initHail],
  ['song', initSong], ['save', initSave], ['origins', initOrigins], ['onboarding', initOnboarding], ['hud', initHud],
];
const systems = [];
for (const [name, init] of inits) {
  try {
    systems.push([name, init(ctx)]);
    console.log(`INIT OK   ${name}`);
  } catch (e) {
    console.log(`INIT FAIL ${name}: ${e.message}`);
    process.exit(1);
  }
}

// ---- Tick with scripted behavior ----
const dt = 1 / 60;
let frame = 0;
let errors = 0;
function tick(n, label) {
  for (let i = 0; i < n; i++) {
    frame++;
    ctx.elapsed += dt;
    ctx.world.time += dt;
    try {
      for (const [name, s] of systems) s?.update?.(dt, ctx);
    } catch (e) {
      errors++;
      if (errors <= 5) console.log(`UPDATE ERR frame ${frame} (${label}): ${e.message}\n${e.stack?.split('\n')[1]?.trim() ?? ''}`);
    }
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

// ---- Wave 6: origin pick at fresh boot (must precede every other section) --
// A fresh boot (no save restored) opens the origin overlay and pauses; its
// keydown listener consumes Digit1-5 until a choice is made, so the pick has
// to happen before ANY section that dispatches digits (wave-4 station
// services use the same codes). Greenhand ([1]) has empty effects — the run
// below starts from the same baseline as before origins existed.
const originOverlayShown = [...walkDom(document.body)]
  .some((n) => typeof n.textContent === 'string' && n.textContent.toLowerCase().includes('who are you'));
const pausedAtOrigin = ctx.flags.paused === true;
dispatchKey('Digit1'); // [1] Freehold Greenhand
const originChosenEv = ctx.events.find((e) => e.type === 'originChosen') ?? null; // emit is synchronous
const originOverlayGone = ![...walkDom(document.body)]
  .some((n) => typeof n.textContent === 'string' && n.textContent.toLowerCase().includes('who are you'));
const originChecks = {
  overlayShown: originOverlayShown,
  pausedWhileOpen: pausedAtOrigin,
  originRecorded: ctx.world.origin === 'greenhand',
  unpausedAfterPick: ctx.flags.paused === false,
  originChosenEmitted: originChosenEv?.id === 'greenhand',
  overlayRemoved: originOverlayGone,
};
console.log('wave6 origin pick:', JSON.stringify(originChecks));
if (!Object.values(originChecks).every(Boolean)) { console.log('WAVE6 ORIGIN PICK FAIL'); errors++; }

tick(120, 'boot idle');
console.log(`after boot: ships=${ctx.ships.length} records=${ctx.world.records.length} prices=${Object.keys(ctx.world.prices).length} pods=${ctx.pods?.length ?? 0}`);

// ---- Wave 3: gate network data sanity (every system def) ----
const gateDataOk = Object.values(SYSTEMS).every((def) =>
  Array.isArray(def.gates) && def.gates.length > 0 && def.gates.every((g) =>
    Array.isArray(g.position) && g.position.length === 3 && !!SYSTEMS[g.to]));
console.log(`gate network: systems=${Object.keys(SYSTEMS).length} allDefsValid=${gateDataOk}`);
if (!gateDataOk) {
  console.log('GATE NETWORK DATA FAIL');
  errors++;
}

// throttle up and fly
ctx.input.throttle = 1;
tick(600, 'cruise 10s');
console.log(`after cruise: speed=${ctx.ship.speed.toFixed(1)} pos=${ctx.ship.object.position.toArray().map((v) => v.toFixed(0))}`);

// afterburner
ctx.input.afterburnerPressed = true;
tick(1, 'burner edge');
ctx.input.afterburnerPressed = false;
tick(360, 'burning');
console.log(`burner: active=${ctx.ship.burnerActive} speed=${ctx.ship.speed.toFixed(1)}`);

// fire cannon at whatever is targeted
ctx.input.targetPressed = true;
tick(1, 'target');
console.log(`target: ${ctx.targets.current?.record?.name ?? ctx.targets.current?.id ?? 'none'}`);
ctx.input.fireHeld = true;
tick(300, 'firing 5s');
ctx.input.fireHeld = false;
console.log(`after firing: heat=${ctx.player.heat.toFixed(1)} playerHull=${ctx.player.hull} ships=${ctx.ships.length}`);

// drift
ctx.input.driftHeld = true;
tick(240, 'drift');
ctx.input.driftHeld = false;
console.log(`drift: active=${ctx.ship.driftActive}`);

// full stop (double-tap F semantics: hold station at 0, creep overridden)
ctx.input.throttle = 0;
ctx.input.fullStop = true;
tick(300, 'full stop 5s');
const stoppedOk = ctx.ship.speed < 2;
console.log(`full stop: speed=${ctx.ship.speed.toFixed(1)} (expect <2)`);
if (!stoppedOk) errors++;
ctx.input.fullStop = false;
tick(120, 'creep resume');
console.log(`creep resumes: speed=${ctx.ship.speed.toFixed(1)} (expect ~30)`);

// Test SETUP: everything from here on exercises world/jump/station/save
// paths, not player lethality (the intentional deaths below are event-driven
// via 'playerDestroyed'). Random soak combat can otherwise destroy the player
// mid-run; the death overlay then eats a later Digit1 and its restore swaps
// the contacts roster, flaking the wave-4 favor checks. Pin the hull huge so
// random combat can't kill; the repair section restores class maxes first.
ctx.player.hullMax = 1e9;
ctx.player.hull = 1e9;

// long soak: world events, traffic churn
tick(60 * 60 * 3, 'soak 3min');
console.log(`after soak: time=${ctx.world.time.toFixed(0)}s ships=${ctx.ships.length} incidents=${ctx.world.incidents.length} aftermath=${ctx.world.aftermath.length} event=${ctx.world.activeEvent?.kind ?? 'none'} milestones=${ctx.world.milestones.length}`);
console.log(`bio: mood=${ctx.bio.mood} hunger=${ctx.bio.hunger.toFixed(2)} wounds=${ctx.bio.wounds.toFixed(2)}`);
console.log(`save present: ${store.has('rimward-save-v1')}`);

// ---- Wave 2: gate jump round trip ----
// Park at the freehold gate: zone check should flip.
ctx.ship.object.position.set(...SYSTEMS.freehold.gates[0].position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at gate');
console.log(`gate inZone (expect true): ${ctx.gate.inZone}`);
// Fire the jump directly (input edges are controls.js territory; the browser
// verifier covers the D-key path — here we test the swap machinery).
const astBefore = ctx.asteroids.list;
const provBefore = ctx.world.prices.provisions;
ctx.emit('jumpRequested', { to: 'veridian' });
tick(60 * 4, 'jump to veridian');
const jumpChecks = {
  currentSystem: ctx.world.currentSystem === 'veridian',
  jumpingDone: !ctx.gate.jumping,
  shipsCleared: ctx.ships.length === 0 || ctx.ships.every((s) => ctx.world.records.some((r) => r.name === s.record?.name)),
  asteroidsSwapped: ctx.asteroids.list !== astBefore,
  priceRebound: ctx.world.prices.provisions !== provBefore,
  veridianSpread: ctx.world.prices.provisions > provBefore * 1.1, // 135 vs 100 baseline
  nearDestGate: (() => {
    const g = SYSTEMS.veridian.gates.find((gt) => gt.to === 'freehold').position;
    const p = ctx.ship.object.position;
    return Math.hypot(p.x - g[0], p.y - g[1], p.z - g[2]) < 400;
  })(),
};
console.log('jump checks:', JSON.stringify(jumpChecks));
const jumpOk = Object.values(jumpChecks).every(Boolean);
tick(60 * 30, 'veridian soak 30s');
console.log(`veridian: ships=${ctx.ships.length} station=${ctx.station ? 'present' : 'missing'} prices.provisions=${ctx.world.prices.provisions.toFixed(0)}`);

// ---- Wave 3: second hop veridian → redmarch ----
// Park at the veridian → redmarch gate (850,45,100) and jump.
const redGate = SYSTEMS.veridian.gates.find((g) => g.to === 'redmarch');
ctx.ship.object.position.set(...redGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at redmarch gate');
console.log(`gate inZone (expect true): ${ctx.gate.inZone} nearTo (expect redmarch): ${ctx.gate.nearTo}`);
ctx.emit('jumpRequested', { to: 'redmarch' });
tick(60 * 4, 'jump to redmarch');
tick(60 * 30, 'redmarch soak 30s'); // let traffic respawn from the new cast
let redPlanets = 0;
ctx.scene.traverse((o) => {
  // Planets: standard-material spheres (sun/eyes are basic, hull is physical,
  // wave-5 landmark/clue POIs carry userData.poiType and are excluded).
  if (o.isMesh && o.geometry?.type === 'SphereGeometry' && o.material?.isMeshStandardMaterial && !o.material?.isMeshPhysicalMaterial && !o.userData?.poiType) redPlanets++;
});
const roleCount = (role) => ctx.world.records.filter((r) => r.role === role).length;
const redChecks = {
  currentSystem: ctx.world.currentSystem === 'redmarch',
  jumpingDone: !ctx.gate.jumping,
  shipsRespawned: ctx.ships.length > 0 && ctx.ships.every((s) => ctx.world.records.some((r) => r.name === s.record?.name)),
  castMatches: ctx.world.records.length === 13 && roleCount('trader') === 5 && roleCount('pirate') === 7 && roleCount('patrol') === 1 && roleCount('ace') === 0,
  stationPresent: ctx.station?.name === 'Ledger Anchorage',
  pricesTable: !!ctx.world.markets?.redmarch && ctx.world.prices === ctx.world.markets.redmarch,
  provisionsSpread: ctx.world.prices.provisions > 100, // priceBase 1.3 × 100 baseline
  tradesRestricted: SYSTEMS.redmarch.tradesRestricted === true,
  planetsGenerated: redPlanets === 4,
};
console.log('redmarch checks:', JSON.stringify(redChecks));
const redOk = Object.values(redChecks).every(Boolean);
console.log(`redmarch: ships=${ctx.ships.length} records=${ctx.world.records.length} prices.provisions=${ctx.world.prices.provisions.toFixed(0)} planets=${redPlanets}`);
// Jump back to veridian: arrival must be the return-pointing gate (850,45,100).
ctx.emit('jumpRequested', { to: 'veridian' });
tick(60 * 4, 'jump back to veridian');
const p2 = ctx.ship.object.position;
const nearReturnGate = Math.hypot(p2.x - 850, p2.y - 45, p2.z - 100) < 120;
console.log(`back to veridian: currentSystem=${ctx.world.currentSystem} (expect veridian) nearReturnGate (expect true): ${nearReturnGate} pos=${p2.toArray().map((v) => v.toFixed(0))}`);
if (!redOk || ctx.world.currentSystem !== 'veridian' || !nearReturnGate) {
  console.log('REDMARCH TEST FAIL');
  errors++;
}

// Park at the veridian → freehold gate for the round trip home.
ctx.ship.object.position.set(...SYSTEMS.veridian.gates.find((g) => g.to === 'freehold').position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at freehold gate');
ctx.emit('jumpRequested', { to: 'freehold' });
tick(60 * 4, 'jump back');
console.log(`round trip: currentSystem=${ctx.world.currentSystem} (expect freehold), prices.provisions=${ctx.world.prices.provisions.toFixed(0)}`);
if (!jumpOk || ctx.world.currentSystem !== 'freehold') {
  console.log('JUMP TEST FAIL');
  errors++;
}
// ---- Wave 4: contacts / ranks / ferry / recovery / fence favor ----
// The station UI is driven through the REAL input paths: dock zone + the
// dockPressed edge for docking, window keydown for service selection, and
// stub-DOM button clicks for job accepts and the fence favor (station.js
// routes hotkeys and clicks through the same handlers).
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
// The accept button living on the same job card as the given title fragment.
function findAcceptButton(titleFrag) {
  const ov = stationOverlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (typeof n.textContent !== 'string' || !n.textContent.includes(titleFrag)) continue;
    for (let card = n.parent; card && card !== ov; card = card.parent) {
      for (const d of walkDom(card)) {
        if (d.tagName === 'BUTTON' && d.textContent.startsWith('Accept')) return d;
      }
    }
  }
  return null;
}
function dockAtCurrentStation(label) {
  ctx.ship.object.position.set(...SYSTEMS[ctx.world.currentSystem].station.position);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.input.dockPressed = true; // station.update reads the edge before controls clears it
  tick(1, label);
  ctx.input.dockPressed = false;
  tick(2, `${label} settle`);
}
function undockStation() {
  dispatchKey('Escape'); // level 2 backs out to services; level 1 launches
  if (ctx.flags.docked) dispatchKey('Escape');
  tick(2, 'undock');
}
// Bounded wait for a jump to finish (charge time varies) — never trust a
// fixed tick count for arrival; fail loudly at the jump instead of docking
// at the wrong station downstream.
function tickUntilJumpDone(to, label) {
  for (let i = 0; i < 60 * 10; i++) {
    tick(1, label);
    if (ctx.world.currentSystem === to && !ctx.gate.jumping) return true;
  }
  return false;
}
const holdCount = (commodity) => ctx.cargo.reduce((n, c) => n + (c.commodity === commodity ? c.units : 0), 0);

// -- 1. contacts data: roster shape + JSON-plain persistence ---------------
const w4contacts = ctx.world.contacts ?? [];
const contactRoleCt = (role) => w4contacts.filter((c) => c.role === role).length;
const contactDataChecks = {
  // Wave 5 added the Hollow Reach dockmaster: 7 entries, 4 dockmasters.
  sixEntries: w4contacts.length === 7,
  dockmasterX3: contactRoleCt('dockmaster') === 4,
  fenceX1: contactRoleCt('fence') === 1,
  fixerX2: contactRoleCt('fixer') === 2,
  jsonRoundTrip: w4contacts.every((c) => {
    const rt = JSON.parse(JSON.stringify(c));
    const keysSame = JSON.stringify(Object.keys(c).sort()) === JSON.stringify(Object.keys(rt).sort());
    return keysSame && JSON.stringify(c) === JSON.stringify(rt);
  }),
};
console.log('wave4 contacts data:', JSON.stringify(contactDataChecks));
if (!Object.values(contactDataChecks).every(Boolean)) { console.log('WAVE4 CONTACTS DATA FAIL'); errors++; }

// -- 2. rank ladder boundaries (including tier signs) ----------------------
const rankChecks = {
  ladderDescending: RANK_LADDER.every((r, i) => i === 0 || RANK_LADDER[i - 1].min > r.min),
  swornAt60: rankFor(60).name === 'Sworn' && rankFor(60).tier === 3,
  knownAt10: rankFor(10).name === 'Known' && rankFor(10).tier === 1,
  strangerAt0: rankFor(0).name === 'Stranger' && rankFor(0).tier === 0,
  suspectAtMinus20: rankFor(-20).name === 'Suspect' && rankFor(-20).tier === -1,
  markedAtMinus30: rankFor(-30).name === 'Marked' && rankFor(-30).tier === -2,
};
console.log('wave4 rank ladder:', JSON.stringify(rankChecks));
if (!Object.values(rankChecks).every(Boolean)) { console.log('WAVE4 RANK LADDER FAIL'); errors++; }

// -- 3. contacts API (real calls, unit-style) ------------------------------
const freeholdDM = contactsForSystem(ctx, 'freehold').find((c) => c.role === 'dockmaster') ?? null;
const redmarchDM = contactsForSystem(ctx, 'redmarch').find((c) => c.role === 'dockmaster') ?? null;
if (freeholdDM) bumpTrust(ctx, freeholdDM, 65);
const recogHigh = freeholdDM ? recognitionLine(ctx, freeholdDM) : null;
if (redmarchDM) bumpTrust(ctx, redmarchDM, 10); // fresh contact, other system
const recogLow = redmarchDM ? recognitionLine(ctx, redmarchDM) : 'no-contact';
const incidentsHeld = ctx.world.incidents; // save/restore: rumor keys off incidents alone
ctx.world.incidents = [];
const rumorWhenQuiet = freeholdDM ? rumorFor(ctx, freeholdDM) : 'no-contact';
ctx.world.incidents = incidentsHeld;
const contactApiChecks = {
  dockmastersFound: !!freeholdDM && !!redmarchDM,
  trustClampedAt65: freeholdDM?.trust === 65,
  recognitionAt65: typeof recogHigh === 'string' && recogHigh.length > 0,
  recognitionNullAt10: recogLow === null,
  rumorNullWithoutIncidents: rumorWhenQuiet === null,
};
console.log('wave4 contacts api:', JSON.stringify(contactApiChecks));
if (!Object.values(contactApiChecks).every(Boolean)) { console.log('WAVE4 CONTACTS API FAIL'); errors++; }

// -- 4. ferry cycle: Freehold Landing → Veridian Spire via the real dock path
dockAtCurrentStation('dock freehold (ferry)');
dispatchKey('Digit2'); // jobs board (DOCK_KEY_SERVICES[1])
const ferryJob = ctx.world.jobs.find((j) => j.kind === 'ferry' && j.state === 'offered') ?? null;
const creditsAtFerryAccept = ctx.world.credits;
const freeCapAtFerryAccept = ctx.cargoCapacity - ctx.cargo.reduce((n, c) => n + c.units, 0);
const provAtFerryAccept = holdCount('provisions');
const ferryBtn = ferryJob ? findAcceptButton('Ferry a consignment') : null;
ferryBtn?.click(); // real accept path: DOM button → acceptJob(job)
const ferryAcceptChecks = {
  dockedAtFreehold: ctx.flags.docked === true && ctx.world.currentSystem === 'freehold',
  ferryOffered: !!ferryJob,
  acceptButtonFound: !!ferryBtn,
  holdHadRoomFor4: freeCapAtFerryAccept >= 4,
  provisionsGranted4: holdCount('provisions') - provAtFerryAccept === 4,
  jobAccepted: ferryJob?.state === 'accepted',
  destStampedVeridian: ferryJob?.destSystem === 'veridian',
};
console.log('wave4 ferry accept:', JSON.stringify(ferryAcceptChecks));
if (!Object.values(ferryAcceptChecks).every(Boolean)) { console.log('WAVE4 FERRY ACCEPT FAIL'); errors++; }

undockStation();
ctx.ship.object.position.set(...SYSTEMS.freehold.gates[0].position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at veridian gate (ferry)');
ctx.emit('jumpRequested', { to: 'veridian' });
if (!tickUntilJumpDone('veridian', 'jump to veridian (ferry)')) {
  console.log('WAVE4 FERRY JUMP FAIL — never arrived at veridian');
  errors++;
}
dockAtCurrentStation('dock veridian (ferry)');
tick(90, 'ferry delivery tick'); // delivery check is throttled at 0.5s
const ferryDoneChecks = {
  dockedAtVeridian: ctx.flags.docked === true && ctx.world.currentSystem === 'veridian',
  jobDone: ferryJob?.state === 'done',
  paidExactly350: ctx.world.credits - creditsAtFerryAccept === 350,
  provisionsConsumed: holdCount('provisions') === provAtFerryAccept,
};
console.log('wave4 ferry delivery:', JSON.stringify(ferryDoneChecks));
if (!Object.values(ferryDoneChecks).every(Boolean)) { console.log('WAVE4 FERRY DELIVERY FAIL'); errors++; }

// -- 5. recovery: seed a veridian wreck (test SETUP data), scoop, redock ----
ctx.world.aftermath.push({
  id: 'aft-test', incidentId: 'inc-test', kind: 'wreck',
  position: { x: 30, y: 0, z: -60 }, system: 'veridian',
  createdAt: ctx.world.time, expiresAt: ctx.world.time + 9999,
});
// Still docked at veridian on the services level: open the jobs board so
// renderJobs → syncRecoveryJob posts the card.
dispatchKey('Digit2');
const recoveryJob = ctx.world.jobs.find((j) => j.kind === 'recovery' && j.wreckId === 'aft-test') ?? null;
const recoveryWasOffered = recoveryJob?.state === 'offered';
const podsAtRecoveryAccept = ctx.pods.length;
const recoveryBtn = recoveryWasOffered ? findAcceptButton('Recovery: wreck salvage') : null;
recoveryBtn?.click(); // real accept path: spawns the salvage pod at the wreck
const recoveryAcceptChecks = {
  recoveryOffered: recoveryWasOffered,
  acceptButtonFound: !!recoveryBtn,
  podSpawnedAtWreck: ctx.pods.length === podsAtRecoveryAccept + 1,
  jobAccepted: recoveryJob?.state === 'accepted',
};
console.log('wave4 recovery accept:', JSON.stringify(recoveryAcceptChecks));
if (!Object.values(recoveryAcceptChecks).every(Boolean)) { console.log('WAVE4 RECOVERY ACCEPT FAIL'); errors++; }

undockStation();
const salvagePod = ctx.pods[ctx.pods.length - 1] ?? null;
let podScooped = false;
if (salvagePod) {
  ctx.ship.velocity.set(0, 0, 0);
  for (let i = 0; i < 600 && !podScooped; i++) {
    ctx.ship.object.position.copy(salvagePod.mesh.position); // pod drifts; stay on it
    tick(1, 'scoop salvage pod');
    podScooped = !ctx.pods.includes(salvagePod);
  }
}
tick(30, 'post-scoop settle'); // let the job's event scan see podCollected
const creditsAtRecoveryRedock = ctx.world.credits;
dockAtCurrentStation('redock veridian (recovery)');
tick(90, 'recovery payout tick');
const recoveryDoneChecks = {
  podScooped,
  jobCollected: recoveryJob?.collected === true,
  redockedAtVeridian: ctx.flags.docked === true && ctx.world.currentSystem === 'veridian',
  jobDone: recoveryJob?.state === 'done',
  paidExactly300: ctx.world.credits - creditsAtRecoveryRedock === 300,
};
console.log('wave4 recovery delivery:', JSON.stringify(recoveryDoneChecks));
if (!Object.values(recoveryDoneChecks).every(Boolean)) { console.log('WAVE4 RECOVERY DELIVERY FAIL'); errors++; }

// -- 6. fence favor: opens the restricted locker for this dock session -----
const fence = contactsForSystem(ctx, 'freehold').find((c) => c.role === 'fence') ?? null;
if (fence) addFavor(ctx, fence, 1); // real API: bank a marker with Quiet Hollis
// spendFavor unit semantics on a contact the flow doesn't otherwise touch.
const redmarchFixer = contactsForSystem(ctx, 'redmarch').find((c) => c.role === 'fixer') ?? null;
let spendFavorUnitOk = false;
if (redmarchFixer) {
  const f0 = redmarchFixer.favors;
  const emptySpendRefused = spendFavor(ctx, redmarchFixer) === false && redmarchFixer.favors === f0;
  addFavor(ctx, redmarchFixer, 1);
  const bankedSpendWorks = spendFavor(ctx, redmarchFixer) === true && redmarchFixer.favors === f0;
  spendFavorUnitOk = emptySpendRefused && bankedSpendWorks;
}
undockStation(); // leave Veridian Spire, jump home
const homeGate = SYSTEMS.veridian.gates.find((g) => g.to === 'freehold');
ctx.ship.object.position.set(...homeGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at freehold gate (fence)');
ctx.emit('jumpRequested', { to: 'freehold' });
if (!tickUntilJumpDone('freehold', 'jump home (fence)')) {
  console.log('WAVE4 FENCE JUMP FAIL — never arrived at freehold');
  errors++;
}
dockAtCurrentStation('dock freehold (fence)');
// Test SETUP: this section tests the favor path, not the fear economy — pin
// the gates shut so random combat fear from the soak phases (witnessed NPC
// capitulations, +2 fear each) can't pre-open the locker before the favor.
ctx.world.fear = 0;
ctx.world.reputation.freehold = 0;

// Precondition: fear/rep gates unmet — the locker stays shut without the fence.
dispatchKey('Digit1'); // market
const lockerRefusalBefore = [...walkDom(stationOverlay() ?? { children: [] })]
  .some((n) => n.textContent === 'trade refused');
dispatchKey('Escape'); // back to services
dispatchKey('Digit7'); // people (DOCK_KEY_SERVICES[6])
const favorsBeforeCall = fence?.favors ?? 0;
let favorBtn = null;
for (const n of walkDom(stationOverlay() ?? { children: [] })) {
  if (n.tagName === 'BUTTON' && /call in a favor/i.test(n.textContent ?? '')) { favorBtn = n; break; }
}
favorBtn?.click(); // real path: spendFavor → session flag (only wired path for people)
const fenceFlagSet = ctx.station.fenceUnlocked === true;
dispatchKey('Escape'); // back to services
dispatchKey('Digit1'); // market again — locker should read open now
const marketAfter = [...walkDom(stationOverlay() ?? { children: [] })];
const lockerRefusalAfter = marketAfter.some((n) => n.textContent === 'trade refused');
const restrictedListed = marketAfter.some((n) => typeof n.textContent === 'string' && n.textContent.includes('Restricted components'));
const fenceChecks = {
  fenceFound: !!fence,
  spendFavorUnit: spendFavorUnitOk,
  gatesUnmet: ctx.world.fear < ECON.fear.tributeOpensAt && ctx.world.reputation.freehold >= -25,
  lockerShutBefore: lockerRefusalBefore,
  favorButtonFound: !!favorBtn,
  favorSpent: fence?.favors === favorsBeforeCall - 1,
  sessionFlagSet: fenceFlagSet,
  restrictedListed,
  lockerOpenAfter: !lockerRefusalAfter && restrictedListed,
};
console.log('wave4 fence favor:', JSON.stringify(fenceChecks), `fear=${ctx.world.fear} rep.freehold=${ctx.world.reputation.freehold}`);
if (!Object.values(fenceChecks).every(Boolean)) { console.log('WAVE4 FENCE FAVOR FAIL'); errors++; }

// ---- Wave 5: hollowreach / band pacing / mystery / death tenderness / bio visuals ----
// -- 1. fourth-system jump: freehold → veridian → redmarch → hollowreach ----
// Same scripted jump pattern as wave 3 (park on the gate, emit the request,
// bounded-wait for arrival). The final leg captures 'systemLoaded' and the
// band-aware arrival commLine frame-by-frame — both fire at the jump
// midpoint, before ctx.gate.jumping clears.
undockStation(); // leave Freehold Landing (wave-4 fence dock)
ctx.ship.object.position.set(...SYSTEMS.freehold.gates[0].position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at veridian gate (wave5 chain)');
ctx.emit('jumpRequested', { to: 'veridian' });
if (!tickUntilJumpDone('veridian', 'wave5 hop to veridian')) {
  console.log('WAVE5 CHAIN FAIL — never arrived at veridian');
  errors++;
}
ctx.ship.object.position.set(...SYSTEMS.veridian.gates.find((g) => g.to === 'redmarch').position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at redmarch gate (wave5 chain)');
ctx.emit('jumpRequested', { to: 'redmarch' });
if (!tickUntilJumpDone('redmarch', 'wave5 hop to redmarch')) {
  console.log('WAVE5 CHAIN FAIL — never arrived at redmarch');
  errors++;
}
const hrGate = SYSTEMS.redmarch.gates.find((g) => g.to === 'hollowreach'); // [-800,50,-200]
const hrReturnGate = SYSTEMS.hollowreach.gates[0]; // [0,70,1100] → redmarch
ctx.ship.object.position.set(...hrGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at hollowreach gate');
const hrGateInZone = ctx.gate.inZone === true && ctx.gate.nearTo === 'hollowreach';
ctx.emit('jumpRequested', { to: 'hollowreach' });
let hrLoadedFired = false;
let hrArrivalLine = null;
let hrArrived = false;
for (let i = 0; i < 60 * 10 && !hrArrived; i++) {
  tick(1, 'jump to hollowreach');
  for (const ev of ctx.lastEvents) {
    if (ev.type === 'systemLoaded' && ev.to === 'hollowreach') hrLoadedFired = true;
    if (ev.type === 'commLine' && ev.from === 'gate') hrArrivalLine = ev.text;
  }
  if (ctx.world.currentSystem === 'hollowreach' && !ctx.gate.jumping) hrArrived = true;
}
const hrp = ctx.ship.object.position;
const w5jumpChecks = {
  gateDefRoundTrip: hrGate.position.join(',') === '-800,50,-200' && hrReturnGate.to === 'redmarch',
  inZoneAtGate: hrGateInZone,
  arrived: hrArrived && ctx.world.currentSystem === 'hollowreach',
  jumpingDone: !ctx.gate.jumping,
  systemLoadedFired: hrLoadedFired,
  band2SilentLine: hrArrivalLine === 'Hollow Reach. …no traffic on scope.',
  nearReturnGate: Math.hypot(hrp.x - 0, hrp.y - 70, hrp.z - 1100) < 120,
};
console.log('wave5 hollowreach jump:', JSON.stringify(w5jumpChecks), `line=${JSON.stringify(hrArrivalLine)}`);
if (!Object.values(w5jumpChecks).every(Boolean)) { console.log('WAVE5 HOLLOWREACH JUMP FAIL'); errors++; }

// -- 2. band pacing data (§15): rim edge runs quieter ------------------------
const w5bandChecks = {
  freeholdBand0: SYSTEMS.freehold.band === 0,
  veridianBand0: SYSTEMS.veridian.band === 0,
  redmarchBand1: SYSTEMS.redmarch.band === 1,
  hollowreachBand2: SYSTEMS.hollowreach.band === 2 && ctx.systems.hollowreach.band === 2,
  eventGapStretches: BANDS[2].eventGapMult > BANDS[0].eventGapMult,
  songGapStretches: BANDS[2].songGapMult > BANDS[0].songGapMult,
};
console.log('wave5 band pacing:', JSON.stringify(w5bandChecks));
if (!Object.values(w5bandChecks).every(Boolean)) { console.log('WAVE5 BAND PACING FAIL'); errors++; }

// -- 3. clue discovery: 35u proximity, permanent per id -----------------------
const hrClue = SYSTEMS.hollowreach.clues[0];
let clueFoundEv = null;
ctx.ship.object.position.set(...hrClue.position);
ctx.ship.velocity.set(0, 0, 0);
for (let i = 0; i < 30 && !clueFoundEv; i++) {
  tick(1, 'clue approach');
  for (const ev of ctx.lastEvents) {
    if (ev.type === 'clueFound' && ev.id === hrClue.id) clueFoundEv = ev;
  }
}
const foundAfterClue = ctx.world.mystery?.found?.length ?? -1;
// Revisit: leave past the radius, come back onto the clue — a permanent
// discovery must not re-fire or grow the list.
ctx.ship.object.position.set(2000, 2000, 2000);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'leave clue');
ctx.ship.object.position.set(...hrClue.position);
ctx.ship.velocity.set(0, 0, 0);
let clueRefired = false;
for (let i = 0; i < 10; i++) {
  tick(1, 'clue revisit');
  for (const ev of ctx.lastEvents) if (ev.type === 'clueFound') clueRefired = true;
}
const w5clueChecks = {
  clueFound: ctx.world.mystery?.found?.includes(hrClue.id) === true,
  eventFired: !!clueFoundEv,
  eventCarriesLine: clueFoundEv?.line === hrClue.line,
  permanentNoRefire: ctx.world.mystery?.found?.length === foundAfterClue && !clueRefired,
};
console.log('wave5 clue discovery:', JSON.stringify(w5clueChecks), `found=${JSON.stringify(ctx.world.mystery?.found)}`);
if (!Object.values(w5clueChecks).every(Boolean)) { console.log('WAVE5 CLUE DISCOVERY FAIL'); errors++; }

// -- 4. landmark discovery: 100u proximity -------------------------------------
const hrLandmark = SYSTEMS.hollowreach.landmarks[0];
let landmarkFoundEv = null;
ctx.ship.object.position.set(...hrLandmark.position);
ctx.ship.velocity.set(0, 0, 0);
for (let i = 0; i < 30 && !landmarkFoundEv; i++) {
  tick(1, 'landmark approach');
  for (const ev of ctx.lastEvents) {
    if (ev.type === 'landmarkFound' && ev.id === hrLandmark.id) landmarkFoundEv = ev;
  }
}
const w5landmarkChecks = {
  landmarkVisited: ctx.world.mystery?.visited?.includes(hrLandmark.id) === true,
  eventFired: !!landmarkFoundEv,
  eventCarriesNameAndLine: landmarkFoundEv?.name === hrLandmark.name && landmarkFoundEv?.line === hrLandmark.line,
};
console.log('wave5 landmark discovery:', JSON.stringify(w5landmarkChecks), `visited=${JSON.stringify(ctx.world.mystery?.visited)}`);
if (!Object.values(w5landmarkChecks).every(Boolean)) { console.log('WAVE5 LANDMARK DISCOVERY FAIL'); errors++; }

// -- 5. mystery persistence: dock-save banks found/visited, death restores them
// Test SETUP: the docked/undocked autosaves must not be combat-blocked —
// saveBlockReason refuses while a hostile live ship sits inside the encounter
// bubble with the combat flag set, and the soak phases left live pirates
// trailing the player. Park every live hostile far beyond de-instantiate
// range (mirrors the wave-4 fear/rep pinning: this section tests the
// save/death path, not the block gate).
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked');
// Save with the discoveries banked: the real dock path fires 'docked' →
// trySave, the same autosave wave 4 relies on.
dockAtCurrentStation('dock hollowreach (mystery save)');
tick(3, 'docked save settle');
undockStation();
tick(3, 'undocked save settle');
const w5snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const bondSaved = w5snap?.bio?.bond;
const hungerSaved = w5snap?.bio?.hunger;
const w5saveChecks = {
  saveWritten: !!w5snap?.world,
  mysteryInSave: w5snap?.world?.mystery?.found?.includes(hrClue.id) === true &&
    w5snap?.world?.mystery?.visited?.includes(hrLandmark.id) === true,
  bioInSave: typeof bondSaved === 'number' && typeof hungerSaved === 'number',
};
console.log('wave5 mystery save:', JSON.stringify(w5saveChecks));
if (!Object.values(w5saveChecks).every(Boolean)) { console.log('WAVE5 MYSTERY SAVE FAIL'); errors++; }

// -- 6. bio death tenderness: corrupt mystery in memory, die, reload -----------
// save.js consumes 'playerDestroyed' → 'Ship lost.' overlay → reload the last
// save. The Enter dispatch skips the 2.5s hold synchronously, so the asserts
// below read post-restore state before any bio.update can re-derive mood.
ctx.ship.object.position.set(0, 0, 0); // far from every hollowreach POI — no re-discovery
ctx.ship.velocity.set(0, 0, 0);
ctx.world.mystery = { found: [], visited: [] };
tick(2, 'mystery corrupted');
const corruptedCleared = ctx.world.mystery.found.length === 0 && ctx.world.mystery.visited.length === 0;
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed'); // save.js sees it via lastEvents, overlay opens
dispatchKey('Enter'); // recover(): restore(last save) + mood forced 'anxious'
const w5deathChecks = {
  corruptedFirst: corruptedCleared,
  mysteryRestored: ctx.world.mystery?.found?.includes(hrClue.id) === true &&
    ctx.world.mystery?.visited?.includes(hrLandmark.id) === true,
  moodAnxious: ctx.bio.mood === 'anxious', // reload-from-save path (never the boot load)
  bondPreserved: typeof bondSaved === 'number' && ctx.bio.bond === bondSaved,
  hungerPreserved: typeof hungerSaved === 'number' && ctx.bio.hunger === hungerSaved,
  bioNotDefaults: !(ctx.bio.bond === 0.1 && ctx.bio.hunger === 0.15 && ctx.bio.wounds === 0),
};
console.log('wave5 death tenderness:', JSON.stringify(w5deathChecks), `mood=${ctx.bio.mood} bond=${ctx.bio.bond} saved=${bondSaved} mystery=${JSON.stringify(ctx.world.mystery)}`);
if (!Object.values(w5deathChecks).every(Boolean)) { console.log('WAVE5 DEATH TENDERNESS FAIL'); errors++; }
tick(5, 'post-death settle');

// -- 7. bio visuals on the ship mesh (headless observables) --------------------
// bio.js owns mood/wounds/growth and re-derives them every frame, so a direct
// ctx.bio.mood set would not survive a tick. The feral mood is driven through
// its real input path — an 'npcDestroyed' atrocity on a surrendered ship sets
// feralUntil (~60s of rage, priority over the wounds→pained band) — while
// wounds and fedCount are the direct sim inputs for scar reveal and growth
// (growth = bond*0.7 + fedCount*0.05, read by ship.js as hull scale).
let hullMesh = null;
const scarMeshes = [];
ctx.ship.object.traverse((o) => {
  if (o.isMesh && o.material?.isMeshPhysicalMaterial) hullMesh = o; // living hull (vein emissive)
  if (o.isMesh && o.geometry?.type === 'PlaneGeometry' && o.material?.color?.getHex?.() === 0x070410) scarMeshes.push(o); // wound scar patches
});
const flesh = hullMesh?.parent ?? null; // breath/growth scale lives on this child of ctx.ship.object
const sereneR = ((0x4fe0c8 >> 16) & 0xff) / 255;
const emissiveRBefore = hullMesh?.material?.emissive?.r ?? 0;
ctx.emit('npcDestroyed', { ship: { state: { surrendered: true } } }); // atrocity → feralUntil
tick(2, 'atrocity onset');
ctx.bio.wounds = 1; // all five scar thresholds (0.18 step) crossed
ctx.bio.fedCount = 10; // growth resolves to >= 0.5 on the next bio.update
tick(60, 'bio visuals settle');
const emissiveR = hullMesh?.material?.emissive?.r ?? 0;
const w5bioVisualChecks = {
  moodIsFeral: ctx.bio.mood === 'feral',
  growthResolved: ctx.bio.growth >= 0.5,
  hullMeshFound: !!hullMesh && !!flesh,
  fleshScaledUp: (flesh?.scale?.x ?? 0) > 1.03, // (1 + growth*0.15) * (1 ± breathDepth), lerped ~1s
  scarsPresent: scarMeshes.length > 0,
  scarVisible: scarMeshes.some((m) => m.visible),
  redExceedsSerene: emissiveR > sereneR, // feral 0xff2a66 vs serene 0x4fe0c8
  redMovedFeral: emissiveR > emissiveRBefore && emissiveR > 0.9,
};
console.log('wave5 bio visuals:', JSON.stringify(w5bioVisualChecks), `fleshScale=${flesh?.scale?.x?.toFixed(3)} scars=${scarMeshes.filter((m) => m.visible).length}/${scarMeshes.length} emissiveR=${emissiveR.toFixed(3)} (serene ${sereneR.toFixed(3)}, before ${emissiveRBefore.toFixed(3)})`);
if (!Object.values(w5bioVisualChecks).every(Boolean)) { console.log('WAVE5 BIO VISUALS FAIL'); errors++; }

// ---- Hotfix: itemized repair pricing + save boundary heal ----
// 1. Priced repair via the real dock → service-key → button path. Damage is
//    set explicitly so the itemized total is deterministic:
//    hull 60×0.9=54, screen 30×0.3=9, shell 60×0.5=30, engine 50×0.6=30 ⇒ 123.
dockAtCurrentStation('dock (repair pricing)');
const rp = ctx.player;
rp.hullMax = 100; rp.screenMax = 40; rp.shellMax = 60; rp.engineMax = 100; // class maxes (hull was pinned huge above)
rp.hull = 40; rp.screen = 10; rp.shell = 0; rp.engine = 50;
const creditsBeforeRepair = ctx.world.credits;
dispatchKey('Digit5'); // repair service (DOCK_KEY_SERVICES[4])
tick(2, 'repair screen');
let repairBtn = null;
{
  const ov = stationOverlay();
  if (ov) for (const n of walkDom(ov)) {
    if (n.tagName === 'BUTTON' && typeof n.textContent === 'string' && n.textContent.startsWith('1 — Repair all')) { repairBtn = n; break; }
  }
}
const expectedRepairCost = Math.ceil(60 * 0.9) + Math.ceil(30 * 0.3) + Math.ceil(60 * 0.5) + Math.ceil(50 * 0.6);
const labelCost = repairBtn ? Number((repairBtn.textContent.match(/\((\d+) UU\)/) ?? [])[1]) : NaN;
repairBtn?.click();
const repairChecks = {
  buttonFound: !!repairBtn,
  itemizedCost: labelCost === expectedRepairCost,
  chargedExactly: creditsBeforeRepair - ctx.world.credits === expectedRepairCost,
  madeWhole: rp.hull === rp.hullMax && rp.screen === rp.screenMax && rp.shell === rp.shellMax && rp.engine === rp.engineMax,
};
console.log('repair pricing:', JSON.stringify(repairChecks), `cost=${labelCost} expect=${expectedRepairCost}`);
if (!Object.values(repairChecks).every(Boolean)) { console.log('REPAIR PRICING FAIL'); errors++; }

// 2. Corrupt record: NaN channels are re-trued against the class baseline by
//    the refit, not billed and not copied back into the record.
rp.screenMax = NaN; rp.shell = NaN;
const creditsBeforeRefit = ctx.world.credits;
dispatchKey('Digit1'); // repair all, still on the repair service
tick(2, 'corrupt refit');
const refitChecks = {
  screenRetrued: rp.screenMax === 40 && rp.screen === 40,
  shellRetrued: rp.shellMax === 60 && rp.shell === 60,
  noCharge: ctx.world.credits === creditsBeforeRefit,
  creditsFinite: Number.isFinite(ctx.world.credits),
};
console.log('repair refit:', JSON.stringify(refitChecks));
if (!Object.values(refitChecks).every(Boolean)) { console.log('REPAIR REFIT FAIL'); errors++; }
undockStation();

// 3. Boundary heal: a snapshot carrying nulls (JSON's tombstones for NaN) is
//    sanitized on restore, so a corrupted live save self-heals on next load.
const healSnap = JSON.parse(localStorage.getItem('rimward-save-v1'));
healSnap.world.credits = null;
healSnap.player.hull = null;
healSnap.player.engineMax = null;
healSnap.bio.bond = null;
localStorage.setItem('rimward-save-v1', JSON.stringify(healSnap));
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (save heal)');
dispatchKey('Enter'); // recover() → restore(corrupted snap) → sanitizeRestored
const healChecks = {
  creditsRestored: ctx.world.credits === 350, // fresh-start purse fallback
  hullFinite: Number.isFinite(ctx.player.hull) && ctx.player.hull <= ctx.player.hullMax,
  engineMaxRetrued: ctx.player.engineMax === 100 && ctx.player.engine <= 100,
  bondFinite: Number.isFinite(ctx.bio.bond),
};
console.log('save boundary heal:', JSON.stringify(healChecks));
if (!Object.values(healChecks).every(Boolean)) { console.log('SAVE HEAL FAIL'); errors++; }
tick(5, 'post-heal settle');

// ---- Wave 6: onboarding / epics / ace arc / convergence / audio / settings / save fields ----
// Section order keeps travel minimal: (a)+(b) at freehold, (c) works
// anywhere, (d) hollowreach, (e)-(g) from hollowreach. Epic effects change
// freehold repair/job pricing, so reputation is only raised AFTER every
// pre-existing section has run.
// Test SETUP: re-pin the hull huge (the hotfix repair section restored class
// maxes) so random wave-6 combat can't kill the player mid-section — the
// death overlay would eat later digit dispatches.
ctx.player.hullMax = 1e9;
ctx.player.hull = 1e9;

// Travel: post-hotfix we are in hollowreach — chain back to freehold.
ctx.ship.object.position.set(...SYSTEMS.hollowreach.gates[0].position); // → redmarch
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at redmarch gate (wave6 return)');
ctx.emit('jumpRequested', { to: 'redmarch' });
if (!tickUntilJumpDone('redmarch', 'wave6 hop to redmarch')) {
  console.log('WAVE6 TRAVEL FAIL — never arrived at redmarch');
  errors++;
}
ctx.ship.object.position.set(...SYSTEMS.redmarch.gates.find((g) => g.to === 'veridian').position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at veridian gate (wave6 return)');
ctx.emit('jumpRequested', { to: 'veridian' });
if (!tickUntilJumpDone('veridian', 'wave6 hop to veridian')) {
  console.log('WAVE6 TRAVEL FAIL — never arrived at veridian');
  errors++;
}
ctx.ship.object.position.set(...SYSTEMS.veridian.gates.find((g) => g.to === 'freehold').position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at freehold gate (wave6 return)');
ctx.emit('jumpRequested', { to: 'freehold' });
if (!tickUntilJumpDone('freehold', 'wave6 hop to freehold')) {
  console.log('WAVE6 TRAVEL FAIL — never arrived at freehold');
  errors++;
}

// -- a. onboarding: one-time hint shows, key-dismisses, honors the setting ---
// Test SETUP: replay the teaching pass from scratch — earlier waves already
// showed (and banked) most hints. world.time is long past the 20s gate. The
// module re-resolves ctx.world.onboarding every frame (save restores swap the
// field wholesale), so resetting the current record's seen is enough.
ctx.world.onboarding ??= { seen: [] };
ctx.world.onboarding.seen.length = 0;
tick(2, 'onboarding move hint');
const hintCardVisible = (frag) => [...walkDom(document.body)]
  .some((n) => typeof n.textContent === 'string' && n.textContent.includes(frag) && n.style?.display === 'block');
const moveHintShown = hintCardVisible('throttle');
const moveSeen = ctx.world.onboarding.seen.includes('move');
dispatchKey('KeyZ'); // any key dismisses the visible hint; KeyZ is unbound
tick(1, 'hint dismiss');
const moveHintHidden = !hintCardVisible('throttle');
// Suppression: hints off, fresh 'dock' condition (parked by the station) —
// no card, no seen entry.
ctx.settings.hints = false;
ctx.ship.object.position.set(...SYSTEMS.freehold.station.position);
ctx.ship.velocity.set(0, 0, 0);
tick(3, 'hints suppressed');
const dockHintSuppressed = !ctx.world.onboarding.seen.includes('dock') && !hintCardVisible('D — dock');
ctx.settings.hints = true; // restore — later sections read settings live
const w6onboardingChecks = {
  moveHintShown,
  moveSeenOnce: moveSeen && ctx.world.onboarding.seen.filter((id) => id === 'move').length === 1,
  dismissedOnKey: moveHintHidden,
  suppressionRespected: dockHintSuppressed,
  hintsRestored: ctx.settings.hints === true,
};
console.log('wave6 onboarding:', JSON.stringify(w6onboardingChecks), `seen=${JSON.stringify(ctx.world.onboarding.seen)}`);
if (!Object.values(w6onboardingChecks).every(Boolean)) { console.log('WAVE6 ONBOARDING FAIL'); errors++; }

// -- b. faction epics: freehold stages, merged effects, Standing service -----
// epics.js re-resolves ctx.world.epics every frame (save-restore safe), so the
// stage advances, epicEffects, and the Standing render all read one object.
ctx.world.epics ??= {};
ctx.world.reputation.freehold = 60; // Sworn (tier 3) — all three stage reqs hold
const epicStageEvs = [];
for (let i = 0; i < 5; i++) { // one stage per faction per frame
  tick(1, 'epic stage advance');
  for (const ev of ctx.lastEvents) if (ev.type === 'epicStage') epicStageEvs.push(ev);
}
const freeholdStageEvs = epicStageEvs.filter((e) => e.faction === 'freehold');
const freeholdFx = epicEffects(ctx, 'freehold');
dockAtCurrentStation('dock freehold (standing)');
dispatchKey('Digit9'); // Standing service (DOCK_KEY_SERVICES[8])
tick(2, 'standing screen');
const standingLines = [...walkDom(stationOverlay() ?? { children: [] })]
  .map((n) => n.textContent).filter((t) => typeof t === 'string');
const w6epicChecks = {
  stagesRecorded: ctx.world.epics.freehold === 3,
  stageEventsSeen: freeholdStageEvs.length >= 1,
  stageLinesVoiced: freeholdStageEvs.every((e) => typeof e.line === 'string' && e.line.length > 0),
  mergedEffects: JSON.stringify(freeholdFx) === JSON.stringify({ repairMult: 0.9, jobPayMult: 1.15, sellMult: 1.1 }),
  standingShowsEpicName: standingLines.some((t) => t.includes("The Shepherd's Lane")),
  standingShowsAchieved: standingLines.some((t) => t.startsWith('✓')),
};
console.log('wave6 epics:', JSON.stringify(w6epicChecks), `stages=${freeholdStageEvs.map((e) => e.stage)} fx=${JSON.stringify(freeholdFx)}`);
if (!Object.values(w6epicChecks).every(Boolean)) { console.log('WAVE6 EPICS FAIL'); errors++; }
undockStation();

// -- c. ace arc: fear 25 buys the Named Gun ----------------------------------
// Test SETUP: if an earlier soak already tripped the threshold, reset the
// injection so the spawn path is exercised deterministically (remove any
// existing Sister Vane record first — hunterSpawned is the only dup guard).
{
  const bank = ctx.world.recordBanks?.redmarch ?? [];
  for (let i = bank.length - 1; i >= 0; i--) if (bank[i].name === 'Sister Vane') bank.splice(i, 1);
  if (ctx.world.aceRivalry) ctx.world.aceRivalry.hunterSpawned = false;
}
ctx.world.fear = 25;
let whisperLine = null;
for (let i = 0; i < 3 && !whisperLine; i++) {
  tick(1, 'named gun spawn');
  for (const ev of ctx.lastEvents) {
    if (ev.type === 'commLine' && /Named Gun/.test(ev.text ?? '')) whisperLine = ev.text;
  }
}
const vaneRec = (ctx.world.recordBanks?.redmarch ?? []).find((r) => r.name === 'Sister Vane') ?? null;
const w6aceChecks = {
  hunterSpawned: ctx.world.aceRivalry?.hunterSpawned === true,
  vaneInRedmarchBank: !!vaneRec,
  roleAce: vaneRec?.role === 'ace',
  bounty4000: vaneRec?.bounty === 4000,
  whisperVoiced: !!whisperLine,
};
console.log('wave6 ace arc:', JSON.stringify(w6aceChecks), `line=${JSON.stringify(whisperLine)}`);
if (!Object.values(w6aceChecks).every(Boolean)) { console.log('WAVE6 ACE ARC FAIL'); errors++; }

// -- d. mystery convergence: 3 clues hint, the site converges ----------------
// found already holds hr_c_answer (wave 5, restored through both deaths) —
// push two more authored ids to reach CONVERGENCE.cluesNeeded.
const mystery6 = ctx.world.mystery;
for (const id of ['rm_c_tally', 'vd_c_shanty']) {
  if (!mystery6.found.includes(id)) mystery6.found.push(id);
}
let convergeHintLine = null;
for (let i = 0; i < 3 && !convergeHintLine; i++) {
  tick(1, 'converge hint');
  for (const ev of ctx.lastEvents) {
    if (ev.type === 'commLine' && ev.text === CONVERGENCE.hintLine) convergeHintLine = ev.text;
  }
}
const convergeHinted = mystery6.convergeHinted === true;
// Travel: freehold → veridian → redmarch → hollowreach, then the site.
ctx.ship.object.position.set(...SYSTEMS.freehold.gates[0].position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at veridian gate (wave6 convergence)');
ctx.emit('jumpRequested', { to: 'veridian' });
if (!tickUntilJumpDone('veridian', 'wave6 hop to veridian (convergence)')) {
  console.log('WAVE6 TRAVEL FAIL — never arrived at veridian (convergence)');
  errors++;
}
ctx.ship.object.position.set(...SYSTEMS.veridian.gates.find((g) => g.to === 'redmarch').position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at redmarch gate (wave6 convergence)');
ctx.emit('jumpRequested', { to: 'redmarch' });
if (!tickUntilJumpDone('redmarch', 'wave6 hop to redmarch (convergence)')) {
  console.log('WAVE6 TRAVEL FAIL — never arrived at redmarch (convergence)');
  errors++;
}
ctx.ship.object.position.set(...SYSTEMS.redmarch.gates.find((g) => g.to === 'hollowreach').position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at hollowreach gate (wave6 convergence)');
ctx.emit('jumpRequested', { to: 'hollowreach' });
if (!tickUntilJumpDone('hollowreach', 'wave6 hop to hollowreach (convergence)')) {
  console.log('WAVE6 TRAVEL FAIL — never arrived at hollowreach (convergence)');
  errors++;
}
ctx.ship.object.position.set(...CONVERGENCE.site.position);
ctx.ship.velocity.set(0, 0, 0);
const convEvs = [];
for (let i = 0; i < 5; i++) {
  tick(1, 'convergence site');
  convEvs.push(...ctx.lastEvents);
}
// landmarks.js builds the anomaly POI post-hint: a scene descendant at the
// site position (group-local position; the site group is a scene root child).
const sp6 = CONVERGENCE.site.position;
let siteRendered = false;
ctx.scene.traverse((o) => {
  if (siteRendered) return;
  if (Math.hypot(o.position.x - sp6[0], o.position.y - sp6[1], o.position.z - sp6[2]) < 5) siteRendered = true;
});
const w6convergenceChecks = {
  hintFlagSet: convergeHinted,
  hintLineVoiced: convergeHintLine === CONVERGENCE.hintLine,
  converged: mystery6.converged === true,
  milestoneEvent: convEvs.some((e) => e.type === 'milestone' && e.id === 'convergence'),
  convergenceEvent: convEvs.some((e) => e.type === 'convergence' && e.id === CONVERGENCE.site.id),
  songShiftEvent: convEvs.some((e) => e.type === 'songShift' && e.reason === 'convergence'),
  siteRendered,
};
console.log('wave6 convergence:', JSON.stringify(w6convergenceChecks), `found=${JSON.stringify(mystery6.found)}`);
if (!Object.values(w6convergenceChecks).every(Boolean)) { console.log('WAVE6 CONVERGENCE FAIL'); errors++; }

// -- e. audio: every new cue type with no AudioContext — update must not throw
// No AudioContext in this stub: song.js stays silent (unlock fails safe) and
// every cue path must no-op. Payloads are minimal ({}): consumers are
// null-safe, and jump.js ignores a jumpRequested with an unknown `to`.
const errorsBeforeAudio = errors;
const cueTypes = ['jumpRequested', 'undocked', 'hailClosed', 'npcSurrendered', 'worldEvent', 'marketShift',
  'saveBlocked', 'clueFound', 'landmarkFound', 'epicStage', 'convergence', 'originChosen', 'fearChanged', 'engineOut'];
for (const type of cueTypes) ctx.emit(type, {});
ctx.flags.combat = true;
ctx.flags.docked = true;
ctx.settings.muted = true;
tick(2, 'audio cues (flags on)');
ctx.flags.combat = false;
ctx.flags.docked = false;
ctx.settings.muted = false;
tick(2, 'audio cues (flags off)');
for (const type of cueTypes) ctx.emit(type, {});
tick(2, 'audio cues (second pass)');
const w6audioChecks = {
  noUpdateErrors: errors === errorsBeforeAudio,
  bogusJumpIgnored: !ctx.gate.jumping && ctx.world.currentSystem === 'hollowreach',
};
console.log('wave6 audio:', JSON.stringify(w6audioChecks));
if (!Object.values(w6audioChecks).every(Boolean)) { console.log('WAVE6 AUDIO FAIL'); errors++; }

// -- f. settings panel: KeyO toggle, colorblind applies + persists, reset ----
dispatchKey('KeyO');
const settingsPanelRoot = (() => {
  for (const n of walkDom(document.body)) {
    if (n.textContent === 'SETTINGS') return n.parent?.parent ?? null; // title → panel → root
  }
  return null;
})();
const colorblindInput = (() => {
  for (const n of walkDom(document.body)) {
    if (n.tagName === 'INPUT' && n.type === 'checkbox' &&
      (n.parent?.children ?? []).some((c) => typeof c.textContent === 'string' && c.textContent.includes('Colorblind'))) return n;
  }
  return null;
})();
colorblindInput?.click(); // stub checkbox click: toggles + fires 'change'
const colorblindPersisted = (() => {
  try { return JSON.parse(store.get('rimward-settings-v1') ?? 'null')?.colorblind === true; } catch { return false; }
})();
const w6settingsChecks = {
  panelOpened: settingsPanelRoot?.style?.display === 'flex',
  checkboxFound: !!colorblindInput,
  bodyClassApplied: document.body.classList.contains('rw-colorblind'),
  persisted: colorblindPersisted,
};
dispatchKey('Escape'); // close
w6settingsChecks.panelClosed = settingsPanelRoot?.style?.display === 'none';
colorblindInput?.click(); // reset: toggle back off — reapplies + repersists
w6settingsChecks.resetClean = ctx.settings.colorblind === false &&
  !document.body.classList.contains('rw-colorblind') &&
  JSON.parse(store.get('rimward-settings-v1')).colorblind === false;
console.log('wave6 settings:', JSON.stringify(w6settingsChecks));
if (!Object.values(w6settingsChecks).every(Boolean)) { console.log('WAVE6 SETTINGS FAIL'); errors++; }

// -- g. save roundtrip: wave-6 world fields ride the dock autosave -----------
// Test SETUP: park live hostiles so the dock autosave can't be combat-blocked
// (same pattern as the wave-5 mystery-save section).
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave6 save)');
dockAtCurrentStation('dock hollowreach (wave6 save)');
tick(3, 'wave6 save settle');
const w6snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const w6saveChecks = {
  saveWritten: !!w6snap?.world,
  epicsPersisted: w6snap?.world?.epics?.freehold === 3,
  originPersisted: w6snap?.world?.origin === 'greenhand',
  onboardingPersisted: Array.isArray(w6snap?.world?.onboarding?.seen) &&
    w6snap.world.onboarding.seen.includes('move'),
  aceRivalryPersisted: w6snap?.world?.aceRivalry?.hunterSpawned === true,
  convergedPersisted: w6snap?.world?.mystery?.converged === true,
};
console.log('wave6 save fields:', JSON.stringify(w6saveChecks));
if (!Object.values(w6saveChecks).every(Boolean)) { console.log('WAVE6 SAVE FIELDS FAIL'); errors++; }

console.log(errors === 0 ? 'BOOT TEST PASS — no update errors' : `BOOT TEST FAIL — ${errors} update errors`);
process.exit(errors === 0 ? 0 : 1);
