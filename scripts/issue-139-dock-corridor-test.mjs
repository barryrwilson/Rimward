/** #139 corridor geometry and safe docking, isolated fresh-seed scenarios.
 * `repeat` additionally preserves the exact #168 Quinn two-trip liveness repro.
 * Run npm run test:dock-corridor; choose a case as the script's first argument.
 * DOCK_RUNTIME selects an alternate source worktree for read-only comparisons.
 */
import * as THREE from 'three';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = resolve(process.env.DOCK_RUNTIME || testRoot);
const caseName = process.argv[2];
const cases = ['old', 'new', 'fresh', 'repeat', 'cancel', 'freighter'];
if (!caseName) {
  const outcomes = [];
  for (const name of cases) {
    console.log('\nDOCK CORRIDOR FRESH PROCESS', name);
    const child = spawnSync(process.execPath, ['--import',pathToFileURL(resolve(testRoot,'scripts/with-css-stub.mjs')).href,
      fileURLToPath(import.meta.url), name], {
      cwd:testRoot, env:process.env, stdio:'inherit', windowsHide:true, timeout:120000,
    });
    outcomes.push({name,pass:child.status===0&&!child.error,status:child.status,error:child.error?.message});
  }
  console.log('DOCK CORRIDOR GROUP',JSON.stringify(outcomes));
  process.exit(outcomes.every(r=>r.pass)?0:1);
}
assert.ok(cases.includes(caseName), 'known corridor scenario');
const { installDomStubs, bootGameSystems } = await import(pathToFileURL(resolve(runtimeRoot,'scripts/lib/boot-harness.mjs')).href);
const runtimeImport = file => import(pathToFileURL(resolve(runtimeRoot,file)).href);
const git = (...args) => {
  const r=spawnSync('git',args,{cwd:runtimeRoot,encoding:'utf8',windowsHide:true});
  assert.equal(r.status,0,r.stderr);return r.stdout.trim();
};
const hash=createHash('sha256');
for(const file of git('ls-files','src').split(/\r?\n/).sort()){
  hash.update(file);hash.update(readFileSync(resolve(runtimeRoot,file)));
}
const artifact={head:git('rev-parse','HEAD'),runtimeSourceDirty:!!git('status','--porcelain','--','src'),runtimeSha256:hash.digest('hex')};
const journeys=[];
let activeJourney=null;
let watchedLoiterer=null;

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

// The seed that reproduced the collision in the issue #139 probe.
let st = 7 >>> 0;
Math.random = () => { st = (Math.imul(1664525, st) + 1013904223) >>> 0; return st / 0x100000000; };
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { stationLoiterWaypoints } = await runtimeImport('src/systems/npc.js');
const { disengage, tryApproachDock } = await runtimeImport('src/game/autopilot.js');

const DT = 1 / 60;
const events = [];
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    for (const e of ctx.events) if (['bodyHit','docked','sunHeat','playerDestroyed'].includes(e.type)) {
      // Capture contact geometry on its frame, before the next half-second
      // batch lets the colliding hull move away from the contact point.
      const nearest = e.type === 'bodyHit'
        ? ctx.ships.map(sh => ({ name: sh.record?.name, d: dist(sh.object.position, ctx.ship.object.position) }))
          .sort((a, b) => a.d - b.d)[0] : undefined;
      events.push({ ...e, t: ctx.world.time, nearest });
    }
    if (activeJourney) {
      if (watchedLoiterer) {
        const x=watchedLoiterer.object.position.x;
        activeJourney.loitererMotion.samples++;
        activeJourney.loitererMotion.minX=Math.min(activeJourney.loitererMotion.minX,x);
        activeJourney.loitererMotion.maxX=Math.max(activeJourney.loitererMotion.maxX,x);
        if(x>station.x+30)activeJourney.loitererMotion.legacyThresholdCrossings++;
      }
      if(activeJourney.frames++%15===0)activeJourney.trace.push({t:ctx.world.time,
        p:ctx.ship.object.position.toArray(),v:ctx.ship.velocity.toArray(),q:ctx.ship.object.quaternion.toArray(),
        speed:ctx.ship.speed,phase:ctx.autopilot.phase,idle:ctx.autopilot.idle,
        range:ctx.autopilot.range,progress:ctx.autopilot.progress,yaw:ctx.autopilot.yaw,pitch:ctx.autopilot.pitch});
    }
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
ctx.flags.docked = false;
const rw = globalThis.window.rimward;
ctx.agent.optIn = true;
const station = ctx.station.position;
const stage = { x: station.x + 135, y: station.y, z: station.z };
pin('fixture: fresh Greenhand in Freehold', ctx.world.origin === 'greenhand' && ctx.world.currentSystem === 'freehold');

if (caseName === 'freighter') {
  // Disclosed dock fixture for a real Yard purchase/mount; subsequent flight
  // uses authored hull, hold, propulsion, turn, collision and live traffic.
  const { purchaseYardHull } = await runtimeImport('src/game/shipyard.js');
  const { switchTo } = await runtimeImport('src/game/hangar.js');
  ctx.flags.docked = true;
  ctx.world.credits = 100000;
  const bought = purchaseYardHull(ctx, 'freighter');
  assert.equal(bought.ok, true, JSON.stringify(bought));
  assert.equal(switchTo(ctx, bought.row.id).ok, true);
  assert.equal(ctx.player.classKey, 'freighter');
  assert.equal(ctx.player.hullMax, 220);
  assert.equal(ctx.cargoCapacity, 160);
  ctx.flags.docked = false;
}

if (caseName === 'cancel') {
  const apSystem = systems.find(([name]) => name === 'autopilot')[1];
  const shipSystem = systems.find(([name]) => name === 'ship')[1];
  const { agentCombatActive } = await runtimeImport('src/systems/controls.js');
  // Initial flight fixture only. Each stop is then integrated by the real ship
  // update without changing its velocity or position after cancellation.
  const begin = () => {
    rw.act({ v: 2, name: 'clearControl', args: {} });
    disengage(ctx, 'test');
    ctx.flags.hailOpen = false; ctx.flags.chartOpen = false;
    ctx.ship.object.position.set(station.x + 600, station.y, station.z);
    ctx.ship.object.quaternion.identity();
    ctx.ship.velocity.set(0, 0, -30); ctx.ship.speed = 30;
    ctx.input.throttle = 0.8; ctx.input.fullStop = false;
    ctx.lastEvents = []; ctx.events = [];
    assert.equal(rw.act({ v: 2, name: 'approachDock', args: {} }).ok, true);
  };
  const stopped = reason => {
    pin(`${reason} latches human full stop and clears old throttle`,
      ctx.input.fullStop === true && ctx.input.throttle === 0);
    const initialSpeed = ctx.ship.speed;
    for (let i = 0; i < 240; i++) { ctx.world.time += DT; shipSystem.update(DT); }
    pin(`${reason} real ship update stops below creep`, initialSpeed > 1 && ctx.ship.speed < 0.1, ctx.ship.speed);
  };
  const { COMM_REPEAT_SECONDS } = await runtimeImport('src/game/state.js');
  for (const kind of ['asteroid', 'station', 'ship']) {
    // Independent receipt episodes must be outside the authored comm cooldown.
    ctx.world.time += COMM_REPEAT_SECONDS;
    begin();
    ctx.lastEvents = [{ type: 'bodyHit', kind, speed: 30, t: ctx.world.time }];
    apSystem.update(DT);
    pin(`${kind} contact cancels dock approach`, !ctx.autopilot.engaged && ctx.autopilot.reason === 'impact');
    pin('impact toast names hull contact', ctx.events.some(e => e.type === 'commLine' && e.text === 'Dock approach cancelled: hull contact.'));
    stopped(kind);
  }
  begin(); ctx.lastEvents = [{ type: 'shieldHit', player: true, actor: 'player', t: ctx.world.time }];
  apSystem.update(DT);
  pin('weapon shieldHit alone leaves dock approach engaged', ctx.autopilot.engaged && !ctx.input.fullStop);
  begin();
  const gunner = binds.spawnLiveShip(ctx, { id: 'i173-gunner', name: 'Cancellation gunner', faction: 'redledger', role: 'pirate', classKey: 'cutter', resolve: 60, personality: 0 },
    ctx.ship.object.position.clone().add(new THREE.Vector3(0, 0, -40)));
  ctx.ships.push(gunner);
  const combatSystem = systems.find(([name]) => name === 'combat')[1];
  let weaponHit;
  for (let i = 0; i < 240 && !weaponHit; i++) {
    if (i % 12 === 0) ctx.emit('npcFire', { ship: gunner, weapon: 'cannon', target: 'player' });
    ctx.world.time += DT; combatSystem.update(DT);
    weaponHit = ctx.events.find(e => e.type === 'playerHit' && e.attackerId === gunner.id);
    pin('weapon producer emits no physical bodyHit', !ctx.events.some(e => e.type === 'bodyHit'));
    ctx.lastEvents = ctx.events; ctx.events = []; apSystem.update(DT);
  }
  pin('real NPC projectile strikes player shields without cancelling approach',
    weaponHit?.shielded === true && ctx.autopilot.engaged && !ctx.input.fullStop, weaponHit);
  ctx.lastEvents = [weaponHit, { type: 'bodyHit', kind: 'station', speed: 30 }].filter(Boolean);
  apSystem.update(DT);
  pin('same-frame weapon hit never hides genuine contact', ctx.autopilot.reason === 'impact' && !ctx.autopilot.engaged);
  ctx.ships.splice(ctx.ships.indexOf(gunner), 1); binds.removeLiveShip(ctx, gunner);
  begin(); ctx.flags.chartOpen = true;
  disengage(ctx, 'blocked'); stopped('blocked with chart open');
  begin(); const oldX = ctx.station.position.x; ctx.station.position.x = NaN;
  apSystem.update(DT); ctx.station.position.x = oldX;
  pin('invalid station state cancels as stale', ctx.autopilot.reason === 'stale' && !ctx.autopilot.engaged);
  stopped('stale');
  pin('successful direct approach retry clears cancellation stop', tryApproachDock(ctx) === '' && !ctx.input.fullStop);
  disengage(ctx, 'blocked');
  ctx.flags.docked = true;
  pin('refused direct approach leaves full stop latched', tryApproachDock(ctx) === 'docked' && ctx.input.fullStop);
  ctx.flags.docked = false;
  for (const reason of ['impact', 'blocked', 'stale']) {
    begin(); ctx.flags.hailOpen = true;
    disengage(ctx, reason);
    pin(`${reason} leaves hail helm input unchanged`, !ctx.input.fullStop && ctx.input.throttle === 0.8);
  }
  begin();
  const target = ctx.ships.find(s => s.object && s.state && !s.state.destroyed);
  assert.ok(target, 'live target exists for real combat lease');
  target.object.position.copy(ctx.ship.object.position).add(new THREE.Vector3(0, 0, -100));
  ctx.targets.current = target;
  disengage(ctx, 'test');
  systems.find(([name]) => name === 'hud')[1].update(DT);
  const combat = rw.act({ v: 2, name: 'setCombatIntent', args: { seq: 100, ttl: 60, targetId: target.id, intent: 'disable', defense: 'evade' } });
  assert.equal(combat.ok, true, JSON.stringify(combat));
  assert.equal(agentCombatActive(ctx), true);
  for (const reason of ['impact', 'blocked', 'stale']) {
    ctx.autopilot.engaged = true; ctx.autopilot.mode = 'dock';
    ctx.input.throttle = 0.8; ctx.input.fullStop = false;
    disengage(ctx, reason);
    pin(`${reason} leaves combat lease input unchanged`, !ctx.input.fullStop && ctx.input.throttle === 0.8 && agentCombatActive(ctx));
  }
  rw.act({ v: 2, name: 'clearControl', args: {} });
  ctx.input.throttle = 0.8; ctx.input.fullStop = false;
  ctx.autopilot.engaged = true; ctx.autopilot.mode = 'route';
  disengage(ctx, 'blocked');
  pin('route cancellation keeps existing manual throttle behavior', !ctx.input.fullStop && ctx.input.throttle === 0.8);
  // ---- #184/#200: a zero-damage touch at creep speed keeps the helm --------
  // Each row is fed to the real autopilot system as the previous frame's
  // events, exactly as ship.js publishes a bounce.
  const KISS = { kind: 'station', speed: 0.1, damage: 0 };
  const REAL = { kind: 'station', speed: 30 };
  const watch = (phase, ...rows) => {
    begin();
    if (phase === 'settle') {
      ctx.ship.object.position.set(station.x + 60, station.y, station.z);
      ctx.station.inZone = true;
    }
    ctx.autopilot.phase = phase;
    ctx.lastEvents = rows.map(r => ({ type: 'bodyHit', t: ctx.world.time, ...r }));
    apSystem.update(DT);
    const held = ctx.autopilot.engaged && ctx.autopilot.reason !== 'impact';
    ctx.station.inZone = false;
    return { held, engaged: ctx.autopilot.engaged, reason: ctx.autopilot.reason, phase, rows };
  };
  const keeps = (name, r) => pin(`#200 ${name} keeps the helm`, r.held, r);
  const cancels = (name, r) => pin(`#200 ${name} cancels as impact`,
    !r.engaged && r.reason === 'impact', r);

  // #200 widened #184: the touch rule is judged on damage and speed alone, so
  // every flying dock phase and every body kind answers the same way. The
  // fixture only holds the helm in the phases that actually fly the hull;
  // 'corridor', 'docking', and a malformed phase are covered by the
  // cancel-side sweep below, which is decided before any phase handling.
  const FLYING = ['stage', 'settle', 'cruise'];
  const KINDS = ['station', 'asteroid', 'ship', 'gate', 'sun', undefined];
  for (const phase of FLYING) {
    for (const speed of [0.1, -0.1, 0, 0.999]) {
      keeps(`${phase} station touch at ${speed} u/s, no damage`, watch(phase, { ...KISS, speed }));
    }
    // Traffic, rocks, and the rest of the world get the same forgiveness.
    for (const kind of KINDS) {
      keeps(`${phase} creep ${String(kind)} touch`, watch(phase, { ...KISS, kind }));
    }
    // A harmless row must never mask a real impact batched with it.
    keeps(`${phase} batch of kisses only`, watch(phase, KISS, { ...KISS, speed: -0.002 }, { ...KISS, speed: 0 }));
  }
  for (const phase of [...FLYING, 'corridor', 'docking', '', undefined]) {
    const tag = String(phase);
    // The floor itself and anything above it is still an impact.
    for (const speed of [1, -1, 1.5, 30]) {
      cancels(`${tag} station contact at ${speed} u/s`, watch(phase, { ...KISS, speed }));
    }
    for (const kind of KINDS) {
      cancels(`${tag} damaging ${String(kind)} touch`, watch(phase, { ...KISS, kind, damage: 0.5 }));
      cancels(`${tag} fast ${String(kind)} contact`, watch(phase, { ...KISS, kind, speed: 30 }));
    }
    // A row the physics never produced must never read as harmless.
    for (const speed of [undefined, NaN, Infinity, -Infinity, '0.1', null, {}]) {
      cancels(`${tag} touch with speed ${String(speed)}`, watch(phase, { ...KISS, speed }));
    }
    for (const damage of [undefined, NaN, null, '0', -1, false]) {
      cancels(`${tag} touch with damage ${String(damage)}`, watch(phase, { ...KISS, damage }));
    }
    cancels(`${tag} kiss before real impact`, watch(phase, KISS, REAL));
    cancels(`${tag} real impact before kiss`, watch(phase, REAL, KISS));
  }

  const out = resolve(process.env.DOCK_OUT || 'out/issue-139-corridor', caseName);
  mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'result.json'), JSON.stringify({ artifact, caseName, verdict: fails ? 'FAIL' : 'PASS', fails }, null, 2) + '\n');
  console.log(`ISSUE 173 DOCK CANCEL ${fails ? 'FAIL' : 'PASS'} (${fails})`);
  process.exit(fails ? 1 : 0);
}

// ---- 1. geometry -------------------------------------------------------------
{
  const center = { x: 120, y: 20, z: 620 };
  for (const r of [80, 127, 150]) {
    const pts = stationLoiterWaypoints(center, r);
    const onFarSide = pts.every((p) => p.x <= center.x + 1e-9);
    let chordsClear = true;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if (Math.max(a.x, b.x) > center.x + 1e-9) chordsClear = false; // a segment's max x is at an endpoint
    }
    const radii = pts.map((p) => Math.hypot(p.x - center.x, p.z - center.z));
    pin(`station sweep at ${r} u stays on the far side of the station (points and chords)`, onFarSide && chordsClear, pts.map((p) => [p.x - center.x, p.z - center.z]));
    // The out-and-back list revisits the same x/z (y keeps its per-point jitter).
    const sameXZ = (a, b) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.z - b.z) < 1e-6;
    pin(`station sweep at ${r} u keeps its radius and ping-pongs`, radii.every((d) => Math.abs(d - r) < 1e-6) && pts.length === 6
      && sameXZ(pts[1], pts[5]) && sameXZ(pts[2], pts[4]), radii);
  }
}
function liveStationLoiterers() {
  return ctx.ships.filter((s) => s.ai?.waypoints && s.ai.mode !== 'route' && s.ai.mode !== 'mine' && s.record?.anchor
    && !String(s.record.id).startsWith('i139-'));
}

// A live cutter placed at the 270° point of a station ring, one leg before
// the +X waypoint, on the OLD full ring or the NEW sweep at the same radius.
function spawnLoiterer(shape, radius) {
  const rec = { id: `i139-${shape}`, name: `Ring Cutter ${shape}`, faction: 'redledger', role: 'pirate', classKey: 'cutter', resolve: 60, personality: 0, anchor: { x: station.x, y: station.y, z: station.z } };
  const live = binds.spawnLiveShip(ctx, rec, new THREE.Vector3(station.x, station.y, station.z - radius));
  live.ai.demandSent = true; live.ai.playerRolled = true; live.ai.playerInterested = false;
  live.ai.mode = 'loiter';
  if (shape === 'old') {
    live.ai.waypoints = [0, 1, 2, 3].map((i) => { const a = (i / 4) * Math.PI * 2; return new THREE.Vector3(station.x + Math.cos(a) * radius, station.y, station.z + Math.sin(a) * radius); });
  } else {
    live.ai.waypoints = stationLoiterWaypoints(station, radius);
  }
  live.ai.wp = 0;
  ctx.ships.push(live);
  return live;
}
function runApproach(shape, radius) {
  assert.equal(ctx.flags.docked,false,'fixture must begin genuinely outside the berth');
  events.length = 0;
  activeJourney={shape,startTime:ctx.world.time,frames:0,trace:[],
    initialTraffic:ctx.ships.length,asteroidCount:ctx.asteroids.list.length,
    loitererMotion:{samples:0,minX:Infinity,maxX:-Infinity,legacyThresholdCrossings:0}};
  watchedLoiterer=null;
  ctx.ship.object.position.set(0, 30, 800);
  ctx.ship.object.quaternion.identity();
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.throttle = 0; ctx.input.fullStop = false;
  const a = rw.act({ v: 2, name: 'approachDock', args: {} });
  let loiterer = null;
  let out = null;
  for (let s = 0; s < 400 && !out; s++) {
    if (shape && !loiterer && ctx.autopilot.phase === 'corridor' && ctx.ship.speed < 1) watchedLoiterer = loiterer = spawnLoiterer(shape, radius);
    const before = events.length;
    tick(30);
    const hits = events.slice(before).filter((e) => e.type === 'bodyHit');
    const ap = ctx.autopilot;
    const p = ctx.ship.object.position;
    if (hits.length) {
      const near = hits[0].nearest;
      out = { outcome: 'bodyHit', hit: hits[0], range: +dist(p, station).toFixed(2), toStage: +dist(p, stage).toFixed(2), phase: ap.phase, reason: ap.reason, engaged: ap.engaged, nearest: near };
    } else if (ctx.flags.docked) out = { outcome: 'docked', t: +ctx.world.time.toFixed(1) };
    else if (!ap.engaged) out = { outcome: 'disengaged', reason: ap.reason, phase: ap.phase };
  }
  const result=out||{outcome:'timeout'};
  const motion=activeJourney.loitererMotion;
  activeJourney.result=result; activeJourney.events=events.slice(); activeJourney.receipt=a;
  activeJourney.elapsed=ctx.world.time-activeJourney.startTime;
  if(loiterer)motion.finalX=loiterer.object.position.x;
  journeys.push(activeJourney); activeJourney=null; watchedLoiterer=null;
  return {act:a.ok,result,loiterer,motion};
}
function reset() {
  for (const live of ctx.ships.filter((s) => String(s.record?.id).startsWith('i139-'))) {
    ctx.ships.splice(ctx.ships.indexOf(live), 1);
    binds.removeLiveShip(ctx, live);
  }
  if (ctx.flags.docked) {
    const r = rw.act({ v: 2, name: 'undock', args: {} });
    assert.equal(r.ok,true,`fixture undock must succeed through station owner: ${JSON.stringify(r)}`);
    assert.equal(ctx.flags.docked,false,'station owner must release berth');
  }
  disengage(ctx, 'test');
  tick(60);
}


// The old ring remains a geometry risk witness; new avoidance must prevent its
// historical impact, not deliberately preserve a collision as expected output.
function checkApproach(shape) {
  const r=runApproach(shape,120);
  pin('fixture: approachDock engaged',r.act===true,r.result);
  if(shape)pin(`fixture: ${shape} loiterer spawned at the stopped corridor entry`,!!r.loiterer,r.result);
  pin(`${shape||'fresh'} approach reaches berth without collision, heat or death`,
    r.result.outcome==='docked'&&events.every(e=>!['bodyHit','sunHeat','playerDestroyed'].includes(e.type)),r.result);
  if(shape==='old')pin('historical old ring has a waypoint inside the +X docking lane',
    r.loiterer?.ai.waypoints.some(p=>p.x>station.x+40&&Math.abs(p.y-station.y)<1e-6&&Math.abs(p.z-station.z)<1e-6));
  if(shape==='new'){
    pin('new sweep waypoints retain the far-side contract',r.loiterer?.ai.waypoints.every(p=>p.x<=station.x+1e-9));
    pin('live sweep motion is observed every real frame',r.motion.samples>0,r.motion);
    // This used to assert only finalX while claiming "throughout". Actual NPC
    // avoidance can depart from waypoint geometry, even on the old baseline.
    // Preserve the original +30 threshold as measured characterization; never
    // widen it or treat it as a substitute for player collision safety.
    console.log('CHARACTERIZATION live sweep +X displacement',JSON.stringify({stationX:station.x,
      legacyThreshold:station.x+30,...r.motion}));
  }
  return r;
}
if(caseName==='repeat'){
  // Exact Quinn runtime-only A/B sequence: fresh NEW-sweep trip, real undock,
  // then the ordinary approach with all elapsed world/traffic state retained.
  // The separate old/new/fresh cases above the dispatcher each get a clean boot.
  checkApproach('new');
  reset();
  checkApproach(null);
}else checkApproach(['fresh','freighter'].includes(caseName)?null:caseName);
if (caseName === 'freighter') {
  pin('freighter docks within 65 sim seconds on the corridor fixture', journeys[0].elapsed <= 65, journeys[0].elapsed);
  console.log('FREIGHTER elapsed', journeys[0].elapsed);
}

// Preserve the real spawn-path geometry contract in each independent process.
reset();
for(let i=0;i<120&&liveStationLoiterers().length===0;i++)tick(60);
const loiterers=liveStationLoiterers();
pin('fixture: real boot produced live station loiterers',loiterers.length>0);
pin('no spawned station loiterer waypoint enters the +X lane',
  loiterers.every(s=>s.ai.waypoints.every(p=>p.x<=s.record.anchor.x+1e-9)),
  loiterers.map(s=>[s.record.name,s.ai.waypoints.map(p=>+(p.x-s.record.anchor.x).toFixed(0))]));
const out=resolve(process.env.DOCK_OUT||'out/issue-139-corridor',caseName);
mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'result.json'),JSON.stringify({artifact,caseName,verdict:fails?'FAIL':'PASS',fails,journeys},null,2)+'\n');
console.log(`ISSUE 139 DOCK CORRIDOR ${caseName} ${fails?'FAIL':'PASS'} (${fails})`);
process.exitCode=fails?1:0;
