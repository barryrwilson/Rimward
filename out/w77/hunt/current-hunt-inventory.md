# Wave 77 — live hunt / pirate-bounty / jobs inventory

**Wave:** 77. Design only. Code wins over stale comments and over Wave 70/75 inventory line numbers.  
**Locked sources:** `src/systems/station.js`, `src/game/save.js`, `src/game/world.js`, `src/systems/npc.js`, `src/core/ctx.js`, `src/game/state.js` (READ-ONLY).  
**Not this file’s job:** implement hunt jobs. Do not treat comment banners in `station.js` as law.

If this inventory and live code disagree, **live code wins**. Re-sample before an implementation wave.

---

## 0. What exists (one page)

There is **no** `kind: 'hunt'`. Local pirate work on the Jobs board today is the **overlay** family: `kind: 'bounty'` + id prefix `bounty-pirate-`, cap **2** per system, posted from live `role === 'pirate'` records with `bounty > 0`. Completing overlay or unique ace uses `completeJob` → `state = 'done'` and **does not splice a replacement**.

Faction-level pirate threat today is unique **`bounty-ace`** (Named Gun / Carver Illyx), plus world.js Named-Gun hunter/aspirant records with `role: 'ace'`. Those are **not** a renewable local-hunt family.

Renewable Jobs families that **do** exist: mining (`kind: 'mining'`, 2 slots/system) and trade (`kind: 'trade'`, 2 slots/system). Unique four still occupy four rows. Overlay pirate + recovery share 16-row sanitize headroom.

---

## 1. Persist

| Surface | Live law | Cite |
|---|---|---|
| Autosave key | `'rimward-save-v1'` | `save.js` 65 |
| Named slots | `rimward-save-v1-slot-1..3` | `save.js` 66 |
| `WORLD_FIELDS` includes `'jobs'` | yes; also `'records'`, `'recordBanks'`, `'incidents'`, `'reputation'` | `save.js` 75–97 |
| New hunt persist key? | **none** | — |
| Restore heal | `sanitizeRestored` → `sanitizeJobs` then `sanitizeReputation` | `save.js` 663–712 |
| `SAFE_ID` | `/^[a-z0-9_]+$/i` — **rejects hyphens** | `save.js` 101 |
| `RESERVED_IDS` | `__proto__`, `prototype`, `constructor`, … | `save.js` 106–110 |
| `ID_MAX` / `NAME_MAX` | 64 / 40 | `save.js` 102–103 |
| Job id grammar | hyphen **tokens**; do **not** `SAFE_ID.test` the full id | `save.js` 197–208 |
| `JOB_KINDS` | `bounty` \| `patrol` \| `haul` \| `ferry` \| `recovery` \| `mining` \| `trade` | `save.js` 127 |
| `JOB_STATES` | `offered` \| `accepted` \| `done` \| `failed` | `save.js` 128 |
| Unique four map | `bounty-ace`→`bounty`, `patrol-lane`→`patrol`, `haul-provisions`→`haul`, `ferry-consignment`→`ferry` | `save.js` 129–134 |
| Field allowlist | no `faction`; no `recordId`; has `target`, `wreckId`, `slot`, `deadline`, `payQuoted` | `save.js` 135–139 |
| `PAY_QUOTED_MAX` | **20000** | `save.js` 123 |
| Mining slots (sanitize twin) | 2 | `save.js` 115 |
| Trade slots (sanitize twin) | 2 | `save.js` 116 |
| Overlay headroom | **16** | `save.js` 117 |
| **LIVE cap** | `4 + 2*N + 2*N + 16` | `save.js` 118–122 |
| Cap at 100 systems | **420** | comment `save.js` 118; `SYSTEMS` merge `state.js` 541 |
| `N_SYSTEMS` | `Object.keys(SYSTEMS).length` — authored 6 + generated 94 | `state.js` 12–18, 541 |
| Reputation heal | `Object.keys`; drop reserved; keep only `Object.hasOwn(FACTIONS, key)` | `save.js` 519–538 |

**Cap arithmetic (inventory-time, code):**

```
N_SYSTEMS            = Object.keys(SYSTEMS).length        // 100
MINING_ROOM          = 2 * N_SYSTEMS                      // 200
TRADE_ROOM           = 2 * N_SYSTEMS                      // 200
OVERLAY_HEADROOM     = 16                                 // pirate cap 2 + recovery + spare
JOBS_SANITIZE_MAX    = 4 + MINING_ROOM + TRADE_ROOM + OVERLAY_HEADROOM
                     = 420 at 100 systems
```

There is **no** hunt room in the live formula.

### 1.1 `sanitizeOneJob` (non-unique kinds)

| Kind | Id rule | Extra |
|---|---|---|
| Unique four | exact id + mapped kind | `save.js` 256–257 |
| mining | 3 tokens `mine`, `sysId`, `n`; `originSystem === sysId`; slot 0\|1 | `save.js` 258–261, 296–305 |
| trade | 3 tokens `trade`, `sysId`, `n`; dest ≠ origin; `need === 5`; no `livingRock` | `save.js` 262–265, 281, 306–318, 353 |
| bounty (non-unique) | prefix `bounty-pirate-`, ≥3 tokens; **requires** `system` | `save.js` 266–267, 327–329 |
| recovery | prefix `recovery-`; `wreckId` hyphen-token; `originSystem` | `save.js` 268–269, 319–326 |
| anything else | **drop** | `save.js` 270–271 |

Bounty `target` is required (`jobText`, `NAME_MAX` 40) (`save.js` 336–339). `payQuoted` clamps 0…20000 (`save.js` 217–221, 341–343). Unknown keys are not copied (`save.js` 243–248). Prototype / reserved **field** keys skip (`save.js` 245).

A stuffed `kind: 'hunt'` row **drops today** (not in `JOB_KINDS`).

### 1.2 Cap drop order (live)

`dropJobsUntilCap` walks index `for` (`save.js` 392–405). Order (`save.js` 422–445):

1. Extra mining on a slot (keep lowest `n`; never drop `accepted` / unique).
2. Extra trade on a slot (same).
3. `done`/`failed` mining or trade.
4. `done` recovery; `done` `bounty-pirate-*`.
5. Tamper last resort: offered pirate whose `system !== currentSystem`; offered recovery off-current. **Never** honest offered mining/trade.

**Never drop:** unique four; any `accepted` job; honest offered mining; honest offered trade.

---

## 2. Station jobs board

| Surface | Live law | Cite |
|---|---|---|
| Overlay pirate cap | `PIRATE_BOUNTY_CAP = 2` | `station.js` 187 |
| Overlay fallback UU | `PIRATE_BOUNTY_FALLBACK = 400` | `station.js` 188 |
| Mining slots | `MINING_SLOTS_PER_SYSTEM = 2` | `station.js` 189 |
| Trade slots | `TRADE_SLOTS_PER_SYSTEM = 2` | `station.js` 190 |
| Mining/trade rep | `MINING_REP = 2` | `station.js` 191 |
| Deadline | `MINING_DEADLINE = 600` (cites `WRECK_TTL`) | `station.js` 192–193 |
| Wreck TTL | `WRECK_TTL = 600` | `world.js` 811 |
| Patrol | `PATROL_REWARD 300`, `PATROL_REP 5`, `PATROL_NEED 2` | `station.js` 169–171 |
| Haul | `HAUL_UNITS 5`, `HAUL_MARGIN 1.4` | `station.js` 172–173 |
| `PAY_QUOTED_MAX` | 20000 (station twin) | `station.js` 196 |
| Default ace | name `'Carver Illyx'`, bounty 2500 | `station.js` 185–186 |
| Digit 2 Jobs | `DOCK_KEY_SERVICES[1] === 'jobs'`; hotkey `i+1` | `station.js` 152, 3424–3427 |
| `h()` | `textContent` only | `station.js` 2489–2494 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| Digit accept | index into `boardJobs` | `station.js` 3548–3550 |
| Jobs tick | docked or not; 0.5 s `tickDeliveryJobs` | `station.js` 3627–3631 |
| `initStation` | `ensureJobs` | `station.js` 2422, 2434 |

### 2.1 Unique four (`makeJobs`)

Exact ids (`station.js` 1724–1756):

1. `bounty-ace` / `kind: 'bounty'` / `target: aceName`
2. `patrol-lane` / `kind: 'patrol'`
3. `haul-provisions` / `kind: 'haul'`
4. `ferry-consignment` / `kind: 'ferry'`

`ensureJobs`: empty array → `makeJobs` (`station.js` 1759–1761). Completing unique cards sets `done` (`completeJob` `station.js` 2202–2205). **No splice.**

`refreshBountyJob` retargets **only** `id === 'bounty-ace'` from the live ace record (`station.js` 1765–1774).

### 2.2 Overlay pirate bounties (do not collide)

`pirateBountyId(name)` = `` `bounty-pirate-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` `` (`station.js` 1777–1778).

`syncPirateBounties(ctx, sysId)` (`station.js` 1786–1819):

- Pull **offered** `kind === 'bounty'` + `bounty-pirate-` if no live `role === 'pirate'` with matching id and state not `dead`/`captured`.
- Count posted: same kind/prefix, `j.system === sysId`, `state !== 'done'`.
- Fill until `PIRATE_BOUNTY_CAP` (2) from `ctx.world.records`: `r.system === sysId`, `role === 'pirate'`, `bounty > 0`, not dead/captured, id not already on the board.
- Push `{ id, kind: 'bounty', target: r.name, system: sysId, reward: r.bounty \|\| 400, need: 1, state: 'offered' }`.
- **No** `deadline`. **No** `payQuoted` stamp. **No** `slot`. **No** `originSystem`. **No** `recordId`.

Claim (`tickDeliveryJobs`, `station.js` 2350–2370):

- Requires `state === 'accepted'` (gate at 2349).
- Ace: record `dead`/`captured` + incident `name === ace.name` + `causer === 'player'`; pay `jobPay(ctx, job.reward)` (current-system `jobPayFor`); `completeJob` → `done`.
- Overlay pirate: incident `kind === 'destroyed'` + `name === job.target` + `causer === 'player'`; pay `jobPay(ctx, job.reward)`; `completeJob` → `done`.
- Overlay **does not** write reputation. Fence favor only because `rewardJobContacts` tests `job.kind === 'bounty'` (`station.js` 2189–2198).

**DONE leak:** overlay/unique `done` rows stay on `world.jobs` until sanitize cap drop (done pirate is drop-tier 4). `boardJobs` still **shows** `DONE` (`station.js` 2950–2951). Wishlist MSN-01 replacement is **not** live for overlay.

### 2.3 Mining / trade (precedent for a renewable family)

| Step | Mining | Trade |
|---|---|---|
| Id | `mine-<sys>-<n>` `nextMiningId` 1870–1888 | `trade-<sys>-<n>` `nextTradeId` 2009+ |
| Sync | `syncMiningJobs` 1919–1938 | `syncTradeJobs` (~2080–2091) |
| Slots | 2, `slot` 0\|1 | 2, `slot` 0\|1 |
| Replace | splice + push same origin+slot (`replaceMiningJob` 1959–1968) | `replaceTradeJob` 2117–2128 |
| Accept | origin `payQuoted`; restart 600 s (`station.js` 2769–2778) | origin only; dest `otherSystemId`; origin quote (`2779–2807`) |
| Tick | expire fail closed; deliver at origin; `failed` then pay; +2 employer | expire fail closed; deliver at **rebound** dest; +2 employer (`2300–2347`) |
| `completeJob` | **not** used | **not** used |

Employer write (`station.js` 2288–2290, 2337–2339):

```
faction = SYSTEMS[origin].faction
if typeof faction === 'string' && Object.hasOwn(FACTIONS, faction)
  reputation[faction] = (reputation[faction] ?? 0) + MINING_REP
```

Patrol **still** does `ctx.world.reputation.freehold += PATROL_REP` (`station.js` 2233). Do not copy.

### 2.4 Board filter

`boardJobs` (`station.js` 2132–2142) hides **offered** pirate/recovery/mining/trade when off-home. Unique cards always list. Accepted cards list everywhere. There is no hunt filter.

`renderJobs` order (`station.js` 2822–2832): `refreshBountyJob` → `syncPirateBounties` → `syncRecoveryJob` → `syncMiningJobs` → `syncTradeJobs`.

Titles for mining/trade **regenerate** from allowlisted `COMMODITIES` / `SYSTEMS` names (`station.js` 2838–2851). Overlay/ace titles print `job.title` / `job.target` from the job object (stripped on restore only).

### 2.5 Pay helper

`jobPayFor(ctx, sysId, base)` = round(base × epic `jobPayMult` × generated-system service `jobPayMult`) (`station.js` 2151–2158).  
`jobPay(ctx, base)` = `jobPayFor` at **current** system (`station.js` 2160–2161).  
`clampJobPay` 0…20000 (`station.js` 1858–1861).

Overlay/ace **do not** stamp `payQuoted`. Mining/trade **do**.

---

## 3. World records, Named Guns, Witness Rule

| Surface | Live law | Cite |
|---|---|---|
| Record id | `` `rec-${nextRecordNum++}` `` (`nextRecordNum` starts 1) | `world.js` 252, 282–285 |
| Role | `trader` \| `pirate` \| `patrol` \| `ace` \| `miner` | `world.js` 296 |
| Pirate seed | `bounty: 300 + i * 75`; station overlay **reads this** | `world.js` 348–360 |
| Ace seed | Freehold cast `Carver Illyx`, bounty 2500, `role: 'ace'` | `world.js` 407–419 |
| Migration | “The ace, pirates, and miners NEVER migrate.” | `world.js` 30 |
| Banks | `recordBanks[sysId]`; `ctx.world.records` is the current bank | `world.js` 13–16, 425–427 |
| Witness wrecks | wrecks only from real `npcDestroyed` incidents | `world.js` 37–38 |
| Incidents | `{ id: inc-…, kind: destroyed\|surrendered, name, faction, role, causer }` — **no record id** | `world.js` 1332–1346 |
| `WRECK_TTL` | 600 | `world.js` 811 |
| Collector | injected `role: 'pirate'` with `col.bounty` | `world.js` 923–946 |
| Hunter Named Gun | `ACES.hunter` Sister Vane, `role: 'ace'`, redmarch | `state.js` 827–844; inject `world.js` 463–493 |
| Illyx line | `ACES.illyx` Carver Illyx | `state.js` 845–861 |
| Aspirants | `NAMED_GUNS.aspirants.names` Harrow Quist, Saint Ruvic, Ash Bell; bounty 4000 | `state.js` 887–901; spawn `world.js` 584–622 |

`findAceRecord` (`station.js` 1695–1699): first `role === 'ace'` or `classKey === 'ace'` in **current** `ctx.world.records`; fallback name/bounty. Ace home is the system whose `cast.ace` is set (`aceHomeSystem` `station.js` 1715–1719).

Q-ships: odd-index pirates `role` stays `'pirate'` (`world.js` 362–371). Overlay already treats them as pirates.

---

## 4. NPC “hunt” (not a job kind)

`npc.js` `makeAi`: `role === 'pirate'` → AI **mode** `'hunt'` (`npc.js` 200). That string is combat AI, **not** `JOB_KINDS`. Do not reuse confusion: a Jobs `kind: 'hunt'` does not change NPC mode.

Pirate AI still uses record `bounty`, `role`, `name` (`npc.js` 33–37, 272).

---

## 5. ctx / state (read-only for this family)

| Surface | Live law | Cite |
|---|---|---|
| Default jobs | **none** on `ctx.world`; `ensureJobs` creates | `station.js` 1759–1761 |
| Events | frozen comment list; jobs complete via `'commLine'` `{ text }` | `ctx.js` 198–228; `completeJob` 2205 |
| `cargoCapacity` | 20 | `ctx.js` 109 |
| `state.js` | READ-ONLY for feature workers | `state.js` 6–8 |
| `SYSTEMS` | authored + generated | `state.js` 541 |
| No hunt commodity | hunt is not cargo | — |

Mystery events (`clueFound`, `landmarkFound`) exist (`ctx.js` 208). Hunt UI must **not** print unpublished clue ids.

---

## 6. Wishlist split (MSN-02)

`docs/PLAYER-EXPERIENCE-WISHLIST.md` 549–557 lists both:

- hunting a **local** pirate;
- hunting a **faction-level** pirate threat.

Live mapping:

| Wishlist row | Live surface | Renewable? |
|---|---|---|
| Local pirate | overlay `bounty-pirate-*` cap 2 | **No** (`done` leak; opportunistic; no slots) |
| Faction-level | unique `bounty-ace` + Named Gun aces | **No** (unique card; lineage is world.js, not Jobs slots) |
| Mining | `kind: 'mining'` 2 slots | Yes (Wave 71) |
| Trade | `kind: 'trade'` 2 slots | Yes (Wave 76) |

This Wave 77 family is **local** only. Unique `bounty-ace` stays the Named Gun / faction-level card.

---

## 7. Overlay reuse — not safe (inventory proof)

Do **not** stuff renewable hunt into overlay.

1. **Kind collision:** overlay and unique ace share `kind: 'bounty'` (`station.js` 1731, 1812; `save.js` 266–267). A slot machine on `kind === 'bounty'` would hit Named Gun.
2. **Id collision:** overlay ids are **name-derived** `bounty-pirate-…` (`station.js` 1777–1778). Hunt ids must be `hunt-<sys>-<n>` (token class). Copying `pirateBountyId` reintroduces proto-from-name (`constructor` → token drop is overlay’s problem already; do not copy).
3. **Complete path:** overlay uses `completeJob` → `done` (`station.js` 2370). Renewable law is splice + replace (mining 2280–2296). Mixing would leave DONE hunt cards.
4. **Cap 2 is live overlay, not a career:** `PIRATE_BOUNTY_CAP` 2 (`station.js` 187). Two extra career slots on top of overlay need hunt room in sanitize, not a steal of overlay headroom.
5. **Cast starvation if exclusive:** authored casts include `pirates: 1` (Verge, `authored-systems.js` 212). Overlay can consume the only quarry. Hunt slots must be allowed to **name the same local pirate** as overlay, with **one Jobs payout per kill** (contract). Exclusive “hunt takes leftover pirates” would zero the Verge career.
6. **No deadline / no `payQuoted` / no employer rep** on overlay. Hunt freeze needs those (mining/trade). Overlay pay is live `jobPay(currentSystem, job.reward)` — stuffed `reward` is not clamped to `PAY_QUOTED_MAX` at claim (only finite number on sanitize). Hunt must stamp+clamp.
7. **Incidents key by `name` not record id** (`world.js` 1332–1341; overlay claim `station.js` 2364–2366). Stuffed `job.target` retargets overlay pay. Hunt must rebind the **record** and match incidents to **record.name**.

---

## 8. Known boot FAILs (do not “fix”)

Live boot-test still names WAVE4 / WAVE26 / WAVE35 families (`scripts/boot-test.mjs` WAVE4 ferry/contacts; WAVE26 faction-comp / haul-ferry quotes; WAVE35 haul named dest). Hunt design must not retcon unique haul/ferry/ace ids or those ticks.

---

## 9. Cite index (verifier sample)

Minimum 12 live cites used above:

1. `save.js` 65 — autosave key  
2. `save.js` 78 — `'jobs'` on `WORLD_FIELDS`  
3. `save.js` 101 — `SAFE_ID`  
4. `save.js` 115–122 — live cap 420  
5. `save.js` 127 — `JOB_KINDS` (no `'hunt'`)  
6. `save.js` 129–134 — unique four  
7. `save.js` 266–267, 327–339 — overlay bounty sanitize  
8. `save.js` 407–446 — `sanitizeJobs` drop order  
9. `station.js` 187–193 — overlay cap, mining/trade slots, `MINING_REP`, 600 s  
10. `station.js` 1724–1756 — unique four  
11. `station.js` 1777–1819 — overlay sync  
12. `station.js` 2132–2142 — `boardJobs`  
13. `station.js` 2202–2205 — `completeJob` done  
14. `station.js` 2233 — patrol `reputation.freehold +=`  
15. `station.js` 2288–2290 — mining employer +2  
16. `station.js` 2350–2370 — ace vs overlay claim  
17. `station.js` 2489–2494 — `h()` `textContent`  
18. `station.js` 2828–2832 — render sync order  
19. `station.js` 3548–3550 — Digit accept  
20. `world.js` 30, 282–360, 811, 1332–1346 — pirates never migrate; `rec-n`; bounty seed; TTL; incidents  
21. `state.js` 541, 827–901 — SYSTEMS; ACES; NAMED_GUNS  
22. `npc.js` 200 — AI mode `'hunt'`  
23. `ctx.js` 206 — `'commLine'`
