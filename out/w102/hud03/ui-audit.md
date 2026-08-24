## UI Audit: HUD-03 remaining optional audio-alerts brief (Wave 102)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec document** for the KeyO settings panel (copy, cluster, defaults), not a live chrome change. Picture is one authored checkbox **HUD audio alerts** on the existing dialog. Hub theft is **not** proposed (Blocker if a later serial adds it). Mute-all stays the master silence control. Incoming toast copy stays WAVE98.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` and designer persona locally. Did **not** spawn `[designer]`.

### What's done well

- Reuses the live checkbox row: `<label>` + `<input type="checkbox">` + `createTextNode` (`settings.js` 120–137). Keyboard reach stays the same panel.
- Dialog already has `role="dialog"` and `aria-label="Settings"` (`settings.js` 99–100). Volume already has `aria-label` (`settings.js` 193).
- Cluster is specified: after **Reduced motion**, before **Mute all audio**, so HUD-03 a11y (color-blind, contrast, motion, HUD alerts) stays one group, then master silence.
- Color is never the only cue for the setting: the control is a labeled checkbox, not a palette-only lamp.
- Fail-closed mute: opted-in ticks still silent when **Mute all audio** is on (`song.js` 451–453). Player does not need a disabled state to stay safe.
- Empty 80 px hub stays empty (`hud.css` 184–191). RANGE stays TGT-01 (`hud.js` 703).
- Both HUD families keep the same glance set; family ticks stay family-gated (`FAMILY_CUES`). No free skin override (wishlist 350).
- `reducedMotion` already skips family emit (`hud.js` 1074) and kills HUD animation (`hud.css` 1181–1185). No new pulse `@keyframes`.
- Incoming fire./Incoming dart. stay the only toast strings for those events.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Default-off hides Wave 65 family ticks until the player finds the new checkbox

**Location:** spec `docs/Hud03AlertsDesign.md` §2 / contract §1.1; live ticks currently play unmuted.

**Issue:** Optional default is correct for “optional,” but RANGE/MATCH/contact chirps disappear for returning saves that have no `hudAlerts` key (load keeps `ctx.js` default `false`).

**Fix:** Later owner playtest may flip default `true`. Hint line already says changes apply immediately (`settings.js` 114). Do not add a second tutorial toast this serial.

**Status:** deputize documented; not a Blocker.

#### 🟡 Minor: Checkbox stays enabled while muted (no disabled/aria-disabled spec)

**Location:** live mute row is never disabled (`settings.js` 129–131); spec fail-closes in `song.js`, not in the widget.

**Issue:** A player can check **HUD audio alerts** while **Mute all audio** is on and hear nothing. That is honest (mute wins) but can look like a broken toggle.

**Fix (later, optional):** keep enabled; mute still wins. Do not disable-and-hide the control. A one-line hint is out of scope unless playtest asks. Do not add `innerHTML` help HTML.

**Status:** accept; playback-side fail-closed is enough.

#### 💡 Suggestion: Keep checkbox hit target as the full `label` row (already live)

**Location:** `settings.js` 121–123 `display:flex` label.

**Fix:** Later PR1 must use the same `CHECKBOXES` loop, not a bare input.

### Settings copy pin (Wave 102 deputize)

| Control | Authored text | Default |
|---|---|---|
| Existing | `Colorblind-safe palette` | off |
| Existing | `High contrast HUD` | off |
| Existing | `Reduced motion` | off |
| **New** | **`HUD audio alerts`** | **off** |
| Existing | `Mute all audio` | off |
| Existing | `Onboarding hints` | on |
| Existing | `TEXT SIZE` S/M/L/XL | M (`1`) |
| Existing | `MASTER VOLUME` | 100% |

**Forbidden copy:** a second Incoming toast; “Klaxon”; SKU names; interpolating `record.name`; rewriting `Incoming fire.` / `Incoming dart.`.

Hint line stays: `O or ESC to close — changes apply immediately` (`settings.js` 114).

### Hub / glass freeze (Blocker if violated)

| Surface | Brief | Audit |
|---|---|---|
| 80 px `.rw-reticle` | No alerts child | Pass |
| RANGE | Untouched TGT-01 | Pass |
| Lock box / incoming gauge | Forbidden | Pass |
| Digit / Key steal | Forbidden | Pass |
| Pulse animation | Forbidden | Pass |
| Mute bypass | Forbidden | Pass |
| Incoming toast rewrite | Forbidden | Pass |
| Second `npcFire` HUD bark | Forbidden | Pass |
| New localStorage key | Forbidden | Pass |
| `innerHTML` | Forbidden | Pass |

### Verdict

No Blocker. Picture is panel-legal. Format pin is one checkbox `HUD audio alerts`, default off, mute still wins. Hub theft remains a **Blocker** if a later serial puts an alert widget on `.rw-reticle`.
