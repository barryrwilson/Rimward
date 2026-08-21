## UI Audit: Digit 2 Jobs spy cards

**Scope:** Independent designer pass on `src/systems/station.js` espionage family (Jobs board only). Worker self-audit `out/w80/espionage/ui-audit.md` was read after this review, not used as a source of findings.
**Review file:** `out/w80/espionage/designer-audit.md`
**Method:** Source + `src/ui/screens.css` job/button/contrast rules. No Playwright. [NO BROWSER COVERAGE].

### Summary
Offered spy cards on Digit 2 Jobs already answer dest, pay, remaining time, and employer in player language, with the same card chrome as mining/explore. One major copy bug remains: accepted spy still says **file here** on every dock, including the gather dest. No blockers. No id/key leaks in visible copy.

### Verdict
**majors** — 0 blockers, 1 major, 2 minors, 2 suggestions.

### What's done well
- Digit 2 is still Jobs (`DOCK_KEY_SERVICES` index 1, hotkey `i + 1`). Digit 0 is still shipyard. Digit 9 is still Standing (`epics`). No new service digit.
- Offered spy is origin-only (`boardJobs` 2885). Accept click on a foreign offered row cannot happen; `acceptJob` still notices `Take that contract at the posting dock.` (3897–3900).
- Visible copy uses station names and faction display names, not `job.id`, `kind: 'espionage'`, `spy-${sysId}-`, dest system keys, or record ids (`spyStationName` 2611–2618, `spyEmployerName` 2620–2623, `spyCardDestName` 2687–2693, live rewrite in `renderJobs` 3997–4006).
- `h()` sets `textContent` (3480–3485). Accept is a real `<button type="button">` (3487–3491). No `innerHTML`.
- Card language matches the Jobs family: numbered title, detail, green reward UU, `Accept (n)`, then `Xm left` via `miningTimeLeftLabel` (4095–4100). Title verb is `Spy at`, parallel to `Survey` / `Hunt` / `Mine`.
- Board note names **spy** like mining/explore and credits the **dock flag**, not the target (3947–3948).
- Empty rival dest does not leave a ghost card: `syncEspionageJobs` drops offered rows with no dest and stops filling slots (2747–2777). Remaining mining/hunt/explore cards still form a normal board.
- High-contrast: spy reuses `.job-detail` / `.job-reward` / `.screen-btn`. `body.rw-contrast` already lifts `.job-detail` (screens.css 557–558). Focus ring is existing `.screen-btn:focus-visible` (screens.css 95–99). Hover is existing. No new spy animation; `reducedMotion` needs nothing extra.
- Mouse Accept binds the job object, so cards past index 9 still accept. Panel already scrolls (`overflow-y: auto`, screens.css 31).
- Accept failure notices exist: no home dock, no far dock, invalid need, no posted pay (3902–3923).

### Findings

#### 🟠 Major: Accepted spy says “file here” on every board
**Location:** `src/systems/station.js:4086`, `src/systems/station.js:4161–4163`
**Severity:** major
**Status:** open
**Issue:** Accepted spy stays on every Jobs board (2885 filters offered only). Reward is `File intel from ${destName} here — pays ${est} UU`. Progress is `ACCEPTED — gather at ${destName} then file here` or `intel aboard — file here`. At the gather dest, “here” is the wrong dock. Detail already names the home station (`File at ${homeName}` at 4005), so the status line contradicts the line above it. Explore’s accepted state names the site (`survey ${lmName} in ${sysName}` at 4153) and does not tell the player to file “here” while they are away. Spy is a two-dock loop; this line is the one players will follow after Accept.
**Suggestion:** Reuse `homeName` already computed for the card. Reward: `File intel from ${destName} at ${homeName} — pays ${est} UU`. State: `ACCEPTED — gather at ${destName} then file at ${homeName}` and `intel aboard — file at ${homeName}`. Offered cards at origin may keep “here” if you want origin-board shorthand; accepted cards must not.

#### 🟡 Minor: Digit 1–9 still cannot accept past index 8
**Location:** `src/systems/station.js:4007`, `src/systems/station.js:4096`, `src/systems/station.js:4768–4770`
**Severity:** minor
**Status:** open (existing Jobs UX; spy adds two more family rows)
**Issue:** Titles and mouse buttons number `Accept (n)` with `i + 1` with no cap. Keyboard uses `Digit` `n - 1` only. Home board can exceed 9 cards (unique four + overlays + six families × 2, now including spy). Cards 10+ are mouse-only. Screen legend at jobs level 2 does not say that.
**Suggestion:** Do not cut spy to one slot. If you change anything, say in the jobs legend that mouse Accept still works past 9. Contract §12.2.

#### 🟡 Minor: Accepted spy pay falls back to 0 UU
**Location:** `src/systems/station.js:4083–4086`
**Severity:** minor
**Status:** open
**Issue:** Explore’s accepted reward falls back to `jobPayFor(..., explorePayBase())` when `payQuoted` is missing (4075–4077). Spy uses `0`. A restored or mid-render accepted spy can read `pays 0 UU` even when the live quote would be the explore-scale pay.
**Suggestion:** Match explore: missing `payQuoted` → `jobPayFor(ctx, originId, explorePayBase())`.

#### 💡 Suggestion: Employer lives only in the detail clause
**Location:** `src/systems/station.js:4002–4005`
**Severity:** suggestion
**Status:** open (not required)
**Issue:** Dest is in title, detail, and reward. Pay is in the reward line. Time is in `job-state`. Employer is only ` for ${employerName}` on the detail line. A skim of title + reward still gets dest and pay. Employer is readable if the player reads detail. Empty `factionDisplayName` drops the clause entirely (4003), so the card still works, just without a named employer.
**Suggestion:** None required for Accept. Optional: `Employer: ${employerName}` as its own `job-state` or prefix, same as time.

#### 💡 Suggestion: Time sits under the Accept button
**Location:** `src/systems/station.js:4096–4100`
**Severity:** suggestion
**Status:** open (matches mining/explore)
**Issue:** Remaining time is on the card before Accept, but visually after the button. Same order as mining/trade/hunt/passenger/explore. Not a spy regression.
**Suggestion:** Leave it. Optionally put `left` on the reward line if you want time in the same scan as pay.

### Focus checklist

| Question | Result |
| --- | --- |
| Dest, reward, time, employer before Accept? | Yes on origin offered cards: dest in title/detail/reward (4004–4006, 4086); pay in reward (4086); time via `miningTimeLeftLabel` (4098–4100); employer in detail (4003–4005). |
| System keys / clue ids / record ids in copy? | No. Live render overwrites stored title/detail. Fallback dest copy is `the far dock`, never `job.destSystem` raw. Job ids stay off the card. |
| Spy look like mining/explore? | Yes. Same `job-card` stack, UU reward, `Accept (n)`, deadline label, dock-flag note. |
| Empty slot (no rival dest)? | Coherent. No empty placeholder. Other families still fill the board. |
| High-contrast / reducedMotion? | No extra motion. Existing contrast and focus tokens apply. |

### Independent vs worker self-audit
Worker `ui-audit.md` reported no 🔴/🟠. This pass agrees on origin offered copy, no `innerHTML`, no new digit, no extra motion, and the Digit 1–9 cap as minor. This pass adds the accepted “file here” major and the `pays 0 UU` fallback minor.

### Not in scope / not inflated
- Hardcoded `.job-card` colours (`#0d1522`, `#e6eef7`) are pre-existing Jobs chrome, not spy-specific.
- Small `.job-card .screen-btn` padding is pre-existing.
- Cards are `div`s, not landmarks; that is the whole Jobs board, not a spy defect.
- Digit 0 shipyard / Digit 9 Standing unchanged; no finding.
