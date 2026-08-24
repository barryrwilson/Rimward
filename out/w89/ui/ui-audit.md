# UI Audit: automine chip + rock bracket Automine

**Scope:** `src/systems/hud.js` (chip + rock button), `src/ui/hud.css` (`rw-automine*`, rock button), `src/systems/controls.js` (KeyN + help line).  
**Date:** 2026-08-22  
**Verdict:** MINOR_ONLY

### Summary
The automine chip stacks under autopilot in `.rw-chip-stack`. Both Cancel and the rock Automine control meet the click contract (`type="button"`, `pointer-events: auto`, `aria-label`, visible `:focus-visible`). Refuse uses dim + `aria-disabled` without native `disabled`, so the click still reports a comm line. No blocker. A few small layout, contrast, and copy gaps remain.

### What's done well
- Chip host is `#hud .rw-chip-stack` at top-center; `.rw-automine` is the second flex child, so it sits under `.rw-autopilot` (`hud.js:966–977`, `hud.css:646–660`).
- Chip root is `.rw-automine` only (plus `is-hidden`). No `.rw-fade`, `.rw-aux`, or `.rw-chartmark`. Combat fade at `#hud.in-combat .rw-fade` (`hud.css:89`) does not dim the chip.
- Rock Automine lives on the target info, which is combat-critical chrome, not faded aux. Combat refuse dims the control (`hud.js:1649–1654`, `amRefuseToken` combat token).
- Buttons set `type="button"`, `aria-label`, and `pointer-events: auto` (`hud.js:706–708`, `980–982`; `hud.css:453`, `691`).
- Visible focus: `outline: 2px solid var(--cyan); outline-offset: 2px` on `:focus-visible` (`hud.css:475–480`, `705–712`). Dim/refuse hover does not re-light the fill (`hud.css:483–490`).
- Refuse state is `is-dim` + `aria-disabled="true"`; click still calls `tryEngageAutomine` and can emit `commLine` (`hud.js:710–721`, `1649–1654`).
- Hidden state is `display: none` via `.is-hidden`, so the control leaves tab order (`hud.css:467`, `678–679`).
- Colors use `--cyan`, `--dim`, `--white`, `--panel-edge`. High-contrast lists `.rw-automine` next to `.rw-autopilot` (`hud.css:1158–1161`). No extra `@keyframes` on the chip; reduced-motion already kills HUD transitions.
- Hit target uses `min-height: 24px` (`hud.css:463`, `701`).
- `guardAutomineSpace` on both buttons keeps Space from activating the control (`hud.js:709`, `983`).
- Help line registers `N — automine locked asteroid` (`controls.js:343`). KeyN is tracked (`controls.js:27`, `42`, `283–285`).
- Label swap `Automine` / `Cancel automine` updates `textContent` and `aria-label` together (`hud.js:1643–1647`). Color is not the only state signal: APPROACH vs CUTTING is text (`hud.js:1629–1632`).

### Findings

#### 🟡 Minor: Chip stack collides with CONTROLS and toasts on narrow glass
**Location:** `src/ui/hud.css:633–656`  
**Status:** open  
**Issue:** `.rw-chip-stack` is `top: 14px; left: 50%; max-width: min(92vw, 420px)`. `.rw-toasts` shares `top: 14px` at `right: 168px`. `.rw-controls` is `top: 14px; left: 14px; max-width: 280px`. On viewports under ~700px the 92vw chip sits over toast copy and the CONTROLS panel. Two chips (autopilot + automine) make the stack taller. Toasts stay `pointer-events: none`, so this is occlusion, not a dead click, but refuse/cancel copy can hide under the chip.
**Fix:** Cap chip width against the toast gutter (for example `max-width: min(420px, calc(100vw - 336px))`) or drop `top` for the second chip only. Do not move the stack onto `.rw-banner` or the hub.

#### 🟡 Minor: Dim state stacks opacity on an already-dim token
**Location:** `src/ui/hud.css:469–472`  
**Status:** open  
**Issue:** `.rw-automine-rock.is-dim` / `[aria-disabled='true']` sets `color: var(--dim)` and `opacity: 0.7`. The parent `.rw-target-info` scrim is already `rgba(2, 6, 13, 0.72)` (`hud.css:444`). `--dim` on a translucent scrim plus 0.7 opacity can fall under readable contrast when the scene behind the bracket is bright. Color is paired with `aria-disabled` and label text, so this is not a blocker.
**Fix:** Drop `opacity` and keep `--dim`, or keep opacity and paint an opaque button background (`var(--panel)` / contrast scrim).

#### 🟡 Minor: Controls help does not say N also cancels
**Location:** `src/systems/controls.js:343` (header at `controls.js:27`)  
**Status:** open  
**Issue:** The system comment is `N (tap) → engage / cancel automine on a locked asteroid`. The HUD help line is `N — automine locked asteroid`. The chip and rock control both expose Cancel. A pilot who only reads CONTROLS does not learn that N cancels an engaged run.
**Fix:** Use one line, for example `N — automine / cancel automine on a locked asteroid`.

#### 💡 Suggestion: Engaged state is not a live status region
**Location:** `src/systems/hud.js:977–979`, `1623–1632`  
**Status:** open  
**Issue:** Refuse copy rides `commLine` → `.rw-toasts` (`role="status"`, `aria-live="polite"`). Success only reveals the chip. APPROACH → CUTTING updates a span with no live region. Keyboard users who press N get no spoken confirm. Same pattern as the autopilot chip; do not block on it.
**Fix:** Optional `role="status"` on `.rw-automine` (or reuse toasts for engage). Do not move focus to Cancel.

#### 💡 Suggestion: Stale pointer-events comment on the CONTROLS block
**Location:** `src/systems/hud.js:946–948`  
**Status:** open  
**Issue:** The comment still says the CONTROLS toggle is the only HUD node with `pointer-events: auto`. CSS header and `.rw-controls-toggle` already name flight-chip / rock buttons (`hud.css:5–7`, `1085`). The comment can mislead the next HUD pass.
**Fix:** Match the CSS comment: CONTROLS toggle, autopilot/automine Cancel, rock Automine.

#### 💡 Suggestion: No `:active` press feedback on the new buttons
**Location:** `src/ui/hud.css:475–480`, `705–712`  
**Status:** open  
**Issue:** Hover and `:focus-visible` are defined. There is no `:active` rule. Mouse press on a moving rock bracket is easy to miss.
**Fix:** Optional `:active` border/color, still using `--cyan` / `--white`. Skip if the HUD keeps hover = focus as the only chrome.

### Checklist
| Check | Result |
| --- | --- |
| `type="button"` | Pass (`hud.js:707`, `972`, `981`) |
| `aria-label` | Pass (rock label tracks Automine / Cancel automine) |
| `pointer-events: auto` on buttons | Pass; parents stay `none` |
| Visible focus | Pass (`:focus-visible` 2px cyan) |
| Dim + `aria-disabled` on refuse | Pass; click still allowed |
| Chip under autopilot | Pass (column flex, AP then AM) |
| Combat / fade | Pass (chip not `.rw-fade`; rock dims on combat refuse) |
| Tokens vs hardcoded | Pass for interactive color; chip/scrim rgba matches existing autopilot |
| Contrast sheet lists `.rw-automine` | Pass |
| Loading / empty / error | Pass (hidden chip = idle; refuse = dim + comm line) |
| Hover / focus / disabled | Pass (dim hover does not re-brighten) |
| KeyN HUD copy | Pass with minor cancel wording gap |

### Verdict
**MINOR_ONLY**
