/** Issue #12 representative native station-board census in disposable Chrome.
 * Run: ISSUE12_OUT=... node scripts/issue-12-live-probe.mjs
 * Reuses the isolated loopback CDP runner. Native RNG and board generators;
 * travel/expiry fixtures are explicit in result.json. No natural flight claim.
 */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE12_OUT || resolve('out/issue-12-live');
// Ignore unrelated resume/port settings: this probe always owns a fresh session.
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const {runLive,sleep}=await import('./issue-74-live-harness.mjs');
const families=['trade','hunt','passenger','explore','espionage','war'];

await runLive('boards',async h=>{
  const {c,result,act,observe,wait,checkpoint,shot,save}=h;
  result.fixture=true;
  result.method='Unmodified native RNG and native Jobs board generation in a fresh Chrome profile. Initial dock uses public actions. Later visits use explicit jumpRequested and safe-berth position fixtures, followed by public dock/openService. Expiry fixtures change only one selected contract deadline and let production ticks replace it. A separate legacy survey fixture moves one native offer to slot 1 and inserts an offered copy. Accept actions invoke production station closures through CDP Runtime.evaluate of the public API; no native mouse or keyboard input is claimed. Passenger payment occurs on production docking; no fabricated kill records, payout, or completion flags.';
  result.boards=[];result.lifecycle=[];result.fixtures=[];
  async function raw(){return c.eval(`JSON.parse(JSON.stringify(window.__ctx.world.jobs))`);}
  const live=(rows,kind,origin)=>rows.filter(j=>j.kind===kind&&j.originSystem===origin&&['offered','accepted'].includes(j.state));
  async function reopen(){await act('openService',{id:'market'});await act('openService',{id:'jobs'});await sleep(150);}
  async function snapshot(label){
    await reopen();
    const obs=await checkpoint(label),rows=await raw();
    const cards=await c.eval(`Array.from(document.querySelectorAll('.job-card'),e=>({title:e.querySelector('.job-title')?.textContent,detail:e.querySelector('.job-detail')?.textContent,reward:e.querySelector('.job-reward')?.textContent,state:e.querySelector('.job-state')?.textContent,accept:e.querySelector('button')?.textContent}))`);
    assert(cards.length>0,'Rendered Jobs cards absent');
    const origin=obs.world.currentSystem,counts=Object.fromEntries(families.map(k=>[k,live(rows,k,origin).length]));
    for(const [k,n] of Object.entries(counts))assert(n<=2,`${origin} ${k} exceeded two live slots`);
    const visibleCopies=cards.map(x=>[x.title?.replace(/^\d+\. /,''),x.detail,x.reward].join('|'));
    const duplicateCopyGroups=[...new Set(visibleCopies)].map(key=>({copy:key,count:visibleCopies.filter(x=>x===key).length})).filter(x=>x.count>1);
    const entry={label,origin,counts,rows,cards,duplicateCopyGroups};result.boards.push(entry);
    for(const [family,title] of [['trade','Haul '],['survey','Survey ']]){
      const found=await c.eval(`(()=>{const e=[...document.querySelectorAll('.job-card')].find(e=>e.querySelector('.job-title')?.textContent.includes(${JSON.stringify(title)})&&(${JSON.stringify(family)}!=='trade'||e.querySelector('.job-detail')?.textContent.startsWith('Buy or hold ')));e?.scrollIntoView({block:'center'});return !!e;})()`);
      if(found)await shot(label+'-'+family);
    }
    await save();return entry;
  }
  async function berth(destination){
    if((await observe()).flags.docked)await act('undock');
    if((await observe()).world.currentSystem!==destination){
      result.fixtures.push({kind:'jumpRequested',destination});
      await c.eval(`window.__ctx.emit('jumpRequested',{to:${JSON.stringify(destination)}});true`);
      await wait(s=>s.world.currentSystem===destination&&!s.gate.jumping,50,'fixture jump '+destination);
    }
    result.fixtures.push({kind:'safe-berth',destination,note:'Player placed 36 units from station, velocity zero; traffic parked away. Native dock action follows.'});
    await c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;return true;})()`);
    await sleep(250);await act('dock');await wait(s=>s.flags.docked,15,'fixture berth');await act('openService',{id:'jobs'});
  }
  let s=await observe();
  if(!s.flags.docked)await act(s.station.inZone?'dock':'approachDock');await wait(s=>s.flags.docked,150,'initial public dock');
  const first=await snapshot('01-native-freehold-board');
  result.initialBoardGeneration='No state fixture or seeded RNG before initial snapshot.';
  // Repeated station closures must preserve the actual offers, not merely count.
  const initialIds=Object.fromEntries(families.map(k=>[k,live(first.rows,k,first.origin).map(j=>j.id).sort()]));
  for(let i=0;i<3;i++)await reopen();
  const repeated=await raw();
  for(const k of families)assert.deepEqual(live(repeated,k,first.origin).map(j=>j.id).sort(),initialIds[k],`${k}: reopen changed live offers`);
  result.repeatedReopen={iterations:3,stableFamilies:families};
  if(process.env.ISSUE12_BASELINE==='1'){
    result.fixture=false;result.mode='baseline-board-only';
    result.method='Fresh isolated Chrome, unmodified native RNG. Public start/origin/dock/openService actions; rendered native Freehold board and three reopen identity checks. No state fixtures. API actions invoke existing station closures; this is not a claim of native mouse or keyboard input.';
    await save();return;
  }

  // A selected live row occupies its original slot after acceptance. Expire
  // that row only and observe the real tick detach/refill exactly one slot.
  for(const kind of families){
    const before=live(await raw(),kind,first.origin),job=before.find(j=>j.state==='offered');
    if(!job){result.lifecycle.push({kind,unavailable:'No native offer at initial board; not fabricated.'});continue;}
    await act('acceptJob',{id:job.id});await reopen();
    const accepted=live(await raw(),kind,first.origin);
    assert.deepEqual(accepted.map(j=>j.id).sort(),before.map(j=>j.id).sort(),kind+' acceptance unexpectedly refilled');
    assert.equal(accepted.find(j=>j.id===job.id)?.state,'accepted',kind+' did not accept');
    if(kind==='passenger'){
      await c.eval(`(()=>{const e=[...document.querySelectorAll('.job-card')].find(e=>e.textContent.includes('Escort passengers')&&e.textContent.includes('ACCEPTED'));e?.scrollIntoView({block:'center'});return !!e;})()`);
      await shot('02-passenger-accepted-slot');
    }
    result.fixtures.push({kind:'selected-deadline-expiry',family:kind,id:job.id});
    await c.eval(`(()=>{const x=window.__ctx,j=x.world.jobs.find(j=>j.id===${JSON.stringify(job.id)});j.deadline=x.world.time-1;return true;})()`);
    for(let i=0;i<80&&(await raw()).some(j=>j.id===job.id);i++)await sleep(150);
    await reopen();const after=live(await raw(),kind,first.origin);
    assert(!after.some(j=>j.id===job.id),kind+' expired row retained');
    assert.equal(after.length,before.length,kind+' expiry changed slot count');
    const removed=before.filter(j=>!after.some(a=>a.id===j.id)),added=after.filter(j=>!before.some(b=>b.id===j.id));
    assert.equal(removed.length,1,kind+' removed unrelated sibling');assert.equal(added.length,1,kind+' replacement not one-in-one-out');
    assert.equal(added[0].slot,job.slot,kind+' replacement changed slot');assert.equal(added[0].state,'offered');
    result.lifecycle.push({kind,before,accepted,after,removed:removed.map(j=>j.id),added:added.map(j=>j.id),pass:true});await save();
  }
  await snapshot('03-freehold-refilled-board');
  // Legacy saves may contain an already accepted slot 1 agreement for the
  // single Freehold landmark. Healing must preserve its complete snapshot.
  const survey=live(await raw(),'explore',first.origin).find(j=>j.state==='offered');
  assert(survey,'Native survey offer missing');
  result.fixtures.push({kind:'legacy-survey-slot-1-with-offered-twin',id:survey.id,note:'Move native offer to legacy slot 1, accept through public closure, insert a slot 0 offered copy. No completion, payout, or visit fixture.'});
  await c.eval(`(()=>{const j=window.__ctx.world.jobs.find(j=>j.id===${JSON.stringify(survey.id)});j.slot=1;return true;})()`);
  await act('acceptJob',{id:survey.id});
  const legacyAccepted=(await raw()).find(j=>j.id===survey.id);
  await c.eval(`(()=>{const x=window.__ctx,j=x.world.jobs.find(j=>j.id===${JSON.stringify(survey.id)});const twin={...j,id:'explore-freehold-9000001',slot:0,state:'offered'};delete twin.payQuoted;x.world.jobs.push(twin);return true;})()`);
  await reopen();const legacyAfter=live(await raw(),'explore',first.origin);
  assert.deepEqual(legacyAfter,[legacyAccepted],'Legacy accepted slot 1 changed or duplicate offered survey survived');
  result.legacySurvey={before:legacyAccepted,after:legacyAfter,pass:true};
  await checkpoint('03a-legacy-slot1-preserved');
  result.fixtures.push({kind:'selected-deadline-expiry',family:'explore',id:survey.id,legacy:true});
  await c.eval(`(()=>{const x=window.__ctx;x.world.jobs.find(j=>j.id===${JSON.stringify(survey.id)}).deadline=x.world.time-1;return true;})()`);
  for(let i=0;i<80&&(await raw()).some(j=>j.id===survey.id);i++)await sleep(150);
  await reopen();assert.equal(live(await raw(),'explore',first.origin).length,1,'Legacy survey expiry did not refill unique objective');
  // Two visually identical passenger papers are independent booked parties.
  const passengers=live(await raw(),'passenger',first.origin).filter(j=>j.state==='offered');
  assert.equal(passengers.length,2,'Two separate passenger parties expected');
  for(const j of passengers)await act('acceptJob',{id:j.id});
  const agreements=live(await raw(),'passenger',first.origin);
  assert.equal(agreements.filter(j=>j.state==='accepted').length,2);
  const beforeCredits=(await observe()).world.credits,pay=agreements.reduce((n,j)=>n+j.payQuoted,0),destination=agreements[0].destSystem;
  assert(agreements.every(j=>j.destSystem===destination),'Passenger paired destination changed');
  await checkpoint('04-two-passenger-agreements');await berth(destination);
  await wait(s=>s.world.credits===beforeCredits+pay,15,'production passenger settlement');
  const afterSettlement=live(await raw(),'passenger',first.origin);
  assert.equal(afterSettlement.length,2);assert(afterSettlement.every(j=>j.state==='offered'&&!agreements.some(a=>a.id===j.id)));
  result.passengerSettlement={agreements,beforeCredits,quotedTotal:pay,afterCredits:(await observe()).world.credits,afterSettlement,pass:true};
  await snapshot('05-destination-native-board');
  // Hollow Reach has distinct native survey landmarks; generated stations
  // commonly have only one. Record both without fabricating board rows.
  await berth('hollowreach');await snapshot('06-hollowreach-distinct-surveys');
  const generated=await c.eval(`(async()=>{const {AUTHORED_SYSTEMS}=await import('/src/game/authored-systems.js');const x=window.__ctx;return Object.keys(x.systems).find(id=>!Object.hasOwn(AUTHORED_SYSTEMS,id)&&x.systems[id].station&&x.systems[id].gates?.length);})()`);
  if(generated){await berth(generated);await snapshot('07-generated-native-board');result.additionalStation=generated;}
  await berth(first.origin);await snapshot('08-return-origin-refill');
  const returned=live(await raw(),'passenger',first.origin);
  assert.deepEqual(returned.map(j=>j.id).sort(),afterSettlement.map(j=>j.id).sort(),'Return board replaced fresh passenger offers');
  result.coverage={familiesOnInitialBoard:families.filter(k=>first.counts[k]>0),slotLifecycleFamilies:result.lifecycle.filter(x=>x.pass).map(x=>x.kind),nativeBoards:result.boards.map(b=>b.origin)};
  await save();
});
