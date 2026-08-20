## Security Review: MSN missions design (Wave 70)

### Risk Level: Medium

### Summary

Wave 70 is markdown only. No `src/` ships. The trust boundary is `world.jobs` on `rimward-save-v1` plus dock UI strings. First-pass gaps (unsanitized jobs, `__proto__` ids, stuffed `payQuoted`, stuffed employer faction, expire-as-complete, `innerHTML`) are closed in merge law §1, §3.2, §3.5, §4, §5. Residual risk is single-player save tamper and pre-existing `pirateBountyId(name)` — not MSN-critical if the impl obeys the contract.

### Findings

#### 🟠 HIGH (resolved in contract): Unsanitized `world.jobs` on restore

**Location:** `save.js` 77, 445–451; inventory §7  
**Issue:** Restore assigns the jobs array wholesale. No kind/state/id heal. A crafted blob can be a 10k-length array, non-objects, or setters.  
**Impact:** Free credits (`payQuoted`), board lock-up, prototype pollution if later code does `jobs[j.id] =`.  
**Fix applied:** Contract §1: `sanitizeJobs` from `sanitizeRestored`; fresh array/objects; cap 64; allowlists; never map-assign by id.

#### 🟠 HIGH (resolved in contract): Job id injection / `__proto__` (and whole-string `SAFE_ID` wipe)

**Location:** `save.js` 100–109 (`SAFE_ID` matches `__proto__`, **rejects hyphens**); live ids `bounty-ace` etc. (`station.js` 1441–1473, 1494–1495)  
**Issue (first draft):** “`SAFE_ID.test` on `job.id` + hyphen mining ids” is not implementable. PR1 would drop unique four, overlays, and mining on restore.  
**Issue (real):** Mining ids if derived from names or raw save ids could become `__proto__`, `constructor`, or `mine-__proto__-0`. Digit accept is by index (lower risk) but sync uses `jobs.some(j => j.id === id)`.  
**Impact:** Board wipe on restore; prototype pollution if any impl uses `obj[job.id]`.  
**Fix applied:** Contract §0.11, §1.3, §4: **hyphen-token** grammar. `SAFE_ID` is the **token** class only. Exact unique-four allowlist. Mining `mine` + `SYSTEMS` key + integer `n`. `RESERVED_IDS` on full id **and** every token (`mine-__proto__-0` drops). Never name-derived mining ids. Never `jobs[id] =`.

#### 🟠 HIGH (resolved in contract): Deadline as silent complete / stuffed `payQuoted`

**Location:** no live deadline; haul already trusts `payQuoted` (`station.js` 1724)  
**Issue:** A save with `state: 'accepted'`, `deadline` in the past, and `payQuoted: 1e15` could be read as “complete now” if expire shares the pay path, or pay a mint on the next dock.  
**Impact:** Economy break cheaper than editing `credits` if unbounded.  
**Fix applied:** Expire has **no** pay/rep/favor branch (§3.5). `payQuoted` clamped `0…20000` (§1.3). Past deadline on restore expires fail closed.

#### 🟠 HIGH (resolved in contract): Faction attribution via saved field

**Location:** patrol already writes `reputation.freehold` (`station.js` 1671); cargo sanitize uses `RESERVED_IDS` on factions  
**Issue:** A `job.faction = '__proto__'` or `veridian` stuffed on a Freehold mining card would mis-attribute REP-04-style standing.  
**Impact:** Reputation bag pollution; wrong faction standing.  
**Fix applied:** No `faction` field on mining jobs. Employer is `SYSTEMS[originSystem].faction` at pay time with `Object.hasOwn(FACTIONS, …)` (§3.2, §5).

#### 🟡 MEDIUM: Pre-existing pirate name → id

**Location:** `station.js` 1494–1495  
**Issue:** `bounty-pirate-${name}` after hyphen folding. Unusual names collapse; collision possible; not proto-prefixed.  
**Impact:** Two pirates could share a card id; not a mining first-slice bug.  
**Fix:** Do not copy for mining. Later pirate-slot serial should use record `id` (`rec-N`) instead of names. Out of first impl.

#### 🟡 MEDIUM: Digit accept by visible index

**Location:** `station.js` 2740–2742  
**Issue:** 1 s docked re-render + splice can move which card sits at Digit 3. Player may accept a different offered job than the one they read a second ago.  
**Impact:** Wrong contract, not a privilege escalation. Single-player.  
**Fix:** Keep index (live UX) but mutate the object identity; do not accept `done`/`failed`. Optional later: bind digits to `job.id`. Documented, not a Wave 70 code change.

#### 🟡 MEDIUM: Delivery counts any hold units (no provenance)

**Location:** haul/ferry already (`tickDeliveryJobs` 1721–1733); contract §3.3  
**Issue:** A mining card for `rawOre` can be filled from the market.  
**Impact:** Career shortcut, not a save exploit. Same class as buying Provisions for haul.  
**Fix:** Accepted for first slice. Do not invent ore `source` tags here.

#### 🟢 LOW: XSS via title/detail/commLine

**Location:** `station.js` 1820–1824 `textContent`; hud commLine (inventory)  
**Issue:** Interpolated station/commodity names. Restored strings could hold `<script>`.  
**Impact:** None if `textContent` holds. `innerHTML` would be XSS.  
**Fix:** Contract §0.10 / §4. Strip on sanitize. Regen titles from templates + allowlisted names when posting replacements.

#### 🟢 LOW: Single-player credits already writable

**Location:** `save.js` `credits`  
**Issue:** Editing jobs to mint UU is not stronger than editing credits **if** caps hold.  
**Fix:** Caps and fail-closed expire so jobs are not the easier cheat.

### Passed Checks

- [x] No secrets in the design (no API keys, no telemetry)
- [x] No new `localStorage` key (`rimward-save-v1` only)
- [x] No THREE / functions on the job blob
- [x] No `innerHTML` specified
- [x] Job ids: hyphen tokens + `RESERVED_IDS`; unique four keepable; `mine-__proto__-0` drops
- [x] Sanitize cap fits 2×100 mining slots (`4+2*N_SYSTEMS+16`)
- [x] No new frozen event carrying unsanitized payloads
- [x] Ore keys fail closed (`ORE_TYPES` + `COMMODITIES`)
- [x] System ids fail closed (`Object.hasOwn(SYSTEMS, id)`)
- [x] Reputation keys fail closed (`Object.hasOwn(FACTIONS, faction)`)
- [x] POD/SHP/HUD-02 not reopened as injection surfaces
- [x] `state.js` not opened to a parallel un-reviewed table dump
- [ ] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. Implementation PR1 must land `sanitizeJobs` (proto, cap, kind/state, `payQuoted` clamp) before any mining pay path.
2. Boot pin crafted snapshots: `id: '__proto__'`, `mine-__proto__-0`, `commodity: '__proto__'`, `payQuoted: 1e15`, `faction: 'veridian'`, `asteroidId: 0`, `jobs: 10k dummy`. Expect drop/clamp. Also pin **keep**: `bounty-ace`, `haul-provisions`, `mine-freehold-0`, `mine-fh_hearth-1`. No throw, no extra credits, no `reputation['__proto__']`.
3. Cap pin: 200 offered mining (2 × 100 systems) + unique four restore intact (length ≤ 220). Do not drop honest offered mining.
4. Expire unit: `deadline: 0` accepted mining → fail closed → replacement, credits unchanged.
5. Do not copy `pirateBountyId` or patrol’s hardcoded `freehold` write. Do not `SAFE_ID.test` the full job id.

### Re-review (after HIGH fixes)

Read integrator + contract + inventory again after Bug 1/2 patch. 🟠 items closed in merge law §0.11, §1.2–1.3, §3.2, §3.5, §4, §5. Whole-string `SAFE_ID` on job.id is **forbidden**. Cap is `4+2*N_SYSTEMS+16` (220 at 100 systems), not 64. No remaining 🔴/🟠 in this markdown set. Open: 🟡 pirate-name ids (pre-existing), digit-index race, market-fill of bulk ore. **No `src/` diff.**
