## UI Audit: Wave 101 NPC turret vsNPC

### Summary
No HUD, CSS, or toast-helper edit. Empty 80 px hub stays empty. FORE/AFT stays `playerHit` only. vsNPC turret does not toast. vsPlayer still reuses authored `Incoming fire.` Digit 0 stays Shipyard.

### What's done well
- `src/game/npc-fire-toast.js` not edited; turret `target !== 'player'` already returns null
- No sixth WPN Digit, no lock box, no inbound gauge
- WAVE99 toast matrix still all true (`turretShip` null, dart unchanged)

### Findings

No Blocker or Major.

#### 💡 Suggestion: vsNPC is silent on glass
**Location:** HUD (untouched)  
**Issue:** A pirate-vs-trader turret bolt does not toast. That matches cannon vsNPC and the deputize pick.  
**Fix:** None. Contract forbids a turret toast.

### HUD-01 checklist
- [x] No incoming gauge / lock box / aim-glass pip
- [x] `keep the 80 px hub on glass` still in `hud.js`
- [x] FORE/AFT still `playerHit` only
- [x] No `innerHTML`
- [x] Digit 0 still shipyard (WAVE101 pin)
- [x] `Incoming dart.` not stolen
- [x] vsNPC must not bruise the player hull (probe + WAVE101 `playerUnbruised`)
