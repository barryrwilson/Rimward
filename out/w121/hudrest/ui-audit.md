# UI Audit: Wave 121 HUD remaining-feedback leftover (CONSUME freeze)

**Scope:** leftover freeze only. No product UI change this wave. Audit the census claims against live HUD surfaces so a later worker does not “fix” CONSUME with extra chrome.  
**Method:** self-applied orchestrator `ui-audit.md` checklist. Do not spawn `[designer]`.  
**Date:** 2026-08-25. Second pass: still 0 Blocker/Major. Minors stay documented as not leftover.

## UI Audit: remaining HUD player-facing feedback

### Summary

Player-facing flood leftover is **gone** on the toast stack. Banner, commLine, and onboarding are **not** a second flood UI. Freeze CONSUME. Do not add chrome. No Blocker. No Major.

### What's done well

- Five toast chips stay top-right, off the 80 px aim column (`hud.css` 635–646 vs 184–193).
- Color is not the only cue: glyph prefixes (`▲` / `✧` / `■`) stay; AUTOSAVE HELD vs SAVE BLOCKED is **text**, not color.
- Expire chips: `aria-hidden` + `visibility: hidden` on `:not(.show)` (`hud.js` 1243; `hud.css` 734). AT and sighted fade agree.
- Visible identical refresh does not rewrite `textContent` (avoids polite re-announce).
- Onboarding is one line, KeyO off, persist `seen` — teaching, not a stack.
- Arrival banner is one card, 4 s, `textContent`, pointer-events none.
- Overlay cards stay above `#hud` z 10; freeze forbids raising toast z.
- Reduced-motion already kills banner/toast transition (`hud.css` 1184 comment). Do not invent motion.

### Findings

#### 🟡 Minor: Onboarding hint has no accessible name / live region

**Location:** `src/systems/onboarding.js:81-105`  
**Issue:** `.rw-onboard-hint` is visual `textContent` only. Screen readers may miss the teaching line.  
**Why it is not leftover:** HUD-04 forbade **adding** a live region as toast leftover. This census asked flood leftover, not a new a11y product. One persist-once hint is not toast-flood.  
**Fix:** **Do not** name HUD-05 PR1. Owner may file a later a11y idea in the inbox (other worker).  
**Status:** documented — not leftover.

#### 🟡 Minor: Banner polite region keeps faded text

**Location:** `src/systems/hud.js:860, 1262-1264`  
**Issue:** Fade is opacity, not `aria-hidden`. Stale system name can remain in the region.  
**Why it is not leftover:** One-shot arrival, not a five-row flood. Toast PR1 already covered the **stack** expire hole.  
**Fix:** Do not invent a serial.  
**Status:** documented — not leftover.

#### 💡 Suggestion: Pause overlay and station notice are not HUD toast UI

**Location:** `main.js:160-163`; `station.js:6066-6068`  
**Issue:** Other polite/visible status strings exist. They are pause and dock overlay.  
**Fix:** Keep them out of HUD-05. Overlay mutex / dock UI are siblings.  
**Status:** inventory already excludes them.

### Accessibility

- [x] Toast stack has `role=status` `aria-live=polite`
- [x] Toast expire uses `aria-hidden` (HUD-04 landed)
- [x] No `aria-live=assertive` in `src/`
- [x] Freeze forbids a **new** live region and forbids assertive
- [x] Contrast / scale / reduced-motion inherit HUD-03 KeyO (cite CONSUME)
- [x] Hit targets: toasts `pointer-events: none` (correct; not controls)
- [x] Chart labels / dest `<select>` out of scope (NAV-07)

### Theming

Live tokens via `#hud` CSS variables. No new hardcoded leftover chrome.

### Responsive / states

Five chips wrap as a column `align-items: flex-end`. Banner `white-space: nowrap` is existing arrival chrome — do not retune as leftover.

### Visual hierarchy

Toast stack vs one banner vs one hint vs one prompt are **four jobs**. CONSUME keeps that split. A sixth slot would flatten hierarchy.

### Verdict

**CONSUME freeze is the UI-correct outcome.** Do not add a sixth chip, a hint live region, or a hub pip.
