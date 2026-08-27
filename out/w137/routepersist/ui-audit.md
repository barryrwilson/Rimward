## UI Audit: NAV-11 chart-close dest keep leftover integrator

### Summary

No product UI ships in Wave 137. Leftover is **CONSUME**. Later player-facing freeze is **none**. Audit is of live Galaxy Chart dest keep (status, dest `<select>`, Autopilot no-route vs ready, HUD DEST) so a later worker does not add chrome or steal Digit/hub. Blocker/Major dest-drop UI is **not** live. Color-only dest, hub pip, pause-as-feedback, and plot-first while dest exists are forbidden. No Blocker/Major remain in the integrator freeze.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. No Vite. No Chrome. Domain is **data**. This file is the UI audit of the later freeze (none) plus live dest surfaces. Do not read this as “audit not available.”

### What's done well

- Dest named in **text**: chart status `{name} · {n} jump(s)` (`galaxychart.js` **1063**), labeled `<select id="rw-galaxy-dest">` (**269–278**), HUD DEST (`hud.js` **2434**).
- Autopilot no-route state is **named**: aria `Autopilot unavailable — plot a destination first.` only when `!navHasRoute` (**1129–1134**). Not color-only dim.
- Real Close `<button>` `aria-label` Close galaxy chart (**250–254**, **1197**). KeyM / Escape still close.
- Dest list has a visible `<label htmlFor="rw-galaxy-dest">` (**270–275**).
- Chart does not pause (`aria-modal=false` `galaxychart.js` **208**; CTL-02 never `flags.paused`).
- `reducedMotion`: CONSUME adds **no** new animation.
- HUD-01 80 px hub stays empty; no dest pip on the aim glass.
- NAV-06 still closes the full-screen map on Autopilot **button** success so dest keep does not trap the player behind the chart.
- `textContent` only. `innerHTML` none in `galaxychart.js`.

### Findings

#### 🔴 Blocker: Dest gone after close — **not live; CONSUME**

**Location:** inbox **207–210**; live `setOpen` **952–961**; `syncApButton` **1124–1134**  
**Issue:** Playtest saw missing `Veridian Reach · 1 jump` and plot-first.  
**Fix:** Census: bag stays; paint stays; AP not plot-first. Integrator must CONSUME, not add dest chrome.

#### 🟠 Major: Color-only dest keep — **resolved in freeze**

**Location:** honor `reducedMotion` / a11y  
**Issue:** A dest class without name would fail the inbox.  
**Fix:** Live status + select + HUD name dest. CONSUME adds no color-only cue.

#### 🟠 Major: Plot-first while dest exists — **not live**

**Location:** `galaxychart.js` **1129–1134** vs **1112–1116**  
**Issue:** That is the named AP copy hole.  
**Fix:** Live plot-first is idle-only. Frozen: do not retune AP copy as leftover.

#### 🟠 Major: Hub pip / extra overlay for dest — **resolved in freeze**

**Location:** HUD-01 empty hub  
**Issue:** A glass dest pip would fight HOME and the reticle.  
**Fix:** CONSUME adds none. Dest stays on chart + HUD DEST.

#### 🟠 Major: Keep chart open to “keep dest” — **resolved in freeze**

**Location:** NAV-06 `setOpen(false)` **1167–1168**  
**Issue:** Blocking close would trap flight behind the map.  
**Fix:** Close stays. Dest is the bag, not the overlay.

### 🟡 Minor: Autopilot button text is not the system name

**Location:** `galaxychart.js` **1127–1128**  
**Issue:** Player who only reads the button may not see `Veridian Reach`. Status line and dest list do.  
**Justification:** Do not retune AP button as NAV-11 leftover (NAV-03/05 copy). CONSUME.

### 🟡 Minor: Zoom/filter reset on close can look like “map forgot”

**Location:** `resetView` **805–814**; file header **26–27**  
**Issue:** Fitted view reset is NAV-09 session. Dest paint is independent.  
**Justification:** Do not persist zoom to “keep dest.” Cite NAV-09 only.

### 💡 Suggestion: Optional later REAL re-sync

If playtest still *sees* an empty dest `<select>` while HUD DEST names the system, `setOpen(true)` force `retargetPlot(true)` is enough. Not this wave.

### Specified later UI (CONSUME)

**Later UI = none.** If an owner re-opens after a true dest-drop census, PR1 (named only then) must:

- Keep real Close / Autopilot / dest `<select>` + visible label
- `textContent` dest names
- Plot-first only when idle
- Empty hub; no new Digit; no pause; no color-only dest
- Must not invert NAV-06 close
- `reducedMotion`: no new animation

**Re-audit after markdown lock:** still no Blocker/Major. CONSUME stands.
