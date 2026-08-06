import * as THREE from 'three';
import { COMMODITIES, SHIP_CLASSES, SYSTEMS, resolveBand, BANDS } from './state.js';
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

// ---------- Module state (never serialized) ----------
const wreckMeshes = new Map(); // aftermath.id → { group, emberMat }
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
      swapToSystem(ctx, ev.to);
      teardownWreckMeshes(ctx);
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
    ctx.world.activeEvent = { kind, startedAt: now, endsAt: now + dur };
    applyEventPressure(ctx, kind);
    ctx.emit('worldEvent', { kind, phase: 'start' });
    if (kind === 'strikeRush') {
      fireMilestone(ctx, 'firstStrikeRush', 'Strike rush. Word spreads.');
    }
    if (kind === 'pirateBlockade') lastBlockadeKillAt = now;
  }

  function endEvent(ctx) {
    const kind = ctx.world.activeEvent?.kind;
    ctx.world.activeEvent = null;
    applyEventPressure(ctx, 'clear');
    if (kind) ctx.emit('worldEvent', { kind, phase: 'end' });
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
          fireMilestone(ctx, 'firstAceDefeated', `${ctx.world.shipName ?? 'your ship'} — your name in the dark now.`);
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
          fireMilestone(ctx, 'firstAceDefeated', `${ctx.world.shipName ?? 'your ship'} — your name in the dark now.`);
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
