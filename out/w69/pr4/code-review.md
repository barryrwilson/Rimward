## Code Review: AST PR4 HUD/nav find-aid

### Summary
Arrival still uses `ARRIVAL_LINES`, then a spare belt `commLine` with a finite sun-relative range. Group 3 fills the existing context slot with `Mine · belt <n>u` when Dock / Jump / Hail / Target do not apply and the lock is not a rock. Probe pins both paths.

### What's done well
- `ARRIVAL_LINES` is unchanged; high bands still get the belt line.
- Payload is `{ text, from }` only (`from: 'Echo'`).
- Mine cue uses `promptKey` / `promptVerb` `textContent`. No new DOM, glance row, rail move, or settings key.
- Rock lock (`position`, no `state`) does not take the belt cue.
- Distance prefers first `workFrac` list entries with `ore > 0`, then any ore rock, then `field.center`.
- Probe drives `initJump` midpoint and a stub `initHud`; group 1, Dock, and Jump win.

### Findings

No Blocker or Major findings.

#### 🟡 Minor: HUD work-sector fraction ignores cloud default
**Location:** `src/systems/hud.js:356`
**Issue:** `asteroids.js` uses `workFrac` 0.50 for `cloud` kind when the field omits the key. HUD defaults 0.6. HUD cannot import `kindFromDef` without touching `asteroids.js` (out of scope).
**Fix:** Later serial: read an existing `field.workFrac` on authored cloud systems, or share one helper.
**Justification:** First `workN` vs 50% still sits in the dense sector; ore>0 pass still finds a rock. Probe pins 0.6.

#### 💡 Suggestion: `arrivalBeltLine` is a new export
**Location:** `src/game/jump.js:17`
**Issue:** Export exists so the probe can pin copy without a private midpoint. Live path is still `midpointSwap` → `ctx.emit('commLine', arrivalBeltLine(def))`.
**Fix:** Keep. A later owner can un-export if boot tests cover jump only.

### Prompt priority (probe)
- Group 3, no dock/gate/target: verb contains `Mine` and a finite `Nu`.
- Group 1: no mine cue.
- Dock / Jump still win.
- Rock lock: no mine cue.
- Work-sector index 0 at 40u beats a later ore rock at 5u; ore-only fallback is 5u.

### Design audit
Skipped — designer agent not available.
