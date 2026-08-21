# RIMWARD MSN-02 renewable faction-against-faction operations

| Field | Value |
|---|---|
| **Title** | RIMWARD MSN-02 renewable faction-against-faction operations |
| **Author** | Wave 79 MSN-02 war integrator |
| **Date** | 2026-08-21 |
| **Status** | Wave 80 first impl. Wave 83: success writes dest-faction −2 (`WAR_TARGET_DELTA`). |
| **Wave** | 80 first impl (brief Wave 79). |
| **Owner request** | MSN-02 faction-against-faction operations as a renewable Jobs-board family. Unique-four stay; Named Guns stay unique; overlay pirate cap stays; hunt family stays local pirates; no `state.js` write; no new persist key. |
| **Merge law** | [`out/w79/faction-war/shared-contract.md`](../out/w79/faction-war/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w79/faction-war/current-war-inventory.md`](../out/w79/faction-war/current-war-inventory.md) |
| Merge law | [`out/w79/faction-war/shared-contract.md`](../out/w79/faction-war/shared-contract.md) |
| Security review | [`out/w79/faction-war/security-review.md`](../out/w79/faction-war/security-review.md) |
| Design-doc review | [`out/w79/faction-war/code-review.md`](../out/w79/faction-war/code-review.md) |
| Wave 79 verify | [`out/w79/faction-war/verify.txt`](../out/w79/faction-war/verify.txt) |

---

## Overview

Wishlist MSN-02 wants **faction-against-faction operations** as a career, separate from hunting a **faction-level pirate threat**. Live today: unique `bounty-ace` and Named Guns are not renewable. Hunt (`kind: 'hunt'`) already owns local pirates. Completing unique cards still sets `DONE` and never posts a replacement. Mining, trade, hunt, passenger, and explore already occupy two renewable slots per system each.

Wave 79 freezes persist (extend `world.jobs` + raise sanitize cap by **war room only**), two war slots, one-in-one-out, rival-gate dest bind, patrol `recordId` quarry, origin `payQuoted` from live `PATROL_REWARD` 300, 600 s fail-closed deadlines, employer +2, **target write fail-closed until owner**, Digit 2 Jobs pane, Named Gun non-collision, and the serial PR plan. Unique four stay. Named Guns stay off this family. Missions other than renewable war do not change here.

Do **not** migrate or delete the unique four. Do **not** invent espionage numbers (sibling). Do **not** invent a kill UU (REP-04 sibling). `src/game/state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “jobs, hunt, Named Guns, and standing today”: [`out/w79/faction-war/current-war-inventory.md`](../out/w79/faction-war/current-war-inventory.md). Code wins over stale comments. Wave 70/75/77 inventory line numbers are stale.

| Surface | Today | Cite |
|---|---|---|
| Owner | `station.js` creates `ctx.world.jobs` if empty | `ensureJobs` 1767–1769; `initStation` 3153 |
| Unique cards | ace bounty, patrol, haul Provisions, ferry Provisions | `makeJobs` 1732–1765 |
| Mining/trade/hunt/passenger/explore | two slots per system each, one-in-one-out | `station.js` 189–193 |
| Overlays | pirate bounties cap 2; one recovery wreck | 1794–1863; `PIRATE_BOUNTY_CAP` 187 |
| Unique/overlay complete | `state = 'done'`; trust/favor; no splice | `completeJob` 2746–2750; overlay 3081–3089 |
| Renewable complete | `failed` first, pay, splice, replace | `tickDeliveryJobs` 2788–3066 |
| Board filter | hide foreign **offered** pirate/recovery/mining/trade/hunt/passenger/explore; show unique `DONE` | `boardJobs` 2672–2687 |
| Overlay pay | `jobPay(current, job.reward)`; no `payQuoted`; no deadline; no employer rep | 3086–3089 |
| Mining/trade/hunt/passenger/explore pay | `payQuoted` via **origin** `jobPayFor`; clamp 20000 | 2695–2698, 3496, 3525, 3559, 3590, 3618 |
| Patrol rep | **`reputation.freehold += PATROL_REP`** | 2777 |
| Renewable rep | +2 employer `SYSTEMS[origin].faction` | `MINING_REP` 194; 2656–2658, 2893–2895, … |
| Persist | `WORLD_FIELDS` `'jobs'`; autosave `rimward-save-v1` | `save.js` 65, 78 |
| Sanitize | hyphen tokens, proto drop, kind/state allowlist, cap `4+10*N+16` (**1020** at 100) | `save.js` 115–129, 209–221, 546–599 |
| `JOB_KINDS` | no `'war'` | `save.js` 138 |
| Events | `'commLine'` among frozen types; no `job*` type | `ctx.js` 198–228 |
| UI | Digit 2; `h()` `textContent`; digit accept by index | 152, 3208–3213, 4306–4400, 4428–4431 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| Record id | `` `rec-${nextRecordNum++}` `` | `world.js` 252, 285 |
| Patrol seed | `i===0` dock faction; `i>=1` `gates[0]` dest faction | `world.js` 327, 374–385 |
| Pirates migrate? | **never** | `world.js` 30 |
| Incidents | `name` + `causer` + `faction` + `role`; **no record id** | `world.js` 1332–1346 |
| Named Guns | `ACES` / `NAMED_GUNS` `role: 'ace'` | `state.js` 827–901 |
| NPC “hunt” | AI **mode** for pirates, not a job kind | `npc.js` 200 |
| Patrol hostility floor | standing ≤ **-10** | `npc.js` 87 |

There is no `kind: 'war'`. Unique patrol is not a career slot machine. Hunt is not faction-against-faction.

### Pain points

- Wishlist MSN-02 faction-against-faction: the board has no overt employer-vs-target career. Hunt is local pirates. Unique ace is Named Guns.
- REP-04 wants employer up and target down. Live Jobs never decrement a target key. Target delta is **proposed, needs owner**.
- Stuffing war into `'hunt'`, `'bounty'`, or `'patrol'` collides with pirate career, overlay DONE leak, or hardcoded Freehold.
- Live cap 1020 holds five renewable families + unique four + overlay headroom. Two war slots per system need **`WAR_ROOM`**, not eviction.
- `job.faction` is not on the allowlist. Target must bind from `SYSTEMS[dest].faction` after a live dest rebound.
- Kill attribution is a sibling. War must not invent a crime score or a kill UU.
- Patrol hostility floor -10 is live. War must not retune it. Until target write is authored, war complete does not move that floor.

### Why now (design) / why not now (code)

The owner asked for the MSN-02 war brief after Wave 78 hunt/passenger/explore. Inventory and merge law exist. Implementation waits for a later serial so cap, kind allowlist, dest rebound, and fail-closed target write land against a frozen contract instead of a drive-by `'patrol'` slot.

---

## Goals & Non-Goals

### Goals

1. Document the live board, unique four, five renewable families, overlay pirate bounties, Named Guns, Digit 2, `sanitizeJobs`, reputation writers, and patrol hunt floor from **live code**.
2. Freeze extend-`world.jobs` (no new persist key) and a **raised** sanitize cap = `live_cap_at_impl + WAR_ROOM`.
3. Freeze renewable **war** as the next vertical slice: two slots, one-in-one-out, rival-gate dest, patrol record bind, origin `payQuoted`, 600 s fail-closed.
4. Freeze XSS / proto ids / stuffed pay / stuffed dest / reputation-key injection law.
5. Keep unique `bounty-ace` as faction-level. Keep overlay cap 2. Keep hunt as local pirates. Name espionage without inventing sibling numbers.
6. Freeze a serial PR plan: sanitize kind+cap → cards/sync → complete/expire/replace → Digit 2 UI → boot pins.
7. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 79. No `src/` edits. No `scripts/` / `public/` / `package.json`.
- No HUD-02 chart marks. No AST `asteroidId`. No POD reopen. No SHP hull grants. No BIO graft. No EXP SKU. No TGT-05. No NPC missiles. No power ledger.
- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No parallel `world.missions` array. No new `WORLD_FIELDS`. No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows.
- Do not migrate `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` in this serial.
- Do not retire overlay pirate rows. Do not post war against Named Guns / unique ace / hunt pirates.
- Do not specify espionage **numbers** (sibling). Do not invent police restitution (REP-03). Do not invent a kill UU.
- Do not ship a target-faction standing delta until the owner authors it (fail closed).
- Do not edit the wishlist, `PROGRESS.md`, sibling briefs, or listed closed design docs.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Extend `world.jobs` | Already on `WORLD_FIELDS`. Contract §0.2 |
| Replace unique four? | **No** in this serial | Boot-test pins. Contract §0.19 |
| First war family kind? | **`war`** (`kind: 'war'`) | Unused in `JOB_KINDS` (`save.js` 138). Must not collide with hunt/bounty/patrol. Contract §0.3 |
| Faction-level pirate? | Unique `bounty-ace` + Named Gun records | Wishlist split. Contract §0.4 |
| Overlay / hunt reuse? | **No.** New kind + slots | Inventory §7. Contract §0.6 |
| Board slot? | 2 war jobs per system (offered or accepted); empty legal | Mining/trade/hunt precedent. Contract §0.5 |
| Replacement? | Splice + immediate new war job same system+slot if a quarry exists | MSN-01. Contract §2.3 |
| Live cap? | `4+10*N+16` = **1020** at 100 systems | `save.js` 123–129 |
| New cap? | `live_cap_at_impl + WAR_ROOM` (**1220** at inventory-time 100) | Contract §0.7, §1.2. **No** espionage term |
| Drop other families to fit? | **Never** honest offered mining/trade/hunt/passenger/explore | Contract §0.7 |
| Target id? | Live `record.id` `rec-<n>`; no `asteroidId` | `world.js` 285. Contract §0.8 |
| Target faction bind? | `SYSTEMS[warDestId(origin)].faction` | Live table, not `job.faction`. Contract §3.3 |
| Accept where? | Origin dock only | Contract §3.7 |
| Claim where? | Space-side after witnessed kill (hunt cadence). No origin-dock AND | Contract §3.1, §3.6 |
| `payQuoted`? | Stamp on accept via **origin** `jobPayFor(PATROL_REWARD)`; clamp 0…20000 | Live 300. Contract §0.10 |
| Deadline? | 600 s (`MINING_DEADLINE` / `WRECK_TTL`); restart on accept; expire fail closed | cite `station.js` 196; `world.js` 811. Contract §0.9 |
| Employer rep? | +2 `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS)` | `MINING_REP` 194. Contract §0.11 |
| Target-faction delta? | **Fail closed (no write)** until owner. Candidate 2 is not shippable | REP-04. Contract §5 |
| Kill UU / crime score? | **No** this serial | Sibling. Contract §0.15 |
| `innerHTML`? | **No** | Live `h()` is `textContent`. Contract §0.12 |
| Job ids | Hyphen **tokens**; war id `war-<SYSTEMS key>-<n>` | Never `SAFE_ID.test(job.id)`. Contract §0.14, §1.3 |
| UI | Jobs pane, Digit 2 only; print name not `rec-n` | Contract §0.12, §4 |
| `state.js` | READ-ONLY | Contract §0.13 |
| New event? | **No** | Prefer `commLine`. Contract §0.13 |
| Espionage numbers? | Sibling Wave 79 | Contract §0.15, §9 |

### 2. Current board (do not break)

See inventory §§1–6. The load-bearing loop is:

1. `initStation` → `ensureJobs` → `makeJobs` if empty (unique four).
2. Each Jobs render: refresh ace, sync pirates, sync recovery, sync mining, sync trade, sync hunt, sync passenger, sync explore.
3. Accept stamps haul/ferry quotes (dest `jobPayFor`) and family quotes (origin `jobPayFor`); ferry fronts cargo. Overlay/ace accept is a state flip only.
4. Ticks complete patrol (frame), delivery (0.5 s). Renewable expire/replace live in that tick. Overlay/ace pay in that tick via `completeJob`.
5. Unique `completeJob` marks `done` and banks dockmaster trust. Overlay bounty also banks fence favor (`kind === 'bounty'`).

**This serial must not change step 1’s four ids, unique haul/ferry quote stamps, Wave 35 haul dest bind, overlay cap/ids, hunt pirate bind, or Named Gun records.** War is additive: extra sync on render, extra branch in delivery tick, extra cards in `boardJobs`, extra kind in `sanitizeJobs`.

Digit 2 and `DOCK_KEY_SERVICES` stay. Digit 0 stays shipyard.

### 3. Persist: raise `sanitizeJobs`

Restore already heals jobs (`save.js` 864). That is the trust boundary.

Later PR1: extend `sanitizeJobs`. Shape, hyphen-token ids, proto drop, **`'war'` kind**, `recordId` / dest / slot / need 1, cap: contract §1.

**Ids:** live `SAFE_ID` (`/^[a-z0-9_]+$/i`) rejects hyphens. `bounty-ace` and `war-freehold-0` must survive restore. Sanitize splits on `-` and runs the `SAFE_ID` character class on **each token**, then `RESERVED_IDS` on the full string and every token. Unique four are an exact allowlist. Do not rewrite them to underscores. Do not copy `pirateBountyId`.

**Cap:** live `JOBS_SANITIZE_MAX = 4 + 10N + 16` (**1020** at 100 systems, `state.js` 541). New: `live_cap_at_impl + 2 * N_SYSTEMS` (**1220** at inventory-time 100). A cap of 1020 cannot hold two extra war slots per system. Drop order never removes the unique four, accepted jobs, honest offered mining/trade/hunt/passenger/explore, or honest offered war (one of two slots per `originSystem` per kind).

Do **not** write `4 + 12*N + 16` as a formula that pretends espionage already shipped. That room belongs to a sibling worker. War impl **adds `WAR_ROOM` to whatever cap is live**.

`ensureJobs` still seeds the unique four when the array is empty after heal. War fill is `syncWarJobs`, not `makeJobs`. Hunt fill stays `syncHuntJobs`. Overlay fill stays `syncPirateBounties`.

### 4. Board slots and one-in-one-out

A **war slot** is `kind === 'war'` + `originSystem` + `slot` ∈ {0,1}. Independent from mining, trade, hunt, passenger, explore, and overlay.

```
renderJobs
  → syncPirateBounties / syncRecoveryJob / syncMiningJobs / syncTradeJobs
    / syncHuntJobs / syncPassengerJobs / syncExploreJobs (unchanged)
  → syncWarJobs(currentId)   // pull ineligible offered ghosts; fill missing slots; skip if no quarry

war complete or expire
  → splice that job
  → push replacement for same originSystem + slot if a quarry exists
  → render if the Jobs pane is open
```

Offered war: home dock only (mining/pirate/recovery/hunt/passenger/explore/trade precedent).  
Accepted war: visible on every Jobs board so the player can see quarry name, dest, and deadline.

Unique `DONE` rows remain until a later serial. This slice must not add war to that clutter (`failed` is transient). Overlay `DONE` leak stays overlay’s problem.

No eligible patrol in an existing origin/dest bank: **do not post**. Do not fabricate a quarry (Witness Rule). Do not `ensureBank` dest from Jobs.

### 5. War vertical slice

**Beats:**

1. Dock home → Jobs → up to two war cards (named dest-faction patrols). Hunt/overlay cards may still name pirates. Unique ace still names a Named Gun.
2. Accept. Reward, quarry name, employer flag, target flag, remaining time are visible before and after accept (wishlist acceptance).
3. Destroy the bound patrol with a player-caused incident. Record becomes `dead`/`captured`.
4. Delivery tick (space-side, hunt cadence) pays `payQuoted`, +2 employer rep (origin faction), **no target write**, dockmaster trust as mining (not fence favor), splice, new card on the **origin** board if another quarry exists. Do not wait for origin redock: incidents are a 40-row ring (`world.js` 813).
5. Ignore a card for 600 s: posting withdraws, replacement appears. Ignore an accepted card: fail closed, no pay, replacement.

**Not:** unique ace. **Not:** Named Gun hunter/aspirants. **Not:** local pirate hunt. **Not:** unique `patrol-lane`. **Not:** a lock on a rock. **Not:** cargo. Accept only at the origin dock (`currentSystem === originSystem`). `need` is exactly 1 (sanitize drops any other war need).

**Pay:** `jobPayFor` at the **origin** dock, live `PATROL_REWARD` 300. Stamp `payQuoted` on accept so epic/faction shifts cannot move the agreement (Wave 26 law; mining origin stamp). Unique patrol remains unstamped current-system `jobPay`.

**Quarry bind:** pay uses `recordId` → origin or dest bank record → `rec.name` for incident match. Stuffed `job.target` cannot retarget payout. UI name also resolves through that lookup.

**Dest bind:** `warDestId` = first `SYSTEMS[origin].gates[i].to` whose faction ≠ origin faction and both keys sit on `FACTIONS`. Pay/UI rebind. Stuffed `destSystem` cannot retarget standing.

### 6. Deadlines

Live mining/trade/hunt/passenger/explore already use `deadline` vs `world.time` and fail closed. War uses the same clock. Do not invent a third clock.

| State | Timer | On fire |
|---|---|---|
| offered | `deadline = postTime + 600` | withdraw, replace |
| accepted | `deadline = acceptTime + 600` (restarts) | fail closed, replace |

600 s is ~10 minutes. A dest-gate hop plus a patrol fight is a generous window (MSN-01).

Expire must not call the pay path. A restored job with `deadline` in the past expires on the next 0.5 s tick.

There is no `failed` row left on the board after replace. `failed` exists so a crash mid-replace cannot pay twice (mining 2885–2886).

Offered war whose quarry is already `dead`/`captured` fail-closed replaces (no pay).

### 7. UI (Jobs pane only)

Stay inside `renderJobs`. Two menu levels remain (`station.js` header §12.1). Digit **2**. No new Digit. No HUD glance (HUD-02 closed).

Each war card (all `textContent`):

- Title / detail from templates using live `rec.name` after `stripControlChars` / `NAME_MAX` (else stripped snapshot; never print `recordId`), dest station name from rebound `SYSTEMS`, employer and target **display names** from `factionDisplayName`.
- Reward line with stamped or live quote (origin `jobPayFor(PATROL_REWARD)` for offered; `payQuoted` for accepted).
- If offered: Accept (n). Deadline remaining as whole seconds or minutes (reuse mining label helper).
- If accepted: `ACCEPTED — strike <name> · t left`.

No `innerHTML`. No `job.faction` as a write source. No `recordId` / clue ids on the card. `reducedMotion`: no extra animation; copy stays.

Home board can exceed 9 cards (unique four + overlays + 2× six renewable families). Digit 1–9 cannot accept past index 8; **mouse Accept still works** (live Accept buttons). That is existing UX, not a reason to cut to one slot (contract §12.2).

### 8. Reputation and later REP

War success writes **employer faction only**, `Object.hasOwn(FACTIONS, key)`, **+2** (mining). Expire writes nothing. Overlay bounty still writes no rep. Unique patrol still writes hardcoded Freehold.

Do not copy patrol’s `reputation.freehold +=` (`station.js` 2777) into war.

Do not write target standing until the owner authors a finite delta (`docs/RepStandingDesign.md` §7). Candidate magnitude 2 is a note, not a shippable number. Fail closed: the card still completes with employer +2 only.

Do not invent a kill-attribution path (REP-04 sibling). Board complete uses Witness Rule incidents plus record state, like hunt. Do not AND origin-dock (explore’s dock claim is durable `mystery.visited`; war has no such key).

Espionage (secret success, exposed failure) is wishlist REP-04. **A sibling owns that brief.** Do not invent police restitution.

### 9. Serial PR plan

Matches contract §8. **Named only. Do not implement in Wave 79.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize kind+cap** | `'war'` kind; `war-<sys>-<n>` ids; `recordId`/dest/slot/need; cap `live_cap + WAR_ROOM`; proto / kind / state allowlist; unique four kept; honest mining/trade/hunt/passenger/explore kept | Sync, UI, pay, unique migration, whole-string `SAFE_ID`, espionage room, target write |
| **PR2 cards/sync** | fill ≤2 slots; accept origin-only; origin `payQuoted`; dest rebound | Expire, replace, other families |
| **PR3 complete/expire/replace** | space-side witness; one-in-one-out; 600 s fail closed; empty slot if no quarry; employer +2; no target write | MSN-03, unique migration, overlay retirement, kill UU; origin-dock AND |
| **PR4 Digit 2 UI** | remaining time + quarry name + dest/employer names; `textContent` only | HUD-02, Digit 0, People desk, `rec-` ids, clue text |
| **PR5 boot pins** | keep unique four + `mine-freehold-0` + `trade-freehold-0` + `hunt-freehold-0` + `passenger-freehold-0` + `explore-freehold-0` + `war-freehold-0`; drop `war-__proto__-0`; fit `live+WAR_ROOM`; complete→new card; expire no pay; stuffed target/dest ignored; WAVE26/WAVE35 unique haul still pass; `bounty-ace` still exists | wishlist / PROGRESS |

`state.js` untouched. Authored copy is strings in `station.js` / a tiny `jobs.js`, not a table dump. No `src/` scheduled this wave.

### 10. Coupling

| Neighbour | Coupling | Law |
|---|---|---|
| Mining/trade/hunt/passenger/explore | Shared `world.jobs`, `sanitizeJobs`, Digit 2, `tickDeliveryJobs`, `boardJobs` | Grow cap by `WAR_ROOM`. Independent slots. Never drop honest rows. Do not reuse those kinds |
| Overlay pirates | Same pane | Cap 2 stays. Different quarry (pirate vs patrol) |
| Unique ace / Named Guns | Same pane; world.js lineage | Not a war quarry. `bounty-ace` stays |
| Unique patrol | Same pane; pirate sweep | Untouched. Do not copy `freehold +=` |
| Espionage | Shared future cap | Sibling worker. **No numbers here** |
| EXP data | Mystery clues | Do not print clue ids on Jobs. No data cargo grant |
| POD survivors | People Digit 7 | No `survivor` on jobs |
| BIO grafts | Feed Digit | Unchanged |
| SHP | Digit 0 | No hull grants |
| TGT-05 | `ctx.targets` | Jobs do not write locks |
| REP | Standing bag | Employer +2 on success only. Target fail-closed. No patrol `freehold` copy. No kill UU |
| NPC patrols | Records / AI loiter; hostility -10 | Read records. Do not change AI. Do not retune -10 |

### 11. Non-goals (expanded)

- Passenger ferry as survivor cargo (POD closed).
- Turning Standing epics into scripted quests (`epics.js` stays requirement auto-advance).
- Mystery clues as board jobs (EXP / explore).
- Police hail / restitution.
- Mission-granted ships, scanners, or mining heads (outfitter stays UU).
- Changing unique ace or overlay to origin `payQuoted`.
- `ctx.js` default `jobs: []` is optional; not required if `ensureJobs` remains the creator.
- NPC missiles / power ledger.
- Renewable Named Guns.

---

## Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Unique four vanish on restore | Exact allowlist; hyphen tokens; boot pins |
| Honest mining/trade/hunt/passenger/explore dropped for war room | Cap `live + WAR_ROOM`; drop order never evicts honest rows |
| Overlay retired by accident | Cap 2 / ids / `completeJob` stay |
| Named Gun as renewable slot | Eligibility forbids ace role/classKey and ACES/NAMED_GUNS names |
| Hunt pirates retargeted as war | War quarry `role === 'patrol'` only |
| Unique patrol overwritten | Kind `'war'`; unique id exact allowlist |
| Double pay two war slots | One `recordId` per slot; extra-drop duplicates; `failed` before pay |
| Unique haul dest bind broken | Do not edit Wave 35 branch; PR5 still passes WAVE26/WAVE35 |
| Unreachable quarry | Skip post if no eligible record in an existing bank; do not `ensureBank` |
| Target injection | Pay rebinds `recordId` → `rec.name`; dest rebinds `warDestId`; UI names from record + `factionDisplayName` |
| Foreign offered accept | `boardJobs` hides offered war off-home; `acceptJob` also refuses if `currentSystem !== origin` |
| Stuffed `need` | War need must be exactly 1; else drop |
| Stuffed `payQuoted` | Clamp 0…20000 on sanitize and at pay; expire has no pay |
| Duplicate pay on restore | `failed` before pay; splice; expire has no pay branch |
| `__proto__` job id | Token `RESERVED_IDS`; drop `war-__proto__-0` |
| Save retargets employer/target | No `job.faction`; read `SYSTEMS[origin].faction` / `SYSTEMS[warDestId].faction` |
| XSS in titles | `textContent`; strip on restore; regen from templates |
| `asteroidId` / mystery ids / data cargo | Forbidden on war cards |
| Patrol freehold bleed copied | War uses dock `faction` |
| Target write ships without owner | Fail closed; candidate 2 not shippable |
| Kill UU sneaks in | Complete uses incidents + record only (space-side) |
| Digit overflow | Mouse Accept; do not cut slots |
| `state.js` dump | READ-ONLY |
| Boot-test unique ids | Untouched |
| New persist key | Forbidden |
| Cap formula eats siblings | War adds only `WAR_ROOM` to live cap. No espionage term |
| Hostility floor retuned | `HOSTILE_STANDING` untouched |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | station (later maybe `jobs.js`); save sanitize | station |
| Unique four | `makeJobs` when empty | boot-test |
| Mining/trade/hunt/passenger/explore slots | existing sync / replace | `boardJobs` |
| War slots | `syncWarJobs` / replace | `boardJobs` |
| Overlay pirates | `syncPirateBounties` | `boardJobs` |
| `ctx.world.reputation` | war complete → employer key only | epics, standing, npc |
| `WORLD_FIELDS` `'jobs'` | save.js | restore |
| `state.js` | serial data owner only | **feature PRs read-only** |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (4508–4512).

---

## Acceptance direction (implementation wave)

From the wishlist, made testable for the **war** slice:

1. A Freehold Jobs board shows up to two war cards plus today’s unique/overlay/mining/trade/hunt/passenger/explore rows.
2. Accept → destroy the named dest-faction patrol with a player-caused incident: card gone, credits up, employer standing +2, **target standing unchanged**, **new** war card on the origin board if a quarry remains. Origin redock is **not** required.
3. Completing again still yields a war card when eligible patrols remain (career does not exhaust).
4. Origin is a real `SYSTEMS` key. Dest is a real other `SYSTEMS` key from `warDestId`. Quarry `recordId` is `rec-<n>`. Role is `patrol`, not `pirate`, not `ace`.
5. Reward, quarry name, employer name, target name, and remaining time are visible before accept. `recordId` is not printed.
6. After 600 s accepted without a witnessed kill: no pay, card replaced, state not `DONE`.
7. Restore of `__proto__` / `war-__proto__-0` drops those rows; unique four and `mine-freehold-0` / `trade-freehold-0` / `hunt-freehold-0` / `passenger-freehold-0` / `explore-freehold-0` / `war-freehold-0` remain; 10k-length heals to ≤ `live+WAR_ROOM`; stuffed `target` / `destSystem` do not retarget; no throw; no extra credits; no `job.faction` copy.
8. Unique `bounty-ace` still exists. Overlay still posts up to 2 `bounty-pirate-*`. Hunt still posts local pirates. WAVE26 / WAVE35 behaviour unchanged.
9. Named Guns are not renewable war quarries.
10. No job field names an asteroid index. No new `WORLD_FIELDS`. No `innerHTML`. No clue text. No data cargo grant.

---

## Open owner questions

Defaults in the contract §12 **stand**. None of them block impl.

No blocking owner question. A later owner may still override slot count, origin-dock vs space-side claim, or +2 vs 0 — until then, implement the defaults. Do not invent a new UU table, a third clock, a target-faction write, a kill UU, or espionage cap terms while waiting.

**Closed Wave 82** — [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. Target standing on war **success:** **−2**. Employer +2 stays. Expire writes nothing. Write later (`station.js`).
2. Verge / Hush (`cast.patrols === 0`) may show zero war cards. Empty slots legal.
3. Claim is **space-side**.
4. Pay stays live `PATROL_REWARD` 300.
