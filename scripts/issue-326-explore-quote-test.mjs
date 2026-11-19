/**
 * Issue #326 — an explore posting's API reward must be the live origin quote
 * the Jobs card prints, and an accepted contract must report its stamped
 * payQuoted. The playtest saw jobs.offers[].reward = 300 while the card said
 * 420/483 and the contract paid that amount.
 *
 * This test drives the real station system and the real Jobs board: the offer
 * row, the card reward line and the accepted agreement all read one desk
 * source (peekJobReward). Fixtures are disclosed world writes only: credits,
 * one mystery.visited entry for the witness the flight would produce, and the
 * epic stage that models the live epic multiplier. The offer/pay decisions,
 * the tick withdrawal, the board copy and the API blocks are the running
 * game's own.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-326-explore-quote-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems, makeTick } from './lib/boot-harness.mjs';
import { SYSTEMS, FACTION_SERVICES } from '../src/game/state.js';
import { AUTHORED_SYSTEMS } from '../src/game/authored-systems.js';
import { epicEffects } from '../src/game/epics.js';
import { snapshot } from '../src/game/save.js';

const consoleErrors = [];
const origConsoleError = console.error;
console.error = (...args) => { consoleErrors.push(args.map(String).join(' ')); origConsoleError(...args); };

seedBootRandom();
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];

const dt = 1 / 60;
let frame = 0;
let updateErrors = 0;
const tick = makeTick(ctx, systems, {
  get frame() { return frame; },
  set frame(v) { frame = v; },
}, dt, (e, frameNo, label) => {
  updateErrors++;
  console.log(`UPDATE ERR frame ${frameNo} (${label}): ${e.message}`);
});

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };
const nodes = () => [...dom.walkDom(document.body)];
const observe = () => window.rimward.observe();
const act = (name, args = {}) => window.rimward.act({ v: 2, name, args });
const openBoard = () => ctx.stationDesk.selectService('jobs');
const exploreLive = (sys) => ctx.world.jobs.filter((j) => j && j.kind === 'explore'
  && j.originSystem === sys && (j.state === 'offered' || j.state === 'accepted'));
const apiOffers = () => observe().jobs.offers.filter((j) => j.kind === 'explore');
const apiActive = () => observe().jobs.active.filter((j) => j.kind === 'explore');

// Independent restatement of station.js jobPayFor (the acceptance spec):
// origin base x epic jobPayMult x faction service jobPayMult. Authored systems
// (Freehold) hold no FACTION_SERVICES application.
function expectedOriginPay(ctx, sysId, base) {
  const faction = ctx.systems?.[sysId]?.faction;
  const fx = epicEffects(ctx, faction);
  const mult = Number.isFinite(fx?.jobPayMult) ? fx.jobPayMult : 1;
  const svcRaw = AUTHORED_SYSTEMS[sysId] ? 1 : (FACTION_SERVICES[faction]?.jobPayMult ?? 1);
  const svcMult = Number.isFinite(svcRaw) ? svcRaw : 1;
  const n = Math.round(base * mult * svcMult);
  return Number.isFinite(n) ? n : 0;
}

function cardReward(job) {
  const card = nodes().find((n) => n.className === 'job-card'
    && [...dom.walkDom(n)].some((c) => c.className === 'job-title'
      && String(c.textContent).includes(job.title)));
  assert.ok(card, 'a rendered card names ' + job.title);
  const line = [...dom.walkDom(card)].find((n) => n.className === 'job-reward');
  assert.ok(line, 'the card carries a job-reward line');
  const text = String(line.textContent);
  const m = text.match(/pays (\d+) UU/);
  assert.ok(m, 'the reward line prints a UU quote: ' + text);
  return { text, pay: Number(m[1]) };
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

// Fresh boot: title -> new -> first origin (Freehold Greenhand).
for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;
ctx.world.mystery ??= { found: [], visited: [], charted: [] };
if (!Array.isArray(ctx.world.mystery.visited)) ctx.world.mystery.visited = [];

// A. Docked Freehold offer: API reward, card line and origin quote agree at
// the pre-epic 420; the persisted raw reward stays 300.
check('docked Freehold offer: API reward === card line === origin jobPayFor(420)', () => {
  dock('freehold');
  openBoard();
  tick(40, 'fresh board');
  const live = exploreLive('freehold');
  assert.equal(live.length, 1, JSON.stringify(live.map((j) => j.id)));
  const job = live[0];
  assert.equal(job.state, 'offered');
  assert.equal(job.slot, 0);
  assert.equal(job.reward, 300, 'raw persisted reward stays RECOVERY_REWARD');
  const quote = expectedOriginPay(ctx, 'freehold', 420);
  assert.equal(quote, 420, 'the baseline origin quote is 420');
  const offer = apiOffers()[0];
  assert.ok(offer, 'the API offers block lists the card');
  assert.equal(offer.id, job.id);
  assert.equal(offer.reward, quote);
  const card = cardReward(job);
  assert.equal(card.pay, quote);
  assert.equal(ctx.stationDesk.peekJobReward(job), quote);
  assert.ok(!JSON.stringify(offer).includes('fh_shepherd'), 'the offer row hides the landmark id');
  assert.equal(snapshot(ctx).world.jobs.find((j) => j.id === job.id).reward, 300,
    'the save-shaped row still carries the raw 300');
});

// B. Live quote, not frozen: the epic stage moves both the card and the API
// offer to 483 without re-accepting or changing the persisted raw reward.
check('epic stage 2 moves the offered card and API quote to the live 483', () => {
  ctx.world.epics.freehold = 2;
  const quote = expectedOriginPay(ctx, 'freehold', 420);
  assert.equal(quote, 483, 'Freehold epic stage 2 quotes 483');
  openBoard(); // deliberate board visit re-renders the live quote
  const job = exploreLive('freehold')[0];
  assert.equal(job.reward, 300);
  const offer = apiOffers()[0];
  assert.equal(offer.reward, quote);
  const card = cardReward(job);
  assert.equal(card.pay, quote);
  assert.equal(ctx.stationDesk.peekJobReward(job), quote);
});

// C. Restore-shaped JSON must still yield the quote (no object-identity cache
// carries it).
check('restore-shaped JSON offered row still yields the live quote', () => {
  ctx.world.jobs = JSON.parse(JSON.stringify(ctx.world.jobs));
  const job = exploreLive('freehold')[0];
  assert.equal(job.reward, 300);
  openBoard();
  const quote = expectedOriginPay(ctx, 'freehold', 420);
  assert.equal(apiOffers()[0].reward, quote);
  assert.equal(cardReward(job).pay, quote);
});

// D. Acceptance stamps the displayed quote as payQuoted; the success notice is
// the desk's own line.
check('accept stamps the displayed 483 quote as payQuoted', () => {
  const job = exploreLive('freehold')[0];
  const receipt = act('acceptJob', { id: job.id });
  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  assert.equal(receipt.notice, `Accepted: ${job.title}`);
  assert.equal(job.state, 'accepted');
  assert.equal(job.payQuoted, 483);
  assert.equal(job.reward, 300, 'accepting never rewrites the raw reward');
  const saved = snapshot(ctx).world.jobs.find((j) => j.id === job.id);
  assert.equal(saved.reward, 300);
  assert.equal(saved.payQuoted, 483);
  assert.equal(snapshot(ctx).v, 1, 'the save envelope stays v1');
  assert.equal(observe().v, 2, 'the agent API version stays 2');
});

// E. Active row parity: reward === payQuoted === accepted card line, and the
// agreement does not move when the live quote would.
check('active row reward === payQuoted === card line, stable across drift', () => {
  openBoard();
  const job = exploreLive('freehold').find((j) => j.state === 'accepted');
  const active = apiActive().find((j) => j.id === job.id);
  assert.ok(active);
  assert.equal(active.reward, 483);
  assert.equal(active.payQuoted, 483);
  assert.equal(cardReward(job).pay, 483);
  // Drift the live quote inputs: epic recorded stage falls and prices move.
  ctx.world.epics.freehold = 0;
  ctx.world.prices.provisions += 137;
  openBoard();
  const drifted = apiActive().find((j) => j.id === job.id);
  assert.equal(drifted.reward, 483);
  assert.equal(drifted.payQuoted, 483);
  assert.equal(cardReward(job).pay, 483);
  assert.equal(job.payQuoted, 483);
});

// F. Restore-shaped accepted row still reports the stamped agreement.
check('restore-shaped JSON accepted row still yields payQuoted', () => {
  ctx.world.jobs = JSON.parse(JSON.stringify(ctx.world.jobs));
  const job = ctx.world.jobs.find((j) => j.kind === 'explore' && j.state === 'accepted');
  openBoard();
  const active = apiActive().find((j) => j.id === job.id);
  assert.equal(active.reward, 483);
  assert.equal(active.payQuoted, 483);
  assert.equal(cardReward(job).pay, 483);
});

// G. Filing pays the stamped agreement exactly once, then retires the
// witnessed slot without a second payout.
check('filing pays payQuoted exactly once', () => {
  const job = ctx.world.jobs.find((j) => j.kind === 'explore' && j.state === 'accepted');
  const quote = job.payQuoted;
  assert.equal(quote, 483);
  ctx.world.mystery.visited.push('fh_shepherd'); // fixture: the flight that witnesses the site
  const credits = ctx.world.credits;
  // The delivery tick runs every 0.5 s of sim time; collect the frame events.
  const events = [];
  for (let i = 0; i < 40; i++) {
    tick(1, 'file survey');
    events.push(...ctx.lastEvents);
    if (events.some((e) => e.type === 'jobState' && e.id === job.id)) break;
  }
  // jobState rows land in the Agent API session ring (agent.events), not the
  // world event bus; read the public observation block the agent sees.
  const ring = observe().events;
  const delivered = ring.find((e) => e.type === 'jobState' && e.id === job.id
    && e.outcome === 'delivered');
  assert.ok(delivered, JSON.stringify(ring));
  assert.equal(delivered.pay, quote);
  assert.equal(ctx.world.credits, credits + quote, 'the one earned payment');
  assert.ok(!ctx.world.jobs.some((j) => j.id === job.id), 'the filed contract is spliced');
  const afterPay = ctx.world.credits;
  tick(120, 'no repeat pay');
  assert.equal(ctx.world.credits, afterPay, 'later ticks pay nothing');
  assert.equal(exploreLive('freehold').length, 0, 'the witnessed slot is retired');
  assert.equal(apiOffers().length, 0, 'the API offers block agrees');
});

assert.equal(updateErrors, 0, 'no system update errors');
assert.equal(consoleErrors.length, 0, 'no console errors: ' + consoleErrors.join(' | '));
console.log(`ISSUE #326 PASS (${checks} checks)`);
