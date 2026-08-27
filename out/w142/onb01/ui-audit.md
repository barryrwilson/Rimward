## UI Audit: Onb01 PR1 first-minute flight lesson

### Summary

First-minute dump is gone: CONTROLS starts collapsed; the lesson rail teaches one authored line at a time. The same hint node is a polite live region and uses `hud.css` tokens for scale, contrast, and reduced-motion. No Blocker/Major remain.

### What's done well

- Toggle is a real `<button>`. Default label is `CONTROLS ▸`. Click still expands the 19-line list.
- `aria-expanded` follows the collapse flag on init, click, and combat collapse (words plus `display:none`, not color-only).
- `:focus-visible` on `.rw-controls-toggle` matches the autopilot cancel ring (`outline: 2px solid var(--cyan)`).
- One `.rw-onboard-hint` with `role="status"`, `aria-live="polite"`, `aria-atomic="true"`, `pointer-events: none`. Not a modal. Not in the 80 px reticle.
- Font size uses `calc(11px * var(--rw-text-scale, 1))`. Contrast and colorblind selectors cover the hint when it is a body child. Reduced-motion includes `.rw-onboard-hint`, not only `#hud *`.
- Lesson copy is full sentences (look/turn, throttle, target, hail, dock, chart). Color is not the only cue.
- No new animation.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: Hint still sits under the CONTROLS header (`top: 48px`)

**Location:** `src/ui/hud.css` `.rw-onboard-hint`  
**Issue:** Collapsed header and lesson chip share top-left. Expanded encyclopedia would cover the chip.  
**Justification:** Contract keeps this slot. Collapse is the dump fix. Do not move the chip to bottom-center (HUD-07 / contacts).

#### 🟡 Minor: Any-key dismiss can skip a card while steering

**Location:** `src/systems/onboarding.js` `keydown` → `hide`  
**Issue:** Mouse-look is the first lesson; the next key (including W/A/S/D) dismisses it.  
**Justification:** Contract keeps 8 s or any-keydown. Do not add a confirm control (would steal focus / pointer-events).

#### 💡 Suggestion: Visible hint uses inline `display:block` (harness contract)

**Location:** `onboarding.js` `show` / `hide`; WAVE6 `n.style?.display === 'block'`  
**Justification:** Keep inline display so WAVE6 visibility checks stay honest. Do not switch to class-only hide in this PR.

### Passed

- HUD-01 hub empty (hint is a `#hud` child, not a reticle child).
- Encyclopedia stays on-demand on the HUD, not in pause (Ctl05).
- Lesson names H / J / M / T / mouse / R/F. Does not auto-open those overlays.
