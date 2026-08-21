# Current REP inventory (Wave 79, REP-04)

**Wave:** 79. Design only.  
**Rule:** Live code wins over comments, lore, Wave 73/74 inventories, and this file if they disagree. Re-open the cited files before an implementation wave. Wave 73/74 line numbers are stale.  
**Scope:** faction standing bag, Digit 9 Standing copy, live writers/readers, `npcDestroyed` / combat kill / incident / `playerKill` provenance. Kill standing writes do **not** exist today.

This file is the source of truth for “reputation and kill attribution today.” The integrator brief and `shared-contract.md` must not invent fields that are not here unless they mark them **proposed, needs owner**.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/game/state.js` | `FACTIONS`, `RANK_LADDER`, `rankFor`, `RESCUE`, `ORIGINS` deltas, `ECON.fear`, `EPICS` rankTier |
| `src/core/ctx.js` | default `world.reputation`; frozen `'npcDestroyed'` `{ship}`; `'commLine'`; **no** `'reputationChanged'` |
| `src/game/save.js` | `WORLD_FIELDS` `'reputation'`; `sanitizeReputation`; `RESERVED_IDS`; `JOB_KINDS`; `JOB_FIELD_ALLOW` has **no** `faction` |
| `src/systems/station.js` | Digit 9 Standing explain; patrol/mining/hunt/trade/passenger/explore writers; rescue; locker; `h()` `textContent` |
| `src/game/hangar.js` | `standingOf`; `applyAbominationStanding` Beautiful −10 |
| `src/systems/npc.js` | `HOSTILE_STANDING` −10; `standingOf`; `lastAttackerOf`; `mayHuntPlayer`; `handleDestroyed`; `survivorSourceOf` |
| `src/systems/combat.js` | killing blow emits `'npcDestroyed' { ship }`; mining laser same; **player** sun heat only |
| `src/game/world.js` | `addIncident`; `consumeIncidents` causer window; blockade `causer: 'world'`; origin-arc Ledger writes |
| `src/systems/hail.js` | `INTENT_ORDER` — **no** police leave |
| `src/game/origins.js` | origin pick merges authored reputation deltas |
| `src/game/epics.js` | `rankFor` gates; read-only bag |
| `src/game/shipyard.js` | `dockReputation`; hostile `rep < 0` |
| `src/systems/shipyard-desk.js` | `'No sale.'` `textContent` |
| `src/game/trafficking.js` | Gilded sale victim + gilded deltas; `playerKill` list 240 |
| `src/game/pods.js` / `src/systems/npc.js` | survivor `source` `playerKill` \| `other` |
| `src/game/data-trade.js` | shared `standingRead` |
| `src/game/contacts.js` | rumor interpolates `inc.name` / `inc.faction` (Witness; `textContent` path) |
| `src/systems/hud.js` | `'commLine'` toast `textContent` |
| `docs/RepStandingDesign.md` | parent freeze §6–§7 (read-only) |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | Initiative REP, REP-03/REP-04 (do **not** edit) |

---

## 1. Ladder and rank helper (`state.js`) — READ-ONLY

```
src/game/state.js 672–682
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

`FACTIONS` keys (`state.js` 549–564): `freehold`, `redledger`, `veridian`, `hollow`, `independent`, `ferrous`, `gilded`, `beautiful`, `congregation`, `assembly`, `lamplighter`, `unknowables`. **`independent` is a real table key.** Kill attribution still **skips** it (contract).

---

## 2. Persist and default bag (Wave 74 shipped)

| Surface | Today | Cite |
|---|---|---|
| Autosave key | `rimward-save-v1` | persist path; no sibling crime key |
| Field | `WORLD_FIELDS` includes `'reputation'` | `save.js` 75–76 |
| Restore | Wholesale `ctx.world[k] = snap.world[k]` then heal | `save.js` 916–918; `sanitizeRestored` 865 |
| Sanitize | `sanitizeReputation`: missing/array → `{}`; `Object.keys`; drop reserved / non-`FACTIONS` / non-finite; fresh bag | `save.js` 671–691 |
| Default bag | `{ freehold: 0, redledger: 0, veridian: 0, hollow: 0 }` | `ctx.js` 129 |
| Missing keys | Beautiful, gilded, ferrous, assembly, congregation, lamplighter, independent, unknowables absent until a writer creates them | default vs `FACTIONS` 549–564 |
| Read miss | `standingRead` → 0 | `data-trade.js` 62–70; station Digit 9 / rank line |
| Finite miss | hangar `standingOf` / yard `dockReputation` → 0 | `hangar.js` 119–126; `shipyard.js` 80–86 |
| Jobs cap | `4 + 2N * 5 families + 16` overlay | `save.js` 115–129 |
| `JOB_KINDS` | includes `hunt`, `passenger`, `explore`; **no** `'espionage'` / war | `save.js` 138 |
| Job `faction` field | **Forbidden** — not in `JOB_FIELD_ALLOW` | `save.js` 146–150 |
| Crime keys | **Absent.** Boot pins already assert no `crimeScore` / `wanted` | `out/w74/persist/probe.mjs`; `scripts/boot-test.mjs` ~15258–15263 |

**Fail-closed missing keys:** a missing faction key is 0 for rank (Stranger). Writers create the key when they first add a delta.

**No `crimeScore`. No `wanted`. No `world.crimes`.** Fear is a separate scalar (`ctx.world.fear`, `ECON.fear.tributeOpensAt` 40 — `state.js` 284).

Kill attribution needs **no new persist field**. Default: do not extend `sanitizeReputation`.

---

## 3. Standing dock service (Digit 9) — Wave 74 explain shipped

| Surface | Today | Cite |
|---|---|---|
| Dock keys | `['market','jobs','bar','feed','repair','outfitting','people','launch','epics','shipyard']` | `station.js` 152 |
| Digits | 1–9 map first nine keys; **0 is shipyard** | `station.js` 4305–4308 |
| Standing | service id `'epics'`, label `'Standing'` | `station.js` 4273, 4305 |
| Panel | dock faction + rank + signed int; next rung; `LADDER`; `HOW STANDING MOVES`; `LIVE CONSEQUENCES`; epic ticks | `station.js` 4196–4255 |
| Move notes | mining +2 dock flag; patrol +5 Freehold; rescue +4/+1; sale table; graft Beautiful −10 | `standingMoveNotes` 1072–1081 |
| Live notes | hunt ≤ −10; yards `rep < 0`; ace/frigate mins; yard discount; market +2%/tier; locker; graft; mining/patrol | `standingLiveNotes` 1084–1102 |
| Gap | Jobs board also names hunt/passenger/explore employer +2 (`station.js` 3638–3639). Digit 9 move notes **omit** those families and **do not** mention kill standing (none exists). |
| Rank line | dock root + next rung | `station.js` 4311–4316 |
| DOM | `h()` sets `textContent` only | `station.js` 3208–3212 |
| `innerHTML` | **none** in `station.js` | grep 0 |
| Empty epic | independents: `'No epic stages here.'` after the ladder block | `station.js` 4217–4219 |

---

## 4. Writers (deltas) — none on combat kill

### 4.1 Patrol job — hardcoded **freehold**

| | |
|---|---|
| Constant | `PATROL_REP = 5` (`station.js` 170) |
| Write | `ctx.world.reputation.freehold += PATROL_REP` (`station.js` 2777) |
| Trigger | accepted patrol; `'npcDestroyed'` / `'npcSurrendered'` / `'npcDisabled'` with `role === 'pirate'` (`station.js` 2768–2784) |
| Board copy | `+${PATROL_REP} Freehold rep` (`station.js` 3761) |

Does **not** read dock faction. Wave 79 **does not** retarget it.

### 4.2 Employer +2 families (mining / hunt / trade / passenger / explore)

| | |
|---|---|
| Constant | `MINING_REP = 2` (`station.js` 194) |
| Guard | `Object.hasOwn(FACTIONS, faction)` then `bag[faction] = (?? 0) + MINING_REP` |
| Mining | `station.js` 2893–2896 |
| Trade | `station.js` 2942–2945 |
| Passenger | `station.js` 2989–2992 |
| Explore | `station.js` 3053–3056 |
| Hunt | `huntPayComplete` `station.js` 2655–2658 (employer = `SYSTEMS[origin].faction`, **not** victim) |
| Expire | no reputation |

Legal work. **Not** victim-faction piracy. Overlay / unique ace bounty write **no** reputation (`station.js` 3077–3089). Haul / ferry / recovery write **no** reputation (`completeJob` 2746–2749).

### 4.3 Survivor rescue (Digit 7 People, matching dock)

| | |
|---|---|
| Table | `RESCUE.otherRep` **4**, `playerKillRep` **1** (`state.js` 289–294) |
| Write | `bag[faction] = (finite or 0) + nOther*4 + nKill*1` (`station.js` 1648–1666) |
| Guard | `Object.hasOwn(FACTIONS, faction)` before apply |
| Line | `commLine` `textContent` (`station.js` 1643–1673) |

`playerKill` here is **cargo source**, not a combat standing write. POD tone: do not retune.

### 4.4 Survivor sale (Gilded Digit 7)

| | |
|---|---|
| List UU | `TRAFFIC_LIST_UU` other **160**, playerKill **240** (`trafficking.js` 8) |
| Victim | other **0**, playerKill **−8** per unit (`trafficking.js` 9–13, 171–174) |
| Gilded | **+2** per unit |
| Guard | `canWriteRep`: object bag, `isFactionKey`, `Object.hasOwn(FACTIONS)` (`trafficking.js` 70–81) |
| Fear | +1 / +2 **once per lot**, clamp 0…100 — **not** a crime score |

POD owns these numbers. REP-04 must not retune 160/240 or −8/+2.

### 4.5 Graft / Abomination (BIO)

| | |
|---|---|
| Hunt floor | `HOSTILE_STANDING = -10` hangar-local (`hangar.js` 110–111) |
| Cap | while any hangar row `grafted === true`: `bag.beautiful = min(currentOr0, −10)` (`hangar.js` 138–154) |
| Create key | missing bag replaced with `{}`; writes `'beautiful'` after reserved + `hasOwn(FACTIONS)` |

BIO owns −10. Do not retune.

### 4.6 Origin pick + Ledger arc

| | |
|---|---|
| Origin merge | `Object.keys(fx.reputation)` add (`origins.js` 55–59). Authored: ledgerDebt `redledger −10, freehold +10`; marked `veridian −15, redledger +10` (`state.js` 709, 714) |
| Ledger calls | hardcoded `reputation.redledger` (`world.js` 1006, 1011, 1032, 1045) |

Not kill attribution. Do not retarget.

### 4.7 Combat kill / `npcDestroyed` — **no standing write**

Grep of `src/` writers that assign `world.reputation[...]` on `'npcDestroyed'` or in `handleDestroyed`: **none** except patrol’s pirate-progress job (employer Freehold, not victim). Fear bumps on surrendered-kill / ace (`npc.js` 2129–2131) are **fear**, not standing.

---

## 5. Readers (consequences already live)

| Player-facing | Live | Cite |
|---|---|---|
| Patrols hunt at ≤ −10 | `HOSTILE_STANDING` | `npc.js` 87, 1065–1072 |
| NPC standing lookup | `live.record?.faction ?? live.state?.faction`; missing/non-finite → 0; **no** `hasOwn(FACTIONS)` | `npc.js` 1021–1026 |
| Yards refuse `rep < 0` | `dockReputation` | `shipyard.js` 80–86, 190–191 |
| Ace / frigate min rank | Known 10 / Trusted 25 | Digit 9 notes; yard `minRepFor` |
| Yard discount Known+ | 5/10/15% | `shipyard.js` 88–97 |
| Market sell +2%/positive tier | | `station.js` 3386–3388 |
| Epic buy/sell/repair/jobs | `epicEffects` | `station.js` 2696–2697, 3365 |
| Restricted locker | fear ≥ 40 **or** Freehold **< −25** | `RESTRICTED_REP_GATE` `station.js` 154, 1716 |
| Graft hostility | Beautiful cap −10 | `hangar.js` 138–154 |
| Greenhand origin beats | `for…in` over reputation bag | `world.js` 1093–1104 |

**Not live:** police order-to-leave; restitution desk; kill standing; allies in space; jump lock; `kind: 'espionage'`.

---

## 6. Kill / destruction provenance (code wins)

### 6.1 Frozen event

`ctx.js` 200: `'npcDestroyed' {ship}`. Payload is the live ship object. **No** dedicated faction field on the event. Faction lives on `ship.record.faction` and/or `ship.state.faction`.

Combat killing blow (`combat.js` 1541–1547 projectile; 1367–1373 mining laser):

- sets `ai.lastAttacker = p.fromPlayer ? 'player' : (p.shooter \|\| 'npc')` (laser always `'player'`)
- emits `'npcHit'` then `'npcDestroyed' { ship }` when `applyHit` returns `destroyed`

`npc.js` `handleDestroyed` (2109–2144): emits `'npcDestroyed'` **only if** the event is not already on `ctx.events` / `ctx.lastEvents`. Fear, cargo spill, survivor pod, death burst. **No reputation.**

Backstop (`npc.js` 2235–2242): if traffic spliced the wreck before the npc loop, consume last-frame `'npcDestroyed'` and run `handleDestroyed` once (`deathHandled`).

### 6.2 `lastAttackerOf` (safe player-gun witness)

`npc.js` 1028–1036: `'player'` \| `'npc'` \| live ship ref \| `null`. Combat sets this from `fromPlayer`. **This is the kill-write witness.** NPC-vs-NPC leaves `'npc'` or a ship ref. No attacker → `null`.

Survivor cargo source (`npc.js` 1308–1309): `lastAttackerOf(live) === 'player' ? 'playerKill' : 'other'`. That flag is **hold provenance**, not standing.

### 6.3 Incidents (Witness Rule — leaky for standing)

`addIncident` (`world.js` 1332–1346): `{ kind, name, faction, role, position, causer }` with `causer` `'player' \| 'world'`. Persisted on `WORLD_FIELDS` `'incidents'` (`save.js` 77). **No incident sanitize.**

`consumeIncidents` on `'npcDestroyed'` (`world.js` 1599–1612):

- `causer = lastHit !== undefined && ctx.world.time - lastHit < 8 ? 'player' : 'world'`
- `lastHit` comes from **any** `'npcHit'` on that `ship.id` (`world.js` 1597–1598, 1406–1407)
- Combat emits `'npcHit'` for **NPC-on-NPC** hits too (`combat.js` 1542)
- fallback faction `'independent'` if record/state missing (`world.js` 1609)

Hunt / overlay / ace **jobs** still match `inc.causer === 'player'` (`station.js` 2642–2647, 3073–3084). That is Jobs law. **Kill standing must not copy this window** — it would punish NPC-vs-NPC as player piracy.

Blockade abstract kill (`world.js` 1571–1592): `causer: 'world'`. Not player.

Surrender incidents (`world.js` 1664–1677): `causer: 'player'` always on `'npcSurrendered'`. Destruction-only for REP-04. Do not write on surrender.

Rumors (`contacts.js` 205–207) interpolate `inc.faction` into spoken text. Not a standing write.

### 6.4 Sun deaths

Player sun: `combat.js` 1644–1659 `sunZone` + `applyHit` on **player** only; `'sunKill' { reason: 'sun' }`.

NPC sun: collision avoid body only (`npc.js` 637–657, `bounceLive` 661–706). **No** NPC `applyHit` from heat. If an NPC hull later dies without `lastAttacker === 'player'`, kill standing **skips**.

### 6.5 `playerKill` string (not a standing writer)

Used as survivor `source` (`pods.js` 47; `save.js` 655; rescue/sale tables). Combat does **not** emit a `'playerKill'` event.

---

## 7. Hail / police (REP-03 still deferred)

`hail.js` 48 `INTENT_ORDER`: demand/ransom/tribute/letGo/vouch/keepFiring/respect/payTribute/showTeeth/refuseFight. **No** `orderLeave` / patrol peace.

Law zone 300 u (`npc.js` 86) suppresses hostile intent near the station. That is not an order-to-leave beat.

---

## 8. XSS / proto / events

| Surface | Today |
|---|---|
| Station DOM | `textContent` (`station.js` 3208–3212) |
| HUD toasts | `slot.el.textContent` (`hud.js` 924); `'commLine'` `hud.js` 400–408 |
| `innerHTML` in game UI | none in `station.js` / `hud.js`. `modelsbrowser.js` is a dev overlay, out of scope |
| Frozen events | no `'reputationChanged'` (grep 0 in `src/`) |
| Proto bag | `sanitizeReputation` drops `RESERVED_IDS` + `__proto__` (`save.js` 106–110, 682–689) |
| `npc.standingOf` | indexes `table[fac]` without reserved/`hasOwn` — live reader; kill **writer** must not copy |

---

## 9. What Wave 73/74 already froze vs what is still open

| Item | Status |
|---|---|
| Sanitize `'reputation'` | **Shipped** Wave 74 |
| Digit 9 explain | **Shipped** Wave 74 |
| Writer `commLine` reason lines | **Shipped** on mining/hunt/rescue/sale/patrol |
| Kill standing write | **Not shipped** |
| Kill delta number | **proposed, needs owner** |
| Police leave | **Deferred** (REP-03) |
| Restitution UU | **proposed, needs owner** (REP-03) |
| Espionage / faction-war job kinds | **Not shipped** (sibling Wave 79 workers) |
| Patrol `freehold` retarget | **Not this serial** |

---

## 10. Verifier grep pins (this inventory)

Later impl / Wave 79 markdown verifier:

- `src/` has no `crimeScore` / `world.wanted` / `world.crimes` persist field
- `WORLD_FIELDS` includes `'reputation'` once
- `sanitizeReputation` exists and is called from `sanitizeRestored`
- `handleDestroyed` / combat `'npcDestroyed'` do **not** assign `world.reputation`
- `INTENT_ORDER` has no leave intent
- `JOB_KINDS` has no `'espionage'`
- `station.js` `innerHTML` count 0
- `RANK_LADDER` still six rungs at `state.js` 672–678
