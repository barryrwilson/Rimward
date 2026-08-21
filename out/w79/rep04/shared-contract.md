# REP-04 kill-attribution shared contract

**Wave:** 79. Design only. No kill-standing feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Rep04AttributionDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/RepStandingDesign.md`, `docs/MsnMissionsDesign.md`, `docs/Msn02HuntDesign.md`, or sibling `out/w79/{espionage,faction-war}` (those are other workers).  
**Locked sources:** wishlist Initiative REP, especially REP-04 and REP-03 deferred items (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 516–533); parent freeze `docs/RepStandingDesign.md` §6–§7 (Wave 73; Wave 74 shipped explain + sanitize only); live inventory `out/w79/rep04/current-rep-inventory.md` (code wins); `src/game/save.js`; `src/systems/station.js`; `src/systems/npc.js`; `src/systems/combat.js`; `src/game/world.js`; `src/core/ctx.js`; `src/game/state.js` (READ-ONLY).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments. Wave 73/74 line numbers are stale.

---

## 0. Law in one page

1. Wave 79 is markdown only for this family. Implementation is a later **serial** wave. Do not schedule or land kill-attribution PRs in `src/` in this wave.
2. **No new persist key.** Reputation stays on `WORLD_FIELDS` `'reputation'` (`save.js` 75–76). Autosave stays `rimward-save-v1`. **Forbidden:** `crimeScore`, `wanted`, `world.crimes`, `world.heat`, `world.police`, `world.kills`, extra `WORLD_FIELDS` law names. Fear stays `world.fear`.
3. Attribution is the **victim NPC’s faction only**. Never stamp every `FACTIONS` key from one kill. “In faction space” does **not** add a second write to the system owner.
4. Skip **independent**, missing, reserved (`RESERVED_IDS` / `__proto__`), and any key that fails `Object.hasOwn(FACTIONS, key)`. No extra system-owner stamp. Do not invent a second banner for independents.
5. Kill delta is **proposed, needs owner**. Until an owner authors a finite non-zero constant, **fail closed: no standing write**. Do **not** invent a UU table. Do **not** invent a % of hull. Do **not** copy POD −8 or BIO −10 or `MINING_REP`.
6. Player-caused **destruction** only. Witness = live `lastAttackerOf(ship) === 'player'` (`npc.js` 1028–1036), set from combat `fromPlayer` (`combat.js` 1541). Do **not** punish NPC-vs-NPC. Do **not** punish sun / world / blockade deaths. Do **not** treat leaky incident `causer` as sufficient (`world.js` 1597–1604 stamps `playerHitAt` on **any** `'npcHit'`).
7. Piracy, not legal hunt. Skip victim `role === 'pirate'` and `role === 'ace'` (and `classKey === 'ace'`). Overlay/hunt/patrol already pay or credit **employer** paths. Destroying a trader, miner, or patrol hull is the piracy case.
8. Police leave **stays deferred**. Restitution UU **stays proposed, needs owner**. Do not design a restitution desk or patrol leave hail here.
9. Do **not** retarget patrol `freehold` (`station.js` 2777). Named later serial `patrol-employer-faction` only.
10. Do **not** ship `kind: 'espionage'` or faction-war jobs (sibling Wave 79 workers). Cite already-frozen secret-success / employer-up-target-down **rules** from `docs/RepStandingDesign.md` §7 without inventing job numbers.
11. Sanitize already exists (`save.js` 671–691, called 865). **Default: no new field.** Extend `sanitizeReputation` only if a kill path adds a persist field — it must not.
12. `state.js` is READ-ONLY. `RANK_LADDER` unchanged. BIO −10 and POD 160/240 and rescue +4/+1 unchanged.
13. `textContent` / existing `h()` / `'commLine'` only. **No `innerHTML`.** No new frozen event unless `'commLine'` cannot carry the line (default: **no new event**. Do not add `'reputationChanged'`).
14. Prototype keys fail closed. Walk `Object.keys`. Fresh `{}` only. Never `for…in` blob merge. Never `reputation[userString]`.
15. Digit 9 already explains live writers. Do not claim “kills move standing” in copy until a write actually fires (owner delta present **and** helper applied a finite delta).

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'reputation'` (`save.js` 75–76). Keep it.

Call site today: `sanitizeReputation(ctx)` from `sanitizeRestored` (`save.js` 865). Kill serial **reuses** that healer. Do not add a second walk. Do not persist a parallel `world.kills` / `world.crimes` array.

### 1.2 Bag heal (already shipped — do not regress)

Live (`save.js` 671–691):

```
if world.reputation is missing, not a plain object, or is an array
  → replace with {}
else
  walk Object.keys (never for…in)
  build a fresh {}
  for each key:
    drop if RESERVED_IDS.has(key) or key === '__proto__'
    drop if !Object.hasOwn(FACTIONS, key)
    drop if typeof value !== 'number' || !Number.isFinite(value)
    else out[key] = value
  world.reputation = out
```

Missing stays missing (read 0). Do **not** fill every `FACTIONS` key. Do **not** clamp Marked honesty.

### 1.3 No sibling keys

Forbidden on snapshot and on live `ctx.world`: `crimeScore`, `wanted`, `heat` (as law), `police`, `crimes`, `kills` as persist maps.

Incidents already persist (`WORLD_FIELDS` `'incidents'`). Kill standing **reads live ship**, not stuffed `incident.faction`. Do not add incident sanitize in this serial unless a named owner takes persist-heal (out of scope).

### 1.4 Numeric law for a later write

- Callers pass a **finite** number into `rankFor` via `standingRead` (`data-trade.js` 62–70).
- Writer creates the victim key on first honest delta (`?? 0` then add), after `Object.hasOwn(FACTIONS, key)` and reserved drop.
- Non-finite delta → no write.
- Until owner constant exists, the helper returns before any bag mutation.

---

## 2. Kill-write helper (persist-safe path)

Name at impl (suggested, not a persist key): `applyPlayerKillStanding(ctx, ship)` in a station/npc-owned module. Prefer **one** function. Do not scatter `reputation[k] +=` in combat.js.

### 2.1 Owner constant

```
KILL_STANDING_DELTA = null   // proposed, needs owner
```

Place next to other station-local tables **or** a tiny npc-local const. **Not** `state.js`.

Gate:

```
if (typeof KILL_STANDING_DELTA !== 'number' || !Number.isFinite(KILL_STANDING_DELTA) || KILL_STANDING_DELTA === 0)
  return { ok: false, reason: 'no-delta' }
```

A later owner may set a negative integer (standing **loss**). Until then, **no write**. Do not derive from hull max, credits, bounty, or fear.

### 2.2 Faction resolve (allowlist)

```
raw = ship.record?.faction ?? ship.state?.faction
if (typeof raw !== 'string' || !raw) return skip
if (RESERVED_IDS.has(raw) || raw === '__proto__') return skip
if (raw === 'independent') return skip
if (!Object.hasOwn(FACTIONS, raw)) return skip
faction = raw
```

Never `reputation[userString]`. Never `incident.faction`. Never `SYSTEMS[currentSystem].faction` as a second stamp. Never `job.faction` (jobs do not persist `faction` — `JOB_FIELD_ALLOW` `save.js` 146–150). Never use `npc.standingOf` (`npc.js` 1021–1026) as a write helper: it indexes `table[fac]` without reserved / `hasOwn(FACTIONS)` / own-key checks. Use `standingRead` (`data-trade.js` 62–70) or the trafficking `canWriteRep` shape (`trafficking.js` 70–81).

### 2.3 Role gate (piracy, not bounty)

Victim role = `ship.record?.role ?? ship.role ?? ship.ai?.role`.

| Role | Kill standing |
|---|---|
| `trader`, `miner`, `patrol` | eligible **after** owner delta |
| `pirate`, `ace` | **skip** (legal hunt / overlay / patrol job) |
| `classKey === 'ace'` or `role === 'ace'` | **skip** |
| missing / other | **fail closed (skip)** |

Do not write on `'npcSurrendered'`, `'npcDisabled'`, salvage hail, or blockade abstract kills.

### 2.4 Bag mutate (only when 2.1–2.3 and §3 pass)

```
bag = world.reputation
if bag missing / not object / array → bag = {}; world.reputation = bag
walk is not required here; assign one allowlisted key
cur = standingRead(bag, faction)   // or finite-or-0 own key
bag[faction] = cur + KILL_STANDING_DELTA
```

Fresh `{}` if replacing a broken bag. Do not `Object.assign` a save blob. Do not `for…in`.

BIO graft cap is **not** re-applied here (Beautiful victim kill is independent of graft). Graft still runs on hangar paths.

---

## 3. Witness bind (combat / incident)

### 3.1 Single call site

Bind **once** per destroyed live ship, in `handleDestroyed` (`npc.js` 2109–2144) **after** `deathHandled` is set and the ship payload exists. That function already de-dupes combat’s `'npcDestroyed'` emit.

Do **not** also write from `world.js` `consumeIncidents`. Do **not** also write from `combat.js` emit sites (double fire with the npc backstop).

Combat remains the system that sets `lastAttacker` and emits the frozen event. Kill standing **reads** that. It does not add `'npcDestroyed'` fields.

### 3.2 Player-caused destruction

All must hold:

1. `ship` is a live object with `state.destroyed === true` (or being handled as destroyed).
2. `lastAttackerOf(ship) === 'player'`.
3. Role gate §2.3.
4. Faction gate §2.2.
5. Owner delta §2.1.

Fail closed (no write) when:

- `lastAttackerOf` is `'npc'`, a ship ref, or `null` (NPC-vs-NPC, world, unknown).
- Sun / collision / blockade with no player last attacker.
- Incident `causer === 'player'` **alone** (leaky `npcHit` window, `world.js` 1597–1604).
- Player damaged a hull and an NPC scored the last attacker.
- `'npcSurrendered'` / disable without destroy.

Hunt/overlay Jobs may still pay on incident `causer`. That is **not** this helper.

### 3.3 No system-owner stamp

A Freehold trader killed in Veridian space writes **Freehold only** (when eligible). Veridian as sky owner is **not** stamped. That is the anti-`crimeScore` rule.

### 3.4 Legal-work adjacency

| Live path | This serial |
|---|---|
| Patrol job `freehold += 5` on pirate disable/surrender/destroy | **Unchanged**. Skip pirate victims here so we do not double-punish pirate kills as piracy |
| Hunt employer `MINING_REP +2` | **Unchanged**. Skip pirate victims |
| Overlay / ace bounty | **Unchanged** (no rep today) |
| Mining/trade/passenger/explore employer +2 | **Unchanged** |

---

## 4. Copy, XSS, events

### 4.1 `commLine`

Only if §2 actually mutated the bag:

- `ctx.emit('commLine', { text })` with authored template + `FACTIONS[faction].name` after `Object.hasOwn(FACTIONS, faction)`.
- HUD already toasts `'commLine'` via `textContent` (`hud.js` 400–408, 924).
- `stripControlChars` / do not interpolate `ship.record.name` into HTML. Station `h()` is `textContent` (`station.js` 3208–3212).
- **No `innerHTML`.**
- Default: **no** new frozen event. Do not add `'reputationChanged'`.

If the helper skipped (`no-delta` / skip role / skip faction / not player), emit **nothing**. Silent skip is correct while the owner constant is unset.

### 4.2 Digit 9

`standingMoveNotes` / `standingLiveNotes` (`station.js` 1072–1102) may add **one** authored kill line **only in the impl PR that first applies a finite owner delta**. Until then, do **not** tell the player that kills move standing.

Do not add a dock Digit. Digit 0 stays shipyard. Digit 9 stays Standing.

Do not print `rec-<n>`, stuffed incident faction keys, or proto names.

### 4.3 Rumors

`contacts.js` 205–207 already voices player-caused destruction. Do not change rumor grammar in this serial.

---

## 5. Faction-war / espionage rules (cite only)

Already frozen in `docs/RepStandingDesign.md` §7. Repeat here so MSN siblings can depend without this serial shipping jobs:

| Outcome | Target faction | Employer |
|---|---|---|
| Overt faction-vs-faction **success** | down (victim/target) | up (live `SYSTEMS` / authored employer, **never** `job.faction`) |
| Espionage **secret success** | **no** loss | later MSN may credit employer (**proposed**) |
| Espionage **failure** / exposed | normal target loss as overt (**proposed**) | no extra universal stamp |

**No numbers. No `kind: 'espionage'`. No war family.** Sibling Wave 79 workers own those briefs. This file does not invent job ids, pay, or slots.

Police restitution (REP-03): **out**. No desk. No UU. No hail leave.

---

## 6. Events and milestones

- Prefer `'commLine'`.
- Ride existing `'npcDestroyed' { ship }`. Do not add payload keys that persist.
- Optional first-kill milestone: **omit** in first impl (less persist surface).
- Witness Rule: do not fabricate incidents to justify a standing write.

---

## 7. Closed neighbours

| Topic | Law |
|---|---|
| Wave 74 sanitize / Digit 9 | Keep. Do not regress `sanitizeReputation`. Do not remap digits |
| Patrol `freehold` | Freeze live. Do not retarget |
| Hunt / overlay / ace | Employer or none. Skip pirate/ace victims here |
| Mining/trade/passenger/explore | Employer +2 unchanged |
| BIO | Graft −10 ownership. Do not retune |
| POD | Rescue +4/+1; sale 160/240; victim −8 / 0; gilded +2. Do not retune |
| SHP | Digit 0 untouched. Hostile yard `rep < 0` stays |
| HUD-02 | No new family. Toasts `textContent` |
| Fear | Not a crime score. Ace/surrender fear bumps stay |
| MSN espionage / faction-war | Sibling workers. **No job kinds** here |
| TGT-05 / EXP / AST / POD desk | No coupling |
| Unique haul/ferry | Untouched |

---

## 8. Serial PR plan (implementation wave, **not** Wave 79)

Named only. Do **not** implement in this wave.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 persist-safe write path** | `applyPlayerKillStanding` helper; allowlisted faction; reserved drop; fresh bag; `KILL_STANDING_DELTA = null` → **no write**; no new `WORLD_FIELDS` | Combat bind; Digit 9 new claim; police; restitution; invented number |
| **PR2 combat / incident bind** | Single call from `handleDestroyed`; `lastAttackerOf === 'player'`; skip pirate/ace; skip independent/missing/reserved; skip surrender | `world.js` causer write; system-owner stamp; `crimeScore`; double emit |
| **PR3 commLine / Standing copy** | `commLine` **iff** a finite owner delta actually wrote; Digit 9 one line **iff** that write exists | `innerHTML`; `'reputationChanged'`; copy that claims kills move standing while delta is null |
| **PR4 boot pins** | proto key dropped; no `crimeScore`/`wanted`; pirate kill does not write victim; NPC-vs-NPC does not write; sun/world does not write; trader player-kill writes **only after** owner delta (until then: bag unchanged); Digit 0 still yard; `RANK_LADDER` six rungs | wishlist / PROGRESS; patrol retarget; espionage kind |

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave. Do not treat WAVE4 / WAVE26 / WAVE35 known FAILs as REP-04 bugs.

If the owner authors `KILL_STANDING_DELTA` before PR1, PR1 still ships the helper; PR2–PR3 then apply that constant. If the owner does **not**, PR1–PR4 still ship a fail-closed path and pins that prove **no write**.

---

## 9. Later (named, not specified)

Do **not** fill numbers.

1. Owner kill delta constant.
2. REP-03 police leave hail — **needs owner**; not this contract’s desk.
3. REP-03 restitution UU — **needs owner**; Beautiful graft cap still wins after a 0-set.
4. `patrol-employer-faction`.
5. Espionage / faction-war **jobs** — sibling briefs; rules already in §5.
6. Optional incident sanitize (stuffed `incident.faction`) — not required to fail-closed kill writes.

---

## 10. Non-goals (locked)

- No `src/` in Wave 79 for this family.
- No HUD-02. No AST rock UUIDs. No POD reopen. No SHP grants. No BIO graft retune. No EXP SKU. No TGT.
- No new `localStorage` key. No `world.crimes`.
- No new frozen event (default).
- No `state.js` feature rewrite. No `RANK_LADDER` rungs.
- No MSN-03. No `kind: 'espionage'`. No faction-war job numbers.
- Do not edit the wishlist or `PROGRESS.md` in this wave.
- Do not schedule or land implementation PRs in Wave 79.
- Do not edit `docs/RepStandingDesign.md` from this worker.
- Do not invent police restitution or a leave hail.
- Do not retarget patrol `freehold`.
- Do not invent kill UU or % of hull.

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.reputation` | existing job/rescue/sale/graft/origin writers; **this serial:** `applyPlayerKillStanding` only when owner delta + witness | epics, Digit 9, npc hunt, yards |
| `'reputation'` persist | `save.js` `sanitizeReputation` | restore |
| `'npcDestroyed'` | combat.js emit; npc.js de-dupe | world incidents, patrol job, song/hud |
| `lastAttacker` | combat.js | npc `lastAttackerOf`; kill helper |
| `ctx.world.incidents` | world.js | hunt/overlay/ace jobs; rumors. **Not** kill standing key |
| `state.js` | serial data owner only | **feature PRs read-only** |
| Digit 9 copy | station.js | player |
| Police / restitution | **nobody in this serial** | — |

`combat.js` must not grow a reputation table. `state.js` must not grow `RANK_LADDER`.

---

## 12. Owner defaults (stand unless overridden)

These defaults **stand**. They do not invent a delta. The **blocking** owner question is the kill number (fail closed until set).

1. No universal crime score. Victim faction only.
2. Skip independent / missing / reserved. No system-owner stamp.
3. Witness = `lastAttackerOf === 'player'`. Not incident `causer` alone.
4. Skip pirate and ace victims (not piracy).
5. `KILL_STANDING_DELTA = null` until owner. No write.
6. Single bind in `handleDestroyed`.
7. `'commLine'` only; no `'reputationChanged'`.
8. No new persist field. Reuse `sanitizeReputation`.
9. Patrol `freehold` stays. Police leave deferred. Restitution UU unset.
10. No espionage / war job kinds in this serial.
11. Digit 9 kill line only after a real write exists.
12. Prototype keys fail closed. `Object.keys`. Fresh `{}`.

---

## 13. Verification pins (for a later read-only verifier)

Exact files:

- `docs/Rep04AttributionDesign.md` vs this file vs `out/w79/rep04/current-rep-inventory.md`
- Live: `src/game/save.js` `WORLD_FIELDS` `'reputation'`, `sanitizeReputation`, no `crimeScore`
- `src/systems/station.js` Digit 9 notes, patrol `freehold`, employer +2 families, `h()` `textContent`, no `innerHTML`
- `src/systems/npc.js` `handleDestroyed`, `lastAttackerOf`, `HOSTILE_STANDING`
- `src/systems/combat.js` `'npcDestroyed' { ship }`, `fromPlayer` lastAttacker, player-only sun
- `src/game/world.js` incident causer window (leaky npcHit); blockade `causer: 'world'`
- `src/core/ctx.js` no `'reputationChanged'`
- `src/game/state.js` `RANK_LADDER` / `RESCUE` / `FACTIONS` (READ-ONLY)
- `src/systems/hail.js` `INTENT_ORDER` no leave
- Sibling `out/w79/espionage` and `out/w79/faction-war` **not** merged into this serial’s job kinds
- Wave 79 worker: markdown only; no `src/` edits
