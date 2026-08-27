## UI Audit: Onb01 PR1 first-minute flight lesson

### Summary

PR1 meets the honor list: CONTROLS starts collapsed on demand, one polite hint node sits outside the 80 px reticle, and tokens cover scale, contrast, and reduced-motion. Color is not the only cue. No Blocker or Major remains. Worker `out/w142/onb01/ui-audit.md` is directionally right; stacking of the chip vs the encyclopedia is the reverse of that note.

### What's done well

- Encyclopedia default is on demand: `controlsCollapsed = true` at init, label `CONTROLS ▸`, list hidden with `display:none` (`src/systems/hud.js:1291–1307`, `src/ui/hud.css:1219`).
- Toggle is a real `<button type="button">`. Click still expands the 19-line `<ul>` built with `el()` + `textContent` (`src/systems/hud.js:319–324`, `1291–1310`).
- `aria-expanded` follows the collapse flag on init (`applyControlsCollapse()`), click, and combat collapse (`src/systems/hud.js:1302–1310`, `2280–2282`).
- Collapse cue is words (`▸` / `▾`) plus `display:none`, not color-only (`src/systems/hud.js:1303–1305`, `src/ui/hud.css:1219`).
- Optional `:focus-visible` ring is present and matches autopilot (`src/ui/hud.css:1199–1204` vs `782–789`).
- One `.rw-onboard-hint` node. Same node gets `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. `pointer-events: none`. Not a modal. Not a second list (`src/systems/onboarding.js:112–117`, `165`).
- Reparent keeps that node off the 80 px reticle (`src/systems/hud.js:1002–1005`, `1313–1319`; reticle size `src/ui/hud.css:184–189`).
- Hint paint is `textContent` only. Fail-closed `try` around show/update/when (`src/systems/onboarding.js:150–171`, `212–266`).
- Lesson order is look → throttle → target → hail → dock → chart, origin-gated, one at a time. `move` is gone (`src/systems/onboarding.js:52–70`, `246–261`).
- Contextual `gate` / `combat` / `mine` / `feed` / `repair` / `saved` stay (`src/systems/onboarding.js:71–88`).
- Tokens: `font-size: calc(11px * var(--rw-text-scale, 1))`; panel uses `var(--panel)`; color uses `var(--cyan, …)` not an inline `#6ff2e0` (`src/ui/hud.css:1223–1237`).
- Contrast selector includes `.rw-onboard-hint` even as a body child (`src/ui/hud.css:1282–1292`). Colorblind sets `--rw-accent` on the hint (`1294–1296`).
- Reduced-motion includes `.rw-onboard-hint`, not only `#hud *` (`src/ui/hud.css:1305–1311`). Collapse is `display:none`. No new animation.
- Combat dim uses `.rw-fade` on CONTROLS; the hint is not faded, so the rail stays readable (`src/systems/hud.js:1290`; `src/ui/hud.css:89`, `1223–1237`).
- If `#hud` is missing, HUD copies `textScale` onto the body-owned node and does not throw (`src/systems/hud.js:979–991`).

### Honor (contract)

| Rule | Status | Cite |
|---|---|---|
| Encyclopedia collapsed default | Pass | `hud.js:1301–1307` |
| One hint node | Pass | `onboarding.js:112–113`; one `querySelector` reparent |
| Not the 80 px reticle | Pass | `hud.js:1318–1319`; `hud.css:184–189`, `1221–1226` |
| Polite live region on the same node | Pass | `onboarding.js:114–116` |
| Tokens: scale / contrast / reduced-motion | Pass (see Minor on live scale inherit) | `hud.css:1223–1237`, `1282–1311` |
| `aria-expanded` on init / click / combat | Pass | `hud.js:1305–1310`, `2280–2282` |
| Color not the only cue | Pass | text copy; `▸`/`▾` + `display:none` |
| No second list | Pass | one `<ul>` in CONTROLS; hint is a single `div` |

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: Lesson chip sits on the encyclopedia list (z-index), not under it

**Location:** `src/ui/hud.css:1223–1227` (`top: 48px; z-index: 35`) vs `.rw-controls` (`src/ui/hud.css:1179–1184`, no z-index)
**Issue:** Collapsed header and chip share top-left. Worker audit said the expanded list would cover the chip. The chip has `z-index: 35` and is appended after CONTROLS (`hud.js:1319`), so the chip paints **on** the first encyclopedia lines while a hint is visible.
**Why it matters:** A pilot who opens CONTROLS during the 8 s card cannot read the top bind rows.
**Fix:** Do not move the chip to bottom-center (HUD-07 / contacts). Contract keeps this slot. If a later pass is allowed, raise `.rw-controls` when expanded, or pin `top` under the expanded panel. Not required for PR1: default is collapsed; dump fix is the collapse.

#### 🟡 Minor: Inline `--rw-text-scale` on the hint blocks live inherit after reparent

**Location:** `src/systems/onboarding.js:118–122`; live writer is `#hud` only (`src/systems/settings.js:69–73`)
**Issue:** Reparent exists so `--rw-text-scale` inherits from `#hud` (`hud.js:1313–1315`). Init always copies the current scale onto the node. After a successful reparent that inline property wins over `#hud`. A later settings change updates `#hud` and not the chip. Body fallback copy (`hud.js:1321–1325`) is correct.
**Why it matters:** Contextual hints after the first minute can stay at boot scale while the rest of the HUD resizes.
**Fix:** After `root.appendChild(hintNode)`, `removeProperty('--rw-text-scale')`. Keep the copy only when the parent stays `body`.

#### 🟡 Minor: Any-key dismiss can skip the look card while steering

**Location:** `src/systems/onboarding.js:205–207`, `150–157`
**Issue:** First lesson is mouse-look. The next key (including W/A/S/D) calls `hide()`.
**Why it matters:** A new pilot can skip look/turn before they read it.
**Fix:** Contract keeps 8 s or any-keydown. Do not add a confirm control (would steal focus / pointer-events). Leave as documented.

#### 💡 Suggestion: Hint has no max-width

**Location:** `src/ui/hud.css:1223–1237` vs `.rw-controls { max-width: 280px }` (`1179–1184`)
**Issue:** Combat copy is a long single node (`onboarding.js:74–76`). At large `--rw-text-scale` the chip can stretch toward the aim column.
**Fix:** Optional `max-width` in the same 280 px band as CONTROLS. Wrap is already default. Not a dump.

#### 💡 Suggestion: Visible hint uses inline `display:block` (harness contract)

**Location:** `src/systems/onboarding.js:117`, `154`, `166`
**Issue:** Visibility is inline `display`, not a class. WAVE6 checks `n.style?.display === 'block'`.
**Fix:** Keep inline display so WAVE6 stays honest. Do not switch to class-only hide in this PR.

### Passed (scope)

- HUD-01 hub stays empty: hint is a `#hud` child, not a reticle child (`hud.js:1002`, `1318–1319`).
- Encyclopedia stays on the HUD toggle, not in pause (Ctl05).
- Lesson names H / J / M / T / mouse / R/F. It does not auto-open hail, chart, berth, or pause.
- Keys are not remapped. No second live region for the rail. No `innerHTML`.
- Worker findings: agree there is no Blocker/Major. Correct the stacking note (chip covers list). Add the live-scale inherit gap they missed.

### Verdict

**Pass with minors.** Safe to treat PR1 UI as complete for the honor list. Do not reopen product source for the minors unless a later pass owns layout or live scale inherit.
