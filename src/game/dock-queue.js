/**
 * Issue #183 — the session-only queued dock intent.
 *
 * A plotted route ends at the arrival gate, so an agent had to notice the
 * arrival and send a second `approachDock`. This module holds the one wish
 * that closes that gap: "when the route reaches <dest>, take the berth".
 *
 * It owns state only. autopilot.js decides when the wish is armed, handed
 * over, or dropped; nav.js drops it when the route itself is replotted or
 * cleared. Nothing here is persisted, restored, or a helm: the dock approach
 * still runs through the existing cruise/stage/settle controller.
 */

// The route destination the wish is bound to. Empty means no wish at all.
let dest = '';
// True once the route has arrived and the handoff is waiting on the berth.
let pending = false;
// Sim-time deadline for that handoff. Meaningless while `pending` is false.
let until = 0;

function sysId(value) {
  return typeof value === 'string' ? value : '';
}

/** Arm the wish against a route destination. Replaces any earlier wish. */
export function queueDockAt(id) {
  dest = sysId(id);
  pending = false;
  until = 0;
}

/** The route arrived: the handoff now has until `deadline` to take the helm. */
export function armPendingDock(id, deadline) {
  dest = sysId(id);
  pending = dest !== '';
  until = pending && Number.isFinite(deadline) ? deadline : 0;
}

/** Drop the wish. Idempotent; the only way a queued intent ever ends. */
export function clearQueuedDock() {
  dest = '';
  pending = false;
  until = 0;
}

/** The bound destination, queued or pending. Empty when nothing is queued. */
export function queuedDockDest() {
  return dest;
}

/** The destination whose handoff is waiting on the berth, or empty. */
export function pendingDockDest() {
  return pending ? dest : '';
}

/** Sim-time deadline for the pending handoff. 0 when nothing is pending. */
export function pendingDockUntil() {
  return pending ? until : 0;
}
