/**
 * Issue #123 — NPC pirates share the lane with a player pirate.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real npc, hail, world and
 * station systems over one ctx. Traders and pirates are spawned through the
 * real spawnLiveShip; every acquire, back-off and comm line below is produced
 * by the real hunt loop.
 *
 * Covered:
 *   1  the hunt cap: with PIRACY.concurrentCap pirates already working
 *      traders, a third pirate loiters with no target while fresh traders
 *      sit in its bubble; when a hunter finishes, the slot reopens
 *   2  prizes spread: a free pirate never doubles up on a trader another
 *      pirate is already working while an unworked trader is in reach
 *   3  a contested prize: a pirate on a trader the player locks inside
 *      PIRACY.contestRange backs off once, says so once, and takes a
 *      different hull; a scratch or an open terms claim contests the same way
 *   4  the lock alone does not contest from beyond contestRange, and a
 *      docked player contests nothing
 *   5  a sit-on hunt against the player is never capped
 *
 * Run: npm run test:shared-lane
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { PIRACY } from '../src/game/state.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 500));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { playerContests, countTraderHunters, huntSlotOpen } = await import('../src/systems/npc.js');

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
const ENCOUNTER = only('npc', 'hail', 'world', 'station');
const mark = () => allEvents.length;
const linesSince = (m) => allEvents.slice(m).filter((e) => e.type === 'commLine').map((e) => `${e.from ?? ''}: ${e.text}`);

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;

// A lane far from the station (LAW_ZONE_RADIUS 300) and, by default, far from the player.
const LANE = new THREE.Vector3(6000, 6000, 6000);
const FAR = new THREE.Vector3(20000, 20000, 20000);
ctx.ship.object.position.copy(FAR);
ctx.flags.docked = false;
ctx.targets.current = null;

let seq = 0;
function spawn(name, role, classKey, offset) {
  seq++;
  const live = binds.spawnLiveShip(ctx, {
    id: `i123-${seq}`, name, faction: 'freehold', role, classKey, resolve: 60, personality: 0,
    cargo: [{ commodity: 'provisions', units: 6 }],
  }, LANE.clone().add(offset));
  if (role === 'pirate') {
    live.ai.demandSent = true; // TEST SETUP: no wave-30 demand hail interrupts the loop
    live.ai.playerRolled = true; // TEST SETUP: the interest roll is fixed off —
    live.ai.playerInterested = false; // these pirates work the lane's traders
  }
  ctx.ships.push(live);
  return live;
}
function despawn(live) {
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  binds.removeLiveShip(ctx, live);
}
function clearLane() { for (const s of [...ctx.ships]) despawn(s); ctx.targets.current = null; }
const targetOf = (p) => p.ai.target;
const nameOf = (t) => (t === 'player' ? 'player' : t ? t.state.name : null);

// ---- 1  hunt cap ----------------------------------------------------------
{
  clearLane();
  const traders = [];
  for (let i = 0; i < 4; i++) traders.push(spawn(`Hauler-${i}`, 'trader', 'freighter', new THREE.Vector3(120 + i * 60, 0, 0)));
  const pirates = [];
  for (let i = 0; i < 3; i++) pirates.push(spawn(`Gun-${i}`, 'pirate', 'cutter', new THREE.Vector3(0, 0, 80 + i * 40)));
  tick(2, ENCOUNTER);
  const working = pirates.filter((p) => targetOf(p) && targetOf(p) !== 'player');
  pin('1a at most concurrentCap pirates work traders', working.length === PIRACY.concurrentCap,
    { cap: PIRACY.concurrentCap, targets: pirates.map((p) => nameOf(targetOf(p))) });
  const idle = pirates.find((p) => !targetOf(p));
  pin('1b the overflow pirate loiters with no target', !!idle && idle.ai.intent === false && idle.ai.phase === null,
    idle && { intent: idle.ai.intent, phase: idle.ai.phase });
  pin('1c countTraderHunters / huntSlotOpen agree with the loop', !!idle && countTraderHunters(ctx, idle) === PIRACY.concurrentCap && !huntSlotOpen(ctx, idle));
  // A hunter finishes: its prize yields (state written directly and said so).
  const done = working[0];
  const prize = targetOf(done);
  prize.state.surrendered = true; // TEST SETUP: the prize is broken
  tick(2, ENCOUNTER);
  pin('1d the finished hunter drops its yielded prize', targetOf(done) !== prize, { target: nameOf(targetOf(done)) });
  const nowWorking = pirates.filter((p) => targetOf(p) && targetOf(p) !== 'player');
  pin('1e the freed slot is taken again, still within the cap', nowWorking.length === PIRACY.concurrentCap,
    pirates.map((p) => nameOf(targetOf(p))));
}

// ---- 2  prizes spread -----------------------------------------------------
{
  clearLane();
  const near = spawn('Near Hauler', 'trader', 'freighter', new THREE.Vector3(100, 0, 0));
  const far = spawn('Far Hauler', 'trader', 'freighter', new THREE.Vector3(400, 0, 0));
  const first = spawn('Gun-A', 'pirate', 'cutter', new THREE.Vector3(0, 0, 60));
  tick(1, ENCOUNTER);
  pin('2a the first pirate takes the nearest trader', targetOf(first) === near, nameOf(targetOf(first)));
  const second = spawn('Gun-B', 'pirate', 'cutter', new THREE.Vector3(0, 0, 100));
  tick(1, ENCOUNTER);
  pin('2b the second pirate takes the unworked trader, not the nearer worked one', targetOf(second) === far, nameOf(targetOf(second)));
}

// ---- 3  a contested prize -------------------------------------------------
{
  clearLane();
  const mine = spawn('Marked Prize', 'trader', 'freighter', new THREE.Vector3(100, 0, 0));
  const other = spawn('Other Hauler', 'trader', 'freighter', new THREE.Vector3(300, 0, 0));
  const gun = spawn('Gun-C', 'pirate', 'cutter', new THREE.Vector3(0, 0, 60));
  tick(1, ENCOUNTER);
  pin('3a the pirate is on the nearest trader before the player arrives', targetOf(gun) === mine);
  // The player closes to 200 u and locks the same hull.
  ctx.ship.object.position.copy(mine.object.position).add(new THREE.Vector3(0, 200, 0));
  ctx.targets.current = mine;
  pin('3b playerContests reads the lock inside contestRange', playerContests(ctx, mine) === true);
  const m = mark();
  tick(1, ENCOUNTER);
  pin('3c the pirate backs off the contested hull and takes the other one', targetOf(gun) === other, nameOf(targetOf(gun)));
  const lines = linesSince(m).filter((l) => l.startsWith('Gun-C:'));
  pin('3d it says so once', lines.length === 1 && /prize/i.test(lines[0]), lines);
  tick(120, ENCOUNTER);
  pin('3e no repeat line and no re-acquire while the lock holds', targetOf(gun) === other && linesSince(m).filter((l) => l.startsWith('Gun-C:')).length === 1,
    { target: nameOf(targetOf(gun)), lines: linesSince(m) });
  // A scratch contests without a lock; a terms claim too.
  ctx.targets.current = null;
  ctx.ship.object.position.copy(FAR);
  mine.ai.lastAttacker = 'player'; // TEST SETUP: the player scratched this hull
  pin('3f a player scratch contests', playerContests(ctx, mine) === true);
  mine.ai.lastAttacker = null;
  mine.ai.termsAt = ctx.world.time; // TEST SETUP: an open terms card (issue #122)
  pin('3g an open terms claim contests', playerContests(ctx, mine) === true);
  mine.ai.termsAt = -1;
  pin('3h a pirate never counts as a prize', playerContests(ctx, gun) === false);
}

// ---- 4  range and docking -------------------------------------------------
{
  clearLane();
  const hull = spawn('Distant Hauler', 'trader', 'freighter', new THREE.Vector3(100, 0, 0));
  ctx.targets.current = hull;
  ctx.ship.object.position.copy(hull.object.position).add(new THREE.Vector3(0, PIRACY.contestRange + 50, 0));
  pin('4a a lock from beyond contestRange does not contest', playerContests(ctx, hull) === false);
  ctx.ship.object.position.copy(hull.object.position).add(new THREE.Vector3(0, 100, 0));
  pin('4b the same lock inside range contests', playerContests(ctx, hull) === true);
  ctx.flags.docked = true;
  pin('4c a docked player contests nothing by lock', playerContests(ctx, hull) === false);
  ctx.flags.docked = false;
  ctx.targets.current = null;
  ctx.ship.object.position.copy(FAR);
}

// ---- 5  the player hunt is never capped -----------------------------------
{
  clearLane();
  const traders = [];
  for (let i = 0; i < 3; i++) traders.push(spawn(`Hauler-${i}`, 'trader', 'freighter', new THREE.Vector3(120 + i * 60, 0, 0)));
  const busy = [];
  for (let i = 0; i < PIRACY.concurrentCap; i++) busy.push(spawn(`Gun-${i}`, 'pirate', 'cutter', new THREE.Vector3(0, 0, 80 + i * 40)));
  tick(1, ENCOUNTER);
  pin('5a the cap is full', countTraderHunters(ctx, null) === PIRACY.concurrentCap);
  const hunter = spawn('Player Hunter', 'pirate', 'cutter', new THREE.Vector3(0, 0, 200));
  hunter.ai.playerInterested = true; // TEST SETUP: this one rolled the player
  ctx.ship.object.position.copy(hunter.object.position).add(new THREE.Vector3(0, 300, 0));
  ctx.world.jumpGraceUntil = 0;
  ctx.world.time = Math.max(ctx.world.time, 400); // TEST SETUP: past the greenhand starter grace (180 s)
  tick(2, ENCOUNTER);
  pin('5b an interested pirate still hunts the player with the trader cap full', targetOf(hunter) === 'player', nameOf(targetOf(hunter)));
  ctx.ship.object.position.copy(FAR);
}

console.log(fails ? `\n${fails} FAILED` : '\nall ok');
process.exit(fails ? 1 : 0);
