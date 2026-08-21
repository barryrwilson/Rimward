# MSN-02 renewable exploration / information-recovery shared contract

**Wave:** 77. Design only. No explore-job feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Msn02ExploreDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/MsnMissionsDesign.md`, `docs/Msn02TradeDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/Pod02TraffickingDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/ShpDesign.md`, `docs/Tgt05ReticleLockDesign.md`, `docs/RepStandingDesign.md`, or sibling `out/w77/{hunt,passenger}` (those are other workers).  
**Locked sources:** wishlist Initiative MSN MSN-02 exploration and information recovery (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 549–560); Initiative EXP Wave 74 first impl (data cargo persist + Assembly Archive desk, no debit until owner UU); mining Wave 71; trade Wave 76 (`docs/Msn02TradeDesign.md`); live inventory `out/w77/explore/current-explore-inventory.md` (code wins); `src/systems/station.js`; `src/game/save.js`; `src/game/mystery.js`; `src/systems/landmarks.js`; `src/game/data-trade.js`; `src/game/world.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments. Wave 75 trade inventory and Wave 70 mission inventory are stale on line numbers.

---

## 0. Law in one page

1. Wave 77 is markdown only for this family. Implementation is a later **serial** wave. Do not schedule or land explore PRs in `src/` in this wave.
2. **Extend** `ctx.world.jobs`. Do **not** add a second persist key. Do **not** add a `WORLD_FIELDS` name. Autosave stays `rimward-save-v1`. No new `localStorage` key. Do **not** add a world key for “explored”. Completion reads live `mystery.visited` (already on `'mystery'`) and dock + `currentSystem`.
3. First explore serial family is renewable **explore / information recovery**: `kind: 'explore'`. Must **not** be `'bounty'`, `'patrol'`, `'haul'`, `'ferry'`, `'recovery'`, `'mining'`, or `'trade'`. Defense: unique kinds and mining/trade slots already occupy those strings; `'recovery'` is the wreck overlay (`wreckId`), not a landmark survey.
4. **Do not** replace, rename, migrate, or delete the unique four in this serial. Completing unique haul/ferry still sets `done` via `completeJob`. **Do not** seed `dataCrystal` / `dataCube` / `survivor` / `livingRock` as job cargo. EXP items stay hangar rows (`data-trade.js`). Completing an explore job must **not** invent drop % (`DATA_DROP_RATE` is `null`) or Archive UU (`ARCHIVE_UU` is `null`). Fail closed: pay credits + employer **+2** only. Any data-grant is **proposed, needs owner** and **out of this family**.
5. Board slot: **`EXPLORE_SLOTS_PER_SYSTEM = 2`**, same count as live `MINING_SLOTS_PER_SYSTEM` / `TRADE_SLOTS_PER_SYSTEM` (`station.js` 189–190). One-in-one-out like mining/trade: complete or expire → splice → immediately post a new `kind === 'explore'` job for the same `originSystem` + `slot`. Never leave a `DONE` explore card.
6. Sanitize cap **grows at impl time**. Live cap (Wave 76) is `4 + 4 * N_SYSTEMS + 16` (`save.js` 115–122) = **420** at 100 systems. This family adds explore room **only**. Do **not** include hunt or passenger rooms (sibling Wave 77 workers).

   ```
   N_SYSTEMS              = Object.keys(SYSTEMS).length   // 100 at inventory
   LIVE_CAP_AT_IMPL       = 4 + 4 * N_SYSTEMS + 16        // unique + mining + trade + overlays = 420 at 100
   EXPLORE_ROOM           = EXPLORE_SLOTS_PER_SYSTEM * N_SYSTEMS   // 2 * 100 = 200
   JOBS_SANITIZE_MAX_at_impl = LIVE_CAP_AT_IMPL + EXPLORE_ROOM
                             // 4 + 4*N + 16 + 2*N = 4 + 6*N_SYSTEMS + 16
                             // 620 at 100 systems
   ```

   **Never drop** honest offered mining or honest offered trade to make room. **Never drop** honest offered explore that is one of the two slots for its `originSystem`. **Never drop** the unique four or any `accepted` job. Do **not** keep 420 after explore lands.
7. Objective bind: **no asteroid UUID**. Prefer a **named system** and/or an **authored landmark display name** already on `SYSTEMS` (Wave 14 chart-mark precedent: `contacts.js` `keeperChartMark` 387–402; HUD labels `lm.name` `hud.js` 1421–1432). Completion must be checkable from recorded state: `mystery.visited` contains the **rebound** landmark id internally while UI never prints the id; pay files at the origin dock. Do not require a new persist key for “explored”.
8. Dest / site: resolve the landmark from live `SYSTEMS[origin].landmarks` first (inventory: **every** system has ≥1 named landmark). If that table were empty, fall back to landmarks on `otherSystemId(origin)` (`station.js` 1711–1713). Do **not** post when there is no reachable site (empty tables, or fallback dest === origin with no origin landmarks). Stuffed `job.destSystem` / stuffed landmark id **must not** retarget pay. Tick rebinds `resolveExploreSite(origin, slot)` from live `SYSTEMS`.
9. Units / pay: no cargo. `need = 1` (one site). Stamp `payQuoted` on accept (Wave 26 / mining / trade). Compute with **`jobPayFor` at origin** of `Math.round(RECOVERY_REWARD * HAUL_MARGIN)` (`RECOVERY_REWARD` 300 at `station.js` 176; `HAUL_MARGIN` 1.4 at 173). Clamp `0…PAY_QUOTED_MAX` 20000 (`save.js` 123; `station.js` 196). Do not invent a new margin. Do not invent Archive UU or launder UU. EXP drop rate / desk UU stay owner-open and **out of this family**. If a later owner needs a data grant, mark **proposed, needs owner** and **fail closed (credits +2 only)** until authored — **not** this serial.
10. Deadline: reuse mining / wreck clock **600** world seconds (`MINING_DEADLINE` `station.js` 193 cites `world.js` `WRECK_TTL` 811). Offered: from post. Accepted: **restart** on accept. Expire **fails closed**: no credits, no reputation, no favor, no data row, no silent complete. Then replace. Do not invent a third clock. Do not use `ctx.elapsed`.
11. Reputation: employer faction **only** on success. Employer = `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, key)`. Delta **`+2`** (`MINING_REP` `station.js` 191). Expire writes nothing. Do **not** copy patrol `ctx.world.reputation.freehold +=` (`station.js` 2233). No `job.faction` field. Never `reputation[userString]`. Assembly / Unknowables hunger is **flavor copy only**; do **not** invent a second rep write.
12. UI: Jobs pane only. Digit **2**. No new Digit. No HUD glance. `textContent` / existing `h()` / `'commLine'` only. **No `innerHTML`**. Regen titles from templates + allowlisted `SYSTEMS[id].name` / `SYSTEMS[id].station.name` / `landmarks[i].name`. **§25 / Witness Rule:** player-facing copy may use authored landmark names and system display names. **Never** clue text, **never** clue id, **never** internal mystery keys (`found` / `visited` / `charted` / landmark `id`) in UI. Do not print `job.faction`. Do not use `job.faction` as a write source.
13. `state.js` is READ-ONLY. No new frozen event in `ctx.js`. Completions keep `'commLine'`. Prefer `commLine` over a new type. Unknowables still have no station (Wave 42; inventory: zero `SYSTEMS` with `faction === 'unknowables'`). Do not add an Unknowables dock.
14. Prototype keys fail closed. Hyphen-token job ids (`SAFE_ID` is the **token** class only). Drop `RESERVED_IDS` on the full id **and** every token. Walk with `Object.keys` / index `for`, never `for…in` blob merge. Fresh `{}` literals only.
15. Do not invent hunt, passenger, espionage, or faction-war numbers. Those families stay later / sibling. Espionage still depends on a later REP brief (REP-04).
16. Do not reopen mining hardness, `asteroidId`, POD sale, BIO grafts, SHP hull grants, HUD-02, TGT-05, EXP desk SKUs / drop % / Archive UU.
17. Do not “fix” boot-test known FAILs: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul named dest.
18. Unique `makeJobs` ids stay until a **later** serial migrates them. This serial must not rename them (boot-test pins).

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'jobs'` and `'mystery'` (`save.js` 75–79). Keep both. Do not add `'explored'`.

Call site today: `sanitizeJobs(ctx)` from `sanitizeRestored` (`save.js` 711). Explore serial **extends** that healer. Do not add a second walk. Do not retcon `mystery.js` discovery.

### 1.2 Array heal

- If `world.jobs` is missing, not an array, or empty after drop → leave `[]` and let `ensureJobs` rebuild the **four unique** cards (`station.js` 1759–1761).
- Walk with `Object.keys` / index `for`, never `for…in`.
- Fresh `[]`. Push fresh `{}` literals only. Never `Object.assign` a raw save object onto a live job.

**Cap (fits mining + trade + explore, cited live galaxy):**

```
N_SYSTEMS            = Object.keys(SYSTEMS).length
                     // inventory-time 100: 6 authored + 94 generated
                     // state.js 12–18, 541
LIVE_CAP_AT_IMPL     = 4 + 4 * N_SYSTEMS + 16
                     // save.js 115–122 comment: 4 unique + 2 mining/system + 2 trade/system + 16
                     // 420 at 100
EXPLORE_ROOM         = EXPLORE_SLOTS_PER_SYSTEM * N_SYSTEMS   // 2 * 100 = 200
JOBS_SANITIZE_MAX    = LIVE_CAP_AT_IMPL + EXPLORE_ROOM
                     // 4 + 6 * N_SYSTEMS + 16 = 620 at 100
```

Do **not** add hunt room. Do **not** add passenger room. Sibling Wave 77 families grow the cap in **their** impl waves.

Drop overflow in this order until `length ≤ JOBS_SANITIZE_MAX`:

1. Invalid rows (fail §1.3–1.4).
2. Extra mining on a system that already has two valid `offered|accepted` mining jobs (keep lowest `slot`, then lowest `n` in the id). Live `extraOfferedFamily` (`save.js` 357–389).
3. Extra trade, same rule, `kind === 'trade'`.
4. Extra explore, same rule, `kind === 'explore'`.
5. `done`/`failed` mining, trade, or explore (should not exist if replace ran).
6. `done` pirate / `done` recovery.
7. Tamper-only last resort: if still over cap, drop **offered pirate/recovery** whose `system`/`originSystem` ≠ `currentSystem`. Honest play never needs this.

**Never drop** (if the row still sanitizes):

- The four unique ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`), any state.
- Any `accepted` job.
- Any **offered mining** that is one of the two slots for its `originSystem`.
- Any **offered trade** that is one of the two slots for its `originSystem`.
- Any **offered explore** that is one of the two slots for its `originSystem`.

Normal play: ≤200 mining + ≤200 trade + ≤200 explore + 4 unique + ≤16 overlays ≤ 620. Restore must not delete offered mining, trade, or explore to “make room.”

### 1.3 Job id grammar (implementable)

Live `SAFE_ID` rejects hyphens. Every live job id **contains** hyphens. **Do not** run `SAFE_ID.test` on the full `job.id`.

**Token class** (same characters as `SAFE_ID`, one segment):

```
JOB_ID_TOKEN = /^[a-z0-9_]+$/i     // save.js SAFE_ID body, one hyphen-separated token
```

**Full id:**

1. Type string. Length 1…`ID_MAX` 64 (`save.js` 103).
2. No leading / trailing / doubled `-`. Split on `'-'`. Every token matches `JOB_ID_TOKEN` and is non-empty.
3. Full id is **not** in `RESERVED_IDS`. Every token, compared with `toLowerCase()`, is **not** in `RESERVED_IDS`. Drops `__proto__`, `explore-__proto__-0`, `constructor`, `bounty-prototype`.
4. Never use the id as an object key (`jobs[id] =`). Array of objects only.

**Kind-specific (after tokens pass):**

| Kind | Id rule |
|---|---|
| Unique four | **Exact** `bounty-ace` \| `patrol-lane` \| `haul-provisions` \| `ferry-consignment`. Boot-test pins. |
| Mining | Unchanged Wave 71: three tokens `mine`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `originSystem` equals `sysId`. |
| Trade | Unchanged Wave 76: three tokens `trade`, `sysId`, `n`. Same system/`n` rules. |
| **Explore (this serial)** | Exactly three tokens: `explore`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `sysId` not reserved. `originSystem` must equal `sysId`. |
| Pirate overlay | Prefix `bounty-pirate-` plus ≥1 further token. First explore serial does not retcon. |
| Recovery overlay | Prefix `recovery-` plus ≥1 further token. |

Examples that **must keep**: `bounty-ace`, `haul-provisions`, `mine-freehold-0`, `trade-freehold-0`, `explore-freehold-0`, `explore-fh_hearth-1`.  
Examples that **must drop**: `__proto__`, `explore-__proto__-0`, `explore-freehold`, `explore-notasystem-0`, `haulace` (unique four are exact). Do **not** rewrite unique ids to underscores.

Explore allocator: monotonic `n` per process (or scan max like `nextTradeId`, `station.js` 2009–2027). Collision → increment `n`. System token is a `SYSTEMS` key (underscores allowed: `fh_hearth`). Hyphens only as separators, never inside the system key.

Do **not** copy `pirateBountyId(name)` for explore ids. Do **not** put a landmark id into the job id (ids contain hyphens in authored tables, e.g. none today, but generated uses underscores; UI must not print either).

### 1.4 Per-job allowlist

Keep a job only if **all** hold. Extend live `JOB_KINDS` with `'explore'`. Do not remove `'mining'` or `'trade'`.

| Field | Rule |
|---|---|
| `id` | §1.3 grammar for that `kind`. **Not** whole-string `SAFE_ID.test` |
| `kind` | one of `bounty` \| `patrol` \| `haul` \| `ferry` \| `recovery` \| `mining` \| `trade` \| **`explore`** |
| `state` | one of `offered` \| `accepted` \| `done` \| `failed` |
| `title`, `detail` | string; `stripControlChars`; cap 240 / 720; empty → drop job |
| `reward`, `need`, `progress` | finite number; `need` ≥ 1; `progress` ≥ 0; clamp `progress` ≤ `need`. **Explore:** `need` must be integer **1**. Else drop the explore job (do not heal a stuffed need) |
| `originSystem`, `destSystem`, `system` | if present: `Object.hasOwn(SYSTEMS, id)` else drop field or drop job if required for kind |
| `payQuoted`, `originPrice` | if present: finite ≥ 0 integer after `Math.round`; **clamp `0…PAY_QUOTED_MAX`**. `PAY_QUOTED_MAX = 20000` (live) |
| `target` | string; `stripControlChars`; `NAME_MAX` 40; bounty only |
| `wreckId` | recovery only; hyphen-token; cap 64. **Forbidden on explore.** |
| `collected` | recovery only; boolean. **Forbidden on explore.** |
| `commodity` | mining/trade rules unchanged. **Explore: do not copy.** Stuffed `dataCrystal` / `dataCube` / `survivor` / `livingRock` on an explore row **drops the field**; if an impl required commodity on explore, **drop the job** |
| `deadline` | if present: finite `world.time` units ≥ 0; if non-finite, drop the field. Explore **requires** finite `deadline` |
| `slot` | mining, trade, or explore: integer `0` or `1`; else drop that family job |
| `faction` | **Forbidden.** Unknown keys drop. Do not copy |
| `landmarkId` | **Forbidden in first impl.** Unknown key: drop (do not copy). Pay rebinds §3.5. Do not add this name to `JOB_FIELD_ALLOW` |

Unknown keys: drop (do not copy). Prototype keys: drop.

**Explore-required fields:** `originSystem`, `slot`, `deadline`. `originSystem` must equal id token `sysId`. Do **not** require `destSystem`. Do **not** require `commodity`. If `destSystem` is present it must be a `SYSTEMS` key and not reserved; stuffed dest still cannot retarget pay (§3.5).

### 1.5 Clock

`world.time` already heals to `0` (`save.js` 709). Deadline compares use that clock, never `ctx.elapsed`.

A hand-edited future `world.time` may expire accepted explore jobs — fail closed, then replace. Same cheat class as editing credits. Do not add a second clock.

Hand-edited `mystery.visited` that already contains the rebound landmark id lets an accepted explore pay on the next origin dock tick. Same cheat class as stuffing cargo for mining. Do not add a visit-time stamp world key.

---

## 2. Board slot (explore family)

### 2.1 What a slot is

For explore only:

- Each system may have **two** explore jobs (`slot` 0 and 1) in `world.jobs` whose `originSystem === that system` and `kind === 'explore'`.
- States in a slot: `offered` or `accepted`. `failed`/`done` are transient: splice in the same function that posted the replacement.
- The Jobs board **shows** offered explore when `ctx.world.currentSystem === originSystem`. Accepted explore cards also show on other docks as a reminder (state line names the **landmark display name** and **system display name**). Same pattern as mining/trade (`boardJobs` 2132–2142).

Mining slots and trade slots are independent. A system may hold two mining **and** two trade **and** two explore jobs.

### 2.2 Fill

`syncExploreJobs(ctx, sysId)` on `renderJobs` (after `syncTradeJobs`):

- `site = resolveExploreSite(sysId, nextSlot)`. If `site === null`, **do not post** explore for that system (no reachable named landmark).
- Count explore jobs with `originSystem === sysId` and state `offered|accepted`.
- While count < `EXPLORE_SLOTS_PER_SYSTEM`, push a new offered explore job for `sysId` + free slot.
- Do **not** reshuffle existing offered cards on each render.
- Do **not** fill mining or trade slots with explore.

`resolveExploreSite(origin, slot)` (live table, not save strings):

```
lms = SYSTEMS[origin].landmarks
if Array.isArray(lms) && lms.length > 0
  i = slot % lms.length
  lm = lms[i]
  if lm.id is non-empty string and lm.name is non-empty string
    return { siteSystem: origin, landmark: lm }
dest = otherSystemId(ctx, origin)
if dest !== origin && Object.hasOwn(SYSTEMS, dest)
  lms2 = SYSTEMS[dest].landmarks
  if Array.isArray(lms2) && lms2.length > 0
    i = slot % lms2.length
    lm = lms2[i]
    if lm.id is non-empty string and lm.name is non-empty string
      return { siteSystem: dest, landmark: lm }
return null
```

Inventory-time 2026-08-20: **0** systems lack landmarks, so the dest fallback is defensive. Do not skip the empty-table guard.

### 2.3 One-in-one-out

On explore complete **or** explore expire:

1. Note `originSystem` and `slot`.
2. Pay or not (complete pays; expire does not).
3. `splice` that element.
4. Immediately `push` a new offered explore job for the same system and slot (skip push if `resolveExploreSite` is null).
5. If the overlay is open on Jobs, `render()` so the replacement is visible this interaction.

Never `state = 'done'` on explore (unlike today’s unique `completeJob`). Set `failed` **before** pay (mining 2280–2281; trade 2330) so a crash mid-replace cannot pay twice. Unique kinds still use today’s `done`.

### 2.4 Unique cards (not slots)

`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` stay unique. Completing them still sets `done` and they still occupy board rows. **Not this serial.**

Pirate / recovery overlays stay as today. Mining and trade slots stay as today.

---

## 3. Explore family (this vertical slice)

### 3.1 Player-facing contract

Accept at **home** dock. Fly to the **named landmark** in the **named system** (display names only). Discovery already writes `mystery.visited` at 100 u (`mystery.js` 37–38, 120–128). Redock at the **origin** station. Delivery tick pays stamped `payQuoted`, writes employer rep +2, dockmaster trust as mining (via `rewardJobContacts` **without** calling unique `completeJob` `done`), splice, new card on the **origin** board immediately.

No cargo remove. No Archive desk call. No `spawnDataPod`. No `addCargo('dataCrystal')` / `addCargo('dataCube')`.

Already-visited landmarks **count** (information recovery of a known site). Same class as mining when the hold already has ore. Do not invent a visit-time world key.

### 3.2 Fields (JSON-plain)

```
{
  id,                 // explore-<sysId>-<n>
  kind: 'explore',
  slot,               // 0 | 1
  originSystem,       // SYSTEMS key; home dock / pay dock
  title, detail,      // authored templates, textContent; regen from SYSTEMS names
  reward,             // RECOVERY_REWARD 300 before jobPayFor; may be 0 if payQuoted is the agreement
  payQuoted,          // stamped on accept (jobPayFor at ORIGIN)
  need,               // 1
  progress,           // 0 until rebound landmark id ∈ mystery.visited; then 1
  state,              // offered | accepted
  deadline,           // world.time seconds when the card fails
}
```

No `asteroidId`. No THREE. No `target` name. **No `faction` field.** **No `commodity` field.** **No `wreckId`.** Prefer **no `landmarkId`** and **no `destSystem`** in first impl (tick rebinds). Employer at pay time is `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, faction)`. A save must not retarget reputation by stuffing `job.faction`. A save must not retarget the site by stuffing a dest or landmark id.

### 3.3 Site seed (not cargo)

First impl may only bind a landmark where **all** hold:

- Parent system is a `SYSTEMS` key (origin, else `otherSystemId(origin)`).
- `landmarks[i]` has string `id` and string `name`.
- Not a clue. Never `SYSTEMS[id].clues[j]`.
- Not a wreck aftermath id. Not an asteroid index.

Live examples (inventory, not UI copy keys): Freehold Drift / The Shepherd; Veridian Reach / Hulk Row; generated Hearth / The Hearth Cart.

Hold units of data cargo **do not** count. Do not call `tryTrade`. Do not call `confirmArchivePending`.

### 3.4 Need / pay / rep (cite; do not invent)

| Number | Value | Status |
|---|---|---|
| `need` | **1** (one named landmark) | not `HAUL_UNITS`; not cargo |
| `payQuoted` | `clampJobPay(jobPayFor(ctx, originSystem, Math.round(RECOVERY_REWARD * HAUL_MARGIN)))` | cite `RECOVERY_REWARD` 300 (`station.js` 176); `HAUL_MARGIN` 1.4 (`station.js` 173); mining/trade origin stamp. **Origin**, not dest. Base before epic = 420 |
| Clamp | `PAY_QUOTED_MAX` 20000 | cite `station.js` 196; `save.js` 123 |
| Reputation | **`+2`** to `SYSTEMS[originSystem].faction` if `Object.hasOwn(FACTIONS, faction)` | cite `MINING_REP` 191, mining write 2288–2290, trade write 2337–2339. Legal work, employer only |
| Trust/favor | reuse `rewardJobContacts` dockmaster path | cite 2195–2200. Do not mark unique `done` |
| Deadline length | `MINING_DEADLINE` / `WRECK_TTL` **600** world seconds from **accept** (offered cards: from post time) | cite `station.js` 193; `world.js` 811 |
| Offered lifetime | same 600 s from post; expire → fail closed → replace | keeps the board moving if ignored |
| Margin | live `HAUL_MARGIN` only, applied to `RECOVERY_REWARD` | no third multiplier |
| Data grant | **none** | `DATA_DROP_RATE` null (`data-trade.js` 23); `ARCHIVE_UU` null (`station.js` 1098); `spawnDataPod` returns null (119–121) |
| Archive / Unknowables desk | **out of family** | Unknowables: no `SYSTEMS` row. Assembly desk does not debit |

Do not author new UU tables in `state.js`. Unique haul still prices the **destination** dock; this family prices the **origin** dock (explicit). Do not change unique haul/ferry stamp code in this serial.

### 3.5 Tick / expire / site bind

Cadence: ride `tickDeliveryJobs` (0.5 s, `station.js` 3631) **and** a cheap expire scan there (not only while docked). Reverse walk so splice does not skip.

**Progress** (accepted, any location):

```
site = resolveExploreSite(origin, slot)     // ignore stuffed dest / landmark fields
if (!site) expire-fail-closed path
visited = ctx.world.mystery?.visited ?? []
if (visited.indexOf(site.landmark.id) !== -1) job.progress = 1
```

Do not emit clue events. Do not push into `mystery.visited` from the job tick (mystery.js owns discovery).

**Complete** (accepted, docked, `progress >= 1`):

```
origin = job.originSystem
if (!Object.hasOwn(SYSTEMS, origin)) continue
if (ctx.world.currentSystem !== origin) continue
site = resolveExploreSite(origin, slot)
if (!site) continue
visited = ctx.world.mystery?.visited ?? []
if (visited.indexOf(site.landmark.id) === -1) continue
job.state = 'failed'                       // before pay — mining 2280–2281
pay = clampJobPay(job.payQuoted) if finite else clampJobPay(jobPayFor(origin, round(RECOVERY_REWARD * HAUL_MARGIN)))
credits += pay
employer rep +2 if Object.hasOwn(FACTIONS, SYSTEMS[origin].faction)
rewardJobContacts
commLine via textContent path — landmark DISPLAY name + origin station name only
splice + replace (§2.3)
```

**Do not** pay at a stuffed dest. **Do not** pay because `job.landmarkId` matches a different rock. **Do not** remove cargo. **Do not** spawn data pods. **Do not** call Archive confirm.

Render / state-line **names** come from `site.landmark.name` and `SYSTEMS[site.siteSystem].name` (or station name), never from a save string, never from `lm.id`, never from `lm.line`.

**Expire** (`world.time >= deadline` and state offered or accepted):

- no cargo remove
- no pay
- no rep / no favor
- no data row
- commLine: contract lapsed (accepted) or posting withdrawn (offered) — no clue id
- splice + replace

**Silent complete is forbidden.** A tampered `deadline` in the past on restore expires on the next tick, fail closed.

### 3.6 Accept

Offered explore is **home-only**. `acceptJob` must refuse (no state flip, no stamp, notice) when:

- `job.kind === 'explore'` and `ctx.world.currentSystem !== job.originSystem`
- `resolveExploreSite(origin, slot)` is null
- `state !== 'offered'`

Unique haul may still be accepted at either dock (unchanged). Do not copy that onto explore slots.

No cargo fronting (not ferry). Stamp:

- `payQuoted` with **origin** `jobPayFor` + `clampJobPay`
- `deadline = world.time + 600` (restart)
- `originSystem` already set at post; **do not** retarget from `currentSystem`
- do **not** stamp a dest or landmark id as the pay key

`boardJobs` hides offered explore unless `originSystem === sysId` (same line as mining/trade, `station.js` 2138–2139). Hide **and** refuse: a missed filter must not accept a foreign card.

Digit accept stays index-into-`boardJobs` (live 3548–3550) but mutates the **job object by identity**. Replacement must not reuse the spliced object. Do not accept `done`/`failed`.

---

## 4. Id and XSS / §25

- Allocate explore ids per §1.3 (`explore-<SYSTEMS key>-<n>`). Confirm `Object.hasOwn(SYSTEMS, sysId)` first. Collision → increment `n`. Never `jobs[id] =` as a map. Never `SAFE_ID.test` the full id.
- `title` / `detail` / commLine / notices: `h(..., text)` / `textContent` / `emit('commLine', { text })`. Interpolate **display names** from allowlisted `SYSTEMS` + `landmarks[i].name`, not save strings, when regenerating. Restored title/detail already stripped.
- **Never** interpolate `lm.id`, `clues[j].id`, `clues[j].line`, `lm.line`, or `mystery.found` / `.visited` / `.charted` into player copy.
- `pirateBountyId(name)` stays pre-existing; do not copy for explore.
- No `innerHTML`. No HUD glance row. No new Digit. Chart-mark HUD (Wave 15) stays a reader of `mystery.charted`; jobs do not write chart marks.

Example **legal** copy (templates, not save):

- Title: `Survey The Shepherd`
- Detail: `Fly to The Shepherd in Freehold Drift. Redock here to file.`
- Reward: `File the survey at this dock — pays N UU`
- Accepted: `ACCEPTED — survey The Shepherd in Freehold Drift · t left`

Example **illegal** copy: any string containing `fh_shepherd`, `vd_c_shanty`, `mystery.visited`, or a clue line.

---

## 5. Faction attribution (REP-04 adjacency)

First-slice explore is **overt legal work**:

- On success: employer = `SYSTEMS[originSystem].faction` only (live table, not a job field).
- On success: **no** target-faction write. Assembly / Unknowables hunger is flavor in authored sentences, not a second `reputation` index.
- On expire: no write.
- Use `Object.hasOwn(FACTIONS, faction)` before indexing `world.reputation`. Fresh bag entry only for known keys. Never `reputation[userString]`.
- Do **not** fix patrol’s hardcoded `freehold` in the explore PRs unless a named serial owner takes it.

Espionage later: **Depends on later REP brief.** Police restitution (REP-03) is out of MSN. Hunt / passenger numbers are out (sibling workers).

---

## 6. Events and milestones

- No new type in `ctx.js` EVENTS comment.
- Do not emit `'clueFound'` or `'landmarkFound'` from jobs. Mystery.js already emits those on proximity.
- Optional first-complete milestone id omitted in first impl (less persist surface).
- Witness Rule: explore does not fabricate incidents or wrecks. It reads `mystery.visited` written by real proximity.

---

## 7. Closed neighbours

| Topic | Law |
|---|---|
| Mining MSN | Keep slots, kind, cap share, `boardJobs` mining filter. Grow cap by **explore room only**. Never drop honest mining |
| Trade MSN | Keep slots, kind, Wave 76 cap term. Grow cap by explore room on top of live 420. Never drop honest trade |
| Hunt / passenger | **Not this family.** Do not add their rooms to this cap formula |
| EXP data | No `dataCrystal` / `dataCube` on jobs. `priceOf` data stays 0. Drop rate unset. Archive UU unset. Completing explore does not grant a row |
| Mystery / landmarks | Read `mystery.visited`. Do not steal discovery. Do not print clue id/text. Do not convert clues to cargo |
| POD | No survivor commodity on jobs. No People-desk change |
| BIO | No `livingRock` seed. Feed Digit unchanged |
| SHP | Digit 0 untouched. No hull/loadout as mission reward |
| HUD-02 | No chart identity work. Jobs do not write `mystery.charted` |
| TGT-05 | Do not steal `ctx.targets` |
| REP | Employer-only +2. No freehold copy. No second Assembly/Unknowables write |
| AST | No `asteroidId`. Explore is a named landmark + origin dock, not a rock |
| Unique haul/ferry | Untouched ids, stamps, Wave 35 dest bind |
| Unknowables station | Still missing. Do not add a dock |
| NPC traders | Hub-route lore is NPC-only (`world.js` 24–27). Explore first slice is origin-site |

---

## 8. Serial PR plan (implementation wave, **not** Wave 77)

Named only. Do **not** implement in this wave.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'explore'` on `JOB_KINDS`; id grammar `explore-<sys>-<n>`; slot/deadline allowlist; no commodity copy; cap `LIVE_CAP_AT_IMPL + EXPLORE_ROOM` (`4 + 6*N_SYSTEMS + 16`, 620 at 100); proto drop; unique four **kept**; honest mining **kept**; honest trade **kept** | Sync/UI/pay; whole-string `SAFE_ID` on job.id; unique migration; hunt/passenger rooms; data grants |
| **PR2 sync + accept + complete** | `syncExploreJobs` 2 slots; render/accept; site = `resolveExploreSite`; `payQuoted` origin; tick: `mystery.visited` + origin dock; `failed`-first then pay; no cargo; no Archive | Expire, one-in-one-out, other families |
| **PR3 replace + expire** | splice + immediate replace; deadline 600 s fail closed; no `DONE` explore | Unique-card migration; mining/trade reopen |
| **PR4 UI copy** | state + remaining time + landmark **display name** + system **display name**; `textContent` only; Digit 2 only; §25 no clue id/text | HUD-02, innerHTML, Digit remap, clue dump |
| **PR5 boot pins** | drop `explore-__proto__-0`; keep `bounty-ace` + `haul-provisions` + `ferry-consignment` + `mine-freehold-0` + `trade-freehold-0` + `explore-freehold-0`; 200+200+200+4 unique fit cap 620; complete→replace; expire no pay; stuffed dest/landmark ignored at pay; data keys not copied onto explore; WAVE26/WAVE35 unique haul still pass; WAVE4 fence still the known FAIL | wishlist / PROGRESS edits by feature workers; drop %; Archive UU |

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave. Do not treat WAVE4 / WAVE26 / WAVE35 known FAILs as explore bugs.

---

## 9. Later families (named, not specified)

Do **not** fill numbers. After this explore serial:

1. Hunt local pirate as slots — **sibling / later**. Not this cap term.
2. Passenger ferry — **sibling / later**. Not this cap term.
3. Later serial may migrate unique haul/ferry onto trade slots (Wave 76 contract).
4. Faction-level pirate as a renewable **or** keep unique ace + MSN-03.
5. Faction-vs-faction — **after REP brief**.
6. Espionage — **after REP brief** (secret vs attributed). REP-04.
7. EXP data-grant on explore complete — **proposed, needs owner** (drop % and Archive UU still unset).
8. **MSN-03** authored chains for rare equipment — after the ordinary pool is renewable.

---

## 10. Non-goals (locked)

- No `src/` in Wave 77 for this family.
- No HUD-02. No AST rock UUIDs. No POD reopen. No SHP grants. No BIO graft. No EXP SKU / drop % / Archive UU. No TGT.
- No new `localStorage` key. No `world.missions` parallel array. No `world.explored`.
- No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows. No Unknowables dock.
- No MSN-03. No espionage. No `asteroidId`. No new `WORLD_FIELDS`.
- Do not specify hunt, passenger, espionage, or faction-war numbers.
- Do not invent police restitution.
- Do not edit the wishlist or `PROGRESS.md` in this wave.
- Do not schedule or land implementation PRs in Wave 77.
- Do not edit `docs/MsnMissionsDesign.md`, `docs/Msn02TradeDesign.md`, or `docs/ExpDataTradeDesign.md` from this worker.
- Do not “fix” WAVE4 / WAVE26 / WAVE35.

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | `station.js` (or a later `jobs.js` owned by the serial). `save.js` sanitize on restore | station UI + ticks |
| Unique four ids | `makeJobs` only when empty | boot tests |
| Mining slots | `syncMiningJobs` / replace (unchanged) | board |
| Trade slots | `syncTradeJobs` / replace (unchanged) | board |
| Explore slots | `syncExploreJobs` / replace | board |
| `ctx.world.mystery.visited` | `mystery.js` only | explore tick (read) |
| `ctx.world.reputation` | explore complete: employer key only | epics, standing, npc |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |
| `ctx.targets` | TGT / controls only | not jobs |
| Archive desk / data cargo | EXP owner | not explore complete |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (already run docked or not, 3627–3631).

---

## 12. Owner defaults (stand unless overridden)

These defaults **stand**. They do not block impl. No open owner question is required to start PR1.

1. `kind = 'explore'`. Ids `explore-<sysId>-<n>`.
2. `EXPLORE_SLOTS_PER_SYSTEM = 2`. Digit 1–9 overflow is existing UX (mouse Accept). Do not cut to one slot for Digit reasons.
3. Deadline = 600 s, restart on accept (same as mining/trade).
4. `need = 1`. Pay uses `RECOVERY_REWARD * HAUL_MARGIN` at **origin** `jobPayFor`.
5. Site = origin `SYSTEMS.landmarks[slot % len]`; dest-fallback only if origin table empty. No clue bind. No asteroid UUID.
6. Complete = rebound landmark id ∈ `mystery.visited` **and** docked at origin. Already-visited counts.
7. Rep **+2** employer faction (`MINING_REP`). No second Assembly/Unknowables write.
8. Show offered explore at home only; accepted explore on every Jobs board.
9. Do not migrate unique haul/ferry/ace/patrol in this serial.
10. Cap `LIVE_CAP_AT_IMPL + EXPLORE_ROOM` (`4 + 6 * N_SYSTEMS + 16`, 620 at 100). Never drop honest offered mining, trade, or explore. Do not add hunt/passenger rooms.
11. No explore milestone in first impl. No data grant in first impl.
12. Job ids: hyphen-token grammar (§1.3). Do **not** whole-string `SAFE_ID`.
13. Player copy: landmark display name + system display name only (§25).

---

## 13. Verification pins (for a later read-only verifier)

Exact files:

- `docs/Msn02ExploreDesign.md` vs this file vs `out/w77/explore/current-explore-inventory.md`
- Live: `src/systems/station.js` `makeJobs` / `ensureJobs` / `completeJob` / `boardJobs` / `tickDeliveryJobs` / `renderJobs` / `acceptJob` / `otherSystemId` / `jobPayFor` / `HAUL_MARGIN` / `RECOVERY_REWARD` / `MINING_REP` / `h` / `renderArchiveDesk` / `ARCHIVE_UU`
- `src/game/save.js` `WORLD_FIELDS` `'jobs'` `'mystery'`, live cap `4+4*N_SYSTEMS+16`, `sanitizeJobs`, `JOB_KINDS`
- `src/game/mystery.js` `found` / `visited`; radii 35 / 100
- `src/systems/landmarks.js` scene + dim from `mystery.visited`
- `src/game/data-trade.js` tokens, `priceOf` 0 via station, drop rate null
- `src/game/state.js` `COMMODITIES` 308–322 (READ-ONLY); `SYSTEMS` 541; `FACTIONS` 549–564
- `src/game/authored-systems.js` landmark `{id,name,kind,position,line}`
- `src/game/world.js` `WRECK_TTL` 811; NPC never hub-route 24–27
- `src/core/ctx.js` no jobs default, no job events, `cargoCapacity` 20
- Unique four named in `makeJobs` and `scripts/boot-test.mjs` Wave 76 pins
- No `src/` from Wave 77 explore worker
