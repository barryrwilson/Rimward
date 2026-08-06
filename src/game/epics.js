import { EPICS, rankFor } from './state.js';

/**
 * Faction epics (wave 6, ladder #10; data + effect vocabulary in state.js
 * EPICS). One three-stage systemic arc per faction. Stages are not scripted
 * quests: the moment a stage's requirements hold (rankTier via rankFor on
 * ctx.world.reputation[faction], cluesFound via ctx.world.mystery.found
 * length) the stage is achieved. Progress records in
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
 * effect objects of every achieved stage into a fresh object and writes
 * nothing. Call at transaction/AI time — never per frame.
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

  // Watched-value cache: epics only move when a reputation entry or the clue
  // count does, so a full evaluation is skipped on frames where none changed.
  const lastRep = {};
  for (const f of factions) lastRep[f] = null; // null forces a first evaluation
  let lastClues = -1;
  // Sticky re-evaluation flag: while a faction still has further achievable
  // stages beyond the one-per-frame advance, keep evaluating next frame even
  // though the watched values did not change again.
  let pending = true;

  /** Do this stage's own requirements hold right now? (Stages are ordered.) */
  function stageHolds(faction, req, rep, clues) {
    if (req.rankTier != null && rankFor(rep).tier < req.rankTier) return false;
    if (req.cluesFound != null && clues < req.cluesFound) return false;
    return true;
  }

  return {
    update(dt) {
      // Re-resolved each frame: save.js may swap ctx.world.epics wholesale
      // on load (same discipline as mystery.js's found/visited note).
      const epics = (ctx.world.epics ??= {});
      const rep = ctx.world.reputation;
      const clues = ctx.world.mystery?.found?.length ?? 0;

      if (!pending) {
        let dirty = clues !== lastClues;
        if (!dirty) {
          for (const f of factions) {
            if ((rep[f] ?? 0) !== lastRep[f]) { dirty = true; break; }
          }
        }
        if (!dirty) return;
      }
      pending = false;
      lastClues = clues;

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
