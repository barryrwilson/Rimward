## Code Review: src/systems/controls.js (Wave 69 PR3 mining/AI + stale rock lock)

### Summary
Controls drop a rock lock when `'systemLoaded'` fires and whenever the locked object is not in `ctx.asteroids.list`. Ship `{ object, state }` locks stay. Combat still raycasts live `list[i].position` and emits `asteroidId: bestEntry.id`. NPC `nearestSoftRock` still filters hardness ≤ 1 and ore > 0. Probe PASS. No Blocker/Major defects.

### What's done well
- Rock test is `position` present and no `object` / no `state`. Matches combat mining lock shape (`t.position && !t.object`).
- `asteroids.js` does not write `ctx.targets`.
- Drop runs before `cycleTarget`, so T on a swapped field does not keep a dead ref.
- `id === i` after closed-form motion; closest-sphere by live position maps to that id.
- `fieldPoint` still uses `field.center`. Collision collect is untouched.
- `npc.js` was not edited; miners already read live positions.

### Findings

#### 💡 Suggestion: `dropStaleRockLock` runs twice on `systemLoaded`
**Location:** `src/systems/controls.js:242–249`
**Issue:** The `lastEvents` scan calls `dropStaleRockLock`, then the unconditional call runs it again. Correct, cheap (N ≤ 160).
**Fix:** Keep both. The scan matches the contract (`read ctx.lastEvents`). The second call covers a rock that left the list with no event.
**Status:** accepted

#### 💡 Suggestion: Combat mining helpers are not imported
**Location:** `out/w69/pr3/probe.mjs` (combat pin)
**Issue:** `updateMining` is not exported. `initCombat` needs `document` canvas textures. The probe clones the ray-sphere loop and traces `a.position` + `asteroidId: bestEntry.id`.
**Fix:** None required. Brief allows code-trace + distance pin.
**Status:** accepted

#### 💡 Suggestion: JSDoc restates the rock-lock shape
**Location:** `src/systems/controls.js:82–87`
**Issue:** Two JSDoc lines repeat the `position` / no-`object` / no-`state` rule already in the function bodies.
**Fix:** Optional trim. Nearby `cycleTarget` also has a one-line JSDoc; leave for match.
**Status:** accepted

### Re-review
No Blocker/Major. No HIGH/CRITICAL from security. No post-review code change.

### Probe
`node --import ./scripts/with-css-stub.mjs out/w69/pr3/probe.mjs` → `PASS w69 pr3 pins true n=130 soft=85`
