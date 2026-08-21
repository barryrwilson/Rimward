# UI Audit: Digit 2 Jobs — explore cards (Wave 78 parent)

**Auditor:** `[designer]` parent (independent of `out/w78/explore/designer-audit.md` / `ui-audit.md`)  
**Scope:** `renderJobs` explore cards in `src/systems/station.js`. Hunt and passenger cards must still render. Landmark DISPLAY names and system DISPLAY names only. Digit 2. HUD-02 closed. `textContent` only.  
**Method:** `orchestrator/references/ui-audit.md`  
**Date:** 2026-08-21  
**Product source:** review only (no `src/` edits)

## UI Audit: Jobs pane explore cards

### Summary
Explore cards reuse the live `job-card` pattern (title, detail, reward, Accept, remaining time). Copy binds through `resolveExploreSite` + `landmarks[].name` + `SYSTEMS[].name`. Hunt and passenger branches still render on the same board. No Blocker or Major findings.

### What's done well
- Digit 2 is still Jobs: `DOCK_KEY_SERVICES[1] === 'jobs'` (`src/systems/station.js:152`, `4264-4266`, `4393-4400`). No new Digit. No HUD glance.
- Cards use existing tokens: `.job-card`, `.job-title`, `.job-detail`, `.job-reward`, `.job-state`, `.job-accepted`, `.screen-btn` (`src/ui/screens.css:230-272`). Explore adds no hex colors and no extra animation.
- `h()` sets `textContent` only. `btn()` creates `<button type="button">`. No `innerHTML` in `station.js` (`src/systems/station.js:3208-3219`).
- Offered explore title/detail rebuild at paint from display names, not stored ids: `Survey ${lmName}` / `Fly to ${lmName} in ${sysName}. Redock here to file.` (`src/systems/station.js:3679-3687`, names from `2492-2500`).
- Reward: `File the survey at this dock — pays ${est} UU` with offered `jobPayFor` and accepted `payQuoted` (`src/systems/station.js:3754-3759`).
- Offered remaining time reuses `miningTimeLeftLabel` (`src/systems/station.js:3768-3773`, `1989-1997`).
- Accepted: `ACCEPTED — survey ${lmName} in ${sysName}` plus ` · t left` (`src/systems/station.js:3818-3826`, class `job-state job-accepted`).
- Mouse Accept binds the job object: `btn(card, Accept (n), () => acceptJob(job))` (`src/systems/station.js:3768-3769`). Overflow past index 8 still works.
- Hunt cards still render (`src/systems/station.js:3667-3672`, `3735-3745`, `3806-3810`). Passenger cards still render (`src/systems/station.js:3673-3678`, `3746-3753`, `3811-3817`). Unique four stay siblings on `boardJobs`.
- Offered explore is home-only (`src/systems/station.js:2683`). Accepted explore still shows at other docks. `acceptJob` refuses a foreign origin (`src/systems/station.js:3592-3600`).
- Copy never prints `fh_shepherd`, `rec-`, clue ids, or `mystery.visited`. `exploreVisitedHas` is tick-only (`src/systems/station.js:2609-2614`, `3045`). Fail-closed fallbacks are `the landmark` / `the system` (`src/systems/station.js:2492-2500`).
- Hover and `:focus-visible` rings stay on `.screen-btn` (`src/ui/screens.css:88-100`). High-contrast already lifts `.job-detail` (`src/ui/screens.css:557-559`).
- `reducedMotion`: explore copy is static text. `renderJobs` adds no motion. HUD-02 skins stay out of this pane.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Digit 1–9 cannot accept past index 8
**Location:** `src/systems/station.js:3768-3769`, `4428-4431`
**Issue:** Digit keys accept `boardJobs()[n - 1]` only (Digit 1 = index 0, Digit 9 = index 8). Unique four + overlays + mining + trade + hunt + passenger + two explore can push Accept past Digit 9. Existing UX. Mouse Accept still binds the job object.
**Fix:** None in this serial. Do not cut explore to one slot.
**Status:** open (document; existing Digit 1–9 index-8 UX)

#### 💡 Suggestion: Accepted explore at a far dock still says “here”
**Location:** `src/systems/station.js:3686`, `3759`, `3818-3826`; contrast passenger dest names at `3678`, `3816`; ace home line at `3764-3766`
**Issue:** `boardJobs` only hides offered explore. An accepted card on a foreign board still says `Redock here to file` and `File the survey at this dock`. Pay still requires origin dock (`src/systems/station.js:3046-3047`). Mining already uses “here”; passenger names the far station.
**Fix:** Optional later: name the origin station the way passenger names dest. Do not block this serial.
**Status:** optional

#### 💡 Suggestion: One-landmark systems show two matching survey titles
**Location:** `src/systems/station.js:2474-2478`, `2569-2576`; authored one-landmark systems e.g. `src/game/authored-systems.js:56-58` (The Shepherd)
**Issue:** Slot wrap `lms[slot % lms.length]` can bind both slots to the same landmark. Titles still differ by `1.` / `2.` and `Accept (n)`. Passenger already posts two identical “Escort passengers” cards.
**Fix:** None. Numbered rows already distinguish the pair.
**Status:** accepted (matches passenger)

### Accessibility
- Accept is a real `<button type="button">` via `btn()` (`src/systems/station.js:3215-3219`).
- Keyboard: Digit 2 opens Jobs. Digit 1–9 accept offered rows 0–8. Tab + Enter/Space on Accept. Mouse Accept works past index 8.
- Contrast: `.job-title` `#e6eef7` and `.job-detail` `#9fb2c6` on `.job-card` `#0d1522` meet WCAG AA. Reward uses `var(--rw-good)`. Accepted state uses `var(--rw-warm)`.
- Focus: `.screen-btn:focus-visible` outline 2px `var(--rw-accent)`.
- Semantic: cards remain `div.job-card` (existing Jobs chrome). Copy is plain English. No clue-id internals.
- `reducedMotion`: no extra animation added.
- Hit target: `.job-card .screen-btn` padding `4px 10px` is the existing compact Jobs control (`src/ui/screens.css:256-259`). Not a new explore defect.

### States
- Offered: Accept + remaining time.
- Accepted: amber `job-accepted` line + remaining time.
- Done: `DONE` (shared branch).
- Empty slot: no card (`syncExploreJobs` breaks when `resolveExploreSite` is null).
- Refuse notices: origin-only, no home dock, no survey site, invalid need (`src/systems/station.js:3592-3616`).
- Panel overflow: `.screen-panel` `max-height: 82vh; overflow-y: auto` (`src/ui/screens.css:26-31`).

### XSS
- `h()` assigns `textContent`. Landmark and system names are authored strings, then trimmed. UI never interpolates ids into HTML.
- Hunt still strips control chars for quarry names (`src/systems/station.js:2139-2141`). Explore does not need that path for authored landmark names.

### Theming / hierarchy
- No explore-only colors. Hierarchy matches mining/trade/hunt/passenger: title, detail, reward, Accept, time-left.
- Jobs sub-note names explore on the dock-flag standing line (`src/systems/station.js:3638-3639`). Patrol still names Freehold.
- HUD-02 closed. People desk is a separate renderer. Explore does not dump `mystery.visited`.

### Verdict
CLEAN for designer purposes. 0 Blocker, 0 Major, 1 Minor, 2 Suggestion.
