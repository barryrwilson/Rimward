import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { surveyObjective, hasSurveyMarker } from '../src/game/survey-nav.js';
import { SYSTEMS, CONVERGENCE, DEEPENING } from '../src/game/state.js';
import { snapshot, restore } from '../src/game/save.js';

seedBootRandom();
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems } = await bootGameSystems();
const api = window.rimward;
const dt = 1 / 60;
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += dt;
    ctx.elapsed += dt;
    for (const [, sys] of systems) sys.update?.(dt);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
function act(name, args = {}) {
  const result = api.act({ v: 2, name, args });
  assert.equal(result.ok, true, `${name}: ${JSON.stringify(result)}`);
  return result;
}
function waitUntil(predicate, label, seconds = 90) {
  for (let i = 0; i < seconds * 10; i++) {
    if (predicate(api.observe())) return;
    tick(6);
  }
  const s = api.observe();
  assert.fail(`${label}: ${JSON.stringify({ t: s.t, jobs: s.jobs, flags: s.flags, autopilot: s.autopilot, events: s.events })}`);
}
const marks = () => [...dom.walkDom(document.body)]
  .filter((node) => node.classList?.contains('rw-chartmark') && !node.classList.contains('is-hidden'));

// Main acceptance flight: boot configuration and ticking are harness duties;
// the controller below uses only public actions/observations, never source
// coordinates, position writes, staged targets, or seeded credits/equipment.
act('startGame');
act('chooseOrigin', { id: 'greenhand' });
tick(120);
act('approachDock');
waitUntil((s) => s.flags.docked, 'fresh dock');
act('openService', { id: 'jobs' });
const offer = api.observe().jobs.offers.find((j) => j.kind === 'explore' && j.state === 'offered');
assert.ok(offer, 'fresh survey offer');
assert.equal(offer.objective, undefined, 'unaccepted objectives are not enumerated');
assert.equal(marks().length, 0);
act('acceptJob', { id: offer.id });
tick(2);
const accepted = api.observe().jobs.active.find((j) => j.id === offer.id);
assert.equal(accepted.objective.status, 'docked');
assert.equal(accepted.objective.range, null);
assert.equal(accepted.objective.bearing, null);
assert.match(api.observe().capabilities.roles.explorer.note, /jobs\.active\[\]\.objective/);
const quoted = accepted.payQuoted;
const creditsBefore = api.observe().world.credits;
const acceptedSave = JSON.parse(JSON.stringify(snapshot(ctx))); // serialized save, used ONLY by isolated restore checks after the public flight
act('undock');
tick(2);
assert.equal(marks().length, 1, 'accepted survey gets the same visible HUD marker');
let seq = 0;
let reached = false;
let initialRange = null;
for (let i = 0; i < 1800; i++) {
  const s = api.observe();
  const job = s.jobs.active.find((j) => j.id === offer.id);
  assert.ok(job, 'survey stays active until filing');
  const o = job.objective;
  if (o.discovered) { reached = true; break; }
  assert.equal(o.status, 'available');
  assert.equal(o.arrivalRange, 100);
  assert.ok(Array.isArray(o.bearing));
  initialRange ??= o.range;
  const [x, y, z] = o.bearing;
  const aligned = z < -0.85;
  const throttle = aligned ? (o.range > 250 ? 0.6 : 0.2) : 0;
  act('setControl', {
    seq: ++seq, ttl: 0.5,
    steerX: Math.max(-1, Math.min(1, x * 3)),
    steerY: Math.max(-1, Math.min(1, y * 3)), throttle,
  });
  tick(6);
}
assert.ok(reached, 'observation-only controller reaches survey');
act('clearControl');
waitUntil((o) => o.jobs.active.find((j) => j.id === offer.id)?.progress === 1, 'survey progress');
let s = api.observe();
const witnessed = s.jobs.active.find((j) => j.id === offer.id);
assert.equal(witnessed.progress, 1);
assert.equal(witnessed.objective.status, 'discovered');
assert.equal(witnessed.objective.bearing, null);
assert.ok(s.events.some((e) => e.type === 'landmarkFound' && e.id === witnessed.objective.id));
assert.equal(marks().length, 0, 'witnessed marker disappears');
act('approachDock');
waitUntil((o) => o.flags.docked, 'return and file');
waitUntil((o) => o.events.some((e) => e.type === 'jobState' && e.id === offer.id && e.outcome === 'delivered'), 'quoted filing outcome');
s = api.observe();
assert.ok(s.events.some((e) => e.type === 'jobState' && e.id === offer.id && e.outcome === 'delivered'));
assert.equal(s.world.credits - creditsBefore, quoted, 'actual payment equals accepted quote');
console.log(`PASS public survey flight: ${initialRange.toFixed(1)} u to discovery, progress 1/1, quoted/paid ${quoted} UU`);

// Isolated negative/lifecycle fixtures. These are not used by the controller.
const fixture = {
  systems: SYSTEMS,
  world: { currentSystem: accepted.objective.system, time: 1, mystery: { visited: [], charted: [] }, jobs: [] },
  flags: { docked: false },
  ship: { object: { position: { x: 0, y: 0, z: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 } } },
};
const job = { id: 'fixture', kind: 'explore', state: 'accepted', originSystem: accepted.originSystem, slot: 0, need: 1, deadline: 100 };
fixture.world.jobs = [job];
const lm = SYSTEMS[accepted.objective.system].landmarks[0];
assert.equal(hasSurveyMarker(fixture, lm), true);
for (const changes of [{ state: 'offered' }, { state: 'failed' }, { slot: 7 }, { originSystem: '__proto__' }, { need: 2 }, { deadline: 1 }]) {
  const invalid = { ...job, ...changes };
  fixture.world.jobs = [invalid];
  assert.equal(hasSurveyMarker(fixture, lm), false);
  const o = surveyObjective(fixture, invalid);
  assert.equal(o.status, 'unavailable');
  assert.equal(o.bearing, null);
  assert.equal(o.range, null);
  assert.equal(o.id, undefined);
  assert.match(o.reason, /Jobs board/);
}
fixture.world.jobs = [job];
fixture.world.currentSystem = 'veridian';
let o = surveyObjective(fixture, job);
assert.equal(o.status, 'different-system');
assert.equal(o.bearing, null);
assert.equal(o.range, null);
assert.match(o.reason, /plotRoute/);
assert.equal(hasSurveyMarker(fixture, lm), false);
fixture.world.currentSystem = accepted.objective.system;
o = surveyObjective(fixture, job);
assert.equal(o.status, 'available');
const text = JSON.stringify(o);
for (const hidden of [CONVERGENCE.site.id, DEEPENING.site.id, ...SYSTEMS.veridian.clues.map((c) => c.id)]) assert.ok(!text.includes(hidden));
assert.ok(!Object.hasOwn(o, 'position') && !Object.hasOwn(o, 'line'));
o.bearing[0] = 42;
assert.notEqual(surveyObjective(fixture, job).bearing[0], 42, 'observations detach arrays');
console.log('PASS unavailable/offered/expired/malformed/remote objective restrictions and detached geometry');

restore(ctx, acceptedSave);
tick(3);
act('undock');
tick(3);
const restored = api.observe().jobs.active.find((j) => j.id === offer.id);
assert.equal(restored.objective.status, 'available');
assert.equal(restored.objective.id, accepted.objective.id);
assert.equal(marks().length, 1, 'restored accepted job re-derives marker without chart mutation');
assert.ok(!ctx.world.mystery.charted?.includes(restored.objective.id));
ctx.world.mystery.charted = [restored.objective.id]; // keeper-mark overlap fixture only
tick(2);
assert.equal(marks().length, 1, 'keeper and accepted survey mark deduplicate');
const activeJob = ctx.world.jobs.find((j) => j.id === offer.id);
ctx.world.mystery.charted = [];
activeJob.deadline = ctx.world.time;
assert.equal(api.observe().jobs.active.find((j) => j.id === offer.id).objective.status, 'unavailable');
tick(2);
assert.equal(marks().length, 0, 'expired contract marker disappears');
console.log('PASS save/restore marker derivation, chart deduplication and expiry');
console.log('SURVEY NAVIGATION PASS');
