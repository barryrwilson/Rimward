/**
 * Issue #315 — the agent observation answers "how is my standing moving" and
 * "how hot is this bounty": a JSON-plain world.reputation map keyed by every
 * authored faction (name, rank word, rounded standing) sourced from the live
 * ctx.world.reputation bag through the desk's own standingRead/rankFor, and a
 * per-bounty heat read ({bounty, tier}) on offered/accepted bounty rows sourced
 * from the living quarry record through the desk's bounty evaluator — the same
 * record the board and settlement read, with #272's danger tier.
 *
 * Observation-only: no persisted field, no ctx.world write, VERSION stays 2,
 * no HUD gauge. Real station DOM and the real Jobs board; fixtures are
 * disclosed record-state flips only.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-315-standing-heat-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { FACTIONS, rankFor } from '../src/game/state.js';
import { standingRead } from '../src/game/data-trade.js';

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
const openStanding = () => ctx.stationDesk.selectService('epics');
const observe = () => window.rimward.observe();
const pirateBounties = (state) => ctx.world.jobs.filter((j) => j && j.kind === 'bounty'
  && typeof j.id === 'string' && j.id.startsWith('bounty-pirate-')
  && (state ? j.state === state : true));
const bank = () => ctx.world.recordBanks?.[ctx.world.currentSystem] ?? ctx.world.records ?? [];
/** The living pirate record the board's bounty row binds (current bank first). */
const livingPirate = (name) => {
  const banks = [ctx.world.records ?? [], ...Object.values(ctx.world.recordBanks ?? {})];
  for (const b of banks) {
    if (!Array.isArray(b)) continue;
    for (let i = b.length - 1; i >= 0; i--) {
      const r = b[i];
      if (r && r.role === 'pirate' && r.name === name
        && r.state !== 'dead' && r.state !== 'captured') return r;
    }
  }
  return null;
};
// #272's danger rule: a stamped veteran or a price at/above the hardened
// threshold posts hard tier. Kept in the test as the expected derived read.
const expectedTier = (rec) => (rec.reaverTier === 'veteran'
  || (Number.isFinite(rec.bounty) && rec.bounty >= 700)) ? 'hard' : 'standard';
const jobRows = () => {
  const obs = observe();
  return [...(obs.jobs?.offers ?? []), ...(obs.jobs?.active ?? [])];
};

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
      id: 'rec-315-fixture', name: 'Fixture Quill', classKey: 'cutter',
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
// A. Faction standing: the map mirrors the desk's own standing read.
// ---------------------------------------------------------------------------
check('A1 world.reputation covers every authored faction with name/rank/standing', () => {
  const obs = observe();
  assert.equal(obs.v, 2, 'API VERSION stays 2');
  const map = obs.world?.reputation;
  assert.ok(map && typeof map === 'object' && !Array.isArray(map), 'the map is a plain object');
  const keys = Object.keys(FACTIONS);
  assert.deepEqual(Object.keys(map).sort(), keys.slice().sort(), 'every faction id is published');
  for (const key of keys) {
    const row = map[key];
    assert.equal(row.name, FACTIONS[key].name, 'the authored faction name is quoted: ' + key);
    assert.ok(typeof row.rank === 'string' && row.rank.length > 0, 'a rank word is published: ' + key);
    assert.ok(Number.isFinite(row.standing), 'a finite standing is published: ' + key);
  }
});

check('A2 the map follows the live standing bag through the desk evaluators', () => {
  ctx.world.reputation.freehold = 30;
  ctx.world.reputation.veridian = 12;
  ctx.world.reputation.hollow = -12;
  ctx.world.reputation.redledger = -30;
  const map = observe().world.reputation;
  for (const key of Object.keys(FACTIONS)) {
    const expected = rankFor(standingRead(ctx.world.reputation, key));
    assert.equal(map[key].rank, expected.name, 'rank parity for ' + key);
    assert.equal(map[key].standing, Math.round(standingRead(ctx.world.reputation, key)),
      'standing parity for ' + key);
  }
  assert.equal(map.freehold.rank, 'Trusted');
  assert.equal(map.freehold.standing, 30);
  assert.equal(map.veridian.rank, 'Known');
  assert.equal(map.hollow.rank, 'Suspect');
  assert.equal(map.redledger.rank, 'Marked');
});

check('A3 the rendered Standing desk prints the same rank and standing', () => {
  openStanding();
  const line = texts('screen-note').find((t) => t.includes('Freehold Compact: '));
  assert.ok(line, 'the Standing desk prints the dock faction line — got: '
    + texts('screen-note').join(' | ').slice(0, 240));
  assert.match(line, /Freehold Compact: Trusted \(\+30\)/, 'the desk line matches the map — got: ' + line);
  openBoard();
});

check('A4 the map is derived, not persisted or written back', () => {
  const before = JSON.stringify(ctx.world.reputation);
  observe();
  assert.equal(JSON.stringify(ctx.world.reputation), before, 'no write to ctx.world.reputation');
  const map = observe().world.reputation;
  assert.equal(JSON.stringify(JSON.parse(JSON.stringify(map))), JSON.stringify(map),
    'the map is JSON-plain');
  for (const key of Object.keys(FACTIONS)) {
    assert.deepEqual(Object.keys(map[key]).sort(), ['name', 'rank', 'standing'],
      'no extra keys on the standing row: ' + key);
  }
});

// ---------------------------------------------------------------------------
// B. Bounty heat: the posted price on the living quarry plus #272's tier.
// ---------------------------------------------------------------------------
check('B1 the offered bounty row publishes the record bounty and derived tier', () => {
  openBoard();
  const row = pirateBounties('offered')[0];
  const rec = livingPirate(row.target);
  assert.ok(rec, 'the offered row binds a living quarry');
  const agentRow = jobRows().find((j) => j.kind === 'bounty' && j.target === row.target);
  assert.ok(agentRow, 'the offered bounty row is observed');
  assert.ok(agentRow.heat && typeof agentRow.heat === 'object', 'the row carries heat');
  assert.equal(agentRow.heat.bounty, Math.round(rec.bounty), 'heat quotes the record bounty');
  assert.equal(agentRow.heat.tier, expectedTier(rec), 'heat quotes #272 danger tier');
  const desk = ctx.stationDesk.peekBountyHeat(row);
  assert.deepEqual(agentRow.heat, desk, 'the agent row quotes the desk evaluator');
});

check('B2 accepting the bounty keeps the heat read on the active row', () => {
  const row = pirateBounties('offered')[0];
  const rec = livingPirate(row.target);
  const expected = { bounty: Math.round(rec.bounty), tier: expectedTier(rec) };
  ctx.stationDesk.acceptJob({ id: row.id });
  const accepted = pirateBounties('accepted').find((j) => j.target === row.target);
  assert.ok(accepted, 'the bounty is accepted');
  const agentRow = jobRows().find((j) => j.kind === 'bounty' && j.target === row.target);
  assert.ok(agentRow, 'the accepted bounty row is observed');
  assert.deepEqual(agentRow.heat, expected, 'the accepted row keeps the same heat');
  assert.equal(JSON.stringify(JSON.parse(JSON.stringify(agentRow.heat))),
    JSON.stringify(agentRow.heat), 'heat is JSON-plain');
});

check('B3 heat follows the record: price and stamped tier both move it', () => {
  const row = pirateBounties('accepted')[0] ?? pirateBounties('offered')[0];
  const rec = livingPirate(row.target);
  assert.ok(rec, 'the named reaver record resolves');
  const originalBounty = rec.bounty;
  rec.bounty = 900;
  openBoard();
  const agentRow = jobRows().find((j) => j.kind === 'bounty' && j.target === row.target);
  assert.equal(agentRow.heat.bounty, 900, 'the heat follows the record price');
  assert.equal(agentRow.heat.tier, 'hard', 'HUNT_HARD_BOUNTY_AT posts hard tier');
  rec.bounty = 450;
  rec.reaverTier = 'veteran';
  const veteran = jobRows().find((j) => j.kind === 'bounty' && j.target === row.target);
  assert.equal(veteran.heat.tier, 'hard', 'a stamped veteran reaver is hard tier (#272)');
  assert.equal(veteran.heat.bounty, 450, 'the stamped tier does not rewrite the price');
  delete rec.reaverTier;
  rec.bounty = originalBounty;
  openBoard();
});

check('B4 the ace contract publishes the live ace bounty and hard tier', () => {
  const aceJob = ctx.world.jobs.find((j) => j && j.id === 'bounty-ace');
  assert.ok(aceJob, 'the board carries the ace contract (#269)');
  const heat = ctx.stationDesk.peekBountyHeat(aceJob);
  assert.ok(heat, 'the ace row binds a live ace');
  assert.equal(heat.bounty, 2500, 'the live ace bounty is published');
  assert.equal(heat.tier, 'hard', 'the ace contract is hard tier');
  const agentRow = jobRows().find((j) => j.id === 'bounty-ace');
  if (agentRow) assert.deepEqual(agentRow.heat, heat, 'the agent ace row quotes the desk read');
});

check('B5 a row binding no living quarry carries no heat', () => {
  const sysId = ctx.world.currentSystem;
  const deadJob = {
    id: 'bounty-pirate-315', kind: 'bounty', state: 'offered',
    target: 'Nobody Here', system: sysId, reward: 400,
  };
  assert.equal(ctx.stationDesk.peekBountyHeat(deadJob), null, 'absent quarry means absent heat');
  const nonBounty = { id: 'haul-1', kind: 'haul', state: 'accepted', reward: 100 };
  assert.equal(ctx.stationDesk.peekBountyHeat(nonBounty), null, 'non-bounty rows carry no heat');
  openBoard();
  for (const row of jobRows()) {
    if (row.kind === 'bounty') continue;
    assert.ok(!Object.hasOwn(row, 'heat'), 'non-bounty agent row carries no heat: ' + row.id);
  }
});

// ---------------------------------------------------------------------------
// C. Honesty boundary: heat carries no coordinate, handle or record id.
// ---------------------------------------------------------------------------
check('C1 the heat read is only a price and a tier', () => {
  const row = jobRows().find((j) => j.kind === 'bounty' && j.heat);
  assert.ok(row, 'at least one bounty row carries heat');
  assert.deepEqual(Object.keys(row.heat).sort(), ['bounty', 'tier']);
  assert.equal(typeof row.heat.bounty, 'number');
  assert.equal(typeof row.heat.tier, 'string');
  assert.ok(!/rec-/.test(JSON.stringify(row.heat)), 'no record id in the heat read');
});

// ---------------------------------------------------------------------------
// D. No persisted field: observe never rewrites jobs or records.
// ---------------------------------------------------------------------------
check('D1 no heat or standing field is persisted on jobs or records', () => {
  const jobsBefore = JSON.stringify(ctx.world.jobs);
  const bankBefore = JSON.stringify(bank());
  const repBefore = JSON.stringify(ctx.world.reputation);
  openBoard();
  observe();
  assert.equal(JSON.stringify(ctx.world.jobs), jobsBefore, 'jobs untouched by observe');
  assert.equal(JSON.stringify(bank()), bankBefore, 'records untouched by observe');
  assert.equal(JSON.stringify(ctx.world.reputation), repBefore, 'standing bag untouched by observe');
  for (const j of ctx.world.jobs) {
    assert.ok(!Object.hasOwn(j, 'heat'), 'no heat field on jobs: ' + j.id);
    assert.ok(!Object.hasOwn(j, 'standing'), 'no standing field on jobs: ' + j.id);
  }
  for (const r of bank()) {
    if (!r) continue;
    assert.ok(!Object.hasOwn(r, 'heat'), 'no heat field on records');
    assert.ok(!Object.hasOwn(r, 'tier'), 'no tier field on records');
  }
});

console.log('issue-315 standing and bounty heat: ' + checks + ' checks passed');
