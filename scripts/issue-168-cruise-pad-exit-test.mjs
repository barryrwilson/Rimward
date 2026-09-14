/** #168 parked-hull padding exit: constructed pose, real player/helm/collision. */
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

const DT = 1 / 60;
const events = [];
const collisions = [];
const bodies = { items: [], count: 0 };
let incoming = null;
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [name, system] of systems) {
      // This named incoming body has a test-owned trajectory. Exclude only
      // its AI/drift/bounce owner; the real player and all other actors run.
      if (incoming && name === 'npc') {
        const ai = incoming.ai; incoming.ai = null;
        try { system.update?.(DT); } finally { incoming.ai = ai; }
      } else system.update?.(DT);
    }
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
assert.ok(nav.travelTo('veridian', 'parked-hull fixture setup'));


const fixture = JSON.parse(readFileSync(new URL('./fixtures/issue-168-cruise-pad-pose.json', import.meta.url), 'utf8'));
const recorded = fixture.player, body = fixture.body;
ctx.world.time = recorded.t;
systems.find(([name]) => name === 'asteroids')[1].update(0);
ctx.ship.object.quaternion.fromArray(recorded.q);
ctx.ship.velocity.fromArray(recorded.v);
ctx.ship.speed = recorded.speed;
ctx.input.throttle = 0; ctx.input.fullStop = false;
ctx.flags.docked = false; ctx.station.inZone = false;
incoming = ctx.ships.find(ship => ship.id === body.id);
assert.ok(incoming, 'preserve the existing rec-22 mesh rather than replacing the population');
incoming.object.position.fromArray(body.p);
incoming.ai.velocity.set(0, 0, 0);
const fixed = incoming.object.position.clone();
events.length = 0; collisions.length = 0; ctx.events = []; ctx.lastEvents = [];
collectBodies(ctx, bodies);
const collider = bodies.items.slice(0, bodies.count).find(b => b.id === incoming.id && b.kind === 'ship');
assert.ok(Math.abs(collider.r - body.r) < 1e-9, 'actual freighter collider matches recorded hull');
const physical = collider.r + 2.4, keep = physical + 12;

// Activate the public cruise owner from a far fixture pose, then construct
// its recorded near-body initial position before any owner update. A fresh
// near-position command would select stage, which is not the observed phase.
// This explicit fixture setup is not a natural flight or saved-world replay.
ctx.ship.object.position.set(0, 50, 900);
const receipt = window.rimward.act({ v: 2, name: 'approachDock', args: {} });
assert.equal(receipt.ok, true, JSON.stringify(receipt));
assert.equal(ctx.autopilot.phase, 'cruise');
ctx.ship.object.position.fromArray(recorded.p);
const start = ctx.world.time;
const population = { ships: ctx.ships.length, asteroids: ctx.asteroids.list.length };
const samples = [];
let minClearance = Infinity, entered = null, exited = null, rangeAtEntry = null;
const range = () => Math.hypot(ctx.ship.object.position.x + 5,
  ctx.ship.object.position.y - 30, ctx.ship.object.position.z + 550);
// After setup, only rec-22 has a test-owned static trajectory. Every player,
// helm, collision and other actor owner runs normally; never correct a pose.
for (let i = 0; i < 60 * 40 && ctx.autopilot.engaged && !ctx.flags.docked; i++) {
  tick();
  const distance = ctx.ship.object.position.distanceTo(fixed);
  minClearance = Math.min(minClearance, distance - physical);
  assert.ok(incoming.object.position.distanceTo(fixed) < 1e-9, 'named parked trajectory stays static');
  if (entered === null && distance < keep) { entered = ctx.world.time; rangeAtEntry = range(); }
  if (entered !== null && exited === null && distance >= keep + 2.4) exited = ctx.world.time;
  if (i % 15 === 0) samples.push({ t: ctx.world.time, p: ctx.ship.object.position.toArray(),
    v: ctx.ship.velocity.toArray(), q: ctx.ship.object.quaternion.toArray(), speed: ctx.ship.speed,
    phase: ctx.autopilot.phase, idle: ctx.autopilot.idle, yaw: ctx.autopilot.yaw,
    gap: distance - physical, range: range() });
  if (exited !== null && rangeAtEntry - range() > 150) break;
}
const evidence = { artifact, fixture, receipt, population,
  authority: 'Constructed initial player pose and frozen rec-22 trajectory; real player/helm/collision and all other actors run. Padding exit plus resumed progress, not berth proof.',
  elapsed: ctx.world.time - start, entered, exited,
  exitSeconds: exited === null ? null : exited - entered,
  minClearance, rangeAtEntry, range: range(), docked: ctx.flags.docked,
  events, collisions, samples, ap: ctx.autopilot };
const out = resolve(process.env.STAGE_OUT || 'out/issue-168-cruise-pad-exit');
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'result.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log('PAD_EXIT_RESULT', JSON.stringify({ ...evidence, samples: undefined }));
assert.equal(events.some(e => ['bodyHit', 'sunHeat', 'playerDestroyed'].includes(e.type)), false,
  'actual owners must preserve clearance and avoid contact, heat and death');
assert.ok(entered !== null, 'fixture exercises the padded hull overlap');
assert.ok(exited !== null && exited - entered < 10, 'exit padded static hull within one ordinary watchdog window');
assert.ok(rangeAtEntry - range() > 150, 'resume meaningful progress toward the actual stage goal');
assert.ok(minClearance > 0, 'physical hull clearance stays positive');
console.log('PASS #168 parked-hull padding exit and resumed real-owner cruise progress');
