/**
 * Issue #325 — an ENGAGE combat lease finishes the bound quarry of an accepted
 * war contract, and that kill is lawful work.
 *
 * The #250 playtest: a war-veridian-2 'Strike Watchful Apt' engagement disabled
 * its bound Freehold patrol at 15% hull, the combat lease then ended
 * 'target-disabled' (and setCombatIntent refuses a disabled target), so a
 * driver that only used combat intents could never land the witnessed kill the
 * strike pays on. Both accepted war jobs lapsed unpaid. The fix keeps every
 * #61/#265 ending for other hulls and a disable intent, and lets an ENGAGE
 * lease on the accepted contract's bound quarry keep firing through the
 * disabled/surrendered state until it is destroyed; the kill is exempt from
 * the atrocity/feral gate and the killedSurrendered fear bump, the same #265
 * decision already applied to a bound hunt.
 *
 * Synthetic checks use the #61 combat-lease fixture (real controls + public
 * v2 dispatcher) with disclosed war job rows. The real-system check boots the
 * full game, loads the war dest bank, accepts a real offered war row at the
 * Freehold board, spawns its bound patrol (the disclosed dest-faction patrol
 * flying into Freehold space), stamps the break the guns land, and runs the
 * combat.js witness shape (npcHit then npcDestroyed) so world.js attributes
 * the kill to the player and the war settlement pays.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-325-war-quarry-overkill-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState, ECON } from '../src/game/state.js';
import { localDir } from '../src/game/agent-schema.js';
import { isWarQuarry } from '../src/game/prize.js';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';

let checks = 0;
async function check(label, fn) {
  await fn();
  checks++;
  console.log('PASS', label);
}

const warJob = (recordId, state) => ({
  id: 'war-fixture-0', kind: 'war', slot: 0, originSystem: 'fixture',
  destSystem: 'other', recordId, target: 'Fixture Patrol', state,
});

/** The #61 combat-lease fixture, with a disclosed war job row. */
function fixture(opts = {}) {
  installDomStubs();
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 5000) };
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3();
  ctx.ship.speed = 80;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  const recordId = opts.recordId ?? 'combat-fixture';
  const target = { id: recordId, record: { id: recordId }, object: new THREE.Object3D(), state: createShipState('light') };
  target.object.position.set(0, 0, -300);
  ctx.ships = [target]; ctx.targets.current = target;
  ctx.world.jobs = opts.job ? [opts.job] : [];
  if (opts.disabled) target.state.disabled = true;
  if (opts.surrendered) target.state.surrendered = true;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  function sample(extra = {}) {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time,
      weaponGroup: ctx.input.weaponGroup, dist: p.distanceTo(o), speed: 80, closing: 0,
      bearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z), ...extra };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const start = (args = {}) => act('setCombatIntent', { seq: ++seq, ttl: 45, targetId: target.id, intent: 'engage', ...args });
  const status = () => agentControlStatus(ctx);
  const tick = (seconds = 1 / 60, fresh = true) => {
    ctx.world.time += seconds;
    if (fresh) sample();
    controls.update(seconds);
  };
  return { ctx, target, recordId, act, start, status, tick, sample };
}

// ---------------------------------------------------------------------------
// 0. isWarQuarry is record-id precise and fails closed.
// ---------------------------------------------------------------------------
await check('isWarQuarry binds only an accepted war row by record id and fails closed', () => {
  assert.equal(isWarQuarry({}, { id: 'rec-1' }), false, 'missing world/jobs fails closed');
  assert.equal(isWarQuarry({ world: {} }, { id: 'rec-1' }), false, 'missing jobs array fails closed');
  assert.equal(isWarQuarry({ world: { jobs: 'nope' } }, { id: 'rec-1' }), false, 'non-array jobs fails closed');
  assert.equal(isWarQuarry({ world: { jobs: [] } }, null), false, 'missing rec fails closed');
  assert.equal(isWarQuarry({ world: { jobs: [] } }, { id: 7 }), false, 'non-string id fails closed');
  const jobs = (state, kind = 'war') => ({ world: { jobs: [{ kind, state, recordId: 'rec-1' }] } });
  assert.equal(isWarQuarry(jobs('accepted'), { id: 'rec-1' }), true, 'an accepted war row binds');
  assert.equal(isWarQuarry(jobs('offered'), { id: 'rec-1' }), false, 'an offered posting is not a bind');
  assert.equal(isWarQuarry(jobs('failed'), { id: 'rec-1' }), false, 'a lapsed/failed row stops marking');
  assert.equal(isWarQuarry(jobs('accepted', 'hunt'), { id: 'rec-1' }), false, 'a hunt row is a different bind');
  assert.equal(isWarQuarry(jobs('accepted'), { id: 'rec-2' }), false, 'another record is not bound');
});

// ---------------------------------------------------------------------------
// A. An ENGAGE lease on the bound accepted war quarry finishes the kill.
// ---------------------------------------------------------------------------
await check('A1 an engage lease keeps firing through the bound war quarry disabled', () => {
  const f = fixture({ job: warJob('combat-fixture', 'accepted') });
  assert.equal(f.start().ok, true, 'the engage lease grants on the intact bound quarry');
  f.tick();
  assert.equal(f.status().owner, 'combat');
  f.target.state.disabled = true;
  f.tick();
  const s = f.status();
  assert.equal(s.owner, 'combat', 'the lease survives the disable');
  assert.equal(s.state, 'active', 'the lease is still active');
  assert.equal(s.reason, '', 'no terminal reason at the break');
  assert.notEqual(s.combat.fireBlocked, 'target-disabled', 'fire is not blocked by the break');
  assert.equal(f.ctx.input.fireHeld, true, 'the lease keeps firing at the broken hull');
});

await check('A2 an engage lease stays active when the bound war quarry surrenders', () => {
  const f = fixture({ job: warJob('combat-fixture', 'accepted') });
  assert.equal(f.start().ok, true);
  f.tick();
  f.target.state.surrendered = true;
  f.tick();
  const s = f.status();
  assert.equal(s.owner, 'combat', 'the lease survives the surrender');
  assert.equal(s.reason, '', 'no terminal reason at the yield');
});

await check('A3 the engage lease ends target-destroyed only when the hull is destroyed', () => {
  const f = fixture({ job: warJob('combat-fixture', 'accepted') });
  assert.equal(f.start().ok, true);
  f.tick();
  f.target.state.disabled = true;
  f.tick();
  f.target.state.surrendered = true;
  f.tick();
  assert.equal(f.status().owner, 'combat', 'still flying through the broken state');
  f.target.state.destroyed = true;
  f.tick();
  assert.equal(f.status().owner, 'none');
  assert.equal(f.status().reason, 'target-destroyed');
});

// ---------------------------------------------------------------------------
// B. Without an accepted war bind, every #61 ending is unchanged.
// ---------------------------------------------------------------------------
await check('B1 a disabled hull without an accepted war bind ends target-disabled', () => {
  const f = fixture();
  assert.equal(f.start().ok, true);
  f.tick();
  f.target.state.disabled = true;
  f.tick();
  assert.equal(f.status().reason, 'target-disabled');
});

await check('B2 an OFFERED war posting is not a bind: a disabled hull still ends target-disabled', () => {
  const f = fixture({ job: warJob('combat-fixture', 'offered') });
  assert.equal(f.start().ok, true);
  f.tick();
  f.target.state.disabled = true;
  f.tick();
  assert.equal(f.status().reason, 'target-disabled');
});

await check('B3 a surrendered hull without an accepted war bind ends target-surrendered', () => {
  const f = fixture();
  assert.equal(f.start().ok, true);
  f.tick();
  f.target.state.surrendered = true;
  f.tick();
  assert.equal(f.status().reason, 'target-surrendered');
});

await check('B4 a destroyed hull ends target-destroyed', () => {
  const f = fixture();
  assert.equal(f.start().ok, true);
  f.tick();
  f.target.state.destroyed = true;
  f.tick();
  assert.equal(f.status().reason, 'target-destroyed');
});

// ---------------------------------------------------------------------------
// C. A DISABLE intent keeps the state endings it asked for.
// ---------------------------------------------------------------------------
await check('C1 a disable intent on the bound war quarry still ends target-disabled', () => {
  const f = fixture({ job: warJob('combat-fixture', 'accepted') });
  assert.equal(f.start({ intent: 'disable' }).ok, true);
  f.tick();
  f.target.state.disabled = true;
  f.tick();
  assert.equal(f.status().reason, 'target-disabled');
});

await check('C2 a disable intent on the bound war quarry still ends target-surrendered', () => {
  const f = fixture({ job: warJob('combat-fixture', 'accepted') });
  assert.equal(f.start({ intent: 'disable' }).ok, true);
  f.tick();
  f.target.state.surrendered = true;
  f.tick();
  assert.equal(f.status().reason, 'target-surrendered');
});

// ---------------------------------------------------------------------------
// D. Acquisition and renewal on an already-broken bound war quarry.
// ---------------------------------------------------------------------------
await check('D1 engage on an already-disabled bound war quarry is accepted', () => {
  const f = fixture({ job: warJob('combat-fixture', 'accepted'), disabled: true });
  const r = f.start();
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(f.status().owner, 'combat');
});

await check('D2 engage on an already-disabled bystander refuses target-disabled', () => {
  const f = fixture({ disabled: true });
  assert.equal(f.start().token, 'target-disabled');
});

await check('D3 disable on an already-disabled bound war quarry still refuses target-disabled', () => {
  const f = fixture({ job: warJob('combat-fixture', 'accepted'), disabled: true });
  assert.equal(f.start({ intent: 'disable' }).token, 'target-disabled');
});

await check('D4 a live engage renewal is accepted while the bound war quarry is disabled', () => {
  const f = fixture({ job: warJob('combat-fixture', 'accepted') });
  assert.equal(f.start().ok, true);
  f.tick();
  f.target.state.disabled = true;
  f.tick();
  assert.equal(f.status().owner, 'combat');
  const r = f.start({ seq: 2, ttl: 45 });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(f.status().owner, 'combat');
  assert.equal(f.status().seq, 2);
});

// ---------------------------------------------------------------------------
// E. Real systems: the bound war quarry kill is lawful and the strike pays.
// ---------------------------------------------------------------------------
let dom, ctx, systems, binds;
let frame = 0;

function step(seconds = 1) {
  const dt = 1 / 60;
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    frame++;
    ctx.elapsed += dt;
    ctx.world.time += dt;
    for (const [, s] of systems) {
      try { s?.update?.(dt, ctx); } catch { /* one frame's error must not stop the probe */ }
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
  systems.find(([n]) => n === 'world')[1].update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  const station = systems.find(([n]) => n === 'station')[1];
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, 'docked at ' + id);
}

const nodesIn = (root) => [...dom.walkDom(root)];
const byClass = (cls) => [...dom.walkDom(document.body)].filter((n) => String(n.className).split(' ').includes(cls));
const cardForTitle = (fragment) => byClass('job-card').find((card) =>
  nodesIn(card).some((n) => String(n.className).split(' ').includes('job-title') && String(n.textContent).includes(fragment)));

/**
 * The combat.js finishing blow, replayed as the witness shape: npcHit marks
 * the hull as player-hit, then the destroyed state and npcDestroyed emit (the
 * same primitives combat.js publishes) so world.js's incident pass attributes
 * the kill to the player. No scene render, no laser math.
 */
function finishHull(live) {
  ctx.emit('npcHit', { ship: live, damage: live.state.hull });
  live.state.destroyed = true;
  ctx.emit('npcDestroyed', { ship: live });
  step(2 / 60);
}

let warDest = null;

await check('E0 the real game boots with the war dest bank loaded', async () => {
  seedBootRandom();
  dom = installDomStubs();
  const booted = await bootGameSystems();
  ctx = booted.ctx; systems = booted.systems; binds = booted.binds;
  for (const el of nodesIn(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
  dom.dispatchKey('Digit1');
  ctx.flags.paused = false;
  ctx.flags.combat = false;
  ctx.agent.optIn = true;
  ctx.world.credits = 200000;
  // The war settlement's dest bind: first gate to a different faction's dock.
  const freeholdFac = ctx.systems.freehold.faction;
  warDest = (ctx.systems.freehold.gates ?? []).find((g) => g && g.to && g.to !== 'freehold'
    && ctx.systems[g.to] && ctx.systems[g.to].station
    && ctx.systems[g.to].faction && ctx.systems[g.to].faction !== freeholdFac)?.to;
  assert.ok(warDest, 'freehold has a war dest bind');
  // Load the dest bank first, then the origin bank (the war boot-test staging).
  dock(warDest);
  dock('freehold');
  assert.ok(Array.isArray(ctx.world.recordBanks?.[warDest]) && ctx.world.recordBanks[warDest].length > 0,
    'the war dest bank exists: ' + JSON.stringify(Object.keys(ctx.world.recordBanks ?? {})));
});

await check('E1 the Freehold Jobs board posts an offered war row', () => {
  ctx.stationDesk.selectService('jobs');
  step(1 / 60);
  const offered = ctx.world.jobs.filter((j) => j && j.kind === 'war' && j.originSystem === 'freehold'
    && j.state === 'offered');
  assert.ok(offered.length >= 1, 'a war row is posted: ' + JSON.stringify(ctx.world.jobs.filter((j) => j.kind === 'war')));
});

let acceptedWar = null;

await check('E2 accepting the war row binds its record and stamps the quoted pay', () => {
  const card = cardForTitle('Strike ');
  assert.ok(card, 'a war card renders');
  const acceptBtn = nodesIn(card).find((n) => String(n.tagName) === 'BUTTON' && /^Accept \(/.test(String(n.textContent)));
  assert.ok(acceptBtn, 'the card carries an Accept button');
  acceptBtn.click();
  acceptedWar = ctx.world.jobs.find((j) => j && j.kind === 'war' && j.originSystem === 'freehold'
    && j.state === 'accepted');
  assert.ok(acceptedWar && acceptedWar.recordId, 'the war row accepted with a bound record: ' + JSON.stringify(acceptedWar));
  assert.equal(typeof acceptedWar.recordId, 'string', 'the bind is a record id');
  assert.ok(Number.isFinite(acceptedWar.payQuoted) && acceptedWar.payQuoted > 0,
    'the agreement stamps payQuoted: ' + acceptedWar.payQuoted);
});

let boundRec = null;
let boundLive = null;
let fearBefore = 0;

await check('E3 the bound war quarry kill is lawful: no atrocity/feral, no killedSurrendered fear', async () => {
  // Undock through the real Launch path, retrying a fouled lane.
  for (let i = 0; i < 20 && ctx.flags.docked; i++) {
    ctx.stationDesk.undock();
    if (!ctx.flags.docked) break;
    step(0.5);
  }
  assert.equal(ctx.flags.docked, false, 'undocked at Freehold');
  boundRec = (ctx.world.recordBanks?.[warDest] ?? []).find((r) => r && r.id === acceptedWar.recordId);
  assert.ok(boundRec, 'the bound record resolves in the dest bank');
  await binds.primeShipAsset(boundRec.faction, boundRec.classKey, boundRec.role);
  const p = ctx.ship.object.position;
  boundLive = binds.spawnLiveShip(ctx, boundRec, { x: p.x + 140, y: p.y, z: p.z });
  assert.ok(boundLive, 'the bound patrol instantiated');
  if (!ctx.ships.includes(boundLive)) ctx.ships.push(boundLive);
  // FIXTURE (initial state): the break the guns land — low hull, disabled and
  // yielded. The finishing blow runs the real witness path below.
  boundLive.state.hull = Math.max(1, boundLive.state.hullMax * 0.15);
  boundLive.state.disabled = true;
  boundLive.state.surrendered = true;
  fearBefore = ctx.world.fear;
  finishHull(boundLive);
  const sawAtrocity = [...ctx.lastEvents, ...ctx.events].some((e) => e.type === 'atrocity');
  assert.ok(!sawAtrocity, 'no atrocity event for the bound contract kill');
  assert.notEqual(ctx.bio.mood, 'feral', 'the companion does not rage');
  assert.equal(ctx.world.fear, fearBefore, 'no killedSurrendered fear for the bound contract kill');
  assert.equal(boundRec.state, 'dead', 'the record settles dead');
  const incident = (ctx.world.incidents ?? []).find((i) => i && i.kind === 'destroyed'
    && i.name === boundRec.name && i.causer === 'player');
  assert.ok(incident, 'a player-caused destroyed incident is recorded: ' + JSON.stringify((ctx.world.incidents ?? []).slice(-3)));
});

let creditsBefore = 0, empBefore = 0, tgtBefore = 0;

await check('E4 the war settlement pays the strike inside the delivery tick', () => {
  const employerFac = ctx.systems.freehold.faction;
  const targetFac = ctx.systems[warDest].faction;
  ctx.world.reputation ??= {};
  creditsBefore = ctx.world.credits;
  empBefore = ctx.world.reputation[employerFac] ?? 0;
  tgtBefore = ctx.world.reputation[targetFac] ?? 0;
  const pay = acceptedWar.payQuoted;
  let settled = false;
  for (let i = 0; i < 80 && !settled; i++) {
    step(0.5);
    const row = ctx.world.jobs.find((j) => j && j.id === acceptedWar.id);
    settled = (!row || row.state !== 'accepted') && ctx.world.credits >= creditsBefore + pay;
  }
  assert.ok(settled, 'the strike paid within the delivery tick: ' + JSON.stringify({
    credits: ctx.world.credits, pay, row: ctx.world.jobs.find((j) => j && j.id === acceptedWar.id),
  }));
  assert.equal(ctx.world.credits, creditsBefore + pay, 'credits rise by payQuoted');
  assert.equal(ctx.world.reputation[employerFac] ?? 0, empBefore + 2, 'employer standing +2');
  assert.equal(ctx.world.reputation[targetFac] ?? 0, tgtBefore - 2, 'target standing -2');
  assert.ok(!ctx.world.jobs.some((j) => j && j.id === acceptedWar.id && j.state === 'accepted'),
    'the accepted row leaves the board');
  const replacement = ctx.world.jobs.some((j) => j && j.kind === 'war' && j.originSystem === 'freehold'
    && j.slot === acceptedWar.slot && j.state === 'offered' && j.id !== acceptedWar.id);
  assert.ok(replacement || !ctx.world.jobs.some((j) => j && j.id === acceptedWar.id),
    'a replacement card fills the slot (or the settled row is gone)');
});

await check('E5 a bystander disabled kill still ferals and emits atrocity', () => {
  const bound = new Set(ctx.world.jobs.filter((j) => j && j.kind === 'war' && j.state === 'accepted').map((j) => j.recordId));
  const banks = Object.values(ctx.world.recordBanks ?? {}).flat();
  const bystander = banks.find((r) => r && r.role === 'patrol' && r.state !== 'dead' && r.state !== 'captured'
    && r.classKey !== 'ace' && !bound.has(r.id) && !ctx.ships.some((s) => s && s.record === r));
  assert.ok(bystander, 'an unbound patrol exists');
  const p = ctx.ship.object.position;
  const live = binds.spawnLiveShip(ctx, bystander, { x: p.x + 260, y: p.y, z: p.z });
  assert.ok(live, 'the bystander instantiated');
  if (!ctx.ships.includes(live)) ctx.ships.push(live);
  live.state.hull = Math.max(1, live.state.hullMax * 0.15);
  live.state.disabled = true;
  finishHull(live);
  const sawAtrocity = [...ctx.lastEvents, ...ctx.events].some((e) => e.type === 'atrocity');
  assert.ok(sawAtrocity, 'atrocity fires for a disabled bystander');
  assert.equal(ctx.bio.mood, 'feral', 'the companion rages at the bystander kill');
});

await check('E6 records and jobs stay JSON-plain with no new persisted field', () => {
  const jobs = JSON.parse(JSON.stringify(ctx.world.jobs));
  assert.ok(Array.isArray(jobs), 'jobs snapshot JSON-safe');
  for (const j of jobs) {
    if (j && j.kind === 'war') {
      assert.equal(typeof j.recordId, 'string', 'a war row binds a record id');
      assert.ok(!Object.hasOwn(j, 'quarry'), 'no fixture-only field on the persisted row');
    }
  }
  const recCopy = JSON.parse(JSON.stringify(ctx.world.recordBanks));
  assert.ok(Object.keys(recCopy).length >= 1, 'record banks snapshot JSON-safe');
  const warRows = jobs.filter((j) => j && j.kind === 'war');
  assert.ok(warRows.length >= 1, 'war rows survive the snapshot');
});

console.log('ISSUE #325 PASS (' + checks + ' checks)');
process.exitCode = 0;
