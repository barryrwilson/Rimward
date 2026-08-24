## Code Review: Wave 104 REP-05 covering + inbound jump refuse

### Summary
PR1 adds an additive Known+ covering hunt beside ungated pirate-work. PR2 refuses inbound jump in `beginJump` before `jumping = true`. Hooks are small. Police leave is untouched. Digit 9 copy is not this wave.

### What's done well
- Covering copies the police-leave allowlist and uses a separate visit latch.
- `findCoveringWork` never returns `'player'`, traders, miners, patrols, or Unknowable hulls.
- Pirate-work `findPirateWork` stays first in acquire; covering is the `else` and the extra OR in `tickPatrolJob`.
- Jump refuse uses dest standing only, so outbound from a Marked current system still starts.
- `Object.hasOwn` on dest/current system and faction keys.
- Boot pins append after WAVE103. WAVE103 object still all true.

### Findings

#### 🟡 Minor: Covering helper duplicates leave identity helpers
**Location:** `src/game/police-cover.js:24-70`
**Issue:** `systemFactionOf`, `ownString`, `roleOf`, `hullActive`, `isLocalSystemPatrol` copy `police-leave.js`.
**Fix:** Leave as copies. Do not merge modules. Police leave is frozen.

#### 🟡 Minor: Exported `JUMP_REFUSE_SKIP` Set
**Location:** `src/game/jump.js:13`
**Issue:** Callers can mutate membership.
**Fix:** Do not mutate. Optional freeze-map later.

#### 💡 Suggestion: Isolated `initJump` in boot leaves `jumping` true on the outbound pin
**Location:** `scripts/boot-test.mjs` outbound pin
**Issue:** The isolated ctx is not the live boot ctx. The pin already clears `jumping` after the check.
**Fix:** None required.

### Passed
- Covering gate is `standingRead >= 10`. Missing/proto/NaN → 0 → no covering.
- Law zone 300 skip on patrol and hostile (hostile matches `hunterHasWork` station skip).
- vsPlayer never: covering patrols in combat with the player are skipped.
- Jump refuse before `ctx.gate.jumping = true`. Unknown dest still no-ops.
- Skip dest flags: unknowables, hollow, independent. Beautiful dest may lock.
- No `state.js` / `save.js` / `station.js` / `hud.js` / `gate.js` / `police-leave.js` writes.
- Restitution 1200 and kill −5 untouched.

### Method
Self-applied `orchestrator/references/code-review.md` and `shared/personas/reviewer.md`.
