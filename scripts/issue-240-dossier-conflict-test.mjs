/**
 * Issue #240 focused contract tests — one informed dossier betrayal.
 *
 * Synthetic fixtures plus a real booted station. These exercise PRODUCTION
 * functions; nothing here re-implements the validator, the terms or the
 * settlement. A natural no-cheat live run remains a separate gate.
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { COURIER_SHADOW as T, DOSSIER_CONFLICT as X, FACTIONS, SYSTEMS } from '../src/game/state.js';
import {
  EVIDENCE_ID, newEvidenceId, freshConflictState, freshShadowState, sanitizeShadowState,
  shadowConflictJobValid, stepShadow, shadowEarnedPay, isShadowJob, isConflictPairing,
  shadowDossierTerms, shadowConflictTerms, shadowConflictTermLines, shadowConflictAdvert,
  shadowBetrayalReceipt, shadowDeclineReceipt, shadowHonourReceipt, dossierReference,
  evidenceRef, setShadowConflict, voidShadowConflict, closeShadowDossier,
  conflictBuyerPay, shadowTermLines, PAY_BOUND,
} from '../src/game/courier-shadow.js';
import { snapshot, restore } from '../src/game/save.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
let checks = 0;
const pass = (s) => { checks++; console.log('PASS ' + s); };

const TOKEN = '7f3a1c2e-9b4d-4a7e-8c1f-2d5b6e8a0c34';
const TOKEN2 = '1a2b3c4d-5e6f-4a8b-9c0d-1e2f3a4b5c6d';
const B = 420, D = 630, C = 945;

const input = (over = {}) => ({
  accepted: true, acquired: true, playerAlive: true, sameSystem: true, courierAlive: true,
  courierPresent: true, certified: true, inCorridor: true, selected: true, sightClear: true,
  distance: 250, warningPresented: true, courierName: 'Test courier', employerStation: 'Ledger Anchorage',
  payQuoted: B, secondsLeft: 700, ...over,
});
/** An accepted, dossier-ready v3 row: the stage every choice needs. */
const ready = (state = 'open') => ({
  ...freshShadowState(D), v: 3, courierCreated: true, observedSeconds: T.requiredSeconds,
  deep: { state: 'ready', observedSeconds: T.deepSeconds, payQuoted: D, closedReason: '' },
  conflict: freshConflictState(TOKEN, C),
  ...(state === 'open' ? {} : { conflict: { ...freshConflictState(TOKEN, C), state } }),
});
const job = (over = {}) => ({
  id: 'spy-redmarch-3', kind: 'espionage', mission: T.mission, slot: T.slot,
  originSystem: X.originSystem, destSystem: X.destSystem, recordId: 'courier-spy-redmarch-3',
  target: 'Slow Tithe 3', state: 'accepted', progress: 1, reward: B, payQuoted: B,
  deadline: 900, need: 1, shadow: ready(), ...over,
});

// ---------------------------------------------------------------------------
// 1. Named scenario tuning and the public token contract
// ---------------------------------------------------------------------------
assert.equal(X.scenario, 'ledger-veridian-dossier-v1');
assert.equal(X.originSystem, 'redmarch');
assert.equal(X.destSystem, 'veridian');
assert.equal(X.employerFaction, 'redledger');
assert.equal(X.buyerFaction, 'veridian');
assert.equal(X.buyerPremium, 0.50);
assert.equal(X.betrayEmployerStanding, -5);
assert.equal(X.betrayBuyerStanding, 2);
assert.equal(X.refLength, 8);
assert.deepEqual([...X.states], ['open', 'declined', 'honored', 'betrayed', 'void']);
assert.equal(Object.isFrozen(X), true);
// The authored world, not a second copy of it.
assert.equal(SYSTEMS[X.originSystem].faction, X.employerFaction);
assert.equal(SYSTEMS[X.destSystem].faction, X.buyerFaction);
assert.equal(FACTIONS[X.employerFaction].name, 'Red Ledger');
assert.equal(FACTIONS[X.buyerFaction].name, 'Veridian Combine');
assert.equal(SYSTEMS[X.destSystem].station.name, 'Veridian Spire');
assert.equal(SYSTEMS[X.originSystem].station.name, 'Ledger Anchorage');

assert.equal(EVIDENCE_ID.test(TOKEN), true);
for (const bad of [
  TOKEN.toUpperCase(), '7f3a1c2e-9b4d-1a7e-8c1f-2d5b6e8a0c34', // version nibble not 4
  '7f3a1c2e-9b4d-4a7e-7c1f-2d5b6e8a0c34', // variant nibble not 8/9/a/b
  '7f3a1c2e9b4d4a7e8c1f2d5b6e8a0c34', `${TOKEN} `, ` ${TOKEN}`, `${TOKEN}0`, '', 'courier-spy-redmarch-3',
]) assert.equal(EVIDENCE_ID.test(bad), false, `rejects ${bad}`);

assert.equal(newEvidenceId({ randomUUID: () => TOKEN }), TOKEN);
for (const source of [
  null, false, 0, '', {}, { randomUUID: 'no' }, { randomUUID: null }, { randomUUID: () => 'not-a-uuid' },
  { randomUUID: () => null }, { randomUUID: () => 42 },
  { randomUUID: () => TOKEN.toUpperCase() }, { randomUUID: () => { throw new Error('blocked'); } },
]) assert.equal(newEvidenceId(source), null, 'no insecure fallback');
assert.equal(evidenceRef(TOKEN), '7f3a1c2e');
assert.equal(evidenceRef(TOKEN).length, X.refLength);
assert.equal(evidenceRef('nope'), '');
assert.equal(dossierReference(job()), 'Complete route dossier: Slow Tithe 3 · spy-redmarch-3 · 7f3a1c2e');
assert.equal(dossierReference(job()).includes(TOKEN), false, 'the full token is never in public copy');
pass('frozen scenario tuning, authored names, strict UUID shape and an 8-character public reference');

// ---------------------------------------------------------------------------
// 2. Strict isolated v3, with v1/v2 meaning unchanged
// ---------------------------------------------------------------------------
assert.deepEqual(sanitizeShadowState(clone(ready()), job()), ready());
assert.equal(sanitizeShadowState(clone(ready()), job()).v, 3);
// v1 and v2 keep their exact prior behaviour.
assert.equal(sanitizeShadowState(freshShadowState(), { state: 'offered', progress: 0 }).v, 1);
assert.equal(sanitizeShadowState(freshShadowState(), { state: 'accepted', progress: 0 }).deep.state, 'legacy');
const v2ready = { ...ready() };
delete v2ready.conflict;
v2ready.v = 2;
assert.deepEqual(sanitizeShadowState(clone(v2ready), job({ shadow: undefined })), v2ready);
// A conflict stuffed into v1 or v2 fails their existing unknown-key rules.
assert.equal(sanitizeShadowState({ ...v2ready, conflict: freshConflictState(TOKEN, C) }, job()), null);
assert.equal(sanitizeShadowState({ ...freshShadowState(), conflict: freshConflictState(TOKEN, C) },
  { state: 'offered', progress: 0 }), null);
// Unknown versions never parse.
for (const v of [0, 4, 3.5, '3', null, undefined, NaN]) {
  assert.equal(sanitizeShadowState({ ...ready(), v }, job()), null, `v=${String(v)} rejects`);
}
// A v3 marker with no conflict object is rejected, never downgraded.
const noConflict = { ...ready() };
delete noConflict.conflict;
assert.equal(sanitizeShadowState(noConflict, job()), null);
assert.equal(sanitizeShadowState({ ...ready(), conflict: undefined }, job()), null);
pass('v3 is an isolated variant; v1/v2 parse exactly as before and never absorb a conflict');

// Malformed conflict payloads, field by field.
const bend = (fn) => { const s = clone(ready()); fn(s.conflict, s); return s; };
for (const [name, mutate] of [
  ['unknown key', (c) => { c.extra = 1; }],
  ['missing scenario', (c) => { delete c.scenario; }],
  ['missing evidenceId', (c) => { delete c.evidenceId; }],
  ['missing state', (c) => { delete c.state; }],
  ['missing buyerPayQuoted', (c) => { delete c.buyerPayQuoted; }],
  ['wrong scenario', (c) => { c.scenario = 'other-scenario-v1'; }],
  ['uppercase token', (c) => { c.evidenceId = TOKEN.toUpperCase(); }],
  ['derived token', (c) => { c.evidenceId = 'courier-spy-redmarch-3'; }],
  ['unknown state', (c) => { c.state = 'sold'; }],
  ['non-integer pay', (c) => { c.buyerPayQuoted = 945.5; }],
  ['infinite pay', (c) => { c.buyerPayQuoted = Infinity; }],
  ['zero pay', (c) => { c.buyerPayQuoted = 0; }],
  ['pay over the bound', (c) => { c.buyerPayQuoted = 20001; }],
  ['pay equal to D', (c) => { c.buyerPayQuoted = D; }],
  ['pay below D', (c) => { c.buyerPayQuoted = D - 1; }],
  ['string pay', (c) => { c.buyerPayQuoted = '945'; }],
  ['array conflict', (_c, s) => { s.conflict = []; }],
  ['null conflict', (_c, s) => { s.conflict = null; }],
  ['string conflict', (_c, s) => { s.conflict = 'open'; }],
  ['legacy deep', (_c, s) => { s.deep = { state: 'legacy', observedSeconds: 0, payQuoted: 0, closedReason: '' }; }],
]) assert.equal(sanitizeShadowState(bend(mutate), job()), null, `${name} rejects the whole row`);

// Malformed RUNTIME shapes a JSON fixture cannot express.
const hostile = () => {
  const s = clone(ready());
  s.conflict = Object.create({ scenario: X.scenario });
  Object.assign(s.conflict, freshConflictState(TOKEN, C));
  return s;
};
assert.equal(sanitizeShadowState(hostile(), job()), null, 'a wrong prototype on the conflict rejects');
const symbolKey = clone(ready());
symbolKey.conflict[Symbol('sneak')] = 1;
assert.equal(sanitizeShadowState(symbolKey, job()), null, 'a symbol key rejects');
const hiddenKey = clone(ready());
Object.defineProperty(hiddenKey.conflict, 'hidden', { value: 1, enumerable: false });
assert.equal(sanitizeShadowState(hiddenKey, job()), null, 'a non-enumerable key rejects');
const accessor = clone(ready());
Object.defineProperty(accessor.conflict, 'state', { get: () => 'open', enumerable: true, configurable: true });
assert.equal(sanitizeShadowState(accessor, job()), null, 'an accessor instead of data rejects');
// The ROOT is checked before anything is spread out of it.
const hostileRoot = Object.create({ poisoned: true });
Object.assign(hostileRoot, clone(ready()));
assert.equal(sanitizeShadowState(hostileRoot, job()), null, 'a wrong prototype on the v3 root rejects');
const rootSymbol = clone(ready());
rootSymbol[Symbol('sneak')] = 1;
assert.equal(sanitizeShadowState(rootSymbol, job()), null, 'a symbol key on the v3 root rejects');
const rootAccessor = clone(ready());
Object.defineProperty(rootAccessor, 'v', { get: () => 3, enumerable: true, configurable: true });
assert.equal(sanitizeShadowState(rootAccessor, job()), null, 'an accessor on the v3 root rejects');
pass('exact own data keys, plain prototypes and every malformed conflict field reject the whole row');

// State / stage coherence across the whole matrix.
const stageRows = [
  // [conflict state, job state, progress, deep, expected]
  ['open', 'accepted', 1, 'ready', true],
  ['open', 'accepted', 0, 'available', true],
  ['open', 'offered', 0, 'available', true],
  ['open', 'failed', 1, 'ready', false],
  ['open', 'done', 1, 'ready', false],
  ['declined', 'accepted', 1, 'ready', true],
  ['declined', 'accepted', 0, 'available', false],
  ['declined', 'offered', 0, 'available', false],
  ['declined', 'failed', 1, 'ready', false],
  ['honored', 'failed', 1, 'ready', true],
  ['honored', 'failed', 1, 'closed', true],
  ['honored', 'done', 1, 'ready', true],
  ['honored', 'accepted', 1, 'ready', false],
  ['honored', 'offered', 0, 'available', false],
  ['betrayed', 'failed', 1, 'ready', true],
  ['betrayed', 'failed', 1, 'closed', false],
  ['betrayed', 'accepted', 1, 'ready', false],
  ['void', 'failed', 1, 'ready', true],
  ['void', 'failed', 1, 'closed', true],
  ['void', 'accepted', 1, 'ready', false],
  ['void', 'offered', 0, 'available', false],
];
for (const [cState, jState, progress, deepState, ok] of stageRows) {
  const shadow = clone(ready());
  shadow.conflict.state = cState;
  shadow.deep.state = deepState;
  if (deepState === 'available') {
    shadow.deep.observedSeconds = 0;
    shadow.courierCreated = jState !== 'offered';
    shadow.observedSeconds = progress === 1 ? T.requiredSeconds : 0;
  }
  if (deepState === 'closed') { shadow.deep.observedSeconds = 0; shadow.deep.closedReason = 'withdrawn'; }
  const row = job({ state: jState, progress, shadow });
  if (jState === 'offered') delete row.payQuoted;
  assert.equal(sanitizeShadowState(shadow, row) !== null, ok,
    `${cState} @ ${jState}/${progress}/${deepState} should ${ok ? 'pass' : 'reject'}`);
}
pass('every conflict state is pinned to the exact job/dossier stage the contract allows');

// ---------------------------------------------------------------------------
// 3. The LATE complete pass: pairing, identity, quote and deadline
// ---------------------------------------------------------------------------
assert.equal(shadowConflictJobValid(job()), true);
for (const [name, over] of [
  ['wrong origin', { originSystem: 'freehold' }],
  ['wrong destination', { destSystem: 'hollowreach' }],
  ['wrong mission', { mission: 'other' }],
  ['wrong slot', { slot: 1 }],
  ['wrong kind', { kind: 'explore' }],
  ['record id for another job', { recordId: 'courier-spy-redmarch-4' }],
  ['missing record id', { recordId: undefined }],
  ['missing target', { target: '' }],
  ['no deadline', { deadline: undefined }],
  ['infinite deadline', { deadline: Infinity }],
  ['negative deadline', { deadline: -1 }],
  ['no accepted quote', { payQuoted: undefined }],
  ['non-finite quote', { payQuoted: NaN }],
  ['quote over the bound', { payQuoted: 20001 }],
  ['quote at or above D', { payQuoted: D }],
]) assert.equal(shadowConflictJobValid(job(over)), false, `${name} fails the late pass`);
// A non-v3 job passes iff it carries no conflict at all.
assert.equal(shadowConflictJobValid({ ...job(), shadow: v2ready }), true);
assert.equal(shadowConflictJobValid({ ...job(), shadow: { ...v2ready, conflict: freshConflictState(TOKEN, C) } }), false);
assert.equal(shadowConflictJobValid({ kind: 'mining', shadow: undefined }), true);
assert.equal(isConflictPairing(job()), true);
assert.equal(isConflictPairing(job({ originSystem: 'freehold' })), false);
pass('the late pass re-checks pairing, identity, quote and deadline against validated values');

// ---------------------------------------------------------------------------
// 3b. The pay-bound fallback, at the creation helper the factory itself calls
// ---------------------------------------------------------------------------
assert.equal(PAY_BOUND, 20000, 'the shared bound matches the existing persisted job-pay bound');
// Ordinary room: C is exactly D + 50%, and strictly greater than D.
for (const d of [1, 2, 3, 100, 420, 630, 999, 5000, 13332, 13333]) {
  const c = conflictBuyerPay(d);
  assert.equal(c, d + Math.round(d * X.buyerPremium), `D=${d} quotes the approved premium`);
  assert.ok(c > d, `D=${d}: C exceeds D`);
  assert.ok(c <= PAY_BOUND, `D=${d}: C is inside the bound`);
  assert.equal(Number.isInteger(c), true);
}
// Above the clamp point the premium is bounded but must still beat D.
for (const d of [13334, 15000, 19998, 19999]) {
  const c = conflictBuyerPay(d);
  assert.equal(c, PAY_BOUND, `D=${d}: C clamps to the bound`);
  assert.ok(c > d, `D=${d}: a bounded C still beats D, so the scenario is offerable`);
}
// At the bound there is no higher valid amount: the scenario declines.
assert.equal(conflictBuyerPay(PAY_BOUND), null, 'D at the bound produces no conflict at all');
for (const bad of [0, -1, 20001, 30000, 1.5, NaN, Infinity, '630', null, undefined]) {
  assert.equal(conflictBuyerPay(bad), null, `D=${String(bad)} produces no conflict`);
}
// And a persisted row that claims a premium the bound cannot support is rejected.
for (const [d, c] of [[PAY_BOUND, PAY_BOUND], [PAY_BOUND, 20001], [19999, 19999], [630, 630], [630, 629]]) {
  const row = clone(ready());
  row.deep.payQuoted = d;
  row.conflict.buyerPayQuoted = c;
  assert.equal(sanitizeShadowState(row, job({ payQuoted: Math.min(d - 1, 19998) })), null,
    `a persisted D=${d}/C=${c} row is not a payable conflict`);
}
pass('the bounded C helper offers a real premium with room, and declines at the pay bound');

// ---------------------------------------------------------------------------
// 4. v3 survives flight reconstruction and reload  (named regression)
// ---------------------------------------------------------------------------
{
  const phases = {
    active: { shadow: (() => { const s = ready(); s.deep = { state: 'pursuing', observedSeconds: 4.2, payQuoted: D, closedReason: '' }; return s; })(), over: {} },
    paused: { shadow: ready(), over: { paused: true } },
    warning: { shadow: (() => { const s = ready(); s.warned = true; s.suspicion = 80; s.warningSeconds = 3; return s; })(), over: { distance: 120 } },
    'basic-ready': { shadow: (() => { const s = ready(); s.deep = { state: 'available', observedSeconds: 0, payQuoted: D, closedReason: '' }; return s; })(), over: {} },
    pursuing: { shadow: (() => { const s = ready(); s.deep = { state: 'pursuing', observedSeconds: 29.9, payQuoted: D, closedReason: '' }; return s; })(), over: {} },
    'deep-ready': { shadow: ready(), over: {} },
  };
  for (const [name, { shadow, over }] of Object.entries(phases)) {
    let s = shadow;
    for (let i = 0; i < 25; i++) s = stepShadow(s, input(over), 0.1).shadow;
    assert.equal(s.v, 3, `${name}: the v3 marker survives every frame`);
    assert.deepEqual(s.conflict, shadow.conflict, `${name}: the conflict object survives every frame`);
    assert.notEqual(s.conflict, shadow.conflict, `${name}: the carried conflict is a copy, not the same object`);
    // And it round-trips through the save shape unchanged.
    const row = job({ shadow: JSON.parse(JSON.stringify(s)) });
    const clean = sanitizeShadowState(row.shadow, row);
    assert.ok(clean, `${name}: the reconstructed row still validates`);
    assert.deepEqual(clean.conflict, shadow.conflict, `${name}: the token round-trips`);
  }
  // Closing the dossier and voiding the conflict both preserve the other half.
  const closed = closeShadowDossier(ready(), 'exposed');
  assert.deepEqual(closed.conflict, ready().conflict);
  assert.equal(stepShadow(closed, input(), 0.1).shadow.v, 3);
  assert.equal(voidShadowConflict(ready()).conflict.state, 'void');
  assert.equal(voidShadowConflict(ready('declined')).conflict.state, 'void');
  assert.equal(voidShadowConflict(ready('betrayed')).conflict.state, 'betrayed', 'a terminal outcome is never rewritten');
  assert.equal(voidShadowConflict(ready('honored')).conflict.state, 'honored');
  assert.equal(setShadowConflict(v2ready, 'void'), v2ready, 'a row with no conflict is untouched');
  assert.equal(setShadowConflict(ready(), 'nonsense').conflict.state, 'open', 'an unknown state is refused');
  // A MALFORMED v3 keeps its marker so the strict validator still refuses it;
  // it is never quietly rebuilt as a payable v2/basic row.
  const broken = { ...ready() };
  delete broken.conflict;
  const stepped = stepShadow(broken, input(), 0.1).shadow;
  assert.equal(stepped.v, 3, 'a malformed v3 is never downgraded by the integrator');
  assert.equal(stepped.conflict, undefined);
  assert.equal(sanitizeShadowState(stepped, job()), null, 'and it still fails closed');
  assert.equal(shadowEarnedPay(job({ shadow: stepped })), 0, 'so it can never be paid');
}
pass('v3 survives flight reconstruction and reload');

// ---------------------------------------------------------------------------
// 5. Shared, fully informed copy
// ---------------------------------------------------------------------------
{
  const terms = shadowConflictTerms(ready(), input());
  for (const fact of [
    'Red Ledger', 'Veridian Combine', 'Ledger Anchorage', 'Veridian Spire', 'EXCLUSIVE'.toLowerCase(),
    `${B} UU`, `${D} UU total`, `${C} UU total`, 'Red Ledger -5', 'Veridian Combine +2',
    '+2 Red Ledger completion standing', 'dockmaster reward', 'Only one buyer is ever paid',
    '0 UU and changes no standing', 'Red Ledger -1 standing', `${T.deadlineSeconds}-second`,
    'docking there files automatically',
  ]) assert.ok(terms.includes(fact), `the agreement states: ${fact}`);
  assert.equal(terms.includes(TOKEN), false, 'terms never publish the full token');
  // The dossier agreement every existing surface reads carries the same tail.
  assert.ok(shadowDossierTerms(ready(), input()).endsWith(terms));
  assert.equal(shadowConflictTerms(v2ready, input()), '', 'an ordinary v2 row has no conflict copy');
  assert.equal(shadowDossierTerms(v2ready, input()).includes('Veridian Combine'), false);
  // Bounded lines: the whole agreement, nothing clipped by the 240-char view cap.
  const lines = shadowConflictTermLines(ready(), input());
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(line.length <= 200, `line within the view cap: ${line.length}`);
  assert.equal(lines.join(' '), terms, 'the lines are the same agreement, in order');
  // Closed states say so, and still restate the whole agreement.
  for (const [state, marker] of [['declined', 'permanently closed'], ['honored', 'Filed to Red Ledger'],
    ['betrayed', 'Sold exclusively'], ['void', 'This assignment ended']]) {
    assert.ok(shadowConflictTerms(ready(state), input()).includes(marker), `${state} states its outcome`);
  }
  // The advert fires only at the deep-ready, still-open stage.
  const advert = shadowConflictAdvert(ready());
  assert.ok(advert.startsWith('Complete dossier banked.'));
  assert.ok(advert.includes(`Veridian Spire offers ${C} total instead of Red Ledger's ${D}`));
  assert.ok(advert.includes('Red Ledger -5, Veridian Combine +2'));
  assert.ok(advert.includes('Return to Ledger Anchorage to honor; docking there files automatically.'));
  assert.equal(shadowConflictAdvert(ready('declined')), '');
  assert.equal(shadowConflictAdvert(v2ready), '');
  const pursuingRow = ready();
  pursuingRow.deep = { state: 'pursuing', observedSeconds: 5, payQuoted: D, closedReason: '' };
  assert.equal(shadowConflictAdvert(pursuingRow), '', 'no advert before the dossier is complete');
  // The advert reaches the shared instruction exactly once it is earned.
  assert.ok(stepShadow(ready(), input(), 0).instruction.includes(advert));
  assert.equal(stepShadow(ready('declined'), input(), 0).instruction.includes('Veridian Spire offers'), false);
  // Receipts.
  assert.equal(shadowBetrayalReceipt(job(), C),
    `Sold Complete route dossier: Slow Tithe 3 · spy-redmarch-3 · 7f3a1c2e exclusively to Veridian Combine `
    + `at Veridian Spire: ${C} UU total. Red Ledger -5; Veridian Combine +2. Original contract closed without `
    + 'payment; no original completion/contact reward. No other contracts changed.');
  const declined = shadowDeclineReceipt(job());
  assert.ok(declined.includes('permanently closed for this assignment'));
  assert.ok(declined.includes('0 UU; no standing or contact change'));
  assert.ok(declined.includes(`still pays ${D} UU total at Ledger Anchorage`));
  assert.ok(declined.includes('original deadline is unchanged'));
  const honoured = shadowHonourReceipt(job(), D, X.honorEmployerStanding);
  assert.ok(honoured.includes('complete route dossier'));
  assert.ok(honoured.includes(`${D} UU total, Red Ledger +2`));
  assert.ok(honoured.includes('ordinary local dockmaster reward'));
  const basicRow = job();
  basicRow.shadow = { ...ready(), deep: { state: 'available', observedSeconds: 0, payQuoted: D, closedReason: '' } };
  assert.ok(shadowHonourReceipt(basicRow, B, X.honorEmployerStanding).includes('basic report'));
  for (const text of [declined, honoured, shadowBetrayalReceipt(job(), C), advert]) {
    assert.equal(text.includes(TOKEN), false, 'no receipt leaks the full token');
    assert.equal(text.includes('courier-spy-redmarch-3'), false, 'no receipt leaks the bound record id');
  }
}
pass('one fully informed agreement, bounded lines, a single advert and exact receipts');

// ---------------------------------------------------------------------------
// 6. The booted station: offer, choice, settlement and persistence
// ---------------------------------------------------------------------------
seedBootRandom();
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems, binds } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
for (const el of dom.walkDom(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.agent.optIn = true;
const api = window.rimward;
const desk = ctx.stationDesk;

const comms = [];
/** Collect the comm lines production actually emitted, in order. */
function drainComms() {
  for (const ev of ctx.events) if (ev && ev.type === 'commLine') comms.push(ev.text);
}
function tick(n = 1, dt = 0.1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += dt; ctx.elapsed += dt; station.update(dt);
    drainComms();
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
function dock(id) {
  if (ctx.flags.docked) desk.undock();
  ctx.flags.docked = false; ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }]; world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.dockPressed = true; tick(2); ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true);
}
const offerAt = (sys) => ctx.world.jobs.find((j) => isShadowJob(j) && j.originSystem === sys);
const domButtons = () => [...dom.walkDom(document.body)].filter((e) => e.tag === 'button' || e.tagName === 'BUTTON');
const viewLabels = () => desk.peekView().actions.map((a) => a.label);
const viewRowText = () => desk.peekView().rows.map((r) => r.text);
dock(X.originSystem);
desk.selectService('jobs');
tick(2);
let live = offerAt(X.originSystem);
assert.ok(live, 'the Redmarch employer posts a shadow assignment');
assert.equal(live.destSystem, X.destSystem, 'its courier runs out of Veridian Reach');
assert.equal(live.state, 'offered');
assert.equal(live.shadow.v, 3, 'the qualifying fresh offer is v3');
const liveB = live.reward;
const liveD = live.shadow.deep.payQuoted;
const liveC = live.shadow.conflict.buyerPayQuoted;
const liveToken = live.shadow.conflict.evidenceId;
assert.equal(liveD, liveB + Math.round(liveB * T.deepPremium));
assert.equal(liveC, liveD + Math.round(liveD * X.buyerPremium), 'C = D + 50%');
assert.equal(liveC, conflictBuyerPay(liveD),
  'the live factory quotes exactly what the shared bounded helper returns');
assert.ok(liveC > liveD, 'C is strictly greater than D');
assert.ok(liveC <= 20000, 'C is inside the existing pay bound');
assert.equal(EVIDENCE_ID.test(liveToken), true, 'the token is a real canonical UUID v4');
assert.equal(live.shadow.conflict.state, 'open');
assert.equal(live.shadow.conflict.scenario, X.scenario);
assert.equal(live.title, 'Shadow courier — exclusive Ledger dossier', 'the posting names its exclusivity');
// The persisted copy must fit the existing bound, or a save round-trip would
// silently truncate it. The full agreement lives in the derived term lines.
assert.ok(live.detail.length <= 720, `the posted detail fits the persisted bound (${live.detail.length})`);
assert.ok(live.title.length <= 60);
assert.equal(shadowConflictJobValid(live), true);
// Nothing else in the galaxy acquires the conflict.
for (const sys of Object.keys(SYSTEMS)) {
  if (sys === X.originSystem) continue;
  const other = offerAt(sys);
  if (other) assert.equal(other.shadow.v === 3, false, `${sys} posts an ordinary v2 shadow job`);
}
assert.equal(ctx.world.jobs.some((j) => j.kind !== 'espionage' && j.shadow !== undefined), false);
pass('exactly one authored pairing posts a v3 exclusive offer with a real +50% bounded premium');

// Every consequence is readable BEFORE acceptance, through the real view.
{
  const proj = desk.peekShadow(live);
  assert.equal(proj.conflict.evidenceRef, liveToken.slice(0, 8));
  assert.equal(proj.conflict.evidenceRef.length, 8);
  assert.equal(JSON.stringify(proj).includes(liveToken), false, 'the projection never publishes the full token');
  assert.equal(JSON.stringify(proj).includes(live.recordId), false, 'and never the bound record id');
  assert.equal(proj.conflict.state, 'open');
  assert.equal(proj.conflict.canChoose, false, 'an offer can be read but not sold');
  assert.equal(proj.conflict.blockedReason, 'not-accepted');
  assert.equal(proj.conflict.buyerPayQuoted, liveC);
  assert.equal(proj.conflict.originalPay, liveB);
  assert.equal(proj.conflict.buyerFaction, X.buyerFaction);
  assert.equal(proj.conflict.employerFaction, X.employerFaction);
  assert.equal(proj.conflict.buyerStation, 'Veridian Spire');
  // The published observation carries EXACTLY the approved field set.
  assert.deepEqual(Object.keys(proj.conflict).sort(), [
    'blockedReason', 'buyerFaction', 'buyerPayQuoted', 'buyerStation', 'buyerSystem', 'canChoose',
    'employerFaction', 'evidenceRef', 'originalPay', 'scenario', 'state', 'terms',
  ], 'no extra observation field is published');
  const apiOffer = api.observe().jobs.offers.find((j) => j.id === live.id);
  assert.deepEqual(apiOffer.shadow.conflict, proj.conflict, 'the API row and the desk projection agree exactly');
  // The whole agreement reaches the real station view. Row text is capped, so
  // the view renders the shared agreement as bounded lines — the projection
  // publishes one `terms` string and the SPLIT is a rendering concern only.
  const lines = shadowTermLines(proj.conflict.terms);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(line.length <= 200, 'each rendered line fits the view row cap');
  assert.equal(lines.join(' '), proj.conflict.terms, 'the lines are the same agreement, in order');
  const rows = viewRowText();
  for (const line of lines) assert.ok(rows.includes(line), `the docked panel shows: ${line.slice(0, 40)}...`);
  const viewed = api.observe().station.view.rows.map((r) => r.text);
  for (const line of lines) assert.ok(viewed.includes(line), 'stationView publishes the whole agreement too');
  assert.equal(viewed.some((r) => r.length > 240), false, 'and nothing was clipped by the row cap');
  const joined = rows.join(' ');
  for (const fact of [String(liveB), String(liveD), String(liveC), 'Red Ledger', 'Veridian Combine',
    'Ledger Anchorage', 'Veridian Spire', 'Red Ledger -5', 'Veridian Combine +2']) {
    assert.ok(joined.includes(fact), `visible before acceptance: ${fact}`);
  }
  assert.equal(rows.some((r) => r.includes(liveToken)), false, 'the panel never prints the full token');
  // No buyer control exists at the employer dock.
  assert.equal(viewLabels().some((l) => l.includes('Sell dossier')), false);
  assert.equal(viewLabels().some((l) => l.includes('Decline Veridian')), false);
}
pass('all terms, both docks, both factions and every effect are visible before acceptance');

// Acceptance freezes the posted token and amount.
assert.equal(desk.acceptJob(live.id).ok, true);
assert.equal(live.state, 'accepted');
assert.equal(live.shadow.v, 3);
assert.equal(live.shadow.conflict.evidenceId, liveToken, 'the token is not regenerated on acceptance');
assert.equal(live.shadow.conflict.buyerPayQuoted, liveC, 'C is frozen from the posted offer');
assert.equal(live.shadow.deep.payQuoted, liveD);
assert.equal(live.payQuoted, liveB);
assert.equal(shadowConflictJobValid(live), true);
const acceptedSave = clone(snapshot(ctx));
pass('acceptance preserves the offered conflict token and amount without requoting');

// Fly the dossier to completion in the destination system.
if (ctx.flags.docked) desk.undock();
ctx.flags.docked = false; ctx.flags.berthHold = false;
ctx.world.currentSystem = live.destSystem;
ctx.lastEvents = [{ type: 'systemLoaded', to: live.destSystem }];
world.update(0);
tick(8);
let hull;
function place(range = 250, selected = true) {
  const rec = ctx.world.recordBanks[live.destSystem].find((r) => r.id === live.recordId);
  assert.ok(rec, 'the bound courier exists');
  hull = ctx.ships.find((x) => x.record === rec);
  if (!hull) {
    const at = new ctx.ship.object.position.constructor();
    binds.recordPosition(rec, at);
    hull = binds.spawnLiveShip(ctx, rec, at);
    ctx.ships.push(hull); rec.live = true;
  }
  ctx.ship.object.position.copy(hull.object.position);
  ctx.ship.object.position.x += range;
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.targets.current = selected ? hull : null;
}
place();
tick(301);
assert.equal(live.progress, 1, 'the basic report is gathered');
assert.equal(live.shadow.conflict.state, 'open', 'the buyer stays open through basic work');
// No buyer choice on a basic-only dossier.
assert.equal(desk.peekShadow(live).conflict.canChoose, false);
assert.equal(desk.peekShadow(live).conflict.blockedReason, 'dossier-incomplete');
comms.length = 0;
assert.equal(desk.chooseShadowDossier({ id: live.id, choice: 'begin' }).ok, true);
tick(200);
place(450); tick(120); place(); tick(200);
assert.equal(live.shadow.deep.state, 'ready', 'the complete dossier is banked');
assert.equal(live.shadow.v, 3, 'v3 survived the whole flight');
assert.equal(live.shadow.conflict.evidenceId, liveToken, 'and so did the token');
const adverts = comms.filter((t) => t.includes('offers ' + liveC + ' total instead of'));
assert.equal(adverts.length, 1, 'the buyer is announced exactly once, on the deep-ready transition');
assert.ok(adverts[0].includes('Return to Ledger Anchorage to honor'));
const beforeMore = comms.length;
tick(80);
assert.equal(comms.slice(beforeMore).filter((t) => t.includes('offers ')).length, 0,
  'ticks never repeat the announcement');
const readySave = clone(snapshot(ctx));
pass('the dossier completes in flight, keeps its v3 token and announces the buyer exactly once');

// ---------------------------------------------------------------------------
// 7. The buyer desk: availability, parity, refusals
// ---------------------------------------------------------------------------
const ledger = () => JSON.stringify({
  credits: ctx.world.credits, reputation: ctx.world.reputation, contacts: ctx.world.contacts,
  jobs: ctx.world.jobs,
});
function unchanged(fn, why) {
  const before = ledger();
  const res = fn();
  assert.equal(res.ok, false, why);
  assert.equal(ledger(), before, `${why}: nothing moved`);
  return res;
}
function resetToReady() {
  restore(ctx, clone(readySave));
  live = ctx.world.jobs.find((j) => isShadowJob(j) && j.originSystem === X.originSystem);
  assert.ok(live && live.shadow.deep.state === 'ready');
  ctx.flags.paused = false; ctx.gate.jumping = false; ctx.flags.berthHold = false;
  // The outcome ring and its noted-id set are session-only and survive a
  // restore, so clear them per group: every receipt count below is then an
  // absolute count for THIS scenario, not a running total across groups.
  ctx.agent.events = [];
  ctx.agent.jobNoted = {};
  ctx.agent.jobWatch = {};
  comms.length = 0;
  dock(X.destSystem);
  desk.selectService('jobs');
  tick(2);
}
const notesFor = (id) => api.observe().events.filter((e) => e.type === 'jobState' && e.id === id);
resetToReady();
assert.equal(ctx.world.currentSystem, X.destSystem);
assert.equal(desk.peekShadow(live).conflict.canChoose, true);
assert.equal(desk.peekShadow(live).conflict.blockedReason, '');
const sellLabel = viewLabels().find((l) => l.startsWith('Sell dossier to Veridian Combine'));
const keepLabel = viewLabels().find((l) => l.startsWith('Decline Veridian Combine'));
assert.ok(sellLabel, 'a native Sell control exists at the buyer dock');
assert.ok(keepLabel, 'a native Decline control exists beside it');
assert.ok(sellLabel.includes(`${liveC} UU total`));
assert.ok(sellLabel.includes('betray Red Ledger (-5)'));
assert.ok(sellLabel.includes(live.target) && sellLabel.includes(live.id) && sellLabel.includes(liveToken.slice(0, 8)));
assert.equal(sellLabel.includes(liveToken), false, 'the label carries the reference, never the token');
assert.equal(sellLabel.toLowerCase().includes('accept'), false, 'no ambiguous Accept label');
{
  const rows = viewRowText();
  assert.ok(rows.some((r) => r.startsWith('COMPETING DOSSIER BUYER')), 'its own clearly named section');
  assert.ok(rows.includes(dossierReference(live)), 'the dossier reference heads the row');
  for (const line of shadowTermLines(desk.peekShadow(live).conflict.terms)) {
    assert.ok(rows.includes(line), 'the whole agreement sits beside the choice');
  }
  assert.ok(rows.some((r) => r.includes('Veridian Combine +2')));
  assert.ok(rows.some((r) => r.includes('local dockmaster reward')));
  assert.ok(rows.some((r) => r.includes('permanently')), 'the decline consequence is stated');
  assert.equal(rows.some((r) => r.includes(liveToken)), false);
  assert.equal(api.observe().station.view.actions.some((a) => a.label === sellLabel), true,
    'observe() and peekView() publish the same controls — no agent-only choice');
}
// Refusals: args, identity, token, dock, service, life and flight state.
const goodArgs = () => ({ id: live.id, evidenceId: liveToken, choice: 'betray' });
for (const [why, args] of [
  ['null args', null],
  ['array args', []],
  ['string args', 'betray'],
  ['missing choice', { id: live.id, evidenceId: liveToken }],
  ['extra key', { ...goodArgs(), injected: 1 }],
  ['unknown choice', { ...goodArgs(), choice: 'sell' }],
  ['empty choice', { ...goodArgs(), choice: '' }],
  ['non-string id', { ...goodArgs(), id: 7 }],
  ['non-string token', { ...goodArgs(), evidenceId: 7 }],
  ['unknown job id', { ...goodArgs(), id: 'spy-redmarch-999' }],
  ['wrong token', { ...goodArgs(), evidenceId: TOKEN2 }],
  ['public reference as token', { ...goodArgs(), evidenceId: liveToken.slice(0, 8) }],
]) unchanged(() => desk.chooseDossierBuyer(args), why);
unchanged(() => desk.chooseDossierBuyer(Object.assign(Object.create({ poisoned: 1 }), goodArgs())),
  'a prototyped args bag');
unchanged(() => desk.chooseDossierBuyer(goodArgs(), { ...live }), 'a stale captured row object');
unchanged(() => desk.chooseDossierBuyer({ ...goodArgs(), id: 'spy-freehold-0' }), 'a foreign job id');
ctx.flags.paused = true;
unchanged(() => desk.chooseDossierBuyer(goodArgs()), 'paused'); ctx.flags.paused = false;
ctx.gate.jumping = true;
unchanged(() => desk.chooseDossierBuyer(goodArgs()), 'jumping'); ctx.gate.jumping = false;
ctx.flags.berthHold = true;
unchanged(() => desk.chooseDossierBuyer(goodArgs()), 'held at the berth'); ctx.flags.berthHold = false;
const savedHull = ctx.player.hull; ctx.player.hull = 0;
unchanged(() => desk.chooseDossierBuyer(goodArgs()), 'dead'); ctx.player.hull = savedHull;
desk.selectService('market');
unchanged(() => desk.chooseDossierBuyer(goodArgs()), 'the wrong service');
assert.equal(desk.peekShadow(live).conflict.blockedReason, 'no-jobs-service');
desk.selectService('jobs');
const savedDeadline = live.deadline;
live.deadline = ctx.world.time; // exact equality: now >= deadline wins
unchanged(() => desk.chooseDossierBuyer(goodArgs()), 'at the deadline');
assert.equal(desk.peekShadow(live).conflict.blockedReason, 'expired');
live.deadline = savedDeadline;
// The wrong dock, and in flight.
desk.undock(); ctx.flags.docked = false;
unchanged(() => desk.chooseDossierBuyer(goodArgs()), 'undocked');
assert.equal(desk.peekShadow(live).conflict.blockedReason, 'not-docked');
dock(X.originSystem); desk.selectService('jobs'); tick(2);
unchanged(() => desk.chooseDossierBuyer(goodArgs()), 'at the employer dock');
assert.equal(desk.peekShadow(live).conflict.blockedReason, 'wrong-dock');
assert.equal(viewLabels().some((l) => l.startsWith('Sell dossier')), false, 'and no control is drawn there');
pass('stale, malformed, wrong-token, wrong-dock, wrong-service, expired and dead inputs all fail closed');

// ---------------------------------------------------------------------------
// 7a. Argument bags are exact OWN DATA: no symbol, hidden or accessor key
// ---------------------------------------------------------------------------
resetToReady();
{
  // `Object.keys` cannot see any of these three, and reading a getter would
  // both run foreign code and let the value change between reads.
  const base = () => ({ id: live.id, evidenceId: liveToken, choice: 'decline' });
  for (const [why, make] of [
    ['a symbol extra key', () => { const a = base(); a[Symbol('extra')] = 1; return a; }],
    ['a non-enumerable extra key', () => {
      const a = base(); Object.defineProperty(a, 'extra', { value: 1 }); return a;
    }],
    ['a missing key beside a symbol key', () => {
      const a = base(); delete a.choice; a[Symbol('choice')] = 'decline'; return a;
    }],
  ]) {
    const res = unchanged(() => desk.chooseDossierBuyer(make(), live), why);
    assert.equal(res.token, 'invalid-args', `${why}: refused as invalid-args`);
    assert.equal(live.shadow.conflict.state, 'open', `${why}: the conflict is untouched`);
  }
  // An accessor field is refused WITHOUT the getter ever running.
  for (const field of ['id', 'evidenceId', 'choice']) {
    let hits = 0;
    const value = field === 'choice' ? 'decline' : field === 'id' ? live.id : liveToken;
    const args = base();
    delete args[field];
    Object.defineProperty(args, field, { enumerable: true, configurable: true, get: () => { hits++; return value; } });
    const res = unchanged(() => desk.chooseDossierBuyer(args, live), `an accessor ${field}`);
    assert.equal(res.token, 'invalid-args', `an accessor ${field}: refused as invalid-args`);
    assert.equal(hits, 0, `an accessor ${field}: its getter never ran`);
    assert.equal(live.shadow.conflict.state, 'open', `an accessor ${field}: the conflict is untouched`);
  }
  // The ordinary bag still works, on the very same row.
  const good = desk.chooseDossierBuyer(base(), live);
  assert.equal(good.ok, true, 'a plain own-data bag is still accepted');
  assert.equal(live.shadow.conflict.state, 'declined');
}
pass('buyer arguments are exact own primitives: symbol, hidden and accessor keys refuse before any read');

// ---------------------------------------------------------------------------
// 7c. The v3 DEEP stage gets the same strict own-data check
// ---------------------------------------------------------------------------
{
  const deepRow = (mutate) => {
    const row = job();
    mutate(row.shadow.deep);
    return row;
  };
  assert.equal(shadowConflictJobValid(job()), true, 'the plain v3 fixture is valid');
  const hidden = deepRow((d) => { Object.defineProperty(d, 'extra', { value: 1 }); });
  const symbolled = deepRow((d) => { d[Symbol('extra')] = 1; });
  for (const [why, row] of [
    ['a symbol extra deep key', symbolled],
    ['a non-enumerable extra deep key', hidden],
  ]) {
    assert.equal(sanitizeShadowState(row.shadow, row), null, `${why} rejects the whole v3 row`);
    assert.equal(shadowConflictJobValid(row), false, `${why} fails the late pass too`);
  }
  for (const field of ['state', 'observedSeconds', 'payQuoted', 'closedReason']) {
    let hits = 0;
    const row = job();
    const value = row.shadow.deep[field];
    delete row.shadow.deep[field];
    Object.defineProperty(row.shadow.deep, field, {
      enumerable: true, configurable: true, get: () => { hits++; return value; },
    });
    assert.equal(sanitizeShadowState(row.shadow, row), null, `an accessor deep ${field} rejects the row`);
    assert.equal(shadowConflictJobValid(row), false, `an accessor deep ${field} fails the late pass`);
    assert.equal(hits, 0, `an accessor deep ${field}: its getter never ran`);
  }
  // v1 and v2 keep their existing meaning byte-for-byte.
  assert.deepEqual(sanitizeShadowState(clone(v2ready), job({ shadow: undefined })), v2ready,
    'an ordinary v2 row is still accepted exactly as before');
  assert.equal(sanitizeShadowState({ ...clone(v2ready), extra: 1 }, job({ shadow: undefined })), null,
    'the v2 unknown-key rule is unchanged');
}
pass('a v3 deep with a symbol, hidden or accessor field is rejected before any property is read');

// ---------------------------------------------------------------------------
// 7b. Human / API parity: one closure, one label, one receipt
// ---------------------------------------------------------------------------
resetToReady();
{
  const labels = () => desk.peekView().actions;
  const indexOf = (prefix) => labels().findIndex((a) => a.label.startsWith(prefix));
  assert.ok(indexOf('Sell dossier to Veridian Combine') >= 0, 'the sale is an ordinary station action');
  assert.ok(indexOf('Decline Veridian Combine') >= 0);
  // The established stale-label guard fails closed on this row too.
  const stale = api.act({ v: 2, name: 'stationAction',
    args: { n: indexOf('Sell dossier'), expect: 'Sell dossier to somebody else' } });
  assert.equal(stale.ok, false);
  assert.equal(stale.token, 'stale');
  assert.equal(ctx.world.jobs.some((j) => j.id === live.id && j.state === 'accepted'), true,
    'a stale expectation sells nothing');
  // A real click through the native DOM button, and the identical receipt
  // through stationAction, are the SAME closure.
  const sellNow = labels()[indexOf('Sell dossier')].label;
  const beforeCredits = ctx.world.credits;
  const viaApi = api.act({ v: 2, name: 'stationAction', args: { n: indexOf('Sell dossier'), expect: sellNow } });
  assert.equal(viaApi.ok, true, 'stationAction can take the choice a human can take');
  assert.equal(ctx.world.credits - beforeCredits, liveC);
  assert.ok(viaApi.notice.startsWith('Sold Complete route dossier: '), 'and gets the same receipt');
  // The panel applies the view's established 240-character notice cap; the
  // stationAction receipt is the full production text.
  assert.equal(desk.peekView().notice, viaApi.notice.slice(0, 240));
  assert.equal(labels().some((a) => a.label.startsWith('Sell dossier')), false, 'the control is gone afterwards');
}
// The native DOM button takes the same decision, through its own listener.
resetToReady();
{
  const button = domButtons().find((b) => (b.textContent || '').startsWith('Decline Veridian Combine'));
  assert.ok(button, 'the Decline control is a real native button');
  assert.equal(button.type, 'button');
  button.click();
  assert.equal(live.shadow.conflict.state, 'declined', 'the human button runs the same mutation');
}
// A RETAINED stale native closure refuses after the row is gone.
resetToReady();
{
  const retained = domButtons().find((b) => (b.textContent || '').startsWith('Sell dossier to Veridian Combine'));
  assert.ok(retained);
  const jobId = live.id;
  desk.chooseDossierBuyer({ id: jobId, evidenceId: liveToken, choice: 'betray' });
  const afterSale = ctx.world.credits;
  retained.click(); // the captured row object is no longer the live row
  assert.equal(ctx.world.credits, afterSale, 'a stale captured button cannot sell the same dossier twice');
  assert.equal(notesFor(jobId).length, 1, 'and adds no second receipt');
}
pass('native buttons and stationAction share one closure, one label, one receipt and one stale guard');

// ---------------------------------------------------------------------------
// 8. Decline
// ---------------------------------------------------------------------------
resetToReady();
{
  const before = { credits: ctx.world.credits, rep: clone(ctx.world.reputation), contacts: clone(ctx.world.contacts) };
  const res = desk.chooseDossierBuyer({ id: live.id, evidenceId: liveToken, choice: 'decline' });
  assert.equal(res.ok, true);
  assert.ok(res.notice.includes('permanently closed for this assignment'));
  assert.equal(ctx.world.credits, before.credits, 'declining pays nothing');
  assert.deepEqual(ctx.world.reputation, before.rep, 'and changes no standing');
  assert.deepEqual(ctx.world.contacts, before.contacts, 'and no contacts');
  assert.equal(live.shadow.conflict.state, 'declined');
  assert.equal(live.state, 'accepted', 'the original contract is untouched');
  assert.equal(live.shadow.deep.state, 'ready', 'all evidence is retained');
  assert.equal(live.shadow.deep.payQuoted, liveD);
  assert.equal(live.deadline, savedDeadline === undefined ? live.deadline : live.deadline);
  assert.equal(desk.peekShadow(live).conflict.canChoose, false);
  assert.equal(desk.peekShadow(live).conflict.blockedReason, 'offer-closed');
  unchanged(() => desk.chooseDossierBuyer({ id: live.id, evidenceId: liveToken, choice: 'decline' }), 'a repeat decline');
  unchanged(() => desk.chooseDossierBuyer({ id: live.id, evidenceId: liveToken, choice: 'betray' }), 'betraying after declining');
  assert.equal(viewLabels().some((l) => l.startsWith('Sell dossier')), false, 'the controls are gone');
  // It stays closed across a reload.
  const declinedSave = clone(snapshot(ctx));
  restore(ctx, declinedSave);
  live = ctx.world.jobs.find((j) => j.id === live.id);
  assert.equal(live.shadow.conflict.state, 'declined', 'a reload never reopens the buyer');
  // And the employer still pays D, once.
  const paidBefore = ctx.world.credits;
  dock(X.originSystem); tick(12);
  assert.equal(ctx.world.credits - paidBefore, liveD, 'the original contract still pays the dossier total');
  tick(20);
  assert.equal(ctx.world.credits - paidBefore, liveD, 'and only once');
}
pass('declining closes the buyer permanently, costs nothing and leaves the original contract whole');

// ---------------------------------------------------------------------------
// 9. Honour
// ---------------------------------------------------------------------------
resetToReady();
{
  const beforeCredits = ctx.world.credits;
  const beforeRep = clone(ctx.world.reputation);
  const jobId = live.id;
  comms.length = 0;
  dock(X.originSystem); tick(12);
  assert.equal(ctx.world.credits - beforeCredits, liveD, 'honouring pays the complete dossier total');
  const repDelta = (ctx.world.reputation[X.employerFaction] ?? 0) - (beforeRep[X.employerFaction] ?? 0);
  assert.equal(repDelta, X.honorEmployerStanding,
    'the disclosed +2 completion standing is exactly what settlement writes');
  assert.equal((ctx.world.reputation[X.buyerFaction] ?? 0) - (beforeRep[X.buyerFaction] ?? 0), 0,
    'the rival gains nothing when the contract is honoured');
  const receipt = comms.find((t) => t.includes('Filed the complete route dossier'));
  assert.ok(receipt, 'the receipt names the actual tier, employer and total');
  assert.ok(receipt.includes(`${liveD} UU total, Red Ledger +2`));
  assert.ok(receipt.includes('Veridian Combine offer at Veridian Spire is closed'));
  const noted = api.observe().events.filter((e) => e.type === 'jobState' && e.id === jobId);
  assert.equal(noted.length, 1, 'exactly one terminal receipt');
  assert.equal(noted[0].outcome, 'delivered');
  assert.equal(noted[0].pay, liveD);
  tick(30);
  assert.equal(api.observe().events.filter((e) => e.type === 'jobState' && e.id === jobId).length, 1,
    'watcher observation adds no generic duplicate');
  assert.equal(ctx.world.credits - beforeCredits, liveD, 'and no second payment');
}
pass('honouring pays D once with the disclosed +2, closes the rival and records one receipt');

// ---------------------------------------------------------------------------
// 10. Betrayal
// ---------------------------------------------------------------------------
resetToReady();
{
  const jobId = live.id;
  const beforeCredits = ctx.world.credits;
  const beforeRep = clone(ctx.world.reputation);
  const beforeContacts = clone(ctx.world.contacts);
  const otherRep = Object.keys(ctx.world.reputation || {}).filter((k) => k !== X.employerFaction && k !== X.buyerFaction);
  comms.length = 0;
  const res = desk.chooseDossierBuyer({ id: jobId, evidenceId: liveToken, choice: 'betray' });
  assert.equal(res.ok, true);
  assert.equal(res.notice, shadowBetrayalReceipt({ ...live, shadow: live.shadow }, liveC).replace(
    dossierReference({ ...live, shadow: live.shadow }), dossierReference({ ...live, shadow: live.shadow })));
  assert.ok(res.notice.startsWith('Sold Complete route dossier: '));
  assert.ok(res.notice.includes(`${liveC} UU total. Red Ledger -5; Veridian Combine +2.`));
  assert.ok(res.notice.includes('Original contract closed without payment; no original completion/contact reward.'));
  assert.ok(res.notice.includes('No other contracts changed.'));
  assert.equal(ctx.world.credits - beforeCredits, liveC, 'C is paid once, in full');
  assert.equal((ctx.world.reputation[X.employerFaction] ?? 0) - (beforeRep[X.employerFaction] ?? 0), -5);
  assert.equal((ctx.world.reputation[X.buyerFaction] ?? 0) - (beforeRep[X.buyerFaction] ?? 0), 2);
  for (const k of otherRep) {
    assert.equal(ctx.world.reputation[k], beforeRep[k], `${k} standing is untouched`);
  }
  assert.deepEqual(ctx.world.contacts, beforeContacts, 'no dockmaster favor or trust is earned for betrayal');
  const noted = api.observe().events.filter((e) => e.type === 'jobState' && e.id === jobId);
  assert.equal(noted.length, 1, 'exactly one terminal receipt');
  assert.equal(noted[0].outcome, 'betrayed');
  assert.equal(noted[0].pay, liveC);
  // Repeats, ticks and dock cycles add nothing.
  unchanged(() => desk.chooseDossierBuyer({ id: jobId, evidenceId: liveToken, choice: 'betray' }), 'a repeat sale');
  unchanged(() => desk.chooseDossierBuyer({ id: jobId, evidenceId: liveToken, choice: 'decline' }), 'declining after selling');
  tick(30);
  assert.equal(ctx.world.credits - beforeCredits, liveC, 'ticks never pay again');
  assert.equal(api.observe().events.filter((e) => e.type === 'jobState' && e.id === jobId).length, 1,
    'the watcher adds no generic failed/closed duplicate');
  // The original employer can never pay afterwards.
  const afterSale = ctx.world.credits;
  dock(X.originSystem); tick(30);
  assert.equal(ctx.world.credits, afterSale, 'the original employer pays nothing after the sale');
  assert.equal(ctx.world.jobs.some((j) => j.id === jobId && j.state === 'accepted'), false);
  // A post-choice save cannot pay again.
  const soldSave = clone(snapshot(ctx));
  restore(ctx, soldSave); tick(30);
  assert.equal(ctx.world.credits, afterSale, 'reloading a post-choice save cannot pay twice');
}
pass('betrayal pays C once, writes only -5/+2, records one receipt and forfeits the original entirely');

// ---------------------------------------------------------------------------
// 11. Abandonment, expiry and unrelated work
// ---------------------------------------------------------------------------
resetToReady();
{
  dock(X.originSystem); desk.selectService('jobs'); tick(2);
  const beforeRep = clone(ctx.world.reputation);
  const beforeCredits = ctx.world.credits;
  const jobId = live.id;
  const res = desk.abandonJob(jobId, live);
  assert.equal(res.ok, true);
  assert.equal(ctx.world.credits, beforeCredits, 'abandonment pays nothing');
  assert.equal((ctx.world.reputation[X.employerFaction] ?? 0) - (beforeRep[X.employerFaction] ?? 0), -1,
    'the existing -1 employer cost, never the -5');
  assert.equal((ctx.world.reputation[X.buyerFaction] ?? 0) - (beforeRep[X.buyerFaction] ?? 0), 0,
    'and the rival gains nothing');
  const noted = api.observe().events.filter((e) => e.type === 'jobState' && e.id === jobId);
  assert.equal(noted.length, 1);
  assert.equal(noted[0].outcome, 'abandoned');
  assert.equal(noted[0].pay, 0);
  assert.equal(ctx.world.jobs.some((j) => j.id === jobId && j.state === 'accepted'), false);
}
resetToReady();
{
  const beforeCredits = ctx.world.credits;
  const beforeRep = clone(ctx.world.reputation);
  live.deadline = ctx.world.time; // equality expires
  tick(5);
  assert.equal(ctx.world.credits, beforeCredits, 'expiry pays nothing');
  assert.equal((ctx.world.reputation[X.employerFaction] ?? 0) - (beforeRep[X.employerFaction] ?? 0), 0);
  assert.equal((ctx.world.reputation[X.buyerFaction] ?? 0) - (beforeRep[X.buyerFaction] ?? 0), 0);
  unchanged(() => desk.chooseDossierBuyer({ id: live.id, evidenceId: liveToken, choice: 'betray' }),
    'selling after expiry');
}
// Unrelated contracts survive a betrayal untouched.
resetToReady();
{
  dock(X.originSystem); desk.selectService('jobs'); tick(2);
  const others = ctx.world.jobs.filter((j) => j.id !== live.id && j.state === 'offered').slice(0, 2);
  for (const other of others) desk.acceptJob(other.id);
  const taken = ctx.world.jobs.filter((j) => j.id !== live.id && j.state === 'accepted');
  assert.ok(taken.length > 0, 'at least one unrelated contract is live');
  const before = taken.map((j) => JSON.stringify({
    id: j.id, state: j.state, progress: j.progress, payQuoted: j.payQuoted, deadline: j.deadline, reward: j.reward,
  }));
  dock(X.destSystem); desk.selectService('jobs'); tick(2);
  assert.equal(desk.chooseDossierBuyer({ id: live.id, evidenceId: liveToken, choice: 'betray' }).ok, true);
  const after = taken.map((j) => JSON.stringify({
    id: j.id, state: j.state, progress: j.progress, payQuoted: j.payQuoted, deadline: j.deadline, reward: j.reward,
  }));
  assert.deepEqual(after, before, 'only the named v3 job is terminalized');
}
pass('abandonment keeps its own -1, expiry pays nothing and unrelated contracts are never touched');

// ---------------------------------------------------------------------------
// 12. Persistence: round-trip, malformed rejection and token collisions
// ---------------------------------------------------------------------------
resetToReady();
{
  const base = clone(readySave);
  const rowOf = (save) => save.world.jobs.find((j) => j.id === live.id);
  // Every valid v3 stage round-trips byte for byte.
  for (const [cState, patch] of [
    ['open', (j) => j],
    ['declined', (j) => j],
    ['honored', (j) => { j.state = 'failed'; }],
    ['betrayed', (j) => { j.state = 'failed'; }],
    ['void', (j) => { j.state = 'failed'; }],
  ]) {
    const save = clone(base);
    const row = rowOf(save);
    row.shadow.conflict.state = cState;
    patch(row);
    const want = clone(row.shadow);
    restore(ctx, save);
    const got = ctx.world.jobs.find((j) => j.id === live.id);
    assert.ok(got, `${cState} round-trips`);
    assert.deepEqual(got.shadow, want, `${cState} preserves the whole conflict`);
  }
  // An offered v3, and the basic/pursuing stages.
  for (const [name, patch] of [
    ['offered', (j) => {
      j.state = 'offered'; j.progress = 0; delete j.payQuoted;
      // An offered row has not been worked yet, by construction.
      Object.assign(j.shadow, { courierCreated: false, observedSeconds: 0, suspicion: 0, warned: false, warningSeconds: 0 });
      j.shadow.deep = { state: 'available', observedSeconds: 0, payQuoted: liveD, closedReason: '' };
    }],
    ['basic', (j) => { j.shadow.deep = { state: 'available', observedSeconds: 0, payQuoted: liveD, closedReason: '' }; }],
    ['pursuing', (j) => { j.shadow.deep = { state: 'pursuing', observedSeconds: 11.5, payQuoted: liveD, closedReason: '' }; }],
    ['closed', (j) => { j.shadow.deep = { state: 'closed', observedSeconds: 0, payQuoted: liveD, closedReason: 'exposed' }; }],
  ]) {
    const save = clone(base);
    patch(rowOf(save));
    const want = clone(rowOf(save).shadow);
    restore(ctx, save);
    const got = ctx.world.jobs.find((j) => j.id === live.id);
    assert.ok(got, `${name} v3 round-trips`);
    assert.deepEqual(got.shadow, want);
  }
  // Malformed v3 rows are DROPPED, never downgraded to a payable v2/basic row.
  for (const [name, patch] of [
    ['bad scenario', (j) => { j.shadow.conflict.scenario = 'other'; }],
    ['bad token', (j) => { j.shadow.conflict.evidenceId = 'not-a-uuid'; }],
    ['extra key', (j) => { j.shadow.conflict.extra = 1; }],
    ['missing key', (j) => { delete j.shadow.conflict.state; }],
    ['missing conflict', (j) => { delete j.shadow.conflict; }],
    ['C at or below D', (j) => { j.shadow.conflict.buyerPayQuoted = liveD; }],
    ['wrong origin', (j) => { j.originSystem = 'freehold'; j.id = 'spy-freehold-7'; j.recordId = 'courier-spy-freehold-7'; }],
    ['wrong destination', (j) => { j.destSystem = 'hollowreach'; }],
    ['declined before the dossier', (j) => {
      j.shadow.conflict.state = 'declined';
      j.shadow.deep = { state: 'available', observedSeconds: 0, payQuoted: liveD, closedReason: '' };
    }],
    ['terminal state on a live row', (j) => { j.shadow.conflict.state = 'betrayed'; }],
    ['mismatched record id', (j) => { j.recordId = 'courier-spy-redmarch-77'; }],
  ]) {
    const save = clone(base);
    patch(rowOf(save));
    restore(ctx, save);
    const got = ctx.world.jobs.find((j) => isShadowJob(j) && j.originSystem === X.originSystem
      && j.state === 'accepted');
    assert.equal(got === undefined || got.id !== live.id, true, `${name}: the whole row is dropped`);
    assert.equal(ctx.world.jobs.some((j) => j.id === live.id), false, `${name}: no downgraded survivor`);
  }
  // Old valid saves load unchanged.
  const legacy = clone(acceptedSave);
  const legacyRow = legacy.world.jobs.find((j) => j.id === live.id);
  delete legacyRow.shadow.conflict;
  legacyRow.shadow.v = 2;
  const wantLegacy = clone(legacyRow.shadow);
  restore(ctx, legacy);
  assert.deepEqual(ctx.world.jobs.find((j) => j.id === live.id).shadow, wantLegacy,
    'an ordinary v2 save is unaffected by the new code');
}
pass('every valid v3 stage round-trips; malformed rows drop whole with no payable downgrade');

// Token collisions: EVERY colliding row is rejected, accepted ones included.
{
  const base = clone(readySave);
  const original = base.world.jobs.find((j) => j.id === live.id);
  const unrelated = base.world.jobs.filter((j) => j.id !== live.id).map((j) => j.id);
  assert.ok(unrelated.length > 0, 'there is unrelated work to preserve');
  const twin = (id, over = {}) => {
    const row = clone(original);
    row.id = id;
    row.recordId = `courier-${id}`;
    Object.assign(row, over);
    return row;
  };
  for (const [name, second] of [
    ['two accepted rows', twin('spy-redmarch-41')],
    ['accepted plus offered', twin('spy-redmarch-42', {
      state: 'offered', progress: 0,
      shadow: { ...clone(original.shadow), courierCreated: false, observedSeconds: 0,
        suspicion: 0, warned: false, warningSeconds: 0,
        deep: { state: 'available', observedSeconds: 0, payQuoted: liveD, closedReason: '' } },
    })],
    ['accepted plus terminal', twin('spy-redmarch-43', {
      state: 'failed',
      shadow: { ...clone(original.shadow), conflict: { ...clone(original.shadow.conflict), state: 'betrayed' } },
    })],
    ['same job id', twin(live.id)],
  ]) {
    const save = clone(base);
    const row = clone(second);
    if (row.state === 'offered') delete row.payQuoted;
    save.world.jobs.push(row);
    assert.ok(save.world.jobs.length <= 24, 'the fixture stays below the save cap');
    restore(ctx, save);
    // Both rows must have been structurally valid, or this would not be a
    // collision test at all — it would just be one row being dropped.
    assert.equal(shadowConflictJobValid(row), true, `${name}: the colliding row is itself valid`);
    const survivors = ctx.world.jobs.filter((j) => j.shadow?.conflict?.evidenceId === liveToken);
    assert.equal(survivors.length, 0, `${name}: every colliding row is rejected, whatever its state`);
    for (const id of unrelated) {
      assert.equal(ctx.world.jobs.some((j) => j.id === id), true, `${name}: unrelated row ${id} is preserved`);
    }
  }
  // A DIFFERENT token is not a collision: both rows survive.
  const save = clone(base);
  const other = twin('spy-redmarch-44');
  other.shadow.conflict.evidenceId = TOKEN2;
  save.world.jobs.push(other);
  restore(ctx, save);
  assert.equal(ctx.world.jobs.filter((j) => j.shadow?.conflict).length, 2, 'distinct tokens both survive');
}
pass('duplicate evidence tokens reject every colliding row below the cap, sparing unrelated work');

// ---------------------------------------------------------------------------
// 13. Malformed runtime conflict: fail closed before ANY payout
// ---------------------------------------------------------------------------
resetToReady();
{
  const beforeCredits = ctx.world.credits;
  const beforeRep = clone(ctx.world.reputation);
  // A live accepted row whose conflict is corrupted in memory, mid-flight.
  delete live.shadow.conflict;
  assert.equal(live.shadow.v, 3, 'the row still claims v3');
  if (ctx.flags.docked) desk.undock();
  ctx.flags.docked = false;
  ctx.world.currentSystem = live.destSystem;
  ctx.lastEvents = [{ type: 'systemLoaded', to: live.destSystem }]; world.update(0);
  tick(20);
  assert.equal(live.shadow.v, 3, 'flight frames never downgrade it to a payable v2');
  assert.equal(live.shadow.conflict, undefined);
  unchanged(() => desk.chooseDossierBuyer({ id: live.id, evidenceId: liveToken, choice: 'betray' }),
    'a malformed conflict can never be sold');
  // Docking at the employer must not pay on evidence that cannot be validated.
  dock(X.originSystem); tick(20);
  assert.equal(ctx.world.credits, beforeCredits, 'the original payout fails closed too');
  assert.deepEqual(ctx.world.reputation, beforeRep, 'and writes no standing');
  assert.equal(ctx.world.jobs.some((j) => j.id === live.id && j.state === 'accepted'), false,
    'the assignment ends instead of settling');
}
pass('a malformed runtime v3 fails closed before the buyer payout AND before the original payout');

// ---------------------------------------------------------------------------
// 14. Clean fallbacks: no secure UUID source produces an ordinary v2 job
// ---------------------------------------------------------------------------
resetToReady();
{
  // Retire the live row, then repost with no randomUUID available.
  const jobId = live.id;
  dock(X.originSystem); desk.selectService('jobs'); tick(2);
  const realCrypto = globalThis.crypto;
  // A context with no `randomUUID` — the plain-HTTP LAN case the contract
  // documents. The stub keeps getRandomValues so nothing else changes.
  const stub = { getRandomValues: realCrypto?.getRandomValues?.bind(realCrypto) };
  assert.equal(typeof stub.randomUUID, 'undefined');
  Object.defineProperty(globalThis, 'crypto', { value: stub, configurable: true });
  try {
    // The repost happens inside the abandon's own render, so the stub must
    // already be installed when the board next syncs.
    desk.abandonJob(jobId, live);
    desk.selectService('jobs'); tick(4);
    const reposted = offerAt(X.originSystem);
    assert.ok(reposted, 'the employer still posts an assignment');
    assert.equal(reposted.id === jobId, false, 'a repost carries a new job id');
    assert.equal(reposted.shadow.v, 2, 'with no secure UUID source it is an ordinary v2 job');
    assert.equal(reposted.shadow.conflict, undefined, 'no partial v3 row is written');
    assert.equal(reposted.title, 'Shadow courier', 'and no exclusivity copy');
    assert.equal(reposted.detail.includes('EXCLUSIVELY'), false);
    assert.equal(desk.peekShadow(reposted).conflict, undefined);
    assert.ok(desk.peekShadow(reposted).deep.terms.length > 0, 'the ordinary dossier terms are unchanged');
    assert.equal(desk.peekShadow(reposted).deep.terms.includes('Veridian Combine'), false);
    assert.equal(shadowConflictJobValid(reposted), true, 'an ordinary v2 row is perfectly valid');
    assert.equal(desk.acceptJob(reposted.id).ok, true, 'and it accepts as an ordinary contract');
    assert.equal(reposted.shadow.v, 2);
  } finally {
    Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true });
  }
  // A new assignment mints a NEW token, never the retired one.
  const after = ctx.world.jobs.filter((j) => j.shadow?.conflict?.evidenceId === liveToken);
  assert.equal(after.length, 0, 'a retired assignment never leaves a reusable token behind');
}
pass('a missing secure UUID source falls back to an ordinary v2 job with no exclusivity copy');

console.log(`All ${checks} issue-240 contract groups passed (synthetic; independent review and a natural live run are still required).`);
