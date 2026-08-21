# Security Review: Wave 77 MSN-02 passenger ferry design

**Scope:** `docs/Msn02PassengerDesign.md`, `out/w77/passenger/shared-contract.md`, `out/w77/passenger/current-passenger-inventory.md`. Markdown design only. No `src/` in this wave.  
**Method:** Self-applied `security-auditor` persona + orchestrator `security-review.md` checklist. Trust boundary is restore (`sanitizeJobs` / `sanitizeReputation` / `sanitizeCargoList`) and Jobs pane DOM.  
**Date:** 2026-08-20.  
**Risk Level:** Low (design controls are fail-closed). No 🔴/🟠 left open after author pass.

Live cites used for attack surface: `station.js` `h()` 2489–2494, Digit accept 3548–3550, unique ferry dest pay 2395–2402, `addCargo` survivor 1668–1677, `holdUnits` 962–965, `priceOf('survivor')` 1689–1690, `save.js` cap 115–122, `JOB_KINDS` 127, `jobIdTokens` 197–208, `sanitizeReputation` 519–538, `ctx.js` events 198–232.

---

## Security Review: passenger family (design)

### Risk Level: Low

### Summary

The contract treats `world.jobs` restore as hostile. Passenger is a new `kind` with hyphen-token ids, origin `payQuoted` clamp, dest **rebind** (not unique-ferry stamped dest), no person-commodity, and employer rep only through `Object.hasOwn(FACTIONS)`. No 🔴/🟠 design holes remain in the markdown.

### Findings

#### 🔴 CRITICAL

None.

#### 🟠 HIGH

None. Draft holes below were closed in the contract before this report.

**Closed during authoring (would have been 🟠 if shipped):**

1. **Unique-ferry dest injection copied onto passenger.** Live unique ferry pays when `currentSystem === job.destSystem` (`station.js` 2396). A stuffed dest retargets that one-shot card. Contract §0.7 / §3.5 **rebinds** `otherSystemId(origin)` at pay (trade 2323–2324). Unique ferry path stays untouched.
2. **People as mergeable bulk.** `holdUnits` sums any matching `commodity`, including `survivor` (`station.js` 962–965). `addCargo('survivor')` pushes a faction-less row (1669–1671). Contract §0.8–0.9 / §1.4 **forbid** `commodity` on passenger jobs, **forbid** `addCargo`/`removeCargo`/`holdUnits` on the complete path, and drop a passenger row that carries `commodity` (including `'survivor'`).
3. **Invented UU / `priceOf('survivor')`.** `priceOf('survivor')` is 0 (`station.js` 1689–1690). A `HAUL_MARGIN × survivor` formula would pay 0 or invite stuffing `world.prices.survivor`. Contract §0.10 reuses live `FERRY_REWARD` 350 via **origin** `jobPayFor` + clamp 0…20000. A new passenger table is fail-closed (no pay) until owner-authored.

#### 🟡 MEDIUM: Unique ferry remains a dest-stamp pay gate

**Location:** live `station.js` 2395–2402 (out of passenger serial); contract §0.4, §3.4 last row  
**Issue:** Unique `ferry-consignment` still trusts stamped `job.destSystem` at pay.  
**Impact:** Save tamper can retarget that **one** unique card. Not a new passenger hole. WAVE26/WAVE4 pin the live path.  
**Fix:** Out of scope. Do not “fix” unique ferry in this family. Passenger must not copy it.  
**Status:** accepted residual (unique four frozen)

#### 🟡 MEDIUM: Accepted + max `payQuoted` is a credits cheat class

**Location:** contract §1.2 never-drop `accepted`; §1.4 `PAY_QUOTED_MAX` 20000; §3.5 pay  
**Issue:** A hand-edited `accepted` passenger row with `payQuoted: 20000` pays 20000 at the rebound dest. Same class as editing `world.credits` or stuffed trade `payQuoted`.  
**Impact:** Local-save cheat, not XSS. Clamp prevents unbounded credits.  
**Fix:** Keep clamp on sanitize **and** at pay. Expire past deadlines fail closed. Do not add a second clock.  
**Status:** accepted (documented)

#### 🟢 LOW: Digit 1–9 vs board length

**Location:** `station.js` 3548–3550; brief §7  
**Issue:** Home board can exceed 9 cards; keys cannot accept past index 8.  
**Impact:** UX only. Mouse Accept still binds the job object. Not injection.  
**Fix:** Do not cut to one slot. Contract §12.2.  
**Status:** accepted

#### 🟢 LOW: Title/detail restore still persist until regen

**Location:** `save.js` `jobText` + `stripControlChars`; contract §4  
**Issue:** Restored strings are stripped then shown until `renderJobs` regenerates from templates.  
**Impact:** Control chars dropped. `h()` uses `textContent` (2489–2494). No `innerHTML` in `station.js`.  
**Fix:** PR4 must regen dest names from `SYSTEMS[otherSystemId].station.name`, never `job.faction`.  
**Status:** control specified

### Passed Checks

- [x] No secrets in markdown
- [x] No new persist key / `WORLD_FIELDS` / `localStorage` name
- [x] No new frozen event (prefer `'commLine'`)
- [x] XSS: `textContent` / `h()` only; overlay clear is `textContent = ''` (`station.js` 3410)
- [x] Proto ids: token `RESERVED_IDS`; drop `passenger-__proto__-0`; unique id/kind mismatch already drops (`save.js` 256–257)
- [x] Stuffed pay: clamp 0…20000
- [x] Dest injection: pay rebinds `otherSystemId`; UI names from `SYSTEMS`
- [x] Reputation: employer = `SYSTEMS[origin].faction` + `Object.hasOwn(FACTIONS)`; no `job.faction`; never `reputation[userString]`; bag heal `sanitizeReputation` 519–538
- [x] People ≠ Market cargo: no `survivor` on jobs; no POD-02 UU reopen; Digit 7 unchanged
- [x] Unique four not migrated; unique ferry still `completeJob` → `done`
- [x] Cap formula = live 420 + passenger room only (no hunt/explore)
- [x] Prototype walk: `Object.keys` / index `for`; fresh `{}`
- [x] `state.js` READ-ONLY; no new `COMMODITIES`

### Recommendations (impl wave)

1. PR1: add `'passenger'` to `JOB_KINDS`; id grammar; **reject** `commodity` on passenger; grow cap to `live_cap_at_impl + 2*N_SYSTEMS`; keep unique four + honest mining + honest trade.
2. PR2: dest-dock complete with **no** `holdUnits` / `addCargo` / `removeCargo`; origin stamp; rebind dest.
3. PR5: pin `passenger-__proto__-0` drop; stuffed dest ignored; unique ferry still `done`; WAVE26/WAVE35 still pass.

---

## Finding count

| Severity | Open | Resolved in markdown |
|---|---|---|
| 🔴 CRITICAL | 0 | 0 |
| 🟠 HIGH | 0 | 3 (author-closed: dest copy, survivor cargo, invented UU) |
| 🟡 MEDIUM | 2 residual (unique ferry dest stamp; local-save payQuoted cheat) | — |
| 🟢 LOW | 2 | — |

**Verdict:** design may proceed. No HIGH/CRITICAL remaining.
