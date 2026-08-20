# Security Review: Wave 66 PR2 trafficking mutator

**Scope:** `src/game/trafficking.js`, `out/w66/pr2/probe.mjs`
**Mode:** Deep audit (prototype-key reputation writes, double-sale, credits TOCTOU, Unknowables, XSS via `name`).
**Pass:** final (no HIGH/CRITICAL to fix).

### Risk Level: Low

### Summary
Sale is fail-closed. Buyer is the `dockFaction` argument (`=== 'gilded'`). Prices come from frozen tables. Reserved faction ids cannot become eligible or write `reputation['__proto__']`. Re-entry while `saleInFlight` returns null. Success copy does not interpolate `row.name`. No `atrocity` emit. No DOM.

### Findings

#### 🟡 MEDIUM: huge `cargoCapacity` can lose integer precision
**Location:** `src/game/trafficking.js` `holdCap` 42–45, pay 162–169
**Issue:** `listed = unitPrice * lot.units` refuses only non-finite / negative. A save-minted `cargoCapacity` near `Number.MAX_VALUE` with a matching `units` can yield a non-safe integer. JS then rounds the purse.
**Impact:** Local sim only. A crafted hold can already set `world.credits`. Rescue uses the same cap rule.
**Status:** open — contract matches `survivorUnitCount`. Save-minted units are Low in the Wave 65 threat model.
**Justification:** Same class as rescue. Purse tamper is already a save edit.

#### 🟢 LOW: `reputation === Object.prototype` would write own keys on the prototype
**Location:** `src/game/trafficking.js` `canWriteRep` 70–76, `addRep` 78–81
**Issue:** Guards require a non-array object, `isFactionKey`, and `Object.hasOwn(FACTIONS, key)`. They do not reject `Object.prototype` as the bag.
**Impact:** Only if `world.reputation` is the prototype object. A normal bag write stays an own key.
**Status:** open — nearby rescue writes `bag[faction]` with a weaker check.
**Justification:** Local sim. PR3 must keep passing the live world bag.

#### 🟢 LOW: unknown `source` argument sells the `other` lot
**Location:** `src/game/trafficking.js` `normalizeSource` 38–40, `findLot` 123–129
**Issue:** `applySurvivorSale(ctx, 'freehold', '__proto__', 'gilded')` normalizes to `'other'`.
**Impact:** No prototype write. It is the same as passing `'other'`.
**Status:** open — contract treats unknown source as `other`. PR3 pending must allowlist `playerKill` \| `other`.
**Justification:** Intended normalize. Desk must not pass raw `data-*`.

#### 🟢 LOW: non-finite `fear` heals to 0 then adds the lot delta
**Location:** `src/game/trafficking.js` 176–180
**Issue:** `Number(world.fear)` that is not finite becomes 0.
**Impact:** A tampered fear string resets the meter on a successful sale.
**Status:** open — clamp still holds `0..100`. Missing fear must not throw.
**Justification:** Fail-closed for throw. Save already owns `fear`.

### Resolved this pass
1. **HIGH (design, closed in impl):** reserved ids (`__proto__`, `constructor`, `prototype`, hangar set) fail `isFactionKey`. `addRep` also requires `Object.hasOwn(FACTIONS, key)`. Probe: `protoNoSale`, `reservedFactionNoProtoRepWrite`.
2. **HIGH (design, closed in impl):** module `saleInFlight` with `finally`. Re-entry during `emit` cannot debit a second lot. Probe: `doubleApplySecondNull`.
3. **HIGH (design, closed in impl):** non-finite / missing `credits` refuse **before** `removeLotRows`. Cargo and events stay unchanged. Probe: `nonFiniteCreditsNoSale`.
4. **HIGH (design, closed in impl):** `faction === 'unknowables'` is never eligible. Probe: `unknowablesNoSale`.
5. **HIGH (design, closed in impl):** success line uses `{n}` and `{total}` only. Probe: `xssNameNotInLine`. No `innerHTML`. No `row.name` in events.

### Passed checks
- [x] No secrets in the mutator / probe
- [x] No `innerHTML` / `eval` / DOM
- [x] No `reputation['__proto__']` write path
- [x] Buyer is `dockFaction === 'gilded'` only
- [x] Mounted `ctx.cargo` only; hangar parked rows ignored
- [x] Frozen `TRAFFIC_*` tables; `world.prices` unused
- [x] Credits refuse before remove
- [x] Busy flag + finally
- [x] Unknowables / proto / oversize / empty fail closed
- [x] `repDelta` is victim-only
- [x] No `atrocity`
- [x] Copy has no forbidden UI words (slave, meat, stock, bargain, special, debug)

### Recommendations
1. PR3: arm `ui.trafficPending` with `{ faction, source }` allowlist only. Pass live `currentDef.faction` into `applySurvivorSale`. Do not read buyer from the button.
2. PR4: toast / `commLine` stay `textContent`. Do not print `row.name`.
