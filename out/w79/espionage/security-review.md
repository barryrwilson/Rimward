# Security Review: MSN-02 renewable espionage design (Wave 79)

### Risk Level: Medium

### Summary

Wave 79 is markdown only. The threat model is a local browser save (`rimward-save-v1`) plus dock UI strings. First-pass HIGH holes (kind/cap collision with five shipped families, stuffed dest/pay/faction, proto ids, XSS titles, target-faction write on success, data-cargo mint, expose inventing kill UU) are closed in merge law. Residual risk is single-player save tamper (`progress` / credits) and pre-existing Digit-index race — not MSN-02-espionage-critical if the impl obeys the contract.

Persona: orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` (deep audit on persist/pay). Nested subagents are forbidden. Designer agent is not available. No `src/` in this worker.

Graph-engineering `graph_resolve` returned `blocked_ambiguous` (generic security-review / code-review / home-network workflows). Owner Wave 79 lifecycle + this checklist bind instead.

---

## Security Audit: MSN-02 espionage brief / contract

### Summary

Overall risk: moderate until PR1 sanitize lands; **low** if the later serial obeys `out/w79/espionage/shared-contract.md`. No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

### Findings

#### 🔴 CRITICAL: (none)

No RCE, no secrets, no new `localStorage` key, no `innerHTML` plan.

#### 🟠 HIGH (resolved in contract): Cap 1020 evicts shipped families when spy fills

**Location:** live `JOBS_SANITIZE_MAX` `save.js` 115–129 = `4+10*N+16` (1020 at 100)  
**Issue:** Two spy slots per system add 200 honest rows. If PR1 kept 1020, drop order would violate “never drop honest offered mining/trade/hunt/passenger/explore” or refuse spy slots. Baking faction-war into the same formula would fight the sibling Wave 79 worker.  
**Impact:** Restore deletes careers or cannot heal.  
**Fix applied:** `JOBS_SANITIZE_MAX_at_impl = live_cap_at_impl + ESPIONAGE_ROOM`. Inventory-time 1020+200=1220. **No** war term. Never drop unique four, accepted, honest shipped families, or honest spy.

#### 🟠 HIGH (resolved in contract): Kind collision / unique four / overlay reuse

**Location:** `JOB_KINDS` `save.js` 138; unique `makeJobs` `station.js` 1732–1764  
**Issue:** Slotting spy as `'passenger'`, `'explore'`, `'hunt'`, or `'bounty'` would hit dest-pay escorts, landmark surveys, pirate records, or Named Gun / overlay `completeJob` DONE leak.  
**Impact:** Career exhaust; wrong pay path; overlay collision.  
**Fix applied:** `kind: 'espionage'` (unused). Ids `spy-<sys>-<n>`. Unique four and overlay cap 2 stay. Do not copy `pirateBountyId`.

#### 🟠 HIGH (resolved in contract): Proto / hyphen job ids

**Location:** `SAFE_ID` `save.js` 101 rejects hyphens; live ids `bounty-ace`, `spy-freehold-0`  
**Issue:** Whole-string `SAFE_ID.test(job.id)` would wipe unique four and all families on restore. `spy-__proto__-0` could pollute if used as object keys.  
**Impact:** Board wipe; prototype pollution if any impl does `jobs[id] =`.  
**Fix applied:** Hyphen-token grammar. `spy-<SYSTEMS key>-<n>`. `RESERVED_IDS` on full id and every token. Never map-assign by id. Walks use `Object.keys` + `Object.hasOwn` + reserved skip. Fresh `{}`.

#### 🟠 HIGH (resolved in contract): Stuffed dest retargets gather/pay

**Location:** passenger/trade dest `otherSystemId` `station.js` 1719–1720; trade pay rebinds dest 2928–2929  
**Issue:** A spy row with `destSystem: 'freehold'` on a Freehold origin, or a stuffed far dest, would pay at the wrong dock or make employer === target. Gate-0 dest often shares faction.  
**Impact:** Same-flag “spy”; standing skip; unreachable dest in 600 s.  
**Fix applied:** Dest must be a rival `SYSTEMS` key with a station. Pay/gather **rebind** `resolveEspionageDest(origin, slot)`. Prefer **gate rivals** only; else any rival. Slot 1 does not duplicate dest. Stuffed `destSystem` cannot retarget pay. Skip post if none.

#### 🟠 HIGH (resolved in contract): Stuffed `payQuoted` / expire-as-complete

**Location:** overlay trusts `job.reward` unclamped at claim (`station.js` 3077–3089); families clamp (`clampJobPay` 1867–1869, `PAY_QUOTED_MAX` 204)  
**Issue:** `payQuoted: 1e15` plus a past `deadline` read as complete would mint credits. A new UU table would be uncited.  
**Impact:** Economy break.  
**Fix applied:** Expire has **no** pay/rep branch. Clamp `0…20000` on sanitize and at pay. Stamp only origin `jobPayFor(explorePayBase())` (live 2508). Missing quote at pay → 0 credits + replace. Do not invent a spy table.

#### 🟠 HIGH (resolved in contract): `job.faction` / patrol `freehold` copy / `reputation[userString]` / success target loss

**Location:** patrol write `station.js` 2777; mining employer write 2893–2895; `sanitizeReputation` 672–692; wishlist REP-04  
**Issue:** A stuffed `job.faction = '__proto__'` or `veridian` on a Freehold spy card would mis-attribute standing. Copying patrol’s hardcoded `freehold +=` would credit Compact for every origin. Writing dest faction on success would violate secret-success. Indexing `reputation[userString]` from save dest/name would pollute the bag. Inventing expose/kill UU would fight the sibling worker.  
**Impact:** Reputation bag pollution; target learns a secret job via standing; wrong faction standing.  
**Fix applied:** No `faction` field. Employer = `SYSTEMS[originSystem].faction` + `Object.hasOwn(FACTIONS, …)`. Success **+2 employer, target 0**. Expire writes nothing. Expose delta **proposed, needs owner**, fail closed (no target write). Candidate mining 2 is not shippable. Never `reputation[userString]`. No kill UU.

#### 🟠 HIGH (resolved in contract): XSS in titles / clue ids / `innerHTML`

**Location:** live `h()` `station.js` 3208–3213; `innerHTML` grep 0; `clueFound` `ctx.js` 208  
**Issue:** Save titles, dest keys, or mystery clue text in the Jobs pane would inject HTML if anyone used `innerHTML`, or leak unpublished EXP.  
**Impact:** XSS in a local overlay; Witness Rule / §25 leak.  
**Fix applied:** `textContent` / `h()` / `'commLine'` only. Regen from allowlisted `SYSTEMS` / `FACTIONS` **display names**. Strip on restore. Never print keys, clue ids, `recordId`, or `asteroidId`. Digit 2 only.

#### 🟠 HIGH (resolved in contract): `dataCrystal` / `dataCube` grant / Archive UU invention

**Location:** `DATA_DROP_RATE` null `data-trade.js` 23; `ARCHIVE_UU` null `station.js` 1106; explore grants none 3048–3064  
**Issue:** Granting data cargo from a spy complete would invent EXP drop % and a new persist surface on hangar rows.  
**Impact:** Unpriced Archive path; SKU invention.  
**Fix applied:** No data grant. No `commodity` on spy jobs. EXP desk unchanged.

#### 🟡 MEDIUM (accepted residual): Stuffed `progress === 1` skips dest hop

**Location:** contract §3.5 gather uses job `progress`; mining cargo is similarly tampable  
**Issue:** A hand-edited save with `state: 'accepted'` and `progress: 1` can file at origin without docking dest.  
**Impact:** Skip the hop; still clamped pay. Same cheat class as stuffing mining hold units or `credits`.  
**Fix:** Do not add a second persist key for “visited dest”. Accept is forced `progress = 0`. Sanitize does not heal stuffed progress **up**. Document as save tamper, not a network exploit.

#### 🟡 MEDIUM (pre-existing): Digit accept by board index

**Location:** `station.js` 4429–4431  
**Issue:** Digit 1–9 accept `boardJobs[n-1]`. A render mid-key can bind the wrong card. Mouse Accept uses object identity.  
**Impact:** Existing UX; home board already exceeds 9 cards.  
**Fix:** Do not cut spy to one slot. Keep mouse Accept. Do not add a new Digit.

#### 🟢 LOW: `explorePayBase` is a function, not a named spy constant

**Location:** `station.js` 2508  
**Issue:** Impl might copy 420 as a magic number.  
**Impact:** Drift if `RECOVERY_REWARD` / `HAUL_MARGIN` change.  
**Fix:** Call the same live formula / helper. Do not author `ESPIONAGE_REWARD` in `state.js`.

### Passed Checks

- [x] No secrets in code (markdown only)
- [x] No new `localStorage` key; autosave `rimward-save-v1`
- [x] No `innerHTML` plan
- [x] No new frozen event
- [x] Prototype keys fail closed
- [x] `payQuoted` clamp 0…20000
- [x] Employer write gated on `Object.hasOwn(FACTIONS)`
- [x] Target write skipped on success
- [x] Expose fail-closed (no kill UU)
- [x] No `dataCrystal` / `dataCube`
- [x] Unique four never dropped
- [x] Cap adds **only** `ESPIONAGE_ROOM`
- [x] Digit 2 / `textContent` / `commLine`
- [x] `state.js` READ-ONLY

### Recommendations

1. Impl PR1 must extend `JOB_KINDS` and cap **before** any pay path.
2. Impl must rebind dest at gather/pay, not trust `job.destSystem`.
3. Impl must skip target standing on success and on expire until an owner table exists.
4. Do not wait on sibling `out/w79/rep04` or `out/w79/faction-war` files.
