/** Issue #61 deterministic ownership and tactical regressions.
 * Synthetic contacts/HUD frames are fixtures, not natural play evidence.
 * The real controls update and public v2 dispatcher apply every request.
 */
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState, U, WEAPONS } from '../src/game/state.js';
import { localDir } from '../src/game/agent-schema.js';
import { losCloseRate } from '../src/game/los-close.js';
import { installDomStubs, seedBootRandom } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';
import { initShip } from '../src/systems/ship.js';
import { initNpc, spawnLiveShip } from '../src/systems/npc.js';
import { readFile } from 'node:fs/promises';
import { configureShipAssetFileReader, primeShipAsset } from '../src/systems/ship-assets.js';
import { hoverTurnRateFor } from '../src/game/flight-feel.js';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

function sourceFingerprint() {
  const hash=createHash('sha256');
  function visit(rel) {
    for(const entry of readdirSync(new URL('../'+rel,import.meta.url),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      const path=rel+entry.name;
      if(entry.isDirectory())visit(path+'/');
      else {hash.update(path+'\0');hash.update(readFileSync(new URL('../'+path,import.meta.url)));hash.update('\0');}
    }
  }
  visit('src/');
  return {src:hash.digest('hex'),test:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
    crossingFixture:createHash('sha256').update(readFileSync(new URL('./lib/issue-61-crossing-public.json',import.meta.url))).digest('hex'),
    fastCrossingFixture:createHash('sha256').update(readFileSync(new URL('./lib/issue-61-fast-crossing-public.json',import.meta.url))).digest('hex'),
    avoidanceFixture:createHash('sha256').update(readFileSync(new URL('./lib/issue-61-avoidance-public.json',import.meta.url))).digest('hex')};
}
const sourceStart=sourceFingerprint();console.log('SOURCE START',JSON.stringify(sourceStart));
process.on('exit',code=>{
  const end=sourceFingerprint();console.log('SOURCE END',JSON.stringify({...end,exitCode:code}));
  if(JSON.stringify({...end,exitCode:undefined})!==JSON.stringify(sourceStart)){console.error('SOURCE CHANGED DURING TEST');process.exitCode=1;}
});

let checks = 0;
function test(name, run) { run(); console.log('PASS', name); checks++; }
function fixture() {
  const dom = installDomStubs(), docEvents = {};
  document.addEventListener = (name, fn) => (docEvents[name] ??= []).push(fn);
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.config.world = {};
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3();
  ctx.ship.speed = 80;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  const target = { id: 'combat-fixture', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  target.object.position.set(0, 0, -300); ctx.ships = [target]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  function sample(extra = {}) {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time, weaponGroup: ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 80, closing: 0,
      bearing: localDir(ctx.ship.object.quaternion, p.x-o.x, p.y-o.y, p.z-o.z), ...extra };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const start = (args = {}) => act('setCombatIntent', { seq: ++seq, ttl: 45, targetId: target.id, intent: 'engage', ...args });
  const status = () => agentControlStatus(ctx);
  const tick = (seconds = 1/60, fresh = true, extra = {}) => {
    ctx.world.time += seconds;
    if (fresh) sample(extra);
    controls.update(seconds);
  };
  const emit = (name, args = {}) => {
    for (const fn of dom.winListeners[name] || []) fn({ preventDefault() {}, ...args });
  };
  return { ctx, target, act, start, status, tick, sample, emit, docEvents, api };
}

test('strict malformed requests cannot replace ownership or poison sequence', () => {
  const f = fixture(); assert.equal(f.start().ok, true); f.tick();
  const before = f.status(), input = { ...f.ctx.input };
  const good = { seq: 2, ttl: 45, targetId: f.target.id, intent: 'engage' };
  for (const args of [null, [], {}, { ...good, ttl: '45' }, { ...good, ttl: Infinity },
    { ...good, ttl: 0.9 }, { ...good, ttl: 61 }, { ...good, seq: 1 },
    { ...good, seq: 1.5 }, { ...good, seq: 1e30 }, { ...good, unknown: true },
    { ...good, intent: 'shootEveryone' }, { ...good, targetId: 2 }, { ...good, targetId: 'missing' }]) {
    assert.equal(f.act('setCombatIntent', args).ok, false, JSON.stringify(args));
    assert.deepEqual({ ...f.status(), expiresIn: before.expiresIn }, before); assert.deepEqual(f.ctx.input, input);
  }
  assert.equal(f.act('setControl', { seq: 1e30, ttl: 1 }).token, 'bad-seq');
  assert.deepEqual({ ...f.status(), expiresIn: before.expiresIn }, before);
  assert.equal(f.start().ok, true); assert.equal(f.status().seq, 2);
});

test('raw and tactical leases share sequence, exclusive helm, and raw max TTL stays five', () => {
  const f = fixture();
  assert.equal(f.act('setControl', { seq: 1, ttl: 5 }).ok, true);
  assert.equal(f.start({seq:2}).token, 'helm');
  f.act('clearControl');
  assert.equal(f.start({seq:2}).ok, true);
  assert.equal(f.act('setControl', { seq: 3, ttl: 5 }).token, 'helm');
  f.act('clearControl');
  assert.equal(f.act('setControl', { seq: 3, ttl: 5.01 }).token, 'bad-ttl');
  assert.equal(f.act('setControl', { seq: 3, ttl: 5 }).ok, true);
  f.tick(5); assert.equal(f.status().state, 'expired');
});

test('explicit 45-second grant remains tactical during 5/15/30-second decision gaps', () => {
  for (const delay of [5, 15, 30]) {
    const f = fixture(); assert.equal(f.start().ok, true);
    for (let n = 0; n < delay*60; n++) {
      // Moving, on-screen contact without private velocity. No action/renewal.
      f.target.object.position.x = Math.sin(n/60) * 15;
      f.tick();
      assert.equal(f.status().owner, 'combat');
      assert.equal(f.ctx.input.fullStop, false); assert(f.ctx.input.throttle > 0);
    }
    assert(Math.abs(f.status().expiresIn - (45-delay)) < 1e-8);
    assert.equal(f.status().seq, 1);
  }
});

test('renewal preserves maneuver and expiry neutralizes immediately; old receipt never revives it', () => {
  const f = fixture(); f.target.object.position.z = -55; f.sample();
  assert.equal(f.start({ttl:2}).ok, true); f.tick();
  assert.equal(f.status().combat.phase, 'reposition');
  f.tick(0.5); const phase = f.status().combat.phase;
  assert.equal(f.start({ttl:1}).ok, true); assert.equal(f.status().combat.phase, phase);
  f.tick(1); assert.equal(f.status().reason, 'expired');
  assert.equal(f.ctx.input.fireHeld, false); assert.equal(f.ctx.input.throttle, 0);
  assert.equal(f.ctx.input.fullStop, true); assert.equal(f.status().owner, 'none');
  assert.equal(f.start({seq:2}).token, 'stale');
  f.act('clearControl'); assert.equal(f.status().reason, 'expired');
  assert.equal(f.status().combat.targetId, f.target.id);
});

test('weapon reach, alignment, heat and current fire output are enforced', () => {
  const f = fixture(); f.start(); f.tick(); assert.equal(f.ctx.input.fireHeld, true);
  f.tick(1/60, true, { bearing: [0.5,0,-Math.sqrt(0.75)] });
  assert.equal(f.ctx.input.fireHeld, false); assert.equal(f.status().combat.fireBlocked, 'alignment');
  f.target.object.position.z = -550; f.tick();
  assert.equal(f.ctx.input.fireHeld, false); assert.equal(f.status().combat.fireBlocked, 'range');
  f.target.object.position.z = -300; f.ctx.player.heat = 95; f.tick();
  assert.equal(f.ctx.input.fireHeld, false); assert.equal(f.status().combat.fireBlocked, 'heat');
  f.ctx.player.heat = 10; f.ctx.player.overheated = true; f.tick(); assert.equal(f.ctx.input.fireHeld, false);
  f.ctx.player.overheated = false; f.tick(); assert.equal(f.ctx.input.fireHeld, true);
  f.ctx.input.weaponGroup = 2; f.tick(); assert.equal(f.status().reason, 'weapon-changed');
  for (const group of [3,4]) { const g=fixture(); g.ctx.input.weaponGroup=group; g.sample(); assert.equal(g.start().token,'weapon'); }
});

test('actual disabled/surrendered/destroyed terminals differ from bargaining and willingness', () => {
  for (const intent of ['engage','disable']) {
    for (const [field,reason] of [['disabled','target-disabled'],['surrendered','target-surrendered'],['destroyed','target-destroyed']]) {
      const f=fixture(); f.start({intent});
      f.target.state.resolve=35; f.tick(); assert.equal(f.status().owner,'combat');
      f.target.state.resolve=0; f.tick(); assert.equal(f.status().owner,'combat');
      f.target.state[field]=true; f.tick(); assert.equal(f.status().reason,reason);
      assert.equal(f.ctx.input.fireHeld,false); assert.equal(f.ctx.input.throttle,0);
    }
  }
});

test('no silent retarget, stale sensing or continued fire after target loss', () => {
  for (const [change,reason] of [
    [f=>{f.ctx.ships=[];f.ctx.targets.current=null;},'target-lost'],
    [f=>{f.ctx.targets.current={...f.target};},'target-changed'],
    [f=>{f.ctx.targets.current=null;},'target-lost'],
    [f=>{f.target.record={};},'target-lost'],
    [f=>{f.ctx.targets.aim.targetId='old';},'target-lost'],
    [f=>{f.ctx.targets.aim.t-=1;},'target-lost'],
    [f=>{f.ctx.targets.aim.bearing=[NaN,0,-1];},'target-lost'],
    [f=>{f.target.object.position.z=-U.TARGET_RANGE-1;},'target-lost'],
  ]) { const f=fixture(); f.start(); f.tick(); change(f); f.tick(1/60,false); assert.equal(f.status().reason,reason); assert.equal(f.ctx.input.fireHeld,false); }
});

test('new weapon authorization waits for that weapon HUD digest without reviving an old lead', () => {
  const f=fixture();f.start();f.tick();f.act('clearControl');
  f.ctx.input.weaponGroup=2;
  assert.equal(f.start().token,'target-lost','previous weapon lead is not authorization');
  assert.equal(f.ctx.input.fireHeld,false);f.sample();
  assert.equal(f.start().ok,true);f.tick();assert.equal(f.status().combat.weaponGroup,2);
});

test('close pass repositions with thrust/strafe and never fires through target center', () => {
  const f=fixture(); f.start(); f.target.object.position.z=-180;
  // Use the real HUD derivative helper: a +Z relative velocity approaches a
  // target on -Z. This must trigger BEFORE the static minimum distance.
  const closing=losCloseRate(f.ctx.ship.object.position,f.target.object.position,{x:0,y:0,z:100});
  assert(closing<0); f.tick(1/60,true,{closing});
  assert.equal(f.status().combat.phase,'reposition'); assert.equal(f.ctx.input.fireHeld,false);
  assert.notEqual(f.ctx.input.strafeX,0); assert(f.ctx.input.throttle>0);
  f.target.object.position.set(0,0,250); f.tick(2.1,true,{closing:30});
  assert.equal(f.status().combat.phase,'intercept'); assert.notEqual(f.ctx.input.steerX,0);
});

test('close-pass clearance uses the visible hull and strafes away from an off-center opponent', () => {
  const f=fixture();f.ctx.ship.speed=0;f.target.object.position.set(30,0,-110);
  f.target.object.userData.proxy={rx:80,ry:20,halfLen:90};f.sample();f.start();f.tick();
  assert.equal(f.status().combat.phase,'reposition');assert(f.ctx.input.strafeX<0);
  assert.equal(f.ctx.input.fireHeld,false);
});

test('egress timeout never opens a firing frame inside hard hull clearance', () => {
  const f=fixture();f.target.object.position.set(0,0,-20);f.sample();f.start();f.tick();
  assert.equal(f.status().combat.phase,'reposition');
  f.tick(3.1);
  assert.equal(f.status().combat.phase,'reposition');assert.equal(f.ctx.input.fireHeld,false);
  f.target.object.position.set(0,0,100);f.tick();
  assert.equal(f.status().combat.phase,'intercept','return starts as soon as actual hull hazard clears');
});

test('measured second frontal pass overrides return cooldown before the late collision threshold', () => {
  const f=fixture();f.ctx.world.time=126.2;
  f.target.object.position.set(0,0,-20);f.sample();f.start();f.tick();
  f.target.object.position.set(0,0,201);f.tick(2.1,true,{closing:112});
  assert.equal(f.status().combat.phase,'intercept','actual egress exit establishes the return cooldown');
  // Public geometry from assisted-close-final-01 on source 62699b8c...:
  // old control stayed in pass through 72u, then impacted at t133.2887.
  // Keep the measured final line of approach fixed in WORLD coordinates.
  // Replaying changing local bearings against a fixed own quaternion would
  // invent transverse world motion as soon as avoidance estimates velocity.
  const line=new THREE.Vector3(.105895,.103165,-.989011).normalize();
  const rows=[
    [131.2906,194.90734,-82.92783],
    [131.5201,171.13645,-102.60728],
    [131.7535,149.81173,-90.78700],
    [131.9761,130.41388,-87.91629],
  ];
  for(const [time,dist,closing] of rows) {
    f.ctx.world.time=time;f.ctx.ship.speed=40.8;
    f.target.object.position.copy(line).multiplyScalar(dist);
    f.tick(1/60,true,{closing,speed:47.9065});
  }
  assert.equal(f.status().combat.phase,'reposition','front corridor must override the still-active six-second cooldown');
  assert.equal(f.ctx.input.fireHeld,false);
  assert(f.ctx.targets.aim.dist>120,'avoidance starts well before the measured 50u late response');
});

test('recorded Gallows aft pursuit does not reverse the return to aim', () => {
  // Public samples from sustained-iab-01/gallows-timeseries.json, frozen
  // source a47b285b62eea741d3b04d4608280180fa9ddbefffdb137537ffa3bb045e2945.
  // Replay the geometry that repeatedly reversed the old return maneuver.
  const rows = [
    [49.2014, 99.8350, -11.8085, 44.7302, -.995633, .020692, .091030],
    [56.2746, 99.8312, -17.8572, 41.8573, -.703102, .359089, .613761],
    [59.6163, 106.8666, -27.9686, 44.7183, -.585517, -.022906, .810336],
    [67.0984, 114.3926, -46.4682, 40.1334, -.573501, .011968, .819118],
  ];
  for (const [time,dist,closing,speed,...bearing] of rows) {
    const f=fixture(); f.ctx.world.time=time; f.ctx.ship.speed=speed;
    f.target.object.position.fromArray(bearing).normalize().multiplyScalar(dist);
    f.sample({closing}); f.start(); f.tick(1/60,true,{closing});
    assert.equal(f.status().combat.phase,'intercept');
    assert(f.ctx.input.steerX<0,'continue leftward turn toward the observed pursuer');
    assert.equal(f.ctx.input.fireHeld,false,'aft target still cannot authorize fire');
  }
});

configureShipAssetFileReader(assetPath=>readFile(new URL(`../public${assetPath}`,import.meta.url)));
await primeShipAsset('independent','cutter','pirate');
function recordedCrossing(file, returnCooldown=false) {
  const random=Math.random;seedBootRandom();
  const f=fixture(),ctx=f.ctx;
  ctx.config.world.shipSpawn=new THREE.Vector3();ctx.config.world.stationPosition=new THREE.Vector3(5000,5000,5000);
  const flight=initShip(ctx);
  // Public natural05 t139.9162 begins inside the 48.97-second no-shot gap.
  // Fly the real player against the same reconstructed world-space path
  // before/after; the recorded target does not react to the new player path.
  Object.assign(f.target,spawnLiveShip(ctx,{id:f.target.id,name:'Measured crossing fixture',classKey:'cutter',faction:'independent',role:'pirate',resolve:25,alwaysHuntsPlayer:true,anchor:{x:0,y:0,z:0}},new THREE.Vector3()));
  const targetVelocity=new THREE.Vector3(),relative=new THREE.Vector3();
  // Public observations expose forward but no roll. Estimate the initial
  // roll from the nose's tangent and lead direction, then parallel-transport
  // the observed forward vectors (the controller commands zero roll).
  // Sampling and unknown initial derivative make this an approximate fixed
  // path, deliberately independent of this test player's subsequent flight.
  const recorded=JSON.parse(readFileSync(new URL('./lib/'+file,import.meta.url))).samples;
  if(returnCooldown) {
    // Establish the real egress -> return transition before placing the
    // measured initial flight state. No collision rule or NPC health changes.
    ctx.world.time=recorded[0].t-3.2;f.target.object.position.set(0,0,-20);
    f.sample();assert.equal(f.start({ttl:45}).ok,true);f.tick();
    f.target.object.position.set(0,0,200);f.tick(2.1,true,{closing:100});
    assert.equal(f.status().combat.phase,'intercept');
  }
  const initialSpeed=recorded[0].shipSpeed??40.8;
  ctx.world.time=recorded[0].t;ctx.ship.velocity.set(0,0,-initialSpeed);ctx.ship.speed=initialSpeed;
  ctx.input.throttle=recorded[0].throttle??.12;
  const nose=new THREE.Vector3(0,0,-1),forward=new THREE.Vector3().fromArray(recorded[0].fwd);
  const orientation=new THREE.Quaternion().setFromUnitVectors(nose,forward);
  const tangent=new THREE.Vector3().fromArray(recorded[1].fwd).sub(forward).projectOnPlane(forward).normalize();
  const initialLead=new THREE.Vector3().fromArray(recorded[0].lead);initialLead.z=0;initialLead.normalize().applyQuaternion(orientation);
  const twist=Math.atan2(forward.dot(initialLead.clone().cross(tangent)),initialLead.dot(tangent));
  orientation.premultiply(new THREE.Quaternion().setFromAxisAngle(forward,twist));
  const initialInverse=orientation.clone().invert(),origin=new THREE.Vector3().fromArray(recorded[0].pos);
  if(returnCooldown) {
    // This return is still sliding out of a turn: a forward-only velocity
    // would invent a different collision path. Use the public position step.
    ctx.ship.velocity.fromArray(recorded[1].pos).sub(origin)
      .divideScalar(recorded[1].t-recorded[0].t).applyQuaternion(initialInverse);
    ctx.ship.speed=ctx.ship.velocity.length();
  }
  const path=recorded.map((row,index)=>{
    const nextForward=new THREE.Vector3().fromArray(row.fwd);
    if(index)orientation.premultiply(new THREE.Quaternion().setFromUnitVectors(forward,nextForward));
    forward.copy(nextForward);
    const point=new THREE.Vector3().fromArray(row.bearing).multiplyScalar(row.range).applyQuaternion(orientation)
      .add(new THREE.Vector3().fromArray(row.pos)).sub(origin).applyQuaternion(initialInverse);
    return {time:row.t-recorded[0].t,point};
  });
  let segment=0;
  const moveTarget=seconds=>{
    while(segment<path.length-2&&path[segment+1].time<seconds)segment++;
    const a=path[segment],b=path[segment+1],dt=b.time-a.time;
    f.target.object.position.lerpVectors(a.point,b.point,(seconds-a.time)/dt);
    targetVelocity.copy(b.point).sub(a.point).divideScalar(dt);
    f.target.object.quaternion.setFromUnitVectors(nose,targetVelocity.clone().normalize());
  };
  moveTarget(0);
  const initialTargetSpeed=targetVelocity.length();
  assert(Math.abs(initialTargetSpeed-(recorded[0].targetSpeed??47.145))<5,'reconstructed initial speed agrees with the public target speed within sampling tolerance');
  assert(path.at(-1).time>=10,'the entire test is covered by recorded observations');
  const sample=()=>{
    const offset=f.target.object.position.clone().sub(ctx.ship.object.position);
    const rel=relative.copy(targetVelocity).sub(ctx.ship.velocity);
    const leadOffset=offset.clone().addScaledVector(rel,offset.length()/WEAPONS.cannon.speed);
    return {speed:targetVelocity.length(),closing:losCloseRate(ctx.ship.object.position,f.target.object.position,rel),
      leadBearing:localDir(ctx.ship.object.quaternion,leadOffset.x,leadOffset.y,leadOffset.z)};
  };
  f.sample(sample());if(!returnCooldown)assert.equal(f.start({ttl:45}).ok,true);
  let firstFire=null,fireFrames=0,minimum=Infinity,firstReposition=null;
  for(let n=0;n<10*60;n++) {
    f.tick(1/60,true,sample());
    if(f.status().combat.phase==='reposition')firstReposition??=n/60;
    if(ctx.input.fireHeld){firstFire??=n/60;fireFrames++;}
    flight.update(1/60);moveTarget((n+1)/60);
    minimum=Math.min(minimum,ctx.ship.object.position.distanceTo(f.target.object.position));
    assert.equal(f.status().owner,'combat');
  }
  Math.random=random;
  const result={file,initialTargetSpeed,firstFire,fireFrames,minimum,firstReposition};
  console.log('Measured crossing aim:',JSON.stringify(result));
  return result;
}

test('ordinary flight converges from the measured creep-speed crossing aim deadband', () => {
  const {firstFire,fireFrames,minimum}=recordedCrossing('issue-61-crossing-public.json');
  assert(firstFire!==null,'converge into the unchanged firing cone within the crossing window');
  assert(fireFrames>=6,'alignment opens a useful firing window');
  assert(minimum>12,'aiming improvement must preserve physical clearance');
});

test('recorded accelerating crossing remains a bounded flight nonregression case', () => {
  const {firstFire,fireFrames,minimum}=recordedCrossing('issue-61-fast-crossing-public.json');
  assert(firstFire!==null,'regain firing alignment during the ten-second fast crossing');
  assert(fireFrames>=6,'fast-contact alignment opens a useful firing window');
  assert(minimum>12,'fast pursuit must retain physical hull clearance');
});

test('recorded controlled return remains a bounded actual-flight nonregression case', () => {
  const {firstFire,fireFrames,minimum}=recordedCrossing('issue-61-avoidance-public.json',true);
  // The reconstructed sliding state is approximate. The new player path can
  // create a real collision, so this does not demand firing before all egress.
  assert(firstFire!==null,'the recorded crossing eventually opens firing alignment');
  assert(fireFrames>=6);assert(minimum>12);
});

function safeWorldCrossing() {
  const f=fixture(),ctx=f.ctx;
  ctx.config.world.shipSpawn=new THREE.Vector3();ctx.config.world.stationPosition=new THREE.Vector3(5000,5000,5000);
  const flight=initShip(ctx);
  f.target.object.position.set(0,0,-20);f.sample();f.start();f.tick();
  f.target.object.position.set(0,0,200);f.tick(2.1,true,{closing:100});
  assert.equal(f.status().combat.phase,'intercept');
  // Initialize settled public aim history outside the corridor and within
  // the real return cooldown. Only the following measured segment flies.
  f.target.object.position.set(15,0,-Math.sqrt(300*300-15*15));
  f.tick(.5,true,{closing:0});
  for(let n=0;n<30;n++)f.tick(1/60,true,{closing:0});
  ctx.ship.velocity.set(-30,0,-68);ctx.ship.speed=ctx.ship.velocity.length();ctx.input.throttle=.5;
  const velocity=new THREE.Vector3(35,0,2),relative=new THREE.Vector3();
  f.target.object.position.set(5,0,-Math.sqrt(100*100-25));
  const sample=()=>{
    const offset=f.target.object.position.clone().sub(ctx.ship.object.position),rel=relative.copy(velocity).sub(ctx.ship.velocity);
    const lead=offset.clone().addScaledVector(rel,offset.length()/WEAPONS.cannon.speed);
    return {speed:velocity.length(),closing:losCloseRate(ctx.ship.object.position,f.target.object.position,rel),
      leadBearing:localDir(ctx.ship.object.quaternion,lead.x,lead.y,lead.z)};
  };
  return {...f,flight,velocity,sampleMotion:sample};
}

test('actual flight keeps firing through a clear world crossing inside the old frontal corridor', () => {
  const f=safeWorldCrossing(),ctx=f.ctx;
  let fireFrames=0,minimumMiss=Infinity;
  for(let n=0;n<18;n++) {
    const r=f.target.object.position.clone().sub(ctx.ship.object.position),v=f.velocity.clone().sub(ctx.ship.velocity);
    const time=Math.max(0,Math.min(2.5,-r.dot(v)/v.lengthSq()));
    minimumMiss=Math.min(minimumMiss,r.addScaledVector(v,time).length());
    f.tick(1/60,true,f.sampleMotion());
    assert.notEqual(f.status().combat.phase,'reposition','clear transverse motion must not be mistaken for a head-on pass');
    if(ctx.input.fireHeld)fireFrames++;
    f.flight.update(1/60);f.target.object.position.addScaledVector(f.velocity,1/60);
  }
  console.log('Clear world crossing:',JSON.stringify({fireFrames,minimumMiss,range:ctx.targets.aim.dist}));
  assert(minimumMiss>40,'the entire measured segment has ample predicted hull clearance');
  assert(fireFrames>=8,'ordinary real flight retains useful firing alignment');
});

test('stale or discontinuous motion falls back safely and current hull clearance outranks the HUD age', () => {
  for(const mode of ['stale','discontinuous','near-hull']) {
    const f=safeWorldCrossing();
    for(let n=0;n<18;n++){f.tick(1/60,true,f.sampleMotion());f.flight.update(1/60);f.target.object.position.addScaledVector(f.velocity,1/60);}
    if(mode==='stale')f.tick(.3,true,f.sampleMotion());
    else {
      const distance=mode==='near-hull'?10:80;
      f.target.object.position.copy(f.ctx.ship.object.position).add(new THREE.Vector3(0,0,-distance).applyQuaternion(f.ctx.ship.object.quaternion));
      f.tick(1/60,mode!=='near-hull',{closing:-100,speed:35});
    }
    assert.equal(f.status().combat.phase,'reposition',mode);
    assert.equal(f.ctx.input.fireHeld,false,mode);
  }
});

test('ordinary flight builds physical turning response while correcting a close off-nose contact', () => {
  const f=fixture(),ctx=f.ctx;
  ctx.config.world.shipSpawn=new THREE.Vector3();ctx.config.world.stationPosition=new THREE.Vector3(5000,5000,5000);
  const flight=initShip(ctx),initialSpeed=40.8;
  ctx.ship.velocity.set(0,0,-initialSpeed);ctx.ship.speed=initialSpeed;ctx.input.throttle=.12;
  f.target.object.position.set(100,0,-Math.sqrt(3)*100);
  const sample=()=>({speed:0,closing:losCloseRate(ctx.ship.object.position,f.target.object.position,ctx.ship.velocity.clone().negate())});
  f.sample(sample());assert.equal(f.start().ok,true);
  const before=ctx.ship.object.quaternion.clone(),initialAuthority=hoverTurnRateFor('light',initialSpeed);
  for(let n=0;n<30;n++) {
    f.tick(1/60,true,sample());flight.update(1/60);
    assert.notEqual(f.status().combat.phase,'reposition','this fixture remains outside the imminent collision corridor');
  }
  const authority=hoverTurnRateFor('light',ctx.ship.speed),turned=before.angleTo(ctx.ship.object.quaternion);
  console.log('Ordinary turning response:',JSON.stringify({initialSpeed,speed:ctx.ship.speed,initialAuthority,authority,turned}));
  assert(authority>initialAuthority*1.25,'actual flight gains useful turn authority before reaching alignment');
  assert(turned>.15,'that authority produces a real heading correction');
});

test('class, speed and bio turn limits remain physical under normalized combat steering', () => {
  for(const [classKey,speed,turnFactor] of [['light',0,.85],['light',120,1.12],['frigate',0,.85],['frigate',75,1]]) {
    const f=fixture(),ctx=f.ctx;
    ctx.config.world.shipSpawn=new THREE.Vector3();ctx.config.world.stationPosition=new THREE.Vector3(5000,5000,5000);
    const flight=initShip(ctx);
    // Isolate the class/bio steering law in the actual flight integrator;
    // this does not claim a complete fitted or rendered frigate encounter.
    ctx.player.classKey=classKey;ctx.bio.turnFactor=turnFactor;
    ctx.ship.speed=speed;ctx.ship.velocity.set(0,0,-speed);
    f.target.object.position.set(160,80,-360);f.sample();assert.equal(f.start().ok,true);
    for(let n=0;n<30;n++) {
      const dt=1/60,before=ctx.ship.object.quaternion.clone();
      const direction=f.target.object.position.clone().sub(ctx.ship.object.position).normalize();
      const nose=new THREE.Vector3(0,0,-1).applyQuaternion(before);
      const limit=hoverTurnRateFor(classKey,ctx.ship.speed)*turnFactor*1.22*Math.SQRT2*dt;
      f.tick(dt);assert(Number.isFinite(ctx.input.steerX)&&Math.abs(ctx.input.steerX)<=1);
      assert(Number.isFinite(ctx.input.steerY)&&Math.abs(ctx.input.steerY)<=1);
      flight.update(dt);
      assert(before.angleTo(ctx.ship.object.quaternion)<=limit+1e-7,'normal per-axis turn and existing lock assist remain the physical bound');
      const turned=new THREE.Vector3(0,0,-1).applyQuaternion(ctx.ship.object.quaternion);
      assert(turned.dot(direction)>nose.dot(direction),'normal flight turns toward the observed contact');
    }
  }
});

test('actual flight regains firing geometry against a pursuing contact after egress', () => {
  const random=Math.random;seedBootRandom();
  const f=fixture(),ctx=f.ctx;
  ctx.config.world.shipSpawn=new THREE.Vector3();
  ctx.config.world.stationPosition=new THREE.Vector3(5000,5000,5000);
  const flight=initShip(ctx),npc=initNpc(ctx);
  // Measured t44.08: range94.9, almost directly aft, own68.9u/s versus
  // target84u/s. Both sides use actual ship/NPC updates in this fixture;
  // player input still goes through the controls owner and public API.
  const position=new THREE.Vector3(-.148,-.068,.987).normalize().multiplyScalar(94.9);
  Object.assign(f.target,spawnLiveShip(ctx,{id:f.target.id,name:'Gallows pursuit fixture',classKey:'cutter',faction:'independent',role:'pirate',resolve:80,alwaysHuntsPlayer:true,anchor:{x:0,y:0,z:0}},position));
  ctx.ship.velocity.set(0,0,-68.9);ctx.ship.speed=68.9;
  const velocity=f.target.ai.velocity,relative=new THREE.Vector3();velocity.set(0,0,-84);
  f.target.ai.target='player';f.target.ai.intent=true;f.target.ai.mode='hunt';
  const sample=()=>({speed:velocity.length(),closing:losCloseRate(ctx.ship.object.position,f.target.object.position,relative.copy(velocity).sub(ctx.ship.velocity))});
  f.sample(sample());assert.equal(f.start({ttl:45}).ok,true);
  let fireFrames=0,firstFire=null,minimum=Infinity,previous=false,windows=0;
  for(let n=0;n<30*60;n++) {
    const dt=1/60;
    f.tick(dt,true,sample());flight.update(dt);npc.update(dt);
    minimum=Math.min(minimum,ctx.ship.object.position.distanceTo(f.target.object.position));
    const fire=ctx.input.fireHeld;
    if(fire){fireFrames++;firstFire??=n*dt;if(!previous)windows++;}
    previous=fire;
    assert.equal(f.status().owner,'combat','grant stays active throughout pursuing flight');
  }
  Math.random=random;
  // A regression budget of two half-turns at the measured initial speed
  // plus one maximum egress. This is a stress-test bound, not a game promise.
  const budget=3+2*Math.PI/hoverTurnRateFor('light',68.9);
  console.log('Gallows pursuit geometry:',JSON.stringify({firstFire,budget,fireFrames,windows,minimum}));
  assert(firstFire!==null&&firstFire<budget,'regain firing geometry within the ordinary maneuver budget');
  assert(fireFrames>30,'sustain more than a transient single-frame alignment');
  assert(windows>=2,'reacquire after more than one close pass');
  assert(minimum>12,'do not solve pursuit by flying through the hull center');
});

test('on-nose close egress reduces forward thrust before accelerating away under ordinary flight', () => {
  const random=Math.random;seedBootRandom();
  const f=fixture(),ctx=f.ctx;
  ctx.config.world.shipSpawn=new THREE.Vector3();ctx.config.world.stationPosition=new THREE.Vector3(5000,5000,5000);
  const flight=initShip(ctx),npc=initNpc(ctx);
  Object.assign(f.target,spawnLiveShip(ctx,{id:f.target.id,name:'Close egress fixture',classKey:'cutter',faction:'independent',role:'pirate',resolve:80,alwaysHuntsPlayer:true,anchor:{x:0,y:0,z:0}},new THREE.Vector3(0,0,-100)));
  f.target.object.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
  f.target.ai.velocity.set(0,0,84);f.target.ai.target='player';f.target.ai.intent=true;f.target.ai.mode='hunt';
  ctx.ship.velocity.set(0,0,-68.9);ctx.ship.speed=68.9;ctx.input.throttle=(68.9-ctx.config.ship.creep)/(ctx.config.ship.maxSpeed-ctx.config.ship.creep);
  const initialThrottle=ctx.input.throttle,relative=new THREE.Vector3();
  const sample=()=>({speed:f.target.ai.velocity.length(),closing:losCloseRate(ctx.ship.object.position,f.target.object.position,relative.copy(f.target.ai.velocity).sub(ctx.ship.velocity))});
  f.sample(sample());assert.equal(f.start({ttl:45}).ok,true);
  let minimum=Infinity,firstFire=null,framesAhead=0,awayAcceleration=false;
  for(let n=0;n<20*60;n++) {
    const prior=ctx.input.throttle;f.tick(1/60,true,sample());
    if(n===0){assert.equal(f.status().combat.phase,'reposition');assert(ctx.input.throttle<initialThrottle,'first command decelerates the on-nose approach');}
    if(f.status().combat.phase==='reposition'&&ctx.targets.aim.bearing[2]<-.3){framesAhead++;assert(ctx.input.throttle<=Math.max(prior,.18)+1e-8);assert.equal(ctx.input.fireHeld,false);}
    if(f.status().combat.phase==='reposition'&&ctx.targets.aim.bearing[2]>.3&&ctx.input.throttle>prior)awayAcceleration=true;
    if(ctx.input.fireHeld)firstFire??=n/60;
    flight.update(1/60);npc.update(1/60);
    minimum=Math.min(minimum,ctx.ship.object.position.distanceTo(f.target.object.position));
    assert.equal(f.status().owner,'combat');
  }
  Math.random=random;
  console.log('Close egress geometry:',JSON.stringify({minimum,firstFire,framesAhead,awayAcceleration}));
  assert(framesAhead>0&&awayAcceleration,'braking while facing target is followed by actual acceleration away');
  assert(minimum>12,'close egress does not fly through the target center');
  assert(firstFire!==null,'close avoidance returns to a firing opportunity');
});

test('ordinary ship/NPC second crossing clears the target during return cooldown and resumes firing', () => {
  const random=Math.random;seedBootRandom();
  const f=fixture(),ctx=f.ctx;
  ctx.config.world.shipSpawn=new THREE.Vector3();ctx.config.world.stationPosition=new THREE.Vector3(5000,5000,5000);
  const flight=initShip(ctx),npc=initNpc(ctx);
  Object.assign(f.target,spawnLiveShip(ctx,{id:f.target.id,name:'Return crossing fixture',classKey:'cutter',faction:'independent',role:'pirate',resolve:95,alwaysHuntsPlayer:true,anchor:{x:0,y:0,z:0}},new THREE.Vector3(0,0,-20)));
  ctx.world.time=126.2;f.sample();f.start({ttl:45});f.tick();
  f.target.object.position.set(0,0,201);f.tick(2.1,true,{closing:112});
  assert.equal(f.status().combat.phase,'intercept');
  // Controlled checkpoint from the measured second crossing. Establish the
  // cooldown via real owner transitions above, then let both ordinary motion
  // systems evolve freely; this is a stress fixture, not a natural replay.
  ctx.world.time=131.9761;ctx.ship.object.position.set(0,0,0);ctx.ship.object.quaternion.identity();
  ctx.ship.velocity.set(0,0,-40.8);ctx.ship.speed=40.8;ctx.input.throttle=.12;
  f.target.object.position.set(.10589519332931759,.1031653513227889,-.9890111820986583).multiplyScalar(130.4138753853993);
  const toward=ctx.ship.object.position.clone().sub(f.target.object.position).normalize();
  f.target.object.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),toward);
  f.target.ai.velocity.copy(toward).multiplyScalar(47.9065136728842);
  f.target.ai.target='player';f.target.ai.intent=true;f.target.ai.mode='hunt';
  const relative=new THREE.Vector3();let minimum=Infinity,firstFire=null;
  for(let n=0;n<20*60;n++) {
    const closing=losCloseRate(ctx.ship.object.position,f.target.object.position,relative.copy(f.target.ai.velocity).sub(ctx.ship.velocity));
    f.tick(1/60,true,{closing,speed:f.target.ai.velocity.length()});
    if(n===0)assert.equal(f.status().combat.phase,'reposition','imminent front crossing outranks cooldown immediately');
    if(ctx.input.fireHeld)firstFire??=n/60;
    flight.update(1/60);npc.update(1/60);
    minimum=Math.min(minimum,ctx.ship.object.position.distanceTo(f.target.object.position));
    assert.equal(f.status().owner,'combat');
  }
  Math.random=random;
  const shipImpacts=ctx.events.filter(e=>e.type==='bodyHit'&&e.kind==='ship');
  console.log('Return crossing geometry:',JSON.stringify({minimum,firstFire,shipImpacts:shipImpacts.length}));
  assert.equal(shipImpacts.length,0,'the reproduced return crossing has no ship impact');
  assert(minimum>12);assert(firstFire!==null,'collision avoidance returns to a firing opportunity');
});

test('ordinary interception closes into firing range on a slower straight-away target', () => {
  const f=fixture(),ctx=f.ctx;
  ctx.config.world.shipSpawn=new THREE.Vector3();ctx.config.world.stationPosition=new THREE.Vector3(5000,5000,5000);
  const flight=initShip(ctx),targetVelocity=new THREE.Vector3(0,0,-90),relative=new THREE.Vector3();
  ctx.ship.velocity.set(0,0,-90);ctx.ship.speed=90;ctx.input.throttle=2/3;
  f.target.object.position.set(0,0,-520);
  const sample=()=>({speed:90,closing:losCloseRate(ctx.ship.object.position,f.target.object.position,relative.copy(targetVelocity).sub(ctx.ship.velocity))});
  f.sample(sample());assert.equal(f.start({ttl:60}).ok,true);
  let firstFire=null,fireFrames=0,minimum=Infinity;
  for(let n=0;n<50*60;n++) {
    f.tick(1/60,true,sample());
    if(ctx.input.fireHeld){assert(ctx.targets.aim.dist<=WEAPONS.cannon.range*.95);firstFire??=n/60;fireFrames++;}
    flight.update(1/60);f.target.object.position.addScaledVector(targetVelocity,1/60);
    minimum=Math.min(minimum,ctx.ship.object.position.distanceTo(f.target.object.position));
    assert.equal(f.status().owner,'combat');
  }
  console.log('Straight-away interception:',JSON.stringify({firstFire,fireFrames,minimum,finalRange:ctx.targets.aim.dist,speed:ctx.ship.speed}));
  assert(firstFire!==null,'a target slower than ordinary available thrust must not equilibrate beyond firing range');
  assert(fireFrames>30,'interception gives a sustained firing opportunity');
});

test('break-off and retreat complete within observable geometry; never fire', () => {
  for (const [intent,seconds,reason] of [['break-off',2.1,'disengaged'],['retreat',5.1,'retreated']]) {
    const f=fixture(); f.target.object.position.z=450; f.sample({closing:5});
    assert.equal(f.start({intent}).ok,true); f.tick(1/60,true,{closing:5});
    assert.equal(f.ctx.input.fireHeld,false);
    f.tick(seconds,true,{closing:5}); assert.equal(f.status().reason,reason);
    assert.equal(f.ctx.input.throttle,0);
  }
  const f=fixture(); f.start({intent:'retreat'}); f.target.object.position.z=601;
  f.ctx.targets.current=null;f.tick(); assert.equal(f.status().reason,'retreated');
  const invalid=fixture();invalid.start({intent:'retreat'});invalid.target.object.position.z=NaN;
  invalid.tick();assert.equal(invalid.status().reason,'target-lost');
});

test('visible obstruction stops fire and slows; hidden ship details are never sampled', () => {
  const f=fixture();
  f.ctx.ships.push({ get object(){throw Error('hidden contact was read');}, get state(){throw Error('hidden state was read');} });
  f.ctx.asteroids.list=[{id:0,position:new THREE.Vector3(0,0,-35),radius:15}];
  assert.equal(f.start().ok,true); f.tick();
  assert.equal(f.status().owner,'combat'); assert.equal(f.status().combat.movementBlocked,'obstructed');
  assert.equal(f.ctx.input.fireHeld,false); assert.equal(f.ctx.input.throttle,0);
});

test('each lifecycle releases before the next fire tick and remains stopped after redundant clear', () => {
  for (const [change,reason] of [
    [f=>{f.ctx.flags.paused=true;},'paused'],[f=>{f.ctx.flags.berthHold=true;},'held'],
    [f=>{f.ctx.flags.docked=true;},'docked'],[f=>{f.ctx.gate.jumping=true;},'jumping'],
    [f=>{f.ctx.flags.chartOpen=true;},'overlay'],
    [f=>{f.ctx.flags.berthOpen=true;},'overlay'],[f=>{f.ctx.player.destroyed=true;},'dead'],
    [f=>{f.ctx.agent.optIn=false;},'opt-in'],[f=>{f.ctx.lastEvents=[{type:'systemLoaded'}];},'jump'],
  ]) { const f=fixture(); f.start();f.tick();change(f);f.tick();assert.equal(f.status().reason,reason);assert.equal(f.ctx.input.fireHeld,false);assert.equal(f.ctx.input.throttle,0);if(f.ctx.agent.optIn)assert.equal(f.act('clearControl').ok,true);assert.equal(f.status().reason,reason); }
});

test('unsolicited hail preserves combat authority and permits explicit grants/renewals, but raw leases remain gated', () => {
  const f=fixture();f.start({ttl:45});f.tick();const seq=f.status().seq,phase=f.status().combat.phase;
  const card={open:true,conversationId:'incoming-card',kind:'bargaining',intents:['keepFiring']};
  let replies=0;f.ctx.hailApi={peek:()=>card,resolve:()=>{replies++;return '';}};
  f.ctx.flags.hailOpen=true;f.target.state.resolve=15;
  for(let n=0;n<15*60;n++)f.tick();
  assert.equal(f.status().owner,'combat');assert.equal(f.status().seq,seq);
  assert.equal(f.status().combat.phase,phase);assert.equal(f.ctx.input.fireHeld,true);
  assert(Math.abs(f.status().expiresIn-(30-1/60))<1e-7);
  assert.equal(card.open,true);assert.equal(replies,0,'no automatic negotiation or card close');
  const availability=f.api.observe().availability;
  assert.equal(availability.setCombatIntent.ok,true);assert.equal(availability.setControl.reason,'overlay');
  assert.equal(f.start().ok,true);assert.equal(f.status().combat.phase,phase);
  f.act('clearControl');assert.equal(f.start().ok,true,'new explicit grant is also permitted through a card');
  f.target.state.surrendered=true;f.tick();assert.equal(f.status().reason,'target-surrendered');
  const raw=fixture();raw.act('setControl',{seq:1,ttl:5,fireHeld:true});raw.tick();
  raw.ctx.flags.hailOpen=true;raw.tick();assert.equal(raw.status().reason,'overlay');
  assert.equal(raw.act('setControl',{seq:2,ttl:5}).token,'overlay');
});

test('only valid deliberate hail actions hand combat back; stale responses preserve the grant', () => {
  for(const [name,args] of [['hail',{}],['pulse',{edge:'hail'}]]) {
    const f=fixture();f.start();f.tick();assert.equal(f.act(name,args).ok,true);
    assert.equal(f.status().reason,'hail');assert.equal(f.ctx.input.fireHeld,false);assert.equal(f.ctx.input.throttle,0);
  }
  const f=fixture();f.start();f.tick();f.ctx.flags.hailOpen=true;
  let effects=0;
  f.ctx.hailApi={peek:()=>({open:true,conversationId:'live-card',intents:['keepFiring']}),resolve:(intent,id)=>{
    if(id&&id!=='live-card')return 'stale';
    if(intent!=='keepFiring')return 'no-service';
    effects++;return '';
  }};
  const before=f.status(),input={...f.ctx.input};
  for(const [args,token] of [[{intent:'keepFiring',expectedConversationId:'old-card'},'stale'],
    [{intent:'missing',expectedConversationId:'live-card'},'no-service'],
    [{intent:'keepFiring',expectedConversationId:3},'bad-args']]) {
    assert.equal(f.act('hailResolve',args).token,token);
    assert.deepEqual({...f.status(),expiresIn:before.expiresIn},before);assert.deepEqual(f.ctx.input,input);
  }
  assert.equal(effects,0);assert.equal(f.act('pulse',{edge:'unknown'}).ok,false);assert.equal(f.status().owner,'combat');
  assert.equal(f.act('hailResolve',{intent:'keepFiring',expectedConversationId:'live-card'}).ok,true);
  assert.equal(effects,1);assert.equal(f.status().reason,'hail');assert.equal(f.ctx.input.fireHeld,false);
  for(const digit of [1,7]) {
    const g=fixture();g.start();g.tick();g.ctx.flags.hailOpen=true;
    g.ctx.hailApi={peek:()=>({open:true,intents:Array(7).fill('existing-choice')})};
    g.emit('keydown',{code:'Digit'+digit,repeat:false});
    assert.equal(g.status().reason,'player-override');assert.equal(g.ctx.input.fireHeld,false);
  }
});

test('combat survives focus loss, but bounded wall authorization cannot survive suspension indefinitely', () => {
  let now=performance.now(); const clock=mock.method(performance,'now',()=>now);
  try {
    const f=fixture();f.start({ttl:5});f.tick();
    f.emit('blur'); document.hidden=true;
    assert.equal(f.status().owner,'combat');f.tick();assert.equal(f.ctx.input.fireHeld,true);
    const sim=f.ctx.world.time;
    now+=5001; // no simulation frames, no action and no implicit renewal
    const resumed=f.api.observe(); // First read must not mix old holds/new owner.
    assert.equal(resumed.control.reason,'expired');assert.equal(f.ctx.world.time,sim);
    assert.equal(resumed.ship.fireHeld,false);assert.equal(resumed.ship.throttle,0);
    assert.equal(f.ctx.input.fireHeld,false);assert.equal(f.ctx.input.throttle,0);
    document.hidden=false;f.tick();assert.equal(f.ctx.input.fireHeld,false);
    const raw=fixture();raw.act('setControl',{seq:1,ttl:5,fireHeld:true});raw.tick();raw.emit('blur');
    assert.equal(raw.status().reason,'blur','raw manual lease behavior is unchanged');
  } finally {clock.mock.restore();}
});

test('human input synchronously wins; the new command starts from neutral agent throttle', () => {
  for(const [name,args] of [['mousemove',{clientX:100,clientY:100}],['mousedown',{button:0}],['keydown',{code:'KeyR',repeat:false}]]) {
    const f=fixture();f.start();f.tick(1);assert(f.ctx.input.throttle>0);f.emit(name,args);
    assert.equal(f.status().reason,'player-override');assert.equal(f.ctx.input.throttle,0);assert.equal(f.ctx.input.fireHeld,false);
    f.tick();
    if(name==='keydown')assert.equal(f.ctx.input.throttle,0.5/60);
    if(name==='mousedown')assert.equal(f.ctx.input.fireHeld,true,'human fire is intentional');
    if(name==='mousemove')assert(f.ctx.input.steerX<0);
  }
  const f=fixture();f.emit('keydown',{code:'KeyR'});assert.equal(f.start().token,'player-override');
  const click=fixture();click.start();click.tick();click.emit('mousedown',{button:0,clientX:100,clientY:100});click.tick();
  assert(click.ctx.input.steerX<0,'first human shot uses the click cursor, without requiring a mousemove');
  assert.equal(click.ctx.input.fireHeld,true);
});

test('public discovery and incoming helms agree, with explicit MATCH refusal', () => {
  const f=fixture(); const spec=f.api.observe().capabilities.commands.setCombatIntent;
  assert(spec.args.intent.includes('disable shares engage policy'));assert(spec.args.intent.includes('may destroy'));
  assert(spec.outcomes.includes('cleared'));assert(!spec.outcomes.includes('target-disabled'));
  assert(spec.terminalReasons.includes('target-disabled'));assert(spec.phases.includes('reposition'));
  assert.equal(f.start().owner,'combat');
  for(const name of ['engageAutopilot','engageAutomine','approachDock','afterburner'])assert.equal(f.act(name).token,'helm');
  f.act('clearControl'); f.ctx.flags.matchSpeed=true; assert.equal(f.start().token,'match-speed');
  f.ctx.flags.matchSpeed=false;
  for(const channel of ['autopilot','automine','flee']) { f.ctx[channel].engaged=true;assert.equal(f.start().token,'helm');f.ctx[channel].engaged=false; }
});

test('degraded control status retains an explicit owner field', () => {
  const f=fixture();f.start();f.tick();
  const time=f.ctx.world.time;Object.defineProperty(f.ctx.world,'time',{configurable:true,get(){throw Error('broken clock');}});
  assert.deepEqual(f.status(),{owner:'none',state:'idle',seq:0,expiresIn:0,fire:false,reason:''});
  Object.defineProperty(f.ctx.world,'time',{configurable:true,writable:true,value:time});
  f.act('clearControl');
});

console.log(`Issue #61: ${checks} regression groups PASS`);
