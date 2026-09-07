/**
 * Issue #66 — public hail conversation identity.
 *
 * Pins that `observe().hail` names the ACTUAL open card (speaker, family,
 * player-visible terms) and that `hailResolve` can be bound to that one
 * conversation. Narrow fixture: the real `initHail` DOM card and the real
 * `window.rimward` handle over a hand-built ctx — no full boot, no privileged
 * mutation used to fake an outcome.
 *
 * Run: node scripts/hail-identity-test.mjs
 */
import { register } from 'node:module';

register('./css-hook.mjs', import.meta.url);

import * as THREE from 'three';
import { installDomStubs } from './lib/boot-harness.mjs';

const dom = installDomStubs();
globalThis.window.location = { search: '', href: 'http://127.0.0.1/hail-identity' };
try { globalThis.window.rimward = undefined; } catch { /* ignore */ }

const { initHail } = await import('../src/systems/hail.js');
const { initAgentApi } = await import('../src/systems/agent-api.js');
const { ECON, CALLOW, HIDDEN_MOUNTS, COMMODITIES } = await import('../src/game/state.js');
const { dropDeferredHail } = await import('../src/systems/overlay-policy.js');

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
const emitted = [];
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
    emitted.push(row);
  },
};

const hail = initHail(ctx);
initAgentApi(ctx);
const rw = globalThis.window.rimward;
pin('rimward handle present', !!(rw && typeof rw.act === 'function' && typeof rw.observe === 'function'));

const DT = 1 / 60;
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    hail.update(DT, ctx);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

let shipSeq = 0;
function makeShip(name, pilot, extra = {}) {
  shipSeq++;
  const object = new THREE.Object3D();
  object.position.set(120 + shipSeq * 10, 0, 0);
  return {
    id: `hail66-${shipSeq}`,
    role: 'pirate',
    record: { id: `hail66-${shipSeq}`, name, pilot, faction: 'redledger', role: 'pirate' },
    state: {
      name,
      faction: 'redledger',
      bookValue: 900,
      resolve: 40,
      cargo: [{ commodity: 'provisions', units: 6 }],
      disabled: false,
      destroyed: false,
      surrendered: false,
      hull: 8,
      hullMax: 10,
      ...(extra.state || {}),
    },
    ai: { calmUntil: 0, intent: true, mode: 'hunt', ...(extra.ai || {}) },
    object,
  };
}

function addShip(ship) {
  ctx.ships.push(ship);
  return ship;
}

function closeCard() {
  ctx.emit('hailClosed', {});
  tick(2);
  try { dropDeferredHail(); } catch { /* fixture cleanup */ }
}

function openHail(ev) {
  ctx.emit('hailOpened', ev);
  tick(1);
}

function hailBlock() {
  return rw.observe().hail;
}

function cardButtons() {
  const out = [];
  for (const node of dom.walkDom(globalThis.document.body)) {
    if (node.tagName === 'BUTTON' && typeof node.textContent === 'string'
      && /^\[\d\]\s/.test(node.textContent)) {
      out.push(node.textContent);
    }
  }
  return out;
}

function cardHeaderText() {
  for (const node of dom.walkDom(globalThis.document.body)) {
    if (typeof node.textContent === 'string' && node.textContent.startsWith('HAIL — ')) {
      return node.textContent;
    }
  }
  return '';
}

// ---- 1. Four card families name themselves ---------------------------------
// demand -----------------------------------------------------------------
const demandShip = addShip(makeShip('Rook Cutter', 'Vane Rook'));
demandShip.ai.demanding = true;
demandShip.ai.demandOutcome = null;
demandShip.ai.demandExpiresAt = ctx.world.time + 20;
openHail({
  ship: demandShip,
  intents: ['payTribute', 'showTeeth', 'refuseFight'],
  line: 'Your cargo or your hull.',
  demand: 80,
  demandHail: true,
});
const demandBlock = hailBlock();
pin('demand kind', demandBlock.kind === 'demand', demandBlock);
pin('demand speaker is the card ship', demandBlock.speaker
  && demandBlock.speaker.name === 'Vane Rook'
  && demandBlock.speaker.id === demandShip.id, demandBlock.speaker);
pin('demand header names the same speaker', cardHeaderText() === 'HAIL — Vane Rook', cardHeaderText());
pin('demand conversationId is a plain token', typeof demandBlock.conversationId === 'string'
  && demandBlock.conversationId.length > 0, demandBlock.conversationId);
pin('demand terms line is the displayed line',
  demandBlock.terms && demandBlock.terms.line.includes('Vane Rook')
  && demandBlock.terms.line.includes('80 UU'), demandBlock.terms);
pin('demand option labels are the button labels',
  JSON.stringify(demandBlock.terms.options.map((o) => o.label)) === JSON.stringify(cardButtons()),
  { observed: demandBlock.terms.options.map((o) => o.label), dom: cardButtons() });
pin('demand option order is the 1-based intent order',
  JSON.stringify(demandBlock.terms.options.map((o) => o.index)) === JSON.stringify([1, 2, 3])
  && JSON.stringify(demandBlock.terms.options.map((o) => o.intent))
    === JSON.stringify(['payTribute', 'showTeeth', 'refuseFight']), demandBlock.terms.options);
pin('demand amount is the offered demand only',
  demandBlock.terms.amounts.demand === 80
  && !Object.hasOwn(demandBlock.terms.amounts, 'ransom')
  && !Object.hasOwn(demandBlock.terms.amounts, 'tribute')
  && !Object.hasOwn(demandBlock.terms.amounts, 'vouchCost'), demandBlock.terms.amounts);

// The countdown redraws the line every frame; the token must not move.
const demandIdBefore = demandBlock.conversationId;
const demandLineBefore = demandBlock.terms.line;
tick(90);
const demandLater = hailBlock();
pin('countdown keeps the conversation token',
  demandLater.conversationId === demandIdBefore && demandLater.open === true, demandLater);
pin('countdown line stays player-visible and moves',
  demandLater.terms.line !== demandLineBefore && /\d+s\.$/.test(demandLater.terms.line),
  { before: demandLineBefore, after: demandLater.terms.line });
closeCard();

// surrender --------------------------------------------------------------
const brokenShip = addShip(makeShip('Sallow Lark', 'Deel Sallow'));
openHail({
  ship: brokenShip,
  intents: ['demandRansom', 'acceptTribute', 'letGo', 'keepFiring'],
  line: 'They are breaking.',
});
const surrenderBlock = hailBlock();
const expectedTribute = Math.round(
  ECON.tributeRate * COMMODITIES.provisions.base * 6,
);
pin('surrender kind from offered verbs', surrenderBlock.kind === 'surrender', surrenderBlock.kind);
pin('surrender speaker', surrenderBlock.speaker.name === 'Deel Sallow', surrenderBlock.speaker);
pin('surrender line is the quoted card line',
  surrenderBlock.terms.line === '“They are breaking.”', surrenderBlock.terms.line);
pin('surrender labels match the DOM buttons',
  JSON.stringify(surrenderBlock.terms.options.map((o) => o.label)) === JSON.stringify(cardButtons()),
  { observed: surrenderBlock.terms.options.map((o) => o.label), dom: cardButtons() });
pin('surrender publishes ransom and tribute it prints',
  Number.isFinite(surrenderBlock.terms.amounts.ransom)
  && surrenderBlock.terms.amounts.tribute === expectedTribute
  && surrenderBlock.terms.options[0].label.includes(`${surrenderBlock.terms.amounts.ransom} UU`)
  && surrenderBlock.terms.options[1].label.includes(`${expectedTribute} UU`)
  && !Object.hasOwn(surrenderBlock.terms.amounts, 'demand'),
  surrenderBlock.terms);
closeCard();

// salvage ----------------------------------------------------------------
const hulkShip = addShip(makeShip('Cold Wren', 'Wren Ash'));
hulkShip.state.disabled = true;
openHail({
  ship: hulkShip,
  intents: ['demandCargo', 'letGo', 'keepFiring'],
  line: 'Hull is dead in space. Holds still sealed.',
  salvage: true,
});
const salvageBlock = hailBlock();
pin('salvage kind', salvageBlock.kind === 'salvage', salvageBlock.kind);
pin('salvage labels are the salvage wording',
  salvageBlock.terms.options[0].label === '[1] Salvage cargo'
  && salvageBlock.terms.options[1].label === '[2] Leave the hulk',
  salvageBlock.terms.options);
pin('salvage carries no monetary amount',
  Object.keys(salvageBlock.terms.amounts).length === 0, salvageBlock.terms.amounts);
closeCard();

// conversation -----------------------------------------------------------
const callowShip = addShip(makeShip('Old Callow', 'Old Callow'));
openHail({ ship: callowShip, intents: ['callowVouch', 'keepFiring'], line: CALLOW.offerLine });
const talkBlock = hailBlock();
pin('conversation kind', talkBlock.kind === 'conversation', talkBlock.kind);
pin('conversation publishes only the printed vouch cost',
  talkBlock.terms.amounts.vouchCost === CALLOW.vouchCost
  && Object.keys(talkBlock.terms.amounts).length === 1
  && talkBlock.terms.options[0].label === `[1] Buy his vouch — ${CALLOW.vouchCost} UU`,
  talkBlock.terms);

// ---- 2. Snapshot safety ----------------------------------------------------
const snap = hailBlock();
let jsonOk = true;
try { JSON.parse(JSON.stringify(snap)); } catch { jsonOk = false; }
pin('hail block is JSON-safe', jsonOk);
pin('hail block leaks no ship or DOM',
  !Object.hasOwn(snap, 'ship') && !Object.hasOwn(snap, 'lineEl')
  && !JSON.stringify(snap).includes('rw-hail-card'), Object.keys(snap));
pin('hail block is a plain object tree',
  Object.getPrototypeOf(snap) === Object.prototype
  && Object.getPrototypeOf(snap.terms) === Object.prototype
  && Object.getPrototypeOf(snap.terms.amounts) === Object.prototype
  && !Object.hasOwn(snap.terms.amounts, '__proto__'));
// Mutating an observation must not touch the live card.
snap.terms.options.length = 0;
snap.terms.amounts.vouchCost = 999999;
snap.speaker.name = 'not the speaker';
snap.intents.push('teleport');
const afterMutation = hailBlock();
pin('observation copies cannot mutate the card',
  afterMutation.terms.options.length === 2
  && afterMutation.terms.amounts.vouchCost === CALLOW.vouchCost
  && afterMutation.speaker.name === 'Old Callow'
  && afterMutation.intents.length === 2, afterMutation);
closeCard();

// A hostile pilot name is data, never a key.
const nastyShip = addShip(makeShip('Proto Hull', '__proto__'));
openHail({ ship: nastyShip, intents: ['letGo', 'keepFiring'], line: 'Nothing to say.' });
const nastyBlock = hailBlock();
pin('reserved speaker name stays a value',
  nastyBlock.speaker.name === '__proto__'
  && ({}).polluted === undefined
  && Object.getPrototypeOf(nastyBlock.speaker) === Object.prototype, nastyBlock.speaker);
closeCard();

// ---- 3. Identity is the card, not the selected target ----------------------
const speakerShip = addShip(makeShip('Talker', 'Ilse Vane'));
const otherShip = addShip(makeShip('Bystander', 'Nem Corr'));
ctx.targets.current = otherShip;
openHail({ ship: speakerShip, intents: ['letGo', 'keepFiring'], line: 'Hold your fire.' });
const twoShipBlock = rw.observe();
pin('speaker is the card ship while another ship is locked',
  twoShipBlock.hail.speaker.name === 'Ilse Vane'
  && twoShipBlock.hail.speaker.id === speakerShip.id
  && twoShipBlock.targets.current
  && twoShipBlock.targets.current.name === 'Bystander',
  { speaker: twoShipBlock.hail.speaker, lock: twoShipBlock.targets.current });
pin('header still names the card ship', cardHeaderText() === 'HAIL — Ilse Vane', cardHeaderText());
ctx.targets.current = null;
closeCard();

// ---- 4. Same-speaker reopen mints a new conversation -----------------------
const reopenShip = addShip(makeShip('Second Word', 'Kesh Bry'));
openHail({ ship: reopenShip, intents: ['letGo', 'keepFiring'], line: 'One word.' });
const reopenFirst = hailBlock().conversationId;
closeCard();
openHail({ ship: reopenShip, intents: ['letGo', 'keepFiring'], line: 'One word.' });
const reopenSecond = hailBlock().conversationId;
pin('same speaker reopen changes the token',
  !!reopenFirst && !!reopenSecond && reopenFirst !== reopenSecond,
  { reopenFirst, reopenSecond });
closeCard();

// ---- 5. In-place salvage conversion is a new conversation ------------------
const convertShip = addShip(makeShip('Turning Hull', 'Bel Vask'));
openHail({
  ship: convertShip,
  intents: ['demandRansom', 'letGo', 'keepFiring'],
  line: 'They are breaking.',
});
const beforeConvert = hailBlock();
convertShip.state.disabled = true;
tick(2);
const afterConvert = hailBlock();
pin('bargaining card converts in place to salvage',
  beforeConvert.kind === 'surrender' && afterConvert.kind === 'salvage'
  && afterConvert.open === true, { beforeConvert: beforeConvert.kind, afterConvert: afterConvert.kind });
pin('salvage conversion mints a new token',
  afterConvert.conversationId !== beforeConvert.conversationId,
  { before: beforeConvert.conversationId, after: afterConvert.conversationId });
pin('salvage conversion re-labels the buttons',
  JSON.stringify(afterConvert.terms.options.map((o) => o.label)) === JSON.stringify(cardButtons()),
  { observed: afterConvert.terms.options.map((o) => o.label), dom: cardButtons() });
closeCard();

// ---- 6. hailResolve binds to one conversation ------------------------------
// Demand amounts stay at or above HIDDEN_MOUNTS.demandMin so the card prints
// the offered figure verbatim rather than the floor.
function armDemand(ship, demand) {
  ship.ai.demanding = true;
  ship.ai.demandOutcome = null;
  ship.ai.demandExpiresAt = ctx.world.time + 20;
  openHail({
    ship,
    intents: ['payTribute', 'refuseFight'],
    line: 'Your cargo or your hull.',
    demand,
    demandHail: true,
  });
}

// Stale: the card the agent peeked was replaced by another speaker's card.
const firstDemand = addShip(makeShip('First Demand', 'Ory Kel'));
armDemand(firstDemand, 70);
const staleId = hailBlock().conversationId;
closeCard();
const secondDemand = addShip(makeShip('Second Demand', 'Pell Rane'));
armDemand(secondDemand, 90);
const liveId = hailBlock().conversationId;
ctx.world.credits = 4000;
emitted.length = 0;
const staleAct = rw.act({
  v: 2,
  name: 'hailResolve',
  args: { intent: 'payTribute', expectedConversationId: staleId },
});
pin('stale expected id refuses', staleAct.ok === false && staleAct.token === 'stale', staleAct);
pin('stale resolve moves no credits', ctx.world.credits === 4000, ctx.world.credits);
pin('stale resolve leaves both ships untouched',
  secondDemand.ai.demandOutcome === null && secondDemand.ai.mode === 'hunt'
  && secondDemand.state.surrendered === false
  && firstDemand.ai.demandOutcome === null && firstDemand.ai.mode === 'hunt'
  && firstDemand.state.surrendered === false,
  { second: secondDemand.ai, first: firstDemand.ai });
pin('stale resolve emits nothing', emitted.length === 0, emitted.map((e) => e.type));
pin('stale resolve leaves the live card open',
  hailBlock().open === true && hailBlock().conversationId === liveId, hailBlock());

// Bound success on the live conversation.
emitted.length = 0;
const boundAct = rw.act({
  v: 2,
  name: 'hailResolve',
  args: { intent: 'payTribute', expectedConversationId: liveId },
});
pin('bound resolve succeeds', boundAct.ok === true && boundAct.token === '', boundAct);
pin('bound resolve pays the printed demand', ctx.world.credits === 4000 - 90, ctx.world.credits);
pin('bound resolve closes the card and the pirate runs',
  secondDemand.ai.demandOutcome === 'paid' && secondDemand.ai.mode === 'flee'
  && ctx.flags.hailOpen === false, secondDemand.ai);
tick(2);
pin('closed card reports no identity',
  hailBlock().open === false && hailBlock().conversationId === ''
  && hailBlock().kind === '' && hailBlock().speaker === null
  && hailBlock().terms === null && hailBlock().intents.length === 0, hailBlock());
closeCard();

// Card closed under the agent between peek and act.
const vanishShip = addShip(makeShip('Vanishing', 'Tam Ord'));
armDemand(vanishShip, 60);
const vanishId = hailBlock().conversationId;
closeCard();
ctx.world.credits = 4000;
const vanishAct = rw.act({
  v: 2,
  name: 'hailResolve',
  args: { intent: 'payTribute', expectedConversationId: vanishId },
});
pin('closed card refuses before the identity check', vanishAct.ok === false
  && vanishAct.token === 'closed', vanishAct);
pin('closed-card refusal moves no credits', ctx.world.credits === 4000, ctx.world.credits);

// ---- 7. Malformed expected identity ---------------------------------------
const argShip = addShip(makeShip('Arg Check', 'Sero Vin'));
armDemand(argShip, 50);
const argId = hailBlock().conversationId;
ctx.world.credits = 4000;
const badValues = [
  ['empty string', ''],
  ['number', 7],
  ['object', {}],
  ['array', []],
  ['null', null],
  ['undefined', undefined],
  ['boolean', true],
  ['reserved __proto__', '__proto__'],
  ['reserved constructor', 'constructor'],
  ['reserved prototype', 'prototype'],
  ['over-long', 'x'.repeat(65)],
];
let badOk = true;
const badSeen = [];
for (const [label, value] of badValues) {
  const res = rw.act({
    v: 2,
    name: 'hailResolve',
    args: { intent: 'payTribute', expectedConversationId: value },
  });
  badSeen.push([label, res.ok, res.token]);
  if (res.ok !== false || res.token !== 'bad-args') badOk = false;
}
pin('malformed expected identity refuses bad-args', badOk, badSeen);
pin('malformed expected identity has no effect',
  ctx.world.credits === 4000 && argShip.ai.demandOutcome === null
  && hailBlock().open === true && hailBlock().conversationId === argId,
  { credits: ctx.world.credits, ai: argShip.ai });

// Legacy call shape (no expected identity) still resolves.
const legacyAct = rw.act({ v: 2, name: 'hailResolve', args: { intent: 'payTribute' } });
pin('legacy hailResolve without expected id succeeds',
  legacyAct.ok === true && ctx.world.credits === 4000 - 50, { legacyAct, credits: ctx.world.credits });
closeCard();

// Legacy 1-based index still resolves and still binds.
const indexShip = addShip(makeShip('Index Path', 'Ura Belt'));
armDemand(indexShip, 140);
const indexId = hailBlock().conversationId;
ctx.world.credits = 4000;
const badIndexBind = rw.act({
  v: 2,
  name: 'hailResolve',
  args: { index: 1, expectedConversationId: `${indexId}-not-this-one` },
});
pin('index path honours the identity guard',
  badIndexBind.ok === false && badIndexBind.token === 'stale' && ctx.world.credits === 4000,
  badIndexBind);
const indexAct = rw.act({ v: 2, name: 'hailResolve', args: { index: 1, expectedConversationId: indexId } });
pin('legacy 1-based index resolves when bound',
  indexAct.ok === true && ctx.world.credits === 4000 - 140, { indexAct, credits: ctx.world.credits });
closeCard();

// ---- 8. Ordinary human paths keep working ---------------------------------
const humanShip = addShip(makeShip('Human Path', 'Cass Odo'));
armDemand(humanShip, 120);
ctx.world.credits = 4000;
const payButton = (() => {
  for (const node of dom.walkDom(globalThis.document.body)) {
    if (node.tagName === 'BUTTON' && typeof node.textContent === 'string'
      && node.textContent.startsWith('[1] Pay tribute')) return node;
  }
  return null;
})();
pin('demand card still prints the pay button', !!payButton
  && payButton.textContent === '[1] Pay tribute — 120 UU', payButton && payButton.textContent);
payButton.click();
pin('button click still resolves', ctx.world.credits === 4000 - 120
  && humanShip.ai.demandOutcome === 'paid', ctx.world.credits);
closeCard();

const keyShip = addShip(makeShip('Key Path', 'Rea Holt'));
armDemand(keyShip, 110);
ctx.world.credits = 4000;
dom.dispatchKey('Digit1');
pin('digit key still resolves', ctx.world.credits === 4000 - 110
  && keyShip.ai.demandOutcome === 'paid', ctx.world.credits);
closeCard();

// ---- 9. Precedence and contract version -----------------------------------
const closedAct = rw.act({ v: 2, name: 'hailResolve', args: { intent: 'payTribute' } });
pin('no card refuses closed', closedAct.ok === false && closedAct.token === 'closed', closedAct);
const closedBound = rw.act({
  v: 2,
  name: 'hailResolve',
  args: { intent: 'payTribute', expectedConversationId: 'hail-1' },
});
pin('no card refuses closed before bad-args or stale',
  closedBound.ok === false && closedBound.token === 'closed', closedBound);

const precedenceShip = addShip(makeShip('Precedence', 'Ivo Mel'));
armDemand(precedenceShip, 130);
const unlisted = rw.act({
  v: 2,
  name: 'hailResolve',
  args: { intent: 'demandRansom', expectedConversationId: hailBlock().conversationId },
});
pin('unlisted intent refuses no-service before resolving',
  unlisted.ok === false && unlisted.token === 'no-service', unlisted);
ctx.flags.chartOpen = true;
const overlayBlocked = rw.act({ v: 2, name: 'hailResolve', args: { intent: 'payTribute' } });
pin('overlay-blocked digits refuse no-service',
  overlayBlocked.ok === false && overlayBlocked.token === 'no-service', overlayBlocked);
ctx.flags.chartOpen = false;
closeCard();

const finalObs = rw.observe();
pin('contract version unchanged', finalObs.v === 2 && rw.version === 2
  && finalObs.capabilities.version === 2, { v: finalObs.v, handle: rw.version });
pin('hailResolve manifest documents the optional identity arg',
  finalObs.capabilities.commands.hailResolve.args.expectedConversationId
    .includes('conversationId'),
  finalObs.capabilities.commands.hailResolve.args);
pin('closed hail availability unchanged',
  finalObs.availability.hailResolve.ok === false
  && finalObs.availability.hailResolve.reason === 'closed', finalObs.availability.hailResolve);
pin('hail block shape is the authored allowlist',
  JSON.stringify(Object.keys(finalObs.hail))
    === JSON.stringify(['open', 'intents', 'conversationId', 'kind', 'speaker', 'terms']),
  Object.keys(finalObs.hail));

// ---- 9a. A changed printed quote is a different conversation ---------------
const quoteIntents = ['acceptTribute', 'letGo', 'keepFiring'];
const tributeOf = (b) => {
  const row = b.terms.options.find((o) => o.intent === 'acceptTribute');
  return { amount: b.terms.amounts.tribute, label: row ? row.label : '' };
};
const quoteShip = addShip(makeShip('Quote Hull', 'Ana Vel'));
openHail({ ship: quoteShip, intents: quoteIntents, line: 'They are breaking.' });
const quoteFirst = hailBlock();
// Same hull, same verbs, same line — but the hold is fatter, so the tribute the
// card PRINTS is a different offer, and a different offer is a different talk.
quoteShip.state.cargo = [{ commodity: 'provisions', units: 24 }];
openHail({ ship: quoteShip, intents: quoteIntents, line: 'They are breaking.' });
const quoteSecond = hailBlock();
pin('a changed printed tribute mints a new conversation',
  quoteSecond.open === true
  && tributeOf(quoteSecond).amount !== tributeOf(quoteFirst).amount
  && quoteSecond.conversationId !== quoteFirst.conversationId,
  {
    first: { id: quoteFirst.conversationId, ...tributeOf(quoteFirst) },
    second: { id: quoteSecond.conversationId, ...tributeOf(quoteSecond) },
  });
pin('the new quote is the one the buttons print',
  JSON.stringify(quoteSecond.terms.options.map((o) => o.label)) === JSON.stringify(cardButtons())
  && tributeOf(quoteSecond).label.includes(`${tributeOf(quoteSecond).amount} UU`),
  { observed: quoteSecond.terms.options.map((o) => o.label), dom: cardButtons() });

// The token peeked before the redraw now buys nothing.
const quoteCargoBefore = quoteShip.state.cargo.map((r) => `${r.commodity}:${r.units}`).join(',');
ctx.world.credits = 4000;
emitted.length = 0;
const quoteStale = rw.act({
  v: 2,
  name: 'hailResolve',
  args: { intent: 'acceptTribute', expectedConversationId: quoteFirst.conversationId },
});
pin('the pre-redraw token is stale',
  quoteStale.ok === false && quoteStale.token === 'stale', quoteStale);
pin('a stale quote resolve changes nothing',
  ctx.world.credits === 4000 && emitted.length === 0
  && quoteShip.state.surrendered === false
  && quoteShip.state.cargo.map((r) => `${r.commodity}:${r.units}`).join(',') === quoteCargoBefore
  && hailBlock().open === true
  && hailBlock().conversationId === quoteSecond.conversationId,
  { credits: ctx.world.credits, emitted: emitted.map((e) => e.type) });

// An identical redraw re-rolls the private ransom. The card prints no ransom
// button, so the player is reading the same offer and the token must hold.
openHail({ ship: quoteShip, intents: quoteIntents, line: 'They are breaking.' });
const quoteThird = hailBlock();
pin('an unchanged redraw keeps the token while a hidden ransom re-rolls',
  quoteThird.conversationId === quoteSecond.conversationId
  && tributeOf(quoteThird).amount === tributeOf(quoteSecond).amount
  && !Object.hasOwn(quoteThird.terms.amounts, 'ransom'), quoteThird.terms);
closeCard();

// A ransom the card DOES print is identity: it rotates exactly when it moves.
const ransomShip = addShip(makeShip('Ransom Hull', 'Dov Ker'));
const ransomIntents = ['demandRansom', 'letGo', 'keepFiring'];
openHail({ ship: ransomShip, intents: ransomIntents, line: 'They are breaking.' });
let ransomPrev = hailBlock();
let ransomRotationOk = true;
let sawChangedRansom = false;
for (let i = 0; i < 12; i++) {
  openHail({ ship: ransomShip, intents: ransomIntents, line: 'They are breaking.' });
  const nowBlock = hailBlock();
  const changed = nowBlock.terms.amounts.ransom !== ransomPrev.terms.amounts.ransom;
  const rotated = nowBlock.conversationId !== ransomPrev.conversationId;
  if (changed) sawChangedRansom = true;
  if (changed !== rotated) ransomRotationOk = false;
  if (!nowBlock.terms.options[0].label.includes(`${nowBlock.terms.amounts.ransom} UU`)) {
    ransomRotationOk = false;
  }
  ransomPrev = nowBlock;
}
pin('a printed ransom rotates identity exactly when the quote changes',
  ransomRotationOk, { sawChangedRansom });
closeCard();

// A quote already on screen does not drift when the world moves under it.
const frozenShip = addShip(makeShip('Frozen Quote', 'Bex Hallo'));
openHail({ ship: frozenShip, intents: quoteIntents, line: 'They are breaking.' });
const frozenBefore = hailBlock();
frozenShip.state.cargo = [{ commodity: 'provisions', units: 30 }];
tick(30);
const frozenAfter = hailBlock();
pin('the printed quote is frozen until the card is redrawn',
  frozenAfter.open === true
  && frozenAfter.conversationId === frozenBefore.conversationId
  && tributeOf(frozenAfter).amount === tributeOf(frozenBefore).amount
  && frozenAfter.terms.line === frozenBefore.terms.line,
  { before: frozenBefore.terms, after: frozenAfter.terms });
closeCard();

// ---- 9b. The card itself guards the expected identity ----------------------
const directShip = addShip(makeShip('Direct Guard', 'Nio Fast'));
armDemand(directShip, 150);
const directId = hailBlock().conversationId;
ctx.world.credits = 4000;
emitted.length = 0;
const directBad = [7, '', {}, [], null, undefined, true,
  '__proto__', 'constructor', 'prototype', 'x'.repeat(65)];
let directBadOk = true;
const directSeen = [];
for (const value of directBad) {
  const token = ctx.hailApi.resolve('payTribute', value);
  directSeen.push([String(value), token]);
  if (token !== 'bad-args') directBadOk = false;
}
pin('the card refuses a malformed expected identity outright', directBadOk, directSeen);
pin('malformed direct calls have no effect',
  ctx.world.credits === 4000 && emitted.length === 0
  && directShip.ai.demandOutcome === null && directShip.ai.mode === 'hunt'
  && hailBlock().conversationId === directId,
  { credits: ctx.world.credits, emitted: emitted.map((e) => e.type) });
const goneToken = ctx.hailApi.resolve('demandRansom', `${directId}-replaced`);
pin('a stale token answers before an intent that is no longer listed',
  goneToken === 'stale' && ctx.world.credits === 4000 && emitted.length === 0, goneToken);
pin('an omitted expected identity still refuses an unlisted intent',
  ctx.hailApi.resolve('demandRansom') === 'no-service'
  && ctx.world.credits === 4000, ctx.world.credits);
const directOkToken = ctx.hailApi.resolve('payTribute', directId);
pin('the bound direct call resolves',
  directOkToken === '' && ctx.world.credits === 4000 - 150,
  { directOkToken, credits: ctx.world.credits });
closeCard();

// An inherited token is not a token.
const inheritShip = addShip(makeShip('Inherited Arg', 'Sil Vane'));
armDemand(inheritShip, 160);
const inheritId = hailBlock().conversationId;
ctx.world.credits = 4000;
const inheritedArgs = Object.create({ expectedConversationId: inheritId });
inheritedArgs.intent = 'payTribute';
const inheritAct = rw.act({ v: 2, name: 'hailResolve', args: inheritedArgs });
pin('an inherited expected identity never downgrades to an unguarded call',
  inheritAct.ok === false && inheritAct.token === 'bad-args'
  && ctx.world.credits === 4000 && inheritShip.ai.demandOutcome === null,
  { inheritAct, credits: ctx.world.credits });
closeCard();

// ---- 9c. Speaker ids are finite primitives or nothing ----------------------
const numIdShip = addShip(makeShip('Numeric Id', 'Rho Tan'));
numIdShip.id = 4242;
numIdShip.record.id = 4242;
openHail({ ship: numIdShip, intents: ['letGo', 'keepFiring'], line: 'Numbers only.' });
pin('a finite numeric speaker id survives peek and observation',
  ctx.hailApi.peek().speaker.id === 4242 && hailBlock().speaker.id === 4242,
  { peek: ctx.hailApi.peek().speaker, block: hailBlock().speaker });
closeCard();

for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
  const oddShip = addShip(makeShip('Odd Id', 'Kel Dree'));
  oddShip.id = bad;
  oddShip.record.id = bad;
  openHail({ ship: oddShip, intents: ['letGo', 'keepFiring'], line: 'No id here.' });
  const oddPeek = ctx.hailApi.peek();
  const oddBlock = hailBlock();
  pin(`a nonfinite speaker id (${String(bad)}) is dropped at the card and in the block`,
    oddPeek.speaker.id === null && oddBlock.speaker.id === null
    && oddBlock.speaker.name === 'Kel Dree',
    { peek: oddPeek.speaker, block: oddBlock.speaker });
  closeCard();
}

const fallbackShip = addShip(makeShip('Fallback Id', 'Ori Kaan'));
fallbackShip.id = Number.NaN;
openHail({ ship: fallbackShip, intents: ['letGo', 'keepFiring'], line: 'Ask the manifest.' });
pin('a nonfinite hull id falls back to the record id',
  hailBlock().speaker.id === fallbackShip.record.id
  && typeof hailBlock().speaker.id === 'string', hailBlock().speaker);
closeCard();

// ---- 9d. One peek per observation, and no history behind it ----------------
const realApi = ctx.hailApi;
ctx.agent.events.push({ type: 'hailOpened', t: 1, intents: ['payTribute', 'refuseFight'] });
const countShip = addShip(makeShip('Counted', 'Ivo Lune'));
openHail({ ship: countShip, intents: ['letGo', 'keepFiring'], line: 'Once only.' });
let peeks = 0;
ctx.hailApi = {
  resolve: realApi.resolve,
  peek() {
    peeks++;
    return realApi.peek();
  },
};
const counted = rw.observe().hail;
pin('one observation reads the card exactly once',
  peeks === 1 && counted.open === true && counted.speaker.name === 'Ivo Lune',
  { peeks, counted });

ctx.hailApi = {
  resolve: realApi.resolve,
  peek() { throw new Error('card is gone'); },
};
const thrownBlock = rw.observe().hail;
pin('a throwing peek publishes the empty block, never the ring',
  thrownBlock.intents.length === 0 && thrownBlock.conversationId === ''
  && thrownBlock.kind === '' && thrownBlock.speaker === null
  && thrownBlock.terms === null, thrownBlock);

ctx.hailApi = {
  resolve: realApi.resolve,
  peek() {
    return {
      open: false,
      intents: ['payTribute'],
      conversationId: 'hail-ghost',
      kind: 'demand',
      speaker: { id: 'ghost', name: 'Nobody' },
      terms: { line: 'gone', options: [], amounts: { demand: 80 } },
    };
  },
};
const ghostBlock = rw.observe().hail;
pin('a closed snapshot names nothing at all',
  ghostBlock.intents.length === 0 && ghostBlock.conversationId === ''
  && ghostBlock.kind === '' && ghostBlock.speaker === null
  && ghostBlock.terms === null, ghostBlock);
ctx.hailApi = realApi;
closeCard();

// ---- 10. No live card: the ring never names a conversation -----------------
ctx.hailApi = undefined;
ctx.flags.hailOpen = true;
ctx.agent.events.push({ type: 'hailOpened', t: 1, intents: ['payTribute', 'refuseFight'] });
const ringBlock = rw.observe().hail;
pin('a historical row never becomes an observable card',
  ringBlock.intents.length === 0 && ringBlock.conversationId === ''
  && ringBlock.kind === '' && ringBlock.speaker === null
  && ringBlock.terms === null, ringBlock);
pin('the empty block keeps the authored key order',
  JSON.stringify(Object.keys(ringBlock))
    === JSON.stringify(['open', 'intents', 'conversationId', 'kind', 'speaker', 'terms']),
  Object.keys(ringBlock));
const ringAct = rw.act({ v: 2, name: 'hailResolve', args: { intent: 'payTribute' } });
pin('missing hail api refuses no-service',
  ringAct.ok === false && ringAct.token === 'no-service', ringAct);
ctx.flags.hailOpen = false;

// Regression: peek() is the single authoritative source for hail.open.
{
  ctx.hailApi = undefined;
  ctx.flags.hailOpen = true;
  pin('stale flag without api reports closed', rw.observe().hail.open === false, 'hailOpen flag must not force open');

  ctx.hailApi = { peek() { throw new Error('peek boom'); } };
  pin('throwing peek reports closed', rw.observe().hail.open === false, 'peek failure must degrade to closed');

  ctx.hailApi = { peek: () => ({ open: false, intents: [], conversationId: 'hail-closed-fixture', kind: '', speaker: null, terms: null }) };
  pin('closed peek reports closed', rw.observe().hail.open === false, 'peek open:false must stay closed');

  let peekCalls = 0;
  ctx.flags.hailOpen = false;
  ctx.hailApi = {
    peek() {
      peekCalls += 1;
      return { open: true, intents: ['letGo'], conversationId: 'hail-open-fixture', kind: 'conversation', speaker: null, terms: null };
    },
  };
  const openView = rw.observe().hail;
  pin('open peek beats false flag', openView.open === true, `open=${openView.open}`);
  pin('open peek carries conversationId', openView.conversationId === 'hail-open-fixture', `conversationId=${openView.conversationId}`);
  pin('one observation peeks once', peekCalls === 1, `peek calls=${peekCalls}`);

  ctx.hailApi = undefined;
  ctx.flags.hailOpen = false;
}

if (fails) {
  console.log(`HAIL IDENTITY FAIL — ${fails}`);
  process.exit(1);
}
console.log('HAIL IDENTITY PASS');
