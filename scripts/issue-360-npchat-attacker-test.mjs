/**
 * Issue #360 — npcHit rows name the attacker, and milestones read ambient.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real combat projectile and
 * mining paths, the real world incident consumer, and the real observe()
 * builder over one ctx.
 *
 * Covered:
 *   1  source pins: both npcHit emit sites publish attacker primitives, the
 *      unknown marker fallback exists, and fireMilestone carries cause with
 *      the three ambient sites marked
 *   2  schema: npcHit admits attackerId/attackerName/attackerUnknown, fails
 *      closed on malformed identity, never copies the ship ref; milestone
 *      cause is one of the two authored words
 *   3  schema: pushRing folds npcHit only within one attacker
 *   4  a real NPC bolt that hits another NPC lands an npcHit ring row naming
 *      the shooter (id + name) and the victim
 *   5  a masked Q-ship shooter publishes its cover name at scanner 0 and its
 *      real name once the Mk II eye pierces it
 *   6  the player's own cannon publishes attackerId 'player' and the ship name
 *   7  a world-caused destruction fires theWorldDidThat with cause 'ambient'
 *
 * Run: npm run test:issue-360-npchat-attacker
 */
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 500));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { buildObservation } = await import('../src/game/agent-observe.js');
const { sanitizeEvent, pushRing } = await import('../src/game/agent-schema.js');

const DT = 1 / 60;
function tick(n, selected = systems) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of selected) sys.update?.(DT);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
const only = (...names) => systems.filter(([n]) => names.includes(n));
const FIGHT = only('combat', 'agentapi');
const WORLD = only('world', 'combat', 'agentapi');
const ring = () => (ctx.agent && Array.isArray(ctx.agent.events) ? ctx.agent.events : []);
const ringRows = (type) => ring().filter((e) => e && e.type === type);

// New game from the title screen, then park in open space with no traffic.
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
ctx.flags.docked = false;
ctx.ship.object.position.set(6000, 6000, 6000);
ctx.ship.object.quaternion.identity();
ctx.ship.velocity.set(0, 0, 0);
ctx.agent.optIn = true;
ctx.agent.events.length = 0;

let seq = 0;
function spawn(extra, pos) {
  seq++;
  const rec = { id: `i360-${seq}`, name: `Gunner ${seq}`, faction: 'redledger', role: 'pirate', classKey: 'cutter', resolve: 60, personality: 0, ...extra };
  const live = binds.spawnLiveShip(ctx, rec, pos ?? new THREE.Vector3(6000, 6000, 5960));
  live.ai.demandSent = true;
  ctx.ships.push(live);
  return live;
}
function despawn(live) {
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  binds.removeLiveShip(ctx, live);
}
/** Fire shooter's cannon bolts at the victim until an npcHit row lands. */
function npcHitUntilRow(shooter, victim, budget = 40) {
  for (let i = 0; i < budget; i++) {
    ctx.emit('npcFire', { ship: shooter, weapon: 'cannon', target: victim });
    tick(12, FIGHT);
    const rows = ringRows('npcHit');
    if (rows.length) return rows.at(-1);
  }
  return null;
}

// 1 — source and schema pins.
const combatSrc = readFileSync(new URL('../src/systems/combat.js', import.meta.url), 'utf8');
const worldSrc = readFileSync(new URL('../src/game/world.js', import.meta.url), 'utf8');
pin('combat.js mining npcHit names the player', /ctx\.emit\('npcHit', \{ ship: bestShip, damage: dmg, \.\.\.playerAttacker\(\) \}\)/.test(combatSrc));
pin('combat.js projectile npcHit derives the shooter', /const npcWho = p\.fromPlayer \? playerAttacker\(\) : attackerIdentity\(p\.shooter\);/.test(combatSrc));
pin('combat.js unknown shooter publishes the explicit marker', /\.\.\.\(npcWho \|\| \{ attackerUnknown: true \}\)/.test(combatSrc));
pin('world.js fireMilestone carries cause', /function fireMilestone\(ctx, id, line, cause = 'player'\)/.test(worldSrc));
pin('world.js strikeRush milestone is ambient', /fireMilestone\(ctx, 'firstStrikeRush', 'Strike rush\. Word spreads\.', 'ambient'\)/.test(worldSrc));
pin('world.js both theWorldDidThat sites are ambient', (worldSrc.match(/fireMilestone\(ctx, 'theWorldDidThat', 'The world did that\. You just found it\.', 'ambient'\)/g) || []).length === 2);
const schemaHit = sanitizeEvent({ type: 'npcHit', t: 1, targetId: 'v1', targetName: 'Victim', damage: 3, attackerId: 'a1', attackerName: 'Shooter' });
pin('schema: npcHit admits attacker fields', !!schemaHit && schemaHit.attackerId === 'a1' && schemaHit.attackerName === 'Shooter', schemaHit);
const schemaUnknown = sanitizeEvent({ type: 'npcHit', t: 1, targetId: 'v1', damage: 3, attackerUnknown: true });
pin('schema: npcHit keeps a boolean-true unknown marker', !!schemaUnknown && schemaUnknown.attackerUnknown === true, schemaUnknown);
const badUnknown = sanitizeEvent({ type: 'npcHit', t: 1, targetId: 'v1', damage: 3, attackerUnknown: 'yes' });
pin('schema: non-true unknown marker drops', !!badUnknown && !Object.hasOwn(badUnknown, 'attackerUnknown'), badUnknown);
const badId = sanitizeEvent({ type: 'npcHit', t: 1, targetId: 'v1', damage: 3, attackerId: { id: 'x' }, attackerName: 'Ghost' });
pin('schema: object attackerId drops both fields', !!badId && !Object.hasOwn(badId, 'attackerId') && !Object.hasOwn(badId, 'attackerName'), badId);
const orphanName = sanitizeEvent({ type: 'npcHit', t: 1, targetId: 'v1', damage: 3, attackerName: 'Orphan' });
pin('schema: attackerName never travels without id', !!orphanName && !Object.hasOwn(orphanName, 'attackerName'), orphanName);
const withShip = sanitizeEvent({ type: 'npcHit', t: 1, ship: { id: 'leak' }, damage: 3 });
pin('schema: npcHit never copies the ship ref', !!withShip && !Object.hasOwn(withShip, 'ship'), withShip);
const mAmbient = sanitizeEvent({ type: 'milestone', t: 1, id: 'firstStrikeRush', line: 'x', cause: 'ambient' });
const mPlayer = sanitizeEvent({ type: 'milestone', t: 1, id: 'firstAceDefeated', line: 'x', cause: 'player' });
const mBad = sanitizeEvent({ type: 'milestone', t: 1, id: 'x', line: 'x', cause: 'world' });
pin('schema: milestone cause admits ambient and player', !!mAmbient && mAmbient.cause === 'ambient' && !!mPlayer && mPlayer.cause === 'player', { mAmbient, mPlayer });
pin('schema: milestone cause drops unauthored words', !!mBad && !Object.hasOwn(mBad, 'cause'), mBad);

// 2 — pushRing folds npcHit only within one attacker.
{
  const evs = [];
  const mk = (id, aid) => sanitizeEvent({ type: 'npcHit', t: 1, targetId: 'v1', targetName: 'Victim', damage: 1, attackerId: aid, attackerName: aid });
  pushRing(evs, mk(1, 'a1'));
  pushRing(evs, mk(2, 'a2'));
  pin('pushRing: different attackers do not fold', evs.length === 2 && evs[0].attackerId === 'a1' && evs[1].attackerId === 'a2', evs);
  pushRing(evs, mk(3, 'a2'));
  pin('pushRing: same attacker folds with a count', evs.length === 2 && evs[1].count === 2 && evs[1].attackerId === 'a2', evs);
}

// 3 — a real NPC bolt that hits another NPC names the shooter.
ctx.world.scanner = 0;
const shooter = spawn({ name: 'Red Ledger Gunner' }, new THREE.Vector3(6000, 6000, 5920));
const victim = spawn({ name: 'Pale Freida', faction: 'independent', role: 'trader' }, new THREE.Vector3(6000, 6000, 5960));
const hitRow = npcHitUntilRow(shooter, victim);
pin('fixture: NPC bolt hit an NPC', !!hitRow, ring().map((e) => e.type));
pin('npcHit ring row names the shooter', !!hitRow && hitRow.attackerId === shooter.record.id && hitRow.attackerName === 'Red Ledger Gunner', hitRow);
pin('npcHit ring row names the victim', !!hitRow && hitRow.targetId === victim.record.id && hitRow.targetName === 'Pale Freida', hitRow);
pin('npcHit ring row has no ship ref', !!hitRow && !Object.hasOwn(hitRow, 'ship') && !Object.hasOwn(hitRow, 'shooter'), hitRow);
const obsHit = (buildObservation(ctx).events || []).filter((e) => e.type === 'npcHit').at(-1);
pin('observe() copy keeps the shooter', !!obsHit && obsHit.attackerId === shooter.record.id && obsHit.attackerName === 'Red Ledger Gunner', obsHit);
despawn(shooter); despawn(victim);

// 4 — a masked Q-ship shooter publishes its cover until the Mk II eye pierces it.
ctx.agent.events.length = 0;
const qshooter = spawn({ name: 'Iron Verity', qship: true, coverName: 'Meridian Hauler', coverFaction: 'independent' }, new THREE.Vector3(6000, 6000, 5920));
const qvictim = spawn({ name: 'Copper Quill', faction: 'independent', role: 'trader' }, new THREE.Vector3(6000, 6000, 5960));
ctx.world.scanner = 0;
const qHit0 = npcHitUntilRow(qshooter, qvictim);
pin('fixture: Q-ship bolt hit an NPC', !!qHit0);
pin('masked shooter publishes its cover name', !!qHit0 && qHit0.attackerId === qshooter.record.id && qHit0.attackerName === 'Meridian Hauler', qHit0);
ctx.world.scanner = 2;
ctx.agent.events.length = 0;
const qHit2 = npcHitUntilRow(qshooter, qvictim);
pin('fixture: Q-ship bolt hit an NPC at scanner 2', !!qHit2);
pin('Mk II eye pierces the cover on the npcHit row', !!qHit2 && qHit2.attackerName === 'Iron Verity', qHit2);
ctx.world.scanner = 0;
despawn(qshooter); despawn(qvictim);

// 5 — the player's own cannon publishes attackerId 'player'.
ctx.agent.events.length = 0;
const pv = spawn({ name: 'Silver Ilex', faction: 'independent', role: 'trader' }, new THREE.Vector3(6000, 6000, 5950));
const holdAhead = () => {
  pv.object.position.set(6000, 6000, 5950);
  if (pv.velocity) pv.velocity.set(0, 0, 0);
};
holdAhead();
// The cannon aims through the camera ray; park the camera behind the ship
// looking down -Z so the bolts fly through the held target.
if (ctx.camera) {
  ctx.camera.position.set(6000, 6000, 6040);
  if (ctx.camera.quaternion) ctx.camera.quaternion.identity();
  ctx.camera.updateMatrixWorld?.();
}
ctx.input.fireHeld = true;
let playerRow = null;
for (let i = 0; i < 40 && !playerRow; i++) {
  tick(1, FIGHT);
  holdAhead();
  playerRow = ringRows('npcHit').find((e) => e.attackerId === 'player');
}
ctx.input.fireHeld = false;
pin('fixture: player cannon hit an NPC', !!playerRow, ring().map((e) => e.type));
pin('player npcHit row carries attackerId player', !!playerRow && playerRow.attackerId === 'player', playerRow);
pin('player npcHit row carries the ship name', !!playerRow && typeof playerRow.attackerName === 'string' && playerRow.attackerName.length > 0, playerRow);
despawn(pv);

// 6 — a world-caused destruction fires theWorldDidThat as ambient.
ctx.agent.events.length = 0;
const dead = spawn({ name: 'Copper Ilex', faction: 'independent', role: 'trader' }, new THREE.Vector3(6000, 6000, 5960));
tick(1, FIGHT); // clear the swap gap
ctx.events.push({ type: 'npcDestroyed', t: ctx.world.time, ship: dead });
tick(6, WORLD);
const ambientMs = ringRows('milestone').find((e) => e.id === 'theWorldDidThat');
pin('world-caused destruction fires theWorldDidThat', !!ambientMs, ring().map((e) => e.type));
pin('theWorldDidThat reads as ambient', !!ambientMs && ambientMs.cause === 'ambient', ambientMs);
despawn(dead);

if (fails) {
  console.log(`ISSUE 360 NPCHIT ATTRIBUTION FAIL — ${fails}`);
  process.exit(1);
}
console.log('ISSUE 360 NPCHIT ATTRIBUTION PASS');
