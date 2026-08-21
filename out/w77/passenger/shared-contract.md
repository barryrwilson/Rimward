# MSN-02 renewable passenger-ferry shared contract

**Wave:** 77. Design only. No passenger-job feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Msn02PassengerDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/MsnMissionsDesign.md`, `docs/Msn02TradeDesign.md`, `docs/Pod02TraffickingDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/RepStandingDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/Tgt05ReticleLockDesign.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, `docs/NpcMissilesDesign.md`, or sibling `out/w77/{hunt,explore}` (those are other workers).  
**Locked sources:** wishlist Initiative MSN MSN-02 passenger ferrying (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 549–556); mining Wave 71; trade Wave 76 (`docs/Msn02TradeDesign.md`); POD-02 shipped (`docs/Pod02TraffickingDesign.md`); live inventory `out/w77/passenger/current-passenger-inventory.md` (code wins); `src/systems/station.js`; `src/game/save.js`; `src/game/pods.js`; `src/game/world.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 77 is markdown only for this family. Implementation is a later **serial** wave. Do not schedule or land passenger PRs in `src/` in this wave.
2. **Extend** `ctx.world.jobs`. Do **not** add a second persist key. Do **not** add a `WORLD_FIELDS` name. Autosave stays `rimward-save-v1`. No new `localStorage` key.
3. First passenger serial family is renewable **passenger escort**: `kind: 'passenger'`. Must **not** collide with unique kinds (`bounty`, `patrol`, `haul`, `ferry`, `recovery`) or shipped families (`mining`, `trade`). **Do not** reuse `'ferry'`. Unique `kind: 'ferry'` / id `ferry-consignment` stays the one-shot Provisions consignment. Defence: wishlist names passenger ferrying as a career distinct from commodity haul; live `ferry` already means fronted Provisions; a second meaning would migrate or collide with WAVE4/WAVE26 ferry pins.
4. **Do not** replace, rename, migrate, or delete the unique four in this serial. Completing unique ferry still sets `done` via `completeJob` (`station.js` 2202–2206, 2395–2402). No splice on unique ferry.
5. Board slot: **`PASSENGER_SLOTS_PER_SYSTEM = 2`**, same count as live `MINING_SLOTS_PER_SYSTEM` 189 and `TRADE_SLOTS_PER_SYSTEM` 190. One-in-one-out like mining/trade: complete or expire → splice → immediately post a new `kind === 'passenger'` job for the same `originSystem` + `slot`. Never leave a `DONE` passenger card.
6. Sanitize cap **grows at impl time**. **Live** cap (Wave 76, already includes mining + trade):

   ```
   live_cap_at_impl = 4 + 4 * N_SYSTEMS + 16
                    // save.js 115–122
                    // 4 unique + 2 mining/system + 2 trade/system + overlay 16
                    // 420 at 100 systems (state.js SYSTEMS merge 541; 6 authored + 94 generated)
   ```

   This family adds **only** passenger room. **Do not** include hunt or explore rooms (sibling Wave 77 workers):

   ```
   N_SYSTEMS            = Object.keys(SYSTEMS).length
   PASSENGER_SLOTS_PER_SYSTEM = 2
   PASSENGER_ROOM       = PASSENGER_SLOTS_PER_SYSTEM * N_SYSTEMS   // 200 at 100
   JOBS_SANITIZE_MAX_at_impl = live_cap_at_impl + PASSENGER_ROOM
                             // 4 + 4*N + 16 + 2*N = 4 + 6*N_SYSTEMS + 16
                             // 620 at 100 systems
   ```

   **Never drop** honest offered mining. **Never drop** honest offered trade. **Never drop** honest offered passenger that is one of the two slots for its `originSystem`. **Never drop** the unique four or any `accepted` job.
7. Destination is a named **other system**. Post dest with live `otherSystemId(ctx, origin)` (`station.js` 1711–1713). Pay **rebinds** that helper (Wave 35 haul 2372–2385; trade 2323–2324). **Do not** copy unique ferry’s stamped `job.destSystem` pay gate (2396). The player may take a multi-gate path. NPC hub-route lore (`world.js` 24–27) does **not** apply to the player. Do not post when `otherSystemId(origin) === origin`.
8. **People are not job cargo.** Do **not** put `survivor` on jobs. Do **not** call `addCargo('survivor')` (`station.js` 1669–1671 writes a faction-less row). Do **not** call `addCargo` / `removeCargo` for this family at all. People lots stay POD-02 (People Digit 7, `trafficking.js` 8). Passenger cards are **jobs**, not slave cargo and not Market rows. `priceOf('survivor')` stays **0** (`station.js` 1689–1690). Do **not** reopen POD-02 UU (160/240).
9. Cargo token: **fail closed — no cargo token.** Unique ferry **fronts Provisions** (`addCargo('provisions', FERRY_UNITS)` 2759). Do **not** blindly copy fronting. The card is a delivery/escort **contract** paid at dest if `accepted` and in-window. A hangar passenger token is **proposed, needs owner**. If ever authored, it must be a new allowlisted non-`survivor` shape **or** remain fail-closed to no token. Default this serial: no hangar row, no `COMMODITIES` row, dest dock completes the job.
10. Units / pay: `need = 1` (one escort contract; not hold units). Stamp `payQuoted` on accept via **origin** `jobPayFor`. Base = live **`FERRY_REWARD` 350** (`station.js` 175). Clamp `0…PAY_QUOTED_MAX` 20000 (`save.js` 123; `station.js` 196). Formula: `clampJobPay(jobPayFor(ctx, originSystem, FERRY_REWARD))`. Defence: unique ferry already authored 350 UU for a ferry career; `priceOf('survivor')` is 0 so `HAUL_MARGIN × survivor` would silently pay 0; `HAUL_MARGIN × FERRY_UNITS × provisions` would invent a provisions-shaped passenger. Reuse the live ferry **base**, not the unique ferry **dest** stamp path. Do not invent a new margin. If a later owner needs a passenger-specific UU table, mark **proposed, needs owner** and **fail closed (no pay)** until authored — **not** this serial.
11. Deadline: reuse mining / wreck clock **600** world seconds (`MINING_DEADLINE` `station.js` 193 cites `world.js` `WRECK_TTL` 811). Offered: from post. Accepted: **restart** on accept. Expire **fails closed**: no credits, no reputation, no favor, no silent complete. Then replace. Do not invent a third clock. Do not use `ctx.elapsed`.
12. Reputation: employer faction **only** on success. Employer = `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, key)`. Delta **`+2`** (`MINING_REP` `station.js` 191). Expire writes nothing. Do **not** copy patrol `ctx.world.reputation.freehold +=` (`station.js` 2233). No `job.faction` field. Never `reputation[userString]`.
13. UI: Jobs pane only. Digit **2**. No new Digit. No HUD glance. `textContent` / existing `h()` / `'commLine'` only. **No `innerHTML`**. Regen titles from templates + allowlisted `SYSTEMS[id].station.name`. Do not print `job.faction`. Do not use `job.faction` as a write source.
14. `state.js` is READ-ONLY. No new `COMMODITIES` rows. No `survivor` / `dataCrystal` / `dataCube` / `livingRock` as seed cargo. No new frozen event in `ctx.js`. Completions keep `'commLine'`. Prefer `commLine` over a new type.
15. Prototype keys fail closed. Hyphen-token job ids (`SAFE_ID` is the **token** class only). Drop `RESERVED_IDS` on the full id **and** every token. Walk with `Object.keys` / index `for`, never `for…in` blob merge. Fresh `{}` literals only.
16. Do not invent hunt, exploration, espionage, or faction-war numbers. Those families stay later / sibling workers. Espionage still depends on a later REP brief (REP-04).
17. Do not reopen mining hardness, `asteroidId`, POD sale, BIO grafts, SHP hull grants, HUD-02, TGT-05, EXP desk SKUs, unique ferry fronting, unique haul dest pricing.
18. Do not “fix” boot-test known FAILs: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul named dest.
19. Unique `makeJobs` ids stay until a **later** serial migrates them. This serial must not rename them (boot-test pins).

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'jobs'` (`save.js` 78). Keep it.

Call site today: `sanitizeJobs(ctx)` from `sanitizeRestored` (`save.js` 711). Passenger serial **extends** that healer. Do not add a second walk.

### 1.2 Array heal

- If `world.jobs` is missing, not an array, or empty after drop → leave `[]` and let `ensureJobs` rebuild the **four unique** cards (`station.js` 1759–1762).
- Walk with `Object.keys` / index `for`, never `for…in`.
- Fresh `[]`. Push fresh `{}` literals only. Never `Object.assign` a raw save object onto a live job.

**Cap (fits mining + trade + passenger, cited live galaxy). Hunt/explore rooms are not in this formula:**

```
N_SYSTEMS            = Object.keys(SYSTEMS).length
                     // inventory-time 100: 6 authored + 94 generated
                     // state.js 12–18, 541
live_cap_at_impl     = 4 + 4 * N_SYSTEMS + 16          // 420 at 100; save.js 115–122
PASSENGER_ROOM       = PASSENGER_SLOTS_PER_SYSTEM * N_SYSTEMS  // 2 * 100 = 200
OVERLAY_HEADROOM     = 16   // already inside live_cap_at_impl
JOBS_SANITIZE_MAX    = live_cap_at_impl + PASSENGER_ROOM
                     // inventory-time 420 + 200 = 620
                     // 4 + 6*N_SYSTEMS + 16
```

Live formula `4 + 4 * N_SYSTEMS + 16` (**420**) cannot hold two extra passenger slots per system. Do **not** keep 420 at impl. Do **not** use 64. Do **not** add hunt/explore terms.

Drop overflow in this order until `length ≤ JOBS_SANITIZE_MAX`:

1. Invalid rows (fail §1.3–1.4).
2. Extra mining on a system that already has two valid `offered|accepted` mining jobs (keep lowest `slot`, then lowest `n` in the id). Duplicate/tamper. Live `extraOfferedMining` (`save.js` 384–386).
3. Extra trade on a system that already has two valid `offered|accepted` trade jobs. Live `extraOfferedTrade` (`save.js` 388–390).
4. Extra passenger on a system that already has two valid `offered|accepted` passenger jobs (same rule, `kind === 'passenger'`). Duplicate/tamper.
5. `done`/`failed` mining, trade, or passenger (should not exist if replace ran).
6. `done` pirate / `done` recovery.
7. Tamper-only last resort: if still over cap, drop **offered pirate/recovery** whose `system`/`originSystem` ≠ `currentSystem`. Honest play never needs this.

**Never drop** (if the row still sanitizes):

- The four unique ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`), any state.
- Any `accepted` job.
- Any **offered mining** that is one of the two slots for its `originSystem`.
- Any **offered trade** that is one of the two slots for its `originSystem`.
- Any **offered passenger** that is one of the two slots for its `originSystem`.

Normal play: ≤200 mining + ≤200 trade + ≤200 passenger + 4 unique + ≤16 overlays ≤ 620. Restore must not delete offered mining or offered trade to “make room.”

### 1.3 Job id grammar (implementable)

Live `SAFE_ID` rejects hyphens. Every live job id **contains** hyphens. **Do not** run `SAFE_ID.test` on the full `job.id`.

**Token class** (same characters as `SAFE_ID`, one segment):

```
JOB_ID_TOKEN = /^[a-z0-9_]+$/i     // save.js SAFE_ID body, one hyphen-separated token
```

**Full id:**

1. Type string. Length 1…`ID_MAX` 64 (`save.js` 103).
2. No leading / trailing / doubled `-`. Split on `'-'`. Every token matches `JOB_ID_TOKEN` and is non-empty.
3. Full id is **not** in `RESERVED_IDS`. Every token, compared with `toLowerCase()`, is **not** in `RESERVED_IDS`. Drops `__proto__`, `passenger-__proto__-0`, `constructor`, `bounty-prototype`.
4. Never use the id as an object key (`jobs[id] =`). Array of objects only.

**Kind-specific (after tokens pass):**

| Kind | Id rule |
|---|---|
| Unique four | **Exact** `bounty-ace` \| `patrol-lane` \| `haul-provisions` \| `ferry-consignment`. Boot-test pins. |
| Mining | Unchanged Wave 71: three tokens `mine`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `originSystem` equals `sysId`. |
| Trade | Unchanged Wave 76: three tokens `trade`, `sysId`, `n`. Same sys/`n` rules. |
| **Passenger (this serial)** | Exactly three tokens: `passenger`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `sysId` not reserved. `originSystem` must equal `sysId`. |
| Pirate overlay | Prefix `bounty-pirate-` plus ≥1 further token. First passenger serial does not retcon. |
| Recovery overlay | Prefix `recovery-` plus ≥1 further token. |

Examples that **must keep**: `bounty-ace`, `haul-provisions`, `ferry-consignment`, `mine-freehold-0`, `trade-freehold-0`, `passenger-freehold-0`, `passenger-fh_hearth-1`.  
Examples that **must drop**: `__proto__`, `passenger-__proto__-0`, `passenger-freehold`, `passenger-notasystem-0`, `ferry-consignment-0` (unique four are exact; do not prefix them). Do **not** rewrite unique ids to underscores. Do **not** allocate `ferry-<sys>-<n>` (that would collide with unique kind `'ferry'`).

Passenger allocator: monotonic `n` per process (or scan max like `nextTradeId`, `station.js` 2009–2027). Collision → increment `n`. System token is a `SYSTEMS` key (underscores allowed: `fh_hearth`). Hyphens only as separators, never inside the system key.

Do **not** copy `pirateBountyId(name)` for passenger ids.

### 1.4 Per-job allowlist

Keep a job only if **all** hold. Extend live `JOB_KINDS` with `'passenger'`. Do not remove `'mining'` or `'trade'`. Do not remove `'ferry'`.

| Field | Rule |
|---|---|
| `id` | §1.3 grammar for that `kind`. **Not** whole-string `SAFE_ID.test` |
| `kind` | one of `bounty` \| `patrol` \| `haul` \| `ferry` \| `recovery` \| `mining` \| `trade` \| **`passenger`** |
| `state` | one of `offered` \| `accepted` \| `done` \| `failed` |
| `title`, `detail` | string; `stripControlChars`; cap 240 / 720; empty → drop job |
| `reward`, `need`, `progress` | finite number; `need` ≥ 1; `progress` ≥ 0; clamp `progress` ≤ `need`. **Passenger:** `need` must be integer **1**. Else drop the passenger job (do not heal a stuffed count) |
| `originSystem`, `destSystem`, `system` | if present: `Object.hasOwn(SYSTEMS, id)` else drop field or drop job if required for kind |
| `payQuoted`, `originPrice` | if present: finite ≥ 0 integer after `Math.round`; **clamp `0…PAY_QUOTED_MAX`**. `PAY_QUOTED_MAX = 20000` (live) |
| `target` | string; `stripControlChars`; `NAME_MAX` 40; bounty only |
| `wreckId` | recovery only; hyphen-token; cap 64 |
| `collected` | recovery only; boolean |
| `commodity` | mining/trade: unchanged live rules. **Passenger: forbidden.** If present (including `'survivor'`), **drop the passenger job**. No person-commodity. |
| `deadline` | if present: finite `world.time` units ≥ 0; if non-finite, drop the field (offered unique cards have none). Passenger **requires** finite `deadline` |
| `slot` | mining, trade, or passenger: integer `0` or `1`; else drop that family job |
| `faction` | **Forbidden.** Unknown keys drop. Do not copy |

Unknown keys: drop (do not copy). Prototype keys: drop.

**Passenger-required fields:** `originSystem`, `destSystem`, `slot`, `deadline`. `destSystem` must be a `SYSTEMS` key, must **not** equal `originSystem`, and must **not** be reserved. If `destSystem !== otherSystemId` cannot be checked in `save.js` without importing station helpers: freeze dest as a `SYSTEMS` key ≠ origin. Pay time rebinds with `otherSystemId` (§3.5) so a stuffed dest cannot retarget payout.

### 1.5 Clock

`world.time` already heals to `0` (`save.js` 709). Deadline compares use that clock, never `ctx.elapsed`.

A hand-edited future `world.time` may expire accepted passenger jobs — fail closed, then replace. Same cheat class as editing credits. Do not add a second clock.

---

## 2. Board slot (passenger family)

### 2.1 What a slot is

For passenger only:

- Each system may have **two** passenger jobs (`slot` 0 and 1) in `world.jobs` whose `originSystem === that system` and `kind === 'passenger'`.
- States in a slot: `offered` or `accepted`. `failed`/`done` are transient: splice in the same function that posted the replacement.
- The Jobs board **shows** offered passenger when `ctx.world.currentSystem === originSystem`. Accepted passenger cards also show on other docks as a reminder (state line names the **destination** dock). Same pattern as mining (`boardJobs` 2138) and trade (2139).

Mining and trade slots are independent. A system may hold two mining **and** two trade **and** two passenger jobs.

### 2.2 Fill

`syncPassengerJobs(ctx, sysId)` on `renderJobs` (after `syncTradeJobs`):

- If `otherSystemId(ctx, sysId) === sysId` or `!Object.hasOwn(SYSTEMS, otherSystemId(…))`, **do not post** passenger for that system (gates-less: undeliverable).
- Count passenger jobs with `originSystem === sysId` and state `offered|accepted`.
- While count < `PASSENGER_SLOTS_PER_SYSTEM`, push a new offered passenger job for `sysId` with `destSystem = otherSystemId(ctx, sysId)`.
- Do **not** reshuffle existing offered cards on each render.
- Do **not** fill mining or trade slots with passenger, or passenger slots with mining/trade.

### 2.3 One-in-one-out

On passenger complete **or** passenger expire:

1. Note `originSystem` and `slot`.
2. Pay or not (complete pays; expire does not).
3. `splice` that element.
4. Immediately `push` a new offered passenger job for the same system and slot (skip push if dest would equal origin).
5. If the overlay is open on Jobs, `render()` so the replacement is visible this interaction.

Never `state = 'done'` on passenger (unlike today’s unique `completeJob`). Set `failed` **before** pay (mining 2280–2281; trade 2330) so a crash mid-replace cannot pay twice. Unique kinds still use today’s `done`.

### 2.4 Unique cards (not slots)

`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` stay unique. Completing unique ferry still sets `done` and still occupies a board row. **Later serial** may migrate unique ferry onto a cargo family. **Not this serial.** Unique ferry stays Provisions.

Pirate / recovery overlays stay as today. Mining and trade slots stay as today.

---

## 3. Passenger family (this vertical slice)

### 3.1 Player-facing contract

Accept at **home** dock. No buy-in. No cargo front. Fly to the **named other system** (primary-gate dest from `otherSystemId`; any player path is legal). Redock at that station. Delivery tick pays stamped `payQuoted`, writes employer rep, dockmaster trust as mining (via `rewardJobContacts` or equivalent **without** calling unique `completeJob` `done`), splice, new card on the **origin** board immediately.

Copy the haul/ferry **dock-pay** shape (`tickDeliveryJobs`), not a new event.

**Not** ferry fronting. **Not** unique ferry dest-dock `jobPayFor`. **Not** a hold check. Dest dock completes if `state === 'accepted'` and in-window.

### 3.2 Fields (JSON-plain)

```
{
  id,                 // passenger-<sysId>-<n>
  kind: 'passenger',
  slot,               // 0 | 1
  originSystem,       // SYSTEMS key; home dock
  destSystem,         // SYSTEMS key; otherSystemId(origin) at post
  title, detail,      // authored templates, textContent
  reward,             // FERRY_REWARD 350 base before jobPayFor
  payQuoted,          // stamped on accept (jobPayFor at ORIGIN)
  need,               // 1
  progress,           // unused; keep 0
  state,              // offered | accepted
  deadline,           // world.time seconds when the card fails
}
```

No `asteroidId`. No THREE. No `target` name. **No `faction` field.** **No `commodity` field.** Employer at pay time is `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, faction)`. A save must not retarget reputation by stuffing `job.faction`.

### 3.3 No commodity seed / no people cargo

First impl must **not**:

- set `job.commodity`
- call `addCargo` / `removeCargo` / `holdUnits` for completion
- seed `survivor`, `dataCrystal`, `dataCube`, `livingRock`, or any `COMMODITIES` key
- write hangar rows
- open People Digit 7
- invent police restitution

Copy names dest from `SYSTEMS[dest].station.name` only. Do not print passenger names from save strings.

Hangar passenger token: **proposed, needs owner**. Until authored: no token.

Do not add `COMMODITIES` rows. `state.js` READ-ONLY.

### 3.4 Need / pay / rep (cite; do not invent)

| Number | Value | Status |
|---|---|---|
| `need` | **1** | escort contract count, not hold units. Sanitize drops any other |
| `payQuoted` | `clampJobPay(jobPayFor(ctx, originSystem, FERRY_REWARD))` | cite `FERRY_REWARD` 350 (`station.js` 175); mining/trade origin stamp 2777, 2806. **Origin**, not dest |
| Clamp | `PAY_QUOTED_MAX` 20000 | cite `station.js` 196; `save.js` 123 |
| Reputation | **`+2`** to `SYSTEMS[originSystem].faction` if `Object.hasOwn(FACTIONS, faction)` | cite `MINING_REP` 191, mining write 2288–2291. Legal work, employer only |
| Trust/favor | reuse `rewardJobContacts` dockmaster path | cite 2189–2200. Do not mark unique `done` |
| Deadline length | `MINING_DEADLINE` / `WRECK_TTL` **600** world seconds from **accept** (offered cards: from post time) | cite `station.js` 193; `world.js` 811 |
| Offered lifetime | same 600 s from post; expire → fail closed → replace | keeps the board moving if ignored |
| Margin | **none extra**. Base is authored `FERRY_REWARD`, not `HAUL_MARGIN × units` | unique ferry dest stamp stays on unique ferry only |
| Unique ferry pay | dest `jobPayFor` + stamped `destSystem` gate | **unchanged**. `station.js` 2758, 2396 |

Do not author new UU tables in `state.js`. Unique ferry still prices the **destination** dock; this family prices the **origin** dock (explicit). Do not change unique haul/ferry stamp code in this serial.

### 3.5 Tick / expire / dest bind

Cadence: ride `tickDeliveryJobs` (0.5 s, `station.js` 3630–3631) **and** a cheap expire scan there (not only while docked). Reverse walk so splice does not skip.

**Complete** (accepted, docked):

```
origin = job.originSystem
if (!Object.hasOwn(SYSTEMS, origin)) continue
dest = otherSystemId(ctx, origin)          // Wave 35 / trade bind — ignore stuffed job.destSystem for PAY
if (ctx.world.currentSystem !== dest || dest === origin) continue
// no holdUnits; no removeCargo; no commodity
job.state = 'failed'                       // before pay — mining 2280–2281
pay = clampJobPay(job.payQuoted) if finite else clampJobPay(jobPayFor(origin, FERRY_REWARD))
credits += pay
employer rep +2 if Object.hasOwn(FACTIONS, SYSTEMS[origin].faction)
rewardJobContacts
commLine via textContent path
splice + replace (§2.3)
```

**Do not** pay at origin. **Do not** pay at an arbitrary non-origin dock. **Do not** use stuffed `job.destSystem` as the pay gate. **Do not** remove Provisions or survivors.

Render / state-line dest **name** also comes from `otherSystemId(origin)` + `SYSTEMS[dest].station.name` (trade render 2847–2851), not from a save string.

**Expire** (`world.time >= deadline` and state offered or accepted):

- no cargo remove
- no pay
- no rep / no favor
- commLine: contract lapsed (accepted) or posting withdrawn (offered)
- splice + replace

**Silent complete is forbidden.** A tampered `deadline` in the past on restore expires on the next tick, fail closed.

Unique-ferry “short hold, stay open” does **not** apply. Expire always closes. There is no hold to come up short.

### 3.6 Accept

Offered passenger is **home-only**. `acceptJob` must refuse (no state flip, no stamp, notice) when:

- `job.kind === 'passenger'` and `ctx.world.currentSystem !== job.originSystem`
- dest would be `otherSystemId(origin) === origin` or not a `SYSTEMS` key
- `state !== 'offered'`

Unique haul may still be accepted at either dock (unchanged). Unique ferry still fronts Provisions (unchanged). Do not copy either onto passenger slots.

No cargo fronting. No capacity check (no units added). Stamp:

- `payQuoted` with **origin** `jobPayFor(ctx, origin, FERRY_REWARD)` + `clampJobPay`
- `deadline = world.time + 600` (restart; offer timer only clears ignored cards)
- `originSystem` already set at post; **do not** retarget from `currentSystem`
- `destSystem = otherSystemId(ctx, origin)` refresh from live gates (display); pay still uses `otherSystemId` at tick

`boardJobs` hides offered passenger unless `originSystem === sysId` (same line as mining/trade, `station.js` 2138–2139). Hide **and** refuse: a missed filter must not accept a foreign card.

Digit accept stays index-into-`boardJobs` (live 3548–3550) but mutates the **job object by identity**. Replacement must not reuse the spliced object. Do not accept `done`/`failed`.

---

## 4. Id and XSS

- Allocate passenger ids per §1.3 (`passenger-<SYSTEMS key>-<n>`). Confirm `Object.hasOwn(SYSTEMS, sysId)` first. Collision → increment `n`. Never `jobs[id] =` as a map. Never `SAFE_ID.test` the full id.
- `title` / `detail` / commLine / notices: `h(..., text)` / `textContent` / `emit('commLine', { text })`. Interpolate station name from allowlisted keys, not save strings, when regenerating. Restored title/detail already stripped.
- `pirateBountyId(name)` stays pre-existing; do not copy for passenger.
- No `innerHTML`. No HUD glance row. No new Digit.

Suggested templates (authored strings in `station.js` / a tiny `jobs.js`, not a table dump):

- Title: `Escort passengers`
- Detail: `Carry a booked party to <dest station name>. Paid on docking there.`
- Offered reward: `Escort to <dest> — pays <est> UU`
- Accepted: `ACCEPTED — dock at <dest> · t left`

Forbidden copy: slave, stock, meat, bargain, `survivor` as a commodity name, POD sale voice.

---

## 5. Faction attribution (REP-04 adjacency)

First-slice passenger is **overt legal work**:

- On success: employer = `SYSTEMS[originSystem].faction` only (live table, not a job field).
- On success: **no** target-faction write (destination faction is not a target).
- On expire: no write.
- Use `Object.hasOwn(FACTIONS, faction)` before indexing `world.reputation`. Fresh bag entry only for known keys. Never `reputation[userString]`.
- Do **not** fix patrol’s hardcoded `freehold` in the passenger PRs unless a named serial owner takes it.

Espionage later: successful secret → no target loss (wishlist REP-04). **Depends on later REP brief.** Faction-vs-faction later: employer up, target down — same dependency. Police restitution (REP-03) is out of MSN. POD-02 sale stays Digit 7.

---

## 6. Events and milestones

- No new type in `ctx.js` EVENTS comment.
- Optional first-complete milestone id omitted in first impl (less persist surface).
- Witness Rule: passenger does not fabricate incidents or wrecks.
- Do not emit `survivorSold` / `survivorRescued` from this family.

---

## 7. Closed neighbours

| Topic | Law |
|---|---|
| Mining MSN | Keep slots, kind, cap share, `boardJobs` mining filter. Grow cap by passenger room only. Never drop honest mining |
| Trade MSN | Keep slots, kind, `boardJobs` trade filter. Never drop honest trade. Do not reuse `kind: 'trade'` |
| Unique ferry | Untouched id, kind, Provisions front, dest stamp, WAVE26 pins |
| Unique haul | Untouched dest `jobPayFor` and Wave 35 dest bind |
| EXP data | No `dataCrystal` / `dataCube` on jobs. `priceOf` data stays 0 |
| POD | No survivor commodity on jobs. No People-desk change. UU 160/240 stay trafficking.js |
| BIO | No `livingRock` seed. Feed Digit unchanged |
| SHP | Digit 0 untouched. No hull/loadout as mission reward. Hangar passenger token needs owner |
| HUD-02 | No chart identity work |
| TGT-05 | Do not steal `ctx.targets` |
| REP | Employer-only +2. No freehold copy. No espionage numbers |
| AST | No `asteroidId` |
| NPC traders | Hub-route lore is NPC-only (`world.js` 24–27) |
| Hunt / explore | Sibling Wave 77. **Out of this formula and this brief’s numbers** |

---

## 8. Serial PR plan (implementation wave, **not** Wave 77)

Named only. Do **not** implement in this wave.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'passenger'` on `JOB_KINDS`; id grammar `passenger-<sys>-<n>`; dest/slot allowlist; **no `commodity`**; cap `live_cap_at_impl + PASSENGER_ROOM` (`4+6*N+16` = 620 at 100); proto drop; unique four **kept**; honest mining **kept**; honest trade **kept** | Sync/UI/pay; whole-string `SAFE_ID` on job.id; unique migration; hunt/explore cap terms |
| **PR2 sync + accept + deliver** | `syncPassengerJobs` 2 slots; render/accept; dest = `otherSystemId`; `payQuoted` origin `FERRY_REWARD`; dest-dock tick **no cargo**; `failed`-first then pay | Expire, one-in-one-out, other families; `addCargo('survivor')`; unique ferry edits |
| **PR3 replace + expire** | splice + immediate replace; deadline 600 s fail closed; no `DONE` passenger | Unique-card migration; mining/trade reopen; POD reopen |
| **PR4 UI copy** | state + remaining time + dest name on passenger cards; `textContent` only; Digit 2 only | HUD-02, innerHTML, Digit remap, People Digit 7 |
| **PR5 boot pins** | drop `passenger-__proto__-0`; keep `bounty-ace` + `ferry-consignment` + `haul-provisions` + `mine-freehold-0` + `trade-freehold-0` + `passenger-freehold-0`; 200 mining + 200 trade + 200 passenger + 4 unique fit cap 620; complete→replace; expire no pay; dest stuffed ignored at pay; `commodity: 'survivor'` passenger drops; unique ferry still `done` (no splice); WAVE26/WAVE35 unique haul/ferry still pass | wishlist / PROGRESS edits by feature workers |

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave. Do not treat WAVE4 / WAVE26 / WAVE35 known FAILs as passenger bugs.

---

## 9. Later families (named, not specified)

Do **not** fill numbers. After this passenger serial:

1. Later serial may migrate unique haul/ferry onto renewable cargo slots (not passenger).
2. Local pirate hunt as slots (sibling / later).
3. Exploration / information — depends on EXP persist shape.
4. Faction-level pirate as a renewable **or** keep unique ace + MSN-03.
5. Faction-vs-faction — **after REP brief**.
6. Espionage — **after REP brief** (secret vs attributed). REP-04.
7. **MSN-03** authored chains for rare equipment — after the ordinary pool is renewable.
8. Hangar passenger token — only if an owner authors a non-`survivor` allowlisted shape.

---

## 10. Non-goals (locked)

- No `src/` in Wave 77 for this family.
- No HUD-02. No AST rock UUIDs. No POD reopen. No SHP grants. No BIO graft. No EXP SKU. No TGT.
- No new `localStorage` key. No `world.missions` parallel array.
- No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows.
- No MSN-03. No espionage. No hunt/explore numbers. No `asteroidId`. No new `WORLD_FIELDS`.
- Do not edit the wishlist or `PROGRESS.md` in this wave.
- Do not schedule or land implementation PRs in Wave 77.
- Do not edit `docs/MsnMissionsDesign.md`, `docs/Msn02TradeDesign.md`, or `docs/Pod02TraffickingDesign.md` from this worker.

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | `station.js` (or a later `jobs.js` owned by the serial). `save.js` sanitize on restore | station UI + ticks |
| Unique four ids | `makeJobs` only when empty | boot tests |
| Mining slots | `syncMiningJobs` / replace (unchanged) | board |
| Trade slots | `syncTradeJobs` / replace (unchanged) | board |
| Passenger slots | `syncPassengerJobs` / replace | board |
| `ctx.world.reputation` | passenger complete: employer key only | epics, standing, npc |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |
| `ctx.targets` | TGT / controls only | not jobs |
| `ctx.cargo` / survivor rows | POD scoop / People desk | **not this family** |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (already run docked or not, 3627–3631).

---

## 12. Owner defaults (stand unless overridden)

These defaults **stand**. They do not block impl. No open owner question is required to start PR1.

1. `kind = 'passenger'`. Ids `passenger-<sysId>-<n>`. Unique `'ferry'` untouched.
2. `PASSENGER_SLOTS_PER_SYSTEM = 2`. Digit 1–9 overflow is existing UX (mouse Accept). Do not cut to one slot for Digit reasons.
3. Deadline = 600 s, restart on accept (same as mining/trade).
4. `need = 1`. Pay uses **origin** `jobPayFor` of live `FERRY_REWARD` 350. No new margin.
5. **No cargo token.** No `commodity`. No `addCargo`. Hangar token needs owner.
6. Dest = `otherSystemId(origin)`. Pay rebinds that helper. Player multi-gate path OK.
7. Rep **+2** employer faction (`MINING_REP`).
8. Show offered passenger at home only; accepted passenger on every Jobs board.
9. Do not migrate unique haul/ferry/ace/patrol in this serial.
10. Cap `live_cap_at_impl + PASSENGER_ROOM` = `4 + 6 * N_SYSTEMS + 16` (620 at 100). Never drop honest offered mining, trade, or passenger. **No hunt/explore room in this formula.**
11. No passenger milestone in first impl.
12. Job ids: hyphen-token grammar (§1.3). Do **not** whole-string `SAFE_ID`.

---

## 13. Verification pins (for a later read-only verifier)

Exact files:

- `docs/Msn02PassengerDesign.md` vs this file vs `out/w77/passenger/current-passenger-inventory.md`
- Live: `src/systems/station.js` `makeJobs` / `ensureJobs` / `completeJob` / `boardJobs` / `tickDeliveryJobs` / `renderJobs` / `acceptJob` / `otherSystemId` / `jobPayFor` / `FERRY_REWARD` / `FERRY_UNITS` / `holdUnits` / `addCargo` / `h` / Digit 2
- `src/game/save.js` `WORLD_FIELDS` `'jobs'`, live cap `4+4*N_SYSTEMS+16`, `sanitizeJobs`, `JOB_KINDS`
- `src/game/pods.js` survivor row shape; scoop merge
- `src/game/state.js` `COMMODITIES` 308–322 (READ-ONLY); `SYSTEMS` 541; `FACTIONS` 549–564
- `src/game/world.js` `WRECK_TTL` 811; NPC never hub-route 24–27
- `src/core/ctx.js` no jobs default, no job events, `cargoCapacity` 20
- Unique four named in `makeJobs`; unique ferry complete still `done`
- POD-02: `trafficking.js` 8; People Digit 7; `priceOf('survivor')` 0
