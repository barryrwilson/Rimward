/** Continue an EXACT successful paid fixture profile after actual Browser.close.
 * Requires ISSUE74_OUT, ISSUE74_RESUME_PROFILE and original ISSUE74_PORT.
 * Earlier lifecycle run remains FAIL; this is explicitly a supplemental run.
 */
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {runLive,out,sleep} from './issue-74-live-harness.mjs';
if(!process.env.ISSUE74_RESUME_PROFILE||!process.env.ISSUE74_PORT)throw Error('Exact controlled profile and original origin required');
const previousPath=join(out,'fixture-lifecycle','result.json');
const previous=JSON.parse(await readFile(previousPath,'utf8'));
if(!previous.checks?.['quoted-pay-once']?.pass||!previous.checks?.['collected-save-restored']?.pass||!previous.closedPorts?.cdp||!previous.closedPorts?.vite)throw Error('Prior successful payment and verified shutdown required');
await runLive(process.env.ISSUE74_FINALIZE_NAME||'fixture-finalize',async h=>{
  const {c,result,observe,act,wait,checkpoint,save}=h;
  result.fixture=true;result.fixtureNote='Supplement resumes the exact prior paid controlled profile on its original loopback origin after verified Browser.close. Explicit safe berth placement avoids replaying previously proven ordinary return flight; no travel time or cost claimed for this placement. One additional injected NPC destruction event has its wreck lifetime shortened to3world seconds for expiry coverage; no natural availability or combat kill claim.';
  result.priorEvidence={path:previousPath,verdict:previous.verdict,sourceHash:previous.sourceHashEnd,successfulPins:Object.entries(previous.checks).filter(([,v])=>v.pass).map(([k])=>k)};
  result.checks={};const check=(name,pass,detail)=>{result.checks[name]={pass:!!pass,detail};console.log(pass?'PASS':'FAIL',name);if(!pass)throw Error(name+' '+JSON.stringify(detail));};
  const paid=previous.persistence.paid.credits,originalId=previous.checks['injected-event-offer'].detail.id;
  let s=await checkpoint('01-paid-browser-restart');check('actual-browser-restart-restores-payment',s.world.credits===paid&&!s.jobs.active.some(j=>j.id===originalId),{expected:paid,actual:s.world.credits,jobs:s.jobs});
  await act('cancelAutopilot',{},false);
  result.berthPlacement=await c.eval(`(()=>{const c=window.__ctx,p=c.systems[c.world.currentSystem].station.position;c.ship.object.position.set(p[0]+36,p[1],p[2]);c.ship.velocity.set(0,0,0);c.ship.speed=0;return {fixture:'safe berth only',credits:c.world.credits,cargo:JSON.parse(JSON.stringify(c.cargo))};})()`);await wait(s=>s.station.inZone,10,'fixture berth readiness');
  async function dock(){let s=await observe();if(!s.flags.docked){await act(s.station.inZone?'dock':'approachDock');s=await wait(s=>s.flags.docked,120,'direct berth or approach');}await act('openService',{id:'jobs'});return observe();}
  s=await dock();s=await checkpoint('02-redock-no-repeat');check('redock-no-duplicate-payment',s.world.credits===paid&&!s.jobs.active.some(j=>j.id===originalId),s.world);
  const guide=s.station.view.rows.filter(r=>/SALVAGE|station-to-gate|No salvage income/.test(r.text)),panel=await c.eval("document.querySelector('.station-panel')?.innerText||''");
  check('final-guide-shared-by-ui-and-api',guide.length===3&&guide.every(r=>panel.replace(/\s+/g,' ').includes(r.text.replace(/\s+/g,' '))),{guide,panel});
  await c.eval("document.querySelector('.station-panel .screen-note')?.scrollIntoView({block:'start'})");await checkpoint('02a-current-salvage-guide');
  await c.eval(`(()=>{const card=[...document.querySelectorAll('.job-card')].find(e=>/Recovery: wreck salvage/.test(e.textContent));card?.scrollIntoView({block:'center'});return !!card;})()`);await checkpoint('02b-completed-card');
  result.expiryFixture=await c.eval(`(()=>{const c=window.__ctx;const p=c.systems[c.world.currentSystem].station.position;const victim=c.ships.find(s=>s.object&&s.record&&!s.state.destroyed&&s.record.role!=='ace');if(!victim)throw Error('No live NPC for fixture');victim.object.position.set(p[0]+850,p[1]+150,p[2]);victim.state.destroyed=true;c.emit('npcDestroyed',{ship:victim});return {victim:victim.id,beforeIds:c.world.aftermath.map(a=>a.id),remainingFixtureLife:3};})()`);
  let newWreck=null;for(let i=0;i<100;i++){newWreck=await c.eval(`window.__ctx.world.aftermath.find(a=>!${JSON.stringify(result.expiryFixture.beforeIds)}.includes(a.id))?.id`);if(newWreck)break;await sleep(200);}check('injected-expiry-aftermath-staged',!!newWreck,result.expiryFixture);
  await act('openService',{id:'jobs'});s=await observe();const offer=s.jobs.offers.find(j=>j.id==='recovery-'+newWreck&&j.kind==='recovery'&&j.state==='offered'&&j.originSystem===s.world.currentSystem);check('new-local-expiry-offer',!!offer,offer);
  await c.eval(`(()=>{const c=window.__ctx,j=c.world.jobs.find(j=>j.id===${JSON.stringify(offer.id)});c.world.aftermath.find(a=>a.id===j.wreckId).expiresAt=c.world.time+3;return true;})()`);
  result.acceptReceipt=await act('acceptJob',{id:offer.id});s=await wait(s=>s.jobs.offers.some(j=>j.id===offer.id&&j.state==='failed'),15,'expiry terminal state');await act('openService',{id:'jobs'});
  await c.eval(`(()=>{const card=[...document.querySelectorAll('.job-card')].find(e=>/Cannot recover: wreck or marker expired/.test(e.textContent));card?.scrollIntoView({block:'center'});return !!card;})()`);s=await checkpoint('03-expired-card');
  check('expired-no-payment-clear-ui',s.world.credits===paid&&/wreck or marker expired/.test(JSON.stringify(s.station.view.rows)),{credits:s.world.credits,rows:s.station.view.rows});
  let saved=null;for(let i=0;i<80;i++){saved=await c.eval(`(()=>{const x=JSON.parse(localStorage.getItem('rimward-save-v1'));return {credits:x?.world?.credits,jobs:x?.world?.jobs?.filter(j=>j.kind==='recovery'),cargo:x?.cargo};})()`);if(saved?.jobs?.some(j=>j.id===offer.id&&j.state==='failed'))break;await sleep(200);}check('expiry-failure-saved',saved?.jobs?.some(j=>j.id===offer.id&&j.state==='failed'),saved);result.persistence=saved;
  await c.send('Page.reload',{ignoreCache:true});await sleep(1500);for(let i=0;i<150;i++){if(await c.eval('!!window.rimward'))break;await sleep(200);}s=await observe();if(s.session.phase==='title')await act('startGame');await wait(s=>s.session.phase==='playing',20,'expiry reload');s=await checkpoint('04-expired-reloaded');
  check('expired-reload-no-active-marker-or-payment',s.world.credits===paid&&!s.jobs.active.some(j=>j.id===offer.id),s.jobs);
  result.markerCount=await c.eval(`window.__ctx.pods.filter(p=>p.recoveryJob?.id===${JSON.stringify(offer.id)}).length`);check('expired-marker-not-respawned',result.markerCount===0,result.markerCount);
  s=await dock();s=await checkpoint('05-expired-redock-no-repeat');check('final-redock-keeps-payment-once',s.world.credits===paid,s.world);result.supplementComplete=true;await save();
});
