/** #182 disposable Chromium verification: delivery cargo must arrive with the ship.
 * The hull docks EMPTY at the consignment's own destination, buys the dock's own
 * Provisions through the real market desk, and is not paid; the desk says why in
 * plain words. The same goods carried in from the previous berth pay every row
 * for exactly its locked quote. Explicit berth/cargo/destination fixtures; no
 * natural flight. Console errors are collected by the shared harness.
 * node scripts/issue-182-arrival-cargo-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE182_OUT || resolve('out/issue-182-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('arrival-cargo', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Disposable Chromium and real systems frames. Public desk actions (dock, openService, acceptJob, trade) with explicit safe-berth placement, an explicit hold and disclosed destination/commodity stamps on accepted rows; no natural flight and no natural trip times.';

  const placeAtBerth = (system = null) => c.eval(`(()=>{const x=window.__ctx;
    if(${JSON.stringify(system)}){ if(x.flags.docked) x.stationDesk.undock(); x.world.currentSystem=${JSON.stringify(system)}; x.emit('systemLoaded',{to:${JSON.stringify(system)}}); }
    const p=x.systems[x.world.currentSystem].station.position;
    for(const s of x.ships) if(s?.object) s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
    x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;x.world.credits=200000;
    return x.world.currentSystem;})()`);
  const setHold = (rows) => c.eval(`(()=>{const x=window.__ctx;x.cargo.length=0;for(const r of ${JSON.stringify(rows)})x.cargo.push({commodity:r[0],units:r[1]});return x.cargo.slice();})()`);
  const holdOf = (key) => c.eval(`(()=>{const x=window.__ctx;return x.cargo.filter(r=>r.commodity===${JSON.stringify(key)}).reduce((n,r)=>n+r.units,0);})()`);
  const stateOf = (ids) => c.eval(`(()=>{const x=window.__ctx;return ${JSON.stringify(ids)}.map(id=>{const j=x.world.jobs.find(r=>r&&r.id===id);return j?j.state:'gone';});})()`);
  // The notice the PLAYER reads, straight out of the live overlay.
  const deskNotice = () => c.eval(`(()=>{const n=document.querySelector('.station-notice');return n?n.innerText:'';})()`);

  const HOME = 'freehold';
  await placeAtBerth(HOME);
  await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked, 15, 'dock');
  await act('openService', { id: 'jobs' });

  // --- the unique consignment plus two trade rows, all for the same dock ---
  assert.equal((await act('acceptJob', { id: 'haul-provisions' })).ok, true, 'unique consignment accepted');
  const offers = (await observe()).jobs.offers;
  const tradeIds = offers.filter((j) => j.kind === 'trade').slice(0, 2).map((j) => j.id);
  const partyIds = offers.filter((j) => j.kind === 'passenger').slice(0, 1).map((j) => j.id);
  assert.equal(tradeIds.length, 2, 'two trade postings on the board');
  assert.equal(partyIds.length, 1, 'a party on the board');
  for (const id of [...tradeIds, ...partyIds]) {
    assert.equal((await act('acceptJob', { id })).ok, true, 'accepted ' + id);
  }
  const dest = await c.eval(`(()=>{const x=window.__ctx;const gates=x.systems[x.world.currentSystem].gates||[];return gates[0]?.to??null;})()`);
  assert.ok(dest, 'the primary gate names a destination dock');
  // Disclosed fixture: every ordinary row is stamped to the consignment's own
  // dock and carries the commodity the consignment needs, so one arrival
  // manifest is genuinely shared by three cargo agreements.
  await c.eval(`(()=>{const x=window.__ctx,ids=${JSON.stringify([...tradeIds, ...partyIds])};
    for(const id of ids){const j=x.world.jobs.find(r=>r&&r.id===id);if(j)j.destSystem=${JSON.stringify(dest)};}
    for(const id of ${JSON.stringify(tradeIds)}){const j=x.world.jobs.find(r=>r&&r.id===id);if(j){j.commodity='provisions';j.need=5;}}
    return true;})()`);
  const ids = ['haul-provisions', ...tradeIds, ...partyIds];
  result.dest = dest;
  result.lockedQuotes = await c.eval(`(()=>{const x=window.__ctx;return ${JSON.stringify(ids)}.map(id=>{const j=x.world.jobs.find(r=>r&&r.id===id);return {id,payQuoted:j?.payQuoted??null};});})()`);
  assert.ok(result.lockedQuotes.every((r) => Number.isFinite(r.payQuoted)),
    'every row locked a quote: ' + JSON.stringify(result.lockedQuotes));
  result.expectedPay = result.lockedQuotes.reduce((n, r) => n + r.payQuoted, 0);

  // --- leg 1: dock EMPTY at the destination and buy the dock's own stock ----
  await setHold([]);
  await placeAtBerth(dest);
  await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked, 15, 'dock at the destination');
  await act('openService', { id: 'market' });
  const emptyCredits = (await observe()).world.credits;
  const bought = await act('trade', { commodity: 'provisions', qty: 15, side: 'buy' });
  assert.equal(bought.ok, true, 'the market sold the stock: ' + JSON.stringify(bought));
  const afterBuy = (await observe()).world.credits;
  assert.ok(afterBuy < emptyCredits, 'the purchase cost real UU');
  result.boughtHere = await holdOf('provisions');
  assert.equal(result.boughtHere, 15, 'fifteen dockside Provisions are aboard');

  await act('openService', { id: 'jobs' });
  await sleep(4000); // the throttled delivery tick runs eight times
  const afterTick = await observe();
  result.statesAfterBuy = await stateOf(ids);
  result.paidForDocksideStock = afterTick.world.credits - afterBuy;
  assert.deepEqual(result.statesAfterBuy.slice(0, 3), ['accepted', 'accepted', 'accepted'],
    'no cargo agreement settled on dockside stock: ' + JSON.stringify(result.statesAfterBuy));
  assert.equal(await holdOf('provisions'), 15, 'and no cargo was taken');
  // Issue 181 is untouched: the refusal is about CARGO. The party rode in with
  // the hull and disembarks in this very berth.
  assert.notEqual(result.statesAfterBuy[3], 'accepted',
    'the party still disembarked in the same berth');
  result.paidForParty = result.paidForDocksideStock;
  assert.equal(result.paidForDocksideStock,
    result.lockedQuotes.find((r) => r.id === partyIds[0]).payQuoted,
    'the berth paid the party and not one UU of delivery margin');

  // The desk says, in plain words, what is wrong.
  result.deskNotice = await deskNotice();
  assert.ok(/must arrive with the ship/i.test(result.deskNotice),
    'the berth explains the refusal: ' + JSON.stringify(result.deskNotice));
  result.noticeRect = await c.eval(`(()=>{const n=document.querySelector('.station-notice');if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return {text:n.innerText,rect:r.toJSON(),inViewport:r.top>=0&&r.bottom<=innerHeight};})()`);
  assert.ok(result.noticeRect, 'the notice is rendered');
  assert.equal(result.noticeRect.inViewport, true, 'the notice is in the viewport for the shot');
  await checkpoint('arrival-refused');

  // ...and it stays refused, without the line being re-stamped every pass.
  const idleCredits = (await observe()).world.credits;
  await sleep(4000);
  const stillIdle = await observe();
  result.creditsAfterIdle = stillIdle.world.credits;
  assert.equal(stillIdle.world.credits, idleCredits, 'repeated ticks never pay for dockside stock');

  // --- leg 2: the same goods, actually carried in ---------------------------
  // Only the CARGO rows are still open — the party settled in leg 1 — so this
  // berth owes exactly the quotes those rows locked.
  const openIds = (await stateOf(ids)).map((s, i) => (s === 'accepted' ? ids[i] : null)).filter(Boolean);
  result.openBeforeArrival = openIds;
  assert.deepEqual(openIds, ['haul-provisions', ...tradeIds], 'the three cargo rows are still open');
  result.expectedPay = result.lockedQuotes
    .filter((r) => openIds.includes(r.id)).reduce((n, r) => n + r.payQuoted, 0);
  await setHold([['provisions', 15]]);
  await placeAtBerth(dest); // launch and re-berth: this IS a run into the dock
  const before = (await observe()).world.credits;
  await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked, 15, 'dock with the cargo aboard');
  await sleep(4000);
  const settled = await checkpoint('arrival-paid');
  result.statesAfterArrival = await stateOf(ids);
  result.paid = settled.world.credits - before;
  assert.equal(settled.flags.docked, true, 'never relaunched mid-settlement');
  assert.ok(result.statesAfterArrival.every((s) => s !== 'accepted'),
    'every delivery settled in one berth: ' + JSON.stringify(result.statesAfterArrival));
  assert.equal(result.paid, result.expectedPay, 'the berth paid exactly the locked quotes');
  assert.equal(await holdOf('provisions'), 0, 'the arrived units were spent');

  await save();
});
