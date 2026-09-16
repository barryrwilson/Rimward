/** Focused real-Chromium desk verification. Berth/cargo fixtures are explicit;
 * travel and earned resources are not claimed as natural play.
 * node scripts/issue-203-205-209-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = resolve('out/issues-203-205-209/live');
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
    await sleep(300); await act('dock'); await wait(s => s.flags.docked, 15, 'dock '+system);
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
  assert.equal(active(accepted).payAt,offered.originSystem);
  assert.ok(active(accepted).status.includes(names.home));
  const beforeCards = await cards();
  const beforeCard = beforeCards.find(j => j.title?.endsWith('. '+offered.title));
  assert.ok(beforeCard?.state.includes('gather at '+names.dest));
  assert.ok(beforeCard.state.includes('file at '+names.home));
  const credits = accepted.world.credits;
  await berth(offered.destSystem); await act('openService', {id:'jobs'});
  await wait(s => active(s)?.progress === 1, 10, 'spy intel gathered');
  await showSpy();
  const gathered = await checkpoint('spy-intel-return-instruction');
  assert.equal(gathered.world.credits,credits);
  assert.equal(active(gathered).state,'accepted');
  assert.equal(active(gathered).payAt,offered.originSystem);
  assert.ok(active(gathered).status.includes(names.home));
  const afterCards = await cards();
  const afterCard = afterCards.find(j => j.title?.endsWith('. '+offered.title));
  assert.ok(afterCard?.state.includes('intel aboard — file at '+names.home));
  result.spy = { offered, names, before:active(accepted), beforeCard, after:active(gathered), afterCard };
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
