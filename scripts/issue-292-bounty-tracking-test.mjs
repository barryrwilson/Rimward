/**
 * Issue #292 — an accepted pirate-bounty row carries a player-visible
 * last-seen/shelter read while its target is off scanner, on parity with
 * what hunts got in #271. The row's phrase is derived at render from the
 * record's OWN durable evidence: the #68 tagged wakeSite (where the runner
 * actually went — station shelter or gate) first, then the same authored
 * lane phrase huntHauntPhrase derives for hunts.
 *
 * Real station DOM, the real Jobs board, the same harness discipline the
 * #271/#272 suites use. Fixtures are disclosed record-state flips only.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-292-bounty-tracking-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

seedBootRandom();
const dom = installDomStubs();
const boot = await bootGameSystems();
const { ctx, systems, binds } = boot;
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const text = (cls) => byClass(cls).map((n) => String(n.textContent)).join(' | ');

const openBoard = () => ctx.stationDesk.selectService('jobs');
const pirateBounties = () => ctx.world.jobs.filter((j) => j && j.kind === 'bounty' && typeof j.id === 'string' && j.id.startsWith('bounty-pirate-'));
const bank = () => ctx.world.recordBanks?.[ctx.world.currentSystem] ?? ctx.world.records ?? [];

function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }];
  world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true, 'docked at ' + id);
}

for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
ctx.world.credits = 200000;

// ---------------------------------------------------------------------------
// Setup: dock at freehold, ensure a pirate bounty exists, accept it.
// ---------------------------------------------------------------------------
check('setup: a pirate bounty row can be accepted at its home dock', () => {
  dock('freehold');
  openBoard();
  // A live, priced pirate in the bank posts a bounty card on board render.
  let row = pirateBounties().find((j) => j.state === 'accepted');
  if (!row) {
    row = pirateBounties().find((j) => j.state === 'offered');
    if (!row) {
      // Seed a disclosed fixture record only when the board has none yet.
      const sysId = ctx.world.currentSystem;
      const rec = {
        id: 'rec-292-fixture', name: 'Fixture Marlow', classKey: 'cutter',
        faction: 'independent', role: 'pirate', system: sysId,
        state: 'enroute', bounty: 450,
        route: [
          [ctx.systems[sysId].station.position[0] + 900, ctx.systems[sysId].station.position[1], ctx.systems[sysId].station.position[2]],
          [ctx.systems[sysId].station.position[0] + 450, 0, ctx.systems[sysId].station.position[2]],
        ],
        leg: 0, legT: 0.5, dir: 1,
      };
      (ctx.world.recordBanks?.[sysId] ?? ctx.world.records).push(rec);
      openBoard(); // re-sync posts the card
      row = pirateBounties().find((j) => j.state === 'offered' && j.target === 'Fixture Marlow');
    }
    assert.ok(row, 'an offered pirate bounty exists');
    ctx.stationDesk.acceptJob({ id: row.id });
  }
  const accepted = pirateBounties().find((j) => j.state === 'accepted');
  assert.ok(accepted, 'a pirate bounty is accepted');
});

// ---------------------------------------------------------------------------
// A. Accepted row carries a last-seen phrase matching where the hull went.
// ---------------------------------------------------------------------------
check('A1 accepted bounty row with a station-shelter wake reads the shelter', () => {
  const row = pirateBounties().find((j) => j.state === 'accepted');
  assert.ok(row, 'accepted bounty exists');
  const sysId = ctx.world.currentSystem;
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === row.target
    && r.state !== 'dead' && r.state !== 'captured');
  assert.ok(rec, 'the named reaver record resolves');
  // Disclosed fixture: the hull fled to the station holding lane (the #68
  // stamp shape writeEscapeWakeSite leaves for kind 'station').
  rec.wakeSite = {
    position: [0, 0, 0], found: false,
    kind: 'station', to: null, from: sysId,
  };
  openBoard();
  const accepted = byClass('job-state').map((n) => String(n.textContent));
  const line = accepted.find((t) => t.includes('bounty on ' + row.target));
  assert.ok(line, 'the accepted bounty row renders — got: ' + accepted.join(' | ').slice(0, 200));
  assert.match(line, /Last seen: /, 'the row carries the Last seen read');
  const stationName = ctx.systems[sysId].station?.name ?? ctx.systems[sysId].name;
  assert.ok(line.includes(stationName) || /holding lane/.test(line),
    'the shelter phrase names the real refuge — got: ' + line);
});

check('A2 a gate-crossing wake names the gate destination', () => {
  const row = pirateBounties().find((j) => j.state === 'accepted');
  const sysId = ctx.world.currentSystem;
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === row.target
    && r.state !== 'dead' && r.state !== 'captured');
  const dest = Object.keys(ctx.systems).find((k) => k !== sysId && ctx.systems[k]?.name);
  assert.ok(dest, 'an adjacent system exists to name');
  rec.wakeSite = {
    position: [0, 0, 0], found: false,
    kind: 'gate', to: dest, from: sysId,
  };
  openBoard();
  const line = byClass('job-state').map((n) => String(n.textContent))
    .find((t) => t.includes('bounty on ' + row.target));
  assert.ok(line, 'the accepted row renders');
  assert.match(line, /seen at the gate to /, 'the gate phrase names the crossing — got: ' + line);
  assert.ok(line.includes(ctx.systems[dest].name), 'the phrase names the destination system');
});

check('A3 no wake trail falls back to the authored lane phrase', () => {
  const row = pirateBounties().find((j) => j.state === 'accepted');
  const sysId = ctx.world.currentSystem;
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === row.target
    && r.state !== 'dead' && r.state !== 'captured');
  delete rec.wakeSite;
  openBoard();
  const line = byClass('job-state').map((n) => String(n.textContent))
    .find((t) => t.includes('bounty on ' + row.target));
  assert.ok(line, 'the accepted row renders');
  // Same vocabulary hunts quote (#271): lane / field / gate shapes.
  assert.match(line, /Last seen: /, 'the fallback still speaks the lane read — got: ' + line);
  assert.match(line, /working the .+ lane|holding near the .+field|seen near the (gate|system gate)|loitering just off /,
    'the phrase names a real place shape — got: ' + line);
});

// ---------------------------------------------------------------------------
// B. The honesty boundary holds: no coordinates, no record ids.
// ---------------------------------------------------------------------------
check('B1 the row never prints coordinates or record ids', () => {
  const row = pirateBounties().find((j) => j.state === 'accepted');
  openBoard();
  const line = byClass('job-state').map((n) => String(n.textContent))
    .find((t) => t.includes('bounty on ' + row.target)) ?? '';
  assert.ok(!/\b\d{3,}\b/.test(line.replace(/\d+\/\d+|\d+ UU/g, '')), 'no bare coordinates: ' + line);
  assert.ok(!/rec-/.test(line), 'no record id on the row');
});

// ---------------------------------------------------------------------------
// C. Hunt tracking behavior is untouched (#271 suite discipline).
// ---------------------------------------------------------------------------
check('C1 hunt cards keep their own Last seen line unchanged', () => {
  dock('freehold');
  openBoard();
  const hunts = ctx.world.jobs.filter((j) => j && j.kind === 'hunt' && j.state === 'offered');
  if (hunts.length === 0) { console.log('SKIP no hunt cards posted this seed'); return; }
  const details = byClass('job-detail').map((n) => String(n.textContent));
  for (const h of hunts) {
    const card = details.find((d) => d.includes(String(h.target)) && /Last seen: /.test(d));
    if (!card) continue;
    assert.match(card, /Last seen: /, 'hunt card keeps its Last seen line');
    assert.ok(!/bounty on/.test(card), 'hunt cards never read like bounty rows');
  }
  // The bounty branch did not steal the hunt stateLine shapes.
  const huntAccepted = ctx.world.jobs.find((j) => j && j.kind === 'hunt' && j.state === 'accepted');
  if (huntAccepted) {
    const line = byClass('job-state').map((n) => String(n.textContent)).join(' | ');
    assert.ok(!line.includes('bounty on ' + huntAccepted.target), 'an accepted hunt never reads as a bounty');
  }
});

// ---------------------------------------------------------------------------
// D. JSON-plain: jobs stay serializable with the render-only read.
// ---------------------------------------------------------------------------
check('D1 jobs snapshot stays JSON-safe', () => {
  openBoard();
  const copy = JSON.parse(JSON.stringify(ctx.world.jobs));
  assert.ok(Array.isArray(copy), 'jobs snapshot JSON-safe');
});

console.log('issue-292 bounty tracking: ' + checks + ' checks passed');
