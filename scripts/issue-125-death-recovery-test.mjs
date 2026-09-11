/**
 * Issue #125 — Marked origin: hunters kill the starter hull three times in
 * 13 sim-minutes; each recovery rewinds and relocates kilometres away.
 *
 * Two defects, one suite:
 *   (a) death recovery restored whatever the rolling autosave held — usually
 *       a mid-flight snapshot taken with the killer already inbound — with
 *       the throttle setpoint still live and no receipt for the rewind or the
 *       hold the dark kept;
 *   (b) Freehold's second patrol record carried the NEIGHBOUR's faction, so a
 *       Veridian Combine heavy patrolled Freehold Drift and hunted a Marked
 *       player (Veridian −15) on standing alone, inside Freehold.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the REAL save system consumes the
 * REAL docked / undocked / playerDestroyed events off ctx.lastEvents; the REAL
 * controls system consumes the recovered receipt. No pin writes storage keys
 * by hand except to forge a foreign lineage.
 *
 * Covered:
 *   1  patrol law is local: every Freehold patrol record flies Freehold's
 *      flag; a Marked player is not a patrol target in Freehold; Freehold
 *      standing ≤ −10 still is; standing law is local, so a legacy
 *      foreign-faction patrol in Freehold does not hunt on the Veridian
 *      board, hunts at home, and a player scratch still provokes it
 *   2  the berth mirror: the docked and launch checkpoints write BERTH_KEY
 *      with the lineage stamp; an idle autosave rolls the autosave key only
 *   3  a death within BERTH_RECOVERY_WINDOW of a mid-flight autosave returns
 *      to the berth: position, hold, `recovered { source:'berth',
 *      rewindSeconds, lostCargo, lostUnits }`, the two comm receipts, the
 *      overlay copy, the session ring, and a zeroed throttle setpoint
 *   4  a death beyond the window restores the autosave as before, with the
 *      honest copy and receipt
 *   5  fail closed: a berth mirror from another lineage, a legacy blob with
 *      no stamps, and no autosave at all (fresh: the whole hold is the loss)
 *   6  clearAutosave drops the mirror and keeps the manual slots
 *   7  the ring sanitizer keeps 'berth' and the bounded receipt fields, and
 *      drops junk rows and negative numbers
 *
 * Run: npm run test:death-recovery
 */
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const { mayHuntPlayer } = await import('../src/systems/npc.js');
const { BERTH_KEY, BERTH_RECOVERY_WINDOW, clearAutosave, readRecoveryPlan, lostCargoRows } = await import('../src/game/save.js');
const { sanitizeEvent } = await import('../src/game/agent-schema.js');
const { SYSTEMS } = await import('../src/game/state.js');

const KEY = 'rimward-save-v1';
const DT = 1 / 60;
const allEvents = [];
function tick(n, selected = systems) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of selected) sys.update?.(DT);
    allEvents.push(...ctx.events);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
const only = (...names) => systems.filter(([n]) => names.includes(n));
const SAVE = only('save');
const SAVE_CTRL = only('save', 'controls');
const mark = () => allEvents.length;
const since = (m, type) => allEvents.slice(m).filter((e) => e.type === type);
const commSince = (m) => since(m, 'commLine').map((e) => e.text);
const stored = (key) => { const raw = dom.store.get(key); return raw ? JSON.parse(raw) : null; };
const deathLine = () => {
  for (const node of dom.walkDom(document.body)) if (node.className === 'death-line') return node.textContent;
  return null;
};

// Marked origin (Digit3): fear 15, veridian −15, redledger +10.
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit3');
ctx.flags.paused = false;
tick(30);
ctx.flags.docked = false;
pin('fixture: Marked origin in Freehold', ctx.world.origin === 'marked' && ctx.world.currentSystem === 'freehold'
  && ctx.world.reputation.veridian === -15, { origin: ctx.world.origin, rep: ctx.world.reputation });

// ---- 1. patrol law is local ------------------------------------------------
{
  const bank = ctx.world.recordBanks.freehold;
  const patrols = bank.filter((r) => r.role === 'patrol');
  pin('Freehold fields two patrol records', patrols.length === 2, patrols.map((r) => [r.name, r.faction]));
  pin('every Freehold patrol flies the Freehold flag', patrols.every((r) => r.faction === 'freehold'),
    patrols.map((r) => [r.name, r.faction]));
  const liveOf = (rec) => ({ ai: { role: 'patrol' }, role: 'patrol', record: rec, state: { faction: rec.faction } });
  pin('a Marked player is no patrol target in Freehold on standing alone',
    patrols.every((r) => mayHuntPlayer(ctx, liveOf(r)) === false), ctx.world.reputation);
  const fh = ctx.world.reputation.freehold;
  ctx.world.reputation.freehold = -10;
  pin('Freehold standing at −10 still makes Freehold law hunt',
    patrols.every((r) => mayHuntPlayer(ctx, liveOf(r)) === true), ctx.world.reputation);
  ctx.world.reputation.freehold = fh;
  // A legacy bank record: the neighbour's faction on a Freehold patrol.
  // Standing law is local — the Veridian board does not follow the player
  // into Freehold, but it bites the moment the same hull meets them at home.
  const legacy = { ...patrols[1], id: 'rec-legacy-po', faction: 'veridian' };
  pin('a legacy Veridian patrol in Freehold does not hunt a Marked player on standing',
    mayHuntPlayer(ctx, liveOf(legacy)) === false);
  ctx.world.currentSystem = 'veridian';
  pin('the same Veridian patrol hunts a Marked player inside Veridian space',
    mayHuntPlayer(ctx, liveOf(legacy)) === true);
  pin('a Freehold patrol in Veridian space does not enforce Freehold law there',
    (() => { const fh = ctx.world.reputation.freehold; ctx.world.reputation.freehold = -10;
      const r = mayHuntPlayer(ctx, liveOf(patrols[0])); ctx.world.reputation.freehold = fh; return r === false; })());
  ctx.world.currentSystem = 'freehold';
  const scratched = { ...liveOf(legacy), ai: { role: 'patrol', lastAttacker: 'player' }, state: { faction: 'veridian', hull: 10, hullMax: 20, screen: 0, screenMax: 10 } };
  pin('a player scratch still provokes a foreign patrol anywhere', mayHuntPlayer(ctx, scratched) === true, scratched.ai);
  const war = (ctx.world.jobs || []).filter((j) => j.kind === 'war' && j.originSystem === 'freehold');
  const foreignHome = war.filter((j) => bank.some((r) => r.id === j.recordId));
  pin('no Freehold war posting binds a Freehold-bank hull', foreignHome.length === 0, war.map((j) => [j.title, j.recordId]));
}

// ---- 2. the berth mirror ----------------------------------------------------
{
  dom.store.delete(KEY);
  dom.store.delete(BERTH_KEY);
  ctx.cargo.length = 0;
  ctx.ship.object.position.set(120, 30, 680);
  ctx.flags.docked = true;
  ctx.emit('docked');
  tick(2, SAVE);
  const auto = stored(KEY);
  const berth = stored(BERTH_KEY);
  pin('the docked checkpoint writes the autosave and the berth mirror',
    !!auto && !!berth && auto.berth === true && berth.berth === true && auto.berthSavedAt === auto.savedAt
      && berth.savedAt === auto.savedAt, { auto: auto && [auto.berth, auto.berthSavedAt, auto.savedAt], berth: berth && berth.savedAt });
  ctx.flags.docked = false;
  ctx.ship.object.position.set(100, 20, 700);
  tick(60, SAVE); // a second on the clock so the launch record is distinct
  ctx.emit('undocked');
  tick(2, SAVE);
  const launch = stored(BERTH_KEY);
  pin('the launch checkpoint refreshes the berth mirror',
    !!launch && launch.berth === true && launch.world.time > berth.world.time
      && launch.ship.position[2] === 700 && stored(KEY).savedAt === launch.savedAt, launch && launch.world.time);
  // Fly out; the 60 s idle autosave rolls the autosave key only.
  ctx.ship.object.position.set(2000, 0, 0);
  ctx.cargo.push({ commodity: 'rawOre', units: 14 });
  tick(61 * 60, SAVE);
  const idle = stored(KEY);
  pin('the idle autosave rolls the autosave key and carries the lineage stamp',
    !!idle && idle.berth !== true && idle.berthSavedAt === launch.savedAt && idle.ship.position[0] === 2000
      && idle.cargo.length === 1 && idle.cargo[0].units === 14, idle && [idle.berth, idle.berthSavedAt, idle.ship.position]);
  pin('the idle autosave leaves the berth mirror alone', dom.store.get(BERTH_KEY) === JSON.stringify(launch));
}

// ---- 3. a death inside the encounter returns to the berth ------------------
{
  const launch = stored(BERTH_KEY);
  const idle = stored(KEY);
  ctx.cargo.push({ commodity: 'refinedMetals', units: 5 });
  ctx.ship.object.position.set(2600, 0, 0);
  ctx.input.throttle = 0.8;
  ctx.input.throttleHeld = true;
  tick(30 * 60, []); // 30 s after the mid-flight autosave, no save runs
  const deathAt = ctx.world.time;
  const plan = readRecoveryPlan(ctx, deathAt);
  pin('the plan names the berth for a death inside the window',
    plan.source === 'berth' && plan.snap && plan.snap.savedAt === launch.savedAt, plan.source);
  const m = mark();
  ctx.emit('playerDestroyed', {});
  tick(2, SAVE);
  pin('the overlay says the berth', ctx.deathApi.isOpen() === true
    && deathLine() === 'No UU charge. Credits, cargo, and hull return as they were at your last berth.', deathLine());
  dom.dispatchKey('Enter');
  tick(2, SAVE_CTRL);
  const rec = since(m, 'recovered')[0];
  const expectRewind = Math.round(deathAt - launch.world.time);
  pin('recovered names the berth and the rewind', !!rec && rec.source === 'berth'
    && rec.rewindSeconds === expectRewind && rec.rewindSeconds >= 90, rec);
  pin('recovered lists the hold the dark kept', !!rec && Array.isArray(rec.lostCargo)
    && rec.lostCargo.length === 2 && rec.lostCargo.includes('14 rawOre') && rec.lostCargo.includes('5 refinedMetals')
    && rec.lostUnits === 19, rec);
  pin('the hull is back at the launch point with the berth hold',
    ctx.ship.object.position.x === 100 && ctx.ship.object.position.z === 700 && ctx.cargo.length === 0
      && Math.abs(ctx.world.time - launch.world.time) < 0.1, { pos: ctx.ship.object.position.toArray(), cargo: ctx.cargo, t: ctx.world.time });
  pin('the plan never used the mid-flight autosave', ctx.ship.object.position.x !== idle.ship.position[0]);
  const lines = commSince(m);
  pin('the comm receipts say where she went and what it cost',
    lines.includes('She limped home.')
      && lines.includes(`Rewound ${expectRewind} s to your last berth. Lost from the hold: 14 Raw ore, 5 Refined metals.`), lines);
  const ring = ctx.agent.events.filter((e) => e.type === 'recovered');
  const last = ring[ring.length - 1];
  pin('the session ring keeps the receipt', !!last && last.source === 'berth' && last.rewindSeconds === expectRewind
    && Array.isArray(last.lostCargo) && last.lostCargo.length === 2 && last.lostUnits === 19, last);
  pin('the throttle setpoint is zeroed on recovery', ctx.input.throttle === 0 && ctx.input.throttleHeld === false,
    [ctx.input.throttle, ctx.input.throttleHeld]);
  pin('the credits never moved', ctx.world.credits === launch.world.credits, [ctx.world.credits, launch.world.credits]);
}

// ---- 4. a death beyond the window restores the autosave --------------------
{
  // Fly out again from the launch point; a fresh idle autosave, then a long
  // silence (saves refused for the whole fight) before the death.
  ctx.ship.object.position.set(3000, 0, 0);
  ctx.cargo.push({ commodity: 'rawOre', units: 3 });
  tick(61 * 60, SAVE);
  const idle = stored(KEY);
  pin('fixture: a mid-flight autosave at 3000 u', !!idle && idle.berth !== true && idle.ship.position[0] === 3000, idle && idle.ship.position);
  ctx.ship.object.position.set(7000, 0, 0);
  tick(Math.round((BERTH_RECOVERY_WINDOW + 5) * 60), []);
  const deathAt = ctx.world.time;
  pin('the plan names the autosave beyond the window', readRecoveryPlan(ctx, deathAt).source === 'autosave');
  const m = mark();
  ctx.emit('playerDestroyed', {});
  tick(2, SAVE);
  pin('the overlay says the autosave', deathLine() === 'No UU charge. Credits, cargo, and hull return as they were at your last autosave.', deathLine());
  dom.dispatchKey('Enter');
  tick(2, SAVE_CTRL);
  const rec = since(m, 'recovered')[0];
  const expectRewind = Math.round(deathAt - idle.world.time);
  pin('recovered names the autosave with the rewind and no loss', !!rec && rec.source === 'autosave'
    && rec.rewindSeconds === expectRewind && rec.rewindSeconds > BERTH_RECOVERY_WINDOW
    && rec.lostCargo.length === 0 && rec.lostUnits === 0, rec);
  pin('the hull is back at the autosave point with its hold',
    ctx.ship.object.position.x === 3000 && ctx.cargo.length === 1 && ctx.cargo[0].units === 3, ctx.ship.object.position.toArray());
  pin('the comm receipt says the autosave and nothing lost',
    commSince(m).includes(`Rewound ${expectRewind} s to your last autosave. Nothing lost from the hold.`), commSince(m));
}

// ---- 5. fail closed -----------------------------------------------------------
{
  // (a) a berth mirror from another lineage: same shape, different savedAt.
  const idle = stored(KEY);
  const forged = { ...stored(BERTH_KEY), savedAt: idle.berthSavedAt + 1 };
  dom.store.set(BERTH_KEY, JSON.stringify(forged));
  tick(10 * 60, []);
  pin('a berth mirror from another lineage is refused', readRecoveryPlan(ctx, ctx.world.time).source === 'autosave');
  // (b) a berth mirror from the future of the autosave is refused.
  const future = { ...stored(BERTH_KEY), savedAt: idle.berthSavedAt, world: { ...idle.world, time: idle.world.time + 500 } };
  dom.store.set(BERTH_KEY, JSON.stringify(future));
  pin('a berth mirror ahead of the autosave is refused', readRecoveryPlan(ctx, ctx.world.time).source === 'autosave');
  // (c) a legacy autosave with no stamps.
  const legacy = { ...idle };
  delete legacy.berth;
  delete legacy.berthSavedAt;
  dom.store.set(KEY, JSON.stringify(legacy));
  dom.store.set(BERTH_KEY, JSON.stringify(stored(BERTH_KEY)));
  pin('a legacy autosave with no stamps restores as the autosave', readRecoveryPlan(ctx, ctx.world.time).source === 'autosave');
  // (d) no autosave at all: fresh, and the whole hold is the loss.
  dom.store.delete(KEY);
  ctx.cargo.length = 0;
  ctx.cargo.push({ commodity: 'livingRock', units: 2 });
  const m = mark();
  ctx.emit('playerDestroyed', {});
  tick(2, SAVE);
  pin('the overlay says fresh', deathLine() === 'No berth record. Credits stay. A starter hull waits at Freehold Drift.', deathLine());
  dom.dispatchKey('Enter');
  tick(2, SAVE_CTRL);
  const rec = since(m, 'recovered')[0];
  pin('a fresh start reports the whole hold as lost', !!rec && rec.source === 'fresh'
    && rec.lostCargo.length === 1 && rec.lostCargo[0] === '2 livingRock' && rec.lostUnits === 2, rec);
  pin('the fresh comm receipt', commSince(m).includes('No berth record. Lost from the hold: 2 Living rock.'), commSince(m));
  pin('a fresh start still lands at Freehold', ctx.world.currentSystem === 'freehold' && ctx.cargo.length === 0);
}

// ---- 6. clearAutosave --------------------------------------------------------
{
  const slots = ['rimward-save-v1-slot-1', 'rimward-save-v1-slot-2', 'rimward-save-v1-slot-3'];
  dom.store.set(KEY, '{"v":1,"world":{}}');
  dom.store.set(BERTH_KEY, '{"v":1,"world":{}}');
  for (const k of slots) dom.store.set(k, 'keep-berth');
  clearAutosave();
  pin('clearAutosave drops the autosave and its berth mirror', !dom.store.has(KEY) && !dom.store.has(BERTH_KEY));
  pin('clearAutosave keeps the manual slots', slots.every((k) => dom.store.get(k) === 'keep-berth'));
}

// ---- 7. the ring sanitizer -----------------------------------------------------
{
  const row = sanitizeEvent({ type: 'recovered', t: 3, source: 'berth', rewindSeconds: 117.6, lostUnits: 19,
    lostCargo: ['14 rawOre', '5 refinedMetals', 'junk', 42, '0 rawOre', '-3 rawOre', 'x'.repeat(200)], ship: {} });
  pin('the sanitizer keeps berth and the bounded receipt', !!row && row.source === 'berth' && row.rewindSeconds === 117
    && row.lostUnits === 19 && Array.isArray(row.lostCargo) && row.lostCargo.length === 2 && !Object.hasOwn(row, 'ship'), row);
  const bad = sanitizeEvent({ type: 'recovered', t: 4, source: 'god', rewindSeconds: -5, lostUnits: 'many', lostCargo: 'all' });
  pin('the sanitizer drops junk', !!bad && !Object.hasOwn(bad, 'source') && !Object.hasOwn(bad, 'rewindSeconds')
    && !Object.hasOwn(bad, 'lostUnits') && !Object.hasOwn(bad, 'lostCargo'), bad);
  const diff = lostCargoRows([{ commodity: 'rawOre', units: 5 }, { commodity: 'rawOre', units: 4 }], [{ commodity: 'rawOre', units: 6 }]);
  pin('the loss diff folds duplicate rows', diff.lostCargo.length === 1 && diff.lostCargo[0] === '3 rawOre' && diff.lostUnits === 3, diff);
  pin('the loss diff ignores gains', lostCargoRows([], [{ commodity: 'rawOre', units: 6 }]).lostUnits === 0);
  pin('fixture: the Freehold system def flies the freehold flag', SYSTEMS.freehold.faction === 'freehold');
}

console.log(fails === 0 ? `ISSUE 125 DEATH RECOVERY PASS` : `ISSUE 125 DEATH RECOVERY FAIL (${fails})`);
process.exit(fails === 0 ? 0 : 1);
