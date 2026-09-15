/** #185: receipts from the production boot loop, including the completion tick. */
import assert from 'node:assert/strict';
import { installDomStubs, bootGameSystems, seedBootRandom } from './lib/boot-harness.mjs';
seedBootRandom(7);
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const events = [];
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += 1 / 60; ctx.elapsed += 1 / 60;
    for (const [, sys] of systems) sys.update?.(1 / 60);
    events.push(...ctx.events);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
for (const el of dom.walkDom(document.body)) {
  if (el.dataset?.titleAction === 'new') { el.click(); break; }
}
dom.dispatchKey('Digit1'); ctx.flags.paused = false; tick(30);
ctx.agent.optIn = true;
const act = name => window.rimward.act({ v: 2, name, args: {} });
const st = ctx.station.position;
ctx.ship.object.position.set(st.x + 120, st.y, st.z);
ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
ctx.input.fullStop = true;
// A manual pulse outside the berth still yields its honest refusal.
dom.dispatchKey('KeyJ'); tick();
assert.ok(events.some(e => e.type === 'hailMiss' && e.reason === 'dock-range'));
assert.equal(ctx.flags.docked, false);
events.length = 0;
assert.equal(act('approachDock').ok, true);
for (let i = 0; i < 60 * 120 && !ctx.flags.docked; i++) tick();
assert.equal(ctx.flags.docked, true, 'real controller reaches berth');
tick(3); // completion and receipt publication happen after station docking
assert.equal(ctx.autopilot.phase, 'complete');
assert.equal(ctx.autopilot.reason, 'docked');
assert.equal(events.filter(e => e.type === 'docked').length, 1);
assert.equal(events.some(e => e.type === 'hailMiss' && e.reason === 'dock-range'), false);
assert.equal(events.some(e => e.type === 'commLine' && e.text === 'Dock approach refused — already docked.'), false);
const refusal = act('approachDock');
assert.equal(refusal.ok, false);
assert.equal(refusal.token, 'docked');
console.log('PASS #185: real approach completes cleanly; range and explicit docked refusals preserved');
