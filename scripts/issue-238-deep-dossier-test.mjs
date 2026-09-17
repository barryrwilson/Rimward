/** Issue #238 synthetic contract tests. Natural flight remains a separate live gate. */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { COURIER_SHADOW as T } from '../src/game/state.js';
import { freshShadowState, sanitizeShadowState, stepShadow, shadowDossierBlocked,
  shadowEarnedPay, isShadowJob, shadowDossierTerms, guardShadowDossierSpace } from '../src/game/courier-shadow.js';
import { readFileSync } from 'node:fs';
import { agentCombatSet } from '../src/systems/controls.js';
import { snapshot, restore } from '../src/game/save.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
let checks = 0;
const pass = (s) => { checks++; console.log('PASS ' + s); };
const input = (over = {}) => ({ accepted: true, acquired: true, playerAlive: true, sameSystem: true,
  courierAlive: true, courierPresent: true, certified: true, inCorridor: true, selected: true,
  sightClear: true, distance: 250, warningPresented: true, courierName: 'Test courier',
  employerStation: 'Home', payQuoted: 200, secondsLeft: 700, ...over });
const basic = () => ({ ...freshShadowState(300), courierCreated: true, observedSeconds: 30 });
const pursuing = () => { const s = basic(); s.deep.state = 'pursuing'; return s; };
const contract = { state: 'accepted', progress: 1, reward: 200, payQuoted: 200 };
function run(s, seconds, over = {}) {
  let out;
  for (let i = 0; i < Math.round(seconds * 10); i++) { out = stepShadow(s, input(over), .1); s = out.shadow; }
  return out;
}

assert.equal(T.version, 2);
assert.equal(sanitizeShadowState(freshShadowState(), { state: 'offered', progress: 0 }).v, 1);
assert.equal(sanitizeShadowState(freshShadowState(), { state: 'accepted', progress: 0 }).deep.state, 'legacy');
for (const state of ['available', 'pursuing', 'ready', 'closed', 'legacy']) {
  const s = basic(); s.deep.state = state;
  if (state === 'ready') s.deep.observedSeconds = T.deepSeconds;
  if (state === 'closed') s.deep.closedReason = 'withdrawn';
  if (state === 'legacy') s.deep.payQuoted = 0;
  assert.deepEqual(sanitizeShadowState(clone(s), contract), s);
}
for (const mutate of [s => { s.deep.extra = 1; }, s => { s.extra = 1; }, s => { s.deep.payQuoted = 200; },
  s => { s.deep.payQuoted = Infinity; }, s => { s.deep.payQuoted = 300.5; }, s => { s.deep.observedSeconds = 1; },
  s => { s.deep.state = 'ready'; }, s => { s.deep.state = 'closed'; }, s => { s.deep.closedReason = 'withdrawn'; },
  s => { s.deep.state = 'pursuing'; s.deep.observedSeconds = 30; }, s => { s.deep.state = 'legacy'; }]) {
  const s = basic(); mutate(s); assert.equal(sanitizeShadowState(s, contract), null);
}
for (const payQuoted of [undefined, NaN, 0, '200', 200.5, 20001]) {
  assert.equal(sanitizeShadowState(basic(), { ...contract, payQuoted }), null);
}
assert.equal(sanitizeShadowState(basic(), { ...contract, state: 'offered', progress: 0 }), null);
pass('strict v2 phase/quote invariants and literal v1 migration');
for (const state of ['available', 'pursuing', 'ready', 'closed']) {
  const shadow = basic(); shadow.deep.state = state;
  if (state === 'closed') shadow.deep.closedReason = 'exposed';
  const terms = shadowDossierTerms(shadow, input());
  assert.equal(terms.includes('Optional:'), state === 'available');
  if (state === 'closed') {
    const instruction = stepShadow(shadow, input(), 0).instruction;
    assert.equal(instruction, `Basic report ready. ${terms}`);
    assert.ok(terms.includes('Tail identified; dossier opportunity lost.')); assert.ok(terms.includes('cannot be retried')); }
  if (state === 'ready') assert.ok(terms.includes('banked. File at Home for 300 UU total'));
  if (state === 'pursuing') assert.ok(terms.includes('attempt in progress'));
}
for (const code of ['Escape', 'Enter', 'KeyM', 'KeyN', 'Space']) {
  let stopped = 0, cancelled = 0;
  guardShadowDossierSpace({ code, stopPropagation() { stopped++; }, preventDefault() { cancelled++; } });
  assert.equal(stopped, code === 'Space' ? 1 : 0);
  assert.equal(cancelled, 0, 'native button activation is retained');
}
const chartSource = readFileSync(new URL('../src/systems/galaxychart.js', import.meta.url), 'utf8');
assert.equal(chartSource.includes('preventDefault(') || chartSource.includes('stopPropagation('), false,
  'existing wave85 chart noPrevent contract stays intact');
pass('phase-specific terms and Space-only native keyboard guard preserve chart close keys');

assert.deepEqual(run(basic(), 60).shadow, basic(), 'no opt-in means no evidence or risk');
let s = pursuing();
assert.ok(Math.abs(run(s, 1).shadow.suspicion - 4) < 1e-9);
assert.equal(run(s, 1, { distance: 100 }).shadow.suspicion, 10);
assert.equal(run(s, 1, { selected: false }).shadow.deep.observedSeconds, 0);
assert.ok(run(s, 1, { selected: false }).shadow.suspicion > 0);
for (const over of [{ certified: false }, { inCorridor: false }, { sameSystem: false }, { courierPresent: false },
  { docked: true }, { berthHold: true }, { paused: true }, { jumping: true }, { expired: true }, { playerAlive: false }]) {
  assert.deepEqual(run(s, 1, over).shadow, s);
}
const uninterrupted = run(s, 31);
const collision = pursuing();
Object.assign(collision, { suspicion: 99.9, warned: true, warningSeconds: 7.99 });
collision.deep.observedSeconds = 29.99;
assert.equal(stepShadow(collision, input(), .1).shadow.deep.state, 'closed', 'exposure precedes deep readiness');
assert.equal(uninterrupted.shadow.deep.state, 'closed');
assert.equal(uninterrupted.shadow.deep.closedReason, 'exposed');
assert.equal(uninterrupted.shadow.deep.observedSeconds, 0);
assert.equal(uninterrupted.shadow.observedSeconds, 30);
assert.equal(shadowEarnedPay({ ...contract, shadow: uninterrupted.shadow }), 200);
pass('opt-in alone enables extra risk; selection-independent rates and pauses; exposure keeps B');

s = run(pursuing(), 15).shadow;
assert.ok(s.warned && s.warningSeconds > 0);
const partial = s.deep.observedSeconds, grace = s.warningSeconds;
s = run(s, 20, { distance: 450 }).shadow;
assert.equal(s.suspicion, 0); assert.equal(s.warningSeconds, grace); assert.equal(s.deep.observedSeconds, partial);
s = run(s, 16).shadow;
assert.equal(s.deep.state, 'ready'); assert.equal(s.deep.observedSeconds, 30);
assert.equal(shadowEarnedPay({ ...contract, shadow: s }), 300);
assert.deepEqual(run(s, 20, { distance: 100 }).shadow, s);
const restoredWarning = { ...pursuing(), warned: true, warningSeconds: 3, suspicion: 80 };
assert.equal(run(restoredWarning, 1, { warningPresented: false }).shadow.warningSeconds, 3);
assert.equal(shadowDossierBlocked(basic(), input()), '');
for (const over of [{ selected: false }, { distance: 149 }, { distance: 401 }, { sightClear: false }, { expired: true },
  { paused: true }, { jumping: true }, { docked: true }, { acquired: false }]) assert.notEqual(shadowDossierBlocked(basic(), input(over)), '');
pass('warning/cooling/reacquisition banks D; completion stops risk and reload never restores grace');

seedBootRandom();
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems, binds } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
const chart = systems.find(([n]) => n === 'galaxychart')[1];
for (const el of dom.walkDom(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false; ctx.agent.optIn = true;
const api = window.rimward;
const act = (id, choice, extra = {}) => api.act({ v: 2, name: 'chooseShadowDossier', args: { id, choice, ...extra } });
function tick(n = 1, dt = .1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += dt; ctx.elapsed += dt; station.update(dt);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false; ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }]; world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.dockPressed = true; tick(2); ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true);
}
function offer() { return ctx.world.jobs.find(j => isShadowJob(j) && j.originSystem === 'freehold'); }
dock('freehold'); ctx.stationDesk.selectService('jobs'); tick(2);
let job = offer(); const offered = clone(job);
const B = job.reward, D = job.shadow.deep.payQuoted;
assert.equal(D, B + Math.round(B * .5));
assert.equal(api.observe().availability.chooseShadowDossier.ok, false);
assert.ok(api.observe().jobs.offers.find(j => j.id === job.id).shadow.deep.terms.includes(`${D} UU total`));
assert.equal(api.observe().jobs.offers.find(j => j.id === job.id).shadow.deep.terms.includes('Warning history:'), false);
assert.equal(ctx.stationDesk.acceptJob(job.id).ok, true);
assert.equal(job.shadow.deep.payQuoted, D);
if (ctx.flags.docked) ctx.stationDesk.undock();
ctx.flags.docked = false; ctx.flags.berthHold = false;
ctx.world.currentSystem = job.destSystem;
ctx.lastEvents = [{ type: 'systemLoaded', to: job.destSystem }]; world.update(0); tick(8);
let live;
function place(range = 250, selected = true) {
  const rec = ctx.world.recordBanks[job.destSystem].find(r => r.id === job.recordId);
  assert.ok(rec);
  live = ctx.ships.find(x => x.record === rec);
  if (!live) {
    const at = new ctx.ship.object.position.constructor(); binds.recordPosition(rec, at);
    live = binds.spawnLiveShip(ctx, rec, at); ctx.ships.push(live); rec.live = true;
  }
  ctx.ship.object.position.copy(live.object.position); ctx.ship.object.position.x += range;
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0; ctx.targets.current = selected ? live : null;
}
place();
assert.equal(act(job.id, 'begin').ok, false);
tick(301);
assert.equal(job.progress, 1);
assert.equal(job.shadow.deep.state, 'available');
const starting = clone(snapshot(ctx)), startJob = clone(job);
const unchanged = (fn) => { const before = JSON.stringify(job); assert.equal(fn().ok, false); assert.equal(JSON.stringify(job), before); };
unchanged(() => act('wrong-id', 'begin'));
unchanged(() => act(job.id, 'bogus'));
unchanged(() => act(job.id, 'begin', { injected: 1 }));
unchanged(() => ctx.stationDesk.chooseShadowDossier(Object.create({ id: job.id, choice: 'begin' })));
unchanged(() => ctx.stationDesk.chooseShadowDossier({ id: job.id, choice: 'begin' }, { ...job }));
place(250, false); unchanged(() => act(job.id, 'begin')); place();
ctx.flags.paused = true; unchanged(() => act(job.id, 'begin')); ctx.flags.paused = false;
ctx.gate.jumping = true; unchanged(() => act(job.id, 'begin')); ctx.gate.jumping = false;
const deadline = job.deadline; job.deadline = ctx.world.time; unchanged(() => act(job.id, 'begin')); job.deadline = deadline;
const beforeRead = JSON.stringify(job); api.observe(); ctx.stationDesk.peekShadow(job); chart.update(0);
assert.equal(JSON.stringify(job), beforeRead);
for (const phase of ['available', 'pursuing', 'ready', 'closed']) {
  const save = clone(starting), j = save.world.jobs.find(j => j.id === job.id);
  j.shadow.deep.state = phase;
  j.shadow.deep.observedSeconds = phase === 'ready' ? 30 : phase === 'pursuing' ? 6 : 0;
  j.shadow.deep.closedReason = phase === 'closed' ? 'withdrawn' : '';
  restore(ctx, save);
  assert.deepEqual(ctx.world.jobs.find(j => j.id === startJob.id).shadow, j.shadow);
}
restore(ctx, clone(starting)); job = ctx.world.jobs.find(j => j.id === startJob.id); place();
pass('real offer freeze, basic completion, API refusal/availability, fresh readonly projection');

// Native chart callback and API use the same expected-row mutation gate.
const otherJob = { ...clone(job), id: 'spy-ferrous-909', originSystem: 'ferrous',
  recordId: 'courier-spy-ferrous-909', target: 'Other courier' };
ctx.world.jobs.push(otherJob);
function buttonKey(type, button = null) {
  let stopped = false, cancelled = false;
  const event = { code: 'Space', key: ' ', repeat: false, target: button,
    stopPropagation() { stopped = true; }, preventDefault() { cancelled = true; } };
  for (const fn of button?._listeners[type] || []) fn(event);
  if (!stopped) for (const fn of dom.winListeners[type] || []) fn(event);
  return { stopped, cancelled };
}
const combatProbe = () => agentCombatSet(ctx, { seq: 1, ttl: 1, targetId: 'missing-target', intent: 'engage' });
buttonKey('keydown');
assert.equal(combatProbe(), 'player-override', 'physical Space hold blocks combat lease');
dom.dispatchKey('KeyM'); chart.update(0);
const beginButton = [...dom.walkDom(document.body)].find(e => e.dataset?.choice === 'begin' && e.textContent.includes(String(D)));
assert.ok(beginButton);
document.activeElement = beginButton;
assert.equal(buttonKey('keyup', beginButton).stopped, false, 'release reaches physical controls');
ctx.galaxyChart.close();
assert.notEqual(combatProbe(), 'player-override', 'release through focused button clears prior flight hold');
dom.dispatchKey('KeyM'); chart.update(0);
const dossierSection = [...dom.walkDom(document.body)].find(e => e.className === 'rw-shadow-assignment');
beginButton.dataset.choice = 'invalid'; beginButton.click();
assert.equal([...dom.walkDom(dossierSection)].filter(e => e.textContent?.includes('Dossier choice refused:')).length, 1,
  'a refusal notice appears on its own row only');
ctx.elapsed += 5.1; chart.update(0);
assert.equal([...dom.walkDom(dossierSection)].filter(e => e.textContent?.includes('Dossier choice refused:')).length, 0,
  'row notice expires');
let projectionReads = 0;
const originalPeek = ctx.stationDesk.peekShadow;
ctx.stationDesk.peekShadow = (...args) => { projectionReads++; return originalPeek(...args); };
for (let n = 0; n < 5; n++) { ctx.elapsed += .01; chart.update(0); }
assert.equal(projectionReads, 0, 'dossier raycasts are throttled between UI refreshes');
ctx.elapsed += .2; chart.update(0);
assert.equal(projectionReads, 2, 'one projection read per accepted row per paint');
ctx.stationDesk.peekShadow = originalPeek;
ctx.world.jobs = ctx.world.jobs.filter(j => j !== otherJob);
const keydown = buttonKey('keydown', beginButton);
const keyup = buttonKey('keyup', beginButton);
assert.deepEqual(keydown, { stopped: true, cancelled: false });
assert.deepEqual(keyup, { stopped: false, cancelled: false });
// Model the browser's default button click after the uncancelled Space pair.
beginButton.click();
document.activeElement = null;
assert.equal(job.shadow.deep.state, 'pursuing'); assert.equal(ctx.flags.chartOpen, false);
unchanged(() => act(job.id, 'begin'));
tick(140); const kept = job.shadow.deep.observedSeconds;
assert.ok(kept > 0 && job.shadow.warned);
place(450); tick(200); assert.equal(job.shadow.deep.observedSeconds, kept);
place(); tick(170);
assert.equal(job.shadow.deep.state, 'ready');
assert.equal(api.observe().jobs.active.find(j => j.id === job.id).reward, D);
assert.equal(api.observe().jobs.active.find(j => j.id === job.id).payQuoted, B);
const readySave = clone(snapshot(ctx));
restore(ctx, readySave); job = ctx.world.jobs.find(j => j.id === startJob.id);
assert.equal(job.shadow.deep.state, 'ready');
ctx.world.recordBanks[job.destSystem].find(r => r.id === job.recordId).state = 'dead'; tick(8);
assert.equal(job.shadow.deep.state, 'ready');
const beforePay = ctx.world.credits;
dock(job.originSystem); tick(12);
assert.equal(ctx.world.credits - beforePay, D);
const afterPay = clone(snapshot(ctx)); restore(ctx, afterPay); tick(12);
assert.equal(ctx.world.credits, beforePay + D);
pass('native opt-in/cooling/ready, tier projection, reload/target loss and D paid once');

function resetAttempt() {
  restore(ctx, clone(starting)); job = ctx.world.jobs.find(j => j.id === startJob.id);
  ctx.flags.docked = false; ctx.flags.berthHold = false; ctx.flags.paused = false;
  ctx.world.currentSystem = job.destSystem; place();
}
for (const outcome of ['ignore', 'pursuing', 'end', 'exposed', 'target-lost']) {
  resetAttempt();
  if (outcome !== 'ignore' && outcome !== 'target-lost') assert.equal(act(job.id, 'begin').ok, true);
  if (outcome === 'end') { assert.equal(act(job.id, 'end').ok, true); unchanged(() => act(job.id, 'end')); }
  if (outcome === 'exposed') { tick(310); assert.equal(job.shadow.deep.closedReason, 'exposed'); }
  if (outcome === 'target-lost') { live.record.state = 'captured'; tick(8); assert.equal(job.shadow.deep.closedReason, 'target-lost'); }
  if (['end', 'exposed', 'target-lost'].includes(outcome)) unchanged(() => act(job.id, 'begin'));
  const paidBefore = ctx.world.credits; dock(job.originSystem); tick(12);
  assert.equal(ctx.world.credits - paidBefore, B, outcome + ' files basic only');
}
pass('ignoring, unfinished attempt, explicit end, exposure and permanent target loss all preserve B');
for (const terminal of ['dead', 'captured', 'derelict', 'inTransit']) {
  resetAttempt(); assert.equal(act(job.id, 'begin').ok, true);
  live.record.state = terminal; tick(8);
  assert.equal(job.shadow.deep.closedReason, 'target-lost', terminal + ' still permanently closes deep');
}

resetAttempt();
for (const mutate of [j => { delete j.payQuoted; }, j => { j.payQuoted = 'bad'; }, j => { j.payQuoted = 20001; },
  j => { j.shadow.deep.extra = true; }, j => { j.shadow.deep.payQuoted = B; }]) {
  const save = clone(starting); mutate(save.world.jobs.find(j => j.id === job.id));
  restore(ctx, save); assert.equal(ctx.world.jobs.some(j => j.id === startJob.id), false);
}
const oldOffer = clone(starting); const oldRow = oldOffer.world.jobs.find(j => j.id === startJob.id);
Object.assign(oldRow, offered, { shadow: freshShadowState() });
delete oldRow.payQuoted;
restore(ctx, oldOffer); dock('freehold'); ctx.stationDesk.selectService('jobs');
job = ctx.world.jobs.find(j => j.id === startJob.id);
assert.equal(job.shadow.v, 1);
assert.equal(ctx.stationDesk.acceptJob(job.id).ok, true);
assert.equal(job.shadow.v, 2); assert.equal(job.shadow.deep.state, 'legacy'); assert.equal(job.shadow.deep.payQuoted, 0);
assert.equal(job.payQuoted, B);
pass('save rejects corrupt supported quotes; old offered v1 accepts as basic-only legacy');

// Cold page reload: initialize the real system graph around an existing save,
// then consume the queued systemLoaded events in production update order.
const coldSave = clone(starting);
coldSave.world.time = 246;
coldSave.world.activeEvent = { kind: 'pirateBlockade', endsAt: 1000 };
const ordinaryAliveIds = coldSave.world.records.filter(r => r.role === 'trader' && r.state === 'enroute'
  && r.id !== startJob.recordId).map(r => r.id);
const coldRow = coldSave.world.jobs.find(j => j.id === startJob.id);
coldRow.shadow.deep.state = 'pursuing';
coldRow.shadow.deep.observedSeconds = 20.1414;
coldRow.shadow.warned = true; coldRow.shadow.warningSeconds = 8; coldRow.shadow.suspicion = 0;
installDomStubs();
localStorage.setItem('rimward-save-v1', JSON.stringify(coldSave));
const cold = await bootGameSystems();
cold.ctx.flags.paused = false;
const coldJob = cold.ctx.world.jobs.find(j => j.id === startJob.id);
const savedRandom = Math.random;
Math.random = () => 0; // deterministic reservoir would select the last trader (courier)
for (let frame = 0; frame < 40; frame++) {
  cold.ctx.world.time += .02; cold.ctx.elapsed += .02;
  for (const [name, sys] of cold.systems) {
    sys.update?.(.02, cold.ctx);
    assert.ok(cold.ctx.world.recordBanks[coldJob.destSystem].some(r => r.id === coldJob.recordId),
      `cold restore retains bound record after ${name}, frame ${frame}`);
    assert.equal(cold.ctx.world.recordBanks[coldJob.destSystem].find(r => r.id === coldJob.recordId).state, 'enroute',
      `cold restore retains courier life after ${name}, frame ${frame}`);
  }
  cold.ctx.lastEvents = cold.ctx.events; cold.ctx.events = [];
}
Math.random = savedRandom;
assert.equal(coldJob.shadow.deep.state, 'pursuing');
assert.equal(coldJob.shadow.deep.observedSeconds, 20.1414);
assert.equal(coldJob.shadow.warningSeconds, 8);
assert.ok(cold.ctx.world.records.some(r => ordinaryAliveIds.includes(r.id) && r.state === 'dead'),
  'unrelated offscreen traders remain eligible for abstract blockade casualties');
const ownedRec = cold.ctx.world.records.find(r => r.id === coldJob.recordId);
const ownedLive = cold.ctx.ships.find(l => l.record === ownedRec);
if (ownedLive) {
  cold.binds.removeLiveShip(cold.ctx, ownedLive);
  cold.ctx.ships = cold.ctx.ships.filter(l => l !== ownedLive);
}
coldJob.state = 'failed'; ownedRec.live = false;
cold.ctx.world.time += 100;
Math.random = () => 0;
cold.systems.find(([name]) => name === 'world')[1].update(0);
Math.random = savedRandom;
assert.equal(ownedRec.state, 'dead', 'released courier regains ordinary abstract casualty eligibility');
pass('cold page reload preserves the same courier and partial dossier through actual system order');
console.log(`All ${checks} issue-238 contract groups passed (synthetic; live playtest required).`);
