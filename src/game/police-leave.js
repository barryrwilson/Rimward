import { SYSTEMS, FACTIONS } from './state.js';
import { standingRead } from './data-trade.js';

/** Exact commLine / toast copy (Owner Wave 93). */
export const POLICE_LEAVE_LINE = 'Leave this space.';

/** Must match `LAW_ZONE_RADIUS` in `src/systems/npc.js`. */
export const POLICE_LEAVE_RADIUS = 300;

const BLOCKED_FACTIONS = new Set(['beautiful', 'unknowables']);

let firedThisVisit = false;

export function resetPoliceLeaveVisit() {
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

function playerInLawZone(ctx) {
  const hull = ctx?.ship?.object;
  const station = ctx?.config?.world?.stationPosition;
  if (!hull || !hull.position || !station || typeof station.distanceTo !== 'function') return false;
  const d = hull.position.distanceTo(station);
  if (!Number.isFinite(d)) return false;
  return d < POLICE_LEAVE_RADIUS;
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

function hasQualifyingPatrol(ctx, systemFaction) {
  const ships = ctx?.ships;
  if (!Array.isArray(ships)) return false;
  for (let i = 0; i < ships.length; i++) {
    const live = ships[i];
    if (!isLocalSystemPatrol(live, systemFaction)) continue;
    if (inCombatWithPlayer(live)) continue;
    return true;
  }
  return false;
}

/**
 * Once per systemLoaded visit: local-system-faction patrols order the player
 * out when standing is below 0 and above −10, inside the station law zone.
 * Live latch only. Standing NaN / missing / reserved → standingRead 0 (no leave).
 */
export function tickPoliceLeave(ctx) {
  if (!ctx) return false;
  consumeVisitReset(ctx);
  if (firedThisVisit) return false;
  if (ctx.flags && ctx.flags.docked === true) return false;
  if (ctx.gate && ctx.gate.jumping === true) return false;
  if (!playerInLawZone(ctx)) return false;

  const systemFaction = systemFactionOf(ctx);
  if (!systemFaction) return false;
  if (BLOCKED_FACTIONS.has(systemFaction)) return false;

  const standing = standingRead(ctx.world?.reputation, systemFaction);
  if (!(standing < 0 && standing > -10)) return false;

  if (!hasQualifyingPatrol(ctx, systemFaction)) return false;

  firedThisVisit = true;
  if (typeof ctx.emit === 'function') {
    ctx.emit('commLine', { text: POLICE_LEAVE_LINE });
  }
  return true;
}
