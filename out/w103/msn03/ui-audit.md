# UI Audit: MSN-03 remaining unique DONE rows brief (Wave 103)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec** for Digit 2 Jobs hide vs empty state, not a live chrome change. Picture is: unique `done` cards leave the board the same way chain `done` already leaves; persist rows stay; no memorial pane; no new Digit; no HUD quest widget. Empty-state copy is **not** added in first impl because home docks still sync family/overlay cards.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` and designer checklist locally. Did **not** spawn `[designer]`.

### What's done well

- Reuses live `boardJobs` filter (`station.js` 3603–3628) instead of a second pane.
- Chain hide already exists (`station.js` 3616`); unique hide is the same pattern (skip, do not splice).
- Digit 2 stays **Jobs board** (`DOCK_KEY_SERVICES` + label `station.js` 185, 5886). Digit 0 stays Shipyard. Digit 9 stays Standing / epics — not a quest log.
- Cards stay `h()` + `textContent` + `btn()` (`station.js` 4350–4361, 5029–5305). Keyboard Accept stays Digit 1–9 on **offered** rows (6082–6084).
- Color is never the only DONE cue today (`job-state job-done` text `'DONE'` at 5303). After hide, that line simply does not paint for unique four.
- HUD-01 80 px hub stays empty (`hud.css` 184–189). No quest tape on `.rw-reticle`.
- `reducedMotion`: no new animation specified.
- uniqueRetry mouse Accept on DONE haul/ferry is inventoried; hide removes that control without a new confirm dialog.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: No dedicated empty-state string after unique DONE hide

**Location:** `renderJobs` `station.js` 5009–5027; `boardJobs.forEach` no-ops on `[]`; contract §0.1, §3.

**Issue:** Live board almost never empty: unique four plus family sync plus overlays. After all four unique are `done` and hidden, home docks still show mining/trade/hunt/passenger/explore/spy/war/chain/overlays. A foreign-empty hypothetical (no offered families, no overlays, all unique done) would show only the header `JOBS BOARD — … postings` and the standing note (`5013–5014`). That is a sparse board, not a crash.

**Fix:** First impl adds **no** “No live postings.” / memorial copy. If playtest finds a truly empty dock, add one `screen-note` via `h()` `textContent`. Do not add a DONE list.

**Status:** deputize documented; not a Blocker.

#### 🟡 Minor: uniqueRetry Accept on DONE is mouse-only today; hide also removes keyboard gap

**Location:** uniqueRetry `station.js` 5206–5208`; Digit accept requires `offered` (6082–6084).

**Issue:** DONE haul/ferry show a mouse Accept but Digit 1–9 ignore them. That is an a11y split on the live leftover. Hide removes the card for mouse and keyboard together, so the split goes away.

**Fix:** None this serial. Do not add a Digit binding for DONE retry.

**Status:** hide is the a11y-even outcome.

#### 💡 Suggestion: Digit 1–9 will bind earlier live family cards once unique DONE drop off the list

**Location:** `boardJobs` array order; `station.js` 6082–6084.

**Issue:** Players who memorized “Digit 5 is mining” after four unique cards may find Digit 1 is mining instead.

**Fix:** Accept. Jobs already overflow past 9; mouse Accept is the overflow path. Do not freeze Digit indices to unique ids.

**Status:** expected.

### Jobs copy pin (Wave 103 deputize)

| Surface | Authored text | After hide |
|---|---|---|
| Pane header | `JOBS BOARD — ${station} postings` | Unchanged |
| Note | Mining/hunt/… + patrol Freehold line | Unchanged |
| Unique offered | live `job.title` / quotes | Unchanged |
| Unique DONE | `DONE` (`station.js` 5303) | **Not painted** (card skipped) |
| Chain DONE | already skipped | Unchanged |
| Memorial | none | **none** |
| Empty line | none | **none** (first impl) |

**Forbidden copy:** “Quest log”; SKU names on unique cards; interpolating `recordId` / clue ids; a second Standing unique list on Digit 9; `innerHTML` titles.

Legend stays: `Esc back · Esc again / B launch` on level 2 (`station.js` 5915). Root menu stays `1-9, 0 select service · Esc/B launch` (5898).

### Hub / Digit freeze (Blocker if violated)

| Surface | Brief | Audit |
|---|---|---|
| 80 px `.rw-reticle` | No quest child | Pass |
| Digit 2 | Jobs | Pass |
| Digit 0 | Shipyard | Pass |
| Digit 8/9 | launch / epics (Standing) | Pass |
| New Digit / memorial pane | Forbidden | Pass |
| `innerHTML` | Forbidden | Pass |
| Persist delete as hide | Forbidden | Pass |
| HUD writes `hullKind` | Forbidden | Pass |
| Unique dart/auto grant | Forbidden | Pass |

### States checklist (later PR1)

| State | Spec |
|---|---|
| Unique offered | Card + Accept as live |
| Unique accepted | Card + ACCEPTED line as live |
| Unique done | **Hidden**; row remains in `world.jobs` |
| All four unique done | Board = families/overlays/chains only |
| `boardJobs.length === 0` | Header + notes only; no memorial; playtest may add one note later |
| Loading / error | N/A (sync is render-time; fail-closed already) |
| Focus / hover | Existing `btn()`; no new widgets |
