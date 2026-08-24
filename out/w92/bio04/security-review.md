## Security Review: BIO-04 psionic weapons (Wave 92)

### Risk Level: Low

### Summary
Eligibility is derived every shot. `hullKind === 'built'` is dry unless own-key `grafted === true`. Missing / empty / `'living'` hullKind fires (New Game starter). Fire does not persist a psi flag, does not trust HUD family, and does not fall through unknown groups to cannon.

### Findings

No CRITICAL or HIGH issues.

#### 🟡 MEDIUM: Console can still set `player.grafted = true` on a built hull

**Location:** `src/game/psionic.js` `canFirePsionic`
**Issue:** Own-key `grafted === true` is enough. A debug console write grants fire until hangar heals the player. This matches hangar law; it is not a persist-smuggle.
**Impact:** Local cheat only. Saves still go through hangar sanitize (BIO-01 owns `hangar.js`; this wave does not write it).
**Fix:** Not in this wave. Keep the own-key test; do not add a persist `canPsi`.

### Passed Checks
- [x] Own-key `grafted === true` only (proto `{ grafted: true }` is false; `grafted: 1` is false)
- [x] No persist `canPsi` / `psiEnabled` / hangar key / ammo SKU
- [x] No `innerHTML` in psionic / combat emit / HUD WPN path
- [x] `playerFire` payload is `{ weapon: 'psionic' }` literal; no spread of player/world
- [x] Unknown `weaponGroup` (0, 6, 7) returns null, not cannon
- [x] No `power` / `psi` fields on `createShipState`
- [x] `isBeautiful` / `hudFamily === 'bio'` are not the fire test
- [x] NPC `spawnNpcShot` refuses `family === 'psionic'`
- [x] Unknowables `applyHit` miss (non-beam); `testNpcHits` still skips fields
- [x] Digit 5 is not in `PREVENT_DEFAULT`; dock Digit 0/8/9 stay untracked

### Recommendations
1. Keep BIO-01 hangar heal as the persist gate. Do not add a fire flag to WORLD_FIELDS.
2. Keep group-5 catalog-missing as null so a broken row cannot throw on `w.rof`.

---

## Re-review (unset hullKind)

**Risk Level:** Low. No CRITICAL or HIGH.

`canFirePsionic` now matches `ship.js` `meshKindFor`: only `hullKind === 'built'` is plated. A New Game player with no `hullKind` field may fire. Tamper `hullKind: 'built'` without own-key `grafted === true` stays dry. Empty string is treated as living (same as the mesh). HUD still uses this helper; no second test. No persist flag. No hangar write.
