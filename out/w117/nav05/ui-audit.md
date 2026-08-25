## UI Audit: Wave 117 NAV-05 `#rw-galaxy-ap-live`

### Summary

PR1 paints existing chart live region only. No new chrome, no overlay restyle, no chip reason paragraph, no Autopilot `disabled` flip. Chart stays open on engage. Copy is sentence-case frozen literals.

### What's done well

- `#rw-galaxy-ap-live` keeps `role="status"` and `aria-live="polite"`.
- `showApLive` still sets `textContent` (never `innerHTML`).
- Chart Cancel writes `apLine('cancel')` immediately while `chartOpen`.
- Fly `disengage` consumes `autopilotDisengaged` and paints `apLine(reason)` after the 4s life timer check, so a new reason is not wiped the same frame.
- Unknown tokens stay blank (`apLine` miss). `restore` stays silent.
- Autopilot dim (`aria-disabled` + `is-dim`) is unchanged so refuse `apLive` still shows.

### Findings

No 🔴 Blocker or 🟠 Major findings.

#### 🟡 Minor: HUD toast still sits under the chart scrim

**Location:** `#hud` z-index 10 vs `.rw-galaxy-chart` z-index 30 (pre-existing)

**Issue:** `commLine` toasts remain under the overlay. Leftover law is the chart live region, not a toast z-index steal.

**Justification:** Contract forbids `hud.js` / `hud.css`. Sighted chart-open cancel is `#rw-galaxy-ap-live`.

#### 💡 Suggestion: Keep AP_LIVE_LIFE at 4s

Existing timer. Do not retune unless playtest PR2 asks.

### Recheck after review

No UI product fix. `chartStayOpen` and `chartCancelLive` true in WAVE117 pins.
