/** #171 integration pin; requires API, controls and dock-helm fixes together.
 * node --import ./scripts/with-css-stub.mjs scripts/issue-171-burner-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
for (const el of dom.walkDom(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false; ctx.flags.berthHold = false; ctx.flags.combat = false;
ctx.agent.optIn = true;
const position = ctx.systems[ctx.world.currentSystem].station.position;
ctx.ship.object.position.set(position[0] + 800, position[1], position[2]);
ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
ctx.station.inZone = false;
ctx.input.fullStop = false; ctx.input.throttle = 1;
const rw = window.rimward;
const act = (name, args = {}) => rw.act({ v: 2, name, args });
function tick() {
  ctx.world.time += 1 / 60; ctx.elapsed += 1 / 60;
  for (const [name, system] of systems) if (['controls', 'autopilot', 'flee', 'ship', 'agentapi'].includes(name)) system.update(1 / 60);
  ctx.lastEvents = ctx.events; ctx.events = [];
}
act('clearControl');
assert.equal(act('afterburner').ok, true);
tick();
assert.equal(ctx.flee?.engaged === true, false, 'raw pulse never owns flee');
assert.equal(ctx.input.afterburnerPressed, true, 'raw pulse reaches ship on next update');
assert.equal(ctx.ship.burnerActive, true, 'raw pulse starts real ship burner');
const approach = act('approachDock');
assert.equal(approach.ok, true, JSON.stringify(approach));
tick();
assert.equal(ctx.input.afterburnerPressed, false, 'edge is one update only');
assert.equal(ctx.autopilot.engaged, true, 'active burner handoff survives next update');
act('cancelAutopilot');
// Exercise the queued pulse and approach in the same JS turn as well.
assert.equal(act('afterburner').ok, true);
assert.equal(act('approachDock').ok, true);
tick();
assert.equal(ctx.autopilot.engaged, true, 'queued agent edge does not cancel dock handoff');
console.log('PASS #171 raw pulse reaches ship once, owns no flee, and both dock handoffs survive');
