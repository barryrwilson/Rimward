## Security Review: EXP data-trade design (Wave 73)

### Risk Level: Medium

### Summary

Wave 73 is markdown only. The threat model is a local browser save: prototype commodity keys, stuffed `world.prices`, XSS via item labels, provenance launder-by-heal, and market `tryTrade` on non-SKU data. First-pass HIGH holes (unknown commodity persist, `priceOf` stuffing, heal-to-legal, survivor-key collision, Unknowables fake dock) are closed in the contract. Remaining notes are implementation cautions.

### Findings

#### 🔴 CRITICAL: (none)

No network auth, no secrets, no server. Nothing in this design introduces remote code execution.

#### 🟠 HIGH (resolved): Ordinary `commodity` not allowlisted — `__proto__` persist

**Location:** `save.js` 452–474; inventory §2  
**Issue:** `sanitizeCargoRow` keeps any non-empty string ≤64 as ordinary cargo. `RESERVED_IDS` applies to survivor **faction**, not `commodity`. A save can store `"commodity":"__proto__"` (or `constructor`) on `ctx.cargo` and hangar rows. Later `holdUnits` / merge / `prices[c.commodity]` index that string.  
**Impact:** Prototype pollution if any writer does `obj[row.commodity] =`. Polluted hold survives remount.  
**Fix applied:** Contract §1.2: drop `RESERVED_IDS` and `__proto__` on commodity; ordinary rows must `Object.hasOwn(COMMODITIES, key)`; data keys exact-allowlisted; else drop.

#### 🟠 HIGH (resolved): Stuffed `priceOf` / `cargoValue` on data keys

**Location:** `station.js` 1417–1421; `state.js` 1092–1094; `npc.js` 1525, 1722  
**Issue:** `priceOf` for non-`COMMODITIES` keys returns `ctx.world.prices[key] ?? 0`. `cargoValue` prefers `prices[c.commodity]`. A hand-edited `markets[sys].dataCrystal = 1e12` would inflate pirate tribute and any naive desk that called `priceOf`. POD already pinned `survivor` at 0 for this class of bug.  
**Impact:** Infinite UU via tribute/salvage math; desk paying stuffed rates.  
**Fix applied:** Contract §0.18 / §2.3: `priceOf` and `cargoValue` return 0 for data keys. Desk reads authored constants only. Never write `prices[dataKey]`.

#### 🟠 HIGH (resolved): Missing `source` healed to legal (save-launder)

**Location:** POD pattern `save.js` 466 defaults unknown survivor source to `'other'`  
**Issue:** Copying that default for data (`source !== 'captured' ? 'legal' : …`) would turn captured cubes legal on restore.  
**Impact:** EXP-03 skipped; origin desk buys stolen lots after a reload.  
**Fix applied:** Contract §1.3: unknown/missing `source` or `originFaction` **drops the row**. Do not default to `legal`.

#### 🟠 HIGH (resolved): XSS via persist `name` / innerHTML

**Location:** survivor `name` cap 40; `modelsbrowser.js` innerHTML (out of scope); station `h()` textContent 2026–2031  
**Issue:** A data row `name: "<img onerror=…>"` printed with `innerHTML` would execute in the dock UI. Wishlist items are “named” cargo.  
**Impact:** Script in the dock document.  
**Fix applied:** Contract §1.4 / §0.11: no persist `name` on data rows. Labels are authored `"Data crystal"` / `"Data cube"`. `textContent` / `h()` only. No new frozen event payload carrying raw save strings into HTML.

#### 🟠 HIGH (resolved): Market SKU / `tryTrade` of stuffed data

**Location:** wishlist “sell at their stations”; `tryTrade` 2173; `addCargo` 1397  
**Issue:** Adding `COMMODITIES.dataCrystal` would list crystals at **every** dock and merge via `addCargo` without provenance. `holdUnits` would mix legal and captured.  
**Impact:** Provenance destroyed; Unknowables SKU appears at Freehold; illegal lots sell as bulk.  
**Fix applied:** Dedicated Archive desk. Not `COMMODITY_KEYS`. Not `tryTrade`. Dedicated add/remove/lot helpers. `state.js` READ-ONLY.

#### 🟠 HIGH (resolved): Spill flatten strips provenance / fake Unknowables dock

**Location:** `npc.js` 1354 `spawnPod({ commodity, units })`; Wave 42 no Unknowables system  
**Issue:** Putting data on NPC cargo then spilling would scoop `{commodity, units}` without `source`. A brief that said “buy at Unknowables stations” would implement against a missing dock or a placeholder station (`buildStationMesh` 234–238).  
**Impact:** All scooped data becomes untyped; workers might treat placeholder docks as origin.  
**Fix applied:** Data never rides `traderCargo`. `spawnDataPod` copies full row. `spillShipCargo` skips data keys. Unknowables desk deferred. Assembly only.

#### 🟡 MEDIUM: Launder UU unset vs free flip

**Location:** contract §5.2, §9  
**Issue:** Design forbids inventing UU. A worker might flip `source` for 0 UU “until the owner sets a price.”  
**Impact:** EXP-03 skipped for free.  
**Fix applied:** UU unset → **no debit and no flip**. Same as BIO graft / EXP desk debit freeze.

#### 🟡 MEDIUM: `sanitizeFaction` is wider than data `originFaction`

**Location:** `save.js` 435–442 (FACTIONS **or** SYSTEMS **or** SAFE_ID)  
**Issue:** Reusing `sanitizeFaction` for `originFaction` would admit `freehold` or a generated system id.  
**Impact:** Lots that no desk can legally classify.  
**Fix applied:** Contract §1.3 exact `'unknowables' | 'assembly'` plus `Object.hasOwn(FACTIONS)` plus reserved-id drop. Do not call `sanitizeFaction` for this field.

#### 🟡 MEDIUM: Desk confirm TOCTOU

**Location:** POD confirm recomputes lots (`docs/Pod02TraffickingDesign.md` 176)  
**Issue:** Arm pending, dump cargo, confirm could credit anyway.  
**Fix applied:** Contract §2.1: recompute at confirm; vanished lot refuses; RAM-only `ui.dataPending`.

#### 🟢 LOW: Local save editor sets `source: 'legal'`

**Location:** contract §5.3  
**Issue:** Single-player JSON save is player-owned. HMAC is out of scope.  
**Fix:** Allowlist only. Documented. Not a ship blocker.

#### 🟢 LOW: `modelsbrowser.js` innerHTML remains

**Location:** `modelsbrowser.js` 114, 317, …  
**Issue:** Out of EXP scope. EXP must not add data labels there via HTML concat.  
**Fix:** Do not touch the browser in EXP PRs.

### Passed Checks

- [x] No secrets in this design
- [x] No new `localStorage` key (`rimward-save-v1` only)
- [x] No `innerHTML` for EXP UI (`textContent` / `h()`)
- [x] Proto ids reserved on commodity and `originFaction`
- [x] Data keys never index `world.prices` / `markets`
- [x] Survivor / POD keys not reused
- [x] No new frozen event with unsanitized HTML payload
- [x] Reputation bag not `for…in` copied (EXP writes no rep in first impl)
- [x] Unknowables dock absence frozen (no fake station trade)
- [x] Archive desk requires `DETAIL_STATIONS` (no placeholder origin)

### Recommendations

1. PR1 sanitize + `priceOf` 0 before any spawn or desk credit.
2. Boot-test proto commodity, missing `source`, stuffed prices, Assembly-only desk gate.
3. Named data owner authors UU next to a `data-trade.js` constant map — never `HIDDEN_MOUNTS.cost` or survivor 160/240.

### Re-dispatch

HIGH items closed in `out/w73/exp/shared-contract.md` §0–§2 and §1.2–1.3. No remaining HIGH/CRITICAL in the design.
