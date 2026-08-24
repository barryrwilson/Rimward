## Code Review: Wave 94 POWER ledger

### Summary
The live pool matches heat: catalog numbers, regen next to heat cool, afterburner start/cut, psionic spend on actual spawn. Probe `out/w94/power/probe.mjs` pins constants, regen skip, HUD placement, and live fire. No Blocker or Major defects.

### What's done well
- Binding numbers are the exported `POWER` object and `WEAPONS.psionic.powerPerShot = 10`.
- Cannon / disruptor / mining / dart / turret stay without a power field.
- Regen skips only when `powerDrainThisFrame` is set (afterburner drain this frame). Psionic spend still allows regen.
- Afterburner cannot start below `afterburnerMin`. Mid-burn empty pool cuts the burn and still writes `burnerReadyAt`.
- HUD PWR bar lives in `.rw-side-col`. Aim glass is unchanged.

### Findings

#### 🟡 Minor: heat now applies only if a bolt occupies a pool slot
**Location:** `src/systems/combat.js:1147–1156`
**Issue:** `addHeat` moved inside `if (bolt)` for all `firePlayerGun` families. A full projectile pool used to charge heat with no bolt.
**Why it matters:** Rare, but it is a behavior change for cannon/disruptor as well as psionic.
**Fix:** Optional: keep `addHeat` outside `if (bolt)` for non-psionic, and keep power+heat together only for psionic. Current pairing matches “same moment the bolt spawns.”

#### 💡 Suggestion: scratch flag is not part of `createShipState`
**Location:** `src/systems/ship.js:763`, `src/game/state.js:269–274`
**Issue:** `powerDrainThisFrame` is added on drain and cleared in `tickShipState`. Combat ticks after ship while flying, so the flag clears the same frame.
**Fix:** None required. Docked combat returns early after ship already stopped the burner without setting the flag.

#### 💡 Suggestion: missing `player` mid-burn skips drain
**Location:** `src/systems/ship.js:760–770`
**Issue:** If `ctx.player` is null while `burnerActive`, drain does not run and the time cap still ends the burn.
**Fix:** None required. `ship.js` always creates `ctx.player` at init.

### Test coverage
- `out/w94/power/probe.mjs` covers catalog numbers, regen/clamp/skip, WORLD_FIELDS absence, HUD side-col + bar update, psionic spend 10, low-power dry fire, cannon heat-only, reduced-motion spend.
- Afterburner start/cut is source-pinned (full `initShip` boot is out of probe scope).

### Verdict
Approve. No High/Blocker items to fix.
