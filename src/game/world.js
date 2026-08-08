import * as THREE from 'three';
import { COMMODITIES, SHIP_CLASSES, SYSTEMS, resolveBand, BANDS, ACES, ORIGIN_ARCS, NAMED_GUNS, CALLOW } from './state.js';
import { initPrices, tickPrices, applyEventPressure } from './market.js';

/**
 * World — the persistent layer (doc §8 Living World), multi-system.
 *
 * - RECORD BANKS §8.2/§15.3: each star system owns a bank of persistent NPC
 *   identities generated lazily from SYSTEMS[id].cast (traders/pirates/
 *   patrols/ace flag) on first need. ctx.world.recordBanks = { sysId: [...] };
 *   ctx.world.records REMAINS the current system's array (station.js/npc.js
 *   keep reading it). On 'systemLoaded' the outgoing array is stashed under
 *   its own system id and the destination bank is swapped in (generated on
 *   first visit). The named ace 'Carver Illyx' exists ONLY in the Freehold
 *   cast — his bounty lives there.
 * - ROUTES §15.3: per system, station → gate → planet using that system's
 *   def coordinates, stored JSON-plain ([x,y,z] → [{x,y,z}...]) so save.js
 *   can serialize them. Waypoint 0 is the "home" stop (station).
 * - INTER-SYSTEM MIGRATION §8.2 destinations: every ~90s an enroute trader
 *   in the CURRENT bank is marked 'inTransit' toward the other system with
 *   an eta of 60–120s. When the eta passes the record moves to the
 *   destination bank, arriving at that system's gate with its route rebuilt
 *   station-ward; if the player is in the destination system, traffic.js
 *   instantiates it normally. The ace and pirates NEVER migrate (pirates are
 *   territorial).
 * - GALAXY TICK: records advance along their routes ~once per second.
 * - DYNAMIC EVENTS §8.5: one major event at a time (§8.4), 3–6 min apart,
 *   2–4 min duration, with market pressure and traffic weighting. Scope is
 *   the current system, unchanged from wave 1.
 * - INCIDENTS + AFTERMATH §8.7 WITNESS RULE: wrecks are staged ONLY from real
 *   npcDestroyed incidents (never fabricated). Wreck records are JSON-plain
 *   and carry a `system` tag; meshes live in a module map and are torn down
 *   on jump (data survives), then rebuilt for the current system's unmeshed
 *   entries — the same path that covers save restores.
 * - MILESTONES §8.8: first-time beats, non-interrupting, fired once each as
 *   emit('milestone', {id, line}) in the terse voice of §13.5.
 * - WAVE 7 — NAMED-GUN LINEAGE + ORIGIN ARCS: defeating Sister Vane schedules
 *   a successor (same name, harder resolve, grown bounty) after
 *   ACES.hunter.lineage.respawnDelay world-seconds, until the last bearer
 *   falls and milestone 'namedGunBroken' ends the line. Wave 8 gives the
 *   Freehold's Carver Illyx a kin-carried lineage of the same shape —
 *   exactly one successor, then milestone 'illyxLineBroken' ends his line.
 *   Wave 9 closes the pair: once both broken-line milestones stand, the rim
 *   itself reacts — milestone 'rimWithoutGuns' fires once, fear takes a
 *   one-time bump, and pirates everywhere yield sooner (NAMED_GUNS).
 *   Wave 10 answers the vacuum: while 'rimWithoutGuns' stands and fear sits
 *   maxed, new names rise to hunt the player — aspirants, not line-bearers,
 *   one at a time, three total ('gunRisen' per rise, milestone
 *   'aspirantBroken' on the first fall), then the rim stays quiet.
 *   Wave 11: after the third aspirant falls the rim answers once —
 *   milestone 'rimAnswered' plus a 'songShift' { reason: 'aftermath' } —
 *   and Old Callow remembers: each verge visit near him voices a rotating
 *   return line, and once he sells a single vouch into the keepers'
 *   second column ('callowVouch' hail intent, 'callowVouched' milestone).
 *   Wave 12: the hermit keeps books on the player too — post-vouch visits
 *   draw from CALLOW.vouchedReturnLines (same callowReturns cursor), and a
 *   hail press near a vouched Callow is refused (rotating refuseLines, one
 *   per verge visit, no hail card — he sold the word once).
 *   Wave 10 names the Verge's lone pirate ('Old Callow') and gives him a
 *   one-time proximity beat — the hermit who remembers the lane, his line
 *   gone cold if the rim already stands without Guns ('hermitPirateMet').
 *   Origin payoff arcs
 *   close the situations origins opened: ledgerDebt gets escalating creditor
 *   calls (and a collector) while credits < 0, and a colder second round
 *   (Dresk again, milestone 'debtClearedAgain') if the player re-enters debt
 *   after clearing; the other four origins fire one-time 'originPayoff'
 *   beats, with all four growing two 'originBeat' mid-beats each ahead
 *   of the payoff — beautiful/marked since wave 8, drifter/greenhand
 *   added wave 9 (clue count/hint, and faction reputation thresholds). State lives in ctx.world.aceRivalry
 *   { hunterGeneration, hunterDownAt, illyxGeneration, illyxDownAt,
 *   aspirantRisen, aspirantDownAt, aspirantFlying } and
 *   the flat JSON-plain
 *   ctx.world.originArc — both persisted via WORLD_FIELDS
 *   'aceRivalry'/'originArc' and re-resolved per frame (save.js swaps world
 *   fields wholesale on restore).
 *
 * ctx.world.time is advanced by main.js before systems run.
 */

// ---------- Geography (per-system, from SYSTEMS defs §15.1/§15.3) ----------
function gatePoint(def) {
  // Primary gate (gates[0]) anchors routes/planet layout for the system.
  const p = def.gates[0].position;
  return new THREE.Vector3(p[0], p[1], p[2]);
}
function stationPoint(def) {
  const p = def.station.position;
  return new THREE.Vector3(p[0], p[1], p[2]);
}
function planetPoint(def) {
  // Beyond the gate down-lane: the far colony approach. Mirrors the wave-1
  // Freehold layout exactly (gate dir × (|gate| + 350), y flattened, 150u
  // lateral offset flipping with the gate's z side).
  const g = gatePoint(def);
  const len = g.length();
  const p = g.multiplyScalar((len + 350) / len);
  p.y = 10;
  p.x += def.gates[0].position[2] < 0 ? -150 : 150;
  return p;
}
function systemAnchor(sysId) {
  // JSON-plain station point; npc.js ring modes (pirates/patrols/ace) orbit
  // record.anchor instead of the wave-1 global stationPosition.
  const p = SYSTEMS[sysId].station.position;
  return { x: Math.round(p[0]), y: Math.round(p[1]), z: Math.round(p[2]) };
}

// ---------- Record generation §8.2 ----------
const TRADER_NAMES = {
  freehold: ['Hauler Mink', 'Vesper-9', 'Cartwheel Ann', 'Slow Orison', 'Pale Freida', 'Kestrel Mercy', 'Tallow-3', 'Innisfree'],
  veridian: ['Cinder Halvard', 'Loom-5', 'Patient Sorrow', 'Glass Ansel', 'Tessellate', 'Wrenhollow', 'Low Meridian'],
};
const PIRATE_NAMES = {
  freehold: ['Red Marlow', 'Gallows Wren', 'Ninth Tooth', 'Sable Ilex'],
  veridian: ['Copper Vane', 'Hollow Quill', 'Bracken-12'],
  verge: ['Old Callow'],
};
const PATROL_NAMES = {
  freehold: ['Watchful Apt', 'Lancer Po'],
  veridian: ['Steadfast Ivo', 'Pale Warrant', 'Crescent Anh'],
};
const LEGAL_KEYS = Object.keys(COMMODITIES).filter((k) => COMMODITIES[k].legal);

let nextRecordNum = 1;

function jitter(v, amount) {
  v.x += (Math.random() - 0.5) * 2 * amount;
  v.y += (Math.random() - 0.5) * 2 * amount * 0.4;
  v.z += (Math.random() - 0.5) * 2 * amount;
  return v;
}

function plainRoute(waypoints) {
  // JSON-plain [{x,y,z}...]; waypoint 0 is the "home" stop (station for
  // traders, gate for patrols/pirates — only station stops count as docked).
  return waypoints.map((w) => ({ x: Math.round(w.x), y: Math.round(w.y), z: Math.round(w.z) }));
}

function computeLegLens(plain) {
  const legLens = [];
  for (let i = 0; i < plain.length - 1; i++) {
    const a = plain[i];
    const b = plain[i + 1];
    legLens.push(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z));
  }
  return legLens;
}

function poolName(pool, sysId, i, fallback) {
  const names = pool[sysId];
  return (names && names[i]) ?? `${fallback} ${sysId}-${i + 1}`;
}

function makeRecord(ctx, { name, classKey, faction, role, route, cargo, bounty = 0, system }) {
  const plain = plainRoute(route);
  return {
    id: `rec-${nextRecordNum++}`,
    name,
    classKey,
    faction,
    cargo, // [{ commodity, units }]
    route: plain,
    legLens: computeLegLens(plain),
    leg: 0,
    legT: Math.random(), // scatter records along their first leg at boot
    dir: 1,
    dwellUntil: 0,
    role, // trader | pirate | patrol | ace
    personality: Math.random() * 20 - 10, // ±10 resolve nudge §7.2
    resolveSeed: Math.random(), // npc.js derives base resolve from this
    bounty,
    system, // owning star system id (bank membership)
    anchor: systemAnchor(system), // ring-mode orbit center for npc.js
    state: 'enroute', // enroute | docked | dead | captured | inTransit
    live: false, // currently instantiated by traffic.js
  };
}

function traderCargo() {
  const n = 1 + ((Math.random() * 2) | 0); // 1–2 commodity kinds
  const manifest = [];
  const used = new Set();
  for (let i = 0; i < n; i++) {
    let key = LEGAL_KEYS[(Math.random() * LEGAL_KEYS.length) | 0];
    while (used.has(key)) key = LEGAL_KEYS[(Math.random() * LEGAL_KEYS.length) | 0];
    used.add(key);
    manifest.push({ commodity: key, units: 3 + ((Math.random() * 10) | 0) });
  }
  return manifest;
}

function createRecords(ctx, sysId) {
  const def = SYSTEMS[sysId];
  const station = stationPoint(def);
  const gate = gatePoint(def);
  const planet = planetPoint(def);
  const otherFaction = SYSTEMS[def.gates[0].to]?.faction ?? 'independent';
  const traderFactions = [def.faction, otherFaction, 'independent'];
  const cast = def.cast;
  const records = [];

  for (let i = 0; i < cast.traders; i++) {
    records.push(
      makeRecord(ctx, {
        name: poolName(TRADER_NAMES, sysId, i, 'Freighter'),
        classKey: 'freighter',
        faction: traderFactions[i % traderFactions.length],
        role: 'trader',
        route: [station.clone(), jitter(gate.clone(), 60), jitter(planet.clone(), 80)],
        cargo: traderCargo(),
        system: sysId,
      }),
    );
  }
  for (let i = 0; i < cast.pirates; i++) {
    // Pirates haunt the gate and the lane back toward the station.
    const laneMid = new THREE.Vector3().lerpVectors(station, gate, 0.5);
    jitter(laneMid, 90);
    records.push(
      makeRecord(ctx, {
        name: poolName(PIRATE_NAMES, sysId, i, 'Reaver'),
        classKey: 'cutter',
        faction: i === 0 ? 'redledger' : 'independent',
        role: 'pirate',
        route: [jitter(gate.clone(), 90), laneMid, jitter(gate.clone(), 120)],
        cargo: [],
        bounty: 300 + i * 75, // posted price — station.js bounty-pirate jobs read this
        system: sysId,
      }),
    );
  }
  for (let i = 0; i < cast.patrols; i++) {
    records.push(
      makeRecord(ctx, {
        name: poolName(PATROL_NAMES, sysId, i, 'Patrol'),
        classKey: 'heavy',
        faction: i === 0 ? def.faction : otherFaction,
        role: 'patrol',
        route: [station.clone(), jitter(gate.clone(), 50), jitter(planet.clone(), 60)],
        cargo: [],
        system: sysId,
      }),
    );
  }
  if (cast.ace) {
    // The named ace — Milestone-1 bounty target (§10.4). Freehold only.
    records.push(
      makeRecord(ctx, {
        name: 'Carver Illyx',
        classKey: 'ace',
        faction: 'redledger',
        role: 'ace',
        route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)],
        cargo: [{ commodity: 'restrictedComponents', units: 4 }],
        bounty: 2500,
        system: sysId,
      }),
    );
  }
  return records;
}

/** Lazily generate (once) and return a system's record bank. */
function ensureBank(ctx, sysId) {
  const banks = ctx.world.recordBanks ?? (ctx.world.recordBanks = {});
  return banks[sysId] ?? (banks[sysId] = createRecords(ctx, sysId));
}

/**
 * Named-Gun hunter injection (glossary: Named ace / Named Gun). Once, when
 * fear crosses ACES.hunter.fearThreshold, Sister Vane joins the redmarch
 * record bank with the same jittered gate↔lane ace route Carver Illyx uses.
 * Persisted via ctx.world.aceRivalry.hunterSpawned so old saves and reloads
 * never double-spawn her. She is role 'ace' — pickMigrant moves traders
 * only, so she never leaves the Redmarch. When the player is IN redmarch,
 * ctx.world.records IS that bank, so the push suffices either way.
 */
function spawnHunterAce(ctx) {
  const rivalry = (ctx.world.aceRivalry ??= { defeats: 0, lastOutcome: null, hunterSpawned: false, hunterGeneration: 0, hunterDownAt: null, illyxGeneration: 0, illyxDownAt: null, aspirantRisen: 0, aspirantDownAt: null, aspirantFlying: false });
  if (rivalry.hunterSpawned) return;
  const def = SYSTEMS[ACES.hunter.system];
  if (!def) return;
  rivalry.hunterSpawned = true;
  const gate = gatePoint(def);
  const planet = planetPoint(def);
  const bank = ensureBank(ctx, ACES.hunter.system);
  bank.push(
    makeRecord(ctx, {
      name: ACES.hunter.name,
      classKey: ACES.hunter.classKey,
      faction: ACES.hunter.faction,
      role: 'ace',
      route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)],
      cargo: ACES.hunter.cargo.map((c) => ({ commodity: c.commodity, units: c.units })),
      bounty: ACES.hunter.bounty,
      system: ACES.hunter.system,
    }),
  );
  ctx.emit('commLine', {
    text: 'The Ledger has bought a Named Gun. Sister Vane flies the Redmarch now.',
    from: 'Whisper',
  });
}

// Successor hail lines, indexed generation - 1 (generations 1 and 2; the
// third defeat breaks the line instead — see the ace-defeat handlers).
const LINEAGE_LINES = [
  'Sister Vane is dead. Sister Vane flies. The Ledger does not bury its Guns.',
  'The third Vane hails you. She knows exactly how you fly.',
];

/**
 * Named-Gun lineage (wave 7): the name is a mantle. When a defeated Vane's
 * respawnDelay has elapsed, the next generation takes up the name in the
 * redmarch bank — same jittered gate↔planet route and cargo copy as
 * spawnHunterAce, record.resolve seeded per generation (createShipState
 * prefers the record field), bounty scaled by bountyGrowth^generation.
 * Caller bumps hunterGeneration and clears hunterDownAt first; the
 * ace-defeat handlers decide whether the line continues at all.
 */
function spawnHunterSuccessor(ctx) {
  const rivalry = ctx.world.aceRivalry; // re-resolved per frame; save.js swaps wholesale
  rivalry.hunterGeneration++;
  rivalry.hunterDownAt = null;
  const gen = rivalry.hunterGeneration;
  const def = SYSTEMS[ACES.hunter.system];
  if (!def) return;
  const gate = gatePoint(def);
  const planet = planetPoint(def);
  const bank = ensureBank(ctx, ACES.hunter.system);
  const rec = makeRecord(ctx, {
    name: ACES.hunter.name,
    classKey: ACES.hunter.classKey,
    faction: ACES.hunter.faction,
    role: 'ace',
    route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)],
    cargo: ACES.hunter.cargo.map((c) => ({ commodity: c.commodity, units: c.units })),
    bounty: Math.round(ACES.hunter.bounty * Math.pow(ACES.hunter.lineage.bountyGrowth, gen)),
    system: ACES.hunter.system,
  });
  rec.resolve = 55 + ACES.hunter.lineage.resolvePerGeneration * gen;
  bank.push(rec);
  ctx.emit('lineagePassed', { name: ACES.hunter.name, generation: gen, line: LINEAGE_LINES[gen - 1] });
}

// Freehold lineage lines, indexed generation - 1 (only generation 1 exists;
// defeating the successor breaks the line instead — see the ace-defeat
// handlers).
const ILLYX_LINEAGE_LINES = [
  'Carver Illyx is dead. His kin flies his wing, and his grudge. The Drift does not let a Gun stay buried.',
];

/**
 * Freehold lineage (wave 8): the name is carried by kin. When a defeated
 * Illyx's respawnDelay has elapsed, the next bearer takes up the name in
 * the freehold bank — same jittered gate↔planet route and restrictedComponents
 * cargo copy as the Freehold cast ace in createRecords, record.resolve seeded
 * per generation (createShipState prefers the record field), bounty scaled
 * by bountyGrowth^generation. The successor has not rematched, so
 * rematchCount starts at 0. Caller bumps illyxGeneration and clears
 * illyxDownAt first; the ace-defeat handlers decide whether the line
 * continues at all.
 */
function spawnIllyxSuccessor(ctx) {
  const rivalry = ctx.world.aceRivalry; // re-resolved per frame; save.js swaps wholesale
  rivalry.illyxGeneration++;
  rivalry.illyxDownAt = null;
  const gen = rivalry.illyxGeneration;
  const def = SYSTEMS[ACES.illyx.system];
  if (!def) return;
  const gate = gatePoint(def);
  const planet = planetPoint(def);
  const bank = ensureBank(ctx, ACES.illyx.system);
  const rec = makeRecord(ctx, {
    name: ACES.illyx.name,
    classKey: ACES.illyx.classKey,
    faction: ACES.illyx.faction,
    role: 'ace',
    route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)],
    cargo: [{ commodity: 'restrictedComponents', units: 4 }],
    bounty: Math.round(ACES.illyx.bounty * Math.pow(ACES.illyx.lineage.bountyGrowth, gen)),
    system: ACES.illyx.system,
  });
  rec.resolve = 55 + ACES.illyx.lineage.resolvePerGeneration * gen;
  rec.rematchCount = 0;
  bank.push(rec);
  ctx.emit('lineagePassed', { name: ACES.illyx.name, generation: gen, line: ILLYX_LINEAGE_LINES[gen - 1] });
}

/**
 * Aspirant cycle (wave 10): with no Named Guns left and fear at the top of
 * the economy, the rim grows NEW names — not mantles, not kin. The next
 * unrisen aspirant joins the CURRENT system's record bank with the same
 * jittered gate↔planet ace route the hunter/Illyx spawns use, carrying the
 * restrictedComponents load, rec.aspirant = true so the ace-defeat handlers
 * can tell a new name from a line-bearer. Caller (the update tick) gates on
 * rimWithoutGuns + fear + one-at-a-time; here we bump aspirantRisen and
 * mark the name flying first, mirroring the successor spawns. Emits
 * 'gunRisen' { name, line }.
 */
function spawnAspirant(ctx) {
  const rivalry = ctx.world.aceRivalry; // re-resolved per frame; save.js swaps wholesale
  rivalry.aspirantRisen ??= 0; // pre-wave-10 saves lack the field
  rivalry.aspirantDownAt ??= null;
  rivalry.aspirantFlying ??= false;
  const idx = rivalry.aspirantRisen;
  rivalry.aspirantRisen++;
  rivalry.aspirantDownAt = null;
  rivalry.aspirantFlying = true;
  const sysId = ctx.world.currentSystem;
  const def = SYSTEMS[sysId];
  if (!def) return;
  const gate = gatePoint(def);
  const planet = planetPoint(def);
  const bank = ensureBank(ctx, sysId);
  const rec = makeRecord(ctx, {
    name: NAMED_GUNS.aspirants.names[idx],
    classKey: 'cutter',
    faction: 'independent',
    role: 'ace',
    route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)],
    cargo: [{ commodity: 'restrictedComponents', units: 4 }],
    bounty: NAMED_GUNS.aspirants.bounty,
    system: sysId,
  });
  rec.resolve = NAMED_GUNS.aspirants.resolve;
  rec.aspirant = true;
  bank.push(rec);
  ctx.emit('gunRisen', { name: rec.name, line: NAMED_GUNS.aspirants.lines[idx] });
}

/**
 * Abstract route position estimate (§8.2). Writes into `out` (Vector3) —
 * zero allocation. traffic.js uses this as the spawn point.
 */
export function recordPosition(rec, out) {
  if (rec.state === 'docked' || rec.route.length === 1) {
    const w = rec.route[0];
    return out.set(w.x, w.y, w.z);
  }
  const a = rec.route[rec.leg];
  const b = rec.route[rec.leg + 1];
  return out.set(a.x + (b.x - a.x) * rec.legT, a.y + (b.y - a.y) * rec.legT, a.z + (b.z - a.z) * rec.legT);
}

// ---------- Dynamic events §8.5 ----------
const EVENT_KINDS = ['pirateBlockade', 'strikeRush', 'laborStrike', 'commodityGlut', 'convoySurge', 'oreRush'];
const EVENT_GAP = [180, 360]; // 3–6 min between events
const EVENT_DURATION = [120, 240]; // 2–4 min
const BLOCKADE_KILL_INTERVAL = 45; // abstract lane casualties during blockade

/**
 * Roll the next dynamic-event gap, scaled by the CURRENT system's band
 * (designed silence — the rim schedules events farther apart). Evaluated
 * each time the gap is rolled so jumping changes cadence immediately.
 */
function rollEventGap(ctx) {
  const mult = BANDS[ctx.systems[ctx.world.currentSystem].band ?? 0].eventGapMult;
  return (EVENT_GAP[0] + Math.random() * (EVENT_GAP[1] - EVENT_GAP[0])) * mult;
}

// ---------- Inter-system migration §8.2 destinations ----------
const MIGRATION_INTERVAL = 90; // ~s between departure picks
const MIGRATION_ETA = [60, 120]; // s spent inTransit

// ---------- Aftermath §8.7 ----------
const WRECK_TTL = 600; // ~10 min world time
const MAX_AFTERMATH = 24;
const MAX_INCIDENTS = 40;

// ---------- Update cadence ----------
const GALAXY_TICK = 1; // s between abstract route advances

// ---------- Milestones §8.8 ----------
function fireMilestone(ctx, id, line) {
  if (ctx.world.milestones.includes(id)) return false;
  ctx.world.milestones.push(id);
  ctx.emit('milestone', { id, line });
  return true;
}

// ---------- Origin payoff arcs (wave 7) ----------
/**
 * Ledger collector injection: the maxCalls-th unanswered come-due call sends
 * ORIGIN_ARCS.ledgerDebt.collector after the player — role 'pirate' (so
 * pickMigrant never moves him) on a jittered gate↔planet route, pushed into
 * the CURRENT system's bank. Same aliasing note as the hunter: when the
 * player is in that system, the bank IS ctx.world.records.
 */
function injectCollector(ctx) {
  const sysId = ctx.world.currentSystem;
  const def = SYSTEMS[sysId];
  if (!def) return;
  const col = ORIGIN_ARCS.ledgerDebt.collector;
  const gate = gatePoint(def);
  const planet = planetPoint(def);
  const bank = ensureBank(ctx, sysId);
  bank.push(
    makeRecord(ctx, {
      name: col.name,
      classKey: col.classKey,
      faction: col.faction,
      role: 'pirate',
      route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)],
      cargo: col.cargo.map((c) => ({ commodity: c.commodity, units: c.units })),
      bounty: col.bounty,
      system: sysId,
    }),
  );
}

/**
 * Per-frame origin-arc checks. Cheap scalar compares, zero allocation in
 * the common path; ctx.world.originArc is re-resolved every call (save.js
 * swaps world fields wholesale on restore) and stays JSON-plain —
 * lastCallAt starts at 0, never Infinity.
 */
function originArcTick(ctx) {
  const origin = ctx.world.origin;
  if (!origin) return; // old saves may lack an origin
  const arc = (ctx.world.originArc ??= {
    calls: 0,
    lastCallAt: 0,
    debtCleared: false,
    collectorSent: false,
    calls2: 0,
    lastCallAt2: 0,
    collectorSent2: false,
    reenteredDebt: false,
    debtClearedAgain: false,
    marked: false,
    beautiful: false,
    drifter: false,
    greenhand: false,
    beautiful1: false,
    beautiful2: false,
    marked1: false,
    marked2: false,
    drifter1: false,
    drifter2: false,
    greenhand1: false,
    greenhand2: false,
  });
  // Old saves predate round 2 and the mid-beats — normalize in place.
  arc.calls2 ??= 0;
  arc.lastCallAt2 ??= 0;
  arc.collectorSent2 ??= false;
  arc.reenteredDebt ??= false;
  arc.debtClearedAgain ??= false;
  arc.beautiful1 ??= false;
  arc.beautiful2 ??= false;
  arc.marked1 ??= false;
  arc.marked2 ??= false;
  arc.drifter1 ??= false;
  arc.drifter2 ??= false;
  arc.greenhand1 ??= false;
  arc.greenhand2 ??= false;

  // a. Ledger come-due: while credits < 0 the Ledger calls every
  // callInterval world-seconds (max maxCalls, each costing redledger
  // standing; the last call sends the collector). Climbing back to
  // credits >= 0 closes the arc once.
  if (origin === 'ledgerDebt' && !arc.debtCleared) {
    if (ctx.world.credits >= 0) {
      arc.debtCleared = true;
      ctx.world.reputation.redledger = (ctx.world.reputation.redledger ?? 0) + ORIGIN_ARCS.ledgerDebt.clearRepBonus;
      fireMilestone(ctx, 'debtCleared', ORIGIN_ARCS.ledgerDebt.clearLine);
    } else if (arc.calls < ORIGIN_ARCS.ledgerDebt.maxCalls && ctx.world.time - arc.lastCallAt >= ORIGIN_ARCS.ledgerDebt.callInterval) {
      arc.calls++;
      arc.lastCallAt = ctx.world.time;
      ctx.world.reputation.redledger = (ctx.world.reputation.redledger ?? 0) + ORIGIN_ARCS.ledgerDebt.repPerCall;
      ctx.emit('creditorCall', { stage: arc.calls, line: ORIGIN_ARCS.ledgerDebt.callLines[arc.calls - 1] });
      if (arc.calls === ORIGIN_ARCS.ledgerDebt.maxCalls && !arc.collectorSent) {
        arc.collectorSent = true;
        injectCollector(ctx);
      }
    }
  }

  // a2. Repeat debtor (round 2): after the arc closed once, dipping negative
  // again re-arms it — colder calls on round2's interval ('creditorCall'
  // stage 4/5), the last one sending Dresk back out; climbing clear fires
  // milestone 'debtClearedAgain'. reenteredDebt is the only gate for the
  // second clearing — the calls themselves are optional. No third round.
  if (origin === 'ledgerDebt' && arc.debtCleared && !arc.debtClearedAgain) {
    const r2 = ORIGIN_ARCS.ledgerDebt.round2;
    if (ctx.world.credits < 0) {
      arc.reenteredDebt = true;
      if (arc.calls2 < r2.maxCalls && ctx.world.time - arc.lastCallAt2 >= r2.callInterval) {
        arc.calls2++;
        arc.lastCallAt2 = ctx.world.time;
        ctx.world.reputation.redledger = (ctx.world.reputation.redledger ?? 0) + r2.repPerCall;
        ctx.emit('creditorCall', { stage: 3 + arc.calls2, line: r2.callLines[arc.calls2 - 1] });
        if (arc.calls2 === r2.maxCalls && !arc.collectorSent2) {
          arc.collectorSent2 = true;
          injectCollector(ctx);
          ctx.emit('commLine', {
            from: 'Whisper',
            text: 'Dresk kept your vector. The Ledger kept your name.',
          });
        }
      }
    } else if (arc.reenteredDebt) {
      arc.debtClearedAgain = true;
      ctx.world.reputation.redledger = (ctx.world.reputation.redledger ?? 0) + r2.clearRepBonus;
      fireMilestone(ctx, 'debtClearedAgain', r2.clearLine);
    }
  }

  // b. Mid-beats — each non-ledger origin grows two 'originBeat' steps
  // ahead of its payoff (beautiful/marked wave 8, drifter/greenhand wave
  // 9); each fires exactly once.
  if (origin === 'beautiful') {
    const growth = ctx.bio?.growth ?? 0;
    if (!arc.beautiful1 && growth >= 0.4) {
      arc.beautiful1 = true;
      ctx.emit('originBeat', { id: 'beautiful1', line: ORIGIN_ARCS.beats.beautiful[0].line });
    }
    if (!arc.beautiful2 && growth >= 0.75) {
      arc.beautiful2 = true;
      ctx.emit('originBeat', { id: 'beautiful2', line: ORIGIN_ARCS.beats.beautiful[1].line });
    }
  }
  if (origin === 'marked') {
    const veridian = ctx.world.reputation.veridian ?? 0;
    if (!arc.marked1 && ctx.world.fear >= 25 && veridian < 0) {
      arc.marked1 = true;
      ctx.emit('originBeat', { id: 'marked1', line: ORIGIN_ARCS.beats.marked[0].line });
    }
    if (!arc.marked2 && veridian >= -5) {
      arc.marked2 = true;
      ctx.emit('originBeat', { id: 'marked2', line: ORIGIN_ARCS.beats.marked[1].line });
    }
  }
  // Wave 9: drifter beats at the first EARNED clue (mystery.found hits 2 —
  // the origin grants rm_c_tally at pick) and at mystery.convergeHinted.
  if (origin === 'drifter') {
    if (!arc.drifter1 && (ctx.world.mystery?.found?.length ?? 0) >= 2) {
      arc.drifter1 = true;
      ctx.emit('originBeat', { id: 'drifter1', line: ORIGIN_ARCS.beats.drifter[0].line });
    }
    if (!arc.drifter2 && ctx.world.mystery?.convergeHinted) {
      arc.drifter2 = true;
      ctx.emit('originBeat', { id: 'drifter2', line: ORIGIN_ARCS.beats.drifter[1].line });
    }
  }
  // Wave 9: greenhand beats when the rim first learns the name (any
  // faction |rep| or fear at 10) and when a berth becomes yours (any
  // faction rep at 25). One pass, both maxima, zero allocation.
  if (origin === 'greenhand') {
    let maxAbsRep = 0;
    let maxRep = 0;
    for (const f in ctx.world.reputation) {
      const rep = ctx.world.reputation[f] ?? 0;
      if (Math.abs(rep) > maxAbsRep) maxAbsRep = Math.abs(rep);
      if (rep > maxRep) maxRep = rep;
    }
    if (!arc.greenhand1 && (maxAbsRep >= 10 || ctx.world.fear >= 10)) {
      arc.greenhand1 = true;
      ctx.emit('originBeat', { id: 'greenhand1', line: ORIGIN_ARCS.beats.greenhand[0].line });
    }
    if (!arc.greenhand2 && maxRep >= 25) {
      arc.greenhand2 = true;
      ctx.emit('originBeat', { id: 'greenhand2', line: ORIGIN_ARCS.beats.greenhand[1].line });
    }
  }

  // c. One-time payoffs — each fires exactly once when its condition first
  // holds.
  if (origin === 'marked' && !arc.marked && (ctx.world.reputation.veridian ?? 0) >= 0) {
    arc.marked = true;
    ctx.emit('originPayoff', { id: 'marked', line: ORIGIN_ARCS.payoffs.marked });
  }
  if (origin === 'beautiful' && !arc.beautiful && (ctx.bio?.growth ?? 0) >= 1) {
    arc.beautiful = true;
    ctx.emit('originPayoff', { id: 'beautiful', line: ORIGIN_ARCS.payoffs.beautiful });
  }
  if (origin === 'drifter' && !arc.drifter && ctx.world.mystery?.converged) {
    arc.drifter = true;
    ctx.emit('originPayoff', { id: 'drifter', line: ORIGIN_ARCS.payoffs.drifter });
  }
  if (origin === 'greenhand' && !arc.greenhand) {
    for (const key in ctx.world.epics ?? {}) {
      if (ctx.world.epics[key] > 0) {
        arc.greenhand = true;
        ctx.emit('originPayoff', { id: 'greenhand', line: ORIGIN_ARCS.payoffs.greenhand });
        break;
      }
    }
  }
}

/**
 * Hermit pirate beat (wave 10): the Verge's lone pirate — 'Old Callow' —
 * remembers the lane and says so, once ever, when the player first comes
 * within 350u of his RECORD position (recordPosition into module _v1 —
 * works whether or not traffic.js has instantiated him, zero allocation).
 * Witness-Rule-safe: he voices only himself. Dead records (state 'dead',
 * the defeat path) never voice it. Persisted via world.milestones
 * ('hermitPirateMet'), already a WORLD_FIELD; a colder line stands in if
 * 'rimWithoutGuns' has fired. The meet also DISARMS the wave-11 return
 * flag: a return line on the same visit as the meeting would be no
 * return at all — the next verge arrival re-arms it.
 */
function hermitPirateBeat(ctx) {
  if (ctx.world.currentSystem !== 'verge') return;
  if (ctx.world.milestones.includes('hermitPirateMet')) return;
  if (!ctx.ship.object) return;
  const bank = ensureBank(ctx, 'verge');
  const rec = bank.find((r) => r.role === 'pirate');
  if (!rec || rec.state === 'dead') return;
  if (recordPosition(rec, _v1).distanceTo(ctx.ship.object.position) > 350) return;
  ctx.world.milestones.push('hermitPirateMet');
  callowVisitArmed = false; // wave 11: returns voice on LATER visits only
  ctx.emit('commLine', {
    from: rec.name,
    text: ctx.world.milestones.includes('rimWithoutGuns')
      ? 'You broke the Guns. This lane had teeth once. I remember teeth.'
      : "Flew this lane when the Shepherd's broadcast still had takers. First hull in longer than I bothered counting.",
  });
}

/**
 * Callow return beats (wave 11): once 'hermitPirateMet' stands, the hermit
 * remembers RETURNS — one rotating line per verge visit. consumeSystemLoaded
 * arms the module flag on a 'systemLoaded' to 'verge'; the first time the
 * player drifts within 350u of his RECORD position that visit, the line
 * fires and the flag disarms (at most one line per visit — the flag never
 * persists, so jumping back in re-arms it). rec.callowReturns rotates the
 * line and rides the verge pirate record, persisted free through
 * recordBanks. Same recordPosition-into-_v1 zero-allocation discipline as
 * hermitPirateBeat; a dead Callow never speaks (Witness Rule §8.7).
 */
function callowReturnBeat(ctx) {
  if (!callowVisitArmed) return;
  if (!ctx.world.milestones.includes('hermitPirateMet')) return;
  if (ctx.flags.docked) return; // no lane hails through the station wall
  if (!ctx.ship.object) return;
  const bank = ensureBank(ctx, 'verge');
  const rec = bank.find((r) => r.role === 'pirate');
  if (!rec || rec.state === 'dead') return;
  if (recordPosition(rec, _v1).distanceTo(ctx.ship.object.position) > 350) return;
  rec.callowReturns ??= 0; // pre-wave-11 saves lack the field
  // Wave 12: once the vouch stands, his books on the player change — same
  // cursor, different page.
  const lines = rec.vouched ? CALLOW.vouchedReturnLines : CALLOW.returnLines;
  ctx.emit('commLine', {
    from: rec.name,
    text: lines[rec.callowReturns % lines.length],
  });
  rec.callowReturns++;
  callowVisitArmed = false;
}

/**
 * Callow vouch offer (wave 11): the one thing he SELLS. A hail
 * (input.hailPressed) in the verge — hermit met, not yet vouched, credits
 * covering CALLOW.vouchCost, his record within CALLOW.hailRange and a LIVE
 * ship carrying that record — opens the hail card with the 'callowVouch'
 * intent (hail.js carries the purchase; he was never bargaining, so no
 * resolve/band machinery here). No live ship, no offer: silence is his
 * price of admission.
 * Wave 12: he sells it once. The same hail gating against a VOUCHED record
 * voices a rotating CALLOW.refuseLines entry instead — a commLine, never a
 * hail card — throttled to one refusal per verge visit by the module
 * callowRefusalArmed flag (armed beside callowVisitArmed on a real verge
 * arrival, disarmed when it fires). rec.callowRefusals rotates the line and
 * rides the record's persistence free; no credits move, no milestone — he
 * was never bargaining.
 */
function callowVouchOffer(ctx) {
  if (!ctx.input.hailPressed) return;
  if (ctx.world.currentSystem !== 'verge') return;
  if (!ctx.world.milestones.includes('hermitPirateMet')) return;
  if (!ctx.ship.object) return;
  const bank = ensureBank(ctx, 'verge');
  const rec = bank.find((r) => r.role === 'pirate');
  if (!rec || rec.state === 'dead') return;
  if (recordPosition(rec, _v1).distanceTo(ctx.ship.object.position) > CALLOW.hailRange) return;
  const live = ctx.ships.find((s) => s.record === rec && !s.state?.destroyed);
  if (!live) return; // no live ship — the offer stays silent
  if (rec.vouched) {
    // Wave 12: the column doesn't take seconds — one refusal per visit.
    if (!callowRefusalArmed) return;
    callowRefusalArmed = false;
    rec.callowRefusals ??= 0; // pre-wave-12 saves lack the field
    ctx.emit('commLine', {
      from: rec.name,
      text: CALLOW.refuseLines[rec.callowRefusals % CALLOW.refuseLines.length],
    });
    rec.callowRefusals++;
    return;
  }
  if (ctx.world.credits < CALLOW.vouchCost) return;
  ctx.emit('hailOpened', { ship: live, intents: ['callowVouch', 'keepFiring'], line: CALLOW.offerLine });
}

// ---------- Module state (never serialized) ----------
const wreckMeshes = new Map(); // aftermath.id → { group, emberMat }
// Wave 11: armed per verge arrival (consumeSystemLoaded), disarmed when Old
// Callow's return line fires — never serialized; a jump back in re-arms it.
let callowVisitArmed = false;
// Wave 12: same arm/disarm discipline for the post-vouch refusal — at most
// one 'the column doesn't take seconds' per verge visit.
let callowRefusalArmed = false;
let debrisGeoBox = null;
let debrisGeoTetra = null;
let debrisMat = null;
let emberGeo = null;
const _v1 = new THREE.Vector3();

function makeWreckMesh(ctx, entry) {
  debrisGeoBox ??= new THREE.BoxGeometry(1, 1, 1);
  debrisGeoTetra ??= new THREE.TetrahedronGeometry(1, 0);
  debrisMat ??= new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.95, metalness: 0.35 });
  emberGeo ??= (() => {
    const n = 10;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  })();

  const group = new THREE.Group();
  group.position.set(entry.position.x, entry.position.y, entry.position.z);
  const pieces = 3 + ((Math.random() * 3) | 0); // 3–5 dark hull fragments
  for (let i = 0; i < pieces; i++) {
    const m = new THREE.Mesh(Math.random() < 0.5 ? debrisGeoBox : debrisGeoTetra, debrisMat);
    m.position.set((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7);
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    m.scale.setScalar(0.8 + Math.random() * 1.8);
    group.add(m);
  }
  const emberMat = new THREE.PointsMaterial({
    color: 0xff8844,
    size: 1.6,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const embers = new THREE.Points(emberGeo, emberMat);
  group.add(embers);
  ctx.scene.add(group);
  return { group, emberMat, phase: Math.random() * Math.PI * 2 };
}

function removeWreckMesh(ctx, id) {
  const wreck = wreckMeshes.get(id);
  if (!wreck) return;
  ctx.scene.remove(wreck.group);
  wreck.emberMat.dispose();
  wreckMeshes.delete(id);
}

function teardownWreckMeshes(ctx) {
  // Jump swaps the scene's space: wreck MESHES belong to the old system's
  // coordinates. The aftermath DATA survives; entries for the destination
  // system are re-meshed by the per-frame rebuild below.
  for (const wreck of wreckMeshes.values()) {
    ctx.scene.remove(wreck.group);
    wreck.emberMat.dispose();
  }
  wreckMeshes.clear();
}

function stageAftermath(ctx, incident) {
  if (incident.kind !== 'destroyed') return null; // wrecks only from kills
  const entry = {
    id: `aft-${Math.round(ctx.world.time * 10)}-${(Math.random() * 1e6) | 0}`,
    incidentId: incident.id,
    kind: 'wreck',
    position: { ...incident.position },
    system: ctx.world.currentSystem, // which system's space the wreck drifts in
    createdAt: ctx.world.time,
    expiresAt: ctx.world.time + WRECK_TTL,
  };
  ctx.world.aftermath.push(entry);
  if (ctx.world.aftermath.length > MAX_AFTERMATH) {
    const dropped = ctx.world.aftermath.shift();
    removeWreckMesh(ctx, dropped.id);
  }
  return entry;
}

function addIncident(ctx, kind, { name, faction, role, position, causer, outcome }) {
  const incident = {
    id: `inc-${Math.round(ctx.world.time * 10)}-${(Math.random() * 1e6) | 0}`,
    t: ctx.world.time,
    kind, // 'destroyed' | 'surrendered'
    name,
    faction,
    role,
    position: { x: Math.round(position.x), y: Math.round(position.y), z: Math.round(position.z) },
    causer, // 'player' | 'world'
  };
  if (outcome !== undefined) incident.outcome = outcome;
  ctx.world.incidents.push(incident);
  if (ctx.world.incidents.length > MAX_INCIDENTS) ctx.world.incidents.shift();
  return incident;
}

export function initWorld(ctx) {
  initPrices(ctx);
  const banks = ctx.world.recordBanks ??= {}; // may have been restored by save.js
  if (ctx.world.records.length === 0) {
    ctx.world.records = ensureBank(ctx, ctx.world.currentSystem);
  } else {
    banks[ctx.world.currentSystem] ??= ctx.world.records;
  }
  // System id of the bank currently sitting in ctx.world.records. Save
  // restores can swap records after init, so swapToSystem re-derives it
  // from the records' own `system` tag whenever possible.
  let activeSystemId = ctx.world.currentSystem;

  // Player ship name for milestone lines; ship.js may overwrite later.
  ctx.world.shipName = ctx.world.shipName ?? 'she';

  // Named-ace rivalry state (JSON-plain, persisted via WORLD_FIELDS
  // 'aceRivalry'). Old saves lack it — same ??= discipline as recordBanks.
  ctx.world.aceRivalry ??= { defeats: 0, lastOutcome: null, hunterSpawned: false, hunterGeneration: 0, hunterDownAt: null, illyxGeneration: 0, illyxDownAt: null, aspirantRisen: 0, aspirantDownAt: null, aspirantFlying: false };

  // Origin payoff arcs (wave 7): flat JSON-plain record persisted via
  // WORLD_FIELDS 'originArc'. Re-resolved per frame where used — save.js
  // restores swap world fields wholesale.
  ctx.world.originArc ??= {
    calls: 0,
    lastCallAt: 0,
    debtCleared: false,
    collectorSent: false,
    calls2: 0,
    lastCallAt2: 0,
    collectorSent2: false,
    reenteredDebt: false,
    debtClearedAgain: false,
    marked: false,
    beautiful: false,
    drifter: false,
    greenhand: false,
    beautiful1: false,
    beautiful2: false,
    marked1: false,
    marked2: false,
    drifter1: false,
    drifter2: false,
    greenhand1: false,
    greenhand2: false,
  };

  let nextEventAt = rollEventGap(ctx);
  let nextMigrationAt = MIGRATION_INTERVAL * (0.5 + Math.random() * 0.5); // first pick ~45–90s in
  let lastBlockadeKillAt = 0;
  let tickAccum = 0;
  // ship.id → world time of last player-caused hit (causer attribution).
  const playerHitAt = new Map();

  /**
   * 'systemLoaded' { to }: stash the outgoing bank under its own system id,
   * swap the destination bank into ctx.world.records (generating it on first
   * visit), and tear down wreck meshes (their coordinates are meaningless in
   * the new space; data survives and re-meshes on return).
   */
  function swapToSystem(ctx, to) {
    const banks = ctx.world.recordBanks ?? (ctx.world.recordBanks = {});
    const cur = ctx.world.records;
    const curSys = (cur.length && cur[0].system) || activeSystemId;
    if (curSys === to) {
      // Boot-restore path: save.js already placed the destination's records
      // in ctx.world.records — adopt them as the bank instead of regenerating.
      banks[to] = cur;
    } else {
      // Empty cur (every record dead, or a pathological save) is never
      // stashed over a real bank — a live bank already references it.
      if (curSys && cur.length) banks[curSys] = cur;
      ctx.world.records = banks[to] ?? (banks[to] = createRecords(ctx, to));
    }
    activeSystemId = to;
  }

  function consumeSystemLoaded(ctx) {
    for (const ev of ctx.lastEvents) {
      if (ev.type !== 'systemLoaded') continue;
      const changed = ev.to !== activeSystemId; // restore re-emits same-system
      swapToSystem(ctx, ev.to);
      teardownWreckMeshes(ctx);
      // Wave 11: a verge arrival arms Old Callow's return beat — only on a
      // real jump in (a death-restore re-emitting the same system is no
      // return, and must not leak a line into docked/station-side ticks).
      if (ev.to === 'verge' && changed) callowVisitArmed = true;
      // Wave 12: the post-vouch refusal re-arms on the same real arrival.
      if (ev.to === 'verge' && changed) callowRefusalArmed = true;
    }
  }

  // ---------- Inter-system migration §8.2 ----------
  function pickMigrant(ctx) {
    // Uniform-random destination among the current system's gates.
    const gates = SYSTEMS[ctx.world.currentSystem]?.gates;
    if (!gates || gates.length === 0) return;
    const dest = gates[(Math.random() * gates.length) | 0].to;
    let chosen = null;
    let count = 0;
    for (const rec of ctx.world.records) {
      // Traders only, enroute and off-screen. The ace and pirates never
      // migrate (pirates are territorial); live ships are the player's
      // business right now.
      if (rec.role !== 'trader' || rec.state !== 'enroute' || rec.live) continue;
      count++;
      if (Math.random() < 1 / count) chosen = rec; // reservoir pick, no alloc
    }
    if (!chosen) return;
    chosen.state = 'inTransit';
    chosen.transitTo = dest;
    chosen.transitEta = ctx.world.time + MIGRATION_ETA[0] + Math.random() * (MIGRATION_ETA[1] - MIGRATION_ETA[0]);
  }

  // Migrants live in their SOURCE bank until the eta passes (the player may
  // jump away meanwhile), so arrivals scan every bank, not just the current.
  function arriveMigrants(ctx) {
    const banks = ctx.world.recordBanks;
    if (!banks) return;
    const now = ctx.world.time;
    for (const sysId in banks) {
      const bank = banks[sysId];
      for (let i = bank.length - 1; i >= 0; i--) {
        const rec = bank[i];
        if (rec.state !== 'inTransit' || now < rec.transitEta) continue;
        bank.splice(i, 1);
        arriveInSystem(ctx, rec, rec.transitTo);
      }
    }
  }

  function arriveInSystem(ctx, rec, destId) {
    const def = SYSTEMS[destId];
    if (!def) {
      // Should never happen (gate.to is validated data) — fail safe home.
      rec.state = 'enroute';
      rec.transitTo = null;
      return;
    }
    const destBank = ensureBank(ctx, destId);
    const station = stationPoint(def);
    const gate = gatePoint(def);
    const planet = planetPoint(def);
    // Route rebuilt station-ward: the record sits exactly ON the arrival
    // gate waypoint (leg 0, legT 1, dir −1) heading home, so a player
    // present in the destination system sees it materialize at the gate.
    rec.route = plainRoute([station, gate, jitter(planet, 80)]);
    rec.legLens = computeLegLens(rec.route);
    rec.leg = 0;
    rec.legT = 1;
    rec.dir = -1;
    rec.dwellUntil = 0;
    rec.system = destId;
    rec.anchor = systemAnchor(destId);
    rec.state = 'enroute';
    rec.live = false;
    rec.transitTo = null;
    rec.transitEta = 0;
    destBank.push(rec);
  }

  function startEvent(ctx, kind) {
    const now = ctx.world.time;
    const dur = EVENT_DURATION[0] + Math.random() * (EVENT_DURATION[1] - EVENT_DURATION[0]);
    ctx.world.activeEvent = { kind, startedAt: now, endsAt: now + dur, system: ctx.world.currentSystem };
    applyEventPressure(ctx, kind);
    ctx.emit('worldEvent', { kind, phase: 'start' });
    if (kind === 'strikeRush') {
      fireMilestone(ctx, 'firstStrikeRush', 'Strike rush. Word spreads.');
    }
    if (kind === 'pirateBlockade') lastBlockadeKillAt = now;
  }

  function endEvent(ctx) {
    const ev = ctx.world.activeEvent;
    ctx.world.activeEvent = null;
    applyEventPressure(ctx, 'clear', ev?.system); // clear the system the event pressured, wherever the player is now
    if (ev) ctx.emit('worldEvent', { kind: ev.kind, phase: 'end' });
    const now = ctx.world.time;
    nextEventAt = now + rollEventGap(ctx);
  }

  // Abstract blockade casualty: the lane kills a trader the player never met.
  function blockadeCasualty(ctx) {
    let chosen = null;
    let count = 0;
    for (const rec of ctx.world.records) {
      if (rec.role === 'trader' && rec.state === 'enroute' && !rec.live) {
        count++;
        if (Math.random() < 1 / count) chosen = rec; // reservoir pick, no alloc
      }
    }
    if (!chosen) return;
    chosen.state = 'dead';
    recordPosition(chosen, _v1);
    const incident = addIncident(ctx, 'destroyed', {
      name: chosen.name,
      faction: chosen.faction,
      role: chosen.role,
      position: _v1,
      causer: 'world',
    });
    const entry = stageAftermath(ctx, incident);
    if (entry) fireMilestone(ctx, 'theWorldDidThat', 'The world did that. You just found it.');
  }

  function consumeIncidents(ctx) {
    for (const ev of ctx.lastEvents) {
      if (ev.type === 'npcHit' && ev.ship) {
        playerHitAt.set(ev.ship.id, ctx.world.time);
      } else if (ev.type === 'npcDestroyed' && ev.ship) {
        const ship = ev.ship;
        const rec = ship.record;
        if (rec) rec.state = 'dead';
        const lastHit = playerHitAt.get(ship.id);
        const causer = lastHit !== undefined && ctx.world.time - lastHit < 8 ? 'player' : 'world';
        const pos = ship.object ? ship.object.position : rec ? recordPosition(rec, _v1) : null;
        if (!pos) continue;
        const incident = addIncident(ctx, 'destroyed', {
          name: rec?.name ?? ship.state?.name ?? 'unknown hull',
          faction: rec?.faction ?? ship.state?.faction ?? 'independent',
          role: rec?.role ?? ship.role ?? 'trader',
          position: pos,
          causer,
        });
        const entry = stageAftermath(ctx, incident);
        if (rec?.role === 'ace') {
          const rivalry = (ctx.world.aceRivalry ??= { defeats: 0, lastOutcome: null, hunterSpawned: false, hunterGeneration: 0, hunterDownAt: null, illyxGeneration: 0, illyxDownAt: null, aspirantRisen: 0, aspirantDownAt: null, aspirantFlying: false });
          rivalry.aspirantRisen ??= 0; // pre-wave-10 saves lack the field
          rivalry.aspirantDownAt ??= null;
          rivalry.aspirantFlying ??= false;
          rivalry.defeats++;
          rivalry.lastOutcome = 'destroyed';
          fireMilestone(ctx, 'firstAceDefeated', `${ctx.world.shipName ?? 'your ship'} — your name in the dark now.`);
          // Aspirant cycle (wave 10): the defeated ace is a new name, not a
          // line-bearer — mark it downed; the tick rises the next name after
          // aspirants.respawnDelay. First fall ever fires 'aspirantBroken'
          // (fireMilestone guards duplicates). Generic ace bookkeeping above
          // still counts these defeats.
          if (rec.aspirant) {
            rivalry.aspirantFlying = false;
            rivalry.aspirantDownAt = ctx.world.time;
            fireMilestone(ctx, 'aspirantBroken', 'A new name goes out. The lanes have more where that came from.');
            // Wave 11: when the THIRD name falls the rim answers once — a
            // final word and one shift in her song, not an ending (§25).
            // fireMilestone guards the once-ever; the shift rides its
            // first-fire return so it, too, sounds exactly once.
            if (rivalry.aspirantRisen >= NAMED_GUNS.aspirants.names.length && fireMilestone(ctx, 'rimAnswered', 'The lanes are done sending names. The quiet after is yours to fly.')) {
              ctx.emit('songShift', { reason: 'aftermath' });
            }
          }
          // Named-Gun lineage (wave 7): the defeated ace is the hunter →
          // schedule the next generation, or break the line at the last.
          if (rec.name === ACES.hunter.name && rec.role === 'ace' && rec.faction === ACES.hunter.faction) {
            rivalry.hunterGeneration ??= 0; // pre-wave-7 saves lack the field
            if (rivalry.hunterGeneration >= ACES.hunter.lineage.maxGenerations - 1) {
              fireMilestone(ctx, 'namedGunBroken', 'There will be no fourth Vane. Even the Ledger calls it enough.');
            } else {
              rivalry.hunterDownAt = ctx.world.time;
            }
          }
          // Freehold lineage (wave 8): Illyx's name is carried by kin. One
          // successor only — defeating him breaks the line for good.
          if (rec.name === ACES.illyx.name && rec.role === 'ace' && rec.faction === ACES.illyx.faction) {
            rivalry.illyxGeneration ??= 0; // pre-wave-8 saves lack the field
            if (rivalry.illyxGeneration >= ACES.illyx.lineage.maxGenerations - 1) {
              fireMilestone(ctx, 'illyxLineBroken', 'There will be no third Illyx. Freehold Landing leaves his berth lit.');
            } else {
              rivalry.illyxDownAt = ctx.world.time;
            }
          }
        }
        if (entry && causer !== 'player') {
          fireMilestone(ctx, 'theWorldDidThat', 'The world did that. You just found it.');
        }
      } else if (ev.type === 'npcSurrendered' && ev.ship) {
        const ship = ev.ship;
        const rec = ship.record;
        const outcome = ev.outcome ?? 'ransom';
        if (rec && (outcome === 'captured' || outcome === 'capture')) rec.state = 'captured';
        const pos = ship.object ? ship.object.position : rec ? recordPosition(rec, _v1) : null;
        if (pos) {
          addIncident(ctx, 'surrendered', {
            name: rec?.name ?? ship.state?.name ?? 'unknown hull',
            faction: rec?.faction ?? ship.state?.faction ?? 'independent',
            role: rec?.role ?? ship.role ?? 'trader',
            position: pos,
            causer: 'player',
            outcome,
          });
        }
        fireMilestone(ctx, 'firstCapitulation', 'They yield. First capitulation.');
        if (outcome === 'tribute') fireMilestone(ctx, 'firstTribute', 'Tribute paid. The lane remembers.');
        if (rec?.role === 'ace') {
          const rivalry = (ctx.world.aceRivalry ??= { defeats: 0, lastOutcome: null, hunterSpawned: false, hunterGeneration: 0, hunterDownAt: null, illyxGeneration: 0, illyxDownAt: null, aspirantRisen: 0, aspirantDownAt: null, aspirantFlying: false });
          rivalry.aspirantRisen ??= 0; // pre-wave-10 saves lack the field
          rivalry.aspirantDownAt ??= null;
          rivalry.aspirantFlying ??= false;
          rivalry.defeats++;
          rivalry.lastOutcome = outcome; // 'flee' | 'jettison' | 'ransom' | ...
          fireMilestone(ctx, 'firstAceDefeated', `${ctx.world.shipName ?? 'your ship'} — your name in the dark now.`);
          // Aspirant cycle (wave 10): the defeated ace is a new name, not a
          // line-bearer — mark it downed; the tick rises the next name after
          // aspirants.respawnDelay. First fall ever fires 'aspirantBroken'
          // (fireMilestone guards duplicates). Generic ace bookkeeping above
          // still counts these defeats.
          if (rec.aspirant) {
            rivalry.aspirantFlying = false;
            rivalry.aspirantDownAt = ctx.world.time;
            fireMilestone(ctx, 'aspirantBroken', 'A new name goes out. The lanes have more where that came from.');
            // Wave 11: when the THIRD name falls the rim answers once — a
            // final word and one shift in her song, not an ending (§25).
            // fireMilestone guards the once-ever; the shift rides its
            // first-fire return so it, too, sounds exactly once.
            if (rivalry.aspirantRisen >= NAMED_GUNS.aspirants.names.length && fireMilestone(ctx, 'rimAnswered', 'The lanes are done sending names. The quiet after is yours to fly.')) {
              ctx.emit('songShift', { reason: 'aftermath' });
            }
          }
          // Named-Gun lineage (wave 7): the defeated ace is the hunter →
          // schedule the next generation, or break the line at the last.
          if (rec.name === ACES.hunter.name && rec.role === 'ace' && rec.faction === ACES.hunter.faction) {
            rivalry.hunterGeneration ??= 0; // pre-wave-7 saves lack the field
            if (rivalry.hunterGeneration >= ACES.hunter.lineage.maxGenerations - 1) {
              fireMilestone(ctx, 'namedGunBroken', 'There will be no fourth Vane. Even the Ledger calls it enough.');
            } else {
              rivalry.hunterDownAt = ctx.world.time;
            }
          }
          // Freehold lineage (wave 8): Illyx's name is carried by kin. One
          // successor only — defeating him breaks the line for good.
          if (rec.name === ACES.illyx.name && rec.role === 'ace' && rec.faction === ACES.illyx.faction) {
            rivalry.illyxGeneration ??= 0; // pre-wave-8 saves lack the field
            if (rivalry.illyxGeneration >= ACES.illyx.lineage.maxGenerations - 1) {
              fireMilestone(ctx, 'illyxLineBroken', 'There will be no third Illyx. Freehold Landing leaves his berth lit.');
            } else {
              rivalry.illyxDownAt = ctx.world.time;
            }
          }
        }
      }
    }
    // Trim stale causer attributions (cheap pass, tiny map).
    if (playerHitAt.size > 64) {
      for (const [id, t] of playerHitAt) {
        if (ctx.world.time - t > 30) playerHitAt.delete(id);
      }
    }
  }

  function galaxyTick(ctx) {
    const blockade = ctx.world.activeEvent?.kind === 'pirateBlockade';
    const strikeRush = ctx.world.activeEvent?.kind === 'strikeRush';
    for (const rec of ctx.world.records) {
      if (rec.state === 'dead' || rec.state === 'captured' || rec.state === 'inTransit') continue;
      if (rec.state === 'docked') {
        if (ctx.world.time >= rec.dwellUntil) rec.state = 'enroute';
        continue;
      }
      // enroute: honor any turnaround dwell, then advance along the current
      // leg at the class cruise speed (state.js, our units).
      if (ctx.world.time < rec.dwellUntil) continue;
      let speed = SHIP_CLASSES[rec.classKey]?.cruise ?? 90;
      // Pirates hurry toward the lane during a blockade / a strike rush.
      if ((blockade || strikeRush) && rec.role === 'pirate') speed *= 1.6;
      const legLen = rec.legLens[rec.leg] || 1;
      rec.legT += (speed * GALAXY_TICK * rec.dir) / legLen;
      if (rec.legT >= 1) {
        if (rec.leg + 1 >= rec.route.length - 1) {
          rec.legT = 1;
          rec.dir = -1;
          rec.dwellUntil = ctx.world.time + 10 + Math.random() * 20; // brief turnaround
        } else {
          rec.leg++;
          rec.legT = 0;
        }
      } else if (rec.legT <= 0) {
        if (rec.leg === 0) {
          rec.legT = 0;
          rec.dir = 1;
          // Waypoint 0 is home: traders/patrols dock at the station.
          if (rec.role === 'trader' || rec.role === 'patrol') {
            rec.state = 'docked';
            rec.dwellUntil = ctx.world.time + 30 + Math.random() * 60;
          } else {
            rec.dwellUntil = ctx.world.time + 10;
          }
        } else {
          rec.leg--;
          rec.legT = 1;
        }
      }
    }
  }

  return {
    update(dt) {
      const now = ctx.world.time;

      // Jump handoff first: swap record banks + tear down foreign wreck
      // meshes before anything else reads ctx.world.records this frame.
      consumeSystemLoaded(ctx);

      // Legacy wave-1 saves restored records without a system tag — adopt
      // them into the active system's bank so traffic's system filter and
      // the bank stash keep working.
      for (const rec of ctx.world.records) {
        if (!rec.system) {
          rec.system = activeSystemId;
          if (!rec.anchor) rec.anchor = systemAnchor(activeSystemId);
        }
      }

      // Market random walk (§8.4 band enforced inside tickPrices).
      tickPrices(ctx, dt);

      // Dynamic world events §8.5 — one at a time.
      if (ctx.world.activeEvent) {
        if (now >= ctx.world.activeEvent.endsAt) endEvent(ctx);
        else if (ctx.world.activeEvent.kind === 'pirateBlockade' && now - lastBlockadeKillAt >= BLOCKADE_KILL_INTERVAL) {
          lastBlockadeKillAt = now;
          blockadeCasualty(ctx);
        }
      } else if (now >= nextEventAt) {
        startEvent(ctx, EVENT_KINDS[(Math.random() * EVENT_KINDS.length) | 0]);
      }

      // Galaxy tick: abstract route progress.
      tickAccum += dt;
      if (tickAccum >= GALAXY_TICK) {
        tickAccum -= GALAXY_TICK;
        galaxyTick(ctx);
      }

      // Inter-system migration §8.2: departures from the current bank,
      // arrivals into whichever bank the migrant left from.
      if (now >= nextMigrationAt) {
        nextMigrationAt = now + MIGRATION_INTERVAL * (0.75 + Math.random() * 0.5);
        pickMigrant(ctx);
      }
      arriveMigrants(ctx);

      // Witness Rule: incidents → aftermath, only from real events.
      consumeIncidents(ctx);

      // Named-Gun hunter: fear crossing the threshold buys Sister Vane, once
      // ever (cheap per-frame guard; spawn itself allocates once).
      if (!ctx.world.aceRivalry?.hunterSpawned && ctx.world.fear >= ACES.hunter.fearThreshold) {
        spawnHunterAce(ctx);
      }

      // Named-Gun lineage (wave 7): a defeated Vane's successor takes up the
      // name after respawnDelay world-seconds — until the line is broken.
      const rivalry = ctx.world.aceRivalry;
      // wave 10: pre-wave-10 saves lack the aspirant fields — same ??=
      // discipline as the wave-8 illyx guards in the defeat handlers.
      if (rivalry) {
        rivalry.aspirantRisen ??= 0;
        rivalry.aspirantDownAt ??= null;
        rivalry.aspirantFlying ??= false;
      }
      if (rivalry && rivalry.hunterDownAt != null && now - rivalry.hunterDownAt >= ACES.hunter.lineage.respawnDelay) {
        spawnHunterSuccessor(ctx);
      }
      // Freehold lineage (wave 8): a defeated Illyx's kin takes up the name
      // after respawnDelay world-seconds — one successor, then the line ends.
      if (rivalry && rivalry.illyxDownAt != null && now - rivalry.illyxDownAt >= ACES.illyx.lineage.respawnDelay) {
        spawnIllyxSuccessor(ctx);
      }

      // Rim without Named Guns (wave 9): once both lines are broken the rim
      // reacts — one milestone, one fear bump. fireMilestone's guard makes
      // this fire exactly once; fear is applied only on that first fire.
      if (ctx.world.milestones.includes('namedGunBroken') && ctx.world.milestones.includes('illyxLineBroken')) {
        if (fireMilestone(ctx, 'rimWithoutGuns', 'No Named Gun flies the rim. The lanes know it — small crews fly taller, and the dark gets checked a little less.')) {
          ctx.world.fear += NAMED_GUNS.fearBonus;
        }
      }

      // Aspirant cycle (wave 10): no Named Guns left + fear maxed → the rim
      // grows new names. One flies at a time; the first rise is immediate
      // (aspirantDownAt starts null), later rises wait respawnDelay after a
      // defeat; the cycle ends when all three names are spent. Cheap
      // per-frame guard; the spawn allocates once.
      if (
        rivalry &&
        ctx.world.milestones.includes('rimWithoutGuns') &&
        ctx.world.fear >= NAMED_GUNS.aspirants.fearThreshold &&
        !rivalry.aspirantFlying &&
        rivalry.aspirantRisen < NAMED_GUNS.aspirants.names.length &&
        (rivalry.aspirantDownAt == null || now - rivalry.aspirantDownAt >= NAMED_GUNS.aspirants.respawnDelay)
      ) {
        spawnAspirant(ctx);
      }

      // Origin payoff arcs (wave 7): creditor come-due + one-time payoffs.
      originArcTick(ctx);

      // Hermit pirate (wave 10): the Verge's Old Callow hails once, near.
      hermitPirateBeat(ctx);
      // Wave 11: he remembers returns (one line per verge visit, armed by
      // the jump scan) and sells a single vouch into the keepers' second
      // column (hail intent 'callowVouch').
      callowReturnBeat(ctx);
      callowVouchOffer(ctx);

      // First Scare: any live ship pushed into the bargaining band §8.8.
      if (!ctx.world.milestones.includes('firstScare')) {
        for (const live of ctx.ships) {
          const st = live.state;
          if (st && !st.destroyed && resolveBand(st.resolve) === 'bargaining') {
            fireMilestone(ctx, 'firstScare', 'They are breaking. First scare.');
            break;
          }
        }
      }

      // Aftermath lifecycle: expire old wrecks, build meshes for the CURRENT
      // system's entries lacking one (covers save restores and jump returns —
      // foreign-system entries keep their data but stay unmeshed until the
      // player returns).
      const curSys = ctx.world.currentSystem;
      for (let i = ctx.world.aftermath.length - 1; i >= 0; i--) {
        const entry = ctx.world.aftermath[i];
        if (now >= entry.expiresAt) {
          removeWreckMesh(ctx, entry.id);
          ctx.world.aftermath.splice(i, 1);
          continue;
        }
        if ((entry.system ?? curSys) === curSys && !wreckMeshes.has(entry.id)) {
          wreckMeshes.set(entry.id, makeWreckMesh(ctx, entry));
        }
      }
      for (const wreck of wreckMeshes.values()) {
        wreck.group.rotation.y += dt * 0.04;
        wreck.emberMat.opacity = 0.45 + 0.3 * Math.sin(ctx.elapsed * 2.5 + wreck.phase);
      }
    },
  };
}
