/** #168 stage obstacle regression through the real asteroid/helm/ship owners.
 * node --import ./scripts/with-css-stub.mjs scripts/issue-168-stage-obstacles-test.mjs
 */
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
const diagnostic = process.env.STAGE_DIAG ? await import(pathToFileURL(resolve(runtimeRoot, 'src/game/dock-cruise.js')).href + '?passive-diagnostic') : null;
const holdDiagnostics = [];
const diagBodies = { items: [], count: 0 }, diagPlanning = { items: [], count: 0 };
function captureHold() {
  if (!diagnostic || ctx.autopilot?.phase !== 'stage') return;
  collectBodies(ctx, diagBodies); appendSunBody(ctx, diagBodies);
  diagnostic.collectDockCruiseBodies(diagBodies, ctx.ships, Math.max(ctx.ship.speed,ctx.config.ship.creep),
    ctx.config.ship.acceleration, diagPlanning, ctx.asteroids.list, ctx.world.time, true);
  const forward = new THREE.Vector3(0,0,-1).applyQuaternion(ctx.ship.object.quaternion);
  const test = items => diagnostic.dockHoldCanAdvance(ctx.ship.object.position,ctx.ship.velocity,forward,
    ctx.config.ship.acceleration,ctx.config.ship.creep*(ctx.bio?.speedFactor??1),ctx.config.ship.damping,{items,count:items.length});
  const all = diagPlanning.items.slice(0,diagPlanning.count);
  const threat = all.find(b=>b.kind==='cruise-obstacle'&&b.id===48);
  if (!threat) return;
  holdDiagnostics.push({t:ctx.world.time,p:ctx.ship.object.position.toArray(),v:ctx.ship.velocity.toArray(),q:ctx.ship.object.quaternion.toArray(),
    forward:forward.toArray(),idle:ctx.autopilot.idle,fullStop:ctx.input.fullStop,all:test(all),alone:test([threat]),
    blockers:test([threat])?all.filter(b=>b!==threat&&!test([threat,b])).map(b=>({id:b.id,kind:b.kind})):[],threat:{...threat}});
}

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
    for (const [name, system] of systems) { if (name === 'autopilot') captureHold(); system.update?.(DT); }
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
assert.ok(nav.travelTo('veridian', 'stage obstacle setup'));
const asteroidOwner = systems.find(([name]) => name === 'asteroids')[1];

// Verify that this is the real moving asteroid from the independent rendered
// impact, not a synthetic sphere with a test-only velocity property.
ctx.world.time = 49.86329999995292;
asteroidOwner.update(0);
const rock = ctx.asteroids.list[2];
assert.equal(rock.id, 2);
const recordedRock = new THREE.Vector3(-300.71721229920485, 25.80231819473218, -633.1507513755353);
assert.ok(rock.position.distanceTo(recordedRock) < 1e-6, 'real orbit matches recorded asteroid 2');
assert.ok(Math.abs(rock.radius - 2.7193060560051037) < 1e-9);

// The default is the actual t=48.860 recorded position/speed, with heading
// estimated from its preceding sample because the original trace omitted q/v.
// Later fresh-AP cold starts remain explicit failing diagnostic modes. They
// omit the original motion/tangent history and are not continuous-flow claims.
const caseName = process.env.STAGE_CASE || 'earliest';
assert.ok(['earliest','earlier','late'].includes(caseName), 'known stage fixture');
const earliest = caseName === 'earliest';
const earlier = caseName === 'earlier' || earliest;
const leadTime = earlier ? 0 : 0.25;
const startTime = earliest ? 48.86000000000056 : earlier ? 49.36289999997673 : 49.86329999995292 - leadTime;
ctx.world.time = startTime;
asteroidOwner.update(0);
const recordedPlayer = earliest ? new THREE.Vector3(-249.90618846734532, 22.318900890719572, -637.5886657657741)
  : earlier ? new THREE.Vector3(-264.7044129693938, 23.496568338426165, -639.1682517714866)
  : new THREE.Vector3(-279.3545371889788, 25.590539622213523, -637.7388260224202);
const recordedSpeed = earliest ? 29.648080408664473 : earlier ? 29.80414213438594 : 29.747568027461554;
const direction = recordedPlayer.clone()
  .sub(earliest ? new THREE.Vector3(-235.63938888388992, 22.140603764931974, -633.0432711465635)
    : earlier ? new THREE.Vector3(-249.90618846734532, 22.318900890719572, -637.5886657657741)
    : new THREE.Vector3(-264.7044129693938, 23.496568338426165, -639.1682517714866)).normalize();
ctx.ship.object.position.copy(recordedPlayer).addScaledVector(direction, -recordedSpeed * leadTime);
ctx.ship.object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
ctx.ship.velocity.copy(direction).multiplyScalar(recordedSpeed);
ctx.ship.speed = ctx.ship.velocity.length();
ctx.input.throttle = 0; ctx.input.fullStop = false;
ctx.flags.docked = false; ctx.station.inZone = false;
events.length = 0; collisions.length = 0; ctx.events = []; ctx.lastEvents = [];
const fixture = { caseName, trajectoryAuthority:'real asteroid and player owners after labeled initial reconstruction; no injected helm history',startTime, leadTime, position: ctx.ship.object.position.toArray(), velocity: ctx.ship.velocity.toArray(),
  quaternion: ctx.ship.object.quaternion.toArray(), rock: { id: rock.id, position: rock.position.toArray(), radius: rock.radius },
  trafficCount: ctx.ships.length, asteroidCount: ctx.asteroids.list.length };
const receipt = window.rimward.act({ v: 2, name: 'approachDock', args: {} });
assert.equal(receipt.ok, true, JSON.stringify(receipt));
assert.equal(ctx.autopilot.phase, 'stage', 'obstacle protection must cover the stage leg');
const phases = new Set();
const samples = [];
let minRockClearance = Infinity;
let rockTravel = 0;
let lastRock = rock.position.clone();
for (let i = 0; i < 60 * 90 && !ctx.flags.docked && ctx.autopilot.engaged; i++) {
  tick();
  phases.add(ctx.autopilot.phase);
  rockTravel += rock.position.distanceTo(lastRock); lastRock.copy(rock.position);
  minRockClearance = Math.min(minRockClearance, ctx.ship.object.position.distanceTo(rock.position) - rock.radius - 2.4);
  if (i % 15 === 0 || events.some(e => e.type === 'bodyHit')) samples.push({ t: ctx.world.time,
    p: ctx.ship.object.position.toArray(), v: ctx.ship.velocity.toArray(), q: ctx.ship.object.quaternion.toArray(),
    phase: ctx.autopilot.phase, idle: ctx.autopilot.idle, speed: ctx.ship.speed,
    rock: rock.position.toArray(), clearance: ctx.ship.object.position.distanceTo(rock.position) - rock.radius - 2.4 });
}
const evidence = { artifact, fixture, receipt, docked: ctx.flags.docked, elapsed: ctx.world.time - startTime,
  phases: [...phases], minRockClearance, rockTravel, events, collisions, samples, holdDiagnostics, ap: ctx.autopilot };
const out = resolve(process.env.STAGE_OUT || 'out/issue-168-stage');
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'result.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log('STAGE_RESULT', JSON.stringify({ ...evidence, samples: undefined, holdDiagnostics: undefined }));
assert.equal(events.some(e => ['bodyHit', 'sunHeat', 'playerDestroyed'].includes(e.type)), false,
  'stage transit must avoid real hull contact and damage');
assert.ok(rockTravel > 20, 'real asteroid owner must move the crossing rock');
assert.equal(ctx.flags.docked, true, 'stage avoidance must complete the journey rather than stall');
assert.ok(minRockClearance > 0, 'recorded asteroid stays clear of the actual player hull');
console.log('PASS #168 real-ship stage detour avoids recorded moving asteroid 2 and reaches berth');
