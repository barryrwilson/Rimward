/**
 * Agent observe snapshot v2. Authored fields only into a fresh object.
 * Never JSON.stringify(ctx). Never returns functions, THREE, desks, or npc.ai.
 *
 * v2 (mission 43b34db25ae32972): capability manifest + dynamic availability,
 * active in-flight jobs, HUD-derived aim/lead geometry, full station view,
 * and the control-lease status. Every field maps to something a docked or
 * flying player can presently see; scanner-tier gates mirror the HUD.
 */

import { U, COMMODITIES, FACTIONS, ORE_TYPES, MINING_LASERS, miningLaserFor, resolveBand } from './state.js';
import { hailOffer } from './hail-offer.js';
import { losCloseRate } from './los-close.js';
import { agentControlStatus } from '../systems/controls.js';
import { surveyObjective } from './survey-nav.js';
import {
  VERSION,
  NEARBY_CAP,
  DOCK_KEY_SERVICES,
  EVENT_CAP,
  COMMAND_NAMES,
  capabilityManifest,
  num,
  str,
  finiteOrNull,
  vec3,
  fwdFromQuat,
  localDir,
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

function describeTarget(ctx, origin, t, extended) {
  if (!t || typeof t !== 'object') return null;
  if (isLiveShip(t)) {
    const p = posOf(t.object);
    const row = targetRow('ship', own(t, 'id'), shipDisplayName(ctx, t), rangeTo(origin, p));
    if (extended) shipCondition(ctx, t, row);
    return row;
  }
  if (isRockLock(ctx, t)) {
    const list = ctx.asteroids && ctx.asteroids.list;
    const idx = list ? list.indexOf(t) : -1;
    const row = targetRow('rock', idx >= 0 ? idx : null, 'rock', rangeTo(origin, posOf(t)));
    if (extended) rockCondition(ctx, t, row);
    return row;
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

/** HUD-true ship display name: a masked Q-ship's cover holds until the Mk II eye. */
function shipDisplayName(ctx, t) {
  const rec = t && t.record;
  const st = t && t.state;
  const scanner = ctx && ctx.world && Number.isFinite(ctx.world.scanner) ? ctx.world.scanner : 0;
  const masked = !!(rec && rec.qship) && !rec.revealed;
  const pierced = masked && scanner >= 2;
  if (masked && !pierced) {
    const cover = rec && typeof rec.coverName === 'string' && rec.coverName ? rec.coverName : '';
    if (cover) return cover;
  }
  // HUD bracket law (hud.js 2604): record name, then state name, else CONTACT.
  const named = (rec && typeof rec.name === 'string' && rec.name)
    || (st && typeof st.name === 'string' && st.name)
    || '';
  return named || 'CONTACT';
}

/**
 * Player-visible condition of a locked ship (HUD bracket + rail, hud.js
 * 2548-2672): faction, hostility cue, resolve band, disabled state, and the
 * rail vitals. Numeric resolve and the concealed-mounts mark follow the
 * Wolfeye scanner tiers exactly like the pane.
 */
function shipCondition(ctx, t, row) {
  const st = t && t.state;
  const rec = t && t.record;
  if (!st || typeof st !== 'object') return;
  const scanner = ctx && ctx.world && Number.isFinite(ctx.world.scanner) ? ctx.world.scanner : 0;
  const masked = !!(rec && rec.qship) && !rec.revealed;
  const pierced = masked && scanner >= 2;
  let key = (typeof st.faction === 'string' && st.faction)
    || (rec && typeof rec.faction === 'string' ? rec.faction : '')
    || 'independent';
  if (masked && !pierced && rec && typeof rec.coverFaction === 'string' && rec.coverFaction) {
    key = rec.coverFaction;
  }
  row.faction = key;
  row.factionName = Object.hasOwn(FACTIONS, key) ? str(FACTIONS[key].name) : key;
  // The HUD hostile-enter cue / combat flag is the player-visible source.
  row.hostile = !!(t.ai && t.ai.intent === true);
  row.disabled = st.disabled === true;
  if (typeof st.resolve === 'number' && Number.isFinite(st.resolve)) {
    row.resolveBand = resolveBand(st.resolve);
    if (scanner >= 1) row.resolve = Math.round(st.resolve);
  }
  if (pierced) row.concealedMounts = true;
  // Issue #67: public parity with the HUD bracket + prompt. `surrendered` is
  // the completed yield the npcSurrendered receipt already announces;
  // `hail` is the shared classifier verdict, so a controller reads the same
  // state, the same refusal reason, and the same next step the player sees.
  // No cargo, no ai internals, no Q-ship identity leak.
  row.surrendered = st.surrendered === true;
  const offer = hailOffer(ctx, t);
  row.hail = {
    state: str(offer.state),
    available: offer.available === true,
    blocked: str(offer.blocked),
    reason: str(offer.reason),
    next: str(offer.next),
  };
  const frac = (cur, max) => {
    const c = finiteOrNull(cur);
    const m = finiteOrNull(max);
    if (c === null || m === null || m <= 0) return null;
    return Math.max(0, Math.min(1, c / m));
  };
  const screen = frac(st.screen, st.screenMax);
  const shell = frac(st.shell, st.shellMax);
  const engine = frac(st.engine, st.engineMax);
  const hull = frac(st.hull, st.hullMax);
  if (screen !== null) row.screen = screen;
  if (shell !== null) row.shell = shell;
  if (engine !== null) row.engine = engine;
  if (hull !== null) row.hull = hull;
}

/** Locked-rock ore readout — the same fields the bracket prints (hud.js 2591-2614). */
function rockCondition(ctx, t, row) {
  const oreKey = typeof t.commodity === 'string' ? t.commodity : '';
  const oreName = (oreKey && Object.hasOwn(COMMODITIES, oreKey) && str(COMMODITIES[oreKey].name)) || 'Ore';
  const hardness = Number.isFinite(t.hardness)
    ? t.hardness
    : (ORE_TYPES[t.oreKey] && Number.isFinite(ORE_TYPES[t.oreKey].hardness) ? ORE_TYPES[t.oreKey].hardness : 1);
  const laser = miningLaserFor(ctx.world && Number.isFinite(ctx.world.miningLaser) ? ctx.world.miningLaser : 0);
  row.ore = oreName;
  row.hardness = hardness;
  if (Number.isFinite(t.ore)) row.unitsLeft = Math.round(t.ore);
  if (hardness > laser.tier) {
    row.blocked = true;
    let needs = MINING_LASERS[MINING_LASERS.length - 1];
    for (let li = 0; li < MINING_LASERS.length; li++) {
      if (MINING_LASERS[li].tier >= hardness) { needs = MINING_LASERS[li]; break; }
    }
    row.needsHead = str(needs.name);
  }
}

/** Copy of the HUD aim digest for the selected target. null when no lock. */
function aimDigestOf(ctx) {
  const aim = ctx && ctx.targets && typeof ctx.targets === 'object' ? ctx.targets.aim : null;
  if (!aim || typeof aim !== 'object') return null;
  const out = {
    onScreen: aim.onScreen === true,
    behind: aim.behind === true,
    nx: num(aim.nx, 0),
    ny: num(aim.ny, 0),
    dist: num(aim.dist, 0),
    closing: num(aim.closing, 0),
    speed: num(aim.speed, 0),
  };
  if (Array.isArray(aim.edge)) {
    const e = vec3([aim.edge[0], aim.edge[1], 0]);
    if (e) out.edge = [e[0], e[1]];
  }
  if (Array.isArray(aim.bearing)) {
    const b = vec3(aim.bearing);
    if (b) out.bearing = b;
  }
  if (aim.lead && typeof aim.lead === 'object') {
    const lead = { nx: num(aim.lead.nx, 0), ny: num(aim.lead.ny, 0) };
    if (Array.isArray(aim.leadBearing)) {
      const lb = vec3(aim.leadBearing);
      if (lb) lead.bearing = lb;
    }
    out.lead = lead;
  }
  return out;
}


function nearbyTargets(ctx, origin, current, group, quat) {
  const rangeMax = U.TARGET_RANGE;
  const range2 = rangeMax * rangeMax;
  const rows = [];
  const seen = new Set();
  const bearingOf = (p) => {
    if (!origin || !p || !quat) return null;
    return localDir(quat, p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]);
  };
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
    row.hostile = !!(s.ai && s.ai.intent === true);
    const b = bearingOf(p);
    if (b) row.bearing = b;
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
        const row = targetRow('rock', i, 'rock', Math.sqrt(d2));
        const b = bearingOf(p);
        if (b) row.bearing = b;
        rows.push(row);
        seen.add(a);
      }
    }
  }
  // Pods are world-visible and scoopable by proximity; the V-lock name is the
  // player-visible identity (SURVIVOR / ore / CARGO).
  const pods = Array.isArray(ctx.pods) ? ctx.pods : [];
  for (let i = 0; i < pods.length; i++) {
    const pod = pods[i];
    const p = pod && pod.mesh ? vec3(pod.mesh.position) : null;
    if (!origin || !p) continue;
    const d2 = (p[0] - origin[0]) ** 2 + (p[1] - origin[1]) ** 2 + (p[2] - origin[2]) ** 2;
    if (d2 > range2) continue;
    const row = targetRow('pod', null, podDisplayName(pod), Math.sqrt(d2));
    const b = bearingOf(p);
    if (b) row.bearing = b;
    rows.push(row);
  }
  rows.sort((a, b) => a.range - b.range);
  if (current && !seen.has(current)) {
    const extra = describeTarget(ctx, origin, current);
    if (extra) rows.unshift(extra);
  }
  if (rows.length > NEARBY_CAP) rows.length = NEARBY_CAP;
  return rows;
}

/** The V-lock bracket name for a pod (hud.js podLockName equivalent). */
function podDisplayName(pod) {
  const contents = pod && Array.isArray(pod.contents) ? pod.contents : [];
  if (!contents.length) return 'CARGO';
  let oreName = '';
  for (let i = 0; i < contents.length; i++) {
    const key = contents[i] && contents[i].commodity;
    if (key === 'survivor') return 'SURVIVOR';
    if (!oreName && typeof key === 'string' && Object.hasOwn(COMMODITIES, key)) {
      const n = COMMODITIES[key].name;
      if (typeof n === 'string' && n) oreName = n;
    }
  }
  return oreName || 'CARGO';
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

/** Player-visible contract row (jobs board card fields). */
function jobRow(ctx, j) {
  const row = {
    id: str(own(j, 'id')),
    kind: str(own(j, 'kind')),
    state: str(own(j, 'state')),
    reward: num(own(j, 'reward'), 0),
  };
  const title = own(j, 'title');
  if (row.kind === 'explore' && row.state === 'accepted') row.objective = surveyObjective(ctx, j);
  if (typeof title === 'string' && title) row.title = title;
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
  const originSystem = own(j, 'originSystem');
  if (typeof originSystem === 'string' && originSystem) row.originSystem = originSystem;
  const destination = own(j, 'destination');
  if (typeof destination === 'string' && destination) row.destination = destination;
  const target = own(j, 'target');
  if (typeof target === 'string' && target) row.target = target;
  if (own(j, 'collected') === true) row.collected = true;
  const payQuoted = own(j, 'payQuoted');
  if (typeof payQuoted === 'number' && Number.isFinite(payQuoted)) row.payQuoted = payQuoted;
  const deadline = own(j, 'deadline');
  if (typeof deadline === 'number' && Number.isFinite(deadline)) {
    row.deadline = deadline;
    const now = ctx && ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : null;
    if (now !== null) row.secondsLeft = Math.max(0, Math.floor(deadline - now));
  }
  return row;
}

/**
 * v2 jobs block: board offers only while docked; accepted contracts stay
 * observable in flight through their terminal jobState ring outcome.
 */
function jobsBlock(ctx, docked) {
  const jobs = ctx.world && Array.isArray(ctx.world.jobs) ? ctx.world.jobs : [];
  const offers = [];
  const active = [];
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (!j || typeof j !== 'object') continue;
    const state = str(own(j, 'state'));
    if (state === 'accepted') {
      active.push(jobRow(ctx, j));
      continue;
    }
    if (docked) offers.push(jobRow(ctx, j));
  }
  return { offers, active };
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

const HAIL_KINDS = new Set(['demand', 'surrender', 'salvage', 'conversation']);
const HAIL_AMOUNTS = Object.freeze(['ransom', 'tribute', 'demand', 'vouchCost']);

function hailOptionRow(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const intent = str(own(raw, 'intent'));
  if (!intent) return null;
  return { index: num(own(raw, 'index'), 0), intent, label: str(own(raw, 'label')) };
}

function hailAmounts(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (let i = 0; i < HAIL_AMOUNTS.length; i++) {
    const key = HAIL_AMOUNTS[i];
    const n = finiteOrNull(own(raw, key));
    if (n !== null) out[key] = n;
  }
  return out;
}

/**
 * Issue #66 hail block. Identity comes from ONE authoritative snapshot of the
 * live card (`ctx.hailApi.peek()`) — the speaker in the card header, the hail
 * family, the token that binds `hailResolve`, and the terms the player can
 * read. There is no fallback of any kind: a missing `hailApi`, a `peek()` that
 * throws, or a snapshot that reports the card closed publishes the authored
 * empty block. The bounded session ring, the selected target and a flags-only
 * stale card never name a conversation, a speaker, a family or terms — a
 * historical row cannot describe something the agent can act on now.
 *
 * Every field is copied out of that one snapshot as an OWN primitive, so an
 * inherited property cannot smuggle a value out and no live array, card or
 * ship object is ever shared with the caller.
 */
function hailBlock(ctx, hailOpen) {
  const block = {
    open: false,
    intents: [],
    conversationId: '',
    kind: '',
    speaker: null,
    terms: null,
  };
  const api = ctx && ctx.hailApi;
  if (!api || typeof api.peek !== 'function') return block;
  let peek = null;
  try {
    const raw = api.peek();
    if (raw && typeof raw === 'object') peek = raw;
  } catch {
    peek = null; // fail closed: no card, no identity, no history
  }
  if (!peek || own(peek, 'open') !== true) return block;
  block.open = true;
  const rawIntents = own(peek, 'intents');
  if (Array.isArray(rawIntents)) {
    for (let i = 0; i < rawIntents.length; i++) {
      if (typeof rawIntents[i] === 'string') block.intents.push(rawIntents[i]);
    }
  }
  const id = str(own(peek, 'conversationId'));
  if (id && !reservedName(id)) block.conversationId = id;
  const kind = str(own(peek, 'kind'));
  if (HAIL_KINDS.has(kind)) block.kind = kind;
  const speaker = own(peek, 'speaker');
  if (speaker && typeof speaker === 'object') {
    const sid = own(speaker, 'id');
    const idOk = typeof sid === 'string'
      || (typeof sid === 'number' && Number.isFinite(sid));
    block.speaker = {
      id: idOk ? sid : null,
      name: str(own(speaker, 'name')),
    };
  }
  const terms = own(peek, 'terms');
  if (terms && typeof terms === 'object') {
    const options = [];
    const rawOptions = own(terms, 'options');
    if (Array.isArray(rawOptions)) {
      for (let i = 0; i < rawOptions.length; i++) {
        const row = hailOptionRow(rawOptions[i]);
        if (row) options.push(row);
      }
    }
    block.terms = {
      line: str(own(terms, 'line')),
      options,
      amounts: hailAmounts(own(terms, 'amounts')),
    };
  }
  return block;
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
  const out = {
    engaged: !!(o && o.engaged === true),
    reason,
  };
  const mode = o ? str(o.mode) : '';
  if (mode) out.mode = mode;
  const phase = o ? str(o.phase) : '';
  if (phase) out.phase = phase;
  if (mode === 'dock') {
    out.range = num(o.range, 0);
    out.progress = Math.max(0, Math.min(1, num(o.progress, 0)));
  }
  return out;
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
 * Dynamic per-command availability (v2 discovery): phase, dock/service,
 * overlay, and helm ownership reasons. Cheap flag-level gating only — the
 * authoritative validation still happens inside act().
 */
function availabilityBlock(ctx, phase) {
  const flags = ctx.flags && typeof ctx.flags === 'object' ? ctx.flags : {};
  const paused = flags.paused === true;
  const held = flags.berthHold === true;
  const docked = flags.docked === true;
  const hailOpenF = flags.hailOpen === true;
  const overlay = flags.chartOpen === true || flags.berthOpen === true || hailOpenF;
  const helm = !!(
    (ctx.autopilot && ctx.autopilot.engaged === true)
    || (ctx.world && ctx.world.nav && ctx.world.nav.autopilot === true)
    || (ctx.automine && ctx.automine.engaged === true)
    || (ctx.flee && ctx.flee.engaged === true)
  );
  const out = {};
  for (let i = 0; i < COMMAND_NAMES.length; i++) {
    const name = COMMAND_NAMES[i];
    let reason = '';
    if (paused && !(name === 'ping' || name === 'disable' || name === 'startGame' || name === 'chooseOrigin')) {
      reason = 'paused';
    } else if (held && name !== 'ping' && name !== 'disable') {
      reason = 'held';
    } else if (name === 'dock') {
      if (!(ctx.station && ctx.station.inZone === true)) reason = 'range';
    } else if (name === 'undock' || name === 'openService' || name === 'acceptJob'
      || name === 'trade' || name === 'repairAll' || name === 'feed' || name === 'stationAction') {
      if (!docked) reason = 'no-service';
    } else if (name === 'selectTarget' || name === 'setWeaponGroup' || name === 'afterburner' || name === 'approachDock') {
      if (docked) reason = 'docked';
    } else if (name === 'setControl') {
      if (docked) reason = 'docked';
      else if (phase !== 'playing') reason = 'phase';
      else if (overlay) reason = 'overlay';
      else if (helm) reason = 'helm';
    } else if (name === 'recover') {
      if (phase !== 'dead') reason = 'no-service';
    } else if (name === 'startGame') {
      if (phase !== 'title') reason = 'no-service';
    } else if (name === 'chooseOrigin') {
      if (phase !== 'origin') reason = 'no-service';
    } else if (name === 'hailResolve') {
      if (!hailOpenF) reason = 'closed';
    }
    out[name] = { ok: reason === '', reason };
  }
  return out;
}

/** Structured docked panel view (v2): rows + clickable actions + notice. */
function stationView(ctx, docked) {
  if (!docked) return null;
  const desk = ctx.stationDesk;
  if (!desk || typeof desk.peekView !== 'function') return null;
  try {
    const view = desk.peekView();
    if (!view || typeof view !== 'object') return null;
    return {
      level: view.level === 2 ? 2 : 1,
      service: typeof view.service === 'string' && view.service ? view.service : null,
      notice: str(view.notice),
      pending: view.pending === true,
      rows: Array.isArray(view.rows) ? view.rows : [],
      actions: Array.isArray(view.actions) ? view.actions : [],
    };
  } catch {
    return null;
  }
}

/**
 * v2 snapshot. Missing ctx → no-ctx envelope and omit the rest.
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
    const stationPos = station.position && typeof station.position === 'object'
      ? station.position
      : null;
    const stationVec = stationPos ? vec3(stationPos) : null;
    const stationRange = rangeTo(origin, stationVec);
    const velocity = ship.velocity && typeof ship.velocity === 'object' ? ship.velocity : null;
    const stationClosing = object && stationPos && velocity
      ? losCloseRate(object.position, stationPos, {
        x: -num(velocity.x, 0),
        y: -num(velocity.y, 0),
        z: -num(velocity.z, 0),
      })
      : 0;

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

    const phase = sessionPhase(ctx);

    const shipSnap2 = shipSnap;
    shipSnap2.fireHeld = input.fireHeld === true;

    return {
      v: VERSION,
      t: num(world.time, 0),
      ok: true,
      error: '',
      agentOptIn: agent ? agent.optIn === true : false,
      capabilities: capabilityManifest(),
      availability: availabilityBlock(ctx, phase),
      session: { phase },
      control: agentControlStatus(ctx),
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
        scanner: num(world.scanner, 0),
        miningLaser: num(world.miningLaser, 0),
        concealedMounts: world.concealedMounts === true,
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
        range: num(stationRange, 0),
        closingSpeed: num(stationClosing, 0),
        service,
        services: docked ? DOCK_KEY_SERVICES.slice() : [],
        view: stationView(ctx, docked),
      },
      jobs: jobsBlock(ctx, docked),
      market: marketBlock(ctx, docked, service),
      targets: {
        current: describeTarget(ctx, origin, current, true),
        nearby: nearbyTargets(ctx, origin, current, group, object ? object.quaternion : null),
        aim: aimDigestOf(ctx),
      },
      hail: hailBlock(ctx, hailOpen),
      autopilot: channel(ctx.autopilot, flags.paused === true),
      automine: channel(ctx.automine, flags.paused === true),
      lastIntent: copyLastIntent(agent && agent.lastIntent),
      events: copyEvents(agent),
    };
  } catch {
    return noCtxObservation();
  }
}
