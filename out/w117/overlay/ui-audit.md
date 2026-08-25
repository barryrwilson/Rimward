# UI Audit: CTL-02 remaining overlay-priority (Wave 117)

### Summary

No product chrome ships this wave. Spec picture is **one exclusive play card** among Hail, Galaxy Chart, and Berth Records, with incoming hail **deferred** (not yanked), sim **live**, and "Let them go" quiet for 30 s of world time. Keys stay H / M / L. Close controls stay named (M/L/Escape on chart/berth; numbered hail intents). Color is not the only cue. Digit 0/8/9 stay. Hub stays empty 80 px. `reducedMotion`: no new overlay animation.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` myself. Did **not** spawn `[designer]`. Spec audit, not a running page. Did **not** start Vite or Chrome. `[NO BROWSER COVERAGE]`. This leftover **is** UI policy — audit not skipped.

### What's done well

- Reuses live hail card (`hail.js` 106–120), live `.rw-galaxy-chart` dialog (`galaxychart.js` 110–116; `hud.css` 1899–1916), live berth `role=dialog` (`save.js` 1361–1362). No new widget required.
- Live hail buttons already name the action: `[n] Let them go` (`hail.js` 391, 308).
- Chart `aria-labelledby` / `aria-describedby` / `aria-modal=false` already document that flight continues (113–116) — mutex does not invert that into a fake pause.
- Berth hint already says L or ESC and that records hold while you fly (1376).
- High-contrast / colorblind body classes already restyle `.screen-overlay` (`screens.css` 561+). Chart palette mirrors `#hud` and reacts to `body.rw-*` (`hud.css` 1893–1896).
- Settings stays reachable over every surface (Wave 40 z 80) so a11y toggles remain available if a play card is up.
- Empty hub freeze: no overlay pip on `.rw-reticle` (`hud.css` 184–193).

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): Three cards stack; hidden hail Digits

**Location:** `hail.js` 108 vs `hud.css` 1908 vs `save.js` 1352; Digit `hail.js` 407–415.

**Issue:** Inbox P1. Berth covers hail; Digit1 still resolves tribute. Chart sits under hail. Sim continues.

**Fix landed (markdown):** PR1 mutex + Digit only when hail is exclusive top play card. Defer incoming hail instead of painting on the map.

**Status:** closed in contract §0.1 / §2. Do not reopen as CONSUME.

#### 🟠 Major (closed in freeze): "Let them go" can return immediately on salvage / via `openCard`

**Location:** `hail.js` 185–186, 192, 421; `npc.js` 249.

**Issue:** Live label "Let them go" writes 30 s calm, but the DOM opener does not read it. Salvage label "Leave the hulk" is the same intent without calm. KeyH reopens the hulk.

**Fix landed:** `openCard` / KeyH read `calmUntil`. Salvage `letGo` writes +30 s. Session only.

**Status:** closed in contract formulas.

#### 🟡 Minor: Players who open M to plot then miss the hail

**Location:** defer policy contract §0.1.

**Issue:** Incoming hail waits behind the chart. Combat continues (`aria-modal=false`). The player may not hear the hail until they close the map (song still emits `hailOpened` cue if the event fired — live `song.js` 79 — but if we **defer emit-to-DOM**, the cue might still play from the event).

**Fix:** Later PR1: **keep** `hailOpened` emit for song; **defer only `openCard`**. Optional one-line `commLine` is **not** required (that would collide with toast-flood). Do not add a new toast.

**Status:** accepted residual. Call out in notes / this audit. Do not solve toast-flood here.

#### 🟡 Minor: Hail has no Escape close

**Location:** `hail.js` 405–416 Digit only; contract §0.18.

**Issue:** Mutex that blocks KeyM/L while hail is open leaves **intents** as the only close. That is live today. Adding Escape = dismiss would look like `keepFiring`.

**Fix:** Do not add Escape-dismiss as required PR1. Keep `[n]` + verb.

**Status:** accepted; frozen.

#### 💡 Suggestion: Do not restack z-index if mutex holds

**Location:** contract §0.1 z-index prefer none; Wave 40 ladder.

**Issue:** Raising hail over berth without mutex keeps hidden-key bugs. Raising play cards over settings breaks Wave 40 KeyO-over-title.

**Status:** frozen. Prefer no `hud.css` edit.

#### 💡 Suggestion: `reducedMotion` needs no new rule

**Location:** contract §0.17.

**Status:** no new overlay animation; do not add one.

### Verdict

Spec UI is existing cards with a **named** exclusive policy. No open Blocker/Major. Optional PR2 stills are skippable. Did not spawn designer. Did not start a browser.
