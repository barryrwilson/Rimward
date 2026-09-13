/**
 * Issue #147 — a pirate may claim the crew and the hull of a yielded trader
 * and sell the prize.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real npc, traffic, pods,
 * derelict, station, market-supply and save systems over one ctx. Every
 * break below is made the REAL way — a hand-spawned trader broken through
 * the resolve ladder by a hunting pirate (the issue #146/#151 fixture) — so
 * capitulate rolls the pirate's choice from its persisted temper. The roll
 * is pinned by stubbing Math.random for the frames of the break only.
 *
 * Covered:
 *   1  cargo only: the trader runs (#146), no boarding, the #151 scoop
 *   2  crew and cargo: the trader heaves to, the pirate closes and holds
 *      boardSeconds, takes ONE captives row (survivor shape), the hull is a
 *      'crewTaken' derelict (#148), then the pirate scoops its spill
 *   3  crew, cargo and hull: as above, then the trader record ends
 *      'captured', the hull leaves the lane, rec.prize rides the pirate
 *   4  fence: captives and the hull sell at the local station (captiveRansom
 *      outside the Chain, hotHullFence of the hull's value); the Chain pays
 *      its list; the player's purse, fear and receipts are untouched (#99)
 *   5  disturbance: a player hit on the boarder, the player contesting the
 *      prize, or a boarder that vanishes — the trader keeps its crew and runs
 *   6  exclusions: a job quarry and a player-caused break are never boarded
 *   7  persistence: the prize and the captives ride snapshot/restore; a
 *      corrupt prize fails safe; a culled pirate comes back owing its fence
 *      run; a broken pirate spills its captives as survivor pods
 *   8  claim: any passing ship may claim a crewless hull — the player hails
 *      a locked derelict (H), claims it, the hull leaves the lane on the
 *      claimed ledger, the hull's faction docks standing, pirates take more
 *      interest; nothing settles on dock (issue #159): the desk's Claimed
 *      hulls pane offers Keep (an owned hot hangar row with the class kit),
 *      Sell (hotHullFence, the quote shown) and Return (own faction only:
 *      standing back, no pay); a full hangar and a berth with no yard
 *      refuse Keep; a contract hull and a full ledger are not claimable;
 *      the ledger and a kept row ride snapshot/restore
 *
 * Run: npm run test:prize
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { ECON, PRIZE, PRIZE_CLAIM, PIRACY, U, cargoHoldFor } from '../src/game/state.js';
import { sanitizeClaimedHulls, claimableDerelict, settleClaimedHull, claimedHullOptions } from '../src/game/derelict.js';
import { CLAIM_REFUSE_LINES } from '../src/systems/shipyard-desk.js';
import { EVENT_TYPES } from '../src/game/agent-schema.js';
import { prizeOdds, hullPrizeValue, sellCaptives, sanitizePrizeRecord, rollTaste, tasteOf, rollPrizeChoice, PRIZE_TASTES } from '../src/game/prize.js';
import { TRAFFIC_LIST_UU } from '../src/game/trafficking.js';
import { spillShipCargo, playerInterestChance } from '../src/systems/npc.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

seedBootRandom();
const seededRandom = Math.random;
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();

const DT = 1 / 60;
const allEvents = [];
const mine = new Set();
/** Tick; every live hull the harness did not spawn is culled so lane traffic never contests a fixture. */
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    allEvents.push(...ctx.events);
    ctx.lastEvents = ctx.events; ctx.events = [];
    for (let j = ctx.ships.length - 1; j >= 0; j--) {
      const s = ctx.ships[j];
      if (mine.has(s)) continue;
      ctx.ships.splice(j, 1);
      binds.removeLiveShip(ctx, s);
      if (s.record) s.record.live = false;
    }
  }
}
/** Tick with the player parked at `at`: the new-game launch leaves a residual velocity that would walk the bubble away. */
function tickHeld(n, at = FAR) {
  for (let i = 0; i < n; i++) {
    tick(1);
    ctx.ship.object.position.copy(at);
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
  }
}
const mark = () => allEvents.length;
const linesSince = (m) => allEvents.slice(m).filter((e) => e.type === 'commLine').map((e) => `${e.from ?? ''}: ${e.text}`);
const receiptsSince = (m, type) => allEvents.slice(m).filter((e) => e.type === type);
const units = (cargo) => cargo.reduce((n, c) => n + (c.units | 0), 0);
const ownPods = (live) => ctx.pods.filter((p) => p.spilledBy === live.record.id);
const captiveRows = (cargo) => cargo.filter((c) => c.commodity === 'survivor');

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
for (const rec of ctx.world.records) rec.live = false;

// Far from the lane and the station so traffic spawns nothing into the bubble.
const FAR = new THREE.Vector3(20000, 20000, 20000);
ctx.ship.object.position.copy(FAR);
ctx.flags.docked = false;
ctx.targets.current = null;
ctx.flags.combat = false;
const SYS = ctx.world.currentSystem;
const STATION = ctx.config.world.stationPosition;
const STATION_FACTION = ctx.systems?.[SYS]?.faction ?? null;

let seq = 0;
function spawn(role, classKey, extra = {}) {
  seq++;
  const rec = {
    id: `i147-${seq}`, name: `I147 ${role} ${seq}`, classKey, faction: role === 'pirate' ? 'redledger' : 'freehold', role,
    resolve: 80, personality: 0, cargo: extra.cargo ?? [], system: SYS, state: 'enroute',
    route: [{ x: FAR.x + 60, y: FAR.y, z: FAR.z + 60 }, { x: FAR.x + 600, y: FAR.y, z: FAR.z + 60 }],
    leg: 0, legT: 0, dir: 1,
  };
  if (role === 'pirate') { rec.temper = 1; rec.taste = 'hull'; } // a greedy prize-crew captain: odds hull 0.65, crew 0.20, cargo 0.15
  const at = extra.at ?? new THREE.Vector3(FAR.x + 60 + seq * 40, FAR.y, FAR.z + 60);
  const live = binds.spawnLiveShip(ctx, rec, at);
  if (!live) return null;
  live.object.quaternion.identity();
  if (role === 'pirate') {
    live.ai.demandSent = true; // TEST SETUP: no demand hail interrupts the loop
    live.ai.playerRolled = true; // the interest roll is fixed off —
    live.ai.playerInterested = false; // this pirate works the trader
    live.ai.resolveAt = ctx.world.time + 1e6;
  }
  ctx.world.records.push(rec); // the snapshot, the bank sweep and the fold see a real record
  rec.live = true;
  ctx.ships.push(live);
  mine.add(live);
  return live;
}
function despawn(live) {
  if (!live) return;
  mine.delete(live);
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  binds.removeLiveShip(ctx, live);
  if (live.record) live.record.live = false;
}
function breakNext(live, by) {
  live.state.personality = -100; // computeResolve clamps to 0 → 'capitulate'
  live.state.lastCombatAt = ctx.world.time;
  live.ai.calmUntil = 0;
  live.ai.band = 'defiant';
  live.ai.resolveAt = 0;
  live.ai.lastAttacker = by; // who broke it decides who may board
}
/**
 * Put the pirate on a trader and break the trader the real way, with the
 * choice roll pinned: `roll` is what Math.random returns for the frames of
 * the break (taste hull, temper 1 → < 0.65 hull, < 0.85 crew, else cargo).
 */
function breakTrader(pirate, trader, roll, by = pirate) {
  pirate.ai.mode = 'hunt';
  pirate.ai.target = trader;
  pirate.ai.phase = 'attack';
  pirate.ai.phaseStart = ctx.world.time - 3.05;
  tick(1);
  breakNext(trader, by);
  const m = mark();
  Math.random = () => roll;
  try {
    for (let i = 0; i < 300; i++) {
      tickHeld(1);
      if (receiptsSince(m, 'npcSurrendered').some((e) => e.ship === trader)) break;
    }
  } finally {
    Math.random = seededRandom;
  }
  return m;
}
/** Tick until the pirate's boarding hold has begun. */
function waitHold(pirate, n = 60 * 30) {
  for (let i = 0; i < n; i++) {
    tickHeld(1);
    if (pirate.ai.board && pirate.ai.board.holdAt > 0) return true;
    if (!pirate.ai.board) return false;
  }
  return false;
}
const clearPods = () => {
  for (const p of ctx.pods) ctx.scene.remove(p.mesh);
  ctx.pods.length = 0;
};
const surrendered = (m, trader) => receiptsSince(m, 'npcSurrendered').filter((e) => e.ship === trader);

const pirate = spawn('pirate', 'cutter');
const HOLD = cargoHoldFor('cutter');
const odds = prizeOdds(1, 'hull');
pin('0 fixture: a cutter pirate, temper 1, taste hull, with room in its hold and pinned odds', !!pirate && HOLD > 0 && units(pirate.state.cargo) === 0
  && Math.abs(odds.hull - 0.65) < 1e-9 && Math.abs(odds.crew - 0.2) < 1e-9 && odds.hull + odds.crew < 1, { HOLD, odds });
pin('0b odds are bounded for any temper and taste (0, 1, NaN, unknown)', [0, 1, NaN, 5, -3].every((t) => ['cargo', 'crew', 'hull', 'junk', undefined].every((k) => { const o = prizeOdds(t, k); return o.hull >= 0 && o.crew >= 0 && o.hull + o.crew <= 1; })));
// Pirates differ in how they like to be paid: the taste is rolled ONCE per record and persisted.
pin('0c a temper-0 cargo raider never boards; a slaver boards more often than not; a prize-crew captain wants the hull',
  prizeOdds(0, 'cargo').hull === 0 && prizeOdds(0, 'cargo').crew === 0 && prizeOdds(0, 'crew').crew >= 0.35 && prizeOdds(1, 'crew').crew + prizeOdds(1, 'crew').hull > 0.5
  && prizeOdds(0, 'hull').hull >= 0.3 && prizeOdds(1, 'hull').hull > prizeOdds(1, 'hull').crew, { c: prizeOdds(0, 'cargo'), s: prizeOdds(1, 'crew'), h: prizeOdds(1, 'hull') });
pin('0d rollTaste walks PRIZE.tasteWeights in order (cargo, crew, hull) and fails closed to cargo', rollTaste(0) === 'cargo' && rollTaste(0.49) === 'cargo' && rollTaste(0.51) === 'crew' && rollTaste(0.79) === 'crew' && rollTaste(0.81) === 'hull' && rollTaste(0.999) === 'hull' && rollTaste(NaN) === 'cargo' && PRIZE_TASTES.length === 3);
{
  const r = {};
  const first = tasteOf(r, () => 0.9);
  const again = tasteOf(r, () => 0.1);
  const bad = { taste: 'gold' };
  const healed = tasteOf(bad, () => 0.6);
  pin('0e tasteOf rolls once and persists on the record; an unknown value re-rolls; the roll never touches temper', first === 'hull' && again === 'hull' && r.taste === 'hull' && healed === 'crew' && bad.taste === 'crew' && !Object.hasOwn(r, 'temper'), { r, bad });
  const counts = { cargo: 0, crew: 0, hull: 0 };
  for (let i = 0; i < 300; i++) { const rr = { temper: 0.5, taste: 'crew' }; counts[rollPrizeChoice(rr, {}, () => (i + 0.5) / 300)]++; }
  pin('0f a mid-temper slaver takes the crew about half the time, the hull rarely, cargo the rest', counts.crew > 120 && counts.crew < 200 && counts.hull > 0 && counts.hull < 40 && counts.cargo > 60, counts);
  const gold = { taste: 'gold', prize: undefined };
  delete gold.prize;
  sanitizePrizeRecord(gold);
  pin('0g save-time: an unknown taste is dropped (re-rolled on first sight); a known one is kept', !Object.hasOwn(gold, 'taste') && (() => { const k = { taste: 'crew' }; sanitizePrizeRecord(k); return k.taste === 'crew'; })());
}

// ---- 1  cargo only -------------------------------------------------------------
{
  const trader = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 4 }] });
  const fear0 = ctx.world.fear;
  const m = breakTrader(pirate, trader, 0.95);
  const rcpt = surrendered(m, trader);
  pin('1a the trader yields (jettison, causer world) with no boarding on the receipt', rcpt.length === 1 && rcpt[0].outcome === 'jettison' && rcpt[0].causer === 'world' && rcpt[0].boarding === undefined, rcpt.map((e) => [e.outcome, e.causer, e.boarding]));
  tickHeld(2);
  pin('1b the trader runs for a refuge (#146) and is held by nobody', trader.ai.mode === 'flee' && !trader.ai.heldBy, { mode: trader.ai.mode, heldBy: !!trader.ai.heldBy });
  pin('1c the pirate opens no boarding; it scoops its spill (#151)', pirate.ai.board === null || pirate.ai.board === undefined, pirate.ai.board);
  let done = false;
  for (let i = 0; i < 60 * 60 && !done; i++) { tickHeld(1); done = ownPods(pirate).length === 0 && !pirate.ai.scoop; }
  pin('1d …and its hold gains the spill', done && units(pirate.state.cargo) === 4 && receiptsSince(m, 'npcPrizeTaken').length === 0, pirate.record.cargo);
  pin('1e the player earns nothing for a break they did not cause', ctx.world.fear === fear0 && receiptsSince(m, 'podCollected').length === 0);
  despawn(trader);
  clearPods();
  pirate.state.cargo.length = 0;
  pirate.ai.fence = null;
  tickHeld(5);
}

// ---- 2  crew and cargo ----------------------------------------------------------
{
  const trader = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 3 }] });
  const fear0 = ctx.world.fear;
  const credits0 = ctx.world.credits;
  pirate.record.taste = 'crew'; // this break: a slaver (odds crew 0.70, hull 0.08 at temper 1; 0.7 → crew)
  const m = breakTrader(pirate, trader, 0.7);
  pirate.record.taste = 'hull';
  const rcpt = surrendered(m, trader);
  pin('2a the receipt names the boarding choice (crew), causer world', rcpt.length === 1 && rcpt[0].boarding === 'crew' && rcpt[0].causer === 'world', rcpt.map((e) => [e.outcome, e.causer, e.boarding]));
  pin('2b the trader heaves to: engines dark, a crawl, held for the pirate', trader.ai.mode === 'drift' && trader.ai.heldBy === pirate && trader.object.userData.glow.visible === false
    && trader.ai.driftVel.length() <= 4, { mode: trader.ai.mode, v: trader.ai.driftVel.length() });
  pin('2c the pirate drops its target and opens the boarding', pirate.ai.target === null && !!pirate.ai.board && pirate.ai.board.prize === trader && pirate.ai.board.choice === 'crew', pirate.ai.board && { choice: pirate.ai.board.choice });
  pin('2d both hulls say so once; the slaver names the crew', linesSince(m).filter((l) => l.includes('Heaving to')).length === 1 && linesSince(m).filter((l) => l.includes('Stand by to be boarded. Your crew comes with us.')).length === 1, linesSince(m));
  const held = waitHold(pirate);
  const d = pirate.object.position.distanceTo(trader.object.position);
  pin('2e the pirate closes to contact plus boardRange and holds there', held && d < 100 && pirate.ai.velocity.length() < 20, { held, d, v: pirate.ai.velocity.length() });
  const holdAt = pirate.ai.board.holdAt;
  const podsBefore = ownPods(pirate).length;
  let taken = false;
  for (let i = 0; i < 60 * 40 && !taken; i++) { tickHeld(1); taken = receiptsSince(m, 'npcPrizeTaken').length > 0; }
  const prize = receiptsSince(m, 'npcPrizeTaken');
  pin('2f after boardSeconds the crew is taken: one npcPrizeTaken (crew, 1 captive, causer world)', prize.length === 1 && prize[0].ship === pirate && prize[0].prize === trader
    && prize[0].choice === 'crew' && prize[0].captives === 1 && prize[0].causer === 'world' && prize[0].targetId === trader.record.id
    && prize[0].t - holdAt >= PRIZE.boardSeconds - DT * 2, prize.map((e) => [e.choice, e.captives, e.causer, e.t - holdAt]));
  const rows = captiveRows(pirate.record.cargo);
  pin('2g the captives row is the wave-60 survivor shape on the record\'s own manifest', rows.length === 1 && rows[0].units === 1 && rows[0].faction === 'freehold' && rows[0].source === 'other'
    && rows[0].name === trader.record.name && pirate.state.cargo === pirate.record.cargo, rows);
  pin('2h the hull is a derelict (#148) with reason crewTaken, hold empty, crew gone', trader.record.state === 'derelict' && trader.record.derelict?.reason === 'crewTaken'
    && trader.record.cargo.length === 0 && trader.ai.heldBy === null && trader.ai.survivorsSpawned === true && trader.ai.mode === 'drift', { state: trader.record.state, d: trader.record.derelict });
  pin('2i the derelict has its recovery-board wreck entry', ctx.world.aftermath.some((a) => a.derelictId === trader.record.id), ctx.world.aftermath.map((a) => a.derelictId));
  pin('2j the boarding closes and the pirate scoops the spill it tagged', pirate.ai.board === null && (!!pirate.ai.scoop || podsBefore === 0), { scoop: !!pirate.ai.scoop, podsBefore });
  let done = false;
  for (let i = 0; i < 60 * 60 && !done; i++) { tickHeld(1); done = ownPods(pirate).length === 0 && !pirate.ai.scoop; }
  pin('2k …and holds it beside the captives', done && units(pirate.state.cargo) === 4 && captiveRows(pirate.state.cargo).length === 1, pirate.record.cargo);
  pin('2l captives aboard send the pirate to fence even with a light hold', !!pirate.ai.fence, pirate.ai.fence);
  pin('2m the player earns nothing: fear, purse and receipts untouched', ctx.world.fear === fear0 && ctx.world.credits === credits0
    && receiptsSince(m, 'podCollected').length === 0 && receiptsSince(m, 'survivorSold').length === 0 && receiptsSince(m, 'fearChanged').length === 0);
  pin('2n a later kill of the derelict dumps no crew pods (the crew is aboard the pirate)', trader.ai.survivorsSpawned === true);
  despawn(trader);
  clearPods();
  pirate.state.cargo.length = 0;
  pirate.ai.fence = null;
  tickHeld(5);
}

// ---- 3  crew, cargo and hull ----------------------------------------------------
{
  const trader = spawn('trader', 'freighter'); // an empty hold: the cutEngines yield
  const m = breakTrader(pirate, trader, 0.1);
  const rcpt = surrendered(m, trader);
  pin('3a a cutEngines yield can be boarded too; the receipt names hull', rcpt.length === 1 && rcpt[0].outcome === 'cutEngines' && rcpt[0].boarding === 'hull', rcpt.map((e) => [e.outcome, e.boarding]));
  pin('3b the prize-crew captain says it is taking her, in its own words', linesSince(m).some((l) => l.includes('Prize crew coming across')) && !linesSince(m).some((l) => l.includes('We are taking her')), linesSince(m));
  waitHold(pirate);
  let taken = false;
  for (let i = 0; i < 60 * 40 && !taken; i++) { tickHeld(1); taken = receiptsSince(m, 'npcPrizeTaken').length > 0; }
  const prize = receiptsSince(m, 'npcPrizeTaken');
  pin('3c npcPrizeTaken names the hull choice and one captive', prize.length === 1 && prize[0].choice === 'hull' && prize[0].captives === 1 && prize[0].targetName === trader.record.name, prize.map((e) => [e.choice, e.captives]));
  pin('3d the trader record ends captured (it leaves the finite population)', trader.record.state === 'captured' && !trader.record.derelict, { state: trader.record.state });
  tickHeld(3);
  pin('3e the hull leaves the lane by traffic\'s despawn pass', !ctx.ships.includes(trader) && trader.record.live === false, { live: ctx.ships.includes(trader) });
  const p = pirate.record.prize;
  pin('3f rec.prize rides the pirate, JSON-plain', !!p && p.v === 1 && p.id === trader.record.id && p.name === trader.record.name && p.classKey === 'freighter' && p.system === SYS
    && Number.isFinite(p.takenAt) && JSON.stringify(p) === JSON.stringify(JSON.parse(JSON.stringify(p))), p);
  pin('3g the captives are aboard and the pirate owes a fence run', captiveRows(pirate.record.cargo).length === 1 && !!pirate.ai.fence, { rows: captiveRows(pirate.record.cargo), fence: pirate.ai.fence });
  mine.delete(trader);
  despawn(trader);
  clearPods();
}

// ---- 4  fence ---------------------------------------------------------------------
{
  const NEAR = new THREE.Vector3(STATION.x + 260, STATION.y, STATION.z + 260);
  ctx.ship.object.position.copy(NEAR); // the player moves FIRST, or traffic's range cull folds the pirate
  pirate.object.position.set(STATION.x + 420, STATION.y, STATION.z + 380);
  pirate.object.quaternion.identity();
  const credits0 = pirate.record.credits ?? 0;
  const playerCredits0 = ctx.world.credits;
  const fear0 = ctx.world.fear;
  const m = mark();
  let sold = false;
  for (let i = 0; i < 60 * 90 && !sold; i++) {
    tickHeld(1, NEAR);
    sold = receiptsSince(m, 'npcFenced').some((e) => e.ship === pirate);
  }
  const rcpt = receiptsSince(m, 'npcFenced').filter((e) => e.ship === pirate);
  const V = hullPrizeValue('freighter');
  const [lo, hi] = ECON.hotHullFence;
  const perHead = STATION_FACTION === 'gilded' ? TRAFFIC_LIST_UU.other : PRIZE.captiveRansom;
  const gained = (pirate.record.credits ?? 0) - credits0;
  pin('4a the sale closes at the pad: one npcFenced with the captive and the hull', sold && rcpt.length === 1 && rcpt[0].captives === 1 && rcpt[0].units === 0
    && rcpt[0].hull && rcpt[0].hull.classKey === 'freighter' && typeof rcpt[0].hull.id === 'string', rcpt.map((e) => [e.units, e.captives, e.hull, e.credits]));
  pin('4b the purse gains the captive ransom plus hotHullFence of the hull\'s value', rcpt.length === 1 && rcpt[0].credits === gained
    && gained >= perHead + Math.round(V * lo) && gained <= perHead + Math.round(V * hi) && Number.isInteger(pirate.record.credits), { gained, perHead, V, lo, hi });
  pin('4c the prize and the captives leave the record', !Object.hasOwn(pirate.record, 'prize') && captiveRows(pirate.record.cargo).length === 0, pirate.record);
  pin('4d one comm line marks the prize sale', linesSince(m).filter((l) => l.startsWith(`${pirate.state.name}:`) && l.includes('Prize fenced')).length === 1, linesSince(m));
  pin('4e the player\'s purse, fear and receipts are untouched', ctx.world.credits === playerCredits0 && ctx.world.fear === fear0
    && receiptsSince(m, 'survivorSold').length === 0 && receiptsSince(m, 'podCollected').length === 0);
  tickHeld(5, NEAR);
  pin('4f the fence run closes; the pirate hunts again', pirate.ai.fence === null && pirate.ai.mode === 'hunt', { fence: pirate.ai.fence, mode: pirate.ai.mode });
  // The Chain pays its list; elsewhere the ransom. Record-side, no hull needed.
  const chain = { cargo: [{ commodity: 'survivor', units: 2, faction: 'freehold', source: 'other' }, { commodity: 'provisions', units: 1 }] };
  const s1 = sellCaptives(chain, 'gilded');
  const rim = { cargo: [{ commodity: 'survivor', units: 2, faction: 'freehold', source: 'other' }] };
  const s2 = sellCaptives(rim, 'freehold');
  pin('4g a Gilded Chain station pays TRAFFIC_LIST_UU.other per head; anywhere else the ransom; goods stay', s1.captives === 2 && s1.credits === 2 * TRAFFIC_LIST_UU.other && chain.cargo.length === 1 && chain.cargo[0].commodity === 'provisions'
    && s2.captives === 2 && s2.credits === 2 * PRIZE.captiveRansom && rim.cargo.length === 0 && chain.credits === s1.credits, { s1, s2 });
  ctx.ship.object.position.copy(FAR);
  pirate.object.position.set(FAR.x + 100, FAR.y, FAR.z + 60);
  tickHeld(5);
}

// ---- 5  disturbance ----------------------------------------------------------------
{
  // 5a-c: a player hit on the boarder mid-hold.
  const t1 = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  const m = breakTrader(pirate, t1, 0.7);
  pin('5a fixture: boarding for the crew, hold begun', surrendered(m, t1)[0]?.boarding === 'crew' && waitHold(pirate), { boarding: surrendered(m, t1)[0]?.boarding, board: !!pirate.ai.board });
  pirate.state.lastHitAt = ctx.world.time;
  pirate.ai.lastAttacker = 'player';
  pirate.state.hull -= 1; // a scratch: the retaliation path turns it onto the player
  tickHeld(2);
  pin('5b the boarding breaks off: the trader keeps its crew and runs (#146)', pirate.ai.board === null && t1.ai.heldBy === null && t1.ai.mode === 'flee'
    && receiptsSince(m, 'npcPrizeTaken').length === 0 && captiveRows(pirate.state.cargo).length === 0 && t1.record.state === 'enroute', { board: pirate.ai.board, mode: t1.ai.mode, held: !!t1.ai.heldBy });
  pin('5c the boarder says so and answers the player', linesSince(m).some((l) => l.includes('Boarding off')) && pirate.ai.target === 'player', { target: pirate.ai.target });
  pirate.ai.target = null; pirate.ai.phase = null; pirate.ai.playerInterested = false;
  pirate.state.lastHitAt = -1e9; pirate.ai.lastAttacker = null; pirate.state.hull = pirate.state.hullMax;
  despawn(t1); clearPods(); pirate.state.cargo.length = 0; pirate.ai.scoop = null; pirate.ai.fence = null;
  tickHeld(5);

  // 5d: the player contests the prize (a lock inside contestRange).
  const t2 = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  const m2 = breakTrader(pirate, t2, 0.7);
  pin('5d fixture: boarding for the crew', surrendered(m2, t2)[0]?.boarding === 'crew' && !!pirate.ai.board);
  ctx.targets.current = t2;
  const at = t2.object.position.clone(); at.x += PIRACY.contestRange * 0.5;
  tickHeld(2, at);
  pin('5e the player\'s lock on the prize ends the boarding (#123: their prize); the trader runs', pirate.ai.board === null && t2.ai.heldBy === null && t2.ai.mode === 'flee' && receiptsSince(m2, 'npcPrizeTaken').length === 0, { board: pirate.ai.board, mode: t2.ai.mode });
  ctx.targets.current = null;
  ctx.ship.object.position.copy(FAR);
  despawn(t2); clearPods(); pirate.state.cargo.length = 0; pirate.ai.scoop = null; pirate.ai.fence = null;
  tickHeld(5);

  // 5f: the boarder vanishes (culled, killed): the heaved-to trader runs on its own.
  const t3 = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  const m3 = breakTrader(pirate, t3, 0.7);
  pin('5f fixture: heaved to', surrendered(m3, t3)[0]?.boarding === 'crew' && t3.ai.heldBy === pirate);
  const i = ctx.ships.indexOf(pirate);
  ctx.ships.splice(i, 1); // gone from the world for these frames
  tickHeld(2);
  pin('5g with its boarder gone the trader runs', t3.ai.heldBy === null && t3.ai.mode === 'flee', { held: !!t3.ai.heldBy, mode: t3.ai.mode });
  ctx.ships.push(pirate);
  pirate.ai.board = null;
  despawn(t3); clearPods(); pirate.state.cargo.length = 0; pirate.ai.scoop = null; pirate.ai.fence = null;
  tickHeld(5);

  // 5h: the wait runs out (a boarder that stalls) — the trader runs.
  const t4 = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  const m4 = breakTrader(pirate, t4, 0.7);
  pin('5h fixture: heaved to', surrendered(m4, t4)[0]?.boarding === 'crew' && t4.ai.heldBy === pirate);
  t4.ai.heldSince = ctx.world.time - PRIZE.heaveSeconds - 1;
  tickHeld(2);
  pin('5i after heaveSeconds with no boarding done the trader runs', t4.ai.heldBy === null && t4.ai.mode === 'flee', { held: !!t4.ai.heldBy, mode: t4.ai.mode });
  pirate.ai.board = null;
  despawn(t4); clearPods(); pirate.state.cargo.length = 0; pirate.ai.scoop = null; pirate.ai.fence = null;
  tickHeld(5);
}

// ---- 6  exclusions ------------------------------------------------------------------
{
  // 6a: a job quarry is never boarded — jobs stay solvable.
  const t1 = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  ctx.world.jobs = ctx.world.jobs ?? [];
  const job = { id: 'i147-job', kind: 'hunt', target: t1.record.name, state: 'accepted', system: SYS };
  ctx.world.jobs.push(job);
  const m = breakTrader(pirate, t1, 0.1);
  tickHeld(2);
  pin('6a a hull some job names as its target is never boarded (cargo only; it runs)', surrendered(m, t1)[0]?.boarding === undefined && !pirate.ai.board && t1.ai.mode === 'flee' && t1.record.state === 'enroute', { board: pirate.ai.board, mode: t1.ai.mode });
  ctx.world.jobs.splice(ctx.world.jobs.indexOf(job), 1);
  despawn(t1); clearPods(); pirate.state.cargo.length = 0; pirate.ai.scoop = null; pirate.ai.fence = null;
  tickHeld(5);

  // 6b: a break the PLAYER caused is the player's prize (#99): no boarding.
  const t2 = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  const m2 = breakTrader(pirate, t2, 0.1, 'player');
  tickHeld(2);
  pin('6b a player-caused break is never boarded', surrendered(m2, t2)[0]?.causer === 'player' && surrendered(m2, t2)[0]?.boarding === undefined && !pirate.ai.board && t2.ai.mode === 'flee', { board: pirate.ai.board, mode: t2.ai.mode });
  ctx.world.fear = 0;
  despawn(t2); clearPods(); pirate.state.cargo.length = 0; pirate.ai.scoop = null; pirate.ai.fence = null;
  tickHeld(5);

  // 6c: a crewPods break (crew already in pods) takes the #148 door, not a boarding.
  const t3 = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  t3.state.hull = Math.floor(t3.state.hullMax * 0.3);
  const m3 = breakTrader(pirate, t3, 0.1);
  pin('6c a crewPods yield is a derelict (crewPods), never a boarding', surrendered(m3, t3)[0]?.outcome === 'crewPods' && surrendered(m3, t3)[0]?.boarding === undefined
    && !pirate.ai.board && t3.record.state === 'derelict' && t3.record.derelict?.reason === 'crewPods', { board: pirate.ai.board, state: t3.record.state });
  despawn(t3); clearPods(); pirate.state.cargo.length = 0; pirate.ai.scoop = null; pirate.ai.fence = null;
  tickHeld(5);
}

// ---- 7  persistence -----------------------------------------------------------------
{
  const trader = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  const m = breakTrader(pirate, trader, 0.1);
  waitHold(pirate);
  let taken = false;
  for (let i = 0; i < 60 * 40 && !taken; i++) { tickHeld(1); taken = receiptsSince(m, 'npcPrizeTaken').length > 0; }
  tickHeld(3);
  mine.delete(trader);
  const prize = pirate.record.prize;
  pin('7a fixture: a hull prize and a captive to save', taken && !!prize && captiveRows(pirate.record.cargo).length === 1, { prize, cargo: pirate.record.cargo });
  const snap = JSON.parse(JSON.stringify(binds.snapshot(ctx)));
  const saved = snap.world.records.find((r) => r.id === pirate.record.id);
  const savedTrader = snap.world.records.find((r) => r.id === trader.record.id);
  pin('7b the snapshot carries the prize and the captives row, JSON-plain; the trader is captured', !!saved && JSON.stringify(saved.prize) === JSON.stringify(prize)
    && captiveRows(saved.cargo).length === 1 && saved.cargo.find((c) => c.commodity === 'survivor').name === trader.record.name && savedTrader?.state === 'captured', saved && { prize: saved.prize, cargo: saved.cargo, t: savedTrader?.state });
  binds.restore(ctx, snap);
  const rec2 = ctx.world.records.find((r) => r.id === pirate.record.id);
  pin('7c restore keeps both', !!rec2 && JSON.stringify(rec2.prize) === JSON.stringify(prize) && captiveRows(rec2.cargo).length === 1, rec2 && { prize: rec2.prize, cargo: rec2.cargo });
  for (const [bad, label] of [['lots', 'a string'], [7, 'a number'], [null, 'null'], [[1, 2], 'an array'], [{ v: 2, classKey: 'freighter' }, 'a foreign version']]) {
    const blob = JSON.parse(JSON.stringify(snap));
    blob.world.records.find((r) => r.id === pirate.record.id).prize = bad;
    binds.restore(ctx, blob);
    const r = ctx.world.records.find((x) => x.id === pirate.record.id);
    pin(`7d a corrupt prize (${label}) is dropped, never adopted`, !!r && !Object.hasOwn(r, 'prize') && captiveRows(r.cargo).length === 1, r && { prize: r.prize });
  }
  const odd = JSON.parse(JSON.stringify(snap));
  odd.world.records.find((r) => r.id === pirate.record.id).prize = { v: 1, id: 'x'.repeat(200), name: 12, classKey: 'battleship', takenAt: 'now', system: SYS };
  binds.restore(ctx, odd);
  const r2 = ctx.world.records.find((x) => x.id === pirate.record.id).prize;
  pin('7e an odd prize is bounded and healed (id ≤ 64, name null, unknown class → light, takenAt 0)', !!r2 && r2.id.length === 64 && r2.name === null && r2.classKey === 'light' && r2.takenAt === 0 && r2.system === SYS, r2);
  const bare = { cargo: [] };
  pin('7f sanitizePrizeRecord leaves a record without a prize alone', sanitizePrizeRecord(bare) === false && !Object.hasOwn(bare, 'prize'));
  binds.restore(ctx, snap);
  // The fold: a culled pirate carrying a prize (or captives) comes back owing its fence run.
  const rec3 = ctx.world.records.find((r) => r.id === pirate.record.id);
  for (const s of [...ctx.ships]) despawn(s);
  const back = binds.spawnLiveShip(ctx, rec3, new THREE.Vector3(FAR.x + 100, FAR.y, FAR.z + 60));
  pin('7g re-instantiated with a prize aboard, the pirate owes a fence run', !!back && !!back.ai.fence && back.state.cargo === rec3.cargo, back && { fence: back.ai.fence });
  if (back) binds.removeLiveShip(ctx, back);
  delete rec3.prize;
  const cap = binds.spawnLiveShip(ctx, rec3, new THREE.Vector3(FAR.x + 100, FAR.y, FAR.z + 60));
  pin('7h …so does one with only captives aboard', !!cap && !!cap.ai.fence, cap && { fence: cap.ai.fence });
  if (cap) binds.removeLiveShip(ctx, cap);
  rec3.cargo.length = 0;
  const light = binds.spawnLiveShip(ctx, rec3, new THREE.Vector3(FAR.x + 100, FAR.y, FAR.z + 60));
  pin('7i …an empty one does not', !!light && light.ai.fence === null);
  if (light) binds.removeLiveShip(ctx, light);
  // A broken pirate spills its captives as survivor pods that keep their identity.
  rec3.cargo.push({ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other', name: 'Held Crew' }, { commodity: 'provisions', units: 2 });
  const spiller = binds.spawnLiveShip(ctx, rec3, new THREE.Vector3(FAR.x + 100, FAR.y, FAR.z + 60));
  ctx.ships.push(spiller); mine.add(spiller);
  clearPods();
  const n = spillShipCargo(ctx, spiller);
  const survivorPod = ctx.pods.find((p) => p.contents.some((c) => c.commodity === 'survivor'));
  pin('7j a broken pirate spills its captives as a survivor pod with faction/source/name intact', n === 2 && !!survivorPod
    && survivorPod.contents[0].faction === 'freehold' && survivorPod.contents[0].source === 'other' && survivorPod.contents[0].name === 'Held Crew' && spiller.state.cargo.length === 0, ctx.pods.map((p) => p.contents));
  despawn(spiller);
  clearPods();
}

// ---- 8  claim: a passing ship takes a crewless hull ------------------------------
{
  /** A crewTaken derelict made the real way (a slaver boards, takes the crew). Returns the live trader. */
  function makeCrewTakenDerelict(faction = 'freehold') {
    // Section 7's fold swept every hull out of the world, and a berth visit culls
    // anything left at FAR: each derelict gets its own boarder, retired after.
    const pirate8 = spawn('pirate', 'cutter');
    const trader = spawn('trader', 'freighter', { cargo: [] });
    trader.record.faction = faction; trader.state.faction = faction;
    pirate8.record.taste = 'crew';
    const m = breakTrader(pirate8, trader, 0.7);
    pirate8.record.taste = 'hull';
    waitHold(pirate8);
    let taken = false;
    for (let i = 0; i < 60 * 40 && !taken; i++) { tickHeld(1); taken = receiptsSince(m, 'npcPrizeTaken').length > 0; }
    despawn(pirate8);
    return trader;
  }
  const claimAll = () => ctx.world.claimedHulls ?? [];
  const hailsSince = (m) => receiptsSince(m, 'hailOpened');
  /** Park the player inside hail range of the hull, lock it, press H. */
  function hailDerelict(trader) {
    const at = trader.object.position.clone(); at.x += U.TARGET_RANGE * 0.5;
    ctx.ship.object.position.copy(at); ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
    ctx.targets.current = trader;
    tickHeld(2, at);
    const m = mark();
    dom.dispatchKey('KeyH');
    tickHeld(2, at);
    return { m, at };
  }
  const closeHail = () => { dom.dispatchKey('Escape'); tickHeld(2); ctx.targets.current = null; };

  // 8a-i: the claim.
  const t1 = makeCrewTakenDerelict('freehold');
  pin('8a fixture: a crewTaken derelict in the lane', t1.record.state === 'derelict' && t1.record.derelict?.reason === 'crewTaken' && ctx.ships.includes(t1), { state: t1.record.state });
  const rep0 = ctx.world.reputation?.freehold ?? 0;
  const credits0 = ctx.world.credits;
  const fear0 = ctx.world.fear;
  const probe = { temper: 0.5, taste: 'cargo' };
  const interest0 = playerInterestChance(ctx, probe);
  const { m, at } = hailDerelict(t1);
  const hails = hailsSince(m).filter((e) => e.ship === t1);
  pin('8b H on a locked derelict opens a salvage-family card offering claimHull and letGo', hails.length === 1 && hails[0].salvage === true && hails[0].derelict === true
    && JSON.stringify(hails[0].intents) === JSON.stringify(['claimHull', 'letGo']) && /claims her/.test(hails[0].line), hails.map((e) => [e.intents, e.salvage, e.line]));
  const peek = ctx.hailApi.peek();
  pin('8c the public card reads salvage with the claim verb', !!peek && peek.kind === 'salvage' && Array.isArray(peek.intents) && peek.intents.includes('claimHull'), peek);
  const res = ctx.hailApi.resolve('claimHull');
  tickHeld(3, at);
  const claimed = receiptsSince(m, 'derelictClaimed');
  pin('8d claimHull resolves: the derelict is recovered by the player and the record ends captured', res !== 'stale' && t1.record.state === 'captured' && t1.record.derelict?.outcome === 'recovered' && t1.record.derelict?.claimant === 'player', { res, state: t1.record.state, d: t1.record.derelict });
  pin('8e one derelictClaimed receipt names the hull; the hull leaves the lane', claimed.length === 1 && claimed[0].targetId === t1.record.id && claimed[0].targetName === t1.record.name && claimed[0].classKey === 'freighter'
    && claimed[0].faction === 'freehold' && !ctx.ships.includes(t1), claimed);
  const led = claimAll();
  pin('8f the claimed ledger carries one JSON-plain entry (v, id, name, class, faction, reason, claimedAt, system, repHit)', led.length === 1 && led[0].v === 1 && led[0].id === t1.record.id && led[0].classKey === 'freighter' && led[0].faction === 'freehold'
    && led[0].reason === 'crewTaken' && led[0].system === SYS && Number.isFinite(led[0].claimedAt) && led[0].repHit === PRIZE_CLAIM.repHit
    && JSON.stringify(led[0]) === JSON.stringify(JSON.parse(JSON.stringify(led[0]))), led);
  pin('8g the risk passes with the claim: the hull\'s faction docks standing, and pirates take more interest while it is unsettled', (ctx.world.reputation?.freehold ?? 0) === rep0 - PRIZE_CLAIM.repHit
    && playerInterestChance(ctx, probe) > interest0 && Math.abs(playerInterestChance(ctx, probe) - interest0 - PRIZE_CLAIM.interestPerHull) < 1e-9, { rep: ctx.world.reputation?.freehold, rep0, i0: interest0, i1: playerInterestChance(ctx, probe) });
  pin('8h no pay and no fear at the claim itself; the stale recovery card is pulled', ctx.world.credits === credits0 && ctx.world.fear === fear0
    && ctx.world.aftermath.every((a) => a.derelictId !== t1.record.id || a.expiresAt <= ctx.world.time), { credits: ctx.world.credits, credits0 });
  pin('8i Echo says whose troubles they are now', linesSince(m).some((l) => l.startsWith('Echo:') && /salvage claim logged/.test(l) && /Freehold Compact will not thank you/.test(l)), linesSince(m));
  closeHail();
  mine.delete(t1); despawn(t1);
  ctx.ship.object.position.copy(FAR);
  tickHeld(3);

  // Issue #159: nothing settles on dock. The berth opens the shipyard desk on
  // the Claimed hulls pane and the player picks Keep / Sell / Return per hull.
  function overlay() {
    for (const n of dom.walkDom(document.body)) {
      if (typeof n.className === 'string' && n.className.includes('station-overlay')) return n;
    }
    return null;
  }
  function texts() {
    const ov = overlay();
    if (!ov) return [];
    return [...dom.walkDom(ov)].map((n) => n.textContent).filter((t) => typeof t === 'string');
  }
  const has = (frag) => texts().some((t) => t.includes(frag));
  function button(pred) {
    const ov = overlay();
    if (!ov) return null;
    for (const n of dom.walkDom(ov)) {
      if (n.tagName === 'BUTTON' && typeof n.textContent === 'string' && pred(n.textContent)) return n;
    }
    return null;
  }
  const sellBtn = () => button((t) => /^Sell — \d+ UU$/.test(t));
  const sellQuote = () => { const b = sellBtn(); return b ? Number(/(\d+) UU/.exec(b.textContent)[1]) : NaN; };
  function dockAtYard() {
    const stp = ctx.systems[SYS].station.position;
    const near = new THREE.Vector3(stp[0] + 36, stp[1], stp[2]);
    ctx.ship.object.position.copy(near); ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
    tick(2);
    const m = mark();
    ctx.input.dockPressed = true; tick(3); ctx.input.dockPressed = false;
    return m;
  }
  function launchAgain() {
    ctx.stationDesk.undock();
    for (let i = 0; ctx.flags.docked && i < 40; i++) { tick(30); dom.dispatchKey('Escape'); tick(2); }
    ctx.ship.object.position.copy(FAR); ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
    tickHeld(3);
  }

  // 8j-l: docking settles nothing; at the hull's OWN faction yard Return sends her home — no pay, the standing comes back.
  {
    const m2 = dockAtYard();
    const view = ctx.stationDesk.peekView();
    pin('8j docked at the Freehold yard: the ledger still holds the hull, nothing settled, purse and standing unchanged', ctx.flags.docked === true && receiptsSince(m2, 'hullSettled').length === 0 && claimAll().length === 1
      && (ctx.world.reputation?.freehold ?? 0) === rep0 - PRIZE_CLAIM.repHit && ctx.world.credits === credits0, { settled: receiptsSince(m2, 'hullSettled'), led: claimAll() });
    pin('8j2 the berth opened the shipyard desk on the Claimed hulls pane with the notice and all three verbs', view?.level === 2 && view?.service === 'shipyard' && /claimed hull waits on your papers/.test(view?.notice ?? '')
      && has('CLAIMED HULLS') && has('crew taken · hot') && !!button((t) => t === 'Keep') && !!sellBtn() && !!button((t) => t === 'Return'), { view, texts: texts().filter((t) => /Keep|Sell|Return|CLAIMED/.test(t)) });
    button((t) => t === 'Return')?.click(); tick(1);
    pin('8j3 Return opens a confirm box; Esc cancels it with nothing moved', has('Confirm return') && has('No pay. Her faction gets its hull back') && ctx.stationDesk.peekView()?.pending === true
      && (() => { dom.dispatchKey('Escape'); tick(1); return !has('Confirm return') && claimAll().length === 1 && ctx.stationDesk.peekView()?.pending === false; })(), texts());
    button((t) => t === 'Return')?.click(); tick(1);
    const m2b = mark();
    button((t) => t === 'Confirm return')?.click(); tick(2);
    const settled = receiptsSince(m2b, 'hullSettled');
    pin('8k Confirm return: the Freehold hull is returned — no pay, the standing comes back, the ledger empties, hullSettled says returned', settled.length === 1 && settled[0].outcome === 'returned' && settled[0].credits === 0 && settled[0].hullId === null
      && settled[0].repBack === PRIZE_CLAIM.repHit && (ctx.world.reputation?.freehold ?? 0) === rep0 && ctx.world.credits === credits0 && claimAll().length === 0, { settled, rep: ctx.world.reputation?.freehold });
    pin('8k2 a station line says so and the pane is gone', linesSince(m2b).some((l) => /takes .* back/.test(l)) && !has('CLAIMED HULLS') && has('HANGAR'), linesSince(m2b));
    launchAgain();
    pin('8l launched again', ctx.flags.docked === false);
  }

  // 8m-n: a hull of ANOTHER faction cannot be returned here; Sell pays hotHullFence of its value, the quote shown.
  {
    const t2 = makeCrewTakenDerelict('veridian');
    const rep1 = ctx.world.reputation?.veridian ?? 0;
    hailDerelict(t2);
    const res2 = ctx.hailApi.resolve('claimHull');
    tickHeld(3);
    closeHail();
    pin('8m a Veridian hull claimed: Veridian docks the standing', res2 !== 'stale' && claimAll().length === 1 && claimAll()[0].faction === 'veridian' && (ctx.world.reputation?.veridian ?? 0) === rep1 - PRIZE_CLAIM.repHit, { res2, led: claimAll() });
    mine.delete(t2); despawn(t2);
    dockAtYard();
    const [lo, hi] = ECON.hotHullFence;
    const V = hullPrizeValue('freighter');
    const quote = sellQuote();
    pin('8m2 at the Freehold yard: no Return for a Veridian hull (the note names why), Keep and Sell offered inside the hot band', has('Only her own faction takes her back.') && !button((t) => t === 'Return')
      && !!button((t) => t === 'Keep') && quote >= Math.round(V * lo) && quote <= Math.round(V * hi), { quote, V, texts: texts().filter((t) => /Keep|Sell|Return|faction/.test(t)) });
    const rWrong = settleClaimedHull(ctx, claimAll()[0].id, 'return');
    pin('8m3 settleClaimedHull refuses Return here: faction, nothing moves', rWrong.ok === false && rWrong.reason === 'faction' && claimAll().length === 1, rWrong);
    const c0 = ctx.world.credits;
    sellBtn()?.click(); tick(1);
    pin('8m4 Sell opens a confirm box that names the laundering rate and the same quote', has('Confirm sale') && has(`${quote} UU`) && has('Hot hull. The yard pays the laundering rate, no questions.'), texts());
    const m3 = mark();
    button((t) => t === 'Confirm sale')?.click(); tick(2);
    const settled = receiptsSince(m3, 'hullSettled');
    const gained = ctx.world.credits - c0;
    pin('8n the Freehold yard buys the Veridian hull at the quote shown; Veridian standing stays docked; the ledger empties', settled.length === 1 && settled[0].outcome === 'sold' && settled[0].credits === gained && gained === quote
      && (ctx.world.reputation?.veridian ?? 0) === rep1 - PRIZE_CLAIM.repHit && claimAll().length === 0, { settled, gained, quote, V });
    launchAgain();
  }

  // 8w-z: Keep — the hull joins the hangar as an owned hot row; a full hangar and a berth with no yard refuse.
  {
    const t4 = makeCrewTakenDerelict('veridian');
    const rep2 = ctx.world.reputation?.veridian ?? 0;
    hailDerelict(t4);
    ctx.hailApi.resolve('claimHull');
    tickHeld(3);
    closeHail();
    mine.delete(t4); despawn(t4);
    const entry = claimAll()[0];
    pin('8w fixture: a Veridian freighter on the ledger', !!entry && entry.faction === 'veridian' && entry.classKey === 'freighter', entry);
    dockAtYard();
    const hulls0 = ctx.world.hangar.hulls.length;
    const c1 = ctx.world.credits;
    button((t) => t === 'Keep')?.click(); tick(1);
    pin('8w2 Keep opens a confirm box that says what the hull comes with', has('Confirm keep') && has('She joins the hangar hot: the mounts her class carries'), texts());
    const m4 = mark();
    button((t) => t === 'Confirm keep')?.click(); tick(2);
    const kept = receiptsSince(m4, 'hullSettled');
    const row = ctx.world.hangar.hulls.find((h) => h.id === kept[0]?.hullId);
    pin('8x Confirm keep: hullSettled says kept and names the hangar row; the ledger empties; no pay; Veridian stays docked', kept.length === 1 && kept[0].outcome === 'kept' && kept[0].credits === 0 && kept[0].repBack === 0 && typeof kept[0].hullId === 'string'
      && claimAll().length === 0 && ctx.world.credits === c1 && (ctx.world.reputation?.veridian ?? 0) === rep2 - PRIZE_CLAIM.repHit, { kept, led: claimAll(), rep: ctx.world.reputation?.veridian, rep2 });
    pin('8x2 the hangar gained one hot row of her class, faction and name, unmounted; a freighter seats no turret or launcher, no scanner or laser, empty hold', ctx.world.hangar.hulls.length === hulls0 + 1 && !!row && row.hot === true && row.classKey === 'freighter' && row.faction === 'veridian'
      && row.name === entry.name && row.launcher === '' && row.turret === '' && row.scanner === 0 && row.miningLaser === 0 && row.cargo.length === 0 && row.hullKind === 'built'
      && ctx.world.hangar.mountedId !== row.id, { row, hangar: ctx.world.hangar });
    pin('8x3 the desk shows her in the hangar as hot with a Sell row at the hot-hull rate; the Claimed pane is gone', !has('CLAIMED HULLS') && has('· hot') && !!sellBtn() && sellQuote() >= Math.round(hullPrizeValue('freighter') * ECON.hotHullFence[0]) && sellQuote() <= Math.round(hullPrizeValue('freighter') * ECON.hotHullFence[1]), texts().filter((t) => /hot|Sell/.test(t)));
    const snap = JSON.parse(JSON.stringify(binds.snapshot(ctx)));
    const snapRow = snap.world.hangar.hulls.find((h) => h.id === row.id);
    binds.restore(ctx, snap);
    const back = ctx.world.hangar.hulls.find((h) => h.id === row.id);
    pin('8y the kept row rides snapshot/restore with hot: true', !!snapRow && snapRow.hot === true && !!back && back.hot === true && back.classKey === 'freighter' && back.faction === 'veridian', { snapRow, back });

    // A class that seats mounts keeps the kit it fought with: auto turret, dart rack with an empty magazine.
    {
      const frig = { v: 1, id: 'i159-frig', name: 'Iron Vesper', classKey: 'frigate', faction: 'redledger', reason: 'crewTaken', claimedAt: 0, system: SYS, repHit: PRIZE_CLAIM.repHit };
      ctx.world.claimedHulls = [JSON.parse(JSON.stringify(frig))];
      const rK = settleClaimedHull(ctx, 'i159-frig', 'keep');
      const fr = ctx.world.hangar.hulls.find((h) => h.id === rK.hullId);
      pin('8y2 a kept frigate carries the auto turret and the dart rack with an empty magazine, tier-0 scanner and laser, empty hold, hot', rK.ok === true && !!fr && fr.turret === 'auto' && fr.launcher === 'dart' && fr.missileAmmo === 0
        && fr.scanner === 0 && fr.miningLaser === 0 && fr.cargo.length === 0 && fr.hot === true && fr.classKey === 'frigate' && fr.faction === 'redledger', { rK, fr });
      const snapF = JSON.parse(JSON.stringify(binds.snapshot(ctx)));
      binds.restore(ctx, snapF);
      const fr2 = ctx.world.hangar.hulls.find((h) => h.id === rK.hullId);
      pin('8y3 the kit rides snapshot/restore', !!fr2 && fr2.turret === 'auto' && fr2.launcher === 'dart' && fr2.missileAmmo === 0 && fr2.hot === true, fr2);
      ctx.world.hangar.hulls = ctx.world.hangar.hulls.filter((h) => h.id !== rK.hullId);
    }

    // Refusals: a full hangar, a berth with no yard, a bad verb, a missing entry, not docked.
    const fake = { v: 1, id: 'i159-full', name: 'Stray Hull', classKey: 'cutter', faction: 'veridian', reason: 'crewPods', claimedAt: 0, system: SYS, repHit: PRIZE_CLAIM.repHit };
    ctx.world.claimedHulls = [JSON.parse(JSON.stringify(fake))];
    const hangarSnap = JSON.parse(JSON.stringify(ctx.world.hangar));
    while (ctx.world.hangar.hulls.length < 8) {
      ctx.world.hangar.hulls.push({ id: `hull_pad_${ctx.world.hangar.hulls.length}`, classKey: 'light', faction: 'freehold', hullKind: 'built', name: 'pad' });
    }
    ctx.stationDesk.selectService('shipyard'); tick(1);
    const before = JSON.stringify(ctx.world.hangar);
    const rFull = settleClaimedHull(ctx, 'i159-full', 'keep');
    pin('8z a full hangar refuses Keep: full — the pane says so and offers no Keep button; nothing moves', rFull.ok === false && rFull.reason === 'full' && JSON.stringify(ctx.world.hangar) === before && claimAll().length === 1
      && has('The hangar is full.') && !button((t) => t === 'Keep') && !!sellBtn(), { rFull, texts: texts().filter((t) => /full|Keep/.test(t)) });
    const rStock = settleClaimedHull(ctx, 'i159-full', 'keep', { stationFaction: 'independent' });
    pin('8z2 a berth with no yard refuses Keep: stock', rStock.ok === false && rStock.reason === 'stock' && claimAll().length === 1, rStock);
    pin('8z3 claimedHullOptions: no yard → keep stock, sell open, return only under her own banner', JSON.stringify(claimedHullOptions(ctx, fake, 'independent')) === JSON.stringify({ keep: 'stock', sell: null, return: 'faction' })
      && claimedHullOptions(ctx, fake, 'veridian').return === null && claimedHullOptions(ctx, fake, 'veridian').keep === 'full', claimedHullOptions(ctx, fake, 'independent'));
    const rVerb = settleClaimedHull(ctx, 'i159-full', 'scrap');
    const rMiss = settleClaimedHull(ctx, 'nope', 'sell');
    pin('8z4 a bad verb and a missing entry are refused and named', rVerb.ok === false && rVerb.reason === 'verb' && rMiss.ok === false && rMiss.reason === 'missing' && claimAll().length === 1, { rVerb, rMiss });
    pin('8z5 a refusal line exists for every reason the desk can meet; hullSettled stays off the agent ring', ['dock', 'missing', 'verb', 'stock', 'full', 'faction', 'invalid', 'busy'].every((k) => typeof CLAIM_REFUSE_LINES[k] === 'string') && !EVENT_TYPES.includes('hullSettled'));
    // Sell the fake at a fixed rate: the price is exactly the clamped quote, and a restore keeps the ledger empty.
    const cS = ctx.world.credits;
    const rSell = settleClaimedHull(ctx, 'i159-full', 'sell', { hotRate: 99 });
    pin('8z6 Sell at a fixed rate pays exactly the clamped quote and empties the ledger', rSell.ok === true && rSell.outcome === 'sold' && rSell.credits === Math.round(hullPrizeValue('cutter') * ECON.hotHullFence[1]) && ctx.world.credits === cS + rSell.credits && claimAll().length === 0, rSell);
    const rDock = (() => { ctx.world.claimedHulls = [JSON.parse(JSON.stringify(fake))]; const d = ctx.flags.docked; ctx.flags.docked = false; const r = settleClaimedHull(ctx, 'i159-full', 'sell'); ctx.flags.docked = d; return r; })();
    pin('8z7 not docked: dock', rDock.ok === false && rDock.reason === 'dock' && claimAll().length === 1, rDock);
    ctx.world.claimedHulls = [];
    ctx.world.hangar = hangarSnap;
    launchAgain();
  }

  // 8o-v: not claimable — the player's own recovery contract on it, or a full ledger; persistence.
  {
    const t3 = makeCrewTakenDerelict('freehold');
    ctx.world.jobs = ctx.world.jobs ?? [];
    const job = { id: 'i147-rec', kind: 'recovery', state: 'accepted', wreckId: t3.record.derelict.wreckId, originSystem: SYS, system: SYS, deadline: ctx.world.time + 600, reward: 100 };
    ctx.world.jobs.push(job);
    const { m: m4 } = hailDerelict(t3);
    const h4 = hailsSince(m4).filter((e) => e.ship === t3);
    pin('8o a hull the player holds a recovery contract on offers no claim (the marker is the claim)', !claimableDerelict(ctx, t3) && h4.length === 1 && !h4[0].intents.includes('claimHull') && /Not yours to claim/.test(h4[0].line), h4.map((e) => [e.intents, e.line]));
    const r4 = ctx.hailApi.resolve('claimHull');
    tickHeld(2);
    pin('8p …and resolving it anyway moves nothing', t3.record.state === 'derelict' && claimAll().length === 0, { r4, state: t3.record.state });
    closeHail();
    ctx.world.jobs.splice(ctx.world.jobs.indexOf(job), 1);
    ctx.world.claimedHulls = [];
    for (let i = 0; i < PRIZE_CLAIM.max; i++) ctx.world.claimedHulls.push({ v: 1, id: `full-${i}`, name: 'x', classKey: 'light', faction: null, reason: 'crewPods', claimedAt: 0, system: SYS, repHit: 0 });
    pin('8q a full ledger offers no claim', !claimableDerelict(ctx, t3), { n: claimAll().length });
    const snap = JSON.parse(JSON.stringify(binds.snapshot(ctx)));
    pin('8r the snapshot carries the ledger', Array.isArray(snap.world.claimedHulls) && snap.world.claimedHulls.length === PRIZE_CLAIM.max, snap.world.claimedHulls?.length);
    binds.restore(ctx, snap);
    pin('8s restore keeps it', claimAll().length === PRIZE_CLAIM.max && claimAll()[0].id === 'full-0');
    const bad = JSON.parse(JSON.stringify(snap));
    bad.world.claimedHulls = 'lots';
    binds.restore(ctx, bad);
    pin('8t a corrupt ledger is dropped', claimAll().length === 0, ctx.world.claimedHulls);
    const mixed = JSON.parse(JSON.stringify(snap));
    mixed.world.claimedHulls = [{ v: 1, id: 'ok', classKey: 'battleship', faction: 'nobody', repHit: -4, claimedAt: 'x' }, null, 'junk', { v: 2, id: 'foreign' }, ...Array(12).fill({ v: 1, id: 'over' })];
    binds.restore(ctx, mixed);
    const led2 = claimAll();
    pin('8u corrupt entries are skipped, odd fields healed, the cap holds', led2.length === PRIZE_CLAIM.max && led2[0].id === 'ok' && led2[0].classKey === 'light' && led2[0].faction === null && led2[0].repHit === 0 && led2[0].claimedAt === 0 && led2.every((e) => e.v === 1 && e.id !== 'foreign'), led2);
    const w = { claimedHulls: [{ v: 1, id: 'a', classKey: 'cutter', faction: 'redledger', reason: 'crewTaken', claimedAt: 5, system: 'freehold', repHit: 3 }] };
    sanitizeClaimedHulls(w);
    pin('8v sanitizeClaimedHulls keeps a good entry whole', JSON.stringify(w.claimedHulls[0]) === JSON.stringify({ v: 1, id: 'a', name: null, classKey: 'cutter', faction: 'redledger', reason: 'crewTaken', claimedAt: 5, system: 'freehold', repHit: 3 }), w.claimedHulls);
    ctx.world.claimedHulls = [];
    mine.delete(t3); despawn(t3);
  }
}

console.log(fails === 0 ? 'ISSUE147 PRIZE PASS' : `ISSUE147 PRIZE FAIL — ${fails} pins`);
process.exit(fails === 0 ? 0 : 1);
