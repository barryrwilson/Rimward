# UI Audit: HUD-07 deconfliction leftover (Wave 128 markdown)

### Summary

Player-facing later; this wave freezes layout law. Audit of the freeze: hub stays empty, yield hits duplicate words/labels first, cruise gets quieter combat chips without hiding nav, color is not the only cue, no new pulse. No Blocker or Major remain.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Experience refs: `out/hud-research/fs1-training-reticle.jpg` (empty hub) and `docs/HudUtilityChangeProposal.md` (glance at 57% / ±78 px) — read only.

### What's done well

- HUD-01 80 px empty glass is explicit. No compass / PPI / deconflict widget in the iris.
- Toasts and banner already off the aim column; freeze leaves them there.
- NAV-02 on-glass hide and HUD-06 hide-on-station-lock stay as identity rules, not toys.
- Exploration quieter = fade combat-only **words**, not a second HUD and not a dead nav strip.
- Shape + text remain when a word yields (RANGE ring, LEAD ring, POS HOME, rail DIST).

### Findings

#### 🔴 Blocker: Hub gadget

**Location:** `hud.css` **183–193**; wishlist “central HUD”  
**Issue:** A collision widget inside `.rw-reticle` would occupy HUD-01 glass.  
**Fix:** Forbidden. RANGE **word** may hide; ring may stay. Locked in contract §0.2.

#### 🟠 Major: Cruise that hides HOME / GATE / J

**Location:** quieter exploration deputize  
**Issue:** A quiet cruise that also hides the only nav recreates the HUD-06 8,900 u POS-only pain.  
**Fix:** Keep POS, POS HOME, GATE row, gate cue, dock J. Fade RANGE/LEAD **words**. Locked §0.16.

#### 🟠 Major: Color-only yield

**Location:** `hud.js` **48–49**; `reducedMotion` `hud.css` **1252–1258**  
**Issue:** Opacity-only hide of RANGE without DIST/ring would leave in-envelope state as color. Pulse on yield would violate reduced motion.  
**Fix:** Keep `.in-range` ring and/or rail DIST. No new `@keyframes`. Locked §0.12–0.13.

#### 🟡 Minor: Prompt at 20% can sit on the lower shot path

**Location:** `hud.css` **798–802**; `hud.js` **2375–2379**  
**Issue:** `J Dock` is center-bottom. Relocating it is tempting. Brief says do not hide dock J when it is the only nav.  
**Fix:** PR1 does not move prompt. Acceptable; owner may override after playtest.

#### 💡 Suggestion: AP/AM chip stack is top-center

**Location:** `hud.css` **704–715**  
**Issue:** Autopilot/automine chips can hang over the upper column. Contract allows a small **up** nudge if they hit the hub, not a hub child. Optional in PR1.

### HUD-01

- [x] `.rw-reticle` 80×80 stays empty of extras
- [x] No new hub child in PR1 plan
- [x] RANGE ring allowed; RANGE word may yield

### Contrast / a11y

- [x] Color not the only cue
- [x] No third `aria-live`
- [x] Chartmarks / HOME pip already `aria-hidden` (POS / comm carry names)
- [x] `reducedMotion`: no new pulse

### Neighbors

- [x] HUD-06 chevron inset **108** not retuned
- [x] TGT / NAV-02 inset **84** not stolen
- [x] HUD-04 8 s linger not retuned

No remaining Blocker/Major in the freeze.
