# Wave 121 EXP remaining Unknowables dock / Archive two-way desk — live inventory

**Wave:** 121. Markdown only. Code wins over wishlist Initiative EXP “Unknowables dock still waits,” over Wave 92 presence-first Wait, and over Wave 82/93 dock Wait.  
**Census date:** 2026-08-25.  
**Scope:** leftover **Unknowables origin dock + Archive two-way desk** after Wave 94 un-wait. Not HUD. Not NAV chart-label. Not toast. Not overlay.  
**Cite, do not rewrite:** [`docs/PLAYER-EXPERIENCE-WISHLIST.md`](../../docs/PLAYER-EXPERIENCE-WISHLIST.md) Initiative EXP / EXP-02; [`docs/UnknowablesDockDesign.md`](../../docs/UnknowablesDockDesign.md); [`docs/ExpDataTradeDesign.md`](../../docs/ExpDataTradeDesign.md); [`docs/OwnerDecisionsWave82.md`](../../docs/OwnerDecisionsWave82.md); [`docs/OwnerDecisionsWave93.md`](../../docs/OwnerDecisionsWave93.md); [`docs/OwnerDecisionsWave94.md`](../../docs/OwnerDecisionsWave94.md) §5.  
**Not this leftover:** HUD-01 hub. Digit 0/8/9 remap. Galaxy Chart labels (`galaxychart.js` is sibling Wave 121 chart-label). Toast flood. Overlay mutex. Invented UU. New Digit. `DETAIL_STATIONS.unknowables`. Generated Unknowables SYSTEM. Second Unknowables dock.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| Authored origin `veil` / The Veil / faction `unknowables`? | **Yes.** `authored-systems.js` **234–255**; `SYSTEMS.veil` via merge `state.js` **583** | **LIVE** |
| Station named The Quiet? | **Yes.** `station: { name: 'The Quiet', ... }` **243** | **LIVE** |
| Gate from hush and reverse? | **Yes.** hush gate `to: 'veil'` **175**; veil gate `to: 'hush'` **245** | **LIVE** |
| Dedicated builder (not placeholder, not `DETAIL_STATIONS`)? | **Yes.** `stations/unknowables.js` + `buildUnknowablesStation` | **LIVE** |
| `DETAIL_STATIONS.unknowables`? | **No.** Table still 10 keys (`station.js` **567–578**). D3 **not** reversed | **Honor** |
| Archive allowed at Unknowables? | **Yes.** `archiveDeskAllowed('unknowables')` iff `UNKNOWABLES_STATION_PATH === true` **1210–1214** | **LIVE** |
| Own crystal 400 at The Quiet? | **Yes.** `archivePriceAtDesk` buy/sell legal crystal **1232–1235**; `ARCHIVE_OWN_UU` **400** | **LIVE** |
| Rival cube 900 at The Quiet? | **Yes.** sell cube / assembly / any data source **1237–1238**; `ARCHIVE_RIVAL_UU` **900** | **LIVE** |
| EXP-02 two-way desk dead at Unknowables? | **No.** Buy own + sell own legal + sell rival live; confirm path `confirmArchivePending` | **Not a hole** |
| Assembly Archive still cube 400 / crystal 900? | **Yes.** `archiveFilePrice` `data-trade.js` **187–201** | **LIVE (unchanged)** |
| New persist key / `WORLD_FIELDS` desk state? | **No.** `ui.dataPending` session only | **Keep none** |
| Wishlist “dock still waits” still true vs code? | **No.** Stale sentence. Code wins | **CONSUME** |

Name: **no remaining Unknowables dock / Archive two-way leftover.** Freeze **CONSUME**. Named serial **none**.

---

## 1. Files read

| File | Why |
|---|---|
| `src/game/authored-systems.js` | `hush` gate + `th_veil`; authored `veil` / The Quiet |
| `src/systems/stations/unknowables.js` | dedicated sculpt; `UNKNOWABLES_STATION_PATH` |
| `src/systems/station.js` | dispatch, `DETAIL_STATIONS`, Archive desk, Digit map, `h()`, `innerHTML` |
| `src/game/data-trade.js` | tokens, drop, UU, Assembly `archiveFilePrice`, sanitize |
| `src/game/state.js` | `SYSTEMS` merge, `FACTIONS.unknowables`, `EPICS` omit |
| `src/game/contacts.js` | `veil` dockmaster Voice-Without |
| `src/game/model-catalog.js` | `station:unknowables` |
| `src/game/shipyard.js` | `UNKNOWABLES_STOCK = LIVING_STOCK` |
| `src/game/faction-style.js` | `isUnknowable` |
| `src/game/save.js` | `WORLD_FIELDS` (no archive key) |
| `src/systems/galaxychart.js` | authored id `veil` (cite only; sibling owns later chart-label) |
| `scripts/boot-test.mjs` | WAVE94 open-outs; `AUTHORED_IDS23` includes `veil` |
| `out/w94/unk/probe.mjs` | Wave 94 dock/Archive pins (read; do not steal write-set) |
| Honor docs | wishlist EXP; Wave 82/93/94; Wave 92 dock brief; EXP brief |

Did **not** start Vite or Chrome. Domain is **data**.

---

## 2. Wishlist vs code (stale line)

Initiative EXP (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **1441–1446**, cite only):

> first impl DONE (Wave 74… Wave 82: drop **0.20**, Archive own **400** / rival **900**, fixer launder **250**. Unknowables dock still waits.

EXP-02 (**1467–1474**): Unknowable ships drop crystals; Assembly drops cubes; both sell own legally at their stations; each pays highly for the other’s data.

**Code wins.** Wave 94 un-waited the dock (`docs/OwnerDecisionsWave94.md` **109–133**). Live `veil` / The Quiet / Archive own 400 / rival 900 exist. This pack does **not** edit the wishlist.

Wave 92 brief (`docs/UnknowablesDockDesign.md`) was presence-first; header already notes Wave 94 Wait reversed. Wave 93 kept dock Wait; Wave 94 superseded.

---

## 3. Authored origin `veil`

`authored-systems.js` **232–255**:

| Field | Live | Line |
|---|---|---|
| id | `veil` | **235** |
| name | `The Veil` | **236** |
| faction | `unknowables` | **237** |
| band | 3 | **252** |
| station name | `The Quiet` | **243** |
| station pos / palette | `[220, 24, 380]`, `0x404c77` | **243** |
| gates | one, `to: 'hush'` | **245** |
| cast | `{ traders: 0, pirates: 0, patrols: 0, ace: false }` | **251** |
| landmarks | `[]` | **253** |
| clues | `[]` (verge precedent; authored mystery stays 6) | **254** |

Host hush (`authored-systems.js` **161–195**): faction stays `hollow`; station Threshold; gate **175** `to: 'veil'`; landmark `th_veil` anomaly **189** still present. Dock is **`veil`**, not Threshold.

`FACTIONS.unknowables` live (`state.js` **605**). `SYSTEMS = { ...AUTHORED_SYSTEMS, ...GENERATED_SYSTEMS }` (**583**). Chart set includes `veil` (`galaxychart.js` **52**). Generator has **no** `unknowables` cluster (`scripts/generate-galaxy.mjs` grep 0). Authored-only, as Wave 94 required.

`EPICS` starts `freehold` (`state.js` **797–800**). No `unknowables` epic key. Boot pin `!Object.prototype.hasOwnProperty.call(EPICS, 'unknowables')` (`scripts/boot-test.mjs` **20737**).

---

## 4. Station builder vs `DETAIL_STATIONS` (D3)

| Surface | Today | Cite |
|---|---|---|
| Module | `src/systems/stations/unknowables.js` | group name `unknowables-station` **17**; `UNKNOWABLES_STATION_PATH = true` **13**; `assembleUnknowablesStation` **15–97** |
| Dispatch | `isUnknowable` → dedicated builder | `station.js` **10**, **308–316**, **321**; `faction-style.js` **163–165** |
| Models Browser | `station:unknowables` | `model-catalog.js` **139–145**; `buildStationModel` Unknowable branch `station.js` **976–977** |
| Placeholder | unknown-faction fallback only | `station.js` **324**, **327** |
| `DETAIL_STATIONS` | 10 keys: freehold…hollow. **No** `unknowables`. **No** `beautiful` | `station.js` **559–578** |

Wave 42 D3 (“they build no stations” as VC-kit row) is **not** reversed. Wave 94 followed Beautiful: dedicated module, not a `DETAIL_STATIONS` hull. This leftover must **not** add `unknowables` to that table.

`innerHTML` in `stations/unknowables.js`: **none**. Materials are not `userData.shared`.

---

## 5. Archive desk (Market pane — not a Digit)

Gate: `archiveDeskAllowed` (`station.js` **1210–1214**):

- `assembly` → `Object.hasOwn(DETAIL_STATIONS, 'assembly')`
- `unknowables` → `UNKNOWABLES_STATION_PATH === true`
- else false (reserved `__proto__` fails both branches)

Hostile: `archiveHostile` **1216–1218** — `standingRead(..., dockFaction) < 0` → `No sale.` Dock standing, not Assembly standing, at The Quiet.

SKU: `archiveOwnSku` **1221–1224** — Unknowables own `dataCrystal`; Assembly own `dataCube`.

Prices at desk: `archivePriceAtDesk` **1226–1240**:

| Dock | Verb | SKU / origin / source | UU |
|---|---|---|---|
| assembly | buy/sell | legal cube / assembly | `ARCHIVE_OWN_UU` 400 via `archiveFilePrice` |
| assembly | sell | crystal / unknowables / any data source | `ARCHIVE_RIVAL_UU` 900 via `archiveFilePrice` |
| unknowables | buy | legal crystal / unknowables | 400 |
| unknowables | sell | legal crystal / unknowables | 400 |
| unknowables | sell | cube / assembly / any `isDataSource` | 900 |
| unknowables | buy cubes | — | **null** (copy: “The archive does not buy cubes.” **1333**, **1479**) |
| either | captured **own** origin | — | refuse illegal-in-origin **1328–1330**, **1243–1245** |

**Note (not a hole):** `archiveFilePrice` in `data-trade.js` **187–201** still prices **Assembly** only. Player confirm uses `archivePriceAtDesk` (`station.js` **1336**). Unknowables UU live in the desk helper. Do **not** invent a second UU table. Do **not** treat Assembly-only `archiveFilePrice` as missing EXP-02.

Render: `renderArchiveDesk` **1419–1525**. Called from Market renderer **4784** with `currentDef.faction`. Requires `ui.level === 2 && ui.service === 'market'`. Confirm papers: `Confirm filing` / `Esc — Cancel`. Buy button at Unknowables: `File a legal crystal` (**1474**). Sell from hold: `File from the hold` (**1514**). Reduced-motion short copy **1428–1436**.

Confirm: `confirmArchivePending` **1309–1417**. `ui.dataBusy` re-entry guard. Debit/credit `world.credits`. Cargo via `addDataCargoRow` / `removeDataCargoUnits`. Autosave `requestAutosave`. Hostile `No sale.` Hold full / not enough UU fail closed.

Pending is **session UI**: `ui.dataPending` init **4447**; cleared on service change **6087**, dock **6107**, undock **6138**, Esc market **6184**. `cancelDataPending` **1089–1094**. **Not** a `WORLD_FIELDS` key.

Notice: `aria-live` polite on `ui.notice` **6066–6068**. `h()` uses `textContent` **4464–4469**. `station.js` `innerHTML`: **none**.

---

## 6. EXP-02 two-way (player-facing)

Wishlist EXP-02 wants:

1. Unknowable hulls drop crystals; Assembly hulls drop cubes.
2. Both factions sell **own** data legally at **their** stations.
3. Each pays highly for the **other** faction’s data.

| Leg | Live | Cite |
|---|---|---|
| Tokens | `dataCrystal` / `dataCube` | `data-trade.js` **7–16** |
| Origins | `unknowables` / `assembly` | **16**, `isDataOriginFaction` **60–65** |
| Drop | `DATA_DROP_RATE = 0.20` | **18–19**, `maybeSpawnDataFromWreck` **181–185** |
| Assembly buy own cube 400 | **Yes** | `archiveFilePrice` buy **188–191** |
| Assembly sell rival crystal 900 | **Yes** | **198–200** |
| Unknowables buy own crystal 400 | **Yes** | `archivePriceAtDesk` **1232–1233**; probe `unk.buy.own400` |
| Unknowables sell own legal 400 | **Yes** | **1234**; probe `unk.sell.own400` |
| Unknowables sell rival cube 900 | **Yes** (legal or captured) | **1237–1238**; probe `unk.rival.900` |
| Unknowables refuse captured own crystal | **Yes** | **1244**, **1328–1330**; probe `unk.illegal.stay` |
| Hostile Unknowables no sale | **Yes** | **1216–1218**, **1323–1325**; probe `unk.hostile` |

Two-way route: buy legal cube at Assembly 400 → sell at The Quiet 900; buy legal crystal at The Quiet 400 → sell at Assembly 900. That is EXP-02. It is **not** dead.

Launder 250 at Veridian / Redmarch fixer is EXP-03 (`LAUNDER_UU` **26**; `liveFixerAtDock` **1248**). **Not** this leftover.

---

## 7. Contacts, People, yard, Digit

| Surface | Today | Cite |
|---|---|---|
| Dockmaster | `Voice-Without` | `contacts.js` **97**, roster **114** |
| People | `portraitFor('unknowables', id)` exists | Wave 94 law; probe `people.portrait` |
| Digit 0 | last `DOCK_KEY_SERVICES` = `shipyard` → hotkey **0** | `station.js` **188**, **6035–6036**, **6172** |
| Digit 8/9 dock root | launch / epics | same list indices 8 / 9 |
| Archive Digit | **none** — Market pane | **4784** |
| Living stock | `UNKNOWABLES_STOCK = LIVING_STOCK` six classes | `shipyard.js` **29–30**, **61** |

Digit 0 stays shipyard. This leftover must **not** steal Digit 0/8/9.

---

## 8. Persist / proto / HUD law

| Surface | Today | Cite |
|---|---|---|
| `WORLD_FIELDS` | no archive / desk / dataPending key | `save.js` **77–101** |
| Data cargo | hangar cargo rows + sanitize | `data-trade.js` `sanitizeDataCargoRow` **83–96**; reserved ids **28–32**, **60–64** |
| Credits | existing `world.credits` | confirm path |
| `state.js` | `FACTIONS.unknowables` already live | **605** — later leftover writes **READ-ONLY** |
| HUD-01 | empty hub | honor; not this leftover |
| Aim-glass gauges | off | honor |
| Kit mutate | omit | honor |

---

## 9. Boot / probe (cite; no re-run required for this markdown freeze)

`scripts/boot-test.mjs` WAVE94 block **20706–20744**: `veil.id` / faction / The Quiet / clues empty / hush clues 2 / hush↔veil gates / `archiveDeskAllowed('unknowables')` / `archiveDeskAllowed('assembly')` / no `EPICS.unknowables` / chart `'veil'` / `buildUnknowablesStation`.

`AUTHORED_IDS23` includes `veil` (**4915**). hush landmarks pin includes `th_veil` (**4947**). veil landmarks empty (**4949**).

`out/w94/unk/probe.mjs` pins desk UU, hostile, illegal-origin, UI copy, sculpt name, catalog, Digit 0 shipyard, `no.innerHTML`. Read-only this wave.

---

## 10. Not leftover (do not schedule)

- HUD / NAV chart-label / toast / overlay (siblings; `galaxychart.js` later write is **not** this pack).
- `DETAIL_STATIONS.unknowables` row (would reverse D3).
- Generated Unknowables SYSTEM / generator cluster.
- Second Unknowables dock / invented SYSTEM id.
- Third data SKU. Invented UU. New Digit. New `WORLD_FIELDS` key.
- Unknowables epic. New hush clue. Wishlist edit. `PROGRESS.md` edit.
- Presence `th_veil` already live on hush — not a missing dock.
- Assembly Archive rewrite.
- `archiveFilePrice` Unknowables mirror in `data-trade.js` (desk helper already prices Unknowables).

---

## 11. Freeze

Leftover is **CONSUME**. Named serial **none**. Name: **no remaining Unknowables dock / Archive two-way leftover.**

If a later census finds `veil` gone, The Quiet missing, `archiveDeskAllowed('unknowables')` false, own crystal 400 dead, rival cube 900 dead, or EXP-02 two-way dead at Unknowables, **re-open**. Do **not** ship a second dock while they exist.
