# Code Review: FX scrape PR1 spawnHitFx (Wave 114)

### Summary

Additive call site is correct: shielded sample before `applyHit`, `spawnHitFx` after damage emit, try/catch, park on scrape-kill, slide and sun paths stay mute. WAVE111 parent law is call-only. No Blocker or Major.

Persona: orchestrator `code-review.md` + bundled reviewer. Self-applied.

---

### What's done well

- Reuses live `spawnHitFx` XOR. No third pool.
- `IMPACT_MIN_SPEED` / `IMPACT_GAP` still gate the loop. Slide-only `bodyHit` cannot spawn.
- Shielded is sampled at `combat.js` 1851 **before** `applyHit` at 1852.
- Finite `playerObj.position` gate plus try/catch matches contract §0.1 / §2.
- Park on destroy (`1862–1867`) matches the weapon kill reclaim, with try/catch so park cannot abort the scrape loop.
- Sun path (`1874+`) still has no `spawnHitFx`.
- `spawnRipple` Wave 111 header and `fpPlayer` world-space law unchanged.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Origin pos is hull origin, not contact

**Location:** `src/systems/combat.js` 1856–1858

**Issue:** Punch sits at `playerObj.position`. PHY `bodyHit` still carries no world contact. Contract forbids a `ship.js` payload rewrite as this leftover.

**Why it matters:** A ram against a station skin may ring at the ship origin, not the skin point.

**Fix:** Leave as PR1. Contact would be a later PHY event field, which this serial must not steal.

**Status:** documented; contract explicit non-pick.

#### 💡 Suggestion: Park try/catch is scrape-only

**Location:** `src/systems/combat.js` 1862–1867 vs weapon `testPlayerHit` 1800–1803

**Issue:** Weapon kill park is not wrapped. Scrape park is wrapped to honor never-throw. Two nearby styles.

**Fix:** Optional later unify. Do not rewrite the weapon path in this leftover.

**Status:** accepted.

### Coverage

`node out/w114/fxscrape/probe.mjs` PASS. Pins: scrape `spawnHitFx`, shielded-before-applyHit, try/catch, park, no sun FX, IMPACT 8 / 0.35, pools 16 / 12, no `WEAPONS.impact`, no `innerHTML`, WAVE111 parent still present.
