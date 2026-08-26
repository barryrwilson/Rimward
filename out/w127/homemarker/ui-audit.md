## UI Audit: HUD-06 PR1 home-station marker

**Method:** self-applied checklist `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Did not start Vite.

### Summary

Player-facing pad cue is a square cyan pip + distinct chevron + POS `HOME` distance text. Hub stays empty. Threat amber triangle and NAV-02 ticks are unchanged. Color is not the only cue.

### What's done well

- Square pip (no 45° diamond) vs chartmarks; open chevron vs filled amber TGT triangle vs gate ticks.
- POS label `HOME` and value `Name · 8.9k` / `Nu` sit on the existing POS panel (`rw-fade` in combat).
- On-glass marks `aria-hidden`; POS row stays visible whenever the cue is allowed.
- `pointer-events: none`. No hub child. No toast. No pulse / `@keyframes`.
- Combat opacity 0.14 on `.rw-home-mark` matches chartmarks.
- Long names ellipsis on `.rw-pos-home .rw-value`.
- Overlay hide: docked, jump, hail, chart, berth. Station lock hides pip/chevron only.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: On-glass dist chip can clip at screen edge

**Location:** `src/ui/hud.css:644-668`; `hud.js` pip transform  
**Issue:** Label sits to the right of the 8 px square. A pad projected near the right edge can clip the chip.  
**Fix:** POS HOME remains. Optional later: mirror the chip.  
**Status:** accepted for PR1.

#### 💡 Suggestion: Chevron size vs TGT 84 px seat

**Location:** `HOME_EDGE_INSET = 108`; chevron 18×18  
**Issue:** Three cues on one bearing still sit on different insets (84 vs 108). Playtest may want a larger chevron.  
**Fix:** Do not move TGT/NAV-02. Tune size after stills (optional PR2).  
**Status:** locked inset 108.

### Accessibility checklist

- [x] Distance named in text (`HOME` + `u`/`k`)
- [x] Color is not the only cue (square vs triangle vs ticks)
- [x] On-glass mark `pointer-events: none`
- [x] Decorative marks `aria-hidden`; POS row is the name
- [x] `reducedMotion`: no pulse
- [x] Combat: dim, not hide
- [x] HUD-01 80 px hub empty of home chrome
