/**
 * Issue #293 — the undock act receipt must agree with the world it makes.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real station desk, the real
 * launch clearance, and the real agent handle. No copied verdict logic.
 *
 * Covered:
 *   1  openService('launch') undocks and answers ok; a same-frame redundant
 *      undock repeats the departure honestly (ok) instead of no-service, and
 *      the next observation reads docked=false — receipt agrees with the world
 *   2  the mirrored order: undock first, then openService('launch') — same
 *      honest ok while the departure is still in flight
 *   3  a stale departure (events flushed, ship flying) refuses no-service
 *      again: undock is never a blanket no-op
 *   4  the refusal case: a fouled lane answers blocked and the hull stays
 *      docked — receipt and world agree on the hold too
 *   5  a non-launch service with the ship flying still refuses no-service
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-293-undock-receipt-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { collectBodies } from '../src/game/collision.js';
import { PHY } from '../src/game/physics.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { SYSTEMS, spawnLiveShip, removeLiveShip } = binds;

const DT = 1 / 60;
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(2);

const api = globalThis.window.rimward;
assert.ok(api && typeof api.act === 'function', 'agent handle present');
ctx.agent.optIn = true;

/** Park on the station's +x side and run the REAL dock. */
function dockFrom() {
  if (ctx.flags.docked) throw new Error('fixture: already undocked');
  const s = SYSTEMS[ctx.world.currentSystem].station.position;
  ctx.ship.object.position.set(s[0] + 36, s[1], s[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  tick(1);
  ctx.input.dockPressed = false;
  tick(2);
  assert.equal(ctx.flags.docked, true, 'fixture dock landed');
}

/** One fixture hull parked in the outward lane, visible to the collector. */
const _fixtureBodies = { count: 0, items: [] };
function addLaneBlocker(id, name) {
  const s = SYSTEMS[ctx.world.currentSystem].station.position;
  const live = spawnLiveShip(
    ctx,
    { id, name, classKey: 'heavy', faction: 'freehold', role: 'trader', resolve: 50 },
    new THREE.Vector3(s[0] + 90, s[1], s[2]),
  );
  assert.ok(live, name + ' spawned');
  ctx.ships.push(live);
  collectBodies(ctx, _fixtureBodies);
  return live;
}
function removeLaneBlocker(live) {
  const i = ctx.ships.indexOf(live);
  assert.ok(i >= 0, 'blocker was in ctx.ships');
  ctx.ships.splice(i, 1);
  removeLiveShip(ctx, live);
  collectBodies(ctx, _fixtureBodies);
}

// --- 4 first (the refusal case): a fouled lane holds the berth and both
// verbs answer blocked with docked=true on the next observation.
dockFrom();
const blocker = addLaneBlocker('issue293-lane', 'Issue293 Lane Blocker');
tick(1);
const heldOpen = api.act({ name: 'openService', args: { id: 'launch' } });
pin('fouled lane: openService launch answers blocked',
  heldOpen.ok === false && heldOpen.token === 'blocked', heldOpen);
const heldUndock = api.act({ name: 'undock', args: {} });
pin('fouled lane: undock answers blocked',
  heldUndock.ok === false && heldUndock.token === 'blocked', heldUndock);
pin('fouled lane: the hull stays docked', ctx.flags.docked === true, ctx.flags.docked);
removeLaneBlocker(blocker);
tick(1);

// --- 1: openService('launch') does the departure, then a same-frame undock
// repeats the receipt honestly instead of answering no-service.
const flewOpen = api.act({ name: 'openService', args: { id: 'launch' } });
pin('openService launch answers ok', flewOpen.ok === true && flewOpen.token === '', flewOpen);
pin('openService launch undocked the hull', ctx.flags.docked === false, ctx.flags.docked);
const redundant = api.act({ name: 'undock', args: {} });
pin('same-frame redundant undock answers ok, not no-service',
  redundant.ok === true && redundant.token === '' && redundant.error === '', redundant);
tick(1); // one frame: the queued 'undocked' lands in lastEvents for consumers
pin('next observation agrees: docked=false',
  ctx.flags.docked === false
  && ctx.lastEvents.some((ev) => ev && ev.type === 'undocked'), ctx.flags.docked);
tick(1); // settle one more frame before the next fixture dock

// --- 2: mirrored order — undock first, launch service second, same frame.
dockFrom();
const flewUndock = api.act({ name: 'undock', args: {} });
pin('undock answers ok', flewUndock.ok === true && flewUndock.token === '', flewUndock);
pin('undock undocked the hull', ctx.flags.docked === false, ctx.flags.docked);
const mirrored = api.act({ name: 'openService', args: { id: 'launch' } });
pin('same-frame redundant openService launch answers ok',
  mirrored.ok === true && mirrored.token === '' && mirrored.error === '', mirrored);
tick(1);
pin('mirrored next observation agrees: docked=false',
  ctx.flags.docked === false
  && ctx.lastEvents.some((ev) => ev && ev.type === 'undocked'), ctx.flags.docked);
tick(1);

// --- 3: a stale departure refuses again — no blanket no-op.
dockFrom();
const first = api.act({ name: 'undock', args: {} });
pin('stale case: first undock flies', first.ok === true && ctx.flags.docked === false, first);
tick(2); // flush ctx.events: the departure is no longer in flight
const stale = api.act({ name: 'undock', args: {} });
pin('stale departure refuses no-service',
  stale.ok === false && stale.token === 'no-service', stale);
pin('stale refusal leaves the hull flying (the world keeps its state)',
  ctx.flags.docked === false, ctx.flags.docked);

// --- 5: non-launch services keep the flying-state refusal.
const market = api.act({ name: 'openService', args: { id: 'market' } });
pin('flying openService market still refuses no-service',
  market.ok === false && market.token === 'no-service', market);

process.exit(fails === 0 ? 0 : 1);
