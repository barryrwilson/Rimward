## Code Review: Wave 74 station (REP PR2 + EXP PR3/PR4 skip)

### Summary
Digit 9 Standing explains the live ladder, writers, and consequences without new deltas. Assembly Market shows an Archive desk that lists lots and confirms with no pay. Digit 0 is still shipyard. BIO graft session fields remain. Probe pins all pass.

### What's done well
- Ladder lines come from live `RANK_LADDER`, not a second table.
- Archive gate matches merge law: Market pane, Assembly, `DETAIL_STATIONS.assembly`.
- Confirm is fail closed: UU unset → notice only; captured Assembly cubes refuse without a fixer debit.
- `priceOf` zeros data keys before the stuffed-price fallback.
- `dataPending` follows the `trafficPending` family (Back, undock, Esc, vanished lot).

### Findings

#### 💡 Suggestion: unused data-trade helpers
**Location:** `src/systems/station.js:50-53`
**Issue:** `cargoValueSafe`, `hasDataDropRate`, `spawnDataPod`, `maybeSpawnDataFromWreck` are unused.
**Fix:** Brief required the import list. Leave until pay/spawn lands.

#### 💡 Suggestion: `archiveUuSet()` never true
**Location:** `src/systems/station.js:1094-1098`, `1166-1170`
**Issue:** `ARCHIVE_UU` is null, so the true branch still no-ops.
**Fix:** Keep as the pay hook. Do not invent a number.

#### 🟡 Minor: cube refuse branches overlap
**Location:** `src/systems/station.js:1240-1251`
**Issue:** Captured Assembly cubes hit the first refuse. The later cube rule repeats the rest.
**Fix:** One predicate: sell only legal Assembly cubes or Unknowable crystals.
**Status:** open (behavior is correct)

#### 🟡 Minor: `addCargo` can still flatten a data key
**Location:** `src/systems/station.js:1665-1674`
**Issue:** Pre-existing stack-by-commodity. Archive does not call it. `tryTrade` now rejects data keys.
**Fix:** Later pay PR must use `copyDataCargoEntry`, not `addCargo`.
**Status:** open (out of this slice)

### BIO graft still present
- Import `cancelGraftPending` from `shipyard-desk.js`.
- `ui.graftPending` on dock, undock, Back, selectService, Esc.
- Digit 0: `DOCK_KEY_SERVICES[length-1] === 'shipyard'`.
- Hostility −10, POD 160/240, RESCUE 4/1: not retuned.

### Digit 9
- Epic stages remain.
- Ladder + current rank via `standingRead`.
- How-it-moves and live hunt/yard/discount/locker/graft facts.
- Dock root rank line kept; optional next rung added.
- No new Digit, no HUD family, no police copy.

### Archive
- After the `COMMODITY_KEYS` table.
- Hidden on Freehold / Gilded / Independent / Hollow / Beautiful / Unknowables / non-market.
- Confirm with no UU does not change credits or cargo.

### Second pass
No Blocker or Major. Unused imports stay as brief imports. Probe 51/51.
