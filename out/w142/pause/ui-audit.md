## UI Audit: CTL-05 PR1 pause menu

### Summary

In-run P now shows a dialog named Paused with four named buttons and a P-to-resume legend. Hit targets meet 44 px. Color is not the only cue. LOAD while paused uses text. No Blocker or Major remain.

### What's done well

- `role="dialog"` and `aria-label="Paused"`
- Real `button type="button"` with labels RESUME, SETTINGS, BERTH RECORDS, TITLE
- Legend text: P to resume
- Focus ring on pause buttons (outline, not color-only)
- min-height 44px and min-width 44px
- Pause chrome does not steal `.screen-btn` / `.screen-panel` (Org01 owns screens.css origin classes)
- z ladder stays pause 50, berth 60, title 70, settings 80
- While settings, berth, or title cover, pause hits are off so the dim ring cannot press RESUME
- LOAD named-disabled: `LOAD — resume first`
- No new animation; reducedMotion is not ignored
- Title remount reuses live title overlay classes and capture KeyO/Escape pass-through

### Findings

#### Blocker

None.

#### Major

None.

#### Minor: Pause dim ring is not a control

**Location:** `src/main.js` pauseEl
**Issue:** Click on the pause scrim does not resume. Resume is RESUME or P. That matches the contract (named actions, not click-anywhere).
**Fix:** None.

#### Suggestion: First-button focus on open

**Location:** `src/main.js` setPaused(true)
**Issue:** Dialog does not move focus to RESUME. Keyboard users can Tab to the buttons. Enter on a focused button is native.
**Fix:** Optional later. Do not steal title or settings focus while those overlays cover.

### Honor hold

- Color is not the only on/off cue
- No screens.css write
- Settings expansion knobs not shown
