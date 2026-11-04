/**
 * Issue #273 live verification — the employer dock's prisoner desk as the player
 * reads it on a real station People pane. Disposable Chromium, loopback only.
 *
 * Fixtures are explicit: the berth placement, one dead local quarry record and
 * one scooped survivor row. The People-desk copy, the click-only handover
 * action, its receipt and the cargo/credit/standing effects are read from the
 * running game. Console errors and exceptions fail the run (shared harness).
 *
 * Run: npm run test:survivor-prisoners-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE273_OUT || resolve('out/issue-273-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('survivor-prisoners', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'Berth placement, one dead local quarry record and one scooped survivor row are explicit fixtures; the People line, the handover action, its receipt and the cargo/credit/standing effects are read from the running game.';

  const placeAtBerth = (sysId) => c.eval(`(()=>{const x=window.__ctx;
    if(x.world.currentSystem!==${JSON.stringify(sysId)}){ if(x.flags.docked) x.stationDesk.undock(); x.world.currentSystem=${JSON.stringify(sysId)}; x.emit('systemLoaded',{to:${JSON.stringify(sysId)}}); }
    const p=x.systems[x.world.currentSystem].station.position;
    for(const sh of x.ships)if(sh?.object)sh.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
    x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;
    return x.world.currentSystem;})()`);

  const dockAt = async (sysId) => {
    await placeAtBerth(sysId);
    await sleep(250);
    await act('dock');
    await wait((s) => s.flags.docked && s.world.currentSystem === sysId, 15, 'dock at ' + sysId);
  };

  const markQuarryDead = (sysId, faction) => c.eval(`(()=>{const x=window.__ctx;
    const banks=x.world.recordBanks??{};
    const bank=Array.isArray(banks[${JSON.stringify(sysId)}])?banks[${JSON.stringify(sysId)}]
      :(x.world.currentSystem===${JSON.stringify(sysId)}&&Array.isArray(x.world.records)?x.world.records:null);
    if(!bank)return null;
    for(const r of bank){
      if(r&&r.role==='pirate'&&r.classKey!=='ace'&&r.faction===${JSON.stringify(faction)}
        &&r.state!=='dead'&&r.state!=='captured'){ r.state='dead'; return {name:r.name,id:r.id}; }
    }
    return null;})()`);

  const pushSurvivor = (faction, units, name) => c.eval(`(()=>{const x=window.__ctx;
    const row={commodity:'survivor',units:${units},faction:${JSON.stringify(faction)},source:'playerKill'};
    if(${JSON.stringify(name)})row.name=${JSON.stringify(name)};
    x.cargo.push(row); return row;})()`);

  const snap = () => c.eval(`(()=>{const x=window.__ctx;
    return {credits:x.world.credits,rep:x.world.reputation?.freehold??0,
      cargo:x.cargo.map(r=>({commodity:r.commodity,units:r.units,faction:r.faction,source:r.source,name:r.name??null}))};})()`);

  const peopleView = async () => {
    const s = await observe();
    return { s, view: s.station?.view ?? null };
  };
  const rowWith = (view, needle) => (view?.rows ?? []).find((r) => typeof r.text === 'string' && r.text.includes(needle));
  const actionWith = (view, label) => (view?.actions ?? []).find((a) => a.label === label);

  // A. The employer dock takes the local quarry's crew as prisoners: the line
  //    names the dock, the fee and the contract tie; the action is click-only.
  await dockAt('freehold');
  const quarry = await markQuarryDead('freehold', 'redledger');
  assert.ok(quarry, 'Freehold has a local redledger pirate record to break');
  await pushSurvivor('redledger', 2, quarry.name);
  await act('openService', { id: 'people' });
  await sleep(250);
  const before = await peopleView();
  assert.equal(before.view?.service, 'people', 'People pane is open');
  const prisonerRow = rowWith(before.view, 'prisoners from your hunts');
  assert.ok(prisonerRow, 'People pane states the prisoner outlet: ' + JSON.stringify((before.view?.rows ?? []).map((r) => r.text)));
  assert.match(prisonerRow.text, /2 prisoners from your hunts/);
  assert.match(prisonerRow.text, /Freehold Compact/);
  assert.match(prisonerRow.text, /60 UU a head/);
  const handover = actionWith(before.view, 'Hand over prisoners');
  assert.ok(handover, 'the handover action is exposed to the player and the agent API');
  const stateBefore = await snap();
  result.before = { view: before.view, state: stateBefore };
  await checkpoint('freehold-prisoners');

  const receipt = await act('stationAction', { n: handover.n, expect: handover.label });
  assert.ok(receipt.ok, 'the handover is accepted: ' + JSON.stringify(receipt));
  assert.match(receipt.notice, /2 prisoners handed over/);
  assert.match(receipt.notice, /120 UU/);
  assert.match(receipt.notice, /Freehold Compact/);
  const stateAfter = await snap();
  assert.equal(stateAfter.credits, stateBefore.credits + 120, 'the small fee is paid once');
  assert.equal(stateAfter.rep, stateBefore.rep + 2, 'employer standing rises');
  assert.ok(!stateAfter.cargo.some((r) => r.commodity === 'survivor' && r.faction === 'redledger'),
    'the quarry crew leaves the hold');
  result.after = { notice: receipt.notice, state: stateAfter };
  await checkpoint('freehold-handover');

  // B. With no eligible crew left the same action refuses instead of paying twice.
  const second = await act('stationAction', { n: handover.n, expect: handover.label }, false);
  assert.equal(second.ok, false, 'a second handover refuses: ' + JSON.stringify(second));
  assert.equal((await snap()).credits, stateAfter.credits, 'no double payout');

  // C. A non-employer dock names the real outlets for other-faction survivors:
  //    their own dock, or a Gilded fence. No prisoner offer is invented here.
  await dockAt('veridian');
  await pushSurvivor('redledger', 1, quarry.name);
  await act('openService', { id: 'people' });
  await sleep(250);
  const veridian = await peopleView();
  const elseRow = rowWith(veridian.view, 'Their own docks will take them home');
  assert.ok(elseRow, 'the People pane names where these survivors can go: ' + JSON.stringify((veridian.view?.rows ?? []).map((r) => r.text)));
  assert.match(elseRow.text, /Red Ledger/);
  assert.match(elseRow.text, /Gilded fence/);
  assert.ok(!rowWith(veridian.view, 'prisoners from your hunts'), 'no prisoner offer where no local quarry of that faction died');
  assert.ok(!actionWith(veridian.view, 'Hand over prisoners'), 'no handover button without eligible crew');
  result.veridian = veridian.view;
  await checkpoint('veridian-other-faction');

  result.method = 'Disposable Chromium; berth, dead-quarry record and survivor row are fixtures; the People copy, action, receipt and cargo/credit/standing effects come from the running game. Console errors and exceptions are enforced by the shared harness.';
});
