# Security Review: PHY-05 remaining pad-home brief (Wave 109)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is persist heal of patrol `record.route[0]` onto existing arrays, reuse of `writeStationHold` / `healPadHome`, no DOM, no new persist key, no Digit, no `state.js` write, no navmesh, never freeze hulls. XSS, proto-from-save, persist-world, and Digit theft stay contract-frozen. No CRITICAL or HIGH. Re-review after pin-cite fix: WAVE58 patrol clone is `out/w58` probes, not `boot-test.mjs`. No new trust boundary.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` + orchestrator `security-review.md`. Self-applied (no spawn tool in this worker). No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial (save `WORLD_FIELDS`, route objects from `localStorage`, HUD/Digit). This wave ships no JS.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could `for-in` / `Object.assign` a save waypoint

**Location:** live `healPadHome` `world.js` 724 assigns `route[0] = writeStationHold({ x: 0, y: 0, z: 0 }, ...)`; `save.js` 76–101 `recordBanks`; contract `out/w109/padhome/shared-contract.md` §0.6–0.7, §4.

**Issue:** This wave does not ship JS. A later PR that mutates `route[0]` in place with `Object.assign(wp, hold)` or `for (const k in saveWp)` would copy `__proto__` / unexpected keys from a tampered `rimward-save-v1` blob into a live waypoint. Live Wave 59 already **replaces** the slot with a new plain object. Prototype pollution here is not RCE in the current engine (no `obj[kind]()` dispatch on waypoint keys). Freeze still required.

**Impact:** Unexpected inherited keys on a waypoint; possible later `for-in` in a naive printer. Not live.

**Fix (frozen):** Assign a **new** `{x,y,z}`. Never merge save keys. Role allowlist. `Object.hasOwn(SYSTEMS, sysId)` stays.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could add `world.padHome` as a persist blob

**Location:** `save.js` 76–101; contract §0.6.

**Issue:** Inventory proves rewrite can live on `record.route`. A new `WORLD_FIELDS` key would be a save-shaped object keyed by record id — a classic proto merge surface if restored with `for-in`.

**Impact:** Save bloat; proto smash if merged unsafely. Not required.

**Fix (frozen):** No new key. PR2 grep `WORLD_FIELDS`.

**Status:** mitigated in contract.

#### 🟢 LOW: Digit / SKU / hub theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.3; `station.js` 188, 6041–6046; `hud.js` 709–712.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: Freeze-in-place would be an availability bug, not a crash

**Location:** contract §0.16, §2.

**Issue:** A later “wait until hold exists” would stop NPCs when the helper is missing. Contract forbids `speed = 0` and `ai.mode = 'wait'`.

**Status:** mitigated in contract.

#### 🟢 LOW: No secrets in the write-set

**Location:** `docs/Phy05PadHomeDesign.md`; `out/w109/padhome/**`.

**Issue:** None. No API keys, no tokens.

**Status:** pass.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; no new DOM
- [x] No new `WORLD_FIELDS` key; persist rewrite on existing `record.route` only
- [x] Digit 0/8/9 steal forbidden
- [x] No `SHIP_CLASSES` pad-home fields; `state.js` READ-ONLY
- [x] New `{x,y,z}` assign; no proto-from-save merge
- [x] `SYSTEMS` via `Object.hasOwn`
- [x] Role allowlist; unknown skip
- [x] No UU / SKU
- [x] Fail closed never freeze hulls (availability)
- [x] No `planApPath` / navmesh
- [x] PHY-04 `applyAvoidBias` not in this leftover

### Recommendations

1. Later PR1: call `writeStationHold`; assign new plain wp0; extend `holdClassFor` before adding patrol to the role gate.
2. Later PR1: do not `Object.assign` save waypoints; do not `for-in` route objects.
3. Later PR2: grep `WORLD_FIELDS` for padHome/holds, `state.js` diff empty, `innerHTML` 0 on touched files, no Digit bind, no `.rw-reticle` child.
4. Do not log player names beside hold coords.
5. Do not persist `minerHoldFromStation` scratch (could grow hidden keys if copied from `live`).
