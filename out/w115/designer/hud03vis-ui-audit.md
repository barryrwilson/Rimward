# UI Audit: HUD-03 remaining visual leftover (Wave 115 CONSUME)

**Auditor:** `[designer]` (independent of `out/w115/hud03vis/ui-audit.md`)
**Scope:** Wave 115 HUD-03 remaining visual leftover — markdown CONSUME only. Confirm CONSUME does **not** schedule a hub gauge, a new Digit, a free skin override, or a third HUD family. Confirm the brief does **not** invent visual work that would steal HUD-01 or HUD-02. Honor live KeyO settings, HUD-01 empty 80 px hub, and `body.rw-*` inherit on both HUD families.
**Review file:** `out/w115/designer/hud03vis-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Live cites: `src/systems/settings.js`, `src/core/ctx.js`, `src/ui/hud.css`, `src/systems/hud.js`, `src/systems/station.js`, `src/systems/controls.js`, `src/game/save.js`, `src/ui/screens.css`. Pack: `docs/Hud03RemainingVisualDesign.md`, merge law `out/w115/hud03vis/shared-contract.md`, inventory `out/w115/hud03vis/current-hud03-visual-inventory.md`. Worker self-audit `out/w115/hud03vis/ui-audit.md` read, not copied. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-24
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w115/hud03vis/shared-contract.md` wins if the brief forks. This wave does not ship overlay CSS. Findings bind **later workers**: do not invent HUD-03 visual chrome while the four live fields exist.

## UI Audit: HUD-03 remaining visual accessibility brief (CONSUME freeze)

### Summary

No product UI ships this wave. The pack freezes leftover as **CONSUME**: live KeyO `textScale` / `highContrast` / `colorblind` / `reducedMotion` already meet wishlist HUD-03 on **both** HUD families via `body.rw-*` and `--rw-text-scale`. Named PR1 **does not exist**. The brief does not schedule a hub gauge, a new Digit, a free skin, or a third family. It does not steal HUD-01 empty glass or HUD-02 `data-class-key`. No 🔴 Blocker. No 🟠 Major.

### Verdict

**PASS.** 0 blockers, 0 majors, 3 minors (accepted overlay / wishlist gaps), 2 suggestions. CONSUME freeze holds.

### What's done well

- Reuses live KeyO. No second TEXT SIZE. No fifth visual checkbox. `FIELDS` already hold the four visual keys plus audio (`src/systems/settings.js` 29–38, 40–46, 142–177).
- Keyboard reach stays the same dialog: KeyO toggle (`settings.js` 228–234); `role="dialog"` `aria-label="Settings"` (`settings.js` 102–103); hint `O or ESC to close — changes apply immediately` (`settings.js` 117). KeyO is **not** in `TRACKED` (`src/systems/controls.js` 41–48). Settings stay KeyO, not a Digit.
- TEXT SIZE uses authored `S`/`M`/`L`/`XL` (`settings.js` 25–26, 164–167) and `aria-pressed` (`settings.js` 156–157). Scale buttons use live `screen-btn` (`settings.js` 166), so they inherit `:focus-visible` outline (`src/ui/screens.css` 89–99).
- Color is never the only HUD cue (`src/systems/hud.js` 44–45). Color-blind remaps `#hud` tokens to Okabe-Ito (`src/ui/hud.css` 1145–1151). FORE/AFT facing lamps add inset/shape under `rw-colorblind` (`hud.css` 310–317). Bio `--vein` remaps to `--rw-good` (`hud.css` 1736–1738).
- High contrast and color-blind selectors are `body.rw-* #hud`, **not** family-gated (`hud.css` 1145–1181). Mech and bio inherit the same `--rw-accent` / `--rw-warn` / `--rw-bad` / `--rw-good` / `--white` / `--panel`.
- Reduced motion kills `#hud *` animation/transition (`hud.css` 1185–1189). Family extras freeze: mech RANGE pop (`hud.css` 1241–1243); bio pupil/iris (`hud.css` 1749–1755); combat-rail hair hide on **both** families (`hud.css` 1535–1541). `emitFamilyTick` returns when `reducedMotion` (`hud.js` 1105–1107). Bio period goes to 0 (`hud.js` 124–125, 1896–1897).
- `--rw-text-scale` is set on `#hud` (`settings.js` 73). `#hud` font-size multiplies (`hud.css` 29–31). NAV-02 aux already caps 180 px so XL cannot eat the target rail (`hud.css` 969–970).
- HUD-01 empty hub stays empty. `.rw-reticle` is 80×80, `pointer-events: none` (`hud.css` 184–193). Live children stay pupil, three cilia, RANGE (`hud.js` 726–729). RANGE stays the TGT-01 word (`hud.css` 207–220). Brief Picture / Non-goals / contract §0.2 forbid an a11y pip on the glass.
- Digit 0 stays shipyard (`src/systems/station.js` 188 last of `DOCK_KEY_SERVICES`; dock-root `d === 0` at 6100–6102). Digit 8 dock root is launch (index 7). Digit 9 is epics (index 8) (`station.js` 188, 6098–6106). Outfitting 8/9 stay launcher / turret papers (`station.js` 6177–6179). No new Digit. No Key steal.
- HUD family stays `hudFamily` → `'mech' | 'bio'` from `hullKind` (`hud.js` 80–89). Root writes `dataset.family` then sibling `applyClassKeyAttr` (`hud.js` 1100–1101). Brief forbids a third family and forbids stealing `data-class-key` as HUD-03 (contract §0.9 / §0.18).
- Free skin stays closed. Debug `sessionStorage` `rw-hud-family` is **not** KeyO chrome (`hud.js` 92–97; contract §0.10). Wave 103 `hudAlerts` stays a separate checkbox (`settings.js` 34, 44). Mute / volume stay audio.
- Persist stays `rimward-settings-v1` (`settings.js` 24). No visual key in `WORLD_FIELDS` (`src/game/save.js` 76–101). Load walks `Object.keys(FIELDS)` only (`settings.js` 58–59). `innerHTML` is 0 in `settings.js` and `hud.js`. Panel uses `createElement` + `createTextNode` (`settings.js` 89–210).
- Serial plan names **PR1 visual HUD-03: Does not exist** (`docs/Hud03RemainingVisualDesign.md` 220–223; contract §3). Additive punch is **none**. That is the correct CONSUME picture: reuse live KeyO, no new chrome.

### CONSUME steal check (Blocker if the brief scheduled these)

| Forbidden later work | Brief / contract | Live honor | Result |
|---|---|---|---|
| Hub gauge / a11y pip / contrast disc on 80 px glass | Owner request + Goals 6 + Non-goals + Picture; contract §0.2 | `.rw-reticle` 80×80 empty of a11y child (`hud.css` 184–193; `hud.js` 726–729) | **Pass.** Not scheduled. HUD-01 not stolen. |
| New Digit / steal Digit 0/8/9 | Honor + Non-goals; contract §0.3 | shipyard / launch / epics / papers (`station.js` 188, 6098–6106, 6177–6179) | **Pass.** Settings stay KeyO. |
| Free skin override / “HUD style” picker | Owner request + Non-goals; contract §0.10 | family from `hullKind`; debug override not product (`hud.js` 80–97) | **Pass.** Closed. |
| Third HUD family / per-family visual checkboxes | Pain points + Non-goals; contract §0.18 | `body.rw-* #hud` both families (`hud.css` 1145–1189) | **Pass.** Bio extras inherit; they do not mint a third family. |
| Steal HUD-02 `data-class-key` | Honor + Neighbours; contract §0.9 | `applyClassKeyAttr` sibling (`hud.js` 100–115, 1101); pack must not touch `out/w115/hud02tgt/**` | **Pass.** Cited as sibling. Not this leftover. |
| Second visual KeyO row / hub pip as “PR1” | Merge table Named PR1 = None; contract §3 | four visual FIELDS already LIVE (`settings.js` 29–36, 40–43) | **Pass.** CONSUME does not invent a serial. |

If a later worker adds a scale pip on `.rw-reticle`, a Digit for a11y, a KeyO “HUD style” picker, or per-family palettes, that **violates this freeze** and is a Blocker then. This pack does not schedule that work.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: KeyO panel itself uses inline 13 px and does not follow `--rw-text-scale`

**Location:** `src/systems/settings.js:100` `font-size:13px`; `settings.js:73` sets `--rw-text-scale` on `#hud` only; `docs/Hud03RemainingVisualDesign.md:122`; contract §0.17
**Severity:** minor
**Status:** accepted — not HUD-family leftover; CONSUME stands.

**Issue:** A player who needs XL HUD text still sees SETTINGS at 13 px. Hint line is 11 px (`settings.js` 118). Wishlist HUD-03 names **HUD families**, not the overlay.

**Fix:** Do not invent a HUD-03 leftover PR for the dialog. Owner may later ask a settings-chrome pass; that is **not** this freeze. Do not put a TEXT SIZE pip on the 80 px hub to “fix” the overlay.

#### 🟡 Minor: Station overlays and the galaxy chart honor contrast / color-blind but not HUD text scale

**Location:** `src/ui/screens.css:560–616`; `src/ui/hud.css:1781` chart `var(--rw-text-scale, 1)` while `settings.js:73` writes the var on `#hud` only; contract §0.17; inventory §5
**Severity:** minor
**Status:** accepted.

**Issue:** Dock menus remap Okabe-Ito / contrast via `body.rw-*`. They do not multiply by HUD `--rw-text-scale`. The KeyM chart is not under `#hud`, so the fallback stays `1`. Same as KeyO: not HUD family chrome.

**Fix:** Do not schedule overlay / chart / KeyO-panel font scaling as HUD-03 PR1. Contract §0.17 already forbids it.

#### 🟡 Minor: Wishlist initiative line still says “visual settings remain”

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md:422–425` vs HUD-03 subsection `488–502`; brief Overview (`docs/Hud03RemainingVisualDesign.md:37–38`); pack does **not** edit the wishlist (contract §0.14)
**Severity:** minor
**Status:** accepted — other worker owns wishlist copy.

**Issue:** Initiative status is stale relative to the HUD-03 subsection and live `FIELDS`. A later worker could treat that sentence as permission to add a fifth checkbox, a hub gauge, or a free skin.

**Fix:** Keep CONSUME named. Code wins. Do not edit the wishlist from this leftover. Do not invent REAL work from stale initiative wording.

#### 💡 Suggestion: Keep TEXT SIZE as the live flex `screen-btn` row

**Location:** `src/systems/settings.js:148–176` `flex:1` buttons, class `screen-btn`
**Severity:** suggestion
**Status:** optional (CONSUME already reuses this row).

**Issue:** A free-text number or a hub scale pip could blow the 80 px glass or NAV-02 rail.

**Fix:** If owner re-opens after a **true** missing-field census, reuse this row. Do not replace it with a slider that writes RANGE or a Digit.

#### 💡 Suggestion: Do not treat optional PR-census as required `src/` work

**Location:** `docs/Hud03RemainingVisualDesign.md:220–223`; `out/w115/hud03vis/shared-contract.md:139–142`
**Severity:** suggestion
**Status:** documented.

**Issue:** “PR-census (optional skip)” can be read as a Wave 115 implementation ticket.

**Fix:** Census is named grep only. No hub pip. No world field. No `src/`. Orchestrator must not schedule it as HUD-03 chrome.

### Settings copy pin (live; do not add)

| Control | Authored text | Default | Leftover? |
|---|---|---|---|
| Existing | `Colorblind-safe palette` | off | **No — LIVE** |
| Existing | `High contrast HUD` | off | **No — LIVE** |
| Existing | `Reduced motion` | off | **No — LIVE** |
| Existing (audio) | `HUD audio alerts` | off | **No — Wave 103** |
| Existing | `Mute all audio` | off | **No — mute** |
| Existing | `Onboarding hints` | on | **No — onboarding** |
| Existing | `TEXT SIZE` S/M/L/XL | M (`1`) | **No — LIVE** |
| Existing | `MASTER VOLUME` | 100% | **No — audio** |

**Forbidden copy:** a second TEXT SIZE; “HUD style”; SKU names; interpolating `record.name`; rewriting Wave 103 `HUD audio alerts`; a third-family checkbox.

Hint line stays: `O or ESC to close — changes apply immediately` (`settings.js` 117).

### Accessibility / theming / layout / states (live honor; no new chrome)

- **Controls:** no new buttons this wave. Live KeyO checkboxes sit in `<label>` rows (`settings.js` 123–139). TEXT SIZE buttons have visible labels + `aria-pressed`. Volume has `aria-label="Master volume"` (`settings.js` 196). Closed panel is `display:none` (`settings.js` 92, 218) so it does not swallow gameplay.
- **Focus:** TEXT SIZE inherits `.screen-btn:focus-visible` (`screens.css` 89–99). KeyO checkboxes are **not** `.screen-overlay input`; they use UA focus. Do **not** invent a HUD-03 leftover PR to restyle the dialog focus ring.
- **Theming:** HUD families use tokens + `body.rw-*`. KeyO panel still uses hardcoded hex (`settings.js` 91–101, 158–160). That is overlay chrome, not a HUD-03 hole (contract §0.17). Do not add a free skin picker to “theme KeyO.”
- **Responsive:** panel `max-width:92vw` (`settings.js` 98). Scale row `flex:1` (`settings.js` 168). NAV-02 already caps XL HUD (`hud.css` 969–970). Hub stays 80 px.
- **States:** corrupt JSON → `ctx.js` defaults (`settings.js` 63–65; `ctx.js` 215–222). Storage denied → session-only (`settings.js` 79–81). Invalid `textScale` never applies (`FIELDS` include-list). Missing `#hud` skips the CSS var write (`settings.js` 73). Empty leftover is honest: controls already exist.
- **Loading:** `apply()` runs at init (`settings.js` 237). Changes apply immediately (hint + `change()`). No loading spinner required.
- **Vestibular:** reduced-motion already kills HUD motion and family ticks. CONSUME must not add a contrast/scale pulse on the hub.
- **Hit targets:** checkbox box is 15×15 (`settings.js` 131) but the whole label row is the control (`settings.js` 123–127). Scale buttons flex the row. Do not grow a hub gauge for hit-target reasons.

### Both HUD families

| Family | Scale | Contrast | Color-blind | Reduced motion |
|---|---|---|---|---|
| mech | `--rw-text-scale` on `#hud` | `body.rw-contrast #hud` | `body.rw-colorblind #hud` | `#hud *` none + RANGE pop freeze + hair hide |
| bio | same | same + hair opacity (`hud.css` 1740–1747) | same + `--vein` → `--rw-good` | same + pupil/iris freeze + hair hide |

Neither family is visually disadvantaged as a HUD-03 hole. Competitive readability is HUD-02 identity work (Wave 62 consume / sibling class tokens), not a new a11y serial. Adding per-family checkboxes would invent a **third family** or a **free skin**. Forbidden.

### Hub / Digit / family freeze table

| Surface | Live | CONSUME freeze | Later serial |
|---|---|---|---|
| `.rw-reticle` child | pupil + 3 cilia + RANGE (`hud.js` 726–729) | **none new** | **Must not** add scale / contrast / palette / motion glyph |
| Hub size | 80×80 (`hud.css` 184–193) | do not grow | **Must not** grow for a11y |
| RANGE word | TGT-01 in-range (`hud.css` 207–220) | untouched | **Must not** paint scale or contrast |
| KeyO | settings (`settings.js` 230) | reuse live cluster | **Must not** add a second visual row |
| Digit 0 | shipyard | stay | **Must not steal** |
| Digit 8/9 | launch / epics; outfitting papers | stay | **Must not steal** |
| `data-family` | mech \| bio (`hud.js` 80–89, 1100) | two families only | **Must not** mint a third |
| `data-class-key` | sibling HUD-02 (`hud.js` 100–115, 1101) | do not steal | **Must not** treat as HUD-03 |
| Free skin picker | closed; debug `rw-hud-family` not product | stay closed | **Forbidden** |
| `hudAlerts` | Wave 103 checkbox | cite only | **Must not** rewrite as visual leftover |
| Persist | `rimward-settings-v1` | existing blob | **No** new key / `WORLD_FIELDS` |
| `innerHTML` | none in settings/hud | forbidden later | **Forbidden** |
| `state.js` | not a settings writer | READ-ONLY later | **Must not** write |

### Checklist (Wave 115 HUD-03 CONSUME)

| Check | Result | Cite |
|---|---|---|
| CONSUME does not schedule a hub gauge | **Pass.** PR1 does not exist. Hub child forbidden. | brief Goals 6 / Picture `docs/Hud03RemainingVisualDesign.md:108,229–231`; contract §0.2, §3; `hud.css` 184–193 |
| CONSUME does not schedule a new Digit | **Pass.** Settings stay KeyO. Digit 0/8/9 frozen. | brief Honor / Non-goals; contract §0.3; `station.js` 188, 6098–6106, 6177–6179; `controls.js` 41–48 |
| CONSUME does not schedule a free skin override | **Pass.** Closed. Debug override is not product. | brief Owner request / Non-goals; contract §0.10; `hud.js` 92–97 |
| CONSUME does not schedule a third family | **Pass.** Body classes global; per-family pickers forbidden. | brief Pain points / Non-goals; contract §0.18; `hud.css` 1145–1189 |
| Brief does not steal HUD-01 | **Pass.** Empty 80 px hub; RANGE stays TGT-01. | `hud.css` 184–193, 207–220; `hud.js` 726–729; contract §0.2 |
| Brief does not steal HUD-02 | **Pass.** Class tokens sibling; pack must not touch `out/w115/hud02tgt/**`. | `hud.js` 100–115, 1101; contract §0.9; brief Honor |
| Both families inherit `body.rw-*` | **Pass.** Selectors are `body.rw-* #hud`. Family extras consume. | `hud.css` 1145–1189, 1241–1243, 1535–1541, 1736–1755; `settings.js` 69–73 |
| KeyO already ships the four visual aids | **Pass.** LIVE FIELDS + CHECKBOXES + TEXT SIZE. | `settings.js` 29–46, 69–73, 142–177; `ctx.js` 215–218 |
| Named implementation PR1 | **None.** CONSUME. | brief §5; contract §3 |

### Re-review

No Blocker/Major opened. Overlay font/contrast (KeyO, station, chart) and stale wishlist initiative wording remain documented gaps **outside** HUD-family leftover. This wave is markdown only; do not land `src/`. Do not invent a hub gauge, Digit, free skin, or third family because CONSUME is “boring.”
