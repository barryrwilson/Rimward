# Wave 79 — live jobs / overlays / hunt vs Named Guns / reputation / patrol hunt floor

**Wave:** 79. Design only. Code wins over stale comments and over Wave 70/75/77 inventory line numbers.  
**Locked sources:** `src/systems/station.js`, `src/game/save.js`, `src/game/world.js`, `src/systems/npc.js`, `src/core/ctx.js`, `src/game/state.js` (READ-ONLY), `src/game/authored-systems.js`, `src/game/data-trade.js`.  
**Not this file’s job:** implement war jobs. Do not treat comment banners in `station.js` as law. Do not wait on sibling `out/w79/rep04` or `out/w79/espionage`.

If this inventory and live code disagree, **live code wins**. Re-sample before an implementation wave.

---

## 0. What exists (one page)

There is **no** `kind: 'war'`. Live `JOB_KINDS` is `bounty | patrol | haul | ferry | recovery | mining | trade | hunt | passenger | explore` (`save.js` 138). A stuffed `kind: 'war'` row **drops today**.

Renewable Jobs families live today (two slots per system each):

| Kind | Slots const | Sync | Cite |
|---|---|---|---|
| mining | `MINING_SLOTS_PER_SYSTEM = 2` | `syncMiningJobs` | `station.js` 189, ~1940 |
| trade | `TRADE_SLOTS_PER_SYSTEM = 2` | `syncTradeJobs` | `station.js` 190, ~2099 |
| hunt | `HUNT_SLOTS_PER_SYSTEM = 2` | `syncHuntJobs` | `station.js` 191, 2291–2325 |
| passenger | `PASSENGER_SLOTS_PER_SYSTEM = 2` | `syncPassengerJobs` | `station.js` 192, ~2428 |
| explore | `EXPLORE_SLOTS_PER_SYSTEM = 2` | `syncExploreJobs` | `station.js` 193, 2556–2577 |

Unique four still occupy four rows (`makeJobs` `station.js` 1732–1765). Overlay pirate (`kind: 'bounty'`, `bounty-pirate-*`, cap 2) and one recovery overlay share sanitize headroom 16.

**Faction-level pirate threat** is unique `bounty-ace` plus Named Gun records (`role: 'ace'`). That is **not** renewable. Wishlist MSN-02 splits “hunting a faction-level pirate threat” from “faction-against-faction operations”. This family is the second. Hunt (`kind: 'hunt'`) already owns local pirates.

**Overt employer/target standing** is wishlist REP-04 (`PLAYER-EXPERIENCE-WISHLIST.md` 530–531) and `docs/RepStandingDesign.md` §7: employer up, target down, live tables not `job.faction`. Live code writes **employer +2 only** on mining/trade/hunt/passenger/explore. **No** live target-faction write on Jobs complete. Patrol still hardcodes `reputation.freehold += PATROL_REP`. Overlay bounty writes **no** rep.

---

## 1. Persist

| Surface | Live law | Cite |
|---|---|---|
| Autosave key | `'rimward-save-v1'` | `save.js` 65 |
| Named slots | `rimward-save-v1-slot-1..3` | `save.js` 66 |
| `WORLD_FIELDS` includes `'jobs'` | yes; also `'records'`, `'recordBanks'`, `'incidents'`, `'reputation'` | `save.js` 75–97 |
| New war persist key? | **none** | — |
| Restore heal | `sanitizeRestored` → `sanitizeJobs` then `sanitizeReputation` | `save.js` 864–865 |
| `SAFE_ID` | `/^[a-z0-9_]+$/i` — **rejects hyphens** | `save.js` 101 |
| `RESERVED_IDS` | `__proto__`, `prototype`, `constructor`, … | `save.js` 106–110 |
| `ID_MAX` / `NAME_MAX` | 64 / 40 | `save.js` 103–102 |
| Job id grammar | hyphen **tokens**; do **not** `SAFE_ID.test` the full id | `save.js` 209–221 |
| `JOB_KINDS` | bounty, patrol, haul, ferry, recovery, mining, trade, hunt, passenger, explore. **No `'war'`** | `save.js` 138 |
| `JOB_STATES` | offered, accepted, done, failed | `save.js` 139 |
| Unique four map | `bounty-ace`→`bounty`, `patrol-lane`→`patrol`, `haul-provisions`→`haul`, `ferry-consignment`→`ferry` | `save.js` 140–145 |
| Field allowlist | **no `faction`**; has `target`, `wreckId`, `slot`, `deadline`, `payQuoted`, `destSystem`, `recordId` | `save.js` 146–151 |
| `PAY_QUOTED_MAX` | **20000** | `save.js` 130 |
| Family slot twins | mining/trade/hunt/passenger/explore all **2** | `save.js` 115–119 |
| Overlay headroom | **16** | `save.js` 120 |
| `N_SYSTEMS` | `Object.keys(SYSTEMS).length` — authored 6 + generated 94 | `save.js` 121; `state.js` 12–18, 541 |
| **LIVE cap** | `4 + 2N + 2N + 2N + 2N + 2N + 16` = `4 + 10*N + 16` | `save.js` 123–129 |
| Cap at 100 systems | **1020** | arithmetic; wishlist `PLAYER-EXPERIENCE-WISHLIST.md` 547 |
| `RECORD_ID` | `/^rec-(0|[1-9][0-9]*)$/` | `save.js` 135 |
| Hunt/passenger/explore need | **1** | `save.js` 132–134 |
| Trade need | **5** (`HAUL_UNITS`) | `save.js` 131 |
| Reputation heal | `Object.keys`; drop reserved; keep only `Object.hasOwn(FACTIONS, key)` | `save.js` 672–691 |

**Cap arithmetic (inventory-time, code):**

```
N_SYSTEMS            = Object.keys(SYSTEMS).length        // 100
MINING_ROOM          = 2 * N_SYSTEMS                      // 200
TRADE_ROOM           = 2 * N_SYSTEMS                      // 200
HUNT_ROOM            = 2 * N_SYSTEMS                      // 200
PASSENGER_ROOM       = 2 * N_SYSTEMS                      // 200
EXPLORE_ROOM         = 2 * N_SYSTEMS                      // 200
OVERLAY_HEADROOM     = 16
JOBS_SANITIZE_MAX    = 4 + 10*N_SYSTEMS + 16
                     = 1020 at 100 systems
```

There is **no** war room in the live formula. There is **no** espionage room. A sibling Wave 79 worker owns espionage room; this family must not bake it in.

### 1.1 `sanitizeOneJob` (non-unique kinds)

| Kind | Id rule | Extra | Cite |
|---|---|---|---|
| Unique four | exact id + mapped kind | — | `save.js` 268–269 |
| mining | 3 tokens `mine`, `sysId`, `n`; `originSystem === sysId`; slot 0\|1 | ore commodity | `save.js` 270–273, 323–332 |
| trade | 3 tokens `trade`, `sysId`, `n`; dest ≠ origin; `need === 5`; no `livingRock` | dest required | `save.js` 274–277, 333–345 |
| hunt | 3 tokens `hunt`, `sysId`, `n`; `recordId`; `need === 1`; deadline required | target required | `save.js` 278–281, 346–356, 405 |
| passenger | 3 tokens `passenger`, `sysId`, `n`; dest ≠ origin; `need === 1`; no commodity | dest required | `save.js` 282–285, 356–364 |
| explore | 3 tokens `explore`, `sysId`, `n`; `need === 1`; deadline required | no dest required | `save.js` 286–289, 365–370, 407 |
| bounty (non-unique) | prefix `bounty-pirate-`, ≥3 tokens; **requires** `system` | target required | `save.js` 290–291, 379–382 |
| recovery | prefix `recovery-`; `wreckId` hyphen-token; `originSystem` | — | `save.js` 292–293, 371–378 |
| anything else (incl. `'war'`) | **drop** | — | `save.js` 294–296 |

Unknown keys are not copied (`save.js` 253–261). Prototype / reserved **field** keys skip (`save.js` 257). `payQuoted` clamps 0…20000 (`save.js` 229–234, 393–396). Hunt sanitize also drops ineligible `recordId` when the origin bank exists (`huntSanitizeKeepsRecord` `save.js` 442–450).

### 1.2 Cap drop order (live)

`dropJobsUntilCap` walks index `for` (`save.js` 531–544). Order (`save.js` 562–598):

1. Extra mining on a slot (keep lowest `n`; never drop `accepted` / unique).
2. Extra trade on a slot (same).
3. Extra hunt on a slot **or** duplicate hunt `recordId`.
4. Extra passenger on a slot.
5. Extra explore on a slot.
6. `done`/`failed` mining, trade, hunt, passenger, or explore.
7. `done` recovery; `done` `bounty-pirate-*`.
8. Tamper last resort: offered pirate whose `system !== currentSystem`; offered recovery off-current.

**Never drop:** unique four; any `accepted` job; honest offered mining/trade/hunt/passenger/explore (one of two slots per `originSystem`).

---

## 2. Station jobs board

| Surface | Live law | Cite |
|---|---|---|
| Overlay pirate cap | `PIRATE_BOUNTY_CAP = 2` | `station.js` 187 |
| Overlay fallback UU | `PIRATE_BOUNTY_FALLBACK = 400` | `station.js` 188 |
| Family slots | mining/trade/hunt/passenger/explore **2** | `station.js` 189–193 |
| Employer rep | `MINING_REP = 2` | `station.js` 194 |
| Deadline | `MINING_DEADLINE = 600` (cites `WRECK_TTL`) | `station.js` 195–196 |
| Wreck TTL | `WRECK_TTL = 600` | `world.js` 811 |
| Patrol unique | `PATROL_REWARD 300`, `PATROL_REP 5`, `PATROL_NEED 2` | `station.js` 169–171 |
| Haul | `HAUL_UNITS 5`, `HAUL_MARGIN 1.4` | `station.js` 172–173 |
| Ferry unique | `FERRY_UNITS 4`, `FERRY_REWARD 350` | `station.js` 174–175 |
| Recovery overlay | `RECOVERY_REWARD 300` | `station.js` 176 |
| Explore pay base | `Math.round(RECOVERY_REWARD * HAUL_MARGIN)` = **420** | `station.js` 2508–2510 |
| `PAY_QUOTED_MAX` | 20000 (station twin) | `station.js` 204 |
| Default ace | name `'Carver Illyx'`, bounty 2500 | `station.js` 185–186 |
| Digit 2 Jobs | `DOCK_KEY_SERVICES[1] === 'jobs'`; hotkey `i+1` | `station.js` 152, 4306–4400 |
| `h()` | `textContent` only | `station.js` 3208–3213 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| Digit accept | index into `boardJobs` | `station.js` 4428–4431 |
| Jobs tick | docked or not; 0.5 s `tickDeliveryJobs` | `station.js` 4508–4512 |
| Patrol tick | every frame `tickPatrolJob` | `station.js` 2768–2786, 4509 |
| `initStation` | `ensureJobs` | `station.js` 3153 |
| `ensureJobs` | empty array → `makeJobs` | `station.js` 1767–1769 |
| Primary-gate dest | `otherSystemId` = `gates[0].to` | `station.js` 1718–1721 |
| Board refresh | `maybeRefreshJobsBoard` if Jobs pane open | `station.js` 2000–2003 |

### 2.1 Unique four (`makeJobs`)

Exact ids (`station.js` 1732–1765):

1. `bounty-ace` / `kind: 'bounty'` / `target: aceName` — faction-level Named Gun card.
2. `patrol-lane` / `kind: 'patrol'` — kill/drive off **2 local pirates**; +5 Freehold.
3. `haul-provisions` / `kind: 'haul'`.
4. `ferry-consignment` / `kind: 'ferry'` — Provisions consignment, not people.

Completing unique cards sets `done` (`completeJob` `station.js` 2746–2750). **No splice.**

### 2.2 Overlay pirates vs hunt family vs Named Guns

| Surface | Live law | Cite |
|---|---|---|
| Overlay fill | live `role === 'pirate'` + `bounty > 0` + not dead/captured; cap 2 | `station.js` 1794–1827 |
| Overlay id | `pirateBountyId(name)` | `station.js` 1786–1788 |
| Overlay complete | `completeJob` `done`; **no** employer rep; fence favor via `kind === 'bounty'` | `station.js` 3081–3089, 2733–2742 |
| Overlay skip vs hunt | skip overlay pay if accepted hunt claims same **name** | `station.js` 3086, 2618–2628 |
| Hunt kind | `'hunt'` | `station.js` 2268 |
| Hunt quarry | origin-bank `role === 'pirate'`, not ace, not Named Gun name, `bounty > 0` | `station.js` 2144–2216 |
| Hunt complete | space-side; `recordId` → `rec.name`; incident `destroyed` + `causer === 'player'` + rec dead/captured; employer +2; splice+replace | `station.js` 2651–2669, 2797–2855 |
| Unique ace | `bounty-ace`; `findAceRecord` `role === 'ace' \|\| classKey === 'ace'` | `station.js` 1703–1707, 3068–3079 |
| Named Guns table | `ACES.hunter` Sister Vane; `ACES.illyx` Carver Illyx; `NAMED_GUNS.aspirants.names` | `state.js` 827–901 |
| Hunt eligibility forbids | `ACES.hunter.name`, `ACES.illyx.name`, aspirant names; `role/classKey === 'ace'` | `station.js` 2144–2212 |

Hunt is **local pirate career**. Named Guns stay unique / world lineage. War must **not** post against those records or reuse `'hunt'` / `'bounty'` / `'patrol'`.

### 2.3 `boardJobs` / `renderJobs` / `acceptJob`

`boardJobs` hides foreign **offered** pirate/recovery/mining/trade/hunt/passenger/explore (`station.js` 2672–2687). Accepted renewable cards show on every dock. Unique `DONE` still lists.

`renderJobs` (`station.js` 3634–3647) refresh order: ace title, pirates, recovery, mining, trade, hunt, passenger, explore. **No war sync.**

Accept origin-only for trade/hunt/passenger/explore (`station.js` 3498–3619). Unique haul stamps dest from `currentSystem`. Hunt stamps origin `payQuoted` from `record.bounty`. Passenger/trade stamp dest via `otherSystemId`. Explore stamps origin `explorePayBase()`.

### 2.4 Token collision check for `'war'`

Grep of `src/` found **no** `kind: 'war'` and **no** `'war'` in `JOB_KINDS`. NPC AI uses mode `'hunt'` for pirates (`npc.js` 200), not a job kind. Unique kind `'patrol'` is the Freehold pirate-sweep card. Short token `'war'` is unused.

---

## 3. Reputation writers (Jobs + adjacent)

| Writer | Key | Delta | Gate | Cite |
|---|---|---|---|---|
| Mining complete | `SYSTEMS[origin].faction` | `+ MINING_REP` (**2**) | `Object.hasOwn(FACTIONS, faction)` | `station.js` 2893–2895 |
| Trade complete | same | +2 | same | `station.js` 2942–2944 |
| Hunt complete | same | +2 | same | `station.js` 2656–2658 |
| Passenger complete | same | +2 | same | `station.js` 2989–2991 |
| Explore complete | same | +2 | same | `station.js` 3053–3055 |
| Unique patrol | **`reputation.freehold`** | `+ PATROL_REP` (**5**) | **none** (hardcoded) | `station.js` 2777 |
| Overlay bounty | **none** | — | — | `station.js` 3081–3089 |
| Unique ace | **none** | — | — | `station.js` 3068–3079 |
| Standing copy | Digit 9 / Jobs note | mining +2 dock flag; patrol +5 Freehold | `factionDisplayName` | `station.js` 1076–1077, 3638–3639 |
| Bag heal | FACTIONS keys only | drop else | `sanitizeReputation` | `save.js` 672–691 |
| Read helper | `standingRead(bag, faction)` | 0 if missing/reserved/non-finite | `data-trade.js` 62–70 |

**No live Jobs writer decrements a target faction.** REP-04 §7 (`docs/RepStandingDesign.md` 206–214): later kill write delta **proposed, needs owner**; overt war work “employer up, target down, live tables not `job.faction`”. Sibling Wave 79 owns kill attribution. This inventory does **not** invent a kill UU.

`job.faction` is **not** on `JOB_FIELD_ALLOW`. Employer must not be a save string.

---

## 4. Patrol hunt floor (two live meanings)

### 4.1 Unique `patrol-lane` (Jobs floor)

| Field | Live | Cite |
|---|---|---|
| Kind | `'patrol'` (unique only) | `station.js` 1745 |
| Need | **2** pirates (`PATROL_NEED`) | `station.js` 171 |
| Progress | `npcDestroyed` / `npcSurrendered` / `npcDisabled` with `role === 'pirate'` | `station.js` 2768–2784 |
| Pay | `jobPay(current, PATROL_REWARD)` **300**, unstamped | `station.js` 2778–2779 |
| Rep | `reputation.freehold += 5` | `station.js` 2777 |
| Complete | `completeJob` → `done`; no replace | `station.js` 2781 |
| Cadence | every frame, not 0.5 s tick | `station.js` 4509 |

This is **anti-pirate lane work**, not faction-against-faction. War must not reuse `'patrol'` or copy `freehold +=`.

### 4.2 NPC patrol hostility floor

| Field | Live | Cite |
|---|---|---|
| Patrol AI mode | `'loiter'` (not `'hunt'`) | `npc.js` 200–204 |
| Pirate AI mode | `'hunt'` | `npc.js` 200 |
| Patrols hunt player when | standing ≤ `HOSTILE_STANDING` (**-10**) | `npc.js` 87 |
| Record role | `'patrol'` | `world.js` 374–385, 296 |

War that later writes target-down standing can push the player through **-10** vs dest patrols. That number is live. This family must **not** retune it. Until the target delta is authored, war must **not** write the target key, so this floor does not move from war complete.

---

## 5. Live rival-faction data (bind sources)

### 5.1 Systems and factions

`SYSTEMS[id].faction` is the dock flag (`authored-systems.js` 34, 64, 96, 128, …). `FACTIONS` keys include `freehold`, `redledger`, `veridian`, `hollow`, `independent`, plus the Ten Banners (`state.js` 549–564). Unknowables have a FACTIONS row and **no** `SYSTEMS` dock (inventory precedent: Wave 42).

Authored primary gates:

| Origin | `gates[0].to` | Origin faction | Dest faction |
|---|---|---|---|
| freehold | veridian | freehold | veridian |
| veridian | freehold | veridian | freehold |
| redmarch | veridian | redledger | veridian |
| hollowreach | redmarch | hollow | redledger |

`otherSystemId` always uses **`gates[0]`** (`station.js` 1718–1721). Trade and passenger **rebind** dest that way at pay. A same-faction neighbor is possible on generated systems. Code does not walk later gates for a rival today.

### 5.2 Patrol records as rival presence

`createRecords` (`world.js` 322–386):

- `otherFaction = SYSTEMS[def.gates?.[0]?.to]?.faction ?? 'independent'` (327).
- Patrol `i === 0` → `def.faction`; `i >= 1` → `otherFaction` (379).
- Traders rotate `[def.faction, otherFaction, 'independent']` (328–339).
- Pirates: `i === 0` `redledger` else `independent` (355). **Hunt quarry, not war.**
- Ace: Carver Illyx `redledger` / `role: 'ace'` (407–418). **Named Gun, not war.**

Authored `cast.patrols`: freehold 2, veridian 3, redmarch **1**, hollowreach/hush/verge **0** (`authored-systems.js` 54, 83, 115, 147, 179, 212). Verge also has **1** pirate (212) — hunt already starves the second slot.

Pirates, ace, and miners **never migrate** (`world.js` 30). Patrols are local to the bank.

Record identity: `id: rec-<n>` (`world.js` 285). Record has live `faction` and `role` (`world.js` 288, 296). Incidents store `name`, `faction`, `role`, `causer`, `t` — **no record id** (`world.js` 1332–1346). `MAX_INCIDENTS = 40` (813).

### 5.3 Witness Rule

Wrecks stage only from real `npcDestroyed` (`world.js` 37–38, 1313–1314). Hunt and unique ace pay only on player-caused incidents (`station.js` 2642–2648, 3072–3076). Explore files at origin dock after `mystery.visited` (`station.js` 3045–3047). **No new crime score exists.**

---

## 6. Events, UI, closed neighbours

| Surface | Live law | Cite |
|---|---|---|
| Frozen events | `'commLine'` among many; **no `job*` type** | `ctx.js` 198–228 |
| Jobs complete toast | `ctx.emit('commLine', { text })` | `station.js` 2749, 2664, … |
| Digit 2 | Jobs | `station.js` 152 |
| Digit 0 | shipyard | `station.js` 152, 4395–4397 |
| Digit 7 | People (POD) | `DOCK_KEY_SERVICES` |
| Digit 9 | Standing (epics) | dock root |
| `state.js` | READ-ONLY for feature workers | `state.js` 6–8 |
| `ctx.js` default `jobs` | **none** (ensureJobs creates) | `ctx.js` |

Closed: AST `asteroidId`, mystery clue text/ids on Jobs (explore §25), data cargo grant, BIO, SHP hull grants, TGT-05, NPC missiles, power ledger, MSN-03 chains.

---

## 7. Why overlay / hunt / patrol reuse is not safe for war

1. `'bounty'` is unique ace **and** overlay pirates. Overlay cap 2 is not two renewable war slots. Overlay `DONE` never replaces.
2. `'hunt'` is local **pirate** record bind. Wishlist splits faction-level pirate (Named Guns / `bounty-ace`) from faction-against-faction. Posting war as hunt would collide with pirate career and Named Gun eligibility.
3. `'patrol'` is unique Freehold pirate-sweep, hardcoded `freehold += 5`, `completeJob` `DONE`. Not a slot machine. Not employer/target.
4. Kind `'espionage'` does not exist. A sibling owns that family. Do not reserve its room here.
5. Live cap 1020 holds unique 4 + 5×200 + 16. Two war slots per system need **`WAR_ROOM`**, not eviction of mining/trade/hunt/passenger/explore.

---

## 8. Pain points for MSN-02 faction-against-faction

- Wishlist wants overt employer-up / target-down work. Live Jobs never write a target key.
- Target delta is **proposed, needs owner** (`RepStandingDesign.md` §7). Until authored, a card can still complete with employer +2 only.
- Kill attribution is a sibling REP-04 path. War complete must use existing incidents / dock claim, not a new crime score and not a new kill UU.
- Rival presence already exists as `role === 'patrol'` records with `record.faction` from live `SYSTEMS` dest. Dest banks may be missing until first visit. `cast.patrols === 0` (Verge/Hush) starves local patrols.
- `otherSystemId` may land same-faction. A rival walk of `gates[]` is not live Jobs law yet; `SYSTEMS[dest].faction` is still the allowlisted field.
- Patrol hostility floor **-10** (`npc.js` 87) must not be retuned here.

---

## 9. Verification pins (inventory-time)

Exact files:

- `src/systems/station.js` `makeJobs` / `ensureJobs` / `completeJob` / `boardJobs` / `tickDeliveryJobs` / `tickPatrolJob` / `renderJobs` / `acceptJob` / `syncPirateBounties` / `syncHuntJobs` / `jobPayFor` / `MINING_REP` / `PATROL_*` / `h`
- `src/game/save.js` `WORLD_FIELDS` `'jobs'`, live cap `4+10*N+16`, `JOB_KINDS`, `sanitizeJobs`, `sanitizeReputation`
- `src/game/state.js` `ACES` / `NAMED_GUNS` / `SYSTEMS` / `FACTIONS` (READ-ONLY)
- `src/game/world.js` `makeRecord`; patrol/pirate/ace seed; `WRECK_TTL`; incidents; pirates never migrate
- `src/systems/npc.js` AI mode `'hunt'` pirates; `'loiter'` patrols; `HOSTILE_STANDING -10`
- `src/core/ctx.js` no jobs default, no job events
- Unique four named in `makeJobs`
- Sibling `out/w79/espionage` **not** merged into this cap formula
- Sibling `out/w79/rep04` **not** a source for kill UU
