## Security Review: MSN-03 authored faction reward chains (Wave 81 design freeze)

### Risk Level: Low

### Summary
Markdown-only freeze. Restore, pay, reputation, and hangar grant gates stay fail-closed in the contract. Prototype ids, stuffed origin, stuffed pay, stuffed faction, SKU injection, and XSS have explicit drops. No HIGH or CRITICAL finding in the brief. Residual risk is later impl drift (grant path turning on without `canSeat` / allowlist).

### Findings

No 🔴 CRITICAL or 🟠 HIGH issues.

#### 🟡 MEDIUM: Last-step `done` sentinel is persist for “already rewarded”
**Location:** `out/w81/msn03/shared-contract.md` §0.5, §2.2; live unique-four `completeJob` `src/systems/station.js` 3249–3253
**Issue:** Chain completion is remembered as a `done` row. A tampered save that **deletes** that row will re-offer step 1 after restore (`ensureJobs` does not rebuild chains, but `syncChainJobs` would post step 1 if the gate still holds). Same cheat class as deleting `bounty-ace` after `done` — unique four re-seed only when the **whole** array is empty.
**Impact:** A hand-edited save can replay credits +2. No SKU mint while grant is fail-closed. Credits are already player-editable (`world.credits`).
**Fix:** First impl: accept as save-tamper class (same as credits). Do **not** add `world.chains` to close it. Optional later: refuse step 1 if a `done` sentinel **or** a higher step id exists; sanitize already de-dupes ids.

#### 🟡 MEDIUM: Stuffed `progress: 1` can skip a hop if impl copies family ticks
**Location:** live `sanitizeOneJob` progress clamp `src/game/save.js` 342–351; spy tick `station.js` 3619–3621; contract §1.4
**Issue:** Sanitize clamps progress to need (1). If step 2 pays on `progress === 1` without checking `currentSystem === dest`, a hand-edited accepted row completes at origin.
**Impact:** Same cheat class as stuffed mining cargo / stuffed spy progress (Wave 80 security MEDIUM).
**Fix:** Contract already requires dest dock for step 2. Impl must re-read dest from the authored table, not `job.progress` alone. Do not add a hop witness unless the owner asks.

#### 🟢 LOW: Employer bag write uses bracket key after `hasOwn`
**Location:** live family writes `station.js` 3397–3398; contract §0.10
**Issue:** Write uses `reputation[employer]` after `Object.hasOwn(FACTIONS, employer)`.
**Impact:** `__proto__` and unknown keys skip if impl copies live family pattern. Patrol still hardcodes `freehold` (3280); contract forbids copying that unless SYSTEMS says Freehold.
**Fix:** None required if impl copies mining, not patrol.

#### 🟢 LOW: Overlay slack vs `CHAIN_ROOM`
**Location:** live cap `save.js` 125–133 = 1420; contract §0.6 adds 7
**Issue:** Without a raise, four chain rows could compete with 16 overlay headroom on a stuffed save. Contract raises by 7 and never drops honest families or unique four.
**Impact:** Tamper 10k-length arrays still heal. Honest play at 100 systems stays under 1427.
**Fix:** Impl must add `CHAIN_ROOM` to **live** cap, not rebase to 1020.

### Passed Checks
- [x] Drop `chain-__proto__-1` via hyphen tokens + `RESERVED_IDS` (contract §1.3)
- [x] Do not `SAFE_ID.test` the full hyphenated id
- [x] Exact 12-id allowlist; `chain-ferrous-1` drops this serial
- [x] Stuffed `originSystem` must match authored table or drop
- [x] Stuffed `payQuoted` clamps 0…20000 on restore and at pay
- [x] Stuffed `job.faction` does not write (field forbidden)
- [x] Titles, reward, and state use `h()` / `textContent`; no `innerHTML` (live `station.js` 3842–3847; grep 0)
- [x] Employer +2; target skip
- [x] Equipment grant fail-closed; no `sku` / `launcher` / `turret` / `grafted` on `JOB_FIELD_ALLOW`
- [x] Unknown hangar SKU would heal empty (`weapon-fit.js` `isLauncherId`) if a later grant PR appears
- [x] Light hull cannot seat dart/turret (`MOUNT_TABLE` missile/turret 0)
- [x] No `kind: 'epicJob'`; no `world.epics` write from Jobs
- [x] No `job*` frozen event; `'commLine'` only
- [x] Cap formula does not reset ESPIONAGE_ROOM / WAR_ROOM
- [x] No `2*N` chain room
- [x] Digit 2 only; prototype-safe ids

### Recommendations
1. Keep the SKU map fail-closed until the owner names ids. A grant PR must use `writeMountedGear` + `canSeat` + `isLauncherId`/`isTurretId`.
2. Keep complete-path missing `payQuoted` at 0. UI fallback is display only.
3. Hide `done` chain rows so four sentinels cannot XSS via leftover stuffed titles — regen titles from templates on sync anyway.

**Status:** clean for design freeze.
