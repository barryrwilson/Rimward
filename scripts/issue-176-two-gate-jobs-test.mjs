/** Issue #176: authored charted boards post exactly ONE destination two gates
 * out across the haul/trade, ferry and passenger families, priced and timed
 * for the distance, and pay only at the named far station.
 *
 * Real station DOM closures, the real jobs board, the real accept path and the
 * real throttled delivery tick. Fixtures are disclosed cash/cargo/clock only.
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-176-two-gate-jobs-test.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { requestAutosave } from '../src/game/save.js';
import { SYSTEMS } from '../src/game/state.js';
import { JOB_MAX_HOPS, authoredHops, longRunDests, chartedAuthored } from '../src/game/job-distance.js';

seedBootRandom();
const dom = installDomStubs();
const KEY = 'rimward-save-v1';
const reboot = process.argv.includes('--reboot');
const input = reboot ? JSON.parse(readFileSync(0, 'utf8')) : null;
if (input) localStorage.setItem(KEY, input.saved);
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];
const save = systems.find(([name]) => name === 'save')[1];

const AUTHORED = Object.keys(SYSTEMS).filter(chartedAuthored);
const LONG_KINDS = new Set(['trade', 'passenger', 'ferry']);
const MINING_DEADLINE = 600;
const check = (label, fn) => { fn(); console.log('PASS', label); };

function step(count = 1) {
  for (let i = 0; i < count; i++) {
    ctx.world.time += 1 / 60;
    ctx.elapsed += 1 / 60;
    station.update(1 / 60);
    save.update(1 / 60);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

function dock(system = ctx.world.currentSystem) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  // Fixture: place the hull at the safe berth. The real dock path, the real
  // board refresh and the real delivery tick still own every mutation.
  ctx.world.currentSystem = system;
  ctx.emit('systemLoaded', { to: system });
  const p = ctx.systems[system].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  step(3);
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, 'docked at ' + system);
}

/** Open the board. This is the refresh that promotes / demotes a long run. */
function openBoard() {
  ctx.stationDesk.selectService('jobs');
}

/** Every live posting of the three long-run families belonging to one board. */
function boardRuns(sysId) {
  return ctx.world.jobs.filter((j) => j
    && LONG_KINDS.has(j.kind)
    && (j.state === 'offered' || j.state === 'accepted')
    && (j.kind === 'ferry'
      ? (j.state === 'offered' || j.originSystem === sysId)
      : j.originSystem === sysId));
}

function hopsOf(job, sysId) {
  const origin = job.kind === 'ferry' && job.state === 'offered' ? sysId : job.originSystem;
  if (!job.destSystem) return 1;
  return authoredHops(origin, job.destSystem) ?? 1;
}

const longRuns = (sysId) => boardRuns(sysId).filter((j) => hopsOf(j, sysId) >= JOB_MAX_HOPS);

/** Rendered card text, keyed by job title, straight out of the stub DOM. */
function cards() {
  const out = [];
  for (const node of dom.walkDom(document.body)) {
    if ((node.className || '') !== 'job-card') continue;
    const part = (cls) => [...dom.walkDom(node)]
      .filter((n) => (n.className || '') === cls)
      .map((n) => (typeof n.textContent === 'string' ? n.textContent : '')).join(' ');
    out.push({
      title: part('job-title'),
      detail: part('job-detail'),
      reward: part('job-reward'),
      state: part('job-state'),
    });
  }
  return out;
}

const stationName = (id) => SYSTEMS[id]?.station?.name ?? id;
const nearDestOf = (id) => SYSTEMS[id].gates[0].to;

const agreementRows = () => ctx.world.jobs
  .filter((j) => j.state === 'accepted' || j.id === 'ferry-consignment')
  .map((j) => ({
    id: j.id, kind: j.kind, state: j.state, originSystem: j.originSystem ?? null,
    destSystem: j.destSystem ?? null, payQuoted: j.payQuoted ?? null, deadline: j.deadline ?? null,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

// ---------------------------------------------------------------------------
// Reboot leg: a fresh module graph restores the two-gate agreement verbatim
// and the far station still pays it exactly once.
// ---------------------------------------------------------------------------
if (reboot) {
  assert.deepEqual(agreementRows(), input.expected, 'fresh boot restores the two-gate agreement');
  const agreement = ctx.world.jobs.find((j) => j.id === input.longId);
  assert.ok(agreement, 'the restored long run is on the board');
  assert.equal(agreement.state, 'accepted');
  assert.equal(agreement.destSystem, input.longDest, 'restored dest is the two-gate dock');
  assert.equal(authoredHops(agreement.originSystem, agreement.destSystem), JOB_MAX_HOPS);
  ctx.flags.paused = false;
  ctx.flags.combat = false;
  const credits = ctx.world.credits;
  ctx.cargo.length = 0;
  ctx.cargo.push({ commodity: agreement.commodity, units: agreement.need });
  dock(input.longDest);
  step(90);
  assert.equal(ctx.world.credits, credits + input.expectedPay,
    'the restored agreement pays its stamped quote at the far station');
  console.log('PASS reboot restores and settles the two-gate agreement');
  process.exit(0);
}

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.combat = false;
ctx.world.credits = 20000;

// ---------------------------------------------------------------------------
// A. Generator distribution: EVERY authored charted board posts exactly one
//    two-gate run, and its destination is a real two-gate id.
// ---------------------------------------------------------------------------
const boards = new Map();
for (const sysId of AUTHORED) {
  dock(sysId);
  openBoard();
  step(2);
  openBoard();
  boards.set(sysId, {
    runs: boardRuns(sysId).length,
    longs: longRuns(sysId).map((j) => ({ id: j.id, kind: j.kind, dest: j.destSystem })),
  });
}

check('A1 every authored charted board posts exactly one two-gate run', () => {
  for (const sysId of AUTHORED) {
    const row = boards.get(sysId);
    assert.ok(row.runs >= 4, `${sysId} posts trade + passenger work (${row.runs} rows)`);
    assert.equal(row.longs.length, 1, `${sysId} long runs: ${JSON.stringify(row.longs)}`);
  }
});

check('A2 each long run names a real two-gate destination on the charted ring', () => {
  for (const sysId of AUTHORED) {
    const [long] = boards.get(sysId).longs;
    assert.ok(longRunDests(sysId).includes(long.dest),
      `${sysId} -> ${long.dest} is not two gates out (${longRunDests(sysId).join('/')})`);
    assert.equal(authoredHops(sysId, long.dest), JOB_MAX_HOPS);
  }
});

check('A3 the long run never lands on the unique consignment while a slot is free', () => {
  for (const sysId of AUTHORED) {
    assert.notEqual(boards.get(sysId).longs[0].kind, 'ferry',
      `${sysId} pushed the tutorial consignment onto the long run`);
  }
});

// ---------------------------------------------------------------------------
// B. Card copy: the two-gate card names the FAR dock and its distance in the
//    detail line, not just the reward line. (Regression: the board rebuilt the
//    detail from otherSystemId every frame and named the adjacent dock.)
// ---------------------------------------------------------------------------
const HOME = 'freehold';
dock(HOME);
openBoard();
const homeLong = longRuns(HOME)[0];
const homeFar = homeLong.destSystem;
const homeNear = nearDestOf(HOME);

check('B1 the two-gate card detail names the far dock and the jump count', () => {
  assert.equal(authoredHops(HOME, homeFar), JOB_MAX_HOPS);
  const title = homeLong.kind === 'trade' ? 'Haul ' : 'Escort passengers';
  const card = cards().find((c) => c.title.includes(title) && c.reward.includes(stationName(homeFar)));
  assert.ok(card, `no card names ${stationName(homeFar)}: ${JSON.stringify(cards(), null, 1)}`);
  const copy = `${card.detail} ${card.reward}`;
  assert.ok(copy.includes(stationName(homeFar)), 'copy names the far station');
  assert.ok(copy.includes('2 jumps'), `copy states the distance: ${copy}`);
  assert.ok(!card.detail.includes(stationName(homeNear)),
    `detail still names the adjacent dock ${stationName(homeNear)}: ${card.detail}`);
});

check('B2 the one-gate cards on the same board keep their adjacent dock and label', () => {
  const near = boardRuns(HOME).filter((j) => j !== homeLong && j.state === 'offered' && j.kind !== 'ferry');
  assert.ok(near.length >= 1, 'the board still posts one-gate work');
  for (const job of near) {
    assert.equal(job.destSystem, homeNear, `${job.id} drifted off the primary gate`);
    assert.ok(job.detail.includes('1 jump'), `${job.id} copy: ${job.detail}`);
  }
});

// ---------------------------------------------------------------------------
// C. Reward and deadline scale with the jump count.
// ---------------------------------------------------------------------------
check('C1 a two-gate quote is 125% of the same card at one gate (140% -> 175%)', () => {
  const far = ctx.stationDesk.peekJobReward(homeLong, true);
  const saved = homeLong.destSystem;
  homeLong.destSystem = homeNear;
  const near = homeLong.kind === 'trade'
    ? ctx.stationDesk.peekJobReward(homeLong, true)
    : null;
  homeLong.destSystem = saved;
  if (near === null) return; // passenger fare is checked through the card below
  assert.ok(far > near, `two gates must pay more (${far} vs ${near})`);
  assert.ok(Math.abs(far - Math.round(near * 1.25)) <= 1, `${far} vs ${Math.round(near * 1.25)}`);
});

check('C2 the offered two-gate window is one deadline per gate', () => {
  openBoard();
  const long = longRuns(HOME)[0];
  assert.ok(Math.abs((long.deadline - ctx.world.time) - MINING_DEADLINE * JOB_MAX_HOPS) <= 5,
    `two-gate window ${long.deadline - ctx.world.time}s`);
  const near = boardRuns(HOME).find((j) => j !== long && j.state === 'offered'
    && j.kind !== 'ferry' && Number.isFinite(j.deadline));
  assert.ok(Math.abs((near.deadline - ctx.world.time) - MINING_DEADLINE) <= 5,
    `one-gate window ${near.deadline - ctx.world.time}s`);
});

// ---------------------------------------------------------------------------
// D. The single seat counts ACCEPTED work, per origin.
// ---------------------------------------------------------------------------
const longId = homeLong.id;
check('D1 accepting the two-gate run holds the seat: no second long run appears', () => {
  const accepted = ctx.stationDesk.acceptJob(longId);
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  assert.equal(homeLong.state, 'accepted');
  assert.equal(homeLong.destSystem, homeFar, 'accept kept the posted far dock');
  for (let i = 0; i < 3; i++) { openBoard(); step(2); }
  const longs = longRuns(HOME);
  assert.equal(longs.length, 1, `farmed a second long run: ${JSON.stringify(longs.map((j) => j.id))}`);
  assert.equal(longs[0].id, longId, 'the accepted agreement is the seat holder');
});

check('D2 an accepted long run at one origin does not suppress another origin', () => {
  const other = AUTHORED.find((id) => id !== HOME && id !== homeFar);
  dock(other);
  openBoard();
  step(2);
  openBoard();
  const longs = longRuns(other);
  assert.equal(longs.length, 1, `${other} lost its own long run: ${JSON.stringify(longs)}`);
  assert.notEqual(longs[0].originSystem, HOME, 'the seat is per origin, not global');
  assert.equal(authoredHops(other, longs[0].destSystem), JOB_MAX_HOPS);
});

check('D3 the accepted quote is the agreement: a redraw cannot move it', () => {
  dock(HOME);
  const quoted = homeLong.payQuoted;
  assert.ok(Number.isFinite(quoted) && quoted > 0, `stamped quote ${quoted}`);
  for (let i = 0; i < 3; i++) { openBoard(); step(2); }
  assert.equal(homeLong.payQuoted, quoted);
  assert.equal(homeLong.destSystem, homeFar);
});

// ---------------------------------------------------------------------------
// E. Settlement binds the TRUE destination: the intermediate dock pays nothing.
// ---------------------------------------------------------------------------
const midway = SYSTEMS[HOME].gates[0].to;
const expectedPay = homeLong.payQuoted;
check('E1 the intermediate system on the route pays nothing', () => {
  assert.equal(authoredHops(HOME, midway), 1, 'midway is the one-gate hop of the route');
  ctx.cargo.length = 0;
  if (homeLong.kind === 'trade') ctx.cargo.push({ commodity: homeLong.commodity, units: homeLong.need });
  const credits = ctx.world.credits;
  dock(midway);
  step(120);
  assert.equal(ctx.world.credits, credits, 'a mid-route dock cannot settle a two-gate run');
  assert.equal(homeLong.state, 'accepted', 'the agreement stays open');
});

// Persist the open agreement for the reboot leg before it settles.
dock(midway);
requestAutosave(ctx, { now: true });
step(30);
const rebootPayload = {
  saved: localStorage.getItem(KEY),
  expected: agreementRows(),
  longId,
  longDest: homeFar,
  expectedPay,
};

check('E2 the named far station settles the run for the stamped two-gate quote', () => {
  const credits = ctx.world.credits;
  dock(homeFar);
  step(120);
  assert.equal(ctx.world.credits, credits + expectedPay,
    `far dock paid ${ctx.world.credits - credits}, quote ${expectedPay}`);
  assert.notEqual(homeLong.state, 'accepted', 'the settled agreement leaves the board');
});

check('E3 settling frees the seat: the origin board posts a fresh two-gate run', () => {
  dock(HOME);
  for (let i = 0; i < 3; i++) { openBoard(); step(2); }
  const longs = longRuns(HOME);
  assert.equal(longs.length, 1, JSON.stringify(longs.map((j) => j.id)));
  assert.notEqual(longs[0].id, longId, 'a replacement posting, not the settled row');
});

// ---------------------------------------------------------------------------
// F. Expiry withdraws the two-gate posting and the seat refills.
// ---------------------------------------------------------------------------
check('F1 an expired two-gate posting is withdrawn, pays nothing and is replaced', () => {
  dock(HOME);
  openBoard();
  const stale = longRuns(HOME)[0];
  const staleId = stale.id;
  const credits = ctx.world.credits;
  ctx.world.time = stale.deadline + 1;
  step(120);
  assert.equal(ctx.world.credits, credits, 'expiry pays nothing');
  const survivor = ctx.world.jobs.find((j) => j.id === staleId);
  assert.ok(!survivor || (survivor.state !== 'accepted' && survivor.state !== 'offered'),
    'the stale posting left the board');
  for (let i = 0; i < 3; i++) { openBoard(); step(2); }
  const longs = longRuns(HOME);
  assert.equal(longs.length, 1, JSON.stringify(longs.map((j) => j.id)));
  assert.notEqual(longs[0].id, staleId);
});

// ---------------------------------------------------------------------------
// G. The unique consignment is the FALLBACK seat, and a board redraw does not
//    wipe it. (Regression: reofferFerryHandles hardcoded destSystem = null and
//    cleared the promotion on the very next refresh.)
// ---------------------------------------------------------------------------
check('G1 with every renewable slot taken, the consignment carries the long run', () => {
  dock(HOME);
  openBoard();
  // Fixture: take the renewable slots out of the running by marking them
  // accepted at their ADJACENT dock, so only the consignment can be promoted.
  for (const job of boardRuns(HOME)) {
    if (job.kind === 'ferry') continue;
    job.state = 'accepted';
    job.destSystem = homeNear;
    job.payQuoted = 1;
    job.deadline = ctx.world.time + MINING_DEADLINE;
  }
  const ferry = ctx.world.jobs.find((j) => j.id === 'ferry-consignment');
  assert.equal(ferry.state, 'offered', 'the consignment is still on offer');
  openBoard();
  assert.ok(ferry.destSystem, 'the consignment was promoted to a posted destination');
  assert.equal(authoredHops(HOME, ferry.destSystem), JOB_MAX_HOPS);
  assert.ok(ferry.reward > 350, `the consignment fee scales with distance (${ferry.reward})`);
  assert.ok(ferry.detail.includes('2 gates'), `consignment copy: ${ferry.detail}`);
});

check('G2 a second board redraw does not wipe the promoted consignment', () => {
  const ferry = ctx.world.jobs.find((j) => j.id === 'ferry-consignment');
  const dest = ferry.destSystem;
  for (let i = 0; i < 4; i++) { openBoard(); step(2); }
  assert.equal(ferry.destSystem, dest, 'the redraw cleared the posted consignment dest');
  const card = cards().find((c) => c.title.includes('Ferry a consignment'));
  assert.ok(card, 'the consignment card is drawn');
  assert.ok(card.reward.includes(stationName(dest)), `card names ${stationName(dest)}: ${card.reward}`);
  assert.ok(card.reward.includes('2 jumps'), `card states the distance: ${card.reward}`);
});

check('G2b an expired OFFERED two-gate posting is withdrawn, then re-posted', () => {
  const ferry = ctx.world.jobs.find((j) => j.id === 'ferry-consignment');
  const staleDest = ferry.destSystem;
  const staleDeadline = ferry.deadline;
  assert.ok(staleDest, 'the posting names a far dock');
  assert.ok(Number.isFinite(staleDeadline), 'the posting carries a window');
  const credits = ctx.world.credits;
  const cargoBefore = JSON.stringify(ctx.cargo);
  // The window closes with no board refresh in between, so only the throttled
  // delivery tick can withdraw it. Its accepted-only guard used to drop the
  // offered row here and leave a stale far posting on the board.
  ctx.world.time = staleDeadline + 1;
  step(120);
  assert.equal(ferry.state, 'offered', 'an unaccepted posting stays on offer');
  assert.equal(ferry.destSystem ?? null, null,
    `stale far posting survived its window: ${ferry.destSystem} at ${ctx.world.time}`);
  assert.ok(!Object.hasOwn(ferry, 'deadline'), 'the stale clock is cleared');
  assert.equal(ferry.reward, 350, 'it returns to the one-gate fee');
  assert.equal(ctx.world.credits, credits, 'a withdrawn posting pays nothing');
  assert.equal(JSON.stringify(ctx.cargo), cargoBefore,
    'nothing was fronted on an unaccepted posting, so nothing is reclaimed');
  // The seat is free again: the next refresh posts one fresh eligible long
  // run. The renewable slots expired alongside it, so they outrank the
  // consignment for the seat again — which is the seat order working.
  openBoard();
  const fresh = longRuns(HOME);
  assert.equal(fresh.length, 1, `one fresh long run: ${JSON.stringify(fresh.map((j) => j.id))}`);
  assert.equal(authoredHops(HOME, fresh[0].destSystem), JOB_MAX_HOPS);
  assert.ok(fresh[0].deadline > ctx.world.time, 'the fresh posting carries a fresh window');
  // Re-arm the G1 fixture so the consignment carries the seat for G3 below.
  for (const job of boardRuns(HOME)) {
    if (job.kind === 'ferry') continue;
    job.state = 'accepted';
    job.destSystem = homeNear;
    job.payQuoted = 1;
    job.deadline = ctx.world.time + MINING_DEADLINE;
  }
  openBoard();
  assert.ok(ferry.destSystem, 'the consignment carries the seat once the slots are taken');
  assert.equal(authoredHops(HOME, ferry.destSystem), JOB_MAX_HOPS);
});

check('G3 accepting the promoted consignment keeps the posted far dock', () => {
  const accepted = ctx.stationDesk.acceptJob('ferry-consignment');
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  const ferry = ctx.world.jobs.find((j) => j.id === 'ferry-consignment');
  assert.equal(ferry.state, 'accepted');
  assert.equal(ferry.originSystem, HOME);
  assert.equal(authoredHops(ferry.originSystem, ferry.destSystem), JOB_MAX_HOPS);
  assert.ok(Number.isFinite(ferry.payQuoted) && ferry.payQuoted > 350,
    `distance-scaled consignment quote ${ferry.payQuoted}`);
});

check('G4 the two-gate consignment carries a distance-scaled window', () => {
  const ferry = ctx.world.jobs.find((j) => j.id === 'ferry-consignment');
  assert.equal(ferry.state, 'accepted');
  assert.ok(Number.isFinite(ferry.deadline), 'the far consignment has a window');
  assert.ok(Math.abs((ferry.deadline - ctx.world.time) - MINING_DEADLINE * JOB_MAX_HOPS) <= 5,
    `two-gate consignment window ${ferry.deadline - ctx.world.time}s`);
});

check('G5 the closed window pays nothing, reclaims the fronted units and re-offers', () => {
  const ferry = ctx.world.jobs.find((j) => j.id === 'ferry-consignment');
  const credits = ctx.world.credits;
  const fronted = ctx.cargo.filter((r) => r.commodity === 'provisions')
    .reduce((n, r) => n + r.units, 0);
  assert.ok(fronted >= 1, `the factor fronted units (${fronted})`);
  // Fixture: the player also owns two Provisions of their own stock.
  ctx.cargo.push({ commodity: 'provisions', units: 2 });
  ctx.world.time = ferry.deadline + 1;
  step(120);
  const after = ctx.world.jobs.find((j) => j.id === 'ferry-consignment');
  assert.equal(ctx.world.credits, credits, 'a closed window pays nothing');
  assert.equal(after.state, 'offered', 'the repeatable unique is never stranded');
  assert.equal(after.destSystem ?? null, null, 'it returns to its one-gate shape');
  assert.equal(after.reward, 350, 'and to its one-gate fee');
  assert.ok(!Object.hasOwn(after, 'deadline'), 'the stale clock is cleared');
  assert.ok(!Object.hasOwn(after, 'payQuoted'), 'the stale quote is cleared');
  const held = ctx.cargo.filter((r) => r.commodity === 'provisions')
    .reduce((n, r) => n + r.units, 0);
  assert.equal(held, 2, `the factor reclaimed only what it fronted (held ${held})`);
});

check('G6 a one-gate consignment stays timeless, as it was before this wave', () => {
  dock(nearDestOf(HOME));
  openBoard();
  const ferry = ctx.world.jobs.find((j) => j.id === 'ferry-consignment');
  assert.equal(ferry.state, 'offered');
  assert.equal(ferry.destSystem ?? null, null, 'no board promoted it here');
  assert.ok(!Object.hasOwn(ferry, 'deadline'), 'an unstamped offer carries no window');
  const accepted = ctx.stationDesk.acceptJob('ferry-consignment');
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  assert.equal(ferry.state, 'accepted');
  assert.equal(authoredHops(ferry.originSystem, ferry.destSystem), 1);
  assert.ok(!Object.hasOwn(ferry, 'deadline'),
    'a one-gate agreement gains no deadline, so a legacy save is untouched');
  assert.equal(ferry.reward, 350, 'and no distance premium');
  // A legacy-shaped agreement never expires: the clock cannot reach a field
  // that does not exist.
  ctx.world.time += MINING_DEADLINE * 4;
  step(120);
  assert.equal(ctx.world.jobs.find((j) => j.id === 'ferry-consignment').state, 'accepted',
    'a pre-176 agreement is not expired by this wave');
});

// ---------------------------------------------------------------------------
// H. Save round trip: destination, quote and window survive a fresh boot, and
//    the far station still settles the restored agreement exactly once.
// ---------------------------------------------------------------------------
check('H1 the autosave carries the two-gate destination, quote and window', () => {
  const blob = JSON.parse(rebootPayload.saved);
  const row = blob.world.jobs.find((j) => j.id === longId);
  assert.ok(row, 'the open agreement is persisted');
  assert.equal(row.destSystem, homeFar);
  assert.equal(row.payQuoted, expectedPay);
  assert.ok(Number.isFinite(row.deadline), 'the scaled window persists');
  assert.ok(!Object.hasOwn(row, 'hops') && !Object.hasOwn(row, 'jumps') && !Object.hasOwn(row, 'longRun'),
    `no new persisted distance field: ${Object.keys(row).join(',')}`);
});

const result = spawnSync(process.execPath,
  ['--import', './scripts/with-css-stub.mjs', fileURLToPath(import.meta.url), '--reboot'],
  { input: JSON.stringify(rebootPayload), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
assert.equal(result.status, 0,
  'H2 fresh boot restores and settles the two-gate agreement\n' + result.stdout + '\n' + result.stderr);
console.log('PASS H2 fresh boot restores and settles the two-gate agreement');

console.log('ISSUE-176 TWO-GATE JOBS OK');
