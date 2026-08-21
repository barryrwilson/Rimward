# Security Review: MSN-02 renewable trade design (Wave 75)

### Risk Level: Medium

### Summary

Wave 75 is markdown only. The threat model is a local browser save (`rimward-save-v1`) plus dock UI strings. First-pass HIGH holes (kind/cap collision with mining, dest injection, stuffed need, foreign-board accept, proto ids, stuffed `payQuoted`, `job.faction`, XSS via titles, duplicate pay) are closed in merge law. Residual risk is single-player save tamper and pre-existing Digit-index race — not MSN-02-critical if the impl obeys the contract.

Persona: security-auditor + orchestrator `security-review.md` (deep audit on persist/pay). No `src/` in this worker.

---

## Security Audit: MSN-02 trade brief / contract

### Summary

Overall risk: moderate until PR1 sanitize lands; **low** if the later serial obeys `out/w75/msn02/shared-contract.md`. No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

### Findings

#### 🔴 CRITICAL: (none)

No RCE, no secrets, no new `localStorage` key, no `innerHTML` plan.

#### 🟠 HIGH (resolved in contract): Dest system injection

**Location:** unique haul pay `station.js` 2186–2198; ferry `job.destSystem` 2208–2209; `otherSystemId` 1708–1710; contract §3.5  
**Issue:** A trade row with stuffed `destSystem: 'freehold'` (or any easy system) would pay at the stuffed dock if the tick trusted the save field. That skips the authored one-gate hop and can pay at origin.  
**Impact:** Instant delivery / origin pay; economy skip.  
**Fix applied:** Pay rebinds `dest = otherSystemId(ctx, origin)` and refuses `dest === origin`. UI dest **name** uses the same helper + `SYSTEMS[dest].station.name`. Sanitize still requires dest ≠ origin as a `SYSTEMS` key. Do not import station into `save.js`.

#### 🟠 HIGH (resolved in contract): Cap 220 evicts mining when trade fills

**Location:** live `JOBS_SANITIZE_MAX` `save.js` 117–119 = `4+2*N_SYSTEMS+16` (220 at 100 systems)  
**Issue:** Two trade slots per system add 200 honest rows. If PR1 kept 220, drop order would have to violate “never drop honest offered mining” or refuse trade slots.  
**Impact:** Restore deletes mining careers or cannot heal.  
**Fix applied:** Cap `4 + 4*N_SYSTEMS + 16` (420 at 100). Never drop unique four, accepted, honest mining, or honest trade. Extra/duplicate slots drop first.

#### 🟠 HIGH (resolved in contract): Proto / hyphen job ids

**Location:** `SAFE_ID` `save.js` 101 rejects hyphens; live ids `bounty-ace`, `mine-freehold-0`  
**Issue:** Whole-string `SAFE_ID.test(job.id)` would wipe unique four, mining, and trade on restore. Name-derived ids (`pirateBountyId`) could become `trade-__proto__-0` if copied.  
**Impact:** Board wipe; prototype pollution if any impl does `jobs[id] =`.  
**Fix applied:** Hyphen-token grammar. `trade-<SYSTEMS key>-<n>`. `RESERVED_IDS` on full id and every token. Never copy `pirateBountyId`. Never map-assign by id.

#### 🟠 HIGH (resolved in contract): Stuffed `payQuoted` / expire-as-complete

**Location:** haul already trusts `payQuoted` (`station.js` 2202); mining clamps (`clampJobPay` 1855–1858, `PAY_QUOTED_MAX` 194)  
**Issue:** `payQuoted: 1e15` plus a past `deadline` read as complete would mint credits.  
**Impact:** Economy break cheaper than editing `credits` if unbounded.  
**Fix applied:** Expire has **no** pay/rep/favor branch. Clamp `0…20000` on sanitize and at pay. Past deadline expires fail closed.

#### 🟠 HIGH (resolved in contract): `job.faction` / patrol `freehold` copy

**Location:** patrol write `station.js` 2095; mining employer write 2150–2153  
**Issue:** A stuffed `job.faction = '__proto__'` or `veridian` on a Freehold trade card would mis-attribute standing. Copying patrol’s hardcoded `freehold +=` would credit Compact for every delivery.  
**Impact:** Reputation bag pollution; wrong faction standing.  
**Fix applied:** No `faction` field. Employer = `SYSTEMS[originSystem].faction` + `Object.hasOwn(FACTIONS, …)`. +2 only. Expire writes nothing.

#### 🟠 HIGH (resolved in contract): XSS via job titles / `innerHTML`

**Location:** `h()` `station.js` 2302–2307 (`textContent`); grep `innerHTML` in `station.js` = 0  
**Issue:** Save-authored `title: "<img onerror=…>"` printed with `innerHTML` executes in the dock document.  
**Impact:** Script in the dock UI.  
**Fix applied:** `textContent` / existing `h()` / `commLine` only. Strip on restore (240/720). Regen titles from templates + allowlisted `COMMODITIES[key].name` and `SYSTEMS[id].station.name`. No new frozen event carrying raw save HTML.

#### 🟠 HIGH (resolved in contract): Foreign offered accept / origin retarget

**Location:** unique haul accept stamps `originSystem = currentSystem` (`station.js` 2596); `boardJobs` mining filter 2001  
**Issue:** If offered trade leaked onto a foreign Jobs board and accept copied haul’s “stamp origin = here”, the player could retarget dest via `otherSystemId(here)` and skip the posted hop.  
**Impact:** Player picks dest by docking around.  
**Fix applied:** Contract §3.6: hide offered trade off-home **and** refuse accept unless `currentSystem === originSystem`. Do not retarget `originSystem` on accept.

#### 🟠 HIGH (resolved in contract): Stuffed `need` + reserved commodities

**Location:** `sanitizeOneJob` mining commodity `save.js` 291–293; `holdUnits` 959–963; `COMMODITIES` `state.js` 308–322  
**Issue:** `need: 1` + max `payQuoted` delivers one unit for the lid. `commodity: 'survivor'` / `dataCrystal` / `livingRock` / `__proto__` would couple POD/EXP/BIO or pollute keys.  
**Impact:** Wrong cargo family on the board; cheap delivery if need not pinned.  
**Fix applied:** Trade `need` must be integer `HAUL_UNITS` **5** or drop. Commodity: `COMMODITIES` + `bulk === true` + not `livingRock` + not reserved. No `survivor`. No data keys. No new `COMMODITIES` rows.

#### 🟠 HIGH (resolved in contract): Duplicate pay on restore / crash mid-replace

**Location:** mining `job.state = 'failed'` before pay (`station.js` 2142–2143); unique `completeJob` sets `done` 2065  
**Issue:** If trade called `completeJob` (`done` stays on the board) or paid before flipping state, a crash or restore could pay twice.  
**Impact:** Double credits and double rep.  
**Fix applied:** Set `failed` **before** pay, then splice + replace (mining path). Expire has no pay branch. Unique haul/ferry stay on `completeJob` (do not change WAVE26/WAVE35).

#### 🟡 MEDIUM: Digit accept by visible index

**Location:** `station.js` 3303–3305  
**Issue:** 1 s docked re-render + splice can move which card sits at Digit 3.  
**Impact:** Wrong contract, not privilege escalation. Single-player.  
**Fix:** Keep index (live UX) but mutate object identity; do not accept `done`/`failed`. Documented. Not a Wave 75 code change.

#### 🟡 MEDIUM: Delivery counts any hold units (no provenance)

**Location:** haul/ferry `tickDeliveryJobs` 2199, 2210; mining 2141  
**Issue:** A trade card for `provisions` can be filled from the market (or leftover ferry cargo).  
**Impact:** Career shortcut, not a save exploit. Same class as unique haul.  
**Fix:** Accepted for this slice. Do not invent bulk `source` tags here.

#### 🟡 MEDIUM: Home board > 9 cards (Digit 1–9)

**Location:** inventory §11; `DOCK_KEY_SERVICES` Digit 2; accept 3303–3305  
**Issue:** Unique four + overlays + 2 mining + 2 offered trade can exceed 9. Digit keys cannot accept overflow cards.  
**Impact:** UX; mouse Accept still works (2674). Not a persist hole.  
**Fix:** Contract §12.2 keeps two slots. Do not cut cap for Digit reasons.

#### 🟢 LOW: Single-player credits already writable

**Location:** `save.js` `credits` on `WORLD_FIELDS`  
**Issue:** Editing jobs to mint UU is not stronger than editing credits **if** caps hold.  
**Fix:** Caps and fail-closed expire so jobs are not the easier cheat.

#### 🟢 LOW: Restore after pay, before save

**Location:** autosave on dock/undock (`save.js` 16–18)  
**Issue:** A restore from a snapshot taken while the job was still `accepted` after credits already rose can replay pay. Same class as mining. HMAC out of scope.  
**Fix:** `failed`-first reduces crash double-pay. Full replay of an old snapshot is player-owned save.

### Positive observations

- No new persist key; autosave stays `rimward-save-v1`.
- Live `h()` is already `textContent`; station has no `innerHTML`.
- Mining already proved hyphen tokens, `failed`-first, employer `Object.hasOwn(FACTIONS)`, and `PAY_QUOTED_MAX`.
- Unique four remain exact allowlist (boot pins).
- `state.js` READ-ONLY; no `COMMODITIES` dump.
- NPC hub-route lore is not used as a player dest oracle.

### Passed Checks

- [x] No secrets in the design (no API keys, no telemetry)
- [x] No new `localStorage` key (`rimward-save-v1` only)
- [x] No THREE / functions on the job blob
- [x] No `innerHTML` specified
- [x] Job ids: hyphen tokens + `RESERVED_IDS`; unique four keepable; `trade-__proto__-0` drops
- [x] Sanitize cap fits 2×100 mining + 2×100 trade (`4+4*N_SYSTEMS+16`)
- [x] Never drop honest offered mining to make room
- [x] No new frozen event carrying unsanitized payloads
- [x] Commodity keys fail closed (`COMMODITIES` bulk, no `livingRock` seed, no survivor/data)
- [x] System ids fail closed (`Object.hasOwn(SYSTEMS, id)`); dest pay rebinds `otherSystemId`
- [x] Reputation keys fail closed (`Object.hasOwn(FACTIONS, faction)`); no `job.faction`
- [x] POD/BIO/SHP/HUD-02/EXP/TGT not reopened as injection surfaces
- [x] `state.js` not opened
- [x] Accept-at-origin + exact `need` 5
- [ ] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. Implementation PR1 must land `'trade'` kind + cap 420 + proto/need/commodity allowlist **before** any trade pay path.
2. Boot pin crafted snapshots: `id: '__proto__'`, `trade-__proto__-0`, `commodity: '__proto__'`, `commodity: 'survivor'`, `commodity: 'livingRock'`, `commodity: 'dataCrystal'`, `need: 1`, `payQuoted: 1e15`, `faction: 'veridian'`, `destSystem` stuffed to origin or a third system, `jobs: 10k dummy`. Expect drop/clamp. Keep: `bounty-ace`, `haul-provisions`, `ferry-consignment`, `mine-freehold-0`, `trade-freehold-0`. No throw, no extra credits, no `reputation['__proto__']`.
3. Cap pin: 200 offered mining + 200 offered trade + unique four restore intact (length ≤ 420). Do not drop honest mining.
4. Dest pin: accepted trade with stuffed `destSystem` pays only at `otherSystemId(origin)`, never at stuffed dest or origin.
5. Expire unit: `deadline: 0` accepted trade → fail closed → replacement, credits unchanged.
6. Do not copy `pirateBountyId`, patrol `freehold` write, unique haul either-dock accept, or dest `jobPayFor` onto trade.
7. Do not `SAFE_ID.test` the full job id. Do not “fix” WAVE4 / WAVE26 / WAVE35.

### Re-review (after HIGH fixes)

Read integrator + contract + inventory again after dest/cap/need/accept-at-origin patches. 🟠 items closed in merge law §0.6–0.14, §1.2–1.4, §3.5–3.6, §4, §5. Whole-string `SAFE_ID` on job.id is **forbidden**. Cap is `4+4*N_SYSTEMS+16` (420 at 100 systems), not live 220. No remaining 🔴/🟠 in this markdown set. Open: 🟡 digit-index race, market-fill of bulk, Digit overflow UX. **No `src/` diff from this worker.**

### Re-scan (verifier Bug 1 cite)

Inventory §0 POD row now cites `holdUnits` at `station.js` 959–963 and `addCargo` at 1666–1675. Live check: `holdUnits` 959–963; `addCargo` 1666–1675; `removeCargo` 1676–1685. No design-law change. No new XSS/persist surface. Brief/contract had no copy of the bad cite.
