# MSN-02 renewable trade / commodity-delivery shared contract

**Wave:** 75. Design only. No trade-job feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Msn02TradeDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/MsnMissionsDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/Pod02TraffickingDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/ShpDesign.md`, `docs/Tgt05ReticleLockDesign.md`, `docs/RepStandingDesign.md`, or sibling `out/w75/{bio03,npc-missiles}` (those are other workers).  
**Locked sources:** wishlist Initiative MSN MSN-02 commodity trading and delivery (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 533–538); mining family shipped Wave 71 (`docs/MsnMissionsDesign.md`); live inventory `out/w75/msn02/current-mission-trade-inventory.md` (code wins); `src/systems/station.js`; `src/game/save.js`; `src/game/world.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 75 is markdown only for this family. Implementation is a later **serial** wave. Do not schedule or land trade PRs in `src/` in this wave.
2. **Extend** `ctx.world.jobs`. Do **not** add a second persist key. Do **not** add a `WORLD_FIELDS` name. Autosave stays `rimward-save-v1`. No new `localStorage` key.
3. First trade serial family is renewable **trade/haul**: `kind: 'trade'`. Must **not** collide with `'mining'` or with unique ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`) or unique kinds (`bounty`, `patrol`, `haul`, `ferry`).
4. **Do not** replace, rename, migrate, or delete the unique four in this serial. Completing unique haul/ferry still sets `done` via `completeJob`.
5. Board slot: **`TRADE_SLOTS_PER_SYSTEM = 2`**, same count as live `MINING_SLOTS_PER_SYSTEM` (`station.js` 189). One-in-one-out like mining: complete or expire → splice → immediately post a new `kind === 'trade'` job for the same `originSystem` + `slot`. Never leave a `DONE` trade card.
6. Sanitize cap **grows**. Live cap is `4 + 2 * N_SYSTEMS + 16` (`save.js` 117–119) = **220** at 100 systems. New formula:

   ```
   N_SYSTEMS         = Object.keys(SYSTEMS).length   // 100 at inventory
   MINING_ROOM       = 2 * N_SYSTEMS                 // live mining
   TRADE_ROOM        = 2 * N_SYSTEMS                 // this family
   OVERLAY_HEADROOM  = 16                            // pirate cap 2 + recovery + spare
   JOBS_SANITIZE_MAX = 4 + MINING_ROOM + TRADE_ROOM + OVERLAY_HEADROOM
                     // 4 + 2*N + 2*N + 16 = 4 + 4*N_SYSTEMS + 16
                     // 420 at 100 systems
   ```

   **Never drop** honest offered mining to make room. **Never drop** honest offered trade that is one of the two slots for its `originSystem`. **Never drop** the unique four or any `accepted` job.
7. Destination is a named **other system**. Post dest with live `otherSystemId(ctx, origin)` (`station.js` 1708–1710). Pay binds that named dest (Wave 35 haul + ferry precedent). The player may take a multi-gate path. NPC hub-route lore (`world.js` 24–27) does **not** apply to the player. Do not post when `otherSystemId(origin) === origin`.
8. Commodity: live `COMMODITIES` keys with `bulk: true` **except** `livingRock`. First-slice seed pool: `provisions`, `refinedMetals`, `rawOre`. Prefer `provisions` (unique haul cargo). **No** `survivor`. **No** `dataCrystal` / `dataCube`. **No** `livingRock` as a seed (BIO). **No** exotic ores. **No** `restrictedComponents`. Do **not** add `COMMODITIES` rows. `state.js` READ-ONLY.
9. Units / pay: `need = HAUL_UNITS` **5** (`station.js` 172). Stamp `payQuoted` on accept (Wave 26). Compute with **`jobPayFor` at origin** (mining precedent, not unique-haul dest pricing). Base = `round(need * priceOf(commodity) * HAUL_MARGIN)` with live `HAUL_MARGIN` 1.4 (`station.js` 173). Clamp `0…PAY_QUOTED_MAX` 20000 (`save.js` 120; `station.js` 194). Do not invent a new margin. If a later owner needs a different number, mark **proposed, needs owner** and **fail closed (no pay)** until authored — **not** this serial.
10. Deadline: reuse mining / wreck clock **600** world seconds (`MINING_DEADLINE` `station.js` 192 cites `world.js` `WRECK_TTL` 811). Offered: from post. Accepted: **restart** on accept. Expire **fails closed**: no credits, no reputation, no favor, no silent complete. Then replace. Do not invent a third clock. Do not use `ctx.elapsed`.
11. Reputation: employer faction **only** on success. Employer = `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, key)`. Delta **`+2`** (`MINING_REP` `station.js` 190). Expire writes nothing. Do **not** copy patrol `ctx.world.reputation.freehold +=` (`station.js` 2095). No `job.faction` field. Never `reputation[userString]`.
12. UI: Jobs pane only. Digit **2**. No new Digit. No HUD glance. `textContent` / existing `h()` / `'commLine'` only. **No `innerHTML`**. Regen titles from templates + allowlisted `COMMODITIES[key].name` and `SYSTEMS[id].station.name`. Do not print `job.faction`. Do not use `job.faction` as a write source.
13. `state.js` is READ-ONLY. No new frozen event in `ctx.js`. Completions keep `'commLine'`. Prefer `commLine` over a new type.
14. Prototype keys fail closed. Hyphen-token job ids (`SAFE_ID` is the **token** class only). Drop `RESERVED_IDS` on the full id **and** every token. Walk with `Object.keys` / index `for`, never `for…in` blob merge. Fresh `{}` literals only.
15. Do not invent espionage, faction-war, passenger, hunt, or exploration numbers. Those families stay later. Espionage still depends on a later REP brief (REP-04).
16. Do not reopen mining hardness, `asteroidId`, POD sale, BIO grafts, SHP hull grants, HUD-02, TGT-05, EXP desk SKUs.
17. Do not “fix” boot-test known FAILs: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul named dest.
18. Unique `makeJobs` ids stay until a **later** serial migrates them. This serial must not rename them (boot-test pins).

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'jobs'` (`save.js` 78). Keep it.

Call site today: `sanitizeJobs(ctx)` from `sanitizeRestored` (`save.js` 677). Trade serial **extends** that healer. Do not add a second walk.

### 1.2 Array heal

- If `world.jobs` is missing, not an array, or empty after drop → leave `[]` and let `ensureJobs` rebuild the **four unique** cards (`station.js` 1756–1759).
- Walk with `Object.keys` / index `for`, never `for…in`.
- Fresh `[]`. Push fresh `{}` literals only. Never `Object.assign` a raw save object onto a live job.

**Cap (fits mining + trade, cited live galaxy):**

```
N_SYSTEMS            = Object.keys(SYSTEMS).length
                     // inventory-time 100: 6 authored + 94 generated
                     // state.js 12–18, 500–541
MINING_ROOM          = 2 * N_SYSTEMS                 // 200
TRADE_ROOM           = TRADE_SLOTS_PER_SYSTEM * N_SYSTEMS  // 2 * 100 = 200
OVERLAY_HEADROOM     = 16   // PIRATE_BOUNTY_CAP 2 + 1 recovery + in-flight spare
JOBS_SANITIZE_MAX    = 4 + MINING_ROOM + TRADE_ROOM + OVERLAY_HEADROOM
                     // inventory-time 4 + 200 + 200 + 16 = 420
```

Live formula `4 + 2 * N_SYSTEMS + 16` (**220**) cannot hold two mining **and** two trade slots per system. Do **not** keep 220. Do **not** use 64.

Drop overflow in this order until `length ≤ JOBS_SANITIZE_MAX`:

1. Invalid rows (fail §1.3–1.4).
2. Extra mining on a system that already has two valid `offered|accepted` mining jobs (keep lowest `slot`, then lowest `n` in the id). Duplicate/tamper, not a honest slot. Live `extraOfferedMining` (`save.js` 334–358).
3. Extra trade on a system that already has two valid `offered|accepted` trade jobs (same rule, `kind === 'trade'`). Duplicate/tamper.
4. `done`/`failed` mining or trade (should not exist if replace ran).
5. `done` pirate / `done` recovery.
6. Tamper-only last resort: if still over cap, drop **offered pirate/recovery** whose `system`/`originSystem` ≠ `currentSystem`. Honest play never needs this.

**Never drop** (if the row still sanitizes):

- The four unique ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`), any state.
- Any `accepted` job.
- Any **offered mining** that is one of the two slots for its `originSystem`.
- Any **offered trade** that is one of the two slots for its `originSystem`.

Normal play: ≤200 mining + ≤200 trade + 4 unique + ≤16 overlays ≤ 420. Restore must not delete offered mining or offered trade to “make room.”

### 1.3 Job id grammar (implementable)

Live `SAFE_ID` rejects hyphens. Every live job id **contains** hyphens. **Do not** run `SAFE_ID.test` on the full `job.id`.

**Token class** (same characters as `SAFE_ID`, one segment):

```
JOB_ID_TOKEN = /^[a-z0-9_]+$/i     // save.js SAFE_ID body, one hyphen-separated token
```

**Full id:**

1. Type string. Length 1…`ID_MAX` 64 (`save.js` 103).
2. No leading / trailing / doubled `-`. Split on `'-'`. Every token matches `JOB_ID_TOKEN` and is non-empty.
3. Full id is **not** in `RESERVED_IDS`. Every token, compared with `toLowerCase()`, is **not** in `RESERVED_IDS`. Drops `__proto__`, `trade-__proto__-0`, `constructor`, `bounty-prototype`.
4. Never use the id as an object key (`jobs[id] =`). Array of objects only.

**Kind-specific (after tokens pass):**

| Kind | Id rule |
|---|---|
| Unique four | **Exact** `bounty-ace` \| `patrol-lane` \| `haul-provisions` \| `ferry-consignment`. Boot-test pins. |
| Mining | Unchanged Wave 71: three tokens `mine`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `originSystem` equals `sysId`. |
| **Trade (this serial)** | Exactly three tokens: `trade`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `sysId` not reserved. `originSystem` must equal `sysId`. |
| Pirate overlay | Prefix `bounty-pirate-` plus ≥1 further token. First trade serial does not retcon. |
| Recovery overlay | Prefix `recovery-` plus ≥1 further token. |

Examples that **must keep**: `bounty-ace`, `haul-provisions`, `ferry-consignment`, `mine-freehold-0`, `mine-fh_hearth-12`, `trade-freehold-0`, `trade-fh_hearth-1`.  
Examples that **must drop**: `__proto__`, `trade-__proto__-0`, `trade-freehold`, `trade-notasystem-0`, `haulace` (unique four are exact). Do **not** rewrite unique ids to underscores.

Trade allocator: monotonic `n` per process (or scan max like `nextMiningId`, `station.js` 1867–1886). Collision → increment `n`. System token is a `SYSTEMS` key (underscores allowed: `fh_hearth`). Hyphens only as separators, never inside the system key.

Do **not** copy `pirateBountyId(name)` for trade ids.

### 1.4 Per-job allowlist

Keep a job only if **all** hold. Extend live `JOB_KINDS` with `'trade'`. Do not remove `'mining'`.

| Field | Rule |
|---|---|
| `id` | §1.3 grammar for that `kind`. **Not** whole-string `SAFE_ID.test` |
| `kind` | one of `bounty` \| `patrol` \| `haul` \| `ferry` \| `recovery` \| `mining` \| **`trade`** |
| `state` | one of `offered` \| `accepted` \| `done` \| `failed` |
| `title`, `detail` | string; `stripControlChars`; cap 240 / 720; empty → drop job |
| `reward`, `need`, `progress` | finite number; `need` ≥ 1; `progress` ≥ 0; clamp `progress` ≤ `need`. **Trade:** `need` must be integer **`HAUL_UNITS` (5)**. Else drop the trade job (do not heal a stuffed 1-unit delivery) |
| `originSystem`, `destSystem`, `system` | if present: `Object.hasOwn(SYSTEMS, id)` else drop field or drop job if required for kind |
| `payQuoted`, `originPrice` | if present: finite ≥ 0 integer after `Math.round`; **clamp `0…PAY_QUOTED_MAX`**. `PAY_QUOTED_MAX = 20000` (live) |
| `target` | string; `stripControlChars`; `NAME_MAX` 40; bounty only |
| `wreckId` | recovery only; hyphen-token; cap 64 |
| `collected` | recovery only; boolean |
| `commodity` | mining: `ORE_TYPES` **and** `COMMODITIES` (unchanged). **Trade:** `Object.hasOwn(COMMODITIES, key)` **and** `COMMODITIES[key].bulk === true` **and** key ≠ `'livingRock'` **and** not reserved. Else drop the trade job |
| `deadline` | if present: finite `world.time` units ≥ 0; if non-finite, drop the field (offered unique cards have none). Trade **requires** finite `deadline` |
| `slot` | mining or trade: integer `0` or `1`; else drop that family job |
| `faction` | **Forbidden.** Unknown keys drop. Do not copy |

Unknown keys: drop (do not copy). Prototype keys: drop.

**Trade-required fields:** `originSystem`, `destSystem`, `commodity`, `slot`, `deadline`. `destSystem` must be a `SYSTEMS` key, must **not** equal `originSystem`, and must **not** be reserved. If `destSystem !== otherSystemId` cannot be checked in `save.js` without importing station helpers: freeze dest as a `SYSTEMS` key ≠ origin. Pay time rebinds with `otherSystemId` (§3.5) so a stuffed dest cannot retarget payout.

### 1.5 Clock

`world.time` already heals to `0` (`save.js` 675). Deadline compares use that clock, never `ctx.elapsed`.

A hand-edited future `world.time` may expire accepted trade jobs — fail closed, then replace. Same cheat class as editing credits. Do not add a second clock.

---

## 2. Board slot (trade family)

### 2.1 What a slot is

For trade only:

- Each system may have **two** trade jobs (`slot` 0 and 1) in `world.jobs` whose `originSystem === that system` and `kind === 'trade'`.
- States in a slot: `offered` or `accepted`. `failed`/`done` are transient: splice in the same function that posted the replacement.
- The Jobs board **shows** offered trade when `ctx.world.currentSystem === originSystem`. Accepted trade cards also show on other docks as a reminder (state line names the **destination** dock). Same pattern as mining (`boardJobs` 2001).

Mining slots are independent. A system may hold two mining **and** two trade jobs.

### 2.2 Fill

`syncTradeJobs(ctx, sysId)` on `renderJobs` (after `syncMiningJobs`):

- If `otherSystemId(ctx, sysId) === sysId` or `!Object.hasOwn(SYSTEMS, otherSystemId(…))`, **do not post** trade for that system (gates-less: undeliverable).
- Count trade jobs with `originSystem === sysId` and state `offered|accepted`.
- While count < `TRADE_SLOTS_PER_SYSTEM`, push a new offered trade job for `sysId` with `destSystem = otherSystemId(ctx, sysId)`.
- Do **not** reshuffle existing offered cards on each render.
- Do **not** fill mining slots with trade, or trade slots with mining.

### 2.3 One-in-one-out

On trade complete **or** trade expire:

1. Note `originSystem` and `slot`.
2. Pay or not (complete pays; expire does not).
3. `splice` that element.
4. Immediately `push` a new offered trade job for the same system and slot (skip push if dest would equal origin).
5. If the overlay is open on Jobs, `render()` so the replacement is visible this interaction.

Never `state = 'done'` on trade (unlike today’s unique `completeJob`). Set `failed` **before** pay (mining 2142–2143) so a crash mid-replace cannot pay twice. Unique kinds still use today’s `done`.

### 2.4 Unique cards (not slots)

`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` stay unique. Completing them still sets `done` and they still occupy board rows. **Later serial** may migrate haul/ferry onto these trade slots. **Not this serial.**

Pirate / recovery overlays stay as today. Mining slots stay as today.

---

## 3. Trade family (this vertical slice)

### 3.1 Player-facing contract

Accept at **home** dock. Buy (or already hold) `need` units of the named bulk commodity. Fly to the **named other system** (primary-gate dest from `otherSystemId`; any player path is legal). Redock at that station. Delivery tick removes `need` units, pays stamped `payQuoted`, writes employer rep, dockmaster trust as mining (via `rewardJobContacts` or equivalent **without** calling unique `completeJob` `done`), splice, new card on the **origin** board immediately.

Copy the haul/ferry **dock-pay** shape (`tickDeliveryJobs`), not a new event.

No cargo fronting (not ferry). Market fill of the named bulk is allowed (unique haul precedent).

### 3.2 Fields (JSON-plain)

```
{
  id,                 // trade-<sysId>-<n>
  kind: 'trade',
  slot,               // 0 | 1
  originSystem,       // SYSTEMS key; home dock
  destSystem,         // SYSTEMS key; otherSystemId(origin) at post
  commodity,          // provisions | refinedMetals | rawOre
  title, detail,      // authored templates, textContent
  reward,             // base UU before jobPayFor; may be 0 if payQuoted is the agreement
  payQuoted,          // stamped on accept (jobPayFor at ORIGIN)
  need,               // HAUL_UNITS 5
  progress,           // unused for delivery-style; keep 0
  state,              // offered | accepted
  deadline,           // world.time seconds when the card fails
}
```

No `asteroidId`. No THREE. No `target` name. **No `faction` field.** Employer at pay time is `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, faction)`. A save must not retarget reputation by stuffing `job.faction`.

### 3.3 Commodity seed

First impl may only roll `commodity` where **all** hold:

- `Object.hasOwn(COMMODITIES, key)`
- `COMMODITIES[key].bulk === true`
- `key !== 'livingRock'`
- `key !== 'survivor'`
- not a data key (`dataCrystal` / `dataCube` are not `COMMODITIES` and stay out)

Live keys that qualify: `provisions`, `refinedMetals`, `rawOre` (`state.js` 308–313).

Prefer `provisions` in copy and in the first roll table (unique haul already teaches that loop). A uniform pick among the three is allowed.

Hold units of that commodity count, **no provenance tag** (same as haul Provisions). Market fill is allowed. Do not invent cargo `source` for bulk in this slice.

Do not add `COMMODITIES` rows. Do not call `tryTrade` from the Jobs pane.

### 3.4 Need / pay / rep (cite; do not invent)

| Number | Value | Status |
|---|---|---|
| `need` | `HAUL_UNITS` **5** | cite `station.js` 172. Fits `cargoCapacity` 20 (`ctx.js` 109) |
| `payQuoted` | `clampJobPay(jobPayFor(ctx, originSystem, round(need * priceOf(commodity) * HAUL_MARGIN)))` | cite `HAUL_MARGIN` 1.4 (`station.js` 173); mining origin stamp 2589–2590. **Origin**, not dest |
| Clamp | `PAY_QUOTED_MAX` 20000 | cite `station.js` 194; `save.js` 120 |
| Reputation | **`+2`** to `SYSTEMS[originSystem].faction` if `Object.hasOwn(FACTIONS, faction)` | cite `MINING_REP` 190, mining write 2150–2153. Legal work, employer only |
| Trust/favor | reuse `rewardJobContacts` dockmaster path | cite 2051–2062. Do not mark unique `done` |
| Deadline length | `MINING_DEADLINE` / `WRECK_TTL` **600** world seconds from **accept** (offered cards: from post time) | cite `station.js` 192; `world.js` 811 |
| Offered lifetime | same 600 s from post; expire → fail closed → replace | keeps the board moving if ignored |
| Margin | live `HAUL_MARGIN` only | no third multiplier |

Do not author new UU tables in `state.js`. Unique haul still prices the **destination** dock; this family prices the **origin** dock (explicit). Do not change unique haul/ferry stamp code in this serial.

### 3.5 Tick / expire / dest bind

Cadence: ride `tickDeliveryJobs` (0.5 s, `station.js` 3386) **and** a cheap expire scan there (not only while docked). Reverse walk so splice does not skip.

**Complete** (accepted, docked):

```
origin = job.originSystem
if (!Object.hasOwn(SYSTEMS, origin)) continue
dest = otherSystemId(ctx, origin)          // Wave 35 haul bind — ignore stuffed job.destSystem for PAY
if (ctx.world.currentSystem !== dest || dest === origin) continue
if (!Object.hasOwn(COMMODITIES, commodity) || COMMODITIES[commodity].bulk !== true) continue
if (commodity === 'livingRock') continue
if (holdUnits(ctx, commodity) < need) continue
job.state = 'failed'                       // before pay — mining 2142–2143
removeCargo(ctx, commodity, need)
pay = clampJobPay(job.payQuoted) if finite else clampJobPay(jobPayFor(origin, base))
credits += pay
employer rep +2 if Object.hasOwn(FACTIONS, SYSTEMS[origin].faction)
rewardJobContacts
commLine via textContent path
splice + replace (§2.3)
```

**Do not** pay at origin. **Do not** pay at an arbitrary non-origin dock. **Do not** use stuffed `job.destSystem` as the pay gate.

Render / state-line dest **name** also comes from `otherSystemId(origin)` + `SYSTEMS[dest].station.name` (unique haul render 2633–2635), not from a save string.

**Expire** (`world.time >= deadline` and state offered or accepted):

- no cargo remove
- no pay
- no rep / no favor
- commLine: contract lapsed (accepted) or posting withdrawn (offered)
- splice + replace

**Silent complete is forbidden.** A tampered `deadline` in the past on restore expires on the next tick, fail closed.

Ferry-style “short hold, stay open” does **not** apply to expire. Expire always closes. Short hold on an accepted trade at the dest dock stays open (like ferry short) **until** deadline; then expire fail closed.

### 3.6 Accept

Offered trade is **home-only**. `acceptJob` must refuse (no state flip, no stamp, notice) when:

- `job.kind === 'trade'` and `ctx.world.currentSystem !== job.originSystem`
- dest would be `otherSystemId(origin) === origin` or not a `SYSTEMS` key
- `state !== 'offered'`

Unique haul may still be accepted at either dock (unchanged). Do not copy that onto trade slots.

No cargo fronting (not ferry). Stamp:

- `payQuoted` with **origin** `jobPayFor` + `clampJobPay`
- `deadline = world.time + 600` (restart; offer timer only clears ignored cards)
- `originSystem` already set at post; **do not** retarget from `currentSystem`
- `destSystem = otherSystemId(ctx, origin)` refresh from live gates (display); pay still uses `otherSystemId` at tick

`boardJobs` hides offered trade unless `originSystem === sysId` (same line as mining, `station.js` 2001). Hide **and** refuse: a missed filter must not accept a foreign card.

Digit accept stays index-into-`boardJobs` (live 3303–3305) but mutates the **job object by identity**. Replacement must not reuse the spliced object. Do not accept `done`/`failed`.

---

## 4. Id and XSS

- Allocate trade ids per §1.3 (`trade-<SYSTEMS key>-<n>`). Confirm `Object.hasOwn(SYSTEMS, sysId)` first. Collision → increment `n`. Never `jobs[id] =` as a map. Never `SAFE_ID.test` the full id.
- `title` / `detail` / commLine / notices: `h(..., text)` / `textContent` / `emit('commLine', { text })`. Interpolate `COMMODITIES[key].name` and station name from allowlisted keys, not save strings, when regenerating. Restored title/detail already stripped.
- `pirateBountyId(name)` stays pre-existing; do not copy for trade.
- No `innerHTML`. No HUD glance row. No new Digit.

---

## 5. Faction attribution (REP-04 adjacency)

First-slice trade is **overt legal work**:

- On success: employer = `SYSTEMS[originSystem].faction` only (live table, not a job field).
- On success: **no** target-faction write (destination faction is not a target).
- On expire: no write.
- Use `Object.hasOwn(FACTIONS, faction)` before indexing `world.reputation`. Fresh bag entry only for known keys. Never `reputation[userString]`.
- Do **not** fix patrol’s hardcoded `freehold` in the trade PRs unless a named serial owner takes it.

Espionage later: successful secret → no target loss (wishlist REP-04). **Depends on later REP brief.** Faction-vs-faction later: employer up, target down — same dependency. Police restitution (REP-03) is out of MSN. Passenger ferry is out (POD). Hunt families are out.

---

## 6. Events and milestones

- No new type in `ctx.js` EVENTS comment.
- Optional first-complete milestone id omitted in first impl (less persist surface).
- Witness Rule: trade does not fabricate incidents or wrecks.

---

## 7. Closed neighbours

| Topic | Law |
|---|---|
| Mining MSN | Keep slots, kind, cap share, `boardJobs` mining filter. Grow cap. Never drop honest mining |
| EXP data | No `dataCrystal` / `dataCube` on jobs. `priceOf` data stays 0 |
| POD | No survivor commodity on jobs. No People-desk change |
| BIO | No `livingRock` seed. Feed Digit unchanged |
| SHP | Digit 0 untouched. No hull/loadout as mission reward |
| HUD-02 | No chart identity work |
| TGT-05 | Do not steal `ctx.targets` |
| REP | Employer-only +2. No freehold copy. No espionage numbers |
| AST | No `asteroidId`. Trade is dock-to-dock bulk, not a rock |
| Unique haul/ferry | Untouched ids, stamps, Wave 35 dest bind |
| NPC traders | Hub-route lore is NPC-only (`world.js` 24–27) |

---

## 8. Serial PR plan (implementation wave, **not** Wave 75)

Named only. Do **not** implement in this wave.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'trade'` on `JOB_KINDS`; id grammar `trade-<sys>-<n>`; dest/commodity/slot allowlist; cap `4 + 4*N_SYSTEMS + 16` (420 at 100); proto drop; unique four **kept**; honest mining **kept** | Sync/UI/pay; whole-string `SAFE_ID` on job.id; unique migration |
| **PR2 sync + accept + deliver** | `syncTradeJobs` 2 slots; render/accept; dest = `otherSystemId`; `payQuoted` origin; deliver tick at named dest; `failed`-first then pay | Expire, one-in-one-out, other families |
| **PR3 replace + expire** | splice + immediate replace; deadline 600 s fail closed; no `DONE` trade | Unique-card migration; mining reopen |
| **PR4 UI copy** | state + remaining time + dest name on trade cards; `textContent` only; Digit 2 only | HUD-02, innerHTML, Digit remap |
| **PR5 boot pins** | drop `trade-__proto__-0`; keep `bounty-ace` + `haul-provisions` + `ferry-consignment` + `mine-freehold-0` + `trade-freehold-0`; 200 mining + 200 trade + 4 unique fit cap 420; complete→replace; expire no pay; dest stuffed ignored at pay; `livingRock` / `survivor` / data keys drop; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS edits by feature workers |

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave. Do not treat WAVE4 / WAVE26 / WAVE35 known FAILs as trade bugs.

---

## 9. Later families (named, not specified)

Do **not** fill numbers. After this trade serial:

1. Later serial may migrate unique haul/ferry onto these renewable trade slots.
2. Local pirate hunt as slots (retire done-card leak).
3. Passenger ferry — **after** a people-cargo design that is not POD-02 sale.
4. Faction-level pirate as a renewable **or** keep unique ace + MSN-03.
5. Faction-vs-faction — **after REP brief**.
6. Espionage — **after REP brief** (secret vs attributed). REP-04.
7. Exploration / information — depends on EXP persist shape. Do not steal mystery.js.
8. **MSN-03** authored chains for rare equipment — after the ordinary pool is renewable.

---

## 10. Non-goals (locked)

- No `src/` in Wave 75 for this family.
- No HUD-02. No AST rock UUIDs. No POD reopen. No SHP grants. No BIO graft. No EXP SKU. No TGT.
- No new `localStorage` key. No `world.missions` parallel array.
- No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows.
- No MSN-03. No espionage. No `asteroidId`. No new `WORLD_FIELDS`.
- Do not edit the wishlist or `PROGRESS.md` in this wave.
- Do not schedule or land implementation PRs in Wave 75.
- Do not edit `docs/MsnMissionsDesign.md` from this worker (default).

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | `station.js` (or a later `jobs.js` owned by the serial). `save.js` sanitize on restore | station UI + ticks |
| Unique four ids | `makeJobs` only when empty | boot tests |
| Mining slots | `syncMiningJobs` / replace (unchanged) | board |
| Trade slots | `syncTradeJobs` / replace | board |
| `ctx.world.reputation` | trade complete: employer key only | epics, standing, npc |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |
| `ctx.targets` | TGT / controls only | not jobs |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (already run docked or not, 3382–3386).

---

## 12. Owner defaults (stand unless overridden)

These defaults **stand**. They do not block impl. No open owner question is required to start PR1.

1. `kind = 'trade'`. Ids `trade-<sysId>-<n>`.
2. `TRADE_SLOTS_PER_SYSTEM = 2`. Digit 1–9 overflow is existing UX (mouse Accept). Do not cut to one slot for Digit reasons.
3. Deadline = 600 s, restart on accept (same as mining).
4. `need = 5` (`HAUL_UNITS`). Pay uses `HAUL_MARGIN` 1.4 at **origin** `jobPayFor`.
5. Seed pool: `provisions` / `refinedMetals` / `rawOre`. No `livingRock` seed.
6. Dest = `otherSystemId(origin)`. Pay rebinds that helper. Player multi-gate path OK.
7. Rep **+2** employer faction (`MINING_REP`).
8. Show offered trade at home only; accepted trade on every Jobs board.
9. Do not migrate unique haul/ferry/ace/patrol in this serial.
10. Cap `4 + 4 * N_SYSTEMS + 16` (420 at 100 systems). Never drop honest offered mining or honest offered trade.
11. No trade milestone in first impl.
12. Job ids: hyphen-token grammar (§1.3). Do **not** whole-string `SAFE_ID`.

---

## 13. Verification pins (for a later read-only verifier)

Exact files:

- `docs/Msn02TradeDesign.md` vs this file vs `out/w75/msn02/current-mission-trade-inventory.md`
- Live: `src/systems/station.js` `makeJobs` / `ensureJobs` / `completeJob` / `boardJobs` / `tickDeliveryJobs` / `renderJobs` / `acceptJob` / `otherSystemId` / `jobPayFor` / `HAUL_MARGIN` / `h`
- `src/game/save.js` `WORLD_FIELDS` `'jobs'`, live cap `4+2*N_SYSTEMS+16`, `sanitizeJobs`, `JOB_KINDS`
- `src/game/state.js` `COMMODITIES` 308–322 (READ-ONLY); `SYSTEMS` 541
- `src/game/world.js` `WRECK_TTL` 811; NPC never hub-route 24–27
- `src/core/ctx.js` no jobs default, no job events, `cargoCapacity` 20
- Unique four named in `makeJobs` and `scripts/boot-test.mjs` 14367
