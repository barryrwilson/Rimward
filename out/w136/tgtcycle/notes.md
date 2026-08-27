# Wave 136 TGT-07 PR1 notes

**Verdict:** PR1 landed. KeyT `cycleTarget` sorts hostiles-first then range when an in-envelope candidate has `ai.intent === true`. Else live d2-only wrap.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `claude/agent-claude` → `proceed_unmodeled` (`r-mtar5wg1-2b3ebb06`). No binding workflow. Did not `graph_approve` / `graph_propose`.
- Merge law: `out/w130/tgtcycle/shared-contract.md` wins over the design doc.
- Writer: `src/systems/controls.js` (`isCycleHostile`, gated sort, help string). Optional `src/core/ctx.js` **88** comment only.
- Status line: `docs/Tgt07CombatCycleDesign.md`.
- Did not edit `hud.js`, `npc.js`, `combat.js`, `agent-api.js`, `state.js`, `scripts/boot-test.mjs`.
- Did not start Vite or Chrome. No ports claimed.

## Lands

- Gate: ≥1 in-envelope cycle cand with `ai.intent === true` (600 u, not `flags.combat` / 800 u).
- Hostile: live ship (`object`, `state`, not destroyed, no `lockKind`) and `ref.ai && ref.ai.intent === true`. Missing `ai` → false. Never throw.
- Order when gated: hostiles by `d2`, then others (ships + group-3 rocks) by `d2`. No id tie-break.
- Wrap: `(idx + 1) % n`. Empty lock / `idx === -1` → first of sorted list (nearest hostile when gated).
- Rocks: group 3 only; never hostile bucket (`!ref.object` / no `state`).
- Kinds stay off the T list. Q-ship: intent only.
- Help: `'T — cycle target (hostiles first in combat)'` in `config.controls`.
- `cycleTarget` try/catch. One cand walk. `for…of` / index, no `for-in` on `ctx.ships`.

## Synthetic probe (local node, replica of sort)

| Case | Result |
|---|---|
| d2 20/40/59, only 59 `intent===true`, empty lock | first lock = hostile |
| no intent | nearest first |
| rock d2 10 + hostile 59 | first = hostile; rock in other bucket |
| Q-ship intent, cover class unused | ranks hostile |
| destroyed / missing ai / lockKind / null | not hostile |

## Honor

- No new TRACKED key. KeyT/V/X/K stay. Digit 0/8/9 stay.
- No Incoming toast lock. No `act({name:'target'})`. No persist. No `innerHTML`. No WORLD_FIELDS. No hub PPI. No `flags.paused`.

## Reviews

- Security: low; no open high/critical.
- Code: no Blocker/Major.
- UI: no Blocker/Major (help-line textContent only).
- Re-run: not required (no HIGH/CRITICAL/Blocker/Major to fix).

## Processes

Started none.
