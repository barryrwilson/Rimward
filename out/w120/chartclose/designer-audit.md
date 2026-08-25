## UI Audit: Galaxy Chart Autopilot success close (parent designer)

Wave 120 PR1 chart-close-on-AP. Parent pass. Does not overwrite `out/w120/chartclose/ui-audit.md`.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Merge law: `out/w118/chartclose/shared-contract.md` §0.19. Spec: `docs/Nav06ChartCloseDesign.md`. HUD Cancel is cite-only (`src/systems/hud.js` `.rw-autopilot-cancel`). No Vite. No product edit.

### Summary

Successful Autopilot **button** engage closes the full-screen map with real `setOpen(false)`. Keyboard focus does not stay inside the `aria-hidden` chart. Refuse and cancel keep the map. No open Blocker or Major.

**Verdict:** CLEAN.

### What's done well

- Close is the existing `setOpen(false)` path (`src/systems/galaxychart.js:421–441`, called from success at `648`). Open-gate mutex still wraps **open** only (`422–425`). Close always writes `flags.chartOpen` and `aria-hidden`. Overlay hail can flush via live `takeDeferredHail` (`src/systems/hail.js:514`).
- Success order matches §0.19: `showApLive('')` (`647`), real close (`648`), then blur if `activeElement` is still inside `root` (`652–655`), then prefer authored `#hud .rw-autopilot-cancel` only when ancestor `.rw-autopilot` lacks `is-hidden` (`656–661`).
- `setOpen(false)` itself blurs a focused descendant (`432–439`). Close, Escape, KeyM, and docked auto-close share that blur. The Autopilot success branch adds the HUD Cancel prefer-focus on top.
- Refuse keeps the chart and paints `#rw-galaxy-ap-live` (`641–645`). Flying Cancel keeps the chart and paints cancel (`635–639`). Fly disengage while open still uses unwritten `showApLive` (`743–752`).
- No close tween: `.rw-galaxy-chart.is-hidden` is `display: none` (`src/ui/hud.css:1919`). `reducedMotion` is unused. No success toast: success does not emit `commLine` (refuse still may, `645`).
- Labels stay labels (`283–291`). Clicks still go to hit discs (`675–677`). Autopilot / Cancel names stay (`604–617`). Color is not the only cue (`is-dim` + live text, `623–626`).
- Chart Autopilot and HUD Cancel already have `:hover` / `:focus-visible` rings (`hud.css:2003–2012`, `707–714`). Tokens / CSS variables stay. HUD-01 hub and Digit 0/8/9 stay untouched.
- Fail-closed: `try/catch` around focus (`649–663`). Missing `document` / `activeElement` does not throw. `apBtn.disabled` still returns before engage (`634`).

### Findings

No 🔴 Blocker. No 🟠 Major (open).

#### 💡 Suggestion: HUD Cancel is usually still hidden on the success frame

**Severity:** Suggestion  
**Location:** `src/systems/galaxychart.js:656–661`; cite-only `src/systems/hud.js:1756–1759` (chip `is-hidden` toggle; worker self-pass cited `1717`)  
**Description:** `.rw-autopilot` starts with `is-hidden` (`hud.js:1068`) and unhides on the HUD update after `nav.autopilot === true`. The click handler therefore usually blurs and does not `focus()` Cancel. That is the common keyboard landing after Autopilot from a cold chart.  
**Suggestion:** None in this PR. Contract §0.19: if the chip is still hidden this frame, blur is enough. Do not write `hud.js`. Do not defer with a timer or `rAF`.  
**Status:** contract freeze. Do not raise Major.

#### 🟡 Minor: Success has no spoken live line after close

**Severity:** Minor  
**Location:** `src/systems/galaxychart.js:647`; live region `137–143` sits on the chart header; `setOpen` sets `aria-hidden` at `430`.  
**Description:** Success clears `#rw-galaxy-ap-live` then hides the dialog. Screen-reader users get “map gone” from `aria-hidden` / `display: none`, not an “Autopilot engaged” phrase. A HUD toast would steal P1 toast-flood.  
**Suggestion:** Keep visual close + blur / prefer visible HUD Cancel. Do not add a toast. Do not rewrite `showApLive` onto the HUD.  
**Status:** accepted residual (Wave 118 freeze). Call out only.

#### 🟡 Minor: Deferred hail may paint as soon as the map closes

**Severity:** Minor  
**Location:** real close `galaxychart.js:648` → `flags.chartOpen` false (`428`); flush `hail.js:514` `takeDeferredHail`.  
**Description:** The player clicks Autopilot to see space. A deferred hail card may open on the next overlay update. That is mutex working. Skipping flush would hide hail under a closed map. This pass does not audit hail copy. Close does not leave the map up.  
**Suggestion:** Keep real `setOpen(false)`. Do not special-case skip flush.  
**Status:** accepted coupling. Not a close defect.

#### 💡 Suggestion: `setOpen` sets `aria-hidden` before it blurs

**Severity:** Suggestion  
**Location:** `src/systems/galaxychart.js:430` then `435–438`.  
**Description:** For one statement the focused Autopilot control is a descendant of `aria-hidden="true"`. The same function then blurs. The click handler blurs again (`652–655`). Same-tick; not an unusable trap.  
**Suggestion:** Optional later tidy: blur the descendant before `aria-hidden`. Not required for PR1. Do not add animation or a new key listener.  
**Status:** optional. Not a Major.

### Checklist

- [x] Focus not left in `aria-hidden` chart after success (`setOpen` blur + success-branch blur)
- [x] Authored HUD selector `#hud .rw-autopilot-cancel` only when `.rw-autopilot` lacks `is-hidden`
- [x] Hidden chip this frame → blur only (contract freeze; not Major)
- [x] Refuse keeps map + live line
- [x] Cancel-while-open keeps map + cancel line
- [x] No close animation; `reducedMotion` unused
- [x] No success toast
- [x] Chart labels are not hit targets
- [x] Overlay close is real `setOpen(false)` (hail flush allowed)
- [x] Hover / focus-visible rings stay on Autopilot and HUD Cancel
- [x] No overlay pip on the aim glass

### Worker self-pass

`out/w120/chartclose/ui-audit.md` agrees: no Blocker, no Major. Parent corrects the HUD cite from `hud.js:1717` to `hud.js:1756–1759`. That cite error is not a product defect.
