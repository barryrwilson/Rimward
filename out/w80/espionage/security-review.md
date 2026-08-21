## Security Review: MSN-02 renewable espionage (Wave 80 re-dispatch)

### Risk Level: Low

### Summary
Copy and pin fixes do not change restore, pay, or reputation gates. Prototype ids, stuffed dest, stuffed pay, stuffed faction, and XSS still fail closed. No HIGH or CRITICAL finding.

### Findings

No 🔴 CRITICAL or 🟠 HIGH issues.

#### 🟡 MEDIUM: Stuffed `progress: 1` still pays without a dest hop
**Location:** `src/systems/station.js` tickDeliveryJobs espionage complete; `src/game/save.js` sanitizeOneJob progress clamp
**Issue:** Sanitize clamps progress to need. Accept forces 0. A hand-edited accepted row with `progress: 1` pays at origin dock.
**Impact:** Same cheat class as stuffed mining cargo. Contract names this.
**Fix:** Do not add a hop witness unless the owner asks.

#### 🟢 LOW: Employer bag write uses bracket key after `hasOwn`
**Location:** `src/systems/station.js` espionage complete (`reputation[employer]`)
**Issue:** Write uses live `SYSTEMS[origin].faction` after `Object.hasOwn(FACTIONS, employer)`.
**Impact:** `__proto__` and unknown keys skip.
**Fix:** None required.

### Passed Checks
- [x] Drop `spy-__proto__-0` via hyphen tokens + `RESERVED_IDS`
- [x] Do not `SAFE_ID.test` the full hyphenated id
- [x] Stuffed `destSystem` does not retarget gather or pay
- [x] Stuffed `payQuoted` clamps 0…20000 on restore and at pay
- [x] UI missing-quote fallback uses origin `jobPayFor`; complete still fail-closes to 0 when the stamp is missing
- [x] Stuffed `job.faction` does not write
- [x] Titles, reward, and state use `h()` / `textContent`; no `innerHTML`
- [x] Accepted copy names home dock display names, not system keys
- [x] Success employer +2; target skip; expire writes nothing
- [x] No `dataCrystal` / `dataCube` grant
- [x] Origin-only accept plus `boardJobs` hide for foreign offered spy
- [x] No `kind: 'war'`
- [x] WAVE80 REP-04 `bioPodStay` no longer requires spy strings to be absent

### Recommendations
1. Keep the REP-04 expose table fail-closed until the owner authors a number.
2. Keep complete-path missing `payQuoted` at 0. UI fallback is display only.

**Status:** clean for ship.
