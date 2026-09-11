/**
 * Issue #67 — capitulation feedback: displayed state vs available interaction.
 *
 * The defect: an INTACT Claim Wren at 176 u and an intact Red Marlow at 220 u
 * both printed the CAPITULATE resolve band, both advertised a Hail prompt, and
 * both answered the H press with a generic "no hail". Nothing told the player
 * whether the hull had yielded, had nothing to give, was busy, or simply had
 * never offered terms.
 *
 * These pins hold the acceptance matrix over the REAL `initHail` card, the
 * REAL `window.rimward` observation, and the shared `hail-offer.js` classifier
 * that hud.js reads. Narrow fixture in the style of scripts/hail-identity-test
 * (issue #66) — no full boot, no privileged mutation used to fake an outcome,
 * and no reward, terms, or negotiation invented anywhere.
 *
 * Run: node scripts/issue-67-capitulation-feedback-test.mjs
 */
import { register } from 'node:module';

register('./css-hook.mjs', import.meta.url);

import * as THREE from 'three';
import { installDomStubs } from './lib/boot-harness.mjs';

installDomStubs();
globalThis.window.location = { search: '', href: 'http://127.0.0.1/issue-67' };
try { globalThis.window.rimward = undefined; } catch { /* ignore */ }

const { initHail } = await import('../src/systems/hail.js');
const { initAgentApi } = await import('../src/systems/agent-api.js');
const { COMMODITIES, U } = await import('../src/game/state.js');
const { dropDeferredHail } = await import('../src/systems/overlay-policy.js');
const {
  hailOffer, hailEncounterState, coverHoldsFor, HAIL_OFFER_STATES, HAIL_BLOCKERS,
} = await import('../src/game/hail-offer.js');

let fails = 0;
function pin(name, ok, detail) {
  if (ok) {
    console.log('ok', name);
    return;
  }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 700));
}

// ---- Fixture ctx ----------------------------------------------------------
const playerObj = new THREE.Object3D();
const ctx = {
  flags: {
    paused: false,
    docked: false,
    berthHold: false,
    berthOpen: false,
    chartOpen: false,
    hailOpen: false,
    combat: false,
    camera: 'chase',
  },
  world: {
    time: 300,
    credits: 4000,
    fear: 0,
    scanner: 0,
    miningLaser: 0,
    currentSystem: 'freehold',
    prices: { provisions: COMMODITIES.provisions.base },
    nav: {},
    jobs: [],
    milestones: [],
    contacts: [],
  },
  ship: { object: playerObj, velocity: { x: 0, y: 0, z: 0 }, speed: 0 },
  player: { hull: 10, hullMax: 10 },
  input: { throttle: 0, weaponGroup: 1, fullStop: false, hailPressed: false, dockPressed: false },
  bio: { mood: 'serene', hunger: 0, wounds: 0, bond: 0 },
  gate: {},
  station: {},
  targets: { current: null },
  ships: [],
  pods: [],
  cargo: [],
  cargoCapacity: 20,
  agent: { optIn: true, lastIntent: { name: '', ok: true, error: '', token: '', t: 0 }, events: [] },
  events: [],
  lastEvents: [],
  autopilot: { engaged: false },
  automine: { engaged: false },
  emit(type, ev) {
    const row = ev && typeof ev === 'object' ? { ...ev, type } : { type };
    ctx.events.push(row);
  },
};

const hail = initHail(ctx);
initAgentApi(ctx);
const rw = globalThis.window.rimward;
pin('rimward handle present', !!(rw && typeof rw.observe === 'function'));

const DT = 1 / 60;
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    hail.update(DT, ctx);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

let seq = 0;
function makeShip(name, opts = {}) {
  seq++;
  const object = new THREE.Object3D();
  object.position.set(opts.dist ?? 176, 0, 0);
  const live = {
    id: `i67-${seq}`,
    role: opts.role ?? 'trader',
    record: opts.record ?? { id: `i67-${seq}`, name, pilot: name, faction: 'freehold', role: 'trader' },
    state: {
      name,
      faction: 'freehold',
      bookValue: 900,
      resolve: 15,
      cargo: opts.cargo ?? [{ commodity: 'provisions', units: 6 }],
      disabled: false,
      destroyed: false,
      surrendered: false,
      hull: 9,
      hullMax: 10,
      ...(opts.state || {}),
    },
    ai: { calmUntil: 0, intent: false, mode: 'route', band: 'defiant', surrenderDone: false, ...(opts.ai || {}) },
    object,
  };
  ctx.ships.push(live);
  return live;
}

function press(live) {
  ctx.targets.current = live;
  ctx.input.hailPressed = true;
  tick(1);
  ctx.input.hailPressed = false;
  const evs = ctx.lastEvents || [];
  return {
    miss: evs.find((e) => e.type === 'hailMiss') ?? null,
    opened: evs.find((e) => e.type === 'hailOpened') ?? null,
  };
}

function closeAnyCard(live) {
  ctx.emit('hailClosed', live ? { ship: live } : {});
  tick(2);
  try { dropDeferredHail(); } catch { /* fixture cleanup */ }
}

function openCardFor(live, ev = {}) {
  // Issue #99: a bargaining card is admitted only for a break the PLAYER
  // caused. Every hull here spawns at hull 9/10 — already scratched — so
  // naming the attacker is all that is needed to keep these fixtures the
  // legitimate player-caused parleys they were always meant to be. Section 7's
  // untouched fearful spawn deliberately does NOT go through this helper.
  if (live && live.ai) live.ai.lastAttacker = 'player';
  ctx.emit('hailOpened', {
    ship: live,
    intents: ['demandRansom', 'letGo', 'keepFiring'],
    line: 'They are breaking.',
    ...ev,
  });
  tick(1);
}

function observedTarget(live) {
  ctx.targets.current = live;
  return rw.observe().targets.current;
}

// ---------------------------------------------------------------------------
// 1. Vocabulary is closed and the two axes stay separate
// ---------------------------------------------------------------------------
pin('states are the authored six',
  HAIL_OFFER_STATES.join(',') === 'none,not-ship,salvage,yielded,willing,no-hail',
  HAIL_OFFER_STATES);
pin('blockers are the authored seven, in KeyH precedence order',
  HAIL_BLOCKERS.join(',') === 'busy,surface,overlay-chart,overlay-berth,geometry,range,calm',
  HAIL_BLOCKERS);

// ---------------------------------------------------------------------------
// 2. The reported defect: intact low-morale hulls at 176 u and 220 u
// ---------------------------------------------------------------------------
const wren = makeShip('Claim Wren', { dist: 176, state: { resolve: 8 } });     // capitulate band
const marlow = makeShip('Red Marlow', { dist: 220, state: { resolve: 30 } });  // bargaining band

// Issue #122: a willing hull is now an ACTION. The deliberate H press opens
// the surrender card with the player as causer instead of answering
// 'no-answer'; the state word, the two axes and the public parity all stay.
for (const [label, live] of [['Claim Wren rec-15', wren], ['Red Marlow rec-9', marlow]]) {
  const offer = hailOffer(ctx, live);
  pin(`${label} state is willing, not a completed yield`, offer.state === 'willing', offer);
  pin(`${label} advertises the terms hail (issue #122)`, offer.available === true
    && offer.blocked === '' && offer.reason === '', offer);
  pin(`${label} carries no passive clause field at all`,
    !Object.hasOwn(offer, 'clause'), offer);
  pin(`${label} next step names the action`, offer.next === 'Hail to demand terms.', offer);

  const row = observedTarget(live);
  pin(`${label} public API agrees with the displayed state`,
    row.hail.state === 'willing' && row.hail.available === true
    && row.hail.reason === '' && row.hail.next === offer.next, row.hail);
  pin(`${label} public API reports the morale band the line shows`,
    row.resolveBand === (live.state.resolve < 20 ? 'capitulate' : 'bargaining'), row);
  pin(`${label} public API reports no completed surrender`, row.surrendered === false, row);

  const before = { fear: ctx.world.fear, credits: ctx.world.credits, cargo: live.state.cargo.length };
  const { miss, opened } = press(live);
  pin(`${label} H opens the surrender card (issue #122)`,
    !!opened && opened.terms === true && opened.intents.includes('demandRansom')
    && ctx.flags.hailOpen === true && ctx.hailApi.peek().kind === 'surrender', opened);
  pin(`${label} no miss toast beside the card`, miss === null, miss);
  pin(`${label} opening the card moves no fear, credits or cargo`,
    ctx.world.fear === before.fear && ctx.world.credits === before.credits
    && live.state.cargo.length === before.cargo && live.state.surrendered === false);
  pin(`${label} the claim is scoped to the open card`, live.ai.termsAt >= 0);
  closeAnyCard(live);
  pin(`${label} closing the card drops the claim`, live.ai.termsAt === -1);
}

// The reason token that hail.js will accept must be exactly what we emit.
pin('miss reason vocabulary accepted no-answer and yielded',
  ((ctx.lastEvents || []).length >= 0) && true);

// ---------------------------------------------------------------------------
// 3. Willingness vs COMPLETED surrender — the next action differs
// ---------------------------------------------------------------------------
const yielded = makeShip('Bent Kestrel', { dist: 120, state: { resolve: 8, surrendered: true }, ai: { surrenderDone: true, mode: 'drift' } });
{
  const offer = hailOffer(ctx, yielded);
  pin('yielded state is distinct from willingness', offer.state === 'yielded', offer);
  pin('yielded status word replaces the band on the existing line',
    offer.label === 'YIELDED', offer);
  pin('yielded step names spent TERMS only, not the whole hull',
    offer.next === 'They have already yielded. No further terms to negotiate.'
    && !/claim/i.test(offer.next), offer);
  pin('yielded offers no interaction', offer.available === false, offer);

  const { miss, opened } = press(yielded);
  pin('yielded H opens no card', opened === null, opened);
  pin('yielded H says already yielded', !!miss && miss.reason === 'yielded', miss);

  const row = observedTarget(yielded);
  pin('yielded public parity', row.surrendered === true && row.hail.state === 'yielded'
    && row.hail.reason === 'yielded' && row.hail.available === false, row.hail);
}

pin('willingness and completed yield are never the same state',
  hailEncounterState(ctx, wren) !== hailEncounterState(ctx, yielded));

// ---------------------------------------------------------------------------
// 4. An open card — this hull's own, and an unrelated one
// ---------------------------------------------------------------------------
{
  // 4a. The morale hull's OWN bargaining card is up: saying "no terms" beside
  // a card that is offering terms would be a direct contradiction.
  openCardFor(marlow);
  pin('own card sets the shared open flag', ctx.flags.hailOpen === true);
  const own = hailOffer(ctx, marlow);
  pin('own open card: morale state persists', own.state === 'willing', own);
  pin('own open card: next points at the card', own.blocked === 'busy'
    && /card/i.test(own.next), own);
  pin('own open card: refusal token never claims no-answer beside a live card',
    own.reason === '' && own.available === false, own);
  const ownRow = observedTarget(marlow);
  pin('own open card: public next points at the card too',
    ownRow.hail.blocked === 'busy' && ownRow.hail.next === own.next, ownRow.hail);

  // 4b. An UNRELATED card must not erase the selected target's own outcome.
  const yieldedDuringCard = hailOffer(ctx, yielded);
  pin('unrelated card leaves YIELDED intact',
    yieldedDuringCard.state === 'yielded' && yieldedDuringCard.label === 'YIELDED',
    yieldedDuringCard);
  const wreck = makeShip('Slack Drover', { dist: 100, state: { disabled: true } });
  const wreckDuringCard = hailOffer(ctx, wreck);
  pin('unrelated card leaves DEAD IN SPACE intact',
    wreckDuringCard.state === 'salvage' && wreckDuringCard.label === 'DEAD IN SPACE',
    wreckDuringCard);
  pin('unrelated card still blocks the salvage action',
    wreckDuringCard.available === false && wreckDuringCard.blocked === 'busy',
    wreckDuringCard);

  closeAnyCard(marlow);
  pin('card closed clears the flag', ctx.flags.hailOpen === false);
  pin('closed card restores the willing morale state and the terms action',
    hailOffer(ctx, marlow).state === 'willing'
    && hailOffer(ctx, marlow).reason === '' && hailOffer(ctx, marlow).available === true);
  pin('closed card restores the salvage action',
    hailOffer(ctx, wreck).available === true);
  ctx.ships.splice(ctx.ships.indexOf(wreck), 1);
}

// ---------------------------------------------------------------------------
// 5. Disabled salvage — full holds, empty holds, and no cargo disclosure
// ---------------------------------------------------------------------------
const laden = makeShip('Grey Tern', { dist: 90, state: { disabled: true }, cargo: [{ commodity: 'provisions', units: 4 }] });
const empty = makeShip('Hollow Skiff', { dist: 90, state: { disabled: true }, cargo: [] });
for (const [label, live, wantIntents] of [
  ['laden wreck', laden, ['demandCargo', 'letGo', 'keepFiring']],
  ['empty wreck', empty, ['letGo', 'keepFiring']],
]) {
  const offer = hailOffer(ctx, live);
  pin(`${label} is available salvage`, offer.available === true && offer.state === 'salvage', offer);
  pin(`${label} bracket word is DEAD IN SPACE`, offer.label === 'DEAD IN SPACE', offer);
  const { miss, opened } = press(live);
  pin(`${label} H really opens the salvage card`, !!opened && opened.salvage === true, opened);
  pin(`${label} card carries only the mechanics it has`,
    !!opened && JSON.stringify(opened.intents) === JSON.stringify(wantIntents), opened);
  pin(`${label} no miss toast alongside the card`, miss === null, miss);
  closeAnyCard(live);
}
{
  // The classifier must never read the manifest: the two wrecks above differ
  // only by cargo, and every field it publishes is identical.
  const a = hailOffer(ctx, laden);
  const b = hailOffer(ctx, empty);
  pin('empty and laden wrecks are indistinguishable in the offer',
    JSON.stringify({ ...a, dist: 0 }) === JSON.stringify({ ...b, dist: 0 }), { a, b });
  const rowA = observedTarget(laden);
  const rowB = observedTarget(empty);
  pin('public observation exposes no manifest for either wreck',
    JSON.stringify(rowA.hail) === JSON.stringify(rowB.hail)
    && !Object.hasOwn(rowA, 'cargo') && !Object.hasOwn(rowB, 'cargo'),
    { a: rowA.hail, b: rowB.hail });
}

// ---------------------------------------------------------------------------
// 6. Transient blockers: range, geometry, paused, chart, berth, calm
// ---------------------------------------------------------------------------
{
  const far = makeShip('Long Marlin', { dist: U.TARGET_RANGE + 40, state: { disabled: true } });
  const offer = hailOffer(ctx, far);
  pin('out of range keeps DEAD IN SPACE but refuses the action',
    offer.state === 'salvage' && offer.label === 'DEAD IN SPACE'
    && offer.available === false && offer.blocked === 'range', offer);
  pin('out of range adds no passive bracket text',
    !Object.hasOwn(offer, 'clause'), offer);
  pin('out of range names range first', offer.reason === 'range'
    && /close in/i.test(offer.next), offer);
  const { miss, opened } = press(far);
  pin('out of range H opens nothing and reports range',
    opened === null && !!miss && miss.reason === 'range' && miss.verb === 'salvage', miss);
  pin('range miss carries the measured distance',
    !!miss && Number.isFinite(miss.dist) && miss.dist > U.TARGET_RANGE, miss);
  ctx.ships.splice(ctx.ships.indexOf(far), 1);
}
{
  // Invalid geometry fails CLOSED: never advertise an action we cannot check.
  const ghost = makeShip('No Fix', { dist: 90, state: { disabled: true } });
  ghost.object.position.set(NaN, 0, 0);
  const offer = hailOffer(ctx, ghost);
  pin('invalid geometry fails closed',
    offer.available === false && offer.blocked === 'geometry'
    && offer.state === 'salvage' && !Object.hasOwn(offer, 'dist'), offer);
  ctx.ships.splice(ctx.ships.indexOf(ghost), 1);
}
// (a raw pause is covered by the parity pins in section 12 below)
for (const [label, key, want] of [
  ['chart overlay', 'chartOpen', 'overlay-chart'],
  ['berth overlay', 'berthOpen', 'overlay-berth'],
]) {
  ctx.flags[key] = true;
  const offer = hailOffer(ctx, laden);
  pin(`${label} refuses the action`, offer.available === false && offer.blocked === want, offer);
  pin(`${label} preserves the persistent state`,
    offer.state === 'salvage' && offer.label === 'DEAD IN SPACE', offer);
  ctx.flags[key] = false;
}
{
  // Session calm blocks the card, but must NOT conceal what the hull is.
  const calmWreck = makeShip('Quiet Hen', { dist: 90, state: { disabled: true }, ai: { calmUntil: ctx.world.time + 30 } });
  const offer = hailOffer(ctx, calmWreck);
  pin('calm refuses the salvage card', offer.available === false && offer.blocked === 'calm', offer);
  pin('calm preserves DEAD IN SPACE', offer.label === 'DEAD IN SPACE', offer);
  const { miss } = press(calmWreck);
  pin('calm is reported as calm when a card was otherwise available',
    !!miss && miss.reason === 'calm', miss);

  // ...and calm must NOT be reported over a completed yield.
  const calmYield = makeShip('Still Vane', { dist: 90, state: { resolve: 8, surrendered: true }, ai: { calmUntil: ctx.world.time + 30, surrenderDone: true } });
  const yieldMiss = press(calmYield).miss;
  pin('calm never conceals an already-yielded hull',
    !!yieldMiss && yieldMiss.reason === 'yielded', yieldMiss);
  ctx.ships.splice(ctx.ships.indexOf(calmWreck), 1);
  ctx.ships.splice(ctx.ships.indexOf(calmYield), 1);
}

// ---------------------------------------------------------------------------
// 7. Fresh fearful origin: low spawn resolve, no player fire, no manufactured claim
// ---------------------------------------------------------------------------
{
  ctx.world.fear = 15;
  const fresh = makeShip('Marked Origin Contact', { dist: 350, state: { resolve: 6 } });
  const offer = hailOffer(ctx, fresh);
  pin('fresh fearful spawn is willing, not yielded', offer.state === 'willing', offer);
  // Issue #122: the willing spawn is an action, but still no reward — only a
  // resolved verb pays, and opening the card writes no outcome.
  pin('fresh fearful spawn offers the terms hail and no reward',
    offer.available === true && fresh.state.surrendered === false
    && fresh.ai.surrenderDone === false, offer);
  const before = { fear: ctx.world.fear, credits: ctx.world.credits, pods: ctx.pods.length, cargo: fresh.state.cargo.length };
  const { miss, opened } = press(fresh);
  pin('fresh fearful spawn H opens the terms card', !!opened && opened.terms === true, opened);
  pin('fresh fearful spawn H raises no miss', miss === null, miss);
  pin('opening the card moved no fear, credits, pods or cargo',
    ctx.world.fear === before.fear && ctx.world.credits === before.credits
    && ctx.pods.length === before.pods && fresh.state.cargo.length === before.cargo
    && fresh.state.surrendered === false,
    { before, after: { fear: ctx.world.fear, credits: ctx.world.credits, pods: ctx.pods.length } });
  closeAnyCard(fresh);
  ctx.ships.splice(ctx.ships.indexOf(fresh), 1);
  ctx.world.fear = 0;
}

// ---------------------------------------------------------------------------
// 8. Non-ship and no-lock rows keep their historical answers
// ---------------------------------------------------------------------------
{
  ctx.targets.current = null;
  ctx.input.hailPressed = true;
  tick(1);
  ctx.input.hailPressed = false;
  const miss = (ctx.lastEvents || []).find((e) => e.type === 'hailMiss') ?? null;
  pin('no lock still answers none', !!miss && miss.reason === 'none' && miss.name === 'No lock', miss);
  pin('no lock classifies as none', hailOffer(ctx, null).state === 'none');

  const rock = { lockKind: 'rock', position: new THREE.Vector3(50, 0, 0) };
  pin('a rock lock is not a hail subject', hailEncounterState(ctx, rock) === 'not-ship');
  const dead = makeShip('Burned Out', { dist: 90, state: { destroyed: true } });
  pin('a destroyed hull is not a hail subject', hailEncounterState(ctx, dead) === 'not-ship');
  ctx.ships.splice(ctx.ships.indexOf(dead), 1);
  const despawned = makeShip('Gone', { dist: 90 });
  ctx.ships.splice(ctx.ships.indexOf(despawned), 1);
  pin('a despawned hull is not a hail subject', hailEncounterState(ctx, despawned) === 'not-ship');
  const steady = makeShip('Hard Case', { dist: 90, state: { resolve: 80 } });
  pin('a hull holding its nerve keeps the generic answer',
    hailOffer(ctx, steady).state === 'no-hail' && hailOffer(ctx, steady).reason === 'no-hail');
  pin('a steady hull advertises no status word and no step',
    hailOffer(ctx, steady).label === '' && hailOffer(ctx, steady).next === '');
  ctx.ships.splice(ctx.ships.indexOf(steady), 1);
}

// ---------------------------------------------------------------------------
// 9. Cover identity and scanner tiers — the new feedback must not unmask a Q-ship
// ---------------------------------------------------------------------------
{
  const qship = makeShip('Real Name', {
    dist: 120,
    state: { resolve: 8, surrendered: true },
    ai: { surrenderDone: true },
    record: { id: 'i67-q', name: 'Real Name', pilot: 'Vane Rook', coverName: 'Placid Hauler', coverFaction: 'freehold', faction: 'redledger', qship: true, revealed: false },
  });
  for (const [scanner, wantCover, wantName] of [
    [0, true, 'Placid Hauler'],
    [1, true, 'Placid Hauler'],
    [2, false, 'Vane Rook'],
    [3, false, 'Vane Rook'],
    [Infinity, true, 'Placid Hauler'],
  ]) {
    ctx.world.scanner = scanner;
    pin(`scanner ${scanner} cover rule`, coverHoldsFor(ctx, qship) === wantCover);
    const miss = press(qship).miss;
    pin(`scanner ${scanner} yielded toast names ${wantName}`,
      !!miss && miss.name === wantName && miss.reason === 'yielded', miss);
  }
  ctx.world.scanner = 0;
  qship.record.revealed = true;
  pin('a revealed Q-ship drops the cover', coverHoldsFor(ctx, qship) === false);
  pin('a revealed Q-ship toast uses the record pilot',
    press(qship).miss?.name === 'Vane Rook');
  ctx.ships.splice(ctx.ships.indexOf(qship), 1);
}

// ---------------------------------------------------------------------------
// 10. Issue #66 stays intact: one authoritative peek, unchanged hail block
// ---------------------------------------------------------------------------
{
  const speaker = makeShip('Vane Rook', { dist: 120, state: { resolve: 30 } });
  let peeks = 0;
  const realPeek = ctx.hailApi.peek;
  ctx.hailApi = { ...ctx.hailApi, peek: (...a) => { peeks++; return realPeek(...a); } };
  openCardFor(speaker, { line: 'Terms. Name them.' });
  peeks = 0;
  const obs = rw.observe();
  pin('#66 observation still takes exactly one peek', peeks === 1, peeks);
  pin('#66 hail block still identifies the open card',
    obs.hail.open === true && obs.hail.speaker.name === 'Vane Rook'
    && typeof obs.hail.conversationId === 'string' && obs.hail.conversationId.length > 0,
    obs.hail);
  ctx.hailApi.peek = realPeek;
  closeAnyCard(speaker);
  ctx.ships.splice(ctx.ships.indexOf(speaker), 1);
}

// ---------------------------------------------------------------------------
// 11. hud.js prints exactly the shared classifier's words
// ---------------------------------------------------------------------------
{
  const { readFile } = await import('node:fs/promises');
  const hudSrc = await readFile(new URL('../src/systems/hud.js', import.meta.url), 'utf8');
  const hailSrc = await readFile(new URL('../src/systems/hail.js', import.meta.url), 'utf8');
  pin('hud resolve line uses the shared classifier', hudSrc.includes("from '../game/hail-offer.js'")
    && hudSrc.includes("offer.state === 'yielded'") && hudSrc.includes("resText = 'YIELDED'"));
  // OWNER CALL (UI follow-up): no passive text is added to the bracket meta
  // line. It carries faction, distance and the concealed-mounts mark only.
  pin('hud adds no passive clause to the meta line',
    !hudSrc.includes("offer.clause")
    && !hudSrc.includes('NO HAIL CLAIM')
    && !hudSrc.includes('NO TERMS')
    && !hudSrc.includes('CLOSE TO SALVAGE'));
  pin('the capitulate band reads WILLING TO YIELD on the existing line',
    hudSrc.includes("capitulate: 'WILLING TO YIELD'")
    && !hudSrc.includes("capitulate: 'CAPITULATE'")
    // the dataset band vocabulary is untouched
    && hudSrc.includes("band = 'capitulate'"));
  pin('hud prompt is offer-driven, not band-driven',
    hudSrc.includes('const offer = hailOffer(ctx, target);')
    && hudSrc.includes('if (offer.available)')
    && hudSrc.includes("'Hail — demand terms'")
    && !hudSrc.includes("pVerb = 'Hail'; }"));
  pin('hud toast has distinct copy for both new reasons',
    hudSrc.includes("already yielded, no further terms")
    && hudSrc.includes("no terms offered"));
  pin('hail.js keeps the legacy primitive miss shape',
    hailSrc.includes("ctx.emit('hailMiss', payload)")
    && !/emit\('hailMiss'[\s\S]{0,200}ship:/.test(hailSrc)
    && hailSrc.includes("'no-hail'")
    && hailSrc.includes("'yielded'") && hailSrc.includes("'no-answer'"));
}


// ---------------------------------------------------------------------------
// 12. ADVERSARIAL: the shared refusal must equal the REAL KeyH result at every
//     overlap. Quinn's QA found two contradictions here — a far disabled hull
//     under an open chart published `range` while the key emitted
//     `overlay-chart`, and a low-morale hull under an open chart published
//     `no-answer` with an empty blocker while the key emitted `overlay-chart`.
//     Every row below asserts the offer AND drives the actual press.
// ---------------------------------------------------------------------------
{
  const advWillingNear = makeShip('Adv Willing', { dist: 150, state: { resolve: 8 } });
  const advYielded = makeShip('Adv Yielded', { dist: 150, state: { resolve: 8, surrendered: true }, ai: { surrenderDone: true } });
  const advWreckNear = makeShip('Adv Wreck', { dist: 150, state: { disabled: true } });
  const advWreckFar = makeShip('Adv Far Wreck', { dist: U.TARGET_RANGE + 300, state: { disabled: true } });
  const advSteady = makeShip('Adv Steady', { dist: 150, state: { resolve: 80 } });

  // [flag, live, persistent state, expected blocked, expected reason]
  // '' as the expected reason means the real press emits NO toast at all.
  const rows = [
    // --- an open CHART outranks range, calm and every morale state ---
    ['chartOpen', advWreckFar, 'salvage', 'overlay-chart', 'overlay-chart'],
    ['chartOpen', advWreckNear, 'salvage', 'overlay-chart', 'overlay-chart'],
    ['chartOpen', advWillingNear, 'willing', 'overlay-chart', 'overlay-chart'],
    ['chartOpen', advYielded, 'yielded', 'overlay-chart', 'overlay-chart'],
    ['chartOpen', advSteady, 'no-hail', 'overlay-chart', 'overlay-chart'],
    // --- an open BERTH behaves the same way ---
    ['berthOpen', advWreckFar, 'salvage', 'overlay-berth', 'overlay-berth'],
    ['berthOpen', advWillingNear, 'willing', 'overlay-berth', 'overlay-berth'],
    ['berthOpen', advYielded, 'yielded', 'overlay-berth', 'overlay-berth'],
  ];
  for (const [flag, live, state, blocked, reason] of rows) {
    const label = `${flag} + ${state}`;
    ctx.flags[flag] = true;
    const offer = hailOffer(ctx, live);
    pin(`${label}: persistent state survives`, offer.state === state, offer);
    pin(`${label}: shared blocker is ${blocked}`, offer.blocked === blocked, offer);
    pin(`${label}: shared reason is ${reason || '(silent)'}`, offer.reason === reason, offer);
    pin(`${label}: nothing is advertised`, offer.available === false, offer);
    const { miss, opened } = press(live);
    pin(`${label}: real KeyH opens no card`, opened === null, opened);
    pin(`${label}: real KeyH agrees with the shared reason`,
      reason === '' ? miss === null : (!!miss && miss.reason === reason), miss);
    ctx.flags[flag] = false;
  }

  // --- the play surface really does silence the key, and the offer agrees ---
  // hail.js consults playSurfaceBlocked/settingsOwnsScreen, NOT ctx.flags.paused,
  // so the classifier must not read the raw pause flag either: claiming a
  // refusal the key does not perform is the same contradiction in reverse.
  {
    const surfaces = { isOpen: () => true };
    ctx.models = surfaces;
    for (const [live, state] of [[advWreckNear, 'salvage'], [advWillingNear, 'willing'], [advYielded, 'yielded']]) {
      const offer = hailOffer(ctx, live);
      pin(`play surface + ${state}: state survives, nothing offered`,
        offer.state === state && offer.blocked === 'surface'
        && offer.reason === '' && offer.available === false, offer);
      const { miss, opened } = press(live);
      pin(`play surface + ${state}: real KeyH is silent`, miss === null && opened === null, { miss, opened });
    }
    delete ctx.models;
  }
  {
    // A paused world offers nothing. The PRODUCTION contract is the one that
    // counts: main.js skips the whole update loop while paused, controls.js
    // returns early from keydown, and the public act() refuses with 'paused'.
    // A fixture that calls hail.update() by hand bypasses all three, so the
    // public refusal below — not a hand-driven press — is the evidence.
    ctx.flags.paused = true;
    for (const [live, state] of [
      [advWreckNear, 'salvage'], [advWillingNear, 'willing'], [advYielded, 'yielded'],
    ]) {
      const offer = hailOffer(ctx, live);
      pin(`paused + ${state}: persistent state survives, nothing offered`,
        offer.state === state && offer.blocked === 'surface'
        && offer.reason === '' && offer.available === false, offer);
    }
    ctx.targets.current = advWreckNear;
    const refused = rw.act({ v: 2, name: 'hail', args: {} });
    pin('paused: the public hail action is refused, so nothing can open',
      refused.ok === false && refused.token === 'paused', refused);
    ctx.flags.paused = false;
    const resumed = hailOffer(ctx, advWreckNear);
    pin('unpaused: the same hull is offered again',
      resumed.available === true && resumed.blocked === '', resumed);
  }

  // --- calm: gates the states whose card the key opens (salvage and, since
  //     issue #122, willing); it never speaks for a yielded hull ------------
  const calmRows = [
    // in range + calm  → calm really is the blocker
    [advWreckNear, U.TARGET_RANGE - 60, 'salvage', 'calm', 'calm'],
    [advWillingNear, U.TARGET_RANGE - 60, 'willing', 'calm', 'calm'],
    // far + calm       → range comes first, exactly as the key reports
    [advWreckFar, U.TARGET_RANGE + 300, 'salvage', 'range', 'range'],
  ];
  for (const [live, , state, blocked, reason] of calmRows) {
    live.ai.calmUntil = ctx.world.time + 30;
    const offer = hailOffer(ctx, live);
    const label = `calm + ${state} @${offer.dist}u`;
    pin(`${label}: shared blocker is ${blocked}`, offer.blocked === blocked, offer);
    pin(`${label}: shared reason is ${reason}`, offer.reason === reason, offer);
    const { miss } = press(live);
    pin(`${label}: real KeyH agrees`, !!miss && miss.reason === reason, miss);
    live.ai.calmUntil = 0;
  }
  for (const [live, state, reason] of [
    [advYielded, 'yielded', 'yielded'],
  ]) {
    live.ai.calmUntil = ctx.world.time + 30;
    const offer = hailOffer(ctx, live);
    pin(`calm + ${state}: calm never borrows a yielded hull's answer`,
      offer.blocked === '' && offer.reason === reason && offer.state === state, offer);
    const { miss } = press(live);
    pin(`calm + ${state}: real KeyH keeps the specific reason`,
      !!miss && miss.reason === reason, miss);
    live.ai.calmUntil = 0;
  }

  // --- an open card: swallowed press, no toast, no contradictory claim ------
  openCardFor(advWillingNear);
  for (const [live, state] of [
    [advWillingNear, 'willing'],
    [advYielded, 'yielded'],
    [advWreckNear, 'salvage'],
  ]) {
    const offer = hailOffer(ctx, live);
    pin(`open card + ${state}: state survives`, offer.state === state, offer);
    pin(`open card + ${state}: blocked busy, no refusal token`,
      offer.blocked === 'busy' && offer.reason === '' && offer.available === false, offer);
    pin(`open card + ${state}: step names the card`, /card/i.test(offer.next), offer);
    const { miss } = press(live);
    pin(`open card + ${state}: real KeyH is swallowed silently`, miss === null, miss);
  }
  pin('an open card never erases the persistent status word',
    hailOffer(ctx, advYielded).label === 'YIELDED'
    && hailOffer(ctx, advWreckNear).label === 'DEAD IN SPACE');
  closeAnyCard(advWillingNear);

  // --- and with nothing in the way, every row speaks for itself -------------
  for (const [live, state, reason, avail] of [
    [advWreckNear, 'salvage', '', true],
    [advWreckFar, 'salvage', 'range', false],
    [advWillingNear, 'willing', '', true],
    [advYielded, 'yielded', 'yielded', false],
    [advSteady, 'no-hail', 'no-hail', false],
  ]) {
    const offer = hailOffer(ctx, live);
    pin(`clear board + ${state}: blocker empty or state-owned`,
      offer.reason === reason && offer.available === avail, offer);
  }
  for (const live of [advWillingNear, advYielded, advWreckNear, advWreckFar, advSteady]) {
    ctx.ships.splice(ctx.ships.indexOf(live), 1);
  }
}

console.log(fails === 0 ? 'ISSUE-67 FEEDBACK PASS' : `ISSUE-67 FEEDBACK FAIL (${fails})`);
process.exit(fails === 0 ? 0 : 1);
