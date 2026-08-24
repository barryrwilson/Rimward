# UI Audit: Wave 104 PR1 unique DONE hide (Jobs pane)

**Reviewer:** `[designer]` (UI/UX auditor). Review only. Product `src/` not edited.  
**Worker file:** `out/w104/msn03/ui-audit.md` left untouched.  
**Refs:** `out/w103/msn03/shared-contract.md` §3 UI; `docs/Msn03UniqueDoneDesign.md` §6 UI; `src/systems/station.js` `boardJobs` / `renderJobs`.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`, `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.

### Summary

PR1 hides unique-four `done` cards in `boardJobs` only. Digit 2 still opens the same Jobs pane. Offered and accepted unique cards still paint. uniqueRetry Accept stays in source but cannot reach the board. No memorial pane, no new Digit, no HUD quest widget, no invented empty-state string, no extra animation, no `innerHTML`. No Blocker or Major findings.

### What's done well

- Hide reuses the live chain skip pattern next to `station.js:3616`. Filter skip, not a second pane.
- Exact four ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`) plus `state === 'done'`. Offered / accepted unique cards still flow to `renderJobs` (`5032`).
- Header stays `JOBS BOARD — ${currentDef.station.name} postings` (`5015`). Standing note (`5018–5019`) unchanged.
- Ace hunt line still paints for live ace (`5207–5209`) because that branch requires `state !== 'done'`.
- Cards still use `h()` + `textContent` (`4355–4358`) and `btn()` (`4362–4366`). `overlay.textContent = ''` wipe stays (`5877`). Grep: no `innerHTML` in `station.js`.
- Digit freeze: `DOCK_KEY_SERVICES` is still `market, jobs, … launch, epics, shipyard` (`185`). Level-1 Digit 2 → Jobs, Digit 0 → last service shipyard (`6028–6033`). Menu labels still Jobs board / Launch / Standing / Shipyard (`5891`).
- Digit 9 `renderEpics` is still `STANDING` (`5758–5761`). No unique memorial list.
- HUD-01 hub stays 80×80 `.rw-reticle` (`src/ui/hud.css:184–189`). `hud.js` does not mention unique four. `hudFamily` still only **reads** `player.hullKind` (`hud.js:80–87`).
- Keyboard Accept on Jobs still requires `job.state === 'offered'` (`6087–6089`). Digit 1–9 cannot uniqueRetry.
- uniqueRetry source remains (`5211–5214`) so WAVE26 offered mutation still sees Accept. Hidden DONE cards never enter the `forEach`, so mouse Accept on DONE is unreachable.
- `reducedMotion`: `renderJobs` adds no animation or transition. Station-mesh `reducedMotion` paths (`6195–6211`) are unrelated to Jobs cards.
- Overlay pirate DONE and family offered rows are not in the unique skip (probe replica). Visual hierarchy of live cards is unchanged.

### Contract §3 checklist

| Check | Result | Cite |
|---|---|---|
| Digit 2 stays Jobs | Pass | `185`, `5891`, `6026–6033` |
| Digit 0 stays shipyard | Pass | last `DOCK_KEY_SERVICES` + Digit 0 |
| Digit 8/9 stay launch / Standing | Pass | `185`, labels Launch / Standing |
| No memorial pane | Pass | no new renderer; Digit 9 still epics |
| No new Digit | Pass | `DOCK_KEY_SERVICES` length 10 |
| No HUD quest widget | Pass | `hud.css` 80 px hub; no unique HUD |
| No empty-state string invented | Pass | `forEach` only; header stays |
| Header `JOBS BOARD — ${station} postings` | Pass | `5015` |
| uniqueRetry Accept unreachable for hidden DONE | Pass | filter before `forEach`; source remains |
| `reducedMotion`: no extra animation | Pass | Jobs path has none |
| `innerHTML` none | Pass | grep 0; `h()` is `textContent` |
| Keyboard Digit 1–9 offered-only | Pass | `6088–6089` |
| Unique offered/accepted still painted | Pass | skip is `done` + exact ids only |
| Chain `done` hide stays | Pass | `3616` then unique skip `3618–3621` |

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 💡 Suggestion: Empty Jobs pane still has no authored empty line

**Location:** `src/systems/station.js:5032` (`boardJobs(...).forEach`); header `5015`; contract §0.1 / §3.

**Issue:** If a dock ever has zero visible cards after unique hide, the pane still shows the header and the standing note. `forEach` on `[]` is a no-op. That is a sparse board, not a crash. Home docks still sync families / overlays, so this path is rare.

**Fix:** Do not add “No live postings.” or “Completed contracts” this wave. Contract forbids an authored empty line unless playtest proves `boardJobs.length === 0`.

**Status:** accepted; not a defect.

#### 💡 Suggestion: uniqueRetry Accept source is dead for hidden DONE cards

**Location:** `src/systems/station.js:5211–5214`; ferry DONE reset `4692–4697`; Digit accept `6087–6089`.

**Issue:** Haul/ferry DONE would still paint mouse Accept if those cards reached `renderJobs`. After hide they do not. Keyboard never bound DONE retry. Hide evened mouse and keyboard. Source must stay for WAVE26 offered re-set.

**Fix:** Leave the branch. Do not add a memorial Accept or a Digit binding for DONE.

**Status:** deputize complete.

#### 💡 Suggestion: Digit 1–9 indices shift after unique DONE leave the list

**Location:** `src/systems/station.js:5101` (`${i + 1}. ${title}`); `6088` (`boardJobs(...)[n - 1]`).

**Issue:** Visible cards renumber from 1. A player who bound Digit 5 to a family card after four unique rows will find that family earlier. Jobs already overflow past 9; mouse Accept is the overflow path.

**Fix:** Accept. Do not freeze Digit indices to unique ids.

**Status:** expected.

### Accessibility / states / theming (scope)

- **Keyboard:** Level-1 Digit 1–9 / 0 unchanged. Level-2 Jobs Digit 1–9 still offered-only. Focus rings and `btn()` type=button unchanged.
- **Names:** Accept still reads `Accept (n)` via `textContent`. Titles stay `textContent` (no stuffed `innerHTML`).
- **States:** Offered → Accept; accepted → `ACCEPTED` line; unique DONE → not painted. Overlay / other DONE can still show `DONE` (`5308`) — out of unique-four scope.
- **Empty / loading / error:** No new strings. Dock first notice on accept stays (`4681`).
- **Theming:** No new CSS. Existing `.job-card` / `.job-done` tokens unused for hidden unique DONE.
- **Responsive:** No new layout. Card list still stacks in `.screen-panel`.
- **Motion:** No extra Jobs animation under `reducedMotion`.

### Verdict

**CLEAN.** Jobs pane hide is playable. No Blocker. No Major.

`[NO BROWSER COVERAGE]` this pass: static copy + `out/w104/msn03/probe.mjs` replica. Live dock not started.
