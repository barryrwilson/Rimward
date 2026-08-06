// Headless full-boot harness for RIMWARD web (throwaway diagnostic).
// Replicates main.js wiring with a stub renderer + stub DOM, then ticks the
// whole system graph with scripted inputs. Catches integration errors that
// per-worker harnesses can't see.
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
    style: {},
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
    click() { for (const fn of this._listeners.click ?? []) fn({ type: 'click', target: this }); },
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
const { initControls } = await import('../src/systems/controls.js');
const { initBio } = await import('../src/game/bio.js');
const { initShip } = await import('../src/systems/ship.js');
const { initWorld } = await import('../src/game/world.js');
const {
  initContacts, contactsForSystem, bumpTrust, addFavor, spendFavor, rumorFor, recognitionLine,
} = await import('../src/game/contacts.js');
const { initGate } = await import('../src/systems/gate.js');
const { initJump } = await import('../src/game/jump.js');
const { initTraffic } = await import('../src/game/traffic.js');
const { initNpc } = await import('../src/systems/npc.js');
const { initCombat } = await import('../src/systems/combat.js');
const { initPods } = await import('../src/game/pods.js');
const { initHail } = await import('../src/systems/hail.js');
const { initSong } = await import('../src/systems/song.js');
const { initSave } = await import('../src/game/save.js');
const { initHud } = await import('../src/systems/hud.js');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
const ctx = createCtx({ scene, camera, renderer });
const { SYSTEMS, RANK_LADDER, rankFor, ECON } = await import('../src/game/state.js');
ctx.systems = SYSTEMS; // mirrors main.js boot line

const inits = [
  ['starfield', initStarfield], ['solarsystem', initSolarSystem], ['asteroids', initAsteroids],
  ['station', initStation], ['gate', initGate], ['controls', initControls], ['bio', initBio],
  ['ship', initShip], ['world', initWorld], ['contacts', initContacts], ['jump', initJump], ['traffic', initTraffic],
  ['npc', initNpc], ['combat', initCombat], ['pods', initPods], ['hail', initHail],
  ['song', initSong], ['save', initSave], ['hud', initHud],
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
  // Planets: standard-material spheres (sun/eyes/beacons are basic, hull is physical).
  if (o.isMesh && o.geometry?.type === 'SphereGeometry' && o.material?.isMeshStandardMaterial && !o.material?.isMeshPhysicalMaterial) redPlanets++;
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
  sixEntries: w4contacts.length === 6,
  dockmasterX3: contactRoleCt('dockmaster') === 3,
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

console.log(errors === 0 ? 'BOOT TEST PASS — no update errors' : `BOOT TEST FAIL — ${errors} update errors`);
process.exit(errors === 0 ? 0 : 1);
