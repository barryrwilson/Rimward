import { EPICS, rankFor } from './state.js';

/**
 * Faction epics (wave 6, ladder #10; wave 7 capstones; data + effect
 * vocabulary in state.js EPICS). One systemic arc per faction: three
 * rank/clue stages plus a fourth CAPSTONE gated on a systemic condition.
 * Stages are not scripted quests: the moment a stage's requirements hold the
 * stage is achieved. Requirement keys (stageHolds): rankTier via rankFor on
 * ctx.world.reputation[faction]; cluesFound via ctx.world.mystery.found
 * length; landmarkVisited via ctx.world.mystery.visited; converged/deepened
 * via ctx.world.mystery flags; credits/fear via ctx.world scalars.
 * Progress records in
 * ctx.world.epics = { [faction]: achievedStageCount } — JSON-plain, persisted
 * via save.js WORLD_FIELDS 'epics'.
 *
 * Advancement is capped at ONE stage per faction per frame, emitting
 * 'epicStage' { id, faction, stage, line } per advance, so several
 * simultaneous unlocks surface as sequential toasts rather than a burst.
 * Reputation loss never revokes a recorded stage.
 *
 * epicEffects(ctx, faction) is the PURE read-side contract: station.js prices
 * trade/refit/jobs with it and npc.js reads pirateResolveMod. It merges the
 * effect objects of every achieved stage into a fresh object via
 * Object.assign — a later stage's value REPLACES an earlier one under the
 * same key, so capstone values are totals, not deltas. It writes nothing.
 * Call at transaction/AI time — never per frame.
 *
 * update() performs zero allocations: faction list and last-seen reputation
 * cache are built once at init; the per-frame work is a handful of number
 * compares, and a full requirement re-evaluation runs only when a watched
 * value (a reputation entry, or the clue count) actually changed.
 */

/** Merged effect object of all achieved stages for `faction`. Pure. */
export function epicEffects(ctx, faction) {
  const fx = {};
  const epic = EPICS[faction];
  if (!epic) return fx;
  const achieved = Math.min(ctx.world.epics?.[faction] ?? 0, epic.stages.length);
  for (let i = 0; i < achieved; i++) Object.assign(fx, epic.stages[i].effect);
  return fx;
}

export function initEpics(ctx) {
  ctx.world.epics ??= {};
  const factions = Object.keys(EPICS); // frozen iteration order, built once

  // Watched-value cache: epics only move when a reputation entry, the clue
  // count, the visited count, a mystery flag, fear, or the credit bucket
  // does, so a full evaluation is skipped on frames where none changed.
  // Scalars only — zero allocations. Credit thresholds are multiples of 500,
  // so the watched value is the 500-UU bucket, not the raw balance.
  const lastRep = {};
  for (const f of factions) lastRep[f] = null; // null forces a first evaluation
  let lastClues = -1;
  let lastVisitedCount = -1;
  let lastConverged = null;
  let lastDeepened = null;
  let lastFear = null;
  let lastCreditBucket = null;
  // Sticky re-evaluation flag: while a faction still has further achievable
  // stages beyond the one-per-frame advance, keep evaluating next frame even
  // though the watched values did not change again.
  let pending = true;

  /** Do this stage's own requirements hold right now? (Stages are ordered.)
   * World scalars/flags are read live at call time — save.js may swap
   * ctx.world.* wholesale on load, so nothing is captured at init. */
  function stageHolds(faction, req, rep, clues) {
    if (req.rankTier != null && rankFor(rep).tier < req.rankTier) return false;
    if (req.cluesFound != null && clues < req.cluesFound) return false;
    if (req.landmarkVisited != null && (ctx.world.mystery?.visited?.indexOf(req.landmarkVisited) ?? -1) < 0) return false;
    if (req.converged === true && ctx.world.mystery?.converged !== true) return false;
    if (req.deepened === true && ctx.world.mystery?.deepened !== true) return false;
    if (req.credits != null && (ctx.world.credits ?? 0) < req.credits) return false;
    if (req.fear != null && (ctx.world.fear ?? 0) < req.fear) return false;
    return true;
  }

  return {
    update(dt) {
      // Re-resolved each frame: save.js may swap ctx.world.epics wholesale
      // on load (same discipline as mystery.js's found/visited note).
      const epics = (ctx.world.epics ??= {});
      const rep = ctx.world.reputation;
      const mystery = ctx.world.mystery;
      const clues = mystery?.found?.length ?? 0;
      const visitedCount = mystery?.visited?.length ?? 0;
      const converged = !!mystery?.converged;
      const deepened = !!mystery?.deepened;
      const fear = ctx.world.fear ?? 0;
      const creditBucket = Math.floor((ctx.world.credits ?? 0) / 500);

      if (!pending) {
        let dirty = clues !== lastClues
          || visitedCount !== lastVisitedCount
          || converged !== lastConverged
          || deepened !== lastDeepened
          || fear !== lastFear
          || creditBucket !== lastCreditBucket;
        if (!dirty) {
          for (const f of factions) {
            if ((rep[f] ?? 0) !== lastRep[f]) { dirty = true; break; }
          }
        }
        if (!dirty) return;
      }
      pending = false;
      lastClues = clues;
      lastVisitedCount = visitedCount;
      lastConverged = converged;
      lastDeepened = deepened;
      lastFear = fear;
      lastCreditBucket = creditBucket;

      for (const f of factions) {
        const r = rep[f] ?? 0;
        lastRep[f] = r;
        const epic = EPICS[f];
        let achieved = 0;
        for (let i = 0; i < epic.stages.length; i++) {
          if (!stageHolds(f, epic.stages[i].requires, r, clues)) break;
          achieved = i + 1;
        }
        const recorded = epics[f] ?? 0;
        if (achieved > recorded) {
          const newCount = recorded + 1; // one stage per frame per faction
          epics[f] = newCount;
          const stage = epic.stages[newCount - 1];
          ctx.emit('epicStage', { id: f + '-epic-' + newCount, faction: f, stage: newCount, line: stage.line });
          if (achieved > newCount) pending = true; // more unlocks queued
        }
      }
    },
  };
}
