# Code Review: MSN-02 explore / information recovery (Wave 78)

**Scope:** `src/game/save.js`, `src/systems/station.js`, `scripts/boot-test.mjs`, status lines in `docs/Msn02ExploreDesign.md`.  
**Method:** Self-applied `orchestrator/references/code-review.md` + `shared/personas/reviewer.md`.  
**Date:** 2026-08-21

## Code Review: explore recovery

### Summary
Explore follows live mining/trade/hunt/passenger slot law: two slots, origin accept, origin-dock pay with origin quote, splice+replace, 600 s fail-closed. Completion reads rebound landmark ids in `mystery.visited`. Hunt overlay skip, unique four, and unique haul dest bind stay. No Blocker or Major findings.

### What's done well
- Cap adds `EXPLORE_SLOTS_PER_SYSTEM * N_SYSTEMS` onto the live passenger-inclusive formula. It does not reset to `4+6*N+16`.
- Id allocator is `explore-<sys>-<n>` with collision scan. Tokens stay `SAFE_ID`; full id is not tested.
- Tick pay uses `resolveExploreSite(ctx, origin, slot)`, not stuffed `job.destSystem` or `landmarkId`.
- Unique haul still dest-priced via `otherSystemId`. WAVE26/WAVE35 unique branches untouched.
- `extraOfferedExplore` runs after extra mine/trade/hunt/passenger.
- `mystery.js` is read-only. No `WORLD_FIELDS` `'explored'`.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: `exploreSlotOf` duplicates mining/trade slot helpers
**Location:** `src/systems/station.js` `exploreSlotOf`  
**Issue:** Same 0|1 guard as mining/trade/hunt/passenger. Isolation was the intent.  
**Fix:** Optional later helper share. Do not merge in this serial.

#### 💡 Suggestion: Standing note now names explore
**Location:** `src/systems/station.js` `renderJobs` note  
**Issue:** Copy lists mining, hunt, passenger, and explore on the dock-flag +2 line. Accurate.  
**Fix:** None.

### Test coverage
- WAVE78 hunt pins all true (existing block).
- WAVE78 passenger pins all true (capFormula no longer forbids `EXPLORE_SLOTS`).
- WAVE78 explore pins: unique four, mine/trade/hunt/passenger/explore `*-freehold-0`, proto drop, need/commodity drop field, cap live passenger + EXPLORE_ROOM = `4+10*N+16`, flood keep, fill two, stuffed dest/landmark ignored at pay, complete→replace, expire no pay, no data grant, no innerHTML, no full-id SAFE_ID, mouse Accept source pin.
- WAVE71/72/74/76 stay true.
- Known FAILs WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul still fail as before.

### Verdict
Approve.
