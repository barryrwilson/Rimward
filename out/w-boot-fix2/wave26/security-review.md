## Security Review: WAVE26 unique-four persist identity

### Risk Level: Low

### Summary
Client-only jobs board and UU payout. No new endpoints, persist keys, or `innerHTML`. Unique ferry and haul dest-dock payout still spend cargo then stamp `done` on the persist row. `keepUniqueJobRows` copies enumerable fields onto tracked unique-four objects and collapses duplicate id slots onto the persist row; it does not splice or invent ids.

### Findings

None at CRITICAL or HIGH.

#### 🟢 LOW: `Object.assign` copies live unique rows onto tracked persist objects
**Location:** `src/systems/station.js` `keepUniqueJobRows`
**Issue:** After `sanitizeJobs` clones the array, enumerable own fields on the persist row copy onto older tracked objects. Restore already allowlists job fields; live play rows are engine-owned.
**Impact:** A console-mutated extra enumerable on persist could copy onto a handle. Same trust model as the rest of the overlay. Does not open a network or persist-key path.
**Fix:** None this serial. Do not add a new save latch.

#### 🟢 LOW: unique-four handles skip prune
**Location:** `src/systems/station.js` station `update` `JOB_HANDLES` prune
**Issue:** Unique-four sets retain historical row objects so `writeJobState` can still stamp a pre-accept ref. Sets grow with sanitize clones (four ids).
**Impact:** Extra in-memory job objects on a long session. No persist-key growth. `reofferFerryHandles` still clears ferry dest/pay on every tracked ferry row.
**Fix:** None this serial. Do not add a save flag.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` (`h()` still uses `textContent`)
- [x] No new WORLD_FIELDS / persist keys
- [x] Unique DONE hide still exact four ids + `state === 'done'` (no splice)
- [x] `w26ReofferFerry` still mutates only `ferry-consignment`
- [x] Digit 2 jobs / Digit 0 shipyard / Digit 8/9 unchanged
- [x] Unique haul dest gate still refuses origin (`dest === origin` continue)
- [x] Unique ferry dest gate still requires named `destSystem`
- [x] `uniqueHaulPaid` still set only for `haul-provisions`

### Recommendations
1. Keep unique one-shot as hide-on-done plus persist identity, not a new save flag.
2. Leave WAVE26 `ferryDone` / `haulDone` on the live persist rows.
