# MSN-03 authored faction reward chains shared contract

**Wave:** 81. Design only. No chain-job feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Msn03ChainsDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/MsnMissionsDesign.md`, any `docs/Msn02*.md`, `docs/RepStandingDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/NpcMissilesDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/Pod02TraffickingDesign.md`, `docs/Tgt05ReticleLockDesign.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, `docs/Tgt05LockCatsDesign.md`, or `docs/Bio03ClassLookDesign.md` (those are other workers).  
**Locked sources:** wishlist Initiative MSN MSN-03 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 603–606); live inventory `out/w81/msn03/current-msn03-inventory.md` (code wins); `src/systems/station.js`; `src/game/save.js`; `src/game/hangar.js`; `src/game/weapon-fit.js`; `src/game/epics.js`; `src/game/kill-standing.js`; `src/game/world.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments. Wave 70/77/79 cites are stale. Do **not** wait on sibling TGT/BIO files. Do **not** invent TGT `lockKind` numbers, BIO bake numbers, kill UU, spy expose, or war target-rep.

---

## 0. Law in one page

1. Wave 81 is markdown only for this family. Implementation is a later **serial** wave. Do not schedule or land chain PRs in `src/` in this wave.
2. **Extend** `ctx.world.jobs`. Do **not** add `world.chains`. Do **not** add a `WORLD_FIELDS` name. Autosave stays `rimward-save-v1`. No new `localStorage` key.
   - **Why jobs, not `world.chains`:** chain ids are hyphen tokens; sanitize can allowlist a new kind `'chain'` plus an exact authored-id map (unique-four pattern). Progress is “which authored id is live or `done`”. A second persist key is only legal if jobs cannot hold that without colliding kinds. Live `JOB_KINDS` has no `'chain'` (`save.js` 144). Prefer extend-jobs.
3. First MSN-03 serial kind is **`chain`** (`kind: 'chain'`). Must **not** be `'bounty'`, `'patrol'`, `'haul'`, `'ferry'`, `'recovery'`, `'mining'`, `'trade'`, `'hunt'`, `'passenger'`, `'explore'`, `'espionage'`, `'war'`, or `'epicJob'`.
   - **Why `'chain'` not `'epicJob'`:** Digit 9 Standing already surfaces `EPICS` (`station.js` `renderEpics` 4977; `epics.js`). `'epicJob'` would mix Jobs cards with standing stages. Defense: unused in live `JOB_KINDS`.
4. **Do not** replace, rename, migrate, or delete the unique four. Completing unique haul/ferry/patrol/ace still uses `completeJob` `done`. Overlay pirate cap **2** stays. Recovery wreck stays. Authored chains are **not** renewable two-slot families. Do **not** add `2*N` room.
5. Board: **one live step per authored chain**. Completing step N **splices** that row and posts step N+1, **or** grants the fail-closed reward and ends (last step stays `done` as a sentinel so restore does not re-offer). Never leave mid-chain `DONE` clutter: hide `kind === 'chain' && state === 'done'` from `boardJobs`. Unique-four `DONE` still shows.
6. Sanitize cap **grows at impl time** by chain room **only**. **LIVE** cap at inventory is `4 + 14*N_SYSTEMS + 16` = **1420** at 100 systems (`save.js` 115–133). Freeze:

   ```
   live_cap_at_impl = JOBS_SANITIZE_MAX as read from save.js at the implementation wave
                      // inventory-time: 4 + 14*N + 16 = 1420 at 100
   UNIQUE_FOUR_HEADROOM = 4          // live leading 4 in the cap formula
   CHAIN_COUNT          = 4          // one chain per EPICS faction
   CHAIN_STEPS          = 3          // short authored chain
   CHAIN_LIVE_PER_CHAIN = 1          // one-in-one-out
   CHAIN_ROOM           = UNIQUE_FOUR_HEADROOM + CHAIN_STEPS
                        // 4 + 3 = 7
   JOBS_SANITIZE_MAX_at_impl = live_cap_at_impl + CHAIN_ROOM
                             // inventory-time arithmetic: 1420 + 7 = 1427 at 100
   ```

   **Do not** reset to 1020/1220. **Do not** bake `ESPIONAGE_ROOM` or `WAR_ROOM` as a new combined formula. Those rooms **already sit inside** live `JOBS_SANITIZE_MAX`. Add **only** `CHAIN_ROOM` to whatever cap is live. **Do not** drop honest offered mining/trade/hunt/passenger/explore/espionage/war to make room. **Do not** drop the unique four or any `accepted` job.
7. Authored identity: **no asteroid UUID**. No `asteroidId`. No clue id/text in UI. Bind `originSystem` to an **authored** `SYSTEMS` key that already flies the employer flag (table §3.2). Display names from allowlisted `SYSTEMS[id].station.name` / `FACTIONS[key].name`. Witness Rule: space-side complete reads `ctx.world.incidents` with `causer === 'player'` (live bounty/war). Do **not** fabricate incidents.
8. Deadline: **none** for authored chain steps. Unique four have no `deadline`. Families use 600 s (`MINING_DEADLINE` `station.js` 198 / `WRECK_TTL` `world.js` 811). Chains are unique-like, not renewable. Sanitize must **not** require `deadline` on `'chain'`. Do not expire a unique reward path on a 600 s clock.
9. Pay: stamp `payQuoted` on accept. Clamp 0…`PAY_QUOTED_MAX` 20000 (`save.js` 134; `station.js` 209). Base = live `PATROL_REWARD` **300** (`station.js` 169) via **origin** `jobPayFor`. Do **not** invent a new UU table. Do **not** copy `LAUNCHER_IDS.dart.cost` 6500 or `TURRET_IDS.auto.cost` 4200 as mission pay. If a later owner needs a different number, mark **proposed, needs owner** and **fail closed (no pay)** until authored.
10. Reputation: employer = `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, key)`. Delta **`+2`** (`MINING_REP` `station.js` 196) on each completed step. **Do not** write target-faction standing. Never `job.faction` as a write source. Never `reputation[userString]`. Do **not** copy patrol `reputation.freehold +=` (`station.js` 3280) unless the authored origin really is Freehold.
11. Unique equipment grant: **proposed, needs owner.** Live hangar/outfitting already has SKUs (`dart`, turret `auto`) and living **graft** (`graftMounted`). Until the owner names **which** SKU (or graft) each chain grants, and whether the grant is free, **fail closed**: last step pays credits + employer **+2** only. **No** hangar write. **No** `writeMountedGear` launcher/turret patch. **No** `graftMounted` from Jobs. Do not invent a new SKU id.
12. UI: Jobs pane only. Digit **2**. No new Digit. No HUD glance. `textContent` / existing `h()` / `'commLine'` only. **No `innerHTML`**. Regen titles from templates + allowlisted station / faction **display names**. Do not print `job.faction`. Do not print system keys as the card title. Standing Digit **9** stays EPICS; do not put chain cards there.
13. `state.js` is READ-ONLY. No new `COMMODITIES`. No new `EPICS` stages. No NPC missiles. No power ledger. No new frozen event in `ctx.js`. Completions keep `'commLine'`. Inventory proves `commLine` already announces unique and family grants (`completeJob` 3252; family ticks). A chain grant toast uses `'commLine'`.
14. Prototype keys fail closed. Hyphen-token job ids (`SAFE_ID` is the **token** class only). Drop `RESERVED_IDS` on the full id **and** every token. Walk with `Object.keys` / index `for`, never `for…in` blob merge. Fresh `{}` literals only.
15. Do not invent kill UU (`KILL_STANDING_DELTA` is `null`, `kill-standing.js` 5). Do not invent spy expose. Do not invent war target-rep (live war writes employer only, `warPayComplete` 3093–3108). Do not reopen MSN-02 families. Do not reopen HUD-02 / TGT-05 / BIO graft desk / EXP drop% / Archive UU / NPC missiles / power ledger.
16. Do not “fix” boot-test known FAILs: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul named dest.
17. Unique `makeJobs` ids stay until a **later** serial migrates them. This serial must not rename them (boot-test pins).
18. EPICS stay standing stages with multipliers. Jobs stay Jobs. Do **not** advance `ctx.world.epics` from a chain complete. Do **not** require an EPICS stage to post a chain (standing gate is `rankFor` tier, §3.4). Do **not** put EPICS lines on Jobs cards.

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'jobs'` (`save.js` 78). Keep it. `'epics'` stays the standing bag (`save.js` 82). Do not dual-write.

Call site today: `sanitizeJobs(ctx)` from `sanitizeRestored` (`save.js` 1021). Chain serial **extends** that healer. Do not add a second walk. Do not persist `world.chains`.

### 1.2 Array heal

- If `world.jobs` is missing, not an array, or empty after drop → leave `[]` and let `ensureJobs` rebuild the **four unique** cards (`station.js` 1772–1775). Chains are **not** seeded by `makeJobs`.
- Walk with `Object.keys` / index `for`, never `for…in`.
- Fresh `[]`. Push fresh `{}` literals only. Never `Object.assign` a raw save object onto a live job.

**Cap (fits seven shipped families + unique four + overlay + this authored room; does not pre-count a later Ten-Banners chain wave):**

```
N_SYSTEMS              = Object.keys(SYSTEMS).length
                         // inventory-time 100: 6 authored + 94 generated
                         // authored-systems.js 30; galaxy.generated.js 2; state.js 541
live_cap_at_impl       = JOBS_SANITIZE_MAX in save.js at impl
                         // inventory-time 4 + 14*N + 16 = 1420
CHAIN_ROOM             = 4 + 3   // UNIQUE_FOUR_HEADROOM + CHAIN_STEPS
JOBS_SANITIZE_MAX      = live_cap_at_impl + CHAIN_ROOM
                         // inventory-time 1427 at 100
```

If a **later-or-parallel** serial already raised `JOBS_SANITIZE_MAX` when chain impl starts, **add `CHAIN_ROOM` to whatever is live**. Do not reset the 14*N family rooms.

Drop overflow in this order until `length ≤ JOBS_SANITIZE_MAX`:

1. Invalid rows (fail §1.3–1.4).
2. Extra mining / trade / hunt / passenger / explore / espionage / war on a system that already has two valid `offered|accepted` of that kind (live `extraOfferedFamily` plus hunt/war `recordId` dups, `save.js` 558–675, 709–728).
3. Extra **chain** rows: more than one `offered|accepted` per authored chain prefix, or any `chain-*` id not on the exact allowlist. Duplicate/tamper, not a honest live step.
4. `done`/`failed` mining, trade, hunt, passenger, explore, espionage, or war (should not exist if replace ran).
5. `done` pirate / `done` recovery.
6. Tamper-only last resort: if still over cap, drop **offered pirate/recovery** whose `system`/`originSystem` ≠ `currentSystem`. Honest play never needs this.

**Never drop** (if the row still sanitizes):

- The four unique ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`), any state.
- Any `accepted` job (including `'chain'`).
- Any **offered** mining/trade/hunt/passenger/explore/espionage/war that is one of the two slots for its `originSystem`.
- The **one** honest live `offered` chain step per authored chain, and the **one** `done` last-step sentinel per finished chain.

Normal play at inventory-time 100 systems: ≤200 each of seven families + 4 unique + ≤16 overlays + ≤4 live-or-done chain rows + ≤3 splice ghosts ≤ 1427. Restore must not delete honest offered families to “make room.”

### 1.3 Job id grammar (implementable)

Live `SAFE_ID` rejects hyphens. Every live job id **contains** hyphens. **Do not** run `SAFE_ID.test` on the full `job.id`.

**Token class** (same characters as `SAFE_ID`, one segment):

```
JOB_ID_TOKEN = /^[a-z0-9_]+$/i     // save.js SAFE_ID body, one hyphen-separated token
```

**Full id:**

1. Type string. Length 1…`ID_MAX` 64 (`save.js` 103).
2. No leading / trailing / doubled `-`. Split on `'-'`. Every token matches `JOB_ID_TOKEN` and is non-empty.
3. Full id is **not** in `RESERVED_IDS`. Every token, compared with `toLowerCase()`, is **not** in `RESERVED_IDS`. Drops `__proto__`, `chain-__proto__-1`, `constructor`.
4. Never use the id as an object key (`jobs[id] =`). Array of objects only.

**Kind-specific (after tokens pass):**

| Kind | Id rule |
|---|---|
| Unique four | **Exact** `bounty-ace` \| `patrol-lane` \| `haul-provisions` \| `ferry-consignment`. Boot-test pins. |
| Mining | Unchanged: three tokens `mine`, `sysId`, `n`. |
| Trade | Unchanged: three tokens `trade`, `sysId`, `n`. |
| Hunt | Unchanged: three tokens `hunt`, `sysId`, `n`. |
| Passenger | Unchanged: three tokens `passenger`, `sysId`, `n`. |
| Explore | Unchanged: three tokens `explore`, `sysId`, `n`. |
| Espionage | Unchanged: three tokens `spy`, `sysId`, `n`. |
| War | Unchanged: three tokens `war`, `sysId`, `n`. |
| Pirate overlay | Prefix `bounty-pirate-` plus ≥1 further token. |
| Recovery overlay | Prefix `recovery-` plus ≥1 further token. |
| **Chain (this serial)** | **Exact allowlist** of 12 authored ids (table §3.1). Three tokens: **`chain`**, `employerKey`, `step`. `employerKey` ∈ {`freehold`,`redledger`,`veridian`,`hollow`}. `step` ∈ {`1`,`2`,`3`}. Kind **must** be `'chain'`. **Not** `spy-<sys>-<n>` style. |

Examples that **must keep**: `bounty-ace`, `mine-freehold-0`, `spy-freehold-0`, `war-freehold-0`, `chain-freehold-1`, `chain-redledger-3`.  
Examples that **must drop**: `__proto__`, `chain-__proto__-1`, `chain-freehold-0` (no step 0), `chain-freehold-4` (only 3 steps), `chain-ferrous-1` (not this serial), `epicJob-freehold-1`, `chain-freehold` (no step), `spy-freehold-1` used as a chain. Do **not** rewrite unique ids to underscores.

Do **not** copy `pirateBountyId(name)` or family `seq` allocators for chain ids. Authored list only.

### 1.4 Per-job allowlist

Keep a job only if **all** hold. Extend live `JOB_KINDS` with `'chain'`. Do not remove shipped kinds.

Do **not** add `faction` to `JOB_FIELD_ALLOW`. Do **not** add `sku`, `launcher`, `turret`, `grafted`, or a clue-id field. `recordId` stays hunt/war-only (drop the field on chain if present). `commodity` forbidden on chain.

| Field | Rule |
|---|---|
| `id` | §1.3 grammar for that `kind`. **Not** whole-string `SAFE_ID.test` |
| `kind` | one of live kinds **plus `'chain'`** |
| `state` | one of `offered` \| `accepted` \| `done` \| `failed` |
| `title`, `detail` | string; `stripControlChars`; cap 240 / 720; empty → drop job |
| `reward`, `need`, `progress` | finite number; `need` ≥ 1; `progress` ≥ 0; clamp `progress` ≤ `need`. **Chain:** `need` must be integer **1**. Else drop |
| `originSystem` | **required** for chain: exact authored system for that employer (table §3.2). `Object.hasOwn(SYSTEMS, id)` else drop job |
| `destSystem`, `system` | if present: `Object.hasOwn(SYSTEMS, id)` else drop field. Chain dest, if the authored step uses one, must be a real station system ≠ origin |
| `payQuoted`, `originPrice` | if present: finite ≥ 0 integer after `Math.round`; **clamp `0…PAY_QUOTED_MAX`**. `PAY_QUOTED_MAX = 20000` (live) |
| `target` | bounty/hunt/war only. Chain: if present, **drop the field** unless that authored step is a witness beat that names a live record **display** via template, not a stuffed string |
| `recordId` | hunt/war only. Chain: drop the field |
| `wreckId` / `collected` | recovery only |
| `commodity` | mining/trade unchanged. Chain: **forbidden** — drop the field |
| `deadline` | families require it. Chain: **optional**; if present and non-finite, drop the field. Do **not** require it |
| `slot` | families 0\|1. Chain: **forbidden** — drop the field (step lives in the id) |
| `faction` | **Forbidden.** Unknown keys drop. Do not copy |

Unknown keys: drop (do not copy). Prototype keys: drop.

**Chain-required fields:** `originSystem`. `originSystem` must equal the authored home in §3.2 for that id. Employer is **read** from `SYSTEMS[origin].faction` at complete time, never stored.

**Chain:** `need === 1`. `progress` 0 or 1 after clamp.

### 1.5 Clock

`world.time` already heals to `0`. Chain steps do not compare a deadline. Do not add a second clock.

---

## 2. Board law

### 2.1 Not a family

`MINING_SLOTS_PER_SYSTEM` and twins stay **2**. Chains do **not** get `CHAIN_SLOTS_PER_SYSTEM = 2`. Do not call `syncMiningJobs` for chains. A new `syncChainJobs(ctx, sysId)` may run from `renderJobs` **after** live family syncs (`station.js` 4355–4364). It must not fill 100 systems.

### 2.2 One-in-one-out

```
complete chain step N (N < 3)
  → splice that job
  → push authored step N+1 for the same employer, state offered
  → render if the Jobs pane is open

complete chain step 3
  → pay fail-closed (credits + employer +2)
  → completeJob done (sentinel)
  → do not post a replacement
  → hide the done row on the board
```

`failed` mid-replace is legal the same way mining uses it (crash cannot pay twice). After fail-closed abandon: **do not** auto-replace like a family. Authored card may stay `offered` (no deadline) or the player may leave it. First impl: abandon is **not** a 600 s expire. An accepted chain the player never finishes stays `accepted` until complete or a later owner authors abandon.

### 2.3 Visibility

Offered chain: **origin dock only**, and only if the standing gate holds (§3.4).  
Accepted chain: visible on every Jobs board so the player can see the next beat.  
Done chain: hidden (`boardJobs` skip). Persist remains.

Foreign offered chain must not be acceptable (`boardJobs` hide + `acceptJob` refuse if `currentSystem !== originSystem`).

### 2.4 Unique four and overlays

`makeJobs` still seeds only the unique four. Overlay cap 2 and one recovery wreck unchanged. Chain sync must not pull or rewrite those rows.

---

## 3. Authored table (this serial)

### 3.1 Ids and steps

| Id | Employer key | Step |
|---|---|---|
| `chain-freehold-1` | freehold | 1 |
| `chain-freehold-2` | freehold | 2 |
| `chain-freehold-3` | freehold | 3 |
| `chain-redledger-1` | redledger | 1 |
| `chain-redledger-2` | redledger | 2 |
| `chain-redledger-3` | redledger | 3 |
| `chain-veridian-1` | veridian | 1 |
| `chain-veridian-2` | veridian | 2 |
| `chain-veridian-3` | veridian | 3 |
| `chain-hollow-1` | hollow | 1 |
| `chain-hollow-2` | hollow | 2 |
| `chain-hollow-3` | hollow | 3 |

**Why these four factions:** they already have `EPICS` (`state.js` 755–816). Ten Banners without EPICS (`ferrous`, `gilded`, `beautiful`, `congregation`, `assembly`, `lamplighter`) and `independent` / `unknowables` wait for a later serial. Unknowables have no ordinary dock chain.

### 3.2 Employer station (not `job.faction`)

| Employer | `originSystem` | Station display name (live) | Cite |
|---|---|---|---|
| freehold | `freehold` | Freehold Landing | `authored-systems.js` 31–42 |
| redledger | `redmarch` | Ledger Anchorage | `authored-systems.js` 93–103 |
| veridian | `veridian` | Veridian Spire | `authored-systems.js` 61–71 |
| hollow | `hollowreach` | Hollow Anchorage | `authored-systems.js` 125–135 |

`hush` / `verge` also fly `hollow`. This serial posts Hollow’s chain at **Hollow Anchorage only**, not at Threshold or The Vigil.

Sanitize: if `chain-redledger-1.originSystem !== 'redmarch'`, **drop**. Complete path re-reads `SYSTEMS[origin].faction`; stuffed `job.faction` is never copied.

### 3.3 Step beats (reuse live verbs; do not invent UU)

Each step reuses an existing complete verb. Copy is authored. Mechanics are live.

| Step | Verb | Complete when | Must not |
|---|---|---|---|
| 1 | Origin file (explore-like dock) | Docked at `originSystem`, accepted | Grant SKU; write target rep |
| 2 | Named dest dock (passenger-like, no cargo) | Docked at an authored dest with a station, accepted | POD survivor cargo; `livingRock` |
| 3 | Origin file + fail-closed reward | Docked at `originSystem`, accepted | Hangar grant until owner |

Dest for step 2 is **authored** (a real `SYSTEMS` key with `station`), not a per-system slot picker. First freeze:

| Employer | Step-2 dest |
|---|---|
| freehold | `veridian` (primary gate, `authored-systems.js` 44) |
| redledger | `veridian` (gate, `authored-systems.js` 105–106) |
| veridian | `freehold` (gate, `authored-systems.js` 73–74) |
| hollow | `redmarch` (gate, `authored-systems.js` 137–138) |

Do **not** bind hunt `recordId` or war quarry. Do **not** require a pirate kill (that would reopen kill UU / overlay). Witness Rule still applies if a later owner adds a space-side beat: incidents only.

### 3.4 Standing gate

Post or show offered step 1 only when `rankFor(standingRead(reputation, employer)).tier >= 1` (Known, `RANK_LADDER` min 10, `state.js` 672–678). Later steps post after the previous complete, **without** raising the gate again.

This is **not** `EPICS` `rankTier` auto-advance (`epics.js` `stageHolds`). Digit 9 may later mention chains in `standingMoveNotes`; first impl does not require that edit.

### 3.5 Reward (fail closed)

Last step:

1. `payQuoted` credits (clamped).
2. Employer `+2` if `Object.hasOwn(FACTIONS, employer)`.
3. `completeJob` `done` + `'commLine'`.
4. **No** SKU / graft / hull / scanner / mining-head write.

Owner-open SKU map (not shippable):

| Chain | Candidate live SKU | Live shop cite | Status |
|---|---|---|---|
| freehold | launcher `dart` | `weapon-fit.js` 33–43; cost 6500 | proposed, needs owner |
| redledger | turret `auto` | `weapon-fit.js` 46–54; cost 4200 | proposed, needs owner |
| veridian | (none — do not invent) | — | fail closed |
| hollow | (none — do not invent) | — | fail closed |
| any | `graftMounted` | `hangar.js` 731–752; Gilded dock; Beautiful cap | **BIO/SHP owned**; not a Jobs grant |

Do not invent prices. Do not seat `dart` on a hull with `canSeat(classKey, 'missile') === false`. A later grant PR must go through `writeMountedGear` allowlist (`hangar.js` 476–512) and `isLauncherId` / `isTurretId`. Unknown ids heal to empty.

---

## 4. UI

Digit **2** Jobs. `h()` is `textContent` (`station.js` 3842–3847). Accept by card index (`Accept (n)` and Digit 1–9, `station.js` 4530, 5208–5211). Home board can exceed 9 cards; mouse Accept still works. Do not cut unique/family slots to make digit room.

No `innerHTML`. Prototype-safe ids. No new Digit. Digit 0 shipyard. Digit 1 Market / Archive. Digit 9 Standing.

---

## 5. Events and `state.js`

Frozen `EVENTS` (`ctx.js` 198–227) have **no** `job*` type. Completions already emit `'commLine' { text }`. Chain toasts use that. Do **not** add `'chainGrant'` / `'jobComplete'`.

`state.js` READ-ONLY. Authored copy lives in `station.js` or a tiny `jobs-chains.js` later, not an `EPICS` dump.

---

## 6. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'chain'` kind; exact 12 ids; origin allowlist; cap `live + CHAIN_ROOM`; proto / kind / state; unique four kept; honest seven families kept | Sync, UI, SKU grant, unique migration, `2*N` |
| **PR2 cards + sync** | standing gate; one live step; origin-only accept; origin `payQuoted` from `PATROL_REWARD` | Expire-600, SKU, EPICS write |
| **PR3 complete / splice** | step 1 origin file; step 2 dest dock; step 3 fail-closed pay + done sentinel; hide done | SKU grant, target rep, kill UU |
| **PR4 Digit 2 UI** | station names; `textContent`; hide done chain | HUD-02, Digit 9 quest log |
| **PR5 boot pins** | keep unique four + family ids; keep `chain-freehold-1`; drop `chain-__proto__-1`; cap `live+CHAIN_ROOM`; last step no SKU; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS |

---

## 7. Closed neighbours

HUD-02, TGT-05, BIO graft desk, EXP drop%, Archive UU, NPC missiles, power ledger, MSN-02 family slot counts, unique-four migration, spy expose, war target-rep, kill UU.

---

## 8. Boot-test known FAILs

WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul stay. Do not “fix” them in this serial.

---

## 9. Owner-open (do not block PR1)

1. Which live SKU (if any) each chain grants. Default: **no grant**.
2. Whether Veridian / Hollow get a later catalog row. Default: credits only.
3. Whether Ten Banners gain chains. Default: **not this serial**. `CHAIN_ROOM` stays 7 until that wave adds authored count, never `2*N`.
4. Abandon of an accepted chain. Default: no 600 s expire.
