# Security Review: MSN-02 renewable local pirate hunt design (Wave 77)

### Risk Level: Medium

### Summary

Wave 77 is markdown only. The threat model is a local browser save (`rimward-save-v1`) plus dock UI strings. First-pass HIGH holes (kind/cap collision with overlay and mining/trade, stuffed `target`/`recordId`, reverse-walk double pay, ghost slots, stuffed `payQuoted`, `job.faction`, XSS via titles, proto ids) are closed in merge law. Residual risk is single-player save tamper and pre-existing Digit-index race — not MSN-02-hunt-critical if the impl obeys the contract.

Persona: security-auditor (`C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`) + orchestrator `security-review.md` (deep audit on persist/pay). No `src/` in this worker. Designer agent is not available.

---

## Security Audit: MSN-02 hunt brief / contract

### Summary

Overall risk: moderate until PR1 sanitize lands; **low** if the later serial obeys `out/w77/hunt/shared-contract.md`. No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

### Findings

#### 🔴 CRITICAL: (none)

No RCE, no secrets, no new `localStorage` key, no `innerHTML` plan.

#### 🟠 HIGH (resolved in contract): Overlay + hunt double pay / reverse-walk order

**Location:** `tickDeliveryJobs` reverse walk `station.js` 2249–2250; overlay claim 2363–2370; contract §3.5  
**Issue:** Overlay rows are pushed before hunt rows. Reverse walk would credit overlay first, then hunt, for the same `incidents` name match. Restore of two accepted jobs + one incident would mint twice.  
**Impact:** Double credits for one kill; cheaper than editing `credits` if unbounded.  
**Fix applied:** Overlay skip is **existence-based**: any **accepted** hunt bound to that quarry skips overlay **before** credits move. Hunt stamps `payQuoted` and clamps 0…20000. `failed` before pay. Expire has no pay branch.

#### 🟠 HIGH (resolved in contract): Stuffed `job.target` retargets the purse

**Location:** overlay match `i.name === job.target` `station.js` 2364–2366; incidents have **no** record id (`world.js` 1332–1341)  
**Issue:** A hunt row with `target: 'Carver Illyx'` or another living pirate’s name would pay on the wrong kill if the tick trusted the save string.  
**Impact:** Named Gun / foreign-system payout; economy skip.  
**Fix applied:** Pay rebinds `recordId` → origin bank → `rec.name`. Record must be `role === 'pirate'`, not ace, `system === origin`. Incident match uses **live `rec.name`**. Stuffed `destSystem` is ignored (hunt is local). UI name uses the same lookup + `stripControlChars`.

#### 🟠 HIGH (resolved in contract): Ghost `recordId` occupies slots

**Location:** cap never-drop honest offered hunt; unvisited banks  
**Issue:** A stuffed save can plant two offered `hunt-<sys>-n` rows per system with `recordId: rec-999` while that bank is missing. Sanitize would keep them. `syncHuntJobs` would see count=2 and never post a real quarry.  
**Impact:** Career board empty after tamper; cap filled with ghosts.  
**Fix applied:** When the origin bank exists, drop hunt rows whose record is missing/ineligible (`sanitize` §1.4). `syncHuntJobs` **pulls** ineligible **offered** ghosts (overlay precedent 1789–1797). Accept refuses if the record is ineligible. Extra hunt beyond two slots still drops.

#### 🟠 HIGH (resolved in contract): Cap 420 evicts mining/trade when hunt fills

**Location:** live `JOBS_SANITIZE_MAX` `save.js` 118–122 = `4+2*N+2*N+16` (420 at 100)  
**Issue:** Two hunt slots per system add 200 honest rows. If PR1 kept 420, drop order would violate “never drop honest offered mining/trade” or refuse hunt slots. Baking passenger/explore into the same formula would fight sibling workers.  
**Impact:** Restore deletes careers or cannot heal.  
**Fix applied:** `JOBS_SANITIZE_MAX_at_impl = live_cap_at_impl + HUNT_ROOM`. Inventory-time 420+200=620. **No** passenger/explore terms. Never drop unique four, accepted, honest mining, honest trade, or honest hunt.

#### 🟠 HIGH (resolved in contract): Kind `'bounty'` / overlay reuse / Named Gun renewable

**Location:** unique ace + overlay share `kind: 'bounty'` (`station.js` 1731, 1812); `JOB_KINDS` `save.js` 127  
**Issue:** Slotting hunt as `'bounty'` or stuffing overlay cap 2 would hit `bounty-ace`, `completeJob` DONE leak, and name-derived `pirateBountyId`.  
**Impact:** Named Gun card overwritten; proto ids from names; career exhaust.  
**Fix applied:** `kind: 'hunt'`. Ids `hunt-<sys>-<n>`. Overlay cap 2 stays. Eligibility forbids ace / ACES / NAMED_GUNS names. Never copy `pirateBountyId`.

#### 🟠 HIGH (resolved in contract): Proto / hyphen job ids

**Location:** `SAFE_ID` `save.js` 101 rejects hyphens; live ids `bounty-ace`, `hunt-freehold-0`  
**Issue:** Whole-string `SAFE_ID.test(job.id)` would wipe unique four, mining, trade, and hunt on restore. `hunt-__proto__-0` / `recordId: rec-__proto__` could pollute if used as object keys.  
**Impact:** Board wipe; prototype pollution if any impl does `jobs[id] =` or `banks[recordId] =`.  
**Fix applied:** Hyphen-token grammar. `hunt-<SYSTEMS key>-<n>`. `recordId` `/^rec-(0|[1-9][0-9]*)$/`. `RESERVED_IDS` on full id and every token. Never map-assign by id. `recordBanks` walk uses `Object.keys` + `Object.hasOwn` + reserved skip.

#### 🟠 HIGH (resolved in contract): Stuffed `payQuoted` / expire-as-complete

**Location:** overlay trusts `job.reward` unclamped at claim (`station.js` 2368); mining clamps (`clampJobPay` 1858–1861, `PAY_QUOTED_MAX` 196)  
**Issue:** `payQuoted: 1e15` plus a past `deadline` read as complete would mint credits. Overlay fallback 400 must not become a third uncited table.  
**Impact:** Economy break.  
**Fix applied:** Expire has **no** pay/rep/favor branch. Clamp `0…20000` on sanitize and at pay. Stamp only `jobPayFor(origin, record.bounty)` when finite `> 0`; else refuse accept. Missing quote at pay → 0 credits + replace (fail closed). Do not stamp 400 on hunt.

#### 🟠 HIGH (resolved in contract): `job.faction` / patrol `freehold` copy / `reputation[userString]`

**Location:** patrol write `station.js` 2233; mining employer write 2288–2290; `sanitizeReputation` 519–538  
**Issue:** A stuffed `job.faction = '__proto__'` or `veridian` on a Freehold hunt card would mis-attribute standing. Copying patrol’s hardcoded `freehold +=` would credit Compact for every local kill. Indexing `reputation[userString]` from save target/name would pollute the bag.  
**Impact:** Reputation bag pollution; wrong faction standing.  
**Fix applied:** No `faction` field. Employer = `SYSTEMS[originSystem].faction` + `Object.hasOwn(FACTIONS, …)`. +2 only. Expire writes nothing. Never `reputation[userString]`. No victim-faction kill delta (REP-04).

#### 🟠 HIGH (resolved in contract): XSS via job titles / `innerHTML` / printed `rec-` or clue ids

**Location:** `h()` `station.js` 2489–2494 (`textContent`); grep `innerHTML` in `station.js` = 0; mystery events `ctx.js` 208  
**Issue:** Save-authored `title: "<img onerror=…>"` or unstripped `record.name` printed with `innerHTML` executes in the dock document. Printing `recordId` or mystery clue ids leaks unpublished identities.  
**Impact:** Script in the dock UI; Witness Rule break.  
**Fix applied:** `textContent` / existing `h()` / `commLine` only. Strip on restore (240/720). Regen titles from templates + stripped `rec.name` + `SYSTEMS[id].station.name`. Empty name → template, not `recordId`. No new frozen event carrying raw save HTML.

#### 🟠 HIGH (resolved in contract): Foreign offered accept / origin retarget

**Location:** unique haul accept stamps `originSystem = currentSystem` (`station.js` 2810–2816); `boardJobs` 2132–2142  
**Issue:** If offered hunt leaked onto a foreign Jobs board and accept copied haul’s “stamp origin = here”, the player could retarget the quarry system.  
**Impact:** Player picks quarry by docking around.  
**Fix applied:** Contract §3.6: hide offered hunt off-home **and** refuse accept unless `currentSystem === originSystem`. Do not retarget `originSystem` or `recordId` on accept.

### Passed Checks

- [x] No secrets in markdown / no new API keys
- [x] No new `localStorage` key; autosave stays `rimward-save-v1`
- [x] No `innerHTML` plan
- [x] No new frozen `ctx.js` event
- [x] Persist allowlist + hyphen-token + proto drop specified
- [x] Pay clamp + expire fail-closed specified
- [x] Reputation writes allowlisted faction keys only
- [x] Sibling passenger/explore rooms not baked into hunt cap
- [x] Unique four / overlay cap 2 not retired
- [x] `state.js` READ-ONLY; no NPC missiles; no power ledger

### Open (not HIGH/CRITICAL)

#### 🟡 MEDIUM: Digit accept index race

**Location:** `station.js` 3548–3550  
**Issue:** Digit 1–9 accepts `boardJobs[n-1]` by index. A 1 s dock refresh can shift indices; existing mining/trade UX.  
**Justification:** Pre-existing; mouse Accept uses job identity. Contract keeps identity mutate. Do not cut hunt to one slot for Digit reasons.

#### 🟡 MEDIUM: Incidents lack system / record id

**Location:** `world.js` 1332–1346  
**Issue:** Witness is name-based. Hunt mitigates with origin-bank record `dead`/`captured` plus `recordId`. Overlay keeps the live name-only gate.  
**Justification:** Do not retcon incident shape in this serial (persist surface). Record-state gate is the hunt fail-closed bind.

#### 🟢 LOW: `payQuoted` missing → 0 credits + replace

**Location:** contract §3.5  
**Issue:** Tamper that deletes the quote looks like a completed card with no pay.  
**Justification:** Fail closed (no mint). Better than live reprice from stuffed bounty.

### Recommendations

1. Impl PR1 first (kind/cap/`recordId`) before any pay path.
2. Overlay skip must run **before** overlay `credits +=`, keyed off accepted hunt bind, not tick order.
3. Boot pin stuffed `target` / `hunt-__proto__-0` / ace `recordId` / cap `live+HUNT_ROOM`.
