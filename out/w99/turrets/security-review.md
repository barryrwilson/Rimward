## Security Review: Wave 99 NPC turrets

### Risk Level: Low

### Summary
Local browser combat. No persist key, no `innerHTML`, no attacker names in HUD copy. Gate, missing-target drop, and NPC/player cap split fail closed. No HIGH/CRITICAL.

### Findings

#### 🟢 LOW: npcFire payload still carries a live ship object
**Location:** `src/systems/npc.js` tryNpcTurret emit  
**Issue:** Same frozen `npcFire` shape as cannon (`ship` is a live record). HUD toast helper does not read `e.ship` or `state.name`.  
**Impact:** None while toast stays authored literals.  
**Fix:** Do not route `e.ship` into DOM. Already true.  
**Justification:** Existing cannon/missile law. This PR does not add a name string.

### Passed Checks
- [x] No new `localStorage` / `WORLD_FIELDS` / persist key
- [x] No `innerHTML` in npc.js, combat.js, npc-fire-toast.js
- [x] Toast `ownWeapon` rejects `__proto__` / constructor / prototype
- [x] Turret missing `target` drops (combat + toast). Cannon omit unchanged
- [x] NPC turret cap 4 separate from player `TURRET_LIVE_CAP` 2 (`fromPlayer` filter)
- [x] Unknowable NPCs do not emit; Unknowable hulls miss non-beam (`applyHit`)
- [x] No hangar / `ctx.world.turret` write on the NPC bolt path
- [x] No player `addHeat` on `spawnNpcShot`
- [x] `canSeat` uses `Object.hasOwn(MOUNT_TABLE, classKey)`
- [x] No `for-in` merge

### Recommendations
1. Keep vsNPC turret off until a later slice (already dropped).
