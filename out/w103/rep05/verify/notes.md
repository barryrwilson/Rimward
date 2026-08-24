# Wave 103 REP-05 remaining consequences — verifier notes

Domain: data (markdown-only). No servers. No `src/` edits by this verifier.

Graph note: `graph_resolve` matched `codex/workflow-activar-client-brief` (terms `brief`/`pr`, coverage 0.07). That workflow is Activar PR client prep, not WebSim verify. Binding gates on that node are none. This verifier did not call CRM. Assigned WebSim write-set checks ran.

```
## Status
CLEAN

## What I tested
Markdown write-set freeze; contract freeze vs owner deputize; live-code spot-check of inventory/contract cites; serial PR named-only; forbidden-path and OwnerDecisionsWave103 absence; sibling-doc mtimes vs this worker.

## Bugs found
None. Freeze holds. Deputize matches the owner remaining-consequences request. Inventory line cites that were opened match live code. Serial PR plan is named only. No `src/` or `scripts/` in this write-set.

## Environmental issues
Working tree is dirty from other waves (`src/`, `scripts/boot-test.mjs`, `PROGRESS.md`, wishlist, ship assets). Those mtimes are earlier than this worker’s files. This worker is not the author of those diffs. `out/w103/rep05/designer-audit.md` exists (2026-08-23 21:30) after this pack (21:10–21:14) and names `[designer]`; it is a sibling, not this worker’s listed write-set.

## Evidence
See body below (write-set, freeze, cite table, nits).
```

---

## 1. Write-set

Parent-listed worker files (all markdown, present):

| Path | Present | This-wave `src/`? |
|---|---|---|
| `docs/Rep05ConsequencesDesign.md` | yes (untracked) | no |
| `out/w103/rep05/current-rep05-inventory.md` | yes | no |
| `out/w103/rep05/shared-contract.md` | yes | no |
| `out/w103/rep05/security-review.md` | yes | no |
| `out/w103/rep05/code-review.md` | yes | no |
| `out/w103/rep05/ui-audit.md` | yes | no |

- `docs/OwnerDecisionsWave103.md`: **ABSENT**.
- Pack text forbids `src/`, `scripts/`, wishlist, `PROGRESS.md`, `docs/RepStandingDesign.md`, sibling Tgt/Hud/Msn/Bio packs, and OwnerDecisions*.
- Forbidden paths’ LastWriteTime is **before** this pack (PROGRESS/wishlist 20:30; `RepStandingDesign.md` 01:26). This worker did not edit them.
- No Wave 103 REP-05 strings in those forbidden files from this worker.

## 2. Contract freeze

`out/w103/rep05/shared-contract.md` is merge law. Brief defers to it.

| Freeze | Where | Result |
|---|---|---|
| Digit 0 shipyard | contract §0.3; inventory §3; `station.js` 185 last row + 6023–6025 | Pass |
| Digit 8/9 launch/epics; outfit papers | §0.3; `station.js` 185, 6027–6028, 6100–6102 | Pass |
| Empty 80 px hub; no pip/lock disc | §0.2; `hud.css` 184–191; `hud.js` 709–712 RANGE | Pass |
| No `innerHTML` | §0.4; grep `src/` innerHTML = `modelsbrowser.js` only | Pass |
| No new `WORLD_FIELDS` / wanted | §0.7; `save.js` 76–101 `'reputation'`; `wanted`/`crimeScore` in `src/` = organic.js comment only | Pass |
| No invented UU / standing deltas | §0.6, §9 copy live 10 / `< −25` / 300 / 45 / 1200 / −5 / 40 | Pass |
| Police leave **not** redesigned | §0.9; copy stays `Leave this space.` | Pass |
| Dock open | §0.12; `dock()` 5951–5978 no standing; approach 6181 | Pass |
| `state.js` READ-ONLY this wave | §0.6 | Pass (design only) |

Deputize vs owner request:

| Owner default | Contract | Brief |
|---|---|---|
| Local-system `patrol` only | §1.1 copy police-leave allowlist | Overview + §4 |
| Standing ≥ 10 Known | §1.2 `standingRead` ≥ 10 | Overview |
| Fire vs pirate/ace player fight | §1.3 `lastAttackerOf` or current lock | §4 beats |
| Never vsPlayer | §1.3 | Goals / acceptance |
| Inbound dest standing `< −25` | §2.1; −25 Suspect does not lock | §5; acceptance −26 refuses, −25 does not |
| Dock stays open | §2.1 / §0.12 | Player outcome |
| Unknowables / hollow / independent fail-closed | §0.14 covering skip; §2.2 no inbound lock | Overview + player outcome |
| `Patrol covering.` / `No passage.` via `commLine` | §1.4, §2.3, §4 | Overview + §4–§5 |

Police leave stays live: `POLICE_LEAVE_LINE = 'Leave this space.'`; band `standing < 0 && standing > -10`; 300 u; once/visit; `npc.js` 2378 `tickPoliceLeave(ctx)`.

Pirate-work hunt stays ungated law (`tickPatrolJob` + `findPirateWork`). Covering is additive Known+.

Serial PR plan named only: PR1 covering, PR2 inbound jump, PR3 Digit 9 copy after sim, PR4 boot pins. Wave 103 does not land them.

## 3. Inventory cite spot-check (live code)

Opened the cited files. **Code wins.** Stale `RepStandingDesign.md` police-defer is correctly treated as wrong.

| Claim | Live | Result |
|---|---|---|
| `RANK_LADDER` 714–721; `rankFor` 722–725 | `state.js` six rungs; Known min 10; Marked min −1000 | OK |
| `< −25` is Marked exclusive | `rankFor(-25)` = Suspect; `rankFor(-26)` = Marked | OK |
| Default bag four keys `ctx.js` 153 | `freehold/redledger/veridian/hollow` | OK |
| `FACTIONS` 591–606 | includes independent, hollow, beautiful, unknowables | OK |
| `WORLD_FIELDS` 76–101; no wanted | `'reputation'` line 77; list ends `'nav'` | OK |
| `sanitizeReputation` 919–938; call 1135 | matches | OK |
| `standingRead` 73–81 miss/reserved/non-finite → 0 | matches | OK |
| `U.DOCK_RANGE` 45 `state.js` 30 | matches | OK |
| `tributeOpensAt` 40 `state.js` 326 | matches | OK |
| Police leave LIVE | `police-leave.js` full; bind `npc.js` 28 import, 2378 tick | OK |
| Leave copy / 300 / band | lines 5, 8, 116–117 | OK |
| Who = local patrol; blocked beautiful/unknowables | 10, 46–56, 87–97, 114 | OK |
| `HOSTILE_STANDING` −10 `npc.js` 96 | matches | OK |
| `standingOf` 1044–1048 no `hasOwn` | `table[fac]` | OK |
| `mayHuntPlayer` 1088–1096 | patrol ≤ −10 or scratched | OK |
| `hunterHasWork` / `findPirateWork` 1149–1199 | pirate/ace vs civilian or player; law-zone skip | OK |
| `tickPatrolJob` 1274–1280 ungated hunt | `mayHuntPlayer \|\| findPirateWork` | OK |
| Law zone also 1650+ | distance `>= LAW_ZONE_RADIUS` before intent | OK |
| Hail no leave card `hail.js` 48 | `INTENT_ORDER` has no leave verb | OK |
| Digit map `station.js` 185 | market…launch, epics, shipyard | OK |
| Digit 0/8/9 | 6023–6025 Digit 0 last; Digit 8/9 via `d-1` | OK |
| Outfit 8/9 papers 6100–6102 | `armOutfitPapers` | OK |
| `standingLiveNotes` 1160–1179 | hunt/yards/min-rep/locker/graft/restitution; **no** leave/allies/locks | OK |
| Stale Digit comment 1620–1621 | “Digit 8 Launch; Digit 9 Standing” vs Digit 0 shipyard | OK (documented) |
| Locker `RESTRICTED_REP_GATE` −25; fear 40 or freehold `< −25` | 187, 2055–2058, 4497–4500 | OK |
| Archive `No sale.` 1192–1194, 1414–1416 | `archiveHostile` + `h(..., 'No sale.')` | OK |
| Unique chains Known `jobs-chains.js` 84–86 | `tier >= 1`; station 3469, 4954 | OK |
| Restitution 1200 `restitution.js` 5, 45–66 | `RESTITUTION_UU`; set key to 0 | OK |
| Kill −5 `kill-standing.js` 6 | skip pirate/ace (`skipHuntVictim`); independent (`victimFaction`); reserved | OK |
| Dock no standing 5951–5978, 6181 | matches | OK |
| Jump no standing `jump.js` 70–76, 152–154 | `beginJump` if `SYSTEMS[to]`; consume `jumpRequested` | OK |
| `gate.js` 648–649 no standing | grep standing/reputation in `gate.js` = 0; emit `{ to }` | OK |
| Chart hover rank `chart-hover.js` 28–66 | `rankName`; independent political | OK |
| Chart `blocked` `galaxychart.js` 537 | NAV plot unreachable | OK |
| `MIN_REP` ace 10 / frigate 25 `shipyard.js` 64–71, hostile 219 | matches | OK |
| Desk `'No sale.'` `shipyard-desk.js` 36 | `reputation: 'No sale.'` | OK |
| Living train Beautiful `hangar.js` 809–810 | `rep < 0 \|\| rep < minRepFor` | OK |
| Graft cap −10 `hangar.js` 123–166 | `HOSTILE_STANDING` + `applyAbominationStanding` 151–167 | OK (span slightly short; function is 151–167) |
| Hub 80 px; RANGE child | `hud.css` 184–191; `hud.js` 709–712 | OK |
| HUD reads `hullKind`, no write | `hudFamily` 80–87; caches `last.kind`; no `hullKind =` | OK |
| `commLine` toast `textContent` | 494–502, 1130 | OK |
| `h()` / `el()` textContent | `station.js` 4350–4355; `hud.js` 244–248 | OK |
| Wishlist REP-02 672–681 | allies + restricted-system/station access | OK (read only) |
| Autosave `rimward-save-v1` | `save.js` 66 | OK |
| `jumpRequested` listed `ctx.js` 234 | matches | OK |
| Jump HUD only when `jumping` `hud.js` 1188–1202 | matches (PR2 must not set `jumping`) | OK |

## 4. Cite nits (not freeze breaks)

1. Contract §5 and security review say `jump.js` 71 is already `Object.hasOwn(SYSTEMS, to)`. Live line 71 is `if (!SYSTEMS[to]) return;`. Inventory wording (`if SYSTEMS[to]`) is the accurate one. Later PR2 should still use `hasOwn`.
2. Graft inventory span `hangar.js` 123–166` vs live `applyAbominationStanding` 151–167.
3. Inventory “KeyG / dockPressed” for jump: `gate.js` 648 emits on `dockPressed` or autopilot; KeyG at 580 cycles hub routes. Jump still uses the dock/jump edge. Acceptable shorthand.

## 5. Serial / no src

- Contract §0.1 and §8: named PR1–PR4; “Do not schedule or land these PRs in `src/` in this worker.”
- Brief Status: “markdown only. Later serials land covering + inbound jump refuse.”
- Boot pins called out for a later `scripts/boot-test.mjs` — not this worker.
- This verifier did not start Vite or any server.

## 6. Verdict

**CLEAN.** Remaining REP-02 freeze is Known+ local patrol covering (`Patrol covering.`) and inbound Marked `< −25` refuse (`No passage.`), with police leave live and untouched, dock open, no wanted field, Digit 0/empty hub/`innerHTML` frozen, Unknowables/hollow/independent fail-closed.
