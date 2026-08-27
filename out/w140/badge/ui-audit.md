## UI Audit: `.rw-agent-badge` layout + a11y tokens (Wave 140 PR1)

### Summary

The play badge sits below Manifest at `top: 140px`, stays in the 148 px Manifest column, and cannot grow into PWR after the raised top. Colorblind and contrast settings retint the body-child card. Focus rings, 44 px hits, reduced-motion, and non-color ON/OFF stay. No Blocker/Major.

Checklist: `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did not spawn `[designer]`. Did not start Vite. Geometry is from authored CSS vs live Manifest/toast/PWR rules.

### What's done well

- Manifest UU/FEAR/CARGO: badge starts at 140 px; Manifest is `top: 14px; right: 14px` (`hud.css` **1172–1176**).
- Toasts: badge max-width 148 px at `right: 16px` ends near 164 px; toasts are `right: 168px` (`hud.css` **710–713**).
- PWR: max-height `100vh - 156px` with top 140 px leaves a 16 px bottom inset (same as the old pin).
- RANGE word stays hub-center (`.rw-reticle-range`); pin is not bottom-right.
- z-index 40 keeps Enable/Stop above station scrim 20.
- Colorblind accent `#56B4E9` on title (`.rw-agent-badge-title` uses `--rw-accent`).
- Contrast panel/edge/white match HUD tokens.
- Color is not the only cue: ON solid accent bar, OFF dashed edge, ON/OFF text.
- Buttons min 44×44. `flex-wrap` keeps two hits in the 148 px card (`box-sizing: border-box`; 44+8+44 fits inner width).
- `overflow-wrap: anywhere` on last/error/hint.
- Reduced-motion still kills animation/transition on the badge tree.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: XL textScale Manifest may still clip at 140 px

**Location:** `src/style.css:39`
**Issue:** `--rw-text-scale` is on `#hud` only. Scale 1.5 Manifest is the 140 px budget. A taller Manifest after copy change can meet the card.
**Fix:** Owner may raise `top` after a still. Not a second required PR.
**Status:** documented
**Justification:** Contract freeze is 140 px. Do not claim `settings.js` or `--rw-text-scale` on the badge.

#### 🟡 Minor: Dock credits overlap at z-index 40

**Location:** `src/style.css:43`
**Issue:** Same as orch-fable t2. Card is above dock overlay text.
**Fix:** Do not drop z-index. Enable/Stop must stay above scrim 20.
**Status:** documented
**Justification:** Flight/dock control reach beats credit-label overlap.

#### 💡 Suggestion: `--dim` is unused in badge paint

**Location:** `src/style.css:144`
**Issue:** Contrast sets `--dim`. Badge text uses `--white`.
**Fix:** None. Contract requires the HUD contrast set.
**Status:** documented
**Justification:** Mirror HUD tokens even when the card has no dim role yet.

### Theming

| Class | Token | Value |
|---|---|---|
| `body.rw-colorblind .rw-agent-badge` | `--rw-accent` | `#56B4E9` |
| | `--rw-warn` | `#E69F00` |
| | `--rw-bad` | `#D55E00` |
| | `--rw-good` | `#009E73` |
| `body.rw-contrast .rw-agent-badge` | `--white` | `#ffffff` |
| | `--dim` | `#aec3d8` |
| | `--panel` | `rgba(4, 8, 17, 0.94)` |
| | `--panel-edge` | `rgba(160, 205, 245, 0.6)` |

### Computed style target (verifier)

- `top: 140px`
- `max-width: 148px` (or `min` with `100vw - 32px` on narrow viewports)
- `z-index: 40`
- Parent: `document.body`, not `#hud`

### Re-review

First pass found no Blocker/Major. No product CSS change after the audit. This report is the final UI audit.
