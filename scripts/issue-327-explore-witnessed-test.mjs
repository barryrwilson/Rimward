/**
 * Issue #327 — a witnessed landmark is not offered or paid again at the same
 * station. The explorer playtest accepted 279 Freehold surveys for 133,938 UU:
 * one real excursion to The Shepherd, then 278 berth-side instant payouts for
 * the same witnessed site. The owner decided witnessed work must not pay again
 * and must not be offered again at that dock; the explorer takes a gate to a
 * new system for fresh survey work.
 *
 * This test drives the real station system and the real Jobs board. Fixtures are
 * disclosed mystery.visited writes (the discovery state the delivery tick reads)
 * and one synthetic offered row for the restore shape; the offer/pay decisions,
 * the tick withdrawal, the board copy and the API offers block are the running
 * game's own.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-327-explore-witnessed-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems, makeTick } from './lib/boot-harness.mjs';
import { SYSTEMS } from '../src/game/state.js';
import { resolveExploreSite } from '../src/game/survey-nav.js';
import { snapshot, restore } from '../src/game/save.js';

seedBootRandom();
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];

const dt = 1 / 60;
let frame = 0;
let updateErrors = 0;
const tick = makeTick(ctx, systems, {
  get frame() { return frame; },
  set frame(v) { frame = v; },
}, dt, (e, frameNo, label) => {
  updateErrors++;
  console.log(`UPDATE ERR frame ${frameNo} (${label}): ${e.message}`);
});

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };
const nodes = () => [...dom.walkDom(document.body)];
const notes = () => nodes()
  .filter((n) => String(n.className ?? '').split(' ').includes('screen-note'))
  .map((n) => String(n.textContent ?? ''));
const observe = () => window.rimward.observe();
const openBoard = () => ctx.stationDesk.selectService('jobs');
const exploreLive = (sys) => ctx.world.jobs.filter((j) => j && j.kind === 'explore'
  && j.originSystem === sys && (j.state === 'offered' || j.state === 'accepted'));
const apiOffers = () => observe().jobs.offers.filter((j) => j.kind === 'explore');

function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }];
  world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, 'docked at ' + id);
}

// Fresh boot: title -> new -> first origin (Freehold Greenhand).
for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;
ctx.world.mystery ??= { found: [], visited: [], charted: [] };
if (!Array.isArray(ctx.world.mystery.visited)) ctx.world.mystery.visited = [];

// A. Fresh Freehold board: one card for its only landmark (twin collapse).
check('fresh Freehold board posts one survey for its only landmark', () => {
  dock('freehold');
  openBoard();
  tick(40, 'fresh board');
  const live = exploreLive('freehold');
  assert.equal(live.length, 1, JSON.stringify(live.map((j) => j.id)));
  assert.equal(live[0].state, 'offered');
  assert.equal(live[0].slot, 0);
  assert.equal(SYSTEMS.freehold.landmarks[0].id, 'fh_shepherd');
  const offer = apiOffers();
  assert.equal(offer.length, 1, 'the API offers block lists the same one card');
  assert.equal(offer[0].originSystem, 'freehold');
  assert.ok(!JSON.stringify(offer[0]).includes('fh_shepherd'), 'the offer row hides the landmark id');
});

// B. Offered withdrawal replaces the same unwitnessed site and pays nothing.
check('an expired offered posting is replaced for the same unwitnessed site', () => {
  const before = exploreLive('freehold')[0];
  const id = before.id;
  const slot = before.slot;
  const credits = ctx.world.credits;
  before.deadline = ctx.world.time - 1;
  tick(40, 'offered expire');
  assert.ok(!ctx.world.jobs.some((j) => j.id === id), 'the expired posting is spliced');
  assert.equal(ctx.world.credits, credits, 'withdrawal pays nothing');
  const live = exploreLive('freehold');
  assert.equal(live.length, 1);
  assert.notEqual(live[0].id, id);
  assert.equal(live[0].slot, slot);
  assert.equal(live[0].state, 'offered');
});

// C. Accepted expiry: no pay, replacement for the unwitnessed site.
check('an accepted expiry pays nothing and replaces the unwitnessed posting', () => {
  const live = exploreLive('freehold')[0];
  const id = live.id;
  const slot = live.slot;
  const credits = ctx.world.credits;
  const r = window.rimward.act({ v: 2, name: 'acceptJob', args: { id } });
  assert.equal(r.ok, true, JSON.stringify(r));
  const accepted = ctx.world.jobs.find((j) => j.id === id);
  assert.equal(accepted.state, 'accepted');
  assert.ok(Number.isFinite(accepted.payQuoted));
  accepted.deadline = ctx.world.time - 1;
  tick(40, 'accepted expire');
  assert.ok(!ctx.world.jobs.some((j) => j.id === id), 'the lapsed contract is spliced');
  assert.equal(ctx.world.credits, credits, 'a lapse pays nothing');
  const after = exploreLive('freehold');
  assert.equal(after.length, 1);
  assert.equal(after[0].slot, slot);
  assert.equal(after[0].state, 'offered');
});

// D. Witnessed filing pays once and retires the slot; no berth-side repeat.
check('filing a witnessed survey pays once and retires the dock slot', () => {
  const live = exploreLive('freehold')[0];
  const id = live.id;
  const r = window.rimward.act({ v: 2, name: 'acceptJob', args: { id } });
  assert.equal(r.ok, true, JSON.stringify(r));
  const accepted = ctx.world.jobs.find((j) => j.id === id);
  const quoted = accepted.payQuoted;
  assert.ok(Number.isFinite(quoted) && quoted > 0, 'the accepted quote is finite');
  ctx.world.mystery.visited.push('fh_shepherd'); // fixture: the flight that witnesses the site
  const credits = ctx.world.credits;
  tick(60, 'file witnessed');
  assert.equal(ctx.world.credits, credits + quoted, 'the one earned payment');
  assert.ok(!ctx.world.jobs.some((j) => j.id === id), 'the delivered contract is spliced');
  assert.equal(exploreLive('freehold').length, 0, 'the witnessed slot is retired');
  const afterPay = ctx.world.credits;
  tick(120, 'no repeat pay');
  assert.equal(ctx.world.credits, afterPay, 'later ticks pay nothing');
  openBoard();
  tick(1, 'board re-render');
  assert.equal(exploreLive('freehold').length, 0, 'reopening the board posts nothing');
  assert.ok(notes().some((t) => t.includes('every survey site for this dock is already witnessed')),
    'the board names why the explore section is empty');
  assert.equal(apiOffers().length, 0, 'the API offers block agrees');
});

// E. The career continues at another dock.
check('a different dock still posts its own unwitnessed survey', () => {
  dock('veridian');
  openBoard();
  tick(40, 'veridian board');
  const live = exploreLive('veridian');
  assert.equal(live.length, 1);
  assert.equal(live[0].slot, 0);
  assert.equal(resolveExploreSite(ctx, 'veridian', 0).landmark.id, 'vd_hulk_row');
});

// F. Two-landmark dock: each unwitnessed site fills its slot; witnessing one
// withdraws only that posting (tick path, board closed) and keeps the other.
check('a two-landmark dock keeps the unwitnessed survey when the other is witnessed', () => {
  dock('hollowreach');
  openBoard();
  tick(40, 'hollowreach board');
  const live = exploreLive('hollowreach');
  assert.equal(live.length, 2, 'two distinct sites fill two slots');
  assert.deepEqual(live.map((j) => j.slot).sort(), [0, 1]);
  assert.equal(resolveExploreSite(ctx, 'hollowreach', 0).landmark.id, 'hr_quiet_beacon');
  assert.equal(resolveExploreSite(ctx, 'hollowreach', 1).landmark.id, 'hr_first_wreck');
  const slot0Id = live.find((j) => j.slot === 0).id;
  const credits = ctx.world.credits;
  ctx.world.mystery.visited.push('hr_quiet_beacon');
  dom.dispatchKey('Escape'); // back to the services level; the Jobs pane is no longer rendered
  tick(40, 'closed-board witness');
  assert.ok(!ctx.world.jobs.some((j) => j.id === slot0Id), 'the witnessed posting is withdrawn');
  const after = exploreLive('hollowreach');
  assert.equal(after.length, 1, 'the unwitnessed sibling survives');
  assert.equal(after[0].slot, 1);
  assert.equal(ctx.world.credits, credits, 'withdrawal pays nothing');
});

// G. The last site retires the dock and the board says why.
check('witnessing the last site retires the dock and names the gate', () => {
  ctx.world.mystery.visited.push('hr_first_wreck');
  const credits = ctx.world.credits;
  tick(40, 'last witness');
  assert.equal(exploreLive('hollowreach').length, 0);
  assert.equal(ctx.world.credits, credits);
  openBoard();
  tick(1, 'hollowreach exhausted');
  assert.ok(notes().some((t) => t.includes('every survey site for this dock is already witnessed')));
});

// H. A restored offered row for a witnessed site is withdrawn without pay.
check('a restored offered survey for a witnessed site is withdrawn without pay', () => {
  const saved = snapshot(ctx);
  saved.world.mystery = { found: [], visited: ['hr_quiet_beacon', 'hr_first_wreck'], charted: [] };
  saved.world.jobs = [
    ...(saved.world.jobs ?? []),
    {
      id: 'explore-hollowreach-0',
      kind: 'explore',
      slot: 0,
      originSystem: 'hollowreach',
      title: 'Survey The Quiet Beacon',
      detail: 'Fly to The Quiet Beacon in Hollow Reach. Redock here to file.',
      reward: 300,
      need: 1,
      progress: 0,
      state: 'offered',
      deadline: 1e9,
    },
  ];
  restore(ctx, saved);
  const credits = ctx.world.credits;
  tick(40, 'restored witnessed offer');
  assert.ok(!ctx.world.jobs.some((j) => j.id === 'explore-hollowreach-0' && j.state === 'offered'),
    'the restored witnessed posting is withdrawn');
  assert.equal(ctx.world.credits, credits, 'restore + withdrawal pays nothing');
  assert.equal(snapshot(ctx).v, 2, 'the save envelope is v2 after issue #340 (v1 is still accepted on load)');
  assert.equal(observe().v, 2, 'the agent API version stays 2');
});

assert.equal(updateErrors, 0, 'no system update errors');
console.log(`ISSUE #327 PASS (${checks} checks)`);
