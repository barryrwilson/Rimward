# Code Review: MSN-02 local pirate hunt design (Wave 77)

### Summary

The brief matches live jobs/board/world after Wave 76 trade: unique four `makeJobs` ids, mining + trade slots, overlay pirate cap 2, `sanitizeJobs` cap `4+2*N+2*N+16` (**420**), Digit 2 `textContent` Jobs pane, record ids `rec-<n>`, Named Guns as `role: 'ace'`. First-pass holes (new persist key, `kind: 'bounty'`, stuffing overlay, keeping cap 420, combined passenger/explore formula, asteroid UUID, Named Gun renewable, invented UU, patrol `freehold`, `innerHTML`, third clock) are closed. Remaining notes are implementation cautions, not design blockers.

Persona: reviewer (`C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`) + orchestrator `code-review.md`. Markdown only; no `src/` edits. Designer agent is **not available**.

### What's done well

- Inventory cites live `file:line` (Wave 76 numbers, not stale Wave 70/75) and states code wins.
- Kind is **`hunt`**, not `'bounty'` / `'patrol'` / `'mining'` / `'trade'` — unique ids, overlay, and renewable families stay distinct. NPC AI mode `'hunt'` is called out as not a job kind.
- Unique four stay (boot-test pins WAVE26 / WAVE35). Unique `bounty-ace` stays faction-level.
- Overlay `PIRATE_BOUNTY_CAP` 2 stays. Hunt is a new kind + 2 slots. Same-quarry allowed because Verge has one pirate; single payout is existence-based.
- One-in-one-out is explicit splice+push, not `completeJob` `done` on hunt.
- Deadline cites live `MINING_DEADLINE` / `WRECK_TTL` 600; fail closed; no silent complete; no third clock.
- Pay cites live `record.bounty` + origin `jobPayFor` + `PAY_QUOTED_MAX`. Overlay fallback 400 is **not** a hunt table.
- Cap is `live_cap_at_impl + HUNT_ROOM` and **never drops honest mining or trade**. No passenger/explore terms.
- Target is live `recordId` `rec-<n>`, not `asteroidId`. Witness uses recorded incidents + record state.
- Serial PRs put sanitize before pay. Named only; Wave 77 does not implement.
- Espionage / passengers / explore / MSN-03 named without numbers. REP-04 victim-faction deferred.

### Findings

#### 🔴 Blocker (resolved): `kind: 'bounty'` collision with unique ace and overlay

**Location:** `makeJobs` `station.js` 1731; overlay push 1812; `JOB_KINDS` `save.js` 127  
**Issue:** Reusing `kind: 'bounty'` would make sanitize / `completeJob` / overlay cap treat renewable slots as Named Gun or `bounty-pirate-*`.  
**Fix applied:** `kind: 'hunt'`. Ids `hunt-<sys>-<n>`. Unique `bounty` / overlay untouched.

#### 🔴 Blocker (resolved): Stuff hunt into overlay cap 2

**Location:** `PIRATE_BOUNTY_CAP` `station.js` 187; inventory §7  
**Issue:** Overlay is opportunistic, name-derived ids, `completeJob` DONE leak, no deadline, no employer rep. Verge `pirates: 1` would starve an exclusive leftover rule.  
**Fix applied:** New slots. Overlay stays. Same quarry allowed; accepted hunt wins purse via existence skip.

#### 🔴 Blocker (resolved): Keep live cap 420 / bake sibling rooms

**Location:** `save.js` 118–122; owner freeze  
**Issue:** Two hunt slots cannot fit in 420 without evicting mining/trade. A combined `4+6N+16+passenger+explore` formula would fight sibling Wave 77 workers.  
**Fix applied:** Contract §0.7 `JOBS_SANITIZE_MAX_at_impl = live_cap_at_impl + HUNT_ROOM` (620 at inventory-time 100). Never drop honest mining, trade, or hunt.

#### 🔴 Blocker (resolved): Named Gun / unique ace as renewable hunt

**Location:** `bounty-ace` 1731–1734; `ACES` / `NAMED_GUNS` `state.js` 827–901; `role: 'ace'` `world.js` 407–419  
**Issue:** Wishlist splits local vs faction-level. Posting hunt against Illyx/Vane/aspirants would duplicate `bounty-ace` and lineage.  
**Fix applied:** Eligibility forbids ace role/classKey and those names. Unique four not migrated.

#### 🔴 Blocker (resolved): Asteroid UUID / missing quarry identity

**Location:** mining forbids `asteroidId`; `makeRecord` id `world.js` 285  
**Issue:** A rock UUID or display-only name without sanitize-checkable bind would fail Witness Rule and restore.  
**Fix applied:** `recordId` `/^rec-(0|[1-9][0-9]*)$/` + `originSystem`. UI prints stripped name, never `rec-n` or mystery clue ids.

#### 🟠 Major (resolved): `completeJob` leaves DONE forever

**Location:** `station.js` 2202–2205  
**Issue:** Adding hunt via `completeJob` as-is would exhaust the family (overlay leak).  
**Fix applied:** Hunt never stays `done`; `failed` first, splice + immediate replacement (§2.3). Unique/overlay kinds unchanged.

#### 🟠 Major (resolved): Reverse-walk double pay; stuffed target; ghost slots

**Location:** security review  
**Fix applied:** Overlay skip on accepted hunt bind (order-independent); pay rebinds record name; `syncHuntJobs` pulls ineligible offered ghosts; bank-present sanitize drops bad `recordId`.

#### 🟠 Major (resolved): Invented UU / fallback 400 as hunt table / third clock

**Location:** `PIRATE_BOUNTY_FALLBACK` 188; `MINING_DEADLINE` 193  
**Issue:** Stamping 400 when bounty is missing would invent a hunt table. A 900 s clock would be uncited.  
**Fix applied:** Fill and accept require `record.bounty > 0`. 600 s only. Uncited pay fails closed (refuse accept / 0 pay).

#### 🟠 Major (resolved): New persist key / new Digit / `innerHTML` / new event / `state.js` write

**Location:** owner freeze; `ctx.js` EVENTS; Digit 2 `station.js` 3424–3427  
**Fix applied:** Extend `'jobs'`. Digit 2 only. `textContent`. `commLine`. `state.js` READ-ONLY. No new `WORLD_FIELDS`. No NPC missiles. No power ledger.

#### 🟠 Major (resolved): Victim-faction kill delta / patrol freehold copy

**Location:** `docs/RepStandingDesign.md` §7; patrol 2233  
**Fix applied:** Employer +2 only. No REP-04 numbers. No `reputation[userString]`.

#### 🟡 Minor: Two clocks on offered vs accepted

**Location:** contract §3.6 accept restarts 600 s  
**Issue:** A player can refresh an offered card by accepting at second 599 and still get a full window.  
**Justification:** Generous MSN-01 law, same as mining/trade. Not a bug.

#### 🟡 Minor: Home board Digit overflow

**Location:** unique four + overlay 2 + recovery + 2 mining + 2 trade + 2 hunt  
**Issue:** Digit 1–9 cannot reach index 9+.  
**Justification:** Existing mouse Accept UX (trade contract §12.2). Do not cut hunt slots.

#### 🟡 Minor: Hunt fill only while docked at origin

**Location:** `syncHuntJobs` on `renderJobs`  
**Issue:** Unvisited systems have no hunt rows until first dock (same as mining/trade).  
**Justification:** Matches live renewable families. Sanitize may keep grammar-valid stuffed rows; pull-on-bank exists.

#### 💡 Suggestion: Overlay skip is ~10 lines in live bounty tick

**Location:** contract §3.5  
**Issue:** Hunt serial touches overlay claim.  
**Justification:** Required to prevent double pay. Do not retcon overlay ids/cap/`completeJob`.

#### 💡 Suggestion: `recordId` adds a JOB_FIELD_ALLOW key

**Location:** `save.js` 135–139  
**Issue:** New persist field on jobs.  
**Justification:** Required for sanitize-checkable bind. Hunt-only; other kinds drop the field. Do not reuse `wreckId`.

### Stale-cite check (this wave)

Sampled against live files while writing inventory. Wave 70 MsnMissionsDesign cites (e.g. `ensureJobs` 1476) are **stale** and were not copied. Hunt inventory uses Wave 76-era lines (`ensureJobs` 1759, cap 118–122, overlay 1786). Impl wave must re-sample.

### Serial PR plan

Named only. No `src/` scheduled in Wave 77. Matches contract §8.

### Open (not 🔴/🟠)

- Digit overflow / generous accept restart / unvisited empty boards — see 🟡 above.
- Designer agent skipped — visual Jobs card mock not produced.
