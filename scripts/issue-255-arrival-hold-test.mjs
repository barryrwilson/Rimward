/**
 * Issue #255 — a jump arrival faces into the new system and an idle arrival
 * holds station.
 *
 * Before the fix `midpointSwap` called `lookAt(0, 0, 0)`, which points the
 * +Z tail at the centre, so the -Z nose faced the arrival gate and the creep
 * floor carried an idle hull about 33u back into the bore. Correcting only
 * the facing would make the creep floor carry the hull into the sun instead.
 *
 * Real boot, real gate jumps, real ship flight. Checks:
 *  - every authored arrival (Freehold -> Veridian -> Redmarch -> Hollow Reach)
 *    ends the jump with the nose on the system centre and the hold set;
 *  - 30 s idle after arrival moves the hull less than 1u and no body is hit;
 *  - player throttle releases the hold, and the normal creep floor returns;
 *  - the hold is transient: the save snapshot does not carry it.
 *
 * Usage: node --import ./scripts/with-css-stub.mjs scripts/issue-255-arrival-hold-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installDomStubs, bootGameSystems, makeNavHelpers } from './lib/boot-harness.mjs';

let seed = 7;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { SYSTEMS } = binds;
const { JUMP } = await import('../src/game/state.js');
const { snapshot } = await import('../src/game/save.js');

const DT = 1 / 60;
let hits = [];
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    for (const e of ctx.events) if (e.type === 'bodyHit') hits.push(e);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
const nav = makeNavHelpers({ ctx, SYSTEMS, tick, dispatchKey: dom.dispatchKey,
  onRouteError: message => { throw Error(message); } });

const nose = new THREE.Vector3();
const toCentre = new THREE.Vector3();
const start = new THREE.Vector3();

function checkArrival(to) {
  const from = ctx.world.currentSystem;
  ctx.input.throttle = 0;
  ctx.input.fullStop = false;
  assert.ok(nav.travelTo(to, `issue255 ${from}->${to}`));
  assert.equal(ctx.gate.jumping, false, 'jump finished');
  const obj = ctx.ship.object;
  nose.set(0, 0, -1).applyQuaternion(obj.quaternion);
  toCentre.copy(obj.position).negate().normalize();
  const facing = nose.dot(toCentre);
  assert.ok(facing > 0.999, `${from}->${to}: nose faces the centre (dot ${facing.toFixed(3)})`);
  assert.equal(ctx.ship.postJumpHold, true, `${from}->${to}: arrival hold set`);
  // Idle arrival: no creep into the bore or toward the sun.
  for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
  ctx.ships.length = 0;
  hits = [];
  start.copy(obj.position);
  tick(30 * 60);
  const moved = obj.position.distanceTo(start);
  assert.ok(moved < 1, `${from}->${to}: idle arrival moved ${moved.toFixed(2)}u`);
  assert.deepEqual(hits, [], `${from}->${to}: idle arrival hit nothing`);
  const gate = SYSTEMS[to].gates.find(g => g.to === from) ?? SYSTEMS[to].gates[0];
  const gateRange = obj.position.distanceTo(new THREE.Vector3(...gate.position));
  assert.ok(gateRange >= JUMP.arrivalOffset - 1, `${from}->${to}: hull stays clear of the bore (${gateRange.toFixed(1)}u)`);
  console.log('ISSUE255 ARRIVAL', JSON.stringify({ from, to, facing: +facing.toFixed(4),
    moved: +moved.toFixed(3), gateRange: +gateRange.toFixed(1) }));
}

checkArrival('veridian');
checkArrival('redmarch');
checkArrival('hollowreach');

// Transient: the snapshot never carries the hold.
assert.equal(JSON.stringify(snapshot(ctx)).includes('postJumpHold'), false, 'hold is not saved');

// Player throttle releases the hold; the ordinary creep floor then returns.
ctx.input.throttle = 0.5;
tick(60);
assert.equal(ctx.ship.postJumpHold, false, 'throttle releases the hold');
ctx.input.throttle = 0;
tick(8 * 60);
const creep = ctx.config.ship.creep * ctx.bio.speedFactor;
assert.ok(Math.abs(ctx.ship.speed - creep) < 2,
  `creep floor resumes after release (speed ${ctx.ship.speed.toFixed(2)}, creep ${creep})`);

console.log('ISSUE255 ARRIVAL HOLD PASS');
