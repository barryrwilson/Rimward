# Code Review: MSN-03 remaining unique DONE rows design pack (Wave 103)

### Summary

Design-only. Inventory cites live `UNIQUE_JOB_KIND` (`save.js` 152–157), `uniqueJobId` Object.hasOwn (`save.js` 289–291), chain hide (`station.js` 3616), uniqueRetry (`station.js` 5206–5208), Digit 2/0 (`station.js` 185, 6023–6028), and persist-keep (`save.js` 806–831). MERGE LAW hides unique DONE like chain DONE, keeps persist rows, does not splice, does not reopen SKUs. uniqueRetry contradiction is named, not papered over. No 🔴/🟠 remain.

Persona: reviewer (`C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`) + design-doc-reviewer + orchestrator `code-review.md`. Self-applied (no `src/` diff).

### What's done well

- Leftover matches `docs/Msn03ChainsDesign.md` §4 wording: unique DONE remain until a later serial; this slice already hid chain done.
- Hide vs delete is the load-bearing freeze (`ensureJobs` empty-reseed is cited).
- Four ids are the live map, not a fifth invented unique.
- uniqueRetry is inventoried as a live haul/ferry leftover; deputize closes the board surface without WAVE26 “fixes” (tests re-offer by assignment).
- Wave 82 dart/auto grants stay on `CHAIN_GRANT`; unique complete paths do not call `grantChainSku`.
- Serial is two named PRs. No `state.js`. No new persist key.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: uniqueRetry source stays after hide (dead Accept branch)

**Location:** `station.js` 5206–5208, 4687–4692; contract §0.1, §4.

**Issue:** After PR1, DONE unique cards never reach `renderJobs`, so uniqueRetry is dead. Leaving the branch avoids a WAVE26-adjacent `acceptJob` rewrite.

**Fix:** None this wave. A later cleanup may delete uniqueRetry only if boot pins still pass. Do not “fix” WAVE26.

**Status:** deputize documented.

#### 🟡 Minor: Dual allowlist if `boardJobs` copies four ids instead of exporting `uniqueJobId`

**Location:** contract §1; `save.js` 152–157, 289–291.

**Issue:** Exact string equals in `boardJobs` can drift if a later wave grows `UNIQUE_JOB_KIND` (this serial must not grow it).

**Fix:** Optional export of `uniqueJobId` in a later PR. Not required. Growing the four is out of scope.

**Status:** accept; four ids frozen.

#### 🟡 Minor: Digit 1–9 indices on Jobs shift after four DONE uniques hide

**Location:** `station.js` 6082–6084; `boardJobs` order is array order.

**Issue:** Today unique four occupy early `world.jobs` slots. After hide, Digit 1 may bind a family/overlay card sooner. Mouse Accept is unchanged.

**Fix:** None. That is the point of hide (less clutter). WAVE26 finds Accept by title, not Digit index.

**Status:** documented expected.

#### 💡 Suggestion: PR1 without PR2 is still playable

**Location:** contract §6.

**Fix:** Later serial still ships PR2 pins. Named-only this wave.

**Status:** frozen.

### Inventory cite check (live code)

| Claim | Live | Result |
|---|---|---|
| `UNIQUE_JOB_KIND` four ids | `save.js` 152–157 | OK |
| `uniqueJobId` Object.hasOwn | `save.js` 289–291 | OK |
| `JOB_STATES` has `done` | `save.js` 151 | OK |
| `WORLD_FIELDS` `'jobs'` | `save.js` 79 | OK |
| Drop never unique | `save.js` 806–831 | OK |
| `makeJobs` four rows | `station.js` 2074–2107 | OK |
| `ensureJobs` empty reseed | `station.js` 2109–2112 | OK |
| `completeJob` no splice | `station.js` 3707–3720 | OK |
| Chain hide | `station.js` 3616 | OK |
| Unique hide absent | `boardJobs` 3603–3628 | OK |
| uniqueRetry | `station.js` 5206–5208 | OK |
| Ferry DONE reset | `station.js` 4687–4692 | OK |
| Digit 2 Jobs / Digit 0 shipyard | `station.js` 185, 6023–6028 | OK |
| Digit jobs accept offered only | `station.js` 6082–6084 | OK |
| `h()` textContent | `station.js` 4350–4354 | OK |
| `innerHTML` station.js | grep 0 | OK |
| `grantChainSku` not on unique complete | 3481 vs 4199–4252 | OK |
| `CHAIN_GRANT` dart/auto | `jobs-chains.js` 27–33 | OK |
| Patrol 300 / +5 | `station.js` 202–203 | OK |
| Ferry 350 / haul seed 0 | `station.js` 207–208, 2093–2098 | OK |
| Ace default 2500 | `station.js` 219 | OK |
| HUD hub 80 px | `hud.css` 184–189 | OK |
| HUD reads hullKind | `hud.js` 80–87 | OK |
| WAVE26 re-offer | `scripts/boot-test.mjs` 5933 | OK |

### Design-doc checklist

- Completeness: goals, non-goals, hide rule, persist keep, uniqueRetry, serial PRs, risks, acceptance. OK.
- Correctness: live cites sampled this wave. Wave 81 “no kind chain” is called stale in inventory. OK.
- Feasibility: one `boardJobs` skip. OK.
- Alternatives: splice / memorial Digit / persist key / uniqueRetry keep — rejected with reasons. OK.
- Security: proto, XSS, persist smash, Digit, SKU. OK.
- Open questions: none blocking; deputize recorded; no OwnerDecisionsWave103. OK.
