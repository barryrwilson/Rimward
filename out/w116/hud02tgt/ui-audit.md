## UI Audit: HUD-02 PR1 target facing class tokens

### Summary
Target class is a 22×10 facing hint on the existing lock row. Player class no longer restyles the target glyph. Family chrome stays player `data-family`. No Blocker or Major.

### What's done well
- Sil box stays 22×10 / `flex: 0 0 22px`.
- Light keeps generic family facing on the target row.
- FORE/AFT words stay. RANGE and the 80 px hub stay empty of class pips.
- Mech vs bio language follows player `#hud[data-family]`.
- `reducedMotion` gains no new facing loops.

### Findings

#### 🟡 Minor: Bio player locking a plated hull still sees bio clips
**Location:** `#hud[data-family="bio"] .rw-combat-target[data-class-key]`
**Issue:** Class sits inside player family, so a living hull locking a plated ace paints WAVE113 clips, not WAVE114 plates.
**Why it stays:** Contract freeze. Do not invent lock-family `data-family` on the rail.

#### 💡 Suggestion: Live stills
**Issue:** Optional PR2 mismatch stills are not in this worker.
**Why it stays:** Task says live stills later for the verifier.

### Passed Checks
- [x] No class pip on `.rw-reticle`
- [x] No new DOM on `.rw-reticle`
- [x] Player tokens scoped to `.rw-combat-self`
- [x] Target tokens scoped to `.rw-combat-target[data-class-key]`
- [x] Hub 80×80 unchanged
