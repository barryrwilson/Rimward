## UI Audit: NAV-02 cyan ring + HUD GATE distance

### Summary
No HUD-01 layout, CSS, or chart chrome changes. The in-world ring and GATE readout still consume `readNavGuidance().pos`. That pos is now the live assembly origin (or omitted).

### What's done well
- Marker still uses empty `raycast`, shared additive material, `reducedMotion` freeze.
- GATE distance still `fromPos.distanceTo(navProj)` on the same pos AP flies toward.
- Missing live hardware hides the ring and GATE field (`navMark` requires `pos`) instead of painting a ghost.
- Overlay jump label remains `textContent`.

### Findings

None at Blocker/Major.

#### 💡 Suggestion: GATE field hidden while NEXT still named
**Location:** `src/systems/hud.js` nav readout (`navMark` vs `navReadoutOn`)
**Issue:** A plotted bag with no live assembly still names next/dest/jumps; GATE goes blank.
**Fix:** Leave it. AP already speaks `Autopilot refused — next gate is missing.` Reopening HUD-01 occupancy is out of scope.

### Verdict
Designer spawn optional: HUD chrome unchanged; only the 3D aim point is corrected.
