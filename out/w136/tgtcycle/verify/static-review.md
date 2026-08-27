# Wave 136 TGT-07 PR1 verifier static review

**Date:** 2026-08-26  
**Status:** CLEAN  
**Browser:** skipped. `[NO BROWSER COVERAGE]` Help line is sourced in `config.controls`. HUD paints it with `el(..., String(line))` (textContent). No Vite.

## Honor vs live src

Allowed writer: `src/systems/controls.js`, optional `src/core/ctx.js` comment, `docs/Tgt07CombatCycleDesign.md` status.

| Check | Result |
|---|---|
| Gate = ≥1 cand `ai.intent === true` | Yes. Index walk in `cycleTarget`. No `flags.combat`. |
| Hostile = live ship `ref.ai && ref.ai.intent === true` | Yes. `isCycleHostile`. Missing ai → false. try/catch. |
| Rocks / lockKind | `!ref.object` or `ref.lockKind` → false. Group 3 collect only. |
| Gated sort | hostile 0 then 1, then `d2`. Else `a.d2 - b.d2`. |
| Wrap | `(idx + 1) % n`. idx -1 → index 0. |
| Finite d2 / missing position | skip in `collectCycleCands`. |
| Help | `'T — cycle target (hostiles first in combat)'` |
| ctx comment | `hostiles first when one is in envelope` |
| KeyV/X/K | TRACKED + keydown cases unchanged. |
| innerHTML / paused / WORLD_FIELDS / new key | absent in controls.js |
| for-in ships | no; `for…of` |

## Sibling files (worktree)

`hud.js` / `station.js` / `combat.js` / `agent-api.js` are dirty from **other waves** (NAV-10 SLOW lamp, MSN-04 mining twins, Agent startGame/queued). Diffs do **not** contain `isCycleHostile` / cycle sort / Incoming toast lock. This pack did not steal those files. `state.js` / `npc.js` / `npc-fire-toast.js` unmoved in this pack.

## Replica probe

`node out/w136/tgtcycle/verify/replica-cycle-sort.mjs` → 18/18 PASS.

Playtest replica: empty lock, d2 20/40/59, only 59 hostile → first lock is the hostile.

## Processes

Verifier started none. Did not bind 5177 / 9411.
