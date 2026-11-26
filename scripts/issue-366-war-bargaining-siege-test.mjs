/**
 * Issue #366 — a sustained-damage war siege converts a pinned bargaining
 * quarry inside the job window.
 *
 * The playtest frame (war-freehold-9 "Strike Pale Warrant", 300 UU, deadline
 * 596 s): the bound quarry absorbed 82 sampled npcHit rows with a hull floor
 * of 0.6653, resolveBand cycled defiant->shaken->bargaining<->shaken with
 * hailState "willing", and the hull never reached capitulate inside the
 * window. The job lapsed at t=2884.1 and the quarry capitulated only at
 * t=3582.7 — 700 s after the lapse — so the strike paid 0.
 *
 * Root cause (npc.js updateResolve): the resolve recompute is a pure function
 * of the instant (screen/shell/hull/engine fractions), so a slow siege — hull
 * grinding down while the screen recharges between hits — hovers across the
 * bargaining/shaken line (40) forever and never reaches the capitulate
 * threshold (20). There is no hull clamp (state.js applyHit); the stalemate
 * is purely the resolve economics. A hailed bargaining hull also holds
 * position weapons-cold (engageTarget), so the pinned hull absorbs fire
 * indefinitely.
 *
 * The fix: each 1 Hz resolve sample that lands fresh player-caused damage
 * while the hull stands bargaining or shaken bleeds the sampled resolve
 * toward capitulate (banked, capped, session-scoped on the live ai; nothing
 * persisted). The post-erosion resolve decides the band transition, so a
 * sustained siege reaches capitulate inside a war window; the engage lease
 * then finishes the surrendered kill-contract quarry (#325/#357) and the
 * witnessed kill pays the strike.
 *
 * Fixture discipline: real boot, real npc update loop, real scare trail, real
 * applyHit damage. The combat.js hit stamp is replayed as the witness shape
 * the guns land — applyHit with the observed siege cadence (one hit per ~7 s,
 * the screen partially recharging between hits, exactly the 82-hit/599 s
 * playtest rhythm), the scare receipt combat.js writes at hit time
 * (recordScareDamage), the npcHit row and the lastAttacker attribution stamp.
 * The world's own 1 Hz resolve pass does everything else. No outcome is
 * stamped that the tested code should produce.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-366-war-bargaining-siege-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { scareDamageTotal, recordScareDamage } from '../src/game/first-scare.js';
import { applyHit } from '../src/game/state.js';

let checks = 0;
const check = async (label, fn) => { await fn(); checks++; console.log('PASS', label); };

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();

let converted = null; // the A1 hull, kept referenced past roster retirement

function step(seconds = 1) {
  const dt = 1 / 60;
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    ctx.elapsed += dt;
    ctx.world.time += dt;
    for (const [, s] of systems) {
      try { s?.update?.(dt, ctx); } catch { /* one frame's error must not stop the probe */ }
    }
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

const latestIncident = (name, kind) => {
  const incs = ctx.world.incidents || [];
  for (let i = incs.length - 1; i >= 0; i--) {
    if (incs[i] && incs[i].name === name && incs[i].kind === kind) return incs[i];
  }
  return null;
};

async function spawnSiegeQuarry(opts = {}) {
  const sysId = ctx.world.currentSystem;
  const rec = {
    id: 'rec-366-' + (opts.tag ?? 'a'), name: 'Siege Fixture ' + (opts.tag ?? 'a').toUpperCase(),
    classKey: 'cutter', faction: 'independent', role: 'patrol', system: sysId,
    state: 'enroute',
  };
  (ctx.world.recordBanks?.[sysId] ?? ctx.world.records).push(rec);
  await binds.primeShipAsset('independent', 'cutter', 'patrol');
  const p = ctx.ship.object.position;
  const live = binds.spawnLiveShip(ctx, rec, { x: p.x + 140, y: p.y, z: p.z });
  assert.ok(live, 'the quarry instantiated');
  if (!ctx.ships.includes(live)) ctx.ships.push(live);
  // The pinned siege shape the playtest sampled: hull ground to ~2/3 with
  // the layers worn but not gone (the 0.6653 hull floor ran with a partially
  // charged screen between hits), engine hurt; the player is the last
  // attacker (the attribution stamp combat.js writes on a hull-reducing hit).
  // resolve seeds mid-band; the recompute overwrites it from the real inputs.
  live.state.screen = Math.round(live.state.screenMax * (opts.screenFrac ?? 0.3));
  live.state.shell = Math.round(live.state.shellMax * (opts.shellFrac ?? 0.5));
  live.state.hull = Math.max(1, live.state.hullMax * (opts.hullFrac ?? 0.66));
  live.state.engine = Math.max(1, live.state.engineMax * 0.9);
  live.state.personality = opts.personality ?? 0;
  live.state.resolve = opts.resolveSeed ?? 45;
  live.ai.lastAttacker = 'player';
  live.ai.calmUntil = 0;
  live.ai.resolveAt = 0;
  return { rec, live };
}

/**
 * The combat.js hit stamp, replayed at the observed siege cadence: the real
 * applyHit does the layer math (the screen partially recharges between hits,
 * so the hull grinds instead of breaking), then the scare receipt the hit
 * writes (recordScareDamage), the npcHit row and the attribution stamp.
 */
function siegeHit(live, damage, fromPlayer = true) {
  const before = scareDamageTotal(live.state);
  const events = applyHit(live.state, {
    damage, family: 'cannon', facet: 'fore', now: ctx.world.time,
  });
  recordScareDamage(live, fromPlayer, before, ctx.world.time);
  live.ai.lastAttacker = fromPlayer ? 'player' : 'npc';
  ctx.emit('npcHit', {
    ship: live, damage,
    ...(fromPlayer ? { attackerId: 'player', attackerName: 'your ship' } : { attackerUnknown: true }),
  });
  for (const ev of events) {
    if (ev.type === 'disabled') ctx.emit('npcDisabled', { ship: live });
    else if (ev.type === 'destroyed') ctx.emit('npcDestroyed', { ship: live });
  }
}

/** The playtest siege rhythm: one hit every cadence seconds, stepping 1 s. */
function runSiege(live, { cadence = 7, damage = 9, fromPlayer = true, maxSamples }) {
  const bites = [3, 2, 4, 2, 3, 3]; // uneven plinks, mostly into the recharging screen
  let samples = 0;
  while (samples < maxSamples && !live.state.surrendered && !live.state.destroyed) {
    if (samples % cadence === 0) siegeHit(live, bites[samples % bites.length], fromPlayer);
    samples++;
    step(1);
  }
  return { samples, surrendered: live.state.surrendered, destroyed: live.state.destroyed };
}

for (const el of [...dom.walkDom(document.body)]) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;

// ---------------------------------------------------------------------------
// A. The regression: the pinned bargaining quarry capitulates inside the
//    596 s war window under sustained player damage.
// ---------------------------------------------------------------------------
await check('A1 a sustained siege converts a pinned bargaining quarry inside the war window', async () => {
  const { rec, live } = await spawnSiegeQuarry({ tag: 'a', hullFrac: 0.62 });
  step(1 / 60);
  siegeHit(live, 8); // the first sample: threatened, the recompute reads the real inputs
  step(2);
  assert.ok(['bargaining', 'shaken'].includes(live.ai.band),
    'the fixture starts pinned in a broken band: ' + live.ai.band);
  const r = runSiege(live, { cadence: 7, fromPlayer: true, maxSamples: 596 });
  console.log('PROBE A1', JSON.stringify({
    ...r, elapsed: r.samples,
    band: live.ai.band, resolve: live.state.resolve,
    hullFrac: +(live.state.hull / live.state.hullMax).toFixed(4),
    screenFrac: +((live.state.screen + live.state.shell) / (live.state.screenMax + live.state.shellMax)).toFixed(3),
  }));
  assert.ok(r.surrendered, 'the quarry capitulated inside the war window');
  assert.ok(r.samples < 596, 'the conversion beat the 596 s deadline: ' + r.samples + ' s');
  assert.equal(live.ai.band, 'capitulate', 'the band stands at capitulate');
  const inc = latestIncident(rec.name, 'surrendered');
  assert.ok(inc, 'a surrendered incident is recorded');
  assert.equal(inc.causer, 'player', 'the siege break is player-caused');
  assert.ok(rec.state !== 'dead' && rec.state !== 'captured',
    'the yield is not a kill: the lease finish and the witnessed kill remain the paying path');
  converted = live;
});

// ---------------------------------------------------------------------------
// B. The guards: the erosion needs fresh player damage, and a defiant hull
//    never enters a broken band to be eroded (the parity-fixture contract).
// ---------------------------------------------------------------------------
await check('B1 an NPC-only siege leaves the hull pinned in its broken band', async () => {
  const { live } = await spawnSiegeQuarry({ tag: 'b', hullFrac: 0.62 });
  step(1 / 60);
  siegeHit(live, 8, false);
  step(2);
  assert.ok(['bargaining', 'shaken'].includes(live.ai.band), 'starts in a broken band');
  // The identical playtest rhythm, but every stamp is NPC-caused: the receipt
  // the combat.js stamp leaves is not the player's, so no erosion applies and
  // the pre-fix hover persists — the regression shape. Bounded inside the
  // window where the player siege converted (A1: 50 s): the NPC-only siege
  // must still be hovering there. Past the attrition point the hull only ever
  // dies the ordinary disabled->destroyed way (#325), never a conversion.
  const r = runSiege(live, { cadence: 7, fromPlayer: false, maxSamples: 120 });
  console.log('PROBE B1', JSON.stringify({
    ...r,
    band: live.ai.band, resolve: live.state.resolve,
    hullFrac: +(live.state.hull / live.state.hullMax).toFixed(4),
  }));
  assert.ok(!r.surrendered && !r.destroyed, 'an NPC-only siege neither converts nor wrecks the hull inside the window');
  assert.ok(['bargaining', 'shaken'].includes(live.ai.band),
    'the hull keeps hovering in its broken band without the erosion: ' + live.ai.band);
});

await check('B2 a defiant (high-personality) hull never erodes — the parity fixture holds', async () => {
  const { live } = await spawnSiegeQuarry({ tag: 'c', hullFrac: 0.62, personality: 95, resolveSeed: 85 });
  step(1 / 60);
  siegeHit(live, 8);
  step(1);
  assert.equal(live.ai.band, 'defiant', 'the personality-95 hull reads defiant');
  const r = runSiege(live, { cadence: 1, fromPlayer: true, maxSamples: 60 });
  assert.ok(!r.surrendered, 'the defiant hull never capitulates under the erosion');
  assert.ok(live.ai.band === 'defiant' || live.state.disabled || live.state.destroyed,
    'the band never walks into a broken band: ' + live.ai.band);
});

// ---------------------------------------------------------------------------
// C. Architecture invariants: no new persisted fields, everything JSON-safe.
// ---------------------------------------------------------------------------
await check('C1 the siege state is session-scoped: no record or save field gains a key', () => {
  const live = converted;
  assert.ok(live, 'the A1 hull is referenced');
  assert.equal(typeof live.ai.siegeErosion, 'number', 'the banked erosion is a plain number on the live ai');
  const recSnapshot = JSON.parse(JSON.stringify(live.record));
  assert.ok(!Object.hasOwn(recSnapshot, 'siegeErosion') && !Object.hasOwn(recSnapshot, 'siegeSince'),
    'the record gains no siege field');
  const stSnapshot = JSON.parse(JSON.stringify(live.state));
  assert.ok(!Object.hasOwn(stSnapshot, 'siegeErosion'), 'the ship state gains no siege field');
  const bankSnapshot = JSON.parse(JSON.stringify(ctx.world.recordBanks));
  assert.ok(bankSnapshot, 'record banks snapshot JSON-safe');
});

console.log('issue-366: ' + checks + ' checks passed');
