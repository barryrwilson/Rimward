import { U, resolveBand } from './state.js';
import {
  canOpenPlayCard,
  hailCalmOk,
  overlayIsOpen,
  playSurfaceBlocked,
  settingsOwnsScreen,
} from '../systems/overlay-policy.js';

/**
 * Shared player-visible hail/salvage classifier (issue #67).
 *
 * One truth for three surfaces: the HUD target bracket + prompt (hud.js), the
 * KeyH miss toast (hail.js), and `observe().targets.current` (agent-observe.js).
 * Before this, the bracket printed the resolve BAND while H opened nothing, so
 * an intact Claim Wren reading CAPITULATE at 176 u answered "no hail" with no
 * way to tell "willing to break" from "already surrendered", "too far", or
 * "an overlay is in the way".
 *
 * TWO INDEPENDENT AXES — do not merge them:
 *   `state`     persistent encounter outcome for THIS hull. A card open for
 *               some other ship, an open chart, or a calm window must never
 *               erase YIELDED / DEAD IN SPACE / no-terms.
 *   `blocked`   transient, right-now reason the key would do nothing, and
 *               `available` — the real preconditions hail.js applies.
 *
 * Only player-visible facts are read: the lock is live, `state.disabled`,
 * `state.surrendered` (already announced by npcSurrendered, cut engines and
 * the fear bump), the resolve band the bracket already prints, range, and the
 * pause / overlay / calm gates. No record identity, so a masked Q-ship's disguise is
 * untouched; no cargo manifest, no ai internals, no unoffered terms.
 *
 * Pure. No DOM of its own, no THREE, no writes — never changes combat,
 * economy, resolve, or who may open a card. hail.js stays the sole source of
 * truth for the card; this module only describes what that source will do.
 * overlay-policy.js is a leaf with no imports of its own, and src/game already
 * depends on it (agent-flee, autopilot, jump), so the direction stays safe.
 */

/** Persistent per-hull encounter states. */
export const HAIL_OFFER_STATES = Object.freeze([
  'none',       // nothing locked
  'not-ship',   // rock/station/gate/pod/landmark, or a dead or despawned hull
  'salvage',    // disabled hull — the salvage card is the valid interaction
  'yielded',    // surrender COMPLETE; no further hail claim on this hull
  'unanswered', // low morale, no surrender, and no terms offered
  'no-hail',    // holding their nerve; nothing to talk about
]);

/** Transient blockers, most specific first. '' means nothing is in the way. */
export const HAIL_BLOCKERS = Object.freeze([
  'geometry',      // no readable position — fail closed
  'range',         // outside hail range
  'surface',       // paused / play surface / settings owns the screen
  'overlay-chart',
  'overlay-berth',
  'busy',          // a hail card is already on screen
  'calm',          // session calm window after a stand-down
]);

/**
 * Copy per persistent state. `label` replaces the bracket resolve word,
 * `clause` joins the bracket meta line, `next` is the one-line step.
 * Deliberately narrow: a spent hail claim is NOT a spent hull — jettisoned
 * pods stay collectable and a disabled hull stays salvageable.
 */
const STATE_COPY = Object.freeze({
  none: { verb: 'hail', reason: 'none', label: '', clause: '', next: '' },
  'not-ship': { verb: 'hail', reason: 'no-hail', label: '', clause: '', next: '' },
  salvage: {
    verb: 'salvage',
    reason: '',
    label: 'DEAD IN SPACE',
    clause: '',
    next: 'Hail to open the salvage card.',
  },
  yielded: {
    verb: 'hail',
    reason: 'yielded',
    label: 'YIELDED',
    clause: 'NO HAIL CLAIM',
    next: 'They have already yielded. No further hail claim on this hull.',
  },
  unanswered: {
    verb: 'hail',
    reason: 'no-answer',
    label: '',
    clause: 'NO TERMS',
    next: 'Their nerve is low, but they have offered no terms to accept.',
  },
  // The band word the bracket already prints (BARGAINING / CAPITULATE) is the
  // morale statement and stays true whether or not a card is up. Only the
  // clause and the step are card-aware, below.
  'no-hail': { verb: 'hail', reason: 'no-hail', label: '', clause: '', next: '' },
});

/** Extra line appended to `next` when a transient blocker is in the way. */
const BLOCKED_COPY = Object.freeze({
  geometry: 'The lock cannot be read.',
  range: 'Close in to hail this hull.',
  surface: 'Leave the open screen first.',
  'overlay-chart': 'Close the chart first.',
  'overlay-berth': 'Close the berth records first.',
  busy: 'A hail card is open. Read the terms on the card.',
  calm: 'Comms are quiet after the last stand-down.',
});

/** True when a hail card is on screen. overlay-policy owns the flag. */
function cardOnScreen(ctx) {
  try {
    return overlayIsOpen(ctx, 'hail') === true;
  } catch {
    return true; // unreadable → assume a card is up and claim nothing
  }
}

function lockedLiveShip(ctx, live) {
  if (!live || live.lockKind) return false;
  if (!live.state || !live.object) return false;
  if (live.state.destroyed) return false;
  const list = ctx && ctx.ships;
  if (!list || typeof list.includes !== 'function') return false;
  return list.includes(live);
}

/**
 * Range to the lock, or NaN when either end has no readable position.
 * NaN is treated as a blocker everywhere below (fail closed).
 */
export function hailLockRange(ctx, live) {
  try {
    const player = ctx && ctx.ship && ctx.ship.object;
    if (!player || !player.position || !live || !live.object) return NaN;
    const p = live.object.position;
    if (!p || typeof player.position.distanceTo !== 'function') return NaN;
    const d = player.position.distanceTo(p);
    return Number.isFinite(d) ? d : NaN;
  } catch {
    return NaN;
  }
}

/**
 * True when the record identity must stay behind its cover (wave 31 Q-ship
 * rule, the hud.js bracket law): masked, and the Mk II Wolfeye has not pierced
 * it. Public feedback added by issue #67 fires far more often than the old
 * generic miss, so every name it prints obeys the same scanner tier the
 * bracket does.
 */
export function coverHoldsFor(ctx, live) {
  try {
    const rec = live && live.record;
    if (!rec || rec.qship !== true || rec.revealed === true) return false;
    const scanner = ctx && ctx.world && Number.isFinite(ctx.world.scanner) ? ctx.world.scanner : 0;
    return scanner < 2;
  } catch {
    return false;
  }
}

/** Persistent encounter state for one lock. Transient gates play no part. */
export function hailEncounterState(ctx, live) {
  try {
    if (!live) return 'none';
    if (!lockedLiveShip(ctx, live)) return 'not-ship';
    const st = live.state;
    // Salvage outranks morale: a dead hull no longer has a resolve to read.
    if (st.disabled === true) return 'salvage';
    if (st.surrendered === true) return 'yielded';
    const band = Number.isFinite(st.resolve) ? resolveBand(st.resolve) : '';
    if (band === 'bargaining' || band === 'capitulate') return 'unanswered';
    return 'no-hail';
  } catch {
    return 'no-hail';
  }
}

/**
 * The transient blocker for a hull whose state is actionable ('salvage').
 * Mirrors the preconditions hail.js applies on the KeyH press, in its order:
 * play surface, then the play-card mutex, then session calm — with range and
 * geometry from canHailDisabled. Any helper that throws fails closed.
 */
function salvageBlocker(ctx, live, dist, range) {
  if (!Number.isFinite(dist)) return 'geometry';
  if (dist > range) return 'range';
  // A halted world takes no hail key. playSurfaceBlocked covers the play
  // surfaces, not the plain pause flag, so check the flag itself first.
  try {
    if (ctx && ctx.flags && ctx.flags.paused === true) return 'surface';
  } catch {
    return 'surface';
  }
  try {
    if (playSurfaceBlocked(ctx) === true) return 'surface';
  } catch {
    return 'surface';
  }
  try {
    if (settingsOwnsScreen() === true) return 'surface';
  } catch {
    return 'surface';
  }
  try {
    if (canOpenPlayCard(ctx, 'hail') === false) {
      try {
        if (overlayIsOpen(ctx, 'chart') === true) return 'overlay-chart';
        if (overlayIsOpen(ctx, 'berth') === true) return 'overlay-berth';
        if (overlayIsOpen(ctx, 'hail') === true) return 'busy';
      } catch {
        return 'surface';
      }
      return 'surface';
    }
  } catch {
    return 'surface';
  }
  try {
    if (overlayIsOpen(ctx, 'hail') === true) return 'busy';
  } catch {
    return 'busy';
  }
  try {
    if (hailCalmOk(ctx, live) === false) return 'calm';
  } catch {
    /* a missing calm helper never blocks; hail.js treats it the same way */
  }
  return '';
}

/**
 * Classify what the hail key would do against `live`, and why.
 * Never throws. `state`/`label`/`clause` are persistent; `available`/`blocked`
 * are this frame only.
 */
export function hailOffer(ctx, live, range = U.TARGET_RANGE) {
  const lim = Number.isFinite(range) ? range : U.TARGET_RANGE;
  let state = 'no-hail';
  let dist = NaN;
  let blocked = '';
  try {
    state = hailEncounterState(ctx, live);
    dist = hailLockRange(ctx, live);
    if (state === 'salvage') blocked = salvageBlocker(ctx, live, dist, lim);
    // An open card — this hull's own bargaining/surrender card, or an
    // unrelated one — is the live conversation. Saying "no terms offered"
    // beside it would contradict the card, so the morale state reports the
    // card instead. The persistent band word on the bracket is untouched, and
    // the real KeyH 'no-answer' refusal still runs only with no card open.
    else if (state === 'unanswered' && cardOnScreen(ctx)) blocked = 'busy';
  } catch {
    state = 'no-hail';
    blocked = '';
  }
  const copy = STATE_COPY[state] ?? STATE_COPY['no-hail'];
  const available = state === 'salvage' && blocked === '';
  // Miss-event token. A salvage hull held off by a transient UI gate reports
  // no token of its own — hail.js owns those, in its own runtime order.
  let reason = copy.reason;
  if (state === 'salvage') {
    if (blocked === 'range') reason = 'range';
    else if (blocked === 'geometry') reason = 'no-hail';
    else reason = '';
  }
  const blockedNext = blocked ? (BLOCKED_COPY[blocked] ?? '') : '';
  // A transient blocker replaces the step for both actionable states: the
  // player answers the blocker first, and only then the state's own step.
  const next = blockedNext || copy.next;
  // The clause is suppressed while a card is open so the bracket can never
  // print NO TERMS next to a card that is offering terms.
  const clause = blocked === 'busy' && state === 'unanswered' ? '' : copy.clause;
  const out = {
    state,
    label: copy.label,
    clause,
    next,
    available,
    blocked,
    verb: copy.verb,
    reason,
    range: lim,
  };
  if (Number.isFinite(dist)) out.dist = Math.round(dist);
  return out;
}
