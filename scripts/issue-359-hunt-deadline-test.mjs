/**
 * Issue #359 — a standard hunt lapses in 8.5 minutes: the deadline was shorter
 * than one patrol cycle from the posting station.
 *
 * Measured in the #331 natural playtest (master f4f0ab4): hunt-freehold-25 was
 * accepted at t=7592 and lapsed at t=8192 — the old flat 600 s window — with
 * the quarry never inside the ~600 u lock envelope during the driver's patrol
 * legs. One undock -> patrol -> (optional redock) cycle ate the whole clock,
 * so the affordable hunter tier could never pay.
 *
 * Pins (real board, real accept path, real lapse tick):
 *  A. Offered hunts carry the hunt's OWN 1200 s window (HUNT_DEADLINE), not
 *     the mining 600 s — the regression the playtest caught stays fixed.
 *  B. Acceptance re-stamps a fresh 1200 s window from acceptance.
 *  C. Deadline vs typical quarry distance, whole galaxy: for EVERY system the
 *     window covers the measured operational patrol cycle (600 s per #359)
 *     plus TWO full station-to-primary-gate round trips at the starter light
 *     hull's cruise (240 u/s) — a find on the second patrol pass still
 *     finishes inside the deadline. The worst authored span (fx_liron,
 *     4093 u each way) is pinned explicitly as the math anchor.
 *  D. Scope: mining/trade postings keep the 600 s MINING_DEADLINE — the
 *     retune is hunt-only.
 *  E. The lapse path still ends the contract at its (longer) deadline and
 *     replaces the row with a fresh full window; the persisted row stays
 *     JSON-safe (save snapshot rides along).
 *
 * The documented patrol loop the math names: undock at the posting station,
 * work the sighting lane (the station-gate lane the quarry's authored route
 * haunts — the same lane phrase the card prints, #271) out to its far end and
 * back. Flight is the small term; the operational overhead (undock/berth
 * queue, lock-envelope search, the fight, optional redock) is the measured
 * 600 s cycle from the issue.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-359-hunt-deadline-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems, makeTick } from './lib/boot-harness.mjs';
import { SYSTEMS, SHIP_CLASSES } from '../src/game/state.js';
import { snapshot } from '../src/game/save.js';

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
  console.log('UPDATE ERR frame ' + frameNo + ' (' + label + '): ' + e.message);
});

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };
const nodes = () => [...dom.walkDom(document.body)];
const observe = () => window.rimward.observe();
const act = (name, args = {}) => window.rimward.act({ v: 2, name, args });
const openBoard = () => ctx.stationDesk.selectService('jobs');
const localHunts = () => ctx.world.jobs.filter((j) => j && j.kind === 'hunt' && j.originSystem === ctx.world.currentSystem);
const huntOffers = () => localHunts().filter((j) => j.state === 'offered');
const localMining = () => ctx.world.jobs.filter((j) => j && j.kind === 'mining' && j.originSystem === ctx.world.currentSystem);

// The issue's measured numbers, restated as the pin's inputs.
const MEASURED_CYCLE_SECONDS = 600; // #359: accepted t=7592, lapsed t=8192
const HUNT_WINDOW_SECONDS = 1200;   // the fix: two measured cycles
const STARTER_CRUISE = SHIP_CLASSES.light.cruise; // 240 u/s starter hull
const STAMP_TOLERANCE = 2; // seconds of drift allowed around a fresh stamp

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

// Fresh boot: title -> new -> first origin.
for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;

// ---------------------------------------------------------------------------
// A. The offered window is the hunt's own 1200 s, not the mining 600 s.
// ---------------------------------------------------------------------------
check('A1 fresh Freehold board posts a standard hunt with the 1200 s window', () => {
  dock('freehold');
  openBoard();
  tick(2, 'board render');
  const rows = huntOffers();
  assert.ok(rows.length >= 1, 'at least one hunt card is posted: ' + rows.length);
  for (const job of rows) {
    const span = job.deadline - ctx.world.time;
    assert.ok(Math.abs(span - HUNT_WINDOW_SECONDS) <= STAMP_TOLERANCE,
      'offered hunt window is ' + HUNT_WINDOW_SECONDS + 's: got ' + span);
    assert.ok(span > MEASURED_CYCLE_SECONDS,
      'the window outlives the measured one-cycle lapse (old 600 s)');
    assert.equal(typeof job.deadline, 'number', 'deadline stays a JSON-safe number');
  }
  const apiRows = observe().jobs.offers.filter((o) => o.kind === 'hunt');
  assert.equal(apiRows.length, rows.length, 'the agent observation agrees with the board');
});

// ---------------------------------------------------------------------------
// B. Acceptance re-stamps a fresh full window from acceptance.
// ---------------------------------------------------------------------------
check('B1 accepting re-stamps a fresh 1200 s window', () => {
  // Let the live world run: quarries fly, so an offered row may legally be
  // replaced (splice + fresh stamp) while it is offered — the accept path is
  // what must re-stamp. Pin it deterministically with a disclosed fixture
  // flip (a #272-style row edit, not a board rule): make the inherited
  // window visibly stale, then accept.
  tick(30, 'live world');
  const job = huntOffers()[0];
  assert.ok(job, 'an offered hunt is posted after the live step');
  job.deadline = ctx.world.time + 10;
  const receipt = act('acceptJob', { id: job.id });
  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  assert.equal(job.state, 'accepted', 'the row is accepted');
  const span = job.deadline - ctx.world.time;
  assert.ok(Math.abs(span - HUNT_WINDOW_SECONDS) <= STAMP_TOLERANCE,
    'accepted window re-stamps ' + HUNT_WINDOW_SECONDS + 's (not the stale inherited one): got ' + span);
});

// ---------------------------------------------------------------------------
// C. Deadline vs typical quarry distance — the patrol-cycle math, whole galaxy.
// ---------------------------------------------------------------------------
check('C1 every system window covers the measured cycle plus two lane round trips', () => {
  let checked = 0;
  let worst = null;
  for (const [id, def] of Object.entries(SYSTEMS)) {
    if (!def.station || !Array.isArray(def.station.position) || !def.gates?.length) continue;
    const [sx, sy, sz] = def.station.position;
    const [gx, gy, gz] = def.gates[0].position;
    const span = Math.hypot(sx - gx, sy - gy, sz - gz);
    const roundTrip = (2 * span) / STARTER_CRUISE;
    if (!worst || roundTrip > worst.roundTrip) worst = { id, span: Math.round(span), roundTrip };
    // A find on the SECOND patrol pass must still finish inside the window:
    // measured operational cycle + two full flight round trips.
    assert.ok(
      HUNT_WINDOW_SECONDS >= MEASURED_CYCLE_SECONDS + 2 * roundTrip,
      id + ': window ' + HUNT_WINDOW_SECONDS + 's covers cycle ' + MEASURED_CYCLE_SECONDS + 's + 2x round trip ' + roundTrip.toFixed(1) + 's',
    );
    checked++;
  }
  assert.ok(checked >= 100, 'every stationed system is pinned: ' + checked);
  assert.ok(worst, 'a worst-case span exists');
  // The math anchor from the fix comment, restated from live data.
  assert.equal(worst.id, 'fx_liron', 'worst authored span is fx_liron: ' + JSON.stringify(worst));
  assert.equal(worst.span, 4093, 'fx_liron station-gate span is 4093 u');
  const worstRT = (2 * 4093) / STARTER_CRUISE;
  assert.ok(Math.abs(worstRT - 34.1) < 0.1, 'fx_liron round trip is ~34.1 s at cruise: ' + worstRT.toFixed(2));
  // And the window itself is exactly two measured cycles: a first-pass find
  // leaves a whole second cycle of margin.
  assert.equal(HUNT_WINDOW_SECONDS, 2 * MEASURED_CYCLE_SECONDS, 'window is two measured cycles');
});

// ---------------------------------------------------------------------------
// D. Scope: mining/trade keep the 600 s MINING_DEADLINE.
// ---------------------------------------------------------------------------
check('D1 mining postings keep the 600 s window', () => {
  openBoard();
  const rows = localMining().filter((j) => j.state === 'offered');
  assert.ok(rows.length >= 1, 'an offered mining card exists');
  for (const job of rows) {
    const span = job.deadline - ctx.world.time;
    assert.ok(Math.abs(span - MEASURED_CYCLE_SECONDS) <= STAMP_TOLERANCE + 5,
      'mining window stays ' + MEASURED_CYCLE_SECONDS + 's: got ' + span);
  }
});

// ---------------------------------------------------------------------------
// E. The lapse path still fires at the (longer) deadline; rows stay JSON-safe.
// ---------------------------------------------------------------------------
check('E1 an accepted hunt still lapses at its deadline and refills the slot', () => {
  const accepted = localHunts().find((j) => j.state === 'accepted');
  assert.ok(accepted, 'an accepted hunt exists from B1');
  // Disclosed fixture (a #272-style flip): pull the deadline to now.
  accepted.deadline = ctx.world.time;
  tick(60, 'lapse tick'); // > the 0.5 s job tick cadence
  assert.equal(accepted.state, 'failed', 'the aged contract lapsed');
  const refill = huntOffers();
  assert.ok(refill.length >= 1, 'the slot refilled');
  for (const job of refill) {
    const span = job.deadline - ctx.world.time;
    assert.ok(Math.abs(span - HUNT_WINDOW_SECONDS) <= STAMP_TOLERANCE,
      'refilled hunt carries a fresh ' + HUNT_WINDOW_SECONDS + 's window: got ' + span);
  }
  const snap = snapshot(ctx);
  const row = snap.world.jobs.find((j) => j.id === refill[0].id);
  assert.ok(row && Number.isFinite(row.deadline), 'the save-shaped row keeps a finite deadline');
});

assert.equal(updateErrors, 0, 'no update-loop errors');
console.log('issue-359: ' + checks + ' checks passed');
