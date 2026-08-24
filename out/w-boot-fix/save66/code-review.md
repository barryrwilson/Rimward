## Code Review: src/game/save.js (WAVE66 cargo restore)

### Summary
Restore reseals sanitized snap cargo when the blob omits hangar, after hangar starter trim. WAVE66 keep-list pins pass. A present hangar row still owns the live hold. No blocker or major.

### What's done well
- Survivor / ore keep-list is unchanged and fail-closed on reserved ids.
- `omitHangar` is one flag for both the hangar delete and the reseal.
- Reseal runs `sanitizeCargoList` again before it writes ctx.cargo or the mounted row.
- Probe covers WAVE66 harness rows and a hangar-present cargo swap.

### Findings

#### 🟡 Minor: Reseal can overfill hangar `cargoCapacity`
**Location:** `src/game/save.js` omit-hangar reseal
**Issue:** Starter hangar heals light hold max to 40. Reseal writes 57 WAVE66 units onto that row.
**Fix:** Do not trim here. Hangar trim is what dropped units 14, 2, and ore. Documented in security-review.md.

#### 🟡 Minor: `hangar: null` still trims
**Location:** `src/game/save.js` `omitHangar`
**Issue:** Only `undefined` counts as omit. `null` rebuilds a starter and trims.
**Fix:** Leave unless a pin requires non-object hangar to reseal.

#### 💡 Suggestion: `replaceCargo` shares row object identity
**Location:** `src/game/save.js` `replaceCargo`
**Issue:** Live hold keeps the sanitized row objects. Hangar write builds a second list via `sanitizeCargoList`. That split is correct.
**Fix:** None.

### Status
No blocker. No major. WAVE66 pins all-true on `out/w-boot-fix/save66/probe.mjs`.
