/** Focused real-Chromium desk verification. Berth/cargo fixtures are explicit;
 * travel and earned resources are not claimed as natural play.
 * node scripts/issue-203-205-209-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT ||= resolve('out/issues-203-205-209/live');
delete process.env.ISSUE74_RESUME_PROFILE;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('desk-clarity', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Isolated headless Chromium, loopback Vite, actual rendered desk and public actions. Explicit berth placement, cargo and credits fixtures; generated spy contract accepted normally. No natural flight claimed.';
  result.networkFailures = [];
  await c.send('Network.enable');
  c.ws.addEventListener('message', e => {
    const m = JSON.parse(String(e.data));
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400)
      result.networkFailures.push({ url: m.params.response.url, status: m.params.response.status });
    if (m.method === 'Network.loadingFailed') result.networkFailures.push(m.params);
  });
  const berth = async system => {
    await c.eval(`(()=>{const x=window.__ctx;if(x.flags.docked)x.stationDesk.undock();
      if(x.world.currentSystem!==${JSON.stringify(system)}){x.world.currentSystem=${JSON.stringify(system)};x.emit('systemLoaded',{to:${JSON.stringify(system)}});}
      const p=x.systems[x.world.currentSystem].station.position;
      for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
      x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;})()`);
    let poseReady=false;
    for(let i=0;i<100;i++) {
      poseReady=await c.eval(`(()=>{const x=window.__ctx,p=x.station?.position,a=x.systems[x.world.currentSystem].station.position;
        return !!p&&Math.hypot(p.x-a[0],p.y-a[1],p.z-a[2])<0.01;})()`);
      if(poseReady)break;
      await sleep(100);
    }
    assert.ok(poseReady,'station live pose ready for berth fixture');
    // Reapply placement after the system's live station pose has caught up.
    await c.eval(`(()=>{const x=window.__ctx,p=x.station.position;x.flags.combat=false;
      x.ship.object.position.set(p.x+36,p.y,p.z);x.ship.velocity.set(0,0,0);x.ship.speed=0;})()`);
    let inZone=false;
    for(let i=0;i<100;i++) {
      inZone=await c.eval('window.__ctx.station.inZone===true');
      if(inZone)break;
      await sleep(100);
    }
    assert.ok(inZone,'berth fixture reached real station docking zone');
    await act('dock'); await wait(s => s.flags.docked, 15, 'dock '+system);
  };
  const hold = () => c.eval('window.__ctx.cargo.map(r=>({commodity:r.commodity,units:r.units}))');
  const resources = () => c.eval('JSON.stringify({credits:window.__ctx.world.credits,cargo:window.__ctx.cargo,stock:window.__ctx.world.marketSupply})');
  await berth('freehold');
  await c.eval('window.__ctx.world.credits=200000;window.__ctx.world.fear=0');
  await act('openService', { id:'market' });
  const initial = await checkpoint('market');
  const rowActions = initial.station.view.actions.filter(a => /^[+−-][15]$/.test(a.label));
  assert.ok(rowActions.length >= 8);
  assert.ok(rowActions.every(a => typeof a.commodity === 'string' && a.commodity.length));
  const commodities = [...new Set(rowActions.map(a => a.commodity))];
  result.marketExecutions = [];
  for (const commodity of commodities) {
    const labels = rowActions.filter(a => a.commodity === commodity).map(a => a.label);
    assert.deepEqual(labels, ['+1','+5','−1','−5']);
    await c.eval(`window.__ctx.cargo.splice(0,window.__ctx.cargo.length,{commodity:${JSON.stringify(commodity)},units:6})`);
    for (const label of labels) {
      const current = (await observe()).station.view.actions.find(a => a.commodity === commodity && a.label === label);
      assert.ok(current);
      const before = await hold();
      const receipt = await act('stationAction', { n:current.n, expect:current.label });
      const after = await hold();
      const units = rows => rows.filter(r => r.commodity === commodity).reduce((n,r) => n+r.units,0);
      assert.equal(units(after)-units(before), Number(label.replace('−','-')));
      assert.ok(after.every(r => r.commodity === commodity));
      result.marketExecutions.push({ commodity, label, action:current, before, after, receipt });
    }
  }
  // Explicit quote-change fixture: the first ordinary save after a 99-unit
  // fill changes the price, forcing the next order to stop for review.
  await c.eval(`(()=>{const x=window.__ctx;x.cargo.length=0;x.cargoCapacity=160;
    x.world.marketSupply={};x.world.prices.provisions=100;})()`);
  await act('openService', {id:'market'});
  const max = (await observe()).station.view.actions.find(a => a.label === 'Buy Max' && a.commodity === 'provisions');
  assert.ok(max); await act('stationAction',{n:max.n,expect:max.label});
  const buy = (await observe()).station.view.actions.find(a => /^Buy 160 Provisions/.test(a.label));
  assert.equal(buy?.commodity,'provisions');
  await c.eval(`(()=>{window.__probeOriginalStorageSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){const r=window.__probeOriginalStorageSet.call(this,key,value);
      if(key==='rimward-save-v1')window.__ctx.world.prices.provisions=101;return r;};})()`);
  try { await act('stationAction',{n:buy.n,expect:buy.label}); }
  finally { await c.eval('Storage.prototype.setItem=window.__probeOriginalStorageSet;delete window.__probeOriginalStorageSet'); }
  assert.deepEqual(await hold(),[{commodity:'provisions',units:99}]);
  const review = (await observe()).station.view.actions.find(a => a.label === 'Review remainder: 61 Provisions');
  assert.equal(review?.commodity,'provisions');
  await c.eval(`document.querySelector('#market-bulk-review')?.scrollIntoView({block:'center'})`);
  const remainder = await checkpoint('bulk-remainder');
  const beforeReview = await resources();
  await act('stationAction',{n:review.n,expect:review.label});
  assert.equal(await resources(),beforeReview,'Review only refreshes the order');
  const nextBuy = (await observe()).station.view.actions.find(a => /^Buy 61 Provisions/.test(a.label));
  assert.equal(nextBuy?.commodity,'provisions');
  result.remainder = { review, nextBuy, notice:remainder.station.view.notice, resourcesUnchanged:true, fixture:'Storage save hook changes provisions price after first99-unit fill; hook restored before remainder action.' };
  const beforeRestricted = await resources();
  const restricted = await act('trade', { commodity:'restrictedComponents', qty:1, side:'buy' }, false);
  assert.equal(restricted.ok,false); assert.equal(restricted.token,'restricted');
  assert.equal(await resources(), beforeRestricted);
  const refused = await checkpoint('restricted-refusal');
  assert.match(refused.station.view.notice, /Not while the Compact watches/);
  assert.ok(await c.eval(`document.querySelector('.station-panel').innerText.includes('Not while the Compact watches')`));
  result.restricted = { receipt:restricted, notice:refused.station.view.notice, resourcesUnchanged:true };
  await act('openService', { id:'jobs' });
  const offered = (await observe()).jobs.offers.find(j => j.kind === 'espionage');
  assert.ok(offered, 'generated espionage offer at Freehold');
  await act('acceptJob', { id:offered.id });
  const active = s => s.jobs.active.find(j => j.id === offered.id);
  const cards = () => c.eval(`Array.from(document.querySelectorAll('.job-card')).map(n=>({title:n.querySelector('.job-title')?.textContent,state:n.querySelector('.job-state')?.textContent,text:n.innerText}))`);
  const showSpy = async () => {
    await c.eval(`Array.from(document.querySelectorAll('.job-card')).find(n=>n.querySelector('.job-title')?.textContent.endsWith('. '+${JSON.stringify(offered.title)}))?.scrollIntoView({block:'center'})`);
    await sleep(100);
  };
  const names = await c.eval(`({home:window.__ctx.systems[${JSON.stringify(offered.originSystem)}].station.name,dest:window.__ctx.systems[${JSON.stringify(offered.destSystem)}].station.name})`);
  await showSpy();
  const accepted = await checkpoint('spy-accepted');
  const briefing = `Report at ${names.home} for payment after completing the objective.`;
  const filing = `Intel acquired—return to ${names.home} to file.`;
  assert.equal(active(accepted).payAt,offered.originSystem);
  assert.ok(active(accepted).status.includes(names.home));
  // Issue 235: before collection the briefing and destination survive untouched.
  assert.equal(active(accepted).status,briefing);
  assert.equal(active(accepted).destSystem,offered.destSystem);
  const beforeCards = await cards();
  const beforeCard = beforeCards.find(j => j.title?.endsWith('. '+offered.title));
  assert.ok(beforeCard?.state.includes('gather at '+names.dest));
  assert.ok(beforeCard.state.includes('file at '+names.home));
  const credits = accepted.world.credits;
  await berth(offered.destSystem); await act('openService', {id:'jobs'});
  await wait(s => active(s)?.progress === 1, 10, 'spy intel gathered');
  // The observation sees the simulation tick before the desk's next repaint.
  // Wait for the visible state independently rather than assuming one frame.
  for (let i=0;i<50;i++) {
    const card = (await cards()).find(j => j.title?.endsWith('. '+offered.title));
    if (card?.state.includes('intel aboard — file at '+names.home)) break;
    await sleep(100);
  }
  await showSpy();
  const gathered = await checkpoint('spy-intel-return-instruction');
  assert.equal(gathered.world.credits,credits);
  assert.equal(active(gathered).state,'accepted');
  assert.equal(active(gathered).payAt,offered.originSystem);
  assert.ok(active(gathered).status.includes(names.home));
  // Issue 235: the collected contract names the filing run in the API status,
  // agreeing with the card, progress and payAt on the same observation.
  assert.equal(active(gathered).status,filing);
  assert.equal(active(gathered).progress,1);
  assert.equal(active(gathered).destSystem,offered.destSystem);
  const afterCards = await cards();
  const afterCard = afterCards.find(j => j.title?.endsWith('. '+offered.title));
  assert.ok(afterCard?.state.includes('intel aboard — file at '+names.home));
  result.spy = { offered, names, wording:{ briefing, filing }, before:active(accepted), beforeCard, after:active(gathered), afterCard };
  const reward = active(gathered).payQuoted;
  assert.ok(Number.isFinite(reward) && reward > 0);
  await berth(offered.originSystem); await act('openService', {id:'jobs'});
  await wait(s => !active(s),10,'spy settled');
  const settled = await checkpoint('spy-paid-at-origin');
  assert.equal(settled.world.credits-credits,reward);
  await berth(offered.originSystem);
  assert.equal((await observe()).world.credits,settled.world.credits);
  result.spy.settlement = { reward, creditsBefore:credits, creditsAfter:settled.world.credits, paidOnce:true };
  result.consoleWarnings = c.console.filter(e => e.type === 'warning');
  assert.deepEqual(result.networkFailures,[]);
  await save();
}, { seed:203205209 });
