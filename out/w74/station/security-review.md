## Security Review: Wave 74 station (REP PR2 + EXP PR3/PR4 skip)

### Risk Level: Low

### Summary
Standing copy is authored `textContent`. Archive confirm does not debit, credit, or flip `source` while UU is unset. Data pending is RAM-only and re-allowlisted. No HIGH or CRITICAL findings.

### Findings

#### 🟢 LOW: unused EXP helper imports
**Location:** `src/systems/station.js` 34–54
**Issue:** `cargoValueSafe`, `hasDataDropRate`, `spawnDataPod`, and `maybeSpawnDataFromWreck` are imported because the brief listed them. Station does not call them.
**Impact:** None. No extra attack surface. Spawn stays in `data-trade.js`.
**Fix:** Keep until a later pay/spawn owner uses them, or drop after the import mandate ends.
**Status:** open (accepted; brief-required)

#### 🟢 LOW: stuffed `dataPending` can arm a confirm
**Location:** `src/systems/station.js` 1147–1173
**Issue:** A console edit can set `ui.dataPending` to an allowlisted sell/buy triple.
**Impact:** Confirm still writes no credits and no cargo. Illegal cubes take the refuse path and do not flip `source`.
**Fix:** None required for first impl.
**Status:** open (fail closed)

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` in `station.js`
- [x] `h(..., text)` / `textContent` for rank, faction, ladder, archive labels
- [x] Rank names from `RANK_LADDER`; faction names from `FACTIONS[key].name` after `Object.hasOwn`
- [x] `standingRead` for missing / reserved / non-finite → 0
- [x] Archive gate `faction === 'assembly'` and `Object.hasOwn(DETAIL_STATIONS, 'assembly')`
- [x] `__proto__` faction does not open the desk
- [x] Cargo walk uses index `for`, not `for…in`
- [x] `sanitizeDataCargoRow` / `isDataSource` / `isDataOriginFaction` on lots and pending
- [x] Confirm does not call `tryTrade` / `addCargo` / `removeCargo` / `holdUnits`
- [x] Confirm does not write `credits` or cargo
- [x] Illegal cube: refuse copy, no source flip
- [x] `priceOf` returns 0 for `dataCube` / `dataCrystal` even if `world.prices` is stuffed
- [x] `ui.dataPending` RAM only; clear on Back / undock / selectService / Esc / vanished sell lot
- [x] Q/W/A/S still bind `COMMODITY_KEYS` only
- [x] No `'reputationChanged'` event
- [x] Digit 0 remains last `DOCK_KEY_SERVICES` (`shipyard`); no new service key
- [x] BIO `graftPending` / `cancelGraftPending` still present

### Recommendations
1. When an owner sets Archive UU, keep two-step confirm and recompute the lot at confirm.
2. Do not route data lots through `addCargo` when pay lands.

### Second pass
Re-read `station.js` after `standingRead` on market sell tier. No new CRITICAL or HIGH. Probe: 51 pins, all true.
