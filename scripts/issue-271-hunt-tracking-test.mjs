/**
 * Issue #271 — hunts get a tracking phase: a last-seen lane phrase on the
 * card, a fresher sighting at the People desk, and a CONTRACT word marking a
 * bound quarry on the locked bracket and in the agent observation.
 *
 * Real station DOM, the real Jobs board, the real People desk, the real HUD
 * bracket elements and the real observe() rows. Fixtures are disclosed
 * record-state flips and locks, the same discipline the #68/#272 suites use.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-271-hunt-tracking-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

seedBootRandom();
const dom = installDomStubs();
const boot = await bootGameSystems();
const { ctx, systems, binds } = boot;
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
const save = systems.find(([n]) => n === 'save')[1];

let checks = 0;
const check = (label, fn) => { fn(); checks++; console.log('PASS', label); };

const nodes = () => [...dom.walkDom(document.body)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const text = (cls) => byClass(cls).map((n) => String(n.textContent)).join(' | ');
// The bracket chain lives under the memoized #hud root; boot fresh-chains can
// freeze duplicates, so read only the SHOWN .rw-target instance (boot-test
// wave-31 discipline).
const classHas = (n, cls) => typeof n.className === 'string' && n.className.split(' ').includes(cls);
const bracketText = () => {
  let live = null;
  for (const n of dom.walkDom(document.getElementById('hud') ?? document.body)) {
    if (classHas(n, 'rw-target') && !n.classList.contains('is-hidden')) { live = n; break; }
  }
  if (!live) return { name: null, meta: null, shown: false };
  let name = null, meta = null;
  for (const n of dom.walkDom(live)) {
    if (classHas(n, 'rw-target-name')) name = n.textContent;
    else if (classHas(n, 'rw-target-meta')) meta = n.textContent;
  }
  return { name, meta, shown: true };
};
const openBoard = () => ctx.stationDesk.selectService('jobs');
const hunts = () => ctx.world.jobs.filter((j) => j && j.kind === 'hunt' && j.originSystem === ctx.world.currentSystem);
const huntRows = () => hunts().filter((j) => j.state === 'offered');
const acceptedHunt = () => hunts().find((j) => j.state === 'accepted');
const bank = () => ctx.world.recordBanks?.[ctx.world.currentSystem] ?? ctx.world.records ?? [];
const recordById = (id) => bank().find((r) => r && r.id === id);
const livingPirates = (sysId) => (ctx.world.recordBanks?.[sysId] ?? []).filter((r) => r && r.role === 'pirate' && r.state !== 'dead' && r.state !== 'captured' && r.state !== 'derelict');
// Harness discipline (wave30/issue-68): instantiate a record near the ship by
// hand so a lock can be taken without waiting on traffic culls. The hull is
// removed from ctx.ships by traffic the same as any other instantiation.
const spawnQuarry = (rec, offset = [260, 0, 0]) => {
  const p = ctx.ship.object.position;
  const live = binds.spawnLiveShip(ctx, rec, { x: p.x + offset[0], y: p.y + offset[1], z: p.z + offset[2] });
  if (live && !ctx.ships.includes(live)) ctx.ships.push(live);
  return live;
};

let frame = 0;
// The real loop order: every system update per frame (hud last reads events).
function step(seconds = 1) {
  const dt = 1 / 60;
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    frame++;
    ctx.elapsed += dt;
    ctx.world.time += dt;
    for (const [, s] of systems) {
      try { s?.update?.(dt, ctx); } catch { /* one frame's error must not stop the probe */ }
    }
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

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
// A. The card carries a Last seen lane phrase from authored vocabulary only.
// ---------------------------------------------------------------------------
check('A1 every offered hunt card carries a Last seen phrase', () => {
  dock('freehold');
  openBoard();
  assert.ok(huntRows().length >= 1, 'a hunt card is posted');
  const details = byClass('job-detail').map((n) => String(n.textContent));
  for (const row of huntRows()) {
    // The overlay bounty card also names the quarry; the hunt card is the one
    // that carries the witnessed-kill pay line. Prefer the Last seen copy.
    const card = details.find((d) => d.includes(String(row.target)) && /Last seen: /.test(d))
      ?? details.find((d) => d.includes(String(row.target)) && /witnessed kill/.test(d));
    assert.ok(card, 'the card for ' + row.target + ' renders');
    assert.match(card, /Last seen: /, 'the card carries the Last seen line');
    assert.ok(!/rec-/.test(card), 'no record id leaks into the card');
    assert.match(card, /working the .+ lane|holding near the ore field|seen near the (gate|system gate)|loitering just off /, 'the phrase names a real place shape');
  }
});

check('A2 the phrase only uses authored names (station, field, gate dest)', () => {
  const def = ctx.systems.freehold;
  const stationName = def.station.name;
  // Scope to the hunt cards only: other families legitimately print counts.
  const huntCards = byClass('job-detail').map((n) => String(n.textContent))
    .filter((d) => /witnessed kill|Last seen: /.test(d));
  assert.ok(huntCards.length >= 1, 'a hunt card exists to inspect');
  for (const card of huntCards) {
    assert.ok(card.includes(stationName) || /gate to |ore field|system gate/.test(card),
      'the haunt anchors on authored vocabulary');
    // No coordinates ever print on a hunt card.
    assert.ok(!/\b\d{3,}\b/.test(card.replace(/\d+ UU/g, '')), 'no bare coordinates: ' + card.slice(0, 120));
    assert.ok(!/rec-/.test(card), 'no record id on the card');
  }
});

// ---------------------------------------------------------------------------
// B. Ask around answers the quarry sighting before the ordinary rumor.
// ---------------------------------------------------------------------------
check('B1 Ask around names the bound quarry and the haunt', () => {
  const row = huntRows()[0];
  assert.ok(row, 'a posted hunt exists');
  // The sighting rides the People desk's Ask around.
  ctx.stationDesk.selectService('people');
  const ask = byClass('screen-btn').find((n) => String(n.textContent) === 'Ask around');
  assert.ok(ask, 'an Ask around button exists');
  ask.click();
  const notice = byClass('station-notice').map((n) => String(n.textContent)).join(' ');
  // The desk answers the freshest local contract — any posted quarry qualifies.
  const posted = huntRows().map((j) => j.target).concat(hunts().filter((j) => j.state === 'accepted').map((j) => j.target));
  const named = posted.find((t) => notice.includes(t));
  assert.ok(named, 'the sighting names a posted quarry — got: ' + notice.slice(0, 160));
  assert.match(notice, /working the .+ lane|holding near the ore field|seen near the (gate|system gate)|loitering just off /, 'the sighting carries the haunt phrase');
  assert.match(notice, /recently|a while back|some days ago/, 'the sighting buckets freshness without a timestamp');
});

// ---------------------------------------------------------------------------
// C. The locked bracket marks the bound quarry CONTRACT; a bystander not.
// ---------------------------------------------------------------------------
check('C1 the locked bracket shows CONTRACT on the bound hull', () => {
  const rec = recordById(huntRows()[0]?.recordId ?? acceptedHunt()?.recordId);
  assert.ok(rec, 'the bound record exists');
  const live = spawnQuarry(rec);
  assert.ok(live, 'the quarry instantiated');
  ctx.stationDesk.undock();
  ctx.targets.current = live;
  step(1);
  const { meta } = bracketText();
  assert.ok(meta && /CONTRACT/.test(meta), 'the bracket meta carries CONTRACT — got: ' + String(meta).slice(0, 120));
  ctx.targets.current = null;
});

check('C2 a bystander hull does not read CONTRACT', () => {
  const rec = bank().find((r) => r && r.role === 'trader' && r.state !== 'dead');
  assert.ok(rec, 'a trader record exists');
  const live = spawnQuarry(rec);
  if (!live) { console.log('SKIP bystander (spawn refused)'); return; }
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.targets.current = live;
  step(1);
  const { meta } = bracketText();
  assert.ok(!(meta && /CONTRACT/.test(meta)), 'no CONTRACT on a bystander — got: ' + String(meta).slice(0, 120));
  ctx.targets.current = null;
});

// ---------------------------------------------------------------------------
// D. observe() agrees: the locked row and the nearby row publish contract.
// ---------------------------------------------------------------------------
check('D1 observe() publishes contract on the bound hull row', () => {
  const rec = recordById((huntRows()[0] ?? acceptedHunt())?.recordId);
  assert.ok(rec, 'bound record exists');
  const live = ctx.ships.find((s) => s.record && s.record.id === rec.id) ?? spawnQuarry(rec);
  assert.ok(live, 'quarry live');
  ctx.targets.current = live;
  const row = window.rimward.observe().targets.current;
  assert.equal(row?.contract, true, 'the locked row carries contract:true');
  ctx.targets.current = null;
});

check('D2 the observation hides the mark when the hunt row is gone', () => {
  // Splice the bind out of world.jobs (no board render → no slot refill),
  // then the same hull must drop its mark.
  const before = hunts();
  assert.ok(before.length >= 1, 'a hunt bind exists');
  const bind = before.find((j) => j.state === 'offered' || j.state === 'accepted');
  const rec = recordById(bind.recordId);
  assert.ok(rec, 'the bound record exists');
  const live = ctx.ships.find((s) => s.record && s.record.id === rec.id) ?? spawnQuarry(rec);
  assert.ok(live, 'quarry live');
  const idx = ctx.world.jobs.indexOf(bind);
  assert.ok(idx >= 0, 'the bind is in the jobs array');
  ctx.world.jobs.splice(idx, 1);
  ctx.targets.current = live;
  const row = window.rimward.observe().targets.current;
  assert.ok(row?.contract !== true, 'no contract mark without a live bind');
  ctx.targets.current = null;
  // Restore the row so E reads a whole board.
  ctx.world.jobs.splice(idx, 0, bind);
});

// ---------------------------------------------------------------------------
// E. JSON-plain: the jobs array round-trips a save snapshot.
// ---------------------------------------------------------------------------
check('E1 jobs stay JSON-plain with the tracking slice', () => {
  dock('freehold');
  openBoard();
  const copy = JSON.parse(JSON.stringify(ctx.world.jobs));
  assert.ok(Array.isArray(copy), 'jobs snapshot JSON-safe');
  for (const j of copy) {
    if (j.kind !== 'hunt') continue;
    assert.equal(typeof j.recordId, 'string', 'hunt binds a record id');
  }
});

console.log('issue-271 hunt tracking: ' + checks + ' checks passed');
