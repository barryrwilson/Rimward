## Code Review: Wave 82 kill standing recap (re-dispatch)

### Summary
`applyPlayerKillStanding` now calls `applyAbominationStanding` after victim −5 and optional Beautiful +5. Player-owned grafts keep Beautiful at −10. No player graft still receives the +5 friend write.

### What's done well
- Reuses the hangar ownership helper instead of a second −10 constant.
- Recap is after the bonus, so a lift cannot stick while tissue remains.
- `anyGrafted` no-ops when the hangar has no graft, so the friend write lands.
- Probe pins cover cap hold (−10) and no-graft +5. Extra-probe `capLeak` now PASS.

### Findings

No Blocker or Major items.

#### 💡 Suggestion: kill-standing is no longer a leaf
**Location:** `src/game/kill-standing.js:3,171`
**Issue:** Importing hangar pulls save/CSS. No cycle (`hangar.js` does not import kill-standing).
**Fix:** Leave the single import. Do not copy `HOSTILE_STANDING` into the kill helper.

#### 🟡 Minor: Wave 80 boot pins still expect `no-delta`
**Location:** `scripts/boot-test.mjs` WAVE80 (out of write-set)
**Issue:** Unchanged. This worker must not edit boot-test.
**Fix:** Later boot-test worker.

### Verdict
Approve. The cap leak is gone.
