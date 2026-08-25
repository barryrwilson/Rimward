# UI Audit: HUD-03 remaining visual accessibility brief (Wave 115)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec freeze**: live KeyO visual controls already meet wishlist HUD-03 for **both** HUD families. Hub theft is **not** proposed (Blocker if a later serial adds it). Free skin stays closed. HUD-02 class tokens stay sibling.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. No Vite. No Chrome.

### What's done well

- Reuses the live KeyO cluster: Colorblind / High contrast / Reduced motion / TEXT SIZE (`settings.js` 40–46, 142–177). Keyboard reach stays the same dialog (`role="dialog"` `aria-label="Settings"` `settings.js` 102–103).
- Color is never the only HUD state cue: live HUD comment (`hud.js` 44–45) plus CSS token remap, not a palette-only leftover PR.
- Okabe-Ito remap is on `#hud` tokens, so mech and bio inherit the same contrast/color-blind treatment (`hud.css` 1145–1181).
- Reduced motion kills `#hud *` animation/transition (`hud.css` 1185–1189) and hides combat-rail hair on **both** families (`hud.css` 1535–1541). Bio pupil/iris freeze (`hud.css` 1749–1755). Mech RANGE pop freeze (`hud.css` 1241–1243).
- `textScale` 1.5 is already capped on NAV-02 aux so it cannot eat the target rail (`hud.css` 969–970).
- Empty 80 px hub stays empty (`hud.css` 184–193). RANGE stays TGT-01.
- TEXT SIZE uses `aria-pressed` on segmented buttons (`settings.js` 156–157).
- Scale copy is authored `S`/`M`/`L`/`XL`, not interpolated ship names.
- Wave 103 **HUD audio alerts** stays a separate checkbox after reduced motion. Visual leftover does not merge into mute.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: KeyO panel itself uses inline 13 px and does not follow `--rw-text-scale`

**Location:** `settings.js` 100 `font-size:13px`; apply sets `--rw-text-scale` on `#hud` only (`settings.js` 73)

**Issue:** A player who needs XL HUD text still sees the settings dialog at 13 px. Wishlist HUD-03 names **HUD families**, not the overlay.

**Fix:** Do not invent a HUD-03 leftover PR for the dialog. Owner may later ask a settings-chrome pass; that is **not** this freeze.

**Status:** accepted — not HUD-family leftover; CONSUME stands.

#### 🟡 Minor: Station overlays get color-blind/contrast but not HUD text scale

**Location:** `screens.css` 560–616; `settings.js` 73

**Issue:** Dock menus honor `body.rw-colorblind` / `rw-contrast`. They do not multiply by `--rw-text-scale`. Same as KeyO: not HUD family chrome.

**Fix:** Contract §0.17. Do not schedule overlay scale as HUD-03 PR1.

**Status:** accepted.

#### 💡 Suggestion: Keep TEXT SIZE hit targets as the existing flex buttons

**Location:** `settings.js` 148–176 `flex:1` buttons, class `screen-btn`

**Fix:** If owner re-opens after a true missing-field census, reuse this row. Do not replace with a free-text number that can blow the 80 px hub.

### Settings copy pin (live; do not add)

| Control | Authored text | Default |
|---|---|---|
| Existing | `Colorblind-safe palette` | off |
| Existing | `High contrast HUD` | off |
| Existing | `Reduced motion` | off |
| Existing (audio) | `HUD audio alerts` | off |
| Existing | `Mute all audio` | off |
| Existing | `Onboarding hints` | on |
| Existing | `TEXT SIZE` S/M/L/XL | M (`1`) |
| Existing | `MASTER VOLUME` | 100% |

**Forbidden copy:** a second TEXT SIZE; “HUD style”; SKU names; interpolating `record.name`; rewriting Wave 103 `HUD audio alerts`.

Hint line stays: `O or ESC to close — changes apply immediately` (`settings.js` 117).

### Hub / glass freeze (Blocker if violated)

| Surface | Brief | Audit |
|---|---|---|
| 80 px `.rw-reticle` | No a11y child | Pass |
| RANGE | Untouched TGT-01 | Pass |
| Contrast / scale pip | Forbidden | Pass |
| Digit / Key steal | Forbidden | Pass |
| Free skin picker | Forbidden | Pass |
| HUD-02 class tokens as HUD-03 | Forbidden | Pass |
| Second visual checkbox | Forbidden | Pass |
| New localStorage key | Forbidden | Pass |
| Pulse under reducedMotion | Forbidden | Pass |

### Both HUD families

| Family | Scale | Contrast | Color-blind | Reduced motion |
|---|---|---|---|---|
| mech | `--rw-text-scale` on `#hud` | `body.rw-contrast #hud` | `body.rw-colorblind #hud` | `#hud *` none + RANGE pop freeze + hair hide |
| bio | same | same + hair opacity | same + `--vein` → `--rw-good` | same + pupil/iris freeze + hair hide |

Neither family is visually disadvantaged as a HUD-03 hole. Competitive readability is HUD-02 identity work (consume Wave 62), not a new a11y serial.

### Verdict

**Pass** as CONSUME UI freeze. Do not ship visual HUD-03 chrome from this wave.
