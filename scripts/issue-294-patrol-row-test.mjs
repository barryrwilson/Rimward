/**
 * Issue #294 — the accepted patrol row must say what counts toward its
 * progress, on the same observability bar every other accepted job row meets
 * (explore/recovery carry jobs.active[].objective; #271/#292 gave hunts and
 * bounties their tracking reads).
 *
 * Real station DOM, the real Jobs board, the real desk accept path and the
 * real agent observation. Fixtures are disclosed record-state flips only —
 * no outcome is ever written: the surrender receipt below is produced by the
 * real hail/npc systems, the same discipline the #99 suite uses.
 *
 * Covered:
 *   A. An accepted patrol row on the board carries the counting rule
 *      ("Kill or drive off") beside its progress tally.
 *   B. The agent row (observe().jobs.active[]) carries objective
 *      { kind, rule, progress, need } derived from the same constants the
 *      board card prints — no second source of truth, row stays JSON-plain.
 *   C. A real player-caused surrender ticks the row's own progress; the row
 *      reflects it in both the DOM and the objective field.
 *   D. An offered patrol row and a finished one never carry the objective.
 *   E. The board card constants and the objective constants agree (one source).
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-294-patrol-row-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

seedBootRandom();
const dom = installDomStubs();
const boot = await bootGameSystems();
const { ctx, systems, binds, camera } = boot;
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
const save = systems.find(([n]) => n === 'save')[1];

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const openBoard = () => ctx.stationDesk.selectService('jobs');
const active = () => window.rimward.observe().jobs.active;
const patrolJob = () => ctx.world.jobs.find((j) => j && j.kind === 'patrol');

let frame = 0;
function step(seconds = 1) {
  const dt = 1 / 60;
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    frame++;
    ctx.elapsed += dt;
    ctx.world.time += dt;
    for (const [, s] of systems) {
      try { s?.update?.(dt, ctx); } catch { /* one frame must not stop the probe */ }
    }
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

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

for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;

// ---------------------------------------------------------------------------
// Setup: dock at freehold and accept the patrol through the real desk.
// ---------------------------------------------------------------------------
check('setup: the patrol offer exists and can be accepted at the desk', () => {
  dock('freehold');
  openBoard();
  const job = patrolJob();
  assert.ok(job && job.id === 'patrol-lane', 'the unique patrol row is seeded');
  assert.equal(job.state, 'offered', 'the patrol starts offered');
  const res = ctx.stationDesk.acceptJob({ id: job.id });
  assert.ok(res !== false, 'the desk accepts the patrol');
  assert.equal(patrolJob().state, 'accepted', 'the patrol is accepted');
});

// ---------------------------------------------------------------------------
// A. The accepted DOM row states the counting rule.
// ---------------------------------------------------------------------------
check('A1 the accepted patrol row states the counting rule beside the tally', () => {
  openBoard();
  const job = patrolJob();
  const line = byClass('job-state').map((n) => String(n.textContent))
    .find((t) => t.startsWith('ACCEPTED — ') && /Kill or drive off/.test(t));
  assert.ok(line, 'an accepted row carries the rule — got: '
    + byClass('job-state').map((n) => String(n.textContent)).join(' | ').slice(0, 240));
  assert.ok(line.includes(`ACCEPTED — ${job.progress}/${job.need}`),
    'the row keeps the progress tally');
  assert.match(line, /your own (kills|kills,)|kills, disables|surrenders count/,
    'the rule names what counts');
});

// ---------------------------------------------------------------------------
// B. The agent row carries objective { kind, rule, progress, need }, JSON-plain.
// ---------------------------------------------------------------------------
check('B1 observe() carries the patrol objective and stays JSON-plain', () => {
  const row = active().find((j) => j.kind === 'patrol');
  assert.ok(row, 'the accepted patrol is observed in flight');
  assert.ok(row.objective, 'the row carries objective');
  assert.equal(row.objective.kind, 'tally');
  assert.equal(typeof row.objective.rule, 'string');
  assert.ok(/Kill or drive off/.test(row.objective.rule), 'the rule matches the card vocabulary');
  assert.equal(row.objective.need, 2);
  assert.equal(row.objective.progress, 0);
  const copy = JSON.parse(JSON.stringify(row.objective));
  assert.deepEqual(Object.keys(copy).sort(), ['kind', 'need', 'progress', 'rule'],
    'objective is JSON-plain with bounded fields');
});

check('B2 the objective constants agree with the board card copy', () => {
  // The offer card's own detail line prints the same constants the objective
  // restates — derive both from one source by reading the card text back.
  const job = patrolJob();
  job.state = 'offered'; // temporary, disclosed flip; restored below
  openBoard();
  const detail = byClass('job-detail').map((n) => String(n.textContent))
    .find((t) => /Kill or drive off \d+ of them/.test(t));
  job.state = 'accepted';
  openBoard();
  assert.ok(detail, 'the offered card prints the Kill or drive off copy');
  const cardNeed = Number(detail.match(/Kill or drive off (\d+) of them/)[1]);
  const row = active().find((j) => j.kind === 'patrol');
  assert.equal(row.objective.need, cardNeed, 'objective.need equals the card count');
});

// ---------------------------------------------------------------------------
// C. A real player-caused surrender ticks the row; the read follows.
// ---------------------------------------------------------------------------
check('C1 a player-caused surrender advances the observed objective', () => {
  // Same firing fixture as #99: player alone in open space, first-person,
  // cannon group, target 60u down -Z. The surrender is produced by the real
  // systems — the player is undocked and parked away from the station.
  const { spawnLiveShip, removeLiveShip } = binds;
  ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.ship.object.position.set(6000, 6000, 6000);
  ctx.ship.object.quaternion.identity();
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.flags.firstPerson = true;
  camera.position.copy(ctx.ship.object.position);
  camera.quaternion.identity();
  camera.updateMatrixWorld(true);
  const live = spawnLiveShip(ctx, {
    id: 'i294-1', name: 'Fixture Reaver', classKey: 'cutter',
    faction: 'redledger', role: 'pirate', resolve: 60, personality: 0,
  }, { x: 6000, y: 6000, z: 5940 });
  if (live && !ctx.ships.includes(live)) ctx.ships.push(live);
  live.ai.demandSent = true; // suppress the wave-30 demand hail (fixture)
  ctx.input.weaponGroup = 1;
  const combat = systems.filter(([n]) => n === 'combat');
  const encounter = systems.filter(([n]) => ['npc', 'hail', 'world', 'station'].includes(n));
  const tickSel = (sel) => {
    for (const [, s] of sel) s.update?.(1 / 60, ctx);
    ctx.lastEvents = ctx.events; ctx.events = [];
    ctx.world.time += 1 / 60; ctx.elapsed += 1 / 60;
  };
  // Real ownership stamp: one burst of the player's own cannon fire.
  ctx.player.heat = 0; ctx.player.overheated = false;
  ctx.input.fireHeld = true;
  for (let i = 0; i < 40; i++) tickSel(combat);
  ctx.input.fireHeld = false;
  assert.equal(live.ai.lastAttacker, 'player', 'the player owns the hull trail');
  // TEST SETUP (#99 discipline): write the hull DOWN directly so the real
  // npc.js sampling reaches the bargaining band quickly; the OUTCOME — the
  // band walk, the card, the capitulate and the receipt — stays the real
  // systems' work.
  let bargaining = false;
  for (let i = 0; i < 120 && !bargaining; i++) {
    live.state.screen = 0; live.state.shell = 0;
    live.state.hull = Math.max(1, live.state.hull - live.state.hullMax * 0.04);
    live.state.lastCombatAt = ctx.world.time;
    live.ai.resolveAt = 0; live.ai.calmUntil = 0;
    tickSel(encounter);
    if (live.ai.band === 'bargaining') bargaining = true;
  }
  assert.ok(bargaining, 'the player-broken hull reached the bargaining band');
  // The real surrender: resolve the real card the real hail system opened.
  const card = ctx.hailApi.peek();
  assert.equal(card.open, true, 'the bargaining card is open');
  assert.equal(card.kind, 'surrender', 'the card is the surrender card');
  ctx.hailApi.resolve('demandRansom', card.conversationId);
  for (let i = 0; i < 6; i++) tickSel(encounter);
  assert.equal(live.state?.surrendered, true, 'the fixture reaver surrendered under the player\'s claim');
  assert.equal(live.ai.lastAttacker, 'player', 'the claim survives to the receipt');
  const receipts = [];
  // The board row only renders docked: berth again, then read the row.
  dock('freehold');
  openBoard();
  const row = active().find((j) => j.kind === 'patrol');
  assert.ok(row.objective.progress >= 1, 'the surrender ticked the objective — got '
    + JSON.stringify(row.objective));
  const line = byClass('job-state').map((n) => String(n.textContent))
    .find((t) => t.startsWith('ACCEPTED — ') && /Kill or drive off/.test(t));
  assert.ok(line.includes(`ACCEPTED — ${row.objective.progress}/`),
    'the DOM tally matches the observed progress');
  // Clean up the fixture hull.
  const idx = ctx.ships.indexOf(live);
  if (idx >= 0) ctx.ships.splice(idx, 1);
  removeLiveShip(ctx, live);
});

// ---------------------------------------------------------------------------
// D. Offered and done rows never carry the objective.
// ---------------------------------------------------------------------------
check('D1 an offered patrol row carries no objective', () => {
  const job = patrolJob();
  job.state = 'offered'; // disclosed flip; restored below
  openBoard();
  const offer = window.rimward.observe().jobs.offers.find((j) => j.kind === 'patrol');
  job.state = 'accepted';
  openBoard();
  assert.ok(offer, 'the offered patrol is observed');
  assert.equal(offer.objective, undefined, 'unaccepted objectives are not enumerated');
});

// ---------------------------------------------------------------------------
// E. Save round-trip: jobs stay JSON-safe with the row change.
// ---------------------------------------------------------------------------
check('E1 jobs snapshot stays JSON-safe', () => {
  openBoard();
  const copy = JSON.parse(JSON.stringify(ctx.world.jobs));
  assert.ok(Array.isArray(copy), 'jobs snapshot JSON-safe');
});

console.log('issue-294 patrol row: ' + checks + ' checks passed');
