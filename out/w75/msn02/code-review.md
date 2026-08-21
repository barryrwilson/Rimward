# Code Review: MSN-02 trade design (Wave 75)

### Summary

The brief matches live jobs/board/world after Wave 71: unique four `makeJobs` ids, mining slots, pirate/recovery overlays, `sanitizeJobs` cap `4+2*N_SYSTEMS+16`, haul Wave 35 named dest, ferry stamped dest, Digit 2 `textContent` Jobs pane. First-pass holes (new persist key, colliding `kind: 'haul'`, keeping cap 220, dest from save, `livingRock` seed, patrol `freehold`, unique-four migration, `innerHTML`, third clock) are closed. Remaining notes are implementation cautions, not design blockers.

Persona: reviewer + orchestrator `code-review.md`. Markdown only; no `src/` edits.

### What's done well

- Inventory cites live `file:line` (Wave 71 numbers, not stale Wave 70 inventory) and states code wins.
- Kind is **`trade`**, not `'haul'` / `'ferry'` / `'mining'` — unique ids and mining slots stay distinct.
- Unique four stay (boot-test pins WAVE26 / WAVE35).
- One-in-one-out is explicit splice+push, not `completeJob` `done` on trade.
- Deadline cites live `MINING_DEADLINE` / `WRECK_TTL` 600; fail closed; no silent complete; no third clock.
- Dest uses existing `otherSystemId` / ferry+Wave 35 precedent. Player multi-gate path is allowed; NPC hub-route lore is not applied.
- Pay uses live `HAUL_MARGIN` + origin `jobPayFor` + `PAY_QUOTED_MAX`. No invented margin.
- Commodity pool is live bulk keys minus BIO `livingRock`. No `COMMODITIES` rows. `state.js` READ-ONLY.
- Cap grows to `4+4*N_SYSTEMS+16` and **never drops honest mining**.
- Serial PRs put sanitize before pay. Named only; Wave 75 does not implement.
- Espionage / passengers / hunt / MSN-03 named without numbers. REP-04 deferred.

### Findings

#### 🔴 Blocker (resolved): `kind: 'haul'` collision with unique `haul-provisions`

**Location:** `makeJobs` `station.js` 1740–1744; `JOB_KINDS` `save.js` 123  
**Issue:** Reusing `kind: 'haul'` would make sanitize/unique-four / `completeJob` / Wave 35 tick treat renewable slots as the one-shot card (or the reverse).  
**Fix applied:** `kind: 'trade'`. Ids `trade-<sys>-<n>`. Unique `haul` / `ferry` kinds untouched.

#### 🔴 Blocker (resolved): Keep live cap 220

**Location:** `save.js` 117–119; mining 2×100 slots already consume 200  
**Issue:** Two trade slots cannot fit. Restore would evict mining or unique four.  
**Fix applied:** Contract §1.2 `JOBS_SANITIZE_MAX = 4 + 4*N_SYSTEMS + 16` (420 at 100). Never drop honest mining or honest trade.

#### 🔴 Blocker (resolved): Invent dest without `otherSystemId`

**Location:** owner freeze; Wave 35 haul 2186–2198  
**Issue:** A random-system dest or NPC hub-route dest would be unreachable or would fight WAVE35 pins.  
**Fix applied:** Post and pay via `otherSystemId`. Skip post when dest === origin. Player may still fly extra gates.

#### 🔴 Blocker (resolved): Migrate/delete unique four in first trade serial

**Location:** boot-test `scripts/boot-test.mjs` 14367–14399; owner freeze  
**Issue:** Renaming `haul-provisions` would fail WAVE26/WAVE35 and empty `ensureJobs` identity.  
**Fix applied:** Do not migrate or delete. Unique complete still `done`.

#### 🟠 Major (resolved): `completeJob` leaves DONE forever

**Location:** `station.js` 2064–2065  
**Issue:** Adding trade via `completeJob` as-is would exhaust the family (same mining bug).  
**Fix applied:** Trade never stays `done`; `failed` first, splice + immediate replacement (§2.3). Unique kinds unchanged.

#### 🟠 Major (resolved): Dest injection / origin retarget / stuffed need

**Location:** security review  
**Fix applied:** Pay rebinds `otherSystemId`; accept only at origin; trade `need` exact 5; no `job.faction`.

#### 🟠 Major (resolved): `livingRock` / EXP / POD cargo on the board

**Location:** `COMMODITIES.livingRock` `state.js` 313; EXP data keys; `survivor`  
**Issue:** A bulk-true roll that included `livingRock` would seed BIO food as a delivery contract. Data/survivor would fight EXP/POD desks.  
**Fix applied:** Seed `provisions` | `refinedMetals` | `rawOre` only. Contract §0.8, §3.3.

#### 🟠 Major (resolved): New persist key / new Digit / `innerHTML` / new event / `state.js` write

**Location:** owner freeze; `ctx.js` EVENTS; Digit 2 `station.js` 3179  
**Fix applied:** Extend `'jobs'`. Digit 2 only. `textContent`. `commLine`. `state.js` READ-ONLY. No new `WORLD_FIELDS`.

#### 🟠 Major (resolved): Third clock or invented margin

**Location:** `MINING_DEADLINE` 192; `HAUL_MARGIN` 173  
**Issue:** A 900 s trade clock or 1.6 margin would be uncited numbers.  
**Fix applied:** 600 s and 1.4 only. Uncited pay fails closed (no pay) — not used here.

#### 🟡 Minor: Two clocks on offered vs accepted

**Location:** contract §3.6 accept restarts 600 s  
**Issue:** A player can refresh an offered card by accepting at second 599 and still get a full window. That is the generous law, not a bug.  
**Fix:** none. Pin in PR5 that accept restarts.

#### 🟡 Minor: `boardJobs` still lists unique DONE rows

**Location:** `station.js` 1995–2005  
**Issue:** The Jobs pane remains noisy after ace/patrol/haul/ferry complete. This slice does not fix MSN-01 for those cards. Adding two trade slots increases Digit overflow.  
**Fix:** Explicit later serial (contract §9.1). Mouse Accept remains. Do not hide unique DONE in trade PRs (boot tests read those ids).

#### 🟡 Minor: Origin vs dest `jobPayFor` split vs unique haul

**Location:** unique haul dest quote 2598–2600; mining origin 2589–2590; contract §0.9  
**Issue:** Offered unique haul quotes dest dock; offered trade quotes origin dock. Two delivery careers, two quote systems.  
**Fix:** Intentional (owner: `jobPayFor` at origin). Do not change unique haul. UI copy must say origin quote for trade.

#### 💡 Suggestion: Shared expire/replace helper

**Location:** `replaceMiningJob` `station.js` 1955–1966  
**Issue:** A copy-paste `replaceTradeJob` will drift.  
**Fix:** Later impl may parameterize replace by kind. Not a Wave 75 design blocker. Do not refactor mining in PR1.

#### 💡 Suggestion: `syncTradeJobs` after mining, not inside `makeJobs`

**Location:** `ensureJobs` 1756–1759  
**Issue:** Filling trade from `makeJobs` would skip systems the player has not docked and bloat a fresh save.  
**Fix:** Contract already uses render-time sync of **current** system, like mining. Keep that.

### Verdict

**Approve the design** for a later serial. No remaining 🔴/🟠 in the markdown set after dest/cap/kind/need/accept patches. Implementers must not edit unique haul/ferry ticks, must grow `JOBS_SANITIZE_MAX`, and must not `SAFE_ID.test` full job ids.

Wave 75 worker: markdown only under `docs/Msn02TradeDesign.md` and `out/w75/msn02/**`. No `src/` git changes from this worker.

### Re-scan (verifier Bug 1 cite)

Inventory §0 POD freeze no longer points `holdUnits` at `addCargo`. Cite split is live: `holdUnits` 959–963, `addCargo` 1666–1675. Law unchanged (no `survivor` on jobs). No Blocker/Major from this edit.
