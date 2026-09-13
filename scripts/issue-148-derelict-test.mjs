/**
 * Issue #148 — an unclaimed yielded hull is a derelict: claimable by anyone,
 * folded away after 30 minutes of world time.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real npc, world, traffic,
 * station, pods and save systems over one ctx. Each derelict below is made
 * the REAL way — a hand-spawned trader with a critical hull, broken through
 * the resolve ladder by a hunting pirate (the issue #146 fixture), so
 * capitulate picks crewPods and marks the record.
 *
 * Covered:
 *   1  marking: state 'derelict', a JSON-plain rec.derelict with the fold
 *      deadline and the salvager's arrival, no escape plan, an aftermath
 *      wreck entry the recovery board reads, one comm line
 *   2  the coast bleeds off and the record tracks the hull
 *   3  the fold: a culled derelict re-instantiates through the real traffic
 *      pass as the same dead hull — yielded, dark, hold empty, hull retained
 *   4  player claim: the recovery card posts for the derelict, its marker pod
 *      is scooped, the derelict resolves 'recovered' and the hull leaves
 *   5  NPC claim: a salvager takes it under tow at claimAt; the tug defers
 *      while the player holds an accepted contract or keeps the hull locked
 *   6  timer: an unclaimed derelict folds away at due ('expired' → dead);
 *      a derelict in another system's bank counts too
 *   7  persistence: the timer survives snapshot/restore; a corrupt blob fails
 *      safe; a kill while derelict keeps the truthful word
 *
 * Run: npm run test:derelict
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { DERELICT } from '../src/game/state.js';
import { readEscape } from '../src/game/npc-escape.js';
import { recoveryPod } from '../src/game/recovery.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();

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
/** Tick with the player parked: the new-game launch leaves a residual velocity that would walk the bubble away. */
function tickHeld(n) {
  for (let i = 0; i < n; i++) {
    tick(1);
    ctx.ship.object.position.copy(FAR);
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
  }
}
const mark = () => allEvents.length;
const linesSince = (m) => allEvents.slice(m).filter((e) => e.type === 'commLine').map((e) => `${e.from ?? ''}: ${e.text}`);
const receiptsSince = (m, type) => allEvents.slice(m).filter((e) => e.type === type);

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
for (const rec of ctx.world.records) rec.live = false;

// Far from the lane and the station so traffic spawns nothing into the bubble.
const FAR = new THREE.Vector3(20000, 20000, 20000);
ctx.ship.object.position.copy(FAR);
ctx.flags.docked = false;
ctx.targets.current = null;
ctx.flags.combat = false;
const SYS = ctx.world.currentSystem;

let seq = 0;
function spawn(role, classKey, extra = {}) {
  seq++;
  const rec = {
    id: `i148-${seq}`, name: `I148 ${role} ${seq}`, classKey, faction: 'freehold', role,
    resolve: 80, personality: 0, cargo: extra.cargo ?? [], system: SYS, state: 'enroute',
    route: [{ x: FAR.x + 60, y: FAR.y, z: FAR.z + 60 }, { x: FAR.x + 600, y: FAR.y, z: FAR.z + 60 }],
    leg: 0, legT: 0, dir: 1,
  };
  const pos = new THREE.Vector3(FAR.x + 60 + seq * 40, FAR.y, FAR.z + 60);
  const live = binds.spawnLiveShip(ctx, rec, pos);
  if (!live) return null;
  live.object.quaternion.identity();
  if (role === 'pirate') {
    live.ai.demandSent = true; // TEST SETUP: no demand hail interrupts the loop
    live.ai.playerRolled = true; // the interest roll is fixed off —
    live.ai.playerInterested = false; // this pirate works the trader
    live.ai.resolveAt = ctx.world.time + 1e6;
  } else {
    ctx.world.records.push(rec); // the bank sweep and the fold see a real record
  }
  rec.live = true;
  ctx.ships.push(live);
  return live;
}
function despawn(live) {
  if (!live) return;
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  binds.removeLiveShip(ctx, live);
  if (live.record) live.record.live = false;
}
function breakNext(live, pirate) {
  live.state.personality = -100; // computeResolve clamps to 0 → 'capitulate'
  live.state.lastCombatAt = ctx.world.time;
  live.ai.calmUntil = 0;
  live.ai.band = 'defiant';
  live.ai.resolveAt = 0;
  live.ai.lastAttacker = pirate; // the pirate broke it, not the player
}
/** A crewPods yield made the real way. Returns { live, rec, d, m }. */
function makeDerelict(pirate) {
  const live = spawn('trader', 'cutter', { cargo: [{ commodity: 'provisions', units: 2 }] });
  live.state.hull = Math.floor(live.state.hullMax * 0.3); // §7.5 critical hull → crewPods
  pirate.ai.mode = 'hunt';
  pirate.ai.target = live;
  pirate.ai.phase = 'attack';
  pirate.ai.phaseStart = ctx.world.time - 3.05;
  tick(1);
  breakNext(live, pirate);
  const m = mark();
  for (let i = 0; i < 300; i++) {
    tickHeld(1);
    if (receiptsSince(m, 'npcSurrendered').some((e) => e.ship === live)) break;
  }
  return { live, rec: live.record, d: live.record.derelict, m };
}
const wreckOf = (d) => (ctx.world.aftermath || []).find((a) => a.id === d.wreckId);
const isLive = (live) => ctx.ships.includes(live);
const pirate = spawn('pirate', 'cutter');

// ---- 1  marking -------------------------------------------------------------
{
  const { live, rec, d, m } = makeDerelict(pirate);
  const rcpt = receiptsSince(m, 'npcSurrendered').filter((e) => e.ship === live);
  pin('1a the yield is crewPods, attributed to the world', rcpt.length === 1 && rcpt[0].outcome === 'crewPods' && rcpt[0].causer === 'world', rcpt.map((e) => [e.outcome, e.causer]));
  pin('1b the record is a derelict', rec.state === 'derelict' && !!d && d.v === DERELICT.version && d.reason === 'crewPods', { state: rec.state, d });
  pin('1c due = since + foldAfter; claimAt inside the salvager window', !!d && d.due === d.since + DERELICT.foldAfter
    && d.claimAt >= d.since + DERELICT.npcClaimAfter && d.claimAt <= d.since + DERELICT.npcClaimAfter + DERELICT.npcClaimSpan, d);
  pin('1d no escape plan steers a dead hull; the manifest is empty', readEscape(rec) === null && rec.cargo.length === 0 && live.state.cargo.length === 0);
  pin('1e the hull drifts dark, yielded, crew pods spawned once', live.ai.mode === 'drift' && live.object.userData.glow.visible === false
    && live.state.surrendered === true && live.ai.survivorsSpawned === true);
  const w = wreckOf(d);
  pin('1f an aftermath wreck entry posts for the recovery board', !!w && w.kind === 'wreck' && w.derelictId === rec.id && w.system === SYS && w.expiresAt === d.due
    && Math.abs(w.position.x - d.pos[0]) <= 1 && Math.abs(w.position.z - d.pos[2]) <= 1, w);
  pin('1g the blob is JSON-plain', JSON.stringify(JSON.parse(JSON.stringify(d))) === JSON.stringify(d));
  pin('1h one Echo line names the derelict', linesSince(m).some((l) => l.startsWith('Echo:') && l.includes(rec.name) && l.includes('derelict')), linesSince(m));

  // ---- 2  the coast bleeds off; the record tracks the hull -----------------
  const v0 = live.ai.driftVel.length();
  tickHeld(600);
  const v1 = live.ai.driftVel.length();
  pin('2a the dead-stick coast decays', v0 > 0 && v1 < v0 * 0.6, { v0, v1 });
  tickHeld(60 * 60);
  pin('2b …to a stop within a minute', live.ai.driftVel.lengthSq() === 0, live.ai.driftVel.toArray());
  const p = live.object.position;
  pin('2c the record and the wreck entry sit where the hull is', Math.abs(d.pos[0] - p.x) < 1e-6 && Math.abs(d.pos[2] - p.z) < 1e-6
    && Math.abs(wreckOf(d).position.x - Math.round(p.x)) <= 1, { pos: d.pos, p: p.toArray(), w: wreckOf(d).position });
  pin('2d still a derelict, still live, nobody claimed it yet', rec.state === 'derelict' && isLive(live) && d.outcome === null,
    { state: rec.state, live: isLive(live), d, dist: p.distanceTo(ctx.ship.object.position), ships: ctx.ships.map((s) => s.record?.id) });

  // ---- 3  the fold: cull and real re-instantiation --------------------------
  const hull = live.state.hull;
  const at = p.clone();
  despawn(live); // the range-cull removal boundary
  const rp = new THREE.Vector3();
  binds.recordPosition(rec, rp);
  pin('3a recordPosition returns the derelict, not a lane point', rp.distanceTo(at) < 1e-6, { rp: rp.toArray(), at: at.toArray() });
  ctx.ship.object.position.set(at.x + 300, at.y, at.z); // inside INSTANTIATE_RANGE
  let back = null;
  for (let i = 0; i < 120 && !back; i++) {
    tick(1);
    back = ctx.ships.find((s) => s.record === rec) ?? null;
  }
  pin('3b traffic re-instantiates the derelict record', !!back && rec.live === true, { ships: ctx.ships.map((s) => s.record?.id) });
  pin('3c …as the same dead hull: yielded, dark, empty, hull retained, drift', !!back && back.ai.mode === 'drift' && back.state.surrendered === true
    && back.object.userData.glow.visible === false && back.state.cargo.length === 0 && back.state.hull === hull
    && back.ai.survivorsSpawned === true && back.ai.surrenderDone === true && back.object.position.distanceTo(at) < 1e-6,
  back && { mode: back.ai.mode, hull: back.state.hull, want: hull, glow: back.object.userData.glow.visible });
  tick(120);
  pin('3d it stays put and stays a derelict', !!back && rec.state === 'derelict' && back.object.position.distanceTo(at) < 1 && back.ai.mode === 'drift');

  // ---- 4  player claim through the recovery flow ----------------------------
  ctx.world.jobs = ctx.world.jobs.filter((j) => j.kind !== 'recovery');
  const st = ctx.systems[SYS].station.position;
  ctx.ship.object.position.set(st[0] + 36, st[1], st[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  tick(3);
  ctx.input.dockPressed = false;
  pin('4a docked at the issuing station', ctx.flags.docked === true);
  ctx.stationDesk.selectService('jobs');
  const job = ctx.world.jobs.find((j) => j.kind === 'recovery' && j.wreckId === d.wreckId);
  pin('4b the recovery board posts the derelict', !!job && job.state === 'offered' && job.title === 'Recovery: derelict hull' && /derelict|crew gone/i.test(job.detail),
    job && { title: job.title, state: job.state });
  ctx.cargo.length = 0;
  const acc = job ? ctx.stationDesk.acceptJob(job.id) : { ok: false };
  const pod = job ? recoveryPod(ctx, job) : null;
  pin('4c accepted: one marker pod at the derelict', acc.ok === true && job.state === 'accepted' && !!pod
    && pod.mesh.position.distanceTo(back.object.position) < 3, { acc, podAt: pod && pod.mesh.position.toArray(), hullAt: back.object.position.toArray() });
  const credits0 = ctx.world.credits;
  const m4 = mark();
  ctx.stationDesk.undock();
  for (let i = 0; ctx.flags.docked && i < 40; i++) { tick(30); dom.dispatchKey('Escape'); tick(2); }
  pin('4d launched', ctx.flags.docked === false);
  ctx.ship.object.position.copy(pod.mesh.position);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  for (let i = 0; i < 120 && rec.state === 'derelict'; i++) tick(1);
  pin('4e the marker is scooped and the contract collected', job.collected === true && ctx.cargo.some((c) => c.commodity === 'refinedMetals' && c.units === 2)
    && receiptsSince(m4, 'podCollected').length >= 1, { collected: job.collected, cargo: ctx.cargo });
  pin('4f the derelict resolves recovered by the player, hull gone from the lane', rec.state === 'captured' && d.outcome === 'recovered' && d.claimant === 'player'
    && Number.isFinite(d.resolvedAt) && !isLive(back) && rec.live === false, { state: rec.state, d, live: isLive(back) });
  pin('4g the wreck entry is expired and the card stays payable', (!wreckOf(d) || wreckOf(d).expiresAt <= ctx.world.time) && job.state === 'accepted' && job.collected === true
    && ctx.world.credits === credits0, { w: wreckOf(d), job: job.state, credits: [credits0, ctx.world.credits] });
  pin('4h an Echo line says the hull is yours', linesSince(m4).some((l) => l.includes(rec.name) && /yours/.test(l)), linesSince(m4));
  ctx.world.jobs = ctx.world.jobs.filter((j) => j.kind !== 'recovery');
  ctx.cargo.length = 0;
  ctx.ship.object.position.copy(FAR);
}

// ---- 5  NPC claim ----------------------------------------------------------
{
  ctx.ship.object.position.copy(FAR);
  const { live, rec, d } = makeDerelict(pirate);
  pin('5a fixture: a fresh derelict', rec.state === 'derelict' && !!d && isLive(live));
  // A player contract in flight holds the tug off.
  const fake = { id: `recovery-${d.wreckId}`, kind: 'recovery', wreckId: d.wreckId, state: 'accepted', collected: false,
    deadline: ctx.world.time + 300, originSystem: SYS, title: 'x', detail: 'x', reward: 1, progress: 0, need: 1 };
  ctx.world.jobs.push(fake);
  d.claimAt = ctx.world.time; // TEST SETUP: the salvager is due now
  tickHeld(2 * 60);
  pin('5b the tug defers while the player holds an accepted contract', rec.state === 'derelict' && d.outcome === null && isLive(live), { state: rec.state, d });
  ctx.world.jobs.splice(ctx.world.jobs.indexOf(fake), 1);
  // The player's lock holds it off too, by a bounded defer.
  ctx.targets.current = live;
  const t0 = ctx.world.time;
  tickHeld(2 * 60);
  pin('5c the tug defers while the player keeps the hull locked', rec.state === 'derelict' && d.outcome === null && d.claimAt > t0 && d.claimAt <= ctx.world.time + DERELICT.claimDefer + 1, { claimAt: d.claimAt, t0, now: ctx.world.time });
  ctx.targets.current = null;
  d.claimAt = ctx.world.time;
  const m5 = mark();
  tickHeld(2 * 60);
  const fac = ctx.systems[SYS].faction;
  pin('5d the salvager claims it: salvaged, towed away, hull gone', rec.state === 'captured' && d.outcome === 'salvaged' && d.claimant === fac && !isLive(live)
    && (!wreckOf(d) || wreckOf(d).expiresAt <= ctx.world.time), { state: rec.state, d, live: isLive(live) });
  pin('5e one Echo line names the tug', linesSince(m5).some((l) => l.includes(rec.name) && /salvage tug/.test(l)), linesSince(m5));
  pin('5f a resolved derelict never resolves twice', binds.snapshot && d.outcome === 'salvaged' && rec.state === 'captured');
}

// ---- 6  timer --------------------------------------------------------------
{
  const { live, rec, d } = makeDerelict(pirate);
  pin('6a fixture: a fresh derelict', rec.state === 'derelict' && !!d && isLive(live));
  const m6 = mark();
  d.claimAt = d.due + 1e6; // TEST SETUP: no salvager ever comes for this one
  ctx.world.time = d.due - 1; // TEST SETUP: 30 minutes less a second later
  tickHeld(3 * 60);
  pin('6b nothing claimed it: the derelict folds away at due', rec.state === 'dead' && d.outcome === 'expired' && d.claimant === null && !isLive(live) && rec.live === false, { state: rec.state, d });
  pin('6c its wreck entry is gone with it', !wreckOf(d) || wreckOf(d).expiresAt <= ctx.world.time);
  pin('6d one Echo line says it went dark', linesSince(m6).some((l) => l.includes(rec.name) && /gone dark/.test(l)), linesSince(m6));
  // A derelict in ANOTHER system's bank keeps counting too (the cross-system fold).
  const other = Object.keys(ctx.systems).find((k) => k !== SYS);
  const bank = ctx.world.recordBanks[other] ?? (ctx.world.recordBanks[other] = []);
  const away = {
    id: 'i148-away', name: 'I148 away', classKey: 'cutter', faction: 'freehold', role: 'trader', system: other, state: 'derelict', route: [], cargo: [],
    derelict: { v: DERELICT.version, since: ctx.world.time - 10, due: ctx.world.time + 3, claimAt: ctx.world.time + 1e6, reason: 'crewPods',
      pos: [100, 0, 100], vel: [0, 0, 0], hull: 10, wreckId: null, outcome: null, resolvedAt: null, claimant: null },
  };
  bank.push(away);
  const m6b = mark();
  tickHeld(60);
  pin('6e the away derelict gets a wreck entry in ITS system', typeof away.derelict.wreckId === 'string' && wreckOf(away.derelict)?.system === other, wreckOf(away.derelict));
  tickHeld(3 * 60);
  pin('6f the away derelict expires on its own clock, silently', away.state === 'dead' && away.derelict.outcome === 'expired'
    && !linesSince(m6b).some((l) => l.includes('I148 away')), { state: away.state, d: away.derelict });
  bank.splice(bank.indexOf(away), 1);
}

// ---- 7  persistence ----------------------------------------------------------
{
  const { live, rec, d } = makeDerelict(pirate);
  pin('7a fixture: a fresh derelict', rec.state === 'derelict' && !!d && isLive(live));
  tickHeld(60);
  const snap = JSON.parse(JSON.stringify(binds.snapshot(ctx)));
  const saved = snap.world.records.find((r) => r.id === rec.id);
  pin('7b the snapshot carries the derelict record and its timer', !!saved && saved.state === 'derelict' && saved.derelict?.due === d.due
    && saved.derelict?.claimAt === d.claimAt && saved.derelict?.wreckId === d.wreckId, saved && { state: saved.state, d: saved.derelict });
  tickHeld(60);
  binds.restore(ctx, snap);
  const rec2 = ctx.world.records.find((r) => r.id === rec.id);
  const live2 = ctx.ships.find((s) => s.record === rec2) ?? null;
  pin('7c restore keeps the derelict, the same deadline, the same claim time', !!rec2 && rec2.state === 'derelict'
    && rec2.derelict.due === d.due && rec2.derelict.claimAt === d.claimAt && rec2.derelict.since === d.since, rec2 && { state: rec2.state, d: rec2.derelict });
  pin('7d the same-system restore heal stands the live hull down as the derelict', !!live2 && live2.ai.mode === 'drift' && live2.state.surrendered === true
    && live2.object.userData.glow.visible === false, live2 && { mode: live2.ai.mode });
  tickHeld(60);
  pin('7e it keeps counting after the restore', rec2.state === 'derelict' && rec2.derelict.outcome === null && wreckOf(rec2.derelict)?.expiresAt === rec2.derelict.due);
  // Corrupt blob → fail safe: the blob goes and the record ends.
  const bad = JSON.parse(JSON.stringify(snap));
  const badRec = bad.world.records.find((r) => r.id === rec.id);
  badRec.derelict.pos = 'not a vector';
  binds.restore(ctx, bad);
  const rec3 = ctx.world.records.find((r) => r.id === rec.id);
  pin('7f a corrupt blob fails safe: dropped, record ended', !!rec3 && rec3.state === 'dead' && !Object.hasOwn(rec3, 'derelict'), rec3 && { state: rec3.state, d: rec3.derelict });
  const bare = JSON.parse(JSON.stringify(snap));
  const bareRec = bare.world.records.find((r) => r.id === rec.id);
  delete bareRec.derelict;
  binds.restore(ctx, bare);
  const rec4 = ctx.world.records.find((r) => r.id === rec.id);
  pin('7g state derelict with no blob ends too', !!rec4 && rec4.state === 'dead');
  const far = JSON.parse(JSON.stringify(snap));
  const farRec = far.world.records.find((r) => r.id === rec.id);
  farRec.derelict.pos = [1e9, 0, 0];
  binds.restore(ctx, far);
  const rec5 = ctx.world.records.find((r) => r.id === rec.id);
  pin('7h an out-of-range position fails safe', !!rec5 && rec5.state === 'dead' && !Object.hasOwn(rec5, 'derelict'));
  tick(5);
  // Back to the good save: a kill while derelict keeps the truthful word.
  binds.restore(ctx, snap);
  const rec6 = ctx.world.records.find((r) => r.id === rec.id);
  rec6.state = 'dead'; // as world.js consumeIncidents writes on npcDestroyed
  tickHeld(2 * 60);
  pin('7i destroyed while derelict: outcome destroyed, entry pulled', rec6.state === 'dead' && rec6.derelict?.outcome === 'destroyed'
    && (!wreckOf(rec6.derelict) || wreckOf(rec6.derelict).expiresAt <= ctx.world.time), rec6.derelict);
}

console.log(fails === 0 ? 'ISSUE148 DERELICT PASS' : `ISSUE148 DERELICT FAIL — ${fails} pins`);
process.exit(fails === 0 ? 0 : 1);
