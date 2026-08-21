## Security Review: MSN-02 hunt jobs (Wave 78)

### Risk Level: Medium

### Summary
Hunt restore and pay sit on a save-file trust boundary. Grammar, proto tokens, `recordId` bind, origin `payQuoted` clamp, employer `Object.hasOwn(FACTIONS)`, overlay skip before credits, and `textContent` close the high-severity paths. One HIGH (unvisited offered hunt fail-closed on a missing bank) was fixed before this report.

### Findings

#### 🟠 HIGH: Offered hunt with a missing origin bank was fail-closed on tick
**Location:** `src/systems/station.js:2554-2564` (fixed)
**Issue:** `resolveHuntRecord` returns null when `recordBanks[origin]` is missing. The first tick treated `huntQuarryGone(null)` as true and spliced offered hunts for unvisited systems. Contract §1.4 keeps grammar-valid hunt when the origin bank is missing.
**Impact:** A restored offered hunt for an unvisited system vanished with no pay (integrity of persist, not a credit steal).
**Fix:** Fail-closed offered quarry-gone only when `huntBank(ctx, origin)` exists. Applied.

#### 🟡 MEDIUM: Duplicate accepted hunt `recordId` can survive under cap
**Location:** `src/game/save.js` `extraDuplicateHuntRecords`; `src/systems/station.js:2582-2586`
**Issue:** Cap heal drops extra hunt only when `length > JOBS_SANITIZE_MAX`. Two accepted hunts can share `recordId` under cap.
**Impact:** A stuffed save could try a double purse. Live fill never binds the same `recordId`. Tick uses `huntPaidNames` and fail-closed replace on the second claim.
**Fix:** Not required for first impl. Same-tick Set plus witness+dead gate blocks the second credit move.

#### 🟢 LOW: Overlay skip marks matching accepted pirate overlay `done` without fence favor
**Location:** `src/systems/station.js:2367-2376`, `2708`
**Issue:** Hunt pay sets overlay `state = 'done'` and skips overlay credits. `completeJob` is not called, so fence favor does not fire.
**Impact:** Intended single-purse law. Overlay DONE leak is pre-existing overlay behavior.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` in `station.js`
- [x] No `SAFE_ID.test(job.id)` on the full id
- [x] `hunt-__proto__-0` and reserved tokens drop
- [x] `recordId` must match `/^rec-(0|[1-9][0-9]*)$/`
- [x] Hunt pay ignores stuffed `job.target`; bind is origin bank + `recordId` + `rec.name`
- [x] Overlay credits skip when an accepted hunt claims that name (existence check before `credits +=`)
- [x] `payQuoted` clamp 0…20000; expire has no pay branch
- [x] Employer write is `SYSTEMS[origin].faction` with `Object.hasOwn(FACTIONS, key)` — no `job.faction`, no `reputation[userString]`
- [x] Titles/details/commLine use `h()` / `textContent` / stripped `rec.name` (NAME_MAX 40)
- [x] UI does not print `recordId`
- [x] Hunt `commodity` is not copied
- [x] Ace / Named Gun records are not eligible quarries
- [x] No new persist key; `WORLD_FIELDS` still has one `'jobs'`

### Recommendations
1. Keep overlay skip existence-based; do not pay overlay after hunt splices (same-tick Set + silence overlay).
2. Optional later: drop duplicate hunt `recordId` even under cap.
