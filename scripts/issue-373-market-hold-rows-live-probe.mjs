/**
 * Issue #373 live verification — the Market pane hold summary banner, buyer-row
 * highlight / data-commodity attributes, and station.view.rows / actions
 * commodity metadata on the real rendered production bundle.
 *
 * Disposable headless Chromium against loopback vite preview (dist/).
 * Berth placement at Veridian Spire, baseline Veridian rawOre price (112 UU ->
 * 106 UU/unit sell fill), and 20 rawOre in the hold are explicit disclosed
 * fixtures; no natural flight or mining progression is claimed.
 *
 * Flow:
 * 1. Fresh session, choose origin, dock at Veridian Spire with 20 rawOre in the
 *    hold, open the market service.
 * 2. Verify in the live DOM that .market-hold-summary displays
 *    'YOUR HOLD: Raw ore ×20 — 106 UU/unit (2120 UU)', the Raw ore row carries
 *    data-commodity="rawOre" and .market-row-held, and the HOLD cell carries
 *    .market-hold-active with text '20'.
 * 3. Verify window.rimward.observe().station.view.rows publishes
 *    commodity: 'rawOre', hold: 20, units: 20, holdOwned: 20 on the buyer row
 *    (and actions carry commodity: 'rawOre').
 * 4. Sell the 20 rawOre through the live Agent API trade action (+2120 UU),
 *    confirming the hold summary banner disappears, the row hold resets to 0,
 *    and consoleErrors === 0.
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT ||= resolve('out/issue-373-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

const result = await runLive('market-hold-rows', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Isolated headless Chromium against loopback vite preview of dist/. Explicit berth placement at Veridian Spire, baseline Veridian rawOre quote fixture (112 UU -> 106 UU/unit sell fill), and 20 rawOre cargo fixture; live DOM, station.view.rows, and public act("trade") verified.';
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

  // ---- A. Dock at Veridian Spire with 20 rawOre in the hold ----------------
  await berth('veridian');
  await c.eval(`(()=>{const x=window.__ctx;
    x.flags.combat=false;
    x.world.credits=1000;
    x.cargoCapacity=100;
    x.cargo.splice(0,x.cargo.length,{commodity:'rawOre',units:20});
    x.world.marketSupply={};
    x.world.systemEvents={};
    if(x.world.markets?.veridian)x.world.prices=x.world.markets.veridian;
    if(x.world.prices)Object.defineProperty(x.world.prices,'rawOre',{get(){return 112;},set(){},configurable:true,enumerable:true});})()`);
  await act('openService', { id: 'market' });
  await sleep(300);

  const heldObs = await checkpoint('veridian-market-rawore-held');
  assert.equal(heldObs.world.currentSystem, 'veridian');
  assert.equal(heldObs.station?.view?.service, 'market');

  // Verify live DOM elements
  const heldDom = await c.eval(`(()=>{
    const banner = document.querySelector('.market-hold-summary');
    const cells = Array.from(document.querySelectorAll('.market-cell[data-commodity="rawOre"]'));
    const heldCells = Array.from(document.querySelectorAll('.market-cell.market-row-held[data-commodity="rawOre"]'));
    const activeHoldCell = document.querySelector('.market-cell.market-hold-active[data-commodity="rawOre"]');
    return {
      bannerText: banner ? banner.textContent : null,
      cellTexts: cells.map((n) => n.textContent),
      cellCount: cells.length,
      heldCellCount: heldCells.length,
      activeHoldText: activeHoldCell ? activeHoldCell.textContent : null,
    };
  })()`);

  assert.equal(
    heldDom.bannerText,
    'YOUR HOLD: Raw ore ×20 — 106 UU/unit (2120 UU)',
    'live DOM .market-hold-summary banner shows held Raw ore quantity, unit sell price, and total payout',
  );
  assert.equal(heldDom.cellCount, 6, 'all 6 market cells in the Raw ore row carry data-commodity="rawOre"');
  assert.equal(heldDom.heldCellCount, 6, 'all 6 market cells in the Raw ore row carry .market-row-held');
  assert.equal(heldDom.cellTexts[0], 'Raw ore');
  assert.equal(heldDom.activeHoldText, '20', 'HOLD cell carries .market-hold-active and text 20');

  // Verify Agent API station.view.rows & actions
  const viewRows = heldObs.station?.view?.rows ?? [];
  const rawOreRows = viewRows.filter((r) => r.commodity === 'rawOre');
  assert.ok(rawOreRows.length >= 5, 'station.view.rows tags every Raw ore row cell and the single-commodity hold banner with commodity: rawOre');

  const bannerRow = rawOreRows.find((r) => r.cls.includes('market-hold-summary'));
  assert.ok(bannerRow, 'station.view.rows includes the market-hold-summary row');
  assert.equal(bannerRow.text, 'YOUR HOLD: Raw ore ×20 — 106 UU/unit (2120 UU)');

  const nameRow = rawOreRows.find((r) => r.text === 'Raw ore' && r.cls.includes('market-row-held'));
  assert.ok(nameRow, 'station.view.rows includes the Raw ore name cell with market-row-held');
  assert.equal(nameRow.commodity, 'rawOre');
  assert.equal(nameRow.hold, 20);
  assert.equal(nameRow.units, 20);
  assert.equal(nameRow.holdOwned, 20);

  const holdCellRow = rawOreRows.find((r) => r.text === '20' && r.cls.includes('market-hold-active'));
  assert.ok(holdCellRow, 'station.view.rows includes the HOLD cell with hold/units/holdOwned = 20');
  assert.equal(holdCellRow.commodity, 'rawOre');
  assert.equal(holdCellRow.hold, 20);
  assert.equal(holdCellRow.units, 20);
  assert.equal(holdCellRow.holdOwned, 20);

  const rawOreActions = (heldObs.station?.view?.actions ?? []).filter((a) => a.commodity === 'rawOre');
  assert.deepEqual(
    rawOreActions.map((a) => a.label),
    ['+1', '+5', '−1', '−5'],
    'station.view.actions tags the Raw ore row trade buttons with commodity: rawOre',
  );

  // ---- B. Sell all 20 rawOre via live Agent API trade action (+2120 UU) ----
  const creditsBefore = heldObs.world.credits;
  const sellReceipt = await act('trade', { commodity: 'rawOre', qty: 20, side: 'sell' });
  assert.equal(sellReceipt.ok, true, 'selling 20 rawOre succeeds');

  await sleep(300);
  const soldObs = await checkpoint('veridian-market-rawore-sold');
  assert.equal(soldObs.world.credits - creditsBefore, 2120, 'credits increase by +2120 UU');

  const soldDom = await c.eval(`(()=>{
    const banner = document.querySelector('.market-hold-summary');
    const heldCells = Array.from(document.querySelectorAll('.market-cell.market-row-held[data-commodity="rawOre"]'));
    const activeHoldCell = document.querySelector('.market-cell.market-hold-active[data-commodity="rawOre"]');
    const cells = Array.from(document.querySelectorAll('.market-cell[data-commodity="rawOre"]'));
    return {
      bannerExists: !!banner,
      heldCellCount: heldCells.length,
      activeHoldExists: !!activeHoldCell,
      holdCellText: cells[4] ? cells[4].textContent : null,
    };
  })()`);

  assert.equal(soldDom.bannerExists, false, '.market-hold-summary banner disappears once the hold is empty');
  assert.equal(soldDom.heldCellCount, 0, '.market-row-held highlight clears once the hold is empty');
  assert.equal(soldDom.activeHoldExists, false, '.market-hold-active clears once the hold is empty');
  assert.equal(soldDom.holdCellText, '0', 'Raw ore HOLD cell updates to 0');

  const soldRows = (soldObs.station?.view?.rows ?? []).filter((r) => r.commodity === 'rawOre');
  assert.equal(soldRows.some((r) => r.cls.includes('market-hold-summary')), false);
  const soldNameRow = soldRows.find((r) => r.text === 'Raw ore');
  assert.ok(soldNameRow);
  assert.equal(soldNameRow.hold, 0);
  assert.equal(soldNameRow.units, 0);
  assert.equal(soldNameRow.holdOwned, 0);

  result.heldVerification = { heldDom, nameRow, holdCellRow, bannerRow };
  result.saleVerification = { sellReceipt, creditsBefore, creditsAfter: soldObs.world.credits, soldDom, soldNameRow };
  result.consoleWarnings = c.console.filter((e) => e.type === 'warning');
  assert.deepEqual(result.networkFailures, [], 'no failed network requests');
  await save();
}, { seed: 373, serve: 'preview' });

console.log('issue-373 live: ' + result.verdict);
console.log('screenshots: ' + ['veridian-market-rawore-held', 'veridian-market-rawore-sold']
  .map((n) => resolve(result.profile, '..', n + '.png')).join(' | '));
console.log('consoleErrors=' + result.consoleErrors.length + ' exceptions=' + result.exceptions.length
  + ' sourceHash=' + result.sourceHashStart + ' sourceStable=' + result.sourceStable
  + ' closedPorts=' + JSON.stringify(result.closedPorts));
