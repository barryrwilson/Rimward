# Current REP inventory (Wave 73)

**Wave:** 73. Design only.  
**Rule:** Live code wins over comments, lore, and this inventory if they disagree. Re-open the cited files before an implementation wave.  
**Scope:** faction standing bag, `RANK_LADDER` / `rankFor`, Standing dock service, patrol/job/rescue/graft/sale writers, persist, patrol hunt, yards.

This file is the source of truth for “reputation today.” The integrator brief and `shared-contract.md` must not invent fields that are not here unless they mark them **proposed, needs owner**.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/game/state.js` | `RANK_LADDER`, `rankFor`, `FACTIONS`, `ORIGINS` deltas, `EPICS` rankTier, `RESCUE`, `ORIGIN_ARCS`, `ECON.fear` |
| `src/core/ctx.js` | default `world.reputation` keys; frozen events (no `reputationChanged`) |
| `src/game/save.js` | `WORLD_FIELDS` `'reputation'`; wholesale restore; **no bag heal** |
| `src/systems/station.js` | Standing (Digit 9 / `epics`), rank line, jobs, rescue, restricted locker, prices |
| `src/game/hangar.js` | `standingOf`, `applyAbominationStanding`, graft refuse |
| `src/systems/npc.js` | `HOSTILE_STANDING` −10, `standingOf`, `mayHuntPlayer`, law zone |
| `src/systems/hail.js` | combat / demand / salvage / vouch intents — **no police leave** |
| `src/game/world.js` | origin-arc `redledger` writes; greenhand `for…in` read |
| `src/game/origins.js` | origin pick merges authored deltas |
| `src/game/epics.js` | `rankFor` gates; `epicEffects` read-only |
| `src/game/shipyard.js` | `dockReputation`, hostile `rep < 0`, `minRepFor`, `yardPrice` |
| `src/systems/shipyard-desk.js` | `'No sale.'` / graft warning textContent |
| `src/game/trafficking.js` | Gilded sale victim + gilded deltas |
| `src/systems/hud.js` | `commLine` / `epicStage` toasts via `textContent` |
| `docs/MsnMissionsDesign.md` | mining employer-only; patrol freehold; espionage waits |
| `docs/BioLivingShipsDesign.md` | graft Beautiful cap −10 |
| `docs/Pod02TraffickingDesign.md` | Digit 7 sale standing; list 160/240 |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | Initiative REP ~450–495 (do **not** edit) |

---

## 1. Ladder and rank helper (`state.js`) — READ-ONLY

```
src/game/state.js 672–683
```

| min | name | tier |
|---|---|---|
| 50 | Sworn | 3 |
| 25 | Trusted | 2 |
| 10 | Known | 1 |
| −10 | Stranger | 0 |
| −25 | Suspect | −1 |
| −1000 | Marked | −2 |

`rankFor(rep)` returns the **first** rung where `rep >= rung.min`. If every compare is false (including `NaN`), it returns the last rung **Marked**.

Feature workers must **not** add rungs. Neutral numeric 0 is **Stranger**.

---

## 2. Persist and default bag

| Surface | Today | Cite |
|---|---|---|
| Autosave key | `rimward-save-v1` (unchanged) | `save.js` persist path; no sibling crime key |
| Field | `WORLD_FIELDS` includes `'reputation'` | `save.js` 74–75 |
| Restore | Wholesale `ctx.world[k] = snap.world[k]` | `save.js` 698–700 |
| Sanitize | `sanitizeRestored` heals credits/fear/jobs/cargo — **not** the reputation bag | `save.js` 599–647 |
| Default bag | `{ freehold: 0, redledger: 0, veridian: 0, hollow: 0 }` | `ctx.js` 128 |
| Missing keys | Beautiful, gilded, ferrous, assembly, congregation, lamplighter, independent, unknowables **absent** until a writer creates them | default vs `FACTIONS` 549–564 |
| Read miss | Most UI uses `reputation[faction] ?? 0` | `station.js` 2806, 2888 |
| Finite miss | `hangar.standingOf` / `shipyard.dockReputation` treat non-object bag, missing own key, or non-finite as **0** | `hangar.js` 119–126; `shipyard.js` 80–86 |

**Fail-closed missing keys:** a missing faction key is 0 for rank (Stranger). Writers create the key when they first add a delta (graft creates `beautiful`; mining creates employer key; rescue writes dock faction).

**No `crimeScore`. No `wanted` flag.** Fear is a separate scalar (`ctx.world.fear`, `ECON.fear.tributeOpensAt` 40 — `state.js` 284).

---

## 3. Standing dock service (Digit 9)

| Surface | Today | Cite |
|---|---|---|
| Dock keys | `['market','jobs','bar','feed','repair','outfitting','people','launch','epics','shipyard']` | `station.js` 132 |
| Digits | 1–9 map first nine keys; **0 is shipyard** | `station.js` 2881–2885 |
| Standing | service id `'epics'`, label `'Standing'` | `station.js` 1001, 2848, 2881 |
| Panel | epic name, stage ticks, next-rank hint, `ACTIVE STANDING` effect lines | `station.js` 2788–2831 |
| Rank line | dock root: `Faction: Rank (±N rep)` | `station.js` 2887–2890 |
| DOM | `h()` sets `textContent` only | `station.js` 2027–2032 |
| Empty | independents: `'No standing here.'` | `station.js` 2792–2794 |

Standing today explains **epic stages**, not the full ladder, not “how standing moves,” and not a reason line for the last delta.

---

## 4. Writers (deltas)

### 4.1 Patrol job — hardcoded **freehold**

| | |
|---|---|
| Constant | `PATROL_REP = 5` (`station.js` 150) |
| Write | `ctx.world.reputation.freehold += PATROL_REP` (`station.js` 1825) |
| Board copy | `+${PATROL_REP} Freehold rep` (`station.js` 2384) |
| Pay | `PATROL_REWARD` 300 UU via `jobPay` |

Does **not** read dock faction. A Veridian patrol card still credits Freehold. **Msn inventory already names this.** Wave 73 does not retarget it.

### 4.2 Mining job — employer faction

| | |
|---|---|
| Constant | `MINING_REP = 2` (`station.js` 170) |
| Write | `SYSTEMS[origin].faction` if `Object.hasOwn(FACTIONS, faction)` then `bag[faction] = (?? 0) + MINING_REP` (`station.js` 1879–1881) |
| Expire | no reputation (`station.js` 1850–1860) |

MSN contract already froze employer-only. REP rides this for legal grind.

### 4.3 Other jobs

`completeJob` (`station.js` 1794–1798) sets `done`, trust/favor. **Haul, ferry, bounty, recovery do not write reputation.**

### 4.4 Survivor rescue (Digit 7 People, matching dock)

| | |
|---|---|
| Table | `RESCUE.otherRep` **4**, `playerKillRep` **1** (`state.js` 289–294) |
| Write | matching-faction return: `bag[faction] = (finite or 0) + nOther*4 + nKill*1` (`station.js` 1370–1388) |
| Guard | `Object.hasOwn(FACTIONS, faction)` before apply |
| Line | `textContent` via `h()` / `commLine` (`speakRescueLine` 1365–1368) |

POD tone: do not retune.

### 4.5 Survivor sale (Gilded Digit 7)

| | |
|---|---|
| List UU | `TRAFFIC_LIST_UU` other **160**, playerKill **240** (`trafficking.js` 8) |
| Victim | other **0**, playerKill **−8** per unit (`trafficking.js` 9–13, 171–174) |
| Gilded | **+2** per unit (`gildedPerUnit`) |
| Guard | `canWriteRep`: object bag, `isFactionKey`, `Object.hasOwn(FACTIONS)` (`trafficking.js` 70–81) |
| Fear | +1 / +2 **once per lot**, clamp 0…100 — **not** a crime score |

POD owns these numbers. REP must not retune 160/240 or −8/+2.

### 4.6 Graft / Abomination (BIO)

| | |
|---|---|
| Hunt floor | `HOSTILE_STANDING = -10` hangar-local (`hangar.js` 110–111); same value as `npc.js` 87 |
| Cap | while any hangar row `grafted === true`: `bag.beautiful = min(currentOr0, −10)` (`hangar.js` 138–154) |
| Create key | missing bag replaced with `{}`; writes `'beautiful'` after `RESERVED_IDS` + `hasOwn(FACTIONS)` |
| Graft refuse | Gilded standing `< 0` → `'reputation'` (`hangar.js` 738; desk `'No sale.'` `shipyard-desk.js` 57) |
| Warning | `GRAFT_WARN` textContent (`shipyard-desk.js` 61–63) |

BIO owns −10. REP must not retune.

### 4.7 Origins (pick, once)

| Origin | Deltas | Cite |
|---|---|---|
| `ledgerDebt` | redledger −10, freehold +10 | `state.js` 709; `origins.js` 55–59 `Object.keys` |
| `marked` | veridian −15, redledger +10 | `state.js` 714 |
| others | no reputation | `state.js` 701–724 |

### 4.8 Origin arc (`world.js`)

| Event | Write | Cite |
|---|---|---|
| Ledger call | `redledger += repPerCall` (−3, round2 −5) | 1008–1011, 1032; `ORIGIN_ARCS` `state.js` 1025–1050 |
| Debt clear | `redledger += clearRepBonus` (+10 / +5) | 1006, 1045 |
| Greenhand beat | **read** `for (const f in ctx.world.reputation)` | 1093–1096 |

Greenhand uses `for…in` on the live bag (inherited keys if polluted). Not a writer.

### 4.9 Combat kill

`combat.js` emits `npcDestroyed`. **No reputation write** on player kill. Piracy is not attributed today.

---

## 5. Readers (consequences that already exist)

| Consequence | Rule | Cite |
|---|---|---|
| Patrol hunt | role `patrol` hunts if standing vs **that NPC’s faction** ≤ −10, else only if player scratched them | `npc.js` 87, 1020–1026, 1065–1072 |
| Law zone | no hostile intent inside 300 u of station | `npc.js` 86, 1744–1749 |
| Yard buy | `rep < 0` or `rep < minRepFor` → no sale | `shipyard.js` 190–191; `MIN_REP` ace 10, frigate 25 (`shipyard.js` 42–48) |
| Yard price | Known −5%, Trusted −10%, Sworn −15% | `shipyard.js` 88–97 `rankFor` |
| Market sell goodwill | +2% per **positive** rank tier | `station.js` 2201–2203 |
| Epic prices | `epicEffects` buy/sell/repair/jobPay/restrictedSell/pirateResolve | `epics.js` 35–41; `station.js` 1745, 2180, 2239, 2491 |
| Epic stages | `rankTier` vs `rankFor(rep).tier`; loss never revokes | `epics.js` 19, 69–70 |
| Restricted locker | fear ≥ 40 **or** `reputation.freehold < −25` (**Marked**; −25 is still Suspect and does **not** open) | `station.js` 134, 1432–1435; `ECON.fear.tributeOpensAt` 40 |
| Graft desk | Gilded `standingOf < 0` refuse | `hangar.js` 738 |
| Dock | **not** gated by standing (risky run to a station still docks) | `station.js` 2923 dock set |
| Hail police leave | **absent** | `hail.js` 17–47 `INTENT_ORDER` |

`npc.standingOf` (`npc.js` 1021–1026): missing table / missing faction / non-finite → 0. Does **not** use `hasOwn` / `RESERVED_IDS` (indexes `table[fac]`).

---

## 6. HUD / comm

| Event | Toast | Cite |
|---|---|---|
| `'commLine'` | `{ text }` class `comm` | `hud.js` 400–408, `pushToast` `textContent` 924 |
| `'epicStage'` | `◆` line | `hud.js` 415–416 |
| `'creditorCall'` | `▲` Ledger | `hud.js` 427–428 |
| `'survivorRescued'` / `'survivorSold'` | not a dedicated toast; sale/rescue also emit `'commLine'` | `ctx.js` 219–220; `station.js` 1392–1393; `trafficking.js` 196–197 |
| `'reputationChanged'` | **not in frozen list** | `ctx.js` 197–225 |

No innerHTML on HUD toasts (`hud.js` 924).

---

## 7. XSS / prototype (live)

| Check | Live |
|---|---|
| Station UI | `textContent` (`station.js` 2027–2032, overlay clear 2867) |
| Rank names | from `RANK_LADDER` literals via `rankFor` |
| Rescue names | `FACTIONS[faction].name` after `hasOwn` |
| Job titles | `h(..., title)` textContent; mining regenerates from `COMMODITIES` |
| Save bag | **no** reputation allowlist; a blob can hold `__proto__` / `constructor` / NaN |
| Trafficking / graft | `RESERVED_IDS` + `hasOwn(FACTIONS)` |
| Patrol / world ledger | direct `.freehold` / `.redledger` property access |
| Mining | `hasOwn(FACTIONS)` then assign |

---

## 8. Digit layout (do not change)

| Digit | Service |
|---|---|
| 1 | Market |
| 2 | Jobs |
| 3 | Bar |
| 4 | Feed & tend |
| 5 | Repair |
| 6 | Outfitting |
| 7 | People (rescue + Gilded transfer) |
| 8 | Launch |
| 9 | Standing (`epics`) |
| 0 | Shipyard |

HUD-02 closed. No new HUD family.

---

## 9. Gaps vs wishlist REP-01…04

| ID | Live? | Gap |
|---|---|---|
| REP-01 explain | Partial | Rank line + epic panel. No ladder list, no “how it moves,” no change-reason toast |
| REP-02 consequences | Partial | Prices, yards, hunt, locker, epics, jobs exist. No allies-join, no jump lock, no extra police |
| REP-03 law / redemption | **No** | No patrol hail “stop or leave.” No restitution pay. Rescue already helps standing |
| REP-04 local attrib | Partial | Sale/rescue/mining/graft are per-faction. **Kills do not write standing.** No universal crime score today (do not add one). Espionage family not shipped |

---

## 10. Ownership (today)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.reputation` | station (patrol/mining/rescue), trafficking, hangar graft cap, origins, world originArc | rankFor/UI, epics, npc hunt, yards, graft refuse |
| `RANK_LADDER` | **nobody** (state.js data) | rankFor |
| `ctx.world.fear` | npc, hail, trafficking | locker, pirate demand — **not** standing |
| `ctx.world.jobs` | station.js | board; mining/patrol are the job-shaped writers |
| `grafted` | hangar.js | Beautiful cap |

Code wins. Re-open these lines in the implementation wave.
