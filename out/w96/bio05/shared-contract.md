# BIO-05 remaining Abominations shared contract

**Wave:** 96. Design only. No BIO-05 feature ships in this wave.  
**Status:** MERGE LAW for `docs/Bio05AbominationsDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/BioLivingShipsDesign.md`, `docs/Bio01ObtainDesign.md`, `docs/Bio02EvolutionDesign.md`, `docs/Bio03FleetDesign.md`, `docs/Bio03ClassLookDesign.md`, `docs/Bio04PsionicsDesign.md`, `docs/Shp*.md`, `docs/Nav*.md`, `docs/OwnerDecisions*.md`.  
**Locked sources:** wishlist BIO-05 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1204–1216); live inventory `out/w96/bio05/current-bio05-inventory.md` (code wins); Wave 72 graft + Wave 82 UU/standing (`docs/OwnerDecisionsWave82.md`); `src/game/hangar.js`; `src/game/shipyard.js`; `src/systems/shipyard-desk.js`; `src/systems/station.js`; `src/game/save.js`; `src/game/state.js` (READ-ONLY); `src/game/kill-standing.js`; `src/systems/npc.js`; `src/systems/hud.js`; `src/game/psionic.js`; `src/systems/combat.js`; `src/systems/ship.js`; `src/core/ctx.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments (including `docs/BioLivingShipsDesign.md` §7 “NPC destroy is later” — the **helper** already shipped).

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 96 is **markdown only**. Later impl is **serial**. Do **not** schedule or land these PRs in `src/` in this worker. This wave does not ship grafts.
2. `src/game/state.js` is READ-ONLY this wave. Later impl **defaults to no `state.js` write**. Graft already uses hangar rows + live `GRAFT_LIST_UU`. A dedicated serial `state.js` PR is only required if the owner later opens a **new SKU**. Do not open one here.
3. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. `grafted` rides the hangar row (`save.js` 94). Autosave stays `rimward-save-v1`.
4. `innerHTML` forbidden. `textContent` / `h()` / `el()` only.
5. Digit 0 stays **shipyard** at dock level-1 (`station.js` 186, 5920–5922). Do not steal Digit 0–9 dock services. Yard Digit 0 stays hangar **row 8**.
6. HUD **never** writes `hullKind`. Grafted built stays `mech`.
7. Do **not** reopen BIO-01 gift/pirate, BIO-02 train dests (Wave 94 any `LIVING_STOCK`), BIO-03 bake, BIO-04 psionic numbers, NAV-04, police leave, Unknowables dock, power ledger, aim-glass gauge.
8. Do **not** invent UU or standing deltas. Remaining numbers point at `docs/OwnerDecisionsWave82.md` or stay **owner-open**. Live integers stay: graft **4000**, hostility cap **−10**, kill **−5**, destroy-Abomination Beautiful **+5**.
9. Prototype-safe persist: `SAFE_ID`, `RESERVED_IDS`, `hasOwn` / `hasOwnProperty`. No `for-in` merge of a raw blob onto a hangar row.
10. Do not edit sibling Bio/Nav/Shp docs, the wishlist, `PROGRESS.md`, or `docs/OwnerDecisions*.md`.
11. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs. Do not reopen HUD-01 empty aim glass.
12. Player living CPU mesh (`makeLivingHull`) stays the quality bar. Do **not** weaken it. Do **not** replace it with a grafted overlay on living hulls.
13. Wave 72 grafts are **shipped**. Do not re-design them as if they were absent.

---

## 1. DONE — player graft loop (closed; do not reopen)

Inventory §13. The later serial **must not** re-author these.

### 1.1 Shape

Abomination = hangar row `hullKind === 'built'` **and** own-key `grafted === true`. Living rows and Unknowables **drop** the flag.

### 1.2 Sale

Gilded Hangar pane, two-step Offer → Confirm. Debit `GRAFT_LIST_UU` (4000) on confirm only. Mounted built only. No remount. No new hangar row.

Live copy (keep; do not rewrite unless an owner line changes it):

| Moment | Copy |
|---|---|
| Offer | `Graft tissue` / `4000 UU · Mounted plated hull.` / `Offer graft` |
| Warn | `Beautiful Ones become immediate enemies. Patrols hunt at standing -10 or worse.` |
| Reduced | `Beautiful Ones become enemies.` |
| Success | `Tissue sealed to the hull.` |
| Living / Unk | `Grafts fit plated hulls only.` |
| Already | `This hull is already grafted.` |
| Banner | `The Chain does not graft here.` |
| Hostile Gilded | `No sale.` |
| Credits | `Not enough credits.` |

### 1.3 Standing while owned

While **any** sanitized hangar row is grafted, Beautiful standing is `min(current, HOSTILE_STANDING)` (−10). Cap on sanitize, restore, remount, graft confirm, and after kill writes. Tamper cannot own tissue without the cap. Removing the last graft (if a later prune exists) does **not** auto-heal.

### 1.4 Destroy bonus (named; do not change)

`ABOMINATION_DESTROY_BEAUTIFUL_DELTA = +5` on the live kill helper when the victim is grafted. Beautiful victim: write **only** kill −5. Then recap: if the **player** still owns tissue, Beautiful stays ≤ −10.

### 1.5 Fail-closed (keep)

Already-grafted refuse. Living / Unknowables refuse. Hangar cap 8 is buy/grant law (graft does not add a row). Esc cancel is no write.

### 1.6 Digit 5 / HUD

Grafted built may fire Digit 5 (`canFirePsionic`). HUD family stays mech. Unknowables miss non-beam. Do not retune BIO-04 numbers.

### 1.7 No further player graft PRs

The player graft sale / warn / standing / persist / Digit-5 path is **complete**. A later serial **does not** schedule player-facing graft desk PRs. Optional leftovers are §2 only.

---

## 2. Remaining (optional later serial — not this wave)

### 2.1 NPC Abomination traffic / look — OPEN (default: stay player-only)

Live `npc.js` / `traffic.js` never set `grafted`. `createShipState` does not copy `grafted` (`state.js` 167–188). Destroy +5 therefore does not fire on current traffic.

**Default (owner Q, frozen here):** later impl **does not** add NPC grafted hulls unless a **new owner line** opens it. World look stays **player-only**. The kill helper stays in place.

If the owner later opens NPC spawns:

- Write own-key `grafted: true` only on **built** NPC state (not living, not Unknowables).
- Do not invent a new standing delta. Reuse live +5 / recap −10.
- Do not steal Digit 0–9.
- Mesh: plated NPC GLB **plus** optional overlay in a visual PR. Do not call `makeLivingHull` for NPCs (player living CPU bar).
- Fail closed if `grafted` is not boolean own-key `true`.

Until that owner line exists, treat NPC grafts as **non-goal**.

### 2.2 Visual grafted tissue on the player built mesh — OPEN (default: keep plated)

Live grafted player mesh is **plated** (`ship.js` 535–560). HUD already says mech.

**Default:** do **not** replace `makeLivingHull`. Do **not** convert grafted built into a living mesh. A later visual PR may add a tissue overlay on the **plated** rig only. Player living CPU swim / breath / veins stay unique to living / unset / Unknowables.

### 2.3 Hangar “grafted” badge — OPEN (default: omit)

Hull cards do not say grafted (`shipyard-desk.js` 397–403). Standing Digit 9 and the Gilded warn already tell the beat. **Default: do not add a badge.** Owner-open if later chrome is wanted. Copy, if ever added, is static `textContent` (example only when owner opens: `grafted`). Not this wave.

### 2.4 Ungraft SKU — FORBIDDEN unless owner opens a new SKU

No live ungraft. Do not invent a sell-tissue commodity. Do not add `COMMODITIES` rows. `state.js` stays closed.

---

## 3. Persist (later impl, if any leftover lands)

| Item | Rule |
|---|---|
| New `WORLD_FIELDS` | **Forbidden** |
| New `localStorage` key | **Forbidden** |
| `grafted` | Boolean own-key on hangar row / mounted player only |
| Heal | Existing `sanitizeHangarRecord` / `healPlayerGrafted` |
| Proto | `SAFE_ID`; reserved ids never become hull or reputation keys |
| Merge | Build allowlisted objects. Never `for…in` a raw save blob |
| Emit | Graft confirm emits **nothing** today. Keep that. Kill standing may `commLine` primitives only. Never `{ ...hangar }` |

---

## 4. Security (later impl)

1. World strings: `textContent` / `h()` / `el()`. No `innerHTML`.
2. Desk copy is source literals. Do not put player/NPC names through HTML on graft papers.
3. Ids: `isSafeHullId`. Do not take graft flags from query strings.
4. Standing writes only `'beautiful'` / victim faction through `Object.hasOwn(FACTIONS, key)` and reserved-id skip.
5. `ctx.emit`: fresh literals. Do not smash `type`.
6. No path join / remote URL / `eval` for grafts.
7. Do not invent economy numbers.

---

## 5. Later serial PR plan (not Wave 96)

Wave 96 writes markdown only. **Do not land `src/` here.**

| PR | Scope | When |
|---|---|---|
| **PR1 inventory pins** | Optional later: re-assert live pins (allowlist drop living/Unk, cap −10, 4000 UU, Digit 0, HUD no-write, Digit 5 grafted). No product change | Only if a later impl wave needs boot pins |
| **PR2 player leftover** | **None.** Player graft loop is closed. Do not schedule a desk rewrite | Frozen |
| **PR3 NPC / visual** | Only if the owner opens §2.1 and/or §2.2 | Optional; serial; not this wave |

If inventory still matches at impl time, skip PR2 forever. Skip PR3 until an owner line exists.

---

## 6. Owner questions (defaults frozen; no invented numbers)

| Q | Default |
|---|---|
| New UU / standing integer? | **No.** Wave 82 numbers stand |
| NPC grafted hulls in the world? | **No** until a new owner line |
| Replace `makeLivingHull` for grafted built? | **No** |
| Tissue overlay on plated player mesh? | Later visual only; default **keep plated** |
| Hangar grafted badge? | **Omit** |
| Ungraft / tissue commodity? | **No** |
| `state.js` write? | **No** unless owner opens a new SKU |
| New persist key? | **No** |
| New Digit? | **No** |

Do not invent numbers while waiting for a different owner answer.
