/** #176 disposable Chromium verification of the rendered two-gate posting.
 * Real browser, real station DOM, real board refresh and the real accept path.
 * Explicit berth/cash fixtures only; no natural flight.
 * node scripts/issue-176-two-gate-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE176_OUT || resolve('out/issue-176-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('two-gate-jobs', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.method = 'Disposable Chromium and real systems frames. Explicit safe-berth placement and a fixed cash balance; the jobs board is read out of the live DOM and the posting is taken through the real acceptJob path.';

  const placeAtBerth = () => c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;x.world.credits=20000;return true;})()`);

  // Every rendered job card, straight out of the live DOM.
  const cards = () => c.eval(`(()=>Array.from(document.querySelectorAll('.job-card'),card=>({
    title:card.querySelector('.job-title')?.textContent||'',
    detail:card.querySelector('.job-detail')?.textContent||'',
    reward:card.querySelector('.job-reward')?.textContent||'',
    state:Array.from(card.querySelectorAll('.job-state'),n=>n.textContent).join(' | ')
  })))()`);

  // The charted-ring distance of every live transport posting at this board.
  const runs = () => c.eval(`(()=>{const x=window.__ctx,here=x.world.currentSystem;
    const hops=(from,to)=>{if(!from||!to)return 1;const seen={[from]:0};const q=[from];
      while(q.length){const cur=q.shift();if(cur===to)return seen[cur];
        const def=x.systems[cur]||null;const outs=[];
        for(const g of (def?.gates||[]))if(g?.to)outs.push(g.to);
        for(const r of (def?.hub?.routes||[]))outs.push(r);
        for(const n of outs)if(!(n in seen)){seen[n]=seen[cur]+1;q.push(n);}}
      return null;};
    return (x.world.jobs||[]).filter(j=>j&&['trade','passenger','ferry'].includes(j.kind)
      &&(j.state==='offered'||j.state==='accepted')
      &&(j.kind==='ferry'?(j.state==='offered'||j.originSystem===here):j.originSystem===here))
      .map(j=>({id:j.id,kind:j.kind,state:j.state,origin:j.originSystem,dest:j.destSystem,
        reward:j.reward,payQuoted:j.payQuoted??null,
        hops:j.destSystem?hops(j.kind==='ferry'&&j.state==='offered'?here:j.originSystem,j.destSystem):1}));})()`);

  const stationName = (id) => c.eval(`(window.__ctx.systems[${JSON.stringify(id)}]?.station?.name)||null`);

  // Bring one named card into the viewport so the screenshot shows the posting
  // under test, not whichever rows happen to sit at the top of the board.
  const scrollToCard = async (needle) => {
    const rect = await c.eval(`(()=>{const card=Array.from(document.querySelectorAll('.job-card')).find(el=>(el.textContent||'').includes(${JSON.stringify(needle)}));if(!card)return null;card.scrollIntoView({block:'center'});const r=card.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight,text:card.innerText};})()`);
    assert.ok(rect, 'the card is on the board: ' + needle);
    await sleep(300);
    const settled = await c.eval(`(()=>{const card=Array.from(document.querySelectorAll('.job-card')).find(el=>(el.textContent||'').includes(${JSON.stringify(needle)}));if(!card)return null;const r=card.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight,text:card.innerText};})()`);
    assert.ok(settled && settled.top >= 0 && settled.bottom <= settled.viewport,
      'the card is fully inside the viewport for the screenshot: ' + JSON.stringify(settled));
    return settled;
  };

  await placeAtBerth();
  await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked, 15, 'dock');
  await act('openService', { id: 'jobs' });
  await sleep(400);

  // --- exactly one two-gate posting, and it is not the tutorial consignment -
  const posted = await runs();
  result.postings = posted;
  const long = posted.filter((j) => j.hops >= 2);
  assert.equal(long.length, 1, 'exactly one two-gate posting: ' + JSON.stringify(posted));
  assert.ok(posted.length >= 4, 'the board still posts one-gate transport work');
  assert.notEqual(long[0].kind, 'ferry', 'a renewable slot carries the long run');
  const farName = await stationName(long[0].dest);
  const nearName = await stationName(await c.eval('window.__ctx.systems[window.__ctx.world.currentSystem].gates[0].to'));
  result.longRun = { ...long[0], farName, nearName };
  result.offeredShot = await scrollToCard(farName);
  await checkpoint('board');

  // --- the rendered card names the far dock AND the distance ---------------
  const drawn = await cards();
  result.cards = drawn;
  const far = drawn.filter((card) => `${card.detail} ${card.reward}`.includes(farName));
  assert.equal(far.length, 1, `one card names ${farName}: ` + JSON.stringify(drawn, null, 1));
  assert.ok(far[0].detail.includes(farName), `detail names the far dock: ${far[0].detail}`);
  assert.ok(far[0].detail.includes('2 jumps'), `detail states the distance: ${far[0].detail}`);
  assert.ok(far[0].reward.includes('2 jumps'), `reward line states the distance: ${far[0].reward}`);
  assert.ok(!far[0].detail.includes(nearName), `detail must not name ${nearName}: ${far[0].detail}`);

  const nearCards = drawn.filter((card) => card.reward.includes(nearName) && card.reward.includes('1 jump'));
  assert.ok(nearCards.length >= 1, 'one-gate cards still name the adjacent dock and their distance');

  // --- taking it keeps the posted far dock and stamps a scaled quote -------
  const accepted = await act('acceptJob', { id: long[0].id });
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  await sleep(400);
  const afterAccept = (await runs()).find((j) => j.id === long[0].id);
  result.accepted = afterAccept;
  assert.equal(afterAccept.state, 'accepted');
  assert.equal(afterAccept.dest, long[0].dest, 'accept kept the posted far dock');
  assert.equal(afterAccept.hops, 2, 'the agreement is still a two-gate run');
  assert.ok(afterAccept.payQuoted > 0, `stamped quote ${afterAccept.payQuoted}`);

  const obs = await observe();
  const seen = (obs.jobs?.active ?? []).find((j) => j.id === long[0].id);
  assert.ok(seen, 'observe() reports the accepted two-gate agreement');
  assert.equal(seen.destSystem, long[0].dest, 'observe() names the far dock');

  // --- redraws cannot farm a second long run or move the agreement ---------
  for (let i = 0; i < 3; i++) {
    await act('openService', { id: 'market' });
    await act('openService', { id: 'jobs' });
    await sleep(250);
  }
  const held = await runs();
  result.afterRedraws = held;
  const stillLong = held.filter((j) => j.hops >= 2);
  assert.equal(stillLong.length, 1, 'a redraw farmed a second long run: ' + JSON.stringify(held));
  assert.equal(stillLong[0].id, long[0].id, 'the accepted agreement holds the seat');
  assert.equal(stillLong[0].payQuoted, afterAccept.payQuoted, 'the stamped quote did not move');

  const acceptedCard = (await cards()).find((card) => card.reward.includes(farName));
  result.acceptedCard = acceptedCard ?? null;
  assert.ok(acceptedCard, 'the accepted two-gate card is still drawn');
  assert.ok(/ACCEPTED/.test(acceptedCard.state), `accepted state line: ${acceptedCard.state}`);
  result.acceptedShot = await scrollToCard(farName);
  await checkpoint('accepted');
});
