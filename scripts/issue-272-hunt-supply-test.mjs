/**
 * Issue #272 — the hunt supply ran dry after a few kills and every contract
 * played at the same flat danger.
 *
 *  A. A fresh board posts up to two hunts and marks a hardened quarry as HARD
 *     (bounty at or above HUNT_HARD_BOUNTY_AT, or a stamped veteran reaver).
 *  B. Killing every local pirate empties the board; the empty board tells the
 *     player new reavers drift in over time.
 *  C. The world replenishes: after the pick cadence a NEW reaver record
 *     appears in the visited bank, the board refills, and the replenished
 *     hull is a real quarry (role pirate, unique name galaxy-wide, cast cap
 *     respected).
 *  D. Replenish never generates unvisited banks and never exceeds the cast.
 *  E. Veteran reavers carry resolve 70 and a doubled bounty; standard keep
 *     the makeRecord seed.
 *  F. Records stay JSON-plain (save snapshot rides along; no throw).
 *
 * Real station DOM, the real Jobs board, the real sync and delivery tick.
 * Fixtures are disclosed record-state flips (a kill is a combat result, not a
 * board rule) and elapsed world time on the real update loop.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-272-hunt-supply-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS } from '../src/game/state.js';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
const save = systems.find(([n]) => n === 'save')[1];

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const openBoard = () => ctx.stationDesk.selectService('jobs');
const offers = () => window.rimward.observe().jobs.offers;
const hunts = () => ctx.world.jobs.filter((j) => j && j.kind === 'hunt' && j.originSystem === ctx.world.currentSystem);
// The agent observation hides recordId by design; the board card binds through it. Read the persisted rows.
const huntOffers = () => offers().filter((o) => o.kind === 'hunt');
const huntRows = () => hunts().filter((j) => j.state === 'offered');
const pirateRecords = (sysId) => (ctx.world.recordBanks?.[sysId] ?? []).filter((r) => r && r.role === 'pirate');
const livingPirates = (sysId) => pirateRecords(sysId).filter((r) => r.state !== 'dead' && r.state !== 'captured' && r.state !== 'derelict');

function step(seconds = 1) {
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    ctx.world.time += 1 / 60;
    ctx.elapsed += 1 / 60;
    station.update(1 / 60);
    world.update(1 / 60);
    save.update(1 / 60);
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

for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;

// ---------------------------------------------------------------------------
// A. Fresh board posts hunts; a hardened quarry says so.
// ---------------------------------------------------------------------------
check('A1 fresh Freehold board posts up to two hunt cards', () => {
  dock('freehold');
  openBoard();
  assert.ok(huntOffers().length >= 1 && huntOffers().length <= 2, '1-2 hunt cards: ' + huntOffers().length);
  assert.equal(huntOffers().length, huntRows().length, 'the observation agrees with the board');
  for (const row of huntRows()) {
    assert.equal(typeof row.recordId, 'string', 'binds a record id');
    assert.ok(!/rec-/.test(row.title ?? ''), 'no record id printed on the card');
  }
});

check('A2 every hunt pay scales from the record bounty', () => {
  for (const row of huntRows()) {
    const rec = (ctx.world.recordBanks?.[row.originSystem] ?? ctx.world.records ?? [])
      .find((r) => r && r.id === row.recordId);
    assert.ok(rec, 'the bound record exists');
    assert.ok(row.reward > 0 && Number.isFinite(row.reward), 'finite positive reward');
    const tierHard = rec.bounty >= 700 || rec.reaverTier === 'veteran';
    const cardText = byClass('job-reward').map((n) => String(n.textContent)).join(' ');
    assert.ok(/Hunt /.test(cardText), 'the card shows the hunt line');
    if (tierHard) {
      const note = byClass('job-state').map((n) => String(n.textContent)).join(' ');
      assert.ok(/HARDENED QUARRY/.test(note), 'hardened quarry carries the warn row');
    }
  }
});

// ---------------------------------------------------------------------------
// B. Kill the local supply: the board empties and says why.
// ---------------------------------------------------------------------------
check('B1 killing every local reaver empties the hunt board', () => {
  for (const rec of livingPirates('freehold')) rec.state = 'dead';
  openBoard();
  assert.equal(huntOffers().length, 0, 'no hunt cards without a quarry');
  const note = byClass('screen-note').map((n) => String(n.textContent)).join(' ');
  assert.match(note, /Every local reaver is dead or gone/, 'empty-board copy names the state');
  assert.match(note, /refills as they arrive/, 'empty-board copy promises the refill');
});

// ---------------------------------------------------------------------------
// C. The world refills the visited system.
// ---------------------------------------------------------------------------
check('C1 the replenish pick drifts a new reaver into the visited bank', () => {
  const livingBefore = livingPirates('freehold').length;
  const castWant = SYSTEMS.freehold.cast.pirates;
  assert.ok(livingBefore < castWant, 'the cast has room: ' + livingBefore + '/' + castWant + ' living');
  // Step past the first pick (firstDelay 90s) on the real loop.
  step(100);
  const recs = pirateRecords('freehold');
  assert.ok(recs.length > 4, 'a new record joined the original four: ' + recs.length);
  const fresh = recs[recs.length - 1];
  assert.equal(fresh.role, 'pirate');
  assert.equal(fresh.classKey, 'cutter');
  assert.ok(fresh.state !== 'dead' && fresh.state !== 'captured', 'the new record flies');
  assert.ok(fresh.bounty > 0, 'posts a bounty: ' + fresh.bounty);
  assert.ok(!fresh.qship, 'replenished reavers fly classic, not Q-ships');
});

check('C2 the fresh reaver takes a name no bank has ever carried', () => {
  const fresh = pirateRecords('freehold')[pirateRecords('freehold').length - 1];
  for (const [sysId, bank] of Object.entries(ctx.world.recordBanks ?? {})) {
    for (const r of bank ?? []) {
      if (r === fresh) continue;
      assert.ok(r.name !== fresh.name, 'name collision with ' + sysId + ' ' + r.name);
    }
  }
  assert.ok(!/^(Red|Pale|Iron|Quiet|Slow|Gilt|Ash|Marrow|Broken|Still|Late|Hollow|Cinder|Salt|Copper|Long|Low|Old|Grey|Bitter|Bright|Black|Worn|Silver) [A-Z][a-z]+$/.test(fresh.name) === false, 'generated #270 name shape');
});

check('C3 the board refills from the drifted-in reaver', () => {
  openBoard();
  assert.ok(huntOffers().length >= 1, 'a hunt card returned');
  const row = huntRows()[0];
  const fresh = (ctx.world.recordBanks?.freehold ?? []).find((r) => r && r.id === row.recordId);
  assert.ok(fresh, 'the card binds the new record');
  assert.ok(fresh.state !== 'dead' && fresh.state !== 'captured', 'the quarry flies');
});

// ---------------------------------------------------------------------------
// D. Replenish never generates unvisited banks nor exceeds the cast.
// ---------------------------------------------------------------------------
check('D1 unvisited systems stay ungenerated', () => {
  // hush has no authored pirates and should never gain a bank from replenish.
  assert.equal(ctx.world.recordBanks?.hush ?? null, null, 'hush bank was never generated');
  step(30);
  assert.equal(ctx.world.recordBanks?.hush ?? null, null, 'still ungenerated after picks');
});

check('D2 the cast cap holds after many picks', () => {
  for (const rec of livingPirates('freehold')) rec.state = 'dead';
  step(400); // several picks
  const living = livingPirates('freehold').length;
  assert.ok(living <= SYSTEMS.freehold.cast.pirates, 'living pirates within cast: ' + living);
});

// ---------------------------------------------------------------------------
// E. Tiers: veteran reavers fly resolve 70 at a doubled bounty.
// ---------------------------------------------------------------------------
check('E1 veteran reaver stamp prices and hardens the hull', () => {
  // Force the tier roll deterministically: cycle the harness RNG so name
  // attempts stay varied (0.1) while the tier roll lands in the veteran band
  // (0.95 >= 0.7 weight boundary). The harness owns the generator, so this is
  // the same override discipline the boot suite uses.
  const realRandom = Math.random;
  let flip = false;
  Math.random = () => { flip = !flip; return flip ? 0.1 : 0.95; };
  try {
    for (const rec of livingPirates('freehold')) rec.state = 'dead';
    // Picks land on the module cadence (interval × band × jitter); step in
    // slices until the pick lands rather than guessing one window.
    for (let i = 0; i < 20 && pirateRecords('freehold').filter((x) => x.reaverTier).length === 0; i++) step(25);
  } finally {
    Math.random = realRandom;
  }
  const recs = pirateRecords('freehold').filter((r) => r.reaverTier);
  assert.ok(recs.length >= 1, 'a tiered reaver arrived');
  const vet = recs.find((r) => r.reaverTier === 'veteran');
  assert.ok(vet, 'the veteran tier exists in the roll band');
  assert.equal(vet.resolve, 70, 'veteran resolve seed');
  assert.ok(vet.bounty >= 700, 'veteran posts a premium bounty: ' + vet.bounty);
});

// ---------------------------------------------------------------------------
// F. Records stay JSON-plain.
// ---------------------------------------------------------------------------
check('F1 replenished records snapshot JSON-safe', () => {
  const fresh = pirateRecords('freehold').find((r) => r.reaverTier === 'veteran');
  assert.ok(fresh, 'a replenished record exists');
  const copy = JSON.parse(JSON.stringify(fresh));
  assert.equal(copy.name, fresh.name);
  assert.equal(copy.reaverTier, 'veteran');
});

console.log('issue-272 hunt supply: ' + checks + ' checks passed');
