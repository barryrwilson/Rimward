## UI Audit: BIO-04 WPN rail (Wave 92)

### Summary
WPN copy reads group 5. Eligible hulls show `5 · Psionic bolt`. Ineligible built hulls show `5 · —`. No new HUD tree, no aim-glass gauge, no CSS.

### What's done well
- Empty copy is the em dash, never the words “not available”.
- Lead and RANGE use psionic speed/range only when `canFirePsionic` is true; otherwise they hide / use 0 (mining pattern).
- Strain row stays heat %. No second bar.
- HUD family for a grafted built hull stays `mech`. HUD does not write `player.hullKind`.
- Names go through `textContent`.

### Findings

No Blocker or Major issues.

#### 🟡 Minor: Digit 5 help line is longer

**Location:** `src/systems/controls.js` HUD controls list
**Issue:** The help string now lists five groups. The controls panel already wraps long lines.
**Fix:** Leave. Do not add a new rail.

#### 💡 Suggestion: No family swatch on the WPN rail

**Issue:** Magenta-rose identity is on the bolt, not on the WPN label. Color is never the only signal for fire; Digit 5 + name carry the group.
**Fix:** None. HUD-01 forbids extra aim-glass chrome.

### Aim glass
- No incoming psi gauge.
- No lock box.
- No aspect ring.
- Reticle `.in-range` may light when eligible range contains the target (existing class).

---

## Re-review (unset hullKind)

No Blocker or Major. WPN on a starter with no `hullKind` shows `5 · Psionic bolt` (same helper). Forced `hullKind === 'built'` still shows `5 · —`. No new HUD nodes.
