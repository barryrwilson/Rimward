## Code Review: HUD-02 PR1 living facing class tokens

### Summary
Class tokens write on the existing 5 Hz path and at init, independent of the hullKind family if-block. Mech omits the attribute. WAVE62 `hudFamily` and no-hullKind-write greps stay intact. Bio clips stay in the 22×10 box.

### What's done well
- `classKeyToken` matches the contract formula (string + hasOwn `SHIP_CLASSES`, bio only, else `''`).
- Hangar class swap does not change `hullKind`; compare sits after the family if, every 5 Hz.
- Init also applies the token so the first paint is not a blank wait.
- Target and self facing share `#hud[data-class-key]` (player identity, not lock class).
- No new nodes. Write-on-change. No per-frame clip-path strings.
- WAVE113 pin is append-only at the end of `boot-test.mjs`.

### Findings

No Blocker or Major findings.

#### 🟡 Minor: Light has no extra CSS rule
**Location:** `src/ui/hud.css` after generic bio facing
**Issue:** `data-class-key="light"` is set, but clip stays the live generic organism.
**Fix:** None. Contract says light may keep today’s glyph.
**Justification:** Player outcome + hint table. Fail closed still paints.

#### 💡 Suggestion: WAVE113 live ticks mutate `ctx.player` then restore
**Location:** `scripts/boot-test.mjs` WAVE113 block
**Issue:** Same pattern as WAVE62 `hullKind` tick. Restore runs before process exit.
**Fix:** None required. Later waves must not assume classKey/hullKind after WAVE113 without restore (restore is present).

### Pin-only follow-up (iteration 2)
WAVE113 now reads `hudRoot113.dataset.classKey` / `dataset.family` like WAVE62, and hub kids via `reticle113.children.length`. Do not use `getAttribute` / `childElementCount` on the boot stub. Official harness JSON is all true. WAVE26 FAIL count stays 5.

### Passed
- 5 Hz miss on class-only remount: addressed (independent compare).
- Mech omit: `family !== 'bio'` → delete attribute; no mech class CSS.
- WAVE62 invert: `hudFamily` still mech|bio; no `classKey` in that function; `hullKind\s*=(?!=)` still absent in `hud.js`.
- Sil box growth: class rules do not retarget `.rw-facing-sil`; nose/body left+width ≤ 22, top+height ≤ 10.
