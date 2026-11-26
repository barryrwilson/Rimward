/**
 * Issue #367 — the faction-war career had no renewable income spine. War
 * quarry draws ONLY from the two war-linked systems' featured patrol banks
 * (station.js pickWarQuarry), a war kill settles the record 'dead' forever,
 * and nothing ever added new patrol records — so after a few strikes both
 * faction boards went to war:0 permanently (87 wall-minutes of war:0 across
 * 109 board snapshots in the #332 playtest).
 *
 * The fix mirrors the #272 reaver replenish: world.js tickWarReplenish tops
 * up an EXISTING war-linked bank whose living war-quarry patrols fell below
 * the authored cast.patrols, one hull per pick on a band-scaled cadence,
 * fresh generated #270 names (unique galaxy-wide, never a Named Gun), never
 * generating an unvisited bank and never touching a dead record. station.js
 * replaceWarJob asks that replenish for one bounded pick when its slot
 * refill finds the banks dry, so a completed strike refills its card inside
 * the same dock cycle.
 *
 *  A. Baseline: both faction boards post war cards from the authored pool.
 *  B. Kill/capture every eligible patrol in both war banks (disclosed
 *     record-state flips — a kill is a combat result, not a board rule):
 *     both boards go to war:0.
 *  C. The world replenishes: fresh patrol records drift into the visited
 *     war banks — role patrol, home faction, unique names, no Named Gun,
 *     cast cap respected, unvisited banks never generated, and every dead
 *     record stays dead (replenish only ADDS).
 *  D. Both faction boards refill (~1 card per station per cycle).
 *  E. A completed kill refills its slot: accept a card, witness the kill,
 *     and replaceWarJob binds a fresh replenished quarry in the same slot.
 *  F. Records and jobs stay JSON-plain.
 *
 * Real station DOM, the real Jobs board, the real sync and delivery tick.
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-367-war-supply-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS, NAMED_GUNS, ACES } from '../src/game/state.js';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
const save = systems.find(([n]) => n === 'save')[1];

let checks = 0;
const check = async (label, fn) => { await fn(); checks++; console.log('PASS', label); };

const nodes = () => [...dom.walkDom(document.body)];
const nodesIn = (root) => [...dom.walkDom(root)];
const byClass = (cls) => nodes().filter((n) => String(n.className).split(' ').includes(cls));
const openBoard = () => ctx.stationDesk.selectService('jobs');
const offers = () => window.rimward.observe().jobs.offers;
const warOffers = () => offers().filter((o) => o.kind === 'war');
const warRows = (origin) => ctx.world.jobs.filter((j) => j && j.kind === 'war'
  && j.originSystem === origin && j.state === 'offered');

// The freehold <-> veridian war pair (each dock's first gate to a different
// faction's dock — the same walk station.js warDestId runs per job).
const WAR_ORIGIN = 'freehold';
const WAR_DEST = 'veridian';

// Mirror of station.js isEligibleWarQuarry for the pair above: what a war
// board can actually post right now.
function isEligibleWarQuarry(rec, origin, dest, boundIds) {
  if (!rec || rec.role !== 'patrol') return false;
  if (rec.classKey === 'ace' || rec.role === 'ace') return false;
  const targetFac = SYSTEMS[dest].faction;
  if (rec.faction !== targetFac) return false;
  if (rec.system !== origin && rec.system !== dest) return false;
  if (rec.state === 'dead' || rec.state === 'captured') return false;
  if (typeof rec.id !== 'string' || !/^rec-(0|[1-9][0-9]*)$/.test(rec.id)) return false;
  if (typeof rec.name !== 'string' || !rec.name.trim()) return false;
  if (rec.name === ACES.hunter.name || rec.name === ACES.illyx.name) return false;
  if ((NAMED_GUNS.aspirants?.names ?? []).includes(rec.name)) return false;
  if (boundIds && boundIds.has(rec.id)) return false;
  return true;
}

const bankOf = (sysId) => ctx.world.recordBanks?.[sysId] ?? [];
const eligibleForPair = (origin, dest) => bankOf(origin).concat(bankOf(dest))
  .filter((r) => isEligibleWarQuarry(r, origin, dest, null));
const allEligibleWarQuarries = () => [
  ...eligibleForPair(WAR_ORIGIN, WAR_DEST),
  ...eligibleForPair(WAR_DEST, WAR_ORIGIN),
];
const livingWarQuarries = (sysId) => bankOf(sysId).filter((r) => r && r.role === 'patrol'
  && r.classKey !== 'ace' && r.faction === SYSTEMS[sysId].faction
  && r.state !== 'dead' && r.state !== 'captured'
  && /^rec-(0|[1-9][0-9]*)$/.test(String(r.id)));

function step(seconds = 1) {
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    ctx.world.time += 1 / 60;
    ctx.elapsed += 1 / 60;
    station.update(1 / 60);
    world.update(1 / 60);
    save.update(1 / 60);
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

// Load the war dest bank first, then the origin bank (the war staging order).
dock(WAR_DEST);
dock(WAR_ORIGIN);

const deadStateAt = new Map(); // record id -> state at kill time
const bankLengthAt = new Map(); // sysId -> bank length before replenish
const preReplenishBankIds = new Set(); // banks that exist before any replenish pick
const knownRecordIds = new Set();
for (const sysId of [WAR_ORIGIN, WAR_DEST]) {
  bankLengthAt.set(sysId, bankOf(sysId).length);
  preReplenishBankIds.add(sysId);
  for (const r of bankOf(sysId)) knownRecordIds.add(r.id);
}
const maxInitialRecordNum = Math.max(...[...knownRecordIds]
  .filter((id) => /^rec-(\d+)$/.test(id)).map((id) => Number(id.slice(4))));

// ---------------------------------------------------------------------------
// A. Baseline: the authored pool posts war cards on the origin board.
// ---------------------------------------------------------------------------
await check('A1 the origin board posts war cards from the authored patrol pool', () => {
  openBoard();
  step(1 / 60);
  assert.ok(warOffers().length >= 1 && warOffers().length <= 2,
    '1-2 war cards: ' + warOffers().length);
  for (const row of warRows(WAR_ORIGIN)) {
    const rec = bankOf(WAR_DEST).find((r) => r && r.id === row.recordId)
      ?? bankOf(WAR_ORIGIN).find((r) => r && r.id === row.recordId);
    assert.ok(rec, 'the card binds a real record');
    assert.equal(rec.faction, SYSTEMS[WAR_DEST].faction, 'the quarry flies the target faction flag');
  }
});

// ---------------------------------------------------------------------------
// B. Kill/capture the whole pool: both boards go to war:0.
// ---------------------------------------------------------------------------
await check('B1 disclosed kills empty the war quarry pool and both boards show war:0', () => {
  const quarry = allEligibleWarQuarries();
  assert.ok(quarry.length >= 1, 'an eligible pool exists: ' + quarry.length);
  quarry.forEach((rec, i) => {
    deadStateAt.set(rec.id, i === 0 ? 'captured' : 'dead'); // one capture covers the captured gate
    rec.state = deadStateAt.get(rec.id);
  });
  openBoard();
  step(1 / 60);
  assert.equal(warOffers().length, 0, 'origin board is war:0 without a quarry');
  dock(WAR_DEST);
  openBoard();
  step(1 / 60);
  assert.equal(warOffers().length, 0, 'dest board is war:0 without a quarry');
});

// ---------------------------------------------------------------------------
// C. The world replenishes the visited war banks.
// ---------------------------------------------------------------------------
await check('C1 the replenish cadence drifts fresh patrols into the visited banks', () => {
  dock(WAR_ORIGIN);
  const before = [WAR_ORIGIN, WAR_DEST].map((id) => bankOf(id).length);
  // First pick at WAR firstDelay (120s), then interval 180s x band jitter.
  // Step in slices until a fresh record lands (the real update loop).
  let fresh = null;
  for (let i = 0; i < 12 && !fresh; i++) {
    step(60);
    fresh = [WAR_ORIGIN, WAR_DEST]
      .flatMap((id) => bankOf(id))
      .find((r) => /^rec-(\d+)$/.test(String(r.id)) && Number(r.id.slice(4)) > maxInitialRecordNum);
  }
  assert.ok(fresh, 'a replenished record joined a visited war bank');
  const after = [WAR_ORIGIN, WAR_DEST].map((id) => bankOf(id).length);
  assert.ok(after.some((n, i) => n > before[i]), 'the visited bank grew: ' + before + ' -> ' + after);
  assert.equal(fresh.role, 'patrol', 'the fresh hull is a patrol');
  assert.equal(fresh.classKey, 'heavy', 'the authored patrol shape');
  assert.equal(fresh.faction, SYSTEMS[bankOf(WAR_ORIGIN).includes(fresh) ? WAR_ORIGIN : WAR_DEST].faction,
    'the patrol flies its home flag (issue #125)');
  assert.ok(fresh.state !== 'dead' && fresh.state !== 'captured', 'the fresh hull flies');
  assert.ok(Array.isArray(fresh.route) && fresh.route.length === 3, 'station hold -> gate -> planet route');
  assert.ok(Array.isArray(fresh.legLens), 'leg lengths precomputed');
});

await check('C2 every replenished name is unique galaxy-wide and never a Named Gun', () => {
  const namedGuns = new Set([ACES.hunter.name, ACES.illyx.name, ...(NAMED_GUNS.aspirants?.names ?? [])]);
  const seen = new Map();
  for (const [sysId, bank] of Object.entries(ctx.world.recordBanks ?? {})) {
    for (const r of bank ?? []) {
      if (!r || typeof r.name !== 'string') continue;
      const prior = seen.get(r.name);
      assert.ok(prior === undefined, 'name collision across banks: ' + r.name + ' (' + prior + ' vs ' + sysId + ')');
      seen.set(r.name, sysId);
    }
  }
  // The Named-Gun guard governs the REPLENISH generator: the authored cast
  // keeps its own names (the Freehold ace is authored lore), but no fresh
  // replenished hull may take one.
  for (const sysId of [WAR_ORIGIN, WAR_DEST]) {
    for (const r of bankOf(sysId)) {
      if (!r || !/^rec-(\d+)$/.test(String(r.id)) || Number(r.id.slice(4)) <= maxInitialRecordNum) continue;
      assert.ok(!namedGuns.has(r.name), 'no Named Gun name on replenished ' + r.name);
    }
  }
});

await check('C3 the replenished hull is a real eligible war quarry for the pair', () => {
  const freshVeridian = bankOf(WAR_DEST).find((r) => /^rec-(\d+)$/.test(String(r.id))
    && Number(r.id.slice(4)) > maxInitialRecordNum);
  const freshFreehold = bankOf(WAR_ORIGIN).find((r) => /^rec-(\d+)$/.test(String(r.id))
    && Number(r.id.slice(4)) > maxInitialRecordNum);
  assert.ok(freshVeridian || freshFreehold, 'a replenished quarry exists');
  if (freshVeridian) assert.equal(isEligibleWarQuarry(freshVeridian, WAR_ORIGIN, WAR_DEST, null), true,
    'a fresh veridian patrol is eligible quarry for the freehold board');
  if (freshFreehold) assert.equal(isEligibleWarQuarry(freshFreehold, WAR_DEST, WAR_ORIGIN, null), true,
    'a fresh freehold patrol is eligible quarry for the veridian board');
});

await check('C4 the authored patrol cast caps every bank (banks stay bounded)', () => {
  // Kill everything again (disclosed) and let several picks land: the cap
  // must hold no matter how many picks pass.
  for (const rec of allEligibleWarQuarries()) { deadStateAt.set(rec.id, 'dead'); rec.state = 'dead'; }
  for (const rec of [...livingWarQuarries(WAR_ORIGIN), ...livingWarQuarries(WAR_DEST)]) {
    deadStateAt.set(rec.id, 'dead'); rec.state = 'dead';
  }
  step(720); // several cadence windows
  for (const sysId of [WAR_ORIGIN, WAR_DEST]) {
    const want = SYSTEMS[sysId].cast.patrols;
    const living = livingWarQuarries(sysId).length;
    assert.ok(living <= want, sysId + ' living war quarries within cast: ' + living + '/' + want);
  }
  for (const sysId of [WAR_ORIGIN, WAR_DEST]) {
    assert.ok(bankOf(sysId).length <= bankLengthAt.get(sysId) + 8,
      sysId + ' bank growth bounded: ' + bankLengthAt.get(sysId) + ' -> ' + bankOf(sysId).length);
  }
});

await check('C5 replenish never generates a bank and never resurrects the dead', () => {
  // In every bank that existed BEFORE replenish began, any fresh non-trader
  // record can only be a replenish pick: migration moves traders only, and
  // pirates/ace/miners never migrate. So every fresh patrol in the visited
  // war banks is replenish output, and it only ever lands where a bank
  // already existed.
  for (const [sysId, bank] of Object.entries(ctx.world.recordBanks ?? {})) {
    if (!preReplenishBankIds.has(sysId)) continue;
    for (const r of bank ?? []) {
      if (!r || !/^rec-(\d+)$/.test(String(r.id))) continue;
      if (Number(r.id.slice(4)) <= maxInitialRecordNum) continue;
      if (r.role === 'trader') continue; // migration arrival, not replenish
      assert.equal(r.role, 'patrol', 'fresh non-trader in an existing bank is a replenish patrol: ' + r.role);
      assert.equal(r.faction, SYSTEMS[sysId].faction, 'the replenish patrol flies its home flag');
    }
  }
  // Banks with no inbound migration lane from the visited set stay
  // ungenerated: the replenish never creates one.
  for (const sysId of ['hush', 'verge', 'unknowables']) {
    assert.equal(ctx.world.recordBanks?.[sysId] ?? null, null, sysId + ' bank was never generated');
  }
  for (const [id, state] of deadStateAt) {
    const rec = bankOf(WAR_ORIGIN).find((r) => r.id === id)
      ?? bankOf(WAR_DEST).find((r) => r.id === id);
    assert.ok(rec, 'killed record still exists: ' + id);
    assert.equal(rec.state, state, 'a kill stays a kill: ' + id + ' stays ' + state);
  }
});

// ---------------------------------------------------------------------------
// D. Both faction boards refill (~1 card per faction station per cycle).
// ---------------------------------------------------------------------------
await check('D1 the origin board posts war cards again from the replenished pool', () => {
  dock(WAR_ORIGIN);
  openBoard();
  step(1 / 60);
  assert.ok(warOffers().length >= 1, 'a war card returned: ' + warOffers().length);
  const row = warRows(WAR_ORIGIN)[0];
  const rec = bankOf(WAR_DEST).find((r) => r && r.id === row.recordId)
    ?? bankOf(WAR_ORIGIN).find((r) => r && r.id === row.recordId);
  assert.ok(rec, 'the card binds a record');
  assert.ok(rec.state !== 'dead' && rec.state !== 'captured', 'the quarry flies');
  assert.ok(!deadStateAt.has(rec.id), 'the bound quarry is fresh supply, not a resurrected kill');
});

await check('D2 the dest board refills from the replenished origin-faction pool', () => {
  dock(WAR_DEST);
  openBoard();
  step(1 / 60);
  assert.ok(warOffers().length >= 1, 'a war card returned at the dest dock: ' + warOffers().length);
});

// ---------------------------------------------------------------------------
// E. A completed kill refills its slot via replaceWarJob + replenish.
// ---------------------------------------------------------------------------
const cardForTitle = (fragment) => byClass('job-card').find((card) =>
  nodesIn(card).some((n) => String(n.className).split(' ').includes('job-title')
    && String(n.textContent).includes(fragment)));

await check('E1 accepting a war card and completing the kill refills the slot', async () => {
  dock(WAR_ORIGIN);
  openBoard();
  step(1 / 60);
  assert.ok(warOffers().length >= 1, 'a war card is posted');
  const card = cardForTitle('Strike ');
  assert.ok(card, 'a war card renders');
  const acceptBtn = nodesIn(card).find((n) => String(n.tagName) === 'BUTTON' && /^Accept \(/.test(String(n.textContent)));
  assert.ok(acceptBtn, 'the card carries an Accept button');
  acceptBtn.click();
  const accepted = ctx.world.jobs.find((j) => j && j.kind === 'war' && j.originSystem === WAR_ORIGIN
    && j.state === 'accepted');
  assert.ok(accepted && accepted.recordId, 'the war row accepted with a bound record');

  // Dry the banks for this board: every OTHER eligible quarry dies (disclosed
  // flips). The slot refill must then come from the #367 replenish.
  for (const rec of eligibleForPair(WAR_ORIGIN, WAR_DEST)) {
    if (rec.id === accepted.recordId) continue;
    deadStateAt.set(rec.id, 'dead');
    rec.state = 'dead';
  }
  for (const rec of livingWarQuarries(WAR_DEST)) {
    if (rec.id === accepted.recordId) continue;
    deadStateAt.set(rec.id, 'dead');
    rec.state = 'dead';
  }

  // The real finishing blow: npcHit marks the player-caused hit, the
  // destroyed state + npcDestroyed emit (combat.js witness shape), and the
  // delivery tick settles the strike through warPayComplete -> replaceWarJob.
  const boundRec = bankOf(WAR_DEST).find((r) => r && r.id === accepted.recordId)
    ?? bankOf(WAR_ORIGIN).find((r) => r && r.id === accepted.recordId);
  assert.ok(boundRec, 'the bound record resolves');
  if (ctx.flags.docked) ctx.stationDesk.undock();
  await binds.primeShipAsset(boundRec.faction, boundRec.classKey, boundRec.role);
  const p = ctx.ship.object.position;
  const live = binds.spawnLiveShip(ctx, boundRec, { x: p.x + 140, y: p.y, z: p.z });
  assert.ok(live, 'the bound patrol instantiated');
  if (!ctx.ships.includes(live)) ctx.ships.push(live);
  ctx.emit('npcHit', { ship: live, damage: live.state.hull });
  live.state.destroyed = true;
  ctx.emit('npcDestroyed', { ship: live });
  step(2 / 60);

  let settled = false;
  for (let i = 0; i < 120 && !settled; i++) {
    step(0.5);
    const row = ctx.world.jobs.find((j) => j && j.id === accepted.id);
    settled = !row || (row.state !== 'accepted' && row.state !== 'offered');
  }
  const payRow = ctx.world.jobs.find((j) => j && j.id === accepted.id);
  assert.ok(!payRow || payRow.state !== 'accepted', 'the accepted row settled');
  assert.ok(ctx.world.incidents.some((i) => i && i.kind === 'destroyed' && i.name === boundRec.name
    && i.causer === 'player'), 'the kill is witnessed as player-caused');
  assert.equal(boundRec.state, 'dead', 'the killed record settles dead');
  deadStateAt.set(boundRec.id, 'dead');

  // The slot refills: a new offered war row for the same origin, binding a
  // LIVING quarry (the replenish pick), not any dead record.
  const refill = warRows(WAR_ORIGIN).find((j) => j.slot === accepted.slot);
  assert.ok(refill, 'a replacement war card fills the slot: '
    + JSON.stringify(ctx.world.jobs.filter((j) => j && j.kind === 'war')));
  const refillRec = bankOf(WAR_DEST).find((r) => r && r.id === refill.recordId)
    ?? bankOf(WAR_ORIGIN).find((r) => r && r.id === refill.recordId);
  assert.ok(refillRec, 'the replacement binds a real record');
  assert.ok(refillRec.state !== 'dead' && refillRec.state !== 'captured', 'the replacement quarry flies');
  assert.ok(!deadStateAt.has(refillRec.id), 'the replacement quarry is fresh supply');
  assert.equal(isEligibleWarQuarry(refillRec, WAR_ORIGIN, WAR_DEST,
    new Set(ctx.world.jobs.filter((j) => j && j.kind === 'war' && j.state === 'accepted').map((j) => j.recordId))),
    true, 'the replacement is a live eligible quarry');
});

// ---------------------------------------------------------------------------
// F. Records and jobs stay JSON-plain.
// ---------------------------------------------------------------------------
await check('F1 banks and jobs snapshot JSON-safe', () => {
  const banksCopy = JSON.parse(JSON.stringify(ctx.world.recordBanks));
  assert.ok(Object.keys(banksCopy).length >= 2, 'record banks snapshot JSON-safe');
  const jobsCopy = JSON.parse(JSON.stringify(ctx.world.jobs));
  assert.ok(Array.isArray(jobsCopy), 'jobs snapshot JSON-safe');
  const fresh = bankOf(WAR_DEST).find((r) => /^rec-(\d+)$/.test(String(r.id))
    && Number(r.id.slice(4)) > maxInitialRecordNum);
  if (fresh) {
    const copy = JSON.parse(JSON.stringify(fresh));
    assert.equal(copy.name, fresh.name, 'the replenished record round-trips');
  }
});

console.log('issue-367 war supply: ' + checks + ' checks passed');
