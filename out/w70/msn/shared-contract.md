# MSN renewable missions shared contract

**Wave:** 70. Design only. No mission code ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/MsnMissionsDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md` or `PROGRESS.md`.  
**Locked sources:** wishlist Initiative MSN (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 442–484); REP-04 intent 430–438 (do not write the REP brief); AST non-goal (`docs/AstOrbitsDesign.md` §9); POD-02 / SHP closed; inventory `out/w70/msn/current-mission-inventory.md` (code wins over stale comments).

Integrator rule: a later implementation wave obeys this file.

---

## 0. Law in one page

1. Wave 70 is markdown only. Implementation is a later **serial** wave.
2. **Extend** `ctx.world.jobs`. Do **not** add a second persist key. Prefer sanitize-on-restore over a new `WORLD_FIELDS` name.
3. Autosave stays `rimward-save-v1`. No new `localStorage` key.
4. First vertical slice is **mining contracts** (`kind: 'mining'`). Other MSN-02 families are later serials. Do not invent their numbers in this wave.
5. MSN-03 authored faction reward chains are **later than** the renewable board. Name as a serial after mining slots work. Not this first impl. No ship grants.
6. A **board slot** (first impl) is one offered-or-accepted `kind === 'mining'` job posted at a system. Count: **`MINING_SLOTS_PER_SYSTEM = 2` (proposed, needs owner)** — same count as live `PIRATE_BOUNTY_CAP` (`station.js` 167).
7. **One-in-one-out:** complete or fail a mining job → splice it → immediately post a new mining job for the **same** `originSystem`. Never leave a `DONE` mining card.
8. Deadlines are **generous**. Expire **fails closed**: no credits, no reputation, no favor, no silent complete. Then replace (rule 7).
9. Mining destinations are **system + commodity**, never `asteroidId`. AST `id === index` is not a UUID.
10. World strings: `textContent` / existing `h()` / `'commLine'`. No `innerHTML`.
11. Job ids fail closed with a **hyphen-token** grammar (not whole-string `SAFE_ID`). Live unique ids use hyphens (`bounty-ace`, …). `SAFE_ID` (`/^[a-z0-9_]+$/i`, `save.js` 100) is the token class. Drop `RESERVED_IDS` on the full id **and** every token (`__proto__`, `constructor`, `prototype`, …). Mining: `mine-<SYSTEMS key>-<n>`. Never derive mining ids from NPC names. Never call `SAFE_ID.test(job.id)` on the full string.
12. `state.js` is READ-ONLY for feature workers unless a named serial data owner. Mining constants live in `station.js` (or a tiny `jobs.js`) as locals, citing live `HAUL_*` / `ORE_TYPES` / `WRECK_TTL`.
13. No new frozen event in `ctx.js`. Completions keep `'commLine'`. Do not add `'jobCompleted'`.
14. POD rescue/sale stays closed. Ferry remains Provisions. Do not put survivors on the board.
15. SHP stays closed. Jobs never grant hulls or sit in Digit 0.
16. HUD-02 stays closed. No new chart marks for contracts.
17. Espionage / faction-vs-faction **depend on a later REP brief**. Do not invent police restitution or secret-intel numbers here.
18. Unique `makeJobs` ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`) stay until a later serial migrates them. First impl must not rename them (boot-test pins).

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'jobs'` (`save.js` 77). Keep it.

Restore today assigns the array wholesale (`save.js` 445–451) with **no heal**. First impl **must** add `sanitizeJobs(ctx)` from `sanitizeRestored` (same call site as `sanitizeFieldOre`).

### 1.2 Array heal

- If `world.jobs` is missing, not an array, or empty after drop → leave `[]` and let `ensureJobs` rebuild the **four unique** cards (today’s path, `station.js` 1476–1478).
- Walk with `Object.keys` / index `for`, never `for…in`.
- Fresh `[]`. Push fresh `{}` literals only. Never `Object.assign` a raw save object onto a live job.

**Cap (fits the frozen board, cited live galaxy):**

```
N_SYSTEMS            = Object.keys(SYSTEMS).length
                     // inventory-time 100: 6 authored + 94 generated
                     // state.js 500–504, 537–541; galaxy.generated.js header
MINING_ROOM          = MINING_SLOTS_PER_SYSTEM * N_SYSTEMS   // 2 * 100 = 200
OVERLAY_HEADROOM     = 16   // PIRATE_BOUNTY_CAP 2 + 1 recovery + in-flight spare
JOBS_SANITIZE_MAX    = 4 + MINING_ROOM + OVERLAY_HEADROOM
                     // inventory-time 4 + 200 + 16 = 220
```

64 cannot hold two mining slots per system. Do **not** use 64.

Drop overflow in this order until `length ≤ JOBS_SANITIZE_MAX`:

1. Invalid rows (fail §1.3–1.4).
2. Extra mining on a system that already has two valid `offered|accepted` mining jobs (keep lowest `slot`, then lowest `n` in the id). Duplicate/tamper, not a honest slot.
3. `done`/`failed` mining (should not exist if replace ran).
4. `done` pirate / `done` recovery.
5. Tamper-only last resort: if still over cap, drop **offered pirate/recovery** whose `system`/`originSystem` ≠ `currentSystem`. Honest play never needs this.

**Never drop** (if the row still sanitizes):

- The four unique ids (`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`), any state.
- Any `accepted` job.
- Any **offered mining** that is one of the two slots for its `originSystem`.

Normal play: ≤200 mining + 4 unique + ≤16 overlays ≤ 220. Restore must not delete offered mining to “make room.”

### 1.3 Job id grammar (implementable)

Live `SAFE_ID` rejects hyphens. Every live job id **contains** hyphens (`bounty-ace`, `bounty-pirate-…`, `recovery-aft-…`). **Do not** run `SAFE_ID.test` on the full `job.id`.

**Token class** (same characters as `SAFE_ID`, one segment):

```
JOB_ID_TOKEN = /^[a-z0-9_]+$/i     // save.js SAFE_ID body, one hyphen-separated token
```

**Full id:**

1. Type string. Length 1…`ID_MAX` 64 (`save.js` 102).
2. No leading / trailing / doubled `-`. Split on `'-'`. Every token matches `JOB_ID_TOKEN` and is non-empty.
3. Full id is **not** in `RESERVED_IDS`. Every token, compared with `toLowerCase()`, is **not** in `RESERVED_IDS`. Drops `__proto__`, `mine-__proto__-0`, `constructor`, `bounty-prototype`.
4. Never use the id as an object key (`jobs[id] =`). Array of objects only.

**Kind-specific (after tokens pass):**

| Kind | Id rule |
|---|---|
| Unique four | **Exact** `bounty-ace` \| `patrol-lane` \| `haul-provisions` \| `ferry-consignment`. Boot-test pins. |
| Mining | Exactly three tokens: `mine`, `sysId`, `n`. `Object.hasOwn(SYSTEMS, sysId)`. `n` matches `/^(0|[1-9][0-9]*)$/`. `sysId` not reserved. `originSystem` must equal `sysId`. |
| Pirate overlay | Prefix `bounty-pirate-` plus ≥1 further token (live `pirateBountyId`, `station.js` 1494–1495). First impl does not retcon. Empty tokens after name-fold → drop. |
| Recovery overlay | Prefix `recovery-` plus ≥1 further token (live `` `recovery-${a.id}` ``, wreck `aft-<time>-<rand>`). |

Examples that **must keep**: `bounty-ace`, `haul-provisions`, `mine-freehold-0`, `mine-fh_hearth-12`.  
Examples that **must drop**: `__proto__`, `mine-__proto__-0`, `mine-freehold`, `mine-notasystem-0`, `bountyace` (unique four are exact, no underscore rewrite).

Mining allocator: monotonic `n` per process (or `round(world.time)` + retry). Collision → increment `n`. System token is a `SYSTEMS` key (underscores allowed: `fh_hearth`). Hyphens only as separators, never inside the system key (live generated ids use `_`, `galaxy.generated.js`).

### 1.4 Per-job allowlist

Keep a job only if **all** hold:

| Field | Rule |
|---|---|
| `id` | §1.3 grammar for that `kind`. **Not** whole-string `SAFE_ID.test` |
| `kind` | one of `bounty` \| `patrol` \| `haul` \| `ferry` \| `recovery` \| `mining` |
| `state` | one of `offered` \| `accepted` \| `done` \| `failed` |
| `title`, `detail` | string; `stripControlChars`; cap 240 / 720; empty → drop job |
| `reward`, `need`, `progress` | finite number; `need` ≥ 1; `progress` ≥ 0; clamp `progress` ≤ `need` |
| `originSystem`, `destSystem`, `system` | if present: `Object.hasOwn(SYSTEMS, id)` else drop field or drop job if required for kind |
| `payQuoted`, `originPrice` | if present: finite ≥ 0 integer after `Math.round`; **clamp `0…PAY_QUOTED_MAX`**. `PAY_QUOTED_MAX = 20000` (**proposed, needs owner**): `wakeglass` base 1450 × `FERRY_UNITS` 4 × `HAUL_MARGIN` 1.4 × 2 epic/faction headroom ≈ 16240, rounded up. First-slice mining never rolls wakeglass; the cap is a save-tamper lid, not a design target |
| `target` | string; `stripControlChars`; `NAME_MAX` 40; bounty only |
| `wreckId` | recovery only; string; strip; cap 64; drop `RESERVED_IDS` |
| `collected` | recovery only; boolean |
| `commodity` | mining only; `Object.hasOwn(ORE_TYPES, key)` **and** `Object.hasOwn(COMMODITIES, key)` |
| `deadline` | if present: finite `world.time` units ≥ 0; if non-finite, drop the field (offered unique cards have none) |
| `slot` | mining only; integer `0` or `1` (for two slots); else drop mining job |

Unknown keys: drop (do not copy). Prototype keys: drop.

`wreckId` uses the same hyphen-token rules as job ids (do not whole-string `SAFE_ID`). Live wreck ids are `aft-<time>-<rand>` (`world.js` 1316).

### 1.5 Clock

`world.time` already heals to `0` (`save.js` 397). Deadline compares use that clock, never `ctx.elapsed`.

A hand-edited future `world.time` may expire accepted mining jobs — fail closed, then replace. Same cheat class as editing credits. Do not add a second clock.

---

## 2. Board slot (first impl)

### 2.1 What a slot is

For mining only:

- Each system may have **two** mining jobs (`slot` 0 and 1) in `world.jobs` whose `originSystem === that system`.
- States in a slot: `offered` or `accepted`. `failed`/`done` are transient: splice in the same function that posted the replacement.
- The Jobs board **shows** those cards when `ctx.world.currentSystem === originSystem` (offered **and** accepted). Accepted mining cards also show on other docks as a reminder (state line names the home dock) — **proposed UX, needs owner**. Default if owner silent: **show accepted mining everywhere; show offered mining only at home** (same pattern as pirate offered-home / recovery offered-home, `boardJobs` 1575–1584).

### 2.2 Fill

`syncMiningJobs(ctx, sysId)` on `renderJobs` (same moment as pirate/recovery sync):

- Count mining jobs with `originSystem === sysId` and state `offered|accepted`.
- While count < `MINING_SLOTS_PER_SYSTEM`, push a new offered mining job for `sysId`.
- Do **not** reshuffle existing offered cards on each render.

### 2.3 One-in-one-out

On mining complete **or** mining expire:

1. Note `originSystem` and `slot`.
2. Pay or not (complete pays; expire does not).
3. `splice` that element.
4. Immediately `push` a new offered mining job for the same system and slot.
5. If the overlay is open on Jobs, `render()` so the replacement is visible this interaction.

Never `state = 'done'` on mining (unlike today’s `completeJob`). Either call a mining-specific completer or teach `completeJob` a `replace: 'mining'` path. Unique kinds still use today’s `done`.

### 2.4 Unique cards (not slots)

`bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` stay unique. Completing them still sets `done` and they still occupy board rows. **Later serial** may migrate haul/ferry onto slots. Not first impl.

Pirate / recovery overlays stay as today (cap 2 / one wreck). Later serial may fold local pirate hunt into slots.

---

## 3. Mining family (first vertical slice)

### 3.1 Player-facing contract

Accept at home dock. Cut reachable rock in **that** system (AST work sector). Scoop ore pods. Redock at **the same station**. Deliver `need` units of the named `commodity`. Paid at stamped `payQuoted`.

Copy the haul/recovery dock-pay shape (`tickDeliveryJobs`), not a new event.

### 3.2 Fields (JSON-plain)

```
{
  id,                 // mine-<sysId>-<n>
  kind: 'mining',
  slot,               // 0 | 1
  originSystem,       // SYSTEMS key; home dock
  commodity,          // ORE_TYPES + COMMODITIES key
  title, detail,      // authored templates, textContent
  reward,             // base UU before jobPayFor; may be 0 if payQuoted is the agreement
  payQuoted,          // stamped on accept (dest = origin for mining)
  need,               // units
  progress,           // unused for delivery-style; keep 0
  state,              // offered | accepted
  deadline,           // world.time seconds when the card fails
}
```

No `asteroidId`. No THREE. No `target` name. **No `faction` field.** Employer at pay time is `SYSTEMS[originSystem].faction` with `Object.hasOwn(FACTIONS, faction)`. A save must not retarget reputation by stuffing `job.faction`.

### 3.3 Reachable commodity (AST-02 + stock ship)

First impl may only roll `commodity` where:

- `Object.hasOwn(ORE_TYPES, key)`
- `ORE_TYPES[key].hardness <= 1` (Mk I, `MINING_LASERS[0].tier` — `state.js` 63–66, 345–346)

Live keys that qualify: `rawOre`, `livingRock`.

Do not post hardness 2–4 contracts until a later serial that can gate on `ctx.world.miningLaser`. Unreachable board cards fail MSN acceptance (“resolvable targets”).

Hold units of that commodity count, **no provenance tag** (same as haul Provisions). Market fill of `rawOre` is allowed. Do not invent cargo `source` for ore in this slice.

### 3.4 Need / pay / rep (cite or mark proposed)

| Number | Value | Status |
|---|---|---|
| `need` | `FERRY_UNITS` **4** | cite `station.js` 154. Fits `cargoCapacity` 20 (`ctx.js` 108) |
| `payQuoted` | `jobPayFor(ctx, originSystem, round(need * priceOf(commodity) * HAUL_MARGIN))` | cite `HAUL_MARGIN` 1.4 (`station.js` 153) and haul stamp 2103 |
| Reputation | **`+2` to `SYSTEMS[originSystem].faction` if `Object.hasOwn(FACTIONS, faction)`** | **proposed, needs owner**. Smaller than `PATROL_REP` 5. Legal work, employer only. Do **not** write `freehold` unless that is the dock flag |
| Trust/favor | reuse `completeJob` dockmaster path | cite 1635–1641 |
| Deadline length | `WRECK_TTL` **600** world seconds from **accept** (offered cards: from post time) | cite `world.js` 811. Generous vs Mk I extract 1.2 u/s (`state.js` 65) and Freehold field ~515 u at cruise 120 (`SHIP_CLASSES.light.cruise`) |
| Offered lifetime | same 600 s from post; expire → fail closed → replace | keeps the board moving if ignored |

Do not author new UU tables in `state.js`.

### 3.5 Tick / expire

Cadence: ride `tickDeliveryJobs` (0.5 s) **and** a cheap expire scan there (not only while docked).

**Complete** (accepted, docked, `currentSystem === originSystem`, `holdUnits(commodity) >= need`):

- `removeCargo(commodity, need)`
- credits += `payQuoted ?? jobPayFor(...)`
- employer rep as §3.4
- commLine via `textContent` path
- splice + replace (§2.3)

**Expire** (`world.time >= deadline` and state offered or accepted):

- no cargo remove
- no pay
- no rep / no favor
- commLine: contract lapsed (accepted) or posting withdrawn (offered)
- splice + replace

**Silent complete is forbidden.** A tampered `deadline` in the past on restore expires on the next tick, fail closed.

Ferry-style “short hold, stay open” does **not** apply to expire. Expire always closes.

### 3.6 Accept

No cargo fronting (not ferry). Stamp `payQuoted` with **origin** `jobPayFor` (delivery is home, unlike haul). Stamp `deadline = world.time + 600` if not already set, or refresh from accept so the generous window is play time, not offer time. **Freeze:** accept **restarts** the 600 s window (offer timer only clears ignored cards).

---

## 4. Id and XSS

- Allocate mining ids per §1.3 (`mine-<SYSTEMS key>-<n>`). Confirm `Object.hasOwn(SYSTEMS, sysId)` first. Collision → increment `n`. Never `jobs[id] =` as a map. Never `SAFE_ID.test` the full id.
- Digit accept stays index-into-`boardJobs` (live 2740–2742) but mutates the **job object by identity**. Replacement must not reuse the spliced object.
- `title` / `detail` / commLine / notices: `h(..., text)` / `textContent` / `emit('commLine', { text })`. Interpolate `COMMODITIES[key].name` and `station.name` from allowlisted keys, not save strings, when regenerating. Restored title/detail already stripped.
- `pirateBountyId(name)` stays pre-existing; do not copy for mining. Sanitize keeps those hyphen ids if tokens pass §1.3.

---

## 5. Faction attribution (REP-04 adjacency)

First-slice mining is **overt legal work**:

- On success: employer = `SYSTEMS[originSystem].faction` only (live table, not a job field).
- On success: **no** target-faction write (there is no target).
- On expire: no write.
- Use `Object.hasOwn(FACTIONS, faction)` before indexing `world.reputation`. Fresh bag entry only for known keys. Never `reputation[userString]`.
- Do **not** fix patrol’s hardcoded `freehold` in the mining PRs unless a named serial owner takes it.

Espionage later: successful secret → no target loss (wishlist REP-04). **Depends on later REP brief.** Faction-vs-faction later: employer up, target down — same dependency. Police restitution (REP-03) is out of MSN.

---

## 6. Events and milestones

- No new type in `ctx.js` EVENTS comment.
- Optional first-complete milestone id `miningContract` **omitted** in first impl (less persist surface). Later serial may add it to `world.milestones` with `SAFE_ID`.
- Witness Rule: mining does not fabricate incidents or wrecks.

---

## 7. Closed neighbours

| Topic | Law |
|---|---|
| AST | No rock UUID. Work sector / field / hardness 1 is the find-aid already shipped. |
| POD | No survivor commodity on jobs. No People-desk change. |
| SHP | Digit 0 untouched. No hull/loadout as mission reward. |
| HUD-02 | No chart identity work. Existing AST group-3 cue is enough. |
| Mystery | Exploration family is later; do not wrap clues as board jobs in first impl. |

---

## 8. Serial PR plan (implementation wave, not Wave 70)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize** | `sanitizeJobs` + hyphen-token ids (§1.3) + cap `4+2*N_SYSTEMS+16`; unique four **kept** | New kinds; whole-string `SAFE_ID` on job.id |
| **PR2 mining cards** | `kind: 'mining'`, sync fill 2 slots, render/accept/tick deliver, `payQuoted`, hardness-1 commodity | Expire, one-in-one-out, other families |
| **PR3 replace + expire** | splice + immediate replace; deadline 600 s fail closed; no `DONE` mining | Unique-card migration |
| **PR4 board clarity** | state + remaining time on mining cards; `textContent` only | HUD-02, innerHTML, Digit remap |
| **PR5 boot pins** | `__proto__` / `mine-__proto__-0` dropped; `bounty-ace` + `mine-freehold-0` + `mine-fh_hearth-1` kept; 200 mining + 4 unique fit cap 220; hardness-4; complete→replace; expire no pay; no asteroidId | Wishlist / PROGRESS edits by feature workers |

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave.

---

## 9. Later families (named, not specified)

Do **not** fill numbers. Serial order after mining board law works:

1. Migrate haul/ferry onto renewable commodity slots (same one-in-one-out).
2. Local pirate hunt as slots (retire done-card leak).
3. Passenger ferry — **after** a people-cargo design that is not POD-02 sale.
4. Faction-level pirate as a renewable **or** keep unique ace + MSN-03.
5. Faction-vs-faction — **after REP brief**.
6. Espionage — **after REP brief** (secret vs attributed).
7. Exploration / information — do not steal mystery.js.
8. **MSN-03** authored chains for rare equipment — after the ordinary pool is renewable.

---

## 10. Non-goals (locked)

- No `src/` in Wave 70.
- No HUD-02. No AST rock UUIDs. No POD reopen. No SHP grants.
- No new `localStorage` key. No `world.missions` parallel array.
- No new frozen event.
- No `state.js` feature rewrite.
- Do not edit the wishlist or `PROGRESS.md` in this wave.
- Do not schedule or land implementation PRs in Wave 70.

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | `station.js` (or a later `jobs.js` owned by the serial). `save.js` sanitize on restore | station UI + ticks |
| Unique four ids | `makeJobs` only when empty | boot tests |
| Mining slots | `syncMiningJobs` / replace | board |
| `ctx.world.reputation` | mining complete: employer key only | epics, standing, npc |
| `ctx.asteroids.list` | **asteroids.js only** — jobs never write rocks | mining career in space |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |

---

## 12. Owner defaults (stand unless overridden)

1. `MINING_SLOTS_PER_SYSTEM = 2`.
2. Deadline = `WRECK_TTL` 600 s, restart on accept.
3. `need = 4`, pay uses `HAUL_MARGIN` 1.4.
4. Rep **+2** employer faction.
5. Show offered mining at home only; accepted mining on every Jobs board.
6. No `miningContract` milestone in first impl.
7. Do not migrate unique haul/ferry/ace/patrol in first impl.
8. Job ids: hyphen-token grammar (§1.3). Do **not** whole-string `SAFE_ID`.
9. `JOBS_SANITIZE_MAX = 4 + 2 * Object.keys(SYSTEMS).length + 16` (220 at 100 systems). Never drop honest offered mining.

---

## 13. Verification pins (for a later read-only verifier)

Exact files:

- `docs/MsnMissionsDesign.md` vs this file vs `out/w70/msn/current-mission-inventory.md`
- Live: `src/systems/station.js` `makeJobs` / `ensureJobs` / `completeJob` / `boardJobs` / `tickDeliveryJobs` / `renderJobs`
- `src/game/save.js` `WORLD_FIELDS` `'jobs'`, `SAFE_ID` is token-class only for jobs (hyphens on live ids), no job sanitize today
- `src/game/state.js` `SYSTEMS` merge 537–541 (6 + 94 = 100)
- `src/game/world.js` incidents/aftermath; no `world.jobs` writer
- `src/core/ctx.js` no jobs default, no job events
- `docs/AstOrbitsDesign.md` non-goal: no asteroid UUID missions
