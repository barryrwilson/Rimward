## Code Review: MSN missions design (Wave 70)

### Summary

The brief matches live jobs/board/world: four unique `makeJobs` ids, pirate/recovery overlays, `completeJob` without replace, unsanitized `WORLD_FIELDS` `'jobs'`, mining as space-side pods with `id === index` rocks. First-pass holes (new persist key, rock UUIDs, inventing eight families, expire-as-pay, `job.faction`) are closed. Verifier Bug 1 (whole-string `SAFE_ID` vs hyphen ids) and Bug 2 (cap 64 vs 2×100 slots) are closed in contract §1.2–1.3. Remaining notes are implementation cautions, not design blockers.

### What's done well

- Inventory cites `file:line` and states code wins.
- First family is **mining**, picked from the live gap table (inventory §8), not a wishlist dump of eight number sheets.
- Unique haul/ferry/ace/patrol ids stay (boot-test pins).
- One-in-one-out is explicit splice+push, not `state = 'done'` on mining.
- Deadline cites `WRECK_TTL` 600; fail closed; no silent complete.
- AST non-goal honored: system + commodity, no `asteroidId`.
- POD/SHP/HUD-02/REP restitution named closed or deferred.
- Serial PRs put sanitize before pay.
- `state.js` READ-ONLY; pay uses live `HAUL_MARGIN` / `FERRY_UNITS` / `jobPayFor`.

### Findings

#### 🔴 Blocker (resolved): First impl tried to specify all eight families

**Location:** wishlist MSN-02; owner freeze  
**Issue:** Numbering haul, passengers, espionage, and pirate war in one brief would invent economy/REP law and fight POD/REP.  
**Fix applied:** Contract §0.4, §9: mining only; later families named without numbers.

#### 🔴 Blocker (resolved): Rock UUID destinations

**Location:** AST `docs/AstOrbitsDesign.md` §9; `asteroids.js` 1877–1885  
**Issue:** `mineHit.asteroidId` is a list index. Jump rebuilds the list. A stored rock id is a different rock.  
**Fix applied:** Contract §0.9 / §3.1: no `asteroidId` field.

#### 🔴 Blocker (resolved): Replace `world.jobs` with a new key

**Location:** owner freeze “prefer extend + sanitize”  
**Issue:** A `world.missions` key would dual-write, skip `WORLD_FIELDS` until a save PR, and strand boot tests.  
**Fix applied:** Extend `'jobs'`. Sanitize in place.

#### 🟠 Major (resolved): `completeJob` leaves DONE forever

**Location:** `station.js` 1631–1632; MSN-01  
**Issue:** Adding mining via `completeJob` as-is would still exhaust the family.  
**Fix applied:** Mining never stays `done`; splice + immediate replacement (§2.3). Unique kinds unchanged.

#### 🟠 Major (resolved): Unreachable hardness-4 board cards

**Location:** AST-02; `MINING_LASERS[0].tier === 1`  
**Issue:** A wakeglass contract on a stock ship cannot resolve.  
**Fix applied:** First slice hardness ≤ 1 only (`rawOre`, `livingRock`).

#### 🟠 Major (resolved): Expire sharing the pay path / stuffed quote / stuffed faction

**Location:** security review  
**Fix applied:** Contract §1.3 clamp, §3.2 no `faction` field, §3.5 expire fail closed.

#### 🟡 Minor: Two clocks on offered vs accepted

**Location:** contract §3.6 accept restarts 600 s  
**Issue:** A player can refresh an offered card by accepting at second 599 and still get a full window. That is the generous law, not a bug.  
**Fix:** none. Pin in PR5 that accept restarts.

#### 🟡 Minor: `boardJobs` still lists unique DONE rows

**Location:** `station.js` 1575–1584  
**Issue:** The Jobs pane remains noisy after ace/patrol/haul/ferry complete. First slice does not fix MSN-01 for those cards.  
**Fix:** Explicit later serial (contract §9.1). Do not hide unique DONE in mining PRs (would look like a lost contract to boot tests that read `state === 'done'`).

#### 🟠 Major (resolved, verifier Bug 1): Whole-string `SAFE_ID` vs hyphen job ids

**Location:** first-draft contract §1.3; live `bounty-ace` (`station.js` 1448); `SAFE_ID` `save.js` 100  
**Issue:** `SAFE_ID` has no `-`. PR1 as first written would drop unique four, overlays, and `mine-freehold-0`.  
**Fix applied:** Contract §1.3 hyphen-token grammar. Unique four exact allowlist. Mining three tokens with `SYSTEMS` middle key.

#### 🟠 Major (resolved, verifier Bug 2): Cap 64 vs 2×100 mining slots

**Location:** first-draft `JOBS_SANITIZE_MAX = 64`; `SYSTEMS` 100 keys (`state.js` 537–541)  
**Issue:** Drop order never dropped offered mining, so unique + 2×systems overflowed 64. Restore would have to violate “never drop offered mining” or the slot law.  
**Fix applied:** Contract §1.2 `JOBS_SANITIZE_MAX = 4 + 2 * N_SYSTEMS + 16` (220 at inventory). Never drop unique four, accepted, or honest offered mining.

#### 🟡 Minor: Done pirate rows vs overlay headroom 16

**Location:** contract §1.2  
**Issue:** A long career save can accumulate many `done` pirate cards. Headroom 16 is for **live** overlays; done pirates drop at overflow step 4.  
**Fix:** Already in drop order. Boot pin a blob with 40 done pirates + 200 mining + unique four → keep mining and uniques, drop done pirates to fit 220.

#### 💡 Suggestion: Extract `jobs.js` in PR2

**Location:** `station.js` already ~2800 lines  
**Issue:** More sync/tick in station will hurt review.  
**Fix:** Optional. If extracted, station remains the dock UI owner; `jobs.js` must not touch `ctx.input` / camera. Not required for Wave 70.

#### 💡 Suggestion: Patrol `freehold` write is a REP bug

**Location:** `station.js` 1671  
**Issue:** Veridian patrol still raises Compact standing.  
**Fix:** Out of mining PRs (contract §5). Later REP/MSN serial.

### Wave 70 checklist vs inventory vs contract

| Pin | Inventory | Contract | Brief |
|---|---|---|---|
| Wave 70 markdown only | §0 | §0.1 | header / non-goals |
| Extend `world.jobs` | §1, §7 | §0.2, §1.1 | merge table |
| No job sanitize today | §7 | §1 (must add) | §3 |
| Unique four stay | §3 | §0.18 | merge table |
| Hyphen live job ids | §7 `SAFE_ID` rejects `-` | §1.3 token grammar | persist §3 |
| Galaxy 100 systems | §7 / `state.js` 537–541 | cap `4+2*100+16=220` | persist §3 |
| No mining kind today | §8 | §3 mining first | goals |
| No deadlines today | §12 | 600 s fail closed | §6 |
| `completeJob` no replace | §5.2 | §2.3 | §4 |
| No innerHTML | §2 | §0.10 | merge table |
| No jobs in `ctx.js` default | §1 | optional `jobs: []` | §10 |
| AST no rock UUID | §11 | §0.9 | merge table |
| POD/SHP closed | §0 | §7 | non-goals |
| Patrol freehold-only rep | §9 | do not copy | §8 |
| First family mining | §15 rec | §0.4 | overview |

No remaining 🔴/🟠 design disagreements after Bug 1/2. **No `src/` diff.**

### Design audit (self-applied; no separate designer agent)

- Wishlist MSN-01 (replace, generous deadline, clear state) is frozen for **mining slots**, not falsely claimed for unique cards.
- MSN-02 list is inventoried; one family specified; others deferred.
- MSN-03 named as later serial, not this impl; no ship grants.
- Numbers either cite live constants (`FERRY_UNITS`, `HAUL_MARGIN`, `WRECK_TTL`, `PIRATE_BOUNTY_CAP`, `Object.keys(SYSTEMS).length` 100) or are marked **proposed, needs owner** (slot count default 2, +2 rep, `payQuoted` max 20000). Sanitize cap is a **formula**, not an invented 64.
- Closed neighbours are named, not reopened.
