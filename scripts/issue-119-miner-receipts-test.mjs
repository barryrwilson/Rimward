/**
 * Issue #119 — NPC miner mineHit receipts must not reach the public ring.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real agent-api harvest and the
 * real observe() builder over one ctx. No copied ring logic.
 *
 * Covered:
 *   1  both emitters tag their payload: npc.js `actor: 'npc'`, combat.js
 *      `actor: 'player'` (source pins, so a future untagged emitter fails here)
 *   2  a mineHit emitted with actor 'npc' through the real harvest never lands
 *      on ctx.agent.events, while world.miningLaser stays 0 for the player
 *   3  a mineHit emitted with actor 'player' lands, folds per asteroidId, and
 *      observe().events publishes { asteroidId, actor:'player', count } with
 *      no point/laserTier/extractPerSec
 *   4  an npc row emitted while the ring is saturated does not evict a
 *      keep-class podCollected row (the ring-pressure half of the bug)
 *   5  the asteroid extraction consumer still sees both actors on the
 *      internal channel (ctx.lastEvents), so NPC mining itself is unchanged
 *
 * Fixture honesty: mineHit payloads are emitted through ctx.emit with the same
 * shape the two emitters use; the harvest, fold, cap and observe() copy are
 * the real code paths.
 *
 * Run: npm run test:miner-receipts
 */
import { readFileSync } from 'node:fs';
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
const { EVENT_CAP, pushRing } = await import('../src/game/agent-schema.js');

const DT = 1 / 60;
function tick(n, selected = systems) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of selected) sys.update?.(DT);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
const only = (...names) => systems.filter(([n]) => names.includes(n));
const AGENT = only('agentapi');
const ringRows = (type) => (ctx.agent && Array.isArray(ctx.agent.events) ? ctx.agent.events : []).filter((e) => e && e.type === type);

// New game from the title screen, then park in open space with no traffic.
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
ctx.flags.docked = false;
ctx.ship.object.position.set(6000, 6000, 6000);
ctx.ship.velocity.set(0, 0, 0);
ctx.agent.optIn = true;
ctx.agent.events.length = 0;

// 1 — emitter source pins.
const npcSrc = readFileSync(new URL('../src/systems/npc.js', import.meta.url), 'utf8');
const combatSrc = readFileSync(new URL('../src/systems/combat.js', import.meta.url), 'utf8');
pin('npc.js miner mineHit carries actor npc', /ctx\.emit\('mineHit', \{[^}]*actor: 'npc'/s.test(npcSrc));
pin('combat.js beam mineHit carries actor player', /ctx\.emit\('mineHit', \{[^}]*actor: 'player'/s.test(combatSrc));
pin('exactly two mineHit emitters', (npcSrc.match(/ctx\.emit\('mineHit'/g) || []).length === 1
  && (combatSrc.match(/ctx\.emit\('mineHit'/g) || []).length === 1);

// 2 — npc rows never land through the real harvest.
const point = { x: 1, y: 2, z: 3 };
pin('fixture: player has no mining laser', (ctx.world.miningLaser || 0) === 0, ctx.world.miningLaser);
for (let i = 0; i < 12; i++) {
  ctx.emit('mineHit', { asteroidId: 40, actor: 'npc', point, laserTier: 0, extractPerSec: 0.5 });
  tick(1, AGENT);
}
pin('12 npc mineHit frames leave the ring empty', ctx.agent.events.length === 0, ctx.agent.events);
pin('observe() events carry no mineHit', !(buildObservation(ctx).events || []).some((e) => e.type === 'mineHit'));

// 3 — player rows land, fold, and publish bounded fields.
for (let i = 0; i < 5; i++) {
  ctx.emit('mineHit', { asteroidId: 103, actor: 'player', point, laserTier: 1, extractPerSec: 2 });
  tick(1, AGENT);
}
{
  const rows = ringRows('mineHit');
  pin('player mineHit folds into one row per asteroid', rows.length === 1 && rows[0].asteroidId === 103 && rows[0].count === 5, rows);
  pin('ring row carries actor player and no beam internals', rows.length === 1 && rows[0].actor === 'player'
    && !Object.hasOwn(rows[0], 'point') && !Object.hasOwn(rows[0], 'laserTier') && !Object.hasOwn(rows[0], 'extractPerSec'), rows[0]);
  const pub = (buildObservation(ctx).events || []).filter((e) => e.type === 'mineHit');
  pin('observe() publishes the player row', pub.length === 1 && pub[0].asteroidId === 103 && pub[0].actor === 'player' && pub[0].count === 5, pub);
}
// An npc cut on the SAME rock must not fold into (or refresh) the player row.
const before = JSON.stringify(ringRows('mineHit'));
ctx.emit('mineHit', { asteroidId: 103, actor: 'npc', point, laserTier: 0, extractPerSec: 0.5 });
tick(1, AGENT);
pin('npc cut on the same rock does not touch the player row', JSON.stringify(ringRows('mineHit')) === before);

// 4 — ring pressure: a saturated ring with one keep-class scoop row.
ctx.agent.events.length = 0;
for (let i = 0; i < EVENT_CAP - 1; i++) pushRing(ctx.agent.events, { type: 'npcHit', t: i, targetId: `foe-${i}`, damage: 5 });
pushRing(ctx.agent.events, { type: 'podCollected', t: 50, podId: 'pod-1', units: 6, commodity: 'rawOre' });
pin('fixture: ring saturated with the scoop as the newest row', ctx.agent.events.length === EVENT_CAP && ringRows('podCollected').length === 1);
for (let i = 0; i < 52; i++) {
  ctx.emit('mineHit', { asteroidId: 200 + i, actor: 'npc', point, laserTier: 0, extractPerSec: 0.5 });
  tick(1, AGENT);
}
pin('52 distinct npc mineHit rows evict nothing', ctx.agent.events.length === EVENT_CAP && ringRows('podCollected').length === 1
  && ringRows('mineHit').length === 0, ctx.agent.events.map((e) => e.type));

// 5 — the internal channel still carries both actors for asteroids.js.
ctx.emit('mineHit', { asteroidId: 1, actor: 'npc', point, laserTier: 0, extractPerSec: 0.5 });
ctx.emit('mineHit', { asteroidId: 2, actor: 'player', point, laserTier: 1, extractPerSec: 2 });
tick(1, AGENT);
{
  const internal = ctx.lastEvents.filter((e) => e.type === 'mineHit');
  pin('internal channel keeps both actors with point/extractPerSec', internal.length === 2
    && internal.every((e) => e.point === point && typeof e.extractPerSec === 'number'), internal);
}

console.log(fails === 0 ? 'ISSUE119 MINER RECEIPTS PASS' : `ISSUE119 MINER RECEIPTS FAIL (${fails})`);
process.exit(fails === 0 ? 0 : 1);
