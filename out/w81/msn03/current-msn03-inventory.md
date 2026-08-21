# Wave 81 — live jobs / sanitize / Digit 2 / EPICS / hangar inventory (MSN-03)

**Wave:** 81. Design only. Code wins over stale comments and over Wave 70/77/79 inventory line numbers.  
**Locked sources:** `src/systems/station.js`, `src/game/save.js`, `src/game/hangar.js`, `src/game/weapon-fit.js`, `src/game/epics.js`, `src/game/kill-standing.js`, `src/game/world.js`, `src/core/ctx.js`, `src/game/state.js` (READ-ONLY), `src/game/authored-systems.js`.  
**Not this file’s job:** implement authored chains. Do not treat comment banners as law. Do not wait on sibling TGT/BIO briefs.

If this inventory and live code disagree, **live code wins**. Re-sample before an implementation wave.

---

## 0. What exists (one page)

There is **no** `kind: 'chain'` and **no** `kind: 'epicJob'`. Live `JOB_KINDS` is `bounty` | `patrol` | `haul` | `ferry` | `recovery` | `mining` | `trade` | `hunt` | `passenger` | `explore` | `espionage` | `war` (`save.js` 144). A stuffed `kind: 'chain'` row **drops today**.

Renewable Jobs families that **do** exist (through Wave 80): mining, trade, hunt, passenger, explore, espionage, war. Each is **two slots per system**, one-in-one-out, 600 s fail-closed. Unique four stay one-shot (`completeJob` → `done`). Overlay pirate cap **2**. One recovery wreck.

MSN-03 wishlist wants **authored, faction-specific chains** whose rare/unique equipment is **not** the ordinary procedural pool (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 603–606). Live board has no such cards.

**EPICS are not Jobs.** `EPICS` in `state.js` 755–816 are standing stages (4 factions × 4 stages including capstone). `epics.js` auto-advances when requirements hold and writes `ctx.world.epics`. Digit **9** Standing (`renderEpics` `station.js` 4977) shows them. Effects are multipliers (`jobPayMult`, `sellMult`, …), not hangar SKUs.

**Unique equipment that already lives** (no new UU table): hangar/outfitting SKUs `dart` (launcher) and `auto` (turret) in `weapon-fit.js`; living **graft** flag via `graftMounted` (`hangar.js` 731). Shop prices exist. Jobs complete paths **never** call `writeMountedGear` or `graftMounted`.

Reputation writers on Jobs: patrol **hardcodes** `reputation.freehold += PATROL_REP` (`station.js` 3280). Families (mining/trade/hunt/passenger/explore/espionage/war) write **employer** `SYSTEMS[origin].faction` +`MINING_REP` (2) with `Object.hasOwn(FACTIONS, key)`. Spy success: target **0**. War complete: target **0**. Overlay bounty writes **no** rep. `KILL_STANDING_DELTA = null` (`kill-standing.js` 5).

---

## 1. Persist

| Surface | Live law | Cite |
|---|---|---|
| Autosave key | `'rimward-save-v1'` | `save.js` 65 |
| Named slots | `rimward-save-v1-slot-1..3` | `save.js` 66 |
| `WORLD_FIELDS` includes `'jobs'` | yes | `save.js` 75–97 (`'jobs'` 78) |
| `WORLD_FIELDS` `'epics'` | yes (standing bag, not Jobs) | `save.js` 82 |
| `WORLD_FIELDS` `'hangar'` / `'launcher'` / `'missileAmmo'` / `'turret'` | yes | `save.js` 93–95 |
| `world.chains`? | **none** | — |
| Restore heal | `sanitizeRestored` → `sanitizeJobs` then `sanitizeReputation` | `save.js` 973, 1021–1022 |
| Omitted jobs on restore | delete live board (do not keep) | `save.js` 1080–1081 |
| `SAFE_ID` | `/^[a-z0-9_]+$/i` — **rejects hyphens** | `save.js` 101 |
| `RESERVED_IDS` | `__proto__`, `prototype`, `constructor`, … | `save.js` 106–110 |
| `ID_MAX` / `NAME_MAX` | 64 / 40 | `save.js` 103 / 102 |
| Job id grammar | hyphen **tokens**; do **not** `SAFE_ID.test` the full id | `save.js` 215–227 |
| `JOB_KINDS` | bounty, patrol, haul, ferry, recovery, mining, trade, hunt, passenger, explore, espionage, **war** | `save.js` 144 |
| `'chain'` / `'epicJob'` in `JOB_KINDS`? | **no** | `save.js` 144 |
| `JOB_STATES` | `offered` \| `accepted` \| `done` \| `failed` | `save.js` 145 |
| Unique four map | `bounty-ace`→`bounty`, `patrol-lane`→`patrol`, `haul-provisions`→`haul`, `ferry-consignment`→`ferry` | `save.js` 146–151 |
| Field allowlist | no `faction`; has `target`, `wreckId`, `slot`, `deadline`, `payQuoted`, `recordId`, `destSystem`, `commodity` | `save.js` 152–157 |
| `PAY_QUOTED_MAX` | **20000** | `save.js` 134 |
| Family slot twins (sanitize) | mining/trade/hunt/passenger/explore/espionage/war **2** each | `save.js` 115–121 |
| Overlay headroom | **16** | `save.js` 122 |
| `N_SYSTEMS` | `Object.keys(SYSTEMS).length` | `save.js` 123; merge `state.js` 541 |
| **LIVE cap** | `4 + 14*N + 16` | `save.js` 125–133 |
| Cap at 100 systems | **1420** | 4 unique + seven families × 2 × 100 + 16 |
| Reputation heal | `Object.keys`; drop reserved; keep only `Object.hasOwn(FACTIONS, key)` | `save.js` (sanitizeReputation; jobs restore path 1021) |

**Cap arithmetic (inventory-time, code):**

```
N_SYSTEMS            = Object.keys(SYSTEMS).length        // 100 (authored 6 + generated 94)
MINING_ROOM          = 2 * N_SYSTEMS                      // 200
TRADE_ROOM           = 2 * N_SYSTEMS                      // 200
HUNT_ROOM            = 2 * N_SYSTEMS                      // 200
PASSENGER_ROOM       = 2 * N_SYSTEMS                      // 200
EXPLORE_ROOM         = 2 * N_SYSTEMS                      // 200
ESPIONAGE_ROOM       = 2 * N_SYSTEMS                      // 200  (Wave 80 live)
WAR_ROOM             = 2 * N_SYSTEMS                      // 200  (Wave 80 live)
OVERLAY_HEADROOM     = 16
JOBS_SANITIZE_MAX    = 4 + 14*N + 16
                     = 1420 at 100 systems
```

There is **no** chain room in the live formula. Comment at `save.js` 124 names espionage room plus war room only.

Wave 79 briefs that still say cap `4+10*N+16` (**1020**) are **stale**. Wave 80 shipped both rooms.

### 1.1 `sanitizeOneJob` (non-unique kinds)

| Kind | Id rule | Extra |
|---|---|---|
| Unique four | exact id + mapped kind | `save.js` 291–292 |
| mining | 3 tokens `mine`, `sysId`, `n`; `originSystem === sysId`; slot 0\|1 | `save.js` 293–296, 356–365 |
| trade | 3 tokens `trade`, `sysId`, `n`; dest ≠ origin; `need === 5`; no `livingRock` | `save.js` 297–300, 366–378 |
| hunt | 3 tokens `hunt`, `sysId`, `n`; `recordId` `rec-<n>`; `need === 1`; deadline required | `save.js` 301–304, 379–388, 459 |
| passenger | 3 tokens `passenger`, `sysId`, `n`; dest ≠ origin; **no** `commodity`; `need === 1`; deadline required | `save.js` 305–308, 389–397, 460 |
| explore | 3 tokens `explore`, `sysId`, `n`; `need === 1`; deadline required | `save.js` 309–312, 398–403, 461 |
| espionage | 3 tokens `spy`, `sysId`, `n`; rival dest; `need === 1`; deadline required | `save.js` 313–316, 404–411, 462 |
| war | 3 tokens `war`, `sysId`, `n`; dest; `recordId`; `need === 1`; deadline required | `save.js` 317–320, 412–423, 463 |
| overlay bounty | prefix `bounty-pirate-` | `save.js` 321–322 |
| recovery | prefix `recovery-` | `save.js` 323–324 |
| **else** | **drop** | `save.js` 325–326 |

`kind: 'chain'` hits the **else** and drops.

### 1.2 Cap drop order (never unique four / accepted)

`sanitizeJobs` `save.js` 692–757: extra family slots → extra hunt/war `recordId` dups → `done`/`failed` families → `done` pirate/recovery → foreign offered overlay. `uniqueJobId` and `state === 'accepted'` are never dropped.

---

## 2. `world.jobs` owner and unique four

| Surface | Live law | Cite |
|---|---|---|
| Owner | `station.js` creates `ctx.world.jobs` if empty | `ensureJobs` 1772–1775; `initStation` 3787 |
| `ctx.world` default | **no** `jobs` key (station creates) | `ctx.js` 125–143 |
| Unique cards | ace bounty, patrol, haul Provisions, ferry Provisions | `makeJobs` 1737–1770 |
| Unique ids | `bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` | 1744, 1750, 1756, 1763 |
| Overlay pirate cap | **2** | `PIRATE_BOUNTY_CAP` 187; fill 1819 |
| Recovery | one wreck card | `syncRecoveryJob` (render 4357) |
| Unique/overlay complete | `state = 'done'`; dockmaster trust; no splice | `completeJob` 3249–3253; ace/pirate/haul/ferry/recovery 3702–3766 |
| Family complete | `failed` first, pay, splice, replace | `tickDeliveryJobs` 3292+; mining 3389–3404; spy 3622–3637; war `warPayComplete` 3093–3108 |
| Board filter | hide foreign **offered** pirate/recovery/mining/trade/hunt/passenger/explore/espionage/war; show unique `DONE` | `boardJobs` 3174–3189 |

---

## 3. Renewable families (do not reopen)

| Family | Slots | Kind | Id prefix | Cite |
|---|---|---|---|---|
| mining | 2 / system | `'mining'` | `mine-` | `station.js` 189, `save.js` 115 |
| trade | 2 | `'trade'` | `trade-` | 190 / 116 |
| hunt | 2 | `'hunt'` | `hunt-` | 191 / 117 |
| passenger | 2 | `'passenger'` | `passenger-` | 192 / 118 |
| explore | 2 | `'explore'` | `explore-` | 193 / 119 |
| espionage | 2 | `'espionage'` | `spy-` | 194 / 120 |
| war | 2 | `'war'` | `war-` | 195 / 121 |

Deadline **600** s (`MINING_DEADLINE` `station.js` 198; `WRECK_TTL` `world.js` 811). Render sync order: pirates, recovery, mining, trade, hunt, passenger, explore, espionage, war (`station.js` 4355–4364).

---

## 4. Digit 2 Jobs pane

| Surface | Live law | Cite |
|---|---|---|
| Service list | `DOCK_KEY_SERVICES` jobs is index **1** | `station.js` 152 |
| Digit 2 | level-1 Digit `n` → index `n-1` → jobs | 5173–5180 |
| Digit 0 | shipyard (last entry) | 5175–5177 |
| Digit 9 | `epics` Standing | index 8 in the list |
| `h()` | `textContent` | 3842–3847 |
| `btn()` | `h('button')` + click | 3849–3853 |
| `innerHTML` in `station.js` | **none** | grep 0 |
| Accept click | `Accept (${i + 1})` | 4530 |
| Digit accept | Digit 1–9 on Jobs → `boardJobs()[n-1]` if `offered` | 5208–5211 |
| Home board > 9 cards | mouse Accept still works | existing UX |

---

## 5. Reputation writers

| Writer | Key | Delta | Cite |
|---|---|---|---|
| Patrol | **hardcoded** `freehold` | `PATROL_REP` **5** | `station.js` 170, 3280 |
| Mining / trade / hunt / passenger / explore | `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS)` | `MINING_REP` **2** | 196; mining 3397–3398 |
| Espionage success | employer only | +2 | 3625–3627 |
| Espionage success target | **0** (no write) | — | dest used for gather only 3619–3621 |
| Espionage expire | nothing | — | 3580–3586 |
| War success | employer only | +2 | `warPayComplete` 3098–3101 |
| War target | **0** | — | no dest-faction write |
| Overlay bounty | none | — | `completeJob` only 3713, 3723 |
| Unique ace | none (credits only) | — | 3711–3713 |
| `KILL_STANDING_DELTA` | **null** — kill path fail-closed | — | `kill-standing.js` 5, 82–87 |
| Standing notes | mining employer + patrol Freehold; **no** spy/war/chain line yet | — | `standingMoveNotes` 1077–1086 |

No Jobs path writes `job.faction`. Field is not on `JOB_FIELD_ALLOW`.

---

## 6. EPICS / Standing / RANK_LADDER / Witness Rule

| Surface | Live law | Cite |
|---|---|---|
| `RANK_LADDER` | Sworn 50 t3, Trusted 25 t2, Known 10 t1, Stranger −10 t0, Suspect −25 t−1, Marked −1000 t−2 | `state.js` 672–678 |
| `rankFor` | first rung whose `min <= rep` | 680–682 |
| `EPICS` factions | **freehold, redledger, veridian, hollow** only | `state.js` 755–816 |
| Stage shape | `requires` + `effect` multipliers + `line` | e.g. freehold 759–768 |
| Progress | `ctx.world.epics[faction] = stageCount` | `epics.js` 13–14, 39 |
| Advance | auto when `stageHolds`; one stage / faction / frame; emit `'epicStage'` | `epics.js` 16–18, 69–77 |
| Read | `epicEffects` merges effects; `jobPayFor` uses `jobPayMult` | `epics.js` 35–41; `station.js` 3198–3205 |
| Digit 9 UI | rank, ladder, how standing moves, live consequences, then epic ticks | `renderEpics` 4977–5024 |
| Not a Jobs card | no `kind` on EPICS; no accept button | — |
| Witness Rule | `world.incidents`; rumors voice only recorded incidents | `ctx.js` 133; `contacts.js` 62; bounty 3707–3708; war `playerDestroyedName` 3143–3148 |
| Incident cap | `MAX_INCIDENTS` 40 | `world.js` 813 |

---

## 7. Hangar / outfitting / unique SKUs (no new UU table)

| Surface | Live law | Cite |
|---|---|---|
| Hangar persist | `{ mountedId, hulls }` on `WORLD_FIELDS` | `save.js` 93; `ctx.js` 22 |
| Hull cap | `HANGAR_CAP` **8** | `hangar.js` 25 |
| Row gear | `launcher`, `turret`, `missileAmmo`, `scanner`, `miningLaser`, `concealedMounts`, `grafted` | `sanitizeHangarRecord` 210–239 |
| Launcher catalog | **`dart` only** — `wkey` missile, `ammoMax` 8, **cost 6500**, restock 400 / 2 | `weapon-fit.js` 33–44 |
| Turret catalog | **`auto` only** — `wkey` turret, **cost 4200**, no magazine | `weapon-fit.js` 46–54 |
| Seat check | `canSeat(classKey, 'missile'|'turret')` from `MOUNT_TABLE` | `weapon-fit.js` 57–61; `state.js` 47–52 (light/cutter/freighter missile **0** turret **0**) |
| Outfit buy | Digit 8 launcher papers, Digit 9 turret papers | `station.js` 5227–5229, `renderOutfitting` 4731+ |
| Grant helper | `writeMountedGear(ctx, patch)` allowlists launcher/turret/…; unknown keys ignored | `hangar.js` 476–512 |
| Heal unknown SKU | `isLauncherId` / `isTurretId` else empty | `weapon-fit.js` 63–68 |
| Living graft | `graftMounted`: docked, Gilded banner, Gilded standing ≥ 0, built hull, not already grafted; **no debit** | `hangar.js` 731–752 |
| Graft standing | Beautiful capped while any grafted row remains | `hangar.js` 138; notes 1085 |
| Jobs → hangar? | **no path** | grep Jobs complete does not call `writeMountedGear` / `graftMounted` |

**What “unique equipment” can mean without inventing a UU table:** a later chain grant may seat a **live catalog id** (`dart` / `auto`) through `writeMountedGear`, or (not recommended here) call `graftMounted` at a legal Gilded dock. It cannot mint a new SKU. Light hulls cannot seat dart/turret (`MOUNT_TABLE`). Shop costs 6500 / 4200 are **outfitter prices**, not mission pay.

Other outfitter rows (cargo rack 600, Wolfeye 400/900, concealed mounts, mining heads) are **procedural shop ladders**, not unique rewards.

---

## 8. Events / architecture

| Surface | Live law | Cite |
|---|---|---|
| Frozen events | listed in `ctx.js` 198–227 | no `'jobComplete'`, no `'chainGrant'` |
| Job toasts | `'commLine' { text }` | `completeJob` 3252; family ticks |
| Ownership | `ctx.js` header 13–36 | station writes dock/jobs UI; save sanitizes world |
| World records | JSON-plain | `save.js` 60–62, `WORLD_FIELDS` |

---

## 9. Authored employer docks (for chain origin freeze)

| Faction | System key | Station name | Cite |
|---|---|---|---|
| freehold | `freehold` | Freehold Landing | `authored-systems.js` 31–42 |
| veridian | `veridian` | Veridian Spire | 61–71 |
| redledger | `redmarch` | Ledger Anchorage | 93–103 |
| hollow | `hollowreach` | Hollow Anchorage | 125–135 |
| hollow (not this serial’s home) | `hush`, `verge` | Threshold, The Vigil | 161–202 |

Authored six + 94 generated = 100 (`galaxy.generated.js` 2).

---

## 10. Gaps vs MSN-03 wishlist

- No authored chain cards. No `kind: 'chain'`.
- Unique four are one-shot **procedural-board** contracts (ace/patrol/provisions), not faction SKU chains.
- EPICS grant **price multipliers**, not hangar gear.
- Outfitter already sells the only missile/turret SKUs for UU. Wishlist wants those rares **off** the ordinary pool; live they are **on** the shop.
- Cap 1420 has no `CHAIN_ROOM`.
- Digit 2 can show unique `DONE` clutter; a chain sentinel should not add four more visible `DONE` rows without a hide rule.

Re-sample these line numbers at impl. They moved between Wave 79 and Wave 80.
