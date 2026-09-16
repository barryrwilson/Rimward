/** #223 native Chromium: real frames, public desk actions, disclosed berth fixture. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE223_OUT || resolve('out/issue-223-live');
process.env.ISSUE74_PORT = process.env.ISSUE223_PORT || '5223';
delete process.env.ISSUE74_RESUME_PROFILE;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');
await runLive('haul-quote', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.method = 'Disposable Chromium, real game frames, safe-berth and price fixtures. Public agent desk actions and rendered DOM; no natural-flight claim.';
  await c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;})()`);
  await sleep(250); await act('dock'); await wait(s => s.flags.docked, 15, 'dock');
  await act('openService', { id: 'jobs' });
  result.quotes = [];
  for (const drift of [false, true]) {
    const posted = await c.eval(`(()=>{const rw=window.rimward,j=rw.observe().jobs.offers.find(j=>j.kind==='trade');const card=Array.from(document.querySelectorAll('.job-card')).find(e=>e.querySelector('.job-title')?.textContent.includes(j.title));return {job:j,line:card.querySelector('.job-reward').textContent,t:rw.observe().t};})()`);
    assert.ok(posted.line.includes(`pays ${posted.job.reward} UU`));
    if (drift) {
      await c.eval(`window.__ctx.world.prices[${JSON.stringify(posted.job.commodity)}]+=73`);
      await wait(s => s.t >= posted.t + 3, 10, 'passive redraw across price drift');
    }
    const evidence = await c.eval(`(()=>{const rw=window.rimward,id=${JSON.stringify(posted.job.id)},title=${JSON.stringify(posted.job.title)};const card=()=>Array.from(document.querySelectorAll('.job-card')).find(e=>e.querySelector('.job-title')?.textContent.includes(title));const before=rw.observe().jobs.offers.find(j=>j.id===id);const line=card().querySelector('.job-reward').textContent;const receipt=rw.act({v:2,name:'acceptJob',args:{id}});const after=rw.observe().jobs.active.find(j=>j.id===id);return {before,line,receipt,after,acceptedLine:card().querySelector('.job-reward').textContent,repeat:rw.act({v:2,name:'acceptJob',args:{id}})};})()`);
    const quote = posted.job.reward;
    assert.equal(evidence.before.reward, quote);
    assert.ok(evidence.line.includes(`pays ${quote} UU`));
    assert.equal(evidence.receipt.ok, true);
    assert.ok(evidence.receipt.notice.includes(`pays ${quote} UU`));
    assert.equal(evidence.after.reward, quote);
    assert.equal(evidence.after.payQuoted, quote);
    assert.ok(evidence.acceptedLine.includes(`pays ${quote} UU`));
    assert.equal(evidence.repeat.ok, false);
    result.quotes.push({ drift, posted, evidence });
  }
  await checkpoint('accepted-stable-haul-quotes');
  assert.equal((await observe()).flags.docked, true);
}, { seed: 223 });
