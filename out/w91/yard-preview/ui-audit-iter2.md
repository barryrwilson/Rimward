## UI Audit: yard-preview (iteration 2)

### Summary
The Yard tile size is unchanged. Camera distance is now shared, so a heavy living manta fills more of the well than a light one. Confirm-heavy should still read as the large living class.

### What's done well
- List tiles stay 128×84. Confirm stays 168×108.
- Relative size is visible without a new Digit or extra copy.
- Reduced-motion freeze, decorative canvas, and contrast border are unchanged.
- Empty margin around light is the size cue, not a missing model.

### Findings

#### 🟡 Minor: Light living has more void in the well
**Location:** `src/ui/screens.css:425-431`; `src/systems/yard-preview.js:188-206`
**Issue:** Light occupies roughly 0.4 of the family span. The well looks emptier than before.
**Fix:** Keep it. Filling the well would hide class scale.

#### 💡 Suggestion: Optional scale tick
**Location:** yard offer copy
**Issue:** No text says “relative size”. The model should carry that.
**Fix:** Do not add a caption unless playtests still mix light and heavy.

### Re-review
No Blocker or Major. Keyboard papers, Digit map, and contrast tokens hold.
