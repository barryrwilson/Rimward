## UI Audit: NAV-03 Autopilot chart button + in-flight chip (Wave 85)

**Auditor:** `[designer]` (independent of `out/w85/ap/ui-audit.md` — do not rubber-stamp)  
**Scope:** Chart Autopilot button, chart header live region, in-flight `.rw-autopilot` chip. Files: `src/systems/galaxychart.js`, `src/systems/hud.js` (chip only), `src/ui/hud.css`.  
**Contract:** `out/w84/nav03/shared-contract.md` §8 (wins).  
**Method:** Static checklist (orchestrator `ui-audit.md` / designer occupancy law used in prior Wave 84–85 designer audits). Worker self-audit `out/w85/ap/ui-audit.md` was read, not treated as gospel. No Playwright. [NO BROWSER COVERAGE].  
**Date:** 2026-08-21  
**Status of this pass:** review only. No `src/` edits.

### Summary

Chart Autopilot is a real `type="button"` in a header cluster with Close. Native `disabled` is only the empty plot. MATCH and other dest-present refuses stay clickable (`aria-disabled="true"`) and print frozen English on a chart header `role="status"` node above HUD toasts (`z-index` 10 vs chart 30). The in-flight chip is `#hud .rw-autopilot` at `top: 14px` center. It is not the banner, jump bar, NAV-02 readout, or 80 px hub. No `innerHTML`. Space `preventDefault` is only on those two buttons. Digit 0–9 and KeyM are not stolen. No 🔴 Blocker and no open 🟠 Major. Verdict **CLEAN**.

### What's done well

- Autopilot is `<button type="button">` in `.rw-galaxy-ap-cluster` with × (`galaxychart.js:141–161`). Cluster is `display: flex; gap: 8px` (`hud.css:1614–1618`). Shared hover / `:focus-visible` with Close and Clear (`hud.css:1630–1668`). `min-height` / `min-width` 24 px.
- Control stays in the header while the chart is open. Hide is only `.rw-galaxy-chart.is-hidden`. No dest uses native `disabled` plus `aria-label` `Autopilot unavailable — plot a destination first.` (`galaxychart.js:486–512`).
- Idle + dest label **Autopilot**. Flying label **Cancel autopilot**. `textContent` and `aria-label` stay in sync (`galaxychart.js:489–499`).
- Refuse-worthy with a dest (MATCH, docked, jumping, paused, combat, hull, here, missing hop) stays clickable. `aria-disabled="true"` + `.is-dim`. No native `disabled`. Click calls `tryEngage`, writes §8.3 via `apLine` to `showApLive`, and emits `commLine` (`galaxychart.js:505–530`).
- Header live region `#rw-galaxy-ap-live` is `role="status"`, `aria-live="polite"`, `id` for `aria-describedby`, `textContent` only, 4 s (`AP_LIVE_LIFE = 4`, `galaxychart.js:134–149`, `465–472`). Chart root is on `document.body` at `z-index: 30` (`hud.css:1555–1565`; `style.css:24–28` HUD `z-index: 10`). MATCH copy is `Autopilot refused — MATCH is on.` (`autopilot.js:20`). Do not rely on `#hud .rw-toast` as the visible reporter.
- `galaxychart.js` has no `innerHTML` and no `preventDefault`. Space guard is `guardAutopilotSpace` in `autopilot.js:245–247` (`code === 'Space'` only). Listeners are the chart AP button and the chip Cancel (`galaxychart.js:150`; `hud.js:953`). Activate is click or Enter. Afterburner may still fire.
- Window chart keys are still KeyM / Escape only (`galaxychart.js:551–561`). No Digit bind. Autopilot does not steal KeyM.
- Chip is `el('div', 'rw-autopilot is-hidden', root)` on `#hud`, not inside `.rw-bottom` / `.rw-nav-readout` (`hud.js:946–954`). CSS pin matches §8.2: `position: absolute; top: 14px; left: 50%; transform: translateX(-50%)` (`hud.css:602–607`). Banner is `top: 96px; right: 14px` (`hud.js:601–604`). Jump is `left: 50%; top: 50%` (`hud.js:636–640`). Hub reticle is 80×80 (`hud.css:181–187`). NAV-02 is `.rw-side-col` above POS (`hud.js:875–907`) and hides while `docked` / `jumping` (`hud.js:1522–1536`). Chip does not.
- Chip root class is `.rw-autopilot` only (plus `is-hidden`). No `.rw-fade`, `.rw-aux`, `.rw-chartmark`. Combat fade (`hud.css:88`, `866`) does not dim Cancel.
- `pointer-events: none` on the chip; `auto` on Cancel (`hud.css:614`, `630–631`). Gate fade is already `pointer-events: none` (`gate.js:486`). Cancel still works during `gate.jumping`.
- Names use `apDestName` / `apNextName` → `SYSTEMS[].name` via `navSystemName` (`autopilot.js:450–455`; `hud.js:1808–1815`). Remaining is NAV-01 `remaining`. `el()` writes `textContent` (`hud.js:230–235`). No `innerHTML` in `hud.js`.
- Contrast lists `.rw-autopilot` beside `.rw-jump` (`hud.css:1091–1098`). No chip `@keyframes`. `body.rw-reduced-motion #hud *` already kills HUD animation (`hud.css:1108–1111`).
- Tab order: CONTROLS toggle is created first (`hud.js:928–929`), then chip Cancel (`hud.js:946–954`). Helm is the eyes-on-glass cancel. No new letter.

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: Header live region still shares the title/actions row

**Location:** `src/systems/galaxychart.js:118–164`; `src/ui/hud.css:1589–1628`  
**Issue:** Title, `apLive`, and actions sit in one `space-between` header. Live node is `flex: 1; min-width: 0`. Long §8.3 lines (`Autopilot refused — already in the destination system.`) can wrap at `--rw-text-scale: 1.5` on a `92vw` panel. Copy stays on the chart, not under HUD toasts. Worker U-audit already named this.  
**Fix:** Keep shrink. Optional later: second header line under the title. Do not toast MATCH under the overlay.  
**Status:** open (not occupancy of HUD-01 rails)

#### 🟡 Minor: Native `disabled` Autopilot has no `:disabled` paint

**Location:** `src/ui/hud.css:1630–1668`; `src/systems/galaxychart.js:491–496`  
**Issue:** Empty plot correctly uses native `disabled`. Shared rules set `color: var(--white)` and `cursor: pointer`. Dim paint is only `.is-dim` / `[aria-disabled='true']`. Author styles can keep a no-route Autopilot looking armed. Click is a no-op (correct). Sighted empty-state is weaker than MATCH dim.  
**Fix:** Add `.rw-galaxy-ap:disabled { color: var(--dim); opacity: 0.7; cursor: default; }`. Do not use native `disabled` for MATCH.  
**Status:** open

#### 💡 Suggestion: Chip names have no max-width / ellipsis

**Location:** `src/ui/hud.css:602–628`; CONTROLS `hud.css:1015–1019`; toasts `hud.css:589–593`  
**Issue:** Dest, next, and remaining are `white-space: nowrap` with no cap. On a short viewport they can meet CONTROLS (`top: 14px; left: 14px; max-width: 280px`) and toasts (`top: 14px; right: 168px`). They still miss HUD-01 rails (`top: 57%`) and NAV-02. Wave 84 freeze already flagged this.  
**Fix:** Ellipsis names. Keep Cancel as the last flex child. Do not move the pin.

#### 💡 Suggestion: Chip fields are unlabeled

**Location:** `src/systems/hud.js:946–949`  
**Issue:** Three dim spans carry dest name, next name, and remaining with no DEST / NEXT / JUMPS labels. NAV-02 already labels those in the side column when not jumping. Chip is the jump-safe copy.  
**Fix:** Optional prefixes or `aria-label` on the chip root. Do not mount Cancel inside `.rw-nav-readout`.

#### 💡 Suggestion: `hud.js` still says CONTROLS is the only HUD click

**Location:** `src/systems/hud.js:926–927` vs `hud.css:1023`  
**Issue:** Comment above the CONTROLS toggle is stale. CSS comment already names chip Cancel as the other HUD click.  
**Fix:** Align the `hud.js` comment. Not a player-facing defect.

### Occupancy

| Surface | Used by AP chrome? |
|---|---|
| 80 px hub / reticle (`hud.css:181–187`) | No |
| `.rw-banner` top-right (`hud.js:601–604`) | No |
| `.rw-jump` center (`hud.js:636–640`) | No |
| HUD-01 combat rails `top: 57%` ±78 px (`hud.css:820–838`) | No |
| NAV-02 `.rw-nav-readout` (hides docked/jumping) | No (kept; chip is separate) |
| `#hud .rw-toasts` `top: 14px; right: 168px` | Secondary `commLine` only; not the chart MATCH reporter |
| Chart header (`z-index: 30`) | Autopilot + live region + Close |
| Top-center empty band | `.rw-autopilot` chip |

### Contract check (static)

| Freeze | Result |
|---|---|
| `type="button"` in header cluster with Close | Pass (`galaxychart.js:141–159`) |
| Always show Autopilot while chart open | Pass |
| Native `disabled` only no dest / no route | Pass (`navHasRoute`, `galaxychart.js:474–496`) |
| Refuse-worthy stays clickable + `aria-disabled` | Pass |
| Header live region is visible MATCH refuse (not HUD toast under z-index 30) | Pass |
| Chip `#hud .rw-autopilot` `top: 14px; left: 50%` | Pass (`hud.css:602–607`) |
| Not banner / jump / NAV-02 / hub | Pass |
| `pointer-events` none on chip, auto on Cancel | Pass |
| No `innerHTML`; `textContent` | Pass |
| Space `preventDefault` on those buttons only | Pass (`guardAutopilotSpace`) |
| Digit 0–9 / KeyM not stolen | Pass |
| Contrast list includes `.rw-autopilot` | Pass |
| Chip not `.rw-fade` / `.rw-aux` / `.rw-chartmark` | Pass |

### Focus / a11y checklist

- [x] Named controls; chart `aria-label` tracks label; chip `aria-label="Cancel autopilot"`
- [x] Chart-open MATCH refuse on header `role="status"` (`aria-describedby`)
- [x] `aria-disabled` is boolean, not English
- [x] Native `disabled` only for empty plot
- [x] Keyboard: Space does not activate AP/Cancel; Enter/click do; no Digit/KeyM steal
- [x] `:focus-visible` on chart AP and chip Cancel
- [x] No `innerHTML`
- [x] Names from `SYSTEMS[].name`
- [ ] Native `:disabled` paint (🟡 above)
- [ ] Chip name overflow on narrow viewports (💡)

### Worker self-audit

`out/w85/ap/ui-audit.md` agrees: no 🔴 / 🟠. Its 🟡 (live region wrap) still stands. This pass adds the empty-state `:disabled` paint gap the worker did not name. Live shot `out/w85/ap/live/01-chart-ap.png` shows Clear / Autopilot / Close in the header cluster. `02-match-refuse.png` in that folder is a title-screen capture, not a MATCH live-region pin; MATCH visibility is judged from source (`showApLive` + `AP_LINES.match`), not that PNG.

### Verdict

**CLEAN.** No 🔴 Blocker. No open 🟠 Major. Remaining notes are 🟡 wrap / `:disabled` paint and 💡 overflow / labels / comment.
