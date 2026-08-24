## Code Review: Wave 97 NPC turrets design

### Summary
Markdown-only integrator. Inventory cites live post-Wave-83 code. Contract supersedes NpcMissiles “no NPC `auto` turret” for a **later** serial only. Wave 68 player `auto` and Wave 83 darts stay complete. Re-review after reducedMotion + single live-cap pin: no Blocker / Major.

### What's done well
- Code wins: `WEAPONS.turret` reuse is proven, not a new catalog invention.
- `spawnNpcShot` vs dart split is explicit (energy bolt allowed; seekers still forbidden).
- Wave 57 split cited at the live tick (`combat.js` 1848–1851), not a stale header.
- Default-off who; class gate matches `MOUNT_TABLE` + live `world.js` casts.
- Sibling TGT-03 / BIO-05 paths are out of write-set.
- Digit 0/8/9, hangar, HUD glass, chaff, power ledger, `state.js` READ-ONLY are frozen.

### Findings

#### 🟡 Minor: Cadence still owner-open
**Location:** `out/w97/turrets/shared-contract.md` §3.2  
**Issue:** Independent clock at 0.5× turret ROF is a starting pin, not shipped. Unset still means off.  
**Suggestion:** Impl PR1 must not fire turrets until Q1/Q2 and the cadence pin land. Status: **already default off**.

#### 💡 Suggestion: Face cone
**Location:** contract §4.2 step 5  
**Issue:** `FIRE_FACE_DOT` 0.92 vs player turret `CONVERGE_DOT` 0.72. Unset cadence already means off.  
**Suggestion:** Impl uses one; do not mix in the same PR.

### Passed
- [x] Brief + merge law + inventory exist
- [x] No `src/` in write-set
- [x] Freeze: no aim-glass gauge, Digit 0/8/9 player-only, default-off who, no invented percent/UU
- [x] Explicitly supersedes NpcMissiles “no NPC auto turret” for a later serial only
- [x] Does not edit `docs/NpcMissilesDesign.md` / `docs/Shp03WeaponsDesign.md`
- [x] Does not reopen missile Q1/Q2
- [x] `state.js` unread as write this wave; later default no write
