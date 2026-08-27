/**
 * Agent observe snapshot. Authored fields only into a fresh object.
 * Never JSON.stringify(ctx). Never returns functions, THREE, desks, or npc.ai.
 */

import { U, COMMODITIES } from './state.js';
import {
  VERSION,
  NEARBY_CAP,
  DOCK_KEY_SERVICES,
  EVENT_CAP,
  num,
  str,
  finiteOrNull,
  vec3,
  fwdFromQuat,
  copyLastIntent,
  noCtxObservation,
  sanitizeEvent,
  isDockService,
  reservedName,
} from './agent-schema.js';

const CAMERA = new Set(['chase', 'third', 'first']);

function missingCtx(ctx) {
  return ctx == null || typeof ctx !== 'object';
}

function own(obj, key) {
  return obj && typeof obj === 'object' && Object.hasOwn(obj, key) ? obj[key] : undefined;
}

function weaponGroup(input) {
  const n = num(input && input.weaponGroup, 1);
  if (n === null) return 1;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n | 0;
}

function cameraMode(flags) {
  const c = flags && flags.camera;
  return typeof c === 'string' && CAMERA.has(c) ? c : 'chase';
}

function playerNum(player, key) {
  if (!player || typeof player !== 'object') return null;
  return finiteOrNull(own(player, key));
}

function isRockLock(ctx, t) {
  if (!t || typeof t !== 'object' || !t.position) return false;
  const list = ctx.asteroids && ctx.asteroids.list;
  if (!list || list.indexOf(t) < 0) return false;
  if (t.lockKind === 'rock') return true;
  if (t.lockKind) return false;
  return !t.object && !t.state;
}

function lockKind(t) {
  const k = t && t.lockKind;
  if (k === 'station' || k === 'gate' || k === 'pod' || k === 'landmark' || k === 'rock') return k;
  return null;
}

function isLiveShip(t) {
  return !!(t && typeof t === 'object' && t.object && t.state && !t.lockKind);
}

function posOf(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.position) return vec3(obj.position);
  return vec3(obj);
}

function rangeTo(from, to) {
  if (!from || !to) return 0;
  return Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
}

function idOf(value) {
  if (typeof value === 'string' || typeof value === 'number') return value;
  return null;
}

function targetRow(kind, id, name, range) {
  return {
    kind,
    id: idOf(id),
    name: str(name),
    range: num(range, 0),
  };
}

function shipName(live) {
  const st = live && live.state;
  if (st && typeof st.name === 'string' && st.name) return st.name;
  const rec = live && live.record;
  if (rec && typeof rec.name === 'string' && rec.name) return rec.name;
  return '';
}

function describeTarget(ctx, origin, t) {
  if (!t || typeof t !== 'object') return null;
  if (isLiveShip(t)) {
    const p = posOf(t.object);
    return targetRow('ship', own(t, 'id'), shipName(t), rangeTo(origin, p));
  }
  if (isRockLock(ctx, t)) {
    const list = ctx.asteroids && ctx.asteroids.list;
    const idx = list ? list.indexOf(t) : -1;
    return targetRow('rock', idx >= 0 ? idx : null, 'rock', rangeTo(origin, posOf(t)));
  }
  const kind = lockKind(t);
  if (kind === 'station') {
    const st = ctx.station;
    const name = st && typeof st.name === 'string' ? st.name : 'station';
    const p = st && st.position ? vec3(st.position) : posOf(t);
    return targetRow('station', null, name, rangeTo(origin, p));
  }
  if (kind === 'gate') {
    const to = typeof t.to === 'string' ? t.to : null;
    return targetRow('gate', to, to || 'gate', rangeTo(origin, posOf(t)));
  }
  if (kind === 'pod') {
    const pod = t.pod;
    const id = pod && Object.hasOwn(pod, 'id') ? pod.id : null;
    return targetRow('pod', id, 'pod', rangeTo(origin, posOf(t)));
  }
  if (kind === 'landmark') {
    const id = typeof t.id === 'string' ? t.id : null;
    const name = typeof t.name === 'string' && t.name ? t.name : (id || 'landmark');
    return targetRow('landmark', id, name, rangeTo(origin, posOf(t)));
  }
  return null;
}

function nearbyTargets(ctx, origin, current, group) {
  const rangeMax = U.TARGET_RANGE;
  const range2 = rangeMax * rangeMax;
  const rows = [];
  const seen = new Set();
  const ships = Array.isArray(ctx.ships) ? ctx.ships : [];
  for (let i = 0; i < ships.length; i++) {
    const s = ships[i];
    if (!isLiveShip(s) || s.state.destroyed) continue;
    const p = posOf(s.object);
    if (!origin || !p) continue;
    const d2 = (p[0] - origin[0]) ** 2 + (p[1] - origin[1]) ** 2 + (p[2] - origin[2]) ** 2;
    if (d2 > range2) continue;
    const row = describeTarget(ctx, origin, s);
    if (!row) continue;
    rows.push(row);
    seen.add(s);
  }
  const includeRocks = group === 3 || isRockLock(ctx, current);
  if (includeRocks) {
    const list = ctx.asteroids && ctx.asteroids.list;
    if (list && typeof list.length === 'number') {
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        if (!a || !a.position) continue;
        const p = vec3(a.position);
        if (!origin || !p) continue;
        const d2 = (p[0] - origin[0]) ** 2 + (p[1] - origin[1]) ** 2 + (p[2] - origin[2]) ** 2;
        if (d2 > range2) continue;
        rows.push(targetRow('rock', i, 'rock', Math.sqrt(d2)));
        seen.add(a);
      }
    }
  }
  rows.sort((a, b) => a.range - b.range);
  if (current && !seen.has(current)) {
    const extra = describeTarget(ctx, origin, current);
    if (extra) rows.unshift(extra);
  }
  if (rows.length > NEARBY_CAP) rows.length = NEARBY_CAP;
  return rows;
}

function cargoRows(cargo) {
  if (!Array.isArray(cargo)) return [];
  const out = [];
  for (let i = 0; i < cargo.length; i++) {
    const row = cargo[i];
    if (!row || typeof row !== 'object') continue;
    const commodity = str(own(row, 'commodity'));
    const units = num(own(row, 'units'), 0);
    if (!commodity) continue;
    out.push({ commodity, units });
  }
  return out;
}

function jobRows(ctx, docked) {
  if (!docked) return [];
  const jobs = ctx.world && Array.isArray(ctx.world.jobs) ? ctx.world.jobs : [];
  const out = [];
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (!j || typeof j !== 'object') continue;
    const row = {
      id: str(own(j, 'id')),
      kind: str(own(j, 'kind')),
      state: str(own(j, 'state')),
      reward: num(own(j, 'reward'), 0),
    };
    const commodity = own(j, 'commodity');
    if (typeof commodity === 'string' && commodity) row.commodity = commodity;
    const count = own(j, 'count');
    if (typeof count === 'number' && Number.isFinite(count)) row.count = count;
    const units = own(j, 'units');
    if (typeof units === 'number' && Number.isFinite(units)) row.units = units;
    const need = own(j, 'need');
    if (typeof need === 'number' && Number.isFinite(need)) row.need = need;
    const progress = own(j, 'progress');
    if (typeof progress === 'number' && Number.isFinite(progress)) row.progress = progress;
    const destSystem = own(j, 'destSystem');
    if (typeof destSystem === 'string' && destSystem) row.destSystem = destSystem;
    const destination = own(j, 'destination');
    if (typeof destination === 'string' && destination) row.destination = destination;
    const deadline = own(j, 'deadline');
    if (typeof deadline === 'number' && Number.isFinite(deadline)) row.deadline = deadline;
    out.push(row);
  }
  return out;
}

function holdOf(cargo, key) {
  if (!Array.isArray(cargo)) return 0;
  let n = 0;
  for (let i = 0; i < cargo.length; i++) {
    const row = cargo[i];
    if (!row || typeof row !== 'object') continue;
    if (str(own(row, 'commodity')) !== key) continue;
    const u = num(own(row, 'units'), 0);
    if (u) n += u;
  }
  return n;
}

function postedPrice(ctx, key) {
  // Posted table price only. Desk fill may apply hermit/epic/rank modifiers (T3 pane copy).
  const prices = ctx && ctx.world && ctx.world.prices && typeof ctx.world.prices === 'object'
    ? ctx.world.prices
    : null;
  if (prices && Object.hasOwn(prices, key)) {
    const n = num(prices[key]);
    if (n !== null) return n;
  }
  if (Object.hasOwn(COMMODITIES, key)) {
    const n = num(COMMODITIES[key] && COMMODITIES[key].base);
    if (n !== null) return n;
  }
  return 0;
}

function peekFill(ctx, key, buying) {
  const desk = ctx && ctx.stationDesk;
  if (!desk || typeof desk.peekFillUnit !== 'function') return null;
  try {
    const n = desk.peekFillUnit(key, buying);
    if (typeof n === 'number' && Number.isFinite(n)) return n;
  } catch {
    // omit
  }
  return null;
}

function marketBlock(ctx, docked, service) {
  if (!docked || service !== 'market') return null;
  const rows = [];
  try {
    const keys = Object.keys(COMMODITIES);
    for (let i = 0; i < keys.length; i++) {
      const commodity = keys[i];
      if (typeof commodity !== 'string' || !commodity) continue;
      if (reservedName(commodity)) continue;
      if (!Object.hasOwn(COMMODITIES, commodity)) continue;
      const com = COMMODITIES[commodity];
      if (!com || typeof com !== 'object') continue;
      const row = {
        commodity,
        name: str(own(com, 'name')) || commodity,
        posted: postedPrice(ctx, commodity),
        hold: holdOf(ctx.cargo, commodity),
        legal: com.legal === true,
      };
      const fillB = peekFill(ctx, commodity, true);
      const fillS = peekFill(ctx, commodity, false);
      if (fillB !== null) row.fillBuy = fillB;
      if (fillS !== null) row.fillSell = fillS;
      rows.push(row);
    }
  } catch {
    // keep rows collected so far
  }
  return { rows };
}

function navSnap(world) {
  const n = world && own(world, 'nav');
  if (!n || typeof n !== 'object') return null;
  const path = Array.isArray(n.path) ? n.path.filter((id) => typeof id === 'string') : [];
  const remaining = Array.isArray(n.remaining) ? n.remaining.filter((id) => typeof id === 'string') : [];
  return {
    dest: str(own(n, 'dest')),
    path,
    remaining,
    status: str(own(n, 'status')),
    autopilot: own(n, 'autopilot') === true,
  };
}

function stationService(ctx) {
  const desk = ctx.stationDesk;
  if (!desk || typeof desk.peekService !== 'function') return null;
  try {
    const id = desk.peekService();
    return isDockService(id) ? id : null;
  } catch {
    return null;
  }
}

function hailIntents(ctx, hailOpen) {
  if (!hailOpen) return [];
  const api = ctx.hailApi;
  if (api && typeof api.peek === 'function') {
    try {
      const peek = api.peek();
      if (peek && Array.isArray(peek.intents)) {
        const out = [];
        for (let i = 0; i < peek.intents.length; i++) {
          if (typeof peek.intents[i] === 'string') out.push(peek.intents[i]);
        }
        return out;
      }
    } catch {
      /* fail closed to ring fallback */
    }
  }
  const ring = ctx.agent && Array.isArray(ctx.agent.events) ? ctx.agent.events : [];
  for (let i = ring.length - 1; i >= 0; i--) {
    const e = ring[i];
    if (e && e.type === 'hailOpened' && Array.isArray(e.intents)) {
      const out = [];
      for (let j = 0; j < e.intents.length; j++) {
        if (typeof e.intents[j] === 'string') out.push(e.intents[j]);
      }
      return out;
    }
  }
  return [];
}

function copyEvents(agent) {
  const src = agent && Array.isArray(agent.events) ? agent.events : [];
  const out = [];
  const start = src.length > EVENT_CAP ? src.length - EVENT_CAP : 0;
  for (let i = start; i < src.length; i++) {
    const row = sanitizeEvent(src[i]);
    if (row) out.push(row);
  }
  return out;
}

function channel(src, paused) {
  const o = src && typeof src === 'object' ? src : null;
  let reason = o ? str(o.reason) : '';
  if (reason === 'pause' && paused !== true) reason = '';
  return {
    engaged: !!(o && o.engaged === true),
    reason,
  };
}

function sessionPhase(ctx) {
  const death = ctx && ctx.deathApi;
  if (death && typeof death.isOpen === 'function') {
    try {
      if (death.isOpen() === true) return 'dead';
    } catch {
      /* treat as closed */
    }
  }
  const title = ctx && ctx.titleApi;
  if (title && typeof title.isOpen === 'function') {
    try {
      if (title.isOpen() === true) return 'title';
    } catch {
      /* treat as closed */
    }
  }
  const origins = ctx && ctx.originsApi;
  if (origins && typeof origins.isOpen === 'function') {
    try {
      if (origins.isOpen() === true) return 'origin';
    } catch {
      /* treat as closed */
    }
  }
  return 'playing';
}

/**
 * Frozen §0.2.1 snapshot. Missing ctx → no-ctx envelope and omit the rest.
 */
export function buildObservation(ctx) {
  try {
    if (missingCtx(ctx)) return noCtxObservation();

    const flags = ctx.flags && typeof ctx.flags === 'object' ? ctx.flags : {};
    const world = ctx.world && typeof ctx.world === 'object' ? ctx.world : {};
    const ship = ctx.ship && typeof ctx.ship === 'object' ? ctx.ship : {};
    const player = ctx.player && typeof ctx.player === 'object' ? ctx.player : null;
    const input = ctx.input && typeof ctx.input === 'object' ? ctx.input : {};
    const bio = ctx.bio && typeof ctx.bio === 'object' ? ctx.bio : {};
    const gate = ctx.gate && typeof ctx.gate === 'object' ? ctx.gate : {};
    const station = ctx.station && typeof ctx.station === 'object' ? ctx.station : {};
    const agent = ctx.agent && typeof ctx.agent === 'object' ? ctx.agent : null;
    const object = ship.object && typeof ship.object === 'object' ? ship.object : null;
    const origin = object ? vec3(object.position) : null;
    const group = weaponGroup(input);
    const current = ctx.targets && ctx.targets.current ? ctx.targets.current : null;
    const docked = flags.docked === true;
    const hailOpen = flags.hailOpen === true;
    const service = stationService(ctx);

    const shipSnap = {
      pos: origin,
      fwd: object ? fwdFromQuat(object.quaternion) : null,
      speed: num(ship.speed, 0),
      throttle: num(input.throttle, 0),
      weaponGroup: group,
      hull: playerNum(player, 'hull'),
      hullMax: playerNum(player, 'hullMax'),
      screen: playerNum(player, 'screen'),
      screenMax: playerNum(player, 'screenMax'),
      shell: playerNum(player, 'shell'),
      shellMax: playerNum(player, 'shellMax'),
      engine: playerNum(player, 'engine'),
      engineMax: playerNum(player, 'engineMax'),
      power: playerNum(player, 'power'),
      heat: playerNum(player, 'heat'),
      overheated: !!(player && player.overheated === true),
      engineOut: !!(player && player.engineOut === true),
      burnerActive: ship.burnerActive === true,
      driftActive: ship.driftActive === true,
      fleeEngaged: !!(ctx.flee && ctx.flee.engaged === true),
    };
    const burnerReadyAt = finiteOrNull(ship.burnerReadyAt);
    if (burnerReadyAt !== null) shipSnap.burnerReadyAt = burnerReadyAt;

    return {
      v: VERSION,
      t: num(world.time, 0),
      ok: true,
      error: '',
      agentOptIn: agent ? agent.optIn === true : false,
      session: { phase: sessionPhase(ctx) },
      ship: shipSnap,
      flags: {
        docked,
        combat: flags.combat === true,
        paused: flags.paused === true,
        chartOpen: flags.chartOpen === true,
        hailOpen,
        berthOpen: flags.berthOpen === true,
        berthHold: flags.berthHold === true,
        matchSpeed: flags.matchSpeed === true,
        camera: cameraMode(flags),
        fullStop: input.fullStop === true,
      },
      world: {
        currentSystem: str(world.currentSystem),
        credits: num(world.credits, 0),
        fear: num(world.fear, 0),
        cargoCapacity: num(ctx.cargoCapacity, 0),
        cargo: cargoRows(ctx.cargo),
      },
      bio: {
        mood: str(bio.mood) || 'serene',
        hunger: num(bio.hunger, 0),
        wounds: num(bio.wounds, 0),
        bond: num(bio.bond, 0),
      },
      nav: navSnap(world),
      gate: {
        inZone: gate.inZone === true,
        nearTo: typeof gate.nearTo === 'string' ? gate.nearTo : null,
        jumping: gate.jumping === true,
        progress: num(gate.progress, 0),
        destination: typeof gate.destination === 'string' ? gate.destination : null,
      },
      station: {
        inZone: station.inZone === true,
        name: str(station.name),
        systemName: str(station.systemName),
        service,
        services: docked ? DOCK_KEY_SERVICES.slice() : [],
      },
      jobs: jobRows(ctx, docked),
      market: marketBlock(ctx, docked, service),
      targets: {
        current: describeTarget(ctx, origin, current),
        nearby: nearbyTargets(ctx, origin, current, group),
      },
      hail: {
        open: hailOpen,
        intents: hailIntents(ctx, hailOpen),
      },
      autopilot: channel(ctx.autopilot, flags.paused === true),
      automine: channel(ctx.automine, flags.paused === true),
      lastIntent: copyLastIntent(agent && agent.lastIntent),
      events: copyEvents(agent),
    };
  } catch {
    return noCtxObservation();
  }
}
