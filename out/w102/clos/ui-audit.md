## UI Audit: TGT-03 remaining CLOS rate (Wave 102)

### Summary
CLOS sits on `.rw-combat-target` after DIST. The 80 px hub stays empty. Meaning is the label plus signed `u/s` text, not color. No Blocker or Major findings.

### What's done well
- Label `CLOS` via `el()` / `textContent`.
- Class `.rw-combat-clos` on the rail value only (not contacts / reticle / lead / gate cue).
- Deputize `+N u/s` / `-N u/s` / `0 u/s`. No rail «/».
- `font-variant-numeric: tabular-nums` so width stays stable.
- No new `@keyframes`. `body.rw-reduced-motion` already kills HUD anim; the number still updates.
- Scanner 0 still shows DIST+CLOS on a live ship lock; Mk II «/» stays on `.rw-contacts`.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 💡 Suggestion: Contrast tokens
**Location:** `src/ui/hud.css` `.rw-combat-clos`
**Issue:** The value inherits `.rw-value` color. Colorblind / contrast body classes already recolor the rail.
**Fix:** None required. `CLOS` + sign + `u/s` carry the state.

### Verdict
Glance is honest: live ship lock only; rocks / TGT-05 kinds keep the rail hidden.
