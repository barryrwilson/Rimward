/**
 * Issue #99 — surrender attribution: who broke the hull, and who gets paid.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real npc, combat, hail, world
 * and station systems over one ctx. No DOM stub of its own, no copied boot.
 *
 * Covered:
 *   1  combat ownership stamping — a REAL player round that reduces nothing
 *      stamps no attacker and cannot steal a trail from the NPC that wounded
 *   2  an NPC-caused break opens no bargaining card, yields the hull anyway,
 *      and pays no fear, no milestone, no patrol progress; the incident says
 *      'world'
 *   3  a player-caused break opens the card and pays credits, fear, milestone,
 *      incident and patrol progress
 *   4  a yielded hull is never resampled, so no band change reopens it
 *   5  a stale ORIGINAL surrender card refuses payout and letGo with 'stale',
 *      closes itself on the next update, cannot be exempted by a hull that has
 *      SINCE become disabled, and does not block a real salvage card
 *   6  the patrol contract fails closed on a receipt with no player word
 *
 * Fixture honesty: where a pin needs a rare hull state (very low defenses, a
 * fresh lastCombatAt, an attacker stamp) it is written directly and said so.
 * No pin ever writes an OUTCOME — state.surrendered, the band, the card and
 * the receipts are always produced by the real systems.
 *
 * Run: npm run test:surrender-attribution
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { WEAPONS } from '../src/game/state.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 500));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds, camera } = await bootGameSystems();
const { lastAttackerOf, surrenderCauserOf } = await import('../src/systems/npc.js');
const { scareDamageTotal } = await import('../src/game/first-scare.js');

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
const COMBAT = only('combat');
const ENCOUNTER = only('npc', 'hail', 'world', 'station');
const mark = () => allEvents.length;
const since = (m, type, live) => allEvents.slice(m)
  .filter((e) => e.type === type && (live === undefined || e.ship === live));

// New game from the title screen, then clear the lane: traffic's own hulls are
// in no pin below, and traffic is never ticked again after this point.
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;

// Same firing fixture scripts/issue-63-first-scare-test.mjs uses: the player
// alone in open space, first-person, cannon group, targets 60 units down -Z.
ctx.ship.object.position.set(6000, 6000, 6000);
ctx.ship.object.quaternion.identity();
camera.position.copy(ctx.ship.object.position);
camera.quaternion.identity();
camera.updateMatrixWorld(true);
ctx.flags.firstPerson = true;
ctx.flags.docked = false;
ctx.input.weaponGroup = 1;
const LINE = () => new THREE.Vector3(6000, 6000, 5940); // the cannon's line
const PARK = () => new THREE.Vector3(6000, 6300, 6000); // off the line, inside U.TARGET_RANGE

let seq = 0;
function spawn(name, faction, role, classKey, at) {
  seq++;
  const live = binds.spawnLiveShip(ctx, {
    id: `i99-${seq}`, name, faction, role, classKey, resolve: 60, personality: 0,
  }, at);
  // TEST SETUP: suppress the wave-30 pirate demand hail so the only card any
  // pin below can see is the surrender card under test.
  live.ai.demandSent = true;
  ctx.ships.push(live);
  return live;
}
function despawn(live) {
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  binds.removeLiveShip(ctx, live);
}
function firePlayer(frames) {
  ctx.player.heat = 0; ctx.player.overheated = false;
  ctx.input.fireHeld = true;
  tick(frames, COMBAT);
  ctx.input.fireHeld = false;
}

/**
 * TEST SETUP for the band walk. Hull is written DOWN directly (never through
 * applyHit, so it cannot trip the disabled threshold), lastCombatAt is kept
 * fresh so npc.js keeps sampling resolve, and calm is cleared. `attacker`
 * re-stamps the trail only when passed. The OUTCOME is never written: npc.js
 * computes the band, opens or withholds the card, and runs capitulate itself.
 */
function walkDownTo(live, band, attacker) {
  for (let i = 0; i < 80 && live.ai.band !== band; i++) {
    live.state.screen = 0; live.state.shell = 0;
    live.state.hull = Math.max(1, live.state.hull - live.state.hullMax * 0.04);
    live.state.lastCombatAt = ctx.world.time;
    if (attacker !== undefined) live.ai.lastAttacker = attacker;
    live.ai.resolveAt = 0; live.ai.calmUntil = 0;
    tick(1, ENCOUNTER);
  }
  return live.ai.band;
}

/** Everything a resolution would move. Compared across every refusal. */
function snap(live) {
  return JSON.stringify({
    credits: ctx.world.credits,
    fear: ctx.world.fear,
    cargo: live.state.cargo.map((r) => `${r.commodity}:${r.units}`).join(','),
    surrendered: live.state.surrendered,
    mode: live.ai.mode,
    target: typeof live.ai.target === 'string' ? live.ai.target : !!live.ai.target,
    calmUntil: live.ai.calmUntil,
    escape: !!(live.record && live.record.escape),
  });
}

// The patrol contract is the station-side consumer. need is pinned high so it
// never completes: progress itself is the pin.
const patrol = ctx.world.jobs.find((j) => j.kind === 'patrol');
patrol.state = 'accepted'; patrol.progress = 0; patrol.need = 99;

// ---- 1. Ownership follows real damage ------------------------------------
{
  // TEST SETUP: the collision is real — a real cannon round really strikes a
  // real hull — and only the round's damage is staged to zero, so the hit path
  // runs end to end while reducing nothing.
  const ghost = spawn('Line Ghost', 'freehold', 'trader', 'cutter', LINE());
  const before = scareDamageTotal(ghost.state);
  const m = mark();
  const dmg = WEAPONS.cannon.damage;
  try {
    WEAPONS.cannon.damage = 0;
    firePlayer(40);
  } finally {
    WEAPONS.cannon.damage = dmg;
    ctx.input.fireHeld = false;
  }
  pin('a real player round collided with the hull', since(m, 'npcHit', ghost).length > 0);
  pin('the zero-damage round reduced nothing', scareDamageTotal(ghost.state) === before);
  pin('a no-effect player round stamps no attacker', lastAttackerOf(ghost) === null,
    { lastAttacker: ghost.ai.lastAttacker });
  pin('an unstamped hull attributes to the world', surrenderCauserOf(ghost) === 'world');
  despawn(ghost);
  tick(100, COMBAT); // drain this fixture's rounds so later pins are isolated
}
{
  // A real NPC round wounds a real hull; then a real player round that cannot
  // touch it must not take the trail away from the NPC that did the work.
  const wounded = spawn('Line Trader', 'freehold', 'trader', 'freighter', LINE());
  const shooter = spawn('Other Gun', 'redledger', 'pirate', 'cutter', new THREE.Vector3(6000, 6000, 5980));
  const before = scareDamageTotal(wounded.state);
  ctx.emit('npcFire', { ship: shooter, weapon: 'cannon', target: wounded });
  tick(40, COMBAT);
  pin('a real NPC round wounded the hull', scareDamageTotal(wounded.state) < before);
  const owner = wounded.ai.lastAttacker;
  pin('the wound is owned by the NPC that landed it', owner !== null && owner !== 'player');
  pin('an NPC-owned wound attributes to the world', surrenderCauserOf(wounded) === 'world');
  despawn(shooter); // clear the line so the player's own round reaches the target
  // TEST SETUP: the player's round is staged to zero damage, so it really
  // collides with the wounded hull without reducing it. The NPC wound, the
  // player's shot and the collision are all real.
  const stealBefore = scareDamageTotal(wounded.state);
  const m = mark();
  const dmg = WEAPONS.cannon.damage;
  try {
    WEAPONS.cannon.damage = 0;
    firePlayer(40);
  } finally {
    WEAPONS.cannon.damage = dmg;
    ctx.input.fireHeld = false;
  }
  pin('the harmless player round really landed', since(m, 'npcHit', wounded).length > 0);
  pin('and reduced nothing', scareDamageTotal(wounded.state) === stealBefore);
  pin('a harmless player round cannot steal the trail', wounded.ai.lastAttacker === owner,
    { after: typeof wounded.ai.lastAttacker });
  pin('so the break still belongs to the world', surrenderCauserOf(wounded) === 'world');
  despawn(wounded);
  tick(100, COMBAT); // drain this fixture's rounds so later pins are isolated
}

// ---- 1b. surrenderCauserOf reads the marker, not the wound --------------
{
  // A fresh hull off the firing line, never ticked through npc.js: the marker
  // is the only thing under test here.
  const marked = spawn('Marker Hull', 'freehold', 'trader', 'freighter', PARK());
  marked.ai.lastAttacker = 'player';
  pin('a player marker on a full hull still reads player',
    surrenderCauserOf(marked) === 'player',
    { hull: marked.state.hull, shell: marked.state.shell, screen: marked.state.screen });
  marked.ai.lastAttacker = null;
  pin('a null marker reads world', surrenderCauserOf(marked) === 'world');
  marked.ai.lastAttacker = 'npc';
  pin('a dead NPC marker reads world', surrenderCauserOf(marked) === 'world');
  despawn(marked);
}

// ---- 2. An NPC-caused break pays nobody -----------------------------------
const drifter = spawn('Lane Drifter', 'redledger', 'pirate', 'freighter', PARK());
{
  let m = mark();
  pin('the NPC-broken hull reaches the bargaining band',
    walkDownTo(drifter, 'bargaining', 'npc') === 'bargaining',
    { resolve: drifter.state.resolve, band: drifter.ai.band });
  pin('an NPC-caused break opens no bargaining card',
    since(m, 'hailOpened').length === 0 && ctx.hailApi.peek().open === false,
    ctx.hailApi.peek());
  pin('and it fakes no yield', drifter.state.surrendered === false);

  const fearBefore = ctx.world.fear;
  const incidentsBefore = ctx.world.incidents.length;
  m = mark();
  pin('the same hull walks on into capitulation',
    walkDownTo(drifter, 'capitulate', 'npc') === 'capitulate',
    { resolve: drifter.state.resolve, band: drifter.ai.band });
  tick(3, ENCOUNTER); // world.js/station.js consume the receipt the frame after
  const receipts = since(m, 'npcSurrendered', drifter);
  pin('npc.js yields the hull whoever broke it',
    receipts.length === 1 && drifter.state.surrendered === true,
    { receipts: receipts.length, surrendered: drifter.state.surrendered });
  pin('the receipt names the world as causer', receipts[0]?.causer === 'world', receipts[0]?.causer);
  pin('an NPC-caused capitulation pays no fear', ctx.world.fear === fearBefore,
    { before: fearBefore, after: ctx.world.fear });
  pin('and fires no player milestone', !ctx.world.milestones.includes('firstCapitulation'));
  const inc = ctx.world.incidents.slice(incidentsBefore).find((i) => i.kind === 'surrendered');
  pin('the lane still remembers the yield, credited to the world',
    !!inc && inc.causer === 'world', inc);
  pin('an NPC-caused surrender does not tick the patrol contract', patrol.progress === 0);
}

// ---- 3. A player-caused break pays the player -----------------------------
const reaver = spawn('Line Reaver', 'redledger', 'pirate', 'heavy', LINE());
{
  const before = scareDamageTotal(reaver.state);
  firePlayer(40);
  pin('a real player cannon round wounded the reaver', scareDamageTotal(reaver.state) < before);
  pin('the fixture is a live hull, not a wreck',
    reaver.state.disabled === false && reaver.state.destroyed === false,
    { hull: reaver.state.hull, hullMax: reaver.state.hullMax });
  pin('an effective player round owns the hull',
    lastAttackerOf(reaver) === 'player' && surrenderCauserOf(reaver) === 'player');

  // The trail is left alone from here: the walk only lowers the hull.
  let m = mark();
  pin('the player-broken hull reaches the bargaining band',
    walkDownTo(reaver, 'bargaining') === 'bargaining',
    { resolve: reaver.state.resolve, band: reaver.ai.band });
  const card = ctx.hailApi.peek();
  pin('a player-caused break opens the bargaining card',
    since(m, 'hailOpened', reaver).length === 1 && card.open === true && card.kind === 'surrender',
    card);

  const ransom = card.terms.amounts.ransom;
  const credits = ctx.world.credits;
  const fear = ctx.world.fear;
  const incidentsBefore = ctx.world.incidents.length;
  m = mark();
  const token = ctx.hailApi.resolve('demandRansom', card.conversationId);
  tick(3, ENCOUNTER);
  pin('the ransom resolves and pays',
    token === '' && Number.isFinite(ransom) && ctx.world.credits === credits + ransom,
    { token, ransom, credits: ctx.world.credits });
  pin('the hull is marked yielded', reaver.state.surrendered === true);
  const receipts = since(m, 'npcSurrendered', reaver);
  pin('the receipt names the player', receipts.length === 1 && receipts[0].causer === 'player',
    receipts.map((r) => r.causer));
  pin('a player-caused break pays fear', ctx.world.fear > fear, { before: fear, after: ctx.world.fear });
  pin('and fires the player milestone', ctx.world.milestones.includes('firstCapitulation'));
  const inc = ctx.world.incidents.slice(incidentsBefore).find((i) => i.kind === 'surrendered');
  pin('the incident is credited to the player', !!inc && inc.causer === 'player', inc);
  pin('a player-caused surrender ticks the patrol contract', patrol.progress === 1, patrol.progress);
}

// ---- 4. A yielded hull is never reopened ----------------------------------
for (const [label, live] of [['NPC-yielded', drifter], ['player-yielded', reaver]]) {
  // TEST SETUP: shove the band back up and demand a fresh sample. A yielded
  // hull must not be resampled at all, so the seeded resolve stays put.
  const m = mark();
  live.state.resolve = 90;
  live.ai.band = 'capitulate';
  live.ai.hailed = false;
  live.state.lastCombatAt = ctx.world.time;
  live.ai.resolveAt = 0; live.ai.calmUntil = 0;
  tick(5, ENCOUNTER);
  pin(`a ${label} hull is not resampled`, live.state.resolve === 90, live.state.resolve);
  pin(`a ${label} hull opens no new card`,
    since(m, 'hailOpened', live).length === 0 && ctx.hailApi.peek().open === false);
  pin(`a ${label} hull emits no second receipt`, since(m, 'npcSurrendered', live).length === 0);
}
despawn(drifter);
despawn(reaver);

// ---- 5. A stale ORIGINAL surrender card ------------------------------------
const victim = spawn('Parley Runner', 'redledger', 'pirate', 'heavy', LINE());
victim.state.cargo.push({ commodity: 'provisions', units: 6 }); // manifest for the salvage leg
/** Restore the player's claim and force a band change so npc.js redraws. */
function reopenCard() {
  victim.ai.lastAttacker = 'player';
  victim.ai.hailed = false;
  victim.ai.band = 'shaken';
  victim.state.lastCombatAt = ctx.world.time;
  victim.ai.resolveAt = 0; victim.ai.calmUntil = 0;
  tick(1, ENCOUNTER);
  return ctx.hailApi.peek();
}
{
  firePlayer(40);
  pin('the parley fixture carries the player’s own mark', surrenderCauserOf(victim) === 'player');
  pin('and it opens a real bargaining card',
    walkDownTo(victim, 'bargaining') === 'bargaining' && ctx.hailApi.peek().kind === 'surrender',
    ctx.hailApi.peek());

  // (a) An NPC takes the fight over while the card is up. TEST SETUP: the trail
  // is re-stamped exactly as combat.js stamps an effective NPC hit (section 1
  // proves that stamping path against real projectiles).
  victim.ai.lastAttacker = 'npc';
  let before = snap(victim);
  const payout = ctx.hailApi.resolve('demandRansom');
  pin('a stale surrender card refuses the payout', payout === 'stale', payout);
  pin('the refused payout moved nothing', snap(victim) === before,
    { before, after: snap(victim) });
  pin('the stale card is closed', ctx.hailApi.peek().open === false);

  // (b) letGo is refused too — it restarts a flee and rewrites ai state.
  pin('the card reopens once the claim is honest again', reopenCard().kind === 'surrender');
  victim.ai.lastAttacker = 'npc';
  before = snap(victim);
  const letGo = ctx.hailApi.resolve('letGo');
  pin('a stale surrender card refuses letGo', letGo === 'stale', letGo);
  pin('the refused letGo started no flee', snap(victim) === before,
    { before, after: snap(victim) });

  // (c) The claim can also lapse with nobody touching the card: the steady
  // update closes it, still unpaid.
  pin('the card reopens again', reopenCard().kind === 'surrender');
  victim.ai.lastAttacker = 'npc';
  before = snap(victim);
  tick(1, ENCOUNTER);
  pin('a lapsed surrender card closes itself', ctx.hailApi.peek().open === false);
  pin('the self-close paid nothing', snap(victim) === before, { before, after: snap(victim) });

  // (d) The race: an NPC disables the hull while the ransom card is up and the
  // player resolves BEFORE the next hail update. A fresh state.disabled must
  // not make the old ransom card look like a salvage card.
  pin('the card reopens for the disable race', reopenCard().kind === 'surrender');
  victim.state.disabled = true;
  victim.ai.lastAttacker = 'npc';
  before = snap(victim);
  const raced = ctx.hailApi.resolve('demandRansom');
  pin('a disabled hull cannot exempt an old ransom card', raced === 'stale', raced);
  pin('the raced resolution moved nothing', snap(victim) === before,
    { before, after: snap(victim) });

  // (e) A real salvage card on the same wreck is still valid: salvage never
  // rested on a claim about who broke it.
  ctx.targets.current = victim;
  ctx.input.hailPressed = true;
  tick(1, only('hail'));
  ctx.input.hailPressed = false;
  const salvage = ctx.hailApi.peek();
  pin('the H press opens a salvage card on the wreck',
    salvage.open === true && salvage.kind === 'salvage', salvage);
  const stripped = ctx.hailApi.resolve('demandCargo', salvage.conversationId);
  pin('salvage still strips the wreck',
    stripped === '' && victim.state.cargo.length === 0,
    { stripped, cargo: victim.state.cargo.length });
}
despawn(victim);

// ---- 6. The patrol contract fails closed ----------------------------------
{
  patrol.progress = 0;
  // A primitive stand-in: station.js reads the role and the causer word only.
  const ship = { role: 'pirate', record: { role: 'pirate' } };
  ctx.emit('npcSurrendered', { ship, outcome: 'flee', causer: 'world' });
  tick(2, only('station'));
  pin('a world-caused receipt cannot reward the patrol contract', patrol.progress === 0);
  ctx.emit('npcSurrendered', { ship, outcome: 'flee' }); // no causer at all
  tick(2, only('station'));
  pin('an unattributed receipt fails closed', patrol.progress === 0);
  ctx.emit('npcSurrendered', { ship, outcome: 'ransom', causer: 'player' });
  tick(2, only('station'));
  pin('an explicit player receipt still rewards it', patrol.progress === 1, patrol.progress);
}

if (fails) {
  console.log(`ISSUE-99 SURRENDER ATTRIBUTION FAIL — ${fails}`);
  process.exit(1);
}
console.log('ISSUE-99 SURRENDER ATTRIBUTION PASS');
