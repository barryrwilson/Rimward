/**
 * Issue #375 — hazard-aware recovery pay. A flat 300 UU recovery payout left a
 * measured starter-gear pirate ambush at 143 UU of repairs (48% of one payout),
 * so recovery pay now scales with the ORIGIN system's pirate stock
 * (SYSTEMS[id].cast.pirates) via RECOVERY_HAZARD_TIERS in state.js.
 *
 * This test drives the real station system and the real Jobs board, following
 * the issue-#326 explore-quote pattern: the offered card line, the desk API
 * quote (peekJobReward), the accept-stamped payQuoted and the settlement credit
 * all read ONE derivation, the persisted reward stays RECOVERY_REWARD = 300,
 * and a restore-shaped accepted row WITHOUT payQuoted still settles via the
 * old derived fallback.
 *
 * Fixtures are disclosed world writes only: ctx.world.aftermath wreck entries,
 * ctx.world.epics reset, job.collected set true to model the scoop the flight
 * would produce, and credits. The offer/pay decisions, the board copy and the
 * settlement are the running game's own.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-375-recovery-hazard-pay-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems, makeTick } from './lib/boot-harness.mjs';
import { SYSTEMS, FACTION_SERVICES, RECOVERY_HAZARD_TIERS } from '../src/game/state.js';
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
  console.log('UPDATE ERR frame ' + frameNo + ' (' + label + '): ' + e.message);
});

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };
const nodes = () => [...dom.walkDom(document.body)];

// Independent restatement of station.js recoveryPayBase x jobPayFor (the
// acceptance spec): RECOVERY_REWARD x hazard tier x epic jobPayMult x faction
// service jobPayMult (authored systems hold no FACTION_SERVICES application).
function hazardMult(sysId) {
  const pirates = SYSTEMS[sysId]?.cast?.pirates ?? 0;
  const tier = RECOVERY_HAZARD_TIERS.find((t) => pirates >= t.minPirates);
  return tier?.mult ?? 1;
}
function recoveryBase(sysId) {
  return Math.round(300 * hazardMult(sysId));
}
function expectedOriginPay(ctx2, sysId, base) {
  const faction = ctx2.systems?.[sysId]?.faction;
  const fx = epicEffects(ctx2, faction);
  const mult = Number.isFinite(fx?.jobPayMult) ? fx.jobPayMult : 1;
  const svcRaw = AUTHORED_SYSTEMS[sysId] ? 1 : (FACTION_SERVICES[faction]?.jobPayMult ?? 1);
  const svcMult = Number.isFinite(svcRaw) ? svcRaw : 1;
  const n = Math.round(base * mult * svcMult);
  return Number.isFinite(n) ? n : 0;
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
  station.update(dt); ctx.lastEvents = ctx.events; ctx.events = [];
  station.update(dt); ctx.lastEvents = ctx.events; ctx.events = [];
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, 'docked at ' + id);
}

function step(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += dt; ctx.elapsed += dt;
    station.update(dt);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}

// Fixture: exactly one wreck in the current system with the board re-read, the
// same entry shape world.js stageAftermath writes. Recovery cards share one
// title, so every other aftermath wreck and recovery row (including done ones)
// is pruned first or the shared-title card lookup would match a stale card.
function wreck(sysId, id) {
  ctx.world.aftermath = ctx.world.aftermath.filter((a) => a.id !== id)
    .filter((a) => a.system !== sysId);
  ctx.world.jobs = ctx.world.jobs.filter((j) => j.kind !== 'recovery' || j.wreckId === id);
  ctx.world.aftermath.push({
    id, kind: 'wreck', system: sysId,
    createdAt: ctx.world.time, expiresAt: ctx.world.time + 600,
    position: { x: 700, y: 200, z: 0 },
  });
  ctx.stationDesk.selectService('jobs');
  return ctx.world.jobs.find((j) => j.kind === 'recovery' && j.wreckId === id);
}

function cardPay(job) {
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

// Fresh boot: title -> new -> first origin (Freehold Greenhand).
for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 20000;
ctx.world.epics = {}; // fixture: no epic multiplier, so the math reads plainly

// A. Freehold (cast.pirates 4 -> tier 1.25): quote = 375 x faction mult (1).
check('freehold cast 4 quotes 375: card === peekJobReward === payQuoted === settlement', () => {
  dock('freehold');
  ctx.stationDesk.selectService('jobs');
  tick(5, 'freehold board');
  assert.equal(hazardMult('freehold'), 1.25, 'freehold cast 4 lands in the 1.25 tier');
  assert.equal(recoveryBase('freehold'), 375, 'RECOVERY_REWARD 300 x 1.25 = 375');
  const job = wreck('freehold', 'aft-375-fh');
  assert.ok(job, 'the freehold wreck posts a recovery card');
  assert.equal(job.state, 'offered');
  assert.equal(job.reward, 300, 'raw persisted reward stays RECOVERY_REWARD');
  assert.equal(job.payQuoted, undefined, 'an offered row carries no stamped quote');
  const quote = expectedOriginPay(ctx, 'freehold', recoveryBase('freehold'));
  assert.equal(quote, 375, 'freehold has no jobPayMult, so the quote is exactly 375');
  const card = cardPay(job);
  assert.equal(card.pay, quote, 'the offered card line matches the derived quote');
  assert.equal(ctx.stationDesk.peekJobReward(job), quote, 'peekJobReward matches the card');
  const receipt = ctx.stationDesk.acceptJob(job.id);
  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  assert.equal(job.state, 'accepted');
  assert.equal(job.payQuoted, quote, 'accept stamps the displayed quote');
  assert.equal(job.reward, 300, 'accepting never rewrites the raw reward');
  const saved = snapshot(ctx).world.jobs.find((j) => j.id === job.id);
  assert.equal(saved.reward, 300, 'the save-shaped row still carries the raw 300');
  assert.equal(saved.payQuoted, quote, 'the stamped agreement persists');
  // Settlement: model the scoop the flight would produce, then dock at origin.
  job.collected = true;
  dock('freehold');
  const credits = ctx.world.credits;
  step(90);
  assert.equal(ctx.world.credits, credits + quote, 'settlement credits exactly the stamped quote');
  assert.equal(job.state, 'done', 'the paid contract is closed, not re-payable');
  assert.ok(ctx.world.jobs.filter((j) => j.id === job.id).every((j) => j.state === 'done'), 'every handle of the paid id reads done');
  const afterPay = ctx.world.credits;
  dock('freehold');
  step(90);
  assert.equal(ctx.world.credits, afterPay, 'a later dock at origin pays nothing again');
});

// B. Hazard ladder: redmarch (cast 7 -> 1.5) quotes above veil (cast 0 -> 1.0).
// These are the authored endpoints of the pirate-stock range (AUTHORED_SYSTEMS
// casts: redmarch 7, freehold 4, veridian/hollowreach 3, hush 2, verge 1, veil 0).
check('redmarch cast 7 quotes above veil cast 0', () => {
  assert.equal(hazardMult('redmarch'), 1.5, 'redmarch cast 7 lands in the 1.5 tier');
  assert.equal(hazardMult('veil'), 1.0, 'veil cast 0 lands in the 1.0 tier');
  dock('redmarch');
  ctx.stationDesk.selectService('jobs');
  tick(5, 'redmarch board');
  const emberJob = wreck('redmarch', 'aft-375-redmarch');
  assert.ok(emberJob, 'the redmarch wreck posts a recovery card');
  const emberQuote = expectedOriginPay(ctx, 'redmarch', recoveryBase('redmarch'));
  assert.equal(emberQuote, 450, 'redmarch quotes 300 x 1.5 = 450');
  assert.equal(cardPay(emberJob).pay, emberQuote, 'the redmarch card prints the hazard quote');
  assert.equal(ctx.stationDesk.peekJobReward(emberJob), emberQuote);
  dock('veil');
  ctx.stationDesk.selectService('jobs');
  tick(5, 'veil board');
  const asmJob = wreck('veil', 'aft-375-veil');
  assert.ok(asmJob, 'the veil wreck posts a recovery card');
  const asmQuote = expectedOriginPay(ctx, 'veil', recoveryBase('veil'));
  assert.equal(asmQuote, 300, 'veil quotes the flat 300');
  assert.equal(cardPay(asmJob).pay, asmQuote, 'the veil card prints the flat quote');
  assert.ok(emberQuote > asmQuote, 'a high-pirate origin pays strictly more than a calm one');
});

// C. Restore-shaped accepted row WITHOUT payQuoted still settles via the old
// derived fallback (jobPay(ctx, job.reward) = 300 at a no-mult authored dock).
check('legacy accepted row without payQuoted settles at the old 300 fallback', () => {
  dock('freehold');
  ctx.stationDesk.selectService('jobs');
  tick(5, 'legacy board');
  const legacy = wreck('freehold', 'aft-375-legacy');
  assert.ok(legacy);
  const row = JSON.parse(JSON.stringify(legacy));
  row.state = 'accepted';
  row.collected = true;
  row.deadline = ctx.world.time + 300;
  delete row.payQuoted; // restore-shape: a pre-#375 agreement carries no stamp
  ctx.world.jobs = ctx.world.jobs.filter((j) => j.id !== row.id);
  ctx.world.jobs.push(row);
  ctx.stationDesk.selectService('jobs');
  tick(3, 'legacy card re-render'); // the jobs pane is already open; redraw it
  assert.equal(ctx.stationDesk.peekJobReward(row), 300, 'the fallback derives the old 300');
  assert.match(cardPay(row).text, /pays 300 UU/, 'the accepted card prints the fallback too');
  dock('freehold');
  const credits = ctx.world.credits;
  step(90);
  assert.equal(ctx.world.credits, credits + 300, 'the legacy row settles at the old value');
  assert.equal(row.state, 'done', 'the legacy contract is closed, not re-payable');
});

assert.equal(updateErrors, 0, 'no system update errors');
assert.equal(consoleErrors.length, 0, 'no console errors: ' + consoleErrors.join(' | '));
console.log('ISSUE #375 PASS (' + checks + ' checks)');