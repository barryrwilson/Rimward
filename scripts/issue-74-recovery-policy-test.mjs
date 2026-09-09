/** Issue #74 controlled regression fixtures; never natural availability evidence.
 * node --import ./scripts/with-css-stub.mjs scripts/issue-74-recovery-policy-test.mjs
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {seedBootRandom,installDomStubs,bootGameSystems} from './lib/boot-harness.mjs';
import {recoveryWreck,recoveryPod,recoveryObjective,tickRecovery} from '../src/game/recovery.js';
import {restore as restoreSave,requestAutosave,snapshot as saveSnapshot} from '../src/game/save.js';
import {capabilityManifest} from '../src/game/agent-schema.js';
import {FACTION_SERVICES} from '../src/game/state.js';
import {AUTHORED_SYSTEMS} from '../src/game/authored-systems.js';
const KEY='rimward-save-v1',restore=process.argv[2]==='restore'?JSON.parse(readFileSync(0,'utf8')):null;
seedBootRandom();const dom=installDomStubs();if(restore)localStorage.setItem(KEY,restore.blob);
const {ctx,systems}=await bootGameSystems();
const station=systems.find(([n])=>n==='station')[1],save=systems.find(([n])=>n==='save')[1],pods=systems.find(([n])=>n==='pods')[1];
const clone=x=>JSON.parse(JSON.stringify(x)),pins=[];
const check=(name,fn)=>{fn();pins.push(name);console.log('PASS',name);};
function step(n=1){for(let i=0;i<n;i++){ctx.world.time+=1/60;ctx.elapsed+=1/60;station.update(1/60);save.update(1/60);ctx.lastEvents=ctx.events;ctx.events=[];}}
function dock(system='freehold'){if(ctx.flags.docked)ctx.stationDesk.undock();ctx.world.currentSystem=system;const p=ctx.systems[system].station.position;ctx.ship.object.position.set(p[0]+36,p[1],p[2]);ctx.ship.velocity.set(0,0,0);ctx.ship.speed=0;ctx.input.dockPressed=true;step(3);ctx.input.dockPressed=false;assert.equal(ctx.flags.docked,true);ctx.stationDesk.selectService('jobs');}
function restart(stage,expected){const r=spawnSync(process.execPath,['--import','./scripts/with-css-stub.mjs',fileURLToPath(import.meta.url),'restore'],{input:JSON.stringify({stage,expected,blob:localStorage.getItem(KEY)}),encoding:'utf8',maxBuffer:8*1024*1024,windowsHide:true});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);}
if(restore){
  ctx.flags.paused=false;const jobs=ctx.world.jobs.filter(j=>j.kind==='recovery');
  assert.equal(ctx.world.credits,restore.expected.credits);assert.deepEqual(ctx.cargo,restore.expected.cargo);
  for(const expected of restore.expected.jobs){const j=jobs.find(j=>j.id===expected.id);assert.equal(j?.state,expected.state);assert.equal(j?.collected,expected.collected);assert.equal(j?.deadline,expected.deadline);}
  tickRecovery(ctx);tickRecovery(ctx);
  for(const j of jobs.filter(j=>j.state==='accepted')){const pod=recoveryPod(ctx,j);assert.equal(!!pod,!j.collected);if(pod){assert.ok(Math.abs(pod.bornAt+pod.ttl-j.deadline)<1e-9);assert.equal(ctx.pods.filter(p=>p===pod).length,1);}}
  if(restore.stage==='paid'){dock();step(90);assert.equal(ctx.world.credits,restore.expected.credits);}
  console.log('PASS restart '+restore.stage);process.exit(0);
}
for(const node of dom.walkDom(document.body))if(node.dataset?.titleAction==='new'){node.click();break;}
dom.dispatchKey('Digit1');assert.equal(ctx.world.origin,'greenhand');ctx.flags.combat=false;dock();
const snapshot=()=>({credits:ctx.world.credits,cargo:clone(ctx.cargo),jobs:ctx.world.jobs.filter(j=>j.kind==='recovery').map(clone)});
check('fresh no-aftermath guide with no grants',()=>{const cash=ctx.world.credits,count=ctx.pods.length,inc=ctx.world.incidents.length;const rows=ctx.stationDesk.peekView().rows;assert.ok(rows.some(r=>/SALVAGE.*No confirmed local recovery/.test(r.text)));assert.ok(rows.some(r=>/station-to-gate|next dock/i.test(r.text)));ctx.stationDesk.selectService('jobs');assert.equal(ctx.world.credits,cash);assert.equal(ctx.pods.length,count);assert.equal(ctx.world.incidents.length,inc);});
function wreck(id,extra={}){const a={id,kind:'wreck',system:'freehold',createdAt:ctx.world.time,expiresAt:ctx.world.time+600,position:{x:700,y:200,z:0},...extra};ctx.world.aftermath.push(a);ctx.stationDesk.selectService('jobs');return {a,j:ctx.world.jobs.find(j=>j.wreckId===id)};}
for(const kind of ['expired','foreign','wrong-kind','malformed-position']){
  const {a,j}=wreck('stale-'+kind);assert.ok(j);if(kind==='expired')a.expiresAt=ctx.world.time;if(kind==='foreign')a.system='veridian';if(kind==='wrong-kind')a.kind='wake';if(kind==='malformed-position')a.position={x:NaN,y:0,z:0};
  check('action-time refusal '+kind,()=>{const cash=ctx.world.credits,cargo=clone(ctx.cargo),n=ctx.pods.length;const r=ctx.stationDesk.acceptJob(j);assert.equal(r.ok,false);assert.match(r.error||r.notice,/expired|recover|cold|posting|available/i);assert.equal(ctx.world.credits,cash);assert.deepEqual(ctx.cargo,cargo);assert.equal(ctx.pods.length,n);assert.notEqual(j.state,'accepted');});
}
ctx.world.aftermath=[];ctx.world.jobs=ctx.world.jobs.filter(j=>j.kind!=='recovery');
const first=wreck('first'),second=wreck('second');
check('full hold acceptance refusal',()=>{ctx.cargo.push({commodity:'provisions',units:20});const r=ctx.stationDesk.acceptJob(first.j.id);assert.equal(r.ok,false);assert.match(r.error||r.notice,/2 hold units|hold/i);assert.equal(first.j.state,'offered');assert.equal(ctx.pods.length,0);ctx.cargo.length=0;});
check('two exact markers and fixed deadlines',()=>{for(const {a,j} of [first,second]){assert.equal(ctx.stationDesk.acceptJob(j.id).ok,true);assert.equal(j.deadline,Math.min(ctx.world.time+300,a.expiresAt));assert.ok(recoveryPod(ctx,j));}assert.notEqual(recoveryPod(ctx,first.j),recoveryPod(ctx,second.j));tickRecovery(ctx);tickRecovery(ctx);assert.equal(ctx.pods.length,2);});
check('accepted uncollected restart restores same bounded work',()=>restart('accepted',snapshot()));
check('unrelated event cannot credit either contract',()=>{ctx.lastEvents=[{type:'podCollected',pod:{contents:[{commodity:'refinedMetals',units:2}]}}];tickRecovery(ctx);assert.equal(first.j.collected,false);assert.equal(second.j.collected,false);ctx.lastEvents=[];});
check('public far marker shares exact pod geometry',()=>{ctx.flags.docked=false;ctx.ship.object.position.set(0,0,0);const o=recoveryObjective(ctx,first.j);assert.equal(o.status,'available');assert.ok(o.range>600);assert.equal(o.bearing.length,3);assert.equal(o.range,recoveryPod(ctx,first.j).mesh.position.length());});
check('ordinary scoop respects complete cargo capacity',()=>{const p=recoveryPod(ctx,first.j);ctx.ship.object.position.copy(p.mesh.position);ctx.cargo.push({commodity:'provisions',units:20});pods.update(.01);assert.ok(ctx.pods.includes(p));assert.equal(first.j.collected,false);ctx.cargo.length=0;});
check('only actual scooped marker earns collection',()=>{const p=recoveryPod(ctx,first.j);recoveryPod(ctx,second.j).mesh.position.x+=100;ctx.events=[];pods.update(.01);ctx.lastEvents=ctx.events;ctx.events=[];station.update(.01);assert.equal(first.j.collected,true);assert.equal(second.j.collected,false);assert.equal(recoveryPod(ctx,first.j),null);assert.ok(ctx.cargo.some(c=>c.commodity==='refinedMetals'&&c.units===2));assert.ok(!ctx.pods.includes(p));});
check('collected save survives new process before payment',()=>{step(3);restart('collected',snapshot());});
check('collected contract stays payable after deadline; uncollected expires',()=>{ctx.world.time=second.j.deadline+1;ctx.lastEvents=[];tickRecovery(ctx);assert.equal(first.j.collected,true);assert.equal(first.j.state,'accepted');assert.equal(second.j.state,'failed');assert.equal(recoveryPod(ctx,second.j),null);assert.equal(recoveryObjective(ctx,first.j).status,'collected');});
check('wrong dock does not pay',()=>{const cash=ctx.world.credits;dock('veridian');step(90);assert.equal(ctx.world.credits,cash);});
check('origin disposition pays exactly once and retains metals',()=>{const cash=ctx.world.credits,pay=first.j.payQuoted??first.j.reward;dock();step(90);assert.equal(ctx.world.credits,cash+pay);assert.ok(ctx.cargo.some(c=>c.commodity==='refinedMetals'&&c.units===2));const paid=ctx.world.credits;dock();step(90);assert.equal(ctx.world.credits,paid);restart('paid',snapshot());});
check('legacy accepted contract fails without renewed deadline',()=>{const {j}=wreck('legacy');j.state='accepted';delete j.deadline;tickRecovery(ctx);assert.equal(j.state,'failed');assert.equal(j.deadline,undefined);assert.equal(recoveryPod(ctx,j),null);});
check('foreign accepted marker is unavailable without leaking bearing',()=>{const {j}=wreck('away');assert.equal(ctx.stationDesk.acceptJob(j.id).ok,true);ctx.world.currentSystem='veridian';tickRecovery(ctx);const o=recoveryObjective(ctx,j);assert.equal(j.state,'accepted');assert.equal(o.status,'different-system');assert.equal(o.bearing,null);assert.equal(recoveryPod(ctx,j),null);});
ctx.world.currentSystem='freehold';dock();
check('fractional deadline preserves one exact live marker',()=>{const {j}=wreck('fractional');j.state='accepted';j.deadline=ctx.world.time+123.456789;tickRecovery(ctx);const p=recoveryPod(ctx,j);for(let i=0;i<20;i++){ctx.world.time+=.000001;ctx.lastEvents=[];tickRecovery(ctx);}assert.equal(recoveryPod(ctx,j),p);assert.equal(p.recoveryDeadline,j.deadline);});
check('same-context restore rejects old-timeline collection event',()=>{const {j}=wreck('same-context');assert.equal(ctx.stationDesk.acceptJob(j.id).ok,true);assert.equal(requestAutosave(ctx),true);const snap=JSON.parse(localStorage.getItem(KEY)),oldPod=recoveryPod(ctx,j);ctx.lastEvents=[{type:'podCollected',pod:oldPod,t:ctx.world.time}];ctx.cargo.push({commodity:'refinedMetals',units:2});restoreSave(ctx,snap);const restored=ctx.world.jobs.find(x=>x.id===j.id);assert.notEqual(restored,j);tickRecovery(ctx);assert.equal(restored.collected,false);assert.notEqual(recoveryPod(ctx,restored),oldPod);assert.ok(!ctx.pods.includes(oldPod));assert.deepEqual(ctx.cargo,snap.cargo);ctx.lastEvents=[];});
check('collection before cutoff credits despite next-frame deadline crossing',()=>{const {j}=wreck('boundary-before');j.state='accepted';j.deadline=ctx.world.time+1;tickRecovery(ctx);const p=recoveryPod(ctx,j);ctx.lastEvents=[{type:'podCollected',pod:p,t:j.deadline-.001}];ctx.world.time=j.deadline+.01;tickRecovery(ctx);assert.equal(j.collected,true);assert.equal(j.state,'accepted');ctx.lastEvents=[];});
check('collection at cutoff fails without reward credit',()=>{const {j}=wreck('boundary-at');j.state='accepted';j.deadline=ctx.world.time+1;tickRecovery(ctx);const p=recoveryPod(ctx,j);ctx.lastEvents=[{type:'podCollected',pod:p,t:j.deadline}];ctx.world.time=j.deadline+.01;tickRecovery(ctx);assert.equal(j.collected,false);assert.equal(j.state,'failed');ctx.lastEvents=[];});
check('foreign generated dock preserves issuing-dock payout text',()=>{ctx.world.jobs=ctx.world.jobs.filter(j=>j.kind!=='recovery');ctx.world.epics={};tickRecovery(ctx);const generated=Object.entries(ctx.systems).filter(([id,s])=>!AUTHORED_SYSTEMS[id]&&s.station?.position&&Number.isFinite(FACTION_SERVICES[s.faction]?.jobPayMult));const [issuer,issuerDef]=generated[0],issuerRate=FACTION_SERVICES[issuerDef.faction].jobPayMult;const [foreign,foreignDef]=generated.find(([,s])=>FACTION_SERVICES[s.faction].jobPayMult!==issuerRate);const foreignRate=FACTION_SERVICES[foreignDef.faction].jobPayMult;dock(issuer);const {j}=wreck('generated-quote',{system:issuer});assert.ok(j);assert.equal(ctx.stationDesk.acceptJob(j.id).ok,true);dock(foreign);const row=ctx.stationDesk.peekView().rows.find(r=>/^Scoop, then return to the issuing dock/.test(r.text));assert.ok(row,'issuing dock instruction visible');assert.match(row.text,new RegExp('pays '+Math.round(j.reward*issuerRate)+' UU'));assert.doesNotMatch(row.text,new RegExp('pays '+Math.round(j.reward*foreignRate)+' UU'));console.log('GENERATED QUOTE',JSON.stringify({issuer,foreign,issuerRate,foreignRate,text:row.text}));});
check('manifest advertises recovery objective discovery',()=>{const role=JSON.stringify(capabilityManifest().roles.explorer);assert.match(role,/surveys and recoveries/);assert.match(role,/jobs\.active\[\]\.objective/);assert.match(role,/podCollected/);});
ctx.world.jobs=ctx.world.jobs.filter(j=>j.kind!=='recovery');ctx.world.aftermath=[];tickRecovery(ctx);dock();
check('expired recovery failure stays local to issuing board',()=>{const {j}=wreck('qa-local-failure');j.title='Recovery QA local failure';assert.equal(ctx.stationDesk.acceptJob(j.id).ok,true);ctx.world.time=j.deadline;tickRecovery(ctx);assert.equal(j.state,'failed');assert.ok(ctx.stationDesk.peekView().rows.some(r=>r.text.includes(j.title)));dock('veridian');assert.ok(!ctx.stationDesk.peekView().rows.some(r=>r.text.includes(j.title)));dock();assert.ok(ctx.stationDesk.peekView().rows.some(r=>r.text.includes(j.title)));});
check('legacy no-deadline card is meaningful before first tick',()=>{const {j}=wreck('qa-legacy-card');j.state='accepted';delete j.deadline;const text=ctx.stationDesk.peekView().rows.map(r=>r.text).join('\n');assert.equal(j.state,'accepted','peek must test before recovery tick');assert.doesNotMatch(text,/NaN/);assert.match(text,/Cannot recover|expired/i);assert.equal(recoveryObjective(ctx,j).status,'unavailable');tickRecovery(ctx);assert.equal(j.state,'failed');});
check('failed recovery flood prunes at cap while preserving live work',()=>{
  const cap=27+14*Object.keys(ctx.systems).length,base=ctx.world.jobs.find(j=>j.kind==='recovery'),snap=clone(saveSnapshot(ctx));
  const row=(id,state,collected=false,originSystem='freehold')=>({...clone(base),id:'recovery-'+id,wreckId:id,state,collected,originSystem,deadline:ctx.world.time+300});
  const keep=[row('cap-uncollected','accepted'),row('cap-payable','accepted',true),row('cap-local-offer','offered'),row('cap-foreign-offer','offered',false,'veridian')];
  snap.world.jobs=[...keep,...Array.from({length:cap+8},(_,i)=>row('cap-failed-'+i,'failed'))];
  restoreSave(ctx,snap);assert.equal(ctx.world.jobs.length,cap);
  for(const wanted of keep){const found=ctx.world.jobs.find(j=>j.id===wanted.id);assert.ok(found,wanted.id+' survives terminal pruning');assert.equal(found.state,wanted.state);assert.equal(found.collected,wanted.collected);assert.equal(found.deadline,wanted.deadline);}
  assert.equal(ctx.world.jobs.filter(j=>j.state==='failed').length,cap-keep.length);assert.equal(requestAutosave(ctx),true);const persisted=JSON.parse(localStorage.getItem(KEY)).world.jobs;assert.equal(persisted.length,cap);for(const wanted of keep)assert.ok(persisted.some(j=>j.id===wanted.id));
});
console.log('PASS issue #74 '+pins.length+' focused pins');
