import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShipState, applyHit } from '../src/game/state.js';
import { scareDamageTotal, recordScareDamage, takeScareDamage, awardFirstScare } from '../src/game/first-scare.js';
import { sanitizeEvent } from '../src/game/agent-schema.js';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

function fixture() {
  return { id: 'test-target', state: createShipState('freighter', { name: 'Visible Trader', faction: 'freehold' }), record: {} };
}
function hit(live, player, now = 1, damage = 1, family = 'cannon') {
  const before = scareDamageTotal(live.state);
  applyHit(live.state, { damage, family, now });
  recordScareDamage(live, player, before, now);
}
function outcome(live, previous = 50, next = 30, now = 2, receipt = takeScareDamage(live)) {
  const ctx = { world: { milestones: [] }, events: [], emit(type, data) { this.events.push({ type, ...data }); } };
  live.state.resolve = next;
  awardFirstScare(ctx, live, previous, receipt, now, 12);
  return ctx;
}
for (const [label, setup, previous, next, now] of [
  ['seed low', l => hit(l, true), 30, 25, 2],
  ['passive', () => {}, 50, 30, 2],
  ['NPC only', l => hit(l, false), 50, 30, 2],
  ['player then NPC', l => { hit(l, true); hit(l, false); }, 50, 30, 2],
  ['NPC then player', l => { hit(l, false); hit(l, true); }, 50, 30, 2],
  ['stale player', l => hit(l, true), 50, 30, 13],
  ['upward', l => hit(l, true), 25, 30, 2],
  ['no crossing', l => hit(l, true), 60, 45, 2],
  ['consumed sample', l => { hit(l, true); takeScareDamage(l); }, 50, 30, 2],
  ['no effect', l => hit(l, true, 1, 0), 50, 30, 2],
]) {
  const live = fixture(); setup(live);
  assert.equal(outcome(live, previous, next, now).events.length, 0, label);
  console.log('PASS attribution exclusion:', label);
}
const immune = fixture(); immune.state.faction = 'unknowables';
hit(immune, true);
assert.equal(outcome(immune).events.length, 0, 'immune projectile cannot manufacture a damage receipt');
for (const next of [30, 10]) {
  const live = fixture(); hit(live, true);
  const receipt = takeScareDamage(live);
  const ctx = outcome(live, 50, next, 2, receipt);
  assert.deepEqual(ctx.world.milestones, ['firstScare']);
  assert.equal(awardFirstScare(ctx, live, 50, receipt, 2, 12), false);
  const row = sanitizeEvent({ ...ctx.events[0], resolve: 3, ai: { secret: true }, ship: live });
  assert.deepEqual(row, { type: 'milestone', t: 0, id: 'firstScare', line: 'They are breaking. First scare.', cause: 'player-damage', targetId: live.id, targetName: 'Visible Trader' });
  assert.deepEqual(sanitizeEvent(row), row, 'observation re-sanitization preserves evidence');
}
const masked = fixture(); masked.record = { qship: true, coverName: 'Cover Trader' };
hit(masked, true);
assert.equal(outcome(masked).events[0].targetName, 'Cover Trader');
console.log('PASS downward bargaining/direct capitulate, once, public evidence and cover identity');

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds, camera } = await bootGameSystems();
const DT = 1 / 60;
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
const allEvents = [];
function tick(n, selected = systems) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of selected) sys.update?.(DT);
    allEvents.push(...ctx.events);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
tick(1200);
assert.equal(ctx.world.milestones.includes('firstScare'), false, 'fresh passive 20-second full system control');
assert.equal(allEvents.some(e => e.type === 'milestone' && e.id === 'firstScare'), false);
console.log('PASS fresh passive full-system control');

// Controlled integration fixture: real player cannon, projectile collision,
// applyHit, and NPC resolve update. Only positioning/initial defenses are set up.
for (const live of ctx.ships) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
ctx.ship.object.position.set(6000, 6000, 6000);
ctx.ship.object.quaternion.identity();
camera.position.copy(ctx.ship.object.position); camera.quaternion.identity(); camera.updateMatrixWorld(true);
ctx.flags.firstPerson = true;
ctx.flags.docked = false;
ctx.flags.paused = false;
ctx.player.heat = 0; ctx.player.overheated = false;
const live = binds.spawnLiveShip(ctx, { id: 'earned-fixture', name: 'Earned Trader', faction: 'freehold', classKey: 'freighter', role: 'trader', resolve: 50, personality: 0 }, new THREE.Vector3(6000, 6000, 5940));
assert.ok(live);
ctx.ships.push(live);
live.state.resolve = 25;
tick(1, systems.filter(([name]) => name === 'world'));
assert.equal(ctx.world.milestones.includes('firstScare'), false, 'seeded bargaining ship alone cannot satisfy world milestone');
live.state.resolve = 50;
live.state.screen = 1; live.state.shell = 0; live.state.hull = live.state.hullMax * 0.7;
live.ai.resolveAt = 0;
const combatSystems = systems.filter(([name]) => name === 'combat');
const shooter = binds.spawnLiveShip(ctx, { id: 'npc-shooter', name: 'Other Fighter', faction: 'redledger', classKey: 'cutter', role: 'pirate', resolve: 50 }, new THREE.Vector3(6000, 6000, 5980));
ctx.ships.push(shooter);
const npcBefore = scareDamageTotal(live.state);
ctx.emit('npcFire', { ship: shooter, weapon: 'cannon', target: live });
tick(30, combatSystems);
assert.ok(scareDamageTotal(live.state) < npcBefore, 'real NPC projectile landed');
tick(1, systems.filter(([name]) => name === 'npc'));
assert.ok(live.state.resolve < 40, 'NPC damage fixture really crossed into a scared resolve band');
assert.equal(ctx.world.milestones.includes('firstScare'), false, 'real NPC-only resolve crossing does not award');
ctx.ships.splice(ctx.ships.indexOf(shooter), 1); binds.removeLiveShip(ctx, shooter);
live.object.position.set(6000, 6000, 5940);
live.state.resolve = 50; live.state.screen = 1; live.state.shell = 0; live.state.hull = live.state.hullMax * 0.7;
live.ai.resolveAt = 0; live.ai.calmUntil = 0;
console.log('PASS real NPC projectile → NPC resolve excludes ambient scare');
ctx.input.weaponGroup = 1; ctx.input.fireHeld = true;
const damageBefore = scareDamageTotal(live.state);
tick(30, combatSystems);
ctx.input.fireHeld = false;
assert.ok(scareDamageTotal(live.state) < damageBefore, 'real player cannon landed');
tick(1, systems.filter(([name]) => name === 'npc'));
assert.equal(ctx.world.milestones.includes('firstScare'), true, `real resolve transition awards (resolve=${live.state.resolve})`);
const earnedEvents = allEvents.filter(e => e.type === 'milestone' && e.id === 'firstScare');
assert.equal(earnedEvents.length, 1);
assert.equal(earnedEvents[0].targetId, live.id);
assert.equal(earnedEvents[0].cause, 'player-damage');
const saved = JSON.parse(JSON.stringify(binds.snapshot(ctx)));
assert.ok(saved.world.milestones.includes('firstScare'));
ctx.world.milestones = [];
binds.restore(ctx, saved);
assert.ok(ctx.world.milestones.includes('firstScare'));
hit(live, true, ctx.world.time);
live.state.resolve = 30;
assert.equal(awardFirstScare(ctx, live, 50, takeScareDamage(live), ctx.world.time, 12), false);
assert.equal(allEvents.filter(e => e.type === 'milestone' && e.id === 'firstScare').length, 1);
console.log('PASS real player cannon → NPC resolve → milestone → save/restore once');
