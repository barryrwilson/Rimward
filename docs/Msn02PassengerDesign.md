# RIMWARD MSN-02 renewable passenger ferrying

| Field | Value |
|---|---|
| **Title** | RIMWARD MSN-02 renewable passenger ferrying across systems |
| **Author** | Wave 77 MSN-02 passenger integrator |
| **Date** | 2026-08-20 |
| **Status** | First impl Wave 78 (PR1–PR5). Design froze in Wave 77. |
| **Wave** | 78 — first implementation of the Wave 77 passenger brief. |
| **Owner request** | MSN-02 passenger ferry brief. Unique-four stay; no `state.js` write; no new persist key; no POD-02 reopen. |
| **Merge law** | [`out/w77/passenger/shared-contract.md`](../out/w77/passenger/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w77/passenger/current-passenger-inventory.md`](../out/w77/passenger/current-passenger-inventory.md) |
| Merge law | [`out/w77/passenger/shared-contract.md`](../out/w77/passenger/shared-contract.md) |
| Security review | [`out/w78/passenger/security-review.md`](../out/w78/passenger/security-review.md) |
| Design-doc review | [`out/w78/passenger/code-review.md`](../out/w78/passenger/code-review.md) |
| UI audit | [`out/w78/passenger/ui-audit.md`](../out/w78/passenger/ui-audit.md) |

---

## Overview

Wishlist MSN-02 wants passenger ferrying across systems as a career. Live today: unique `ferry-consignment` is a one-shot **Provisions** consignment (`kind: 'ferry'`). Completing it still sets `DONE` and never posts a replacement. Mining occupies two renewable slots per system (Wave 71). Trade occupies two more (Wave 76). People lots stay POD-02 on Digit 7; `priceOf('survivor')` is 0.

Wave 77 freezes persist (extend `world.jobs` + raise sanitize cap by passenger room only), two passenger slots, one-in-one-out, primary-gate named dest, **no cargo token**, origin `payQuoted` from live `FERRY_REWARD` 350, 600 s fail-closed deadlines, employer-only +2, Digit 2 Jobs pane, and the serial PR plan. Unique four stay. Unique `kind: 'ferry'` stays the Provisions consignment. POD-02 sale does not reopen.

Do **not** migrate or delete the unique four. Do **not** invent espionage, faction-war, hunt, or exploration numbers. Espionage still depends on a later REP brief (REP-04). `src/game/state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “jobs, unique ferry, hold, and people today”: [`out/w77/passenger/current-passenger-inventory.md`](../out/w77/passenger/current-passenger-inventory.md). Code wins over stale comments. Wave 75 trade inventory line numbers are stale.

| Surface | Today | Cite |
|---|---|---|
| Owner | `station.js` creates `ctx.world.jobs` if empty | `ensureJobs` 1759–1762; `initStation` 2434 |
| Unique cards | ace bounty, patrol, haul Provisions, ferry Provisions | `makeJobs` 1724–1756 |
| Mining slots | two per system, `kind: 'mining'`, one-in-one-out | `MINING_SLOTS_PER_SYSTEM` 189; `syncMiningJobs` 1919–1939 |
| Trade slots | two per system, `kind: 'trade'`, dest `otherSystemId`, origin quote | `TRADE_SLOTS_PER_SYSTEM` 190; `syncTradeJobs` 2077–2098 |
| Overlays | pirate bounties cap 2; one recovery wreck | `PIRATE_BOUNTY_CAP` 187 |
| Unique complete | `state = 'done'`; trust/favor; no splice | `completeJob` 2202–2206 |
| Mining/trade complete | `failed` first, pay, splice, replace | `tickDeliveryJobs` 2252–2347 |
| Board filter | hide foreign **offered** pirate/recovery/mining/trade; show unique `DONE` | `boardJobs` 2132–2143 |
| Haul dest | Wave 35: `otherSystemId(origin)` named dest | 1711–1713, 2372–2385 |
| Unique ferry dest | stamped `destSystem`; only that dock pays | 2754–2758, 2395–2402 |
| Unique ferry front | `addCargo('provisions', FERRY_UNITS)` on accept | 2747–2759; `FERRY_UNITS` 174 |
| Haul/ferry pay stamps | `payQuoted` on accept; unique haul/ferry price **dest** dock | 2758, 2816; `jobPayFor` 2151–2158 |
| Mining/trade pay | `payQuoted` via **origin** `jobPayFor`; trade uses `HAUL_MARGIN` 1.4 | 2777, 2806 |
| Patrol rep | **`reputation.freehold += PATROL_REP`** | 2233 |
| Mining/trade rep | +2 employer `SYSTEMS[origin].faction` | `MINING_REP` 191; 2288–2291, 2337–2340 |
| Persist | `WORLD_FIELDS` `'jobs'`; autosave `rimward-save-v1` | `save.js` 65, 78 |
| Sanitize | hyphen tokens, proto drop, kind/state allowlist, cap `4+4*N_SYSTEMS+16` (**420** at 100 systems) | `save.js` 115–127, 197–208, 407–446 |
| Events | `'commLine'` only; no `job*` type | `ctx.js` 198–232 |
| UI | Digit 2; `h()` `textContent`; digit accept by index | 152, 2489–2494, 3424, 3548–3550 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| Hold | `holdUnits` sums matching commodity **including survivor rows**; `addCargo` does **not** merge survivor into bulk | 962–965, 1668–1677 |
| `priceOf('survivor')` | **0** | 1689–1690 |
| Market people | `tryTrade` refuses `survivor` | 2640–2642 |
| POD-02 | People Digit 7; Gilded sale 160/240 | `trafficking.js` 8; `renderTrafficDesk` 1550–1553 |
| Commodities | bulk: `provisions`, `refinedMetals`, `rawOre`, `livingRock`. No `survivor` row | `state.js` 308–313 |
| NPC routes | traders never hub-route | `world.js` 24–27 |

There is no `kind: 'passenger'`. Unique ferry is not renewable passenger ferrying.

### Pain points

- Wishlist MSN-02 passenger ferrying: the only “ferry” card is one-shot unique id `ferry-consignment` and it fronts **Provisions**, not people.
- Treating people as Market cargo would reopen POD-02. `priceOf('survivor')` is 0; `addCargo('survivor')` writes a faction-less row.
- Mining and trade already prove slot law, sanitize, expire, and employer rep. Passenger must **share** `world.jobs` without evicting them.
- Live cap `4+4*N_SYSTEMS+16` (420) cannot hold two extra slots per system.
- Unique ferry prices the **destination** dock and pays on stamped `job.destSystem`. Trade/mining price **origin** and trade **rebinds** `otherSystemId` at pay. The serial must pick origin+rebind and not silently change unique ferry (WAVE26 / WAVE4 pins).
- Patrol still writes hardcoded `freehold`. Copying that would mis-attribute passenger standing.

### Why now (design) / why not now (code)

The owner asked for the MSN-02 passenger brief after Wave 76 trade. Inventory and merge law exist. Implementation waits for a later serial so cap, kind allowlist, dest bind, and no-cargo law land against a frozen contract instead of a drive-by sixth `makeJobs` row.

---

## Goals & Non-Goals

### Goals

1. Document the live board, unique four, mining/trade slots, unique ferry complete path, hold/POD law, Digit 2, `sanitizeJobs`, and live cap **420** from **live code**.
2. Freeze extend-`world.jobs` (no new persist key) and a **raised** sanitize cap: `live_cap_at_impl + PASSENGER_ROOM` only.
3. Freeze renewable **passenger** as the next vertical slice: two slots, one-in-one-out, named other-system dest, **no cargo token**, origin `payQuoted` from `FERRY_REWARD`, 600 s fail-closed.
4. Freeze XSS / proto ids / stuffed pay / dest injection / reputation key / people-as-bulk-cargo law.
5. Name later families without inventing their numbers. Hunt/explore stay sibling workers.
6. Freeze a serial PR plan: sanitize cap/kind → sync+accept+deliver → replace/expire → UI copy → boot pins.
7. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 77. No `src/` edits. No `scripts/` / `public/` / `package.json`.
- No HUD-02 chart marks. No AST `asteroidId`. No POD reopen. No SHP hull grants. No BIO graft. No EXP SKU. No TGT-05.
- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No parallel `world.missions` array. No new `WORLD_FIELDS`. No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows.
- Do not migrate `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` in this serial.
- Do not specify hunt, exploration, espionage, or faction-war numbers.
- Do not invent police restitution (REP-03). Do not reopen POD-02 UU (160/240).
- Do not edit the wishlist, `PROGRESS.md`, sibling briefs, or sibling `out/w77/{hunt,explore}`.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.
- Do not implement passenger jobs in this wave.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Extend `world.jobs` | Already on `WORLD_FIELDS`. Contract §0.2 |
| Replace unique four? | **No** in this serial | Boot-test pins. Contract §0.4, §0.19 |
| First passenger family kind? | **`passenger`** (`kind: 'passenger'`) | Must not collide with `'ferry'`, `'haul'`, `'trade'`, `'mining'`. Contract §0.3 |
| Unique `'ferry'`? | One-shot Provisions consignment. Completing still `done` | `station.js` 1750–1755, 2202–2206, 2395–2402 |
| Board slot? | 2 passenger jobs per system (offered or accepted) | Mining/trade precedent 189–190. Contract §0.5 |
| Replacement? | Splice + immediate new passenger job same system+slot | MSN-01. Contract §2.3 |
| Live cap? | `4+4*N_SYSTEMS+16` = **420** at 100 systems | `save.js` 115–122 |
| New cap? | `live_cap_at_impl + PASSENGER_ROOM` = `4+6*N+16` = **620** at 100 | 2 passenger slots. **No hunt/explore room.** Contract §0.6, §1.2 |
| Drop mining/trade to fit? | **Never** honest offered mining or trade | Contract §0.6 |
| Dest? | `otherSystemId(origin)`; pay rebinds that helper | Wave 35 haul 2372–2385; trade 2323–2324. **Not** unique ferry stamped dest. Contract §0.7, §3.5 |
| Accept where? | Origin dock only for passenger slots | Unique haul either-dock stays. Unique ferry fronting stays. Contract §3.6 |
| Player path? | Multi-gate OK | NPC hub-route lore is NPC-only (`world.js` 24–27) |
| Cargo? | **None.** No `commodity`. No `addCargo`. Hangar token needs owner | Contract §0.8–0.9, §3.3 |
| `need` / pay? | `need` 1; origin `jobPayFor(FERRY_REWARD` 350`)` | cite 175. No new margin. Contract §0.10, §3.4 |
| `payQuoted`? | Stamp on accept via **origin** `jobPayFor`; clamp 0…20000 | Wave 26 + mining/trade origin stamp. Contract §0.10 |
| Deadline? | 600 s (`MINING_DEADLINE` / `WRECK_TTL`); restart on accept; expire fail closed | cite `station.js` 193; `world.js` 811. Contract §0.11 |
| Employer rep? | +2 `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS)` | `MINING_REP` 191. Not patrol `freehold`. Contract §0.12 |
| `innerHTML`? | **No** | Live `h()` is `textContent`. Contract §0.13 |
| Job ids | Hyphen **tokens**; passenger id `passenger-<SYSTEMS key>-<n>` | Never `SAFE_ID.test(job.id)`. Contract §0.15, §1.3 |
| UI | Jobs pane, Digit 2 only | Contract §0.13 |
| `state.js` | READ-ONLY | Contract §0.14 |
| New event? | **No** | Prefer `commLine`. Contract §0.14 |
| Hunt / explore / MSN-03? | Later / sibling serials | Contract §0.16, §9 |

### 2. Current board (do not break)

See inventory §§1–6. The load-bearing loop is:

1. `initStation` → `ensureJobs` → `makeJobs` if empty (unique four).
2. Each Jobs render: refresh ace, sync pirates, sync recovery, **sync mining**, **sync trade**.
3. Accept stamps haul/ferry quotes (dest `jobPayFor`) and mining/trade quotes (origin `jobPayFor`); unique ferry fronts Provisions.
4. Ticks complete patrol (frame), delivery (0.5 s). Mining/trade expire/replace live in that tick.
5. Unique `completeJob` marks `done` and banks dockmaster trust. Mining/trade splice.

**This serial must not change step 1’s four ids or unique haul/ferry quote stamps or Wave 35 haul dest bind or unique ferry `done`.** Passenger is additive: extra sync on render, extra branch in delivery tick, extra cards in `boardJobs`, extra kind in `sanitizeJobs`.

Digit 2 and `DOCK_KEY_SERVICES` stay. Digit 0 stays shipyard. Digit 7 stays People (POD-02).

### 3. Persist: raise `sanitizeJobs`

Restore already heals jobs (`save.js` 711). That is the trust boundary.

Later PR1: extend `sanitizeJobs`. Shape, hyphen-token ids, proto drop, **`'passenger'` kind**, dest/slot, **no commodity**, cap: contract §1.

**Ids:** live `SAFE_ID` (`/^[a-z0-9_]+$/i`) rejects hyphens. `ferry-consignment` and `passenger-freehold-0` must survive restore. Sanitize splits on `-` and runs the `SAFE_ID` character class on **each token**, then `RESERVED_IDS` on the full string and every token. Unique four are an exact allowlist. Do not rewrite them to underscores. Do not allocate `ferry-<sys>-<n>`.

**Cap:** live `JOBS_SANITIZE_MAX = 4 + 4 × Object.keys(SYSTEMS).length + 16` (**420** at 100 systems, `save.js` 115–122; `state.js` 541). New at impl: `live_cap_at_impl + PASSENGER_SLOTS_PER_SYSTEM * N_SYSTEMS` = `4 + 6 × N_SYSTEMS + 16` (**620** at 100). A cap of 420 cannot hold two mining **and** two trade **and** two passenger slots per system. **Do not** add hunt or explore rooms here. Drop order never removes the unique four, accepted jobs, honest offered mining, honest offered trade, or honest offered passenger (one of two slots per `originSystem` per kind).

`ensureJobs` still seeds the unique four when the array is empty after heal. Passenger fill is `syncPassengerJobs`, not `makeJobs`. Mining fill stays `syncMiningJobs`. Trade fill stays `syncTradeJobs`.

### 4. Board slots and one-in-one-out

A **passenger slot** is `kind === 'passenger'` + `originSystem` + `slot` ∈ {0,1}. Independent from mining and trade slots.

```
renderJobs
  → syncPirateBounties / syncRecoveryJob / syncMiningJobs / syncTradeJobs (unchanged)
  → syncPassengerJobs(currentId)   // fill missing slots only; skip if dest === origin

passenger complete or expire
  → splice that job
  → push replacement for same originSystem + slot
  → render if the Jobs pane is open
```

Offered passenger: home dock only (mining/trade/pirate/recovery precedent).  
Accepted passenger: visible on every Jobs board so the player can see dest name and deadline.

Unique `DONE` rows remain until a later serial. This slice must not add passenger to that clutter (`failed` is transient).

Gates-less origin (`otherSystemId` returns self): **do not post**. Unique haul already cannot pay there.

### 5. Passenger vertical slice

**Beats:**

1. Dock home → Jobs → two passenger cards (escort a booked party to the named other system).
2. Accept. Reward, dest, employer, remaining time are visible before and after accept (wishlist acceptance).
3. Fly any path. Dock the named dest. **No buy. No hold check. No person-commodity.**
4. Delivery tick pays `payQuoted`, +2 employer rep (origin faction), dockmaster trust as today, splice, new card on the **origin** board.
5. Ignore a card for 600 s: posting withdraws, replacement appears. Ignore an accepted card: fail closed, no pay, replacement.

**Not:** unique ferry fronting. **Not:** unique ferry dest-dock `jobPayFor` or stamped-`destSystem` pay gate. **Not:** `addCargo('survivor')`. Accept only at the origin dock (`currentSystem === originSystem`); unique haul’s either-dock accept does **not** copy onto passenger slots. `need` is exactly **1** (sanitize drops any other passenger need).

**Pay:** `jobPayFor` at the **origin** dock of live `FERRY_REWARD` 350. Stamp `payQuoted` on accept so epic/faction shifts cannot move the agreement (Wave 26 law; mining/trade origin stamp). Unique ferry remains dest-priced on its own path.

**Dest bind:** pay uses `otherSystemId(origin)` (Wave 35 / trade). Stuffed `job.destSystem` cannot retarget payout. UI dest **name** also resolves through that helper + `SYSTEMS[dest].station.name`.

### 6. Deadlines

Live mining/trade already use `deadline` vs `world.time` and fail closed. Passenger uses the same clock. Do not invent a third clock.

| State | Timer | On fire |
|---|---|---|
| offered | `deadline = postTime + 600` | withdraw, replace |
| accepted | `deadline = acceptTime + 600` (restarts) | fail closed, replace |

600 s is ~10 minutes. A one-gate hop at cruise 120 is well under honest play. The window is deliberately generous (MSN-01).

Expire must not call the pay path. A restored job with `deadline` in the past expires on the next 0.5 s tick.

There is no `failed` row left on the board after replace. `failed` exists so a crash mid-replace cannot pay twice (mining 2280–2281).

### 7. UI (Jobs pane only)

Stay inside `renderJobs`. Two menu levels remain (`station.js` 3422–3448). Digit **2**. No new Digit. No HUD glance (HUD-02 closed).

Each passenger card (all `textContent`):

- Title / detail from templates using dest station name from `otherSystemId` + `SYSTEMS`.
- Reward line with stamped or live quote (origin `jobPayFor` for offered; `payQuoted` for accepted).
- If offered: Accept (n). Deadline remaining as whole seconds or minutes (reuse `miningTimeLeftLabel` or a shared one).
- If accepted: `ACCEPTED — dock at <dest> · t left`.

No `innerHTML`. No `job.faction` as a write source. `reducedMotion`: no extra animation; copy stays.

Home board can exceed 9 cards (unique four + overlays + 2 mining + 2 trade + 2 passenger). Digit 1–9 cannot accept past index 8; **mouse Accept still works** (live 2909, 3548–3550). That is existing UX, not a reason to cut to one slot (contract §12.2).

### 8. Reputation and later REP

Passenger success writes **employer faction only**, `Object.hasOwn(FACTIONS, key)`, **+2** (mining). Expire writes nothing.

Do not copy patrol’s `reputation.freehold +=` (`station.js` 2233) into passenger.

Espionage (secret success, exposed failure) and faction-vs-faction (employer up, target down) are wishlist REP-04. **MSN does not write that brief.** If those families need REP-01/03, the serial says “depends on later REP brief”.

### 9. Serial PR plan

Matches contract §8. **Named only. Do not implement in Wave 77.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'passenger'` kind; `passenger-<sys>-<n>` ids; dest/slot; no commodity; cap `4+6*N_SYSTEMS+16`; proto / kind / state allowlist; unique four kept; honest mining kept; honest trade kept | Sync, UI, pay, unique migration, whole-string `SAFE_ID`, hunt/explore cap |
| **PR2 sync cards + accept + deliver** | fill 2 slots; accept; dest `otherSystemId`; origin `payQuoted` from `FERRY_REWARD`; dest-dock tick **no cargo** | Expire, replace, other families; `addCargo('survivor')` |
| **PR3 replace + expire** | one-in-one-out; 600 s fail closed | MSN-03, unique migration, POD reopen |
| **PR4 UI copy** | remaining time + dest; `textContent` only | HUD-02, Digit 0, People desk |
| **PR5 boot pins** | keep unique four + `mine-freehold-0` + `trade-freehold-0` + `passenger-freehold-0`; drop `passenger-__proto__-0`; 200+200+200 fit 620; complete→new card; expire no pay; stuffed dest ignored; unique ferry still `done`; WAVE26/WAVE35 unique haul/ferry still pass | wishlist / PROGRESS |

`state.js` untouched. Authored copy is strings in `station.js` / a tiny `jobs.js`, not a table dump.

### 10. Coupling

| Neighbour | Coupling | Law |
|---|---|---|
| Mining MSN | Shared `world.jobs`, `sanitizeJobs`, Digit 2, `tickDeliveryJobs`, `boardJobs` | Grow cap by passenger room only. Independent slots. Never drop honest mining. Do not reuse `kind: 'mining'` |
| Trade MSN | Same array | Never drop honest trade. Do not reuse `kind: 'trade'` |
| Unique ferry | Same pane, same dest helper | Do not migrate id/kind. Do not change dest stamp or Provisions front |
| Unique haul | Same dest helper | Do not change dest `jobPayFor` stamps |
| EXP data | Data cargo is hangar rows, not job cargo | No `dataCrystal` / `dataCube` seeds. `priceOf` data stays 0 |
| POD survivors | People Digit 7 sale / rescue | No `survivor` on jobs. Do not use `addCargo('survivor')`. Do not reopen 160/240 |
| BIO grafts | `livingRock` is bio food | No `livingRock` seed. Feed Digit unchanged |
| SHP | Digit 0 shipyard; hangar | No hull grants. Hangar passenger token needs owner |
| TGT-05 | `ctx.targets` | Jobs do not write locks |
| REP | Standing bag | Employer +2 on success only. No patrol `freehold` copy. Espionage later (REP-04) |
| NPC traders | Hub-route lore | Player may multi-gate; pay is named dest |
| Hunt / explore | Sibling Wave 77 | Out of this cap formula and this brief’s numbers |

### 11. Non-goals (expanded)

- Passenger ferry as survivor cargo (POD closed).
- Copying unique ferry fronting onto people.
- Turning Standing epics into scripted quests (`epics.js` stays requirement auto-advance).
- Mystery clues as board jobs (EXP / later MSN).
- Police hail / restitution.
- Mission-granted ships, scanners, or mining heads (outfitter stays UU).
- Changing unique haul/ferry to origin pricing, or mining to dest pricing.
- `ctx.js` default `jobs: []` is optional; not required if `ensureJobs` remains the creator.

---

## Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Unique four vanish on restore | Exact allowlist; hyphen tokens; boot pins |
| Honest mining/trade dropped for passenger room | Cap 620; drop order never evicts honest mining, trade, or passenger |
| Unique ferry dest bind / front broken | Do not edit unique ferry accept/tick; PR5 still passes WAVE26/WAVE4 ferry |
| Unique haul dest bind broken | Do not edit Wave 35 branch; PR5 still passes WAVE35 |
| Unreachable dest | Skip post when `otherSystemId(origin) === origin` |
| Dest injection | Pay rebinds `otherSystemId`; UI names from `SYSTEMS` |
| Foreign offered accept | `boardJobs` hides offered passenger off-home; `acceptJob` also refuses if `currentSystem !== origin` |
| Stuffed `need` | Passenger need must be exactly 1; else drop |
| Stuffed `payQuoted` | Clamp 0…20000 on sanitize and at pay |
| Duplicate pay on restore | `failed` before pay; splice; expire has no pay branch |
| `__proto__` job id | Token `RESERVED_IDS`; drop `passenger-__proto__-0` |
| Save retargets employer | No `job.faction`; read `SYSTEMS[origin].faction` |
| XSS in titles | `textContent`; strip on restore; regen from templates |
| People as bulk cargo | No `commodity`; no `addCargo`; drop passenger jobs that carry `commodity` |
| `kind: 'ferry'` collision | New kind `'passenger'`; unique ferry id exact |
| Patrol freehold bleed copied | Passenger uses dock `faction` |
| Digit overflow | Mouse Accept; do not cut slots |
| `state.js` dump | READ-ONLY |
| Boot-test unique ids | Untouched |
| New persist key | Forbidden |
| Hunt/explore rooms eat cap | Formula is live_cap + passenger room only |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | station (later maybe `jobs.js`); save sanitize | station |
| Unique four | `makeJobs` when empty | boot-test |
| Mining slots | `syncMiningJobs` / replace | `boardJobs` |
| Trade slots | `syncTradeJobs` / replace | `boardJobs` |
| Passenger slots | `syncPassengerJobs` / replace | `boardJobs` |
| `ctx.world.reputation` | passenger complete → employer key | epics, standing, npc |
| `WORLD_FIELDS` `'jobs'` | save.js | restore |
| `state.js` | serial data owner only | **feature PRs read-only** |
| Survivor cargo | POD / People | **not this family** |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (3627–3631).

---

## Acceptance direction (implementation wave)

From the wishlist, made testable for the **passenger** slice:

1. A Freehold Jobs board shows two passenger cards plus today’s unique/overlay/mining/trade rows.
2. Accept → fly → dock named dest: card gone, credits up, **new** passenger card on the origin board. Hold contents unchanged.
3. Completing again still yields a passenger card (career does not exhaust).
4. Origin and dest are real `SYSTEMS` keys; dest = `otherSystemId(origin)` at pay; dest ≠ origin.
5. No `commodity` on the job. Never `survivor`, data keys, `livingRock`.
6. Reward, dest name, and remaining time are visible before accept.
7. After 600 s accepted without docking dest: no pay, card replaced, state not `DONE`.
8. Restore of `__proto__` / `passenger-__proto__-0` drops those rows; unique four and `mine-freehold-0` and `trade-freehold-0` and `passenger-freehold-0` remain; stuffed dest does not pay at the stuffed system; no throw; no extra credits.
9. Unique `ferry-consignment` id still exists and completing it still sets `DONE` (no splice). WAVE26 / WAVE35 behaviour unchanged.
10. No job field names an asteroid index. No new `WORLD_FIELDS`. No `innerHTML`. Digit 7 People sale unchanged.

---

## Open owner questions

Defaults in the contract §12 **stand**. None of them block impl.

Recorded, fail-closed until authored:

1. Hangar passenger token — **proposed, needs owner**. Default: no cargo token.
2. Passenger-specific UU table — **proposed, needs owner**. Default: origin `jobPayFor(FERRY_REWARD)` 350. Fail closed (no pay) if an impl invents a new table without owner.

A later owner may still override slot count or +2 vs 0 — until then, implement the defaults. Do not invent a new margin or a third clock while waiting.
