## UI Audit: NAV-07 PR1 chart-label

### Summary
Labels are now hit targets. One named Destination `<select>` sits under the description. Focus ring matches chart buttons. No Blocker or Major findings.

### What's done well
- Visible `<label>` “Destination” with `htmlFor="rw-galaxy-dest"`.
- Dest control is under `#rw-galaxy-chart-desc`. Clear / Autopilot / Close stay in the top actions row.
- `:focus-visible` on `.rw-galaxy-dest` uses the same accent outline as chart buttons (`outline: 2px`, offset 2px).
- Select `min-height: 24px`. Discs stay 24 CSS px. Effective target grows by the label glyph, not by a huge disc.
- No chart z-index raise. No toast CSS change. No dest-list animation. `reducedMotion` rule is unchanged.
- Color is not the only cue: dest options are names; labels stay text.

### Findings

#### 🟡 Minor: Native dest list is long (~101 charted ids)
**Location:** `src/systems/galaxychart.js:207–227`
**Issue:** A native `<select>` typeahead is the frozen keyboard path. The list is long on a small viewport.
**Fix:** None in PR1. Contract forbids a custom listbox and SVG tab trap.
**Justification:** Smallest additive a11y. Generated unlabeled systems need names.

#### 💡 Suggestion: Dest field has no `min-width: 24` on the label text
**Location:** `src/ui/hud.css:2030–2036`
**Issue:** The label is text, not a 24×24 control. The select meets 24 px min-height.
**Fix:** None. Buttons already keep 24 px in the top row.
**Justification:** WCAG 2.5.8 applies to the select, which is 24 px tall.

### Passed
- No autofocus on chart open
- No focus trap
- No `tabindex` on SVG labels
- Escape still closes while dest is focused
- KeyM typeahead on the select does not close the chart
- Hover inspect does not plot
- Autopilot / Close not covered by dest layout

### Method
Self-applied orchestrator `ui-audit.md` checklist. Did not spawn `[designer]`.
