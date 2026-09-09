/** Repeated natural availability samples. No state injection, seeded RNG, or fixtures.
 * ISSUE74_OUT=... node scripts/issue-74-natural-live-probe.mjs
 * Each run is a distinct untouched Chrome profile; game RNG remains native.
 */
import {runLive,sleep} from './issue-74-live-harness.mjs';
const count=Number(process.env.ISSUE74_PROFILES||3);
for(let i=1;i<=count;i++)await runLive('natural-'+i,async h=>{
  const {result,act,observe,wait,checkpoint,save}=h;
  result.method='Fresh isolated profile; native unseeded RNG. Ordinary public API actions only. Same Freehold board -> station/gate traffic scan -> Veridian board route. No opportunity guarantee.';
  result.seed=null;result.rng='unmodified native Math.random';
  result.timing={activeSearchWorldSeconds:0,activeSearchWallSeconds:0,navigationWorldSeconds:0,navigationWallSeconds:0,collectionDispositionWorldSeconds:0,collectionDispositionWallSeconds:0,nonSearchSetupInspectionControllerWallSeconds:0};
  const overhead=()=>{result.timing.nonSearchSetupInspectionControllerWallSeconds=Math.max(0,(Date.now()-Date.parse(result.started))/1000-result.timing.activeSearchWallSeconds-result.timing.navigationWallSeconds-result.timing.collectionDispositionWallSeconds);};
  const fresh=await checkpoint('01-fresh-greenhand');
  if(fresh.world.credits!==350||fresh.world.cargoCapacity!==20||fresh.world.cargo.length)throw Error('Not stock Greenhand');
  result.stockStart=fresh.world;
  let controlSeq=0,followingIncidental=false;
  const sample=s=>{
    const pods=s.targets.nearby.filter(t=>t.kind==='pod');
    const disabled=s.targets.current?.disabled?[s.targets.current]:[];
    const recoveries=[...(s.jobs.offers||[]),...(s.jobs.active||[])].filter(j=>j.kind==='recovery'&&['offered','accepted'].includes(j.state)&&j.originSystem===s.world.currentSystem);
    result.samples.push({wall:Date.now(),t:s.t,system:s.world.currentSystem,pods,disabled,recoveries,selected:s.targets.current,nearbyCount:s.targets.nearby.length});
    if(!result.firstActualOpportunity&&(pods.length||recoveries.length))result.firstActualOpportunity=result.samples.at(-1);
  };
  async function dismissHail(s){if(!s.hail.open)return s;const intent=s.hail.intents.includes('letGo')?'letGo':null;if(!intent){result.pendingHail=s.hail;return s;}const receipt=await act('hailResolve',{intent,expectedConversationId:s.hail.conversationId});(result.overlayResolutions??=[]).push({t:s.t,hail:s.hail,receipt});return observe();}
  async function steer(o,s,max=.5){const [x,y,z]=o.bearing,steerX=Math.max(-1,Math.min(1,Math.atan2(x,-z)*1.5)),steerY=Math.max(-1,Math.min(1,Math.atan2(y,Math.hypot(x,z))*1.5));const desiredSpeed=Math.max(2,Math.min(110,(o.range-4)*.18)),throttle=z<-.92&&s.ship.speed<desiredSpeed+2?Math.max(.005,Math.min(max,(o.range-4)/1800)):0;await act('setControl',{seq:++controlSeq,ttl:2,steerX,steerY,throttle});}
  async function followIncidental(s){
    if(followingIncidental||result.incidental||s.flags.docked)return false;
    if(s.hail.open)s=await dismissHail(s);
    const pod=s.targets.nearby.find(t=>t.kind==='pod'),hulk=s.targets.current?.hail?.available&&s.targets.current?.hail?.state==='salvage'?s.targets.current:null;
    if(!pod&&!hulk)return false;followingIncidental=true;const attemptWorld=s.t,attemptWall=Date.now();
    result.incidental={kind:pod?'ambient-pod':'disabled-hull',start:s,receipts:[]};await act('cancelAutopilot',{},false);await act('setControl',{seq:++controlSeq,ttl:5,throttle:0,steerX:0,steerY:0});
    if(hulk&&!pod){await act('hail');s=await wait(s=>s.hail.open,10,'natural salvage hail');result.incidental.hail=s.hail;const cargo=s.hail.intents.includes('demandCargo');if(!cargo){await act('hailResolve',{intent:'letGo',expectedConversationId:s.hail.conversationId});result.incidental.unavailable='Disabled hull has no salvage cargo in its displayed hail terms.';(result.unavailableHulkInspections??=[]).push(result.incidental);result.incidental=null;followingIncidental=false;await act('clearControl');return true;}result.firstActualOpportunity??={t:s.t,system:s.world.currentSystem,hail:s.hail};await act('hailResolve',{intent:'demandCargo',expectedConversationId:s.hail.conversationId});}
    const beforeUnits=s.world.cargo.reduce((n,c)=>n+c.units,0),end=Date.now()+180000;let collected=false;
    while(Date.now()<end){s=await dismissHail(await observe());sample(s);if(s.world.cargo.reduce((n,c)=>n+c.units,0)>beforeUnits){collected=true;break;}const p=s.targets.nearby.filter(t=>t.kind==='pod'&&t.bearing).sort((a,b)=>a.range-b.range)[0];if(!p){await sleep(250);continue;}await steer(p,s,.35);await sleep(200);}
    if(!collected){result.incidental.observedNotCollectible={reason:'No cargo increase within bounded public-bearing pursuit; visibility alone does not establish collectibility.',t:s.t,lastPods:s.targets.nearby.filter(t=>t.kind==='pod')};result.incidental.end=await checkpoint('natural-incidental-not-collected');result.timing.collectionDispositionWorldSeconds+=s.t-attemptWorld;result.timing.collectionDispositionWallSeconds+=(Date.now()-attemptWall)/1000;followingIncidental=false;await act('clearControl');return true;}
    await act('setControl',{seq:++controlSeq,ttl:5,throttle:0,steerX:0,steerY:0});result.incidental.collection=await checkpoint('natural-incidental-collected');
    await act('clearControl');await act('approachDock');s=await wait(s=>s.flags.docked,180,'natural incidental disposition');
    for(const row of [...s.world.cargo]){
      if(row.commodity==='survivor'){await act('openService',{id:'people'});s=await observe();let a=s.station.view.actions.find(a=>/Return survivors/i.test(a.label));if(!a){result.incidental.survivorLead={faction:row.faction,rows:s.station.view.rows};const route=await act('plotRoute',{dest:row.faction},false);if(!route.ok){result.incidental.pendingDisposition='Survivors require an eligible faction dock; public route to their faction was unavailable.';throw Error(result.incidental.pendingDisposition);}await act('undock');await act('engageAutopilot');await wait(s=>s.world.currentSystem===row.faction&&!s.gate.jumping,360,'survivor faction route');await act('approachDock');await wait(s=>s.flags.docked,180,'eligible survivor dock');await act('openService',{id:'people'});s=await observe();a=s.station.view.actions.find(a=>/Return survivors/i.test(a.label));if(!a){result.incidental.pendingDisposition='Reached faction route but eligible survivor return is still unavailable; captured People guidance.';throw Error(result.incidental.pendingDisposition);}}result.incidental.receipts.push(await act('stationAction',{n:a.n,expect:a.label}));}
      else{await act('openService',{id:'market'});result.incidental.receipts.push(await act('trade',{commodity:row.commodity,qty:row.units,side:'sell'}));}
    }
    result.incidental.disposition=await checkpoint('natural-incidental-disposed');result.incidental.complete=true;result.timing.collectionDispositionWorldSeconds+=result.incidental.disposition.t-attemptWorld;result.timing.collectionDispositionWallSeconds+=(Date.now()-attemptWall)/1000;followingIncidental=false;return true;
  }
  async function navigate(label,action,pred,seconds){const a=await observe(),wall=Date.now(),earningWorld=result.timing.collectionDispositionWorldSeconds,earningWall=result.timing.collectionDispositionWallSeconds;let retries=0,lastActionT=a.t;await action();const s=await wait(pred,seconds,label,async s=>{sample(s);if(await followIncidental(s)){s=await observe();if(!pred(s)){if(s.flags.docked)await act('undock');await action();lastActionT=s.t;}}else if(!pred(s)&&!s.flags.docked&&!s.hail.open&&!s.gate.jumping&&!s.autopilot.engaged&&s.t-lastActionT>2){(result.navigationInterruptions??=[]).push({label,t:s.t,reason:s.autopilot.reason,retry:retries+1});if(retries++>=2)throw Error('Bounded navigation interrupted after two public AP retries: '+label+' '+s.autopilot.reason);await action();lastActionT=s.t;}});result.timing.navigationWorldSeconds+=s.t-a.t-(result.timing.collectionDispositionWorldSeconds-earningWorld);result.timing.navigationWallSeconds+=(Date.now()-wall)/1000-(result.timing.collectionDispositionWallSeconds-earningWall);return s;}
  async function board(label){await act('openService',{id:'jobs'});await sleep(500);const s=await checkpoint(label);sample(s);const rows=JSON.stringify(s.station.view?.rows);if(!/SALVAGE/i.test(rows))throw Error('Salvage guide absent');const panel=result.checkpoints.at(-1).panel,guide=s.station.view.rows.filter(r=>/SALVAGE|station-to-gate|next dock/.test(r.text));if(!panel||!guide.every(r=>panel.text.replace(/\s+/g,' ').includes(r.text.replace(/\s+/g,' '))))throw Error('Guide is not shared with rendered .station-panel');if(!result.firstLead)result.firstLead={t:s.t,system:s.world.currentSystem,rows:s.station.view.rows};return s;}
  async function finishRecovery(offer){
    result.naturalRecovery={offer,actionsStart:result.actions.length};
    let s=await observe();const recoveryStart=s.t,recoveryWall=Date.now(),before=s.world.credits,quoteText=await h.c.eval(`(()=>{const card=[...document.querySelectorAll('.job-card')].find(e=>/Recovery: wreck salvage/.test(e.textContent));return card?.querySelector('.job-reward')?.textContent||'';})()`),pay=Number(quoteText.match(/pays\s+(\d+)\s+UU/i)?.[1]);if(!Number.isFinite(pay))throw Error('Natural recovery lacks visible quote');result.naturalRecovery.quoteText=quoteText;await act('acceptJob',{id:offer.id});await act('undock');
    let done=false;const end=Date.now()+300000;
    while(Date.now()<end){s=await dismissHail(await observe());sample(s);const j=s.jobs.active.find(j=>j.id===offer.id),o=j?.objective;
      if(j?.collected){done=true;break;}if(!o?.bearing||o.status!=='available')throw Error('Natural recovery lost its public lead '+JSON.stringify(o));
      await steer(o,s);await sleep(200);
    }
    if(!done)throw Error('Natural recovery collection timed out');await act('setControl',{seq:++controlSeq,ttl:5,throttle:0,steerX:0,steerY:0});await checkpoint('natural-recovery-collected');
    await act('clearControl');await act('approachDock');await wait(s=>s.flags.docked&&s.world.credits===before+pay&&!s.jobs.active.some(j=>j.id===offer.id),180,'natural recovery disposition');await act('openService',{id:'jobs'});s=await checkpoint('natural-recovery-paid');
    if(s.world.credits!==before+pay)throw Error('Natural recovery payment mismatch');result.naturalRecovery={...result.naturalRecovery,beforeCredits:before,quotedPay:pay,after:s.world,complete:true};
    result.noOpportunity=false;result.final=s.world;result.timing.collectionDispositionWorldSeconds+=s.t-recoveryStart;result.timing.collectionDispositionWallSeconds+=(Date.now()-recoveryWall)/1000;overhead();await save();
  }
  await navigate('initial-dock',async()=>act((await observe()).station.inZone?'dock':'approachDock'),s=>s.flags.docked,150);
  let s=await board('02-freehold-jobs');
  if(s.jobs.offers.some(j=>j.kind==='recovery'&&j.state==='offered'&&j.originSystem===s.world.currentSystem)){await finishRecovery(s.jobs.offers.find(j=>j.kind==='recovery'&&j.state==='offered'&&j.originSystem===s.world.currentSystem));return;}
  const start=await observe(),wall=Date.now(),watchEarningWorld=result.timing.collectionDispositionWorldSeconds,watchEarningWall=result.timing.collectionDispositionWallSeconds;await act('undock');
  const checkedShips=new Set();
  while((s=await observe()).t-start.t-(result.timing.collectionDispositionWorldSeconds-watchEarningWorld)<25){sample(s);if(await followIncidental(s)){s=await observe();if(s.flags.docked)await act('undock');}const next=s.targets.nearby.find(t=>t.kind==='ship'&&!checkedShips.has(t.id));if(next){const r=await act('selectTarget',{id:next.id},false);if(r.ok){checkedShips.add(next.id);s=await observe();sample(s);if(await followIncidental(s)){s=await observe();if(s.flags.docked)await act('undock');}}}await sleep(350);}
  result.selectedShips=[...checkedShips];
  result.timing.activeSearchWorldSeconds+=s.t-start.t-(result.timing.collectionDispositionWorldSeconds-watchEarningWorld);result.timing.activeSearchWallSeconds+=(Date.now()-wall)/1000-(result.timing.collectionDispositionWallSeconds-watchEarningWall);
  await checkpoint('03-station-watch');
  await navigate('Freehold-Veridian-transit',async()=>{await act('plotRoute',{dest:'veridian'});await act('engageAutopilot');},s=>s.world.currentSystem==='veridian'&&!s.gate.jumping,360);
  await checkpoint('04-veridian-arrival');
  await navigate('Veridian-dock',async()=>act((await observe()).station.inZone?'dock':'approachDock'),s=>s.flags.docked,180);
  s=await board('05-veridian-jobs');
  if(s.jobs.offers.some(j=>j.kind==='recovery'&&j.state==='offered'&&j.originSystem===s.world.currentSystem)){await finishRecovery(s.jobs.offers.find(j=>j.kind==='recovery'&&j.state==='offered'&&j.originSystem===s.world.currentSystem));return;}
  result.final=s.world;result.observations=result.samples.length;
  result.noOpportunity=!result.firstActualOpportunity;
  if(result.firstActualOpportunity&&!result.incidental?.complete&&!result.incidental?.observedNotCollectible)throw Error('Natural opportunity observed without recorded collection outcome');
  if(result.noOpportunity)result.noOpportunityExplanation='No recovery offer or publicly visible pod appeared in this bounded route; selected ship conditions found no actionable disabled-hull salvage cargo. Unselected nearby hulls were not classified. Guidance truthfully explains real-wreck dependence and directs another activity; no spawn-rate/scarcity claim follows.';
  result.timing.scope='Active search is the 25-world-second station watch including individual ship selections; navigation is separately timed and opportunistically observed. Non-search overhead includes server/browser startup, boot, screenshots, board inspection and controller/tool delays. These components are not separately resolved and are not claimed as player search cost or controller thinking time.';
  overhead();
  await save();
});
