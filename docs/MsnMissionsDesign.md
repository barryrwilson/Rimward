# RIMWARD MSN renewable missions

| Field | Value |
|---|---|
| **Title** | RIMWARD MSN renewable missions and player careers |
| **Author** | Wave 70 MSN integrator |
| **Date** | 2026-08-20 |
| **Status** | Implemented. Wave 70 was markdown. Wave 71 shipped PR1–PR5. |
| **Wave** | 70 — design. 71 — first impl. |
| **Owner request** | MSN design brief. Do not ship board replacement, new families, or `src/` in this wave. |
| **Merge law** | [`out/w70/msn/shared-contract.md`](../out/w70/msn/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w70/msn/current-mission-inventory.md`](../out/w70/msn/current-mission-inventory.md) |
| Merge law | [`out/w70/msn/shared-contract.md`](../out/w70/msn/shared-contract.md) |
| Security review | [`out/w70/msn/security-review.md`](../out/w70/msn/security-review.md) |
| Design-doc review | [`out/w70/msn/code-review.md`](../out/w70/msn/code-review.md) |

---

## Overview

The dock Jobs board is four unique cards plus pirate and wreck overlays. Completing a contract sets `DONE` and never posts a replacement. Wishlist MSN still needs a renewable board, several careers, and later authored reward chains.

This brief is the integrator document for that later implementation wave. It freezes persist (`world.jobs` extend + sanitize), board-slot law, one-in-one-out, generous fail-closed deadlines, a **mining** first vertical slice (no asteroid UUIDs), and a serial PR plan. Wave 70 lands this markdown only. Missions do not change here.

HUD-02, SHP yards, and POD trafficking stay closed. `src/game/state.js` stays READ-ONLY for feature workers.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “jobs today”: [`out/w70/msn/current-mission-inventory.md`](../out/w70/msn/current-mission-inventory.md). Code wins over stale comments.

| Surface | Today | Cite |
|---|---|---|
| Owner | `station.js` creates `ctx.world.jobs` if empty | `ensureJobs` 1476–1478; `initStation` 1768 |
| Unique cards | ace bounty, patrol, haul Provisions, ferry Provisions | `makeJobs` 1441–1473 |
| Overlays | pirate bounties cap 2; one recovery wreck | 1503–1572; `PIRATE_BOUNTY_CAP` 167 |
| Complete | `state = 'done'`; trust/favor; no splice | `completeJob` 1631–1644 |
| Board filter | hide foreign **offered** pirate/recovery; show `DONE` | `boardJobs` 1575–1584 |
| Deadlines | none on jobs | render 2109–2176 |
| Persist | `WORLD_FIELDS` `'jobs'`; **no sanitize** | `save.js` 77, 351–399, 445–451 |
| Events | `'commLine'` only; no `job*` type | `ctx.js` 197–226 |
| UI | Digit 2; `h()` `textContent`; digit accept by index | 132, 1820–1825, 2740–2742 |
| Mining jobs | **none**. Cut/pod/scoop is space-side | `combat.js` 1415; `asteroids.js` 2097–2116 |
| Rock ids | `list[i].id === i`; not a destination | AST brief §9 |

Patrol is the only job that writes reputation, and it always writes **`freehold`** (`station.js` 1671).

### Pain points

- Wishlist MSN-01: completed missions do not disappear and get replaced. `ensureJobs` runs only on an empty array.
- Ordinary deadlines do not exist. State is offered / accepted / DONE only.
- MSN-02 mining is a live career without a board card. Haul/ferry exist but are one-shot Provisions contracts.
- `world.jobs` is a global unsanitized array. Done pirate/recovery rows accumulate.
- AST-02 wants missions to pick reachable rocks, but AST forbids rock UUIDs. The board must name a **system + ore key**.

### Why now (design) / why not now (code)

The owner asked for the MSN brief after AST orbits and POD/SHP closures. Inventory and merge law exist. Implementation waits for a later serial wave so sanitize, slot law, and the mining career land against a frozen contract instead of a drive-by fifth `makeJobs` row.

---

## Goals & Non-Goals

### Goals

1. Document the live board, unique ids, overlays, Witness Rule, and persist hole.
2. Freeze extend-`world.jobs` + sanitize (no new persist key).
3. Freeze board slots, one-in-one-out, and generous fail-closed deadlines for the first family.
4. Freeze **mining contracts** as the first vertical slice: reachable hardness-1 ore, deliver to the posting dock, no `asteroidId`.
5. Freeze XSS / job-id fail-closed / employer-only reputation writes.
6. Name later families and MSN-03 as serials without inventing their numbers.
7. Freeze a serial PR plan: sanitize → cards → replace/expire → UI → boot pins.
8. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 70. No `src/` edits. No implementation PRs scheduled here.
- No HUD-02 chart marks. No AST rock UUIDs. No POD reopen. No SHP hull grants.
- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No parallel `world.missions` array. No new frozen event.
- No `state.js` feature rewrite.
- Do not migrate `bounty-ace` / `patrol-lane` / `haul-provisions` / `ferry-consignment` in the first impl.
- Do not specify espionage, passenger ferry, faction-war, or exploration numbers.
- Do not invent police restitution (REP-03). Espionage vs REP-04 waits on a later REP brief.
- Do not edit the wishlist or `PROGRESS.md`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Extend `world.jobs` | Already on `WORLD_FIELDS`. Contract §0.2 |
| Replace unique four? | **No** in first impl | Boot-test pins those ids. Contract §0.18 |
| First family? | **Mining** (`kind: 'mining'`) | Inventory §8: career live, board empty |
| Board slot? | 2 mining jobs per system (offered or accepted) | `PIRATE_BOUNTY_CAP` precedent. Contract §0.6 |
| Replacement? | Splice + immediate new mining job same system+slot | MSN-01. Contract §0.7 |
| Deadline? | 600 s (`WRECK_TTL`); restart on accept; expire fail closed | Cite `world.js` 811. Contract §3.4–3.5 |
| Rock UUID? | **Forbidden** | AST §9; `id === index` reuses |
| MSN-03 chains? | Later serial, after renewable board | Wishlist order. Contract §0.5 |
| Espionage? | Later; depends on REP brief | REP-04. Contract §0.17 |
| `innerHTML`? | **No** | Live `h()` is `textContent`. Contract §0.10 |
| Job ids | Hyphen **tokens** use `SAFE_ID` class; full id is `mine-<SYSTEMS key>-<n>` or exact unique four. Never `SAFE_ID.test(job.id)` | Live unique ids have `-`. Contract §0.11, §1.3 |
| Sanitize cap | `4 + 2 * N_SYSTEMS + 16` (220 at 100 systems). Never drop honest offered mining | 2×100 slots cannot fit in 64. Contract §1.2 |
| Employer rep | Live `SYSTEMS[origin].faction`; never `job.faction` | Save retarget. Contract §3.2, §5 |
| `payQuoted` | Clamp `0…20000` (**proposed**) | Tamper lid. Contract §1.4 |

---

### 2. Current board (do not break)

See inventory §§1–5. The load-bearing loop is:

1. `initStation` → `ensureJobs` → `makeJobs` if empty.
2. Each Jobs render: refresh ace, sync pirates, sync recovery, list `boardJobs`.
3. Accept stamps haul/ferry quotes; ferry fronts cargo.
4. Ticks complete patrol (frame), delivery (0.5 s).
5. `completeJob` marks `done` and banks dockmaster trust.

**First impl must not change step 1’s four ids or haul/ferry quote stamps.** Mining is additive: extra sync on render, extra branch in delivery tick, extra cards in `boardJobs`.

Digit 2 and `DOCK_KEY_SERVICES` stay. Digit 0 stays shipyard.

---

### 3. Persist: sanitize `world.jobs`

Restore copies `jobs` with no heal today. That is the trust boundary.

Later PR1: `sanitizeJobs` inside `sanitizeRestored` (`save.js` 351). Shape, hyphen-token ids, proto drop, cap: contract §1.

**Ids:** live `SAFE_ID` (`/^[a-z0-9_]+$/i`) rejects hyphens. `bounty-ace` and `mine-freehold-0` must survive restore. Sanitize splits on `-` and runs the `SAFE_ID` character class on **each token**, then `RESERVED_IDS` on the full string and every token. Unique four are an exact allowlist. Do not rewrite them to underscores.

**Cap:** `JOBS_SANITIZE_MAX = 4 + 2 × Object.keys(SYSTEMS).length + 16`. At inventory time that is **220** (6 authored + 94 generated = 100, `state.js` 500–541). A cap of 64 cannot hold two mining slots per system. Drop order never removes the unique four, accepted jobs, or honest offered mining (one of two slots per `originSystem`).

`ensureJobs` still seeds the unique four when the array is empty after heal. Mining fill is `syncMiningJobs`, not `makeJobs`.

No `fieldOre`-style second map. Mining progress is cargo in the hold, not a world overlay.

---

### 4. Board slots and one-in-one-out

A **slot** is not a UI widget. It is `kind === 'mining'` + `originSystem` + `slot` ∈ {0,1}.

```
renderJobs
  → syncPirateBounties / syncRecoveryJob (unchanged)
  → syncMiningJobs(currentId)   // fill missing slots only

mining complete or expire
  → splice that job
  → push replacement for same originSystem + slot
  → render if the Jobs pane is open
```

Offered mining: home dock only (pirate/recovery precedent).  
Accepted mining: visible on every Jobs board so the player can see the home name and deadline (contract §2.1 / §12.5).

Unique `DONE` rows remain until a later serial. First slice does not have to clear the historical board clutter; it must not add mining to that clutter.

---

### 5. Mining vertical slice

**Beats:**

1. Dock home → Jobs → two mining cards (hardness-1 `rawOre` or `livingRock`).
2. Accept. Reward, need (4), employer, remaining time are visible before and after accept (wishlist acceptance).
3. Fly the AST work sector. Cut. Scoop pods. Redock home.
4. Delivery tick removes 4 units, pays `payQuoted`, +2 employer rep (**proposed**), dockmaster trust as today, splice, new card on the same board immediately.
5. Ignore a card for 600 s: posting withdraws, replacement appears. Ignore an accepted card: fail closed, no pay, replacement.

**Not:** a lock on rock 17. The player may cut any matching-ore rock in that system. Hold units of that commodity count (haul precedent; market fill of bulk `rawOre` is allowed).

**Pay:** `jobPayFor` at the **origin** dock, `HAUL_MARGIN` 1.4 × units × `priceOf`. Stamp `payQuoted` on accept so epic/faction shifts cannot move the agreement (wave 26 haul/ferry law).

**Laser gate:** first slice hardness ≤ 1 so a stock Mk I can finish. Later serial may post harder ore when `world.miningLaser` qualifies.

---

### 6. Deadlines

Live recovery already uses `expiresAt` vs `world.time` and fails accept if the wreck is cold. Mining uses the same clock.

| State | Timer | On fire |
|---|---|---|
| offered | `deadline = postTime + 600` | withdraw, replace |
| accepted | `deadline = acceptTime + 600` (restarts) | fail closed, replace |

600 s is ~10 minutes. Mk I extracts 1.2 u/s; 4 units plus a ~515 u field hop at cruise 120 is well under a minute of honest play. The window is deliberately generous (MSN-01).

Expire must not call the pay path. A restored job with `deadline` in the past expires on the next 0.5 s tick.

There is no `failed` row left on the board after replace. `failed` exists only as a sanitize allowlist so a crash mid-replace cannot pay twice.

---

### 7. UI (Jobs pane only)

Stay inside `renderJobs`. Two menu levels remain (`station.js` header §12.1).

Each mining card (all `textContent`):

- Title / detail from templates using `COMMODITIES[commodity].name` and station name.
- Reward line with stamped or live quote (same split as haul).
- If offered: Accept (n). Deadline remaining as whole seconds or minutes.
- If accepted: `ACCEPTED — deliver N <ore> here (have X) · t left`.

No `innerHTML`. No new dock Digit. No HUD glance row (HUD-02 closed). Space-side find-aid is the existing AST belt cue.

`reducedMotion`: no extra animation; copy stays.

---

### 8. Reputation and later REP

Mining success writes **employer faction only**, `Object.hasOwn(FACTIONS, key)`, **proposed +2**. Expire writes nothing.

Do not copy patrol’s `reputation.freehold +=` (`station.js` 1671) into mining.

Espionage (secret success, exposed failure) and faction-vs-faction (employer up, target down) are wishlist REP-04. **MSN does not write that brief.** If those families need REP-01/03 (screen, police restitution), the serial says “depends on later REP brief”.

---

### 9. Serial PR plan

Matches contract §8.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 sanitize** | `sanitizeJobs`; hyphen-token ids; cap `4+2*N_SYSTEMS+16`; proto / kind / state allowlist; unique four kept | New kinds, UI, whole-string `SAFE_ID` on job.id |
| **PR2 mining cards** | sync 2 slots; accept; deliver tick; `payQuoted`; hardness-1 roll | Expire, replace, unique migration |
| **PR3 replace + expire** | one-in-one-out; 600 s fail closed | MSN-03, other families |
| **PR4 board clarity** | remaining time + have/need on cards | HUD-02, Digit 0, People desk |
| **PR5 boot pins** | keep `bounty-ace` / `mine-freehold-0`; drop `mine-__proto__-0`; 200 mining fit cap 220; complete→new card; expire no pay; no `asteroidId` | wishlist / PROGRESS |

`state.js` untouched. Authored copy is strings in `station.js` / `jobs.js`, not a table dump.

---

### 10. Non-goals (expanded)

- Passenger ferry as survivor cargo (POD closed).
- Turning Standing epics into scripted quests (`epics.js` stays requirement auto-advance).
- Mystery clues as board jobs.
- Ore provenance tags on cargo rows.
- Police hail / restitution.
- Mission-granted ships, scanners, or mining heads (outfitter stays UU).
- `ctx.js` default `jobs: []` is optional in PR1; not required if `ensureJobs` remains the creator.

---

### 11. Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Board still fills with `DONE` unique cards | First slice does not migrate them; mining never uses `done` |
| Unreachable wakeglass contract | Hardness ≤ 1 only |
| Rock id after jump | No `asteroidId` field |
| Double pay on replace | Splice before push; `failed` not payable; tick keys on object identity |
| `__proto__` job id | Token `RESERVED_IDS`; drop `mine-__proto__-0`; keep `bounty-ace` / `mine-freehold-0` |
| Cap vs galaxy | Cap 220 at 100 systems; never drop honest offered mining |
| Save retargets employer | No `job.faction`; read `SYSTEMS[originSystem].faction` |
| Inflated `payQuoted` | Clamp 0…20000 on sanitize and at pay |
| XSS in titles | `textContent`; strip on restore |
| Deadline skip complete | Expire has no pay branch |
| Patrol freehold bleed copied | Mining uses dock `faction` |
| Jobs array unbounded | Sanitize cap `4+2*N_SYSTEMS+16` (220 at 100 systems); never drop honest offered mining |
| POD/SHP/HUD-02 reopen | Explicit non-goals |
| Boot-test haul/ferry ids | Untouched |
| AST mining career travel tax | Work sector already shipped; contract uses system, not empty belt |

---

### 12. Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.jobs` | station (later maybe `jobs.js`); save sanitize | station |
| Unique four | `makeJobs` when empty | boot-test |
| Mining slots | `syncMiningJobs` / replace | `boardJobs` |
| `ctx.world.reputation` | mining complete → employer key | epics, standing, npc |
| `ctx.asteroids.list` | asteroids.js only | combat / HUD / miners |
| `WORLD_FIELDS` `'jobs'` | save.js | restore |
| `state.js` | serial data owner only | **feature PRs read-only** |

`station.js` still must not touch `ctx.input` beyond the dock overlay. Jobs ticks stay in the station `update` (already run docked or not, 2819–2823).

---

## Acceptance direction (implementation wave)

From the wishlist, made testable for the **mining** slice:

1. A Freehold Jobs board shows two mining cards plus today’s unique/overlay rows.
2. Accept → cut matching ore → scoop → redock: card gone, credits up, **new** mining card on the board the same visit.
3. Completing again still yields a mining card (career does not exhaust).
4. Origin and commodity are a real system and a hardness-1 `ORE_TYPES` key.
5. Reward, need, and remaining time are visible before accept.
6. After 600 s accepted without delivery: no pay, card replaced, state not `DONE`.
7. Restore of `__proto__` / `mine-__proto__-0` drops those rows; `bounty-ace` and `mine-freehold-0` remain; hardness-4 mining drops; 10k-length heals to ≤220; no throw; no extra credits.
8. No job field names an asteroid index. Boot haul/ferry ids still pass.

---

## Open owner questions

Defaults in the contract §12 stand unless the owner overrides.

1. Two mining slots vs one for a smaller first impl.
2. +2 employer rep vs 0 (credits-only, like haul) vs `PATROL_REP` 5.
3. Accepted mining visible on foreign docks vs home-only.
4. Whether PR1 also drops historical done pirate rows (sanitize overflow) — default yes, overflow only, after invalid/duplicate mining.
5. Whether a later serial migrates haul/ferry before local pirate slots.
6. (Closed) Whole-string `SAFE_ID` on job ids — **no**. Hyphen tokens. (Closed) cap 64 — **no**. Formula §1.2.
