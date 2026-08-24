# Security Review: MSN-03 remaining unique DONE rows brief (Wave 103)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is a `boardJobs` hide of four exact unique ids when `state === 'done'`, persist-keep of those rows, `Object.hasOwn` unique allowlist, `textContent` / `h()` only, Digit 2 Jobs / Digit 0 shipyard, no new `WORLD_FIELDS`, no unique SKU grant. XSS, persist smash, proto ids, Digit theft, and innerHTML stay contract-frozen. No CRITICAL or HIGH.

Persona: security-auditor (`C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`) + orchestrator `security-review.md`. Self-applied. No `src/` edits.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl that splices unique DONE re-posts offered uniques and can farm pay

**Location:** live `ensureJobs` `station.js` 2109–2112; `completeJob` 3707–3720; contract §0.6, §2.

**Issue:** This wave does not ship code. A later PR that `splice`s unique DONE (or deletes them in sanitize) leaves `jobs.length === 0` after four completes. `ensureJobs` reseeds `makeJobs` offered cards. Ace/patrol/haul/ferry pay can repeat from a smashed save.

**Impact:** Credit farm; unique allowlist no longer a one-shot sentinel.

**Fix (frozen):** hide-on-board ≠ delete-from-save. Sanitize already never drops `uniqueJobId` (`save.js` 806–831). Later PR1 is a `boardJobs` `continue` only.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could XSS if it interpolates stuffed `job.title` via `innerHTML`

**Location:** unique cards use live `job.title` / `job.detail` (`station.js` 5030–5031); `h()` sets `textContent` (4350–4354); restore `jobText` strips controls (`save.js` 283–287).

**Issue:** A later PR that does `card.innerHTML = job.title` would inject saved title HTML. Unique titles are not regenerated from templates (families/chains are).

**Impact:** HTML injection on the dock Jobs pane.

**Fix (frozen):** `innerHTML` forbidden; keep `h()` `textContent`. Do not print system keys as HTML.

**Status:** mitigated in contract; not live.

#### 🟢 LOW: Proto job-id smash if later code tests unique ids with `in` or `UNIQUE_JOB_KIND[id]` existence

**Location:** live `uniqueJobId` is `Object.hasOwn(UNIQUE_JOB_KIND, id)` (`save.js` 289–291); `jobIdTokens` already rejects `RESERVED_IDS` (234–251). Contract §0.7, §1.

**Issue:** `in` on a plain object can see `constructor` / prototype. Live path is Object.hasOwn + reserved drop.

**Fix:** later board skip uses exact four string equals (contract §1) or exported `uniqueJobId` only.

**Status:** contract freeze.

#### 🟢 LOW: Digit / persist / SKU theft if later serial ignores MERGE LAW

**Location:** contract §0.2, §0.5, §0.9; `station.js` 185, 6023–6028; `save.js` 76–101; unique complete never calls `grantChainSku` (`station.js` 3481 vs 4199–4252).

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: uniqueRetry ferry DONE reset is a live pay-repeat path until hide ships

**Location:** `station.js` 4687–4692, 5206–5208.

**Issue:** Mouse Accept on DONE ferry/haul can pay again today. Digit accept cannot (`6082–6084` requires `offered`). Hide removes the card so the button is gone. This wave does not ship hide.

**Status:** deputize documents close-by-hide; not a new hole.

---

### Passed Checks

- [x] No secrets
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; station `h()` / `textContent`; overlay wipe is `textContent = ''` (5872)
- [x] Unique ids are authored strings, not blob-indexed maps via `in`
- [x] `uniqueJobId` stays `Object.hasOwn`; reserved ids invalid
- [x] No new `WORLD_FIELDS` key; unique four stay in `jobs`
- [x] Hide ≠ delete; sanitize never drops unique
- [x] Digit 0/8/9 steal forbidden; Digit 2 stays Jobs
- [x] No unique dart/auto grant; Wave 82 SKUs stay on chains
- [x] HUD never writes `hullKind`
- [x] No new `ctx.emit` type (complete stays `'commLine'`)
- [x] `state.js` READ-ONLY
- [x] Do not write `docs/OwnerDecisionsWave103.md`

### Recommendations

1. Later PR1: add the unique DONE `continue` next to the chain skip only. Grep splice of `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` = fail.
2. Later PR2: restore a save with four unique `done` rows; array still length ≥ 4 those ids; Digit 2 shows none of them; `ensureJobs` does not reseed.
3. Grep `innerHTML` in `station.js` = 0. Grep `WORLD_FIELDS` for uniqueDone = fail.
4. Do not log stuffed job titles as HTML. Do not index `UNIQUE_JOB_KIND` with `in`.
