/** #206 disposable Chromium verification: the duplicate provisions haul is retired.
 *
 *  A. A fresh Freehold board and a fresh Veridian board post NO legacy
 *     consignment — not in the live overlay, not in the agent observation —
 *     while the generated trade rows beside them still carry the commodity,
 *     destination and window an agent can filter on.
 *  B. An older save's still-OFFERED legacy record is stale paper: hidden from
 *     the DOM, hidden from the API, refused by acceptJob, and not rewritten.
 *  C. An older save's ACCEPTED legacy agreement is untouched: its card is drawn
 *     with the quote it locked, it cannot be taken again, and it settles for
 *     exactly that quote at its named dock — once.
 *
 * Explicit berth/cargo/clock fixtures and an explicitly injected legacy record
 * in the shape the retired accept path used to stamp; no natural flight, no
 * weakened assertion. Console errors are collected by the shared harness.
 * node scripts/issue-206-haul-duplicates-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE206_OUT || resolve('out/issue-206-live');
delete process.env.ISSUE74_RESUME_PROFILE;
// The reserved loopback port for this issue's live work (the harness reads
// ISSUE74_PORT; the CDP port is negotiated by Chrome itself and is not ours to
// pin). Override with ISSUE206_PORT when the berth is busy.
process.env.ISSUE74_PORT = process.env.ISSUE206_PORT || '5206';
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

const HAUL = 'haul-provisions';
const HAUL_UNITS = 5;
/** The retired posting, verbatim as `makeJobs` used to seed it. */
const LEGACY_DETAIL = "Provisions are worth more a gate away. Accept here, buy 5 Provisions, and dock at the other system's station — paid at 140% of your buy cost on delivery.";

await runLive('haul-duplicates', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Disposable Chromium and real systems frames. Public desk actions (dock, openService, acceptJob) with explicit safe-berth placement, an explicit hold, and an explicitly injected legacy job record in the exact shape the retired accept path used to stamp; no natural flight and no natural trip times.';

  const placeAtBerth = (system = null) => c.eval(`(()=>{const x=window.__ctx;
    if(${JSON.stringify(system)}){ if(x.flags.docked) x.stationDesk.undock(); x.world.currentSystem=${JSON.stringify(system)}; x.emit('systemLoaded',{to:${JSON.stringify(system)}}); }
    const p=x.systems[x.world.currentSystem].station.position;
    for(const s of x.ships) if(s?.object) s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
    x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;x.world.credits=200000;
    return x.world.currentSystem;})()`);
  const setHold = (rows) => c.eval(`(()=>{const x=window.__ctx;x.cargo.length=0;for(const r of ${JSON.stringify(rows)})x.cargo.push({commodity:r[0],units:r[1]});return x.cargo.slice();})()`);
  const holdOf = (key) => c.eval(`(()=>{const x=window.__ctx;return x.cargo.filter(r=>r.commodity===${JSON.stringify(key)}).reduce((n,r)=>n+r.units,0);})()`);
  const rowOf = (id) => c.eval(`(()=>{const x=window.__ctx;const j=x.world.jobs.find(r=>r&&r.id===${JSON.stringify(id)});return j?JSON.parse(JSON.stringify(j)):null;})()`);
  const haulRows = () => c.eval(`(()=>{const x=window.__ctx;return x.world.jobs.filter(j=>j&&(j.id===${JSON.stringify(HAUL)}||j.kind==='haul')).map(j=>({id:j.id,kind:j.kind,state:j.state}));})()`);
  const dropHaulRows = () => c.eval(`(()=>{const x=window.__ctx;for(let i=x.world.jobs.length-1;i>=0;i--){const j=x.world.jobs[i];if(j&&j.id===${JSON.stringify(HAUL)})x.world.jobs.splice(i,1);}return x.world.jobs.length;})()`);
  const gateDest = () => c.eval(`(()=>{const x=window.__ctx;return (x.systems[x.world.currentSystem].gates||[])[0]?.to??null;})()`);
  /** Every job card the player can actually see, straight out of the overlay. */
  const boardCards = () => c.eval(`(()=>Array.from(document.querySelectorAll('.job-card')).map(card=>({
    title:(card.querySelector('.job-title')?.textContent||'').trim(),
    reward:Array.from(card.querySelectorAll('.job-reward')).map(n=>(n.textContent||'').trim()).join(' | '),
    accept:Array.from(card.querySelectorAll('button')).some(b=>/^Accept/.test((b.textContent||'').trim())),
  })))()`);
  // The retired posting is titled 'Haul provisions'; a GENERATED provisions
  // trade row is titled 'Haul Provisions'. The match is case-exact on purpose.
  const legacyCards = (cards) => cards.filter((card) => /(^|\s)Haul provisions$/.test(card.title));
  const openBoard = async (system) => {
    await placeAtBerth(system);
    await sleep(250);
    await act('dock');
    await wait((s) => s.flags.docked, 15, 'dock at ' + system);
    await act('openService', { id: 'jobs' });
    await sleep(250);
  };

  // -------------------------------------------------------------------------
  // A. A fresh board posts no legacy consignment, at either dock.
  // -------------------------------------------------------------------------
  result.freshBoards = [];
  for (const sysId of ['freehold', 'veridian']) {
    await openBoard(sysId);
    const seen = await observe();
    const cards = await boardCards();
    const rows = await haulRows();
    const offers = seen.jobs.offers;
    const trade = offers.filter((j) => j.kind === 'trade');
    const provisionsRun = trade.find((j) => j.commodity === 'provisions') ?? null;
    result.freshBoards.push({
      system: sysId,
      cards: cards.map((card) => card.title),
      haulRows: rows,
      tradeOffers: trade.map((j) => ({ id: j.id, commodity: j.commodity, destSystem: j.destSystem, reward: j.reward, secondsLeft: j.secondsLeft })),
      provisionsRun,
    });
    assert.deepEqual(rows, [], `${sysId}: a fresh game seeds no legacy consignment and no haul row`);
    assert.equal(offers.some((j) => j.id === HAUL || j.kind === 'haul'), false,
      `${sysId}: the agent observation has no haul offer`);
    assert.deepEqual(legacyCards(cards), [], `${sysId}: no legacy card is drawn`);
    assert.ok(trade.length > 0, `${sysId}: the generated trade rows still post`);
    for (const j of trade) {
      assert.ok(j.commodity, `${sysId}: ${j.id} names its commodity`);
      assert.ok(j.destSystem, `${sysId}: ${j.id} names its destination`);
      assert.ok(Number.isFinite(j.secondsLeft), `${sysId}: ${j.id} carries a window`);
    }
    await checkpoint(`fresh-board-${sysId}`);
  }

  // -------------------------------------------------------------------------
  // B. An older save's still-OFFERED legacy record is stale paper.
  // -------------------------------------------------------------------------
  await dropHaulRows();
  await c.eval(`(()=>{const x=window.__ctx;x.world.jobs.push({id:${JSON.stringify(HAUL)},kind:'haul',title:'Haul provisions',
    detail:${JSON.stringify(LEGACY_DETAIL)},reward:0,need:${HAUL_UNITS},progress:0,state:'offered',originSystem:null,originPrice:0});
    return x.world.jobs.length;})()`);
  await openBoard('freehold');
  const staleBefore = await rowOf(HAUL);
  assert.equal(staleBefore?.state, 'offered', 'the saved record is in the world');
  const staleSeen = await observe();
  const staleCards = await boardCards();
  result.stale = {
    record: staleBefore,
    offered: staleSeen.jobs.offers.some((j) => j.id === HAUL),
    active: staleSeen.jobs.active.some((j) => j.id === HAUL),
    cards: staleCards.map((card) => card.title),
  };
  assert.deepEqual(legacyCards(staleCards), [], 'a stale offered record draws no card');
  assert.equal(result.stale.offered, false, 'and is not offered through the API');
  assert.equal(result.stale.active, false, 'and is not reported as an active agreement');
  const staleRefusal = await act('acceptJob', { id: HAUL }, false);
  assert.equal(staleRefusal.ok, false, 'no accept path takes it: ' + JSON.stringify(staleRefusal));
  result.staleRefusal = { token: staleRefusal.token, error: staleRefusal.error };
  await sleep(250);
  assert.deepEqual(await rowOf(HAUL), staleBefore, 'and the saved record is left byte-identical');
  await checkpoint('stale-offered-hidden');

  // -------------------------------------------------------------------------
  // C. An older save's ACCEPTED legacy agreement is a live run, untouched.
  // -------------------------------------------------------------------------
  // The quote is taken from the REAL desk quoting path on the offered shape at
  // this dock — the number the retired accept path stamped — then locked on the
  // row exactly as an old save carries it.
  const stamped = await c.eval(`(()=>{const x=window.__ctx;
    const row=x.world.jobs.find(j=>j&&j.id===${JSON.stringify(HAUL)});
    const quote=x.stationDesk.peekJobReward({...row,state:'offered'});
    Object.assign(row,{state:'accepted',originSystem:x.world.currentSystem,
      originPrice:x.world.prices.provisions,payQuoted:quote});
    return {quote,origin:row.originSystem,originPrice:row.originPrice};})()`);
  assert.ok(Number.isFinite(stamped.quote) && stamped.quote > 0,
    'the desk still quotes a legacy consignment: ' + JSON.stringify(stamped));
  result.agreement = stamped;
  const dest = await gateDest();
  assert.ok(dest, 'the primary gate names the dock that pays');
  result.dest = dest;

  await act('openService', { id: 'market' });
  await act('openService', { id: 'jobs' }); // a real re-render, not a poke at the DOM
  await sleep(250);
  const agreementCards = legacyCards(await boardCards());
  const agreementSeen = await observe();
  const activeRow = agreementSeen.jobs.active.find((j) => j.id === HAUL) ?? null;
  result.agreementCard = agreementCards[0] ?? null;
  result.agreementActiveRow = activeRow;
  assert.equal(agreementCards.length, 1, 'the player can still read the run he is committed to');
  assert.ok(agreementCards[0].reward.includes(`pays ${stamped.quote} UU`),
    'the card shows the quote the old save locked: ' + agreementCards[0].reward);
  assert.ok(agreementCards[0].reward.includes('140% of buy cost'),
    'and still names the margin it pays on');
  assert.equal(agreementCards[0].accept, false, 'but offers no Accept button');
  assert.ok(activeRow, 'the API reports it as an active agreement');
  assert.equal(activeRow.reward, stamped.quote, 'at the quote it locked');
  assert.equal(activeRow.state, 'accepted');
  const reaccept = await act('acceptJob', { id: HAUL }, false);
  assert.equal(reaccept.ok, false, 'and it can never be taken again: ' + JSON.stringify(reaccept));
  assert.equal((await rowOf(HAUL)).state, 'accepted', 'the agreement is untouched by the refusal');
  await checkpoint('accepted-agreement-card');

  // --- it settles at its named dock, for exactly the locked quote, once -----
  await setHold([['provisions', HAUL_UNITS]]);
  await placeAtBerth(dest); // launch and re-berth: this IS a run into the dock
  const before = (await observe()).world.credits;
  await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked, 15, 'dock at the named destination');
  await sleep(4000); // the throttled delivery tick runs eight times
  const settled = await checkpoint('agreement-paid');
  result.paid = settled.world.credits - before;
  result.settledRow = await rowOf(HAUL);
  assert.equal(settled.flags.docked, true, 'never relaunched mid-settlement');
  assert.equal(result.settledRow.state, 'done', 'the legacy agreement settled at its named dock');
  assert.equal(result.paid, stamped.quote, 'and paid the locked quote, not a re-quote');
  assert.equal(await holdOf('provisions'), 0, 'the five arrived units were delivered');

  const afterSettle = (await observe()).world.credits;
  await sleep(4000);
  const quiet = await observe();
  result.creditsAfterIdle = quiet.world.credits;
  assert.equal(quiet.world.credits, afterSettle, 'a settled agreement is never paid again');

  await act('openService', { id: 'jobs' });
  await sleep(250);
  const doneCards = await boardCards();
  result.boardAfterSettlement = doneCards.map((card) => card.title);
  assert.deepEqual(legacyCards(doneCards), [], 'the paid-out card is not redrawn');
  const doneSeen = await observe();
  assert.equal(doneSeen.jobs.offers.some((j) => j.id === HAUL), false, 'and it is never re-offered');
  const retry = await act('acceptJob', { id: HAUL }, false);
  assert.equal(retry.ok, false, 'no retry reopens the retired posting: ' + JSON.stringify(retry));
  assert.equal((await rowOf(HAUL)).state, 'done', 'the record stays done');

  await save();
});
