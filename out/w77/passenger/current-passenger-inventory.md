# Current mission / passenger-ferry inventory (code wins)

**Wave:** 77. Design only.  
**Status:** LIVE CODE inventory for Initiative MSN, family **MSN-02 passenger ferrying across systems**. If a comment, wishlist line, or this file disagrees with `src/`, **code wins**.  
**Not this wave:** any edit under `src/`.

Cites are `file:line` at inventory time (2026-08-20). Re-read those lines before an implementation PR.

Wave 75 trade inventory (`out/w75/msn02/current-mission-trade-inventory.md`) is **stale** on line numbers. Wave 76 shipped renewable `kind: 'trade'` and raised the sanitize cap to **420**. This file re-reads live code.

---

## 0. Scope of this inventory

Wishlist MSN-02 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 549–560) lists eight families. Mining shipped Wave 71. Trade shipped Wave 76. This inventory records **what the board, persist, unique ferry, hold, POD people lots, and pay actually are today** so a later serial can add renewable **passenger escort** without inventing hunt, exploration, espionage, or faction-war numbers, and without reopening POD-02 sale.

Closed / later (do not reopen here):

| Neighbour | Freeze | Cite |
|---|---|---|
| MSN mining (Wave 71) | Closed. Two mining slots per system. Keep. | `station.js` `MINING_SLOTS_PER_SYSTEM` 189; `syncMiningJobs` 1919–1939 |
| MSN trade (Wave 76) | Closed. Two trade slots. Keep. Live cap already includes trade room. | `TRADE_SLOTS_PER_SYSTEM` 190; `syncTradeJobs` 2077–2098; `save.js` 116–122 |
| Unique four | Do **not** migrate or delete | `makeJobs` 1724–1756; `UNIQUE_JOB_KIND` `save.js` 129–134 |
| Unique `kind: 'ferry'` | One-shot Provisions consignment. Completing still `done`. | `ferry-consignment` 1750–1755; `completeJob` 2202–2206; tick 2395–2406 |
| POD-02 | Shipped. People Digit 7 sale. `priceOf('survivor')` **0**. No `survivor` on jobs. | `trafficking.js` 8; `priceOf` 1689–1690; `tryTrade` 2640–2642; `renderTrafficDesk` 1550–1553 |
| EXP data | Closed. No `dataCrystal` / `dataCube` as job cargo | `priceOf` data 1691; `tryTrade` 2636–2638 |
| BIO grafts | Closed. Do not seed `livingRock` as passenger cargo | `COMMODITIES.livingRock` `state.js` 313 |
| SHP yards | Closed. Jobs must not grant hulls. Digit 0 = shipyard | `DOCK_KEY_SERVICES` 152; labels 3424 |
| HUD-02 | Closed. No HUD glance for jobs | Digit 2 only |
| TGT-05 | Closed. Jobs do not write `ctx.targets` | — |
| REP-04 | Espionage / faction-war **later** | wishlist 520–522 |
| NPC hub routes | NPC traders **never** hub-route. Player path may use any gates | `world.js` 24–27 |
| Hunt / explore | Sibling Wave 77 workers. **Do not** put their rooms in this family's cap formula | this inventory |

There is **no** `kind: 'passenger'`. Unique `ferry` is **not** renewable passenger ferrying.

---

## 1. Who owns jobs

| Object | Writer | Reader | Cite |
|---|---|---|---|
| `ctx.world.jobs` | `station.js`: `ensureJobs` / `makeJobs` / pirate+recovery+mining+**trade** sync / `acceptJob` / `completeJob` / `replaceMiningJob` / `replaceTradeJob` / ticks | station board UI, `tickPatrolJob`, `tickDeliveryJobs`, `tickRecoveryCollect` | 1724–2143; 2202–2417; 2746–2953; 3627–3631 |
| Create-if-empty | `ensureJobs`: if not array → `[]`; if `length === 0` → `makeJobs(ctx)` | `initStation` | 1759–1762; 2434 |
| Persist | `WORLD_FIELDS` includes `'jobs'` | snapshot copies listed fields | `save.js` 75–78, 551–556 |
| Sanitize | **`sanitizeJobs`** from `sanitizeRestored` | restore | `save.js` 407–446, 711 |
| Autosave key | `KEY = 'rimward-save-v1'` | load/save | `save.js` 65 |
| `ctx.js` default | **No `jobs` key.** Station creates it | — | `ctx.js` 123–148 (no jobs) |
| Frozen events | None named `job*`. Completions emit `'commLine' { text }` | hud | `ctx.js` 198–232; `completeJob` 2202–2206 |

There is no `src/systems/jobs.js`. The Jobs **service** is Digit **2** on the dock (`DOCK_KEY_SERVICES[1] === 'jobs'`).

---

## 2. Board UI (Jobs service)

| Surface | Live | Cite |
|---|---|---|
| Dock key | Index 1, Digit **2**, label `Jobs board` | `station.js` 152, 3422–3428 |
| Overlay helper | `h()` always `textContent`. **No `innerHTML` in `station.js`.** | 2489–2494; grep `innerHTML` = 0 matches |
| Overlay clear | `overlay.textContent = ''` | 3410 |
| Render | `renderJobs` rebuilds cards each open | 2822–2953 |
| Sync on render | `refreshBountyJob`, `syncPirateBounties`, `syncRecoveryJob`, `syncMiningJobs`, **`syncTradeJobs`** | 2828–2832 |
| Visible set | `boardJobs(ctx, currentId)` | 2132–2143 |
| Card fields | title, detail, reward line, state line or Accept button | 2834–2952 |
| Accept click | `btn(..., () => acceptJob(job))` | 2909 |
| Accept digit | `boardJobs(...)[n - 1]` if `state === 'offered'` | 3548–3550 |
| Digit 0 | Shipyard on the **level-1** menu (`d === 0`). Jobs pane Digit 0 indexes `-1` → no-op | 3514–3516; 3548–3550 |
| Max digit | 1–9. Cards past index 8 cannot be accepted by key. Mouse Accept still works | 3546–3550; 2909 |
| States shown | `offered` → Accept; `accepted` → `ACCEPTED …`; else → `DONE` | 2908–2952 |
| Deadline UI | remaining seconds/minutes on mining **and** trade cards | `miningTimeLeftLabel` 1981–1989; 2910–2912, 2933–2945 |
| Failed state | Sanitize allowlist includes `failed`. Mining/trade tick splices `failed` and replaces | `JOB_STATES` `save.js` 128; mining 2253–2297; trade 2300–2347 |

`boardJobs` filters (`station.js` 2132–2143):

- Offered pirate bounties (`id` starts `bounty-pirate-`) hide unless `j.system === sysId`.
- Offered recovery hides unless `j.originSystem === sysId`.
- Offered **mining** hides unless `j.originSystem === sysId`.
- Offered **trade** hides unless `j.originSystem === sysId`.
- **Everything else is listed**, including `state === 'done'` unique cards, accepted jobs (all kinds), and done pirate/recovery cards.

There is **no** `kind === 'passenger'` filter. Unique `DONE` ferry still occupies a row.

---

## 3. `makeJobs` / `ensureJobs` — four unique cards (never replaced)

`makeJobs` (`station.js` 1724–1756) returns exactly four objects:

| id | kind | Career shape |
|---|---|---|
| `bounty-ace` | `bounty` | Named ace |
| `patrol-lane` | `patrol` | Kill/drive `PATROL_NEED` 2 pirates |
| `haul-provisions` | `haul` | Buy `HAUL_UNITS` 5 Provisions; dest-priced |
| `ferry-consignment` | `ferry` | Front `FERRY_UNITS` 4 Provisions; dest-priced `FERRY_REWARD` 350 |

`ensureJobs` (1759–1762): empty array → those four. It does **not** fill mining, trade, or passenger slots.

**Unique complete path** (`completeJob` 2202–2206):

```
job.state = 'done'
rewardJobContacts
if (notice) emit('commLine', { text: notice })
```

No `splice`. No replacement. Unique ferry stays `DONE` on the board forever in this serial.

---

## 4. Unique ferry (one-shot Provisions consignment)

This is **not** passenger ferrying. Inventory it so the later family does not collide.

| Surface | Live | Cite |
|---|---|---|
| Constants | `FERRY_UNITS` **4**; `FERRY_REWARD` **350** | `station.js` 174–175 |
| Accept | Hold must fit 4 units; stamp `originSystem = currentSystem`; `destSystem = otherSystemId(origin)`; `payQuoted = jobPayFor(ctx, destSystem, job.reward)` (**dest** dock); **`addCargo(ctx, 'provisions', FERRY_UNITS)`** | 2747–2759 |
| Deliver | Docked; `currentSystem === job.destSystem` (**stamped dest, not rebound**); `holdUnits(ctx, 'provisions') >= FERRY_UNITS`; `removeCargo` provisions; pay `job.payQuoted ?? jobPay(ctx, job.reward)`; **`completeJob` → `done`** | 2395–2402 |
| Short hold | If docked at dest but hold short: notice; contract **stays open** | 2403–2406 |
| UI offered | `Ferry 4 fronted Provisions to <dest> — pays <est> UU, no buy-in` | 2869–2876 |
| UI accepted | `ACCEPTED — consignment to <dest> (have/need aboard)` | 2921–2923 |
| `otherSystemId` | `ctx.systems?.[id]?.gates?.[0]?.to ?? id` | 1711–1713 |

WAVE26 ferry quote and WAVE4 ferry delivery pin this path. **Do not “fix” it.** Passenger must not reuse `kind: 'ferry'`, must not front Provisions, and must not copy the stamped-`destSystem` pay gate (trade/haul rebind `otherSystemId` instead).

---

## 5. Renewable families already on the board

### 5.1 Mining (Wave 71)

| Surface | Live | Cite |
|---|---|---|
| Slots | 2 per system, `kind: 'mining'`, `slot` 0\|1 | 189, 1919–1939 |
| Ids | `mine-<sysId>-<n>` | `nextMiningId` 1870–1888 |
| Need | **`FERRY_UNITS` 4** (not haul 5) | `makeMiningJob` 1902 |
| Pay | Origin `jobPayFor`; `HAUL_MARGIN` 1.4; stamp `payQuoted` on accept | `miningPayBase` 1891–1893; accept 2769–2778; tick 2283–2286 |
| Complete | `failed` first, pay, splice, replace | 2280–2297 |
| Dest | **Home dock** (`currentSystem === origin`) | 2273–2274 |
| Rep | `+2` `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS, faction)` | `MINING_REP` 191; 2288–2291 |

### 5.2 Trade (Wave 76)

| Surface | Live | Cite |
|---|---|---|
| Slots | 2 per system, `kind: 'trade'` | 190, 2077–2098 |
| Ids | `trade-<sysId>-<n>` | `nextTradeId` 2009–2027 |
| Need | **`HAUL_UNITS` 5**; sanitize drops any other | `makeTradeJob` 2059; `save.js` `TRADE_NEED` 124, 281 |
| Commodity | bulk except `livingRock`: seed `provisions` / `refinedMetals` / `rawOre` | `isTradeCommodity` 1997–2003; `TRADE_SEED` 197 |
| Dest post | `tradeDestId` → `otherSystemId`; skip if dest === origin | 2034–2038, 2052–2053 |
| Pay | Origin `jobPayFor`; dest tick **rebinds** `otherSystemId(origin)` | accept 2805–2807; tick 2323–2324 |
| Complete | `failed` first, `removeCargo` named bulk, splice, replace | 2330–2346 |
| Accept | Origin dock only | 2779–2788 |

There is **no** passenger slot fill. `syncTradeJobs` must stay independent.

---

## 6. Unique haul (dest-priced, one-shot)

| Surface | Live | Cite |
|---|---|---|
| Need | `HAUL_UNITS` **5** | 172, 1743–1747 |
| Margin | `HAUL_MARGIN` **1.4** | 173 |
| Accept | Either dock: stamp origin, `originPrice`, dest `jobPayFor` | 2810–2816 |
| Deliver | **Rebind** `otherSystemId(origin)`; never pay at origin; `completeJob` → `done` | 2372–2394 |

WAVE35 haul named dest and WAVE26 haul quote pin this path. Do not change it.

---

## 7. Pay helpers, patrol rep, clamp

| Helper | Live | Cite |
|---|---|---|
| `jobPayFor(ctx, sysId, base)` | epic `jobPayMult` × faction service (authored systems skip service) | 2151–2158 |
| `jobPay(ctx, base)` | current-system shorthand | 2160–2162 |
| `clampJobPay` | 0…`PAY_QUOTED_MAX` **20000** | 1858–1861; 196 |
| Patrol complete | **`ctx.world.reputation.freehold += PATROL_REP`** (**5**) | 2233; `PATROL_REP` 170 |
| `rewardJobContacts` | dockmaster trust + generated favor; bounty fence favor | 2189–2200 |
| `PAY_QUOTED_MAX` save | 20000 | `save.js` 123 |

There is **no** passenger-specific UU table. Unique ferry’s authored base is `FERRY_REWARD` 350 (`station.js` 175). `priceOf('survivor')` is **0** (1689–1690), so a `HAUL_MARGIN × priceOf('survivor')` formula would pay **0**.

---

## 8. Hold law (people vs bulk)

| Helper | Live | Cite |
|---|---|---|
| `holdUnits(ctx, commodity)` | Sums **every** row with `c.commodity === commodity`, **including survivor rows** | 962–965 |
| `addCargo` | If `commodity === 'survivor'`: **push a new row, no merge**. Else skip `isSurvivorCargo` rows and merge bulk | 1668–1677 |
| `removeCargo` | If `commodity === 'survivor'`: **no-op**. Else skip survivor rows | 1679–1687 |
| `isSurvivorCargo` | `row.commodity === 'survivor'` | 972–975; `pods.js` 455–457 |
| Survivor row shape | `{ commodity: 'survivor', units, faction, source, name? }` | `pods.js` 20–21, 541–547 |
| Scoop merge | Survivors stack only on matching faction+source | `pods.js` 505–517 |
| `priceOf('survivor')` | **0** (explicit) | `station.js` 1689–1690 |
| Market | `tryTrade` refuses `survivor` and non-`COMMODITIES` | 2640–2642 |
| `COMMODITIES` | No `survivor` key. Bulk: provisions, refinedMetals, rawOre, livingRock | `state.js` 308–313 |
| `state.js` | READ-ONLY for feature workers | header 7–8 |
| Capacity | `ctx.cargoCapacity` **20** | `ctx.js` 109 |

**Do not** call `addCargo('survivor')` for a jobs family. That helper writes a faction-less row (`station.js` 1669–1671). People lots stay POD-02.

---

## 9. POD-02 / People Digit 7 (do not reopen)

| Surface | Live | Cite |
|---|---|---|
| People service | `DOCK_KEY_SERVICES[6] === 'people'` → Digit **7** | 152 |
| Return | Matching-faction People / home | `renderRescue` 3186–3202 |
| Sale | Gilded only; level-2 People; confirm | `renderTrafficDesk` 1550–1608 |
| List UU | `other` **160**, `playerKill` **240** | `trafficking.js` 8 |
| Events | `survivorRescued`, `survivorSold` | `ctx.js` 220–221 |
| Persist cargo | Survivor rows keep faction/source/name | `save.js` 495–508 |

Passenger cards are **jobs**, not slave cargo and not Market rows. Do **not** reopen 160/240. Do **not** put `survivor` on jobs.

---

## 10. Persist / sanitize (live cap already includes trade)

| Surface | Live | Cite |
|---|---|---|
| Kind allowlist | `bounty` \| `patrol` \| `haul` \| `ferry` \| `recovery` \| `mining` \| **`trade`**. **No `passenger`.** | `save.js` 127 |
| Id tokens | Split on `-`; each token `SAFE_ID`; `RESERVED_IDS` on full id **and** tokens | 197–208 |
| Unique keep | Exact `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` | 129–134, 256–257 |
| Trade id | three tokens `trade`, `sysId`, `n` | 262–265 |
| Trade dest | `SYSTEMS` key ≠ origin; required | 306–318 |
| Trade need | exactly 5 | 124, 281 |
| Cap formula | `4 + 2*N_SYSTEMS + 2*N_SYSTEMS + 16` | 115–122 |
| Cap at 100 | **420** | comment 118; `SYSTEMS` `state.js` 12–18, 541 |
| Drop order | extra mining → extra trade → done/failed mining\|trade → done pirate/recovery → foreign offered overlays | 422–445 |
| Never drop | unique four; any `accepted`; honest offered mining; honest offered trade | 436–439 |
| Reputation heal | `Object.hasOwn(FACTIONS, key)` only | `sanitizeReputation` 519–538 |
| `SAFE_ID` | `/^[a-z0-9_]+$/i` — **rejects hyphens on the full string** | 101 |

Live cap **cannot** hold two extra passenger slots per system (would need +200 at 100). Hunt/explore rooms are **not** in this formula.

---

## 11. Dest helper, clock, events

| Surface | Live | Cite |
|---|---|---|
| `otherSystemId` | primary gate `.to`, else self | `station.js` 1711–1713 |
| Deadline clock | `world.time`; mining/trade 600 s | `MINING_DEADLINE` 192–193; `WRECK_TTL` `world.js` 811 |
| Job ticks | patrol + recovery every frame; delivery 0.5 s **docked or not** | 3627–3631 |
| `ctx.elapsed` | visual only | `ctx.js` 234 |
| New event types | none for jobs | `ctx.js` 198–228 |

---

## 12. Known boot FAILs (do not “fix”)

WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul named dest. Unique ferry/haul behaviour stays. Passenger serial must not change those branches.

---

## 13. What passenger ferrying is **not** today

- Not unique `ferry-consignment` (Provisions front).
- Not POD-02 sale (Digit 7, `survivor` cargo, 160/240).
- Not Market `survivor` (price 0; `tryTrade` refuses).
- Not trade/mining slots.
- No `kind: 'passenger'` in `JOB_KINDS`.
- No hangar passenger token.

Wishlist MSN-02 still wants “passenger ferrying across systems” (`PLAYER-EXPERIENCE-WISHLIST.md` 556) as a **repeatable career**. That is this family’s later serial.
