# UI Audit: HUD-02 PR1 living facing class tokens

Wave 113. Frontend review of `src/systems/hud.js` (classKey helpers, init, 5 Hz) and `src/ui/hud.css` (bio `[data-class-key]` clips, generic bio, mech plate, `.rw-reticle`, `.rw-facing-sil`). Measured against `docs/Hud02RemainingSilhouettesDesign.md`, `out/w111/hud02/shared-contract.md`, and worker `out/w113/hud02/ui-audit.md`. Applied designer persona + `ui-audit.md`. Review only. Did not start Vite or Chrome. Did not edit product UI.

### Summary

Class identity is a static clip-path accent inside the existing 22×10 FORE/AFT sil. The 80 px hub gains no child. Mech plate is unchanged. `reducedMotion` gains no facing loop. Fail-closed unknown keys omit the attribute and keep the generic organism. No Blocker or Major.

### What's done well

- Hub tree is still pupil + 3 cilia + RANGE (`hud.js` 726–729). `.rw-reticle` stays 80×80 (`hud.css` 184–193). No `[data-class-key]` rule touches the reticle.
- FORE/AFT words still come from `makeFacing` text nodes (`hud.js` 360–361). Fill vs hollow plus the word still carry facing (`hud.js` 365–378; `hud.css` 281–297).
- Sil box is still 22×10 and `flex: 0 0 22px` (`hud.css` 239–244, 1503–1506). Class rules restyle nose/body only; they do not change `.rw-facing-sil` width/height.
- Authored class clips stay inside that box (heavy 10×10 + 16×10; ace 8×6 + 13×6; cutter 9×7 + 17×9 at left 5; frigate 8×4 + 18×6 at left 4; freighter 9×7 + 17×10 at left 5). Right edge is 22 px. No AGEZ / 78 px rail-gap growth.
- `classKeyToken` allowlists `SHIP_CLASSES` with `hasOwnProperty`, returns `''` when family is not bio, never throws (`hud.js` 100–108). `applyClassKeyAttr` writes on change and deletes the attribute when empty (`hud.js` 110–115).
- Init and the 5 Hz path both call `applyClassKeyAttr` (`hud.js` 1101, 1757–1758). Class swap is outside the hullKind/family `if`, so a living remount updates without a family flicker.
- Key is `ctx.player.classKey` only. Lock / target classKey is not read.
- Light has no extra selector; it keeps the generic organism (`hud.css` 1508–1526). Unknown omit looks the same on purpose.
- Mech plate CSS is untouched (`hud.css` 1262–1284). No `#hud[data-family="mech"][data-class-key` rules. JS omits the attribute on mech.
- Bio variants reuse `--vein` mix from the generic organism. Class is shape, not a second palette. Color is never the only cue.
- Six living shapes stay one lineage: mass / length / tautness. No teeth, tentacles, or Earth animal photocopies.
- No new `@keyframes` on class facing. No `animation` on `[data-class-key]` selectors. Existing facing-flash stays on the words and is already killed under `body.rw-reduced-motion` (`hud.css` 293–307, 1183–1188).
- Duel parity: same glance set, same 5 Hz cadence, clip is accent in the sil box. Screen / Shell / petals / SPD / RANGE do not move.
- Digit 0 shipyard is not this UI. These files add no dock verb, SKU, or Digit.

### Findings

No Blocker or Major findings.

#### 🟡 Minor: Ace nose is a hard triangle

**Location:** `src/ui/hud.css:1555–1560`
**Issue:** `[data-class-key="ace"] .rw-facing-nose` uses a three-point `clip-path: polygon(100% 8%, 100% 92%, 0% 50%)` in an 8×6 px box. At this size the dart can read sharper than the ellipse family (heavy / cutter / frigate / light).
**Suggestion:** Playtest may retune clip-path (contract allows). Keep taut-dart language. Do not photocopy a squid. Stay inside 22×10.
**Status:** open, playtest. Hint table says “narrower taut dart”. Not an Earth toy.

#### 🟡 Minor: Five-class clip budget in 22×10 is tight

**Location:** `src/ui/hud.css:239–244`, `1503–1506`, `1538–1617`
**Issue:** Heavy, ace, cutter, frigate, and freighter must read as different static clips in one 22×10 box. Ace vs cutter vs frigate can collapse to “skinny blob” at HUD scale, especially at `--rw-text-scale` 0.85 or in combat dim.
**Suggestion:** Optional PR2 stills at 1600×900. If a class cannot read, fail closed keep generic bio for that key. Do not grow the sil box. Do not steal hub pixels. Do not add a class caption.
**Status:** documented in contract §0.14. Not blocking PR1.

#### 🟡 Minor: Self and target facing share the player class token

**Location:** `src/systems/hud.js:864`, `875`; `src/ui/hud.css:1538–1617`
**Issue:** `makeFacing` is used on the self rail and the target rail. `[data-class-key]` lives on `#hud`, so both sils take the mounted player clip. A living heavy pilot sees two shieldback-ish glyphs. FORE/AFT still mean hemisphere, not lock class.
**Suggestion:** Keep player-wide identity (same as `data-family`). Do not key the target sil off lock classKey (TGT / Q-ship leak). Do not add a class caption. Playtest may ask a later “self-only token”; that is not PR1.
**Status:** accepted by contract §0.13. Family already painted both facings the same.

#### 💡 Suggestion: Light vs unknown look the same

**Location:** generic `#hud[data-family='bio'] .rw-facing-*` at `src/ui/hud.css:1508–1526`; omit path `src/systems/hud.js:100–115`
**Issue:** Allowlisted `light` sets `data-class-key="light"` with no extra CSS. Unknown / missing keys delete the attribute. Both paint the generic organism.
**Suggestion:** None. Fail closed and light identity are the same clip on purpose.

#### 💡 Suggestion: Sil has no overflow clip

**Location:** `src/ui/hud.css:239–244`, `1503–1506`
**Issue:** `.rw-facing-sil` does not set `overflow: hidden`. Current class boxes fit (max right edge 22 px). A later clip retune could paint into the 8 px FORE/AFT gap.
**Suggestion:** Optional `overflow: hidden` on the sil only. Do not grow width/height.

### Focus checklist

| Focus | Result |
|---|---|
| HUD-01 empty 80 px hub — no class pip | Pass. No new reticle DOM. No class rule on `.rw-reticle`. |
| 22×10 sil box — must not grow toward AGEZ | Pass. Sil stays 22×10. Class children stay inside. Rail gap 78 px unchanged. |
| FORE/AFT words remain | Pass. `FORE` / `AFT` text nodes unchanged. |
| `reducedMotion`: no new facing loops | Pass. No class `@keyframes`. Global animation kill still applies. Flash already static under reduced motion. |
| Duel parity (Wave 61) | Pass. Same glance set and cadence. Clip is accent, not a new instrument. |
| Not Earth animal toys | Pass. Mass / length / tautness. Ace dart is a hint, not a squid photocopy. Cutter has no teeth. |
| Fail closed generic bio | Pass. Bad / missing / non-bio keys omit the attribute. Generic bio CSS still paints. Never throw. Never `innerHTML`. |
| Mech family unchanged | Pass. Plate CSS untouched. Attribute omitted on mech. |
| Color never the only cue | Pass. Class = shape. Facing = word + fill/hollow. Vein token shared. Colorblind FORE/AFT inset ring stays (`hud.css` 310–317). |
| Digit 0 not stolen | Pass. Not this UI. No dock Digit, SKU, or shipyard steal in these files. |

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets.
- No new settings checkbox. `body.rw-reduced-motion` / `rw-colorblind` / `rw-contrast` stay.
- Theming: class clips do not hardcode a second class color. They inherit `color-mix(..., var(--vein) ...)`.
- Responsive: sil is px-sized; FORE/AFT still scale with `--rw-text-scale`. XL type must not replace the glyph with an icon-only facing.
- Empty / error: unknown classKey = generic bio (correct fail-closed empty data).
- Vestibular: class clip is static. Hair/iris/flash loops are pre-existing and already gated.

### Digit / hub freeze (live)

| Surface | Live PR1 |
|---|---|
| `.rw-reticle` child | none new (`hud.js` 726–729) |
| Class pip / species / marine meter | none |
| Facing glyph | CSS tokens on `.rw-facing-sil` 22×10 |
| FORE/AFT | words + fill vs hollow |
| Digit 0 | not touched (shipyard stays elsewhere) |
| Toast | none for class |
| HUD-03 skin picker | closed; session override still mech\|bio (`hud.js` 92–97) |

### Worker audit

Worker `out/w113/hud02/ui-audit.md` also reports no Blocker/Major. This pass agrees. Extra notes: shared player token on both rails (accepted), tight 22×10 budget, optional sil overflow clip.

### Verdict

**0 Blocker. 0 Major.** PR1 living facing class tokens meet the HUD-02 picture: class hint on existing bio chrome, hub empty, sil 22×10, FORE/AFT stay, mech plate unchanged, fail closed, Digit 0 not stolen.
