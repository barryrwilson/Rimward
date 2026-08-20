## Code Review: Wave 68 PR3b group 4 missiles + player turret

### Summary
Group 4 fire, a separate 8-missile pool, seeker turn, and a player-only forward turret loop match the SHP-03 contract. Groups 1–3 and NPC cannon stay on the old path. Probe pins source contracts and the exported seeker step. No blockers.

### What's done well
- Empty group 4 returns `null` from `groupWeapon`; fire does not use `?? 'cannon'`.
- `spendMissileAmmo` + `addHeat` run only after a live spawn; failed spend deactivates the dart.
- Seeker is a pure exported step: turn cap, ballistic on null lock, no per-frame alloc.
- Turret is not a weapon group; Digit1–4 stay player groups; Digit 0 is untouched.
- `playerFire { weapon }` reused for `'missile'` / turret `wkey`. No new ctx event types.

### Findings

#### 🟡 Minor: Turret hostility is `ai.intent` only
**Location:** `src/systems/combat.js` `pickTurretTarget`
**Issue:** A pirate or ace that has not telegraphed (`intent` still false) is not a turret target, even if `mayHuntPlayer` would be true.
**Fix:** Optional later: import or duplicate hunt eligibility. HUD already treats `ai.intent` as hostile.
**Status:** open
**Justification:** Matches HUD hostile contacts. Spec says hostile, not “any pirate in the cone”. Telegraph time is the existing warning.

#### 🟡 Minor: Header comments restates the fire contract
**Location:** `src/systems/combat.js` `GROUP_WEAPON` block, `spend-on-spawn-only`, empty-rack notes
**Issue:** Several comments exist so the probe can pin them; they retell the design.
**Fix:** Keep until HUD/PR5 owns the empty-rack string; then trim.
**Status:** open
**Justification:** Probe is the verification surface this wave. Not a behavior defect.

#### 💡 Suggestion: Turret scans the ship list every frame when ready
**Location:** `src/systems/combat.js` `tryPlayerTurret`
**Issue:** With a seated turret and no cone target, `pickTurretTarget` runs each frame (ROF gate is open).
**Fix:** Not needed at current NPC counts. Scratch vectors stay module-scope.
**Status:** open
**Justification:** Zero alloc; live traffic lists are small.

### Resolved this pass
- Seeker now goes ballistic when the lock mesh leaves the scene (`object.parent`), not only when `state.destroyed` is set.

### Verification
- `node out/w68/pr3-fire/probe.mjs` — pass
- Full WebGL Digit4 fire is the later verifier (PR5)
