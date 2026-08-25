## Code Review: Wave 114 HUD-02 PR1 plated facing class tokens

### Summary
The family gate on the live writer is the smallest correct change. Authored mech metrics match the contract budget and uniqueness law. WAVE113 census pins `mechOmit` and `noMechClass` will FAIL by design; WAVE114 pins the new law without editing WAVE113.

### What's done well
- Extends `classKeyToken` only (`family !== 'bio' && family !== 'mech'`); keeps `applyClassKeyAttr`.
- Bio tokens still return allowlisted keys; unknown/proto omit.
- CSS is gated `#hud[data-family="mech"][data-class-key]`; light omits a rule and keeps the generic plate.
- Heavy is tall-only (16×8); freighter is tall and realloc (18×8, nose 3). Tuples do not collide.
- Invariants `left+width ≤ 22` and `top+height ≤ 10` hold. Sil 22×10 / flex-basis unchanged.
- Boot pin uses `dataset.classKey` / `dataset.family` / `children.length`, not `getAttribute` / `childElementCount`.
- Digit 0, `hudFamily`, hub DOM, `state.js`, persist, and WAVE62/65 source pins stay.

### Findings

No 🔴 Blocker or 🟠 Major product defects.

#### 🟡 Minor: WAVE113 living pin now fails two census keys
**Location:** `scripts/boot-test.mjs:23035-23036` (`mechOmit`) and `23079` (`noMechClass`)
**Issue:** WAVE113 required mech to omit `data-class-key` and required zero mech `[data-class-key]` CSS. PR1 must invert both. The WAVE113 block was not edited (scope freeze).
**Fix:** Orchestrator / later pin wave should drop or rewrite those two WAVE113 keys. Do not revert PR1.
**Status:** accepted — out of this worker's write set; documented in `notes.md`

#### 💡 Suggestion: ace/frigate inherit a 6 px nose triangle
**Location:** `src/ui/hud.css:1267-1271` vs class bodies at 1298-1324
**Issue:** Generic mech nose stays `border-top/bottom: 3px` (6 px tall). Ace/frigate bodies are 4 px tall. Contract only names `border-right`.
**Fix:** Optional playtest retune of nose `top` / vertical borders. Not required for uniqueness.
**Status:** deferred — contract numeric table does not include nose height

### Coverage
- Node probe `out/w114/hud02mech/probe.mjs` asserts allowlist, family gate, omit, CSS selectors, sil budget, uniqueness, no innerHTML, no `state.js` write, Digit 0, WAVE114 pin.
- WAVE114 boot pin ticks plated heavy/freighter/light, proto/unknown omit, living heavy still tokens.
