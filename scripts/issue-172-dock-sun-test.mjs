import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { SYSTEMS } from '../src/game/state.js';
import { keepRadius, sphereChordHit } from '../src/game/ap-path.js';
import { PHY } from '../src/game/physics.js';
import { dockApproachPoints } from '../src/game/dock-approach.js';
import { appendSunBody } from '../src/systems/npc.js';
import { installDomStubs, bootGameSystems, makeNavHelpers } from './lib/boot-harness.mjs';

const cases = ['veridian', 'freehold', 'redmarch'].flatMap(id =>
  SYSTEMS[id].gates.map((gate, index) => ({ id, index, from: gate.to })));
if (!process.argv[2]) {
  // Exercise the private predicate without adding a production debug export.
  // Use its actual source and real planner geometry, not a mirrored predicate.
  // Coupled deliberately to this signature and column-zero closing brace;
  // update extraction alongside a rename/reformat. Missing matches fail loud.
  const source = readFileSync(new URL('../src/game/autopilot.js', import.meta.url), 'utf8');
  const predicate = source.match(/function bodyBlocksStageChord\(p, stage, kind\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(predicate, 'private stage-chord predicate located');
  const bodies = { items: [], count: 0 };
  const blocks = new Function('_apBodies', 'keepRadius', 'sphereChordHit', 'PHY',
    `${predicate}; return bodyBlocksStageChord;`)(bodies, keepRadius, sphereChordHit, PHY);
  const p = { x: -200, y: 0, z: 0 }, goal = { x: 200, y: 0, z: 0 };
  const sun = { kind: 'sun', x: 0, y: 0, z: 0, r: 50 };
  bodies.items = [{ kind: 'station', x: 0, y: 500, z: 0, r: 20 }, sun]; bodies.count = 2;
  assert.equal(blocks(p, goal), true, 'station miss must not hide a later sun');
  bodies.items = [{ ...sun, r: 0 }, sun];
  assert.equal(blocks(p, goal, 'sun'), true, 'invalid first keep must not hide a later blocker');
  bodies.items = [{ ...sun, y: 500 }, sun];
  assert.equal(blocks(p, goal, 'sun'), true, 'first same-kind miss must not hide a later blocker');
  bodies.items = [{ ...sun, kind: 'future-keep-body' }]; bodies.count = 1;
  assert.equal(blocks(p, goal), true, 'every planner keep-out kind blocks the stage chord');
  bodies.items = [{ ...sun, y: 500 }];
  assert.equal(blocks(p, goal), false, 'clear chord stays direct');
  const escapeStart = { x: -190, y: 0, z: 0 };
  const station = { kind: 'station', x: -200, y: 0, z: 0, r: 20 };
  bodies.items = [station]; bodies.count = 1;
  assert.equal(blocks(escapeStart, goal), false, 'outward station escape remains exempt without a kind filter');
  bodies.items = [station, sun]; bodies.count = 2;
  assert.equal(blocks(escapeStart, goal), true, 'station escape must not hide a later blocking sun');
  console.log('PASS issue172 stage chord scans all valid planner bodies');
  for (const row of cases) {
    const run = spawnSync(process.execPath, ['--import', './scripts/with-css-stub.mjs',
      fileURLToPath(import.meta.url), row.id, String(row.index)],
    { stdio: 'inherit', windowsHide: true, timeout: 120000 });
    assert.equal(run.error, undefined, `${row.id}/${row.from}: ${run.error}`);
    assert.equal(run.status, 0, `${row.id}/${row.from} failed`);
  }
  console.log(`PASS issue172 all ${cases.length} authored gate approaches`);
} else {
  const id = process.argv[2], index = Number(process.argv[3]);
  const gate = SYSTEMS[id].gates[index];
  let seed = 7;
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const dom = installDomStubs();
  const { ctx, systems, binds } = await bootGameSystems();
  let approaching = false;
  let sunHeat = 0, berthEvents = 0, minSunRange = Infinity;
  function tick(n = 1) {
    for (let i = 0; i < n; i++) {
    ctx.world.time += 1 / 60; ctx.elapsed += 1 / 60;
    for (const [name, sys] of systems) {
      if (approaching && ['traffic', 'npc'].includes(name)) continue;
      sys.update?.(1 / 60);
    }
    for (const event of ctx.events) {
      if (event.type === 'sunHeat') sunHeat++;
      if (event.type === 'docked') berthEvents++;
      if (event.type === 'bodyHit') console.log('BODYHIT', JSON.stringify(event));
    }
    minSunRange = Math.min(minSunRange, ctx.ship.object.position.distanceTo(ctx.config.world.sunPosition));
    ctx.lastEvents = ctx.events; ctx.events = [];
    }
  }
  for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
  dom.dispatchKey('Digit1'); ctx.flags.paused = false;
  tick(30);
  const nav = makeNavHelpers({ ctx, SYSTEMS, tick, dispatchKey: dom.dispatchKey,
    onRouteError: message => { throw Error(message); } });
  assert.ok(nav.travelTo(gate.to, 'issue172 origin'));
  assert.ok(nav.travelTo(id, 'issue172 authored gate arrival'));
  // Use the real jump arrival pose from each authored gate. Isolate solar
  // navigation from stochastic NPC contact (#173/#184); retain asteroids,
  // solar damage, real ship flight, station collision and the real berth.
  for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
  ctx.ships.length = 0;
  approaching = true;
  // Start each approach at rest, facing the station stage. Arrival-turn
  // clearance at gate rings is a separate route/jump concern.
  const stage = dockApproachPoints(ctx.station.position).stage;
  const heading = new THREE.Vector3(stage.x, stage.y, stage.z)
    .sub(ctx.ship.object.position).normalize();
  ctx.ship.object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), heading);
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.throttle = 0; ctx.input.fullStop = false;
  ctx.agent.optIn = true;
  sunHeat = 0; berthEvents = 0; minSunRange = Infinity;
  const sunBodies = { items: [], count: 0 };
  appendSunBody(ctx, sunBodies);
  assert.equal(sunBodies.count, 1, `${id} must provide its real solar keep-out body`);
  const sunBody = sunBodies.items[0];
  const solarKeep = keepRadius(sunBody, PHY.PLAYER_RADIUS);
  const position = ctx.ship.object.position;
  const initialSolarChordBlocked = sphereChordHit(position.x, position.y, position.z,
    stage.x, stage.y, stage.z, sunBody.x, sunBody.y, sunBody.z, solarKeep).hit;
  // This named regression must exercise a solar detour, even if future
  // authored geometry changes. Other gates intentionally cover clear chords.
  if (id === 'veridian' && gate.to === 'freehold') {
    assert.equal(initialSolarChordBlocked, true, 'Veridian from Freehold must start with a solar-obstructed stage chord');
  }
  assert.equal(ctx.flags.docked, false);
  assert.equal(window.rimward.act({ v: 2, name: 'approachDock', args: {} }).ok, true);
  let frames = 0;
  for (; frames < 60 * 240 && !ctx.flags.docked && ctx.autopilot.engaged; frames++) tick();
  console.log('ISSUE172', JSON.stringify({ id, from: gate.to, gate: gate.position,
    seconds: frames / 60, sunHeat, berthEvents, minSunRange, solarKeep,
    initialSolarChordBlocked, docked: ctx.flags.docked,
    phase: ctx.autopilot.phase, reason: ctx.autopilot.reason }));
  assert.equal(sunHeat, 0, `${id}/${gate.to} encountered solar heat`);
  // Numeric epsilon only (far below a ship radius or one flight step), not
  // permission to cut the planner's padded keep sphere during integration.
  assert.ok(minSunRange >= solarKeep - 1e-6,
    `${id}/${gate.to} breached solar keep: ${minSunRange} < ${solarKeep}`);
  assert.equal(ctx.flags.docked, true, `${id}/${gate.to} did not reach berth`);
  assert.equal(berthEvents, 1, `${id}/${gate.to} missing real berth event`);
}
