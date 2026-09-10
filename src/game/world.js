import * as THREE from 'three';
import { COMMODITIES, SHIP_CLASSES, SYSTEMS, BANDS, ACES, ORIGIN_ARCS, NAMED_GUNS, CALLOW, JUMP, ESCAPE, DEFENSE } from './state.js';
import { initPrices, tickPrices, applyEventPressure } from './market.js';
import { writeStationHold } from './traffic-feel.js';
import {
  readEscape,
  escapeActive,
  escapeRouted,
  writeEscapePosition,
  stepEscapeToward,
  driftEscape,
  tickEscape,
  escapeArriveRadius,
  authoredGate,
  escapeVec,
  replanEscape,
  writeEscapeWakeSite,
  finishEscape,
  escapePublicIdentity,
} from './npc-escape.js';

/**
 * World — the persistent layer (doc §8 Living World), multi-system.
 *
 * - RECORD BANKS §8.2/§15.3: each star system owns a bank of persistent NPC
 *   identities generated lazily from SYSTEMS[id].cast (traders/pirates/
 *   patrols/ace flag) on first need. Miner count is derived from
 *   cast.traders (busy systems 1–2, hush/verge 0) — not a cast field.
 *   ctx.world.recordBanks = { sysId: [...] };
 *   ctx.world.records REMAINS the current system's array (station.js/npc.js
 *   keep reading it). On 'systemLoaded' the outgoing array is stashed under
 *   its own system id and the destination bank is swapped in (generated on
 *   first visit). The named ace 'Carver Illyx' exists ONLY in the Freehold
 *   cast — his bounty lives there.
 * - ROUTES §15.3: traders fly a station hold (outside the D5 cylinder) →
 *   one physical dest gate (def.gates). Patrols keep a station hold → gate →
 *   planet. Miners keep a station hold → asteroid field center (never a
 *   planet). Stored JSON-plain so save.js can serialize them. Waypoint 0
 *   is the "home" stop (station hold for traders/miners/patrols).
 * - INTER-SYSTEM MIGRATION §8.2: a trader that reaches its outbound gate
 *   dwells there. Only the ~90s pickMigrant interval may mark one
 *   gate-ready trader 'inTransit' toward that gate's `.to` (physical
 *   gates only — never hub routes). Unpicked lingerers reverse to the
 *   station so the current system keeps local traffic. When the eta
 *   passes the record moves to the destination bank at that system's
 *   arrival gate, heading station-ward. The ace, pirates, and miners NEVER migrate.
 * - GALAXY TICK: every existing recordBanks entry advances ~once per
 *   second. Unvisited systems stay ungenerated. One pickMigrant per
 *   interval may take a gate-ready trader from any existing bank.
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

function plusXOf(station) {
  return { x: station.x + 1, y: station.y, z: station.z };
}

// One shared route serves mixed classes; freighter hold fits every hull.
function stationHoldVec(station, fromPos) {
  const hold = new THREE.Vector3();
  writeStationHold(hold, station, 'freighter', fromPos);
  return hold;
}

/** Station hold → dest gate. `outboundTo` is always a physical `gates[n].to`. */
export function traderRouteWaypoints(def, i) {
  const station = stationPoint(def);
  const gates = def.gates;
  if (!gates?.length) {
    return { waypoints: [stationHoldVec(station, plusXOf(station))], outboundTo: null };
  }
  const idx = ((i % gates.length) + gates.length) % gates.length;
  const dest = gates[idx];
  const p = dest.position;
  const gate = new THREE.Vector3(p[0], p[1], p[2]);
  return {
    waypoints: [stationHoldVec(station, gate), gate],
    outboundTo: dest.to,
  };
}

function traderArrivalWaypoints(def, fromId) {
  const station = stationPoint(def);
  const gates = def.gates;
  if (!gates?.length) {
    return { waypoints: [stationHoldVec(station, plusXOf(station))], outboundTo: null };
  }
  let idx = fromId ? gates.findIndex((g) => g.to === fromId) : 0;
  if (idx < 0) idx = 0;
  const dest = gates[idx];
  const p = dest.position;
  const gate = new THREE.Vector3(p[0], p[1], p[2]);
  return {
    waypoints: [stationHoldVec(station, gate), gate],
    outboundTo: dest.to,
  };
}
function stationPoint(def) {
  const p = def.station.position;
  return new THREE.Vector3(p[0], p[1], p[2]);
}
function fieldPoint(def) {
  // Asteroid field center. Never a planet — miners haul rock, not colony lanes.
  const f = def.field;
  const c = f && f.center;
  if (Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]) && Number.isFinite(c[2])) {
    return new THREE.Vector3(c[0], c[1], c[2]);
  }
  const s = stationPoint(def);
  return jitter(new THREE.Vector3(s.x + 320, s.y - 24, s.z - 280), 50);
}

/** Busy systems get 1–2 miners; hush/verge (0–1 traders) get none. */
export function minerCountForCast(cast) {
  const traders = (cast && cast.traders) | 0;
  return Math.min(2, Math.max(0, (traders / 4) | 0));
}

export const MINER_CARGO_CAP = 8;
const MINER_OFFSCREEN_INTERVAL = 5;

function cargoUnitsOf(rec) {
  const cargo = rec && rec.cargo;
  if (!Array.isArray(cargo)) return 0;
  let n = 0;
  for (let i = 0; i < cargo.length; i++) n += cargo[i].units | 0;
  return n;
}

function addMinerOre(rec, units) {
  rec.cargo ??= [];
  const room = MINER_CARGO_CAP - cargoUnitsOf(rec);
  if (room <= 0 || units <= 0) return 0;
  const add = units < room ? units : room;
  const key = 'rawOre';
  for (let i = 0; i < rec.cargo.length; i++) {
    if (rec.cargo[i].commodity === key) {
      rec.cargo[i].units = (rec.cargo[i].units | 0) + add;
      return add;
    }
  }
  rec.cargo.push({ commodity: key, units: add });
  return add;
}

function minerAtField(rec) {
  if (!rec || rec.role !== 'miner' || !rec.route || rec.route.length < 2) return false;
  const lastLeg = rec.route.length - 2;
  return rec.leg === lastLeg && rec.legT >= 0.98 && rec.dir > 0;
}

function tickMinerExtract(rec, ctx) {
  if (rec.live) return;
  rec.cargo ??= [];
  rec.mineAt ??= 0;
  if (cargoUnitsOf(rec) >= MINER_CARGO_CAP) return;
  const now = Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  if (now - rec.mineAt < MINER_OFFSCREEN_INTERVAL) return;
  rec.mineAt = now;
  addMinerOre(rec, 1);
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
const QSHIP_COVERS = {
  freehold: ['Mercy of Tarsus', 'Long Orchard'],
  veridian: ['Pale Consign'],
};
const PATROL_NAMES = {
  freehold: ['Watchful Apt', 'Lancer Po'],
  veridian: ['Steadfast Ivo', 'Pale Warrant', 'Crescent Anh'],
};
const MINER_NAMES = {
  freehold: ['Claim Wren', 'Pit Lamp'],
  veridian: ['Surveyor Kel'],
  redmarch: ['Tithe Pick'],
};
// Wave 51: filter on `bulk`, not just `legal`. The wave added 7 exotic ores
// (slagIron … wakeglass) to COMMODITIES, all legal — but an exotic reaches a
// market only by being mined and sold by a player, never by spawning in
// traffic. The four bulk staples (provisions, refinedMetals, rawOre,
// livingRock) are exactly the pre-wave-51 legal set, so Freehold grain
// haulers keep byte-identical manifests and never carry void platinum.
const LEGAL_KEYS = Object.keys(COMMODITIES).filter((k) => COMMODITIES[k].legal && COMMODITIES[k].bulk);

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

function makeRecord(ctx, { name, classKey, faction, role, route, cargo, bounty = 0, system, outboundTo = null }) {
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
    role, // trader | pirate | patrol | ace | miner
    personality: Math.random() * 20 - 10, // ±10 resolve nudge §7.2
    resolveSeed: Math.random(), // npc.js derives base resolve from this
    bounty,
    system, // owning star system id (bank membership)
    anchor: systemAnchor(system), // ring-mode orbit center for npc.js
    state: 'enroute', // enroute | docked | dead | captured | inTransit
    live: false, // currently instantiated by traffic.js
    outboundTo: outboundTo ?? null, // dest system id; physical gates[n].to only
    gateLinger: false, // parked at dest gate; pickMigrant may take this hull
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
  const otherFaction = SYSTEMS[def.gates?.[0]?.to]?.faction ?? 'independent';
  const traderFactions = [def.faction, otherFaction, 'independent'];
  const cast = def.cast;
  const records = [];

  for (let i = 0; i < cast.traders; i++) {
    const planned = traderRouteWaypoints(def, i);
    const destWp = (planned.waypoints[1] ?? planned.waypoints[0]).clone();
    records.push(
      makeRecord(ctx, {
        name: poolName(TRADER_NAMES, sysId, i, 'Freighter'),
        classKey: 'freighter',
        faction: traderFactions[i % traderFactions.length],
        role: 'trader',
        route: [planned.waypoints[0].clone(), jitter(destWp, 60)],
        cargo: traderCargo(),
        system: sysId,
        outboundTo: planned.outboundTo,
      }),
    );
  }
  for (let i = 0; i < cast.pirates; i++) {
    // Pirates haunt the gate and the lane back toward the station.
    const laneMid = new THREE.Vector3().lerpVectors(station, gate, 0.5);
    jitter(laneMid, 90);
    const rec = makeRecord(ctx, {
      name: poolName(PIRATE_NAMES, sysId, i, 'Reaver'),
      classKey: 'cutter',
      faction: i === 0 ? 'redledger' : 'independent',
      role: 'pirate',
      route: [jitter(gate.clone(), 90), laneMid, jitter(gate.clone(), 120)],
      cargo: [],
      bounty: 300 + i * 75, // posted price — station.js bounty-pirate jobs read this
      system: sysId,
    });
    // wave 31: odd-index pirates fly as disguised Q-ships — these fields are
    // read by npc.js (spawn alias / reveal on first hostile act) and hud.js
    // (target bracket tells under the Mk II scanner). Index 0 (the redledger
    // leader — Verge's 'Old Callow') and all even indices stay classic.
    if (i % 2 === 1) {
      rec.qship = true;
      rec.coverClass = 'freighter';
      rec.coverName = poolName(QSHIP_COVERS, sysId, (i - 1) / 2, 'Hauler');
      rec.coverFaction = def.faction;
    }
    records.push(rec);
  }
  for (let i = 0; i < cast.patrols; i++) {
    records.push(
      makeRecord(ctx, {
        name: poolName(PATROL_NAMES, sysId, i, 'Patrol'),
        classKey: 'heavy',
        faction: i === 0 ? def.faction : otherFaction,
        role: 'patrol',
        route: [writeStationHold(new THREE.Vector3(), station, 'heavy', gate), jitter(gate.clone(), 50), jitter(planet.clone(), 60)],
        cargo: [],
        system: sysId,
      }),
    );
  }
  const minerN = minerCountForCast(cast);
  const field = fieldPoint(def);
  const minerFactions = [def.faction, 'independent'];
  for (let i = 0; i < minerN; i++) {
    const destWp = field.clone();
    records.push(
      makeRecord(ctx, {
        name: poolName(MINER_NAMES, sysId, i, 'Miner'),
        classKey: i % 2 === 0 ? 'light' : 'cutter',
        faction: minerFactions[i % minerFactions.length],
        role: 'miner',
        route: [
          writeStationHold(new THREE.Vector3(), station, i % 2 === 0 ? 'light' : 'cutter', destWp),
          jitter(destWp, 50),
        ],
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

// ---------- Inter-system migration registry §8.2 ----------
// In-transit registry: pickMigrant registers each record it sends off, and
// arriveMigrants iterates ONLY this list — per-frame cost is O(in transit),
// never O(visited banks) (a long save visits dozens of systems; scanning
// every bank every frame scaled with that). Entries are { rec, sysId } where
// sysId keys the bank currently holding the record — migrants ride their
// SOURCE bank until the eta passes, so a player jump mid-transit never
// strands one. save.js restores recordBanks wholesale, so the registry is
// REBUILT by scanning all banks once on every 'systemLoaded' (which covers
// cross-system restores) AND whenever the recordBanks reference itself is
// swapped — a same-system restore emits no 'systemLoaded', so the world's
// update detects the swap by identity before each arriveMigrants pass.
// Restore-time O(banks) is fine; per-frame stays O(in transit) plus one
// reference compare.
const inTransitRegistry = [];

function rebuildTransitRegistry(ctx) {
  inTransitRegistry.length = 0;
  const banks = ctx.world.recordBanks;
  if (!banks) return;
  for (const sysId in banks) {
    const bank = banks[sysId];
    for (let i = 0; i < bank.length; i++) {
      const rec = bank[i];
      if (rec.role === 'trader') normalizeTraderRecord(rec);
      if (rec.role === 'miner') normalizeMinerRecord(rec);
      if (rec.role === 'patrol') healPadHome(rec);
      if (rec.state === 'inTransit') inTransitRegistry.push({ rec, sysId });
    }
  }
}

/**
 * Issue #68: is a bearer of `name` still flying BECAUSE IT FLED — in this
 * bank, mid-crossing, or in another system's bank? Dead and captured records
 * do not count, and neither does any other surrender alternative: a ransomed
 * or jettisoning ace keeps the pre-existing successor semantics exactly.
 * Only flight — the outcome this issue made survivable — stands a pending
 * timer down. Bounded scan over already-generated banks, run only when a
 * lineage timer comes due.
 */
function livingFledBearerExists(ctx, name) {
  const banks = ctx.world.recordBanks;
  if (!banks || typeof banks !== 'object' || typeof name !== 'string') return false;
  for (const sysId in banks) {
    if (!Object.hasOwn(banks, sysId)) continue;
    const bank = banks[sysId];
    if (!Array.isArray(bank)) continue;
    for (let i = 0; i < bank.length; i++) {
      const rec = bank[i];
      if (!rec || rec.name !== name) continue;
      if (rec.state === 'dead' || rec.state === 'captured') continue;
      if (rec.survivedByFlight === true) return true;
    }
  }
  return false;
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
  // Issue #68: a bearer who FLED is alive somewhere — in this bank, mid-
  // crossing, or in another system's bank. A pending successor timer left
  // over from an older outcome must never put a second living bearer of the
  // same name in the galaxy. Stand the timer down instead.
  if (livingFledBearerExists(ctx, ACES.hunter.name)) {
    rivalry.hunterDownAt = null;
    return;
  }
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
  // Issue #68: same guard as the hunter line — kin do not take up a name its
  // living bearer is still flying, wherever the escape carried them.
  if (livingFledBearerExists(ctx, ACES.illyx.name)) {
    rivalry.illyxDownAt = null;
    return;
  }
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

// Escape scratch — module scope, never allocated per frame.
const _escapePos = { x: 0, y: 0, z: 0 };

/**
 * Abstract route position estimate (§8.2). Writes into `out` (Vector3) —
 * zero allocation. traffic.js uses this as the spawn point.
 */
export function recordPosition(rec, out) {
  // Issue #68: an active escape OWNS this record's position — the abstract
  // lane route is stale the moment the hull broke for a gate or the station,
  // and traffic.js must re-instantiate the runner where it actually is.
  if (escapeActive(rec) && writeEscapePosition(readEscape(rec), _escapePos)) {
    return out.set(_escapePos.x, _escapePos.y, _escapePos.z);
  }
  const route = rec.route;
  if (!route || route.length === 0) return out.set(0, 0, 0);
  if (rec.state === 'docked' || route.length === 1) {
    const w = route[0];
    return out.set(w.x, w.y, w.z);
  }
  const a = route[rec.leg];
  const b = route[rec.leg + 1];
  if (!a || !b) {
    const w = a ?? route[0];
    return out.set(w.x, w.y, w.z);
  }
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
const GATE_HOLD = [30, 50]; // s parked at dest gate before reverse

const PAD_HOME_EPS = 0.5;

function holdClassFor(rec) {
  if (rec.role === 'trader') return 'freighter';
  const key = rec.classKey;
  if (rec.role === 'patrol') {
    if (key === 'light' || key === 'ace' || key === 'cutter' || key === 'heavy' || key === 'frigate' || key === 'freighter') {
      return key;
    }
    return 'heavy';
  }
  if (key === 'light' || key === 'cutter') return key;
  return 'light';
}

function holdFromPos(rec, def, station) {
  const wp1 = rec.route && rec.route[1];
  if (wp1) {
    const x = wp1.x;
    const y = wp1.y;
    const z = wp1.z;
    if (Number.isFinite(x) && Number.isFinite(z)) {
      return { x, y: Number.isFinite(y) ? y : station.y, z };
    }
  }
  const g = def.gates?.[0]?.position;
  if (g) {
    const gx = Number.isFinite(g.x) ? g.x : g[0];
    const gy = Number.isFinite(g.y) ? g.y : g[1];
    const gz = Number.isFinite(g.z) ? g.z : g[2];
    if (Number.isFinite(gx) && Number.isFinite(gz)) {
      return { x: gx, y: Number.isFinite(gy) ? gy : station.y, z: gz };
    }
  }
  return plusXOf(station);
}

/**
 * Old saves park route[0] on the station pad. Rewrite that home waypoint
 * through writeStationHold so it sits outside the D5 cylinder.
 * Missing/NaN system or station is a no-op.
 */
export function healPadHome(rec) {
  if (!rec) return rec;
  const role = rec.role;
  if (role !== 'trader' && role !== 'miner' && role !== 'patrol') return rec;
  if (typeof writeStationHold !== 'function') return rec;
  const sysId = rec.system;
  if (!sysId || !Object.hasOwn(SYSTEMS, sysId)) return rec;
  const def = SYSTEMS[sysId];
  const pos = def && def.station && def.station.position;
  if (!pos) return rec;
  const sx = Number.isFinite(pos.x) ? pos.x : pos[0];
  const sy = Number.isFinite(pos.y) ? pos.y : pos[1];
  const sz = Number.isFinite(pos.z) ? pos.z : pos[2];
  if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(sz)) return rec;
  const route = rec.route;
  if (!Array.isArray(route) || route.length === 0) return rec;
  const wp0 = route[0];
  if (!wp0) return rec;
  const wx = wp0.x;
  const wz = wp0.z;
  if (!Number.isFinite(wx) || !Number.isFinite(wz)) return rec;
  if (Math.hypot(wx - sx, wz - sz) > PAD_HOME_EPS) return rec;
  const station = { x: sx, y: sy, z: sz };
  route[0] = writeStationHold({ x: 0, y: 0, z: 0 }, station, holdClassFor(rec), holdFromPos(rec, def, station));
  rec.legLens = computeLegLens(route);
  return rec;
}

/** Heal outboundTo and clamp old 3-waypoint trader routes to station↔gate. */
export function normalizeTraderRecord(rec) {
  if (!rec || rec.role !== 'trader') return rec;
  rec.outboundTo ??= null;
  if (rec.system && SYSTEMS[rec.system]?.gates?.length) traderOutboundDest(rec, rec.system);
  const route = rec.route;
  if (!Array.isArray(route) || route.length === 0) return rec;
  if (route.length > 2) {
    rec.route = [route[0], route[1]];
    rec.legLens = computeLegLens(rec.route);
    if (rec.leg >= rec.route.length - 1) {
      rec.leg = rec.route.length - 2;
      rec.legT = 1;
    }
  }
  if (!Number.isFinite(rec.leg) || rec.leg < 0) rec.leg = 0;
  const maxLeg = Math.max(0, rec.route.length - 2);
  if (rec.leg > maxLeg) rec.leg = maxLeg;
  if (rec.dir !== 1 && rec.dir !== -1) rec.dir = 1;
  rec.gateLinger ??= false;
  if (!Number.isFinite(rec.legT)) rec.legT = 0;
  if (rec.legT > 1) rec.legT = 1;
  if (rec.legT < 0) rec.legT = 0;
  healPadHome(rec);
  if (!Array.isArray(rec.legLens) || rec.legLens.length !== rec.route.length - 1) {
    rec.legLens = computeLegLens(rec.route);
  }
  return rec;
}

export function normalizeMinerRecord(rec) {
  if (!rec || rec.role !== 'miner') return rec;
  healPadHome(rec);
  return rec;
}

export function traderOutboundDest(rec, sysId) {
  const id = sysId ?? rec.system;
  if (!id || !Object.hasOwn(SYSTEMS, id)) return null;
  const gates = SYSTEMS[id].gates;
  if (!gates?.length) return null;
  if (rec.outboundTo && gates.some((g) => g.to === rec.outboundTo)) return rec.outboundTo;
  let pick = 0;
  const n = rec.id;
  if (typeof n === 'string') {
    let h = 0;
    for (let i = 0; i < n.length; i++) h = (h + n.charCodeAt(i)) | 0;
    pick = Math.abs(h) % gates.length;
  }
  rec.outboundTo = gates[pick].to;
  return rec.outboundTo;
}

export function traderAtOutboundGate(rec) {
  if (!rec || rec.role !== 'trader' || rec.state !== 'enroute') return false;
  // Issue #68: a runner's frozen lane position is not a gate dwell. An
  // escaping record is never an ordinary migration candidate.
  if (escapeActive(rec)) return false;
  normalizeTraderRecord(rec);
  const lastLeg = rec.route.length - 2;
  if (lastLeg < 0) return false;
  if (rec.leg !== lastLeg || rec.legT < 0.98) return false;
  return rec.dir > 0 || rec.gateLinger === true;
}

/**
 * Start an inter-system crossing for `rec`.
 *
 * Default policy is UNCHANGED: ordinary migration is trader-only, so ambient
 * pirate/ace migration stays impossible. `opts.escape === true` is the single
 * narrow opt-in added by issue #68 — it relaxes the ROLE gate and nothing
 * else. Every other guard (terminal state, already inTransit, a real physical
 * outbound edge to a known non-self destination, one registry membership)
 * still applies to both paths.
 */
export function beginTransit(ctx, rec, dest, bankSysId, opts) {
  if (!rec || rec.state === 'inTransit') return false;
  if (rec.state === 'dead' || rec.state === 'captured') return false;
  const escapeMode = opts != null && opts.escape === true;
  if (!escapeMode && rec.role !== 'trader') return false;
  if (!dest || !Object.hasOwn(SYSTEMS, dest)) return false;
  const sysId = bankSysId ?? rec.system ?? ctx.world?.currentSystem;
  if (!sysId || dest === sysId) return false;
  const gates = Object.hasOwn(SYSTEMS, sysId) ? SYSTEMS[sysId].gates : null;
  if (!gates?.some((g) => g.to === dest)) return false;
  const lo = MIGRATION_ETA[0];
  const hi = MIGRATION_ETA[1];
  const span = hi - lo;
  let eta = ctx.world.time + lo + Math.random() * (Number.isFinite(span) ? span : 0);
  if (!Number.isFinite(eta)) eta = (Number.isFinite(ctx.world.time) ? ctx.world.time : 0) + lo;
  rec.state = 'inTransit';
  rec.transitTo = dest;
  rec.transitEta = eta;
  rec.escapeTransit = escapeMode === true;
  inTransitRegistry.push({ rec, sysId });
  return true;
}

/**
 * Issue #68 terminal departure: a fleeing hull that physically reached its
 * chosen gate and completed the charge crosses for real, through the SAME
 * migration lifecycle a trader uses. Returns the eta in seconds on success,
 * or null when the plan is not entitled to depart (no gate committed, charge
 * incomplete, engine out, disabled, terminal record, already departed).
 *
 * Emits exactly one sanitized `npcEscaped` receipt per successful departure —
 * `plan.departed` makes a repeated world update or a restore idempotent.
 */
export function beginEscapeTransit(ctx, rec, bankSysId) {
  const plan = readEscape(rec);
  if (!plan || plan.departed === true) return null;
  if (plan.kind !== 'gate' || typeof plan.to !== 'string') return null;
  if (plan.phase !== 'charge' || !(plan.charge >= JUMP.chargeTime)) return null;
  const sysId = bankSysId ?? rec.system ?? ctx.world?.currentSystem;
  // PHYSICAL guard. A phase word and a charge number are just persisted data:
  // a corrupt or hand-edited plan must not teleport a hull off an imaginary
  // gate. Re-derive the AUTHORED edge of this system and require the record's
  // tracked position to actually be inside its zone right now.
  const gate = authoredGate(sysId, plan.to);
  const at = gate && escapeVec(gate.position);
  if (!at) return null;
  if (!writeEscapePosition(plan, _escapePos)) return null;
  if (Math.hypot(_escapePos.x - at[0], _escapePos.y - at[1], _escapePos.z - at[2]) > JUMP.zone) return null;
  // Condition guard, FAIL CLOSED. No snapshot at all means the plan never
  // captured a real ship, so it cannot claim a real crossing — and neither can
  // one whose numbers do not describe a hull that could fly through a gate.
  // Flags alone are not enough: a hand-edited `cond: { flags: {} }`, a missing
  // or non-finite hull, or an engine at zero with every flag politely false
  // all used to pass. What is required is what the game itself would produce —
  // a finite positive hull, a finite engine against a real maximum, and an
  // integrity ratio ABOVE the same DEFENSE.engineOutAt threshold state.js uses
  // to declare an engine out. Nothing here is a new rule; it is the existing
  // one, applied to persisted data instead of trusted from it.
  const cond = plan.cond;
  const flags = cond && typeof cond === 'object' ? cond.flags : null;
  if (!cond || !flags || typeof flags !== 'object') return null;
  if (flags.disabled === true || flags.engineOut === true || flags.destroyed === true) return null;
  if (!Number.isFinite(cond.hull) || cond.hull <= 0) return null;
  if (!Number.isFinite(cond.engine) || !Number.isFinite(cond.engineMax) || cond.engineMax <= 0) return null;
  if (cond.engine / cond.engineMax <= DEFENSE.engineOutAt) return null;
  if (!beginTransit(ctx, rec, plan.to, sysId, { escape: true })) return null;
  plan.departed = true;
  plan.phase = 'done';
  plan.reason = 'departed';
  // Durable PRIVATE outcome. Contract bookkeeping (station.js's local hunt)
  // needs to know this record left the contract system even when nobody was
  // watching, and it must survive the record's migration into another bank.
  // It carries no destination and publishes nothing on its own.
  rec.escapedFrom = typeof sysId === 'string' ? sysId : null;
  const eta = Math.max(0, Math.round((rec.transitEta ?? ctx.world.time) - ctx.world.time));
  // The PUBLIC receipt is scoped to what the player could actually observe:
  // the hull was live in the current system. An off-screen departure in a
  // bank the player has never flown is real, but it is not news they witnessed
  // — publishing it would hand a controller free galaxy-wide intelligence.
  if (escapeWitnessed(ctx, rec, sysId)) {
    const who = escapePublicIdentity(rec, ctx.world && ctx.world.scanner);
    ctx.emit('npcEscaped', {
      targetId: who.id,
      targetName: who.name,
      from: typeof sysId === 'string' ? sysId : null,
      to: plan.to,
      kind: 'gate',
      reason: 'gate',
      eta,
    });
  }
  return eta;
}

/**
 * Could the player actually see this? A receipt is published only for a hull
 * that was live in the system the player is flying — the same visibility the
 * HUD, the lock and the comm line already obey.
 */
function escapeWitnessed(ctx, rec, sysId) {
  if (!ctx || !ctx.world) return false;
  if (typeof sysId === 'string' && sysId !== ctx.world.currentSystem) return false;
  if (rec && rec.live === true) return true;
  const cur = ctx.targets && ctx.targets.current;
  return !!cur && cur.record === rec;
}

/**
 * The station-shelter receipt, emitted from ONE place for both runners — the
 * live hull (npc.js) and the off-screen record. Visibility-scoped exactly like
 * the departure receipt: a hull reaching a holding lane in a bank the player
 * is not flying is real, but it is not news they witnessed. Returns the public
 * identity when it published, so the caller can voice a matching line.
 */
export function emitSheltered(ctx, rec, sysId) {
  if (!escapeWitnessed(ctx, rec, sysId)) return null;
  const who = escapePublicIdentity(rec, ctx.world && ctx.world.scanner);
  ctx.emit('npcSheltered', {
    targetId: who.id,
    targetName: who.name,
    system: typeof sysId === 'string' ? sysId : null,
    kind: 'station',
    reason: 'station',
  });
  return who;
}

/** Display name for escape copy. Unknown ids fall back to the id itself. */
export function systemDisplayName(id) {
  return Object.hasOwn(SYSTEMS, id) ? (SYSTEMS[id].name ?? id) : id;
}

// ---------- Aftermath §8.7 ----------
const WRECK_TTL = 600; // ~10 min world time
const MAX_AFTERMATH = 24;
const MAX_INCIDENTS = 40;

// ---------- Update cadence ----------
const GALAXY_TICK = 1; // s between abstract route advances

/**
 * Off-screen escape progress (issue #68). Scalars and one vector per record,
 * on the existing galaxy tick — no bank instantiation, no physics, no meshes.
 * The runner uses the SAME speed contract as its live flight (30% class cruise
 * with the engine out) and stops at its destination; a disabled hull drifts
 * nowhere and cannot charge.
 */
function tickEscapeRecord(rec, sysId, ctx) {
  const plan = readEscape(rec);
  if (!plan) return;
  const cls = SHIP_CLASSES[rec.classKey];
  const cond = plan.cond;
  const flags = (cond && cond.flags) || null;
  // Existing timed repair, off screen: the SAME state.js rule (30 s clean, the
  // same 2%/s crawl, the same engineOutAt threshold), applied to the snapshot
  // over elapsed world time. Nothing else regenerates and nothing is healed.
  if (cond && flags && flags.engineOut === true && flags.disabled !== true
    && Number.isFinite(cond.engine) && Number.isFinite(cond.engineMax) && cond.engineMax > 0
    && Number.isFinite(cond.lastCombatAt) && ctx.world.time - cond.lastCombatAt >= 30
    && cond.engine / cond.engineMax < DEFENSE.engineOutAt + 0.05) {
    cond.engine = Math.min(cond.engineMax, cond.engine + cond.engineMax * 0.02 * GALAXY_TICK);
    if (cond.engine / cond.engineMax > DEFENSE.engineOutAt) flags.engineOut = false;
  }
  const engineOut = !!flags && flags.engineOut === true;
  const disabled = !!flags && flags.disabled === true;
  const cruise = cls && Number.isFinite(cls.cruise) ? cls.cruise : 90;
  const burn = cls && Number.isFinite(cls.burn) ? cls.burn : cruise * 2;
  let speed = engineOut ? cruise * 0.3 : burn;
  let dist = Infinity;
  if (disabled) {
    // A dark hull does not navigate — but it does not stop dead either. It
    // keeps the drift the live loop gave it (updateDisabled's driftVel, folded
    // into the plan at capture), so a wreck culled mid-coast stays where its
    // motion actually put it. `dist` deliberately stays Infinity: drifting can
    // never spool a gate charge or claim a station arrival.
    driftEscape(plan, GALAXY_TICK, cruise);
  } else if (escapeRouted(rec)) {
    const arrive = escapeArriveRadius(plan);
    // Hold speed inside the arrival radius so a braking hull does not teleport
    // through its own destination on a 1 s tick. A zero-length step is the
    // distance query — stepEscapeToward returns the remaining range and moves
    // nothing when it cannot take a step.
    const remaining = stepEscapeToward(plan, 0, 0);
    // Coherent with the live hull: a station hold is PARKED (npc.js updateFlee),
    // a gate bore still creeps while it spools.
    if (Number.isFinite(remaining) && remaining <= arrive) {
      speed = plan.kind === 'station' ? 0 : Math.min(speed, cruise * ESCAPE.holdSpeed);
    }
    dist = stepEscapeToward(plan, speed, GALAXY_TICK);
  } else if (plan.phase === 'evade') {
    // No committed leg: the runner said it was running from something, and it
    // really is — coarsely, along the heading it had when it left the bubble,
    // under the same speed cap, until the retry cadence below finds it a
    // route. Standing still off screen was the one thing it was not doing.
    driftEscape(plan, GALAXY_TICK, speed);
  }
  const token = tickEscape(plan, {
    dist,
    dt: GALAXY_TICK,
    now: ctx.world.time,
    canCharge: !engineOut && !disabled,
  });
  if (token === 'gate-ready') {
    beginEscapeTransit(ctx, rec, sysId);
  } else if (token === 'sheltered') {
    emitSheltered(ctx, rec, sysId);
  } else if (token === 'dwell-over') {
    finishEscape(rec, 'sheltered');
    // Ordinary work resumes from where the hull actually sits: rebuild the
    // lane route around the tracked position rather than snapping it home.
    resumeEscapeRoute(rec, sysId);
  } else if (token === 'replan') {
    offscreenReplan(rec, plan, sysId, ctx);
  }
}

/**
 * Off-screen route retry. An evading record has no live pursuer to steer away
 * from, but the world moves on: a destination that was screened when the hull
 * broke off may be perfectly clear now. Re-run the SAME choice from the
 * tracked position with no threat, so a runner never freezes in 'evade'
 * forever. It fabricates no arrival — if nothing is reachable it simply
 * refreshes the cadence and drifts on its last intent.
 */
function offscreenReplan(rec, plan, sysId, ctx) {
  plan.checkedAt = ctx.world.time;
  const id = Object.hasOwn(SYSTEMS, sysId) ? sysId : rec.system;
  if (!writeEscapePosition(plan, _escapePos)) return;
  const flags = plan.cond && plan.cond.flags;
  if (flags && flags.disabled === true) return; // a dark hull chooses nothing
  const chosenBefore = plan.chosenAt;
  const kindBefore = plan.kind;
  replanEscape(rec, {
    sysId: id,
    pos: _escapePos,
    threatPos: null,
    engineOut: !!flags && flags.engineOut === true,
    now: ctx.world.time,
  });
  // Off screen the trail is the only thing the player can still follow, so a
  // retry that finally found a route must not leave the old evade site (or an
  // abandoned gate) behind. Same shared writer the live stamp uses.
  if (plan.chosenAt !== chosenBefore || plan.kind !== kindBefore) {
    writeEscapeWakeSite(rec, plan, rec.role);
  }
}

/**
 * Rejoin ordinary traffic after a resolved station shelter. The record keeps
 * its identity, cargo, condition snapshot and peace; only the lane route is
 * rebuilt, anchored on where the escape actually left it.
 */
export function resumeEscapeRoute(rec, sysId) {
  const id = Object.hasOwn(SYSTEMS, sysId) ? sysId : rec.system;
  if (!Object.hasOwn(SYSTEMS, id)) return;
  const def = SYSTEMS[id];
  const station = stationPoint(def);
  const plan = readEscape(rec);
  const here = plan && writeEscapePosition(plan, _escapePos)
    ? new THREE.Vector3(_escapePos.x, _escapePos.y, _escapePos.z)
    : station.clone();
  const hold = stationHoldVec(station, here);
  rec.route = plainRoute([hold, here]);
  rec.legLens = computeLegLens(rec.route);
  rec.leg = 0;
  rec.legT = 1;
  rec.dir = -1;
  rec.dwellUntil = 0;
  rec.gateLinger = false;
}

/**
 * Advance one existing bank. Never starts transit (pickMigrant only) — the
 * one exception is a completed issue-#68 gate escape, which departs through
 * the same beginTransit machinery under its own explicit guards.
 * Blockade/strike hurry pirates only when `sysId` is the event's system.
 */
export function tickBank(bank, sysId, ctx) {
  if (!bank) return;
  const ev = ctx.world.activeEvent;
  const hurry = ev
    && (ev.kind === 'pirateBlockade' || ev.kind === 'strikeRush')
    && (ev.system ?? ctx.world.currentSystem) === sysId;
  for (let i = 0; i < bank.length; i++) {
    const rec = bank[i];
    if (rec.state === 'dead' || rec.state === 'captured' || rec.state === 'inTransit') continue;
    // Issue #68: an escaping record's ordinary route is not its intent any
    // more. Skip normalization, lane progress and dwell entirely; advance the
    // small scalar/vector plan instead. A LIVE runner is driven by npc.js, so
    // this path never double-moves it — both layers recognize plan ownership.
    if (escapeActive(rec)) {
      if (!rec.live) tickEscapeRecord(rec, sysId, ctx);
      continue;
    }
    if (rec.role === 'trader') normalizeTraderRecord(rec);
    if (rec.role === 'miner') {
      normalizeMinerRecord(rec);
      rec.cargo ??= [];
      rec.mineAt ??= 0;
      rec.mineHold ??= false;
    }
    if (rec.role === 'patrol') healPadHome(rec);
    if (!rec.route || rec.route.length === 0) continue;
    if (rec.state === 'docked') {
      if (ctx.world.time >= rec.dwellUntil) rec.state = 'enroute';
      continue;
    }
    if (rec.role === 'miner' && minerAtField(rec) && rec.mineHold) {
      if (ctx.world.time < rec.dwellUntil) {
        tickMinerExtract(rec, ctx);
        continue;
      }
      rec.mineHold = false;
      rec.dir = -1;
      rec.dwellUntil = ctx.world.time + 8 + Math.random() * 12;
      rec.gateLinger = false;
      continue;
    }
    if (ctx.world.time < rec.dwellUntil) continue;
    let speed = SHIP_CLASSES[rec.classKey]?.cruise ?? 90;
    if (hurry && rec.role === 'pirate') speed *= 1.6;
    const legs = rec.legLens;
    const legLen = (legs && legs[rec.leg]) || 1;
    rec.legT += (speed * GALAXY_TICK * rec.dir) / legLen;
    if (!Number.isFinite(rec.legT)) rec.legT = 0;
    if (rec.legT >= 1) {
      if (rec.leg + 1 >= rec.route.length - 1) {
        rec.legT = 1;
        // Traders park at the dest gate. pickMigrant is the only transit
        // start; unpicked lingerers reverse so the lane stays populated.
        if (rec.role === 'trader' && rec.dir > 0) {
          if (!rec.gateLinger) {
            rec.gateLinger = true;
            const span = GATE_HOLD[1] - GATE_HOLD[0];
            let hold = GATE_HOLD[0] + Math.random() * (Number.isFinite(span) ? span : 0);
            if (!Number.isFinite(hold)) hold = GATE_HOLD[0];
            const now = Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
            rec.dwellUntil = now + hold;
            continue;
          }
          rec.gateLinger = false;
          rec.dir = -1;
          rec.dwellUntil = ctx.world.time + 8 + Math.random() * 12;
          continue;
        }
        if (rec.role === 'miner' && rec.dir > 0) {
          rec.gateLinger = false;
          rec.cargo ??= [];
          rec.mineAt ??= 0;
          rec.mineHold = true;
          rec.dwellUntil = ctx.world.time + 20 + Math.random() * 16;
          continue;
        }
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
        // Waypoint 0 is home: traders/patrols/miners dock at the station.
        if (rec.role === 'trader' || rec.role === 'patrol' || rec.role === 'miner') {
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
  const rec = makeRecord(ctx, {
    name: col.name,
    classKey: col.classKey,
    faction: col.faction,
    role: 'pirate',
    route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)],
    cargo: col.cargo.map((c) => ({ commodity: c.commodity, units: c.units })),
    bounty: col.bounty,
    system: sysId,
  });
  rec.alwaysHuntsPlayer = true; // wave 32: the collector never rolls for interest — he has your vector (npc.js playerInterestChance)
  bank.push(rec);
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
  if (live.state?.disabled) return; // dead hulk: hail.js owns salvage, not the vouch
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
  // initWorld runs BEFORE initSave (main.js init order), so no restore has
  // happened yet — banks are always fresh here. Restores swap
  // ctx.world.recordBanks wholesale AFTER this; knownBanks below tracks the
  // reference so the update loop can detect the swap.
  const banks = ctx.world.recordBanks ??= {};
  if (ctx.world.records.length === 0) {
    ctx.world.records = ensureBank(ctx, ctx.world.currentSystem);
  } else {
    banks[ctx.world.currentSystem] ??= ctx.world.records;
  }
  rebuildTransitRegistry(ctx);
  let knownBanks = ctx.world.recordBanks;
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
      const changed = ev.to !== activeSystemId; // boot restore into the live system re-emits same-system
      swapToSystem(ctx, ev.to);
      teardownWreckMeshes(ctx);
      // Cross-system restores (and jumps) reach the new banks through this
      // event — re-derive the in-transit registry from the banks themselves.
      // One O(banks) scan per jump/restore, never per frame. knownBanks is
      // synced so the update loop's swap check doesn't rebuild a second
      // time for the same restore.
      rebuildTransitRegistry(ctx);
      knownBanks = ctx.world.recordBanks;
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
    // Prefer traders already at their outbound gate. Mid-lane vanishing
    // reads as a pop; skip the interval if nobody is gate-ready.
    // Wave 22 (lore decision): physical gates ONLY — hub routes are never
    // migration destinations. Lamplighter junctions are player/Guild
    // infrastructure; NPC traffic rides the old ring network.
    // Wave 57: any existing bank may supply the one pick; never generate.
    const banks = ctx.world.recordBanks;
    if (!banks) return;
    let chosen = null;
    let chosenSys = null;
    let count = 0;
    for (const sysId in banks) {
      if (!Object.hasOwn(banks, sysId) || !Object.hasOwn(SYSTEMS, sysId)) continue;
      const gates = SYSTEMS[sysId].gates;
      if (!gates || gates.length === 0) continue;
      const bank = banks[sysId];
      if (!bank) continue;
      for (let i = 0; i < bank.length; i++) {
        // Ace and pirates never migrate. Live ships at the gate may leave —
        // traffic.js despawns inTransit. Mid-lane live ships are not yanked.
        const rec = bank[i];
        if (!traderAtOutboundGate(rec)) continue;
        count++;
        if (Math.random() < 1 / count) { // reservoir pick, no alloc
          chosen = rec;
          chosenSys = sysId;
        }
      }
    }
    if (!chosen) return;
    const dest = traderOutboundDest(chosen, chosen.system ?? chosenSys);
    beginTransit(ctx, chosen, dest, chosenSys);
  }

  // Migrants live in their SOURCE bank until the eta passes (the player may
  // jump away meanwhile). The registry — rebuilt on every 'systemLoaded', at
  // init, and on any recordBanks reference swap (same-system restore) — is
  // the only per-frame scan: O(in transit), never O(visited banks). Timing
  // semantics are unchanged: arrival when world.time reaches the same
  // persisted transitEta, through the same arriveInSystem path.
  function arriveMigrants(ctx) {
    const now = ctx.world.time;
    for (let i = inTransitRegistry.length - 1; i >= 0; i--) {
      const entry = inTransitRegistry[i];
      const rec = entry.rec;
      if (rec.state !== 'inTransit') continue;
      if (!Number.isFinite(rec.transitEta)) rec.transitEta = now + MIGRATION_ETA[0];
      if (now < rec.transitEta) continue;
      inTransitRegistry.splice(i, 1);
      // Defensive membership check: a stale entry (banks swapped without a
      // rebuild) must never resurrect a record no bank holds.
      const bank = ctx.world.recordBanks?.[entry.sysId];
      const idx = bank ? bank.indexOf(rec) : -1;
      if (idx < 0) continue;
      bank.splice(idx, 1);
      arriveInSystem(ctx, rec, rec.transitTo);
    }
  }

  function arriveInSystem(ctx, rec, destId) {
    const def = destId && Object.hasOwn(SYSTEMS, destId) ? SYSTEMS[destId] : null;
    if (!def) {
      // Should never happen (gate.to is validated data) — fail safe home.
      rec.state = 'enroute';
      rec.transitTo = null;
      rec.transitEta = 0;
      rec.escapeTransit = false;
      if (readEscape(rec)) finishEscape(rec, 'cancelled');
      const home = ctx.world.recordBanks?.[rec.system];
      if (home && home.indexOf(rec) < 0) home.push(rec);
      return;
    }
    const destBank = ensureBank(ctx, destId);
    const fromId = rec.system;
    // Issue #68: an escapee arrives as the SAME logical record — same id,
    // name, faction, class, cargo, bounty and condition snapshot. Only its
    // lane geometry is rebuilt (source coordinates mean nothing here), and
    // the consumed source-system wake trail is dropped deliberately so it can
    // never be read against this system's space.
    const escapePlan = readEscape(rec);
    if (escapePlan) {
      finishEscape(rec, 'departed');
      escapePlan.from = destId;
      escapePlan.pos = [0, 0, 0];
      escapePlan.vel = [0, 0, 0];
      escapePlan.speed = 0;
      escapePlan.charge = 0;
      if (rec.wakeSite) delete rec.wakeSite;
    }
    rec.escapeTransit = false;
    const planned = traderArrivalWaypoints(def, fromId);
    const destWp = (planned.waypoints[1] ?? planned.waypoints[0]).clone();
    // Route rebuilt station-ward: the record sits exactly ON the arrival
    // gate waypoint (leg 0, legT 1, dir −1) heading home, so a player
    // present in the destination system sees it materialize at the gate.
    // Issue #68: an escapee arrives on the AUTHORED gate itself, unjittered —
    // the player who followed it through is looking straight at that bore, and
    // a 60 u scatter would read as the ship having gone somewhere else.
    rec.route = plainRoute([planned.waypoints[0], escapePlan ? destWp : jitter(destWp, 60)]);
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
    rec.outboundTo = planned.outboundTo;
    rec.gateLinger = false;
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
        // Issue #99: the receipt names its own causer, decided where the break
        // happened. This branch used to hard-code 'player', which wrote a
        // player attribution into the ledger for a hull two pirates broke
        // between themselves. Read it, and fail closed to 'world' for anything
        // that is not the explicit player word — an older or hand-made event
        // with no attribution is exactly the case that must not pay.
        const causer = ev.causer === 'player' ? 'player' : 'world';
        if (pos) {
          // The incident itself is neutral bookkeeping and is still recorded
          // for both: the lane remembers that a hull yielded here regardless
          // of who broke it. Only the credit below is withheld.
          addIncident(ctx, 'surrendered', {
            name: rec?.name ?? ship.state?.name ?? 'unknown hull',
            faction: rec?.faction ?? ship.state?.faction ?? 'independent',
            role: rec?.role ?? ship.role ?? 'trader',
            position: pos,
            causer,
            outcome,
          });
        }
        // Milestones are the player's story. A capitulation the player did not
        // cause cannot fire "first capitulation" or spend the tribute line.
        if (causer === 'player') {
          fireMilestone(ctx, 'firstCapitulation', 'They yield. First capitulation.');
          if (outcome === 'tribute') fireMilestone(ctx, 'firstTribute', 'Tribute paid. The lane remembers.');
        }
        // The rematch ladder, the lineages and the aspirant cycle all answer
        // the question "has the player put this name down?". An ace broken by
        // someone else answers it 'no', so the whole block is player-only.
        if (causer === 'player' && rec?.role === 'ace') {
          const rivalry = (ctx.world.aceRivalry ??= { defeats: 0, lastOutcome: null, hunterSpawned: false, hunterGeneration: 0, hunterDownAt: null, illyxGeneration: 0, illyxDownAt: null, aspirantRisen: 0, aspirantDownAt: null, aspirantFlying: false });
          rivalry.aspirantRisen ??= 0; // pre-wave-10 saves lack the field
          rivalry.aspirantDownAt ??= null;
          rivalry.aspirantFlying ??= false;
          rivalry.defeats++;
          rivalry.lastOutcome = outcome; // 'flee' | 'jettison' | 'ransom' | ...
          fireMilestone(ctx, 'firstAceDefeated', `${ctx.world.shipName ?? 'your ship'} — your name in the dark now.`);
          // Issue #68: a bearer that BROKE OFF and is still flying is a
          // witnessed defeat — counted above, rematch ladder untouched — but
          // it is not a death. Flight alone must not schedule a successor,
          // break a line, or tell an ending story about a hull the player can
          // still chase through a gate. Every other surrender alternative
          // (ransom, jettison, capture, cut engines) keeps its old bookkeeping.
          const survivedByFlight = outcome === 'flee'
            && rec.state !== 'dead' && rec.state !== 'captured';
          // Durable and JSON-plain: the pending-timer guard below (and after a
          // reload) has to know this bearer is alive because it RAN, not
          // because some other yield left it breathing.
          if (survivedByFlight) rec.survivedByFlight = true;
          if (!survivedByFlight) {
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
    }
    // Trim stale causer attributions (cheap pass, tiny map).
    if (playerHitAt.size > 64) {
      for (const [id, t] of playerHitAt) {
        if (ctx.world.time - t > 30) playerHitAt.delete(id);
      }
    }
  }

  function galaxyTick(ctx) {
    // dest banks: tickBank runs gateLinger; this loop never beginTransit
    const banks = ctx.world.recordBanks;
    if (!banks) return;
    for (const sysId in banks) {
      if (!Object.hasOwn(banks, sysId)) continue;
      tickBank(banks[sysId], sysId, ctx);
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

      // Inter-system migration §8.2: one departure from any existing bank,
      // arrivals into whichever bank the migrant left from.
      if (now >= nextMigrationAt) {
        nextMigrationAt = now + MIGRATION_INTERVAL * (0.75 + Math.random() * 0.5);
        pickMigrant(ctx);
      }
      // Same-system save restores swap ctx.world.recordBanks wholesale but
      // emit NO 'systemLoaded' (save.js only emits when the system changes)
      // — restored in-transit migrants would never arrive without this.
      // One reference compare per frame; the O(banks) rebuild runs only on
      // a restore swap. Cross-system restores also swap the reference but
      // consumeSystemLoaded already rebuilt and re-synced knownBanks, so
      // they never trip this.
      if (ctx.world.recordBanks !== knownBanks) {
        knownBanks = ctx.world.recordBanks ?? (ctx.world.recordBanks = {});
        rebuildTransitRegistry(ctx);
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
