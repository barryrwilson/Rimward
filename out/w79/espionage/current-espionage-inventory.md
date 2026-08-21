# Wave 79 — live jobs / sanitize / Digit 2 / reputation / EXP inventory (espionage)

**Wave:** 79. Design only. Code wins over stale comments and over Wave 70/75/77 inventory line numbers.  
**Locked sources:** `src/systems/station.js`, `src/game/save.js`, `src/game/world.js`, `src/game/data-trade.js`, `src/core/ctx.js`, `src/game/state.js` (READ-ONLY), `docs/RepStandingDesign.md` §7 (published board freeze; not a kill-UU table).  
**Not this file’s job:** implement espionage jobs. Do not treat comment banners in `station.js` as law. Do not wait on sibling `out/w79/rep04` or `out/w79/faction-war`.

If this inventory and live code disagree, **live code wins**. Re-sample before an implementation wave.

---

## 0. What exists (one page)

There is **no** `kind: 'espionage'`. Live `JOB_KINDS` is `bounty` | `patrol` | `haul` | `ferry` | `recovery` | `mining` | `trade` | `hunt` | `passenger` | `explore` (`save.js` 138). A stuffed `kind: 'espionage'` row **drops today**.

Renewable Jobs families that **do** exist (Wave 78): mining, trade, hunt, passenger, explore. Each is **two slots per system**, one-in-one-out, 600 s fail-closed. Unique four still occupy four rows. Overlay pirate + recovery share 16-row sanitize headroom.

Local pirate work is **not** espionage: overlay `bounty-pirate-*` plus renewable `kind: 'hunt'`. Faction-level pirate is unique `bounty-ace`. Passenger is dest-dock pay (`FERRY_REWARD`). Explore is landmark visit + origin file; **no** `dataCrystal` / `dataCube` grant.

EXP desk: Assembly Archive on Digit **1** Market (`archiveDeskAllowed` `station.js` 1111; `renderArchiveDesk` 1187). `ARCHIVE_UU = null` (1106). `DATA_DROP_RATE = null` (`data-trade.js` 23). Spawn is a no-op until an owner sets a rate (`data-trade.js` 118–126).

Reputation writers on Jobs: patrol **hardcodes** `reputation.freehold += PATROL_REP` (`station.js` 2777). Mining / trade / hunt / passenger / explore write **employer** `SYSTEMS[origin].faction` +`MINING_REP` (2) with `Object.hasOwn(FACTIONS, key)` (hunt 2657–2658; mining 2893–2895; trade 2942–2944; passenger 2989–2991; explore 3053–3055). Overlay bounty writes **no** rep (3079–3089). There is **no** target-faction Jobs write. There is **no** kill-UU table in live Jobs code.

REP-04 published law (`docs/RepStandingDesign.md` 207–214): success is secret (no target loss). Failure exposes (normal target loss). No drop %, no recon table, no `kind: 'espionage'` in that wave. Kill delta remains **proposed, needs owner**.

---

## 1. Persist

| Surface | Live law | Cite |
|---|---|---|
| Autosave key | `'rimward-save-v1'` | `save.js` 65 |
| Named slots | `rimward-save-v1-slot-1..3` | `save.js` 66 |
| `WORLD_FIELDS` includes `'jobs'` | yes; also `'records'`, `'recordBanks'`, `'incidents'`, `'reputation'`, `'mystery'` | `save.js` 75–97 (`'jobs'` 78) |
| New espionage persist key? | **none** | — |
| Restore heal | `sanitizeRestored` → `sanitizeJobs` then `sanitizeReputation` | `save.js` 864–865 |
| `SAFE_ID` | `/^[a-z0-9_]+$/i` — **rejects hyphens** | `save.js` 101 |
| `RESERVED_IDS` | `__proto__`, `prototype`, `constructor`, … | `save.js` 106–110 |
| `ID_MAX` / `NAME_MAX` | 64 / 40 | `save.js` 103–102 |
| Job id grammar | hyphen **tokens**; do **not** `SAFE_ID.test` the full id | `save.js` 209–221 |
| `JOB_KINDS` | `bounty` \| `patrol` \| `haul` \| `ferry` \| `recovery` \| `mining` \| `trade` \| `hunt` \| `passenger` \| `explore` | `save.js` 138 |
| `'espionage'` in `JOB_KINDS`? | **no** | `save.js` 138 |
| `JOB_STATES` | `offered` \| `accepted` \| `done` \| `failed` | `save.js` 139 |
| Unique four map | `bounty-ace`→`bounty`, `patrol-lane`→`patrol`, `haul-provisions`→`haul`, `ferry-consignment`→`ferry` | `save.js` 140–145 |
| Field allowlist | no `faction`; has `target`, `wreckId`, `slot`, `deadline`, `payQuoted`, `recordId`, `destSystem`, `commodity` | `save.js` 146–151 |
| `PAY_QUOTED_MAX` | **20000** | `save.js` 130 |
| Family slot twins (sanitize) | mining/trade/hunt/passenger/explore **2** each | `save.js` 115–119 |
| Overlay headroom | **16** | `save.js` 120 |
| `N_SYSTEMS` | `Object.keys(SYSTEMS).length` | `save.js` 121; merge `state.js` 541 |
| **LIVE cap** | `4 + 2N + 2N + 2N + 2N + 2N + 16` = `4 + 10*N + 16` | `save.js` 122–129 |
| Cap at 100 systems | **1020** | 4 unique + five families × 2 × 100 + 16 |
| Reputation heal | `Object.keys`; drop reserved; keep only `Object.hasOwn(FACTIONS, key)` | `save.js` 672–692 |

**Cap arithmetic (inventory-time, code):**

```
N_SYSTEMS            = Object.keys(SYSTEMS).length        // 100 (authored 6 + generated 94)
MINING_ROOM          = 2 * N_SYSTEMS                      // 200
TRADE_ROOM           = 2 * N_SYSTEMS                      // 200
HUNT_ROOM            = 2 * N_SYSTEMS                      // 200
PASSENGER_ROOM       = 2 * N_SYSTEMS                      // 200
EXPLORE_ROOM         = 2 * N_SYSTEMS                      // 200
OVERLAY_HEADROOM     = 16
JOBS_SANITIZE_MAX    = 4 + MINING_ROOM + TRADE_ROOM + HUNT_ROOM
                     + PASSENGER_ROOM + EXPLORE_ROOM + OVERLAY_HEADROOM
                     = 4 + 10*N + 16
                     = 1020 at 100 systems
```

There is **no** espionage room in the live formula. There is **no** faction-war room. Comment at `save.js` 122 says explore was the last family added.

### 1.1 `sanitizeOneJob` (non-unique kinds)

| Kind | Id rule | Extra |
|---|---|---|
| Unique four | exact id + mapped kind | `save.js` 268–269 |
| mining | 3 tokens `mine`, `sysId`, `n`; `originSystem === sysId`; slot 0\|1 | `save.js` 270–273, 323–332 |
| trade | 3 tokens `trade`, `sysId`, `n`; dest ≠ origin; `need === 5`; no `livingRock` | `save.js` 274–277, 333–345 |
| hunt | 3 tokens `hunt`, `sysId`, `n`; `recordId` `rec-<n>`; `need === 1`; deadline required | `save.js` 278–281, 346–355, 406 |
| passenger | 3 tokens `passenger`, `sysId`, `n`; dest ≠ origin; **no** `commodity`; `need === 1`; deadline required | `save.js` 282–285, 356–364, 407 |
| explore | 3 tokens `explore`, `sysId`, `n`; `need === 1`; deadline required | `save.js` 286–289, 365–370, 408 |
| bounty (non-unique) | prefix `bounty-pirate-`, ≥3 tokens; **requires** `system` | `save.js` 290–291, 379–382 |
| recovery | prefix `recovery-`; `wreckId` hyphen-token; `originSystem` | `save.js` 292–293, 371–378 |
| anything else | **drop** | `save.js` 294–296 |

Hunt `target` is required (`jobText`, `NAME_MAX` 40) (`save.js` 388–392). `payQuoted` clamps 0…20000 (`save.js` 229–234, 393–396). Unknown keys are not copied (`save.js` 253–261). Prototype / reserved **field** keys skip (`save.js` 257). `faction` is not on `JOB_FIELD_ALLOW` — stuffed `job.faction` **drops**.

A stuffed `kind: 'espionage'` row **drops today**.

### 1.2 Cap drop order (live)

`dropJobsUntilCap` walks index `for` (`save.js` 531–544). Order (`save.js` 562–598):

1. Extra mining on a slot (keep lowest `n`; never drop `accepted` / unique).
2. Extra trade on a slot (same).
3. Extra hunt on a slot **or** duplicate hunt `recordId` (same).
4. Extra passenger on a slot (same).
5. Extra explore on a slot (same).
6. `done`/`failed` mining, trade, hunt, passenger, or explore (non-unique).
7. `done` pirate / `done` recovery.
8. Tamper last resort: offered pirate/recovery whose `system`/`originSystem` ≠ `currentSystem`. Honest offered mining/trade/hunt/passenger/explore **never** drop here (`save.js` 588–592).

**Never drop** (live): unique four; any `accepted`; honest offered mining/trade/hunt/passenger/explore that is one of two slots for its `originSystem`.

---

## 2. Jobs owner and unique four

| Surface | Live | Cite |
|---|---|---|
| Creator | `ensureJobs` if `jobs` empty → `makeJobs` | `station.js` 1767–1769 |
| `initStation` calls `ensureJobs` | yes | `station.js` 3141, 3153 |
| Unique ids | `bounty-ace`, `patrol-lane`, `haul-provisions`, `ferry-consignment` | `station.js` 1732–1764 |
| Unique complete | `completeJob` → `state = 'done'`; no splice | `station.js` 2746–2749 |
| Overlay pirate cap | **2** | `PIRATE_BOUNTY_CAP` 187 |
| Overlay fallback UU | **400** | `PIRATE_BOUNTY_FALLBACK` 188 |
| Recovery overlay | one wreck card | `syncRecoveryJob` (render 3642) |

**Do not migrate the unique four.** Boot-test pins those ids (WAVE26 / WAVE35).

---

## 3. Renewable families (live, Wave 78)

| Family | Kind | Slots | Id prefix | Pay stamp | Complete | Cite |
|---|---|---|---|---|---|---|
| Mining | `'mining'` | 2 | `mine-<sys>-<n>` | origin `jobPayFor` ore × `HAUL_MARGIN` | dest = origin dock + cargo | 189, 1927, 2857–2903 |
| Trade | `'trade'` | 2 | `trade-<sys>-<n>` | origin `jobPayFor` | dest = `otherSystemId` + cargo | 190, 2085, 2905–2952 |
| Hunt | `'hunt'` | 2 | `hunt-<sys>-<n>` | origin `jobPayFor(record.bounty)` | space-side witness | 191, 2291, 2797–2855 |
| Passenger | `'passenger'` | 2 | `passenger-<sys>-<n>` | origin `jobPayFor(FERRY_REWARD)` | dest dock, **no cargo** | 192, 2414, 2954–2999 |
| Explore | `'explore'` | 2 | `explore-<sys>-<n>` | origin `jobPayFor(explorePayBase)` | visit landmark + origin dock | 193, 2556, 3001–3065 |

`explorePayBase` = `Math.round(RECOVERY_REWARD * HAUL_MARGIN)` (`station.js` 2508; `RECOVERY_REWARD` 176 = 300; `HAUL_MARGIN` 173 = 1.4).

`FERRY_REWARD` = **350** (`station.js` 175). Passenger dest = `otherSystemId` = `gates[0].to` (`station.js` 1719–1720, 2358–2362). That dest **may share the origin faction**. Espionage cannot copy that picker if it needs a **rival** flag.

Deadline: `MINING_DEADLINE = 600` (`station.js` 196) cites `WRECK_TTL` (`world.js` 811). Restart on accept (mining 3497; trade 3526; hunt 3560; passenger 3591; explore 3619).

One-in-one-out: `state = 'failed'` **before** pay, splice, immediate replace. Never `completeJob` `done` on these five.

`boardJobs` hides **offered** mining/trade/hunt/passenger/explore/pirate/recovery off-home (`station.js` 2673–2687). Accepted cards show on every dock.

Sync on `renderJobs`: pirates, recovery, mining, trade, hunt, passenger, explore (`station.js` 3640–3647). **No** `syncEspionageJobs`.

---

## 4. Digit 2 Jobs pane (UI)

| Surface | Live | Cite |
|---|---|---|
| Dock keys | `market, jobs, bar, feed, repair, outfitting, people, launch, epics, shipyard` | `DOCK_KEY_SERVICES` 152 |
| Digit map | Digit `d` → index `d-1`; Digit **0** = last = shipyard | 4393–4400 |
| Digit **2** | `jobs` (index 1) | 152 + 4399–4400 |
| Digit **1** | `market` (Archive desk lives here at Assembly) | 152; `renderArchiveDesk` 1187–1188 |
| Digit **9** | `epics` Standing explain | 152; `renderEpics` 4197; RENDERERS 4273 |
| Renderer | `RENDERERS.jobs = renderJobs` | 4264–4266 |
| `h()` | `textContent` only | 3208–3213 |
| `innerHTML` in `station.js` | **none** (grep 0) | — |
| Overlay wipe | `overlay.textContent = ''` | 4291 |
| Digit accept | index into `boardJobs`; mutates job by identity | 4429–4431 |
| Mouse Accept | `btn(..., () => acceptJob(job))` | 3769 |
| Jobs header note | mining/hunt/passenger/explore +2 dock flag; patrol Freehold | 3638–3639 |

Home board can exceed 9 cards (unique four + overlays + 2×5 families = up to 17 without espionage). Digit 1–9 cannot accept past index 8; **mouse Accept still works**. Existing UX. Not a reason to cut slots.

No HUD glance. No new Digit.

---

## 5. Reputation writers (live)

| Writer | Key | Delta | Cite |
|---|---|---|---|
| Patrol job | **hardcoded** `freehold` | `PATROL_REP` **5** | `station.js` 170, 2777 |
| Mining / trade / hunt / passenger / explore | `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS, key)` | `MINING_REP` **2** | 194; hunt 2657–2658; mining 2893–2895; trade 2942–2944; passenger 2989–2991; explore 3053–3055 |
| Overlay pirate / unique ace | **none** | — | 3079–3089 |
| Standing copy | mining +2 dock flag; patrol +5 Freehold | `standingMoveNotes` 1072–1081; `standingLiveNotes` 1101 |
| Rescue | matching faction | `RESCUE.otherRep` 4 / `playerKillRep` 1 | `state.js` 290–291; notes 1078 |
| People sale | victim + Gilded | `trafficking.js` 171–174 | live table, **not** Jobs |
| Sanitize bag | drop non-`FACTIONS` / reserved / non-finite | `save.js` 672–692 |
| `job.faction` as write source | **does not exist** in `src/` (grep 0) | — |

`FACTIONS` keys (`state.js` 549–564): `freehold`, `redledger`, `veridian`, `hollow`, `independent`, `ferrous`, `gilded`, `beautiful`, `congregation`, `assembly`, `lamplighter`, `unknowables`.

Unknowables: Wave 42, **no station**. Do not post Jobs at an Unknowables dock. `isUnknowable` lives in `faction-style.js` 164.

**No live kill-UU table.** Victim-faction piracy is REP-04 and **proposed, needs owner** (`docs/RepStandingDesign.md` 209–210). A sibling Wave 79 worker owns that serial. This inventory does **not** invent a number.

---

## 6. EXP data-trade desk (live)

| Surface | Live | Cite |
|---|---|---|
| Tokens | `dataCrystal`, `dataCube` | `data-trade.js` 5–6 |
| Labels | Data crystal / Data cube | 8–11 |
| Sources | `legal` \| `captured` \| `stolen` | 13 |
| Origin factions | `unknowables`, `assembly` only | 14 |
| Drop rate | **`null`** (unset) | 23 |
| `hasDataDropRate` | false until finite `> 0` | 114–116 |
| `spawnDataPod` | returns `null` | 118–121 |
| Archive UU | **`null`** | `station.js` 1106 |
| Desk gate | `faction === 'assembly'` | `archiveDeskAllowed` 1111–1112 |
| Desk pane | Digit 1 Market, level 2 | `renderArchiveDesk` 1187–1188 |
| Confirm while UU unset | notice only; **no** debit/credit/cargo change | 1176–1181 |
| Explore job grant | **none** | explore complete 3048–3064 credits + employer +2 only |

Explore precedent: Jobs **must not** seed or grant `dataCrystal` / `dataCube`. EXP SKU / drop % / Archive UU stay owner-open and **out of MSN**.

---

## 7. Pay / clock / events

| Surface | Live | Cite |
|---|---|---|
| `jobPayFor(ctx, sysId, base)` | epic `jobPayMult` × faction service (authored six skip service) | `station.js` 2695–2702 |
| `jobPay` | current-system shorthand | 2704–2706 |
| `clampJobPay` | round; 0…20000 | 1867–1869 |
| Unique haul/ferry stamp | dest `jobPayFor` (Wave 26) | accept 3477, 3628 |
| Mining/trade/hunt/passenger/explore stamp | **origin** `jobPayFor` | accept 3496–3619 |
| Deadline clock | `world.time` (healed to 0) | `save.js` 862; compare in `tickDeliveryJobs` |
| `ctx.elapsed` | visual only | `ctx.js` 234 |
| Job tick | 0.5 s, docked or not | `station.js` 4508–4512 |
| Patrol / recovery collect | every frame | 4509–4510 |
| Events | `'commLine'` `{ text }` | `ctx.js` 206; no `job*` type 198–227 |
| `maybeRefreshJobsBoard` | render if docked + Jobs pane | 2000–2003 |

Do **not** invent a third clock. Do **not** add a frozen event.

---

## 8. Dest / identity helpers (relevant to spy dest)

| Helper | Live | Cite |
|---|---|---|
| `otherSystemId` | `ctx.systems[id].gates[0].to ?? id` | `station.js` 1719–1720 |
| Passenger dest | that gate, or skip post | 2358–2362 |
| Trade dest at **pay** | **rebounds** `otherSystemId(origin)` — stuffed `job.destSystem` does not retarget | 2928–2929 |
| Hunt quarry | `recordId` `rec-<n>` + origin bank | `save.js` 346–355; `world.js` `makeRecord` |
| Explore site | `SYSTEMS` landmarks; UI prints **name**, never landmark id | explore tick 3020–3047 |
| Asteroid id | `list[i].id === i` — **forbidden** as a mission bind | AST closed |
| Mystery clues | `clueFound` event; Jobs must **not** print clue ids | `ctx.js` 208 |

Passenger/trade dest may be the **same faction** as origin. Espionage target-faction law needs a **different** `SYSTEMS[dest].faction`.

---

## 9. XSS / proto / stuffed pay (live defenses)

- Titles/details: `stripControlChars` + caps 240/720 (`save.js` 236–239, 297–299).
- Render: `h(..., text)` → `textContent` (`station.js` 3208–3213). Family cards **regen** from templates + allowlisted `SYSTEMS` / record names (`station.js` 3653–3687).
- Job ids: hyphen tokens; `RESERVED_IDS` on full id and every token (`save.js` 209–221).
- Walks: `Object.keys` / index `for` in sanitize. Fresh `{}` / `[]`.
- `payQuoted` clamp 0…20000 on restore and at family pay.
- Expire branches emit `commLine` and replace; **no pay**.
- Prototype field keys skipped (`save.js` 257).

Gaps **today** (not espionage-specific): unique/overlay `job.reward` at claim is not `clampJobPay` (ace/pirate 3077–3089). Patrol writes hardcoded `freehold`. Digit accept is index-into-board (race if board reshuffles). Espionage must **not** copy those holes.

---

## 10. Closed neighbours (do not reopen)

| Topic | Live | Espionage must not |
|---|---|---|
| Unique four | `makeJobs` ids | migrate / rename |
| Overlay pirates | cap 2, `completeJob` | steal slots |
| Hunt | local pirate record | reuse `'hunt'` / `'bounty'` |
| Passenger | dest dock, `FERRY_REWARD` | reuse `'passenger'`; POD survivor cargo |
| Explore | landmark + origin file | print clue ids; grant data cargo |
| EXP | hangar rows; Archive UU null | invent drop % / desk UU |
| REP kill attrib | unpublished | invent a kill UU table (sibling Wave 79) |
| Faction-war | unpublished | invent war numbers (sibling Wave 79) |
| AST | no rock UUID | `asteroidId` |
| BIO / POD / SHP / TGT-05 | closed | reopen |
| NPC missiles / power ledger | closed | reopen |
| `state.js` | READ-ONLY for feature workers | header 7–8 |

---

## 11. Wishlist / REP freeze (read-only)

Initiative MSN MSN-02 lists espionage among careers (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 563–574). Status: hunt/passenger/explore shipped Wave 78; **espionage and faction-war wait on REP-04** (121–126, 547–548).

Initiative REP REP-04 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 525–533; `docs/RepStandingDesign.md` 207–214):

- Successful espionage is **secret** and causes **no** target-faction reputation loss.
- Failure **exposes** and **may** cause the normal loss.
- No universal crime score.
- Overt faction-against-faction is a **different** family (sibling).

Board mechanics freeze from **live code** + that published §7. Do not invent kill UU.

---

## 12. Verification pins (this inventory)

- `JOB_KINDS` `save.js` 138 — no `'espionage'`.
- Live cap `save.js` 115–129 — `4+10*N+16` = **1020** at 100. No espionage room. No war room.
- Digit 2 = Jobs (`DOCK_KEY_SERVICES` 152; keydown 4393–4400).
- `h()` `textContent` 3208–3213. `innerHTML` 0 in `station.js`.
- Employer +2 mining path. Patrol `freehold` 2777. No `job.faction`.
- `DATA_DROP_RATE` null; `ARCHIVE_UU` null; explore grants no data cargo.
- Unique four `makeJobs` 1738–1763.
- `WORLD_FIELDS` `'jobs'` 78. Autosave `rimward-save-v1` 65.
