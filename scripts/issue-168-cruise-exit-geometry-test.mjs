/** Pure geometry controls for the private stationary-ship cruise pad exit.
 * Recorded poses are independent QA witnesses, not a complete world replay.
 * No ship integration, collision-owner or natural-flight claim is made here.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const runtimeRoot=resolve(process.env.STAGE_RUNTIME||fileURLToPath(new URL('..',import.meta.url)));
const mod=path=>import(pathToFileURL(resolve(runtimeRoot,path)).href);
const {planApPath,keepRadius}=await mod('src/game/ap-path.js');
const cruise=await mod('src/game/dock-cruise.js');
const {dockApproachPoints}=await mod('src/game/dock-approach.js');
const {AUTHORED_SYSTEMS}=await mod('src/game/authored-systems.js');
const {PHY}=await mod('src/game/physics.js');
const git=(...args)=>{
  const r=spawnSync('git',['-c',`safe.directory=${runtimeRoot}`,...args],{cwd:runtimeRoot,encoding:'utf8',windowsHide:true});
  assert.equal(r.status,0,r.stderr);return r.stdout.trim();
};
const hash=createHash('sha256');
for(const path of git('ls-files','src').split(/\r?\n/).sort()){hash.update(path);hash.update(readFileSync(resolve(runtimeRoot,path)));}
const artifact={head:git('rev-parse','HEAD'),runtimeSourceDirty:!!git('status','--porcelain','--','src'),runtimeSha256:hash.digest('hex')};
const vec=a=>({x:a[0],y:a[1],z:a[2]});
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const scale=(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const length=a=>Math.hypot(a.x,a.y,a.z);
const unit=a=>scale(a,1/length(a));
const originalStation=vec(AUTHORED_SYSTEMS.veridian.station.position);
const goal=dockApproachPoints(originalStation).stage;
const center=vec([-147.88294610169373,46.524278647346165,-216.2069300004465]);
const bodyRadius=34.6124861863461;
function ship(){return {kind:'cruise-obstacle',bodyKind:'ship',id:'rec-22',...center,r:bodyRadius,
  baseX:center.x,baseY:center.y,baseZ:center.z,bodyRadius,vx:0,vy:0,vz:0,motionVx:0,motionVy:0,motionVz:0};}
const poses=[
  {t:44.374,p:vec([-179.8236344741177,29.85761958513713,-184.8020194128297])},
  {t:52.4835,p:vec([-182.674017386051,30.419834426639817,-191.00646301711447])},
  {t:79.2815,p:vec([-186.19770942247635,31.654602128142148,-210.65061069467504])},
];
const records=[];
let verdict='FAIL';
function call(p,target,items){
  const out={x:123456,y:234567,z:345678},before=JSON.stringify({p,target,items});
  // The parent revision has no private correction. Its effective aim is the
  // unchanged planner output, so baseline failures still show inward geometry.
  const status=typeof cruise.dockCruiseExitAim==='function'
    ?cruise.dockCruiseExitAim(p,target,{items,count:items.length},out):'none';
  assert.equal(JSON.stringify({p,target,items}),before,'the correction does not mutate input geometry');
  if(status!=='clear')assert.deepEqual(out,{x:123456,y:234567,z:345678},'none/blocked never publishes an aim');
  return {status,aim:status==='clear'?out:target};
}
function closestDistance(p,end,c){
  const d=sub(end,p),t=Math.max(0,Math.min(1,dot(sub(c,p),d)/dot(d,d)));
  return length(sub(add(p,scale(d,t)),c));
}
let witness;
try{
  for(const pose of poses)for(const sideHint of [-1,1]){
    const b=ship(),p=pose.p;
    const plan=planApPath({px:p.x,py:p.y,pz:p.z,gx:goal.x,gy:goal.y,gz:goal.z,
      hx:0,hy:0,hz:-1,bodies:{items:[b],count:1},shipR:PHY.PLAYER_RADIUS,classKey:'light',speed:0,zone:12,sideHint});
    const target={x:plan.ax,y:plan.ay,z:plan.az},radial=sub(p,center),oldDelta=sub(target,p);
    assert.equal(plan.hold,'detour');
    assert.ok(length(radial)>bodyRadius+PHY.PLAYER_RADIUS&&length(radial)<keepRadius(b,PHY.PLAYER_RADIUS));
    assert.ok(dot(radial,oldDelta)<-200,'the recorded parent planner points inward for this sign');
    const corrected=call(p,target,[b]),delta=sub(corrected.aim,p);
    const record={name:'recorded-both-signs',t:pose.t,sideHint,oldRadialDot:dot(radial,oldDelta),
      radialDot:dot(radial,delta),status:corrected.status,physicalClearance:closestDistance(p,corrected.aim,center)-bodyRadius-PHY.PLAYER_RADIUS};
    records.push(record);console.log(JSON.stringify(record));
    assert.ok(record.radialDot>0,'the effective course must leave the padded sphere outward');
    assert.equal(corrected.status,'clear');
    assert.ok(record.physicalClearance>0,'the entire outgoing segment preserves physical hull clearance');
    const tangent=sub(oldDelta,scale(unit(radial),dot(oldDelta,unit(radial))));
    assert.ok(dot(delta,tangent)>0,'the selected tangent side is retained');
    assert.equal(cruise.dockCruiseShouldBrake(p,scale(unit(oldDelta),1.2),90,{items:[b],count:1}),true,'the original inward course still receives predictive braking');
    assert.equal(cruise.dockCruiseShouldBrake(p,scale(unit(delta),30),90,{items:[b],count:1}),false,'the outward course is separating under unchanged braking');
    witness={p,target,aim:corrected.aim,b};
  }
  // The shared inside-tangent construction continues one unit beyond keep.
  // An exit correction that stops at keep reintroduces its inward chord here.
  for(const beyondKeep of [0.1,0.9])for(const sideHint of [-1,1]){
    const b=ship(),keep=keepRadius(b,PHY.PLAYER_RADIUS);
    const p=add(center,scale(unit(sub(poses[0].p,center)),keep+beyondKeep));
    const plan=planApPath({px:p.x,py:p.y,pz:p.z,gx:goal.x,gy:goal.y,gz:goal.z,
      hx:0,hy:0,hz:-1,bodies:{items:[b],count:1},shipR:PHY.PLAYER_RADIUS,classKey:'light',speed:0,zone:12,sideHint});
    const target={x:plan.ax,y:plan.ay,z:plan.az},radial=sub(p,center),oldDelta=sub(target,p);
    assert.equal(plan.hold,'detour');assert.ok(dot(radial,oldDelta)<0,'transition annulus still uses the inward tangent construction');
    const corrected=call(p,target,[b]),delta=sub(corrected.aim,p);
    const record={name:'inside-tangent-transition',beyondKeep,sideHint,status:corrected.status,
      oldRadialDot:dot(radial,oldDelta),radialDot:dot(radial,delta),
      physicalClearance:closestDistance(p,corrected.aim,center)-bodyRadius-PHY.PLAYER_RADIUS};
    records.push(record);console.log(JSON.stringify(record));
    assert.equal(corrected.status,'clear','the complete inside-tangent interval receives the outward correction');
    assert.ok(record.radialDot>0&&record.physicalClearance>0,'transition course remains outward and physically clear');
  }
  const {p,target,aim}=witness;
  for(const kind of ['station','sun','cruise-obstacle']){
    const b=ship(),mid=add(p,scale(sub(aim,p),0.5));
    const blocker={kind,...mid,r:1,y0:0,y1:0,id:'blocked-outward',bodyKind:'ship',bodyRadius:1,
      baseX:mid.x,baseY:mid.y,baseZ:mid.z,vx:0,vy:0,vz:0,motionVx:0,motionVy:0,motionVz:0};
    assert.ok(closestDistance(p,aim,mid)<keepRadius(blocker,PHY.PLAYER_RADIUS),'the candidate course really intersects the second protected sphere');
    const result=call(p,target,[b,blocker]);
    records.push({name:'blocked-outward-course',kind,status:result.status});
    assert.equal(result.status,'blocked',`${kind} must veto an unsafe outgoing segment`);
  }
  const exclusions=[
    ['station',b=>{b.kind='station';delete b.bodyKind;}],
    ['sun',b=>{b.kind='sun';delete b.bodyKind;}],
    ['stationary-asteroid',b=>{b.bodyKind='asteroid';}],
    ['warm-moving-asteroid',b=>{b.bodyKind='asteroid';b.motionVx=20;}],
    ['moving-ship-actual-motion',b=>{b.motionVz=1;}],
    ['moving-ship-predicted-motion',b=>{b.vy=1;}],
  ];
  for(const [name,change] of exclusions){
    const b=ship();change(b);const result=call(p,target,[b]);
    records.push({name,status:result.status});assert.equal(result.status,'none',`${name} retains its existing planner policy`);
  }
  for(const [name,position,end] of [
    ['outside-padding',add(center,scale(unit(sub(p,center)),70)),target],
    ['physical-overlap',add(center,scale(unit(sub(p,center)),bodyRadius+PHY.PLAYER_RADIUS-0.1)),target],
    ['already-outward',p,add(p,scale(unit(sub(p,center)),70))],
  ]){
    const result=call(position,end,[ship()]);records.push({name,status:result.status});
    assert.equal(result.status,'none',`${name} does not receive this bounded correction`);
  }
  verdict='PASS';console.log(`PASS #168 cruise exit geometry (${records.length} cases)`);
}finally{
  const out=resolve(process.env.STAGE_OUT||'out/issue-168-cruise-exit-geometry');mkdirSync(out,{recursive:true});
  writeFileSync(resolve(out,'result.json'),JSON.stringify({verdict,authority:'pure planner/brake geometry; no actual ship integration',artifact,goal,records},null,2)+'\n');
}
