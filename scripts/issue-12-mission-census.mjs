/** Reproducible real-board census; --baseline records known twins without failing.
 * node --import ./scripts/with-css-stub.mjs scripts/issue-12-mission-census.mjs [--baseline] [--out=path]
 * Safe-berth/system fixtures exercise real render/generation/acceptance/update.
 * No flight, economy progression or encounter performance is measured.
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { resolveExploreSite } from '../src/game/survey-nav.js';
import { recoveryObjective } from '../src/game/recovery.js';
import { CHAIN_ORIGIN } from '../src/game/jobs-chains.js';

const baseline = process.argv.includes('--baseline');
const output = process.argv.find(x => x.startsWith('--out='))?.slice(6) || 'out/issue-12/census.json';
seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];
const world = systems.find(([name]) => name === 'world')[1];
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
const kinds = ['mining', 'trade', 'hunt', 'passenger', 'explore', 'espionage', 'war'];
const clone = x => JSON.parse(JSON.stringify(x));
const publicCards = new WeakMap();
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += 1 / 60; ctx.elapsed += 1 / 60;
    station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  // Census relocation bypasses faction launch holds as well as travel; assert
  // the actual resulting origin so a refused launch cannot sample an old dock.
  ctx.flags.docked = false;
  ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }]; world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.dockPressed = true; tick(3); ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true, 'fixture docks at ' + id);
  assert.equal(ctx.world.currentSystem, id, 'census origin actually switched');
  ctx.stationDesk.selectService('jobs');
}
function live(kind, origin = ctx.world.currentSystem) {
  return ctx.world.jobs.filter(j => j.kind === kind && j.originSystem === origin && ['offered', 'accepted'].includes(j.state));
}
// Identity describes the objective the player undertakes. IDs, slot numbers,
// deadlines and generator sequence are evidence only, never differences.
function identity(j) {
  const site = j.kind === 'explore' ? resolveExploreSite(ctx, j.originSystem, j.slot) : null;
  const card = publicCards.get(j);
  return { kind: j.kind, origin: j.originSystem ?? j.system,
    destination: site?.siteSystem ?? j.destSystem ?? null,
    target: site?.landmark.name ?? j.target ?? null,
    site: site?.landmark.id ?? null,
    commodity: j.commodity ?? null, need: j.need, reward: card?.reward ?? j.reward,
    title: card?.title ?? j.title, rewardLine: card?.rewardLine,
    // Recovery markers point to different physical wreck objectives.
    wreck: j.kind === 'recovery' ? j.wreckId : undefined,
    detail: card?.detail ?? j.detail };
}
function pairs(rows) {
  const found = [];
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    if (JSON.stringify(identity(rows[a])) === JSON.stringify(identity(rows[b]))) found.push({ ids: [rows[a].id, rows[b].id], identity: identity(rows[a]) });
  }
  return found;
}
const result = { baseline, fixture: 'Safe berth/system switching, seeded generator, real station closures. No flight costs measured.',
  seeds: [1, 42, 1592594996], systems: Object.keys(ctx.systems).length, families: {}, boards: [], checks: [] };
for (const kind of [...kinds, 'bounty', 'recovery', 'chain', 'haul', 'ferry', 'patrol']) result.families[kind] = { offers: 0, pairs: 0, boardsWithPairs: 0 };
for (const seed of result.seeds) {
  let rng = seed;
  Math.random = () => ((rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (const id of Object.keys(ctx.systems)) {
    // An independent fresh board, with the real lazily generated record bank.
    ctx.world.jobs = ctx.world.jobs.filter(j => ['haul', 'ferry', 'patrol'].includes(j.kind) || j.id === 'bounty-ace');
    dock(id);
    const offered = ctx.world.jobs.filter(j => j.state === 'offered' && (j.originSystem === id || j.system === id || ['haul', 'ferry', 'patrol'].includes(j.kind) || j.id === 'bounty-ace'));
    const rendered = ctx.stationDesk.peekView()?.rows ?? [], cards = [];
    for (const row of rendered) {
      if (row.cls === 'job-title') cards.push({ title: row.text.replace(/^\d+\. /, '') });
      else if (row.cls === 'job-detail' && cards.length) cards.at(-1).detail = row.text;
      else if (row.cls === 'job-reward' && cards.length) {
        cards.at(-1).rewardLine = row.text;
        cards.at(-1).reward = Number(row.text.match(/pays (\d+) UU/)?.[1]) || undefined;
      }
    }
    assert.equal(cards.length, offered.length, id + ' census covers every rendered offer');
    offered.forEach((j, index) => publicCards.set(j, cards[index]));
    const board = { seed, system: id, offers: offered.map(j => ({ id: j.id, slot: j.slot, ...identity(j) })), twins: {}, rendered };
    for (const kind of Object.keys(result.families)) {
      const rows = offered.filter(j => j.kind === kind), twins = pairs(rows), f = result.families[kind];
      f.offers += rows.length; f.pairs += twins.length; f.boardsWithPairs += Number(twins.length > 0);
      if (twins.length) board.twins[kind] = twins;
    }
    result.boards.push(board);
  }
}
// A pinned RNG proves worst-case repeated selection rather than relying on a
// lucky sample. A real acceptance must reserve its slot until timeout/refill.
ctx.world.jobs = []; Math.random = () => 0; dock('freehold');
const trade = live('trade');
if (!baseline) assert.equal(pairs(trade).length, 0, 'constant RNG retains distinct trade objectives');
assert.equal(trade.length, 2);
const selected = trade[0], sibling = trade[1];
assert.equal(ctx.stationDesk.acceptJob(selected.id).ok, true);
assert.equal(live('trade').length, 2, 'accepted trade occupies slot');
assert.equal(live('trade').filter(j => j.state === 'offered').length, 1);
assert.equal(ctx.stationDesk.acceptJob(selected.id).ok, false, 'repeat acceptance refuses');
const accepted = clone(selected); ctx.stationDesk.selectService('jobs');
assert.deepEqual(clone(selected), accepted, 'board refresh preserves accepted agreement');
selected.deadline = ctx.world.time - 1; tick(90); ctx.stationDesk.selectService('jobs');
assert.equal(live('trade').length, 2, 'expiry refills one trade slot');
assert.ok(live('trade').includes(sibling), 'unaffected sibling retained');
assert.ok(!live('trade').includes(selected), 'expired trade replaced');
if (!baseline) assert.equal(pairs(live('trade')).length, 0, 'trade refill avoids sibling');
result.checks.push('constant RNG; trade accept/duplicate refusal/refresh/expiry one-in-one-out');
const passengers = live('passenger');
assert.equal(passengers.length, 2, 'two separately paid parties remain');
for (const j of passengers) assert.equal(ctx.stationDesk.acceptJob(j.id).ok, true);
assert.equal(live('passenger').filter(j => j.state === 'accepted').length, 2);
result.checks.push('both same-route passenger parties remain independently acceptable (#73)');
const surveys = live('explore');
assert.equal(surveys.length, baseline ? 2 : 1, 'one eligible Freehold survey objective');
const survey = surveys[0]; assert.equal(ctx.stationDesk.acceptJob(survey.id).ok, true);
ctx.stationDesk.selectService('jobs');
assert.equal(live('explore').length, baseline ? 2 : 1, 'accepted survey occupies objective');
survey.deadline = ctx.world.time - 1; tick(90); ctx.stationDesk.selectService('jobs');
assert.equal(live('explore').length, baseline ? 2 : 1, 'expired survey refills eligible objective');
assert.ok(!live('explore').includes(survey));
result.checks.push('single-site survey acceptance/expiry/refill');
ctx.world.jobs = []; dock('hollowreach');
assert.equal(live('explore').length, 2, 'two distinct Hollowreach sites retained');
assert.equal(pairs(live('explore')).length, 0);
result.checks.push('two distinct survey objectives retained');
// Old saves can contain offered twins, or two accepted agreements. Healing
// may replace the former only. Locked pay remains a material difference.
if (!baseline) {
  ctx.world.jobs = []; dock('freehold');
  let rows = live('trade'); rows[1].commodity = rows[0].commodity;
  ctx.stationDesk.selectService('jobs');
  assert.equal(live('trade').length, 2); assert.equal(pairs(live('trade')).length, 0);
  rows = live('trade');
  for (const j of rows) { j.commodity = 'provisions'; j.state = 'accepted'; j.payQuoted = 700; }
  const agreements = clone(rows);
  ctx.stationDesk.selectService('jobs'); assert.deepEqual(clone(live('trade')), agreements);
  // A different locked reward or destination must not block an offer.
  for (const difference of ['reward', 'destination']) {
    ctx.world.jobs = []; dock('freehold');
    const held = live('trade')[0]; assert.equal(ctx.stationDesk.acceptJob(held.id).ok, true);
    if (difference === 'reward') held.payQuoted += 100;
    else held.destSystem = 'hollowreach';
    ctx.world.jobs = [held]; ctx.stationDesk.selectService('jobs');
    assert.equal(live('trade').length, 2);
    assert.equal(live('trade')[1].commodity, held.commodity, difference + ' preserves same-commodity distinct agreement');
  }
  ctx.world.jobs = []; dock('freehold');
  const legacy = live('explore')[0]; legacy.slot = 1;
  assert.equal(ctx.stationDesk.acceptJob(legacy.id).ok, true);
  const legacyAgreement = clone(legacy);
  ctx.world.jobs.push({ ...clone(legacy), id: 'explore-freehold-99999', slot: 0, state: 'offered' });
  ctx.stationDesk.selectService('jobs');
  assert.deepEqual(clone(legacy), legacyAgreement);
  assert.deepEqual(live('explore').map(j => j.id), [legacy.id], 'accepted legacy slot 1 retains sole objective');
  legacy.deadline = ctx.world.time - 1; tick(90); ctx.stationDesk.selectService('jobs');
  assert.equal(live('explore').length, 1); assert.notEqual(live('explore')[0].id, legacy.id);
  const first = live('explore')[0]; assert.equal(ctx.stationDesk.acceptJob(first.id).ok, true);
  ctx.world.jobs.push({ ...clone(first), id: 'explore-freehold-99998', slot: first.slot === 1 ? 0 : 1 });
  const twoAccepted = clone(live('explore'));
  ctx.stationDesk.selectService('jobs'); assert.deepEqual(clone(live('explore')), twoAccepted);
  result.checks.push('legacy offered twins heal; two accepted agreements preserved; legacy accepted survey slot 1 refills; differing locked trade reward/destination retained');
}
// Recovery requires a real aftermath record; explicit fixtures cover its
// eligibility, distinct physical markers and idempotent board sync.
ctx.world.jobs = []; ctx.world.aftermath = []; ctx.cargo.length = 0; dock('freehold');
for (let i = 0; i < 2; i++) ctx.world.aftermath.push({ id: 'census-wreck-' + i,
  kind: 'wreck', system: 'freehold', createdAt: ctx.world.time, expiresAt: ctx.world.time + 600,
  position: { x: 700 + i * 100, y: 200, z: 0 } });
for (let i = 0; i < 4; i++) ctx.stationDesk.selectService('jobs');
const recoveries = live('recovery'); assert.equal(recoveries.length, 2);
assert.equal(pairs(recoveries).length, 0, 'same recovery copy points to distinct physical wrecks');
for (const j of recoveries) assert.equal(ctx.stationDesk.acceptJob(j.id).ok, true);
result.recoveryFixture = recoveries.map(j => ({ identity: identity(j), objective: recoveryObjective(ctx, j) }));
ctx.stationDesk.selectService('jobs'); assert.equal(live('recovery').length, 2);
result.checks.push('two recovery wreck targets retained and accepted; repeated sync does not repost a wreck');
result.chainFixtures = [];
for (const [employer, origin] of Object.entries(CHAIN_ORIGIN)) {
  ctx.world.jobs = []; ctx.world.reputation[ctx.systems[origin].faction] = 100; dock(origin);
  for (let i = 0; i < 3; i++) ctx.stationDesk.selectService('jobs');
  const rows = live('chain'); assert.equal(rows.length, 1, employer + ' posts one chain');
  assert.equal(ctx.stationDesk.acceptJob(rows[0].id).ok, true);
  ctx.stationDesk.selectService('jobs'); assert.equal(live('chain').length, 1);
  result.chainFixtures.push({ employer, identity: identity(rows[0]) });
  rows[0].state = 'done'; ctx.stationDesk.selectService('jobs');
  assert.equal(live('chain').length, 0, 'completed employer chain never renews');
}
result.checks.push('all four standing-gated employer chains are single-instance; accepted/done prevent repost');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output, systems: result.systems, seeds: result.seeds, families: result.families, checks: result.checks }, null, 2));
if (!baseline) for (const kind of kinds.filter(k => k !== 'passenger')) assert.equal(result.families[kind].pairs, 0, kind + ' census has no materially identical pairs');
console.log('PASS issue #12 census and acceptance/refill contracts' + (baseline ? ' (baseline twins recorded)' : ''));
