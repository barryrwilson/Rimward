import { SYSTEMS, FACTIONS, U } from './state.js';
import { standingRead } from './data-trade.js';
import { isUnknowable } from './faction-style.js';

/** Exact commLine / toast copy (Wave 104 REP-05). */
export const COVERING_LINE = 'Patrol covering.';

/** Known min. Copy RANK_LADDER / ace MIN_REP. */
export const COVERING_STANDING_MIN = 10;

/** Must match `LAW_ZONE_RADIUS` in `src/systems/npc.js`. */
export const COVERING_RADIUS = 300;

/** Copy police-leave BLOCKED_FACTIONS, plus independent / hollow. */
const BLOCKED_FACTIONS = new Set(['beautiful', 'unknowables', 'independent', 'hollow']);

let firedThisVisit = false;

export function resetPoliceCoverVisit() {
  firedThisVisit = false;
}

function systemFactionOf(ctx) {
  const id = ctx?.world?.currentSystem;
  if (typeof id !== 'string' || !id) return null;
  if (!Object.hasOwn(SYSTEMS, id)) return null;
  const def = SYSTEMS[id];
  const fac = def && def.faction;
  if (typeof fac !== 'string' || !fac) return null;
  if (!Object.hasOwn(FACTIONS, fac)) return null;
  return fac;
}

function ownString(obj, key) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  if (!Object.hasOwn(obj, key)) return null;
  const v = obj[key];
  return typeof v === 'string' && v ? v : null;
}

function roleOf(live) {
  return ownString(live?.ai, 'role') ?? ownString(live, 'role') ?? ownString(live?.record, 'role');
}

function hullActive(live) {
  const st = live?.state;
  if (!st || st.destroyed || st.disabled || st.surrendered) return false;
  return true;
}

/** Record or state faction that is not the system flag → ignore. */
function isLocalSystemPatrol(live, systemFaction) {
  if (roleOf(live) !== 'patrol') return false;
  if (!hullActive(live)) return false;
  const recFac = ownString(live.record, 'faction');
  const stFac = ownString(live.state, 'faction');
  if (recFac && recFac !== systemFaction) return false;
  if (stFac && stFac !== systemFaction) return false;
  if (!recFac && !stFac) return false;
  return true;
}

function inCombatWithPlayer(live) {
  const ai = live?.ai;
  if (!ai || typeof ai !== 'object' || Array.isArray(ai)) return false;
  if (Object.hasOwn(ai, 'lastAttacker') && ai.lastAttacker === 'player') return true;
  if (Object.hasOwn(ai, 'target') && ai.target === 'player') return true;
  if (Object.hasOwn(ai, 'intent') && ai.intent === true) return true;
  return false;
}

function lastAttackerIsPlayer(live) {
  const ai = live?.ai;
  if (!ai || typeof ai !== 'object' || Array.isArray(ai)) return false;
  return Object.hasOwn(ai, 'lastAttacker') && ai.lastAttacker === 'player';
}

function playerFighting(ctx, hostile) {
  if (lastAttackerIsPlayer(hostile)) return true;
  const cur = ctx?.targets && ctx.targets.current;
  return cur === hostile;
}

function inLawZone(obj, station) {
  if (!station || !obj || !obj.position || typeof obj.position.distanceTo !== 'function') return false;
  const d = obj.position.distanceTo(station);
  if (!Number.isFinite(d)) return false;
  return d < COVERING_RADIUS;
}

function coveringAllowed(ctx) {
  if (!ctx) return false;
  if (ctx.flags && ctx.flags.docked === true) return false;
  if (ctx.gate && ctx.gate.jumping === true) return false;
  const systemFaction = systemFactionOf(ctx);
  if (!systemFaction) return false;
  if (BLOCKED_FACTIONS.has(systemFaction)) return false;
  const standing = standingRead(ctx.world?.reputation, systemFaction);
  return standing >= COVERING_STANDING_MIN;
}

function isCoveringHostile(ctx, other, station) {
  if (!other || other === ctx?.ship) return false;
  if (roleOf(other) !== 'pirate' && roleOf(other) !== 'ace') return false;
  if (!hullActive(other)) return false;
  const fac = ownString(other.state, 'faction') ?? ownString(other.record, 'faction');
  if (isUnknowable(fac)) return false;
  if (!playerFighting(ctx, other)) return false;
  // Copy hunterHasWork: no hostile intent starts inside the station law zone.
  if (inLawZone(other.object, station)) return false;
  return true;
}

function consumeVisitReset(ctx) {
  const evs = ctx?.lastEvents;
  if (!Array.isArray(evs)) return;
  for (let i = 0; i < evs.length; i++) {
    if (evs[i] && evs[i].type === 'systemLoaded') {
      firedThisVisit = false;
      return;
    }
  }
}

/**
 * Nearest pirate/ace the player is already fighting. vsPlayer never.
 * Standing 0 / reserved / blocked flags → null (pirate-work hunt stays ungated).
 */
export function findCoveringWork(ctx, live) {
  if (!coveringAllowed(ctx) || !live || !live.object) return null;
  const systemFaction = systemFactionOf(ctx);
  if (!isLocalSystemPatrol(live, systemFaction)) return null;
  if (inCombatWithPlayer(live)) return null;
  const station = ctx.config && ctx.config.world && ctx.config.world.stationPosition;
  if (inLawZone(live.object, station)) return null;

  const ships = ctx.ships;
  if (!Array.isArray(ships)) return null;
  const pos = live.object.position;
  let best = null;
  let bestD = U.ENCOUNTER_BUBBLE;
  for (let i = 0; i < ships.length; i++) {
    const other = ships[i];
    if (other === live || !other || !other.object) continue;
    if (!isCoveringHostile(ctx, other, station)) continue;
    const d = pos.distanceTo(other.object.position);
    if (!Number.isFinite(d)) continue;
    if (d < bestD) {
      best = other;
      bestD = d;
    }
  }
  return best;
}

/**
 * Once per systemLoaded visit: local-system-faction patrols cover the
 * pirate/ace the player is fighting when standing is Known (10) or better.
 * Live latch only. Missing / reserved / proto standing → standingRead 0 (no covering).
 */
export function tickPoliceCover(ctx) {
  if (!ctx) return false;
  consumeVisitReset(ctx);
  if (firedThisVisit) return false;

  const ships = ctx.ships;
  if (!Array.isArray(ships)) return false;
  for (let i = 0; i < ships.length; i++) {
    if (!findCoveringWork(ctx, ships[i])) continue;
    firedThisVisit = true;
    if (typeof ctx.emit === 'function') {
      ctx.emit('commLine', { text: COVERING_LINE });
    }
    return true;
  }
  return false;
}
