/**
 * Issue #268 — the arrival handoff: nav.status 'arrived' must never read ready
 * while approachDock would refuse 'jumping'.
 *
 * The #249 playtest frame: plotRoute + engageAutopilot from Veridian, a poll
 * read world.currentSystem 'redmarch' and nav.status 'arrived' (autopilot
 * false), and the very next approachDock was refused token 'jumping' — the
 * gate fade still owned the hull for the rest of JUMP.chargeTime.
 *
 * Root cause: jump.js's midpointSwap emits 'systemLoaded' mid-fade; nav.js's
 * recalcOnLoad (same frame, initNav runs after initJump) rewrote the bag as
 * 'arrived' and dropped the helm, so every poll for the REST of the charge
 * time showed "arrived and ready" while the helm refusals were still up. The
 * fix holds the lease through the fade (disengage still fires at the flyTick
 * 'arrive', with the same arrival receipt) and publishes nav.settling on the
 * transient pre-settle window, so a runner can tell the two apart.
 *
 * This runner drives the REAL system loop end to end on the real boot graph —
 * seeded RNG, tick-driven, no wall-clock waits, no browser — and samples the
 * public observe() surface every frame of the arrival, so it fails against
 * pre-fix source exactly the way the playtest did.
 *
 * Env: ISSUE268_SEED (default 7). It must pass on seeds 1-8.
 */
import assert from 'node:assert/strict';
import { installDomStubs, bootGameSystems, makeNavHelpers } from './lib/boot-harness.mjs';

let seed = Number(process.env.ISSUE268_SEED || 7) >>> 0;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { SYSTEMS } = binds;

const DT = 1 / 60;
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

// Fresh greenhand session, the same front door every other runner uses.
for (const node of dom.walkDom(document.body)) {
  if (node.dataset?.titleAction === 'new') { node.click(); break; }
}
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
ctx.agent.optIn = true;

const rw = globalThis.window.rimward;
const navHelpers = makeNavHelpers({
  ctx, SYSTEMS, tick, dispatchKey: dom.dispatchKey,
  onRouteError: (m) => { throw new Error(m); },
});
const act = (name, args = {}) => rw.act({ v: 2, name, args });
const obs = () => rw.observe();

/** Tick until done() or the sim budget runs out; returns sim seconds spent. */
function flyUntil(done, seconds, onFrame) {
  const began = ctx.world.time;
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    tick(1);
    if (typeof onFrame === 'function') onFrame();
    if (done()) break;
  }
  return ctx.world.time - began;
}

const report = { legs: [] };

// ---- 1. The playtest leg: single-hop route poll reads, every frame ---------
// From the freehold berth: plot veridian, engage, and watch EVERY public
// frame between midpointSwap (currentSystem flips) and the settled ready
// state. The invariant: an arrived read inside the fade is published with
// the settling marker, and the first ready arrived frame accepts a dock.
{
  assert.equal(ctx.world.currentSystem, 'freehold', 'the greenhand boots at freehold');
  const plotted = act('plotRoute', { dest: 'veridian' });
  assert.equal(plotted.ok, true, 'veridian plots from freehold');
  assert.equal(act('engageAutopilot').ok, true, 'the route helm engages');

  let samples = null;
  const budget = 150;
  const elapsed = flyUntil(() => samples !== null && samples.done, budget, () => {
    if (samples !== null && samples.done) return;
    const current = ctx.world.currentSystem;
    if (current !== 'veridian') return;
    if (samples === null) {
      // First frame in the new system — begin the per-frame public audit.
      samples = { done: false, frames: [], sawArrived: false, sawSettling: false };
    }
    const o = obs();
    const navStatus = o.nav ? o.nav.status : '';
    const settling = !!(o.nav && o.nav.settling === true);
    const jumping = o.gate ? o.gate.jumping === true : false;
    const settleState = jumping
      ? 'fade' // gate still charging: every helm act refuses 'jumping'
      : o.autopilot && o.autopilot.queuedDock
        ? 'handoff' // armed wish waiting for the berth, no helm engaged
        : 'ready'; // nothing pending; an approachDock here must be accepted
    if (navStatus === 'arrived') samples.sawArrived = true;
    if (settling) samples.sawSettling = true;
    samples.frames.push({ t: o.t, navStatus, settling, jumping, settleState });
    if (!jumping && navStatus === 'arrived' && settleState === 'ready') samples.done = true;
  });

  assert.ok(samples, 'the route never reached veridian within ' + budget + 's');
  assert.ok(samples.frames.length >= 1, 'the arrival produced no public frames');

  // THE invariant (issue #268 acceptance): a frame that reads nav.status
  // 'arrived' while approachDock would refuse 'jumping' may exist, but only
  // named — settleState 'fade' — so an agent can tell it from a ready one.
  const bad = samples.frames.filter((f) => f.navStatus === 'arrived'
    && f.jumping && !f.settling);
  assert.equal(bad.length, 0,
    'arrived-with-jumping frames without the settling marker: ' + JSON.stringify(bad.slice(0, 4)));

  // The refusal must agree with the public read: every 'fade'-state arrived
  // frame carries jumping true (the refusal's own condition), and a 'ready'
  // arrived frame never does.
  for (const f of samples.frames) {
    if (f.navStatus !== 'arrived') continue;
    if (f.settleState === 'ready') assert.equal(f.jumping, false,
      'a ready arrived frame still refused approachDock: ' + JSON.stringify(f));
    if (f.settleState === 'fade') assert.equal(f.jumping, true,
      'a fade arrived frame without the gate charge: ' + JSON.stringify(f));
  }

  // The pre-fix failure order must be reproducible knowledge: on this graph
  // at least one audit frame saw the fade still running.
  assert.ok(
    samples.frames.some((f) => f.jumping),
    'the audit never observed the fade window — fixture drift, not a pass');

  // First arrived frame contract.
  const first = samples.frames.find((f) => f.navStatus === 'arrived');
  assert.ok(first, "no frame ever read nav.status 'arrived' before the budget ended");
  assert.equal(first.settleState, 'fade',
    'the first arrived frame was not the transient: ' + JSON.stringify(first));
  assert.equal(first.settling, true,
    'the transient arrived frame lacks nav.settling');

  // and the ready state is immediately actionable through the public surface:
  const readyApproach = act('approachDock');
  assert.equal(readyApproach.ok, true,
    'the first settled arrived frame still refused approachDock: '
    + JSON.stringify({ token: readyApproach.token, error: readyApproach.error }));
  assert.equal(act('cancelAutopilot').ok, true);

  report.legs.push({
    leg: 'single-hop-audit', elapsed: Number(elapsed.toFixed(1)),
    frames: samples.frames.length, sawSettling: samples.sawSettling,
    first: { navStatus: first.navStatus, jumping: first.jumping, settling: first.settling === true },
  });
}

// ---- 2. The refused-then-accepted pairing, probed back to back -------------
// The playtest pair: a command in the fade window (refused 'jumping') then a
// later one (accepted). Both must agree with the SAME public read they were
// issued on.
{
  // Start the return leg the production way: manual harness hops home to
  // freehold (no route helm), dock at the berth, undock normally, then plot
  // + engage from launch. Parking a hull by hand near the return gate
  // strands it in the approach planner's keep spheres — the harness's own
  // travelTo never asks the route helm to fly FROM a gate-adjacent pose, and
  // neither will this runner.
  assert.ok(navHelpers.travelTo('freehold', 'leg2 reset home'), 'the manual hop home arrived');
  tick(10);
  navHelpers.dockAtCurrentStation('leg2 reset dock');
  assert.equal(ctx.flags.docked, true, 'the freehold berth took the hull back');
  navHelpers.undockStation();
  assert.equal(ctx.flags.docked, false, 'launched for the pairing leg');
  tick(60);

  // Route out again and audit the arrival the same way.
  assert.equal(act('plotRoute', { dest: 'veridian' }).ok, true);
  assert.equal(act('engageAutopilot').ok, true);
  let refused = null;
  let acceptedAfter = null;
  let frames = 0;
  const elapsed = flyUntil(() => refused !== null && acceptedAfter !== null, 150, () => {
    if (refused !== null && acceptedAfter !== null) return;
    if (ctx.world.currentSystem !== 'veridian') return;
    frames++;
    const o = obs();
    if (refused === null && o.gate.jumping === true && o.nav && o.nav.status === 'arrived') {
      // A poll in the old trap window: the read says arrived, the gate says
      // jumping. With the marker published this frame must name it.
      assert.equal(o.nav.settling, true,
        'arrived+jumping poll lacked the settling marker: ' + JSON.stringify(o.nav));
      refused = act('approachDock');
      return;
    }
    if (refused !== null && acceptedAfter === null
      && o.gate.jumping === false && o.nav && o.nav.status === 'arrived') {
      acceptedAfter = act('approachDock');
    }
  });

  assert.ok(refused, 'the fade window never produced an arrived+jumping poll');
  assert.equal(refused.ok, false, 'the fade-window approachDock is refused');
  assert.equal(refused.token, 'jumping', 'with the playtest token');
  assert.ok(acceptedAfter, 'the settled arrived frame never arrived within ' + elapsed.toFixed(1) + 's over ' + frames + ' frames');
  assert.equal(acceptedAfter.ok, true, 'the settled approachDock is accepted');
  assert.equal(act('cancelAutopilot').ok, true);

  report.legs.push({ leg: 'pairing', elapsed: Number(elapsed.toFixed(1)), frames });
}

console.log('ISSUE268 RESULT', JSON.stringify({ seed: Number(process.env.ISSUE268_SEED || 7), ...report }));
console.log('PASS issue268 nav arrived never reads ready while the fade refuses approachDock');
