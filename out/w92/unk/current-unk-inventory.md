# Current Unknowables inventory (Wave 92)

**Wave:** 92. Design only.  
**Rule:** Live code wins over comments, lore, Wave 42 notes, and this inventory if they disagree. Re-open the cited files before an implementation wave.  
**Scope:** systems, station builders, markets, contacts, epics, EXP archive, portraits `PORTRAIT_SOURCES`, gate overlays. Unknowables live site vs dock.

This file is the source of truth for “Unknowables today.” The integrator brief and `shared-contract.md` must not invent fields that are not here unless they mark them **owner-open / fail-closed**.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/game/state.js` | `FACTIONS`, `SYSTEMS` merge, `EPICS`, `FACTION_SERVICES` / `RECOGNITION` / `RUMOR` / `COMP`, beam-only Unknowable hits |
| `src/game/authored-systems.js` | Authored six. None fly `unknowables` |
| `src/game/galaxy.generated.js` | Generated 94. None fly `unknowables` |
| `scripts/generate-galaxy.mjs` | Clusters, `EXPECTED_FACTION_TOTALS`, `LM_TONE`, `CT_TONE`, `FACTION_COLOR`. No Unknowables cluster |
| `src/systems/station.js` | `DETAIL_STATIONS` (10 keys), `buildBeautifulStation`, placeholder fallback, `DOCK_KEY_SERVICES`, Digit 0, `h()`, Archive desk |
| `src/game/model-catalog.js` | Station browser list = 10 detail + beautiful + placeholder. Ships/gates include `unknowables` |
| `src/systems/gates/index.js` | `GATE_BUILDERS` (12 keys, includes `unknowables`) |
| `src/systems/gate.js` | `attachUnknowablesFx` when `faction === 'unknowables'` |
| `src/systems/gates/unknowables.js` | Live Unknowables gate sculpt |
| `src/game/gate-scale.js` | `GATE_REBUILD_ORDER` includes `unknowables` |
| `src/systems/ship-assets.js` | `NPC_FACTIONS` includes `unknowables`; idle clip; GLB/KTX2 paths |
| `src/systems/npc.js` | GLB spawn; Unknowables skip crew; no darts; `spillShipCargo` + data drop hook |
| `src/game/world.js` | Cast factions from `def.faction` / neighbor / independent / redledger. No Unknowables inject |
| `src/game/contacts.js` | Authored 12 + generated dockmasters. No Unknowables system ids |
| `src/game/epics.js` | Advances `Object.keys(EPICS)` only |
| `src/game/portraits.js` | `PORTRAIT_SOURCES` includes `unknowables` |
| `src/game/data-trade.js` | Crystal/cube tokens, 0.20 drop, 400 own, 900 rival, 250 launder |
| `src/game/shipyard.js` | `UNKNOWABLES_STOCK` living `light`; no live dock to sell it |
| `src/game/hangar.js` | Unknowables force `hullKind: 'living'` |
| `src/game/save.js` | `WORLD_FIELDS`; spy dest skips `unknowables` employer/target |
| `src/game/trafficking.js` | Unknowables survivors not eligible |
| `src/systems/combat.js` | Unknowable fields: beam lock/hit; projectiles pass |
| `src/game/faction-style.js` | `FACTION_STYLE.unknowables`; `isUnknowable` |
| `src/systems/landmarks.js` | Generic kinds; Beautiful glaze only |
| `src/game/market.js` | Per-system `COMMODITY_KEYS` tables. No data SKU |
| `public/assets/portraits/` | `unknowables-a.webp` / `unknowables-b.webp` exist |
| `public/assets/ships/unknowables/` | GLB lods exist |
| `docs/OwnerDecisionsWave82.md` | Binding EXP UU / drop / Wait dock |
| `PROGRESS.md` | Wave 42 content hole (do **not** edit) |

Do **not** edit `src/` in Wave 92.

---

## 1. Wave 42 notes vs live code (stale comments)

Wave 42 standing notes (`PROGRESS.md` ~3863–3872) still bind as **content law**:

- Giving Unknowables a live site is a **content** decision, not a rendering one.
- No generated system flies the faction.
- Station / market / contacts / epic **none**.
- Core-is-glow must stay a real mesh if any field path remains.

Live code has moved on these **render tables**. Inventory uses code, not the old counts:

| Wave 42 note | Live code |
|---|---|
| `DETAIL_STATIONS` 8 keys | **10** keys (`station.js` 546–557). Independent + hollow joined Wave 46 |
| `OVERLAY_FACTIONS` 9 keys | Table **gone**. Successor: `GATE_BUILDERS` **12** keys (`gates/index.js` 14–27), including `independent`, `hollow`, `unknowables` |
| `npc.js` `buildUnknowablesField` / `DETAIL_SHIPS` | **Gone.** Ships load GLB via `ship-assets.js`. `NPC_FACTIONS` has all 12 banners including `unknowables` (7–10) |
| No-hull field-only | GLB + materials exist under `public/assets/ships/unknowables/` and `materials/unknowables/`. Idle clip for beautiful + unknowables (`ship-assets.js` 33) |
| Field ship appears only if spawned | Still true for **live traffic**: no `SYSTEMS` row with `faction: 'unknowables'`, so `world.js` never writes that banner on cast |

`faction-style.js` 133–139 still comments `npc.js 'unknowables-field'`. That path is stale. `isUnknowable` and style colors are live.

---

## 2. `FACTIONS` and `SYSTEMS`

### 2.1 `FACTIONS` (`state.js` 567–582)

Twelve keys: `freehold`, `redledger`, `veridian`, `hollow`, `independent`, `ferrous`, `gilded`, `beautiful`, `congregation`, `assembly`, `lamplighter`, `unknowables`.

`unknowables`: `{ name: 'Unknowables', color: 0xe8e8ff, doctrine: 0.0 }`.

### 2.2 `SYSTEMS`

`SYSTEMS = { ...AUTHORED_SYSTEMS, ...GENERATED_SYSTEMS }` (`state.js` 559).

**Authored six** (`authored-systems.js`):

| id | faction |
|---|---|
| `freehold` | `freehold` |
| `veridian` | `veridian` |
| `redmarch` | `redledger` |
| `hollowreach` | `hollow` |
| `hush` | `hollow` |
| `verge` | `hollow` |

**Generated:** `EXPECTED_FACTION_TOTALS` (`generate-galaxy.mjs` 261–265) sums to **100** authored+generated:

`freehold 20, veridian 18, ferrous 17, redledger 12, gilded 8, beautiful 3, congregation 3, assembly 2, independent 13, hollow 3, lamplighter 1`.

**`unknowables`: 0 systems.** `galaxy.generated.js` has no `"faction": "unknowables"`. Assembly live docks: `as_census`, `as_archive`.

Generator **cannot** emit an Unknowables system today:

| Table | Unknowables? | Cite |
|---|---|---|
| `CLUSTERS` | **no** cluster | `generate-galaxy.mjs` 130–257 |
| `EXPECTED_FACTION_TOTALS` | **absent** | 261–265 |
| `FACTION_COLOR` | **absent** | 74–79 |
| `PRICE_PROFILES` | **absent** | 81–92 |
| `STATION_PATTERNS` | **absent** | 94–105 |
| `LM_TONE` | **absent** | 640–956 (10 keys; no hollow, no unknowables) |
| `CT_TONE` | **absent** | 1078–1142 (same 10 keys) |

Validate fails if `LM_TONE[sys.faction]` / `CT_TONE[sys.faction]` missing (1037–1038, 1172–1173).

---

## 3. Station builders

Live dispatch `buildStationMesh` (`station.js` 300–305):

1. `isBeautiful(def.faction)` → `buildBeautifulStation` (Wave 27 Bloom).
2. Else `Object.hasOwn(DETAIL_STATIONS, def.faction)` → `buildDetailStation`.
3. Else **`buildPlaceholderStation`**.

### 3.1 `DETAIL_STATIONS` — 10 keys (`station.js` 546–557)

`freehold`, `veridian`, `ferrous`, `redledger`, `gilded`, `congregation`, `assembly`, `lamplighter`, `independent`, `hollow`.

**No `unknowables`.** **No `beautiful`** (grown path).

Comment at 530–539: unknowables build no station (D3); table carries 10 of 12 faction keys.

### 3.2 Models Browser (`model-catalog.js` 116–145)

`DETAIL_STATION_FACTIONS` = those 10. Plus `station:beautiful`. Plus `station:placeholder` via `buildStationModel('unknown_faction_key')`.

**No `station:unknowables`.** `buildStationModel('unknowables')` would hit **placeholder** (`station.js` 954–960; dispatch 300–305).

### 3.3 D3

`docs/FactionVisualUpdatePlan.md` D3: no hull; no generated system. Stations: “unknowables, who by D3 build no station at all.” Reference sheet `docs/FactionExamples/07-unknowables-station.png` exists as art; **no live sculpt**.

---

## 4. Ships (live kit, not a dock)

| Surface | Today | Cite |
|---|---|---|
| NPC factions | 12 including `unknowables` | `ship-assets.js` 7–10 |
| Classes | light, ace, cutter, heavy, frigate, freighter | 11 |
| Idle clip | beautiful **and** unknowables | 33 |
| GLB | `public/assets/ships/unknowables/{class}/lod*.glb` | disk |
| Spawn | `world.js` `createRecords` uses `def.faction` | 327–380 |
| Live Unknowables NPC | **none** (no system flies the flag) | SYSTEMS census |
| Crew pods | skip `faction === 'unknowables'` | `npc.js` 1338–1347 |
| NPC darts | Unknowable never | `npc.js` 1091–1097; Wave 82 |
| Hit | beam only | `state.js` 193–195 |
| Projectile | pass through Unknowable | `combat.js` 1511–1512 |
| Player hullKind | Unknowables force `'living'` | `hangar.js` 96–100, 417–424, 444 |
| Yard stock | living `light` only | `shipyard.js` 30, 42, 72–75 |
| Yard live sale | **no dock** so stock is dead | inventory §8 |

Wave 42 field group `'unknowables-field'` is **not** in live `npc.js`.

---

## 5. Gates / overlay

| Surface | Today | Cite |
|---|---|---|
| `GATE_BUILDERS` | 12 keys including `unknowables` | `gates/index.js` 14–27 |
| Sculpt | `unknowablesGate` ghost ring + field cells | `gates/unknowables.js` |
| FX | 4 lenses + 8 plasma cells; plasma visible while charging | `gate.js` 260–313, 411 |
| Rebuild order | includes `unknowables` | `gate-scale.js` 77–89 |
| Live overlay | only if `SYSTEMS[id].faction === 'unknowables'` | none today |
| Models Browser | `gate:unknowables` via `FACTION_ORDER` | `model-catalog.js` 45–48, 147–156 |

Stale name **`OVERLAY_FACTIONS`**: boot comment still says 9 keys excluding independent/hollow (`boot-test.mjs` 1447–1448). Live `GATE_BUILDERS` includes independent/hollow. Code wins.

---

## 6. Market

| Surface | Today | Cite |
|---|---|---|
| Tables | every `SYSTEMS` id, `COMMODITY_KEYS` | `market.js` 6–12, 35 |
| Data SKUs | **not** in `COMMODITIES` | `data-trade.js` 7–8 |
| `priceOf` data | 0 | EXP contract; Archive not market |
| Archive desk | Assembly + `DETAIL_STATIONS.assembly` only | `station.js` 1167–1168, 1343–1345, 4491 |
| Archive UU | own cube **400**; rival crystal **900** | `data-trade.js` 21–24, 187–201; desk copy 1350–1353 |
| Hostile Archive | `standingRead(assembly) < 0` → `No sale.` | `station.js` 1165–1167, 1355–1357 |
| Unknowables Archive | **absent** | `archiveDeskAllowed` is assembly-only |
| Digit 0 | shipyard (`DOCK_KEY_SERVICES` last) | `station.js` 180, 5780–5788 |
| `h()` | `textContent` | 4238–4243 |

`FACTION_SERVICES` (`state.js` 614–625): 10 keys. **No `unknowables`.** **No `hollow`** (authored-only). A generated Unknowables dock would get **no** service modifier line.

---

## 7. Contacts

| Surface | Today | Cite |
|---|---|---|
| Authored names | 9 systems / 12 contacts | `contacts.js` 90–100 |
| Generated | `SYSTEMS[id].contacts` dockmasters | 137–158; `generate-galaxy.mjs` |
| Unknowables contact | **none** | no system id |
| `FACTION_RECOGNITION` / `RUMOR` / `COMP` | 10 keys; **no unknowables**, no hollow | `state.js` 637–682 |
| `CT_TONE` | 10 keys; **no unknowables** | `generate-galaxy.mjs` 1078+ |
| Fixers | Veridian Lias Corrow; Redmarch Six-Finger Brack | `contacts.js` 91–93 |
| Traffic (POD) | Unknowables survivors ineligible | `trafficking.js` 94 |
| Spy dest | employer/target skip `unknowables` | `save.js` 267–272 |

---

## 8. Epics

`EPICS` (`state.js` 773–834) has **four** faction keys: `freehold`, `redledger`, `veridian`, `hollow`.

**No `unknowables` epic.** `epics.js` iterates `Object.keys(EPICS)` only.

Dock overlay still lists `epics` as a Digit service (`DOCK_KEY_SERVICES`). A future Unknowables station would show an empty epic pane unless a later owner authors stages. This inventory records **absence**. Do not invent stages here.

---

## 9. EXP archive (live)

| Constant | Value | Cite |
|---|---|---|
| `DATA_CRYSTAL` | Unknowables origin | `data-trade.js` 7, 16, 143–145 |
| `DATA_CUBE` | Assembly origin | 8, 16, 144 |
| `DATA_DROP_RATE` | **0.20** | 18–19 |
| `ARCHIVE_OWN_UU` | **400** | 21–22 |
| `ARCHIVE_RIVAL_UU` | **900** | 23–24 |
| `LAUNDER_UU` | **250** | 25–26 |

`archiveFilePrice` (`data-trade.js` 187–201):

- Buy: legal Assembly cube → 400. Crystal buy → null (desk: “The archive does not buy crystals.” `station.js` 1252–1254).
- Sell: legal Assembly cube → 400. Unknowable crystal any allowlisted source → 900.
- Captured Assembly cube: illegal in origin (desk refuse).

**No Unknowables origin desk.** Wave 82: Unknowables system **Wait**; later dock would pay **900** for cubes; own crystal **400** waits on that desk. Assembly already pays 900 for crystals and 400 for own cubes.

Drop: destroy/jettison of Assembly or Unknowables hulls (`maybeSpawnDataFromWreck`). Honest Unknowable crystals need Unknowable hulls. None spawn from live `SYSTEMS` today.

Third SKU: **absent**. Do not invent one.

---

## 10. Portraits

| Surface | Today | Cite |
|---|---|---|
| `PORTRAIT_SOURCES` | 10 banners including **`unknowables: '07-unknowables'`** | `portraits.js` 35–46 |
| Hollow / independent | **not** in the map → `portraitFor` null → text-only cards | 19–22, 73–74, 90–91 |
| Files | `public/assets/portraits/unknowables-a.webp` and `unknowables-b.webp` **exist** | disk |
| Variant | `'a'`/`'b'`, not persisted | 48–49, 90–91 |
| Live People/hail Unknowables face | **no contact**, so unused | contacts §7 |

Wave 41: keep `PORTRAIT_SOURCES` in lockstep with `public/assets/portraits/`. Unknowables **already lockstep**. They must **not** stay text-only if a later People card appears.

---

## 11. Persist / XSS / proto (live patterns to reuse)

| Surface | Today | Cite |
|---|---|---|
| Save key | `rimward-save-v1`; `WORLD_FIELDS` listed | `save.js` 76–100 |
| Unknowables world key | **none** | no `'unknowables'` field |
| Landmark persist | `mystery.visited` ids | `mystery.js`; `WORLD_FIELDS` `'mystery'` |
| `h()` | `textContent` | `station.js` 4238–4243 |
| Reserved ids | proto / constructor family | `data-trade.js` 28–32; hangar/save helpers |
| Digit 0 | shipyard | `station.js` 5780–5788 |

---

## 12. Wave 27 wreck / beacon / anomaly precedent

| Surface | Today | Cite |
|---|---|---|
| Kinds | wreck, beacon, monument, anomaly | `landmarks.js` 11–15; `generate-galaxy.mjs` `LM_KINDS` |
| Authored examples | `fh_shepherd` beacon; `vd_hulk_row` wreck; `vg_unfinished` anomaly | `authored-systems.js` |
| Beautiful glaze | `isBeautiful` systems only | `landmarks.js` 32–36 |
| Unknowables glaze | **none** | no `isUnknowable` branch |
| Wave 27 standing | wreck/beacon/anomaly glazes boot-tested via synthetic defs; some had no live site | `PROGRESS.md` ~3973–3974 |

A landmark on an **existing** system is the only live-site pattern that does not require a new `SYSTEMS.faction` or a station builder.

---

## 13. What a naive Unknowables **dock** would smash (not done)

If a worker set `SYSTEMS[id].faction = 'unknowables'` **and** left a `station` record:

| Table | Result |
|---|---|
| Station mesh | **placeholder** (not D3; not a sheet sculpt) |
| Gate | `GATE_BUILDERS.unknowables` + plasma FX **would** dress |
| Cast | traders/patrols/miners would fly Unknowables GLBs (`world.js` 327–380) |
| Market | ordinary `COMMODITY_KEYS` desk; **no** Archive cubes-900 |
| Yard | living `light` offers (`shipyard.js`) |
| Contacts | generator **fails** without `CT_TONE.unknowables`; authored add needs names |
| Voice | no `FACTION_RECOGNITION` / `RUMOR` / `COMP` / `SERVICES` line |
| Epic | empty |
| Portraits | would work if People cards exist |
| Digit 0 | still shipyard |
| EXP | still Assembly-only Archive unless `archiveDeskAllowed` changes |

Wave 82: **do not invent that dock** in this wave.

---

## 14. Closed vs open (inventory, not owner invention)

**Closed in live code:** faction key, style, GLB ships, gate sculpt+FX, portraits files, living-hull force, yard catalog row, EXP tokens/drop/UU at **Assembly**, skip crew/darts/spy/traffic.

**Absent on purpose:** live system, station sculpt, market/Archive origin desk, contacts, epic, generator cluster, service/voice tables, Unknowables landmark, Unknowables traffic.

**Stale:** `OVERLAY_FACTIONS` 9, `DETAIL_STATIONS` 8, `npc.js` field builder as the live ship path.
