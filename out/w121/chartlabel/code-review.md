## Code Review: NAV-07 PR1 chart-label

### Summary
The patch matches the Wave 120 merge law. Labels, dest `<select>`, shared `activateSystem`, `isPlotTarget` hover inspect, and existing KeyM typing skip all land. No Blocker or Major findings.

### What's done well
- Shared `activateSystem` is the single plot path for disc, label, and dest change.
- `isHitDisc` stays as the disc predicate; `isPlotTarget` adds labels.
- Dest options build once at init. `retargetPlot` only writes `select.value`.
- Empty dest value is a no-op. Clear still calls `clearRoute`.
- `showApLive` and Autopilot success `setOpen(false)` are untouched.
- Hover uses `applyHoverId` only. `hoverModel` body is not rewritten.

### Findings

#### 🟡 Minor: `htmlFor` and `setAttribute('for')` are duplicate
**Location:** `src/systems/galaxychart.js:198–199`
**Issue:** Both writes set the same `for` association.
**Fix:** Optional keep-one. Not required for play.
**Justification:** Headless stub and live DOM both need a visible label association. Harmless duplicate.

#### 💡 Suggestion: Dest sync skip when `retargetPlot` early-returns on identity
**Location:** `src/systems/galaxychart.js:542–545`
**Issue:** If `force` is false and `plotIdentity()` matches, the select is not rewritten.
**Fix:** None. User change already forces retarget. Property write stays off the hot path.
**Justification:** Contract forbids per-frame option rebuild; identity skip is live plot overlay cost.

### Passed
- HIT discs stay 24 CSS px
- No SVG `tabindex` / `role=button` on labels
- No autofocus on open
- No plot on hover
- No KeyJ / Digit / `controls.js` / `state.js` / overlay-policy body
- Probe: `node --import ./scripts/with-css-stub.mjs out/w121/chartlabel/probe.mjs` PASS

### Method
Self-applied `reviewer` persona + orchestrator `code-review.md` to the PR1 diff. No subagent spawn.
