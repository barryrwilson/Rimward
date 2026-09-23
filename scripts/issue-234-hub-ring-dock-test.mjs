/**
 * Issue #234 — the dock planner must treat a non-arrival gate ring as solid.
 *
 * The static path planner skips gate bodies so route flight can use their
 * bores. The dock helm made only its own arrival gate solid, so a hub
 * junction ring near the approach stayed invisible to it. Two authored
 * arrivals pass one: Redmarch from Veridian and Hollow Reach from Redmarch.
 * A natural Rim Drifter run clipped the Hollow Reach hub at 114 u/s under the
 * dock cruise helm (40 damage, two `impact` cancellations), and a headless
 * census recorded 11 hub-ring contacts on the pre-fix code.
 *
 * Real boot, real starter light hull, real route + queued approachDock, real
 * physics and collision owners. One disclosed fixture: live traffic in the
 * destination system is removed every frame so each leg isolates ring
 * geometry from traffic. No teleport, no clock or damage change.
 *
 * Negative control: on the pre-fix autopilot the Redmarch leg touches the hub
 * ring at about 23.7 u/s for every seed tried (1-6). Hollow Reach's clear-lane
 * path clears the tube on both versions; there the census and the live run
 * show traffic detours are what push the hull into the ring.
 *
 * Usage: node --import ./scripts/with-css-stub.mjs scripts/issue-234-hub-ring-dock-test.mjs
 * Env: ISSUE234_SEED (default 7).
 */
import assert from 'node:assert/strict';
import { installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

let seed = Number(process.env.ISSUE234_SEED || 7) >>> 0;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { SYSTEMS, removeLiveShip } = binds;
const { PHY } = await import('../src/game/physics.js');

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
for (const node of dom.walkDom(document.body)) {
  if (node.dataset?.titleAction === 'new') { node.click(); break; }
}
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
ctx.agent.optIn = true;
const act = (name, args = {}) => globalThis.window.rimward.act({ v: 2, name, args });

/** Hull-centre distance to the ring tube surface, the torusOverlap geometry. */
function tubeClearance(p, at) {
  const len = Math.hypot(at[0], at[1], at[2]);
  const ax = -at[0] / len, ay = -at[1] / len, az = -at[2] / len;
  const qx = p.x - at[0], qy = p.y - at[1], qz = p.z - at[2];
  const axial = qx * ax + qy * ay + qz * az;
  const radial = Math.hypot(qx - ax * axial, qy - ay * axial, qz - az * axial);
  return Math.hypot(radial - PHY.GATE_BORE, axial) - PHY.GATE_TUBE;
}

function flyLeg(dest) {
  const hub = SYSTEMS[dest].hub;
  assert.ok(hub?.routes?.length && hub.position, `${dest} still has a hub junction ring`);
  if (ctx.flags.docked) { act('undock'); tick(60); }
  assert.equal(act('plotRoute', { dest }).ok, true);
  assert.equal(act('engageAutopilot').ok, true);
  assert.equal(act('approachDock').status, 'queued');

  const gateHits = [];
  const cancels = [];
  const phases = new Set();
  let minHub = Infinity;
  let minTube = Infinity;
  let arrived = false;
  for (let f = 0; f < 300 * 60 && !ctx.flags.docked; f++) {
    tick(1);
    if (ctx.world.currentSystem !== dest) continue;
    arrived = true;
    for (const live of ctx.ships.slice()) removeLiveShip(ctx, live);
    ctx.ships.length = 0;
    if (ctx.gate.jumping) continue;
    for (const e of ctx.lastEvents) {
      if (e.type === 'bodyHit' && e.kind === 'gate') gateHits.push({ t: +ctx.world.time.toFixed(2), speed: e.speed });
    }
    const ap = ctx.autopilot;
    if (ap.mode === 'dock' && ap.phase) phases.add(ap.phase);
    if (ap.phase === 'failed') {
      cancels.push(ap.reason);
      break;
    }
    const p = ctx.ship.object.position;
    const h = hub.position;
    minHub = Math.min(minHub, Math.hypot(p.x - h[0], p.y - h[1], p.z - h[2]));
    minTube = Math.min(minTube, tubeClearance(p, h));
  }
  const result = {
    dest, arrived, docked: ctx.flags.docked === true, station: ctx.station?.name ?? null,
    phases: [...phases], gateHits, cancels,
    minHubCentre: +minHub.toFixed(1), minTubeClearance: +minTube.toFixed(1), hullRadius: PHY.PLAYER_RADIUS,
  };
  console.log('ISSUE234 HUB RING', JSON.stringify(result));
  assert.equal(arrived, true, `the route reached ${dest}`);
  assert.deepEqual(gateHits, [], `${dest}: the dock helm never touches a gate or hub ring`);
  assert.deepEqual(cancels, [], `${dest}: the approach is not cancelled`);
  assert.ok(minTube > PHY.PLAYER_RADIUS, `${dest}: the hull clears the hub ring tube (${minTube.toFixed(1)}u)`);
  assert.equal(result.docked, true, `${dest}: the queued approach reaches the berth`);
  assert.equal(result.station, SYSTEMS[dest].station.name);
}

// Freehold Greenhand start: the first route arrives in Redmarch from Veridian,
// the second arrives in Hollow Reach from Redmarch.
flyLeg('redmarch');
flyLeg('hollowreach');
console.log('ISSUE234 HUB RING PASS');
process.exit(0);
