/**
 * Issue #183 — approachDock queued behind a plotted route.
 *
 * A route ends at the arrival gate, so an agent had to notice the arrival and
 * send a second `approachDock`. This runner pins the queued intent end to end
 * on the REAL boot graph: the production system loop flies the gates, the
 * production dock controller takes the berth, and nothing is stubbed.
 *
 * Everything is driven through the public `window.rimward` handle and the
 * shared harness helpers, so the queue pins below fail against pre-#183
 * source (the queue request is refused 'autopilot' there and no berth is
 * ever reached) without importing anything new.
 *
 * Deterministic: seeded RNG, tick-driven, no wall-clock waits, no browser.
 */
import assert from 'node:assert/strict';
import { installDomStubs, bootGameSystems, makeNavHelpers } from './lib/boot-harness.mjs';

let seed = 7;
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

const nav = makeNavHelpers({
  ctx, SYSTEMS, tick, dispatchKey: dom.dispatchKey,
  onRouteError: (m) => { throw new Error(m); },
});
const rw = globalThis.window.rimward;

const act = (name, args = {}) => rw.act({ v: 2, name, args });
const obs = () => rw.observe();
const queuedDock = () => {
  const ap = obs().autopilot;
  return ap && typeof ap.queuedDock === 'string' ? ap.queuedDock : '';
};
const stationName = (id) => SYSTEMS[id].station.name;

/** Tick until `done()` or the sim budget runs out. Returns the seconds spent. */
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

const report = {};

// ---- 1. The queue contract, at the freehold berth, with no flight ----------
// Accepting, re-accepting, and every way a wish must end. None of this moves
// the ship: a queued intent is a plan, not a helm.
{
  assert.equal(act('plotRoute', { dest: 'redmarch' }).ok, true);
  assert.equal(act('engageAutopilot').ok, true);

  const queued = act('approachDock');
  assert.equal(queued.ok, true, 'approachDock behind a route is accepted');
  assert.equal(queued.status, 'queued', 'and answers with a queued receipt');
  assert.equal(queued.token, '');
  assert.equal(queued.error, '');
  assert.equal(queuedDock(), 'redmarch', 'observe() names the bound destination');
  assert.equal(obs().nav.autopilot, true, 'the route helm still owns the ship');
  assert.equal(ctx.autopilot.mode, 'route', 'the dock helm has NOT taken over');

  // Asking twice is the same plan, not a second one.
  const again = act('approachDock');
  assert.equal(again.ok, true);
  assert.equal(again.status, 'queued');
  assert.equal(queuedDock(), 'redmarch');

  // The receipt is JSON-safe, like every other act() answer.
  assert.equal(typeof JSON.parse(JSON.stringify(queued)).status, 'string');

  // Cancelling the lease ends the wish, and re-engaging never revives it.
  assert.equal(act('cancelAutopilot').ok, true);
  assert.equal(queuedDock(), '', 'cancelAutopilot drops the queued intent');
  assert.equal(act('engageAutopilot').ok, true);
  assert.equal(queuedDock(), '', 'a fresh lease does not resurrect the wish');

  // A replot replaces the route, so it replaces the wish — the SAME
  // destination included.
  assert.equal(act('approachDock').status, 'queued');
  assert.equal(act('plotRoute', { dest: 'redmarch' }).ok, true);
  assert.equal(queuedDock(), '', 'a same-destination replot clears the wish');

  // Clearing the route clears the wish with it.
  assert.equal(act('engageAutopilot').ok, true);
  assert.equal(act('approachDock').status, 'queued');
  assert.equal(act('clearRoute').ok, true);
  assert.equal(queuedDock(), '', 'clearRoute drops the queued intent');

  // The human takeover (issue #163: Escape in open flight is the only one)
  // takes the ship back and the wish with it.
  assert.equal(act('plotRoute', { dest: 'redmarch' }).ok, true);
  assert.equal(act('engageAutopilot').ok, true);
  assert.equal(act('approachDock').status, 'queued');
  dom.dispatchKey('Escape');
  tick(2);
  assert.equal(obs().nav.autopilot, false, 'Escape breaks the route helm');
  assert.equal(queuedDock(), '', 'a manual takeover drops the queued intent');

  // A refused plot writes no route, so it can never arm a wish.
  const badPlot = act('plotRoute', { dest: 'nowhere-at-all' });
  assert.equal(badPlot.ok, false);
  assert.equal(badPlot.token, 'noDest');
  assert.equal(queuedDock(), '');

  report.contract = 'ok';
}

// ---- 2. A route with NO queue behaves exactly as it did before #183 --------
// The lease comes off at the jump (nav.js writeNav), the pilot is left at the
// arrival gate, and nothing resumes on its own. This guard passes on pre-#183
// source too: it is here so the queue work cannot quietly broaden navigation.
{
  assert.equal(act('plotRoute', { dest: 'redmarch' }).ok, true);
  assert.equal(act('engageAutopilot').ok, true);
  assert.equal(queuedDock(), '', 'no wish is queued for this leg');

  flyUntil(() => ctx.world.currentSystem === 'veridian', 90);
  assert.equal(ctx.world.currentSystem, 'veridian', 'the first hop still flies');
  tick(10);
  assert.equal(obs().nav.autopilot, false, 'an unqueued lease still ends at the jump');
  assert.equal(obs().nav.status, 'plotted');
  assert.equal(obs().nav.dest, 'redmarch');

  // Left alone it stays put: no second hop, no berth, no helm.
  flyUntil(() => ctx.flags.docked === true || ctx.world.currentSystem !== 'veridian', 30);
  assert.equal(ctx.world.currentSystem, 'veridian', 'an unqueued route does not fly on');
  assert.equal(ctx.flags.docked, false, 'and never takes a berth by itself');
  assert.equal(ctx.autopilot.mode, 'route');

  report.unqueuedUnchanged = 'ok';
}

// ---- 3. Queued, one hop: veridian → redmarch, no second command -----------
{
  assert.equal(act('plotRoute', { dest: 'redmarch' }).ok, true);
  assert.equal(act('engageAutopilot').ok, true);
  assert.equal(act('approachDock').status, 'queued');

  // From here the agent sends NOTHING that could help it dock. The single
  // probe below is asserted to be REFUSED, so it can only hurt.
  let approachAccepted = 0;
  let refusedWhileDocking = 0;
  let probed = false;
  const phases = new Set();
  const elapsed = flyUntil(() => ctx.flags.docked === true, 150, () => {
    const ap = obs().autopilot;
    if (ap.mode === 'dock') {
      if (ap.phase) phases.add(ap.phase);
      if (!probed && ap.engaged === true) {
        probed = true;
        const dup = act('approachDock');
        if (dup.ok === true) approachAccepted++;
        else if (dup.token === 'autopilot') refusedWhileDocking++;
      }
    }
  });

  assert.equal(ctx.flags.docked, true, `queued route reached the berth (${elapsed.toFixed(1)}s)`);
  assert.equal(ctx.world.currentSystem, 'redmarch');
  assert.equal(ctx.station.name, stationName('redmarch'), 'and it is the DESTINATION berth');
  assert.equal(approachAccepted, 0, 'no approachDock was accepted after the route started');
  assert.equal(refusedWhileDocking, 1, 'a repeat while docking keeps the old refusal');
  assert.ok(phases.has('settle'), `the real dock controller flew it: ${[...phases].join(',')}`);
  assert.equal(queuedDock(), '', 'the wish is consumed by the handoff');

  // Docked, the plain refusal is unchanged.
  const whileDocked = act('approachDock');
  assert.equal(whileDocked.ok, false);
  assert.equal(whileDocked.token, 'docked');

  report.oneHop = { elapsed: Number(elapsed.toFixed(1)), phases: [...phases] };
}

// ---- 4. Queued, two hops: the wish rides an intermediate system -----------
// The berth it must NOT take is the one it passes through.
{
  nav.undockStation();
  assert.equal(ctx.flags.docked, false, 'launched for the two-hop leg');
  tick(60);

  const from = ctx.world.currentSystem;
  const twoHop = Object.keys(SYSTEMS).find((id) => {
    const path = nav.routePath(from, id);
    return path && path.length === 3 && SYSTEMS[id].station;
  });
  assert.ok(twoHop, 'the galaxy offers a two-hop destination');
  const midway = nav.routePath(from, twoHop)[1];

  assert.equal(act('plotRoute', { dest: twoHop }).ok, true);
  assert.equal(act('engageAutopilot').ok, true);
  assert.equal(act('approachDock').status, 'queued');
  assert.equal(queuedDock(), twoHop);

  let approachAccepted = 0;
  let dockedMidway = false;
  let sawMidway = false;
  const elapsed = flyUntil(() => ctx.flags.docked === true, 240, () => {
    if (ctx.world.currentSystem === midway) {
      sawMidway = true;
      if (ctx.flags.docked === true) dockedMidway = true;
    }
  });

  assert.equal(sawMidway, true, `the route really passed through ${midway}`);
  assert.equal(dockedMidway, false, 'the wish never took the intermediate berth');
  assert.equal(ctx.flags.docked, true, `two-hop queued route reached the berth (${elapsed.toFixed(1)}s)`);
  assert.equal(ctx.world.currentSystem, twoHop);
  assert.equal(ctx.station.name, stationName(twoHop), 'and it is the DESTINATION berth');
  assert.equal(approachAccepted, 0);
  assert.equal(queuedDock(), '');

  report.twoHop = { from, midway, dest: twoHop, elapsed: Number(elapsed.toFixed(1)) };
}

// ---- 5. A REFUSED raw request never cancels the wish (natural window) ----
// Straight after a jump the fade still owns the gate, so a `setControl` in
// that window is refused 'jumping'. A refusal changed no ownership, so the
// queued intent must survive it and still take the berth.
{
  nav.undockStation();
  assert.equal(ctx.flags.docked, false, 'launched for the refusal leg');
  tick(60);

  const from = ctx.world.currentSystem;
  const oneHop = Object.keys(SYSTEMS).find((id) => {
    const path = nav.routePath(from, id);
    return path && path.length === 2 && SYSTEMS[id].station;
  });
  assert.ok(oneHop, 'the galaxy offers a one-hop destination');

  assert.equal(act('plotRoute', { dest: oneHop }).ok, true);
  assert.equal(act('engageAutopilot').ok, true);
  assert.equal(act('approachDock').status, 'queued');

  let refused = null;
  const elapsed = flyUntil(() => ctx.flags.docked === true, 150, () => {
    if (refused === null
      && ctx.world.currentSystem === oneHop
      && ctx.gate.jumping === true
      && ctx.autopilot.engaged === false
      && queuedDock() === oneHop) {
      refused = act('setControl', { seq: 101, ttl: 5, throttle: 0.5 });
    }
  });

  assert.ok(refused, 'the arrival really opened a waiting handoff window');
  assert.equal(refused.ok, false, 'the jump fade refuses a raw lease');
  assert.equal(refused.token, 'jumping');
  assert.equal(ctx.flags.docked, true, `a refused request left the wish alive (${elapsed.toFixed(1)}s)`);
  assert.equal(ctx.world.currentSystem, oneHop);
  assert.equal(ctx.station.name, stationName(oneHop));

  report.refusedKeepsWish = { dest: oneHop, elapsed: Number(elapsed.toFixed(1)) };
}

// ---- 6. An ACCEPTED raw lease retires the wish for good -------------------
// The waiting handoff runs with no helm engaged, so a raw control lease taken
// in that window owns propulsion. The wish must stand down permanently — the
// berth coming up later, or the lease expiring first, may never take the ship
// back from that owner. The pending window is held open here by a destination
// station that is not ready yet; the handoff itself is the production one.
//
// Imported after section 1 on purpose: against pre-#183 source this file must
// fail on the queue assertion there, not on a missing module.
{
  const { armPendingDock, queuedDockDest, clearQueuedDock } =
    await import('../src/game/dock-queue.js');

  nav.undockStation();
  assert.equal(ctx.flags.docked, false, 'launched for the raw-lease boundaries');
  tick(60);

  const here = ctx.world.currentSystem;
  const berthName = stationName(here);
  const HOLD = 'issue183 berth not ready';

  /** A waiting handoff whose destination berth has not come up yet. */
  const holdPendingWindow = () => {
    act('clearControl');
    clearQueuedDock();
    ctx.station.name = HOLD;
    armPendingDock(here, ctx.world.time + 20);
    tick(2);
    assert.equal(queuedDockDest(), here, 'the handoff is waiting on the berth');
    assert.equal(ctx.autopilot.engaged, false, 'and no helm owns the ship');
  };
  const releaseBerth = (frames) => {
    ctx.station.name = berthName;
    tick(frames);
  };
  // ap.mode keeps its last label after a disengage, so ownership is the pair.
  const dockHelmOwns = () => ctx.autopilot.engaged === true && ctx.autopilot.mode === 'dock';

  // Raw throttle: accepted, so the wish is retired the moment the lease is.
  holdPendingWindow();
  const throttleLease = act('setControl', { seq: 201, ttl: 1, throttle: 0.5 });
  assert.equal(throttleLease.ok, true, 'a raw throttle lease is accepted here');
  assert.equal(throttleLease.owner, 'manual');
  assert.equal(queuedDockDest(), '', 'an accepted raw lease retires the wish at once');
  // The berth comes up AND the short lease expires: nothing may take over.
  releaseBerth(150);
  assert.equal(obs().control.owner, 'none', 'the raw lease has since expired');
  assert.equal(dockHelmOwns(), false, 'the retired wish never came back');
  assert.equal(ctx.flags.docked, false);
  assert.equal(queuedDock(), '');

  // Subtle steering is ownership too: 0.1 is well under the reticle break.
  holdPendingWindow();
  const steerLease = act('setControl', { seq: 202, ttl: 5, steerX: 0.1 });
  assert.equal(steerLease.ok, true, 'a light steering lease is accepted here');
  assert.equal(queuedDockDest(), '', 'a subtle steer retires the wish too');
  releaseBerth(30);
  assert.equal(dockHelmOwns(), false, 'and the handoff stays stood down');

  // An explicit hand-back ends the wish with everything else.
  holdPendingWindow();
  assert.equal(act('clearControl').ok, true);
  assert.equal(queuedDockDest(), '', 'clearControl retires the wish');
  releaseBerth(30);
  assert.equal(dockHelmOwns(), false, 'and the handoff stays stood down');

  // A REFUSED raw request changed no ownership, so the wish survives it and
  // the handoff still takes the berth the moment it comes up.
  holdPendingWindow();
  const badLease = act('setControl', { seq: 203, ttl: 5, throttle: 5 });
  assert.equal(badLease.ok, false, 'an out-of-range throttle is refused');
  assert.equal(badLease.token, 'bad-throttle');
  assert.equal(queuedDockDest(), here, 'a refused request leaves the wish alone');
  releaseBerth(3);
  assert.equal(dockHelmOwns(), true, 'and the handoff still takes the helm');
  assert.equal(queuedDock(), '', 'the wish is consumed by that handoff');
  assert.equal(act('cancelAutopilot').ok, true);

  report.rawOwnership = 'ok';
}

console.log('ISSUE183 RESULT', JSON.stringify(report));
console.log('PASS issue183 a queued approachDock rides a plotted route to the destination berth');
