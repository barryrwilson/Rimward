/**
 * Issue #239 synthetic contract tests: the free contact flight-plan briefing
 * and the mounted-scanner dossier exposure rate.
 *
 * Every integration assertion runs the REAL evaluator at the real capped
 * frame step, and every station assertion runs the real booted desk through
 * its own player closures. Synthetic setups are labelled where they appear.
 * Natural browser flight remains a separate gate and is not claimed here.
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { COURIER_SHADOW as T } from '../src/game/state.js';
import {
  freshShadowState, stepShadow, isShadowJob, shadowDossierTerms,
  deepSuspicionGainFor, deepSuspicionRateLine, deepSuspicionCaveat, deepSuspicionExplanation,
} from '../src/game/courier-shadow.js';
import { snapshot, restore } from '../src/game/save.js';
import { addFavor, contactsForSystem } from '../src/game/contacts.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
let checks = 0;
const pass = (s) => { checks++; console.log('PASS ' + s); };
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ---------------------------------------------------------------------------
// 1. Frozen tuning and the strict pure gain helper
// ---------------------------------------------------------------------------

assert.equal(T.version, 2, 'tuning-only change must not bump the persisted version');
assert.equal(T.deepSuspicionGain, 4, 'the stock compatibility rate is retained');
assert.deepEqual([...T.deepSuspicionByScanner], [4, 3.5, 3]);
assert.equal(Object.isFrozen(T.deepSuspicionByScanner), true);
assert.equal(T.deepSuspicionByScanner[0], T.deepSuspicionGain, 'tier 0 IS the stock rate');
// Nothing else about the contract moved.
assert.equal(T.deepSeconds, 30);
assert.equal(T.requiredSeconds, 30);
assert.equal(T.minRange, 150);
assert.equal(T.maxRange, 400);
assert.equal(T.suspicionGain, 10);
assert.equal(T.suspicionDecay, 5);
assert.equal(T.warnAt, 40);
assert.equal(T.graceSeconds, 8);
assert.equal(T.frameSeconds, 0.1);

assert.equal(deepSuspicionGainFor(0), 4);
assert.equal(deepSuspicionGainFor(1), 3.5);
assert.equal(deepSuspicionGainFor(2), 3);
// Strict: only an in-range integer earns a tuned rate. Everything else, and
// anything a corrupt save or an unknown future tier could produce, is stock.
for (const bad of [undefined, null, -1, -0.5, 3, 99, 1.5, 2.000001, '1', '2', true, false,
  NaN, Infinity, -Infinity, {}, [], [2], () => 2, 1n === 1n ? Symbol.iterator : 0]) {
  assert.equal(deepSuspicionGainFor(bad), T.deepSuspicionGain, `invalid tier ${String(bad)} reads as stock`);
}
pass('frozen 4/3.5/3 tuning, retained stock default and a strictly integer-tier gain helper');

// The rate line names the real numbers for every tier, and the honest limit
// sentence is DERIVED — only a tier that cannot reach the cap in one whole
// attempt earns it, and it never promises completion.
for (const tier of [0, 1, 2]) {
  const line = deepSuspicionRateLine(tier);
  assert.ok(line.includes(`${T.minRange}–${T.maxRange} units`));
  assert.ok(line.includes(`${deepSuspicionGainFor(tier)}/s of courier attention`));
  assert.ok(line.includes(`inside ${T.minRange} units still draws ${T.suspicionGain}/s`),
    'every tier still states the unchanged close rate');
  assert.equal(line.includes(`instead of the stock ${T.deepSuspicionGain}/s`), tier !== 0);
  assert.equal(deepSuspicionExplanation(tier),
    deepSuspicionCaveat(tier) ? `${line} ${deepSuspicionCaveat(tier)}` : line);
}
assert.equal(deepSuspicionCaveat(0), '');
assert.equal(deepSuspicionCaveat(1), '', 'Mk I cannot finish clean, so it claims no clean-run limit');
assert.ok(deepSuspicionCaveat(2).includes('carried suspicion or any crowding can still force a cooling break'));
assert.equal(deepSuspicionCaveat(2).includes('will finish') || deepSuspicionCaveat(2).includes('guarantee'), false,
  'no unconditional completion promise');
assert.equal(deepSuspicionGainFor(1) * T.deepSeconds >= T.suspicionMax, true, 'Mk I arithmetic still exposes');
assert.equal(deepSuspicionGainFor(2) * T.deepSeconds < T.suspicionMax, true, 'only Mk II earns the caveat');
pass('shared copy derives every rate and its honest limit from the frozen tuning');

// ---------------------------------------------------------------------------
// 2. Real frame integration at the real capped step
// ---------------------------------------------------------------------------

// Synthetic frame input: a valid, certified, selected, unoccluded contact held
// at a constant range. Only scannerTier and distance vary between cases.
const input = (over = {}) => ({
  accepted: true, acquired: true, playerAlive: true, sameSystem: true, courierAlive: true,
  courierPresent: true, certified: true, inCorridor: true, selected: true, sightClear: true,
  distance: 250, warningPresented: true, courierName: 'Test courier', employerStation: 'Home',
  payQuoted: 200, secondsLeft: 700, ...over,
});
const basic = () => ({ ...freshShadowState(300), courierCreated: true, observedSeconds: 30 });
const pursuing = () => { const s = basic(); s.deep.state = 'pursuing'; return s; };
/** Integrate `seconds` at the production frame cap and report the last frame. */
function run(s, seconds, over = {}) {
  let out = stepShadow(s, input(over), 0);
  for (let i = 0; i < Math.round(seconds / T.frameSeconds); i++) {
    out = stepShadow(s, input(over), T.frameSeconds);
    s = out.shadow;
  }
  return out;
}

// The headline comparison: the same scripted 20 seconds of valid pursuit.
for (const [tier, want] of [[0, 80], [1, 70], [2, 60]]) {
  const out = run(pursuing(), 20, { scannerTier: tier });
  assert.ok(near(out.shadow.suspicion, want), `tier ${tier} reaches ${want} suspicion, got ${out.shadow.suspicion}`);
  // Suspicion integrates on every frame; evidence loses exactly the one
  // warning-crossing frame, at every tier.
  assert.ok(near(out.shadow.deep.observedSeconds, 19.9),
    `tier ${tier} banks 19.9 evidence seconds, got ${out.shadow.deep.observedSeconds}`);
  assert.equal(out.shadow.warned, true, 'every tier is still warned inside 20 s');
  assert.equal(out.shadow.deep.state, 'pursuing', 'no tier exposes inside 20 s');
  assert.equal(out.suspicionGain, deepSuspicionGainFor(tier));
  assert.equal(out.deepSuspicionGain, deepSuspicionGainFor(tier));
  assert.equal(out.deepSuspicionNote, deepSuspicionExplanation(tier));
}
// Invalid tiers integrate exactly like stock over the same whole run.
const stock20 = run(pursuing(), 20, { scannerTier: 0 }).shadow;
for (const bad of [undefined, null, 3, 1.5, '2', NaN, -1]) {
  assert.deepEqual(run(pursuing(), 20, { scannerTier: bad }).shadow, stock20,
    `invalid tier ${String(bad)} integrates as stock`);
}
// Crowding is unchanged at every tier, and so is basic observation.
for (const tier of [0, 1, 2, undefined, 7]) {
  assert.ok(near(run(pursuing(), 1, { scannerTier: tier, distance: 100 }).shadow.suspicion, 10),
    'closer than 150 units still costs 10/s for every tier');
  const basicRun = run({ ...freshShadowState(300), courierCreated: true }, 20, { scannerTier: tier, acquired: false });
  assert.ok(near(basicRun.shadow.observedSeconds, 20), 'basic observation timing is identical at every tier');
  assert.equal(basicRun.shadow.suspicion, 0);
  assert.equal(basicRun.shadow.warned, false);
  assert.equal(basicRun.suspicionGain, T.suspicionGain, 'basic work never quotes the dossier rate');
  const basicClose = run({ ...freshShadowState(300), courierCreated: true }, 1,
    { scannerTier: tier, acquired: false, distance: 100 });
  assert.ok(near(basicClose.shadow.suspicion, 10), 'basic crowding is identical at every tier');
}
pass('20 s of pursuit gives 80/70/60 with 19.9 evidence everywhere; close and basic work are untouched');

// The decision the purchase actually changes: who can finish one clean run.
const finished = {};
for (const tier of [0, 1, 2]) {
  const out = run(pursuing(), 40, { scannerTier: tier });
  finished[tier] = out.shadow;
}
for (const tier of [0, 1]) {
  assert.equal(finished[tier].deep.state, 'closed', `tier ${tier} exposes before 30 evidence seconds`);
  assert.equal(finished[tier].deep.closedReason, 'exposed');
  assert.equal(finished[tier].observedSeconds, T.requiredSeconds, 'the banked basic report survives exposure');
}
assert.equal(finished[2].deep.state, 'ready', 'Mk II finishes a clean uninterrupted attempt');
assert.equal(finished[2].deep.observedSeconds, T.deepSeconds);
// Evidence needs 30 banked seconds and the crossing frame banks none, so the
// clean Mk II run costs 30.1 elapsed seconds and lands near 90.3 suspicion —
// a margin of roughly 9.7 points, which is why the copy refuses to promise it.
assert.ok(near(finished[2].suspicion, 90.3, 1e-9), `Mk II lands at 90.3, got ${finished[2].suspicion}`);
const margin = T.suspicionMax - finished[2].suspicion;
assert.ok(margin > 9.6 && margin < 9.8, `Mk II clean margin is about 9.7, got ${margin}`);
assert.ok(margin < T.suspicionGain, 'one second of crowding inside 150 units can consume the whole margin');
// So it does: a Mk II that already carries one second of crowding does not
// finish clean. The caveat is a real condition, not a disclaimer.
const crowded = pursuing();
crowded.suspicion = T.suspicionGain;
assert.equal(run(crowded, 40, { scannerTier: 2 }).shadow.deep.state, 'closed',
  'carried suspicion still exposes a Mk II; completion is never unconditional');
pass('stock/Mk I expose before completion; a clean Mk II finishes with only a ~9.7 point margin');

// The warning is presented at the crossing frame, later for a better eye, and
// nothing else integrates on that frame at any tier.
// Actual capped-step crossings, not the continuous-time estimate: floating
// point lands tier 0 one frame after the ideal 10.0 s.
for (const [tier, step] of [[0, 101], [1, 115], [2, 134]]) {
  let s = pursuing();
  let emitted = -1;
  for (let i = 1; i <= 200; i++) {
    const out = stepShadow(s, input({ scannerTier: tier }), T.frameSeconds);
    s = out.shadow;
    if (out.warnEmitted) { emitted = i; break; }
  }
  assert.equal(emitted, step, `tier ${tier} crosses the warning at frame ${step}`);
  assert.ok(near(s.deep.observedSeconds, (step - 1) * T.frameSeconds), 'the crossing frame banks no evidence');
  assert.equal(s.warningSeconds, 0, 'grace starts only after the warning is presented');
}
pass('the warning still crosses on its own frame, later for a better eye, and costs no evidence or grace');

// Swapping the mounted eye changes only the NEXT frame's rate. Start from a
// run that is already warned and already burning grace, so a reset would show.
let swap = run(pursuing(), 15, { scannerTier: 0 }).shadow;
const held = clone(swap);
assert.ok(near(held.suspicion, 60));
assert.equal(held.warned, true);
assert.ok(held.warningSeconds > 0 && held.deep.observedSeconds > 0);
const afterSwap = run(swap, 1, { scannerTier: 2 }).shadow;
assert.ok(near(afterSwap.suspicion, held.suspicion + 3), 'the new rate applies from the next frame');
assert.equal(afterSwap.warned, held.warned, 'a gear change never clears the latched warning');
assert.ok(near(afterSwap.deep.observedSeconds, held.deep.observedSeconds + 1), 'evidence is never reset');
assert.ok(near(afterSwap.warningSeconds, held.warningSeconds + 1), 'spent grace is never refunded');
// And back again, mid-run, with no reset in the other direction either.
const backAgain = run(afterSwap, 1, { scannerTier: 0 }).shadow;
assert.ok(near(backAgain.suspicion, afterSwap.suspicion + 4), 'removing the eye restores the stock rate at once');
assert.equal(backAgain.warned, true);
assert.ok(near(backAgain.deep.observedSeconds, afterSwap.deep.observedSeconds + 1));
// A zero-length read mutates nothing at any tier.
for (const tier of [0, 1, 2]) {
  const before = clone(swap);
  const out = stepShadow(swap, input({ scannerTier: tier }), 0);
  assert.deepEqual(out.shadow, before, 'a projection read integrates nothing');
  assert.deepEqual(swap, before, 'a projection read never mutates its argument');
  assert.equal(out.deepSuspicionGain, deepSuspicionGainFor(tier));
}
pass('mounted gear changes only the next frame rate; reads mutate no evidence, risk, warning or grace');

// The instruction and the agreement are built from the SAME input, so the
// Chart's exact-string removal still strips exactly one copy.
for (const tier of [0, 1, 2, undefined]) {
  const inp = input({ scannerTier: tier });
  const s = basic();
  const terms = shadowDossierTerms(s, inp);
  assert.ok(terms.includes(deepSuspicionExplanation(tier)), 'the agreement quotes the mounted eye it is charging');
  const instruction = stepShadow(s, inp, 0).instruction;
  assert.equal(instruction, `Basic report ready. ${terms}`);
  assert.equal(instruction.split(terms).length - 1, 1, 'the terms appear exactly once for chart stripping');
  assert.equal(instruction.replace(terms, '').trim(), 'Basic report ready.');
}
pass('one input builds both the instruction and the agreement; chart stripping still yields a single copy');

// ---------------------------------------------------------------------------
// 3. The real booted desk: pre-purchase copy, contact briefing, API parity
// ---------------------------------------------------------------------------

seedBootRandom();
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
for (const el of dom.walkDom(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.agent.optIn = true;
const api = window.rimward;
const desk = ctx.stationDesk;

function tick(n = 1, dt = 0.1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += dt; ctx.elapsed += dt; station.update(dt);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
function dock(id) {
  if (ctx.flags.docked) desk.undock();
  ctx.flags.docked = false; ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }]; world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.dockPressed = true; tick(2); ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true);
}
/** Every rendered note the docked player can actually read. */
const domNotes = () => [...dom.walkDom(document.body)]
  .filter((e) => e.className === 'screen-note' || e.className === 'people-note')
  .map((e) => e.textContent);
const viewNotes = () => desk.peekView().rows
  .filter((r) => r.cls === 'screen-note' || r.cls === 'people-note').map((r) => r.text);
const domButtons = () => [...dom.walkDom(document.body)].filter((e) => e.tag === 'button' || e.tagName === 'BUTTON');

dock('freehold');
assert.equal(ctx.world.scanner, 0, 'a starter pilot owns no eye');

// Both tiers must be explained BEFORE any purchase, including the Mk II
// prerequisite row a scanner-0 pilot sees instead of a button.
desk.selectService('outfitting'); tick(1);
// The new benefit is scoped to dossier exposure; it never denies the eye's
// own established resolve/contact/lock capabilities.
const SCOPED = 'This mission benefit is lower dossier exposure only; it grants no extra '
  + "detection entitlement beyond the eye's own established capabilities.";
const pitchMk1 = [`Wolfeye Mk I — 400 UU. ${deepSuspicionRateLine(1)}`, SCOPED];
const pitchMk2 = [`Wolfeye Mk II — 900 UU, and it needs the Mk I eye in the socket first. ${deepSuspicionRateLine(2)}`,
  deepSuspicionCaveat(2), SCOPED];
for (const line of [...pitchMk1, ...pitchMk2]) {
  assert.ok(domNotes().includes(line), `outfitting states before purchase: ${line}`);
  // Parity is exact, not approximate: the API publishes the same string the
  // docked panel rendered, inside the station view's own text cap.
  assert.ok(viewNotes().includes(line), `observe().station.view repeats: ${line}`);
  assert.ok(line.length <= 240, 'pre-purchase copy fits the station view text cap exactly');
}
// Panel-wide: nothing this pane renders is truncated on the way to the API.
for (const native of domNotes()) {
  assert.ok(viewNotes().includes(native),
    `observe() publishes the outfitting note verbatim, untruncated: ${native}`);
}
assert.ok(domNotes().includes('Wolfeye Mk II needs the Mk I eye in the socket first.'),
  'the established prerequisite row is preserved');
assert.ok(domButtons().some((b) => b.textContent === '2 — Wolfeye Mk I scanner (400 UU)'), 'actual Mk I price');
assert.equal(domButtons().some((b) => b.textContent.includes('Wolfeye Mk II scanner')), false,
  'the Mk II is not purchasable without its prerequisite');
pass('both scanner tiers explain the dossier benefit, cost and prerequisite before any purchase');

// Synthetic purse: buy the real SKUs at their real prices through the real
// player closures, and confirm the prices and capabilities are preserved.
ctx.world.credits = 2000;
const beforeMk1 = ctx.world.credits;
domButtons().find((b) => b.textContent === '2 — Wolfeye Mk I scanner (400 UU)').click();
assert.equal(ctx.world.scanner, 1);
assert.equal(beforeMk1 - ctx.world.credits, 400, 'the Mk I price is unchanged');
assert.ok(domNotes().some((n) => n.includes('Wolfeye Mk I installed — target resolve reads numerically')),
  'the established Mk I capability copy is preserved');
for (const line of pitchMk2) {
  assert.ok(domNotes().includes(line), 'the Mk II offer row still explains itself before purchase');
  assert.ok(viewNotes().includes(line));
}
const beforeMk2 = ctx.world.credits;
domButtons().find((b) => b.textContent === '4 — Wolfeye Mk II scanner (900 UU)').click();
assert.equal(ctx.world.scanner, 2);
assert.equal(beforeMk2 - ctx.world.credits, 900, 'the Mk II price is unchanged');
assert.ok(domNotes().some((n) => n.includes('Wolfeye Mk II installed — hidden gunports read on the bracket')),
  'the established Mk II capability copy is preserved');
assert.equal(domNotes().some((n) => n.includes('Wolfeye Mk I — 400 UU.')), false,
  'a pre-purchase pitch disappears once the eye is owned');
pass('real prices, prerequisite order and existing scanner capabilities survive the new copy');

// The offer quotes the mounted eye before acceptance, and it tracks the eye.
desk.selectService('jobs'); tick(2);
const offer = () => ctx.world.jobs.find((j) => isShadowJob(j) && j.originSystem === 'freehold');
let job = offer();
assert.ok(job, 'the employer posts a shadow assignment');
assert.equal(job.state, 'offered');
const offerRow = () => api.observe().jobs.offers.find((j) => j.id === job.id).shadow.deep;
assert.equal(offerRow().suspicionGain, 3);
assert.equal(offerRow().suspicionNote, deepSuspicionExplanation(2));
assert.ok(offerRow().terms.includes(deepSuspicionExplanation(2)), 'offer terms quote the mounted eye');
assert.deepEqual(
  { gain: offerRow().suspicionGain, note: offerRow().suspicionNote, terms: offerRow().terms },
  { gain: desk.peekShadow(job).deep.suspicionGain, note: desk.peekShadow(job).deep.suspicionNote,
    terms: desk.peekShadow(job).deep.terms },
  'the API row and the desk projection are the same object contents');
ctx.world.scanner = 0; // synthetic downgrade: the offer must follow the live mount
assert.equal(offerRow().suspicionGain, 4);
assert.ok(offerRow().terms.includes(deepSuspicionExplanation(0)));
ctx.world.scanner = 2;
assert.equal(offerRow().suspicionGain, 3);
pass('an offer quotes the currently mounted eye, and the desk and API publish identical terms');

assert.equal(desk.acceptJob(job.id).ok, true);
assert.equal(job.state, 'accepted');
const acceptedRow = () => api.observe().jobs.active.find((j) => j.id === job.id).shadow.deep;
assert.equal(acceptedRow().suspicionGain, 3);
assert.equal(acceptedRow().suspicionNote, deepSuspicionExplanation(2));
assert.equal(acceptedRow().terms, desk.peekShadow(job).deep.terms, 'accepted and desk terms are identical');

// ---- the free contact flight-plan briefing -------------------------------
desk.selectService('people'); tick(1);
const briefLabel = `Ask about ${job.target} (${job.id}) — free route briefing`;
const briefButtons = () => domButtons().filter((b) => b.textContent === briefLabel);
const disclosure = "Read this assignment's shuttle route and turnaround advice. 0 UU; no favor spent.";
const expectedBrief = `Flight-plan brief for ${job.target} (${job.id}) at `
  + `${ctx.systems[job.destSystem].station.name}: the courier shuttles out and back between the rendezvous `
  + `and a turnaround ${T.farRange} units from that dock along the same line. It stops to pivot at either `
  + 'end. Match its speed on the straight; ease off when it turns so you do not crowd it.';

assert.ok(briefButtons().length > 0, 'the employer dock offers the briefing before any pursuit');
assert.ok(domNotes().includes(disclosure), 'the zero cost is disclosed beside the button');
assert.ok(viewNotes().includes(disclosure), 'the API publishes the same disclosure');
assert.equal(domButtons().filter((b) => b.textContent === 'Ask around').length, briefButtons().length,
  'every face keeps its own untouched Ask around');

// Ask around is unchanged, and it is not the briefing.
domButtons().find((b) => b.textContent === 'Ask around').click();
assert.notEqual(desk.peekView().notice, expectedBrief.slice(0, 240), 'the generic rumor is not the flight plan');

// The briefing itself. The facts below are asserted against what production
// actually produced — the uncapped stationAction receipt — not against the
// literal this test wrote. The docked panel and the receipt are compared for
// equality in the parity group that follows.
const ledger0 = () => JSON.stringify({
  credits: ctx.world.credits, jobs: ctx.world.jobs, contacts: ctx.world.contacts, scanner: ctx.world.scanner,
});
const ledgerBefore = ledger0();
briefButtons()[0].click();
assert.equal(desk.peekView().notice, expectedBrief.slice(0, 240),
  'the docked panel shows the brief (the station view caps every notice at 240 chars)');
const actual = api.act({ v: 2, name: 'stationAction',
  args: { n: desk.peekView().actions.findIndex((a) => a.label === briefLabel) } }).notice;
assert.equal(actual, expectedBrief, 'the full production brief is the approved copy');
assert.ok(actual.includes(`turnaround ${T.farRange} units`), 'static far turnaround distance');
assert.ok(actual.includes('shuttles out and back'), 'out-and-back shuttle');
assert.ok(actual.includes('stops to pivot at either end'), 'endpoint pivot pause');
assert.ok(actual.includes('Match its speed on the straight'), 'the straight/turn tactic');
assert.ok(actual.includes(job.id) && actual.includes(job.target), 'the courier and job id identify the brief');
// No fabricated sighting and no hidden telemetry.
for (const leaked of [job.recordId, 'currently', 'right now', 'last seen', 'heading', 'position']) {
  assert.equal(actual.includes(leaked), false, `the brief never discloses ${leaked}`);
}
assert.equal(ledger0(), ledgerBefore, 'briefing mutates no economy, roster, progress or risk');
// Repeating it is free and still mints nothing.
for (let i = 0; i < 5; i++) briefButtons()[0].click();
assert.equal(ledger0(), ledgerBefore, 'repeated briefings cannot farm credits, favors, trust or progress');
pass('the employer dock briefs the exact route delta for free, repeatably, and mints nothing');

// UI and API run the SAME closure and produce the SAME copy.
const actionIndex = () => desk.peekView().actions.findIndex((a) => a.label === briefLabel);
assert.ok(actionIndex() >= 0, 'the briefing is an ordinary station action, with no new command');
const viaApi = api.act({ v: 2, name: 'stationAction', args: { n: actionIndex(), expect: briefLabel } });
assert.equal(viaApi.ok, true);
assert.equal(viaApi.notice, expectedBrief, 'the API receipt carries the identical brief');
assert.equal(desk.peekView().notice, expectedBrief.slice(0, 240), 'the view applies its established text cap');
// The established stale-label guard still fails closed on this row.
const stale = api.act({ v: 2, name: 'stationAction', args: { n: actionIndex(), expect: `${briefLabel} ` } });
assert.equal(stale.ok, false);
assert.equal(stale.token, 'stale');
assert.equal(api.observe().station.view.actions.some((a) => a.label === briefLabel), true,
  'observe() and peekView() publish the same action label');
pass('the UI button and stationAction share one closure, one label and one receipt');

// ---- stale, ended, expired, corrupt and foreign refusals -----------------
const refusal = 'Cannot read that flight plan now.';
// ONE retained native button, captured before any mutation. Every click below
// fires that original DOM closure — the node is detached by the re-render the
// previous click caused, so this is genuinely a stale card, not a fresh row.
const retained = briefButtons()[0];
const identity = { deadline: job.deadline, state: job.state, target: job.target,
  recordId: job.recordId, originSystem: job.originSystem, destSystem: job.destSystem,
  payQuoted: job.payQuoted, shadow: clone(job.shadow) };
// The WHOLE live ledger, including the job list itself, so a replaced row or a
// repaired roster is visible and not hidden behind a stale local reference.
const ledger = () => JSON.stringify({
  credits: ctx.world.credits, scanner: ctx.world.scanner,
  jobs: ctx.world.jobs, contacts: ctx.world.contacts,
});
const notice = () => (ctx.flags.docked ? desk.peekView().notice : null);
/**
 * The refusal's own footer node, read straight off the live panel. peekView()
 * and observe() run buildPanel, which normalizes the roster, so every
 * no-mutation assertion below is made BEFORE any of them is called.
 */
const panelNotice = () => {
  const panel = [...dom.walkDom(document.body)].filter((e) => e.className?.includes?.('station-panel')).pop();
  const note = [...dom.walkDom(panel)].filter((e) => e.className === 'station-notice').pop();
  return note ? note.textContent : null;
};
/**
 * Mutate the fixture FIRST, snapshot the live ledger AFTER that mutation, then
 * click and compare BEFORE restoring. Snapshotting before the mutation and
 * restoring before the comparison would mask any write the click itself made.
 */
const untouched = (label, mutate) => {
  mutate();
  const before = ledger();
  try {
    retained.click(); // the RETAINED native closure against mutated live state
    // No-mutation FIRST, then the surfaces — a capture read would itself
    // normalize the roster and mask the very write this is checking for.
    assert.equal(ledger(), before, `${label} mutates no economy, roster, job list, progress or risk`);
    assert.equal(panelNotice(), refusal, `${label} refuses on the live panel`);
    assert.equal(notice(), refusal, `${label} refuses in the station view`);
  } finally {
    Object.assign(job, { ...identity, shadow: clone(identity.shadow) });
  }
  checks++;
};
untouched('an expired contract', () => { job.deadline = ctx.world.time - 1; });
untouched('a non-finite deadline', () => { job.deadline = Infinity; });
untouched('an ended contract', () => { job.state = 'failed'; });
untouched('a settled contract', () => { job.state = 'done'; });
untouched('a re-identified courier', () => { job.target = 'Another name'; });
untouched('a swapped record identity', () => { job.recordId = 'courier-spy-elsewhere-1'; });
untouched('a relocated destination', () => { job.destSystem = 'freehold'; });
untouched('an unknown origin', () => { job.originSystem = 'nowhere-at-all'; });
// Corrupt contract state: the existing strict validator, not a second rule
// set, is what refuses here.
untouched('a corrupt dossier quote', () => { job.shadow.deep.payQuoted = job.payQuoted; });
untouched('a corrupt dossier phase', () => { job.shadow.deep.state = 'ready'; });
untouched('an injected shadow field', () => { job.shadow.deep.injected = true; });
// The pilot cannot read a sheet they are not alive or not docked to read.
const hull = ctx.player.hull;
untouched('a dead pilot', () => { ctx.player.hull = 0; });
ctx.player.hull = hull;
ctx.flags.docked = false;
const undockedBefore = ledger();
retained.click();
assert.equal(ledger(), undockedBefore, 'an undocked card mutates nothing');
ctx.flags.docked = true;
desk.selectService('people'); tick(1);
checks++;

// ---- same-id NEW OBJECT replacement --------------------------------------
// The hardest stale case: the live row is swapped for an equal-valued clone
// with the SAME id. Only object identity separates it from what the card
// captured, which is precisely what a card left over from an earlier paint is.
const jobsArray = ctx.world.jobs;
const jobClone = clone(job);
ctx.world.jobs = jobsArray.map((j) => (j === job ? jobClone : j));
const jobSwapBefore = ledger();
retained.click();
assert.equal(ledger(), jobSwapBefore, 'a same-id replacement job mutates nothing');
assert.equal(panelNotice(), refusal, 'a same-id replacement job refuses the retained card');
ctx.world.jobs = jobsArray;
checks++;

// Same for the face, and this is the sharp case. `contactsForSystem` repairs a
// replacement row's banked favors and runs on every People REBUILD, so a
// refusal that rebuilt the panel would write the economy. It must not: the
// stale card is inert except for its notice.
//
// Arm the bank for real first — an empty bank makes this vacuous — and keep a
// positive control proving the repair is live. Then assert no-mutation BEFORE
// touching peekView()/observe(), because those capture passes run buildPanel
// and would normalize the roster themselves.
const rosterArray = ctx.world.contacts;
const rosterBefore = JSON.stringify(rosterArray);
const captured = rosterArray.find((c) => c.system === 'freehold');
assert.ok(captured, 'the captured face is on the live roster');
const favorsHeld = captured.favors;
addFavor(ctx, captured, 2);
assert.equal(captured.favors, favorsHeld + 2, 'the face really holds a banked favor');
// Positive control: an unknown same-id clone IS repaired by the roster helper,
// so a 0 below is a real guarantee and not an empty bank.
const hazardClone = { ...clone(captured), favors: 0 };
ctx.world.contacts = rosterArray.map((c) => (c === captured ? hazardClone : c));
contactsForSystem(ctx, 'freehold');
assert.equal(hazardClone.favors, favorsHeld + 2,
  'positive control: the roster helper repairs a same-id replacement');
// The real case. Fixture first, ledger snapshot after the fixture, click, then
// assert — with no view read in between.
const contactClone = { ...clone(captured), favors: 0 };
ctx.world.contacts = rosterArray.map((c) => (c === captured ? contactClone : c));
const faceSwapBefore = ledger();
retained.click();
assert.equal(contactClone.favors, 0,
  'refusing never repairs or mints a banked favor onto the replacement');
assert.equal(ledger(), faceSwapBefore, 'a same-id replacement face mutates nothing');
// Only now read the surfaces. The in-place footer node is the native one.
assert.equal(panelNotice(), refusal, 'the refusal is shown on the panel already on screen');
assert.equal(notice(), refusal, 'and the same text reaches the station view');
ctx.world.contacts = rosterArray;
captured.favors = favorsHeld;
contactsForSystem(ctx, 'freehold'); // re-bank 0 so later paints restore nothing
assert.equal(JSON.stringify(ctx.world.contacts), rosterBefore, 'the roster is byte-identical after refusals');
checks++;

// A face who has left the roster entirely refuses, and the refusal must not
// write the roster back on its way to saying no.
const gone = rosterArray[0];
ctx.world.contacts = rosterArray.filter((c) => c !== gone);
const goneBefore = ledger();
retained.click();
assert.equal(ctx.world.contacts.some((c) => c === gone), false,
  'refusing never restores a roster row');
assert.equal(ledger(), goneBefore, 'a departed face mutates nothing');
assert.equal(panelNotice(), refusal, 'a departed face refuses');
ctx.world.contacts = rosterArray;
assert.equal(JSON.stringify(ctx.world.contacts), rosterBefore, 'the roster survives every refusal unchanged');
checks++;

// A card captured at this dock cannot speak from another panel.
desk.selectService('jobs'); tick(1);
const panelBefore = ledger();
retained.click();
assert.equal(ledger(), panelBefore, 'refusing from another service mutates nothing');
assert.equal(panelNotice(), refusal, 'a People card refuses from another service');
desk.selectService('people'); tick(1);
// The live row still works, so none of the above broke the real path.
briefButtons()[0].click();
assert.equal(notice(), expectedBrief.slice(0, 240), 'the live briefing still answers');
// A job belonging to neither this dock's employer nor its destination is never
// offered here at all. Synthetic foreign row.
const foreign = { ...clone(job), id: 'spy-ferrous-909', originSystem: 'ferrous', destSystem: 'veridian',
  recordId: 'courier-spy-ferrous-909', target: 'Foreign courier' };
ctx.world.jobs.push(foreign);
desk.selectService('people'); tick(1);
assert.equal(domButtons().some((b) => b.textContent.includes('Foreign courier')), false,
  'a foreign assignment is never briefable at this dock');
ctx.world.jobs = ctx.world.jobs.filter((j) => j !== foreign);
pass('stale, ended, expired, re-identified, relocated and foreign choices all refuse without mutation');

// The destination dock briefs the same assignment for reacquisition.
const destId = job.destSystem;
dock(destId);
desk.selectService('people'); tick(1);
assert.ok(domButtons().some((b) => b.textContent === briefLabel),
  'the destination dock briefs the same assignment for reacquisition');
domButtons().find((b) => b.textContent === briefLabel).click();
assert.equal(api.act({ v: 2, name: 'stationAction',
  args: { n: desk.peekView().actions.findIndex((a) => a.label === briefLabel) } }).notice, expectedBrief,
'the destination dock gives the identical brief');
pass('destination-dock availability matches the employer dock, with identical copy');

// ---- save/reload and the starter's untouched basic payment ----------------
dock('freehold');
const saved = clone(snapshot(ctx));
const mid = ctx.world.jobs.find((j) => j.id === job.id);
mid.shadow.deep.state = 'pursuing';
mid.shadow.deep.observedSeconds = 12.3;
mid.shadow.suspicion = 47.5;
mid.shadow.warned = true;
mid.shadow.warningSeconds = 2.4;
mid.progress = 1;
mid.shadow.courierCreated = true;
mid.shadow.observedSeconds = T.requiredSeconds;
const midSave = clone(snapshot(ctx));
restore(ctx, midSave);
let reloaded = ctx.world.jobs.find((j) => j.id === job.id);
assert.deepEqual(reloaded.shadow, mid.shadow, 'reload preserves exact evidence, suspicion, warning and grace');
assert.equal(ctx.world.scanner, 2, 'reload preserves the mounted eye');
assert.equal(desk.peekShadow(reloaded).deep.suspicionGain, 3, 'the restored eye still sets the rate');
for (const [phase, seconds, reason] of [['ready', T.deepSeconds, ''], ['closed', 0, 'exposed']]) {
  const save = clone(midSave);
  const row = save.world.jobs.find((j) => j.id === job.id);
  row.shadow.deep.state = phase; row.shadow.deep.observedSeconds = seconds; row.shadow.deep.closedReason = reason;
  restore(ctx, save);
  assert.equal(ctx.world.jobs.find((j) => j.id === job.id).shadow.deep.state, phase, `${phase} survives reload`);
}
// Synthetic downgrade across a save: the restored mount, not the old one, sets
// the rate, and it resets no accumulated danger.
const downgraded = clone(midSave);
downgraded.world.scanner = 0;
restore(ctx, downgraded);
reloaded = ctx.world.jobs.find((j) => j.id === job.id);
assert.equal(ctx.world.scanner, 0);
assert.equal(desk.peekShadow(reloaded).deep.suspicionGain, 4);
assert.deepEqual(reloaded.shadow, mid.shadow, 'a changed mount resets no evidence, suspicion, warning or grace');
pass('reload preserves risk, evidence, dossier phase and the mounted eye; a changed eye resets nothing');

// A stock starter still finishes and is paid the basic quote exactly once.
restore(ctx, clone(saved));
job = ctx.world.jobs.find((j) => isShadowJob(j) && j.state === 'accepted');
const basicPay = job.payQuoted;
ctx.world.scanner = 0; // stock starter, no upgrade and no briefing needed
job.progress = 1;
job.shadow.courierCreated = true;
job.shadow.observedSeconds = T.requiredSeconds;
const beforePay = ctx.world.credits;
dock(job.originSystem); tick(12);
assert.equal(ctx.world.credits - beforePay, basicPay, 'the stock starter is paid the quoted basic report');
const paidSave = clone(snapshot(ctx));
restore(ctx, paidSave); tick(12);
assert.equal(ctx.world.credits, beforePay + basicPay, 'no duplicate payment after reload');
pass('an unequipped starter still completes and is paid the basic quote exactly once');

console.log(`All ${checks} issue-239 contract groups passed (synthetic; natural live play required).`);
