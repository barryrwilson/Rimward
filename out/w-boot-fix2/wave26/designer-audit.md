# UI Audit: WAVE26 Digit 2 Jobs board (unique ferry Accept / `pays N UU`)

**Reviewer:** `[designer]` (UI/UX auditor). Review only. Product `src/` not edited.  
**Scope:** Jobs overlay only. `src/systems/station.js` `boardJobs`, `renderJobs`, Accept, `reofferFerryHandles`.  
**Refs:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`, `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Worker claim:** unique DONE still hidden; offered unique ferry shows Accept; reward line is `pays <int> UU`.

### Summary

WAVE26 keeps unique-four DONE off the Jobs board and still paints offered unique ferry with a named Accept and a finite `pays N UU` token. Digit 2 still opens Jobs. Digit 0 still opens Shipyard. Digit 8/9 still Launch / Standing. HUD-01 hub is empty of job chrome. `station.js` uses `textContent`, not `innerHTML`. **No Blocker. No Major.**

### What's done well

- Offered and accepted unique four stay on every dock (`boardJobs` keep at `3660–3666`). Unique DONE skip is hide, not splice (`3667–3671`). Persist rows stay.
- Offered unique ferry reaches `renderJobs` (`5103`) and paints `Accept (n)` via `btn()` (`5300–5301`). Button `type` is `button`. Visible name is `Accept (n)`.
- Ferry reward uses `clampJobPay` so the pay token is a non-negative integer (`2232–2236`, `5193–5197`). Line is `Ferry ${FERRY_UNITS} fronted Provisions to ${destName} — pays ${ferryEst} UU, no buy-in`. It contains `pays N UU`.
- Card order is title → detail → reward (`.job-reward`) → Accept. Pay is information. Accept is the action.
- `h()` writes `textContent` (`4422–4427`). Overlay wipe is `overlay.textContent = ''` (`5978`). Grep: no `innerHTML` in `station.js`.
- Digit map frozen: `DOCK_KEY_SERVICES` is still market, jobs, bar, feed, repair, outfitting, people, launch, epics, shipyard (`188`). Hub Digit 2 → Jobs (`6127–6134`). Digit 0 → last service shipyard. Menu labels still Jobs board / Launch / Standing / Shipyard (`5992–5996`).
- Jobs overlay Digit 1–9 still accept only `state === 'offered'` (`6188–6190`). uniqueRetry source remains (`5298–5301`) but hidden DONE never enters the `forEach`, so mouse and keyboard stay even.
- HUD-01: `hud.js` has no jobs / ferry / job-card child. Reticle hub stays 80×80 `.rw-reticle` (`src/ui/hud.css:184–189`). No new HUD hub child.
- Hold-full ferry refuse is a live notice: `No room for the consignment — free ${FERRY_UNITS} units of hold first.` (`4768–4770`). Notice uses `aria-live="polite"` (`6024–6026`).
- Focus / hover: `.screen-btn:focus-visible` outline 2px accent (`screens.css:95–99`). Reward uses `var(--rw-good)` (`screens.css:250–253`). Contrast override already covers `.job-detail` (`screens.css:595–596`).
- `renderJobs` adds no animation. Station `reducedMotion` paths are mesh, not Jobs cards.

### WAVE26 UI checklist

| Check | Result | Cite |
|---|---|---|
| Unique DONE hidden | Pass | `boardJobs` `3667–3671` |
| Offered unique four stay | Pass | `3660–3666` then `renderJobs` `5103` |
| Offered unique ferry shows Accept | Pass | `5300–5301` `Accept (${i + 1})` |
| Reward contains `pays <int> UU` | Pass | `5197` + `clampJobPay` |
| Accept named | Pass | visible `Accept (n)`; native `<button>` |
| Keyboard Digit 2 Jobs (hub) | Pass | `DOCK_KEY_SERVICES[1] === 'jobs'`; `6127–6134` |
| Digit 0 Shipyard | Pass | Digit 0 → last service (`6129–6131`) |
| Digit 8/9 stay | Pass | Launch / Standing; no new Digit |
| No new Digit | Pass | service list length 10 |
| HUD-01 no job child | Pass | `hud.js` no ferry/jobs; 80 px hub |
| No `innerHTML` | Pass | `h()` `textContent`; grep 0 in `station.js` |
| Empty unique DONE | Pass | skip; no memorial pane; no invented empty string |
| Keyboard Accept offered-only | Pass | `6188–6190` |
| uniqueRetry unreachable for hidden DONE | Pass | filter before `forEach` |

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 💡 Suggestion: uniqueRetry Accept source is dead for hidden DONE cards

**Location:** `src/systems/station.js:5298–5301`; ferry DONE reset `4759–4764`; Digit accept `6188–6190`.

**Issue:** Haul/ferry DONE would still paint mouse Accept if those cards reached `renderJobs`. After unique hide they do not. Keyboard never binds DONE retry. Hide evened mouse and keyboard. WAVE26 offered re-set still needs the branch so a live `offered` persist row paints Accept.

**Fix:** Leave the branch. Do not add a memorial Accept or a Digit binding for DONE.

**Status:** accepted; not a defect.

#### 💡 Suggestion: Empty Jobs pane still has no authored empty line

**Location:** `src/systems/station.js:5103` (`boardJobs(...).forEach`); header `5083–5088`.

**Issue:** If a dock ever has zero visible cards after unique hide, the pane still shows `JOBS BOARD — ${station} postings` and the standing notes. `forEach` on `[]` is a no-op. That is a sparse board, not a crash. Home docks still sync families / overlays, so this path is rare.

**Fix:** Do not add “No live postings.” this wave unless playtest proves `boardJobs.length === 0`.

**Status:** accepted; not a defect.

#### 💡 Suggestion: Digit 1–9 indices shift after unique DONE leave the list

**Location:** `src/systems/station.js:5172` (`${i + 1}. ${title}`); `6188–6190` (`boardJobs(...)[n - 1]`).

**Issue:** Visible cards renumber from 1. A player who bound Digit 5 to a family card after four unique rows will find that family earlier. Jobs already overflow past 9; mouse Accept is the overflow path. Digit 2 on the overlay accepts job #2, not the Jobs service (Digit 2 Jobs is hub level 1).

**Fix:** Accept. Do not freeze Digit indices to unique ids. Do not add a new Digit.

**Status:** expected.

#### 💡 Suggestion: Jobs overlay legend does not restated Digit 1–9 Accept

**Location:** `src/systems/station.js:6021` (`Esc back · Esc again / B launch`); Accept label `5301`.

**Issue:** Level-2 Jobs legend names Esc/B only. Discoverability of Digit 1–9 Accept lives on the button label `Accept (n)` and the numbered title `n. ${title}`. WAVE26 does not regress this. Hub legend still says `1-9, 0 select service` (`6005`).

**Fix:** None this serial. Do not add a Digit or a HUD hint.

**Status:** optional; leave.

### Accessibility / states / hierarchy

- **Keyboard:** Hub Digit 2 opens Jobs. Hub Digit 0 opens Shipyard. Hub Digit 8/9 stay Launch / Standing. On Jobs overlay, Digit 1–9 accept offered jobs only. Tab reaches native Accept buttons. Focus ring is existing `.screen-btn:focus-visible`.
- **Names:** Accept is `Accept (n)` via `textContent`. Reward is a sibling `.job-reward` div, not stuffed HTML.
- **Hierarchy:** Title (`.job-title`) → detail (`.job-detail`) → pay (`.job-reward`, salvage green) → Accept (`.job-card .screen-btn`). Pay is not the primary control. Accept sits under the pay line so a throw in reward math would skip Accept; ferry math is clamped finite so the line cannot be `pays NaN UU`. Do not reorder.
- **States:** Offered unique ferry → Accept + `pays N UU`. Accepted ferry → `ACCEPTED — consignment to ${dest} (${hold}/${FERRY_UNITS} aboard)` (`5315–5317`). Unique DONE → not painted. Overlay / other DONE can still show `DONE` (`5394–5395`) — out of unique-four hide. Hold-full is an error notice, not a disabled Accept (button still fires, then notice). That match existing dock pattern.
- **Empty / loading:** No new empty string. No loading chrome. Header stays.
- **Theming:** No new CSS. Hardcoded job-card navy (`screens.css:230–236`) is pre-existing, not WAVE26.
- **Responsive:** No new layout. Cards stack in `.screen-panel` (`max-height: 82vh; overflow-y: auto`). Same-view rebuild restores `scrollTop` (`5975–5978`, `6028`).
- **Motion:** No extra Jobs animation under `reducedMotion`.
- **HUD-01:** Empty of jobs. No innerHTML. No new Digit.

### Verdict

**CLEAN.** Offered unique ferry is playable: named Accept, integer `pays N UU`, unique DONE hidden. Digit 2 / 0 / 8 / 9 unchanged. No HUD hub child. No `innerHTML`. No Blocker. No Major.

`[NO BROWSER COVERAGE]` this pass: static `station.js` / `screens.css` / `hud.js` / `hud.css` read. Live dock not started. `npm run test:boot` not run.
