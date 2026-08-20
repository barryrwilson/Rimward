# Code Review: Wave 68 PR2 hangar mutator + stock racks

**Scope:** `src/game/hangar.js`, `src/game/shipyard.js`, `out/w68/pr2/probe.mjs`.
**Pass:** 1 (post-impl). Probe: `node out/w68/pr2/probe.mjs` → PASS.

## Code Review: writeMountedGear / spendMissileAmmo / stock racks

### Summary
The mutator matches sanitize heal law. Launcher applies first, then ammo, then turret. Empty rack zeros ammo. Stock rows seed empty racks. Probe pins 1–12 are true. No blocker or major.

### What's done well
- `healLauncher` / `healTurret` / `healMissileAmmo` stay the one law. Light cannot keep `dart`.
- Same-patch order: launcher (and re-heal of parked ammo) then `patch.missileAmmo`.
- `spendMissileAmmo` writes row and world together, clamps to 0, adds no heat.
- `buildStockRow` names empty racks on the raw object before sanitize.
- Buy still parks, appends, and restores `mountedId`. Beautiful / Unknowables stock is unchanged.

### Findings

#### 💡 Suggestion: `if (ctx.world)` in spend is redundant
**Location:** `src/game/hangar.js` 445
**Issue:** `mountedHangarRow` already returned a row, so `ctx.world` exists.
**Fix:** Assign `ctx.world.missileAmmo` directly.
**Status:** open
**Justification:** Guard is cheap and matches nearby optional-world style.

#### 💡 Suggestion: probe extra turret pin is outside the numbered set
**Location:** `out/w68/pr2/probe.mjs` turret.auto / turret.light
**Issue:** Extra pins are useful. They are not numbered 1–12.
**Fix:** Keep them. They do not replace the acceptance list.
**Status:** open
**Justification:** Extra coverage is allowed.

### Findings by severity
- 🔴 **Blocker** — none
- 🟠 **Major** — none
- 🟡 **Minor** — none
- 💡 **Suggestion** — redundant world guard; extra turret pins
