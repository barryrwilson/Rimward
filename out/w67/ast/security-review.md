## Security Review: AST orbits design (Wave 67)

### Risk Level: Medium

### Summary

Wave 67 is markdown only. No `src/` ships. The persist plan (`fieldOre` + `world.time` as orbit clock) is the trust boundary. First-pass gaps (save-edited remaining units above seed; NaN `world.time` → NaN pose; `for…in` copied onto persist) are closed in merge law §6 and §0.13–15. Residual risk is single-player save tamper and an existing `pickOreType` `for…in` — not AST-critical if the impl obeys the contract.

### Findings

#### 🟠 HIGH (resolved in contract): Save-edited `fieldOre` could mint ore

**Location:** `out/w67/ast/shared-contract.md` §6.2 (after fix)  
**Issue:** Sparse remaining-unit overlay without a seed cap would let a hand-edited `64` refill a wakeglass rock (or every rock) above the seeded roll. Same class as unsanitized `miningLaser: 99` (`save.js` 310–315).  
**Impact:** Free high-tier cargo from a JSON edit.  
**Fix applied:** Apply `min(seeded, max(0, persisted))`. Persist never stores `oreKey`. Sanitize ints `0..64` then clamp again to the seed at overlay.

#### 🟠 HIGH (resolved in contract): Non-finite `world.time` NaNs every rock

**Location:** `save.js` 291–315 (no time heal today); contract §6.3 item 8  
**Issue:** AST pose is `sin/cos(omega * world.time)`. `sanitizeRestored` does not currently heal `world.time`. JSON `null` becomes a non-finite clock.  
**Impact:** NaN `position` → mining rays, PHY, camera follow, and NPC steer all fail closed into corruption.  
**Fix applied:** Heal `world.time` to `0` if not a finite number ≥ 0. Closed-form pose, not `dt` integrate.

#### 🟡 MEDIUM: Prototype pollution on persist maps

**Location:** contract §6.3  
**Issue:** Nested `{ [systemId]: { [index]: n } }` is a classic `__proto__` / `constructor` assignment surface if healed with `for…in` or raw `obj[k] =`. `pickOreType` already uses `for (const key in weights)` (`state.js` 502).  
**Impact:** In a browser, polluted `Object.prototype` can break every map walk. Unlikely from this game’s own writes; likely from a crafted save.  
**Fix applied:** `Object.keys` only; drop `RESERVED_IDS` and unknown `SYSTEMS` keys; child keys integer-in-range only; fresh `{}`; never persist `oreKey`. New AST code must not copy `for…in`. Live `pickOreType` is pre-existing; do not expand it.

#### 🟡 MEDIUM: Single-player economy / fear not in scope

**Location:** `save.js` 73–92 (`credits` already writable)  
**Issue:** A player who edits `fieldOre` downward or `credits` upward already cheats. AST must not make cheat **easier than credits** (unbounded arrays, extra localStorage, eval of ore keys).  
**Fix:** Caps (32 systems, count entries, 0..64 then seed clamp). No new storage key.

#### 🟢 LOW: XSS via belt commLine

**Location:** integrator §7  
**Issue:** Arrival copy could interpolate system/faction names. HUD commLine already uses `textContent` (`hud.js` inventory).  
**Fix:** Contract §0.12 / §7: `textContent` / existing emit. Authored sentences. No `innerHTML`. System id is allowlisted on restore (`save.js` 392–394).

#### 🟢 LOW: Determinism / RNG side channel

**Location:** `asteroids.js` 1504, 1819–1823  
**Issue:** Field layout is seeded. Pod scatter uses `Math.random` today. Orbit must not. A `Math.random` in `build` would break “same seed → same population.”  
**Fix:** Contract §0.4 and integrator §2: orbit elements from the seeded stream only; replace the five placement draws; no `Math.random` in build/orbit.

### Passed Checks

- [x] No secrets in the design (no API keys, no telemetry)
- [x] No new `localStorage` key (`rimward-save-v1` only)
- [x] No THREE / prototype objects on the save blob
- [x] Positions not persisted (cannot smuggle code in xyz)
- [x] Ore keys fail closed (`Object.hasOwn(ORE_TYPES, key)`); not taken from save
- [x] `state.js` not opened to a parallel un-reviewed table dump
- [x] World strings not specified as `innerHTML`
- [x] No new frozen event that could carry unsanitized payloads
- [x] `id === index` avoids a second identifier namespace to forge
- [x] Keep-out uses authored PHY numbers, not user geometry
- [ ] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. Implementation PR1 must land `fieldOre` sanitize + `world.time` heal + seed clamp in the same cut as overlay.
2. Boot pin a crafted snapshot: `__proto__` key, `constructor`, `asteroidId: "0"`, `remaining: 99`, `time: null` — expect heal, no throw, no extra units.
3. Do not rewrite `pickOreType` in an AST PR unless the serial owner includes it; do not copy `for…in`.

### Re-review (after HIGH fixes)

Read integrator + contract + inventory again. 🟠 items are closed in merge law §0.13–15 and §6. No remaining 🔴/🟠 in this markdown set. Open: 🟡 proto-walk discipline at impl time; 🟢 commLine/`Math.random` pins. **No `src/` diff.**
