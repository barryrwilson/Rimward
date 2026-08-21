# REP faction-standing shared contract

**Wave:** 73. Design only. No REP feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/RepStandingDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/MsnMissionsDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/Pod02TraffickingDesign.md`, `docs/Hud02IdentitiesDesign.md`, or sibling `out/w73/{tgt05,exp}/**`.  
**Locked sources:** wishlist Initiative REP (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~450–495); live inventory `out/w73/rep/current-rep-inventory.md`; `src/game/state.js` `RANK_LADDER` (READ-ONLY); `src/systems/station.js` Standing; `src/game/save.js`; `src/systems/npc.js`; `src/game/hangar.js`; `src/game/trafficking.js`; MSN / BIO / POD contracts.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 73 is markdown only. Implementation is a later **serial** wave. Do not schedule or land REP PRs here.
2. No new `localStorage` key. Reputation stays on `WORLD_FIELDS` `'reputation'`. Autosave stays `rimward-save-v1`. **No** parallel `crimeScore`, `wanted`, or universal crime flag.
3. Attribution is **per victim / employer / dock faction** (REP-04). Never stamp every faction from one crime.
4. First impl slice: **REP-01 explain only.** Reuse Standing service (Digit 9 / `'epics'`). Reuse `commLine` / toast / dock rank line. **Do not add a second dock digit.** Digit 0 is shipyard. Digits 1–9 stay.
5. REP-02: document **live** consequences (inventory §5). New consequences are later serials unless they already exist. Do not invent jump bans, ally wings, or police AI in first impl.
6. REP-03 police “stop or leave” and restitution UU: **defer**. Live hail has no patrol leave intent (`hail.js` `INTENT_ORDER`). Do not invent police AI this first impl. Restitution UU is **proposed, needs owner**.
7. Redemption path (design freeze, not first impl code): paying restitution (when an owner sets UU) writes **that faction** to **0** (Stranger / numeric neutral). Then remedial **existing** jobs: MSN mining already writes employer faction (`MINING_REP` +2). Do **not** design a new mission family here. Name MSN serial dependency only.
8. REP-04: piracy in faction space attributes to the **victim NPC’s faction only**. Espionage: secret **success** → no target-faction loss; **failure** exposes and may apply the normal loss. Freeze the rule. Do **not** invent drop %, recon numbers, or kill deltas. MSN-02 espionage **depends on this freeze** and is **not** implemented here (not a shipped family).
9. Graft / trafficking / rescue deltas stay owned by BIO / POD / station rescue. Do **not** retune BIO −10 or POD 160/240 or `RESCUE` 4/1.
10. XSS: `textContent` only. Rank names and NPC lines never `innerHTML`.
11. Prototype pollution: `RESERVED_IDS` / `hasOwn` on faction keys. Never `for…in` assign from a save blob onto `reputation`.
12. `state.js` is READ-ONLY. `RANK_LADDER` stays. Do not add rungs.
13. HUD-02 closed. No new HUD family. No new frozen `ctx.js` event unless existing `'commLine'` / `'epicStage'` cannot carry the line.
14. Missing `reputation[faction]` **reads as 0** for `rankFor`. Writers **create** the key when they first add a finite delta. Default bag may omit Beautiful (graft creates it).
15. Unique patrol job writes **`freehold` today**. Do **not** silently retarget. Later serial `patrol-employer-faction` may retarget to dock/`SYSTEMS` faction. First impl **freezes** the live write.

---

## 1. Persist and sanitize

### 1.1 Key

`WORLD_FIELDS` already lists `'reputation'` (`save.js` 75). Keep it.

Restore today assigns the object wholesale (`save.js` 698–700) with **no heal**. First impl **PR1 must** add `sanitizeReputation(ctx)` from `sanitizeRestored` (same call site as `sanitizeJobs`).

### 1.2 Bag heal (implementable)

```
if world.reputation is missing, not a plain object, or is an array
  → replace with {}  (writers create keys; reads miss as 0)
else
  walk Object.keys (never for…in)
  build a fresh {}
  for each key:
    drop if RESERVED_IDS.has(key)   // include __proto__, constructor, prototype, …
    drop if !Object.hasOwn(FACTIONS, key)
    drop if typeof value !== 'number' || !Number.isFinite(value)
    else out[key] = value
  world.reputation = out
```

Never `Object.assign(liveBag, snap.reputation)`. Never `for…in` from the blob.

Do **not** invent a fill of every `FACTIONS` key. Missing stays missing (read 0).

### 1.3 Numeric law

- Non-finite (NaN, ±Infinity) **drops** (read 0). Do not leave NaN for `rankFor` (NaN falls through to **Marked** — `state.js` 680–682).
- Do not clamp to −1000…∞ unless a later owner asks. Honest Marked (−25 to −1000) must survive.
- `rankFor` stays in `state.js`. Callers pass a finite number: `rankFor(standingRead(bag, faction))`.
- `standingRead` helper (prefer one shared, or copy the hangar/yard shape): missing own key / reserved / non-finite → **0**.

### 1.4 No sibling keys

Forbidden: `world.crimeScore`, `world.wanted`, `world.heat`, `world.police`, new `localStorage` keys, `WORLD_FIELDS` additions for law.

Fear stays `world.fear`. Restricted locker may keep using fear **or** Freehold standing as today (`station.js` 1435). Do not fold fear into reputation.

---

## 2. First impl slice — REP-01 explain

Playable **without new economy numbers**.

### 2.1 Surfaces (in)

| Surface | Work |
|---|---|
| Digit 9 Standing | Add ladder + current rank + numeric + **how it moves** (authored `textContent` notes). Keep epic stages. |
| Dock root rank line | Keep `Faction: Rank (±N rep)` (`station.js` 2887–2890). Optional one-line “next rung” if it fits without a new digit. |
| Jobs board | Keep live patrol `+5 Freehold rep` and mining employer (no new pay). Optional one static note: mining credits the **dock flag**. |
| `commLine` | Later PR3: reason line when a **REP-owned** writer fires. First explain PR may skip live deltas. |

### 2.2 Surfaces (out)

- New dock Digit / service key.
- HUD glance row / new HUD family.
- New frozen event.
- Police hail, restitution desk, kill attribution (those are later PRs).
- Second “Contacts” reputation screen. Digit 9 **is** the dedicated screen.

### 2.3 Copy rules

- `h(..., text)` / `textContent` / `emit('commLine', { text })`.
- Rank names from `RANK_LADDER` literals only.
- Faction display names from `FACTIONS[key].name` after `Object.hasOwn(FACTIONS, key)`.
- `reducedMotion`: no extra animation; copy stays.

### 2.4 Default: first impl is explain-only

Owner default unless overridden: **PR2 is Standing/UI explain**. No new deltas in that PR.

---

## 3. REP-02 — live consequences (inventory, not new sim)

Document in the Standing panel as **facts that already fire**:

| Player-facing | Live |
|---|---|
| Patrols hunt at ≤ −10 | `HOSTILE_STANDING` `npc.js` 87 |
| Yards refuse `rep < 0` | `shipyard.js` 191 |
| Ace / frigate min rank | Known 10 / Trusted 25 |
| Yard discount Known+ | 5/10/15% |
| Market sell +2%/positive tier | `station.js` 2201–2203 |
| Epic buy/sell/repair/jobs | `epicEffects` |
| Restricted locker | fear ≥ 40 or Freehold **< −25** (Marked; −25 Suspect does not open) |
| Graft hostility | Beautiful `min(current, −10)` while any grafted row |
| Mining +2 employer | `MINING_REP` |
| Patrol +5 Freehold | hardcoded |
| Rescue +4 / +1 | `RESCUE` |
| Sale victim / Gilded | POD tables |

**Not live — later serials, no numbers here:** allies joining fights; system jump lock; police order-to-leave; kill standing; restitution desk.

Standing panel may **list** live items. It must not claim unshipped ones.

---

## 4. REP-03 — law and redemption

### 4.1 Police “stop or leave”

**Defer.** Cite: `hail.js` 47 `INTENT_ORDER` has demand/salvage/vouch/tribute/respect — no `orderLeave` / patrol peace. `npc.js` law zone already **suppresses intent** inside 300 u (`LAW_ZONE_RADIUS`). That is not an order-to-leave beat.

Do not add hail intents in the first impl. Optional later PR: patrol hail when standing ≤ −10 **outside** the law zone, intents `{ leave, keepFiring }` with **no new economy**. Mark **needs owner** before AI work.

### 4.2 Restitution

**Proposed, needs owner.** Do not invent UU.

When an owner sets a number, freeze this shape (not shipped in explain PRs):

- Desk or People confirm at **that faction’s** dock only.
- Debit authored UU (constant next to station/trafficking tables — **not** `state.js` unless a named data owner).
- Write **only** `reputation[thatFaction] = 0` if current is `< 0` (do not raise a friend; do not touch other keys).
- If Beautiful graft cap still applies (`anyGrafted`), re-apply `min(0, −10)` → stays −10 until grafts are gone (BIO invariant wins).
- `textContent` confirm. Esc cancels. No debit on cancel.

Until UU exists, **do not** ship a restitution button that charges a guessed price.

### 4.3 Remedial jobs

After numeric 0 (Stranger), the player grinds **existing** legal work:

- MSN mining: employer `SYSTEMS[origin].faction`, +2 (`station.js` 1879–1881). **REP rides it.** No new mining numbers.
- Rescue matching-faction: +4 / +1 (POD/station owned).
- Patrol: still Freehold-only until `patrol-employer-faction` serial.

Do **not** author a “penance” mission family in this brief.

### 4.4 Risky run

Dock remains ungated by standing (inventory §5). First impl must **not** add a dock refuse for Marked/Suspect.

---

## 5. REP-04 — faction-local attribution

### 5.1 Universal crime score

**Forbidden.** One pirate act must not decrement every `FACTIONS` key. Fear may still bump on hail/sale as today (intimidation, not crime).

### 5.2 Piracy / player kill (later PR4)

**Rule freeze:**

- Attribute standing loss to the **victim hull’s faction** (`live.record.faction` or `live.state.faction`) only.
- Apply only if that value is a real `FACTIONS` key, not reserved, and not `independent` unless an owner later says independent is a banner (default: **skip independent / missing**).
- “In faction space” does **not** add a second write to the system owner. System owner is **not** the crime score.
- Do **not** invent the delta in this wave (**proposed, needs owner**). PR4 lands **only** if the live `npcDestroyed` path can carry faction without new events; prefer payload already on `{ ship }`.
- Secret-space / other-faction victims in foreign space still attribute to **victim faction**, not the sky.

If PR4 cannot cite a safe path, **defer** rather than invent `world.kills`.

### 5.3 Overt faction-vs-faction (MSN later)

Employer **up**, target **down**. Employer from live `SYSTEMS` / authored employer, **never** a save-authored `job.faction`. Depends on MSN family serial **after** this freeze. No numbers here.

### 5.4 Espionage (MSN-02 later, not shipped)

Freeze:

| Outcome | Target faction | Employer |
|---|---|---|
| Secret **success** | **no** loss | later MSN may credit employer (**proposed**) |
| **Failure** / exposed | normal loss as overt (same as §5.3 target down, **proposed**) | no extra universal stamp |

Do not invent recon %, intel commodities, or board `kind: 'espionage'` in Wave 73. MSN-02 **waits** on this rule and remains unnamed as a shipped family.

### 5.5 Unique patrol `freehold`

**Freeze live behavior** in first impl. Named later serial: `patrol-employer-faction` — retarget `+= PATROL_REP` to `SYSTEMS[current].faction` with `hasOwn(FACTIONS)`, `?? 0`, finite. Boot tests that read Freehold must update in **that** serial, not in explain PRs.

---

## 6. Closed neighbours

| Topic | Law |
|---|---|
| BIO | Graft cap −10 ownership invariant. Do not retune. Do not auto-heal Beautiful on restitution while grafted. |
| POD | Digit 7 sale 160/240; victim −8 / 0; gilded +2. Do not retune. |
| MSN | Mining employer-only already. Espionage/war wait on §5. No police restitution in MSN. |
| SHP | Digit 0 untouched. Hostile yard `rep < 0` stays. |
| HUD-02 | No new family. Toasts `textContent`. |
| TGT-05 / EXP | No coupling. Do not write those briefs. |

---

## 7. XSS, ids, events

- Rank / faction / NPC lines: `textContent` only.
- Never `innerHTML` with `rankFor(rep).name` or comm text.
- Faction keys: `RESERVED_IDS` (copy `save.js` 105–109) + `Object.hasOwn(FACTIONS, key)` before index or assign.
- Never `reputation[userString]` from hail text or job title.
- Prefer `'commLine'`. Do **not** add `'reputationChanged'` in first impl.
- `npc.standingOf` later may add `hasOwn` + reserved drop (fail closed). Do not change hunt threshold.

---

## 8. `state.js`

READ-ONLY for REP feature workers.

Forbidden in REP PRs: new `RANK_LADDER` rungs, new `FACTIONS` keys, merging fear into reputation, `WEAPONS` / jobs tables.

Allowed later **only** with a named serial data owner: authored restitution UU (prefer `station.js` local, not `state.js`).

---

## 9. Serial PR plan (later implementation wave — not Wave 73)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 persist sanitize + inventory pins** | `sanitizeReputation`; proto/NaN drop; missing keys stay missing; finite reads = 0 | UI copy, new deltas, police |
| **PR2 Standing/UI explain (REP-01)** | Digit 9 ladder + how-it-moves + live consequence list (`textContent`); no new digit | HUD family, restitution, kill attrib |
| **PR3 HUD/toast reason lines** | `commLine` from writers REP already owns or already emit (mining/rescue/sale/patrol). Prefer existing emit | new frozen event; Digit remap |
| **PR4 attribution on playerKill** | victim-faction only **if** `npcDestroyed.ship` carries faction; **proposed** delta needs owner before pay | universal wanted; system-owner stamp; drop % |
| **PR5 boot pins** | `__proto__` dropped; NaN → 0; Beautiful missing until graft; Digit 9 copy; Digit 0 still yard; no `crimeScore` | wishlist / PROGRESS edits by feature workers |

**Optional later:** police leave hail; restitution desk (UU owner); `patrol-employer-faction`; MSN espionage/war families.

Do not implement in Wave 73.

---

## 10. Non-goals (locked)

- No `src/` in Wave 73.
- No universal wanted / crime score.
- No `RANK_LADDER` extra rung.
- No new dock Digit. Digit 0 shipyard.
- No HUD-02 reopen.
- No police AI in first impl.
- No invented restitution / kill / recon numbers.
- No BIO −10 or POD 160/240 retune.
- No silent patrol retarget.
- No `innerHTML`. No new autosave key.
- Do not edit the wishlist or `PROGRESS.md` in this wave.
- Do not write TGT-05 / EXP sibling files.

---

## 11. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.reputation` | existing module owners + `save.js` sanitize. REP explain PRs **read** and display. PR4 kill write only with owner delta | epics, standing, npc, yards |
| `RANK_LADDER` | **nobody** | `rankFor` |
| Patrol `freehold` | `station.js` `tickPatrolJob` until named serial | Standing copy |
| Mining employer | `station.js` mining complete | Standing / npc |
| Beautiful cap | `hangar.js` | npc hunt, Beautiful yard |
| Sale / rescue | `trafficking.js` / `applySurvivorRescue` | same |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |

---

## 12. Owner defaults (stand unless overridden)

1. First impl is **explain-only** (REP-01). Standing Digit 9.
2. Police leave beat **deferred**.
3. Restitution UU **proposed, needs owner** — no guessed price.
4. Restitution (when priced) sets **that** faction to **0**, then BIO cap may pull Beautiful back to −10.
5. Kill standing delta **proposed, needs owner**. Rule is victim-faction only.
6. Espionage secret success = no target loss. Failure exposes. No numbers.
7. Patrol stays Freehold until `patrol-employer-faction`.
8. Missing keys read 0; writers create on first finite delta.
9. No `'reputationChanged'` event in first impl.
10. `sanitizeReputation` drops reserved, non-faction, non-finite. Fresh object.

---

## 13. Verification pins (for a later read-only verifier)

A later verifier must pin:

1. Wave 73 tree: markdown under `docs/RepStandingDesign.md` and `out/w73/rep/**` only; `src/` untouched.
2. No `crimeScore` / `wanted` / new `WORLD_FIELDS` law key in the design.
3. `RANK_LADDER` six rungs unchanged.
4. Digit 0 shipyard; Digit 9 Standing; no new service in `DOCK_KEY_SERVICES`.
5. BIO −10 and POD 160/240 / `RESCUE` 4/1 cited, not retuned.
6. Patrol `freehold` named as freeze + later serial, not silently retargeted.
7. Espionage is a **rule freeze**, not a shipped `kind`.
8. Police leave + restitution UU marked defer / needs owner.
9. Sanitize: no `for…in` blob merge; `RESERVED_IDS`; NaN → 0 not Marked.
10. XSS: `textContent` only.
11. MSN mining employer-only is how remedial grind works.
12. No TGT-05 / EXP file coupling.
