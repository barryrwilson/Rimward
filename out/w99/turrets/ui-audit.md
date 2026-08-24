## UI Audit: Wave 99 NPC turret toast helper

### Summary
No new `#hud` child, no sixth WPN Digit, empty 80 px hub stays empty. Turret vsPlayer reuses authored `Incoming fire.` (class `warn`, 2.5 s clock). `Incoming dart.` unchanged.

### What's done well
- Helper stays DOM-free (`textContent` at HUD, not here)
- Parked dock/jump suppress for turret, same as cannon
- Missing turret target does not toast
- WAVE98 TGT-03 matrix still passed in `npm run test:boot`

### Findings

No Blocker or Major.

#### 💡 Suggestion: cannon and turret share one fire toast slot
**Location:** `src/game/npc-fire-toast.js` `lastIncomingFireAt`  
**Issue:** Same-frame cannon then turret yields one `Incoming fire.` toast. That is the shared clock, not a missed warning.  
**Fix:** None. Contract forbids a turret-specific string.

### HUD-01
- [x] No incoming gauge / lock box / aim-glass pip
- [x] `keep the 80 px hub on glass` still in `hud.js`
- [x] FORE/AFT still `playerHit` only (WAVE98 pin)
- [x] No `innerHTML`
