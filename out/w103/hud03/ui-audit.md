## UI Audit: HUD-03 remaining optional audio-alerts (Wave 103)

### Summary
The only new control is a KeyO checkbox on the existing settings dialog. The aim glass stays empty. Visual HUD-03 body classes stay the same.

### What's done well
- Copy is the authored string **HUD audio alerts**.
- Placement is after Reduced motion and before Mute all audio, so a11y stays one cluster.
- Native `<label>` wraps the checkbox and a text node. The name is the label text, same as sibling rows.
- No new body class. No speaker icon on `.rw-reticle`. No hub child.
- No new `@keyframes`. Reduced-motion still uses live `body.rw-reduced-motion` and the live family-emit skip.
- Default off. Mute all audio stays a separate row.

### Findings

No blocker or major.

#### 💡 Suggestion: No explicit `aria-label` on the new input
**Location:** `src/systems/settings.js` checkbox loop
**Issue:** The row is a wrapping `<label>`, so the accessible name is the text node. Same as Colorblind / Mute rows.
**Fix:** Do not add a one-off aria-label that sibling rows lack.
**Status:** open (accepted)

### Passed checks
- [x] Keyboard: KeyO still opens SETTINGS. Escape still closes. Checkbox is a native tab stop inside the dialog.
- [x] Contrast / type: same panel tokens (`#dce8f4` on `#101826`, accent `#6fd2e0`).
- [x] Hit target: same 15 px checkbox + full-row label as siblings.
- [x] Responsive: panel `max-width:92vw; max-height:82vh; overflow-y:auto` unchanged.
- [x] Empty hub: no alert widget inside `.rw-reticle`. RANGE stays TGT-01.
- [x] Incoming toast copy unchanged. No second toast.
- [x] Digit 0/8/9 chrome unchanged (this serial does not draw dock UI).

### Verdict
Pass. No UI chrome on glass.
