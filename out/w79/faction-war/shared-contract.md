# MSN-02 renewable faction-against-faction operations shared contract

**Wave:** 79. Design only. No war-job feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Msn02FactionWarDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/MsnMissionsDesign.md`, `docs/Msn02HuntDesign.md`, `docs/Msn02PassengerDesign.md`, `docs/Msn02ExploreDesign.md`, `docs/Msn02TradeDesign.md`, `docs/RepStandingDesign.md`, `docs/NpcMissilesDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/Pod02TraffickingDesign.md`, `docs/Tgt05ReticleLockDesign.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, or sibling `out/w79/{rep04,espionage}` (those are other workers).  
**Locked sources:** wishlist Initiative MSN MSN-02 “faction-against-faction operations” (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 563–574) and Initiative REP REP-04 “Overt faction-against-faction work raises standing with the employer and lowers it with the target” (525–531); `docs/RepStandingDesign.md` §7; live inventory `out/w79/faction-war/current-war-inventory.md` (code wins); hunt contract shape `out/w77/hunt/shared-contract.md`; live Wave 78 hunt/passenger/explore; `src/systems/station.js`; `src/game/save.js`; `src/game/world.js`; `src/systems/npc.js`; `src/game/state.js` (READ-ONLY); `src/core/ctx.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

This family is **not** “hunting a faction-level pirate threat”. That remains unique `bounty-ace` / Named Guns.

---

## 0. Law in one page

1. Wave 79 is markdown only for this family. Implementation is a later **serial** wave. Do not schedule or land war PRs in `src/` in this wave.
2. **Extend** `ctx.world.jobs`. Do **not** add a second persist key. Do **not** add a `WORLD_FIELDS` name. Autosave stays `rimward-save-v1`. No new `localStorage` key.
3. First war serial family is renewable **overt faction-against-faction operations**: `kind: 'war'`. Must **not** be `'bounty'`, `'patrol'`, `'haul'`, `'ferry'`, `'recovery'`, `'mining'`, `'trade'`, `'hunt'`, `'passenger'`, or `'explore'`.
   - **Why `'war'`:** unused in live `JOB_KINDS` (`save.js` 138). `'hunt'` is local pirate career. `'bounty'` is unique ace **and** overlay pirates. `'patrol'` is unique `patrol-lane` (pirate sweep + hardcoded Freehold). NPC AI mode `'hunt'` (`npc.js` 200) is not a job kind. Do not change NPC mode from this family. Do not reuse `'espionage'` (sibling; that kind also does not exist live).
4. **Do not** replace, rename, migrate, or delete the unique four. Unique `bounty-ace` stays the faction-level / Named Gun card. **Do not** make Named Guns renewable. **Do not** post a war slot against `ACES` / `NAMED_GUNS` / `role === 'ace'` / `classKey === 'ace'`.
5. Board slot: **`WAR_SLOTS_PER_SYSTEM = 2`**, same count as live mining/trade/hunt/passenger/explore (`station.js` 189–193). One-in-one-out: complete or expire → splice → immediately post a new `kind === 'war'` job for the same `originSystem` + `slot` when an eligible quarry exists. Never leave a `DONE` war card. If no eligible quarry, **do not post** (empty slot is legal; Verge/Hush have `cast.patrols === 0`).
6. Overlay pirate rows stay. Hunt slots stay. Unique patrol stays. Prefer **new kind + slots**. Overlay reuse is **not** safe (inventory §7). War quarry is `role === 'patrol'`, not pirate, so overlay single-payout skip vs hunt does **not** extend to war.
7. Sanitize cap **grows at impl time** by war room only. **LIVE** cap at inventory is `4 + 10*N_SYSTEMS + 16` = **1020** at 100 systems (`save.js` 115–129). Freeze:

   ```
   live_cap_at_impl = JOBS_SANITIZE_MAX as read from save.js at the implementation wave
                      // inventory-time: 4 + 10*N + 16 = 1020 at 100
   WAR_SLOTS_PER_SYSTEM = 2
   WAR_ROOM             = WAR_SLOTS_PER_SYSTEM * N_SYSTEMS
   JOBS_SANITIZE_MAX_at_impl = live_cap_at_impl + WAR_ROOM
                             // inventory-time arithmetic: 1020 + 200 = 1220 at 100
   ```

   **Do not** write a combined formula that includes espionage room (sibling Wave 79 worker). **Do not** drop honest offered mining, trade, hunt, passenger, or explore to make room. **Do not** drop honest offered war that is one of the two slots for its `originSystem`. **Do not** drop the unique four or any `accepted` job.
8. Target identity: **no asteroid UUID**. No `asteroidId`. Bind a live patrol **record id** `rec-<n>` (`world.js` 285) plus `originSystem` plus rebound `destSystem`. Display name comes from the live record (fallback stripped `target`). Witness Rule: recorded incidents / record state only. Do **not** print unpublished mystery clue text or clue ids. Do **not** print `rec-<n>` in the Jobs pane.
9. Deadline: reuse 600 world seconds (`MINING_DEADLINE` `station.js` 196 / `WRECK_TTL` `world.js` 811). Restart on accept. Expire **fails closed** (no credits, no rep, no silent complete).
10. Pay: stamp `payQuoted` on accept. Clamp 0…`PAY_QUOTED_MAX` 20000 (`save.js` 130; `station.js` 204). Base = live `PATROL_REWARD` **300** (`station.js` 169). Then `clampJobPay(jobPayFor(ctx, originSystem, PATROL_REWARD))`. Cite unique patrol’s credit constant, **not** unique patrol’s `freehold +=` and **not** a new UU table. If a later owner needs a different number, mark **proposed, needs owner** and **fail closed (no pay)** until authored.
11. Reputation:
    - Employer **up** on success. Employer = `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, key)`. Delta **`+2`** (`MINING_REP` `station.js` 194).
    - Target **down** is wishlist REP-04. Target faction binds from a **live allowlisted field**, never `job.faction` stuffed from save. Binding: rebound dest `sysId` → `SYSTEMS[dest].faction` with `Object.hasOwn(FACTIONS, key)` and `key !== employer` (§3.3). Target delta is **proposed, needs owner**. Until authored, **fail closed (no target write)** so the card still completes with employer +2 only. Magnitude **2** is a **candidate**, not a shippable number.
    - Expire writes nothing. Never `reputation[userString]`. Do **not** copy patrol `reputation.freehold +=` (`station.js` 2777). Do **not** invent a kill-attribution path (REP-04 sibling). Do **not** invent a crime score.
12. UI: Jobs pane only. Digit **2**. No new Digit. No HUD glance. `textContent` / existing `h()` / `'commLine'` only. **No `innerHTML`**. Regen titles from templates + live record **name** (allowlisted via record lookup) + `FACTIONS[target].name` / `FACTIONS[employer].name` via `factionDisplayName` + `SYSTEMS[origin].station.name` / `SYSTEMS[dest].station.name`. Do not print `job.faction`. Do not use `job.faction` as a write source.
13. `state.js` is READ-ONLY. No new `COMMODITIES`. No NPC missiles. No power ledger. No new frozen event in `ctx.js`. Completions keep `'commLine'`.
14. Prototype keys fail closed. Hyphen-token job ids (`SAFE_ID` is the **token** class only). Drop `RESERVED_IDS` on the full id **and** every token. Walk with `Object.keys` / index `for`, never `for…in` blob merge. Fresh `{}` literals only.
15. Do not invent espionage **numbers**. Sibling Wave 79 worker owns espionage. Do not invent police restitution. Do not invent a victim-faction kill UU.
16. Do not invent passenger/explore/hunt/mining/trade numbers. Those families already shipped. Grow cap by `WAR_ROOM` only.
17. Do not reopen BIO/POD/SHP/TGT-05/NPC missiles/power ledger/MSN-03 chains. Do not reopen mining hardness, trade dest bind, unique haul/ferry stamps, AST `asteroidId`.
18. Do not “fix” boot-test known FAILs: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul named dest.
19. Unique `makeJobs` ids stay until a **later** serial migrates them. This serial must not rename them (boot-test pins).

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'jobs'` (`save.js` 78). Keep it.

Call site today: `sanitizeJobs(ctx)` from `sanitizeRestored` (`save.js` 864). War serial **extends** that healer. Do not add a second walk. Do not persist a parallel `world.wars` array.

### 1.2 Array heal

- If `world.jobs` is missing, not an array, or empty after drop → leave `[]` and let `ensureJobs` rebuild the **four unique** cards (`station.js` 1767–1769).
- Walk with `Object.keys` / index `for`, never `for…in`.
- Fresh `[]`. Push fresh `{}` literals only. Never `Object.assign` a raw save object onto a live job.

**Cap (fits live families + this war family; does not pre-count espionage):**

```
N_SYSTEMS              = Object.keys(SYSTEMS).length
                         // inventory-time 100: 6 authored + 94 generated
                         // state.js 12–18, 541
live_cap_at_impl       = JOBS_SANITIZE_MAX in save.js at impl
                         // inventory-time 4 + 10*N + 16 = 1020
WAR_ROOM               = WAR_SLOTS_PER_SYSTEM * N_SYSTEMS   // 2 * 100 = 200
JOBS_SANITIZE_MAX      = live_cap_at_impl + WAR_ROOM
                         // inventory-time 1220 at 100
```

If a **later-or-parallel** serial already raised `JOBS_SANITIZE_MAX` when war impl starts, **add `WAR_ROOM` to whatever is live**. Do not reset to 1020. Do not bake espionage room into this file.

Drop overflow in this order until `length ≤ JOBS_SANITIZE_MAX`:

1. Invalid rows (fail §1.3–1.4).
2. Extra mining on a system that already has two valid `offered|accepted` mining jobs (live `extraOfferedFamily`, `save.js` 452–477).
3. Extra trade (same, `kind === 'trade'`).
4. Extra hunt (same, plus live duplicate `recordId` drop `save.js` 499–528).
5. Extra passenger (same).
6. Extra explore (same).
7. Extra war on a system that already has two valid `offered|accepted` war jobs (same rule, `kind === 'war'`). Duplicate/tamper, not a honest slot. Also drop extra war that shares `recordId` with another offered war (accepted wins).
8. `done`/`failed` mining, trade, hunt, passenger, explore, or war (should not exist if replace ran).
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
- Any **offered war** that is one of the two slots for its `originSystem`.

Normal play at inventory-time 100 systems: ≤200 mining + ≤200 trade + ≤200 hunt + ≤200 passenger + ≤200 explore + ≤200 war + 4 unique + ≤16 overlays ≤ 1220. Restore must not delete honest offered rows to “make room.”

### 1.3 Job id grammar (implementable)

Live `SAFE_ID` rejects hyphens. Every live job id **contains** hyphens. **Do not** run `SAFE_ID.test` on the full `job.id`.

**Token class** (same characters as `SAFE_ID`, one segment):

```
JOB_ID_TOKEN = /^[a-z0-9_]+$/i     // save.js SAFE_ID body, one hyphen-separated token
```

**Full id:**

1. Type string. Length 1…`ID_MAX` 64 (`save.js` 103).
2. No leading / trailing / doubled `-`. Split on `'-'`. Every token matches `JOB_ID_TOKEN` and is non-empty.
3. Full id is **not** in `RESERVED_IDS`. Every token, compared with `toLowerCase()`, is **not** in `RESERVED_IDS`. Drops `__proto__`, `war-__proto__-0`, `constructor`, `bounty-prototype`.
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
| **War (this serial)** | Exactly three tokens: `war`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `sysId` not reserved. `originSystem` must equal `sysId`. |
| Pirate overlay | Prefix `bounty-pirate-` plus ≥1 further token. This serial does not retcon overlay ids. |
| Recovery overlay | Prefix `recovery-` plus ≥1 further token. |

Examples that **must keep**: `bounty-ace`, `patrol-lane`, `mine-freehold-0`, `hunt-freehold-0`, `passenger-freehold-0`, `explore-freehold-0`, `war-freehold-0`, `war-fh_hearth-1`.  
Examples that **must drop**: `__proto__`, `war-__proto__-0`, `war-freehold`, `war-notasystem-0`. Do **not** rewrite unique ids to underscores.

War allocator: monotonic `n` per process (or scan max like `nextHuntId`, `station.js` 2238–2256). Collision → increment `n`. System token is a `SYSTEMS` key (underscores allowed: `fh_hearth`). Hyphens only as separators, never inside the system key.

Do **not** copy `pirateBountyId(name)` for war ids.

### 1.4 Per-job allowlist

Keep a job only if **all** hold. Extend live `JOB_KINDS` with `'war'`. Do not remove existing kinds.

`recordId` is already on `JOB_FIELD_ALLOW` (`save.js` 150). War uses it. Other kinds: unchanged. Do not reuse `wreckId` for patrols. **Do not add `faction` to the allowlist.**

| Field | Rule |
|---|---|
| `id` | §1.3 grammar for that `kind`. **Not** whole-string `SAFE_ID.test` |
| `kind` | live kinds **plus `'war'`** |
| `state` | one of `offered` \| `accepted` \| `done` \| `failed` |
| `title`, `detail` | string; `stripControlChars`; cap 240 / 720; empty → drop job |
| `reward`, `need`, `progress` | finite number; `need` ≥ 1; `progress` ≥ 0; clamp `progress` ≤ `need`. **War:** `need` must be integer **1**. Else drop the war job (do not heal a stuffed 0-need) |
| `originSystem`, `destSystem`, `system` | if present: `Object.hasOwn(SYSTEMS, id)` else drop field or drop job if required for kind |
| `payQuoted`, `originPrice` | if present: finite ≥ 0 integer after `Math.round`; **clamp `0…PAY_QUOTED_MAX`**. `PAY_QUOTED_MAX = 20000` (live) |
| `target` | string; `stripControlChars`; `NAME_MAX` 40; war **requires** a non-empty target (post-time name snapshot). Pay **ignores** stuffed target and uses live `record.name` |
| `recordId` | hunt or war; hyphen-token; must match `/^rec-(0|[1-9][0-9]*)$/`; length ≤ `ID_MAX`; not reserved. Else drop the war job |
| `wreckId` | recovery only |
| `collected` | recovery only |
| `commodity` | mining/trade unchanged. War: **forbidden** — if present, drop the field (do not copy). War is not cargo. No data cargo grant |
| `deadline` | if present: finite `world.time` units ≥ 0; if non-finite, drop the field. War **requires** finite `deadline` |
| `slot` | mining, trade, hunt, passenger, explore, or war: integer `0` or `1`; else drop that family job |
| `faction` | **Forbidden.** Unknown keys drop. Do not copy |

Unknown keys: drop (do not copy). Prototype keys: drop.

**War-required fields:** `originSystem`, `destSystem`, `slot`, `deadline`, `recordId`, `target`. `originSystem` must equal id token `sysId`. `destSystem` must be a `SYSTEMS` key and **≠** `originSystem`. Pay **rebinds** dest via §3.3 `warDestId(origin)` and **ignores** stuffed dest for standing and quarry faction. If stuffed dest is not a `SYSTEMS` key, drop the war job.

**Record bind at sanitize (Witness-safe, no station import):**

- If `ctx.world.recordBanks` is an object: walk `Object.keys(recordBanks)` with index `for`. Skip reserved keys / `__proto__`. Use `Object.hasOwn`. Never `for…in`.
- Look up the record in `recordBanks[origin]` **or** `recordBanks[dest]` (dest = sanitized `job.destSystem`). Drop the war job unless some record has `id === recordId` AND `role === 'patrol'` AND `role !== 'ace'` AND `classKey !== 'ace'` AND (`system === origin` OR `system === dest`).
- If **both** origin and dest banks are **missing** (unvisited dest and somehow missing origin): keep the grammar-valid war job. Pay **fails closed** if the record is still missing or ineligible at claim. `syncWarJobs` pulls stuffed offered ghosts once a bank exists (§2.2). Extra war beyond two slots per origin still drops in cap heal (§1.2).
- Do not walk `ctx.world.records` as a substitute unless it is the same array as a bank.
- Do **not** call `ensureBank` from sanitize.

### 1.5 Clock

`world.time` already heals to `0` (`save.js` 862). Deadline compares use that clock, never `ctx.elapsed`.

A hand-edited future `world.time` may expire accepted war jobs — fail closed, then replace. Same cheat class as editing credits. Do not add a second clock.

---

## 2. Board slot (war family)

### 2.1 What a slot is

For war only:

- Each system may have **two** war jobs (`slot` 0 and 1) in `world.jobs` whose `originSystem === that system` and `kind === 'war'`.
- States in a slot: `offered` or `accepted`. `failed`/`done` are transient: splice in the same function that posted the replacement.
- The Jobs board **shows** offered war when `ctx.world.currentSystem === originSystem`. Accepted war cards also show on other docks as a reminder (state line names the quarry from live record and the dest station from rebound dest). Same pattern as mining (`boardJobs` `station.js` 2672–2687 — add a war line).

Mining, trade, hunt, passenger, explore slots are independent. Overlay pirate rows are independent. A system may hold two of each renewable family **and** up to two overlay pirate cards.

Two war slots must **not** bind the same `recordId`.

### 2.2 Fill

`syncWarJobs(ctx, sysId)` on `renderJobs` (after `syncExploreJobs`):

- If `!Object.hasOwn(SYSTEMS, sysId)`, return.
- Dest = `warDestId(sysId)` (§3.3). If dest is null, **pull** offered war for `sysId` and **do not fill**.
- **Pull** offered war rows for `sysId` whose `recordId` is missing or ineligible in origin **or** dest bank when that bank exists (overlay offered-dead pull, `station.js` 1789–1797). Do **not** pull `accepted` rows here (accepted uses expire / fail-closed tick). Reverse index walk; splice; then fill.
- Count war jobs with `originSystem === sysId` and state `offered|accepted`.
- Eligible quarry (§3.4): live patrol in the origin bank **or** (if dest bank already exists) dest bank.
- While count < `WAR_SLOTS_PER_SYSTEM`, pick the next eligible quarry not already bound to an offered/accepted war `recordId`, and push a new offered war job for `sysId`.
- If no eligible quarry remains, **stop**. Do not invent a fake patrol. Do not call `ensureBank` for dest. Do not fabricate incidents (Witness Rule).
- Do **not** reshuffle existing offered cards on each render.
- Do **not** fill other family slots with war, or war slots with overlay `kind: 'bounty'` / `kind: 'hunt'` / unique `'patrol'`.
- Stuffed offered wars with fake `recordId` must not occupy a slot once a relevant bank exists.

### 2.3 One-in-one-out

On war complete **or** war expire:

1. Note `originSystem` and `slot`.
2. Pay or not (complete pays; expire does not).
3. `splice` that element.
4. Immediately `push` a new offered war job for the same system and slot **if** an eligible quarry exists (else leave the slot empty until a later `syncWarJobs`).
5. If the overlay is open on Jobs, `render()` so the replacement is visible this interaction (`maybeRefreshJobsBoard` `station.js` 2000–2003).

Never `state = 'done'` on war (unlike today’s unique `completeJob`). Set `failed` **before** pay (mining `station.js` 2885–2886) so a crash mid-replace cannot pay twice. Unique kinds still use today’s `done`. Overlay pirates still use today’s `done`. Hunt still uses hunt replace.

### 2.4 Unique cards, overlay, hunt (not war slots)

`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` stay unique. Completing them still sets `done`.

Pirate / recovery overlays stay as today (`PIRATE_BOUNTY_CAP` 2, one recovery). Hunt/passenger/explore/mining/trade slots stay as today.

**Do not** post war against:

- `role === 'ace'` or `classKey === 'ace'`
- unique `bounty-ace` target / `ACES.illyx.name` / `ACES.hunter.name` / `NAMED_GUNS.aspirants.names` (live `state.js` 827–901)
- `role === 'pirate'` (hunt / overlay quarry)
- a record already bound to another war slot (`recordId`)
- employer-faction patrols (`rec.faction === SYSTEMS[origin].faction`)

---

## 3. War family (this vertical slice)

### 3.1 Player-facing contract

Accept at **home** dock. The card names a **rival patrol** (record name) flying the **target faction** (display name from `FACTIONS[SYSTEMS[dest].faction].name`). Dest is a **named other system** reached from live gates. Fly to dest if the quarry lives there, or fight it in origin lanes if the origin bank already hosts a dest-faction patrol. Destroy it (Witness: player-caused `destroyed` incident matching the **live record name**) so the bound record is `dead`/`captured`. The 0.5 s jobs tick pays stamped `payQuoted` **space-side** (hunt cadence: incidents are a 40-row ring and must not have to survive a dest→origin hop). It writes employer +2, **does not write target** until an owner authors the delta, dockmaster trust via `rewardJobContacts` **without** unique `completeJob` `done` and **without** overlay fence-favor (`kind !== 'bounty'`), splice, new card on the **origin** board immediately if a quarry remains.

Copy hunt **space-side claim** (`tickDeliveryJobs` hunt branch, `station.js` 2797–2855). Copy hunt **record bind + incident match**. Copy mining **replace** shape, not `completeJob`. Do **not** AND origin-dock with the witness: that is stricter than hunt or explore and fails closed when `MAX_INCIDENTS` 40 (`world.js` 813) shifts the kill out before redock. Explore’s dock claim is durable because `mystery.visited` persists; war has no such visited key and must not invent one.

No cargo. No `asteroidId`. No fronting. No data cargo grant. No clue text.

### 3.2 Fields (JSON-plain)

```
{
  id,                 // war-<sysId>-<n>
  kind: 'war',
  slot,               // 0 | 1
  originSystem,       // SYSTEMS key; home dock / employer
  destSystem,         // SYSTEMS key snapshot of rival dest; pay/UI rebind warDestId
  recordId,           // rec-<n> from makeRecord
  target,             // name snapshot at post (NAME_MAX); UI/pay rebind live record.name
  title, detail,      // authored templates, textContent; regen on render
  reward,             // PATROL_REWARD 300
  payQuoted,          // stamped on accept (jobPayFor at ORIGIN)
  need,               // 1
  progress,           // unused; keep 0
  state,              // offered | accepted
  deadline,           // world.time seconds when the card fails
}
```

No `asteroidId`. No THREE. **No `faction` field.** Employer at pay time is `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, faction)`. Target at pay time is `SYSTEMS[warDestId(origin)].faction` with `Object.hasOwn(FACTIONS, faction)` — **write skipped until owner** (§5). A save must not retarget reputation by stuffing `job.faction` or `job.destSystem`.

### 3.3 Dest and target-faction bind (allowlisted; not `job.faction`)

Live trade/passenger dest is `otherSystemId` = `SYSTEMS[id].gates[0].to` (`station.js` 1718–1721). That neighbor can share a faction. War **must** be faction-against-faction, so dest is the **first rival gate**:

```
warDestId(origin):
  if !Object.hasOwn(SYSTEMS, origin): return null
  employer = SYSTEMS[origin].faction
  if typeof employer !== 'string' || !Object.hasOwn(FACTIONS, employer): return null
  gates = SYSTEMS[origin].gates
  if !Array.isArray(gates): return null
  for i in 0 .. gates.length-1:          // index for; Object.hasOwn on the row
    to = gates[i] && gates[i].to
    if typeof to !== 'string': continue
    if reservedId(to): continue
    if !Object.hasOwn(SYSTEMS, to): continue
    if to === origin: continue
    target = SYSTEMS[to].faction
    if typeof target !== 'string': continue
    if !Object.hasOwn(FACTIONS, target): continue
    if target === employer: continue
    return to
  return null
```

**Target faction** = `SYSTEMS[warDestId(origin)].faction` after those gates. That is a live table field. It is **not** `job.faction`. It is **not** `record.faction` stuffed from save (record faction is **checked** against this rebound key at eligibility/pay). It is **not** `reputation[userString]`.

If `warDestId` returns null, **do not post**. Empty slots are legal.

`independent` is a `FACTIONS` key (`state.js` 554): legal target if a gate lands there and `target !== employer`. `unknowables` has no `SYSTEMS` dock: `warDestId` cannot return it.

Stamp `destSystem` at post from `warDestId`. Tick/UI/pay **rebind** `warDestId(origin)` every time. Stuffed dest cannot retarget standing or quarry faction.

### 3.4 Eligible quarry

A record is eligible when **all** hold:

1. `role === 'patrol'`
2. `classKey !== 'ace'` and `role !== 'ace'`
3. `typeof faction === 'string'` and `faction === SYSTEMS[dest].faction` (dest = `warDestId(origin)` at post/pay) and `Object.hasOwn(FACTIONS, faction)` and `faction !== SYSTEMS[origin].faction`
4. `system === origin` **or** `system === dest`
5. If `system === dest`: dest bank must **already exist** in `recordBanks` (do not generate it from Jobs)
6. `state !== 'dead'` and `state !== 'captured'` at **post** time
7. `typeof id === 'string'` and id matches `/^rec-(0|[1-9][0-9]*)$/` and is not reserved
8. `typeof name === 'string'` after `stripControlChars` / trim / `NAME_MAX`; non-empty
9. Name is **not** `ACES.hunter.name`, `ACES.illyx.name`, or any `NAMED_GUNS.aspirants.names` (`state.js` 827–901)
10. Not already bound to an offered/accepted war `recordId`

**Skip:** pirates (hunt), traders, miners, aces, Q-ships, collectors, Named Guns, employer-flag patrols.

Q-ships stay `role: 'pirate'` (`world.js` 362–371): **ineligible**.

Old Callow is a pirate: **ineligible**.

**Skip post** when `warDestId` is null or no eligible quarry is in an **existing** bank. Do not spawn patrols from Jobs. Do not write incidents.

Origin-bank dest-faction patrols exist when `cast.patrols >= 2` (authored Freehold 2, Veridian 3). Dest-bank dest-faction patrols exist when dest `cast.patrols >= 1` **and** the player already visited dest (bank present). Redmarch (`patrols: 1`) has no origin rival patrol; Verge/Hush have none. Empty slots are legal.

### 3.5 Need / pay / rep (cite; do not invent)

| Number | Value | Status |
|---|---|---|
| `need` | **1** | hunt/passenger/explore `need: 1` (`save.js` 132–134; overlay/ace `station.js` 1742, 1824) |
| Base UU | live `PATROL_REWARD` **300** | `station.js` 169. Unique patrol still pays unstamped `jobPay(current, 300)`. War stamps **origin** `jobPayFor`. Do not copy `PATROL_REP` 5 |
| `payQuoted` | `clampJobPay(jobPayFor(ctx, originSystem, PATROL_REWARD))` | cite `jobPayFor` 2695–2698; mining origin stamp 3496 |
| Clamp | `PAY_QUOTED_MAX` 20000 | cite `station.js` 204; `save.js` 130 |
| Reputation employer | **`+2`** to `SYSTEMS[originSystem].faction` if `Object.hasOwn(FACTIONS, faction)` | cite `MINING_REP` 194, mining write 2893–2895 |
| Reputation target | **fail closed (no write)** until owner | wishlist down; `RepStandingDesign.md` §7 proposed. Candidate magnitude 2 is **not** shippable |
| Trust/favor | reuse `rewardJobContacts` dockmaster path | cite 2733–2743. War `kind !== 'bounty'` so **no** fence favor. Do not mark unique `done` |
| Deadline length | `MINING_DEADLINE` / `WRECK_TTL` **600** world seconds from **accept** (offered cards: from post time) | cite `station.js` 196; `world.js` 811 |
| Offered lifetime | same 600 s from post; expire → fail closed → replace | keeps the board moving if ignored |

Do not author new UU tables in `state.js`. Do not change unique/overlay/hunt stamp code. Do not invent a war bounty on patrol records.

### 3.6 Tick / expire / quarry bind / claim

Cadence: ride `tickDeliveryJobs` (0.5 s, `station.js` 4511–4512) **and** a cheap expire scan there (not only while docked). Reverse walk so splice does not skip.

**Quarry resolve (pay and UI):**

```
origin = job.id token sysId
         require Object.hasOwn(SYSTEMS, origin) && origin === job.originSystem after sanitize
dest   = warDestId(origin)     // ignore stuffed job.destSystem for BIND
if !dest: fail closed (no pay)
bank   = recordBanks[origin] or recordBanks[dest] or (currentSystem===origin ? records : null)
rec    = bank record whose id === job.recordId
if !rec || rec.role !== 'patrol' || rec.role === 'ace' || rec.classKey === 'ace': fail closed
if rec.system !== origin && rec.system !== dest: fail closed
if rec.faction !== SYSTEMS[dest].faction: fail closed
name   = rec.name   // ignore stuffed job.target for MATCH
```

**Complete** (accepted; **space-side**; hunt witness):

```
if (!rec) continue
incident = (ctx.world.incidents || []).some(
  (i) => i.kind === 'destroyed' && i.name === rec.name && i.causer === 'player'
)
if (!incident) continue
if (rec.state !== 'dead' && rec.state !== 'captured') continue
job.state = 'failed'                       // before pay — mining 2885–2886
pay = clampJobPay(job.payQuoted) if finite else 0   // no live reprice; missing quote → fail closed 0 + still replace
if pay > 0: credits += pay
employer = SYSTEMS[origin].faction
if Object.hasOwn(FACTIONS, employer): reputation[employer] += MINING_REP   // +2
// TARGET WRITE: skip until owner authors a finite delta. Do not index reputation[target] yet.
rewardJobContacts
commLine via textContent path
splice + replace (§2.3)
```

**Do not** pay from stuffed `job.target`. **Do not** pay from stuffed `job.destSystem`. **Do not** require dest dock or origin dock at pay (space-side: dock is not the gate; the **bind** is origin/dest record + player incident). **Do not** use `ctx.elapsed`. **Do not** match `incident.faction` as the standing key (incidents have no record id; stuffed/old faction strings are not allowlisted). **Do not** complete from `npcDestroyed` frame events alone (unique patrol does; war requires persisted incident + record state). **Do not** trust stuffed `job.progress` as a claim flag (recompute witness every tick; keep progress 0).

Render / state-line quarry **name** also comes from `rec.name` when found, else stripped `job.target` (board only; never pay on the fallback alone). Faction display names come from `factionDisplayName` / `FACTIONS[key].name` after `Object.hasOwn`.

**Single payout vs hunt/overlay:** war quarry is patrol, not pirate. Do not add overlay skip. Do not let one destroy pay both a hunt card and a war card (different roles). Two war slots: **one** `recordId` per kill; duplicate record extra-drop in sanitize.

**Expire** (`world.time >= deadline` and state offered or accepted):

- no pay
- no rep / no favor
- commLine: contract lapsed (accepted) or posting withdrawn (offered)
- splice + replace (or empty slot)

**Silent complete is forbidden.** A tampered `deadline` in the past on restore expires on the next tick, fail closed.

**Offered quarry gone:** if offered war’s record is `dead`/`captured` or missing once a bank exists, **fail closed replace** on the same tick (no pay). Do not leave a ghost card. Do not convert offered→accepted.

**Accepted quarry gone without player incident:** fail closed replace (world kill, not the player’s claim). Hunt accepted must not pay on `causer !== 'player'`; war same.

### 3.7 Accept

Offered war is **home-only**. `acceptJob` must refuse (no state flip, no stamp, notice) when:

- `job.kind === 'war'` and `ctx.world.currentSystem !== job.originSystem`
- origin not a `SYSTEMS` key
- `warDestId(origin)` null
- resolved record ineligible (§3.4) or missing
- `state !== 'offered'`

Do not retarget `originSystem` from `currentSystem` (unique haul does; war must not). Do not retarget `destSystem` from stuffed save; refresh dest from `warDestId` on accept.

Stamp:

- `payQuoted` with **origin** `jobPayFor(PATROL_REWARD)` + `clampJobPay`; else refuse
- `deadline = world.time + 600` (restart)
- `target = rec.name` refresh from live record (display snapshot)
- `destSystem = warDestId(origin)`
- `recordId` already set at post; **do not** retarget from a different patrol
- do **not** copy `currentSystem` onto `originSystem`
- do **not** write `job.faction`

`boardJobs` hides offered war unless `originSystem === sysId`. Hide **and** refuse: a missed filter must not accept a foreign card.

Digit accept stays index-into-`boardJobs` (live 4428–4431) but mutates the **job object by identity**. Replacement must not reuse the spliced object. Do not accept `done`/`failed`.

---

## 4. Id and XSS

- Allocate war ids per §1.3 (`war-<SYSTEMS key>-<n>`). Confirm `Object.hasOwn(SYSTEMS, sysId)` first. Collision → increment `n`. Never `jobs[id] =` as a map. Never `SAFE_ID.test` the full id.
- `title` / `detail` / commLine / notices: `h(..., text)` / `textContent` / `emit('commLine', { text })`. Interpolate live `rec.name` after `stripControlChars` / trim / `NAME_MAX`, `factionDisplayName(employer|target)`, and `SYSTEMS[origin|dest].station.name` from allowlisted keys, not save title strings, when regenerating. Restored title/detail already stripped. Empty name → do not print the raw `recordId`; print a template like `the marked patrol`.
- `pirateBountyId(name)` stays pre-existing; do not copy for war.
- No `innerHTML`. No HUD glance row. No new Digit.
- Do not print `recordId`, mystery `clueFound` ids, unpublished landmark ids, or `job.faction` on the Jobs card.
- Do not print clue text. Do not grant `dataCrystal` / `dataCube`.

---

## 5. Faction attribution (REP-04 adjacency)

First-slice war is **overt legal work** for the posting dock **against** a rebound dest faction:

- On success: employer = `SYSTEMS[originSystem].faction` only (live table, not a job field). Write **+2**.
- On success: target = `SYSTEMS[warDestId(origin)].faction` (live table). **Do not write** until the owner authors a finite delta. Candidate magnitude 2 is a note, not impl.
- On expire: no write.
- Use `Object.hasOwn(FACTIONS, faction)` before indexing `world.reputation`. Fresh bag entry only for known keys. Never `reputation[userString]`. `sanitizeReputation` already drops non-`FACTIONS` keys (`save.js` 672–691).
- Do **not** fix patrol’s hardcoded `freehold` in the war PRs unless a named serial owner takes it.
- Do **not** invent a kill-attribution path (`npcDestroyed` → victim faction). That is the REP-04 sibling. Board complete uses Witness Rule incidents + record state (hunt space-side).

Victim-faction piracy (player as pirate) is REP-04 and **forbidden** as a universal crime score (`docs/RepStandingDesign.md` §7). War-as-employer-contract does not invent that score.

Espionage later: successful secret → no target loss (wishlist REP-04). **Sibling Wave 79.** Police restitution (REP-03) is out of MSN.

NPC patrol hostility floor `HOSTILE_STANDING = -10` (`npc.js` 87) is live. Do not retune it. A future owner target-down write may later push dest standing through that floor; not this serial.

---

## 6. Events and milestones

- No new type in `ctx.js` EVENTS comment.
- Optional first-complete milestone id omitted in first impl (less persist surface).
- Witness Rule: war does not fabricate incidents, wrecks, or patrols. Completions require a recorded player-caused `destroyed` incident plus record `dead`/`captured`. No origin-dock AND (incident ring is not a durable visit key).

---

## 7. Closed neighbours

| Topic | Law |
|---|---|
| Mining MSN | Keep slots, kind, cap share, `boardJobs` mining filter. Grow cap by `WAR_ROOM` only. Never drop honest mining |
| Trade MSN | Keep slots, kind, Wave 76 dest bind. Never drop honest trade |
| Hunt MSN | Keep pirate record bind. Never post war against pirates. Never drop honest hunt |
| Passenger / explore | Keep slots. Never drop honest passenger/explore. No numbers invented here |
| Overlay pirates | Keep cap 2, ids, `completeJob`. No war overlay skip (different quarry) |
| Unique ace / Named Guns | Untouched. Not a war quarry. Not renewable |
| Unique patrol | Untouched. Still pirate sweep + `freehold += 5` |
| EXP data | No `dataCrystal` / `dataCube` on jobs. Do not print mystery clue ids |
| POD | No survivor commodity on jobs. No People-desk change |
| BIO | No `livingRock`. Feed Digit unchanged |
| SHP | Digit 0 untouched. No hull/loadout as mission reward |
| HUD-02 | No chart identity work |
| TGT-05 | Do not steal `ctx.targets` |
| REP | Employer +2. Target fail-closed. No freehold copy. No kill UU |
| AST | No `asteroidId` |
| Unique haul/ferry | Untouched ids, stamps, Wave 35 dest bind |
| NPC | AI modes unchanged. Pirates never migrate. Patrol loiter unchanged |
| Espionage | Sibling worker. **No numbers** in this contract |
| MSN-03 | Later authored chains. Out |

---

## 8. Serial PR plan (implementation wave, **not** Wave 79)

Named only. Do **not** implement in this wave.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize kind+cap** | `'war'` on `JOB_KINDS`; id grammar `war-<sys>-<n>`; `recordId`/dest/slot/need/deadline; cap `live_cap_at_impl + WAR_ROOM`; proto drop; unique four **kept**; honest mining/trade/hunt/passenger/explore **kept** | Sync/UI/pay; whole-string `SAFE_ID` on job.id; unique migration; espionage room; target-rep write |
| **PR2 cards/sync** | `syncWarJobs` up to 2 slots; render/accept origin-only; origin `payQuoted` from `PATROL_REWARD`; dest rebound `warDestId`; record bind | Expire, one-in-one-out, other families |
| **PR3 complete/expire/replace** | space-side witness; splice + immediate replace; deadline 600 s fail closed; no `DONE` war; empty slot if no quarry; employer +2; **no target write** | Unique-card migration; overlay retirement; hunt reopen; kill UU; origin-dock AND |
| **PR4 Digit 2 UI** | state + remaining time + quarry **name** + dest/employer display names; `textContent` only; Digit 2 only; no `rec-` ids; no `job.faction` | HUD-02, innerHTML, Digit remap, clue text |
| **PR5 boot pins** | drop `war-__proto__-0`; keep unique four + `mine-freehold-0` + `trade-freehold-0` + `hunt-freehold-0` + `passenger-freehold-0` + `explore-freehold-0` + `war-freehold-0`; families +4 unique fit `live+WAR_ROOM`; complete→replace; expire no pay; stuffed `target` ignored; stuffed `destSystem` ignored at bind; stuffed `job.faction` not copied; ace `recordId` drops; overlay still posts cap 2; `bounty-ace` untouched; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS edits; target delta; espionage |

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave. Do not treat WAVE4 / WAVE26 / WAVE35 known FAILs as war bugs.

---

## 9. Later families (named, not specified)

Do **not** fill numbers.

1. Espionage — sibling Wave 79; **not this contract**.
2. Target-faction standing delta — owner-authored; candidate 2; fail closed until then.
3. Kill attribution — REP-04 sibling; **not this contract**.
4. Faction-level pirate as renewable — **forbidden** here; keep unique ace + Named Guns.
5. Later serial may retire overlay DONE leak independently.
6. **MSN-03** authored chains for rare equipment — after the ordinary pool is renewable.

---

## 10. Non-goals (locked)

- No `src/` in Wave 79 for this family.
- No HUD-02. No AST rock UUIDs. No POD reopen. No SHP grants. No BIO graft. No EXP SKU. No TGT.
- No new `localStorage` key. No `world.missions` parallel array.
- No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows. No NPC missiles. No power ledger.
- No MSN-03. No espionage numbers. No `asteroidId`. No new `WORLD_FIELDS`.
- No kill UU. No police restitution. No crime score.
- Do not edit the wishlist or `PROGRESS.md` in this wave.
- Do not schedule or land implementation PRs in Wave 79.
- Do not edit sibling briefs from this worker.
- Do not replace overlay pirate rows or hunt slots with war slots.
- Do not post renewable war against Named Guns.

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | `station.js` (or a later `jobs.js` owned by the serial). `save.js` sanitize on restore | station UI + ticks |
| Unique four ids | `makeJobs` only when empty | boot tests |
| Mining/trade/hunt/passenger/explore slots | existing sync/replace (unchanged) | board |
| War slots | `syncWarJobs` / replace | board |
| Overlay pirates | `syncPirateBounties` (unchanged) | board |
| `ctx.world.reputation` | war complete: employer key only (target skipped) | epics, standing, npc |
| `ctx.world.records` / banks | world.js / traffic; war **reads** | war bind |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |
| `ctx.targets` | TGT / controls only | not jobs |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (already run docked or not, 4508–4512).

---

## 12. Owner defaults (stand unless overridden)

These defaults **stand**. They do not block impl. No open owner question is required to start PR1.

1. `kind = 'war'`. Ids `war-<sysId>-<n>`.
2. `WAR_SLOTS_PER_SYSTEM = 2`. Digit 1–9 overflow is existing UX (mouse Accept). Do not cut to one slot for Digit reasons. Empty slots are legal when quarries < 2.
3. Deadline = 600 s, restart on accept (same as mining/trade/hunt/passenger/explore).
4. `need = 1`. Pay uses live `PATROL_REWARD` 300 at **origin** `jobPayFor`.
5. Bind `recordId` = live `rec-<n>`. UI prints `record.name`, never `recordId`.
6. Dest = `warDestId` (first rival gate). Target faction = `SYSTEMS[dest].faction`. No `job.faction`.
7. Space-side claim (hunt cadence). Dest dock does **not** pay. Do not AND origin-dock with the witness.
8. Overlay and hunt stay. Named Guns stay unique. Unique patrol stays.
9. Rep **+2** employer faction (`MINING_REP`). Target write **fail closed** until owner. Candidate 2 is not shippable.
10. Show offered war at home only; accepted war on every Jobs board.
11. Do not migrate unique four / overlay / other families in this serial.
12. Cap `live_cap_at_impl + WAR_ROOM`. Never drop honest offered mining, trade, hunt, passenger, explore, or war. Do not include espionage room.
13. No war milestone in first impl.
14. Job ids: hyphen-token grammar (§1.3). Do **not** whole-string `SAFE_ID`.
15. Do not post against Named Guns / `bounty-ace` / pirates / `role === 'ace'`.
16. Do not call `ensureBank` from Jobs.

---

## 13. Verification pins (for a later read-only verifier)

Exact files:

- `docs/Msn02FactionWarDesign.md` vs this file vs `out/w79/faction-war/current-war-inventory.md`
- Live: `src/systems/station.js` `makeJobs` / `ensureJobs` / `completeJob` / `boardJobs` / `tickDeliveryJobs` / `tickPatrolJob` / `renderJobs` / `acceptJob` / `syncPirateBounties` / `syncHuntJobs` / `jobPayFor` / `PIRATE_BOUNTY_CAP` / `MINING_REP` / `PATROL_REWARD` / `h`
- `src/game/save.js` `WORLD_FIELDS` `'jobs'`, live cap `4+10*N+16`, `sanitizeJobs`, `JOB_KINDS`
- `src/game/state.js` `ACES` / `NAMED_GUNS` / `SYSTEMS` / `FACTIONS` (READ-ONLY)
- `src/game/world.js` `makeRecord` id; patrol seed; incidents; `WRECK_TTL`; pirates never migrate
- `src/systems/npc.js` AI modes unchanged; `HOSTILE_STANDING` untouched
- `src/core/ctx.js` no jobs default, no job events
- Unique four named in `makeJobs`
- Sibling `out/w79/espionage` and `out/w79/rep04` **not** merged into this cap formula or kill UU
