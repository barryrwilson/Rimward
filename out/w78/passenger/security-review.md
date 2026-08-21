# Security Review: MSN-02 passenger escort (Wave 78)

**Scope:** `src/game/save.js`, `src/systems/station.js`, `scripts/boot-test.mjs` passenger pins.  
**Mode:** Deep audit (credits, reputation, restore trust boundary, XSS).  
**Method:** Self-applied `orchestrator/references/security-review.md` + `shared/personas/security-auditor.md`.  
**Date:** 2026-08-21

## Security Review: passenger escort

### Risk Level: Low

### Summary
Restore heals passenger rows at the jobs trust boundary. Pay rebinds `otherSystemId` so a stuffed dest cannot retarget payout. UI uses `textContent` / `h()` only. No HIGH or CRITICAL findings.

### Findings

None at CRITICAL / HIGH.

#### 🟢 LOW: Restored title/detail still printed after strip
**Location:** `src/game/save.js` `jobText`; `src/systems/station.js` `renderJobs` passenger branch  
**Issue:** Restored `title`/`detail` are stripped and capped, then live render overwrites passenger cards from templates + `SYSTEMS[dest].station.name`. Unique cards still print restored strings. Passenger live cards do not.  
**Impact:** None for this family.  
**Fix:** None required.

### Passed Checks
- [x] Hyphen-token `SAFE_ID` on tokens only; never `SAFE_ID.test(job.id)`
- [x] `RESERVED_IDS` on full id and each token; `passenger-__proto__-0` drops
- [x] `JOB_KINDS` includes `'passenger'`; unique `'ferry'` stays
- [x] Passenger `need` must be integer 1 else drop (no heal)
- [x] `commodity` present (including `'survivor'`) drops the passenger job
- [x] `destSystem` required, `SYSTEMS` key, ≠ origin; pay ignores stuffed dest
- [x] `payQuoted` clamp 0…20000 on sanitize and at pay
- [x] Employer rep uses `SYSTEMS[origin].faction` + `Object.hasOwn(FACTIONS)`; no `job.faction`
- [x] `failed` before pay; expire has no pay/rep/favor branch
- [x] Accept refuses off-origin; `boardJobs` hides foreign offered passenger
- [x] No `addCargo` / `removeCargo` / `holdUnits` on passenger tick or accept
- [x] No `innerHTML` in `station.js`
- [x] Cap = live hunt cap + `PASSENGER_SLOTS_PER_SYSTEM * N_SYSTEMS`; hunt extra drop kept
- [x] Honest mining/trade/hunt/passenger offered slots and unique four never in last-resort drop
- [x] No new persist key / `WORLD_FIELDS` / Digit / event type
- [x] Walk with index `for` / `Object.keys`; fresh `{}` job literals

### Recommendations
1. Keep passenger dest names on the live `otherSystemId` helper (already done).
2. Do not reopen POD-02 or unique ferry dest stamp in later serials.
