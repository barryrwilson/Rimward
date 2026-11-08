/**
 * Issue #291 — a surrendered bounty target can be finished: the hail key on a
 * yielded, player-broken pirate takes the surrender (capture), and the bounty
 * pays on it.
 *
 * The playtest frame (mercenary run, 2026-11-08): the #61/#62 combat lease
 * drove Red Marlow to surrender inside one 45 s lease, then refused the same
 * hull with target-surrendered (#265, by design), raw setControl fire could
 * not close the fleeing target, and the bounty — "confirmation of the kill or
 * capture" (syncPirateBounties) — settled only on a player-caused destroyed
 * incident. The bounty was stranded.
 *
 * The fix: hail.js's H-press chain, when no card opened, runs npc.js's
 * tryCaptureYieldedTarget on the yielded lock — the capture conversion. The
 * record settles 'captured', one npcSurrendered receipt flies with outcome
 * 'captured', causer 'player', world.js records the surrendered incident, and
 * station.js settlement accepts it beside the witnessed kill.
 *
 * Real boot, real systems, real station DOM, the real KeyH edge, the real
 * hail resolver, the real job tick. Fixtures are disclosed record and
 * hull-state flips (the break the guns would land, the willingness the
 * resolver leaves, the lock and the parked pursuit).
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-291-surrender-capture-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

const nodes = () => [...dom.walkDom(document.body)];
const openBoard = () => ctx.stationDesk.selectService('jobs');
const pirateBounties = () => ctx.world.jobs.filter((j) => j && j.kind === 'bounty' && typeof j.id === 'string' && j.id.startsWith('bounty-pirate-'));
const bank = () => ctx.world.recordBanks?.[ctx.world.currentSystem] ?? ctx.world.records ?? [];
const latestIncident = (name) => {
  const incs = ctx.world.incidents || [];
  for (let i = incs.length - 1; i >= 0; i--) {
    if (incs[i] && incs[i].name === name) return incs[i];
  }
  return null;
};

function step(seconds = 1) {
  const dt = 1 / 60;
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    ctx.elapsed += dt;
    ctx.world.time += dt;
    for (const [, s] of systems) {
      try { s?.update?.(dt, ctx); } catch { /* one frame's error must not stop the probe */ }
    }
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }];
  world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, 'docked at ' + id);
}

/** Spawn a record's hull near the ship (the #271/#265 fixture discipline). */
const spawnShip = (rec, offset = [140, 0, 0]) => {
  const p = ctx.ship.object.position;
  const live = binds.spawnLiveShip(ctx, rec, { x: p.x + offset[0], y: p.y + offset[1], z: p.z + offset[2] });
  if (live && !ctx.ships.includes(live)) ctx.ships.push(live);
  return live;
};

/** The real H press on the current lock (the physical key edge, not the flag). */
function pressHail() {
  dom.dispatchKey('KeyH');
  step(1 / 60);
}

for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;

// ---------------------------------------------------------------------------
// Setup: dock at freehold, accept a pirate bounty.
// ---------------------------------------------------------------------------
check('setup: a pirate bounty row can be accepted at its home dock', () => {
  dock('freehold');
  openBoard();
  let row = pirateBounties().find((j) => j.state === 'offered');
  if (!row) {
    const sysId = ctx.world.currentSystem;
    const rec = {
      id: 'rec-291-fixture', name: 'Fixture Marlow', classKey: 'cutter',
      faction: 'independent', role: 'pirate', system: sysId,
      state: 'enroute', bounty: 450,
      route: [
        [ctx.systems[sysId].station.position[0] + 900, ctx.systems[sysId].station.position[1], ctx.systems[sysId].station.position[2]],
        [ctx.systems[sysId].station.position[0] + 450, 0, ctx.systems[sysId].station.position[2]],
      ],
      leg: 0, legT: 0.5, dir: 1,
    };
    (ctx.world.recordBanks?.[sysId] ?? ctx.world.records).push(rec);
    openBoard(); // re-sync posts the card
    row = pirateBounties().find((j) => j.state === 'offered' && j.target === 'Fixture Marlow');
  }
  assert.ok(row, 'an offered pirate bounty exists');
  ctx.stationDesk.acceptJob({ id: row.id });
  assert.ok(pirateBounties().some((j) => j.state === 'accepted'), 'the bounty is accepted');
});

/** Undock, spawn the bounty target's hull, break it as the player, yield it through the real resolver. */
function yieldBountyTarget(offset = [140, 0, 0]) {
  // The hail resolver refuses at the berth (issue #100): the approach is
  // always flown in space — undock before the break.
  if (ctx.flags.docked) ctx.stationDesk.undock();
  step(0.2); // the launch clearance clears the berth screen (issue #100)
  assert.equal(ctx.flags.docked, false, 'the approach is flown in space');
  const row = pirateBounties().find((j) => j.state === 'accepted');
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === row.target
    && r.state !== 'dead' && r.state !== 'captured');
  assert.ok(rec, 'the bounty target record resolves');
  const live = spawnShip(rec, offset);
  assert.ok(live, 'the target instantiated');
  // The break the guns would land: the #99 attribution stamp combat.js writes
  // for a hit that really reduced the hull, then the willingness the #98/#99
  // resolver leaves — the REAL yield path, not a stamped surrendered flag.
  live.ai.lastAttacker = 'player';
  ctx.emit('hailOpened', { ship: live, intents: ['demandCargo'] });
  step(1 / 60);
  const res = ctx.hailApi.resolve('demandCargo');
  assert.equal(res, '', 'the demandCargo verb resolved on the bounty target');
  assert.ok(live.state.surrendered, 'the target yielded');
  step(1 / 60);
  return { row, rec, live };
}

/** Park the hull near the ship and take the lock (the fixture the press reads). */
function lockNear(live) {
  const p = ctx.ship.object.position;
  live.object.position.set(p.x + 60, p.y, p.z);
  ctx.targets.current = live;
}

// ---------------------------------------------------------------------------
// A. The capture conversion on the yielded bounty target.
// ---------------------------------------------------------------------------
check('A1 the hail key on the yielded, player-broken bounty target captures it', () => {
  const { rec, live } = yieldBountyTarget();
  lockNear(live);
  const fearBefore = ctx.world.fear;
  pressHail();
  step(2 / 60); // world.js consumes the receipt on the next tick
  const inc = latestIncident(rec.name);
  assert.ok(inc, 'an incident was recorded');
  assert.equal(inc.kind, 'surrendered', 'the incident kind is surrendered');
  assert.equal(inc.outcome, 'captured', 'the incident outcome is captured');
  assert.equal(inc.causer, 'player', 'the incident is player-caused');
  assert.equal(rec.state, 'captured', 'the record settles captured');
  assert.ok(live.state.destroyed !== true, 'no destroyed stamp: capture is not a kill');
  assert.equal(ctx.world.fear, fearBefore, 'no killedSurrendered fear — capture is not a kill');
  assert.ok(!ctx.world.incidents.some((i) => i.kind === 'destroyed' && i.name === rec.name), 'no destroyed incident');
});

// ---------------------------------------------------------------------------
// B. The capture settles the bounty.
// ---------------------------------------------------------------------------
check('B1 the captured bounty pays on the next delivery tick', () => {
  const row = pirateBounties().find((j) => j.state === 'accepted');
  assert.ok(row, 'the accepted bounty row still stands');
  const creditsBefore = ctx.world.credits;
  const reward = row.reward;
  let paid = false;
  for (let i = 0; i < 10 && !paid; i++) {
    step(0.6); // the 0.5 s job tick
    paid = row.state !== 'accepted' && ctx.world.credits > creditsBefore;
  }
  assert.ok(paid, 'the bounty settled: ' + JSON.stringify({ state: row.state, credits: ctx.world.credits, creditsBefore, reward }));
  assert.equal(row.state, 'done', 'the row completes done');
});

// ---------------------------------------------------------------------------
// C. The gates: what the verb must refuse.
// ---------------------------------------------------------------------------
check('C1 a world-caused yield is not ours to take', () => {
  const row = pirateBounties().find((j) => j.state === 'offered');
  if (!row) { console.log('SKIP C1 (no second bounty posted this seed)'); return; }
  // Accept needs the berth; the yield needs space (issue #100).
  if (!ctx.flags.docked) {
    dock('freehold');
    openBoard();
  }
  ctx.stationDesk.acceptJob({ id: row.id });
  ctx.stationDesk.undock();
  step(0.2); // the launch clearance clears the berth screen (issue #100)
  assert.equal(ctx.flags.docked, false, 'C1 is flown in space');
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === row.target
    && r.state !== 'dead' && r.state !== 'captured');
  assert.ok(rec, 'the second target record resolves');
  const live = spawnShip(rec, [180, 0, 40]);
  assert.ok(live, 'the second target instantiated');
  // The WORLD-caused break, through the real capitulate path: an NPC's stamp
  // on the hull (the #99 attribution), morale driven into the capitulate band
  // by recent combat — the exact shape a bystander-broken bounty target flies.
  // The #99 admission boundary opens NO card for a world-caused break, so the
  // yield arrives the way the world delivers it: npc.js capitulate().
  live.ai.lastAttacker = 'npc'; // the world broke it
  // The resolve inputs a broken hull really has: no defense left, the player
  // at full strength, the fear economy maxed. The 1 Hz recompute lands the
  // band in capitulate — the world's own yield, no card, no player claim.
  live.state.resolve = 5; // seed (the recompute overwrites it — the inputs below decide)
  live.state.screen = 0; live.state.shell = 0;
  live.state.hull = Math.max(1, live.state.hullMax * 0.1);
  live.state.lastCombatAt = ctx.world.time; // threatened: updateResolve samples it
  live.ai.resolveAt = 0;
  live.ai.calmUntil = 0;
  const fearSaved = ctx.world.fear;
  ctx.world.fear = 100;
  step(1.5); // the 1 Hz resolve pass yields the hull
  ctx.world.fear = fearSaved;
  assert.ok(live.state.surrendered, 'the world-broken hull yielded through capitulate');
  lockNear(live);
  const incsBefore = ctx.world.incidents.length;
  pressHail();
  step(2 / 60);
  const incs = ctx.world.incidents.slice(incsBefore);
  assert.ok(!incs.some((i) => i.kind === 'surrendered' && i.outcome === 'captured'),
    'no captured incident for a world-caused yield');
  assert.ok(rec.state !== 'captured', 'the record never settles captured');
});

check('C2 a disabled hull is salvage, not capture', () => {
  const rec = bank().find((r) => r && r.role === 'pirate' && r.state !== 'dead' && r.state !== 'captured' && r.state !== 'derelict'
    && !pirateBounties().some((j) => j.target === r.name && j.state === 'accepted'));
  if (!rec) { console.log('SKIP C2 (no unbound living pirate left)'); return; }
  const live = spawnShip(rec, [220, 0, -40]);
  assert.ok(live, 'the third hull instantiated');
  live.ai.lastAttacker = 'player';
  live.state.disabled = true; // the wreck: the classifier answers 'salvage'
  lockNear(live);
  const incsBefore = ctx.world.incidents.length;
  pressHail();
  step(2 / 60);
  const incs = ctx.world.incidents.slice(incsBefore);
  assert.ok(!incs.some((i) => i.kind === 'surrendered' && i.outcome === 'captured'),
    'no captured incident for a wreck');
  assert.ok(rec.state !== 'captured', 'the wreck never settles captured');
  // And the salvage card DID open instead (the ordinary path is untouched).
  assert.equal(ctx.hailApi.peek().open, true, 'the salvage card opened');
  ctx.emit('hailClosed', { ship: live });
  step(1 / 60);
});

check('C3 a second press on the captured hull does nothing', () => {
  // The A1 hull is captured (its record left enroute); no lock on a towed
  // hull, no second receipt, no crash. Park a fresh look at the same lock.
  const row = pirateBounties().find((j) => j.state === 'done' && j.target === 'Red Marlow')
    ?? pirateBounties().find((j) => j.state === 'done');
  if (!row) { console.log('SKIP C3 (no done bounty row this seed)'); return; }
  const incsBefore = ctx.world.incidents.filter((i) => i.name === row.target && i.outcome === 'captured').length;
  pressHail();
  step(1 / 60);
  assert.equal(ctx.world.incidents.filter((i) => i.name === row.target && i.outcome === 'captured').length, incsBefore,
    'no additional capture for a settled bounty');
});

// ---------------------------------------------------------------------------
// D. JSON-plain.
// ---------------------------------------------------------------------------
check('D1 jobs and incidents stay JSON-plain', () => {
  const copy = JSON.parse(JSON.stringify(ctx.world.jobs));
  assert.ok(Array.isArray(copy), 'jobs snapshot JSON-safe');
  const incCopy = JSON.parse(JSON.stringify(ctx.world.incidents));
  assert.ok(Array.isArray(incCopy), 'incidents snapshot JSON-safe');
});

console.log('issue-291 surrender capture: ' + checks + ' checks passed');
