## Security Review: Wave 64 PR5 flat equipment migrate

**Scope:** `src/systems/station.js` outfitter writers, `src/game/hangar.js` `writeMountedGear`, `scripts/boot-test.mjs` WAVE64 equipment pins. `save.js` not edited (migrate-once already in PR1 sanitize).
**Mode:** Deep audit (save tamper, prototype keys, gear isolation, debit vs write).
**Pass:** first pass after WAVE64 equipment pins.

### Risk Level: Low

### Summary
Outfitter writes allowlisted flat fields on the mounted hangar row, then mirrors to world. Unknown keys (including `loadout` / missiles) are ignored. Sanitize still heals every hull on every restore. No HIGH or CRITICAL finding.

### Findings

#### 🟢 LOW: credits debit before `writeMountedGear`
**Location:** `src/systems/station.js:1531-1532` (same order on scanner / concealed / mining buys)
**Issue:** UU is subtracted, then the hangar write runs. A null return would keep the debit and skip the part.
**Impact:** In this client, `ensureHangar` always leaves a mounted row when `ctx.world` exists. The station path cannot hit the null return.
**Status:** accept — same debit-then-mutate order as pre-PR5 world writes.
**Justification:** Fail-closed heals still run on restore. No attacker-controlled skip.

#### 🟢 LOW: `writeMountedGear` trims row cargo, not live `ctx.cargo`
**Location:** `src/game/hangar.js:363-367`
**Issue:** A shrink of `cargoCapacity` trims the mounted row hold and does not clip `ctx.cargo`.
**Impact:** Outfitter only expands the hold. Shrink is not a buy path.
**Status:** accept — first-slice writers only add capacity.
**Justification:** Park/load still copy live hold through `parkMounted` / `loadMountedRow`.

### Passed checks
- [x] No secrets in new or touched files
- [x] Patch keys allowlisted (`scanner` / `miningLaser` / `concealedMounts` / `cargoCapacity`)
- [x] Heals: scanner `0|1|2`, miningLaser `0|1|2|3`, concealed literal `true` else false, capacity finite ≥ 20
- [x] `hasOwnProperty` on the patch; no `Object.assign` onto the row
- [x] Prototype / `constructor` / `loadout` / missiles ignored on write
- [x] Sanitize still runs every restore on every hull; no migrate-once skip flag
- [x] Other stored hulls do not copy the world Deepcore
- [x] World mirrors stay on `WORLD_FIELDS`
- [x] Outfitter UI uses `h()` `textContent`; no `innerHTML` / `insertAdjacentHTML` / `document.write`
- [x] Digit 1–7 unchanged
- [x] No remount-on-buy; no missiles / launchers / nested loadout persist
- [x] Unknowables stay `'living'` and still take flat fields
- [x] Living starter cannon / disruptor not stripped

### Recommendations
1. Keep outfitter writes on the mounted row, then the world mirror.
2. Do not read blob `loadout` or missile keys.

### Re-review
No HIGH/CRITICAL. Comment-only header tweak in `station.js` after the first pass. Findings stay LOW.
