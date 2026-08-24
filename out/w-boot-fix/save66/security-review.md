## Security Review: src/game/save.js (WAVE66 cargo restore)

### Risk Level: Low

### Summary
Cargo restore is still a keep-list boundary. Reserved faction ids fail closed. Extra keys and enumerable `__proto__` do not land. The hangar reseal path re-runs `sanitizeCargoList` before it writes the live hold or the mounted hangar row. No critical or high findings.

### Findings

#### 🟡 MEDIUM: Omitted-hangar reseal can exceed class hold max
**Location:** `src/game/save.js` restore reseal (`omitHangar` branch)
**Issue:** A snapshot with no `world.hangar` used to lose tail rows when hangar starter trim capped a light hull at 40. Reseal puts the full sanitized list back. WAVE66 cargo (57 units) can sit on a hangar row whose `cargoCapacity` is still 40.
**Impact:** A hand-edited local save without a hangar envelope can restore more hold units than the class max. This is a single-player localStorage blob. It does not add keys, reserved ids, or prototype pollution.
**Fix:** Not applied. Trimming again would fail WAVE66 `nameCap` / `validRoundTrip` / `oreNoLeak`. Hold-cap is hangar law; persist keep-list is save law. Leave the overfill until hangar.js is in scope.
**Status:** documented, not fixed

#### 🟢 LOW: `hangar: null` does not reseal
**Location:** `src/game/save.js` `omitHangar = snap.world.hangar === undefined`
**Issue:** `null` is not `undefined`. Restore copies that hangar, `sanitizeHangar` rebuilds a starter, and trim can still drop tail rows.
**Impact:** Only corrupt blobs that set `hangar` to `null`. WAVE66 omits the key. WAVE64 missing-hangar tests omit the key.
**Fix:** Treat non-object hangar as omit if a later pin requires it.
**Status:** documented, not fixed

### Passed Checks
- [x] No secrets in code
- [x] Survivor rows are new literals (`commodity`, `units`, `source`, optional `faction`, optional `name`)
- [x] Ordinary goods (`rawOre`) are `{ commodity, units }` only
- [x] `RESERVED_IDS` plus `__proto__` drop as commodity and as survivor faction
- [x] Reserved survivor faction drops the whole row (fail closed)
- [x] Enumerable `__proto__` / `price` / `loadout` do not copy onto the keep-list
- [x] `sanitizeSurvivorName` strips controls then caps at `NAME_MAX` (40)
- [x] `peopleTrafficked` is not a `WORLD_FIELDS` key and does not restore
- [x] Reseal and hangar cargo write both call `sanitizeCargoList`
- [x] Present hangar still wins the live hold (WAVE64 cargo swap)

### Recommendations
1. Keep reserved-id fail-closed on faction. Do not heal `__proto__` / `constructor` / `prototype` to `other`.
2. If hangar.js later trims on restore, reseal must stay in save.js so WAVE66 rows survive.
