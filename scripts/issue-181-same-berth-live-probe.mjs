/** #181 disposable Chromium verification of same-berth settlement.
 * A unique consignment, two trade deliveries and two parties, all bound for the
 * dock the hull is standing in, settle in ONE berth with no relaunch; the row
 * the unique consignment still holds names its reason on the desk and in the
 * public API. Explicit berth/cargo/destination fixtures; no natural flight.
 * node scripts/issue-181-same-berth-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE181_OUT || resolve('out/issue-181-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('same-berth', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Disposable Chromium and real systems frames. Public desk actions with explicit safe-berth placement, an explicit hold and disclosed destination/commodity stamps on accepted rows; no natural flight and no natural trip times.';

  const placeAtBerth = (system = null) => c.eval(`(()=>{const x=window.__ctx;
    if(${JSON.stringify(system)}){ if(x.flags.docked) x.stationDesk.undock(); x.world.currentSystem=${JSON.stringify(system)}; x.emit('systemLoaded',{to:${JSON.stringify(system)}}); }
    const p=x.systems[x.world.currentSystem].station.position;
    for(const s of x.ships) if(s?.object) s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
    x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;x.world.credits=20000;
    return x.world.currentSystem;})()`);
  const setHold = (rows) => c.eval(`(()=>{const x=window.__ctx;x.cargo.length=0;for(const r of ${JSON.stringify(rows)})x.cargo.push({commodity:r[0],units:r[1]});return x.cargo.slice();})()`);
  const rowsOf = () => c.eval(`(()=>{const x=window.__ctx;return x.world.jobs.filter(j=>j&&j.state==='accepted').map(j=>({id:j.id,kind:j.kind,commodity:j.commodity??null,dest:j.destSystem??null}));})()`);
  const stateOf = (ids) => c.eval(`(()=>{const x=window.__ctx;return ${JSON.stringify(ids)}.map(id=>{const j=x.world.jobs.find(r=>r&&r.id===id);return j?j.state:'gone';});})()`);
  const deskLines = () => c.eval(`Array.from(document.querySelectorAll('.job-card'),n=>n.innerText).filter(t=>t.includes('ACCEPTED'))`);

  const HOME = 'freehold';
  await placeAtBerth(HOME);
  await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked, 15, 'dock');
  await act('openService', { id: 'jobs' });

  // --- five agreements, all bound for the same dock -----------------------
  assert.equal((await act('acceptJob', { id: 'haul-provisions' })).ok, true, 'unique consignment accepted');
  const offers = (await observe()).jobs.offers;
  const pick = (kind, n) => offers.filter((j) => j.kind === kind).slice(0, n).map((j) => j.id);
  const tradeIds = pick('trade', 2);
  const partyIds = pick('passenger', 2);
  assert.equal(tradeIds.length, 2, 'two trade postings on the board');
  assert.equal(partyIds.length, 2, 'two parties on the board');
  for (const id of [...tradeIds, ...partyIds]) {
    assert.equal((await act('acceptJob', { id })).ok, true, 'accepted ' + id);
  }
  // Disclosed fixture: the unique consignment's own destination is the berth
  // under test, and every ordinary agreement is stamped to that same dock. One
  // trade row carries the commodity the consignment needs, one does not.
  const dest = await c.eval(`(()=>{const x=window.__ctx;const gates=x.systems[x.world.currentSystem].gates||[];return gates[0]?.to??null;})()`)
    || await c.eval(`(()=>{const x=window.__ctx;return Object.keys(x.systems).find(id=>id!==x.world.currentSystem);})()`);
  assert.ok(dest, 'the primary gate names a destination dock');
  await c.eval(`(()=>{const x=window.__ctx,ids=${JSON.stringify([...tradeIds, ...partyIds])};
    for(const id of ids){const j=x.world.jobs.find(r=>r&&r.id===id);if(j)j.destSystem=${JSON.stringify(dest)};}
    const a=x.world.jobs.find(r=>r&&r.id===${JSON.stringify(tradeIds[0])});if(a){a.commodity='provisions';a.need=5;}
    const b=x.world.jobs.find(r=>r&&r.id===${JSON.stringify(tradeIds[1])});if(b){b.commodity='refinedMetals';b.need=5;}
    return true;})()`);
  result.agreements = await rowsOf();
  result.dest = dest;
  // The exact quotes the five rows locked at acceptance. The berth owes this
  // sum and nothing else.
  result.lockedQuotes = await c.eval(`(()=>{const x=window.__ctx;return ${JSON.stringify(['haul-provisions', ...tradeIds, ...partyIds])}.map(id=>{const j=x.world.jobs.find(r=>r&&r.id===id);return {id,payQuoted:j?.payQuoted??null};});})()`);
  assert.ok(result.lockedQuotes.every((r) => Number.isFinite(r.payQuoted)),
    'every row locked a quote: ' + JSON.stringify(result.lockedQuotes));
  result.expectedPay = result.lockedQuotes.reduce((n, r) => n + r.payQuoted, 0);

  // --- the held row explains itself at a dock that cannot settle it -------
  await setHold([['provisions', 5]]);
  await act('openService', { id: 'jobs' });
  const heldRow = (await observe()).jobs.active.find((j) => j.id === tradeIds[0]);
  result.holdReason = heldRow?.holdReason ?? null;
  assert.ok(typeof result.holdReason === 'string' && result.holdReason.includes('unique consignment'),
    'the API names the hold: ' + JSON.stringify(result.holdReason));
  result.heldDeskLine = (await deskLines()).find((t) => t.includes('unique consignment')) ?? null;
  assert.ok(result.heldDeskLine, 'the desk row prints the same hold reason');
  // Put the held row in the viewport so the checkpoint screenshot shows it.
  result.heldRowRect = await c.eval(`(()=>{const card=Array.from(document.querySelectorAll('.job-card')).find(e=>e.innerText.includes('unique consignment'));if(!card)return null;card.scrollIntoView({block:'center'});const r=card.getBoundingClientRect();return {text:card.innerText,rect:r.toJSON(),inViewport:r.top>=0&&r.bottom<=innerHeight};})()`);
  assert.ok(result.heldRowRect, 'the held row is rendered');
  assert.equal(result.heldRowRect.inViewport, true, 'the held row is in the viewport for the shot');
  await checkpoint('held-row');

  // --- one berth settles all five ----------------------------------------
  const ids = ['haul-provisions', ...tradeIds, ...partyIds];
  await setHold([['provisions', 10], ['refinedMetals', 5]]);
  await placeAtBerth(dest);
  // Baseline before the hull is anywhere near the berth: a reading taken after
  // the dock action could already have lost a frame's settlement to the tick.
  const before = (await observe()).world.credits;
  await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked, 15, 'dock at the destination');
  result.statesOnArrival = await stateOf(ids);
  await sleep(4000); // one berth, no undock: the throttled delivery tick runs
  const settled = await checkpoint('same-berth-settled');
  result.statesAfter = await stateOf(ids);
  result.paid = settled.world.credits - before;
  assert.equal(settled.flags.docked, true, 'never relaunched');
  assert.ok(result.statesAfter.every((s) => s !== 'accepted'),
    'every delivery settled in one berth: ' + JSON.stringify(result.statesAfter));
  assert.equal(result.paid, result.expectedPay,
    'the berth paid exactly the five locked quotes');

  // --- and a settled berth pays nothing more ------------------------------
  await sleep(3000);
  const again = await observe();
  result.creditsAfterIdle = again.world.credits;
  assert.equal(again.world.credits, settled.world.credits, 'repeated ticks never pay twice');
  assert.ok(!(await observe()).jobs.active.some((j) => j.holdReason),
    'no stale hold reason survives settlement');
  await save();
});
