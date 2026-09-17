/** Issue #238 synthetic contract tests. Natural flight remains a separate live gate. */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { COURIER_SHADOW as T } from '../src/game/state.js';
import { freshShadowState, sanitizeShadowState, stepShadow, shadowDossierBlocked,
  shadowEarnedPay, isShadowJob } from '../src/game/courier-shadow.js';
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
dom.dispatchKey('KeyM'); chart.update(0);
const beginButton = [...dom.walkDom(document.body)].find(e => e.dataset?.choice === 'begin' && e.textContent.includes(String(D)));
assert.ok(beginButton); beginButton.click();
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
console.log(`All ${checks} issue-238 contract groups passed (synthetic; live playtest required).`);
