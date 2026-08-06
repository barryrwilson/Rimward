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
    style: {},
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); },
      toggle(c, f) { (f ?? !this._s.has(c)) ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); },
    },
    dataset: {},
    textContent: '',
    innerHTML: '',
    value: '',
    appendChild(c) { this.children.push(c); return c; },
    append(...c) { this.children.push(...c); },
    prepend(...c) { this.children.unshift(...c); },
    insertAdjacentHTML() {},
    insertAdjacentElement() {},
    closest() { return null; },
    cloneNode() { return makeEl(this.tagName); },
    contains() { return false; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 }; },
    getContext(kind) { return kind === '2d' ? makeCtx2d() : null; },
    focus() {},
    click() {},
  };
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
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
};
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
const { SYSTEMS } = await import('../src/game/state.js');
ctx.systems = SYSTEMS; // mirrors main.js boot line

const inits = [
  ['starfield', initStarfield], ['solarsystem', initSolarSystem], ['asteroids', initAsteroids],
  ['station', initStation], ['gate', initGate], ['controls', initControls], ['bio', initBio],
  ['ship', initShip], ['world', initWorld], ['jump', initJump], ['traffic', initTraffic],
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
console.log(errors === 0 ? 'BOOT TEST PASS — no update errors' : `BOOT TEST FAIL — ${errors} update errors`);
process.exit(errors === 0 ? 0 : 1);
