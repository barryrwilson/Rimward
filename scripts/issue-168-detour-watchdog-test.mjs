/** Direct autopilot-owner boundary controls. Poses are test-owned; no ship
 * physics, collision safety or natural gameplay claim is made by this test.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as THREE from 'three';

const runtimeRoot = resolve(process.env.STAGE_RUNTIME || fileURLToPath(new URL('..', import.meta.url)));
const { initAutopilot, tryApproachDock } = await import(pathToFileURL(resolve(runtimeRoot, 'src/game/autopilot.js')).href);
const { dockApproachPoints } = await import(pathToFileURL(resolve(runtimeRoot, 'src/game/dock-approach.js')).href);
const { collectBodies } = await import(pathToFileURL(resolve(runtimeRoot, 'src/game/collision.js')).href);
const { keepRadius, sphereChordHit } = await import(pathToFileURL(resolve(runtimeRoot, 'src/game/ap-path.js')).href);
const { PHY } = await import(pathToFileURL(resolve(runtimeRoot, 'src/game/physics.js')).href);
const git = (...args) => {
  const r = spawnSync('git', ['-c', `safe.directory=${runtimeRoot}`, ...args], { cwd: runtimeRoot, encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
};
const hash = createHash('sha256');
for (const path of git('ls-files', 'src').split(/\r?\n/).sort()) { hash.update(path); hash.update(readFileSync(resolve(runtimeRoot, path))); }
const artifact = { head: git('rev-parse', 'HEAD'), runtimeSourceDirty: !!git('status', '--porcelain', '--', 'src'), runtimeSha256: hash.digest('hex') };
const DT = 1 / 60;
const results = [];
let verdict='FAIL';

function fixture() {
  const position = new THREE.Vector3(-165, 0, 0);
  // Nose points out of the controlled XZ plane, leaving yaw magnitude at a
  // right angle as the detour moves. Pitch is not a watchdog progress input.
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1), new THREE.Vector3(0,1,0));
  const ctx = {
    flags: { docked:false, paused:false, berthHold:false, chartOpen:false, matchSpeed:false },
    world: { time:0, currentSystem:'fixture', nav:{autopilot:false} },
    systems: { fixture:{station:{position:[0,0,0]},gates:[],sunRadius:0} },
    station: {inZone:false,name:'Watchdog fixture',position:new THREE.Vector3()},
    ship: {object:{position,quaternion},speed:0,velocity:new THREE.Vector3(),driftActive:false,burnerActive:false},
    player:{classKey:'light'},
    input:{steerX:0,steerY:0,strafeX:0,strafeY:0,roll:0,throttleHeld:false,afterburnerPressed:false,driftHeld:false,fullStop:false},
    gate:{jumping:false},automine:{engaged:false},flee:{engaged:false},asteroids:{list:[]},ships:[],
    config:{ship:{acceleration:90,creep:30,maxSpeed:120,damping:5},world:{stationPosition:new THREE.Vector3(),sunPosition:new THREE.Vector3()}},
    events:[],lastEvents:[],emit(type,data={}) {this.events.push({type,t:this.world.time,...data});},
  };
  const owner = initAutopilot(ctx);
  const goal = dockApproachPoints({x:0,y:0,z:0}).stage;
  return {ctx,owner,goal};
}

function run(name, trajectory, { limit=30, beforeStart, existing }={}) {
  const f=existing||fixture(), {ctx,owner,goal}=f;
  const radius=300;
  const pose=(angle) => ctx.ship.object.position.set(goal.x-radius*Math.cos(angle),0,goal.z+radius*Math.sin(angle));
  pose(0);beforeStart?.(f);
  assert.equal(tryApproachDock(ctx),'');
  const started=ctx.world.time;
  const bag={items:[],count:0};collectBodies(ctx,bag);
  const body=bag.items.slice(0,bag.count).find(b=>b.kind==='station');
  const keep=keepRadius(body,PHY.PLAYER_RADIUS);
  const samples=[];
  let minStage=Infinity,maxStage=0,totalTravel=0,clearTransitions=0,reentries=0,wasClear=false;
  const previous=ctx.ship.object.position.clone();
  for(let frame=0;frame<limit/DT&&ctx.autopilot.engaged;frame++) {
    ctx.world.time+=DT;
    trajectory({ ...f, t:ctx.world.time-started, frame, pose });
    totalTravel+=previous.distanceTo(ctx.ship.object.position);previous.copy(ctx.ship.object.position);
    const distance=ctx.ship.object.position.distanceTo(goal);minStage=Math.min(minStage,distance);maxStage=Math.max(maxStage,distance);
    const p=ctx.ship.object.position;
    const clear=!sphereChordHit(p.x,p.y,p.z,goal.x,goal.y,goal.z,body.x,body.y,body.z,keep).hit;
    if(clear&&!wasClear)clearTransitions++;if(!clear&&wasClear)reentries++;wasClear=clear;
    owner.update(DT);
    if(frame%30===0||!ctx.autopilot.engaged) samples.push({t:ctx.world.time,p:ctx.ship.object.position.toArray(),ap:{...ctx.autopilot}});
    ctx.lastEvents=ctx.events;ctx.events=[];
  }
  const result={name,elapsed:ctx.world.time-started,engaged:ctx.autopilot.engaged,reason:ctx.autopilot.reason,minStage,maxStage,totalTravel,clearTransitions,reentries,samples};
  results.push(result);
  console.log('DIRECT AP CLOCK',JSON.stringify({...result,samples:undefined}));
  assert.equal(ctx.autopilot.reason,'blocked',`${name}: finite named failure`);
  assert.equal(ctx.autopilot.engaged,false,`${name}: bounded owner lifetime`);
  assert.ok(maxStage-minStage<1e-8,`${name}: no ordinary stage-distance improvement`);
  return result;
}

try {
  const frozen=run('frozen',()=>{});
  assert.ok(frozen.elapsed>=10&&frozen.elapsed<=10+2*DT,'stationary detour gets the original ten-second bound');
  const slowArc=({t,pose})=>pose(Math.min(t/8,1)*0.35);
  let sameOwner;
  const credit=run('one-slow-arc-then-frozen',slowArc,{beforeStart:f=>{sameOwner=f;}});
  assert.ok(credit.elapsed>frozen.elapsed+0.2,'actual geometric progress receives a measurable allowance');
  assert.ok(credit.elapsed<=20+2*DT,'one engagement cannot buy more than ten additional seconds');
  const fresh=run('new-engagement-same-owner',slowArc,{existing:sameOwner});
  assert.ok(Math.abs(fresh.elapsed-credit.elapsed)<=2*DT,'new accepted dock engagement receives a fresh bounded allowance');
  const once=run('one-arc-then-frozen',({t,pose})=>pose(Math.min(t/2,1)*0.35));
  const backtrack=run('repeated-backtracking',({t,pose})=>pose((1-Math.abs((t%4)/2-1))*0.35));
  assert.ok(backtrack.totalTravel>once.totalTravel*4,'negative control actually repeats the traveled arc');
  assert.ok(backtrack.elapsed<=once.elapsed+2*DT,'revisiting the same geometric interval cannot refill credit');
  const clear=run('clear-once',({t,pose})=>pose(Math.min(t/2,1)*0.6));
  const reentry=run('clear-and-reenter-repeatedly',({t,pose})=>pose((1-Math.abs((t%4)/2-1))*0.6));
  assert.ok(reentry.totalTravel>clear.totalTravel*4,'clear/reentry control traverses multiple complete arcs');
  assert.ok(reentry.clearTransitions>=2&&reentry.reentries>=2,'the protected stage chord actually clears and becomes blocked repeatedly');
  assert.ok(reentry.elapsed<=clear.elapsed+2*DT,'clearing and re-entering the station chord cannot refill credit');
  const churn=run('alternating-sides-and-identities',({ctx,t,frame,pose})=>{
    pose(Math.sin(t*Math.PI/2)*0.6);
    // Replace the stationary body's public object without moving its geometry.
    ctx.station.position=new THREE.Vector3();ctx.station.id=`station-${frame}`;
    ctx.asteroids.list=[{id:frame,position:new THREE.Vector3(5000,5000,5000),radius:10}];
  });
  assert.ok(churn.elapsed<=20+2*DT,'side/identity churn remains inside the per-engagement bound');
  const phaseOnce=({ctx,t,frame,pose})=>{pose(Math.min(t/2,1)*0.6);if(frame===60)ctx.autopilot.phase='cruise';};
  const phaseLoop=({ctx,t,frame,pose})=>{pose((1-Math.abs((t%4)/2-1))*0.6);if(frame===60)ctx.autopilot.phase='cruise';};
  // One explicit owner-state transition exercises scratch lifetime. Perpetual
  // forced phase resets are outside the watchdog's normal caller contract.
  const phase=run('one-phase-transition',phaseOnce);
  const phaseReentry=run('phase-transition-and-reentry',phaseLoop);
  assert.ok(phaseReentry.elapsed<=phase.elapsed+2*DT,'phase transition does not turn repeated clearance into new credit');
  verdict='PASS';
  console.log(`PASS #168 direct autopilot watchdog controls (${results.length} scenarios)`);
} finally {
  const out=resolve(process.env.STAGE_OUT||'out/issue-168-detour-watchdog');mkdirSync(out,{recursive:true});
  writeFileSync(resolve(out,'result.json'),JSON.stringify({verdict,authority:'direct autopilot update; controlled pose, no ship integration',artifact,results},null,2)+'\n');
}
