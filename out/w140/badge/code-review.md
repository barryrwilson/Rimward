## Code Review: Agent play badge layout + a11y tokens (Wave 140 PR1)

### Summary

`src/style.css` matches merge law PR1: offset, Manifest-column width, PWR-safe max-height, z-index 40, Okabe-Ito and contrast mirrors. Reduced-motion, 44 px buttons, and solid/dashed ON/OFF stay. Write-set is in scope. No Blocker/Major.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Checklist: `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`.

### What's done well

- Partial merge is complete: offset **and** width **and** max-height **and** both palettes.
- `bottom: auto; left: auto` blocks a bottom-right pin regression.
- Token hex/rgba copy live `hud.css` **1234–1248**.
- One short WHY comment on the body-child token gap.
- No JS measure, no MutationObserver, no new Digit.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Default badge tokens omit `--rw-warn` / `--rw-bad` / `--rw-good` / `--dim`

**Location:** `src/style.css:32–37` vs **135–147**
**Issue:** Colorblind/contrast blocks set extra vars. The default badge block only sets accent, panel, white, panel-edge, void.
**Why it matters:** Colorblind `--rw-warn` has no default on the badge. Live badge CSS does not read those vars.
**Fix:** None in PR1. Contract lists the mirror blocks, not extra defaults.
**Status:** documented
**Justification:** Keep the default block aligned with live paint (`--rw-accent` / `--panel` / `--white` / `--panel-edge`).

#### 💡 Suggestion: Comment cites hud.css line numbers

**Location:** `src/style.css:134`
**Issue:** Line cites can drift when HUD a11y rules move.
**Fix:** Optional later: cite the selector `body.rw-colorblind #hud` instead of lines.
**Status:** documented
**Justification:** Nearby comment already cites `hud.css 12–21`. Match that style.

### Contract trace

| Requirement | Result |
|---|---|
| `top: 140px` | **39** |
| `right: 16px` | **40** |
| `bottom`/`left` auto | **41–42** |
| `z-index: 40` | **43** |
| `max-width: min(148px, calc(100vw - 32px))` | **48** |
| `max-height: calc(100vh - 156px)` | **49** |
| `overflow-y: auto` | **50** |
| Okabe-Ito block | **135–140** |
| Contrast block | **142–147** |
| Reduced-motion kept | **128–132** |
| Solid/dashed kept | **61–67** |
| 44 px kept | **107–108** |
| No JS / no hud.css / no agent-api.js | write-set only `style.css` + docs Status + `out/w140/badge/**` |

### Re-review

First pass found no Blocker/Major. No product CSS change after the audit. This report is the final code review.
