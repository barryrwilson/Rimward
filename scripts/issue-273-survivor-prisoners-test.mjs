/**
 * Issue #273 — hunt survivors get a contract-linked outlet at the employer dock.
 *
 * A hunt kill drops the quarry's crew as a survivor pod. Wave 60 returns those
 * people only at their own faction's People desk; the Gilded Chain buys them at
 * a fence. Neither outlet sits on a hunter's route. This test pins the employer
 * dock's prisoner desk: the contract tie is the quarry's own dead or captured
 * pirate record in the origin system's record bank, only player-killed crew is
 * taken, the handover pays a small fee and employer standing, and no persisted
 * field, key or save-schema change is introduced.
 *
 * Run: npm run test:survivor-prisoners
 */
import assert from 'node:assert/strict';
import { FACTIONS } from '../src/game/state.js';
import {
  PRISONER_HANDOVER,
  prisonerFactions,
  prisonerUnits,
  applyPrisonerHandover,
} from '../src/game/prisoners.js';

const ORIGIN = 'freehold';
const DOCK = 'freehold';
const SURVIVOR = 'survivor';

assert.equal(FACTIONS[DOCK]?.name, 'Freehold Compact', 'the employer dock is a real faction');
assert.ok(Object.isFrozen(PRISONER_HANDOVER), 'tuning is frozen');
assert.ok(PRISONER_HANDOVER.uuPerHead > 0 && Number.isFinite(PRISONER_HANDOVER.uuPerHead), 'fee is positive');
assert.ok(PRISONER_HANDOVER.repPerHead > 0 && Number.isFinite(PRISONER_HANDOVER.repPerHead), 'standing is positive');

function makeBank() {
  return [
    // A local quarry this dock posted against, broken by the player.
    { id: 'rec-1', name: 'Red Marlow', role: 'pirate', system: ORIGIN, faction: 'redledger', state: 'dead' },
    // Still flying: its crew is not a prisoner yet.
    { id: 'rec-2', name: 'Copper Vane', role: 'pirate', system: ORIGIN, faction: 'independent', state: 'alive' },
    // Captured also settles a hunt (station.js huntPayComplete reads both).
    { id: 'rec-3', name: 'Sable Ilex', role: 'pirate', system: ORIGIN, faction: 'independent', state: 'captured' },
    // The ace family is not a hunt quarry.
    { id: 'rec-4', name: 'Carver Illyx', role: 'ace', system: ORIGIN, faction: 'veridian', state: 'dead' },
    // No conventional crew.
    { id: 'rec-5', name: 'Between Stars', role: 'pirate', system: ORIGIN, faction: 'unknowables', state: 'dead' },
    // A dead quarry from another system must not leak into this dock's list.
    { id: 'rec-6', name: 'Elsewhere', role: 'pirate', system: 'veridian', faction: 'gilded', state: 'dead' },
  ];
}

function survivor(faction, source, units, name) {
  const row = { commodity: SURVIVOR, units, faction, source };
  if (name) row.name = name;
  return row;
}

function makeCtx(overrides = {}) {
  const ctx = {
    cargo: [],
    cargoCapacity: 10,
    events: [],
    emit(name, payload) { ctx.events.push({ name, payload }); },
    world: {
      currentSystem: ORIGIN,
      credits: 1000,
      reputation: { freehold: 3 },
      recordBanks: { [ORIGIN]: makeBank() },
    },
  };
  return Object.assign(ctx, overrides);
}

// 1. Only a dead or captured local pirate of a real, conventional faction
//    names its crew as prisoners. Alive, ace-only, unknowable and foreign
//    records do not.
{
  const ctx = makeCtx();
  const factions = prisonerFactions(ctx, ORIGIN);
  assert.deepEqual([...factions].sort(), ['independent', 'redledger']);
  assert.ok(!factions.has('veridian'), 'ace-only faction is excluded');
  assert.ok(!factions.has('unknowables'), 'unknowables are excluded');
  assert.ok(!factions.has('gilded'), 'another system\'s dead quarry is excluded');
  assert.equal(prisonerUnits(ctx, ORIGIN), 0, 'empty hold offers nothing');
}

// 2. Player-killed crew of an eligible faction counts; rescued crew, other
//    factions and a corrupt over-cap row do not.
{
  const ctx = makeCtx();
  ctx.cargo = [
    survivor('redledger', 'playerKill', 1, 'Red Marlow'),
    survivor('redledger', 'playerKill', 2), // merged pods keep the wave-60 row shape
    survivor('redledger', 'other', 3),
    survivor('independent', 'playerKill', 1),
    survivor('gilded', 'playerKill', 4),
    survivor('freehold', 'other', 1),
    survivor('redledger', 'playerKill', 99), // over the 10-unit hold cap
    { commodity: 'rawOre', units: 2 },
    { commodity: SURVIVOR, units: 5, faction: 'redledger' }, // missing source = 'other'
  ];
  assert.equal(prisonerUnits(ctx, ORIGIN), 4);
}

// 3. One handover action: eligible rows leave, the fee and standing land, one
//    spoken receipt is emitted, and every other hold row is untouched.
{
  const ctx = makeCtx();
  ctx.cargo = [
    survivor('redledger', 'playerKill', 1, 'Red Marlow'),
    survivor('redledger', 'playerKill', 2),
    survivor('redledger', 'other', 3),
    survivor('independent', 'playerKill', 1),
    survivor('gilded', 'playerKill', 4),
    { commodity: 'rawOre', units: 2 },
    survivor('redledger', 'playerKill', 99),
  ];
  const keptBefore = JSON.parse(JSON.stringify(ctx.cargo.filter((row) => !(row.commodity === SURVIVOR && row.source === 'playerKill' && ['redledger', 'independent'].includes(row.faction) && row.units !== 99))));
  const before = JSON.parse(JSON.stringify(ctx.cargo));
  const result = applyPrisonerHandover(ctx, ORIGIN, DOCK);
  assert.ok(result, 'handover returns a receipt');
  assert.equal(result.faction, DOCK);
  assert.equal(result.count, 4);
  assert.equal(result.credits, 4 * PRISONER_HANDOVER.uuPerHead);
  assert.equal(result.repDelta, 4 * PRISONER_HANDOVER.repPerHead);
  assert.equal(ctx.world.credits, 1000 + result.credits);
  assert.equal(ctx.world.reputation.freehold, 3 + result.repDelta);
  assert.equal(ctx.events.length, 1, 'one receipt');
  assert.equal(ctx.events[0].name, 'commLine');
  assert.match(ctx.events[0].payload.text, /4 prisoners handed over/);
  assert.match(ctx.events[0].payload.text, new RegExp(result.credits + ' UU'));
  assert.match(ctx.events[0].payload.text, /Freehold Compact/);
  assert.match(ctx.events[0].payload.text, new RegExp('standing \\+' + result.repDelta));
  assert.deepEqual(ctx.cargo, keptBefore, 'only eligible rows leave; kept rows are byte-identical');
  assert.ok(ctx.cargo.some((row) => row.commodity === 'rawOre'));
  assert.ok(ctx.cargo.some((row) => row.faction === 'gilded'));
  assert.ok(ctx.cargo.some((row) => row.commodity === SURVIVOR && row.units === 99), 'corrupt row stays');
  assert.ok(!ctx.cargo.some((row) => row.commodity === SURVIVOR && row.source === 'playerKill'
    && (row.faction === 'redledger' || row.faction === 'independent') && row.units !== 99));
  // The receipt is JSON-plain and no persisted field was added to cargo rows.
  assert.equal(JSON.stringify(JSON.parse(JSON.stringify(ctx.cargo))), JSON.stringify(ctx.cargo));
  assert.ok(!Object.hasOwn(before[0], 'prisoner'));
}

// 4. A second handover is a no-op: nothing is paid twice.
{
  const ctx = makeCtx();
  ctx.cargo = [survivor('redledger', 'playerKill', 2)];
  assert.ok(applyPrisonerHandover(ctx, ORIGIN, DOCK));
  const credits = ctx.world.credits;
  const rep = ctx.world.reputation.freehold;
  assert.equal(applyPrisonerHandover(ctx, ORIGIN, DOCK), null);
  assert.equal(ctx.world.credits, credits);
  assert.equal(ctx.world.reputation.freehold, rep);
  assert.equal(ctx.events.length, 1);
}

// 5. Fail closed: no bank, no world, no cargo, bad balance, bad origin.
{
  const noBank = makeCtx();
  noBank.world.recordBanks = {};
  assert.equal(prisonerUnits(noBank, ORIGIN), 0);
  assert.equal(applyPrisonerHandover(noBank, ORIGIN, DOCK), null);

  const noWorld = { cargo: [survivor('redledger', 'playerKill', 1)], cargoCapacity: 10 };
  assert.equal(prisonerUnits(noWorld, ORIGIN), 0);
  assert.equal(applyPrisonerHandover(noWorld, ORIGIN, DOCK), null);

  const badCredits = makeCtx();
  badCredits.cargo = [survivor('redledger', 'playerKill', 1)];
  badCredits.world.credits = Infinity;
  assert.equal(applyPrisonerHandover(badCredits, ORIGIN, DOCK), null);
  assert.equal(badCredits.cargo.length, 1, 'a refused handover leaves the hold untouched');

  const badOrigin = makeCtx();
  badOrigin.cargo = [survivor('redledger', 'playerKill', 1)];
  assert.equal(prisonerUnits(badOrigin, 'nope'), 0);
  assert.equal(applyPrisonerHandover(badOrigin, 'nope', DOCK), null);
}

// 6. An invalid dock faction still pays the crew but banks no standing, and
//    the receipt never trusts a prototype key.
{
  const ctx = makeCtx();
  ctx.cargo = [survivor('redledger', 'playerKill', 2)];
  const result = applyPrisonerHandover(ctx, ORIGIN, '__proto__');
  assert.ok(result);
  assert.equal(result.count, 2);
  assert.equal(result.credits, 2 * PRISONER_HANDOVER.uuPerHead);
  assert.equal(result.repDelta, 0);
  assert.equal(ctx.world.reputation.freehold, 3);
  assert.match(result.line, /the dock pays/);
}

// 7. The live current-system records fallback works when no per-system bank has
//    been built yet (station.js huntBank has the same fallback).
{
  const ctx = makeCtx();
  delete ctx.world.recordBanks;
  ctx.world.records = makeBank();
  assert.deepEqual([...prisonerFactions(ctx, ORIGIN)].sort(), ['independent', 'redledger']);
}

// 8. Every kept row and every removed row is JSON-safe: the module never adds a
//    field and never mutates a kept row.
{
  const ctx = makeCtx();
  ctx.cargo = [
    survivor('redledger', 'playerKill', 1, 'Red Marlow'),
    survivor('independent', 'other', 2, 'Sable Ilex'),
  ];
  const kept = JSON.parse(JSON.stringify(ctx.cargo[1]));
  applyPrisonerHandover(ctx, ORIGIN, DOCK);
  assert.deepEqual(ctx.cargo, [kept]);
  assert.equal(Object.keys(ctx.cargo[0]).sort().join(','), 'commodity,faction,name,source,units');
}

console.log('ok #273 survivor prisoners: 8 groups — contract tie, player-kill only, one fee/standing receipt, idempotent, fail-closed, no new persisted field');
