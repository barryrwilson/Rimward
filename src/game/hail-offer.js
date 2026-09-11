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
 *               some other ship, an open chart or a calm window must never
 *               erase YIELDED / DEAD IN SPACE / willing. `label` is the word
 *               the existing HUD resolve line prints — no extra row is added.
 *   `blocked`   transient, right-now reason the key would do nothing, plus
 *               `available` and `reason` — which follow hail.js's REAL KeyH
 *               precedence exactly, for every live ship state.
 *
 * KeyH precedence, mirrored below in `transientBlocker` (hail.js ~1110-1150):
 *   1. a card is already open  → the press is swallowed, no toast   ('busy')
 *   2. paused, play surface or settings owns the screen → no toast ('surface')
 *   3. the play-card mutex refuses: chart or berth  → that overlay token
 *   4. salvage / willing: unreadable geometry, then range (canHailDisabled,
 *      canDemandTerms)
 *   5. salvage / willing: the session calm window                   ('calm')
 * Steps 4-5 apply only to the states whose card hail.js can actually open:
 * a wreck's salvage card and, since issue #122, a willing hull's terms card.
 * An intact yielded hull had no card to lose, so calm never speaks for it —
 * its own specific reason does.
 *
 * Only player-visible facts are read: the lock is live, `state.disabled`,
 * `state.surrendered` (already announced by npcSurrendered, cut engines and
 * the fear bump), the resolve band the bracket already prints, range, and the
 * surface / overlay / calm gates. No record identity, so a masked Q-ship's
 * disguise is untouched; no cargo manifest, no ai internals, no unoffered
 * terms — and no `hailApi.peek()` call, so issue #66's one authoritative peek
 * per observation is preserved.
 *
 * Pure. No DOM of its own, no THREE, no writes — never changes combat,
 * economy, resolve, or who may open a card. hail.js stays the sole source of
 * truth for the card; this module only describes what that source will do.
 * overlay-policy.js is a leaf with no imports of its own, and src/game already
 * depends on it (agent-flee, autopilot, jump), so the direction stays safe.
 */

/** Persistent per-hull encounter states. */
export const HAIL_OFFER_STATES = Object.freeze([
  'none',     // nothing locked
  'not-ship', // rock/station/gate/pod/landmark, or a dead or despawned hull
  'salvage',  // disabled hull — the salvage card is the valid interaction
  'yielded',  // surrender COMPLETE; no further terms to negotiate
  // Low morale and no completed surrender. Deliberately NEUTRAL: it says only
  // that the hull is willing to break, which stays true whether or not a card
  // is offering terms right now. It is a morale reading, never a reward —
  // but since issue #122 a deliberate hail on it DOES open the terms card.
  'willing',
  'no-hail',  // holding their nerve; nothing to talk about
]);

/** Transient blockers, in the KeyH precedence order above. */
export const HAIL_BLOCKERS = Object.freeze([
  'busy',          // a hail card is already on screen — the press is swallowed
  'surface',       // paused / title / models / typing focus / settings screen
  'overlay-chart',
  'overlay-berth',
  'geometry',      // salvage: no readable position — fail closed
  'range',         // salvage: outside hail range
  'calm',          // salvage: session calm window after a stand-down
]);

/**
 * Copy per persistent state. `label` replaces the word on the existing HUD
 * resolve line; `next` is the one-line step, shown only when the player
 * deliberately presses H and in the public `hail.next`.
 *
 * NOTHING here is printed passively. Owner call (issue #67 UI follow-up): an
 * inactive notice on the bracket costs screen space the faction, distance and
 * concealed-mounts marks have a better claim on, so there is no clause field
 * and no extra DOM row. Deliberately narrow wording too: spent TERMS are not a
 * spent hull — jettisoned pods stay collectable and a disabled hull stays
 * salvageable.
 */
const STATE_COPY = Object.freeze({
  none: { verb: 'hail', reason: 'none', label: '', next: '' },
  'not-ship': { verb: 'hail', reason: 'no-hail', label: '', next: '' },
  salvage: {
    verb: 'salvage',
    reason: '',
    label: 'DEAD IN SPACE',
    next: 'Hail to open the salvage card.',
  },
  yielded: {
    verb: 'hail',
    reason: 'yielded',
    label: 'YIELDED',
    next: 'They have already yielded. No further terms to negotiate.',
  },
  // The word the resolve line already prints (BARGAINING / WILLING TO YIELD)
  // is the morale statement and stays true with or without a card. The step
  // below describes only the case with NO card open — a live card takes the
  // 'busy' branch, where the step names the card instead.
  // Issue #122: a willing hull is now an ACTION — a deliberate hail opens the
  // surrender card with the player as causer (npc.js tryOpenTermsHail), so
  // the unblocked reason is empty like salvage. 'no-answer' survives in
  // hail.js's vocabulary for the one press the key still cannot answer (a
  // pirate mid-demand); it is no longer the classifier's word for willing.
  willing: {
    verb: 'hail',
    reason: '',
    label: '',
    next: 'Hail to demand terms.',
  },
  'no-hail': { verb: 'hail', reason: 'no-hail', label: '', next: '' },
});

/** The step to take when a transient blocker is in the way. */
const BLOCKED_COPY = Object.freeze({
  busy: 'A hail card is open. Read the terms on the card.',
  surface: 'Leave the open screen first.',
  'overlay-chart': 'Close the chart first.',
  'overlay-berth': 'Close the berth records first.',
  geometry: 'The lock cannot be read.',
  range: 'Close in to hail this hull.',
  calm: 'Comms are quiet after the last stand-down.',
});

/**
 * The miss token hail.js would emit for a blocker. '' means the press produces
 * NO toast at all: a swallowed press ('busy') or a suppressed surface press.
 */
const BLOCKED_REASON = Object.freeze({
  busy: '',
  surface: '',
  'overlay-chart': 'overlay-chart',
  'overlay-berth': 'overlay-berth',
  geometry: 'no-hail',
  range: 'range',
  calm: 'calm',
});

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
    if (band === 'bargaining' || band === 'capitulate') return 'willing';
    return 'no-hail';
  } catch {
    return 'no-hail';
  }
}

/**
 * The transient blocker for one LIVE ship lock, in hail.js's own KeyH order.
 * Applies to every live-ship state so the shared feedback and the real key can
 * never disagree; the salvage-only steps are marked below. Any helper that
 * throws fails closed — a blocker is claimed, never an action.
 */
function transientBlocker(ctx, live, state, dist, range) {
  if (state === 'none' || state === 'not-ship') return '';
  // 1. An open card swallows the press outright (hail.js: `hailPressed && !open`).
  try {
    if (overlayIsOpen(ctx, 'hail') === true) return 'busy';
  } catch {
    return 'busy';
  }
  // 2. A halted world or an owned screen takes no hail key and shows no toast.
  //    KeyH cannot reach hail.js at all while paused — three production gates
  //    stand in front of it: main.js skips the whole system update loop
  //    (`if (!ctx.flags.paused)`), controls.js returns early from keydown, and
  //    agent-api.js refuses every action but startGame/chooseOrigin with the
  //    'paused' token. hail.js itself has no pause branch because it never
  //    runs; only a harness calling hail.update() by hand sees otherwise, and
  //    that path does not exist for a player. The classifier therefore reads
  //    the flag directly, then the same two surface helpers hail.js consults.
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
  // 3. The play-card mutex. An overlay is the real blocker for ANY lock, and
  //    it outranks range and calm exactly as the KeyH branch does.
  try {
    if (canOpenPlayCard(ctx, 'hail') === false) {
      try {
        if (overlayIsOpen(ctx, 'chart') === true) return 'overlay-chart';
        if (overlayIsOpen(ctx, 'berth') === true) return 'overlay-berth';
      } catch {
        return 'surface';
      }
      return 'surface';
    }
  } catch {
    return 'surface';
  }
  // 4/5. Only the states whose card hail.js can actually open: a wreck's
  //      salvage card, and (issue #122) a willing hull's terms card. An
  //      intact yielded hull had no card to lose, so it keeps its own
  //      specific reason instead of borrowing range or calm.
  if (state !== 'salvage' && state !== 'willing') return '';
  if (!Number.isFinite(dist)) return 'geometry';
  if (dist > range) return 'range';
  try {
    if (hailCalmOk(ctx, live) === false) return 'calm';
  } catch {
    /* a missing calm helper never blocks; hail.js treats it the same way */
  }
  return '';
}

/**
 * Classify what the hail key would do against `live`, and why.
 * Never throws. `state`/`label` are persistent; `available`/`blocked`/`reason`
 * are this frame only and match the real KeyH result. `next` is never printed
 * passively — it answers a deliberate H press and the public `hail.next`.
 */
export function hailOffer(ctx, live, range = U.TARGET_RANGE) {
  const lim = Number.isFinite(range) ? range : U.TARGET_RANGE;
  let state = 'no-hail';
  let dist = NaN;
  let blocked = '';
  try {
    state = hailEncounterState(ctx, live);
    dist = hailLockRange(ctx, live);
    blocked = transientBlocker(ctx, live, state, dist, lim);
  } catch {
    state = 'no-hail';
    blocked = '';
  }
  const copy = STATE_COPY[state] ?? STATE_COPY['no-hail'];
  // Issue #122: a willing hull is an action too — the key opens the terms card.
  const available = (state === 'salvage' || state === 'willing') && blocked === '';
  // A transient blocker owns the refusal token; only an unblocked lock speaks
  // for itself. '' means the real press produces no toast at all.
  const reason = blocked ? (BLOCKED_REASON[blocked] ?? '') : copy.reason;
  // A transient blocker also owns the step: the player answers it first.
  const next = blocked ? (BLOCKED_COPY[blocked] ?? '') : copy.next;
  const out = {
    state,
    label: copy.label,
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
