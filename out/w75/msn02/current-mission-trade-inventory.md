# Current mission / trade inventory (code wins)

**Wave:** 75. Design only.  
**Status:** LIVE CODE inventory for Initiative MSN, family **MSN-02 commodity trading and delivery**. If a comment, wishlist line, or this file disagrees with `src/`, **code wins**.  
**Not this wave:** any edit under `src/`.

Cites are `file:line` at inventory time (2026-08-20). Re-read those lines before an implementation PR.

Wave 70 inventory (`out/w70/msn/current-mission-inventory.md`) is **stale** on line numbers and on sanitize: Wave 71 shipped mining + `sanitizeJobs`. This file re-reads live code.

---

## 0. Scope of this inventory

Wishlist MSN-02 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 533–544) lists eight families. Mining shipped Wave 71. This inventory records **what the board, persist, pay, and commodities actually are today** so the next serial can add renewable **trade/delivery** without inventing espionage, passengers, hunt, faction-war, or exploration numbers.

Closed / later (do not reopen here):

| Neighbour | Freeze | Cite |
|---|---|---|
| MSN mining (Wave 71) | Closed first slice. Two mining slots per system. Keep. | `station.js` `MINING_SLOTS_PER_SYSTEM` 189; `syncMiningJobs` 1916–1937 |
| Unique four | Do **not** migrate or delete | `makeJobs` 1721–1754; boot-test `scripts/boot-test.mjs` 14367–14399 |
| POD-02 | Closed. No `survivor` on jobs | `docs/Pod02TraffickingDesign.md`; `holdUnits` 959–963; `addCargo` skip survivor merge 1666–1675 |
| EXP data | Closed. No `dataCrystal` / `dataCube` as job cargo | `docs/ExpDataTradeDesign.md`; `priceOf` 1686–1688 |
| BIO grafts | Closed. Do not seed `livingRock` as a trade contract | `COMMODITIES.livingRock` `state.js` 313; feed `act.feedRock` 2336–2342 |
| SHP yards | Closed. Jobs must not grant hulls. Digit 0 = shipyard | `DOCK_KEY_SERVICES` 152; labels 3179 |
| AST rock identity | Rocks are `id === index`. **No** `asteroidId` on jobs | `docs/AstOrbitsDesign.md` §9 |
| HUD-02 | Closed. No HUD glance for jobs | `docs/Hud02IdentitiesDesign.md` |
| TGT-05 | Closed. Jobs do not write `ctx.targets` | `docs/Tgt05ReticleLockDesign.md` |
| REP-04 | Espionage / faction-war **later**. Depends on a later REP brief | wishlist 500–508, 539–543 |
| NPC hub routes | Wave 22 lore: NPC traders **never** hub-route. Player path may use any gates | `world.js` 24–27 |

---

## 1. Who owns jobs

| Object | Writer | Reader | Cite |
|---|---|---|---|
| `ctx.world.jobs` | `station.js`: `ensureJobs` / `makeJobs` / pirate+recovery+**mining** sync / `acceptJob` / `completeJob` / `replaceMiningJob` / ticks | station board UI, `tickPatrolJob`, `tickDeliveryJobs`, `tickRecoveryCollect` | header 63–70; 1721–2231; 2559–2708; 3382–3386 |
| Create-if-empty | `ensureJobs`: if not array → `[]`; if `length === 0` → `makeJobs(ctx)` | `initStation` | 1756–1759; 2247 |
| Persist | `WORLD_FIELDS` includes `'jobs'` | snapshot copies listed fields | `save.js` 75–78, 522 |
| Sanitize | **`sanitizeJobs`** from `sanitizeRestored` | restore | `save.js` 376–413, 677 |
| Autosave key | `KEY = 'rimward-save-v1'` | load/save | `save.js` 15, 65 |
| `ctx.js` default | **No `jobs` key.** Station creates it | — | `ctx.js` 123–148 (no jobs) |
| Frozen events | None named `job*`. Completions emit `'commLine' { text }` | hud | `ctx.js` 198–232; `completeJob` 2064–2068 |

There is no `src/systems/jobs.js`. The Jobs **service** is Digit **2** on the dock (`DOCK_KEY_SERVICES[1] === 'jobs'`).

---

## 2. Board UI (Jobs service)

| Surface | Live | Cite |
|---|---|---|
| Dock key | Index 1, Digit **2**, label `Jobs board` | `station.js` 152, 3179–3182 |
| Overlay helper | `h()` always `textContent`. **No `innerHTML` in `station.js`.** | 2302–2307; grep `innerHTML` = 0 matches |
| Render | `renderJobs` rebuilds cards each open | 2606–2708 |
| Sync on render | `refreshBountyJob`, `syncPirateBounties`, `syncRecoveryJob`, **`syncMiningJobs`** | 2612–2615 |
| Visible set | `boardJobs(ctx, currentId)` | 1995–2005 |
| Card fields | title, detail, reward line, state line or Accept button | 2617–2707 |
| Accept click | `btn(..., () => acceptJob(job))` | 2674 |
| Accept digit | `boardJobs(...)[n - 1]` if `state === 'offered'` | 3303–3305 |
| Digit 0 | Shipyard on the **level-1** menu (`hot === 0` for last service). Jobs pane Digit 0 indexes `-1` → no-op | 3181; 3303–3305 |
| Max digit | 1–9. Cards past index 8 cannot be accepted by key. Mouse Accept still works | 3301–3305 |
| States shown | `offered` → Accept; `accepted` → `ACCEPTED …`; else → `DONE` | 2673–2707 |
| Mining deadline UI | remaining seconds/minutes on mining cards | `miningTimeLeftLabel` 1978–1987; 2675–2677, 2698–2700 |
| Failed state | Sanitize allowlist includes `failed`. Mining tick splices `failed` and replaces | `JOB_STATES` `save.js` 124; `tickDeliveryJobs` 2115–2132 |

`boardJobs` filters (`station.js` 1995–2005):

- Offered pirate bounties (`id` starts `bounty-pirate-`) hide unless `j.system === sysId`.
- Offered recovery hides unless `j.originSystem === sysId`.
- Offered **mining** hides unless `j.originSystem === sysId`.
- **Everything else is listed**, including `state === 'done'` unique cards, accepted jobs (all kinds), and done pirate/recovery cards.

There is **no** `kind === 'trade'` filter. There is **no** renewable trade family.

---

## 3. `makeJobs` / `ensureJobs` — four unique cards (never replaced)

`makeJobs` (`station.js` 1721–1754) returns a **fixed** array of four objects. `ensureJobs` (1756–1759) runs this **only when `world.jobs` is empty**. Completing all four does **not** refill the board. Mining fill is `syncMiningJobs`, **not** `makeJobs`.

| `id` | `kind` | Role | Reward / need (live constants) |
|---|---|---|---|
| `bounty-ace` | `bounty` | Named ace (default Carver Illyx) | `ace.bounty` else `DEFAULT_ACE_BOUNTY` 2500 (185–186, 1728–1731) |
| `patrol-lane` | `patrol` | Kill/drive off pirates | `PATROL_REWARD` 300, `PATROL_NEED` 2, `PATROL_REP` 5 (169–171) |
| `haul-provisions` | `haul` | Buy+deliver Provisions across primary gate | `HAUL_UNITS` 5, `HAUL_MARGIN` 1.4 (172–173). `reward: 0` until quote |
| `ferry-consignment` | `ferry` | Fronted Provisions, no buy-in | `FERRY_UNITS` 4, `FERRY_REWARD` 350 (174–175) |

Shared shape on those four:

```
{ id, kind, title, detail, reward, state: 'offered', progress: 0, need }
```

Haul extra: `originSystem: null, originPrice: 0` (stamped on accept, 1743–1744).  
Ferry extra: `originSystem: null, destSystem: null` (stamped on accept, 1751).

**Boot tests pin those ids** (`scripts/boot-test.mjs` 5924–5925, 8192–8208, 14367–14399). Wave 26 ferry/haul and Wave 35 haul named-dest pins must not be “fixed” by this brief. First trade serial **must not rename or delete** the unique four.

---

## 4. Live-synced overlays (not a slot machine)

### 4.1 Pirate bounties

`syncPirateBounties` (`station.js` 1783–1817):

- Pulls **offered** `kind === 'bounty'` with `id` prefix `bounty-pirate-` if the named pirate record is missing or `dead`/`captured`.
- Posts up to `PIRATE_BOUNTY_CAP` **2** cards for **current-system** live pirates with `bounty > 0` (187).
- Id: `pirateBountyId(name)` = `` `bounty-pirate-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` `` (1774–1776).
- Reward: `r.bounty || PIRATE_BOUNTY_FALLBACK` (400) (188, 1812).
- **Accepted / done pirate cards are not pulled** when the quarry dies.

This is MSN-02 “hunting a local pirate” **in part**. Not this trade serial.

### 4.2 Recovery (salvage overlay, not MSN-02 trade)

`syncRecoveryJob` (`station.js` 1826–1853):

- One offered recovery at a time for the first unexpired in-system wreck.
- Id `` `recovery-${a.id}` ``. Wreck ids are `` `aft-${time}-${rand}` `` (`world.js` ~1322).
- `WRECK_TTL = 600` world seconds (`world.js` 811). Mining cites the same number as `MINING_DEADLINE` 600 (`station.js` 191–192) and **does not import** `world.js`.
- Reward `RECOVERY_REWARD` 300 (176).
- Pay on redock at `originSystem` with `collected`.

### 4.3 Ace refresh

`refreshBountyJob` retargets `bounty-ace` name/reward from the living ace record unless `state === 'done'` (1762–1772). Not this serial.

---

## 5. Mining slots (Wave 71 — keep)

| Law | Live | Cite |
|---|---|---|
| Slots | `MINING_SLOTS_PER_SYSTEM = 2` | 189 |
| Kind | `'mining'` | `makeMiningJob` 1902 |
| Id | `mine-<sysId>-<n>` | `nextMiningId` 1867–1886 |
| Fill | `syncMiningJobs` on `renderJobs` | 1916–1937, 2615 |
| Replace | splice + push same `originSystem` + `slot` | `replaceMiningJob` 1955–1966 |
| Complete | **not** `completeJob`; set `failed` then pay then replace | 2142–2159 |
| Expire | `world.time >= deadline` → fail closed, replace | 2121–2132 |
| Deadline | 600 s from post; **restart** on accept | 1912, 2591; `MINING_DEADLINE` 192 |
| Need | `FERRY_UNITS` **4** | 1899 |
| Pay | `jobPayFor` at **origin**; `HAUL_MARGIN` × `priceOf` × need; stamp `payQuoted` on accept | `miningPayBase` 1888–1890; accept 2590; tick 2145–2148 |
| Clamp | `PAY_QUOTED_MAX` 20000 | 194; `clampJobPay` 1855–1858 |
| Rep | `MINING_REP` **+2** to `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS, faction)` | 190, 2150–2153 |
| Commodity | hardness ≤ 1 and `COMMODITIES`: live `rawOre`, `livingRock` | `MINING_ORE_KEYS` 195–198; `ORE_TYPES` `state.js` 344– |
| Board | offered mining home only; accepted mining everywhere | `boardJobs` 2001 |
| `asteroidId` | **absent** | `makeMiningJob` 1900–1913 |

Honest mining must **never** be dropped to make room for a new family. Cap law must grow.

---

## 6. Accept / complete / tick

### 6.1 `acceptJob` (2559–2604)

| Kind | On accept |
|---|---|
| `ferry` | Hold must fit `FERRY_UNITS`. Stamp origin/dest/`payQuoted` via **dest** `jobPayFor`. `addCargo('provisions', FERRY_UNITS)`. |
| `recovery` | Find wreck; spawn pod; `collected = false`. Fail if wreck gone. |
| `mining` | Stamp `payQuoted` via **origin** `jobPayFor`. Restart `deadline = world.time + 600`. No cargo front. |
| all | `state = 'accepted'` (after the branches above) |
| `haul` | After state flip: stamp `originSystem`, `originPrice`, `payQuoted` via **dest** `jobPayFor` (`otherSystemId`) |

Bounty and patrol accept with no extra stamp.

**There is no `kind === 'trade'` branch.**

### 6.2 `completeJob` (2064–2068)

- Sets `state = 'done'`. **Does not splice. Does not post a replacement.**
- Then `rewardJobContacts` (2051–2062): dockmaster `bumpTrust(..., DOCKMASTER_TRUST_PER_JOB)` **5** (180); generated dock `addFavor`; bounty → fence `addFavor`.
- Optional `'commLine'`.

Unique haul/ferry still use this path. Mining does **not**.

### 6.3 `tickPatrolJob` (2086–2104)

On need met: **`ctx.world.reputation.freehold += PATROL_REP`** (2095), then `jobPay` at **current** system, then `completeJob`. This is the live **hardcoded Freehold** write. Mining does not copy it. Trade must not copy it.

### 6.4 `tickDeliveryJobs` (2107–2231), cadence 0.5 s (3386)

| Kind | Pay dock | Pay math | After pay |
|---|---|---|---|
| mining | `currentSystem === origin` | `payQuoted` else origin `jobPayFor`; `clampJobPay` | splice + replace |
| bounty | any (space or dock) | `jobPay` current | `completeJob` → `done` |
| **haul** | **named dest** = `otherSystemId(origin)`; refuse if dest === origin | `payQuoted` else `jobPay(round(HAUL_UNITS * originPrice * HAUL_MARGIN))` | `completeJob` → `done` |
| **ferry** | **named** `job.destSystem` only | `payQuoted` else `jobPay(reward)` | `completeJob` → `done` |
| recovery | `originSystem` + `collected` | `jobPay(reward)` | `completeJob` → `done` |

**Wave 35 haul bind** (`station.js` 2186–2198): delivery uses `otherSystemId(ctx, origin)`, not “any non-origin dock”. Comment: multi-gate origins no longer pay at a side-gate. Old saves need no migration. **Do not change this unique-haul path** in the trade serial (boot WAVE26 / WAVE35).

**Ferry precedent** (2208–2215): only `job.destSystem` pays.

`otherSystemId` (1708–1710): `ctx.systems?.[id]?.gates?.[0]?.to ?? id`. Gates-less fallback returns the origin itself; unique haul then stays undeliverable (`dest === origin` continue).

NPC hub-route lore (`world.js` 24–27) does **not** apply to the player. The player may take any gate path. Pay still requires the **named** destination system.

---

## 7. Haul / ferry pay stamps (Wave 26)

Header (`station.js` 106–110): accept stamps `job.payQuoted` (JSON-plain). Mid-contract standing shift must not move an agreed price. Bounty, patrol, salvage, recovery payouts are **untouched** by that stamp law.

| Kind | Quote system | Formula | Cite |
|---|---|---|---|
| haul | **destination** (`otherSystemId(origin)`) | `jobPayFor(dest, round(HAUL_UNITS * originPrice * HAUL_MARGIN))` | 2594–2600; render 2632–2644 |
| ferry | **destination** (`job.destSystem`) | `jobPayFor(dest, FERRY_REWARD)` | 2567–2571; 2645–2652 |
| mining | **origin** | `jobPayFor(origin, round(need * priceOf(commodity) * HAUL_MARGIN))` | 2589–2590 |

`jobPayFor` (2013–2020): `epicEffects(ctx, faction).jobPayMult` then generated-system `FACTION_SERVICES[faction].jobPayMult`. Authored six (`AUTHORED_SYSTEMS[sysId]`) skip the faction service multiplier.

`HAUL_MARGIN = 1.4` (173). Do not invent a second margin for trade if this works.

---

## 8. Persist / sanitize (Wave 71)

| Surface | Live | Cite |
|---|---|---|
| Field | `'jobs'` on `WORLD_FIELDS` | `save.js` 75–78 |
| No second key | no `world.missions` | — |
| Autosave | `rimward-save-v1` | `save.js` 65 |
| Token class | `SAFE_ID = /^[a-z0-9_]+$/i` — **rejects hyphens** | 101 |
| Job ids | hyphen-token walk; **never** `SAFE_ID.test` full `job.id` | `jobIdTokens` 193–205 |
| Kind allowlist | `bounty` \| `patrol` \| `haul` \| `ferry` \| `recovery` \| `mining` | `JOB_KINDS` 123 |
| State allowlist | `offered` \| `accepted` \| `done` \| `failed` | 124 |
| Unique four | exact id → kind map | `UNIQUE_JOB_KIND` 125–130 |
| Field allowlist | includes `destSystem`, `payQuoted`, `commodity`, `deadline`, `slot` | `JOB_FIELD_ALLOW` 131–135 |
| Proto | `RESERVED_IDS` on keys, full id, every token | 106–110, 239–241, 193–205 |
| Mining commodity | `ORE_TYPES` **and** `COMMODITIES` | 291–293 |
| Cap | `JOBS_SANITIZE_MAX = 4 + MINING_SLOTS_PER_SYSTEM * Object.keys(SYSTEMS).length + 16` | 115–119 |
| Cap at 100 systems | **220** (`4 + 2*100 + 16`) | `state.js` 12–18, 500–541 (6 authored + 94 generated) |
| Drop order | extra offered mining duplicates → done/failed mining → done pirate/recovery → offered pirate/recovery **not current system** | 391–411 |
| Never drop (if still valid) | unique four; any `accepted`; honest offered mining (`!extras`) | 405–406 |

**Trade kind is absent.** A first trade serial **must** add `'trade'` to `JOB_KINDS` and **raise** the cap so 2 mining + 2 trade slots per system plus unique four plus overlay headroom 16 all fit. Must **not** drop honest offered mining to make room.

Walk uses index `for` + `Object.keys` on raw objects (`sanitizeOneJob` 237–245). Fresh `{}` literals. No `for…in` blob merge. No `Object.assign` of the save object.

---

## 9. Commodities / `priceOf` (state.js READ-ONLY)

`COMMODITIES` (`state.js` 308–322):

| Key | Name | `bulk` | Notes |
|---|---|---|---|
| `provisions` | Provisions | **true** | Unique haul/ferry cargo. `HAUL_UNITS` 5 / `FERRY_UNITS` 4 |
| `refinedMetals` | Refined metals | **true** | Recovery pod uses this (accept 2580) |
| `restrictedComponents` | Restricted components | **false** | Illegal; locker, not a trade seed |
| `rawOre` | Raw ore | **true** | Mining hardness 1 |
| `livingRock` | Living rock | **true** | Mining hardness 1 **and** BIO feed (`act.feedRock` 2336–2342). **Do not seed** as a trade contract |
| `slagIron` … `wakeglass` | exotic ores | **false** | Mined, not NPC bulk (`state.js` 302–307) |

`priceOf` (`station.js` 1686–1691):

- `survivor` → 0
- data keys (`isDataCommodity`) → 0
- else if `isMarketCommodity` (`Object.hasOwn(COMMODITIES, key)`, 973–975) → `world.prices[key] ?? COMMODITIES[key].base`
- else → `world.prices[key] ?? 0` (fail closed for unknown)

`holdUnits` (959–963) sums `c.commodity === commodity` with **no** provenance. Market fill of bulk counts (same as unique haul Provisions).

`addCargo` / `removeCargo` (1666–1684) merge ordinary rows; **do not** use them for survivors. Data cargo has dedicated helpers (`data-trade.js`). Trade jobs must use ordinary `COMMODITIES` keys only.

`cargoCapacity` default **20** (`ctx.js` 109). `HAUL_UNITS` 5 fits.

**Not** in `COMMODITIES`: `survivor`, `dataCrystal`, `dataCube`. Do not add rows. `state.js` stays READ-ONLY.

---

## 10. Destination helpers (do not invent)

| Helper | Behaviour | Cite |
|---|---|---|
| `otherSystemId(ctx, id)` | primary-gate `.gates[0].to`, else `id` | `station.js` 1708–1710 |
| Unique haul dest | recompute `otherSystemId(origin)` at **pay** and **render** | 2194–2198, 2633–2635, 2684 |
| Unique ferry dest | stamp `destSystem` on accept; pay only there | 2567–2568, 2209 |
| Player path | any gates the player can fly | WAVE35 comment 2190–2191 |
| NPC traders | physical dest gate only — **never hub routes** | `world.js` 24–27 |

A gates-less system cannot host an honest cross-system delivery (`dest === origin`). Unique haul already refuses pay. Trade **must not post** when `otherSystemId(origin) === origin`.

---

## 11. Digit 2 / two-level dock

- Level 1: service list. Digit 2 opens Jobs (`DOCK_KEY_SERVICES[1]`, label index 1 = `Jobs board`, 3179).
- Level 2: `ui.service === 'jobs'` → `renderJobs`. Digits 1–9 accept by **visible index** (3303–3305).
- Two menu levels remain (header 91, `ui.level` 2285).
- Digit 0 on level 1 is **Shipyard**. Do not add a new Digit.

Home-dock worst case **today** (all unique still listed, plus overlays, plus two mining): 4 unique + 2 pirate + 1 recovery + 2 mining = **9** cards → Digit 1–9 still covers. Adding two **offered** trade cards at home pushes the list past 9; mouse Accept still works (2674). This is UX noise, not persist unsafety. Cap math is the safety bound.

---

## 12. Events / `state.js` / world

| Rule | Live |
|---|---|
| `state.js` | Header: READ-ONLY for feature workers (`state.js` 7–8) |
| New frozen event | **Forbidden** unless an existing emit cannot carry the line. Completions use `commLine` |
| `world.js` | Does **not** write `world.jobs`. Owns aftermath / incidents / NPC traders |
| JSON-plain | Job objects are plain fields. No THREE. No functions |

---

## 13. Gap table (wishlist vs live)

| Wishlist MSN-02 family | Live today | This serial |
|---|---|---|
| mining contracts | **Shipped** Wave 71 | Keep. Do not reopen hardness / `asteroidId` |
| **commodity trading and delivery** | Unique `haul-provisions` / `ferry-consignment` **one-shot**. No renewable slots | **This brief.** New `kind` (must not collide with `'mining'` or unique ids/kinds) |
| espionage | none | **Later.** REP-04 |
| passenger ferrying | none (POD closed) | **Later** |
| hunting a local pirate | overlay, not one-in-one-out | **Later** |
| faction-level pirate | unique `bounty-ace` | **Later** |
| faction-against-faction | none | **Later.** REP |
| exploration / information | none (EXP cargo later consumer) | **Later.** Do not invent numbers |

---

## 14. Boot-test known FAILs (do not “fix” in this brief)

Implementation must not treat these as trade-serial bugs:

- WAVE4 fence
- WAVE26 ferry/haul quote stamps
- WAVE35 haul named-destination bind

Unique four ids must still round-trip.

---

## 15. Verification pins (read-only)

Exact files:

- `src/systems/station.js` `makeJobs` / `ensureJobs` / `boardJobs` / `completeJob` / `tickDeliveryJobs` / `acceptJob` / `renderJobs` / `h` / `otherSystemId` / `jobPayFor` / `HAUL_MARGIN` / `syncMiningJobs`
- `src/game/save.js` `WORLD_FIELDS` `'jobs'`, `JOBS_SANITIZE_MAX`, `sanitizeJobs`, `KEY`
- `src/game/state.js` `COMMODITIES` 308–322; `SYSTEMS` merge 541; READ-ONLY header
- `src/game/world.js` `WRECK_TTL` 811; NPC never hub-route 24–27
- `src/core/ctx.js` no jobs default; `commLine`; `cargoCapacity` 20
- `scripts/boot-test.mjs` unique four 14367–14399
