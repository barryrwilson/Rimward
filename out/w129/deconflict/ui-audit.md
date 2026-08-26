## UI Audit: HUD-07 PR1 deconflict + quieter cruise

### Summary

Central sight yields duplicate name/RANGE/LEAD words and overlapping chart/home **labels**. Exploration fades those combat-only words. HOME pip, GATE cue, dock J, POS, TGT arrow, and the 80 px hub stay. No new pulse. Color is not the only cue (hide + remaining DIST / ring / glyph).

Applied `ui-audit.md` locally. Did not spawn [designer]. Did not restyle `.rw-galaxy-*`.

### What's done well

- `#hud .rw-yield { display: none }` hides copy without deleting pooled nodes.
- `#hud:not(.in-combat)` only quiets `.rw-reticle-range` and `.rw-lead-label`. Career fade numbers for `.rw-fade` / `.rw-aux` / chart / home stay.
- `.in-range` hub ring and `.rw-lead-ring` remain the shape cue when words yield.
- POS HOME remains when the pip label yields.
- `body.rw-reduced-motion` already kills HUD animation; PR1 adds no `@keyframes`.
- Contrast/colorblind still have text or shape for range (rail DIST / ring) and home (POS + square pip).

### Findings

#### 🟡 Minor: Cruise RANGE/LEAD CSS fade is usually covered by JS yield

**Location:** `src/ui/hud.css` `#hud:not(.in-combat) .rw-reticle-range`
**Issue:** With a ship lock, JS already `display:none`s those words, so the 0.14 opacity is a fail-closed backup.
**Fix:** Keep both. Backup is the skip path.

#### 💡 Suggestion: Label yield can leave a flex gap on chartmarks

**Location:** `.rw-chartmark` flex + `.rw-chartmark-label.rw-yield`
**Issue:** `display:none` on the label collapses the text; the diamond stays. Gap to an empty label goes away, which is the desired keep-glyph read.
**Fix:** None.

### Verdict

No Blocker/Major. Sight picture is quieter in cruise and deconflicted on a centered ship lock without stealing HUD-06/TGT/NAV-02.
