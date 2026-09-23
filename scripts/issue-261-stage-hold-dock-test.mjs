/**
 * Issue #261 — after a traffic hold stops the dock helm near the station, the
 * stage leg goes around the station body and does not fly into it.
 *
 * Evidence: issue-168-cruise-test seed 7 with the 5 u/s arrival drift stops
 * the light hull for Veridian traffic at about (-158, 25, -473), 79u from the
 * station. Two faults then put it into the hull:
 *   1. The stage detour side came from the cruise side hint, not from the
 *      stage goal, so the helm latched the far way round the station.
 *   2. A station detour keeps creep while the hull turns. With the nose still
 *      on the station, that creep carried the hull into it (27.6 u/s hit).
 *
 * Real boot, real starter light hull, real route to Veridian, real physics
 * and collision owners. Disclosed fixtures: live traffic in Veridian is
 * removed every frame, and after the arrival the hull is placed at rest at
 * the seed-7 hold point with its nose on the station centre. No clock or
 * damage change.
 *
 * Negative control: on the pre-fix autopilot the queued approach hits the
 * station at creep speed and cancels as `impact`.
 *
 * Usage: node --import ./scripts/with-css-stub.mjs scripts/issue-261-stage-hold-dock-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installDomStubs, bootGameSystems, makeNavHelpers } from './lib/boot-harness.mjs';

let seed = 7;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { removeLiveShip } = binds;
const { PHY } = await import('../src/game/physics.js');

const DT = 1 / 60;
const events = [];
function clearTraffic() {
  if (ctx.world.currentSystem !== 'veridian') return;
  for (const live of ctx.ships.slice()) removeLiveShip(ctx, live);
  ctx.ships.length = 0;
}
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    clearTraffic();
    events.push(...ctx.events.filter(e => e.type === 'bodyHit' || e.type === 'docked'));
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
for (const node of dom.walkDom(document.body)) {
  if (node.dataset?.titleAction === 'new') { node.click(); break; }
}
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
ctx.agent.optIn = true;
const nav = makeNavHelpers({ ctx, SYSTEMS: binds.SYSTEMS, tick, dispatchKey: dom.dispatchKey,
  onRouteError: message => { throw Error(message); } });
assert.ok(nav.travelTo('veridian', 'issue261 arrival'));
tick(60);

const station = ctx.station.position.clone();
const obj = ctx.ship.object;
obj.position.set(-158.25, 24.98, -473.16);
obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1),
  station.clone().sub(obj.position).normalize());
ctx.ship.velocity.set(0, 0, 0);
ctx.ship.speed = 0;
const startRange = obj.position.distanceTo(station);
events.length = 0;

const act = (name, args = {}) => globalThis.window.rimward.act({ v: 2, name, args });
assert.equal(act('approachDock').ok, true);
const began = ctx.world.time;
const phases = new Set();
let minRange = Infinity;
let maxX = -Infinity;
let minX = Infinity;
for (let f = 0; f < 90 * 60 && !ctx.flags.docked && ctx.autopilot.engaged; f++) {
  tick(1);
  phases.add(ctx.autopilot.phase);
  const p = obj.position;
  minX = Math.min(minX, p.x);
  maxX = Math.max(maxX, p.x);
  if (ctx.autopilot.phase === 'stage') minRange = Math.min(minRange, p.distanceTo(station));
}
const stationHits = events.filter(e => e.type === 'bodyHit' && e.kind === 'station');
const result = {
  startRange: +startRange.toFixed(1), elapsed: +(ctx.world.time - began).toFixed(2),
  docked: ctx.flags.docked === true, phases: [...phases], reason: ctx.autopilot.reason,
  stationHits, minStageRange: +minRange.toFixed(1), minX: +minX.toFixed(1),
  station: station.toArray().map(v => +v.toFixed(1)),
};
console.log('ISSUE261 STAGE HOLD', JSON.stringify(result));
assert.ok(startRange < 100, 'the fixture starts the stage leg near the station');
assert.deepEqual(stationHits, [], 'the stage leg never touches the station body');
assert.ok(minRange > 32 + PHY.PLAYER_RADIUS, `the hull clears the station body (${minRange.toFixed(1)}u)`);
// The stage point is on the +X side. The short way from the hold point passes
// north of the station; the far way swings west of it first.
assert.ok(minX > station.x - 60, `the helm takes the short side (min x ${minX.toFixed(1)})`);
assert.equal(result.docked, true, 'the queued approach reaches the berth');
assert.ok(result.elapsed < 45, `the approach docks in ${result.elapsed}s`);
console.log('ISSUE261 STAGE HOLD PASS');
process.exit(0);
