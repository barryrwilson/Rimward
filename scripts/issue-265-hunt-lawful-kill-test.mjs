/**
 * Issue #265 — a lawful hunt kill is not an atrocity.
 *
 * The #249 playtest: every paid hunt ended with the quarry disabled or
 * surrendered before it died, a hunt pays only on a witnessed kill, and the
 * finishing kill then read as an atrocity — the living ship went feral for
 * 60 s and fear climbed +8 per surrendered kill toward lawfulClosesAt.
 * Standing already exempts pirate victims (kill-standing.js skipHuntVictim),
 * so the world contradicted itself about the same act.
 *
 * The decision (docs/Msn02HuntDesign.md, 2026-11-06): the witnessed kill of a
 * live hunt's bound quarry is lawful work. The record-id-precise contract bind
 * (prize.js isHuntQuarry — the same read the CONTRACT bracket mark uses)
 * exempts the kill from the bio atrocity/feral gate and from the
 * killedSurrendered fear bump. A bystander's disabled or surrendered hull
 * keeps every consequence; the witnessed capitulation (+2) on the way in still
 * counts; the hunt card says the kill is lawful work.
 *
 * Real systems, real events, real station DOM. Fixtures are disclosed
 * record-state flips and emitted combat events (the same shape combat.js
 * emits), the discipline the #267/#272 suites use.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-265-hunt-lawful-kill-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { ECON } from '../src/game/state.js';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
const npcSys = systems.find(([n]) => n === 'npc')[1];
const save = systems.find(([n]) => n === 'save')[1];

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const openBoard = () => ctx.stationDesk.selectService('jobs');
const hunts = () => ctx.world.jobs.filter((j) => j && j.kind === 'hunt' && j.originSystem === ctx.world.currentSystem);
const acceptedHunt = () => hunts().find((j) => j.state === 'accepted');
const bank = () => ctx.world.recordBanks?.[ctx.world.currentSystem] ?? ctx.world.records ?? [];
const recordById = (id) => bank().find((r) => r && r.id === id);
const livingPirates = (sysId) => (ctx.world.recordBanks?.[sysId] ?? []).filter((r) => r && r.role === 'pirate' && r.state !== 'dead' && r.state !== 'captured' && r.state !== 'derelict');

// Harness discipline (#271 wave30/issue-68): instantiate a record near the ship
// by hand so the lock and the kill are fixture-driven, not traffic luck.
const spawnShip = (rec, offset = [260, 0, 0]) => {
  const p = ctx.ship.object.position;
  const live = binds.spawnLiveShip(ctx, rec, { x: p.x + offset[0], y: p.y + offset[1], z: p.z + offset[2] });
  if (live && !ctx.ships.includes(live)) ctx.ships.push(live);
  return live;
};

let frame = 0;
function step(seconds = 1) {
  const dt = 1 / 60;
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    frame++;
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

/**
 * The combat.js finishing blow, replayed as a fixture: applyHit-equivalent
 * state flips + the npcDestroyed emission, exactly the primitives the beam
 * path publishes (combat.js 1571-1576). No scene render, no laser math.
 */
function finishHull(live) {
  live.state.destroyed = true;
  ctx.emit('npcDestroyed', { ship: live });
  // Two frames: the first rotates the event into lastEvents, the second lets
  // npc's backstop, bio and world's incident pass consume it.
  step(1 / 60);
  step(1 / 60);
}

for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;

// ---------------------------------------------------------------------------
// A. The board posts a hunt and the card names the lawful-kill line.
// ---------------------------------------------------------------------------
check('A1 the hunt card states the kill is lawful work', () => {
  dock('freehold');
  openBoard();
  const details = byClass('job-detail').map((n) => String(n.textContent));
  assert.ok(details.some((d) => /witnessed kill/.test(d)), 'a hunt card renders');
  assert.ok(details.some((d) => /the kill is lawful work/.test(d)), 'the lawful-kill line is on the card');
});

// Accept one hunt so a bound quarry exists.
let boundRec = null;
check('A2 accepting a hunt binds a living quarry', () => {
  const row = hunts().find((j) => j.state === 'offered');
  assert.ok(row, 'an offered hunt exists');
  // Drive the public acceptJob through the
  // board button instead: find the Accept button that follows the hunt card.
  const cards = byClass('job-card');
  let accepted = false;
  for (let i = 0; i < cards.length; i++) {
    const title = byClass('job-title')[i] ? String(byClass('job-title')[i].textContent) : '';
    if (!title.includes('Hunt ')) continue;
    const btns = cards[i].children.filter((n) => String(n.tagName) === 'BUTTON');
    const accept = btns.find((b) => /Accept \(/.test(String(b.textContent)));
    if (accept) { accept.click(); accepted = true; break; }
  }
  assert.ok(accepted, 'the hunt Accept button clicked');
  boundRec = recordById(row.recordId);
  assert.ok(boundRec, 'the bound record exists');
  assert.ok(acceptedHunt(), 'the hunt is accepted');
});

// ---------------------------------------------------------------------------
// B. Finishing the surrendered bound quarry: no atrocity, no feral, no fear.
// ---------------------------------------------------------------------------
check('B1 the surrendered contract kill is lawful: no feral, no atrocity, no fear', () => {
  ctx.stationDesk.undock();
  const live = spawnShip(boundRec);
  assert.ok(live, 'the quarry instantiated');
  live.state.surrendered = true;
  const fearBefore = ctx.world.fear;
  const moodBefore = ctx.bio.mood;
  finishHull(live);
  const sawAtrocity = [...ctx.lastEvents, ...ctx.events].some((e) => e.type === 'atrocity');
  assert.ok(!sawAtrocity, 'no atrocity event for the contract kill');
  assert.notEqual(ctx.bio.mood, 'feral', 'the companion does not rage');
  assert.equal(ctx.world.fear, fearBefore, 'no killedSurrendered fear for the contract kill');
  assert.ok(boundRec.state === 'dead', 'the record settles dead');
});

// ---------------------------------------------------------------------------
// C. The witnessed capitulation on the way in still counts (+2).
// ---------------------------------------------------------------------------
check('C1 the witnessed capitulation still pays +2 on the way in', () => {
  // Only the ACCEPTED contract's quarry is exempt. Drop the other offered
  // postings so the next living pirate is bound to nothing.
  for (let i = ctx.world.jobs.length - 1; i >= 0; i--) {
    const j = ctx.world.jobs[i];
    if (j && j.kind === 'hunt' && j.state === 'offered') ctx.world.jobs.splice(i, 1);
  }
  const rec2 = livingPirates('freehold').find((r) => {
    // not the accepted bind, and not named by any remaining live job
    return !ctx.world.jobs.some((j) => j && j.kind === 'hunt'
      && (j.state === 'offered' || j.state === 'accepted') && j.recordId === r.id);
  });
  assert.ok(rec2, 'an unbound living pirate exists');
  assert.ok(rec2, 'another living pirate exists');
  const live2 = spawnShip(rec2, [40, 0, 0]);
  assert.ok(live2, 'the second hull instantiated');
  // The real yield resolver (#98/#99): the demandCargo hail verb on a willing
  // hull sets surrendered, bumps the witnessed capitulation and emits the
  // player-caused receipt. This diff does not touch that path — the +2 must
  // survive for a bound quarry exactly as for anyone else.
  live2.ai.lastAttacker = 'player';
  ctx.emit('hailOpened', { ship: live2, intents: ['demandCargo'] });
  step(1 / 60);
  const fearBefore = ctx.world.fear;
  const res = ctx.hailApi.resolve('demandCargo');
  assert.equal(res, '', 'the demandCargo verb resolved');
  assert.equal(ctx.world.fear, fearBefore + ECON.fear.capitulation, 'witnessed capitulation +2');
  assert.ok(live2.state.surrendered, 'the hull yielded');
  step(1 / 60);
  // Finish the yielded hull. It is NOT the accepted hunt's bound quarry:
  // the full killedSurrendered cost stands, and the companion rages.
  const midFear = ctx.world.fear;
  finishHull(live2);
  assert.equal(ctx.world.fear, midFear + ECON.fear.killedSurrendered, 'non-quarry surrendered kill keeps the +8');
  assert.equal(ctx.bio.mood, 'feral', 'the companion rages at the non-quarry kill');
});

check('C2 the atrocity event fires for the non-quarry kill', () => {
  // The previous check's kill already went through bio; re-run a clean hull.
  const rec3 = livingPirates('freehold')[0];
  const live3 = rec3 ? spawnShip(rec3, [300, 0, 0]) : null;
  if (!live3) { console.log('SKIP C2 (no living pirate left)'); return; }
  live3.state.disabled = true;
  finishHull(live3);
  const saw = [...ctx.lastEvents, ...ctx.events].some((e) => e.type === 'atrocity');
  assert.ok(saw, 'atrocity fires for a disabled bystander');
});

// ---------------------------------------------------------------------------
// C3. The +2 capitulation is pinned on the ACCEPTED contract's BOUND quarry.
//
// Issue #284: C1's comment claims "the +2 must survive for a bound quarry
// exactly as for anyone else", but the hull it hails is deliberately UNBOUND —
// the check splices every offered hunt first so rec2 names no live job. The
// interaction the comment describes — resolving the demandCargo verb on the
// contract's own bound quarry — was asserted nowhere, so a future edit to
// isHuntQuarry or the capitulation path could silently change that case
// without failing the suite. This check drives the real resolver (hailOpened
// -> one frame -> ctx.hailApi.resolve('demandCargo')) against a hull the
// accepted hunt actually binds, and then finishes it to pin the #265
// exemptions B1 asserts for the stamped shape.
// ---------------------------------------------------------------------------

// Issue #284: B1 stamps the quarry surrendered by hand (the "already broken"
// shape). The resolver-driven shape needs the opposite preconditions: an
// intact, unyielded hull the player broke, so the hail card opens and the
// yield is the card's doing. This helper resets the bound record to a live,
// intact yield candidate and instantiates it, mirroring what a player flying
// the approach sees. traffic.js folds any live hull whose record reads dead
// or captured (traffic.js despawn pass, `ended`), so the record must read
// alive for the instance to stay in ctx.ships — resetting the record state
// is the disclosed fixture that keeps the respawn flying.
function respawnIntactBoundQuarry(job) {
  const quarryRec = recordById(job.recordId);
  assert.ok(quarryRec, 'the bound record resolves');
  quarryRec.state = 'enroute';
  const liveQ = spawnShip(quarryRec, [-60, 0, 40]);
  assert.ok(liveQ, 'the bound quarry instantiated');
  // The hull is willing to talk: the player broke it, it has not yielded.
  liveQ.ai.lastAttacker = 'player';
  assert.ok(!liveQ.state.surrendered && !liveQ.state.disabled && !liveQ.state.destroyed,
    'the bound hull is an intact yield candidate (surrenderPayoutOk)');
  return { quarryRec, liveQ };
}

check('C3 the bound quarry pays the witnessed +2 through the real hail resolver', () => {
  // The accepted hunt from A2 still stands (B1 only killed its quarry's
  // record state; the job row is unchanged). The bind is record-id precise
  // (prize.js isHuntQuarry reads the RECORD id, not the instance), so the
  // re-engaged hull is still the contract's bound quarry — exactly the hull
  // a player fights when the approach resumes.
  const job = acceptedHunt();
  assert.ok(job, 'the accepted hunt from A2 still stands');
  const { quarryRec, liveQ } = respawnIntactBoundQuarry(job);
  // The hull must be OUT of the berth for the hail card to open and resolve:
  // the berth owns the screen (issue #100) and B1 undocked for its own kill,
  // so C3 re-undocks first. Without this the resolver answers 'docked' and
  // nothing moves — the exact live behavior this check exists to pin.
  if (ctx.flags.docked) ctx.stationDesk.undock();
  assert.equal(ctx.flags.docked, false, 'C3 is flown in space, not at the desk');
  // The real yield resolver: open the bargaining card on the BOUND hull and
  // resolve demandCargo. hail.js's admission boundary (surrenderPayoutOk)
  // accepts the card, the resolution sets surrendered and bumps the witnessed
  // capitulation (+2) — the exempt kill's own approach behavior, untouched by
  // the #265 exemption (only the kill fear and the atrocity gate skip).
  ctx.emit('hailOpened', { ship: liveQ, intents: ['demandCargo'] });
  step(1 / 60);
  const fearBefore = ctx.world.fear;
  const res = ctx.hailApi.resolve('demandCargo');
  assert.equal(res, '', 'the demandCargo verb resolved on the bound quarry');
  assert.equal(ctx.world.fear, fearBefore + ECON.fear.capitulation,
    'witnessed capitulation +2 for the bound quarry');
  assert.ok(liveQ.state.surrendered, 'the bound hull yielded');
  step(1 / 60);
  // Finish the yielded bound quarry: the #265 exemptions hold for the
  // resolver-driven shape too — no killedSurrendered fear, no feral rage,
  // no atrocity — and the record settles dead. The feral gate is asserted
  // through the atrocity event above: bio's mood machine holds the previous
  // mood between bands with hysteresis, so after C2's rage the 60 s feral
  // window can still be running and mood is not a clean read here. The
  // event-level assertion is the exact thing the #265 exemption changes.
  const midFear = ctx.world.fear;
  const moodBefore = ctx.bio.mood;
  finishHull(liveQ);
  const sawAtrocity = [...ctx.lastEvents, ...ctx.events].some((e) => e.type === 'atrocity');
  assert.ok(!sawAtrocity, 'no atrocity event for the resolver-driven contract kill');
  assert.equal(ctx.world.fear, midFear, 'no killedSurrendered fear for the bound-quarry kill');
  assert.ok(quarryRec.state === 'dead', 'the bound record settles dead');
});

// ---------------------------------------------------------------------------
// D. Records stay JSON-plain; the save snapshot round-trips.
// ---------------------------------------------------------------------------
check('D1 jobs and records stay JSON-plain', () => {
  const copy = JSON.parse(JSON.stringify(ctx.world.jobs));
  assert.ok(Array.isArray(copy), 'jobs snapshot JSON-safe');
  for (const j of copy) {
    if (j.kind !== 'hunt') continue;
    assert.equal(typeof j.recordId, 'string', 'hunt binds a record id');
  }
  const bankCopy = JSON.parse(JSON.stringify(bank()));
  assert.ok(bankCopy.length >= 1, 'bank snapshot JSON-safe');
});

console.log('issue-265 hunt lawful kill: ' + checks + ' checks passed');
