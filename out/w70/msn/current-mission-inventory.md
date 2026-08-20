# Current mission / jobs inventory (code wins)

**Wave:** 70. Design only.  
**Status:** LIVE CODE inventory for Initiative MSN. If a comment, wishlist line, or this file disagrees with `src/`, **code wins**.  
**Not this wave:** any edit under `src/`.

Cites are `file:line` at inventory time (2026-08-20). Re-read those lines before an implementation PR.

---

## 0. Scope of this inventory

Wishlist MSN (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 442–484) wants a renewable board, eight families, and later authored reward chains. This file records **what the board actually is today**.

Closed neighbouring briefs (do not reopen):

| Neighbour | Freeze | Cite |
|---|---|---|
| POD-02 trafficking | Closed. People sale is Gilded-only. Rescue stays. | `docs/Pod02TraffickingDesign.md`; `trafficking.js` |
| SHP yards | Closed. Jobs must not grant hulls. | `docs/ShpDesign.md`; Digit 0 shipyard |
| AST rock identity | Rocks are `id === index`. **No** mission destination UUID. | `docs/AstOrbitsDesign.md` §9; `asteroids.js` 1877–1885 |
| HUD-02 | Closed. | `docs/Hud02IdentitiesDesign.md` |

---

## 1. Who owns jobs

| Object | Writer | Reader | Cite |
|---|---|---|---|
| `ctx.world.jobs` | `station.js` `ensureJobs` / `makeJobs` / pirate+recovery sync / `acceptJob` / `completeJob` / ticks | station board UI, `tickPatrolJob`, `tickDeliveryJobs`, `tickRecoveryCollect` | `station.js` 44, 1441–1751, 1768, 2072–2176, 2819–2823 |
| Create-if-empty | `ensureJobs`: if not array → `[]`; if `length === 0` → `makeJobs(ctx)` | once at `initStation` | 1476–1478, 1768 |
| Persist | `WORLD_FIELDS` includes `'jobs'` | `save.js` restore copies the field wholesale | `save.js` 74–77, 445–451 |
| Sanitize | **None.** `sanitizeRestored` does not walk jobs | — | `save.js` 351–399 |
| `ctx.js` default | **No `jobs` key.** Station creates it | — | `ctx.js` 123–148 |
| Frozen events | None named `job*`. Completions emit `'commLine' { text }` | hud | `ctx.js` 197–226; `station.js` 1643 |

There is no `src/systems/jobs.js`. The Jobs **service** is Digit 2 on the dock (`DOCK_KEY_SERVICES[1] === 'jobs'`).

---

## 2. Board UI (Jobs service)

| Surface | Live | Cite |
|---|---|---|
| Dock key | Index 1, Digit **2**, label `Jobs board` | `station.js` 132, 2631–2634 |
| Overlay helper | `h()` always `textContent`. **No `innerHTML` in `station.js`.** | 1820–1825 |
| Render | `renderJobs` rebuilds cards each open + every 1 s while docked | 2109–2176, 2814–2816 |
| Sync on render | `refreshBountyJob`, `syncPirateBounties`, `syncRecoveryJob` | 2113–2115 |
| Visible set | `boardJobs(ctx, currentId)` | 1575–1584 |
| Card fields | title, detail, reward line, state line or Accept button | 2118–2175 |
| Accept click | `btn(..., () => acceptJob(job))` | 2153–2154 |
| Accept digit | `boardJobs(...)[n - 1]` if `state === 'offered'` | 2740–2742 |
| Digit 0 | `n === 0` → index `-1` → no-op | 2738–2742 |
| Max digit | 1–9. Cards past index 8 cannot be accepted by key | 2738–2742 |
| States shown | `offered` → Accept; `accepted` → `ACCEPTED …`; else → `DONE` | 2153–2175 |
| Deadline UI | **None.** No `deadline` / `expiresAt` on job cards | 2109–2176 |
| Failed state | **None.** | — |

`boardJobs` filters:

- Offered pirate bounties (`id` starts `bounty-pirate-`) hide unless `j.system === sysId`.
- Offered recovery hides unless `j.originSystem === sysId`.
- **Everything else is listed**, including `state === 'done'` unique cards, accepted jobs, and done pirate/recovery cards.

---

## 3. `makeJobs` — four unique cards (never replaced)

`makeJobs` (`station.js` 1441–1473) returns a **fixed** array of four objects. `ensureJobs` runs this **only when `world.jobs` is empty**. Completing all four does **not** refill the board.

| `id` | `kind` | Role | Reward / need (live constants) |
|---|---|---|---|
| `bounty-ace` | `bounty` | Named ace (default Carver Illyx) | `ace.bounty` else `DEFAULT_ACE_BOUNTY` 2500 (165–166, 1444) |
| `patrol-lane` | `patrol` | Kill/drive off pirates | `PATROL_REWARD` 300, `PATROL_NEED` 2, `PATROL_REP` 5 (149–151) |
| `haul-provisions` | `haul` | Buy+deliver Provisions across primary gate | `HAUL_UNITS` 5, `HAUL_MARGIN` 1.4 (152–153). `reward: 0` until quote |
| `ferry-consignment` | `ferry` | Fronted Provisions, no buy-in | `FERRY_UNITS` 4, `FERRY_REWARD` 350 (154–155) |

Shared shape on those four:

```
{ id, kind, title, detail, reward, state: 'offered', progress: 0, need }
```

Haul extra: `originSystem: null, originPrice: 0` (stamped on accept).  
Ferry extra: `originSystem: null, destSystem: null` (stamped on accept).

**Boot tests pin those ids** (`scripts/boot-test.mjs` ferry-consignment / haul-provisions). First MSN impl must not rename them.

---

## 4. Live-synced overlays (not a slot machine)

### 4.1 Pirate bounties (local pirate hunt — partial)

`syncPirateBounties` (`station.js` 1503–1536):

- Pulls **offered** `kind === 'bounty'` with `id` prefix `bounty-pirate-` if the named pirate record is missing or `dead`/`captured`.
- Posts up to `PIRATE_BOUNTY_CAP` **2** cards for **current-system** live pirates with `bounty > 0`.
- Id: `pirateBountyId(name)` = `` `bounty-pirate-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` `` (1494–1495).
- Reward: `r.bounty || PIRATE_BOUNTY_FALLBACK` (400).
- World prices pirates at `300 + i * 75` (`world.js` 359).
- **Accepted / done pirate cards are not pulled** when the quarry dies. They stay on `world.jobs`.
- Claims use the Witness Rule (see §6).

This is MSN-02 “hunting a local pirate” **in part**: cards exist, but they do not one-in-one-out as a renewable career board, and done cards accumulate.

### 4.2 Recovery (not an MSN-02 family; salvage overlay)

`syncRecoveryJob` (`station.js` 1546–1572):

- One offered recovery at a time for the first unexpired in-system wreck.
- Id `` `recovery-${a.id}` ``. Wreck ids are `` `aft-${time}-${rand}` `` (`world.js` 1316).
- Pulls offered cards when wreck is gone or `expiresAt <= world.time`.
- `WRECK_TTL = 600` world seconds (`world.js` 811).
- Reward `RECOVERY_REWARD` 300.
- Accept spawns a salvage pod (`refinedMetals` × 2) at the wreck (`station.js` 2086–2094).
- Any `podCollected` while accepted sets `collected` (temporal, pods have no job tags) (`1652–1658`).
- Pay on redock at `originSystem` with `collected`.

### 4.3 Ace refresh

`refreshBountyJob` retargets `bounty-ace` name/reward from the living ace record unless `state === 'done'` (1482–1491). Ace home is the system whose `cast.ace` is set (`aceHomeSystem` 1432–1437). Non-home boards show a “take the gate” line (2149–2151).

This is MSN-02 “faction-level pirate” **in part**: one unique ace contract, not a renewable family. Lineage / aspirants live in `world.js`, not the board.

---

## 5. Accept / complete / tick

### 5.1 `acceptJob` (2072–2107)

| Kind | On accept |
|---|---|
| `ferry` | Hold must fit `FERRY_UNITS`. Stamp origin/dest/`payQuoted`. `addCargo('provisions', FERRY_UNITS)`. |
| `recovery` | Find wreck; spawn pod; `collected = false`. Fail if wreck gone. |
| all | `state = 'accepted'` |
| `haul` | After state flip: stamp `originSystem`, `originPrice`, `payQuoted` via dest `jobPayFor` |

Bounty and patrol accept with no extra stamp.

### 5.2 `completeJob` (1631–1644)

- Sets `state = 'done'`. **Does not splice. Does not post a replacement.**
- Dockmaster: `bumpTrust(..., DOCKMASTER_TRUST_PER_JOB)` **5**.
- Generated dock (not `AUTHORED_SYSTEMS`): if trust ≥ `GENERATED_KNOWN_TRUST`, `addFavor`.
- Bounty: fence `addFavor`.
- Optional `'commLine'`.

Favours: generated dockmaster yard-comp; Freehold fence opens restricted locker (`station.js` 2506–2533; `contacts.js` header 26–60).

### 5.3 Ticks (`update` 2819–2823)

| Tick | Cadence | Effect |
|---|---|---|
| `tickPatrolJob` | every frame | `npcDestroyed` / `Surrendered` / `Disabled` with pirate role → `progress++`. At `need`: **`reputation.freehold += PATROL_REP`**, pay, `completeJob` |
| `tickRecoveryCollect` | every frame | `podCollected` → `collected = true` |
| `tickDeliveryJobs` | 0.5 s | bounty witness claim; haul/ferry/recovery dock pay |

**Bounty claim (Witness Rule §8.7):**

- Ace: record `dead` or `captured` **and** an incident `name === ace.name && causer === 'player'` (1686–1696).
- Pirate: incident `kind === 'destroyed' && name === job.target && causer === 'player'` (1698–1705). Surrender/capture of a named pirate does **not** pay the pirate card (ace capture does).

**Haul:** docked at `otherSystemId(origin)` (primary gate `.to` only). `holdUnits('provisions') >= HAUL_UNITS`. Remove cargo. Pay `payQuoted ??` 140% math. Gates-less origin never pays (1718–1720).

**Ferry:** docked at **named** `destSystem`. Full consignment pays; short hold sets `ui.notice` and leaves the job accepted (1730–1741).

**Recovery:** `collected` and docked at `originSystem`.

### 5.4 Pay multipliers

`jobPayFor(ctx, sysId, base)` (`1593–1600`): `round(base * epic.jobPayMult * factionService.jobPayMult)`. Authored six skip `FACTION_SERVICES`. Epic first, faction second. Haul/ferry stamp `payQuoted` at accept so standing shifts cannot move an agreed price.

Live `FACTION_SERVICES` job lines include Veridian `1.15`, Congregation `1.2`, Independent `1.1` (`state.js` 598–605). Epic stages can add `jobPayMult` (`state.js` 749, 762, 794).

---

## 6. World: incidents, aftermath, records (not jobs)

`world.js` does **not** write `world.jobs`. It feeds the board:

| Feed | Shape | Cite |
|---|---|---|
| Records / banks | per-system NPC identities; pirates carry `bounty` | `world.js` 8–18, 282–299, 359 |
| Ace | Freehold `cast.ace` only; bounty 2500 | 408–417; station `findAceRecord` 1412–1416 |
| Incidents | `{ id, t, kind, name, faction, role, position, causer }` | `addIncident` 1332–1346 |
| Cap | `MAX_INCIDENTS` 40, shift oldest | 813, 1345 |
| Aftermath wrecks | `{ id, incidentId, kind:'wreck', position, system, createdAt, expiresAt }` | 1313–1328 |
| Wreck TTL | 600 s | 811 |
| Aftermath cap | 24 | 812 |
| Witness | wrecks **only** from real `npcDestroyed` | header 37–40, 1314 |

Incident ids: `` `inc-${round(time*10)}-${rand}` ``. Same family as wreck ids. Not `SAFE_ID`.

---

## 7. Persist (`save.js`)

| Rule | Live |
|---|---|
| Autosave key | `rimward-save-v1` only (`save.js` 64, 14) |
| Slots | `rimward-save-v1-slot-1..3` (66) — same envelope, not a second world schema |
| `WORLD_FIELDS` | includes `'jobs'` (77) |
| Restore | `ctx.world[k] = snap.world[k]` for each listed field (445–451) |
| Jobs heal | **missing.** No allowlist, no id check, no length cap |
| `SAFE_ID` | `/^[a-z0-9_]+$/i` (100). **Matches `__proto__`.** Rejects **hyphens**. `RESERVED_IDS` drops proto keys (104–109) |
| Used for | factions, cargo, `fieldOre` keys — **not jobs today** |
| Live job ids | All use hyphens: `bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment`, `bounty-pirate-*`, `recovery-aft-*`. Whole-string `SAFE_ID.test(job.id)` would drop the entire live board |
| Galaxy size | `SYSTEMS` = 6 authored + 94 generated = **100** (`state.js` 500–504, 537–541; `galaxy.generated.js` header) |
| `world.time` | healed to `0` if not finite ≥ 0 (`save.js` 397) — AST overlay; jobs have no deadline today so this is unused by the board |

A crafted save may set `world.jobs` to a huge array, `__proto__` ids, or `state: 'accepted'` with invented `payQuoted`.

MSN sanitize must **not** apply whole-string `SAFE_ID` to `job.id`. Token grammar is merge law (`shared-contract.md` §1.3). Cap must fit `2 × 100` mining slots plus the unique four (`shared-contract.md` §1.2).

---

## 8. Job kinds vs MSN-02 families

| MSN-02 family | Live board? | How | Gap |
|---|---|---|---|
| Mining contracts | **No** | Mining is combat + `asteroids.js` pods (`combat.js` 1415; `asteroids.js` 2097–2116). No `kind: 'mining'` | Career exists in space; **zero** board contracts. AST forbids asteroid UUIDs as destinations |
| Commodity trade / delivery | **Partial** | One haul + one ferry, Provisions only, unique ids, stay `DONE` | Not renewable; not multi-commodity |
| Espionage | **No** | — | REP-04 secret vs attributed not implemented for jobs |
| Passenger ferry | **No** | `kind: 'ferry'` is **Provisions consignment**, not people. People desk is rescue/sale | POD closed; do not stuff survivors into jobs |
| Local pirate hunt | **Partial** | `syncPirateBounties` cap 2 | Done cards stay; no guaranteed replacement of the **family** |
| Faction-level pirate | **Partial** | Unique `bounty-ace` + world lineages | One-shot on the board; not a career slot |
| Faction-vs-faction | **No** | Patrol always credits **freehold** (`1671`) | Attribution is wrong for non-Freehold docks |
| Exploration / information | **No** | Mystery (`clueFound` / landmarks) is not a job | Keepers / mystery stay off the ordinary board |

**First vertical slice pick (from this table):** **mining contracts.** It is the only listed family with a live career loop (cut → pod → scoop → market) and **no** board card. Delivery plumbing can copy haul/recovery (hold units + redock) without rock UUIDs.

Do not treat haul/ferry as “fully served”: they exist, but MSN-01 replacement law does not.

---

## 9. Reputation writers (for MSN vs REP)

Jobs and neighbours that **write** `ctx.world.reputation`:

| Writer | Key | Amount | Cite |
|---|---|---|---|
| Patrol complete | **always `freehold`** | `+PATROL_REP` (5) | `station.js` 1671 |
| Survivor return | victim `faction` | `RESCUE.otherRep` 4 / `playerKillRep` 1 per unit | `station.js` 1373–1377; `state.js` 289–294 |
| Trafficking sale | victim + `gilded` | per `trafficking.js` table | `trafficking.js` 171–174 |
| Origin arcs | `redledger` (debt) | authored `ORIGIN_ARCS` | `world.js` 1006–1045 |
| Origins pick | various | start deltas | `state.js` 700–714; `origins.js` 56 |

Bounty, haul, ferry, recovery: **credits + trust/favor only**. No reputation.

Readers: Standing UI, epic `rankTier`, market sell-tier, `npc.js` `standingOf` (1021–1026), restricted locker (`reputation.freehold < -25`).

`world.js` 1093 walks `for (const f in ctx.world.reputation)` — pre-existing proto-walk. Do not copy.

REP-01/03 (dedicated screen, police restitution) are **not** live. Espionage / faction-vs-faction **depend on a later REP brief**. Do not invent police restitution in MSN.

---

## 10. Contacts, epics, rank gates

| Surface | Live vs jobs |
|---|---|
| Contacts | Dockmaster trust + generated favor on **any** `completeJob`. Fence favor on bounty. (`station.js` 1635–1641; `contacts.js` 1–66) |
| Epics | Not quests. Rank/clue/landmark gates auto-advance (`epics.js` 3–19). Job access is **not** rank-gated. `jobPayMult` only at payout |
| Rank on board | Shown on dock home (`station.js` 2637–2640). Jobs board does not hide cards by rank |
| Standing Digit 9 | Progress UI only (`renderEpics` 2538–2581) |

MSN-03 authored faction reward chains for rare equipment: **absent**. Outfitter sells scanners / mining heads / Q-ship / SHP catalog for UU. Do not redirect those sales into mission grants in the first impl.

---

## 11. Mining career (no mission destination)

| Step | Live |
|---|---|
| Cut | `combat.js` `mineHit` `{ asteroidId, point, laserTier, extractPerSec }` — `asteroidId` is list **index** (1415) |
| Extract | `asteroids.js` 2097–2116: decrement `ore`, `spawnPod` `{ commodity: oreKey, units: 1 or 2 }` |
| Hardness | `ORE_TYPES[key].hardness` vs `MINING_LASERS[world.miningLaser].tier` (`state.js` 63–88, 344+) |
| Soft ores | `rawOre` and `livingRock` hardness **1** (Mk I can cut) |
| Find-aid | AST work sector + commLine + group-3 cue (`docs/AstOrbitsDesign.md` §7) |
| Rock id | `list[i].id === i`. Rebuild on `'systemLoaded'` replaces the list. **Unstable across jump as a UUID.** |

A mining job that stored `asteroidId: 17` would point at a different rock after jump. **Forbidden by AST non-goal.** Inventory confirms no job field names a rock today.

---

## 12. Deadlines

**None on jobs.** The only nearby timer is wreck `expiresAt` (`world.time + 600`), which pulls **offered** recovery cards and makes accept fail closed (“wreck has gone cold”).

`completeJob` cannot fire from expiry. Patrol/haul/ferry/bounty never time out.

---

## 13. Pain points (wishlist vs code)

- MSN-01 replace-on-complete: `completeJob` leaves `DONE` forever. `ensureJobs` will not run again.
- Board grows: done pirate/recovery rows accumulate in the global array with no cap.
- Ordinary deadlines: missing.
- State: `DONE` is shown; no `failed`; no time remaining.
- Eight families: two unique trade cards, one unique ace, a pirate overlay, a salvage overlay. Mining / espionage / passengers / faction-war / exploration absent.
- Patrol reputation is Compact-only, even at Veridian docks.
- Job persist is unsanitized.
- `pirateBountyId` derives from NPC names (hyphen soup). Mining must not copy that for ids.

---

## 14. Files to re-read before an implementation PR

- `src/systems/station.js` — `makeJobs` 1441–1473, `ensureJobs` 1476–1478, pirate/recovery sync 1494–1572, `boardJobs` 1575–1584, `jobPayFor` 1593–1600, `completeJob` 1631–1644, ticks 1652–1751, `acceptJob`/`renderJobs` 2072–2176, digit accept 2740–2742, update 2819–2823, constants 149–168, `DOCK_KEY_SERVICES` 132, `h()` 1820–1825, rescue rep 1360–1384, patrol rep 1671
- `src/game/world.js` — records/bounty 359, 408–417; wreck/incident 811–813, 1313–1346
- `src/game/save.js` — `KEY` 64, `WORLD_FIELDS` 74–97, `SAFE_ID`/`RESERVED_IDS` 100–109 (token class; rejects hyphens; **not** used on jobs today), `sanitizeRestored` 351–399, restore 445–501
- `src/core/ctx.js` — world default 123–148 (no jobs); frozen events 197–226
- `src/game/state.js` — `COMMODITIES`/`ORE_TYPES`/`MINING_LASERS` 63–88, 308–344; `SYSTEMS` 537–541 (6+94=100); `FACTION_SERVICES` jobPayMult 598–605; `FACTIONS` 549+; `JUMP` 542–548; `SHIP_CLASSES.light.cruise` 36; `EPICS` jobPayMult 749+
- `src/systems/asteroids.js` — list identity 1877–1885; extract/pods 2097–2116
- `src/systems/combat.js` — `mineHit` 1415
- `src/game/contacts.js` — favor economy header 26–60
- `src/game/epics.js` — not a quest board 3–19
- `src/game/trafficking.js` — POD-02 sale (closed)
- `scripts/boot-test.mjs` — pins `ferry-consignment`, `haul-provisions`, recovery wreck ids
- `docs/AstOrbitsDesign.md` §9 — no asteroid UUID missions
- `docs/PLAYER-EXPERIENCE-WISHLIST.md` 442–484, 430–438 (REP-04), 618–626 (AST-02 reachable rocks)

---

## 15. First-slice recommendation (inventory, not law)

Law lives in `shared-contract.md`. Inventory recommendation the contract adopted:

**Extend `world.jobs`. Add `kind: 'mining'` renewable slots. Do not migrate the four unique `makeJobs` ids in the first impl. Do not invent the other seven families’ numbers here.**
