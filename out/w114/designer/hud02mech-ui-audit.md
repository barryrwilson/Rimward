# UI Audit: Wave 114 HUD-02 PR1 plated class tokens

**review_file:** `out/w114/designer/hud02mech-ui-audit.md`  
**Wave:** 114. Implementation re-audit. Review only. No product `src/` edits. No Vite. No Chrome.  
**Applied:** designer persona + `orchestrator/references/ui-audit.md`.  
**Sources:** `src/systems/hud.js` (`classKeyToken` / `applyClassKeyAttr`), `src/ui/hud.css` (mech plate + `[data-class-key]` metrics), contract `out/w113/hud02mech/shared-contract.md`. Worker self-audit `out/w114/hud02mech/ui-audit.md` read, not copied.  
**Verdict:** **CLEAN**

### Summary

PR1 keeps class identity as a static triangle+square hint inside the live 22×10 facing sil. Mech paint is CSS-gated to `#hud[data-family="mech"]`. Unknown keys omit the attribute and leave family facing. Heavy 16×8 and freighter 18×8 do not share a tuple. No hub child. No sil grow. No new facing motion.

**Counts:** 🔴 Blocker **0**. 🟠 Major **0**. 🟡 Minor **1**. 💡 Suggestion **2**.

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Class hint inside 22×10 `.rw-facing-sil`; never grow sil | **Pass.** Class selectors never retarget `.rw-facing-sil`. Base sil stays `width: 22px; height: 10px; flex: 0 0 22px`. Global `box-sizing: border-box` (`src/style.css` 2–6) so `left+width` and `top+height` are the painted box. Every authored row `left+width ≤ 21`, `top+height ≤ 9`. | `hud.css` 239–244, 1262–1265, 1286–1336 |
| Never steal HUD-01 80 px hub | **Pass.** `.rw-reticle` still 80×80. Init still pupil + 3 cilia + RANGE. No `[data-class-key]` rule on the reticle. | `hud.css` 184–193; `hud.js` 726–729 |
| Mech CSS only when `data-family="mech"`; no mechanical plate on bio | **Pass.** All new plate metrics use `#hud[data-family="mech"][data-class-key="…"]`. Bio organism + sibling clip-path stay. `classKeyToken` still returns allowlisted keys on bio; writer does not delete on family flip. | `hud.css` 1286–1336, 1555–1668; `hud.js` 101–114, 1758 |
| Heavy 16×8 vs freighter 18×8 must read as different; light may keep generic | **Pass.** Heavy: inherited nose 5 / body `5,1,16×8`. Freighter: nose 3 / body `3,1,18×8`. Light has no class rule. | `hud.css` 1267–1292, 1327–1336 |
| FORE/AFT stay | **Pass.** `makeFacing` still writes FORE/AFT words. Class CSS touches nose/body only. | `hud.js` 353–361, 864, 875 |
| `reducedMotion`: no new facing loops | **Pass.** No `animation` / `@keyframes` on mech `[data-class-key]` rules. Existing HUD kill-all still applies. | `hud.css` 1183–1188, 1286–1336 |
| Fail closed unknown key: family facing still paints | **Pass.** Non-allowlisted / non-string / `__proto__` → `''` → delete `data-class-key`. Generic mech plate or bio organism remains via `data-family`. Never throws. | `hud.js` 101–114 |
| Earth tank / wet-navy photocopy forbidden; triangle+square only | **Pass.** Mech class rules set `left` / `top` / `width` / `height` / `border-right-width` only. No `clip-path`, no extra glyphs, no fill-color cue. | `hud.css` 1286–1336 |

### Tuple uniqueness (border-box)

Live generic mech plate (also `light` / unknown): nose 5 / body `5,2,16×6`.

| `classKey` | Nose | left | top | width | height | left+width | top+height | Notes |
|---|---|---|---|---|---|---|---|---|
| `light` | 5 | 5 | 2 | 16 | 6 | 21 | 8 | no extra CSS |
| `heavy` | 5 | 5 | 1 | 16 | 8 | 21 | 9 | tall-only |
| `ace` | 4 | 4 | 3 | 14 | 4 | 18 | 7 | short + thin |
| `cutter` | 4 | 4 | 2 | 17 | 6 | 21 | 8 | realloc vs light |
| `frigate` | 3 | 3 | 3 | 18 | 4 | 21 | 7 | realloc + thin |
| `freighter` | 3 | 3 | 1 | 18 | 8 | 21 | 9 | tall + realloc |

Heavy and freighter share height 8 / top 1 and split on width and nose. Tuples do not collide.

### What's done well

- One writer: `classKeyToken` family gate is `bio` **or** `mech`; `applyClassKeyAttr` stays the only `dataset.classKey` path (`hud.js` 101–114, 1101, 1758).
- Class swap is outside the hullKind/family `if`, so a plated remount updates at 5 Hz without a family flicker (`hud.js` 1741–1758).
- Token reads `ctx.player.classKey` only. Lock / target class is not a source (`hud.js` 103). Self and target sils share the player plate, as the contract requires.
- Visual restyle is authored CSS, not `innerHTML`, SVG, or per-frame `clip-path` strings.
- Color is inherited from the live mech plate (`rgba(111, 242, 224, …)`). Class cue is metrics, so color-blind still reads shape.
- Bio `[data-class-key]` clip-path block is untouched. Mech rules cannot match `data-family="bio"`.
- Hub, RANGE, FORE/AFT, Digit, persist, and family switch are out of this paint.

### Findings

No 🔴 Blocker or 🟠 Major findings.

#### 🟡 Minor: thin-class nose vs body height

**Location:** `src/ui/hud.css:1294-1324` (ace, frigate) vs live nose `src/ui/hud.css:1267-1271`

**Issue:** Ace and frigate bodies are `height: 4px` at `top: 3px`. The inherited mech nose stays `top: 2px` with `border-top/bottom: 3px` (6 px triangle). The join sits 1 px proud of the plate inside the sil. Not a sil grow. Not an overflow of 22×10 (`top 2 + 6 = 8 ≤ 10`).

**Fix:** After playtest, set matching vertical nose borders (or `top`) on those two keys only. Do not grow the sil. Do not use fill color.

**Status:** accepted for PR1 — contract table freezes `border-right` only for nose.

#### 💡 Suggestion: cutter vs light is a 1 px realloc

**Location:** `src/ui/hud.css:1305-1313` vs generic `src/ui/hud.css:1267-1280`

**Issue:** Cutter is nose 4 / body `4,2,17×6`. Light/generic is nose 5 / body `5,2,16×6`. Same height and top. The length delta is 1 px. Tuples are unique (contract met). Glance at 22 px may still read as the generic plate.

**Fix:** Optional playtest. If cutter does not read, split on a second in-box axis (for example `top` or `height`) inside the budget. Do not grow the sil.

**Status:** optional. Not a uniqueness miss.

#### 💡 Suggestion: confirm glance at 1600×900

**Location:** overlay `.rw-facing-sil` (`hud.css` 239–244, 1262–1336)

**Issue:** This audit did not start Vite or Chrome. Worker probe is Node string checks only.

**Fix:** Optional PR2 stills after playtest (contract §3): mech family, six allowlisted keys, one unknown key, one bio+allowlisted key (organism, not plate).

**Status:** out of PR1.

### Accessibility / states

- No new control. No new name, focus ring, or keyboard path is required.
- Contrast inherits the live mech plate token. Class is shape, not color.
- Unknown / missing `classKey`: generic mech plate if family is mech; generic/sibling bio if family is bio. Game does not freeze.
- Family not mech + allowlisted key: attribute stays; mech class CSS does not match; bio tokens still paint.
- Empty hub: still 80×80 with pupil, cilia, RANGE only. Mech family still hides pupil/cilia via existing Wave 62 rules (`hud.css` 1192–1194) — not this PR.
- `reducedMotion`: no new facing loop to kill. Existing `body.rw-reduced-motion #hud *` already sets `animation: none`.
- Hover / disabled / loading: not applicable. The sil is not a control.

### Worker self-audit delta

Worker `out/w114/hud02mech/ui-audit.md` reported 0 Blocker / 0 Major, one Minor (ace/frigate nose height), one Suggestion (stills). Independent check agrees on those two. Added the cutter-vs-light 1 px glance suggestion. Did not promote the nose join to Major: the paint stays inside 22×10.
