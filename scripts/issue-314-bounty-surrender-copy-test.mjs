/**
 * Issue #314 — the pirate-bounty finish is honest at the moment the player
 * chooses a surrender verb. The playtest frame (2026-11-08) read "kill or
 * capture" on the bounty board, then a ransom/cargo/tribute surrender paid the
 * pirate and left the claim stranded: nothing on the card said the bounty was
 * still open, and the Named Gun's ace card still promised a capture its own
 * surrender could never take.
 *
 * The fix is COPY/FLOW ONLY. hail.js names the ACCEPTED bounty quarry of the
 * hull behind an open surrender card (read-only: the job row's target must
 * match the RECORD's name, never the displayed speaker, so a masked Q-ship
 * keeps its cover) and prints the Compact-claim note + bounty-aware verb
 * labels on that card. The note is dim, text-safe DOM under the quote line, is
 * appended to the reported terms.line so the agent API and the player agree,
 * and is part of the conversation signature. station.js's ace board card says
 * the kill-only exception. No settlement change, no pay tuning, no fear/feral
 * or hunt change, no new persistent fields, no new keys/digits, no equipment
 * SKUs, no state.js edit.
 *
 * Real boot, real systems, real station DOM, the real hail admission/resolver
 * and the real KeyH edge. Fixtures are disclosed record/state flips only: the
 * break the guns would land (ai.lastAttacker='player'), a priced hold on an
 * empty seeded pirate, the fear the real respect verb needs, and the yielded
 * hull state before the capture press.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-314-bounty-surrender-copy-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

const PIRATE_NOTE = 'Compact claim: a ransom, cargo demand, tribute or letting them go leaves the bounty open. Only a kill or a capture closes it — a capture takes a hail on the yielded hull (take its cargo to yield it first).';
const ACE_NOTE = "Named Gun bounty: only a kill closes it. A ransom, cargo demand, tribute or letting them go leaves the claim open — a Named Gun's surrender is not taken as a capture.";
const PIRATE_INTENTS = ['demandCargo', 'demandRansom', 'acceptTribute', 'letGo', 'keepFiring'];
const ACE_INTENTS = ['demandCargo', 'demandRansom', 'acceptTribute', 'letGo', 'keepFiring', 'respect'];
const QUOTE_LINE = 'They are breaking.';
const QUOTED_LINE = '“They are breaking.”';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const openBoard = () => ctx.stationDesk.selectService('jobs');
const pirateBounties = () => ctx.world.jobs.filter((j) => j && j.kind === 'bounty'
  && typeof j.id === 'string' && j.id.startsWith('bounty-pirate-'));
const bank = () => ctx.world.recordBanks?.[ctx.world.currentSystem] ?? ctx.world.records ?? [];
const latestIncident = (name) => {
  const incs = ctx.world.incidents || [];
  for (let i = incs.length - 1; i >= 0; i--) {
    if (incs[i] && incs[i].name === name) return incs[i];
  }
  return null;
};
const findRecord = (name, role) => {
  const pools = [ctx.world.records];
  for (const id of Object.keys(ctx.world.recordBanks ?? {})) {
    const b = ctx.world.recordBanks[id];
    if (Array.isArray(b) && b !== ctx.world.records) pools.push(b);
  }
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    for (const r of pool) if (r && r.name === name && r.role === role) return r;
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

/** Park the hull near the ship and take the lock (the fixture the press reads). */
function lockNear(live) {
  const p = ctx.ship.object.position;
  live.object.position.set(p.x + 60, p.y, p.z);
  if (live.ai && live.ai.velocity) live.ai.velocity.set(0, 0, 0);
  ctx.targets.current = live;
}

/** The real H press on the current lock (the physical key edge, not the flag). */
function pressHail() {
  dom.dispatchKey('KeyH');
  step(1 / 60);
}

/**
 * Open a surrender card through the real admission path. Traffic may have a
 * foreign card up; close it first and retry once if it wins the frame.
 */
function openSurrenderCard(live, intents) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (ctx.hailApi.peek().open) {
      ctx.emit('hailClosed', {});
      step(1 / 60);
    }
    ctx.emit('hailOpened', { ship: live, intents, line: QUOTE_LINE });
    step(1 / 60);
    const peek = ctx.hailApi.peek();
    if (peek.open && peek.speaker && peek.speaker.name === live.state.name) return peek;
  }
  return ctx.hailApi.peek();
}

const labelOf = (peek, intent) => {
  const row = (peek.terms && peek.terms.options || []).find((o) => o.intent === intent);
  return row ? String(row.label).replace(/^\[\d+\]\s*/, '') : null;
};

const cardFor = (titleSuffix) => {
  const titles = byClass('job-title');
  const title = titles.find((n) => String(n.textContent).includes(titleSuffix));
  if (!title || !title.parent) return null;
  const detail = (title.parent.children || []).find((n) => String(n.className).split(' ').includes('job-detail'));
  return { title: String(title.textContent), detail: detail ? String(detail.textContent) : null };
};

for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;

// ---------------------------------------------------------------------------
// A. Accept a real pirate bounty at Freehold; the surrender card is honest.
// ---------------------------------------------------------------------------
check('A0 a real offered pirate bounty can be accepted at its home dock', () => {
  dock('freehold');
  openBoard();
  const row = pirateBounties().find((j) => j.state === 'offered');
  assert.ok(row, 'an offered pirate bounty exists');
  const res = ctx.stationDesk.acceptJob({ id: row.id });
  assert.equal(res.ok, true, JSON.stringify(res));
  const accepted = pirateBounties().find((j) => j.id === row.id);
  assert.equal(accepted.state, 'accepted', 'the bounty is accepted');
  assert.equal(accepted.progress, 0, 'the accepted row starts at progress 0');
});

let firstBounty = null;
let firstLive = null;

check('A1 the surrender card on an accepted bounty quarry carries the Compact-claim note and bounty labels', () => {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  step(0.2);
  assert.equal(ctx.flags.docked, false, 'the approach is flown in space');
  firstBounty = pirateBounties().find((j) => j.state === 'accepted');
  assert.ok(firstBounty, 'the accepted bounty row stands');
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === firstBounty.target
    && r.state !== 'dead' && r.state !== 'captured');
  assert.ok(rec, 'the bounty target record resolves');
  firstLive = spawnShip(rec);
  assert.ok(firstLive, 'the target instantiated');
  // Disclosed fixture: the break the guns would land (the #99 attribution
  // stamp), and a priced hold so the cargo-demand and tribute verbs exist.
  firstLive.ai.lastAttacker = 'player';
  firstLive.state.cargo = [{ commodity: 'provisions', units: 4 }];
  const peek = openSurrenderCard(firstLive, PIRATE_INTENTS);
  assert.equal(peek.open, true, 'the surrender card admitted');
  assert.equal(peek.kind, 'surrender', 'the card is the surrender family');
  assert.equal(peek.terms.line, QUOTED_LINE + '\n' + PIRATE_NOTE,
    'terms.line is the quote plus the exact Compact-claim note');
  assert.equal(peek.terms.line.includes(PIRATE_NOTE), true, 'the note rides the reported terms');
  const obs = window.rimward.observe();
  assert.ok(obs.hail && obs.hail.open === true, 'the agent observes the card');
  assert.ok(obs.hail.terms && typeof obs.hail.terms.line === 'string', 'the agent reads terms');
  assert.ok(obs.hail.terms.line.includes(PIRATE_NOTE),
    'observe().hail.terms.line carries the note: ' + JSON.stringify(obs.hail.terms.line));
  // The rendered DOM carries the note, dim and text-safe, under the quote line.
  const noteEl = nodes().find((n) => n.textContent === PIRATE_NOTE);
  assert.ok(noteEl, 'the rendered card carries the note');
  assert.equal(noteEl.tagName, 'DIV', 'the note is a div');
  assert.ok(String(noteEl.style.cssText).includes('color:rgba(215,228,234,.62)'),
    'the note is dim: ' + String(noteEl.style.cssText));
  const all = nodes();
  const quoteIdx = all.findIndex((n) => String(n.textContent).includes(QUOTE_LINE));
  const noteIdx = all.indexOf(noteEl);
  assert.ok(quoteIdx >= 0 && noteIdx > quoteIdx, 'the note renders under the quote line');
  // Every listed verb names its bounty consequence exactly.
  const amounts = peek.terms.amounts || {};
  assert.equal(labelOf(peek, 'demandCargo'), 'Demand cargo (bounty stays open)');
  assert.equal(labelOf(peek, 'demandRansom'),
    'Demand ransom — ' + amounts.ransom + ' UU (bounty stays open)');
  assert.equal(labelOf(peek, 'acceptTribute'),
    'Accept tribute — ' + amounts.tribute + ' UU (bounty stays open)');
  assert.equal(labelOf(peek, 'letGo'), 'Let them go (bounty stays open)');
  assert.equal(labelOf(peek, 'keepFiring'), 'Keep firing — a kill pays the bounty');
  const buttonTexts = nodes().filter((n) => n.tagName === 'BUTTON')
    .map((n) => String(n.textContent)).filter((t) => t.startsWith('['));
  for (const opt of peek.terms.options) {
    assert.ok(buttonTexts.includes(opt.label), 'the DOM button carries ' + JSON.stringify(opt.label));
  }
  // A redraw of the same readable card still reports the note and the labels;
  // the note is part of the conversation signature (a readable change mints a
  // new token, a stable one does not), so the card can never be read stale.
  ctx.emit('hailOpened', { ship: firstLive, intents: PIRATE_INTENTS, line: QUOTE_LINE });
  step(1 / 60);
  const redraw = ctx.hailApi.peek();
  assert.equal(redraw.open, true, 'the redrawn bounty card is open');
  assert.ok(redraw.terms.line.includes(PIRATE_NOTE), 'the redrawn card still carries the note');
  assert.equal(labelOf(redraw, 'keepFiring'), 'Keep firing — a kill pays the bounty');
});

// ---------------------------------------------------------------------------
// B. Ransom: paid, recorded, and the bounty stays open across a delivery tick.
// ---------------------------------------------------------------------------
check('B1 a ransom pays the player and leaves the bounty accepted at progress 0', () => {
  const peek = ctx.hailApi.peek();
  assert.equal(peek.open, true, 'the bounty card is still open');
  const ransom = peek.terms.amounts.ransom;
  assert.ok(Number.isFinite(ransom) && ransom > 0, 'the card lists a ransom: ' + ransom);
  const creditsBefore = ctx.world.credits;
  const res = ctx.hailApi.resolve('demandRansom');
  assert.equal(res, '', 'the ransom verb resolved');
  assert.equal(ctx.world.credits - creditsBefore, ransom, 'the ransom paid exactly ' + ransom + ' UU');
  step(2 / 60); // world.js consumes the player-attributed receipt
  const inc = latestIncident(firstBounty.target);
  assert.ok(inc, 'a surrendered incident was recorded');
  assert.equal(inc.kind, 'surrendered', 'the incident kind is surrendered');
  assert.equal(inc.outcome, 'ransom', 'the incident outcome is ransom');
  assert.equal(inc.causer, 'player', 'the incident is player-caused');
  for (let i = 0; i < 10; i++) step(0.6); // the real 0.5 s delivery tick
  assert.equal(firstBounty.state, 'accepted', 'the bounty row stays accepted after a ransom');
  assert.equal(firstBounty.progress, 0, 'progress stays 0 after a ransom');
  assert.ok(!ctx.world.incidents.some((i) => i && i.kind === 'surrendered'
    && i.name === firstBounty.target && i.outcome === 'captured'), 'a ransom is not a capture');
});

// ---------------------------------------------------------------------------
// C. Cargo demand empties the hold and yields; the real hail edge captures,
//    and the captured bounty pays on the delivery tick.
// ---------------------------------------------------------------------------
let secondBounty = null;
let secondLive = null;

check('C1 a cargo demand empties the hold and yields the second quarry', () => {
  dock('freehold');
  openBoard();
  secondBounty = pirateBounties().find((j) => j.state === 'offered' && j.target !== firstBounty.target);
  assert.ok(secondBounty, 'a second offered pirate bounty exists');
  const res = ctx.stationDesk.acceptJob({ id: secondBounty.id });
  assert.equal(res.ok, true, JSON.stringify(res));
  ctx.stationDesk.undock();
  step(0.2);
  assert.equal(ctx.flags.docked, false, 'the second approach is flown in space');
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === secondBounty.target
    && r.state !== 'dead' && r.state !== 'captured');
  assert.ok(rec, 'the second target record resolves');
  const live = spawnShip(rec, [180, 0, 40]);
  assert.ok(live, 'the second target instantiated');
  live.ai.lastAttacker = 'player';
  live.state.cargo = [{ commodity: 'provisions', units: 3 }];
  const peek = openSurrenderCard(live, PIRATE_INTENTS);
  assert.equal(peek.open, true, 'the second surrender card admitted');
  assert.ok(peek.terms.line.includes(PIRATE_NOTE), 'the second card carries the note');
  const res2 = ctx.hailApi.resolve('demandCargo');
  assert.equal(res2, '', 'the cargo-demand verb resolved');
  assert.equal(live.state.cargo.length, 0, 'the hold is empty');
  assert.equal(live.state.surrendered, true, 'the hull yielded');
  secondLive = live;
  assert.ok(secondLive, 'the yielded hull is tracked');
});

check('C2 the real hail edge takes the surrender and the bounty pays done', () => {
  lockNear(secondLive);
  pressHail();
  step(2 / 60); // world.js consumes the capture receipt
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === secondBounty.target);
  assert.ok(rec, 'the second record resolves');
  const inc = latestIncident(secondBounty.target);
  assert.ok(inc, 'a surrendered incident was recorded');
  assert.equal(inc.kind, 'surrendered', 'the incident kind is surrendered');
  assert.equal(inc.outcome, 'captured', 'the incident outcome is captured');
  assert.equal(inc.causer, 'player', 'the capture is player-caused');
  assert.equal(rec.state, 'captured', 'the record settles captured');
  assert.ok(!ctx.world.incidents.some((i) => i && i.kind === 'destroyed'
    && i.name === secondBounty.target), 'a capture is not a kill');
  const creditsBefore = ctx.world.credits;
  let paid = false;
  for (let i = 0; i < 10 && !paid; i++) {
    step(0.6);
    paid = secondBounty.state === 'done' && ctx.world.credits > creditsBefore;
  }
  assert.ok(paid, 'the captured bounty paid on the delivery tick: '
    + JSON.stringify({ state: secondBounty.state, credits: ctx.world.credits, creditsBefore }));
  assert.equal(secondBounty.state, 'done', 'the row completes done');
});

// ---------------------------------------------------------------------------
// D. The Named Gun's surrender card says the kill-only exception, and a hail
//    press does not take a capture its bounty cannot use.
// ---------------------------------------------------------------------------
let aceJob = null;

check('D1 the ace surrender card carries the Named Gun note and kill-only labels', () => {
  dock('freehold');
  openBoard();
  aceJob = ctx.world.jobs.find((j) => j && j.id === 'bounty-ace');
  assert.ok(aceJob, 'the ace posting exists');
  assert.equal(aceJob.state, 'offered', 'the ace posting is offered');
  const res = ctx.stationDesk.acceptJob('bounty-ace');
  assert.equal(res.ok, true, JSON.stringify(res));
  ctx.stationDesk.undock();
  step(0.2);
  assert.equal(ctx.flags.docked, false, 'the ace approach is flown in space');
  const rec = bank().find((r) => r && r.role === 'ace' && r.name === aceJob.target
    && r.state !== 'dead' && r.state !== 'captured' && r.state !== 'derelict');
  assert.ok(rec, 'the Named Gun record resolves');
  const live = spawnShip(rec, [160, 0, 0]);
  assert.ok(live, 'the Named Gun instantiated');
  live.ai.lastAttacker = 'player';
  live.state.cargo = [{ commodity: 'restrictedComponents', units: 2 }];
  const fearSaved = ctx.world.fear;
  ctx.world.fear = 20; // fixture: the fear the real respect verb needs
  const peek = openSurrenderCard(live, ACE_INTENTS);
  ctx.world.fear = fearSaved;
  assert.equal(peek.open, true, 'the ace surrender card admitted');
  assert.equal(peek.kind, 'surrender', 'the ace card is the surrender family');
  assert.ok(peek.terms.line.includes(ACE_NOTE),
    'the ace card carries the exact Named Gun note: ' + JSON.stringify(peek.terms.line));
  const obs = window.rimward.observe();
  assert.ok(obs.hail.terms.line.includes(ACE_NOTE), 'observe() reads the ace note');
  assert.equal(labelOf(peek, 'keepFiring'), 'Keep firing — a kill pays the bounty');
  assert.equal(labelOf(peek, 'respect'), 'Mutual respect — stand down (bounty stays open)');
  assert.equal(labelOf(peek, 'demandRansom').endsWith('(bounty stays open)'), true,
    'the ace ransom label states the claim stays open');
  assert.equal(labelOf(peek, 'keepFiring').includes('kill pays the bounty'), true);
  assert.equal(ctx.hailApi.resolve('keepFiring'), '', 'keep firing closes the card');
  live.state.surrendered = true; // fixture: the break the guns would land
  lockNear(live);
  const incsBefore = ctx.world.incidents.length;
  pressHail();
  step(2 / 60);
  const newIncs = ctx.world.incidents.slice(incsBefore);
  assert.ok(!newIncs.some((i) => i && i.kind === 'surrendered'
    && i.name === rec.name && i.outcome === 'captured'),
    'a Named Gun hail press is not taken as a capture');
  assert.equal(aceJob.state, 'accepted', 'the ace bounty stays accepted');
  assert.equal(rec.state, 'enroute', 'the Named Gun record is not captured');
  const credits = ctx.world.credits;
  step(35); // the delivery tick
  assert.equal(aceJob.state, 'accepted', 'no payout for a Named Gun surrender');
  assert.equal(ctx.world.credits, credits, 'the ace bounty credits did not move');
});

// ---------------------------------------------------------------------------
// E. The rendered Jobs board states both claim truths.
// ---------------------------------------------------------------------------
check('E1 the rendered ace card names the kill-only exception; the pirate card keeps kill or capture', () => {
  dock('freehold');
  openBoard();
  const aceRec = bank().find((r) => r && r.role === 'ace' && r.name === aceJob.target
    && r.state !== 'dead' && r.state !== 'captured' && r.state !== 'derelict');
  assert.ok(aceRec, 'the Named Gun record resolves for the board copy');
  const homeId = aceRec.system ?? 'freehold';
  const homeName = ctx.systems[homeId]?.name ?? 'Freehold Drift';
  const aceExpected = aceJob.target + ' flies an ace frame and bleeds the lanes of ' + homeName
    + ' dry. The Compact pays on confirmation of the kill — a Named Gun'
    + "'s surrender is never taken as a capture, so only a kill closes this claim.";
  assert.equal(aceJob.detail, aceExpected, 'the persisted ace card detail matches the copy contract');
  const aceCard = cardFor('Bounty: ' + aceJob.target);
  assert.ok(aceCard, 'the rendered ace card is drawn');
  assert.equal(aceCard.detail, aceExpected, 'the rendered ace card matches the exact copy');
  assert.equal(aceCard.detail.includes('kill or capture'), false, 'the ace card no longer promises a capture');
  assert.ok(aceCard.detail.includes('only a kill closes this claim'), 'the ace card states the kill-only claim');
  const pirateRow = pirateBounties().find((j) => j.state === 'offered' && j.system === 'freehold');
  assert.ok(pirateRow, 'a fresh pirate bounty posting exists');
  assert.ok(pirateRow.detail.includes('kill or capture'), 'the persisted pirate card still says kill or capture');
  const pirateCard = cardFor('Bounty: ' + pirateRow.target);
  assert.ok(pirateCard, 'the rendered pirate bounty card is drawn');
  assert.ok(pirateCard.detail.includes('kill or capture'),
    'the ordinary pirate bounty card still says kill or capture: ' + JSON.stringify(pirateCard.detail));
  assert.equal(pirateCard.detail.includes('Named Gun'), false, 'the pirate card carries no ace exception');
});

// ---------------------------------------------------------------------------
// F. Honesty/scope: a non-bounty surrender card is untouched, and nothing new
//    persists.
// ---------------------------------------------------------------------------
check('F1 a non-bounty surrender card has no note and unchanged labels', () => {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  step(0.2);
  assert.equal(ctx.flags.docked, false, 'the non-bounty approach is flown in space');
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === 'Sable Ilex'
    && r.state !== 'dead' && r.state !== 'captured');
  assert.ok(rec, 'the non-bounty pirate record resolves');
  assert.equal(pirateBounties().some((j) => j.target === rec.name), false,
    'the hull is not bound to any pirate bounty row');
  const live = spawnShip(rec, [200, 0, -30]);
  assert.ok(live, 'the non-bounty hull instantiated');
  live.ai.lastAttacker = 'player';
  live.state.cargo = [{ commodity: 'provisions', units: 2 }];
  const peek = openSurrenderCard(live, PIRATE_INTENTS);
  assert.equal(peek.open, true, 'the non-bounty surrender card admitted');
  assert.equal(peek.kind, 'surrender', 'it is still the surrender family');
  assert.equal(peek.terms.line, QUOTED_LINE, 'no note is appended to the reported terms');
  assert.equal(peek.terms.line.includes(PIRATE_NOTE), false);
  assert.equal(peek.terms.line.includes(ACE_NOTE), false);
  const amounts = peek.terms.amounts || {};
  assert.equal(labelOf(peek, 'demandCargo'), 'Demand cargo');
  assert.equal(labelOf(peek, 'demandRansom'), 'Demand ransom — ' + amounts.ransom + ' UU');
  assert.equal(labelOf(peek, 'acceptTribute'), 'Accept tribute — ' + amounts.tribute + ' UU');
  assert.equal(labelOf(peek, 'letGo'), 'Let them go');
  assert.equal(labelOf(peek, 'keepFiring'), 'Keep firing');
  assert.equal(nodes().some((n) => n.textContent === PIRATE_NOTE || n.textContent === ACE_NOTE), false,
    'no bounty note element is rendered on the non-bounty card');
});

check('F2 jobs/records stay JSON-plain and the card-only fields never persist', () => {
  const jobsCopy = JSON.parse(JSON.stringify(ctx.world.jobs));
  assert.ok(Array.isArray(jobsCopy), 'jobs snapshot JSON-safe');
  for (const j of ctx.world.jobs) {
    assert.equal(Object.hasOwn(j, 'bountyLane'), false, 'no bountyLane on a job');
    assert.equal(Object.hasOwn(j, 'bountyNote'), false, 'no bountyNote on a job');
  }
  const banks = ctx.world.recordBanks ?? {};
  for (const id of Object.keys(banks)) {
    const b = banks[id];
    if (!Array.isArray(b)) continue;
    const copy = JSON.parse(JSON.stringify(b));
    assert.ok(Array.isArray(copy), id + ' record bank JSON-safe');
    for (const r of b) {
      assert.equal(Object.hasOwn(r, 'bountyLane'), false, 'no bountyLane on a record');
      assert.equal(Object.hasOwn(r, 'bountyNote'), false, 'no bountyNote on a record');
    }
  }
  const incCopy = JSON.parse(JSON.stringify(ctx.world.incidents));
  assert.ok(Array.isArray(incCopy), 'incidents snapshot JSON-safe');
  // No new observe()/API keys: the card snapshot and the agent hail block keep
  // their published shape.
  const peek = ctx.hailApi.peek();
  assert.deepEqual(Object.keys(peek).sort(),
    ['conversationId', 'intents', 'kind', 'open', 'speaker', 'terms'].sort(),
    'peek publishes no new keys');
  assert.deepEqual(Object.keys(peek.terms).sort(), ['amounts', 'line', 'options'].sort(),
    'peek terms publishes no new keys');
  const obs = window.rimward.observe();
  assert.deepEqual(Object.keys(obs.hail).sort(),
    ['conversationId', 'intents', 'kind', 'open', 'speaker', 'terms'].sort(),
    'observe().hail publishes no new keys');
  assert.deepEqual(Object.keys(obs.hail.terms).sort(), ['amounts', 'line', 'options'].sort(),
    'observe().hail terms publishes no new keys');
  assert.equal(Object.hasOwn(obs.hail, 'bountyLane'), false);
  assert.equal(Object.hasOwn(obs.hail, 'bountyNote'), false);
});

console.log('issue-314 bounty surrender copy: ' + checks + ' checks passed');
