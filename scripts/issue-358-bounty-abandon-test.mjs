/**
 * Issue #358 — an accepted bounty is escapable through the Agent API.
 *
 * The #331 playtest: after the engage lease stalled on bounty-ace, abandonJob
 * refused with the generic special-cargo copy and the top bounty became a
 * progress trap — the kill could not be converted and the contract could not
 * be dropped. #357 already fixed the stall; this pins the escape path:
 *
 * 1. accepting the top bounty (bounty-ace) and calling abandonJob succeeds,
 *    charges exactly -1 standing to the posting faction, records one
 *    jobState outcome 'abandoned', and returns the SAME posting to the board
 *    as offered (re-acceptable — no trap);
 * 2. a pirate bounty row takes the same forfeit on its home board;
 * 3. the visible accepted card offers the abandon action (no refusal note);
 * 4. the guards hold: a bounty-shaped row with no valid posting faction still
 *    refuses with copy naming the blocker, non-bounty obligation rows (ferry)
 *    keep the #207 refusal copy, invalid input fails closed without world
 *    mutation, and a save round trip keeps the re-offered rows JSON-safe.
 *
 * Fixture discipline: real station owner and rendered DOM via the boot
 * harness (the #207 pattern). No outcome is stamped that the tested code
 * should produce.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-358-bounty-abandon-test.mjs
 */
import assert from 'node:assert/strict';
import { snapshot as saveSnapshot, restore } from '../src/game/save.js';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
for (const el of dom.walkDom(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
const rw = window.rimward;
function tick() { station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = []; }
function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }]; world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.dockPressed = true; tick(); tick(); ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true);
  assert.equal(ctx.world.currentSystem, id);
}
const act = (name, args = {}) => rw.act({ v: 2, name, args });
const freeholdStanding = () => ctx.world.reputation.freehold;
const abandonedEvents = (id) => ctx.agent.events.filter((e) => e.type === 'jobState' && e.id === id && e.outcome === 'abandoned').length;

dock('freehold');
ctx.stationDesk.selectService('jobs');
const ace = ctx.world.jobs.find((j) => j && j.id === 'bounty-ace');
assert.ok(ace && ace.state === 'offered', 'the top bounty is offered at boot');

// 1. The trap as played: accept the top bounty, then try the ordinary exit.
assert.equal(act('acceptJob', { id: 'bounty-ace' }).ok, true, JSON.stringify(ace));
assert.equal(ace.state, 'accepted');

// 3. The accepted card now offers the escape instead of the refusal note.
const abandonButton = [...dom.walkDom(document.body)]
  .find((e) => e.textContent?.startsWith('Abandon (-1 Freehold Compact standing)'));
assert.ok(abandonButton, 'accepted ace card renders the priced abandon action');

// 2. The way out succeeds through the Agent API, cost applied and documented.
const rep0 = freeholdStanding();
const res = act('abandonJob', { id: 'bounty-ace' });
assert.equal(res.ok, true, JSON.stringify(res));
assert.match(res.notice, /Bounty abandoned/, JSON.stringify(res));
assert.match(res.notice, /-1 Freehold Compact standing/, JSON.stringify(res));
assert.equal(freeholdStanding(), rep0 - 1, 'exactly -1 posting-faction standing');
assert.equal(ace.state, 'offered', 'the same posting returns to the board');
assert.equal(ace.progress, 0);
assert.ok(ctx.world.jobs.includes(ace), 'the unique ace row persists (never spliced)');
assert.equal(abandonedEvents('bounty-ace'), 1, 'one jobState abandoned recorded');
assert.ok(rw.observe().jobs.offers.some((j) => j && j.id === 'bounty-ace'),
  'the agent sees the re-offered posting');
assert.equal(rw.observe().jobs.active.some((j) => j && j.id === 'bounty-ace'), false);

// No double charge: the row is no longer accepted, a second abandon refuses.
assert.equal(act('abandonJob', { id: 'bounty-ace' }).ok, false);
assert.equal(freeholdStanding(), rep0 - 1);
assert.equal(abandonedEvents('bounty-ace'), 1);

// 1 (cont). The trap is gone: the same bounty can be accepted again.
assert.equal(act('acceptJob', { id: 'bounty-ace' }).ok, true, 're-accept succeeds');
assert.equal(ace.state, 'accepted');
assert.equal(act('abandonJob', { id: 'bounty-ace' }).ok, true, 'second forfeit also escapes');
assert.equal(ace.state, 'offered');
assert.equal(freeholdStanding(), rep0 - 2, 'each forfeit costs its standing');
assert.equal(abandonedEvents('bounty-ace'), 2);

// 2 (cont). A pirate bounty row forfeits on its home board the same way.
// The row is backed by a living record the way a real posting is, so the
// board sync keeps the re-listed row instead of pulling an orphaned offer.
const quarry = { id: 'rec-358', role: 'pirate', name: 'Rust Marlow', system: 'freehold', state: 'enroute', bounty: 50 };
ctx.world.records.push(quarry);
const pirate = {
  id: 'bounty-pirate-rust-marlow', kind: 'bounty', target: 'Rust Marlow',
  system: 'freehold', title: 'Bounty: Rust Marlow', detail: 'Fixture row.',
  reward: 50, state: 'accepted', progress: 0, need: 1,
};
ctx.world.jobs.push(pirate);
const pirateRes = act('abandonJob', { id: pirate.id });
assert.equal(pirateRes.ok, true, JSON.stringify(pirateRes));
assert.equal(pirate.state, 'offered', 'the pirate posting re-lists');
assert.ok(ctx.world.jobs.includes(pirate));
assert.equal(abandonedEvents(pirate.id), 1);
assert.ok(rw.observe().jobs.offers.some((j) => j && j.id === pirate.id),
  'the re-listed home-board row is visible again');

// 4. Guards. A bounty-shaped row with no valid posting faction refuses and
// names the blocker; the world does not move.
const rogue = { id: 'bounty-rogue-358', kind: 'bounty', state: 'accepted' };
ctx.world.jobs.push(rogue);
const refused = act('abandonJob', { id: rogue.id });
assert.equal(refused.ok, false, JSON.stringify(refused));
assert.equal(refused.token, 'unavailable');
assert.match(refused.error, /posting faction/, JSON.stringify(refused));

// Non-bounty obligation rows keep the #207 refusal copy.
const ferry = { id: 'excluded-ferry-358', kind: 'ferry', state: 'accepted', originSystem: 'freehold' };
ctx.world.jobs.push(ferry);
const ferryRes = act('abandonJob', { id: ferry.id });
assert.equal(ferryRes.ok, false);
assert.equal(ferryRes.token, 'unavailable');
assert.match(ferryRes.error, /special cargo, recovery, or progression obligations/, JSON.stringify(ferryRes));

// Invalid input fails closed without mutation.
const before = JSON.stringify({ jobs: ctx.world.jobs, reputation: ctx.world.reputation });
assert.equal(act('abandonJob', {}).ok, false);
assert.equal(act('abandonJob', { id: 'missing-row' }).ok, false);
const offered = ctx.world.jobs.find((j) => j && j.kind === 'patrol' && j.state === 'offered');
if (offered) assert.equal(act('abandonJob', { id: offered.id }).ok, false);
assert.equal(JSON.stringify({ jobs: ctx.world.jobs, reputation: ctx.world.reputation }), before,
  'guards left the world untouched');

// Save round trip: the re-offered rows are JSON-safe and survive restore.
const snap = JSON.parse(JSON.stringify(saveSnapshot(ctx)));
restore(ctx, snap);
assert.equal(ctx.world.jobs.some((j) => j && j.id === 'bounty-ace' && j.state === 'offered'), true,
  'the re-offered ace contract survives save/load');
assert.equal(ctx.world.jobs.some((j) => j && j.id === pirate.id && j.state === 'offered'), true,
  'the re-listed pirate posting survives save/load');
assert.equal(freeholdStanding(), rep0 - 3, 'two ace forfeits plus the pirate forfeit');

console.log('PASS #358 bounty forfeit: accept -> abandon via Agent API, standing cost, posting re-offered; guards refuse with named blockers');
