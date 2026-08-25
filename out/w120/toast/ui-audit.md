## UI Audit: Wave 120 PR1 toast-flood

### Summary
Five chips, same top-right stack, polite live region. Expire hides from AT via `aria-hidden`. Optional `visibility: hidden` does not move geometry or raise z. No Blocker or Major findings.

### What's done well
- Boot empty chips start `aria-hidden="true"`.
- Real show sets `aria-hidden="false"` then `textContent`.
- Identical refresh does not re-announce (no `textContent` write).
- AUTOSAVE HELD vs SAVE BLOCKED is readable text, not color-only.
- Glyph prefixes stay (`▲`).
- `.rw-toasts` still `role="status"` `aria-live="polite"`.
- Place stays `top: 14px; right: 168px`. `pointer-events: none` stays.
- No toast z-index. Overlay hail/chart/berth stacking not claimed.

### Findings

No 🔴 Blocker.  
No 🟠 Major.

#### 🟡 Minor: `:not(.show) { visibility: hidden }` skips the 0.35 s fade
**Location:** `src/ui/hud.css:734` with `.rw-toast` transition at 729  
**Issue:** Removing `show` now hides at once. Opacity fade no longer plays.  
**Fix:** Allowed by merge law as a hide, not a z raise. Keep. Do not add a new motion rule.

#### 💡 Suggestion: long berth reason may still clip at XL text scale
**Location:** `.rw-toast` `white-space: nowrap` (`hud.css:730`)  
**Issue:** Pre-existing nowrap. AUTOSAVE HELD is short. Berth hostile sentence can clip.  
**Fix:** Out of this leftover. Do not grow slots or move the stack.

### Method
Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did not spawn `[designer]`.

### Second pass
Re-read toast CSS and a11y attributes. Still no Blocker/Major. HUD-01 hub untouched. Digit 0/8/9 untouched.
