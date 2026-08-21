# Code Review: MSN-02 explore design (Wave 77)

### Summary

The brief matches live jobs/board/mystery/EXP after Wave 76: unique four `makeJobs` ids, mining + trade slots, pirate/recovery overlays, `sanitizeJobs` cap `4+4*N_SYSTEMS+16` (**420**), haul Wave 35 named dest, Digit 2 `textContent` Jobs pane, `mystery.visited` / `charted`, Assembly Archive UU unset, `priceOf` data 0. First-pass holes (new persist key, colliding `kind: 'recovery'`, keeping cap 420, dest/landmark from save, clue ids in UI, dataCrystal job cargo, invented drop % / Archive UU, hunt/passenger rooms in the cap, patrol `freehold`, unique-four migration, `innerHTML`, third clock, asteroid UUID) are closed. Remaining notes are implementation cautions, not design blockers.

Persona: reviewer + orchestrator `code-review.md`. Markdown only; no `src/` edits. Designer agent not available.

### What's done well

- Inventory cites live `file:line` (Wave 76 numbers, not stale Wave 75 trade inventory) and states code wins.
- Kind is **`explore`**, not `'recovery'` / `'haul'` / `'mining'` / `'trade'` — unique ids and mining/trade slots stay distinct.
- Unique four stay (boot-test pins WAVE26 / WAVE35). Known WAVE4 fence FAIL is not “fixed.”
- One-in-one-out is explicit splice+push, not `completeJob` `done` on explore.
- Deadline cites live `MINING_DEADLINE` / `WRECK_TTL` 600; fail closed; no silent complete; no third clock.
- Site uses live `SYSTEMS.landmarks` display names (Wave 14 chart-mark precedent). Completion reads `mystery.visited`. No new `'explored'` key.
- Pay cites live `RECOVERY_REWARD` + `HAUL_MARGIN` + origin `jobPayFor` + `PAY_QUOTED_MAX`. No invented Archive UU.
- EXP items stay hangar rows. Complete does not grant crystals/cubes.
- Cap grows to `LIVE_CAP_AT_IMPL + EXPLORE_ROOM` and **never drops honest mining or trade**. Formula **omits** hunt/passenger rooms.
- Serial PRs put sanitize before pay. Named only; Wave 77 does not implement.
- Hunt / passenger / espionage / MSN-03 named without numbers. REP-04 deferred.
- Proposed UI copy uses “The Shepherd” / “Freehold Drift” only — no `fh_shepherd`, no clue lines.

### Findings

#### 🔴 Blocker (resolved): `kind: 'recovery'` collision with wreck overlay

**Location:** `syncRecoveryJob` `station.js` 1845–1855; `JOB_KINDS` `save.js` 127  
**Issue:** Reusing `kind: 'recovery'` would make sanitize / wreck `wreckId` / overlay pull treat renewable surveys as salvage cards (or the reverse).  
**Fix applied:** `kind: 'explore'`. Ids `explore-<sys>-<n>`. Unique `recovery` kind untouched.

#### 🔴 Blocker (resolved): Keep live cap 420

**Location:** `save.js` 115–122; mining 2×100 + trade 2×100 already consume 400  
**Issue:** Two explore slots cannot fit. Restore would evict mining or trade.  
**Fix applied:** Contract §1.2 `JOBS_SANITIZE_MAX = LIVE_CAP_AT_IMPL + EXPLORE_ROOM` (`4+6*N_SYSTEMS+16`, 620 at 100). Never drop honest mining, trade, or explore.

#### 🔴 Blocker (resolved): Include hunt/passenger rooms in this cap

**Location:** owner freeze; sibling `out/w77/{hunt,passenger}`  
**Issue:** Pre-adding sibling rooms would either steal their later budget or evict honest explore when those workers land different counts.  
**Fix applied:** Cap term is explore room **only**. Siblings grow the cap in their impl waves.

#### 🔴 Blocker (resolved): Asteroid UUID / clue bind / new `explored` key

**Location:** AST; `mystery.js` 107–128; owner freeze  
**Issue:** Binding `asteroidId` fights AST `id === index`. Binding clues prints §25 secrets. A new persist key fights “extend jobs.”  
**Fix applied:** Named landmark on `SYSTEMS` + origin dock. Read `mystery.visited`. No new `WORLD_FIELDS`.

#### 🔴 Blocker (resolved): Migrate/delete unique four in first explore serial

**Location:** boot-test `scripts/boot-test.mjs` Wave 76 unique pins; owner freeze  
**Issue:** Renaming `haul-provisions` would fail WAVE26/WAVE35 and empty `ensureJobs` identity.  
**Fix applied:** Do not migrate or delete. Unique complete still `done`.

#### 🟠 Major (resolved): `completeJob` leaves DONE forever

**Location:** `station.js` 2202–2204  
**Issue:** Adding explore via `completeJob` as-is would exhaust the family (same mining bug).  
**Fix applied:** Explore never stays `done`; `failed` first, splice + immediate replacement (§2.3). Unique kinds unchanged.

#### 🟠 Major (resolved): Dest / landmark injection / origin retarget / stuffed need

**Location:** security review  
**Fix applied:** Pay rebinds `resolveExploreSite`; accept only at origin; explore `need` exact 1; no `job.faction`; no `landmarkId` field in first impl (`JOB_FIELD_ALLOW` must not grow that name).

#### 🟠 Major (resolved this pass): Optional `landmarkId` sanitize keep

**Location:** contract §1.4 first draft  
**Issue:** “Sanitize may keep a landmarkId if it exists on SYSTEMS” would tempt the tick to trust a save string.  
**Fix applied:** First impl forbids the field. Unknown keys drop. Pay always rebinds.

#### 🟠 Major (resolved): `dataCrystal` job cargo / invented drop % / Archive UU

**Location:** `data-trade.js` 5–23, 119–125; `ARCHIVE_UU` `station.js` 1098–1101; EXP wishlist  
**Issue:** Seeding data keys as job cargo, or paying with a cube, would invent owner-open numbers and fight the hangar-row persist shape.  
**Fix applied:** No commodity on explore. Complete = credits + employer +2 only. Data-grant marked **proposed, needs owner**.

#### 🟠 Major (resolved): Clue id/text in player copy

**Location:** §25 `hud.js` 29–30; `contacts.js` 380–400; `galaxychart.js` 14–19  
**Issue:** Printing `fh_shepherd` or a clue `line` on a Jobs card would break Witness / §25.  
**Fix applied:** Templates interpolate display names only. Illegal copy listed in contract §4.

#### 🟠 Major (resolved): New persist key / new Digit / `innerHTML` / new event / `state.js` write / Unknowables dock

**Location:** owner freeze; `ctx.js` EVENTS 198–228; Digit 2 `station.js` 3424–3427; Unknowables systems = 0  
**Fix applied:** Extend `'jobs'`. Digit 2 only. `textContent`. `commLine`. `state.js` READ-ONLY. No new `WORLD_FIELDS`. No Unknowables dock.

#### 🟠 Major (resolved): Third clock or uncited pay table

**Location:** `MINING_DEADLINE` 193; `HAUL_MARGIN` 173; `RECOVERY_REWARD` 176  
**Issue:** A 900 s explore clock or a new 750 UU table would be uncited numbers.  
**Fix applied:** 600 s. Pay = origin `jobPayFor(round(RECOVERY_REWARD * HAUL_MARGIN))`. Uncited pay fails closed — not used here.

#### 🟡 Minor: Two clocks on offered vs accepted

**Location:** contract §3.6 accept restarts 600 s  
**Issue:** A player can refresh an offered card by accepting at second 599 and still get a full window. That is the generous law, not a bug.  
**Fix:** None. Same as mining/trade.  
**Status:** accepted

#### 🟡 Minor: Two explore cards can name the same landmark

**Location:** contract §2.2 `slot % landmarks.length`; most generated systems have one landmark (`galaxy.generated.js` 16–26)  
**Issue:** Slot 0 and slot 1 on Hearth both survey The Hearth Cart.  
**Fix:** Allowed (two mining cards can share `rawOre`). Do not invent a second landmark.  
**Status:** accepted

#### 💡 Suggestion: Regen helper share with mining/trade

**Location:** `renderJobs` 2838–2851  
**Issue:** A third template branch will grow `renderJobs`. A later `jobs.js` is optional in ownership.  
**Fix:** First impl may stay in `station.js`. Do not require a split in PR2.  
**Status:** optional

### Stale-cite check (sample, 12+)

| Claim | Live | Result |
|---|---|---|
| Jobs Digit 2 | 152, 3424–3427 | OK (Wave 75’s 3179 is stale) |
| `h()` textContent | 2489–2494 | OK |
| Live cap 420 | `save.js` 115–122 | OK (not Wave 75’s 220) |
| `JOB_KINDS` no explore | 127 | OK |
| Unique four `makeJobs` | 1724–1756 | OK |
| `boardJobs` trade filter | 2139 | OK |
| Trade dest rebind | 2323–2324 | OK |
| Patrol `freehold` | 2233 | OK |
| Mystery radii / visited | `mystery.js` 37–38, 120–128 | OK |
| `ARCHIVE_UU` null | 1098–1101 | OK |
| `priceOf` data 0 | 1689–1693 | OK |
| `DATA_DROP_RATE` null | `data-trade.js` 23 | OK |
| Landmark The Shepherd | `authored-systems.js` 56–58 | OK |
| `WRECK_TTL` 600 | `world.js` 811 | OK |
| Tick 0.5 s | 3631 | OK |
| N_SYSTEMS 100 | `state.js` 541; node count | OK |

### Contract vs brief

Merge table in `docs/Msn02ExploreDesign.md` §1 matches `shared-contract.md` §0 / §12: kind `explore`, 2 slots, cap live+explore room, origin landmarks, need 1, pay recovery×margin, +2 employer, no data grant, Digit 2, no hunt/passenger numbers. **If they drift later, the contract wins.**

### Verdict

Design is ready for a later serial. Wave 77 must not land `src/`. No open 🔴/🟠 after the `landmarkId` forbid fix.
