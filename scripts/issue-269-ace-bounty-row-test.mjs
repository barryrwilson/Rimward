/**
 * Issue #269 — the faction ace bounty row named an ordinary pirate at 300 UU on
 * Veridian's board, and kept that dead pirate's name after the kill.
 *
 *  A. A fresh Freehold, Veridian and Redmarch board names ONLY the living
 *     Named Gun record — at the ace's own posted bounty — and never an ordinary
 *     pirate's name or price. The player-facing card and the agent observation
 *     agree, and the gate note points at the system the named ace hunts in.
 *  B. EVERY board (all 101 authored + generated systems) posts an ace row that
 *     names a real, living ace record at that record's bounty; the persisted
 *     job row agrees with the board.
 *  C. Fear raises Sister Vane in the Redmarch; her own board names her. An
 *     ace-less board still names the faction ace (home precedence), and when
 *     Carver Illyx dies a living Named Gun takes the row — a dead target never
 *     stays on it.
 *  D. With no living Named Gun the offered ace row is withdrawn from the board
 *     and the agent observation, on every dock, while the persisted row is
 *     hidden (never spliced) so a successor can re-offer it.
 *  E. The real aspirant cycle re-offers the row with the new name; an accepted
 *     ace contract pays the posted bounty exactly once on the player's kill.
 *  F. An old save's ACCEPTED ace row that carries an ordinary pirate's name is
 *     still payable (legacy agreement), and no board rewrites it while no
 *     Named Gun flies.
 *  G. A kill the player did not make settles nothing; the player's own kill
 *     then pays once.
 *
 * Real station DOM, the real Jobs board, the real desk accept path, the real
 * agent observation and the real throttled delivery tick. Fixtures are disclosed
 * record-state flips (a kill is a combat result, not a board rule), one
 * milestone push that the real milestone system would have made, and an
 * explicitly injected legacy agreement in the exact shape the pre-#269 accept
 * path stamped.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-269-ace-bounty-row-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS, ACES, NAMED_GUNS } from '../src/game/state.js';

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
const active = () => window.rimward.observe().jobs.active;
const jobById = (id) => ctx.world.jobs.find((j) => j && j.id === id);
const aceRow = () => jobById('bounty-ace');
const aceOffer = () => offers().find((o) => o.id === 'bounty-ace');

function step(count = 1) {
  for (let i = 0; i < count; i++) {
    ctx.world.time += 1 / 60;
    ctx.elapsed += 1 / 60;
    station.update(1 / 60);
    save.update(1 / 60);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

/** Berth at `id` on the real dock path (the #170/#206 fixture). */
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
  assert.equal(ctx.world.currentSystem, id, 'berthed in ' + id);
}

function allAceRecords() {
  const out = [];
  for (const [sysId, bank] of Object.entries(ctx.world.recordBanks ?? {})) {
    if (!Array.isArray(bank)) continue;
    for (const rec of bank) {
      if (rec && (rec.role === 'ace' || rec.classKey === 'ace')) out.push({ sysId, rec });
    }
  }
  return out;
}
const liveAces = () => allAceRecords().filter(({ rec }) => rec.state !== 'dead' && rec.state !== 'captured');
const aceRecordNamed = (name) => allAceRecords().find(({ rec }) => rec.name === name)?.rec ?? null;
const pirateNames = () => {
  const names = new Set();
  for (const bank of Object.values(ctx.world.recordBanks ?? {})) {
    if (!Array.isArray(bank)) continue;
    for (const rec of bank) if (rec && rec.role === 'pirate') names.add(rec.name);
  }
  return names;
};
const aceTitles = () => byClass('job-title')
  .map((n) => String(n.textContent).replace(/^\d+\.\s*/, '')) // board rows are numbered
  .filter((t) => /^Bounty: /.test(t));
const titleFor = (name) => `Bounty: ${name}`;
const rewardLines = () => byClass('job-reward')
  .map((n) => String(n.textContent))
  .filter((t) => /^Reward: \d+ UU$/.test(t));
const gateNote = () => byClass('job-state')
  .find((n) => /take the gate/.test(String(n.textContent)))?.textContent ?? null;

/** One board's ace row: the offer, the record it must name, the persisted row,
 * and the player-facing card. A dead target or a pirate's name fails here. */
function assertAceBoard(offer, name, bounty) {
  assert.ok(offer, 'ace posting is offered');
  assert.equal(offer.id, 'bounty-ace');
  assert.equal(offer.kind, 'bounty');
  assert.equal(offer.target, name, 'names the living Named Gun');
  assert.equal(offer.reward, bounty, 'posts the ace\'s own bounty');
  const rec = aceRecordNamed(name);
  assert.ok(rec, `${name} is a real ace record`);
  assert.equal(rec.role, 'ace');
  assert.ok(rec.state !== 'dead' && rec.state !== 'captured', `${name} is alive`);
  assert.equal(rec.bounty, bounty);
  assert.equal(pirateNames().has(name), false, `${name} is not an ordinary pirate`);
  const row = aceRow();
  assert.equal(row.target, name, 'the persisted row agrees with the board');
  assert.equal(row.reward, bounty);
}

for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;

// ---------------------------------------------------------------------------
// A. Fresh boards name the Named Gun, not an ordinary pirate at 300 UU.
// ---------------------------------------------------------------------------
check('A1 fresh Freehold board names the cast ace at his own bounty', () => {
  dock('freehold');
  openBoard();
  assertAceBoard(aceOffer(), ACES.illyx.name, ACES.illyx.bounty);
  assert.ok(aceTitles().includes(titleFor(ACES.illyx.name)), 'the player reads the ace card');
  assert.equal(aceTitles().filter((t) => t === titleFor(ACES.illyx.name)).length, 1,
    'exactly one ace card is drawn');
  assert.ok(rewardLines().includes(`Reward: ${ACES.illyx.bounty} UU`), 'the card shows the ace bounty');
  assert.equal(gateNote(), null, 'his own berth needs no gate note');
});

check('A2 Veridian board names the faction ace — never an ordinary pirate at 300 UU', () => {
  dock('veridian');
  openBoard();
  const offer = aceOffer();
  assertAceBoard(offer, ACES.illyx.name, ACES.illyx.bounty);
  assert.notEqual(offer.reward, 300, 'the reported pirate price is gone');
  assert.ok(aceTitles().includes(titleFor(ACES.illyx.name)), 'the player reads the ace card');
  assert.ok(rewardLines().includes(`Reward: ${ACES.illyx.bounty} UU`), 'the card shows the ace bounty');
  const home = SYSTEMS[ACES.illyx.system];
  assert.equal(gateNote(), `He hunts in ${home.name} — take the gate.`,
    'the note names where the named ace actually hunts');
});

check('A3 Redmarch board names the faction ace before Sister Vane rises', () => {
  assert.equal(aceRecordNamed(ACES.hunter.name), null, 'Sister Vane has not risen yet');
  dock('redmarch');
  openBoard();
  assertAceBoard(aceOffer(), ACES.illyx.name, ACES.illyx.bounty);
  const home = SYSTEMS[ACES.illyx.system];
  assert.equal(gateNote(), `He hunts in ${home.name} — take the gate.`);
});

// ---------------------------------------------------------------------------
// B. EVERY board posts an ace row naming a living ace record at its bounty.
// ---------------------------------------------------------------------------
check('B1 every board names a living ace record at that record\'s own bounty', () => {
  const ids = Object.keys(SYSTEMS);
  assert.ok(ids.length >= 100, 'authored and generated systems are covered');
  for (const id of ids) {
    dock(id);
    // Read-only board projection (the same one the agent observes): the DOM
    // parity of the player-facing card is proven on the authored boards above.
    const offer = ctx.stationDesk.peekOffers().find((j) => j && j.id === 'bounty-ace');
    assert.ok(offer, `${id}: ace posting is offered while a Named Gun flies`);
    const rec = aceRecordNamed(offer.target);
    assert.ok(rec, `${id}: "${offer.target}" is a real ace record, not an ordinary pirate`);
    assert.ok(rec.state !== 'dead' && rec.state !== 'captured', `${id}: "${offer.target}" is alive`);
    assert.equal(offer.reward, rec.bounty, `${id}: posts the ace's own bounty`);
    const row = aceRow();
    assert.equal(row.target, offer.target, `${id}: persisted row agrees`);
    assert.equal(row.reward, offer.reward, `${id}: persisted reward agrees`);
  }
  console.log(`  covered ${ids.length} boards`);
});

// ---------------------------------------------------------------------------
// C. A living Named Gun takes the row; a dead target never stays on it.
// ---------------------------------------------------------------------------
check('C1 fear raises Sister Vane and her own Redmarch board names her', () => {
  ctx.world.fear = ACES.hunter.fearThreshold + 15;
  dock('redmarch');
  const vane = aceRecordNamed(ACES.hunter.name);
  assert.ok(vane, 'Sister Vane joined the Redmarch record bank');
  assert.equal(vane.role, 'ace');
  assert.equal(vane.bounty, ACES.hunter.bounty);
  openBoard();
  assertAceBoard(aceOffer(), ACES.hunter.name, ACES.hunter.bounty);
  assert.ok(aceTitles().includes(titleFor(ACES.hunter.name)), 'the player reads her card');
  assert.ok(rewardLines().includes(`Reward: ${ACES.hunter.bounty} UU`));
  assert.equal(gateNote(), null, 'her own berth needs no gate note');
});

check('C2 an ace-less board still names the faction ace, not the local hunter', () => {
  dock('veridian');
  openBoard();
  assertAceBoard(aceOffer(), ACES.illyx.name, ACES.illyx.bounty);
  const home = SYSTEMS[ACES.illyx.system];
  assert.equal(gateNote(), `He hunts in ${home.name} — take the gate.`);
});

check('C3 a dead ace never stays on the board; the living Named Gun takes the row', () => {
  for (const { rec } of allAceRecords()) if (rec.name === ACES.illyx.name) rec.state = 'dead';
  assert.ok(liveAces().some(({ rec }) => rec.name === ACES.hunter.name), 'Sister Vane still flies');
  dock('veridian');
  openBoard();
  assertAceBoard(aceOffer(), ACES.hunter.name, ACES.hunter.bounty);
  assert.ok(aceTitles().includes(titleFor(ACES.hunter.name)), 'the player reads her card');
  assert.equal(aceTitles().includes(titleFor(ACES.illyx.name)), false, 'dead Illyx is not drawn');
  const home = SYSTEMS[ACES.hunter.system];
  assert.equal(gateNote(), `He hunts in ${home.name} — take the gate.`);
});

// ---------------------------------------------------------------------------
// D. No living Named Gun: the offered ace posting is withdrawn, row hidden.
// ---------------------------------------------------------------------------
check('D1 no living Named Gun withdraws the offered ace posting on every dock', () => {
  for (const { rec } of allAceRecords()) if (rec.name === ACES.hunter.name) rec.state = 'dead';
  assert.equal(liveAces().length, 0, 'no Named Gun flies');
  for (const id of ['veridian', 'freehold', 'redmarch']) {
    dock(id);
    openBoard();
    assert.equal(aceOffer(), undefined, `${id}: the agent observation has no ace offer`);
    assert.equal(ctx.stationDesk.peekOffers().some((j) => j.id === 'bounty-ace'), false,
      `${id}: the desk does not post it`);
    assert.equal(aceTitles().includes(titleFor(ACES.hunter.name)), false,
      `${id}: the dead target is not drawn`);
    const row = aceRow();
    assert.ok(row, `${id}: the persisted row is kept`);
    assert.equal(row.state, 'offered', `${id}: hidden, never spliced or rewritten`);
    assert.equal(row.target, ACES.hunter.name, `${id}: the row still carries the last agreement`);
  }
});

// ---------------------------------------------------------------------------
// E. The real aspirant cycle re-offers the row; the claim pays once.
// ---------------------------------------------------------------------------
check('E1 the aspirant cycle re-offers the ace posting in the current system', () => {
  // Fixture: the milestone + fear the real milestone system sets before the
  // aspirant cycle can fire; the spawn itself is the production path.
  if (!ctx.world.milestones.includes('rimWithoutGuns')) ctx.world.milestones.push('rimWithoutGuns');
  ctx.world.fear = NAMED_GUNS.aspirants.fearThreshold;
  ctx.world.currentSystem = 'veridian';
  world.update(0);
  const name = NAMED_GUNS.aspirants.names[0];
  const aspirant = aceRecordNamed(name);
  assert.ok(aspirant, `${name} rose in the current bank`);
  assert.equal(aspirant.role, 'ace');
  assert.equal(aspirant.bounty, NAMED_GUNS.aspirants.bounty);
  assert.ok(aspirant.state !== 'dead' && aspirant.state !== 'captured', 'the aspirant is alive');
  dock('veridian');
  openBoard();
  assertAceBoard(aceOffer(), name, NAMED_GUNS.aspirants.bounty);
  assert.ok(aceTitles().includes(titleFor(name)), 'the re-offered card is drawn');
  assert.ok(rewardLines().includes(`Reward: ${NAMED_GUNS.aspirants.bounty} UU`));
  assert.equal(gateNote(), null, 'rose in this system');
});

check('E2 an accepted ace contract pays the posted bounty exactly once on your kill', () => {
  openBoard();
  const before = ctx.world.credits;
  const res = ctx.stationDesk.acceptJob('bounty-ace');
  assert.equal(res.ok, true, JSON.stringify(res));
  const name = NAMED_GUNS.aspirants.names[0];
  const row = aceRow();
  assert.equal(row.state, 'accepted');
  assert.equal(row.target, name);
  assert.equal(row.reward, NAMED_GUNS.aspirants.bounty);
  ctx.world.incidents.length = 0; // fixture: this claim's own incident only
  aceRecordNamed(name).state = 'dead';
  ctx.world.incidents.push({ name, causer: 'player' });
  step(31); // the 0.5 s delivery tick
  assert.equal(aceRow().state, 'done', 'the claim settled');
  assert.equal(ctx.world.credits - before, NAMED_GUNS.aspirants.bounty, 'paid the posted bounty');
  const settled = ctx.world.credits;
  step(120); // two more seconds: no second payout
  assert.equal(ctx.world.credits, settled, 'a settled claim is never paid again');
  assert.equal(aceRow().state, 'done');
});

// ---------------------------------------------------------------------------
// F. A legacy ACCEPTED ace row that carries an ordinary pirate's name pays.
// ---------------------------------------------------------------------------
check('F1 an old save\'s pirate-named ace agreement is still payable', () => {
  ctx.world.incidents.length = 0;
  const bank = ctx.world.recordBanks?.veridian ?? [];
  const pirate = bank.find((r) => r && r.role === 'pirate' && r.bounty > 0
    && r.state !== 'dead' && r.state !== 'captured');
  assert.ok(pirate, 'a live bounty pirate exists in the Veridian bank');
  // Fixture: the exact row the pre-#269 accept path stamped — an ace posting
  // whose target is an ordinary pirate. Nothing on the board rewrites it while
  // no Named Gun flies.
  const row = aceRow();
  row.state = 'accepted';
  row.target = pirate.name;
  row.reward = pirate.bounty;
  row.title = titleFor(pirate.name);
  row.progress = 0;
  delete row.payQuoted;
  dock('veridian');
  openBoard();
  assert.equal(aceOffer(), undefined, 'no offered ace row without a Named Gun');
  const seen = active().find((o) => o.id === 'bounty-ace');
  assert.ok(seen, 'the accepted agreement is still observable in flight');
  assert.equal(seen.target, pirate.name);
  assert.equal(seen.reward, pirate.bounty);
  const credits = ctx.world.credits;
  pirate.state = 'dead';
  ctx.world.incidents.push({ name: pirate.name, causer: 'player', kind: 'destroyed' });
  step(31);
  assert.equal(aceRow().state, 'done', 'the legacy agreement settled');
  assert.equal(ctx.world.credits - credits, pirate.bounty, 'paid its posted bounty');
  const settled = ctx.world.credits;
  step(120);
  assert.equal(ctx.world.credits, settled, 'paid exactly once');
});

// ---------------------------------------------------------------------------
// G. A kill that was not yours settles nothing.
// ---------------------------------------------------------------------------
check('G1 a world kill pays nothing; your own kill then pays once', () => {
  ctx.world.incidents.length = 0;
  const name = NAMED_GUNS.aspirants.names[0];
  const aspirant = aceRecordNamed(name);
  aspirant.state = 'enroute'; // fixture: the aspirant flies again
  const row = aceRow();
  row.state = 'offered';
  row.progress = 0;
  delete row.payQuoted;
  dock('veridian');
  openBoard();
  assertAceBoard(aceOffer(), name, NAMED_GUNS.aspirants.bounty);
  const res = ctx.stationDesk.acceptJob('bounty-ace');
  assert.equal(res.ok, true, JSON.stringify(res));
  const credits = ctx.world.credits;
  aspirant.state = 'dead';
  ctx.world.incidents.push({ name, causer: 'world' });
  step(31);
  assert.equal(aceRow().state, 'accepted', 'a world kill does not settle the claim');
  assert.equal(ctx.world.credits, credits, 'nothing was paid');
  ctx.world.incidents.push({ name, causer: 'player' });
  step(31);
  assert.equal(aceRow().state, 'done');
  assert.equal(ctx.world.credits - credits, NAMED_GUNS.aspirants.bounty, 'your kill pays');
  const settled = ctx.world.credits;
  step(120);
  assert.equal(ctx.world.credits, settled, 'paid exactly once');
});

console.log(`\nOK issue-269 ace bounty row — ${checks} checks`);
