/** Issue #101: real NPC/traffic/world lifecycle over disclosed initial states.
 * The primary pin stages approach history, never completion or retirement.
 * Later guard pins explicitly stage completed plans to isolate traffic rules.
 * Run: npm run test:traffic-retirement.
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { stageTrafficRetirement, sampleTrafficRetirement } from './lib/issue-101-fixture.mjs';
import { ESCAPE, U } from '../src/game/state.js';
import { finishEscape } from '../src/game/npc-escape.js';
import { pirateLiveCap } from '../src/game/traffic-feel.js';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
for (const n of dom.walkDom(document.body)) if (n.dataset?.titleAction === 'new') { n.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
const selected = systems.filter(([n]) => ['traffic', 'npc', 'world'].includes(n));
const traffic = systems.filter(([n]) => n === 'traffic');
const events = [];
function tick(n, subset = selected) {
  for (let i = 0; i < n; i++) {
    const before = new Set(ctx.ships);
    ctx.world.time += 1 / 60; ctx.elapsed += 1 / 60;
    for (const [, sys] of subset) sys.update?.(1 / 60);
    events.push(...ctx.events);
    ctx.lastEvents = ctx.events; ctx.events = [];
    assert.ok(ctx.ships.length <= 10, 'hard live cap');
    assert.ok(ctx.ships.filter(s => !before.has(s)).length <= 1, 'one spawn per frame');
  }
}
function rewards() { return { credits: ctx.world.credits, fear: ctx.world.fear }; }
function checkRecords(fixture) {
  const rows = sampleTrafficRetirement(ctx, fixture).records;
  assert.ok(rows.every(r => r.phase === 'done' && r.reason === 'sheltered' && r.surrendered && r.hull === 60));
  for (const row of rows) assert.deepEqual(row.cargo, [{ commodity: 'rawOre', units: 3 }], 'held cargo conserved');
}
const fixture = await stageTrafficRetirement(ctx);
const start = sampleTrafficRetirement(ctx, fixture);
const rewardBefore = rewards();
tick(1);
assert.equal(ctx.ships.length, 10);
assert.equal(sampleTrafficRetirement(ctx, fixture).traderLive, false);
tick(Math.ceil((ESCAPE.dwellMin + ESCAPE.dwellSpan + 5) * 60));
const after = sampleTrafficRetirement(ctx, fixture);
assert.equal(after.retiredLive.length, 8, JSON.stringify(after));
assert.equal(after.count, 10, 'one-for-one capacity replacement');
assert.equal(after.traderLive, true, 'loaded trader takes released slot');
assert.deepEqual(after.player, start.player, 'player remains at station');
assert.deepEqual(rewards(), rewardBefore, 'no retirement payout');
checkRecords(fixture);
const retiredId = fixture.ids.find(id => !after.retiredLive.includes(id));
assert.ok(ctx.ships.filter(s => s.role === 'pirate').length <= pirateLiveCap(ctx.ships.length, false));
tick(180 * 60);
assert.ok(!ctx.ships.some(s => s.record.id === retiredId), 'no full-cap replay loop for 180 seconds');
assert.equal(events.filter(e => e.type === 'npcSurrendered').length, 0, 'no duplicate surrender receipt');
console.log('PASS full-cap real station dwell and trader admission, fixed player, cargo/rewards and 180s no replay');

for (let pass = 0; pass < 3; pass++) {
  const blob = JSON.parse(JSON.stringify(binds.snapshot(ctx)));
  binds.restore(ctx, blob);
  tick(3);
  assert.ok(!ctx.ships.some(s => s.record.id === retiredId));
  checkRecords(fixture);
}
console.log('PASS three real snapshot/restore cycles preserve condition, surrender and nonempty cargo');

// Open spare capacity: the finished encounter is still a real population
// member. Let the actual abstract world route/dock clock make it eligible.
let patrol = ctx.ships.find(s => s.record.id === fixture.patrolId);
patrol.record.state = 'captured'; // fixture: this unrelated slot becomes free
let back;
for (let i = 0; i < 120 * 60; i++) {
  tick(1);
  back = ctx.ships.find(s => s.record.id === retiredId);
  if (back) break;
}
assert.ok(back, 'finished hull naturally rematerializes when spare capacity exists');
assert.equal(back.state.surrendered, true);
assert.equal(back.state.hull, 60);
assert.deepEqual(back.state.cargo, [{ commodity: 'rawOre', units: 3 }]);
assert.equal(ctx.ships.length, 10);
const late = JSON.parse(JSON.stringify(ctx.world.records.find(r => r.id === fixture.traderId)));
late.id = 'i101-later-trader'; late.name = 'Later Cargo'; late.live = false; late.state = 'enroute';
late.assetPending = false; late.cargo = [{ commodity: 'rawOre', units: 7 }];
const p = ctx.ship.object.position;
late.route = [{ x: p.x + 700, y: p.y + 250, z: p.z }, { x: p.x + 1000, y: p.y + 250, z: p.z }];
late.leg = 0; late.legT = 0; late.dir = 1; late.legLens = [300];
ctx.world.records.push(late);
tick(1, traffic);
assert.ok(ctx.ships.some(s => s.record.id === late.id), 'later unfinished cargo wins even after finished population returns');
assert.equal(ctx.ships.length, 10);
assert.ok(!ctx.ships.includes(back), 'replacement folds the rematerialized completed hull');
console.log('PASS finite population returns naturally; later cargo still wins contested capacity without churn');

// Jump's actual removal boundary plus systemLoaded flag healing, without
// flight controls. Fresh traffic still wins the empty bubble on return.
for (const live of ctx.ships) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
ctx.lastEvents = [{ type: 'systemLoaded' }];
tick(2, traffic);
assert.ok(ctx.ships.some(s => s.record.id === late.id));
checkRecords(fixture);
console.log('PASS jump removal/handoff keeps records and prioritizes unfinished return traffic');

// A fresh fixture for every predicate: all nine escape plans are explicitly
// completed here, so these pins isolate capacity policy from dwell movement.
async function completed() {
  const f = await stageTrafficRetirement(ctx);
  for (const live of ctx.ships) if (f.ids.includes(live.record.id)) {
    finishEscape(live.record, 'sheltered');
    live.ai.mode = 'loiter'; live.ai.fleeFrom = null;
  }
  return { f, held: ctx.ships[8], trader: ctx.world.records.find(r => r.id === f.traderId) };
}
const guards = [
  ['disabled salvage', h => { h.state.disabled = true; }],
  ['fresh damage', h => { h.state.lastHitAt = ctx.world.time; }],
  ['active combat', h => { h.ai.target = 'player'; }],
  ['selected completed hull', h => { ctx.targets.current = h; }],
  ['named ace', h => { h.record.role = 'ace'; }],
  ['accepted record-bound job', h => ctx.world.jobs.push({ kind: 'hunt', recordId: h.record.id, state: 'accepted' })],
  ['offered name/system bounty', h => ctx.world.jobs.push({ kind: 'bounty', target: h.record.name, system: h.record.system, state: 'offered' })],
  ['accepted name/system bounty', h => ctx.world.jobs.push({ kind: 'bounty', target: h.record.name, system: h.record.system, state: 'accepted' })],
  ['NPC hunter', h => { const hunter = ctx.ships[9]; hunter.role = 'pirate'; hunter.ai.role = 'pirate'; hunter.ai.target = h; }],
];
for (const [label, guard] of guards) {
  const { held, trader } = await completed();
  const jobs = ctx.world.jobs.slice();
  guard(held);
  tick(1, traffic);
  assert.ok(ctx.ships.includes(held), label + ' protected from replacement');
  assert.ok(ctx.ships.some(s => s.record === trader), 'another finished hull makes room');
  ctx.world.jobs = jobs;
}
console.log('PASS disabled, damage, combat, selection, ace, record/name-bound jobs and NPC hunter guards');

{
  const { held, trader } = await completed();
  trader.assetPending = true;
  tick(1, traffic);
  assert.ok(ctx.ships.includes(held), 'pending assets cause no premature retirement');
  trader.assetPending = false;
  trader.route[0] = { ...ctx.ships[0].object.position };
  tick(1, traffic);
  assert.ok(ctx.ships.includes(held), 'blocked clearance causes no premature retirement');
}
{
  const { held, trader } = await completed();
  // Wrong-system bounty with same name cannot protect an unrelated local hull.
  ctx.world.jobs.push({ kind: 'bounty', target: held.record.name, system: 'elsewhere', state: 'offered' });
  held.state.lastHitAt = undefined;
  tick(1, traffic);
  assert.ok(!ctx.ships.includes(held));
  assert.ok(ctx.ships.some(s => s.record === trader));
  ctx.world.jobs.pop();
}
console.log('PASS asset pending, clearance refusal, system-bound identity and finite-hit behavior');

// Selected ACTIVE escape retains the #68 range protection and close pressure.
await stageTrafficRetirement(ctx);
const held = ctx.ships[0];
ctx.targets.current = held;
tick(Math.ceil((ESCAPE.dwellMin + ESCAPE.dwellSpan + 5) * 60));
assert.ok(ctx.ships.includes(held) && held.record.escape.phase !== 'done');
held.object.position.copy(ctx.ship.object.position).addScalar(U.DEINSTANTIATE_RANGE + 500);
tick(1, traffic);
assert.ok(ctx.ships.includes(held));
held.object.position.set(...held.record.escape.dest);
ctx.targets.current = null;
held.state.lastHitAt = ctx.world.time;
tick(1);
assert.notEqual(held.record.escape.phase, 'done');
console.log('PASS selected active pursuit, hysteresis exemption and fresh hit during hold');
