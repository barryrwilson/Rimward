/**
 * Issue #317 live verification — the restricted-locker gate as a player sees
 * it, plus the People-desk fence sell verb, on the real rendered game.
 *
 * Disposable headless Chromium, loopback Vite only. Berth placement, fear,
 * Freehold standing, cargo and credits are explicit disclosed fixtures; no
 * natural flight and no campaign progression are claimed. The market row,
 * pane copy, People card, public actions and receipts are read from the
 * running game.
 *
 * Flow: dock Freehold, fear 38 / rep 0 / 4 restrictedComponents. Market row
 * refused with the gate reason; trade sell 4 refuses token 'restricted' with
 * the gate line and moves nothing; People desk offers 'Sell restricted cargo
 * (4)' and its click refuses the same way. Then fear 40: the row is allowed
 * with no reason, and the same People row sells all 4 units (credits rise,
 * cargo empties). Screenshots: refusal row, People fence card, success.
 *
 * Run: npm run test:restricted-fence-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT ||= resolve('out/issue-317-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

const result = await runLive('restricted-fence', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Isolated headless Chromium, loopback Vite, actual rendered market pane and People desk. Explicit berth placement, fear, Freehold standing, cargo and credits fixtures; every action runs the real public act()/stationAction path. No natural flight claimed.';
  result.networkFailures = [];
  await c.send('Network.enable');
  c.ws.addEventListener('message', (e) => {
    const m = JSON.parse(String(e.data));
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400)
      result.networkFailures.push({ url: m.params.response.url, status: m.params.response.status });
    if (m.method === 'Network.loadingFailed') result.networkFailures.push(m.params);
  });

  const berth = async (system) => {
    await c.eval(`(()=>{const x=window.__ctx;if(x.flags.docked)x.stationDesk.undock();
      if(x.world.currentSystem!==${JSON.stringify(system)}){x.world.currentSystem=${JSON.stringify(system)};x.emit('systemLoaded',{to:${JSON.stringify(system)}});}
      const p=x.systems[x.world.currentSystem].station.position;
      for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
      x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;})()`);
    let poseReady = false;
    for (let i = 0; i < 100; i++) {
      poseReady = await c.eval(`(()=>{const x=window.__ctx,p=x.station?.position,a=x.systems[x.world.currentSystem].station.position;
        return !!p&&Math.hypot(p.x-a[0],p.y-a[1],p.z-a[2])<0.01;})()`);
      if (poseReady) break;
      await sleep(100);
    }
    assert.ok(poseReady, 'station live pose ready for berth fixture');
    await c.eval(`(()=>{const x=window.__ctx,p=x.station.position;x.flags.combat=false;
      x.ship.object.position.set(p.x+36,p.y,p.z);x.ship.velocity.set(0,0,0);x.ship.speed=0;})()`);
    let inZone = false;
    for (let i = 0; i < 100; i++) {
      inZone = await c.eval('window.__ctx.station.inZone===true');
      if (inZone) break;
      await sleep(100);
    }
    assert.ok(inZone, 'berth fixture reached real station docking zone');
    await act('dock');
    await wait((s) => s.flags.docked, 15, 'dock ' + system);
  };
  const resources = () => c.eval('JSON.stringify({credits:window.__ctx.world.credits,cargo:window.__ctx.cargo,stock:window.__ctx.world.marketSupply})');
  const restrictedUnits = async () => {
    const cargo = await c.eval('window.__ctx.cargo.map(r=>({commodity:r.commodity,units:r.units}))');
    return cargo.filter((r) => r.commodity === 'restrictedComponents').reduce((n, r) => n + r.units, 0);
  };

  // ---- fixture: Freehold berth, fear 38, rep 0, four restricted units ------
  await berth('freehold');
  await c.eval(`(()=>{const x=window.__ctx;
    x.flags.combat=false;
    x.world.fear=38;
    x.world.reputation.freehold=0;
    x.world.credits=5000;
    x.cargoCapacity=100;
    x.cargo.splice(0,x.cargo.length,{commodity:'restrictedComponents',units:4});
    x.world.marketSupply={};})()`);
  await act('openService', { id: 'market' });
  await sleep(400);

  // ---- A. the refused row visibly states the gate -------------------------
  const refused = await checkpoint('market-row-refused');
  const row = refused.market.rows.find((r) => r.commodity === 'restrictedComponents');
  assert.ok(row, 'restricted row is on the live market');
  assert.equal(row.tradeAllowed, false);
  assert.match(row.tradeAllowedReason ?? '', /^Restricted locker closed — fear 38\/40 \(opens at 40\); a burned Freehold Compact name \(standing below -25\) or a fence's favor at the People desk opens it too\.$/);
  const refusedDom = await c.eval(`(()=>{const panel=document.querySelector('.station-panel');
    const reason=document.querySelector('.market-refusal-reason');
    const span=Array.from(document.querySelectorAll('.market-refusal')).find(n=>n.textContent==='trade refused');
    return { reason:reason?reason.textContent:null, spanText:span?span.textContent:null,
      spanTitle:span?(span.title||span.getAttribute('title')):null,
      panelText:panel?panel.innerText:null };})()`);
  assert.equal(refusedDom.spanText, 'trade refused', 'the pinned trade refused span is rendered');
  assert.equal(refusedDom.reason, 'closed — fear 38/40', 'the visible reason is rendered');
  assert.match(refusedDom.spanTitle ?? '', /^Restricted locker closed — fear 38\/40/);
  assert.ok(refusedDom.panelText.includes('The dockmaster keeps the restricted locker closed — fear 38/40'),
    'the market note states the gate clause');

  // ---- B. the public trade refuses with the gate line and moves nothing ---
  const beforeRefusal = await resources();
  const receipt = await act('trade', { commodity: 'restrictedComponents', qty: 4, side: 'sell' }, false);
  assert.equal(receipt.ok, false);
  assert.equal(receipt.token, 'restricted');
  assert.match(receipt.error ?? '', /^“Not while the Compact watches,” the dockmaster says\. “Restricted locker closed — fear 38\/40 \(opens at 40\)/);
  assert.match(receipt.error ?? '', /standing below -25/);
  assert.match(receipt.error ?? '', /People desk/);
  assert.equal(await resources(), beforeRefusal, 'the refused trade mutates no resources');
  result.refusal = { row, receipt, dom: refusedDom, resourcesUnchanged: true };

  // ---- C. the People desk offers the fence sell verb; the click refuses ---
  await act('openService', { id: 'people' });
  await sleep(400);
  const people = await checkpoint('people-fence-card');
  const sellRow = people.station.view.actions.find((a) => a.label === 'Sell restricted cargo (4)');
  assert.ok(sellRow, 'the fence card offers Sell restricted cargo (4)');
  const peopleText = await c.eval(`(()=>{const p=document.querySelector('.station-panel');return p?p.innerText:null;})()`);
  assert.ok(peopleText.includes('Sell restricted cargo (4)'), 'the row is visibly drawn');
  const viaPeople = await act('stationAction', { n: sellRow.n, expect: sellRow.label }, false);
  assert.equal(viaPeople.ok, false);
  assert.equal(viaPeople.token, 'restricted');
  assert.match(viaPeople.error ?? '', /^“Not while the Compact watches,” the dockmaster says\. “Restricted locker closed — fear 38\/40/);
  assert.equal(await resources(), beforeRefusal, 'the refused People click mutates no resources');
  assert.equal(await restrictedUnits(), 4);
  result.people = { sellRow, receipt: viaPeople, resourcesUnchanged: true };

  // ---- D. fear 40 opens the gate: allowed row, no reason, fence sells all -
  await c.eval('window.__ctx.world.fear=40');
  await act('openService', { id: 'market' });
  await sleep(400);
  const allowed = await checkpoint('market-row-allowed');
  const openRow = allowed.market.rows.find((r) => r.commodity === 'restrictedComponents');
  assert.ok(openRow);
  assert.equal(openRow.tradeAllowed, true);
  assert.equal(Object.hasOwn(openRow, 'tradeAllowedReason'), false, 'allowed row carries no reason');
  const openDom = await c.eval(`(()=>{const panel=document.querySelector('.station-panel');
    return { reason:document.querySelector('.market-refusal-reason')?.textContent??null,
      span:!!Array.from(document.querySelectorAll('.market-refusal')).find(n=>n.textContent==='trade refused'),
      panelText:panel?panel.innerText:null };})()`);
  assert.equal(openDom.reason, null, 'no visible reason at the open gate');
  assert.equal(openDom.span, false, 'no trade refused span at the open gate');
  assert.equal(openDom.panelText.includes('The dockmaster keeps the restricted locker closed'), false);

  await act('openService', { id: 'people' });
  await sleep(400);
  const peopleOpen = await observe();
  const sellOpen = peopleOpen.station.view.actions.find((a) => a.label === 'Sell restricted cargo (4)');
  assert.ok(sellOpen, 'the sell verb is still offered at the open gate');
  const creditsBefore = await c.eval('window.__ctx.world.credits');
  const sold = await act('stationAction', { n: sellOpen.n, expect: sellOpen.label });
  assert.equal(sold.ok, true);
  assert.match(sold.notice ?? '', /^Sold 4 Restricted components for \d+ UU\.$/);
  const afterSale = JSON.parse(await resources());
  assert.equal(await restrictedUnits(), 0, 'all four units left the hold');
  assert.ok(afterSale.credits > creditsBefore, 'credits rose by the market fill');
  await checkpoint('fence-sold-all');
  const peopleEmpty = await observe();
  assert.equal(peopleEmpty.station.view.actions.some((a) => a.label.startsWith('Sell restricted cargo')), false,
    'the row is gone with nothing left to sell');
  result.sale = { row: openRow, action: sellOpen, receipt: sold, creditsBefore, creditsAfter: afterSale.credits, holdEmpty: true };
  result.consoleWarnings = c.console.filter((e) => e.type === 'warning');
  assert.deepEqual(result.networkFailures, [], 'no failed network requests');
  await save();
}, { seed: 317 });

console.log('issue-317 live: ' + result.verdict);
console.log('screenshots: ' + ['market-row-refused', 'people-fence-card', 'market-row-allowed', 'fence-sold-all']
  .map((n) => resolve(result.profile, '..', n + '.png')).join(' | '));
console.log('consoleErrors=' + result.consoleErrors.length + ' exceptions=' + result.exceptions.length
  + ' sourceHash=' + result.sourceHashStart + ' sourceStable=' + result.sourceStable
  + ' closedPorts=' + JSON.stringify(result.closedPorts));
