/** #170/#178 disposable Chromium verification with explicit berth/price fixtures.
 * node scripts/issue-170-desk-live.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE170_OUT || resolve('out/issue-170-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');
await runLive('desk', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Disposable Chromium and real systems frames. Public desk actions with explicit safe-berth placement, remote-posting and price-drift fixtures; no natural flight or native mouse claim.';
  await c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;return true;})()`);
  await sleep(250); await act('dock'); await wait(s => s.flags.docked, 15, 'dock');
  for (const [name,args] of [['acceptJob',{id:'not-real'}],['trade',{commodity:'provisions',qty:1,side:'buy'}],['repairAll',{}],['feed',{kind:'biomass'}]]) {
    const r=await act(name,args,false);assert.equal(r.ok,false);assert.ok(r.token&&r.error);
  }
  await act('openService',{id:'jobs'});
  const before=await observe(), job=before.jobs.offers.find(j=>j.kind==='trade');assert.ok(job);
  result.originalReward=job.reward;
  // One synchronous fixture/read/accept turn prevents tickPrices restoring its
  // random-walk table between the injected drift and the desk reads.
  const evidence=await c.eval(`(()=>{const x=window.__ctx,rw=window.rimward,id=${JSON.stringify(job.id)},key=${JSON.stringify(job.commodity)};
    x.world.prices[key]+=37;
    x.world.jobs.push({id:'issue170-remote',kind:'trade',state:'offered',originSystem:'veridian',commodity:'provisions',need:5,reward:1});
    rw.act({v:2,name:'openService',args:{id:'jobs'}});
    const after=rw.observe(),cards=Array.from(document.querySelectorAll('.job-card'),e=>({title:e.querySelector('.job-title')?.textContent,reward:e.querySelector('.job-reward')?.textContent}));
    const remote=rw.act({v:2,name:'acceptJob',args:{id:'issue170-remote'}});
    const receipt=rw.act({v:2,name:'acceptJob',args:{id}});
    x.world.prices[key]+=61;
    return {after,cards,remote,receipt,frozen:rw.observe().jobs.active.find(j=>j.id===id)};
  })()`);
  assert.ok(!evidence.after.jobs.offers.some(j=>j.id==='issue170-remote'));
  assert.equal(evidence.remote.token,'not-offered');assert.ok(evidence.remote.error);
  const quoted=evidence.after.jobs.offers.find(j=>j.id===job.id);assert.notEqual(quoted.reward,job.reward);
  assert.ok(evidence.cards.some(card=>card.title.includes(job.title)&&card.reward.includes('pays '+quoted.reward+' UU')));
  assert.ok(evidence.receipt.ok&&evidence.receipt.notice.includes('pays '+quoted.reward+' UU'));
  assert.equal(evidence.frozen.reward,quoted.reward);
  result.quote={before:job.reward,after:quoted.reward,receipt:evidence.receipt.notice};
  result.quoteEvidence=evidence;
  await checkpoint('accepted-haul');
  await act('openService',{id:'market'});
  await act('undock');
  assert.equal((await observe()).flags.docked,false);
  assert.equal(await c.eval('window.__ctx.stationDesk.peekService()'),null);
  await checkpoint('market-pane-launched');
  await save();
});
