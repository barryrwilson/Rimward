# RIMWARD MSN-02 renewable local pirate hunt

| Field | Value |
|---|---|
| **Title** | RIMWARD MSN-02 renewable local pirate hunt |
| **Author** | Wave 77 MSN-02 hunt integrator |
| **Date** | 2026-08-20 |
| **Status** | First impl Wave 78 (PR1–PR5). Design freeze stands; contract still wins. |
| **Wave** | 78 — first implementation of the Wave 77 hunt brief. |
| **Owner request** | MSN-02 hunting a local pirate as a renewable Jobs-board family. Unique-four stay; overlay pirate cap stays; no `state.js` write; no new persist key. |
| **Merge law** | [`out/w77/hunt/shared-contract.md`](../out/w77/hunt/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w77/hunt/current-hunt-inventory.md`](../out/w77/hunt/current-hunt-inventory.md) |
| Merge law | [`out/w77/hunt/shared-contract.md`](../out/w77/hunt/shared-contract.md) |
| Security review | [`out/w77/hunt/security-review.md`](../out/w77/hunt/security-review.md) |
| Design-doc review | [`out/w77/hunt/code-review.md`](../out/w77/hunt/code-review.md) |
| Wave 78 security | [`out/w78/hunt/security-review.md`](../out/w78/hunt/security-review.md) |
| Wave 78 code review | [`out/w78/hunt/code-review.md`](../out/w78/hunt/code-review.md) |
| Wave 78 UI audit | [`out/w78/hunt/ui-audit.md`](../out/w78/hunt/ui-audit.md) |

---

## Overview

Wishlist MSN-02 wants hunting a **local** pirate as a career, separate from hunting a **faction-level** pirate threat. Live today: overlay `bounty-pirate-*` cards (cap 2) and unique `bounty-ace` are not renewable. Completing them sets `DONE` and never posts a replacement. Mining and trade already occupy two renewable slots per system each.

Wave 77 freezes persist (extend `world.jobs` + raise sanitize cap by **hunt room only**), two hunt slots, one-in-one-out, record-id quarry bind, origin `payQuoted` from live `record.bounty`, 600 s fail-closed deadlines, employer-only +2, Digit 2 Jobs pane, overlay non-collision, and the serial PR plan. Unique four stay. Named Guns stay off this family. Missions other than renewable local hunt do not change here.

Do **not** migrate or delete the unique four. Do **not** invent espionage, passenger, faction-war, or exploration numbers. Espionage still depends on a later REP brief (REP-04). `src/game/state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “jobs and pirate bounties today”: [`out/w77/hunt/current-hunt-inventory.md`](../out/w77/hunt/current-hunt-inventory.md). Code wins over stale comments. Wave 70/75 inventory line numbers are stale.

| Surface | Today | Cite |
|---|---|---|
| Owner | `station.js` creates `ctx.world.jobs` if empty | `ensureJobs` 1759–1761; `initStation` 2434 |
| Unique cards | ace bounty, patrol, haul Provisions, ferry Provisions | `makeJobs` 1724–1756 |
| Mining slots | two per system, `kind: 'mining'`, one-in-one-out | `MINING_SLOTS_PER_SYSTEM` 189; `syncMiningJobs` 1919–1938 |
| Trade slots | two per system, `kind: 'trade'`, one-in-one-out | `TRADE_SLOTS_PER_SYSTEM` 190; `syncTradeJobs` ~2080–2091 |
| Overlays | pirate bounties cap 2; one recovery wreck | 1786–1856; `PIRATE_BOUNTY_CAP` 187 |
| Unique/overlay complete | `state = 'done'`; trust/favor; no splice | `completeJob` 2202–2205; overlay claim 2363–2370 |
| Mining/trade complete | `failed` first, pay, splice, replace | `tickDeliveryJobs` 2252–2347 |
| Board filter | hide foreign **offered** pirate/recovery/mining/trade; show unique `DONE` | `boardJobs` 2132–2142 |
| Overlay pay | `jobPay(current, job.reward)`; no `payQuoted`; no deadline; no employer rep | 2368–2370 |
| Mining/trade pay | `payQuoted` via **origin** `jobPayFor`; clamp 20000 | 2777, 2806; `jobPayFor` 2151–2158 |
| Patrol rep | **`reputation.freehold += PATROL_REP`** | 2233 |
| Mining/trade rep | +2 employer `SYSTEMS[origin].faction` | `MINING_REP` 191; 2288–2290 |
| Persist | `WORLD_FIELDS` `'jobs'`; autosave `rimward-save-v1` | `save.js` 65, 78 |
| Sanitize | hyphen tokens, proto drop, kind/state allowlist, cap `4+2*N+2*N+16` (**420** at 100) | `save.js` 115–127, 197–208, 407–446 |
| `JOB_KINDS` | no `'hunt'` | `save.js` 127 |
| Events | `'commLine'` only; no `job*` type | `ctx.js` 198–228 |
| UI | Digit 2; `h()` `textContent`; digit accept by index | 152, 2489–2494, 3424–3427, 3548–3550 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| Record id | `` `rec-${nextRecordNum++}` `` | `world.js` 252, 282–285 |
| Pirate seed bounty | `300 + i * 75`; overlay reads it | `world.js` 359–360 |
| Pirates migrate? | **never** | `world.js` 30 |
| Incidents | `name` + `causer`; **no record id** | `world.js` 1332–1346 |
| Named Guns | `ACES` / `NAMED_GUNS` `role: 'ace'` | `state.js` 827–901 |
| NPC “hunt” | AI **mode** for pirates, not a job kind | `npc.js` 200 |

There is no `kind: 'hunt'`. Overlay local bounties are not a career slot machine.

### Pain points

- Wishlist MSN-02 local pirate hunt: the only local bounty cards are opportunistic overlay rows. A player who finishes them sees `DONE` and no replacement (MSN-01 leak).
- Faction-level hunt already has unique `bounty-ace`. Stuffing local career into `'bounty'` would collide with Named Gun.
- Overlay cap 2 is not two renewable career slots. Verge has **one** pirate (`authored-systems.js` 212); exclusive leftover-quarry rules would starve hunt.
- Live cap 420 holds mining + trade + unique four + overlay headroom. Two hunt slots per system need **`HUNT_ROOM`**, not eviction of mining/trade.
- Overlay pay trusts `job.target` name match. Hunt must rebind a record id or stuffed names retarget payouts.
- Patrol still writes hardcoded `freehold`. Overlay bounty writes **no** rep. Hunt must pick employer +2 and not invent REP-04 victim deltas.

### Why now (design) / why not now (code)

The owner asked for the MSN-02 local-hunt brief after Wave 76 trade. Inventory and merge law exist. Implementation waits for a later serial so cap, kind allowlist, quarry bind, and overlay single-payout skip land against a frozen contract instead of a drive-by `kind: 'bounty'` slot.

---

## Goals & Non-Goals

### Goals

1. Document the live board, unique four, mining/trade slots, overlay pirate bounties, NPC records, Digit 2, `sanitizeJobs`, and Named Guns from **live code**.
2. Freeze extend-`world.jobs` (no new persist key) and a **raised** sanitize cap = `live_cap_at_impl + HUNT_ROOM`.
3. Freeze renewable **hunt** as the next vertical slice: two slots, one-in-one-out, local pirate record bind, origin `payQuoted`, 600 s fail-closed.
4. Freeze XSS / proto ids / stuffed pay / stuffed target / reputation-key injection law.
5. Keep unique `bounty-ace` as faction-level. Keep overlay cap 2. Name later families without inventing sibling numbers.
6. Freeze a serial PR plan: sanitize cap/kind → sync+accept+claim → replace/expire → UI copy → boot pins.
7. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 77. No `src/` edits. No `scripts/` / `public/` / `package.json`.
- No HUD-02 chart marks. No AST `asteroidId`. No POD reopen. No SHP hull grants. No BIO graft. No EXP SKU. No TGT-05. No NPC missiles. No power ledger.
- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No parallel `world.missions` array. No new `WORLD_FIELDS`. No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows.
- Do not migrate `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` in this serial.
- Do not retire overlay pirate rows. Do not post hunt against Named Guns / unique ace.
- Do not specify espionage, passenger ferry, faction-war, or exploration **numbers** (siblings / REP-04).
- Do not invent police restitution (REP-03). Do not invent a victim-faction kill delta.
- Do not edit the wishlist, `PROGRESS.md`, sibling briefs, or listed closed design docs.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Extend `world.jobs` | Already on `WORLD_FIELDS`. Contract §0.2 |
| Replace unique four? | **No** in this serial | Boot-test pins. Contract §0.4, §0.18 |
| First hunt family kind? | **`hunt`** (`kind: 'hunt'`) | Must not collide with `'bounty'` (ace+overlay) or unique/mining/trade. Contract §0.3 |
| Faction-level pirate? | Unique `bounty-ace` + Named Gun records | Wishlist split. Contract §0.4 |
| Overlay reuse? | **No.** New kind + slots. Overlay cap 2 stays | Inventory §7. Contract §0.6 |
| Same quarry as overlay? | **Allowed.** Accepted hunt wins the purse | Verge has 1 pirate. Contract §3.5 |
| Board slot? | 2 hunt jobs per system (offered or accepted); empty legal | Mining/trade precedent 189–190. Contract §0.5 |
| Replacement? | Splice + immediate new hunt job same system+slot if a quarry exists | MSN-01. Contract §2.3 |
| Live cap? | `4+2*N+2*N+16` = **420** at 100 systems | `save.js` 118–122 |
| New cap? | `live_cap_at_impl + HUNT_ROOM` (**620** at inventory-time 100) | Contract §0.7, §1.2. **No** passenger/explore terms |
| Drop mining/trade to fit? | **Never** honest offered mining or trade | Contract §0.7 |
| Target id? | Live `record.id` `rec-<n>`; no `asteroidId` | `world.js` 285. Contract §0.8 |
| Accept where? | Origin dock only | Contract §3.6 |
| Claim where? | Space-side (overlay cadence); no redock required | Contract §3.1, §3.5 |
| `payQuoted`? | Stamp on accept via **origin** `jobPayFor(record.bounty)`; clamp 0…20000 | Wave 26 + overlay bounty field. Contract §0.10 |
| Deadline? | 600 s (`MINING_DEADLINE` / `WRECK_TTL`); restart on accept; expire fail closed | cite `station.js` 193; `world.js` 811. Contract §0.9 |
| Employer rep? | +2 `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS)` | `MINING_REP` 191. Overlay has no bounty rep. Contract §0.11 |
| Victim-faction delta? | **No** this serial | REP-04 deferred. Contract §5 |
| `innerHTML`? | **No** | Live `h()` is `textContent`. Contract §0.12 |
| Job ids | Hyphen **tokens**; hunt id `hunt-<SYSTEMS key>-<n>` | Never `SAFE_ID.test(job.id)`. Contract §0.14, §1.3 |
| UI | Jobs pane, Digit 2 only; print name not `rec-n` | Contract §0.12, §4 |
| `state.js` | READ-ONLY | Contract §0.13 |
| New event? | **No** | Prefer `commLine`. Contract §0.13 |
| Espionage / passenger / explore numbers? | Sibling or later serials | Contract §0.15, §9 |

### 2. Current board (do not break)

See inventory §§1–6. The load-bearing loop is:

1. `initStation` → `ensureJobs` → `makeJobs` if empty (unique four).
2. Each Jobs render: refresh ace, sync pirates, sync recovery, sync mining, **sync trade**.
3. Accept stamps haul/ferry quotes (dest `jobPayFor`) and mining/trade quotes (origin `jobPayFor`); ferry fronts cargo. Overlay/ace accept is a state flip only.
4. Ticks complete patrol (frame), delivery (0.5 s). Mining/trade expire/replace live in that tick. Overlay/ace pay in that tick via `completeJob`.
5. Unique `completeJob` marks `done` and banks dockmaster trust. Overlay bounty also banks fence favor (`kind === 'bounty'`).

**This serial must not change step 1’s four ids, unique haul/ferry quote stamps, Wave 35 haul dest bind, overlay cap/ids, or Named Gun records.** Hunt is additive: extra sync on render, extra branch in delivery tick, extra cards in `boardJobs`, extra kind in `sanitizeJobs`, plus a **skip** on overlay pay when an accepted hunt already claims that quarry.

Digit 2 and `DOCK_KEY_SERVICES` stay. Digit 0 stays shipyard.

### 3. Persist: raise `sanitizeJobs`

Restore already heals jobs (`save.js` 711). That is the trust boundary.

Later PR1: extend `sanitizeJobs`. Shape, hyphen-token ids, proto drop, **`'hunt'` kind**, `recordId` / slot / need 1, cap: contract §1.

**Ids:** live `SAFE_ID` (`/^[a-z0-9_]+$/i`) rejects hyphens. `bounty-ace` and `hunt-freehold-0` must survive restore. Sanitize splits on `-` and runs the `SAFE_ID` character class on **each token**, then `RESERVED_IDS` on the full string and every token. Unique four are an exact allowlist. Do not rewrite them to underscores. Do not copy `pirateBountyId`.

**Cap:** live `JOBS_SANITIZE_MAX = 4 + 2N + 2N + 16` (**420** at 100 systems, `state.js` 541). New: `live_cap_at_impl + 2 * N_SYSTEMS` (**620** at inventory-time 100). A cap of 420 cannot hold two extra hunt slots per system. Drop order never removes the unique four, accepted jobs, honest offered mining, honest offered trade, or honest offered hunt (one of two slots per `originSystem` per kind).

Do **not** write `4 + 6*N + 16` as a formula that pretends passenger/explore already shipped. Those rooms belong to sibling workers. Hunt impl **adds `HUNT_ROOM` to whatever cap is live**.

`ensureJobs` still seeds the unique four when the array is empty after heal. Hunt fill is `syncHuntJobs`, not `makeJobs`. Mining fill stays `syncMiningJobs`. Trade fill stays `syncTradeJobs`. Overlay fill stays `syncPirateBounties`.

### 4. Board slots and one-in-one-out

A **hunt slot** is `kind === 'hunt'` + `originSystem` + `slot` ∈ {0,1}. Independent from mining, trade, and overlay.

```
renderJobs
  → syncPirateBounties / syncRecoveryJob / syncMiningJobs / syncTradeJobs (unchanged)
  → syncHuntJobs(currentId)   // pull ineligible offered ghosts; fill missing slots; skip if no quarry

hunt complete or expire
  → splice that job
  → push replacement for same originSystem + slot if a quarry exists
  → render if the Jobs pane is open
```

Offered hunt: home dock only (mining/pirate/recovery/trade precedent).  
Accepted hunt: visible on every Jobs board so the player can see quarry name and deadline.

Unique `DONE` rows remain until a later serial. This slice must not add hunt to that clutter (`failed` is transient). Overlay `DONE` leak stays overlay’s problem.

No eligible pirate in the origin bank: **do not post**. Do not fabricate a quarry (Witness Rule).

### 5. Hunt vertical slice

**Beats:**

1. Dock home → Jobs → up to two hunt cards (named local pirates of this system). Overlay bounty cards may still appear for the same names.
2. Accept. Reward, quarry name, employer, remaining time are visible before and after accept (wishlist acceptance).
3. Fly this system. Destroy the bound pirate with a player-caused incident. Record becomes `dead`/`captured`.
4. Delivery tick pays `payQuoted`, +2 employer rep (origin faction), dockmaster trust as mining (not fence favor), splice, new card on the **origin** board if another quarry exists.
5. Ignore a card for 600 s: posting withdraws, replacement appears. Ignore an accepted card: fail closed, no pay, replacement.

**Not:** unique ace. **Not:** Named Gun hunter/aspirants. **Not:** a lock on a rock. **Not:** cargo. Accept only at the origin dock (`currentSystem === originSystem`). `need` is exactly 1 (sanitize drops any other hunt need).

**Pay:** `jobPayFor` at the **origin** dock, `Math.round(record.bounty)`. Stamp `payQuoted` on accept so epic/faction shifts cannot move the agreement (Wave 26 law; mining origin stamp). Overlay remains unstamped current-system `jobPay`. Refuse accept if bounty is not finite `> 0`.

**Quarry bind:** pay uses `recordId` → origin bank record → `rec.name` for incident match. Stuffed `job.target` cannot retarget payout. UI name also resolves through that lookup.

**Single payout:** if **any** hunt card for that quarry is **accepted**, overlay skips **before** credits move (existence check — reverse walk would otherwise pay overlay first). Hunt then pays. If only overlay was accepted, overlay pays as live.

### 6. Deadlines

Live mining/trade already use `deadline` vs `world.time` and fail closed. Hunt uses the same clock. Do not invent a third clock.

| State | Timer | On fire |
|---|---|---|
| offered | `deadline = postTime + 600` | withdraw, replace |
| accepted | `deadline = acceptTime + 600` (restarts) | fail closed, replace |

600 s is ~10 minutes. A local pirate in the current system is a generous window (MSN-01).

Expire must not call the pay path. A restored job with `deadline` in the past expires on the next 0.5 s tick.

There is no `failed` row left on the board after replace. `failed` exists so a crash mid-replace cannot pay twice (mining 2280–2281).

Offered hunt whose quarry is already `dead`/`captured` fail-closed replaces (no pay).

### 7. UI (Jobs pane only)

Stay inside `renderJobs`. Two menu levels remain (`station.js` header §12.1). Digit **2**. No new Digit. No HUD glance (HUD-02 closed).

Each hunt card (all `textContent`):

- Title / detail from templates using live `rec.name` after `stripControlChars` / `NAME_MAX` (else stripped snapshot; never print `recordId`) and origin station name from `SYSTEMS`.
- Reward line with stamped or live quote (origin `jobPayFor` for offered; `payQuoted` for accepted).
- If offered: Accept (n). Deadline remaining as whole seconds or minutes (reuse mining label helper).
- If accepted: `ACCEPTED — hunt <name> in this system · t left`.

No `innerHTML`. No `job.faction` as a write source. No `recordId` / clue ids on the card. `reducedMotion`: no extra animation; copy stays.

Home board can exceed 9 cards (unique four + overlays + 2 mining + 2 trade + 2 hunt). Digit 1–9 cannot accept past index 8; **mouse Accept still works** (live Accept buttons). That is existing UX, not a reason to cut to one slot (contract §12.2).

### 8. Reputation and later REP

Hunt success writes **employer faction only**, `Object.hasOwn(FACTIONS, key)`, **+2** (mining). Expire writes nothing. Overlay bounty still writes no rep.

Do not copy patrol’s `reputation.freehold +=` (`station.js` 2233) into hunt.

Do not write `record.faction` standing (victim-faction kill is REP-04, **proposed, needs owner**, not this serial).

Espionage (secret success, exposed failure) and faction-vs-faction (employer up, target down) are wishlist REP-04. **MSN does not write that brief.** Passenger/explore numbers belong to sibling Wave 77 workers.

### 9. Serial PR plan

Matches contract §8. **Named only. Do not implement in Wave 77.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'hunt'` kind; `hunt-<sys>-<n>` ids; `recordId`/slot/need; cap `live_cap + HUNT_ROOM`; proto / kind / state allowlist; unique four kept; honest mining and trade kept | Sync, UI, pay, unique migration, whole-string `SAFE_ID`, passenger/explore rooms |
| **PR2 sync cards + accept + claim** | fill ≤2 slots; accept origin-only; origin `payQuoted`; space-side tick; overlay skip vs accepted hunt | Expire, replace, other families |
| **PR3 replace + expire** | one-in-one-out; 600 s fail closed; empty slot if no quarry | MSN-03, unique migration, overlay retirement |
| **PR4 UI copy** | remaining time + quarry name; `textContent` only | HUD-02, Digit 0, People desk, `rec-` ids |
| **PR5 boot pins** | keep unique four + `mine-freehold-0` + `trade-freehold-0` + `hunt-freehold-0`; drop `hunt-__proto__-0`; fit `live+HUNT_ROOM`; complete→new card; expire no pay; stuffed target ignored; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS |

`state.js` untouched. Authored copy is strings in `station.js` / a tiny `jobs.js`, not a table dump. No `src/` scheduled this wave.

### 10. Coupling

| Neighbour | Coupling | Law |
|---|---|---|
| Mining MSN | Shared `world.jobs`, `sanitizeJobs`, Digit 2, `tickDeliveryJobs`, `boardJobs` | Grow cap by `HUNT_ROOM`. Independent slots. Never drop honest mining. Do not reuse `kind: 'mining'` |
| Trade MSN | Same array/tick | Never drop honest trade. Do not reuse `kind: 'trade'`. Do not include trade **and** hunt **and** siblings in one frozen formula |
| Overlay pirates | Same pane; possible same quarry name | Cap 2 stays. Accepted hunt wins purse. Overlay ids unchanged |
| Unique ace / Named Guns | Same pane; world.js lineage | Not a hunt quarry. `bounty-ace` stays |
| Passenger / explore | Shared future cap | Sibling workers. **No numbers here** |
| EXP data | Mystery clues | Do not print clue ids on Jobs |
| POD survivors | People Digit 7 | No `survivor` on jobs |
| BIO grafts | Feed Digit | Unchanged |
| SHP | Digit 0 | No hull grants |
| TGT-05 | `ctx.targets` | Jobs do not write locks |
| REP | Standing bag | Employer +2 on success only. No patrol `freehold` copy. No victim-faction kill |
| NPC pirates | Records / AI mode `'hunt'` | Read records. Do not change AI. Pirates never migrate |

### 11. Non-goals (expanded)

- Passenger ferry as survivor cargo (POD closed; sibling owns numbers).
- Turning Standing epics into scripted quests (`epics.js` stays requirement auto-advance).
- Mystery clues as board jobs (EXP / sibling explore).
- Police hail / restitution.
- Mission-granted ships, scanners, or mining heads (outfitter stays UU).
- Changing unique ace or overlay to origin `payQuoted` except the overlay skip vs hunt.
- `ctx.js` default `jobs: []` is optional; not required if `ensureJobs` remains the creator.
- NPC missiles / power ledger.

---

## Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Unique four vanish on restore | Exact allowlist; hyphen tokens; boot pins |
| Honest mining/trade dropped for hunt room | Cap `live + HUNT_ROOM`; drop order never evicts honest mining/trade/hunt |
| Overlay retired by accident | Cap 2 / ids / `completeJob` stay; only a pay skip vs accepted hunt |
| Named Gun as renewable slot | Eligibility forbids ace role/classKey and ACES/NAMED_GUNS names |
| Double pay overlay + hunt | Accepted hunt wins; overlay skip; `failed` before pay |
| Unique haul dest bind broken | Do not edit Wave 35 branch; PR5 still passes WAVE26/WAVE35 |
| Unreachable quarry | Pirates never migrate; skip post if none eligible |
| Target injection | Pay rebinds `recordId` → `rec.name`; UI names from record |
| Foreign offered accept | `boardJobs` hides offered hunt off-home; `acceptJob` also refuses if `currentSystem !== origin` |
| Stuffed `need` | Hunt need must be exactly 1; else drop |
| Stuffed `payQuoted` | Clamp 0…20000 on sanitize and at pay; expire has no pay |
| Duplicate pay on restore | `failed` before pay; splice; expire has no pay branch |
| `__proto__` job id | Token `RESERVED_IDS`; drop `hunt-__proto__-0` |
| Save retargets employer | No `job.faction`; read `SYSTEMS[origin].faction` |
| XSS in titles | `textContent`; strip on restore; regen from templates |
| `asteroidId` / mystery ids | Forbidden on hunt cards |
| Patrol freehold bleed copied | Hunt uses dock `faction` |
| Digit overflow | Mouse Accept; do not cut slots |
| `state.js` dump | READ-ONLY |
| Boot-test unique ids | Untouched |
| New persist key | Forbidden |
| Cap formula eats siblings | Hunt adds only `HUNT_ROOM` to live cap |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | station (later maybe `jobs.js`); save sanitize | station |
| Unique four | `makeJobs` when empty | boot-test |
| Mining slots | `syncMiningJobs` / replace | `boardJobs` |
| Trade slots | `syncTradeJobs` / replace | `boardJobs` |
| Hunt slots | `syncHuntJobs` / replace | `boardJobs` |
| Overlay pirates | `syncPirateBounties` | `boardJobs` |
| `ctx.world.reputation` | hunt complete → employer key | epics, standing, npc |
| `WORLD_FIELDS` `'jobs'` | save.js | restore |
| `state.js` | serial data owner only | **feature PRs read-only** |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (3627–3631).

---

## Acceptance direction (implementation wave)

From the wishlist, made testable for the **hunt** slice:

1. A Freehold Jobs board shows up to two hunt cards plus today’s unique/overlay/mining/trade rows.
2. Accept → destroy the named local pirate with a player-caused incident: card gone, credits up, **new** hunt card on the origin board if a quarry remains.
3. Completing again still yields a hunt card when pirates remain (career does not exhaust).
4. Origin is a real `SYSTEMS` key. Quarry `recordId` is `rec-<n>` in that system’s bank. Role is `pirate`, not `ace`.
5. Reward, quarry name, and remaining time are visible before accept. `recordId` is not printed.
6. After 600 s accepted without a witnessed kill: no pay, card replaced, state not `DONE`.
7. Restore of `__proto__` / `hunt-__proto__-0` drops those rows; unique four and `mine-freehold-0` and `trade-freehold-0` and `hunt-freehold-0` remain; 10k-length heals to ≤ `live+HUNT_ROOM`; stuffed `target` does not pay a different name; no throw; no extra credits.
8. Unique `bounty-ace` still exists. Overlay still posts up to 2 `bounty-pirate-*`. WAVE26 / WAVE35 behaviour unchanged.
9. Accepted hunt and overlay for the same kill: **one** purse (hunt).
10. No job field names an asteroid index. No new `WORLD_FIELDS`. No `innerHTML`.

---

## Open owner questions

Defaults in the contract §12 **stand**. None of them block impl.

No blocking owner question. A later owner may still override slot count, space-side vs redock claim, or +2 vs 0 — until then, implement the defaults. Do not invent a new UU table, a third clock, a victim-faction delta, or passenger/explore cap terms while waiting.

Non-blocking notes (not required to start PR1):

1. Overlay skip vs hunt is a small live-tick coupling. Default: keep overlay, hunt wins if accepted.
2. Verge (1 pirate) may show one hunt card, not two. Default: empty second slot.
3. Collector-as-local-pirate is eligible when `bounty > 0` in the origin bank. Default: include.
