# RIMWARD REP faction standing and law

| Field | Value |
|---|---|
| **Title** | RIMWARD REP faction reputation and law |
| **Author** | Wave 73 REP integrator |
| **Date** | 2026-08-20 |
| **Status** | Implemented. Wave 83: restitution desk Digit 9 (`RESTITUTION_UU` 1200). Police leave still deferred. |
| **Wave** | 73 — design. 74 — first impl. |
| **Owner request** | REP design brief. Do not ship standing UI, police, or `src/` in this wave. |
| **Merge law** | [`out/w73/rep/shared-contract.md`](../out/w73/rep/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w73/rep/current-rep-inventory.md`](../out/w73/rep/current-rep-inventory.md) |
| Merge law | [`out/w73/rep/shared-contract.md`](../out/w73/rep/shared-contract.md) |
| Security review | [`out/w73/rep/security-review.md`](../out/w73/rep/security-review.md) |
| Design-doc review | [`out/w73/rep/code-review.md`](../out/w73/rep/code-review.md) |

---

## Overview

Faction standing already exists as `ctx.world.reputation`, `RANK_LADDER`, a Digit 9 Standing (epics) pane, yard gates, patrol hunt at ≤ −10, mining/rescue/sale/graft writers, and persist on `WORLD_FIELDS` `'reputation'`. The player still cannot see **how** standing moves, **what** the number changes, or **how** to recover without a made-up universal crime score.

Wishlist REP needs explanation everywhere it matters, broad consequences, escalating law plus redemption, and faction-local attribution (no galaxy-wide wanted flag).

This brief is the integrator document for a **later** implementation wave. It freezes persist sanitize, Digit 9 as the dedicated screen, live-consequence inventory, deferred police/restitution, victim-faction piracy, espionage secret-vs-exposed, and a serial PR plan. Wave 73 lands this markdown only. Standing code does not change here.

HUD-02 stays closed. SHP Digit 0 stays shipyard. BIO graft −10 and POD 160/240 stay owned by those modules. MSN mining already writes the employer faction; REP rides it. `src/game/state.js` stays READ-ONLY. `RANK_LADDER` does not gain rungs.

**Player outcome:** the player understands how standing moves, sees what it changes, and can recover from hostility without a universal crime score.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “REP today”: [`out/w73/rep/current-rep-inventory.md`](../out/w73/rep/current-rep-inventory.md). Code wins over stale comments.

| Surface | Today | Cite |
|---|---|---|
| Ladder | Sworn 50, Trusted 25, Known 10, Stranger −10, Suspect −25, Marked −1000 | `state.js` 672–678 |
| Helper | `rankFor`; NaN falls through to Marked | `state.js` 680–682 |
| Default bag | four keys at 0; Beautiful etc. missing | `ctx.js` 128 |
| Persist | `'reputation'` wholesale; **no sanitize** | `save.js` 75, 698–700 |
| Digit 9 | Standing = epics pane | `station.js` 132, 2788–2831, 2881 |
| Rank line | dock root name + number | `station.js` 2887–2890 |
| Patrol job | **always** `freehold += 5` | `station.js` 1825 |
| Mining | employer `SYSTEMS[origin].faction` +2 | `station.js` 1879–1881 |
| Rescue | matching faction +4 other / +1 playerKill | `station.js` 1370–1388; `RESCUE` |
| Sale | victim + Gilded; Digit 7 | `trafficking.js` 8–13, 171–174 |
| Graft | Beautiful `min(current, −10)` while any grafted row | `hangar.js` 138–154 |
| Hunt | patrols at standing ≤ −10 | `npc.js` 87, 1065–1072 |
| Hail police | **none** | `hail.js` 47 |
| Kill attrib | **none** | `combat.js` `npcDestroyed` only |
| DOM | `textContent` | `station.js` 2027–2032; `hud.js` 924 |

Fear is a separate intimidation scalar. Restricted locker opens on fear ≥ 40 **or** Freehold **< −25** (Marked). −25 is still Suspect and does not open the locker. That is not a universal wanted flag.

### Pain points

- Wishlist REP-01: Standing shows epic stages, not the ladder, not writers, not a reason for the last change.
- Wishlist REP-02: several consequences already fire (yards, hunt, prices, epics) but the pane does not list them. Allies and jump locks do not exist — do not invent them in first impl.
- Wishlist REP-03: no order-to-leave hail; no restitution desk. Rescue already returns standing. Dock is not blocked (risky run already works).
- Wishlist REP-04: sale/rescue/mining/graft are local. Kills are not attributed. A later worker could “fix” that with a global crime score — this brief forbids it.
- Restore does not heal the reputation bag (NaN, proto keys, arrays).

### Why now (design) / why not now (code)

The owner asked for the REP brief after MSN mining, BIO grafts, and POD sale. Those modules already write faction keys. Implementation waits for a later serial wave so sanitize, Digit 9 copy, and attribution land against a frozen contract instead of a drive-by `world.wanted`.

---

## Goals & Non-Goals

### Goals

1. Document live writers, readers, ladder, persist hole, and Digit 9.
2. Freeze no new persist key; sanitize `'reputation'` in place.
3. Freeze first impl as **REP-01 explain** on Standing Digit 9 + existing toast/commLine. No second dock digit.
4. Freeze REP-02 as **inventory of live consequences**. New sim is later serials.
5. Freeze REP-03: police leave **deferred**; restitution UU **proposed, needs owner**; redemption = that faction → 0 then MSN mining / rescue.
6. Freeze REP-04: victim faction only; no universal crime score; espionage secret success = no target loss.
7. Freeze XSS / proto / missing-key = 0 / `RANK_LADDER` unchanged.
8. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` in Wave 73. No implementation PRs scheduled here.
- No `crimeScore` / `wanted` / extra `WORLD_FIELDS` law key.
- No new `RANK_LADDER` rungs. `state.js` READ-ONLY.
- No new dock Digit. Digit 0 stays shipyard. Digits 1–9 stay.
- No HUD-02 reopen. No new HUD family.
- No police AI in first impl. No invented restitution or kill UU/% .
- Do not retune BIO −10 or POD 160/240 or `RESCUE` 4/1.
- Do not silently retarget patrol `freehold`.
- Do not ship an espionage mission family (rule freeze only).
- No `innerHTML` world strings. No new frozen event unless `'commLine'` cannot carry the line.
- Do not edit the wishlist or `PROGRESS.md`.
- Do not write TGT-05 / EXP sibling files.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Keep `'reputation'` | Already on `WORLD_FIELDS`. Contract §0.2 |
| Crime score / wanted? | **Forbidden** | REP-04. Contract §0.2, §5.1 |
| First impl? | **Explain-only** on Digit 9 | Playable with no new economy. Contract §0.4, §12.1 |
| Second dock digit? | **No** | Digit 0 shipyard. Contract §0.4 |
| `RANK_LADDER` extra rung? | **No** | state.js READ-ONLY. Contract §0.12 |
| Police leave hail? | **Defer** | No live intent. Contract §0.6, §4.1 |
| Restitution UU? | **proposed, needs owner** | Do not invent prices. Contract §4.2 |
| Neutral after pay? | That faction **= 0** (Stranger) | Wishlist restore to neutral. Contract §4.2 |
| Remedial missions? | Existing MSN mining + rescue | Do not design a new family. Contract §0.7 |
| Patrol `freehold`? | **Freeze live**; later serial `patrol-employer-faction` | Msn inventory. Contract §0.15 |
| Kill attrib? | Victim faction only; delta **proposed** | No live write today. Contract §5.2 |
| Espionage? | Secret success no target loss; failure exposes; **not shipped** | MSN waits. Contract §0.8, §5.4 |
| `innerHTML`? | **No** | Live `h()` is `textContent`. Contract §0.10 |
| Missing keys? | Read 0; writers create on first delta | Default bag omits Beautiful. Contract §0.14 |
| Graft / POD numbers? | Unchanged | Neighbour freeze. Contract §0.9 |
| New ctx event? | **No** in first impl | Prefer `commLine`. Contract §0.13 |

---

### 2. Ladder (do not change)

Live rungs (`state.js` 672–678):

| Rank | min | tier | Player meaning |
|---|---|---|---|
| Sworn | 50 | 3 | Highest live rank. Epic capstones. Yard Sworn discount. |
| Trusted | 25 | 2 | Frigate min-rep. |
| Known | 10 | 1 | Ace min-rep. First epic rankTier. |
| Stranger | −10 | 0 | Default 0. Hunt floor is the **bottom** of this band (≤ −10 hunts). |
| Suspect | −25 | −1 | Band −25…<−10. Locker does **not** open at −25. |
| Marked | −1000 | −2 | Floor rung. Freehold locker opens at **< −25** (this band). |

Numeric **0** is Stranger (neutral). Hunt uses ≤ −10 (`HOSTILE_STANDING`), which is the Stranger/Suspect border: −10 is still named Stranger **and** is hunt-eligible.

Callers must pass a **finite** number. Sanitize drops NaN so `rankFor` cannot fall through to Marked from junk.

---

### 3. Persist

Restore copies `reputation` with no heal today. That is the trust boundary.

Later PR1: `sanitizeReputation` inside `sanitizeRestored`. Fresh object. `Object.keys` only. Keep finite numbers on `FACTIONS` keys that are not `RESERVED_IDS`. Contract §1.2.

Missing keys stay missing. `rankFor(0)` path: `standingRead` → 0 → Stranger.

Graft still **creates** `beautiful` when the cap writes. Mining still creates the employer key.

No `fieldOre`-style second map. No `world.crimes` array in first impl.

---

### 4. REP-01 — explain

Digit 9 **is** the dedicated reputation screen (wishlist). It already exists as Standing / epics. First impl **extends copy** on that pane:

1. Current dock faction, rank name, signed integer.
2. Ladder list from `RANK_LADDER` (name + min), `textContent`.
3. How standing moves: short authored lines for **live** writers (patrol Freehold +5, mining employer +2, rescue +4/+1, sale per POD, graft Beautiful cap, origin/ledger as flavor if space).
4. What it changes: short list from inventory §5 (hunt, yards, discounts, epics, locker). Do not list unshipped police/allies.
5. Keep existing epic stage ticks and `ACTIVE STANDING` effect lines.

Dock root rank line stays. Jobs already print patrol Freehold rep.

HUD: later PR3 may emit `commLine` when a writer already talks (mining/rescue/sale/patrol already do). Do not add `'reputationChanged'`. HUD-02 closed — no glance strip.

No Digit remap. People stays Digit 7. Shipyard stays Digit 0.

---

### 5. REP-02 — consequences

**Ship the list, not new sim.** Standing panel tells the truth about code that already runs.

Already live: mission payouts via `jobPayMult`; market buy/sell; repair; restricted locker (Freehold + fear); equipment/ships via yard `rep < 0` and min-rep; patrol hunt; epic stages; graft hostility.

Not live: allies assisting in space; locked systems; police stop-or-leave. Name them as later serials with **no numbers**.

---

### 6. REP-03 — law and redemption

**Police:** live hail is pirate demand, salvage, Named Gun respect, Callow vouch. There is no patrol “leave this space” card. Law zone (300 u) already stops intent near the station. First impl does **not** invent police AI. Optional later PR after owner sign-off.

**Risky run:** docking is not standing-gated. Keep that.

**Restitution:** UU **proposed, needs owner**. Shape frozen: dock of the offended faction; two-step `textContent`; set that key to 0 if it was negative; BIO graft cap may immediately pull Beautiful to −10; Esc cancels.

**Then grind:** MSN mining +2 employer; matching-faction rescue. Not a new penance family.

---

### 7. REP-04 — local attribution

Piracy does **not** become a galaxy wanted number.

Later kill write (PR4, optional): victim NPC faction only; skip independent/missing/reserved; no extra system-owner stamp; **delta proposed, needs owner**. If `npcDestroyed` cannot carry faction safely, defer.

Overt war work (later MSN): employer up, target down, live tables not `job.faction`.

Espionage (later MSN-02, **not shipped here**): success is secret (no target loss). Failure exposes (normal target loss). No drop %, no recon table, no `kind: 'espionage'` in this wave.

Patrol remains Freehold until a named serial. Do not “fix” it inside explain PRs.

---

### 8. Neighbours

| Module | REP does | REP does not |
|---|---|---|
| MSN | Ride mining employer +2 for redemption | Invent espionage family; invent police restitution; retarget patrol in first impl |
| BIO | Cite Beautiful −10 cap; restitution cannot skip it while grafted | Retune −10; strip grafts |
| POD | Cite rescue +4/+1 and sale tables | Change 160/240 or Digit 7 tone |
| SHP | Cite hostile no-sale and min-rep | Touch Digit 0 catalog |
| HUD-02 | Toast `commLine` `textContent` | New family / hullKind writes |

---

### 9. Serial PR plan

Matches contract §9.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 persist + pins** | `sanitizeReputation`; proto/NaN drop | UI, police, deltas |
| **PR2 Standing explain** | Digit 9 ladder + how/why; `textContent` | new Digit, HUD family |
| **PR3 reason lines** | `commLine` on existing writers | new frozen event |
| **PR4 kill attrib** | victim faction **if** path exists; owner delta | wanted flag; invented % |
| **PR5 boot pins** | sanitize + Digit 9 + no crimeScore | wishlist / PROGRESS |

Optional later: restitution desk; patrol hail leave; `patrol-employer-faction`; MSN war/espionage.

`state.js` untouched. Boot pins belong in `scripts/boot-test.mjs` in the implementation wave (not this worker).

---

### 10. Non-goals (expanded)

- A galaxy-wide wanted meter or police net.
- New rank above Sworn (BIO gift still uses Sworn 50).
- Dock refuse for Marked.
- `innerHTML` rank widgets.
- Coupling to TGT-05 reticle or EXP data-trade briefs.

---

### 11. Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Universal crime score sneaks in | Contract §0.2 / §5.1; PR5 pin no `wanted` |
| NaN → Marked / yard skip | Sanitize finite; callers use `standingRead` |
| `__proto__` faction key | `RESERVED_IDS` + `hasOwn(FACTIONS)`; fresh bag |
| New dock Digit | `DOCK_KEY_SERVICES` frozen |
| Patrol silently becomes dock faction | Named serial only |
| Restitution guessed UU | Needs owner; no button without constant |
| Graft skip via restitution | BIO cap re-applied |
| Espionage shipped as numbers | Rule freeze only |
| BIO/POD retune | Explicit non-goals |
| HUD-02 reopen | Toasts only |
| XSS rank names | `textContent` |

---

## Open owner questions

**Closed Wave 82** — [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. Restitution UU: **1200**. Desk later.
2. First Standing impl stays explain-plus-live-writes (kill −5 ships Wave 82).
3. Police hail “leave”: **defer**.
4. Player-kill standing delta: **−5**.
