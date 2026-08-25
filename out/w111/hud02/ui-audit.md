# UI Audit: HUD-02 remaining living class silhouettes (Wave 111)

### Summary

No product chrome ships this wave. This audit treats the pack as an **overlay-picture spec** for later living class hints — measured against live Wave 62/65 HUD-02, HUD-01 empty 80 px hub, Digit 0/8/9, AGEZ, and `reducedMotion`. Picture is a **22×10 facing clip that hints class**, not a new HUD widget. Hub theft is **not** proposed (Blocker if a later serial adds a species pip). Digit theft is **not** proposed. Fail-closed missing/unknown `classKey` keeps today’s generic living glyph (HUD does not halt).

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Spec audit, not a running page.

### What's done well

- Player-facing change is **existing facing chrome**: living classes read as different static clips in the sil box. No new string, Digit, or required toast.
- Empty hub freeze is explicit: no class pip, species name, or marine gauge on `.rw-reticle` (`src/ui/hud.css` 184–193; `hud.js` 709–712 RANGE stays TGT-01).
- FORE/AFT words + fill vs hollow stay the facing **data** (`hud.js` 336–362, 1389–1408). Color is never the only cue. Class clip is accent.
- Digit 0/8/9 stay shipyard / launch / Standing. Class hint is not a dock verb.
- `reducedMotion` keeps live animation kill (`hud.css` 1185–1188). Spec forbids new facing `@keyframes`. Existing `body.rw-reduced-motion` / `rw-colorblind` / `rw-contrast` stay.
- Family skins remain the live mech vs bio language; this leftover does not add a third identity or reopen HUD-03 skin picking.
- Both HUD families keep the same glance set. Mech plate is unchanged in PR1.
- Earth photocopies forbidden — glyphs hint, they do not stamp shark/squid toys on the rail.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Self and target facing share the player class token

**Location:** `makeFacing` used on self **and** target (`hud.js` 847, 858); family CSS already skins both (`hud.css` 1503–1526). Contract §0.13: player key, not lock key.

**Issue:** After PR1 a living heavy player will see two shieldback-ish glyphs. The target’s **class** is not what the glyph means — FORE/AFT still mean lock hemisphere. Players might read the right-hand sil as “the lock is a heavy.”

**Fix:** Keep player-wide identity (same as `data-family`). Do **not** key the target sil off lock classKey (TGT leak). FORE/AFT words remain the data. Playtest may ask a later “self-only token”; not PR1. Do not add a class caption.

**Status:** accepted; family already paints both facings the same.

#### 🟡 Minor: Five-class clip budget in 22×10 is tight

**Location:** `.rw-facing-sil` 22×10 (`hud.css` 239–244, 1503–1506); deputize hint table.

**Issue:** Ace vs cutter vs frigate can collapse to “skinny blob” at 22 px. Light keeping the live glyph is correct; others must still differ without leaving the box or entering AGEZ.

**Fix:** Modest clip-path / height / length only. Optional PR2 stills at 1600×900. If a class cannot read, fail closed keep generic bio for **that** key (same spirit as BIO-07 Wave 95 keep). Do not grow the box. Do not steal hub pixels.

**Status:** documented in contract §0.14 / §2 missing-rule row.

#### 💡 Suggestion: Do not reuse RANGE for class name

**Location:** `hud.js` 712 RANGE.

**Issue:** Painting `HEAVY` on RANGE would smash TGT-01 and HUD-01 empty glass.

**Fix:** Contract already forbids. PR2 grep RANGE / `.rw-reticle`.

**Status:** frozen.

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets.
- No new settings checkbox. HUD-03 `body.rw-*` continue to override tokens.
- Color-blind: FORE/AFT inset ring stays (`hud.css` 310–317). Class clip must not drop the words.
- Contrast: existing `rw-contrast` bio hair rules stay (`hud.css` 1607–1610).
- Responsive: sil is px-sized already; XL text scale must not clip FORE/AFT (`--rw-text-scale`).
- Empty / error / loading: unknown classKey = generic bio (correct disabled-data state).
- Vestibular: no new facing loops. Hair/iris already gated.

### Digit / hub freeze table

| Surface | Spec | Later serial |
|---|---|---|
| `.rw-reticle` child | none new | forbidden |
| Class pip / species / marine meter | none | forbidden |
| Facing glyph | `.rw-facing-sil` 22×10 | CSS tokens only |
| FORE/AFT | words + fill vs hollow | do not replace with icon-only |
| Digit 0 | shipyard | do not steal |
| Digit 8/9 | launch / epics; outfitting papers | do not steal |
| Toast | not required | do not add “CLASS: HEAVY” |
| HUD-03 skin picker | closed | do not add |

### Re-review

No Blocker/Major opened. Shared player token on both facings and 22 px budget remain documented, not blocking.
