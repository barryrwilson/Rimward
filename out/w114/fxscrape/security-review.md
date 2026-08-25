# Security Review: FX scrape PR1 spawnHitFx (Wave 114)

### Risk Level: Low

### Summary

PR1 calls live `spawnHitFx` on the damaging `bodyHit` applyHit path. No DOM, no new persist key, no Digit, no `state.js` write, no user shaders from save. Fail-closed try/catch skips world FX only. No CRITICAL or HIGH.

Persona: orchestrator `security-review.md` + bundled security-auditor. Self-applied (no subagent spawn tool in this worker).

Mode: Deep audit of the scrape call site and nearby combat FX helpers. Trust boundaries: `ctx.events` bodyHit, save/settings, canvas maps, HUD toast consume.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Console-injected `bodyHit` can still applyHit and now spawn world FX

**Location:** `src/systems/combat.js` 1843–1869; `ctx.emit` is local.

**Issue:** A console poke that emits `{ type: 'bodyHit', kind: 'station', speed: 999 }` already one-shots the local player (pre-existing). PR1 now also calls `spawnHitFx`. Spawn size does **not** use `e.damage`. Family is the literal `'impact'`. Pools stay fixed (ripple 16, marks 12). Busy pool skips inside helpers.

**Impact:** Local-client availability hitch only if every pool slot were live and a later serial allocated per hit. This PR does not alloc a bag per scrape.

**Fix:** Do not trust `e.damage` for spawn size (honored). Do not `eval` event fields (honored). Honor `IMPACT_MIN_SPEED` / `IMPACT_GAP` (honored).

**Status:** documented; same local-client class as Wave 113. Not a network issue.

#### 🟢 LOW: User shader / GLSL from save still forbidden and unused

**Location:** live maps at combat init (`makeGlowDot` / `makeRippleRing` / `makeScorchDot`); scrape call `combat.js` 1858–1860.

**Issue:** PR1 does not read settings or save for materials. No `ShaderMaterial`, `onBeforeCompile`, or GLSL string. Residual: a later PR could still load a user map.

**Status:** accepted residual. This PR does not open the surface.

#### 🟢 LOW: Proto merge on host pose still unused

**Location:** `spawnRipple` numeric pose copy (1079–1081); scrape passes live `playerObj`.

**Issue:** Scrape does not `for-in` or `Object.assign` a save blob onto a Three object. Residual remains if a later serial invents a saved contact pose.

**Status:** accepted residual.

### Passed Checks

- [x] No secrets in scrape / combat paths touched
- [x] No `innerHTML` in `combat.js`
- [x] No `WEAPONS.impact` in `state.js`
- [x] No new `WORLD_FIELDS` / persist key
- [x] No user shader from save
- [x] Prototype-safe: no `for-in` merge from save into sprites
- [x] Fail closed: missing host / non-finite pos / helper throw skip FX only
- [x] Do not trust `e.damage` for spawn size
- [x] Busy pool does not wait
- [x] Sun-heat / sunKill still have no `spawnHitFx`

### Recommendations

1. Keep scrape on the existing applyHit loop. Do not grow `bodyHit` with user strings.
2. Keep family `'impact'` fail-closed in `applyHit` / `FAMILY_COLORS`.
