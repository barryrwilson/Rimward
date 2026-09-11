/**
 * Issue #105: departure-lane camping. A hunting pirate parked in the lane used
 * to hold the berth forever behind an anonymous notice. Everything here runs
 * the REAL systems — the real dock, the real desk, the real agent handle, the
 * real NPC update — so the security response is measured on actual simulated
 * motion, never on a plan record or a string.
 *
 * Disclosed fixtures. This is a headless harness, so it stages world state the
 * way every other focused test here does, and says so:
 *   1. the player hull is POSITIONED next to a station and then docked through
 *      the real dock path; simulated world time is advanced by a fixed step;
 *   2. blocking hulls are spawned with the production spawnLiveShip and pushed
 *      into ctx.ships the way traffic.js does, with the string ids that spawner
 *      really mints;
 *   3. a blocking hull's loiter waypoint list is pinned to its own spawn point.
 *      This does NOT freeze it — ordinary loiter keeps steering and the hull
 *      keeps moving — it only stops it from wandering off down a patrol ring
 *      before the case under test runs.
 * Nothing else is written: no velocity, no notice, no receipt, no request
 * state, and no blocking hull is ever repositioned by hand.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-105-lane-hold-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { planLaunch, launchBlockedLine, sanitizeBlockerName } from '../src/game/launch-clearance.js';
import { laneClearanceActive, requestLaneClearance } from '../src/systems/npc.js';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { SYSTEMS, spawnLiveShip, removeLiveShip } = binds;
const DT = 1 / 60;

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;

let pass = 0;
function ok(label) { pass++; console.log('PASS', label); }

function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
const shipPos = () => ctx.ship.object.position;
const stationPos = () => ctx.station.position;
const notice = () => (ctx.stationDesk.peekView()?.notice ?? '');
const api = globalThis.window.rimward;
ctx.agent.optIn = true;

/** Events emitted by the call itself (the desk emits synchronously). */
function emittedBy(fn) {
  const before = ctx.events.length;
  const value = fn();
  return { value, events: ctx.events.slice(before) };
}
const securityLines = (events) => events.filter(
  (e) => e.type === 'commLine' && typeof e.from === 'string' && /security$/i.test(e.from),
);

function dockFrom(systemId, dir, range = 36) {
  if (ctx.flags.docked) {
    const out = ctx.stationDesk.undock();
    assert.equal(out.ok, true, 'pre-dock launch refused: ' + JSON.stringify(out));
  }
  if (ctx.world.currentSystem !== systemId) {
    ctx.world.currentSystem = systemId;
    tick(3);
  }
  const s = SYSTEMS[systemId].station.position;
  const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  ctx.ship.object.position.set(
    s[0] + (dir[0] / len) * range,
    s[1] + (dir[1] / len) * range,
    s[2] + (dir[2] / len) * range,
  );
  ctx.input.dockPressed = true;
  tick(1);
  ctx.input.dockPressed = false;
  tick(2);
  assert.equal(ctx.flags.docked, true, `dock at ${systemId} from ${dir}`);
}

let fixtureSeq = 0;
/**
 * A production hull, spawned by the production spawner, with the id shape
 * spawnLiveShip really mints (`record.id ?? 'npc-<n>'` — a string).
 */
function addHull(opts) {
  const id = opts.id ?? `npc-fixture-${++fixtureSeq}`;
  const record = {
    id,
    name: opts.name,
    classKey: opts.classKey ?? 'heavy',
    faction: opts.faction ?? 'redledger',
    role: opts.role ?? 'pirate',
    resolve: 70,
  };
  if (opts.qship) {
    record.qship = true;
    record.coverName = opts.coverName;
    record.coverFaction = 'freehold';
  }
  const live = spawnLiveShip(ctx, record, opts.pos);
  assert.ok(live, `${opts.name} spawned`);
  assert.equal(typeof live.id, 'string', 'a live id is the string spawnLiveShip mints');
  ctx.ships.push(live); // traffic.js owns the list in production
  if (opts.camp !== false) {
    // Camping fixture: the hull's own patrol ring becomes a single point at its
    // spawn. Loiter still steers and the hull still moves — it simply has no
    // ring to wander off down before the case under test runs.
    live.ai.waypoints = [live.object.position.clone()];
    live.ai.wp = 0;
  }
  return live;
}
function removeHull(live) {
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  removeLiveShip(ctx, live);
}

/** Perpendicular distance of a point from the berth's departure axis. */
function lateralOffset(p) {
  const s = stationPos();
  const b = shipPos();
  let dx = b.x - s.x, dy = b.y - s.y, dz = b.z - s.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len; dy /= len; dz /= len;
  const vx = p.x - s.x, vy = p.y - s.y, vz = p.z - s.z;
  const axial = vx * dx + vy * dy + vz * dz;
  return Math.hypot(vx - axial * dx, vy - axial * dy, vz - axial * dz);
}
/** A point in the lane: straight out along the departure radial. */
function lanePoint(out = 90) {
  const s = stationPos();
  const b = shipPos();
  let dx = b.x - s.x, dy = b.y - s.y, dz = b.z - s.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  return new THREE.Vector3(s.x + (dx / len) * out, s.y + (dy / len) * out, s.z + (dz / len) * out);
}

// ---------------------------------------------------------------------------
// 1. The hold names the hull actually in the lane, with a finite current range,
//    on every public launch path — and security really answers.
let cutter = null;
let spawnLateral = 0;
{
  dockFrom('freehold', [1, 0, 0]);
  const spot = lanePoint(90);
  cutter = addHull({ name: 'Bloodmoth', role: 'pirate', pos: spot });
  tick(1);
  spawnLateral = lateralOffset(cutter.object.position);

  const plan = planLaunch(ctx);
  assert.equal(plan.ok, false, 'the camped hull refuses the plan');
  assert.equal(plan.token, 'blocked', 'the refusal is an obstruction, not a no-service');
  assert.equal(plan.blocker, 'ship', 'the blocking body is a hull');
  assert.equal(plan.blockerId, cutter.id, 'the plan carries the live hull id, not a bystander');
  assert.equal(plan.blockerName, 'Bloodmoth', 'and the name the player already sees');
  assert.ok(Number.isFinite(plan.blockerRange), 'the published range is finite');
  const trueRange = shipPos().distanceTo(cutter.object.position);
  assert.ok(Math.abs(plan.blockerRange - trueRange) < 1e-6, 'the range is the real ship-to-hull distance');
  assert.deepEqual(
    JSON.parse(JSON.stringify({
      blockerId: plan.blockerId, blockerName: plan.blockerName, blockerRange: plan.blockerRange,
    })),
    { blockerId: cutter.id, blockerName: 'Bloodmoth', blockerRange: plan.blockerRange },
    'the published identity is JSON-safe',
  );

  const held = emittedBy(() => ctx.stationDesk.undock());
  assert.equal(held.value.ok, false, 'the desk holds the berth');
  assert.equal(held.value.token, 'blocked', 'with the obstruction token');
  assert.match(held.value.notice, /^Launch held/, 'and an actionable line');
  assert.match(held.value.notice, /Bloodmoth/, 'the notice names the hull');
  assert.match(held.value.notice, /\d+u/, 'the notice states its current range');
  assert.match(held.value.notice, /Station security/, 'and the security response');
  assert.equal(notice(), held.value.notice, 'the panel shows the same line');
  assert.equal(ctx.flags.docked, true, 'a hold still stays docked');
  const hails = securityLines(held.events);
  assert.equal(hails.length, 1, 'security speaks once');
  assert.match(hails[0].text, /Bloodmoth/, 'the hail addresses the blocking hull');
  assert.match(hails[0].from, /security$/i, 'and it comes from station security');
  assert.equal(laneClearanceActive(ctx, cutter), true, 'an order is standing against that hull');
  console.log(`  hold: "${held.value.notice}"`);
  console.log(`  hail: [${hails[0].from}] ${hails[0].text}`);
  ok('a camped hull is named, ranged, and answered by station security');
}

// ---------------------------------------------------------------------------
// 2. Repeated attempts do not spam: one order, one hail.
{
  let extra = 0;
  for (let i = 0; i < 4; i++) {
    const again = emittedBy(() => api.act({ name: 'undock' }));
    assert.equal(again.value.ok, false, 'a still-fouled lane is still refused');
    assert.equal(again.value.token, 'blocked', 'and still with the obstruction token');
    assert.match(again.value.error, /Bloodmoth/, 'the agent receipt names the hull');
    assert.match(again.value.error, /\d+u/, 'the agent receipt carries the range');
    extra += securityLines(again.events).length;
  }
  assert.equal(extra, 0, 'no second hail while the first order is still standing');
  const open = emittedBy(() => api.act({ name: 'openService', args: { id: 'launch' } }));
  assert.equal(open.value.ok, false, 'openService launch reports the same hold');
  assert.match(open.value.error, /Bloodmoth/, 'openService launch names the hull too');
  assert.match(open.value.error, /\d+u/, 'openService launch carries the range too');
  assert.equal(securityLines(open.events).length, 0, 'and it does not re-hail either');
  ok('repeated launch attempts on both public paths cannot spam station security');
}

// ---------------------------------------------------------------------------
// 3. The hull physically leaves the lane on real frames, then a fully checked
//    launch succeeds. No teleport: every step is a flyable step.
{
  const startLateral = lateralOffset(cutter.object.position);
  let last = cutter.object.position.clone();
  let maxStep = 0;
  let frames = 0;
  for (; frames < 900; frames++) {
    tick(1);
    const step = cutter.object.position.distanceTo(last);
    if (step > maxStep) maxStep = step;
    last = cutter.object.position.clone();
    if (planLaunch(ctx).ok === true) break;
  }
  const endLateral = lateralOffset(cutter.object.position);
  assert.ok(frames < 900, `the lane clears on real frames (took ${frames})`);
  assert.ok(
    endLateral > spawnLateral + 10,
    `the hull really left the lane (${spawnLateral.toFixed(1)} → ${startLateral.toFixed(1)} → ${endLateral.toFixed(1)})`,
  );
  assert.ok(maxStep < 5, `no frame jumped the hull (worst step ${maxStep.toFixed(2)} u)`);
  assert.equal(cutter.state.destroyed, false, 'clearing the lane destroys nothing');
  assert.equal(cutter.state.disabled, false, 'and disables nothing');

  // It does not immediately drift back across the lane it was just cleared out
  // of: the whole planner keeps passing across the following seconds.
  let stayed = 0;
  for (let i = 0; i < 180; i++) {
    tick(1);
    if (planLaunch(ctx).ok === true) stayed++;
  }
  assert.equal(stayed, 180, 'the lane stays clear for the seconds after it opens');
  assert.ok(
    lateralOffset(cutter.object.position) >= endLateral - 1,
    'and the hull does not creep straight back into the lane',
  );

  const plan = planLaunch(ctx);
  assert.equal(plan.ok, true, 'the retry passes the whole clearance planner');
  const flew = api.act({ name: 'undock' });
  assert.equal(flew.ok, true, 'and the retry launches');
  assert.equal(flew.error, '', 'the retry clears the error');
  assert.equal(ctx.flags.docked, false, 'the ship really left the berth');
  assert.equal(notice(), '', 'and the held line is not replayed');
  console.log(`  cleared in ${frames} frames; lateral ${startLateral.toFixed(1)} → ${endLateral.toFixed(1)} u, worst step ${maxStep.toFixed(2)} u`);
  ok('station security physically clears the lane and the launch then passes on its own merits');
}

// ---------------------------------------------------------------------------
// 4. Leaving the berth ends the order — no state leaks past the visit.
{
  assert.equal(ctx.flags.docked, false, 'the player is flying');
  tick(2);
  assert.equal(laneClearanceActive(ctx, cutter), false, 'the order ends with the berth visit');
  const refused = requestLaneClearance(ctx, cutter.id, { dirX: 1, dirY: 0, dirZ: 0 });
  assert.equal(refused.ok, false, 'and nothing but a docked berth can open one');
  removeHull(cutter);
  ok('a standing order ends when the berth visit does');
}

// ---------------------------------------------------------------------------
// 5. Two blockers across retries: each is named in turn and each is answered.
{
  dockFrom('freehold', [0, 0, 1]);
  const first = addHull({ name: 'Ash Cutter', role: 'pirate', pos: lanePoint(80) });
  const second = addHull({ name: 'Slow Verdict', role: 'pirate', pos: lanePoint(130) });
  tick(1);

  const one = emittedBy(() => ctx.stationDesk.undock());
  assert.equal(one.value.ok, false, 'the nearer hull holds the berth');
  const namedFirst = /Ash Cutter/.test(one.value.notice);
  const namedSecond = /Slow Verdict/.test(one.value.notice);
  assert.equal(namedFirst || namedSecond, true, 'the hold names one of the two real hulls');
  assert.equal(namedFirst && namedSecond, false, 'and names exactly the one it found');
  assert.equal(securityLines(one.events).length, 1, 'one blocker, one hail');
  const held = namedFirst ? first : second;
  const other = namedFirst ? second : first;
  assert.equal(laneClearanceActive(ctx, held), true, 'the named hull is under orders');
  assert.equal(laneClearanceActive(ctx, other), false, 'the other hull is not ordered on speculation');

  // Let the first one go, then keep attempting: the second gets its own order.
  let sawSecond = false;
  let launched = false;
  let hails = 0;
  let attempts = 0;
  for (let i = 0; i < 1800; i++) {
    tick(1);
    if (i % 15 !== 0) continue;
    attempts++;
    const attempt = emittedBy(() => ctx.stationDesk.undock());
    hails += securityLines(attempt.events).length;
    if (attempt.value.ok === true) { launched = true; break; }
    if (attempt.value.notice.includes(other.record.name)) sawSecond = true;
  }
  assert.equal(sawSecond, true, 'once the first hull is out, the hold names the second one');
  assert.equal(laneClearanceActive(ctx, other), true, 'the second blocker gets its own order');
  assert.equal(hails, 1, 'exactly one further hail: one order per blocking hull');
  assert.equal(launched, true, 'both blockers clear and the launch goes');
  assert.equal(ctx.flags.docked, false, 'the ship left the berth');
  console.log(`  two blockers: ${attempts} attempts, ${hails + 1} hails total`);
  removeHull(first);
  removeHull(second);
  ok('multiple blockers across retries are each identified and each answered once');
}

// ---------------------------------------------------------------------------
// 6. Non-hostile hulls, rock, and no-service keep their established behavior.
{
  dockFrom('freehold', [1, 0, 0]);
  const hauler = addHull({ name: 'Patient Freight', role: 'trader', faction: 'freehold', pos: lanePoint(90) });
  tick(1);
  const civil = emittedBy(() => ctx.stationDesk.undock());
  assert.equal(civil.value.ok, false, 'a civilian hull still holds the berth');
  assert.match(civil.value.notice, /Patient Freight/, 'and it is still named');
  assert.match(civil.value.notice, /\d+u/, 'with its real range');
  assert.doesNotMatch(civil.value.notice, /Station security/, 'no security claim for a lawful hull');
  assert.equal(securityLines(civil.events).length, 0, 'and no hail is spoken');
  assert.equal(laneClearanceActive(ctx, hauler), false, 'a trader is never ordered out of the lane');
  tick(60);
  assert.equal(laneClearanceActive(ctx, hauler), false, 'and no order appears later either');
  removeHull(hauler);

  // A masked Q-ship keeps its cover: named by the cover, never ordered (an
  // order would announce a role the player has not seen through).
  const qship = addHull({
    name: 'Hidden Teeth', coverName: 'Dray Consignment', qship: true, role: 'pirate', pos: lanePoint(90),
  });
  // No frame is run here on purpose: this hull must still be WEARING the cover.
  // A live q-ship reveals itself the moment it picks a victim in the lane
  // (npc.js revealQship), and the point of this case is the masked state.
  assert.equal(qship.record.revealed, undefined, 'the fixture is still disguised');
  const masked = emittedBy(() => ctx.stationDesk.undock());
  assert.equal(masked.value.ok, false, 'the disguised hull still holds the berth');
  assert.match(masked.value.notice, /Dray Consignment/, 'the cover name is what the player is told');
  assert.doesNotMatch(masked.value.notice, /Hidden Teeth/, 'the true name never leaks');
  assert.doesNotMatch(masked.value.notice, /Station security/, 'and no order exposes the disguise');
  assert.equal(securityLines(masked.events).length, 0, 'no hail names a disguised hull');
  assert.equal(laneClearanceActive(ctx, qship), false, 'a masked Q-ship is not eligible');
  removeHull(qship);

  // A rock keeps the issue #65 line exactly.
  const list = ctx.asteroids.list;
  const rock = { id: list.length, position: lanePoint(90), radius: 8 };
  list.push(rock);
  assert.equal(list[rock.id], rock, 'the rock fixture keeps id === array index');
  tick(1);
  const rocky = emittedBy(() => api.act({ name: 'undock' }));
  assert.equal(rocky.value.ok, false, 'a rock still holds the berth');
  assert.match(rocky.value.error, /rock/, 'and still says rock');
  assert.equal(securityLines(rocky.events).length, 0, 'security does not hail a rock');
  list.pop();

  // Unreadable world: no-service, unchanged, and no request at all.
  const savedStation = ctx.station;
  ctx.station = { position: { x: NaN, y: 0, z: 0 }, name: 'broken' };
  const dead = emittedBy(() => ctx.stationDesk.undock());
  assert.equal(dead.value.ok, false, 'an unreadable world refuses');
  assert.equal(dead.value.token, 'no-service', 'as a no-service');
  assert.match(dead.value.notice, /flight control is not answering/, 'with the established line');
  assert.equal(securityLines(dead.events).length, 0, 'and security is not called');
  ctx.station = savedStation;

  // A gate ring keeps its structural line (no "wait and retry" lie).
  assert.equal(
    launchBlockedLine('blocked', 'gate', { name: 'Gate', range: 10, security: true }),
    launchBlockedLine('blocked', 'gate'),
    'a structural blocker never gains a security claim',
  );
  ok('civilian, disguised, rock, gate, and no-service holds keep their established behavior');
}

// ---------------------------------------------------------------------------
// 7. A destroyed or removed blocker ends its order; a hostile name is text-safe.
{
  const evil = 'Ker\u0000nel<img src=x onerror=alert(1)>\u001bDROP TABLE ships;--and a very long tail';
  const skull = addHull({ name: evil, role: 'pirate', pos: lanePoint(90) });
  tick(1);
  const nasty = emittedBy(() => ctx.stationDesk.undock());
  assert.equal(nasty.value.ok, false, 'the hostile-named hull holds the berth');
  const line = nasty.value.notice;
  assert.equal(/[\u0000-\u001f\u007f]/.test(line), false, 'no control character reaches the notice');
  assert.ok(line.includes(sanitizeBlockerName(evil)), 'the sanitized name is what is shown');
  assert.ok(sanitizeBlockerName(evil).length <= 32, 'and it is length-capped');
  // The panel builds the notice as text, never as markup.
  let noticeNode = null;
  for (const node of dom.walkDom(document.body)) {
    if (typeof node.textContent === 'string' && node.textContent === line) { noticeNode = node; break; }
  }
  assert.ok(noticeNode, 'the notice is on the panel');
  assert.equal(noticeNode.children.length, 0, 'as a text node only — no markup was parsed');
  assert.equal(noticeNode.innerHTML, '', 'and nothing was written through innerHTML');

  assert.equal(laneClearanceActive(ctx, skull), true, 'the hull is under orders');
  skull.state.destroyed = true;
  tick(2);
  assert.equal(laneClearanceActive(ctx, skull), false, 'a destroyed hull ends its order');
  skull.state.destroyed = false;
  removeHull(skull);
  tick(2);
  assert.equal(laneClearanceActive(ctx, skull), false, 'and so does one removed from the world');
  ok('arbitrary hull names stay text-safe, and a dead or despawned blocker ends its order');
}

// ---------------------------------------------------------------------------
// 8. Order lifetime, the quiet window, and the resets that end an order early.
//    Time advances by the same fixed step the loop uses; only the NPC owner is
//    updated here so a 35-second window costs a bounded number of frames.
{
  const npcSys = systems.find(([n]) => n === 'npc')[1];
  const npcOnly = (n) => {
    for (let i = 0; i < n; i++) {
      ctx.world.time += DT;
      ctx.elapsed += DT;
      npcSys.update(DT);
      ctx.lastEvents = ctx.events;
      ctx.events = [];
    }
  };
  const refusedPlan = () => {
    const p = planLaunch(ctx);
    assert.equal(p.ok, false, 'the fixture hull is really in the lane');
    assert.equal(p.blocker, 'ship', 'and it is the hull the planner found');
    return {
      blockerId: p.blockerId, dirX: p.dirX, dirY: p.dirY, dirZ: p.dirZ,
    };
  };

  dockFrom('freehold', [1, 0, 0]);
  const camper = addHull({ name: 'Long Vigil', role: 'pirate', pos: lanePoint(90) });
  tick(1);
  let plan = refusedPlan();
  assert.equal(plan.blockerId, camper.id, 'the planner names the fixture hull');

  const opened = requestLaneClearance(ctx, camper.id, plan);
  assert.deepEqual(opened, { ok: true, hail: true }, 'the first request opens an order and hails');
  assert.deepEqual(
    requestLaneClearance(ctx, camper.id, plan), { ok: true, hail: false },
    'a same-response second request reports the standing order without re-hailing',
  );

  // Mid-window: the order stands, and still nobody hails again.
  npcOnly(600); // 10 s
  assert.equal(laneClearanceActive(ctx, camper), true, 'the order still stands mid-window');
  assert.deepEqual(
    requestLaneClearance(ctx, camper.id, plan), { ok: true, hail: false },
    'a retry inside the window is told the order stands, silently',
  );

  // Past the window, inside the quiet time: no order, and no new hail.
  npcOnly(720); // 22 s total
  assert.equal(laneClearanceActive(ctx, camper), false, 'the order expires on its own');
  assert.deepEqual(
    requestLaneClearance(ctx, camper.id, plan), { ok: false, hail: false },
    'the quiet window refuses a fresh order rather than hailing again',
  );

  // Past the quiet time: security may act again.
  // (The hull has been steered out by now, so the planner may well be happy.
  // The question here is only whether security MAY act again, so the same lane
  // is reused rather than requiring the hull to have wandered back first.)
  npcOnly(1020); // 39 s total
  const again = requestLaneClearance(ctx, camper.id, plan);
  assert.deepEqual(again, { ok: true, hail: true }, 'after the quiet window a new order and a new hail are allowed');
  assert.equal(laneClearanceActive(ctx, camper), true, 'and it really stands');

  // A system change ends it: the field the order was measured in is gone.
  const heldSystem = ctx.world.currentSystem;
  ctx.world.currentSystem = 'veridian';
  assert.equal(laneClearanceActive(ctx, camper), false, 'a system change ends a standing order');
  ctx.world.currentSystem = heldSystem;

  // A clock that moves backwards (a restore) ends it too, rather than leaving
  // an order standing against a deadline from a future that was discarded.
  const savedTime = ctx.world.time;
  ctx.world.time = savedTime - 120;
  assert.equal(laneClearanceActive(ctx, camper), false, 'a rewound clock ends a standing order');
  ctx.world.time = savedTime;
  assert.equal(laneClearanceActive(ctx, camper), true, 'and the order is otherwise untouched');

  // Id reuse: the order belongs to the HULL, never to the id string.
  const reusedId = camper.id;
  removeHull(camper);
  npcOnly(2);
  const impostor = addHull({ id: reusedId, name: 'Long Vigil', role: 'pirate', pos: lanePoint(90) });
  assert.equal(impostor.id, reusedId, 'the new hull really carries the old id');
  assert.equal(laneClearanceActive(ctx, impostor), false, 'a reused id inherits no order');
  npcOnly(1);
  plan = refusedPlan();
  assert.deepEqual(
    requestLaneClearance(ctx, impostor.id, plan), { ok: true, hail: true },
    'and the new hull is hailed on its own account',
  );
  removeHull(impostor);
  npcOnly(2);
  ok('orders expire, stay quiet, resume, and end on system change, clock rewind and id reuse');
}

// ---------------------------------------------------------------------------
// 9. Hulls that may not be ordered at all.
{
  const cases = [
    { label: 'a patrol', opts: { name: 'Lawful Eye', role: 'patrol', faction: 'freehold' } },
    { label: 'a miner', opts: { name: 'Rock Hound', role: 'miner', faction: 'freehold' } },
    { label: 'a disabled hull', opts: { name: 'Dark Cutter', role: 'pirate' }, mark: (h) => { h.state.disabled = true; } },
    { label: 'a yielded hull', opts: { name: 'Beaten Cutter', role: 'pirate' }, mark: (h) => { h.state.surrendered = true; } },
  ];
  for (const c of cases) {
    const hull = addHull({ ...c.opts, pos: lanePoint(90) });
    if (c.mark) c.mark(hull);
    tick(1);
    const plan = planLaunch(ctx);
    assert.equal(plan.ok, false, `${c.label} still holds the berth`);
    const answer = requestLaneClearance(ctx, hull.id, plan);
    assert.deepEqual(answer, { ok: false, hail: false }, `${c.label} is never ordered out of the lane`);
    assert.equal(laneClearanceActive(ctx, hull), false, `${c.label} carries no order`);
    removeHull(hull);
    tick(1);
  }
  ok('patrols, miners, disabled hulls and yielded hulls are never ordered');
}

// ---------------------------------------------------------------------------
// 10. Orders are per context: a second boot cannot answer for the first.
{
  const second = await bootGameSystems();
  const answer = requestLaneClearance(second.ctx, 'npc-fixture-1', { dirX: 1, dirY: 0, dirZ: 0 });
  assert.equal(answer.ok, false, "a second context has no hull by the first context's id");
  ok('lane-clearance requests are keyed per context and per live hull');
}

console.log(`ISSUE-105 LANE HOLD PASS — ${pass} checks`);
