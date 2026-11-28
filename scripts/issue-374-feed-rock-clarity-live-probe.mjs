/**
 * Issue #374 live verification — Feed & Tend desk supply note, button 2 live
 * livingRock hold count, feedRock refusal copy distinguishing unworked rawOre
 * from an empty hold, and Market livingRock purchase -> positive feedRock path
 * on the real rendered production bundle.
 *
 * Disposable headless Chromium against loopback vite preview (dist/).
 * Berth placement at Veridian Spire and 20 rawOre in the hold are explicit
 * disclosed fixtures; no natural flight or mining progression is claimed.
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT ||= resolve('out/issue-374-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

const result = await runLive('feed-rock-clarity', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Isolated headless Chromium against loopback vite preview of dist/. Explicit berth placement at Veridian Spire and 20 rawOre cargo fixture; live DOM .feed-supply-note, .station-notice, station.view.rows/actions, act("feed", {kind:"rock"}) refusal and Market livingRock purchase + positive feed verified.';
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

  // ---- A. Dock at Veridian Spire with 20 rawOre and 0 livingRock ------------
  await berth('veridian');
  await c.eval(`(()=>{const x=window.__ctx;
    x.flags.combat=false;
    x.world.credits=2000;
    x.cargoCapacity=100;
    x.cargo.splice(0,x.cargo.length,{commodity:'rawOre',units:20});
    x.bio.hunger=0.6;
    x.bio.wounds=0.2;
    x.bio.bond=0.3;
    x.world.marketSupply={};
    x.world.systemEvents={};})()`);
  await act('openService', { id: 'feed' });
  await sleep(300);

  const beforeObs = await checkpoint('veridian-feed-rawore-only');
  assert.equal(beforeObs.world.currentSystem, 'veridian');
  assert.equal(beforeObs.station?.view?.service, 'feed');

  const beforeDom = await c.eval(`(()=>{
    const supplyNote = document.querySelector('.feed-supply-note');
    const btns = Array.from(document.querySelectorAll('.screen-btn')).map((b) => b.textContent);
    return {
      supplyNoteText: supplyNote ? supplyNote.textContent : null,
      btns,
    };
  })()`);

  assert.ok(
    beforeDom.supplyNoteText?.startsWith('Living rock in hold: 0 (20 Raw ore aboard — Raw ore cannot feed her).'),
    'live DOM .feed-supply-note explains 20 Raw ore aboard cannot feed her',
  );
  assert.ok(
    beforeDom.supplyNoteText?.includes('buy at the Market or mine a Living rock bloom rock in the belt'),
    'live DOM .feed-supply-note points to Market or belt Living rock acquisition',
  );
  assert.ok(
    beforeDom.btns.includes('2 — Feed living rock (1 from hold · 0 aboard)'),
    'live DOM button 2 shows (1 from hold · 0 aboard)',
  );

  // Attempt feed { kind: 'rock' } with 0 livingRock and 20 rawOre
  const refuseReceipt = await act('feed', { kind: 'rock' }, false);
  assert.equal(refuseReceipt.ok, false, 'feed rock refuses with 0 livingRock');
  assert.equal(refuseReceipt.token, 'hold', 'refusal token is hold');
  const expectedRefusal =
    'No living rock in the hold (20 Raw ore aboard — she will not take unworked ore). Buy Living rock at the Market or mine a Living rock asteroid in the belt, or use 1 — Feed biomass (60 UU).';
  assert.equal(refuseReceipt.error, expectedRefusal, 'API receipt carries full refusal guidance');

  await sleep(200);
  const refuseObs = await checkpoint('veridian-feed-rock-refused');
  const refuseDomNotice = await c.eval(`document.querySelector('.station-notice')?.textContent ?? null`);
  assert.equal(refuseDomNotice, expectedRefusal, 'live DOM .station-notice matches refusal copy');
  assert.equal(refuseObs.station?.view?.notice, expectedRefusal);

  // ---- B. Buy 1 livingRock at Market, return to Feed, and feed rock ---------
  await act('openService', { id: 'market' });
  await sleep(200);
  const buyReceipt = await act('trade', { commodity: 'livingRock', qty: 1, side: 'buy' });
  assert.equal(buyReceipt.ok, true, 'buying 1 livingRock at Market succeeds');

  await act('openService', { id: 'feed' });
  await sleep(200);
  const armedObs = await checkpoint('veridian-feed-rock-1-aboard');
  const armedDom = await c.eval(`(()=>{
    const supplyNote = document.querySelector('.feed-supply-note');
    const btns = Array.from(document.querySelectorAll('.screen-btn')).map((b) => b.textContent);
    return {
      supplyNoteText: supplyNote ? supplyNote.textContent : null,
      btns,
    };
  })()`);
  assert.ok(
    armedDom.supplyNoteText?.startsWith('Living rock in hold: 1. Biomass costs 60 UU'),
    'live DOM .feed-supply-note updates to Living rock in hold: 1.',
  );
  assert.ok(
    armedDom.btns.includes('2 — Feed living rock (1 from hold · 1 aboard)'),
    'live DOM button 2 updates to (1 from hold · 1 aboard)',
  );

  const rockAction = (armedObs.station?.view?.actions ?? []).find((a) => a.commodity === 'livingRock');
  assert.ok(rockAction);
  assert.equal(rockAction.hold, 1);

  const bondBeforeFeed = await c.eval('window.__ctx.bio.bond');
  const feedReceipt = await act('feed', { kind: 'rock' });
  assert.equal(feedReceipt.ok, true, 'feed rock succeeds with 1 livingRock in hold');
  await sleep(200);
  const fedObs = await checkpoint('veridian-feed-rock-fed');
  const fedDom = await c.eval(`(()=>{
    const notice = document.querySelector('.station-notice')?.textContent ?? null;
    const supplyNote = document.querySelector('.feed-supply-note')?.textContent ?? null;
    const cargo = window.__ctx.cargo.map((r) => ({ commodity: r.commodity, units: r.units }));
    const hunger = window.__ctx.bio.hunger;
    const bond = window.__ctx.bio.bond;
    return { notice, supplyNote, cargo, hunger, bond };
  })()`);

  assert.equal(
    fedDom.notice,
    'She takes the living rock gently. The song through the hull runs warm for hours.',
    'live DOM .station-notice shows warm hull-song notice',
  );
  assert.ok(fedDom.hunger < 0.05, 'hunger zeroed after feeding livingRock');
  assert.ok(fedDom.bond >= Math.min(1, bondBeforeFeed + 0.19), `bond increased by +0.2 (before=${bondBeforeFeed}, after=${fedDom.bond})`);
  assert.deepEqual(
    fedDom.cargo,
    [{ commodity: 'rawOre', units: 20 }],
    '1 livingRock consumed while 20 rawOre remains untouched in the hold',
  );

  result.refusalVerification = { beforeDom, refuseReceipt, refuseDomNotice };
  result.feedVerification = { buyReceipt, armedDom, feedReceipt, fedDom, fedNotice: fedObs.station?.view?.notice };
  result.consoleWarnings = c.console.filter((e) => e.type === 'warning');
  assert.deepEqual(result.networkFailures, [], 'no failed network requests');
  await save();
}, { seed: 374, serve: 'preview' });

console.log('issue-374 live: ' + result.verdict);
console.log('screenshots: ' + ['veridian-feed-rawore-only', 'veridian-feed-rock-refused', 'veridian-feed-rock-1-aboard', 'veridian-feed-rock-fed']
  .map((n) => resolve(result.profile, '..', n + '.png')).join(' | '));
console.log('consoleErrors=' + result.consoleErrors.length + ' exceptions=' + result.exceptions.length
  + ' sourceHash=' + result.sourceHashStart + ' sourceStable=' + result.sourceStable
  + ' closedPorts=' + JSON.stringify(result.closedPorts));
