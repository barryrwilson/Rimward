## Code Review: `src/systems/combat.js` hull-local shield ripple (Wave 111 PR1)

### Summary
Shielded hits parent a pooled ring to the host via `worldHitToLocal` and `RIPPLE_LIFT`. First-person player host stays world-space. Unshielded sparks + marks, recoil, shake, and pool sizes stay.

### What's done well
- Reuses `RIPPLE_POOL` 16. No third pool. No per-hit material.
- XOR hit path still shielded → ripple, else sparks + `stampHullMark`.
- Park on `npcDestroyed` / `playerDestroyed` / `systemLoaded` / orphan parent, same as marks.
- Tick parks on TTL and on reducedMotion second frame so slots return to the scene.
- WAVE54 / WAVE59 grep surfaces stay (`spawnRipple`, `spawnHitFx`, `stampHullMark(pos, host)`, `parkMarksOnHost`, pool 12).

### Findings

No Blocker or Major findings.

#### 🟡 Minor: `typeof worldHitToLocal === 'function'` is dead after a successful import
**Location:** `src/systems/combat.js` spawnRipple
**Issue:** A missing import fails module load, so the runtime typeof check never sees `undefined`.
**Fix:** Keep as a partial-merge belt. Do not remove; the probe pins it.

#### 💡 Suggestion: Header Wave 111 note is enough
**Location:** `src/systems/combat.js` file header
**Issue:** None. Do not add more design narration in spawn.

### Passed
- Fail closed: missing host, NaN pose, helper false → `position.copy(pos)`.
- `applyHit` still runs before FX. No `speed = 0`.
- `HULL_MARK_LIFT` not used on ripples.
- Chase/third player host may parent. NPC hosts parent when pose is finite.
