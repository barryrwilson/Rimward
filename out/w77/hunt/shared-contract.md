# MSN-02 renewable local pirate hunt shared contract

**Wave:** 77. Design only. No hunt-job feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Msn02HuntDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/MsnMissionsDesign.md`, `docs/Msn02TradeDesign.md`, `docs/RepStandingDesign.md`, `docs/NpcMissilesDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/Pod02TraffickingDesign.md`, `docs/Tgt05ReticleLockDesign.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, or sibling `out/w77/{passenger,explore}` (those are other workers).  
**Locked sources:** wishlist Initiative MSN MSN-02 “hunting a local pirate” vs “hunting a faction-level pirate threat” (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 549–557); mining family Wave 71; trade family Wave 76 (`docs/Msn02TradeDesign.md`); live inventory `out/w77/hunt/current-hunt-inventory.md` (code wins); `src/systems/station.js`; `src/game/save.js`; `src/game/world.js`; `src/systems/npc.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 77 is markdown only for this family. Implementation is a later **serial** wave. Do not schedule or land hunt PRs in `src/` in this wave.
2. **Extend** `ctx.world.jobs`. Do **not** add a second persist key. Do **not** add a `WORLD_FIELDS` name. Autosave stays `rimward-save-v1`. No new `localStorage` key.
3. First hunt serial family is renewable **local pirate hunt**: `kind: 'hunt'`. Must **not** be `'bounty'`, `'patrol'`, `'haul'`, `'ferry'`, `'recovery'`, `'mining'`, or `'trade'`.
   - **Why `'hunt'`:** unused in live `JOB_KINDS` (`save.js` 127). `'bounty'` is unique ace **and** overlay pirates. `'patrol'` is unique `patrol-lane`. NPC AI mode `'hunt'` (`npc.js` 200) is not a job kind; do not change NPC mode from this family.
4. **Do not** replace, rename, migrate, or delete the unique four. Unique `bounty-ace` stays the faction-level / Named Gun card. This family is **local** pirate hunt only. Do **not** post a hunt slot against Named Guns / unique ace.
5. Board slot: **`HUNT_SLOTS_PER_SYSTEM = 2`**, same count as live `MINING_SLOTS_PER_SYSTEM` / `TRADE_SLOTS_PER_SYSTEM` (`station.js` 189–190). One-in-one-out: complete or expire → splice → immediately post a new `kind === 'hunt'` job for the same `originSystem` + `slot` when an eligible quarry exists. Never leave a `DONE` hunt card. If no eligible quarry, **do not post** (empty slot is legal; Verge may have one pirate).
6. Overlay pirate rows stay. Live cap `PIRATE_BOUNTY_CAP = 2` (`station.js` 187) is **not** hunt slots. Prefer **new kind + slots**. Overlay reuse is **not** safe (inventory §7). Hunt and overlay **may** name the same local pirate. **At most one Jobs payout** per witnessed kill (§3.5).
7. Sanitize cap **grows at impl time** by hunt room only. **LIVE** cap at inventory is `4 + 2*N_SYSTEMS + 2*N_SYSTEMS + 16` = **420** at 100 systems (`save.js` 118–122). Freeze:

   ```
   live_cap_at_impl = JOBS_SANITIZE_MAX as read from save.js at the implementation wave
                      // inventory-time: 4 + 2*N + 2*N + 16 = 420 at 100
   HUNT_SLOTS_PER_SYSTEM = 2
   HUNT_ROOM             = HUNT_SLOTS_PER_SYSTEM * N_SYSTEMS
   JOBS_SANITIZE_MAX_at_impl = live_cap_at_impl + HUNT_ROOM
                             // inventory-time arithmetic: 420 + 200 = 620 at 100
   ```

   **Do not** write a combined formula that includes passenger or explore rooms (sibling Wave 77 workers). **Do not** drop honest offered mining or honest offered trade to make room. **Do not** drop honest offered hunt that is one of the two slots for its `originSystem`. **Do not** drop the unique four or any `accepted` job.
8. Target identity: **no asteroid UUID**. No `asteroidId`. Bind a live pirate **record id** `rec-<n>` (`world.js` 282–285) plus `originSystem`. Display name comes from the live record (fallback stripped `target`). Witness Rule: recorded incidents / record state only. Do **not** print unpublished mystery clue text or clue ids. Do **not** print `rec-<n>` in the Jobs pane.
9. Deadline: reuse 600 world seconds (`MINING_DEADLINE` `station.js` 193 / `WRECK_TTL` `world.js` 811). Restart on accept. Expire **fails closed** (no credits, no rep, no silent complete).
10. Pay: stamp `payQuoted` on accept. Clamp 0…`PAY_QUOTED_MAX` 20000 (`save.js` 123; `station.js` 196). Base = live quarry `record.bounty` if finite `> 0`, else live `PIRATE_BOUNTY_FALLBACK` **400** (`station.js` 188). Then `clampJobPay(jobPayFor(ctx, originSystem, base))`. Cite overlay `reward: r.bounty || PIRATE_BOUNTY_FALLBACK` (`station.js` 1815) and `jobPayFor` (`station.js` 2151–2158). Do **not** invent a new UU table. If a later owner needs a different number, mark **proposed, needs owner** and **fail closed (no pay)** until authored.
11. Reputation: employer faction **only** on success. Employer = `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, key)`. Delta **`+2`** (`MINING_REP` `station.js` 191). Live overlay bounty writes **no** rep (`station.js` 2363–2370) — there is no live hunt/bounty employer delta to copy. Expire writes nothing. Never `reputation[userString]`. Do **not** copy patrol `reputation.freehold +=` (`station.js` 2233). Do **not** invent a victim-faction kill delta (REP-04 deferred; `docs/RepStandingDesign.md` §7).
12. UI: Jobs pane only. Digit **2**. No new Digit. No HUD glance. `textContent` / existing `h()` / `'commLine'` only. **No `innerHTML`**. Regen titles from templates + live record **name** (allowlisted via record lookup) + `SYSTEMS[origin].station.name`. Do not print `job.faction`. Do not use `job.faction` as a write source.
13. `state.js` is READ-ONLY. No new `COMMODITIES`. No NPC missiles. No power ledger. No new frozen event in `ctx.js`. Completions keep `'commLine'`.
14. Prototype keys fail closed. Hyphen-token job ids (`SAFE_ID` is the **token** class only). Drop `RESERVED_IDS` on the full id **and** every token. Walk with `Object.keys` / index `for`, never `for…in` blob merge. Fresh `{}` literals only.
15. Do not invent espionage, passenger, faction-war, or exploration **numbers**. Sibling Wave 77 workers own passenger/explore. Espionage / faction-war wait on REP-04.
16. Do not invent police restitution. Do not reopen mining hardness, trade dest bind, unique haul/ferry stamps, AST `asteroidId`, POD sale, BIO grafts, SHP hull grants, HUD-02, TGT-05, EXP desk SKUs.
17. Do not “fix” boot-test known FAILs: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul named dest.
18. Unique `makeJobs` ids stay until a **later** serial migrates them. This serial must not rename them (boot-test pins).

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'jobs'` (`save.js` 78). Keep it.

Call site today: `sanitizeJobs(ctx)` from `sanitizeRestored` (`save.js` 711). Hunt serial **extends** that healer. Do not add a second walk. Do not persist a parallel `world.hunts` array.

### 1.2 Array heal

- If `world.jobs` is missing, not an array, or empty after drop → leave `[]` and let `ensureJobs` rebuild the **four unique** cards (`station.js` 1759–1761).
- Walk with `Object.keys` / index `for`, never `for…in`.
- Fresh `[]`. Push fresh `{}` literals only. Never `Object.assign` a raw save object onto a live job.

**Cap (fits mining + trade + this hunt family; does not pre-count passenger/explore):**

```
N_SYSTEMS              = Object.keys(SYSTEMS).length
                         // inventory-time 100: 6 authored + 94 generated
                         // state.js 12–18, 541
live_cap_at_impl       = JOBS_SANITIZE_MAX in save.js at impl
                         // inventory-time 4 + 2*N + 2*N + 16 = 420
HUNT_ROOM              = HUNT_SLOTS_PER_SYSTEM * N_SYSTEMS   // 2 * 100 = 200
JOBS_SANITIZE_MAX      = live_cap_at_impl + HUNT_ROOM
                         // inventory-time 620 at 100
```

If a **later-or-parallel** passenger/explore serial already raised `JOBS_SANITIZE_MAX` when hunt impl starts, **add `HUNT_ROOM` to whatever is live**. Do not reset to 420. Do not bake sibling rooms into this file.

Drop overflow in this order until `length ≤ JOBS_SANITIZE_MAX`:

1. Invalid rows (fail §1.3–1.4).
2. Extra mining on a system that already has two valid `offered|accepted` mining jobs (live `extraOfferedMining` / `extraOfferedFamily`, `save.js` 357–385).
3. Extra trade (same, `kind === 'trade'`).
4. Extra hunt on a system that already has two valid `offered|accepted` hunt jobs (same rule, `kind === 'hunt'`). Duplicate/tamper, not a honest slot.
5. `done`/`failed` mining, trade, or hunt (should not exist if replace ran).
6. `done` pirate / `done` recovery.
7. Tamper-only last resort: if still over cap, drop **offered pirate/recovery** whose `system`/`originSystem` ≠ `currentSystem`. Honest play never needs this.

**Never drop** (if the row still sanitizes):

- The four unique ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`), any state.
- Any `accepted` job.
- Any **offered mining** that is one of the two slots for its `originSystem`.
- Any **offered trade** that is one of the two slots for its `originSystem`.
- Any **offered hunt** that is one of the two slots for its `originSystem`.

Normal play at inventory-time 100 systems: ≤200 mining + ≤200 trade + ≤200 hunt + 4 unique + ≤16 overlays ≤ 620. Restore must not delete offered mining, trade, or hunt to “make room.”

### 1.3 Job id grammar (implementable)

Live `SAFE_ID` rejects hyphens. Every live job id **contains** hyphens. **Do not** run `SAFE_ID.test` on the full `job.id`.

**Token class** (same characters as `SAFE_ID`, one segment):

```
JOB_ID_TOKEN = /^[a-z0-9_]+$/i     // save.js SAFE_ID body, one hyphen-separated token
```

**Full id:**

1. Type string. Length 1…`ID_MAX` 64 (`save.js` 103).
2. No leading / trailing / doubled `-`. Split on `'-'`. Every token matches `JOB_ID_TOKEN` and is non-empty.
3. Full id is **not** in `RESERVED_IDS`. Every token, compared with `toLowerCase()`, is **not** in `RESERVED_IDS`. Drops `__proto__`, `hunt-__proto__-0`, `constructor`, `bounty-prototype`.
4. Never use the id as an object key (`jobs[id] =`). Array of objects only.

**Kind-specific (after tokens pass):**

| Kind | Id rule |
|---|---|
| Unique four | **Exact** `bounty-ace` \| `patrol-lane` \| `haul-provisions` \| `ferry-consignment`. Boot-test pins. |
| Mining | Unchanged: three tokens `mine`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `originSystem` equals `sysId`. |
| Trade | Unchanged: three tokens `trade`, `sysId`, `n`. Same sys/`n` rules. |
| **Hunt (this serial)** | Exactly three tokens: `hunt`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `sysId` not reserved. `originSystem` must equal `sysId`. |
| Pirate overlay | Prefix `bounty-pirate-` plus ≥1 further token. This serial does not retcon overlay ids. |
| Recovery overlay | Prefix `recovery-` plus ≥1 further token. |

Examples that **must keep**: `bounty-ace`, `bounty-pirate-old-callow`, `mine-freehold-0`, `trade-freehold-0`, `hunt-freehold-0`, `hunt-fh_hearth-1`.  
Examples that **must drop**: `__proto__`, `hunt-__proto__-0`, `hunt-freehold`, `hunt-notasystem-0`, `bounty-pirate` (overlay still needs prefix + further token per live sanitize). Do **not** rewrite unique ids to underscores.

Hunt allocator: monotonic `n` per process (or scan max like `nextMiningId`, `station.js` 1870–1888). Collision → increment `n`. System token is a `SYSTEMS` key (underscores allowed: `fh_hearth`). Hyphens only as separators, never inside the system key.

Do **not** copy `pirateBountyId(name)` for hunt ids.

### 1.4 Per-job allowlist

Keep a job only if **all** hold. Extend live `JOB_KINDS` with `'hunt'`. Do not remove `'mining'` or `'trade'`.

Add **`recordId`** to `JOB_FIELD_ALLOW` (`save.js` 135–139). Hunt-only. Other kinds: if present, **drop the field** (do not copy) unless already recovery `wreckId`. Do not reuse `wreckId` for pirates.

| Field | Rule |
|---|---|
| `id` | §1.3 grammar for that `kind`. **Not** whole-string `SAFE_ID.test` |
| `kind` | one of `bounty` \| `patrol` \| `haul` \| `ferry` \| `recovery` \| `mining` \| `trade` \| **`hunt`** |
| `state` | one of `offered` \| `accepted` \| `done` \| `failed` |
| `title`, `detail` | string; `stripControlChars`; cap 240 / 720; empty → drop job |
| `reward`, `need`, `progress` | finite number; `need` ≥ 1; `progress` ≥ 0; clamp `progress` ≤ `need`. **Hunt:** `need` must be integer **1**. Else drop the hunt job (do not heal a stuffed 0-need) |
| `originSystem`, `destSystem`, `system` | if present: `Object.hasOwn(SYSTEMS, id)` else drop field or drop job if required for kind |
| `payQuoted`, `originPrice` | if present: finite ≥ 0 integer after `Math.round`; **clamp `0…PAY_QUOTED_MAX`**. `PAY_QUOTED_MAX = 20000` (live) |
| `target` | string; `stripControlChars`; `NAME_MAX` 40; bounty **or hunt**. Hunt **requires** a non-empty target (post-time name snapshot). Pay **ignores** stuffed target and uses live `record.name` |
| `recordId` | hunt only; hyphen-token; must match `/^rec-(0|[1-9][0-9]*)$/`; length ≤ `ID_MAX`; not reserved. Else drop the hunt job |
| `wreckId` | recovery only; hyphen-token; cap 64 |
| `collected` | recovery only; boolean |
| `commodity` | mining/trade unchanged. Hunt: **forbidden** — if present, drop the field (do not copy). Hunt is not cargo |
| `deadline` | if present: finite `world.time` units ≥ 0; if non-finite, drop the field. Hunt **requires** finite `deadline` |
| `slot` | mining, trade, or hunt: integer `0` or `1`; else drop that family job |
| `faction` | **Forbidden.** Unknown keys drop. Do not copy |

Unknown keys: drop (do not copy). Prototype keys: drop.

**Hunt-required fields:** `originSystem`, `slot`, `deadline`, `recordId`, `target`. `originSystem` must equal id token `sysId`. `destSystem` if stuffed: keep only if a `SYSTEMS` key; **pay ignores it**. Hunt is local (pirates never migrate, `world.js` 30).

**Record bind at sanitize (Witness-safe, no station import):**

- If `ctx.world.recordBanks` is an object: walk `Object.keys(recordBanks)` with index `for`. Skip reserved keys / `__proto__`. Use `Object.hasOwn`. Never `for…in`.
- If `Object.hasOwn(recordBanks, originSystem)` and that bank is an array: drop the hunt job unless some record has `id === recordId` AND `role === 'pirate'` AND `system === originSystem` AND `role !== 'ace'` AND `classKey !== 'ace'`. Walk the bank with index `for`.
- If the origin bank is **missing** (unvisited): keep the grammar-valid hunt job. Pay **fails closed** if the record is still missing or ineligible at claim. `syncHuntJobs` pulls stuffed offered ghosts once the bank exists (§2.2). Extra hunt beyond two slots per origin still drops in cap heal (§1.2).
- Do not walk `ctx.world.records` as a substitute unless it is the same array as `recordBanks[origin]`.

### 1.5 Clock

`world.time` already heals to `0` (`save.js` 709). Deadline compares use that clock, never `ctx.elapsed`.

A hand-edited future `world.time` may expire accepted hunt jobs — fail closed, then replace. Same cheat class as editing credits. Do not add a second clock.

---

## 2. Board slot (hunt family)

### 2.1 What a slot is

For hunt only:

- Each system may have **two** hunt jobs (`slot` 0 and 1) in `world.jobs` whose `originSystem === that system` and `kind === 'hunt'`.
- States in a slot: `offered` or `accepted`. `failed`/`done` are transient: splice in the same function that posted the replacement.
- The Jobs board **shows** offered hunt when `ctx.world.currentSystem === originSystem`. Accepted hunt cards also show on other docks as a reminder (state line names the quarry from live record). Same pattern as mining (`boardJobs` `station.js` 2132–2142 — add a hunt line).

Mining and trade slots are independent. Overlay pirate rows are independent. A system may hold two mining **and** two trade **and** two hunt jobs **and** up to two overlay pirate cards.

Two hunt slots must **not** bind the same `recordId`.

### 2.2 Fill

`syncHuntJobs(ctx, sysId)` on `renderJobs` (after `syncTradeJobs`):

- If `!Object.hasOwn(SYSTEMS, sysId)`, return.
- **Pull** offered hunt rows for `sysId` whose `recordId` is missing or ineligible in the origin bank (overlay offered-dead pull, `station.js` 1789–1797). Do **not** pull `accepted` rows here (accepted uses expire / fail-closed tick). Reverse index walk; splice; then fill.
- Count hunt jobs with `originSystem === sysId` and state `offered|accepted`.
- Eligible quarry (§3.3): live pirate in the **origin** bank (`ensureBank` / current `records` when `currentSystem === sysId`; when rendering a dock, current bank **is** that system).
- While count < `HUNT_SLOTS_PER_SYSTEM`, pick the next eligible quarry not already bound to an offered/accepted hunt `recordId`, and push a new offered hunt job for `sysId`.
- If no eligible quarry remains, **stop**. Do not invent a fake pirate. Do not fabricate incidents (Witness Rule).
- Do **not** reshuffle existing offered cards on each render.
- Do **not** fill mining/trade slots with hunt, or hunt slots with overlay `kind: 'bounty'`.
- Stuffed offered hunts with fake `recordId` must not occupy a slot once the origin bank exists.

### 2.3 One-in-one-out

On hunt complete **or** hunt expire:

1. Note `originSystem` and `slot`.
2. Pay or not (complete pays; expire does not).
3. `splice` that element.
4. Immediately `push` a new offered hunt job for the same system and slot **if** an eligible quarry exists (else leave the slot empty until a later `syncHuntJobs`).
5. If the overlay is open on Jobs, `render()` so the replacement is visible this interaction (`maybeRefreshJobsBoard` `station.js` 1992–1995).

Never `state = 'done'` on hunt (unlike today’s unique `completeJob`). Set `failed` **before** pay (mining `station.js` 2280–2281) so a crash mid-replace cannot pay twice. Unique kinds still use today’s `done`. Overlay pirates still use today’s `done`.

### 2.4 Unique cards and overlay (not hunt slots)

`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` stay unique. Completing them still sets `done`.

Pirate / recovery overlays stay as today (`PIRATE_BOUNTY_CAP` 2, one recovery). Mining and trade slots stay as today.

**Do not** post hunt against:

- `role === 'ace'` or `classKey === 'ace'`
- unique `bounty-ace` target / `ACES.illyx.name` / `ACES.hunter.name` / `NAMED_GUNS.aspirants.names` (live `state.js` 827–901)
- a record already bound to another hunt slot (`recordId`)

Overlay **may** still post `bounty-pirate-*` for a quarry that a hunt card also names. See §3.5 for single payout.

---

## 3. Hunt family (this vertical slice)

### 3.1 Player-facing contract

Accept at **home** dock. The card names a **local** pirate (record name) who haunts **this** system (pirates never migrate). Fly in this system. Destroy (Witness: player-caused `destroyed` incident matching the **live record name**) or have the bound record `dead`/`captured` with that incident. The 0.5 s jobs tick pays stamped `payQuoted`, writes employer +2, dockmaster trust via `rewardJobContacts` **without** unique `completeJob` `done` and **without** overlay fence-favor (`kind !== 'bounty'`), splice, new card on the **origin** board immediately if a quarry remains.

Copy overlay **space-side claim** cadence (`tickDeliveryJobs` bounty branch, no redock required), **not** mining cargo delivery. Copy mining **replace** shape, not `completeJob`.

No cargo. No `asteroidId`. No fronting.

### 3.2 Fields (JSON-plain)

```
{
  id,                 // hunt-<sysId>-<n>
  kind: 'hunt',
  slot,               // 0 | 1
  originSystem,       // SYSTEMS key; home dock / quarry system
  recordId,           // rec-<n> from makeRecord
  target,             // name snapshot at post (NAME_MAX); UI/pay rebind live record.name
  title, detail,      // authored templates, textContent; regen on render
  reward,             // base UU before jobPayFor (record.bounty or 400)
  payQuoted,          // stamped on accept (jobPayFor at ORIGIN)
  need,               // 1
  progress,           // unused; keep 0
  state,              // offered | accepted
  deadline,           // world.time seconds when the card fails
}
```

No `asteroidId`. No THREE. **No `faction` field.** Employer at pay time is `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, faction)`. A save must not retarget reputation by stuffing `job.faction`. Stuffed `destSystem` cannot retarget pay (hunt does not pay at a dest dock).

### 3.3 Eligible quarry

A record is eligible when **all** hold:

1. `role === 'pirate'`
2. `classKey !== 'ace'` and `role !== 'ace'`
3. `system === originSystem` (and `Object.hasOwn(SYSTEMS, originSystem)`)
4. `state !== 'dead'` and `state !== 'captured'` at **post** time
5. `typeof id === 'string'` and id matches `/^rec-(0|[1-9][0-9]*)$/` and is not reserved
6. `typeof name === 'string'` after `stripControlChars` / trim / `NAME_MAX`; non-empty; name token walk is **not** required (names have spaces: `Old Callow`)
7. Name is **not** `ACES.hunter.name`, `ACES.illyx.name`, or any `NAMED_GUNS.aspirants.names` (`state.js` 827–901)
8. Not already bound to an offered/accepted hunt `recordId`
9. `bounty` is a finite number `> 0` **or** missing/0 (then post uses fallback 400, same as overlay `r.bounty || PIRATE_BOUNTY_FALLBACK` which **skips** `!(r.bounty > 0)` at overlay fill — **code wins:** overlay **requires** `r.bounty > 0` at fill (`station.js` 1807). Hunt fill **same**: skip unless `r.bounty > 0`. Fallback 400 is only for a positive bounty that is somehow non-finite at **pay** — if `bounty > 0` failed the fill gate, do not post.)

Q-ships stay `role: 'pirate'` (`world.js` 362–371): eligible.

Ledger collector is `role: 'pirate'` with a bounty (`world.js` 923–946): eligible **if** present in the origin bank and `bounty > 0` (local pirate, not a Named Gun).

Old Callow (Verge lone pirate) is eligible as **local** hunt, not faction-level.

**Skip post** when the origin bank has no eligible quarry. Do not spawn pirates from Jobs. Do not write incidents.

### 3.4 Need / pay / rep (cite; do not invent)

| Number | Value | Status |
|---|---|---|
| `need` | **1** | overlay/ace `need: 1` (`station.js` 1734, 1816) |
| Base UU | quarry `record.bounty` if finite `> 0` else **fail closed (no post)** | overlay fill requires `r.bounty > 0` (`station.js` 1807); seed `300 + i*75` (`world.js` 359) |
| `payQuoted` | `clampJobPay(jobPayFor(ctx, originSystem, Math.round(record.bounty)))` | cite `jobPayFor` 2151–2158; mining origin stamp 2777. **Origin**, not current-system `jobPay` |
| Clamp | `PAY_QUOTED_MAX` 20000 | cite `station.js` 196; `save.js` 123 |
| Overlay fallback 400 | live `PIRATE_BOUNTY_FALLBACK` (`station.js` 188) | **Overlay-only** at `jobs.push` (`station.js` 1815). Hunt fill already requires `r.bounty > 0`. Hunt **must not** stamp 400 as a third table. If accept cannot read a finite bounty `> 0`, **refuse accept** (no stamp, no state flip). |
| Reputation | **`+2`** to `SYSTEMS[originSystem].faction` if `Object.hasOwn(FACTIONS, faction)` | cite `MINING_REP` 191, mining write 2288–2290. Overlay bounty has **no** rep. Legal work, employer only |
| Trust/favor | reuse `rewardJobContacts` dockmaster path | cite 2189–2198. Hunt `kind !== 'bounty'` so **no** fence favor. Do not mark unique `done` |
| Deadline length | `MINING_DEADLINE` / `WRECK_TTL` **600** world seconds from **accept** (offered cards: from post time) | cite `station.js` 193; `world.js` 811 |
| Offered lifetime | same 600 s from post; expire → fail closed → replace | keeps the board moving if ignored |

Do not author new UU tables in `state.js`. Unique ace still pays `jobPay(current, job.reward)` unstamped; this family stamps origin `jobPayFor`. Do not change unique/overlay stamp code except overlay **skip** when an accepted hunt claims the same quarry (§3.5).

### 3.5 Tick / expire / quarry bind / single payout

Cadence: ride `tickDeliveryJobs` (0.5 s, `station.js` 3630–3631) **and** a cheap expire scan there (not only while docked). Reverse walk so splice does not skip.

**Quarry resolve (pay and UI):**

```
origin = job.id token sysId  // ignore stuffed job.originSystem for BIND
             (also require Object.hasOwn(SYSTEMS, origin) && origin === job.originSystem after sanitize)
bank   = recordBanks[origin] ?? (currentSystem === origin ? ctx.world.records : null)
rec    = bank record whose id === job.recordId
if !rec || rec.role !== 'pirate' || rec.system !== origin || rec.role === 'ace' || rec.classKey === 'ace': fail closed (no pay)
name   = rec.name   // ignore stuffed job.target for MATCH
```

**Complete** (accepted; space-side; overlay cadence):

```
if (!rec) continue
incident = (ctx.world.incidents || []).some(
  (i) => i.kind === 'destroyed' && i.name === rec.name && i.causer === 'player'
)
if (!incident) continue
if (rec.state !== 'dead' && rec.state !== 'captured') continue   // ace-style record gate; overlay omits this — hunt requires both witness AND record state (fail closed if name collision on a living pirate)
job.state = 'failed'                       // before pay — mining 2280–2281
pay = clampJobPay(job.payQuoted) if finite else 0   // no live reprice; missing quote → fail closed 0 + still replace
if pay > 0: credits += pay
employer rep +2 if Object.hasOwn(FACTIONS, SYSTEMS[origin].faction)
rewardJobContacts
commLine via textContent path
splice + replace (§2.3)
```

**Do not** pay from stuffed `job.target`. **Do not** pay from stuffed `job.destSystem`. **Do not** pay at an arbitrary dock (space-side: dock is not the gate; the **bind** is origin record + player incident). **Do not** use `ctx.elapsed`.

Render / state-line quarry **name** also comes from `rec.name` when found, else stripped `job.target` (board only; never pay on the fallback alone).

**Single payout vs overlay (HIGH law):**

A player-caused destruction of name N pays **at most one** Jobs bounty/hunt purse.

Reverse walk in `tickDeliveryJobs` visits high indices first (`station.js` 2249–2250). Overlay rows often sit **before** later hunt pushes, so overlay would pay first if the skip waited for hunt to run. **Skip is existence-based, not pay-order-based.**

1. Overlay pirate branch **must skip** when **any** `kind === 'hunt'` job is `state === 'accepted'` and its resolved origin-bank record is that quarry (`recordId` match, or live `rec.name === job.target` after record resolve). Check this **before** overlay credits move. Independent of walk order.
2. Hunt branch pays when its own accepted bind + witness + record `dead`/`captured` hold (§3.5 complete).
3. Else (no accepted hunt bind) overlay accepted `bounty-pirate-*` may pay as **live** (`station.js` 2363–2370).
4. Offered hunt does **not** pay. If the quarry is dead/captured without an accepted hunt, `syncHuntJobs` pull / expire fail-closed replace.
5. Unique `bounty-ace` is a different quarry (ace). Do not let hunt bind it. Ace branch unchanged.
6. Do not persist a paid-name set. Same-tick in-memory Set is optional extra, not the primary skip.

This serial **may** add an overlay skip of ~10 lines in the existing pirate claim branch. That is coupling, not overlay retirement. Do not change overlay cap, ids, or `completeJob` for overlay.

**Expire** (`world.time >= deadline` and state offered or accepted):

- no pay
- no rep / no favor
- commLine: contract lapsed (accepted) or posting withdrawn (offered)
- splice + replace (or empty slot)

**Silent complete is forbidden.** A tampered `deadline` in the past on restore expires on the next tick, fail closed.

**Offered quarry gone:** if offered hunt’s record is `dead`/`captured` or missing, **fail closed replace** on the same tick (no pay). Do not leave a ghost card. Do not convert offered→accepted.

**Accepted quarry gone without player incident:** fail closed replace (world kill, not the player’s claim). Overlay offered already splices (`station.js` 1789–1797). Hunt accepted must not pay on a world-caused incident (`causer !== 'player'`).

### 3.6 Accept

Offered hunt is **home-only**. `acceptJob` must refuse (no state flip, no stamp, notice) when:

- `job.kind === 'hunt'` and `ctx.world.currentSystem !== job.originSystem`
- origin not a `SYSTEMS` key
- resolved record ineligible (§3.3) or missing
- `state !== 'offered'`

Do not retarget `originSystem` from `currentSystem` (unique haul does; hunt must not).

Stamp:

- `payQuoted` with **origin** `jobPayFor(Math.round(rec.bounty))` + `clampJobPay` when `rec.bounty` is finite `> 0`; else refuse
- `deadline = world.time + 600` (restart)
- `target = rec.name` refresh from live record (display snapshot)
- `recordId` already set at post; **do not** retarget from a different pirate
- do **not** copy `currentSystem` onto `originSystem`

`boardJobs` hides offered hunt unless `originSystem === sysId`. Hide **and** refuse: a missed filter must not accept a foreign card.

Digit accept stays index-into-`boardJobs` (live 3548–3550) but mutates the **job object by identity**. Replacement must not reuse the spliced object. Do not accept `done`/`failed`.

---

## 4. Id and XSS

- Allocate hunt ids per §1.3 (`hunt-<SYSTEMS key>-<n>`). Confirm `Object.hasOwn(SYSTEMS, sysId)` first. Collision → increment `n`. Never `jobs[id] =` as a map. Never `SAFE_ID.test` the full id.
- `title` / `detail` / commLine / notices: `h(..., text)` / `textContent` / `emit('commLine', { text })`. Interpolate live `rec.name` after `stripControlChars` / trim / `NAME_MAX`, and `SYSTEMS[origin].station.name` from allowlisted `SYSTEMS` keys, not save title strings, when regenerating. Restored title/detail already stripped. Empty name → do not print the raw `recordId`; print a template like `the marked reaver`.
- `pirateBountyId(name)` stays pre-existing; do not copy for hunt.
- No `innerHTML`. No HUD glance row. No new Digit.
- Do not print `recordId`, mystery `clueFound` ids, or unpublished landmark ids on the Jobs card.

---

## 5. Faction attribution (REP-04 adjacency)

First-slice hunt is **overt legal work** for the posting dock:

- On success: employer = `SYSTEMS[originSystem].faction` only (live table, not a job field).
- On success: **no** victim-faction write (the pirate’s `record.faction` is not a standing target in this serial).
- On expire: no write.
- Use `Object.hasOwn(FACTIONS, faction)` before indexing `world.reputation`. Fresh bag entry only for known keys. Never `reputation[userString]`. `sanitizeReputation` already drops non-`FACTIONS` keys (`save.js` 519–538).
- Do **not** fix patrol’s hardcoded `freehold` in the hunt PRs unless a named serial owner takes it.

Victim-faction piracy (player as pirate) is REP-04 and **forbidden** as a universal crime score (`docs/RepStandingDesign.md` §7). Hunt-as-bounty-hunter does not invent that delta.

Espionage later: successful secret → no target loss (wishlist REP-04). **Depends on later REP brief.** Faction-vs-faction later: employer up, target down — same dependency. Police restitution (REP-03) is out of MSN. Passenger ferry is out (sibling). Exploration numbers are out (sibling).

---

## 6. Events and milestones

- No new type in `ctx.js` EVENTS comment.
- Optional first-complete milestone id omitted in first impl (less persist surface).
- Witness Rule: hunt does not fabricate incidents, wrecks, or pirates. Completions require a recorded player-caused `destroyed` incident plus record `dead`/`captured`.

---

## 7. Closed neighbours

| Topic | Law |
|---|---|
| Mining MSN | Keep slots, kind, cap share, `boardJobs` mining filter. Grow cap by `HUNT_ROOM` only. Never drop honest mining |
| Trade MSN | Keep slots, kind, Wave 76 dest bind. Never drop honest trade. Do not reopen `kind: 'trade'` |
| Overlay pirates | Keep cap 2, ids, `completeJob`. Single payout vs accepted hunt. Do not steal overlay slots |
| Unique ace / Named Guns | Untouched. Not a hunt quarry |
| EXP data | No `dataCrystal` / `dataCube` on jobs. Do not print mystery clue ids |
| POD | No survivor commodity on jobs. No People-desk change |
| BIO | No `livingRock`. Feed Digit unchanged |
| SHP | Digit 0 untouched. No hull/loadout as mission reward |
| HUD-02 | No chart identity work |
| TGT-05 | Do not steal `ctx.targets` |
| REP | Employer-only +2. No freehold copy. No victim-faction kill delta |
| AST | No `asteroidId`. Hunt is a pirate record, not a rock |
| Unique haul/ferry | Untouched ids, stamps, Wave 35 dest bind |
| NPC pirates | AI mode `'hunt'` unchanged. Pirates never migrate |
| Passenger / explore | Sibling workers. **No numbers** in this contract |

---

## 8. Serial PR plan (implementation wave, **not** Wave 77)

Named only. Do **not** implement in this wave.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'hunt'` on `JOB_KINDS`; id grammar `hunt-<sys>-<n>`; `recordId` allowlist; slot/need/deadline; cap `live_cap_at_impl + HUNT_ROOM`; proto drop; unique four **kept**; honest mining **and** trade **kept** | Sync/UI/pay; whole-string `SAFE_ID` on job.id; unique migration; passenger/explore rooms |
| **PR2 sync + accept + claim** | `syncHuntJobs` up to 2 slots; render/accept origin-only; origin `payQuoted` from `record.bounty`; space-side tick; overlay skip when accepted hunt claims same quarry | Expire, one-in-one-out, other families |
| **PR3 replace + expire** | splice + immediate replace; deadline 600 s fail closed; no `DONE` hunt; empty slot if no quarry | Unique-card migration; overlay retirement; mining reopen |
| **PR4 UI copy** | state + remaining time + quarry **name** on hunt cards; `textContent` only; Digit 2 only; no `rec-` ids | HUD-02, innerHTML, Digit remap |
| **PR5 boot pins** | drop `hunt-__proto__-0`; keep `bounty-ace` + `haul-provisions` + `ferry-consignment` + `mine-freehold-0` + `trade-freehold-0` + `hunt-freehold-0`; mining+trade+hunt+4 unique fit `live+HUNT_ROOM`; complete→replace; expire no pay; stuffed `target` ignored at pay; stuffed `recordId` of an ace drops; overlay still posts cap 2; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS edits by feature workers |

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave. Do not treat WAVE4 / WAVE26 / WAVE35 known FAILs as hunt bugs.

---

## 9. Later families (named, not specified)

Do **not** fill numbers. After this hunt serial:

1. Passenger ferry — sibling Wave 77 worker; **not this contract**.
2. Exploration / information — sibling Wave 77 worker; **not this contract**.
3. Faction-level pirate as a renewable **or** keep unique ace + MSN-03.
4. Faction-vs-faction — **after REP brief**.
5. Espionage — **after REP brief** (secret vs attributed). REP-04.
6. Later serial may retire overlay DONE leak independently.
7. **MSN-03** authored chains for rare equipment — after the ordinary pool is renewable.

---

## 10. Non-goals (locked)

- No `src/` in Wave 77 for this family.
- No HUD-02. No AST rock UUIDs. No POD reopen. No SHP grants. No BIO graft. No EXP SKU. No TGT.
- No new `localStorage` key. No `world.missions` parallel array.
- No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows. No NPC missiles. No power ledger.
- No MSN-03. No espionage numbers. No passenger numbers. No explore numbers. No `asteroidId`. No new `WORLD_FIELDS`.
- Do not edit the wishlist or `PROGRESS.md` in this wave.
- Do not schedule or land implementation PRs in Wave 77.
- Do not edit `docs/MsnMissionsDesign.md` / `docs/Msn02TradeDesign.md` from this worker.
- Do not replace overlay pirate rows with hunt slots.
- Do not post renewable hunt against Named Guns.

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | `station.js` (or a later `jobs.js` owned by the serial). `save.js` sanitize on restore | station UI + ticks |
| Unique four ids | `makeJobs` only when empty | boot tests |
| Mining slots | `syncMiningJobs` / replace (unchanged) | board |
| Trade slots | `syncTradeJobs` / replace (unchanged) | board |
| Hunt slots | `syncHuntJobs` / replace | board |
| Overlay pirates | `syncPirateBounties` (unchanged cap/ids; claim skip vs accepted hunt) | board |
| `ctx.world.reputation` | hunt complete: employer key only | epics, standing, npc |
| `ctx.world.records` / banks | world.js / traffic; hunt **reads** | hunt bind |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |
| `ctx.targets` | TGT / controls only | not jobs |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (already run docked or not, 3627–3631).

---

## 12. Owner defaults (stand unless overridden)

These defaults **stand**. They do not block impl. No open owner question is required to start PR1.

1. `kind = 'hunt'`. Ids `hunt-<sysId>-<n>`.
2. `HUNT_SLOTS_PER_SYSTEM = 2`. Digit 1–9 overflow is existing UX (mouse Accept). Do not cut to one slot for Digit reasons. Empty slots are legal when quarries < 2.
3. Deadline = 600 s, restart on accept (same as mining/trade).
4. `need = 1`. Pay uses live `record.bounty` at **origin** `jobPayFor`. Refuse accept if bounty is not finite `> 0`.
5. Bind `recordId` = live `rec-<n>`. UI prints `record.name`, never `recordId`.
6. Space-side claim (overlay cadence). Player redock is **not** required.
7. Overlay may name the same pirate. Accepted hunt wins the purse. Overlay cap 2 stays.
8. Rep **+2** employer faction (`MINING_REP`). No victim-faction delta.
9. Show offered hunt at home only; accepted hunt on every Jobs board.
10. Do not migrate unique four / overlay / mining / trade in this serial.
11. Cap `live_cap_at_impl + HUNT_ROOM`. Never drop honest offered mining, trade, or hunt. Do not include passenger/explore rooms.
12. No hunt milestone in first impl.
13. Job ids: hyphen-token grammar (§1.3). Do **not** whole-string `SAFE_ID`.
14. Do not post against Named Guns / `bounty-ace` / `role === 'ace'`.

---

## 13. Verification pins (for a later read-only verifier)

Exact files:

- `docs/Msn02HuntDesign.md` vs this file vs `out/w77/hunt/current-hunt-inventory.md`
- Live: `src/systems/station.js` `makeJobs` / `ensureJobs` / `completeJob` / `boardJobs` / `tickDeliveryJobs` / `renderJobs` / `acceptJob` / `syncPirateBounties` / `pirateBountyId` / `jobPayFor` / `PIRATE_BOUNTY_CAP` / `h`
- `src/game/save.js` `WORLD_FIELDS` `'jobs'`, live cap `4+2*N+2*N+16`, `sanitizeJobs`, `JOB_KINDS`
- `src/game/state.js` `ACES` / `NAMED_GUNS` / `SYSTEMS` (READ-ONLY)
- `src/game/world.js` `makeRecord` id; pirate bounty seed; `WRECK_TTL`; incidents; pirates never migrate
- `src/systems/npc.js` AI mode `'hunt'` unchanged
- `src/core/ctx.js` no jobs default, no job events
- Unique four named in `makeJobs`
- Sibling `out/w77/passenger` and `out/w77/explore` **not** merged into this cap formula
