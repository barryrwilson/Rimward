/** Focused real-system regression. Each origin/mode boots in its own process
 * to isolate system module state. Simulation time is controlled here; the
 * separate live probe verifies ordinary browser animation and fresh starts. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

const origins=['greenhand','ledgerDebt','marked','beautiful','drifter'];
const origin=process.argv[2], mode=process.argv[3];
if(!origin){
  for(const id of origins)for(const run of ['idle','forward']){
    const r=spawnSync(process.execPath,['--import',new URL('./with-css-stub.mjs',import.meta.url).href,fileURLToPath(import.meta.url),id,run],{stdio:'inherit',windowsHide:true});
    if(r.error||r.status!==0)throw Error('Starter case failed: '+id+' '+run);
  }
  console.log('PASS all five origins, 60-second idle/forward windows, input and saved-pose regression');
}else{
  assert.ok(origins.includes(origin)&&['idle','forward'].includes(mode));
  let seed=1;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  let dom=installDomStubs();
  let {ctx,systems,binds}=await bootGameSystems();
  ctx.titleApi.start();
  assert.equal(ctx.originsApi.choose(origin),'');
  assert.equal(ctx.world.origin,origin);
  assert.equal(ctx.flags.paused,false);
  assert.equal(ctx.input.throttle,0);
  assert.equal(ctx.input.fullStop,false);
  const nose=()=>new THREE.Vector3(0,0,-1).applyQuaternion(ctx.ship.object.quaternion);
  const outward=()=>ctx.ship.object.position.clone().sub(ctx.config.world.sunPosition).normalize();
  assert.ok(nose().dot(outward())>.999999,'fresh nose points outward: '+origin);
  const start=ctx.ship.object.position.clone(),initialRadius=start.distanceTo(ctx.config.world.sunPosition);
  const events=[];
  function tick(frames){
    for(let i=0;i<frames;i++){
      assert.equal(ctx.flags.paused,false,'measurement must not advance a paused world');
      ctx.world.time+=1/60;ctx.elapsed+=1/60;
      for(const [,sys] of systems)sys.update?.(1/60);
      for(const e of ctx.events)if(['sunHeat','sunKill','playerDestroyed'].includes(e.type))events.push({type:e.type,observedWorldTime:ctx.world.time});
      ctx.lastEvents=ctx.events;ctx.events=[];
    }
  }
  // Input fixture only: no transform, defenses, sun or NPC changes.
  if(mode==='forward')ctx.input.throttle=.5;
  tick(3600);
  assert.ok(!events.some(e=>e.type==='sunHeat'||e.type==='sunKill'),'no solar hazard in first minute');
  if(['greenhand','beautiful'].includes(origin))assert.ok(ctx.player.hull>0&&!ctx.player.destroyed,'starter survives the full first minute');
  assert.ok(ctx.ship.object.position.distanceTo(ctx.config.world.sunPosition)>initialRadius,'ordinary flight increases radius');
  assert.ok(ctx.ship.object.position.distanceTo(start)>100,'creep and throttle still move the ship');
  console.log('PASS',origin,mode,JSON.stringify({t:ctx.world.time,initialRadius,finalRadius:ctx.ship.object.position.distanceTo(ctx.config.world.sunPosition),hull:ctx.player.hull,events}));

  if(origin==='greenhand'&&mode==='idle'){
    const beforeTurn=ctx.ship.object.quaternion.clone();
    for(const fn of dom.winListeners.mousemove||[])fn({clientX:window.innerWidth/2+180,clientY:window.innerHeight/2});
    tick(60);
    assert.ok(beforeTurn.angleTo(ctx.ship.object.quaternion)>.1,'ordinary mouse steering changes heading');
    for(const fn of dom.winListeners.mousemove||[])fn({clientX:window.innerWidth/2,clientY:window.innerHeight/2});
    for(const fn of dom.winListeners.keydown||[])fn({code:'KeyR',repeat:false,preventDefault(){}});
    tick(60);
    for(const fn of dom.winListeners.keyup||[])fn({code:'KeyR',preventDefault(){}});
    assert.ok(ctx.input.throttle>.4&&ctx.input.throttle<.6,'R retains authored throttle ramp');
    dom.dispatchKey('KeyF');dom.dispatchKey('KeyF');tick(180);
    assert.equal(ctx.input.fullStop,true,'double F remains full stop');
    assert.ok(ctx.ship.speed<.01,'full stop still holds');

    // Save a non-default pose, then run the real boot-time autosave restore.
    ctx.ship.object.position.set(1900,400,2500);
    ctx.ship.object.quaternion.setFromEuler(new THREE.Euler(.2,.7,-.3));
    const saved=JSON.parse(JSON.stringify(binds.snapshot(ctx)));
    dom=installDomStubs();localStorage.setItem('rimward-save-v1',JSON.stringify(saved));
    ({ctx,systems,binds}=await bootGameSystems());
    assert.equal(ctx.flags.saveRestored,true);
    assert.deepEqual(ctx.ship.object.position.toArray(),saved.ship.position,'load preserves saved position');
    assert.deepEqual(ctx.ship.object.quaternion.toArray(),saved.ship.quaternion,'load preserves saved heading');
    assert.equal(ctx.originsApi.isOpen(),false,'saved run does not restart origin selection');
    console.log('PASS mouse turn, R throttle, double-F stop and boot-time saved pose restore');
  }
}
