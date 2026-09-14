import assert from 'node:assert/strict';
import { installDomStubs, bootGameSystems, makeNavHelpers } from './lib/boot-harness.mjs';

let seed = 7;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const events = [];
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += 1 / 60; ctx.elapsed += 1 / 60;
    for (const [, sys] of systems) sys.update?.(1 / 60);
    events.push(...ctx.events.filter(e => ['sunHeat', 'bodyHit', 'docked'].includes(e.type)));
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1'); ctx.flags.paused = false; tick(30);
ctx.agent.optIn = true;
const nav = makeNavHelpers({ ctx, SYSTEMS: binds.SYSTEMS, tick, dispatchKey: dom.dispatchKey, onRouteError: message => { throw Error(message); } });
assert.ok(nav.travelTo('veridian', 'issue168 arrival'));
// Isolate static route safety from unrelated moving traffic encounters.
for (const live of ctx.ships.splice(0)) binds.removeLiveShip(ctx, live);
const rw = window.rimward;
const began = ctx.world.time;
events.length = 0;
console.log('ARRIVAL', JSON.stringify({ p: ctx.ship.object.position, station: ctx.station.position, ship: ctx.config.ship }));
assert.equal(rw.act({ v: 2, name: 'approachDock', args: {} }).ok, true);
const duplicate = rw.act({ v: 2, name: 'approachDock', args: {} });
assert.equal(duplicate.ok, false);
assert.equal(duplicate.token, 'autopilot');
assert.ok(duplicate.error.length > 0);
const phases = new Set();
let maxSpeed = 0;
for (let i = 0; i < 60 * 120 && !ctx.flags.docked && ctx.autopilot.engaged; i++) {
  tick(1); phases.add(rw.observe().autopilot.phase); maxSpeed = Math.max(maxSpeed, ctx.ship.speed);
  if (process.env.CRUISE_TRACE && i % 60 === 0) console.log('TRACE', JSON.stringify({ t: ctx.world.time - began, ap: ctx.autopilot, p: ctx.ship.object.position, speed: ctx.ship.speed }));
}
const evidence = { elapsed: ctx.world.time - began, docked: ctx.flags.docked, phases: [...phases], maxSpeed, events, ap: ctx.autopilot };
console.log('RESULT', JSON.stringify(evidence));
assert.equal(ctx.flags.docked, true);
assert.ok(evidence.elapsed < 40, `dock took ${evidence.elapsed}s`);
assert.equal(events.some(e => e.type === 'sunHeat' || e.type === 'bodyHit'), false);
assert.ok(phases.has('cruise') && phases.has('stage') && phases.has('corridor'));
assert.ok(maxSpeed > 100);
console.log('PASS issue168 Veridian arrival cruises safely to berth in under 40 sim seconds');


