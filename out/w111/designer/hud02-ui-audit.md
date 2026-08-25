# UI Audit: HUD-02 remaining living class silhouettes (Wave 111 spec)

**Auditor:** `[designer]` (independent of `out/w111/hud02/ui-audit.md`)
**Scope:** Wave 111 HUD-02 leftover — markdown design only. Later PR1 class hint on existing living facing chrome. Confirm later PR1 does **not** steal HUD-01 empty 80 px hub; Digit 0/8/9 stay; fail closed generic bio; no RANGE class names; no `innerHTML`; class token allowlist; `reducedMotion`; both self and target facings.
**Review file:** `out/w111/designer/hud02-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Live cites: `src/ui/hud.css` hub / facing / family skins, `src/systems/hud.js` family switch / `makeFacing` / RANGE, Digit 0/8/9 in `src/systems/station.js`. Pack: `docs/Hud02RemainingSilhouettesDesign.md`, merge law `out/w111/hud02/shared-contract.md`, inventory `out/w111/hud02/current-hud02-silhouette-inventory.md`. Worker self-audit `out/w111/hud02/ui-audit.md` read, not copied. No Playwright. No Vite. [NO BROWSER COVERAGE].
**Date:** 2026-08-24
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w111/hud02/shared-contract.md` wins if the spec forks. This wave does not ship overlay CSS. Findings bind **later PR1**.

## UI Audit: remaining living class silhouettes (design spec)

### Summary

The picture is a **22×10 facing clip** keyed from allowlisted player `classKey`, not a new HUD widget. The spec does not put a species pip on the 80 px hub. It does not steal Digit 0/8/9. Unknown keys keep today’s generic bio glyph. `innerHTML` is forbidden. RANGE stays the TGT-01 word. No 🔴 Blocker. No 🟠 Major.

### Verdict

**PASS.** 0 blockers, 0 majors. Spec freeze holds for later PR1. Open notes are clip-budget discipline, shared self/target token, and CSS family gating.

### What's done well

- Player-facing change reuses live chrome: `.rw-facing-sil` nose + body (`src/systems/hud.js` 337–344). No new string, Digit, toast, or hub child.
- HUD-01 empty glass stays empty. `.rw-reticle` is 80×80, `pointer-events: none` (`src/ui/hud.css` 184–193). Live children stay pupil, three cilia, RANGE (`hud.js` 709–712). Spec forbids class pip / species name / marine meter on `.rw-reticle` (contract §0.2; spec Goals 6 / Non-goals).
- RANGE is still the in-range word (`hud.css` 207–220; `hud.js` 712, 1381–1385). Spec alternatives table forbids a class name on RANGE.
- Digit 0 stays shipyard (`src/systems/station.js` 188 last of `DOCK_KEY_SERVICES`, menu 5963–5966, dock-root `d === 0` 6100–6102). Digit 8 dock root is launch (index 7). Digit 9 is epics / Standing (index 8). Outfitting 8/9 stay launcher / turret papers (`station.js` 1644–1645). Class hint is not a dock verb.
- Family switch stays `hudFamily` → `'mech' | 'bio'` (`hud.js` 81–89). `#hud[data-family]` writes init + 5 Hz (`hud.js` 1078–1083, 1719–1737). Spec does not invert Wave 61 §3.2 (no family from `classKey` alone).
- Fail closed is the live generic organism (`hud.css` 1503–1526). Missing / non-string / non-`hasOwn` `SHIP_CLASSES` omits `data-class-key`. Never throw. Never `innerHTML`. Mech PR1 gains no class facing rules.
- Allowlist is live `SHIP_CLASSES` six keys (`src/game/state.js` 37–44). Formula uses `Object.prototype.hasOwnProperty.call` (contract §0.7 / §0.1). Proto keys cannot become CSS.
- `innerHTML` is absent in live `hud.js`. Spec forbids `innerHTML`, `insertAdjacentHTML`, SVG markup from `classKey`, and CSS `clip-path` concatenated from save strings.
- `reducedMotion`: live `#hud *` kills animation/transition (`hud.css` 1185–1188). Facing flash already static outline (`hud.css` 305–308). Spec forbids new facing `@keyframes` and new settings checkbox.
- Both facings exist today (`hud.js` 847 self, 858 target). Contract §0.13 + §0.1 item 8: same **player** token on both; lock `classKey` ignored (Q-ship / TGT). FORE/AFT words remain the facing data (`hud.js` 336, 1389–1408).
- Pixel freeze: clip stays in 22×10 (`hud.css` 239–244, 1503–1506). Do not grow toward `RAIL_GAP` 78 (`hud.js` 100; `hud.css` 897–903).
- Persist none. Hangar already stores `classKey`. `state.js` stays read-only. Session `rw-hud-family` stays mech|bio (`hud.js` 92–97).
- Earth photocopies forbidden. Hint table is mass/length inside the box, not shark/squid toys.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Self and target silhouettes share the player class token

**Location:** `makeFacing` self + target (`src/systems/hud.js` 847, 858); family CSS already skins both (`src/ui/hud.css` 1503–1526); contract §0.13 / §0.1 item 8; spec mermaid “lock classKey ignore”
**Severity:** minor
**Status:** accepted by merge law. Do not “fix” with lock `classKey`.

**Issue:** After PR1 a living heavy player sees two heavy-ish glyphs. Target FORE/AFT still mean lock hemisphere (`hud.js` 1401–1404). The right-hand sil does **not** mean “the lock is a heavy.” Players can misread identity as target class.

**Fix:** Keep `#hud[data-class-key]` family-wide (same as `data-family`). Do not key `.rw-combat-target .rw-facing-sil` from lock class. Do not add a class caption. Playtest may ask a later self-only token; that is not PR1.

#### 🟡 Minor: Live bio body already fills 22×10 — “taller / longer” cannot grow the box

**Location:** `.rw-facing-sil` 22×10 (`hud.css` 239–244, 1503–1506); bio nose 10×8 (`1508–1516`); bio body `left: 6px; width: 16px; height: 10px; top: 0` (`1518–1526`); spec deputize hint table (heavy taller, cutter/frigate longer, freighter bulkier); contract §0.14
**Severity:** minor
**Status:** open for later PR1 CSS. Spec freeze already says “inside 22×10.”

**Issue:** Bio body already uses the full sil height. Nose + body already span 22 px. Literal `height` / `width` bumps overflow toward FORE/AFT or the 78 px AGEZ gap. `.rw-facing-sil` has **no** `overflow: hidden` (unlike `.rw-bar` at `hud.css` 99). Ace / cutter / frigate can collapse to one skinny blob at 22 px.

**Fix:** Differentiate with authored `clip-path` / radius **inside live bio box sizes**. Do not raise sil, nose, or body above 22×10 / 10×8 / 16×10. Prefer `overflow: hidden` on `.rw-facing-sil`. If a key cannot read, omit visual delta (generic bio) for that key. Optional PR2 stills at 1600×900. Do not steal hub pixels.

#### 🟡 Minor: JS formula vs mech fail-closed can leak class CSS onto plates

**Location:** contract §0.1 fail-closed “family is not bio → omit `data-class-key`”; formulas block (`shared-contract.md` 87–96) allowlists `SHIP_CLASSES` only; §2 mech row “omit class facing CSS”; spec CSS example `#hud[data-family="bio"][data-class-key="…"]`
**Severity:** minor
**Status:** spec hole. Later PR1 must close it in CSS **and** JS.

**Issue:** Built hulls still have `classKey` (`state.js` 37–44). If PR1 writes `dataset.classKey` on mech and a selector drops `[data-family="bio"]`, the plate (`hud.css` 1262–1284) can grow an organism clip. That inverts Wave 62 glance.

**Fix:** Omit `data-class-key` unless `hudFamily === 'bio'` **and** the key is allowlisted. Every class rule must include `#hud[data-family="bio"]`. Mech PR1: zero class facing rules.

#### 🟡 Minor: “Rail chrome” leftover wording is wider than PR1

**Location:** spec Goals 2 (“facing / rail chrome”); inventory §3 hair / iris / contacts stay generic; contract §0.16 “accent inside the sil box. Same glance set, same cadence”
**Severity:** minor
**Status:** PR1 must stay sil-box. Do not class-tint hair.

**Issue:** Inventory census names same facing **and** same rail chrome for every living class. PR1 lands facing tokens only. A later worker can read Goal 2 as permission to restyle bio hair, iris breathe, or petals per class. That changes cadence (`hud.js` `bioPeriodSec` 107–113; `--rw-bio-period`) and can fight `reducedMotion` hair kill (`hud.css` 1483–1488, 1616–1622).

**Fix:** Freeze PR1 to `.rw-facing-nose` / `.rw-facing-body` under bio. Do not add per-class hair, iris, petal, or contact-pip rules. Duel parity stays.

#### 💡 Suggestion: Shape first — color is never the only class cue

**Location:** facing law `hud.js` 336; color-blind FORE/AFT inset (`hud.css` 310–317); bio `--vein` remap (`hud.css` 1603–1605)
**Severity:** suggestion
**Status:** honor in PR1 CSS.

**Issue:** A vein-tint-only class delta disappears under `rw-colorblind` (`--vein: var(--rw-good)`). FORE/AFT words still carry facing, but class identity would vanish.

**Fix:** Authored clip-path / width-height inside the box is the class cue. Tint is optional accent. Do not drop FORE/AFT.

#### 💡 Suggestion: Do not reuse RANGE, iris, or hub ring as class chrome

**Location:** RANGE `hud.js` 712, `hud.css` 207–220; iris `hud.css` 320–327; contract explicit non-picks
**Severity:** suggestion
**Status:** frozen in spec. PR2 grep.

**Issue:** Painting `HEAVY` on RANGE, a species word on `.rw-reticle-range`, or a class pulse on `.rw-reticle::after` would smash TGT-01 and HUD-01 empty glass.

**Fix:** Keep the freeze. Optional PR3 re-grep `.rw-reticle` child + RANGE text.

### Accessibility / theming / layout / states

- **Controls:** no new buttons, focus rings, or hit targets. Facing and reticle stay `pointer-events: none` on rails / hub (`hud.css` 191, 894).
- **Theming:** class rules must use existing `--vein` / `--cyan` / `color-mix`, not hardcoded Earth-animal palettes. Live bio already uses `color-mix` (`hud.css` 1514–1525).
- **Responsive:** sil is px-sized. `--rw-text-scale` scales FORE/AFT (`hud.css` 273), not the sil. XL scale must not clip the words; class CSS must not add sil margin.
- **States:** unknown / missing `classKey` = generic bio (correct empty/error data). Hangar not synced = generic until 5 Hz allowlist. Mech = plate, no class clip. Partial CSS/JS merge still paints live family skins.
- **Loading:** attribute write-on-change on the existing 5 Hz path (`hud.js` 1714–1737). No per-frame `clip-path` string. No new nodes.
- **Vestibular:** no new facing loops. Hair/iris already gated. `emitFamilyTick` already returns on `reducedMotion` (`hud.js` 1088).
- **Contrast:** `rw-contrast` bio hair rules stay (`hud.css` 1607–1614). Class clip must not hide FORE/AFT fill vs hollow.

### Digit / hub / facing freeze table

| Surface | Live | Spec later PR1 |
|---|---|---|
| `.rw-reticle` child | pupil + 3 cilia + RANGE (`hud.js` 709–712) | **none new** |
| Hub size | 80×80 (`hud.css` 184–193) | do not grow |
| Class pip / species / marine meter | absent | **forbidden** |
| RANGE word | TGT-01 in-range (`hud.css` 207–220) | no class name |
| Facing glyph | `.rw-facing-sil` 22×10, two copies | CSS tokens only; player key |
| FORE/AFT | words + fill vs hollow | do not replace with icon-only |
| Digit 0 | shipyard | do not steal |
| Digit 8/9 | launch / Standing; outfitting papers | do not steal |
| Toast | not required | no `CLASS: HEAVY` |
| `innerHTML` | none in `hud.js` | **forbidden** |
| Allowlist | `SHIP_CLASSES` six (`state.js` 37–44) | `hasOwn` then `data-class-key` |
| Fail closed | generic bio clip | omit attribute; never throw |
| `reducedMotion` | `#hud *` animation none | static clip; no new loops |
| HUD-03 skin picker | closed | do not add |
| Family audio | Wave 65 five CUES | do not add per-class ticks |

### Checklist (Wave 111 HUD-02 spec)

| Check | Result | Cite |
|---|---|---|
| Later PR1 does not steal HUD-01 empty hub | **Pass.** No hub child. No pip. | spec §Proposed 1; contract §0.2; `hud.css` 184–193; `hud.js` 709–712 |
| Digit 0/8/9 stay | **Pass.** Class hint is not a dock verb. First serial must not steal. | spec §0.3 analog; `station.js` 188, 1644–1645, 5963–5966, 6100–6102 |
| Fail closed generic bio | **Pass.** Omit `data-class-key`; live organism remains. | contract §2; `hud.css` 1503–1526 |
| No RANGE class names | **Pass.** Forbidden in non-goals / alternatives. | `hud.js` 712; spec alternatives “Species pip on hub / RANGE” |
| No `innerHTML` | **Pass.** Authored CSS only. | contract §0.4; `hud.js` `el()` 244–249 |
| Class token allowlist | **Pass.** `SHIP_CLASSES` + `hasOwn`. | `state.js` 37–44; contract formulas |
| `reducedMotion` | **Pass.** Static clip; no new facing keyframes. | `hud.css` 1185–1188, 305–308; contract §0.15 |
| Both self and target facings | **Pass (player token).** Both copies exist; lock key ignored. | `hud.js` 847, 858; contract §0.13 |

### Re-review

No Blocker/Major opened. Shared player token, 22 px internal-clip discipline, mech selector gating, and sil-only (not hair) scope remain documented for later PR1. This wave is markdown only; do not land `src/`.
