/** Explicitly fixture-based lifecycle verification; NEVER an availability sample.
 * Injects a destruction event for a live NPC as the controlled aftermath input.
 * Fixture setup only sets wreck location, parked traffic and cargo capacity cases.
 * All flight after setup uses public ship-local objective bearings, no hidden coordinates.
 */
import {runLive,sleep} from './issue-74-live-harness.mjs';
await runLive('fixture-lifecycle',async h=>{
  const {c,result,observe,act,wait,checkpoint,save}=h;
  result.fixture=true;result.fixtureNote='Injected destruction event for a live NPC at 850 units from the issuing station, parked other traffic, explicitly changed cargo for capacity/attribution tests, and shortened a second fixture wreck lifetime. No combat kill is claimed. This proves functional lifecycle only, never natural availability, profitability, or search cost.';
  result.flight=[];result.checks={};
  const check=(name,ok,detail)=>{result.checks[name]={pass:!!ok,detail};console.log(ok?'PASS':'FAIL',name);if(!ok)throw Error('Check failed '+name+' '+JSON.stringify(detail));};
  await act('approachDock');await wait(s=>s.flags.docked,150,'initial dock');await act('openService',{id:'jobs'});await checkpoint('01-natural-no-opportunity');
  result.fixtureSetup=await c.eval(`(()=>{const c=window.__ctx;const p=c.systems[c.world.currentSystem].station.position;
    for(const s of c.ships)if(s.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
    const victim=c.ships.find(s=>s.object&&s.record&&s.record.role!=='ace');if(!victim)throw Error('No live NPC fixture input');
    victim.object.position.set(p[0]+850,p[1]+150,p[2]);victim.state.destroyed=true;
    c.emit('npcDestroyed',{ship:victim});return {victim:victim.id,name:victim.record.name,fixtureDistance:850,beforeWrecks:c.world.aftermath.length,queued:c.events.map(e=>e.type),paused:c.flags.paused};})()`);
  async function waitFixtureWreck(before){for(let i=0;i<100;i++){const ready=await c.eval(`(()=>{const c=window.__ctx;return {time:c.world.time,paused:c.flags.paused,aftermath:c.world.aftermath.map(a=>({id:a.id,kind:a.kind,system:a.system,expiresAt:a.expiresAt})),incidents:c.world.incidents.slice(-3),events:c.events.map(e=>e.type),lastEvents:c.lastEvents.map(e=>e.type)};})()`);result.fixtureReadiness=ready;if(ready.aftermath.length>before)return;await sleep(200);}throw Error('Injected aftermath fixture never staged '+JSON.stringify(result.fixtureReadiness));}
  await waitFixtureWreck(result.fixtureSetup.beforeWrecks);await act('openService',{id:'jobs'});let s=await checkpoint('02-injected-event-fixture-offer');
  const offer=s.jobs.offers.find(j=>j.kind==='recovery'&&j.state==='offered'&&j.originSystem===s.world.currentSystem);check('injected-event-offer',!!offer,offer);
  result.displayedReward=await c.eval(`(()=>{const card=[...document.querySelectorAll('.job-card')].find(e=>/Recovery: wreck salvage/.test(e.textContent));return card?.querySelector('.job-reward')?.textContent||'';})()`);
  const quotedPay=Number(result.displayedReward.match(/pays\s+(\d+)\s+UU/i)?.[1]);check('player-displayed-quote',Number.isFinite(quotedPay)&&quotedPay>0,result.displayedReward);
  await c.eval(`window.__ctx.cargo.splice(0,window.__ctx.cargo.length,{commodity:'provisions',units:20});true`);
  const full=await act('acceptJob',{id:offer.id},false);check('full-hold-accept-refused',!full.ok,full);
  await c.eval(`window.__ctx.cargo.length=0;true`);
  const before=await observe(),receipt=await act('acceptJob',{id:offer.id});result.acceptReceipt=receipt;s=await checkpoint('03-accepted');
  await c.eval(`(()=>{const card=[...document.querySelectorAll('.job-card')].find(e=>/Recovery: wreck salvage/.test(e.textContent));card?.scrollIntoView({block:'center'});return !!card;})()`);await checkpoint('03b-accepted-card');
  check('no-buy-in',s.world.credits===before.world.credits,{before:before.world.credits,after:s.world.credits});
  let job=s.jobs.active.find(j=>j.id===offer.id);check('accepted-objective',!!job?.objective,job);
  const deadline=job.deadline;result.deadline=deadline;
  async function savedUntil(name,pred){for(let i=0;i<80;i++){const snap=await c.eval(`(()=>{try{const s=JSON.parse(localStorage.getItem('rimward-save-v1'));return {credits:s?.world?.credits,cargo:s?.cargo,jobs:s?.world?.jobs?.filter(j=>j.kind==='recovery')};}catch{return null;}})()`);if(pred(snap)){(result.persistence??={})[name]=snap;return;}await sleep(200);}throw Error('Autosave not ready '+name);}
  await savedUntil('accepted',snap=>snap?.jobs?.some(j=>j.id===offer.id&&j.state==='accepted'&&j.deadline===deadline));
  async function reload(name){await c.send('Page.reload',{ignoreCache:true});await sleep(1800);for(let i=0;i<150;i++){if(await c.eval('!!window.rimward'))break;await sleep(300);}let s=await observe();if(s.session.phase==='title')await act('startGame');await wait(s=>s.session.phase==='playing',25,'reload');return checkpoint(name);}
  s=await reload('04-uncollected-restored');job=s.jobs.active.find(j=>j.id===offer.id);
  check('fixed-deadline-restored',job?.deadline===deadline,{deadline,restored:job?.deadline});
  if(!s.flags.docked&&s.station.inZone){await act('dock');s=await wait(s=>s.flags.docked,10,'restored berth dock');}if(s.flags.docked)await act('undock');
  // Unrelated collectible is a separate explicit fixture; receiving its cargo cannot finish recovery.
  result.unrelatedFixture=await c.eval(`(async()=>{const c=window.__ctx;const {spawnPod}=await import('/src/game/pods.js');spawnPod(c,[{commodity:'rawOre',units:1}],c.ship.object.position.clone(),c.ship.velocity.clone().multiplyScalar(0));return true;})()`);
  s=await wait(s=>s.world.cargo.some(c=>c.commodity==='rawOre'&&c.units===1),15,'unrelated raw ore collection');job=s.jobs.active.find(j=>j.id===offer.id);result.unrelatedCollected=s.world.cargo;
  check('unrelated-pod-no-recovery-credit',job?.collected!==true,job);
  await c.eval(`window.__ctx.cargo.splice(0,window.__ctx.cargo.length,{commodity:'provisions',units:20});true`);
  s=await checkpoint('05-flight-far-marker');job=s.jobs.active.find(j=>j.id===offer.id);
  check('beyond-nearby-public-bearing',job?.objective?.range>600&&Array.isArray(job.objective.bearing),job?.objective);
  let seq=0,reached=false;const end=Date.now()+300000;
  while(Date.now()<end){s=await observe();job=s.jobs.active.find(j=>j.id===offer.id);const o=job?.objective;
    if(!o?.bearing||o.status!=='available')throw Error('Recovery objective lost '+JSON.stringify(o));
    if(o.range<8){await act('setControl',{seq:++seq,ttl:5,throttle:0,steerX:0,steerY:0});reached=true;break;}
    const [x,y,z]=o.bearing,steerX=Math.max(-1,Math.min(1,Math.atan2(x,-z)*1.5)),steerY=Math.max(-1,Math.min(1,Math.atan2(y,Math.hypot(x,z))*1.5));
    const desiredSpeed=Math.max(2,Math.min(110,(o.range-4)*.18));
    const throttle=z<-.92&&s.ship.speed<desiredSpeed+2?Math.max(.005,Math.min(.5,(o.range-4)/1800)):0;
    result.flight.push({t:s.t,range:o.range,bearing:o.bearing,speed:s.ship.speed,steerX,steerY,throttle});
    await act('setControl',{seq:++seq,ttl:2,steerX,steerY,throttle});
    if(!result.markerText&&z<-.98){result.markerText=await c.eval(`Array.from(document.querySelectorAll('.rw-chartmark')).filter(e=>!e.classList.contains('is-hidden')&&getComputedStyle(e).display!=='none').map(e=>({text:e.textContent,labelDisplay:getComputedStyle(e.querySelector('.rw-chartmark-label')).display,rect:e.getBoundingClientRect().toJSON()}))`);check('player-visible-recovery-marker',result.markerText.some(m=>/Recovery pod/i.test(m.text)&&m.labelDisplay!=='none'),result.markerText);await checkpoint('05b-aligned-recovery-marker');}
    if(result.flight.length%25===0){console.log('FLIGHT',o.range,s.t);await save();}await sleep(200);
  }
  check('public-bearing-arrival',reached,result.flight.at(-1));await sleep(1200);s=await checkpoint('06-full-hold-at-pod');job=s.jobs.active.find(j=>j.id===offer.id);
  check('full-hold-blocks-scoop',!job?.collected&&s.world.cargo.reduce((n,c)=>n+c.units,0)===20,job);
  await c.eval(`window.__ctx.cargo.length=0;true`);
  const collectionEnd=Date.now()+120000;let collected=false;
  while(Date.now()<collectionEnd){s=await observe();job=s.jobs.active.find(j=>j.id===offer.id);if(job?.collected){collected=true;break;}const o=job?.objective;if(!o?.bearing)throw Error('No public marker during collection reacquisition');const [x,y,z]=o.bearing;
    const steerX=Math.max(-1,Math.min(1,Math.atan2(x,-z)*1.5)),steerY=Math.max(-1,Math.min(1,Math.atan2(y,Math.hypot(x,z))*1.5));
    const desiredSpeed=Math.max(2,Math.min(50,(o.range-4)*.18)),throttle=z<-.92&&s.ship.speed<desiredSpeed+2?Math.max(.005,Math.min(.2,(o.range-4)/1800)):0;
    await act('setControl',{seq:++seq,ttl:2,steerX,steerY,throttle});await sleep(200);
  }
  check('collection-after-making-hold-space',collected,job);await act('setControl',{seq:++seq,ttl:5,throttle:0,steerX:0,steerY:0});await checkpoint('07-collected');
  check('exact-marker-collected',s.world.cargo.some(c=>c.commodity==='refinedMetals'&&c.units===2),s.world.cargo);
  await savedUntil('collected',snap=>snap?.jobs?.some(j=>j.id===offer.id&&j.collected)&&snap.cargo.some(c=>c.commodity==='refinedMetals'&&c.units===2));s=await reload('08-collected-restored');job=s.jobs.active.find(j=>j.id===offer.id);
  check('collected-save-restored',job?.collected===true&&s.world.cargo.some(c=>c.commodity==='refinedMetals'&&c.units===2),job);
  const credits=s.world.credits,pay=quotedPay;await act('approachDock');s=await wait(s=>s.flags.docked&&s.world.credits===credits+pay&&!s.jobs.active.some(j=>j.id===offer.id),180,'return dock and settlement');await act('openService',{id:'jobs'});s=await checkpoint('09-disposition-paid');
  check('quoted-pay-once',s.world.credits===credits+pay,{credits,pay,after:s.world.credits});check('cargo-retained',s.world.cargo.some(c=>c.commodity==='refinedMetals'&&c.units===2),s.world.cargo);
  const paid=s.world.credits;await savedUntil('paid',snap=>snap?.credits===paid&&!snap.jobs.some(j=>j.id===offer.id&&j.state==='accepted'));s=await reload('10-paid-restored');if(!s.flags.docked){await act(s.station.inZone?'dock':'approachDock');s=await wait(s=>s.flags.docked,150,'redock');}await act('openService',{id:'jobs'});s=await checkpoint('11-redock-no-repeat');
  check('paid-save-no-repeat',s.world.credits===paid&&!s.jobs.active.some(j=>j.id===offer.id),{paid,after:s.world.credits,jobs:s.jobs});
  // Second event fixture exercises short remaining wreck life without waiting
  // ten natural minutes. Only the fixture wreck's expiration is shortened.
  result.expiryFixture=await c.eval(`(()=>{const c=window.__ctx;const p=c.systems[c.world.currentSystem].station.position;const victim=c.ships.find(s=>s.object&&s.record&&!s.state.destroyed&&s.record.role!=='ace');if(!victim)throw Error('No second live NPC');victim.object.position.set(p[0]+850,p[1]+150,p[2]);victim.state.destroyed=true;c.emit('npcDestroyed',{ship:victim});return {victim:victim.id,shortenedRemainingLife:3,beforeWrecks:c.world.aftermath.length};})()`);
  await waitFixtureWreck(result.expiryFixture.beforeWrecks);await act('openService',{id:'jobs'});s=await observe();const expiring=s.jobs.offers.find(j=>j.kind==='recovery'&&j.state==='offered'&&j.originSystem===s.world.currentSystem);check('expiry-fixture-offer',!!expiring,expiring);
  await c.eval(`(()=>{const c=window.__ctx;const j=c.world.jobs.find(j=>j.id===${JSON.stringify(expiring.id)});c.world.aftermath.find(a=>a.id===j.wreckId).expiresAt=c.world.time+3;return true;})()`);
  await act('acceptJob',{id:expiring.id});await wait(s=>!s.jobs.active.some(j=>j.id===expiring.id),15,'expiry');await act('openService',{id:'jobs'});s=await checkpoint('12-expired-clear-guidance');
  check('expiry-no-reward',s.world.credits===paid&&/expired|cold/i.test(JSON.stringify(s.station.view.rows)),{credits:s.world.credits,rows:s.station.view.rows});
  s=await reload('13-expired-restored');check('expiry-no-respawn',!s.jobs.active.some(j=>j.id===expiring.id)&&s.world.credits===paid,s.jobs);
  result.collectionAndDispositionComplete=true;
});
