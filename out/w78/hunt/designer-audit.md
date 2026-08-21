## UI Audit: Digit 2 Jobs pane (hunt cards)

### Summary
Hunt stays inside `renderJobs`. Cards use the existing `job-card` / `screen-btn` chrome, `h()` / `textContent` only, and mining’s remaining-time label. Digit 2 still opens Jobs. Mouse Accept binds the job object. Overlay pirate rows and unique ace stay on the same board. No Blocker or Major issues.

### What's done well
- Hunt reuses station job tokens (`.job-card`, `.job-title`, `.job-detail`, `.job-reward`, `.job-state`, `.job-accepted`, `.screen-btn`). No hunt-only hex colors or extra animation (`src/ui/screens.css:230-272`, `src/systems/station.js:3213-3349`).
- Title, detail, reward, and accepted line rebuild from `huntCardName` (stripped live `rec.name`, then snapshot `job.target`, else `the marked reaver`). `recordId` matching `/^rec-(0|[1-9][0-9]*)$/` is rejected as a display name (`station.js:2135-2138`, `2192-2198`, `3230-3236`, `3284-3294`, `3341-3345`).
- Offered cards show a real `<button type="button">` labeled `Accept (n)` plus `miningTimeLeftLabel` (`station.js:2830-2841`, `1985-1993`, `3303-3308`). Hover and `:focus-visible` rings stay on `.screen-btn` (`screens.css:88-100`).
- Accepted copy: `ACCEPTED — hunt <name> in this system` plus ` · t left` when the deadline is finite (`station.js:3341-3349`).
- Reward uses origin `jobPayFor` while offered and stamped `payQuoted` when accepted (`station.js:3284-3294`).
- Jobs note states hunt credits the dock flag (`+2`) (`station.js:3203-3204`).
- Overlay `bounty-pirate-*` and unique `bounty-ace` still render as sibling `job-card`s. Ace keeps the off-home gate line (`station.js:1734-1738`, `1815-1821`, `3299-3302`).
- `boardJobs` hides offered hunt off-home; `acceptJob` also refuses foreign origin (`station.js:2418`, `3154-3157`).
- HUD-02 stays closed: no hunt glance in `hud.js`. No new Digit. Dock Digit 2 is still Jobs (`station.js:152`, `3824-3828`, `3912-3919`).
- `reducedMotion`: hunt copy is static; no hunt animation in `renderJobs`.
- No `innerHTML` in `station.js`. Notice lines also go through `h()` / `textContent` (`station.js:3851`).

### Findings

#### 🟡 Minor: Digit 1–9 cannot accept past index 8
**Location:** `src/systems/station.js:3304`, `3948-3950`
**Issue:** Unique four + overlay cap + mining + trade + two hunt can push Accept past Digit 9. Digit keys index `boardJobs()[n - 1]` only.
**Fix:** Keep two hunt slots. Mouse Accept still binds the job object. Existing UX; not a reason to cut slots (contract §12.2).
**Status:** open (document; do not cut slots)

#### 🟡 Minor: Hunt and overlay bounty share the same card chrome
**Location:** `src/systems/station.js:3213-3236` (hunt title `Hunt ${name}`), `1815-1821` (overlay `Bounty: ${name}`), `1734-1738` (ace `Bounty: ${aceName}`), `src/ui/screens.css:230-272`
**Issue:** The same quarry name may appear twice: renewable `Hunt` and overlay `Bounty:`. Both use `.job-card`. Hierarchy is verb-only. Ace is also `Bounty:` plus an off-home location line. A player can Accept overlay instead of the career hunt (different purse and no slot refill).
**Fix:** Optional later: a one-word family tag on the title row (`HUNT` vs `BOUNTY`) or reuse ace’s extra `job-state` line for overlay. Not required for first impl; copy already differs.
**Status:** open (nice to have)

#### 💡 Suggestion: Verge may show one hunt card
**Location:** `src/systems/station.js:2310-2320` (`while (count < HUNT_SLOTS_PER_SYSTEM)` break when `pickHuntQuarry` is null)
**Issue:** One local pirate means one card. Empty second slot is legal. No empty-state chrome.
**Fix:** None. Do not add a placeholder card.
**Status:** accepted empty

#### 💡 Suggestion: Off-origin accepted hunt still says “this system”
**Location:** `src/systems/station.js:3234-3235`, `3344`; contrast ace `3299-3301`
**Issue:** Accepted hunt is visible on every board (`boardJobs` only hides offered hunt). Detail and state still say “in this system.” Ace names the home system when the player is not there.
**Fix:** Optional: name `originSystem` the way ace names `aceHomeId`. Frozen brief copy uses “this system”; do not block on this.
**Status:** optional

### Passed checks
- Contrast: `.job-title` `#e6eef7` and `.job-detail` `#9fb2c6` on `.job-card` `#0d1522` meet WCAG AA (detail ~8:1). High-contrast mode already lifts `.job-detail` (`screens.css:557-559`). Reward uses `var(--rw-good)`; accepted state uses `var(--rw-warm)`.
- Focus: Accept is a native button; `.screen-btn:focus-visible` outline 2px `var(--rw-accent)`.
- Keyboard: Digit 2 opens Jobs. Digit 1–9 accept offered rows 0–8. Tab + Enter/Space on Accept. Mouse Accept works past index 8.
- States: offered (Accept + time), accepted (amber state + time), empty slot (no card), refuse notices (`That quarry is no longer on the board.`, origin-only accept).
- XSS: `h()` sets `textContent` only. Names pass `stripControlChars` / `NAME_MAX`. UI never prints `recordId`.
- Theming: no hunt one-off colors.
- Hierarchy: `Hunt` vs overlay/ace `Bounty:`; hunt reward line is origin-quoted; ace keeps the gate hint.
- `reducedMotion`: no extra hunt animation.

### Verdict
CLEAN for designer purposes. 0 Blocker, 0 Major, 2 Minor, 2 Suggestion.
