## UI Audit: Wave 114 HUD-02 PR1 plated class silhouettes

### Summary
Class identity is a static triangle+square hint inside the live 22×10 facing sil. No hub child, no pip, no bio clip-path, no fill-color cue, no new motion. Fail-closed unknown keys keep the generic family plate.

### What's done well
- Geometry is border-triangle + square metrics only. No mech `clip-path`. No Earth tank / wet-navy photocopy.
- Light plated keeps the live generic plate (nose 5 / body 5,2,16×6).
- Heavy reads taller (16×8) without extra length. Freighter reads tall and longer (18×8, nose 3). The two do not match.
- Ace is a shorter/narrower plate. Cutter/frigate look longer only by shrinking the nose and giving the body the spare px. Sil width/height/flex-basis stay 22×10.
- FORE/AFT words stay. RANGE stays on the 80 px hub. No new `.rw-reticle` node.
- Visual restyle is CSS-gated to `#hud[data-family="mech"]`. Bio still paints the organism + sibling tokens.
- `reducedMotion`: no new `@keyframes` on class facing. Static plate only.
- Same accent rgba as the live mech plate; color is not the class cue.

### Findings

No 🔴 Blocker or 🟠 Major findings.

#### 🟡 Minor: thin-class nose vs body height
**Location:** `src/ui/hud.css:1294-1324` (ace, frigate)
**Issue:** Ace and frigate bodies are 4 px tall. The inherited mech nose triangle is 6 px tall (`border-top/bottom: 3px`). At 22 px the join is slightly proud of the plate.
**Fix:** Playtest may set matching vertical nose borders. Do not grow the sil.
**Status:** accepted for PR1 — contract table freezes `border-right` only

#### 💡 Suggestion: confirm glance at 1600×900
**Location:** overlay `.rw-facing-sil`
**Issue:** This worker did not capture live stills (Node probe only; Vite/Chrome not started).
**Fix:** Optional PR2 stills after playtest (contract §3).
**Status:** out of PR1

### Accessibility / states
- No new control, so no new name/focus/keyboard need.
- Contrast inherits the live mech plate token. Class is shape, not color, so color-blind mode still reads the plate metrics.
- Unknown / missing classKey: generic mech plate if family is mech; generic/sibling bio if family is bio. Game does not freeze.
- Empty hub: still 80×80 with pupil, cilia, RANGE only.
