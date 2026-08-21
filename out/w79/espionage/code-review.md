# Code Review: MSN-02 renewable espionage design (Wave 79)

### Summary

The brief matches live jobs/board after Wave 78 hunt/passenger/explore: unique four `makeJobs` ids, five renewable families × 2 slots, overlay pirate cap 2, `sanitizeJobs` cap `4+10*N+16` (**1020**), Digit 2 `textContent` Jobs pane, `JOB_KINDS` without `'espionage'`, employer +2 mining path, EXP UU unset. First-pass holes (new persist key, reused kind, keeping cap 1020, combined faction-war formula, asteroid UUID, invented UU, patrol `freehold`, `innerHTML`, third clock, success target loss, data grant, kill UU) are closed. Remaining notes are implementation cautions, not design blockers.

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Markdown only; no `src/` edits. Nested subagents forbidden. Designer agent is **not available**. UI audit: not applicable (design-brief / non-UI task).

### What's done well

- Inventory cites live `file:line` (Wave 78 numbers, not stale Wave 70/75/77) and states code wins.
- Kind is **`espionage`**, unused in live `JOB_KINDS`. Ids `spy-<sys>-<n>` with mining `mine-` prefix precedent. Justification is in contract §1.3.
- Unique four stay (boot-test pins WAVE26 / WAVE35).
- Cap is `live_cap_at_impl + ESPIONAGE_ROOM` and **never drops honest shipped families**. No faction-war term.
- One-in-one-out is explicit splice+push, not `completeJob` `done` on spy.
- Deadline cites live `MINING_DEADLINE` / `WRECK_TTL` 600; fail closed; no silent complete; no third clock.
- Pay cites live `explorePayBase()` + origin `jobPayFor` + `PAY_QUOTED_MAX`. No new UU table.
- Dest rebinds a **rival** system; does not copy `passengerDestId` / gate-0 (same-flag leak). Gate rivals preferred so 600 s stays honest.
- Secret success: employer +2, target **0**. Expose fail-closed; mining 2 is a candidate only. No kill UU.
- No `dataCrystal` / `dataCube`. Explore precedent cited.
- Serial PRs put sanitize before pay. Named only; Wave 79 does not implement.
- Faction-war / kill attrib named without numbers. Sibling files not waited on.

### Findings

#### 🔴 Blocker (resolved): `kind` reuse of passenger/explore/hunt/bounty

**Location:** `JOB_KINDS` `save.js` 138; families `station.js` 189–193  
**Issue:** Reusing a shipped kind would make sanitize / tick / overlay treat spy slots as escorts, surveys, pirate hunts, or Named Gun.  
**Fix applied:** `kind: 'espionage'`. Ids `spy-<sys>-<n>`. Unique / overlay / five families untouched.

#### 🔴 Blocker (resolved): Keep live cap 1020 / bake faction-war room

**Location:** `save.js` 115–129; owner freeze  
**Issue:** Two spy slots cannot fit in 1020 without evicting shipped families. A combined `4+12N+16` formula that pretends war shipped would fight the sibling worker.  
**Fix applied:** Contract §0.6 `JOBS_SANITIZE_MAX_at_impl = live_cap_at_impl + ESPIONAGE_ROOM` (1220 at inventory-time 100). Never drop honest mining/trade/hunt/passenger/explore/spy.

#### 🔴 Blocker (resolved): Success writes target standing / expose invents kill UU

**Location:** wishlist REP-04; `docs/RepStandingDesign.md` §7 207–214; live Jobs have **no** target write  
**Issue:** A dest-faction `-= N` on success violates secret espionage. An invented expose table would be kill UU.  
**Fix applied:** Success employer +2, target 0. Expire no writes. Expose **proposed, needs owner**, fail closed. Candidate `MINING_REP` 2 not shippable.

#### 🔴 Blocker (resolved): Asteroid UUID / clue id / data cargo

**Location:** AST closed; `data-trade.js` 23; explore complete 3048–3064  
**Issue:** A rock UUID, clue id on the card, or data grant would reopen AST/EXP.  
**Fix applied:** Dest is a `SYSTEMS` key. UI prints station names. No `dataCrystal` / `dataCube`. No `asteroidId`. No clue ids.

#### 🟠 Major (resolved): `completeJob` leaves DONE forever

**Location:** `station.js` 2746–2749  
**Issue:** Adding spy via `completeJob` as-is would exhaust the family (overlay leak).  
**Fix applied:** Spy never stays `done`; `failed` first, splice + immediate replacement (§2.3). Unique/overlay kinds unchanged.

#### 🟠 Major (resolved): Gate-0 dest is same-flag / far `Object.keys` dests starve 600 s

**Location:** `passengerDestId` `station.js` 2358–2362; `otherSystemId` 1719–1720  
**Issue:** Copying passenger dest would post same-faction cards (no target) or pick a 5-gate dest as slot 1.  
**Fix applied:** Rival-faction eligibility. Prefer **gate rivals** only; else any rival. Slot 1 empty if no second dest. Do not duplicate dest. Pay rebinds.

#### 🟠 Major (resolved): Invented UU / third clock / new persist / new Digit / `innerHTML` / new event / `state.js` write

**Location:** owner freeze; `ctx.js` EVENTS; Digit 2 `station.js` 152, 4393–4400  
**Fix applied:** Pay = live `explorePayBase`. 600 s only. Extend `'jobs'`. Digit 2 only. `textContent`. `commLine`. `state.js` READ-ONLY. No new `WORLD_FIELDS`. No NPC missiles. No power ledger.

#### 🟠 Major (resolved): Patrol freehold copy / `job.faction` / `reputation[userString]`

**Location:** patrol 2777; `sanitizeReputation` 672–692  
**Fix applied:** Employer from `SYSTEMS[origin].faction`. No `faction` field. `Object.hasOwn(FACTIONS)` before write.

#### 🟡 Minor: Standing Digit 9 copy still omits spy

**Location:** `standingMoveNotes` `station.js` 1072–1081  
**Issue:** First impl can ship without a Standing line. Players still see `commLine` +2.  
**Fix:** Optional in PR4; not required for PR1. Do not block.

#### 🟡 Minor: Home board Digit overflow grows again

**Location:** unique four + overlays + 2×6 families  
**Issue:** Digit 1–9 cannot accept past index 8.  
**Fix:** Existing UX; mouse Accept. Contract forbids cutting to one slot.

#### 💡 Suggestion: `spy-` vs `espionage-` prefix

**Location:** contract §1.3  
**Issue:** Hunt/passenger/explore use kind as first token; mining uses `mine-`.  
**Fix:** Owner suggested `spy-`. Kind remains `'espionage'`. Sanitize checks both. Stand.

### Test coverage (impl wave, not this wave)

PR5 boot pins named: proto drop, unique four kept, shipped family slots kept, `spy-freehold-0` kept, cap `live+ESPIONAGE_ROOM`, complete→replace, expire no pay and no target delta, stuffed dest ignored, no data cargo, WAVE26/WAVE35 still pass.

No `src/` tests in Wave 79.

### Maintainability

Contract is merge law. Brief defers to it. Inventory is the live cite sheet. Sibling war/kill files are explicitly out of formula.

---

## Recheck after dest-picker fix

Gate-rival preference and no duplicate dest landed in `shared-contract.md` §2.1 / §3.3 and the brief merge table / open questions. No remaining Blocker/Major.
