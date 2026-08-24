## Code Review: TGT-03 remaining CLOS rate (Wave 102)

### Summary
`losCloseRate` matches live contacts LOS math. The tgt rail adds a CLOS sibling of DIST, write-on-change, first frame `0 u/s`. No Blocker or Major product defects.

### What's done well
- Pure helper with ε = `1e-4` (same exclusive `lengthSq` floor as contacts).
- `relVel = targetVel - ship.velocity`; not SPD magnitude; not NPC 40.
- Fail-closed: CLOS writes only in the existing `shipTgt` DIST block.
- `measureRails()` after CLOS text change.
- No `state.js` / save / controls / npc writes.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 🟡 Minor: Duplicate format helper in boot pins
**Location:** `scripts/boot-test.mjs` WAVE102 `fmt102`
**Issue:** Pins copy `formatClosRate` instead of importing it.
**Fix:** Optional. Helper stays unexported so PR1 pins do not need HUD/jsdom.

#### 💡 Suggestion: Lead still copies `relVel` after CLOS
**Location:** `src/systems/hud.js` lead block
**Issue:** CLOS already fills `relVel` when `shipTgt && shipVel && haveTargetVel`. Lead copies again.
**Fix:** Leave it. Lead path stays independent when CLOS skips (no vel yet).

### Verdict
Ship. WAVE102 CLOS pins all true on `npm run test:boot`.
