/** #171 integration pin; requires API, controls and dock-helm fixes together.
 * node --import ./scripts/with-css-stub.mjs scripts/issue-171-burner-test.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
// Fresh processes keep each real-system scenario independent of private timers.
if (!process.argv.includes('--near-pad')) {
  for (const range of [56, 44]) {
    const child = spawnSync(process.execPath,
      [...process.execArgv, import.meta.filename, '--near-pad', String(range)],
      { stdio: 'inherit', windowsHide: true, timeout: 60_000 });
    assert.equal(child.error, undefined, `near-pad ${range} process error`);
    assert.equal(child.signal, null, `near-pad ${range} terminated`);
    assert.equal(child.status, 0, `near-pad ${range} failed`);
  }
}
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
if (process.argv.includes('--near-pad')) {
  const targetRange = Number(process.argv.at(-1));
  const events = [];
  function realTick() {
    ctx.world.time += 1 / 60; ctx.elapsed += 1 / 60;
    for (const [, system] of systems) system.update?.(1 / 60);
    events.push(...ctx.events.filter(e => ['bodyHit', 'sunHeat', 'docked', 'playerDestroyed'].includes(e.type)));
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
  // Labeled initial fixture: +X pad lane, nose toward the station, already
  // approaching at 30u/s. All systems, traffic, damage and collision stay on.
  // From this point every position/velocity change comes from normal updates.
  ctx.ship.object.position.set(position[0] + targetRange + 18, position[1], position[2]);
  ctx.ship.object.quaternion.setFromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI / 2);
  ctx.ship.velocity.set(-30, 0, 0); ctx.ship.speed = 30;
  const control = act('setControl', { seq: 1, ttl: 2, throttle: 1 });
  assert.equal(control.ok, true, JSON.stringify(control));
  assert.equal(act('afterburner').ok, true);
  let burnerFrames = 0;
  while (ctx.ship.object.position.distanceTo(ctx.station.position) > targetRange && burnerFrames < 120) {
    realTick(); burnerFrames++;
  }
  const handoff = { range: ctx.ship.object.position.distanceTo(ctx.station.position), speed: ctx.ship.speed,
    burnerFrames, burnerActive: ctx.ship.burnerActive, flee: ctx.flee?.engaged === true };
  assert.ok(burnerFrames >= 3, 'burner runs actual frames before handoff');
  assert.ok(handoff.range >= targetRange - 2 && handoff.range <= targetRange, JSON.stringify(handoff));
  assert.ok(handoff.speed > 30, 'raw pulse accelerated the actual hull');
  assert.equal(handoff.burnerActive, true);
  assert.equal(handoff.flee, false);
  assert.equal(events.some(e => ['bodyHit', 'sunHeat', 'playerDestroyed'].includes(e.type)), false,
    `fixture flight must reach handoff without damage: ${JSON.stringify(events)}`);
  assert.equal(act('clearControl').ok, true);
  const accepted = act('approachDock');
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  realTick();
  const takeover = { range: ctx.ship.object.position.distanceTo(ctx.station.position), speed: ctx.ship.speed,
    burnerActive: ctx.ship.burnerActive };
  assert.equal(takeover.burnerActive, false, 'explicit dock helm retires the active burn on takeover');
  assert.ok(takeover.speed < handoff.speed, 'first takeover frame brakes instead of sustaining burner thrust');
  let frames = 1;
  const phases = new Set([ctx.autopilot.phase]);
  while (!ctx.flags.docked && ctx.autopilot.engaged && frames < 60 * 60) {
    realTick(); frames++; phases.add(ctx.autopilot.phase);
  }
  const evidence = { targetRange, handoff, takeover, elapsed: frames / 60, docked: ctx.flags.docked,
    phases: [...phases], speed: ctx.ship.speed, ap: ctx.autopilot, events };
  console.log('NEAR_PAD', JSON.stringify(evidence));
  assert.equal(events.some(e => ['bodyHit', 'sunHeat', 'playerDestroyed'].includes(e.type)), false,
    'near-pad burner handoff must not cause an impact or damage');
  assert.equal(ctx.flags.docked, true, 'active burner must yield to safe braking and reach berth');
  assert.ok(ctx.ship.speed < 1, 'docked hull is stopped');
  console.log(`PASS #171 near-pad ${targetRange}u active burner handoff docks safely`);
  process.exit(0);
}
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
assert.equal(ctx.ship.burnerActive, false, 'dock takeover retires the active burner');
act('cancelAutopilot');
// Exercise the queued pulse and approach in the same JS turn as well.
assert.equal(act('afterburner').ok, true);
assert.equal(act('approachDock').ok, true);
tick();
assert.equal(ctx.autopilot.engaged, true, 'queued agent edge does not cancel dock handoff');
assert.equal(ctx.ship.burnerActive, false, 'same-turn dock takeover consumes the queued burner');
console.log('PASS #171 raw pulse reaches ship once, owns no flee, and both dock handoffs survive');
