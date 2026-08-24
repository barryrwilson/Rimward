## Security Review: Wave 92 BIO-02 class-ladder train

### Risk Level: Low

### Summary
Train is a local hangar class mutate plus a credit debit. Dest is allowlisted to live `SHIP_CLASSES.heavy`. Pending blobs cannot name `__proto__` or career keys. No `innerHTML`, no new persist key, no `emit` of a hangar row.

### Findings

No CRITICAL or HIGH issues.

#### 🟢 LOW: Hangar header still prints mounted id
**Location:** `src/systems/shipyard-desk.js` Hangar pane (`Mounted id ${mountedId}`)
**Issue:** Pre-existing hull-id line stays visible while train papers open. Confirm name does not print `mountedId`.
**Impact:** Session hull ids only. Not a prototype-key smash.
**Fix:** Out of BIO-02 scope. Graft papers already share this header.

### Passed Checks
- [x] Dest `heavy` via `Object.prototype.hasOwnProperty.call(SHIP_CLASSES, dest)` and `livingTrainDest`
- [x] `__proto__` / constructor from-class returns no dest
- [x] Credits: `Number.isFinite`, integer `yardPrice('heavy')`, refuse if short, clamp `>= 0`
- [x] No debit on refuse; `trainInFlight` lock
- [x] Snap restore on remount throw
- [x] No `innerHTML` / `eval` / remote mesh
- [x] No new `WORLD_FIELDS` / localStorage key
- [x] `ctx.emit` not used for hangar rows
- [x] Training does not mint hull ids
- [x] Names through `classLabel` (`hasOwn` SHIP_CLASSES)
- [x] Unknowables / grafted built / frigate fail closed
- [x] No standing write on success

### Recommendations
1. Keep debit on `trainListPrice` → `yardPrice('heavy')` only.
2. Do not add career dest keys without an owner line.
