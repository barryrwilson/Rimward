## Code Review: EXP data-trade design (Wave 73)

### Summary

The brief matches live mystery, cargo, wrecks, and docks: clues are flags not cargo; hangar already carries `ctx.cargo`; Unknowables have no system; Assembly `as_census` / `as_archive` are real desks; market cannot do faction SKUs; POD already owns People + survivor keys. First-pass holes (new persist key, market SKU, buy-at-Unknowables, survivor field reuse, invented UU/%) are closed in the contract. Remaining notes are implementation cautions, not design blockers.

### What's done well

- Inventory cites `file:line` and states code wins.
- Honest about Wave 42: no Unknowables dock. Wishlist “their stations” is not live.
- Persist rides hangar cargo (SHP), not a new `WORLD_FIELDS` key.
- Dedicated desk, not `COMMODITY_KEYS` — same class as POD refusing market people.
- Provenance fields are **not** `playerKill` / victim `faction`.
- Drop rate and UU marked **proposed, needs owner**, with fail-closed defaults (skip spawn / skip debit / skip launder).
- Live fixers named from `contacts.js`; no invented ids.
- MSN exploration named as a later consumer of the row shape, without job numbers.
- TGT-05 / `ctx.targets` explicitly not stolen.
- Serial PRs put sanitize before spawn before pay.

### Findings

#### 🔴 Blocker (resolved): Treat Unknowables stations as live

**Location:** wishlist EXP-02; `PROGRESS.md` 3350–3355; `galaxy.generated.js` (zero `unknowables` faction); `station.js` 473–491  
**Issue:** `DETAIL_STATIONS` omits Unknowables. No generated/authored system flies them. `buildStationMesh` would currently fall through to a **placeholder** if a def appeared — that is not an Unknowables archive. A first impl “buy crystals at their dock” cannot run.  
**Fix applied:** Contract §0.7–0.8: Unknowables desk deferred. Assembly `as_census` / `as_archive` only. Do not invent a system.

#### 🔴 Blocker (resolved): New persist key / nested loadout

**Location:** owner freeze; `save.js` 74–97; `hangar.js` 233  
**Issue:** `world.dataIntel` would miss autosave until a `WORLD_FIELDS` edit and would dual-write with hangar cargo. Nested `loadout.data` fights SHP.  
**Fix applied:** Data is cargo on the mounted hull. Contract §0.3.

#### 🔴 Blocker (resolved): Market SKU / `state.js` commodity rows

**Location:** `station.js` 2041, 2247; owner `state.js` READ-ONLY  
**Issue:** `COMMODITIES.dataCube` lists at every dock, including Freehold, and `tryTrade` ignores origin. Two-way faction prices cannot live on one global table.  
**Fix applied:** Dedicated Archive desk. No `COMMODITIES` edit. Contract §0.6, §0.13, §2.

#### 🟠 Major (resolved): POD key collision

**Location:** `pods.js` 19–21, 454–464; `save.js` 459–472  
**Issue:** Reusing `faction` + `source: playerKill|other` would make `isSurvivorCargo` false but `holdUnits`/`copyCargoEntry` branches messy, and People sale helpers might match by accident.  
**Fix applied:** `originFaction` + `legal|captured|stolen`. No `name`. `isDataCargo` separate. People Gilded path untouched.

#### 🟠 Major (resolved): `spillShipCargo` flattening / aftermath vs pod

**Location:** `npc.js` 1354; `world.js` 1314; pods header “aftermath (world.js)” vs no `spawnPod` there  
**Issue:** Inventory shows aftermath is visual-only. Flavor landmark wrecks are POIs. Data must not spawn as survivor pods (Unknowables skip crew). Flattened spill would drop provenance.  
**Fix applied:** `spawnDataPod` sibling; skip data keys in spill; not aftermath; not landmark wrecks. Contract §3.1.

#### 🟠 Major (resolved): Invented drop % / UU / contact

**Location:** owner freeze; BIO/MSN precedent  
**Issue:** Silent 10% or `HIDDEN_MOUNTS.cost` 900 would ship fake economy. A new `contact-assembly-fixer` fights Wave 24 generated dockmasters-only.  
**Fix applied:** Defaults skip spawn / skip debit / skip flip. Fixer role at veridian/redmarch only.

#### 🟠 Major (resolved): `addCargo` / `holdUnits` ignore provenance

**Location:** `station.js` 939–1416  
**Issue:** Desk using those helpers would merge legal cubes into captured cubes and sell mixed lots.  
**Fix applied:** Contract §1.5 dedicated helpers; lots are `(commodity, source, originFaction)`.

#### 🟡 Minor (resolved): Placeholder station if content owner adds Unknowables later

**Location:** `station.js` 234–238  
**Issue:** A future Unknowables `SYSTEMS` row without `DETAIL_STATIONS.unknowables` docks at a rust placeholder and could accidentally open an Archive gate keyed only on `faction === 'unknowables'`.  
**Fix applied:** Contract §2.1–2.2: desk requires `DETAIL_STATIONS` (Assembly now; Unknowables only after a real module). Placeholder fallback is not an origin dock. Pin in PR5.

#### 🟡 Minor: `copyCargoEntry` today drops unknown extras

**Location:** `pods.js` 489–497  
**Issue:** If PR2 ships before PR1 scoop copy, captured lots scoop as ordinary `{commodity, units}` and then PR1 sanitize **drops** them (missing source).  
**Fix:** Serial order is mandatory (contract §8). PR2 depends on PR1.

#### 🟡 Minor: `holdUnits` will still sum data if someone passes the key

**Location:** `station.js` 939  
**Issue:** Market HOLD column uses `COMMODITY_KEYS` only, so it will not show crystals. A later worker might reuse `holdUnits('dataCube')` and mix lots.  
**Fix:** Desk must not call it. Documented §1.5.

#### 💡 Suggestion: Tiny `data-trade.js`

**Location:** contract §1.5  
**Issue:** `station.js` is already the POD/MSN/market owner. Archive + launder helpers should not grow it blindly.  
**Fix:** Follow `trafficking.js`. Non-blocking.

### Re-dispatch

Blockers/Majors closed in `out/w73/exp/shared-contract.md` and `docs/ExpDataTradeDesign.md`. No remaining HIGH/CRITICAL design defects. Verifier should re-open inventory cites before any impl wave.
