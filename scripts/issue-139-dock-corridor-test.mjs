/**
 * Issue #139 — fresh Greenhand approachDock intermittently cancels on a
 * bodyHit near the +X stage.
 *
 * Reproduction (this suite, group 2): the approach parks the hull at the
 * corridor entry, ~128 u out on the station's +X axis, for several seconds
 * while it turns into the corridor — the exact pose the baseline CI run
 * retained (127.27 u from the station, 7.74 u from the stage point). A
 * station-anchored loiterer on the old full ring (first waypoint ON the +X
 * axis, radius 80–150 u) turns there and hits the parked hull: `bodyHit
 * { kind: 'ship' }`, and the approach ends with reason `impact`. The
 * collider is an NPC hull, never the station (34.4 u reach) or a gate.
 *
 * Fix (npc.js stationLoiterWaypoints): station loiter paths sweep the far
 * side of the station (x ≤ station.x) out and back, so no point or chord
 * enters the docking lane.
 *
 * Covered:
 *   1  geometry: every station loiter waypoint and chord stays at x ≤ the
 *      anchor's x; the sweep list ping-pongs under the wrap follower; every
 *      live station-anchored loiterer in the fresh Freehold boot obeys it
 *   2  the defect, reproduced with the OLD ring shape injected on a live
 *      cutter: the approach cancels with `impact` on a `ship` bodyHit while
 *      the player is in the corridor
 *   3  the same cutter on the NEW sweep at the same radius never touches the
 *      approach: the hull docks, no bodyHit
 *   4  an unchanged fresh Greenhand approachDock still docks
 *
 * Run: npm run test:dock-corridor
 */
import * as THREE from 'three';
import { installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

// The seed that reproduced the collision in the issue #139 probe.
let st = 7 >>> 0;
Math.random = () => { st = (Math.imul(1664525, st) + 1013904223) >>> 0; return st / 0x100000000; };
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { stationLoiterWaypoints } = await import('../src/systems/npc.js');
const { disengage } = await import('../src/game/autopilot.js');

const DT = 1 / 60;
const events = [];
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    for (const e of ctx.events) if (e.type === 'bodyHit' || e.type === 'docked') events.push({ ...e, t: ctx.world.time });
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
ctx.flags.docked = false;
const rw = globalThis.window.rimward;
ctx.agent.optIn = true;
const station = ctx.station.position;
const stage = { x: station.x + 135, y: station.y, z: station.z };
pin('fixture: fresh Greenhand in Freehold', ctx.world.origin === 'greenhand' && ctx.world.currentSystem === 'freehold');

// ---- 1. geometry -------------------------------------------------------------
{
  const center = { x: 120, y: 20, z: 620 };
  for (const r of [80, 127, 150]) {
    const pts = stationLoiterWaypoints(center, r);
    const onFarSide = pts.every((p) => p.x <= center.x + 1e-9);
    let chordsClear = true;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if (Math.max(a.x, b.x) > center.x + 1e-9) chordsClear = false; // a segment's max x is at an endpoint
    }
    const radii = pts.map((p) => Math.hypot(p.x - center.x, p.z - center.z));
    pin(`station sweep at ${r} u stays on the far side of the station (points and chords)`, onFarSide && chordsClear, pts.map((p) => [p.x - center.x, p.z - center.z]));
    // The out-and-back list revisits the same x/z (y keeps its per-point jitter).
    const sameXZ = (a, b) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.z - b.z) < 1e-6;
    pin(`station sweep at ${r} u keeps its radius and ping-pongs`, radii.every((d) => Math.abs(d - r) < 1e-6) && pts.length === 6
      && sameXZ(pts[1], pts[5]) && sameXZ(pts[2], pts[4]), radii);
  }
}
function liveStationLoiterers() {
  return ctx.ships.filter((s) => s.ai?.waypoints && s.ai.mode !== 'route' && s.ai.mode !== 'mine' && s.record?.anchor
    && !String(s.record.id).startsWith('i139-'));
}

// A live cutter placed at the 270° point of a station ring, one leg before
// the +X waypoint, on the OLD full ring or the NEW sweep at the same radius.
function spawnLoiterer(shape, radius) {
  const rec = { id: `i139-${shape}`, name: `Ring Cutter ${shape}`, faction: 'redledger', role: 'pirate', classKey: 'cutter', resolve: 60, personality: 0, anchor: { x: station.x, y: station.y, z: station.z } };
  const live = binds.spawnLiveShip(ctx, rec, new THREE.Vector3(station.x, station.y, station.z - radius));
  live.ai.demandSent = true; live.ai.playerRolled = true; live.ai.playerInterested = false;
  live.ai.mode = 'loiter';
  if (shape === 'old') {
    live.ai.waypoints = [0, 1, 2, 3].map((i) => { const a = (i / 4) * Math.PI * 2; return new THREE.Vector3(station.x + Math.cos(a) * radius, station.y, station.z + Math.sin(a) * radius); });
  } else {
    live.ai.waypoints = stationLoiterWaypoints(station, radius);
  }
  live.ai.wp = 0;
  ctx.ships.push(live);
  return live;
}
function runApproach(shape, radius) {
  events.length = 0;
  ctx.ship.object.position.set(0, 30, 800);
  ctx.ship.object.quaternion.identity();
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.throttle = 0; ctx.input.fullStop = false;
  const a = rw.act({ v: 2, name: 'approachDock', args: {} });
  let loiterer = null;
  let out = null;
  for (let s = 0; s < 400 && !out; s++) {
    if (shape && !loiterer && ctx.autopilot.phase === 'corridor' && ctx.ship.speed < 1) loiterer = spawnLoiterer(shape, radius);
    const before = events.length;
    tick(30);
    const hits = events.slice(before).filter((e) => e.type === 'bodyHit');
    const ap = ctx.autopilot;
    const p = ctx.ship.object.position;
    if (hits.length) {
      const near = ctx.ships.map((sh) => ({ name: sh.record?.name, d: +dist(sh.object.position, p).toFixed(1) })).sort((x, y) => x.d - y.d)[0];
      out = { outcome: 'bodyHit', hit: hits[0], range: +dist(p, station).toFixed(2), toStage: +dist(p, stage).toFixed(2), phase: ap.phase, reason: ap.reason, engaged: ap.engaged, nearest: near };
    } else if (ctx.flags.docked) out = { outcome: 'docked', t: +ctx.world.time.toFixed(1) };
    else if (!ap.engaged) out = { outcome: 'disengaged', reason: ap.reason, phase: ap.phase };
  }
  return { act: a.ok, result: out || { outcome: 'timeout' }, loiterer };
}
function reset() {
  for (const live of ctx.ships.filter((s) => String(s.record?.id).startsWith('i139-'))) binds.removeLiveShip(ctx, live);
  if (ctx.flags.docked) {
    const r = rw.act({ v: 2, name: 'undock', args: {} });
    if (!r.ok) ctx.flags.docked = false;
  }
  disengage(ctx, 'test');
  tick(60);
}

// ---- 2. the defect ------------------------------------------------------------
{
  const r = runApproach('old', 120);
  pin('fixture: approachDock engaged', r.act === true);
  pin('fixture: the loiterer spawned while the hull was parked at the corridor entry', !!r.loiterer);
  pin('the OLD +X ring hull hits the approaching player: bodyHit kind ship, approach cancelled with impact',
    r.result.outcome === 'bodyHit' && r.result.hit.kind === 'ship' && r.result.reason === 'impact' && r.result.engaged === false
      && r.result.nearest?.name === 'Ring Cutter old' && r.result.nearest.d < 15, r.result);
  pin('the collider was never the station: the hit lands outside its 34.4 u reach, in the corridor',
    r.result.outcome === 'bodyHit' && r.result.range > 40 && r.result.range < 135, r.result);
  reset();
}

// ---- 3. the fix ---------------------------------------------------------------
{
  const r = runApproach('new', 120);
  pin('fixture: the sweep loiterer spawned while the hull was parked at the corridor entry', !!r.loiterer);
  pin('the NEW far-side sweep at the same radius never touches the approach: the hull docks with no bodyHit',
    r.result.outcome === 'docked' && events.every((e) => e.type !== 'bodyHit'), r.result);
  pin('the sweep loiterer stayed on the far side throughout',
    r.loiterer && r.loiterer.object.position.x <= station.x + 30, r.loiterer && r.loiterer.object.position.toArray());
  reset();
}

// ---- 4. the unchanged fresh approach -----------------------------------------
{
  const r = runApproach(null, 0);
  pin('an unchanged fresh Greenhand approachDock docks with no bodyHit', r.result.outcome === 'docked' && events.every((e) => e.type !== 'bodyHit'), r.result);
  // Every live station-anchored loiterer the real spawn path produced by now
  // (pirates, patrols, the ace) obeys the far-side rule.
  reset();
  for (let i = 0; i < 120 && liveStationLoiterers().length === 0; i++) tick(60);
  const loiterers = liveStationLoiterers();
  pin('fixture: the boot produced live station loiterers through the real spawn path', loiterers.length > 0,
    ctx.ships.map((s) => [s.record?.name, s.ai?.mode]));
  pin('no live station loiterer has a waypoint in the +X docking lane',
    loiterers.every((s) => s.ai.waypoints.every((p) => p.x <= s.record.anchor.x + 1e-9)),
    loiterers.map((s) => [s.record.name, s.ai.waypoints.map((p) => +(p.x - s.record.anchor.x).toFixed(0))]));
}

console.log(fails === 0 ? 'ISSUE 139 DOCK CORRIDOR PASS' : `ISSUE 139 DOCK CORRIDOR FAIL (${fails})`);
process.exit(fails === 0 ? 0 : 1);
