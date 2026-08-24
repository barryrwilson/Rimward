## UI Audit: Wave 104 REP-05 covering + inbound jump refuse toasts

### Summary
Player-facing copy is two authored `commLine` strings. HUD already toasts `commLine` with `textContent`. No new hub child, Digit, hail card, or CSS. No live covering screenshot this wave.

### What's done well
- `Patrol covering.` and `No passage.` are short, distinct, and do not reuse `Leave this space.` or `No sale.`
- Once per visit (covering) and once per dest per visit (jump) stop KeyG / tick spam.
- Toast class stays `comm`. Reduced-motion toast CSS is unchanged.
- 80 px hub stays empty of ally pips and lock discs.
- Digit 0 remains shipyard. Digit 8/9 unchanged. PR3 Digit 9 copy waits.

### Findings

No Blocker or Major UI issues.

#### 💡 Suggestion: Digit 9 still does not explain covering or jump refuse
**Location:** `src/systems/station.js` `standingLiveNotes` (untouched)
**Issue:** Standing pane does not list the new lines. Contract names that as PR3 after sim exists.
**Fix:** PR3. Do not steal Digit 9 this wave.

### Passed
- [x] No `innerHTML`
- [x] HUD toast `slot.el.textContent = text` (`hud.js` 1130)
- [x] No new HUD node, CSS class, or aim-glass child
- [x] No chart lock box / NAV `blocked` reuse
- [x] Keyboard: KeyG still jump; refuse is a no-op, not a new key
- [x] Dock UI still opens when Marked (dock is not standing-gated)

### Method
Self-applied `orchestrator/references/ui-audit.md`. Did not spawn [designer]. Empty hub. No new Digit. textContent toast path only.
