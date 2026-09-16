/** #221: mounted freighter, same-helm retries and visible failure receipts. */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { purchaseYardHull } from '../src/game/shipyard.js';
import { switchTo } from '../src/game/hangar.js';
import { tryApproachDock, disengage } from '../src/game/autopilot.js';
let seed = 7;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const dt = 1 / 60;
const ap = systems.find(([name]) => name === 'autopilot')[1];
const hud = systems.find(([name]) => name === 'hud')[1];
function tick(n, owners = systems) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += dt; ctx.elapsed += dt;
    for (const [, system] of owners) system.update?.(dt);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1'); ctx.flags.paused = false; tick(30);
ctx.agent.optIn = true;
// Disclosed dock/credit fixture, real Yard purchase and Hangar mount owners.
ctx.flags.docked = true; ctx.world.credits = 100000;
const bought = purchaseYardHull(ctx, 'freighter');
assert.equal(bought.ok, true); assert.equal(switchTo(ctx, bought.row.id).ok, true);
assert.equal(ctx.player.hullMax, 220); assert.equal(ctx.cargoCapacity, 160);
ctx.flags.docked = false;
const gate = binds.SYSTEMS.freehold.gates.find(g => g.to === 'veridian');
ctx.ship.object.position.fromArray(gate.position);
ctx.ship.object.quaternion.identity(); ctx.ship.velocity.set(0,0,0); ctx.ship.speed = 0;
ctx.station.inZone = false;
assert.equal(tryApproachDock(ctx), '');
assert.equal(ctx.autopilot.phase, 'stage', 'explicit approach shares the queued bore exit');
const start = ctx.world.time, hits = [], phases = new Set();
for (let frame = 0; frame < 100 * 60 && !ctx.flags.docked && ctx.autopilot.engaged; frame++) {
  tick(1); phases.add(ctx.autopilot.phase);
  hits.push(...ctx.lastEvents.filter(e => ['bodyHit','playerDestroyed','sunHeat'].includes(e.type)));
}
console.log('FREIGHTER ARRIVAL', JSON.stringify({elapsed:ctx.world.time-start, hits, phases:[...phases], ap:ctx.autopilot}));
assert.equal(ctx.flags.docked, true, 'one explicit arrival command reaches berth');
assert.deepEqual(hits, [], 'arrival has no collision, heat or death');
assert.ok(ctx.world.time - start < 85, 'freighter arrival completes within bounded 85 seconds');

// Controller-only blockage fixtures freeze pose deliberately: test watchdog
// ownership/timing, not collision geometry. Full-flight pins above/corridor cover that.
function beginHeld() {
  disengage(ctx, 'test'); ctx.flags.docked = false; ctx.station.inZone = false;
  ctx.ship.object.position.set(ctx.station.position.x + 700, ctx.station.position.y, ctx.station.position.z);
  ctx.ship.object.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1), new THREE.Vector3(-1,0,0));
  ctx.ship.velocity.set(0,0,0); ctx.ship.speed = 0; ctx.events=[]; ctx.lastEvents=[];
  assert.equal(tryApproachDock(ctx), '');
}
const heldOwners = [['autopilot',ap],['hud',hud]];
beginHeld();
tick(12*60, heldOwners);
assert.equal(ctx.autopilot.engaged, true, 'first blocked window keeps the same helm');
ctx.flags.paused = true; tick(30*60, heldOwners); ctx.flags.paused = false;
assert.equal(ctx.autopilot.engaged, true, 'paused time cannot exhaust retry');
// Clear obstruction by resuming real ship/world owners without another command.
for (let frame=0;frame<70*60 && ctx.autopilot.engaged && !ctx.flags.docked;frame++) tick(1);
assert.equal(ctx.flags.docked,true,'same helm resumes and docks after transient hold');
beginHeld(); tick(22*60, heldOwners);
assert.equal(ctx.autopilot.engaged,false,'persistent obstruction has a finite retry budget');
assert.equal(ctx.autopilot.reason,'blocked'); assert.equal(ctx.input.fullStop,true);
const receipt = [...dom.walkDom(document.body)].find(n => n.dataset?.dockFailure === 'true');
assert.ok(receipt && !receipt.classList.contains('is-hidden'));
assert.match(receipt.textContent,/route is blocked/);
assert.equal(tryApproachDock(ctx),''); tick(1,heldOwners);
assert.ok(receipt.classList.contains('is-hidden'),'accepted fresh approach clears receipt');
disengage(ctx,'cancel'); tick(25*60,heldOwners);
assert.equal(ctx.autopilot.engaged,false,'manual cancel never restarts a retry');
assert.ok(receipt.classList.contains('is-hidden'),'manual cancellation is not an unexpected failure');
beginHeld(); ctx.lastEvents=[{type:'bodyHit',kind:'asteroid',speed:10,damage:1}]; tick(1,heldOwners);
assert.equal(ctx.autopilot.reason,'impact','real contact is never retried');
assert.match(receipt.textContent,/hull contact/);
console.log('PASS #221 freighter arrival, transient/persistent watchdog, pause, cancel, impact and HUD');
