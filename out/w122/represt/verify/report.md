# Wave 122 remaining REP leftover — verifier report

**Status:** CLEAN  
**Date:** 2026-08-25  
**Domain:** data  
**Browser:** [NO BROWSER COVERAGE] — Vite not started; Chrome not started.

## Verdict

Worker leftover freeze **CONSUME** / named serial **none** matches live code.

Name: **no remaining REP leftover.**  
Contract, brief, and inventory agree. Contract wins if they fork; they do not fork.

NPC patrols are not Freehold-only. Spawn uses `def.faction` (plus optional neighbor). Leave and covering use the system flag. Patrol **job** still writes Freehold Compact +5; Digit 9 names Compact-only. That is skippable unique-four honesty, not a police hole.

`docs/RepStandingDesign.md` “Patrol remains Freehold until a named serial” is stale vs police spawn. The pack cites it and does not edit it.

## What I tested

1. Graph resolve (`graph-engineering__graph_resolve`): `execute_workflows` / `codex/workflow-cross-agent-coordination`. Resolution id `r-mt91di01-a0f1ef3e`. Did not `graph_approve`. Did not `graph_propose`. Read-only verify. No cross-agent control.
2. Read brief `docs/Rep06RemainingRepDesign.md`, inventory `out/w122/represt/current-rep-remaining-inventory.md`, and `out/w122/represt/shared-contract.md`. All three say leftover **CONSUME**, serial **none**.
3. Read notes, code-review, security-review, ui-audit. All keep CONSUME / no PR1.
4. Git write-set: worker pack is untracked markdown only. No `src/`. No `scripts/`.
5. Spot-checked live cites in `src/` (file reads; no Vite). Did not run `npm run test:boot`. Did not run formatters or linters.
6. Confirmed honor files and sibling leftover trees are not in this worker write-set.

## Live cite checks (code wins)

| Claim | Live | Result |
|---|---|---|
| Digit 9 Standing | `station.js` `DOCK_KEY_SERVICES` 188 `epics`; labels 6034 Digit 9 Standing / Digit 0 Shipyard; `renderEpics` 5887–5945 | LIVE |
| Digit 9 leave / covering / jump copy | `standingLiveNotes` 1181 `Leave this space.`; 1184 `Patrol covering.`; 1191 `No passage.` | LIVE |
| Climb copy | `standingRemedialNotes` 1195–1203; `Patrol adds +${PATROL_REP} ${freehold} only.` 1202 | LIVE |
| Kill −5 | `kill-standing.js` 6 `KILL_STANDING_DELTA = -5`; `npc.js` 2326 `applyPlayerKillStanding` | LIVE |
| Restitution 1200 | `restitution.js` 5 `RESTITUTION_UU = 1200`; 62 `bag[faction] = 0` | LIVE |
| Leave | `police-leave.js` 5 `Leave this space.`; 8 radius 300; 18–27 `systemFactionOf`; 47–56 `isLocalSystemPatrol`; 117 band `< 0 && > -10`; `npc.js` 2484 | LIVE |
| Hail leave card | `hail.js` `INTENT_ORDER` 58 — no leave verb | none |
| Covering | `police-cover.js` 6 `Patrol covering.`; 9 min 10; `npc.js` 1372, 1827, 2485 | LIVE |
| Inbound refuse | `jump.js` 7 `No passage.`; 10 `< -25`; `beginJump` 104–111; `dock()` 6100 sets `flags.docked`, no standing gate | LIVE |
| `standingRead` | `data-trade.js` 73–81 miss / reserved / non-finite → 0 | LIVE |
| RANK_LADDER | `state.js` 714–721 Sworn 50 … Marked −1000 | LIVE |
| Persist | `save.js` 77–78 `'reputation'` on `WORLD_FIELDS`; 77–101 no wanted / crimeScore; 919–940 `sanitizeReputation` | LIVE |
| Patrol spawn | `world.js` 327 `otherFaction` from `gates[0].to`; 374–385 `faction: i === 0 ? def.faction : otherFaction` | **not Freehold-only** |
| Hunt hull-local | `npc.js` `standingOf` 1138–1142 `record.faction ?? state.faction`; `mayHuntPlayer` 1186 | LIVE |
| Patrol job Compact +5 | `station.js` 206 `PATROL_REP = 5`; 2111–2114 unique `patrol-lane`; 3852 `reputation.freehold += PATROL_REP`; Digit 9 1156 / 1202 | LIVE Compact writer |
| Spy / war dest −2 | `station.js` 233–234; `applySpyExpose` 3024–3028; ticks 4168 / 4181; `warPayComplete` 3583 | LIVE |
| `innerHTML` in station | grep 0; `h()` `textContent` 4464–4468 | none |
| Empty hub | `hud.css` 184–189 80 px | LIVE |
| Esc restitution | `station.js` 6186 `epics` + `cancelRestitutionPending` | LIVE |
| WAVE111 honesty | `scripts/boot-test.mjs` 22969 `/Freehold Compact only/` | pin present (read only) |
| WAVE104 leave line | `scripts/boot-test.mjs` 22240 `POLICE_LEAVE_LINE = 'Leave this space.'` | pin present (read only) |
| `src/game/reputation.js` | absent | honor |
| Spawn `faction: 'freehold'` hard-code | `world.js` grep 0 | closed |

Example REAL hole (patrol hard-coded Freehold in another faction’s space) is **false** vs spawn / leave / covering / hunt.

CONSUME does **not** hide a real police leftover. Compact job +5 is skippable unique-four honesty, not PR1.

## Write-set (markdown only)

See `out/w122/represt/verify/write-set.txt`. Git untracked only for this leftover:

- `docs/Rep06RemainingRepDesign.md`
- `out/w122/represt/code-review.md`
- `out/w122/represt/current-rep-remaining-inventory.md`
- `out/w122/represt/notes.md`
- `out/w122/represt/security-review.md`
- `out/w122/represt/shared-contract.md`
- `out/w122/represt/ui-audit.md`

Not in worker write-set (confirmed):

- `src/**`
- `scripts/**`
- `docs/PLAYER-EXPERIENCE-WISHLIST.md`
- `PROGRESS.md`
- `docs/RepStandingDesign.md`
- `docs/Rep03RemedialDesign.md`
- `docs/Rep04AttributionDesign.md`
- `docs/Rep05ConsequencesDesign.md`
- `docs/OwnerDecisions*.md`
- `out/w122/navrest/**` (sibling untracked; other leftover worker)
- `out/w122/tgtrest/**` (sibling untracked; other leftover worker)

`git diff --name-only` on honor `src/` / `scripts/` / those docs is empty.

## Bugs found

None.

## Environmental issues

None. Domain is data. No Vite. No Chrome. No `npm run test:boot`.

## Processes

Started none. Killed none.

## Evidence

- This file: `out/w122/represt/verify/report.md`
- Write-set: `out/w122/represt/verify/write-set.txt`
- Graph: `r-mt91di01-a0f1ef3e` execute_workflows
- Brief Status row: leftover **CONSUME**; named serial **none**
- Contract header: leftover **CONSUME**; named serial **none** (wins on fork)
- Inventory §0 / §14: **CONSUME**; serial **none**
- Live spawn: `world.js` 379 `def.faction` / `otherFaction`
