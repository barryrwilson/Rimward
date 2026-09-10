/**
 * Issue #98 — a hull that surrenders can be told to dump its holds.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real npc, combat, hail, pods,
 * world and station systems over one ctx, plus the real public handle
 * (window.rimward observe/act). No DOM stub of its own and no copied boot.
 * Every offer below is read through the public observe().hail, and every
 * resolution runs through the public hailResolve — EXCEPT the stale-claim pin
 * (section 6), which calls ctx.hailApi.resolve directly so the card API's own
 * 'stale' token is read at that boundary rather than through the public wrapper.
 *
 * Covered:
 *   1  a LOADED, player-broken hull offers 'demandCargo' on the surrender card,
 *      published through observe().hail.intents with the live-hull label
 *   2  the bound public hailResolve dumps the ordinary manifest as pods, clears
 *      the manifest, pays fear +2 and NO credits, marks the yield, starts the
 *      escape flee, and emits exactly one player-attributed receipt
 *   3  a second resolve of the same card moves nothing
 *   4  an EMPTY hold omits the verb, and a call naming it is refused and moves
 *      nothing (the card stays open — nothing was resolved)
 *   5  an NPC-caused break offers no card at all, so nobody can take its cargo
 *   6  a stale claim (an NPC took the fight over) refuses the cargo demand with
 *      'stale' and moves nothing
 *   7  the berth still refuses a loaded surrender card with 'docked' (issue
 *      #100) and moves nothing
 *   8  a DISABLED hull's salvage card is unchanged: cargo dumps, no fear, no
 *      yield receipt
 *   9  the wave-30 pirate demand hail is unchanged — a loaded pirate that
 *      demands tribute still offers only its own three verbs
 *
 * Fixture honesty: where a pin needs a rare hull state (a manifest, very low
 * defenses, a fresh lastCombatAt, an attacker stamp, state.disabled, the
 * docked flag) it is written directly and said so. No pin ever writes an
 * OUTCOME — the offered verbs, the pods, the fear, state.surrendered, the
 * escape and the receipts are always produced by the real systems.
 *
 * Run: npm run test:surrender-cargo
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { ECON } from '../src/game/state.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds, camera } = await bootGameSystems();
const { surrenderCauserOf } = await import('../src/systems/npc.js');

const rw = globalThis.window.rimward;
pin('the public handle is present',
  !!(rw && typeof rw.act === 'function' && typeof rw.observe === 'function'));
// TEST SETUP: the agent bridge is opt-in. This is the one bit the enable
// button sets; every action below still runs through the public act().
ctx.agent.optIn = true;

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
const ENCOUNTER = only('npc', 'hail', 'world', 'station', 'pods');
const mark = () => allEvents.length;
const since = (m, type, live) => allEvents.slice(m)
  .filter((e) => e.type === type && (live === undefined || e.ship === live));

const observeHail = () => rw.observe().hail;
const actResolve = (args) => rw.act({ v: 2, name: 'hailResolve', args });

// New game from the title screen, then clear the lane: traffic's own hulls are
// in no pin below, and traffic is never ticked again after this point.
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;

// Same firing fixture scripts/issue-99-surrender-attribution-test.mjs uses: the
// player alone in open space, first-person, cannon group, targets 60 units -Z.
ctx.ship.object.position.set(6000, 6000, 6000);
ctx.ship.object.quaternion.identity();
camera.position.copy(ctx.ship.object.position);
camera.quaternion.identity();
camera.updateMatrixWorld(true);
ctx.flags.firstPerson = true;
ctx.flags.docked = false;
ctx.input.weaponGroup = 1;
const LINE = () => new THREE.Vector3(6000, 6000, 5940); // the cannon's line
const PARK = () => new THREE.Vector3(6000, 6300, 6000); // off the line, in range

let seq = 0;
function spawn(name, faction, role, classKey, at, extra = {}) {
  seq++;
  const { wantDemand = false, ...rec } = extra;
  const live = binds.spawnLiveShip(ctx, {
    id: `i98-${seq}`, name, faction, role, classKey, resolve: 60, personality: 0, ...rec,
  }, at);
  // TEST SETUP: suppress the wave-30 pirate demand hail so the only card the
  // surrender pins can see is the surrender card under test. Section 9 spawns
  // its demand pirate with wantDemand, which leaves this alone.
  if (!wantDemand) live.ai.demandSent = true;
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
 * TEST SETUP: an ORDINARY manifest, written onto the hull directly. rawOre and
 * refinedMetals are plain bulk commodities (state.js COMMODITIES), never data
 * rows, so the existing spill really is expected to pod every one of them.
 */
function loadHolds(live, rows) {
  live.state.cargo.length = 0;
  for (const row of rows) live.state.cargo.push({ ...row });
  return rows.map((r) => `${r.commodity}:${r.units}`).join(',');
}
const MANIFEST = [{ commodity: 'rawOre', units: 5 }, { commodity: 'refinedMetals', units: 3 }];

/**
 * TEST SETUP for the band walk (verbatim from the issue #99 runner). Hull is
 * written DOWN directly (never through applyHit, so it cannot trip the disabled
 * threshold), lastCombatAt is kept fresh so npc.js keeps sampling resolve, and
 * calm is cleared. `attacker` re-stamps the trail only when passed. The OUTCOME
 * is never written: npc.js computes the band and opens or withholds the card.
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

/** Everything a cargo demand would move. Compared across every refusal. */
function snap(live) {
  return JSON.stringify({
    credits: ctx.world.credits,
    fear: ctx.world.fear,
    pods: ctx.pods.length,
    cargo: live.state.cargo.map((r) => `${r.commodity}:${r.units}`).join(','),
    surrendered: live.state.surrendered,
    mode: live.ai.mode,
    target: typeof live.ai.target === 'string' ? live.ai.target : !!live.ai.target,
    calmUntil: live.ai.calmUntil,
    escape: !!(live.record && live.record.escape),
  });
}

/** Only what a cargo demand PAYS: no ai bookkeeping the berth may also touch. */
function payoutSnap(live) {
  return JSON.stringify({
    credits: ctx.world.credits,
    fear: ctx.world.fear,
    pods: ctx.pods.length,
    cargo: live.state.cargo.map((r) => `${r.commodity}:${r.units}`).join(','),
    surrendered: live.state.surrendered,
  });
}

/** New pods carrying one of the named commodities, as 'commodity:units'. */
function podsSince(count, commodities) {
  const out = [];
  for (let i = count; i < ctx.pods.length; i++) {
    const rows = ctx.pods[i] && ctx.pods[i].contents;
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (row && commodities.includes(row.commodity)) out.push(`${row.commodity}:${row.units | 0}`);
    }
  }
  return out.sort();
}
const WANT_PODS = MANIFEST.map((r) => `${r.commodity}:${r.units}`).sort();

/** Open a fresh player-caused surrender card on a loaded hull. */
function openLoadedSurrender(name) {
  const live = spawn(name, 'redledger', 'pirate', 'heavy', LINE());
  loadHolds(live, MANIFEST);
  firePlayer(40);
  walkDownTo(live, 'bargaining');
  return live;
}
/** Restore the player's claim and force a band change so npc.js redraws. */
function reopenCard(live) {
  live.ai.lastAttacker = 'player';
  live.ai.hailed = false;
  live.ai.band = 'shaken';
  live.state.lastCombatAt = ctx.world.time;
  live.ai.resolveAt = 0; live.ai.calmUntil = 0;
  tick(1, ENCOUNTER);
  return ctx.hailApi.peek();
}

// The patrol contract is the station-side consumer of a player yield. need is
// pinned high so it never completes: progress itself is the pin.
const patrol = ctx.world.jobs.find((j) => j.kind === 'patrol');
patrol.state = 'accepted'; patrol.progress = 0; patrol.need = 99;

// ---- 1. A loaded, player-broken hull offers the cargo demand ---------------
const loaded = spawn('Line Hauler', 'redledger', 'pirate', 'heavy', LINE());
const loadedManifest = loadHolds(loaded, MANIFEST);
{
  const before = loaded.state.hull;
  firePlayer(40);
  pin('a real player cannon round wounded the fixture', loaded.state.hull < before
    || surrenderCauserOf(loaded) === 'player', { hull: loaded.state.hull, before });
  pin('the fixture is a live hull, not a wreck',
    loaded.state.disabled === false && loaded.state.destroyed === false);
  pin('the break belongs to the player', surrenderCauserOf(loaded) === 'player');

  const m = mark();
  pin('the loaded hull reaches the bargaining band',
    walkDownTo(loaded, 'bargaining') === 'bargaining',
    { resolve: loaded.state.resolve, band: loaded.ai.band });
  pin('the holds are still full at card time', loaded.state.cargo.length === MANIFEST.length,
    loaded.state.cargo);
  const card = observeHail();
  pin('a surrender card opened',
    since(m, 'hailOpened', loaded).length === 1 && card.open === true && card.kind === 'surrender',
    card);
  pin('the PUBLIC observation offers demandCargo', card.intents.includes('demandCargo'), card.intents);
  pin('it is offered alongside the ordinary surrender verbs',
    card.intents.includes('demandRansom') && card.intents.includes('letGo')
    && card.intents.includes('keepFiring'), card.intents);
  const option = card.terms.options.find((o) => o.intent === 'demandCargo');
  pin('the button reads as a live-hull demand, not salvage',
    !!option && option.label.includes('Demand cargo'), option);
  pin('the private card agrees with the public one',
    JSON.stringify(ctx.hailApi.peek().intents) === JSON.stringify(card.intents),
    { peek: ctx.hailApi.peek().intents, observed: card.intents });

  // ---- 2. The bound public resolution ------------------------------------
  const credits = ctx.world.credits;
  const fear = ctx.world.fear;
  const podsBefore = ctx.pods.length;
  const m2 = mark();
  const receipt = actResolve({ intent: 'demandCargo', expectedConversationId: card.conversationId });
  tick(3, ENCOUNTER);
  pin('the bound public hailResolve is accepted', receipt && receipt.ok === true, receipt);
  pin('the ordinary manifest is podded exactly once, unit for unit',
    JSON.stringify(podsSince(podsBefore, ['rawOre', 'refinedMetals'])) === JSON.stringify(WANT_PODS),
    { want: WANT_PODS, got: podsSince(podsBefore, ['rawOre', 'refinedMetals']), manifest: loadedManifest });
  pin('the hull manifest is cleared', loaded.state.cargo.length === 0, loaded.state.cargo);
  pin('a cargo demand pays the capitulation fear and no more',
    ctx.world.fear === fear + ECON.fear.capitulation,
    { before: fear, after: ctx.world.fear, want: ECON.fear.capitulation });
  pin('a cargo demand pays NO credits', ctx.world.credits === credits,
    { before: credits, after: ctx.world.credits });
  pin('the hull is marked yielded', loaded.state.surrendered === true);
  pin('the hull is running for a refuge',
    loaded.ai.mode === 'flee' && !!(loaded.record && loaded.record.escape),
    { mode: loaded.ai.mode, escape: !!(loaded.record && loaded.record.escape) });
  const receipts = since(m2, 'npcSurrendered', loaded);
  pin('exactly one receipt, a jettison credited to the player',
    receipts.length === 1 && receipts[0].causer === 'player' && receipts[0].outcome === 'jettison',
    receipts.map((r) => ({ causer: r.causer, outcome: r.outcome })));
  pin('the card closed on the payout', observeHail().open === false, observeHail());
  pin('the yield ticks the patrol contract once', patrol.progress === 1, patrol.progress);

  // ---- 3. A second resolve moves nothing ---------------------------------
  const before2 = snap(loaded);
  const again = actResolve({ intent: 'demandCargo', expectedConversationId: card.conversationId });
  tick(2, ENCOUNTER);
  pin('a duplicate cargo demand is refused', !!again && again.ok === false, again);
  pin('the duplicate moved nothing', snap(loaded) === before2,
    { before: before2, after: snap(loaded) });
}
despawn(loaded);

// ---- 4. An empty hold omits the verb --------------------------------------
const empty = spawn('Line Empty', 'redledger', 'pirate', 'heavy', LINE());
{
  empty.state.cargo.length = 0; // TEST SETUP: an explicitly empty manifest
  firePlayer(40);
  pin('the empty fixture is the player’s own break', surrenderCauserOf(empty) === 'player');
  const m = mark();
  pin('the empty hull still reaches the bargaining band',
    walkDownTo(empty, 'bargaining') === 'bargaining', empty.ai.band);
  const card = observeHail();
  pin('an empty hull opens the surrender card',
    since(m, 'hailOpened', empty).length === 1 && card.kind === 'surrender', card);
  pin('an empty hold offers NO cargo demand', !card.intents.includes('demandCargo'), card.intents);
  pin('no button promises cargo either',
    !card.terms.options.some((o) => o.intent === 'demandCargo'), card.terms.options);
  pin('the ordinary surrender verbs are untouched',
    card.intents.includes('demandRansom') && card.intents.includes('letGo'), card.intents);

  const before = snap(empty);
  const refused = actResolve({ intent: 'demandCargo', expectedConversationId: card.conversationId });
  tick(2, ENCOUNTER);
  pin('an unlisted cargo demand is refused', !!refused && refused.ok === false, refused);
  pin('the refusal moved nothing', snap(empty) === before, { before, after: snap(empty) });
  pin('and the card the player is reading is still open',
    observeHail().open === true && observeHail().conversationId === card.conversationId,
    observeHail());
}
despawn(empty);

// ---- 5. An NPC-caused break offers nothing to take ------------------------
const stolen = spawn('Lane Prize', 'redledger', 'pirate', 'freighter', PARK());
{
  const manifest = loadHolds(stolen, MANIFEST);
  const m = mark();
  pin('the NPC-broken hull reaches the bargaining band',
    walkDownTo(stolen, 'bargaining', 'npc') === 'bargaining', stolen.ai.band);
  pin('an NPC-caused break opens no card',
    since(m, 'hailOpened').length === 0 && observeHail().open === false, observeHail());
  const before = snap(stolen);
  const refused = actResolve({ intent: 'demandCargo' });
  tick(2, ENCOUNTER);
  pin('a cargo demand with no card is refused', !!refused && refused.ok === false, refused);
  pin('the other pilot’s prize is untouched',
    snap(stolen) === before && stolen.state.cargo.length === MANIFEST.length,
    { before, after: snap(stolen), manifest });
}
despawn(stolen);

// ---- 6. A stale claim refuses the cargo demand ----------------------------
const stale = openLoadedSurrender('Parley Hauler');
{
  pin('the stale fixture opens a real surrender card',
    observeHail().kind === 'surrender' && observeHail().intents.includes('demandCargo'),
    observeHail());
  // TEST SETUP: the trail is re-stamped exactly as combat.js stamps an
  // effective NPC hit — the issue #99 runner proves that stamping path against
  // real projectiles.
  stale.ai.lastAttacker = 'npc';
  const before = snap(stale);
  const token = ctx.hailApi.resolve('demandCargo');
  pin('a stale surrender card refuses the cargo demand', token === 'stale', token);
  pin('the refused cargo demand moved nothing', snap(stale) === before,
    { before, after: snap(stale) });
  pin('the stale card is closed', observeHail().open === false);
}

// ---- 7. The berth still refuses (issue #100) ------------------------------
{
  pin('the card reopens for the berth pin', reopenCard(stale).intents.includes('demandCargo'),
    ctx.hailApi.peek());
  const before = snap(stale);
  const paidBefore = payoutSnap(stale);
  ctx.flags.docked = true; // TEST SETUP: the one flag station.js dock() writes
  const refused = actResolve({ intent: 'demandCargo' });
  pin('a docked player cannot take a surrendered hull’s cargo',
    !!refused && refused.ok === false && refused.error === 'docked', refused);
  pin('the refusal itself moved nothing', snap(stale) === before,
    { before, after: snap(stale) });
  tick(2, ENCOUNTER);
  // The berth's own npc behaviour (a hunter dropping a docked target) is not a
  // payout, so the post-tick pin reads only what a resolution would move.
  pin('nothing was paid, taken or feared at the berth', payoutSnap(stale) === paidBefore,
    { before: paidBefore, after: payoutSnap(stale) });
  pin('and the card is off the desk', observeHail().open === false);
  ctx.flags.docked = false;
  tick(2, ENCOUNTER);
}

// ---- 8. Salvage on a disabled hull is unchanged ---------------------------
{
  const manifest = loadHolds(stale, MANIFEST);
  stale.state.disabled = true; // TEST SETUP: the wreck state combat.js writes
  stale.ai.lastAttacker = 'player';
  tick(2, ENCOUNTER);
  ctx.targets.current = stale;
  ctx.input.hailPressed = true;
  tick(1, only('hail'));
  ctx.input.hailPressed = false;
  const card = observeHail();
  pin('the H press opens a salvage card on the wreck',
    card.open === true && card.kind === 'salvage', card);
  pin('the wreck still offers its cargo', card.intents.includes('demandCargo'), card.intents);
  const option = card.terms.options.find((o) => o.intent === 'demandCargo');
  pin('and it reads as salvage', !!option && option.label.includes('Salvage cargo'), option);

  const fear = ctx.world.fear;
  const credits = ctx.world.credits;
  const podsBefore = ctx.pods.length;
  const m = mark();
  const receipt = actResolve({ intent: 'demandCargo', expectedConversationId: card.conversationId });
  tick(3, ENCOUNTER);
  pin('salvage still strips the wreck', !!receipt && receipt.ok === true
    && stale.state.cargo.length === 0, { receipt, cargo: stale.state.cargo, manifest });
  pin('the wreck’s manifest is podded unit for unit',
    JSON.stringify(podsSince(podsBefore, ['rawOre', 'refinedMetals'])) === JSON.stringify(WANT_PODS),
    podsSince(podsBefore, ['rawOre', 'refinedMetals']));
  pin('stripping a wreck pays NO fear', ctx.world.fear === fear,
    { before: fear, after: ctx.world.fear });
  pin('and no credits', ctx.world.credits === credits);
  pin('and emits no yield receipt', since(m, 'npcSurrendered', stale).length === 0);
}
despawn(stale);

// ---- 9. The wave-30 demand hail is unchanged -----------------------------
{
  // A REAL demand hail: this pirate keeps its demandSent unset, hunts the
  // player by contract, and npc.js emits the demand itself.
  // TEST SETUP: the new game's launch grace (origins.js jumpGraceUntil) still
  // stands after this many ticks, and no pirate may acquire the player inside
  // it. The clock is advanced past that grace — the same wait a real session
  // serves — and nothing else about the encounter is staged.
  const grace = ctx.world.jumpGraceUntil ?? 0;
  if (ctx.world.time <= grace) ctx.world.time = grace + 1;
  const p = ctx.ship.object.position;
  const pirate = spawn('Demand Runner', 'redledger', 'pirate', 'cutter',
    new THREE.Vector3(p.x + 40, p.y + 40, p.z), { alwaysHuntsPlayer: true, wantDemand: true });
  const manifest = loadHolds(pirate, MANIFEST);
  const m = mark();
  let card = observeHail();
  for (let i = 0; i < 180 && card.open !== true; i++) {
    tick(1, ENCOUNTER);
    card = observeHail();
  }
  pin('a loaded pirate still opens its tribute demand',
    card.open === true && card.kind === 'demand' && since(m, 'hailOpened', pirate).length >= 1,
    {
      card,
      ai: {
        mode: pirate.ai.mode,
        role: pirate.ai.role,
        target: typeof pirate.ai.target === 'string' ? pirate.ai.target : !!pirate.ai.target,
        demandSent: pirate.ai.demandSent,
        demanding: pirate.ai.demanding,
        calmUntil: pirate.ai.calmUntil,
      },
      time: ctx.world.time,
      dist: pirate.object.position.distanceTo(ctx.ship.object.position),
    });
  pin('a demand hail offers no cargo verb', !card.intents.includes('demandCargo'), card.intents);
  pin('it offers exactly its own verbs',
    card.intents.every((i) => ['payTribute', 'showTeeth', 'refuseFight'].includes(i))
    && card.intents.includes('payTribute') && card.intents.includes('refuseFight'),
    card.intents);
  pin('and the pirate keeps its own holds', pirate.state.cargo.length === MANIFEST.length,
    { manifest, cargo: pirate.state.cargo });
  despawn(pirate);
}

if (fails) {
  console.log(`ISSUE-98 SURRENDER CARGO FAIL — ${fails}`);
  process.exit(1);
}
console.log('ISSUE-98 SURRENDER CARGO PASS');
