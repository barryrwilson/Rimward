# Designer audit: Wave 103 MSN-03 unique DONE Jobs-board hide (picture)

| Field | Value |
|---|---|
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-23 |
| **Persona** | `orchestrator/assets/designer-persona.md` |
| **Checklist** | `orchestrator/references/ui-audit.md` |
| **Scope** | Markdown-only Jobs hide picture: `docs/Msn03UniqueDoneDesign.md`, merge law `out/w103/msn03/shared-contract.md`, inventory `out/w103/msn03/current-msn03-unique-inventory.md`, worker `out/w103/msn03/ui-audit.md`. Live occupancy sampled from `src/systems/station.js`, `src/game/save.js`, `src/ui/hud.css`, `src/systems/hud.js` (read only). |
| **Not in scope** | Product `src/` edits, Vite, Playwright, sibling HUD-03 / REP-05 / TGT / BIO / NAV / SHP / HUD-02 trees, wishlist, `PROGRESS.md`, `docs/OwnerDecisions*.md` |
| **Wave** | 103 design. Wave 103 does not ship Jobs bindings. Findings are freeze vs live occupancy. |
| **Graph** | `graph_resolve` bound `claude/workflow-code-review` (generic review match). Owner already named this scratch path and forbade Vite / product edits. This pass stays a local Jobs-brief audit. |
| **Verdict** | **CLEAN** — no Blocker, no Major |

Merge law: if the brief and the contract disagree, the contract wins (`out/w103/msn03/shared-contract.md` header). This pass is independent of worker `out/w103/msn03/ui-audit.md`. It does not upgrade that file.

---

## UI Audit: unique DONE hide on Digit 2 Jobs (frozen picture)

### Summary

The picture hides the exact unique four (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`) when `state === 'done'`, inside the live `boardJobs` filter. Persist rows stay. There is no memorial pane, no new Digit, no HUD quest widget. Unique `offered` / `accepted` cards stay. Chain `done` hide stays. Wave 103 ships no chrome.

### Freeze checklist (must not reopen)

| Check | Result | Evidence |
|---|---|---|
| Digit 2 Jobs hide ≠ persist delete | **Pass** | Hide is a `boardJobs` skip of exact four ids + `done` (`docs/Msn03UniqueDoneDesign.md:154–175`; `out/w103/msn03/shared-contract.md:19, 60–68, 75–86`). `completeJob` already stamps `done` and does not splice (`src/systems/station.js:3707–3720`). Sanitize never drops `uniqueJobId` (`src/game/save.js:289–291, 806–831`). `ensureJobs` reseeds only when `jobs.length === 0` (`station.js:2109–2112`). Splice / persist delete would re-post offered uniques. |
| No memorial pane / no “Completed contracts” list | **Pass** | Deputize: hide the same way chain `done` is hidden; do not add a memorial pane or Digit (`Msn03UniqueDoneDesign.md:39, 119–120, 194`; `shared-contract.md:15, 32, 38, 103`). Authored empty line is **out** unless playtest proves `boardJobs.length === 0` (`shared-contract.md:40, 103`). |
| No Digit steal | **Pass** | Digit **2** = Jobs (`DOCK_KEY_SERVICES[1]`, `station.js:185`; labels `station.js:5886`; Digit map `station.js:6021–6028`). Digit **0** = shipyard. Digit **8** = launch. Digit **9** = epics / Standing (`station.js:185, 5886, 5845–5856`). Contract forbids a memorial Digit (`shared-contract.md:15`). |
| Empty-state honesty | **Pass** (Minor residual) | Live `renderJobs` always paints the header and notes, then `forEach` no-ops on `[]` (`station.js:5009–5027`). First impl adds **no** memorial copy and **no** “No live postings.” string (`Msn03UniqueDoneDesign.md:195`; `shared-contract.md:40, 103`). Home docks still sync families / overlays / chains (`station.js:5015–5025`). A foreign-empty hypothetical is sparse header + notes, not a fake DONE list. |
| HUD-01 80 px hub stays empty | **Pass** | Live `.rw-reticle` is 80×80 (`src/ui/hud.css:184–189`). Brief + contract: no quest widget on aim glass (`Msn03UniqueDoneDesign.md:10, 36, 99, 224, 243, 275`; `shared-contract.md:16, 101`). HUD may **read** `player.hullKind`; never writes it (`src/systems/hud.js:80–87`; `shared-contract.md:23`). |
| Unique offered / accepted stay visible | **Pass** | Skip is `state === 'done'` and exact four ids only (`shared-contract.md:60–69`; `Msn03UniqueDoneDesign.md:167–172`). Overlay `bounty-pirate-*` DONE, families, and live chain steps stay. |
| Chain `done` hide stays | **Pass** | Live skip `kind === 'chain' && state === 'done'` (`station.js:3616`). Unique skip sits **next to** it (`shared-contract.md:69`; `Msn03UniqueDoneDesign.md:156`). |
| `innerHTML` / names | **Pass** | Live `h()` is `textContent` (`station.js:4350–4354`). `btn()` is a `<button type="button">` (`station.js:4357–4361`). Overlay wipe is `overlay.textContent = ''` (`station.js:5872`). Unique titles stay live `job.title` (`station.js:5030`). Contract forbids `innerHTML` (`shared-contract.md:21`). |
| Keyboard Accept stays offered-only | **Pass** | Digit 1–9 on Jobs: `job.state === 'offered'` (`station.js:6082–6084`). uniqueRetry is mouse-only today (`station.js:5206–5209`). Hide removes the DONE card for mouse and keyboard together. |
| `reducedMotion` / no new animation | **Pass** | Brief: no extra animation (`Msn03UniqueDoneDesign.md:196`; `shared-contract.md:100`). Hide is a filter skip, not a fade. |
| Color is not the only DONE cue | **Pass** | Live DONE is the word `'DONE'` on `job-state job-done` (`station.js:5303`). After hide, that line does not paint for the unique four. |
| No invented SKU / UU / Digit 9 quest log | **Pass** | Unique rewards stay live integers (`Msn03UniqueDoneDesign.md:69, 199–201`; inventory §3). Unique complete does not call `grantChainSku`. Digit 9 stays Standing. |

### What's done well

- Hide reuses the live `boardJobs` loop (`station.js:3603–3628`) instead of a second pane, a HUD glance, or Digit 9. That is the smallest honest Jobs change.
- Persist-keep is named as the reason hide exists: empty `world.jobs` reseeds four **offered** uniques (`station.js:2109–2112`). Hide ≠ delete is not implied; it is law (`shared-contract.md:19, 83`).
- Chain and unique DONE share one skip pattern. Players already learned “finished chain paper leaves the board.” Unique four match that lesson.
- uniqueRetry is treated as a live leftover, not a silent product delete. Hide makes the mouse Accept unreachable; the `renderJobs` branch stays (`station.js:5206–5209`; `shared-contract.md:39, 98`). WAVE26 still re-offers by assignment (`shared-contract.md:24`).
- Copy freeze is tight. Header `JOBS BOARD — ${station} postings` (`station.js:5010`) and the mining/hunt/… + patrol Freehold note (`station.js:5013–5014`) stay. Forbidden copy includes “Quest log,” SKU names on unique cards, interpolating `recordId`, and a second Standing unique list (`out/w103/msn03/ui-audit.md:67`).
- Keyboard legend stays two-level: root `1-9, 0 select service · Esc/B launch` (`station.js:5898`); level 2 `Esc back · Esc again / B launch` (`station.js:5915`). No new hotkey.
- Notices stay a live region (`station.js:5918–5920`). Hide does not add a toast spam path.
- Fail-closed table blocks the usual cheats: splice, new Digit, memorial, `innerHTML`, new `WORLD_FIELDS`, unique dart/auto (`shared-contract.md:154–164`).

---

### Findings

No 🔴 Blocker. No 🟠 Major. The freeze does **not** reopen hide-as-delete, memorial pane, Digit steal, or HUD-01 hub occupancy.

Closed reopeners (do not treat as open defects):

#### 🔴 Blocker (closed in freeze): Persist delete / splice as “hide”

**Location:** `src/systems/station.js:2109–2112, 3707–3720`; `src/game/save.js:79, 152–157, 806–831`; `out/w103/msn03/shared-contract.md:19, 83`; `docs/Msn03UniqueDoneDesign.md:174–178`  
**Issue:** Splicing unique DONE or dropping the four ids from persist would empty the array after four completes. `ensureJobs` would re-post offered uniques. That is a product smash, not a board tidy.  
**Fix:** Filter in `boardJobs` only. Keep the `done` rows.  
**Status:** addressed in freeze

#### 🟠 Major (closed in freeze): Memorial pane or Digit 9 unique log

**Location:** `docs/Msn03UniqueDoneDesign.md:39, 77, 99`; `out/w103/msn03/shared-contract.md:15, 38, 101`; live Digit 9 `src/systems/station.js:185, 5886`  
**Issue:** A “Completed contracts” pane would steal Digit 9 Standing or invent a Digit. That is Digit theft, not empty-state honesty.  
**Fix:** Unique DONE vanish from Digit 2. No second list.  
**Status:** addressed in freeze

#### 🟠 Major (closed in freeze): HUD quest widget / Digit steal

**Location:** hub `src/ui/hud.css:184–189`; `src/systems/hud.js:80–87`; `out/w103/msn03/shared-contract.md:15–16, 23`; `docs/Msn03UniqueDoneDesign.md:36, 224`  
**Issue:** A quest tape on `.rw-reticle`, a new Digit, or HUD writes of `hullKind` would smash HUD-01 and dock keys.  
**Fix:** Stay inside `renderJobs` / `boardJobs`. Hub stays empty. Digit 2/0/8/9 stay.  
**Status:** addressed in freeze

#### 🟡 Minor: No dedicated empty-state string after unique DONE hide

**Severity:** Minor  
**Location:** `src/systems/station.js:5009–5027`; `out/w103/msn03/shared-contract.md:40, 103`; `docs/Msn03UniqueDoneDesign.md:195`; worker `out/w103/msn03/ui-audit.md:23–32`  
**Issue:** After the unique four are `done` and skipped, a dock with no offered families, no overlays, no accepted rows, and no live chain steps would show only `JOBS BOARD — … postings` plus the standing note. The word “postings” then names an empty list. That is sparse, not a crash, and not a fake memorial. Home docks still fill from family/overlay/chain sync (`station.js:5015–5025`), so this is a rare foreign-empty hypothetical.  
**Fix:** First impl adds **no** “No live postings.” / memorial copy (contract wins). If playtest finds a truly empty dock, add one `screen-note` via `h()` `textContent`. Do not add a DONE list. Do not put that note on the 80 px hub.  
**Status:** deputize documented; not a Blocker. Empty-state honesty here means **no invented completed list**, not a mandatory empty string this serial.

#### 🟡 Minor: uniqueRetry Accept on DONE is mouse-only today; hide also removes that split

**Severity:** Minor  
**Location:** uniqueRetry `src/systems/station.js:5206–5209`; ferry DONE reset `station.js:4687–4692`; Digit accept `station.js:6082–6084`; `out/w103/msn03/shared-contract.md:39, 107–113`  
**Issue:** Live haul/ferry DONE cards show mouse Accept. Digit 1–9 ignore them (`done` ≠ `offered`). That is an a11y split on the leftover. Hide takes the card off the board, so mouse and keyboard match. Players who used mouse retry lose that path without a confirm dialog.  
**Fix:** None this serial. Do not add a Digit binding for DONE retry. Do not rewrite `acceptJob`. Owner may restore retry after playtest (`shared-contract.md:46, 113`).  
**Status:** hide is the a11y-even outcome; uniqueRetry source stays

#### 💡 Suggestion: Digit 1–9 will bind earlier live family cards once unique DONE drop off the list

**Severity:** Suggestion  
**Location:** `boardJobs` order `src/systems/station.js:3603–3628`; Digit accept `station.js:6082–6084`  
**Issue:** Players who memorized “Digit 5 is mining” after four unique cards may find Digit 1 is mining instead.  
**Fix:** Accept. Jobs already overflow past 9; mouse Accept is the overflow path (`Accept (${i + 1})` at `station.js:5209`). Do not freeze Digit indices to unique ids.  
**Status:** expected

#### 💡 Suggestion: Later empty-note, if any, must stay one `screen-note`

**Severity:** Suggestion  
**Location:** `src/systems/station.js:5013–5014` (existing `screen-note`); contract `out/w103/msn03/shared-contract.md:103`  
**Issue:** A later “No live postings.” line could drift into memorial copy or a HUD toast.  
**Fix:** If playtest asks, one `h('div', 'screen-note', panel, …)` under the existing header. `textContent` only. No innerHTML. No Digit 9. No hub child.  
**Status:** accepted — out of first impl

---

### Jobs copy pin (Wave 103 deputize)

| Surface | Authored text | After hide |
|---|---|---|
| Pane header | `JOBS BOARD — ${station} postings` (`station.js:5010`) | Unchanged |
| Note | Mining/hunt/… + patrol Freehold line (`station.js:5013–5014`) | Unchanged |
| Unique offered / accepted | live `job.title` / quotes / Accept | Unchanged |
| Unique DONE | `DONE` (`station.js:5303`) | **Not painted** (card skipped) |
| Chain DONE | already skipped (`station.js:3616`) | Unchanged |
| Memorial | none | **none** |
| Empty line | none | **none** (first impl) |
| Legend L1 | `1-9, 0 select service · Esc/B launch` (`station.js:5898`) | Unchanged |
| Legend L2 | `Esc back · Esc again / B launch` (`station.js:5915`) | Unchanged |

**Forbidden copy:** “Quest log”; SKU names on unique cards; interpolating `recordId` / clue ids; a second Standing unique list on Digit 9; `innerHTML` titles; “Completed contracts.”

---

### Hub / Digit freeze (Blocker if violated later)

| Surface | Brief | Audit |
|---|---|---|
| 80 px `.rw-reticle` | No quest child | **Pass** (`hud.css:184–189`) |
| Digit 2 | Jobs | **Pass** (`station.js:185, 5886, 6021–6028`) |
| Digit 0 | Shipyard | **Pass** |
| Digit 8/9 | launch / epics (Standing) | **Pass** |
| New Digit / memorial pane | Forbidden | **Pass** |
| `innerHTML` | Forbidden | **Pass** (`station.js:4350–4354, 5872`) |
| Persist delete as hide | Forbidden | **Pass** |
| HUD writes `hullKind` | Forbidden | **Pass** (`hud.js:80–87`) |
| Unique dart/auto grant | Forbidden | **Pass** |

---

### States checklist (later PR1; freeze only)

| State | Spec |
|---|---|
| Unique offered | Card + Accept as live |
| Unique accepted | Card + ACCEPTED line as live |
| Unique done | **Hidden**; row remains in `world.jobs` |
| All four unique done | Board = families / overlays / live chains only |
| `boardJobs.length === 0` | Header + notes only; no memorial; playtest may add one note later |
| Loading / error | N/A (sync is render-time; fail-closed already) |
| Focus / hover | Existing `btn()`; no new widgets |
| uniqueRetry on DONE haul/ferry | Unreachable because the card is not on the board |
| WAVE26 ferry re-offered | Still visible (`state = 'offered'` is not hidden) |

---

### HUD-01 / a11y checklist (later impl; freeze only)

- [x] Freeze: no widget in the 80 px hub (`hud.css:184–189`)
- [x] Freeze: no quest tape on `.rw-reticle`
- [x] Freeze: Digit 2 Jobs; Digit 0 shipyard; Digit 8/9 launch + Standing
- [x] Freeze: no memorial Digit
- [x] Freeze: hide ≠ persist delete
- [x] Freeze: unique titles stay `textContent`
- [x] Freeze: no new `@keyframes`; no hide animation
- [x] Keyboard: Digit 1–9 Accept stays `offered`; do not bind DONE retry
- [x] Notices stay `aria-live="polite"` (`station.js:5920`)
- [x] Empty-state honesty: no invented completed list; no fake postings

---

### Agreement with prior `ui-audit.md`

Worker `out/w103/msn03/ui-audit.md` already called this picture **no Blocker / no Major**. This designer pass agrees. The empty-board string stays a documented Minor, not a defect to “fix” with a memorial pane. uniqueRetry hide is the a11y-even outcome. Digit-index shift after unique DONE leave is expected overflow behavior.

### Pass verdict

Wave 103 markdown freeze is **CLEAN** for UI/UX. Later impl must skip unique four + `done` in `boardJobs`, keep those rows in `world.jobs`, leave Digit 2/0/8/9 and the 80 px hub, paint no memorial list, add no empty-state string until playtest, and leave uniqueRetry source in place.
