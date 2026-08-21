## UI Audit: Wave 83 incoming dart toast

### Summary
Warning is one off-column toast plus a song sting. Aim glass does not gain a node.

### What's done well
- Copy is the authored literal `Incoming dart.`
- `pushToast` writes `textContent`
- `DART_TOAST_GAP = 2.5` plus toast key reuse blocks a five-slot flood
- Cannon `npcFire` still does not toast
- FORE/AFT stays on `playerHit`

### Findings

No Blocker or Major issues.

#### 🟡 Minor: Warn class on inbound copy
**Location:** `src/systems/hud.js` `toastForEvent` `npcFire`
**Issue:** Uses existing `.warn` class, not a new dart class.
**Fix:** None this slice. Reuse keeps glance law.

#### 💡 Suggestion: Screen-reader live region
**Location:** `#hud .rw-toasts` `aria-live=polite`
**Issue:** Existing toast region announces the line. No new live region.

### Verdict
UI contract holds. No inbound gauge, lock box, or aspect ring.
