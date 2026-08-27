## Code Review: NAV-10 PR1 HUD approach-speed cue

### Summary
Self-only `.rw-slow-lamp` plus in-zone SLOW verb match the merge law. MATCH factory and `tgtSpeed.set` stay speed/MATCH-only. Fail-closed dist math does not throw.

### What's done well

- SLOW is **not** inside shared `makeSpeed()`. Node is appended on `selfRail` only.
- MATCH `textContent` stays `MATCH`. Independent `is-hidden`.
- Dist uses `Math.hypot` on live Vector3 fields. No per-frame alloc.
- Jump copy is untouched. Hide when jump owns the verb.
- Local `3 * U.DOCK_RANGE`. No `state.js` write.

### Findings

None open at Blocker/Major.

#### 🟡 Minor: SLOW lamp ticks at 5 Hz with other HUD text

**Location:** `src/systems/hud.js` ~2144–2147, ~2280–2288
**Issue:** Acceptance says hide SLOW on successful dock this frame. Lamp writes sit in the existing `TEXT_UPDATE_INTERVAL` (0.2 s) block, same as the Dock prompt.
**Fix:** Optional every-frame hide when `flags.docked`. Not required: prompt hide has the same lag. Contract CPU law is write-on-change.

**Justification (leave):** Matches live prompt/MATCH cadence. Extra every-frame write is not needed for a 5 Hz text rail.

#### 💡 Suggestion: `querySelector` at init

**Location:** `src/systems/hud.js` ~1116–1120
**Issue:** Host lookup is `selfRail.querySelector('.rw-speed .rw-value')`. Init-once, fail-closed to `null`.
**Fix:** Optional: return the value node from `makeSpeed` without adding a SLOW default.

**Justification (leave):** Init-once is not a per-frame DOM alloc. Safer than stuffing SLOW into the shared factory.

### Round 2

Null `classList` throw is **fixed**. MATCH / tgtSpeed / Jump / hub constraints still hold.
