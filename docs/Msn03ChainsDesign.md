# RIMWARD MSN-03 authored faction reward chains

| Field | Value |
|---|---|
| **Title** | RIMWARD MSN-03 authored faction reward chains |
| **Author** | Wave 81 MSN-03 chains integrator |
| **Date** | 2026-08-21 |
| **Status** | Wave 83 first impl (`kind: 'chain'`, 12 authored ids, owner SKU map). |
| **Wave** | 81 — markdown only. |
| **Owner request** | Rare or unique equipment from authored, faction-specific mission chains rather than the ordinary procedural pool. Unique four stay; EPICS stay Standing; no `state.js` write; no new persist key unless jobs cannot hold progress. |
| **Merge law** | [`out/w81/msn03/shared-contract.md`](../out/w81/msn03/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w81/msn03/current-msn03-inventory.md`](../out/w81/msn03/current-msn03-inventory.md) |
| Merge law | [`out/w81/msn03/shared-contract.md`](../out/w81/msn03/shared-contract.md) |
| Security review | [`out/w81/msn03/security-review.md`](../out/w81/msn03/security-review.md) |
| Design-doc review | [`out/w81/msn03/code-review.md`](../out/w81/msn03/code-review.md) |

---

## Overview

Wishlist MSN-03 wants **authored faction reward chains**. Rare or unique equipment must come from those chains, not from mining/trade/hunt/passenger/explore/spy/war refill. Live today: seven renewable families occupy two slots per system each. Unique four stay one-shot. Overlay pirate cap is 2. One recovery wreck. Sanitize cap is `4+14*N+16` (**1420** at 100). There is no `kind: 'chain'`.

EPICS already exist (`src/game/state.js` `EPICS`) as standing stages with multipliers. They are **not** mission chains. Digit 9 Standing must not grow Jobs cards. Jobs must not advance `ctx.world.epics`.

Wave 81 freezes persist (extend `world.jobs` + raise sanitize cap by **CHAIN_ROOM only**), four short authored chains (one per EPICS faction), three steps, one-in-one-out, **no** 600 s deadline, origin `payQuoted` from live `PATROL_REWARD`, employer +2, **no** target-faction write, unique-equipment grant **fail-closed** until the owner names live SKUs, Digit 2 Jobs pane, and the serial PR plan. Unique four stay. MSN-02 families do not change here.

Do **not** migrate or delete the unique four. Do **not** add `2*N` family room. Do **not** invent dart/turret/graft **mission** prices. Do **not** invent kill UU, spy expose, or war target-rep. `src/game/state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “jobs, Digit 2, reputation, EPICS, hangar today”: [`out/w81/msn03/current-msn03-inventory.md`](../out/w81/msn03/current-msn03-inventory.md). Code wins over stale comments. Wave 70/77/79 inventory line numbers are stale.

| Surface | Today | Cite |
|---|---|---|
| Owner | `station.js` creates `ctx.world.jobs` if empty | `ensureJobs` 1772–1775; `initStation` 3787 |
| Unique cards | ace bounty, patrol, haul Provisions, ferry Provisions | `makeJobs` 1737–1770 |
| Mining…war slots | two per system each | `station.js` 189–195 |
| Overlays | pirate bounties cap 2; one recovery wreck | `PIRATE_BOUNTY_CAP` 187; render 4355–4357 |
| Unique/overlay complete | `state = 'done'`; trust/favor; no splice | `completeJob` 3249–3253 |
| Family complete | `failed` first, pay, splice, replace | `tickDeliveryJobs` 3292+ |
| Board filter | hide foreign **offered** families/overlays; show unique `DONE` | `boardJobs` 3174–3189 |
| Family pay | `payQuoted` via **origin** `jobPayFor`; clamp 20000 | accept 4099+; `save.js` 134 |
| Patrol rep | **`reputation.freehold += PATROL_REP`** | 3280 |
| Family / spy / war rep | +2 employer `SYSTEMS[origin].faction` | `MINING_REP` 196; spy 3625–3627; war 3098–3101 |
| Spy / war target | **0** | no dest-faction write |
| `KILL_STANDING_DELTA` | **null** | `kill-standing.js` 5 |
| Persist | `WORLD_FIELDS` `'jobs'`; autosave `rimward-save-v1` | `save.js` 65, 78 |
| Sanitize | hyphen tokens, proto drop, kind/state allowlist, cap `4+14*N+16` (**1420** at 100) | `save.js` 115–133, 144, 215–227, 273–465, 692–757 |
| `JOB_KINDS` | no `'chain'`, no `'epicJob'` | `save.js` 144 |
| Events | `'commLine'` only; no `job*` type | `ctx.js` 198–227 |
| UI | Digit 2; `h()` `textContent`; digit accept | 152, 3842–3847, 4349, 5208–5211 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| EPICS | 4 factions × stages; Digit 9; multipliers | `state.js` 755–816; `renderEpics` 4977 |
| Hangar SKUs | `dart` 6500; turret `auto` 4200; graft no debit | `weapon-fit.js` 33–54; `hangar.js` 731 |

There is no authored chain. Outfitter already sells dart/turret for UU.

### Pain points

- Wishlist MSN-03: unique gear should be a faction story, not another `mine-freehold-n` haul. Stuffing a SKU onto `'patrol'` or an EPICS stage would either exhaust the unique four or turn Standing into a shop.
- Live cap 1420 holds seven families + unique four + overlay headroom. Chains need a **small authored** `CHAIN_ROOM`, not `2*N`.
- EPICS already consume Digit 9 and `world.epics`. A Jobs kind named `'epicJob'` would collide in the player’s head and in reviews.
- `writeMountedGear` can seat `dart`/`auto` **if** the hull has a hardpoint. Light starters cannot. A grant PR that ignores `canSeat` would silently no-op or need a hull the chain must not mint (SHP closed).
- Family 600 s expire would drop a three-step unique reward if the player flies a long way. Unique four have **no** deadline.

### Why now (design) / why not now (code)

The owner asked for the MSN-03 brief after Wave 80 shipped spy and war. Inventory and merge law exist. Implementation waits for a later serial so cap, kind allowlist, authored ids, and fail-closed grants land against a frozen contract instead of a drive-by thirteenth `makeJobs` row. Sibling Wave 81 workers own TGT lock cats and BIO class look; this brief does **not** wait on their files.

---

## Goals & Non-Goals

### Goals

1. Document the live board, unique four, seven renewable families, overlays, Digit 2, `sanitizeJobs`, reputation writers, EPICS, hangar SKUs, and Witness Rule from **live code**.
2. Freeze extend-`world.jobs` (no `world.chains`) and a **raised** sanitize cap = `live_cap_at_impl + CHAIN_ROOM` with `CHAIN_ROOM = 4 + 3 = 7`.
3. Freeze four authored chains (EPICS factions only), three steps, one-in-one-out, **no** deadline, origin `payQuoted`.
4. Freeze employer +2, target 0, unique-equipment grant fail-closed until owner.
5. Freeze XSS / proto ids / stuffed pay / stuffed origin / reputation-key injection / SKU injection law.
6. Keep unique four. Keep overlay cap 2. Keep EPICS on Digit 9.
7. Freeze a serial PR plan: sanitize cap/kind → cards/sync → complete/splice → Digit 2 UI → boot pins.
8. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 81. No `src/` edits. No `scripts/` / `public/` / `package.json`.
- No HUD-02 chart marks. No AST `asteroidId`. No POD reopen. No SHP hull grants. No BIO graft desk. No EXP SKU / drop % / Archive UU. No TGT-05. No NPC missiles. No power ledger.
- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No parallel `world.chains` / `world.missions` array. No new `WORLD_FIELDS`. No new frozen event.
- No `state.js` feature rewrite. No new `COMMODITIES` rows. No new `EPICS` stages.
- Do not migrate `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` in this serial.
- Do not reopen MSN-02 families or their `2*N` rooms. Do not reset `ESPIONAGE_ROOM` / `WAR_ROOM`.
- Do not invent dart/turret/graft **mission** prices. Do not invent kill UU, spy expose, or war target-rep.
- Do not edit the wishlist, `PROGRESS.md`, sibling briefs, or listed closed design docs.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Extend `world.jobs` | Already on `WORLD_FIELDS`. Jobs can hold authored ids. Contract §0.2 |
| `world.chains`? | **No** this serial | Prefer extend-jobs. Contract §0.2 |
| Replace unique four? | **No** in this serial | Boot-test pins. Contract §0.4, §0.17 |
| Kind? | **`chain`** | Unused in live `JOB_KINDS`. Not `'epicJob'`. Contract §0.3 |
| Renewable 2-slot family? | **No** | Authored count. Contract §0.4 |
| Replacement? | Splice step N → post N+1; last step `done` sentinel | Contract §0.5, §2.2 |
| Live cap? | `4+14*N+16` = **1420** at 100 systems | `save.js` 115–133 |
| New cap? | `live_cap_at_impl + CHAIN_ROOM` (**1427** at inventory-time 100) | `CHAIN_ROOM = 4 + 3`. Contract §0.6 |
| Drop shipped families to fit? | **Never** | Contract §0.6 |
| Deadline? | **None** | Unique-four precedent. Contract §0.8 |
| Employer? | `SYSTEMS[origin].faction` at authored dock | Not `job.faction`. Contract §0.10, §3.2 |
| Target rep? | **0** | Contract §0.10, §0.15 |
| SKU grant? | **Proposed, needs owner.** Fail closed (credits +2 only) | Contract §0.11, §3.5 |
| `innerHTML`? | **No** | Live `h()` is `textContent`. Contract §0.12 |
| Job ids | Exact `chain-<employer>-<1\|2\|3>` | Not `spy-<sys>-<n>`. Contract §0.14, §1.3 |
| UI | Jobs pane, Digit 2 only; hide done chain | Contract §0.12, §4 |
| `state.js` | READ-ONLY | Contract §0.13 |
| New event? | **No** | Prefer `commLine`. Contract §0.13 |
| EPICS? | Digit 9 only; no Jobs mix | Contract §0.18 |

### 2. Current board (do not break)

See inventory §§1–6. The load-bearing loop is:

1. `initStation` → `ensureJobs` → `makeJobs` if empty (unique four).
2. Each Jobs render: refresh ace, sync pirates, sync recovery, sync mining, trade, hunt, passenger, explore, espionage, **war**.
3. Accept stamps haul/ferry quotes (dest `jobPayFor`) and family quotes (origin `jobPayFor`); ferry fronts cargo.
4. Ticks complete patrol (frame), delivery (0.5 s). Families expire/replace live in that tick. Overlay/ace pay in that tick via `completeJob`.
5. Unique `completeJob` marks `done` and banks dockmaster trust. Overlay bounty also banks fence favor (`kind === 'bounty'`).

**This serial must not change step 1’s four ids, unique haul/ferry quote stamps, Wave 35 haul dest bind, overlay cap/ids, or shipped family kinds.** Chains are additive: extra sync on render, extra branch in delivery tick, extra cards in `boardJobs`, extra kind in `sanitizeJobs`.

Digit 2 and `DOCK_KEY_SERVICES` stay. Digit 0 stays shipyard. Digit 1 Market / Archive stay. Digit 9 Standing stays.

### 3. Persist: raise `sanitizeJobs`

Restore already heals jobs (`save.js` 1021). That is the trust boundary.

Later PR1: extend `sanitizeJobs`. Shape, hyphen-token ids, proto drop, **`'chain'` kind**, exact 12-id allowlist, cap: contract §1.

**Ids:** live `SAFE_ID` (`/^[a-z0-9_]+$/i`) rejects hyphens. `bounty-ace` and `chain-freehold-1` must survive restore. Sanitize splits on `-` and runs the `SAFE_ID` character class on **each token**, then `RESERVED_IDS` on the full string and every token. Unique four are an exact allowlist. Chain ids are an exact allowlist. Do not rewrite them to underscores.

**Cap:** live `JOBS_SANITIZE_MAX = 4 + 14N + 16` (**1420** at 100 systems, `state.js` 541). New: `live_cap_at_impl + CHAIN_ROOM` with `CHAIN_ROOM = UNIQUE_FOUR_HEADROOM + CHAIN_STEPS = 4 + 3 = 7` (**1427** at inventory-time 100). Four live-or-done sentinels plus three splice ghosts. A cap of 1420 can hold 7 extra rows in overlay slack on a quiet board, but honest overlay (16) plus four chain rows can collide. **Raise by 7.** Do **not** write `4 + 16*N + 16`. Do **not** reset spy/war rooms.

Drop order never removes the unique four, accepted jobs, honest offered families, the one honest live chain step per employer, or a finished chain’s `done` sentinel.

`ensureJobs` still seeds the unique four when the array is empty after heal. Chain fill is `syncChainJobs`, not `makeJobs`. Family fills stay their sync functions.

**Why not `world.chains`:** kind `'chain'` is free; authored ids do not collide with `spy-<sys>-<n>`; a `done` last-step row is enough progress. A new `WORLD_FIELDS` key would be a second restore healer for a dozen rows.

### 4. Board slots and one-in-one-out

A **chain live row** is `kind === 'chain'` + exact id `chain-<employer>-<step>`. Independent from mining, overlays, and unique four.

```
renderJobs
  → syncPirateBounties / syncRecoveryJob / syncMiningJobs / … / syncWarJobs (unchanged)
  → syncChainJobs(currentId)   // post step 1 if standing gate; never fill 100 systems

chain step N < 3 complete
  → splice that job
  → push step N+1 offered at the same origin

chain step 3 complete
  → pay fail-closed
  → completeJob done
  → hide on board
```

Offered chain: home dock only, standing gate (`rankFor` tier ≥ 1).  
Accepted chain: visible on every Jobs board.

Unique `DONE` rows remain until a later serial. This slice hides **chain** `done` only.

No standing: **do not post**. Do not fabricate a system (Witness Rule).

### 5. Chain vertical slice

**Beats:**

1. Reach Known with an EPICS faction. Dock that faction’s authored station (table contract §3.2).
2. Jobs shows **one** chain card (not two family slots). Reward and dest name (step 2) are visible before accept.
3. Step 1: accept at origin, complete by filing at origin (explore-like, **no** landmark / clue id).
4. Board replaces with step 2. Fly the authored dest. Dock. Tick completes. Splice → step 3.
5. Redock origin. Last step pays `payQuoted`, employer +2, `'commLine'`, `done` sentinel. **No** dart/turret/graft write.

**Not:** unique ace. **Not:** Named Gun. **Not:** EPICS capstone. **Not:** `kind: 'war'`. Accept only at the origin dock. `need` is exactly 1.

**Pay:** `jobPayFor` at the **origin** dock, live `PATROL_REWARD` 300. Stamp `payQuoted` on accept. Refuse accept if the stamp is not finite `> 0`. Do not use launcher catalog costs.

**Dest bind (step 2):** authored gate dest (contract §3.3). Stuffed `job.destSystem` cannot retarget. UI name from `SYSTEMS`.

### 6. Deadlines

None. Unique four have none. Do not expire authored steps on `MINING_DEADLINE`.

A later owner may add abandon. Until then, an accepted chain stays `accepted`.

### 7. UI (Jobs pane only)

Stay inside `renderJobs`. Two menu levels remain. Digit **2**. No new Digit. No HUD glance (HUD-02 closed). Digit 9 does not list chain steps.

Each chain card (all `textContent`):

- Title / detail from templates using station names from `SYSTEMS` (after `stripControlChars` / `NAME_MAX`). Never print system keys, clue ids, or `recordId`.
- Reward line with stamped or live quote (origin `jobPayFor(PATROL_REWARD)` for offered; `payQuoted` for accepted). Last step may say “Compact thanks” — **not** “Dart rack” until the owner grants.
- If offered: Accept (n). No deadline line.
- If accepted: `ACCEPTED — file at <station>` or `ACCEPTED — dock <dest station>`.

No `innerHTML`. No `job.faction` as a write source. `reducedMotion`: no extra animation; copy stays.

Home board can exceed 9 cards. Digit 1–9 cannot accept past index 8; **mouse Accept still works**. Do not cut family slots.

### 8. Reputation, EPICS, later grant

Chain **success** writes **employer faction only**, `Object.hasOwn(FACTIONS, key)`, **+2** (mining). Target faction **0**.

Do not copy patrol’s `reputation.freehold +=` unless origin is Freehold **and** `SYSTEMS[origin].faction === 'freehold'`. Still prefer the `SYSTEMS` lookup.

Do not write `job.faction`. Do not write `reputation[userString]`. Do not write `ctx.world.epics`.

Standing Digit 9 copy may later mention chain +2 employer; first impl does not require a `standingMoveNotes` edit in PR1.

SKU grant remains owner-open. Live meaning without a new table: seat `dart` or `auto` via `writeMountedGear` when `canSeat` is true, or refuse. Graft stays BIO/SHP. Fail closed until named.

### 9. Serial PR plan

Matches contract §6. **Named only. Do not implement in Wave 81.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize cap/kind** | `'chain'` kind; exact 12 ids; origin allowlist; cap `live+CHAIN_ROOM`; proto / kind / state; unique four kept; honest seven families kept | Sync, UI, SKU, unique migration, `2*N`, spy/war reset |
| **PR2 cards + sync** | standing gate; one live step; accept origin-only; origin `payQuoted` from `PATROL_REWARD` | 600 s expire, SKU, EPICS write |
| **PR3 complete / splice** | step 1 origin file; step 2 dest dock; step 3 fail-closed pay + done sentinel; hide done | SKU grant, target rep, kill UU |
| **PR4 Digit 2 UI** | station names; `textContent`; hide done chain | HUD-02, Digit 9 quest log |
| **PR5 boot pins** | keep unique four + `mine-freehold-0` + `spy-freehold-0` + `war-freehold-0` + `chain-freehold-1`; drop `chain-__proto__-1`; fit `live+CHAIN_ROOM`; last step no SKU; WAVE26/WAVE35 unique haul still pass | wishlist / PROGRESS |

`state.js` untouched. Authored copy is strings in `station.js` / a tiny `jobs-chains.js`, not an `EPICS` dump. No `src/` scheduled this wave.

### 10. Coupling

| Neighbour | Coupling | Law |
|---|---|---|
| Mining / seven families | Shared `world.jobs`, `sanitizeJobs`, Digit 2, `tickDeliveryJobs`, `boardJobs` | Grow cap by `CHAIN_ROOM` only. Never drop honest families. Do not reuse those kinds |
| Overlay pirates | Same pane | Cap 2 stays. Overlay ids unchanged |
| Unique ace / Named Guns | Same pane | Untouched |
| EPICS / Digit 9 | Standing bag `'epics'` | Do not advance stages from Jobs. Do not put chain cards on Standing |
| Hangar / outfitting | Live SKUs `dart` / `auto`; `writeMountedGear` | Grant fail-closed; no new SKU id |
| BIO graft | `graftMounted` | Not a Jobs grant |
| EXP data | Mystery clues / Archive | Do not print clue ids. Do not grant data cargo |
| POD survivors | People Digit 7 | No `survivor` on jobs |
| SHP | Digit 0 | No hull grants |
| TGT-05 | `ctx.targets` | Jobs do not write locks |
| REP | Standing bag | Employer +2. Target 0. No patrol `freehold` copy unless SYSTEMS says so |
| Kill attrib | `KILL_STANDING_DELTA` null | Out of this family |
| MSN-02 spy/war | Shared cap | Add `CHAIN_ROOM` only; do not reset their rooms |

### 11. Non-goals (expanded)

- Turning Standing epics into scripted quests (`epics.js` stays requirement auto-advance).
- Mystery clues as board jobs (EXP / explore).
- Police hail / restitution.
- Mission-granted ships, scanners, or mining heads (outfitter stays UU).
- Changing unique ace or overlay to origin `payQuoted`.
- `ctx.js` default `jobs: []` is optional; not required if `ensureJobs` remains the creator.
- NPC missiles / power ledger.
- Unknowables dock chain.
- Ten Banners chains this serial.

---

## Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Unique four vanish on restore | Exact allowlist; hyphen tokens; boot pins |
| Honest families dropped for chain room | Cap `live + CHAIN_ROOM`; drop order never evicts honest families |
| Overlay retired by accident | Cap 2 / ids / `completeJob` stay |
| Kind collision with EPICS | Kind `'chain'`; Digit 9 unchanged |
| `2*N` cap blow-up | `CHAIN_ROOM = 7` authored |
| Spy/war rooms reset | Add only `CHAIN_ROOM` to live cap |
| Target loss | Success path writes employer only |
| Kill UU / spy expose / war target-rep invented | Fail closed; live deltas already 0 / null |
| Unreachable dest | Authored gate dests that already have stations |
| Origin injection | Sanitize origin must match table; complete re-reads `SYSTEMS` |
| Foreign offered accept | `boardJobs` hides offered chain off-home; `acceptJob` refuses |
| Stuffed `payQuoted` | Clamp 0…20000 on sanitize and at pay |
| Stuffed SKU / `job.launcher` | Field not on allowlist; grant path off |
| `__proto__` job id | Token `RESERVED_IDS`; drop `chain-__proto__-1` |
| XSS in titles | `textContent`; strip on restore; regen from templates |
| `asteroidId` / mystery ids | Forbidden on chain cards |
| Light hull silent dart grant | Fail closed; later grant must `canSeat` |
| Digit overflow | Mouse Accept; do not cut slots |
| `state.js` dump | READ-ONLY |
| Boot-test unique ids | Untouched |
| New persist key | Forbidden |
| EPICS become Jobs | No `'epicJob'`; no `world.epics` write from complete |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | station (later maybe `jobs-chains.js`); save sanitize | station |
| Unique four | `makeJobs` when empty | boot-test |
| Family slots | existing sync / replace | `boardJobs` |
| Chain rows | `syncChainJobs` / splice | `boardJobs` |
| Overlay pirates | `syncPirateBounties` | `boardJobs` |
| `ctx.world.reputation` | chain complete → employer key | epics, standing, npc |
| `ctx.world.epics` | **epics.js only** | Digit 9 |
| Hangar SKUs | outfitting / `writeMountedGear` (not Jobs this serial) | combat |
| `WORLD_FIELDS` `'jobs'` | save.js | restore |
| `state.js` | serial data owner only | **feature PRs read-only** |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (5289–5292).

---

## Acceptance direction (implementation wave)

From the wishlist, made testable for the **chain** slice:

1. A player who is Known with Freehold, docked at Freehold Landing, sees **one** `chain-freehold-1` card plus today’s unique/overlay/family rows. A Stranger does not see it.
2. Accept → complete step 1 at origin → step 2 posts → dock Veridian Spire → step 3 posts → redock origin: credits up, Freehold standing +2, **no** dart seated, **no** Veridian standing change, chain `done` hidden.
3. Completing the chain does **not** post a fourth step. Restore does **not** re-offer step 1.
4. Origin is the authored `SYSTEMS` key. Dest is a real station system.
5. Reward and station names are visible before accept. System keys and clue ids are not printed.
6. No 600 s expire of an accepted chain in first impl.
7. Restore of `__proto__` / `chain-__proto__-1` drops those rows; unique four and `mine-freehold-0` / `spy-freehold-0` / `war-freehold-0` remain; 10k-length heals to ≤ `live+CHAIN_ROOM`; stuffed `job.faction` does not write; stuffed launcher field does not copy; no throw; no extra credits; no SKU mint.
8. Unique `bounty-ace` still exists. Overlay still posts up to 2 `bounty-pirate-*`. WAVE26 / WAVE35 behaviour unchanged. Digit 9 EPICS still auto-advance without Jobs accept.
9. Success does not debit a dest faction.
10. No job field names an asteroid index. No new `WORLD_FIELDS`. No `innerHTML`. No invented equipment UU.

---

## Open owner questions

Defaults in the contract **stand**. None of them block impl.

No blocking owner question. A later owner may still name SKUs, add Ten Banners chains, or author abandon — until then, implement the defaults. Do not invent a new UU table, a third clock, a kill UU table, or `2*N` cap terms while waiting.

**Closed Wave 82** — [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. Last-step grants: Freehold `dart` if `canSeat`; Red Ledger `auto` if `canSeat`; else credits +2. Shop costs stay shop costs. Chains impl later (`station.js`).
2. Veridian / Hollow: credits +2 only.
3. `CHAIN_ROOM = 7` covers four sentinels + three splice ghosts. A Ten Banners wave adds authored count, never `2*N`.
4. Kind `'chain'` so Digit 9 stays EPICS.
