/**
 * Issue #100 — docked players cannot receive or resolve surrender cards.
 *
 * Pins the berth boundary against the REAL `initHail` DOM card, the real
 * overlay policy and the real `window.rimward` handle over a hand-built ctx —
 * the same narrow fixture shape scripts/hail-identity-test.mjs uses. No full
 * boot, and no privileged mutation used to fake an outcome: the only thing the
 * test writes is `ctx.flags.docked`, which is what station.js dock()/undock()
 * write, plus the ordinary `hailOpened` events npc.js itself emits.
 *
 * Covered:
 *   1  an incoming surrender never opens while docked (berthOpen stays false)
 *   2  a surrender card already up closes on docking, granting nothing
 *   3  the transition window — click, digit key, ctx.hailApi.resolve and the
 *      public hailResolve all refuse while the card is still on screen
 *   4  a deferred hail is dropped on docking and cannot reappear after launch
 *   5  demand close semantics on docking are unchanged ('docked' outcome)
 *   6  undocked resolution and the issue #66 stale identity guard still work
 *
 * Run: node scripts/issue-100-docked-hails-test.mjs
 */
import { register } from 'node:module';

register('./css-hook.mjs', import.meta.url);

import * as THREE from 'three';
import { installDomStubs } from './lib/boot-harness.mjs';

const dom = installDomStubs();
globalThis.window.location = { search: '', href: 'http://127.0.0.1/issue-100' };
try { globalThis.window.rimward = undefined; } catch { /* ignore */ }

const { initHail } = await import('../src/systems/hail.js');
const { initAgentApi } = await import('../src/systems/agent-api.js');
const { COMMODITIES } = await import('../src/game/state.js');
const { dropDeferredHail } = await import('../src/systems/overlay-policy.js');

let fails = 0;
function pin(name, ok, detail) {
  if (ok) {
    console.log('ok', name);
    return;
  }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 700));
}

// ---- Fixture ctx ----------------------------------------------------------
const playerObj = new THREE.Object3D();
const emitted = [];
const ctx = {
  flags: {
    paused: false,
    docked: false,
    berthHold: false,
    berthOpen: false,
    chartOpen: false,
    hailOpen: false,
    combat: false,
    camera: 'chase',
  },
  world: {
    time: 300,
    credits: 4000,
    fear: 0,
    scanner: 0,
    miningLaser: 0,
    currentSystem: 'freehold',
    prices: { provisions: COMMODITIES.provisions.base },
    nav: {},
    jobs: [],
    milestones: [],
    contacts: [],
  },
  ship: { object: playerObj, velocity: { x: 0, y: 0, z: 0 }, speed: 0 },
  player: { hull: 10, hullMax: 10 },
  input: { throttle: 0, weaponGroup: 1, fullStop: false, hailPressed: false, dockPressed: false },
  bio: { mood: 'serene', hunger: 0, wounds: 0, bond: 0 },
  gate: {},
  station: {},
  targets: { current: null },
  ships: [],
  pods: [],
  cargo: [],
  cargoCapacity: 20,
  agent: { optIn: true, lastIntent: { name: '', ok: true, error: '', token: '', t: 0 }, events: [] },
  events: [],
  lastEvents: [],
  autopilot: { engaged: false },
  automine: { engaged: false },
  emit(type, ev) {
    const row = ev && typeof ev === 'object' ? { ...ev, type } : { type };
    ctx.events.push(row);
    emitted.push(row);
  },
};

const hail = initHail(ctx);
initAgentApi(ctx);
const rw = globalThis.window.rimward;
pin('rimward handle present', !!(rw && typeof rw.act === 'function' && typeof rw.observe === 'function'));

const DT = 1 / 60;
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    hail.update(DT, ctx);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

let shipSeq = 0;
function makeShip(name, pilot) {
  shipSeq++;
  const object = new THREE.Object3D();
  object.position.set(120 + shipSeq * 10, 0, 0);
  const ship = {
    id: `i100-${shipSeq}`,
    role: 'pirate',
    record: { id: `i100-${shipSeq}`, name, pilot, faction: 'redledger', role: 'pirate' },
    state: {
      name,
      faction: 'redledger',
      bookValue: 900,
      resolve: 40,
      cargo: [{ commodity: 'provisions', units: 6 }],
      disabled: false,
      destroyed: false,
      surrendered: false,
      hull: 8,
      hullMax: 10,
    },
    ai: { calmUntil: 0, intent: true, mode: 'hunt', target: 'player' },
    object,
  };
  ctx.ships.push(ship);
  return ship;
}

/** Everything a resolution would move. Compared before/after every refusal. */
function snapshotEffects(ship) {
  return JSON.stringify({
    credits: ctx.world.credits,
    fear: ctx.world.fear,
    pods: ctx.pods.length,
    cargo: ship.state.cargo.map((r) => `${r.commodity}:${r.units}`).join(','),
    surrendered: ship.state.surrendered,
    mode: ship.ai.mode,
    target: ship.ai.target,
    calmUntil: ship.ai.calmUntil,
    demandOutcome: ship.ai.demandOutcome ?? null,
    demanding: ship.ai.demanding ?? null,
  });
}

function closeCard() {
  ctx.emit('hailClosed', {});
  tick(2);
  try { dropDeferredHail(); } catch { /* fixture cleanup */ }
}

function openHail(ev) {
  ctx.emit('hailOpened', ev);
  tick(1);
}

function hailBlock() {
  return rw.observe().hail;
}

function cardDisplay() {
  for (const node of dom.walkDom(globalThis.document.body)) {
    // The stub mirrors the real tree through `.parent`; the card's parent is
    // the fixed root hail.js shows and hides.
    if (node.className === 'rw-hail-card' && node.parent && node.parent.style) {
      return node.parent.style.display;
    }
  }
  return null;
}

function cardButtons() {
  const out = [];
  for (const node of dom.walkDom(globalThis.document.body)) {
    if (node.tagName === 'BUTTON' && typeof node.textContent === 'string'
      && /^\[\d\]\s/.test(node.textContent)) {
      out.push(node);
    }
  }
  return out;
}

/** The berth takes the ship. Only the flag station.js dock() writes. */
function dock() {
  ctx.flags.docked = true;
}

function undock() {
  ctx.flags.docked = false;
}

const SURRENDER = ['demandRansom', 'acceptTribute', 'letGo', 'keepFiring'];

// ---- 1. An incoming surrender never opens while docked ---------------------
{
  dock();
  const caller = makeShip('Desk Caller', 'Sten Ilo');
  const before = snapshotEffects(caller);
  emitted.length = 0;
  // berthOpen stays FALSE: the station panel is ui.open, not the berth-records
  // overlay, so the pre-#100 overlay mutex never saw this case at all.
  pin('berth records overlay is not what holds the desk', ctx.flags.berthOpen === false);
  openHail({ ship: caller, intents: SURRENDER, line: 'They are breaking.' });
  tick(20);
  pin('docked incoming surrender opens no card',
    ctx.flags.hailOpen === false && hailBlock().open === false && cardDisplay() !== 'block',
    { hailOpen: ctx.flags.hailOpen, display: cardDisplay(), block: hailBlock() });
  pin('docked incoming surrender grants nothing', snapshotEffects(caller) === before,
    { before, after: snapshotEffects(caller) });
  pin('docked incoming surrender emits no npcSurrendered',
    !emitted.some((e) => e.type === 'npcSurrendered' || e.type === 'fearChanged'),
    emitted.map((e) => e.type));

  // The same call once the ship has launched opens normally: the boundary is
  // the berth, not a permanent gag on this hull.
  undock();
  openHail({ ship: caller, intents: SURRENDER, line: 'They are breaking.' });
  pin('the same hull is heard again after launch',
    hailBlock().open === true && hailBlock().kind === 'surrender' && cardDisplay() === 'block',
    hailBlock());
  closeCard();
}

// ---- 2. A card already up closes on docking, granting nothing --------------
{
  undock();
  const caught = makeShip('Mid Parley', 'Vell Ord');
  openHail({ ship: caught, intents: SURRENDER, line: 'They are breaking.' });
  pin('surrender card is open before docking',
    hailBlock().open === true && hailBlock().kind === 'surrender', hailBlock());
  const before = snapshotEffects(caught);
  emitted.length = 0;
  dock();
  tick(2);
  pin('docking closes the open surrender card',
    hailBlock().open === false && ctx.flags.hailOpen === false && cardDisplay() !== 'block',
    { block: hailBlock(), display: cardDisplay() });
  pin('the dock close grants no reward', snapshotEffects(caught) === before,
    { before, after: snapshotEffects(caught) });
  pin('the dock close emits a plain hailClosed and no surrender',
    emitted.some((e) => e.type === 'hailClosed' && e.ship === caught)
    && !emitted.some((e) => e.type === 'npcSurrendered')
    && !emitted.some((e) => e.type === 'fearChanged')
    && !emitted.some((e) => e.type === 'commLine'),
    emitted.map((e) => e.type));
  // It must not creep back while the pilot is still at the desk.
  tick(60);
  pin('the closed card does not reopen at the desk',
    hailBlock().open === false && cardDisplay() !== 'block', hailBlock());
  undock();
  tick(60);
  pin('the closed card does not reappear after launch',
    hailBlock().open === false && cardDisplay() !== 'block', hailBlock());
  closeCard();
}

// ---- 3. The transition window: every resolution path refuses ---------------
// The card is still rendered in the frame the berth takes the ship. A human
// click, a number key, the in-process card API and the public handle must all
// refuse and move nothing.
{
  undock();
  const window3 = makeShip('Transition', 'Ora Bane');
  openHail({ ship: window3, intents: SURRENDER, line: 'They are breaking.' });
  const cid = hailBlock().conversationId;
  const buttons = cardButtons();
  pin('the transition fixture has a rendered ransom button',
    buttons.length === SURRENDER.length && buttons[0].textContent.includes('Demand ransom'),
    buttons.map((b) => b.textContent));

  // Dock WITHOUT ticking: the card has not been closed yet.
  dock();
  pin('the card is still on screen inside the transition window',
    cardDisplay() === 'block' && ctx.flags.hailOpen === true, cardDisplay());

  const before = snapshotEffects(window3);
  emitted.length = 0;

  buttons[0].click(); // human click on "Demand ransom"
  pin('a click in the transition window resolves nothing',
    snapshotEffects(window3) === before && emitted.length === 0,
    { before, after: snapshotEffects(window3), emitted: emitted.map((e) => e.type) });

  dom.dispatchKey('Digit1'); // number-key shortcut
  pin('a digit key in the transition window resolves nothing',
    snapshotEffects(window3) === before && emitted.length === 0,
    { before, after: snapshotEffects(window3), emitted: emitted.map((e) => e.type) });

  const direct = ctx.hailApi.resolve('demandRansom');
  const directBound = ctx.hailApi.resolve('demandRansom', cid);
  const directUnlisted = ctx.hailApi.resolve('payTribute');
  pin('the card API refuses with the stable docked token',
    direct === 'docked' && directBound === 'docked' && directUnlisted === 'docked',
    { direct, directBound, directUnlisted });

  const publicAct = rw.act({ v: 2, name: 'hailResolve', args: { intent: 'demandRansom' } });
  const publicBound = rw.act({
    v: 2,
    name: 'hailResolve',
    args: { intent: 'demandRansom', expectedConversationId: cid },
  });
  const publicIndex = rw.act({ v: 2, name: 'hailResolve', args: { index: 1 } });
  const publicJunk = rw.act({
    v: 2,
    name: 'hailResolve',
    args: { intent: 'demandRansom', expectedConversationId: '__proto__' },
  });
  pin('public hailResolve refuses with the stable docked token',
    publicAct.ok === false && publicAct.token === 'docked'
    && publicBound.ok === false && publicBound.token === 'docked'
    && publicIndex.ok === false && publicIndex.token === 'docked'
    && publicJunk.ok === false && publicJunk.token === 'docked',
    { publicAct, publicBound, publicIndex, publicJunk });
  pin('the docked token is the one selectTarget already uses',
    rw.act({ v: 2, name: 'selectTarget' }).token === 'docked');

  pin('no refusal in the transition window moved anything',
    snapshotEffects(window3) === before && emitted.length === 0
    && ctx.world.credits === 4000,
    { before, after: snapshotEffects(window3), emitted: emitted.map((e) => e.type) });
  pin('discovery agrees with act() while docked',
    rw.observe().availability.hailResolve.ok === false
    && rw.observe().availability.hailResolve.reason === 'docked',
    rw.observe().availability.hailResolve);

  tick(2);
  pin('the transition card is closed by the berth, still unpaid',
    hailBlock().open === false && snapshotEffects(window3) === before,
    { block: hailBlock(), after: snapshotEffects(window3) });
  undock();
  closeCard();
}

// ---- 4. A deferred hail is dropped on docking ------------------------------
{
  undock();
  const deferred = makeShip('Deferred Voice', 'Kel Ban');
  ctx.flags.chartOpen = true; // the galaxy chart owns the screen: hail defers
  openHail({ ship: deferred, intents: SURRENDER, line: 'They are breaking.' });
  tick(2);
  pin('the chart defers the hail rather than opening it',
    hailBlock().open === false && ctx.flags.hailOpen === false, hailBlock());
  // Closing the chart while still undocked WOULD hand the slot over; instead
  // the pilot docks.
  dock();
  tick(2);
  ctx.flags.chartOpen = false;
  tick(30);
  pin('the deferred hail does not open at the desk',
    hailBlock().open === false && cardDisplay() !== 'block', hailBlock());
  undock();
  tick(120);
  pin('the deferred hail cannot reappear after launch',
    hailBlock().open === false && cardDisplay() !== 'block' && ctx.flags.hailOpen === false,
    hailBlock());
  closeCard();
}

// ---- 5. Demand close semantics on docking are unchanged --------------------
function armDemand(ship, demand) {
  ship.ai.demanding = true;
  ship.ai.demandOutcome = null;
  ship.ai.demandExpiresAt = ctx.world.time + 20;
  openHail({
    ship,
    intents: ['payTribute', 'showTeeth', 'refuseFight'],
    line: 'Your cargo or your hull.',
    demand,
    demandHail: true,
  });
}

{
  undock();
  const pirate = makeShip('Demand Hull', 'Ninth Tooth');
  armDemand(pirate, 90);
  pin('the demand card is open before docking',
    hailBlock().open === true && hailBlock().kind === 'demand', hailBlock());
  ctx.world.credits = 4000;
  emitted.length = 0;
  dock();
  tick(2);
  const closeRow = emitted.find((e) => e.type === 'hailClosed' && e.demandHail === true);
  pin('docking keeps the demand close shape and outcome',
    !!closeRow && closeRow.demandOutcome === 'docked'
    && closeRow.speaker === 'Ninth Tooth' && closeRow.demand === 90
    && pirate.ai.demandOutcome === 'docked' && pirate.ai.demanding === false,
    { closeRow, ai: pirate.ai });
  pin('the docked demand takes no tribute',
    ctx.world.credits === 4000 && pirate.state.surrendered === false, ctx.world.credits);
  pin('the demand card is off the screen',
    hailBlock().open === false && cardDisplay() !== 'block', hailBlock());
  undock();
  closeCard();
}

// A demand that ARRIVES while docked fail-closes with the same outcome, so the
// HUD's "demand broken. You docked." line stays truthful.
{
  dock();
  const late = makeShip('Late Demand', 'Vane Rook');
  late.ai.demanding = true;
  late.ai.demandOutcome = null;
  ctx.world.credits = 4000;
  emitted.length = 0;
  openHail({
    ship: late,
    intents: ['payTribute', 'refuseFight'],
    line: 'Your cargo or your hull.',
    demand: 70,
    demandHail: true,
  });
  tick(2);
  const row = emitted.find((e) => e.type === 'hailClosed' && e.demandHail === true);
  pin('a demand arriving at the desk fail-closes as docked',
    !!row && row.demandOutcome === 'docked' && row.demand === 70
    && late.ai.demandOutcome === 'docked' && late.ai.demanding === false
    && hailBlock().open === false && ctx.world.credits === 4000,
    { row, ai: late.ai });
  undock();
  closeCard();
}

// ---- 6. Undocked behaviour is untouched ------------------------------------
{
  undock();
  const paid = makeShip('Undocked Pay', 'Cass Odo');
  armDemand(paid, 120);
  ctx.world.credits = 4000;
  const liveId = hailBlock().conversationId;

  // The issue #66 stale guard still answers first for a token that moved.
  const staleRes = rw.act({
    v: 2,
    name: 'hailResolve',
    args: { intent: 'payTribute', expectedConversationId: `${liveId}-not-this-one` },
  });
  pin('undocked stale identity still refuses stale, not docked',
    staleRes.ok === false && staleRes.token === 'stale' && ctx.world.credits === 4000,
    staleRes);
  pin('undocked availability is open, not docked',
    rw.observe().availability.hailResolve.ok === true, rw.observe().availability.hailResolve);

  const bound = rw.act({
    v: 2,
    name: 'hailResolve',
    args: { intent: 'payTribute', expectedConversationId: liveId },
  });
  pin('undocked bound resolve still pays the printed demand',
    bound.ok === true && bound.token === '' && ctx.world.credits === 4000 - 120
    && paid.ai.demandOutcome === 'paid' && ctx.flags.hailOpen === false,
    { bound, credits: ctx.world.credits, ai: paid.ai });
  closeCard();
}

{
  // The ordinary human paths still work with the ship in flight.
  undock();
  const clicker = makeShip('Undocked Click', 'Rea Holt');
  armDemand(clicker, 110);
  ctx.world.credits = 4000;
  const payBtn = cardButtons().find((b) => b.textContent.startsWith('[1] Pay tribute'));
  pin('the undocked demand card still prints the pay button',
    !!payBtn && payBtn.textContent === '[1] Pay tribute — 110 UU',
    payBtn && payBtn.textContent);
  payBtn.click();
  pin('an undocked button click still resolves',
    ctx.world.credits === 4000 - 110 && clicker.ai.demandOutcome === 'paid', ctx.world.credits);
  closeCard();

  const keyer = makeShip('Undocked Key', 'Ura Belt');
  armDemand(keyer, 100);
  ctx.world.credits = 4000;
  dom.dispatchKey('Digit1');
  pin('an undocked digit key still resolves',
    ctx.world.credits === 4000 - 100 && keyer.ai.demandOutcome === 'paid', ctx.world.credits);
  closeCard();
}

{
  // And an undocked surrender still pays its ransom through the card API.
  undock();
  const yields = makeShip('Undocked Yield', 'Deel Sallow');
  openHail({ ship: yields, intents: SURRENDER, line: 'They are breaking.' });
  const ransom = hailBlock().terms.amounts.ransom;
  ctx.world.credits = 4000;
  const token = ctx.hailApi.resolve('demandRansom', hailBlock().conversationId);
  pin('an undocked surrender still resolves through the card API',
    token === '' && Number.isFinite(ransom) && ctx.world.credits === 4000 + ransom
    && yields.state.surrendered === true,
    { token, ransom, credits: ctx.world.credits });
  closeCard();
}

if (fails) {
  console.log(`ISSUE-100 DOCKED HAILS FAIL — ${fails}`);
  process.exit(1);
}
console.log('ISSUE-100 DOCKED HAILS PASS');
