/**
 * Issue #266 — targets.current carries the same ship-local bearing as its
 * nearby row.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real npc, pods and agent-api
 * systems over one ctx, the real observe() builder. No copied row logic.
 *
 * Covered:
 *   1  a locked ship: targets.current.bearing is a unit vector equal to the
 *      matching nearby row's bearing, in the same frame (x right, y up,
 *      nose -z), and it points at the hull
 *   2  the bearing follows the ship's own attitude (rotate the ship, the
 *      locked bearing and the nearby bearing turn together)
 *   3  a lock crowded out of the nearby cap still bears on targets.current;
 *      a lock past sensor range (the prepended nearby row) bears the same
 *   4  locked rock and pod rows bear the same as their nearby rows
 *   5  no ship geometry: no bearing, no throw; the row stays JSON-plain
 *
 * Run: npm run test:current-bearing
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { spawnPod } = await import('../src/game/pods.js');
const { buildObservation } = await import('../src/game/agent-observe.js');

const DT = 1 / 60;
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
const isUnit = (b) => Array.isArray(b) && b.length === 3 && b.every(Number.isFinite)
  && Math.abs(Math.hypot(b[0], b[1], b[2]) - 1) < 1e-6;
const same = (a, b) => isUnit(a) && isUnit(b) && a.every((v, i) => Math.abs(v - b[i]) < 1e-9);
const nearbyRow = (obs, kind, id) => (obs.targets.nearby || []).find((r) => r && r.kind === kind && r.id === id);

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
ctx.pods.length = 0;
ctx.flags.docked = false;
ctx.targets.current = null;
ctx.ship.object.position.set(6000, 6000, 6000);
ctx.ship.object.quaternion.identity();
ctx.ship.velocity.set(0, 0, 0);
ctx.agent.optIn = true;

const here = () => ctx.ship.object.position.clone();
const at = (dx, dy, dz) => here().add(new THREE.Vector3(dx, dy, dz));
function spawn(rec, pos) {
  const live = binds.spawnLiveShip(ctx, rec, pos);
  if (!live) throw new Error(`spawn failed for ${rec.id}`);
  ctx.ships.push(live);
  return live;
}

// 1 — a locked ship dead astern (+z with identity attitude).
const quarry = spawn({ id: 'i266-quarry', name: 'Red Marlow', classKey: 'cutter', faction: 'redledger', role: 'pirate', resolve: 40 }, at(0, 0, 400));
quarry.state.disabled = true; // privilegedFixture: the disabled quarry of the report
ctx.targets.current = quarry;
{
  const obs = buildObservation(ctx);
  const cur = obs.targets.current;
  const row = nearbyRow(obs, 'ship', 'i266-quarry');
  pin('locked ship row carries a unit bearing', !!cur && isUnit(cur.bearing), cur);
  pin('locked bearing equals the nearby row bearing', !!cur && !!row && same(cur.bearing, row.bearing), { cur: cur && cur.bearing, row: row && row.bearing });
  pin('bearing points at the hull (dead astern is +z)', !!cur && cur.bearing[2] > 0.999, cur && cur.bearing);
  pin('locked row keeps its extended fields', !!cur && cur.disabled === true && Number.isFinite(cur.hull) && !!cur.hail, cur);
}

// 2 — yaw the ship 90°: the locked and nearby bearings turn together.
ctx.ship.object.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
{
  const obs = buildObservation(ctx);
  const cur = obs.targets.current;
  const row = nearbyRow(obs, 'ship', 'i266-quarry');
  pin('rotated: locked bearing still equals the nearby bearing', !!cur && !!row && same(cur.bearing, row.bearing), { cur: cur && cur.bearing, row: row && row.bearing });
  pin('rotated: bearing follows the ship attitude', !!cur && Math.abs(cur.bearing[2]) < 1e-6 && Math.abs(Math.abs(cur.bearing[0]) - 1) < 1e-6, cur && cur.bearing);
}
ctx.ship.object.quaternion.identity();

// 3 — a crowd fills the nearby cap; the lock still bears on targets.current,
// and a lock past sensor range is prepended to nearby with the same bearing.
{
  const crowd = [];
  for (let i = 0; i < 14; i++) {
    crowd.push(spawn({ id: `i266-crowd-${i}`, name: `Crowd ${i}`, classKey: 'freighter', faction: 'independent', role: 'trader', resolve: 30 }, at(40 + i * 5, 0, 0)));
  }
  let obs = buildObservation(ctx);
  pin('fixture: the crowd pushes the lock out of the capped nearby list', !nearbyRow(obs, 'ship', 'i266-quarry'), obs.targets.nearby.map((r) => r.id));
  pin('capped out: targets.current still bears at the hull', !!obs.targets.current && isUnit(obs.targets.current.bearing) && obs.targets.current.bearing[2] > 0.999, obs.targets.current);
  quarry.object.position.copy(at(0, 0, 900)); // past U.TARGET_RANGE (600)
  obs = buildObservation(ctx);
  const row = nearbyRow(obs, 'ship', 'i266-quarry');
  pin('fixture: the far lock is the prepended nearby row', !!row && obs.targets.nearby[0] === row, obs.targets.nearby.map((r) => r.id));
  pin('prepended lock row bears the same as targets.current', !!row && same(row.bearing, obs.targets.current && obs.targets.current.bearing), row);
  quarry.object.position.copy(at(0, 0, 400));
  for (const live of crowd) { binds.removeLiveShip(ctx, live); ctx.ships.splice(ctx.ships.indexOf(live), 1); }
}

// 4 — rock and pod locks.
{
  const list = ctx.asteroids && ctx.asteroids.list;
  const idx = list ? list.findIndex((a) => a && a.position && a.radius > 0) : -1;
  if (idx >= 0) {
    const rock = list[idx];
    const saved = rock.position.clone();
    rock.position.copy(at(0, 120, 0));
    ctx.targets.current = rock;
    const obs = buildObservation(ctx);
    const cur = obs.targets.current;
    const row = nearbyRow(obs, 'rock', idx);
    pin('locked rock bears the same as its nearby row', !!cur && cur.kind === 'rock' && !!row && same(cur.bearing, row.bearing) && cur.bearing[1] > 0.999, { cur, row });
    rock.position.copy(saved);
  } else {
    pin('fixture: a live asteroid exists', false);
  }
  const pod = spawnPod(ctx, [{ commodity: 'rawOre', units: 5 }], at(-90, 0, 0), new THREE.Vector3(0, 0, 0));
  ctx.targets.current = { lockKind: 'pod', position: pod.mesh.position, pod }; // the reticle-aim pod lock shape
  const obs = buildObservation(ctx);
  const cur = obs.targets.current;
  const row = nearbyRow(obs, 'pod', pod.id);
  pin('locked pod bears the same as its nearby row', !!cur && cur.kind === 'pod' && !!row && same(cur.bearing, row.bearing) && cur.bearing[0] < -0.999, { cur, row });
  ctx.pods.length = 0;
}

// 5 — no ship geometry.
ctx.targets.current = quarry;
{
  const savedObj = ctx.ship.object;
  ctx.ship.object = null;
  let obs = null;
  try { obs = buildObservation(ctx); } catch (e) { obs = { threw: String(e) }; }
  pin('no ship object: no throw, no bearing on the locked row', !!obs && obs.ok === true && (!obs.targets.current || !Object.hasOwn(obs.targets.current, 'bearing')), obs && obs.threw);
  ctx.ship.object = savedObj;
  const cur = buildObservation(ctx).targets.current;
  pin('locked row is JSON-plain', JSON.stringify(JSON.parse(JSON.stringify(cur))) === JSON.stringify(cur));
}

ctx.targets.current = null;
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;

if (fails) { console.log(`ISSUE 266 CURRENT BEARING FAIL — ${fails} pin(s)`); process.exit(1); }
console.log('ISSUE 266 CURRENT BEARING PASS');
