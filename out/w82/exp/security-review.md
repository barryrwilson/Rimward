## Security Review: Wave 82 EXP economy (drop / Archive / launder)

### Risk Level: Low

### Summary
Credits and cargo mutate only on two-step confirm. Prices are authored constants. `priceOf` stays 0 for data keys. Prototype keys and missing lots fail closed. No innerHTML. No HIGH or CRITICAL finding remains after proto and unit-cap fixes.

### Findings

#### 🟢 LOW: Drop roll uses Math.random
**Location:** `src/game/data-trade.js:181-184`
**Issue:** `maybeSpawnDataFromWreck` uses `Math.random()` for the 0.20 drop.
**Impact:** A player can reroll wrecks in a local save. This is not a network economy.
**Fix:** None. Nearby wreck loot already uses `Math.random`. The brief allows that API.

#### 🟢 LOW: Confirm helpers do not re-read currentSystem
**Location:** `src/systems/station.js:1192`, `src/systems/station.js:1411`
**Issue:** `confirmArchivePending` trusts `dockFaction`. `confirmLaunderPending` trusts `systemId`.
**Impact:** A console caller can pass `assembly` or `veridian` while the ship is elsewhere. Honest UI only passes `currentDef.faction` / `currentId`.
**Fix:** Optional: require `ctx.world.currentSystem` to match a live Assembly or fixer dock. Not required for first impl.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` on Archive or launder copy
- [x] No `row.name` on data lots
- [x] `Object.hasOwn` on pending keys and fixer `role` / `system`
- [x] Reserved origin and `__proto__` drop in sanitize and spawn
- [x] `dataBusy` / `launderBusy` one in-flight apply
- [x] Hostile Assembly standing `< 0` refuses buy and sell
- [x] Hold full fails closed before debit
- [x] Credits short fails closed before cargo change
- [x] Captured Assembly cubes do not credit
- [x] Launder requires live fixer at veridian or redmarch
- [x] Launder does not call `applySurvivorSale`
- [x] `addCargo` / `removeCargo` / `tryTrade` unused on the pay path
- [x] `priceOf` / `cargoValueSafe` keep data at 0
- [x] Unit merge caps with `sanitizeUnits`

### Recommendations
1. Keep UU in `data-trade.js`. Do not read `world.prices`.
2. Do not add HMAC on `source`. Contract forbids it.

### Re-run
First pass flagged inherited `role` / pending `source` and uncapped unit merge. Those are fixed. Re-read of confirm bodies shows no remaining HIGH/CRITICAL money bug.
