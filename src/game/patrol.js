// Issue #294 — the accepted patrol row must say what counts toward its
// progress, on the same observability bar as the explore/recovery
// jobs.active[].objective convention. The tally constants live here so the
// board card copy, the tick that advances the contract and the agent row all
// read ONE source (the same discipline the #285 hunt copy shares).
//
// What counts is set by tickPatrolJob (station.js): a pirate destroyed,
// disabled or surrendered with the player as the causer. This module only
// RESTATES that rule for the row — it never changes it.

export const PATROL_REWARD = 300;
export const PATROL_REP = 5;
export const PATROL_NEED = 2;

/**
 * The accepted row's objective read, derived from the same constants the
 * board card prints. JSON-plain: strings and numbers only, no live handles.
 */
export function patrolObjective(_ctx, job) {
  return {
    kind: 'tally',
    rule: `Kill or drive off pirates in the posting system's lane — your own kills, disables and accepted surrenders count.`,
    progress: Number.isFinite(job?.progress) ? job.progress : 0,
    need: Number.isFinite(job?.need) ? job.need : PATROL_NEED,
  };
}
