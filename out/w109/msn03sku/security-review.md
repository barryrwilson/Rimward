## Security Review: Wave 109 MSN-03 remaining unique SKU grants

### Risk Level: Low

### Summary
Grant path is allowlist-bound. SKU ids come from frozen `CHAIN_GRANT`, then `isLauncherId` / `isTurretId`. `writeMountedGear` patches are `{ launcher }` or `{ turret }` only. Fail UU is integer 2 on parsed last-step only. No HIGH/CRITICAL findings.

### Findings

No 🔴 CRITICAL or 🟠 HIGH issues.

#### 🟢 LOW: Blank write still mutates hangar before fail UU
**Location:** `src/systems/station.js:3511-3516`
**Issue:** If `writeMountedGear` returns a row whose field does not equal `spec.id`, the helper already wrote, then returns false, then last-step adds +2 UU.
**Impact:** Consolation UU plus a blank or unexpected rack. Live `healLauncher` / `healTurret` plus `canSeat` make this rare.
**Fix:** None in this wave. Contract asks fail-closed +2 after verify, not a hangar rollback.

### Passed Checks
- [x] No secrets in code
- [x] Employer from `parseChainId` allowlist only (`finishChainStep` caller `station.js:4229`)
- [x] `grantChainSku` refuses non-string keys (`3495`)
- [x] Spec must be frozen `{ id, seat, slot }` with `Object.hasOwn` (`3496-3504`)
- [x] Id must be `dart`/`auto` via `isLauncherId` / `isTurretId` (`3505-3507`)
- [x] `writeMountedGear` patch is only `{ launcher: spec.id }` or `{ turret: spec.id }` (`3512`, `3515`)
- [x] No `missileAmmo` in grant patch
- [x] `grantChainSku` does not write credits, standing, hull, or jobs
- [x] Fail UU is literal `2` after `Number.isFinite` (`3542`)
- [x] Unparsed proto splice (`4214-4221`) has no pay and no +2
- [x] `chain-__proto__-1` is not in `CHAIN_IDS`; `chainGrantSpec('__proto__')` is null
- [x] No `job.faction` / `job.sku` write source
- [x] No `innerHTML`; catalog names via `textContent` (`h()`)
- [x] No `JSON.parse` of grant specs
- [x] Unique four complete still does not call `grantChainSku`
- [x] No new persist key; no `world.chainSku`

### Deep-audit notes (grant path)

1. **Proto ids.** `parseChainId` requires `CHAIN_IDS.has(id)` then `Object.hasOwn(CHAIN_ORIGIN, employerKey)`. Reserved ids never enter `finishChainStep`. Direct `grantChainSku(ctx, '__proto__')` returns false and writes nothing.
2. **Credits.** Helper never touches `ctx.world.credits`. Last-step only: `payQuoted` then `+= 2` iff grant false and credits is finite. Shop 6500/4200 are not used. Non-finite credits skip the consolation (no string concat).
3. **Patch shape.** Launcher branch passes `{ launcher: spec.id }` only. Turret branch passes `{ turret: spec.id }` only. `writeMountedGear` ignores unknown keys. No scanner, mining, graft, hull, or ammo fill.

### Recommendations
1. Keep `grantChainSku` unexported so unique complete cannot grow a call site by accident.
2. Leave WAVE83 last-step “no SKU” pins stale; they describe Wave 82 credits-only Veridian/Hollow.
