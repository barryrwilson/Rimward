## Security Review: Wave 83 NPC missiles

### Risk Level: Low

### Summary
Incoming dart copy is an authored literal written with `textContent`. Role, faction, pool, and hit-test gates fail closed. No new persist keys.

### Findings

No CRITICAL or HIGH issues.

#### 🟡 MEDIUM: Shared NPC lock wrapper
**Location:** `src/systems/combat.js` `_npcPlayerLock`
**Issue:** One module object is the lock for every live NPC dart.
**Impact:** First slice is vs-player only, so all darts share one aim. A later vs-NPC slice must not reuse this wrapper.
**Fix:** Per-slot lock refs if ship-vs-ship darts ship.
**Status:** documented — out of this slice

#### 🟢 LOW: Event payload still carries `ship`
**Location:** `npc.js` `npcFire` emit
**Issue:** Payload includes a live object ref. HUD does not print `e.from` or `state.name`.
**Status:** documented — existing event shape

### Passed Checks
- [x] No secrets in code
- [x] Toast uses `textContent` and `INCOMING_DART_TOAST`
- [x] `toastForEvent` npcFire branch does not read `e.from` / `state.name` / `innerHTML`
- [x] Missile `npcFire` without `target === 'player'` drops
- [x] Unknowable shooters do not spawn or emit darts
- [x] NPC pool does not call `spendMissileAmmo`
- [x] `spawnNpcShot` refuses `missile`
- [x] vsPlayer split: NPC dart vs player uses `testPlayerHit` only

### pirateOneDart follow-up
Harness-only pin (`scripts/boot-test.mjs` WAVE83 spawn). No new events, HUD nodes, persist keys, or HTML. Yield law in `npc.js` is unchanged.

### Recommendations
1. Keep ship-vs-ship darts off until a dedicated lock object exists.
2. Keep toast copy as a source constant.
