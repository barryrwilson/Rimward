# Security Review: MSN-02 renewable explore design (Wave 77)

### Risk Level: Low (after contract freeze)

### Summary

Wave 77 is markdown only. The threat model is a local browser save (`rimward-save-v1`) plus dock UI strings. First-pass HIGH holes (kind/cap collision with mining+trade, dest/landmark injection, clue-id leak, stuffed need/pay, foreign-board accept, proto ids, `job.faction`, XSS via titles, invented data grants / Archive UU, duplicate pay) are closed in merge law. Residual risk is single-player save tamper (`mystery.visited`, credits) — not MSN-02-critical if the impl obeys the contract.

Persona: security-auditor + orchestrator `security-review.md` (deep audit on persist/pay/XSS/§25). No `src/` in this worker.

---

## Security Audit: MSN-02 explore brief / contract

### Summary

Overall risk: moderate until PR1 sanitize lands; **low** if the later serial obeys `out/w77/explore/shared-contract.md`. No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

### Findings

#### 🔴 CRITICAL: (none)

No RCE, no secrets, no new `localStorage` key, no `innerHTML` plan, no invented Archive debit.

#### 🟠 HIGH (resolved in contract): Dest / landmark injection

**Location:** unique haul pay `station.js` 2373–2385; trade rebind 2323–2324; `otherSystemId` 1711–1713; authored landmark ids `authored-systems.js` 56–58; contract §2.2, §3.5  
**Issue:** An explore row with stuffed `destSystem: 'freehold'` or stuffed `landmarkId` pointing at an easy nearby wreck/asteroid would pay without the posted hop if the tick trusted the save field.  
**Impact:** Instant file / skip travel; economy skip; possible bind to a non-landmark.  
**Fix applied:** Pay and progress rebind `resolveExploreSite(origin, slot)` from live `SYSTEMS[origin].landmarks` (dest fallback only if origin table empty). Stuffed dest / landmark fields are not the pay key. Prefer **no** `landmarkId` field in first impl. UI names come from `lm.name` + system display name.

#### 🟠 HIGH (resolved in contract): Cap 420 evicts mining/trade when explore fills

**Location:** live `JOBS_SANITIZE_MAX` `save.js` 115–122 = `4+4*N_SYSTEMS+16` (420 at 100 systems)  
**Issue:** Two explore slots per system add 200 honest rows. If PR1 kept 420, drop order would have to violate “never drop honest offered mining/trade” or refuse explore slots. Pre-adding hunt/passenger rooms would steal sibling families’ later room or evict them.  
**Impact:** Restore deletes mining/trade careers, or sibling waves cannot land.  
**Fix applied:** `JOBS_SANITIZE_MAX_at_impl = LIVE_CAP_AT_IMPL + EXPLORE_ROOM` = `4+6*N_SYSTEMS+16` (620 at 100). **No hunt/passenger rooms.** Never drop unique four, accepted, honest mining, honest trade, or honest explore. Extra/duplicate slots drop first.

#### 🟠 HIGH (resolved in contract): Proto / hyphen job ids

**Location:** `SAFE_ID` `save.js` 101 rejects hyphens; live ids `bounty-ace`, `mine-freehold-0`, `trade-freehold-0`  
**Issue:** Whole-string `SAFE_ID.test(job.id)` would wipe unique four, mining, trade, and explore on restore. Name-derived ids (`pirateBountyId`) could become `explore-__proto__-0` if copied. Landmark ids must not be concatenated into job ids as a fourth token from save.  
**Impact:** Board wipe; prototype pollution if any impl does `jobs[id] =`.  
**Fix applied:** Hyphen-token grammar. `explore-<SYSTEMS key>-<n>`. `RESERVED_IDS` on full id and every token. Never copy `pirateBountyId`. Never map-assign by id. Landmark id is not part of the job id.

#### 🟠 HIGH (resolved in contract): Stuffed `payQuoted` / expire-as-complete

**Location:** mining/trade already trust clamped `payQuoted` (`station.js` 2283–2286, 2332–2335); `clampJobPay` 1858–1862, `PAY_QUOTED_MAX` 196  
**Issue:** `payQuoted: 1e15` plus a past `deadline` read as complete would mint credits.  
**Impact:** Economy break cheaper than editing `credits` if unbounded.  
**Fix applied:** Expire has **no** pay/rep/favor/data branch. Clamp `0…20000` on sanitize and at pay. Past deadline expires fail closed.

#### 🟠 HIGH (resolved in contract): `job.faction` / patrol `freehold` copy / second Assembly write

**Location:** patrol write `station.js` 2233; mining employer write 2288–2290; `sanitizeReputation` `save.js` 519–538  
**Issue:** A stuffed `job.faction = '__proto__'` or `unknowables` on a Freehold explore card would mis-attribute standing. Copying patrol’s hardcoded `freehold +=` would credit Compact for every survey. Wishlist flavor (“Assembly/Unknowables hunger”) could tempt a second bag write.  
**Impact:** Reputation bag pollution; wrong faction standing.  
**Fix applied:** No `faction` field. Employer = `SYSTEMS[originSystem].faction` + `Object.hasOwn(FACTIONS, …)`. +2 only. Expire writes nothing. Flavor copy is not a second `reputation` index. Never `reputation[userString]`.

#### 🟠 HIGH (resolved in contract): XSS via job titles / `innerHTML` / clue dump

**Location:** `h()` `station.js` 2489–2494 (`textContent`); grep `innerHTML` in `station.js` = 0; HUD §25 `hud.js` 29–30, 1421–1432  
**Issue:** Save-authored `title: "<img onerror=…>"` printed with `innerHTML` executes in the dock document. Save-authored `detail` that pastes `fh_shepherd` or a clue `line` leaks §25 internals even with `textContent`.  
**Impact:** Script in the dock UI; mystery spoiler / internal-id leak.  
**Fix applied:** `textContent` / existing `h()` / `commLine` only. Strip on restore (240/720). Regen titles from templates + allowlisted landmark **display name** and system **display name**. Never interpolate `lm.id`, `clues[].id`, `clues[].line`, `lm.line`, or mystery keys. No new frozen event carrying raw save HTML.

#### 🟠 HIGH (resolved in contract): Foreign offered accept / origin retarget

**Location:** unique haul accept stamps `originSystem = currentSystem` (`station.js` 2812); `boardJobs` mining/trade filter 2138–2139  
**Issue:** If offered explore leaked onto a foreign Jobs board and accept copied haul’s “stamp origin = here”, the player could retarget the site via `resolveExploreSite(here)` and skip the posted dock.  
**Impact:** Player picks site by docking around.  
**Fix applied:** Contract §3.6: hide offered explore off-home **and** refuse accept unless `currentSystem === originSystem`. Do not retarget `originSystem` on accept.

#### 🟠 HIGH (resolved in contract): Stuffed `need` + EXP/POD/BIO cargo on the board

**Location:** `sanitizeOneJob` trade commodity `save.js` 306–314; `JOB_FIELD_ALLOW` includes `commodity` 135–139; `data-trade.js` 5–6; `holdUnits` 962–965  
**Issue:** `need: 1` plus a data commodity would couple EXP. `commodity: 'dataCrystal'` on an explore row could survive if sanitize copied `commodity` for unknown kinds. Completing explore by calling `spawnDataPod` / Archive confirm would invent drop % (`null`, `data-trade.js` 23) and Archive UU (`null`, `station.js` 1098).  
**Impact:** Wrong cargo family; unpaid desk debit; illegal data mint.  
**Fix applied:** Explore `need` must be integer **1** or drop. **Do not copy `commodity`** on explore. No `survivor`. No data keys. No `livingRock`. Complete pays credits + employer +2 only. Data-grant is **proposed, needs owner** and out of family.

#### 🟠 HIGH (resolved in contract): Duplicate pay on restore / `completeJob` DONE leak

**Location:** mining `failed` first 2280–2281; unique `completeJob` 2202–2204  
**Issue:** Using unique `completeJob` would leave DONE explore cards (MSN-01 fail). Paying then crashing before splice could double-pay on reload if state stayed `accepted`.  
**Impact:** Credit mint; board clutter.  
**Fix applied:** `failed` before pay; splice + replace; never `state = 'done'` on explore. Expire has no pay branch.

#### 🟡 MEDIUM: `mystery.visited` save tamper

**Location:** `WORLD_FIELDS` `'mystery'` `save.js` 79; `mystery.js` 120–128  
**Issue:** A hand-edited save that fills `mystery.visited` with every landmark id lets every accepted explore pay on the next origin-dock tick.  
**Impact:** Career skip. Same class as stuffing cargo for mining or editing `credits`.  
**Fix:** Do not add a second clock or visit-time world key. Document as save cheat. Pay still requires origin dock + rebound id from live `SYSTEMS`, not a stuffed job field.  
**Status:** accepted residual (fail closed, no extra persist)

#### 🟡 MEDIUM: Digit-index race / board overflow

**Location:** Digit accept `station.js` 3548–3550; mouse Accept 2909  
**Issue:** Home boards already exceed 9 cards. Two explore cards add more. Digit 1–9 cannot accept index ≥9.  
**Impact:** Keyboard accept miss; mouse still works. Pre-existing UX.  
**Fix:** Do not cut to one slot. Contract §12.2.  
**Status:** existing UX, not explore-critical

#### 🟢 LOW: Already-visited instant file

**Location:** contract §3.1, §12.6; mining hold-fill precedent 2272–2279  
**Issue:** Accept at origin while the landmark is already in `visited` pays on the next 0.5 s tick without undocking.  
**Impact:** Cheap 420-class UU loop. Same class as mining with ore already in the hold.  
**Fix:** First slice allows information recovery of known sites. Owner may later require a post-accept undock — not this serial.  
**Status:** accepted default

### Passed Checks

- [x] No secrets in design markdown
- [x] No new `localStorage` key (`rimward-save-v1` only)
- [x] No new `WORLD_FIELDS` / no `world.explored`
- [x] No `innerHTML` plan
- [x] No new frozen event
- [x] Prototype ids fail closed
- [x] Reputation keys allowlisted
- [x] Pay clamped 0…20000
- [x] Site rebound from live table
- [x] §25: no clue id/text in proposed UI copy
- [x] EXP drop % / Archive UU not invented
- [x] Cap formula excludes hunt/passenger rooms
- [x] WAVE4 / WAVE26 / WAVE35 not “fixed”

### Recommendations

1. Impl PR1 must extend `JOB_KINDS` and cap **before** sync posts 200 explore rows.
2. Impl PR4 must regen titles every render (mining/trade precedent `station.js` 2838–2851).
3. Boot pin: stuffed `commodity: 'dataCrystal'` on an explore row drops the field/job; complete does not grow hangar data rows.
