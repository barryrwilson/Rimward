/** #168 hybrid detour watchdog regression; see docs/Issue168DetourProgressEvidence.md. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as THREE from 'three';
const runtimeRoot = resolve(process.env.STAGE_RUNTIME || fileURLToPath(new URL('..', import.meta.url)));
const { installDomStubs, bootGameSystems, makeNavHelpers } =
  await import(pathToFileURL(resolve(runtimeRoot, 'scripts/lib/boot-harness.mjs')).href);
const { collectBodies } = await import(pathToFileURL(resolve(runtimeRoot, 'src/game/collision.js')).href);
const git = (...args) => {
  const run = spawnSync('git', args, { cwd: runtimeRoot, encoding: 'utf8', windowsHide: true });
  assert.equal(run.status, 0, `git ${args.join(' ')}: ${run.stderr}`);
  return run.stdout.trim();
};
const hash = createHash('sha256');
for (const file of git('ls-files', 'src').split(/\r?\n/).sort()) {
  hash.update(file); hash.update(readFileSync(resolve(runtimeRoot, file)));
}
const artifact = { head: git('rev-parse', 'HEAD'), runtimeSourceDirty: !!git('status', '--porcelain', '--', 'src'),
  runtimeSha256: hash.digest('hex') };

let seed = 7;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { appendSunBody } = await import(pathToFileURL(resolve(runtimeRoot, 'src/systems/npc.js')).href);
const DT = 1 / 60;
const events = [];
const collisions = [];
const bodies = { items: [], count: 0 };
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, system] of systems) system.update?.(DT);
    events.push(...ctx.events.filter(e => ['bodyHit', 'sunHeat', 'docked', 'playerDestroyed'].includes(e.type)));
    for (const event of ctx.events) if (event.type === 'bodyHit') {
      collectBodies(ctx, bodies);
      const nearest = bodies.items.slice(0, bodies.count).filter(b => b.kind === event.kind)
        .map(b => ({ id:b.id,kind:b.kind,p:[b.x,b.y,b.z],r:b.r,
          clearance:ctx.ship.object.position.distanceTo(new THREE.Vector3(b.x,b.y,b.z))-b.r-2.4 }))
        .sort((a,b) => a.clearance-b.clearance).slice(0,3);
      collisions.push({ event,player:ctx.ship.object.position.toArray(),nearest });
    }
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1'); ctx.flags.paused = false; tick(30);
ctx.agent.optIn = true;
const nav = makeNavHelpers({ ctx, SYSTEMS: binds.SYSTEMS, tick, dispatchKey: dom.dispatchKey,
  onRouteError: message => { throw Error(message); } });
assert.ok(nav.travelTo('veridian', 'detour history setup'));
const asteroidOwner = systems.find(([name]) => name === 'asteroids')[1];



const trace = JSON.parse(readFileSync(new URL('./fixtures/issue-168-detour-trace.json', import.meta.url), 'utf8'));
const points = trace.samples;
const sample = points[0];
ctx.world.time = sample.t;
asteroidOwner.update(0);
ctx.ship.object.position.fromArray(sample.p);
ctx.ship.object.quaternion.fromArray(sample.q);
ctx.ship.velocity.fromArray(sample.v);
ctx.ship.speed = sample.speed;
ctx.input.throttle = 0;
ctx.input.fullStop = false;
ctx.flags.docked = false;
ctx.station.inZone = false;
events.length = 0; collisions.length = 0; ctx.events = []; ctx.lastEvents = [];
const population = { ships: ctx.ships.length, asteroids: ctx.asteroids.list.length };
assert.ok(population.ships > 0 && population.asteroids > 0, 'retain real traffic and asteroid populations');
const receipt = window.rimward.act({ v: 2, name: 'approachDock', args: {} });
assert.equal(receipt.ok, true, JSON.stringify(receipt));
assert.equal(ctx.autopilot.phase, 'stage');

// This first leg tests AP bookkeeping only. Reconstruct recorded p/v/q while
// the actual AP owner builds its own private tangent/watch state. No helm or
// watchdog scratch is injected. NPC state is the intact bootstrap state, not
// the unavailable full saved live world. Asteroids use their real orbit owner.
const autopilotOwner = systems.find(([name]) => name === 'autopilot')[1];
const samples = [];
const startTime = ctx.world.time;
const capture = () => samples.push({ t: ctx.world.time,
  p: ctx.ship.object.position.toArray(), v: ctx.ship.velocity.toArray(),
  q: ctx.ship.object.quaternion.toArray(), ap: { ...ctx.autopilot } });
for (let i = 0; i < points.length - 1 && ctx.autopilot.engaged; i++) {
  const a = points[i], b = points[i + 1];
  const steps = Math.ceil((b.t - a.t) / DT);
  for (let j = 1; j <= steps && ctx.autopilot.engaged; j++) {
    const fraction = j / steps;
    ctx.world.time = a.t + (b.t - a.t) * fraction;
    asteroidOwner.update(0);
    ctx.ship.object.position.fromArray(a.p).lerp(new THREE.Vector3().fromArray(b.p), fraction);
    ctx.ship.object.quaternion.fromArray(a.q).slerp(new THREE.Quaternion().fromArray(b.q), fraction);
    ctx.ship.velocity.fromArray(a.v).lerp(new THREE.Vector3().fromArray(b.v), fraction);
    ctx.ship.speed = ctx.ship.velocity.length();
    autopilotOwner.update((b.t - a.t) / steps);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
  capture();
}

// From this boundary onward, never write a ship pose, helm command, actor, or
// watchdog state: run every real game owner, including collision and docking.
const handoff = ctx.world.time;
assert.equal(handoff, points.at(-1).t, 'reconstruction reaches the recorded handoff');
for (let i = 0; i < 60 * 90 && ctx.autopilot.engaged && !ctx.flags.docked; i++) {
  tick();
  if (i % 15 === 0) capture();
}
const evidence = { artifact, source: { head: trace.sourceHead, runtimeSha256: trace.sourceRuntimeSha256 },
  authority: 'Hybrid: recorded/interpolated p/v/q feeds actual AP owner until handoff; afterward all real ship/NPC/asteroid/collision owners. No full world-save or natural replay claim.',
  population, receipt, startTime, handoff, docked: ctx.flags.docked,
  elapsed: ctx.world.time - startTime, continuationElapsed: ctx.world.time - handoff,
  events, collisions, ap: ctx.autopilot, samples };
const out = resolve(process.env.STAGE_OUT || 'out/issue-168-detour-progress');
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'result.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log('DETOUR_RESULT', JSON.stringify({ ...evidence, samples: undefined }));
assert.equal(events.some(e => ['bodyHit', 'sunHeat', 'playerDestroyed'].includes(e.type)), false,
  'real-owner continuation stays clear of contact, heat and death');
assert.equal(ctx.flags.docked, true, 'safe active station detour must survive the range watchdog and berth');
assert.ok(ctx.world.time - handoff > 1, 'real-owner motion continues beyond the old watchdog cancellation');
console.log('PASS #168 recorded AP history plus real-owner station-detour continuation');
