## Code Review: MSN-03 authored faction reward chains (Wave 81 design freeze)

### Summary
Markdown-only. The brief matches live Wave 80 jobs/cap/EPICS/hangar code and the merge-law contract. Kind `'chain'`, extend-jobs, `CHAIN_ROOM = 7`, fail-closed SKU, and EPICS/Jobs split are consistent. No Blocker or Major remaining after the inventory/cap freeze.

### What's done well
- Live inventory cites Wave 80 cap `4+14*N+16` (1420), not stale 1020.
- Persist choice is argued: jobs can hold authored hyphen ids; `world.chains` would be a second healer.
- `'chain'` avoids Digit 9 `EPICS` / `'epicJob'` collision.
- Unique four, overlay cap 2, seven families, and spy/war rooms stay.
- Equipment path names live SKUs (`dart`, `auto`, graft) without inventing prices or a new catalog row.
- `'commLine'` already announces grants; no new frozen event.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 🟡 Minor: Step-2 dest table is a freeze, not live Jobs data
**Location:** `out/w81/msn03/shared-contract.md` §3.3; `docs/Msn03ChainsDesign.md` §5
**Issue:** Dest systems (`veridian` / `freehold` / `redmarch`) are authored gates that exist (`authored-systems.js` 44, 73–74, 105–106, 137–138). Copy still must not print those keys.
**Fix:** Impl regenerates dest **display** names from `SYSTEMS[id].station.name`. Already required in §4 / §7.

#### 🟡 Minor: Standing notes omit spy/war today
**Location:** live `standingMoveNotes` `src/systems/station.js` 1077–1086
**Issue:** Digit 9 still says mining + patrol only. Chain first impl does not require an edit (contract §3.4).
**Fix:** Optional PR4+ note. Not this wave.

#### 💡 Suggestion: `CHAIN_ROOM = 4 + 3`
**Location:** contract §0.6
**Issue:** Unique-four headroom plus step count is a small authored bump (7), not `2*N`. Overlay slack of 16 could theoretically absorb 4 sentinels on a quiet save, but stuffed overlay + chains need the raise.
**Fix:** Keep 7. Do not “optimize” back to 0.

#### 💡 Suggestion: Last-step hide vs unique-four `DONE` show
**Location:** contract §0.5; live `boardJobs` 3174–3189
**Issue:** Unique four `done` still list. Chains hide `done` to avoid four extra corpses.
**Fix:** Documented split is intentional. Do not hide unique-four `DONE` in this serial.

### Passed checks
- [x] Live `JOB_KINDS` vs brief (`save.js` 144)
- [x] Live cap 1420 vs `CHAIN_ROOM` add-only
- [x] Unique four ids unchanged
- [x] Overlay cap 2
- [x] No invented equipment UU (shop costs cited as shop only)
- [x] EPICS not turned into Jobs
- [x] Jobs not turned into EPICS
- [x] `state.js` READ-ONLY
- [x] Digit 2 only; no innerHTML
- [x] No sibling TGT/BIO numbers
- [x] Serial PRs named, not scheduled as `src/` this wave

### Verdict
Design freeze is shippable as markdown. Later impl must re-sample line numbers.

**Status:** clean for freeze.
