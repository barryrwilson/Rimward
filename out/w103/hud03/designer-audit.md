# UI Audit: HUD-03 KeyO checkbox `HUD audio alerts` (Wave 103)

**Auditor:** `[designer]` (independent of `out/w103/hud03/ui-audit.md` — do not rubber-stamp)
**Scope:** Live KeyO settings row for optional HUD audio alerts. Checkbox must match sibling KeyO rows. HUD-01 empty 80 px hub must stay empty of alerts. No glass chrome. No Digit/Key steal.
**Review file:** `C:\Projects\WebSim\out\w103\hud03\designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Read-only. No Playwright. Vite not started. [NO BROWSER COVERAGE].
**Date:** 2026-08-23
**Product source:** review only (no `src/` edits).

Sources: `src/systems/settings.js`, `src/core/ctx.js` (settings default only), `src/systems/song.js` (gate only), `docs/Hud03AlertsDesign.md`, `out/w102/hud03/shared-contract.md`, worker `out/w103/hud03/ui-audit.md`. Hub freeze checked against live `src/systems/hud.js` reticle build and `src/ui/hud.css` 80 px hub (read; not in the edit set).

## UI Audit: KeyO `HUD audio alerts`

### Summary
The only new surface is one native checkbox on the existing KeyO dialog. It uses the live `CHECKBOXES` loop, so layout, type, accent, and keyboard reach match sibling rows. The 80 px aim hub is unchanged. Mute-all stays a separate row. This pass is **CLEAN**.

### Verdict
**CLEAN.** 0 blockers, 0 majors. Two accepted notes (default-off deputize; checkbox stays enabled while muted). One suggestion (do not add a one-off `aria-label`).

Worker self-audit (`out/w103/hud03/ui-audit.md`) is correct on pass. This file does not reopen Wave 102 deputize as a new defect.

### What's done well
- Copy is the authored string **HUD audio alerts** (`settings.js:44`). No SKU name, no ship name, no Incoming toast rewrite.
- Cluster order matches contract §1.1: after **Reduced motion**, before **Mute all audio** (`settings.js:40–45`). HUD-03 a11y stays one group; mute-all stays master silence.
- Same row chrome as siblings: wrapping `<label>`, flex, `gap:10px`, `padding:5px 2px`, 15 px checkbox, `accent-color:#6fd2e0`, `createTextNode` label (`settings.js:123–138`). No one-off style.
- Accessible name is the label text. Native checkbox is a tab stop inside `role="dialog"` `aria-label="Settings"` (`settings.js:102–103, 124–138`).
- Default **off** (`ctx.js:221`). Optional control does not surprise a wiped `rimward-settings-v1` with new ticks.
- No new `body` class (`settings.js:69–74`). Song reads the bool live (`song.js:437–438`). Mute / volume still zero master (`song.js:462–464`). The checkbox cannot bypass mute.
- No `innerHTML` in the panel (`settings.js` has zero `innerHTML`).
- No speaker icon, pip, tape, klaxon, or lock box on glass. `hud.js` reticle children stay pupil, cilia, RANGE (`hud.js:709–712`). `.rw-reticle` is still 80×80 px (`hud.css:184–191`). This serial did not edit `hud.js`.
- No new `@keyframes`. `reducedMotion` still skips family emit (`hud.js:1087–1088`).
- Combat `npcFire` / whalesong are not gated by `hudAlerts` (`song.js:132–140, 437`). Mute-all and HUD alerts stay distinct jobs.

### Findings

#### 🔴 Blocker
None.

#### 🟠 Major
None.

#### 🟡 Minor: Default-off hides Wave 65 family ticks until the player finds the new checkbox
**Location:** `src/core/ctx.js:221`; `src/systems/settings.js:44`; contract §1.1 / §1.3
**Severity:** minor
**Status:** accepted (Wave 102 deputize; owner may flip default after playtest)

**Issue:** Returning players with no `hudAlerts` key keep `false`. RANGE / MATCH / contact / hull / lock ticks stay silent until KeyO is used. That is the optional-aid picture, not a broken control.

**Fix:** Do not add a tutorial toast or hub lamp this serial. Hint line already says changes apply immediately (`settings.js:117`). Playtest may set default `true`.

#### 🟡 Minor: Checkbox stays enabled while **Mute all audio** is on
**Location:** `src/systems/settings.js:132–135`; `src/systems/song.js:462–464`
**Severity:** minor
**Status:** accepted (fail-closed in song, not in the widget)

**Issue:** A player can check **HUD audio alerts** while muted and hear nothing. Mute still wins. The mute row is also never disabled. A disabled HUD-alerts row would hide the setting and lie about persist.

**Fix:** Keep enabled. Do not add a second hint line unless playtest asks. Do not `innerHTML` help HTML.

#### 💡 Suggestion: Do not add a one-off `aria-label` on the new input
**Location:** `src/systems/settings.js:123–138`
**Severity:** suggestion
**Status:** open (accepted — do not “fix”)

**Issue:** The wrapping `<label>` already names the control. Sibling rows have no `aria-label` on the input.

**Fix:** Leave the loop as-is. A one-off `aria-label` would make this row unlike Colorblind / Mute.

### Passed checks
- [x] Keyboard: KeyO still toggles SETTINGS (`settings.js:230–231`). Escape still closes (`settings.js:232–234`). Checkbox is a native tab stop.
- [x] Sibling match: same `CHECKBOXES` loop; no extra chrome, icon, or helper under the new row.
- [x] Contrast / type: same panel tokens (`#dce8f4` on `#101826`, accent `#6fd2e0`) (`settings.js:93–100, 131`).
- [x] Hit target: full-row `<label>` plus 15 px box, same as siblings (`settings.js:124–131`).
- [x] Responsive: panel `max-width:92vw; max-height:82vh; overflow-y:auto` unchanged (`settings.js:97–98`).
- [x] States: checked/unchecked via native control; persist refresh on open (`settings.js:221`). No loading/error chrome required for a bool.
- [x] Hierarchy: a11y cluster then mute then hints then TEXT SIZE / MASTER VOLUME. New row does not steal primary actions.
- [x] Theming: no new hardcoded HUD color; no new CSS variable. Overlay still uses the hail.js inline pattern (pre-existing).
- [x] Empty hub: no alert widget inside `.rw-reticle`. RANGE stays TGT-01 (`hud.js:709–712`; `hud.css:184–191`).
- [x] Incoming toast copy unchanged this serial (no `hud.js` edit; no second toast).
- [x] Digit 0/8/9 chrome unchanged (this serial does not draw dock UI).
- [x] KeyT / KeyV / KeyK / KeyX / KeyO not stolen.

### Hub / glass freeze
| Surface | Law | Audit |
|---|---|---|
| 80 px `.rw-reticle` | No alerts child | Pass |
| RANGE | Untouched TGT-01 | Pass |
| Lock box / incoming gauge | Forbidden | Pass |
| Digit / Key steal | Forbidden | Pass |
| Pulse animation | Forbidden | Pass |
| Mute bypass | Forbidden | Pass |
| Incoming toast rewrite | Forbidden | Pass |
| Second mute checkbox | Forbidden | Pass |

### Settings copy pin
| Control | Authored text | Default | Live |
|---|---|---|---|
| Existing | `Colorblind-safe palette` | off | `settings.js:41` |
| Existing | `High contrast HUD` | off | `settings.js:42` |
| Existing | `Reduced motion` | off | `settings.js:43` |
| **New** | **`HUD audio alerts`** | **off** | `settings.js:44`; `ctx.js:221` |
| Existing | `Mute all audio` | off | `settings.js:45` |
| Existing | `Onboarding hints` | on | `settings.js:46`; `ctx.js:222` |

Hint line stays: `O or ESC to close — changes apply immediately` (`settings.js:117`).
