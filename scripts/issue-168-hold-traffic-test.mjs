/** #168 threatened hold: controlled incoming mesh, actual helm/ship/collision.
 * node --import ./scripts/with-css-stub.mjs scripts/issue-168-hold-traffic-test.mjs
 * HOLD_CASE=blocked checks the station keep-out on the proposed forward course.
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
    if (incoming) incoming.object.position.addScaledVector(incoming.ai.velocity, DT);
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
assert.ok(nav.travelTo('veridian', 'incoming hold setup'));

const blocked = process.env.HOLD_CASE === 'blocked';
const station = new THREE.Vector3(...binds.SYSTEMS.veridian.station.position);
ctx.ship.object.position.copy(blocked ? station.clone().add(new THREE.Vector3(70,0,0)) : new THREE.Vector3(-180,33,100));
ctx.ship.object.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),new THREE.Vector3(-1,0,0));
ctx.ship.velocity.set(0,0,0); ctx.ship.speed=0;
ctx.input.throttle=0;ctx.input.fullStop=false;ctx.flags.docked=false;ctx.station.inZone=false;
const position=ctx.ship.object.position.clone();
const velocity=new THREE.Vector3(11.15,-3.39,-49.13);
// Start one second before the observed incoming offset so the ordinary
// 1.5s safety prediction can validate a complete slow forward escape.
const npcPosition=position.clone().add(new THREE.Vector3(12,-17,51)).addScaledVector(velocity,-1);
const record={id:'stage-hold-incoming',name:'Incoming route freighter',role:'trader',classKey:'freighter',faction:'freehold',
  system:'veridian',state:'enroute',live:true,resolve:90,cargo:[],
  route:[npcPosition.clone().addScaledVector(velocity,20),npcPosition.clone().addScaledVector(velocity,30)],
  leg:0,legT:0,dir:1,legLens:[velocity.length()*10]};
incoming=binds.spawnLiveShip(ctx,record,npcPosition);
assert.ok(incoming,'real freighter mesh must be ready');
incoming.ai.mode='route';
incoming.ai.velocity.copy(velocity);incoming.ai.resolveAt=ctx.world.time+100;
incoming.object.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),velocity.clone().normalize());
ctx.ships.push(incoming);
ctx.world.records.push(record);
events.length=0;collisions.length=0;ctx.events=[];ctx.lastEvents=[];
collectBodies(ctx,bodies);
const incomingBody=bodies.items.slice(0,bodies.count).find(b=>b.kind==='ship'&&b.id===incoming.id);
assert.ok(incomingBody,'the live collision collector must include the incoming mesh');
const incomingRadius=incomingBody.r;
let minClearance=Infinity,minHeldClearance=Infinity;
const fixture={blocked,trajectoryAuthority:'test-controlled fixed incoming vector and real mesh collider; named mover excluded from NPC AI; normal player physics',station:station.toArray(),p:position.toArray(),q:ctx.ship.object.quaternion.toArray(),
  incoming:npcPosition.toArray(),velocity:velocity.toArray(),trafficCount:ctx.ships.length,asteroidCount:ctx.asteroids.list.length};
const receipt=window.rimward.act({v:2,name:'approachDock',args:{}});
assert.equal(receipt.ok,true,JSON.stringify(receipt));
const startTime=ctx.world.time;
const samples=[];
for(let i=0;i<(blocked?10:150)&&ctx.autopilot.engaged;i++){
 tick();
 minClearance=Math.min(minClearance,ctx.ship.object.position.distanceTo(incoming.object.position)-incomingRadius-2.4);
 minHeldClearance=Math.min(minHeldClearance,position.distanceTo(incoming.object.position)-incomingRadius-2.4);
 samples.push({t:ctx.world.time,p:ctx.ship.object.position.toArray(),v:ctx.ship.velocity.toArray(),q:ctx.ship.object.quaternion.toArray(),
   phase:ctx.autopilot.phase,idle:ctx.autopilot.idle,speed:ctx.ship.speed,npc:incoming.object.position.toArray(),npcV:incoming.ai.velocity.toArray()});
}
const evidence={artifact,fixture,receipt,events,collisions,samples,ap:ctx.autopilot,
  distance:ctx.ship.object.position.distanceTo(position),npcTravel:incoming.object.position.distanceTo(npcPosition),minClearance,minHeldClearance};
const out=resolve(process.env.STAGE_OUT||'out/issue-168-hold');mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'result.json'),JSON.stringify(evidence,null,2)+'\n');
console.log('HOLD_RESULT',JSON.stringify({...evidence,samples:undefined}));
assert.equal(events.some(e=>['bodyHit','sunHeat','playerDestroyed'].includes(e.type)),false,'no real contact during tested hold interval');
assert.ok(evidence.npcTravel>1,'the controlled incoming collider must advance');
if(blocked){
 assert.ok(samples.every(s=>s.idle&&s.speed<0.01),'station-blocked forward escape must remain braked');
 assert.ok(evidence.distance<0.01,'station keep-out must prevent speculative forward creep');
}else{
 assert.ok(samples.some(s=>!s.idle&&s.speed>5),'real ship must advance from threatened turning hold');
 assert.ok(minClearance>0.1,'real player hull must retain positive clearance throughout the crossing');
 assert.ok(minHeldClearance< -1,'the same trajectory must intersect a stationary player hull');
 assert.ok(ctx.autopilot.engaged,'safe escape must preserve the dock helm');
}
console.log('PASS #168 controlled incoming collider / actual player '+(blocked?'keeps station course blocked':'allows validated normal creep'));
