## UI Audit: Wave 94 PWR bar

### Summary
A PWR bar sits in `.rw-side-col` with label `PWR`. The aim glass has no new pip, ring, gauge, or bar. Reduced-motion still shows the fill; this slice adds no extra pulse.

### What's done well
- Same `makeBar` pattern as STRAIN / HUNGER (label + track + fill, change-cached width).
- Fill color uses `--cyan` (token), distinct from STRAIN amber.
- Label `PWR` is the name; color is not the only signal.
- `.rw-aux` keeps the bar readable in combat (opacity 0.38, not hidden).
- Global `body.rw-reduced-motion #hud *` already kills bar width tweens. No new `@keyframes` on `.rw-power`.
- Reticle / lead markup is unchanged.

### Findings

#### 🟡 Minor: PWR is a short untitled panel
**Location:** `src/systems/hud.js` (`.rw-power-panel` in `.rw-side-col`)
**Issue:** Plant / Flight / Heat have panel titles. PWR is a lone meter above Bio.
**Why it matters:** The bar still reads (label `PWR`). Spec asked for that label, not a second title.
**Fix:** None required unless a later HUD pass groups PWR with Plant.

#### 💡 Suggestion: no low-power word beside the bar
**Location:** `src/systems/hud.js` powerBar.set
**Issue:** Afterburner refusal is pool-only; the bar does not show READY/LOW text.
**Fix:** Optional. Spec did not ask for extra copy. BURN still shows READY when the burn does not start.

### Contrast / motion
- High-contrast already darkens `.rw-bar` tracks.
- Colorblind palette remaps `--rw-accent` / `--cyan`; the PWR fill follows.
- Reduced-motion: width still writes every change; no pulse class.

### Verdict
No Blocker or Major. HUD meets Wave 94: PWR in the side column, nothing new on the aim glass.
