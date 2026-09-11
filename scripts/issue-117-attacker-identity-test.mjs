/**
 * Issue #117 — playerHit and playerDestroyed name the attacker.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real combat projectile path,
 * the real agent-api harvest and the real observe() builder over one ctx.
 *
 * Covered:
 *   1  source pins: combat.js spreads the attacker primitives into playerHit
 *      and playerDestroyed (a future untagged emitter fails here)
 *   2  an NPC cannon bolt that hits the player lands a playerHit ring row with
 *      attackerId/attackerName equal to the shooter's record; observe() keeps
 *      them on the copy
 *   3  a masked Q-ship publishes its cover name at scanner 0 and its real
 *      name once the Mk II eye (scanner 2) pierces it
 *   4  impact damage (bodyHit) publishes a playerHit with no attacker fields
 *   5  playerDestroyed names the last hull that hit this life, even when the
 *      killing blow is an impact; the next life starts with no attacker
 *   6  sanitizeEvent fails closed on malformed attacker fields and is
 *      idempotent on a re-sanitized ring row
 *
 * Run: npm run test:attacker-identity
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
const { sanitizeEvent, capabilityManifest } = await import('../src/game/agent-schema.js');
const { PHY } = await import('../src/game/physics.js');

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
const ring = () => (ctx.agent && Array.isArray(ctx.agent.events) ? ctx.agent.events : []);
const ringRows = (type) => ring().filter((e) => e && e.type === type);
const hitTotal = () => ringRows('playerHit').reduce((n, e) => n + (e.count || 1), 0);

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
function spawn(extra) {
  seq++;
  const rec = { id: `i117-${seq}`, name: `Gunner ${seq}`, faction: 'redledger', role: 'pirate', classKey: 'cutter', resolve: 60, personality: 0, ...extra };
  const live = binds.spawnLiveShip(ctx, rec, new THREE.Vector3(6000, 6000, 5960));
  live.ai.demandSent = true;
  ctx.ships.push(live);
  return live;
}
function despawn(live) {
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  binds.removeLiveShip(ctx, live);
}
/** Fire NPC cannon bolts at the player until one lands; returns the newest playerHit ring row. */
function shootUntilHit(live, budget = 40) {
  for (let i = 0; i < budget; i++) {
    const before = hitTotal();
    ctx.emit('npcFire', { ship: live, weapon: 'cannon', target: 'player' });
    tick(12, FIGHT);
    if (hitTotal() > before) return ringRows('playerHit').at(-1);
  }
  return null;
}
function impact() {
  tick(15, FIGHT); // clear the impact gap
  ctx.events.push({ type: 'bodyHit', t: ctx.world.time, kind: 'asteroid', speed: PHY.IMPACT_MIN_SPEED * 4 });
  tick(1, FIGHT);
}

// 1 — source and schema pins.
const combatSrc = readFileSync(new URL('../src/systems/combat.js', import.meta.url), 'utf8');
pin('combat.js playerHit spreads attacker primitives', /ctx\.emit\('playerHit', \{ damage: p\.damage,[^}]*\.\.\.\(who \|\| \{\}\)/.test(combatSrc));
pin('combat.js playerDestroyed carries the last attacker', /ctx\.emit\('playerDestroyed', who \? \{ \.\.\.who \} : \{\}\)/.test(combatSrc));
const schemaHit = sanitizeEvent({ type: 'playerHit', t: 1, damage: 2, family: 'cannon', fromAft: false, attackerId: 'a1', attackerName: 'Alpha' });
pin('schema: playerHit admits attacker fields', !!schemaHit && schemaHit.attackerId === 'a1' && schemaHit.attackerName === 'Alpha', schemaHit);
const schemaDead = sanitizeEvent({ type: 'playerDestroyed', t: 1, attackerId: 'a1', attackerName: 'Alpha' });
pin('schema: playerDestroyed admits attacker fields', !!schemaDead && schemaDead.attackerId === 'a1' && schemaDead.attackerName === 'Alpha', schemaDead);
pin('manifest names the attacker fields', /attackerId\/attackerName/.test(capabilityManifest().commands.setCombatIntent.note || ''));

// 2 — a real NPC bolt names its shooter.
ctx.world.scanner = 0;
const gunner = spawn({});
const hit = shootUntilHit(gunner);
pin('fixture: NPC cannon bolt hit the player', !!hit, ring().map((e) => e.type));
pin('playerHit ring row names the shooter', !!hit && hit.attackerId === gunner.record.id && hit.attackerName === gunner.record.name, hit);
pin('playerHit ring row has no ship ref', !!hit && !Object.hasOwn(hit, 'ship') && !Object.hasOwn(hit, 'shooter'));
const obsHit = (buildObservation(ctx).events || []).filter((e) => e.type === 'playerHit').at(-1);
pin('observe() copy keeps attackerId/attackerName', !!obsHit && obsHit.attackerId === gunner.record.id && obsHit.attackerName === gunner.record.name, obsHit);
despawn(gunner);

// 3 — masked Q-ship cover holds until the Mk II eye.
ctx.agent.events.length = 0;
const qship = spawn({ name: 'Iron Verity', qship: true, coverName: 'Meridian Hauler', coverFaction: 'independent' });
ctx.world.scanner = 0;
const qHit0 = shootUntilHit(qship);
pin('fixture: Q-ship bolt hit the player', !!qHit0);
pin('masked Q-ship publishes its cover name', !!qHit0 && qHit0.attackerId === qship.record.id && qHit0.attackerName === 'Meridian Hauler', qHit0);
ctx.world.scanner = 2;
ctx.agent.events.length = 0;
const qHit2 = shootUntilHit(qship);
pin('fixture: Q-ship bolt hit the player at scanner 2', !!qHit2);
pin('Mk II eye pierces the cover on the receipt', !!qHit2 && qHit2.attackerName === 'Iron Verity', qHit2);
ctx.world.scanner = 0;
despawn(qship);

// 4 — impact damage carries no attacker.
ctx.agent.events.length = 0;
impact();
const impactRow = ringRows('playerHit').find((e) => e.family === 'impact');
pin('impact playerHit lands', !!impactRow, ring().map((e) => e.type));
pin('impact playerHit has no attacker fields', !!impactRow && !Object.hasOwn(impactRow, 'attackerId') && !Object.hasOwn(impactRow, 'attackerName'), impactRow);

// 5 — playerDestroyed names the last attacker of this life.
ctx.agent.events.length = 0;
const killer = spawn({ name: 'Lancer Po' });
const player = ctx.player;
player.screen = 0; player.shell = 0; player.hull = player.hullMax;
const kHit = shootUntilHit(killer);
pin('fixture: killer landed a hit first', !!kHit && kHit.attackerName === 'Lancer Po', kHit);
pin('fixture: player still alive', !player.destroyed);
// The killing blow is an impact, not a bolt: the receipt must still name Lancer Po.
player.screen = 0; player.shell = 0; player.hull = 0.5;
impact();
pin('fixture: impact killed the player', player.destroyed === true, { hull: player.hull });
const dead1 = ringRows('playerDestroyed').at(-1);
pin('playerDestroyed names the last attacker', !!dead1 && dead1.attackerId === killer.record.id && dead1.attackerName === 'Lancer Po', dead1);
const obsDead = (buildObservation(ctx).events || []).filter((e) => e.type === 'playerDestroyed').at(-1);
pin('observe() copy keeps the killer', !!obsDead && obsDead.attackerName === 'Lancer Po', obsDead);
// TEST SETUP: revive by hand (save.js is not ticked). The next life has no attacker on record.
ctx.agent.events.length = 0;
player.destroyed = false; player.hull = 0.5; player.screen = 0; player.shell = 0;
impact();
pin('fixture: second impact killed the player', player.destroyed === true);
const dead2 = ringRows('playerDestroyed').at(-1);
pin('a fresh life starts with no attacker on record', !!dead2 && !Object.hasOwn(dead2, 'attackerId') && !Object.hasOwn(dead2, 'attackerName'), dead2);
player.destroyed = false; player.hull = player.hullMax;
despawn(killer);

// 6 — sanitizeEvent fails closed and stays idempotent.
const bad1 = sanitizeEvent({ type: 'playerHit', t: 1, damage: 2, family: 'cannon', fromAft: false, attackerId: { id: 'x' }, attackerName: 'Ghost' });
pin('object attackerId drops both fields', !!bad1 && !Object.hasOwn(bad1, 'attackerId') && !Object.hasOwn(bad1, 'attackerName'), bad1);
const bad2 = sanitizeEvent({ type: 'playerDestroyed', t: 1, attackerName: 'Orphan' });
pin('attackerName never travels without attackerId', !!bad2 && !Object.hasOwn(bad2, 'attackerName'), bad2);
const bad3 = sanitizeEvent({ type: 'playerHit', t: 1, damage: 2, family: 'cannon', fromAft: false, attackerId: 'a'.repeat(65), attackerName: 'Long' });
pin('oversized attackerId drops', !!bad3 && !Object.hasOwn(bad3, 'attackerId'), bad3);
const bad4 = sanitizeEvent({ type: 'playerHit', t: 1, damage: 2, family: 'cannon', fromAft: false, attackerId: 'ok', attackerName: 'n'.repeat(41) });
pin('oversized attackerName drops, id stays', !!bad4 && bad4.attackerId === 'ok' && !Object.hasOwn(bad4, 'attackerName'), bad4);
const good = sanitizeEvent({ type: 'playerHit', t: 1, damage: 2, family: 'cannon', fromAft: false, attackerId: 7, attackerName: 'Seven' });
const again = sanitizeEvent(good);
pin('numeric attackerId is admitted and re-sanitize is idempotent', !!again && again.attackerId === 7 && again.attackerName === 'Seven', again);

if (fails) {
  console.log(`ISSUE 117 ATTACKER IDENTITY FAIL — ${fails}`);
  process.exit(1);
}
console.log('ISSUE 117 ATTACKER IDENTITY PASS');
