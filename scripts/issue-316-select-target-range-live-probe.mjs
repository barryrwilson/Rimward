/**
 * Issue #316 live verification — the targeting-ceiling refusal in a real
 * browser. Disposable loopback Chromium (issue-169/issue-74 harness pattern),
 * the real application and the real agent handle.
 *
 * The pirate playtest shape: a hull is locked through the public selectTarget
 * at a legal 400 u, then drifts to 766 u with the lock retained. The real act()
 * now answers token 'range' with a detail naming the target, its distance and
 * the 600 u ceiling instead of the overlay/service-looking 'no-service', and
 * observe().availability.selectTarget quotes the same sentence. An unknown id
 * still answers no-service, and the lock is not moved by the refusal.
 *
 * Fixtures are disclosed spatial staging only (issue-67 discipline): every
 * other live hull is parked far away and the chosen hull is moved after the
 * lock exists. ctx.targets is never written directly; the refusal, the receipt
 * and the availability entry are the running game's own.
 *
 * Run: npm run test:select-target-range-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

process.env.ISSUE74_OUT = process.env.ISSUE316_OUT || resolve('out/issue-316-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('select-target-range', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'Fresh Greenhand start; every live hull is parked far away except one disclosed fixture hull, acquired through the real selectTarget at 400 u and then moved to 766 u after the lock exists. The refusal, the receipt detail and observe().availability are the running game\'s own; no pose or ctx.targets write decides the outcome.';

  if ((await observe()).flags.docked) await act('undock');
  await wait((s) => s.session.phase === 'playing', 25, 'playing');

  // A. Find one real live hull and park every other one, then stage the hull
  // at a legal acquisition distance. Spatial staging only; the player ship is
  // held still so the measured distance is not a race against the start drift.
  let staged = null;
  const stageAt = (offset, id) => {
    const wantId = JSON.stringify(id ?? null);
    return c.eval(`(()=>{const x=window.__ctx;
      const p=x.ship.object.position;
      x.ship.velocity.set(0,0,0); x.ship.speed=0; x.input.throttle=0;
      const want=${wantId};
      const live=(want!==null&&x.ships.find(s=>s&&s.id===want&&s.object&&s.state&&!s.state.destroyed))
        ||x.ships.find(s=>s&&s.object&&s.state&&!s.state.destroyed&&!s.lockKind);
      if(!live)return null;
      for(const s of x.ships){ if(s!==live&&s?.object) s.object.position.set(1e4,1e4,1e4); }
      live.object.position.set(p.x,p.y,p.z-${offset});
      return {id:live.id,name:(live.record&&live.record.name)||(live.state&&live.state.name)||null};})()`);
  };
  for (let i = 0; i < 40 && !staged; i++) {
    staged = await stageAt(400);
    if (!staged) await sleep(500);
  }
  assert.ok(staged && staged.id !== null, 'a live hull is staged at a legal acquisition distance');
  result.staged = staged;

  // B. The in-range id selection is unchanged. Re-stage immediately before the
  // call so the acquisition distance is the fixture's 400 u, not a drifted one.
  let lock = null;
  for (let i = 0; i < 15 && !(lock && lock.ok); i++) {
    await stageAt(400, staged.id);
    lock = await act('selectTarget', { id: staged.id }, false);
    if (!lock.ok) await sleep(150);
  }
  assert.ok(lock && lock.ok, 'the in-range id selection still succeeds: ' + JSON.stringify(lock));
  assert.equal(lock.token, '');
  assert.equal(Object.hasOwn(lock, 'detail'), false, 'in-range acceptance adds no detail');
  const locked = await observe();
  assert.equal(locked.targets.current && locked.targets.current.id, staged.id, 'the lock moved on acceptance');
  result.lock = lock;

  // C. The hull crosses the ceiling with the lock retained (the playtest shape).
  const moved = await c.eval(`(()=>{const x=window.__ctx;const p=x.ship.object.position;
    x.ship.velocity.set(0,0,0); x.ship.speed=0; x.input.throttle=0;
    const t=x.ships.find(s=>s&&s.id===${JSON.stringify(staged.id)}&&s.object);
    if(!t)return 'gone';
    for(const s of x.ships){ if(s!==t&&s?.object) s.object.position.set(1e4,1e4,1e4); }
    t.object.position.set(p.x,p.y,p.z-766.4);
    return 'moved';})()`);
  assert.equal(moved, 'moved', 'the locked hull moved past the ceiling');
  await sleep(250);
  const farObs = await observe();
  assert.equal(farObs.targets.current && farObs.targets.current.id, staged.id, 'the retained lock survives the move');
  assert.ok(farObs.targets.current.range > 600, 'the locked hull reads beyond the ceiling: ' + farObs.targets.current.range);

  // D. act() and observe() in the SAME JS turn, so both read the same frame:
  // the receipt and the availability entry must quote one sentence. Traffic
  // spawned since the first park is moved away in the same turn (fixture
  // staging only) so the ceiling is the only reason left.
  const pair = await c.eval(`(()=>{const x=window.__ctx;
    const p=x.ship.object.position;
    x.ship.velocity.set(0,0,0); x.ship.speed=0; x.input.throttle=0;
    const t=x.ships.find(s=>s&&s.id===${JSON.stringify(staged.id)}&&s.object);
    if(t) t.object.position.set(p.x,p.y,p.z-766.4);
    for(const s of x.ships){ if(s!==t&&s?.object) s.object.position.set(1e4,1e4,1e4); }
    const receipt=window.rimward.act({v:2,name:'selectTarget',args:{id:${JSON.stringify(staged.id)}}});
    const obs=window.rimward.observe();
    return {receipt, availability:obs.availability.selectTarget, currentId:(obs.targets.current&&obs.targets.current.id)||null};})()`);
  const refused = pair.receipt;
  assert.equal(refused.ok, false, 'the out-of-ceiling id call is refused');
  assert.equal(refused.token, 'range', 'the token names the range precondition, not no-service');
  assert.equal(refused.error, 'range');
  assert.equal(typeof refused.detail, 'string', 'the refusal carries a detail');
  assert.match(refused.detail, /targeting ceiling is 600 u/, 'the detail names the ceiling');
  assert.match(refused.detail, /\d+ u away/, 'the detail names the measured distance');
  assert.ok(refused.detail.includes(String(staged.name ?? staged.id)), 'the detail names the target: ' + refused.detail);
  assert.equal(pair.availability.ok, false, 'availability no longer claims selectTarget is open');
  assert.equal(pair.availability.reason, 'range', 'availability carries the same reason');
  assert.equal(pair.availability.detail, refused.detail, 'availability quotes the act refusal verbatim');
  assert.equal(pair.currentId, staged.id, 'the range refusal moves no lock');
  result.refused = refused;
  result.availability = pair.availability;

  // E. The receipt is mirrored in lastIntent for a runner that reads observe.
  // Read it before the unknown-id call so lastIntent is still the range receipt.
  const last = (await observe()).lastIntent;
  assert.equal(last.name, 'selectTarget');
  assert.equal(last.detail, refused.detail, 'lastIntent mirrors the receipt detail');
  result.lastIntent = last;

  // F. An unknown id keeps the old no-service token and no detail.
  const unknown = await act('selectTarget', { id: 'rec-no-such-hull' }, false);
  assert.equal(unknown.token, 'no-service', 'an unknown id stays no-service');
  assert.equal(Object.hasOwn(unknown, 'detail'), false, 'and carries no detail');
  result.unknown = unknown;

  await checkpoint('range-refusal');
});
