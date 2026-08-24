## Security Review: Wave 101 NPC turret vsNPC

### Risk Level: Low

### Summary
Local browser combat. vsNPC reuses frozen `npcFire`. No persist key, no `innerHTML`, no attacker names in HUD copy. Missing target still drops. Toast helper was not edited and still fail-closes turret when `target !== 'player'`. No HIGH/CRITICAL.

### Findings

#### 🟢 LOW: npcFire payload still carries a live ship object
**Location:** `src/systems/npc.js` `tryNpcTurret` vsNPC emit  
**Issue:** `target` is now a live NPC record, same shape as cannon vsNPC. HUD toast helper does not read `e.ship` or `e.target.name`.  
**Impact:** None while toast stays authored literals. vsNPC turret returns null.  
**Fix:** Do not route `e.target` into DOM. Already true.  
**Justification:** Existing cannon vsNPC law. This PR does not add a name string.

### Passed Checks
- [x] No new `localStorage` / `WORLD_FIELDS` / persist key
- [x] No `innerHTML` in npc.js, combat.js
- [x] Toast not edited; turret `target !== 'player'` → null
- [x] Missing turret target drops (combat + WAVE99 grep continue)
- [x] NPC turret cap 4 shared vsPlayer+vsNPC (`fromPlayer === false`)
- [x] Unknowable NPCs do not emit; Unknowable shooter drops at combat
- [x] vsNPC `bolt.vsPlayer = false` → `testNpcHits` only
- [x] No hangar / `ctx.world.turret` write on the NPC bolt path
- [x] No player `addHeat` on `spawnNpcShot`
- [x] `mayHuntPlayer` not widened
- [x] No `for-in` merge

### Recommendations
1. Keep toast authored literals only. Do not add `Incoming turret.`
