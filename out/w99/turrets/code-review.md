## Code Review: Wave 99 NPC turrets

### Summary
PR1–PR3 match Wave 98 merge law. Independent turret clock, explicit `target: 'player'`, combat drop on omit, cap split, toast reuse. WAVE99 live emit pins passed on the first boot run; two source-grep cap pins failed then the counters used `p` and the strings match.

### What's done well
- Turret emit sits after cannon/dart so WAVE83 `aceFirst.weapon === 'missile'` stays true
- `mayHuntPlayer` is unread for new grants
- Player turret counter filters `fromPlayer` so NPC bolts cannot starve cap 2
- Toast shares `Incoming fire.` and `FIRE_TOAST_GAP`; dart string untouched

### Findings

#### 🟡 Minor: mesh.userData tags on the 64-pool
**Location:** `src/systems/combat.js` `spawnProjectile`  
**Issue:** Writes `userData.wkey` / `fromPlayer` for probes. Zero alloc, but it is extra mutable state on the mesh.  
**Fix:** Keep. Boot and `out/w99/turrets/probe.mjs` count live NPC bolts with these tags.  
**Justification:** No gameplay path reads them. Acceptable for fail-closed caps plus pins.

#### 💡 Suggestion: Beautiful faction still class-gated
**Location:** `src/systems/npc.js` `canNpcTurret`  
**Issue:** A Beautiful heavy patrol that already hunts can emit turret. Owner line is **no grant**, not Unknowable-style never.  
**Fix:** None this wave. Do not add an `isBeautiful` special case (WAVE83 `noBeautifulGrant` style).

### Passed
- Telegraph ≥ 3 s and demand-hold stay weapons-cold
- vsNPC turret drops this slice
- No `state.js` WEAPONS fork
- ctx frozen vocab includes `'turret'` without breaking WAVE83 substring `weapon:'cannon'|'missile'`
