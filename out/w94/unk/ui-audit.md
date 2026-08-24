## UI Audit: Wave 94 Unknowables Archive papers + People

### Summary
Archive at The Quiet reuses the Market confirm-papers family. People shows Voice-Without with `portraitFor('unknowables', id)`. Reduced-motion keeps the same prices and No-sale copy. No Blocker or Major defects after the `aria-live` notice fix.

### What's done well
- Real `<button>`s (`btn()` → `type="button"`) for File buy, File from the hold, Confirm filing, Esc — Cancel.
- Own crystal 400 and rival cube 900 are written as numbers in the header, not color-only signals.
- Hostile dock shows `No sale.` and hides buy/sell arms.
- Captured own crystal shows the illegal-in-origin line; no Confirm on that row.
- Assembly desk copy is unchanged (legal cubes / does not buy crystals).
- Unknowables desk copy mirrors it (legal crystals / does not buy cubes).
- People uses existing portrait markup: 64×64, `alt` with name and role, lazy decode.
- Reduced-motion header still names UU amounts (`Legal crystals 400 UU. Rival cubes 900 UU.`).
- `ui.notice` now has `aria-live="polite"` on the station notice node.

### Findings

#### 🟡 Minor: galaxy map node for The Veil has no name
**Location:** `src/systems/galaxychart.js` (outside write-set)
**Issue:** The system is on the chart via `SYSTEMS.veil.chart`, but authored labels skip it.
**Why it matters:** Players can still reach The Quiet through the hush gate. The map does not say the name.
**Fix:** Later write-set: add `veil` to `AUTHORED_IDS`.

#### 💡 Suggestion: Archive lives on Digit 1 Market, not its own Digit
**Location:** `src/systems/station.js` `renderMarket` → `renderArchiveDesk`
**Issue:** Spec forbids a new Digit. The desk is a Market block, same as Assembly.
**Fix:** None.

### Contrast / motion
- Papers use existing `.screen-btn` / `.screen-btn-warm` / `.screen-note`.
- Confirm is the warm primary; Cancel is the default button.
- Reduced-motion does not hide the desk or the notice.

### Verdict
No Blocker or Major. Archive papers and People meet Wave 94 Unknowables dock chrome.
