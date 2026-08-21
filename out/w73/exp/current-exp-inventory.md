# Current EXP inventory (Wave 73)

**Wave:** 73. Design only.  
**Rule:** Live code wins over comments, lore, and this inventory if they disagree. Re-open the cited files before an implementation wave.  
**Scope:** mystery/landmarks as knowledge, hangar-travel cargo, wreck/pod drops, Unknowables vs Assembly docks and markets, provenance on cargo rows.

This file is the source of truth for “EXP today.” The integrator brief and `shared-contract.md` must not invent fields that are not here unless they mark them **proposed, needs owner**.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/game/mystery.js` | Clue/landmark proximity discovery; persist `mystery.found` / `visited` |
| `src/systems/landmarks.js` | Meshes; rebuild on `systemLoaded`; dim on found/visited |
| `src/game/save.js` | `WORLD_FIELDS`, cargo sanitize, hangar cargo, `rimward-save-v1` |
| `src/game/pods.js` | Scoop merge, survivor rows, `spawnPod` / `spawnSurvivorPod` |
| `src/systems/npc.js` | `spillShipCargo`, `spawnShipSurvivor`, Unknowables skip crew, destroy/jettison |
| `src/game/world.js` | `traderCargo` / `LEGAL_KEYS`, aftermath wrecks (visual), traffic factions |
| `src/game/state.js` | `COMMODITIES`, `FACTIONS`, `FACTION_SERVICES`, `cargoValue` (READ-ONLY) |
| `src/game/market.js` | Per-system tables from `COMMODITY_KEYS`; `tickPrices` |
| `src/systems/station.js` | Market list, `priceOf`, `tryTrade`, `DETAIL_STATIONS`, `h()` textContent |
| `src/game/hangar.js` | Cargo travels with mounted hull row |
| `src/game/contacts.js` | Dockmaster / fence / fixer; `rumorFor`; no data-launder verb |
| `src/core/ctx.js` | Frozen events including `clueFound` / `landmarkFound` / `commLine` |
| `src/systems/hud.js` | Hold readout is `used/capacity` via `textContent` |
| `src/game/shipyard.js` | `UNKNOWABLES_STOCK` exists; no live Unknowables dock to sell it |
| `src/game/galaxy.generated.js` | Live Assembly systems; **no** Unknowables system |
| `src/game/authored-systems.js` | Authored six factions; mystery clues/landmarks |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | Initiative EXP ~806–844 (do **not** edit) |
| `docs/Pod02TraffickingDesign.md` | Provenance pattern (do **not** edit) |
| `PROGRESS.md` | Wave 42 Unknowables: no live site (do **not** edit) |

---

## 1. Mystery and landmarks (EXP-01 sources — do not replace)

Discovery is proximity, permanent per id, JSON persist. Code: `mystery.js`.

| Surface | Today | Cite |
|---|---|---|
| Record | `ctx.world.mystery ??= { found: [], visited: [] }` | `mystery.js` 44, 54 |
| Clue radius | **35** u | `mystery.js` 37 |
| Landmark radius | **100** u | `mystery.js` 38 |
| Clue fire | Push `c.id` to `found`; `clueFound` `{id,line}` + `commLine` from Echo | `mystery.js` 107–114 |
| Landmark fire | Push `l.id` to `visited`; `landmarkFound` `{id,name,line}` + `commLine` from `l.name` | `mystery.js` 120–128 |
| Permanence | `indexOf` skip; never re-fires including save/load | `mystery.js` 9–11, 109, 123 |
| Docked / jump | `update` returns; no discovery | `mystery.js` 48 |
| Echoes-3 | Third clue overall → `milestone` `echoes-3` | `mystery.js` 115–117 |
| Convergence / deepening | Flags on the **same** mystery record | `mystery.js` 62–100 |
| Persist | `WORLD_FIELDS` includes `'mystery'` | `save.js` 72–78 |
| Mesh rebuild | `systemLoaded` → dispose + build current system | `landmarks.js` 123–128 |
| Dim | `applyDim` from `visited` / `found` | `landmarks.js` 79, 88 |
| Authored kinds | wreck, beacon, monument, anomaly, clue motes | `landmarks.js` 11–15; `model-catalog.js` `LANDMARK_KINDS` |

**Not cargo.** Clue/landmark ids never become hold rows. Landmark `kind: 'wreck'` is a POI mesh, not a scoopable pod (`authored-systems.js` / `galaxy.generated.js` landmark tables).

**Conversations today:** bar rumor lines (`station.js` `renderBar` 2460–2471); People “Ask around” → `rumorFor` (`contacts.js` 199–223; `station.js` 2733–2738). Witness Rule: rumors from `ctx.world.incidents` only. Keeper ledger names unfound landmarks from `mystery.visited` (`contacts.js` header 10–16).

**Intercepted signals:** **absent.** No scanner-intercept cargo, no signal item, no extra mystery list.

**EXP-01 later:** may **read** `clueFound` / `landmarkFound` / conversation as knowledge. First cargo slice is EXP-02 items. Do not rewrite Echoes.

---

## 2. Cargo persist (ordinary vs survivor)

Live hold is `ctx.cargo` (array). Hangar copies it onto the mounted hull.

| Surface | Today | Cite |
|---|---|---|
| Ordinary row | `{ commodity, units }` | `save.js` 451–474; `pods.js` 490 |
| Survivor row | `{ commodity: 'survivor', units, faction?, source, name? }` | `pods.js` 19–21, 536–542 |
| Survivor `source` | `playerKill` \| else `other` | `save.js` 466; `pods.js` 46–47, 474–476 |
| Sanitize ordinary | **Not** `COMMODITIES`-allowlisted. Any non-empty string ≤64 chars + units | `save.js` 452–474 |
| Sanitize survivor | Reserved faction ids **drop the row**. Name `stripControlChars` cap 40 | `save.js` 104–109, 459–472 |
| Snapshot cargo | `sanitizeCargoList(ctx.cargo)` | `save.js` 497 |
| Hangar cargo | `sanitizeCargoList(own(raw, 'cargo'))` then trim to capacity | `hangar.js` 233 |
| Park / load | `packLiveHull` copies `ctx.cargo`; `loadMountedRow` restores it | `hangar.js` 593, 433–436, 674–677 |
| Live hold vs player | `player.cargo` deleted if present. Live hold is `ctx.cargo` | `hangar.js` 402–413 |
| Autosave key | **`rimward-save-v1` only** | `save.js` 64 |
| `WORLD_FIELDS` | No data / intel / crystal key | `save.js` 74–97 |

SHP law: cargo travels with the hull. EXP must ride hangar cargo, not a new world field.

**Gap:** unknown commodity strings (including `__proto__` if length-ok) persist as ordinary rows. `RESERVED_IDS` is **not** applied to ordinary `commodity`.

---

## 3. Scoop, spill, wrecks

| Surface | Today | Cite |
|---|---|---|
| Generic pod | `spawnPod(ctx, contents, position, drift?, tint?)` | `pods.js` 532–534 |
| Survivor pod | `spawnSurvivorPod` — skip empty/proto faction | `pods.js` 536–542 |
| Scoop merge | Stack on `cargoRowsMatch`. Survivors need faction+source | `pods.js` 478–513 |
| `copyCargoEntry` | Ordinary: `{commodity, units}` only. Survivor extras copied. **No other extras** | `pods.js` 489–497 |
| Jettison | `spillShipCargo` then optional crew pod | `npc.js` 1303–1306, 1379 |
| Destroy | Same spill + `spawnShipSurvivor` | `npc.js` 2130–2135 |
| Spill shape | `spawnPod(ctx, [{ commodity: entry.commodity, units }])` — **strips extra fields** | `npc.js` 1344–1357 |
| Empty hold | Spawn nothing (no fake loot) | `npc.js` 1340–1342, 2131–2133 |
| Unknowables crew | `spawnShipSurvivor` returns **null** if `faction === 'unknowables'` | `npc.js` 1313–1322 |
| Aftermath | Visual wreck mesh from `destroyed` incidents. **Does not** `spawnPod` | `world.js` 1314–1324, 1886–1890 |
| Ore pods | `asteroids.js` tinted `spawnPod` of `COMMODITIES` ore keys | `asteroids.js` 2116 |
| Wake / jobs flavor | Two units `refinedMetals` | `wakes.js` 225; `station.js` 2300 |
| NPC trader cargo | `LEGAL_KEYS` = legal **and** `bulk` COMMODITIES only | `world.js` 250, 309–319 |
| Trader faction | `def.faction`, neighbor, or `independent` | `world.js` 327–339 |
| Patrol cargo | `[]` | `world.js` 382 |

**No data crystal / cube spawn exists.** Destroying an Assembly hull spills bulk (if a trader) or nothing (patrol/miner). Unknowable hulls have no live traffic (see §5).

---

## 4. Markets and `priceOf`

| Surface | Today | Cite |
|---|---|---|
| `COMMODITIES` keys | provisions, refinedMetals, restrictedComponents, rawOre, livingRock, seven exotic ores | `state.js` 308–322 |
| Data SKUs | **Absent** | `state.js` 308–322 |
| Market list | `Object.keys(COMMODITIES)` every dock | `station.js` 2041, 2247–2262 |
| `isMarketCommodity` | `Object.hasOwn(COMMODITIES, key)` | `station.js` 953–955 |
| `tryTrade` | Refuses non-market and `'survivor'` | `station.js` 2173–2177 |
| `priceOf('survivor')` | **0** (hard pin) | `station.js` 1417–1418 |
| `priceOf` other | If not market: `ctx.world.prices[key] ?? 0` | `station.js` 1419 |
| `priceOf` market | `prices[key] ?? COMMODITIES[key].base` | `station.js` 1420 |
| `cargoValue` | `prices[c.commodity] ?? COMMODITIES[c.commodity]?.base ?? 0` | `state.js` 1092–1094 |
| Tick tables | Built from `COMMODITY_KEYS` only | `market.js` 35, 61–66 |
| Restricted | `COMMODITIES[key].legal === false` + locker/fear/rep | `station.js` 2181–2183 |
| `addCargo` | Merges ordinary keys; survivors skip merge into a faction-less row | `station.js` 1397–1405 |
| `removeCargo('survivor')` | no-op | `station.js` 1407–1408 |
| `holdUnits` | Sums **all** rows with that commodity (ignores provenance) | `station.js` 939–942 |
| UI | `h()` sets `textContent` | `station.js` 2026–2031 |
| Dock digits | Ten keys. 1 Market … 7 People … 0 Shipyard | `station.js` 132 |

**Stuffed `markets[sys].dataCrystal`:** `priceOf` and `cargoValue` would treat it as a price. Market UI would still not list it (`COMMODITY_KEYS`). Pirate tribute uses `cargoValue` (`npc.js` 1525, 1722).

POD freeze already: market cannot list survivors. EXP must not stuff `COMMODITIES` in a feature PR (`state.js` READ-ONLY).

---

## 5. Unknowables vs Assembly — who can dock today

### 5.1 Factions

| Key | Display | Cite |
|---|---|---|
| `unknowables` | Unknowables | `state.js` 563 |
| `assembly` | The Assembly | `state.js` 561 |

Both exist as `FACTIONS`. Assembly has `FACTION_SERVICES.assembly` (`repairMult` 1.1) (`state.js` 604). Unknowables have **no** `FACTION_SERVICES` row.

### 5.2 Stations / systems

| Surface | Today | Cite |
|---|---|---|
| `DETAIL_STATIONS` | 10 keys: freehold…hollow. **No `unknowables`**. **Has `assembly`** | `station.js` 473–491 |
| Unknowables mesh | Comment: “unknowables build no station at all (decision D3)” | `station.js` 473–474 |
| Live dispatch | `DETAIL_STATIONS` miss → **placeholder** station (`buildStationMesh`) | `station.js` 234–238 |
| Generated Unknowables system | **None** in `galaxy.generated.js` (94 faction tags; zero `unknowables`) | `galaxy.generated.js` faction keys |
| Authored Unknowables system | **None** | `authored-systems.js` 34–196 (freehold, veridian, redledger, three hollow) |
| Live Assembly systems | **`as_census`** (Census, band 3), **`as_archive`** (Archive, band 4) | `galaxy.generated.js` 6769–6772, 6851–6854 |
| Assembly dock | `DETAIL_STATIONS.assembly` → real Assembly station + dockmaster contact | `station.js` 487; `galaxy.generated.js` contacts arrays |
| Unknowables yard SKU | `UNKNOWABLES_STOCK = ['light']` — code ready, **no dock to open it** | `shipyard.js` 27, 39 |
| Wave 42 contract | No live site by design. Giving them a system is a **content** decision (station, market, contacts, epic) | `PROGRESS.md` 3350–3355 |

**Code wins:** you cannot buy or sell at an Unknowables dock today because no system flies that faction. Wishlist “their stations” is not live. Do not invent a system in this wave.

**Assembly docks are live.** Census and Archive can run a desk.

### 5.3 Ships in space

| Surface | Today | Cite |
|---|---|---|
| Unknowables field mesh | `buildUnknowablesField` if a spawn sets `faction === 'unknowables'` | `PROGRESS.md` 1774–1788; `npc.js` header / Wave 42 |
| Unknowables traffic | `createRecords` uses `def.faction`. No Unknowables `def` → **no Unknowables traders/patrols** | `world.js` 322–339 |
| Assembly traffic | Assembly systems spawn Assembly/neighbor/independent traders and Assembly patrols | `world.js` 327–380 |
| Unknowables skip survivors | Yes. They still run `spillShipCargo` if the hold has rows | `npc.js` 1322, 2134–2135 |

---

## 6. Contacts (launder candidates)

| Role | Where | Live id / name | Cite |
|---|---|---|---|
| fence | freehold | `contact-freehold-fence` Quiet Hollis | `contacts.js` 90–109 |
| fixer | veridian | `contact-veridian-fixer` Lias Corrow | `contacts.js` 91–108 |
| fixer | redmarch | `contact-redmarch-fixer` Six-Finger Brack | `contacts.js` 92–109 |
| dockmaster | every station including `as_census` / `as_archive` | generated names | `contacts.js` 137–149 |

Fence favor opens the **restricted locker** this visit (`station.js` 2756–2762). Fixer at `tradesRestricted` docks marks up **restrictedComponents** sales (`station.js` 2212–2224). **No launder verb. No data desk.** Do not invent a new contact id.

Bar copy names “Mara” as flavor (`station.js` 2469). That is not a roster id.

---

## 7. Events and XSS

Frozen list: `ctx.js` 197–226. Already present: `clueFound`, `landmarkFound`, `commLine`, `podSpawned`, `podCollected`, `milestone`. HUD cargo uses `textContent` (`hud.js` 1521–1524). Station `h()` uses `textContent` (`station.js` 2026–2031). `modelsbrowser.js` still uses `innerHTML` (out of EXP scope).

---

## 8. Closed siblings (do not reopen)

| Area | Why |
|---|---|
| POD trafficking | People Digit 7 Gilded transfer. Survivor keys `playerKill`/`other`. `priceOf('survivor')` 0 |
| BIO grafts | `grafted` on hangar row. Not cargo |
| SHP yards / hangar / SHP-03 | Digit 0. Cargo-with-hull already shipped |
| HUD-02 | Family from `hullKind`. Do not steal `ctx.targets` |
| AST rock ids | `id === index` |
| MSN mining slots | First family shipped. Exploration family **later** |

---

## 9. Gaps vs wishlist EXP-01…03

| Wishlist | Live |
|---|---|
| Discoverable knowledge as **valuable cargo** | Knowledge is mystery flags + voiced lines. Hold is bulk/ore/survivors |
| Data crystals / cubes | **No keys, no spawn, no desk** |
| Unknowables / Assembly sell own data at their stations | Assembly dock live; Unknowables dock **missing**. Market lists `COMMODITIES` only |
| High pay for the other faction’s data | Absent |
| Legal vs captured provenance | Survivor provenance only (`playerKill`/`other`). No `legal`/`captured`/`stolen` |
| Launder through contacts/stations | Absent |

**Honest first play without owner numbers:** only a later Assembly desk can introduce **legal Assembly cubes**. Captured drops wait on a drop-rate owner. Unknowable crystals wait on Unknowables content (dock and/or spawns) plus that rate.
