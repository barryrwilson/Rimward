/**
 * Issue #301 — the Jobs board answers "where are the lane's pirates" before
 * any acceptance. The offered pirate-bounty cards and the patrol row quote
 * the SAME derived lane read the #292 accepted row quotes: the living
 * record's durable evidence (the #68 tagged wakeSite) first, else its
 * authored lane through #271's huntHauntPhrase. Copy-only: no persisted
 * field, no state.js edit, and the agent row carries the same read.
 *
 * Real station DOM, the real Jobs board, the same harness discipline the
 * #292/#294 suites use. Fixtures are disclosed record-state flips only.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-301-bounty-board-location-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

seedBootRandom();
const dom = installDomStubs();
const boot = await bootGameSystems();
const { ctx, systems } = boot;
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const texts = (cls) => byClass(cls).map((n) => String(n.textContent));

const openBoard = () => ctx.stationDesk.selectService('jobs');
const pirateBounties = (state) => ctx.world.jobs.filter((j) => j && j.kind === 'bounty'
  && typeof j.id === 'string' && j.id.startsWith('bounty-pirate-')
  && (state ? j.state === state : true));
const patrolJob = () => ctx.world.jobs.find((j) => j && j.kind === 'patrol');
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
// Setup: dock at freehold and make sure one priced pirate bounty is offered.
// ---------------------------------------------------------------------------
check('setup: an offered pirate bounty exists at the home dock', () => {
  dock('freehold');
  openBoard();
  if (pirateBounties('offered').length === 0) {
    const sysId = ctx.world.currentSystem;
    const rec = {
      id: 'rec-301-fixture', name: 'Fixture Quill', classKey: 'cutter',
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
  }
  assert.ok(pirateBounties('offered').length >= 1, 'an offered pirate bounty is posted');
});

// ---------------------------------------------------------------------------
// A. The offered bounty card names where the quarry works (#271/#292 shape).
// ---------------------------------------------------------------------------
check('A1 the offered bounty card quotes the lane read before acceptance', () => {
  openBoard();
  const details = texts('job-detail');
  const row = pirateBounties('offered')[0];
  const card = details.find((t) => t.includes(String(row.target)));
  assert.ok(card, 'the offered bounty card renders — got: ' + details.join(' | ').slice(0, 240));
  assert.match(card, /Last seen: /, 'the offered card carries the Last seen read — got: ' + card);
  assert.match(card,
    /working the .+ lane|holding near the .+field|seen near the (gate|system gate)|loitering just off |sheltering in the holding lane|seen at the gate to |last seen running open space/,
    'the phrase names a real #271/#292 place shape — got: ' + card);
});

check('A2 the offered card read matches the accepted row read for the same target', () => {
  const row = pirateBounties('offered')[0];
  const phrase = ctx.stationDesk.bountyLastSeenPhrase(row);
  assert.ok(typeof phrase === 'string' && phrase, 'the desk exposes the same read');
  openBoard();
  const details = texts('job-detail');
  const card = details.find((t) => t.includes(String(row.target)));
  assert.ok(card.includes('Last seen: ' + phrase + '.'), 'the card quotes the desk read verbatim');
  // Accept through the real desk: the accepted state line keeps the read.
  ctx.stationDesk.acceptJob({ id: row.id });
  const accepted = pirateBounties('accepted').find((j) => j.target === row.target);
  assert.ok(accepted, 'the bounty is accepted');
  openBoard();
  const line = texts('job-state').find((t) => t.includes('bounty on ' + row.target));
  assert.ok(line, 'the accepted row renders');
  assert.match(line, /Last seen: /, 'the accepted row keeps the read (#292) — got: ' + line);
});

// ---------------------------------------------------------------------------
// B. The patrol row points at the same lane before and after acceptance.
// ---------------------------------------------------------------------------
check('B1 the offered patrol row carries a Lane read line', () => {
  const job = patrolJob();
  job.state = 'offered'; // disclosed flip; restored below
  openBoard();
  const laneLine = texts('job-state').find((t) => t.startsWith('Lane read: '));
  assert.ok(laneLine, 'the offered patrol card prints a Lane read');
  const phrase = ctx.stationDesk.peekPirateLanePhrase();
  assert.ok(typeof phrase === 'string' && phrase, 'the desk exposes the lane phrase');
  assert.ok(laneLine.includes(phrase), 'the printed line quotes the desk phrase verbatim');
  assert.match(laneLine.replace('Lane read: ', '').replace(/\.$/, ''),
    /working the .+ lane|holding near the .+field|seen near the (gate|system gate)|loitering just off |sheltering in the holding lane|seen at the gate to |last seen running open space/,
    'the lane phrase is a #271/#292 place shape — got: ' + laneLine);
  job.state = 'accepted';
  openBoard();
});

check('B2 the accepted patrol row keeps the same Lane read', () => {
  const phrase = ctx.stationDesk.peekPirateLanePhrase();
  const line = texts('job-state').find((t) => t.startsWith('ACCEPTED — ') && /Lane read: /.test(t));
  assert.ok(line, 'the accepted patrol row keeps the lane read — got: '
    + texts('job-state').join(' | ').slice(0, 240));
  assert.match(line, /ACCEPTED — \d\/\d/, 'the tally survives (#294)');
  assert.ok(line.includes('Lane read: ' + phrase + '.'), 'the accepted row quotes the same phrase');
});

// ---------------------------------------------------------------------------
// C. Honesty boundary: no coordinates, no record ids on any new copy.
// ---------------------------------------------------------------------------
check('C1 the new copy never prints coordinates or record ids', () => {
  openBoard();
  const lines = [...texts('job-detail'), ...texts('job-state')]
    .filter((t) => /Last seen: |Lane read: /.test(t));
  assert.ok(lines.length >= 1, 'at least one lane read is on the board');
  for (const line of lines) {
    assert.ok(!/\b\d{3,}\b/.test(line.replace(/\d+\/\d+|\d+ UU/g, '')), 'no bare coordinates: ' + line);
    assert.ok(!/rec-/.test(line), 'no record id on the row: ' + line);
  }
});

// ---------------------------------------------------------------------------
// D. Same-source discipline: the board read follows the record's evidence.
// ---------------------------------------------------------------------------
check('D1 a gate wake flips the offered read to the gate destination', () => {
  const row = pirateBounties('accepted')[0] ?? pirateBounties('offered')[0];
  const sysId = ctx.world.currentSystem;
  const rec = bank().find((r) => r && r.role === 'pirate' && r.name === row.target
    && r.state !== 'dead' && r.state !== 'captured');
  assert.ok(rec, 'the named reaver record resolves');
  const dest = Object.keys(ctx.systems).find((k) => k !== sysId && ctx.systems[k]?.name);
  assert.ok(dest, 'an adjacent system exists to name');
  rec.wakeSite = { position: [0, 0, 0], found: false, kind: 'gate', to: dest, from: sysId };
  openBoard();
  const expected = ctx.stationDesk.bountyLastSeenPhrase(
    pirateBounties('accepted').find((j) => j.target === row.target)
    ?? pirateBounties('offered').find((j) => j.target === row.target));
  assert.match(String(expected), /seen at the gate to /, 'the wake stamp names the crossing');
  // The offered lane read follows the same evidence.
  const laneLine = texts('job-state').find((t) => t.startsWith('Lane read: '));
  if (pirateBounties('accepted').some((j) => j.target === row.target)) {
    const line = texts('job-state').find((t) => t.includes('bounty on ' + row.target));
    assert.match(line, /seen at the gate to /, 'the accepted row follows the wake — got: ' + line);
  }
  if (laneLine) assert.ok(laneLine.includes('seen at the gate to'), 'the patrol lane read follows the wake too');
  delete rec.wakeSite;
  openBoard();
});

// ---------------------------------------------------------------------------
// E. Agent parity and JSON-plain.
// ---------------------------------------------------------------------------
check('E1 the agent bounty row carries the same lastSeen read', () => {
  const row = pirateBounties('accepted')[0] ?? pirateBounties('offered')[0];
  openBoard();
  const offers = window.rimward.observe().jobs.offers;
  const active = window.rimward.observe().jobs.active;
  const agentRow = [...offers, ...active].find((j) => j.kind === 'bounty' && j.target === row.target);
  assert.ok(agentRow, 'the bounty row is observed');
  const phrase = ctx.stationDesk.bountyLastSeenPhrase(row);
  if (phrase) {
    assert.equal(agentRow.lastSeen, phrase, 'the agent row quotes the same read');
  }
  const copy = JSON.parse(JSON.stringify(agentRow));
  assert.ok(typeof copy.lastSeen === 'string' || copy.lastSeen === undefined, 'lastSeen is JSON-plain');
});

check('E2 jobs snapshot stays JSON-safe', () => {
  openBoard();
  const copy = JSON.parse(JSON.stringify(ctx.world.jobs));
  assert.ok(Array.isArray(copy), 'jobs snapshot JSON-safe');
});

check('E3 no new persisted field landed on jobs or records', () => {
  for (const j of ctx.world.jobs) {
    const keys = Object.keys(j);
    for (const k of keys) {
      assert.ok(!/^(lane|pirate|board)Phrase/i.test(k), 'no lane-phrase field persisted on jobs: ' + k);
    }
  }
  for (const r of bank()) {
    if (!r) continue;
    assert.ok(!('boardPhrase' in r), 'no boardPhrase field persisted on records');
  }
});

console.log('issue-301 bounty board location: ' + checks + ' checks passed');
