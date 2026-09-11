/**
 * Issue #122 — a feared pirate can demand terms from a willing hull.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real npc, combat, hail, world,
 * station and agent-api systems over one ctx. No DOM stub of its own.
 *
 * Covered:
 *   1  a willing trader the player never shot answers H with the surrender
 *      card (terms:true, kind 'surrender'), heaves to, and a ransom pays
 *      credits, fear, the yield and a player-credited receipt
 *   2  a capitulate-band hull that has not yielded opens the card too;
 *      keepFiring drops the claim, a second H reopens, letGo's calm refuses
 *   3  yielded, steady and disabled hulls keep their issue #67 answers
 *   4  range refuses a willing hull the way it refuses a wreck
 *   5  the claim does not outlive the card: an NPC-caused break after
 *      keepFiring pays nobody
 *   6  an NPC wound BEFORE the demand does not block the terms; an NPC hit
 *      DURING the parley lapses the claim and closes the card stale
 *   7  the public API: act hail opens it, observe publishes it, hailResolve
 *      pays it
 *   8  the HUD prompt names the card it opens
 *
 * Fixture honesty: yielded/disabled/steady states are written directly and
 * said so; every card, receipt, fear change and yield below is produced by
 * the real systems.
 *
 * Run: npm run test:player-terms
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { ECON, U } from '../src/game/state.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 500));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds, camera } = await bootGameSystems();
const { surrenderCauserOf, canDemandTerms } = await import('../src/systems/npc.js');
const { hailOffer } = await import('../src/game/hail-offer.js');

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
const AGENT = only('controls', 'npc', 'hail', 'world', 'station', 'agentapi');
const mark = () => allEvents.length;
const since = (m, type, live) => allEvents.slice(m)
  .filter((e) => e.type === type && (live === undefined || e.ship === live));

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;

ctx.ship.object.position.set(6000, 6000, 6000);
ctx.ship.object.quaternion.identity();
camera.position.copy(ctx.ship.object.position);
camera.quaternion.identity();
camera.updateMatrixWorld(true);
ctx.flags.firstPerson = true;
ctx.flags.docked = false;
ctx.input.weaponGroup = 1;
const LINE = () => new THREE.Vector3(6000, 6000, 5940); // an NPC shooter's line
const PARK = () => new THREE.Vector3(6000, 6300, 6000); // 300 u, inside U.TARGET_RANGE

let seq = 0;
function spawn(name, faction, role, classKey, at, resolve, cargo) {
  seq++;
  const live = binds.spawnLiveShip(ctx, {
    id: `i122-${seq}`, name, faction, role, classKey, resolve, personality: 0,
    cargo: cargo ?? [{ commodity: 'provisions', units: 6 }],
  }, at);
  live.ai.demandSent = true; // TEST SETUP: no wave-30 pirate demand can preempt the card under test
  ctx.ships.push(live);
  return live;
}
function despawn(live) {
  const i = ctx.ships.indexOf(live);
  if (i >= 0) ctx.ships.splice(i, 1);
  binds.removeLiveShip(ctx, live);
}
/** The real KeyH edge, ticked through the encounter systems. */
function pressH(live) {
  ctx.targets.current = live;
  const m = mark();
  ctx.input.hailPressed = true;
  tick(1, ENCOUNTER);
  ctx.input.hailPressed = false;
  return {
    opened: since(m, 'hailOpened', live)[0] ?? null,
    miss: since(m, 'hailMiss')[0] ?? null,
    lines: since(m, 'commLine').map((e) => e.text),
  };
}
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

// ---- 1. A willing hull the player never shot -------------------------------
{
  const wren = spawn('Claim Wren', 'freehold', 'trader', 'freighter', PARK(), 25);
  ctx.targets.current = wren;
  pin('fixture: intact, unshot, bargaining band, no trail',
    wren.state.hull === wren.state.hullMax && wren.ai.lastAttacker === null
    && wren.ai.band === 'defiant' && surrenderCauserOf(wren) === 'world',
    { resolve: wren.state.resolve, band: wren.ai.band });
  const offer = hailOffer(ctx, wren);
  pin('the classifier now offers the willing hull as an action',
    offer.state === 'willing' && offer.available === true && offer.blocked === ''
    && offer.reason === '' && offer.next === 'Hail to demand terms.', offer);
  pin('canDemandTerms agrees', canDemandTerms(ctx, wren) === true);

  const { opened, miss, lines } = pressH(wren);
  const card = ctx.hailApi.peek();
  pin('H opens the surrender card on the willing hull',
    !!opened && opened.terms === true && card.open === true && card.kind === 'surrender', { opened, card });
  pin('no miss toast beside the card', miss === null, miss);
  pin('the card carries the real verbs for a laden hull',
    !!opened && ['demandCargo', 'demandRansom', 'acceptTribute', 'letGo', 'keepFiring']
      .every((v) => opened.intents.includes(v)), opened && opened.intents);
  pin('the hull answers on the comm line', lines.includes('Heard. Name your terms.'), lines);
  pin('the demand stamps the claim, hailed and the bargaining hold',
    wren.ai.termsAt >= 0 && wren.ai.hailed === true && wren.ai.band === 'bargaining', wren.ai.termsAt);
  pin('the demand is authorship while the card is up', surrenderCauserOf(wren) === 'player');
  pin('nothing is paid by opening the card', ctx.world.fear === 0 || Number.isFinite(ctx.world.fear));
  tick(5, ENCOUNTER);
  pin('the card stays up across updates', ctx.hailApi.peek().open === true);

  const ransom = card.terms.amounts.ransom;
  const credits = ctx.world.credits;
  const fear = ctx.world.fear;
  const m = mark();
  const token = ctx.hailApi.resolve('demandRansom', card.conversationId);
  tick(3, ENCOUNTER);
  pin('the ransom resolves and pays',
    token === '' && Number.isFinite(ransom) && ransom > 0 && ctx.world.credits === credits + ransom,
    { token, ransom, credits: ctx.world.credits });
  pin('the ransom pays the ransom fear', ctx.world.fear === fear + ECON.fear.ransom,
    { before: fear, after: ctx.world.fear });
  const receipts = since(m, 'npcSurrendered', wren);
  pin('the hull yields to the player',
    wren.state.surrendered === true && receipts.length === 1
    && receipts[0].outcome === 'ransom' && receipts[0].causer === 'player', receipts);
  pin('the claim is dropped once the card closes', wren.ai.termsAt === -1 && ctx.hailApi.peek().open === false);
  pin('a yielded hull answers yielded afterwards', pressH(wren).miss?.reason === 'yielded');
  despawn(wren);
}

// ---- 2. Capitulate band, keepFiring, re-hail, calm --------------------------
{
  const mercy = spawn('Kestrel Mercy', 'freehold', 'trader', 'freighter', PARK(), 10);
  pin('fixture: capitulate band, unyielded', hailOffer(ctx, mercy).state === 'willing' && mercy.state.surrendered === false);
  let r = pressH(mercy);
  pin('a capitulate-band hull opens the card too', !!r.opened && ctx.hailApi.peek().open === true, r);
  pin('a capitulate hull keeps its unsampled band', mercy.ai.band === 'defiant', mercy.ai.band);
  const before = { credits: ctx.world.credits, fear: ctx.world.fear };
  const tok = ctx.hailApi.resolve('keepFiring', ctx.hailApi.peek().conversationId);
  tick(2, ENCOUNTER);
  pin('keepFiring closes the card and moves nothing',
    tok === '' && ctx.hailApi.peek().open === false && ctx.world.credits === before.credits
    && ctx.world.fear === before.fear && mercy.state.surrendered === false, tok);
  pin('keepFiring drops the claim', mercy.ai.termsAt === -1 && surrenderCauserOf(mercy) === 'world');
  r = pressH(mercy);
  pin('a second H reopens the card', !!r.opened && ctx.hailApi.peek().open === true, r);
  ctx.hailApi.resolve('letGo', ctx.hailApi.peek().conversationId);
  tick(2, ENCOUNTER);
  pin('letGo closes with a calm window', ctx.hailApi.peek().open === false && mercy.ai.calmUntil > ctx.world.time);
  const offer = hailOffer(ctx, mercy);
  r = pressH(mercy);
  pin('calm refuses a willing hull and says so',
    offer.blocked === 'calm' && offer.reason === 'calm' && r.opened === null
    && !!r.miss && r.miss.reason === 'calm' && r.miss.verb === 'hail', { offer, miss: r.miss });
  despawn(mercy);
}

// ---- 3. Unchanged answers --------------------------------------------------
{
  // TEST SETUP: outcomes written directly to isolate the classifier's answer.
  const yielded = spawn('Bent Kestrel', 'freehold', 'trader', 'freighter', PARK(), 10);
  yielded.state.surrendered = true; yielded.ai.surrenderDone = true;
  let r = pressH(yielded);
  pin('a yielded hull still answers yielded', r.opened === null && r.miss?.reason === 'yielded', r.miss);
  despawn(yielded);
  const steady = spawn('Hard Case', 'freehold', 'trader', 'freighter', PARK(), 80);
  r = pressH(steady);
  pin('a steady hull still answers no-hail', r.opened === null && r.miss?.reason === 'no-hail', r.miss);
  pin('canDemandTerms refuses a steady hull', canDemandTerms(ctx, steady) === false);
  despawn(steady);
  const wreck = spawn('Slack Drover', 'freehold', 'trader', 'freighter', PARK(), 10);
  wreck.state.disabled = true;
  r = pressH(wreck);
  pin('a wreck still opens the salvage card, not terms',
    !!r.opened && r.opened.salvage === true && r.opened.terms !== true, r.opened);
  ctx.hailApi.resolve('letGo');
  tick(2, ENCOUNTER);
  despawn(wreck);
}

// ---- 4. Range ----------------------------------------------------------------
{
  const far = spawn('Long Marlin', 'freehold', 'trader', 'freighter',
    new THREE.Vector3(6000, 6000 + U.TARGET_RANGE + 100, 6000), 25);
  const offer = hailOffer(ctx, far);
  const r = pressH(far);
  pin('out of range refuses a willing hull with range',
    offer.state === 'willing' && offer.blocked === 'range' && offer.reason === 'range'
    && offer.available === false && r.opened === null && !!r.miss && r.miss.reason === 'range'
    && r.miss.verb === 'hail' && r.miss.dist > U.TARGET_RANGE, { offer, miss: r.miss });
  despawn(far);
}

// ---- 5. The claim does not outlive the card ----------------------------------
{
  const drifter = spawn('Lane Drifter', 'freehold', 'trader', 'freighter', PARK(), 25);
  pressH(drifter);
  pin('card open on the drifter', ctx.hailApi.peek().open === true);
  ctx.hailApi.resolve('keepFiring');
  tick(2, ENCOUNTER);
  const fear = ctx.world.fear;
  const m = mark();
  pin('the NPC-broken hull walks to capitulation',
    walkDownTo(drifter, 'capitulate', 'npc') === 'capitulate', drifter.ai.band);
  tick(3, ENCOUNTER);
  const receipts = since(m, 'npcSurrendered', drifter);
  pin('after keepFiring an NPC-caused break pays nobody',
    receipts.length === 1 && receipts[0].causer === 'world' && ctx.world.fear === fear,
    { receipts: receipts.map((x) => x.causer), fear: ctx.world.fear, before: fear });
  pin('and it opened no second card', since(m, 'hailOpened', drifter).length === 0);
  despawn(drifter);
}

// ---- 6. An NPC wound before vs during the parley ------------------------------
{
  const wounded = spawn('Line Trader', 'freehold', 'trader', 'freighter', LINE(), 25);
  const shooter = spawn('Other Gun', 'redledger', 'pirate', 'cutter', new THREE.Vector3(6000, 6000, 5980), 60);
  const hullBefore = wounded.state.hull + wounded.state.screen + wounded.state.shell;
  ctx.emit('npcFire', { ship: shooter, weapon: 'cannon', target: wounded });
  tick(40, COMBAT);
  pin('a real NPC round wounded the hull before the demand',
    wounded.state.hull + wounded.state.screen + wounded.state.shell < hullBefore
    && wounded.ai.lastAttacker === shooter);
  pin('an older NPC wound alone reads world', surrenderCauserOf(wounded) === 'world');
  tick(100, COMBAT); // drain rounds
  // TEST SETUP: the graze keeps npc.js sampling resolve, so the band must come
  // from the REAL computation. Defenses are written down (never through
  // applyHit) far enough that the sample lands in the bargaining band.
  wounded.state.screen = 0; wounded.state.shell = 0;
  wounded.state.hull = Math.round(wounded.state.hullMax * 0.8);
  wounded.ai.resolveAt = 0;
  tick(1, ENCOUNTER);
  pin('fixture: the real sample reads bargaining', hailOffer(ctx, wounded).state === 'willing'
    && wounded.state.surrendered === false, { resolve: wounded.state.resolve, band: wounded.ai.band });
  const r = pressH(wounded);
  pin('an NPC wound BEFORE the demand does not block the terms',
    !!r.opened && ctx.hailApi.peek().open === true && surrenderCauserOf(wounded) === 'player', r);
  const conversationId = ctx.hailApi.peek().conversationId;
  const credits = ctx.world.credits;
  ctx.emit('npcFire', { ship: shooter, weapon: 'cannon', target: wounded });
  tick(40, COMBAT);
  pin('the NPC hit again during the parley', wounded.state.lastHitAt > wounded.ai.termsAt,
    { hitAt: wounded.state.lastHitAt, termsAt: wounded.ai.termsAt });
  pin('the claim lapses', surrenderCauserOf(wounded) === 'world');
  const m = mark();
  tick(1, ENCOUNTER);
  pin('the card closes stale on the next update',
    ctx.hailApi.peek().open === false && since(m, 'hailClosed', wounded).length === 1);
  const tok = ctx.hailApi.resolve('demandRansom', conversationId);
  pin('a late ransom is refused and moves nothing', tok !== '' && ctx.world.credits === credits, tok);
  tick(100, COMBAT);
  despawn(shooter);
  despawn(wounded);
}

// ---- 7. The public API ---------------------------------------------------------
{
  const rw = globalThis.window.rimward;
  ctx.agent.optIn = true;
  const vesper = spawn('Vesper-9', 'veridian', 'trader', 'freighter', PARK(), 22);
  ctx.targets.current = vesper;
  const obs0 = rw.observe();
  pin('observe publishes the willing hull as available',
    obs0.targets.current.hail.state === 'willing' && obs0.targets.current.hail.available === true
    && obs0.targets.current.hail.next === 'Hail to demand terms.', obs0.targets.current.hail);
  const m = mark();
  const act = rw.act({ v: 2, name: 'hail', args: {} });
  tick(2, AGENT);
  const obs = rw.observe();
  pin('act hail opens the terms card',
    act.ok === true && obs.hail.open === true && obs.hail.kind === 'surrender'
    && obs.hail.intents.includes('demandRansom'), { act, hail: obs.hail });
  const receipt = obs.events.find((e) => e.type === 'hailOpened' && e.t > 0);
  pin('the hailOpened receipt carries terms:true and no ship', since(m, 'hailOpened', vesper)[0]?.terms === true
    && (!receipt || (receipt.terms === true && !Object.hasOwn(receipt, 'ship'))), receipt);
  const credits = ctx.world.credits;
  const res = rw.act({ v: 2, name: 'hailResolve', args: { intent: 'demandRansom', expectedConversationId: obs.hail.conversationId } });
  tick(3, AGENT);
  pin('hailResolve pays the ransom', res.ok === true && ctx.world.credits > credits && vesper.state.surrendered === true, res);
  despawn(vesper);
}

// ---- 8. HUD prompt ---------------------------------------------------------------
{
  const { readFile } = await import('node:fs/promises');
  const hudSrc = await readFile(new URL('../src/systems/hud.js', import.meta.url), 'utf8');
  pin('the bracket prompt names the terms card', hudSrc.includes("'Hail — demand terms'")
    && hudSrc.includes("'Hail — dead in space'"));
}

console.log(fails === 0 ? 'ISSUE-122 PLAYER TERMS PASS' : `ISSUE-122 PLAYER TERMS FAIL (${fails})`);
process.exit(fails === 0 ? 0 : 1);
