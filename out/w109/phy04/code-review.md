## Code Review: PHY-04 remaining NPC avoid (Wave 109)

### Summary
PR1 adds a mid-chord probe at `look * 0.5` for non-station kinds. PR2 rewrites frame aim to an existing hold when a route/loiter dest sits in the D5 cylinder. Export, gain, lookahead, bounce, sun radii, and player-gate skip stay. No Blocker or Major.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did not spawn `[reviewer]`.

### What's done well
- Fail-closed 40 u path is still first. Mid helper is additive.
- Same `_v2` accumulate + one normalize. Module scratch only.
- `skipAvoidBody` still skips combat target and player AP gates.
- `writeFrameHold` does not assign `record.route`.
- Jump / empty bag keep dest. `bounceLive` still runs when `_phyOn`.
- Probe pins `AVOID_LOOKAHEAD` 40, `AVOID_GAIN` 1.4, mid sample, no persist, no hub pip, no `planApPath`.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: `typeof addMidChordHit === 'function'` is always true in this module

**Location:** `src/systems/npc.js` `applyAvoidBias`

**Issue:** The helper lives in the same file. The guard records fail-closed intent; it does not protect a missing helper at runtime unless the function is deleted.

**Fix:** None required. Keep the 40 u block independent so a later delete of the call still flies.

**Status:** documented

#### 💡 Suggestion: `const aim = dest` in `steerLive`

**Location:** `src/systems/npc.js` `steerLive`

**Issue:** Alias only.

**Fix:** Optional. Not a behavior bug.

**Status:** open, not blocking

#### 💡 Suggestion: Frame hold ignores dest-through-station without dest-in-cyl

**Location:** `src/systems/npc.js` `writeFrameHold`

**Issue:** Contract text says “in / through”. Chord-through with dest outside uses live cylinder keep-out so a hold arrival cannot skip a gate waypoint.

**Fix:** None this wave. Do not persist a detour.

**Status:** frozen as fail-closed

### Test coverage
- `node out/w109/phy04/probe.mjs` — PASS (source + live mid-bias import)
- `node --import ./scripts/with-css-stub.mjs out/phy-verify/kernel-pins.mjs` — PASS (40/1.4 + PHY-04 greps)
