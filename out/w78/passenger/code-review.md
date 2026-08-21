# Code Review: MSN-02 passenger escort (Wave 78)

**Scope:** `src/game/save.js`, `src/systems/station.js`, `scripts/boot-test.mjs`, status lines in `docs/Msn02PassengerDesign.md`.  
**Method:** Self-applied `orchestrator/references/code-review.md` + `shared/personas/reviewer.md`.  
**Date:** 2026-08-21

## Code Review: passenger escort

### Summary
Passenger escort follows live trade/hunt slot law: two slots, origin accept, dest-dock pay with origin quote, splice+replace, 600 s fail-closed. Hunt kind, overlay skip, and unique ferry `done` stay. No Blocker or Major findings.

### What's done well
- Cap adds `PASSENGER_SLOTS_PER_SYSTEM * N_SYSTEMS` onto the live hunt-inclusive formula. It does not reset to `4+6*N+16`.
- Id allocator is `passenger-<sys>-<n>` with collision scan. It does not allocate `ferry-<sys>-<n>`.
- Tick pay uses `otherSystemId(ctx, origin)`, not stuffed `job.destSystem`.
- Unique ferry still `completeJob` → `done` (no splice). WAVE26/WAVE35 unique branches untouched.
- `extraOfferedHunt` (plus duplicate-record hunt drop) still runs before `extraOfferedPassenger`.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: `passengerDestId` duplicates `tradeDestId`
**Location:** `src/systems/station.js` `passengerDestId`  
**Issue:** Same `otherSystemId` + SYSTEMS guard as trade. Isolation was the intent.  
**Fix:** Optional later helper share. Do not merge in this serial.

#### 💡 Suggestion: Standing note now names passenger
**Location:** `src/systems/station.js` `renderJobs` note  
**Issue:** Copy lists mining, hunt, and passenger on the dock-flag +2 line. Accurate.  
**Fix:** None.

### Test coverage
- WAVE78 hunt pins all true (existing block untouched).
- WAVE78 passenger pins: unique four, mine/trade/hunt/passenger `*-freehold-0`, proto drop, need/commodity/same-dest drop, cap `4+8*N+16`, flood keep, fill two, stuffed dest ignored, complete→replace, expire no pay, unique ferry still `done`, no cargo tick, mouse Accept source pin.
- WAVE71/72/74/76 stay true.
- Known FAILs WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul still fail as before.

### Verdict
Approve.
