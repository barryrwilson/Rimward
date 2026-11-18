/**
 * Issue #327 live verification — one-landmark Freehold survey lifecycle.
 *
 * Disposable loopback Chromium (issue-74 harness), real application, real
 * agent handle, real flight. Fresh Greenhand: accept the only Freehold survey,
 * undock, fly the real survey marker with setControl until The Shepherd is
 * witnessed, fly home with approachDock, and file at the berth. Then check the
 * witnessed dock retires its explore section (no card, no repeat pay, board
 * note) and that Veridian still posts fresh survey work after a real gate run.
 *
 * Fixtures: none in the offer/pay/witness path. The only reads beyond the
 * public agent handle are `window.__ctx.world.mystery.visited` for evidence
 * and DOM text for the board note. No pose, credit or progress writes.
 *
 * Run: npm run test:issue-327-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

process.env.ISSUE74_OUT = process.env.ISSUE327_OUT || resolve('out/issue-327-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('explore-witnessed', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = false;
  result.method = 'Fresh Greenhand start through public actions. The real Freehold survey offer is accepted through the Jobs service, the ship undocks and flies the accepted contract marker with setControl (public control lease) until The Shepherd is witnessed, then approachDock flies home and the berth files the survey. The board, pay and no-repeat checks are the running game. A real plotRoute/engageAutopilot/approachDock gate run then docks at Veridian to confirm fresh survey work. No pose, credit, progress or mystery writes.';
  result.assertionScope = 'PASS means this run completed the witnessed-survey lifecycle with clean browser console and stable runtime source; it is not independent QA of the probe.';

  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const key = async (code, keyName, vk) => {
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  };
  const escape = () => key('Escape', 'Escape', 27);
  const exploreOffers = (o) => o.jobs.offers.filter((j) => j.kind === 'explore');
  const activeExplore = (o) => o.jobs.active.filter((j) => j.kind === 'explore');
  const visited = () => c.eval('JSON.parse(JSON.stringify(window.__ctx.world.mystery?.visited ?? []))');
  const boardNotes = () => c.eval("Array.from(document.querySelectorAll('.screen-note'),(e)=>e.textContent)");
  const boardCards = () => c.eval("Array.from(document.querySelectorAll('.job-card'),(e)=>({title:e.querySelector('.job-title')?.textContent??'',detail:e.querySelector('.job-detail')?.textContent??'',state:e.querySelector('.job-state')?.textContent??''}))");

  async function launch() {
    const began = Date.now();
    for (;;) {
      const r = await act('undock', {}, false);
      if (r.ok) return r;
      if (r.token !== 'blocked' || Date.now() - began > 60000) throw Error('Bounded launch unavailable ' + JSON.stringify(r));
      await sleep(750);
    }
  }

  async function dockAtCurrent(label) {
    const s = await observe();
    if (s.flags.docked) return s;
    const receipt = await act(s.station.inZone ? 'dock' : 'approachDock');
    result.actions.at(-1).label = label;
    await wait((o) => o.flags.docked, 240, label);
    return observe();
  }

  // ---- Freehold: fresh board, accept its only survey.
  let s = await dockAtCurrent('initial Freehold dock');
  await act('openService', { id: 'jobs' });
  await sleep(500);
  let o = await observe();
  const initial = exploreOffers(o);
  assert.equal(initial.length, 1, 'Freehold posts one survey card: ' + JSON.stringify(o.jobs.offers));
  assert.equal(initial[0].originSystem, 'freehold');
  result.initialOffer = initial[0];
  const accepted = await act('acceptJob', { id: initial[0].id });
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  o = await observe();
  const active = activeExplore(o);
  assert.equal(active.length, 1, 'the accepted survey is observable in flight');
  assert.equal(active[0].state, 'accepted');
  const quoted = active[0].payQuoted;
  assert.ok(Number.isFinite(quoted) && quoted > 0, 'the accepted quote is finite');
  result.accepted = active[0];
  await checkpoint('01-freehold-survey-accepted');

  await escape();
  await launch();
  await wait((x) => x.flags.docked === false && x.flags.berthHold === false, 60, 'undock settles');
  result.undockedAt = (await observe()).t;

  // ---- Real flight to the accepted marker, witnessed by proximity.
  let seq = 0;
  const flightStart = (await observe()).t;
  const wallStart = Date.now();
  const trace = [];
  let traceAt = -Infinity;
  let last = null;
  for (;;) {
    const x = await observe();
    const job = activeExplore(x)[0];
    if (!job) throw Error('accepted survey vanished in flight ' + JSON.stringify(x.jobs));
    const obj = job.objective;
    if (obj.discovered) { last = x; break; }
    if (obj.status !== 'available') throw Error('survey objective unavailable: ' + JSON.stringify(obj));
    const b = obj.bearing;
    const align = -b[2];
    const off = Math.hypot(b[0], b[1]);
    // Point and burn: coast while the nose is off the marker, then thrust
    // only once it is on the bearing. Continuous thrust while slewing at the
    // freighter RCS rate otherwise settles into a wide orbit.
    const onBearing = align > 0.985 && off < 0.15;
    const throttle = onBearing ? (obj.range < 130 ? 0.3 : 0.7) : 0;
    const steerX = clamp(b[0] * 1.6);
    const steerY = clamp(b[1] * 1.6);
    const receipt = await act('setControl', { seq: ++seq, ttl: 3, throttle, steerX, steerY }, false);
    if (!receipt.ok) throw Error('setControl refused: ' + JSON.stringify(receipt));
    if (x.t - traceAt >= 1) {
      traceAt = x.t;
      trace.push({ t: x.t, range: obj.range, bearing: b, align, off, speed: x.ship.speed, throttle, pos: x.ship.pos });
      if (trace.length > 180) trace.shift();
    }
    if (x.t - flightStart > 150 || Date.now() - wallStart > 240000) {
      result.flightTrace = trace.slice(-40);
      throw Error('survey flight timeout ' + JSON.stringify({ t: x.t, objective: obj, ship: x.ship, flags: x.flags, trace: trace.slice(-12) }));
    }
    await sleep(300);
  }
  result.flightTrace = trace;
  await act('clearControl');
  const witnessed = await visited();
  assert.ok(witnessed.includes('fh_shepherd'), 'The Shepherd is witnessed: ' + JSON.stringify(witnessed));
  result.witness = { atT: last.t, visited: witnessed, objective: activeExplore(last)[0]?.objective };
  await checkpoint('02-shepherd-witnessed');

  // ---- Real flight home, then file at the berth: one payment.
  const creditsBefore = (await observe()).world.credits;
  const dockReceipt = await act('approachDock');
  result.returnDock = dockReceipt;
  await wait((x) => x.flags.docked, 240, 'approachDock returns to Freehold');
  const paidAt = await wait((x) => x.world.credits === creditsBefore + quoted, 30, 'survey filing payment');
  result.filed = { creditsBefore, quoted, creditsAfter: paidAt.world.credits, t: paidAt.t };
  assert.equal((await observe()).world.credits, creditsBefore + quoted, 'the one earned payment lands');
  assert.equal(activeExplore(await observe()).length, 0, 'the filed contract is no longer active');
  await checkpoint('03-survey-filed-once');

  // ---- Witnessed dock: no card, no repeat pay, board explains the gate.
  await act('openService', { id: 'jobs' });
  await sleep(600);
  o = await observe();
  assert.equal(exploreOffers(o).length, 0, 'the witnessed dock posts no explore card');
  const notes = await boardNotes();
  assert.ok(notes.some((t) => t.includes('every survey site for this dock is already witnessed')),
    'the board names the witnessed dock: ' + JSON.stringify(notes));
  result.freeholdBoard = { offers: o.jobs.offers, notes, cards: await boardCards() };
  const creditsAfterPay = o.world.credits;
  await sleep(3000);
  o = await observe();
  assert.equal(o.world.credits, creditsAfterPay, 'no berth-side repeat payout');
  result.noRepeat = { creditsAfterPay, creditsLater: o.world.credits };
  await checkpoint('04-freehold-board-retired');

  // ---- Gate to Veridian and dock: fresh survey work waits there.
  await escape();
  await launch();
  await wait((x) => x.flags.docked === false && x.flags.berthHold === false, 60, 'second undock settles');
  const plotted = await act('plotRoute', { dest: 'veridian' });
  assert.equal(plotted.ok, true, JSON.stringify(plotted));
  await act('engageAutopilot');
  const queued = await act('approachDock');
  assert.equal(queued.status, 'queued', 'the arrival dock is queued: ' + JSON.stringify(queued));
  await wait((x) => x.flags.docked === true && x.world.currentSystem === 'veridian', 300, 'gate run to Veridian and dock');
  result.veridianArrival = { t: (await observe()).t, system: (await observe()).world.currentSystem };
  await act('openService', { id: 'jobs' });
  await sleep(600);
  o = await observe();
  const veridianOffers = exploreOffers(o);
  assert.equal(veridianOffers.length, 1, 'Veridian posts fresh survey work: ' + JSON.stringify(o.jobs.offers));
  assert.equal(veridianOffers[0].originSystem, 'veridian');
  assert.match(veridianOffers[0].title, /Hulk Row/, 'the card names the unwitnessed Veridian landmark');
  const veridianNotes = await boardNotes();
  assert.ok(!veridianNotes.some((t) => t.includes('every survey site for this dock is already witnessed')),
    'Veridian is not exhausted: ' + JSON.stringify(veridianNotes));
  result.veridianBoard = { offers: veridianOffers, notes: veridianNotes };
  await checkpoint('05-veridian-fresh-survey');

  await save();
});
