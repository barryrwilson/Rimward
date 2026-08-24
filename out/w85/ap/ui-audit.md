# UI Audit: Wave 85 NAV-03 PR6 chart button + in-flight chip

### Summary

Chart header shows Autopilot / Cancel autopilot in a cluster with ×. Refuse uses a header live region (`role="status"`, 4 s) plus `commLine`. In-flight chip is top-center `.rw-autopilot` with dest, next, remaining, and Cancel. NAV-02 readout / cue / ring are unchanged.

### What's done well

- Native `disabled` only with no dest/route. MATCH with a dest stays clickable (`aria-disabled`).
- Frozen English §8.3 on the chart live region for MATCH refuse.
- Space on AP/Cancel calls `guardAutopilotSpace` (`preventDefault` lives in `autopilot.js` so WAVE85 chart `noPrevent` on `galaxychart.js` still holds).
- Chip CSS pin: `#hud .rw-autopilot { top: 14px; left: 50%; transform: translateX(-50%); }`.
- `pointer-events: none` on the chip; `auto` on Cancel.
- Contrast lists `.rw-autopilot` beside `.rw-jump`.
- Tab order: CONTROLS toggle, then chip Cancel (chip is created after the toggle).

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: Header live region shares the header row

**Location:** `galaxychart.js` header (`apLive` between title and actions)  
**Issue:** Long refuse lines can wrap at large `--rw-text-scale`. Copy remains readable.  
**Fix:** Keep flex shrink. Do not toast under the chart.

### Occupancy

| Surface | Used? |
|---|---|
| 80 px hub / reticle | No |
| `.rw-banner` top-right | No |
| `.rw-jump` center | No |
| NAV-02 `.rw-nav-readout` | No (kept) |
| Chart header | Autopilot + live region |
| Top-center empty band | Chip |

### Recheck
Live: plot Veridian, Autopilot engages, Cancel keeps dest, MATCH prints `Autopilot refused — MATCH is on.` on the chart live region. No teleport (`currentSystem` stayed `freehold`).
