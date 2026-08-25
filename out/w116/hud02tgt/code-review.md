## Code Review: HUD-02 PR1 target facing class tokens

### Summary
PR1 scopes player class CSS to `.rw-combat-self`, adds a separate allowlisted rail writer, and cites WAVE113/114 22×10 metrics on `.rw-combat-target`. One `#hud` class writer remains. No Blocker or Major.

### What's done well
- `classKeyToken` stays player-only. `lockClassToken` is a different helper.
- Write-on-change on `last.tgtClassKey`. Hide omits immediately.
- Fail closed omits unknown / proto / non-ship. Generic family facing still paints.
- WAVE113/114 boot greps now require `.rw-combat-self`. WAVE116 pin covers live mismatch, Q-ship cover, and hide omit.

### Findings

#### 🟡 Minor: Target CSS duplicates player metric blocks
**Location:** `src/ui/hud.css` WAVE116 target selectors
**Issue:** Mech plates and bio clips are copied under `.rw-combat-target`.
**Why it stays:** Contract §0.21 forbids new clip-path / plate art and requires cite of live metrics. Duplication is the cite.

#### 💡 Suggestion: `lockClassToken` is not exported
**Location:** `src/systems/hud.js`
**Issue:** Probe reimplements the formula.
**Why it stays:** HUD helpers stay private. Boot pin already exercises the live path.

### Passed Checks
- [x] No `state.js` write, no extra `SHIP_CLASSES` keys
- [x] No hub / reticle child
- [x] `hudFamily` still player-only
- [x] No second writer on `#hud.dataset.classKey`
- [x] No per-frame DOM alloc beyond write-on-change
