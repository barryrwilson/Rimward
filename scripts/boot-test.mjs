// Headless full-boot harness for RIMWARD web (throwaway diagnostic).
// Replicates main.js wiring with a stub renderer + stub DOM, then ticks the
// whole system graph with scripted inputs. Catches integration errors that
// per-worker harnesses can't see.
// Wave 6: origin pick at fresh boot, onboarding hints, faction epics +
// Standing service, mystery convergence, Named-Gun ace arc, headless audio
// cues, settings/a11y panel, and the extended save WORLD_FIELDS roundtrip.
// Wave 7: the Hush jump leg (band 3), mystery deepening, Named-Gun lineage
// successors, the Illyx rematch ladder, epic capstone stages, the ledgerDebt
// creditor arc + one-time origin payoff, and the originArc save roundtrip.
// Wave 8: the Verge jump leg (band 4) + its clue-free landmarks, the Illyx
// kin lineage (one successor, then the line breaks), the ledgerDebt
// repeat-debtor round, the beautiful/marked origin beats on fresh harness
// boots, and the wave-8 originArc/aceRivalry save roundtrip.
// Wave 9: rimWithoutGuns (one milestone + one fear bump once both Named-Gun
// lines are broken, and the pirate resolve reaction), the greenhand/drifter
// origin beats on fresh harness boots, the hermit economy (scarcity pricing,
// the first-trade milestone, the slowed random walk), and the wave-9
// originArc/milestones save roundtrip.
// Wave 10: the aspirant cycle (three new names rise once rimWithoutGuns
// stands at max fear, then the rim stays quiet), the hermit pirate's
// one-time commLine, the deep-rim keepers (Hush/Verge dockmasters) and
// their mystery acknowledgments, and the wave-10
// aceRivalry/milestones/contacts save roundtrip.
// Wave 11: the aspirant aftermath (rimAnswered + one aftermath songShift,
// fire-once), Old Callow's per-visit return lines and his vouch hail (600
// UU, +15 trust and a favor to both keepers), the keeper ledger line, the
// trust-60 hermit-markup waiver and the favor-comp repair at The Vigil,
// and the callowReturns/vouched recordBanks save roundtrip.
// Wave 12: Callow's books on the player (post-vouch verge visits voice
// vouchedReturnLines on the same callowReturns cursor, and a hail press is
// refused — one rotating refuseLines commLine per visit, never a card),
// the keeper ledger's clue tier (naming the system holding an unfound
// clue, rotating; a new closing line), and the restore-time live-record
// heal (live ships re-pointed at the restored bank, live flags rebuilt).
// Wave 13: the keeper vouch acknowledgment (Callow's word — one
// recognitionLine tier per hush/verge keeper, witnessed by the
// callowVouched milestone, never at Hollowreach, never below the comp
// tier), and the keeper ledger's comp-tier narrowing (at trust 60 the
// tier-2 open page names the landmark nearest its first unfound clue).
// Wave 14: the vouch acknowledgment on the arrival comms (a CHANGED
// 'systemLoaded' to the hush or verge voices Callow's word once — the
// same vouchAck flag as the people card, once per keeper across both
// surfaces, and a same-system re-emit is no arrival), and the comp-tier
// chart mark (a docked keeper marks the narrowed page's nearest landmark
// on the pilot's charts — mystery.charted, recorded state only, never
// the clue).
// Wave 21: the Lamplighter hub junction flown end-to-end through REAL
// input (park at freehold's hub, KeyG cycles the authored route list with
// wrap, D rides the real gate path to fh_hearth, and fh_hearth's physical
// back-gate home lands at the hub junction — jump.js's hub-arrival rule),
// the runtime galaxy chart DOM (KeyM/Escape, 100 .rw-galaxy-node elements,
// the live .is-current marker, .rw-galaxy-gate + .rw-galaxy-route edges),
// the same-system restore in-transit migrant registry regression (a
// forced migrant must still ARRIVE after a freehold→freehold
// death-restore, never strand), and the galaxyChecks degree-cap + pinned
// band extensions.
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
const { initWorld, recordPosition } = await import('../src/game/world.js');
const {
  initContacts, contactsForSystem, bumpTrust, addFavor, spendFavor, rumorFor, recognitionLine,
  keeperLedgerLine, KEEPER_LEDGER_TRUST, keeperVouchArrival, keeperChartMark, chartedMarkNotes,
} = await import('../src/game/contacts.js');
const { initMystery } = await import('../src/game/mystery.js');
const { initEpics, epicEffects } = await import('../src/game/epics.js');
const { initGate } = await import('../src/systems/gate.js');
const { initJump } = await import('../src/game/jump.js');
const { initTraffic } = await import('../src/game/traffic.js');
const { initNpc, spawnLiveShip, removeLiveShip } = await import('../src/systems/npc.js');
const { initCombat } = await import('../src/systems/combat.js');
const { initPods } = await import('../src/game/pods.js');
const { initHail } = await import('../src/systems/hail.js');
const { initSong } = await import('../src/systems/song.js');
const { initSave } = await import('../src/game/save.js');
const { initOrigins } = await import('../src/game/origins.js');
const { initOnboarding } = await import('../src/systems/onboarding.js');
const { initGalaxyChart } = await import('../src/systems/galaxychart.js'); // wave-21 runtime chart (same init slot as main.js)
const { initHud } = await import('../src/systems/hud.js');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
const ctx = createCtx({ scene, camera, renderer });
const { SYSTEMS, RANK_LADDER, rankFor, ECON, BANDS, CONVERGENCE, DEEPENING, ACES, ORIGIN_ARCS, NAMED_GUNS, HERMIT, CALLOW } = await import('../src/game/state.js');
const { tickPrices } = await import('../src/game/market.js');
ctx.systems = SYSTEMS; // mirrors main.js boot line

const inits = [
  ['starfield', initStarfield], ['solarsystem', initSolarSystem], ['asteroids', initAsteroids],
  ['station', initStation], ['landmarks', initLandmarks], ['gate', initGate], ['controls', initControls], ['settings', initSettings], ['bio', initBio],
  ['ship', initShip], ['world', initWorld], ['contacts', initContacts], ['mystery', initMystery], ['epics', initEpics], ['jump', initJump], ['traffic', initTraffic],
  ['npc', initNpc], ['combat', initCombat], ['pods', initPods], ['hail', initHail],
  ['song', initSong], ['save', initSave], ['origins', initOrigins], ['onboarding', initOnboarding], ['galaxychart', initGalaxyChart], ['hud', initHud],
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

// ---- Galaxy graph routing (computed at test time, never hardcoded) ----
// SYSTEMS merges the authored six with the generated galaxy (state.js), so
// no inter-system route below is a fixed id chain: every hop is BFS-computed
// over physical gates (gates[].to) AND hub routes (hub.routes) as edges.
// Hub travel is asymmetric by design — hub→X rides the junction menu
// (jumpRequested accepts any known destination; gate proximity is gate.js's
// concern and the harness fires the event directly), X→hub rides X's
// physical back-gate.
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
    console.log(`ROUTE FAIL — no path ${from} → ${to} (${label})`);
    errors++;
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
    if (--guard <= 0) { console.log(`ROUTE FAIL — hop loop toward ${to} (${label})`); errors++; return false; }
    const hop = jumpToward(to, label);
    if (!hop || !tickUntilJumpDone(hop, `${label} hop to ${hop}`)) {
      console.log(`TRAVEL FAIL — never arrived at ${hop} (${label})`);
      errors++;
      return false;
    }
  }
  return true;
}

// ---- Wave 3: gate network data sanity (every system def) ----
// 100-system phase-1 contract: the authored six plus the generated galaxy.
// The pre-existing per-def gate hygiene is EXTENDED with the structural
// invariants: physical-gate reversibility (A→B gate implies B reaches A —
// a physical gate back, OR B is a hub whose hub.routes include A), hub
// routes that resolve AND carry a physical back-gate to the hub, full
// connectivity from freehold (BFS over gates + hub routes), band bounds
// (0..4, the Verge pinned at 4), the required field set (chart/station/
// field/gates/cast/worldSeed/planetCount), the exact system count, and the
// pinned deep-rim named specials.
const systemIds = Object.keys(SYSTEMS);
const gateDataOk = Object.values(SYSTEMS).every((def) =>
  Array.isArray(def.gates) && def.gates.length > 0 && def.gates.every((g) =>
    Array.isArray(g.position) && g.position.length === 3 && !!SYSTEMS[g.to]));
const gateSymmetryOk = systemIds.every((id) => SYSTEMS[id].gates.every((g) =>
  (SYSTEMS[g.to].gates ?? []).some((bg) => bg.to === id)
  || (SYSTEMS[g.to].hub?.routes ?? []).includes(id)));
const hubRoutesOk = systemIds.every((id) => (SYSTEMS[id].hub?.routes ?? []).every((r) =>
  !!SYSTEMS[r] && (SYSTEMS[r].gates ?? []).some((g) => g.to === id)));
const connectedOk = systemIds.every((id) => routePath('freehold', id) !== null);
const bandsOk = systemIds.every((id) =>
  Number.isInteger(SYSTEMS[id].band) && SYSTEMS[id].band >= 0 && SYSTEMS[id].band <= 4)
  && SYSTEMS.verge?.band === 4;
const fieldsOk = systemIds.every((id) => {
  const def = SYSTEMS[id];
  return Array.isArray(def.chart) && def.chart.length === 2 && def.chart.every((v) => Number.isFinite(v))
    && !!def.station && Array.isArray(def.station.position) && def.station.position.length === 3
    && !!def.field && Array.isArray(def.field.center) && def.field.center.length === 3
    && Array.isArray(def.gates) && !!def.cast
    && Number.isInteger(def.worldSeed) && Number.isInteger(def.planetCount);
});
const countOk = systemIds.length === 100;
const pinnedOk = ['lastbeacon', 'blackstation', 'stolenwomb', 'fx_bastion', 'gc_auction']
  .every((id) => !!SYSTEMS[id]);
// Wave-21 review pins: the generator's physical-degree cap (symmetric
// physical gates, <= 3 per system — one-way hub routes are the exempt
// relief valve and never count) and the named-special band placements.
const degreeOk = systemIds.every((id) => (SYSTEMS[id].gates ?? []).length <= 3);
const pinnedBandsOk = SYSTEMS.stolenwomb?.band === 2
  && SYSTEMS.lastbeacon?.band === 3 && SYSTEMS.blackstation?.band === 3;
const galaxyChecks = { gateDataOk, gateSymmetryOk, hubRoutesOk, connectedOk, bandsOk, fieldsOk, countOk, pinnedOk, degreeOk, pinnedBandsOk };
console.log(`gate network: systems=${systemIds.length}`, JSON.stringify(galaxyChecks));
if (!Object.values(galaxyChecks).every(Boolean)) {
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

// ---- Wave 21: hub junction flight / runtime chart / same-system restore ----
// Runs with the hull pinned (random combat can't kill), ahead of the
// wave-2 authored lanes; the run ends back in freehold, undocked, for them.

// -- 1. Lamplighter hub junction, flown through REAL input -----------------
// The shared hub contract: gate.js builds a junction assembly at
// SYSTEMS[id].hub.position carrying hub.routes; KeyG cycles the selection
// (wrapping, authored order) while the junction is the nearest zone; D —
// the same dockPressed edge a physical-gate jump uses — emits
// jumpRequested for the selected route. jump.js arrives at the
// destination's return-pointing physical gate, and coming HOME through a
// route target's physical back-gate lands at the hub junction (the
// wave-21 hub-arrival rule) instead of the gates[0] fallback.
const fhHub = SYSTEMS.freehold.hub;
const fhRoutes = fhHub?.routes ?? [];
ctx.ship.object.position.set(...(fhHub?.position ?? [0, 0, 0]));
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'wave21 at freehold junction');
const w21hubChecks = {
  hubDataOk: Array.isArray(fhHub?.position) && fhHub.position.length === 3
    && fhRoutes.length > 0 && fhRoutes[0] === 'fh_hearth',
  inZone: ctx.gate.inZone === true,
  nearHub: ctx.gate.nearHub === true,
  routeCount: ctx.gate.nearRouteCount === fhRoutes.length && fhRoutes.length > 0,
  initialSelection: ctx.gate.nearRouteIndex === 0 && ctx.gate.nearTo === fhRoutes[0],
};
// KeyG through the whole list in authored order, then once more to wrap.
{
  let cyclesInOrder = true;
  let wrapsToFirst = false;
  for (let i = 1; i <= fhRoutes.length; i++) {
    dispatchKey('KeyG');
    tick(1, 'wave21 junction cycle');
    const want = i % fhRoutes.length;
    if (ctx.gate.nearRouteIndex !== want || ctx.gate.nearTo !== fhRoutes[want]) cyclesInOrder = false;
    if (i === fhRoutes.length) wrapsToFirst = ctx.gate.nearRouteIndex === 0 && ctx.gate.nearTo === fhRoutes[0];
  }
  w21hubChecks.cyclesInOrder = cyclesInOrder;
  w21hubChecks.wrapsToFirst = wrapsToFirst;
}
// D on the wrapped selection (routes[0] === fh_hearth): controls.js turns
// the keydown into dockPressed one tick after the keydown; gate.js emits
// and jump.js consumes on the tick after that — the request rides
// lastEvents exactly like a physical-gate D press.
dispatchKey('KeyD');
tick(2, 'wave21 junction D');
const w21jumpEv = ctx.lastEvents.find((e) => e.type === 'jumpRequested') ?? null;
w21hubChecks.dEmitsRouteJump = w21jumpEv?.to === fhRoutes[0] && fhRoutes[0] === 'fh_hearth';
w21hubChecks.jumpBegun = ctx.gate.jumping === true && ctx.gate.destination === 'fh_hearth';
const w21hearthOk = tickUntilJumpDone('fh_hearth', 'wave21 junction jump');
w21hubChecks.arrivedAtHearth = w21hearthOk && ctx.world.currentSystem === 'fh_hearth';
// Arrival: just past fh_hearth's physical back-gate to freehold (the
// return-pointing gate rule; the offset is exactly JUMP.arrivalOffset.
// fh_hearth's gates[0] IS the back-gate, so this leg pins the arrival
// position only — the RETURN leg below carries the hub-arrival rule
// coverage).
const hearthBack = returnGate('fh_hearth', 'freehold');
const p21a = ctx.ship.object.position;
w21hubChecks.nearHearthBackGate = !!hearthBack && hearthBack.to === 'freehold'
  && Math.hypot(p21a.x - hearthBack.position[0], p21a.y - hearthBack.position[1], p21a.z - hearthBack.position[2]) < 80;
// Home through the physical back-gate — the real D path again. The
// hub-arrival rule must land the ship at the freehold JUNCTION (~50u off
// hub.position), never at the gates[0] fallback (~145u away — 80u
// discriminates; the junction sits ~145u from freehold's veridian gate).
ctx.ship.object.position.set(...(hearthBack?.position ?? [0, 0, 0]));
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'wave21 at hearth back-gate');
w21hubChecks.backGateZone = ctx.gate.inZone === true && ctx.gate.nearHub === false && ctx.gate.nearTo === 'freehold';
dispatchKey('KeyD');
tick(2, 'wave21 back-gate D');
const w21homeOk = tickUntilJumpDone('freehold', 'wave21 junction return');
const p21b = ctx.ship.object.position;
w21hubChecks.returnedToFreehold = w21homeOk && ctx.world.currentSystem === 'freehold';
w21hubChecks.hubArrivalRule = Math.hypot(
  p21b.x - (fhHub?.position?.[0] ?? 1e9), p21b.y - (fhHub?.position?.[1] ?? 1e9), p21b.z - (fhHub?.position?.[2] ?? 1e9)) < 80;
console.log('wave21 hub junction:', JSON.stringify(w21hubChecks));
if (!Object.values(w21hubChecks).every(Boolean)) { console.log('WAVE21 HUB JUNCTION FAIL'); errors++; }

// -- 2. Runtime galaxy chart DOM -------------------------------------------
// The chart root is built once at init from the live SYSTEMS/FACTIONS
// records (is-hidden until KeyM). SVG nodes/edges arrive via setAttribute
// — recorded by the harness stub — and .is-current is refreshed by the
// chart's own update(); the run is back in freehold, so the freehold node
// must carry it. Class queries split on whitespace: the layer groups
// (.rw-galaxy-gates/-routes/-nodes) must never substring-match.
const chartRoot = (() => {
  for (const n of walkDom(document.body)) {
    if (typeof n.className === 'string' && n.className.split(/\s+/).includes('rw-galaxy-chart')) return n;
  }
  return null;
})();
const chartClass = (cls) => {
  const out = [];
  if (!chartRoot) return out;
  for (const n of walkDom(chartRoot)) {
    if ((n.getAttribute?.('class') ?? '').split(/\s+/).includes(cls)) out.push(n);
  }
  return out;
};
dispatchKey('KeyM');
tick(2, 'wave21 chart open');
const chartNodes = chartClass('rw-galaxy-node');
const fhChartNode = chartNodes.find((n) => n.getAttribute('data-system-id') === 'freehold') ?? null;
const w21chartChecks = {
  rootPresent: !!chartRoot,
  opensOnKeyM: !!chartRoot && !chartRoot.classList.contains('is-hidden')
    && chartRoot.getAttribute('aria-hidden') === 'false',
  nodeCount100: chartNodes.length === 100 && chartNodes.length === systemIds.length,
  currentMarked: !!fhChartNode && fhChartNode.classList.contains('is-current'),
  gateEdges: chartClass('rw-galaxy-gate').length > 0,
  routeEdges: chartClass('rw-galaxy-route').length > 0,
};
dispatchKey('Escape');
tick(2, 'wave21 chart escape');
w21chartChecks.escapeCloses = !!chartRoot && chartRoot.classList.contains('is-hidden')
  && chartRoot.getAttribute('aria-hidden') === 'true';
dispatchKey('KeyM'); // toggle back open…
tick(2, 'wave21 chart reopen');
w21chartChecks.keyMReopens = !!chartRoot && !chartRoot.classList.contains('is-hidden');
dispatchKey('KeyM'); // …and toggle closed — the state later sections inherit
tick(2, 'wave21 chart toggle close');
w21chartChecks.keyMCloses = !!chartRoot && chartRoot.classList.contains('is-hidden');
console.log('wave21 galaxy chart:', JSON.stringify(w21chartChecks), `nodes=${chartNodes.length} gates=${chartClass('rw-galaxy-gate').length} routes=${chartClass('rw-galaxy-route').length}`);
if (!Object.values(w21chartChecks).every(Boolean)) { console.log('WAVE21 GALAXY CHART FAIL'); errors++; }

// -- 3. Same-system restore: the in-transit migrant registry ---------------
// Regression target: restore() swaps recordBanks wholesale, so every
// in-transit registry entry pointing at a PRE-restore record object is
// stale — and a freehold→freehold death-restore emits no 'systemLoaded'
// (save.js only announces a CHANGE), so world.js's consumeSystemLoaded
// registry rebuild never fires. Without the wave-21 registry heal the
// restored migrant sits 'inTransit' forever. Force one deterministically
// (bypassing pickMigrant's ~90 s timer; a non-live trader so no live ship
// references it), ride the REAL dock-autosave + death-recovery path, then
// assert the migrant ARRIVES through the same arriveInSystem path a
// natural migrant takes. The arrival is a legitimate migration outcome —
// the run continues with one extra trader in the destination bank, which
// the wave-3 cast gate explicitly tolerates.
const migrantDest = SYSTEMS[ctx.world.currentSystem].gates[0]?.to ?? null;
const migrant = ctx.world.records.find((r) => r.role === 'trader' && !r.live && r.state !== 'dead' && r.state !== 'captured')
  ?? ctx.world.records.find((r) => r.role === 'trader' && r.state !== 'dead' && r.state !== 'captured')
  ?? null;
if (migrant?.id && migrantDest) {
  migrant.state = 'inTransit';
  migrant.transitTo = migrantDest;
  migrant.transitEta = ctx.world.time + 30; // ~30 s of world time past the dock save
}
// Records re-resolve by ID across the restore — save.js swaps the bank
// arrays (and every record object in them) wholesale; ids ('rec-N') are
// stable, names are not guaranteed unique across 100 systems.
const migrantId = migrant?.id ?? null;
const migrantName = migrant?.name ?? null; // logging only
const findBankRec = (id) => {
  for (const sysId of Object.keys(ctx.world.recordBanks ?? {})) {
    const rec = ctx.world.recordBanks[sysId].find((r) => r.id === id);
    if (rec) return { rec, bank: sysId };
  }
  return null;
};
// Park live hostiles so the dock autosave can't be combat-blocked (the
// wave-10 save pattern — a blocked save retries only after BLOCK_RETRY,
// and a stale snapshot would false-fail every check below).
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace'
    || s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave21 migrant save)');
dockAtCurrentStation('wave21 dock (migrant save)'); // 'docked' fires trySave
// Poll the store for the migrant instead of trusting one settle window:
// even a combat-blocked autosave lands within a couple of BLOCK_RETRY
// cycles, well inside the 30 s eta.
let w21savedMigrant = null;
for (let i = 0; i < 60 * 15 && !w21savedMigrant; i++) {
  tick(1, 'wave21 migrant save wait');
  const snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
  w21savedMigrant = (snap?.world?.recordBanks?.[snap?.world?.currentSystem ?? ''] ?? [])
    .find((r) => r.id === migrantId) ?? null;
}
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave21 restore)');
dispatchKey('Enter'); // recover(): restore(last save) — SAME system (freehold → freehold)
const w21restoredSystem = ctx.world.currentSystem;
const w21restored = migrantId ? findBankRec(migrantId) : null;
// Snapshot NOW: the arrival below mutates the same bank record object, so
// reading w21restored.rec after the wait would see 'enroute', not the
// as-restored state this regression pins.
const w21restoredState = w21restored?.rec.state ?? null;
const w21restoredBank = w21restored?.bank ?? null;
undockStation(); // leave Freehold Landing (wave-21 restore dock)
tick(2, 'wave21 post-restore settle');
let w21arrival = null;
for (let i = 0; i < 60 * 60 && !w21arrival; i++) { // eta is ~30 s out; 60 s bound
  tick(1, 'wave21 migrant arrival wait');
  const r = migrantId ? findBankRec(migrantId) : null;
  if (r && r.rec.state !== 'inTransit') w21arrival = r;
}
const w21migrantChecks = {
  migrantForced: !!migrantId && !!migrantDest,
  savedInTransit: w21savedMigrant?.state === 'inTransit' && w21savedMigrant?.transitTo === migrantDest
    && Number.isFinite(w21savedMigrant?.transitEta),
  sameSystemRestore: w21restoredSystem === 'freehold',
  restoredStillInTransit: w21restoredState === 'inTransit' && w21restoredBank === 'freehold',
  migrantArrives: !!w21arrival,
  landsInDestBank: w21arrival?.bank === migrantDest && w21arrival?.rec.system === migrantDest
    && w21arrival?.rec.state === 'enroute',
};
console.log('wave21 migrant restore:', JSON.stringify(w21migrantChecks), `name=${JSON.stringify(migrantName)} dest=${migrantDest} time=${ctx.world.time.toFixed(1)}`);
if (!Object.values(w21migrantChecks).every(Boolean)) { console.log('WAVE21 MIGRANT RESTORE FAIL'); errors++; }

// ---- Wave 2: gate jump round trip ----
// Gate hygiene (pre-existing flake): a soak world event's pressure pull can
// leave freehold provisions deviated when provBefore is sampled
// (laborStrike pushes staples toward +34% of baseline, and the fractional
// deviation outlives the event — PRESSURE_PULL 0.06/s), or start mid-jump
// and drag the DESTINATION system's price — either side compresses the
// veridianSpread / provisionsSpread gates below. End any active or due
// event through the real endEvent path (clears the pressure, pushes the
// next event 3-6 min out), then decay the residual deviation with
// price-only tickPrices calls — NO world ticks, so traffic, migration, and
// cast counts are untouched (explicit-Euler pull needs dt <= 1 to stay
// stable; 300 × 0.5 s shrinks any deviation ~10^4×).
const settlePrices = (label) => {
  tick(1, `${label} pre-check`); // a due event starts on THIS tick, not mid-window
  if (ctx.world.activeEvent) {
    ctx.world.activeEvent.endsAt = ctx.world.time - 1; // real endEvent → applyEventPressure('clear')
    tick(2, `${label} event cleared`);
  }
  for (let i = 0; i < 300; i++) tickPrices(ctx, 0.5);
};
// Park at the computed gate toward veridian: zone check should flip.
ctx.ship.object.position.set(...gateToward('freehold', 'veridian').position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at gate');
console.log(`gate inZone (expect true): ${ctx.gate.inZone}`);
// Fire the jump directly (input edges are controls.js territory; the browser
// verifier covers the D-key path — here we test the swap machinery).
settlePrices('wave2 freehold');
const astBefore = ctx.asteroids.list;
const provBefore = ctx.world.prices.provisions;
ctx.emit('jumpRequested', { to: 'veridian' });
tick(60 * 4, 'jump to veridian');
settlePrices('wave2 veridian');
const jumpChecks = {
  currentSystem: ctx.world.currentSystem === 'veridian',
  jumpingDone: !ctx.gate.jumping,
  shipsCleared: ctx.ships.length === 0 || ctx.ships.every((s) => ctx.world.records.some((r) => r.name === s.record?.name)),
  asteroidsSwapped: ctx.asteroids.list !== astBefore,
  priceRebound: ctx.world.prices.provisions !== provBefore,
  veridianSpread: ctx.world.prices.provisions > provBefore * 1.1, // 135 vs 100 baseline
  nearDestGate: (() => {
    const g = returnGate('veridian', 'freehold').position;
    const p = ctx.ship.object.position;
    return Math.hypot(p.x - g[0], p.y - g[1], p.z - g[2]) < 400;
  })(),
};
console.log('jump checks:', JSON.stringify(jumpChecks));
const jumpOk = Object.values(jumpChecks).every(Boolean);
tick(60 * 30, 'veridian soak 30s');
console.log(`veridian: ships=${ctx.ships.length} station=${ctx.station ? 'present' : 'missing'} prices.provisions=${ctx.world.prices.provisions.toFixed(0)}`);

// ---- Wave 3: second hop veridian → redmarch ----
// Park at the computed gate toward redmarch and jump.
const redGate = gateToward('veridian', 'redmarch');
ctx.ship.object.position.set(...redGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at redmarch gate');
console.log(`gate inZone (expect true): ${ctx.gate.inZone} nearTo (expect redmarch): ${ctx.gate.nearTo}`);
ctx.emit('jumpRequested', { to: 'redmarch' });
tick(60 * 4, 'jump to redmarch');
// Cast hygiene (pre-existing flake): inter-system migration (world.js §8.2)
// marks an enroute veridian trader 'inTransit' every ~90 s with a 60–120 s
// eta, and arriveMigrants PUSHES the record into the destination bank when
// the eta passes. A pick made during the wave-2 veridian visit therefore
// lands mid-soak here and grows ctx.world.records to 14 — the old
// `records.length === 13` gate flaked (~1/70 runs) even though the seeded
// cast was intact. Snapshot the bank right after the jump completes: the
// earliest veridian pick is the first veridian-current tick, and pick →
// this line is ~40–45 s of world time < 60 s min eta (freehold's only gate
// leads to veridian; hollowreach, the other redmarch neighbor, is never
// current before this), so no arrival can have landed yet and this Set IS
// exactly the seeded redmarch cast. The gate below asserts the REAL
// contract — the seeded 5 trader / 7 pirate / 1 patrol / 0 ace cast
// survives the hop and soak intact (membership by reference; deaths only
// flip rec.state, they never splice the bank) — and tolerates only genuine
// migration arrivals, which pickMigrant guarantees are traders.
const seededCast = new Set(ctx.world.records);
tick(60 * 30, 'redmarch soak 30s'); // let traffic respawn from the new cast
settlePrices('wave3 redmarch');
let redPlanets = 0;
ctx.scene.traverse((o) => {
  // Planets: standard-material spheres (sun/eyes are basic, hull is physical,
  // wave-5 landmark/clue POIs carry userData.poiType and are excluded).
  if (o.isMesh && o.geometry?.type === 'SphereGeometry' && o.material?.isMeshStandardMaterial && !o.material?.isMeshPhysicalMaterial && !o.userData?.poiType) redPlanets++;
});
const roleCount = (role) => ctx.world.records.filter((r) => r.role === role && seededCast.has(r)).length;
const redChecks = {
  currentSystem: ctx.world.currentSystem === 'redmarch',
  jumpingDone: !ctx.gate.jumping,
  shipsRespawned: ctx.ships.length > 0 && ctx.ships.every((s) => ctx.world.records.some((r) => r.name === s.record?.name)),
  // Seeded cast must survive exact (see snapshot above); any record beyond
  // it must be a migration-arrival trader — anything else is cast drift.
  castMatches: seededCast.size === 13 && roleCount('trader') === 5 && roleCount('pirate') === 7 && roleCount('patrol') === 1 && roleCount('ace') === 0 && ctx.world.records.every((r) => seededCast.has(r) || r.role === 'trader'),
  stationPresent: ctx.station?.name === 'Ledger Anchorage',
  pricesTable: !!ctx.world.markets?.redmarch && ctx.world.prices === ctx.world.markets.redmarch,
  provisionsSpread: ctx.world.prices.provisions > 100, // priceBase 1.3 × 100 baseline
  tradesRestricted: SYSTEMS.redmarch.tradesRestricted === true,
  planetsGenerated: redPlanets === 4,
};
console.log('redmarch checks:', JSON.stringify(redChecks));
const redOk = Object.values(redChecks).every(Boolean);
console.log(`redmarch: ships=${ctx.ships.length} records=${ctx.world.records.length} prices.provisions=${ctx.world.prices.provisions.toFixed(0)} planets=${redPlanets}`);
// Jump back to veridian: arrival must be the return-pointing gate.
ctx.emit('jumpRequested', { to: 'veridian' });
tick(60 * 4, 'jump back to veridian');
const p2 = ctx.ship.object.position;
const veridianReturn = returnGate('veridian', 'redmarch').position;
const nearReturnGate = Math.hypot(p2.x - veridianReturn[0], p2.y - veridianReturn[1], p2.z - veridianReturn[2]) < 120;
console.log(`back to veridian: currentSystem=${ctx.world.currentSystem} (expect veridian) nearReturnGate (expect true): ${nearReturnGate} pos=${p2.toArray().map((v) => v.toFixed(0))}`);
if (!redOk || ctx.world.currentSystem !== 'veridian' || !nearReturnGate) {
  console.log('REDMARCH TEST FAIL');
  errors++;
}

// Park at the computed gate toward freehold for the round trip home.
ctx.ship.object.position.set(...gateToward('veridian', 'freehold').position);
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
  // Wave 5 added the Hollow Reach dockmaster; wave 10 the Hush/Verge
  // keepers: 9 entries, 6 dockmasters.
  nineEntries: w4contacts.length === 9,
  dockmasterX6: contactRoleCt('dockmaster') === 6,
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
ctx.ship.object.position.set(...gateToward('freehold', 'veridian').position);
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
// Wave 17: the random soaks can stage a real veridian wreck before this
// section. The board posts one recovery card at a time (first live wreck in
// aftermath order), so expire those soak wrecks through the real lifecycle
// before seeding the test wreck; otherwise they can occupy the card slot.
for (const entry of ctx.world.aftermath) {
  if (entry.kind === 'wreck' && entry.system === 'veridian') {
    entry.expiresAt = Math.min(entry.expiresAt, ctx.world.time);
  }
}
tick(1, 'expire soak wrecks (recovery setup)');
// Deterministic regression for the old collision: a stale offered recovery
// card must be pulled by the real board sync before aft-test can be posted.
ctx.world.aftermath.push({
  id: 'aft-collision', incidentId: 'inc-collision', kind: 'wreck',
  position: { x: -30, y: 0, z: -60 }, system: 'veridian',
  createdAt: ctx.world.time, expiresAt: ctx.world.time,
});
ctx.world.jobs.push({
  id: 'recovery-aft-collision', kind: 'recovery', wreckId: 'aft-collision',
  title: 'Recovery: wreck salvage',
  detail: 'A wreck drifts in the lanes and the yard wants its metallics back.',
  reward: 300, state: 'offered', progress: 0, need: 1,
  originSystem: 'veridian', collected: false,
});
tick(1, 'expire seeded recovery collision');
const recoveryCollisionCleared = !ctx.world.aftermath.some((a) => a.id === 'aft-collision');
ctx.world.aftermath.push({
  id: 'aft-test', incidentId: 'inc-test', kind: 'wreck',
  position: { x: 30, y: 0, z: -60 }, system: 'veridian',
  createdAt: ctx.world.time, expiresAt: ctx.world.time + 9999,
});
// Still docked at veridian on the services level: open the jobs board so
// renderJobs → syncRecoveryJob posts the card.
dispatchKey('Digit2');
const recoveryCollisionPulled = !ctx.world.jobs.some((j) => j.kind === 'recovery' && j.wreckId === 'aft-collision' && j.state === 'offered');
const recoveryJob = ctx.world.jobs.find((j) => j.kind === 'recovery' && j.wreckId === 'aft-test') ?? null;
const recoveryWasOffered = recoveryJob?.state === 'offered';
const podsAtRecoveryAccept = ctx.pods.length;
const recoveryBtn = recoveryWasOffered ? findAcceptButton('Recovery: wreck salvage') : null;
recoveryBtn?.click(); // real accept path: spawns the salvage pod at the wreck
const recoveryAcceptChecks = {
  recoveryCollisionCleared,
  recoveryCollisionPulled,
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
const homeGate = gateToward('veridian', 'freehold');
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
// -- 1. fourth-system jump: freehold → … → hollowreach (BFS-computed hops) --
// Same scripted jump pattern as wave 3 (park on the gate, emit the request,
// bounded-wait for arrival). The intermediate hops are BFS-computed over the
// merged galaxy (gates + hub routes); the final leg into hollowreach stays
// explicit — it captures 'systemLoaded' and the band-aware arrival commLine
// frame-by-frame — both fire at the jump midpoint, before ctx.gate.jumping
// clears.
undockStation(); // leave Freehold Landing (wave-4 fence dock)
while (ctx.world.currentSystem !== 'hollowreach' && nextHop(ctx.world.currentSystem, 'hollowreach') !== 'hollowreach') {
  const hop = jumpToward('hollowreach', 'wave5 chain');
  if (!hop || !tickUntilJumpDone(hop, `wave5 hop to ${hop}`)) {
    console.log(`WAVE5 CHAIN FAIL — never arrived at ${hop}`);
    errors++;
    break;
  }
}
const hrFrom = ctx.world.currentSystem; // the last intermediate system
const hrGate = gateToward(hrFrom, 'hollowreach');
const hrReturnGate = returnGate('hollowreach', hrFrom);
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
  gateDefRoundTrip: hrGate.to === 'hollowreach' && hrReturnGate.to === hrFrom,
  inZoneAtGate: hrGateInZone,
  arrived: hrArrived && ctx.world.currentSystem === 'hollowreach',
  jumpingDone: !ctx.gate.jumping,
  systemLoadedFired: hrLoadedFired,
  band2SilentLine: hrArrivalLine === 'Hollow Reach. …no traffic on scope.',
  nearReturnGate: Math.hypot(hrp.x - hrReturnGate.position[0], hrp.y - hrReturnGate.position[1], hrp.z - hrReturnGate.position[2]) < 120,
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

// Travel: post-hotfix we are in hollowreach — BFS-hop back to freehold.
travelTo('freehold', 'wave6 return');

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
// Travel: BFS-hop freehold → … → hollowreach, then the site.
travelTo('hollowreach', 'wave6 convergence');
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

// ---- Wave 7: the Hush / deepening / lineage / capstones / origin arcs / save ----
// Order respects dependencies: the deepening rung needs the wave-6 converged
// flag plus both hush clues; lineage supplies the ace defeats the Illyx
// ladder counts; the capstones need deepened + the pushed visited ids; the
// creditor arc mutates redledger rep/credits only after the capstones have
// recorded (epic stages are never revoked); the save roundtrip closes the
// run (its death-restore leaves us docked at Threshold, run over).

// -- 1. jump chain: hollowreach's SECOND gates entry reaches the Hush --------
undockStation(); // leave Hollow Anchorage (wave-6 save dock)
const hushGate = gateToward('hollowreach', 'hush');
const hushReturnGate = returnGate('hush', 'hollowreach');
ctx.ship.object.position.set(...hushGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at hush gate');
const hushGateInZone = ctx.gate.inZone === true && ctx.gate.nearTo === 'hush';
ctx.emit('jumpRequested', { to: 'hush' });
const hushArrived = tickUntilJumpDone('hush', 'wave7 jump to hush');
if (!hushArrived) { console.log('WAVE7 CHAIN FAIL — never arrived at hush'); errors++; }
const hp7 = ctx.ship.object.position;
const w7jumpChecks = {
  gateIsSecondEntry: SYSTEMS.hollowreach.gates[1] === hushGate,
  inZoneAtGate: hushGateInZone,
  arrived: hushArrived && ctx.world.currentSystem === 'hush',
  jumpingDone: !ctx.gate.jumping,
  band3: ctx.systems.hush.band === 3 && SYSTEMS.hush.band === 3,
  bandTable3: !!BANDS[3] && BANDS[3].eventGapMult > BANDS[2].eventGapMult,
  stationThreshold: ctx.station?.name === 'Threshold',
  nearArrivalGate: Math.hypot(hp7.x - hushReturnGate.position[0], hp7.y - hushReturnGate.position[1], hp7.z - hushReturnGate.position[2]) < 120, // hush return gate + arrivalOffset
};
console.log('wave7 hush jump:', JSON.stringify(w7jumpChecks));
if (!Object.values(w7jumpChecks).every(Boolean)) { console.log('WAVE7 HUSH JUMP FAIL'); errors++; }

// -- 2. deepening: 5 held clues hint, the Answer site deepens -----------------
// mystery.converged is already true (wave-6 d; no death since) and found
// holds hr_c_answer + the two pushed ids — the two hush clues bring it to
// DEEPENING.cluesNeeded via real 35u proximity discovery.
const mystery7 = ctx.world.mystery;
const deepEvs = [];
for (const clue of SYSTEMS.hush.clues) {
  ctx.ship.object.position.set(...clue.position);
  ctx.ship.velocity.set(0, 0, 0);
  for (let i = 0; i < 30 && !mystery7.found.includes(clue.id); i++) {
    tick(1, 'hush clue approach');
    deepEvs.push(...ctx.lastEvents);
  }
}
for (let i = 0; i < 3 && mystery7.deepHinted !== true; i++) {
  tick(1, 'deep hint');
  deepEvs.push(...ctx.lastEvents);
}
const clueEvs7 = deepEvs.filter((e) => e.type === 'clueFound' && (e.id === 'th_c_keeper' || e.id === 'th_c_song'));
const deepHintLine = deepEvs.find((e) => e.type === 'commLine' && e.text === DEEPENING.hintLine)?.text ?? null;
// The site: hinted, in the Hush, inside its 60u radius — fires once ever.
ctx.ship.object.position.set(...DEEPENING.site.position);
ctx.ship.velocity.set(0, 0, 0);
const deepSiteEvs = [];
for (let i = 0; i < 5; i++) {
  tick(1, 'deepening site');
  deepSiteEvs.push(...ctx.lastEvents);
}
const w7deepChecks = {
  convergedAlready: mystery7.converged === true,
  bothHushCluesFound: mystery7.found.includes('th_c_keeper') && mystery7.found.includes('th_c_song'),
  fiveCluesHeld: mystery7.found.length >= DEEPENING.cluesNeeded,
  clueEventsCarriedLines: clueEvs7.length >= 2 && clueEvs7.every((e) => typeof e.line === 'string' && e.line.length > 0),
  hintFlagSet: mystery7.deepHinted === true,
  hintLineVoiced: deepHintLine === DEEPENING.hintLine,
  deepened: mystery7.deepened === true,
  // mystery.js voices its rung milestones as EVENTS (world.milestones is
  // world.js's own fireMilestone list) — same assertion shape as wave-6
  // convergence.
  milestoneEvent: deepSiteEvs.some((e) => e.type === 'milestone' && e.id === 'deepening'),
  deepeningEvent: deepSiteEvs.some((e) => e.type === 'deepening' && e.id === DEEPENING.site.id && e.line === DEEPENING.site.line),
  songShiftEvent: deepSiteEvs.some((e) => e.type === 'songShift' && e.reason === 'deepening'),
};
console.log('wave7 deepening:', JSON.stringify(w7deepChecks), `found=${JSON.stringify(mystery7.found)}`);
if (!Object.values(w7deepChecks).every(Boolean)) { console.log('WAVE7 DEEPENING FAIL'); errors++; }

// -- 3. Named-Gun lineage: defeat, backdate the wait, successor --------------
// Test SETUP (mirrors wave-6 c): one deterministic gen-0 hunter — splice any
// existing Vane records (random soak combat could have marked one dead) and
// reset the lineage fields before re-tripping the fear threshold.
{
  const bank = ctx.world.recordBanks?.redmarch ?? [];
  for (let i = bank.length - 1; i >= 0; i--) if (bank[i].name === ACES.hunter.name) bank.splice(i, 1);
  const rivalry = (ctx.world.aceRivalry ??= { defeats: 0, lastOutcome: null, hunterSpawned: false, hunterGeneration: 0, hunterDownAt: null });
  rivalry.hunterSpawned = false;
  rivalry.hunterGeneration = 0;
  rivalry.hunterDownAt = null;
}
ctx.world.fear = Math.max(ctx.world.fear, ACES.hunter.fearThreshold);
tick(3, 'wave7 hunter spawn');
const liveVane = () => (ctx.world.recordBanks?.redmarch ?? []).find((r) => r.name === ACES.hunter.name && r.state !== 'dead') ?? null;
// Defeat an ace record through the real incident path: an 'npcDestroyed'
// event is consumed by world.js exactly like a combat kill (wave-5's
// atrocity emit uses the same mechanism).
function defeatAce(rec, label, collector) {
  ctx.emit('npcDestroyed', { ship: { id: `harness-${rec.id}`, record: rec } });
  for (let i = 0; i < 3; i++) {
    tick(1, label);
    if (collector) collector.push(...ctx.lastEvents);
  }
}
const expectVaneResolve = (gen) => 55 + ACES.hunter.lineage.resolvePerGeneration * gen;
const expectVaneBounty = (gen) => Math.round(ACES.hunter.bounty * Math.pow(ACES.hunter.lineage.bountyGrowth, gen));
const lineageEvs = [];
const vane0 = liveVane();
if (vane0) defeatAce(vane0, 'defeat vane gen0', lineageEvs);
const downAt0 = ctx.world.aceRivalry?.hunterDownAt ?? null;
// Backdate instead of sleeping: the respawn check is world.time - hunterDownAt.
ctx.world.aceRivalry.hunterDownAt = ctx.world.time - (ACES.hunter.lineage.respawnDelay + 1);
for (let i = 0; i < 3; i++) { tick(1, 'successor gen1'); lineageEvs.push(...ctx.lastEvents); }
const vane1 = liveVane();
const genAfterFirst = ctx.world.aceRivalry?.hunterGeneration;
if (vane1) defeatAce(vane1, 'defeat vane gen1', lineageEvs);
const downAt1 = ctx.world.aceRivalry?.hunterDownAt ?? null;
ctx.world.aceRivalry.hunterDownAt = ctx.world.time - (ACES.hunter.lineage.respawnDelay + 1);
for (let i = 0; i < 3; i++) { tick(1, 'successor gen2'); lineageEvs.push(...ctx.lastEvents); }
const vane2 = liveVane();
const genAfterSecond = ctx.world.aceRivalry?.hunterGeneration;
if (vane2) defeatAce(vane2, 'defeat vane gen2', lineageEvs);
const w7lineageChecks = {
  gen0Spawned: !!vane0 && vane0.bounty === ACES.hunter.bounty,
  downStamped0: downAt0 != null,
  gen1Successor: !!vane1 && vane1.resolve === expectVaneResolve(1) && vane1.bounty === expectVaneBounty(1), // 67 / 6000
  generationBumped1: genAfterFirst === 1,
  lineagePassed1: lineageEvs.some((e) => e.type === 'lineagePassed' && e.name === ACES.hunter.name && e.generation === 1),
  downStamped1: downAt1 != null,
  gen2Successor: !!vane2 && vane2.resolve === expectVaneResolve(2) && vane2.bounty === expectVaneBounty(2), // 79 / 9000
  generationBumped2: genAfterSecond === 2,
  lineagePassed2: lineageEvs.some((e) => e.type === 'lineagePassed' && e.name === ACES.hunter.name && e.generation === 2),
  lineBroken: ctx.world.milestones.includes('namedGunBroken'), // world.js fireMilestone records this one
  noFourthVane: ctx.world.aceRivalry?.hunterDownAt == null && liveVane() === null,
};
console.log('wave7 lineage:', JSON.stringify(w7lineageChecks), `defeats=${ctx.world.aceRivalry?.defeats}`);
if (!Object.values(w7lineageChecks).every(Boolean)) { console.log('WAVE7 LINEAGE FAIL'); errors++; }

// -- 4. Illyx rematch ladder: two recorded defeats re-arm him twice ----------
// The bump lives in spawnLiveShip (one bump per instantiation, written back
// to record.rematchCount/record.resolve). Test SETUP: normalize the record so
// the ladder is deterministic — random soak traffic could have instantiated
// him after an early random ace kill and banked a bump already.
const illyxRec = (ctx.world.recordBanks?.freehold ?? []).find((r) => r.name === 'Carver Illyx') ?? null;
let illyxBase = 55; // spawnLiveShip's `record.resolve ?? 55` fallback
if (illyxRec) {
  illyxRec.rematchCount = 0;
  delete illyxRec.resolve;
  if (illyxRec.state === 'dead' || illyxRec.state === 'captured') illyxRec.state = 'enroute';
  illyxBase = illyxRec.resolve ?? 55;
  const spawnPos = new THREE.Vector3(0, 0, 0);
  // The live objects never join ctx.ships (traffic owns that list) — the
  // meshes are removed immediately; only the record-side bumps matter here.
  removeLiveShip(ctx, spawnLiveShip(ctx, illyxRec, spawnPos)); // bump 1: defeats(3) > rematchCount(0)
  removeLiveShip(ctx, spawnLiveShip(ctx, illyxRec, spawnPos)); // bump 2: defeats(3) > rematchCount(1)
}
const w7illyxChecks = {
  defeatsBanked: (ctx.world.aceRivalry?.defeats ?? 0) >= 2,
  recordFound: !!illyxRec,
  rematchCount2: illyxRec?.rematchCount === 2,
  resolvePlus30: illyxRec?.resolve === Math.min(95, illyxBase + 30), // 55 + 2×15 = 85
};
console.log('wave7 illyx ladder:', JSON.stringify(w7illyxChecks), `resolve=${illyxRec?.resolve} rematches=${illyxRec?.rematchCount}`);
if (!Object.values(w7illyxChecks).every(Boolean)) { console.log('WAVE7 ILLYX LADDER FAIL'); errors++; }

// -- 5. epic capstones: the fourth stage of every faction ---------------------
// epics.js re-evaluates only when a watched value moves (rep entry, visited
// count, credit 500-bucket, deepened flag) and advances ONE stage per faction
// per frame — factions starting at 0 need four frames to reach the capstone.
ctx.world.reputation.freehold = 50; // Sworn (tier 3) — stages 1-3 already recorded (wave-6 b)
if (!ctx.world.mystery.visited.includes('th_lanes_end')) ctx.world.mystery.visited.push('th_lanes_end');
tick(3, 'freehold capstone');
const freeholdCap7 = ctx.world.epics?.freehold;
const freeholdFx7 = epicEffects(ctx, 'freehold');

ctx.world.reputation.redledger = 50;
ctx.world.credits = 8000; // capstone threshold (multiple of 500 — the watched bucket moves)
tick(6, 'redledger capstone');
const redledgerCap7 = ctx.world.epics?.redledger;

ctx.world.reputation.veridian = 50;
if (!ctx.world.mystery.visited.includes('vd_hulk_row')) ctx.world.mystery.visited.push('vd_hulk_row');
tick(6, 'veridian capstone');
const veridianCap7 = ctx.world.epics?.veridian;

tick(6, 'hollow capstone'); // deepened already true (step 2); 5 clues hold stages 1-3
const hollowCap7 = ctx.world.epics?.hollow;

const w7capstoneChecks = {
  freehold4: freeholdCap7 === 4,
  freeholdSellTotal: freeholdFx7.sellMult === 1.15, // capstone REPLACES the stage-3 1.1
  redledger4: redledgerCap7 === 4,
  redledgerBuyTotal: epicEffects(ctx, 'redledger').buyMult === 0.85, // replaces stage-2 0.9
  veridian4: veridianCap7 === 4,
  veridianRepairTotal: epicEffects(ctx, 'veridian').repairMult === 0.75, // replaces stage-2 0.85
  hollow4: hollowCap7 === 4,
  hollowRepairTotal: epicEffects(ctx, 'hollow').repairMult === 0.7, // replaces stage-3 0.8
};
console.log('wave7 epic capstones:', JSON.stringify(w7capstoneChecks), `epics=${JSON.stringify(ctx.world.epics)}`);
if (!Object.values(w7capstoneChecks).every(Boolean)) { console.log('WAVE7 EPIC CAPSTONES FAIL'); errors++; }

// -- 6. creditor arc: ledgerDebt come-due calls, the collector, the close -----
// originArc was created live by world.js long ago (the greenhand payoff
// fired back in wave-6 b); the ??= only covers an unexpected gap.
const arc7 = (ctx.world.originArc ??= {
  calls: 0, lastCallAt: 0, debtCleared: false, collectorSent: false,
  marked: false, beautiful: false, drifter: false, greenhand: false,
});
ctx.world.origin = 'ledgerDebt';
ctx.world.credits = -100;
const callStep = ORIGIN_ARCS.ledgerDebt.callInterval + 1; // 241 world-s
const credEvs = [];
const repTrack = [];
const repBeforeCalls = ctx.world.reputation.redledger;
// Call 1 fires immediately (lastCallAt starts at 0, world.time is long past
// the interval); later calls need the time jump — deterministic, no sleeps.
for (let stage = 1; stage <= ORIGIN_ARCS.ledgerDebt.maxCalls; stage++) {
  for (let i = 0; i < 2; i++) { tick(1, `creditor call ${stage}`); credEvs.push(...ctx.lastEvents); }
  repTrack.push(ctx.world.reputation.redledger);
  // Spacing guard: without the time jump no further call may arrive.
  for (let i = 0; i < 3; i++) { tick(1, `creditor spacing ${stage}`); credEvs.push(...ctx.lastEvents); }
  if (stage < ORIGIN_ARCS.ledgerDebt.maxCalls) ctx.world.time += callStep;
}
const callStages7 = credEvs.filter((e) => e.type === 'creditorCall').map((e) => e.stage);
const dresk = (ctx.world.recordBanks?.[ctx.world.currentSystem] ?? []).find((r) => r.name === ORIGIN_ARCS.ledgerDebt.collector.name) ?? null;
// Close the arc: credits back above water.
ctx.world.credits = 100;
const clearEvs = [];
for (let i = 0; i < 3; i++) { tick(1, 'debt cleared'); clearEvs.push(...ctx.lastEvents); }
const w7creditorChecks = {
  stagesArrivedSpaced: JSON.stringify(callStages7) === JSON.stringify([1, 2, 3]),
  callLinesMatch: credEvs.filter((e) => e.type === 'creditorCall')
    .every((e) => e.line === ORIGIN_ARCS.ledgerDebt.callLines[e.stage - 1]),
  repDropped3PerCall: repTrack[0] === repBeforeCalls - 3 && repTrack[1] === repBeforeCalls - 6 && repTrack[2] === repBeforeCalls - 9,
  collectorSentFlag: arc7.collectorSent === true,
  collectorInBank: !!dresk && dresk.role === 'pirate' && dresk.classKey === ORIGIN_ARCS.ledgerDebt.collector.classKey && dresk.faction === 'redledger',
  debtClearedFlag: arc7.debtCleared === true,
  debtClearedMilestone: ctx.world.milestones.includes('debtCleared'),
  clearRepBonus: ctx.world.reputation.redledger === repBeforeCalls - 9 + ORIGIN_ARCS.ledgerDebt.clearRepBonus,
  clearEventVoiced: clearEvs.some((e) => e.type === 'milestone' && e.id === 'debtCleared'),
};
console.log('wave7 creditor:', JSON.stringify(w7creditorChecks), `calls=${arc7.calls} rep.redledger=${ctx.world.reputation.redledger}`);
if (!Object.values(w7creditorChecks).every(Boolean)) { console.log('WAVE7 CREDITOR FAIL'); errors++; }

// -- 7. one-time payoff: 'marked' fires once at veridian rep >= 0 -------------
ctx.world.origin = 'marked';
ctx.world.reputation.veridian = 0; // the threshold crossing itself
const payoffEvs = [];
for (let i = 0; i < 3; i++) { tick(1, 'marked payoff'); payoffEvs.push(...ctx.lastEvents); }
const markedFires = payoffEvs.filter((e) => e.type === 'originPayoff' && e.id === 'marked');
// Re-crossing the threshold must not re-fire — the arc flag is the guard.
ctx.world.reputation.veridian = -5;
tick(2, 'marked dip');
ctx.world.reputation.veridian = 5;
const refireEvs = [];
for (let i = 0; i < 3; i++) { tick(1, 'marked re-cross'); refireEvs.push(...ctx.lastEvents); }
const w7payoffChecks = {
  firedOnce: markedFires.length === 1,
  carriesLine: markedFires[0]?.line === ORIGIN_ARCS.payoffs.marked,
  arcFlagSet: arc7.marked === true,
  noRefire: !refireEvs.some((e) => e.type === 'originPayoff' && e.id === 'marked'),
};
console.log('wave7 origin payoff:', JSON.stringify(w7payoffChecks));
if (!Object.values(w7payoffChecks).every(Boolean)) { console.log('WAVE7 ORIGIN PAYOFF FAIL'); errors++; }

// -- 8. save roundtrip: wave-7 world fields survive save AND restore ---------
// Test SETUP: park live hostiles so the dock autosave can't be combat-blocked
// (same pattern as the wave-5/wave-6 save sections — the hush pirates and the
// injected collector are live somewhere in this system).
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave7 save)');
dockAtCurrentStation('dock hush (wave7 save)'); // Threshold — 'docked' fires trySave
tick(3, 'wave7 save settle');
const w7snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const w7saveChecks = {
  saveWritten: !!w7snap?.world,
  originArcPersisted: w7snap?.world?.originArc?.debtCleared === true && w7snap?.world?.originArc?.marked === true,
  hunterGenerationPersisted: w7snap?.world?.aceRivalry?.hunterGeneration === 2,
  deepeningPersisted: w7snap?.world?.mystery?.deepHinted === true && w7snap?.world?.mystery?.deepened === true,
};
console.log('wave7 save fields:', JSON.stringify(w7saveChecks));
if (!Object.values(w7saveChecks).every(Boolean)) { console.log('WAVE7 SAVE FIELDS FAIL'); errors++; }

// Restore half of the roundtrip: corrupt the wave-7 fields in memory, die,
// recover from the dock autosave (the wave-5 death path — Enter skips the
// hold synchronously, so the asserts read post-restore state).
ctx.world.originArc = {
  calls: 0, lastCallAt: 0, debtCleared: false, collectorSent: false,
  marked: false, beautiful: false, drifter: false, greenhand: false,
};
ctx.world.aceRivalry.hunterGeneration = 0;
ctx.world.mystery = { found: [], visited: [] };
tick(2, 'wave7 fields corrupted');
const w7corrupted = ctx.world.originArc.debtCleared === false && ctx.world.mystery.found.length === 0;
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave7 restore)');
dispatchKey('Enter'); // recover(): restore(last save)
const w7restoreChecks = {
  corruptedFirst: w7corrupted,
  originArcRestored: ctx.world.originArc?.debtCleared === true && ctx.world.originArc?.marked === true,
  hunterGenerationRestored: ctx.world.aceRivalry?.hunterGeneration === 2,
  deepeningRestored: ctx.world.mystery?.deepHinted === true && ctx.world.mystery?.deepened === true,
};
console.log('wave7 restore:', JSON.stringify(w7restoreChecks));
if (!Object.values(w7restoreChecks).every(Boolean)) { console.log('WAVE7 RESTORE FAIL'); errors++; }

// ---- Wave 8: the Verge / Illyx kin lineage / repeat-debtor round / beats / save ----
// Order respects dependencies: the Verge leg leaves us in band 4 for the
// landmark and second-collector-bank checks; the Illyx lineage CONTINUES
// this run (the wave-7 ladder normalized his cast record and aceRivalry
// rode the wave-7 save/restore); the repeat-debtor round CONTINUES the
// wave-7 creditor state (same run, debtCleared already true — the origin id
// was saved as 'marked', so the arc is re-armed by flipping it back); the
// save roundtrip closes the continuing run; the two origin-beat arcs then
// boot their OWN fresh harnesses (the overlay only opens when no save
// restores, and its digit listener eats Digit1-5 until the pick — the
// wave-6 lesson — so each beat run starts from an empty store and picks
// first).

// -- 1. jump leg: the Hush's SECOND gates entry reaches the Verge -----------
undockStation(); // leave Threshold (wave-7 restore dock)
const vergeGate = gateToward('hush', 'verge');
const vergeReturnGate = returnGate('verge', 'hush');
ctx.ship.object.position.set(...vergeGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at verge gate');
const vergeGateInZone = ctx.gate.inZone === true && ctx.gate.nearTo === 'verge';
ctx.emit('jumpRequested', { to: 'verge' });
let vergeLoadedFired = false;
let vergeArrivalLine = null;
let vergeArrived = false;
for (let i = 0; i < 60 * 10 && !vergeArrived; i++) {
  tick(1, 'wave8 jump to verge');
  for (const ev of ctx.lastEvents) {
    if (ev.type === 'systemLoaded' && ev.to === 'verge') vergeLoadedFired = true;
    if (ev.type === 'commLine' && ev.from === 'gate') vergeArrivalLine = ev.text;
  }
  if (ctx.world.currentSystem === 'verge' && !ctx.gate.jumping) vergeArrived = true;
}
if (!vergeArrived) { console.log('WAVE8 CHAIN FAIL — never arrived at verge'); errors++; }
const vp8 = ctx.ship.object.position;
const w8jumpChecks = {
  gateIsSecondEntry: SYSTEMS.hush.gates[1] === vergeGate,
  inZoneAtGate: vergeGateInZone,
  arrived: vergeArrived && ctx.world.currentSystem === 'verge',
  jumpingDone: !ctx.gate.jumping,
  systemLoadedFired: vergeLoadedFired,
  band4: ctx.systems.verge.band === 4 && SYSTEMS.verge.band === 4,
  bandTable4: !!BANDS[4] && BANDS[4].eventGapMult === 5.0 && BANDS[4].chatterMult === 0.05 && BANDS[4].songGapMult === 6.0,
  band4SilentLine: vergeArrivalLine === 'The Verge. No hail. No echo of a hail. Out here even the quiet has stopped listening.',
  stationTheVigil: ctx.station?.name === 'The Vigil',
  nearArrivalGate: Math.hypot(vp8.x - vergeReturnGate.position[0], vp8.y - vergeReturnGate.position[1], vp8.z - vergeReturnGate.position[2]) < 120, // verge return gate + arrivalOffset
};
console.log('wave8 verge jump:', JSON.stringify(w8jumpChecks), `line=${JSON.stringify(vergeArrivalLine)}`);
if (!Object.values(w8jumpChecks).every(Boolean)) { console.log('WAVE8 VERGE JUMP FAIL'); errors++; }

// -- 2. Verge content: no authored clues, two proximity landmarks ------------
// The Verge is the non-verbal continuation: clues stays empty so the
// authored total across all systems holds at 6 (the convergence/deepening
// math), and its two landmarks discover by the real 100u proximity path
// (the wave-5 landmark pattern).
const vergeLandmarkEvs = [];
for (const lm of SYSTEMS.verge.landmarks) {
  ctx.ship.object.position.set(...lm.position);
  ctx.ship.velocity.set(0, 0, 0);
  for (let i = 0; i < 30 && !ctx.world.mystery.visited.includes(lm.id); i++) {
    tick(1, 'verge landmark approach');
    vergeLandmarkEvs.push(...ctx.lastEvents.filter((e) => e.type === 'landmarkFound'));
  }
}
const authoredClueTotal = Object.values(SYSTEMS).reduce((n, def) => n + (def.clues?.length ?? 0), 0);
const choirEv = vergeLandmarkEvs.find((e) => e.id === 'vg_choir_stones') ?? null;
const unfinishedEv = vergeLandmarkEvs.find((e) => e.id === 'vg_unfinished') ?? null;
const w8vergeChecks = {
  vergeCluesEmpty: SYSTEMS.verge.clues.length === 0,
  authoredCluesStill6: authoredClueTotal === 6,
  twoLandmarks: SYSTEMS.verge.landmarks.length === 2,
  choirStonesVisited: ctx.world.mystery.visited.includes('vg_choir_stones'),
  unfinishedVisited: ctx.world.mystery.visited.includes('vg_unfinished'),
  choirEventCarriesLine: choirEv?.name === 'The Choir Stones' && choirEv?.line === SYSTEMS.verge.landmarks[0].line,
  unfinishedEventCarriesLine: unfinishedEv?.name === 'The Unfinished' && unfinishedEv?.line === SYSTEMS.verge.landmarks[1].line,
};
console.log('wave8 verge content:', JSON.stringify(w8vergeChecks), `visited=${JSON.stringify(ctx.world.mystery?.visited)}`);
if (!Object.values(w8vergeChecks).every(Boolean)) { console.log('WAVE8 VERGE CONTENT FAIL'); errors++; }

// -- 3. Illyx kin lineage: defeat, backdate the wait, one successor, broken --
// CONTINUING run: the wave-7 ladder normalized the freehold cast record and
// the wave-7 save/restore carried aceRivalry forward. Test SETUP (mirrors
// the wave-7 lineage normalize): exactly one living gen-0 bearer — revive
// the cast record if random combat marked it dead, splice any duplicates,
// and reset the lineage fields before the scripted defeats.
const rivalry8 = (ctx.world.aceRivalry ??= { defeats: 0, lastOutcome: null, hunterSpawned: false, hunterGeneration: 0, hunterDownAt: null, illyxGeneration: 0, illyxDownAt: null });
rivalry8.illyxGeneration = 0;
rivalry8.illyxDownAt = null;
{
  const bank = ctx.world.recordBanks?.freehold ?? [];
  let keeper = null;
  for (let i = bank.length - 1; i >= 0; i--) {
    const r = bank[i];
    if (r.name !== ACES.illyx.name) continue;
    if (!keeper) {
      keeper = r;
      if (r.state === 'dead' || r.state === 'captured') r.state = 'enroute';
    } else {
      bank.splice(i, 1);
    }
  }
}
const liveIllyx = () => (ctx.world.recordBanks?.freehold ?? [])
  .find((r) => r.name === ACES.illyx.name && r.state !== 'dead' && r.state !== 'captured') ?? null;
const expectIllyxResolve = (gen) => 55 + ACES.illyx.lineage.resolvePerGeneration * gen;
const expectIllyxBounty = (gen) => Math.round(ACES.illyx.bounty * Math.pow(ACES.illyx.lineage.bountyGrowth, gen));
const illyxEvs = [];
const illyx0 = liveIllyx();
if (illyx0) defeatAce(illyx0, 'defeat illyx gen0', illyxEvs); // the wave-7 'npcDestroyed' path
const illyxDownAt0 = ctx.world.aceRivalry?.illyxDownAt ?? null;
// Backdate instead of sleeping: the respawn check is world.time - illyxDownAt.
ctx.world.aceRivalry.illyxDownAt = ctx.world.time - (ACES.illyx.lineage.respawnDelay + 1);
for (let i = 0; i < 3; i++) { tick(1, 'illyx successor gen1'); illyxEvs.push(...ctx.lastEvents); }
const illyx1 = liveIllyx();
const illyxGenAfterFirst = ctx.world.aceRivalry?.illyxGeneration;
if (illyx1) defeatAce(illyx1, 'defeat illyx gen1', illyxEvs);
// No third bearer: the broken line never re-stamps illyxDownAt, so a full
// respawn window spawns nothing.
ctx.world.time += ACES.illyx.lineage.respawnDelay + 10;
for (let i = 0; i < 3; i++) { tick(1, 'no third illyx'); illyxEvs.push(...ctx.lastEvents); }
const w8illyxChecks = {
  gen0Found: !!illyx0 && illyx0.bounty === ACES.illyx.bounty,
  downStamped0: illyxDownAt0 != null,
  gen1Successor: !!illyx1 && illyx1 !== illyx0 &&
    illyx1.resolve === expectIllyxResolve(1) && illyx1.bounty === expectIllyxBounty(1), // 65 / 3500
  successorFresh: illyx1?.rematchCount === 0 &&
    JSON.stringify(illyx1?.cargo) === JSON.stringify([{ commodity: 'restrictedComponents', units: 4 }]),
  generationBumped1: illyxGenAfterFirst === 1,
  lineagePassed1: illyxEvs.some((e) => e.type === 'lineagePassed' && e.name === ACES.illyx.name && e.generation === 1),
  lineBroken: ctx.world.milestones.includes('illyxLineBroken'),
  lineBrokenEvent: illyxEvs.some((e) => e.type === 'milestone' && e.id === 'illyxLineBroken'),
  downClearedAfterBreak: ctx.world.aceRivalry?.illyxDownAt == null,
  noThirdIllyx: liveIllyx() === null && !illyxEvs.some((e) => e.type === 'lineagePassed' && e.generation === 2),
};
console.log('wave8 illyx lineage:', JSON.stringify(w8illyxChecks), `gen=${ctx.world.aceRivalry?.illyxGeneration}`);
if (!Object.values(w8illyxChecks).every(Boolean)) { console.log('WAVE8 ILLYX LINEAGE FAIL'); errors++; }

// -- 4. repeat-debtor round: the Ledger re-arms once, colder ------------------
// CONTINUES the wave-7 creditor state: same run, debtCleared already true
// (the wave-7 restore carried the arc forward). The saved origin id is
// 'marked' (wave-7 section 7) — flip it back to re-arm the ledger arc.
ctx.world.origin = 'ledgerDebt';
const arc8 = ctx.world.originArc;
const r2 = ORIGIN_ARCS.ledgerDebt.round2;
ctx.world.credits = -100;
const r2Evs = [];
const repTrack2 = [];
const repBeforeRound2 = ctx.world.reputation.redledger;
// Call 4 fires immediately (lastCallAt2 starts at 0, world.time is long past
// the interval); call 5 needs the time jump — deterministic, no sleeps.
for (let stage = 4; stage <= 3 + r2.maxCalls; stage++) {
  for (let i = 0; i < 2; i++) { tick(1, `round2 call ${stage}`); r2Evs.push(...ctx.lastEvents); }
  repTrack2.push(ctx.world.reputation.redledger);
  // Spacing guard: without the time jump no further call may arrive.
  for (let i = 0; i < 3; i++) { tick(1, `round2 spacing ${stage}`); r2Evs.push(...ctx.lastEvents); }
  if (stage < 3 + r2.maxCalls) ctx.world.time += r2.callInterval + 1;
}
const callStages8 = r2Evs.filter((e) => e.type === 'creditorCall').map((e) => e.stage);
const dreskHere = (ctx.world.recordBanks?.[ctx.world.currentSystem] ?? [])
  .filter((r) => r.name === ORIGIN_ARCS.ledgerDebt.collector.name);
const dreskTotal = Object.values(ctx.world.recordBanks ?? {}).reduce(
  (n, bank) => n + bank.filter((r) => r.name === ORIGIN_ARCS.ledgerDebt.collector.name).length, 0);
const whisperRound2 = r2Evs.find((e) => e.type === 'commLine' && e.from === 'Whisper' && /Dresk kept your vector/.test(e.text ?? '')) ?? null;
// Close the round: credits back above water.
ctx.world.credits = 100;
const clear2Evs = [];
for (let i = 0; i < 3; i++) { tick(1, 'debt cleared again'); clear2Evs.push(...ctx.lastEvents); }
// No third round: dip negative again, wait a full interval — nothing comes.
ctx.world.credits = -50;
ctx.world.time += r2.callInterval + 1;
const thirdRoundEvs = [];
for (let i = 0; i < 5; i++) { tick(1, 'no third round'); thirdRoundEvs.push(...ctx.lastEvents); }
ctx.world.credits = 100;
tick(2, 'round2 settle');
const w8creditorChecks = {
  reenteredDebtFlag: arc8.reenteredDebt === true,
  stagesArrivedSpaced: JSON.stringify(callStages8) === JSON.stringify([4, 5]),
  round2LinesMatch: r2Evs.filter((e) => e.type === 'creditorCall')
    .every((e) => e.line === r2.callLines[e.stage - 4]),
  repDropped5PerCall: repTrack2[0] === repBeforeRound2 - 5 && repTrack2[1] === repBeforeRound2 - 10,
  collectorSent2Flag: arc8.collectorSent2 === true,
  secondDreskInVerge: dreskHere.length === 1 && dreskHere[0].role === 'pirate' && dreskHere[0].faction === 'redledger',
  dreskTotalTwo: dreskTotal === 2, // wave-7's Dresk (the Hush bank) + this one
  whisperVoiced: !!whisperRound2,
  debtClearedAgainFlag: arc8.debtClearedAgain === true,
  debtClearedAgainMilestone: ctx.world.milestones.includes('debtClearedAgain') &&
    clear2Evs.some((e) => e.type === 'milestone' && e.id === 'debtClearedAgain'),
  clearRepBonus5: ctx.world.reputation.redledger === repBeforeRound2 - 10 + r2.clearRepBonus,
  noThirdRound: !thirdRoundEvs.some((e) => e.type === 'creditorCall'),
};
console.log('wave8 repeat debtor:', JSON.stringify(w8creditorChecks), `calls2=${arc8.calls2} rep.redledger=${ctx.world.reputation.redledger}`);
if (!Object.values(w8creditorChecks).every(Boolean)) { console.log('WAVE8 REPEAT DEBTOR FAIL'); errors++; }

// -- 5. save roundtrip: wave-8 world fields survive save AND restore ---------
// Test SETUP: park live hostiles so the dock autosave can't be combat-blocked
// (same pattern as the wave-5/6/7 save sections — Dresk's second record and
// the verge pirate are live somewhere in this system).
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave8 save)');
dockAtCurrentStation('dock verge (wave8 save)'); // The Vigil — 'docked' fires trySave
tick(3, 'wave8 save settle');
const w8snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const w8saveChecks = {
  saveWritten: !!w8snap?.world,
  systemIsVerge: w8snap?.world?.currentSystem === 'verge',
  round2Persisted: w8snap?.world?.originArc?.debtClearedAgain === true && w8snap?.world?.originArc?.calls2 === 2,
  illyxGenerationPersisted: w8snap?.world?.aceRivalry?.illyxGeneration === 1,
};
console.log('wave8 save fields:', JSON.stringify(w8saveChecks));
if (!Object.values(w8saveChecks).every(Boolean)) { console.log('WAVE8 SAVE FIELDS FAIL'); errors++; }

// Restore half (the wave-7 pattern): corrupt the wave-8 fields in memory,
// die, recover from the dock autosave. Credits stay negative and lastCallAt2
// pins to now, so the corrupted arc can neither re-close nor re-call in the
// two frames before the restore reads.
ctx.world.originArc.debtClearedAgain = false;
ctx.world.originArc.calls2 = 0;
ctx.world.originArc.lastCallAt2 = ctx.world.time;
ctx.world.credits = -50;
ctx.world.aceRivalry.illyxGeneration = 0;
tick(2, 'wave8 fields corrupted');
const w8corrupted = ctx.world.originArc.debtClearedAgain === false && ctx.world.aceRivalry.illyxGeneration === 0;
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave8 restore)');
dispatchKey('Enter'); // recover(): restore(last save)
const w8restoreChecks = {
  corruptedFirst: w8corrupted,
  round2Restored: ctx.world.originArc?.debtClearedAgain === true && ctx.world.originArc?.calls2 === 2,
  illyxGenerationRestored: ctx.world.aceRivalry?.illyxGeneration === 1,
};
console.log('wave8 restore:', JSON.stringify(w8restoreChecks));
if (!Object.values(w8restoreChecks).every(Boolean)) { console.log('WAVE8 RESTORE FAIL'); errors++; }

// -- 6/7. origin beats: each arc boots its OWN fresh harness ------------------
// Same wiring as the top-of-file boot. The store must be empty first —
// save.js's boot-time load would otherwise restore the continuing run and
// origins.js would stay inert (no overlay, no pick). The main run's window
// listeners share the window with these boots; its docked/paused flags gate
// every one of them, so unpin both now that the continuing run is over.
ctx.flags.docked = false;
ctx.flags.paused = false;
function bootFreshHarness(label) {
  store.delete('rimward-save-v1');
  const sceneN = new THREE.Scene();
  const cameraN = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const rendererN = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
  const ctxN = createCtx({ scene: sceneN, camera: cameraN, renderer: rendererN });
  ctxN.systems = SYSTEMS; // mirrors main.js boot line
  const systemsN = [];
  for (const [name, init] of inits) {
    try {
      systemsN.push([name, init(ctxN)]);
      console.log(`INIT OK   ${name} (${label})`);
    } catch (e) {
      console.log(`INIT FAIL ${name} (${label}): ${e.message}`);
      errors++;
    }
  }
  const tickN = (n, tickLabel) => {
    for (let i = 0; i < n; i++) {
      frame++;
      ctxN.elapsed += dt;
      ctxN.world.time += dt;
      try {
        for (const [name, s] of systemsN) s?.update?.(dt, ctxN);
      } catch (e) {
        errors++;
        if (errors <= 5) console.log(`UPDATE ERR frame ${frame} (${tickLabel}): ${e.message}\n${e.stack?.split('\n')[1]?.trim() ?? ''}`);
      }
      ctxN.lastEvents = ctxN.events;
      ctxN.events = [];
    }
  };
  return { ctx: ctxN, tick: tickN };
}

// -- 6. beautiful: growth 0.4 / 0.75 / 1.0 — two beats, then the payoff -------
const beautifulBoot = bootFreshHarness('beautiful');
const bctx = beautifulBoot.ctx;
const btick = beautifulBoot.tick;
const bOverlayShown = [...walkDom(document.body)]
  .some((n) => typeof n.textContent === 'string' && n.textContent.toLowerCase().includes('who are you'));
dispatchKey('Digit4'); // [4] Beautiful Ones Initiate
const bOriginEv = bctx.events.find((e) => e.type === 'originChosen') ?? null; // emit is synchronous
// Same hull pin as the main run: random soak combat must not kill the fresh
// pilot mid-section (the death overlay would eat later digit dispatches).
bctx.player.hullMax = 1e9;
bctx.player.hull = 1e9;
const bEvs = [];
// growth is re-derived every bio.update as bond*0.7 + fedCount*0.05 (the
// wave-5 lesson: set the sim inputs, never ctx.bio.growth directly).
bctx.bio.bond = 0.5; bctx.bio.fedCount = 1; // growth 0.40
for (let i = 0; i < 3; i++) { btick(1, 'beautiful beat1'); bEvs.push(...bctx.lastEvents); }
for (let i = 0; i < 30; i++) { btick(1, 'beautiful beat1 refire watch'); bEvs.push(...bctx.lastEvents); }
bctx.bio.bond = 1; bctx.bio.fedCount = 1; // growth 0.75
for (let i = 0; i < 3; i++) { btick(1, 'beautiful beat2'); bEvs.push(...bctx.lastEvents); }
bctx.bio.bond = 1; bctx.bio.fedCount = 6; // growth 1.00
for (let i = 0; i < 3; i++) { btick(1, 'beautiful payoff'); bEvs.push(...bctx.lastEvents); }
for (let i = 0; i < 10; i++) { btick(1, 'beautiful payoff refire watch'); bEvs.push(...bctx.lastEvents); }
const bBeat1 = bEvs.filter((e) => e.type === 'originBeat' && e.id === 'beautiful1');
const bBeat2 = bEvs.filter((e) => e.type === 'originBeat' && e.id === 'beautiful2');
const bPayoff = bEvs.filter((e) => e.type === 'originPayoff' && e.id === 'beautiful');
const w8beautifulChecks = {
  overlayShown: bOverlayShown,
  originRecorded: bctx.world.origin === 'beautiful',
  originChosenEmitted: bOriginEv?.id === 'beautiful',
  growthReachedFull: bctx.bio.growth >= 1,
  beat1Once: bBeat1.length === 1,
  beat1Line: bBeat1[0]?.line === ORIGIN_ARCS.beats.beautiful[0].line,
  beat2Once: bBeat2.length === 1,
  beat2Line: bBeat2[0]?.line === ORIGIN_ARCS.beats.beautiful[1].line,
  payoffOnce: bPayoff.length === 1,
  payoffLine: bPayoff[0]?.line === ORIGIN_ARCS.payoffs.beautiful,
  arcFlags: bctx.world.originArc?.beautiful1 === true &&
    bctx.world.originArc?.beautiful2 === true && bctx.world.originArc?.beautiful === true,
};
console.log('wave8 beautiful beats:', JSON.stringify(w8beautifulChecks));
if (!Object.values(w8beautifulChecks).every(Boolean)) { console.log('WAVE8 BEAUTIFUL BEATS FAIL'); errors++; }

// -- 7. marked: fear 25 at negative rep, rep -5, rep 0 — beats then payoff ----
const markedBoot = bootFreshHarness('marked');
const mctx = markedBoot.ctx;
const mtick = markedBoot.tick;
const mOverlayShown = [...walkDom(document.body)]
  .some((n) => typeof n.textContent === 'string' && n.textContent.toLowerCase().includes('who are you'));
dispatchKey('Digit3'); // [3] Marked
const mOriginEv = mctx.events.find((e) => e.type === 'originChosen') ?? null;
mctx.player.hullMax = 1e9;
mctx.player.hull = 1e9;
// Beat 1 needs fear >= 25 while veridian rep is still negative — set BOTH
// before the first tick: marked's effects leave fear 15 / veridian -15, and
// at the fresh-boot defaults marked2 (rep >= -5) and the payoff (rep >= 0)
// would fire ahead of it.
mctx.world.fear = 25;
mctx.world.reputation.veridian = -10;
const mEvs = [];
for (let i = 0; i < 3; i++) { mtick(1, 'marked beat1'); mEvs.push(...mctx.lastEvents); }
for (let i = 0; i < 30; i++) { mtick(1, 'marked beat1 refire watch'); mEvs.push(...mctx.lastEvents); }
mctx.world.reputation.veridian = -5;
for (let i = 0; i < 3; i++) { mtick(1, 'marked beat2'); mEvs.push(...mctx.lastEvents); }
mctx.world.reputation.veridian = 0; // the threshold crossing itself
for (let i = 0; i < 3; i++) { mtick(1, 'marked payoff'); mEvs.push(...mctx.lastEvents); }
for (let i = 0; i < 10; i++) { mtick(1, 'marked payoff refire watch'); mEvs.push(...mctx.lastEvents); }
const mBeat1 = mEvs.filter((e) => e.type === 'originBeat' && e.id === 'marked1');
const mBeat2 = mEvs.filter((e) => e.type === 'originBeat' && e.id === 'marked2');
const mPayoff = mEvs.filter((e) => e.type === 'originPayoff' && e.id === 'marked');
const w8markedChecks = {
  overlayShown: mOverlayShown,
  originRecorded: mctx.world.origin === 'marked',
  originChosenEmitted: mOriginEv?.id === 'marked',
  beat1Once: mBeat1.length === 1,
  beat1Line: mBeat1[0]?.line === ORIGIN_ARCS.beats.marked[0].line,
  beat2Once: mBeat2.length === 1,
  beat2Line: mBeat2[0]?.line === ORIGIN_ARCS.beats.marked[1].line,
  payoffOnce: mPayoff.length === 1,
  payoffLine: mPayoff[0]?.line === ORIGIN_ARCS.payoffs.marked,
  arcFlags: mctx.world.originArc?.marked1 === true &&
    mctx.world.originArc?.marked2 === true && mctx.world.originArc?.marked === true,
};
console.log('wave8 marked beats:', JSON.stringify(w8markedChecks));
if (!Object.values(w8markedChecks).every(Boolean)) { console.log('WAVE8 MARKED BEATS FAIL'); errors++; }

// ---- Wave 9: rimWithoutGuns / greenhand+drifter beats / hermit economy / save ----
// Order respects dependencies: A runs on the continuing run (post-wave-8, in
// the Verge — both broken-line milestones already stand, so the wave-9
// world.js check has fired the rim's reaction during this run); B and C boot
// their OWN fresh harnesses (the wave-8 lesson: the origin overlay's digit
// listener eats Digit1-5 until the pick, so each arc starts from an empty
// store and picks first); D returns to the main run for the hermit market,
// the walk-rate comparison leg to the Hush, and the closing save roundtrip.

// -- A. rimWithoutGuns: one milestone, one fear bump, pirates yield sooner ----
const w9ms = ctx.world.milestones;
const alreadyWithoutGuns = w9ms.includes('rimWithoutGuns');
// Deterministic refire: pull the milestone, let world.js's per-frame check
// re-fire it; fireMilestone's guard then holds it at exactly one.
const fearBeforeRefire = ctx.world.fear;
const idxWithoutGuns = w9ms.indexOf('rimWithoutGuns');
if (idxWithoutGuns >= 0) w9ms.splice(idxWithoutGuns, 1);
const w9aEvs = [];
for (let i = 0; i < 3; i++) { tick(1, 'wave9 rimWithoutGuns refire'); w9aEvs.push(...ctx.lastEvents); }
const w9RefireEvs = w9aEvs.filter((e) => e.type === 'milestone' && e.id === 'rimWithoutGuns');
const fearAfterRefire = ctx.world.fear;
for (let i = 0; i < 30; i++) { tick(1, 'wave9 rimWithoutGuns refire watch'); w9aEvs.push(...ctx.lastEvents); }
const refireTotal = w9aEvs.filter((e) => e.type === 'milestone' && e.id === 'rimWithoutGuns').length;

// Pirate resolve delta: same inputs, milestone present vs spliced. Test
// SETUP: re-pin the player huge (hull AND shields — playerFrac is a resolve
// input, and a hunting pirate's shots must not move it), and pin the
// pirate's personality mid-scale so computeResolve's 0..100 clamp and the
// capitulate transition can't eat the ±5 mod mid-measurement.
if (ctx.flags.docked) undockStation();
ctx.player.hullMax = 1e9; ctx.player.hull = 1e9;
ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
const isPirateShip = (s) => s.role === 'pirate' || s.record?.role === 'pirate' || s.ai?.role === 'pirate';
let vergePirate = ctx.ships.find(isPirateShip) ?? null;
if (!vergePirate) {
  // Not instantiated (parked hostiles de-instantiate past range) — teleport
  // to the record's position and let traffic spawn it (the Verge cast has
  // exactly one pirate).
  const pirateRec = ctx.world.records.find((r) => r.role === 'pirate') ?? null;
  if (pirateRec) {
    const rp9 = recordPosition(pirateRec, new THREE.Vector3());
    ctx.ship.object.position.set(rp9.x, rp9.y, rp9.z);
    ctx.ship.velocity.set(0, 0, 0);
    for (let i = 0; i < 90 && !vergePirate; i++) {
      tick(1, 'wave9 instantiate verge pirate');
      vergePirate = ctx.ships.find(isPirateShip) ?? null;
    }
  }
}
let resolveWith = NaN;
let resolveWithout = NaN;
let withoutGunsRestored = false;
if (vergePirate) {
  // Away from the Vigil's law zone so updateHunt keeps intent hot.
  vergePirate.object.position.set(3000, 3000, 3000);
  ctx.ship.object.position.set(3000, 3000, 3000);
  ctx.ship.velocity.set(0, 0, 0);
  vergePirate.state.personality = 10;
  vergePirate.ai.mode = 'hunt';
  vergePirate.ai.intent = true;
  vergePirate.ai.calmUntil = 0;
  // updateResolve is throttled by RESOLVE_INTERVAL (ai.resolveAt) — force a
  // recompute on the next frame so each measurement reads a fresh value.
  vergePirate.ai.resolveAt = 0;
  tick(1, 'wave9 resolve with milestone');
  resolveWith = vergePirate.state.resolve;
  // Splice BOTH: removing only rimWithoutGuns would let world.js refire it
  // next frame, re-adding the mod (and the fear bump) mid-measurement.
  const iR = w9ms.indexOf('rimWithoutGuns');
  if (iR >= 0) w9ms.splice(iR, 1);
  const iI = w9ms.indexOf('illyxLineBroken');
  if (iI >= 0) w9ms.splice(iI, 1);
  vergePirate.ai.intent = true; // updateHunt re-derives intent every frame
  vergePirate.ai.resolveAt = 0;
  tick(1, 'wave9 resolve without milestone');
  resolveWithout = vergePirate.state.resolve;
  w9ms.push('illyxLineBroken', 'rimWithoutGuns');
  tick(1, 'wave9 milestones restored');
  withoutGunsRestored = ctx.world.milestones.includes('rimWithoutGuns');
}
const w9gunsChecks = {
  milestoneFiredInRun: alreadyWithoutGuns,
  refiredOnce: w9RefireEvs.length === 1,
  fearBumpExact: fearAfterRefire - fearBeforeRefire === NAMED_GUNS.fearBonus,
  noSecondRefire: refireTotal === 1,
  pirateFound: !!vergePirate,
  resolveDeltaExact: Math.abs((resolveWithout - resolveWith) - (-NAMED_GUNS.brokenResolveMod)) <= 0.001,
  milestoneRestored: withoutGunsRestored,
};
console.log('wave9 rimWithoutGuns:', JSON.stringify(w9gunsChecks), `resolve=${resolveWith}→${resolveWithout} fear=${ctx.world.fear}`);
if (!Object.values(w9gunsChecks).every(Boolean)) { console.log('WAVE9 RIMWITHOUTGUNS FAIL'); errors++; }

// -- B. greenhand beats: |rep| 10, rep 25, then the payoff — FRESH harness ---
const greenBoot = bootFreshHarness('greenhand');
const gctx = greenBoot.ctx;
const gtick = greenBoot.tick;
const gOverlayShown = [...walkDom(document.body)]
  .some((n) => typeof n.textContent === 'string' && n.textContent.toLowerCase().includes('who are you'));
dispatchKey('Digit1'); // [1] Freehold Greenhand (ORIGINS key order)
const gOriginEv = gctx.events.find((e) => e.type === 'originChosen') ?? null; // emit is synchronous
// Same hull pin as the other boots: random combat must not kill the fresh
// pilot mid-section (the death overlay would eat later digit dispatches).
gctx.player.hullMax = 1e9;
gctx.player.hull = 1e9;
const gEvs = [];
gctx.world.reputation.freehold = 10; // the rim first learns the name
for (let i = 0; i < 3; i++) { gtick(1, 'greenhand beat1'); gEvs.push(...gctx.lastEvents); }
for (let i = 0; i < 30; i++) { gtick(1, 'greenhand beat1 refire watch'); gEvs.push(...gctx.lastEvents); }
gctx.world.reputation.freehold = 25; // a berth becomes yours
for (let i = 0; i < 3; i++) { gtick(1, 'greenhand beat2'); gEvs.push(...gctx.lastEvents); }
for (let i = 0; i < 30; i++) { gtick(1, 'greenhand beat2 refire watch'); gEvs.push(...gctx.lastEvents); }
gctx.world.epics = { freehold: 1 }; // any achieved epic stage closes the arc
for (let i = 0; i < 3; i++) { gtick(1, 'greenhand payoff'); gEvs.push(...gctx.lastEvents); }
for (let i = 0; i < 10; i++) { gtick(1, 'greenhand payoff refire watch'); gEvs.push(...gctx.lastEvents); }
const gBeat1 = gEvs.filter((e) => e.type === 'originBeat' && e.id === 'greenhand1');
const gBeat2 = gEvs.filter((e) => e.type === 'originBeat' && e.id === 'greenhand2');
const gPayoff = gEvs.filter((e) => e.type === 'originPayoff' && e.id === 'greenhand');
const w9greenChecks = {
  overlayShown: gOverlayShown,
  originRecorded: gctx.world.origin === 'greenhand',
  originChosenEmitted: gOriginEv?.id === 'greenhand',
  beat1Once: gBeat1.length === 1,
  beat1Line: gBeat1[0]?.line === ORIGIN_ARCS.beats.greenhand[0].line,
  beat2Once: gBeat2.length === 1,
  beat2Line: gBeat2[0]?.line === ORIGIN_ARCS.beats.greenhand[1].line,
  payoffOnce: gPayoff.length === 1,
  payoffLine: gPayoff[0]?.line === ORIGIN_ARCS.payoffs.greenhand,
  arcFlags: gctx.world.originArc?.greenhand1 === true &&
    gctx.world.originArc?.greenhand2 === true && gctx.world.originArc?.greenhand === true,
};
console.log('wave9 greenhand beats:', JSON.stringify(w9greenChecks));
if (!Object.values(w9greenChecks).every(Boolean)) { console.log('WAVE9 GREENHAND BEATS FAIL'); errors++; }

// -- C. drifter beats: the granted tally, a second clue, the hint, the payoff —
const driftBoot = bootFreshHarness('drifter');
const dctx = driftBoot.ctx;
const dtick = driftBoot.tick;
const dOverlayShown = [...walkDom(document.body)]
  .some((n) => typeof n.textContent === 'string' && n.textContent.toLowerCase().includes('who are you'));
dispatchKey('Digit5'); // [5] Rim Drifter (ORIGINS key order: greenhand, ledgerDebt, marked, beautiful, drifter)
const dOriginEv = dctx.events.find((e) => e.type === 'originChosen') ?? null;
dctx.player.hullMax = 1e9;
dctx.player.hull = 1e9;
// The pick's applyEffects grants rm_c_tally through the real origins.js path.
const grantedTally = (dctx.world.mystery?.found ?? []).includes('rm_c_tally');
const dEvs = [];
const dmystery = dctx.world.mystery;
// Second held clue (the wave-6 d test-SETUP pattern) — drifter1 needs two.
if (!dmystery.found.includes('vd_c_shanty')) dmystery.found.push('vd_c_shanty');
for (let i = 0; i < 3; i++) { dtick(1, 'drifter beat1'); dEvs.push(...dctx.lastEvents); }
for (let i = 0; i < 30; i++) { dtick(1, 'drifter beat1 refire watch'); dEvs.push(...dctx.lastEvents); }
dmystery.convergeHinted = true;
for (let i = 0; i < 3; i++) { dtick(1, 'drifter beat2'); dEvs.push(...dctx.lastEvents); }
dmystery.converged = true;
for (let i = 0; i < 3; i++) { dtick(1, 'drifter payoff'); dEvs.push(...dctx.lastEvents); }
for (let i = 0; i < 10; i++) { dtick(1, 'drifter payoff refire watch'); dEvs.push(...dctx.lastEvents); }
const dBeat1 = dEvs.filter((e) => e.type === 'originBeat' && e.id === 'drifter1');
const dBeat2 = dEvs.filter((e) => e.type === 'originBeat' && e.id === 'drifter2');
const dPayoff = dEvs.filter((e) => e.type === 'originPayoff' && e.id === 'drifter');
const w9driftChecks = {
  overlayShown: dOverlayShown,
  originRecorded: dctx.world.origin === 'drifter',
  originChosenEmitted: dOriginEv?.id === 'drifter',
  grantedTally,
  beat1Once: dBeat1.length === 1,
  beat1Line: dBeat1[0]?.line === ORIGIN_ARCS.beats.drifter[0].line,
  beat2Once: dBeat2.length === 1,
  beat2Line: dBeat2[0]?.line === ORIGIN_ARCS.beats.drifter[1].line,
  payoffOnce: dPayoff.length === 1,
  payoffLine: dPayoff[0]?.line === ORIGIN_ARCS.payoffs.drifter,
  arcFlags: dctx.world.originArc?.drifter1 === true &&
    dctx.world.originArc?.drifter2 === true && dctx.world.originArc?.drifter === true,
};
console.log('wave9 drifter beats:', JSON.stringify(w9driftChecks));
if (!Object.values(w9driftChecks).every(Boolean)) { console.log('WAVE9 DRIFTER BEATS FAIL'); errors++; }

// -- D. hermit economy: scarcity pricing, first-trade milestone, slow walk ----
// Back on the main run, still in the Verge from subsection A.
const w9hermitDataChecks = {
  vergeIsHermit: SYSTEMS.verge.hermit === true,
  walkMult: HERMIT.walkMult === 0.25,
  buyMult: HERMIT.buyMult === 1.25,
  sellMult: HERMIT.sellMult === 1.25,
};
console.log('wave9 hermit data:', JSON.stringify(w9hermitDataChecks));
if (!Object.values(w9hermitDataChecks).every(Boolean)) { console.log('WAVE9 HERMIT DATA FAIL'); errors++; }

// Real trades at The Vigil, driven through the real market UI (the wave-4
// pattern: service selection via window keydown digits, trades via stub-DOM
// button clicks). Test SETUP: keep the purse comfortably positive so the
// scarcity prices can't bounce a trade and no creditor bookkeeping can stir.
ctx.world.credits = 5000;
dockAtCurrentStation('dock verge (wave9 hermit)');
dispatchKey('Digit1'); // market (DOCK_KEY_SERVICES[0])
// The market table is a flat child list: 5 head cells, then 5 cells per
// commodity row (name, status, price, hold, actions).
function marketRowCell(comName, offset) {
  const ov = stationOverlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (typeof n.textContent === 'string' && n.textContent === comName &&
      typeof n.className === 'string' && n.className.includes('market-cell') && n.parent) {
      const kids = n.parent.children ?? [];
      const idx = kids.indexOf(n);
      if (idx >= 0 && kids.length > idx + offset) return kids[idx + offset];
    }
  }
  return null;
}
function marketTradeButton(comName, label) {
  const cell = marketRowCell(comName, 4);
  if (!cell) return null;
  for (const b of walkDom(cell)) {
    if (b.tagName === 'BUTTON' && b.textContent === label) return b;
  }
  return null;
}
const hollowFx9 = () => epicEffects(ctx, 'hollow'); // The Vigil flies the hollow flag
const goodwill9 = () => {
  const t = rankFor(ctx.world.reputation.hollow ?? 0).tier; // sell-only goodwill, computed station.js's way
  return t > 0 ? 1 + 0.02 * t : 1;
};
const priceCell9 = marketRowCell('Provisions', 2);
const expectedBuy9 = Math.round(ctx.world.prices.provisions * (hollowFx9().buyMult ?? 1) * HERMIT.buyMult);
const creditsBeforeBuy9 = ctx.world.credits;
const buyBtn9 = marketTradeButton('Provisions', '+1');
buyBtn9?.click(); // real path: stub-DOM click → tryTrade('provisions', 1, true)
const buyCharged9 = creditsBeforeBuy9 - ctx.world.credits;
tick(1, 'wave9 hermit buy settle'); // the milestone event rides this frame's lastEvents
const hermitMilestoneEvs = ctx.lastEvents.filter((e) => e.type === 'milestone' && e.id === 'hermitMarket');
// Second buy: charged the same way, but the milestone must NOT re-fire.
const expectedBuy9b = Math.round(ctx.world.prices.provisions * (hollowFx9().buyMult ?? 1) * HERMIT.buyMult);
const creditsBeforeBuy9b = ctx.world.credits;
const buyBtn9b = marketTradeButton('Provisions', '+1');
buyBtn9b?.click();
const buyCharged9b = creditsBeforeBuy9b - ctx.world.credits;
tick(1, 'wave9 hermit second buy settle');
const secondHermitMilestone = ctx.lastEvents.some((e) => e.type === 'milestone' && e.id === 'hermitMarket');
// Sell one back: epic sellMult × rank goodwill × the hermit premium.
const expectedPayout9 = Math.round(ctx.world.prices.provisions * (hollowFx9().sellMult ?? 1) * goodwill9() * HERMIT.sellMult * 1);
const creditsBeforeSell9 = ctx.world.credits;
const sellBtn9 = marketTradeButton('Provisions', '−1');
sellBtn9?.click();
const sellPaid9 = ctx.world.credits - creditsBeforeSell9;
const w9hermitTradeChecks = {
  priceCellShowsHermitBuy: priceCell9?.textContent === `${expectedBuy9} UU`,
  buyButtonFound: !!buyBtn9,
  buyChargedExact: buyCharged9 === expectedBuy9,
  milestoneOnce: hermitMilestoneEvs.length === 1 && hermitMilestoneEvs[0]?.line === HERMIT.line,
  milestoneBanked: ctx.world.milestones.includes('hermitMarket'),
  secondBuyButtonFound: !!buyBtn9b,
  secondBuyChargedExact: buyCharged9b === expectedBuy9b,
  noSecondMilestone: !secondHermitMilestone,
  sellButtonFound: !!sellBtn9,
  sellPaidExact: sellPaid9 === expectedPayout9,
};
console.log('wave9 hermit trades:', JSON.stringify(w9hermitTradeChecks), `buy=${buyCharged9} sell=${sellPaid9}`);
if (!Object.values(w9hermitTradeChecks).every(Boolean)) { console.log('WAVE9 HERMIT TRADES FAIL'); errors++; }

// Walk rate: pinned Math.random turns the random walk into a deterministic
// upward ramp; a hermit system's ramp runs at HERMIT.walkMult of any other.
// Guard: an active event's pressure pull would pollute the ramp — end any
// active/due event through the real endEvent path (which clears the
// pressure), and retry once if one starts mid-window.
undockStation();
const origRandom9 = Math.random;
let driftV = NaN;
let driftH = NaN;
try {
  Math.random = () => 0.9;
  const measureDrift9 = (label, ticksN, preDrag) => {
    // Three attempts: a mid-window OR mid-drag event consumes one retry, and
    // two consecutive event hits must still leave a clean measurement.
    for (let attempt = 0; attempt < 3; attempt++) {
      tick(1, `${label} pre-check`); // a due event starts on THIS tick, not mid-window
      if (ctx.world.activeEvent) {
        ctx.world.activeEvent.endsAt = ctx.world.time - 1; // real endEvent → applyEventPressure('clear')
        tick(2, `${label} event cleared`);
      }
      if (ctx.world.activeEvent) continue;
      // Residual-deviation flake (wave-20): ending an event through the real
      // endEvent path zeroes its pressure TARGET but not the fractional dev
      // the pressure already built up, and PRESSURE_PULL 0.06/s decays that
      // leftover slowly (dt = 1/60 per world tick → ~0.1%/tick), so dev
      // inherited from soak history or from an event that ran inside an
      // earlier window survives the 600-tick preDrag ((1 − 0.001)^600 ≈ 0.55
      // of it remains) and shifts the p0 sample — compressing or inverting
      // the pinned ramp (observed: driftV=4 vs driftH=5, or driftH going
      // negative). (The later driftH=9 residual had a different root cause:
      // a cross-system event-pressure LEAK pinning hush at the −PRICE_BAND
      // clamp — fixed in world.js/market.js; this settle stays as hygiene.) Normalize dev to ~0 BEFORE the preDrag so the drag — and
      // therefore the p0/p1 window — starts from harness-pinned state, not
      // prior walk history: 300 price-only tickPrices(ctx, 0.5) calls shrink
      // any dev by (1 − 0.06×0.5)^300 ≈ 10^4×. Price-only is safe here: no
      // world ticks means world time never advances, so no event can start
      // mid-settle and traffic/migration/cast counts are untouched (same
      // 300 × 0.5 s pattern as the wave-2 settlePrices helper; its pre-check
      // tick and event clear are already done by this retry loop, so only
      // the decay loop is inlined).
      // Math.random: tickPrices' walk term uses Math.random, and under the
      // ambient 0.9 pin its expectation is positive — 300 pinned-upward
      // calls would equilibrate dev at ≈ +0.107 × walkMult (walk step
      // 0.0032×walkMult vs pull 0.03×dev per call), not ~0. Pin 0.5 for the
      // settle so the walk's expectation is exactly zero and the pull does
      // all the decay work, then restore the 0.9 pin for preDrag/measure.
      // No settle is needed after the pre-check's own event-clear branch:
      // the event was alive only ~3 ticks (negligible pull) and THIS settle
      // runs right after, erasing even that. The preDrag's event-clear
      // branch is different — see its comment below: it must RETRY so this
      // settle re-runs, because up to 10 s of mid-drag pressure is not
      // negligible.
      Math.random = () => 0.5;
      for (let i = 0; i < 300; i++) tickPrices(ctx, 0.5);
      Math.random = () => 0.9;
      // Hermit equilibrium flake (wave-11 gate hygiene): the walk state is a
      // fractional dev with an unscaled mean-revert pull, so at the hermit
      // equilibrium (step × walkMult vs full pull) the ROUNDED price sits
      // constant — driftV read exactly 0 whenever prior dev history started
      // above it (~1-in-4 runs). Drag dev below the equilibrium first so the
      // pinned upward walk is always visible in the rounded price.
      if (preDrag) {
        Math.random = () => 0.1;
        tick(ticksN, `${label} dev drag`);
        Math.random = () => 0.9;
        if (ctx.world.activeEvent) {
          // Mid-drag event hygiene: an event starting inside the 10 s drag
          // lives to its end (durations 120–240 s ≫ 10 s), so the clear
          // below always succeeds — and without the `continue` the old code
          // FELL THROUGH to the p0 sample with dev polluted by up to 10 s
          // of event pressure and no re-settle. Retry the whole attempt so
          // the settle re-pins dev; the clear's endEvent re-rolls
          // nextEventAt ≥ 342×eventGapMult s out (pinned 0.9), so the
          // retry's drag and window are event-free.
          // (The wave-20 driftH=9 flake turned out to be a different bug:
          // a cross-system commodityGlut pressure LEAK pinning hush's dev
          // at the −PRICE_BAND clamp — fixed in world.js/market.js by
          // stamping activeEvent.system and clearing that system's
          // pressure in endEvent. This retry guards the genuinely rare
          // mid-drag case that fix does not cover.)
          ctx.world.activeEvent.endsAt = ctx.world.time - 1;
          tick(2, `${label} drag-event cleared`);
          continue;
        }
      }
      const p0 = ctx.world.prices.provisions;
      tick(ticksN, label);
      if (ctx.world.activeEvent) {
        ctx.world.activeEvent.endsAt = ctx.world.time - 1;
        tick(2, `${label} mid-event cleared`);
        continue;
      }
      return { p0, p1: ctx.world.prices.provisions };
    }
    return null;
  };
  const v9 = measureDrift9('wave9 verge walk', 600, true);
  if (v9) driftV = v9.p1 - v9.p0;
  // verge → hush (NOT hermit): same pinned measurement, same tick count.
  ctx.ship.object.position.set(...vergeReturnGate.position); // verge → hush
  ctx.ship.velocity.set(0, 0, 0);
  tick(5, 'at hush gate (wave9 walk)');
  ctx.emit('jumpRequested', { to: 'hush' });
  if (!tickUntilJumpDone('hush', 'wave9 hop to hush (walk)')) {
    console.log('WAVE9 WALK JUMP FAIL — never arrived at hush');
    errors++;
  }
  const h9 = measureDrift9('wave9 hush walk', 600, true);
  if (h9) driftH = h9.p1 - h9.p0;
} finally {
  Math.random = origRandom9;
}
const w9walkChecks = {
  vergeWalkedUp: driftV > 0,
  hushWalkedUp: driftH > 0,
  // Theory: 4× (1 / walkMult), modulo baseline 220 vs 190 and integer
  // rounding — 2.5× leaves slop for the mean-reverting pull.
  hermitWalkSlower: driftH >= 2.5 * driftV,
};
console.log('wave9 hermit walk:', JSON.stringify(w9walkChecks), `driftV=${driftV} driftH=${driftH}`);
if (!Object.values(w9walkChecks).every(Boolean)) { console.log('WAVE9 HERMIT WALK FAIL'); errors++; }

// Save roundtrip (the wave-8 section-5 pattern): originArc.greenhand1 and
// both wave-9 milestones ride the dock autosave and the death restore.
// Credits are comfortably positive from the trades above, so no creditor
// call can interfere in the corruption window.
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave9 save)');
dockAtCurrentStation('dock hush (wave9 save)'); // Threshold — 'docked' fires trySave
tick(3, 'wave9 save settle');
const w9snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const w9saveChecks = {
  saveWritten: !!w9snap?.world,
  systemIsHush: w9snap?.world?.currentSystem === 'hush',
  greenhandBeatPersisted: w9snap?.world?.originArc?.greenhand1 === true,
  rimWithoutGunsPersisted: w9snap?.world?.milestones?.includes('rimWithoutGuns') === true,
  hermitMarketPersisted: w9snap?.world?.milestones?.includes('hermitMarket') === true,
};
console.log('wave9 save fields:', JSON.stringify(w9saveChecks));
if (!Object.values(w9saveChecks).every(Boolean)) { console.log('WAVE9 SAVE FIELDS FAIL'); errors++; }

// Corrupt in memory, die, recover. world.js legitimately REFIRES
// rimWithoutGuns in the post-corruption ticks (both broken-line milestones
// still stand) — expected, not a failure; the roundtrip asserts read
// post-restore values.
ctx.world.originArc.greenhand1 = false;
for (const id of ['rimWithoutGuns', 'hermitMarket']) {
  const i = ctx.world.milestones.indexOf(id);
  if (i >= 0) ctx.world.milestones.splice(i, 1);
}
tick(2, 'wave9 fields corrupted');
const w9corrupted = ctx.world.originArc.greenhand1 === false && !ctx.world.milestones.includes('hermitMarket');
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave9 restore)');
dispatchKey('Enter'); // recover(): restore(last save)
const w9restoreChecks = {
  corruptedFirst: w9corrupted,
  greenhandBeatRestored: ctx.world.originArc?.greenhand1 === true,
  rimWithoutGunsRestored: ctx.world.milestones.includes('rimWithoutGuns'),
  hermitMarketRestored: ctx.world.milestones.includes('hermitMarket'),
};
console.log('wave9 restore:', JSON.stringify(w9restoreChecks));
if (!Object.values(w9restoreChecks).every(Boolean)) { console.log('WAVE9 RESTORE FAIL'); errors++; }

// ---- Wave 10: aspirant cycle / hermit pirate / deep-rim keepers / save ----
// The continuing run sits DOCKED AT THRESHOLD IN THE HUSH (the wave-9 save
// roundtrip's death-restore), both broken-line milestones and
// 'rimWithoutGuns' standing, mystery.converged AND mystery.deepened true.
// A/B/C run on the continuing run after a hop back to the Verge (an
// aspirant rises into the CURRENT system's bank; the hermit beat is
// verge-only); C also boots one fresh harness for the converged-only rung
// (the wave-8/9 lesson: the origin overlay's digit listener eats Digit1-5
// until the pick, so the pick comes first); D closes with the save
// roundtrip in the Verge.
// Test SETUP: re-pin the hull huge — the wave-9 death-restore returned the
// class maxes, and random soak combat killing the player mid-section would
// eat later digit dispatches (the death overlay listens for the same keys).
ctx.player.hullMax = 1e9;
ctx.player.hull = 1e9;

// Travel: hush → verge (the wave-8 gate pair, in reverse).
if (ctx.flags.docked) undockStation(); // leave Threshold (wave-9 restore dock)
ctx.ship.object.position.set(...vergeGate.position); // hush → verge
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at verge gate (wave10)');
ctx.emit('jumpRequested', { to: 'verge' });
if (!tickUntilJumpDone('verge', 'wave10 hop to verge')) {
  console.log('WAVE10 TRAVEL FAIL — never arrived at verge');
  errors++;
}

// -- a. aspirant cycle: three new names rise, then the rim stays quiet ------
// Test SETUP (mirrors the wave-7/8 lineage normalize): splice any aspirant
// records earlier soak phases may have grown (fear has sat high since the
// wave-9 refire — a spontaneous rise during wave-9's ticks is possible),
// reset the cycle fields, and pin fear at the threshold. 'aspirantBroken'
// is spliced too so the scripted first fall is guaranteed to voice it.
{
  const seenBanks = new Set();
  for (const bank of [...Object.values(ctx.world.recordBanks ?? {}), ctx.world.records]) {
    if (!bank || seenBanks.has(bank)) continue; // ctx.world.records aliases the current bank
    seenBanks.add(bank);
    for (let i = bank.length - 1; i >= 0; i--) {
      if (NAMED_GUNS.aspirants.names.includes(bank[i].name)) bank.splice(i, 1);
    }
  }
  const rivalry10 = ctx.world.aceRivalry; // created by world.js long ago
  rivalry10.aspirantRisen = 0;
  rivalry10.aspirantDownAt = null;
  rivalry10.aspirantFlying = false;
  const iBroken10 = ctx.world.milestones.indexOf('aspirantBroken');
  if (iBroken10 >= 0) ctx.world.milestones.splice(iBroken10, 1);
}
ctx.world.fear = NAMED_GUNS.aspirants.fearThreshold; // 50
const aspEvs = [];
for (let i = 0; i < 3; i++) { tick(1, 'wave10 first aspirant'); aspEvs.push(...ctx.lastEvents); }
const rise1Evs = aspEvs.filter((e) => e.type === 'gunRisen');
const vergeBank10 = ctx.world.recordBanks?.verge ?? [];
const liveAspirant = () => vergeBank10.find((r) => r.aspirant === true && r.state !== 'dead' && r.state !== 'captured') ?? null;
const asp1 = liveAspirant();
const flyingAfterRise1 = ctx.world.aceRivalry.aspirantRisen === 1 && ctx.world.aceRivalry.aspirantFlying === true;
if (asp1) defeatAce(asp1, 'wave10 defeat aspirant 1', aspEvs); // the wave-7 'npcDestroyed' path
const aspDownAt1 = ctx.world.aceRivalry.aspirantDownAt;
const downedAfter1 = ctx.world.aceRivalry.aspirantFlying === false && Number.isFinite(aspDownAt1);
// Backdate instead of sleeping: the rise check is world.time - aspirantDownAt.
ctx.world.aceRivalry.aspirantDownAt = ctx.world.time - (NAMED_GUNS.aspirants.respawnDelay + 1);
for (let i = 0; i < 3; i++) { tick(1, 'wave10 second aspirant'); aspEvs.push(...ctx.lastEvents); }
const asp2 = liveAspirant();
if (asp2) defeatAce(asp2, 'wave10 defeat aspirant 2', aspEvs);
ctx.world.aceRivalry.aspirantDownAt = ctx.world.time - (NAMED_GUNS.aspirants.respawnDelay + 1);
for (let i = 0; i < 3; i++) { tick(1, 'wave10 third aspirant'); aspEvs.push(...ctx.lastEvents); }
const asp3 = liveAspirant();
if (asp3) defeatAce(asp3, 'wave10 defeat aspirant 3', aspEvs);
// Third name spent: even with the wait satisfied, nothing more rises.
ctx.world.aceRivalry.aspirantDownAt = ctx.world.time - (NAMED_GUNS.aspirants.respawnDelay + 1);
for (let i = 0; i < 5; i++) { tick(1, 'wave10 no fourth aspirant'); aspEvs.push(...ctx.lastEvents); }
const riseEvs = aspEvs.filter((e) => e.type === 'gunRisen');
const brokenEvs10 = aspEvs.filter((e) => e.type === 'milestone' && e.id === 'aspirantBroken');
const w10aspirantChecks = {
  firstRiseOnce: rise1Evs.length === 1,
  firstName: rise1Evs[0]?.name === NAMED_GUNS.aspirants.names[0], // 'Harrow Quist'
  firstLine: rise1Evs[0]?.line === NAMED_GUNS.aspirants.lines[0],
  recordInVergeBank: !!asp1 && asp1.name === NAMED_GUNS.aspirants.names[0] && asp1.aspirant === true,
  recordSpecs: asp1?.role === 'ace' && asp1?.faction === 'independent' && asp1?.classKey === 'cutter' &&
    asp1?.resolve === NAMED_GUNS.aspirants.resolve && asp1?.bounty === NAMED_GUNS.aspirants.bounty &&
    JSON.stringify(asp1?.cargo) === JSON.stringify([{ commodity: 'restrictedComponents', units: 4 }]),
  flyingAfterRise: flyingAfterRise1,
  downedAfterDefeat: downedAfter1,
  brokenMilestoneBanked: ctx.world.milestones.includes('aspirantBroken'),
  brokenMilestoneEvent: brokenEvs10.length >= 1,
  secondRise: riseEvs[1]?.name === NAMED_GUNS.aspirants.names[1] && // 'Saint Ruvic'
    riseEvs[1]?.line === NAMED_GUNS.aspirants.lines[1],
  thirdRise: riseEvs[2]?.name === NAMED_GUNS.aspirants.names[2] && // 'Ash Bell'
    riseEvs[2]?.line === NAMED_GUNS.aspirants.lines[2],
  noFourthRise: riseEvs.length === 3 && ctx.world.aceRivalry.aspirantRisen === 3,
  brokenMilestoneOnceEver: brokenEvs10.length === 1, // three falls, one milestone
};
console.log('wave10 aspirants:', JSON.stringify(w10aspirantChecks), `rises=${riseEvs.map((e) => e.name).join('|')}`);
if (!Object.values(w10aspirantChecks).every(Boolean)) { console.log('WAVE10 ASPIRANTS FAIL'); errors++; }

// -- b. hermit pirate: Old Callow hails once, near his record position ------
// Test SETUP: splice the milestone if an earlier section already parked the
// player within his 350u earshot (guarantees a fresh fire regardless of
// where the arrival gate dropped us), and revive the record if random soak
// combat marked him dead (the wave-8 Illyx revive pattern).
{
  const iMet10 = ctx.world.milestones.indexOf('hermitPirateMet');
  if (iMet10 >= 0) ctx.world.milestones.splice(iMet10, 1);
}
const callow = vergeBank10.find((r) => r.name === 'Old Callow') ?? null;
if (callow && (callow.state === 'dead' || callow.state === 'captured')) callow.state = 'enroute';
const hermitEvs = [];
const rp10 = new THREE.Vector3();
// Exact cold-variant string from world.js hermitPirateBeat (rimWithoutGuns
// stands in this run). Counts filter to it: parked on his route, the LIVE
// Old Callow can acquire the player and bark ('Heave to. Cargo or hull.',
// npc.js telegraph) — same sender, different system. The beat's once-ever
// semantics live on the cold line and the milestone guard.
const COLD_HAIL = 'You broke the Guns. This lane had teeth once. I remember teeth.';
if (callow) {
  recordPosition(callow, rp10);
  // 2000u out: beyond DEINSTANTIATE_RANGE (1400), so no live copy, and far
  // past the encounter bubble (800) — neither the beat nor a bark can fire.
  ctx.ship.object.position.set(rp10.x + 2000, rp10.y, rp10.z);
  ctx.ship.velocity.set(0, 0, 0);
}
for (let i = 0; i < 3; i++) { tick(1, 'wave10 hermit far'); hermitEvs.push(...ctx.lastEvents); }
const farHails = hermitEvs.filter((e) => e.type === 'commLine' && e.from === 'Old Callow');
if (callow) {
  recordPosition(callow, rp10); // the route drifts — re-read, park exactly on it
  ctx.ship.object.position.copy(rp10);
  ctx.ship.velocity.set(0, 0, 0);
}
for (let i = 0; i < 3; i++) { tick(1, 'wave10 hermit near'); hermitEvs.push(...ctx.lastEvents); }
const nearCold = hermitEvs.filter((e) => e.type === 'commLine' && e.from === 'Old Callow' && e.text === COLD_HAIL);
for (let i = 0; i < 10; i++) { tick(1, 'wave10 hermit refire watch'); hermitEvs.push(...ctx.lastEvents); }
const totalCold = hermitEvs.filter((e) => e.type === 'commLine' && e.from === 'Old Callow' && e.text === COLD_HAIL);
const w10hermitChecks = {
  callowInVergeBank: !!callow && callow.role === 'pirate',
  beatKeysOnCallow: vergeBank10.find((r) => r.role === 'pirate') === callow, // world.js reads the first pirate
  coldPrecondition: ctx.world.milestones.includes('rimWithoutGuns'),
  silentFromFar: farHails.length === 0,
  coldHailOnceNear: nearCold.length === 1,
  coldVariant: nearCold[0]?.text === COLD_HAIL,
  milestoneBanked: ctx.world.milestones.includes('hermitPirateMet'),
  noSecondHail: totalCold.length === 1, // the milestone guard holds across the refire watch
};
console.log('wave10 hermit pirate:', JSON.stringify(w10hermitChecks), `text=${JSON.stringify(nearCold[0]?.text)}`);
if (!Object.values(w10hermitChecks).every(Boolean)) { console.log('WAVE10 HERMIT PIRATE FAIL'); errors++; }

// -- c. deep-rim keepers: the mystery acknowledgments, once per rung --------
// Continuing run: the wave-10 roster is 9 entries, 6 dockmasters (the wave-4
// check, re-derived — save restores swap the roster array wholesale).
const w10contacts = ctx.world.contacts ?? [];
const w10roleCt = (role) => w10contacts.filter((c) => c.role === role).length;
const vergeKeeper = w10contacts.find((c) => c.id === 'contact-verge-dockmaster') ?? null;
const hushKeeper = w10contacts.find((c) => c.id === 'contact-hush-dockmaster') ?? null;
// Exact strings from contacts.js recognitionLine (not exported — asserted
// verbatim, same as the wave-5/8 arrival lines).
const DEEPENED_ACK = 'You stood in the Answer and came back. We do not ask what it said.';
const CONVERGED_ACK = 'Two columns, always — arrivals, and arrivals that have not happened yet. Your return goes in neither.';
// mystery.deepened stands in this run (wave-7) — the deeper rung answers
// first and marks BOTH once-flags. Test SETUP: clear any ack flags an
// earlier people-screen render may have voiced (the wave-7/8 normalize
// discipline — none are expected; no wave opened people off-freehold).
for (const k of [vergeKeeper, hushKeeper]) {
  if (k) { delete k.deepAck1; delete k.deepAck2; }
}
const deepenedLineV = vergeKeeper ? recognitionLine(ctx, vergeKeeper) : null;
const deepenedRepeatV = vergeKeeper ? recognitionLine(ctx, vergeKeeper) : null;
const deepenedLineH = hushKeeper ? recognitionLine(ctx, hushKeeper) : null;
// Non-deep-rim control: neither deep line ever comes from a shallow-rim
// contact. aceRivalry.defeats > 0 in this run, so skip freehold/redmarch
// (their aceAck tier would answer instead) — take the veridian dockmaster,
// falling back to the fixer if trust ever crossed the recognition
// threshold (wave 4 bumped freehold 65 / redmarch 10, never veridian).
let shallowContact = contactsForSystem(ctx, 'veridian').find((c) => c.role === 'dockmaster') ?? null;
if (shallowContact && shallowContact.trust >= 60) {
  shallowContact = contactsForSystem(ctx, 'veridian').find((c) => c.role === 'fixer') ?? shallowContact;
}
const shallowLine = shallowContact ? recognitionLine(ctx, shallowContact) : null;
const w10keeperChecks = {
  nineEntries: w10contacts.length === 9,
  dockmasterX6: w10roleCt('dockmaster') === 6,
  keepersFound: vergeKeeper?.name === 'Keeper Leth' && hushKeeper?.name === 'Keeper Ond',
  deepenedPrecondition: ctx.world.mystery?.deepened === true && ctx.world.mystery?.converged === true,
  vergeDeepenedLine: deepenedLineV === DEEPENED_ACK,
  vergeFlagsBoth: vergeKeeper?.deepAck1 === true && vergeKeeper?.deepAck2 === true,
  deepenedNotRepeated: deepenedRepeatV !== DEEPENED_ACK,
  hushDeepenedLine: deepenedLineH === DEEPENED_ACK, // once flags are per-contact
  hushFlagsBoth: hushKeeper?.deepAck1 === true && hushKeeper?.deepAck2 === true,
  shallowNeverDeep: shallowLine !== DEEPENED_ACK && shallowLine !== CONVERGED_ACK,
};
console.log('wave10 deep-rim keepers:', JSON.stringify(w10keeperChecks), `shallow=${JSON.stringify(shallowLine)}`);
if (!Object.values(w10keeperChecks).every(Boolean)) { console.log('WAVE10 DEEP-RIM KEEPERS FAIL'); errors++; }

// Converged-only rung: one FRESH harness (the wave-9 B/C pattern — empty
// store, origin pick FIRST because the overlay eats Digit1-5). The main
// run's docked/paused flags gate its own window listeners; both are false
// (last docked at the wave-9 restore, undocked for the wave-10 travel).
ctx.flags.docked = false;
ctx.flags.paused = false;
const convBoot = bootFreshHarness('wave10-converged');
const cctx = convBoot.ctx;
const ctick = convBoot.tick;
const cOverlayShown = [...walkDom(document.body)]
  .some((n) => typeof n.textContent === 'string' && n.textContent.toLowerCase().includes('who are you'));
dispatchKey('Digit1'); // [1] Freehold Greenhand (ORIGINS key order)
const cOriginEv = cctx.events.find((e) => e.type === 'originChosen') ?? null; // emit is synchronous
cctx.player.hullMax = 1e9;
cctx.player.hull = 1e9;
ctick(2, 'wave10 converged boot settle');
const cmystery = cctx.world.mystery;
cmystery.converged = true; // converged WITHOUT deepened — the shallower rung
const keeperVoss = (cctx.world.contacts ?? []).find((c) => c.id === 'contact-hollowreach-dockmaster') ?? null;
const convergedLine1 = keeperVoss ? recognitionLine(cctx, keeperVoss) : null;
const convergedLine2 = keeperVoss ? recognitionLine(cctx, keeperVoss) : null;
const w10convergedChecks = {
  overlayShown: cOverlayShown,
  originRecorded: cctx.world.origin === 'greenhand',
  originChosenEmitted: cOriginEv?.id === 'greenhand',
  vossFound: keeperVoss?.name === 'Keeper Voss',
  deepenedFalsy: cmystery.deepened !== true,
  convergedLine: convergedLine1 === CONVERGED_ACK,
  deepAck1Only: keeperVoss?.deepAck1 === true && keeperVoss?.deepAck2 !== true,
  convergedNotRepeated: convergedLine2 !== CONVERGED_ACK,
};
console.log('wave10 converged ack:', JSON.stringify(w10convergedChecks), `line=${JSON.stringify(convergedLine1)}`);
if (!Object.values(w10convergedChecks).every(Boolean)) { console.log('WAVE10 CONVERGED ACK FAIL'); errors++; }

// -- d. save roundtrip: wave-10 fields ride the dock autosave + restore -----
// The wave-8 section-5 / wave-9 closing pattern, continuing run in the
// Verge. Test SETUP: park live hostiles so the dock autosave can't be
// combat-blocked (the three spent aspirants, Dresk, and Old Callow are
// live somewhere in this system).
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave10 save)');
dockAtCurrentStation('dock verge (wave10 save)'); // The Vigil — 'docked' fires trySave
tick(3, 'wave10 save settle');
const downAtPreSave10 = ctx.world.aceRivalry.aspirantDownAt;
const w10snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const w10saveChecks = {
  saveWritten: !!w10snap?.world,
  systemIsVerge: w10snap?.world?.currentSystem === 'verge',
  aspirantsPersisted: w10snap?.world?.aceRivalry?.aspirantRisen === 3 &&
    Number.isFinite(w10snap?.world?.aceRivalry?.aspirantDownAt),
  brokenPersisted: w10snap?.world?.milestones?.includes('aspirantBroken') === true,
  hermitMetPersisted: w10snap?.world?.milestones?.includes('hermitPirateMet') === true,
  deepAcksPersisted: (w10snap?.world?.contacts ?? [])
    .some((c) => c.id === 'contact-verge-dockmaster' && c.deepAck1 === true && c.deepAck2 === true),
};
console.log('wave10 save fields:', JSON.stringify(w10saveChecks));
if (!Object.values(w10saveChecks).every(Boolean)) { console.log('WAVE10 SAVE FIELDS FAIL'); errors++; }

// Corrupt in memory, die, recover from the dock autosave (Enter skips the
// hold synchronously — the wave-5 death path). The post-corruption ticks
// legitimately RE-RISE an aspirant (rimWithoutGuns + fear 50 + reset
// fields) — expected, not a failure, mirroring wave-9's rimWithoutGuns
// refire: the restore swaps aceRivalry/recordBanks wholesale, and the
// corruptedFirst probe reads fields nothing re-derives while docked
// (hermitPirateMet — The Vigil sits ~800u from Old Callow's lane — and the
// keeper flags).
const rivalry10d = ctx.world.aceRivalry;
rivalry10d.aspirantRisen = 0;
rivalry10d.aspirantDownAt = null;
rivalry10d.aspirantFlying = false;
for (const id of ['aspirantBroken', 'hermitPirateMet']) {
  const i = ctx.world.milestones.indexOf(id);
  if (i >= 0) ctx.world.milestones.splice(i, 1);
}
for (const keeperId of ['contact-verge-dockmaster', 'contact-hush-dockmaster']) {
  const k = ctx.world.contacts.find((c) => c.id === keeperId);
  if (k) { delete k.deepAck1; delete k.deepAck2; }
}
tick(2, 'wave10 fields corrupted');
const w10corrupted = !ctx.world.milestones.includes('hermitPirateMet') &&
  !ctx.world.contacts.some((c) => c.id === 'contact-verge-dockmaster' && c.deepAck2 === true);
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave10 restore)');
dispatchKey('Enter'); // recover(): restore(last save)
const vergeKeeperRestored = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-verge-dockmaster') ?? null;
const w10restoreChecks = {
  corruptedFirst: w10corrupted,
  aspirantRisenRestored: ctx.world.aceRivalry?.aspirantRisen === 3,
  downAtRestored: Number.isFinite(downAtPreSave10) && ctx.world.aceRivalry?.aspirantDownAt === downAtPreSave10,
  brokenRestored: ctx.world.milestones.includes('aspirantBroken'),
  hermitMetRestored: ctx.world.milestones.includes('hermitPirateMet'),
  deepAcksRestored: vergeKeeperRestored?.deepAck1 === true && vergeKeeperRestored?.deepAck2 === true,
};
// All three names spent: the restore must not re-arm the cycle.
const postRestoreEvs = [];
for (let i = 0; i < 5; i++) { tick(1, 'wave10 no rise post-restore'); postRestoreEvs.push(...ctx.lastEvents); }
w10restoreChecks.noGunRisenPostRestore = !postRestoreEvs.some((e) => e.type === 'gunRisen');
console.log('wave10 restore:', JSON.stringify(w10restoreChecks));
if (!Object.values(w10restoreChecks).every(Boolean)) { console.log('WAVE10 RESTORE FAIL'); errors++; }

// ---- Wave 11: aspirant aftermath / Callow returns + vouch / keeper value / save ----
// The continuing run sits DOCKED AT THE VIGIL IN THE VERGE (the wave-10 save
// roundtrip's death-restore): aspEvs holds every event across the three
// aspirant defeats and the no-fourth-rise watch, 'hermitPirateMet' stands,
// and the restored recordBanks carry Old Callow. A reads aspEvs + the
// restored milestones; B round-trips verge → hush → verge twice (each
// 'systemLoaded' to the verge arms one return line); C hails Callow for the
// vouch; D/E/F exercise the keeper value mechanics (D pure, E/F through the
// real station UI); G closes with the recordBanks save roundtrip.
// Test SETUP: re-pin the hull huge — the wave-10 death-restore returned the
// class maxes, and random soak combat killing the player mid-section would
// eat later digit dispatches (the death overlay listens for the same keys).
ctx.player.hullMax = 1e9;
ctx.player.hull = 1e9;

// -- a. aftermath: rimAnswered + one aftermath songShift, fire-once ---------
// Both events fired inside the wave-10 aspirant section (the third fall) and
// ride aspEvs; the milestone then rode the wave-10 dock autosave + restore.
const rimAnsweredEvs = aspEvs.filter((e) => e.type === 'milestone' && e.id === 'rimAnswered');
const aftermathShiftEvs = aspEvs.filter((e) => e.type === 'songShift' && e.reason === 'aftermath');
const w11aftermathEvs = [];
for (let i = 0; i < 5; i++) { tick(1, 'wave11 aftermath fire-once'); w11aftermathEvs.push(...ctx.lastEvents); }
const w11aftermathChecks = {
  rimAnsweredOnce: rimAnsweredEvs.length === 1,
  rimAnsweredLine: rimAnsweredEvs[0]?.line === 'The lanes are done sending names. The quiet after is yours to fly.',
  aftermathSongShiftOnce: aftermathShiftEvs.length === 1,
  milestonePersistedPostRestore: ctx.world.milestones.includes('rimAnswered'),
  noGunRisenAfter: !w11aftermathEvs.some((e) => e.type === 'gunRisen'),
  noAftermathShiftRefire: !w11aftermathEvs.some((e) => e.type === 'songShift' && e.reason === 'aftermath'),
};
console.log('wave11 aftermath:', JSON.stringify(w11aftermathChecks));
if (!Object.values(w11aftermathChecks).every(Boolean)) { console.log('WAVE11 AFTERMATH FAIL'); errors++; }

// -- b. Callow returns: one return line per Verge visit ---------------------
// The wave-10 first-meet beat already fired, so proximity now voices the
// rotating return lines — at most one per visit, armed by each
// 'systemLoaded' to the verge. Counts filter to CALLOW.returnLines exactly:
// parked on his lane, the LIVE Old Callow can acquire the player and bark
// ('Heave to. Cargo or hull.', npc.js telegraph) — same sender, different
// system (the wave-10 hermit-pirate discipline).
if (ctx.flags.docked) undockStation(); // leave The Vigil (wave-10 restore dock)
const rv11 = new THREE.Vector3();
// Baseline is ROUTE-DEPENDENT: the first-meet can fire as early as the
// wave-8 arrival (his lane can pass within 350u of the gate), and a return
// line then fires on ANY later jump-in (e.g. the wave-10 travel) — long
// before this section. Assert relative to the counter at section start.
const vergeBank11 = ctx.world.recordBanks?.verge ?? [];
const callowRec = vergeBank11.find((r) => r.name === 'Old Callow') ?? null;
const callowReturnsBase = callowRec?.callowReturns ?? 0;
// Round trip 1: verge → hush → verge arms the first return line.
ctx.ship.object.position.set(...vergeReturnGate.position); // verge → hush
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at hush gate (wave11 returns 1)');
ctx.emit('jumpRequested', { to: 'hush' });
if (!tickUntilJumpDone('hush', 'wave11 hop to hush (returns 1)')) {
  console.log('WAVE11 TRAVEL FAIL — never arrived at hush');
  errors++;
}
ctx.ship.object.position.set(...vergeGate.position); // hush → verge
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at verge gate (wave11 returns 1)');
// The return beat can fire AT THE ARRIVAL GATE during the jump-settle ticks
// (Callow's route passes within 350u of the verge gate), so collect across the
// ENTIRE return leg — a manual tickUntilJumpDone with event capture.
const returnEvs1 = [];
ctx.emit('jumpRequested', { to: 'verge' });
let arrivedVerge1 = false;
for (let i = 0; i < 60 * 10; i++) {
  tick(1, 'wave11 hop to verge (returns 1)');
  returnEvs1.push(...ctx.lastEvents);
  if (ctx.world.currentSystem === 'verge' && !ctx.gate.jumping) { arrivedVerge1 = true; break; }
}
if (!arrivedVerge1) {
  console.log('WAVE11 TRAVEL FAIL — never arrived at verge');
  errors++;
}
if (callowRec && (callowRec.state === 'dead' || callowRec.state === 'captured')) callowRec.state = 'enroute';
if (callowRec) {
  recordPosition(callowRec, rv11); // the route drifts — re-read, park exactly on it
  ctx.ship.object.position.copy(rv11);
  ctx.ship.velocity.set(0, 0, 0);
}
for (let i = 0; i < 3; i++) { tick(1, 'wave11 callow return 1'); returnEvs1.push(...ctx.lastEvents); }
const isReturnLine = (e) => e.type === 'commLine' && e.from === 'Old Callow' && CALLOW.returnLines.includes(e.text);
const firstVisitLines = returnEvs1.filter(isReturnLine);
for (let i = 0; i < 10; i++) { tick(1, 'wave11 return-1 refire watch'); returnEvs1.push(...ctx.lastEvents); }
const firstVisitLinesAll = returnEvs1.filter(isReturnLine);
const callowReturnsAfterVisit1 = callowRec?.callowReturns; // snapshot BEFORE round trip 2 moves it
// Round trip 2: verge → hush → verge arms the second return line.
ctx.ship.object.position.set(...vergeReturnGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at hush gate (wave11 returns 2)');
ctx.emit('jumpRequested', { to: 'hush' });
if (!tickUntilJumpDone('hush', 'wave11 hop to hush (returns 2)')) {
  console.log('WAVE11 TRAVEL FAIL — never arrived at hush');
  errors++;
}
ctx.ship.object.position.set(...vergeGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at verge gate (wave11 returns 2)');
const returnEvs2 = []; // whole-leg collection, same as round 1
ctx.emit('jumpRequested', { to: 'verge' });
let arrivedVerge2 = false;
for (let i = 0; i < 60 * 10; i++) {
  tick(1, 'wave11 hop to verge (returns 2)');
  returnEvs2.push(...ctx.lastEvents);
  if (ctx.world.currentSystem === 'verge' && !ctx.gate.jumping) { arrivedVerge2 = true; break; }
}
if (!arrivedVerge2) {
  console.log('WAVE11 TRAVEL FAIL — never arrived at verge');
  errors++;
}
if (callowRec) {
  recordPosition(callowRec, rv11); // re-read after the hops — the route drifts
  ctx.ship.object.position.copy(rv11);
  ctx.ship.velocity.set(0, 0, 0);
}
for (let i = 0; i < 3; i++) { tick(1, 'wave11 callow return 2'); returnEvs2.push(...ctx.lastEvents); }
const secondVisitLines = returnEvs2.filter(isReturnLine);
const w11returnChecks = {
  callowInVergeBank: !!callowRec && callowRec.role === 'pirate',
  returnLinesShape: Array.isArray(CALLOW.returnLines) && CALLOW.returnLines.length === 3 &&
    CALLOW.returnLines.every((l) => typeof l === 'string' && l.length > 0),
  firstVisitLineOnce: firstVisitLines.length === 1 && firstVisitLines[0]?.text === CALLOW.returnLines[callowReturnsBase % CALLOW.returnLines.length],
  counterAfterFirst: callowReturnsAfterVisit1 === callowReturnsBase + 1,
  noSecondLineSameVisit: firstVisitLinesAll.length === 1, // the per-visit guard holds across the refire watch
  secondVisitLineOnce: secondVisitLines.length === 1 && secondVisitLines[0]?.text === CALLOW.returnLines[(callowReturnsBase + 1) % CALLOW.returnLines.length],
  counterAfterSecond: callowRec?.callowReturns === callowReturnsBase + 2,
};
console.log('wave11 callow returns:', JSON.stringify(w11returnChecks), `lines=${JSON.stringify(firstVisitLinesAll.map((e) => e.text))}|${JSON.stringify(secondVisitLines.map((e) => e.text))}`);
if (!Object.values(w11returnChecks).every(Boolean)) { console.log('WAVE11 CALLOW RETURNS FAIL'); errors++; }

// -- c. Callow's vouch: the hail, the 600, both keepers owed ----------------
// Still in the verge, parked on his lane from subsection b. 'hermitPirateMet'
// stands (wave-10 cold variant, restored), rec.vouched is falsy, and the
// purse is pinned at exactly vouchCost + 50 so the charge is unambiguous.
ctx.world.credits = CALLOW.vouchCost + 50;
const vergeKeeper11 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-verge-dockmaster') ?? null;
const hushKeeper11 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-hush-dockmaster') ?? null;
const vergeTrustBefore11 = vergeKeeper11?.trust ?? 0;
const vergeFavorsBefore11 = vergeKeeper11?.favors ?? 0;
const hushTrustBefore11 = hushKeeper11?.trust ?? 0;
const hushFavorsBefore11 = hushKeeper11?.favors ?? 0;
if (callowRec) {
  recordPosition(callowRec, rv11); // re-read — the route drifted during the return watches
  ctx.ship.object.position.copy(rv11);
  ctx.ship.velocity.set(0, 0, 0);
}
// Instantiation is range-based: single ticks until his live ship exists.
let callowLive = ctx.ships.find((s) => s.record === callowRec) ?? null;
for (let i = 0; i < 30 && !callowLive; i++) {
  tick(1, 'wave11 callow instantiate');
  callowLive = ctx.ships.find((s) => s.record === callowRec) ?? null;
}
const vouchHailEvs = [];
dispatchKey('KeyH');
// world.js emits 'hailOpened' up to a frame after the KeyH pulse and hail.js
// consumes it from lastEvents on a LATER frame, so poll (max 10 ticks) until
// the card's vouch button exists in the DOM before dispatching Digit1.
let vouchBtn = null;
for (let i = 0; i < 10 && !vouchBtn; i++) {
  tick(1, 'wave11 vouch hail');
  vouchHailEvs.push(...ctx.lastEvents);
  for (const n of walkDom(document.body)) {
    if (n.tagName === 'BUTTON' && typeof n.textContent === 'string' && n.textContent.includes('Buy his vouch')) { vouchBtn = n; break; }
  }
}
const hailOpenedEvs = vouchHailEvs.filter((e) => e.type === 'hailOpened');
const creditsBeforeVouch = ctx.world.credits;
const vouchResolveEvs = [];
dispatchKey('Digit1'); // hail card intent 1 — the vouch
for (let i = 0; i < 2; i++) { tick(1, 'wave11 vouch resolve'); vouchResolveEvs.push(...ctx.lastEvents); }
const vouchMilestoneEvs = vouchResolveEvs.filter((e) => e.type === 'milestone' && e.id === 'callowVouched');
const vouchLineEvs = vouchResolveEvs.filter((e) => e.type === 'commLine' && e.from === 'Old Callow' && e.text === CALLOW.vouchLine);
const vouchRefireEvs = [];
for (let i = 0; i < 5; i++) { tick(1, 'wave11 vouch refire watch'); vouchRefireEvs.push(...ctx.lastEvents); }
dispatchKey('KeyH'); // vouched already — no hail opens now
for (let i = 0; i < 2; i++) { tick(1, 'wave11 second hail watch'); vouchRefireEvs.push(...ctx.lastEvents); }
const w11vouchChecks = {
  callowData: CALLOW.hailRange === 800 && CALLOW.vouchCost === 600 && CALLOW.vouchTrust === 15,
  hermitMetPrecondition: ctx.world.milestones.includes('hermitPirateMet'),
  liveShipFound: !!callowLive,
  keepersFound: !!vergeKeeper11 && !!hushKeeper11,
  hailOpenedOnce: hailOpenedEvs.length === 1,
  hailIntents: JSON.stringify(hailOpenedEvs[0]?.intents) === JSON.stringify(['callowVouch', 'keepFiring']),
  hailLine: hailOpenedEvs[0]?.line === CALLOW.offerLine,
  creditsDroppedExact: creditsBeforeVouch - ctx.world.credits === CALLOW.vouchCost,
  vouched: callowRec?.vouched === true,
  vergeKeeperTrust: vergeKeeper11?.trust === vergeTrustBefore11 + CALLOW.vouchTrust,
  vergeKeeperFavor: vergeKeeper11?.favors === vergeFavorsBefore11 + 1,
  hushKeeperTrust: hushKeeper11?.trust === hushTrustBefore11 + CALLOW.vouchTrust,
  hushKeeperFavor: hushKeeper11?.favors === hushFavorsBefore11 + 1,
  milestoneOnce: vouchMilestoneEvs.length === 1 && vouchMilestoneEvs[0]?.line === CALLOW.vouchMilestoneLine,
  milestoneBanked: ctx.world.milestones.includes('callowVouched'),
  vouchCommLineOnce: vouchLineEvs.length === 1,
  noMilestoneRefire: !vouchRefireEvs.some((e) => e.type === 'milestone' && e.id === 'callowVouched'),
  secondHailSilent: !vouchRefireEvs.some((e) => e.type === 'hailOpened'),
};
console.log('wave11 callow vouch:', JSON.stringify(w11vouchChecks), `credits=${ctx.world.credits} vergeTrust=${vergeKeeper11?.trust} hushTrust=${hushKeeper11?.trust}`);
if (!Object.values(w11vouchChecks).every(Boolean)) { console.log('WAVE11 CALLOW VOUCH FAIL'); errors++; }

// -- d. keeper ledger: the rotating second-column line (pure, no UI) --------
// Trust-gated at KEEPER_LEDGER_TRUST; names one undiscovered landmark + its
// system per call, rotating; the closing line once every landmark is
// witnessed. Test SETUP is self-cleaning: trust and mystery.visited are
// restored before any further ticks so later sections aren't poisoned.
const ledgerContact = vergeKeeper11;
const visitedBefore11 = [...(ctx.world.mystery?.visited ?? [])];
const foundBefore11 = [...(ctx.world.mystery?.found ?? [])]; // wave 12: the closing line is tier 3 — found matters too
const trustBeforeLedger = ledgerContact?.trust;
if (ledgerContact) ledgerContact.trust = KEEPER_LEDGER_TRUST - 1;
const ledgerLineLow = ledgerContact ? keeperLedgerLine(ctx, ledgerContact) : undefined;
if (ledgerContact) ledgerContact.trust = 60;
const ledgerLine1 = ledgerContact ? keeperLedgerLine(ctx, ledgerContact) : null;
const ledgerLine2 = ledgerContact ? keeperLedgerLine(ctx, ledgerContact) : null;
const LEDGER_RE = /^The second column holds: (.+), in (.+)\. Marked awaiting\.$/;
const ledgerTarget = (line) => {
  const m = typeof line === 'string' ? line.match(LEDGER_RE) : null;
  if (!m) return null;
  for (const def of Object.values(SYSTEMS)) {
    if (def.name !== m[2]) continue;
    const lm = (def.landmarks ?? []).find((l) => l.name === m[1]);
    if (lm) return lm;
  }
  return null;
};
const ledgerLm1 = ledgerTarget(ledgerLine1);
const ledgerLm2 = ledgerTarget(ledgerLine2);
for (const def of Object.values(SYSTEMS)) {
  for (const lm of def.landmarks ?? []) {
    if (!ctx.world.mystery.visited.includes(lm.id)) ctx.world.mystery.visited.push(lm.id);
  }
}
// Wave 12: with every landmark witnessed but clues unfound, the ledger
// answers the tier-2 clue-system line instead of closing — the closing
// line is tier 3, so every authored clue id must ride mystery.found too.
for (const def of Object.values(SYSTEMS)) {
  for (const clue of def.clues ?? []) {
    if (!ctx.world.mystery.found.includes(clue.id)) ctx.world.mystery.found.push(clue.id);
  }
}
const ledgerClosing = ledgerContact ? keeperLedgerLine(ctx, ledgerContact) : null;
ctx.world.mystery.visited.length = 0; // restore in place — landmarks.js change-detects on length
ctx.world.mystery.visited.push(...visitedBefore11);
ctx.world.mystery.found.length = 0; // same in-place discipline for the clue list
ctx.world.mystery.found.push(...foundBefore11);
if (ledgerContact) ledgerContact.trust = trustBeforeLedger;
const w11ledgerChecks = {
  exportValue: KEEPER_LEDGER_TRUST === 30,
  belowThresholdNull: ledgerLineLow === null,
  line1Shape: LEDGER_RE.test(ledgerLine1 ?? ''),
  line2Shape: LEDGER_RE.test(ledgerLine2 ?? ''),
  twoCallsRotate: typeof ledgerLine1 === 'string' && ledgerLine1 !== ledgerLine2,
  line1NamesUnvisited: !!ledgerLm1 && !visitedBefore11.includes(ledgerLm1.id),
  line2NamesUnvisited: !!ledgerLm2 && !visitedBefore11.includes(ledgerLm2.id),
  closingExact: ledgerClosing === 'Both columns balance at last — nothing waits, and nothing stays unread.',
};
console.log('wave11 keeper ledger:', JSON.stringify(w11ledgerChecks), `l1=${JSON.stringify(ledgerLine1)} l2=${JSON.stringify(ledgerLine2)}`);
if (!Object.values(w11ledgerChecks).every(Boolean)) { console.log('WAVE11 KEEPER LEDGER FAIL'); errors++; }

// -- e. keeper service: trust >= 60 waives the hermit buy markup (real UI) --
// The wave-9 hermit market pattern (service selection via window keydown
// digits, trades via stub-DOM button clicks, prices read from the market
// cells), but asserting the WAIVED figure under keeper trust 60 and the full
// ×1.25 figure below it; the sell premium is untouched either way.
// Test SETUP: park live hostiles so the dock autosave can't be
// combat-blocked (Old Callow's live ship sits next to us after the vouch —
// the wave-10 save discipline), and keep the purse comfortably positive.
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave11 dock)');
ctx.world.credits = 5000;
dockAtCurrentStation('dock verge (wave11 keeper service)'); // The Vigil
const keeperTrustBeforeE = vergeKeeper11?.trust;
if (vergeKeeper11) vergeKeeper11.trust = 60;
dispatchKey('Digit1'); // market (DOCK_KEY_SERVICES[0])
const priceCellWaived = marketRowCell('Provisions', 2);
const expectedWaived = Math.round(ctx.world.prices.provisions * (hollowFx9().buyMult ?? 1));
const creditsBeforeWaivedBuy = ctx.world.credits;
const buyBtnWaived = marketTradeButton('Provisions', '+1');
buyBtnWaived?.click(); // real path: stub-DOM click → tryTrade('provisions', 1, true)
const waivedCharged = creditsBeforeWaivedBuy - ctx.world.credits;
// Trust back below 60: the full hermit markup returns (panel re-rendered via
// a fresh service open — the wave-4 Escape-then-digit pattern).
if (vergeKeeper11) vergeKeeper11.trust = 30;
dispatchKey('Escape'); // market → services
dispatchKey('Digit1'); // market
const priceCellFull = marketRowCell('Provisions', 2);
const expectedFull11 = Math.round(ctx.world.prices.provisions * (hollowFx9().buyMult ?? 1) * HERMIT.buyMult);
// Sell one back (bought above): epic sellMult × rank goodwill × the hermit
// premium — the sell side is unchanged by the keeper waiver.
const expectedSell11 = Math.round(ctx.world.prices.provisions * (hollowFx9().sellMult ?? 1) * goodwill9() * HERMIT.sellMult * 1);
const creditsBeforeSell11 = ctx.world.credits;
const sellBtn11 = marketTradeButton('Provisions', '−1');
sellBtn11?.click();
const sellPaid11 = ctx.world.credits - creditsBeforeSell11;
if (vergeKeeper11) vergeKeeper11.trust = keeperTrustBeforeE; // self-cleaning
const w11serviceChecks = {
  waivedPriceCell: priceCellWaived?.textContent === `${expectedWaived} UU`,
  waivedBuyButtonFound: !!buyBtnWaived,
  waivedChargedExact: waivedCharged === expectedWaived,
  fullPriceCellReturns: priceCellFull?.textContent === `${expectedFull11} UU`,
  sellButtonFound: !!sellBtn11,
  sellPremiumUnchanged: sellPaid11 === expectedSell11,
};
console.log('wave11 keeper service:', JSON.stringify(w11serviceChecks), `waived=${waivedCharged} full=${expectedFull11} sell=${sellPaid11}`);
if (!Object.values(w11serviceChecks).every(Boolean)) { console.log('WAVE11 KEEPER SERVICE FAIL'); errors++; }

// -- f. keeper comp: 'Call in a favor' zeroes the repair bill (real UI) -----
// Still docked at The Vigil; the verge keeper holds +1 favor from the vouch.
// The favor button lives on the keeper's card in the people service (the
// wave-4 fence pattern, scoped to the card titled with his name); the repair
// flow is the hotfix repair-pricing path. Damage is set explicitly — hull
// was pinned huge — so an uncomped bill would be nonzero and deterministic.
const rp11 = ctx.player;
rp11.hull = rp11.hullMax - 120;
dispatchKey('Escape'); // market → services
dispatchKey('Digit7'); // people (DOCK_KEY_SERVICES[6])
let keeperFavorBtn = null;
{
  const ov = stationOverlay();
  if (ov) for (const n of walkDom(ov)) {
    if (n.textContent !== vergeKeeper11?.name || !n.parent) continue;
    for (let card = n.parent; card && card !== ov; card = card.parent) {
      const btn = [...walkDom(card)].find((d) => d.tagName === 'BUTTON' && /call in a favor/i.test(d.textContent ?? ''));
      if (btn) { keeperFavorBtn = btn; break; }
    }
    if (keeperFavorBtn) break;
  }
}
keeperFavorBtn?.click(); // real path: spendFavor → per-session keeper comp
dispatchKey('Escape'); // people → services
dispatchKey('Digit5'); // repair service (DOCK_KEY_SERVICES[4])
tick(2, 'wave11 repair screen (comped)');
let repairBtn11 = null;
{
  const ov = stationOverlay();
  if (ov) for (const n of walkDom(ov)) {
    if (n.tagName === 'BUTTON' && typeof n.textContent === 'string' && n.textContent.startsWith('1 — Repair all')) { repairBtn11 = n; break; }
  }
}
const labelCost11 = repairBtn11 ? Number((repairBtn11.textContent.match(/\((\d+) UU\)/) ?? [])[1]) : NaN;
const breakdownMentionsKeepers = [...walkDom(stationOverlay() ?? { children: [] })]
  .some((n) => typeof n.textContent === 'string' && /keepers/i.test(n.textContent));
const creditsBeforeCompRepair = ctx.world.credits;
repairBtn11?.click();
tick(1, 'wave11 comped repair settle');
const w11compChecks = {
  favorButtonFound: !!keeperFavorBtn,
  compedTotalZero: labelCost11 === 0,
  breakdownMentionsKeepers,
  creditsUnchanged: ctx.world.credits === creditsBeforeCompRepair,
  madeWhole: rp11.hull === rp11.hullMax,
};
console.log('wave11 keeper comp:', JSON.stringify(w11compChecks), `label=${labelCost11}`);
if (!Object.values(w11compChecks).every(Boolean)) { console.log('WAVE11 KEEPER COMP FAIL'); errors++; }

// -- g. save roundtrip: callowReturns/vouched ride recordBanks --------------
// The wave-10 save pattern, continuing run at The Vigil. Test SETUP: park
// live hostiles so neither the undock nor the dock autosave is
// combat-blocked.
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave11 save)');
undockStation(); // leave The Vigil so the re-dock fires a fresh autosave
dockAtCurrentStation('dock verge (wave11 save)'); // 'docked' fires trySave
tick(3, 'wave11 save settle');
const w11snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const callowSaved = (w11snap?.world?.recordBanks?.verge ?? []).find((r) => r.name === 'Old Callow') ?? null;
const w11saveChecks = {
  saveWritten: !!w11snap?.world,
  systemIsVerge: w11snap?.world?.currentSystem === 'verge',
  callowInSavedBank: !!callowSaved,
  vouchedPersisted: callowSaved?.vouched === true,
  returnsPersisted: callowSaved?.callowReturns === callowReturnsBase + 2,
};
console.log('wave11 save fields:', JSON.stringify(w11saveChecks));
if (!Object.values(w11saveChecks).every(Boolean)) { console.log('WAVE11 SAVE FIELDS FAIL'); errors++; }

// Corrupt in memory, die, recover from the dock autosave (Enter skips the
// hold synchronously — the wave-5 death path). The restore swaps recordBanks
// wholesale, so Callow is re-found through ctx.world.recordBanks.
const callowG = (ctx.world.recordBanks?.verge ?? []).find((r) => r.name === 'Old Callow') ?? null;
if (callowG) { callowG.vouched = false; callowG.callowReturns = 0; }
tick(2, 'wave11 fields corrupted');
const w11corrupted = !!callowG && callowG.vouched === false && callowG.callowReturns === 0;
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave11 restore)');
dispatchKey('Enter'); // recover(): restore(last save)
const callowRestored = (ctx.world.recordBanks?.verge ?? []).find((r) => r.name === 'Old Callow') ?? null;
const w11restoreChecks = {
  corruptedFirst: w11corrupted,
  callowInRestoredBank: !!callowRestored,
  vouchedRestored: callowRestored?.vouched === true,
  returnsRestored: callowRestored?.callowReturns === callowReturnsBase + 2,
};
console.log('wave11 restore:', JSON.stringify(w11restoreChecks));
if (!Object.values(w11restoreChecks).every(Boolean)) { console.log('WAVE11 RESTORE FAIL'); errors++; }

// ---- Wave 12: Callow's books / keeper clue tier / restore live-record heal ----
// The continuing run sits DOCKED AT THE VIGIL IN THE VERGE (the wave-11 g
// death-restore): the restored verge bank's Old Callow carries vouched ===
// true and callowReturns === callowReturnsBase + 2. A hops verge → hush →
// verge twice through the real sim — post-vouch returns voice
// vouchedReturnLines on the SAME callowReturns cursor, and a hail press is
// refused (one rotating refuseLines commLine per verge visit, never a
// card, re-armed only by a real verge arrival). B exercises the keeper
// ledger's clue tier with pure calls. C closes with the restore-time
// live-record heal roundtrip. The hull is still pinned 1e9 from the
// wave-11 setup, so random soak combat can't eat the digit dispatches.

// -- a. Callow keeps books: vouched returns + the once-per-visit refusal ---
if (ctx.flags.docked) undockStation(); // leave The Vigil (wave-11 restore dock)
const rv12 = new THREE.Vector3();
const callowRec12 = (ctx.world.recordBanks?.verge ?? []).find((r) => r.name === 'Old Callow') ?? null;
if (callowRec12 && (callowRec12.state === 'dead' || callowRec12.state === 'captured')) callowRec12.state = 'enroute';
// Baseline-relative, the wave-11 returns discipline: callowReturns rode the
// record through the wave-11 g restore (callowReturnsBase + 2), and
// callowRefusals already stands at 1 — the wave-11 c second-hail watch
// pressed KeyH against a vouched Callow whose refusal flag was still armed
// from the wave-11 b return-2 arrival, drawing refusal #1 there.
const returnsBase12 = callowRec12?.callowReturns ?? 0;
const refusalsBase12 = callowRec12?.callowRefusals ?? 0;
// Round trip 1: verge → hush → verge arms one return line AND one refusal.
ctx.ship.object.position.set(...vergeReturnGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at hush gate (wave12 books 1)');
ctx.emit('jumpRequested', { to: 'hush' });
if (!tickUntilJumpDone('hush', 'wave12 hop to hush (books 1)')) {
  console.log('WAVE12 TRAVEL FAIL — never arrived at hush');
  errors++;
}
ctx.ship.object.position.set(...vergeGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at verge gate (wave12 books 1)');
// Whole-leg collection — the return beat can fire AT THE ARRIVAL GATE
// during the jump-settle ticks (his lane passes within 350u of it).
const bookEvs1 = [];
ctx.emit('jumpRequested', { to: 'verge' });
let arrivedVerge12a = false;
for (let i = 0; i < 60 * 10; i++) {
  tick(1, 'wave12 hop to verge (books 1)');
  bookEvs1.push(...ctx.lastEvents);
  if (ctx.world.currentSystem === 'verge' && !ctx.gate.jumping) { arrivedVerge12a = true; break; }
}
if (!arrivedVerge12a) {
  console.log('WAVE12 TRAVEL FAIL — never arrived at verge');
  errors++;
}
if (callowRec12) {
  recordPosition(callowRec12, rv12); // re-read — the route drifts
  ctx.ship.object.position.copy(rv12);
  ctx.ship.velocity.set(0, 0, 0);
}
for (let i = 0; i < 3; i++) { tick(1, 'wave12 vouched return 1'); bookEvs1.push(...ctx.lastEvents); }
const isVouchedReturnLine = (e) => e.type === 'commLine' && e.from === 'Old Callow' && CALLOW.vouchedReturnLines.includes(e.text);
const isRefuseLine = (e) => e.type === 'commLine' && e.from === 'Old Callow' && CALLOW.refuseLines.includes(e.text);
const vouchedLines1 = bookEvs1.filter(isVouchedReturnLine);
for (let i = 0; i < 10; i++) { tick(1, 'wave12 vouched-return refire watch'); bookEvs1.push(...ctx.lastEvents); }
const vouchedLines1All = bookEvs1.filter(isVouchedReturnLine);
const returnsAfterVisit12a = callowRec12?.callowReturns; // snapshot BEFORE round trip 2 moves it
// His live ship is range-instantiated: single ticks parked on the lane.
let callowLive12 = ctx.ships.find((s) => s.record === callowRec12) ?? null;
for (let i = 0; i < 30 && !callowLive12; i++) {
  tick(1, 'wave12 callow instantiate');
  callowLive12 = ctx.ships.find((s) => s.record === callowRec12) ?? null;
}
// Refusal 1: armed by this visit's arrival — one commLine, never a card.
const refuseEvs1 = [];
dispatchKey('KeyH');
for (let i = 0; i < 3; i++) { tick(1, 'wave12 refusal 1'); refuseEvs1.push(...ctx.lastEvents); }
const refuseLines1 = refuseEvs1.filter(isRefuseLine);
const refusalsAfter12a = callowRec12?.callowRefusals;
// Same visit, second press: the per-visit throttle holds — silence.
const refuseEvsThrottle = [];
dispatchKey('KeyH');
for (let i = 0; i < 3; i++) { tick(1, 'wave12 refusal throttle'); refuseEvsThrottle.push(...ctx.lastEvents); }
// Round trip 2: a real verge arrival re-arms both beats.
ctx.ship.object.position.set(...vergeReturnGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at hush gate (wave12 books 2)');
ctx.emit('jumpRequested', { to: 'hush' });
if (!tickUntilJumpDone('hush', 'wave12 hop to hush (books 2)')) {
  console.log('WAVE12 TRAVEL FAIL — never arrived at hush');
  errors++;
}
ctx.ship.object.position.set(...vergeGate.position);
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at verge gate (wave12 books 2)');
const bookEvs2 = []; // whole-leg collection, same as round 1
ctx.emit('jumpRequested', { to: 'verge' });
let arrivedVerge12b = false;
for (let i = 0; i < 60 * 10; i++) {
  tick(1, 'wave12 hop to verge (books 2)');
  bookEvs2.push(...ctx.lastEvents);
  if (ctx.world.currentSystem === 'verge' && !ctx.gate.jumping) { arrivedVerge12b = true; break; }
}
if (!arrivedVerge12b) {
  console.log('WAVE12 TRAVEL FAIL — never arrived at verge');
  errors++;
}
if (callowRec12) {
  recordPosition(callowRec12, rv12); // re-read after the hops — the route drifts
  ctx.ship.object.position.copy(rv12);
  ctx.ship.velocity.set(0, 0, 0);
}
for (let i = 0; i < 3; i++) { tick(1, 'wave12 vouched return 2'); bookEvs2.push(...ctx.lastEvents); }
const vouchedLines2 = bookEvs2.filter(isVouchedReturnLine);
// The jump emptied ctx.ships at the midpoint — poll for his live ship again.
callowLive12 = ctx.ships.find((s) => s.record === callowRec12) ?? null;
for (let i = 0; i < 30 && !callowLive12; i++) {
  tick(1, 'wave12 callow re-instantiate');
  callowLive12 = ctx.ships.find((s) => s.record === callowRec12) ?? null;
}
// Refusal 2: the re-armed flag fires the next rotating refuseLines entry.
const refuseEvs2 = [];
dispatchKey('KeyH');
for (let i = 0; i < 3; i++) { tick(1, 'wave12 refusal 2'); refuseEvs2.push(...ctx.lastEvents); }
const refuseLines2 = refuseEvs2.filter(isRefuseLine);
const w12booksChecks = {
  vouchedPrecondition: callowRec12?.vouched === true,
  returnsBaseline: returnsBase12 === callowReturnsBase + 2, // rode the wave-11 g restore
  refusalsBaselineFromWave11: refusalsBase12 === 1, // the wave-11 c second hail drew refusal #1
  vouchedLinesShape: Array.isArray(CALLOW.vouchedReturnLines) && CALLOW.vouchedReturnLines.length === 3 &&
    CALLOW.vouchedReturnLines.every((l) => typeof l === 'string' && l.length > 0 && !CALLOW.returnLines.includes(l)),
  refuseLinesShape: Array.isArray(CALLOW.refuseLines) && CALLOW.refuseLines.length === 2 &&
    CALLOW.refuseLines.every((l) => typeof l === 'string' && l.length > 0),
  firstVouchedLineOnce: vouchedLines1.length === 1 && vouchedLines1[0]?.text === CALLOW.vouchedReturnLines[returnsBase12 % CALLOW.vouchedReturnLines.length],
  noOldReturnLines: !bookEvs1.some((e) => e.type === 'commLine' && e.from === 'Old Callow' && CALLOW.returnLines.includes(e.text)),
  noSecondLineSameVisit: vouchedLines1All.length === 1, // the per-visit guard holds across the refire watch
  returnsCursorAfterFirst: returnsAfterVisit12a === returnsBase12 + 1,
  liveShipFound: !!callowLive12,
  refusalFiredOnce: refuseLines1.length === 1 && refuseLines1[0]?.text === CALLOW.refuseLines[refusalsBase12 % CALLOW.refuseLines.length],
  refusalCursorAfterFirst: refusalsAfter12a === refusalsBase12 + 1,
  refusalNoHailCard: !refuseEvs1.some((e) => e.type === 'hailOpened'),
  secondPressSilent: !refuseEvsThrottle.some(isRefuseLine) && !refuseEvsThrottle.some((e) => e.type === 'hailOpened'),
  secondVouchedLineOnce: vouchedLines2.length === 1 && vouchedLines2[0]?.text === CALLOW.vouchedReturnLines[(returnsBase12 + 1) % CALLOW.vouchedReturnLines.length],
  refusalRearmedSecond: refuseLines2.length === 1 && refuseLines2[0]?.text === CALLOW.refuseLines[(refusalsBase12 + 1) % CALLOW.refuseLines.length],
  refusal2NoHailCard: !refuseEvs2.some((e) => e.type === 'hailOpened'),
  refusalsRotatedTwoTotal: callowRec12?.callowRefusals === refusalsBase12 + 2,
  returnsCursorAfterSecond: callowRec12?.callowReturns === returnsBase12 + 2,
};
console.log('wave12 callow books:', JSON.stringify(w12booksChecks), `lines=${JSON.stringify(vouchedLines1All.map((e) => e.text))}|${JSON.stringify(vouchedLines2.map((e) => e.text))} refusals=${JSON.stringify(refuseLines1.map((e) => e.text))}|${JSON.stringify(refuseLines2.map((e) => e.text))}`);
if (!Object.values(w12booksChecks).every(Boolean)) { console.log('WAVE12 CALLOW BOOKS FAIL'); errors++; }

// -- b. keeper ledger tier 2: naming the systems with pages left open ------
// Pure calls, the wave-11 d discipline: trust pinned at the gate, every
// landmark witnessed, and mystery.found walked through one-unfound →
// all-unfound → all-found. All mutations restored in place before any
// further ticks so later sections aren't poisoned.
const ledgerContact12 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-verge-dockmaster') ?? null;
const trustBeforeLedger12 = ledgerContact12?.trust;
const visitedBefore12 = [...(ctx.world.mystery?.visited ?? [])];
const foundBefore12 = [...(ctx.world.mystery?.found ?? [])];
const ALL_CLUE_IDS = Object.values(SYSTEMS).flatMap((def) => (def.clues ?? []).map((c) => c.id));
const LEDGER2_RE = /^The second column balances\. A page stays open in (.+) — something there waits to be read\.$/;
const ledger2System = (line) => {
  const m = typeof line === 'string' ? line.match(LEDGER2_RE) : null;
  if (!m) return null;
  return Object.values(SYSTEMS).find((def) => def.name === m[1]) ?? null;
};
if (ledgerContact12) ledgerContact12.trust = KEEPER_LEDGER_TRUST;
for (const def of Object.values(SYSTEMS)) {
  for (const lm of def.landmarks ?? []) {
    if (!ctx.world.mystery.visited.includes(lm.id)) ctx.world.mystery.visited.push(lm.id);
  }
}
// One clue short: 'th_c_keeper' stays unfound — The Hush holds the open page.
const hushClue12 = (SYSTEMS.hush.clues ?? []).find((c) => c.id === 'th_c_keeper') ?? null;
ctx.world.mystery.found.length = 0;
ctx.world.mystery.found.push(...ALL_CLUE_IDS.filter((id) => id !== 'th_c_keeper'));
const clueTierLine = ledgerContact12 ? keeperLedgerLine(ctx, ledgerContact12) : null;
const clueTierSystem = ledger2System(clueTierLine);
// Every clue unfound: four systems hold open pages, successive calls rotate.
ctx.world.mystery.found.length = 0;
const foundAtRotation = [...ctx.world.mystery.found]; // empty — every authored clue is unfound
const rotLine1 = ledgerContact12 ? keeperLedgerLine(ctx, ledgerContact12) : null;
const rotLine2 = ledgerContact12 ? keeperLedgerLine(ctx, ledgerContact12) : null;
const rotSys1 = ledger2System(rotLine1);
const rotSys2 = ledger2System(rotLine2);
// All six found: the tier-3 closing line.
ctx.world.mystery.found.push(...ALL_CLUE_IDS);
const closingLine12 = ledgerContact12 ? keeperLedgerLine(ctx, ledgerContact12) : null;
// Restore in place — landmarks.js change-detects on length.
ctx.world.mystery.visited.length = 0;
ctx.world.mystery.visited.push(...visitedBefore12);
ctx.world.mystery.found.length = 0;
ctx.world.mystery.found.push(...foundBefore12);
if (ledgerContact12) ledgerContact12.trust = trustBeforeLedger12;
const w12ledgerChecks = {
  contactFound: !!ledgerContact12,
  sixCluesAuthored: ALL_CLUE_IDS.length === 6,
  clueTierShape: LEDGER2_RE.test(clueTierLine ?? ''),
  clueTierNamesHush: clueTierSystem?.id === 'hush' && clueTierSystem?.name === 'The Hush',
  clueTierNamesOnlySystem: typeof clueTierLine === 'string' && !clueTierLine.includes('th_c_keeper') &&
    !!hushClue12 && !clueTierLine.includes(hushClue12.line),
  rotationShape: LEDGER2_RE.test(rotLine1 ?? '') && LEDGER2_RE.test(rotLine2 ?? ''),
  rotationDiffers: !!rotSys1 && !!rotSys2 && rotSys1.id !== rotSys2.id,
  rotSys1HoldsUnfound: !!rotSys1 && (rotSys1.clues ?? []).some((c) => !foundAtRotation.includes(c.id)),
  rotSys2HoldsUnfound: !!rotSys2 && (rotSys2.clues ?? []).some((c) => !foundAtRotation.includes(c.id)),
  closingExact12: closingLine12 === 'Both columns balance at last — nothing waits, and nothing stays unread.',
};
console.log('wave12 keeper clue tier:', JSON.stringify(w12ledgerChecks), `clue=${JSON.stringify(clueTierLine)} rot=${JSON.stringify(rotLine1)}|${JSON.stringify(rotLine2)}`);
if (!Object.values(w12ledgerChecks).every(Boolean)) { console.log('WAVE12 KEEPER CLUE TIER FAIL'); errors++; }

// -- c. restore heal: live ships re-point at the restored bank -------------
// A same-system restore (death recovery) emits no 'systemLoaded', so only
// save.js healLiveRecords re-adopts the orphaned record refs and rebuilds
// the live flags. Keep Callow's live ship inside the despawn hysteresis
// (1400u) but OUTSIDE the encounter bubble (800u — a hostile any nearer
// blocks the dock autosave), snapshot via the dock autosave, die, recover,
// and read identity through ctx.world.recordBanks. Test SETUP: park every
// OTHER hostile far (the wave-11 save discipline).
for (const s of ctx.ships) {
  if (s === callowLive12) continue;
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
const vergeStation12 = SYSTEMS.verge.station.position;
if (callowLive12?.object) {
  callowLive12.object.position.set(vergeStation12[0] + 1000, vergeStation12[1], vergeStation12[2]);
  callowLive12.velocity?.set?.(0, 0, 0);
}
// No ticks between the teleport and the dock — the player jumps to the
// station inside dockAtCurrentStation, so no despawn window opens.
dockAtCurrentStation('dock verge (wave12 heal)'); // 'docked' fires trySave
tick(3, 'wave12 heal save settle');
const w12snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const callowSaved12 = (w12snap?.world?.recordBanks?.verge ?? []).find((r) => r.name === 'Old Callow') ?? null;
const liveShipBefore12 = ctx.ships.includes(callowLive12) ? callowLive12 : null;
const recordIdentityPre = !!liveShipBefore12 && liveShipBefore12.record === callowRec12;
// Die and recover: restore() swaps recordBanks wholesale (JSON duplicates),
// re-unifies the current-system bank, then heals the live ships' refs.
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave12 heal)');
dispatchKey('Enter'); // recover(): restore(last save) — same system, no 'systemLoaded'
const callowRestored12 = (ctx.world.recordBanks?.verge ?? []).find((r) => r.name === 'Old Callow') ?? null;
const liveShipAfter12 = ctx.ships.includes(callowLive12) ? callowLive12 : null;
// No record in ANY bank may carry live: true without a live ship referencing it.
const referencedRecords12 = new Set((ctx.ships ?? []).map((s) => s.record).filter(Boolean));
let orphanedLiveFlag12 = false;
for (const k in (ctx.world.recordBanks ?? {})) {
  const bank = ctx.world.recordBanks[k];
  if (!Array.isArray(bank)) continue;
  for (const rec of bank) {
    if (rec.live === true && !referencedRecords12.has(rec)) orphanedLiveFlag12 = true;
  }
}
const w12healChecks = {
  saveWritten: !!w12snap?.world && w12snap?.world?.currentSystem === 'verge',
  callowInSavedBank: !!callowSaved12,
  liveShipPresentPreRestore: !!liveShipBefore12,
  recordIdentityPreRestore: recordIdentityPre, // the live ship carried the in-memory bank record
  liveShipSurvivedRestore: !!liveShipAfter12,
  recordRepointed: !!liveShipAfter12 && !!callowRestored12 &&
    liveShipAfter12.record === callowRestored12 && liveShipAfter12.record !== callowRec12,
  restoredRecordLive: callowRestored12?.live === true,
  noOrphanedLiveFlags: !orphanedLiveFlag12,
};
console.log('wave12 restore heal:', JSON.stringify(w12healChecks));
if (!Object.values(w12healChecks).every(Boolean)) { console.log('WAVE12 RESTORE HEAL FAIL'); errors++; }

// ---- Wave 13: keeper vouch acknowledgment / ledger comp-tier narrowing ----
// The continuing run is wherever the wave-12 c death-restore left it (the
// dock autosave at The Vigil in the Verge): 'callowVouched' stands (bought
// in wave-11 c, carried through both restores). A exercises the new
// recognitionLine vouch tier with pure calls — once per hush/verge keeper,
// gated by the milestone and the comp tier, never at Hollowreach. B
// narrows the keeper ledger's tier 2 at trust 60: the open page names the
// landmark nearest its first unfound clue. Both subsections are pure
// calls on the wave-12 b discipline — trust pinned, every mutation
// restored in place before any further ticks so nothing downstream is
// poisoned (the summary lines follow; no further travel).

// -- a. keeper vouch acknowledgment: Callow's word, once per keeper -------
const VOUCH_ACK_LINE = "Callow's word arrived ahead of you — your name sits in our second column. The yard is yours.";
// The fall-through ship line is template-dependent: assert against the
// living-hull or shipName variant per ctx.world.shipName's actual value.
const shipLine13 = ctx.world.shipName
  ? `${ctx.world.shipName}, back on my pad. Good to see her in one piece.`
  : "The living hull — we'd know that ship anywhere. Welcome back.";
const vergeKeeper13 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-verge-dockmaster') ?? null;
const hushKeeper13 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-hush-dockmaster') ?? null;
const hollowKeeper13 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-hollowreach-dockmaster') ?? null;
const milestonesBefore13 = [...(ctx.world.milestones ?? [])];
// Snapshot every touched field, then clear any vouchAck an earlier render
// may have voiced (the wave-10 c deepAck discipline) and pin trust at 60.
const keeperSnap13 = [];
for (const k of [vergeKeeper13, hushKeeper13, hollowKeeper13]) {
  if (!k) continue;
  keeperSnap13.push({ k, trust: k.trust, hadAck: 'vouchAck' in k, ack: k.vouchAck });
  k.trust = 60;
  delete k.vouchAck;
}
const vergeVouchLine = vergeKeeper13 ? recognitionLine(ctx, vergeKeeper13) : null;
const vergeAckAfterFirst = vergeKeeper13?.vouchAck;
const vergeSecondLine = vergeKeeper13 ? recognitionLine(ctx, vergeKeeper13) : null;
const vergeAckAfterSecond = vergeKeeper13?.vouchAck;
const hushVouchLine = hushKeeper13 ? recognitionLine(ctx, hushKeeper13) : null;
const hushAckAfterFirst = hushKeeper13?.vouchAck;
// Hollowreach's keeper never got the letter: the system gate answers the
// ship line directly, vouchAck untouched.
const hollowLine13 = hollowKeeper13 ? recognitionLine(ctx, hollowKeeper13) : null;
const hollowAck13 = hollowKeeper13?.vouchAck;
// Below the comp tier the vouch never fires.
if (vergeKeeper13) { delete vergeKeeper13.vouchAck; vergeKeeper13.trust = KEEPER_LEDGER_TRUST; }
const lowTrustLine13 = vergeKeeper13 ? recognitionLine(ctx, vergeKeeper13) : null;
const lowTrustAck13 = vergeKeeper13?.vouchAck;
// The milestone is the witness: splice it out and the tier stays silent.
if (hushKeeper13) { delete hushKeeper13.vouchAck; hushKeeper13.trust = 60; }
const vouchIdx13 = ctx.world.milestones.indexOf('callowVouched');
if (vouchIdx13 >= 0) ctx.world.milestones.splice(vouchIdx13, 1);
const noMilestoneLine13 = hushKeeper13 ? recognitionLine(ctx, hushKeeper13) : null;
const noMilestoneAck13 = hushKeeper13?.vouchAck;
// Restore everything in place — the milestone list first, then the keepers.
ctx.world.milestones.length = 0;
ctx.world.milestones.push(...milestonesBefore13);
for (const s of keeperSnap13) {
  s.k.trust = s.trust;
  if (s.hadAck) s.k.vouchAck = s.ack; else delete s.k.vouchAck;
}
const w13vouchChecks = {
  milestoneStands: milestonesBefore13.includes('callowVouched'),
  keepersFound: !!vergeKeeper13 && !!hushKeeper13 && !!hollowKeeper13,
  vergeVouchExact: vergeVouchLine === VOUCH_ACK_LINE,
  vergeAckSet: vergeAckAfterFirst === true,
  vergeSecondShipLine: vergeSecondLine === shipLine13,
  vergeAckStaysTrue: vergeAckAfterSecond === true,
  hushVouchIndependent: hushVouchLine === VOUCH_ACK_LINE && hushAckAfterFirst === true,
  hollowShipLineDirect: hollowLine13 === shipLine13,
  hollowAckStaysFalsy: !hollowAck13,
  belowCompNoVouch: lowTrustLine13 !== VOUCH_ACK_LINE && !lowTrustAck13,
  noMilestoneNoVouch: noMilestoneLine13 !== VOUCH_ACK_LINE && !noMilestoneAck13,
};
console.log('wave13 keeper vouch ack:', JSON.stringify(w13vouchChecks), `verge=${JSON.stringify(vergeVouchLine)}|${JSON.stringify(vergeSecondLine)} hush=${JSON.stringify(hushVouchLine)} hollow=${JSON.stringify(hollowLine13)}`);
if (!Object.values(w13vouchChecks).every(Boolean)) { console.log('WAVE13 KEEPER VOUCH ACK FAIL'); errors++; }

// -- b. keeper ledger tier 2 at the comp tier: the page names its landmark -
// Same setup discipline as wave-12 b (it sits right above): the verge
// dockmaster, trust pinned, every landmark witnessed, mystery.found
// walked through one-unfound → all-unfound → all-found. The rotation
// still rides the single contact.ledgerIdx cursor. ALL_CLUE_IDS,
// LEDGER2_RE, and ledger2System are reused from wave-12 b.
const ledgerContact13 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-verge-dockmaster') ?? null;
const trustBeforeLedger13 = ledgerContact13?.trust;
const visitedBefore13 = [...(ctx.world.mystery?.visited ?? [])];
const foundBefore13 = [...(ctx.world.mystery?.found ?? [])];
const LEDGER2_NEAR_RE = /^The second column balances\. A page stays open in (.+) — the page near (.+) waits to be read\.$/;
const ledger2Near = (line) => {
  const m = typeof line === 'string' ? line.match(LEDGER2_NEAR_RE) : null;
  if (!m) return null;
  const def = Object.values(SYSTEMS).find((d) => d.name === m[1]) ?? null;
  return def ? { def, lmName: m[2] } : null;
};
// Expectations are COMPUTED, never hardcoded: squared distance over the
// position [x,y,z] arrays (first-wins on ties, the contacts.js order),
// and the first unfound clue rides the def.clues order.
const nearestLmName13 = (def, clue) => {
  let best = null;
  let bestD2 = Infinity;
  for (const lm of def?.landmarks ?? []) {
    const dx = lm.position[0] - clue.position[0];
    const dy = lm.position[1] - clue.position[1];
    const dz = lm.position[2] - clue.position[2];
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < bestD2) { bestD2 = d2; best = lm.name; }
  }
  return best;
};
const firstUnfound13 = (def, found) => (def?.clues ?? []).find((c) => !found.includes(c.id)) ?? null;
if (ledgerContact13) ledgerContact13.trust = 60;
for (const def of Object.values(SYSTEMS)) {
  for (const lm of def.landmarks ?? []) {
    if (!ctx.world.mystery.visited.includes(lm.id)) ctx.world.mystery.visited.push(lm.id);
  }
}
// One clue short at the comp tier: 'th_c_keeper' stays unfound — the page
// near The Hush's nearest landmark to that clue waits to be read.
const hushClue13 = (SYSTEMS.hush.clues ?? []).find((c) => c.id === 'th_c_keeper') ?? null;
ctx.world.mystery.found.length = 0;
ctx.world.mystery.found.push(...ALL_CLUE_IDS.filter((id) => id !== 'th_c_keeper'));
const nearLine13 = ledgerContact13 ? keeperLedgerLine(ctx, ledgerContact13) : null;
const nearParsed13 = ledger2Near(nearLine13);
const hushNearest13 = hushClue13 ? nearestLmName13(SYSTEMS.hush, hushClue13) : null;
// Same single-unfound state at KEEPER_LEDGER_TRUST: the OLD tier-2 shape
// still comes back — the narrowing is gated at 60.
if (ledgerContact13) ledgerContact13.trust = KEEPER_LEDGER_TRUST;
const lowTierLine13 = ledgerContact13 ? keeperLedgerLine(ctx, ledgerContact13) : null;
const lowTierSystem13 = ledger2System(lowTierLine13);
// Every clue unfound at the comp tier: successive calls rotate systems,
// each naming its own nearest landmark to its first unfound clue.
if (ledgerContact13) ledgerContact13.trust = 60;
ctx.world.mystery.found.length = 0;
const foundAtRotation13 = [...ctx.world.mystery.found]; // empty — every authored clue is unfound
const rot13Line1 = ledgerContact13 ? keeperLedgerLine(ctx, ledgerContact13) : null;
const rot13Line2 = ledgerContact13 ? keeperLedgerLine(ctx, ledgerContact13) : null;
const rot13P1 = ledger2Near(rot13Line1);
const rot13P2 = ledger2Near(rot13Line2);
const rot13Clue1 = rot13P1 ? firstUnfound13(rot13P1.def, foundAtRotation13) : null;
const rot13Clue2 = rot13P2 ? firstUnfound13(rot13P2.def, foundAtRotation13) : null;
// All six found: the tier-3 closing line is unchanged.
ctx.world.mystery.found.push(...ALL_CLUE_IDS);
const closingLine13 = ledgerContact13 ? keeperLedgerLine(ctx, ledgerContact13) : null;
// Restore in place — landmarks.js change-detects on length.
ctx.world.mystery.visited.length = 0;
ctx.world.mystery.visited.push(...visitedBefore13);
ctx.world.mystery.found.length = 0;
ctx.world.mystery.found.push(...foundBefore13);
if (ledgerContact13) ledgerContact13.trust = trustBeforeLedger13;
const w13ledgerChecks = {
  contactFound: !!ledgerContact13,
  hushClueAuthored: !!hushClue13 && Array.isArray(hushClue13?.position),
  nearShape: LEDGER2_NEAR_RE.test(nearLine13 ?? ''),
  nearNamesHush: nearParsed13?.def?.id === 'hush' && nearParsed13?.def?.name === 'The Hush',
  nearNamesNearestLm: !!hushNearest13 && nearParsed13?.lmName === hushNearest13,
  nearLmBelongsToHush: !!nearParsed13 && (SYSTEMS.hush.landmarks ?? []).some((l) => l.name === nearParsed13.lmName),
  nearNoLeak: typeof nearLine13 === 'string' && !nearLine13.includes('th_c_keeper') &&
    !!hushClue13 && !nearLine13.includes(hushClue13.line),
  compGateOldShape: LEDGER2_RE.test(lowTierLine13 ?? ''),
  compGateNamesHush: lowTierSystem13?.id === 'hush',
  rotationShape: LEDGER2_NEAR_RE.test(rot13Line1 ?? '') && LEDGER2_NEAR_RE.test(rot13Line2 ?? ''),
  rotationDiffers: !!rot13P1 && !!rot13P2 && rot13P1.def.id !== rot13P2.def.id,
  rot1NearestInSystem: !!rot13P1 && !!rot13Clue1 && rot13P1.lmName === nearestLmName13(rot13P1.def, rot13Clue1) &&
    (rot13P1.def.landmarks ?? []).some((l) => l.name === rot13P1.lmName),
  rot2NearestInSystem: !!rot13P2 && !!rot13Clue2 && rot13P2.lmName === nearestLmName13(rot13P2.def, rot13Clue2) &&
    (rot13P2.def.landmarks ?? []).some((l) => l.name === rot13P2.lmName),
  closingExact13: closingLine13 === 'Both columns balance at last — nothing waits, and nothing stays unread.',
};
console.log('wave13 keeper ledger comp tier:', JSON.stringify(w13ledgerChecks), `near=${JSON.stringify(nearLine13)} low=${JSON.stringify(lowTierLine13)} rot=${JSON.stringify(rot13Line1)}|${JSON.stringify(rot13Line2)}`);
if (!Object.values(w13ledgerChecks).every(Boolean)) { console.log('WAVE13 KEEPER LEDGER COMP TIER FAIL'); errors++; }

// ---- Wave 14: vouch arrival comms / keeper chart mark ----
// The continuing run is docked at The Vigil in the Verge (the wave-12 c
// death-restore; wave-13 was pure calls): 'callowVouched' stands, every
// vouchAck flag was restored absent, and natural keeper trust is 15, so
// nothing new fires before the pins below. A exercises keeperVouchArrival
// pure (exactly the recognitionLine vouch tier's gates, the SAME flag).
// B makes the real verge → hush jump and hears Keeper Ond voice Callow's
// word on the arrival comms — the people card then falls through to the
// ship line, and the verge keeper's flag stays his own. C proves a
// same-system 'systemLoaded' re-emit is no arrival. D exercises
// keeperChartMark pure (tier-2 only, comp tier only, §25 no-leak, any
// ledger keeper, never a freehold dockmaster). E undocks/redocks at
// Threshold for the real 'docked' wiring. VOUCH_ACK_LINE, nearestLmName13,
// and ALL_CLUE_IDS ride from waves 12–13 — the same discipline throughout:
// snapshot every touched field, restore every mutation in place before
// further ticks.
// Test SETUP: re-pin the hull huge — the wave-12 c death-restore returned
// the class maxes, and random soak combat killing the player mid-section
// would eat the dock/undock key dispatches (the wave-11 discipline).
ctx.player.hullMax = 1e9;
ctx.player.hull = 1e9;

// -- a. vouch arrival, pure gates -------------------------------------------
// keeperVouchArrival: a hush/verge dockmaster (Hollowreach NEVER — its
// keeper never got the letter), the 'callowVouched' milestone standing,
// the comp tier (literal 60), and !contact.vouchAck. On fire it sets the
// flag and returns the shared VOUCH_ACK_LINE. Snapshot trust + vouchAck
// on all three keepers and the milestone list; restore in place.
const vergeKeeper14 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-verge-dockmaster') ?? null;
const hushKeeper14 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-hush-dockmaster') ?? null;
const hollowKeeper14 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-hollowreach-dockmaster') ?? null;
const milestonesBefore14 = [...(ctx.world.milestones ?? [])];
const keeperSnap14 = [];
for (const k of [vergeKeeper14, hushKeeper14, hollowKeeper14]) {
  if (!k) continue;
  keeperSnap14.push({ k, trust: k.trust, hadAck: 'vouchAck' in k, ack: k.vouchAck });
  delete k.vouchAck; // clear any flag an earlier render may have voiced (wave-13 a)
}
// Hollowreach's keeper never got the letter: the system gate answers null,
// flag untouched, even at the comp tier with the milestone standing.
if (hollowKeeper14) hollowKeeper14.trust = 60;
const hollowArrLine14 = hollowKeeper14 ? keeperVouchArrival(ctx, hollowKeeper14) : undefined;
const hollowArrAck14 = hollowKeeper14?.vouchAck;
// Below the comp tier the word never carries.
if (hushKeeper14) hushKeeper14.trust = 59;
const lowTrustArrLine14 = hushKeeper14 ? keeperVouchArrival(ctx, hushKeeper14) : undefined;
const lowTrustArrAck14 = hushKeeper14?.vouchAck;
// The milestone is the witness: splice it out and the comms stay silent.
if (hushKeeper14) hushKeeper14.trust = 60;
const vouchIdx14 = ctx.world.milestones.indexOf('callowVouched');
if (vouchIdx14 >= 0) ctx.world.milestones.splice(vouchIdx14, 1);
const noMilestoneArrLine14 = hushKeeper14 ? keeperVouchArrival(ctx, hushKeeper14) : undefined;
const noMilestoneArrAck14 = hushKeeper14?.vouchAck;
ctx.world.milestones.length = 0;
ctx.world.milestones.push(...milestonesBefore14);
// Milestone standing at the comp tier: the exact shared line, the flag
// set — and the immediate second call reads the flag and stays silent.
const hushArrLine14 = hushKeeper14 ? keeperVouchArrival(ctx, hushKeeper14) : null;
const hushArrAckAfter14 = hushKeeper14?.vouchAck;
const hushArrSecond14 = hushKeeper14 ? keeperVouchArrival(ctx, hushKeeper14) : undefined;
const hushArrAckAfterSecond14 = hushKeeper14?.vouchAck;
// Restore everything in place — the keepers (the milestone list rides above).
for (const s of keeperSnap14) {
  s.k.trust = s.trust;
  if (s.hadAck) s.k.vouchAck = s.ack; else delete s.k.vouchAck;
}
const w14arrivalChecks = {
  milestoneStands: milestonesBefore14.includes('callowVouched'),
  keepersFound: !!vergeKeeper14 && !!hushKeeper14 && !!hollowKeeper14,
  hollowNeverNull: hollowArrLine14 === null && !hollowArrAck14,
  belowCompNull: lowTrustArrLine14 === null && !lowTrustArrAck14,
  noMilestoneNull: noMilestoneArrLine14 === null && !noMilestoneArrAck14,
  hushArrivalExact: hushArrLine14 === VOUCH_ACK_LINE,
  hushAckSet: hushArrAckAfter14 === true,
  secondCallSilent: hushArrSecond14 === null && hushArrAckAfterSecond14 === true,
};
console.log('wave14 vouch arrival gates:', JSON.stringify(w14arrivalChecks), `hollow=${JSON.stringify(hollowArrLine14)} low=${JSON.stringify(lowTrustArrLine14)} hush=${JSON.stringify(hushArrLine14)}|${JSON.stringify(hushArrSecond14)}`);
if (!Object.values(w14arrivalChecks).every(Boolean)) { console.log('WAVE14 VOUCH ARRIVAL GATES FAIL'); errors++; }

// -- b. real arrival comms: verge → hush voices Callow's word once ----------
// The wave-11 B scripted-jump pattern: leave The Vigil, park on the verge
// gate to the hush, emit the request, and collect ctx.lastEvents across
// EVERY arrival frame — 'systemLoaded' fires at the jump midpoint and the
// keeper's commLine lands a frame later (contacts.update reads lastEvents).
// Trust pinned at the comp tier, vouchAck absent: the CHANGED
// 'systemLoaded' to the hush fires keeperVouchArrival through the real
// update() wiring. The people card then falls through to the ship line —
// the arrival already spent the flag (template-dependent: computed from
// ctx.world.shipName exactly as wave-13 a's shipLine13).
const shipLine14 = ctx.world.shipName
  ? `${ctx.world.shipName}, back on my pad. Good to see her in one piece.`
  : "The living hull — we'd know that ship anywhere. Welcome back.";
const isKeeperOndVouch14 = (e) => e.type === 'commLine' && e.from === 'Keeper Ond' && e.text === VOUCH_ACK_LINE;
const hushTrustBeforeArr14 = hushKeeper14?.trust;
const vergeTrustBeforeArr14 = vergeKeeper14?.trust;
if (hushKeeper14) { hushKeeper14.trust = 60; delete hushKeeper14.vouchAck; }
if (ctx.flags.docked) undockStation(); // leave The Vigil (wave-12 c restore dock)
ctx.ship.object.position.set(...vergeReturnGate.position); // verge → hush
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'at hush gate (wave14 arrival)');
const arrEvs14 = [];
ctx.emit('jumpRequested', { to: 'hush' });
let arrivedHush14 = false;
for (let i = 0; i < 60 * 10; i++) {
  tick(1, 'wave14 hop to hush');
  arrEvs14.push(...ctx.lastEvents);
  if (ctx.world.currentSystem === 'hush' && !ctx.gate.jumping) { arrivedHush14 = true; break; }
}
if (!arrivedHush14) {
  console.log('WAVE14 TRAVEL FAIL — never arrived at hush');
  errors++;
}
const arrVouchLines14 = arrEvs14.filter(isKeeperOndVouch14);
const arrAckAfter14 = hushKeeper14?.vouchAck;
// Refire watch: the flag stands, no second word on later frames.
const arrRefireEvs14 = [];
for (let i = 0; i < 10; i++) { tick(1, 'wave14 arrival refire watch'); arrRefireEvs14.push(...ctx.lastEvents); }
const arrRefireLines14 = arrRefireEvs14.filter(isKeeperOndVouch14);
// Dock at Threshold: the people card no longer carries the word — the
// recognition line is the plain ship line now. (The dock's keeperChartMark
// stays silent here: landmarks still await, so tier 2 is shut.)
dockAtCurrentStation('dock hush (wave14 arrival)');
const hushPeopleLine14 = hushKeeper14 ? recognitionLine(ctx, hushKeeper14) : null;
// Independence: the verge keeper's flag is his own — still falsy after the
// hush arrival, and his people card still holds the word (pure call at the
// pinned tier, restored right after).
const vergeAckIndependent14 = vergeKeeper14?.vouchAck;
if (vergeKeeper14) vergeKeeper14.trust = 60;
const vergePeopleLine14 = vergeKeeper14 ? recognitionLine(ctx, vergeKeeper14) : null;
// Restore both keepers in place — natural trust, flags absent.
if (vergeKeeper14) { vergeKeeper14.trust = vergeTrustBeforeArr14; delete vergeKeeper14.vouchAck; }
if (hushKeeper14) { hushKeeper14.trust = hushTrustBeforeArr14; delete hushKeeper14.vouchAck; }
const w14arrivalCommChecks = {
  arrivedHush: arrivedHush14 && ctx.world.currentSystem === 'hush',
  keeperOndNamed: hushKeeper14?.name === 'Keeper Ond',
  vouchCommLineOnce: arrVouchLines14.length === 1,
  ackSetByArrival: arrAckAfter14 === true,
  noRefire: arrRefireLines14.length === 0,
  peopleCardShipLine: hushPeopleLine14 === shipLine14,
  vergeFlagUntouched: !vergeAckIndependent14,
  vergeCardStillHolds: vergePeopleLine14 === VOUCH_ACK_LINE,
};
console.log('wave14 arrival comms:', JSON.stringify(w14arrivalCommChecks), `lines=${JSON.stringify(arrVouchLines14.map((e) => e.text))} people=${JSON.stringify(hushPeopleLine14)} verge=${JSON.stringify(vergePeopleLine14)}`);
if (!Object.values(w14arrivalCommChecks).every(Boolean)) { console.log('WAVE14 ARRIVAL COMMS FAIL'); errors++; }

// -- c. a same-system 'systemLoaded' re-emit is no arrival ------------------
// The module cursor (lastSystemId) answers the restore re-emit case: the
// run IS in the hush after b, so a re-emitted 'systemLoaded' to the hush
// is unchanged — the keeper stays silent and the flag stays falsy (the
// wave-11 callowVisitArmed discipline). Armed again, then restored.
const hushTrustBeforeReemit14 = hushKeeper14?.trust;
if (hushKeeper14) { hushKeeper14.trust = 60; delete hushKeeper14.vouchAck; }
const reemitEvs14 = [];
ctx.emit('systemLoaded', { to: ctx.world.currentSystem }); // 'hush' — the same system
for (let i = 0; i < 3; i++) { tick(1, 'wave14 same-system re-emit'); reemitEvs14.push(...ctx.lastEvents); }
const reemitKeeperLines14 = reemitEvs14.filter((e) => e.type === 'commLine' && e.from === 'Keeper Ond');
const reemitAck14 = hushKeeper14?.vouchAck;
if (hushKeeper14) { hushKeeper14.trust = hushTrustBeforeReemit14; delete hushKeeper14.vouchAck; }
const w14reemitChecks = {
  stillInHush: ctx.world.currentSystem === 'hush',
  noKeeperOndLine: reemitKeeperLines14.length === 0,
  ackStaysFalsy: !reemitAck14,
};
console.log('wave14 same-system re-emit:', JSON.stringify(w14reemitChecks), `keeperLines=${reemitKeeperLines14.length}`);
if (!Object.values(w14reemitChecks).every(Boolean)) { console.log('WAVE14 SAME-SYSTEM RE-EMIT FAIL'); errors++; }

// -- d. chart mark, pure gates ----------------------------------------------
// keeperChartMark turns the narrowed tier-2 page into a heading: only
// while every landmark is witnessed and unfound clues remain, it marks
// the FIRST open page (SYSTEMS key order) whose paired landmark id is not
// yet in mystery.charted — recorded state only, §25: the landmark and
// system names, never the clue's id or text. Pure calls on the hush
// keeper; trust/visited/found/charted all snapshotted and restored in
// place (charted via the hadCharted discipline — wave-13 a's hadAck).
const freeholdDm14 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-freehold-dockmaster') ?? null;
const mystery14 = ctx.world.mystery;
const markSnap14 = [];
for (const k of [hushKeeper14, hollowKeeper14, freeholdDm14]) {
  if (!k) continue;
  markSnap14.push({ k, trust: k.trust });
}
const visitedBefore14 = [...(mystery14?.visited ?? [])];
const foundBefore14 = [...(mystery14?.found ?? [])];
const hadCharted14 = mystery14 ? 'charted' in mystery14 : false;
const chartedBefore14 = [...(mystery14?.charted ?? [])];
// The expectation is COMPUTED, never hardcoded: the hush landmark nearest
// 'th_c_keeper' by squared distance over the position arrays (first-wins —
// nearestLmName13 rides from wave-13 b), the id read back off the authored
// table. The Hush's page is the only open one once 'th_c_keeper' is the
// single unfound clue.
const hushLmName14 = hushClue13 ? nearestLmName13(SYSTEMS.hush, hushClue13) : null;
const hushLm14 = (SYSTEMS.hush.landmarks ?? []).find((l) => l.name === hushLmName14) ?? null;
const markExpected14 = hushLmName14
  ? `A mark on your charts — ${hushLmName14}, in ${SYSTEMS.hush.name}. The page near it is yours to read.`
  : null;
// Natural state (landmarks still awaiting) at the comp tier: no mark, and
// the charts stay untouched.
if (hushKeeper14) hushKeeper14.trust = 60;
const naturalMarkLine14 = hushKeeper14 ? keeperChartMark(ctx, hushKeeper14) : undefined;
const naturalChartedUntouched14 = !!mystery14 && ('charted' in mystery14) === hadCharted14 &&
  JSON.stringify(mystery14.charted ?? []) === JSON.stringify(chartedBefore14);
// Every landmark witnessed and every clue found: tier 2 is shut — no open
// page, no mark.
for (const def of Object.values(SYSTEMS)) {
  for (const lm of def.landmarks ?? []) {
    if (!mystery14.visited.includes(lm.id)) mystery14.visited.push(lm.id);
  }
}
mystery14.found.length = 0;
mystery14.found.push(...ALL_CLUE_IDS);
const allFoundMarkLine14 = hushKeeper14 ? keeperChartMark(ctx, hushKeeper14) : undefined;
// One clue short ('th_c_keeper' — the wave-12/13 page) below the comp
// tier: the mark waits for 60.
mystery14.found.length = 0;
mystery14.found.push(...ALL_CLUE_IDS.filter((id) => id !== 'th_c_keeper'));
if (hushKeeper14) hushKeeper14.trust = 59;
const lowTrustMarkLine14 = hushKeeper14 ? keeperChartMark(ctx, hushKeeper14) : undefined;
// At the comp tier: the exact mark line, the landmark id lands on the
// charts, and the second call reads the charted page and stays silent.
if (hushKeeper14) hushKeeper14.trust = 60;
const markLine14 = hushKeeper14 ? keeperChartMark(ctx, hushKeeper14) : null;
const chartedAfterMark14 = [...(mystery14.charted ?? [])];
const secondMarkLine14 = hushKeeper14 ? keeperChartMark(ctx, hushKeeper14) : undefined;
// ANY ledger keeper can mark: with the charts restored blank, Hollowreach's
// keeper (trust pinned) turns the same page into the same heading.
if (hadCharted14) { mystery14.charted.length = 0; mystery14.charted.push(...chartedBefore14); }
else delete mystery14.charted;
if (hollowKeeper14) hollowKeeper14.trust = 60;
const hollowMarkLine14 = hollowKeeper14 ? keeperChartMark(ctx, hollowKeeper14) : null;
const chartedAfterHollow14 = [...(mystery14.charted ?? [])];
// A freehold dockmaster is no keeper: the system gate answers null even
// with tier-2 state standing, and the charts do not move.
if (freeholdDm14) freeholdDm14.trust = 60;
const freeholdMarkLine14 = freeholdDm14 ? keeperChartMark(ctx, freeholdDm14) : undefined;
const chartedAfterFreehold14 = [...(mystery14.charted ?? [])];
// Restore everything in place — landmarks.js change-detects on length.
mystery14.visited.length = 0;
mystery14.visited.push(...visitedBefore14);
mystery14.found.length = 0;
mystery14.found.push(...foundBefore14);
if (hadCharted14) { mystery14.charted.length = 0; mystery14.charted.push(...chartedBefore14); }
else delete mystery14.charted;
for (const s of markSnap14) s.k.trust = s.trust;
const w14markChecks = {
  keepersFound: !!hushKeeper14 && !!hollowKeeper14 && !!freeholdDm14,
  hushClueAuthored: !!hushClue13 && Array.isArray(hushClue13?.position),
  nearestLmComputed: !!hushLm14 && hushLm14.name === hushLmName14 && typeof hushLm14.id === 'string',
  naturalAwaitingNull: naturalMarkLine14 === null,
  naturalChartedUntouched: naturalChartedUntouched14,
  allFoundNull: allFoundMarkLine14 === null,
  belowCompMarkNull: lowTrustMarkLine14 === null,
  markExact: markLine14 === markExpected14,
  markChartedId: !!hushLm14 && chartedAfterMark14.length === 1 && chartedAfterMark14.includes(hushLm14.id),
  secondMarkNull: secondMarkLine14 === null,
  markNoLeak: typeof markLine14 === 'string' && !markLine14.includes('th_c_keeper') &&
    !!hushClue13 && !markLine14.includes(hushClue13.line),
  hollowCanMark: hollowMarkLine14 === markExpected14 && !!hushLm14 && chartedAfterHollow14.includes(hushLm14.id),
  freeholdNeverMarks: freeholdMarkLine14 === null &&
    JSON.stringify(chartedAfterFreehold14) === JSON.stringify(chartedAfterHollow14),
};
console.log('wave14 chart mark gates:', JSON.stringify(w14markChecks), `mark=${JSON.stringify(markLine14)} hollow=${JSON.stringify(hollowMarkLine14)} freehold=${JSON.stringify(freeholdMarkLine14)}`);
if (!Object.values(w14markChecks).every(Boolean)) { console.log('WAVE14 CHART MARK GATES FAIL'); errors++; }

// -- e. docked event path: one mark commLine per open page ------------------
// The real wiring: a 'docked' event makes the docked system's dockmaster
// run keeperChartMark and voice the line as a commLine. Tier-2 state
// pinned (every landmark witnessed, all clues but 'th_c_keeper' found,
// comp-tier trust, charts absent) with the run already in the hush:
// undock + redock at Threshold voices the mark exactly once and fills
// mystery.charted; a second cycle reads the charted page and stays silent.
// The cycle is inlined per tick (not the harness helpers) so EVERY frame's
// lastEvents ride the sink — contacts.update emits a frame after 'docked'.
const dockVisitedBefore14 = [...(mystery14?.visited ?? [])];
const dockFoundBefore14 = [...(mystery14?.found ?? [])];
const dockHadCharted14 = mystery14 ? 'charted' in mystery14 : false;
const dockChartedBefore14 = [...(mystery14?.charted ?? [])];
const dockTrustBefore14 = hushKeeper14?.trust;
for (const def of Object.values(SYSTEMS)) {
  for (const lm of def.landmarks ?? []) {
    if (!mystery14.visited.includes(lm.id)) mystery14.visited.push(lm.id);
  }
}
mystery14.found.length = 0;
mystery14.found.push(...ALL_CLUE_IDS.filter((id) => id !== 'th_c_keeper'));
delete mystery14.charted; // pin the charts blank — the dock must fill them
if (hushKeeper14) hushKeeper14.trust = 60;
const dockCycle14 = (label, sink) => {
  dispatchKey('Escape'); // level 2 backs out to services; level 1 launches
  if (ctx.flags.docked) dispatchKey('Escape');
  tick(1, `${label} undock`); sink.push(...ctx.lastEvents);
  tick(1, `${label} undock settle`); sink.push(...ctx.lastEvents);
  ctx.ship.object.position.set(...SYSTEMS.hush.station.position);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.input.dockPressed = true; // station.update reads the edge before controls clears it
  tick(1, `${label} dock`); sink.push(...ctx.lastEvents);
  ctx.input.dockPressed = false;
  tick(1, `${label} dock settle`); sink.push(...ctx.lastEvents);
  tick(1, `${label} dock settle 2`); sink.push(...ctx.lastEvents);
};
const dockEvs14a = [];
dockCycle14('wave14 mark cycle 1', dockEvs14a);
const dockKeeperLines14a = dockEvs14a.filter((e) => e.type === 'commLine' && e.from === 'Keeper Ond');
const dockMarkLines14a = dockKeeperLines14a.filter((e) => e.text === markExpected14);
const chartedAfterDock14 = [...(mystery14.charted ?? [])];
const dockEvs14b = [];
dockCycle14('wave14 mark cycle 2', dockEvs14b);
const dockMarkLines14b = dockEvs14b.filter((e) => e.type === 'commLine' && e.from === 'Keeper Ond' && e.text === markExpected14);
// Restore every pinned field in place before the final summary lines.
mystery14.visited.length = 0;
mystery14.visited.push(...dockVisitedBefore14);
mystery14.found.length = 0;
mystery14.found.push(...dockFoundBefore14);
if (dockHadCharted14) { mystery14.charted.length = 0; mystery14.charted.push(...dockChartedBefore14); }
else delete mystery14.charted;
if (hushKeeper14) hushKeeper14.trust = dockTrustBefore14;
const w14dockChecks = {
  dockedInHush: ctx.flags.docked === true && ctx.world.currentSystem === 'hush',
  markCommLineOnce: dockMarkLines14a.length === 1 && dockKeeperLines14a.length === 1,
  markCommLineExact: dockMarkLines14a[0]?.text === markExpected14,
  chartedGainedId: !!hushLm14 && chartedAfterDock14.includes(hushLm14.id),
  secondCycleSilent: dockMarkLines14b.length === 0,
};
console.log('wave14 docked chart mark:', JSON.stringify(w14dockChecks), `lines=${JSON.stringify(dockMarkLines14a.map((e) => e.text))} charted=${JSON.stringify(chartedAfterDock14)}`);
if (!Object.values(w14dockChecks).every(Boolean)) { console.log('WAVE14 DOCKED CHART MARK FAIL'); errors++; }

// ---- Wave 15: charted-page acknowledgment / chart-mark HUD markers ----
// Wave 14's keeperChartMark left a plain landmark-id list on the persisted
// mystery record (mystery.charted); wave 15 adds its two readers. A: the
// ledger's tier-2 open page, already charted, is acknowledged as the
// pilot's own mark — at and below the comp tier, with the uncharted lines
// byte-identical to waves 13/14. B: the HUD surfaces each charted-but-
// unvisited landmark of the current system as a POI marker (pool created
// at init, hidden while docked, labels on the throttled ~5 Hz text pass).
// Same discipline throughout: snapshot every touched field, restore every
// mutation in place (charted via the hadCharted presence discipline),
// every expectation COMPUTED off SYSTEMS. mystery14 (the live record),
// hushKeeper14 (natural trust restored), hushLm14, hushClue13,
// ALL_CLUE_IDS, LEDGER2_RE/LEDGER2_NEAR_RE, and the dock helpers all ride
// from waves 12–14. The run is docked at Threshold in the hush — wave-14
// e's end state — hull still pinned huge.

// -- a. ledger acknowledgment, pure gates (wave-14 d discipline) -----------
// Pin tier-2 on the hush keeper: every authored landmark witnessed (dedup
// push), every clue found but 'th_c_keeper' — The Hush's page is then the
// ONLY open page, so the ledgerIdx rotation always lands on it — trust
// pinned, charted controlled. Pure calls; nothing ticks between them.
const trustBefore15 = hushKeeper14?.trust;
const ledgerIdxBefore15 = hushKeeper14?.ledgerIdx;
const visitedBefore15 = [...(mystery14?.visited ?? [])];
const foundBefore15 = [...(mystery14?.found ?? [])];
const hadCharted15 = mystery14 ? 'charted' in mystery14 : false;
const chartedBefore15 = [...(mystery14?.charted ?? [])];
const chartedRef15 = mystery14?.charted ?? null; // restore the SAME array when the key stood
// COMPUTED off the authored tables (markExpected14's discipline) — the
// system name and the paired landmark name, never a hardcoded string.
const ackCompExpected15 = hushLm14
  ? `The second column balances. A page stays open in ${SYSTEMS.hush.name} — the mark near ${hushLm14.name} is yours now; the page waits to be read.`
  : null;
const ackBelowExpected15 =
  `The second column balances. A page stays open in ${SYSTEMS.hush.name} — the mark on your charts is yours now; the page waits to be read.`;
const unchartedCompExpected15 = hushLm14
  ? `The second column balances. A page stays open in ${SYSTEMS.hush.name} — the page near ${hushLm14.name} waits to be read.`
  : null;
const unchartedBelowExpected15 =
  `The second column balances. A page stays open in ${SYSTEMS.hush.name} — something there waits to be read.`;
for (const def of Object.values(SYSTEMS)) {
  for (const lm of def.landmarks ?? []) {
    if (!mystery14.visited.includes(lm.id)) mystery14.visited.push(lm.id);
  }
}
mystery14.found.length = 0;
mystery14.found.push(...ALL_CLUE_IDS.filter((id) => id !== 'th_c_keeper'));
// The hush page's paired landmark rides the charts (in place when the key
// already stands).
if ('charted' in mystery14) {
  mystery14.charted.length = 0;
  if (hushLm14) mystery14.charted.push(hushLm14.id);
} else {
  mystery14.charted = hushLm14 ? [hushLm14.id] : [];
}
// Comp tier with the mark on the charts: the exact acknowledgment.
if (hushKeeper14) hushKeeper14.trust = 60;
const ackCompLine15 = hushKeeper14 ? keeperLedgerLine(ctx, hushKeeper14) : null;
// One trust short, same charted state: the mark is still the pilot's own,
// but the landmark stays unnamed (the narrowing is gated at 60).
if (hushKeeper14) hushKeeper14.trust = 59;
const ackBelowLine15 = hushKeeper14 ? keeperLedgerLine(ctx, hushKeeper14) : null;
// Charts blank, same tier-2 state: the wave-13/14 lines come back
// BYTE-IDENTICAL — comp narrows to the page near the landmark, below the
// gate only the system is named.
if ('charted' in mystery14) mystery14.charted.length = 0;
if (hushKeeper14) hushKeeper14.trust = 60;
const unchartedCompLine15 = hushKeeper14 ? keeperLedgerLine(ctx, hushKeeper14) : null;
if (hushKeeper14) hushKeeper14.trust = 59;
const unchartedBelowLine15 = hushKeeper14 ? keeperLedgerLine(ctx, hushKeeper14) : null;
// Old saves carry no charted key: the ?? [] guard reads empty and the
// comp-tier call returns the uncharted narrowed line.
delete mystery14.charted;
if (hushKeeper14) hushKeeper14.trust = 60;
const oldSaveLine15 = hushKeeper14 ? keeperLedgerLine(ctx, hushKeeper14) : null;
// Restore everything in place — landmarks.js change-detects on length.
mystery14.visited.length = 0;
mystery14.visited.push(...visitedBefore15);
mystery14.found.length = 0;
mystery14.found.push(...foundBefore15);
if (hadCharted15) {
  mystery14.charted = chartedRef15 ?? [];
  mystery14.charted.length = 0;
  mystery14.charted.push(...chartedBefore15);
} else {
  delete mystery14.charted;
}
if (hushKeeper14) {
  hushKeeper14.trust = trustBefore15;
  if (ledgerIdxBefore15 !== undefined) hushKeeper14.ledgerIdx = ledgerIdxBefore15;
}
const w15ledgerChecks = {
  keeperKnown: !!hushKeeper14,
  hushLmKnown: !!hushLm14 && typeof hushLm14.id === 'string' && typeof hushLm14.name === 'string',
  ackCompExact: ackCompExpected15 !== null && ackCompLine15 === ackCompExpected15,
  ackBelowExact: ackBelowLine15 === ackBelowExpected15,
  ackBelowNamesNoLm: typeof ackBelowLine15 === 'string' && !!hushLm14 && !ackBelowLine15.includes(hushLm14.name),
  unchartedCompByteIdentical: unchartedCompExpected15 !== null && unchartedCompLine15 === unchartedCompExpected15 &&
    LEDGER2_NEAR_RE.test(unchartedCompLine15 ?? ''),
  unchartedBelowByteIdentical: unchartedBelowLine15 === unchartedBelowExpected15 &&
    LEDGER2_RE.test(unchartedBelowLine15 ?? ''),
  ackNoLeak: !!hushClue13 && [ackCompLine15, ackBelowLine15]
    .every((l) => typeof l === 'string' && !l.includes('th_c_keeper') && !l.includes(hushClue13.line)),
  oldSaveUncharted: oldSaveLine15 !== null && oldSaveLine15 === unchartedCompExpected15,
};
console.log('wave15 ledger charted ack:', JSON.stringify(w15ledgerChecks), `comp=${JSON.stringify(ackCompLine15)} below=${JSON.stringify(ackBelowLine15)} uncharted=${JSON.stringify(unchartedCompLine15)}|${JSON.stringify(unchartedBelowLine15)} old=${JSON.stringify(oldSaveLine15)}`);
if (!Object.values(w15ledgerChecks).every(Boolean)) { console.log('WAVE15 LEDGER CHARTED ACK FAIL'); errors++; }

// -- b. HUD chart markers, real DOM ----------------------------------------
// initHud's pool rides the #hud root (the harness's getElementById stub —
// NOT under document.body): one div.rw-chartmark per slot, each created
// with className 'rw-chartmark is-hidden', and visibility flips through
// classList only, so the stub's className string stays the creation value
// and classList carries the live state. Pin mystery.charted to exactly the
// hush page's landmark id and keep that id OUT of mystery.visited (splice
// if an earlier leg witnessed it — snapshot first). Every assertion reads
// the live stub DOM after real ticks.
const hudRoot15 = document.getElementById('hud');
const chartmarkBoxes15 = () => [...walkDom(hudRoot15 ?? { children: [] })]
  .filter((n) => typeof n.className === 'string' && n.className.split(' ').includes('rw-chartmark'));
const chartmarkLabel15 = (box) => (box?.children ?? []).find((c) => c.className === 'rw-chartmark-label') ?? null;
const visitedBefore15b = [...(mystery14?.visited ?? [])];
const hadCharted15b = mystery14 ? 'charted' in mystery14 : false;
const chartedBefore15b = [...(mystery14?.charted ?? [])];
const chartedRef15b = mystery14?.charted ?? null;
if ('charted' in mystery14) {
  mystery14.charted.length = 0;
  if (hushLm14) mystery14.charted.push(hushLm14.id);
} else {
  mystery14.charted = hushLm14 ? [hushLm14.id] : [];
}
const visitedIdx15 = hushLm14 ? mystery14.visited.indexOf(hushLm14.id) : -1;
if (visitedIdx15 >= 0) mystery14.visited.splice(visitedIdx15, 1);
// Docked at Threshold: the station screen is up — every marker stays hidden.
tick(2, 'wave15 chartmark docked');
const dockedBoxes15 = chartmarkBoxes15();
const dockedAllHidden15 = dockedBoxes15.length > 0 && dockedBoxes15.every((b) => b.classList.contains('is-hidden'));
// Undock and fly: exactly one marker shows — the hush page's landmark —
// its label naming the landmark (labels write on the ~5 Hz text pass, so
// the tick count spans a couple of text windows).
undockStation();
tick(15, 'wave15 chartmark flying');
const flyVisible15 = chartmarkBoxes15().filter((b) => !b.classList.contains('is-hidden'));
const flyLabelText15 = (flyVisible15.length === 1 ? chartmarkLabel15(flyVisible15[0]) : null)?.textContent ?? '';
// A witnessed landmark no longer needs the mark: the id joins
// mystery.visited and the marker hides again.
if (hushLm14 && !mystery14.visited.includes(hushLm14.id)) mystery14.visited.push(hushLm14.id);
tick(3, 'wave15 chartmark witnessed');
const witnessedAllHidden15 = chartmarkBoxes15().every((b) => b.classList.contains('is-hidden'));
// A charted id from ANOTHER system renders nothing here: unwitness the
// hush landmark, add veridian's first authored landmark to the charts —
// still exactly one marker, still the hush one.
const witnessedIdx15 = hushLm14 ? mystery14.visited.indexOf(hushLm14.id) : -1;
if (witnessedIdx15 >= 0) mystery14.visited.splice(witnessedIdx15, 1);
const veridianLm15 = (SYSTEMS.veridian.landmarks ?? []).find((l) => l.id !== hushLm14?.id) ?? null;
if (veridianLm15 && !mystery14.charted.includes(veridianLm15.id)) mystery14.charted.push(veridianLm15.id);
tick(15, 'wave15 chartmark cross-system');
const crossVisible15 = chartmarkBoxes15().filter((b) => !b.classList.contains('is-hidden'));
const crossLabelText15 = (crossVisible15.length === 1 ? chartmarkLabel15(crossVisible15[0]) : null)?.textContent ?? '';
// Re-dock at Threshold — the run ends where wave 14 left it — and restore
// every pinned field in place.
dockAtCurrentStation('dock hush (wave15 chartmark)');
const redockedHush15 = ctx.flags.docked === true && ctx.world.currentSystem === 'hush';
mystery14.visited.length = 0;
mystery14.visited.push(...visitedBefore15b);
if (hadCharted15b) {
  mystery14.charted = chartedRef15b ?? [];
  mystery14.charted.length = 0;
  mystery14.charted.push(...chartedBefore15b);
} else {
  delete mystery14.charted;
}
const w15hudChecks = {
  hudRootFound: !!hudRoot15,
  hushLmKnown: !!hushLm14 && typeof hushLm14.id === 'string',
  poolPresent: dockedBoxes15.length > 0,
  dockedAllHidden: dockedAllHidden15,
  oneVisibleFlying: flyVisible15.length === 1,
  labelNamesLandmark: !!hushLm14 && flyLabelText15.includes(hushLm14.name),
  labelHasDistance: /· \d/.test(flyLabelText15),
  witnessedHides: witnessedAllHidden15,
  veridianLmComputed: !!veridianLm15 && typeof veridianLm15.id === 'string',
  crossSystemStillOne: crossVisible15.length === 1 && !!hushLm14 && crossLabelText15.includes(hushLm14.name),
  redockedInHush: redockedHush15,
};
console.log('wave15 hud chart markers:', JSON.stringify(w15hudChecks), `label=${JSON.stringify(flyLabelText15)} cross=${JSON.stringify(crossLabelText15)}`);
if (!Object.values(w15hudChecks).every(Boolean)) { console.log('WAVE15 HUD CHART MARKERS FAIL'); errors++; }

// ---- Wave 16: chart marks on the keeper People card ---------------------
// chartedMarkNotes(ctx) (contacts.js) turns the wave-14 mystery.charted id
// list into display-ready { lmName, systemName } notes — charted but not
// yet witnessed, iterated in SYSTEMS key order then landmark-table order,
// stale ids ignored, old saves (no charted key) reading empty via the ?? []
// guard. station.js renders them ONLY on keeper People cards (the
// hollowreach/hush/verge dockmasters): one div.people-chart per card with
// a fixed title and one div.people-chart-line per note,
// `◇ lmName — systemName`. §25: names only — never a clue id or clue line.
// Same discipline throughout: snapshot every touched field, restore every
// mutation in place (charted via the hadCharted presence discipline —
// wave-15 a), every expectation COMPUTED off SYSTEMS. mystery14 (the live
// record), hushKeeper14 (natural trust), hushLm14, hushLmOther16 (the
// second authored hush page — intra-system ordering coverage), hushClue13,
// veridianLm15, and walkDom/stationOverlay all ride from waves 12–15. The
// run is docked at Threshold in the hush — wave-15 b's end state, overlay
// at the services level — hull still pinned huge.

// -- a. chartedMarkNotes, pure gates (wave-14 d discipline) ----------------
const visitedBefore16 = [...(mystery14?.visited ?? [])];
const hadCharted16 = mystery14 ? 'charted' in mystery14 : false;
const chartedBefore16 = [...(mystery14?.charted ?? [])];
const chartedRef16 = mystery14?.charted ?? null; // restore the SAME array when the key stood
// A second authored hush landmark: intra-system ordering is asserted
// against the authored landmark table below, never the charted push order.
const hushLmOther16 = (SYSTEMS.hush.landmarks ?? []).find((l) => l.id !== hushLm14?.id) ?? null;
// Both landmark ids stay OUT of visited (splice if an earlier leg witnessed
// them — restored below).
const unvisit16 = (id) => {
  if (typeof id !== 'string') return;
  const i = mystery14.visited.indexOf(id);
  if (i >= 0) mystery14.visited.splice(i, 1);
};
unvisit16(hushLm14?.id);
unvisit16(veridianLm15?.id);
unvisit16(hushLmOther16?.id);
// The expectation is COMPUTED, never hardcoded: SYSTEMS key order, then the
// authored landmark-table order — the contract's iteration order verbatim.
const expectedNotes16 = () => {
  const out = [];
  const chartedIds = mystery14?.charted ?? [];
  const visitedIds = mystery14?.visited ?? [];
  for (const def of Object.values(SYSTEMS)) {
    for (const lm of def.landmarks ?? []) {
      if (chartedIds.includes(lm.id) && !visitedIds.includes(lm.id)) {
        out.push({ lmName: lm.name, systemName: def.name });
      }
    }
  }
  return out;
};
// 1. The hush page alone on the charts: exactly one note, its own names.
if ('charted' in mystery14) {
  mystery14.charted.length = 0;
  if (hushLm14) mystery14.charted.push(hushLm14.id);
} else {
  mystery14.charted = hushLm14 ? [hushLm14.id] : [];
}
const notes16a = chartedMarkNotes(ctx);
const expected16a = expectedNotes16();
// 2. Both hush pages plus a cross-system id ride the charts, the hush
// pair pinned in REVERSE authored-table order: the notes still follow
// SYSTEMS key order, then the authored landmark-table order — an
// implementation ordering same-system marks by charted-array order
// fails here. The expectation iterates SYSTEMS/landmark tables (above);
// only the PIN reads the table's order.
const hushAuthored16 = (SYSTEMS.hush.landmarks ?? [])
  .filter((l) => l.id === hushLm14?.id || l.id === hushLmOther16?.id);
mystery14.charted.length = 0;
for (const lm of [...hushAuthored16].reverse()) mystery14.charted.push(lm.id);
if (veridianLm15) mystery14.charted.push(veridianLm15.id);
const notes16b = chartedMarkNotes(ctx);
const expected16b = expectedNotes16();
// 3. A witnessed mark is no longer waiting: the hush id joins visited —
// the OTHER hush page and the veridian page still wait.
if (hushLm14 && !mystery14.visited.includes(hushLm14.id)) mystery14.visited.push(hushLm14.id);
const notes16c = chartedMarkNotes(ctx);
const expected16c = expectedNotes16();
// 4. Stale ids read as nothing: an unauthored id joins the charts.
mystery14.charted.push('lm-stale-nowhere-16');
const notes16d = chartedMarkNotes(ctx);
// 5. Old saves carry no charted key: the ?? [] guard reads empty.
delete mystery14.charted;
const notes16e = chartedMarkNotes(ctx);
// Restore everything in place — landmarks.js change-detects on length.
mystery14.visited.length = 0;
mystery14.visited.push(...visitedBefore16);
if (hadCharted16) {
  mystery14.charted = chartedRef16 ?? [];
  mystery14.charted.length = 0;
  mystery14.charted.push(...chartedBefore16);
} else {
  delete mystery14.charted;
}
const w16helperChecks = {
  landmarksKnown: !!mystery14 && !!hushLm14 && typeof hushLm14.id === 'string' &&
    !!hushLmOther16 && typeof hushLmOther16.id === 'string' &&
    !!veridianLm15 && typeof veridianLm15.id === 'string',
  hushOnlyExact: notes16a.length === 1 && expected16a.length === 1 &&
    notes16a[0]?.lmName === hushLm14?.name && notes16a[0]?.systemName === SYSTEMS.hush.name,
  crossAndHushTableOrdered: notes16b.length === 3 && expected16b.length === 3 &&
    JSON.stringify(notes16b) === JSON.stringify(expected16b),
  visitedExcluded: notes16c.length === 2 && expected16c.length === 2 &&
    JSON.stringify(notes16c) === JSON.stringify(expected16c) &&
    notes16c.some((n) => n?.lmName === hushLmOther16?.name && n?.systemName === SYSTEMS.hush.name) &&
    notes16c.some((n) => n?.lmName === veridianLm15?.name && n?.systemName === SYSTEMS.veridian.name) &&
    !notes16c.some((n) => n?.lmName === hushLm14?.name),
  staleIgnored: JSON.stringify(notes16d) === JSON.stringify(notes16c),
  oldSaveEmpty: Array.isArray(notes16e) && notes16e.length === 0,
  restoredInPlace: JSON.stringify(mystery14.visited) === JSON.stringify(visitedBefore16) &&
    ('charted' in mystery14) === hadCharted16 &&
    JSON.stringify(mystery14.charted ?? []) === JSON.stringify(chartedBefore16),
};
console.log('wave16 chart mark notes:', JSON.stringify(w16helperChecks), `hush=${JSON.stringify(notes16a)} cross=${JSON.stringify(notes16b)} stale=${JSON.stringify(notes16d)} old=${JSON.stringify(notes16e)}`);
if (!Object.values(w16helperChecks).every(Boolean)) { console.log('WAVE16 CHART MARK NOTES FAIL'); errors++; }

// -- b. keeper People card chart marks, real DOM ---------------------------
// Pin the charts to the hush page plus veridian's first authored landmark,
// both unvisited; Digit7 opens the real People service (DOCK_KEY_SERVICES
// [6]) and Keeper Ond's card carries the ONLY chart note. A synthetic
// non-keeper fixer then joins the hush roster mid-leg: its card renders
// NO chart note while the keeper's still does (popped in place right
// after). Finally pin the charts to an already-witnessed landmark: the
// note never renders.
const visitedBefore16b = [...(mystery14?.visited ?? [])];
const hadCharted16b = mystery14 ? 'charted' in mystery14 : false;
const chartedBefore16b = [...(mystery14?.charted ?? [])];
const chartedRef16b = mystery14?.charted ?? null;
unvisit16(hushLm14?.id);
unvisit16(veridianLm15?.id);
if ('charted' in mystery14) {
  mystery14.charted.length = 0;
  if (hushLm14) mystery14.charted.push(hushLm14.id);
  if (veridianLm15) mystery14.charted.push(veridianLm15.id);
} else {
  mystery14.charted = [hushLm14?.id, veridianLm15?.id].filter((id) => typeof id === 'string');
}
const classHas16 = (n, cls) => typeof n.className === 'string' && n.className.split(' ').includes(cls);
tick(2, 'wave16 people settle');
dispatchKey('Digit7'); // people (DOCK_KEY_SERVICES[6])
const ov16 = stationOverlay();
const peopleCards16 = ov16 ? [...walkDom(ov16)].filter((n) => classHas16(n, 'people-card')) : [];
const keeperCard16 = peopleCards16.find((card) =>
  [...walkDom(card)].some((n) => classHas16(n, 'people-name') && n.textContent === hushKeeper14?.name)) ?? null;
const chartBoxes16 = ov16 ? [...walkDom(ov16)].filter((n) => classHas16(n, 'people-chart')) : [];
const chartInKeeper16 = chartBoxes16.length === 1 && !!keeperCard16 &&
  [...walkDom(keeperCard16)].includes(chartBoxes16[0]);
const chartTitle16 = chartBoxes16.length === 1
  ? ([...walkDom(chartBoxes16[0])].find((n) => classHas16(n, 'people-chart-title'))?.textContent ?? null)
  : null;
const chartLines16 = chartBoxes16.length === 1
  ? [...walkDom(chartBoxes16[0])].filter((n) => classHas16(n, 'people-chart-line')).map((n) => n.textContent)
  : [];
const expectedLines16 = expectedNotes16().map((t) => `◇ ${t.lmName} — ${t.systemName}`);
const chartText16 = [chartTitle16, ...chartLines16].filter((t) => typeof t === 'string').join('\n');
// Keeper-only exclusivity: a synthetic NON-keeper hush contact (a fixer)
// joins the roster with the marks still charted — its card must carry no
// .people-chart even while Keeper Ond's does (an implementation that drops
// the isKeeper gate fails here). Popped in place right after.
const contactsLen16 = ctx.world.contacts.length;
ctx.world.contacts.push({
  id: 'contact-w16-synthetic-fixer',
  name: 'Fixer Wren Sixteen',
  role: 'fixer',
  system: 'hush',
  trust: 0,
  favors: 0,
  metAt: null,
  rumorIdx: 0,
  ledgerIdx: 0,
});
dispatchKey('Escape'); // people → services
dispatchKey('Digit7'); // people again — re-rendered with the mixed roster
const ov16mixed = stationOverlay();
const mixedCards16 = ov16mixed ? [...walkDom(ov16mixed)].filter((n) => classHas16(n, 'people-card')) : [];
const synthCard16 = mixedCards16.find((card) =>
  [...walkDom(card)].some((n) => classHas16(n, 'people-name') && n.textContent === 'Fixer Wren Sixteen')) ?? null;
const keeperCardMixed16 = mixedCards16.find((card) =>
  [...walkDom(card)].some((n) => classHas16(n, 'people-name') && n.textContent === hushKeeper14?.name)) ?? null;
const chartInSynth16 = synthCard16
  ? [...walkDom(synthCard16)].filter((n) => classHas16(n, 'people-chart'))
  : null;
const chartBoxesMixed16 = ov16mixed ? [...walkDom(ov16mixed)].filter((n) => classHas16(n, 'people-chart')) : [];
// Restore the roster in place immediately — contactsForSystem filters live.
ctx.world.contacts.pop();
const contactsRestored16 = ctx.world.contacts.length === contactsLen16 &&
  !ctx.world.contacts.some((c) => c.id === 'contact-w16-synthetic-fixer');
// Every mark already witnessed: no page waits — the note never renders.
if ('charted' in mystery14) mystery14.charted.length = 0;
if (hushLm14) {
  mystery14.charted.push(hushLm14.id);
  if (!mystery14.visited.includes(hushLm14.id)) mystery14.visited.push(hushLm14.id);
}
dispatchKey('Escape'); // people → services
dispatchKey('Digit7'); // people again — re-rendered
const chartBoxesVisited16 = [...walkDom(stationOverlay() ?? { children: [] })]
  .filter((n) => classHas16(n, 'people-chart'));
// Restore every pinned field in place — the run stays docked at Threshold.
mystery14.visited.length = 0;
mystery14.visited.push(...visitedBefore16b);
if (hadCharted16b) {
  mystery14.charted = chartedRef16b ?? [];
  mystery14.charted.length = 0;
  mystery14.charted.push(...chartedBefore16b);
} else {
  delete mystery14.charted;
}
const w16domChecks = {
  dockedInHush: ctx.flags.docked === true && ctx.world.currentSystem === 'hush',
  peopleOpened: !!ov16 && [...walkDom(ov16)].some((n) => n.textContent === 'PEOPLE — who runs this dock'),
  keeperCardFound: !!keeperCard16,
  oneChartBox: chartBoxes16.length === 1,
  chartOnKeeperCard: chartInKeeper16,
  titleExact: chartTitle16 === 'CHART MARKS — pages still waiting',
  linesExact: chartLines16.length === 2 && expectedLines16.length === 2 &&
    JSON.stringify(chartLines16) === JSON.stringify(expectedLines16),
  noLeak: !!hushClue13 && !chartText16.includes('th_c_keeper') && !chartText16.includes(hushClue13.line),
  mixedRosterTwoCards: mixedCards16.length === 2 && !!synthCard16 && !!keeperCardMixed16,
  nonKeeperCardNoChart: Array.isArray(chartInSynth16) && chartInSynth16.length === 0,
  chartStillOnlyKeeper: chartBoxesMixed16.length === 1 && !!keeperCardMixed16 &&
    [...walkDom(keeperCardMixed16)].includes(chartBoxesMixed16[0]),
  contactsRestoredInPlace: contactsRestored16,
  visitedHides: chartBoxesVisited16.length === 0,
  restoredInPlace: JSON.stringify(mystery14.visited) === JSON.stringify(visitedBefore16b) &&
    ('charted' in mystery14) === hadCharted16b &&
    JSON.stringify(mystery14.charted ?? []) === JSON.stringify(chartedBefore16b),
};
console.log('wave16 people chart marks:', JSON.stringify(w16domChecks), `lines=${JSON.stringify(chartLines16)}`);
if (!Object.values(w16domChecks).every(Boolean)) { console.log('WAVE16 PEOPLE CHART MARKS FAIL'); errors++; }

console.log(errors === 0 ? 'BOOT TEST PASS — no update errors' : `BOOT TEST FAIL — ${errors} update errors`);
process.exit(errors === 0 ? 0 : 1);
