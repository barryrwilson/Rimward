/**
 * Issue #341 focused regression — system scale/population Phase 4 ambient life.
 *
 * Pins the headless-checkable half of the issue:
 *  - distant-traffic comms are band-scaled through BANDS[].chatterMult, bounded
 *    (one line per gap, never a flood), sourced from non-live mid/far records,
 *    reference a real distant place (station + gate destination system), and
 *    are suppressed while an overlay/jump owns the screen;
 *  - the module consumes ZERO global Math.random draws and mutates neither
 *    ctx.world nor any record (no persistent field);
 *  - the convoySurge far-lane variant helpers name a real distant system and
 *    the persisted activeEvent object keeps its exact {kind,startedAt,endsAt,
 *    system} shape (variant/line ride only the session-only worldEvent payload);
 *  - a real world boot fires the first scheduled dynamic event as a convoy and
 *    the HUD consumes its place-referencing start line.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-341-ambient-life-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installDomStubs, seedBootRandom } from './lib/boot-harness.mjs';

seedBootRandom();
installDomStubs();

const { createCtx } = await import('../src/core/ctx.js');
const { SYSTEMS, BANDS } = await import('../src/game/state.js');
const {
  CHATTER_GAP, CHATTER_FIRST_DELAY, CHATTER_MIN_GAP,
  chatterGapForBand, chatterFirstDelayForBand, chatterSuppressed,
  initDistantChatter,
} = await import('../src/game/distant-chatter.js');
const { initWorld, convoyVariantFor, convoyStartLine } = await import('../src/game/world.js');

const rendererStub = () => ({
  domElement: { style: {} }, setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {},
});

const STATION = [120, 20, 620];

function scopedCtx(band = 0, opts = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const ctx = createCtx({ scene, camera, renderer: rendererStub() });
  ctx.systems = {
    freehold: {
      id: 'freehold', name: 'Freehold Drift', band,
      station: { name: 'Freehold Landing', position: STATION },
      gates: [{ position: [0, 60, -900], to: 'veridian' }],
      landmarks: [{ id: 'fh_shepherd', name: 'The Shepherd' }],
    },
    veridian: {
      id: 'veridian', name: 'Veridian Reach', band,
      station: { name: 'Veridian Spire', position: [-140, 30, -550] },
      gates: [{ position: [0, 50, 900], to: 'freehold' }],
      landmarks: [{ id: 'vd_hulk_row', name: 'Hulk Row' }],
    },
  };
  ctx.world.currentSystem = opts.system ?? 'freehold';
  ctx.world.time = 0;
  ctx.ship.object = new THREE.Object3D();
  ctx.ship.object.position.set(...STATION);
  ctx.world.records = opts.records ?? [];
  return ctx;
}

function mkRec(id, px, extra = {}) {
  return {
    id,
    name: 'Hauler ' + id,
    role: 'trader',
    faction: 'freehold',
    classKey: 'freighter',
    state: 'enroute',
    live: false,
    system: 'freehold',
    px,
    route: [{ x: px, y: 0, z: 0 }, { x: px + 100, y: 0, z: 0 }],
    leg: 0,
    legT: 0.5,
    dir: 1,
    ...extra,
  };
}

const positionOf = (rec) => ({ x: rec.px, y: 0, z: 0 });

function driveChatter(ctx, seconds, dt = 0.5, chatter = null) {
  const inst = chatter ?? initDistantChatter(ctx);
  const lines = [];
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) {
    ctx.world.time += dt;
    ctx.events.length = 0;
    inst.update(dt, positionOf);
    for (const ev of ctx.events) {
      if (ev.type === 'commLine') lines.push({ t: ctx.world.time, text: ev.text, from: ev.from });
    }
  }
  return { inst, lines };
}

const checks = [];
const check = (name, fn) => {
  try { fn(); checks.push({ name, ok: true }); }
  catch (e) { checks.push({ name, ok: false, error: e.message }); }
};

// ---------------------------------------------------------------------------
// 1. Cadence constants: band-scaled, bounded floor.
// ---------------------------------------------------------------------------
check('cadence: base gap and first-delay constants are bounded', () => {
  assert.ok(CHATTER_GAP[0] >= 20 && CHATTER_GAP[1] > CHATTER_GAP[0]);
  assert.ok(CHATTER_FIRST_DELAY[0] >= 5 && CHATTER_FIRST_DELAY[1] > CHATTER_FIRST_DELAY[0]);
  assert.ok(CHATTER_MIN_GAP >= 10);
});
check('cadence: band chatterMult stretches the gap (core vs Hush/Verge)', () => {
  const core = chatterGapForBand(0, 0.5);
  const band1 = chatterGapForBand(1, 0.5);
  const band2 = chatterGapForBand(2, 0.5);
  const band3 = chatterGapForBand(3, 0.5);
  const band4 = chatterGapForBand(4, 0.5);
  assert.ok(core >= CHATTER_MIN_GAP && core <= CHATTER_GAP[1]);
  assert.ok(band1 > core && band2 > band1 && band3 > band2 && band4 > band3);
  assert.ok(band4 >= core * 10, 'Verge gap must be at least 10x the core gap');
  assert.equal(BANDS[3].chatterMult, 0.1);
  assert.equal(BANDS[4].chatterMult, 0.05);
});
check('cadence: first-line delay is band-scaled too', () => {
  assert.ok(chatterFirstDelayForBand(3, 0.5) > chatterFirstDelayForBand(0, 0.5) * 5);
  assert.ok(chatterFirstDelayForBand(4, 0.5) >= chatterFirstDelayForBand(0, 0.5) * 10);
});

// ---------------------------------------------------------------------------
// 2. A distant line appears once, from a non-live mid/far record, and names a
//    real place beyond the bubble.
// ---------------------------------------------------------------------------
{
  const rec = mkRec('far-trader', 1800);
  const ctx = scopedCtx(0, { records: [rec] });
  const { lines } = driveChatter(ctx, 60);
  check('chatter: a distant line appears inside the first window', () => {
    assert.ok(lines.length >= 1, 'no chatter line in 60 s');
    assert.ok(lines[0].t >= CHATTER_FIRST_DELAY[0] - 1);
    assert.ok(lines[0].t <= CHATTER_FIRST_DELAY[1] + 3);
  });
  check('chatter: speaker is the non-live distant record', () => {
    assert.equal(lines[0].from, rec.name);
    assert.equal(rec.live, false);
  });
  check('chatter: text names the station and a gate destination system', () => {
    const text = lines[0].text;
    assert.ok(text.includes(rec.name + ': '), 'speaker prefix missing: ' + text);
    assert.ok(text.includes('Freehold Landing') || text.includes('Veridian Reach'), 'no place reference: ' + text);
  });
  check('chatter: record was not mutated', () => {
    assert.equal(rec.live, false);
    assert.equal(rec.state, 'enroute');
    assert.ok(!Object.hasOwn(rec, 'chatterAt'));
  });
}

// ---------------------------------------------------------------------------
// 3. Bounded rate: never floods, and the Hush is nearly silent.
// ---------------------------------------------------------------------------
{
  const records = [mkRec('a', 1800), mkRec('b', 2600), mkRec('c', 1200)];
  const ctx = scopedCtx(0, { records });
  const { lines } = driveChatter(ctx, 600);
  check('chatter: 10 core minutes stay bounded', () => {
    assert.ok(lines.length >= 1 && lines.length <= 25, 'core line count ' + lines.length);
    for (let i = 1; i < lines.length; i++) {
      assert.ok(lines[i].t - lines[i - 1].t >= CHATTER_MIN_GAP - 0.6, 'lines too close: ' + (lines[i].t - lines[i - 1].t));
    }
  });
  const hush = scopedCtx(4, { records: [mkRec('h', 1800)] });
  const hushRun = driveChatter(hush, 600);
  check('chatter: Verge band is near-silent over 10 minutes', () => {
    assert.ok(hushRun.lines.length <= 2, 'verge line count ' + hushRun.lines.length);
  });
}

// ---------------------------------------------------------------------------
// 4. No candidates: no line. Live records never speak.
// ---------------------------------------------------------------------------
{
  const near = mkRec('near', 100);
  const ctx = scopedCtx(0, { records: [near] });
  const { lines } = driveChatter(ctx, 600);
  check('chatter: no distant records means no lines', () => assert.equal(lines.length, 0));

  const liveRec = mkRec('live-far', 1800, { live: true });
  const ctx2 = scopedCtx(0, { records: [liveRec] });
  const run2 = driveChatter(ctx2, 600);
  check('chatter: a live hull is not a distant speaker', () => assert.equal(run2.lines.length, 0));
}

// ---------------------------------------------------------------------------
// 5. Overlay/jump suppression; no burst on close.
// ---------------------------------------------------------------------------
{
  const rec = mkRec('far-trader', 1800);
  const ctx = scopedCtx(0, { records: [rec] });
  const chatter = initDistantChatter(ctx);
  ctx.flags.docked = true;
  const docked = driveChatter(ctx, 300, 0.5, chatter);
  check('chatter: docked station menus suppress the lanes', () => assert.equal(docked.lines.length, 0));
  ctx.flags.docked = false;
  const after = driveChatter(ctx, 60, 0.5, chatter);
  check('chatter: resumes after undocking without a burst', () => {
    assert.ok(after.lines.length >= 1);
    assert.ok(after.lines.length <= 2);
  });
  check('chatter: suppression helper covers every overlay', () => {
    for (const flag of ['docked', 'berthHold', 'hailOpen', 'chartOpen']) {
      const c = scopedCtx(0, {});
      c.flags[flag] = true;
      assert.equal(chatterSuppressed(c), true, flag);
    }
    const jumping = scopedCtx(0, {});
    jumping.gate.jumping = true;
    assert.equal(chatterSuppressed(jumping), true);
  });
}

// ---------------------------------------------------------------------------
// 6. Determinism: zero global Math.random draws; identical runs speak alike.
// ---------------------------------------------------------------------------
{
  const records = [mkRec('a', 1800), mkRec('b', 2600), mkRec('c', 1200)];
  const ctx = scopedCtx(0, { records });
  const orig = Math.random;
  let calls = 0;
  Math.random = () => { calls++; return 0.5; };
  const first = driveChatter(ctx, 300);
  Math.random = orig;
  check('determinism: chatter consumes no Math.random draws', () => assert.equal(calls, 0));

  const ctxB = scopedCtx(0, { records: [mkRec('a', 1800), mkRec('b', 2600), mkRec('c', 1200)] });
  const second = driveChatter(ctxB, 300);
  check('determinism: the same system speaks the same lines', () => {
    assert.deepEqual(first.lines.map((l) => l.text), second.lines.map((l) => l.text));
  });
}

// ---------------------------------------------------------------------------
// 7. A real system change resets the timer/counter (no stale future timer).
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx(0, { records: [mkRec('fh', 1800)] });
  const chatter = initDistantChatter(ctx);
  driveChatter(ctx, 60, 0.5, chatter);
  ctx.world.currentSystem = 'veridian';
  ctx.ship.object.position.set(-140, 30, -550);
  ctx.world.records = [mkRec('vd', 1900, { system: 'veridian' })];
  const first = driveChatter(ctx, 2, 0.5, chatter);
  check('system change: no immediate line from the stale timer', () => assert.equal(first.lines.length, 0));
  const later = driveChatter(ctx, 30, 0.5, chatter);
  check('system change: the new system speaks on its own first delay', () => assert.ok(later.lines.length >= 1));
}

// ---------------------------------------------------------------------------
// 8. No persistent field: ctx.world and the record bank are untouched.
// ---------------------------------------------------------------------------
{
  const records = [mkRec('a', 1800), mkRec('b', 2600)];
  const ctx = scopedCtx(0, { records });
  const keysBefore = Object.keys(ctx.world).sort();
  const jsonBefore = JSON.stringify(ctx.world.records);
  driveChatter(ctx, 300);
  check('persistence: no new ctx.world field', () => assert.deepEqual(Object.keys(ctx.world).sort(), keysBefore));
  check('persistence: the record bank is byte-identical', () => assert.equal(JSON.stringify(ctx.world.records), jsonBefore));
}

// ---------------------------------------------------------------------------
// 9. Convoy far-lane variant helpers: real place reference, deterministic, no
//    Math.random draw, and no extra persisted activeEvent shape.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx(0, {});
  const ctxFar = scopedCtx(2, {});
  const orig = Math.random;
  let calls = 0;
  Math.random = () => { calls++; return 0.25; };
  const variantCore = convoyVariantFor(ctx);
  const lineCore = convoyStartLine(ctx, variantCore);
  const variantRim = convoyVariantFor(ctxFar);
  const lineRim = convoyStartLine(ctxFar, variantRim);
  Math.random = orig;
  check('convoy: variant selection is deterministic and band-aware', () => {
    assert.ok(['standard', 'farLane'].includes(variantCore));
    assert.equal(variantRim, 'farLane');
    assert.equal(convoyVariantFor(ctx), variantCore);
  });
  check('convoy: the line names the station and a real distant system', () => {
    for (const text of [lineCore, lineRim]) {
      assert.ok(text.includes('Freehold Landing'), 'station missing: ' + text);
      assert.ok(text.includes('Veridian Reach'), 'distant system missing: ' + text);
      assert.ok(text.length <= 100, 'line too long: ' + text);
    }
    assert.ok(lineRim.includes('inbound from'));
  });
  check('convoy: helpers consume no Math.random draws', () => assert.equal(calls, 0));
}

// ---------------------------------------------------------------------------
// 10. A real world boot fires the first scheduled event as a convoy, with the
//     session-only variant/line payload, while activeEvent keeps its persisted
//     shape (no new saved field).
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx(0, {});
  ctx.systems = SYSTEMS;
  ctx.world.currentSystem = 'freehold';
  ctx.world.records = [];
  ctx.world.jobs = [];
  ctx.ship.object.position.set(...STATION);
  const activeKeys = ['endsAt', 'kind', 'startedAt', 'system'];
  const world = initWorld(ctx);
  ctx.world.time = 500;
  ctx.events.length = 0;
  world.update(0.5);
  check('world: the first scheduled dynamic event is a convoy', () => {
    assert.equal(ctx.world.activeEvent?.kind, 'convoySurge');
    assert.deepEqual(Object.keys(ctx.world.activeEvent).sort(), activeKeys);
  });
  check('world: the worldEvent payload carries a far-lane variant + place line', () => {
    const ev = ctx.events.find((e) => e.type === 'worldEvent');
    assert.ok(ev, 'no worldEvent emitted');
    assert.equal(ev.phase, 'start');
    assert.equal(ev.variant, 'farLane', 'the guaranteed first convoy is the far-lane variant');
    assert.ok(typeof ev.line === 'string' && ev.line.includes('Freehold Landing'), 'line ' + ev.line);
  });
  check('world: ambient chatter reached the live comm channel on the same boot', () => {
    assert.ok(ctx.events.some((e) => e.type === 'commLine' && typeof e.from === 'string' && e.from !== 'Echo'), 'no commLine');
  });
}

const failures = checks.filter((c) => !c.ok);
for (const c of checks) console.log((c.ok ? 'ok ' : 'FAIL ') + c.name + (c.ok ? '' : ' — ' + c.error));
if (failures.length > 0) {
  console.error('ISSUE #341 AMBIENT LIFE FAIL (' + failures.length + ' of ' + checks.length + ')');
  process.exit(1);
}
console.log('ISSUE #341 AMBIENT LIFE PASS (' + checks.length + ' checks)');
