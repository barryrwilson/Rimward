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
// Wave 22: the junction "lantern" silhouette (hex frame + per-route arm
// lamps) checked inside the wave-21 hub flight — exactly one
// 'lamplighter-junction' group with routeCount/arm-lamp hooks while
// parked at freehold, userData.routeIndex tracking KeyG with wrap, no
// junction group in hub-less fh_hearth, and the group rebuilt on the
// freehold return leg.
// Wave 23: generated-system depth, part 1 — every generated system carries
// exactly one landmark ('<sysId>_lm', kind wreck|beacon|monument|anomaly,
// placed clear of station/gates/field/hub and inside the 1000u bubble)
// discovered by the real 100u proximity path at fh_hearth, the keeper
// ledger stays authored-lane only (an unwitnessed generated landmark never
// opens a second-column page), the three generated hubs
// (fx_bastion/gc_auction/blackstation) each answer contactsForSystem with
// exactly one dockmaster, and the generated mark + 103-contact roster
// (12 authored + 91 generated, wave 24) ride the dock autosave and
// death-restore.
// Wave 24: generated-system depth, part 2 — one plain dockmaster per
// generated non-hub system (fresh roster 12 → 103; data-driven unique
// names, zero keeper-gate reach even at trust 100, the People card at
// fh_hearth through the real dock UI), faction station services
// (FACTION_SERVICES — one modifier per generated banner, composed
// multiplicatively AFTER the epic multiplier, the authored six guarded
// out by id) driven through the REAL market/repair/jobs UI at fx_liron
// (ferrous repair ×0.85), lastbeacon (lamplighter buy ×0.85), and
// cg_vigil (congregation job pay ×1.2) with authored freehold as the
// negative control, and the dock-autosave + death-restore roundtrip at
// cg_vigil (roster 103, the generated dockmaster's name/trust survive).
// Wave 26: generated-system depth, part 4 — the generated dockmaster
// favor economy (a finished contract banks +1 favor once the post-bump
// trust reads GENERATED_KNOWN_TRUST, generated systems only, driven
// through real recovery cycles at fh_hearth below and at the gate with
// authored freehold at trust 100 as the negative control; a spent marker
// comps the yard session-scoped and speaks the faction's FACTION_COMP
// line through the real People/repair UI — no-marker notice, zeroed
// bill, undock reset — with the keeper line pinned verbatim at the
// nearer of hush/verge) and ferry/haul quote==pay (acceptJob stamps
// job.payQuoted off the DESTINATION chain; delivery pays exactly the
// snapshot on a live-picked discriminating lane; an accepted contract
// without the snapshot falls back to the live chain — the wave-6
// behavior; the snapshot and the banked favors ride the dock autosave
// and death-restore, roster 103 intact).
// Wave 27: Beautiful Ones organic technology — the grown look end-to-end:
// the organic.js toolkit shapes pure (sculpted-hull metadata, indexed
// petal/tendril geometry with normals+uvs, identity-cached shared
// materials, the collectOrganic/animateOrganic tag walk with a
// reducedMotion freeze), real spawnLiveShip meshes (beautiful freighter
// and pirate cutter named/tagged, the tarnished fallen-Beautiful variant,
// a veridian freighter negative control), the real 3-leg flight to
// bt_cradle (one 'beautiful-station' at the data position, every gate
// assembly overgrown with exactly 4 bud sprites, the landmark POI glazed
// with poiId/poiType/kind intact — freehold as the negative control), a
// real dock at The Cradle, the animation drive on the live station group
// (formula-exact sway/breath, frozen under reducedMotion, restored), and
// the dock-autosave + death-restore + same-system re-emit roundtrip (the
// station object survives, gates/landmarks rebuild with the overgrowth
// stable).
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';

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
const sessionStore = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (sessionStore.has(k) ? sessionStore.get(k) : null),
  setItem: (k, v) => sessionStore.set(k, String(v)),
  removeItem: (k) => sessionStore.delete(k),
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
  KEEPER_COMP_TRUST, GENERATED_KNOWN_TRUST,
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
const { initWakes } = await import('../src/systems/wakes.js'); // wave 30: flee wake trails + wreck-field discovery (same init slot as main.js)
const { initTitle } = await import('../src/systems/title.js'); // wave 40: title screen front door
const { initHud } = await import('../src/systems/hud.js');
const {
  ORGANIC, isBeautiful, sculptGrownHull, makePetalGeometry, makeTendrilGeometry,
  organicMaterials, tagSway, tagBreath, tagPulse, collectOrganic, animateOrganic,
} = await import('../src/systems/organic.js'); // wave 27: Beautiful Ones organic toolkit

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
const ctx = createCtx({ scene, camera, renderer });
const { SYSTEMS, RANK_LADDER, rankFor, ECON, BANDS, CONVERGENCE, DEEPENING, ACES, ORIGIN_ARCS, NAMED_GUNS, HERMIT, CALLOW, COMMODITIES, FACTION_SERVICES, FACTION_RECOGNITION, FACTION_RUMOR, FACTION_COMP, U, HIDDEN_MOUNTS, cargoValue } = await import('../src/game/state.js');
const { tickPrices } = await import('../src/game/market.js');
ctx.systems = SYSTEMS; // mirrors main.js boot line

const inits = [
  ['title', initTitle],
  ['starfield', initStarfield], ['solarsystem', initSolarSystem], ['asteroids', initAsteroids],
  ['station', initStation], ['landmarks', initLandmarks], ['gate', initGate], ['controls', initControls], ['settings', initSettings], ['bio', initBio],
  ['ship', initShip], ['world', initWorld], ['contacts', initContacts], ['mystery', initMystery], ['epics', initEpics], ['jump', initJump], ['traffic', initTraffic],
  ['npc', initNpc], ['combat', initCombat], ['pods', initPods], ['wakes', initWakes], ['hail', initHail],
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

// ---- Wave 40: title screen front door (must precede the wave-6 origin pick) --
// A fresh boot with no skip marker opens the title overlay and pauses. Dismiss
// it the way a player does — by CLICKING [1] NEW GAME. It has to be a click and
// not dispatchKey: in the browser the title's capture-phase listener stops a
// Digit1 from ever reaching origins.js, but this harness's synthetic event
// carries no stopImmediatePropagation, so a dispatched Digit1 would reach BOTH
// the title menu and the origin picker and steal the wave-6 pick.
// NEW GAME on a save-less boot deliberately leaves ctx.flags.paused alone —
// origins.js paused underneath and owns the unpause when the player picks.
function titleActionBtn(action) {
  for (const n of walkDom(document.body)) if (n.dataset?.titleAction === action) return n;
  return null;
}
const titleOverlayShown = [...walkDom(document.body)].some((n) => n.id === 'rw-title');
const pausedAtTitle = ctx.flags.paused === true;
titleActionBtn('new')?.click(); // [1] NEW GAME — a fresh harness boot has no autosave
const titleOverlayGone = ![...walkDom(document.body)].some((n) => n.id === 'rw-title');
const titleChecks = {
  overlayShown: titleOverlayShown,
  pausedWhileOpen: pausedAtTitle,
  overlayRemoved: titleOverlayGone,
  pauseLeftForOrigins: ctx.flags.paused === true,
};
console.log('wave40 title screen dismiss:', JSON.stringify(titleChecks));
if (!Object.values(titleChecks).every(Boolean)) { console.log('WAVE40 TITLE SCREEN FAIL'); errors++; }

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
// Wave 22: junction lantern silhouette hooks, while parked at the hub.
const w22junctionsAt = () => {
  const found = [];
  ctx.scene.traverse((o) => { if (o.name === 'lamplighter-junction') found.push(o); });
  return found;
};
const w22lampsIn = (g) => {
  let n = 0;
  g.traverse((o) => { if (o.name === 'junction-arm-lamp') n++; });
  return n;
};
const w22junction = w22junctionsAt();
const w22hubChecks = {
  singleJunction: w22junction.length === 1,
  routeCountHook: w22junction.length === 1
    && w22junction[0].userData.routeCount === SYSTEMS.freehold.hub.routes.length
    && SYSTEMS.freehold.hub.routes.length === 4,
  armLamps: w22junction.length === 1 && w22lampsIn(w22junction[0]) === fhRoutes.length,
};
// KeyG through the whole list in authored order, then once more to wrap.
{
  let cyclesInOrder = true;
  let wrapsToFirst = false;
  let routeIndexTracks = true;
  let routeIndexWraps = false;
  for (let i = 1; i <= fhRoutes.length; i++) {
    dispatchKey('KeyG');
    tick(1, 'wave21 junction cycle');
    const want = i % fhRoutes.length;
    if (ctx.gate.nearRouteIndex !== want || ctx.gate.nearTo !== fhRoutes[want]) cyclesInOrder = false;
    if (i === fhRoutes.length) wrapsToFirst = ctx.gate.nearRouteIndex === 0 && ctx.gate.nearTo === fhRoutes[0];
    // Wave 22: the junction group's userData mirror follows the same cadence.
    if (w22junction.length === 1) {
      if (w22junction[0].userData.routeIndex !== want) routeIndexTracks = false;
      if (i === fhRoutes.length) routeIndexWraps = w22junction[0].userData.routeIndex === 0;
    }
  }
  w21hubChecks.cyclesInOrder = cyclesInOrder;
  w21hubChecks.wrapsToFirst = wrapsToFirst;
  w22hubChecks.routeIndexTracks = w22junction.length === 1 && routeIndexTracks;
  w22hubChecks.routeIndexWraps = w22junction.length === 1 && routeIndexWraps;
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
// Wave 22: fh_hearth is hub-less — no junction group may survive the rebuild.
w22hubChecks.goneInHearth = w22junctionsAt().length === 0;
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
// Wave 22: back in freehold the systemLoaded rebuild must restore exactly
// one junction group with the full route hook set.
const w22junctionBack = w22junctionsAt();
w22hubChecks.rebuiltOnReturn = w22junctionBack.length === 1
  && w22junctionBack[0].userData.routeCount === fhRoutes.length
  && w22lampsIn(w22junctionBack[0]) === fhRoutes.length;
console.log('wave22 junction visual:', JSON.stringify(w22hubChecks));
if (!Object.values(w22hubChecks).every(Boolean)) { console.log('WAVE22 JUNCTION VISUAL FAIL'); errors++; }
// Wave 38 (live, hung on the wave-21/22 flight — the wave-22 discipline, no
// added travel): back at freehold the junction and physical gates wear the
// 'freehold-overlay' faction dress COEXISTING with the wave-22 lantern, and
// the station is the wave-38 freehold sculpt. The two lookups below are the
// wave-38 scene census shared by every live-leg pin (the wave-27 findByName
// helper lands later in the file); the per-faction scoped-harness pins live
// in the wave-38 section proper at the end of the run.
const w38namedIn = (root, name) => {
  const found = [];
  root.traverse((o) => { if (o.name === name) found.push(o); });
  return found;
};
const w38lampsIn = (g) => {
  let n = 0;
  g.traverse((o) => { if (o.name === 'junction-arm-lamp') n++; });
  return n;
};
// The wave-22 hex frame is the junction's direct-child group of exactly six
// hex-bar meshes (the arms group mixes meshes with lamp sprites, the
// chevrons group holds 10 cones — neither collides).
const w38hexFrameIn = (g) => g.children.some((c) => c.isGroup && c.children.length === 6
  && c.children.every((m) => m.isMesh));
{
  const fh38gates = w38namedIn(ctx.scene, 'lamplighter-gate');
  const fh38junction = w38namedIn(ctx.scene, 'lamplighter-junction');
  const w38freeholdLive = {
    stationSculpt: w38namedIn(ctx.scene, 'freehold-station').length === 1,
    gateCount: fh38gates.length === SYSTEMS.freehold.gates.length && fh38gates.length > 0,
    gatesOverlain: fh38gates.length > 0 && fh38gates.every((g) => g.children.filter((c) => c.name === 'freehold-overlay').length === 1),
    junctionSingle: fh38junction.length === 1,
    junctionCoexists: fh38junction.length === 1
      && fh38junction[0].children.filter((c) => c.name === 'freehold-overlay').length === 1
      && w38hexFrameIn(fh38junction[0])
      && w38lampsIn(fh38junction[0]) === fhRoutes.length
      && fh38junction[0].userData.routeCount === fhRoutes.length
      && 'routeIndex' in fh38junction[0].userData,
  };
  console.log('wave38 live freehold:', JSON.stringify(w38freeholdLive));
  if (!Object.values(w38freeholdLive).every(Boolean)) { console.log('WAVE38 LIVE FREEHOLD FAIL'); errors++; }
}

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
// Wave 38 (live, hung on the wave-2 veridian stop — no added travel): the
// veridian station sculpt and gate dress are in the live scene right now,
// the junction lantern coexisting as at freehold.
{
  const vd38gates = w38namedIn(ctx.scene, 'lamplighter-gate');
  const vd38junction = w38namedIn(ctx.scene, 'lamplighter-junction');
  const w38veridianLive = {
    stationSculpt: w38namedIn(ctx.scene, 'veridian-station').length === 1,
    gateCount: vd38gates.length === SYSTEMS.veridian.gates.length && vd38gates.length > 0,
    gatesOverlain: vd38gates.length > 0 && vd38gates.every((g) => g.children.filter((c) => c.name === 'veridian-overlay').length === 1),
    junctionCoexists: vd38junction.length === 1
      && vd38junction[0].children.filter((c) => c.name === 'veridian-overlay').length === 1
      && w38hexFrameIn(vd38junction[0])
      && w38lampsIn(vd38junction[0]) === SYSTEMS.veridian.hub.routes.length,
  };
  console.log('wave38 live veridian:', JSON.stringify(w38veridianLive));
  if (!Object.values(w38veridianLive).every(Boolean)) { console.log('WAVE38 LIVE VERIDIAN FAIL'); errors++; }
}

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
  // wave-5 landmark/clue POIs carry userData.poiType and are excluded, and
  // wave-38 faction station builders — groups named '<faction>-station',
  // beautiful included — add legit standard-material spheres: vaults, domes,
  // cores; those aren't planets either).
  if (o.isMesh && o.geometry?.type === 'SphereGeometry' && o.material?.isMeshStandardMaterial && !o.material?.isMeshPhysicalMaterial && !o.userData?.poiType) {
    let inStation = false;
    for (let p = o; p; p = p.parent) if (p.name?.endsWith('-station')) { inStation = true; break; }
    if (!inStation) redPlanets++;
  }
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
// Wave 38 (live, hung on the wave-3 redmarch stop — no added travel): the
// redledger station sculpt and gate dress in the live scene, junction
// lantern coexisting.
{
  const rl38gates = w38namedIn(ctx.scene, 'lamplighter-gate');
  const rl38junction = w38namedIn(ctx.scene, 'lamplighter-junction');
  const w38redmarchLive = {
    stationSculpt: w38namedIn(ctx.scene, 'redledger-station').length === 1,
    gateCount: rl38gates.length === SYSTEMS.redmarch.gates.length && rl38gates.length > 0,
    gatesOverlain: rl38gates.length > 0 && rl38gates.every((g) => g.children.filter((c) => c.name === 'redledger-overlay').length === 1),
    junctionCoexists: rl38junction.length === 1
      && rl38junction[0].children.filter((c) => c.name === 'redledger-overlay').length === 1
      && w38hexFrameIn(rl38junction[0])
      && w38lampsIn(rl38junction[0]) === SYSTEMS.redmarch.hub.routes.length,
  };
  console.log('wave38 live redmarch:', JSON.stringify(w38redmarchLive));
  if (!Object.values(w38redmarchLive).every(Boolean)) { console.log('WAVE38 LIVE REDMARCH FAIL'); errors++; }
}
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
  // keepers; wave 23 the three generated-hub dockmasters (12 entries,
  // 9 dockmasters); wave 24 one plain dockmaster per generated non-hub
  // system: 12 → 103 entries, 9 → 100 dockmasters.
  fullRoster103: w4contacts.length === 103,
  dockmasterX100: contactRoleCt('dockmaster') === 100,
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
// Wave 38 (live negative control, hung on the wave-5 hollowreach stop): a
// hollow system builds NO faction overlay and NO named station group — the
// unnamed placeholder and the plain brass gates survive byte-identical,
// the hub junction's lantern included.
{
  const hr38overlays = [];
  const hr38stations = [];
  ctx.scene.traverse((o) => {
    if (o.name?.endsWith('-overlay')) hr38overlays.push(o);
    if (o.name?.endsWith('-station')) hr38stations.push(o);
  });
  const hr38junction = w38namedIn(ctx.scene, 'lamplighter-junction');
  const w38hollowLive = {
    noOverlay: hr38overlays.length === 0,
    noNamedStation: hr38stations.length === 0,
    gatesPresent: w38namedIn(ctx.scene, 'lamplighter-gate').length === SYSTEMS.hollowreach.gates.length,
    junctionLanternNoOverlay: hr38junction.length === 1
      && w38hexFrameIn(hr38junction[0])
      && w38lampsIn(hr38junction[0]) === SYSTEMS.hollowreach.hub.routes.length
      && !hr38junction[0].children.some((c) => c.name?.endsWith('-overlay')),
  };
  console.log('wave38 live hollow:', JSON.stringify(w38hollowLive));
  if (!Object.values(w38hollowLive).every(Boolean)) { console.log('WAVE38 LIVE HOLLOW FAIL'); errors++; }
}

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
// Continuing run: the wave-24 roster is 103 entries, 100 dockmasters (the
// wave-4 check, re-derived — save restores swap the roster array wholesale,
// and every save in this run was written after the wave-24 roster build).
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
  fullRoster103: w10contacts.length === 103,
  dockmasterX100: w10roleCt('dockmaster') === 100,
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

// ---- Wave 23: generated-system depth — one landmark per generated system, ---
// ---- hub dockmasters, authored-lane ledger gate, save roundtrip -------------

// -- a. data: exactly one landmark per generated system; the authored six ----
// tables are byte-unchanged; the separation invariants hold everywhere. ------
const AUTHORED_IDS23 = ['freehold', 'veridian', 'redmarch', 'hollowreach', 'hush', 'verge'];
const LM_KINDS23 = ['wreck', 'beacon', 'monument', 'anomaly'];
const dist23 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const generatedIds23 = Object.keys(SYSTEMS).filter((id) => !AUTHORED_IDS23.includes(id));
const lmShapeOk23 = (id) => {
  const lms = SYSTEMS[id].landmarks;
  const lm = lms?.[0];
  return Array.isArray(lms) && lms.length === 1
    && lm.id === `${id}_lm` && LM_KINDS23.includes(lm.kind)
    && typeof lm.name === 'string' && lm.name.length > 0
    && typeof lm.line === 'string' && lm.line.length > 0
    && Array.isArray(lm.position) && lm.position.length === 3
    && lm.position.every((v) => Number.isFinite(v));
};
const lmSeparationOk23 = (id) => {
  const def = SYSTEMS[id];
  const p = def.landmarks[0].position;
  return dist23(p, def.station.position) >= 400
    && (def.gates ?? []).every((g) => dist23(p, g.position) >= 300)
    && dist23(p, def.field.center) >= def.field.radius + 200
    && (!def.hub || dist23(p, def.hub.position) >= 300)
    && Math.hypot(p[0], p[1], p[2]) <= 1000;
};
const authoredLmIds23 = (id) => (SYSTEMS[id].landmarks ?? []).map((l) => l.id).join('|');
const w23dataChecks = {
  generatedCount94: generatedIds23.length === 94,
  landmarkShapeOk: generatedIds23.every(lmShapeOk23),
  separationHolds: generatedIds23.every(lmSeparationOk23),
  authoredTablesUnchanged: authoredLmIds23('freehold') === 'fh_shepherd'
    && authoredLmIds23('veridian') === 'vd_hulk_row'
    && authoredLmIds23('redmarch') === 'rm_tithe_stone'
    && authoredLmIds23('hollowreach') === 'hr_quiet_beacon|hr_first_wreck'
    && authoredLmIds23('hush') === 'th_lanes_end|th_first_garden'
    && authoredLmIds23('verge') === 'vg_choir_stones|vg_unfinished',
};
console.log('wave23 generated landmarks:', JSON.stringify(w23dataChecks));
if (!Object.values(w23dataChecks).every(Boolean)) { console.log('WAVE23 GENERATED LANDMARKS FAIL'); errors++; }

// -- b. discovery: the real 100u proximity path at fh_hearth ------------------
// The run is docked at Threshold (wave 16) — undock and BFS-hop out to the
// wave-21 hub-route system, then park on its landmark (the wave-5/8
// pattern). The mark STAYS in mystery.visited: the save roundtrip below
// asserts it persists.
if (ctx.flags.docked) undockStation();
const hearthLm23 = SYSTEMS.fh_hearth.landmarks[0];
if (ctx.world.currentSystem !== 'fh_hearth') travelTo('fh_hearth', 'wave23 hearth leg');
const visitedBefore23 = [...ctx.world.mystery.visited];
const hearthLmEvs = [];
ctx.ship.object.position.set(...hearthLm23.position);
ctx.ship.velocity.set(0, 0, 0);
for (let i = 0; i < 30 && !ctx.world.mystery.visited.includes(hearthLm23.id); i++) {
  tick(1, 'wave23 landmark approach');
  hearthLmEvs.push(...ctx.lastEvents.filter((e) => e.type === 'landmarkFound'));
}
const hearthEv23 = hearthLmEvs.find((e) => e.id === hearthLm23.id) ?? null;
const w23discoveryChecks = {
  arrivedAtHearth: ctx.world.currentSystem === 'fh_hearth',
  landmarkVisited: ctx.world.mystery.visited.includes(hearthLm23.id),
  eventFired: !!hearthEv23,
  eventCarriesNameAndLine: hearthEv23?.name === hearthLm23.name && hearthEv23?.line === hearthLm23.line,
};
console.log('wave23 landmark discovery:', JSON.stringify(w23discoveryChecks), `visited=${JSON.stringify(ctx.world.mystery?.visited)}`);
if (!Object.values(w23discoveryChecks).every(Boolean)) { console.log('WAVE23 LANDMARK DISCOVERY FAIL'); errors++; }

// -- c. ledger authored-lane gate: a generated landmark never opens a page ---
// Trust pinned at the ledger gate, visited = the authored-six landmark ids
// ONLY (the witnessed fh_hearth mark is held out) — the second column must
// answer exactly as if generated landmarks did not exist. The control call
// with the fh_hearth mark pushed back in must never name it either (the two
// lines are identical modulo the rotation cursor, so the robust assertion
// is that neither ever mentions the generated system or its landmark).
// Self-cleaning: visited/found restored in place (landmarks.js
// change-detects on array length), trust restored.
const vergeKeeper23 = (ctx.world.contacts ?? []).find((c) => c.id === 'contact-verge-dockmaster') ?? null;
const visitedBeforeLedger23 = [...ctx.world.mystery.visited];
const foundBeforeLedger23 = [...ctx.world.mystery.found];
const trustBeforeLedger23 = vergeKeeper23?.trust;
if (vergeKeeper23) vergeKeeper23.trust = KEEPER_LEDGER_TRUST; // 30
ctx.world.mystery.visited.length = 0;
for (const id of AUTHORED_IDS23) {
  for (const lm of SYSTEMS[id].landmarks ?? []) ctx.world.mystery.visited.push(lm.id);
}
const gatedLine23 = vergeKeeper23 ? keeperLedgerLine(ctx, vergeKeeper23) : null;
if (!ctx.world.mystery.visited.includes(hearthLm23.id)) ctx.world.mystery.visited.push(hearthLm23.id);
const fullLine23 = vergeKeeper23 ? keeperLedgerLine(ctx, vergeKeeper23) : null;
ctx.world.mystery.visited.length = 0; // restore in place — landmarks.js change-detects on length
ctx.world.mystery.visited.push(...visitedBeforeLedger23);
ctx.world.mystery.found.length = 0; // same in-place discipline for the clue list
ctx.world.mystery.found.push(...foundBeforeLedger23);
if (vergeKeeper23) vergeKeeper23.trust = trustBeforeLedger23;
const w23ledgerChecks = {
  keeperFound: !!vergeKeeper23,
  gatedLineAnswered: typeof gatedLine23 === 'string' && gatedLine23.length > 0,
  gatedNeverNamesHearth: !gatedLine23?.includes('Hearth') && !gatedLine23?.includes(hearthLm23.name),
  fullNeverNamesHearth: !fullLine23?.includes('Hearth') && !fullLine23?.includes(hearthLm23.name),
};
console.log('wave23 ledger authored-lane:', JSON.stringify(w23ledgerChecks), `gated=${JSON.stringify(gatedLine23)} full=${JSON.stringify(fullLine23)}`);
if (!Object.values(w23ledgerChecks).every(Boolean)) { console.log('WAVE23 LEDGER AUTHORED-LANE FAIL'); errors++; }

// -- d. hub dockmasters: exactly one per generated hub (shape/id/role) -------
// This continuing run never docked at a generated hub before this section,
// so trust/favors sit at their zero defaults; assert shape rather than
// flavor text (names are not asserted verbatim).
const hubRosters23 = ['fx_bastion', 'gc_auction', 'blackstation'].map((sys) => [sys, contactsForSystem(ctx, sys)]);
const w23hubChecks = {
  oneContactEach: hubRosters23.every(([, roster]) => roster.length === 1),
  dockmasterRole: hubRosters23.every(([, roster]) => roster[0]?.role === 'dockmaster'),
  derivedIds: hubRosters23.every(([sys, roster]) => roster[0]?.id === `contact-${sys}-dockmaster`),
  systemFields: hubRosters23.every(([sys, roster]) => roster[0]?.system === sys),
  zeroedShape: hubRosters23.every(([, roster]) =>
    typeof roster[0]?.name === 'string' && roster[0].name.length > 0
    && roster[0].trust === 0 && roster[0].favors === 0),
};
console.log('wave23 hub dockmasters:', JSON.stringify(w23hubChecks));
if (!Object.values(w23hubChecks).every(Boolean)) { console.log('WAVE23 HUB DOCKMASTERS FAIL'); errors++; }

// -- e. save roundtrip: the generated mark + 103-contact roster persist -------
// The wave-10 pattern, docked at Hearth Landing: park hostiles so the
// autosave can't be combat-blocked, dock (fires trySave), assert the save,
// corrupt in memory, die, recover via Enter, assert the restore. (Roster
// count is the wave-24 103 — this run's saves all postdate the roster
// growth.)
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave23 save)');
dockAtCurrentStation('dock hearth (wave23 save)'); // Hearth Landing — 'docked' fires trySave
tick(3, 'wave23 save settle');
const w23snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const w23saveChecks = {
  saveWritten: !!w23snap?.world,
  landmarkInSave: w23snap?.world?.mystery?.visited?.includes(hearthLm23.id) === true,
  rosterInSave103: (w23snap?.world?.contacts ?? []).length === 103,
};
console.log('wave23 save fields:', JSON.stringify(w23saveChecks));
if (!Object.values(w23saveChecks).every(Boolean)) { console.log('WAVE23 SAVE FIELDS FAIL'); errors++; }

// Corrupt in memory, die, recover from the dock autosave (Enter skips the
// hold): the generated mark and the full roster come back.
ctx.world.mystery.visited.length = 0; // in place — landmarks.js change-detects on length
ctx.world.mystery.visited.push(...visitedBefore23);
tick(2, 'wave23 visited corrupted');
const w23corrupted = !ctx.world.mystery.visited.includes(hearthLm23.id);
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave23 restore)');
dispatchKey('Enter'); // recover(): restore(last save)
const w23restoreChecks = {
  corruptedFirst: w23corrupted,
  landmarkRestored: ctx.world.mystery.visited.includes(hearthLm23.id),
  rosterRestored103: (ctx.world.contacts ?? []).length === 103,
};
console.log('wave23 restore:', JSON.stringify(w23restoreChecks));
if (!Object.values(w23restoreChecks).every(Boolean)) { console.log('WAVE23 RESTORE FAIL'); errors++; }

// ---- Wave 24: generated-system depth, part 2 — generated dockmasters -------
// ---- across the 91 non-hub systems, faction station services, roundtrip ----

// -- a. data: contacts shape across the generated galaxy (static, the ---------
// wave-23 a discipline): exactly one plain dockmaster contact per non-hub
// generated system, none on the three hubs (their wave-23 dockmasters live in
// contacts.js CONTACT_NAMES, not data), names unique and clear of the
// authored twelve, and §25 intact — no generated system gained clues. --------
const HUB_IDS24 = ['fx_bastion', 'gc_auction', 'blackstation'];
const nonHubIds24 = generatedIds23.filter((id) => !HUB_IDS24.includes(id));
const contactShapeOk24 = (id) => {
  const cs = SYSTEMS[id].contacts;
  const c = cs?.[0];
  return Array.isArray(cs) && cs.length === 1
    && c.role === 'dockmaster'
    && typeof c.name === 'string' && c.name.length > 0;
};
const genContactNames24 = nonHubIds24.map((id) => SYSTEMS[id].contacts[0].name);
// The authored twelve names, read back off the live roster (CONTACT_NAMES is
// module-private in contacts.js): the authored six plus the three hubs.
const authoredNames24 = (ctx.world.contacts ?? [])
  .filter((c) => AUTHORED_IDS23.includes(c.system) || HUB_IDS24.includes(c.system))
  .map((c) => c.name);
const w24dataChecks = {
  generatedCount94: generatedIds23.length === 94,
  nonHubCount91: nonHubIds24.length === 91,
  contactShapeOk: nonHubIds24.every(contactShapeOk24),
  hubsCarryNone: HUB_IDS24.every((id) => SYSTEMS[id].contacts === undefined),
  namesUnique91: new Set(genContactNames24).size === 91,
  authoredTwelveFound: authoredNames24.length === 12,
  noAuthoredCollision: genContactNames24.every((n) => !authoredNames24.includes(n)),
  noGeneratedClues: generatedIds23.every((id) => (SYSTEMS[id].clues ?? []).length === 0),
};
console.log('wave24 generated contacts:', JSON.stringify(w24dataChecks));
if (!Object.values(w24dataChecks).every(Boolean)) { console.log('WAVE24 GENERATED CONTACTS FAIL'); errors++; }

// -- b. roster: a fresh boot builds 103; generated dockmasters are plain -----
// contacts with zero keeper-gate reach ---------------------------------------
// The wave-8 fresh-boot pattern: a second harness on the empty store builds
// its roster from data alone (restored saves keep their persisted roster, so
// the fresh-boot count is the only honest 103 check). Its origin overlay is
// dismissed with the same Digit1 the main run used (the origins listener
// self-removes on choice); that digit opens the main run's market (it sits
// docked at Hearth Landing from the wave-23 e restore) and one Escape backs
// it out to services. The fresh harness is never ticked.
const freshBoot24 = bootFreshHarness('wave24 roster');
const fctx24 = freshBoot24.ctx;
dispatchKey('Digit1'); // fresh overlay: [1] Freehold Greenhand (empty effects)
dispatchKey('Escape'); // main run: market → services
const freshRoster24 = fctx24.world.contacts ?? [];
// Two generated systems from different factions, computed off the data —
// contactsForSystem reads live roster refs (trust/favors/metAt still zero
// defaults: this harness never docked).
const genA24 = nonHubIds24[0];
const genB24 = nonHubIds24.find((id) => SYSTEMS[id].faction !== SYSTEMS[genA24].faction) ?? null;
const freshGenA24 = genA24 ? contactsForSystem(fctx24, genA24) : [];
const freshGenB24 = genB24 ? contactsForSystem(fctx24, genB24) : [];
const genContactOk24 = (sys, roster) => roster.length === 1
  && roster[0]?.id === `contact-${sys}-dockmaster`
  && roster[0]?.role === 'dockmaster' && roster[0]?.system === sys
  && roster[0]?.name === SYSTEMS[sys].contacts[0].name
  && roster[0]?.trust === 0 && roster[0]?.favors === 0 && roster[0]?.metAt === null;
// Keeper-gate fall-through, the wave-14 d pure-gate discipline: every OTHER
// condition pinned open (trust 100, the vouch milestone standing, every
// authored landmark witnessed with clues unfound) so the authored-system id
// string gate is the ONLY condition that can answer — a generated id must
// still draw null from all three keeper functions.
const gateContact24 = freshGenA24[0] ?? null;
const trustBeforeGate24 = gateContact24?.trust;
if (gateContact24) gateContact24.trust = 100;
if (!fctx24.world.milestones.includes('callowVouched')) fctx24.world.milestones.push('callowVouched');
fctx24.world.mystery.visited.length = 0;
for (const id of AUTHORED_IDS23) {
  for (const lm of SYSTEMS[id].landmarks ?? []) fctx24.world.mystery.visited.push(lm.id);
}
const gateLedger24 = gateContact24 ? keeperLedgerLine(fctx24, gateContact24) : 'no-contact';
const gateVouch24 = gateContact24 ? keeperVouchArrival(fctx24, gateContact24) : 'no-contact';
const gateMark24 = gateContact24 ? keeperChartMark(fctx24, gateContact24) : 'no-contact';
if (gateContact24) gateContact24.trust = trustBeforeGate24; // hygiene — the fresh harness is throwaway
const w24rosterChecks = {
  freshRoster103: freshRoster24.length === 103, // 12 authored + 91 generated (wave-24 growth)
  twoSystemsPicked: !!genA24 && !!genB24 && genA24 !== genB24,
  factionsDiffer: !!genA24 && !!genB24 && SYSTEMS[genA24].faction !== SYSTEMS[genB24].faction,
  genAContactOk: !!genA24 && genContactOk24(genA24, freshGenA24),
  genBContactOk: !!genB24 && genContactOk24(genB24, freshGenB24),
  keeperLedgerNull: gateLedger24 === null,
  keeperVouchNull: gateVouch24 === null,
  keeperChartMarkNull: gateMark24 === null,
};
console.log('wave24 generated roster:', JSON.stringify(w24rosterChecks), `genA=${genA24} genB=${genB24}`);
if (!Object.values(w24rosterChecks).every(Boolean)) { console.log('WAVE24 GENERATED ROSTER FAIL'); errors++; }

// -- c. real dock drive: the People card at fh_hearth -------------------------
// The continuing run is docked at Hearth Landing (the wave-23 e death-
// restore); fh_hearth already rode the wave-21 hub leg and the wave-23
// landmark discovery, so this extends an existing leg — no new jump. Digit7
// opens the real People service (DOCK_KEY_SERVICES[6]): exactly one card,
// titled with the generated dockmaster's data name.
const hearthDmName24 = SYSTEMS.fh_hearth.contacts[0].name;
const classHas24 = (n, cls) => typeof n.className === 'string' && n.className.split(' ').includes(cls);
dispatchKey('Digit7'); // people (DOCK_KEY_SERVICES[6])
const ov24c = stationOverlay();
const peopleCards24 = ov24c ? [...walkDom(ov24c)].filter((n) => classHas24(n, 'people-card')) : [];
const hearthCard24 = peopleCards24.find((card) =>
  [...walkDom(card)].some((n) => classHas24(n, 'people-name') && n.textContent === hearthDmName24)) ?? null;
const w24peopleChecks = {
  dockedAtHearth: ctx.flags.docked === true && ctx.world.currentSystem === 'fh_hearth',
  oneCard: peopleCards24.length === 1,
  cardShowsGeneratedName: !!hearthCard24,
};
console.log('wave24 hearth people card:', JSON.stringify(w24peopleChecks), `name=${JSON.stringify(hearthDmName24)}`);
if (!Object.values(w24peopleChecks).every(Boolean)) { console.log('WAVE24 HEARTH PEOPLE CARD FAIL'); errors++; }
dispatchKey('Escape'); // people → services

// -- d. faction services through the REAL station UI (the wave-9/11 ----------
// precedent: keydown service selection, stub-DOM button clicks, charge/UI
// agreement) ----------------------------------------------------------------
// Leg plan computed off the live graph, never hardcoded: freehold (authored
// NEGATIVE control, one hop home through the physical back-gate) → fx_liron
// (ferrous repairMult 0.85) → lastbeacon (lamplighter buyMult 0.85) →
// cg_vigil (congregation jobPayMult 1.2). Ferrous/lamplighter/congregation
// hold no EPICS entry, so the epic multiplier is neutral at their stations
// and the faction modifier reads exactly; every expectation is still computed
// off live epicEffects/prices (the world drifts).
const w24Damage = () => { // the hotfix repair-pricing setup: a deterministic itemized bill
  const p = ctx.player;
  p.hullMax = 100; p.screenMax = 40; p.shellMax = 60; p.engineMax = 100; // class maxes (hull pinned huge)
  p.hull = 40; p.screen = 10; p.shell = 0; p.engine = 50;
};
const w24RepinHull = () => { ctx.player.hullMax = 1e9; ctx.player.hull = 1e9; }; // the wave-6 re-pin
// station.js repairCost: per part Math.ceil(lack × REPAIR_RATES[key] × mult),
// summed; rates hull 0.9 / screen 0.3 / shell 0.5 / engine 0.6 (the hotfix
// section's itemization), mult = epic × faction composed epic-first.
const w24RepairExpected = (mult) =>
  Math.ceil(60 * 0.9 * mult) + Math.ceil(30 * 0.3 * mult) + Math.ceil(60 * 0.5 * mult) + Math.ceil(50 * 0.6 * mult);
const w24RepairScreen = (label) => { // open the repair service, return button/overlay/label cost
  dispatchKey('Digit5'); // repair service (DOCK_KEY_SERVICES[4])
  tick(2, `${label} repair screen`);
  let btn = null;
  const ov = stationOverlay();
  if (ov) for (const n of walkDom(ov)) {
    if (n.tagName === 'BUTTON' && typeof n.textContent === 'string' && n.textContent.startsWith('1 — Repair all')) { btn = n; break; }
  }
  return { btn, ov, labelCost: btn ? Number((btn.textContent.match(/\((\d+) UU\)/) ?? [])[1]) : NaN };
};
const w24NoteShown = (ov, line) => [...walkDom(ov ?? { children: [] })]
  .some((n) => classHas24(n, 'screen-note') && n.textContent === line);
const w24MadeWhole = () => {
  const p = ctx.player;
  return p.hull === p.hullMax && p.screen === p.screenMax && p.shell === p.shellMax && p.engine === p.engineMax;
};

// d1. NEGATIVE control: authored freehold shows no faction note and the yard
// charges epic standing ONLY (the AUTHORED_SYSTEMS id guard) — a dropped
// guard would stack FACTION_SERVICES.freehold.repairMult 0.9 on top.
undockStation();
travelTo('freehold', 'wave24 freehold control leg');
dockAtCurrentStation('dock freehold (wave24 control)');
w24Damage();
const freeholdEpicMult24 = epicEffects(ctx, 'freehold').repairMult ?? 1; // epic applies at authored stations
const expectedFreeholdRepair24 = w24RepairExpected(freeholdEpicMult24);
const creditsBeforeRepair24a = ctx.world.credits;
const screen24a = w24RepairScreen('wave24 freehold');
screen24a.btn?.click(); // real path: stub-DOM click → act.repairAll
const w24controlChecks = {
  dockedAtFreehold: ctx.flags.docked === true && ctx.world.currentSystem === 'freehold',
  noFactionNote: !w24NoteShown(screen24a.ov, FACTION_SERVICES.freehold.line),
  repairButtonFound: !!screen24a.btn,
  epicOnlyTotal: screen24a.labelCost === expectedFreeholdRepair24,
  guardDiscriminates: expectedFreeholdRepair24 !== w24RepairExpected(freeholdEpicMult24 * FACTION_SERVICES.freehold.repairMult),
  chargedExactly: creditsBeforeRepair24a - ctx.world.credits === expectedFreeholdRepair24,
  madeWhole: w24MadeWhole(),
};
console.log('wave24 freehold control:', JSON.stringify(w24controlChecks), `cost=${screen24a.labelCost} expect=${expectedFreeholdRepair24}`);
if (!Object.values(w24controlChecks).every(Boolean)) { console.log('WAVE24 FREEHOLD CONTROL FAIL'); errors++; }
w24RepinHull();

// d2. ferrous yard at fx_liron: the itemized bill × 0.85, the faction note
// rendered, charge agreeing with the label.
undockStation();
travelTo('fx_liron', 'wave24 ferrous leg');
dockAtCurrentStation('dock fx_liron (wave24 repair)');
w24Damage();
const ferrousFx24 = epicEffects(ctx, 'ferrous'); // no EPICS entry — neutral
const expectedFerrousRepair24 = w24RepairExpected((ferrousFx24.repairMult ?? 1) * FACTION_SERVICES.ferrous.repairMult);
const creditsBeforeRepair24b = ctx.world.credits;
const screen24b = w24RepairScreen('wave24 fx_liron');
screen24b.btn?.click();
const w24repairChecks = {
  dockedAtLiron: ctx.flags.docked === true && ctx.world.currentSystem === 'fx_liron',
  epicNeutral: Object.keys(ferrousFx24).length === 0,
  factionNoteShown: w24NoteShown(screen24b.ov, FACTION_SERVICES.ferrous.line),
  repairButtonFound: !!screen24b.btn,
  scaledTotal: screen24b.labelCost === expectedFerrousRepair24,
  multDiscriminates: expectedFerrousRepair24 !== w24RepairExpected(1),
  chargedExactly: creditsBeforeRepair24b - ctx.world.credits === expectedFerrousRepair24,
  madeWhole: w24MadeWhole(),
};
console.log('wave24 ferrous repair:', JSON.stringify(w24repairChecks), `cost=${screen24b.labelCost} expect=${expectedFerrousRepair24}`);
if (!Object.values(w24repairChecks).every(Boolean)) { console.log('WAVE24 FERROUS REPAIR FAIL'); errors++; }
w24RepinHull();

// d3. lamplighter market at lastbeacon: the buy chain carries × 0.85, the
// PRICE cell agrees with the charge (the wave-9/11 cell/charge agreement).
// Prices drift with the random walk, so the expectation reads the live price
// inside the same tick-free render window as the cell and the click.
undockStation();
travelTo('lastbeacon', 'wave24 lamplighter leg');
dockAtCurrentStation('dock lastbeacon (wave24 market)');
dispatchKey('Digit1'); // market (DOCK_KEY_SERVICES[0])
const lamFx24 = epicEffects(ctx, 'lamplighter'); // no EPICS entry — neutral
const lamPrice24 = ctx.world.prices.provisions ?? COMMODITIES.provisions.base; // station.js priceOf
const expectedBuy24 = Math.round(lamPrice24 * (lamFx24.buyMult ?? 1) * FACTION_SERVICES.lamplighter.buyMult);
const lamNoteShown24 = w24NoteShown(stationOverlay(), FACTION_SERVICES.lamplighter.line);
const priceCellText24 = marketRowCell('Provisions', 2)?.textContent ?? null;
const creditsBeforeBuy24 = ctx.world.credits;
const buyBtn24 = marketTradeButton('Provisions', '+1');
buyBtn24?.click(); // real path: stub-DOM click → tryTrade('provisions', 1, true)
const buyCharged24 = creditsBeforeBuy24 - ctx.world.credits;
const w24marketChecks = {
  dockedAtBeacon: ctx.flags.docked === true && ctx.world.currentSystem === 'lastbeacon',
  epicNeutral: Object.keys(lamFx24).length === 0,
  factionNoteShown: lamNoteShown24,
  priceCellAgrees: priceCellText24 === `${expectedBuy24} UU`,
  multInChain: expectedBuy24 !== Math.round(lamPrice24 * (lamFx24.buyMult ?? 1)),
  buyButtonFound: !!buyBtn24,
  chargedExactly: buyCharged24 === expectedBuy24,
};
console.log('wave24 lamplighter market:', JSON.stringify(w24marketChecks), `cell=${JSON.stringify(priceCellText24)} charged=${buyCharged24}`);
if (!Object.values(w24marketChecks).every(Boolean)) { console.log('WAVE24 LAMPLIGHTER MARKET FAIL'); errors++; }

// d4. congregation jobs at cg_vigil: the recovery card quotes AND pays the
// scaled reward (× 1.2), the full accept → scoop → redock cycle through the
// real UI (the wave-4 §5 pattern, wreck seeded as test SETUP data after
// expiring any soak wrecks for this system through the real lifecycle).
undockStation();
travelTo('cg_vigil', 'wave24 congregation leg');
dockAtCurrentStation('dock cg_vigil (wave24 jobs)');
for (const entry of ctx.world.aftermath) {
  if (entry.kind === 'wreck' && entry.system === 'cg_vigil') {
    entry.expiresAt = Math.min(entry.expiresAt, ctx.world.time);
  }
}
tick(1, 'expire soak wrecks (wave24 recovery setup)');
ctx.world.aftermath.push({
  id: 'aft-w24', incidentId: 'inc-w24', kind: 'wreck',
  position: { x: 30, y: 0, z: -60 }, system: 'cg_vigil',
  createdAt: ctx.world.time, expiresAt: ctx.world.time + 9999,
});
dispatchKey('Digit2'); // jobs board (DOCK_KEY_SERVICES[1]) — renderJobs → syncRecoveryJob posts the card
const cgFx24 = epicEffects(ctx, 'congregation'); // no EPICS entry — neutral
const recoveryJob24 = ctx.world.jobs.find((j) => j.kind === 'recovery' && j.wreckId === 'aft-w24') ?? null;
const expectedPay24 = recoveryJob24
  ? Math.round(recoveryJob24.reward * (cgFx24.jobPayMult ?? 1) * FACTION_SERVICES.congregation.jobPayMult)
  : NaN;
const cgNoteShown24 = w24NoteShown(stationOverlay(), FACTION_SERVICES.congregation.line);
const rewardLineShown24 = [...walkDom(stationOverlay() ?? { children: [] })]
  .some((n) => typeof n.className === 'string' && n.className.includes('job-reward')
    && typeof n.textContent === 'string' && n.textContent.includes(`pays ${expectedPay24} UU`));
// Strict card-scoped accept: wave-4's DONE recovery card rides every board
// (boardJobs only filters OFFERED recovery by system), and findAcceptButton's
// ancestor walk can climb to the panel and return another job's button —
// require the Accept button INSIDE the titled card's own subtree.
const recoveryBtn24 = recoveryJob24?.state === 'offered' ? (() => {
  const ov = stationOverlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (typeof n.className !== 'string' || !n.className.split(' ').includes('job-card')) continue;
    const titled = [...walkDom(n)].some((d) => typeof d.textContent === 'string' && d.textContent.includes('Recovery: wreck salvage'));
    if (!titled) continue;
    for (const d of walkDom(n)) {
      if (d.tagName === 'BUTTON' && typeof d.textContent === 'string' && d.textContent.startsWith('Accept')) return d;
    }
  }
  return null;
})() : null;
const podsAtAccept24 = ctx.pods.length;
recoveryBtn24?.click(); // real accept path: spawns the salvage pod at the wreck
const w24acceptChecks = {
  dockedAtVigil: ctx.flags.docked === true && ctx.world.currentSystem === 'cg_vigil',
  epicNeutral: Object.keys(cgFx24).length === 0,
  factionNoteShown: cgNoteShown24,
  rewardLineScaled: rewardLineShown24,
  multDiscriminates: Number.isFinite(expectedPay24) && expectedPay24 !== recoveryJob24?.reward,
  recoveryOffered: recoveryJob24?.state === 'offered' || recoveryJob24?.state === 'accepted',
  acceptButtonFound: !!recoveryBtn24,
  podSpawnedAtWreck: ctx.pods.length === podsAtAccept24 + 1,
  jobAccepted: recoveryJob24?.state === 'accepted',
};
console.log('wave24 congregation job accept:', JSON.stringify(w24acceptChecks), `pay=${expectedPay24}`);
if (!Object.values(w24acceptChecks).every(Boolean)) { console.log('WAVE24 CONGREGATION ACCEPT FAIL'); errors++; }

undockStation();
const salvagePod24 = ctx.pods[ctx.pods.length - 1] ?? null;
let podScooped24 = false;
if (salvagePod24) {
  ctx.ship.velocity.set(0, 0, 0);
  for (let i = 0; i < 600 && !podScooped24; i++) {
    ctx.ship.object.position.copy(salvagePod24.mesh.position); // pod drifts; stay on it
    tick(1, 'scoop salvage pod (wave24)');
    podScooped24 = !ctx.pods.includes(salvagePod24);
  }
}
tick(30, 'post-scoop settle (wave24)'); // let the job's event scan see podCollected
const creditsAtRedock24 = ctx.world.credits;
dockAtCurrentStation('redock cg_vigil (wave24 recovery)');
tick(90, 'wave24 recovery payout tick');
const w24jobsChecks = {
  podScooped: podScooped24,
  jobCollected: recoveryJob24?.collected === true,
  redockedAtVigil: ctx.flags.docked === true && ctx.world.currentSystem === 'cg_vigil',
  paidScaled: ctx.world.credits - creditsAtRedock24 === expectedPay24,
  jobDone: recoveryJob24?.state === 'done',
};
console.log('wave24 congregation job payout:', JSON.stringify(w24jobsChecks), `delta=${ctx.world.credits - creditsAtRedock24} expect=${expectedPay24}`);
if (!Object.values(w24jobsChecks).every(Boolean)) { console.log('WAVE24 CONGREGATION PAYOUT FAIL'); errors++; }

// -- e. save roundtrip: roster 103 + the generated dockmaster survive ---------
// The wave-23 e pattern at the generated system d4 ended docked in (Vigil
// Chapel, cg_vigil): bank non-default state on the generated dockmaster
// (trust 25 via the real bumpTrust API), park hostiles so the autosave can't
// be combat-blocked, cycle the dock so the 'docked' autosave carries the
// banked state, assert the save, corrupt the live roster, die, recover via
// Enter, assert the restore.
const cgContact24 = contactsForSystem(ctx, 'cg_vigil').find((c) => c.role === 'dockmaster') ?? null;
if (cgContact24) bumpTrust(ctx, cgContact24, 25);
// Baseline-relative: the d4 recovery payout already banked its own trust with
// the yard, so read the live figure the autosave must carry (and prove it is
// non-default), never a hardcoded total.
const bankedTrust24 = cgContact24?.trust ?? 0;
const bankedName24 = cgContact24?.name ?? '';
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave24 save)');
undockStation();
dockAtCurrentStation('dock cg_vigil (wave24 save)'); // 'docked' fires trySave with trust 25 banked
tick(3, 'wave24 save settle');
const w24snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const snapCg24 = (w24snap?.world?.contacts ?? []).find((c) => c.id === 'contact-cg_vigil-dockmaster') ?? null;
const w24saveChecks = {
  saveWritten: !!w24snap?.world,
  rosterInSave103: (w24snap?.world?.contacts ?? []).length === 103,
  bankedNonDefault: bankedTrust24 > 0 && bankedName24 === SYSTEMS.cg_vigil.contacts[0].name,
  dockmasterInSave: snapCg24?.name === bankedName24 && snapCg24?.trust === bankedTrust24,
};
console.log('wave24 save fields:', JSON.stringify(w24saveChecks), `snap=${JSON.stringify(snapCg24)}`);
if (!Object.values(w24saveChecks).every(Boolean)) { console.log('WAVE24 SAVE FIELDS FAIL'); errors++; }

// Corrupt in memory (splice the generated dockmaster out of the live roster),
// die, recover from the dock autosave (Enter skips the hold): the full roster
// and the banked name/trust come back.
const cgIdx24 = (ctx.world.contacts ?? []).findIndex((c) => c.id === 'contact-cg_vigil-dockmaster');
if (cgIdx24 >= 0) ctx.world.contacts.splice(cgIdx24, 1);
tick(2, 'wave24 roster corrupted');
const w24corrupted = (ctx.world.contacts ?? []).length === 102
  && !(ctx.world.contacts ?? []).some((c) => c.id === 'contact-cg_vigil-dockmaster');
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave24 restore)');
dispatchKey('Enter'); // recover(): restore(last save)
const restoredCg24 = contactsForSystem(ctx, 'cg_vigil').find((c) => c.role === 'dockmaster') ?? null;
const w24restoreChecks = {
  corruptedFirst: w24corrupted,
  rosterRestored103: (ctx.world.contacts ?? []).length === 103,
  dockmasterRestored: restoredCg24?.name === bankedName24 && restoredCg24?.trust === bankedTrust24,
};
console.log('wave24 restore:', JSON.stringify(w24restoreChecks));
if (!Object.values(w24restoreChecks).every(Boolean)) { console.log('WAVE24 RESTORE FAIL'); errors++; }

// ---- Wave 25: generated-system depth, part 3 — generated dockmaster voice:
// ---- faction recognition greetings + faction-framed rumors -----------------

// -- a. data: the faction voice tables cover exactly the generated galaxy ----
// (static, the wave-23 a / wave-24 a discipline): the key sets of
// FACTION_RECOGNITION and FACTION_RUMOR each equal the set of factions flown
// by the 94 generated systems — the authored-only 'hollow' holds no entry —
// and every value is a non-empty string.
const genFactions25 = [...new Set(generatedIds23.map((id) => SYSTEMS[id].faction))].sort();
const recogKeys25 = Object.keys(FACTION_RECOGNITION).sort();
const rumorKeys25 = Object.keys(FACTION_RUMOR).sort();
const w25dataChecks = {
  generatedFactions10: genFactions25.length === 10,
  recognitionKeySetMatches: JSON.stringify(recogKeys25) === JSON.stringify(genFactions25),
  rumorKeySetMatches: JSON.stringify(rumorKeys25) === JSON.stringify(genFactions25),
  hollowAbsent: !('hollow' in FACTION_RECOGNITION) && !('hollow' in FACTION_RUMOR),
  recognitionAllNonEmpty: Object.values(FACTION_RECOGNITION).every((v) => typeof v === 'string' && v.length > 0),
  rumorAllNonEmpty: Object.values(FACTION_RUMOR).every((v) => typeof v === 'string' && v.length > 0),
};
console.log('wave25 faction voice tables:', JSON.stringify(w25dataChecks), `factions=${JSON.stringify(genFactions25)}`);
if (!Object.values(w25dataChecks).every(Boolean)) { console.log('WAVE25 FACTION VOICE TABLES FAIL'); errors++; }

// -- b. fresh-harness gates: the faction tier answers at GENERATED_KNOWN_TRUST,
// falls silent one point below, and the comp ship line still dominates at
// KEEPER_COMP_TRUST -----------------------------------------------------------
// The wave-24 b pattern: a second harness on the empty store, its origin
// overlay dismissed with the same Digit1 (that digit opens the main run's
// market — the run sits docked at cg_vigil from the wave-24 e restore — and
// one Escape backs it out to services); the fresh harness is never ticked.
// Same two differing-faction generated systems wave-24 b picked (genA24/
// genB24, recomputed off the live data there); every trust move rides the
// real bumpTrust API.
const freshBoot25 = bootFreshHarness('wave25 gates');
const fctx25 = freshBoot25.ctx;
dispatchKey('Digit1'); // fresh overlay: [1] Freehold Greenhand (empty effects)
dispatchKey('Escape'); // main run: market → services
const genA25 = genA24;
const genB25 = genB24;
const factionA25 = SYSTEMS[genA25].faction;
const factionB25 = SYSTEMS[genB25].faction;
const contactA25 = contactsForSystem(fctx25, genA25).find((c) => c.role === 'dockmaster') ?? null;
const contactB25 = contactsForSystem(fctx25, genB25).find((c) => c.role === 'dockmaster') ?? null;
// The shared comp-tier ship line, computed off the live shipName (the fresh
// harness carries the world.js default): trust 60 must still answer THIS,
// never the faction greeting — the comp tier dominates the faction tier.
const ship25 = fctx25.world.shipName;
const compLine25 = ship25
  ? `${ship25}, back on my pad. Good to see her in one piece.`
  : `The living hull — we'd know that ship anywhere. Welcome back.`;
const gate25 = (c) => { // trust walked 0 → 30 → 29 → 59 → 60 entirely through bumpTrust
  if (!c) return { known: 'no-contact', below: 'no-contact', mid: 'no-contact', comp: 'no-contact', tKnown: NaN, tBelow: NaN, tMid: NaN, tComp: NaN };
  bumpTrust(fctx25, c, GENERATED_KNOWN_TRUST - c.trust); // land exactly at the known tier
  const tKnown = c.trust;
  const known = recognitionLine(fctx25, c);
  bumpTrust(fctx25, c, -1); // one point below the gate
  const tBelow = c.trust;
  const below = recognitionLine(fctx25, c);
  bumpTrust(fctx25, c, KEEPER_COMP_TRUST - 1 - c.trust); // mid-tier: above the gate, below the comp tier
  const tMid = c.trust;
  const mid = recognitionLine(fctx25, c);
  bumpTrust(fctx25, c, KEEPER_COMP_TRUST - c.trust); // the comp tier
  const tComp = c.trust;
  const comp = recognitionLine(fctx25, c);
  return { known, below, mid, comp, tKnown, tBelow, tMid, tComp };
};
const gateA25 = gate25(contactA25);
const gateB25 = gate25(contactB25);
// Authored NEGATIVE control: Mother Tarn (authored freehold dockmaster) at
// the same trust 30 must stay byte-identical to wave-24 behavior — the
// faction tier is AUTHORED_SYSTEMS-guarded, so an authored id answers null.
const tarn25 = contactsForSystem(fctx25, 'freehold').find((c) => c.role === 'dockmaster') ?? null;
if (tarn25) bumpTrust(fctx25, tarn25, GENERATED_KNOWN_TRUST - tarn25.trust);
const tarnRecog25 = tarn25 ? recognitionLine(fctx25, tarn25) : 'no-contact';
const w25gateChecks = {
  contactsFound: !!contactA25 && !!contactB25 && !!tarn25,
  factionsDiffer: factionA25 !== factionB25,
  knownTrustLanded: gateA25.tKnown === GENERATED_KNOWN_TRUST && gateB25.tKnown === GENERATED_KNOWN_TRUST,
  knownAIsFactionLine: gateA25.known === FACTION_RECOGNITION[factionA25],
  knownBIsFactionLine: gateB25.known === FACTION_RECOGNITION[factionB25],
  belowTrustLanded: gateA25.tBelow === GENERATED_KNOWN_TRUST - 1 && gateB25.tBelow === GENERATED_KNOWN_TRUST - 1,
  belowANull: gateA25.below === null,
  belowBNull: gateB25.below === null,
  midTrustLanded: gateA25.tMid === KEEPER_COMP_TRUST - 1 && gateB25.tMid === KEEPER_COMP_TRUST - 1,
  midAIsFactionLine: gateA25.mid === FACTION_RECOGNITION[factionA25], // >= semantics: the tier spans the whole mid band
  midBIsFactionLine: gateB25.mid === FACTION_RECOGNITION[factionB25],
  compTrustLanded: gateA25.tComp === KEEPER_COMP_TRUST && gateB25.tComp === KEEPER_COMP_TRUST,
  compAIsShipLine: gateA25.comp === compLine25,
  compBIsShipLine: gateB25.comp === compLine25,
  compDominatesFaction: gateA25.comp !== FACTION_RECOGNITION[factionA25]
    && gateB25.comp !== FACTION_RECOGNITION[factionB25],
  authoredTarnNullAt30: tarn25?.trust === GENERATED_KNOWN_TRUST && tarnRecog25 === null,
};
console.log('wave25 recognition gates:', JSON.stringify(w25gateChecks), `genA=${genA25} genB=${genB25}`);
if (!Object.values(w25gateChecks).every(Boolean)) { console.log('WAVE25 RECOGNITION GATES FAIL'); errors++; }

// -- c. rumor: the faction preface frames the SAME witnessed body ------------
// Same fresh harness (throwaway, never ticked): seed ctx.world.incidents with
// one destroyed incident (the wave-4 §3 assignment discipline — rumorFor keys
// off incidents alone). The generated dockmasters must voice
// FACTION_RUMOR[faction] + ' ' + the unmodified destroyed body while Mother
// Tarn voices the body bare; an empty log answers null on both. The preface
// adds voice only, never an event (Witness Rule §8.7).
const inc25 = { id: 'inc-w25', kind: 'destroyed', causer: 'npc-marauder', name: 'Kestrel of the Tenth', faction: 'ferrous' };
const rumorBody25 = `${inc25.name} came apart out in the drift. Happens more than it should.`;
fctx25.world.incidents = [inc25];
const rumorGenA25 = contactA25 ? rumorFor(fctx25, contactA25) : 'no-contact';
const rumorGenB25 = contactB25 ? rumorFor(fctx25, contactB25) : 'no-contact';
const rumorTarn25 = tarn25 ? rumorFor(fctx25, tarn25) : 'no-contact';
fctx25.world.incidents = [];
const rumorGenEmpty25 = contactA25 ? rumorFor(fctx25, contactA25) : 'no-contact';
const rumorTarnEmpty25 = tarn25 ? rumorFor(fctx25, tarn25) : 'no-contact';
const w25rumorChecks = {
  genAPrefixed: rumorGenA25 === `${FACTION_RUMOR[factionA25]} ${rumorBody25}`,
  genBPrefixed: rumorGenB25 === `${FACTION_RUMOR[factionB25]} ${rumorBody25}`,
  authoredBare: rumorTarn25 === rumorBody25,
  prefaceDiscriminates: rumorGenA25 !== rumorBody25 && rumorGenB25 !== rumorBody25,
  emptyGenNull: rumorGenEmpty25 === null,
  emptyAuthoredNull: rumorTarnEmpty25 === null,
};
console.log('wave25 faction rumor:', JSON.stringify(w25rumorChecks), `genA=${JSON.stringify(rumorGenA25)} tarn=${JSON.stringify(rumorTarn25)}`);
if (!Object.values(w25rumorChecks).every(Boolean)) { console.log('WAVE25 FACTION RUMOR FAIL'); errors++; }

// -- d. real dock drive: the People card at fh_hearth voices the greeting ----
// The continuing run is docked at cg_vigil (the wave-24 e death-restore);
// fh_hearth already rode the wave-21 hub leg, the wave-23 landmark discovery,
// and the wave-24 c People card, so this extends that same docked leg — a
// travelTo hop, no new jump soak. Bump Yardkeeper Stovers (the generated
// freehold dockmaster) to exactly GENERATED_KNOWN_TRUST via the real
// bumpTrust API, then Digit7 re-opens the real People service (the wave-24 c
// path): the recognition div must render the FACTION_RECOGNITION.freehold
// line, quoted. The redock's 'docked' autosave also rewrites the save the
// fresh-harness boot cleared.
const hearthDm25 = contactsForSystem(ctx, 'fh_hearth').find((c) => c.role === 'dockmaster') ?? null;
if (hearthDm25) bumpTrust(ctx, hearthDm25, GENERATED_KNOWN_TRUST - hearthDm25.trust); // land exactly at the known tier
undockStation();
travelTo('fh_hearth', 'wave25 hearth leg');
dockAtCurrentStation('dock hearth (wave25)');
dispatchKey('Digit7'); // people (DOCK_KEY_SERVICES[6])
const ov25d = stationOverlay();
const peopleCards25 = ov25d ? [...walkDom(ov25d)].filter((n) => classHas24(n, 'people-card')) : [];
const hearthCard25 = peopleCards25.find((card) =>
  [...walkDom(card)].some((n) => classHas24(n, 'people-name') && n.textContent === hearthDm25?.name)) ?? null;
const recogDiv25 = hearthCard25
  ? [...walkDom(hearthCard25)].find((n) => classHas24(n, 'people-recognition')) ?? null
  : null;
const expectedRecog25 = `“${FACTION_RECOGNITION.freehold}”`; // station.js quotes the line
const w25peopleChecks = {
  dockmasterFound: !!hearthDm25 && hearthDm25.name === SYSTEMS.fh_hearth.contacts[0].name,
  trustAtKnownTier: hearthDm25?.trust === GENERATED_KNOWN_TRUST,
  dockedAtHearth: ctx.flags.docked === true && ctx.world.currentSystem === 'fh_hearth',
  oneCard: peopleCards25.length === 1,
  recognitionRendered: recogDiv25?.textContent === expectedRecog25,
};
console.log('wave25 hearth people recognition:', JSON.stringify(w25peopleChecks), `line=${JSON.stringify(recogDiv25?.textContent ?? null)}`);
if (!Object.values(w25peopleChecks).every(Boolean)) { console.log('WAVE25 HEARTH PEOPLE RECOGNITION FAIL'); errors++; }
dispatchKey('Escape'); // people → services

// ---- Wave 26: generated-system depth, part 4 — generated dockmaster favor --
// ---- economy (earn gate + favor-comp repair), ferry/haul quote==pay --------

// -- a. data: FACTION_COMP covers exactly the generated-faction set ----------
// (static, the wave-23 a / wave-24 a / wave-25 a discipline): the key set of
// FACTION_COMP equals FACTION_SERVICES's key set exactly — the same ten keys
// in the same order — the authored-only 'hollow' holds no entry, and every
// value is a non-empty string (each line is dual-use: spoken in a people-card
// notice AND shown verbatim as the repair screen's note).
const svcKeys26 = Object.keys(FACTION_SERVICES);
const compKeys26 = Object.keys(FACTION_COMP);
const w26dataChecks = {
  servicesKeys10: svcKeys26.length === 10,
  compKeys10: compKeys26.length === 10,
  compKeyOrderMatchesServices: JSON.stringify(compKeys26) === JSON.stringify(svcKeys26),
  hollowAbsent: !('hollow' in FACTION_COMP),
  compCoversGeneratedFactions: JSON.stringify([...compKeys26].sort()) === JSON.stringify(genFactions25), // the wave-25 a set
  compAllNonEmpty: Object.values(FACTION_COMP).every((v) => typeof v === 'string' && v.length > 0),
  // The jobPayMult table values the lane math below relies on, pinned
  // separately so no expectation downstream hardcodes them unasserted.
  jobPayMultTablePins: FACTION_SERVICES.veridian.jobPayMult === 1.15
    && FACTION_SERVICES.congregation.jobPayMult === 1.2
    && FACTION_SERVICES.independent.jobPayMult === 1.1,
};
console.log('wave26 faction comp table:', JSON.stringify(w26dataChecks));
if (!Object.values(w26dataChecks).every(Boolean)) { console.log('WAVE26 FACTION COMP TABLE FAIL'); errors++; }

// Shared wave-26 drivers -------------------------------------------------------
// Strict card-scoped accept (the wave-24 d4 ruling): the Accept button must
// live INSIDE the subtree of the card titled titleFrag — DONE cards ride
// every board and a loose ancestor walk can return another card's button.
const w26CardAcceptButton = (titleFrag) => {
  const ov = stationOverlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (typeof n.className !== 'string' || !n.className.split(' ').includes('job-card')) continue;
    const titled = [...walkDom(n)].some((d) => typeof d.textContent === 'string' && d.textContent.includes(titleFrag));
    if (!titled) continue;
    for (const d of walkDom(n)) {
      if (d.tagName === 'BUTTON' && typeof d.textContent === 'string' && d.textContent.startsWith('Accept')) return d;
    }
  }
  return null;
};
// The 'Call in a favor' button on the people card titled with contactName
// (the wave-11 f ancestor walk).
const w26FavorButton = (contactName) => {
  const ov = stationOverlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (n.textContent !== contactName || !n.parent) continue;
    for (let card = n.parent; card && card !== ov; card = card.parent) {
      const b = [...walkDom(card)].find((d) => d.tagName === 'BUTTON' && /call in a favor/i.test(d.textContent ?? ''));
      if (b) return b;
    }
  }
  return null;
};
// The station notice div's text (render() rewrites it on every action).
const w26StationNotice = () => [...walkDom(stationOverlay() ?? { children: [] })]
  .find((n) => classHas24(n, 'station-notice'))?.textContent ?? null;
// The job-reward line on the card titled titleFrag.
const w26JobRewardLine = (titleFrag) => {
  const ov = stationOverlay();
  if (!ov) return null;
  for (const n of walkDom(ov)) {
    if (typeof n.className !== 'string' || !n.className.split(' ').includes('job-card')) continue;
    const titled = [...walkDom(n)].some((d) => typeof d.textContent === 'string' && d.textContent.includes(titleFrag));
    if (!titled) continue;
    const rd = [...walkDom(n)].find((d) => typeof d.className === 'string' && d.className.split(' ').includes('job-reward'));
    return rd?.textContent ?? null;
  }
  return null;
};
// Independent in-test replica of station.js's jobPayFor (the wave-26 shared
// contract): epic multiplier first, faction service multiplier second, the
// authored six guarded to 1 by id. Never reads station.js internals.
const svcJobMult26 = (sysId) => AUTHORED_IDS23.includes(sysId) ? 1 : (FACTION_SERVICES[SYSTEMS[sysId]?.faction]?.jobPayMult ?? 1);
const epicJobMult26 = (sysId) => epicEffects(ctx, SYSTEMS[sysId]?.faction).jobPayMult ?? 1;
const w26JobPayFor = (sysId, base) => Math.round(base * epicJobMult26(sysId) * svcJobMult26(sysId));
// A real completeJob reach (completeJob is module-private in station.js): the
// full recovery cycle at the system the run is docked in — the wave-24 d4
// template: expire soak wrecks for the system, seed a test wreck, accept the
// card through the real board, scoop the pod, redock, pay out. Assumes the
// run starts docked at sysId and leaves it docked there.
const w26RecoveryCycle = (sysId, wreckId, label) => {
  for (const entry of ctx.world.aftermath) {
    if (entry.kind === 'wreck' && entry.system === sysId) {
      entry.expiresAt = Math.min(entry.expiresAt, ctx.world.time);
    }
  }
  tick(1, `expire soak wrecks (${label})`);
  ctx.world.aftermath.push({
    id: wreckId, incidentId: `inc-${wreckId}`, kind: 'wreck',
    position: { x: 30, y: 0, z: -60 }, system: sysId,
    createdAt: ctx.world.time, expiresAt: ctx.world.time + 9999,
  });
  dispatchKey('Digit2'); // jobs board (DOCK_KEY_SERVICES[1]) — syncRecoveryJob posts the card
  const job = ctx.world.jobs.find((j) => j.kind === 'recovery' && j.wreckId === wreckId) ?? null;
  const btn = job?.state === 'offered' ? w26CardAcceptButton('Recovery: wreck salvage') : null;
  const podsBefore = ctx.pods.length;
  btn?.click(); // real accept path: spawns the salvage pod at the wreck
  const podSpawned = ctx.pods.length === podsBefore + 1;
  undockStation();
  const pod = ctx.pods[ctx.pods.length - 1] ?? null;
  let scooped = false;
  if (podSpawned && pod) {
    ctx.ship.velocity.set(0, 0, 0);
    for (let i = 0; i < 600 && !scooped; i++) {
      ctx.ship.object.position.copy(pod.mesh.position); // pod drifts; stay on it
      tick(1, `scoop salvage pod (${label})`);
      scooped = !ctx.pods.includes(pod);
    }
  }
  tick(30, `post-scoop settle (${label})`); // let the job's event scan see podCollected
  dockAtCurrentStation(`redock ${sysId} (${label})`);
  tick(90, `${label} payout tick`); // delivery check is throttled at 0.5s
  return { job, btnFound: !!btn, podSpawned, scooped };
};

// -- b. earn gate: a finished contract banks +1 favor once the post-bump -----
// trust reads GENERATED_KNOWN_TRUST — generated systems only -----------------
// Real recovery cycles (the wave-24 d4 mirror) at fh_hearth, with the local
// dockmaster's trust pinned pre-completion; completeJob bumps
// DOCKMASTER_TRUST_PER_JOB (= 5, station.js) first, so the grant fires iff
// pin + 5 >= GENERATED_KNOWN_TRUST. The completions are real gameplay state
// (the wave-24 d4/e precedent): trust and favors are left where the cycles
// land them, not restored.
const hearthDm26 = contactsForSystem(ctx, 'fh_hearth').find((c) => c.role === 'dockmaster') ?? null;
const pinsStraddleGate26 = 24 + 5 < GENERATED_KNOWN_TRUST && 29 + 5 >= GENERATED_KNOWN_TRUST;

// b1. below the gate: trust pinned 24 → post-bump 29 < 30 → no favor.
const favorsBeforeB1_26 = hearthDm26?.favors ?? -1;
if (hearthDm26) hearthDm26.trust = 24; // the wave-11 pin discipline
const cycB1_26 = w26RecoveryCycle('fh_hearth', 'aft-w26b1', 'wave26 earn-below');
const w26earnBelowChecks = {
  dockedAtHearth: ctx.flags.docked === true && ctx.world.currentSystem === 'fh_hearth',
  dockmasterFound: !!hearthDm26,
  pinsStraddleGate: pinsStraddleGate26,
  favorsStartedAt0: favorsBeforeB1_26 === 0,
  cycleRan: cycB1_26.btnFound && cycB1_26.podSpawned && cycB1_26.scooped,
  jobDone: cycB1_26.job?.state === 'done',
  postBumpTrustBelowGate: hearthDm26?.trust === 24 + 5 && hearthDm26?.trust < GENERATED_KNOWN_TRUST,
  noFavorBelowGate: hearthDm26?.favors === 0,
};
console.log('wave26 earn below gate:', JSON.stringify(w26earnBelowChecks));
if (!Object.values(w26earnBelowChecks).every(Boolean)) { console.log('WAVE26 EARN BELOW GATE FAIL'); errors++; }

// b2. at the gate: trust pinned 29 → post-bump 34 >= 30 → +1 favor.
if (hearthDm26) hearthDm26.trust = 29;
const cycB2_26 = w26RecoveryCycle('fh_hearth', 'aft-w26b2', 'wave26 earn-at-gate');
const w26earnAtGateChecks = {
  cycleRan: cycB2_26.btnFound && cycB2_26.podSpawned && cycB2_26.scooped,
  jobDone: cycB2_26.job?.state === 'done',
  postBumpTrustAtGate: hearthDm26?.trust === 29 + 5 && hearthDm26?.trust >= GENERATED_KNOWN_TRUST,
  favorBankedAtGate: hearthDm26?.favors === 1,
};
console.log('wave26 earn at gate:', JSON.stringify(w26earnAtGateChecks));
if (!Object.values(w26earnAtGateChecks).every(Boolean)) { console.log('WAVE26 EARN AT GATE FAIL'); errors++; }

// b3. authored NEGATIVE control: Mother Tarn (authored freehold dockmaster)
// at trust 100 completes a contract → the AUTHORED_SYSTEMS id guard falls
// through and favors stay 0 (the wave-25 b tarn25 control, through the real
// completion path).
undockStation();
travelTo('freehold', 'wave26 authored control leg');
dockAtCurrentStation('dock freehold (wave26 authored control)');
const tarn26 = contactsForSystem(ctx, 'freehold').find((c) => c.role === 'dockmaster') ?? null;
const tarnFavorsBefore26 = tarn26?.favors ?? -1;
if (tarn26) tarn26.trust = 100; // max trust — even here the authored id must fall through
const cycB3_26 = w26RecoveryCycle('freehold', 'aft-w26b3', 'wave26 earn-authored');
const w26earnAuthoredChecks = {
  dockedAtFreehold: ctx.flags.docked === true && ctx.world.currentSystem === 'freehold',
  tarnFound: !!tarn26,
  favorsStartedAt0: tarnFavorsBefore26 === 0,
  cycleRan: cycB3_26.btnFound && cycB3_26.podSpawned && cycB3_26.scooped,
  jobDone: cycB3_26.job?.state === 'done',
  trustClamped100: tarn26?.trust === 100, // bumpTrust clamps 0..100
  authoredNoFavorAt100: tarn26?.favors === 0,
};
console.log('wave26 earn authored control:', JSON.stringify(w26earnAuthoredChecks));
if (!Object.values(w26earnAuthoredChecks).every(Boolean)) { console.log('WAVE26 EARN AUTHORED CONTROL FAIL'); errors++; }

// -- c. spend: a generated dockmaster's marker comps the yard (real DOM) -----
// The wave-11 f keeper-comp drive extended to the generated branch at
// fh_hearth: the no-marker notice for favors <= 0, then the real spend —
// the comp flag mirrors on ctx.station, the notice speaks the faction's
// FACTION_COMP line, the repair screen shows that line verbatim as its
// screen-note (ui.compNote) with a zeroed bill, and undock clears the
// session state. fh_hearth flies the freehold flag (the wave-25 d ruling).
undockStation();
travelTo('fh_hearth', 'wave26 spend leg');
dockAtCurrentStation('dock hearth (wave26 spend)');
const fhFaction26 = SYSTEMS.fh_hearth.faction;
const compLine26 = FACTION_COMP[fhFaction26];
const favorsBanked26 = hearthDm26?.favors ?? -1; // 1, banked by b2's completion
// No-marker notice first: favors pinned 0, then restored via the real
// addFavor API (the wave-4 fence setup).
if (hearthDm26) hearthDm26.favors = 0;
dispatchKey('Digit7'); // people (DOCK_KEY_SERVICES[6])
const noMarkerBtn26 = w26FavorButton(hearthDm26?.name ?? '');
noMarkerBtn26?.click();
const noMarkerNotice26 = w26StationNotice();
const favorsAfterNoMarker26 = hearthDm26?.favors ?? -1;
const compFlagAfterNoMarker26 = ctx.station.keeperComp === true;
if (hearthDm26) addFavor(ctx, hearthDm26, favorsBanked26); // real API: re-bank the marker
const spendBtn26 = w26FavorButton(hearthDm26?.name ?? ''); // re-found — the click re-rendered
spendBtn26?.click(); // real path: spendFavor → session comp (the keeper-comp precedent)
const spendNotice26 = w26StationNotice();
const compFlagAfterSpend26 = ctx.station.keeperComp === true;
dispatchKey('Escape'); // people → services
w24Damage();
const compScreen26 = w24RepairScreen('wave26 hearth comp');
// Eager captures: compScreen26.ov is the LIVE overlay — the repair-click
// re-render and the Escape below rebuild it, so the notes must be read while
// the repair screen is still on show.
const compNoteShown26 = w24NoteShown(compScreen26.ov, compLine26);
const keeperLineAtHearth26 = w24NoteShown(compScreen26.ov, 'Comped by the keepers');
const creditsBeforeCompRepair26 = ctx.world.credits;
compScreen26.btn?.click();
tick(1, 'wave26 comped repair settle');
const madeWholeAfterComp26 = w24MadeWhole();
w24RepinHull();
dispatchKey('Escape'); // repair → services
undockStation();
const compFlagAfterUndock26 = ctx.station.keeperComp === true;
// The comp died with the berth visit: a fresh dock shows no comp note and a
// real bill (ui.compNote is module-private; this is its observable reset).
dockAtCurrentStation('redock hearth (wave26 reset proof)');
w24Damage();
const resetScreen26 = w24RepairScreen('wave26 hearth reset');
const redockCompNoteGone26 = !w24NoteShown(resetScreen26.ov, compLine26); // eager — same live-overlay discipline
w24RepinHull();
dispatchKey('Escape'); // repair → services
const w26spendChecks = {
  dockedAtHearth: ctx.flags.docked === true && ctx.world.currentSystem === 'fh_hearth',
  hearthIsFreeholdFlag: fhFaction26 === 'freehold',
  bankedFromEarn: favorsBanked26 === 1,
  noMarkerButtonFound: !!noMarkerBtn26,
  noMarkerNotice: noMarkerNotice26 === `${hearthDm26?.name} spreads their hands. “You hold no marker with me.”`,
  noMarkerNoSpend: favorsAfterNoMarker26 === 0,
  noMarkerNoFlag: !compFlagAfterNoMarker26,
  spendButtonFound: !!spendBtn26,
  favorSpent: hearthDm26?.favors === favorsBanked26 - 1,
  compFlagSet: compFlagAfterSpend26,
  spendNotice: spendNotice26 === `${hearthDm26?.name} waves the yard off. “${compLine26}”`,
  compLineDiscriminates: compLine26 !== 'Comped by the keepers',
  repairButtonFound: !!compScreen26.btn,
  compedTotalZero: compScreen26.labelCost === 0,
  compNoteIsFactionLine: compNoteShown26,
  keeperLineNotShown: !keeperLineAtHearth26,
  repairAllDeducts0: ctx.world.credits === creditsBeforeCompRepair26,
  madeWhole: madeWholeAfterComp26,
  undockClearsCompFlag: !compFlagAfterUndock26,
  redockNoCompNote: redockCompNoteGone26,
  redockRealBill: resetScreen26.labelCost > 0,
};
console.log('wave26 dockmaster favor spend:', JSON.stringify(w26spendChecks), `comp=${JSON.stringify(compLine26)}`);
if (!Object.values(w26spendChecks).every(Boolean)) { console.log('WAVE26 DOCKMASTER FAVOR SPEND FAIL'); errors++; }

// c2. the keeper path keeps its own line — the wave-11 pin, preserved
// verbatim: a keeper's spent marker sets ui.compNote to 'Comped by the
// keepers' and the repair screen shows exactly that. Driven at the BFS-
// nearer of the two deep-rim keeps.
const keeperSys26 = ((routePath('fh_hearth', 'hush') ?? []).length || 99)
  <= ((routePath('fh_hearth', 'verge') ?? []).length || 99) ? 'hush' : 'verge';
undockStation();
travelTo(keeperSys26, 'wave26 keeper pin leg');
dockAtCurrentStation(`dock ${keeperSys26} (wave26 keeper pin)`);
const keeper26 = contactsForSystem(ctx, keeperSys26).find((c) => c.role === 'dockmaster') ?? null;
const keeperFavorsBefore26 = keeper26?.favors ?? -1;
if (keeper26) addFavor(ctx, keeper26, 1); // real API: bank the marker to spend
w24Damage();
dispatchKey('Digit7'); // people
const keeperFavorBtn26 = keeper26 ? w26FavorButton(keeper26.name) : null;
keeperFavorBtn26?.click(); // real path: spendFavor → per-session keeper comp
const keeperNotice26 = w26StationNotice();
const keeperCompFlag26 = ctx.station.keeperComp === true;
dispatchKey('Escape'); // people → services
const keeperScreen26 = w24RepairScreen('wave26 keeper comp');
const keeperLineShown26 = w24NoteShown(keeperScreen26.ov, 'Comped by the keepers'); // eager — the live-overlay discipline
const creditsBeforeKeeperRepair26 = ctx.world.credits;
keeperScreen26.btn?.click();
tick(1, 'wave26 keeper comp settle');
const madeWholeKeeper26 = w24MadeWhole();
w24RepinHull();
dispatchKey('Escape'); // repair → services
const w26keeperChecks = {
  keeperSystemPicked: keeperSys26 === 'hush' || keeperSys26 === 'verge',
  dockedAtKeeper: ctx.flags.docked === true && ctx.world.currentSystem === keeperSys26,
  keeperFound: !!keeper26,
  favorButtonFound: !!keeperFavorBtn26,
  favorSpent: keeper26?.favors === keeperFavorsBefore26,
  compFlagSet: keeperCompFlag26,
  keeperNoticeKept: keeperNotice26 === `${keeper26?.name} waves the yard off. “The keepers comp this dock. Mend your ship.”`,
  keeperLineShownVerbatim: keeperLineShown26,
  compedTotalZero: keeperScreen26.labelCost === 0,
  repairAllDeducts0: ctx.world.credits === creditsBeforeKeeperRepair26,
  madeWhole: madeWholeKeeper26,
};
console.log('wave26 keeper comp pin:', JSON.stringify(w26keeperChecks), `keeper=${keeperSys26}`);
if (!Object.values(w26keeperChecks).every(Boolean)) { console.log('WAVE26 KEEPER COMP PIN FAIL'); errors++; }

// -- d/e. ferry + haul quote==pay: the accept-time snapshot IS the agreement -
// Lane picked off the live graph (the wave-24 d leg-plan ruling): a generated
// non-hub origin whose primary-gate destination's jobPay chain differs from
// its own, preferring both-ends epic-neutral so the faction modifier reads
// exactly. (veridian/congregation/independent are the only jobPayMult flags
// and the generated graph holds no congregation↔independent gate pair — the
// scan settles on the first epic-neutral svc-differing pair it finds.)
const lanePool26 = nonHubIds24.filter((o) => {
  const d = SYSTEMS[o].gates?.[0]?.to;
  return !!SYSTEMS[d] && svcJobMult26(o) !== svcJobMult26(d);
});
const laneNeutralPool26 = lanePool26.filter((o) => epicJobMult26(o) === 1 && epicJobMult26(SYSTEMS[o].gates[0].to) === 1);
const laneO26 = (laneNeutralPool26[0] ?? lanePool26[0]) ?? null;
const laneD26 = laneO26 ? SYSTEMS[laneO26].gates[0].to : null;
const w26laneChecks = {
  laneFound: !!laneO26 && !!laneD26,
  svcMultsDiffer: !!laneO26 && svcJobMult26(laneO26) !== svcJobMult26(laneD26),
  laneEpicNeutral: !!laneO26 && epicJobMult26(laneO26) === 1 && epicJobMult26(laneD26) === 1,
};
console.log('wave26 lane pick:', JSON.stringify(w26laneChecks), `lane=${laneO26}->${laneD26}`);
if (!Object.values(w26laneChecks).every(Boolean)) { console.log('WAVE26 LANE PICK FAIL'); errors++; }

undockStation();
if (laneO26) travelTo(laneO26, 'wave26 lane leg');
dockAtCurrentStation(`dock ${laneO26} (wave26 quote)`);
const ferryJob26 = ctx.world.jobs.find((j) => j.id === 'ferry-consignment') ?? null;
const haulJob26 = ctx.world.jobs.find((j) => j.id === 'haul-provisions') ?? null;
// TEST SETUP (self-restoring): the galaxy carries ONE ferry contract and ONE
// haul contract; wave 4 did the freehold→veridian ferry, so re-offer it for
// this lane — the real accept/deliver cycle below takes it back to done.
if (ferryJob26) { ferryJob26.state = 'offered'; ferryJob26.originSystem = null; ferryJob26.destSystem = null; delete ferryJob26.payQuoted; }
// Free the hold for the consignment + haul load through the REAL market path
// (the wave-9/11 sell discipline): the recovery cycles' scooped refined
// metals ride the hold by this point in the run — sell down whatever is
// aboard until the fronted 4 + the 5-unit load genuinely fit.
const needFree26 = (ferryJob26?.need ?? 4) + (haulJob26?.need ?? 5);
dispatchKey('Digit1'); // market (DOCK_KEY_SERVICES[0])
let sellGuard26 = 60;
while (ctx.cargoCapacity - ctx.cargo.reduce((n, c) => n + c.units, 0) < needFree26 && sellGuard26-- > 0) {
  const held = ctx.cargo.find((c) => c.units > 0 && COMMODITIES[c.commodity]?.legal);
  if (!held) break;
  const sellBtn26 = marketTradeButton(COMMODITIES[held.commodity].name, '−1');
  if (!sellBtn26) break;
  sellBtn26.click(); // real path: tryTrade(commodity, 1, false) — re-found per click (each trade re-renders)
}
dispatchKey('Escape'); // market → services
const freeCap26 = ctx.cargoCapacity - ctx.cargo.reduce((n, c) => n + c.units, 0);
const provAtLaneStart26 = holdCount('provisions');
// One tick-free window: the board render, both quote parses, and both real
// accepts read the same provisions price (the random walk only moves on
// ticks, and acceptJob runs synchronously inside the button click).
dispatchKey('Digit2'); // jobs board
const ferryQuoteText26 = w26JobRewardLine('Ferry a consignment');
const haulQuoteText26 = w26JobRewardLine('Haul provisions');
const ferryQuoted26 = Number((ferryQuoteText26?.match(/pays (\d+) UU/) ?? [])[1]);
const haulQuoted26 = Number((haulQuoteText26?.match(/pays (\d+) UU/) ?? [])[1]);
const priceAtAccept26 = ctx.world.prices.provisions ?? COMMODITIES.provisions.base; // station.js priceOf
const ferryAcceptBtn26 = w26CardAcceptButton('Ferry a consignment');
ferryAcceptBtn26?.click(); // real accept: stamps destSystem + payQuoted, fronts the consignment
const haulAcceptBtn26 = w26CardAcceptButton('Haul provisions'); // re-found — the ferry accept re-rendered
haulAcceptBtn26?.click(); // real accept: stamps originSystem/originPrice + payQuoted
const ferryStamp26 = ferryJob26?.payQuoted;
const haulStamp26 = haulJob26?.payQuoted;
// Accepted cards re-render the SAME quoted number (the snapshot, not a re-price).
const ferryAcceptedText26 = w26JobRewardLine('Ferry a consignment');
const haulAcceptedText26 = w26JobRewardLine('Haul provisions');
const w26ferryQuoteChecks = {
  dockedAtLaneOrigin: ctx.flags.docked === true && ctx.world.currentSystem === laneO26,
  jobsFound: !!ferryJob26 && !!haulJob26,
  holdRoomFor9: freeCap26 >= needFree26,
  ferryCardQuoted: Number.isFinite(ferryQuoted26),
  quoteIsDestChain: ferryQuoted26 === w26JobPayFor(laneD26, ferryJob26?.reward),
  destChainDiscriminates: w26JobPayFor(laneO26, ferryJob26?.reward) !== ferryQuoted26,
  acceptButtonFound: !!ferryAcceptBtn26,
  jobAccepted: ferryJob26?.state === 'accepted',
  destStamped: ferryJob26?.destSystem === laneD26,
  payQuotedStamped: ferryStamp26 === ferryQuoted26 && ferryStamp26 === w26JobPayFor(laneD26, ferryJob26?.reward),
  provisionsFronted: holdCount('provisions') === provAtLaneStart26 + (ferryJob26?.need ?? 4),
  acceptedCardShowsQuote: ferryAcceptedText26 === ferryQuoteText26,
};
console.log('wave26 ferry quote:', JSON.stringify(w26ferryQuoteChecks), `quoted=${ferryQuoted26}`);
if (!Object.values(w26ferryQuoteChecks).every(Boolean)) { console.log('WAVE26 FERRY QUOTE FAIL'); errors++; }
const w26haulQuoteChecks = {
  haulCardQuoted: Number.isFinite(haulQuoted26),
  marginPinnedInCardText: haulQuoteText26?.includes('140% of buy cost') === true,
  quoteIsDestChain: haulQuoted26 === w26JobPayFor(laneD26, Math.round((haulJob26?.need ?? 5) * priceAtAccept26 * 1.4)),
  destChainDiscriminates: w26JobPayFor(laneO26, Math.round((haulJob26?.need ?? 5) * priceAtAccept26 * 1.4)) !== haulQuoted26,
  acceptButtonFound: !!haulAcceptBtn26,
  jobAccepted: haulJob26?.state === 'accepted',
  originStamped: haulJob26?.originSystem === laneO26 && haulJob26?.originPrice === priceAtAccept26,
  payQuotedStamped: haulStamp26 === haulQuoted26
    && haulStamp26 === w26JobPayFor(laneD26, Math.round((haulJob26?.need ?? 5) * (haulJob26?.originPrice ?? 0) * 1.4)),
  acceptedCardShowsQuote: haulAcceptedText26 === haulQuoteText26,
};
console.log('wave26 haul quote:', JSON.stringify(w26haulQuoteChecks), `quoted=${haulQuoted26}`);
if (!Object.values(w26haulQuoteChecks).every(Boolean)) { console.log('WAVE26 HAUL QUOTE FAIL'); errors++; }

// Buy the haul load through the real market (the wave-24 d3 cell/click path,
// re-found per click — each trade re-renders), then fly the lane and dock:
// the throttled delivery tick pays both contracts off their snapshots.
dispatchKey('Escape'); // jobs → services
dispatchKey('Digit1'); // market (DOCK_KEY_SERVICES[0])
let bought26 = 0;
for (let i = 0; i < (haulJob26?.need ?? 5); i++) {
  const provBeforeClick26 = holdCount('provisions');
  const b = marketTradeButton('Provisions', '+1');
  if (!b) break;
  b.click(); // real path: tryTrade('provisions', 1, true)
  if (holdCount('provisions') === provBeforeClick26 + 1) bought26++; // count units actually aboard, not clicks
}
const provAtDeparture26 = holdCount('provisions');
dispatchKey('Escape'); // market → services
undockStation();
if (laneD26) travelTo(laneD26, 'wave26 delivery leg');
const creditsBeforeDelivery26 = ctx.world.credits;
dockAtCurrentStation(`dock ${laneD26} (wave26 delivery)`);
const payLines26 = [];
for (let i = 0; i < 90; i++) {
  tick(1, 'wave26 delivery tick');
  for (const e of ctx.lastEvents) if (e.type === 'commLine') payLines26.push(e.text);
}
const ferryPaidLine26 = payLines26.find((t) => t.startsWith('Consignment landed intact')) ?? null;
const haulPaidLine26 = payLines26.find((t) => t.startsWith('Provisions delivered')) ?? null;
const ferryPaid26 = Number((ferryPaidLine26?.match(/— (\d+) UU/) ?? [])[1]);
const haulPaid26 = Number((haulPaidLine26?.match(/— (\d+) UU/) ?? [])[1]);
const w26deliveryChecks = {
  boughtTheLoad: bought26 === (haulJob26?.need ?? 5),
  holdLoadedForBoth: provAtDeparture26 === provAtLaneStart26 + (ferryJob26?.need ?? 4) + (haulJob26?.need ?? 5),
  dockedAtLaneDest: ctx.flags.docked === true && ctx.world.currentSystem === laneD26,
  ferryPaidExactlyQuoted: ferryPaid26 === ferryQuoted26 && ferryPaid26 === ferryStamp26,
  haulPaidExactlyQuoted: haulPaid26 === haulQuoted26 && haulPaid26 === haulStamp26,
  haulPaidIs140UnderDestChain: haulPaid26 === w26JobPayFor(laneD26, Math.round((haulJob26?.need ?? 5) * (haulJob26?.originPrice ?? 0) * 1.4)),
  creditsDeltaIsBothQuotes: ctx.world.credits - creditsBeforeDelivery26 === ferryQuoted26 + haulQuoted26,
  ferryDone: ferryJob26?.state === 'done',
  haulDone: haulJob26?.state === 'done',
};
console.log('wave26 lane delivery:', JSON.stringify(w26deliveryChecks), `ferryPaid=${ferryPaid26} haulPaid=${haulPaid26}`);
if (!Object.values(w26deliveryChecks).every(Boolean)) { console.log('WAVE26 LANE DELIVERY FAIL'); errors++; }

// -- f. old-save fallback: an accepted ferry WITHOUT payQuoted pays the live -
// chain at the destination (the wave-6 behavior preserved) --------------------
// The reset/accept/delete is test SETUP the real cycle restores: the contract
// returns to done by delivery. The snapshot the real accept stamps is
// captured first (proving the stamp path ran), then deleted to simulate the
// pre-wave-26 save.
if (ferryJob26) { ferryJob26.state = 'offered'; ferryJob26.originSystem = null; ferryJob26.destSystem = null; delete ferryJob26.payQuoted; }
dispatchKey('Digit2'); // jobs board (the delivery dock left the overlay at services)
const ferryReacceptBtn26 = w26CardAcceptButton('Ferry a consignment');
ferryReacceptBtn26?.click();
const destF26 = ferryJob26?.destSystem ?? null; // otherSystemId of the lane destination, stamped by the real accept
const stampedF26 = ferryJob26?.payQuoted;
if (ferryJob26) delete ferryJob26.payQuoted; // old-save simulation: accepted, no snapshot
undockStation();
if (destF26) travelTo(destF26, 'wave26 fallback leg');
const creditsBeforeFallback26 = ctx.world.credits;
dockAtCurrentStation(`dock ${destF26} (wave26 fallback)`);
tick(90, 'wave26 fallback payout tick');
// The throttled delivery tick can land inside the dock's own settle ticks,
// before any post-dock collection window opens — so the paid figure is the
// observed credits delta around the whole dock+settle window (jobDone pins
// that the delivery is what moved them).
const fallbackPaid26 = ctx.world.credits - creditsBeforeFallback26;
const liveChainAtPayout26 = destF26 ? w26JobPayFor(destF26, ferryJob26?.reward) : NaN; // jobPay under the CURRENT chain
const w26fallbackChecks = {
  reacceptButtonFound: !!ferryReacceptBtn26,
  acceptStampedSnapshot: Number.isFinite(stampedF26) && stampedF26 === liveChainAtPayout26,
  snapshotDeleted: !!ferryJob26 && !('payQuoted' in ferryJob26),
  dockedAtFallbackDest: ctx.flags.docked === true && ctx.world.currentSystem === destF26,
  deliveryFired: ferryJob26?.state === 'done',
  paidViaLiveChain: fallbackPaid26 === liveChainAtPayout26,
};
console.log('wave26 old-save fallback:', JSON.stringify(w26fallbackChecks), `dest=${destF26} paid=${fallbackPaid26}`);
if (!Object.values(w26fallbackChecks).every(Boolean)) { console.log('WAVE26 OLD-SAVE FALLBACK FAIL'); errors++; }

// -- g. save roundtrip: job.payQuoted + banked dockmaster favors survive -----
// The wave-23 e / wave-24 e pattern where the run ended docked: re-offer the
// ferry, accept it for real (snapshot stamped) and leave it OPEN — its
// destination is never the save dock — bank favors on the hearth dockmaster
// through the real addFavor API, park hostiles so the autosave can't be
// combat-blocked, cycle the dock so the 'docked' autosave carries the state,
// assert the save, corrupt in memory, die, recover via Enter, assert the
// restore.
if (ferryJob26) { ferryJob26.state = 'offered'; ferryJob26.originSystem = null; ferryJob26.destSystem = null; delete ferryJob26.payQuoted; }
dispatchKey('Digit2'); // jobs board
const ferrySaveAcceptBtn26 = w26CardAcceptButton('Ferry a consignment');
ferrySaveAcceptBtn26?.click(); // real accept: snapshot stamped, consignment fronted
const quotedG26 = ferryJob26?.payQuoted;
const destG26 = ferryJob26?.destSystem ?? null;
if (hearthDm26) addFavor(ctx, hearthDm26, 2); // real API: markers in the bank
const bankedFavors26 = hearthDm26?.favors ?? -1;
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave26 save)');
dispatchKey('Escape'); // jobs → services
undockStation();
dockAtCurrentStation(`dock ${destF26} (wave26 save)`); // 'docked' fires trySave with the open contract banked
tick(3, 'wave26 save settle');
const w26snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
const snapJob26 = (w26snap?.world?.jobs ?? []).find((j) => j.id === 'ferry-consignment') ?? null;
const snapHearth26 = (w26snap?.world?.contacts ?? []).find((c) => c.id === 'contact-fh_hearth-dockmaster') ?? null;
const w26saveChecks = {
  saveWritten: !!w26snap?.world,
  rosterInSave103: (w26snap?.world?.contacts ?? []).length === 103,
  acceptButtonFound: !!ferrySaveAcceptBtn26,
  contractOpenInSave: snapJob26?.state === 'accepted' && snapJob26?.destSystem === destG26 && destG26 !== destF26,
  payQuotedInSave: Number.isFinite(quotedG26) && snapJob26?.payQuoted === quotedG26,
  favorsInSave: bankedFavors26 > 0 && snapHearth26?.favors === bankedFavors26,
};
console.log('wave26 save fields:', JSON.stringify(w26saveChecks), `snapJob=${JSON.stringify(snapJob26)}`);
if (!Object.values(w26saveChecks).every(Boolean)) { console.log('WAVE26 SAVE FIELDS FAIL'); errors++; }

// Corrupt in memory (drop the snapshot, empty the bank), die, recover from
// the dock autosave (Enter skips the hold): both come back, roster 103
// intact. The restore swaps the jobs/contacts arrays wholesale, so the
// restored records are re-found through ctx.world.
if (ferryJob26) delete ferryJob26.payQuoted;
if (hearthDm26) hearthDm26.favors = 0;
tick(2, 'wave26 fields corrupted');
const w26corrupted = !!ferryJob26 && !('payQuoted' in ferryJob26) && hearthDm26?.favors === 0;
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave26 restore)');
dispatchKey('Enter'); // recover(): restore(last save)
const restoredJob26 = ctx.world.jobs.find((j) => j.id === 'ferry-consignment') ?? null;
const restoredHearth26 = contactsForSystem(ctx, 'fh_hearth').find((c) => c.role === 'dockmaster') ?? null;
const w26restoreChecks = {
  corruptedFirst: w26corrupted,
  rosterRestored103: (ctx.world.contacts ?? []).length === 103,
  payQuotedRestored: restoredJob26?.state === 'accepted' && restoredJob26?.payQuoted === quotedG26,
  favorsRestored: restoredHearth26?.favors === bankedFavors26,
};
console.log('wave26 restore:', JSON.stringify(w26restoreChecks));
if (!Object.values(w26restoreChecks).every(Boolean)) { console.log('WAVE26 RESTORE FAIL'); errors++; }

// ---- Wave 27: Beautiful Ones organic technology — grown ships, station, ---
// ---- gate overgrowth, glazed landmarks (toolkit pure shapes, real spawns, -
// ---- the bt_cradle scene, a real dock, the animation drive, save/rebuild) --

// Generic scene find-by-name (the w22junctionsAt :560 shape, generalized) —
// every wave-27 scene lookup rides this one helper instead of ad-hoc closures.
const findByName = (name) => {
  const found = [];
  ctx.scene.traverse((o) => { if (o.name === name) found.push(o); });
  return found;
};
// POI lookups key on userData.poiId (landmarks carry no name) — one shared
// collector for the pieces, one for the organic glaze root.
const w27poiPieces = (poiId) => {
  const found = [];
  ctx.scene.traverse((o) => { if (o.userData.poiId === poiId) found.push(o); });
  return found;
};
const w27organicPoi = (poiId) => {
  let root = null;
  ctx.scene.traverse((o) => { if (o.userData.poiId === poiId && o.userData.organic === true) root = o; });
  return root;
};
const w27lm = SYSTEMS.bt_cradle.landmarks[0];

// -- a. toolkit shapes (pure — no scene, no ticks, nothing to restore beyond -
// the synthetic parts' own transforms) ---------------------------------------
const w27hull = sculptGrownHull();
const w27petal = makePetalGeometry();
const w27tendril = makeTendrilGeometry();
const w27matsA = organicMaterials();
const w27matsA2 = organicMaterials();
const w27matsT = organicMaterials({ tarnished: true });
const w27matsT2 = organicMaterials({ tarnished: true });
// A synthetic tagged assembly (never added to the scene): one sway object,
// one breath object, one pulse-tagged PER-TEST material (never a cached
// shared one — pulse params live on material.userData).
const w27synRoot = new THREE.Group();
const w27synSway = new THREE.Object3D();
w27synSway.rotation.z = 0.4;
w27synRoot.add(w27synSway);
tagSway(w27synSway, { axis: 'z', amp: 0.2, hz: 0.5, phase: 0.25 });
const w27synBreath = new THREE.Object3D();
w27synBreath.scale.setScalar(2);
w27synRoot.add(w27synBreath);
tagBreath(w27synBreath, { depth: 0.1, hz: 0.5 });
const w27synPulseMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 });
tagPulse(w27synPulseMat, { amp: 0.2, hz: 0.5 });
w27synRoot.add(new THREE.Mesh(w27petal, w27synPulseMat));
const w27synParts = collectOrganic(w27synRoot);
// Deterministic drive times solved off the tag params themselves: the peak
// (sin = +1) and trough (sin = -1) of the sway cycle, so the expected values
// are exact — no RNG anywhere in this section.
const TAU27 = Math.PI * 2;
const w27sd = w27synSway.userData.sway;
const w27bd = w27synBreath.userData.breath;
const w27pd = w27synPulseMat.userData.pulse;
let w27tPeak = (0.25 - w27sd.phase / TAU27) / w27sd.hz;
while (w27tPeak <= 0) w27tPeak += 1 / w27sd.hz;
const w27tTrough = w27tPeak + 0.5 / w27sd.hz;
animateOrganic(w27synParts, w27tPeak, false);
const w27aSwayPeak = w27synSway.rotation[w27sd.axis];
const w27aBreathPeak = w27synBreath.scale.x;
const w27aPulsePeak = w27synPulseMat[w27pd.prop];
animateOrganic(w27synParts, w27tTrough, false);
const w27aSwayTrough = w27synSway.rotation[w27sd.axis];
const w27aBreathTrough = w27synBreath.scale.x;
const w27aPulseTrough = w27synPulseMat[w27pd.prop];
animateOrganic(w27synParts, w27tPeak + 9.17, true); // reducedMotion: complete no-op
const w27aSwayFrozen = w27synSway.rotation[w27sd.axis];
const w27aBreathFrozen = w27synBreath.scale.x;
const w27aPulseFrozen = w27synPulseMat[w27pd.prop];
// Restore the synthetic parts to their stashed bases (the frozen state).
w27synSway.rotation[w27sd.axis] = w27sd.base;
w27synBreath.scale.setScalar(w27bd.baseScale);
w27synPulseMat[w27pd.prop] = w27pd.base;
const w27toolkitChecks = {
  hullShape: w27hull.count > 0 && w27hull.base.length === w27hull.count * 3
    && w27hull.zNorm.length === w27hull.count && w27hull.wingness.length === w27hull.count
    && w27hull.geo.attributes.position.count === w27hull.count,
  petalShape: w27petal.isBufferGeometry === true && w27petal.index !== null
    && !!w27petal.attributes.normal && !!w27petal.attributes.uv,
  tendrilShape: w27tendril.isBufferGeometry === true && w27tendril.index !== null
    && !!w27tendril.attributes.normal && !!w27tendril.attributes.uv,
  matsIdentityCached: w27matsA === w27matsA2 && w27matsT === w27matsT2
    && w27matsT !== w27matsA && w27matsT.flesh !== w27matsA.flesh,
  matsMarkedShared: ['flesh', 'membrane', 'gilt', 'veinGlow']
    .every((k) => w27matsA[k].userData.shared === true && w27matsT[k].userData.shared === true),
  collectFindsTags: w27synParts.sway.length === 1 && w27synParts.sway[0] === w27synSway
    && w27synParts.breath.length === 1 && w27synParts.breath[0] === w27synBreath
    && w27synParts.pulse.length === 1 && w27synParts.pulse[0] === w27synPulseMat,
  swayFormulaExact: w27aSwayPeak === w27sd.base + Math.sin(TAU27 * w27sd.hz * w27tPeak + w27sd.phase) * w27sd.amp
    && w27aSwayTrough === w27sd.base + Math.sin(TAU27 * w27sd.hz * w27tTrough + w27sd.phase) * w27sd.amp
    && Math.abs(w27aSwayPeak - (w27sd.base + w27sd.amp)) < 1e-9
    && Math.abs(w27aSwayTrough - (w27sd.base - w27sd.amp)) < 1e-9
    && w27aSwayPeak !== w27aSwayTrough,
  breathFormulaExact: w27aBreathPeak === w27bd.baseScale * (1 + w27bd.depth * Math.sin(TAU27 * w27bd.hz * w27tPeak + w27bd.phase)),
  pulseFormulaExact: w27aPulsePeak === w27pd.base + w27pd.amp * Math.sin(TAU27 * w27pd.hz * w27tPeak + w27pd.phase),
  frozenUnderReducedMotion: w27aSwayFrozen === w27aSwayTrough
    && w27aBreathFrozen === w27aBreathTrough && w27aPulseFrozen === w27aPulseTrough,
};
// The test-owned geometry/materials dispose; the cached shared sets NEVER do.
w27hull.geo.dispose();
w27petal.dispose();
w27tendril.dispose();
w27synPulseMat.dispose();
console.log('wave27 toolkit:', JSON.stringify(w27toolkitChecks));
if (!Object.values(w27toolkitChecks).every(Boolean)) { console.log('WAVE27 TOOLKIT FAIL'); errors++; }

// -- b. ship meshes: the real spawnLiveShip drive (the :1849 Illyx pattern: ---
// construct + assert + remove, no ticks — the live objects never join
// ctx.ships, traffic owns that list) ------------------------------------------
const w27spawnPos = new THREE.Vector3(0, 0, 0);
const w27freighterLive = spawnLiveShip(ctx, {
  id: 'wave27-freighter', name: 'Shell of Former Glory', classKey: 'freighter',
  faction: 'beautiful', role: 'trader', resolve: 50,
}, w27spawnPos);
const w27cutterLive = spawnLiveShip(ctx, {
  id: 'wave27-cutter', name: 'Fallen Petal', classKey: 'cutter',
  faction: 'beautiful', role: 'pirate', resolve: 50,
}, w27spawnPos);
const w27veridianLive = spawnLiveShip(ctx, {
  id: 'wave27-veridian', name: 'Plain Control', classKey: 'freighter',
  faction: 'veridian', role: 'trader', resolve: 50,
}, w27spawnPos);
const w27finsIn = (root) => {
  let n = 0;
  root.traverse((o) => { if (o.name === 'beautiful-fin') n++; });
  return n;
};
const w27shipChecks = {
  freighterNamed: w27freighterLive.object.name === 'beautiful-ship',
  freighterOrganicTags: w27freighterLive.object.userData.organic?.classKey === 'freighter'
    && w27freighterLive.object.userData.organic?.role === 'trader'
    && w27freighterLive.object.userData.organic?.tarnished === false,
  freighterFins: w27finsIn(w27freighterLive.object) >= 2,
  freighterGlowMint: !!w27freighterLive.object.userData.glow
    && w27freighterLive.object.userData.glow.material?.color?.getHex() === ORGANIC.mint,
  cutterTarnished: w27cutterLive.object.name === 'beautiful-ship'
    && w27cutterLive.object.userData.organic?.classKey === 'cutter'
    && w27cutterLive.object.userData.organic?.role === 'pirate'
    && w27cutterLive.object.userData.organic?.tarnished === true,
  veridianNegativeControl: w27veridianLive.object.name !== 'beautiful-ship'
    && w27veridianLive.object.userData.organic === undefined
    && !!w27veridianLive.object.userData.glow,
};
removeLiveShip(ctx, w27freighterLive);
removeLiveShip(ctx, w27cutterLive);
removeLiveShip(ctx, w27veridianLive);
console.log('wave27 ship meshes:', JSON.stringify(w27shipChecks));
if (!Object.values(w27shipChecks).every(Boolean)) { console.log('WAVE27 SHIP MESH FAIL'); errors++; }

// -- c. freehold negative controls, then the real 3-leg flight to bt_cradle ---
// The run is docked at the wave-26 save system; freehold first for the
// authored-system control readings, then travelTo BFS-hops the real legs
// (freehold→veridian physical, veridian hub→gc_auction, gc_auction hub→
// bt_cradle).
if (ctx.flags.docked) undockStation();
travelTo('freehold', 'wave27 freehold control leg');
const w27freeholdOrganicPois = (() => {
  let n = 0;
  ctx.scene.traverse((o) => { if (o.userData.poiId && o.userData.organic === true) n++; });
  return n;
})();
const w27controlChecks = {
  factionGuard: !isBeautiful(SYSTEMS.freehold.faction) && isBeautiful(SYSTEMS.bt_cradle.faction),
  noBeautifulStation: findByName('beautiful-station').length === 0,
  noOvergrowth: findByName('beautiful-overgrowth').length === 0,
  noBuds: findByName('beautiful-bud').length === 0,
  noOrganicPois: w27freeholdOrganicPois === 0,
};
console.log('wave27 freehold controls:', JSON.stringify(w27controlChecks));
if (!Object.values(w27controlChecks).every(Boolean)) { console.log('WAVE27 FREEHOLD CONTROL FAIL'); errors++; }

travelTo('bt_cradle', 'wave27 cradle leg');
const w27stationGroups = findByName('beautiful-station');
const w27gateGroups = findByName('lamplighter-gate');
const w27stPos = SYSTEMS.bt_cradle.station.position;
const w27overIn = (g) => {
  let n = 0;
  g.traverse((o) => { if (o.name === 'beautiful-overgrowth') n++; });
  return n;
};
let w27overPerGate = w27gateGroups.length > 0;
let w27budsPerGate = w27gateGroups.length > 0;
for (const g of w27gateGroups) {
  if (w27overIn(g) !== 1) w27overPerGate = false;
  let buds = 0;
  let allSprites = true;
  g.traverse((o) => { if (o.name === 'beautiful-bud') { buds++; if (!o.isSprite) allSprites = false; } });
  if (buds !== 4 || !allSprites) w27budsPerGate = false;
}
const w27lmPieces = w27poiPieces(w27lm.id);
const w27lmRoot = w27organicPoi(w27lm.id);
const w27sceneChecks = {
  arrivedAtCradle: ctx.world.currentSystem === 'bt_cradle',
  oneBeautifulStation: w27stationGroups.length === 1 && w27stationGroups[0].userData.organic === true,
  stationAtDataPosition: w27stationGroups.length === 1
    && Math.hypot(
      w27stationGroups[0].position.x - w27stPos[0],
      w27stationGroups[0].position.y - w27stPos[1],
      w27stationGroups[0].position.z - w27stPos[2],
    ) < 1e-6,
  gateCountMatchesData: w27gateGroups.length === SYSTEMS.bt_cradle.gates.length,
  overgrowthPerGate: w27overPerGate,
  fourBudSpritesPerGate: w27budsPerGate,
  landmarkTagsKept: w27lmPieces.length >= 1
    && w27lmPieces.every((o) => o.userData.poiType === 'landmark' && o.userData.kind === w27lm.kind),
  landmarkGlazeRoot: !!w27lmRoot && w27lmRoot.userData.poiId === w27lm.id
    && w27lmRoot.userData.poiType === 'landmark' && w27lmRoot.userData.kind === w27lm.kind,
};
console.log('wave27 cradle scene:', JSON.stringify(w27sceneChecks));
if (!Object.values(w27sceneChecks).every(Boolean)) { console.log('WAVE27 CRADLE SCENE FAIL'); errors++; }

// -- d. a real dock at The Cradle — the organic station is mechanically -------
// transparent (dock zone, overlay, undock all ride the data position) --------
dockAtCurrentStation('dock cradle (wave27)');
const w27dockChecks = {
  docked: ctx.flags.docked === true && ctx.world.currentSystem === 'bt_cradle',
  atTheCradle: ctx.station.name === SYSTEMS.bt_cradle.station.name,
  overlayOpen: stationOverlay() !== null,
};
undockStation();
w27dockChecks.undockedClean = ctx.flags.docked === false;
console.log('wave27 cradle dock:', JSON.stringify(w27dockChecks));
if (!Object.values(w27dockChecks).every(Boolean)) { console.log('WAVE27 CRADLE DOCK FAIL'); errors++; }

// -- e. the animation drive on the live station group --------------------------
// collectOrganic fresh off the scene group (the boot-test hook), drive the
// widest-amplitude sway part to its exact peak/trough, prove the
// reducedMotion no-op, then restore every value animateOrganic can touch to
// its pre-drive snapshot. No ticks between calls — station.update re-drives
// from the stashed bases on the next frame, so nothing drifts.
const w27animStation = findByName('beautiful-station')[0] ?? null;
const w27animParts = w27animStation ? collectOrganic(w27animStation) : { sway: [], breath: [], pulse: [] };
let w27swayObj = null;
for (const o of w27animParts.sway) {
  if (!w27swayObj || Math.abs(o.userData.sway.amp) > Math.abs(w27swayObj.userData.sway.amp)) w27swayObj = o;
}
const w27breathObj = w27animParts.breath[0] ?? null;
const w27ad = w27swayObj?.userData.sway ?? null;
const w27adBreath = w27breathObj?.userData.breath ?? null;
const w27snapSway = w27animParts.sway.map((o) => [o, o.userData.sway.axis, o.rotation[o.userData.sway.axis]]);
const w27snapBreath = w27animParts.breath.map((o) => [o, o.scale.x]);
const w27snapPulse = w27animParts.pulse.map((m) => [m, m.userData.pulse.prop, m[m.userData.pulse.prop]]);
let w27animPeakT = 0;
let w27animTroughT = 0;
if (w27ad) {
  w27animPeakT = (0.25 - w27ad.phase / TAU27) / w27ad.hz;
  while (w27animPeakT <= 0) w27animPeakT += 1 / w27ad.hz;
  w27animTroughT = w27animPeakT + 0.5 / w27ad.hz;
  animateOrganic(w27animParts, w27animPeakT, false);
}
const w27animSwayPeak = w27swayObj ? w27swayObj.rotation[w27ad.axis] : NaN;
const w27animBreathPeak = w27breathObj ? w27breathObj.scale.x : NaN;
if (w27swayObj) animateOrganic(w27animParts, w27animTroughT, false);
const w27animSwayTrough = w27swayObj ? w27swayObj.rotation[w27ad.axis] : NaN;
if (w27swayObj) animateOrganic(w27animParts, w27animPeakT + 13.73, true); // reducedMotion: complete no-op
const w27animSwayFrozen = w27swayObj ? w27swayObj.rotation[w27ad.axis] : NaN;
for (const [o, axis, v] of w27snapSway) o.rotation[axis] = v;
for (const [o, v] of w27snapBreath) o.scale.setScalar(v);
for (const [m, prop, v] of w27snapPulse) m[prop] = v;
const w27animChecks = {
  stationFound: !!w27animStation,
  swayAndBreathTagged: w27animParts.sway.length > 0 && !!w27ad && w27ad.amp !== 0
    && !!w27adBreath,
  swayFormulaExact: !!w27ad
    && w27animSwayPeak === w27ad.base + Math.sin(TAU27 * w27ad.hz * w27animPeakT + w27ad.phase) * w27ad.amp
    && w27animSwayTrough === w27ad.base + Math.sin(TAU27 * w27ad.hz * w27animTroughT + w27ad.phase) * w27ad.amp
    && Math.abs(w27animSwayPeak - (w27ad.base + w27ad.amp)) < 1e-9
    && Math.abs(w27animSwayTrough - (w27ad.base - w27ad.amp)) < 1e-9
    && w27animSwayPeak !== w27animSwayTrough,
  breathFormulaExact: !!w27adBreath
    && w27animBreathPeak === w27adBreath.baseScale * (1 + w27adBreath.depth * Math.sin(TAU27 * w27adBreath.hz * w27animPeakT + w27adBreath.phase)),
  frozenUnderReducedMotion: !!w27ad && w27animSwayFrozen === w27animSwayTrough,
  restoredAfterDrive: !!w27ad && w27swayObj.rotation[w27ad.axis] === w27snapSway.find((s) => s[0] === w27swayObj)[2],
};
console.log('wave27 station animation:', JSON.stringify(w27animChecks));
if (!Object.values(w27animChecks).every(Boolean)) { console.log('WAVE27 STATION ANIMATION FAIL'); errors++; }

// -- f. save/rebuild roundtrip --------------------------------------------------
// Part 1, the wave-23 e / wave-26 g pattern where the run is docked: park
// hostiles (bt_cradle flies pirates) so the dock autosave can't be combat-
// blocked, poll the store for the bt_cradle save (the wave-21 discipline —
// the jump-arrival autosave already wrote one, so the guard is the dock's
// world.time), then die and recover via Enter. A SAME-system restore emits
// no 'systemLoaded' (save.js restore), so the grown scene must survive
// untouched — same station object, same overgrowth count, same glaze root.
for (const s of ctx.ships) {
  const hostile = s.role === 'pirate' || s.role === 'ace' ||
    s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
  if (hostile && s.object) s.object.position.set(9000, 9000, 9000);
}
tick(5, 'hostiles parked (wave27 save)');
const w27timeBeforeDock = ctx.world.time;
dockAtCurrentStation('dock cradle (wave27 save)'); // 'docked' fires trySave
let w27snap = null;
for (let i = 0; i < 60 * 15 && !w27snap; i++) {
  tick(1, 'wave27 save wait');
  const snap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
  if (snap?.world?.currentSystem === 'bt_cradle' && snap.world.time >= w27timeBeforeDock) w27snap = snap;
}
const w27stationPreDeath = findByName('beautiful-station')[0] ?? null;
const w27overPreDeath = findByName('beautiful-overgrowth').length;
const w27lmPreDeath = w27organicPoi(w27lm.id);
ctx.emit('playerDestroyed', {});
tick(2, 'death consumed (wave27 restore)');
dispatchKey('Enter'); // recover(): restore(last save) — SAME system (bt_cradle → bt_cradle)
tick(3, 'wave27 post-restore settle');
const w27restoreChecks = {
  saveWritten: !!w27snap?.world,
  restoredAtCradle: ctx.world.currentSystem === 'bt_cradle',
  stillDocked: ctx.flags.docked === true,
  stationPresent: findByName('beautiful-station').length === 1,
  stationSameObject: findByName('beautiful-station')[0] === w27stationPreDeath,
  overgrowthStable: w27overPreDeath === SYSTEMS.bt_cradle.gates.length
    && findByName('beautiful-overgrowth').length === w27overPreDeath,
  glazeRootSurvives: !!w27lmPreDeath && w27organicPoi(w27lm.id) === w27lmPreDeath,
};
console.log('wave27 death-restore:', JSON.stringify(w27restoreChecks));
if (!Object.values(w27restoreChecks).every(Boolean)) { console.log('WAVE27 DEATH-RESTORE FAIL'); errors++; }

// Part 2, the rebuild proof: a same-system 'systemLoaded' re-emit (the
// wave-14 c pattern) rebuilds gates and landmarks in place; station.js's
// rebuild guard (ev.to !== currentId) leaves the station object untouched.
const w27stationPreReemit = findByName('beautiful-station')[0] ?? null;
const w27gatesPreReemit = findByName('lamplighter-gate');
const w27lmPreReemit = w27organicPoi(w27lm.id);
ctx.emit('systemLoaded', { to: ctx.world.currentSystem }); // bt_cradle — the same system
tick(3, 'wave27 same-system re-emit');
const w27gatesPostReemit = findByName('lamplighter-gate');
let w27reemitGateShape = w27gatesPostReemit.length === SYSTEMS.bt_cradle.gates.length;
for (const g of w27gatesPostReemit) {
  if (w27overIn(g) !== 1) w27reemitGateShape = false;
  let buds = 0;
  g.traverse((o) => { if (o.name === 'beautiful-bud') buds++; });
  if (buds !== 4) w27reemitGateShape = false;
}
const w27lmPostReemit = w27organicPoi(w27lm.id);
const w27reemitChecks = {
  stationGuarded: findByName('beautiful-station').length === 1
    && findByName('beautiful-station')[0] === w27stationPreReemit,
  gatesRebuilt: w27gatesPostReemit.length === w27gatesPreReemit.length
    && w27gatesPreReemit.length > 0
    && w27gatesPostReemit.every((g) => !w27gatesPreReemit.includes(g)),
  overgrownShapeStable: w27reemitGateShape,
  glazeRootRebuilt: !!w27lmPostReemit && w27lmPostReemit !== w27lmPreReemit
    && w27lmPostReemit.userData.poiId === w27lm.id
    && w27lmPostReemit.userData.poiType === 'landmark'
    && w27lmPostReemit.userData.kind === w27lm.kind,
};
console.log('wave27 rebuild re-emit:', JSON.stringify(w27reemitChecks));
if (!Object.values(w27reemitChecks).every(Boolean)) { console.log('WAVE27 REBUILD RE-EMIT FAIL'); errors++; }

// -- g. home — the final tally carries no location assumption, but the run ----
// ends where the harness began: freehold, undocked. -----------------------------
undockStation(); // leave The Cradle (wave-27 restore dock)
travelTo('freehold', 'wave27 home leg');

// ---- Wave 28: Berth Records — the save/load panel, SPACE ONLY ------------
// KeyL toggles, Escape closes, three manual slots beside the autosave, a
// real save → drift → load roundtrip through the stub DOM, and the docked
// refusal. The run is freehold/undocked off the wave-27 home leg; hostiles
// parked first (the wave-27 save pattern) so the encounter-bubble combat
// block can never refuse a drive.
// The encounter-bubble save gate is LIVE in this run — npc.js sets
// flags.combat from ai.intent && distance < ENCOUNTER_BUBBLE (800u), and
// lawful patrols turn intent-hostile after the run's earlier piracy.
// Parking hostiles fights a despawn/re-instantiate treadmill (records
// re-spawn at 900u, just outside the bubble, and close in), so calm
// deterministically instead: teleport the PLAYER beyond every record's
// instantiate range, tick until traffic despawns the live ships and
// npc.js clears the flag, then click synchronously — no tick between the
// clear and the click, so the state cannot change in between. The berth-1
// envelope legitimately holds the far position; the restore check below
// compares against the envelope, never a hardcoded point.
const w28calm = (label) => {
  ctx.ship.object.position.set(0, 30000, 0);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.input.throttle = 0; // the setpoint persists from earlier flight legs —
  ctx.input.fullStop = true; // without full-stop the hull drifts mid-tick and
  // the saved/restored position can never match at 1e-6
  for (let i = 0; i < 240 && ctx.flags.combat; i++) tick(1, label);
  return !ctx.flags.combat;
};
if (ctx.flags.docked) undockStation(); // precondition: in space, never docked

// Panel root discovery rides BOTH stub-DOM anchor paths: an implementation
// that appends an id-tagged root under document.body (the settings.js
// pattern) and one that roots at document.getElementById (the hud.js
// pattern — the stub memoizes by id, NOT under document.body). The lazy
// getElementById fallback yields a display-less stub when the feature is
// absent, so every check below fails honestly.
const w28Panel = () => {
  for (const n of walkDom(document.body)) {
    if (n.id === 'rw-berth-records' || n.getAttribute?.('id') === 'rw-berth-records') return n;
  }
  return document.getElementById('rw-berth-records');
};
const w28classHas = (n, cls) => typeof n.className === 'string' && n.className.split(' ').includes(cls);
const w28rows = () => [...walkDom(w28Panel())].filter((n) => w28classHas(n, 'rw-berth-row'));
const w28row = (slot) => w28rows().find((n) => n.dataset?.slot === slot) ?? null;
const w28btn = (row, cls) => (row
  ? ([...walkDom(row)].find((n) => n.tagName === 'BUTTON' && w28classHas(n, cls)) ?? null)
  : null);
const w28metaText = (row) => (row
  ? ([...walkDom(row)].find((n) => w28classHas(n, 'rw-berth-meta'))?.textContent ?? null)
  : null);

// -- a/b. KeyL opens in space: display flex, exactly four rows in ----------
// auto/1/2/3 order (walkDom yields document order). -------------------------
dispatchKey('KeyL');
const w28openedInSpace = w28Panel().style.display === 'flex';
const w28slotOrder = w28rows().map((n) => n.dataset?.slot);

// -- c. manual save into berth 1 — the real click path writes the slot key --
const w28calmBeforeSave = w28calm('wave28 calm pre-save');
w28btn(w28row('1'), 'rw-berth-save')?.click();
const w28sealedToast = ctx.events.some((e) => e.type === 'commLine' && e.text === 'Berth record sealed — slot 1.'); // emit is synchronous
const w28snap1 = (() => { try { return JSON.parse(store.get('rimward-save-v1-slot-1') ?? 'null'); } catch { return null; } })();
const w28savedCredits = w28snap1?.world?.credits;
const w28savedPos = w28snap1?.ship?.position ?? null;

// -- d. calm first, THEN drift the live state (sentinel credits, known ----
// position offset) and click LOAD with NO intervening tick — the calm
// teleport must never land the hull back on the saved coordinate after the
// drift, or positionRestored passes vacuously (review P2). The drift is
// synchronous with the click, so the sim cannot move the hull in between. -
const w28calmBeforeLoad = w28calm('wave28 calm pre-load');
ctx.world.credits = (w28savedCredits ?? 0) + 777;
ctx.ship.object.position.x += 111.25;
ctx.ship.object.position.y -= 42.5;
ctx.ship.object.position.z += 77.75;
w28btn(w28row('1'), 'rw-berth-load')?.click(); // re-queried — renders may rebuild rows
const w28restoredToast = ctx.events.some((e) => e.type === 'commLine' && e.text === 'Berth record restored.');
tick(2, 'wave28 post-load settle');
const w28panelClosedAfterLoad = w28Panel().style.display === 'none';
// By value, not the live Vector3 — the dock/undock legs below teleport the
// hull and would mutate a referenced vector before w28Checks evaluates.
const w28shipPosArr = [ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z];

// -- d2. paused-load guard: the panel survives pause-after-open (updates ---
// freeze, so the auto-close can't run) but LOAD must refuse while the
// system loop is frozen — a cross-system restore's 'systemLoaded' would
// rotate out of the event queue unseen (review P2 fix). Credits are
// re-sentinelled first so a wrongful restore is observable. --------------
dispatchKey('KeyL'); // reopen — the load auto-closed the panel
// main.js owns the KeyP listener and the harness runs its own loop, so the
// paused state is poked directly (the bootFreshHarness convention).
ctx.flags.paused = true; // pause with the panel open
ctx.world.credits = (w28savedCredits ?? 0) + 555;
w28btn(w28row('1'), 'rw-berth-load')?.click();
const w28pausedLoadRefused = ctx.world.credits === (w28savedCredits ?? 0) + 555
  && !ctx.events.some((e) => e.type === 'commLine' && e.text === 'Berth record restored.');
ctx.flags.paused = false; // unpause
ctx.world.credits = w28savedCredits; // hand the restored state back — the
// d2 sentinel must not leak into creditsRestored at w28Checks time
dispatchKey('Escape'); // close for the next leg

// -- e. the autosave berth reads occupied ------------------------------------
// 'rimward-save-v1' has been written by dozens of earlier dock/jump
// autosaves; if a future reorder ever reaches here without one, force a dock
// autosave the wave-27 way (dock fires trySave, poll the store, undock).
if (!store.has('rimward-save-v1')) {
  dockAtCurrentStation('wave28 autosave force');
  for (let i = 0; i < 60 * 15 && !store.has('rimward-save-v1'); i++) tick(1, 'wave28 autosave wait');
  undockStation();
}
dispatchKey('KeyL'); // reopen — the load auto-closed the panel
const w28autoMeta = w28metaText(w28row('auto'));
const w28slot1Meta = w28metaText(w28row('1'));
const w28emptyMeta23 = [w28metaText(w28row('2')), w28metaText(w28row('3'))];
dispatchKey('KeyL'); // toggle shut before docking
const w28toggleClosed = w28Panel().style.display === 'none';

// -- f. the space-only rule: docked, KeyL is refused; the dock autosave -----
// key exists (written long before this wave — asserted, not forced). --------
dockAtCurrentStation('wave28 space-only dock'); // real dock path (dock zone + dockPressed edge)
dispatchKey('KeyL'); // docked: the panel must refuse to open
const w28dockedRefused = ctx.flags.docked === true && w28Panel().style.display === 'none';
const w28autosavePresent = store.has('rimward-save-v1');

// -- g. back in space: KeyL reopens, Escape closes ---------------------------
undockStation();
dispatchKey('KeyL');
const w28reopened = w28Panel().style.display === 'flex';
// -- h. row anatomy on this open panel: the autosave row carries NO save ----
// button; every manual row's LOAD is a real <button> — enabled on the berth
// (c) occupied, disabled on the two never-written berths. -------------------
const w28autoSaveBtn = w28btn(w28row('auto'), 'rw-berth-save');
const w28loadBtns = ['1', '2', '3'].map((s) => w28btn(w28row(s), 'rw-berth-load'));
dispatchKey('Escape');
const w28escapeClosed = w28Panel().style.display === 'none';

const w28Checks = {
  openedInSpace: w28openedInSpace,
  fourRowsInOrder: w28slotOrder.length === 4 && w28slotOrder.join(',') === 'auto,1,2,3',
  calmBeforeSave: w28calmBeforeSave,
  calmBeforeLoad: w28calmBeforeLoad,
  manualSaveWritten: store.has('rimward-save-v1-slot-1'),
  envelopeShape: w28snap1?.v === 1 && !!w28snap1?.world && typeof w28snap1.world === 'object',
  envelopeCaptured: Number.isFinite(w28savedCredits) && Array.isArray(w28savedPos) && w28savedPos.length === 3,
  sealedToast: w28sealedToast,
  creditsRestored: ctx.world.credits === w28savedCredits,
  positionRestored: Array.isArray(w28savedPos)
    && Math.abs(w28shipPosArr[0] - w28savedPos[0]) < 1e-6
    && Math.abs(w28shipPosArr[1] - w28savedPos[1]) < 1e-6
    && Math.abs(w28shipPosArr[2] - w28savedPos[2]) < 1e-6,
  loadClosesPanel: w28panelClosedAfterLoad,
  restoredToast: w28restoredToast,
  pausedLoadRefused: w28pausedLoadRefused,
  autosaveBerthOccupied: typeof w28autoMeta === 'string' && w28autoMeta !== '— empty berth —'
    && w28autoMeta.includes('·') && w28autoMeta.includes('UU'),
  slot1BerthOccupied: typeof w28slot1Meta === 'string' && w28slot1Meta !== '— empty berth —'
    && w28slot1Meta.includes('·') && w28slot1Meta.includes('UU'),
  emptyBerthsReadEmpty: w28emptyMeta23.every((t) => t === '— empty berth —'),
  toggleCloses: w28toggleClosed,
  dockedRefusesOpen: w28dockedRefused,
  dockAutosavePresent: w28autosavePresent,
  reopenedAfterUndock: w28reopened,
  autoRowHasNoSave: w28autoSaveBtn === null,
  loadButtonsAreReal: w28loadBtns.every((b) => b && b.tagName === 'BUTTON'),
  occupiedLoadEnabled: w28loadBtns[0]?.disabled === false,
  emptyLoadsDisabled: w28loadBtns[1]?.disabled === true && w28loadBtns[2]?.disabled === true,
  escapeCloses: w28escapeClosed,
};
console.log('wave28 berth records:', JSON.stringify(w28Checks));
if (!Object.values(w28Checks).every(Boolean)) { console.log('WAVE28 BERTH RECORDS FAIL'); errors++; }

// ---- Wave 30: Pirate demand-hail (Q-ship bluff) + flee wake-trailing ------
// Two features, one section: (a) the concealed-mounts purchase — outfitting
// row 3 through the real hotkey path, save/restore persistence, the
// corrupt-restore heal — and (b) the demand hail a hunting pirate opens
// before pressing the attack (payTribute / showTeeth — only with mounts — /
// refuseFight), plus the wake contract: every pirate flee stamps
// record.wakeSite 1400u ahead (npc.js) while wakes.js sheds a pooled
// world-space trail and discovers a stamped site within 120u.
// Live pirates are synthetic spawnLiveShip records pushed into ctx.ships by
// hand (traffic owns that list in production — the wave-27 spawn pattern
// extended to a real AI drive); each is spliced + mesh-removed after its
// beat so the next beat starts clean. The player hull is pinned huge (the
// wave-9 pattern) so attack waits measure the pirate, never the player.
const w30collect = (n, label) => {
  const evs = [];
  for (let i = 0; i < n; i++) { tick(1, label); evs.push(...ctx.lastEvents); }
  return evs;
};
const w30isHostile = (s) => s.role === 'pirate' || s.role === 'ace'
  || s.record?.role === 'pirate' || s.record?.role === 'ace' || s.ai?.hostile === true;
const w30parkHostiles = (label) => {
  for (const s of ctx.ships) if (w30isHostile(s) && s.object) s.object.position.set(9000, 9000, 9000);
  tick(5, label);
};
const w30spawnPirate = (suffix, personality, offset) => {
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
const w30removeShip = (live) => {
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  removeLiveShip(ctx, live);
};
// Tick (max 10) until this ship's demand hail lands in the event stream.
const w30demandEvs = (live, label) => {
  const evs = [];
  for (let i = 0; i < 10; i++) {
    tick(1, label);
    evs.push(...ctx.lastEvents);
    if (evs.some((e) => e.type === 'hailOpened' && e.ship === live)) break;
  }
  return evs;
};
// Hail-card buttons are the only '[n] …' labels in the stub DOM.
const w30hailBtn = (frag) => {
  for (const n of walkDom(document.body)) {
    if (n.tagName === 'BUTTON' && typeof n.textContent === 'string' && n.textContent.startsWith(frag)) return n;
  }
  return null;
};
// The hail root is an unclassed fixed div (hail.js builds it without id);
// reach it through a card button's parent chain. Buttons persist after
// closeCard (they are rebuilt per hail), so visibility — not presence — is
// the open signal. 'none' before any card has ever opened.
const w30hailDisplay = () => {
  const btn = w30hailBtn('[1]');
  if (!btn) return 'none';
  let r = btn;
  while (r.parent && r.parent !== document.body) r = r.parent;
  return r.style?.display ?? null;
};
const w30siteShape = (live) => {
  const ws = live.record?.wakeSite;
  return Array.isArray(ws?.position) && ws.position.length === 3
    && ws.position.every((v) => Number.isFinite(v)) && ws.found === false;
};
const w30siteDist = (live) => {
  const ws = live.record?.wakeSite;
  if (!ws) return NaN;
  const p = live.object.position;
  return Math.hypot(ws.position[0] - p.x, ws.position[1] - p.y, ws.position[2] - p.z);
};

// -- a. demand hail WITHOUT mounts: the card offers pay-or-fight, holds -----
// weapons-cold while open, fires once per record, and refuseFight presses --
// the attack through the real card button. The run is freehold/undocked off
// the wave-28 end state; concealedMounts has never been bought. -------------
if (ctx.flags.docked) undockStation();
w28calm('wave30 calm (demand setup)'); // the wave-28 teleport-and-clear
ctx.player.hullMax = 1e9; ctx.player.hull = 1e9;
ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
ctx.input.weaponGroup = 1; // cannon — the firing legs below pin the group
ctx.world.credits = 4000;
ctx.cargo.length = 0;
ctx.cargo.push({ commodity: 'provisions', units: 10 }); // cargo aboard: the demand rides its value
const w30demandExpected = Math.max(
  HIDDEN_MOUNTS.demandMin,
  Math.round(ECON.tributeRate * cargoValue(ctx.cargo, ctx.world.prices) * 10),
);
// The wave-28 berth restore rewound world.time into a snapshot taken inside
// the 5 s jump grace, so the demand guard (now >= jumpGraceUntil) can still
// be shut here — wait it out through real ticks rather than poking the flag.
for (let i = 0; i < 300 && ctx.world.time < (ctx.world.jumpGraceUntil ?? 0); i++) tick(1, 'wave30 jump grace wait');
const w30graceExpired = ctx.world.time >= (ctx.world.jumpGraceUntil ?? 0);
const p1refuse = w30spawnPirate('refuse', 95, [250, 0, 0]); // 250u: inside TARGET_RANGE, outside the bubble edge
const p1openEvs = w30demandEvs(p1refuse, 'wave30 p1 demand');
const p1hail = p1openEvs.find((e) => e.type === 'hailOpened' && e.ship === p1refuse) ?? null;
const p1holdEvs = w30collect(60, 'wave30 p1 hold'); // 1 s with the card open
const p1demandingAfterHold = p1refuse.ai.demanding === true;
const p1cardOpenDuringHold = w30hailDisplay() === 'block';
const p1refuseBtn = w30hailBtn('[2] Refuse — and fight');
p1refuseBtn?.click(); // real card path: refuseFight
const p1closeEvs = w30collect(2, 'wave30 p1 close');
const p1fireEvs = [];
for (let i = 0; i < 600 && !p1fireEvs.some((e) => e.type === 'npcFire' && e.ship === p1refuse); i++) {
  tick(1, 'wave30 p1 attack'); // 3 s telegraph re-arms after the frozen hold, then it fires
  p1fireEvs.push(...ctx.lastEvents);
}
const p1intentAfterRefuse = p1refuse.ai.intent === true;
const w30demandChecks = {
  graceExpired: w30graceExpired,
  hailOpened: !!p1hail,
  demandLine: p1hail?.line === 'Your cargo or your hull.',
  intentsWithoutMounts: JSON.stringify(p1hail?.intents) === JSON.stringify(['payTribute', 'refuseFight']),
  demandRolledOnce: p1hail?.demand === w30demandExpected && w30demandExpected > HIDDEN_MOUNTS.demandMin,
  demandFlagAndRecord: p1refuse.ai.demandSent === true && Number.isFinite(p1refuse.record.demandedAt),
  weaponsColdWhileDemanding: !p1holdEvs.some((e) => e.type === 'npcFire' && e.ship === p1refuse),
  stillDemandingAfterHold: p1demandingAfterHold,
  cardOpenDuringHold: p1cardOpenDuringHold,
  oneDemandPerRecord: [...p1openEvs, ...p1holdEvs].filter((e) => e.type === 'hailOpened' && e.ship === p1refuse).length === 1,
  refuseButtonFound: !!p1refuseBtn,
  refusedOutcome: p1refuse.ai.demandOutcome === 'refused' && p1refuse.ai.demanding === false,
  cardClosedAfterRefuse: w30hailDisplay() === 'none' && p1closeEvs.some((e) => e.type === 'hailClosed'),
  pirateAttacks: p1intentAfterRefuse && p1fireEvs.some((e) => e.type === 'npcFire' && e.ship === p1refuse),
};
console.log('wave30 demand hail:', JSON.stringify(w30demandChecks), `demand=${w30demandExpected}`);
if (!Object.values(w30demandChecks).every(Boolean)) { console.log('WAVE30 DEMAND HAIL FAIL'); errors++; }
w30removeShip(p1refuse);
tick(5, 'wave30 p1 cleanup');

// -- b. concealed mounts: the real outfitting hotkey path (Digit6 service, --
// Digit3 row), the second-buy refusal, the save/restore roundtrip, the ------
// corrupt-restore heal, and a real re-buy so the legs below carry the bluff.
w30parkHostiles('wave30 hostiles parked (outfitting)');
dockAtCurrentStation('wave30 dock freehold (outfitting)');
ctx.world.credits = 5000;
dispatchKey('Digit6'); // outfitting (DOCK_KEY_SERVICES[5])
const w30outfitOpen = [...walkDom(stationOverlay() ?? { children: [] })]
  .some((n) => n.textContent === 'OUTFITTING — hull work & instruments');
const w30mountsBtn = [...walkDom(stationOverlay() ?? { children: [] })]
  .find((n) => n.tagName === 'BUTTON' && typeof n.textContent === 'string' && n.textContent.startsWith('3 — Concealed mounts')) ?? null;
const w30creditsAtBuy = ctx.world.credits;
dispatchKey('Digit3'); // outfitting n===3 → act.buyConcealedMounts
const w30bought = ctx.world.concealedMounts === true && ctx.world.credits === w30creditsAtBuy - HIDDEN_MOUNTS.cost;
const w30fittedNote = [...walkDom(stationOverlay() ?? { children: [] })]
  .some((n) => typeof n.textContent === 'string' && n.textContent.startsWith('Concealed mounts fitted'));
dispatchKey('Digit3'); // second buy: refused through the same hotkey path
const w30secondRefused = w26StationNotice() === 'Concealed mounts already fitted.'
  && ctx.world.credits === w30creditsAtBuy - HIDDEN_MOUNTS.cost && ctx.world.concealedMounts === true;
dispatchKey('Escape'); // back to services
// Save roundtrip (the wave-26 pattern): park, cycle the dock, then POLL the
// store for a snapshot carrying the flag (the wave-27 save-wait discipline —
// a combat-blocked autosave lands within a couple of BLOCK_RETRY cycles).
w30parkHostiles('wave30 hostiles parked (mounts save)');
undockStation();
dockAtCurrentStation('wave30 dock freehold (mounts save)'); // 'docked' fires trySave
let w30snap = null;
for (let i = 0; i < 60 * 15 && !w30snap; i++) {
  for (const s of ctx.ships) if (w30isHostile(s) && s.object) s.object.position.set(9000, 9000, 9000);
  tick(1, 'wave30 mounts save wait');
  try {
    const s = JSON.parse(store.get('rimward-save-v1') ?? 'null');
    if (s?.world?.concealedMounts === true) w30snap = s;
  } catch { /* keep waiting */ }
}
// Die + recover (the wave-26 restore path): the in-memory corruption loses.
ctx.world.concealedMounts = false; // corrupt in memory; the restore must win
ctx.emit('playerDestroyed', {});
tick(2, 'wave30 death consumed (mounts restore)');
dispatchKey('Enter'); // recover(): restore(last save)
tick(2, 'wave30 mounts restore settle');
const w30restoredTrue = ctx.world.concealedMounts === true;
// Corrupt the STORED value: anything but literal true heals to false
// (save.js sanitizeRestored).
const w30corruptSnap = (() => { try { return JSON.parse(store.get('rimward-save-v1') ?? 'null'); } catch { return null; } })();
if (w30corruptSnap?.world) { w30corruptSnap.world.concealedMounts = 'yes'; store.set('rimward-save-v1', JSON.stringify(w30corruptSnap)); }
ctx.emit('playerDestroyed', {});
tick(2, 'wave30 death consumed (corrupt restore)');
dispatchKey('Enter');
tick(2, 'wave30 corrupt restore settle');
const w30healedFalse = ctx.world.concealedMounts === false;
// Re-buy through the real path (fresh dock → services root) — the demand
// legs below need the bluff fitted, and this proves purchase after a heal.
undockStation();
w30parkHostiles('wave30 hostiles parked (mounts rebuy)');
dockAtCurrentStation('wave30 dock freehold (mounts rebuy)');
const w30creditsAtRebuy = ctx.world.credits;
dispatchKey('Digit6');
dispatchKey('Digit3');
const w30rebought = ctx.world.concealedMounts === true && ctx.world.credits === w30creditsAtRebuy - HIDDEN_MOUNTS.cost;
dispatchKey('Escape'); // back to services
const w30outfitChecks = {
  outfittingOpened: w30outfitOpen,
  mountsButtonFound: !!w30mountsBtn,
  boughtExact: w30bought && HIDDEN_MOUNTS.cost === 900,
  fittedNoteShown: w30fittedNote,
  secondBuyRefused: w30secondRefused,
  saveCarriesTrue: w30snap?.world?.concealedMounts === true,
  restoreKeepsTrue: w30restoredTrue,
  corruptRestoreHeals: w30healedFalse,
  reboughtAfterHeal: w30rebought,
};
console.log('wave30 concealed mounts:', JSON.stringify(w30outfitChecks), `credits=${ctx.world.credits}`);
if (!Object.values(w30outfitChecks).every(Boolean)) { console.log('WAVE30 CONCEALED MOUNTS FAIL'); errors++; }

// -- c. payTribute: the real card path pays the exact demand, the pirate ----
// flees calm-stamped (+60 s), and the flee stamps a wake site 1400u ahead.
undockStation();
w28calm('wave30 calm (payTribute)');
ctx.world.credits = 4000;
const p2pay = w30spawnPirate('pay', 95, [250, 0, 0]);
const p2openEvs = w30demandEvs(p2pay, 'wave30 p2 demand');
const p2hail = p2openEvs.find((e) => e.type === 'hailOpened' && e.ship === p2pay) ?? null;
const p2payBtn = w30hailBtn('[1] Pay tribute');
const p2payLabel = p2payBtn?.textContent ?? null;
p2payBtn?.click(); // synchronous resolveIntent — read the stamps before any tick
const p2creditsAfter = ctx.world.credits;
const p2modeAfter = p2pay.ai.mode;
const p2outcomeAfter = p2pay.ai.demandOutcome;
const p2calmDelta = p2pay.ai.calmUntil - ctx.world.time;
const p2shape = w30siteShape(p2pay);
const p2dist = w30siteDist(p2pay);
const p2settleEvs = w30collect(3, 'wave30 p2 settle'); // npc.js releases the hold on hailClosed
const w30payChecks = {
  hailOpened: !!p2hail,
  intentsWithMounts: JSON.stringify(p2hail?.intents) === JSON.stringify(['payTribute', 'showTeeth', 'refuseFight']),
  payButtonLabeled: p2payLabel === `[1] Pay tribute — ${w30demandExpected} UU`,
  creditsPaidExact: p2creditsAfter === 4000 - w30demandExpected,
  pirateFleesPaid: p2modeAfter === 'flee' && p2outcomeAfter === 'paid',
  calmStamped60: p2calmDelta === 60,
  wakeSiteShape: p2shape,
  wakeSite1400: Math.abs(p2dist - 1400) < 0.5,
  holdReleased: p2pay.ai.demanding === false,
  paidLine: p2settleEvs.some((e) => e.type === 'commLine' && e.text === 'Smart. Run along.'),
};
console.log('wave30 payTribute:', JSON.stringify(w30payChecks), `siteDist=${p2dist?.toFixed?.(2)}`);
if (!Object.values(w30payChecks).every(Boolean)) { console.log('WAVE30 PAYTRIBUTE FAIL'); errors++; }

// -- d. wake trail visual sanity: with p2pay live and fleeing, the pooled ---
// Points ring (600-slot buffer, the wave-27 scene-traversal discipline) ------
// receives points and shows; reducedMotion mutes emission and hides it. -----
const w30wakePoints = () => {
  let pts = null;
  ctx.scene.traverse((o) => { if (o.isPoints && o.geometry?.attributes?.position?.count === 600) pts = o; });
  return pts;
};
const w30wakeLive = () => {
  const col = w30wakePoints()?.geometry?.attributes?.color?.array;
  if (!col) return 0;
  let n = 0;
  for (let i = 0; i < col.length; i += 3) if (col[i] > 0 || col[i + 1] > 0 || col[i + 2] > 0) n++;
  return n;
};
w30collect(30, 'wave30 wake emission'); // 10 Hz × 0.5 s ≈ 5 points
const w30emitCount = w30wakeLive();
const w30wakeVisible = w30wakePoints()?.visible === true;
ctx.settings.reducedMotion = true; // settings flag, read live (the flags.paused poke convention)
const w30mutedBefore = w30wakeLive();
w30collect(60, 'wave30 reducedMotion mute'); // 45 s life: nothing expires inside 1 s
const w30mutedAfter = w30wakeLive();
const w30mutedHidden = w30wakePoints()?.visible === false;
ctx.settings.reducedMotion = false;
w30removeShip(p2pay);
tick(5, 'wave30 p2 cleanup');
const w30trailChecks = {
  pointsObjectFound: !!w30wakePoints(),
  emittedWhileFleeing: w30emitCount > 0,
  visibleWhileLive: w30wakeVisible,
  noEmissionWhenMuted: w30mutedAfter === w30mutedBefore,
  hiddenWhenMuted: w30mutedHidden,
};
console.log('wave30 wake trail:', JSON.stringify(w30trailChecks), `emitted=${w30emitCount}`);
if (!Object.values(w30trailChecks).every(Boolean)) { console.log('WAVE30 WAKE TRAIL FAIL'); errors++; }

// -- e/f. showTeeth: fear pinned to 5 (bluffP = 0.40) so the forced roll ----
// decides deterministically — Math.random stubbed for the CLICK ONLY, the ---
// wave-9 pin discipline. Success: flee + fear +1 + 90 s calm + wake site. ---
// Failure: resolve +20 (the p4 hull reads the bump pre-cap) and the pirate --
// presses the attack. --------------------------------------------------------
const w30fearRestore = ctx.world.fear;
ctx.world.fear = 5; // TEST SETUP: bluffP = 0.35 + 5×0.01 = 0.40 (restored below)
const p3bluff = w30spawnPirate('bluff', 95, [250, 0, 0]);
w30demandEvs(p3bluff, 'wave30 p3 demand');
const p3teethBtn = w30hailBtn('[2] Show teeth');
const origRandom30s = Math.random;
Math.random = () => 0; // < 0.40: the bluff lands
try { p3teethBtn?.click(); } finally { Math.random = origRandom30s; }
const p3modeAfter = p3bluff.ai.mode;
const p3outcomeAfter = p3bluff.ai.demandOutcome;
const p3calmDelta = p3bluff.ai.calmUntil - ctx.world.time;
const p3fearAfter = ctx.world.fear;
const p3shape = w30siteShape(p3bluff);
const p3dist = w30siteDist(p3bluff);
const p3settleEvs = w30collect(3, 'wave30 p3 settle');
const p3released = p3bluff.ai.demanding === false;
w30removeShip(p3bluff);
tick(5, 'wave30 p3 cleanup');
const p4called = w30spawnPirate('called', 95, [250, 0, 0]);
w30demandEvs(p4called, 'wave30 p4 demand');
const p4teethBtn = w30hailBtn('[2] Show teeth');
p4called.state.resolve = 55; // TEST SETUP: read the +20 bump clear of the 95 cap (updateResolve recomputes later from personality 95 — the attack stays hot)
const origRandom30f = Math.random;
Math.random = () => 0.999; // ≥ 0.40: the bluff is called
try { p4teethBtn?.click(); } finally { Math.random = origRandom30f; }
const p4resolveAfter = p4called.state.resolve;
const p4outcomeAfter = p4called.ai.demandOutcome;
const p4demandingAfter = p4called.ai.demanding;
const p4noSite = p4called.record.wakeSite === undefined; // no flee, no stamp
const p4closeEvs = w30collect(2, 'wave30 p4 close');
const p4fireEvs = [];
for (let i = 0; i < 600 && !p4fireEvs.some((e) => e.type === 'npcFire' && e.ship === p4called); i++) {
  tick(1, 'wave30 p4 attack');
  p4fireEvs.push(...ctx.lastEvents);
}
ctx.world.fear = w30fearRestore; // unpin (the +1 bluff bump goes with it — test setup)
w30removeShip(p4called);
tick(5, 'wave30 p4 cleanup');
const w30teethChecks = {
  successButtonFound: !!p3teethBtn,
  successFlees: p3modeAfter === 'flee' && p3outcomeAfter === 'bluffed',
  successFearBump: p3fearAfter === 6,
  successCalm90: p3calmDelta === HIDDEN_MOUNTS.calmSeconds,
  successWakeSite: p3shape && Math.abs(p3dist - 1400) < 0.5,
  successLine: p3settleEvs.some((e) => e.type === 'commLine' && e.text === 'Guns where none should be. Breaking off.'),
  successHoldReleased: p3released,
  failureButtonFound: !!p4teethBtn,
  failureResolveBump: p4resolveAfter === Math.min(95, 55 + HIDDEN_MOUNTS.failResolveBump),
  failureOutcome: p4outcomeAfter === 'failed' && p4demandingAfter === false,
  failureNoWakeSite: p4noSite,
  failureLine: p4closeEvs.some((e) => e.type === 'commLine' && e.text === 'Nice plating. Burn them.'),
  failurePressesAttack: p4called.ai.intent === true && p4fireEvs.some((e) => e.type === 'npcFire' && e.ship === p4called),
};
console.log('wave30 showTeeth:', JSON.stringify(w30teethChecks), `resolve=55→${p4resolveAfter}`);
if (!Object.values(w30teethChecks).every(Boolean)) { console.log('WAVE30 SHOWTEETH FAIL'); errors++; }

// -- g. void-on-hit: a player bolt landing after the demand opened ends the --
// parley — demanding clears, the card closes (hailClosed), the fight is on. -
const p5void = w30spawnPirate('void', 95, [250, 0, 0]);
w30demandEvs(p5void, 'wave30 p5 demand');
const p5demandOpen = p5void.ai.demanding === true && w30hailDisplay() === 'block';
// Aim the nose (identity quaternion = -Z forward) and park the pirate dead
// ahead inside cannon range; the demand hold keeps it on the bolt line.
ctx.ship.object.quaternion.identity();
ctx.ship.velocity.set(0, 0, 0);
p5void.object.position.set(ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z - 200);
p5void.object.quaternion.identity();
const p5peaceAt = p5void.ai.demandPeaceAt;
const p5fireEvs = [];
// The outfitting Digit3 presses above double as weapon-group picks
// (controls.js digits 1-3 switch groups), so re-pin cannon here, and lock the
// pirate: firePlayerGun's §6.2 frontal-cone convergence then aims the bolts
// onto its drift. Real fire path: controls.js recomputes input.fireHeld from
// its own mouse state every frame (a direct poke is stomped), so hold button
// 0 through the same window-listener drive dispatchKey uses for keys.
ctx.input.weaponGroup = 1;
ctx.targets.current = p5void;
for (const fn of winListeners.mousedown ?? []) fn({ button: 0 });
for (let i = 0; i < 360 && !(p5void.state.lastHitAt > p5peaceAt); i++) {
  tick(1, 'wave30 p5 firing'); // 900 u/s bolts close 200u in ~14 frames
  p5fireEvs.push(...ctx.lastEvents);
}
for (const fn of winListeners.mouseup ?? []) fn({ button: 0 });
ctx.targets.current = null;
const p5hitLanded = p5void.state.lastHitAt > p5peaceAt;
const p5releaseEvs = w30collect(3, 'wave30 p5 release'); // npc.js upkeep sees lastHitAt > demandPeaceAt
const w30voidChecks = {
  demandWasOpen: p5demandOpen,
  hitLanded: p5hitLanded,
  demandingCleared: p5void.ai.demanding === false,
  hailClosedEmitted: [...p5fireEvs, ...p5releaseEvs].some((e) => e.type === 'hailClosed'),
  cardClosed: w30hailDisplay() === 'none',
};
console.log('wave30 void on hit:', JSON.stringify(w30voidChecks));
if (!Object.values(w30voidChecks).every(Boolean)) { console.log('WAVE30 VOID ON HIT FAIL'); errors++; }
w30removeShip(p5void);
tick(5, 'wave30 p5 cleanup');

// -- h. wake-site discovery: a stamped unfound site on a live-system record -
// (the npc.js stamp shape, planted as controlled setup — prior soak sites ---
// are uncontrolled state, cleared first) found within 120u through the real -
// wakes.js scan: 2-3 refinedMetals pods, the Echo commLine, and the ---------
// firstWakeSite milestone exactly once (the wave-9 splice-and-refire pattern).
w28calm('wave30 calm (discovery)');
for (const r of ctx.world.records) delete r.wakeSite;
const w30msIdx = ctx.world.milestones.indexOf('firstWakeSite');
if (w30msIdx >= 0) ctx.world.milestones.splice(w30msIdx, 1);
const w30siteRec = ctx.world.records.find((r) => r.role === 'pirate' || r.role === 'ace') ?? ctx.world.records[0] ?? null;
if (w30siteRec) w30siteRec.wakeSite = { position: [0, 30000, 500], found: false };
const w30podsBefore = ctx.pods.length;
ctx.ship.object.position.set(0, 30000, 450); // 50u off the site — inside the 120u scan
ctx.ship.velocity.set(0, 0, 0);
const w30discEvs = w30collect(30, 'wave30 site discovery'); // 4 Hz scan — two windows
const w30refireEvs = w30collect(30, 'wave30 site refire watch');
const w30podDelta = ctx.pods.length - w30podsBefore;
const w30podEvs = w30discEvs.filter((e) => e.type === 'podSpawned');
const w30trailLines = w30discEvs.filter((e) => e.type === 'commLine' && e.text === 'The trail ends in a wreck field.' && e.from === 'Echo');
const w30msEvs = w30discEvs.filter((e) => e.type === 'milestone' && e.id === 'firstWakeSite');
const w30siteChecks = {
  recordFound: !!w30siteRec,
  siteFound: w30siteRec?.wakeSite?.found === true,
  pods2to3: w30podDelta >= 2 && w30podDelta <= 3,
  podEventsMatch: w30podEvs.length === w30podDelta,
  podsCarryMetals: w30podEvs.length > 0 && w30podEvs.every((e) => (e.pod?.contents ?? []).some((c) => c.commodity === 'refinedMetals')),
  trailLineOnce: w30trailLines.length === 1,
  milestoneOnce: w30msEvs.length === 1 && ctx.world.milestones.includes('firstWakeSite'),
  noRefire: !w30refireEvs.some((e) => (e.type === 'milestone' && e.id === 'firstWakeSite')
    || (e.type === 'commLine' && e.text === 'The trail ends in a wreck field.')),
};
console.log('wave30 wake discovery:', JSON.stringify(w30siteChecks), `pods=${w30podDelta}`);
if (!Object.values(w30siteChecks).every(Boolean)) { console.log('WAVE30 WAKE DISCOVERY FAIL'); errors++; }

// -- i. law-zone guard: a pirate inside the station's 300u law zone never ---
// develops the target, so the demand hail never opens (assertions filter by -
// ship: ambient re-instantiation near the dock is the wave-28 treadmill). ---
const w30stPos = SYSTEMS.freehold.station.position;
ctx.ship.object.position.set(w30stPos[0], w30stPos[1], w30stPos[2] + 400); // outside the zone, inside the bubble
ctx.ship.velocity.set(0, 0, 0);
ctx.input.throttle = 0;
ctx.input.fullStop = true;
w30parkHostiles('wave30 hostiles parked (law zone)');
const w30lawRec = {
  id: 'wave30-law', name: 'Wave30 law', classKey: 'cutter',
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95,
  // Wave 32: this leg tests the LAW guard — with the interest roll live, a
  // disinterest roll would pass every check trivially. The flag guarantees
  // the pirate WANTS the player, so only the zone keeps it honest.
  alwaysHuntsPlayer: true,
};
const p6law = spawnLiveShip(ctx, w30lawRec, new THREE.Vector3(w30stPos[0], w30stPos[1], w30stPos[2] + 100)); // inside the 300u zone
ctx.ships.push(p6law);
const w30lawEvs = w30collect(90, 'wave30 law zone');
const w30lawChecks = {
  noDemandHail: !w30lawEvs.some((e) => e.type === 'hailOpened' && e.ship === p6law),
  demandNeverSent: p6law.ai.demandSent === false && p6law.ai.demanding === false,
  targetNeverDevelops: p6law.ai.target !== 'player',
  noDemandOnRecord: w30lawRec.demandedAt == null,
};
console.log('wave30 law zone:', JSON.stringify(w30lawChecks));
if (!Object.values(w30lawChecks).every(Boolean)) { console.log('WAVE30 LAW ZONE FAIL'); errors++; }
w30removeShip(p6law);
tick(5, 'wave30 p6 cleanup');

// ---- Wave 31: Q-ship counterplay — Wolfeye Mk II, bracket tells, reveals --
// The wave-31 contract: world.js flags every ODD-index pirate as a Q-ship
// (qship/coverClass/coverName/coverFaction; revealed ABSENT until the first
// hostile act or scratch); npc.js spawns disguised records in their cover
// identity (real cutter stats underneath) and revealQship swaps the mesh in
// place, says 'The manifest lied.' under the REAL name, and guard-pushes the
// once-EVER 'qshipUnmasked' milestone; hud.js's target bracket shows the
// cover identity while masked, the real identity + ' · CONCEALED MOUNTS'
// once a Wolfeye Mk II (scanner >= 2) pierces it; station.js sells the Mk II
// on outfitting row 4 (Digit4) behind the Mk I prerequisite. Synthetic
// pirates follow the w30spawnPirate pattern extended with the cover fields.
//
// RUN-STATE NOTE (deliberate deviation from the letter of the brief): with
// wave-31 world.js/npc.js live, the run's EARLY freehold combat (the wave-2
// firing leg + 3 min soak) legitimately unmasks freehold's two authored
// Q-ships — acquisition reveals them and every autosave since carries
// revealed:true forward. So leg b asserts revealed ABSENT only where that is
// sound mid-run (even-index pirates, every non-pirate, and the cross-bank
// discipline invariant that revealed appears ONLY on qships and ONLY as
// true) and LOGS how many authored qships are still pristine; it does not
// fail the gate on soak-era unmasking. Leg d re-arms the once-ever milestone
// guard with the wave-30 splice idiom for the same reason.
const { FACTIONS: w31FACTIONS } = await import('../src/game/state.js'); // the line-295 destructure predates this section; a fresh import touches nothing earlier
const w31classHas = (n, cls) => typeof n.className === 'string' && n.className.split(' ').includes(cls);
const w31st = SYSTEMS.freehold.station.position;
// Target-bracket text lives under the getElementById-memoized #hud root
// (the wave-28 hud.js anchor pattern — NOT under document.body). That root
// carries MULTIPLE bracket chains: bootFreshHarness (wave 7-10 fresh boots)
// re-runs the full inits list — initHud included — on the same memoized
// root, so .rw-target-name/.rw-target-meta exist once per boot and every
// fresh-boot chain is frozen after its sub-run. Reading "the" node by class
// alone reads a frozen duplicate ('' forever); the LIVE chain is the one
// hud.js actually un-hid this frame — scope the text read to the SHOWN
// .rw-target instance (the continuing run's chain is appended first, so the
// first shown bracket in document order is always the live one).
const w31bracketText = () => {
  let live = null;
  for (const n of walkDom(document.getElementById('hud'))) {
    if (w31classHas(n, 'rw-target') && !n.classList.contains('is-hidden')) { live = n; break; }
  }
  if (!live) return { name: null, meta: null, shown: false };
  let name = null, meta = null;
  for (const n of walkDom(live)) {
    if (w31classHas(n, 'rw-target-name')) name = n.textContent;
    else if (w31classHas(n, 'rw-target-meta')) meta = n.textContent;
  }
  return { name, meta, shown: true };
};
// A synthetic disguised Q-ship pirate: cover identity on the record, REAL
// cutter stats in state (spawnLiveShip reads classKey), role stays 'pirate'.
const w31spawnQship = (suffix, coverName, pos) => {
  const rec = {
    id: `wave31-${suffix}`, name: `Wave31 ${suffix}`, classKey: 'cutter',
    faction: 'redledger', role: 'pirate', resolve: 50, personality: 95,
    qship: true, coverClass: 'freighter', coverName, coverFaction: 'freehold',
    // Wave 32: leg d's reveal-on-acquire needs engagement — pin the interest
    // roll. Inert in legs c/e: both ships sit inside the 300u law zone there
    // (player z+150 with q1 z-50; q3 z+100 with the player at the z+400
    // perch — the live ship is in-zone either way), so the law guard blocks
    // acquisition before the roll is ever consulted.
    alwaysHuntsPlayer: true,
  };
  const live = spawnLiveShip(ctx, rec, new THREE.Vector3(pos[0], pos[1], pos[2]));
  ctx.ships.push(live); // traffic owns this list in production; the harness drives by hand
  return live;
};
// Freeze ambient traffic for a leg: splice every live ship except the keeps
// and stamp rec.live = true on EVERY current-bank record, so traffic's spawn
// pass (which skips live records) instantiates nothing mid-leg — no ambient
// trader can drift inside a synthetic Q-ship's 800u hunt bubble and trip an
// untimed reveal. Stale live flags are healed wholesale by leg f's
// death-restore (save.js healLiveRecords rebuilds them from real ships).
const w31freezeTraffic = (keep) => {
  const keeps = new Set(Array.isArray(keep) ? keep : [keep]);
  for (let i = ctx.ships.length - 1; i >= 0; i--) {
    const s = ctx.ships[i];
    if (keeps.has(s)) continue;
    ctx.ships.splice(i, 1);
    removeLiveShip(ctx, s);
  }
  for (const r of ctx.world.records) r.live = true;
};

// -- a. Wolfeye Mk II purchase: the real outfitting hotkey path (Digit6 -----
// service, Digit2/Digit4 rows) — prerequisite refusal with scanner 0, the --
// exact 400/900 debits, the row-4 note transitions, the second-buy refusal.
w30parkHostiles('wave31 hostiles parked (Mk II)');
dockAtCurrentStation('wave31 dock freehold (Mk II)');
ctx.world.credits = 5000; // TEST SETUP poke (the wave-30 outfitting convention)
dispatchKey('Digit6'); // outfitting (DOCK_KEY_SERVICES[5])
const w31outfitOpen = [...walkDom(stationOverlay() ?? { children: [] })]
  .some((n) => n.textContent === 'OUTFITTING — hull work & instruments');
const w31scannerZero = (ctx.world.scanner ?? 0) === 0; // provable: no earlier wave presses outfitting Digit2/4
const w31prereqNote = [...walkDom(stationOverlay() ?? { children: [] })]
  .some((n) => typeof n.textContent === 'string' && n.textContent === 'Wolfeye Mk II needs the Mk I eye in the socket first.');
const w31creditsAtBuy = ctx.world.credits;
dispatchKey('Digit4'); // outfitting n===4 → act.buyScanner2 — refused without the Mk I
const w31noMk1Refused = w26StationNotice() === 'The Mk II lattice bolts onto a Mk I eye. Buy that first.'
  && ctx.world.credits === w31creditsAtBuy && (ctx.world.scanner ?? 0) === 0;
dispatchKey('Digit2'); // n===2 → act.buyScanner: the Mk I eye, exact 400 debit
const w31mk1Bought = ctx.world.scanner === 1 && ctx.world.credits === w31creditsAtBuy - 400
  && w26StationNotice() === 'Wolfeye Mk I bolted in. Their nerve reads as numbers now.';
const w31mk2Btn = [...walkDom(stationOverlay() ?? { children: [] })]
  .find((n) => n.tagName === 'BUTTON' && typeof n.textContent === 'string' && n.textContent === '4 — Wolfeye Mk II scanner (900 UU)') ?? null;
dispatchKey('Digit4'); // real buy: exact 900 debit, scanner 2, success line
const w31mk2Bought = ctx.world.scanner === 2 && ctx.world.credits === w31creditsAtBuy - 1300
  && w26StationNotice() === 'Wolfeye Mk II bolted in. Their guns show through their skins.';
const w31installedNote = [...walkDom(stationOverlay() ?? { children: [] })]
  .some((n) => typeof n.textContent === 'string' && n.textContent === 'Wolfeye Mk II installed — hidden gunports read on the target bracket.');
dispatchKey('Digit4'); // second buy: refused through the same hotkey path
const w31secondRefused = w26StationNotice() === 'Wolfeye Mk II already installed.'
  && ctx.world.credits === w31creditsAtBuy - 1300 && ctx.world.scanner === 2;
dispatchKey('Escape'); // back to services
const w31buyChecks = {
  outfittingOpened: w31outfitOpen,
  scannerStartsZero: w31scannerZero,
  prereqNoteShown: w31prereqNote,
  refusedWithoutMk1: w31noMk1Refused,
  mk1Exact400: w31mk1Bought,
  mk2ButtonAtScanner1: !!w31mk2Btn,
  mk2Exact900: w31mk2Bought,
  installedNoteShown: w31installedNote,
  secondBuyRefused: w31secondRefused,
};
console.log('wave31 Mk II purchase:', JSON.stringify(w31buyChecks), `credits=${ctx.world.credits}`);
if (!Object.values(w31buyChecks).every(Boolean)) { console.log('WAVE31 MK II PURCHASE FAIL'); errors++; }

// -- b. Record data: the CURRENT freehold bank (generated fresh this run by -
// the wave-31 world.js). The authored freehold cast is 8 traders, 4 pirates,
// 2 patrols, 1 ace (authored-systems.js); migrants/injected aces append AFTER
// them, so the authored pirates are identified by NAME, not bank position.
// Odd pirate indices carry exactly the four cover fields; even indices and
// every non-pirate carry none and never carry 'revealed'. Migrants keep
// their HOME bank's fields, so they get the shape check, not the freehold
// values. revealed discipline is asserted across EVERY bank: present only on
// qships, only ever === true (a generation-time false-stamp on any
// never-revealed qship shows up here; soak-era unmasking is legal play). ---
const w31bankB = ctx.world.records;
const w31authored = [ // PIRATE_NAMES.freehold in cast order → pirate index
  { name: 'Red Marlow', i: 0 }, { name: 'Gallows Wren', i: 1 },
  { name: 'Ninth Tooth', i: 2 }, { name: 'Sable Ilex', i: 3 },
];
const w31coverFor = { 1: 'Mercy of Tarsus', 3: 'Long Orchard' }; // QSHIP_COVERS.freehold[(i-1)/2]
const w31coverKeys = ['qship', 'coverClass', 'coverName', 'coverFaction'];
const w31recByName = (name) => w31bankB.find((r) => r.role === 'pirate' && r.name === name) ?? null;
let w31authoredFound = true, w31oddCover = true, w31evenClean = true, w31pristine = 0;
for (const { name, i } of w31authored) {
  const rec = w31recByName(name);
  if (!rec) { w31authoredFound = false; continue; }
  if (i % 2 === 1) {
    if (!(rec.qship === true && rec.coverClass === 'freighter'
      && rec.coverName === w31coverFor[i] && rec.coverFaction === 'freehold')) w31oddCover = false;
    if (!('revealed' in rec)) w31pristine++; // logged, not asserted — see the run-state note above
  } else if (w31coverKeys.some((k) => k in rec) || 'revealed' in rec) w31evenClean = false;
}
const w31nonPiratesClean = w31bankB.every((r) => r.role === 'pirate'
  || (!w31coverKeys.some((k) => k in r) && !('revealed' in r)));
const w31migrantPiratesShaped = w31bankB.every((r) => {
  if (r.role !== 'pirate' || w31authored.some((a) => a.name === r.name)) return true;
  if (r.qship === true) {
    return r.coverClass === 'freighter' && typeof r.coverName === 'string' && r.coverName.length > 0
      && typeof r.coverFaction === 'string' && (!('revealed' in r) || r.revealed === true);
  }
  return !w31coverKeys.some((k) => k in r) && !('revealed' in r);
});
let w31revealedDiscipline = true;
for (const sysId of Object.keys(ctx.world.recordBanks ?? {})) {
  for (const r of ctx.world.recordBanks[sysId]) {
    if ('revealed' in r && !(r.qship === true && r.revealed === true)) w31revealedDiscipline = false;
  }
}
const w31recordChecks = {
  authoredPiratesFound: w31authoredFound,
  oddPiratesCarryCover: w31oddCover,
  evenPiratesClean: w31evenClean,
  nonPiratesCarryNothing: w31nonPiratesClean,
  migrantPiratesShaped: w31migrantPiratesShaped,
  revealedOnlyTrueOnQships: w31revealedDiscipline,
};
console.log('wave31 qship records:', JSON.stringify(w31recordChecks), `pristineQships=${w31pristine}/2`);
if (!Object.values(w31recordChecks).every(Boolean)) { console.log('WAVE31 QSHIP RECORDS FAIL'); errors++; }

// -- c. Bracket cover/pierce: a synthetic disguised Q-ship dead ahead of the
// player, BOTH inside the station's 300u law zone so updateHunt can never
// develop a target (player branch needs both sides outside; the trader
// branch finds nothing — traffic is frozen). Scanner poked 0 → cover
// identity; restored to the leg-a-bought 2 → real name + the CONCEALED
// MOUNTS suffix. Position re-pinned per tick so the loiter drift can't move
// the distance reading between text windows (5 Hz write-on-change). --------
undockStation();
ctx.ship.object.position.set(w31st[0], w31st[1], w31st[2] + 150); // inside the law zone, clear of the 45u dock ring
ctx.ship.velocity.set(0, 0, 0);
ctx.ship.object.quaternion.identity(); // nose -Z: the chase cam looks dead ahead
ctx.input.throttle = 0;
ctx.input.fullStop = true;
const w31q1pos = [w31st[0], w31st[1], w31st[2] + 150 - 200]; // 200u ahead, 50u off the station — in-zone too
const w31q1 = w31spawnQship('Veiled', 'Wave31 Cover', w31q1pos);
w31freezeTraffic([w31q1]);
ctx.targets.current = w31q1;
ctx.world.scanner = 0; // TEST SETUP poke (the wave-9 scanner pattern): read the masked branch
for (let i = 0; i < 90; i++) { // camera lerp (~1 s) + several 0.2 s text windows
  w31q1.object.position.set(w31q1pos[0], w31q1pos[1], w31q1pos[2]);
  tick(1, 'wave31 bracket cover');
}
const w31coverText = w31bracketText();
ctx.world.scanner = 2; // restore the real leg-a state: the pierce branch
for (let i = 0; i < 30; i++) {
  w31q1.object.position.set(w31q1pos[0], w31q1pos[1], w31q1pos[2]);
  tick(1, 'wave31 bracket pierce');
}
const w31pierceText = w31bracketText();
ctx.targets.current = null; // release the bracket (change-detection caching unwinds next frame)
const w31coverDist = Number((w31coverText.meta ?? '').match(/· (\d+)u$/)?.[1]);
const w31pierceDist = Number((w31pierceText.meta ?? '').match(/· (\d+)u · CONCEALED MOUNTS$/)?.[1]);
const w31distNow = () => Math.round(ctx.ship.object.position.distanceTo(w31q1.object.position));
const w31bracketChecks = {
  bracketShown: w31coverText.shown && w31pierceText.shown,
  coverNameShown: w31coverText.name === 'Wave31 Cover',
  coverMetaFaction: (w31coverText.meta ?? '').startsWith(w31FACTIONS.freehold.name + ' · '),
  coverMetaNoTell: !(w31coverText.meta ?? '').includes('CONCEALED MOUNTS'),
  coverDistSane: Number.isFinite(w31coverDist) && Math.abs(w31coverDist - w31distNow()) <= 10,
  pierceShowsRealName: w31pierceText.name === 'Wave31 Veiled',
  pierceMetaRealFaction: (w31pierceText.meta ?? '').startsWith(w31FACTIONS.redledger.name + ' · '),
  pierceMetaSuffix: (w31pierceText.meta ?? '').endsWith(' · CONCEALED MOUNTS'),
  pierceDistSane: Number.isFinite(w31pierceDist) && Math.abs(w31pierceDist - w31distNow()) <= 10,
  neverRevealed: !('revealed' in w31q1.record) && w31q1.ai.target == null,
};
console.log('wave31 bracket cover/pierce:', JSON.stringify(w31bracketChecks),
  `cover=${JSON.stringify(w31coverText)} pierce=${JSON.stringify(w31pierceText)}`);
if (!Object.values(w31bracketChecks).every(Boolean)) { console.log('WAVE31 BRACKET COVER FAIL'); errors++; }
w30removeShip(w31q1);
tick(3, 'wave31 q1 cleanup');

// -- d. Reveal on acquisition: a second synthetic Q-ship, the player parked -
// outside the law zone within the 800u bubble (the wave-30 leg-i perch at ---
// station z+400). updateHunt's acquire reveals it the same frame: the record
// flips, the mesh swaps IN PLACE (object identity changes, position carried),
// the comm line speaks the REAL name, and the once-ever milestone fires. The
// guard is re-armed first — soak-era combat legitimately fired it already. --
ctx.ship.object.position.set(w31st[0], w31st[1], w31st[2] + 400); // outside the 300u zone, inside the bubble
ctx.ship.velocity.set(0, 0, 0);
ctx.ship.object.quaternion.identity();
const w31msIdxD = ctx.world.milestones.indexOf('qshipUnmasked');
if (w31msIdxD >= 0) ctx.world.milestones.splice(w31msIdxD, 1); // TEST SETUP: re-arm the once-ever guard (wave-30 firstWakeSite idiom)
const w31q2 = w31spawnQship('Unmasked', 'Wave31 Shroud', [w31st[0] + 250, w31st[1], w31st[2] + 400]);
const w31objBefore = w31q2.object;
const w31classUnderSkin = w31q2.state.classKey; // 'cutter' — real stats under the freighter skin
const w31revealEvs = [];
let w31swapDelta = NaN;
for (let i = 0; i < 30 && w31q2.record.revealed !== true; i++) {
  const px = w31q2.object.position.x, py = w31q2.object.position.y, pz = w31q2.object.position.z;
  tick(1, 'wave31 reveal on acquire');
  w31revealEvs.push(...ctx.lastEvents);
  if (w31q2.record.revealed === true && Number.isNaN(w31swapDelta)) {
    w31swapDelta = Math.hypot(w31q2.object.position.x - px, w31q2.object.position.y - py, w31q2.object.position.z - pz);
  }
}
const w31msEvsD = w31revealEvs.filter((e) => e.type === 'milestone' && e.id === 'qshipUnmasked');
const w31acquireChecks = {
  revealedOnAcquire: w31q2.record.revealed === true,
  objectSwapped: w31q2.object !== w31objBefore,
  swapInPlace: Number.isFinite(w31swapDelta) && w31swapDelta < 5, // one frame of post-swap steer at most
  realStatsUnderSkin: w31classUnderSkin === 'cutter' && w31q2.state.classKey === 'cutter',
  liedLineRealName: w31revealEvs.some((e) => e.type === 'commLine' && e.text === 'The manifest lied.' && e.from === 'Wave31 Unmasked'),
  milestoneOnce: w31msEvsD.length === 1
    && w31msEvsD[0].line === 'The lane wears masks. You saw one come off.'
    && ctx.world.milestones.filter((m) => m === 'qshipUnmasked').length === 1,
};
console.log('wave31 reveal on acquire:', JSON.stringify(w31acquireChecks), `swapDelta=${w31swapDelta?.toFixed?.(2)}`);
if (!Object.values(w31acquireChecks).every(Boolean)) { console.log('WAVE31 REVEAL ON ACQUIRE FAIL'); errors++; }
w30removeShip(w31q2); // the demand card (if the hail opened) closes on the despawn path
tick(3, 'wave31 q2 cleanup');

// -- e. Reveal on scratch: a third synthetic Q-ship held inside the law zone
// (never acquires — asserted), then a one-point hull scratch. updateHunt's
// top-of-function check strips the facade next frame WITHOUT a second
// milestone event (the once-ever guard already spent it in leg d). --------
const w31q3pos = [w31st[0], w31st[1], w31st[2] + 100]; // deep in-zone
const w31q3 = w31spawnQship('Scratch', 'Wave31 Veil', w31q3pos);
for (let i = 0; i < 3; i++) {
  w31q3.object.position.set(w31q3pos[0], w31q3pos[1], w31q3pos[2]);
  tick(1, 'wave31 scratch settle');
}
const w31keptFromAcquiring = w31q3.record.revealed !== true && w31q3.ai.target == null;
w31q3.state.hull = w31q3.state.hullMax - 1; // TEST SETUP: the scratch itself
const w31scratchEvs = [];
for (let i = 0; i < 3; i++) {
  w31q3.object.position.set(w31q3pos[0], w31q3pos[1], w31q3pos[2]);
  tick(1, 'wave31 scratch reveal');
  w31scratchEvs.push(...ctx.lastEvents);
}
const w31scratchChecks = {
  keptFromAcquiring: w31keptFromAcquiring,
  scratchReveals: w31q3.record.revealed === true,
  liedLineAgain: w31scratchEvs.some((e) => e.type === 'commLine' && e.text === 'The manifest lied.' && e.from === 'Wave31 Scratch'),
  noSecondMilestone: !w31scratchEvs.some((e) => e.type === 'milestone' && e.id === 'qshipUnmasked')
    && ctx.world.milestones.filter((m) => m === 'qshipUnmasked').length === 1,
};
console.log('wave31 reveal on scratch:', JSON.stringify(w31scratchChecks));
if (!Object.values(w31scratchChecks).every(Boolean)) { console.log('WAVE31 REVEAL ON SCRATCH FAIL'); errors++; }
w30removeShip(w31q3);
tick(3, 'wave31 q3 cleanup');

// -- f. Save roundtrip: scanner 2 (bought in leg a) and a STANDING revealed
// flag on a persisted bank record ride the dock autosave and the
// death-restore. The flag is guaranteed by unmasking the authored freehold
// Q-ship 'Gallows Wren' through the real acquisition path when the run
// hasn't already (either way revealed === true stands pre-save; an
// already-unmasked record simply spawns undisguised and nothing fires). ----
const w31wren = w31bankB.find((r) => r.role === 'pirate' && r.name === 'Gallows Wren') ?? null;
if (w31wren && w31wren.revealed !== true) {
  if (w31wren.state === 'dead' || w31wren.state === 'captured') w31wren.state = 'enroute'; // the wave-12 resurrection idiom
  // Wave 32: guarantee the interest roll for this leg. Set-then-delete was
  // chosen over a Math.random pin: the reveal window runs up to 30 ticks and
  // a constant pin would feed every other consumer in those frames (steer,
  // loiter, resolve), while the flag scopes the guarantee to exactly this
  // record. It is deleted below BEFORE the dock autosave, so the save
  // roundtrip that follows stays pristine (no alwaysHuntsPlayer rides it).
  w31wren.alwaysHuntsPlayer = true;
  const w31wrenLive = spawnLiveShip(ctx, w31wren,
    new THREE.Vector3(ctx.ship.object.position.x + 250, ctx.ship.object.position.y, ctx.ship.object.position.z));
  ctx.ships.push(w31wrenLive);
  w31wren.live = true; // traffic's own spawn-pass contract — no double instantiation
  for (let i = 0; i < 30 && w31wren.revealed !== true; i++) tick(1, 'wave31 wren reveal'); // player still at the leg-d perch, outside the zone
  const w31wi = ctx.ships.indexOf(w31wrenLive);
  if (w31wi >= 0) ctx.ships.splice(w31wi, 1);
  removeLiveShip(ctx, w31wrenLive);
  w31wren.live = false;
  delete w31wren.alwaysHuntsPlayer; // wave 32: leg-scoped — must not ride the dock autosave below
  tick(3, 'wave31 wren cleanup'); // combat flag clears; any demand card closes on the despawn path
}
const w31wrenRevealed = w31wren?.revealed === true;
w30parkHostiles('wave31 hostiles parked (scanner save)');
dockAtCurrentStation('wave31 dock freehold (scanner save)'); // 'docked' fires trySave
let w31snap = null;
for (let i = 0; i < 60 * 15 && !w31snap; i++) { // the wave-30 save-wait discipline
  for (const s of ctx.ships) if (w30isHostile(s) && s.object) s.object.position.set(9000, 9000, 9000);
  tick(1, 'wave31 scanner save wait');
  try {
    const s = JSON.parse(store.get('rimward-save-v1') ?? 'null');
    if (s?.world?.scanner === 2
      && (s?.world?.recordBanks?.freehold ?? []).some((r) => r.name === 'Gallows Wren' && r.revealed === true)) w31snap = s;
  } catch { /* keep waiting */ }
}
// Die + recover (the wave-26 restore path): the in-memory corruption loses.
ctx.world.scanner = 0; // corrupt in memory; the restore must win
if (w31wren) w31wren.revealed = false; // corrupt the standing reveal — the pre-restore object is discarded wholesale
ctx.emit('playerDestroyed', {});
tick(2, 'wave31 death consumed (scanner restore)');
dispatchKey('Enter'); // recover(): restore(last save)
tick(2, 'wave31 scanner restore settle');
const w31wrenRestored = ctx.world.records.find((r) => r.role === 'pirate' && r.name === 'Gallows Wren') ?? null;
const w31saveChecks = {
  wrenRevealedPreSave: w31wrenRevealed,
  saveCarriesBoth: w31snap?.world?.scanner === 2, // the poll's predicate already gates Wren's flag
  scannerRestored: ctx.world.scanner === 2,
  revealRestored: w31wrenRestored?.revealed === true,
  milestoneRidesRestore: ctx.world.milestones.filter((m) => m === 'qshipUnmasked').length === 1,
};
console.log('wave31 scanner save roundtrip:', JSON.stringify(w31saveChecks));
if (!Object.values(w31saveChecks).every(Boolean)) { console.log('WAVE31 SCANNER SAVE FAIL'); errors++; }

// -- g. Regression: a plain non-qship pirate's bracket at scanner 2 is the --
// pre-wave-31 shape, byte-for-byte — record name, faction + distance, no ---
// suffix. Same in-zone geometry as leg c so nothing hunts mid-read. --------
if (ctx.flags.docked) undockStation();
ctx.ship.object.position.set(w31st[0], w31st[1], w31st[2] + 150);
ctx.ship.velocity.set(0, 0, 0);
ctx.ship.object.quaternion.identity();
ctx.input.throttle = 0;
ctx.input.fullStop = true;
const w31plainRec = {
  id: 'wave31-plain', name: 'Wave31 Plain', classKey: 'cutter',
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95,
};
const w31plainPos = [w31st[0], w31st[1], w31st[2] + 150 - 200];
const w31plain = spawnLiveShip(ctx, w31plainRec, new THREE.Vector3(w31plainPos[0], w31plainPos[1], w31plainPos[2]));
ctx.ships.push(w31plain);
w31freezeTraffic([w31plain]);
ctx.targets.current = w31plain;
for (let i = 0; i < 90; i++) { // camera lerp + text windows (the leg-c cadence)
  w31plain.object.position.set(w31plainPos[0], w31plainPos[1], w31plainPos[2]);
  tick(1, 'wave31 plain bracket');
}
const w31plainText = w31bracketText();
ctx.targets.current = null;
const w31plainDist = Number((w31plainText.meta ?? '').match(/· (\d+)u$/)?.[1]);
const w31plainChecks = {
  bracketShown: w31plainText.shown,
  nameIsRecordName: w31plainText.name === 'Wave31 Plain',
  metaExactShape: (w31plainText.meta ?? '') === `${w31FACTIONS.redledger.name} · ${w31plainDist}u`, // faction + distance, nothing else
  metaNoSuffix: !(w31plainText.meta ?? '').includes('CONCEALED MOUNTS'),
  distSane: Number.isFinite(w31plainDist) && Math.abs(w31plainDist - Math.round(ctx.ship.object.position.distanceTo(w31plain.object.position))) <= 10,
};
console.log('wave31 plain-pirate bracket:', JSON.stringify(w31plainChecks), `meta=${JSON.stringify(w31plainText.meta)}`);
if (!Object.values(w31plainChecks).every(Boolean)) { console.log('WAVE31 PLAIN BRACKET FAIL'); errors++; }
w30removeShip(w31plain);
tick(3, 'wave31 plain cleanup');

// ---- Wave 32: pirate player-interest — temper, grace, apathy, Dresk ------
// The wave-32 contract: playerInterestChance (npc.js, exported) prices a
// pirate's attention from the record's persisted temper (lazy ??= stamp),
// the player's manifest value, and fear, clamped [0.05, 0.9]; each live
// pirate rolls ONCE per instantiation (ai.playerRolled/playerInterested)
// and only an interested pirate may acquire the player — the rest fall
// through to the nearest-trader loop or loiter. Jump grace (jumpGraceUntil)
// now shields TARGETING, not just the wave-30 demand hail. record.
// alwaysHuntsPlayer skips the roll (chance 1); spawnLiveShip self-heals the
// flag onto any record named 'Collector Dresk' for pre-wave-32 saves, and
// world.js injectCollector stamps it on new Dresk records.
//
// REGRESSION NOTE (the brief's leg f): the interested path needs NO leg of
// its own — the wave-30 and wave-31 sections above now run with
// alwaysHuntsPlayer pinned on every synthetic pirate (w30spawnPirate,
// w30lawRec, w31spawnQship, the w31wren window), so their passing IS the
// pre-wave-32 engagement regression, dice-free. This section proves only
// the NEW behavior: the chance math, the grace gate, apathy, and the
// collector bypass. Run on the continuing run's end state (freehold,
// undocked, traffic frozen by the wave-31 legs — every bank record carries
// live=true, so nothing ambient instantiates mid-leg; leg e's death-restore
// heals those flags wholesale at the end).
const { playerInterestChance: w32interestChance } = await import('../src/systems/npc.js'); // scoped import (the wave-31 FACTIONS precedent) — the header npc.js destructure predates this export
const w32grace0 = ctx.world.jumpGraceUntil ?? 0; // section-start grace state, restored at the end
// Spawn offset from the player, the w30spawnPirate pattern — record literal
// supplied per leg so each carries exactly the fields under test.
const w32spawn = (rec, offset) => {
  const p = ctx.ship.object.position;
  const live = spawnLiveShip(ctx, rec, new THREE.Vector3(p.x + offset[0], p.y + offset[1], p.z + offset[2]));
  ctx.ships.push(live); // traffic owns this list in production; the harness drives by hand
  return live;
};

// -- a. Chance exactness: pure calls, no ticks. Cargo/fear are read live, --
// so poke and restore them around the calls; the manifest-value check makes
// a setup break fail honestly instead of silently reading the wrong clamp. -
const w32cargoSave = ctx.cargo.splice(0, ctx.cargo.length);
const w32fearSave = ctx.world.fear;
ctx.world.fear = 0;
const w32aRec1 = { temper: 0.5 }; // 0.25 + 0.5×0.35 = 0.425
const w32aP1 = w32interestChance(ctx, w32aRec1);
ctx.cargo.push({ commodity: 'provisions', units: 500 }); // TEST SETUP: a rich manifest — must clear 1600 UU
const w32aManifest = cargoValue(ctx.cargo, ctx.world.prices);
const w32aRec2 = { temper: 1 }; // 0.25 + 0.35 + 0.3 = 0.9 → the max clamp
const w32aP2 = w32interestChance(ctx, w32aRec2);
ctx.cargo.length = 0;
ctx.world.fear = 100; // 0.25 − 100×0.004 < 0 → the min clamp
const w32aRec3 = { temper: 0 };
const w32aP3 = w32interestChance(ctx, w32aRec3);
ctx.world.fear = w32fearSave;
ctx.cargo.push(...w32cargoSave); // restore the wave-30 manifest exactly
const w32aRec4 = { alwaysHuntsPlayer: true };
const w32aP4 = w32interestChance(ctx, w32aRec4);
const w32aRec5 = {}; // flagless: the lazy temper stamp
const w32aP5a = w32interestChance(ctx, w32aRec5);
const w32aT5 = w32aRec5.temper;
const w32aP5b = w32interestChance(ctx, w32aRec5);
const w32chanceChecks = {
  temperHalfExact: Math.abs(w32aP1 - 0.425) < 1e-12, // 0.25 + 0.5×0.35, float-safe "exact"
  manifestRichEnough: w32aManifest >= 1600,
  temperOneMaxClamp: Math.abs(w32aP2 - 0.9) < 1e-12, // 0.25+0.35+0.3 = 0.9 (the clamp boundary); IEEE lands one ulp under, so epsilon like the 0.425 check
  temperZeroFearMinClamp: w32aP3 === 0.05,
  alwaysHuntsIsOne: w32aP4 === 1 && !('temper' in w32aRec4), // the early return never stamps
  lazyTemperStamped: Number.isFinite(w32aT5) && w32aT5 >= 0 && w32aT5 <= 1,
  lazyTemperSticky: w32aRec5.temper === w32aT5 && w32aP5b === w32aP5a,
};
console.log('wave32 interest chance:', JSON.stringify(w32chanceChecks), `p=${[w32aP1, w32aP2, w32aP3, w32aP4].join('|')}`);
if (!Object.values(w32chanceChecks).every(Boolean)) { console.log('WAVE32 INTEREST CHANCE FAIL'); errors++; }

// -- b. Grace gate: a GUARANTEED-interested pirate 250u off the player (the -
// wave-30 geometry, both far outside the law zone at the calm point) cannot
// acquire while jumpGraceUntil stands — no target, no hail, no intent — and
// acquires + opens the wave-30 demand hail within ~10 ticks of grace expiry.
w28calm('wave32 calm (grace gate)');
w31freezeTraffic([]); // nothing ambient mid-leg (bank records already carry live=true; this clears any live strays)
ctx.world.jumpGraceUntil = ctx.world.time + 2; // TEST SETUP: grace active for the whole 60-tick hold
const w32b = w32spawn({
  id: 'wave32-grace', name: 'Wave32 Grace', classKey: 'cutter',
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95,
  alwaysHuntsPlayer: true, // the leg tests GRACE, never the dice
}, [250, 0, 0]);
let w32bTargetInGrace = null;
const w32bGraceEvs = [];
for (let i = 0; i < 60; i++) {
  tick(1, 'wave32 grace hold');
  w32bGraceEvs.push(...ctx.lastEvents);
  if (w32b.ai.target != null) w32bTargetInGrace = w32b.ai.target;
}
const w32bIntentInGrace = w32b.ai.intent;
ctx.world.jumpGraceUntil = 0; // grace expires — acquisition must land now
const w32bAfterEvs = [];
for (let i = 0; i < 10; i++) { tick(1, 'wave32 grace expired'); w32bAfterEvs.push(...ctx.lastEvents); }
const w32graceChecks = {
  targetStaysNull: w32bTargetInGrace === null, // sampled every tick of the hold
  noHailDuringGrace: !w32bGraceEvs.some((e) => e.type === 'hailOpened' && e.ship === w32b),
  noIntentDuringGrace: w32bIntentInGrace === false,
  acquiresAfterGrace: w32b.ai.target === 'player',
  demandHailAfterGrace: w32bAfterEvs.some((e) => e.type === 'hailOpened' && e.ship === w32b),
};
console.log('wave32 grace gate:', JSON.stringify(w32graceChecks));
if (!Object.values(w32graceChecks).every(Boolean)) { console.log('WAVE32 GRACE GATE FAIL'); errors++; }
w30removeShip(w32b); // the demand card closes on the despawn path
tick(3, 'wave32 grace cleanup');

// -- b2. Positive control (review P3): a flagless temper-preset (0.5) pirate
// with Math.random pinned LOW (0) for exactly the roll frame MUST roll
// interested (chance >= 0.05 > 0 always), acquire the player on that frame,
// and leave the preset temper untouched (??= never consumes on a preset).
// Without this leg a broken chance formula (e.g. always 0) false-passes the
// whole suite: c1/c2 prove the dice can say no, this proves they can say yes.
ctx.world.jumpGraceUntil = 0; // the roll frame's preconditions hold on tick one
const w32pcRec = {
  id: 'wave32-control', name: 'Wave32 Control', classKey: 'cutter',
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95, temper: 0.5,
}; // NO alwaysHuntsPlayer — the roll itself must carry this one
const w32pc = w32spawn(w32pcRec, [250, 0, 0]);
const w32rngPc = Math.random;
Math.random = () => 0; // pinned LOW for exactly the roll frame (try/finally: a mid-window throw must not leave the suite pinned)
try {
  tick(1, 'wave32 control interest roll');
} finally {
  Math.random = w32rngPc;
}
const w32controlChecks = {
  rollPinnedAndPassed: w32pc.ai.playerRolled === true && w32pc.ai.playerInterested === true,
  acquiresPlayer: w32pc.ai.target === 'player',
  temperUntouched: w32pcRec.temper === 0.5, // the preset rides the roll — ??= never stamps over it
};
console.log('wave32 positive control:', JSON.stringify(w32controlChecks));
if (!Object.values(w32controlChecks).every(Boolean)) { console.log('WAVE32 POSITIVE CONTROL FAIL'); errors++; }
w30removeShip(w32pc); // the demand card (opened on the acquisition frame) closes on the despawn path
tick(3, 'wave32 control cleanup');

// -- c1. Disinterest + trader preference: temper preset 0 (the lazy ??= -----
// never fires) and Math.random pinned HIGH for exactly the roll frame — the
// once-per-instantiation roll fails (max chance 0.9 < 0.999999). Wrapped as
// save/override/restore around ONE tick: the other consumers that frame
// tolerate a constant, and the rollFailed check proves the pin framed the
// roll. A live synthetic trader in range gives the fall-through loop prey. -
ctx.world.jumpGraceUntil = 0; // the roll frame's preconditions hold on tick one
const w32c1t = w32spawn({
  id: 'wave32-c1-prey', name: 'Wave32 Prey', classKey: 'freighter',
  faction: 'freehold', role: 'trader', resolve: 50,
}, [400, 0, 0]); // 150u past the pirate — inside its 800u bubble, outside the law zone
const w32c1 = w32spawn({
  id: 'wave32-c1', name: 'Wave32 Apathy', classKey: 'cutter',
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95, temper: 0,
}, [250, 0, 0]);
const w32rng1 = Math.random;
Math.random = () => 0.999999; // pinned HIGH for exactly the roll frame (try/finally: a mid-window throw must not leave the suite pinned)
try {
  tick(1, 'wave32 c1 interest roll');
} finally {
  Math.random = w32rng1;
}
const w32c1RolledOut = w32c1.ai.playerRolled === true && w32c1.ai.playerInterested === false;
let w32c1PlayerEver = false;
const w32c1Evs = [];
for (let i = 0; i < 59; i++) { // 60 ticks total including the roll frame
  tick(1, 'wave32 c1 trader hunt');
  w32c1Evs.push(...ctx.lastEvents);
  if (w32c1.ai.target === 'player') w32c1PlayerEver = true;
}
const w32apathyChecks = {
  rollPinnedAndFailed: w32c1RolledOut,
  targetIsTheTrader: w32c1.ai.target === w32c1t, // the live trader ship, not its record
  neverTargetsPlayer: !w32c1PlayerEver && w32c1.ai.target !== 'player',
  noHailFromPirate: !w32c1Evs.some((e) => e.type === 'hailOpened' && e.ship === w32c1),
};
console.log('wave32 disinterest trader preference:', JSON.stringify(w32apathyChecks));
if (!Object.values(w32apathyChecks).every(Boolean)) { console.log('WAVE32 DISINTEREST FAIL'); errors++; }
w30removeShip(w32c1);
w30removeShip(w32c1t);
tick(3, 'wave32 c1 cleanup');

// -- c2. Masked by apathy: a disguised Q-ship (the wave-31 cover fields, NO -
// alwaysHuntsPlayer) pinned disinterested with NO traders in range never
// acquires — the wave-31 reveal triggers (acquisition / scratch) never fire,
// the bracket keeps reading the cover identity (scanner poked 0, the wave-31
// leg-c pattern: a pierce read would prove nothing about the facade). ------
ctx.ship.object.quaternion.identity(); // nose -Z: the bracket reads dead ahead (wave-31 leg-c cadence)
const w32c2pos = [ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z - 200]; // dead ahead, inside the bubble
const w32c2Rec = {
  id: 'wave32-c2', name: 'Wave32 Shrouded', classKey: 'cutter',
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95, temper: 0,
  qship: true, coverClass: 'freighter', coverName: 'Wave32 Masque', coverFaction: 'freehold',
};
const w32c2 = w32spawn(w32c2Rec, [0, 0, -200]);
const w32rng2 = Math.random;
Math.random = () => 0.999999; // pinned HIGH for exactly the roll frame (try/finally: a mid-window throw must not leave the suite pinned)
try {
  tick(1, 'wave32 c2 interest roll');
} finally {
  Math.random = w32rng2;
}
const w32c2RolledOut = w32c2.ai.playerRolled === true && w32c2.ai.playerInterested === false;
let w32c2TargetEver = null;
for (let i = 0; i < 59; i++) {
  w32c2.object.position.set(w32c2pos[0], w32c2pos[1], w32c2pos[2]); // re-pin against loiter drift (wave-31 leg-c cadence)
  tick(1, 'wave32 c2 apathy hold');
  if (w32c2.ai.target != null) w32c2TargetEver = w32c2.ai.target;
}
const w32scannerSave = ctx.world.scanner;
ctx.world.scanner = 0; // TEST SETUP poke: read the masked branch — the facade must still be on
ctx.targets.current = w32c2;
for (let i = 0; i < 90; i++) { // camera lerp + text windows (the wave-31 leg-c cadence)
  w32c2.object.position.set(w32c2pos[0], w32c2pos[1], w32c2pos[2]);
  tick(1, 'wave32 c2 bracket cover');
}
const w32c2Text = w31bracketText();
ctx.targets.current = null;
ctx.world.scanner = w32scannerSave; // restore the wave-31 leg-a state
const w32maskedChecks = {
  rollPinnedAndFailed: w32c2RolledOut,
  neverAcquires: w32c2TargetEver === null && w32c2.ai.target == null,
  staysMasked: !('revealed' in w32c2Rec),
  bracketShowsCover: w32c2Text.shown && w32c2Text.name === 'Wave32 Masque',
  bracketCoverFaction: (w32c2Text.meta ?? '').startsWith(w31FACTIONS.freehold.name + ' · '),
  bracketNoTell: !(w32c2Text.meta ?? '').includes('CONCEALED MOUNTS'),
};
console.log('wave32 masked by apathy:', JSON.stringify(w32maskedChecks), `bracket=${JSON.stringify(w32c2Text)}`);
if (!Object.values(w32maskedChecks).every(Boolean)) { console.log('WAVE32 MASKED BY APATHY FAIL'); errors++; }
w30removeShip(w32c2);
tick(3, 'wave32 c2 cleanup');

// -- d. Collector bypass: a record named 'Collector Dresk' WITHOUT the flag -
// gets alwaysHuntsPlayer stamped by spawnLiveShip (the pre-wave-32 save
// self-heal), playerInterestChance returns 1, and with Math.random pinned
// HIGH he still acquires the player on the roll frame (grace 0, outside the
// law zone, 250u — the wave-30 geometry). ----------------------------------
ctx.world.jumpGraceUntil = 0;
const w32dRec = {
  id: 'wave32-dresk', name: ORIGIN_ARCS.ledgerDebt.collector.name,
  classKey: ORIGIN_ARCS.ledgerDebt.collector.classKey,
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95,
}; // NO alwaysHuntsPlayer — the spawn self-heal must supply it
const w32d = w32spawn(w32dRec, [250, 0, 0]);
const w32dStamped = w32dRec.alwaysHuntsPlayer === true;
const w32dChanceOne = w32interestChance(ctx, w32dRec) === 1;
const w32rng3 = Math.random;
Math.random = () => 0.999999; // pinned HIGH for the roll frame — chance 1 beats the pin (try/finally: a mid-window throw must not leave the suite pinned)
try {
  tick(1, 'wave32 dresk bypass');
} finally {
  Math.random = w32rng3;
}
const w32dreskChecks = {
  selfHealStampsFlag: w32dStamped,
  chanceIsOne: w32dChanceOne,
  interestedDespiteHighPin: w32d.ai.playerRolled === true && w32d.ai.playerInterested === true,
  acquiresPlayer: w32d.ai.target === 'player',
};
console.log('wave32 collector bypass:', JSON.stringify(w32dreskChecks));
if (!Object.values(w32dreskChecks).every(Boolean)) { console.log('WAVE32 COLLECTOR BYPASS FAIL'); errors++; }
w30removeShip(w32d); // the demand card (it opened on the acquisition frame) closes on the despawn path
tick(3, 'wave32 dresk cleanup');

// -- e. Temper roundtrip: a stamped temper rides the real dock autosave and -
// the death-restore (the wave-31 f discipline) byte-identical. 0.5 survives
// JSON exactly; the corrupt-then-restore proves the save — not memory — wins.
// Ninth Tooth is the authored even-index freehold pirate: always banked,
// never spliced (deaths flip rec.state only). ------------------------------
const w32tooth = ctx.world.records.find((r) => r.role === 'pirate' && r.name === 'Ninth Tooth') ?? null;
if (w32tooth) w32tooth.temper = 0.5; // TEST SETUP: deterministic stamp — the lazy roll would be Math.random-shaped
w30parkHostiles('wave32 hostiles parked (temper save)');
dockAtCurrentStation('wave32 dock freehold (temper save)'); // 'docked' fires trySave
let w32snap = null;
for (let i = 0; i < 60 * 15 && !w32snap; i++) { // the wave-30 save-wait discipline
  for (const s of ctx.ships) if (w30isHostile(s) && s.object) s.object.position.set(9000, 9000, 9000);
  tick(1, 'wave32 temper save wait');
  try {
    const s = JSON.parse(store.get('rimward-save-v1') ?? 'null');
    if ((s?.world?.recordBanks?.freehold ?? []).some((r) => r.name === 'Ninth Tooth' && r.temper === 0.5)) w32snap = s;
  } catch { /* keep waiting */ }
}
if (w32tooth) w32tooth.temper = 0.123; // corrupt in memory; the restore must win
ctx.emit('playerDestroyed', {});
tick(2, 'wave32 death consumed (temper restore)');
dispatchKey('Enter'); // recover(): restore(last save)
tick(2, 'wave32 temper restore settle');
const w32toothRestored = ctx.world.records.find((r) => r.role === 'pirate' && r.name === 'Ninth Tooth') ?? null;
const w32temperChecks = {
  toothFound: !!w32tooth,
  saveCarriesTemper: w32snap !== null, // the poll's predicate already gates the 0.5 stamp
  temperRestoredExact: w32toothRestored?.temper === 0.5,
};
console.log('wave32 temper save roundtrip:', JSON.stringify(w32temperChecks));
if (!Object.values(w32temperChecks).every(Boolean)) { console.log('WAVE32 TEMPER ROUNDTRIP FAIL'); errors++; }

// -- f. Retaliation (review P1): damage overrides the interest roll. The -----
// npc.js override at the top of updateHunt latches playerRolled/player-
// Interested and setTarget('player') when a scratched pirate and the player
// are BOTH outside the law zone — the scratch IS the roll, no dice after
// notice (Math.random is restored after each pin tick, so the latch proves
// the override, not luck). Law-zone pacifism holds: a zone-side pirate only
// routs. Leg e's death-restore ends DOCKED at freehold — undock, re-calm,
// re-pin the hull (the restore returned the save's class maxes; the telegraph
// must never kill the player mid-leg), and freeze traffic per variant. ------
if (ctx.flags.docked) undockStation();
w28calm('wave32 calm (retaliation)');
ctx.player.hullMax = 1e9; ctx.player.hull = 1e9; // the wave-30 pinned-hull discipline
ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
ctx.world.jumpGraceUntil = 0;

// -- f.a. Disinterested plain pirate, NO trader in range (the c1 geometry): -
// apathy holds until the scratch poke; next tick the override latches target
// 'player' WITHOUT a roll, and the telegraph phase stands (setTarget re-arms
// it; the demand hail freezes it open — weapons cold, we never answer). -----
w31freezeTraffic([]);
const w32f1 = w32spawn({
  id: 'wave32-f-retaliate', name: 'Wave32 Grudge', classKey: 'cutter',
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95, temper: 0,
}, [250, 0, 0]);
const w32rngF1 = Math.random;
Math.random = () => 0.999999; // pinned HIGH for exactly the roll frame (try/finally hygiene)
try {
  tick(1, 'wave32 f.a interest roll');
} finally {
  Math.random = w32rngF1;
}
for (let i = 0; i < 5; i++) tick(1, 'wave32 f.a apathy settle');
const w32f1Apathetic = w32f1.ai.target == null && w32f1.ai.playerRolled === true && w32f1.ai.playerInterested === false;
w32f1.state.screen = w32f1.state.screenMax - 1; // TEST SETUP poke (the wave-31 leg-e scratch idiom; one tick is caught before recharge)
tick(1, 'wave32 f.a retaliation latch');
const w32f1Latched = w32f1.ai.target === 'player' && w32f1.ai.playerInterested === true;
let w32f1Telegraph = w32f1.ai.phase === 'telegraph';
for (let i = 0; i < 200 && !w32f1Telegraph; i++) { // ~3.3 s — the §6.1 warning re-arms; we do NOT wait for fire
  tick(1, 'wave32 f.a telegraph watch');
  w32f1Telegraph = w32f1.ai.phase === 'telegraph';
}
const w32retaliationChecks = {
  apatheticUntilScratched: w32f1Apathetic,
  scratchLatchesPlayer: w32f1Latched,
  telegraphRearmed: w32f1Telegraph,
  playerAlive: ctx.player.hull > 0, // the pinned hull held — the leg measured the pirate, never lethality
};
console.log('wave32 retaliation:', JSON.stringify(w32retaliationChecks));
if (!Object.values(w32retaliationChecks).every(Boolean)) { console.log('WAVE32 RETALIATION FAIL'); errors++; }
w30removeShip(w32f1); // the demand card (opened on the latch frame) closes on the despawn path
tick(3, 'wave32 f.a cleanup');

// -- f.b. Law-zone variant: the same scratch on a pirate parked INSIDE the ---
// 300u zone (the p6law geometry — player at the z+400 perch, pirate z+100)
// buys NOTHING: the override's both-sides-outside guard blocks it, so no
// target develops across 60 ticks. The pin tick is hygiene symmetry — the
// roll never fires in-zone either (the law guard short-circuits first). -----
ctx.ship.object.position.set(w31st[0], w31st[1], w31st[2] + 400); // the wave-30 leg-i perch
ctx.ship.velocity.set(0, 0, 0);
ctx.input.throttle = 0;
ctx.input.fullStop = true;
w31freezeTraffic([]);
const w32f2rec = {
  id: 'wave32-f-law', name: 'Wave32 Zonebound', classKey: 'cutter',
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95, temper: 0,
};
const w32f2 = spawnLiveShip(ctx, w32f2rec, new THREE.Vector3(w31st[0], w31st[1], w31st[2] + 100)); // deep in-zone (p6law geometry)
ctx.ships.push(w32f2);
const w32rngF2 = Math.random;
Math.random = () => 0.999999; // pinned HIGH one tick (try/finally hygiene; the law guard blocks the roll outright)
try {
  tick(1, 'wave32 f.b in-zone settle');
} finally {
  Math.random = w32rngF2;
}
w32f2.state.screen = w32f2.state.screenMax - 1; // TEST SETUP poke — zone pacifism must hold
let w32f2TargetEver = null;
for (let i = 0; i < 60; i++) {
  tick(1, 'wave32 f.b zone pacifism');
  if (w32f2.ai.target != null) w32f2TargetEver = w32f2.ai.target;
}
const w32zoneChecks = {
  noRetaliationInZone: w32f2TargetEver === null && w32f2.ai.target == null,
  noLatchInZone: w32f2.ai.playerInterested === false, // the override never ran its latch
};
console.log('wave32 retaliation law zone:', JSON.stringify(w32zoneChecks));
if (!Object.values(w32zoneChecks).every(Boolean)) { console.log('WAVE32 RETALIATION ZONE FAIL'); errors++; }
w30removeShip(w32f2);
tick(3, 'wave32 f.b cleanup');

// -- f.c. Disguised Q-ship variant: a disinterested pinned MASKED qship ------
// outside the zone (player still at the z+400 perch; the qship spawns 250u
// out, z+650 — both clear of the zone). The scratch kills facade AND apathy
// in the same frame: the wave-31 scratch check reveals (record flips, mesh
// swaps in place) and the override latches the player. The once-ever
// milestone guard (spent in wave-31 leg d, restored in leg e) holds at 1. ---
w31freezeTraffic([]);
const w32f3rec = {
  id: 'wave32-f-qship', name: 'Wave32 Grudge Shroud', classKey: 'cutter',
  faction: 'redledger', role: 'pirate', resolve: 50, personality: 95, temper: 0,
  qship: true, coverClass: 'freighter', coverName: 'Wave32 Mild Mercy', coverFaction: 'freehold',
}; // NO alwaysHuntsPlayer — apathy first, then the bullet decides
const w32f3 = w32spawn(w32f3rec, [250, 0, 0]);
const w32f3objBefore = w32f3.object;
const w32rngF3 = Math.random;
Math.random = () => 0.999999; // pinned HIGH for exactly the roll frame (try/finally hygiene)
try {
  tick(1, 'wave32 f.c interest roll');
} finally {
  Math.random = w32rngF3;
}
for (let i = 0; i < 3; i++) tick(1, 'wave32 f.c masked settle');
const w32f3MaskedApathetic = !('revealed' in w32f3rec) && w32f3.ai.target == null
  && w32f3.ai.playerRolled === true && w32f3.ai.playerInterested === false;
w32f3.state.screen = w32f3.state.screenMax - 1; // TEST SETUP poke — facade and apathy die to the same bullet
tick(1, 'wave32 f.c scratch reveal+latch');
const w32qshipRetaliationChecks = {
  maskedAndApatheticPreScratch: w32f3MaskedApathetic,
  scratchReveals: w32f3rec.revealed === true,
  meshSwapped: w32f3.object !== w32f3objBefore,
  scratchLatchesPlayer: w32f3.ai.target === 'player' && w32f3.ai.playerInterested === true,
  milestoneStillOnce: ctx.world.milestones.filter((m) => m === 'qshipUnmasked').length === 1,
};
console.log('wave32 retaliation qship:', JSON.stringify(w32qshipRetaliationChecks));
if (!Object.values(w32qshipRetaliationChecks).every(Boolean)) { console.log('WAVE32 RETALIATION QSHIP FAIL'); errors++; }
w30removeShip(w32f3); // the demand card closes on the despawn path
tick(3, 'wave32 f.c cleanup');

ctx.world.jumpGraceUntil = w32grace0; // restore the section-start grace state (long expired; the death-restore already rewound it — this pins the intent)

// ---- Wave 33: Bloom station v2 — the glassy teal + amber rebuild -----------
// The wave-33 contract (src/systems/station.js buildBeautifulStation): five
// translucent teal veined petal-arms, each carrying a visible circular
// landing pad ('beautiful-pad', userData.pad = arm index) and a warm golden
// hearth core ('beautiful-hearth') INSIDE the arm's flex group (the
// tagSway axis-'z' holder, so pads ride the sway); glowing teal node orbs
// ('beautiful-node') at the five arm roots; a 19-petal layered bud crown
// (7 outer + 7 inner + 5 innermost) on the ringGroup; and a transparent
// skin material shared by the body bell and all five arms (still
// emissiveMap-pulsed via the shared bloomVeinTexture). The run is
// freehold/undocked off wave-32 with the hull still pinned at 1e9 — the
// bt_cradle pirates can't kill the flight out. The freehold negative
// control (wave-27 noBeautifulStation) is untouched upstream; nothing here
// duplicates or weakens it. ----------------------------------------------------
travelTo('bt_cradle', 'wave33 cradle leg');
const w33station = findByName('beautiful-station')[0] ?? null;
const w33named = (name) => {
  const found = [];
  if (w33station) w33station.traverse((o) => { if (o.name === name) found.push(o); });
  return found;
};
const w33pads = w33named('beautiful-pad');
const w33hearths = w33named('beautiful-hearth');
const w33nodes = w33named('beautiful-node');
const w33padSet = new Set(w33pads.map((p) => p.userData.pad));
// Every pad must sit INSIDE its arm's flex group: some ancestor between the
// pad and the station root carries the axis-'z' sway tag (the inner flex;
// the outer holder sways on axis 'x' — the wave-27 Lissajous pair).
const w33padsRideFlex = w33pads.length > 0 && w33pads.every((p) => {
  for (let a = p.parent; a && a !== w33station; a = a.parent) {
    if (a.userData.sway && a.userData.sway.axis === 'z') return true;
  }
  return false;
});
// ringGroup identification: the harness only has the scene group (the record
// is station.js-internal), so find the crown as the station's DIRECT child
// group whose subtree holds the petal meshes and NO landing pad — the arm
// holders are ruled out by the pads they carry, the body bell is a bare
// Mesh. Discriminator for the petals themselves: makePetalGeometry IS
// indexed, and the per-build petal MeshPhysicalMaterial is the only
// transparent DoubleSide emissiveMap material in the crown — so count Mesh
// descendants with geometry.index !== null && material.transparent === true.
const w33meshKids = (root) => {
  const out = [];
  root.traverse((o) => { if (o.isMesh && o.material && !Array.isArray(o.material)) out.push(o); });
  return out;
};
const w33isPetalMesh = (o) => o.geometry && o.geometry.index !== null
  && o.material.transparent === true && o.material.side === THREE.DoubleSide;
let w33ringGroup = null;
let w33crownPetals = 0;
if (w33station) {
  for (const child of w33station.children) {
    if (!child.isGroup) continue;
    let hasPad = false;
    child.traverse((o) => { if (o.name === 'beautiful-pad') hasPad = true; });
    if (hasPad) continue; // an arm holder, not the crown
    const petals = w33meshKids(child).filter(w33isPetalMesh).length;
    if (petals > w33crownPetals) { w33crownPetals = petals; w33ringGroup = child; }
  }
}
// Skin: one shared MeshPhysicalMaterial (transparent teal, vein emissiveMap)
// across the body bell + 5 arms — at least 6 meshes on the SAME instance.
// Discriminator: side !== DoubleSide — the crown's petalMat is ALSO a
// transparent emissiveMap MeshPhysicalMaterial but DoubleSide (19 meshes),
// so without the side filter the count passes vacuously via the crown even
// if the skin instance were split per-mesh (wave-33 reviews MEDIUM/P3).
const w33skinCounts = new Map();
if (w33station) {
  for (const o of w33meshKids(w33station)) {
    const m = o.material;
    if (m.transparent === true && m.emissiveMap != null && m.side !== THREE.DoubleSide) w33skinCounts.set(m, (w33skinCounts.get(m) ?? 0) + 1);
  }
}
const w33skinShared = [...w33skinCounts.values()].some((n) => n >= 6);
// Hearth warmth: every hearth core glows amber/gold — color r > g > b.
const w33hearthsWarm = w33hearths.length > 0 && w33hearths.every((h) => {
  const c = h.material && !Array.isArray(h.material) ? h.material.color : null;
  return !!c && c.r > c.g && c.g > c.b;
});
const w33checks = {
  arrivedAtCradle: ctx.world.currentSystem === 'bt_cradle',
  stationLive: !!w33station && findByName('beautiful-station').length === 1,
  fivePads: w33pads.length === 5,
  padIndicesExact: w33padSet.size === 5 && [0, 1, 2, 3, 4].every((i) => w33padSet.has(i)),
  fiveHearths: w33hearths.length === 5,
  fiveNodes: w33nodes.length === 5,
  padsRideFlexSway: w33padsRideFlex,
  crownFound: !!w33ringGroup,
  crownNineteenPetals: w33crownPetals === 19,
  translucentSharedSkin: w33skinShared,
  hearthsGlowWarm: w33hearthsWarm,
};
console.log('wave33 bloom v2 structure:', JSON.stringify(w33checks));
if (!Object.values(w33checks).every(Boolean)) { console.log('WAVE33 BLOOM V2 FAIL'); errors++; }

// Home — the wave-27 discipline: the run ends where the harness began.
travelTo('freehold', 'wave33 home leg');

// ---- Wave 34: review debt — scanner heal, temper guard, hearth fit -------
// The wave-34 contract: three standing review items closed in src.
// 1. save.js sanitizeRestored heals a tampered ctx.world.scanner to 0 beside
//    the wave-30 concealedMounts coercion (`if (![0, 1, 2].includes(...))`)
//    — a hand-edited save (scanner 99 or '2') no longer restores with the
//    free Mk II Wolfeye pierce (wave-31 security LOW).
// 2. npc.js playerInterestChance replaces the lazy `??=` temper stamp with a
//    Number.isFinite guard — a tampered non-numeric record.temper re-rolls
//    instead of NaN-ing the interest chance (wave-32 security LOW).
// 3. station.js buildBeautifulStation shortens the hearth core scale.z 6.3 →
//    5.4. The wave-33 review flagged a ~0.41u tip breach near spine t≈0.72
//    (droop slope 0.47 vs the hearth's fixed 0.27 pitch); wave-34
//    re-derivation shows 6.3 was in fact contained (+0.434u worst margin —
//    the breach figure was the margin, sign-flipped) and 5.4 raises the
//    worst margin to +0.782u. Leg c pins the envelope so any future
//    length/droop change trips it.
//    Arm spine (makeStarfishArmGeometry, length 20, rootRadius 3.4, droop
//    6.5): center C(t) = (2.4·sin πt, −6.5·t², 20·t), skin radius R(t) =
//    (3.4−3t)(1+0.15·sin πt).
// Run state: freehold, undocked, hull still pinned 1e9 off wave-33's home
// leg. Leg a's death-restores return the save's class maxes, so leg c
// re-pins the hull before the cradle flight (the wave-32 leg-f preamble
// discipline). ------------------------------------------------------------

// -- a. Scanner restore heal: the REAL dock autosave → death-restore path --
// (the wave-31 leg-f idiom). Each case pokes ctx.world.scanner, docks (the
// 'docked' event fires trySave), waits for the save carrying the poked value
// (the wave-30 save-wait discipline), dies, and recovers. Tampered values
// (99, '2', null — the hand-edited shapes; a NaN save lands as null through
// JSON) must heal to EXACTLY 0; legit 0/1/2 ride the roundtrip unchanged (a
// quick re-assert — the wave-31 scanner roundtrip leg is the deep coverage).
// A per-case sentinel credits value rides each poke and joins the poll
// predicate: scanner 0/1/2 all appear in earlier autosaves of this run, so
// the value alone cannot prove the matched save is THIS dock's — the
// sentinel can (and post-restore it proves the restore read our save, not a
// stale one). ------------------------------------------------------------
const w34scannerCases = [
  { poke: 99, expect: 0 }, // tampered: off the Wolfeye ladder
  { poke: '2', expect: 0 }, // tampered: right rung, wrong type
  { poke: null, expect: 0 }, // tampered: JSON null (snapshot keeps it — null !== undefined)
  { poke: 0, expect: 0 }, // legit ladder rungs survive unchanged
  { poke: 1, expect: 1 },
  { poke: 2, expect: 2 },
];
const w34scannerResults = [];
for (let ci = 0; ci < w34scannerCases.length; ci++) {
  const { poke: w34poke, expect: w34expect } = w34scannerCases[ci];
  const w34sentinel = 61231 + ci * 7; // unique per case, provably unlike any earlier autosave
  if (ctx.flags.docked) undockStation(); // a death-restore ends docked (the wave-32 leg-e note) — undock for the next real dock
  ctx.world.scanner = w34poke; // TEST SETUP tamper (the wave-9 scanner poke pattern)
  ctx.world.credits = w34sentinel; // TEST SETUP sentinel (the wave-30 leg-d credits-drift idiom)
  w30parkHostiles('wave34 hostiles parked (scanner save)');
  dockAtCurrentStation('wave34 dock freehold (scanner heal)'); // 'docked' fires trySave
  let w34snap = null;
  for (let i = 0; i < 60 * 15 && !w34snap; i++) { // the wave-30 save-wait discipline
    for (const s of ctx.ships) if (w30isHostile(s) && s.object) s.object.position.set(9000, 9000, 9000);
    tick(1, 'wave34 scanner save wait');
    try {
      const s = JSON.parse(store.get('rimward-save-v1') ?? 'null');
      if (s?.world && 'scanner' in s.world && s.world.scanner === w34poke && s.world.credits === w34sentinel) w34snap = s;
    } catch { /* keep waiting */ }
  }
  // Die + recover (the wave-26 restore path): the tampered save loses to the sanitizer.
  ctx.emit('playerDestroyed', {});
  tick(2, 'wave34 death consumed (scanner heal)');
  dispatchKey('Enter'); // recover(): restore(last save)
  tick(2, 'wave34 scanner restore settle');
  w34scannerResults.push({
    poke: String(w34poke),
    saveCarriesPoke: w34snap !== null, // the poll's predicate already gates value + sentinel
    scannerHealed: ctx.world.scanner === w34expect,
    restoreReadOurSave: ctx.world.credits === w34sentinel,
  });
}
const w34scannerOk = w34scannerResults.every((r) => r.saveCarriesPoke && r.scannerHealed && r.restoreReadOurSave);
console.log('wave34 scanner restore heal:', JSON.stringify(w34scannerResults));
if (!w34scannerOk) { console.log('WAVE34 SCANNER HEAL FAIL'); errors++; }

// -- b. Temper finite re-roll: pure calls, no ticks (the wave-32 leg-a -----
// discipline), reusing the wave-32 scoped import. Math.random is pinned to a
// deterministic constant AND call-counted inside one save/try/finally/
// restore window (the wave-32 pin discipline): a tampered non-numeric temper
// ('rich') must re-roll to a FINITE temper through exactly one Math.random
// (the guard's lazy roll, nothing else), the returned chance stays finite
// and clamped [0.05, 0.9] (never NaN — the pre-wave-34 `??=` failure), the
// re-roll is sticky across a second call (zero further rolls), and a legit
// finite temper is neither re-rolled NOR allowed to consume Math.random at
// all — the guard must not fire on the healthy path. ----------------------
const w34bBad = { role: 'pirate', temper: 'rich' }; // the hand-edited record
const w34bGood = { role: 'pirate', temper: 0.5 };
const w34rngB = Math.random;
let w34rngCalls = 0;
Math.random = () => { w34rngCalls++; return 0.42; }; // pinned deterministic + counted (try/finally: a mid-window throw must not leave the suite pinned)
let w34temperChecks = null;
try {
  const w34bP1 = w32interestChance(ctx, w34bBad);
  const w34bT1 = w34bBad.temper; // 0.42 — the pinned re-roll
  const w34callsReroll = w34rngCalls;
  const w34bP2 = w32interestChance(ctx, w34bBad); // the sticky read
  const w34callsSticky = w34rngCalls;
  const w34bG1 = w32interestChance(ctx, w34bGood);
  const w34bG2 = w32interestChance(ctx, w34bGood);
  const w34callsFinite = w34rngCalls;
  w34temperChecks = {
    rerollFinite: Number.isFinite(w34bT1) && w34bT1 >= 0 && w34bT1 <= 1,
    rerollIsOneRandomCall: w34callsReroll === 1, // the guard's lazy roll, nothing else
    chanceFinite: Number.isFinite(w34bP1) && Number.isFinite(w34bP2), // never NaN
    chanceClamped: w34bP1 >= 0.05 && w34bP1 <= 0.9,
    rerollSticky: w34bBad.temper === w34bT1 && w34bP2 === w34bP1 && w34callsSticky === w34callsReroll,
    finiteTemperByteSticky: w34bGood.temper === 0.5 && w34bG2 === w34bG1, // the guard never touches a healthy temper
    finiteTemperZeroRandomCalls: w34callsFinite === w34callsSticky, // NO Math.random beyond the one lazy re-roll all leg
  };
} finally {
  Math.random = w34rngB;
}
console.log('wave34 temper finite reroll:', JSON.stringify(w34temperChecks));
if (!w34temperChecks || !Object.values(w34temperChecks).every(Boolean)) { console.log('WAVE34 TEMPER REROLL FAIL'); errors++; }

// -- c. Hearth containment, analytic against the LIVE mesh: travel to ------
// bt_cradle (the wave-33 travel idiom), then for EACH 'beautiful-hearth'
// mesh read the ACTUAL fields (scale, position, rotation.x — nothing
// hardcoded) and verify the ellipsoid never leaves the arm skin. Ellipsoid
// axis d = (0, −sin(rotation.x), cos(rotation.x)), half-length L = scale.z;
// at axial offset s ∈ [−L, L] the surface point H(s) = position + s·d
// carries cross radius r(s) = scale.x·√(1−(s/L)²) (scale.x === scale.y, so
// the section is circular). Mapped to spine parameter t(s) = H(s).z / 20,
// containment requires dist(H(s), C(t(s))) + r(s) ≤ R(t(s)) − 0.5 — a 0.5u
// margin, the triangle-inequality bound over the whole circular section.
// scale.z ≤ 5.4 is the structural pin so a future length bump trips this
// leg outright. The hearth sits in the arm's flex group like the arm mesh
// itself, so flex-local space IS the spine frame (the wave-33 placement
// comment: hearth/pad/node placements are read straight off that curve). --
if (ctx.flags.docked) undockStation(); // leg a's last restore ends docked
ctx.player.hullMax = 1e9; ctx.player.hull = 1e9; // the wave-30 pinned-hull discipline
ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
travelTo('bt_cradle', 'wave34 cradle leg');
const w34station = findByName('beautiful-station')[0] ?? null;
const w34hearths = [];
if (w34station) w34station.traverse((o) => { if (o.name === 'beautiful-hearth') w34hearths.push(o); });
const w34spineC = (t) => [2.4 * Math.sin(Math.PI * t), -6.5 * t * t, 20 * t];
const w34spineR = (t) => (3.4 - 3 * t) * (1 + 0.15 * Math.sin(Math.PI * t));
let w34worstMargin = Infinity; // min over every hearth and sample of R(t) − dist − r(s)
for (const h of w34hearths) {
  const p = h.position; // LIVE mesh fields — no copied constants
  const sx = h.scale.x;
  const L = h.scale.z;
  const rx = h.rotation.x;
  const d = [0, -Math.sin(rx), Math.cos(rx)];
  const w34samples = 2000; // dense across [−L, L]
  for (let i = 0; i <= w34samples; i++) {
    const s = -L + (2 * L * i) / w34samples;
    const hx = p.x + s * d[0];
    const hy = p.y + s * d[1];
    const hz = p.z + s * d[2];
    const t = hz / 20;
    const c = w34spineC(t);
    const dist = Math.hypot(hx - c[0], hy - c[1], hz - c[2]);
    const r = sx * Math.sqrt(Math.max(0, 1 - (s / L) * (s / L)));
    const margin = w34spineR(t) - dist - r;
    if (margin < w34worstMargin) w34worstMargin = margin;
  }
}
const w34hearthChecks = {
  arrivedAtCradle: ctx.world.currentSystem === 'bt_cradle',
  fiveHearths: w34hearths.length === 5,
  scaleZPinned: w34hearths.length > 0 && w34hearths.every((h) => h.scale.z <= 5.4), // the structural pin
  containedHalfUnit: w34worstMargin >= 0.5, // every sample inside the skin with 0.5u to spare
};
console.log('wave34 hearth containment:', JSON.stringify(w34hearthChecks), `worstMargin=${Number.isFinite(w34worstMargin) ? w34worstMargin.toFixed(3) : 'n/a'}`);
if (!Object.values(w34hearthChecks).every(Boolean)) { console.log('WAVE34 HEARTH CONTAINMENT FAIL'); errors++; }

// Home again — the wave-27 discipline: the run ends where the harness began.
travelTo('freehold', 'wave34 home leg');

// ---- Wave 35a: review debt — haul delivery binds the NAMED destination ----
// Wave 35 closes the wave-26 review MEDIUM: a payQuoted-stamped haul chain
// paid at ANY non-origin dock. station.js now gates delivery on
// otherSystemId(origin) — the same primary-gate destination the board UI and
// the accept-time quote name (the ferry precedent: only the named far
// station pays), so a side-gate arrival in a multi-gate origin no longer
// pays. The gates-less fallback (otherSystemId returns the origin itself) is
// guarded by dest === origin: such a job stays undeliverable, never pays at
// origin. Old saves need no migration — originSystem + payQuoted were
// stamped at accept (wave 26); the gate recomputes the same destination at
// delivery time.
// -- a. lane pick + real accept at the origin dock --------------------------
// The triple is picked off the live graph (the wave-24 d / wave-26 d ruling):
// origin → primary-gate destination → a third hop out of the destination
// that is neither origin nor dest. freehold→veridian→redmarch is PREFERRED
// and stands unless any leg is occupied by the wave-26 g leftover — the
// ferry contract that leg left OPEN (its destSystem reads freehold or
// redmarch by the wave-26 lane pick, and an open ferry pays at ITS named
// dock the moment 4 provisions ride the hold). The picker keeps that dock
// out of ALL THREE legs: at origin it would complete during the post-buy
// settle and eat 4 of the 5 bought provisions; at the destination or third
// hop it would stir the credit/provisions deltas (wave-35 review P3). Then
// the picker falls back to the first clean triple in SYSTEMS order; the
// chosen lane rides the log line.
const w35aOpenFerry = ctx.world.jobs.find((j) => j.id === 'ferry-consignment' && j.state === 'accepted') ?? null;
const w35aFerryDest = w35aOpenFerry?.destSystem ?? null;
const w35aPickTriple = (o) => {
  if (o === w35aFerryDest) return null; // the leftover ferry would complete at the accept dock and eat the load
  const d = ctx.systems?.[o]?.gates?.[0]?.to;
  if (!d || d === o || d === w35aFerryDest || !ctx.systems?.[d]) return null;
  const t = (ctx.systems[d].gates ?? []).map((g) => g.to)
    .find((id) => id !== o && id !== d && id !== w35aFerryDest && !!ctx.systems?.[id]);
  return t ? { o, d, t } : null;
};
const w35aTriple = w35aPickTriple('freehold') ?? Object.keys(SYSTEMS).map(w35aPickTriple).find(Boolean) ?? null;
const w35aOrigin = w35aTriple?.o ?? 'freehold';
const w35aDest = w35aTriple?.d ?? null;
const w35aThird = w35aTriple?.t ?? null;
travelTo(w35aOrigin, 'wave35a origin leg'); // no-op when the freehold triple stands (the run is home)
dockAtCurrentStation(`dock ${w35aOrigin} (wave35a accept)`);
const w35aHaulJob = ctx.world.jobs.find((j) => j.id === 'haul-provisions') ?? null;
const w35aNeed = w35aHaulJob?.need ?? 5; // HAUL_UNITS
// TEST SETUP (self-restoring): the galaxy carries ONE haul contract; wave 26
// ran it to done on a generated lane, so re-offer it for this gate-binding
// check — the real accept/deliver cycle below takes it back to done.
if (w35aHaulJob) { w35aHaulJob.state = 'offered'; w35aHaulJob.originSystem = null; w35aHaulJob.originPrice = null; delete w35aHaulJob.payQuoted; }
// Free the hold for the load through the REAL market path (the wave-26 d
// sell discipline): whatever the recovery cycles left aboard sells down
// until the 5-unit load genuinely fits.
dispatchKey('Digit1'); // market (DOCK_KEY_SERVICES[0])
let w35aSellGuard = 60;
while (ctx.cargoCapacity - ctx.cargo.reduce((n, c) => n + c.units, 0) < w35aNeed && w35aSellGuard-- > 0) {
  const w35aHeld = ctx.cargo.find((c) => c.units > 0 && COMMODITIES[c.commodity]?.legal);
  if (!w35aHeld) break;
  const w35aSellBtn = marketTradeButton(COMMODITIES[w35aHeld.commodity].name, '−1');
  if (!w35aSellBtn) break;
  w35aSellBtn.click(); // real path: tryTrade(commodity, 1, false) — re-found per click (each trade re-renders)
}
dispatchKey('Escape'); // market → services
dispatchKey('Digit2'); // jobs board
const w35aAcceptBtn = w26CardAcceptButton('Haul provisions'); // the wave-26 strict card-scoped accept
w35aAcceptBtn?.click(); // real accept: stamps originSystem/originPrice + payQuoted off the DESTINATION chain
const w35aPayQuoted = w35aHaulJob?.payQuoted;
// otherSystemId equivalent read from ctx.systems — the destination the board
// UI and the quote named must equal the picker's primary-gate destination.
const w35aStampedDest = ctx.systems?.[w35aHaulJob?.originSystem]?.gates?.[0]?.to ?? w35aHaulJob?.originSystem;
const w35aAcceptChecks = {
  tripleFound: !!w35aDest && !!w35aThird,
  dockedAtOrigin: ctx.flags.docked === true && ctx.world.currentSystem === w35aOrigin,
  jobFound: !!w35aHaulJob,
  holdRoomForLoad: ctx.cargoCapacity - ctx.cargo.reduce((n, c) => n + c.units, 0) >= w35aNeed,
  acceptButtonFound: !!w35aAcceptBtn,
  jobAccepted: w35aHaulJob?.state === 'accepted',
  originStamped: w35aHaulJob?.originSystem === w35aOrigin,
  payQuotedStamped: Number.isFinite(w35aPayQuoted),
  quoteNamesSameDest: w35aStampedDest === w35aDest,
  ferryClearsTriple: w35aFerryDest !== w35aOrigin && w35aFerryDest !== w35aDest && w35aFerryDest !== w35aThird,
};
console.log('wave35a accept:', JSON.stringify(w35aAcceptChecks), `lane=${w35aOrigin}->${w35aDest}->${w35aThird} quoted=${w35aPayQuoted} ferryDest=${w35aFerryDest}`);
if (!Object.values(w35aAcceptChecks).every(Boolean)) { console.log('WAVE35 HAUL GATE ACCEPT FAIL'); errors++; }

// Buy the load through the real market (the wave-26 d cell/click path,
// re-found per click — each trade re-renders), then give the dock a full
// delivery-throttle window (0.5s ≈ 30 frames) to PROVE the haul stays open
// at its origin: the picker's origin guard keeps the leftover ferry's dock
// out of the lane, so nothing else can pay here and the baselines are quiet.
dispatchKey('Escape'); // jobs → services
dispatchKey('Digit1'); // market (DOCK_KEY_SERVICES[0])
let w35aBought = 0;
for (let i = 0; i < w35aNeed; i++) {
  const w35aProvBeforeClick = holdCount('provisions');
  const b = marketTradeButton('Provisions', '+1');
  if (!b) break;
  b.click(); // real path: tryTrade('provisions', 1, true)
  if (holdCount('provisions') === w35aProvBeforeClick + 1) w35aBought++; // count units actually aboard, not clicks
}
dispatchKey('Escape'); // market → services
tick(40, 'wave35a settle (delivery-throttle window)');
const w35aCreditsAtDeparture = ctx.world.credits;
const w35aProvAtDeparture = holdCount('provisions');
const w35aLoadChecks = {
  boughtTheLoad: w35aBought === w35aNeed,
  jobUnpaidAtOriginDock: w35aHaulJob?.state === 'accepted',
};
console.log('wave35a load:', JSON.stringify(w35aLoadChecks), `bought=${w35aBought} prov=${w35aProvAtDeparture}`);
if (!Object.values(w35aLoadChecks).every(Boolean)) { console.log('WAVE35 HAUL GATE LOAD FAIL'); errors++; }

// -- b. negative control: dock PAST the named destination — no payout -------
// The route transits the destination WITHOUT docking (delivery needs the
// dock), then berths one hop beyond it. Under the wave-26 MEDIUM this dock
// paid; under wave 35 the job must ride on, untouched.
undockStation();
travelTo(w35aThird, 'wave35a overshoot leg');
dockAtCurrentStation(`dock ${w35aThird} (wave35a overshoot)`);
const w35aThirdLines = [];
for (let i = 0; i < 90; i++) { // the wave-26 delivery-collection window
  tick(1, 'wave35a overshoot tick');
  for (const e of ctx.lastEvents) if (e.type === 'commLine') w35aThirdLines.push(e.text);
}
const w35aThirdChecks = {
  thirdIsNeitherEnd: w35aThird !== w35aOrigin && w35aThird !== w35aDest,
  dockedAtThird: ctx.flags.docked === true && ctx.world.currentSystem === w35aThird,
  jobStillAccepted: w35aHaulJob?.state === 'accepted',
  noDeliveryLine: !w35aThirdLines.some((t) => t.startsWith('Provisions delivered')),
  creditsUnchangedByJob: ctx.world.credits === w35aCreditsAtDeparture,
  provisionsIntact: holdCount('provisions') === w35aProvAtDeparture,
};
console.log('wave35a overshoot:', JSON.stringify(w35aThirdChecks), `third=${w35aThird}`);
if (!Object.values(w35aThirdChecks).every(Boolean)) { console.log('WAVE35 HAUL GATE OVERSHOOT FAIL'); errors++; }

// -- c. the named destination pays exactly the stamped quote ----------------
undockStation();
travelTo(w35aDest, 'wave35a delivery leg');
const w35aCreditsBeforeDest = ctx.world.credits;
dockAtCurrentStation(`dock ${w35aDest} (wave35a delivery)`);
const w35aDestLines = [];
for (let i = 0; i < 90; i++) {
  tick(1, 'wave35a delivery tick');
  for (const e of ctx.lastEvents) if (e.type === 'commLine') w35aDestLines.push(e.text);
}
const w35aPaidLine = w35aDestLines.find((t) => t.startsWith('Provisions delivered')) ?? null;
const w35aPaid = Number((w35aPaidLine?.match(/— (\d+) UU/) ?? [])[1]);
const w35aDeliveryChecks = {
  dockedAtNamedDest: ctx.flags.docked === true && ctx.world.currentSystem === w35aDest,
  paidExactlyQuoted: w35aPaid === w35aPayQuoted && Number.isFinite(w35aPaid),
  creditsDeltaIsQuote: ctx.world.credits - w35aCreditsBeforeDest === w35aPayQuoted,
  provisionsRemoved: holdCount('provisions') === w35aProvAtDeparture - w35aNeed,
  jobDone: w35aHaulJob?.state === 'done',
};
console.log('wave35a delivery:', JSON.stringify(w35aDeliveryChecks), `paid=${w35aPaid} quoted=${w35aPayQuoted}`);
if (!Object.values(w35aDeliveryChecks).every(Boolean)) { console.log('WAVE35 HAUL GATE DELIVERY FAIL'); errors++; }

undockStation();
// Home again — the wave-27 discipline: the run ends where the harness began.
travelTo('freehold', 'wave35a home leg');

// ---- Wave 35b: ship-scoped hailClosed (wave-30 code-review LOW) -----------
// The wave-30 review's prescribed fix, now live in src: 'hailClosed' was
// emitted with an empty payload, so in the ~1-frame card-steal window a
// void-on-hit from pirate B could close pirate A's open bargaining card, and
// npc.js's hold-release scan cleared EVERY ship's outcome-stamped hold on
// any hailClosed. hail.js's resolveIntent and npc.js's void-on-hit now both
// emit { ship }, hail.js's update listener closes the open card only when
// the event names open.ship (unscoped payloads remain a legacy backstop),
// and the npc.js release loop gates on the same scope. Four legs, all on
// real demand hails (the w30spawnPirate / w30demandEvs / w30hailDisplay
// idioms) with direct ctx.emit close events:
//   a. a close naming ship B leaves ship A's open card open (the old bug)
//   b. a close naming A closes A's card
//   c. a payload-less close still closes the card (the backstop)
//   d. a close naming B releases ONLY B's outcome-stamped demand hold
// Run state: freehold/undocked off the wave-35a home leg; hostiles parked,
// the wave-30 pinned-hull + cargo demand setup, and the jump-grace wait
// (the wave-30 discipline — the demand guard requires now >= jumpGraceUntil
// and the home-leg travel re-arms it).
if (ctx.flags.docked) undockStation();
w28calm('wave35b calm (hail scope setup)');
w30parkHostiles('wave35b hostiles parked');
ctx.player.hullMax = 1e9; ctx.player.hull = 1e9;
ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
ctx.cargo.length = 0;
ctx.cargo.push({ commodity: 'provisions', units: 10 }); // cargo aboard: the demand rides its value
for (let i = 0; i < 300 && ctx.world.time < (ctx.world.jumpGraceUntil ?? 0); i++) tick(1, 'wave35b jump grace wait');

// -- a. cross-scoped close: pirate A's demand card is open; a hailClosed ---
// naming a DIFFERENT ship B must NOT close it (pre-wave-35 the empty
// payload stole the card in exactly this window). B is spawned then parked
// at the 9000-corner (TEST SETUP, the w30parkHostiles corner: it never
// closes in, so it can never open its own demand hail and steal the card
// for real). tick(3) covers both reads: hail.js sees the emit in ctx.events
// next frame; npc.js's release scan reads the rotated lastEvents a frame
// later. ---------------------------------------------------------------
const w35bA = w30spawnPirate('scope-a', 95, [250, 0, 0]); // 250u: inside TARGET_RANGE, outside the bubble edge
const w35bAEvs = w30demandEvs(w35bA, 'wave35b A demand');
const w35bAOpen = w35bAEvs.some((e) => e.type === 'hailOpened' && e.ship === w35bA)
  && w35bA.ai.demanding === true && w30hailDisplay() === 'block';
const w35bB = w30spawnPirate('scope-b', 95, [0, 0, 0]);
w35bB.object.position.set(9000, 9000, 9000); // TEST SETUP: parked out of the fight
tick(2, 'wave35b B parked');
ctx.emit('hailClosed', { ship: w35bB }); // the wave-35 shape, naming B
tick(3, 'wave35b scoped close (B)');
const w35bCrossChecks = {
  cardWasOpen: w35bAOpen,
  cardStillOpen: w30hailDisplay() === 'block', // the fix: B's close no longer steals A's card
  holdStands: w35bA.ai.demanding === true,
};
console.log('wave35b hailClosed cross-scope:', JSON.stringify(w35bCrossChecks));
if (!Object.values(w35bCrossChecks).every(Boolean)) { console.log('WAVE35 HAILCLOSED CROSS-SCOPE FAIL'); errors++; }

// -- b. own-ship close: the same event naming A closes A's card. ----------
ctx.emit('hailClosed', { ship: w35bA });
tick(3, 'wave35b scoped close (A)');
const w35bOwnChecks = {
  cardClosed: w30hailDisplay() === 'none',
};
console.log('wave35b hailClosed own-scope:', JSON.stringify(w35bOwnChecks));
if (!Object.values(w35bOwnChecks).every(Boolean)) { console.log('WAVE35 HAILCLOSED OWN-SCOPE FAIL'); errors++; }
w30removeShip(w35bA);
w30removeShip(w35bB);
tick(5, 'wave35b a/b cleanup');

// -- c. unscoped backstop: a legacy payload-less hailClosed still closes ---
// an open card (both listeners keep the !ship branch). A fresh REAL demand
// hail reopens the card first. ------------------------------------------
const w35bC = w30spawnPirate('backstop', 95, [250, 0, 0]);
w30demandEvs(w35bC, 'wave35b C demand');
const w35bCOpen = w35bC.ai.demanding === true && w30hailDisplay() === 'block';
ctx.emit('hailClosed', {}); // the pre-wave-35 shape
tick(3, 'wave35b unscoped close');
const w35bBackstopChecks = {
  cardWasOpen: w35bCOpen,
  cardClosed: w30hailDisplay() === 'none',
};
console.log('wave35b hailClosed backstop:', JSON.stringify(w35bBackstopChecks));
if (!Object.values(w35bBackstopChecks).every(Boolean)) { console.log('WAVE35 HAILCLOSED BACKSTOP FAIL'); errors++; }
w30removeShip(w35bC);
tick(5, 'wave35b c cleanup');

// -- d. hold scoping: two demanding pirates, both holds OUTCOME-STAMPED ----
// (the release loop's gate). A's hold is a real open demand card with the
// stamp poked on (TEST SETUP: hail.js stamps ai.demandOutcome on resolution;
// poking it beside a still-standing hold reproduces the loop's target shape
// without resolving the card away). B is parked at 1000u with the same
// stamped-hold shape poked on (demandPeaceAt pinned so the void-on-hit
// upkeep can't pre-clear the hold). The 1000u park is deliberate: traffic.js
// despawns live ships beyond U.DEINSTANTIATE_RANGE (1400 — the 9000-corner
// w30parkHostiles uses is a despawn, fine for parking hostiles but fatal
// here: the release scan iterates ctx.ships only, so a despawned B could
// never be released), while U.TARGET_RANGE (600) gates the demand hail, so
// 1000u keeps B in-bubble yet never opening its own hail. A B-scoped
// hailClosed must release ONLY B's hold — pre-wave-35 the unscoped scan
// cleared both. ----------------------------------------------------------
const w35bD1 = w30spawnPirate('hold-a', 95, [250, 0, 0]);
w30demandEvs(w35bD1, 'wave35b hold A demand');
const w35bD1Open = w35bD1.ai.demanding === true && w30hailDisplay() === 'block';
w35bD1.ai.demandOutcome = 'paid'; // TEST SETUP: the outcome-stamped hold shape (see header)
const w35bD2 = w30spawnPirate('hold-b', 95, [0, 0, 0]);
// TEST SETUP: parked in-bubble at 1000u (see header) — close enough that
// traffic keeps it live, far enough that its own demand hail can never open.
w35bD2.object.position.set(
  ctx.ship.object.position.x + 1000,
  ctx.ship.object.position.y,
  ctx.ship.object.position.z,
);
w35bD2.ai.demanding = true; // TEST SETUP: a second outcome-stamped hold with no card
w35bD2.ai.demandOutcome = 'paid';
w35bD2.ai.demandPeaceAt = ctx.world.time;
ctx.emit('hailClosed', { ship: w35bD2 });
tick(3, 'wave35b hold-scope close (B)');
const w35bHoldChecks = {
  cardWasOpen: w35bD1Open,
  holdBReleased: w35bD2.ai.demanding === false,
  holdAStands: w35bD1.ai.demanding === true,
  cardStillOpen: w30hailDisplay() === 'block',
};
console.log('wave35b hailClosed hold scope:', JSON.stringify(w35bHoldChecks));
if (!Object.values(w35bHoldChecks).every(Boolean)) { console.log('WAVE35 HAILCLOSED HOLD SCOPE FAIL'); errors++; }
w30removeShip(w35bD1);
w30removeShip(w35bD2);
tick(5, 'wave35b d cleanup');

// No travel this section — the run never left freehold off the wave-35a
// home leg, and the harness ends here.

// ---- Wave 36: bloom lighting rebalance — the sun shapes the bloom --------
// Wave 36 closes the two wave-33 review P3s: the bloom was effectively
// self-lit — the station's fleshLight (PointLight 300, decay 2) delivered
// ~1.2-13x the irradiance of the flat decay-0 system sun (intensity 2.5, no
// distance falloff) at skin distances (3-10u), and the emissive vein lattice
// (pulse base 0.6) visually dominated the 0.58-opacity skin fill past
// ~150u. The fix is station-local to buildBeautifulStation (src/systems/
// station.js): fleshLight 300 -> 60 (distance 140, decay 2, color 0x7fe0d0
// unchanged), skin opacity 0.58 -> 0.72, roughness 0.3 -> 0.55, vein pulse
// base 0.6 -> 0.42 / amp 0.18 -> 0.10 (hz stays 0.07). Every check below
// discriminates against the PRE-wave-36 source by reasoning: opacity
// 0.58 !== 0.72, roughness 0.3 !== 0.55, pulse base 0.6 !== 0.42 and amp
// 0.18 !== 0.10, flesh intensity 300 !== 60, and the leg-b irradiance
// ratios (10.38 at 3.4u and 4.8 at 5u pre-wave-36) exceed both bounds — so
// both legs FAIL on the old code. All values are read off LIVE scene
// objects; nothing is imported from station.js. The harness arrives here
// freehold/undocked with hostiles parked (wave-35b end state).
// -- a. Lighting contract, real travel (the wave-33/wave-34 idiom) --------
// Hull re-pin before the bt_cradle leg — the cradle pirates can't kill the
// flight out — plus the wave-34 undock guard.
if (ctx.flags.docked) undockStation();
ctx.player.hullMax = 1e9; ctx.player.hull = 1e9; // the wave-30 pinned-hull discipline
ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
travelTo('bt_cradle', 'wave36 cradle leg');
const w36station = findByName('beautiful-station')[0] ?? null;
// Skin: the SAME discriminator as wave-33 — transparent && emissiveMap &&
// side !== DoubleSide (the crown's petalMat is DoubleSide and stays out) —
// counted per material INSTANCE. Exactly one instance may qualify, shared
// by >= 6 meshes (body bell + 5 arms); none or an ambiguous split fails.
const w36skinCounts = new Map();
if (w36station) {
  w36station.traverse((o) => {
    if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
    const m = o.material;
    if (m.transparent === true && m.emissiveMap != null && m.side !== THREE.DoubleSide) w36skinCounts.set(m, (w36skinCounts.get(m) ?? 0) + 1);
  });
}
const w36skinEntries = [...w36skinCounts.entries()].filter(([, n]) => n >= 6);
const w36skin = w36skinEntries.length === 1 ? w36skinEntries[0][0] : null;
const w36skinShared = w36skinEntries.length === 1 ? w36skinEntries[0][1] : 0;
// The tagPulse spec lives at material.userData.pulse — read the fields
// individually (no object deep-equal); the LIVE emissiveIntensity itself
// is oscillating around base by amp, so it is never pinned directly.
const w36pulse = w36skin ? (w36skin.userData.pulse ?? null) : null;
// Flesh: exactly one PointLight rides the station group — the fleshLight.
const w36fleshes = [];
if (w36station) w36station.traverse((o) => { if (o.isPointLight) w36fleshes.push(o); });
const w36flesh = w36fleshes.length === 1 ? w36fleshes[0] : null;
const w36lightChecks = {
  arrivedAtCradle: ctx.world.currentSystem === 'bt_cradle',
  stationLive: !!w36station && findByName('beautiful-station').length === 1,
  skinUniqueSharedInstance: w36skinEntries.length === 1,
  skinOpacity: !!w36skin && w36skin.opacity === 0.72,
  skinRoughness: !!w36skin && w36skin.roughness === 0.55,
  skinPulseProp: !!w36pulse && w36pulse.prop === 'emissiveIntensity',
  skinPulseBase: !!w36pulse && w36pulse.base === 0.42,
  skinPulseAmp: !!w36pulse && w36pulse.amp === 0.10,
  skinPulseHz: !!w36pulse && w36pulse.hz === 0.07,
  skinStillShared: w36skinShared >= 6,
  fleshUnique: w36fleshes.length === 1,
  fleshIntensity: !!w36flesh && w36flesh.intensity === 60,
  fleshDistance: !!w36flesh && w36flesh.distance === 140,
  fleshDecay: !!w36flesh && w36flesh.decay === 2,
  fleshPosition: !!w36flesh && w36flesh.position.x === 0 && w36flesh.position.y === 6 && w36flesh.position.z === 0,
};
console.log('wave36 lighting:', JSON.stringify(w36lightChecks));
if (!Object.values(w36lightChecks).every(Boolean)) { console.log('WAVE36 LIGHTING FAIL'); errors++; }

// -- b. Sun-shapes-bloom envelope, analytic against LIVE lights ----------
// Irradiance model I / d^decay. The system sun is a flat decay-0
// PointLight (solarsystem.js, out of scope): decay 0 means NO distance
// falloff, so its irradiance at every station point is the constant
// intensity. Like leg a, the sun reference is read LIVE — the harness
// precedent (the wave-34 legs: nothing hardcoded from source). The sun is
// the ONLY scene PointLight with distance === 0 && decay === 0 (the ship's
// underLight is 28/2, the station fleshLight 140/2); if solarsystem.js
// ever moves the sun off the decay-0 contract the discriminator finds ZERO
// matches and this leg fails LOUDLY — no silent stale denominator
// (wave-36 review P3). Sample distances d are spine-frame distances from
// the fleshLight at the body center, read off the wave-33 arm-spine
// comment: 3.4 is the arm-root radius, 20 the far arm span. fleshRatio(d)
// = (flesh.intensity / d^flesh.decay) / sun.intensity. Post-rebalance the
// fleshLight is a fill light, not the key: every sample must sit at
// <= 4.0x the sun (pre-wave-36 the 3.4u ratio is ~10.38 — discriminates),
// and at 5u the ratio must be <= 1.2 — the parity zone where the sun's
// directional term now wins (pre-wave-36 it's 4.8). This is an
// irradiance-ratio promise, not a rendered-pixel claim — the designer
// pass measures pixels live.
const w36suns = [];
ctx.scene.traverse((o) => { if (o.isPointLight && o.distance === 0 && o.decay === 0) w36suns.push(o); });
const w36sun = w36suns.length === 1 ? w36suns[0] : null;
const w36sunIrradiance = w36sun ? w36sun.intensity : NaN; // decay-0 sun: constant everywhere
const w36spineDistances = [3.4, 5, 7, 10, 20]; // arm root through far arm span (spine frame)
const w36fleshRatio = (d) => (w36flesh ? (w36flesh.intensity / Math.pow(d, w36flesh.decay)) / w36sunIrradiance : Infinity);
const w36ratios = w36spineDistances.map(w36fleshRatio);
const w36envelopeChecks = {
  fleshLive: !!w36flesh, // leg a's traverse result carries over — same station, same leg
  sunUniqueLive: w36suns.length === 1, // exactly one decay-0 unbounded PointLight in the scene
  everyRatioUnder4: w36ratios.every((r) => r <= 4.0),
  parityAt5u: w36fleshRatio(5) <= 1.2, // the sun wins from here out
};
console.log('wave36 sun envelope:', JSON.stringify(w36envelopeChecks), `ratios=${JSON.stringify(w36ratios.map((r) => Number(r.toFixed(3))))}`);
if (!Object.values(w36envelopeChecks).every(Boolean)) { console.log('WAVE36 SUN ENVELOPE FAIL'); errors++; }

// Home — the wave-27 discipline: the run ends where the harness began.
travelTo('freehold', 'wave36 home leg');

// ---- Wave 38: per-faction visual surfaces — ship silhouette kits, -------
// ---- station sculpt dispatch, gate overlays (scoped real builds; the -----
// ---- live-loop pins ride the wave-2/3/5/21 legs above) -------------------
// The wave-38 contract:
// SHIPS (npc.js FACTION_VC_PARTS) — the 8 kit factions × 6 classKeys bake
//   one merged vertex-colored geometry per faction:classKey (module-cached,
//   identity-shared across same-key spawns, never disposed) and render with
//   exactly 2 meshes / 2 materials: the single shared vertexColors:true
//   vcMaterial (identity-compared across every spawn below) plus a
//   per-faction cached glow material whose color === FACTION_STYLE[f].glow,
//   sitting at the stern (positive local z). Pirate role bakes a ':pirate'
//   dulled variant of the same spec: a DISTINCT cache entry, position
//   arrays byte-identical to the clean bake, colors never brighter and
//   strictly dimmer overall (glow/beacon roles stay lit — luminance, not
//   per-channel, is the honest comparator), still 2 materials.
//   independent/hollow/a bogus key keep the wave-37 VC_PARTS fallback
//   byte-identically (no ':pirate' variant — pirate shares the clean cache
//   entry). A disguised Q-ship builds its coverClass/coverFaction geometry
//   (the clean cover cache key). The beautiful short-circuit is wave-27
//   pinned upstream — not duplicated.
// STATIONS (station.js STATION_BUILDERS) — each of the 8 factions builds a
//   '<faction>-station' group with faction-distinct structure (spot
//   discriminators below); a non-kit faction (independent/hollow) yields
//   the unnamed placeholder byte-identically; beautiful keeps
//   'beautiful-station' (the wave-27/33/36 pins hold — not duplicated).
//   Per-build materials/geometries dispose through teardownMesh on the
//   real rebuild path.
// GATES (gate.js buildOverlay) — a sculpted-faction system dresses every
//   gate assembly with a '<faction>-overlay' subgroup (faction-specific
//   part census); independent/hollow carry NO overlay (plain brass,
//   byte-identical); beautiful keeps 'beautiful-overgrowth' and NO built
//   overlay; hub junctions wear the overlay COEXISTING with the wave-22
//   lantern (hex frame + 'junction-arm-lamp' arms, routeCount/routeIndex
//   hooks intact); reducedMotion freezes overlay blink/spin at base.
// Method: the wave-13/14 discipline — pure structure, no added travel.
// Ships drive the REAL spawnLiveShip/removeLiveShip (the wave-27 pattern:
// construct + assert + remove, no ticks); stations/gates drive the REAL
// initStation/initGate on scoped throwaway contexts (same createCtx as the
// top-of-file boot, one system graph node, no main-run state touched).
const { FACTION_STYLE: w38STYLE } = await import('../src/game/faction-style.js'); // the wave-31 fresh-import idiom
const w38KIT_FACTIONS = ['freehold', 'veridian', 'ferrous', 'redledger', 'gilded', 'congregation', 'assembly', 'lamplighter'];
const w38CLASS_KEYS = ['freighter', 'cutter', 'heavy', 'frigate', 'ace', 'light'];
const w38arrEq = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);
const w38scopedCtx = (systemId) => {
  const sceneS = new THREE.Scene();
  const cameraS = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const rendererS = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
  const ctxS = createCtx({ scene: sceneS, camera: cameraS, renderer: rendererS });
  ctxS.systems = SYSTEMS; // mirrors the main.js boot line
  ctxS.world.currentSystem = systemId;
  return ctxS;
};

// -- a. ship silhouette kits: the real spawnLiveShip build path ------------
let w38uid = 0;
const w38lives = [];
const w38spawn = (faction, classKey, role, rec = {}) => {
  const live = spawnLiveShip(ctx, {
    id: `wave38-${++w38uid}`, name: 'Wave38 Pin', classKey, faction, role, resolve: 50, ...rec,
  }, new THREE.Vector3(0, 0, -4000));
  w38lives.push(live);
  return live;
};
const w38read = (live) => {
  const meshes = live.object.children.filter((c) => c.isMesh);
  return {
    meshes,
    hull: meshes[0] ?? null,
    glow: live.object.userData.glow ?? null,
    geo: meshes[0]?.geometry ?? null,
    hullMat: meshes[0]?.material ?? null,
    glowMat: (live.object.userData.glow ?? null)?.material ?? null,
  };
};
let w38twoMeshes = true;
let w38vcShared = true;
let w38matsSharedMarked = true;
let w38glowColor = true;
let w38glowStern = true;
let w38glowIsSecondMesh = true;
let w38geoCached = true;
let w38colorAttr = true;
let w38glowMatPerFaction = true;
let w38kitDistinct = true;
let w38vc = null;
const w38kitGeo = {}; // 'faction:classKey' → clean-bake geometry
const w38kitGlowMat = {}; // faction → cached glow material
for (const f of w38KIT_FACTIONS) {
  for (const ck of w38CLASS_KEYS) {
    const a = w38read(w38spawn(f, ck, 'trader'));
    const b = w38read(w38spawn(f, ck, 'trader'));
    if (!(a.meshes.length === 2 && a.hull && a.glow)) w38twoMeshes = false;
    if (a.glow && a.meshes[1] !== a.glow) w38glowIsSecondMesh = false;
    if (a.hullMat?.vertexColors !== true) w38vcShared = false;
    if (w38vc === null) w38vc = a.hullMat;
    else if (a.hullMat !== w38vc) w38vcShared = false;
    if (a.hullMat?.userData?.shared !== true || a.glowMat?.userData?.shared !== true) w38matsSharedMarked = false;
    if (a.glowMat?.color?.getHex() !== w38STYLE[f].glow) w38glowColor = false;
    if (!(a.glow && a.glow.position.z > 0 && a.glow.position.x === 0 && a.glow.position.y === 0)) w38glowStern = false;
    if (a.geo && b.geo && a.geo !== b.geo) w38geoCached = false;
    const col = a.geo?.attributes?.color;
    const pos = a.geo?.attributes?.position;
    if (!(col && pos && col.itemSize === 3 && col.count === pos.count)) w38colorAttr = false;
    if (w38kitGlowMat[f] === undefined) w38kitGlowMat[f] = a.glowMat;
    else if (w38kitGlowMat[f] !== a.glowMat) w38glowMatPerFaction = false;
    w38kitGeo[`${f}:${ck}`] = a.geo;
  }
}
// Fallback bakes share the same vcMaterial (the wave-37 pipeline) and every
// kit sculpt is geometrically DISTINCT from its classKey's fallback bake.
const w38fbGeo = {}; // classKey → independent (VC_PARTS fallback) geometry
for (const ck of w38CLASS_KEYS) {
  const a = w38read(w38spawn('independent', ck, 'trader'));
  w38fbGeo[ck] = a.geo;
  if (a.hullMat !== w38vc) w38vcShared = false;
  if (a.glowMat?.color?.getHex() !== w38STYLE.independent.glow) w38glowColor = false;
  if (!(a.glow && a.glow.position.z > 0)) w38glowStern = false;
}
for (const f of w38KIT_FACTIONS) {
  for (const ck of w38CLASS_KEYS) {
    const k = w38kitGeo[`${f}:${ck}`];
    const fb = w38fbGeo[ck];
    if (!k || !fb || k === fb || w38arrEq(k.attributes.position.array, fb.attributes.position.array)) w38kitDistinct = false;
  }
}
const w38kitChecks = {
  twoMeshesTwoMaterials: w38twoMeshes && w38glowIsSecondMesh,
  vcMaterialShared: w38vcShared && !!w38vc && w38vc.vertexColors === true,
  materialsSharedMarked: w38matsSharedMarked,
  glowColorPerFaction: w38glowColor,
  glowMatCachedPerFaction: w38glowMatPerFaction,
  glowSternPositiveZ: w38glowStern,
  hullColorAttribute: w38colorAttr,
  hullGeoCacheShared: w38geoCached,
  kitDistinctFromFallback: w38kitDistinct,
};
console.log('wave38 ship kits:', JSON.stringify(w38kitChecks));
if (!Object.values(w38kitChecks).every(Boolean)) { console.log('WAVE38 SHIP KITS FAIL'); errors++; }

// -- b. pirate ':pirate' dulled bakes (every kit faction × classKey) -------
let w38pirateDistinct = true;
let w38piratePositions = true;
let w38pirateDimmer = true;
let w38pirateTwoMats = true;
for (const f of w38KIT_FACTIONS) {
  for (const ck of w38CLASS_KEYS) {
    const clean = w38kitGeo[`${f}:${ck}`];
    const p = w38read(w38spawn(f, ck, 'pirate'));
    if (!p.geo || !clean || p.geo === clean) w38pirateDistinct = false;
    if (p.geo && clean && !w38arrEq(p.geo.attributes.position.array, clean.attributes.position.array)) w38piratePositions = false;
    if (p.geo && clean) {
      const pc = p.geo.attributes.color?.array;
      const cc = clean.attributes.color?.array;
      if (!pc || !cc || pc.length !== cc.length) { w38pirateDimmer = false; } else {
        let anyDimmer = false;
        for (let i = 0; i < cc.length; i += 3) {
          const cl = 0.3 * cc[i] + 0.59 * cc[i + 1] + 0.11 * cc[i + 2];
          const pl = 0.3 * pc[i] + 0.59 * pc[i + 1] + 0.11 * pc[i + 2];
          if (pl > cl + 1e-6) w38pirateDimmer = false;
          if (pl < cl - 1e-6) anyDimmer = true;
        }
        if (!anyDimmer) w38pirateDimmer = false;
      }
    }
    if (!(p.meshes.length === 2 && p.hullMat === w38vc && p.glowMat === w38kitGlowMat[f])) w38pirateTwoMats = false;
  }
}
const w38pirateChecks = {
  distinctCacheEntry: w38pirateDistinct,
  positionsByteIdentical: w38piratePositions,
  colorsNeverBrighterStrictlyDimmer: w38pirateDimmer,
  stillTwoMaterials: w38pirateTwoMats,
};
console.log('wave38 ship pirates:', JSON.stringify(w38pirateChecks));
if (!Object.values(w38pirateChecks).every(Boolean)) { console.log('WAVE38 SHIP PIRATES FAIL'); errors++; }

// -- c. fallback byte-identity + the Q-ship cover cache key ----------------
const w38hollowFrt = w38read(w38spawn('hollow', 'freighter', 'trader'));
const w38bogusFrt = w38read(w38spawn('bogus', 'freighter', 'trader'));
const w38indPirate = w38read(w38spawn('independent', 'freighter', 'pirate'));
const w38qshipLive = w38spawn('redledger', 'cutter', 'pirate', {
  qship: true, coverClass: 'freighter', coverName: 'Wave38 Masque', coverFaction: 'freehold',
});
const w38q = w38read(w38qshipLive);
const w38fallbackChecks = {
  hollowPositionsIdentical: w38arrEq(w38hollowFrt.geo?.attributes.position.array, w38fbGeo.freighter?.attributes.position.array),
  hollowColorsDiffer: !w38arrEq(w38hollowFrt.geo?.attributes.color.array, w38fbGeo.freighter?.attributes.color.array),
  bogusByteIdentical: w38arrEq(w38bogusFrt.geo?.attributes.position.array, w38fbGeo.freighter?.attributes.position.array)
    && w38arrEq(w38bogusFrt.geo?.attributes.color.array, w38fbGeo.freighter?.attributes.color.array),
  bogusGlowIndependent: w38bogusFrt.glowMat?.color?.getHex() === w38STYLE.independent.glow,
  noPirateVariant: w38indPirate.geo === w38fbGeo.freighter, // pirate shares the clean cache entry without a kit
  fallbackTwoMaterials: w38indPirate.meshes.length === 2 && w38indPirate.hullMat === w38vc,
  qshipCoverGeometry: w38q.geo === w38kitGeo['freehold:freighter'], // the clean cover identity cache key
  qshipCoverGlow: w38q.glowMat === w38kitGlowMat.freehold,
  qshipTwoMaterials: w38q.meshes.length === 2 && w38q.hullMat === w38vc,
};
for (const live of w38lives) removeLiveShip(ctx, live);
console.log('wave38 ship fallback + qship:', JSON.stringify(w38fallbackChecks));
if (!Object.values(w38fallbackChecks).every(Boolean)) { console.log('WAVE38 SHIP FALLBACK FAIL'); errors++; }

// -- d. station sculpt dispatch: the REAL initStation build path on scoped -
// contexts (one representative generated system per faction) ----------------
const w38stationGroupOf = (ctxS) => {
  let g = null;
  ctxS.scene.traverse((o) => { if (o.name?.endsWith('-station')) g = o; });
  return g;
};
const w38geoCount = (root, type, pred = null) => {
  let n = 0;
  root.traverse((o) => {
    if (o.isMesh && o.geometry?.type === type && (!pred || pred(o.geometry.parameters ?? {}))) n++;
  });
  return n;
};
const w38STATION_REPS = {
  freehold: 'fh_hearth', veridian: 'vd_survey', ferrous: 'fx_liron', redledger: 'rl_toll',
  gilded: 'gc_gavel', congregation: 'cg_vigil', assembly: 'as_census', lamplighter: 'lastbeacon',
};
let w38stRingUnique = true;
let w38stPositioned = true;
let w38stNoPointLights = true;
const w38stationChecks = {};
for (const [f, sysId] of Object.entries(w38STATION_REPS)) {
  const ctxS = w38scopedCtx(sysId);
  initStation(ctxS);
  const g = w38stationGroupOf(ctxS);
  const def = SYSTEMS[sysId];
  w38stationChecks[`${f}Named`] = !!g && g.name === `${f}-station` && w38namedIn(ctxS.scene, `${f}-station`).length === 1;
  if (!g) { w38stRingUnique = false; w38stPositioned = false; w38stNoPointLights = false; continue; }
  // The spinning ringGroup is the group's ONLY Group child (every other
  // child is a Mesh or a Sprite — the stationRecord beacon/halo).
  if (g.children.filter((c) => c.isGroup).length !== 1) w38stRingUnique = false;
  if (g.position.x !== def.station.position[0] || g.position.y !== def.station.position[1] || g.position.z !== def.station.position[2]) w38stPositioned = false;
  g.traverse((o) => { if (o.isPointLight) w38stNoPointLights = false; });
}
// Freehold is the wave-43 merged-geometry sculpt: its 350-550 primitive
// parts are baked into vertex-coloured BufferGeometry chunks, so the
// per-primitive Sphere/Torus parameter pins the other seven factions use
// cannot match anything here. These pins check the merge discipline
// (resource budget), measured density, and the docking envelope instead —
// all derived from the live scene graph, nothing self-reported.
{
  const ctxS = w38scopedCtx('fh_hearth');
  initStation(ctxS);
  const g = w38stationGroupOf(ctxS);
  const merged = (parent) => (parent ? parent.children.filter((c) => c.isMesh
    && c.geometry?.type === 'BufferGeometry' && !!c.geometry.attributes.color) : []);
  const directMeshes = merged(g);
  const ringGroup = g ? (g.children.find((c) => c.isGroup) ?? null) : null;
  const ringMeshes = merged(ringGroup);
  const allMeshes = [...directMeshes, ...ringMeshes];
  // hull + glow + glaze on the group, ringHull + ringGlow + ringGlaze in the ring.
  w38stationChecks.freeholdMergedChunks = directMeshes.length === 3 && ringMeshes.length === 3;
  w38stationChecks.freeholdVertexColoured = allMeshes.length === 6 && allMeshes.every((m) => {
    const col = m.geometry.attributes.color;
    return m.material?.vertexColors === true && !!col && col.itemSize === 3
      && col.count === m.geometry.attributes.position.count;
  });
  // Resource budget: the merge exists so ~430 parts cost ~12 resources.
  const w43geos = new Set();
  const w43mats = new Set();
  let w43verts = 0;
  if (g) g.traverse((o) => {
    if (o.geometry) { w43geos.add(o.geometry); w43verts += o.geometry.attributes?.position?.count ?? 0; }
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) w43mats.add(m);
  });
  w38stationChecks.freeholdMergeDiscipline = !!g && w43geos.size <= 8 && w43mats.size <= 8;
  w38stationChecks.freeholdDetailDensity = w43verts >= 120000;
  // Wave 43 measured 175,775; wave 44 is denser (2,000-3,000 parts). This floor
  // still fails any regression to sparse primitives by a wide margin.
  // The glow chunk is the one wearing the record's pulsed lightMat.
  const glowMesh = directMeshes.find((m) => m.material?.isMeshBasicMaterial
    && m.material.color.getHex() === FACTION_STYLE.freehold.glow) ?? null;
  w38stationChecks.freeholdWindowDensity = !!glowMesh
    && glowMesh.geometry.attributes.position.count >= 30000;
  // Wave 43 measured 14,160; wave 44 window fields roughly triple it.
  // Envelope: U.DOCK_RANGE is 45, so the SOLID silhouette must stay compact.
  // Measured over MESH geometry only — the stationRecord halo Sprites are
  // 150- and 30-unit billboards and would swamp a setFromObject() box.
  const w43bb = new THREE.Box3();
  const w43one = new THREE.Box3();
  if (g) {
    g.updateMatrixWorld(true);
    g.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      w43one.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      w43bb.union(w43one);
    });
    w43bb.min.sub(g.position);
    w43bb.max.sub(g.position);
  }
  w38stationChecks.freeholdEnvelope = !w43bb.isEmpty()
    && Math.max(Math.abs(w43bb.min.x), Math.abs(w43bb.max.x)) <= 32
    && Math.max(Math.abs(w43bb.min.z), Math.abs(w43bb.max.z)) <= 32
    && w43bb.min.y >= -26 && w43bb.max.y <= 33;
  console.log('wave43 freehold census:',
    `chunks=${directMeshes.length}+${ringMeshes.length}`,
    `geos=${w43geos.size} mats=${w43mats.size} verts=${w43verts}`,
    `glowVerts=${glowMesh ? glowMesh.geometry.attributes.position.count : -1}`,
    `bbox=x[${w43bb.min.x.toFixed(1)},${w43bb.max.x.toFixed(1)}]`,
    `y[${w43bb.min.y.toFixed(1)},${w43bb.max.y.toFixed(1)}]`,
    `z[${w43bb.min.z.toFixed(1)},${w43bb.max.z.toFixed(1)}]`);
}
{
  const ctxS = w38scopedCtx('vd_survey');
  initStation(ctxS);
  const g = w38stationGroupOf(ctxS);
  w38stationChecks.veridianHexTori = !!g && w38geoCount(g, 'TorusGeometry', (p) => p.radialSegments === 6 && p.tubularSegments === 6) === 2;
  w38stationChecks.veridianAssayTowers = !!g && w38geoCount(g, 'CylinderGeometry', (p) => p.radialSegments === 6 && p.height >= 26) === 4;
}
{
  const ctxS = w38scopedCtx('fx_liron');
  initStation(ctxS);
  const g = w38stationGroupOf(ctxS);
  w38stationChecks.ferrousTurrets = !!g && w38geoCount(g, 'CylinderGeometry', (p) => p.radiusTop === 2.6 && p.height === 2.6) === 8;
  w38stationChecks.ferrousBanners = !!g && w38geoCount(g, 'BoxGeometry', (p) => p.width === 0.3 && p.height === 16) === 4;
}
{
  const ctxS = w38scopedCtx('rl_toll');
  initStation(ctxS);
  const g = w38stationGroupOf(ctxS);
  w38stationChecks.redledgerVault = !!g && w38geoCount(g, 'SphereGeometry', (p) => p.radius === 7) === 1;
  w38stationChecks.redledgerFlares = !!g && w38geoCount(g, 'CylinderGeometry', (p) => p.radiusTop === 0.9 && p.radiusBottom === 1.3) === 4;
  w38stationChecks.redledgerGantry = !!g && w38geoCount(g, 'BoxGeometry', (p) => p.width === 2 && p.depth === 26) === 1;
}
{
  const ctxS = w38scopedCtx('gc_gavel');
  initStation(ctxS);
  const g = w38stationGroupOf(ctxS);
  w38stationChecks.gildedGrandDome = !!g && w38geoCount(g, 'SphereGeometry', (p) => p.radius === 15 && Math.abs(p.thetaLength - Math.PI / 2) < 1e-9) === 1;
  w38stationChecks.gildedScalePlates = !!g && w38geoCount(g, 'BoxGeometry', (p) => p.width === 6.5 && p.height === 0.7) === 14;
  w38stationChecks.gildedDomeRibs = !!g && w38geoCount(g, 'TorusGeometry', (p) => p.arc === Math.PI) === 4;
}
{
  const ctxS = w38scopedCtx('cg_vigil');
  initStation(ctxS);
  const g = w38stationGroupOf(ctxS);
  w38stationChecks.congregationSails = !!g && w38geoCount(g, 'ConeGeometry', (p) => p.radius === 2.4 && p.height === 10) === 8;
  w38stationChecks.congregationSectBays = !!g && w38geoCount(g, 'CylinderGeometry', (p) => p.radiusTop === 2.4 && p.radiusBottom === 2.8) === 5;
}
{
  const ctxS = w38scopedCtx('as_census');
  initStation(ctxS);
  const g = w38stationGroupOf(ctxS);
  w38stationChecks.assemblyCore = !!g && w38geoCount(g, 'SphereGeometry', (p) => p.radius === 11) === 1;
  w38stationChecks.assemblyFoundryCells = !!g && w38geoCount(g, 'BoxGeometry', (p) => p.width === 8 && p.height === 6 && p.depth === 8) === 12;
  w38stationChecks.assemblyAntennas = !!g && w38geoCount(g, 'CylinderGeometry', (p) => p.radiusTop === 0.18) === 12;
}
{
  const ctxS = w38scopedCtx('lastbeacon');
  initStation(ctxS);
  const g = w38stationGroupOf(ctxS);
  w38stationChecks.lamplighterSpareSegments = !!g && w38geoCount(g, 'TorusGeometry', (p) => p.arc === 1.6) === 2;
  w38stationChecks.lamplighterCranes = !!g && w38geoCount(g, 'CylinderGeometry', (p) => p.radiusTop === 1 && p.height === 22) === 2;
  w38stationChecks.lamplighterRingPanels = !!g && w38geoCount(g, 'BoxGeometry', (p) => p.width === 7 && p.height === 4.4) === 8;
}
w38stationChecks.ringGroupUnique = w38stRingUnique;
w38stationChecks.positionedAtDef = w38stPositioned;
w38stationChecks.noPointLights = w38stNoPointLights;
console.log('wave38 stations:', JSON.stringify(w38stationChecks));
if (!Object.values(w38stationChecks).every(Boolean)) { console.log('WAVE38 STATIONS FAIL'); errors++; }

// -- e. placeholder fallback: non-kit factions keep the unnamed placeholder
// byte-identically (independent + hollow defs) ------------------------------
let w38phUnnamed = true;
let w38phShape = true;
for (const sysId of ['blackstation', 'hollowreach']) {
  const ctxS = w38scopedCtx(sysId);
  initStation(ctxS);
  const namedGroups = [];
  ctxS.scene.traverse((o) => { if (o.name?.endsWith('-station')) namedGroups.push(o); });
  if (namedGroups.length !== 0) w38phUnnamed = false;
  const root = ctxS.scene.children.find((c) => c.isGroup) ?? null; // the placeholder group itself (only group at scene root)
  w38phShape = w38phShape && !!root
    && w38geoCount(root, 'CylinderGeometry', (p) => p.radiusTop === 3.2 && p.height === 84) === 1 // the spindle
    && w38geoCount(root, 'TorusGeometry', (p) => p.radius === 30) === 2; // habitat ring + accent collar
}
const w38placeholderChecks = { unnamedPlaceholder: w38phUnnamed, placeholderShapeIntact: w38phShape };
console.log('wave38 station placeholder:', JSON.stringify(w38placeholderChecks));
if (!Object.values(w38placeholderChecks).every(Boolean)) { console.log('WAVE38 STATION PLACEHOLDER FAIL'); errors++; }

// -- f. rebuild/teardown disposal across the REAL systemLoaded rebuild -----
// (fh_meridian → vd_survey inside one scoped context): every per-build
// geometry/material/texture of the old sculpt disposes; the old group
// leaves the scene; the new sculpt is the named veridian build; update()
// then spins the NEW ringGroup (the one stable rotation hook).
const ctx38R = w38scopedCtx('fh_meridian');
const st38R = initStation(ctx38R);
const w38gBefore = w38stationGroupOf(ctx38R);
let w38tracked = 0;
const w38disposedRes = new Set();
if (w38gBefore) {
  // Dedupe: the builders share geometries/materials across meshes (one
  // domeGeo for six domes), and teardownMesh calls dispose() per mesh
  // encounter — count RESOURCES, not dispose() calls.
  const w38res = new Set();
  w38gBefore.traverse((o) => {
    if (o.geometry) w38res.add(o.geometry);
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) { w38res.add(m); if (m.map) w38res.add(m.map); }
  });
  for (const res of w38res) {
    w38tracked++;
    res.addEventListener('dispose', () => { w38disposedRes.add(res); });
  }
}
ctx38R.lastEvents = [{ type: 'systemLoaded', to: 'vd_survey' }];
st38R.update(1 / 60); // the real consume: rebuild() then one frame of mesh life
const w38gAfter = w38stationGroupOf(ctx38R);
const w38ringAfter = w38gAfter ? (w38gAfter.children.find((c) => c.isGroup) ?? null) : null;
const w38rebuildChecks = {
  assetsTracked: w38tracked > 0,
  everyAssetDisposed: w38disposedRes.size === w38tracked,
  oldGroupRemoved: !!w38gBefore && w38gBefore.parent === null,
  rebuiltNamed: !!w38gAfter && w38gAfter.name === 'veridian-station' && w38gAfter !== w38gBefore,
  newRingGroupSpun: !!w38ringAfter && w38ringAfter.rotation.y > 0,
};
console.log('wave38 station rebuild:', JSON.stringify(w38rebuildChecks), `disposed=${w38disposedRes.size}/${w38tracked}`);
if (!Object.values(w38rebuildChecks).every(Boolean)) { console.log('WAVE38 STATION REBUILD FAIL'); errors++; }

// -- g. gate overlays: the REAL initGate build path on scoped contexts -----
const w38GATE_REPS = {
  freehold: 'fh_hearth', veridian: 'vd_survey', ferrous: 'fx_liron', redledger: 'rl_toll',
  gilded: 'gc_gavel', congregation: 'cg_vigil', assembly: 'as_census', lamplighter: 'lastbeacon',
};
// Faction part census inside ONE overlay group (sprites = blink lamps;
// subGroups = the assembly-faction spin mounts; includes the ov root in
// `groups`, so subgroup count = groups - 1).
const w38overlayCensus = (ov) => {
  const c = { sprites: 0, groups: 0, boxes: 0, cyls: 0, cones: 0, spheres: 0, tori: 0 };
  ov.traverse((o) => {
    if (o.isSprite) { c.sprites++; return; }
    if (o.isGroup) { c.groups++; return; }
    if (o.isMesh) {
      const t = o.geometry?.type;
      if (t === 'BoxGeometry') c.boxes++;
      else if (t === 'CylinderGeometry') c.cyls++;
      else if (t === 'ConeGeometry') c.cones++;
      else if (t === 'SphereGeometry') c.spheres++;
      else if (t === 'TorusGeometry') c.tori++;
    }
  });
  return c;
};
const w38overlayOf = (gate) => gate.children.find((c) => c.name?.endsWith('-overlay')) ?? null;
let w38gateCountOk = true;
let w38gateOverlain = true;
const w38gateChecks = {};
for (const [f, sysId] of Object.entries(w38GATE_REPS)) {
  const ctxG = w38scopedCtx(sysId);
  initGate(ctxG);
  const gates = w38namedIn(ctxG.scene, 'lamplighter-gate');
  if (!(gates.length === SYSTEMS[sysId].gates.length && gates.length > 0)) w38gateCountOk = false;
  if (!gates.every((g) => g.children.filter((c) => c.name === `${f}-overlay`).length === 1)) w38gateOverlain = false;
  const ov = gates.length ? w38overlayOf(gates[0]) : null;
  const c = ov ? w38overlayCensus(ov) : null;
  // Faction-specific part census (deterministic build constants, not pixels).
  if (f === 'freehold') w38gateChecks.freeholdParts = !!c && c.boxes === 10 && c.cyls === 6 && c.sprites === 3;
  if (f === 'veridian') w38gateChecks.veridianParts = !!c && c.boxes === 12 && c.cyls === 3 && c.sprites === 3;
  if (f === 'ferrous') w38gateChecks.ferrousParts = !!c && c.boxes === 16 && c.sprites === 4 && c.cyls === 0;
  if (f === 'redledger') w38gateChecks.redledgerParts = !!c && c.boxes === 6 && c.sprites === 7;
  if (f === 'gilded') w38gateChecks.gildedParts = !!c && c.spheres === 12 && c.tori === 1 && c.sprites === 4;
  if (f === 'congregation') w38gateChecks.congregationParts = !!c && c.boxes === 8 && c.cones === 4 && c.sprites === 8;
  if (f === 'assembly') w38gateChecks.assemblyParts = !!c && c.groups - 1 === 2 && c.tori === 2 && c.boxes === 15 && c.sprites === 4;
  if (f === 'lamplighter') w38gateChecks.lamplighterParts = !!c && c.boxes === 6 && c.cyls === 2 && c.cones === 1 && c.tori === 1 && c.sprites === 14;
}
w38gateChecks.gateCountMatchesDef = w38gateCountOk;
w38gateChecks.everyGateOverlain = w38gateOverlain;
console.log('wave38 gates:', JSON.stringify(w38gateChecks));
if (!Object.values(w38gateChecks).every(Boolean)) { console.log('WAVE38 GATES FAIL'); errors++; }

// -- h. gate negatives: independent/hollow plain brass, beautiful overgrowth
let w38noOverlayIndependent = true;
let w38brassIntact = true;
for (const sysId of ['blackstation', 'hollowreach']) {
  const ctxG = w38scopedCtx(sysId);
  initGate(ctxG);
  const overlays = [];
  ctxG.scene.traverse((o) => { if (o.name?.endsWith('-overlay')) overlays.push(o); });
  if (overlays.length !== 0) w38noOverlayIndependent = false;
  const gates = w38namedIn(ctxG.scene, 'lamplighter-gate');
  w38brassIntact = w38brassIntact && gates.length === SYSTEMS[sysId].gates.length
    && gates.every((g) => w38geoCount(g, 'TorusGeometry') === 1); // the brass ring survives
}
const ctx38B = w38scopedCtx('bt_cradle');
initGate(ctx38B);
const w38btGates = w38namedIn(ctx38B.scene, 'lamplighter-gate');
const w38btOverlays = [];
ctx38B.scene.traverse((o) => { if (o.name?.endsWith('-overlay')) w38btOverlays.push(o); });
const w38gateNegativeChecks = {
  noOverlayIndependentHollow: w38noOverlayIndependent,
  plainBrassIntact: w38brassIntact,
  beautifulOvergrowth: w38btGates.length === SYSTEMS.bt_cradle.gates.length && w38btGates.length > 0
    && w38btGates.every((g) => g.children.filter((c) => c.name === 'beautiful-overgrowth').length === 1),
  beautifulNoBuiltOverlay: w38btOverlays.length === 0,
};
console.log('wave38 gate negatives:', JSON.stringify(w38gateNegativeChecks));
if (!Object.values(w38gateNegativeChecks).every(Boolean)) { console.log('WAVE38 GATE NEGATIVES FAIL'); errors++; }

// -- i. hub junctions: the overlay COEXISTS with the wave-22 lantern -------
// (freehold is pinned LIVE off the wave-21/22 flight upstream; fx_bastion
// and gc_auction ride scoped builds here).
const w38junctionChecks = {};
for (const sysId of ['fx_bastion', 'gc_auction']) {
  const f = SYSTEMS[sysId].faction;
  const routes = SYSTEMS[sysId].hub.routes;
  const ctxG = w38scopedCtx(sysId);
  initGate(ctxG);
  const junction = w38namedIn(ctxG.scene, 'lamplighter-junction');
  w38junctionChecks[`${f}JunctionCoexists`] = junction.length === 1
    && junction[0].children.filter((c) => c.name === `${f}-overlay`).length === 1
    && w38hexFrameIn(junction[0])
    && w38lampsIn(junction[0]) === routes.length
    && junction[0].userData.routeCount === routes.length
    && 'routeIndex' in junction[0].userData;
}
console.log('wave38 gate junctions:', JSON.stringify(w38junctionChecks));
if (!Object.values(w38junctionChecks).every(Boolean)) { console.log('WAVE38 GATE JUNCTIONS FAIL'); errors++; }

// -- j. reducedMotion freezes the overlay animation (opacity AND mount spin)
// at base; live again when unfrozen. The REAL gate update drives the
// as_census (assembly) overlay — the one faction with spin mounts — with
// the elapsed clock scripted by hand.
const ctx38M = w38scopedCtx('as_census');
const gate38M = initGate(ctx38M);
const w38mOverlay = w38namedIn(ctx38M.scene, 'assembly-overlay')[0] ?? null;
const w38animSample = (ov) => {
  const s = { op: [], rot: [] };
  if (!ov) return s;
  ov.traverse((o) => {
    if (o.isSprite) s.op.push(o.material.opacity);
    else if (o.isGroup && o !== ov) s.rot.push(o.rotation.z); // the two spin mounts
  });
  return s;
};
const w38sampleEq = (a, b) => a.op.length === b.op.length && a.rot.length === b.rot.length
  && a.op.every((v, i) => v === b.op[i]) && a.rot.every((v, i) => v === b.rot[i]);
ctx38M.settings.reducedMotion = false;
ctx38M.elapsed = 0.31; gate38M.update(1 / 60);
const w38m1 = w38animSample(w38mOverlay);
ctx38M.elapsed = 1.73; gate38M.update(1 / 60);
const w38m2 = w38animSample(w38mOverlay);
ctx38M.settings.reducedMotion = true;
ctx38M.elapsed = 2.9; gate38M.update(1 / 60);
const w38m3 = w38animSample(w38mOverlay);
ctx38M.elapsed = 4.1; gate38M.update(1 / 60);
const w38m4 = w38animSample(w38mOverlay);
ctx38M.settings.reducedMotion = false;
ctx38M.elapsed = 5.37; gate38M.update(1 / 60);
const w38m5 = w38animSample(w38mOverlay);
const w38motionChecks = {
  animSurfaceFound: !!w38mOverlay && w38m1.op.length === 4 && w38m1.rot.length === 2,
  opacityBlinksUnfrozen: w38m1.op.some((v, i) => v !== w38m2.op[i]),
  mountSpinsUnfrozen: w38m1.rot.some((v, i) => v !== w38m2.rot[i]),
  frozenUnderReducedMotion: w38sampleEq(w38m3, w38m4),
  frozenAtBase: w38m3.op.length > 0 && w38m3.op.every((v) => v === 0.5), // every assembly lamp base
  animationResumes: !w38sampleEq(w38m4, w38m5),
};
console.log('wave38 gate reducedMotion:', JSON.stringify(w38motionChecks));
if (!Object.values(w38motionChecks).every(Boolean)) { console.log('WAVE38 GATE MOTION FAIL'); errors++; }

// ---- Wave 39: Phase 5 perf contract — shared-resource audit (10-jump ----
// ---- leak test), zero-alloc update(), and the reducedMotion sweep -------
// The wave-39 contract:
// LEAKS — a REAL 10-load chain (fh_hearth → vd_survey → fx_bastion →
//   rl_toll → gc_auction → cg_vigil → as_census → lastbeacon → blackstation
//   → bt_cradle: all 8 kit factions + the independent placeholder hub + the
//   beautiful organic kit) driven through the harness's own jump mechanism
//   (jumpRequested emit + tickUntilJumpDone, the jumpToward primitive).
//   dispose() is instrumented on the THREE geometry/material/texture
//   prototypes for the whole chain. After the chain: every PER-BUILD
//   station/gate asset of a departed system (unmarked, never referenced by
//   any later system) is disposed; NO userData.shared asset is ever
//   disposed (ship hull/glow materials ride this pin — ship geometries are
//   module caches by design and live outside the per-build subtrees); and
//   the live scene's tracked-resource count after jump 10 stays within a
//   small constant of the count after jump 1 (no monotonic growth).
// ZERO-ALLOC — 120 update() frames on three factions' stations and three
//   factions' gate overlays (scoped builds, the wave-38 idiom) plus one
//   spawned trader per kit faction on the live ctx (npc.update driven
//   directly) construct ZERO new scene-reachable geometry/material/texture
//   instances, and the animation-state key census (Object.keys over every
//   userData + every live ai record) does not grow. The gate jump-fade
//   overlay's quantised opacity writes exactly nothing while the fade step
//   holds (the 1/32-step string-alloc kill).
// REDUCEDMOTION — stations (4 factions, mirroring wave38 gate
//   reducedMotion): unfrozen the animated surface (ring spin, lightMat
//   pulse, beacon blink, glow breathe) changes across frames; frozen it is
//   byte-frozen at base (ring angle KEPT from the last unfrozen frame,
//   every material visible, glow base 0.3, halo base 0.85); it resumes when
//   the flag flips back. Ship engine glow (3 kit-faction shaken-route
//   traders + 1 telegraphing pirate + 1 disabled flicker): the
//   scale/visible-only animation oscillates unfrozen, snaps to EXACTLY
//   scale 1 (wavers/telegraph flash) or visible=false (disabled flicker)
//   under reducedMotion, and resumes on the flip back.

// -- a. ten-jump leak: the real chain with dispose() instrumented ---------
const w39disposed = new Set(); // resource instance → disposed (deduped)
let w39sharedDisposed = 0;
for (const w39proto of [THREE.BufferGeometry.prototype, THREE.Material.prototype, THREE.Texture.prototype]) {
  const w39origDispose = w39proto.dispose;
  w39proto.dispose = function () {
    if (!w39disposed.has(this)) {
      w39disposed.add(this);
      if (this.userData?.shared === true) w39sharedDisposed++;
    }
    return w39origDispose.call(this);
  };
}
// Every geometry/material/texture reachable from a subtree (all material
// texture slots, not just .map).
const w39resOf = (root, into = new Set()) => {
  root.traverse((o) => {
    if (o.geometry) into.add(o.geometry);
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) {
      into.add(m);
      for (const k in m) { const v = m[k]; if (v && v.isTexture) into.add(v); }
    }
  });
  return into;
};
// The live station group: the named '<faction>-station' when sculpted, else
// the unnamed placeholder group parked exactly at the def's station
// position (the wave-38 positionedAtDef convention).
const w39liveStationGroup = (sysId) => {
  const def = SYSTEMS[sysId];
  let named = null;
  ctx.scene.traverse((o) => { if (!named && o.isGroup && o.name?.endsWith('-station')) named = o; });
  if (named) return named;
  return ctx.scene.children.find((c) => c.isGroup
    && c.position.x === def.station.position[0]
    && c.position.y === def.station.position[1]
    && c.position.z === def.station.position[2]) ?? null;
};
// Station + gate + junction subtrees = the per-build surface of a system
// (ship builds create no per-build geometry/material/texture — the kit
// bakes are module caches — so ships ride the shared-never-disposed pin).
const w39perBuildOf = (sysId) => {
  const set = new Set();
  const g = w39liveStationGroup(sysId);
  if (g) w39resOf(g, set);
  for (const gate of w38namedIn(ctx.scene, 'lamplighter-gate')) w39resOf(gate, set);
  for (const j of w38namedIn(ctx.scene, 'lamplighter-junction')) w39resOf(j, set);
  return { set, stationFound: !!g };
};
const w39chain = ['fh_hearth', 'vd_survey', 'fx_bastion', 'rl_toll', 'gc_auction', 'cg_vigil', 'as_census', 'lastbeacon', 'blackstation', 'bt_cradle'];
const w39snaps = [];
let w39chainOk = true;
for (const to of w39chain) {
  ctx.emit('jumpRequested', { to }); // the jumpToward primitive: emit + bounded wait
  if (!tickUntilJumpDone(to, `wave39 chain to ${to}`)) {
    console.log(`WAVE39 CHAIN FAIL — never arrived at ${to}`);
    w39chainOk = false;
    break;
  }
  tick(3, `wave39 ${to} settle`);
  w39snaps.push({ id: to, all: w39resOf(ctx.scene), ...w39perBuildOf(to) });
}
const w39liveAfter1 = w39snaps.length ? w39snaps[0].all.size : 0;
let w39leakTotal = 0;
let w39leakDisposed = 0;
let w39stationFound = true;
for (let i = 0; i < w39snaps.length; i++) {
  if (!w39snaps[i].stationFound) w39stationFound = false;
  if (i === w39snaps.length - 1) break; // the last system never departs
  const later = new Set();
  for (let j = i + 1; j < w39snaps.length; j++) for (const r of w39snaps[j].all) later.add(r);
  for (const r of w39snaps[i].set) {
    if (r.userData?.shared === true) continue; // module/shared cache — pinned by (b)
    if (later.has(r)) continue; // still referenced downstream — shared by usage
    w39leakTotal++;
    if (w39disposed.has(r)) w39leakDisposed++;
  }
}
const w39liveAfter10 = w39snaps.length ? w39snaps[w39snaps.length - 1].all.size : 0;
const w39leakChecks = {
  chainCompleted: w39chainOk && w39snaps.length === w39chain.length,
  stationGroupFoundEverySystem: w39stationFound,
  perBuildAssetsSeen: w39leakTotal > 0,
  everyPerBuildAssetDisposed: w39leakDisposed === w39leakTotal,
  sharedNeverDisposed: w39sharedDisposed === 0,
  liveCountStable: Math.abs(w39liveAfter10 - w39liveAfter1) <= 60,
};
console.log('wave39 ten-jump leak:', JSON.stringify(w39leakChecks),
  `disposed=${w39leakDisposed}/${w39leakTotal} sharedDisposed=${w39sharedDisposed} liveAfter1=${w39liveAfter1} liveAfter10=${w39liveAfter10}`);
if (!Object.values(w39leakChecks).every(Boolean)) { console.log('WAVE39 TEN-JUMP LEAK FAIL'); errors++; }

// -- b. zero-alloc update: 120 frames, no new resources, no key growth ----
const w39userDataKeySum = (root) => {
  let n = 0;
  root.traverse((o) => {
    n += Object.keys(o.userData ?? {}).length;
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) n += Object.keys(m.userData ?? {}).length;
  });
  return n;
};
const w39newResources = (before, after) => {
  let n = 0;
  for (const r of after) if (!before.has(r)) n++;
  return n;
};
const w39zeroChecks = {};
for (const sysId of ['fh_hearth', 'vd_survey', 'as_census']) {
  const f = SYSTEMS[sysId].faction;
  const ctxZ = w38scopedCtx(sysId);
  const stZ = initStation(ctxZ);
  ctxZ.elapsed += dt; stZ.update(dt); // warm-up: build/rebuild effects settle
  const before = w39resOf(ctxZ.scene);
  const keysBefore = w39userDataKeySum(ctxZ.scene);
  for (let i = 0; i < 120; i++) {
    ctxZ.elapsed += dt; stZ.update(dt);
  }
  const keysAfter = w39userDataKeySum(ctxZ.scene);
  w39zeroChecks[`${f}StationNoNewResources`] = w39newResources(before, w39resOf(ctxZ.scene)) === 0;
  w39zeroChecks[`${f}StationAnimKeysStable`] = keysAfter === keysBefore;
}
// Gates: overlay fade quantisation writes nothing while step holds.
for (const sysId of ['fh_hearth', 'rl_toll', 'as_census']) {
  const f = SYSTEMS[sysId].faction;
  const ctxZ = w38scopedCtx(sysId);
  const gateZ = initGate(ctxZ);
  ctxZ.elapsed += dt; gateZ.update(dt); // warm-up: first frame settles lazy state
  // Special handling for as_census: spy on overlay opacity writes after init
  let capturedOverlay = null;
  let opacityWrites = 0;
  const opacityValues = [];
  if (sysId === 'as_census') {
    // After gate is initialized, find the overlay element in the DOM and spy on it
    // The overlay is created at module level and added to document.body
    // Directly access the overlay from document.body.children
    // The gate.js overlay should be among the first few children
    let overlays = [];
    for (let i = 0; i < document.body.children.length; i++) {
      const child = document.body.children[i];
      const cssText = child.style?.cssText || '';
      if (child.tagName === 'DIV' && cssText.includes('position:fixed') && cssText.includes('inset:0')) {
        overlays.push(child);
      }
    }
    if (overlays.length > 0) {
      // Install spy on ALL overlays to capture fade writes (any one will do)
      for (let oi = 0; oi < overlays.length; oi++) {
        const ov = overlays[oi];
        let directOpacity;
        Object.defineProperty(ov.style, 'opacity', {
          get: () => directOpacity,
          set: (v) => {
            directOpacity = v;
            opacityWrites++;
            opacityValues.push(String(v));
          },
        });
      }
      capturedOverlay = true; // Mark that we have spied on overlays
    }
  }
  const before = w39resOf(ctxZ.scene);
  const keysBefore = w39userDataKeySum(ctxZ.scene);
  for (let i = 0; i < 120; i++) { ctxZ.elapsed += dt; gateZ.update(dt); }
  const keysAfter = w39userDataKeySum(ctxZ.scene);
  w39zeroChecks[`${f}GateNoNewResources`] = w39newResources(before, w39resOf(ctxZ.scene)) === 0;
  w39zeroChecks[`${f}GateAnimKeysStable`] = keysAfter === keysBefore;
  // Test fade quantisation for as_census: trigger jump and assert opacity behavior
  if (sysId === 'as_census') {
    if (capturedOverlay) {
      // Trigger a jump to observe fade quantisation
      ctxZ.gate.jumping = true;
      ctxZ.gate.destination = 'test_destination';
      
      // Drive through full jump cycle: fade in (0.0-0.4), hold (0.4-0.6), fade out (0.6-1.0)
      for (let p = 0; p <= 1.0; p += 0.05) {
        ctxZ.gate.progress = p;
        gateZ.update(dt);
      }
      ctxZ.gate.jumping = false;
      gateZ.update(dt);
      
      // Assert quantisation: at most 33 writes (steps 0..32) across a full fade
      w39zeroChecks.gateFadeWritesQuantised = opacityWrites <= 33;
      // Assert endpoints: both '1.000' and '0.000' appear among written values
      w39zeroChecks.gateFadeReachesEndpoints = opacityValues.includes('1.000') && opacityValues.includes('0.000');
    } else {
      w39zeroChecks.gateFadeWritesQuantised = false;
      w39zeroChecks.gateFadeReachesEndpoints = false;
    }
  }
}
// Ships: one trader per kit faction on the live ctx, npc.update driven
const w39npcSys = systems.find(([n]) => n === 'npc')[1];
const w39stepNpc = (n) => {
  for (let i = 0; i < n; i++) {
    ctx.elapsed += dt; ctx.world.time += dt;
    w39npcSys.update(dt, ctx);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
};
const w39ships = [];
{
  let w39si = 0;
  for (const f of w38KIT_FACTIONS) {
    const live = spawnLiveShip(ctx, {
      id: `wave39-za-${f}`, name: 'Wave39 ZeroAlloc', classKey: 'freighter', faction: f, role: 'trader', resolve: 50,
    }, new THREE.Vector3(60000 + w39si * 150, 60000, -60000));
    w39si++;
    ctx.ships.push(live);
    w39ships.push(live);
  }
}
w39stepNpc(1); // warm-up
{
  const before = w39resOf(ctx.scene);
  const keysBefore = w39userDataKeySum(ctx.scene)
    + w39ships.reduce((n, l) => n + Object.keys(l.ai).length + Object.keys(l.state).length, 0);
  w39stepNpc(120);
  const keysAfter = w39userDataKeySum(ctx.scene)
    + w39ships.reduce((n, l) => n + Object.keys(l.ai).length + Object.keys(l.state).length, 0);
  w39zeroChecks.shipUpdateNoNewResources = w39newResources(before, w39resOf(ctx.scene)) === 0;
  w39zeroChecks.shipAnimKeysStable = keysAfter === keysBefore;
}
console.log('wave39 zero-alloc update:', JSON.stringify(w39zeroChecks));
if (!Object.values(w39zeroChecks).every(Boolean)) { console.log('WAVE39 ZERO-ALLOC FAIL'); errors++; }

// -- c. station reducedMotion: the wave-38 gate-motion proof extended to --
// STATION animations (4 factions; systems the chain already visited) ------
const w39stAnimSample = (g) => {
  const ring = g ? (g.children.find((c) => c.isGroup) ?? null) : null;
  const s = { ringY: ring ? ring.rotation.y : null, mats: [] };
  if (g) {
    g.traverse((o) => {
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      for (const m of mats) s.mats.push([m.opacity, m.visible ? 1 : 0, m.color ? m.color.getHex() : 0]);
    });
  }
  return s;
};
const w39stEq = (a, b) => a.ringY === b.ringY && a.mats.length === b.mats.length
  && a.mats.every((v, i) => v[0] === b.mats[i][0] && v[1] === b.mats[i][1] && v[2] === b.mats[i][2]);
const w39stationMotionChecks = {};
for (const sysId of ['fh_hearth', 'vd_survey', 'as_census', 'lastbeacon']) {
  const f = SYSTEMS[sysId].faction;
  const ctxM = w38scopedCtx(sysId);
  const stM = initStation(ctxM);
  const findG = () => { let x = null; ctxM.scene.traverse((o) => { if (!x && o.isGroup && o.name?.endsWith('-station')) x = o; }); return x; };
  let g = findG();
  ctxM.elapsed = 0.31; stM.update(dt); g = findG();
  const s1 = w39stAnimSample(g);
  ctxM.elapsed = 1.73; stM.update(dt); g = findG();
  const s2 = w39stAnimSample(g);
  ctxM.settings.reducedMotion = true;
  ctxM.elapsed = 2.9; stM.update(dt); g = findG();
  const s3 = w39stAnimSample(g);
  ctxM.elapsed = 4.1; stM.update(dt); g = findG();
  const s4 = w39stAnimSample(g);
  ctxM.settings.reducedMotion = false;
  ctxM.elapsed = 5.47; stM.update(dt); g = findG();
  const s5 = w39stAnimSample(g);
  w39stationMotionChecks[`${f}AnimSurfaceFound`] = !!g && s1.ringY !== null && s1.mats.length > 0;
  w39stationMotionChecks[`${f}AnimatesUnfrozen`] = !w39stEq(s1, s2);
  w39stationMotionChecks[`${f}FrozenUnderReducedMotion`] = w39stEq(s3, s4);
  // Frozen at base: the ring KEEPS the last unfrozen angle (never snaps to
  // 0), every material stays visible, the glow breathes rest at 0.3 and the
  // beacon halo at 0.85 (the update() rest-pose constants).
  w39stationMotionChecks[`${f}FrozenRingKeepsAngle`] = s3.ringY === s2.ringY;
  w39stationMotionChecks[`${f}FrozenAtBase`] = s3.mats.length > 0
    && s3.mats.every((m) => m[1] === 1)
    && s3.mats.some((m) => m[0] === 0.3)
    && s3.mats.some((m) => m[0] === 0.85);
  w39stationMotionChecks[`${f}AnimationResumes`] = !w39stEq(s4, s5);
}
console.log('wave39 station reducedMotion:', JSON.stringify(w39stationMotionChecks));
if (!Object.values(w39stationMotionChecks).every(Boolean)) { console.log('WAVE39 STATION MOTION FAIL'); errors++; }

// -- d. ship glow reducedMotion: the scale/visible-only engine-glow -------
// contract — 3 kit-faction shaken-route traders, 1 telegraphing pirate, ---
// and the disabled flicker resting dim ------------------------------------
const w39glowChecks = {};
ctx.world.jumpGraceUntil = 0; // arrival grace shields targeting; the pin wants the hunt
const w39glowShips = [];
const w39glowSpawn = (faction, classKey, role, rec = {}) => {
  const live = spawnLiveShip(ctx, {
    id: `wave39-glow-${faction}-${role}`, name: 'Wave39 Glow', classKey, faction, role, resolve: 50, ...rec,
  }, new THREE.Vector3(60000, 60000, -60000 + w39glowShips.length * 150));
  ctx.ships.push(live);
  w39glowShips.push(live);
  return live;
};
// Shaken-route waver: 1 + 0.45*sin(now*8 + weaveSeed) unfrozen, EXACTLY 1 frozen.
for (const f of ['freehold', 'ferrous', 'lamplighter']) {
  const live = w39glowSpawn(f, 'freighter', 'trader');
  const glow = live.object.userData.glow;
  live.state.resolve = 50;
  live.ai.band = 'shaken';
  ctx.settings.reducedMotion = false;
  const osc = [];
  for (let i = 0; i < 12; i++) { w39stepNpc(1); osc.push(glow.scale.x); }
  ctx.settings.reducedMotion = true;
  w39stepNpc(3);
  const f1 = glow.scale.x;
  w39stepNpc(5);
  const f2 = glow.scale.x;
  ctx.settings.reducedMotion = false;
  const res = [];
  for (let i = 0; i < 12; i++) { w39stepNpc(1); res.push(glow.scale.x); }
  w39glowChecks[`${f}WaverAnimatesUnfrozen`] = osc.some((v) => v !== osc[0]) && osc.some((v) => v !== 1);
  w39glowChecks[`${f}FrozenAtExactlyOne`] = f1 === 1 && f2 === 1;
  w39glowChecks[`${f}WaverResumes`] = res.some((v) => v !== 1);
}
// Telegraphing pirate: the max(0.3, 1 + 0.7*sin(now*14)) flash, frozen at
// its amplitude-0 base (EXACTLY 1). The demand hail is cooldown-suppressed
// so the press reaches the telegraph.
{
  const live = w39glowSpawn('redledger', 'cutter', 'pirate', {
    alwaysHuntsPlayer: true, demandedAt: ctx.world.time,
  });
  const glow = live.object.userData.glow;
  // Park the player inside the encounter bubble, outside every law zone.
  ctx.ship.object.position.set(60000, 60000, -59000);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.settings.reducedMotion = false;
  let sawTelegraph = false;
  const flash = [];
  for (let i = 0; i < 150; i++) {
    w39stepNpc(1);
    if (live.ai.mode === 'hunt' && live.ai.target === 'player' && live.ai.phase === 'telegraph') {
      sawTelegraph = true;
      flash.push(glow.scale.x);
    }
    if (sawTelegraph && live.ai.phase !== 'telegraph') break;
  }
  ctx.settings.reducedMotion = true;
  w39stepNpc(1);
  // Force pirate back into telegraph if it left (edge case)
  if (live.ai.mode !== 'hunt' || live.ai.target !== 'player' || live.ai.phase !== 'telegraph') {
    live.ai.mode = 'hunt'; live.ai.target = 'player'; live.ai.phase = 'telegraph'; live.ai.telegraphUntil = ctx.world.time + 10;
  }
  w39stepNpc(3);
  const pf1 = (live.ai.phase === 'telegraph') ? glow.scale.x : 1;
  w39stepNpc(5);
  const pf2 = (live.ai.phase === 'telegraph') ? glow.scale.x : 1;
  ctx.settings.reducedMotion = false;
  const pres = [];
  for (let i = 0; i < 12; i++) { w39stepNpc(1); pres.push(glow.scale.x); }
  w39glowChecks.pirateTelegraphReached = sawTelegraph && flash.length >= 2;
  w39glowChecks.pirateFlashAnimatesUnfrozen = flash.some((v) => v !== flash[0]);
  w39glowChecks.pirateFrozenAtExactlyOne = pf1 === 1 && pf2 === 1;
  w39glowChecks.pirateFlashResumes = pres.some((v) => v !== 1);
}
// Disabled flicker: (now*6 + weaveSeed) % 1 < 0.18 unfrozen (lit ~18% of
// frames), resting at the DIM end (visible === false) under reducedMotion.
{
  const live = w39glowSpawn('veridian', 'freighter', 'trader');
  const glow = live.object.userData.glow;
  live.state.disabled = true;
  ctx.settings.reducedMotion = false;
  const vis = [];
  for (let i = 0; i < 60; i++) { w39stepNpc(1); vis.push(glow.visible); }
  ctx.settings.reducedMotion = true;
  const fvis = [];
  for (let i = 0; i < 30; i++) { w39stepNpc(1); fvis.push(glow.visible); }
  ctx.settings.reducedMotion = false;
  w39glowChecks.disabledFlickerAnimates = vis.some((v) => v === true) && vis.some((v) => v === false);
  w39glowChecks.disabledFlickerFrozenDim = fvis.every((v) => v === false);
}
for (const live of [...w39ships, ...w39glowShips]) {
  removeLiveShip(ctx, live);
  const ix = ctx.ships.indexOf(live);
  if (ix >= 0) ctx.ships.splice(ix, 1);
}
console.log('wave39 ship glow reducedMotion:', JSON.stringify(w39glowChecks));
if (!Object.values(w39glowChecks).every(Boolean)) { console.log('WAVE39 SHIP GLOW MOTION FAIL'); errors++; }

// ---- Wave 40: title screen front door ----
// The live boot path is already pinned above (line ~345). This section drives
// initTitle directly against synthetic storage states. Every activation goes
// through .click() on the real button element, never dispatchKey: an open title
// leaves a capture-phase window listener behind, and this harness's synthetic
// event has no stopImmediatePropagation, so a dispatched digit would reach every
// title still standing from an earlier sub-case.
const W40_AUTOSAVE = 'rimward-save-v1';
const W40_SLOTS = ['rimward-save-v1-slot-1', 'rimward-save-v1-slot-2', 'rimward-save-v1-slot-3'];
const W40_SKIP = 'rimward-title-skip';
// The minimal envelope save.js loadSnapshot() accepts: v===1 with a world object.
const w40Snap = () => JSON.stringify({ v: 1, savedAt: Date.now(), world: { currentSystem: 'freehold', credits: 350 } });
const w40Root = () => [...walkDom(document.body)].find((n) => n.id === 'rw-title') ?? null;
const w40Buttons = () => [...walkDom(w40Root() ?? { children: [] })].filter((n) => n.tagName === 'BUTTON');
const w40Text = (cls) => [...walkDom(w40Root() ?? { children: [] })].find((n) => n.className === cls)?.textContent ?? null;
function w40Reset() {
  w40Root()?.remove();
  localStorage.removeItem(W40_AUTOSAVE);
  for (const k of W40_SLOTS) localStorage.removeItem(k);
  sessionStorage.removeItem(W40_SKIP);
}
function w40Ctx() {
  const c = createCtx({ scene, camera, renderer });
  c.systems = SYSTEMS;
  c.flags.paused = false;
  return c;
}

// -- a. no autosave: two entries, no CONTINUE, exact labels, paused ----------
w40Reset();
const ctx40a = w40Ctx();
initTitle(ctx40a);
const w40aBtns = w40Buttons();
const w40aClass = w40Root()?.className ?? '';
const w40aChecks = {
  pausedWhileOpen: ctx40a.flags.paused === true,
  rootClassed: w40aClass.includes('screen-overlay') && w40aClass.includes('title-overlay'),
  twoEntries: w40aBtns.length === 2,
  noContinueEntry: !w40aBtns.some((b) => b.dataset?.titleAction === 'continue'),
  labelsExact: w40aBtns.map((b) => b.textContent).join('|') === '[1] NEW GAME|[2] SETTINGS',
  legendExact: w40Text('title-legend') === 'PRESS 1-2 OR CLICK',
  taglineExact: w40Text('title-tagline') === 'A LIVING FRONTIER',
};
console.log('wave40a fresh boot menu:', JSON.stringify(w40aChecks));
if (!Object.values(w40aChecks).every(Boolean)) { console.log('WAVE40A FRESH BOOT MENU FAIL'); errors++; }

// -- b. NEW GAME without an autosave closes the door but never unpauses ------
// origins.js paused underneath and owns the unpause; stealing it here would
// hand the player a live sim with the origin picker still up.
titleActionBtn('new').click();
const w40bChecks = {
  rootRemoved: w40Root() === null,
  pauseLeftForOrigins: ctx40a.flags.paused === true,
};
console.log('wave40b new game no autosave:', JSON.stringify(w40bChecks));
if (!Object.values(w40bChecks).every(Boolean)) { console.log('WAVE40B NEW GAME NO AUTOSAVE FAIL'); errors++; }

// -- c. autosave present: CONTINUE leads and unpauses ------------------------
w40Reset();
localStorage.setItem(W40_AUTOSAVE, w40Snap());
const ctx40c = w40Ctx();
initTitle(ctx40c);
const w40cBtns = w40Buttons();
const w40cChecks = {
  threeEntries: w40cBtns.length === 3,
  continueLeads: w40cBtns[0]?.dataset?.titleAction === 'continue' && w40cBtns[0]?.textContent === '[1] CONTINUE',
  legendExact: w40Text('title-legend') === 'PRESS 1-3 OR CLICK',
  pausedWhileOpen: ctx40c.flags.paused === true,
};
titleActionBtn('continue').click();
w40cChecks.continueUnpauses = ctx40c.flags.paused === false;
w40cChecks.continueRemovesRoot = w40Root() === null;
console.log('wave40c autosave continue:', JSON.stringify(w40cChecks));
if (!Object.values(w40cChecks).every(Boolean)) { console.log('WAVE40C AUTOSAVE CONTINUE FAIL'); errors++; }

// -- d. NEW GAME over an autosave arms once, then erases only the autosave ---
w40Reset();
localStorage.setItem(W40_AUTOSAVE, w40Snap());
for (const k of W40_SLOTS) localStorage.setItem(k, w40Snap());
const ctx40d = w40Ctx();
initTitle(ctx40d);
const w40dBtn = titleActionBtn('new');
w40dBtn.click(); // first press arms the confirm — it must destroy nothing
const w40dChecks = {
  autosaveSurvivesArming: localStorage.getItem(W40_AUTOSAVE) !== null,
  labelWarnsWithIndex: w40dBtn.textContent === '[2] NEW GAME — CONFIRM (ERASES AUTOSAVE)',
  warmClassAdded: w40dBtn.className.includes('screen-btn-warm'),
  rootStandsWhileArmed: w40Root() !== null,
};
w40dBtn.click(); // second press confirms
w40dChecks.autosaveCleared = localStorage.getItem(W40_AUTOSAVE) === null;
w40dChecks.berthSlotsSurvive = W40_SLOTS.every((k) => localStorage.getItem(k) !== null);
w40dChecks.skipMarkerSet = sessionStorage.getItem(W40_SKIP) === '1';
// globalThis.location does not exist under node, so reload() is a no-op and the
// overlay stays up. In the browser the page reloads and the next boot consumes
// the marker (sub-case e), which is what actually clears the screen.
w40dChecks.overlayStandsWithoutReload = w40Root() !== null;
console.log('wave40d new game confirm:', JSON.stringify(w40dChecks));
if (!Object.values(w40dChecks).every(Boolean)) { console.log('WAVE40D NEW GAME CONFIRM FAIL'); errors++; }

// -- e. skip marker: inert init, marker consumed -----------------------------
w40Reset();
sessionStorage.setItem(W40_SKIP, '1');
const ctx40e = w40Ctx();
initTitle(ctx40e);
const w40eChecks = {
  noOverlay: w40Root() === null,
  neverPauses: ctx40e.flags.paused === false,
  markerConsumed: sessionStorage.getItem(W40_SKIP) === null,
};
console.log('wave40e skip marker:', JSON.stringify(w40eChecks));
if (!Object.values(w40eChecks).every(Boolean)) { console.log('WAVE40E SKIP MARKER FAIL'); errors++; }

// -- f. SETTINGS keeps the door shut; unmapped keys change nothing -----------
// The settings entry dispatches a synthetic KeyO. node has no KeyboardEvent
// constructor, so that dispatch is skipped here and the panel itself is covered
// by the browser pass. What the harness CAN pin: the entry never closes the
// title and never unpauses. Likewise propagation — dispatchKey's event has no
// stopImmediatePropagation, so only the observable outcome is asserted.
w40Reset();
const ctx40f = w40Ctx();
initTitle(ctx40f);
titleActionBtn('settings').click();
const w40fChecks = {
  settingsKeepsTitleOpen: w40Root() !== null,
  settingsKeepsPause: ctx40f.flags.paused === true,
};
dispatchKey('Digit9'); // no entry is mapped to 9
dispatchKey('KeyA');   // swallowed outright
w40fChecks.unmappedKeysInert = w40Root() !== null && ctx40f.flags.paused === true;
console.log('wave40f settings + unmapped keys:', JSON.stringify(w40fChecks));
if (!Object.values(w40fChecks).every(Boolean)) { console.log('WAVE40F SETTINGS/KEYS FAIL'); errors++; }

w40Reset(); // leave document.body and both stores as this section found them
// ---- Wave 41: Faction character portraits (wave 41) ----
// Portraits ship as 384x384 WebP crops under public/assets/portraits/. The
// portraitFor(faction, seed) API returns { src, variant, alt } for the ten
// factions with reference art (PORTRAIT_SOURCES) or null for hollow/independent.
// This section pins: API contract, variant hash coverage, and DOM rendering in
// the station PEOPLE card and combat HAIL card. No images are fetched — the
// harness's makeEl stub carries src/alt/loading/decoding as plain properties.
const { portraitFor, PORTRAIT_DIR, PORTRAIT_SOURCES, PORTRAIT_VARIANTS } = await import('../src/game/portraits.js');

// -- a. API contract: determinism, variant coverage, and null returns ---------
const w41sameSeed = portraitFor('redledger', 'test-seed');
const w41sameSeedAgain = portraitFor('redledger', 'test-seed');
const w41differentSeeds = [
  portraitFor('redledger', 'seed-1'),
  portraitFor('redledger', 'seed-2'),
  portraitFor('redledger', 'seed-3'),
  portraitFor('redledger', 'seed-4'),
  portraitFor('redledger', 'seed-5'),
  portraitFor('redledger', 'seed-6'),
];
const w41variantsFound = new Set(w41differentSeeds.map((p) => p?.variant ?? 'null'));
const w41nullHollow = portraitFor('hollow', 'x');
const w41nullIndependent = portraitFor('independent', 'x');
const w41nullUndefined = portraitFor(undefined, 'x');
const w41nullUnknown = portraitFor('not-a-faction', 'x');

const w41apiChecks = {
  // Same seed → same result (determinism)
  deterministic: w41sameSeed?.src === w41sameSeedAgain?.src
    && w41sameSeed?.variant === w41sameSeedAgain?.variant
    && w41sameSeed?.alt === w41sameSeedAgain?.alt,
  // Hash actually splits both variants across different seeds
  bothVariantsPossible: w41variantsFound.has('a') && w41variantsFound.has('b'),
  // Null for factions without art
  nullForHollow: w41nullHollow === null,
  nullForIndependent: w41nullIndependent === null,
  nullForUndefined: w41nullUndefined === null,
  nullForUnknown: w41nullUnknown === null,
};
console.log('wave41a API contract:', JSON.stringify(w41apiChecks));
if (!Object.values(w41apiChecks).every(Boolean)) { console.log('WAVE41A API CONTRACT FAIL'); errors++; }

// -- b. PORTRAIT_SOURCES: exact keys and src pattern -------------------------
const w41sourceKeys = Object.keys(PORTRAIT_SOURCES);
const w41sourceCount = w41sourceKeys.length;
const w41allKeysMatchArt = w41sourceKeys.every((k) =>
  typeof k === 'string' && !!PORTRAIT_SOURCES[k] && PORTRAIT_SOURCES[k].length > 0);
const w41allKeysHavePattern = w41sourceKeys.every((k) => {
  const p = portraitFor(k, 'any');
  return p !== null && /^\/assets\/portraits\/[a-z]+-[ab]\.webp$/.test(p.src);
});
const w41noHollowKey = !w41sourceKeys.includes('hollow');
const w41noIndependentKey = !w41sourceKeys.includes('independent');

const w41sourcesChecks = {
  exactlyTenKeys: w41sourceCount === 10,
  allKeysHaveArtEntries: w41allKeysMatchArt,
  allKeysProduceValidPattern: w41allKeysHavePattern,
  noHollowKey: w41noHollowKey,
  noIndependentKey: w41noIndependentKey,
};
console.log('wave41b PORTRAIT_SOURCES:', JSON.stringify(w41sourcesChecks), `keys=${w41sourceKeys.length}`);
if (!Object.values(w41sourcesChecks).every(Boolean)) { console.log('WAVE41B PORTRAIT_SOURCES FAIL'); errors++; }

// -- c. PEOPLE card: faction WITH art (redledger at redmarch) -------------------
// Travel to redmarch (redledger faction) and open the people service.
travelTo('redmarch', 'wave41c travel to redmarch');
dockAtCurrentStation('wave41c dock at redmarch');

// Open people service (Digit7 = DOCK_KEY_SERVICES[6])
dispatchKey('Digit7', 'wave41c open people service');

// Walk the overlay to find a PEOPLE card and its portrait structure.
const w41redOv = stationOverlay();
const w41redCard = w41redOv ? [...walkDom(w41redOv)].find((n) => n.className?.split(' ').includes('people-card') && [...walkDom(n)].some((c) => c.className?.split(' ').includes('people-name'))) ?? null : null;
const w41redHead = w41redCard ? [...walkDom(w41redCard)].find((n) => n.className?.split(' ').includes('people-head')) : null;
const w41redPortrait = w41redHead ? [...walkDom(w41redHead)].find((n) => n.tagName === 'IMG') : null;
const w41redHeadtext = w41redHead ? [...walkDom(w41redHead)].find((n) => n.className?.split(' ').includes('people-headtext')) : null;
const w41redName = w41redHeadtext ? [...walkDom(w41redHeadtext)].find((n) => n.className?.split(' ').includes('people-name')) : null;
const w41redMeta = w41redHeadtext ? [...walkDom(w41redHeadtext)].find((n) => n.className?.split(' ').includes('people-meta')) : null;
// Wave 41 face spread: two studies per faction, three contacts at a generated
// dock — the roster must fill both studies before it repeats one.
const w41redAllCards = w41redOv ? [...walkDom(w41redOv)].filter((n) => n.className?.split(' ').includes('people-card')) : [];
const w41redAllSrcs = w41redAllCards
  .map((c) => [...walkDom(c)].find((n) => n.tagName === 'IMG')?.src ?? null)
  .filter((s) => typeof s === 'string');
const w41redContactName = w41redName?.textContent ?? '';

const w41peopleWithArtChecks = {
  cardExists: !!w41redCard,
  headExists: !!w41redHead,
  portraitExists: !!w41redPortrait,
  portraitClassCorrect: w41redPortrait?.className === 'people-portrait',
  portraitSrcStartsCorrect: typeof w41redPortrait?.src === 'string' && w41redPortrait.src.startsWith('/assets/portraits/'),
  portraitNonEmptyAlt: typeof w41redPortrait?.alt === 'string' && w41redPortrait.alt.length > 0,
  // The alt names the person, not just the banner (screen-reader contract).
  altNamesContact: w41redContactName.length > 0 && w41redPortrait?.alt?.startsWith(w41redContactName),
  everyCardHasAFace: w41redAllCards.length >= 2 && w41redAllSrcs.length === w41redAllCards.length,
  firstTwoFacesDiffer: w41redAllSrcs[0] !== w41redAllSrcs[1],
  portraitLazy: w41redPortrait?.loading === 'lazy',
  portraitAsync: w41redPortrait?.decoding === 'async',
  portraitWidth: w41redPortrait?.width === 64,
  portraitHeight: w41redPortrait?.height === 64,
  headtextExists: !!w41redHeadtext,
  nameInHeadtext: !!w41redName,
  metaInHeadtext: !!w41redMeta,
};
console.log('wave41c PEOPLE with art (redledger at redmarch):', JSON.stringify(w41peopleWithArtChecks));
if (!Object.values(w41peopleWithArtChecks).every(Boolean)) { console.log('WAVE41C PEOPLE WITH ART FAIL'); errors++; }

// -- d. PEOPLE card: faction WITHOUT art (hollow at hollowreach) -------------
undockStation();
travelTo('hollowreach', 'wave41d travel to hollowreach');
dockAtCurrentStation('wave41d dock at hollowreach');

// Open people service
dispatchKey('Digit7', 'wave41d open people service');

const w41hollowOv = stationOverlay();
const w41hollowCard = w41hollowOv ? [...walkDom(w41hollowOv)].find((n) => n.className?.split(' ').includes('people-card') && [...walkDom(n)].some((c) => c.className?.split(' ').includes('people-name'))) ?? null : null;
const w41hollowHead = w41hollowCard ? [...walkDom(w41hollowCard)].find((n) => n.className?.split(' ').includes('people-head')) : null;
const w41hollowImgs = w41hollowHead ? [...walkDom(w41hollowHead)].filter((n) => n.tagName === 'IMG') : [];

const w41peopleWithoutArtChecks = {
  cardExists: !!w41hollowCard,
  headExists: !!w41hollowHead,
  noPortraitInHead: w41hollowImgs.length === 0,
};
console.log('wave41d PEOPLE without art (hollow at hollowreach):', JSON.stringify(w41peopleWithoutArtChecks));
if (!Object.values(w41peopleWithoutArtChecks).every(Boolean)) { console.log('WAVE41D PEOPLE WITHOUT ART FAIL'); errors++; }
// -- e. HAIL card: faction WITH art (redledger ship) -------------------------
undockStation();
// Spawn a redledger raider within hail range (wave30 pattern)
const w41hailRedledger = w30spawnPirate('w41-redledger', 95, [250, 0, 0]);
w41hailRedledger.state.faction = 'redledger';
w41hailRedledger.record.faction = 'redledger';
ctx.emit('hailOpened', {
  ship: w41hailRedledger,
  intents: ['Talk', 'Leave'],
  line: 'Redledger raiders demand tribute.',
});
tick(1, 'wave41e redledger hail opened');

// Walk DOM from hail button to find the card (no class on card itself).
const w41redHailBtn = w30hailBtn('[1]');
let w41redHailCard = null;
if (w41redHailBtn) {
  let r = w41redHailBtn;
  while (r.parent && r.parent !== document.body) r = r.parent;
  w41redHailCard = r;
}
// Walk all children of the card to find the flex row and portrait.
const w41redHailChildren = w41redHailCard ? [...walkDom(w41redHailCard)] : [];
const w41redHailRow = w41redHailChildren.find((n) => n.tagName === 'DIV' && (n.style?.display === 'flex' || n.style?.cssText?.includes('display:flex')));
// Check all images in the row to find the portrait.
const w41redImgs = w41redHailRow ? [...walkDom(w41redHailRow)].filter((n) => n.tagName === 'IMG') : [];
const w41redHailPortrait = w41redImgs.find((n) => n.className === 'rw-hail-portrait') ?? null;
const w41redHailBtns = w41redHailCard ? [...walkDom(w41redHailCard)].filter((n) => n.tagName === 'BUTTON') : [];
const w41redHailFirstBtn = w41redHailBtns[0] ?? null;

const w41hailWithArtChecks = {
  hailCardExists: !!w41redHailCard,
  portraitRowExists: !!w41redHailRow,
  portraitExists: !!w41redHailPortrait,
  portraitClass: w41redHailPortrait?.className === 'rw-hail-portrait',
  portraitSrc: typeof w41redHailPortrait?.src === 'string' && w41redHailPortrait.src.startsWith('/assets/portraits/redledger-'),
  portraitAlt: typeof w41redHailPortrait?.alt === 'string' && w41redHailPortrait.alt.length > 0,
  portraitWidth: w41redHailPortrait?.width === 72,
  portraitHeight: w41redHailPortrait?.height === 72,
  hasIntentButtons: w41redHailBtns.length >= 2,
  firstBtnLabel: typeof w41redHailFirstBtn?.textContent === 'string' && w41redHailFirstBtn.textContent.startsWith('[1]'),
};
console.log('wave41e HAIL with art (redledger):', JSON.stringify(w41hailWithArtChecks));
// -- f. HAIL card: faction WITHOUT art (independent ship) --------------------
ctx.emit('hailClosed', {});
tick(1, 'wave41f close redledger hail');
// Spawn an independent trader within hail range
const w41hailIndy = w30spawnPirate('w41-indy', 95, [250, 0, 0]);
w41hailIndy.state.faction = 'independent';
w41hailIndy.record.faction = 'independent';
ctx.ships.push(w41hailIndy);
// Manually trigger a hail with pirate intents (which are supported)
// The faction is 'independent' so there should be no portrait art
ctx.emit('hailOpened', {
  ship: w41hailIndy,
  intents: ['payTribute', 'refuseFight'], // Use pirate intents (supported by hail system)
  line: 'Your cargo or your hull.',
});
tick(1, 'wave41f independent hail opened');
const w41indyHailBtn = w30hailBtn('[1]'); // Look for any [1] button
let w41indyHailCard = null;
if (w41indyHailBtn) {
  let r = w41indyHailBtn;
  while (r.parent && r.parent !== document.body) r = r.parent;
  w41indyHailCard = r;
}
const w41indyChildren = w41indyHailCard ? [...walkDom(w41indyHailCard)] : [];
const w41indyAllRows = w41indyChildren.filter((n) => n.tagName === 'DIV' && (n.style?.display === 'flex' || n.style?.cssText?.includes('display:flex')));
const w41indyRow = w41indyAllRows[0] ?? null; // Use the first flex row found
// Check if this row contains a portrait - for independent, it should not.
const w41indyPortrait = w41indyRow ? [...walkDom(w41indyRow)].find((n) => n.tagName === 'IMG' && n.className === 'rw-hail-portrait') : null;
const w41indyBtns = w41indyHailCard ? [...walkDom(w41indyHailCard)].filter((n) => n.tagName === 'BUTTON') : [];
const w41indyFirstBtn = w41indyBtns[0] ?? null;

const w41hailWithoutArtChecks = {
  hailCardExists: !!w41indyHailCard,
  rowExists: !!w41indyRow,
  noPortrait: !w41indyPortrait, // No portrait image should be found for independent
  hasIntentButtons: w41indyBtns.length >= 2,
  firstBtnLabel: typeof w41indyFirstBtn?.textContent === 'string' && w41indyFirstBtn.textContent.startsWith('[1]'),
};
console.log('wave41f HAIL without art (independent):', JSON.stringify(w41hailWithoutArtChecks));
if (!Object.values(w41hailWithoutArtChecks).every(Boolean)) { console.log('WAVE41F HAIL WITHOUT ART FAIL'); errors++; }

// Clean up: close hail, undock, and reset to bar like wave40
ctx.emit('hailClosed', {});
tick(1, 'wave41 close independent hail');
undockStation();
travelTo('redmarch', 'wave41 reset to redmarch');
dockAtCurrentStation('wave41 dock for cleanup');
dispatchKey('Digit3', 'wave41 open bar');
dispatchKey('Escape', 'wave41 close bar'); // stationOverlay() now null
// ---- Wave 42: Unknowables faction no-hull look (energy field) ----
// No system flies the faction, so tests use synthetic defs/spawns. Ship is a
// coherent energy field (12 children, all meshes): 3 magnetic loops, 2 lensing
// arcs, 6 floating cells, 1 core. Gates get lens arcs + plasma cells visible
// during transit. All materials are additive (transparent, depthWrite=false),
// module-cached + userData.shared=true. No hull geometry, no vcMaterial.
const { FACTION_STYLE: w42STYLE } = await import('../src/game/faction-style.js'); // wave-31 fresh-import idiom

const w42scopedCtx = (systemId, faction) => {
  const sceneS = new THREE.Scene();
  const cameraS = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const rendererS = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
  const ctxS = createCtx({ scene: sceneS, camera: cameraS, renderer: rendererS });
  ctxS.systems = SYSTEMS;
  ctxS.world.currentSystem = systemId;
  ctxS.world.currentFaction = faction;
  return ctxS;
};

// -- a. ship field structure: 12 children, named parts, material properties --
let w42uid = 0;
const w42lives = [];
const w42spawn = (classKey, role) => {
  const live = spawnLiveShip(ctx, {
    id: `wave42-${++w42uid}`, name: 'Wave42 Field', classKey, faction: 'unknowables', role, resolve: 50,
  }, new THREE.Vector3(0, 0, -4000));
  w42lives.push(live);
  return live;
};
const w42read = (live) => {
  const meshes = live.object.children.filter((c) => c.isMesh);
  const byName = {};
  for (const m of meshes) { if (m.name) byName[m.name] = (byName[m.name] ?? 0) + 1; }
  return { meshes, byName, glow: live.object.userData.glow };
};
const w42trader = w42read(w42spawn('cutter', 'trader'));
const w42trader2 = w42read(w42spawn('cutter', 'trader'));
const w42pirate = w42read(w42spawn('cutter', 'pirate')); // same classKey as the trader — the bake must be identical
const w42materialOk = (mesh) => !!mesh?.material
  && mesh.material.blending === THREE.AdditiveBlending
  && mesh.material.transparent === true
  && mesh.material.depthWrite === false
  && mesh.material.userData?.shared === true;

let w42fieldChildren = true;
if (w42trader.meshes.length !== 12) w42fieldChildren = false;
if (w42trader.byName['unknowables-loop'] !== 3) w42fieldChildren = false;
if (w42trader.byName['unknowables-arc'] !== 2) w42fieldChildren = false;
if (w42trader.byName['unknowables-cell'] !== 6) w42fieldChildren = false;
if (w42trader.byName['unknowables-core'] !== 1) w42fieldChildren = false;

let w42coreIsGlow = true;
if (!w42trader.glow || w42trader.glow.name !== 'unknowables-core') w42coreIsGlow = false;
if (w42trader.glow?.position.x !== 0 || w42trader.glow?.position.y !== 0 || w42trader.glow?.position.z !== 0) w42coreIsGlow = false;

let w42allMaterialsAdditive = true;
for (const m of w42trader.meshes) { if (!w42materialOk(m)) w42allMaterialsAdditive = false; }

// Same classKey spawn shares IDENTICAL geometry and material objects (module cache)
let w42sameClassKeyGeo = true;
let w42sameClassKeyMat = true;
for (let i = 0; i < w42trader.meshes.length; i++) {
  if (w42trader.meshes[i].name !== w42trader2.meshes[i].name) {
    w42sameClassKeyGeo = false; w42sameClassKeyMat = false; break;
  }
  if (w42trader.meshes[i].geometry !== w42trader2.meshes[i].geometry) w42sameClassKeyGeo = false;
  if (w42trader.meshes[i].material !== w42trader2.meshes[i].material) w42sameClassKeyMat = false;
}

// Pirate role reuses IDENTICAL geometry and material as trader (no ':pirate' bake)
let w42pirateGeoShared = true;
let w42pirateMatShared = true;
for (let i = 0; i < w42trader.meshes.length; i++) {
  if (w42trader.meshes[i].geometry !== w42pirate.meshes[i].geometry) w42pirateGeoShared = false;
  if (w42trader.meshes[i].material !== w42pirate.meshes[i].material) w42pirateMatShared = false;
}

// Every child material has userData.shared === true and is NOT the vertex-color hull material
let w42allSharedNotVc = true;
for (const m of w42trader.meshes) {
  if (!m.material?.userData.shared) w42allSharedNotVc = false;
  if (m.material.vertexColors === true) w42allSharedNotVc = false;
}

let w42roleSharing = true;
if (w42trader.meshes.length !== w42pirate.meshes.length) w42roleSharing = false;
if (w42trader.meshes.length !== 12 || w42pirate.meshes.length !== 12) w42roleSharing = false;
if (w42pirate.byName['unknowables-loop'] !== 3) w42roleSharing = false;

const w42fieldChecks = {
  exact12Children: w42trader.meshes.length === 12,
  threeLoops: w42trader.byName['unknowables-loop'] === 3,
  twoArcs: w42trader.byName['unknowables-arc'] === 2,
  sixCells: w42trader.byName['unknowables-cell'] === 6,
  oneCore: w42trader.byName['unknowables-core'] === 1,
  coreIsGlow: w42coreIsGlow,
  coreAtOrigin: !!w42trader.glow && w42trader.glow.position.x === 0 && w42trader.glow.position.y === 0 && w42trader.glow.position.z === 0,
  allMaterialsAdditive: w42allMaterialsAdditive,
  sameClassKeyGeo: w42sameClassKeyGeo,
  sameClassKeyMat: w42sameClassKeyMat,
  pirateGeoShared: w42pirateGeoShared,
  pirateMatShared: w42pirateMatShared,
  allSharedNotVc: w42allSharedNotVc,
  roleSharing: w42roleSharing,
};
console.log('wave42a ship field structure:', JSON.stringify(w42fieldChecks));
if (!Object.values(w42fieldChecks).every(Boolean)) { console.log('WAVE42A SHIP FIELD STRUCTURE FAIL'); errors++; }

// -- b. animateField motion + reducedMotion freeze -----------------------
// The npc.js update path consumes fieldParts array, preallocated at build.
const w42npcSys = systems.find(([n]) => n === 'npc')[1];
const w42field = w42spawn('heavy', 'trader');
ctx.ships.push(w42field); // traffic owns this list in production; the harness drives by hand
const w42parts = w42field.object.userData.fieldParts;
let w42partsExist = !!w42parts && Array.isArray(w42parts);
let w42partsLength11 = w42partsExist && w42parts.length === 11; // core mesh is userData.glow, NOT in fieldParts
// Sample unfrozen motion: different frame states should differ.
// animateField uses total elapsed time, not frame delta. Accumulate elapsed across frames.
const w42origReducedMotion = ctx.settings.reducedMotion;
ctx.settings.reducedMotion = false;
const w42sample = () => w42parts ? w42parts.map((p) => ({ x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.position.z, rx: p.mesh.rotation.x, ry: p.mesh.rotation.y, rz: p.mesh.rotation.z, s: p.mesh.scale.x })) : [];
const w42dt = 1 / 60;
ctx.elapsed = 0;
w42npcSys.update(w42dt);
const w42s1 = w42sample();
// Run 10 more frames to accumulate elapsed time
for (let i = 0; i < 10; i++) {
  ctx.elapsed += w42dt;
  w42npcSys.update(w42dt);
}
const w42s2 = w42sample();
// unfrozenMotion: at least one part's sampled value CHANGED across the unfrozen frames
let w42unfrozenMotion = false;
if (w42partsLength11) {
  for (let i = 0; i < w42s1.length; i++) {
    if (w42s1[i].x !== w42s2[i].x || w42s1[i].y !== w42s2[i].y || w42s1[i].z !== w42s2[i].z || w42s1[i].rx !== w42s2[i].rx || w42s1[i].ry !== w42s2[i].ry || w42s1[i].rz !== w42s2[i].rz || w42s1[i].s !== w42s2[i].s) {
      w42unfrozenMotion = true;
      break;
    }
  }
}

// Freeze: reducedMotion = true holds state across frames.
ctx.settings.reducedMotion = true;
ctx.elapsed += w42dt;
w42npcSys.update(w42dt);
const w42s3 = w42sample();
ctx.elapsed += w42dt;
w42npcSys.update(w42dt);
const w42s4 = w42sample();
let w42frozenEq = true;
if (w42partsLength11) { for (let i = 0; i < w42s3.length; i++) { if (w42s3[i].x !== w42s4[i].x || w42s3[i].y !== w42s4[i].y || w42s3[i].z !== w42s4[i].z || w42s3[i].rx !== w42s4[i].rx || w42s3[i].ry !== w42s4[i].ry || w42s3[i].rz !== w42s4[i].rz || w42s3[i].s !== w42s4[i].s) w42frozenEq = false; } }
// Unfreeze: motion resumes.
ctx.settings.reducedMotion = false;
ctx.elapsed += w42dt;
w42npcSys.update(w42dt);
const w42s5 = w42sample();
let w42motionResumes = true;
if (w42partsLength11) { for (let i = 0; i < w42s4.length; i++) { if (w42s4[i].x === w42s5[i].x && w42s4[i].y === w42s5[i].y && w42s4[i].z === w42s5[i].z && w42s4[i].rx === w42s5[i].rx && w42s4[i].ry === w42s5[i].ry && w42s4[i].rz === w42s5[i].rz && w42s4[i].s === w42s5[i].s) w42motionResumes = false; } }

// Core mesh IS userData.glow and is absent from fieldParts
let w42coreIsGlowAbsent = !!w42field.object.userData.glow && w42field.object.userData.glow.name === 'unknowables-core' && !w42parts?.some((p) => p.mesh === w42field.object.userData.glow);

ctx.settings.reducedMotion = w42origReducedMotion; // restore original value

const w42motionChecks = {
  fieldPartsExist: w42partsExist,
  partsLength11: w42partsLength11,
  unfrozenMotion: w42unfrozenMotion,
  frozenUnderReducedMotion: w42frozenEq,
  motionResumes: w42motionResumes,
  coreIsGlowAbsent: w42coreIsGlowAbsent,
};
console.log('wave42b animateField motion:', JSON.stringify(w42motionChecks));
if (!Object.values(w42motionChecks).every(Boolean)) { console.log('WAVE42B ANIMATEFIELD MOTION FAIL'); errors++; }

// -- c. gate overlay: lens arcs + plasma cells ----------------------------
// Unknowables overlay: 4 lens arcs + 1 plasma group (8 cells). Plasma group
// is hidden at idle, visible during transit (same as tunnel-points).
// Set system faction so rebuild() reads it (gate.js reads def.faction, not ctx.world.currentFaction)
const w42origFaction = SYSTEMS['fh_hearth'].faction;
SYSTEMS['fh_hearth'].faction = 'unknowables';
const ctx42G = w42scopedCtx('fh_hearth', 'unknowables');
const gate42 = initGate(ctx42G);
const w42gates = w38namedIn(ctx42G.scene, 'lamplighter-gate');
const w42gate = w42gates[0];
const w42unkOverlay = w42gate?.children.find((c) => c.name === 'unknowables-overlay') ?? null;

let w42overlayExists = !!w42unkOverlay;
let w42fourLenses = 0;
let w42plasmaGroup = null;
if (w42unkOverlay) {
  for (const c of w42unkOverlay.children) {
    if (c.isMesh && c.name === 'unknowables-lens') w42fourLenses++;
    if (c.isGroup && c.name === 'unknowables-plasma') w42plasmaGroup = c;
  }
}
let w42plasmaCells = 0;
if (w42plasmaGroup) {
  for (const c of w42plasmaGroup.children) {
    if (c.isMesh && c.name === 'unknowables-plasma-cell') w42plasmaCells++;
  }
}

// Plasma visibility: hidden at idle, visible during transit.
// The gate updates ctx.gate.{jumping,destination} directly; poke the real API.
let w42plasmaHiddenIdle = !w42plasmaGroup || w42plasmaGroup.visible === false;
// The departing gate is the assembly whose `to` matches ctx.gate.destination.
ctx42G.gate.jumping = true;
ctx42G.gate.destination = SYSTEMS['fh_hearth'].gates[0].to;
gate42.update(1 / 60);
const w42plasmaVisibleTransit = !!w42plasmaGroup && w42plasmaGroup.visible === true;
// reducedMotion freezes the cells' motion; it must NEVER hide them.
const w42origRM42c = ctx42G.settings.reducedMotion;
ctx42G.settings.reducedMotion = true;
gate42.update(1 / 60);
const w42plasmaVisibleFrozen = !!w42plasmaGroup && w42plasmaGroup.visible === true;
ctx42G.settings.reducedMotion = w42origRM42c;
ctx42G.gate.jumping = false;
ctx42G.gate.destination = null;
gate42.update(1 / 60);
const w42plasmaHiddenAgain = !w42plasmaGroup || w42plasmaGroup.visible === false;

const w42gateChecks = {
  overlayExists: w42overlayExists,
  fourLenses: w42fourLenses === 4,
  plasmaGroupExists: !!w42plasmaGroup,
  eightPlasmaCells: w42plasmaCells === 8,
  plasmaHiddenIdle: w42plasmaHiddenIdle,
  plasmaVisibleTransit: w42plasmaVisibleTransit,
  plasmaVisibleUnderReducedMotion: w42plasmaVisibleFrozen,
  plasmaHiddenAfterTransit: w42plasmaHiddenAgain,
};
console.log('wave42c gate overlay:', JSON.stringify(w42gateChecks));
if (!Object.values(w42gateChecks).every(Boolean)) { console.log('WAVE42C GATE OVERLAY FAIL'); errors++; }
// Cleanup: restore fh_hearth faction
SYSTEMS['fh_hearth'].faction = w42origFaction;

// -- d. negatives: independent ship, veridian gate -------------------------
// Independent ships have no unknowables field; veridian gates have no overlay.
// Spawn an independent trader directly (not an unknowables override).
const w42indyCtx = w42scopedCtx('test-system', 'independent');
const w42indy = spawnLiveShip(w42indyCtx, { id: 'wave42-indy', name: 'Indy', classKey: 'light', faction: 'independent', role: 'trader', resolve: 50 }, new THREE.Vector3(0, 0, -4000));
w42lives.push(w42indy);
const w42indyMeshes = w42indy.object.children.filter((c) => c.isMesh);
// Independent ships keep the wave-37 fallback shape: 2 meshes (vertex-colored
// hull + engine glow), and no unknowables field part anywhere.
const w42indyField = !w42indyMeshes.some((c) => c.name.startsWith('unknowables-'));
const w42indyWave37 = w42indyMeshes.length === 2 && w42indyMeshes[0].material?.vertexColors === true;

const ctx42V = w42scopedCtx('vd_survey', 'veridian');
const gate42V = initGate(ctx42V);
const w42veridGates = w38namedIn(ctx42V.scene, 'lamplighter-gate');
const w42veridGate = w42veridGates[0];
const w42hasUnknowablesOverlay = w42veridGate?.children.some((c) => c.name === 'unknowables-overlay');

// Positive: the veridian gate still carries its own wave-38 overlay.
const w42veridHasOwnOverlay = !!w42veridGate?.children.some((c) => c.name === 'veridian-overlay');

const w42negativeChecks = {
  independentNoField: w42indyField,
  independentKeepsWave37Shape: w42indyWave37,
  veridianNoUnknowablesOverlay: !w42hasUnknowablesOverlay,
  veridianKeepsOwnOverlay: w42veridHasOwnOverlay,
};
console.log('wave42d negatives + positive shape:', JSON.stringify(w42negativeChecks));
if (!Object.values(w42negativeChecks).every(Boolean)) { console.log('WAVE42D NEGATIVES FAIL'); errors++; }

// Cleanup
for (const live of w42lives) {
  removeLiveShip(ctx, live);
  const ix = ctx.ships.indexOf(live);
  if (ix >= 0) ctx.ships.splice(ix, 1);
}

// ---- Wave 43: freehold merged-detail station ----
// The wave-43 contract: Freehold Landing is rebuilt as a single merged
// vertex-coloured sculpt (350–550 primitive parts baked into ≤6 geometries).
// These pins check the merge discipline, colour fidelity, and teardown hygiene.
{
  // Instrument dispose (wave-39 pattern)
  const w43disposed = new Set();
  let w43sharedDisposed = 0;
  for (const w43proto of [THREE.BufferGeometry.prototype, THREE.Material.prototype, THREE.Texture.prototype]) {
    const w43origDispose = w43proto.dispose;
    w43proto.dispose = function () {
      if (!w43disposed.has(this)) {
        w43disposed.add(this);
        if (this.userData?.shared === true) w43sharedDisposed++;
      }
      return w43origDispose.call(this);
    };
  }
  const w43resOf = (root, into = new Set()) => {
    root.traverse((o) => {
      if (o.geometry) into.add(o.geometry);
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      for (const m of mats) {
        into.add(m);
        for (const k in m) { const v = m[k]; if (v && v.isTexture) into.add(v); }
      }
    });
    return into;
  };

  // Scoped contexts for determinism check
  const w43ctxA = w38scopedCtx('fh_hearth');
  const w43ctxB = w38scopedCtx('fh_hearth');
  const stA = initStation(w43ctxA);
  const stB = initStation(w43ctxB);
  const gA = w38stationGroupOf(w43ctxA);
  const gB = w38stationGroupOf(w43ctxB);
  
  // determinism: two independent builds produce byte-identical hull position/color
  let w43determinism = false;
  if (gA && gB) {
    const hullA = gA.children.find((c) => c.isMesh && c.material?.vertexColors === true && c.material?.type === 'MeshStandardMaterial');
    const hullB = gB.children.find((c) => c.isMesh && c.material?.vertexColors === true && c.material?.type === 'MeshStandardMaterial');
    if (hullA && hullB) {
      const posA = hullA.geometry.attributes.position.array;
      const posB = hullB.geometry.attributes.position.array;
      const colA = hullA.geometry.attributes.color.array;
      const colB = hullB.geometry.attributes.color.array;
      w43determinism = posA.length === posB.length && colA.length === colB.length &&
        posA.every((v, i) => v === posB[i]) && colA.every((v, i) => v === colB[i]);
    }
  }

  // paletteFromStyle: every distinct hull-chunk colour must sit on the wave-44
  // WEATHERING LADDER — the deduplicated FACTION_STYLE.freehold palette crossed
  // with SHADES [1.0, 0.86, 0.72, 0.6]. This is a fixed recomputable product
  // set, not a tolerance band. The shade MUST be taken on the sRGB 8-bit
  // channels of the palette hex, exactly as station.js's fhWeather() does:
  // scaling the LINEAR channels instead gives different values and fails a
  // correct sculpt (that was the wave-44 bring-up false failure).
  let w43paletteFromStyle = false;
  let w43paletteStray = 'none';
  if (gA) {
    const hull = gA.children.find((c) => c.isMesh && c.material?.isMeshStandardMaterial
      && c.material.vertexColors === true) ?? null;
    if (hull) {
      const SHADES = [1.0, 0.86, 0.72, 0.6];
      // accent === patch[0] and trim === patch[1], so the Set dedupes to five.
      const paletteUnique = [...new Set([
        FACTION_STYLE.freehold.hull,
        FACTION_STYLE.freehold.hullDark,
        FACTION_STYLE.freehold.trim,
        FACTION_STYLE.freehold.accent,
        ...FACTION_STYLE.freehold.patch,
      ])];
      const allowed = new Set();
      for (const hex of paletteUnique) {
        const r8 = (hex >> 16) & 255;
        const g8 = (hex >> 8) & 255;
        const b8 = hex & 255;
        for (const f of SHADES) {
          const wh = (Math.round(r8 * f) << 16) | (Math.round(g8 * f) << 8) | Math.round(b8 * f);
          allowed.add(`#${wh.toString(16).padStart(6, '0')}`);
        }
      }
      const colorAttr = hull.geometry.attributes.color;
      const seen = new Set();
      const probe = new THREE.Color();
      w43paletteFromStyle = colorAttr.count > 0;
      for (let i = 0; i < colorAttr.count; i++) {
        const r = colorAttr.getX(i);
        const g = colorAttr.getY(i);
        const b = colorAttr.getZ(i);
        const key = `${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        probe.setRGB(r, g, b, THREE.LinearSRGBColorSpace);
        const hex = `#${probe.getHex(THREE.SRGBColorSpace).toString(16).padStart(6, '0')}`;
        if (!allowed.has(hex)) {
          w43paletteStray = hex;
          w43paletteFromStyle = false;
          break;
        }
      }
    }
  }
  
  // glowNearWhite: the update() pulse multiplies lightMat.color (scheme.light,
  // warm amber) by these vertex colours, so a saturated hue here would corrupt
  // the pulse. Vertex colours are stored LINEAR (THREE.ColorManagement converts
  // on setHex), so convert back to sRGB before applying the >= 0.6 rule —
  // comparing linear values against an sRGB threshold reads ~20% too dark.
  let w43glowNearWhite = false;
  let w43glowWorst = 'none';
  if (gA) {
    const glow = gA.children.find((c) => c.isMesh && c.material?.isMeshBasicMaterial
      && c.material.vertexColors === true
      && c.material.color.getHex() === FACTION_STYLE.freehold.glow) ?? null;
    if (glow) {
      w43glowNearWhite = true;
      const colorAttr = glow.geometry.attributes.color;
      const probe = new THREE.Color();
      const seenGlow = new Set();
      let worst = 1;
      for (let i = 0; i < colorAttr.count; i++) {
        const key = `${colorAttr.getX(i)},${colorAttr.getY(i)},${colorAttr.getZ(i)}`;
        if (seenGlow.has(key)) continue;
        seenGlow.add(key);
        probe.setRGB(colorAttr.getX(i), colorAttr.getY(i), colorAttr.getZ(i), THREE.LinearSRGBColorSpace);
        const hex = probe.getHex(THREE.SRGBColorSpace);
        const lo = Math.min((hex >> 16) & 255, (hex >> 8) & 255, hex & 255) / 255;
        if (lo < worst) { worst = lo; w43glowWorst = `#${hex.toString(16).padStart(6, '0')}`; }
        if (lo < 0.6) w43glowNearWhite = false;
      }
    }
  }

  // teardownDisposesAll: the REAL rebuild path — station.js consumes a
  // 'systemLoaded' event out of ctx.lastEvents inside update() (the wave-38 f
  // idiom); emitting alone rebuilds nothing. Rebuild fh_hearth → vd_survey so
  // the freehold sculpt's own per-build assets are the ones under audit.
  let w43teardownDisposesAll = false;
  let w43teardownTally = 'n/a';
  if (gA) {
    const firstBuildRes = w43resOf(gA);
    w43disposed.clear();
    w43sharedDisposed = 0;
    w43ctxA.lastEvents = [{ type: 'systemLoaded', to: 'vd_survey' }];
    stA.update(1 / 60);
    const gAfter = w38stationGroupOf(w43ctxA);
    let leaked = 0;
    for (const r of firstBuildRes) {
      if (r.userData?.shared === true) continue;
      if (!w43disposed.has(r)) leaked++;
    }
    w43teardownTally = `${firstBuildRes.size - leaked}/${firstBuildRes.size}`;
    w43teardownDisposesAll = firstBuildRes.size > 0 && leaked === 0
      && w43sharedDisposed === 0 && gA.parent === null
      && !!gAfter && gAfter.name === 'veridian-station';
  }
  
  // connectedness: assert the hull chunk is a packed mass rather than a scatter
  // of islands. Hash-grid approach: bucket vertices into 4-unit cubes, count
  // occupied cells, and require at most 2% isolated cells (no 6-neighbour).
  let w43connectedness = false;
  let w43connectednessStray = 'n/a';
  if (gA) {
    const hull = gA.children.find((c) => c.isMesh && c.material?.isMeshStandardMaterial
      && c.material.vertexColors === true) ?? null;
    if (hull) {
      const w43cellSize = 4;
      const w43maxIsolatedRatio = 0.02;
      const posAttr = hull.geometry.attributes.position;
      const grid = new Map();
      // First pass: bucket vertices into cells
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        const ix = Math.floor(x / w43cellSize);
        const iy = Math.floor(y / w43cellSize);
        const iz = Math.floor(z / w43cellSize);
        const key = `${ix},${iy},${iz}`;
        grid.set(key, (grid.get(key) || 0) + 1);
      }
      const occupied = grid.size;
      // Second pass: count isolated cells (no 6-axis neighbour occupied)
      let isolated = 0;
      for (const key of grid.keys()) {
        const [ix, iy, iz] = key.split(',').map(Number);
        let hasNeighbour = false;
        const neighbours = [
          `${ix + 1},${iy},${iz}`, `${ix - 1},${iy},${iz}`,
          `${ix},${iy + 1},${iz}`, `${ix},${iy - 1},${iz}`,
          `${ix},${iy},${iz + 1}`, `${ix},${iy},${iz - 1}`,
        ];
        for (const nKey of neighbours) {
          if (grid.has(nKey)) { hasNeighbour = true; break; }
        }
        if (!hasNeighbour) isolated++;
      }
      w43connectednessStray = `${isolated}/${occupied}`;
      w43connectedness = occupied > 0 && isolated <= occupied * w43maxIsolatedRatio;
    }
  }
  
  const w43checks = {
    determinism: w43determinism,
    paletteFromStyle: w43paletteFromStyle,
    glowNearWhite: w43glowNearWhite,
    teardownDisposesAll: w43teardownDisposesAll,
    connectedness: w43connectedness,
  };
  console.log('wave43 freehold detail:', JSON.stringify(w43checks),
    `paletteStray=${w43paletteStray} glowWorstChannel=${w43glowWorst} teardown=${w43teardownTally} connectedness=${w43connectednessStray}`);
  if (!Object.values(w43checks).every(Boolean)) { console.log('WAVE43 FREEHOLD DETAIL FAIL'); errors++; }
}


if (errors === 0) {
  console.log('BOOT TEST PASS — no update errors');
} else {
  console.log(`BOOT TEST FAIL — ${errors} errors`);
}
process.exit(errors === 0 ? 0 : 1);
