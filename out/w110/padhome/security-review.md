# Security Review: PHY-05 pad-home PR1+PR2 (Wave 110)

### Risk Level: Low

### Summary

Persist heal rewrites `record.route[0]` to a new plain `{x,y,z}`. Role allowlist is trader/miner/patrol. `SYSTEMS` uses `Object.hasOwn`. No new persist key. No DOM. No Digit. No secrets. No freeze-in-place. No CRITICAL or HIGH.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` + orchestrator `security-review.md`. Self-applied. Mode: deep audit of save waypoints, `SYSTEMS[userString]`, persist keys, `innerHTML`, freeze, Digit theft.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Save waypoint merge remains a future footgun

**Location:** `src/game/world.js` `healPadHome` assigns `route[0] = writeStationHold({ x: 0, y: 0, z: 0 }, ...)`.

**Issue:** A later edit that `Object.assign`s or `for-in` copies a save wp would copy unexpected keys from a tampered `rimward-save-v1` blob. This serial assigns a new plain object. Probe greps no `for-in` on `wp0` / `route[0]`.

**Impact:** Prototype keys on a waypoint. Not RCE in this engine.

**Status:** mitigated in this serial. Documented, not blocking.

#### 🟢 LOW: `typeof writeStationHold` is static-import dead code

**Location:** `src/game/world.js` `healPadHome`.

**Issue:** The helper is a module import. The guard never fires unless the binding is stubbed. Fail-closed still holds: NaN / unknown system / unknown role skip and never set `speed = 0`.

**Status:** accepted. Keep the guard.

#### 🟢 LOW: Digit / hub theft if a later serial ignores MERGE LAW

**Location:** this serial did not edit `station.js` / `hud.js`. WAVE110 pins `digit0Shipyard`, `digit8Digit9`, `hubEmpty`.

**Status:** residual. Not live in this diff.

### Passed Checks

- [x] No secrets in code
- [x] No new `WORLD_FIELDS` key (`padHome` absent)
- [x] `Object.hasOwn(SYSTEMS, sysId)` before index
- [x] Role allowlist; unknown role skip
- [x] New `{x,y,z}` assign; no `for-in` merge from save wp
- [x] `innerHTML` = 0 on `world.js`
- [x] Never `speed = 0`; never freeze hulls
- [x] No Digit 0/8/9 steal
- [x] `state.js` unread-write (import only)

### Recommendations

1. Keep persist rewrite as a new `{x,y,z}` only.
2. Do not add `world.padHome`.
