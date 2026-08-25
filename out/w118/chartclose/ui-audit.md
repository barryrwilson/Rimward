# UI Audit: NAV-06 remaining close-chart-on-AP (Wave 118)

### Summary

No product chrome ships this wave. Spec picture is: plot on the Galaxy Chart, click Autopilot, **map closes on success**, flight is visible; refuse keeps the map and the live refuse line; cancel/disengage **while open** still paints `#rw-galaxy-ap-live`. Keys stay M / Escape to close. Autopilot button stays named. Color is not the only cue. Digit 0/8/9 stay. Hub stays empty 80 px. `reducedMotion`: no new close animation.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` myself. Did **not** spawn `[designer]`. Spec audit of later player outcome (chart close vs fly). Did **not** start Vite or Chrome. `[NO BROWSER COVERAGE]`. This leftover **is** UI policy — audit not skipped.

### What's done well

- Reuses live `.rw-galaxy-chart` dialog (`galaxychart.js` 110–116; `hud.css` 1898–1916) and live Autopilot button (`147–153`, `syncApButton` 590–617). No new widget required.
- Live close already named: M, Escape, `aria-label` Close galaxy chart (`155–159`, `674–688`). Auto-close on success is extra, not a stranded overlay.
- `#rw-galaxy-ap-live` already `role='status'` `aria-live='polite'` (`137–142`). Cancel/disengage keep that **while the chart is open**. Success already clears the line (`638–640`) so hidden live-region after close is not a new a11y hole. HUD `#hud .rw-autopilot-cancel` is already named (`hud.js` 1037–1039) with `:focus-visible` (`hud.css` 707–714).
- `aria-modal=false` (`113`) stays honest after deputize: the map is gone, flight is visible, sim was never paused.
- Autopilot vs Cancel autopilot labels already switch (`599–609`). Refuse still `aria-disabled` + dim (`616–622`) with a live text line — color is not the only cue.
- Empty hub freeze: no AP pip on `.rw-reticle`.
- Deputize auto-close instead of a lock-until-close gate, so the player is not stuck reading the map while the ship moves.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): Player flies behind a still-open full-screen map

**Location:** `galaxychart.js` 633–641; `hud.css` 1898–1916 `inset:0` z 30 dim `0.82`; `autopilot.js` 220 engage while `chartOpen`.

**Issue:** Inbox P2. Autopilot starts. Chart stays. Space is covered. Steer is frozen. Fire is suppressed (`controls.js` 476). The player cannot see the approach.

**Fix landed (markdown):** PR1 `setOpen(false)` on **successful** Autopilot **button** engage only. Refuse/cancel keep the map. Overlay this wave must **not** steal this close.

**Status:** closed in contract §0.1. Do not reopen as CONSUME because NAV-05 pinned stay-open.

#### 🟠 Major (closed in freeze): Autopilot success hides a focused control inside `aria-hidden`

**Location:** designer re-dispatch; live AP button `galaxychart.js` 147–153, 625–642; `setOpen` sets `aria-hidden` (`421–430`); HUD Cancel `hud.js` 1037–1041, 1717.

**Issue:** Player tabs to Autopilot and clicks (or activates) it. Later PR1 that only calls `setOpen(false)` leaves `document.activeElement` on a control inside `aria-hidden`. Screen-reader and keyboard users stay trapped on a hidden map.

**Fix landed (markdown):** After real `setOpen(false)` on **successful** button engage, if `document.activeElement` is inside the chart root, **blur** it. Prefer move focus to already-named `#hud .rw-autopilot-cancel` **when that chip is visible**. If the chip is still `is-hidden` this frame (`hud.js` 1717), blur is enough. Do not add a KeyM listener. Do not start a close animation. Do not emit a toast. Do not rewrite `showApLive`.

**Status:** closed in contract §0.19. Not live until later PR1.

#### 🟡 Minor: Success has no spoken live line after close

**Location:** `galaxychart.js` 638–640 `showApLive('')`; live region sits **on the chart** (`header` 166) which becomes `aria-hidden` on close (`430`).

**Issue:** After auto-close, the status node is hidden. Screen-reader users get “map gone” via `aria-hidden` / `display:none`, not an “Autopilot engaged” phrase. Adding a HUD toast would steal P1 toast-flood.

**Fix:** Accept visual close + prefer visible HUD Cancel focus (contract §0.19). Do **not** add a toast. Do **not** rewrite `showApLive` onto the HUD.

**Status:** accepted residual. Call out. Do not solve toast-flood here.

#### 🟡 Minor: Overlay hail may appear the instant the map closes

**Location:** live `takeDeferredHail` (`overlay-policy.js` 158; `hail.js` 512–516) after real `setOpen(false)`; contract §0.9.

**Issue:** Player clicks Autopilot to see space; a deferred hail card may paint immediately. That is overlay mutex working. It is not this leftover’s chrome. Skipping flush would hide hail Digits under a closed-but-flagged chart.

**Fix:** Keep real close. Do not skip flush. Do not add a “AP close is special” overlay exception from this leftover.

**Status:** accepted coupling. Documented in notes.

#### 💡 Suggestion: Do not invent a “close the chart to resume” blocking banner as required PR1

**Location:** wishlist “or present an explicit state”; contract explicit non-picks.

**Issue:** A lock banner would keep the map up and add copy. Deputize auto-close is smaller and shows space immediately.

**Status:** frozen. Owner may override after playtest.

#### 💡 Suggestion: `reducedMotion` needs no new rule

**Location:** contract §0.17; `hud.css` 2265–2266 already zeros chart motion.

**Status:** no new overlay animation; do not add a close tween.

#### 💡 Suggestion: Do not make chart labels into hit targets

**Location:** P2 chart-label a11y inbox; `galaxychart.js` 645–654 hit discs only.

**Status:** frozen. This leftover does not touch labels.

### Verdict

Spec UI is the **existing** chart with a **named** success close. Later player outcome: map gone, flight visible, refuse/cancel still readable on the open chart. No open Blocker/Major. Optional PR2 stills are skippable. Did not spawn designer. Did not start a browser.

---

## Re-review (Wave 118 re-dispatch)

Designer Major (focus inside `aria-hidden`) **closed in freeze** (contract §0.19). Map-behind-flight Major remains closed in freeze. Later player outcome: success **closes** the full-screen map; focus leaves the hidden chart (HUD Cancel if visible); refuse/cancel keep the map; `showApLive` stays for open-chart cancel/disengage; no toast; no label hit targets; hail flush stays `takeDeferredHail`. No open 🔴 Blocker or 🟠 Major. `[NO BROWSER COVERAGE]`. Did not spawn designer. Did not start a browser.
