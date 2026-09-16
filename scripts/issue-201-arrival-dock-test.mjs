/** Issue #201: real route/queued dock with optional disclosed bore-edge arrival pose. */
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
const edge = process.env.ISSUE201_EDGE !== '0';
const axial = Number(process.env.ISSUE201_AXIAL || 0);
const report = [];
for (const dest of ['veridian', 'freehold']) {
  if (ctx.flags.docked) { nav.undockStation(); tick(60); }
  assert.equal(act('plotRoute', { dest }).ok, true);
  assert.equal(act('engageAutopilot').ok, true);
  assert.equal(act('approachDock').status, 'queued');
  const hits = [], phases = new Set();
  let arrivedAt = null, handoffAt = null, fixtureApplied = false;
  const elapsed = flyUntil(() => ctx.flags.docked || ctx.autopilot.phase === 'failed', 180, () => {
    if (ctx.world.currentSystem !== dest) return;
    arrivedAt ??= ctx.world.time;
    if (edge && !ctx.gate.jumping && !fixtureApplied) {
      assert.notEqual(ctx.autopilot.mode, 'dock', 'fixture precedes dock takeover');
      fixtureApplied = true;
      const gate = SYSTEMS[dest].gates.find(g => g.to === (dest === 'veridian' ? 'freehold' : 'veridian'));
      const p = gate.position, st = ctx.station.position;
      const n = Math.hypot(...p), ax = -p[0]/n, ay = -p[1]/n, az = -p[2]/n;
      const dx=st.x-p[0], dy=st.y-p[1], dz=st.z-p[2], dot=dx*ax+dy*ay+dz*az;
      const rx=dx-dot*ax, ry=dy-dot*ay, rz=dz-dot*az, r=Math.hypot(rx,ry,rz);
      ctx.ship.object.position.set(p[0]+rx/r*25.39+ax*axial, p[1]+ry/r*25.39+ay*axial, p[2]+rz/r*25.39+az*axial);
      ctx.ship.velocity.set(0,0,0); ctx.ship.speed=0;
    }
    if (ctx.autopilot.mode === 'dock') {
      handoffAt ??= ctx.world.time;
      phases.add(ctx.autopilot.phase);
    }
    for (const e of ctx.lastEvents) if (e.type === 'bodyHit') hits.push({ ...e });
  });
  report.push({ dest, elapsed, arrivedAt, handoffAt, phases: [...phases], hits, ap: { ...ctx.autopilot } });
  console.log(JSON.stringify(report.at(-1)));
  assert.equal([...phases][0], 'stage', 'arrival aligns or clears the bore before cruise');
  assert.equal(hits.some(e => e.kind === 'gate'), false, `${dest}: arrival must not strike the gate`);
  assert.equal(ctx.flags.docked, true, `${dest}: queued route reaches berth`);
  assert.ok(handoffAt - arrivedAt < 5, 'clear arrival meets the existing handoff deadline');
}
console.log('issue-201 PASS');

// A cancelled departure cannot leave its private gate waypoint in a later
// ordinary dock approach. Use a remote station pose solely for this cleanup pin.
nav.undockStation(); tick(60);
assert.equal(act('plotRoute', { dest: 'veridian' }).ok, true);
assert.equal(act('engageAutopilot').ok, true);
assert.equal(act('approachDock').status, 'queued');
flyUntil(() => ctx.world.currentSystem === 'veridian' && !ctx.gate.jumping, 100);
const arrivalGate = SYSTEMS.veridian.gates.find(g => g.to === 'freehold');
ctx.ship.object.position.fromArray(arrivalGate.position);
ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
flyUntil(() => ctx.autopilot.mode === 'dock' && ctx.autopilot.engaged, 5);
assert.equal(ctx.autopilot.phase, 'stage');
assert.equal(act('cancelAutopilot').ok, true);
const station = ctx.station.position;
ctx.ship.object.position.set(station.x + 700, station.y, station.z);
ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
assert.equal(act('approachDock').ok, true);
tick(1);
assert.equal(ctx.autopilot.phase, 'cruise', 'new ordinary approach has no gate-clear scratch');
assert.equal(act('cancelAutopilot').ok, true);
console.log('issue-201 cancellation cleanup PASS');
