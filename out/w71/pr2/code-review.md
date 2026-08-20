## Code Review: `src/systems/station.js` mining cards (WAVE 71 PR2)

### Summary

PR2 lands `syncMiningJobs` on `renderJobs`, origin `payQuoted` on accept, dock delivery in `tickDeliveryJobs`, and Jobs-pane copy via `h()`. Unique four, haul/ferry stamps, Digit 2, and Digit 0 stay. Probe pins pass. No 🔴 Blocker or 🟠 Major findings.

### What's done well

- Slot fill is count-based (`offered|accepted`) and assigns free `slot` 0 then 1. A second render keeps `mine-freehold-0` / `mine-freehold-1`.
- Ids collide by increment (`nextMiningId`). Never `jobs[id] =`.
- Commodity roll is hardness ≤ 1 keys that exist on both `ORE_TYPES` and `COMMODITIES` (`rawOre`, `livingRock`).
- Accept stamps origin `jobPayFor` and does not front cargo. Haul still stamps dest; ferry still fronts Provisions.
- Delivery copies haul: `removeCargo` → credits → `completeJob`. Rep is +2 employer faction, not patrol's hardcoded `freehold`.
- Board filter matches pirate/recovery: hide foreign offered; show accepted everywhere.
- Reward line uses stamped vs live quote. Accepted state line is have/need only (no remaining-time clock).

### Findings

#### 🟡 Minor: `completeJob` leaves `done` mining; next Jobs render posts another slot

**Location:** `src/systems/station.js:1851`, `src/systems/station.js:1634-1654`

**Issue:** PR2 prefers `completeJob` (`state = 'done'`). `syncMiningJobs` does not count `done`, so the next `renderJobs` fills a third mining row for that system. The finished card stays on the board as DONE.

**Fix:** PR3 splice+replace for the same `originSystem`+`slot`. Do not splice in PR2.

**Status:** open (contract; not this PR)

#### 🟡 Minor: Accept origin fail-closed (applied)

**Location:** `src/systems/station.js:2198-2203`

**Issue:** A mining row with a junk `originSystem` could accept and then never pay.

**Fix applied:** After fallback to `currentSystem`, return before `state = 'accepted'` if the origin is still not a `SYSTEMS` key.

**Status:** resolved

#### 💡 Suggestion: `nextMiningId` walks `jobs.some` per increment

**Location:** `src/systems/station.js:1595-1603`

**Issue:** Worst case is linear in the live jobs array. Sanitize cap is 220. Fill adds at most two rows per dock render.

**Fix:** None required. A `Set` of ids is optional later.

**Status:** open (accepted)

### Test coverage

`out/w71/pr2/probe.mjs` boots `initStation`, docks, opens Digit 2:

- two Freehold mining cards, ids `mine-freehold-0` / `mine-freehold-1`, slots 0 and 1, hardness-1 commodity, no `asteroidId`
- unique four still present
- no reshuffle on second render
- accept stamps finite `payQuoted` ≤ 20000, no cargo front
- 4 units at origin: credits up, cargo down, +2 Freehold rep, job `done`
- offered mining hidden on Veridian; accepted mining shown there
- no `innerHTML` in `station.js`

### Contract drift

- Expire / splice+replace: not landed (PR3).
- Remaining-time copy: not landed (PR4).
- WAVE71 boot-test pins: not landed (PR5).
- `state.js` / `save.js` / `hud.js`: untouched.
