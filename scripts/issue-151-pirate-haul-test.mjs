/**
 * Issue #151 — an NPC pirate scoops the pods it took and sells the haul at a
 * fence.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real npc, traffic, pods,
 * station, market-supply and save systems over one ctx. Every break below is
 * made the REAL way — a hand-spawned trader broken through the resolve
 * ladder by a hunting pirate (the issue #146 fixture), so capitulate spills
 * the hold and spillShipCargo tags the pods with the pirate's record id.
 *
 * Covered:
 *   1  scoop: after the yield the pirate collects its own spill; its hold
 *      gains the units, the pods leave ctx.pods, NPC receipts only (never a
 *      player podCollected), one comm line; then it hunts again
 *   2  contest: a pod inside the player's magnet reach is the player's; a
 *      player-caused spill is never tagged; a pirate under fire drops the scoop
 *   3  fence: a heavy hold sends the pirate to the local station; it holds
 *      at the pad, the sale credits the record at ECON.fenceRate against the
 *      station's prices, the hold empties, the market takes the units
 *   4  persistence: the purse and the hold ride snapshot/restore; a corrupt
 *      purse fails safe; a culled heavy pirate comes back owing its fence run
 *
 * Run: npm run test:pirate-haul
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { ECON, PIRATE_HAUL, U, cargoHoldFor } from '../src/game/state.js';
import { marketSupplyAt, commitMarketSupply } from '../src/game/market-supply.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

seedBootRandom();
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

let seq = 0;
function spawn(role, classKey, extra = {}) {
  seq++;
  const rec = {
    id: `i151-${seq}`, name: `I151 ${role} ${seq}`, classKey, faction: role === 'pirate' ? 'redledger' : 'freehold', role,
    resolve: 80, personality: 0, cargo: extra.cargo ?? [], system: SYS, state: 'enroute',
    route: [{ x: FAR.x + 60, y: FAR.y, z: FAR.z + 60 }, { x: FAR.x + 600, y: FAR.y, z: FAR.z + 60 }],
    leg: 0, legT: 0, dir: 1,
  };
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
  ctx.world.records.push(rec); // the snapshot and the fold see a real record
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
  live.ai.lastAttacker = by; // who broke it decides who may collect
}
/** Put the pirate on a trader and break the trader the real way. Returns the mark before the break. */
function breakTrader(pirate, trader, by = pirate) {
  pirate.ai.mode = 'hunt';
  pirate.ai.target = trader;
  pirate.ai.phase = 'attack';
  pirate.ai.phaseStart = ctx.world.time - 3.05;
  tick(1);
  breakNext(trader, by);
  const m = mark();
  for (let i = 0; i < 300; i++) {
    tickHeld(1);
    if (receiptsSince(m, 'npcSurrendered').some((e) => e.ship === trader)) break;
  }
  return m;
}
const clearPods = () => {
  for (const p of ctx.pods) ctx.scene.remove(p.mesh);
  ctx.pods.length = 0;
};

const pirate = spawn('pirate', 'cutter');
const HOLD = cargoHoldFor('cutter');
pin('0 fixture: a cutter pirate with an empty hold and a class hold to fill', !!pirate && HOLD > 0 && units(pirate.state.cargo) === 0
  && pirate.state.cargo === pirate.record.cargo, { HOLD, same: pirate && pirate.state.cargo === pirate.record.cargo });

// ---- 1  scoop ---------------------------------------------------------------
{
  const trader = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 6 }, { commodity: 'rawOre', units: 4 }] });
  const playerUnits0 = units(ctx.cargo);
  const m = breakTrader(pirate, trader);
  const rcpt = receiptsSince(m, 'npcSurrendered').filter((e) => e.ship === trader);
  pin('1a the trader yields its hold to the world (jettison, causer world)', rcpt.length === 1 && rcpt[0].outcome === 'jettison' && rcpt[0].causer === 'world', rcpt.map((e) => [e.outcome, e.causer]));
  const spilled = ownPods(pirate);
  pin('1b the spilled pods carry the pirate\'s record id', spilled.length === 2 && ctx.pods.every((p) => p.spilledBy === pirate.record.id), ctx.pods.map((p) => p.spilledBy));
  let scooping = false;
  for (let i = 0; i < 20 && !scooping; i++) { tickHeld(1); scooping = !!pirate.ai.scoop; }
  pin('1c the pirate drops the prize and opens a bounded scoop phase', scooping && pirate.ai.target === null && pirate.ai.scoop.until - pirate.ai.scoop.since === PIRATE_HAUL.scoopSeconds, pirate.ai.scoop);
  pin('1d one comm line marks the scoop', linesSince(m).filter((l) => l.startsWith(`${pirate.state.name}:`) && l.includes('Scooping')).length === 1, linesSince(m));
  let done = false;
  for (let i = 0; i < 60 * 60 && !done; i++) { tickHeld(1); done = ownPods(pirate).length === 0; }
  const took = receiptsSince(m, 'npcPodCollected').filter((e) => e.ship === pirate);
  pin('1e the pirate scoops both pods within the bound; they leave ctx.pods', done && ctx.pods.length === 0, { pods: ctx.pods.length, t: ctx.world.time });
  pin('1f its hold gains the units, on the record\'s own manifest', units(pirate.state.cargo) === 10
    && pirate.record.cargo.find((c) => c.commodity === 'provisions')?.units === 6 && pirate.record.cargo.find((c) => c.commodity === 'rawOre')?.units === 4, pirate.record.cargo);
  pin('1g two npcPodCollected receipts name the pirate and the commodity', took.length === 2 && took.every((e) => typeof e.units === 'number' && typeof e.commodity === 'string' && e.pod), took.map((e) => [e.units, e.commodity]));
  pin('1h never a player podCollected / podBlocked; the player hold is untouched', receiptsSince(m, 'podCollected').length === 0 && receiptsSince(m, 'podBlocked').length === 0 && units(ctx.cargo) === playerUnits0);
  tickHeld(5);
  pin('1i the scoop closes; the hold is not yet heavy, so no fence run', pirate.ai.scoop === null && pirate.ai.fence === null && units(pirate.state.cargo) < Math.ceil(HOLD * PIRATE_HAUL.fenceAt), { scoop: pirate.ai.scoop, fence: pirate.ai.fence });
  despawn(trader);
  // …and it hunts again: the next trader in the bubble is acquired.
  const next = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 3 }] });
  let acquired = false;
  for (let i = 0; i < 120 && !acquired; i++) { tickHeld(1); acquired = pirate.ai.target === next; }
  pin('1j the pirate hunts again after the scoop', acquired && pirate.ai.mode === 'hunt', { target: pirate.ai.target?.record?.id, mode: pirate.ai.mode });
  pirate.ai.target = null; pirate.ai.phase = null;
  despawn(next);
}

// ---- 2  contest --------------------------------------------------------------
{
  clearPods();
  // 2a-c: a pod inside the player's magnet reach is the player's.
  const trader = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }, { commodity: 'rawOre', units: 3 }] });
  const m = breakTrader(pirate, trader);
  const pods = ownPods(pirate);
  pin('2a fixture: two tagged pods', pods.length === 2, pods.length);
  const claimed = pods[0];
  const other = pods[1];
  // The spill lands within a few units; part the pods so the player's reach
  // (SCOOP_RANGE × 3) covers exactly one of them.
  other.mesh.position.copy(claimed.mesh.position).x -= 90;
  other.velocity.set(0, 0, 0);
  const playerUnits0 = units(ctx.cargo);
  const at = claimed.mesh.position.clone();
  at.x += U.SCOOP_RANGE * 2; // inside the player's magnet reach (SCOOP_RANGE × 3), outside contact
  let playerTook = false;
  for (let i = 0; i < 60 * 20 && !playerTook; i++) {
    tickHeld(1, at);
    playerTook = receiptsSince(m, 'podCollected').some((e) => e.pod === claimed);
  }
  const npcTook = receiptsSince(m, 'npcPodCollected');
  pin('2b the player wins the contested pod (an ordinary podCollected, no NPC receipt for it)', playerTook && !npcTook.some((e) => e.pod === claimed)
    && units(ctx.cargo) === playerUnits0 + 2, { playerTook, npc: npcTook.map((e) => e.pod?.id), held: units(ctx.cargo), was: playerUnits0 });
  let pirateTook = npcTook.some((e) => e.pod === other);
  for (let i = 0; i < 60 * 30 && !pirateTook; i++) { tickHeld(1, at); pirateTook = receiptsSince(m, 'npcPodCollected').some((e) => e.pod === other); }
  pin('2c the pirate still takes the pod the player was not reaching for', pirateTook && !ctx.pods.includes(other), { pods: ctx.pods.length });
  ctx.ship.object.position.copy(FAR);
  clearPods();
  despawn(trader);
  tickHeld(5);

  // 2d: a spill the PLAYER caused is never a pirate's to collect.
  const prize = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  const m2 = breakTrader(pirate, prize, 'player');
  const rcpt2 = receiptsSince(m2, 'npcSurrendered').filter((e) => e.ship === prize);
  pin('2d a player-caused spill is untagged; the pirate opens no scoop for it', rcpt2.length === 1 && rcpt2[0].causer === 'player'
    && ctx.pods.length > 0 && ctx.pods.every((p) => p.spilledBy === undefined) && pirate.ai.scoop === null, { pods: ctx.pods.map((p) => p.spilledBy), scoop: pirate.ai.scoop });
  tickHeld(60);
  pin('2e …and never scoops them', ctx.pods.length > 0 && receiptsSince(m2, 'npcPodCollected').length === 0);
  ctx.world.fear = 0;
  clearPods();
  despawn(prize);

  // 2f: a hit during the scoop drops it.
  const trader3 = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 1 }] });
  trader3.object.position.set(FAR.x + 900, FAR.y, FAR.z + 60); // far enough that the scoop is still open when the hit lands
  const m3 = breakTrader(pirate, trader3);
  let open = false;
  for (let i = 0; i < 20 && !open; i++) { tickHeld(1); open = !!pirate.ai.scoop; }
  pin('2f fixture: the scoop is open', open && ownPods(pirate).length === 1);
  pirate.state.lastHitAt = ctx.world.time; // any shooter
  pirate.ai.lastAttacker = 'npc';
  tickHeld(2);
  pin('2g a pirate under fire breaks off the scoop; the pod stays', pirate.ai.scoop === null && ownPods(pirate).length === 1
    && receiptsSince(m3, 'npcPodCollected').length === 0, { scoop: pirate.ai.scoop, pods: ctx.pods.length });
  clearPods();
  despawn(trader3);
  pirate.state.lastHitAt = -1e9;
  pirate.ai.lastAttacker = null;
}

// ---- 3  fence -------------------------------------------------------------------
{
  pirate.state.cargo.length = 0;
  const trader = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 12 }, { commodity: 'refinedMetals', units: 6 }] });
  const m = breakTrader(pirate, trader);
  let done = false;
  for (let i = 0; i < 60 * 60 && !done; i++) { tickHeld(1); done = ownPods(pirate).length === 0 && pirate.ai.scoop === null; }
  pin('3a a big spill fills the hold past fenceAt', done && units(pirate.state.cargo) === 18 && units(pirate.state.cargo) >= Math.ceil(HOLD * PIRATE_HAUL.fenceAt), pirate.record.cargo);
  pin('3b …which sends the pirate to fence', !!pirate.ai.fence, pirate.ai.fence);
  despawn(trader);
  // Bring the run within reach: the pirate (and the player, so nothing culls) near the station.
  const NEAR = new THREE.Vector3(STATION.x + 260, STATION.y, STATION.z + 260);
  ctx.ship.object.position.copy(NEAR); // the player moves FIRST, or traffic's range cull folds the pirate
  pirate.object.position.set(STATION.x + 420, STATION.y, STATION.z + 380);
  pirate.object.quaternion.identity();
  // The market must be able to take the units: drain the lazy full row first.
  const before = {};
  for (const key of ['provisions', 'refinedMetals']) {
    const stock = marketSupplyAt(ctx.world, SYS, key);
    commitMarketSupply(ctx.world, SYS, key, stock, -Math.floor(stock.capacity / 2));
    before[key] = marketSupplyAt(ctx.world, SYS, key).units;
  }
  const price = { provisions: ctx.world.markets[SYS].provisions, refinedMetals: ctx.world.markets[SYS].refinedMetals };
  const credits0 = pirate.record.credits ?? 0;
  const playerCredits0 = ctx.world.credits;
  const m3 = mark();
  let d0 = pirate.object.position.distanceTo(STATION);
  let sold = false;
  let arrivedAt = -1;
  for (let i = 0; i < 60 * 90 && !sold; i++) {
    tickHeld(1, NEAR);
    if (arrivedAt < 0 && pirate.ai.fence && pirate.ai.fence.holdAt > 0) arrivedAt = ctx.world.time;
    sold = receiptsSince(m3, 'npcFenced').some((e) => e.ship === pirate);
  }
  const rcpt = receiptsSince(m3, 'npcFenced').filter((e) => e.ship === pirate);
  pin('3c the pirate flies to the station hold and holds there fenceHold seconds before the sale', sold && arrivedAt > 0
    && rcpt[0].t - arrivedAt >= PIRATE_HAUL.fenceHold - DT * 2 && pirate.object.position.distanceTo(STATION) < d0 - 200, { sold, arrivedAt, at: rcpt[0]?.t, d: pirate.object.position.distanceTo(STATION), d0 });
  const [lo, hi] = ECON.fenceRate;
  const minPay = 12 * Math.round(price.provisions * lo) + 6 * Math.round(price.refinedMetals * lo);
  const maxPay = 12 * Math.round(price.provisions * hi) + 6 * Math.round(price.refinedMetals * hi);
  const gained = (pirate.record.credits ?? 0) - credits0;
  pin('3d the record\'s purse gains a fenceRate cut of the station\'s book', rcpt.length === 1 && rcpt[0].units === 18 && rcpt[0].credits === gained
    && gained >= minPay && gained <= maxPay && rcpt[0].system === SYS && Number.isInteger(pirate.record.credits), { gained, minPay, maxPay, rcpt: rcpt.map((e) => [e.units, e.credits]) });
  pin('3e the hold empties (record and live state alike)', units(pirate.state.cargo) === 0 && pirate.record.cargo.length === 0, pirate.record.cargo);
  const after = { provisions: marketSupplyAt(ctx.world, SYS, 'provisions').units, refinedMetals: marketSupplyAt(ctx.world, SYS, 'refinedMetals').units };
  pin('3f the station market takes the units', after.provisions >= before.provisions + 12 && after.provisions <= before.provisions + 12 + 8
    && after.refinedMetals >= before.refinedMetals + 6 && after.refinedMetals <= before.refinedMetals + 6 + 8, { before, after });
  pin('3g the player\'s purse and hold are untouched', ctx.world.credits === playerCredits0);
  pin('3h one comm line marks the sale', linesSince(m3).filter((l) => l.startsWith(`${pirate.state.name}:`) && l.includes('fenced')).length === 1, linesSince(m3));
  tickHeld(5, NEAR);
  pin('3i the fence run closes; the pirate is back on the hunt', pirate.ai.fence === null && pirate.ai.scoop === null && pirate.ai.mode === 'hunt', { fence: pirate.ai.fence, mode: pirate.ai.mode });
  ctx.ship.object.position.copy(FAR);
  pirate.object.position.set(FAR.x + 100, FAR.y, FAR.z + 60);
  tickHeld(5);
}

// ---- 4  persistence --------------------------------------------------------------
{
  const trader = spawn('trader', 'freighter', { cargo: [{ commodity: 'provisions', units: 5 }] });
  breakTrader(pirate, trader);
  let done = false;
  for (let i = 0; i < 60 * 60 && !done; i++) { tickHeld(1); done = ownPods(pirate).length === 0 && pirate.ai.scoop === null; }
  despawn(trader);
  const credits = pirate.record.credits;
  pin('4a fixture: a purse and a hold to save', done && credits > 0 && units(pirate.record.cargo) === 5, { credits, cargo: pirate.record.cargo });
  const snap = JSON.parse(JSON.stringify(binds.snapshot(ctx)));
  const saved = snap.world.records.find((r) => r.id === pirate.record.id);
  pin('4b the snapshot carries the purse and the hold, JSON-plain', !!saved && saved.credits === credits && units(saved.cargo) === 5, saved && { credits: saved.credits, cargo: saved.cargo });
  binds.restore(ctx, snap);
  const rec2 = ctx.world.records.find((r) => r.id === pirate.record.id);
  pin('4c restore keeps both', !!rec2 && rec2.credits === credits && units(rec2.cargo) === 5, rec2 && { credits: rec2.credits, cargo: rec2.cargo });
  for (const [bad, label] of [['lots', 'a string'], [-5, 'a negative'], [null, 'a NaN (null in JSON)'], [{ a: 1 }, 'an object']]) {
    const blob = JSON.parse(JSON.stringify(snap));
    blob.world.records.find((r) => r.id === pirate.record.id).credits = bad;
    binds.restore(ctx, blob);
    const r = ctx.world.records.find((x) => x.id === pirate.record.id);
    pin(`4d a corrupt purse (${label}) is dropped, never adopted`, !!r && !Object.hasOwn(r, 'credits') && units(r.cargo) === 5, r && { credits: r.credits });
  }
  const frac = JSON.parse(JSON.stringify(snap));
  frac.world.records.find((r) => r.id === pirate.record.id).credits = 12.75;
  binds.restore(ctx, frac);
  pin('4e a fractional purse restores as an integer', ctx.world.records.find((x) => x.id === pirate.record.id).credits === 12);
  binds.restore(ctx, snap);
  // The fold: a culled pirate with a heavy hold comes back owing its fence run.
  const rec3 = ctx.world.records.find((r) => r.id === pirate.record.id);
  rec3.cargo.length = 0;
  rec3.cargo.push({ commodity: 'provisions', units: Math.ceil(HOLD * PIRATE_HAUL.fenceAt) });
  for (const s of [...ctx.ships]) despawn(s);
  const back = binds.spawnLiveShip(ctx, rec3, new THREE.Vector3(FAR.x + 100, FAR.y, FAR.z + 60));
  pin('4f re-instantiated with a heavy hold, the pirate owes a fence run; a light one does not', !!back && !!back.ai.fence && back.state.cargo === rec3.cargo, back && { fence: back.ai.fence });
  if (back) binds.removeLiveShip(ctx, back);
  rec3.cargo.length = 0;
  const light = binds.spawnLiveShip(ctx, rec3, new THREE.Vector3(FAR.x + 100, FAR.y, FAR.z + 60));
  pin('4g …a light one does not', !!light && light.ai.fence === null);
  if (light) binds.removeLiveShip(ctx, light);
}

console.log(fails === 0 ? 'ISSUE151 PIRATE HAUL PASS' : `ISSUE151 PIRATE HAUL FAIL — ${fails} pins`);
process.exit(fails === 0 ? 0 : 1);
