# RIMWARD MSN-02 renewable trade / commodity delivery

| Field | Value |
|---|---|
| **Title** | RIMWARD MSN-02 renewable trade and commodity delivery |
| **Author** | Wave 75 MSN-02 integrator |
| **Date** | 2026-08-20 |
| **Status** | First impl Wave 76 (PR1–PR5). Design froze in Wave 75. |
| **Wave** | 76 — first implementation serial. Design history: Wave 75 markdown only. |
| **Owner request** | MSN-02 trade brief. Unique-four stay; no `state.js` write; no new persist key. |
| **Merge law** | [`out/w75/msn02/shared-contract.md`](../out/w75/msn02/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w75/msn02/current-mission-trade-inventory.md`](../out/w75/msn02/current-mission-trade-inventory.md) |
| Merge law | [`out/w75/msn02/shared-contract.md`](../out/w75/msn02/shared-contract.md) |
| Security review | [`out/w75/msn02/security-review.md`](../out/w75/msn02/security-review.md) |
| Design-doc review | [`out/w75/msn02/code-review.md`](../out/w75/msn02/code-review.md) |

---

## Overview

Wishlist MSN-02 wants commodity trading and delivery as a career. Live today: unique `haul-provisions` and `ferry-consignment` are one-shot cards. Mining already occupies two renewable slots per system (Wave 71). Completing unique haul/ferry still sets `DONE` and never posts a replacement.

Wave 75 froze persist (extend `world.jobs` + raise sanitize cap), two trade slots, one-in-one-out, primary-gate named dest, bulk commodity seed, origin `payQuoted`, 600 s fail-closed deadlines, employer-only +2, Digit 2 Jobs pane, and the serial PR plan. Wave 76 is the first implementation serial (PR1–PR5 in one worker). Unique four stay. Missions other than renewable trade do not change here.

Do **not** migrate or delete the unique four. Do **not** invent espionage, faction-war, passenger, hunt, or exploration numbers. Espionage still depends on a later REP brief (REP-04). `src/game/state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “jobs and trade today”: [`out/w75/msn02/current-mission-trade-inventory.md`](../out/w75/msn02/current-mission-trade-inventory.md). Code wins over stale comments. Wave 70 inventory line numbers are stale.

| Surface | Today | Cite |
|---|---|---|
| Owner | `station.js` creates `ctx.world.jobs` if empty | `ensureJobs` 1756–1759; `initStation` 2247 |
| Unique cards | ace bounty, patrol, haul Provisions, ferry Provisions | `makeJobs` 1721–1754 |
| Mining slots | two per system, `kind: 'mining'`, one-in-one-out | `MINING_SLOTS_PER_SYSTEM` 189; `syncMiningJobs` 1916–1937 |
| Overlays | pirate bounties cap 2; one recovery wreck | 1783–1853; `PIRATE_BOUNTY_CAP` 187 |
| Unique complete | `state = 'done'`; trust/favor; no splice | `completeJob` 2064–2068 |
| Mining complete | `failed` first, pay, splice, replace | `tickDeliveryJobs` 2142–2159 |
| Board filter | hide foreign **offered** pirate/recovery/mining; show unique `DONE` | `boardJobs` 1995–2005 |
| Haul dest | Wave 35: `otherSystemId(origin)` named dest | 1708–1710, 2186–2198 |
| Ferry dest | stamped `destSystem`; only that dock pays | 2567–2568, 2208–2215 |
| Haul/ferry pay stamps | `payQuoted` on accept (Wave 26); haul/ferry price **dest** dock | 2559–2601; `jobPayFor` 2013–2020 |
| Mining pay | `payQuoted` via **origin** `jobPayFor`; `HAUL_MARGIN` 1.4 | 1888–1890, 2589–2590 |
| Patrol rep | **`reputation.freehold += PATROL_REP`** | 2095 |
| Mining rep | +2 employer `SYSTEMS[origin].faction` | `MINING_REP` 190; 2150–2153 |
| Persist | `WORLD_FIELDS` `'jobs'`; autosave `rimward-save-v1` | `save.js` 65, 78 |
| Sanitize | hyphen tokens, proto drop, kind/state allowlist, cap `4+2*N_SYSTEMS+16` (**220** at 100 systems) | `save.js` 115–124, 193–205, 376–413 |
| Events | `'commLine'` only; no `job*` type | `ctx.js` 198–232 |
| UI | Digit 2; `h()` `textContent`; digit accept by index | 152, 2302–2307, 3179, 3303–3305 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| Commodities | bulk: `provisions`, `refinedMetals`, `rawOre`, `livingRock` | `state.js` 308–313 |
| `priceOf` | `COMMODITIES` book; survivor/data → 0 | `station.js` 1686–1691 |
| NPC routes | traders never hub-route | `world.js` 24–27 |

There is no `kind: 'trade'`. Unique haul/ferry are not renewable.

### Pain points

- Wishlist MSN-02 commodity trading: the only delivery cards are one-shot unique ids. A player who finishes `haul-provisions` cannot repeat that career.
- Mining already proves slot law, sanitize, expire, and employer rep. Trade must **share** that array without evicting mining.
- Live cap `4+2*N_SYSTEMS+16` (220) cannot hold two extra slots per system.
- Unique haul prices the **destination** dock; mining prices **origin**. The serial must pick one and not silently change unique haul (WAVE26 / WAVE35 pins).
- Patrol still writes hardcoded `freehold`. Copying that would mis-attribute trade standing.

### Why now (design) / why not now (code)

The owner asked for the MSN-02 trade brief after Wave 71 mining. Inventory and merge law exist. Implementation waits for a later serial so cap, kind allowlist, dest bind, and commodity seed land against a frozen contract instead of a drive-by fifth `makeJobs` row.

---

## Goals & Non-Goals

### Goals

1. Document the live board, unique four, mining slots, overlays, haul/ferry stamps, Digit 2, `sanitizeJobs`, and commodity table from **live code**.
2. Freeze extend-`world.jobs` (no new persist key) and a **raised** sanitize cap.
3. Freeze renewable **trade** as the next vertical slice: two slots, one-in-one-out, named other-system dest, bulk seed, origin `payQuoted`, 600 s fail-closed.
4. Freeze XSS / proto ids / stuffed pay / dest injection / duplicate-pay-on-restore law.
5. Name later families without inventing their numbers. MSN-03 stays later.
6. Freeze a serial PR plan: sanitize cap/kind → sync+accept+deliver → replace/expire → UI copy → boot pins.
7. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 75. No `src/` edits. No `scripts/` / `public/` / `package.json`.
- No HUD-02 chart marks. No AST `asteroidId`. No POD reopen. No SHP hull grants. No BIO graft. No EXP SKU. No TGT-05.
- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No parallel `world.missions` array. No new `WORLD_FIELDS`. No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows.
- Do not migrate `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` in this serial.
- Do not specify espionage, passenger ferry, faction-war, hunt, or exploration numbers.
- Do not invent police restitution (REP-03). Espionage vs REP-04 waits on a later REP brief.
- Do not edit the wishlist, `PROGRESS.md`, or sibling design docs.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Extend `world.jobs` | Already on `WORLD_FIELDS`. Contract §0.2 |
| Replace unique four? | **No** in this serial | Boot-test pins. Contract §0.4, §0.18 |
| First trade family kind? | **`trade`** (`kind: 'trade'`) | Must not collide with `'mining'` or unique `haul`/`ferry`. Contract §0.3 |
| Board slot? | 2 trade jobs per system (offered or accepted) | Mining precedent `MINING_SLOTS_PER_SYSTEM` 189. Contract §0.5 |
| Replacement? | Splice + immediate new trade job same system+slot | MSN-01. Contract §2.3 |
| Live cap? | `4+2*N_SYSTEMS+16` = **220** at 100 systems | `save.js` 117–119 |
| New cap? | `4+4*N_SYSTEMS+16` = **420** at 100 systems | 2 mining + 2 trade. Contract §0.6, §1.2 |
| Drop mining to fit? | **Never** honest offered mining | Contract §0.6 |
| Dest? | `otherSystemId(origin)`; pay rebinds that helper | Wave 35 haul 2186–2198; ferry stamp. Contract §0.7, §3.5 |
| Accept where? | Origin dock only for trade slots | Unique haul either-dock stays. Contract §3.6 |
| Player path? | Multi-gate OK | NPC hub-route lore is NPC-only (`world.js` 24–27) |
| Commodity? | bulk `COMMODITIES` except `livingRock`: `provisions`, `refinedMetals`, `rawOre` | Contract §0.8, §3.3 |
| `need` / margin? | `HAUL_UNITS` 5; `HAUL_MARGIN` 1.4 | cite 172–173. No new margin |
| `payQuoted`? | Stamp on accept via **origin** `jobPayFor`; clamp 0…20000 | Wave 26 + mining 2589–2590. Contract §0.9 |
| Deadline? | 600 s (`MINING_DEADLINE` / `WRECK_TTL`); restart on accept; expire fail closed | cite `station.js` 192; `world.js` 811. Contract §0.10 |
| Employer rep? | +2 `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS)` | `MINING_REP` 190. Not patrol `freehold`. Contract §0.11 |
| `innerHTML`? | **No** | Live `h()` is `textContent`. Contract §0.12 |
| Job ids | Hyphen **tokens**; trade id `trade-<SYSTEMS key>-<n>` | Never `SAFE_ID.test(job.id)`. Contract §0.14, §1.3 |
| UI | Jobs pane, Digit 2 only | Contract §0.12 |
| `state.js` | READ-ONLY | Contract §0.13 |
| New event? | **No** | Prefer `commLine`. Contract §0.13 |
| Espionage / MSN-03? | Later serials | Contract §0.15, §9 |

### 2. Current board (do not break)

See inventory §§1–6. The load-bearing loop is:

1. `initStation` → `ensureJobs` → `makeJobs` if empty (unique four).
2. Each Jobs render: refresh ace, sync pirates, sync recovery, **sync mining**.
3. Accept stamps haul/ferry quotes (dest `jobPayFor`) and mining quotes (origin `jobPayFor`); ferry fronts cargo.
4. Ticks complete patrol (frame), delivery (0.5 s). Mining expire/replace lives in that tick.
5. Unique `completeJob` marks `done` and banks dockmaster trust. Mining splices.

**This serial must not change step 1’s four ids or unique haul/ferry quote stamps or Wave 35 haul dest bind.** Trade is additive: extra sync on render, extra branch in delivery tick, extra cards in `boardJobs`, extra kind in `sanitizeJobs`.

Digit 2 and `DOCK_KEY_SERVICES` stay. Digit 0 stays shipyard.

### 3. Persist: raise `sanitizeJobs`

Restore already heals jobs (`save.js` 677). That is the trust boundary.

Later PR1: extend `sanitizeJobs`. Shape, hyphen-token ids, proto drop, **`'trade'` kind**, dest/commodity/slot, cap: contract §1.

**Ids:** live `SAFE_ID` (`/^[a-z0-9_]+$/i`) rejects hyphens. `bounty-ace` and `trade-freehold-0` must survive restore. Sanitize splits on `-` and runs the `SAFE_ID` character class on **each token**, then `RESERVED_IDS` on the full string and every token. Unique four are an exact allowlist. Do not rewrite them to underscores.

**Cap:** live `JOBS_SANITIZE_MAX = 4 + 2 × Object.keys(SYSTEMS).length + 16` (**220** at 100 systems, `state.js` 500–541). New: `4 + 4 × N_SYSTEMS + 16` (**420** at 100). A cap of 220 cannot hold two mining **and** two trade slots per system. Drop order never removes the unique four, accepted jobs, honest offered mining, or honest offered trade (one of two slots per `originSystem` per kind).

`ensureJobs` still seeds the unique four when the array is empty after heal. Trade fill is `syncTradeJobs`, not `makeJobs`. Mining fill stays `syncMiningJobs`.

### 4. Board slots and one-in-one-out

A **trade slot** is `kind === 'trade'` + `originSystem` + `slot` ∈ {0,1}. Independent from mining slots.

```
renderJobs
  → syncPirateBounties / syncRecoveryJob / syncMiningJobs (unchanged)
  → syncTradeJobs(currentId)   // fill missing slots only; skip if dest === origin

trade complete or expire
  → splice that job
  → push replacement for same originSystem + slot
  → render if the Jobs pane is open
```

Offered trade: home dock only (mining/pirate/recovery precedent).  
Accepted trade: visible on every Jobs board so the player can see dest name and deadline.

Unique `DONE` rows remain until a later serial. This slice must not add trade to that clutter (`failed` is transient).

Gates-less origin (`otherSystemId` returns self): **do not post**. Unique haul already cannot pay there.

### 5. Trade vertical slice

**Beats:**

1. Dock home → Jobs → two trade cards (bulk `provisions` / `refinedMetals` / `rawOre` to the named other system).
2. Accept. Reward, need, dest, employer, remaining time are visible before and after accept (wishlist acceptance).
3. Buy or already hold the units. Fly any path. Dock the named dest.
4. Delivery tick removes 5 units, pays `payQuoted`, +2 employer rep (origin faction), dockmaster trust as today, splice, new card on the **origin** board.
5. Ignore a card for 600 s: posting withdraws, replacement appears. Ignore an accepted card: fail closed, no pay, replacement.

**Not:** ferry fronting. **Not:** unique haul dest-dock `jobPayFor`. **Not:** a lock on a rock. Hold units of that commodity count (haul precedent; market fill of bulk is allowed). Accept only at the origin dock (`currentSystem === originSystem`); unique haul’s either-dock accept does **not** copy onto trade slots. `need` is exactly `HAUL_UNITS` 5 (sanitize drops any other trade need; do not heal stuffed 1-unit jobs).

**Pay:** `jobPayFor` at the **origin** dock, `HAUL_MARGIN` 1.4 × units × `priceOf`. Stamp `payQuoted` on accept so epic/faction shifts cannot move the agreement (Wave 26 law; mining origin stamp). Unique haul remains dest-priced.

**Dest bind:** pay uses `otherSystemId(origin)` (Wave 35). Stuffed `job.destSystem` cannot retarget payout. UI dest **name** also resolves through that helper + `SYSTEMS[dest].station.name`.

### 6. Deadlines

Live mining already uses `deadline` vs `world.time` and fails closed. Trade uses the same clock. Do not invent a third clock.

| State | Timer | On fire |
|---|---|---|
| offered | `deadline = postTime + 600` | withdraw, replace |
| accepted | `deadline = acceptTime + 600` (restarts) | fail closed, replace |

600 s is ~10 minutes. Five bulk units plus a one-gate hop at cruise 120 is well under honest play. The window is deliberately generous (MSN-01).

Expire must not call the pay path. A restored job with `deadline` in the past expires on the next 0.5 s tick.

There is no `failed` row left on the board after replace. `failed` exists so a crash mid-replace cannot pay twice (mining 2142–2143).

### 7. UI (Jobs pane only)

Stay inside `renderJobs`. Two menu levels remain (`station.js` header §12.1). Digit **2**. No new Digit. No HUD glance (HUD-02 closed).

Each trade card (all `textContent`):

- Title / detail from templates using `COMMODITIES[commodity].name` and dest station name from `otherSystemId` + `SYSTEMS`.
- Reward line with stamped or live quote (origin `jobPayFor` for offered; `payQuoted` for accepted).
- If offered: Accept (n). Deadline remaining as whole seconds or minutes (reuse mining label helper or a shared one).
- If accepted: `ACCEPTED — deliver N <name> to <dest> (have X) · t left`.

No `innerHTML`. No `job.faction` as a write source. `reducedMotion`: no extra animation; copy stays.

Home board can exceed 9 cards (unique four + overlays + 2 mining + 2 trade). Digit 1–9 cannot accept past index 8; **mouse Accept still works** (live 2674). That is existing UX, not a reason to cut to one slot (contract §12.2).

### 8. Reputation and later REP

Trade success writes **employer faction only**, `Object.hasOwn(FACTIONS, key)`, **+2** (mining). Expire writes nothing.

Do not copy patrol’s `reputation.freehold +=` (`station.js` 2095) into trade.

Espionage (secret success, exposed failure) and faction-vs-faction (employer up, target down) are wishlist REP-04. **MSN does not write that brief.** If those families need REP-01/03, the serial says “depends on later REP brief”.

### 9. Serial PR plan

Matches contract §8. **Named only. Do not implement in Wave 75.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'trade'` kind; `trade-<sys>-<n>` ids; dest/commodity/slot; cap `4+4*N_SYSTEMS+16`; proto / kind / state allowlist; unique four kept; honest mining kept | Sync, UI, pay, unique migration, whole-string `SAFE_ID` |
| **PR2 sync cards + accept + deliver** | fill 2 slots; accept; dest `otherSystemId`; origin `payQuoted`; dest-dock tick | Expire, replace, other families |
| **PR3 replace + expire** | one-in-one-out; 600 s fail closed | MSN-03, unique migration |
| **PR4 UI copy** | remaining time + dest + have/need; `textContent` only | HUD-02, Digit 0, People desk |
| **PR5 boot pins** | keep unique four + `mine-freehold-0` + `trade-freehold-0`; drop `trade-__proto__-0`; 200+200 fit 420; complete→new card; expire no pay; stuffed dest ignored; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS |

`state.js` untouched. Authored copy is strings in `station.js` / a tiny `jobs.js`, not a table dump.

### 10. Coupling

| Neighbour | Coupling | Law |
|---|---|---|
| Mining MSN | Shared `world.jobs`, `sanitizeJobs`, Digit 2, `tickDeliveryJobs`, `boardJobs` | Grow cap. Independent slots. Never drop honest mining. Do not reuse `kind: 'mining'` |
| EXP data | Data cargo is hangar rows, not job cargo | No `dataCrystal` / `dataCube` seeds. `priceOf` data stays 0 |
| POD survivors | People Digit 7 sale / rescue | No `survivor` on jobs. Do not use `addCargo('survivor')` |
| BIO grafts | `livingRock` is bio food | No `livingRock` seed. Feed Digit unchanged |
| SHP | Digit 0 shipyard; cargo-with-hull | No hull grants. Ordinary cargo rows only |
| TGT-05 | `ctx.targets` | Jobs do not write locks |
| REP | Standing bag | Employer +2 on success only. No patrol `freehold` copy. Espionage later (REP-04) |
| Unique haul/ferry | Same pane, same dest helper | Do not migrate ids. Do not change dest `jobPayFor` stamps |
| NPC traders | Hub-route lore | Player may multi-gate; pay is named dest |

### 11. Non-goals (expanded)

- Passenger ferry as survivor cargo (POD closed).
- Turning Standing epics into scripted quests (`epics.js` stays requirement auto-advance).
- Mystery clues as board jobs (EXP / later MSN).
- Bulk provenance tags on cargo rows.
- Police hail / restitution.
- Mission-granted ships, scanners, or mining heads (outfitter stays UU).
- Changing unique haul to origin pricing, or mining to dest pricing.
- `ctx.js` default `jobs: []` is optional; not required if `ensureJobs` remains the creator.

---

## Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Unique four vanish on restore | Exact allowlist; hyphen tokens; boot pins |
| Honest mining dropped for trade room | Cap 420; drop order never evicts honest mining or honest trade |
| Unique haul dest bind broken | Do not edit Wave 35 branch; PR5 still passes WAVE26/WAVE35 |
| Unreachable dest | Skip post when `otherSystemId(origin) === origin` |
| Dest injection | Pay rebinds `otherSystemId`; UI names from `SYSTEMS` |
| Foreign offered accept | `boardJobs` hides offered trade off-home; `acceptJob` also refuses if `currentSystem !== origin` |
| Stuffed `need` | Trade need must be exactly 5; else drop |
| Stuffed `payQuoted` | Clamp 0…20000 on sanitize and at pay |
| Duplicate pay on restore | `failed` before pay; splice; expire has no pay branch |
| `__proto__` job id | Token `RESERVED_IDS`; drop `trade-__proto__-0` |
| Save retargets employer | No `job.faction`; read `SYSTEMS[origin].faction` |
| XSS in titles | `textContent`; strip on restore; regen from templates |
| `livingRock` / data / survivor on board | Commodity allowlist §3.3 |
| Patrol freehold bleed copied | Trade uses dock `faction` |
| Digit overflow | Mouse Accept; do not cut slots |
| `state.js` dump | READ-ONLY |
| Boot-test unique ids | Untouched |
| New persist key | Forbidden |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | station (later maybe `jobs.js`); save sanitize | station |
| Unique four | `makeJobs` when empty | boot-test |
| Mining slots | `syncMiningJobs` / replace | `boardJobs` |
| Trade slots | `syncTradeJobs` / replace | `boardJobs` |
| `ctx.world.reputation` | trade complete → employer key | epics, standing, npc |
| `WORLD_FIELDS` `'jobs'` | save.js | restore |
| `state.js` | serial data owner only | **feature PRs read-only** |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (3382–3386).

---

## Acceptance direction (implementation wave)

From the wishlist, made testable for the **trade** slice:

1. A Freehold Jobs board shows two trade cards plus today’s unique/overlay/mining rows.
2. Accept → buy/hold 5 bulk units → dock named dest: card gone, credits up, **new** trade card on the origin board.
3. Completing again still yields a trade card (career does not exhaust).
4. Origin and dest are real `SYSTEMS` keys; dest = `otherSystemId(origin)` at pay; dest ≠ origin.
5. Commodity is `provisions` or `refinedMetals` or `rawOre`. Never `livingRock`, `survivor`, data keys.
6. Reward, need, dest name, and remaining time are visible before accept.
7. After 600 s accepted without delivery: no pay, card replaced, state not `DONE`.
8. Restore of `__proto__` / `trade-__proto__-0` drops those rows; unique four and `mine-freehold-0` and `trade-freehold-0` remain; 10k-length heals to ≤420; stuffed dest does not pay at the stuffed system; no throw; no extra credits.
9. Unique `haul-provisions` / `ferry-consignment` ids still exist. WAVE26 / WAVE35 behaviour unchanged.
10. No job field names an asteroid index. No new `WORLD_FIELDS`. No `innerHTML`.

---

## Open owner questions

Defaults in the contract §12 **stand**. None of them block impl.

No blocking owner question. A later owner may still override slot count, seed mix, or +2 vs 0 — until then, implement the defaults. Do not invent a new margin or a third clock while waiting.
