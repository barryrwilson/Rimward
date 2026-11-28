/**
 * Issue #374 — feedRock refusal copy and Feed & Tend desk copy explain what
 * each button consumes, surface the live livingRock hold count, distinguish
 * unworked rawOre in the hold from an empty hold, and point to where Living
 * rock is acquired (Market or a Living rock asteroid in the belt).
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS } from '../src/game/state.js';
import { addCargo, holdUnits } from '../src/systems/station.js';
import { tickPrices, applyEventPressure } from '../src/game/market.js';
import { initAgentApi } from '../src/systems/agent-api.js';

seedBootRandom(374);
const dom = installDomStubs();
window.location.search = '?agent=1';
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];

for (const n of dom.walkDom(document.body)) {
  if (n.dataset?.titleAction === 'new') {
    n.click();
    break;
  }
}
dom.dispatchKey('Digit1');
ctx.agent.optIn = true;
initAgentApi(ctx);
const api = window.rimward;
const observe = () => api.observe();
const act = (name, args = {}) => api.act({ v: 2, name, args });

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));

let checks = 0;
const check = (label, fn) => {
  fn();
  checks++;
  console.log('PASS', label);
};

function dockAt(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.combat = false;
  const from = ctx.world.currentSystem;
  ctx.world.currentSystem = id;
  applyEventPressure(ctx, 'clear', id);
  if (from !== id) {
    ctx.lastEvents = [{ type: 'systemLoaded', from, to: id }];
    tickPrices(ctx, 0);
    station.update(1 / 60);
    ctx.lastEvents = [];
  }
  const p = SYSTEMS[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  for (let i = 0; i < 3; i++) {
    station.update(1 / 60);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, `docked at ${id}`);
}

function resetHold({ credits = 5000, hunger = 0.5, wounds = 0.25, bond = 0.3 } = {}) {
  ctx.world.credits = credits;
  ctx.world.marketSupply = {};
  ctx.cargoCapacity = 40;
  ctx.cargo.length = 0;
  ctx.bio.hunger = hunger;
  ctx.bio.wounds = wounds;
  ctx.bio.bond = bond;
  applyEventPressure(ctx, 'clear', ctx.world.currentSystem);
}

// ---- 1. Exact #333 playtest scenario: 20 rawOre and 0 livingRock in the hold -
check('#333 scenario (20 rawOre, 0 livingRock): Feed desk & feedRock explain Raw ore vs Living rock and acquisition path', () => {
  dockAt('veridian');
  resetHold();
  addCargo(ctx, 'rawOre', 20);
  ctx.stationDesk.selectService('feed');

  const supplyNotes = byClass('feed-supply-note');
  assert.equal(supplyNotes.length, 1, 'renders one .feed-supply-note on the Feed desk');
  const noteText = supplyNotes[0].textContent;
  assert.ok(
    noteText.startsWith('Living rock in hold: 0 (20 Raw ore aboard — Raw ore cannot feed her).'),
    `supply note names 20 Raw ore aboard: ${noteText}`
  );
  assert.ok(noteText.includes('Biomass costs 60 UU'), 'supply note lists biomass cost');
  assert.ok(noteText.includes('Living rock consumes 1 Living rock from the hold'), 'supply note lists living rock consumption');
  assert.ok(noteText.includes('buy at the Market or mine a Living rock bloom rock in the belt'), 'supply note names Market and belt acquisition');
  assert.ok(noteText.includes('Tend wounds costs 25 UU'), 'supply note lists tend wounds cost');

  const obs = observe();
  assert.equal(obs.station?.view?.service, 'feed');
  const rockAction = obs.station.view.actions.find((a) => a.label.startsWith('2 — Feed living rock'));
  assert.ok(rockAction, 'action 2 exists in station.view.actions');
  assert.equal(rockAction.label, '2 — Feed living rock (1 from hold · 0 aboard)');
  assert.equal(rockAction.commodity, 'livingRock');
  assert.equal(rockAction.hold, 0);

  const rockRows = obs.station.view.rows.filter((r) => r.commodity === 'livingRock');
  assert.ok(rockRows.length >= 2, 'station.view.rows carries commodity: livingRock on supply note and button 2');
  for (const r of rockRows) {
    assert.equal(r.hold, 0);
    assert.equal(r.units, 0);
  }

  const beforeCredits = ctx.world.credits;
  const beforeHunger = ctx.bio.hunger;
  const beforeBond = ctx.bio.bond;

  const res = act('feed', { kind: 'rock' });
  assert.equal(res.ok, false, 'feed rock refuses when livingRock is 0');
  assert.equal(res.token, 'hold', 'refusal token remains hold');
  assert.equal(
    res.error,
    'No living rock in the hold (20 Raw ore aboard — she will not take unworked ore). Buy Living rock at the Market or mine a Living rock asteroid in the belt, or use 1 — Feed biomass (60 UU).'
  );

  // stationAction clicking button 2 produces the same refusal token and notice
  const clickRes = act('stationAction', { n: rockAction.n });
  assert.equal(clickRes.ok, false, 'stationAction button 2 also refuses');
  assert.equal(clickRes.token, 'hold', 'stationAction refusal token remains hold');
  assert.equal(clickRes.error, res.error);

  assert.equal(holdUnits(ctx, 'rawOre'), 20, '20 rawOre untouched in hold');
  assert.equal(ctx.world.credits, beforeCredits, 'credits unchanged');
  assert.equal(ctx.bio.hunger, beforeHunger, 'hunger unchanged');
  assert.equal(ctx.bio.bond, beforeBond, 'bond unchanged');
});

// ---- 2. Empty hold scenario (0 rawOre, 0 livingRock) ------------------------
check('Empty hold (0 rawOre, 0 livingRock): Feed desk & feedRock point to Market/belt without claiming Raw ore is aboard', () => {
  dockAt('freehold');
  resetHold();
  ctx.stationDesk.selectService('feed');

  const supplyNotes = byClass('feed-supply-note');
  assert.equal(supplyNotes.length, 1);
  assert.ok(
    supplyNotes[0].textContent.startsWith('Living rock in hold: 0. Biomass costs 60 UU'),
    'empty hold supply note shows Living rock in hold: 0. without Raw ore parenthetical'
  );
  assert.ok(!supplyNotes[0].textContent.includes('Raw ore aboard'));

  const res = act('feed', { kind: 'rock' });
  assert.equal(res.ok, false);
  assert.equal(res.token, 'hold');
  assert.equal(
    res.error,
    'No living rock in the hold. Buy Living rock at the Market or mine a Living rock asteroid in the belt, or use 1 — Feed biomass (60 UU).'
  );
});

// ---- 3. Acquisition at Market & positive feedRock path ----------------------
check('Buying 1 livingRock at Market updates Feed desk hold count to 1 and feedRock consumes 1 livingRock (leaving rawOre untouched)', () => {
  dockAt('veridian');
  resetHold({ hunger: 0.65, bond: 0.4 });
  addCargo(ctx, 'rawOre', 20);

  ctx.stationDesk.selectService('market');
  const buyRes = act('trade', { commodity: 'livingRock', qty: 1, side: 'buy' });
  assert.equal(buyRes.ok, true, 'buying 1 livingRock at Market succeeds');
  assert.equal(holdUnits(ctx, 'livingRock'), 1);

  ctx.stationDesk.selectService('feed');
  const supplyNotes = byClass('feed-supply-note');
  assert.equal(supplyNotes.length, 1);
  assert.ok(
    supplyNotes[0].textContent.startsWith('Living rock in hold: 1. Biomass costs 60 UU'),
    'supply note updates to Living rock in hold: 1.'
  );

  const obs = observe();
  const rockAction = obs.station.view.actions.find((a) => a.label.startsWith('2 — Feed living rock'));
  assert.equal(rockAction.label, '2 — Feed living rock (1 from hold · 1 aboard)');
  assert.equal(rockAction.commodity, 'livingRock');
  assert.equal(rockAction.hold, 1);

  const rockRows = obs.station.view.rows.filter((r) => r.commodity === 'livingRock');
  assert.ok(rockRows.length >= 2);
  for (const r of rockRows) {
    assert.equal(r.hold, 1);
    assert.equal(r.units, 1);
  }

  const feedRes = act('feed', { kind: 'rock' });
  assert.equal(feedRes.ok, true, 'feed rock succeeds with 1 livingRock aboard');
  assert.equal(holdUnits(ctx, 'livingRock'), 0, 'consumes 1 livingRock');
  assert.equal(holdUnits(ctx, 'rawOre'), 20, 'leaves 20 rawOre untouched');
  assert.equal(ctx.bio.hunger, 0, 'zeroes hunger');
  assert.ok(Math.abs(ctx.bio.bond - 0.6) < 1e-9, 'increases bond by +0.2');

  const afterObs = observe();
  assert.equal(
    afterObs.station.view.notice,
    'She takes the living rock gently. The song through the hull runs warm for hours.',
    'sets the warm hull-song notice on the station desk'
  );
  const afterAction = afterObs.station.view.actions.find((a) => a.label.startsWith('2 — Feed living rock'));
  assert.equal(afterAction.label, '2 — Feed living rock (1 from hold · 0 aboard)');
  assert.equal(afterAction.hold, 0);
});

console.log(`PASS issue-374-feed-rock-clarity-test (${checks} checks)`);
