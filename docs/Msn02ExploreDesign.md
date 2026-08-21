# RIMWARD MSN-02 renewable exploration / information recovery

| Field | Value |
|---|---|
| **Title** | RIMWARD MSN-02 renewable exploration and information recovery |
| **Author** | Wave 77 MSN-02 explore integrator |
| **Date** | 2026-08-20 |
| **Status** | First impl Wave 78 (PR1–PR5). Design freeze Wave 77 still binds. |
| **Wave** | 78 — `kind: 'explore'` in save.js / station.js / boot-test WAVE78 explore pins. |
| **Owner request** | MSN-02 explore brief. Unique-four stay; no `state.js` write; no new persist key. |
| **Merge law** | [`out/w77/explore/shared-contract.md`](../out/w77/explore/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w77/explore/current-explore-inventory.md`](../out/w77/explore/current-explore-inventory.md) |
| Merge law | [`out/w77/explore/shared-contract.md`](../out/w77/explore/shared-contract.md) |
| Wave 78 security review | [`out/w78/explore/security-review.md`](../out/w78/explore/security-review.md) |
| Wave 78 code review | [`out/w78/explore/code-review.md`](../out/w78/explore/code-review.md) |
| Wave 78 UI audit | [`out/w78/explore/ui-audit.md`](../out/w78/explore/ui-audit.md) |

---

## Overview

Wishlist MSN-02 wants exploration and information recovery as a career. Live today: unique four are one-shot cards. Mining occupies two renewable slots per system (Wave 71). Trade occupies two more (Wave 76). Mystery already records landmark visits on `world.mystery.visited`. EXP crystals and cubes are hangar rows; the Assembly Archive desk lists but does not debit while UU is unset.

Wave 77 freezes persist (extend `world.jobs` + raise sanitize cap by **explore room only**), two explore slots, one-in-one-out, named landmark + system display names, origin `payQuoted`, 600 s fail-closed deadlines, employer-only +2, Digit 2 Jobs pane, §25 no-clue copy, no data-cargo grant, and the serial PR plan. Unique four stay. Missions other than renewable explore do not change here.

Do **not** migrate or delete the unique four. Do **not** invent espionage, faction-war, passenger, or hunt numbers. Do **not** seed `dataCrystal` / `dataCube` as job cargo. Espionage still depends on a later REP brief (REP-04). `src/game/state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “jobs, mystery, and EXP today”: [`out/w77/explore/current-explore-inventory.md`](../out/w77/explore/current-explore-inventory.md). Code wins over stale comments. Wave 70 / Wave 75 inventory line numbers are stale.

| Surface | Today | Cite |
|---|---|---|
| Owner | `station.js` creates `ctx.world.jobs` if empty | `ensureJobs` 1759–1761; `initStation` 2434 |
| Unique cards | ace bounty, patrol, haul Provisions, ferry Provisions | `makeJobs` 1724–1756 |
| Mining slots | two per system, `kind: 'mining'`, one-in-one-out | `MINING_SLOTS_PER_SYSTEM` 189 |
| Trade slots | two per system, `kind: 'trade'`, dest `otherSystemId` | `TRADE_SLOTS_PER_SYSTEM` 190; `syncTradeJobs` 2077–2099 |
| Overlays | pirate bounties cap 2; one recovery wreck | `PIRATE_BOUNTY_CAP` 187; recovery 1845–1855 |
| Unique complete | `state = 'done'`; trust/favor; no splice | `completeJob` 2202–2205 |
| Mining/trade complete | `failed` first, pay, splice, replace | `tickDeliveryJobs` 2252–2347 |
| Board filter | hide foreign **offered** pirate/recovery/mining/trade; show unique `DONE` | `boardJobs` 2132–2142 |
| Haul dest | Wave 35: `otherSystemId(origin)` named dest | 1711–1713, 2373–2385 |
| Mystery | `found` (clue ids), `visited` (landmark ids), `charted` | `mystery.js` 44, 107–128; `contacts.js` 387–402 |
| Landmark names | authored + generated `{ id, name, kind, position, line }` | `authored-systems.js` 56–58; `galaxy.generated.js` 16–26 |
| Landmark coverage | 100 / 100 systems have ≥1 named landmark | inventory §9 |
| §25 | HUD/People use display names; never clue id/text | `hud.js` 29–30, 1421–1432; `galaxychart.js` 14–19 |
| EXP rows | hangar `dataCrystal` / `dataCube` + provenance | `data-trade.js` 5–14, 72–85 |
| EXP desk | Assembly Market only; UU unset → no debit | `station.js` 1098–1105, 1179–1228 |
| `priceOf` data | 0 | 1689–1693 |
| Drop % | unset (`null`) → skip spawn | `data-trade.js` 23, 119–125 |
| Persist jobs | `WORLD_FIELDS` `'jobs'`; autosave `rimward-save-v1` | `save.js` 65, 75–79 |
| Persist mystery | `'mystery'` already on `WORLD_FIELDS` | `save.js` 79 |
| Sanitize | hyphen tokens, proto drop, kind/state allowlist, cap `4+4*N+16` (**420** at 100) | `save.js` 115–128, 197–208, 407–447 |
| Events | `'commLine'` plus existing `'clueFound'` / `'landmarkFound'` from mystery | `ctx.js` 198–208 |
| UI | Digit 2; `h()` `textContent`; digit accept by index | 152, 2489–2494, 3424–3427, 3548–3550 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| Unknowables dock | **no** `SYSTEMS` row | inventory §0; `FACTIONS.unknowables` 563 |

There is no `kind: 'explore'`. Unique haul/ferry are not renewable. Landmark visits exist but have no Jobs card.

### Pain points

- Wishlist MSN-02 exploration: the board has no survey career. A player who finds The Shepherd gets a comm line, not a renewable contract.
- Mining and trade already prove slot law, sanitize, expire, and employer rep. Explore must **share** that array without evicting them.
- Live cap `4+4*N_SYSTEMS+16` (420) cannot hold two extra slots per system.
- EXP data is hangar cargo with unset drop % and unset Archive UU. A worker who pays in crystals would invent owner-open numbers.
- Patrol still writes hardcoded `freehold`. Copying that, or writing Assembly/Unknowables as a second bag key, would mis-attribute standing.
- §25 forbids clue text and clue ids in player copy. A stuffed landmark id on the card would leak internals.

### Why now (design) / why not now (code)

The owner asked for the MSN-02 explore brief after Wave 76 trade. Inventory and merge law exist. Implementation waits for a later serial so cap, kind allowlist, site bind, and §25 copy land against a frozen contract instead of a drive-by sixth `makeJobs` row.

---

## Goals & Non-Goals

### Goals

1. Document the live board, unique four, mining/trade slots, overlays, mystery visited/charted, Digit 2, `sanitizeJobs`, and EXP desk from **live code**.
2. Freeze extend-`world.jobs` (no new persist key) and a **raised** sanitize cap: live 420 **plus explore room only**.
3. Freeze renewable **explore** as the next vertical slice: two slots, one-in-one-out, named landmark on `SYSTEMS`, origin `payQuoted`, 600 s fail-closed, credits + employer +2 only.
4. Freeze XSS / proto ids / stuffed pay / dest/landmark injection / clue-id leak / duplicate-pay-on-restore law.
5. Name later families without inventing hunt, passenger, or espionage numbers. MSN-03 stays later.
6. Freeze a serial PR plan: sanitize cap/kind → sync+accept+complete → replace/expire → UI copy → boot pins.
7. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 77. No `src/` edits. No `scripts/` / `public/` / `package.json`.
- No HUD-02 chart marks writes. No AST `asteroidId`. No POD reopen. No SHP hull grants. No BIO graft. No EXP SKU / drop % / Archive UU. No TGT-05.
- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No parallel `world.missions` or `world.explored` array. No new `WORLD_FIELDS`. No new frozen event.
- No `state.js` feature rewrite. No Unknowables dock.
- Do not migrate `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` in this serial.
- Do not specify hunt, passenger, espionage, or faction-war numbers.
- Do not invent police restitution (REP-03). Espionage vs REP-04 waits on a later REP brief.
- Do not edit the wishlist, `PROGRESS.md`, or sibling design docs / sibling `out/w77/{hunt,passenger}`.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Extend `world.jobs`. Read `mystery.visited` | Already on `WORLD_FIELDS`. Contract §0.2 |
| Replace unique four? | **No** in this serial | Boot-test pins. Contract §0.4, §0.18 |
| First explore family kind? | **`explore`** (`kind: 'explore'`) | Must not collide with mining/trade or unique/recovery kinds. Contract §0.3 |
| Board slot? | 2 explore jobs per system (offered or accepted) | Mining/trade precedent `station.js` 189–190. Contract §0.5 |
| Replacement? | Splice + immediate new explore job same system+slot | MSN-01. Contract §2.3 |
| Live cap? | `4+4*N_SYSTEMS+16` = **420** at 100 systems | `save.js` 115–122 |
| New cap? | `LIVE_CAP_AT_IMPL + EXPLORE_ROOM` = `4+6*N+16` = **620** at 100 | 2 mining + 2 trade + 2 explore. **No hunt/passenger rooms.** Contract §0.6, §1.2 |
| Drop mining or trade to fit? | **Never** honest offered mining or trade | Contract §0.6 |
| Site? | Origin `SYSTEMS.landmarks[slot % len]`; dest fallback via `otherSystemId` only if origin table empty | Inventory: 100/100 have landmarks. Contract §0.7–0.8, §2.2 |
| Asteroid UUID? | **Forbidden** | AST. Contract §0.7 |
| Clue bind? | **Forbidden** | §25. Contract §0.12, §4 |
| Accept where? | Origin dock only for explore slots | Mining/trade. Contract §3.6 |
| Player path? | Fly to named landmark; multi-gate OK if site is a dest fallback | NPC hub-route lore is NPC-only (`world.js` 24–27) |
| Cargo seed? | **None.** No `dataCrystal` / `dataCube` / `survivor` / `livingRock` | Contract §0.4, §3.3 |
| Data grant on complete? | **No.** Owner-open drop % / Archive UU stay out | `data-trade.js` 23; `ARCHIVE_UU` 1098. Contract §0.4, §3.4 |
| `need` / pay? | `need` 1; origin `jobPayFor(round(RECOVERY_REWARD * HAUL_MARGIN))` | 176, 173. Contract §0.9 |
| `payQuoted`? | Stamp on accept via **origin** `jobPayFor`; clamp 0…20000 | Wave 26 + mining 2777. Contract §0.9 |
| Deadline? | 600 s (`MINING_DEADLINE` / `WRECK_TTL`); restart on accept; expire fail closed | cite `station.js` 193; `world.js` 811. Contract §0.10 |
| Employer rep? | +2 `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS)` | `MINING_REP` 191. Not patrol `freehold`. Not a second Assembly write. Contract §0.11 |
| `innerHTML`? | **No** | Live `h()` is `textContent`. Contract §0.12 |
| Job ids | Hyphen **tokens**; explore id `explore-<SYSTEMS key>-<n>` | Never `SAFE_ID.test(job.id)`. Contract §0.14, §1.3 |
| UI | Jobs pane, Digit 2 only. Display names only | Contract §0.12, §4 |
| `state.js` | READ-ONLY | Contract §0.13 |
| New event? | **No** | Prefer `commLine`. Do not emit clue events from jobs. Contract §0.13, §6 |
| Hunt / passenger / MSN-03? | Later / sibling serials | Contract §0.15, §9 |

### 2. Current board (do not break)

See inventory §§1–7. The load-bearing loop is:

1. `initStation` → `ensureJobs` → `makeJobs` if empty (unique four).
2. Each Jobs render: refresh ace, sync pirates, sync recovery, sync mining, **sync trade**.
3. Accept stamps haul/ferry quotes (dest `jobPayFor`) and mining/trade quotes (origin `jobPayFor`); ferry fronts cargo.
4. Ticks complete patrol (frame), delivery (0.5 s). Mining/trade expire/replace live in that tick.
5. Unique `completeJob` marks `done` and banks dockmaster trust. Mining/trade splice.

**This serial must not change step 1’s four ids or unique haul/ferry quote stamps or Wave 35 haul dest bind.** Explore is additive: extra sync on render, extra branch in delivery tick, extra cards in `boardJobs`, extra kind in `sanitizeJobs`.

Digit 2 and `DOCK_KEY_SERVICES` stay. Digit 0 stays shipyard.

### 3. Persist: raise `sanitizeJobs`

Restore already heals jobs (`save.js` 711). That is the trust boundary.

Later PR1: extend `sanitizeJobs`. Shape, hyphen-token ids, proto drop, **`'explore'` kind**, slot, cap: contract §1.

**Ids:** live `SAFE_ID` (`/^[a-z0-9_]+$/i`) rejects hyphens. `bounty-ace` and `explore-freehold-0` must survive restore. Sanitize splits on `-` and runs the `SAFE_ID` character class on **each token**, then `RESERVED_IDS` on the full string and every token. Unique four are an exact allowlist. Do not rewrite them to underscores.

**Cap:** live `JOBS_SANITIZE_MAX = 4 + 4 × Object.keys(SYSTEMS).length + 16` (**420** at 100 systems, `state.js` 541). New: `LIVE_CAP_AT_IMPL + EXPLORE_SLOTS_PER_SYSTEM × N_SYSTEMS` = `4 + 6 × N_SYSTEMS + 16` (**620** at 100). A cap of 420 cannot hold two mining **and** two trade **and** two explore slots per system. Do **not** add hunt or passenger rooms here. Drop order never removes the unique four, accepted jobs, honest offered mining, honest offered trade, or honest offered explore (one of two slots per `originSystem` per kind).

`ensureJobs` still seeds the unique four when the array is empty after heal. Explore fill is `syncExploreJobs`, not `makeJobs`. Mining fill stays `syncMiningJobs`. Trade fill stays `syncTradeJobs`.

Do not add `WORLD_FIELDS` `'explored'`. `mystery.visited` is enough.

### 4. Board slots and one-in-one-out

An **explore slot** is `kind === 'explore'` + `originSystem` + `slot` ∈ {0,1}. Independent from mining and trade slots.

```
renderJobs
  → syncPirateBounties / syncRecoveryJob / syncMiningJobs / syncTradeJobs (unchanged)
  → syncExploreJobs(currentId)   // fill missing slots only; skip if no reachable site

explore complete or expire
  → splice that job
  → push replacement for same originSystem + slot
  → render if the Jobs pane is open
```

Offered explore: home dock only (mining/pirate/recovery/trade precedent).  
Accepted explore: visible on every Jobs board so the player can see landmark name, system name, and deadline.

Unique `DONE` rows remain until a later serial. This slice must not add explore to that clutter (`failed` is transient).

No reachable landmark (empty origin table and empty/unusable dest fallback): **do not post**. Inventory today: every system has a landmark, so honest play always posts.

### 5. Explore vertical slice

**Beats:**

1. Dock home → Jobs → two explore cards (named landmark in a named system; origin is the file dock).
2. Accept. Reward, site name, employer, remaining time are visible before and after accept (wishlist acceptance).
3. Fly to the named landmark (100 u discovery already on `mystery.js`). If the player already visited it, that counts (information recovery).
4. Redock origin. Delivery tick pays `payQuoted`, +2 employer rep (origin faction), dockmaster trust as today, splice, new card on the **origin** board.
5. Ignore a card for 600 s: posting withdraws, replacement appears. Ignore an accepted card: fail closed, no pay, replacement.

**Not:** ferry fronting. **Not:** unique haul dest-dock `jobPayFor`. **Not:** a lock on a rock. **Not:** Archive filing. **Not:** a crystal in the hold. Accept only at the origin dock (`currentSystem === originSystem`). `need` is exactly **1** (sanitize drops any other explore need).

**Pay:** `jobPayFor` at the **origin** dock, `Math.round(RECOVERY_REWARD * HAUL_MARGIN)` (300 × 1.4 = 420 before epic). Stamp `payQuoted` on accept so epic/faction shifts cannot move the agreement (Wave 26 law; mining/trade origin stamp). Unique haul remains dest-priced.

**Site bind:** pay and progress use `resolveExploreSite(origin, slot)` from live `SYSTEMS` (contract §2.2). Stuffed `job.destSystem` or stuffed landmark id cannot retarget payout. UI names also resolve through that helper + `landmarks[i].name` + `SYSTEMS[site].name`.

**Already visited:** legal. Same class as mining when the hold already has ore. Do not invent a visit-time world key.

### 6. Deadlines

Live mining/trade already use `deadline` vs `world.time` and fail closed. Explore uses the same clock. Do not invent a third clock.

| State | Timer | On fire |
|---|---|---|
| offered | `deadline = postTime + 600` | withdraw, replace |
| accepted | `deadline = acceptTime + 600` (restarts) | fail closed, replace |

600 s is ~10 minutes. A same-system landmark hop at cruise is well under honest play. The window is deliberately generous (MSN-01).

Expire must not call the pay path. A restored job with `deadline` in the past expires on the next 0.5 s tick.

There is no `failed` row left on the board after replace. `failed` exists so a crash mid-replace cannot pay twice (mining 2280–2281).

### 7. UI (Jobs pane only)

Stay inside `renderJobs`. Two menu levels remain (`station.js` header §12.1). Digit **2**. No new Digit. No HUD glance (HUD-02 closed).

Each explore card (all `textContent`):

- Title / detail from templates using landmark **display name** and system **display name**.
- Reward line with stamped or live quote (origin `jobPayFor` for offered; `payQuoted` for accepted).
- If offered: Accept (n). Deadline remaining as whole seconds or minutes (reuse `miningTimeLeftLabel`).
- If accepted: `ACCEPTED — survey <landmarkName> in <systemName> · t left`.

**Never** print `fh_shepherd`, clue lines, clue ids, or `mystery.visited`.

No `innerHTML`. No `job.faction` as a write source. `reducedMotion`: no extra animation; copy stays.

Home board can exceed 9 cards (unique four + overlays + 2 mining + 2 trade + 2 explore). Digit 1–9 cannot accept past index 8; **mouse Accept still works** (live 2909, 3548–3550). That is existing UX, not a reason to cut to one slot (contract §12.2).

### 8. Reputation, EXP, and later REP

Explore success writes **employer faction only**, `Object.hasOwn(FACTIONS, key)`, **+2** (mining/trade). Expire writes nothing.

Do not copy patrol’s `reputation.freehold +=` (`station.js` 2233) into explore.

Assembly and Unknowables hunger is flavor in authored sentences only. Do **not** write `reputation.assembly` or `reputation.unknowables` as a second delta. Unknowables have no dock (Wave 42).

Completing explore does **not** add a data hangar row, call `spawnDataPod`, or run Archive confirm. Drop rate and desk UU stay owner-open and **out of this family**. Mark any later data-grant **proposed, needs owner**.

Espionage and faction-vs-faction are wishlist REP-04. **MSN does not write that brief.**

### 9. Serial PR plan

Matches contract §8. **Named only. Do not implement in Wave 77.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'explore'` kind; `explore-<sys>-<n>` ids; slot/deadline; no commodity copy; cap `4+6*N_SYSTEMS+16`; proto / kind / state allowlist; unique four kept; honest mining kept; honest trade kept | Sync, UI, pay, unique migration, whole-string `SAFE_ID`, hunt/passenger rooms |
| **PR2 sync cards + accept + complete** | fill 2 slots; accept; site `resolveExploreSite`; origin `payQuoted`; tick `mystery.visited` + origin dock | Expire, replace, data grants, other families |
| **PR3 replace + expire** | one-in-one-out; 600 s fail closed | MSN-03, unique migration |
| **PR4 UI copy** | remaining time + landmark display name + system display name; `textContent` only | HUD-02, Digit 0, People desk, clue ids |
| **PR5 boot pins** | keep unique four + `mine-freehold-0` + `trade-freehold-0` + `explore-freehold-0`; drop `explore-__proto__-0`; 200+200+200 fit 620; complete→new card; expire no pay; stuffed dest/landmark ignored; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS; drop %; Archive UU |

`state.js` untouched. Authored copy is strings in `station.js` / a tiny `jobs.js`, not a table dump.

### 10. Coupling

| Neighbour | Coupling | Law |
|---|---|---|
| Mining MSN | Shared `world.jobs`, `sanitizeJobs`, Digit 2, `tickDeliveryJobs`, `boardJobs` | Grow cap by explore room. Independent slots. Never drop honest mining. Do not reuse `kind: 'mining'` |
| Trade MSN | Same array; live cap already 420 | Never drop honest trade. Do not reuse `kind: 'trade'` |
| Hunt / passenger | Sibling Wave 77 | **Do not** add their rooms to this cap formula |
| EXP data | Data cargo is hangar rows, not job cargo | No `dataCrystal` / `dataCube` seeds or grants. `priceOf` data stays 0 |
| Mystery | `mystery.visited` is the completion signal | Read only. Do not steal `mystery.js`. Do not print ids |
| Landmarks | Display names on `SYSTEMS` | Wave 14 names OK. No asteroid UUID |
| POD survivors | People Digit 7 sale / rescue | No `survivor` on jobs |
| BIO grafts | `livingRock` is bio food | No `livingRock` seed |
| SHP | Digit 0 shipyard | No hull grants |
| TGT-05 | `ctx.targets` | Jobs do not write locks |
| REP | Standing bag | Employer +2 on success only. No patrol `freehold` copy. No second Assembly write |
| Unique haul/ferry | Same pane, same dest helper | Do not migrate ids. Do not change dest `jobPayFor` stamps |
| Unknowables | No station | Do not add a dock |

### 11. Non-goals (expanded)

- Passenger ferry as survivor cargo (POD closed; sibling worker).
- Local pirate hunt numbers (sibling worker).
- Turning Standing epics into scripted quests (`epics.js` stays requirement auto-advance).
- Mystery **clues** as board jobs.
- Converting landmarks into data cargo.
- Police hail / restitution.
- Mission-granted ships, scanners, or mining heads (outfitter stays UU).
- Changing unique haul to origin pricing, or mining to dest pricing.
- `ctx.js` default `jobs: []` is optional; not required if `ensureJobs` remains the creator.

---

## Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Unique four vanish on restore | Exact allowlist; hyphen tokens; boot pins |
| Honest mining/trade dropped for explore room | Cap 620; drop order never evicts honest mining, trade, or explore |
| Hunt/passenger rooms eaten or pre-allocated | Cap formula is live 420 + explore room **only** |
| Unique haul dest bind broken | Do not edit Wave 35 branch; PR5 still passes WAVE26/WAVE35 |
| Unreachable site | Skip post when `resolveExploreSite` is null |
| Dest / landmark injection | Pay rebinds live `SYSTEMS` table; UI names from display fields |
| Clue id/text in UI | Templates use `lm.name` + system display name only |
| Foreign offered accept | `boardJobs` hides offered explore off-home; `acceptJob` also refuses if `currentSystem !== origin` |
| Stuffed `need` | Explore need must be exactly 1; else drop |
| Stuffed `payQuoted` | Clamp 0…20000 on sanitize and at pay |
| Duplicate pay on restore | `failed` before pay; splice; expire has no pay branch |
| `__proto__` job id | Token `RESERVED_IDS`; drop `explore-__proto__-0` |
| Save retargets employer | No `job.faction`; read `SYSTEMS[origin].faction` |
| XSS in titles | `textContent`; strip on restore; regen from templates |
| Data / survivor / livingRock on board | No commodity field on explore; drop if copied |
| Invented drop % / Archive UU | Complete pays credits +2 only |
| Patrol freehold bleed copied | Explore uses dock `faction` |
| Digit overflow | Mouse Accept; do not cut slots |
| `state.js` dump | READ-ONLY |
| Boot-test unique ids | Untouched |
| New persist key | Forbidden |
| WAVE4 / WAVE26 / WAVE35 | Not this family’s bugs |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | station (later maybe `jobs.js`); save sanitize | station |
| Unique four | `makeJobs` when empty | boot-test |
| Mining slots | `syncMiningJobs` / replace | `boardJobs` |
| Trade slots | `syncTradeJobs` / replace | `boardJobs` |
| Explore slots | `syncExploreJobs` / replace | `boardJobs` |
| `ctx.world.mystery.visited` | mystery.js | explore tick (read) |
| `ctx.world.reputation` | explore complete → employer key | epics, standing, npc |
| `WORLD_FIELDS` `'jobs'` `'mystery'` | save.js | restore |
| `state.js` | serial data owner only | **feature PRs read-only** |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (3627–3631).

---

## Acceptance direction (implementation wave)

From the wishlist, made testable for the **explore** slice:

1. A Freehold Jobs board shows two explore cards plus today’s unique/overlay/mining/trade rows.
2. Accept → fly to The Shepherd (or already visited) → redock origin: card gone, credits up, **new** explore card on the origin board.
3. Completing again still yields an explore card (career does not exhaust).
4. Origin is a real `SYSTEMS` key. Site landmark is on that system’s `landmarks` table (or dest fallback). Site ≠ an asteroid index.
5. Player copy names The Shepherd and Freehold Drift (display). It never names `fh_shepherd` or a clue id.
6. Reward, site name, and remaining time are visible before accept.
7. After 600 s accepted without file: no pay, card replaced, state not `DONE`.
8. Restore of `__proto__` / `explore-__proto__-0` drops those rows; unique four and `mine-freehold-0` and `trade-freehold-0` and `explore-freehold-0` remain; 10k-length heals to ≤620; stuffed dest/landmark does not retarget pay; no throw; no extra credits; no new data hangar row.
9. Unique `haul-provisions` / `ferry-consignment` ids still exist. WAVE26 / WAVE35 behaviour unchanged.
10. No job field names an asteroid index. No new `WORLD_FIELDS`. No `innerHTML`. No Archive debit. No drop %.

---

## Open owner questions

Defaults in the contract §12 **stand**. None of them block impl.

No blocking owner question. A later owner may still override slot count, already-visited counting, or +2 vs 0 — until then, implement the defaults. Do not invent a drop percent, Archive UU, or a third clock while waiting. Any data-grant stays **proposed, needs owner**.
