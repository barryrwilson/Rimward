/** #223: quote survives real periodic board refresh and economic drift. */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
for (const el of dom.walkDom(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
const rw = window.rimward;
const act = (name, args = {}) => rw.act({ v: 2, name, args });
const p = ctx.systems[ctx.world.currentSystem].station.position;
ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
ctx.input.dockPressed = true;
station.update(1 / 60); ctx.lastEvents = []; station.update(1 / 60);
assert.equal(ctx.flags.docked, true);
assert.equal(act('openService', { id: 'jobs' }).ok, true);
function cardPay(job) {
  const card = [...dom.walkDom(document.body)].find(n => n.className === 'job-card'
    && [...dom.walkDom(n)].some(c => c.className === 'job-title' && c.textContent.includes(job.title)));
  const line = [...dom.walkDom(card)].find(n => n.className === 'job-reward').textContent;
  return Number(line.match(/pays (\d+) UU/)[1]);
}
for (const drift of [false, true]) {
  // Restore-shaped JSON records must work without object-identity caches.
  if (drift) ctx.world.jobs = JSON.parse(JSON.stringify(ctx.world.jobs));
  const offered = rw.observe().jobs.offers.find(j => j.kind === 'trade');
  assert.ok(offered);
  const job = ctx.world.jobs.find(j => j.id === offered.id);
  const quote = cardPay(job);
  assert.equal(offered.reward, quote);
  if (drift) {
    ctx.world.prices[job.commodity] += 73;
    ctx.world.time += 2;
    ctx.elapsed += 2;
    station.update(1.1); // real passive refresh, not an explicit service selection
    assert.equal(cardPay(job), quote, 'passive redraw retains the posted reward');
    assert.equal(rw.observe().jobs.offers.find(j => j.id === job.id).reward, quote);
  }
  const receipt = act('acceptJob', { id: job.id });
  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  assert.ok(receipt.notice.includes(`pays ${quote} UU`), receipt.notice);
  assert.equal(job.payQuoted, quote);
  assert.equal(cardPay(job), quote);
  ctx.world.prices[job.commodity] += 91;
  station.update(1.1);
  const active = rw.observe().jobs.active.find(j => j.id === job.id);
  assert.equal(active.reward, quote);
  assert.equal(active.payQuoted, quote);
  assert.equal(act('acceptJob', { id: job.id }).ok, false);
  assert.equal(job.payQuoted, quote);
  console.log('PASS #223', drift ? 'price/time drift across passive redraw' : 'immediate acceptance', quote);
}
