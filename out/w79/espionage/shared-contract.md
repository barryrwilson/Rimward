# MSN-02 renewable espionage shared contract

**Wave:** 79. Design only. No espionage-job feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Msn02EspionageDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/MsnMissionsDesign.md`, `docs/Msn02HuntDesign.md`, `docs/Msn02PassengerDesign.md`, `docs/Msn02ExploreDesign.md`, `docs/Msn02TradeDesign.md`, `docs/RepStandingDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/NpcMissilesDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/Pod02TraffickingDesign.md`, `docs/Tgt05ReticleLockDesign.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, or sibling `out/w79/{rep04,faction-war}` (those are other workers).  
**Locked sources:** wishlist Initiative MSN MSN-02 “espionage” (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 563–574) and Initiative REP REP-04 secret-success / expose-failure (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 525–533; `docs/RepStandingDesign.md` §7 207–214); mining Wave 71; trade Wave 76; hunt/passenger/explore Wave 78; live inventory `out/w79/espionage/current-espionage-inventory.md` (code wins); `src/systems/station.js`; `src/game/save.js`; `src/game/data-trade.js`; `src/game/world.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments. Sibling Wave 79 workers own kill attribution and faction-war; **do not wait** for their files. Freeze board mechanics from live code + already-published `docs/RepStandingDesign.md` §7. Do **not** invent kill UU.

---

## 0. Law in one page

1. Wave 79 is markdown only for this family. Implementation is a later **serial** wave. Do not schedule or land espionage PRs in `src/` in this wave.
2. **Extend** `ctx.world.jobs`. Do **not** add a second persist key. Do **not** add a `WORLD_FIELDS` name. Autosave stays `rimward-save-v1`. No new `localStorage` key.
3. First espionage serial family is renewable **espionage**: `kind: 'espionage'`. Must **not** be `'bounty'`, `'patrol'`, `'haul'`, `'ferry'`, `'recovery'`, `'mining'`, `'trade'`, `'hunt'`, `'passenger'`, or `'explore'`.
   - **Why `'espionage'`:** unused in live `JOB_KINDS` (`save.js` 138). Defense: unique kinds, overlay, and the five shipped families already occupy those strings.
4. **Do not** replace, rename, migrate, or delete the unique four. Completing unique haul/ferry still sets `done` via `completeJob`. **Do not** seed `dataCrystal` / `dataCube` / `survivor` / `livingRock` as job cargo. Completing an espionage job must **not** invent drop % (`DATA_DROP_RATE` is `null`) or Archive UU (`ARCHIVE_UU` is `null`). Fail closed: credits + employer **+2** only; target faction **0**. Any data-grant is **proposed, needs owner** and **out of this family**.
5. Board slot: **`ESPIONAGE_SLOTS_PER_SYSTEM = 2`**, same count as live mining/trade/hunt/passenger/explore (`station.js` 189–193). One-in-one-out: complete or expire → splice → immediately post a new `kind === 'espionage'` job for the same `originSystem` + `slot` when an eligible rival dest exists. Never leave a `DONE` espionage card. If no eligible dest, **do not post** (empty slot is legal).
6. Sanitize cap **grows at impl time** by espionage room **only**. **LIVE** cap at inventory is `4 + 10*N_SYSTEMS + 16` = **1020** at 100 systems (`save.js` 115–129). Freeze:

   ```
   live_cap_at_impl = JOBS_SANITIZE_MAX as read from save.js at the implementation wave
                      // inventory-time: 4 + 10*N + 16 = 1020 at 100
   ESPIONAGE_SLOTS_PER_SYSTEM = 2
   ESPIONAGE_ROOM             = ESPIONAGE_SLOTS_PER_SYSTEM * N_SYSTEMS
   JOBS_SANITIZE_MAX_at_impl  = live_cap_at_impl + ESPIONAGE_ROOM
                              // inventory-time arithmetic: 1020 + 200 = 1220 at 100
   ```

   **Do not** write a combined formula that includes faction-war room (sibling Wave 79 worker). **Do not** drop honest offered mining, trade, hunt, passenger, or explore to make room. **Do not** drop honest offered espionage that is one of the two slots for its `originSystem`. **Do not** drop the unique four or any `accepted` job.
7. Target identity: **no asteroid UUID**. No `asteroidId`. No clue id/text in UI. Bind a **rival dest system** (a `SYSTEMS` key) plus `originSystem` + `slot`. Display names come from allowlisted `SYSTEMS[id].name` / `SYSTEMS[id].station.name` / `FACTIONS[key].name`. Witness Rule: completion is docked state + `currentSystem` only. Do **not** print unpublished mystery clue text or clue ids. Do **not** print internal dest tokens as a “spy code”.
8. Deadline: reuse 600 world seconds (`MINING_DEADLINE` `station.js` 196 / `WRECK_TTL` `world.js` 811). Restart on accept. Expire **fails closed** (no credits, no employer write, no target write, no silent complete).
9. Pay: stamp `payQuoted` on accept. Clamp 0…`PAY_QUOTED_MAX` 20000 (`save.js` 130; `station.js` 204). Base = live `explorePayBase()` = `Math.round(RECOVERY_REWARD * HAUL_MARGIN)` (`station.js` 2508, `RECOVERY_REWARD` 176 = 300, `HAUL_MARGIN` 173 = 1.4). Then `clampJobPay(jobPayFor(ctx, originSystem, base))`. Cite explore origin stamp (`station.js` 3618) — same two-dock “go and file” shape. Do **not** invent a new UU table. If a later owner needs a different number, mark **proposed, needs owner** and **fail closed (no pay)** until authored.
10. Reputation — **secret success** (wishlist REP-04; `docs/RepStandingDesign.md` §7):
    - Employer = `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, key)`. Delta **`+2`** (`MINING_REP` `station.js` 194).
    - Target faction **0** (no loss). Do **not** write `SYSTEMS[dest].faction` on success.
    - Never `job.faction` as a write source. Never `reputation[userString]`. Do **not** copy patrol `reputation.freehold +=` (`station.js` 2777).
11. Reputation — **failure / expose**: do **not** invent a kill UU table. If a target delta is required, it is **proposed, needs owner** and **fail closed (no target write)** until authored. Mining magnitude **2** is a **candidate**, not a shippable number. First impl: expire writes **nothing** (no employer, no target). Completing is secret. Do not treat dest-dock gather as expose (that is the beat).
12. UI: Jobs pane only. Digit **2**. No new Digit. No HUD glance. `textContent` / existing `h()` / `'commLine'` only. **No `innerHTML`**. Regen titles from templates + allowlisted system / station / faction **display names**. Do not print `job.faction`. Do not print clue ids. Do not print `recordId`.
13. `state.js` is READ-ONLY. No new `COMMODITIES`. No NPC missiles. No power ledger. No new frozen event in `ctx.js`. Completions keep `'commLine'`.
14. Prototype keys fail closed. Hyphen-token job ids (`SAFE_ID` is the **token** class only). Drop `RESERVED_IDS` on the full id **and** every token. Walk with `Object.keys` / index `for`, never `for…in` blob merge. Fresh `{}` literals only.
15. Do not invent faction-war numbers (sibling). Do not invent police restitution. Do not reopen BIO/POD/SHP/TGT-05/NPC missiles/power ledger. Do not reopen hunt quarry bind, trade dest bind, unique haul/ferry stamps, AST `asteroidId`, EXP desk SKUs.
16. Do not “fix” boot-test known FAILs: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul named dest.
17. Unique `makeJobs` ids stay until a **later** serial migrates them. This serial must not rename them (boot-test pins).

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'jobs'` (`save.js` 78). Keep it.

Call site today: `sanitizeJobs(ctx)` from `sanitizeRestored` (`save.js` 864). Espionage serial **extends** that healer. Do not add a second walk. Do not persist a parallel `world.spies` array. Do not add `'exposed'`.

### 1.2 Array heal

- If `world.jobs` is missing, not an array, or empty after drop → leave `[]` and let `ensureJobs` rebuild the **four unique** cards (`station.js` 1767–1769).
- Walk with `Object.keys` / index `for`, never `for…in`.
- Fresh `[]`. Push fresh `{}` literals only. Never `Object.assign` a raw save object onto a live job.

**Cap (fits five shipped families + this espionage family; does not pre-count faction-war):**

```
N_SYSTEMS              = Object.keys(SYSTEMS).length
                         // inventory-time 100: 6 authored + 94 generated
                         // state.js 12–18, 541
live_cap_at_impl       = JOBS_SANITIZE_MAX in save.js at impl
                         // inventory-time 4 + 10*N + 16 = 1020
ESPIONAGE_ROOM         = ESPIONAGE_SLOTS_PER_SYSTEM * N_SYSTEMS   // 2 * 100 = 200
JOBS_SANITIZE_MAX      = live_cap_at_impl + ESPIONAGE_ROOM
                         // inventory-time 1220 at 100
```

If a **later-or-parallel** serial already raised `JOBS_SANITIZE_MAX` when espionage impl starts, **add `ESPIONAGE_ROOM` to whatever is live**. Do not reset to 1020. Do not bake faction-war room into this file.

Drop overflow in this order until `length ≤ JOBS_SANITIZE_MAX`:

1. Invalid rows (fail §1.3–1.4).
2. Extra mining on a system that already has two valid `offered|accepted` mining jobs (live `extraOfferedFamily`, `save.js` 452–477).
3. Extra trade (same, `kind === 'trade'`).
4. Extra hunt (same, plus live duplicate `recordId` drop, `save.js` 499–528).
5. Extra passenger (same, `kind === 'passenger'`).
6. Extra explore (same, `kind === 'explore'`).
7. Extra espionage on a system that already has two valid `offered|accepted` espionage jobs (same rule, `kind === 'espionage'`). Duplicate/tamper, not a honest slot.
8. `done`/`failed` mining, trade, hunt, passenger, explore, or espionage (should not exist if replace ran).
9. `done` pirate / `done` recovery.
10. Tamper-only last resort: if still over cap, drop **offered pirate/recovery** whose `system`/`originSystem` ≠ `currentSystem`. Honest play never needs this.

**Never drop** (if the row still sanitizes):

- The four unique ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`), any state.
- Any `accepted` job.
- Any **offered mining** that is one of the two slots for its `originSystem`.
- Any **offered trade** that is one of the two slots for its `originSystem`.
- Any **offered hunt** that is one of the two slots for its `originSystem`.
- Any **offered passenger** that is one of the two slots for its `originSystem`.
- Any **offered explore** that is one of the two slots for its `originSystem`.
- Any **offered espionage** that is one of the two slots for its `originSystem`.

Normal play at inventory-time 100 systems: ≤200 each of mining/trade/hunt/passenger/explore/espionage + 4 unique + ≤16 overlays ≤ 1220. Restore must not delete honest offered mining/trade/hunt/passenger/explore to “make room.”

### 1.3 Job id grammar (implementable)

Live `SAFE_ID` rejects hyphens. Every live job id **contains** hyphens. **Do not** run `SAFE_ID.test` on the full `job.id`.

**Token class** (same characters as `SAFE_ID`, one segment):

```
JOB_ID_TOKEN = /^[a-z0-9_]+$/i     // save.js SAFE_ID body, one hyphen-separated token
```

**Full id:**

1. Type string. Length 1…`ID_MAX` 64 (`save.js` 103).
2. No leading / trailing / doubled `-`. Split on `'-'`. Every token matches `JOB_ID_TOKEN` and is non-empty.
3. Full id is **not** in `RESERVED_IDS`. Every token, compared with `toLowerCase()`, is **not** in `RESERVED_IDS`. Drops `__proto__`, `spy-__proto__-0`, `constructor`, `espionage-prototype`.
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
| **Espionage (this serial)** | Exactly three tokens: **`spy`**, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `sysId` not reserved. `originSystem` must equal `sysId`. Kind is `'espionage'` (not `'spy'`). |
| Pirate overlay | Prefix `bounty-pirate-` plus ≥1 further token. This serial does not retcon overlay ids. |
| Recovery overlay | Prefix `recovery-` plus ≥1 further token. |

**Why `spy-` not `espionage-`:** owner freeze suggested `spy-<SYSTEMS key>-<n>`. Live mining already uses a **short prefix** (`mine-` vs kind `'mining'`). `spy` is one `SAFE_ID` token. Kind stays `'espionage'` so `JOB_KINDS` does not collide with a hypothetical NPC string. Sanitize checks `tokens[0] === 'spy'` **and** `kind === 'espionage'`, same coupling as `mine`/`mining`.

Examples that **must keep**: `bounty-ace`, `mine-freehold-0`, `trade-freehold-0`, `hunt-freehold-0`, `passenger-freehold-0`, `explore-freehold-0`, `spy-freehold-0`, `spy-fh_hearth-1`.  
Examples that **must drop**: `__proto__`, `spy-__proto__-0`, `espionage-freehold-0` (wrong prefix), `spy-freehold` (no `n`), `spy-notasystem-0`. Do **not** rewrite unique ids to underscores.

Espionage allocator: monotonic `n` per process (or scan max like `nextMiningId`, `station.js` 1878–1896). Collision → increment `n`. System token is a `SYSTEMS` key (underscores allowed: `fh_hearth`). Hyphens only as separators, never inside the system key.

Do **not** copy `pirateBountyId(name)` for spy ids.

### 1.4 Per-job allowlist

Keep a job only if **all** hold. Extend live `JOB_KINDS` with `'espionage'`. Do not remove mining/trade/hunt/passenger/explore.

Do **not** add `faction` to `JOB_FIELD_ALLOW`. Do **not** add a clue-id field. `recordId` stays hunt-only (drop the field on espionage if present). `commodity` forbidden on espionage (drop the field; do not copy).

| Field | Rule |
|---|---|
| `id` | §1.3 grammar for that `kind`. **Not** whole-string `SAFE_ID.test` |
| `kind` | one of live kinds **plus `'espionage'`** |
| `state` | one of `offered` \| `accepted` \| `done` \| `failed` |
| `title`, `detail` | string; `stripControlChars`; cap 240 / 720; empty → drop job |
| `reward`, `need`, `progress` | finite number; `need` ≥ 1; `progress` ≥ 0; clamp `progress` ≤ `need`. **Espionage:** `need` must be integer **1**. Else drop (do not heal a stuffed 0-need) |
| `originSystem`, `destSystem`, `system` | if present: `Object.hasOwn(SYSTEMS, id)` else drop field or drop job if required for kind |
| `payQuoted`, `originPrice` | if present: finite ≥ 0 integer after `Math.round`; **clamp `0…PAY_QUOTED_MAX`**. `PAY_QUOTED_MAX = 20000` (live) |
| `target` | hunt/bounty only. Espionage: if present, **drop the field** (do not copy). UI names come from `SYSTEMS` |
| `recordId` | hunt only. Espionage: drop the field |
| `wreckId` / `collected` | recovery only |
| `commodity` | mining/trade unchanged. Espionage: **forbidden** — drop the field |
| `deadline` | if present: finite `world.time` units ≥ 0; if non-finite, drop the field. Espionage **requires** finite `deadline` |
| `slot` | mining, trade, hunt, passenger, explore, or espionage: integer `0` or `1`; else drop that family job |
| `faction` | **Forbidden.** Unknown keys drop. Do not copy |

Unknown keys: drop (do not copy). Prototype keys: drop.

**Espionage-required fields:** `originSystem`, `destSystem`, `slot`, `deadline`. `originSystem` must equal id token `sysId`. `destSystem` must be a `SYSTEMS` key, **≠** origin, and `SYSTEMS[dest].faction` must be a `FACTIONS` key **≠** `SYSTEMS[origin].faction`. Dest must have a station (`SYSTEMS[dest].station`). Dest faction must not be `'unknowables'` (no dock). If dest fails those checks, **drop the job**. Pay **ignores** stuffed dest and rebinds (§3.3).

**Espionage:** `need === 1`. `progress` 0 or 1 after clamp.

### 1.5 Clock

`world.time` already heals to `0` (`save.js` 862). Deadline compares use that clock, never `ctx.elapsed`.

A hand-edited future `world.time` may expire accepted spy jobs — fail closed, then replace. Same cheat class as editing credits. Do not add a second clock.

---

## 2. Board slot (espionage family)

### 2.1 What a slot is

For espionage only:

- Each system may have **two** espionage jobs (`slot` 0 and 1) in `world.jobs` whose `originSystem === that system` and `kind === 'espionage'`.
- States in a slot: `offered` or `accepted`. `failed`/`done` are transient: splice in the same function that posted the replacement.
- The Jobs board **shows** offered spy cards when `ctx.world.currentSystem === originSystem`. Accepted spy cards also show on other docks as a reminder (state line names dest **display** name). Same pattern as mining (`boardJobs` `station.js` 2673–2687 — add an espionage line).

Mining, trade, hunt, passenger, and explore slots are independent. Overlay rows are independent. A system may hold two of each shipped family **and** two spy jobs **and** up to two overlay pirate cards.

Two spy slots on one origin must **not** bind the same dest key. If only one eligible dest exists, slot 1 stays empty.

### 2.2 Fill

`syncEspionageJobs(ctx, sysId)` on `renderJobs` (after `syncExploreJobs`):

- If `!Object.hasOwn(SYSTEMS, sysId)`, return.
- If origin has no station or origin faction is `'unknowables'`, return (no dock).
- **Pull** offered spy rows for `sysId` whose rebound dest is missing or ineligible (§3.3). Do **not** pull `accepted` rows here (accepted uses expire / fail-closed tick). Reverse index walk; splice; then fill.
- Count spy jobs with `originSystem === sysId` and state `offered|accepted`.
- Eligible dest (§3.3).
- While count < `ESPIONAGE_SLOTS_PER_SYSTEM`, pick the next eligible dest not already bound to an offered/accepted spy slot on this origin, and push a new offered spy job for `sysId`.
- If no eligible dest remains, **stop**. Do not invent a fake system. Do not fabricate incidents (Witness Rule).
- Do **not** reshuffle existing offered cards on each render.
- Do **not** fill mining/trade/hunt/passenger/explore slots with spy, or spy slots with overlay `kind: 'bounty'`.
- Stuffed offered spies with fake dest must not occupy a slot.

### 2.3 One-in-one-out

On espionage complete **or** espionage expire:

1. Note `originSystem` and `slot`.
2. Pay or not (complete pays; expire does not).
3. `splice` that element.
4. Immediately `push` a new offered spy job for the same system and slot **if** an eligible dest exists (else leave the slot empty until a later `syncEspionageJobs`).
5. If the overlay is open on Jobs, `render()` so the replacement is visible this interaction (`maybeRefreshJobsBoard` `station.js` 2000–2003).

Never `state = 'done'` on espionage (unlike today’s unique `completeJob`). Set `failed` **before** pay (mining `station.js` 2886) so a crash mid-replace cannot pay twice. Unique kinds still use today’s `done`. Overlay pirates still use today’s `done`.

### 2.4 Unique cards and overlay (not spy slots)

`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` stay unique. Completing them still sets `done`.

Pirate / recovery overlays stay as today. Mining, trade, hunt, passenger, and explore slots stay as today.

---

## 3. Espionage family (this vertical slice)

### 3.1 Player-facing contract

Accept at **home** dock. The card names a **rival** station (display name) whose `SYSTEMS[dest].faction` ≠ employer. Fly there. Dock at that dest (gather: `progress = 1`). Redock **home**. The 0.5 s jobs tick pays stamped `payQuoted`, writes employer +2, writes target **0**, dockmaster trust via `rewardJobContacts` **without** unique `completeJob` `done` and **without** overlay fence-favor (`kind !== 'bounty'`), splice, new card on the **origin** board immediately if a dest remains.

Copy explore **origin-file** cadence (visit then redock home, `station.js` 3045–3064), **not** passenger dest-pay. Copy mining **replace** shape, not `completeJob`.

No cargo. No `asteroidId`. No clue id. No data grant. Accept only at the origin dock (`currentSystem === originSystem`). `need` is exactly 1.

**Secret:** success `commLine` names the **employer** display name and pay. It does **not** name the target faction as a standing loss. It may name the dest **station** as the filed site.

### 3.2 Fields (JSON-plain)

```
{
  id,                 // spy-<sysId>-<n>
  kind: 'espionage',
  slot,               // 0 | 1
  originSystem,       // SYSTEMS key; home dock / employer
  destSystem,         // SYSTEMS key snapshot at post; PAY rebinds
  title, detail,      // authored templates, textContent; regen on render
  reward,             // base UU before jobPayFor (explorePayBase)
  payQuoted,          // stamped on accept (jobPayFor at ORIGIN)
  need,               // 1
  progress,           // 0 until dest dock while accepted; then 1
  state,              // offered | accepted
  deadline,           // world.time seconds when the card fails
}
```

No `asteroidId`. No THREE. **No `faction` field.** Employer at pay time is `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, faction)`. Target (not written on success) is `SYSTEMS[reboundDest].faction` with the same `hasOwn` gate. A save must not retarget reputation by stuffing `job.faction`. Stuffed `destSystem` cannot retarget pay (tick rebinds).

### 3.3 Eligible dest (rebind)

A dest D is eligible for origin O when **all** hold:

1. `Object.hasOwn(SYSTEMS, O)` and `Object.hasOwn(SYSTEMS, D)`
2. `D !== O`
3. `SYSTEMS[O].station` exists (home dock)
4. `SYSTEMS[D].station` exists (gather dock)
5. `employer = SYSTEMS[O].faction`; `Object.hasOwn(FACTIONS, employer)`; `employer !== 'unknowables'`
6. `targetFac = SYSTEMS[D].faction`; `Object.hasOwn(FACTIONS, targetFac)`; `targetFac !== 'unknowables'`
7. `targetFac !== employer`
8. D is not already bound to another offered/accepted spy slot on O

**Picker (deterministic, no `Math.random` for dest identity):**

1. Walk `SYSTEMS[O].gates` with index `for` if `gates` is an array. For each `to`, if eligible and not reserved, push unique (`gateRivals`).
2. Walk `Object.keys(SYSTEMS)` with index `for`. Skip reserved / `__proto__`. Use `Object.hasOwn`. Collect remaining eligible dests (`allRivals`).
3. **List:** if `gateRivals.length > 0`, use **only** `gateRivals` (one-hop, MSN-01 generous). Else use `allRivals` so an origin whose gates are all same-flag still posts.
4. `slot` 0 takes list index 0. `slot` 1 takes list index 1 **if present**; else **do not post** slot 1 (empty slot is legal). Do **not** reuse index 0 as a duplicate dest. Do **not** pick the 50th `Object.keys` row as slot 1 when a local rival gate exists.
5. If the list is empty, **do not post**.

**Pay / gather rebind:** `dest = resolveEspionageDest(origin, slot)` from live `SYSTEMS`. Ignore stuffed `job.destSystem` for MATCH. If rebound dest is missing/ineligible: fail closed (no pay). UI dest **name** uses rebound when found, else stripped `SYSTEMS[job.destSystem].station.name` when that key still exists (board only; never pay on the fallback alone).

**Skip post** when the origin has no eligible dest. Do not spawn systems from Jobs. Do not write incidents.

Do **not** copy `passengerDestId` / `otherSystemId` as the only dest (gate 0 may share faction).

### 3.4 Need / pay / rep (cite; do not invent)

| Number | Value | Status |
|---|---|---|
| `need` | **1** | passenger/explore/hunt `need: 1` |
| Base UU | `explorePayBase()` = `Math.round(RECOVERY_REWARD * HAUL_MARGIN)` | cite `station.js` 2508, 176, 173. Two-dock file shape like explore |
| `payQuoted` | `clampJobPay(jobPayFor(ctx, originSystem, explorePayBase()))` | cite explore accept 3618. **Origin**, not dest `jobPay` |
| Clamp | `PAY_QUOTED_MAX` 20000 | cite `station.js` 204; `save.js` 130 |
| Reputation success | **`+2`** employer `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS)` | cite `MINING_REP` 194. Target **0** |
| Reputation expose | **no write** until owner authors a table | candidate `MINING_REP` 2, **not shippable**. Sibling owns kill UU |
| Trust/favor | reuse `rewardJobContacts` dockmaster path | Hunt `kind !== 'bounty'` so **no** fence favor. Do not mark unique `done` |
| Deadline length | `MINING_DEADLINE` / `WRECK_TTL` **600** world seconds from **accept** (offered cards: from post time) | cite `station.js` 196; `world.js` 811 |
| Offered lifetime | same 600 s from post; expire → fail closed → replace | keeps the board moving if ignored |
| Data grant | **none** | `DATA_DROP_RATE` null; `ARCHIVE_UU` null |

Do not author new UU tables in `state.js`. Unique ace still pays `jobPay(current, job.reward)` unstamped; this family stamps origin `jobPayFor`. Do not change unique/overlay stamp code.

### 3.5 Tick / expire / dest bind / secret pay

Cadence: ride `tickDeliveryJobs` (0.5 s, `station.js` 4511–4512) **and** a cheap expire scan there (not only while docked). Reverse walk so splice does not skip.

**Dest resolve (pay, gather, UI):**

```
origin = job.id token sysId
         (require Object.hasOwn(SYSTEMS, origin) && origin === job.originSystem after sanitize)
dest   = resolveEspionageDest(origin, slot)   // ignore stuffed job.destSystem for MATCH
if !dest: fail closed (no pay)
employer = SYSTEMS[origin].faction
targetFac = SYSTEMS[dest].faction
if !Object.hasOwn(FACTIONS, employer) || employer === targetFac: fail closed (no pay)
```

**Gather** (accepted; docked; dest cadence):

```
if job.state !== 'accepted': continue
if ctx.flags.docked && ctx.world.currentSystem === dest: job.progress = 1
```

Docking dest is **gather**, not expose. Do not write target standing here. Accept **forces** `progress = 0`. Sanitize does not raise stuffed progress. A hand-edited `progress: 1` on an accepted row is the same cheat class as stuffing mining cargo — do not add a second persist key to prove the hop.

**Complete** (accepted; origin dock; explore cadence):

```
if job.need !== 1: fail closed replace
if job.progress < 1: continue
if !ctx.flags.docked: continue
if ctx.world.currentSystem !== origin: continue
job.state = 'failed'                       // before pay — mining 2886
pay = clampJobPay(job.payQuoted) if finite else 0   // no live reprice; missing quote → 0 + still replace
if pay > 0: credits += pay
employer rep +2 if Object.hasOwn(FACTIONS, SYSTEMS[origin].faction)
// target faction: write 0 (skip). Do not subtract.
rewardJobContacts
commLine via textContent path (employer name + pay; no target-loss clause)
splice + replace (§2.3)
```

**Do not** pay from stuffed `job.destSystem`. **Do not** pay from stuffed `job.faction`. **Do not** use `ctx.elapsed`. **Do not** grant `dataCrystal` / `dataCube`. **Do not** emit `clueFound`.

**Expire** (`world.time >= deadline` and state offered or accepted):

- no pay
- no employer write
- **no target write** (expose fail-closed until owner)
- commLine: contract lapsed (accepted) or posting withdrawn (offered)
- splice + replace (or empty slot)

**Silent complete is forbidden.** A tampered `deadline` in the past on restore expires on the next tick, fail closed.

**Offered dest gone:** if offered spy’s rebound dest is ineligible, **fail closed replace** on the same tick (no pay). Do not convert offered→accepted.

**Accepted dest gone:** fail closed replace (no pay, no target write).

### 3.6 Accept

Offered spy is **home-only**. `acceptJob` must refuse (no state flip, no stamp, notice) when:

- `job.kind === 'espionage'` and `ctx.world.currentSystem !== job.originSystem`
- origin not a `SYSTEMS` key
- rebound dest ineligible (§3.3) or missing
- `state !== 'offered'`
- `need !== 1`

Do not retarget `originSystem` from `currentSystem` (unique haul does; spy must not).

Stamp:

- `payQuoted` with **origin** `jobPayFor(explorePayBase())` + `clampJobPay` when that value is finite `> 0`; else refuse
- `deadline = world.time + 600` (restart)
- `destSystem` refresh from rebound dest (display snapshot)
- `progress = 0`
- do **not** copy `currentSystem` onto `originSystem`
- do **not** copy a faction string onto the job

`boardJobs` hides offered spy unless `originSystem === sysId`. Hide **and** refuse: a missed filter must not accept a foreign card.

Digit accept stays index-into-`boardJobs` (live 4429–4431) but mutates the **job object by identity**. Replacement must not reuse the spliced object. Do not accept `done`/`failed`.

---

## 4. Id and XSS

- Allocate spy ids per §1.3 (`spy-<SYSTEMS key>-<n>`). Confirm `Object.hasOwn(SYSTEMS, sysId)` first. Collision → increment `n`. Never `jobs[id] =` as a map. Never `SAFE_ID.test` the full id.
- `title` / `detail` / commLine / notices: `h(..., text)` / `textContent` / `emit('commLine', { text })`. Interpolate allowlisted `SYSTEMS[id].station.name` / `SYSTEMS[id].name` / `FACTIONS[key].name` after `stripControlChars` / trim / `NAME_MAX`, not save title strings, when regenerating. Restored title/detail already stripped. Empty station name → print `the far dock` / `the home dock`. Never print dest/origin **keys** as spy codes. Never print clue ids or `recordId`.
- No `innerHTML`. No HUD glance row. No new Digit.
- Do not print mystery `clueFound` ids, unpublished landmark ids, or `asteroidId` on the Jobs card.

---

## 5. Faction attribution (REP-04 freeze)

First-slice espionage is **secret work** for the posting dock:

- On success: employer = `SYSTEMS[originSystem].faction` only (live table, not a job field). **+2**.
- On success: **no** target-faction write (`SYSTEMS[dest].faction` is not a standing target in this serial). Wishlist: successful espionage causes no target loss.
- On expire / fail: **no** write. Expose “normal loss” is **proposed, needs owner**. Candidate magnitude: `MINING_REP` 2. **Fail closed (no target write)** until authored. Do not wait for sibling kill-UU files. Do not invent a table here.
- Use `Object.hasOwn(FACTIONS, faction)` before indexing `world.reputation`. Fresh bag entry only for known keys. Never `reputation[userString]`. `sanitizeReputation` already drops non-`FACTIONS` keys (`save.js` 672–692).
- Do **not** fix patrol’s hardcoded `freehold` in the spy PRs unless a named serial owner takes it.

Overt faction-vs-faction (employer up, target down) is the **faction-war** sibling. **No numbers here.** Police restitution (REP-03) is out of MSN. Kill attribution is the other Wave 79 sibling. **No kill UU here.**

---

## 6. Events and milestones

- No new type in `ctx.js` EVENTS comment.
- Optional first-complete milestone id omitted in first impl (less persist surface).
- Witness Rule: spy does not fabricate incidents, wrecks, pirates, clues, or data rows. Completions require docked + `currentSystem` + `progress === 1`.
- Do not emit `'clueFound'` or `'landmarkFound'` from this family.

---

## 7. Closed neighbours

| Topic | Law |
|---|---|
| Mining MSN | Keep slots, kind, cap share, `boardJobs` mining filter. Grow cap by `ESPIONAGE_ROOM` only. Never drop honest mining |
| Trade MSN | Keep slots, kind, Wave 76 dest bind. Never drop honest trade |
| Hunt MSN | Keep slots, kind, quarry bind, overlay skip. Never drop honest hunt. Do not reuse `'hunt'` |
| Passenger MSN | Keep slots. Never drop honest passenger. Do not reuse `'passenger'`. Dest picker is **not** gate-0-only |
| Explore MSN | Keep slots. Never drop honest explore. Cite `explorePayBase`. No data cargo. No clue ids |
| Overlay pirates | Keep cap 2, ids, `completeJob` |
| Unique ace / Named Guns | Untouched |
| EXP data | No `dataCrystal` / `dataCube` on jobs. Do not print mystery clue ids. Archive UU stays null |
| POD | No survivor commodity on jobs. No People-desk change |
| BIO | No `livingRock`. Feed Digit unchanged |
| SHP | Digit 0 untouched. No hull/loadout as mission reward |
| HUD-02 | No chart identity work |
| TGT-05 | Do not steal `ctx.targets` |
| REP | Employer-only +2 on success. Target 0 on success. Expose fail-closed. No freehold copy. No kill UU |
| AST | No `asteroidId` |
| Unique haul/ferry | Untouched ids, stamps, Wave 35 dest bind |
| Faction-war | Sibling worker. **No numbers** in this contract |
| NPC missiles / power | Unchanged |

---

## 8. Serial PR plan (implementation wave, **not** Wave 79)

Named only. Do **not** implement in this wave. Shape matches hunt: sanitize kind+cap → cards/sync → complete/expire/replace → Digit 2 UI → boot pins.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'espionage'` on `JOB_KINDS`; id grammar `spy-<sys>-<n>`; slot/need/deadline/dest; cap `live_cap_at_impl + ESPIONAGE_ROOM`; proto drop; unique four **kept**; honest mining/trade/hunt/passenger/explore **kept** | Sync/UI/pay; whole-string `SAFE_ID` on job.id; unique migration; faction-war room; expose table |
| **PR2 cards + sync** | `syncEspionageJobs` up to 2 slots; render/accept origin-only; origin `payQuoted` from `explorePayBase`; dest rebind | Expire, one-in-one-out, other families |
| **PR3 complete / expire / replace** | dest-dock gather `progress=1`; origin-dock pay; splice + immediate replace; deadline 600 s fail closed; no `DONE` spy; empty slot if no dest; success target **0**; expire no target write | Unique-card migration; overlay retirement; kill UU; faction-war |
| **PR4 Digit 2 UI** | state + remaining time + dest **station name**; `textContent` only; Digit 2 only; no clue ids | HUD-02, innerHTML, Digit remap, Archive desk edits |
| **PR5 boot pins** | drop `spy-__proto__-0`; keep unique four + `mine-freehold-0` + `trade-freehold-0` + `hunt-freehold-0` + `passenger-freehold-0` + `explore-freehold-0` + `spy-freehold-0`; families +4 unique fit `live+ESPIONAGE_ROOM`; complete→replace; expire no pay and no target delta; stuffed dest ignored at pay; stuffed `job.faction` dropped; no data cargo; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS edits by feature workers |

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave. Do not treat WAVE4 / WAVE26 / WAVE35 known FAILs as spy bugs.

---

## 9. Later families (named, not specified)

Do **not** fill numbers.

1. Faction-vs-faction / faction-war — **sibling Wave 79 worker**; not this contract.
2. Expose magnitude / kill UU — **sibling REP-04 worker**; fail closed here until authored.
3. EXP drop % / Archive UU — owner-open; out of this family.
4. Later serial may retire overlay DONE leak independently.
5. **MSN-03** authored chains for rare equipment — after the ordinary pool is renewable.

---

## 10. Non-goals (locked)

- No `src/` in Wave 79 for this family.
- No HUD-02. No AST rock UUIDs. No POD reopen. No SHP grants. No BIO graft. No EXP SKU. No TGT.
- No new `localStorage` key. No `world.missions` parallel array.
- No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows. No NPC missiles. No power ledger.
- No MSN-03. No faction-war numbers. No kill UU. No `asteroidId`. No new `WORLD_FIELDS`.
- Do not edit the wishlist or `PROGRESS.md` in this wave.
- Do not schedule or land implementation PRs in Wave 79.
- Do not edit parent `docs/MsnMissionsDesign.md` or sibling briefs from this worker.
- Do not grant `dataCrystal` / `dataCube`.
- Do not copy patrol `reputation.freehold +=`.

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | `station.js` (or a later `jobs.js` owned by the serial). `save.js` sanitize on restore | station UI + ticks |
| Unique four ids | `makeJobs` only when empty | boot tests |
| Mining/trade/hunt/passenger/explore slots | existing sync / replace (unchanged) | board |
| Espionage slots | `syncEspionageJobs` / replace | board |
| Overlay pirates | `syncPirateBounties` (unchanged) | board |
| `ctx.world.reputation` | spy complete: employer key only | epics, standing, npc |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |
| `ctx.targets` | TGT / controls only | not jobs |
| Data cargo / Archive | `data-trade.js` / market desk | **not** spy jobs |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (already run docked or not, 4508–4512).

---

## 12. Owner defaults (stand unless overridden)

These defaults **stand**. They do not block impl. No open owner question is required to start PR1.

1. `kind = 'espionage'`. Ids `spy-<sysId>-<n>` (prefix ≠ kind; mining precedent).
2. `ESPIONAGE_SLOTS_PER_SYSTEM = 2`. Digit 1–9 overflow is existing UX (mouse Accept). Do not cut to one slot for Digit reasons. Empty slots are legal when rival dests < 2.
3. Deadline = 600 s, restart on accept (same as mining/trade/hunt/passenger/explore).
4. `need = 1`. Pay uses live `explorePayBase()` at **origin** `jobPayFor`. Refuse accept if that stamp is not finite `> 0`.
5. Bind dest = live rival `SYSTEMS` key. UI prints station **name**, never the key, never a clue id.
6. Gather at dest dock (`progress = 1`). File at origin dock. Player redock **home** is required (explore cadence). Dest-dock is not expose.
7. Success: employer **+2**, target **0**. Expire: no writes. Expose delta remains proposed/fail-closed.
8. Show offered spy at home only; accepted spy on every Jobs board.
9. Do not migrate unique four / overlay / mining / trade / hunt / passenger / explore in this serial.
10. Cap `live_cap_at_impl + ESPIONAGE_ROOM`. Never drop honest offered mining, trade, hunt, passenger, explore, or espionage. Do not include faction-war room.
11. No spy milestone in first impl.
12. Job ids: hyphen-token grammar (§1.3). Do **not** whole-string `SAFE_ID`.
13. No `dataCrystal` / `dataCube` grant.

---

## 13. Verification pins (for a later read-only verifier)

Exact files:

- `docs/Msn02EspionageDesign.md` vs this file vs `out/w79/espionage/current-espionage-inventory.md`
- Live: `src/systems/station.js` `makeJobs` / `ensureJobs` / `completeJob` / `boardJobs` / `tickDeliveryJobs` / `renderJobs` / `acceptJob` / `jobPayFor` / `explorePayBase` / `MINING_REP` / `h` / `DOCK_KEY_SERVICES`
- `src/game/save.js` `WORLD_FIELDS` `'jobs'`, live cap `4+10*N+16`, `sanitizeJobs`, `JOB_KINDS` (no `'espionage'` until impl)
- `src/game/data-trade.js` `DATA_DROP_RATE` null; `station.js` `ARCHIVE_UU` null
- `src/game/state.js` `SYSTEMS` / `FACTIONS` (READ-ONLY)
- `src/core/ctx.js` no jobs default, no job events
- Unique four named in `makeJobs`
- Sibling `out/w79/rep04` and `out/w79/faction-war` **not** merged into this cap formula or expose table
