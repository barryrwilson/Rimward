# RIMWARD REP-04 kill attribution

| Field | Value |
|---|---|
| **Title** | RIMWARD REP-04 faction-local kill attribution |
| **Author** | Wave 79 REP-04 integrator |
| **Date** | 2026-08-21 |
| **Status** | First impl Wave 80. PR1–PR4 landed. Wave 82 set `KILL_STANDING_DELTA = -5` and Destroy-Abomination Beautiful `+5` (skip if victim faction is Beautiful). Digit 9 may name the kill write. |
| **Wave** | 80 — first impl of the Wave 79 freeze. Helper + one `handleDestroyed` bind + boot pins. |
| **Owner request** | REP-04 victim-faction piracy attribution. No universal crime score. No police desk. No restitution UU. No espionage/war job kinds. |
| **Merge law** | [`out/w79/rep04/shared-contract.md`](../out/w79/rep04/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w79/rep04/current-rep-inventory.md`](../out/w79/rep04/current-rep-inventory.md) |
| Merge law | [`out/w79/rep04/shared-contract.md`](../out/w79/rep04/shared-contract.md) |
| Security review | [`out/w79/rep04/security-review.md`](../out/w79/rep04/security-review.md) |
| Design-doc review | [`out/w79/rep04/code-review.md`](../out/w79/rep04/code-review.md) |
| Wave 79 verify | [`out/w79/rep04/verify.txt`](../out/w79/rep04/verify.txt) |

---

## Overview

Wishlist REP-04 wants piracy in faction space attributed to the **victim’s faction**, not a galaxy-wide crime score. Wave 73 froze that rule. Wave 74 shipped persist sanitize and Digit 9 explain. Kill writes did not ship. Police leave did not ship. Restitution UU is still owner-open.

Live today: `ctx.world.reputation` already moves from jobs, rescue, sale, graft, and origin arcs. Combat `'npcDestroyed' { ship }` already exists. Incidents already record `causer`. **No path writes standing from a kill.**

This brief freezes the deferred kill-write serial: persist-safe helper, player-gun witness, victim-faction only, fail closed until an owner delta, Digit 9/`commLine` only after a real write, and a serial PR plan. Wave 80 landed PR1–PR4 fail-closed (`src/game/kill-standing.js`, one `handleDestroyed` call). Standing still does not move until the owner authors a delta.

HUD-02 stays closed. SHP Digit 0 stays shipyard. BIO −10 and POD 160/240 and rescue +4/+1 stay owned by those modules. Patrol stays hardcoded `freehold`. `src/game/state.js` stays READ-ONLY. `RANK_LADDER` does not gain rungs.

**Player outcome (after a later impl + owner delta):** destroying a civilian or patrol hull as the last attacker moves **that hull’s faction** only. NPC-vs-NPC and sun/world deaths do not. Pirate/ace kills stay legal hunt, not piracy.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “REP and kill provenance today”: [`out/w79/rep04/current-rep-inventory.md`](../out/w79/rep04/current-rep-inventory.md). Code wins over stale comments. Wave 73/74 line numbers are stale.

| Surface | Today | Cite |
|---|---|---|
| Ladder | Sworn 50 … Marked −1000 | `state.js` 672–678 |
| Helper | `rankFor`; NaN falls through to Marked | `state.js` 680–682 |
| Default bag | four keys at 0; Beautiful etc. missing | `ctx.js` 129 |
| Persist | `'reputation'` + `sanitizeReputation` | `save.js` 75–76, 671–691, 865 |
| Digit 9 | ladder + how/why + live list + epics | `station.js` 1072–1102, 4196–4216 |
| Patrol job | **always** `freehold += 5` | `station.js` 170, 2777 |
| Employer jobs | mining/hunt/trade/passenger/explore +2 origin faction | `station.js` 194, 2658, 2895, 2944, 2991, 3055 |
| Overlay / ace bounty | credits only; **no** rep | `station.js` 3077–3089 |
| Rescue | matching faction +4 other / +1 playerKill **source** | `station.js` 1648–1666; `RESCUE` `state.js` 289–294 |
| Sale | victim + Gilded; Digit 7 | `trafficking.js` 8–13, 171–174 |
| Graft | Beautiful `min(current, −10)` while any grafted row | `hangar.js` 138–154 |
| Hunt AI | patrols at standing ≤ −10 | `npc.js` 87, 1065–1072 |
| Hail police | **none** | `hail.js` 48 |
| Kill attrib | **none** | combat/npc emit only |
| Event | `'npcDestroyed' {ship}` | `ctx.js` 200; `combat.js` 1547 |
| Witness (guns) | `lastAttackerOf === 'player'` | `npc.js` 1028–1036; `combat.js` 1541 |
| Incident causer | 8 s window on **any** `'npcHit'` | `world.js` 1597–1604 |
| DOM | `textContent` | `station.js` 3208–3212; `hud.js` 924 |
| `innerHTML` | **none** in `station.js` | grep 0 |

Fear is a separate intimidation scalar. Restricted locker opens on fear ≥ 40 **or** Freehold **< −25** (Marked). That is not a universal wanted flag.

### Pain points

- Wishlist REP-04: sale/rescue/mining/graft are local. Kills are not attributed. A later worker could “fix” that with a global crime score — this brief forbids it.
- Incident `causer === 'player'` is **too loose** for standing (any `npcHit` stamps the window). Hunt jobs already use it. Kill standing must use `lastAttackerOf`.
- Kill **delta is unauthored**. Inventing −N or a hull % would violate fail-closed law.
- Digit 9 must not claim kills move standing while the helper still no-ops.

### Why now (design) / why not now (code)

The parent freeze named kill writes as later PR4. Espionage and faction-war still wait on this rule. Inventory and merge law exist. Implementation waits for a later serial so the helper, witness, and owner delta land against a frozen contract instead of a drive-by `world.wanted`.

---

## Goals & Non-Goals

### Goals

1. Document live writers, readers, Digit 9 copy, `npcDestroyed`, incident `causer`, and `playerKill` cargo source from **live code**.
2. Freeze no new persist key; reuse Wave 74 `sanitizeReputation`.
3. Freeze kill write as **victim NPC faction only**, skip independent/missing/reserved, no system-owner stamp.
4. Freeze witness as **player last attacker** on destruction. Skip NPC-vs-NPC and sun/world. Skip pirate/ace (not piracy).
5. Freeze kill delta **proposed, needs owner**. Until authored, **no standing write**.
6. Freeze police leave **deferred** and restitution UU **proposed, needs owner** (do not design those desks here).
7. Freeze XSS / proto / `textContent` / `'commLine'` only / no new event.
8. Freeze a serial PR plan: persist-safe helper → combat bind → copy if needed → boot pins. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 79. No `src/` edits. No `scripts/` / `public/` / `package.json`.
- No HUD-02 chart marks. No AST `asteroidId`. No POD reopen. No SHP hull grants. No BIO graft retune. No EXP SKU. No TGT-05.
- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- No `crimeScore` / `wanted` / `world.crimes`. No extra `WORLD_FIELDS` law key.
- No new `RANK_LADDER` rungs. `state.js` READ-ONLY.
- No new dock Digit. Digit 0 stays shipyard. Digits 1–9 stay.
- No police AI. No invented restitution or kill UU/%.
- Do not retune BIO −10 or POD 160/240 or `RESCUE` 4/1.
- Do not silently retarget patrol `freehold`.
- Do not ship `kind: 'espionage'` or faction-war jobs (siblings). Cite §7 rules only.
- No `innerHTML` world strings. No new frozen event unless `'commLine'` cannot carry the line (default: no).
- Do not edit the wishlist, `PROGRESS.md`, `docs/RepStandingDesign.md`, or sibling `out/w79/{espionage,faction-war}`.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Keep `'reputation'` | Already on `WORLD_FIELDS`. Contract §0.2, §1.1 |
| Crime score / wanted / `world.crimes`? | **Forbidden** | REP-04. Contract §0.2 |
| Victim who? | Live hull `record.faction ?? state.faction` only | Contract §0.3, §2.2 |
| System owner extra stamp? | **No** | Not a crime score. Contract §0.3, §3.3 |
| Independent / missing / reserved? | **Skip** | Contract §0.4 |
| Kill delta? | **proposed, needs owner**; else **no write** | Contract §0.5, §2.1 |
| UU table / % hull? | **Forbidden** | Contract §0.5 |
| Witness? | `lastAttackerOf === 'player'` | Leaky incident window. Contract §0.6, §3.2 |
| Pirate / ace victim? | **Skip** | Legal hunt, not piracy. Contract §0.7, §2.3 |
| Surrender / disable? | **No write** | Destruction only. Contract §2.3 |
| Police leave? | **Defer** | REP-03. Contract §0.8 |
| Restitution UU? | **proposed, needs owner**; no desk here | Contract §0.8 |
| Patrol `freehold`? | **Freeze live** | Contract §0.9 |
| Espionage / war jobs? | **Not this serial** | Siblings. Contract §0.10, §5 |
| Sanitize extend? | **No** unless a new field (default none) | Contract §0.11 |
| `innerHTML` / new event? | **No** / default no | Contract §0.13 |
| Digit 9 kill line? | Only after a real write exists | Contract §0.15, §4.2 |
| `state.js` / ladder? | READ-ONLY / unchanged | Contract §0.12 |
| Write helper lookup? | `standingRead` / trafficking `canWriteRep` shape. **Never** `npc.standingOf` (no reserved/`hasOwn`). **Never** `reputation[userString]` | Contract §2.2, §2.4 |
| Kill delta sign? | Owner integer. Wishlist is a **penalty**. Do not invent the number or a hull % | Contract §0.5, §2.1 |

### 2. Current standing (do not break)

See inventory §§1–5. The load-bearing loop is:

1. Restore heals the bag (`sanitizeReputation`).
2. Digit 9 explains live writers and live consequences.
3. Jobs write employer or hardcoded Freehold. Overlay/ace write none.
4. Rescue/sale/graft/origin write their owned keys.
5. Combat emits `'npcDestroyed'`; world records an incident; **standing does not move**.

**This serial must not change step 1’s healer, Digit 9 digit map, patrol Freehold, BIO/POD numbers, or hunt employer +2.** Kill standing is additive and fail-closed.

### 3. Persist: reuse sanitize

Restore already heals reputation (`save.js` 865). That is the trust boundary.

Later PR1: **no new field**. Helper mutates one allowlisted key in memory; snapshot already copies `'reputation'`.

Do **not** add `world.kills`. Do **not** persist `KILL_STANDING_DELTA` (code constant).

### 4. Kill vertical slice

**Beats (after owner delta):**

1. Player guns destroy a trader, miner, or patrol hull (`lastAttackerOf === 'player'`).
2. Helper reads victim faction from the live ship. Independent/missing/reserved skip.
3. Bag[victim] += owner-authored integer (wishlist: a penalty; number unset → skip). One key only.
4. `'commLine'` names the faction display name via `textContent` path.
5. Digit 9 already lists how standing moves (one new authored line in that PR).

**Not beats:**

- Destroying a pirate or ace (hunt/overlay/patrol job).
- NPC-vs-NPC, blockade `causer: 'world'`, sun without player last attacker.
- Paying restitution or hailing “leave” (REP-03).
- Secret espionage success (no target loss — rule only; no job).

**Fail closed until owner delta:** steps 3–5 do not run. Helper returns `no-delta`. Tests pin the bag unchanged.

### 5. Witness (do not copy Jobs)

| Signal | Use for kill standing? |
|---|---|
| `lastAttackerOf(ship) === 'player'` | **Yes.** Combat `fromPlayer` / mining laser |
| Incident `causer === 'player'` | **No** (any `npcHit` in 8 s, `world.js` 1597–1604) |
| Survivor `source === 'playerKill'` | **No** (hold flag; rescue/sale already owned) |
| `'sunKill'` | Player death only; NPCs have no sun `applyHit` |
| Blockade abstract kill | `causer: 'world'` — skip |

Bind once in `handleDestroyed` (`npc.js` 2109–2144) so combat emit + npc backstop cannot double-write.

### 6. Copy

`textContent` / existing `h()` / `'commLine'` only. HUD already toasts `'commLine'` (`hud.js` 400–408, 924).

No `'reputationChanged'`. No innerHTML. No `rec-` ids. Faction names from `FACTIONS[key].name` after `Object.hasOwn`.

Digit 9 kill sentence waits for a real write.

### 7. Neighbours

| Module | REP-04 does | REP-04 does not |
|---|---|---|
| MSN hunt/overlay | Skip pirate/ace victims | Steal employer +2; retarget patrol |
| BIO | Leave −10 cap | Retune; strip grafts |
| POD | Leave 160/240 and rescue 4/1 | Change Digit 7 |
| SHP | Cite hostile no-sale | Touch Digit 0 |
| HUD-02 | Toast `commLine` | New family |
| Espionage / war | Cite §7 rules | Ship job kinds (siblings) |
| REP-03 | Name deferred police / restitution | Design a desk or leave hail |

### 8. Serial PR plan

Matches contract §8. **Named only. Do not implement in Wave 79.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 persist-safe write path** | **Wave 80.** helper; allowlist; proto drop; `KILL_STANDING_DELTA = null` → no write | invented number; new persist key |
| **PR2 combat / incident bind** | **Wave 80.** `handleDestroyed` once; player last attacker; skip pirate/ace/independent | world.js causer write; system-owner stamp; `crimeScore` |
| **PR3 commLine / Standing copy** | **Wave 80 fail-closed.** line **iff** a finite delta wrote (none while null) | `innerHTML`; `'reputationChanged'`; false Digit 9 claim |
| **PR4 boot pins** | **Wave 80.** no crimeScore; NPC-vs-NPC no write; pirate no victim write; proto drop; ladder unchanged | wishlist / PROGRESS rewrite; patrol retarget |

`state.js` untouched. Fail-closed delta still owner-open.

### 9. Coupling

| Neighbour | Coupling | Law |
|---|---|---|
| Combat / npc death | `'npcDestroyed'` + `lastAttacker` | Read only. One helper call in `handleDestroyed` |
| Incidents | Hunt/overlay still use `causer` | Kill standing must not |
| Digit 9 | Optional one line after real writes | Do not remap digits |
| Fear | Ace / surrendered-kill bumps | Not standing |
| Sanitize | Reuse | No new field |

---

## Key decisions

| Decision | Freeze |
|---|---|
| Universal crime score | Never |
| Who loses standing | Victim hull faction only |
| Independent | Skip |
| Unauthored delta | No write |
| Player vs NPC last shot | Player last attacker only |
| Pirate kill | Not piracy |
| Police / restitution | Out of this serial |
| Patrol Freehold | Unchanged |
| Espionage jobs | Sibling; secret-success = no target loss (rule) |
| Persist | Existing `'reputation'` |

---

## Regression risks

| Risk | Mitigation |
|---|---|
| Universal crime score sneaks in | Contract §0.2; PR4 pin no `wanted` / `crimeScore` |
| NPC-vs-NPC punished | Witness `lastAttackerOf`; ignore incident window |
| Sun / world kill punished | Fail closed without player last attacker |
| Pirate hunt double-penalized | Skip pirate/ace roles |
| System owner stamped | Victim key only |
| `__proto__` faction key | `RESERVED_IDS` + `hasOwn(FACTIONS)`; fresh bag |
| Invented −N / hull % | `KILL_STANDING_DELTA = null` until owner |
| Digit 9 lies | No kill line until a write exists |
| New dock Digit | `DOCK_KEY_SERVICES` frozen |
| Patrol silently becomes dock faction | Named serial only |
| Restitution / police designed here | Explicit non-goals |
| Espionage shipped as numbers | Rule freeze only; no `kind` |
| BIO/POD retune | Explicit non-goals |
| XSS rank / comm names | `textContent`; allowlisted `FACTIONS[].name` |
| `'reputationChanged'` event | Forbidden |
| `state.js` dump | READ-ONLY |
| Wave 74 sanitize regress | PR1 does not rewrite the healer |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.reputation` | existing writers; later `applyPlayerKillStanding` | Digit 9, npc, yards, epics |
| `'reputation'` persist | `save.js` sanitize | restore |
| `'npcDestroyed'` | combat emit; npc de-dupe | world, patrol job, hud/song |
| `lastAttacker` | combat.js | kill helper |
| Incidents | world.js | jobs / rumors — **not** kill key |
| `state.js` | serial data owner only | **feature PRs read-only** |

---

## Acceptance direction (implementation wave)

From the wishlist, made testable for the **kill** slice:

1. No `crimeScore` / `wanted` / `world.crimes` field on `WORLD_FIELDS` or live world after restore.
2. Until the owner constant is set: player destruction of a trader **does not** change the bag.
3. After the owner constant is set: player last-attacker destruction of a Freehold trader writes **Freehold only**, not every faction, not the system owner.
4. Independent / missing / reserved / `__proto__` keys never become bag keys.
5. NPC-vs-NPC destruction does not write. Blockade / world causer does not write.
6. Pirate or ace destruction does not write victim standing (hunt/overlay/patrol paths unchanged).
7. Digit 0 is still shipyard. Digit 9 still Standing. `RANK_LADDER` still six rungs. BIO −10 and POD 160/240 and rescue +4/+1 unchanged.
8. No `innerHTML` in station/hud paths. Completions use `'commLine'` `textContent`.
9. `kind: 'espionage'` is absent. Patrol still credits `freehold`.
10. Restore of a proto bag still heals via live `sanitizeReputation`.

---

## Open owner questions

**Closed Wave 82** — [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. Player-kill standing **delta:** `KILL_STANDING_DELTA = -5`. Wave 82 sets the helper constant.
2. Restitution UU: **1200**. Desk later (`station.js`).
3. Police hail “leave”: **defer**.
4. Unknowables: **write** when `Object.hasOwn(FACTIONS)` and not independent/reserved.

Do not invent prices or kill numbers in this wave.
