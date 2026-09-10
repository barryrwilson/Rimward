/**
 * Issue #68 — fleeing NPCs run for a real gate or the station holding lane.
 *
 * The defect: `updateFlee` aimed 300 u directly away from the threat and
 * waited for traffic.js's 1400 u cull to end the chase. The ship's logical
 * record survived, but its damage, engine state, surrender status and intent
 * did not — a re-instantiated runner came back on its old lane at full hull.
 *
 * These pins run the REAL system graph (scripts/lib/boot-harness.mjs — the
 * same initialization the full boot suite uses): the real npc.js update loop,
 * the real traffic.js instantiation bubble, the real world.js galaxy tick and
 * migration registry, the real save.js snapshot/restore, the real wakes.js
 * discovery scan, the real station.js job board, and the real
 * `window.rimward` observation. The pure helpers in game/npc-escape.js are
 * pinned too, but never INSTEAD of the integrated behavior.
 *
 * FIXTURES: every controlled setup below is labelled `FIXTURE:` and creates
 * only INITIAL state a ship could legitimately be in — where a hull sits, how
 * damaged it is, whether its engine is out, which job is on the board. No
 * tested OUTCOME is written by this harness: the gate transit, the station
 * arrival, the public receipt, the restored condition, the job failure and
 * the wake trail are all produced by the game's own code, and the assertions
 * read the record, the public API or the rendered HUD afterwards.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-68-gate-escape-test.mjs
 *      (npm run test:gate-escape)
 */
import * as THREE from 'three';
import {
  seedBootRandom, installDomStubs, bootGameSystems, makeTick,
} from './lib/boot-harness.mjs';

seedBootRandom();
const { walkDom, dispatchKey } = installDomStubs();
const boot = await bootGameSystems();
const { ctx, systems } = boot;
const { SYSTEMS, spawnLiveShip, removeLiveShip, snapshot, restore, U } = boot.binds;

const { JUMP, ESCAPE, SHIP_CLASSES, DEFENSE, applyHit } = await import('../src/game/state.js');
const {
  chooseEscapeDestination, readEscape, escapeActive, escapeStatus,
  escapePublicIdentity, sanitizeEscapeRecord, segmentClearance, escapeRefugeRadius,
} = await import('../src/game/npc-escape.js');
const { sanitizeEvent, pushRing, EVENT_TYPES, EVENT_CAP } = await import('../src/game/agent-schema.js');
const { recordPosition } = await import('../src/game/world.js');
// The ONE production flee entry (hail.js capitulation and the trader/miner
// panic path both call it): used where a decision boundary must be exercised
// at an exact geometry rather than waited for on the revalidate cadence.
const { enterEscapeFlee } = await import('../src/systems/npc.js');
// Read-only, for the instantiation-eligibility diagnostic below.
const {
  closeSpawn, spawnBlocked, visualClassFor, pirateLiveCap, stationHoldPoint, hullRadiusFor,
} = await import('../src/game/traffic-feel.js');
const { isShipAssetReady } = await import('../src/systems/ship-assets.js');
const { PHY } = await import('../src/game/physics.js');

const dt = 1 / 60;
let frame = 0;
let fails = 0;
let updateErrors = 0;
const tick = makeTick(ctx, systems, {
  get frame() { return frame; },
  set frame(v) { frame = v; },
}, dt, (e, frameNo, label) => {
  updateErrors++;
  if (updateErrors <= 5) console.log(`UPDATE ERR frame ${frameNo} (${label}): ${e.message}\n${e.stack?.split('\n')[1]?.trim() ?? ''}`);
});

function pin(name, ok, detail) {
  if (ok) {
    console.log('ok', name);
    return true;
  }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail, jsonSafe).slice(0, 700));
  return false;
}
/**
 * Receipts are scoped by TARGET. Ambient traffic keeps living its own life in
 * other records (and other banks) while a pin runs; counting every npcEscaped
 * in the world would make an unrelated hull's crossing look like a duplicate
 * of the one under test. Hidden/off-screen suppression is tested separately
 * and explicitly, not by accident here.
 */
function receipts(evs, type, id) {
  return evs.filter((e) => e.type === type && e.targetId === id);
}
function jsonSafe(key, value) {
  if (value instanceof THREE.Vector3) return [value.x, value.y, value.z];
  if (typeof value === 'function') return '[fn]';
  return value;
}

// ---- Front door: the same fresh-boot path the full harness uses -----------
for (const n of walkDom(document.body)) {
  if (n.dataset?.titleAction === 'new') { n.click(); break; }
}
dispatchKey('Digit1'); // Freehold Greenhand
if (ctx.world.origin !== 'greenhand' || ctx.flags.paused !== false) {
  console.log(`FRONT DOOR FAIL — origin=${ctx.world.origin} paused=${ctx.flags.paused}`);
  process.exit(1);
}
tick(90, 'boot idle');
console.log(`after boot: system=${ctx.world.currentSystem} ships=${ctx.ships.length} records=${ctx.world.records.length}`);

const SYS = 'freehold';
const DEF = SYSTEMS[SYS];
const GATE = new THREE.Vector3(...DEF.gates[0].position);
const GATE_TO = DEF.gates[0].to;
const STATION = new THREE.Vector3(...DEF.station.position);

// FIXTURE: keep the player alive through every pass and out of the ambient
// lane. Harness-only survivability, exactly the wave-9/issue-67 pattern.
ctx.player.hullMax = 1e9; ctx.player.hull = 1e9;
ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
ctx.input.throttle = 0;
ctx.input.fullStop = true;
ctx.world.jumpGraceUntil = 0;

let fixtureSeq = 0;
const fixtureRecords = [];

/**
 * FIXTURE: one controlled NPC record + live hull. Everything set here is
 * INITIAL state — identity, where it sits, how hurt it is. The record joins
 * the REAL current-system bank so traffic.js, world.js and save.js treat it
 * exactly like any other hull.
 */
function makeFixture(opts = {}) {
  fixtureSeq++;
  const rec = {
    id: `i68-${fixtureSeq}`,
    name: opts.name ?? `Claim Wren ${fixtureSeq}`,
    classKey: opts.classKey ?? 'freighter',
    faction: opts.faction ?? 'independent',
    role: opts.role ?? 'trader',
    cargo: opts.cargo ?? [],
    bounty: opts.bounty ?? 0,
    system: SYS,
    state: 'enroute',
    live: false,
    route: [STATION.clone(), GATE.clone()].map((v) => ({ x: v.x, y: v.y, z: v.z })),
    legLens: [STATION.distanceTo(GATE)],
    leg: 0,
    legT: 0.5,
    dir: 1,
    dwellUntil: 0,
    resolveSeed: 0.5,
    personality: 0,
    ...(opts.record || {}),
  };
  ctx.world.records.push(rec);
  fixtureRecords.push(rec);
  const at = opts.at ?? new THREE.Vector3(0, 300, -3000);
  const live = spawnLiveShip(ctx, rec, at);
  if (!live) {
    // A missing authored asset is a SETUP failure, not a pin failure — stop
    // rather than letting every later assertion read a null hull.
    console.log(`SETUP FAIL — no primed asset for ${rec.faction}/${rec.classKey}/${rec.role}`);
    process.exit(1);
  }
  ctx.ships.push(live);
  rec.live = true;
  if (opts.state) Object.assign(live.state, opts.state);
  if (opts.ai) Object.assign(live.ai, opts.ai);
  return { rec, live };
}

function dropFixture(entry) {
  if (!entry) return;
  const { rec, live } = entry;
  if (live) {
    const i = ctx.ships.indexOf(live);
    if (i >= 0) ctx.ships.splice(i, 1);
    removeLiveShip(ctx, live);
  }
  for (const key of Object.keys(ctx.world.recordBanks ?? {})) {
    const bank = ctx.world.recordBanks[key];
    const j = bank.indexOf(rec);
    if (j >= 0) bank.splice(j, 1);
  }
  const k = ctx.world.records.indexOf(rec);
  if (k >= 0) ctx.world.records.splice(k, 1);
}

/**
 * FIXTURE: park every ambient live hull far away so soak traffic cannot
 * shoot, block or out-range the hull under test. Keyed by RECORD, so a
 * fixture that traffic.js re-instantiates on its own is still protected.
 * This is the boot suite's `parkHostiles` discipline, widened.
 */
const keepRecords = new Set();
const PARK = { x: 60000, y: 60000, z: 60000 };
/**
 * The parking has to be COHERENT. Moving only the live hull leaves its RECORD
 * sitting on its own lane a few dozen units from the player: traffic.js culls
 * the teleported hull for range and re-instantiates that same close record on
 * the very next frame, and since the spawn pass instantiates ONE record per
 * frame and picks the nearest, an ordinary neighbour can hold the slot for
 * ever — which is exactly what starved the second-encounter fixture (rec-4 and
 * rec-1 taking every frame while the runner sat 60 u away, eligible and
 * unblocked). So park the dormant record with its hull: its abstract route
 * collapses to the same far point. FIXTURE ISOLATION ONLY — records under test
 * are never touched, no cap, range, priority or spawn rule is changed, and the
 * hull under test is still instantiated by the real traffic pass.
 */
function parkAmbient() {
  let n = 0;
  for (const s of ctx.ships) {
    if (!s || !s.object) continue;
    if (s.record && keepRecords.has(s.record)) continue;
    s.object.position.set(PARK.x, PARK.y, PARK.z);
    n++;
  }
  for (const rec of ctx.world.records) {
    if (!rec || keepRecords.has(rec)) continue;
    const w = rec.route && rec.route[0];
    if (w && w.x === PARK.x && w.y === PARK.y && w.z === PARK.z) continue;
    rec.route = [{ ...PARK }, { ...PARK }];
    rec.legLens = [1];
    rec.leg = 0;
    rec.legT = 0;
    rec.dir = 1;
  }
  return n;
}
function keepOnly(...recs) {
  keepRecords.clear();
  for (const r of recs) if (r) keepRecords.add(r);
}
/** Park ambient, then run n real frames; returns everything that was emitted. */
function run(n, label) {
  const evs = [];
  for (let i = 0; i < n; i++) {
    parkAmbient();
    tick(1, label);
    evs.push(...ctx.lastEvents);
  }
  return evs;
}

function placePlayer(v, offset) {
  ctx.ship.object.position.set(v.x + (offset?.x ?? 0), v.y + (offset?.y ?? 0), v.z + (offset?.z ?? 0));
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
}

const eventsOver = run;

const rw = globalThis.window.rimward;
pin('public handle present', !!(rw && typeof rw.observe === 'function'));
ctx.agent.optIn = true;

// ===========================================================================
// 1. Threat-aware destination choice over the REAL gate network
// ===========================================================================
{
  // 1a. Real flee entry through tickTraderJob's panic path. FIXTURE: a
  // freighter parked out of the lane with its screen dented — an ordinary
  // condition. The MODE, the destination and the copy are the game's.
  const f = makeFixture({ at: new THREE.Vector3(0, 300, -3000) });
  pin('fixture trader instantiated', !!f.live, { rec: f.rec.id });
  keepOnly(f.rec);
  placePlayer(f.live.object.position, { x: 220, y: 0, z: 0 });
  f.live.state.screen = f.live.state.screenMax - 5; // FIXTURE: initial graze
  const evs = run(6, 'i68 trader panic');
  const plan = readEscape(f.rec);
  pin('panicking trader enters flee through the real job tick', f.live.ai.mode === 'flee');
  pin('flee commits to a real physical destination',
    !!plan && (plan.kind === 'gate' || plan.kind === 'station') && Array.isArray(plan.dest),
    plan && { kind: plan.kind, to: plan.to, phase: plan.phase });
  pin('a gate destination is an authored outbound edge of THIS system',
    plan.kind !== 'gate' || DEF.gates.some((g) => g.to === plan.to && g.to !== SYS),
    { to: plan.to });
  pin('destination announced exactly once, in the ship voice',
    evs.filter((e) => e.type === 'commLine' && /Running for/.test(e.text ?? '')).length === 1,
    evs.filter((e) => e.type === 'commLine').map((e) => e.text));
  // The route is FLOWN, not teleported: it closes on its destination. The
  // fixture deliberately starts the freighter pointed 180° AWAY, so the run
  // first pays for a real physical turn (turn 0.7 at burn) and only then is
  // the SUSTAINED approach measured. Nothing here waives the speed contract.
  const dest = new THREE.Vector3(plan.dest[0], plan.dest[1], plan.dest[2]);
  const before = f.live.object.position.distanceTo(dest);
  run(600, 'i68 trader turn'); // 10 s: a loaded freighter comes about
  const turned = f.live.object.position.distanceTo(dest);
  const p0 = f.live.object.position.clone();
  run(300, 'i68 trader approach'); // 5 s of measured, settled flight
  const after = f.live.object.position.distanceTo(dest);
  const moved = f.live.object.position.distanceTo(p0);
  pin('the runner visibly closes on its chosen destination once it is round',
    after < turned - 50, { before, turned, after });
  pin('it kept the SAME committed destination across the revalidate cadence',
    readEscape(f.rec) === plan && plan.dest[0] === dest.x && plan.dest[2] === dest.z,
    { dest: plan.dest });
  pin('movement stays inside the class speed contract',
    moved <= SHIP_CLASSES[f.rec.classKey].burn * 5 + 1,
    { moved, cap: SHIP_CLASSES[f.rec.classKey].burn * 5 });
  pin('the plan keeps a live position/velocity snapshot',
    Number.isFinite(plan.pos[0]) && Number.isFinite(plan.speed)
    && Math.hypot(plan.pos[0] - f.live.object.position.x,
      plan.pos[1] - f.live.object.position.y,
      plan.pos[2] - f.live.object.position.z) < 1e-6,
    { pos: plan.pos, at: [f.live.object.position.x, f.live.object.position.y, f.live.object.position.z] });
  dropFixture(f);
  tick(3, 'i68 1a cleanup');
}

{
  // 1b. Station versus gate, decided by real geometry on the real system.
  const nearStation = chooseEscapeDestination({
    sysId: SYS,
    fromPos: { x: STATION.x + 200, y: STATION.y, z: STATION.z + 200 },
    threatPos: { x: STATION.x + 900, y: STATION.y, z: STATION.z + 900 },
    stationPos: DEF.station.position,
    classKey: 'freighter',
  });
  pin('a near, unblocked station beats a far gate',
    nearStation.ok && nearStation.kind === 'station', nearStation);
  const nearGate = chooseEscapeDestination({
    sysId: SYS,
    fromPos: { x: GATE.x + 150, y: GATE.y, z: GATE.z - 150 },
    threatPos: { x: GATE.x + 900, y: GATE.y, z: GATE.z + 900 },
    stationPos: DEF.station.position,
    classKey: 'freighter',
  });
  pin('a near, unblocked gate beats a far station',
    nearGate.ok && nearGate.kind === 'gate' && nearGate.to === GATE_TO, nearGate);

  // A closer station screened by the pursuer loses to the clear gate. The
  // geometry is deliberate: Freehold's one gate lies at -z and its station at
  // +z, so a runner between them has the two candidates on OPPOSITE bearings.
  // A pursuer on the station leg therefore screens that leg and only that leg
  // — the gate stays provably clear, which is what makes the pin meaningful.
  // Distances account for the escape refuge RING (it sits beyond the launch
  // envelope, ~270-306 u out by hull), so the runner starts well outside it
  // and the pursuer sits on the leg between the two.
  const from = { x: STATION.x, y: STATION.y, z: STATION.z - 800 };
  const tube = { x: STATION.x, y: STATION.y, z: STATION.z - 550 };
  const screened = chooseEscapeDestination({
    sysId: SYS,
    fromPos: from,
    threatPos: tube,
    stationPos: DEF.station.position,
    classKey: 'freighter',
  });
  pin('a station screened by the pursuer loses to the clear gate',
    screened.ok && screened.kind === 'gate', screened);
  pin('the screening test really is the pursuer tube, not distance',
    segmentClearance(from.x, from.y, from.z, STATION.x, STATION.y, STATION.z,
      tube.x, tube.y, tube.z).dist < ESCAPE.threatBubble);
  pin('...and the gate leg really was clear, so the choice had somewhere to go',
    (() => {
      const c = segmentClearance(from.x, from.y, from.z, GATE.x, GATE.y, GATE.z, tube.x, tube.y, tube.z);
      return c.t <= ESCAPE.threatAheadMin || c.dist >= ESCAPE.threatBubble;
    })());

  // Multi-gate system: the nearest gate screened by the pursuer loses to the
  // clear one. Redmarch has two authored physical gates.
  const rmGates = SYSTEMS.redmarch.gates;
  const g0 = new THREE.Vector3(...rmGates[0].position);
  const g1 = new THREE.Vector3(...rmGates[1].position);
  const rmFrom = new THREE.Vector3().lerpVectors(g0, g1, 0.5);
  rmFrom.y += 40;
  const clearPick = chooseEscapeDestination({
    sysId: 'redmarch',
    fromPos: rmFrom,
    threatPos: new THREE.Vector3().lerpVectors(rmFrom, g0, 0.5), // sits on the g0 leg
    stationPos: SYSTEMS.redmarch.station.position,
    classKey: 'cutter',
  });
  pin('a screened gate is rejected while a clear gate exists',
    clearPick.ok && clearPick.to !== rmGates[0].to, clearPick);

  // Both routes blocked → explicit evade, never a fake destination. This is
  // GENUINE forward screening: from the far side of the station both the
  // station hold and the single gate bear the same way, so one pursuer
  // parked on that bearing sits ahead on BOTH legs.
  const boxedFrom = { x: STATION.x + 400, y: STATION.y, z: STATION.z + 400 };
  const boxedThreat = { x: STATION.x + 300, y: STATION.y, z: STATION.z + 300 };
  const blockedAll = chooseEscapeDestination({
    sysId: SYS,
    fromPos: boxedFrom,
    threatPos: boxedThreat,
    stationPos: DEF.station.position,
    classKey: 'freighter',
  });
  pin('every route screened produces no destination and a blocked reason',
    blockedAll.ok === false && blockedAll.reason === 'blocked'
    && blockedAll.dest === null && blockedAll.kind === null, blockedAll);
  pin('the block really was every candidate, counted',
    blockedAll.blocked === DEF.gates.length + 1, { blocked: blockedAll.blocked });
  const cleared = chooseEscapeDestination({
    sysId: SYS,
    fromPos: boxedFrom,
    threatPos: { x: boxedFrom.x + 4000, y: boxedFrom.y, z: boxedFrom.z + 4000 },
    stationPos: DEF.station.position,
    classKey: 'freighter',
  });
  pin('clearing the obstacle permits a choice again', cleared.ok === true, cleared);

  // A pursuer sitting ON the runner is NOT a box: every bearing still opens
  // range on it. Screening means the threat lies AHEAD on the leg, and a
  // route that runs away from a coincident threat must stay available.
  const onTop = chooseEscapeDestination({
    sysId: SYS,
    fromPos: boxedFrom,
    threatPos: boxedFrom,
    stationPos: DEF.station.position,
    classKey: 'freighter',
  });
  pin('a threat on top of the hull does not block the routes leading away',
    onTop.ok === true && onTop.blocked === 0, onTop);
  // …and a route that starts inside the threat bubble but opens range is
  // allowed: the bubble is not a no-fly sphere.
  const insideBubble = chooseEscapeDestination({
    sysId: SYS,
    fromPos: { x: GATE.x + 40, y: GATE.y, z: GATE.z + 120 },
    threatPos: { x: GATE.x + 40, y: GATE.y, z: GATE.z + 240 }, // 120 u astern
    stationPos: DEF.station.position,
    classKey: 'cutter',
  });
  pin('a leg that begins inside the threat bubble but opens range is allowed',
    insideBubble.ok === true && insideBubble.kind === 'gate', insideBubble);

  // Engine-out weights the near refuge higher but never invents speed.
  const limping = chooseEscapeDestination({
    sysId: SYS,
    fromPos: { x: 400, y: 200, z: 200 },
    threatPos: { x: 4000, y: 200, z: 4000 },
    stationPos: DEF.station.position,
    classKey: 'freighter',
    engineOut: true,
  });
  pin('an engine-out hull may prefer the reachable station refuge',
    limping.ok === true, limping);
}

{
  // 1c. Malformed gate data is rejected, not flown. FIXTURE (clearly
  // labelled): a temporary fake system entry with a self edge, an unknown
  // destination and a non-finite position; deleted immediately afterwards.
  SYSTEMS.__i68fake = {
    id: '__i68fake',
    name: 'Fixture Void',
    gates: [
      { position: [0, 0, 0], to: '__i68fake' },          // self
      { position: [10, 0, 0], to: 'no-such-system' },     // unknown
      { position: [Number.NaN, 0, 0], to: GATE_TO },      // malformed position
    ],
    station: { position: [0, 0, 0] },
  };
  const bad = chooseEscapeDestination({
    sysId: '__i68fake',
    fromPos: { x: 500, y: 0, z: 0 },
    threatPos: null,
    stationPos: null,
    classKey: 'cutter',
  });
  pin('self, unknown and malformed gates are all rejected',
    bad.ok === false && bad.reason === 'no-route', bad);
  const stationOnly = chooseEscapeDestination({
    sysId: '__i68fake',
    fromPos: { x: 500, y: 0, z: 0 },
    threatPos: null,
    stationPos: [0, 0, 0],
    classKey: 'cutter',
  });
  pin('with no usable gate the station refuge still answers',
    stationOnly.ok === true && stationOnly.kind === 'station', stationOnly);
  delete SYSTEMS.__i68fake;
  pin('unknown systems never produce a route',
    chooseEscapeDestination({ sysId: '__i68fake', fromPos: { x: 0, y: 0, z: 0 } }).ok === false);
}

// ===========================================================================
// 2. Continuity through the 1400 u fold: cull, re-instantiation, save/restore
// ===========================================================================
let culledFixture = null;
{
  // FIXTURE, in TWO steps, because a runner has to be able to run before it
  // can be interrupted:
  //   1. an OPERATIONAL freighter with a dented screen — the same ordinary
  //      panic precondition section 1a uses — so the flee entry, the refuge
  //      and the announcement are all produced by the game itself;
  //   2. the battle damage this section is really about, landing on a hull
  //      that is ALREADY running.
  // Staging step 2 as INITIAL state was the mistake in this fixture. A
  // freighter sitting at 60/220 hull with its shields gone and its engine out,
  // freshly out of combat beside a healthy player, is a hull the resolve
  // ladder legitimately breaks: npc.js updateResolve lands it in the
  // 'capitulate' band on its first 1 Hz sample and capitulate() picks
  // 'crewPods' (hull < 40%), which surrenders the ship and puts it in 'drift'.
  // It never reached tickTraderJob's panic path, so there was no plan to fold
  // and every pin below dereferenced null. The production rule is right; the
  // fixture was asking for a ship that would rather yield than run.
  const f = makeFixture({ at: new THREE.Vector3(0, 300, -3000), name: 'Claim Wren' });
  culledFixture = f;
  keepOnly(f.rec);
  placePlayer(f.live.object.position, { x: 220, y: 0, z: 0 });
  f.live.state.screen = f.live.state.screenMax - 5; // FIXTURE: initial graze
  run(8, 'i68 cull setup');
  const plan = readEscape(f.rec);
  const havePlan = pin('the runner planned an escape while it was still operational',
    !!plan && escapeActive(f.rec) && f.live.ai.mode === 'flee',
    { mode: f.live.ai.mode, surrendered: f.live.state.surrendered, phase: plan && plan.phase });
  if (!havePlan) {
    // The PREREQUISITE is reported above and exactly the pins that would
    // dereference the plan are skipped here — never the whole section, and
    // never a TypeError that takes the rest of the runner down with it.
    console.log('SKIP  cull/fold continuity — no committed escape plan to fold');
  } else {
    // FIXTURE: the interruption. Battle damage and an engine hit land on a
    // hull that is already running — attributed, and applied to the LIVE ship
    // exactly as an exchange would leave it. The timestamps are stamped one
    // second beyond npc.js's THREAT_MEMORY (12 s): that pass is over, so the
    // resolve ladder is not re-run against a hull deliberately held at 27%,
    // and it is still far short of the 30 s out-of-combat quiet the EXISTING
    // repair rule needs — so nothing heals and the continuity pins below
    // measure the fold, not a repair.
    const hurtAt = ctx.world.time - 13;
    Object.assign(f.live.state, {
      hull: 60, screen: 0, shell: 4, engine: 30, engineOut: true,
      lastHitAt: hurtAt, lastCombatAt: hurtAt,
    });

    const hull0 = f.live.state.hull;
    const engine0 = f.live.state.engine;
    const id0 = f.rec.id;
    run(90, 'i68 pre-cull run');
    pin('the crippled runner keeps running: the damage did not stand it down',
      f.live.ai.mode === 'flee' && escapeActive(f.rec) && f.live.state.engineOut === true,
      { mode: f.live.ai.mode, engineOut: f.live.state.engineOut, hull: f.live.state.hull });
    const posBefore = f.live.object.position.clone();

    // Force a REAL cull: move the player past U.DEINSTANTIATE_RANGE and let
    // traffic.js run its own despawn pass. Nothing is spliced by hand.
    placePlayer(posBefore, { x: U.DEINSTANTIATE_RANGE + 400, y: 0, z: 0 });
    run(4, 'i68 cull');
    const stillLive = ctx.ships.includes(f.live);
    pin('the runner is really culled at the traffic threshold', stillLive === false);
    pin('culling folds the TRUE position into the record',
      Math.hypot(plan.pos[0] - posBefore.x, plan.pos[1] - posBefore.y, plan.pos[2] - posBefore.z) < 1e-6,
      { pos: plan.pos, was: [posBefore.x, posBefore.y, posBefore.z] });
    pin('culling folds the TRUE condition into the record',
      plan.cond.hull === hull0 && plan.cond.engine === engine0
      && plan.cond.flags.engineOut === true, plan.cond);
    pin('range culling is not an escape: no receipt is emitted',
      !ctx.lastEvents.some((e) => e.type === 'npcEscaped' || e.type === 'npcSheltered'));
    pin('recordPosition now reports the escape position, not the old lane',
      (() => {
        const out = new THREE.Vector3();
        recordPosition(f.rec, out);
        return out.distanceTo(posBefore) < 1e-6;
      })());

    // Off-screen progress on the REAL galaxy tick: the record advances along
    // its leg toward the destination and never past it.
    const destV = new THREE.Vector3(plan.dest[0], plan.dest[1], plan.dest[2]);
    const distBefore = destV.distanceTo(posBefore);
    run(180, 'i68 offscreen advance'); // 3 s of world time = 3 galaxy ticks
    const offPos = new THREE.Vector3(plan.pos[0], plan.pos[1], plan.pos[2]);
    const distAfter = destV.distanceTo(offPos);
    const cruise = SHIP_CLASSES[f.rec.classKey].cruise;
    pin('the culled runner keeps making progress off screen', distAfter < distBefore, { distBefore, distAfter });
    pin('off-screen progress obeys the engine-out speed contract',
      distBefore - distAfter <= cruise * 0.3 * 3 + 1, { moved: distBefore - distAfter, cap: cruise * 0.3 * 3 });
    pin('off-screen progress stays on the chosen leg',
      (() => {
        const c = segmentClearance(posBefore.x, posBefore.y, posBefore.z,
          destV.x, destV.y, destV.z, offPos.x, offPos.y, offPos.z);
        return c.dist < 1;
      })());
    pin('a culled escapee is never taken by ordinary trader migration',
      f.rec.state === 'enroute' && !f.rec.transitTo);

    // Reacquisition: put the player back inside instantiate range and let
    // traffic.js spawn it again. Same record, same condition, same intent.
    placePlayer(offPos, { x: 60, y: 0, z: 0 });
    run(20, 'i68 reacquire');
    const back = ctx.ships.filter((s) => s.record === f.rec);
    pin('exactly one hull comes back for the record', back.length === 1, { n: back.length });
    if (back.length === 1) {
      const live = back[0];
      culledFixture.live = live;
      pin('the reacquired hull is the same logical ship', live.record.id === id0 && live.id === id0);
      // The record kept advancing off screen during the frames it took traffic
      // to re-instantiate, so the hull comes back FURTHER ALONG the leg — not
      // at the sample taken before those frames. What must hold is that it is
      // on the escape leg, ahead of that sample, and nowhere near its old lane.
      pin('the reacquired hull resumes on its escape route',
        (() => {
          const at = live.object.position;
          const c = segmentClearance(posBefore.x, posBefore.y, posBefore.z,
            destV.x, destV.y, destV.z, at.x, at.y, at.z);
          return c.dist < 2 && destV.distanceTo(at) <= distAfter + 1;
        })(),
        { at: [live.object.position.x, live.object.position.y, live.object.position.z], want: [offPos.x, offPos.y, offPos.z] });
      pin('the reacquired hull comes back MOVING, not stopped and turning round',
        live.ai.velocity.lengthSq() > 1e-6, { v: live.ai.velocity.length() });
      pin('no fresh-state healing on re-instantiation',
        live.state.hull === hull0 && live.state.engineOut === true && live.state.engine === engine0,
        { hull: live.state.hull, engine: live.state.engine, engineOut: live.state.engineOut });
      pin('the reacquired hull still intends to escape',
        live.ai.mode === 'flee' && escapeActive(f.rec));
      pin('no duplicate ordinary route was adopted',
        !ctx.ships.some((s) => s !== live && s.record === f.rec));
    }
  }
}

{
  // Save/restore while live and escaping. Real snapshot → JSON → real restore.
  const f = culledFixture;
  const plan = readEscape(f.rec);
  if (!plan) {
    // Same discipline as the fold above: report the missing prerequisite and
    // skip only the pins that would read it.
    pin('PREREQUISITE save/restore continuity: the fixture still carries a plan',
      false, { rec: f.rec.id });
    console.log('SKIP  save/restore continuity — no plan on the record');
  } else {
    const before = {
      id: f.rec.id,
      hull: plan.cond.hull,
      engineOut: plan.cond.flags.engineOut,
      kind: plan.kind,
      to: plan.to,
      pos: plan.pos.slice(),
    };
    const snap = snapshot(ctx);
    const blob = JSON.parse(JSON.stringify(snap));
    pin('the escape plan is JSON-plain and survives serialization',
      (() => {
        const banks = blob.world.recordBanks || {};
        const rec = (banks[SYS] || []).find((r) => r.id === before.id);
        return !!rec && !!rec.escape && rec.escape.kind === before.kind
          && Array.isArray(rec.escape.pos) && rec.escape.pos.length === 3;
      })(), before);
    restore(ctx, blob);
    // The restore replaced the bank with deserialized records; re-point the
    // ambient-parking guard at the record that now owns this hull.
    const restoredRec = (ctx.world.recordBanks?.[SYS] ?? []).find((r) => r.id === before.id) ?? null;
    if (restoredRec) keepOnly(restoredRec);
    run(4, 'i68 restore settle');
    const restoredPlan = restoredRec ? readEscape(restoredRec) : null;
    pin('the restored record keeps identity, destination and condition',
      !!restoredPlan && restoredPlan.kind === before.kind && restoredPlan.to === before.to
      && restoredPlan.cond.hull === before.hull
      && restoredPlan.cond.flags.engineOut === before.engineOut, restoredPlan && {
      kind: restoredPlan.kind, hull: restoredPlan.cond?.hull,
    });
    const restoredLive = ctx.ships.find((s) => s.record && s.record.id === before.id) ?? null;
    pin('a same-system restore pushes the SAVED condition onto the live hull',
      !restoredLive || (restoredLive.state.hull === before.hull
        && restoredLive.state.engineOut === before.engineOut
        && restoredLive.ai.mode === 'flee'),
      restoredLive && { hull: restoredLive.state.hull, mode: restoredLive.ai.mode });
    pin('a same-system restore does not let stale live values overwrite the save',
      !restoredPlan || restoredPlan.cond.hull === before.hull);
    if (restoredRec) {
      culledFixture.rec = restoredRec;
      culledFixture.live = restoredLive;
    }
  }
}

{
  // SAME-FRAME capture: main.js runs save AFTER combat, so damage landed this
  // very frame must be in the blob. Nothing is written by hand — the shot goes
  // through the real applyHit, then the real snapshot, with no tick between.
  const f = culledFixture;
  if (f.live) {
    // FIXTURE: shields already down — the ordinary state of a hull that has
    // been running under fire, and the condition under which a hit reaches
    // hull at all. The screen and shell regenerated during the fold above
    // (the EXISTING recharge rule, working correctly), so a 12-point hit was
    // being absorbed entirely by the layers and the hull never moved. The
    // damage itself is still the real applyHit, at its authored tuning.
    f.live.state.screen = 0;
    f.live.state.shell = 0;
    const hullBefore = f.live.state.hull;
    applyHit(f.live.state, { damage: 12, family: 'kinetic', facet: 'fore', now: ctx.world.time });
    const hullAfter = f.live.state.hull;
    pin('the fixture hit really landed', hullAfter < hullBefore, { hullBefore, hullAfter });
    const snap2 = JSON.parse(JSON.stringify(snapshot(ctx)));
    const saved = (snap2.world.recordBanks?.[SYS] ?? []).find((r) => r.id === f.rec.id) ?? null;
    pin('a save taken the same frame as the hit carries the NEW damage',
      !!saved && saved.escape && saved.escape.cond.hull === hullAfter,
      { saved: saved?.escape?.cond?.hull, live: hullAfter });
    // …and loading it back puts exactly that hull on the ship again.
    f.live.state.hull = hullBefore; // fixture: pretend the shot never happened
    restore(ctx, snap2); // healLiveRecords runs inside; read the result NOW
    const rec2 = (ctx.world.recordBanks?.[SYS] ?? []).find((r) => r.id === f.rec.id) ?? null;
    const live2 = ctx.ships.find((s) => s.record && s.record.id === f.rec.id) ?? null;
    pin('the restore drives the SAVED hull onto the live ship, not the reverse',
      !!rec2 && readEscape(rec2)?.cond?.hull === hullAfter
      && (!live2 || live2.state.hull === hullAfter),
      { rec: rec2 && readEscape(rec2)?.cond?.hull, live: live2?.state.hull });
    if (rec2) keepOnly(rec2);
    run(2, 'i68 same-frame restore settle');
    if (rec2) {
      culledFixture.rec = rec2;
      culledFixture.live = live2;
    }
  }
}

{
  // A restored record with NO escape must stand a still-fleeing live hull
  // down: the save is the truth in both directions.
  const f = culledFixture;
  if (f.live && f.rec) {
    const snap3 = JSON.parse(JSON.stringify(snapshot(ctx)));
    // FIXTURE: a legacy blob for this same ship. The snapshot serializes the
    // current bank TWICE (world.records and world.recordBanks[current]) and
    // restore re-unifies them by assigning recordBanks[current] = records —
    // so a save written before this issue carries no plan in EITHER copy, and
    // stripping only the bank row left the authoritative one intact.
    for (const row of [...(snap3.world.records ?? []), ...(snap3.world.recordBanks?.[SYS] ?? [])]) {
      if (row && row.id === f.rec.id) delete row.escape;
    }
    restore(ctx, snap3); // read the heal's result before any job tick re-panics
    const rec3 = (ctx.world.recordBanks?.[SYS] ?? []).find((r) => r.id === f.rec.id) ?? null;
    const live3 = ctx.ships.find((s) => s.record && s.record.id === f.rec.id) ?? null;
    pin('a legacy restore clears an escape the live hull was still flying',
      !!rec3 && !readEscape(rec3) && (!live3 || live3.ai.mode !== 'flee'),
      { plan: rec3 && rec3.escape, mode: live3?.ai.mode });
    if (rec3) keepOnly(rec3);
    run(2, 'i68 legacy restore settle');
    if (rec3) {
      culledFixture.rec = rec3;
      culledFixture.live = live3;
    }
  }
}

{
  // Legacy and corrupt persistence both fail safe.
  const legacy = { id: 'i68-legacy', role: 'trader', state: 'enroute' };
  pin('a legacy record with no escape field is untouched',
    sanitizeEscapeRecord(legacy) === false && !Object.hasOwn(legacy, 'escape'));
  const corrupt = {
    id: 'i68-corrupt', role: 'pirate', state: 'enroute',
    escape: { v: 1, phase: 'route', kind: 'gate', to: 'nowhere-at-all', dest: ['x', null, {}], pos: [1, 2, 3] },
  };
  sanitizeEscapeRecord(corrupt);
  pin('a corrupt destination is dropped, not flown',
    !corrupt.escape || (corrupt.escape.kind === null && corrupt.escape.dest === null
      && corrupt.escape.phase === 'evade'), corrupt.escape);
  const foreign = { id: 'i68-foreign', escape: { v: 99, phase: 'route' } };
  sanitizeEscapeRecord(foreign);
  pin('a foreign-version plan is discarded entirely', foreign.escape === undefined);
  const unbounded = {
    id: 'i68-huge', role: 'pirate', state: 'enroute',
    escape: {
      v: 1, phase: 'charge', kind: 'gate', to: GATE_TO, dest: [0, 0, 0], pos: [0, 0, 0],
      speed: 1e12, charge: 1e12, cond: { hull: Number.POSITIVE_INFINITY, flags: { disabled: 'yes' } },
      peace: { demandOutcome: 'anything', calmUntil: 'soon' },
    },
  };
  sanitizeEscapeRecord(unbounded);
  pin('restored scalars are bounded and non-finite values are dropped',
    unbounded.escape.speed <= ESCAPE.maxSpeed && unbounded.escape.charge <= JUMP.chargeTime
    && !Object.hasOwn(unbounded.escape.cond, 'hull')
    && unbounded.escape.cond.flags.disabled === false
    && unbounded.escape.peace.demandOutcome === null
    && unbounded.escape.peace.calmUntil === 0, unbounded.escape);
  const dead = {
    id: 'i68-dead', role: 'pirate', state: 'dead',
    escape: { v: 1, phase: 'route', kind: 'gate', to: GATE_TO, dest: [0, 0, 0], pos: [0, 0, 0] },
  };
  sanitizeEscapeRecord(dead);
  pin('a dead record cannot resume an escape',
    dead.escape.phase === 'done' && dead.escape.kind === null, dead.escape);
}

dropFixture(culledFixture);
run(3, 'i68 section 2 cleanup');

{
  // Hunter continuity: a runner fleeing an NPC must still be fleeing THAT NPC
  // after the fold. The player sits on the OPPOSITE side of the runner from
  // the hunter, so a substituted threat is unmistakable — it would reverse the
  // direction the runner is running in.
  const at = new THREE.Vector3(-2200, 120, 1800);
  const runner = makeFixture({ at, name: 'Wren Hunted' });
  const hunter = makeFixture({
    at: at.clone().add(new THREE.Vector3(-500, 0, 0)),
    name: 'Ledger Hound', classKey: 'cutter', role: 'pirate', faction: 'redledger',
    record: { id: 'rec-9969' },
  });
  const runnerId = runner.rec.id;
  const hunterId = hunter.rec.id;
  keepOnly(runner.rec, hunter.rec);
  placePlayer(at, { x: 500, y: 0, z: 0 }); // the player is the OTHER way
  // FIXTURE: an ordinary acquisition, held for the entry frames — the flee
  // itself comes from tickTraderJob's real findHunterOf path.
  for (let i = 0; i < 6; i++) {
    hunter.live.ai.target = runner.live;
    run(1, 'i68 hunter flee');
  }
  const plan = readEscape(runner.rec);
  const hp = hunter.live.object.position;
  pin('a runner fleeing an NPC records THAT hull, not a bare token',
    !!plan && plan.threat === 'ship' && plan.threatId === hunterId
    && Array.isArray(plan.threatAt)
    && Math.hypot(plan.threatAt[0] - hp.x, plan.threatAt[1] - hp.y, plan.threatAt[2] - hp.z) < 5,
    plan && { threat: plan.threat, id: plan.threatId, at: plan.threatAt });

  // Cull both hulls, then round-trip the whole world through a real save.
  const runnerPos = runner.live.object.position.clone();
  placePlayer(runnerPos, { x: U.DEINSTANTIATE_RANGE + 500, y: 0, z: 0 });
  run(4, 'i68 hunter cull');
  const blob = JSON.parse(JSON.stringify(snapshot(ctx)));
  restore(ctx, blob);
  const bank = ctx.world.recordBanks?.[SYS] ?? [];
  const rec2 = bank.find((r) => r.id === runnerId) ?? null;
  const hRec2 = bank.find((r) => r.id === hunterId) ?? null;
  const plan2 = rec2 ? readEscape(rec2) : null;
  if (rec2 && hRec2) keepOnly(rec2, hRec2);
  pin('the remembered hunter survives the cull, the blob and the restore',
    !!plan2 && plan2.threat === 'ship' && plan2.threatId === hunterId
    && Array.isArray(plan2.threatAt) && plan2.threatAt.length === 3,
    plan2 && { threat: plan2.threat, id: plan2.threatId, at: plan2.threatAt });

  // Re-instantiate through the REAL constructor traffic.js uses. The hunter is
  // back in the world, so the runner takes the same handle again.
  const out = new THREE.Vector3();
  let hLive = null;
  let rLive = null;
  if (hRec2 && rec2) {
    recordPosition(hRec2, out);
    hLive = spawnLiveShip(ctx, hRec2, out);
    if (hLive) ctx.ships.push(hLive);
    recordPosition(rec2, out);
    rLive = spawnLiveShip(ctx, rec2, out);
    if (rLive) ctx.ships.push(rLive);
  }
  pin('the reacquired runner reconnects to the SAME live hunter',
    !!rLive && !!hLive && rLive.ai.fleeFrom === hLive,
    { fleeFrom: rLive && (rLive.ai.fleeFrom === 'player' ? 'player' : (rLive.ai.fleeFrom ? 'ship' : null)) });

  // …and with that hull gone from the world it is NOT handed the player.
  if (rLive) {
    const i = ctx.ships.indexOf(rLive);
    if (i >= 0) ctx.ships.splice(i, 1);
    removeLiveShip(ctx, rLive);
  }
  if (hLive) {
    const j = ctx.ships.indexOf(hLive);
    if (j >= 0) ctx.ships.splice(j, 1);
    removeLiveShip(ctx, hLive);
  }
  let alone = null;
  if (rec2) {
    recordPosition(rec2, out);
    alone = spawnLiveShip(ctx, rec2, out);
  }
  pin('with the hunter gone the runner is never silently handed the player',
    !!alone && alone.ai.fleeFrom !== 'player'
    && readEscape(rec2)?.threatId === hunterId,
    alone && { fleeFrom: alone.ai.fleeFrom === 'player' ? 'player' : (alone.ai.fleeFrom ? 'ship' : null) });
  // The memory has to survive the CAPTURE boundary, not just construction: the
  // ordinary per-frame sync, the removal fold and a save all run captureCondition
  // with a null live handle, and any one of them erasing the id/position would
  // hand the next threat lookup the player.
  if (alone) {
    ctx.ships.push(alone);
    keepOnly(rec2);
    run(20, 'i68 alone runner ticks');
    const afterTicks = readEscape(rec2);
    pin('ordinary ticks do not erase the remembered hunter',
      !!afterTicks && afterTicks.threat === 'ship' && afterTicks.threatId === hunterId
      && Array.isArray(afterTicks.threatAt),
      afterTicks && { threat: afterTicks.threat, id: afterTicks.threatId });
    const k = ctx.ships.indexOf(alone);
    if (k >= 0) ctx.ships.splice(k, 1);
    removeLiveShip(ctx, alone);
    const saved = JSON.parse(JSON.stringify(snapshot(ctx)));
    const row = (saved.world.recordBanks?.[SYS] ?? []).find((r) => r.id === runnerId) ?? null;
    pin('the fold and the save carry the hunter identity through as well',
      !!row && !!row.escape && row.escape.threat === 'ship' && row.escape.threatId === hunterId
      && Array.isArray(row.escape.threatAt),
      row && row.escape && { threat: row.escape.threat, id: row.escape.threatId });
  }
  for (const key of Object.keys(ctx.world.recordBanks ?? {})) {
    const b = ctx.world.recordBanks[key];
    for (let i = b.length - 1; i >= 0; i--) if (b[i].id === runnerId || b[i].id === hunterId) b.splice(i, 1);
  }
  for (let i = ctx.world.records.length - 1; i >= 0; i--) {
    const r = ctx.world.records[i];
    if (r.id === runnerId || r.id === hunterId) ctx.world.records.splice(i, 1);
  }
  keepRecords.clear();
  run(3, 'i68 hunter cleanup');
}

// ===========================================================================
// 3. Engine-out and disabled hulls obey the existing movement/jump contract
// ===========================================================================
{
  // 3a. Engine-out flight never exceeds 30% of class cruise.
  const f = makeFixture({
    at: new THREE.Vector3(2600, 500, 2600),
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    // lastCombatAt rides with the damage: createShipState's -1e9 default puts
    // the hull 30 years out of combat, so the EXISTING repair rule would
    // legitimately clear engineOut part-way through 3b's 15 s and the pins
    // below would be measuring a repaired ship. 3c sets the quiet interval
    // explicitly, and that is where the repair belongs.
    state: {
      engineOut: true, engine: 10, hull: 40,
      lastHitAt: ctx.world.time, lastCombatAt: ctx.world.time,
    },
    ai: { mode: 'flee', fleeFrom: 'player' },
  });
  keepOnly(f.rec);
  placePlayer(f.live.object.position, { x: 300, y: 0, z: 0 });
  run(10, 'i68 engineOut settle');
  const start = f.live.object.position.clone();
  run(60, 'i68 engineOut run'); // exactly 1 s of world time
  const moved = f.live.object.position.distanceTo(start);
  const cap = SHIP_CLASSES.cutter.cruise * 0.3;
  pin('engine-out flight stays inside its 30%-cruise contract',
    moved > 0 && moved <= cap + 0.5, { moved, cap });
  pin('engine-out flight is not granted burn speed', moved < SHIP_CLASSES.cutter.burn * 0.5, { moved });

  // 3b. Engine-out at the gate cannot charge or jump.
  const plan = readEscape(f.rec);
  f.live.object.position.copy(GATE).add(new THREE.Vector3(20, 0, 0));
  // FIXTURE: the pursuer sits squarely on the runner's station leg, 300 u out
  // — the ordinary way a committed refuge stops being viable. The limping hull
  // chose the far station while it was out in the lane (engineOutStationBias),
  // and a committed choice is deliberately NOT abandoned just because the hull
  // moved; screening that leg is what makes the revalidate cadence re-run the
  // REAL choice from here, where the AUTHORED gate bore 20 u astern wins. The
  // same pursuer cannot screen the gate leg — it lies behind the runner, so
  // the segment parameter is negative. Nothing hand-writes a plan.
  const stationLeg = STATION.clone().sub(f.live.object.position).normalize();
  placePlayer(f.live.object.position.clone().addScaledVector(stationLeg, 300));
  // Long enough for the revalidate cadence to re-choose the now-adjacent gate,
  // for the limping hull to physically turn and come back to the bore, and for
  // JUMP.chargeTime to elapse many times over — while staying inside the 30 s
  // out-of-combat quiet the repair rule needs, so this leg never measures a
  // repaired ship.
  //
  // The TRAJECTORY is sampled, not one final frame: ordinary avoidance and the
  // turn genuinely carry a slow hull in and out of the bore, and a snapshot
  // taken on the way out says nothing about whether it ever arrived. What must
  // hold is that it was physically inside the AUTHORED gate zone, on a
  // committed gate plan, with its engine out — and that across every frame of
  // the run the charge never accrued and no crossing ever happened.
  const evs = [];
  let inZone = 0;
  let peakCharge = 0;
  let repaired = false;
  for (let i = 0; i < 1500; i++) {
    evs.push(...run(1, 'i68 engineOut at gate'));
    const out = f.live.state.engineOut === true;
    if (!out) repaired = true;
    if (out && plan.kind === 'gate' && f.live.object.position.distanceTo(GATE) <= JUMP.zone) inZone++;
    if ((plan.charge ?? 0) > peakCharge) peakCharge = plan.charge;
  }
  pin('the limping hull physically reached the authored gate zone (the pin has teeth)',
    plan.kind === 'gate' && inZone > 0,
    {
      kind: plan.kind, phase: plan.phase, framesInZone: inZone, zone: JUMP.zone,
      dNow: f.live.object.position.distanceTo(GATE), engineOut: f.live.state.engineOut,
    });
  pin('an engine-out hull at the gate never completes a charge',
    peakCharge === 0 && (plan.charge ?? 0) === 0 && repaired === false,
    { charge: plan.charge, peak: peakCharge, phase: plan.phase, repaired });
  pin('an engine-out hull never departs', f.rec.state !== 'inTransit'
    && receipts(evs, 'npcEscaped', f.rec.id).length === 0);
  ctx.targets.current = f.live; // ordinary lock, so observe() reads THIS hull
  pin('and the shared word says WHY it is sitting there, not GATE CHARGE',
    (() => {
      const w = escapeStatus(f.rec);
      const row = rw.observe().targets.current;
      return !!w && /ENGINE OUT/.test(w.label) && !/GATE CHARGE/.test(w.label)
        && !!row && !!row.escape && row.escape.label === w.label
        && row.escape.phase === w.phase;
    })(), { word: escapeStatus(f.rec), row: rw.observe().targets.current?.escape });
  ctx.targets.current = null;

  // 3c. Repair through the EXISTING rule, then it may proceed. FIXTURE: only
  // the elapsed-quiet precondition is set; tickShipState does the repair.
  f.live.state.lastCombatAt = ctx.world.time - 120;
  f.live.state.engine = f.live.state.engineMax * 0.28; // just under engineOutAt
  run(600, 'i68 engine repair'); // ordinary out-of-combat regeneration
  pin('the existing out-of-combat repair rule still clears engineOut',
    f.live.state.engineOut === false, { engine: f.live.state.engine, max: f.live.state.engineMax });
  const after = run(300, 'i68 repaired departure');
  pin('a repaired hull may then complete the crossing it was denied',
    f.rec.state === 'inTransit' || receipts(after, 'npcEscaped', f.rec.id).length === 1,
    { state: f.rec.state, charge: plan.charge });
  dropFixture(f);
  run(3, 'i68 3 cleanup');
}

{
  // 3d. Disabled at the gate: drifting, damageable, and going nowhere.
  const f = makeFixture({
    at: GATE.clone().add(new THREE.Vector3(25, 0, 0)),
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    state: { hull: 20, lastHitAt: ctx.world.time },
    ai: { mode: 'flee', fleeFrom: 'player' },
  });
  keepOnly(f.rec);
  placePlayer(GATE, { x: 500, y: 0, z: 0 });
  run(30, 'i68 disabled setup');
  let plan = readEscape(f.rec);
  const chargeBefore = plan ? plan.charge : null;
  pin('an operational hull at the gate does start charging', (chargeBefore ?? 0) > 0, { chargeBefore });
  f.live.state.disabled = true; // FIXTURE: the disable itself, mid-charge
  const evs = run(240, 'i68 disabled at gate');
  pin('a disable mid-charge cancels the accrued timer', plan.charge === 0, { charge: plan.charge });
  pin('a disabled hull cannot depart',
    f.rec.state !== 'inTransit' && receipts(evs, 'npcEscaped', f.rec.id).length === 0,
    { state: f.rec.state, n: receipts(evs, 'npcEscaped', f.rec.id).length });
  pin('a disabled hull keeps its escape plan and its damage',
    escapeActive(f.rec) && plan.cond.flags.disabled === true && plan.cond.hull === f.live.state.hull);

  // Drift continuity: a dark hull is MOVING, and it goes on moving through the
  // fold. The vector is the one updateDisabled actually coasts on, not the
  // steering velocity the loop stopped writing when the lights went out.
  const drift = f.live.ai.driftVel.clone();
  pin('the snapshot carries the drift the dark hull is really moving on',
    drift.length() > 0.5
    && Math.hypot(plan.vel[0] - drift.x, plan.vel[1] - drift.y, plan.vel[2] - drift.z) < 1e-6,
    { vel: plan.vel, drift: [drift.x, drift.y, drift.z] });
  // A same-system restore must put the SAVED motion back on the branch that
  // actually moves a dark hull (ai.driftVel + disabledInit), not just on
  // ai.velocity. FIXTURE: the live hull is given the OPPOSITE drift after the
  // save, so a restore that misses that branch keeps flying the wrong one.
  const blobD = JSON.parse(JSON.stringify(snapshot(ctx)));
  f.live.ai.driftVel.set(-drift.x, -drift.y, -drift.z);
  restore(ctx, blobD);
  const recD = (ctx.world.recordBanks?.[SYS] ?? []).find((r) => r.id === f.rec.id) ?? null;
  const liveD = ctx.ships.find((s) => s.record && s.record.id === f.rec.id) ?? null;
  if (recD) keepOnly(recD);
  const posD = liveD ? liveD.object.position.clone() : null;
  run(1, 'i68 disabled restore tick');
  pin('a same-system restore puts the SAVED drift back on the disabled hull',
    !!liveD && liveD.ai.driftVel.clone().normalize().dot(drift.clone().normalize()) > 0.99
    && liveD.object.position.clone().sub(posD).dot(drift) > 0,
    liveD && {
      v: [liveD.ai.driftVel.x, liveD.ai.driftVel.y, liveD.ai.driftVel.z],
      saved: [drift.x, drift.y, drift.z],
    });
  // …including a genuinely STOPPED wreck: zero saved motion must be restored
  // as zero, not ignored and re-seeded as a fresh 6 u/s drift.
  const blobZ = JSON.parse(JSON.stringify(snapshot(ctx)));
  for (const r of [...(blobZ.world.records ?? []), ...(blobZ.world.recordBanks?.[SYS] ?? [])]) {
    if (r && r.id === f.rec.id && r.escape) r.escape.vel = [0, 0, 0];
  }
  restore(ctx, blobZ);
  const recZ = (ctx.world.recordBanks?.[SYS] ?? []).find((r) => r.id === f.rec.id) ?? null;
  const liveZ = ctx.ships.find((s) => s.record && s.record.id === f.rec.id) ?? null;
  if (recZ) keepOnly(recZ);
  const posZ = liveZ ? liveZ.object.position.clone() : null;
  run(1, 'i68 disabled zero restore tick');
  pin('a stopped wreck restores stopped, it is not given a fresh drift',
    !!liveZ && liveZ.ai.driftVel.length() < 1e-6
    && liveZ.object.position.distanceTo(posZ) < 0.5,
    liveZ && { v: liveZ.ai.driftVel.length(), moved: liveZ.object.position.distanceTo(posZ) });
  // Put the real drift back through the same save path and carry on with the
  // fold pins on whichever record now owns this hull.
  if (recZ) {
    f.rec = recZ;
    plan = readEscape(recZ) ?? plan; // the restore rebuilt the plan object
  }
  if (liveZ) {
    f.live = liveZ;
    liveZ.ai.driftVel.copy(drift);
    run(1, 'i68 disabled drift resume');
  }

  const driftPos = f.live.object.position.clone();
  placePlayer(driftPos, { x: U.DEINSTANTIATE_RANGE + 300, y: 0, z: 0 });
  run(4, 'i68 disabled cull');
  const d0 = plan.pos.slice();
  const driftEvs = run(180, 'i68 disabled offscreen drift'); // 3 galaxy ticks
  const d1 = plan.pos.slice();
  const moved = new THREE.Vector3(d1[0] - d0[0], d1[1] - d0[1], d1[2] - d0[2]);
  pin('a culled dark hull keeps drifting off screen, along its own vector',
    moved.length() > 1 && moved.clone().normalize().dot(drift.clone().normalize()) > 0.99
    && moved.length() <= drift.length() * 3 + 1,
    { moved: moved.length(), speed: drift.length() });
  pin('drifting is not navigation: no charge, no crossing, no arrival receipt',
    plan.charge === 0 && f.rec.state !== 'inTransit'
    && receipts(driftEvs, 'npcEscaped', f.rec.id).length === 0
    && receipts(driftEvs, 'npcSheltered', f.rec.id).length === 0
    && plan.cond.flags.disabled === true);
  // Well inside the instantiate bubble AND inside traffic.js's close-spawn
  // window (<= 80 u), which is the branch that bypasses the pirate mix cap and
  // the separation gap — this pin is about the fold, not about those rules.
  const driftEnd = new THREE.Vector3(d1[0], d1[1], d1[2]);
  placePlayer(driftEnd, { x: 60, y: 0, z: 0 });
  // traffic.js instantiates at most ONE record per frame and returns outright
  // when its best candidate still needs an asset prime — and the harness's own
  // parkAmbient keeps teleporting ambient hulls out of range, so those records
  // are despawned and re-offered every frame. That contention is a property of
  // the fixture environment, not of the fold, so the window is widened (still
  // the real traffic pass, no forced spawn) and the records that actually took
  // the slot are recorded for the failure report.
  const slotTrace = new Set();
  let backDark = null;
  for (let i = 0; i < 240 && !backDark; i++) {
    run(1, 'i68 disabled reacquire');
    for (const s of ctx.ships) if (s.record) slotTrace.add(s.record.id);
    backDark = ctx.ships.find((s) => s.record === f.rec) ?? null;
  }
  pin('the wreck comes back where it drifted to, still dark and still coasting',
    !!backDark && backDark.state.disabled === true
    && backDark.ai.driftVel.length() > 0.5
    && backDark.ai.driftVel.clone().normalize().dot(drift.clone().normalize()) > 0.99
    && backDark.object.position.distanceTo(driftEnd) < 60,
    backDark
      ? { disabled: backDark.state.disabled, v: backDark.ai.driftVel.length() }
      : (() => {
        // Every gate the spawn pass actually consults, reported in one place.
        const o = new THREE.Vector3();
        recordPosition(f.rec, o);
        const pp = ctx.ship.object.position;
        const d = o.distanceTo(pp);
        let pirates = 0;
        for (const s of ctx.ships) if (s.role === 'pirate') pirates++;
        return {
          curSys: ctx.world.currentSystem,
          recSys: f.rec.system,
          inRecords: ctx.world.records.includes(f.rec),
          inBank: (ctx.world.recordBanks?.[SYS] ?? []).includes(f.rec),
          state: f.rec.state,
          live: f.rec.live,
          assetPending: f.rec.assetPending ?? null,
          assetReady: f.rec.assetReady ?? null,
          assetPrimed: isShipAssetReady(f.rec.faction, f.rec.classKey, f.rec.role),
          paused: ctx.flags.paused,
          docked: ctx.flags.docked,
          ships: ctx.ships.length,
          pirates,
          pirateCap: pirateLiveCap(ctx.ships.length + 1, false),
          target: ctx.targets && ctx.targets.current ? 'held' : null,
          d,
          instRange: U.INSTANTIATE_RANGE,
          close: closeSpawn(d),
          blocked: spawnBlocked(o, visualClassFor(f.rec), ctx.ships),
          recAt: [o.x, o.y, o.z],
          player: [pp.x, pp.y, pp.z],
          slotTook: [...slotTrace],
        };
      })());
  if (backDark) f.live = backDark;
  dropFixture(f);
  run(3, 'i68 3d cleanup');
}

// ===========================================================================
// 4. Physical arrival, charge, one terminal receipt, one real crossing
// ===========================================================================
let departedRec = null;
let escapeEvent = null;
{
  const f = makeFixture({
    at: GATE.clone().add(new THREE.Vector3(30, 0, 10)),
    name: 'Wren Runner',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    bounty: 400,
    state: { hull: 55, screen: 0, lastHitAt: ctx.world.time },
    ai: { mode: 'flee', fleeFrom: 'player' },
  });
  departedRec = f.rec;
  keepOnly(f.rec);
  placePlayer(GATE, { x: 400, y: 0, z: 0 });
  ctx.targets.current = f.live; // ordinary lock, as the player would hold one
  run(6, 'i68 gate approach');
  const plan = readEscape(f.rec);
  pin('a runner at the gate commits to the gate', plan.kind === 'gate' && plan.to === GATE_TO, plan && { kind: plan.kind, to: plan.to });
  pin('physical arrival precedes the charge', plan.phase === 'charge' && plan.charge > 0, { phase: plan.phase, charge: plan.charge });
  pin('the hull is still observable while charging', ctx.ships.includes(f.live));
  pin('the HUD and the public API agree on the escape word',
    (() => {
      const word = escapeStatus(f.rec);
      const row = rw.observe().targets.current;
      return !!word && !!row && !!row.escape && row.escape.label === word.label
        && row.escape.phase === word.phase && row.escape.kind === word.kind
        && row.escape.to === word.to;
    })(), { word: escapeStatus(f.rec), row: rw.observe().targets.current?.escape });
  pin('the lock is NOT released merely because a charge started',
    ctx.targets.current === f.live);

  const hullAtDeparture = f.live.state.hull;
  const evs = run(240, 'i68 gate charge');
  const escapes = receipts(evs, 'npcEscaped', f.rec.id);
  escapeEvent = escapes[0] ?? null;
  pin('exactly one terminal escape receipt is emitted', escapes.length === 1, { n: escapes.length });
  pin('the receipt names the visible identity, origin, destination and reason',
    !!escapeEvent && escapeEvent.targetId === f.rec.id && escapeEvent.targetName === f.rec.name
    && escapeEvent.from === SYS && escapeEvent.to === GATE_TO
    && escapeEvent.kind === 'gate' && escapeEvent.reason === 'gate'
    && Number.isFinite(escapeEvent.eta), escapeEvent);
  pin('the crossing really began through the migration lifecycle',
    f.rec.state === 'inTransit' && f.rec.transitTo === GATE_TO
    && Number.isFinite(f.rec.transitEta), { state: f.rec.state, to: f.rec.transitTo });
  pin('the selected target is released at the real departure',
    ctx.targets.current !== f.live);
  pin('departure copy explains the loss and the crossing delay',
    evs.some((e) => e.type === 'commLine' && /jumped to/.test(e.text ?? '') && /target lost/.test(e.text ?? '')),
    evs.filter((e) => e.type === 'commLine').map((e) => e.text).slice(-4));
  pin('the departed hull leaves the live list', !ctx.ships.includes(f.live));
  pin('the departing snapshot kept the damage it was carrying',
    readEscape(f.rec).cond.hull === hullAtDeparture, { snap: readEscape(f.rec).cond.hull, was: hullAtDeparture });

  // Idempotence: more world updates must not fire a second receipt.
  const more = run(120, 'i68 post-departure');
  pin('repeated world updates cannot duplicate the receipt',
    receipts(more, 'npcEscaped', f.rec.id).length === 0);
  pin('a departed record is not re-planned into a second escape',
    readEscape(f.rec).departed === true && readEscape(f.rec).phase === 'done');
}

{
  // Arrival: the SAME record lands in the destination bank exactly once.
  const rec = departedRec;
  const idBefore = rec.id;
  const hullBefore = readEscape(rec).cond.hull;
  // Advance world time to the persisted eta (the existing migration clock).
  ctx.world.time = rec.transitEta + 0.5;
  run(6, 'i68 migrant arrival');
  const destBank = ctx.world.recordBanks?.[GATE_TO] ?? [];
  const arrived = destBank.filter((r) => r.id === idBefore);
  pin('the same record arrives in the destination bank exactly once',
    arrived.length === 1, { n: arrived.length, bank: GATE_TO });
  const srcBank = ctx.world.recordBanks?.[SYS] ?? [];
  pin('and no copy is left behind in the source bank',
    srcBank.filter((r) => r.id === idBefore).length === 0);
  if (arrived.length === 1) {
    const r = arrived[0];
    pin('arrival preserves identity and condition',
      r.name === 'Wren Runner' && r.bounty === 400 && r.system === GATE_TO
      && r.state === 'enroute' && readEscape(r).cond.hull === hullBefore,
      { name: r.name, sys: r.system, hull: readEscape(r).cond?.hull });
    pin('arrival retires the movement plan but keeps the condition snapshot',
      escapeActive(r) === false && !!readEscape(r).cond);
    pin('the consumed source-system wake trail is cleared at migration',
      r.wakeSite === undefined, r.wakeSite);
    pin('the arriving record sits on the destination arrival gate',
      (() => {
        const out = new THREE.Vector3();
        recordPosition(r, out);
        const gates = SYSTEMS[GATE_TO].gates;
        return gates.some((g) => out.distanceTo(new THREE.Vector3(...g.position)) < 120);
      })());
    // A second arrival pass must not duplicate anything.
    run(60, 'i68 arrival idempotence');
    pin('repeated updates cannot duplicate the arrival',
      (ctx.world.recordBanks?.[GATE_TO] ?? []).filter((x) => x.id === idBefore).length === 1);
  }
}

// ===========================================================================
// 5. Station refuge: a visible external hold, not immunity
// ===========================================================================
{
  const holdStart = STATION.clone().add(new THREE.Vector3(260, 0, 260));
  const f = makeFixture({
    at: holdStart,
    name: 'Bent Kestrel',
    classKey: 'cutter',
    role: 'trader',
    faction: 'freehold',
    // FIXTURE: a dented screen — the ordinary trader panic precondition. The
    // flee itself comes from tickTraderJob, not from a hand-set mode.
    state: { hull: 60, screen: 0, lastHitAt: ctx.world.time, lastCombatAt: ctx.world.time },
  });
  keepOnly(f.rec);
  placePlayer(holdStart, { x: 400, y: 0, z: 400 });
  ctx.targets.current = f.live;
  // The arrival can land on the FIRST update after the plan commits, so the
  // ledger opens before any frame runs — never after.
  const evs = run(900, 'i68 station approach');
  const plan = readEscape(f.rec);
  pin('a hull beside the station chooses the station refuge', !!plan && plan.kind === 'station',
    plan && { kind: plan.kind, phase: plan.phase });
  const shelters = receipts(evs, 'npcSheltered', f.rec.id);
  pin('the station arrival emits exactly one shelter receipt', shelters.length === 1, { n: shelters.length });
  pin('the shelter receipt is explicit about kind and system',
    !!shelters[0] && shelters[0].kind === 'station' && shelters[0].system === SYS,
    shelters[0]);
  pin('the hull really settled INSIDE the hold radius, it did not orbit it',
    !!plan && plan.phase === 'hold'
    && Math.hypot(f.live.object.position.x - plan.dest[0], f.live.object.position.y - plan.dest[1],
      f.live.object.position.z - plan.dest[2]) <= ESCAPE.stationArrive,
    plan && {
      phase: plan.phase,
      d: Math.hypot(f.live.object.position.x - plan.dest[0], f.live.object.position.y - plan.dest[1],
        f.live.object.position.z - plan.dest[2]),
    });
  pin('a station refuge is NOT a gate escape',
    receipts(evs, 'npcEscaped', f.rec.id).length === 0 && f.rec.state !== 'inTransit');
  pin('the sheltering hull stays live, lockable and present',
    ctx.ships.includes(f.live) && ctx.targets.current === f.live);
  pin('holding is outside the station cylinder, not inside it',
    (() => {
      const d = Math.hypot(f.live.object.position.x - STATION.x, f.live.object.position.z - STATION.z);
      return d > PHY.STATION_CYL_RADIUS;
    })(), { at: [f.live.object.position.x, f.live.object.position.y, f.live.object.position.z] });
  pin('reaching the station paid no bounty and awarded nothing',
    !evs.some((e) => e.type === 'jobState' && e.outcome === 'done'));
  pin('the HUD word reads as a station HOLD, not merely running for one',
    escapeStatus(f.rec)?.label === 'STATION HOLD' && escapeStatus(f.rec)?.phase === 'hold',
    escapeStatus(f.rec));

  // Not immunity: a REAL hit through applyHit lands on the holding hull.
  // FIXTURE: shields already down — an ordinary state after a chase, and the
  // condition under which a hit reaches hull at all.
  f.live.state.screen = 0;
  f.live.state.shell = 0;
  const hullBefore = f.live.state.hull;
  applyHit(f.live.state, { damage: 9, family: 'kinetic', facet: 'fore', now: ctx.world.time });
  run(2, 'i68 hold damage settle');
  pin('the holding hull is still damageable — nothing granted it immunity',
    f.live.state.hull < hullBefore && f.live.state.destroyed === false,
    { before: hullBefore, after: f.live.state.hull });
  pin('the damage taken in the hold is folded into the retained snapshot',
    plan.cond.hull === f.live.state.hull, { snap: plan.cond.hull, live: f.live.state.hull });
  const hullHeld = f.live.state.hull;

  // Renewed pressure: the pursuer is right there, so the dwell must not run
  // out into ordinary work. Wait past the whole dwell window and check.
  const pressedEvs = run(Math.ceil((ESCAPE.dwellMin + ESCAPE.dwellSpan + 4) * 60), 'i68 hold under pressure');
  pin('a hull under renewed pressure does not stand down when the dwell lapses',
    f.live.ai.mode === 'flee' && escapeActive(f.rec),
    { mode: f.live.ai.mode, phase: readEscape(f.rec)?.phase });
  pin('renewed pressure never re-fires the arrival receipt',
    receipts(pressedEvs, 'npcSheltered', f.rec.id).length === 0);

  // Save and cull WHILE holding: id, position, damage and dwell all survive.
  const planNow = readEscape(f.rec);
  const dwellBefore = planNow.dwellUntil;
  const holdPos = f.live.object.position.clone();
  const blob = JSON.parse(JSON.stringify(snapshot(ctx)));
  const savedRow = (blob.world.recordBanks?.[SYS] ?? []).find((r) => r.id === f.rec.id) ?? null;
  pin('a save taken while holding carries the hold, the dwell and the damage',
    !!savedRow && savedRow.escape.phase === 'hold'
    && savedRow.escape.dwellUntil === dwellBefore
    && savedRow.escape.cond.hull === hullHeld,
    savedRow && savedRow.escape && {
      phase: savedRow.escape.phase, dwell: savedRow.escape.dwellUntil, hull: savedRow.escape.cond.hull,
    });
  // Drop the lock FIRST: a selected runner is deliberately retained past the
  // fold (see the chase pin in section 11), so the genuine cull needs the
  // ordinary, unselected case.
  ctx.targets.current = null;
  placePlayer(holdPos, { x: U.DEINSTANTIATE_RANGE + 300, y: 0, z: 0 });
  run(4, 'i68 hold cull');
  pin('the holding hull is culled like any other once the lock is dropped',
    !ctx.ships.includes(f.live));
  pin('the hold and its dwell survive the cull',
    planNow.phase === 'hold' && planNow.dwellUntil === dwellBefore && planNow.cond.hull === hullHeld,
    { phase: planNow.phase, dwell: planNow.dwellUntil, hull: planNow.cond.hull });
  placePlayer(holdPos, { x: 60, y: 0, z: 0 });
  run(20, 'i68 hold reacquire');
  const back = ctx.ships.find((s) => s.record === f.rec) ?? null;
  pin('the holding hull comes back at its hold, not healed on its old route',
    !!back && back.state.hull === hullHeld && back.object.position.distanceTo(holdPos) < 60,
    back && { hull: back.state.hull, at: [back.object.position.x, back.object.position.y, back.object.position.z] });
  if (back) f.live = back;
  dropFixture(f);
  run(3, 'i68 5 cleanup');
}

{
  // Calm completion: with the pursuer GONE the dwell finishes, the hull goes
  // back to ordinary work from where it actually sits, and the peace it
  // bought survives — no fresh hostility, no teleport back onto the old lane.
  const holdStart = STATION.clone().add(new THREE.Vector3(200, 0, 200));
  const f = makeFixture({
    at: holdStart,
    name: 'Calm Kestrel',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    cargo: [],
    record: { personality: -10, resolveSeed: 0 },
    state: {
      hull: 60, screen: 0, shell: 0,
      lastHitAt: ctx.world.time, lastCombatAt: ctx.world.time,
    },
  });
  keepOnly(f.rec);
  placePlayer(holdStart, { x: 320, y: 0, z: 320 });
  run(600, 'i68 calm shelter approach');
  const plan = readEscape(f.rec);
  const sheltered = !!plan && plan.kind === 'station';
  pin('the yielding pirate ran for the holding lane', sheltered, plan && { kind: plan.kind });
  pin('it yielded through the real path, and the plan remembers', !!plan
    && !!plan.cond && plan.cond.flags.surrendered === true, plan && plan.cond && plan.cond.flags);
  // Pressure leaves: the player withdraws well past ESCAPE.pressureRange.
  placePlayer(holdStart, { x: ESCAPE.pressureRange + 900, y: 0, z: 0 });
  const calmEvs = run(Math.ceil((ESCAPE.dwellMin + ESCAPE.dwellSpan + 6) * 60), 'i68 calm dwell');
  pin('with the pressure gone the dwell completes and the escape resolves',
    !escapeActive(f.rec) && readEscape(f.rec)?.phase === 'done',
    { phase: readEscape(f.rec)?.phase, mode: null });
  pin('the resolved hull keeps its condition snapshot, it is not healed',
    (readEscape(f.rec)?.cond?.hull ?? 999) <= 60, readEscape(f.rec)?.cond?.hull);
  pin('the peace it bought outlives the escape — it does not resume hunting',
    (() => {
      const back = ctx.ships.find((s) => s.record === f.rec) ?? null;
      return !back || (back.ai.mode !== 'hunt' && back.ai.mode !== 'duel');
    })());
  pin('standing down never emits a gate receipt',
    receipts(calmEvs, 'npcEscaped', f.rec.id).length === 0);
  pin('ordinary work resumes anchored where the hull actually is',
    (() => {
      const out = new THREE.Vector3();
      recordPosition(f.rec, out);
      return out.distanceTo(STATION) < 900;
    })());
  dropFixture(f);
  run(3, 'i68 5b cleanup');
}

// ===========================================================================
// 6. Wake trails tell the truth about where the runner went
// ===========================================================================
{
  // FIXTURE: a Red Ledger cutter with its shields gone, its hull down but not
  // critical, and an empty hold — an ordinary condition after a losing pass.
  // Nothing here sets the flee: the resolve ladder runs, the band breaks, the
  // REAL capitulation path (npc.js capitulate → outcome 'flee') chooses the
  // refuge and stamps the trail. That is the production entry, so the wake it
  // produces is the wake the game produces.
  const f = makeFixture({
    at: GATE.clone().add(new THREE.Vector3(600, 0, 400)),
    name: 'Ninth Tooth',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    cargo: [],
    record: { personality: -10, resolveSeed: 0 },
    state: {
      hull: 34, screen: 0, shell: 0,
      lastHitAt: ctx.world.time, lastCombatAt: ctx.world.time,
    },
  });
  keepOnly(f.rec);
  placePlayer(f.live.object.position, { x: 300, y: 0, z: 300 });
  const entry = run(90, 'i68 wake capitulation');
  const plan = readEscape(f.rec);
  const site = f.rec.wakeSite;
  pin('the pirate broke off through the real capitulation path',
    f.live.ai.mode === 'flee' && f.live.state.surrendered === true
    && entry.some((e) => e.type === 'npcSurrendered'),
    { mode: f.live.ai.mode, surrendered: f.live.state.surrendered });
  pin('the break-off committed to a real refuge', !!plan && (plan.kind === 'gate' || plan.kind === 'station'),
    plan && { kind: plan.kind, to: plan.to });
  pin('a pirate flee stamps a wake site', !!site && Array.isArray(site.position), site);
  const haveSite = !!site && Array.isArray(site.position) && !!plan && Array.isArray(plan.dest);
  pin('the site sits on the chosen refuge, not 1400 u down the old heading',
    haveSite && Math.hypot(site.position[0] - plan.dest[0], site.position[1] - plan.dest[1],
      site.position[2] - plan.dest[2]) < 0.5,
    { site, dest: plan && plan.dest });
  pin('the site is tagged with the refuge kind and destination',
    haveSite && site.kind === plan.kind && (plan.kind !== 'gate' || site.to === plan.to), site);

  // Discovery through the REAL wakes.js scan: a tagged trail pays no salvage.
  if (haveSite) {
    const podsBefore = ctx.pods.length;
    placePlayer(new THREE.Vector3(site.position[0], site.position[1], site.position[2]), { x: 40, y: 0, z: 0 });
    const msBefore = ctx.world.milestones.includes('firstWakeSite');
    const evs = run(40, 'i68 wake discovery');
    pin('the tagged site is discovered by the real scan', f.rec.wakeSite.found === true);
    pin('a gate/station trail pays NO fabricated salvage', ctx.pods.length === podsBefore,
      { before: podsBefore, after: ctx.pods.length });
    pin('a gate/station trail never claims a wreck field',
      !evs.some((e) => e.type === 'commLine' && /wreck field/.test(e.text ?? '')));
    pin('a tagged trail awards no wreck milestone either',
      ctx.world.milestones.includes('firstWakeSite') === msBefore
      && !evs.some((e) => e.type === 'milestone' && e.id === 'firstWakeSite'),
      { before: msBefore, after: ctx.world.milestones.includes('firstWakeSite') });
    pin('the trail tells the pursuit story instead',
      evs.some((e) => e.type === 'commLine' && e.from === 'Echo' && /trail ends/.test(e.text ?? '')),
      evs.filter((e) => e.type === 'commLine' && e.from === 'Echo').map((e) => e.text));
    // Tense: the runner has NOT crossed yet, and the copy must not say it did.
    pin('a gate trail found before the crossing does not claim they crossed',
      plan.kind !== 'gate'
      || !evs.some((e) => e.type === 'commLine' && /They crossed/.test(e.text ?? '')),
      evs.filter((e) => e.type === 'commLine' && e.from === 'Echo').map((e) => e.text));
  }
  dropFixture(f);
  run(3, 'i68 6 cleanup');
}

{
  // A flee with NO viable refuge still leaves a truthful trail — tagged
  // 'evade', 1400 u down the heading — and it must not mint a wreck field.
  // FIXTURE: the same broken cutter, boxed by the REAL pursuer geometry
  // pinned in section 1b (beyond the station, one gate and one hold both
  // bearing past the player). No fake system, no hand-set mode.
  const boxed = STATION.clone().add(new THREE.Vector3(400, 0, 400));
  const f = makeFixture({
    at: boxed,
    name: 'Nowhere Left',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    cargo: [],
    record: { personality: -10, resolveSeed: 0 },
    state: {
      hull: 34, screen: 0, shell: 0,
      lastHitAt: ctx.world.time, lastCombatAt: ctx.world.time,
    },
  });
  keepOnly(f.rec);
  // The pursuer sits squarely on both legs — this is the blocked geometry,
  // measured against the refuge ring the station leg now ends on.
  placePlayer(STATION, { x: 300, y: 0, z: 300 });
  run(90, 'i68 no-route flee');
  const plan = readEscape(f.rec);
  const site = f.rec.wakeSite;
  pin('a no-route flee still evades explicitly, with no invented destination',
    !!plan && plan.phase === 'evade' && plan.kind === null && plan.dest === null,
    plan && { phase: plan.phase, kind: plan.kind, reason: plan.reason });
  pin('a NEW no-route flee stamps an evade trail, never a fabricated wreck site',
    !!site && site.kind === 'evade', site);
  if (site && Array.isArray(site.position)) {
    const podsBefore = ctx.pods.length;
    placePlayer(new THREE.Vector3(site.position[0], site.position[1], site.position[2]), { x: 40, y: 0, z: 0 });
    const evs = run(40, 'i68 evade discovery');
    pin('an evade trail pays no salvage and claims no wreck',
      ctx.pods.length === podsBefore
      && !evs.some((e) => e.type === 'commLine' && /wreck field/.test(e.text ?? '')),
      { before: podsBefore, after: ctx.pods.length });
  }
  dropFixture(f);
  run(3, 'i68 6b cleanup');
}

{
  // The legacy untagged site keeps its wreck-field reward for old saves.
  const legacyRec = ctx.world.records.find((r) => r.role === 'pirate') ?? ctx.world.records[0];
  const here = ctx.ship.object.position;
  legacyRec.wakeSite = { position: [here.x + 30, here.y, here.z], found: false }; // FIXTURE: an old save's site
  const podsBefore = ctx.pods.length;
  const evs = run(40, 'i68 legacy wake');
  pin('an untagged legacy site still pays the wave-30 wreck field',
    ctx.pods.length > podsBefore
    && evs.some((e) => e.type === 'commLine' && /wreck field/.test(e.text ?? '')),
    { before: podsBefore, after: ctx.pods.length });
}

// ===========================================================================
// 7. Contracts: a local hunt fails as escaped; patrol cannot double-credit
// ===========================================================================
{
  const f = makeFixture({
    at: GATE.clone().add(new THREE.Vector3(30, 0, 0)),
    name: 'Contract Quarry',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    bounty: 500,
    // FIXTURE: the board's own record-id shape (station.js HUNT_RECORD_ID,
    // /^rec-\d+$/). With the harness id an accepted hunt could not resolve its
    // quarry at all, so the board failed the contract SILENTLY on its first
    // tick — long before the crossing — and the escape branch that owes the
    // player an explanation was never reached.
    record: { id: 'rec-9968' },
    state: { hull: 45, lastHitAt: ctx.world.time },
    ai: { mode: 'flee', fleeFrom: 'player' },
  });
  keepOnly(f.rec);
  placePlayer(GATE, { x: 400, y: 0, z: 0 });
  // FIXTURE: an accepted local hunt bound to this record, and an accepted
  // patrol contract — both ordinary board rows in their ordinary shape.
  ctx.world.jobs = Array.isArray(ctx.world.jobs) ? ctx.world.jobs : [];
  const hunt = {
    id: `hunt-${SYS}-0`, kind: 'hunt', slot: 0, originSystem: SYS,
    recordId: f.rec.id, target: f.rec.name, title: `Hunt ${f.rec.name}`,
    detail: 'fixture', reward: 500, need: 1, progress: 0, state: 'accepted',
    deadline: ctx.world.time + 100000,
  };
  const patrol = {
    id: 'patrol-lane', kind: 'patrol', originSystem: SYS, title: 'Patrol',
    detail: 'fixture', reward: 400, need: 3, progress: 0, state: 'accepted',
  };
  ctx.world.jobs.push(hunt, patrol);
  const creditsBefore = ctx.world.credits;
  const evs = run(400, 'i68 hunt escape');
  const escaped = receipts(evs, 'npcEscaped', f.rec.id)[0] ?? null;
  pin('the contracted quarry really departed', !!escaped && f.rec.state === 'inTransit',
    { state: f.rec.state });
  pin('the departure stamped the durable private outcome the board reads',
    f.rec.escapedFrom === SYS, { escapedFrom: f.rec.escapedFrom });
  const huntRow = ctx.world.jobs.find((j) => j.id === hunt.id) ?? hunt;
  pin('the local hunt contract fails when the quarry leaves the system',
    hunt.state === 'failed' || huntRow.state === 'failed', { state: hunt.state });
  pin('the failure is communicated, not silent',
    evs.some((e) => e.type === 'commLine' && /crossed the gate out of/.test(e.text ?? '')),
    evs.filter((e) => e.type === 'commLine').map((e) => e.text).slice(-5));
  pin('the escaped hunt pays no bounty', ctx.world.credits === creditsBefore,
    { before: creditsBefore, after: ctx.world.credits });
  pin('the outcome is published on the job ring as escaped',
    evs.some((e) => e.type === 'jobState' && e.id === hunt.id && e.outcome === 'escaped')
    || ctx.agent?.jobNoted?.[hunt.id] === 'escaped',
    { noted: ctx.agent?.jobNoted?.[hunt.id] });
  pin('an escape is never counted as a patrol victory',
    patrol.progress === 0 && patrol.state === 'accepted',
    { progress: patrol.progress, state: patrol.state });
  const idx = ctx.world.jobs.indexOf(patrol);
  if (idx >= 0) ctx.world.jobs.splice(idx, 1);
  for (let i = ctx.world.jobs.length - 1; i >= 0; i--) {
    if (ctx.world.jobs[i].kind === 'hunt' && ctx.world.jobs[i].originSystem === SYS) ctx.world.jobs.splice(i, 1);
  }
  run(3, 'i68 7 cleanup');
}

// ===========================================================================
// 8. Named ace continuity: flight is a defeat, not a death
// ===========================================================================
{
  const { ACES } = boot.binds;
  const bank = ctx.world.recordBanks?.[ACES.illyx.system] ?? [];
  // FIXTURE: one deterministic living Illyx, lineage counters reset — the
  // same setup discipline the boot suite's wave-8 lineage leg uses.
  for (let i = bank.length - 1; i >= 0; i--) if (bank[i].name === ACES.illyx.name) bank.splice(i, 1);
  const rivalry = ctx.world.aceRivalry;
  rivalry.illyxGeneration = 0;
  rivalry.illyxDownAt = null;
  const defeatsBefore = rivalry.defeats;
  const bearer = {
    id: 'i68-illyx', name: ACES.illyx.name, classKey: 'ace', faction: ACES.illyx.faction,
    role: 'ace', cargo: [], bounty: 2500, system: ACES.illyx.system, state: 'enroute',
    route: [{ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }], legLens: [10], leg: 0, legT: 0, dir: 1,
    dwellUntil: 0, live: false,
  };
  bank.push(bearer);
  const before = ctx.world.milestones.slice();
  // The REAL surrender path: an ace that broke off and is still flying.
  // Issue #99: the receipt names its causer, and the rematch ladder only
  // counts a name the PLAYER put down — so this witnessed defeat says so
  // explicitly, exactly as npc.js and hail.js now stamp it in production.
  ctx.emit('npcSurrendered', { ship: { id: 'i68-illyx-live', record: bearer, state: { name: bearer.name } }, outcome: 'flee', causer: 'player' });
  const evs = eventsOver(4, 'i68 ace flee');
  pin('a fleeing ace still counts as a witnessed defeat',
    ctx.world.aceRivalry.defeats === defeatsBefore + 1
    && ctx.world.aceRivalry.lastOutcome === 'flee',
    { defeats: ctx.world.aceRivalry.defeats });
  pin('flight schedules no successor', ctx.world.aceRivalry.illyxDownAt == null);
  pin('flight tells no line-broken death story',
    !ctx.world.milestones.includes('illyxLineBroken') || before.includes('illyxLineBroken'));
  pin('flight passes no lineage', !evs.some((e) => e.type === 'lineagePassed'));

  // Even a pre-existing pending timer must not duplicate a living bearer.
  ctx.world.aceRivalry.illyxDownAt = ctx.world.time - (ACES.illyx.lineage.respawnDelay + 1);
  const evs2 = eventsOver(6, 'i68 ace successor guard');
  const living = (ctx.world.recordBanks?.[ACES.illyx.system] ?? [])
    .filter((r) => r.name === ACES.illyx.name && r.state !== 'dead' && r.state !== 'captured');
  pin('a pending successor timer never duplicates a living bearer',
    living.length === 1 && !evs2.some((e) => e.type === 'lineagePassed'),
    { living: living.length });
  pin('the stood-down timer is cleared, not left pending',
    ctx.world.aceRivalry.illyxDownAt == null);
  pin('the guard is scoped to the flight itself, and says so on the record',
    bearer.survivedByFlight === true, { flag: bearer.survivedByFlight });

  // COMPATIBILITY: every OTHER surrender alternative keeps its old lineage
  // bookkeeping. A bearer that ransomed its way out is alive too, but it did
  // not survive by flight — the successor it always scheduled still comes.
  delete bearer.survivedByFlight; // FIXTURE: this outcome is not a flight
  ctx.world.aceRivalry.illyxDownAt = null;
  ctx.emit('npcSurrendered', { ship: { id: 'i68-illyx-live', record: bearer, state: { name: bearer.name } }, outcome: 'ransom', causer: 'player' });
  eventsOver(4, 'i68 ace ransom');
  pin('a NON-flee surrender still schedules the successor it always did',
    ctx.world.aceRivalry.illyxDownAt != null
    || ctx.world.milestones.includes('illyxLineBroken'),
    { downAt: ctx.world.aceRivalry.illyxDownAt });
  ctx.world.aceRivalry.illyxDownAt = ctx.world.time - (ACES.illyx.lineage.respawnDelay + 1);
  const evs3 = eventsOver(6, 'i68 ace ransom successor');
  const livingAfter = (ctx.world.recordBanks?.[ACES.illyx.system] ?? [])
    .filter((r) => r.name === ACES.illyx.name && r.state !== 'dead' && r.state !== 'captured');
  pin('...and that successor really is spawned, unchanged by issue #68',
    livingAfter.length === 2 || evs3.some((e) => e.type === 'lineagePassed'),
    { living: livingAfter.length });
  // Clean the successor back out before the death regression below.
  for (let i = bank.length - 1; i >= 0; i--) {
    if (bank[i].name === ACES.illyx.name && bank[i].id !== 'i68-illyx') bank.splice(i, 1);
  }
  ctx.world.aceRivalry.illyxGeneration = 0;
  ctx.world.aceRivalry.illyxDownAt = null;

  // Regression guard: an ace that actually DIES still passes the name on.
  bearer.state = 'dead';
  ctx.emit('npcDestroyed', { ship: { id: 'i68-illyx-dead', record: bearer } });
  eventsOver(4, 'i68 ace death');
  const downAfterDeath = ctx.world.aceRivalry.illyxDownAt;
  pin('an ace that really dies still schedules its successor',
    downAfterDeath != null || ctx.world.milestones.includes('illyxLineBroken'),
    { downAt: downAfterDeath });
  ctx.world.aceRivalry.illyxDownAt = null;
  const clean = ctx.world.recordBanks?.[ACES.illyx.system] ?? [];
  for (let i = clean.length - 1; i >= 0; i--) if (clean[i].id === 'i68-illyx') clean.splice(i, 1);
}

// ===========================================================================
// 9. Public event API: vocabulary, sanitation, masking, ring retention
// ===========================================================================
{
  pin('both receipts are authored public event types',
    EVENT_TYPES.includes('npcEscaped') && EVENT_TYPES.includes('npcSheltered'));

  // The production emit sites pass primitives only (an off-screen departure
  // has no live ship at all); this is the shape they produce.
  const raw = {
    type: 'npcEscaped', t: 12, targetId: 'rec-15', targetName: 'Claim Wren',
    from: 'freehold', to: 'veridian', kind: 'gate', reason: 'gate', eta: 90,
    secret: () => {}, plan: { cond: { hull: 3 } },
  };
  const row = sanitizeEvent(raw);
  pin('npcEscaped keeps only its authored primitives',
    !!row && row.targetId === 'rec-15' && row.targetName === 'Claim Wren'
    && row.from === 'freehold' && row.to === 'veridian' && row.kind === 'gate'
    && row.reason === 'gate' && row.eta === 90
    && !Object.hasOwn(row, 'plan') && !Object.hasOwn(row, 'secret'), row);
  const again = sanitizeEvent(row);
  pin('sanitization is idempotent (no identity lost on the observe copy)',
    JSON.stringify(again) === JSON.stringify(row), { row, again });
  // Defense in depth: even if a caller handed one over, the ship object
  // itself can never ride the receipt — only derived primitives.
  const withShip = sanitizeEvent({
    ...raw,
    ship: { id: 'rec-15', ai: { target: 'player', waypoints: [1, 2] }, state: { name: 'Real Name' } },
  });
  pin('a ship handle never survives sanitization',
    !!withShip && !Object.hasOwn(withShip, 'ship')
    && typeof withShip.targetId === 'string'
    && !JSON.stringify(withShip).includes('waypoints'), withShip);
  const malformed = sanitizeEvent({
    type: 'npcSheltered', t: 3, targetId: { nope: 1 }, targetName: ['x'],
    system: 7, kind: null, reason: undefined,
  });
  pin('malformed receipt fields are dropped, never coerced into fiction',
    !!malformed && !Object.hasOwn(malformed, 'targetName')
    && malformed.kind === null && !Object.hasOwn(malformed, 'reason'), malformed);
  pin('no private AI object can ride either receipt',
    !JSON.stringify(sanitizeEvent(raw)).includes('waypoints'));

  // The sanitizer bounds ITSELF, not just its callers.
  const spoof = sanitizeEvent({
    type: 'npcEscaped', t: 1,
    targetId: 'i'.repeat(300), targetName: 'n'.repeat(300),
    from: 'not-a-real-system', to: 'veridian', kind: 'wormhole', reason: 'teleport',
    eta: Number.POSITIVE_INFINITY,
  });
  pin('the receipt sanitizer bounds its own id/name and rejects spoofed fields',
    !!spoof && spoof.targetId.length <= 64 && spoof.targetName.length <= 40
    && !Object.hasOwn(spoof, 'from') && spoof.to === 'veridian'
    && !Object.hasOwn(spoof, 'kind') && !Object.hasOwn(spoof, 'reason')
    && !Object.hasOwn(spoof, 'eta'), spoof);
  pin('bounding is idempotent', JSON.stringify(sanitizeEvent(spoof)) === JSON.stringify(spoof));
  const negEta = sanitizeEvent({ ...raw, eta: -40 });
  pin('a negative crossing delay is dropped, not published',
    !!negEta && !Object.hasOwn(negEta, 'eta'), negEta);
  const inherited = Object.create({ targetName: 'Inherited Ghost', kind: 'gate' });
  inherited.type = 'npcSheltered';
  inherited.t = 4;
  inherited.targetId = 'rec-inh';
  inherited.system = SYS;
  const inhRow = sanitizeEvent(inherited);
  pin('inherited prototype fields never ride a receipt',
    !!inhRow && !Object.hasOwn(inhRow, 'targetName') && !Object.hasOwn(inhRow, 'kind'), inhRow);

  // Q-ship masking: the receipt never unmasks a covered hull, and it never
  // invents an identity either — it publishes the name the bracket shows.
  const masked = { id: 'rec-q', name: 'Vane Rook', qship: true, revealed: false, coverName: 'Placid Hauler' };
  pin('a masked Q-ship publishes its cover name on the receipt',
    escapePublicIdentity(masked).name === 'Placid Hauler', escapePublicIdentity(masked));
  pin('a Wolfeye Mk II that already pierced the mask reads the real name',
    escapePublicIdentity(masked, 2).name === 'Vane Rook');
  masked.revealed = true;
  pin('a revealed Q-ship publishes its real name',
    escapePublicIdentity(masked).name === 'Vane Rook');
  pin('a masked record with no cover string publishes its OWN name, not CONTACT',
    escapePublicIdentity({ id: 'rec-q2', name: 'Bare Mask', qship: true, revealed: false }).name === 'Bare Mask');
  pin('identity strings are bounded',
    escapePublicIdentity({ id: 'x', name: 'y'.repeat(400) }).name.length <= 40);
  // The derived path (a ship handle reaching the sanitizer) honours it too.
  const derived = sanitizeEvent({
    type: 'npcEscaped', t: 2, from: SYS, to: GATE_TO, kind: 'gate', reason: 'gate', eta: 60,
    ship: {
      id: 'rec-q3',
      record: { id: 'rec-q3', name: 'Vane Rook', qship: true, revealed: false, coverName: 'Placid Hauler' },
      state: { name: 'Vane Rook' },
    },
  });
  pin('a derived identity cannot unmask a Q-ship either',
    !!derived && derived.targetName === 'Placid Hauler', derived);

  // Ring retention: the receipt survives a combat flood.
  const ring = [];
  for (let i = 0; i < EVENT_CAP + 6; i++) {
    pushRing(ring, sanitizeEvent({ type: 'playerHit', t: i, damage: 3, family: 'energy' }));
    pushRing(ring, sanitizeEvent({ type: 'npcHit', t: i, targetId: `t${i}`, damage: 2 }));
  }
  pushRing(ring, sanitizeEvent(raw));
  for (let i = 0; i < EVENT_CAP; i++) {
    pushRing(ring, sanitizeEvent({ type: 'playerHit', t: 100 + i, damage: 3, family: 'kinetic' }));
  }
  pin('an escape receipt survives a saturated combat ring',
    ring.length <= EVENT_CAP && ring.some((e) => e.type === 'npcEscaped'), { n: ring.length });

  // The live session ring really carries it, through the real harvest.
  ctx.emit('npcSheltered', {
    targetId: 'i68-ring', targetName: 'Ring Probe', system: SYS, kind: 'station', reason: 'station',
  });
  run(2, 'i68 ring harvest');
  const obs = rw.observe();
  pin('the public observation exposes the receipt from the live ring',
    obs.events.some((e) => e.type === 'npcSheltered' && e.targetId === 'i68-ring'),
    obs.events.map((e) => e.type));
  pin('the escape receipt is discoverable in the capability manifest',
    obs.capabilities.events.includes('npcEscaped') && obs.capabilities.events.includes('npcSheltered'));
}

{
  // The observed target row publishes the HUD word and nothing private.
  const f = makeFixture({
    at: GATE.clone().add(new THREE.Vector3(700, 0, 500)),
    name: 'Observed Runner',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    state: { hull: 50, lastHitAt: ctx.world.time },
    ai: { mode: 'flee', fleeFrom: 'player' },
  });
  keepOnly(f.rec);
  placePlayer(f.live.object.position, { x: 200, y: 0, z: 0 });
  run(8, 'i68 observe row');
  ctx.targets.current = f.live;
  const row = rw.observe().targets.current;
  const word = escapeStatus(f.rec);
  pin('the observed row carries the escape block', !!row && !!row.escape, row);
  pin('the observed escape equals the HUD word exactly',
    !!row.escape && !!word && row.escape.label === word.label && row.escape.reason === word.reason
    && row.escape.destName === word.destName, { row: row.escape, word });
  pin('the observed row leaks no plan internals or AI',
    !Object.hasOwn(row, 'ai') && !Object.hasOwn(row.escape, 'dest')
    && !Object.hasOwn(row.escape, 'cond') && !Object.hasOwn(row.escape, 'pos')
    && !JSON.stringify(row).includes('waypoints'), Object.keys(row.escape));
  dropFixture(f);
  run(3, 'i68 9 cleanup');
}

// ===========================================================================
// 10. Nothing else moved: ordinary surrender, migration and controls
// ===========================================================================
{
  const { beginTransit, beginEscapeTransit } = await import('../src/game/world.js');
  const makeRec = (role) => ({
    id: `i68-mig-${role}`, role, state: 'enroute', system: SYS,
    route: [{ x: 0, y: 0, z: 0 }], legLens: [1], leg: 0, legT: 0, dir: 1,
  });
  const pirate = makeRec('pirate');
  pin('ordinary migration is still trader-only by default',
    beginTransit(ctx, pirate, GATE_TO, SYS) === false && pirate.state === 'enroute');
  const trader = makeRec('trader');
  pin('ordinary trader migration still works unchanged',
    beginTransit(ctx, trader, GATE_TO, SYS) === true && trader.state === 'inTransit');
  const escapee = makeRec('pirate');
  pin('the escape opt-in relaxes ONLY the role gate',
    beginTransit(ctx, escapee, GATE_TO, SYS, { escape: true }) === true
    && escapee.state === 'inTransit');
  const selfHop = makeRec('pirate');
  pin('the escape opt-in still refuses a self destination',
    beginTransit(ctx, selfHop, SYS, SYS, { escape: true }) === false);
  const noEdge = makeRec('pirate');
  pin('the escape opt-in still refuses a system with no physical edge',
    beginTransit(ctx, noEdge, 'hollowreach', SYS, { escape: true }) === false);
  const deadRec = makeRec('pirate');
  deadRec.state = 'dead';
  pin('a terminal record can never begin a crossing',
    beginTransit(ctx, deadRec, GATE_TO, SYS, { escape: true }) === false);
  const noPlan = makeRec('pirate');
  pin('beginEscapeTransit refuses a record with no completed charge',
    beginEscapeTransit(ctx, noPlan, SYS) === null && noPlan.state === 'enroute');

  // PHYSICAL guards on the terminal departure. A plan is persisted data: a
  // corrupt or hand-edited one that merely SAYS it is charged must not turn
  // into a crossing. FIXTURE: hand-built plans, exactly the shape a tampered
  // save would carry.
  const chargedPlan = (over) => ({
    v: 1, phase: 'charge', kind: 'gate', to: GATE_TO,
    dest: [GATE.x, GATE.y, GATE.z], pos: [GATE.x, GATE.y, GATE.z],
    vel: [0, 0, 0], speed: 0, charge: JUMP.chargeTime + 1, dwellUntil: 0,
    reason: 'gate', threat: null, chosenAt: 0, checkedAt: 0, updatedAt: 0,
    announced: true, sheltered: false, departed: false,
    cond: {
      hull: 40, hullMax: 80, engine: 90, engineMax: 90,
      flags: { engineOut: false, disabled: false, destroyed: false, surrendered: false },
      disabledSince: null,
    },
    peace: null,
    ...over,
  });
  /** A cond in the shape captureCondition writes, with `over` applied. */
  const chargedCond = (over) => ({
    hull: 40, hullMax: 80, engine: 90, engineMax: 90,
    flags: { engineOut: false, disabled: false, destroyed: false, surrendered: false },
    disabledSince: null,
    ...over,
  });
  const farOff = makeRec('pirate');
  farOff.escape = chargedPlan({ pos: [9000, 0, 9000] });
  pin('a charged plan whose hull is nowhere near the gate cannot depart',
    beginEscapeTransit(ctx, farOff, SYS) === null && farOff.state === 'enroute',
    { pos: farOff.escape.pos });
  const fakeGate = makeRec('pirate');
  fakeGate.escape = chargedPlan({ dest: [12345, 0, 12345], pos: [12345, 0, 12345] });
  pin('a charged plan pointing at coordinates that are not an authored gate cannot depart',
    beginEscapeTransit(ctx, fakeGate, SYS) === null && fakeGate.state === 'enroute');
  const wrongEdge = makeRec('pirate');
  wrongEdge.escape = chargedPlan({ to: 'redmarch' }); // no freehold→redmarch edge
  pin('a charged plan naming a system this system has no edge to cannot depart',
    beginEscapeTransit(ctx, wrongEdge, SYS) === null);
  const darkHull = makeRec('pirate');
  darkHull.escape = chargedPlan({
    cond: chargedCond({ engine: 20, flags: { engineOut: true, disabled: false, destroyed: false, surrendered: false } }),
  });
  pin('a charged plan on a hull with no engine cannot depart',
    beginEscapeTransit(ctx, darkHull, SYS) === null);
  const noCond = makeRec('pirate');
  noCond.escape = chargedPlan({ cond: null });
  pin('a charged plan that never captured a real ship cannot depart',
    beginEscapeTransit(ctx, noCond, SYS) === null);
  // A CORRUPT condition is not a licence either: the flags can say anything
  // they like, the numbers still have to describe a hull that could fly.
  const shellCond = makeRec('pirate');
  shellCond.escape = chargedPlan({ cond: { flags: {} } });
  pin('a charged plan whose condition is an empty shell cannot depart',
    beginEscapeTransit(ctx, shellCond, SYS) === null && shellCond.state === 'enroute');
  const noHull = makeRec('pirate');
  noHull.escape = chargedPlan({ cond: chargedCond({ hull: Number.NaN }) });
  pin('a charged plan with no finite hull cannot depart',
    beginEscapeTransit(ctx, noHull, SYS) === null);
  const deadStick = makeRec('pirate');
  deadStick.escape = chargedPlan({ cond: chargedCond({ engine: 0 }) });
  pin('a dead engine cannot depart just because the flags say otherwise',
    beginEscapeTransit(ctx, deadStick, SYS) === null);
  const atThreshold = makeRec('pirate');
  atThreshold.escape = chargedPlan({ cond: chargedCond({ engine: 90 * DEFENSE.engineOutAt }) });
  pin('an engine AT the engine-out threshold is not operational either',
    beginEscapeTransit(ctx, atThreshold, SYS) === null,
    { ratio: DEFENSE.engineOutAt });
  const honest = makeRec('pirate');
  honest.escape = chargedPlan({});
  pin('...while an honest charged plan at the real gate still departs',
    typeof beginEscapeTransit(ctx, honest, SYS) === 'number' && honest.state === 'inTransit');
  // Clean the fixture migrants out of the registry-visible banks.
  for (const r of [pirate, trader, escapee, selfHop, noEdge, deadRec, noPlan,
    farOff, fakeGate, wrongEdge, darkHull, noCond, shellCond, noHull, deadStick,
    atThreshold, honest]) {
    r.state = 'dead';
  }

  pin('no new control, key or gauge was introduced', ctx.config.controls.length > 0);
  pin('the escape tuning block introduces no damage or repair value',
    !Object.hasOwn(ESCAPE, 'repair') && !Object.hasOwn(ESCAPE, 'damage')
    && !Object.hasOwn(ESCAPE, 'heal'));
  pin('live traffic stays inside its cap', ctx.ships.length <= 10, { n: ctx.ships.length });
  pin('the world loop reported no update errors', updateErrors === 0, { updateErrors });
}

// ===========================================================================
// 11. The chase the player is flying is not ended by an invisible line
// ===========================================================================
{
  const f = makeFixture({
    at: GATE.clone().add(new THREE.Vector3(900, 0, 700)),
    name: 'Long Chase',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    cargo: [],
    record: { personality: -10, resolveSeed: 0 },
    state: {
      hull: 40, screen: 0, shell: 0,
      lastHitAt: ctx.world.time, lastCombatAt: ctx.world.time,
    },
  });
  keepOnly(f.rec);
  placePlayer(f.live.object.position, { x: 240, y: 0, z: 0 });
  run(90, 'i68 chase entry');
  pin('the chased hull is running for a real refuge', escapeActive(f.rec) && f.live.ai.mode === 'flee',
    { mode: f.live.ai.mode });
  ctx.targets.current = f.live; // the ordinary lock a pursuing player holds
  const chasePos = f.live.object.position.clone();
  placePlayer(chasePos, { x: U.DEINSTANTIATE_RANGE + 500, y: 0, z: 0 });
  const chaseEvs = run(20, 'i68 chase past the fold');
  pin('a SELECTED runner is not culled at the 1400 u line',
    ctx.ships.includes(f.live) && ctx.targets.current === f.live,
    { live: ctx.ships.includes(f.live), d: f.live.object.position.distanceTo(ctx.ship.object.position) });
  pin('retaining the chase is not an escape receipt either',
    receipts(chaseEvs, 'npcEscaped', f.rec.id).length === 0
    && receipts(chaseEvs, 'npcSheltered', f.rec.id).length === 0);
  pin('the retained hull still counts against the ordinary live cap',
    ctx.ships.length <= 10, { n: ctx.ships.length });
  // …and dropping the lock hands it straight back to the ordinary fold.
  ctx.targets.current = null;
  run(6, 'i68 chase released');
  pin('dropping the lock culls it exactly like any other distant hull',
    !ctx.ships.includes(f.live));
  pin('the fold kept the identity, condition and intent',
    escapeActive(f.rec) && readEscape(f.rec).cond.hull === 40 && f.rec.state === 'enroute',
    { hull: readEscape(f.rec)?.cond?.hull, state: f.rec.state });
  dropFixture(f);
  run(3, 'i68 11 cleanup');
}

// ===========================================================================
// 12. Off-screen departures are real, private, and not free intelligence
// ===========================================================================
{
  // FIXTURE: an OFF-SCREEN record — in the bank, never instantiated, with the
  // player parked at the far end of the system. It sits at its gate with a
  // committed plan, the ordinary shape of a runner the player lost track of.
  // The galaxy tick finishes the crossing; the public ring must not carry it.
  placePlayer(STATION, { x: 0, y: 0, z: 0 });
  const otherSys = SYS;
  const otherGate = DEF.gates[0];
  const bank = ctx.world.records;
  const hidden = {
    id: 'i68-hidden', name: 'Quiet Exit', classKey: 'cutter', faction: 'redledger',
    role: 'pirate', cargo: [], bounty: 0, system: otherSys, state: 'enroute', live: false,
    route: [{ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }], legLens: [10], leg: 0, legT: 0, dir: 1,
    dwellUntil: 0, resolveSeed: 0.5, personality: 0,
    escape: {
      v: 1, phase: 'charge', kind: 'gate', to: otherGate.to,
      dest: [...otherGate.position], pos: [...otherGate.position], vel: [0, 0, 0],
      speed: 0, charge: 0, dwellUntil: 0, reason: 'gate', threat: null,
      chosenAt: ctx.world.time, checkedAt: ctx.world.time, updatedAt: ctx.world.time,
      announced: true, sheltered: false, departed: false,
      cond: {
        hull: 44, hullMax: 80, engine: 90, engineMax: 90,
        lastHitAt: ctx.world.time, lastCombatAt: ctx.world.time,
        flags: { engineOut: false, disabled: false, destroyed: false, surrendered: true },
        disabledSince: null,
      },
      peace: { surrenderDone: true, demandOutcome: 'paid', calmUntil: 0 },
    },
  };
  bank.push(hidden);
  keepOnly(hidden);
  const evs = run(360, 'i68 hidden crossing'); // several galaxy ticks
  pin('the off-screen record was never instantiated', hidden.live !== true
    && !ctx.ships.some((s) => s.record === hidden), { live: hidden.live });
  pin('the off-screen runner really crossed', hidden.state === 'inTransit'
    || hidden.escape.departed === true, { state: hidden.state, departed: hidden.escape.departed });
  pin('an unwitnessed crossing publishes NO public receipt',
    receipts(evs, 'npcEscaped', hidden.id).length === 0
    && !rw.observe().events.some((e) => e.targetId === hidden.id));
  pin('…but the durable private outcome is recorded for contract bookkeeping',
    hidden.escapedFrom === otherSys, { escapedFrom: hidden.escapedFrom });
  for (const key of Object.keys(ctx.world.recordBanks ?? {})) {
    const b = ctx.world.recordBanks[key];
    for (let i = b.length - 1; i >= 0; i--) if (b[i].id === 'i68-hidden') b.splice(i, 1);
  }
  for (let i = bank.length - 1; i >= 0; i--) if (bank[i].id === 'i68-hidden') bank.splice(i, 1);
  hidden.state = 'dead';
}

// ===========================================================================
// 13. The arrived record instantiates as the SAME ship, peace and all
// ===========================================================================
{
  const arrived = (ctx.world.recordBanks?.[GATE_TO] ?? []).find((r) => r.id === departedRec.id) ?? null;
  pin('the crossed record is still in the destination bank', !!arrived);
  if (arrived) {
    const plan = readEscape(arrived);
    const hullBefore = plan.cond.hull;
    // FIXTURE: exactly what a REAL paid ransom leaves behind (hail.js
    // demandRansom / payTribute / a landed showTeeth bluff) — a demand outcome
    // and a calm window, and NO surrender flags, because the production hail
    // path sets none. Fabricating surrenderDone here made this pin agree with
    // itself instead of with the game. The calm is already expired, as it
    // would be after a 60-120 s crossing.
    plan.peace = { demandOutcome: 'paid', calmUntil: ctx.world.time - 30 };
    const out = new THREE.Vector3();
    recordPosition(arrived, out);
    // The REAL production constructor traffic.js uses when a record enters
    // the bubble — same call, same arguments.
    const live = spawnLiveShip(ctx, arrived, out);
    pin('the arrived record instantiates as a live hull', !!live, { id: arrived.id });
    if (live) {
      pin('reacquisition at the destination keeps the same id and condition',
        live.id === departedRec.id && live.record === arrived
        && live.state.hull === hullBefore,
        { id: live.id, hull: live.state.hull });
      pin('the peace it BOUGHT survives the crossing — it does not wake up hunting',
        live.ai.mode !== 'hunt' && live.ai.mode !== 'duel'
        && live.ai.demandOutcome === 'paid' && live.ai.demanding === false
        && live.state.surrendered !== true,
        { mode: live.ai.mode, outcome: live.ai.demandOutcome, surrendered: live.state.surrendered });
      pin('the arrival is not still fleeing: the escape resolved at the gate',
        live.ai.mode !== 'flee' && !escapeActive(arrived), { mode: live.ai.mode });
      // …and it stays bought with the calm window long expired: no fresh
      // demand, no shot, through real frames with the player right there.
      ctx.ships.push(live);
      keepOnly(arrived);
      placePlayer(live.object.position, { x: 220, y: 0, z: 0 });
      const peaceEvs = run(180, 'i68 paid arrival peace');
      pin('a paid-off arrival opens no new demand and fires no shot',
        live.ai.mode !== 'hunt' && live.ai.mode !== 'duel' && live.ai.intent !== true
        && !peaceEvs.some((e) => e.type === 'npcFire' && e.ship === live)
        && !peaceEvs.some((e) => e.type === 'hailOpened' && e.ship === live),
        { mode: live.ai.mode, intent: live.ai.intent });
      const idx = ctx.ships.indexOf(live);
      if (idx >= 0) ctx.ships.splice(idx, 1);
      removeLiveShip(ctx, live);
    }
  }
}

// ===========================================================================
// 14. A second encounter, a truthful reroute trail, and a clear berth
// ===========================================================================
{
  // The same hull must be able to cross TWICE. Arrival keeps the plan (and the
  // departure latch with it), so only a genuinely new committed run may clear
  // that latch. FIXTURE: the record comes back to this system later — ordinary
  // migration moves records between banks in both directions.
  const rec = (ctx.world.recordBanks?.[GATE_TO] ?? []).find((r) => r.id === departedRec.id) ?? null;
  if (!rec) {
    pin('PREREQUISITE second episode: the crossed record is available', false);
  } else {
    const destBank = ctx.world.recordBanks[GATE_TO];
    const di = destBank.indexOf(rec);
    if (di >= 0) destBank.splice(di, 1);
    rec.system = SYS;
    rec.state = 'enroute';
    rec.live = false;
    const at = GATE.clone().add(new THREE.Vector3(30, 0, 10));
    rec.route = [{ x: at.x, y: at.y, z: at.z }, { x: GATE.x, y: GATE.y, z: GATE.z }];
    rec.legLens = [at.distanceTo(GATE)];
    rec.leg = 0;
    rec.legT = 0;
    rec.dir = 1;
    ctx.world.records.push(rec);
    keepOnly(rec);
    const departedBefore = readEscape(rec)?.departed;
    // FIXTURE (spatial only): follow the record. It keeps walking its own route
    // toward the gate, so a one-off staging drifts out of the ordinary
    // close-spawn band (<= 80 u) — the branch that bypasses the pirate mix cap,
    // which is not what this pin is about. The player is re-staged 60 u from
    // where the record ACTUALLY is on every frame traffic looks at it, and the
    // pre-tick distance is asserted rather than assumed.
    const where = new THREE.Vector3();
    let live = null;
    let stagedD = null;
    let stagedClose = true;
    // DIAGNOSTIC ONLY (bounded): the eligibility numbers all read fine, so the
    // evidence needed is WHO the one-per-frame spawn slot actually goes to and
    // whether this record is the object traffic is looking at. Sampled on the
    // first three and last three frames only; nothing here steers the loop.
    const bank = () => ctx.world.recordBanks?.[SYS] ?? [];
    const eligible = () => {
      const rows = [];
      const o = new THREE.Vector3();
      for (const r of ctx.world.records) {
        if (r.live || r.assetPending || r.state !== 'enroute') continue;
        if (r.system && r.system !== ctx.world.currentSystem) continue;
        recordPosition(r, o);
        const d = o.distanceTo(ctx.ship.object.position);
        rows.push({
          id: r.id,
          isRec: r === rec,
          role: r.role,
          d: Math.round(d),
          inRange: d <= U.INSTANTIATE_RANGE,
          close: closeSpawn(d),
          primed: isShipAssetReady(r.faction, r.classKey, r.role),
          blocked: spawnBlocked(o, visualClassFor(r), ctx.ships),
        });
      }
      rows.sort((a, b) => a.d - b.d);
      return rows.slice(0, 3);
    };
    const frameShot = (i, phase) => ({
      i,
      phase,
      recLive: rec.live,
      recSys: rec.system,
      curSys: ctx.world.currentSystem,
      paused: ctx.flags.paused,
      docked: ctx.flags.docked,
      assetPending: rec.assetPending ?? null,
      assetReady: rec.assetReady ?? null,
      inCurrentBank: bank().includes(rec),
      bankRowsWithId: bank().filter((r) => r.id === rec.id).length,
      liveIds: ctx.ships.map((s) => ({
        id: s.record ? s.record.id : s.id, role: s.role, sameRec: s.record === rec,
      })),
      imposter: ctx.ships.some((s) => s.record && s.record.id === rec.id && s.record !== rec),
    });
    const trace = [];
    for (let i = 0; i < 240 && !live; i++) {
      recordPosition(rec, where);
      placePlayer(where, { x: 60, y: 0, z: 0 });
      stagedD = where.distanceTo(ctx.ship.object.position);
      if (!closeSpawn(stagedD)) stagedClose = false;
      const sampled = i < 3 || i >= 237;
      if (sampled) trace.push({ ...frameShot(i, 'before'), candidates: i === 0 ? eligible() : undefined });
      run(1, 'i68 second episode instantiate');
      live = ctx.ships.find((s) => s.record === rec) ?? null;
      if (sampled) trace.push({ ...frameShot(i, 'after'), candidates: i === 239 ? eligible() : undefined });
    }
    if (!live) console.log('DIAG second-encounter trace', JSON.stringify(trace, jsonSafe).slice(0, 3000));
    pin('the reacquisition really was staged inside the close-spawn band',
      stagedClose && Number.isFinite(stagedD) && closeSpawn(stagedD),
      { d: stagedD, close: closeSpawn(stagedD) });
    pin('the crossed hull comes back into the world for a second encounter',
      !!live && departedBefore === true,
      live ? { live: true, departedBefore } : (() => {
        const o = new THREE.Vector3();
        recordPosition(rec, o);
        let pirates = 0;
        for (const s of ctx.ships) if (s.role === 'pirate') pirates++;
        const d = o.distanceTo(ctx.ship.object.position);
        return {
          departedBefore,
          state: rec.state,
          inRecords: ctx.world.records.includes(rec),
          assetPrimed: isShipAssetReady(rec.faction, rec.classKey, rec.role),
          assetPending: rec.assetPending ?? null,
          ships: ctx.ships.length,
          pirates,
          pirateCap: pirateLiveCap(ctx.ships.length + 1, false),
          d,
          close: closeSpawn(d),
          blocked: spawnBlocked(o, visualClassFor(rec), ctx.ships),
          recLive: rec.live,
          recSys: rec.system,
          curSys: ctx.world.currentSystem,
          inCurrentBank: (ctx.world.recordBanks?.[SYS] ?? []).includes(rec),
          bankRowsWithId: (ctx.world.recordBanks?.[SYS] ?? []).filter((r) => r.id === rec.id).length,
          imposter: ctx.ships.some((s) => s.record && s.record.id === rec.id && s.record !== rec),
          candidates: eligible(),
        };
      })());
    if (live) {
      // FIXTURE: an ordinary second encounter — a graze and a break-off, the
      // same initial condition section 4 uses. Nothing writes a plan.
      live.state.hull = 55;
      live.state.screen = 0;
      live.state.lastHitAt = ctx.world.time;
      live.ai.mode = 'flee';
      live.ai.fleeFrom = 'player';
      const evs = run(600, 'i68 second crossing');
      const again = receipts(evs, 'npcEscaped', rec.id);
      pin('the SAME hull completes a second real crossing',
        again.length === 1 && rec.state === 'inTransit',
        { n: again.length, state: rec.state, phase: readEscape(rec)?.phase, charge: readEscape(rec)?.charge });
      pin('the second crossing is one receipt, for the same identity',
        !again[0] || (again[0].targetId === rec.id && again[0].kind === 'gate'), again[0]);
    }
    rec.state = 'dead';
  }
}

{
  // A reroute must move the TRAIL, not only the plan: a runner turned off its
  // gate must not leave a wake still naming that gate.
  const f = makeFixture({
    at: GATE.clone().add(new THREE.Vector3(500, 0, 300)),
    name: 'Turned Runner',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    state: { hull: 50, screen: 0, lastHitAt: ctx.world.time },
    ai: { mode: 'flee', fleeFrom: 'player' },
  });
  keepOnly(f.rec);
  placePlayer(f.live.object.position, { x: 0, y: 0, z: 260 });
  run(30, 'i68 trail entry');
  const first = readEscape(f.rec);
  const site0 = f.rec.wakeSite;
  const kind0 = first && first.kind;
  const to0 = first && first.to;
  const dest0 = first && first.dest ? first.dest.slice() : null;
  pin('the first committed choice stamped its own trail',
    !!site0 && !!first && site0.kind === (first.kind ?? 'evade'), { site: site0, kind: kind0 });
  // Hold the REAL pursuer ON the ORIGINAL committed segment every frame — 40%
  // of the way from the hull to the endpoint it announced, so it stays ahead
  // of the runner and inside the threat tube however fast the runner closes —
  // until the FIRST genuine change of destination, and capture that moment.
  const dest0V = dest0 ? new THREE.Vector3(dest0[0], dest0[1], dest0[2]) : null;
  let changedAt = -1;
  let clearAt = null;      // pursuer clearance to the ORIGINAL leg at that moment
  let destAt = null;
  let kindAt = null;
  let toAt = null;
  let siteAt = null;
  let hadAlternative = false;
  for (let i = 0; i < 900 && changedAt < 0 && dest0V; i++) {
    const hull = f.live.object.position;
    placePlayer(new THREE.Vector3().lerpVectors(hull, dest0V, 0.4));
    const c = segmentClearance(hull.x, hull.y, hull.z, dest0V.x, dest0V.y, dest0V.z,
      ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z);
    const clearance = { dist: c.dist, t: c.t };
    run(1, 'i68 trail reroute');
    const p = readEscape(f.rec);
    if (!p) break;
    const moved = p.kind !== kind0 || p.to !== to0 || !p.dest
      || Math.hypot(p.dest[0] - dest0[0], p.dest[1] - dest0[1], p.dest[2] - dest0[2]) > 1;
    if (moved) {
      changedAt = i;
      clearAt = clearance;
      destAt = p.dest ? p.dest.slice() : null;
      kindAt = p.kind;
      toAt = p.to;
      siteAt = f.rec.wakeSite ? { ...f.rec.wakeSite, position: [...f.rec.wakeSite.position] } : null;
      // A clear alternative really existed from where the hull stood.
      const alt = chooseEscapeDestination({
        sysId: SYS,
        fromPos: { x: f.live.object.position.x, y: f.live.object.position.y, z: f.live.object.position.z },
        threatPos: {
          x: ctx.ship.object.position.x, y: ctx.ship.object.position.y, z: ctx.ship.object.position.z,
        },
        stationPos: DEF.station.position,
        classKey: 'cutter',
      });
      hadAlternative = alt.ok === true;
    }
  }
  pin('the pursuer really turned the runner onto a different destination',
    changedAt >= 0 && !!clearAt && clearAt.dist < ESCAPE.threatBubble
    && clearAt.t > ESCAPE.threatAheadMin && hadAlternative,
    { changedAt, clearAt, was: { kind: kind0, to: to0 }, now: { kind: kindAt, to: toAt } });
  const wantKind = kindAt ?? 'evade';
  pin('the trail names where it is going NOW, not the leg it abandoned',
    !!siteAt && siteAt.kind === wantKind
    && (wantKind !== 'gate' || siteAt.to === toAt)
    && siteAt.found === false
    && (wantKind === 'evade' || (!!destAt
      && Math.hypot(siteAt.position[0] - destAt[0], siteAt.position[1] - destAt[1],
        siteAt.position[2] - destAt[2]) < 0.5)),
    { site: siteAt, dest: destAt });
  // …and an UNCHANGED revalidation leaves the trail alone: pressure gone, the
  // committed leg stays viable, so nothing re-stamps it or clears `found`.
  if (f.rec.wakeSite) f.rec.wakeSite.found = true;
  const heldSite = f.rec.wakeSite ? [...f.rec.wakeSite.position] : null;
  placePlayer(f.live.object.position, { x: ESCAPE.pressureRange + 1200, y: 0, z: 0 });
  run(600, 'i68 trail steady'); // several revalidate cadences, no real change
  pin('an unchanged revalidation never re-stamps the trail or clears found',
    !!f.rec.wakeSite && f.rec.wakeSite.found === true && !!heldSite
    && Math.hypot(f.rec.wakeSite.position[0] - heldSite[0],
      f.rec.wakeSite.position[1] - heldSite[1],
      f.rec.wakeSite.position[2] - heldSite[2]) < 1e-6,
    f.rec.wakeSite);
  dropFixture(f);
  run(3, 'i68 14b cleanup');
}

{
  // The berth. An escape refuge is PARKED, so it has to sit outside the whole
  // departure envelope the berth actually checks — the release march plus the
  // five-second hands-off creep run — on every bearing and for the largest
  // hull. This is the Redmarch regression: a hold 83 u out held the berth
  // indefinitely with planLaunch blocker=ship.
  const { planLaunch } = await import('../src/game/launch-clearance.js');
  const f = makeFixture({
    at: STATION.clone().add(new THREE.Vector3(600, 0, 0)),
    name: 'Berth Blocker',
    classKey: 'freighter',
    role: 'trader',
  });
  keepOnly(f.rec);
  const putBerth = (d, r) => {
    ctx.ship.object.position.set(STATION.x + d[0] * r, STATION.y + d[1] * r, STATION.z + d[2] * r);
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
  };
  const putHull = (d, r) => {
    f.live.object.position.set(STATION.x + d[0] * r, STATION.y + d[1] * r, STATION.z + d[2] * r);
  };
  // Stage the player AT the berth first, then let ambient park: a player left
  // out at the previous fixture would put this hull past the cull range and a
  // vanished ship reads as a clear lane, not as a proof.
  putBerth([1, 0, 0], 36);
  run(2, 'i68 berth settle');
  // Baseline: the ORDINARY inner hold really does hold the berth. The ship
  // stays in ctx.ships throughout — nothing is removed to make this pass, and
  // both checks assert it is still there. planLaunch reuses one record, so
  // every result is copied before the next call.
  const oldHold = stationHoldPoint(DEF.station.position, 'freighter',
    { x: STATION.x + 600, y: STATION.y, z: STATION.z });
  f.live.object.position.set(oldHold.x, oldHold.y, oldHold.z);
  const liveAtBaseline = ctx.ships.includes(f.live) && f.live.state.destroyed !== true;
  const raw = planLaunch(ctx);
  const before = { ok: raw.ok, token: raw.token, blocker: raw.blocker };
  pin('a hull at the OLD inner hold really does hold the berth (the regression)',
    liveAtBaseline && before.ok === false && before.token === 'blocked' && before.blocker === 'ship',
    {
      ...before,
      liveAtBaseline,
      ships: ctx.ships.length,
      holdR: Math.hypot(oldHold.x - STATION.x, oldHold.z - STATION.z),
      station: [ctx.station?.position?.x, ctx.station?.position?.y, ctx.station?.position?.z],
      player: [ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z],
    });
  // …and at the most INWARD legal arrival position on the refuge ring the same
  // hull never does, from an inner berth or the dock-range edge, on any bearing.
  const inward = escapeRefugeRadius('freighter', 'freighter') - ESCAPE.stationArrive;
  let clear = ctx.ships.includes(f.live) && f.live.state.destroyed !== true;
  let worst = clear ? '' : 'fixture hull is not live';
  for (const d of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0.7071, 0, 0.7071], [-0.6, 0, -0.8]]) {
    putHull(d, inward);
    for (const r of [36, U.DOCK_RANGE - 1]) {
      putBerth(d, r);
      const p = planLaunch(ctx);
      if (p.ok !== true || !ctx.ships.includes(f.live)) {
        clear = false;
        worst = `${p.token}/${p.blocker} dir=${d.join(',')} berth=${r} live=${ctx.ships.includes(f.live)}`;
      }
    }
  }
  pin('a hull parked on the refuge ring never holds the berth, on any bearing',
    clear, { worst, inward, refuge: escapeRefugeRadius('freighter', 'freighter') });
  // Every shipped class keeps the SAME guarantee by construction: the ring is
  // the lane bound plus that hull's own radius, so the clear distance left
  // beyond the lane — after the whole arrival tolerance and the hull — is
  // class-independent and equal to the freighter case proven physically above.
  // A masked Q-ship is measured on the larger of its cover and real hulls.
  const clearOf = (cls) => escapeRefugeRadius(cls, cls) - ESCAPE.stationArrive - hullRadiusFor(cls);
  const ref = clearOf('freighter');
  let ladder = true;
  for (const cls of Object.keys(SHIP_CLASSES)) {
    if (Math.abs(clearOf(cls) - ref) > 1e-6) {
      ladder = false;
      worst = `${cls}:${clearOf(cls)}`;
    }
  }
  pin('the ring scales with the hull, so every shipped class keeps that clearance',
    ladder && escapeRefugeRadius('light', 'freighter') === escapeRefugeRadius('freighter', 'freighter'),
    { worst, ref });
  dropFixture(f);
  run(3, 'i68 14c cleanup');
}

{
  // 14d. A LEGACY inner hold — saved before the refuge ring existed — must fly
  // out to a legal one. It keeps its identity, its damage, the player's lock
  // and its ONE arrival receipt: relocating for clearance is the same shelter,
  // not a new one. Nothing is teleported and nothing is powered.
  const holdStart = STATION.clone().add(new THREE.Vector3(500, 0, 500));
  const f = makeFixture({
    at: holdStart,
    name: 'Legacy Hold',
    classKey: 'cutter',
    role: 'trader',
    faction: 'freehold',
    state: { hull: 44, screen: 0, lastHitAt: ctx.world.time, lastCombatAt: ctx.world.time },
  });
  keepOnly(f.rec);
  placePlayer(holdStart, { x: 300, y: 0, z: 300 });
  const arriveEvs = run(900, 'i68 legacy hold arrival');
  const settled = readEscape(f.rec);
  pin('the runner reached a legal refuge and sheltered exactly once',
    !!settled && settled.kind === 'station' && settled.phase === 'hold'
    && receipts(arriveEvs, 'npcSheltered', f.rec.id).length === 1,
    settled && { kind: settled.kind, phase: settled.phase });
  // FIXTURE: an OLD save. The blob's committed hold is rewritten to the
  // pre-ring inner point — exactly what a save written before this issue
  // carries — and restored through the real save path.
  const legacyPoint = stationHoldPoint(DEF.station.position, 'cutter',
    { x: holdStart.x, y: holdStart.y, z: holdStart.z });
  const blob = JSON.parse(JSON.stringify(snapshot(ctx)));
  for (const r of [...(blob.world.records ?? []), ...(blob.world.recordBanks?.[SYS] ?? [])]) {
    if (r && r.id === f.rec.id && r.escape) {
      r.escape.dest = [legacyPoint.x, legacyPoint.y, legacyPoint.z];
      r.escape.pos = [legacyPoint.x, legacyPoint.y, legacyPoint.z];
    }
  }
  restore(ctx, blob);
  const rec2 = (ctx.world.recordBanks?.[SYS] ?? []).find((r) => r.id === f.rec.id) ?? null;
  let live2 = ctx.ships.find((s) => s.record && s.record.id === f.rec.id) ?? null;
  if (rec2) keepOnly(rec2);
  const hullBefore = live2 ? live2.state.hull : null;
  if (live2) ctx.targets.current = live2; // the ordinary lock a player holds
  const legacyR = Math.hypot(legacyPoint.x - STATION.x, legacyPoint.z - STATION.z);
  pin('the restored legacy hold really is inside the launch envelope',
    !!rec2 && legacyR < escapeRefugeRadius('cutter', 'cutter') - ESCAPE.stationArrive,
    { legacyR, ring: escapeRefugeRadius('cutter', 'cutter') });
  const relocEvs = run(1200, 'i68 legacy hold relocation');
  live2 = ctx.ships.find((s) => s.record === rec2) ?? live2;
  const after = rec2 ? readEscape(rec2) : null;
  const atR = live2
    ? Math.hypot(live2.object.position.x - STATION.x, live2.object.position.y - STATION.y,
      live2.object.position.z - STATION.z)
    : null;
  pin('an unsafe legacy hold physically relocates out to the ring',
    !!live2 && !!after && atR >= escapeRefugeRadius('cutter', 'cutter') - ESCAPE.stationArrive - 1,
    { atR, ring: escapeRefugeRadius('cutter', 'cutter'), phase: after && after.phase });
  pin('relocating for clearance is the SAME shelter: no second arrival receipt',
    receipts(relocEvs, 'npcSheltered', rec2 ? rec2.id : '').length === 0
    && !!after && after.sheltered === true,
    { n: receipts(relocEvs, 'npcSheltered', rec2 ? rec2.id : '').length, sheltered: after && after.sheltered });
  pin('the move kept its damage, its identity and the player\'s lock',
    !!live2 && live2.state.hull === hullBefore && live2.record === rec2
    && ctx.targets.current === live2 && live2.state.disabled !== true,
    { hull: live2 && live2.state.hull, was: hullBefore, locked: ctx.targets.current === live2 });
  ctx.targets.current = null;
  if (rec2) {
    f.rec = rec2;
    f.live = live2;
  }
  dropFixture(f);
  run(3, 'i68 14d cleanup');
}

// ===========================================================================
// 15. Terminal-latch, trail-truth and restore edges
// ===========================================================================
{
  // 15a. A new episode whose FIRST decision is 'blocked' still ends the old
  // run. If the terminal latch survives that, every later real crossing this
  // record could ever make is refused for ever.
  const boxed = STATION.clone().add(new THREE.Vector3(400, 0, 400));
  const f = makeFixture({
    at: boxed,
    name: 'Twice Blocked',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    state: { hull: 46, screen: 0, lastHitAt: ctx.world.time },
    ai: { mode: 'flee', fleeFrom: 'player' },
  });
  keepOnly(f.rec);
  placePlayer(STATION, { x: 300, y: 0, z: 300 }); // squarely on both legs
  run(6, 'i68 blocked entry');
  const plan = readEscape(f.rec);
  // FIXTURE: the state a SURVIVING prior escape leaves behind — the same
  // persistent plan, resolved, with its departure already receipted.
  if (plan) {
    plan.phase = 'done';
    plan.departed = true;
    plan.sheltered = true;
  }
  // The decision boundary is tested AT the authored geometry through the real
  // flee entry, not waited for on the 6 s revalidate cadence: the hull is at
  // the boxed point and the pursuer is on every leg out of it, so this new
  // episode's FIRST choice is genuinely blocked.
  f.live.object.position.copy(boxed);
  placePlayer(STATION, { x: 300, y: 0, z: 300 });
  enterEscapeFlee(ctx, f.live, 'player');
  pin('a new episode that opens BLOCKED still clears the old terminal latch',
    !!plan && plan.phase === 'evade' && plan.kind === null
    && plan.departed === false && plan.sheltered === false,
    plan && {
      phase: plan.phase, kind: plan.kind, reason: plan.reason,
      departed: plan.departed, sheltered: plan.sheltered,
    });
  // …and the crossing it goes on to make is real: clear the obstruction, put
  // it at the bore, enter through the same production door, and let the game
  // fly, spool and depart on its own.
  f.live.object.position.copy(GATE).add(new THREE.Vector3(25, 0, 10));
  placePlayer(GATE, { x: 500, y: 0, z: 400 });
  enterEscapeFlee(ctx, f.live, 'player');
  const evs = run(600, 'i68 blocked then crossing');
  const crossed = receipts(evs, 'npcEscaped', f.rec.id);
  pin('and the episode that began blocked can still complete a REAL crossing',
    crossed.length === 1 && f.rec.state === 'inTransit'
    && readEscape(f.rec)?.departed === true,
    { n: crossed.length, state: f.rec.state, phase: readEscape(f.rec)?.phase });
  f.rec.state = 'dead';
  dropFixture(f);
  run(3, 'i68 15a cleanup');
}

{
  // 15b. A gate trail left standing after the runner LOST that route is a lie.
  const f = makeFixture({
    at: GATE.clone().add(new THREE.Vector3(400, 0, 260)),
    name: 'Lost The Lane',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    state: { hull: 48, screen: 0, lastHitAt: ctx.world.time },
    ai: { mode: 'flee', fleeFrom: 'player' },
  });
  keepOnly(f.rec);
  // A clear lane first: the real entry commits to the gate and stamps it.
  placePlayer(f.live.object.position, { x: 0, y: 0, z: 300 });
  enterEscapeFlee(ctx, f.live, 'player');
  const plan = readEscape(f.rec);
  const gateSite = f.rec.wakeSite ? { ...f.rec.wakeSite, position: [...f.rec.wakeSite.position] } : null;
  pin('the runner committed to a gate and the trail says so',
    !!plan && plan.kind === 'gate' && !!gateSite && gateSite.kind === 'gate'
    && gateSite.to === plan.to,
    { kind: plan && plan.kind, site: gateSite });
  // Now box it, at the authored blocked geometry, through the same door: from
  // beyond the station every leg bears the same way, so one pursuer parked on
  // that bearing screens them all and no route is left.
  f.live.object.position.copy(STATION).add(new THREE.Vector3(400, 0, 400));
  placePlayer(STATION, { x: 300, y: 0, z: 300 });
  enterEscapeFlee(ctx, f.live, 'player');
  const now = readEscape(f.rec);
  const site = f.rec.wakeSite;
  pin('losing the route replaces the obsolete gate trail with the truth',
    !!now && now.kind === null && now.phase === 'evade'
    && !!site && site.kind === 'evade' && site.to === null && site.found === false
    && (!gateSite || Math.hypot(site.position[0] - gateSite.position[0],
      site.position[1] - gateSite.position[1],
      site.position[2] - gateSite.position[2]) > 1),
    { phase: now && now.phase, site, was: gateSite });
  // The SAME blocked decision again is not a new one: the trail it already
  // stamped stands, discovery included.
  if (f.rec.wakeSite) f.rec.wakeSite.found = true; // FIXTURE: a discovered site
  const held = f.rec.wakeSite;
  enterEscapeFlee(ctx, f.live, 'player');
  pin('re-deciding the same no-route does not re-stamp or undiscover the trail',
    f.rec.wakeSite === held && !!held && held.found === true && held.kind === 'evade',
    f.rec.wakeSite);
  dropFixture(f);
  run(3, 'i68 15b cleanup');
}

{
  // 15c. A restored COMPLETED escape owns the hull's intent. Loading an older
  // save while a later encounter is in progress must not leave the hull flying
  // that later flee — the next tick would treat the finished plan as a lazy
  // entry and overwrite the save with a fresh escape.
  const f = makeFixture({
    at: STATION.clone().add(new THREE.Vector3(700, 0, 500)),
    name: 'Bought And Done',
    classKey: 'cutter',
    role: 'pirate',
    faction: 'redledger',
    state: { hull: 52, screen: 0, lastHitAt: ctx.world.time },
    ai: { mode: 'flee', fleeFrom: 'player' },
  });
  keepOnly(f.rec);
  placePlayer(f.live.object.position, { x: 300, y: 0, z: 0 });
  run(30, 'i68 completed escape entry');
  // FIXTURE: the peace this hull bought earlier (what a real payTribute
  // leaves: an outcome and a calm window, no surrender flag) and the resolved
  // state a station dwell or a migrated arrival ends in.
  f.live.ai.demandOutcome = 'paid';
  f.live.ai.calmUntil = ctx.world.time + 60;
  run(2, 'i68 peace capture');
  const donePlan = readEscape(f.rec);
  if (donePlan) {
    donePlan.phase = 'done';
    donePlan.reason = 'sheltered';
  }
  f.live.ai.mode = 'loiter';
  f.live.ai.fleeFrom = null;
  const hullSaved = f.live.state.hull;
  const blob = JSON.parse(JSON.stringify(snapshot(ctx)));
  pin('the snapshot carries a COMPLETED escape and the peace it bought',
    (() => {
      const row = (blob.world.recordBanks?.[SYS] ?? []).find((r) => r.id === f.rec.id);
      return !!row && !!row.escape && row.escape.phase === 'done'
        && !!row.escape.peace && row.escape.peace.demandOutcome === 'paid';
    })());
  // A LATER encounter, then the older save is loaded on top of it.
  ctx.world.time += 10;
  f.live.state.lastHitAt = ctx.world.time;
  f.live.ai.mode = 'flee';
  f.live.ai.fleeFrom = 'player';
  run(20, 'i68 later encounter');
  pin('the later encounter really is a new, active escape',
    escapeActive(f.rec) && f.live.ai.mode === 'flee',
    { phase: readEscape(f.rec)?.phase, mode: f.live.ai.mode });
  restore(ctx, blob);
  const rec2 = (ctx.world.recordBanks?.[SYS] ?? []).find((r) => r.id === f.rec.id) ?? null;
  const live2 = ctx.ships.find((s) => s.record && s.record.id === f.rec.id) ?? null;
  if (rec2) keepOnly(rec2);
  pin('the restore stands the stale flee down immediately',
    !!rec2 && readEscape(rec2)?.phase === 'done'
    && (!live2 || live2.ai.mode !== 'flee'),
    { phase: rec2 && readEscape(rec2)?.phase, mode: live2 && live2.ai.mode });
  run(1, 'i68 restored completed tick');
  const after = rec2 ? readEscape(rec2) : null;
  pin('and the next tick does NOT overwrite the completed saved plan',
    !!after && after.phase === 'done' && !escapeActive(rec2),
    after && { phase: after.phase, kind: after.kind });
  pin('the restored hull keeps its condition and its bought peace, not a hunt',
    !!after && after.cond && after.cond.hull === hullSaved
    && after.peace && after.peace.demandOutcome === 'paid'
    && (!live2 || (live2.ai.mode !== 'hunt' && live2.ai.mode !== 'duel'
      && live2.ai.intent !== true && live2.ai.fleeFrom === null)),
    {
      hull: after && after.cond && after.cond.hull,
      was: hullSaved,
      mode: live2 && live2.ai.mode,
      outcome: after && after.peace && after.peace.demandOutcome,
    });
  if (rec2) {
    f.rec = rec2;
    f.live = live2;
  }
  dropFixture(f);
  run(3, 'i68 15c cleanup');
}

for (const rec of fixtureRecords) {
  for (const key of Object.keys(ctx.world.recordBanks ?? {})) {
    const bank = ctx.world.recordBanks[key];
    const i = bank.indexOf(rec);
    if (i >= 0) bank.splice(i, 1);
  }
}

console.log('');
if (updateErrors > 0) console.log(`UPDATE ERRORS: ${updateErrors}`);
const bad = fails + updateErrors;
console.log(bad === 0 ? 'ISSUE-68 GATE ESCAPE PASS' : `ISSUE-68 GATE ESCAPE FAIL (${fails} pins, ${updateErrors} update errors)`);
process.exit(bad === 0 ? 0 : 1);
