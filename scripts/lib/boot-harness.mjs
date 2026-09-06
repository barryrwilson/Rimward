// Shared headless boot harness for RIMWARD web gameplay waves.
// Extracted from scripts/boot-test.mjs (mission 43b34db25ae32972) so the full
// boot suite (scripts/boot-test.mjs) and the focused agent-gameplay runner
// (scripts/agent-gameplay-test.mjs) share ONE initialization convention: the
// deterministic RNG seed, the stub DOM, the full system-graph boot, the tick
// loop, the gate-flight navigation helpers, and the wave-30 combat fixtures.
// Every function here is the verbatim boot-test logic with its module-scope
// captures (ctx, tick, errors) injected as parameters — no behavior change.
import * as THREE from 'three';
import { readFile } from 'node:fs/promises';
import { createCtx } from '../../src/core/ctx.js';

// The boot harness exercises one fixed world. Production systems intentionally
// use Math.random, but an unseeded process made the same commit produce
// different traffic, event, hail, and navigation state from run to run. Keep
// the full boot deterministic; scoped tests below may still save, override,
// and restore this generator when they need to force a particular roll.
export function seedBootRandom() {
  let bootRandomState = 0x5eed1234;
  Math.random = () => {
    bootRandomState = (Math.imul(1664525, bootRandomState) + 1013904223) >>> 0;
    return bootRandomState / 0x100000000;
  };
}

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
    _attrs: {},
    style: { setProperty(k, v) { this[k] = v; } },
    classList: {
      _s: new Set(),
      _commit() { el.className = [...this._s].join(' '); }, // routes through the className sync below
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
      if (k === 'class') { el.className = val; return; } // routes through the className/classList sync below
      el._attrs[k] = val;
      // data-system-id → dataset.systemId (real DOM camelCase rule);
      // galaxychart.js builds its SVG nodes/edges entirely via setAttribute.
      if (k.startsWith('data-')) el.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
    },
    getAttribute(k) { return Object.hasOwn(el._attrs, k) ? el._attrs[k] : null; },
    removeAttribute(k) { delete el._attrs[k]; },
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
  // className mirrors real DOM: assigning it re-syncs classList and the
  // 'class' attribute (and vice versa via classList._commit / setAttribute).
  let className = '';
  Object.defineProperty(el, 'className', {
    get() { return className; },
    set(v) {
      className = String(v);
      el._attrs.class = className;
      el.classList._s = new Set(className.split(/\s+/).filter(Boolean));
    },
  });
  // textContent mirrors real DOM: assigning '' clears children (render() relies on it).
  let text = '';
  Object.defineProperty(el, 'textContent', {
    get() { return text; },
    set(v) { text = String(v); if (v === '') el.children.length = 0; },
  });
  return el;
}

// Installs the stub document/window/localStorage/sessionStorage globals and
// returns the harness bindings the wave code drives by name.
export function installDomStubs() {
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
  // Harness-only: fire a synthetic keydown+keyup at every registered window
  // listener (station menu chrome, controls.js edges) exactly like real input.
  function dispatchKey(code) {
    for (const fn of winListeners.keydown ?? []) fn({ code, repeat: false, preventDefault() {} });
    for (const fn of winListeners.keyup ?? []) fn({ code, preventDefault() {} });
  }
  // Empty e.code a11y path (WAVE133 / PR4). Existing dispatchKey(code) stays code-only.
  function dispatchKeyFallback(key) {
    for (const fn of winListeners.keydown ?? []) fn({ code: '', key, repeat: false, preventDefault() {} });
    for (const fn of winListeners.keyup ?? []) fn({ code: '', key, preventDefault() {} });
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
  function* walkDom(node) {
    yield node;
    for (const c of node.children ?? []) yield* walkDom(c);
  }
  return {
    elements, winListeners, dispatchKey, dispatchKeyFallback,
    store, sessionStore, walkDom, makeEl, makeCtx2d,
  };
}

// ---- Boot the full system graph ----
// Same init list and order as scripts/boot-test.mjs (which mirrors main.js).
// Returns the ctx, the live [name, system] pairs the tick loop drives, the
// scene/camera/renderer stubs, and `binds`: every dynamically-imported binding
// the wave code references by name.
export async function bootGameSystems() {
  const { initStarfield } = await import('../../src/systems/starfield.js');
  const { initSolarSystem } = await import('../../src/systems/solarsystem.js');
  const { initAsteroids } = await import('../../src/systems/asteroids.js');
  const { initStation } = await import('../../src/systems/station.js');
  const { initLandmarks } = await import('../../src/systems/landmarks.js');
  const { initControls } = await import('../../src/systems/controls.js');
  const { initSettings } = await import('../../src/systems/settings.js');
  const { initBio } = await import('../../src/game/bio.js');
  const { initShip, FIRST_PERSON_NOSE } = await import('../../src/systems/ship.js');
  const { initWorld, recordPosition } = await import('../../src/game/world.js');
  const {
    initContacts, contactsForSystem, bumpTrust, addFavor, spendFavor, rumorFor, recognitionLine,
    keeperLedgerLine, KEEPER_LEDGER_TRUST, keeperVouchArrival, keeperChartMark, chartedMarkNotes,
    KEEPER_COMP_TRUST, GENERATED_KNOWN_TRUST,
  } = await import('../../src/game/contacts.js');
  const { initMystery } = await import('../../src/game/mystery.js');
  const { initEpics, epicEffects } = await import('../../src/game/epics.js');
  const { initGate } = await import('../../src/systems/gate.js');
  const { initJump } = await import('../../src/game/jump.js');
  const { initNav } = await import('../../src/game/nav.js');
  const { initAutopilot } = await import('../../src/game/autopilot.js');
  const { initAutomine } = await import('../../src/game/automine.js'); // same slot as main.js: after autopilot, before flee
  const { initAgentFlee } = await import('../../src/game/agent-flee.js');
  const { initTraffic } = await import('../../src/game/traffic.js');
  const {
    NPC_FACTIONS, NPC_CLASSES, configureShipAssetFileReader, primeShipAsset, buildShipAsset,
  } = await import('../../src/systems/ship-assets.js');
  configureShipAssetFileReader((assetPath) => readFile(new URL(`../../public${assetPath}`, import.meta.url)));
  await Promise.all(NPC_FACTIONS.flatMap((faction) => NPC_CLASSES.flatMap((classKey) => [
    primeShipAsset(faction, classKey, 'trader'),
    primeShipAsset(faction, classKey, 'pirate'),
  ])));
  const { initNpc, spawnLiveShip, removeLiveShip } = await import('../../src/systems/npc.js');
  const { initCombat } = await import('../../src/systems/combat.js');
  const { initPods } = await import('../../src/game/pods.js');
  const { initHail } = await import('../../src/systems/hail.js');
  const { initSong } = await import('../../src/systems/song.js');
  const { initSave, snapshot, restore, clearAutosave } = await import('../../src/game/save.js');
  const { initOrigins } = await import('../../src/game/origins.js');
  const { initOnboarding } = await import('../../src/systems/onboarding.js');
  const { initGalaxyChart } = await import('../../src/systems/galaxychart.js'); // wave-21 runtime chart (same init slot as main.js)
  const { initWakes } = await import('../../src/systems/wakes.js'); // wave 30: flee wake trails + wreck-field discovery (same init slot as main.js)
  const { initTitle } = await import('../../src/systems/title.js'); // wave 40: title screen front door
  const { initAgentApi } = await import('../../src/systems/agent-api.js');
  const { initHud, hudFamily, hairBoxForRail, agezHairOff } = await import('../../src/systems/hud.js');
  const {
    isBeautiful, makePetalGeometry, makeTendrilGeometry,
    organicMaterials, tagSway, tagBreath, tagPulse, collectOrganic, animateOrganic,
  } = await import('../../src/systems/organic.js'); // wave 27: Beautiful Ones organic toolkit

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
  const ctx = createCtx({ scene, camera, renderer });
  const { SYSTEMS, RANK_LADDER, rankFor, ECON, BANDS, CONVERGENCE, DEEPENING, ACES, ORIGIN_ARCS, NAMED_GUNS, HERMIT, CALLOW, COMMODITIES, FACTION_SERVICES, FACTION_RECOGNITION, FACTION_RUMOR, FACTION_COMP, U, HIDDEN_MOUNTS, cargoValue } = await import('../../src/game/state.js');
  const { tickPrices } = await import('../../src/game/market.js');
  ctx.systems = SYSTEMS; // mirrors main.js boot line

  const inits = [
    ['title', initTitle],
    ['starfield', initStarfield], ['solarsystem', initSolarSystem], ['asteroids', initAsteroids],
    ['station', initStation], ['landmarks', initLandmarks], ['gate', initGate], ['controls', initControls], ['autopilot', initAutopilot], ['automine', initAutomine], ['flee', initAgentFlee], ['settings', initSettings], ['bio', initBio],
    ['ship', initShip], ['world', initWorld], ['contacts', initContacts], ['mystery', initMystery], ['epics', initEpics], ['jump', initJump], ['nav', initNav], ['traffic', initTraffic],
    ['npc', initNpc], ['combat', initCombat], ['pods', initPods], ['wakes', initWakes], ['hail', initHail],
    ['song', initSong], ['save', initSave], ['origins', initOrigins], ['onboarding', initOnboarding], ['galaxychart', initGalaxyChart], ['agentapi', initAgentApi], ['hud', initHud],
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

  const binds = {
    inits, // boot-test bootFreshHarness (waves 6/7 origin beats) re-runs this exact list
    // Scoped throwaway-context builders the wave code drives directly by name
    // (boot-test waves 38-51 station/gate/asteroid/combat/title build paths).
    initStation, initGate, initAsteroids, initCombat, initTitle,
    FIRST_PERSON_NOSE, recordPosition,
    contactsForSystem, bumpTrust, addFavor, spendFavor, rumorFor, recognitionLine,
    keeperLedgerLine, KEEPER_LEDGER_TRUST, keeperVouchArrival, keeperChartMark, chartedMarkNotes,
    KEEPER_COMP_TRUST, GENERATED_KNOWN_TRUST,
    epicEffects,
    NPC_FACTIONS, NPC_CLASSES, buildShipAsset, primeShipAsset,
    spawnLiveShip, removeLiveShip,
    snapshot, restore, clearAutosave,
    hudFamily, hairBoxForRail, agezHairOff,
    isBeautiful, makePetalGeometry, makeTendrilGeometry,
    organicMaterials, tagSway, tagBreath, tagPulse, collectOrganic, animateOrganic,
    SYSTEMS, RANK_LADDER, rankFor, ECON, BANDS, CONVERGENCE, DEEPENING, ACES, ORIGIN_ARCS,
    NAMED_GUNS, HERMIT, CALLOW, COMMODITIES, FACTION_SERVICES, FACTION_RECOGNITION,
    FACTION_RUMOR, FACTION_COMP, U, HIDDEN_MOUNTS, cargoValue,
    tickPrices,
  };
  return { ctx, systems, scene, camera, renderer, binds };
}

// ---- Tick with scripted behavior ----
// `counters.frame` is read through on every frame so the caller can keep its
// own module-level `frame` binding behind a get/set accessor pair.
// `onUpdateError(e, frameNo, label)` owns error counting and logging policy.
export function makeTick(ctx, systems, counters, dt, onUpdateError) {
  return function tick(n, label) {
    for (let i = 0; i < n; i++) {
      counters.frame++;
      ctx.elapsed += dt;
      ctx.world.time += dt;
      try {
        for (const [name, s] of systems) s?.update?.(dt, ctx);
      } catch (e) {
        onUpdateError(e, counters.frame, label);
      }
      ctx.lastEvents = ctx.events;
      ctx.events = [];
    }
  };
}

// ---- Galaxy graph routing (computed at test time, never hardcoded) ----
// SYSTEMS merges the authored seven with the generated galaxy (state.js), so
// no inter-system route below is a fixed id chain: every hop is BFS-computed
// over physical gates (gates[].to) AND hub routes (hub.routes) as edges.
// Hub travel is asymmetric by design — hub→X rides the junction menu
// (jumpRequested accepts any known destination; gate proximity is gate.js's
// concern and the harness fires the event directly), X→hub rides X's
// physical back-gate.
// `onRouteError(message)` owns logging + error counting for unreachable hops.
export function makeNavHelpers({ ctx, SYSTEMS, tick, dispatchKey, onRouteError }) {
  function graphEdges(id) {
    const def = SYSTEMS[id];
    if (!def) return [];
    const out = [];
    for (const g of def.gates ?? []) if (SYSTEMS[g.to]) out.push(g.to);
    for (const r of def.hub?.routes ?? []) if (SYSTEMS[r]) out.push(r);
    return out;
  }
  // BFS shortest path from → to across the merged galaxy; null when unreachable.
  function routePath(from, to) {
    if (from === to) return [from];
    const prev = new Map([[from, null]]);
    const queue = [from];
    for (let qi = 0; qi < queue.length; qi++) {
      const cur = queue[qi];
      for (const nx of graphEdges(cur)) {
        if (prev.has(nx)) continue;
        prev.set(nx, cur);
        if (nx === to) {
          const path = [to];
          for (let n = cur; n !== null; n = prev.get(n)) path.unshift(n);
          return path;
        }
        queue.push(nx);
      }
    }
    return null;
  }
  // The next hop from `from` toward `to` (null when unreachable or already there).
  function nextHop(from, to) {
    const path = routePath(from, to);
    return path && path.length > 1 ? path[1] : null;
  }
  // The physical gate in `from` for the computed next hop toward `to`; null
  // when the hop is a hub-route leg (no gate to park at — jump from anywhere).
  function gateToward(from, to) {
    const hop = nextHop(from, to);
    return hop ? (SYSTEMS[from].gates ?? []).find((g) => g.to === hop) ?? null : null;
  }
  // The gate in `to` pointing back at `from` — jump.js's arrival rule, with
  // the same gates[0] fallback.
  function returnGate(to, from) {
    const gates = SYSTEMS[to]?.gates ?? [];
    return gates.find((g) => g.to === from) ?? gates[0] ?? null;
  }
  // Park at the computed gate for the next hop toward `to` (a hub-route hop
  // has no gate — fire from anywhere) and emit the jump request. Returns the
  // hop id, or null (counting an error) when the destination is unreachable.
  function jumpToward(to, label) {
    const from = ctx.world.currentSystem;
    const hop = nextHop(from, to);
    if (!hop) {
      onRouteError(`ROUTE FAIL — no path ${from} → ${to} (${label})`);
      return null;
    }
    const gate = (SYSTEMS[from].gates ?? []).find((g) => g.to === hop);
    if (gate) {
      ctx.ship.object.position.set(...gate.position);
      ctx.ship.velocity.set(0, 0, 0);
      tick(5, `at ${hop} gate (${label})`);
    }
    ctx.emit('jumpRequested', { to: hop });
    return hop;
  }
  // BFS-hop legs until arrival at `to` — for travel chains whose intermediate
  // stops carry no assertions. Returns false on failure (error counted).
  function travelTo(to, label) {
    let guard = Object.keys(SYSTEMS).length + 1;
    while (ctx.world.currentSystem !== to) {
      if (--guard <= 0) { onRouteError(`ROUTE FAIL — hop loop toward ${to} (${label})`); return false; }
      const hop = jumpToward(to, label);
      if (!hop || !tickUntilJumpDone(hop, `${label} hop to ${hop}`)) {
        onRouteError(`TRAVEL FAIL — never arrived at ${hop} (${label})`);
        return false;
      }
    }
    return true;
  }
  function dockAtCurrentStation(label) {
    // Wave 53: do not park inside the station cylinder. Offset onto the
    // dock shell (r 32 + player 2.4 = 34.4; zone is 45).
    const st = SYSTEMS[ctx.world.currentSystem].station.position;
    ctx.ship.object.position.set(st[0] + 36, st[1], st[2]);
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
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
  return {
    graphEdges, routePath, nextHop, gateToward, returnGate,
    jumpToward, travelTo, tickUntilJumpDone, dockAtCurrentStation, undockStation,
  };
}

// ---- Wave-30 combat fixtures ----
// Spawn/park/remove live pirate ships and tick until a demand hail lands.
// The harness drives ctx.ships by hand (traffic owns it in production).
export function makeCombatFixtures({ ctx, tick, spawnLiveShip, removeLiveShip }) {
  const isHostile = (s) => s.role === 'pirate' || s.role === 'ace'
    || s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  const parkHostiles = (label) => {
    for (const s of ctx.ships) if (isHostile(s) && s.object) s.object.position.set(9000, 9000, 9000);
    tick(5, label);
  };
  const spawnPirate = (suffix, personality, offset) => {
    const p = ctx.ship.object.position;
    const rec = {
      id: `wave30-${suffix}`, name: `Wave30 ${suffix}`, classKey: 'cutter',
      faction: 'redledger', role: 'pirate', resolve: 50, personality,
      // Wave 32: pin the interest roll. Every wave-30 leg requires engagement;
      // alwaysHuntsPlayer reproduces the pre-wave-32 always-lock behavior
      // exactly (chance 1, no temper stamp), so the dice can't skip a demand.
      alwaysHuntsPlayer: true,
    };
    const live = spawnLiveShip(ctx, rec, new THREE.Vector3(p.x + offset[0], p.y + offset[1], p.z + offset[2]));
    ctx.ships.push(live); // traffic owns this list in production; the harness drives by hand
    return live;
  };
  const removeShip = (live) => {
    const i = ctx.ships.indexOf(live);
    if (i >= 0) ctx.ships.splice(i, 1);
    removeLiveShip(ctx, live);
  };
  // Tick until this ship's demand hail lands. Budget is 1 s (60 frames): the
  // RW-006 pin below must open on frame 1; a miss is a setup regression, not
  // a reason to wait on soak-era combat/fear/event luck.
  const demandEvs = (live, label) => {
    const evs = [];
    for (let i = 0; i < 60; i++) {
      tick(1, label);
      evs.push(...ctx.lastEvents);
      if (evs.some((e) => e.type === 'hailOpened' && e.ship === live)) break;
    }
    return evs;
  };
  return { isHostile, parkHostiles, spawnPirate, removeShip, demandEvs };
}

// ---- Calm pins (RW-006 demand-input discipline) ----
// TEST SETUP: extra starter elapsed (Greenhand 180s). Session death remaining
// is 90s of dt (tick is 1/60 s).
export function makeCalmPins({ ctx, expireSessionDeathCalm }) {
  return function expireAi05(label) {
    if (Number.isFinite(ctx.world.time) && ctx.world.time < 180) ctx.world.time = 180;
    try { expireSessionDeathCalm(); } catch { /* pin must not throw */ }
    void label;
  };
}
