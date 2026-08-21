# Current exploration / jobs / EXP inventory (code wins)

**Wave:** 77. Design only.  
**Status:** LIVE CODE inventory for Initiative MSN, family **MSN-02 exploration and information recovery**. If a comment, wishlist line, or this file disagrees with `src/`, **code wins**.  
**Not this wave:** any edit under `src/`.

Cites are `file:line` at inventory time (2026-08-20). Re-read those lines before an implementation PR.

Wave 70 inventory (`out/w70/msn/current-mission-inventory.md`) and Wave 75 trade inventory (`out/w75/msn02/current-mission-trade-inventory.md`) are **stale** on line numbers. Wave 71 shipped mining. Wave 74 shipped EXP persist + Archive desk (no UU). Wave 76 shipped renewable trade and raised the sanitize cap to **420**. This file re-reads live code.

---

## 0. Scope of this inventory

Wishlist MSN-02 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 549–560) lists eight families. Mining shipped Wave 71. Trade shipped Wave 76. This inventory records **what the board, persist, mystery, landmarks, and EXP data-trade actually are today** so the next serial can add renewable **explore** without inventing hunt, passenger, espionage, or faction-war numbers, and without granting data cargo.

Closed / later (do not reopen here):

| Neighbour | Freeze | Cite |
|---|---|---|
| MSN mining (Wave 71) | Closed. Two mining slots per system. Keep. | `station.js` `MINING_SLOTS_PER_SYSTEM` 189; `syncMiningJobs` |
| MSN trade (Wave 76) | Closed. Two trade slots per system. Cap 420. Keep. | `TRADE_SLOTS_PER_SYSTEM` 190; `syncTradeJobs` 2077–2099; `save.js` 115–122 |
| Unique four | Do **not** migrate or delete | `makeJobs` 1724–1756; boot-test Wave 76 pins |
| POD-02 | Closed. No `survivor` on jobs | `holdUnits` 962–965 |
| EXP data (Wave 74) | Closed first slice. Hangar rows. No job cargo. Desk UU unset. Drop % unset | `data-trade.js` 5–23, 114–125; `station.js` 1098–1105, 1179–1228; `priceOf` 1689–1693 |
| BIO grafts | Closed. Do not seed `livingRock` as explore cargo | `COMMODITIES.livingRock` `state.js` 313 |
| SHP yards | Closed. Jobs must not grant hulls. Digit 0 = shipyard | `DOCK_KEY_SERVICES` 152; labels 3424 |
| AST rock identity | Rocks are `id === index`. **No** `asteroidId` on jobs | mining jobs omit it |
| HUD-02 | Closed. No HUD glance for jobs. Chart marks are Wave 15 readers | `hud.js` 24–30, 1332–1432 |
| TGT-05 | Closed. Jobs do not write `ctx.targets` | `ctx.js` 169–171 |
| REP-04 | Espionage / faction-war **later** | wishlist |
| Hunt / passenger | Sibling Wave 77 workers. Do not number here | owner freeze |
| NPC hub routes | Wave 22 lore: NPC traders **never** hub-route | `world.js` 24–27 |
| Unknowables dock | **No system.** Wave 42 content hole | `Object.keys(SYSTEMS)` has 0 `faction === 'unknowables'`; `FACTIONS.unknowables` exists `state.js` 563 |

There is **no** `kind: 'explore'`. There is **no** renewable information-recovery family.

---

## 1. Who owns jobs

| Object | Writer | Reader | Cite |
|---|---|---|---|
| `ctx.world.jobs` | `station.js`: `ensureJobs` / `makeJobs` / pirate+recovery+**mining**+**trade** sync / `acceptJob` / `completeJob` / `replaceMiningJob` / `replaceTradeJob` / ticks | station board UI, `tickPatrolJob`, `tickDeliveryJobs`, `tickRecoveryCollect` | 1724–2143; 2202–2418; 2746–2832; 3627–3631 |
| Create-if-empty | `ensureJobs`: if not array → `[]`; if `length === 0` → `makeJobs(ctx)` | `initStation` | 1759–1761; 2434 |
| Persist | `WORLD_FIELDS` includes `'jobs'` | snapshot copies listed fields | `save.js` 75–79, 556 |
| Sanitize | **`sanitizeJobs`** from `sanitizeRestored` | restore | `save.js` 407–447, 711 |
| Autosave key | `KEY = 'rimward-save-v1'` | load/save | `save.js` 15, 65 |
| `ctx.js` default | **No `jobs` key.** Station creates it | — | `ctx.js` 125–149 (no jobs) |
| Frozen events | None named `job*`. Completions emit `'commLine' { text }` | hud | `ctx.js` 198–228; `completeJob` 2202–2205 |

There is no `src/systems/jobs.js`. The Jobs **service** is Digit **2** on the dock (`DOCK_KEY_SERVICES[1] === 'jobs'`).

---

## 2. Board UI (Jobs service)

| Surface | Live | Cite |
|---|---|---|
| Dock key | Index 1, Digit **2**, label `Jobs board` | `station.js` 152, 3424–3427 |
| Overlay helper | `h()` always `textContent`. **No `innerHTML` in `station.js`.** | 2489–2494; grep `innerHTML` = 0 matches |
| Render | `renderJobs` rebuilds cards each open | 2822–2954 |
| Sync on render | `refreshBountyJob`, `syncPirateBounties`, `syncRecoveryJob`, `syncMiningJobs`, **`syncTradeJobs`** | 2828–2832 |
| Visible set | `boardJobs(ctx, currentId)` | 2132–2142 |
| Card fields | title, detail, reward line, state line or Accept button | 2834–2952 |
| Accept click | `btn(..., () => acceptJob(job))` | 2909 |
| Accept digit | `boardJobs(...)[n - 1]` if `state === 'offered'` | 3548–3550 |
| Digit 0 | Shipyard on the **level-1** menu (`hot === 0` for last service). Jobs pane Digit 0 indexes `-1` → no-op | 3426; 3548–3550 |
| Max digit | 1–9. Cards past index 8 cannot be accepted by key. Mouse Accept still works | 3546–3550 |
| States shown | `offered` → Accept; `accepted` → `ACCEPTED …`; else → `DONE` | 2908–2952 |
| Mining/trade deadline UI | remaining seconds/minutes | `miningTimeLeftLabel` 1981–1989; 2910–2945 |
| Failed state | Sanitize allowlist includes `failed`. Mining/trade tick splices `failed` and replaces | `JOB_STATES` `save.js` 128; `tickDeliveryJobs` 2252–2347 |

`boardJobs` filters (`station.js` 2132–2142):

- Offered pirate bounties (`id` starts `bounty-pirate-`) hide unless `j.system === sysId`.
- Offered recovery hides unless `j.originSystem === sysId`.
- Offered **mining** hides unless `j.originSystem === sysId`.
- Offered **trade** hides unless `j.originSystem === sysId`.
- **Everything else is listed**, including `state === 'done'` unique cards and accepted jobs.

There is **no** `kind === 'explore'` filter. There is **no** renewable explore family.

Home board can already exceed 9 cards (unique four + overlays + 2 mining + 2 trade). Digit overflow is existing UX.

---

## 3. `makeJobs` / `ensureJobs` — four unique cards (never replaced)

`makeJobs` (`station.js` 1724–1756) returns a **fixed** array of four objects. `ensureJobs` (1759–1761) runs this **only when `world.jobs` is empty**. Completing all four does **not** refill the board. Mining fill is `syncMiningJobs`. Trade fill is `syncTradeJobs`.

| `id` | `kind` | Role | Reward / need (live constants) |
|---|---|---|---|
| `bounty-ace` | `bounty` | Named ace (default Carver Illyx) | `ace.bounty` else `DEFAULT_ACE_BOUNTY` 2500 (185–186, 1730–1735) |
| `patrol-lane` | `patrol` | Kill/drive off pirates | `PATROL_REWARD` 300, `PATROL_NEED` 2, `PATROL_REP` 5 (169–171) |
| `haul-provisions` | `haul` | Buy+deliver Provisions across primary gate | `HAUL_UNITS` 5, `HAUL_MARGIN` 1.4 (172–173). `reward: 0` until quote |
| `ferry-consignment` | `ferry` | Fronted Provisions, no buy-in | `FERRY_UNITS` 4, `FERRY_REWARD` 350 (174–175) |

**Boot tests pin those ids.** Wave 26 ferry/haul and Wave 35 haul named-dest pins must not be “fixed” by this brief. First explore serial **must not rename or delete** the unique four.

Known boot FAILs stay: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul (`scripts/boot-test.mjs` WAVE4 / WAVE26 / WAVE35 `console.log` FAIL strings).

---

## 4. Live-synced overlays (not this family)

### 4.1 Pirate bounties

`syncPirateBounties`: up to `PIRATE_BOUNTY_CAP` **2** cards (`station.js` 187). Id `bounty-pirate-…`. This is MSN-02 “hunting a local pirate” **in part**. Sibling hunt worker. **Not this explore serial.**

### 4.2 Recovery (salvage overlay, not MSN-02 explore)

`syncRecoveryJob` (`station.js` 1845–1855):

- One offered recovery at a time for an in-system wreck.
- Id `` `recovery-${a.id}` ``.
- `WRECK_TTL = 600` world seconds (`world.js` 811). Mining/trade cite the same number as `MINING_DEADLINE` 600 (`station.js` 192–193) and **do not import** `world.js`.
- Reward `RECOVERY_REWARD` 300 (176).
- Pay on redock at `originSystem` with `collected`.

**Do not reuse `kind: 'recovery'`** for landmark surveys. Recovery requires `wreckId`.

### 4.3 Ace refresh

`refreshBountyJob` retargets `bounty-ace`. Not this serial.

---

## 5. Mining slots (Wave 71 — keep)

| Law | Live | Cite |
|---|---|---|
| Slots | `MINING_SLOTS_PER_SYSTEM = 2` | 189 |
| Kind | `'mining'` | `makeMiningJob` 1905 |
| Id | `mine-<sysId>-<n>` | `nextMiningId` 1870 |
| Fill | `syncMiningJobs` on `renderJobs` | 1919–1940, 2831 |
| Replace | splice + push same `originSystem` + `slot` | `replaceMiningJob` 1958 |
| Complete | **not** `completeJob`; set `failed` then pay then replace | 2280–2296 |
| Expire | `world.time >= deadline` → fail closed, replace | 2258–2269 |
| Deadline | 600 s from post; **restart** on accept | 193, 2778 |
| Need | `FERRY_UNITS` **4** | `makeMiningJob` 1902 |
| Pay | `jobPayFor` at **origin**; `HAUL_MARGIN` × `priceOf` × need; stamp `payQuoted` on accept | 1888–1892; accept 2777; tick 2283–2286 |
| Clamp | `PAY_QUOTED_MAX` 20000 | 196; `clampJobPay` 1858–1862 |
| Rep | `MINING_REP` **+2** to `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS, faction)` | 191, 2288–2290 |
| `asteroidId` | **absent** | make mining job |

Honest mining must **never** be dropped to make room for explore.

---

## 6. Trade slots (Wave 76 — keep)

| Law | Live | Cite |
|---|---|---|
| Slots | `TRADE_SLOTS_PER_SYSTEM = 2` | 190 |
| Kind | `'trade'` | `makeTradeJob` 2062 |
| Id | `trade-<sysId>-<n>` | `nextTradeId` 2009–2027 |
| Fill | `syncTradeJobs` on `renderJobs` | 2077–2099, 2832 |
| Dest | `otherSystemId(origin)`; skip post if dest === origin | `tradeDestId` 2034–2038; `otherSystemId` 1711–1713 |
| Commodity | bulk minus `livingRock`: seed `provisions` / `refinedMetals` / `rawOre` | `TRADE_SEED` 197; `isTradeCommodity` 1997–2003 |
| Need | `HAUL_UNITS` **5** | 172; sanitize `TRADE_NEED` `save.js` 124, 281 |
| Pay | origin `jobPayFor`; stamp `payQuoted` | 2805–2807; tick 2332–2335 |
| Dest bind at pay | **rebind** `otherSystemId`; stuffed `job.destSystem` ignored | 2323–2324 |
| Rep | +2 employer | 2337–2339 |
| Board | offered trade home only | 2139 |

Honest trade must **never** be dropped to make room for explore.

**There is no `kind === 'explore'` branch** in `acceptJob` (2746–2808) or `tickDeliveryJobs` (2245–2418).

---

## 7. Accept / complete / tick (load-bearing)

### 7.1 `acceptJob` (2746–2820)

| Kind | On accept |
|---|---|
| `ferry` | Front cargo. Stamp dest/`payQuoted` via **dest** `jobPayFor`. |
| `recovery` | Spawn pod at wreck. |
| `mining` | Stamp `payQuoted` via **origin** `jobPayFor`. Restart `deadline = world.time + 600`. |
| `trade` | Refuse if not origin dock. Stamp dest via `otherSystemId`. Origin `payQuoted`. Restart deadline. |
| `haul` | After state flip: stamp origin + dest `jobPayFor` (`otherSystemId`) |
| all that pass | `state = 'accepted'` |

**There is no `kind === 'explore'` branch.**

### 7.2 `completeJob` (2202–2205)

- Sets `state = 'done'`. **Does not splice. Does not post a replacement.**
- Then `rewardJobContacts`.
- Optional `'commLine'`.

Unique haul/ferry still use this path. Mining and trade do **not**.

### 7.3 `tickPatrolJob` (2224–2241)

On need met: **`ctx.world.reputation.freehold += PATROL_REP`** (2233). Explore must not copy it.

### 7.4 `tickDeliveryJobs` (2245–2418), cadence 0.5 s (3631)

| Kind | Pay dock | After pay |
|---|---|---|
| mining | `currentSystem === origin` | splice + replace |
| trade | named dest = `otherSystemId(origin)` | splice + replace |
| bounty | witnessed kill | `completeJob` → `done` |
| haul | named dest = `otherSystemId(origin)` (Wave 35, 2373–2385) | `completeJob` → `done` |
| ferry | stamped `job.destSystem` only | `completeJob` → `done` |
| recovery | `originSystem` + `collected` | `completeJob` → `done` |

**Do not change unique-haul Wave 35 / Wave 26 paths.**

`jobPayFor` (2151–2153): epic `jobPayMult` for `ctx.systems[sysId].faction`.

---

## 8. Persist / sanitize (Wave 76 live)

| Surface | Live | Cite |
|---|---|---|
| `JOBS_SANITIZE_MAX` | `4 + 2*N + 2*N + 16` = **`4 + 4 * N_SYSTEMS + 16`** | `save.js` 115–122 |
| N at inventory | `Object.keys(SYSTEMS).length` **100** | `state.js` 541; node count 2026-08-20 |
| Cap at 100 | **420** | comment 118 |
| `JOB_KINDS` | `bounty` `patrol` `haul` `ferry` `recovery` `mining` `trade` | 127 |
| Unique allowlist | exact four ids | 129–134 |
| Hyphen tokens | `jobIdTokens`; **not** whole-string `SAFE_ID` | 101, 197–208 |
| `RESERVED_IDS` | `__proto__` and friends | 106–110, 192–195 |
| Trade need | must equal **5** or drop | 124, 281 |
| Trade commodity | `COMMODITIES` + `bulk` + not `livingRock` | 306–314 |
| `JOB_FIELD_ALLOW` | no `faction`; includes `commodity` `destSystem` `slot` `deadline` | 135–139 |
| Cap drop | extra mining, extra trade, done/failed mining|trade, done pirate/recovery, foreign offered overlays | 422–445 |
| Reputation heal | `Object.hasOwn(FACTIONS, key)`; skip reserved | 519–538 |
| `PAY_QUOTED_MAX` | 20000 | 123 |

**Explore is not on `JOB_KINDS`.** A stuffed `kind: 'explore'` row **drops** today.

A cap of **420** cannot hold two extra explore slots per system (200 rows) on top of mining+trade. Impl must grow cap by **explore room only**.

---

## 9. Mystery / landmarks / §25

| Surface | Live | Cite |
|---|---|---|
| Module | `src/game/mystery.js` exists | file |
| Record create | `ctx.world.mystery ??= { found: [], visited: [] }` | `mystery.js` 44, 54 |
| Clue radius | 35 u | 37 |
| Landmark radius | 100 u | 38 |
| Clue persist | `mystery.found.push(c.id)` | 107–114 |
| Landmark persist | `mystery.visited.push(l.id)` | 120–128 |
| Events | `'clueFound' {id,line}`; `'landmarkFound' {id,name,line}`; also `'commLine'` | 113–128; `ctx.js` 208 |
| Chart marks | `mystery.charted` array of landmark ids (Wave 14) | `contacts.js` `keeperChartMark` 387–402 |
| Chart notes | `{ lmName, systemName }` only | `chartedMarkNotes` 414–426 |
| HUD labels | `s.lmName` + distance; **§25 never a clue** | `hud.js` 29–30, 1348–1349, 1421–1432 |
| Galaxy chart | system names / gates; **never** clue id/text or landmark discovery | `galaxychart.js` 14–19 |
| Landmarks scene | dim by `mystery.visited` / `found` | `landmarks.js` 59–79, 132–156 |
| Authored shape | `{ id, name, kind, position, line }` | `authored-systems.js` 21–22, 56–58 (The Shepherd) |
| Generated shape | same; e.g. Hearth / The Hearth Cart | `galaxy.generated.js` 16–26 |
| SYSTEMS merge | authored then generated | `state.js` 541 |
| Landmark coverage | **100 / 100** systems have ≥1 named landmark | node inventory 2026-08-20 |
| Unknowables systems | **0** | node inventory |
| Assembly docks | `as_census`, `as_archive` | generated galaxy + `DETAIL_STATIONS.assembly` `station.js` 503–514 |

**§25 player copy:** landmark **display names** and system **display names** are OK. Clue **text**, clue **id**, and internal mystery keys are **not** OK in UI. Inventory may cite internal ids (`fh_shepherd`) as bind keys. Jobs UI must not print them.

Wave 14 precedent: keeper line names the landmark and its system, never the clue (`contacts.js` 380–400).

Discovery is permanent per id. Jobs must **read** `visited`, not rewrite mystery.

---

## 10. EXP data-trade (Wave 74 — hangar rows, not jobs)

| Surface | Live | Cite |
|---|---|---|
| Tokens | `dataCrystal`, `dataCube` — **not** `COMMODITIES` | `data-trade.js` 5–11 |
| Provenance | `legal` \| `captured` \| `stolen` + `originFaction` `unknowables` \| `assembly` | 13–14, 72–85 |
| Drop rate | `DATA_DROP_RATE = null` → `hasDataDropRate()` false | 23, 114–116 |
| Spawn | `spawnDataPod` returns `null`; `maybeSpawnDataFromWreck` no-op | 119–125 |
| Sanitize cargo | data rows keep `commodity,units,source,originFaction` only | 72–85 |
| `priceOf` | data keys **0** even if `world.prices` stuffed | `station.js` 1689–1693 |
| Archive UU | `ARCHIVE_UU = null`; `archiveUuSet()` false | 1098–1101 |
| Desk gate | `faction === 'assembly' && Object.hasOwn(DETAIL_STATIONS, 'assembly')` | 1103–1104 |
| Desk render | Market pane only; Confirm does **not** debit/flip while UU unset | 1179–1228 |
| Assembly docks | live | `DETAIL_STATIONS` 510; systems `as_census` / `as_archive` |
| Unknowables desk | **none** (no system) | inventory §0 |

Trade sanitize already **drops** `commodity: 'dataCrystal'` on trade jobs (`save.js` 312–314; boot-test Wave 76). Explore must not seed those tokens as job cargo and must not grant hangar rows on complete.

---

## 11. Commodities / reputation / events

| Surface | Live | Cite |
|---|---|---|
| Bulk keys | `provisions`, `refinedMetals`, `rawOre`, `livingRock` | `state.js` 308–313 |
| `priceOf` survivor | 0 | `station.js` 1690 |
| `cargoCapacity` | 20 | `ctx.js` 109 |
| Reputation bag default | `freehold` `redledger` `veridian` `hollow` | `ctx.js` 129 |
| `FACTIONS` includes | `assembly`, `unknowables` | `state.js` 561–563 |
| Sanitize rep | known `FACTIONS` keys only | `save.js` 519–538 |
| Events | `'commLine'`, `'clueFound'`, `'landmarkFound'` already frozen | `ctx.js` 198–208 |

---

## 12. Digit 2 / overlay / ticks

| Surface | Live | Cite |
|---|---|---|
| Services | market, **jobs**, bar, … shipyard | 152 |
| Labels | `Jobs board` at index 1 → hotkey **2** | 3424–3427 |
| Digit handler jobs | accept by board index | 3548–3550 |
| Job ticks | patrol + recovery every frame; delivery **0.5 s** docked **or not** | 3627–3631 |
| `h()` | `textContent` | 2489–2494 |

---

## 13. What is missing for MSN-02 explore

- No `kind: 'explore'`.
- No explore slots, ids, or `syncExploreJobs`.
- Sanitize cap 420 has **no** explore room.
- Jobs do not read `mystery.visited`.
- Completing jobs never grants `dataCrystal` / `dataCube` (and must not start).
- Player copy on Jobs does not currently name landmarks (good: no leak yet).

First explore serial is additive: extra kind, extra sync, extra tick branch, extra cap term (`+ EXPLORE_ROOM` only).
