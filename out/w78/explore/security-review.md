# Security Review: MSN-02 explore / information recovery (Wave 78)

**Scope:** `src/game/save.js`, `src/systems/station.js`, `scripts/boot-test.mjs` explore pins.  
**Mode:** Deep audit (credits, reputation, restore trust boundary, XSS, §25 leak).  
**Method:** Self-applied `orchestrator/references/security-review.md` + `shared/personas/security-auditor.md`.  
**Date:** 2026-08-21

## Security Review: explore recovery

### Risk Level: Low

### Summary
Restore heals explore rows at the jobs trust boundary. Pay rebinds live `SYSTEMS` landmarks so stuffed dest / landmark id cannot retarget payout. UI uses `textContent` / `h()` and display names only. No HIGH or CRITICAL findings.

### Findings

None at CRITICAL / HIGH.

#### 🟢 LOW: Restored title/detail still printed after strip
**Location:** `src/game/save.js` `jobText`; `src/systems/station.js` `renderJobs` explore branch  
**Issue:** Restored `title`/`detail` are stripped and capped, then live render overwrites explore cards from `resolveExploreSite` + `landmarks[i].name` + `SYSTEMS[site].name`. Unique cards still print restored strings. Explore live cards do not.  
**Impact:** None for this family.  
**Fix:** None required.

### Passed Checks
- [x] Hyphen-token `SAFE_ID` on tokens only; never `SAFE_ID.test(job.id)`
- [x] `RESERVED_IDS` on full id and each token; `explore-__proto__-0` drops
- [x] `JOB_KINDS` includes `'explore'`; mining/trade/hunt/passenger kinds stay
- [x] Explore `need` must be integer 1 else drop (no heal)
- [x] Stuffed `commodity` is not copied onto explore
- [x] `landmarkId` not in `JOB_FIELD_ALLOW`; stuffed dest cannot retarget pay
- [x] `payQuoted` clamp 0…20000 on sanitize and at pay
- [x] Employer rep uses `SYSTEMS[origin].faction` + `Object.hasOwn(FACTIONS)`; no `job.faction`
- [x] `failed` before pay; expire has no pay/rep/favor/data branch
- [x] Accept refuses off-origin; `boardJobs` hides foreign offered explore
- [x] No `addCargo` / `spawnDataPod` / Archive confirm on explore tick
- [x] No `innerHTML` in `station.js`
- [x] Cap = live hunt+passenger cap + `EXPLORE_SLOTS_PER_SYSTEM * N_SYSTEMS`
- [x] Honest mining/trade/hunt/passenger/explore offered slots and unique four never in last-resort drop
- [x] No new persist key / `WORLD_FIELDS` `'explored'` / Digit / event type
- [x] Walk with index `for` / `Object.keys`; fresh `{}` job literals
- [x] §25: UI never interpolates `lm.id`, clue id/text, or `mystery.visited`

### Recommendations
1. Keep survey names on the live `resolveExploreSite` helper (already done).
2. Do not grant data cargo until an owner authors drop % and Archive UU.
