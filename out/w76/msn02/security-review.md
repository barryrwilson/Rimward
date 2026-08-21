# Security Review: Wave 76 MSN-02 trade impl

### Risk Level: Low

### Summary

Deep audit of persist, pay, dest bind, accept, and Jobs copy. No CRITICAL or HIGH remain after the serial. Threat model is a local `rimward-save-v1` blob plus dock `textContent`. Credits and reputation are the money surface.

Persona: security-auditor + orchestrator `security-review.md`. Method: read `save.js` sanitize, `station.js` sync/accept/tick/UI, WAVE76 pins, probe.

---

## Security Audit: MSN-02 trade first impl

### Summary

Overall risk: low. Save-tamper, proto ids, dest injection, stuffed need/pay, XSS, and duplicate pay are closed in code. Residual risk is the same single-player save edit class as mining.

### Findings

#### 🔴 CRITICAL: (none)

#### 🟠 HIGH: (none)

#### 🟡 MEDIUM: Accepted extras can exceed cap

**Location:** `src/game/save.js` `extraOfferedFamily` / last-resort drop  
**Issue:** Extra *accepted* trade (or mining) rows are never dropped, by contract. A hand-edited save with hundreds of accepted trades can restore above 420.  
**Impact:** Larger jobs array; not extra credits by itself.  
**Status:** open — same mining law; contract forbids dropping accepted. Honest play stays ≤420.  
**Justification:** Fail closed on pay still applies per row; do not drop accepted to “make room.”

#### 🟢 LOW: Digit 1–9 cannot accept past index 8

**Location:** `src/systems/station.js` digit handler ~3304 (pre-existing)  
**Issue:** Home board can exceed 9 cards. Digit accept is index-based.  
**Impact:** Keyboard skip of late trade cards. Mouse Accept still works.  
**Status:** open — contract §12.2; do not cut to one slot.

### Passed Checks

- [x] No new `WORLD_FIELDS` / no new `localStorage` key
- [x] Hyphen-token ids; `RESERVED_IDS` on full id and every token; `trade-__proto__-0` dropped
- [x] Unique four exact allowlist kept
- [x] Trade `need` must be integer 5 or drop (no heal)
- [x] `payQuoted` clamp 0…20000 on sanitize and at pay
- [x] Pay dest rebinds `otherSystemId(origin)`; stuffed `destSystem` cannot retarget
- [x] Accept origin-dock only; unique haul either-dock untouched
- [x] Commodity allowlist: bulk `COMMODITIES` except `livingRock`; no survivor/data/restricted
- [x] Employer rep: `SYSTEMS[origin].faction` + `Object.hasOwn(FACTIONS)`; no `job.faction`; no patrol `freehold +=`
- [x] `failed` before pay; expire has no pay/rep branch; replace uses a new object
- [x] No `innerHTML` in `station.js`; titles regen via `h()` / `textContent`
- [x] No `state.js` write; no frozen `ctx.js` event
- [x] Walk `Object.keys` / index `for` on save jobs; fresh `{}` literals

### Recommendations

1. Keep WAVE76 restore pins as the dest-injection and proto regression gate.
2. Do not copy unique-haul dest `jobPayFor` onto trade.

### Pass 2

Re-read sanitize, accept, tick, and WAVE76 pin results after boot. No new HIGH/CRITICAL. MEDIUM accepted-over-cap and LOW Digit overflow stay documented.
