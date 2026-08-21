# RIMWARD MSN-02 renewable espionage

| Field | Value |
|---|---|
| **Title** | RIMWARD MSN-02 renewable espionage |
| **Author** | Wave 79 MSN-02 espionage integrator |
| **Date** | 2026-08-21 |
| **Status** | First impl Wave 80. Wave 83: accepted expose writes target −2 (`SPY_EXPOSE_DELTA`). |
| **Wave** | 80 — first impl. Design freeze was Wave 79. |
| **Owner request** | MSN-02 espionage as a renewable Jobs-board family. Unique-four stay; REP-04 secret success / expose fail-closed; no `state.js` write; no new persist key. |
| **Merge law** | [`out/w79/espionage/shared-contract.md`](../out/w79/espionage/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w79/espionage/current-espionage-inventory.md`](../out/w79/espionage/current-espionage-inventory.md) |
| Merge law | [`out/w79/espionage/shared-contract.md`](../out/w79/espionage/shared-contract.md) |
| Security review | [`out/w79/espionage/security-review.md`](../out/w79/espionage/security-review.md) |
| Design-doc review | [`out/w79/espionage/code-review.md`](../out/w79/espionage/code-review.md) |
| Wave 79 verify | [`out/w79/espionage/verify.txt`](../out/w79/espionage/verify.txt) |

---

## Overview

Wishlist MSN-02 wants **espionage** as a career. Wishlist REP-04 wants successful espionage to stay **secret** (no target-faction loss) and failed espionage to **expose** (may cause the normal loss). Live today: five renewable families (mining, trade, hunt, passenger, explore) occupy two slots per system each. Unique four stay one-shot. There is no `kind: 'espionage'`. EXP crystals/cubes are hangar rows; the Assembly Archive desk lists but does not debit while UU is unset. Explore jobs already pay credits + employer +2 with **no** data cargo.

Wave 79 freezes persist (extend `world.jobs` + raise sanitize cap by **espionage room only**), two spy slots, one-in-one-out, rival dest bind, origin `payQuoted` from live `explorePayBase`, 600 s fail-closed deadlines, secret success (employer +2, target 0), expose fail-closed until owner, Digit 2 Jobs pane, and the serial PR plan. Unique four stay. Missions other than renewable espionage do not change here.

Do **not** migrate or delete the unique four. Do **not** invent faction-war numbers (sibling). Do **not** invent a kill UU table (sibling). Do **not** grant `dataCrystal` / `dataCube`. `src/game/state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “jobs, Digit 2, reputation, and EXP today”: [`out/w79/espionage/current-espionage-inventory.md`](../out/w79/espionage/current-espionage-inventory.md). Code wins over stale comments. Wave 70/75/77 inventory line numbers are stale.

| Surface | Today | Cite |
|---|---|---|
| Owner | `station.js` creates `ctx.world.jobs` if empty | `ensureJobs` 1767–1769; `initStation` 3141, 3153 |
| Unique cards | ace bounty, patrol, haul Provisions, ferry Provisions | `makeJobs` 1732–1764 |
| Mining slots | two per system, `kind: 'mining'`, one-in-one-out | `MINING_SLOTS_PER_SYSTEM` 189; `syncMiningJobs` 1927 |
| Trade slots | two per system, `kind: 'trade'` | `TRADE_SLOTS_PER_SYSTEM` 190; `syncTradeJobs` 2085 |
| Hunt slots | two per system, `kind: 'hunt'` | `HUNT_SLOTS_PER_SYSTEM` 191; `syncHuntJobs` 2291 |
| Passenger slots | two per system, `kind: 'passenger'` | `PASSENGER_SLOTS_PER_SYSTEM` 192; `syncPassengerJobs` 2414 |
| Explore slots | two per system, `kind: 'explore'` | `EXPLORE_SLOTS_PER_SYSTEM` 193; `syncExploreJobs` 2556 |
| Overlays | pirate bounties cap 2; one recovery wreck | `PIRATE_BOUNTY_CAP` 187; render 3641–3642 |
| Unique/overlay complete | `state = 'done'`; trust/favor; no splice | `completeJob` 2746–2749; overlay 3079–3089 |
| Family complete | `failed` first, pay, splice, replace | `tickDeliveryJobs` 2789–3065 |
| Board filter | hide foreign **offered** pirate/recovery/mining/trade/hunt/passenger/explore; show unique `DONE` | `boardJobs` 2673–2687 |
| Mining/trade/hunt/passenger/explore pay | `payQuoted` via **origin** `jobPayFor`; clamp 20000 | accept 3496–3619; `jobPayFor` 2695–2702 |
| Patrol rep | **`reputation.freehold += PATROL_REP`** | 2777 |
| Family rep | +2 employer `SYSTEMS[origin].faction` | `MINING_REP` 194; hunt 2657–2658; mining 2893–2895 |
| Persist | `WORLD_FIELDS` `'jobs'`; autosave `rimward-save-v1` | `save.js` 65, 78 |
| Sanitize | hyphen tokens, proto drop, kind/state allowlist, cap `4+10*N+16` (**1020** at 100) | `save.js` 115–129, 209–221, 546–600 |
| `JOB_KINDS` | no `'espionage'` | `save.js` 138 |
| Events | `'commLine'` only; no `job*` type | `ctx.js` 198–227 |
| UI | Digit 2; `h()` `textContent`; digit accept by index | 152, 3208–3213, 3634, 4429–4431 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| EXP desk | Assembly Archive on Digit 1 Market; `ARCHIVE_UU` null | 1106, 1111, 1187 |
| Data drop | `DATA_DROP_RATE` null; spawn no-op | `data-trade.js` 23, 118–126 |
| Explore data cargo | **none** on complete | 3048–3064 |

There is no `kind: 'espionage'`. Passenger dest may share the origin faction (`otherSystemId` = `gates[0].to`).

### Pain points

- Wishlist MSN-02 espionage: no board family exists. Stuffing spy work into `'passenger'` or `'explore'` would collide with dest-pay escorts and landmark surveys.
- Wishlist REP-04: success must not debit the target. Live Jobs writers only credit an employer (or hardcoded Freehold). There is no secret-vs-expose branch.
- Live cap 1020 holds five families + unique four + overlay headroom. Two spy slots per system need **`ESPIONAGE_ROOM`**, not eviction of mining/trade/hunt/passenger/explore.
- Gate-0 dest (`passengerDestId`) is not a rival-faction picker. Spy must rebind a dest whose `SYSTEMS[dest].faction` ≠ employer.
- Overlay/unique `completeJob` `DONE` would exhaust a career (MSN-01 leak). Spy must splice+replace like mining.
- EXP drop % / Archive UU remain owner-open. A spy job must not mint `dataCrystal` / `dataCube`.

### Why now (design) / why not now (code)

The owner asked for the MSN-02 espionage brief after Wave 78 hunt/passenger/explore. Inventory and merge law exist. Implementation waits for a later serial so cap, kind allowlist, rival dest bind, and secret-success writes land against a frozen contract instead of a drive-by sixth `makeJobs` row. Sibling Wave 79 workers own kill attribution and faction-war; this brief does **not** wait on their files.

---

## Goals & Non-Goals

### Goals

1. Document the live board, unique four, five renewable families, overlays, Digit 2, `sanitizeJobs`, reputation writers, and EXP desk from **live code**.
2. Freeze extend-`world.jobs` (no new persist key) and a **raised** sanitize cap = `live_cap_at_impl + ESPIONAGE_ROOM`.
3. Freeze renewable **espionage** as the next vertical slice: two slots, one-in-one-out, rival dest bind, origin `payQuoted`, 600 s fail-closed.
4. Freeze secret success (employer +2, target 0) and expose fail-closed until owner.
5. Freeze XSS / proto ids / stuffed pay / stuffed dest / reputation-key injection law.
6. Keep unique four. Name faction-war without inventing sibling numbers.
7. Freeze a serial PR plan: sanitize cap/kind → cards/sync → complete/expire/replace → Digit 2 UI → boot pins.
8. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 79. No `src/` edits. No `scripts/` / `public/` / `package.json`.
- No HUD-02 chart marks. No AST `asteroidId`. No POD reopen. No SHP hull grants. No BIO graft. No EXP SKU / drop % / Archive UU. No TGT-05. No NPC missiles. No power ledger.
- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No parallel `world.missions` array. No new `WORLD_FIELDS`. No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows.
- Do not migrate `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` in this serial.
- Do not invent faction-war numbers (sibling). Do not invent a kill UU table (sibling). Do not invent police restitution (REP-03).
- Do not grant `dataCrystal` / `dataCube`.
- Do not edit the wishlist, `PROGRESS.md`, sibling briefs, or listed closed design docs.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Extend `world.jobs` | Already on `WORLD_FIELDS`. Contract §0.2 |
| Replace unique four? | **No** in this serial | Boot-test pins. Contract §0.4, §0.17 |
| Family kind? | **`espionage`** (`kind: 'espionage'`) | Unused in live `JOB_KINDS` (`save.js` 138). Contract §0.3 |
| Board slot? | 2 spy jobs per system (offered or accepted); empty legal | Mining precedent 189–193. Contract §0.5 |
| Replacement? | Splice + immediate new spy job same system+slot if a dest exists | MSN-01. Contract §2.3 |
| Live cap? | `4+10*N+16` = **1020** at 100 systems | `save.js` 115–129 |
| New cap? | `live_cap_at_impl + ESPIONAGE_ROOM` (**1220** at inventory-time 100) | Contract §0.6, §1.2. **No** faction-war term |
| Drop shipped families to fit? | **Never** honest offered mining/trade/hunt/passenger/explore | Contract §0.6 |
| Dest? | Rival `SYSTEMS` key; dest faction ≠ employer; has station. Prefer **gate rivals** only; else any rival | Passenger gate-0 may share faction. Far `Object.keys` dests would starve 600 s. Contract §3.3 |
| Asteroid UUID / clue id? | **Forbidden** | AST / EXP. Contract §0.7 |
| Accept where? | Origin dock only | Contract §3.6 |
| Gather / file? | Dest dock sets `progress=1`; origin dock pays (explore cadence) | Contract §3.1, §3.5 |
| `payQuoted`? | Stamp on accept via **origin** `jobPayFor(explorePayBase())`; clamp 0…20000 | Live 2508, 3618. Contract §0.9 |
| Deadline? | 600 s (`MINING_DEADLINE` / `WRECK_TTL`); restart on accept; expire fail closed | cite `station.js` 196; `world.js` 811. Contract §0.8 |
| Employer rep? | +2 `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS)` | `MINING_REP` 194. Contract §0.10 |
| Target rep on success? | **0** (no loss) | Wishlist REP-04. Contract §0.10 |
| Expose / fail target delta? | **Proposed, needs owner.** Fail closed (no target write). Candidate `MINING_REP` 2 is **not** shippable | Contract §0.11, §5 |
| Data grant? | **No** | Explore precedent. Contract §0.4 |
| `innerHTML`? | **No** | Live `h()` is `textContent`. Contract §0.12 |
| Job ids | Hyphen **tokens**; spy id `spy-<SYSTEMS key>-<n>` | Never `SAFE_ID.test(job.id)`. Prefix ≠ kind (mining `mine-` precedent). Contract §0.14, §1.3 |
| UI | Jobs pane, Digit 2 only; station names, not keys | Contract §0.12, §4 |
| `state.js` | READ-ONLY | Contract §0.13 |
| New event? | **No** | Prefer `commLine`. Contract §0.13 |
| Faction-war / kill UU? | Sibling workers | Contract §0.15, §9 |

### 2. Current board (do not break)

See inventory §§1–6. The load-bearing loop is:

1. `initStation` → `ensureJobs` → `makeJobs` if empty (unique four).
2. Each Jobs render: refresh ace, sync pirates, sync recovery, sync mining, sync trade, sync hunt, sync passenger, **sync explore**.
3. Accept stamps haul/ferry quotes (dest `jobPayFor`) and family quotes (origin `jobPayFor`); ferry fronts cargo.
4. Ticks complete patrol (frame), delivery (0.5 s). Families expire/replace live in that tick. Overlay/ace pay in that tick via `completeJob`.
5. Unique `completeJob` marks `done` and banks dockmaster trust. Overlay bounty also banks fence favor (`kind === 'bounty'`).

**This serial must not change step 1’s four ids, unique haul/ferry quote stamps, Wave 35 haul dest bind, overlay cap/ids, or shipped family kinds.** Espionage is additive: extra sync on render, extra branch in delivery tick, extra cards in `boardJobs`, extra kind in `sanitizeJobs`.

Digit 2 and `DOCK_KEY_SERVICES` stay. Digit 0 stays shipyard. Digit 1 Market / Archive stay. Digit 9 Standing stays.

### 3. Persist: raise `sanitizeJobs`

Restore already heals jobs (`save.js` 864). That is the trust boundary.

Later PR1: extend `sanitizeJobs`. Shape, hyphen-token ids, proto drop, **`'espionage'` kind**, dest/slot/need 1, cap: contract §1.

**Ids:** live `SAFE_ID` (`/^[a-z0-9_]+$/i`) rejects hyphens. `bounty-ace` and `spy-freehold-0` must survive restore. Sanitize splits on `-` and runs the `SAFE_ID` character class on **each token**, then `RESERVED_IDS` on the full string and every token. Unique four are an exact allowlist. Do not rewrite them to underscores.

**Cap:** live `JOBS_SANITIZE_MAX = 4 + 10N + 16` (**1020** at 100 systems, `state.js` 541). New: `live_cap_at_impl + 2 * N_SYSTEMS` (**1220** at inventory-time 100). A cap of 1020 cannot hold two extra spy slots per system. Drop order never removes the unique four, accepted jobs, honest offered mining/trade/hunt/passenger/explore, or honest offered espionage (one of two slots per `originSystem` per kind).

Do **not** write `4 + 12*N + 16` as a formula that pretends faction-war already shipped. That room belongs to a sibling worker. Spy impl **adds `ESPIONAGE_ROOM` to whatever cap is live**.

`ensureJobs` still seeds the unique four when the array is empty after heal. Spy fill is `syncEspionageJobs`, not `makeJobs`. Other family fills stay their sync functions.

### 4. Board slots and one-in-one-out

A **spy slot** is `kind === 'espionage'` + `originSystem` + `slot` ∈ {0,1}. Independent from mining, trade, hunt, passenger, explore, and overlay.

```
renderJobs
  → syncPirateBounties / syncRecoveryJob / syncMiningJobs / syncTradeJobs
    / syncHuntJobs / syncPassengerJobs / syncExploreJobs (unchanged)
  → syncEspionageJobs(currentId)   // pull ineligible offered ghosts; fill missing slots; skip if no dest

espionage complete or expire
  → splice that job
  → push replacement for same originSystem + slot if a dest exists
  → render if the Jobs pane is open
```

Offered spy: home dock only (mining/pirate/recovery/trade precedent).  
Accepted spy: visible on every Jobs board so the player can see dest name and deadline.

Unique `DONE` rows remain until a later serial. This slice must not add spy to that clutter (`failed` is transient). Overlay `DONE` leak stays overlay’s problem.

No eligible rival dest: **do not post**. Do not fabricate a system (Witness Rule).

### 5. Espionage vertical slice

**Beats:**

1. Dock home → Jobs → up to two spy cards (named rival stations whose flag ≠ this dock).
2. Accept. Reward, dest station name, employer, remaining time are visible before and after accept (wishlist acceptance).
3. Fly to the dest system. Dock there. `progress` becomes 1 (intel gathered). This dock is **not** expose.
4. Redock **home**. Delivery tick pays `payQuoted`, +2 employer rep (origin faction), **no** target-faction write, dockmaster trust as mining (not fence favor), splice, new card on the **origin** board if a dest remains.
5. Ignore a card for 600 s: posting withdraws, replacement appears. Ignore an accepted card: fail closed, no pay, **no target write**, replacement.

**Not:** unique ace. **Not:** Named Gun. **Not:** a lock on a rock. **Not:** cargo. **Not:** Archive filing. Accept only at the origin dock (`currentSystem === originSystem`). `need` is exactly 1 (sanitize drops any other spy need).

**Pay:** `jobPayFor` at the **origin** dock, `explorePayBase()` (`Math.round(RECOVERY_REWARD * HAUL_MARGIN)`). Stamp `payQuoted` on accept so epic/faction shifts cannot move the agreement (Wave 26 law; explore origin stamp). Refuse accept if the stamp is not finite `> 0`.

**Dest bind:** pay and gather use `resolveEspionageDest(origin, slot)` from live `SYSTEMS`. Stuffed `job.destSystem` cannot retarget payout. UI name also resolves through that lookup.

### 6. Deadlines

Live mining/trade/hunt/passenger/explore already use `deadline` vs `world.time` and fail closed. Spy uses the same clock. Do not invent a third clock.

| State | Timer | On fire |
|---|---|---|
| offered | `deadline = postTime + 600` | withdraw, replace |
| accepted | `deadline = acceptTime + 600` (restarts) | fail closed, replace |

600 s is ~10 minutes. A one-gate hop plus two docks is a generous window (MSN-01).

Expire must not call the pay path. Expire must not write target standing. A restored job with `deadline` in the past expires on the next 0.5 s tick.

There is no `failed` row left on the board after replace. `failed` exists so a crash mid-replace cannot pay twice (mining 2886).

Offered spy whose dest is no longer eligible fail-closed replaces (no pay).

### 7. UI (Jobs pane only)

Stay inside `renderJobs`. Two menu levels remain (`station.js` header). Digit **2**. No new Digit. No HUD glance (HUD-02 closed).

Each spy card (all `textContent`):

- Title / detail from templates using dest station name and origin station name from `SYSTEMS` (after `stripControlChars` / `NAME_MAX`). Never print system keys, clue ids, or `recordId`.
- Reward line with stamped or live quote (origin `jobPayFor(explorePayBase())` for offered; `payQuoted` for accepted).
- If offered: Accept (n). Deadline remaining as whole seconds or minutes (reuse mining label helper).
- If accepted: `ACCEPTED — gather at <dest station> then file at <home dock> · t left` (or `intel aboard — file at <home dock>` when `progress === 1`). Reward: `File intel from <dest station> at <home dock>`. Offered cards at origin may keep “here”.

No `innerHTML`. No `job.faction` as a write source. `reducedMotion`: no extra animation; copy stays.

Home board can exceed 9 cards (unique four + overlays + 2×6 families). Digit 1–9 cannot accept past index 8; **mouse Accept still works** (live Accept buttons). That is existing UX, not a reason to cut to one slot (contract §12.2).

### 8. Reputation and later REP

Spy **success** writes **employer faction only**, `Object.hasOwn(FACTIONS, key)`, **+2** (mining). Target faction **0**. Expire writes nothing.

Do not copy patrol’s `reputation.freehold +=` (`station.js` 2777) into spy.

Do not write `job.faction` (field forbidden). Do not write `reputation[userString]`.

Expose (wishlist “failure exposes and may cause the normal loss”) is **proposed, needs owner**. Candidate magnitude: mining **2**. **Fail closed (no target write)** until authored. Do not invent a kill UU table. A sibling Wave 79 worker owns kill attribution. Do not wait on that file.

Faction-vs-faction (employer up, target down) is wishlist overt war — **sibling**, not this serial.

Standing Digit 9 copy may later mention spy +2 employer; first impl does not require a `standingMoveNotes` edit in PR1.

### 9. Serial PR plan

Matches contract §8. **Named only. Do not implement in Wave 79.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'espionage'` kind; `spy-<sys>-<n>` ids; dest/slot/need; cap `live_cap + ESPIONAGE_ROOM`; proto / kind / state allowlist; unique four kept; honest mining/trade/hunt/passenger/explore kept | Sync, UI, pay, unique migration, whole-string `SAFE_ID`, faction-war room |
| **PR2 cards + sync** | fill ≤2 slots; accept origin-only; origin `payQuoted` from `explorePayBase`; dest rebind | Expire, replace, other families |
| **PR3 complete / expire / replace** | dest-dock gather; origin-dock pay; one-in-one-out; 600 s fail closed; empty slot if no dest; success target 0; expire no target write | MSN-03, unique migration, overlay retirement, kill UU |
| **PR4 Digit 2 UI** | remaining time + dest station name; `textContent` only | HUD-02, Digit 0, People desk, clue ids |
| **PR5 boot pins** | keep unique four + `mine-freehold-0` + `trade-freehold-0` + `hunt-freehold-0` + `passenger-freehold-0` + `explore-freehold-0` + `spy-freehold-0`; drop `spy-__proto__-0`; fit `live+ESPIONAGE_ROOM`; complete→new card; expire no pay and no target delta; stuffed dest ignored; no data cargo; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS |

`state.js` untouched. Authored copy is strings in `station.js` / a tiny `jobs.js`, not a table dump. No `src/` scheduled this wave.

### 10. Coupling

| Neighbour | Coupling | Law |
|---|---|---|
| Mining MSN | Shared `world.jobs`, `sanitizeJobs`, Digit 2, `tickDeliveryJobs`, `boardJobs` | Grow cap by `ESPIONAGE_ROOM`. Independent slots. Never drop honest mining. Do not reuse `kind: 'mining'` |
| Trade / hunt / passenger / explore | Same array/tick | Never drop honest offered of those kinds. Do not reuse their kinds. Do not include war room in this formula |
| Overlay pirates | Same pane | Cap 2 stays. Overlay ids unchanged |
| Unique ace / Named Guns | Same pane | Untouched |
| Faction-war | Shared future cap / REP | Sibling. **No numbers here** |
| EXP data | Mystery clues / Archive | Do not print clue ids. Do not grant data cargo |
| POD survivors | People Digit 7 | No `survivor` on jobs |
| BIO grafts | Feed Digit | Unchanged |
| SHP | Digit 0 | No hull grants |
| TGT-05 | `ctx.targets` | Jobs do not write locks |
| REP | Standing bag | Employer +2 on success. Target 0. No patrol `freehold` copy. No kill UU |
| Kill attrib sibling | Victim-faction piracy | Out of this family |

### 11. Non-goals (expanded)

- Passenger ferry as survivor cargo (POD closed).
- Turning Standing epics into scripted quests (`epics.js` stays requirement auto-advance).
- Mystery clues as board jobs (EXP / explore).
- Police hail / restitution.
- Mission-granted ships, scanners, or mining heads (outfitter stays UU).
- Changing unique ace or overlay to origin `payQuoted`.
- `ctx.js` default `jobs: []` is optional; not required if `ensureJobs` remains the creator.
- NPC missiles / power ledger.
- Unknowables dock.

---

## Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Unique four vanish on restore | Exact allowlist; hyphen tokens; boot pins |
| Honest mining/trade/hunt/passenger/explore dropped for spy room | Cap `live + ESPIONAGE_ROOM`; drop order never evicts honest shipped families or spy |
| Overlay retired by accident | Cap 2 / ids / `completeJob` stay |
| Kind collision with passenger/explore | New kind `'espionage'`; ids `spy-<sys>-<n>` |
| Same-faction dest (no target) | Dest eligibility requires dest faction ≠ employer; skip post if none |
| Target loss on success | Success path writes employer only; target write is a skip |
| Expose invents kill UU | Fail closed; candidate 2 not shipped |
| Unreachable dest | Skip post if no station / Unknowables; prefer gate rivals; empty slot legal |
| Dest injection | Pay rebinds `resolveEspionageDest`; UI names from `SYSTEMS` |
| Foreign offered accept | `boardJobs` hides offered spy off-home; `acceptJob` also refuses if `currentSystem !== origin` |
| Stuffed `progress` | Accept forces 0; pay still clamped; save tamper = mining cargo class |
| Stuffed `need` | Spy need must be exactly 1; else drop |
| Stuffed `payQuoted` | Clamp 0…20000 on sanitize and at pay; expire has no pay |
| Duplicate pay on restore | `failed` before pay; splice; expire has no pay branch |
| `__proto__` job id | Token `RESERVED_IDS`; drop `spy-__proto__-0` |
| Save retargets employer | No `job.faction`; read `SYSTEMS[origin].faction` |
| XSS in titles | `textContent`; strip on restore; regen from templates |
| `asteroidId` / mystery ids | Forbidden on spy cards |
| Data cargo mint | No grant; EXP UU stays null |
| Patrol freehold bleed copied | Spy uses dock `faction` |
| Digit overflow | Mouse Accept; do not cut slots |
| `state.js` dump | READ-ONLY |
| Boot-test unique ids | Untouched |
| New persist key | Forbidden |
| Cap formula eats siblings | Spy adds only `ESPIONAGE_ROOM` to live cap |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | station (later maybe `jobs.js`); save sanitize | station |
| Unique four | `makeJobs` when empty | boot-test |
| Mining/trade/hunt/passenger/explore slots | existing sync / replace | `boardJobs` |
| Espionage slots | `syncEspionageJobs` / replace | `boardJobs` |
| Overlay pirates | `syncPirateBounties` | `boardJobs` |
| `ctx.world.reputation` | spy complete → employer key | epics, standing, npc |
| `WORLD_FIELDS` `'jobs'` | save.js | restore |
| `state.js` | serial data owner only | **feature PRs read-only** |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (4508–4512).

---

## Acceptance direction (implementation wave)

From the wishlist, made testable for the **espionage** slice:

1. A Freehold Jobs board shows up to two spy cards plus today’s unique/overlay/mining/trade/hunt/passenger/explore rows.
2. Accept → dock the named rival station → redock origin: card gone, credits up, employer standing +2, **target standing unchanged**, **new** spy card on the origin board if a dest remains.
3. Completing again still yields a spy card when dests remain (career does not exhaust).
4. Origin is a real `SYSTEMS` key. Dest is a real `SYSTEMS` key with a station and a **different** `FACTIONS` key.
5. Reward, dest station name, and remaining time are visible before accept. System keys and clue ids are not printed.
6. After 600 s accepted without a file: no pay, no target delta, card replaced, state not `DONE`.
7. Restore of `__proto__` / `spy-__proto__-0` drops those rows; unique four and `mine-freehold-0` / `trade-freehold-0` / `hunt-freehold-0` / `passenger-freehold-0` / `explore-freehold-0` / `spy-freehold-0` remain; 10k-length heals to ≤ `live+ESPIONAGE_ROOM`; stuffed `destSystem` does not retarget pay; stuffed `job.faction` does not write; no throw; no extra credits; no data cargo.
8. Unique `bounty-ace` still exists. Overlay still posts up to 2 `bounty-pirate-*`. WAVE26 / WAVE35 behaviour unchanged.
9. Success does not debit the target faction. Expire does not debit the target faction.
10. No job field names an asteroid index. No new `WORLD_FIELDS`. No `innerHTML`. No `dataCrystal` / `dataCube` grant.

---

## Open owner questions

Defaults in the contract §12 **stand**. None of them block impl.

No blocking owner question. A later owner may still override slot count, origin-file vs dest-pay, +2 vs 0, or expose magnitude — until then, implement the defaults. Do not invent a new UU table, a third clock, a kill UU table, or faction-war cap terms while waiting.

**Closed Wave 82** — [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. Expose on accepted lapse/dest-fail: target **−2**, employer **0**, no pay. Success stays employer +2 / target 0. Write later (`station.js`).
2. Dest-dock gather is not expose. Docking dest only sets `progress`.
3. An origin with no rival-flag dest (rare) shows fewer than two cards. Empty slot legal.
4. Id prefix `spy-`. Kind remains `'espionage'`.
