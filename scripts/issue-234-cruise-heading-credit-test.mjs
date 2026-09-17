/**
 * Issue #234 — cruise turn credit.
 *
 *   node --import ./scripts/with-css-stub.mjs scripts/issue-234-cruise-heading-credit-test.mjs CASE=all
 *
 * CASE=replay (default) Replays the RECORDED natural failure through the real
 *                       watchdog, pre-fix and post-fix, in one process.
 * CASE=guard            Hard bounds on the real dockTurnCredit.
 * CASE=budget           Hard bounds on the real dockMakingProgress budget.
 * CASE=live             Physical safety control: a clear-lane approach still
 *                       docks with the same helm and no contact.
 * CASE=all              All of the above.
 *
 * FIXTURE=raw           Re-derive the replay rows from the raw capture under
 *                       out/ instead of the committed fixture, to audit it.
 * STAGE_RUNTIME=<dir>   Run against another runtime tree.
 *
 * Nothing in this file re-implements the code under test. Every assertion is
 * made against the product's own `dockTurnCredit` / `dockMakingProgress`,
 * loaded straight out of `src/game/autopilot.js`. The fix adds no export: the
 * test re-exports those private functions with a load-time shim. The
 * historical comparison is the same function from the pinned pre-fix commit,
 * read from git, so that "before" side is the real old guard and not a mirror
 * of it — and it is optional, because the durable negative needs no history.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as THREE from 'three';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const runtimeRoot = resolve(process.env.STAGE_RUNTIME || repoRoot);
const argCase = process.argv.slice(2).find(a => a.startsWith('CASE='));
const CASE = (argCase ? argCase.slice(5) : process.env.CASE) || 'replay';
const mod = (rel) => pathToFileURL(resolve(runtimeRoot, rel)).href;

// The product tree as it stood before this issue. The replay's "before" side
// is this exact blob, so a stale-heading cancellation is demonstrated against
// the shipped guard rather than against a description of it.
const PRE_FIX_SHA = '5cc51d589df282e77b23880b074d13c40eee28fa';
const AP_REL = 'src/game/autopilot.js';

const git = (...args) => {
  const run = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8',
    windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  assert.equal(run.status, 0, `git ${args.join(' ')}: ${run.stderr}`);
  return run.stdout;
};
const srcHash = createHash('sha256');
for (const file of git('ls-files', 'src').trim().split(/\r?\n/).sort()) {
  srcHash.update(file); srcHash.update(readFileSync(resolve(repoRoot, file)));
}
// The historical side is OPTIONAL. A fresh checkout that has the pre-fix
// commit gets the extra confirmation; one that does not (a shallow clone, a
// squashed import) still runs every assertion, because the durable negative is
// the current module driven WITHOUT the cruise turn argument, which reproduces
// the pre-fix accounting exactly and needs no history at all.
let preFixSource = null;
try {
  const probe = spawnSync('git', ['cat-file', '-e', `${PRE_FIX_SHA}:${AP_REL}`],
    { cwd: repoRoot, windowsHide: true });
  if (probe.status === 0) preFixSource = git('show', `${PRE_FIX_SHA}:${AP_REL}`);
} catch { preFixSource = null; }

console.log('ARTIFACT', JSON.stringify({
  head: git('rev-parse', 'HEAD').trim(), runtimeRoot, case: CASE,
  preFixSha: PRE_FIX_SHA,
  historicalBaselineAvailable: preFixSource !== null,
  preFixAutopilotSha256: preFixSource
    ? createHash('sha256').update(preFixSource).digest('hex').slice(0, 16) : null,
  repoSrcSha256: srcHash.digest('hex').slice(0, 16),
}));

// ---------------------------------------------------------------------------
// Loading the REAL guard, both versions, without editing any file
// ---------------------------------------------------------------------------
// `dockMakingProgress`, `dockTurnCredit` and `resetDockScratch` are all
// module-private, which is correct: nothing in the product should be able to
// call them, and the fix adds no export. The test appends an export statement
// at load time only. The appended text adds no statement that runs and
// rewrites no original byte, and the identical text is appended to both
// versions, so the two sides stay comparable.
const BASE_SHIM = '\nexport { dockMakingProgress as __dockMakingProgress,'
  + ' resetDockScratch as __resetDockScratch };\n';
// The pre-fix module has no dockTurnCredit to re-export, so its shim omits it.
const EXPORT_SHIM = '\nexport { dockMakingProgress as __dockMakingProgress,'
  + ' resetDockScratch as __resetDockScratch, dockTurnCredit as __dockTurnCredit };\n';
const CANDIDATE_URL = mod(AP_REL);
// A query string gives the pre-fix copy its own module instance (its own
// watchdog state) while keeping the same directory, so its relative imports
// resolve to exactly the same sibling modules the candidate uses.
const BASELINE_URL = `${CANDIDATE_URL}?issue234-pre-fix`;

registerHooks({
  resolve(spec, context, next) {
    if (spec === BASELINE_URL) return { url: BASELINE_URL, format: 'module', shortCircuit: true };
    return next(spec, context);
  },
  load(url, context, next) {
    if (url === BASELINE_URL) {
      if (preFixSource === null) throw Error('the pre-fix blob is not in this checkout');
      return { format: 'module', shortCircuit: true, source: preFixSource + BASE_SHIM };
    }
    if (url !== CANDIDATE_URL) return next(url, context);
    const r = next(url, context);
    const src = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    return { ...r, source: src + EXPORT_SHIM };
  },
});

const autopilot = await import(CANDIDATE_URL);
const { DOCK_BLOCK_SECONDS } = await import(mod('src/game/dock-approach.js'));

// ---------------------------------------------------------------------------
// Shared: a bare context the watchdog and its disengage path can run against
// ---------------------------------------------------------------------------
function makeCtx() {
  const ap = { engaged: true, mode: 'dock', phase: 'cruise', reason: '',
    yaw: 0, pitch: 0, throttle: 0, idle: false, wantJump: false, wantDock: false,
    cycleHub: false };
  const ctx = {
    world: { time: 0, currentSystem: 'veridian', records: [] },
    autopilot: ap, nav: { autopilot: false, path: [], dest: 'veridian' },
    flags: {}, input: {}, ship: {}, player: {}, station: {},
    events: [], lastEvents: [], emit() {},
  };
  return { ctx, ap };
}

// ---------------------------------------------------------------------------
// CASE=replay — the recorded natural failure, through the real watchdog
// ---------------------------------------------------------------------------
//
// Evidence: out/issue-234/run1-frozen/decisions.json, the frozen capture of the
// natural Freehold -> Veridian leg that cancelled 'blocked' at t=45.755 with a
// light hull, intact traffic, intact collision and no source edits.
//
// What the capture holds exactly, per cruise tick: world time, the watchdog's
// range argument (`sd`, the stage distance), its heading argument (`yaw`, the
// steer's yawAbs), the hull position and the steering aim.
//
// What the capture does NOT hold: the hull quaternion. `fwd` is therefore
// SYNTHESISED, and the replay is honest about that:
//
//   * The baseline side needs no pose at all. Without a turn the watchdog
//     reads only `range` and `yawAbs`, both recorded, so the negative verdict
//     is an exact replay of recorded inputs.
//   * The candidate side needs `fwd`. The recorded `align` pins its angle to
//     the aim exactly wherever it was not clamped; elsewhere the angle and the
//     unrecorded azimuth are chosen. The 16 combinations are SENSITIVITY
//     FIXTURES: a spread of synthetic pose sequences, not the recovered pose,
//     not a physical reconstruction of the hull, and not an exhaustive or
//     conservative bound over every pose the episode could have had. Agreement
//     across them shows the verdict is not an artefact of one arbitrary choice;
//     it does not by itself show the recorded hull would have survived.
//
// The episode is COMMITTED, at scripts/issue-234-cruise-heading-fixture.json:
// just the 106 cruise ticks and the fields the watchdog is handed, carved out
// of the raw capture with its provenance and the raw file's sha256. The raw
// capture stays where raw evidence belongs, under the git-ignored out/ tree,
// so a fresh checkout runs this regression with nothing else fetched.
// FIXTURE=raw re-derives the rows from the raw capture instead, which is how
// the committed fixture is audited against its source.
const FIXTURE = 'scripts/issue-234-cruise-heading-fixture.json';
const RAW = 'out/issue-234/run1-frozen/decisions.json';
const CANCEL_T = 45.755;

function loadEpisode() {
  let rows, source;
  if (process.env.FIXTURE === 'raw') {
    source = RAW;
    rows = JSON.parse(readFileSync(resolve(repoRoot, RAW), 'utf8'))
      .filter(r => r.tag === 'cruise' && r.t <= CANCEL_T).sort((a, b) => a.t - b.t);
  } else {
    source = FIXTURE;
    const file = JSON.parse(readFileSync(resolve(repoRoot, FIXTURE), 'utf8'));
    assert.ok(file && file.provenance && Array.isArray(file.rows),
      'the committed fixture must carry its provenance');
    rows = file.rows;
  }
  assert.ok(rows.length > 50, `episode must hold the cruise ticks (${rows.length})`);
  rows.source = source;
  for (const r of rows) {
    assert.ok(Array.isArray(r.pos) && r.pos.every(Number.isFinite), 'row needs a hull position');
    assert.ok(Array.isArray(r.aim) && r.aim.every(Number.isFinite), 'row needs a steering aim');
    assert.ok(Number.isFinite(r.sd) && Number.isFinite(r.yaw) && Number.isFinite(r.t),
      'row needs the recorded watchdog arguments');
    assert.equal(r.ph, 'cruise', 'the episode is the cruise phase');
  }
  // The recorded episode must itself be the failure, or there is nothing to fix.
  assert.ok(Math.abs(rows[rows.length - 1].stall - DOCK_BLOCK_SECONDS) < 0.05,
    `the recorded episode must end at the watchdog deadline (${rows[rows.length - 1].stall})`);
  return rows;
}

// Synthetic pose fixtures.
//
// The guard needs only the hull's forward unit vector, not its full
// orientation. The capture pins that vector exactly on some rows and not at
// all on the rest:
//
//   * `al` is the product's own `align`, i.e. fwd . dir exactly. Where it was
//     recorded unclamped it gives the angle between fwd and the aim direction
//     EXACTLY: theta = acos(al). No model and no assumption is involved.
//   * The product clamps align at 0 (`Math.max(0, ...)`), so a heading error
//     past 90 deg is recorded as 0 and loses its magnitude. For those rows the
//     capture does NOT bound theta: yawAbs is only the yaw component, and with
//     pitch present the total error acos(cos pitch * cos yaw) can be smaller
//     than yawAbs, so yawAbs is not a floor. CLAMP MODES simply pick two
//     values, and the verdict is checked for each.
//   * The AZIMUTH of fwd around dir is not recorded at all. AZIMUTH MODES pick
//     eight values, and the verdict is checked for each. A chosen azimuth is
//     not required to reproduce the recorded yawAbs or the hull's real turn
//     rate; these are fixtures, not candidate poses of the recorded hull.
//
// Azimuth is held constant across an episode rather than shuffled per tick,
// because a real hull's forward vector moves continuously; a per-tick shuffle
// would not be a plausible pose sequence, it would be noise.
function reconstruct(rows, clampMode, azimuth) {
  const out = [];
  let exactRows = 0, clampedRows = 0, maxAlignResidual = 0;
  const up = new THREE.Vector3(0, 1, 0);
  const alt = new THREE.Vector3(1, 0, 0);
  for (const r of rows) {
    const p = new THREE.Vector3(r.pos[0], r.pos[1], r.pos[2]);
    const aim = new THREE.Vector3(r.aim[0], r.aim[1], r.aim[2]);
    const dir = aim.clone().sub(p);
    const span = dir.length();
    assert.ok(span > 1e-6, 'a recorded aim must not sit on the hull');
    dir.divideScalar(span);
    let theta;
    if (r.al > 0) { theta = Math.acos(Math.min(1, r.al)); exactRows++; }
    else {
      clampedRows++;
      // theta is unrecorded here; these two values are fixture choices, not
      // the ends of a derived interval.
      theta = clampMode === 'floor' ? r.yaw : (r.yaw + Math.PI) / 2;
    }
    const u = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) > 0.9 ? alt : up).normalize();
    const v = new THREE.Vector3().crossVectors(dir, u).normalize();
    const fwd = dir.clone().multiplyScalar(Math.cos(theta))
      .addScaledVector(u, Math.sin(theta) * Math.cos(azimuth))
      .addScaledVector(v, Math.sin(theta) * Math.sin(azimuth))
      .normalize();
    if (r.al > 0) maxAlignResidual = Math.max(maxAlignResidual, Math.abs(fwd.dot(dir) - r.al));
    out.push({ row: r, p, aim, fwd });
  }
  return { samples: out, exactRows, clampedRows, maxAlignResidual };
}

// Drives the REAL watchdog over the recorded ticks. `turn` decides whether the
// candidate's cruise turn argument is supplied, so the same runtime can be run
// with and without the new credit and the difference attributed to it.
function replayThrough(api, samples, { turn }) {
  api.__resetDockScratch();
  const { ctx, ap } = makeCtx();
  let cancelledAt = null, replanAt = null, lastTrue = null;
  for (const s of samples) {
    const r = s.row;
    ctx.world.time = r.t;
    ap.phase = 'cruise';
    ap.idle = r.idle === true;
    ap.engaged = true;
    const ok = api.__dockMakingProgress(ctx, ap, r.sd, r.yaw, false, 0,
      turn ? { p: s.p, aim: s.aim, fwd: s.fwd } : null);
    if (ap.engaged === false) { cancelledAt = r.t; break; }
    if (!ok && replanAt === null) replanAt = r.t;
    if (ok) lastTrue = r.t;
  }
  return { cancelledAt, reason: ctx.autopilot.reason || '', replanAt, lastTrue,
    survived: cancelledAt === null };
}

async function replayCase() {
  const rows = loadEpisode();
  assert.equal(typeof autopilot.__dockTurnCredit, 'function',
    'the candidate must define the guard under test');

  console.log('EPISODE', JSON.stringify({
    source: rows.source, cruiseTicks: rows.length,
    from: rows[0].t, to: rows[rows.length - 1].t,
    recordedStallAtEnd: rows[rows.length - 1].stall,
    recordedYawFirst: rows[0].yaw, recordedYawLast: rows[rows.length - 1].yaw,
    recordedBestHeading: rows[0].bh, recordedReplans: rows[rows.length - 1].rp,
    medianTickSeconds: +((rows[rows.length - 1].t - rows[0].t) / (rows.length - 1)).toFixed(4),
  }));
  // The capture samples the controller at ~0.1 s while the sim ticks at 1/60 s.
  // The watchdog measures elapsed time from the timestamps it is given, so a
  // coarse sample cuts both ways: it can MISS an improvement that happened
  // between samples, and it can OVER-credit, because a single converging
  // sample credits the whole ~0.1 s gap even if the real sim converged only on
  // its final frame. The replay is therefore not a lower bound on the
  // candidate's credit in the live sim.

  // --- NEGATIVE BASELINE (durable, needs no history) -----------------------
  // The current module driven WITHOUT the cruise turn argument. Every other
  // caller of the watchdog still passes no turn, so this IS the pre-fix
  // accounting, running in this checkout. No reconstruction is involved: the
  // watchdog then reads only `range` and `yawAbs`, both recorded exactly.
  const noTurn = replayThrough(autopilot, rows.map(r => ({ row: r })), { turn: false });
  console.log('NEGATIVE BASELINE (no turn offered)', JSON.stringify(noTurn));
  assert.equal(noTurn.cancelledAt !== null, true,
    'NEGATIVE BASELINE: with no turn offered the watchdog must cancel the recorded episode');
  assert.equal(noTurn.reason, 'blocked', 'the cancellation is the blocked class');
  assert.ok(Math.abs(noTurn.cancelledAt - rows[rows.length - 1].t) < 0.25,
    `the replayed cancellation must land on the recorded one (${noTurn.cancelledAt}`
    + ` vs ${rows[rows.length - 1].t})`);
  console.log('NEGATIVE BASELINE OK — the recorded converging hull is cancelled at'
    + ` t=${noTurn.cancelledAt}, matching the recorded cancellation`);

  // --- HISTORICAL CONFIRMATION (optional) ----------------------------------
  // The same replay against the actual shipped pre-fix blob, when the checkout
  // has it. This is confirmation, not the load-bearing assertion.
  if (preFixSource === null) {
    console.log('HISTORICAL BASELINE SKIPPED — the pre-fix blob'
      + ` ${PRE_FIX_SHA.slice(0, 12)} is not in this checkout; the durable negative above stands`);
  } else {
    assert.equal(preFixSource.includes('dockTurnCredit'), false,
      'the pinned pre-fix source must NOT already contain the turn credit');
    const baseline = await import(BASELINE_URL);
    const pre = replayThrough(baseline, rows.map(r => ({ row: r })), { turn: false });
    console.log('HISTORICAL BASELINE REPLAY', JSON.stringify(pre));
    assert.equal(pre.reason, 'blocked', 'the shipped pre-fix guard cancels as blocked');
    assert.equal(pre.cancelledAt, noTurn.cancelledAt,
      'the shipped pre-fix guard and the no-turn candidate must agree tick for tick');
    console.log('HISTORICAL BASELINE OK — the shipped pre-fix guard cancels at the same'
      + ` tick, t=${pre.cancelledAt}`);
  }
  console.log('ATTRIBUTION OK — the candidate only differs when the cruise turn is supplied');

  // --- POSITIVE CANDIDATE: real guard, recorded inputs, synthetic pose ------
  const variants = [];
  for (const clampMode of ['floor', 'mid']) {
    for (let k = 0; k < 8; k++) {
      const azimuth = k * Math.PI / 4;
      const built = reconstruct(rows, clampMode, azimuth);
      // Where align was recorded unclamped the fixture reproduces the recorded
      // angle exactly, not by fitting. Assert that rather than assume it.
      assert.ok(built.maxAlignResidual < 1e-9,
        `the reconstruction must reproduce the recorded align exactly (${built.maxAlignResidual})`);
      assert.ok(built.exactRows > 0, 'the episode must contain exactly-pinned rows');
      const got = replayThrough(autopilot, built.samples, { turn: true });
      variants.push({ clampMode, azimuthDeg: k * 45,
        exactRows: built.exactRows, clampedRows: built.clampedRows,
        maxAlignResidual: built.maxAlignResidual, ...got });
    }
  }
  console.log('CANDIDATE REPLAY VARIANTS', JSON.stringify(variants, null, 1));
  for (const v of variants) {
    assert.equal(v.survived, true,
      `POSITIVE CANDIDATE (clamp=${v.clampMode} azimuth=${v.azimuthDeg}deg): a hull turning`
      + ' back onto its line must keep the helm through the recorded episode');
  }
  // Observation, not a requirement. The controller's mid-window replan fires
  // at half the watchdog window. Under some pose fixtures the credit holds
  // the stall below that, so the replan never becomes necessary; under others
  // it still fires. Both are correct: the credit does not touch dockReplans,
  // it only keeps the deadline from expiring on a hull that is turning.
  console.log('REPLAN UNDER CANDIDATE', JSON.stringify({
    recordedReplanAt: 40.985,
    variantsThatStillReplanned: variants.filter(v => v.replanAt !== null).length,
    variantsTotal: variants.length,
  }));
  console.log('POSITIVE CANDIDATE OK — every synthetic pose fixture survives the recorded'
    + ' watchdog inputs; a sensitivity spread, not a pose replay or live proof');
}

// ---------------------------------------------------------------------------
// CASE=guard — hard bounds on the real exported dockTurnCredit
// ---------------------------------------------------------------------------
async function guardCase() {
  const { __dockTurnCredit: dockTurnCredit, __resetDockScratch } = autopilot;
  assert.equal(typeof dockTurnCredit, 'function', 'the product must define the guard under test');
  const fresh = () => __resetDockScratch();
  const P = new THREE.Vector3(0, 0, 0);
  const at = (angle, radius = 500) =>
    new THREE.Vector3(Math.sin(angle) * radius, 0, -Math.cos(angle) * radius);
  const DT = 1 / 60;

  // --- bound 1: a MOVING AIM alone must never earn a single second, however
  // it moves. The hull is frozen; only the target turns.
  for (const [label, step] of [['smooth rotation', 0.01], ['coarse rotation', 0.2],
    ['reversing', -0.13], ['one epsilon per frame', 0.0499]]) {
    fresh();
    const fwd = new THREE.Vector3(0, 0, -1);
    let total = 0, angle = 0;
    for (let i = 0; i < 4000; i++) { angle += step; total += dockTurnCredit(P, at(angle), fwd, DT); }
    assert.equal(total, 0, `moving aim (${label}) must earn zero credit for a motionless hull`);
  }
  {
    fresh();
    const fwd = new THREE.Vector3(0, 0, -1);
    let total = 0, seed = 7;
    const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 4000; i++) total += dockTurnCredit(P, at(rnd() * Math.PI * 2), fwd, DT);
    assert.equal(total, 0, 'an arbitrarily jumping aim must earn zero credit for a motionless hull');
  }
  // A stationary hull whose aim SWEEPS TOWARDS it: the aim, not the hull, is
  // closing the error. This is the adversarial case the design must refuse.
  {
    fresh();
    const fwd = new THREE.Vector3(0, 0, -1);
    let total = 0;
    for (let i = 0; i < 4000; i++) total += dockTurnCredit(P, at(Math.PI * Math.exp(-i / 300)), fwd, DT);
    assert.equal(total, 0, 'an aim sweeping onto a motionless hull must earn zero credit');
  }
  {
    fresh();
    const fwd = new THREE.Vector3(0.3, -0.2, -1).normalize();
    const goal = at(0.7);
    let total = dockTurnCredit(P, goal, fwd, DT);
    for (let i = 0; i < 4000; i++) total += dockTurnCredit(P, goal, fwd, DT);
    assert.equal(total, 0, 'a motionless hull under a motionless aim must earn zero credit');
  }
  console.log('BOUND 1 OK — target motion alone, and no motion at all, earn exactly 0 s');

  // --- bound 2: a hull that really turns earns credit, but the TOTAL without
  // range progress is capped at exactly one watchdog window, however many
  // rebase+converge cycles an adversary manufactures.
  fresh();
  let total = 0, credits = 0;
  const ELAPSED = 0.25; // the watchdog's own per-frame clamp: fastest legal accrual
  const cycle = (goalAngle) => {
    const goal = at(goalAngle);
    const fwd = new THREE.Vector3(0, 0, -1);
    let got = dockTurnCredit(P, goal, fwd, ELAPSED);
    for (let i = 0; i <= 64; i++) {
      const a = goalAngle * (i / 64);
      fwd.set(Math.sin(a), 0, -Math.cos(a)).normalize();
      const c = dockTurnCredit(P, goal, fwd, ELAPSED);
      if (c > 0) credits++;
      got += c;
    }
    return got;
  };
  for (let c = 0; c < 200; c++) total += cycle(c % 2 === 0 ? Math.PI : 0);
  const measuredMax = +total.toFixed(6);
  console.log('BOUND 2 MEASURED', JSON.stringify({
    measuredMaxSeconds: measuredMax, creditEvents: credits,
    watchdogWindowSeconds: DOCK_BLOCK_SECONDS, cycles: 200, perFrameElapsed: ELAPSED,
  }));
  assert.equal(measuredMax, DOCK_BLOCK_SECONDS,
    'an adversary saturates the budget but can never exceed one watchdog window');
  assert.ok(credits > 0, 'a genuinely turning hull must be able to earn credit at all');

  // --- bound 3: once saturated, further turning earns nothing until a real
  // range gain refills it. Nothing in this loop is a range gain.
  const before = total;
  for (let c = 0; c < 50; c++) total += cycle(c % 2 === 0 ? Math.PI : 0);
  assert.equal(+(total - before).toFixed(6), 0,
    'a saturated budget must not be rearmed by replan or aim oscillation');
  console.log('BOUND 3 OK — saturated budget is not rearmed by aim oscillation');

  // --- bound 4: a fresh engagement starts fresh, and adoption always buys 0.
  fresh();
  const fwd0 = new THREE.Vector3(0, 0, -1);
  assert.equal(dockTurnCredit(P, at(1.2), fwd0, ELAPSED), 0,
    'the first reference adoption of an engagement buys zero time');
  console.log('BOUND 4 OK — reference adoption always buys zero');

  // --- bound 5: degenerate input must be inert, never credit.
  fresh();
  assert.equal(dockTurnCredit(P, P, fwd0, ELAPSED), 0, 'a zero-span aim earns nothing');
  assert.equal(dockTurnCredit(P, at(0.5), new THREE.Vector3(0, 0, 0), ELAPSED), 0,
    'a zero-length heading earns nothing');
  assert.equal(dockTurnCredit({ x: NaN, y: 0, z: 0 }, at(0.5), fwd0, ELAPSED), 0,
    'a non-finite pose earns nothing');
  assert.equal(dockTurnCredit(P, at(0.5), fwd0, NaN), 0, 'a non-finite elapsed earns nothing');
  console.log('BOUND 5 OK — degenerate input is inert');
}

// ---------------------------------------------------------------------------
// CASE=budget — hard bounds on the real dockMakingProgress accounting
// ---------------------------------------------------------------------------
// The guard case bounds the credit function. This case bounds the WATCHDOG,
// which is what actually cancels an approach: it measures how long these
// specific fixed-yaw fixtures survive without closing range, and proves a
// range gain is the only refill of the turn credit.
async function budgetCase() {
  const api = autopilot;
  const DT = 1 / 60;
  const P = new THREE.Vector3(0, 0, 0);
  const at = (angle, radius = 500) =>
    new THREE.Vector3(Math.sin(angle) * radius, 0, -Math.cos(angle) * radius);

  // Drives the real watchdog with a caller-supplied per-tick state.
  function run(step, { limit = 120 } = {}) {
    api.__resetDockScratch();
    const { ctx, ap } = makeCtx();
    let t = 0;
    for (let i = 0; i < limit / DT; i++) {
      t += DT; ctx.world.time = t;
      const s = step(t, i);
      ap.phase = 'cruise'; ap.idle = true; ap.engaged = true;
      api.__dockMakingProgress(ctx, ap, s.range, s.yawAbs, false, 0,
        s.fwd ? { p: P, aim: s.aim, fwd: s.fwd } : null);
      if (ap.engaged === false) return { cancelledAt: +t.toFixed(3), reason: ctx.autopilot.reason };
    }
    return { cancelledAt: null, reason: '' };
  }

  // The reference: a wholly stuck hull, no credit offered. This is the timeout
  // the product has always had.
  const stuck = run(() => ({ range: 1000, yawAbs: 1.2 }));
  console.log('BUDGET STUCK', JSON.stringify(stuck));
  assert.equal(stuck.reason, 'blocked', 'a stuck hull must still time out');

  // The adversary: a hull that never closes ONE unit of range, with an aim
  // driven to manufacture rebase-and-converge cycles forever. It must still be
  // cancelled, and the measured bound is asserted as a number rather than
  // assumed from the unchanged timer constant.
  const fwd = new THREE.Vector3(0, 0, -1);
  const adversary = run((t, i) => {
    const phase = Math.floor(i / 60) % 2;
    const a = phase === 0 ? (i % 60) / 60 * Math.PI : Math.PI - (i % 60) / 60 * Math.PI;
    fwd.set(Math.sin(a), 0, -Math.cos(a)).normalize();
    // Range creeps DOWN but never by the 1 u the watchdog counts as progress.
    return { range: 1000 - i * 0.0005, yawAbs: 1.2, aim: at(phase === 0 ? Math.PI : 0), fwd };
  }, { limit: 600 });
  console.log('BUDGET ADVERSARY', JSON.stringify({ ...adversary,
    stuckTimeoutSeconds: stuck.cancelledAt, watchdogWindowSeconds: DOCK_BLOCK_SECONDS }));
  assert.equal(adversary.reason, 'blocked',
    'an oscillating aim with no real range gain must still be cancelled');
  assert.ok(adversary.cancelledAt !== null, 'the adversary must terminate');
  // The measured cost for THIS fixture, stated as a number instead of implied
  // by the unchanged DOCK_BLOCK_SECONDS. The new turn credit adds at most one
  // watchdog window (10 s) per real range episode. It is not a universal
  // "no range gain means at most 20 s" guarantee: this fixture holds yawAbs
  // fixed, and the watchdog's pre-existing heading credit can reset the stall
  // on its own whenever yawAbs improves against dockBestHeading.
  const extra = adversary.cancelledAt - stuck.cancelledAt;
  console.log('BUDGET MEASURED EXTRA SECONDS', JSON.stringify({
    extra: +extra.toFixed(3), cap: DOCK_BLOCK_SECONDS }));
  assert.ok(extra <= DOCK_BLOCK_SECONDS + 0.05,
    `the worst case must buy at most one extra window (measured ${extra.toFixed(3)} s)`);

  // Same-frame ordering: a real >=1 u range gain refills the budget. Without
  // that refill the approach would die at the adversary's bound; with it, a
  // hull that keeps genuinely closing range keeps its helm indefinitely.
  const closing = run((t, i) => {
    const a = Math.max(0, 1.2 - i * 0.0005);
    fwd.set(Math.sin(a), 0, -Math.cos(a)).normalize();
    return { range: 1000 - i * 0.2, yawAbs: 1.2, aim: at(0), fwd };
  }, { limit: 300 });
  console.log('BUDGET CLOSING', JSON.stringify(closing));
  assert.equal(closing.cancelledAt, null,
    'a hull genuinely closing range must never be cancelled');
  console.log('BUDGET OK — stuck times out, this fixed-yaw adversary costs'
    + ` +${extra.toFixed(2)} s, and only real range progress refills the turn credit`);
}

// ---------------------------------------------------------------------------
// CASE=live — physical safety control
// ---------------------------------------------------------------------------
// This is a CONTROL, not the reproducer. The recorded failure is replayed in
// CASE=replay; what this case has to show is that the credit does not spoil an
// ordinary arrival: real boot, real light hull, real helm, real physics, real
// collision owners. It asserts the approach actually completes rather than
// merely avoiding the word 'blocked'.
async function liveCase() {
  const { installDomStubs, bootGameSystems, makeNavHelpers } =
    await import(mod('scripts/lib/boot-harness.mjs'));

  let seed = 7;
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const dom = installDomStubs();
  const { ctx, systems, binds } = await bootGameSystems();

  const DT = 1 / 60;
  const events = [];
  const phases = new Set();
  function tick(n = 1) {
    for (let i = 0; i < n; i++) {
      ctx.world.time += DT; ctx.elapsed += DT;
      for (const [, system] of systems) system.update?.(DT);
      events.push(...ctx.events.filter(e =>
        ['bodyHit', 'docked', 'playerDestroyed'].includes(e.type)));
      if (ctx.autopilot.engaged && ctx.autopilot.mode === 'dock' && ctx.autopilot.phase) {
        phases.add(ctx.autopilot.phase);
      }
      ctx.lastEvents = ctx.events; ctx.events = [];
    }
  }

  for (const node of dom.walkDom(document.body)) {
    if (node.dataset?.titleAction === 'new') { node.click(); break; }
  }
  dom.dispatchKey('Digit1'); ctx.flags.paused = false; tick(30);
  ctx.agent.optIn = true;
  const nav = makeNavHelpers({ ctx, SYSTEMS: binds.SYSTEMS, tick,
    dispatchKey: dom.dispatchKey, onRouteError: (m) => { throw Error(m); } });
  assert.ok(nav.travelTo('veridian', 'issue-234 live control'));
  assert.equal(ctx.player.classKey, 'light', 'the issue case is the starter light hull');

  const station = new THREE.Vector3(...binds.SYSTEMS.veridian.station.position);
  const stage = station.clone().add(new THREE.Vector3(135, 0, 0));
  const start = stage.clone().add(new THREE.Vector3(60, 20, 1400));
  ctx.ship.object.position.copy(start);
  ctx.ship.object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1),
    stage.clone().sub(start).normalize());
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.throttle = 0; ctx.input.fullStop = false;
  ctx.flags.docked = false; ctx.station.inZone = false;
  ctx.events = []; ctx.lastEvents = [];
  const hull0 = ctx.player.hull;

  const receipt = window.rimward.act({ v: 2, name: 'approachDock', args: {} });
  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  tick(1);
  assert.equal(ctx.autopilot.phase, 'cruise', 'the control must start in the cruise phase');

  const began = ctx.world.time;
  let bestRange = Infinity, lastGain = ctx.world.time, maxStall = 0;
  for (let f = 0; f < 60 * 240 && ctx.autopilot.engaged && !ctx.flags.docked; f++) {
    tick(1);
    const r = ctx.autopilot.range;
    if (Number.isFinite(r) && r <= bestRange - 1) { bestRange = r; lastGain = ctx.world.time; }
    maxStall = Math.max(maxStall, ctx.world.time - lastGain);
  }
  const outcome = {
    docked: ctx.flags.docked === true, engaged: ctx.autopilot.engaged,
    reason: ctx.autopilot.reason, phasesSeen: [...phases].sort(),
    elapsed: +(ctx.world.time - began).toFixed(2),
    hullStart: hull0, hullEnd: ctx.player.hull,
    contacts: events.filter(e => e.type === 'bodyHit').length,
    maxStallWithoutRangeGain: +maxStall.toFixed(2), watchdogWindow: DOCK_BLOCK_SECONDS,
  };
  console.log('LIVE CONTROL OUTCOME', JSON.stringify(outcome));

  // The control's bar: the approach must actually ARRIVE under the same helm.
  assert.equal(outcome.docked, true, 'the clear-lane control must reach the pad');
  assert.ok(phases.has('cruise') && phases.has('stage'),
    `the control must pass through cruise and stage (${outcome.phasesSeen.join(',')})`);
  assert.equal(events.filter(e => e.type === 'docked').length >= 1, true,
    'the control must emit the docked event');
  assert.equal(outcome.contacts, 0, 'the control must arrive with no hull contact');
  assert.equal(outcome.hullEnd, hull0, 'the control must arrive with no hull damage');
  assert.deepEqual(events.filter(e => e.type === 'playerDestroyed'), [],
    'the control must never destroy the player');
  assert.ok(outcome.maxStallWithoutRangeGain < DOCK_BLOCK_SECONDS,
    'a clear-lane arrival must never even approach the deadline');
  console.log('LIVE CONTROL OK — clear-lane arrival still docks on the same helm,'
    + ' no contact, no damage');
}

if (CASE === 'replay' || CASE === 'all') await replayCase();
if (CASE === 'guard' || CASE === 'all') await guardCase();
if (CASE === 'budget' || CASE === 'all') await budgetCase();
if (CASE === 'live' || CASE === 'all') await liveCase();
console.log('issue-234 cruise heading credit: OK', JSON.stringify({ CASE }));
