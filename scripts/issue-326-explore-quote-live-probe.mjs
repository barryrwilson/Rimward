/**
 * Issue #326 live verification — the explore offer's API reward matches the
 * Jobs card's displayed quote and the accepted contract's payQuoted.
 *
 * Disposable loopback Chromium (issue-74 harness), real application, real agent
 * handle, real flight. Fresh Greenhand at Freehold: docked, open Jobs, read the
 * explore card reward line from the DOM and jobs.offers[].reward, assert both
 * are the origin quote 420. Accept, assert jobs.active[].reward === payQuoted
 * === the accepted card line. Then fly the real survey marker with setControl
 * until The Shepherd is witnessed, fly home with approachDock and verify the
 * filed payment equals the stamped payQuoted, once.
 *
 * Fixtures: none in the offer/pay path. The only reads beyond the public agent
 * handle are window.__ctx.world.jobs for the raw persisted reward (evidence)
 * and DOM text for the card line. No pose, credit or progress writes.
 *
 * Run: npm run test:issue-326-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

process.env.ISSUE74_OUT = process.env.ISSUE326_OUT || resolve('out/issue-326-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('explore-quote', async ({ c, result, act, observe, wait, checkpoint, save }) => {
  result.fixture = false;
  result.method = 'Fresh Greenhand start through public actions. The real Freehold explore offer is read from the rendered Jobs card and jobs.offers, accepted through the Jobs service, and the accepted row and card are read again. The ship undocks and flies the accepted contract marker with setControl (public control lease) until The Shepherd is witnessed, then approachDock flies home and the berth files the survey. No pose, credit, progress or mystery writes.';
  result.assertionScope = 'PASS means this run observed the explore quote parity on the rendered card, the v2 offer/active rows and the filed payment, with clean browser console and stable runtime source; it is not independent QA of the probe.';

  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const key = async (code, keyName, vk) => {
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  };
  const escape = () => key('Escape', 'Escape', 27);
  const exploreOffers = (o) => o.jobs.offers.filter((j) => j.kind === 'explore');
  const activeExplore = (o) => o.jobs.active.filter((j) => j.kind === 'explore');
  const rawJobs = () => c.eval('JSON.parse(JSON.stringify(window.__ctx.world.jobs))');
  // The rendered explore card's own reward line, located by its title.
  const cardLine = (title) => c.eval(`(()=>{const card=Array.from(document.querySelectorAll('.job-card')).find(e=>e.querySelector('.job-title')?.textContent.includes(${JSON.stringify(title)}));if(!card)return null;return card.querySelector('.job-reward')?.textContent??'';})()`);
  const payOf = (line) => {
    const m = String(line).match(/pays (\d+) UU/);
    assert.ok(m, 'the card prints a UU quote: ' + line);
    return Number(m[1]);
  };

  async function launch() {
    const began = Date.now();
    for (;;) {
      const r = await act('undock', {}, false);
      if (r.ok) return r;
      if (r.token !== 'blocked' || Date.now() - began > 60000) throw Error('Bounded launch unavailable ' + JSON.stringify(r));
      await sleep(750);
    }
  }

  // ---- Freehold: docked fresh board, read the offer quote from card and API.
  let s = await observe();
  if (!s.flags.docked) {
    const receipt = await act(s.station.inZone ? 'dock' : 'approachDock');
    result.actions.at(-1).label = 'initial Freehold dock';
    await wait((o) => o.flags.docked, 240, 'initial Freehold dock');
  }
  await act('openService', { id: 'jobs' });
  await sleep(500);
  let o = await observe();
  const initial = exploreOffers(o);
  assert.equal(initial.length, 1, 'Freehold posts one survey card: ' + JSON.stringify(o.jobs.offers));
  assert.equal(initial[0].originSystem, 'freehold');
  assert.equal(initial[0].reward, 420, 'the offered API reward is the origin quote 420');
  const offerTitle = initial[0].title;
  const offerLine = await cardLine(offerTitle);
  const offerCardPay = payOf(offerLine);
  assert.equal(offerCardPay, initial[0].reward, 'card and API offer quote agree');
  assert.equal(offerCardPay, 420, 'pre-epic Freehold quote is 420');
  const rawOffer = (await rawJobs()).find((j) => j.id === initial[0].id);
  assert.equal(rawOffer.reward, 300, 'the raw persisted reward stays 300');
  result.offer = { offer: initial[0], line: offerLine, cardPay: offerCardPay, rawReward: rawOffer.reward };
  await checkpoint('01-offer-quote-parity');

  // ---- Accept through the Jobs service; card and active row keep the quote.
  const accepted = await act('acceptJob', { id: initial[0].id });
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  assert.equal(accepted.notice, `Accepted: ${offerTitle}`, 'the desk success notice is the accepted card line');
  await sleep(400);
  o = await observe();
  const active = activeExplore(o);
  assert.equal(active.length, 1, 'the accepted survey is observable in flight');
  assert.equal(active[0].state, 'accepted');
  assert.equal(active[0].payQuoted, 420, 'the accepted contract keeps the 420 agreement');
  assert.equal(active[0].reward, 420, 'the active API reward reports payQuoted');
  const acceptedLine = await cardLine(offerTitle);
  const acceptedCardPay = payOf(acceptedLine);
  assert.equal(acceptedCardPay, active[0].payQuoted, 'the accepted card prints payQuoted');
  assert.equal(acceptedCardPay, active[0].reward, 'accepted card and API active row agree');
  const rawAccepted = (await rawJobs()).find((j) => j.id === initial[0].id);
  assert.equal(rawAccepted.reward, 300, 'accepting never rewrites the raw reward');
  assert.equal(rawAccepted.payQuoted, 420, 'the stamped agreement is the persisted payQuoted');
  result.accepted = { active: active[0], line: acceptedLine, cardPay: acceptedCardPay, rawReward: rawAccepted.reward, rawPayQuoted: rawAccepted.payQuoted };
  await checkpoint('02-accepted-quote-parity');

  // ---- Real flight to the accepted marker, witnessed by proximity.
  await escape();
  await launch();
  await wait((x) => x.flags.docked === false && x.flags.berthHold === false, 60, 'undock settles');
  result.undockedAt = (await observe()).t;

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
  const witnessed = await c.eval('JSON.parse(JSON.stringify(window.__ctx.world.mystery?.visited ?? []))');
  assert.ok(witnessed.includes('fh_shepherd'), 'The Shepherd is witnessed: ' + JSON.stringify(witnessed));
  result.witness = { atT: last.t, visited: witnessed, objective: activeExplore(last)[0]?.objective };
  await checkpoint('03-shepherd-witnessed');

  // ---- Real flight home, then file at the berth: exactly one payment.
  const creditsBefore = (await observe()).world.credits;
  const quoted = (await observe()).jobs.active.find((j) => j.kind === 'explore').payQuoted;
  const dockReceipt = await act('approachDock');
  result.returnDock = dockReceipt;
  await wait((x) => x.flags.docked, 240, 'approachDock returns to Freehold');
  const paidAt = await wait((x) => x.world.credits === creditsBefore + quoted, 30, 'survey filing payment');
  const delta = paidAt.world.credits - creditsBefore;
  assert.equal(delta, quoted, 'the filed payment equals payQuoted');
  const delivered = (await observe()).events.find((e) => e.type === 'jobState'
    && e.kind === 'explore' && e.outcome === 'delivered');
  assert.ok(delivered, 'a delivered jobState outcome is observable');
  assert.equal(delivered.pay, quoted, 'the jobState receipt pay equals payQuoted');
  result.filed = { creditsBefore, quoted, creditsAfter: paidAt.world.credits, delta, delivered, t: paidAt.t };
  assert.equal(activeExplore(await observe()).length, 0, 'the filed contract is no longer active');
  await checkpoint('04-survey-filed-once');

  await save();
});
