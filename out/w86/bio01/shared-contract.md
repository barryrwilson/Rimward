# BIO-01 remaining obtain shared contract

**Wave:** 86. Design only. No BIO-01 feature ships in this wave.  
**Status:** MERGE LAW for `docs/Bio01ObtainDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/BioLivingShipsDesign.md`, `docs/Bio02EvolutionDesign.md`, `docs/Bio03FleetDesign.md`, `docs/Bio03ClassLookDesign.md`, `docs/Bio04PsionicsDesign.md`, `docs/Shp*.md`, `docs/Nav*.md`, `out/w86/bio02/**`, `out/w86/bio04/**`.  
**Locked sources:** wishlist BIO-01 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1059–1066); live inventory `out/w86/bio01/current-bio01-inventory.md` (code wins); `docs/BioLivingShipsDesign.md` §3.2 gift freeze (honor; do not edit); `docs/OwnerDecisionsWave82.md` (do not invent further UU, drop rates, or standing deltas); `src/game/hangar.js`; `src/game/shipyard.js`; `src/systems/shipyard-desk.js`; `src/systems/station.js`; `src/game/save.js`; `src/game/state.js` (READ-ONLY); `src/systems/ship.js`; `src/systems/organic.js`; `src/systems/hud.js`; `src/core/ctx.js`; `src/systems/npc.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 86 is markdown only. Implementation is a later **serial** wave. Do not schedule or land these PRs in `src/` in this wave.
2. Honor `docs/BioLivingShipsDesign.md` §3.2: Sworn gift (≥50), reserved hangar id **`hull_seed_gift`**. Do not reopen Wave 72 grafts. Do not edit that file.
3. Gift and pirate seed persist as **hangar rows** with `hullKind: 'living'`. Not cargo. Not `livingRock`. Not nested `loadout`. Not a new `WORLD_FIELDS` key. Not a new `localStorage` key. Autosave stays `rimward-save-v1`.
4. Hangar cap is live `HANGAR_CAP` **8**. Gift and pirate **fail closed** when full. Do **not** evict a hull to make room. Do **not** remount on grant. Player mounts later from Hangar (Digit 1 pane).
5. Gift hull class: living **`light`**. Inventory has no better existing gift SKU. Do not add a class key. Living frigate / ace / freighter **buy** stay omitted (`LIVING_STOCK` = `light` `cutter` `heavy`).
6. Pirate seed: persist shape + fail-closed drop. **Do not invent a drop percent or UU in this file.** If a number is required, it is **owner-open** and points at `docs/OwnerDecisionsWave82.md`. Later impl copies that owner line or fail-closes. Do not pick another rate.
7. Seed-as-commodity: **deferred, owner-open**. Live `COMMODITIES` has **no** seed SKU (`state.js` 308–322). Do not add one in a feature PR. Do not overload `livingRock`.
8. `state.js` is READ-ONLY this wave (markdown). Later impl **defaults to no `state.js` write**. Gift uses live `RANK_LADDER`. Pirate rate, if ever copied, lives next to hangar/yard helpers — not a drive-by `COMMODITIES` row. A **dedicated serial `state.js` PR** is only required if the owner later opens commodity SKU. Say so; do not edit `state.js` here.
9. HUD **never** writes `hullKind`. Grafted built stays `mech`. Gift/pirate living rows read `bio` after the player mounts them.
10. `isBeautiful(player.faction)` is **not** the living-player test. Starter is `independent` (`state.js` 146).
11. Digit 0 stays **shipyard** at dock level-1 (`station.js` 5710–5715). Do not steal Digit 0–9 dock services. Yard Digit 0 stays hangar **row 8**.
12. `textContent` only. No `innerHTML`. Prototype-safe persist (`SAFE_ID`, `RESERVED_IDS`, `hasOwn`). Do not spread hangar blobs into `ctx.emit`.
13. Do not open BIO-02 evolution, BIO-03 bake, BIO-04 psionics, Unknowables dock, power ledger, police leave, NAV.
14. Do not “fix” known boot FAILs WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
15. Do not invent standing deltas for gift or pirate. Kill standing stays the live helper.

---

## 1. Persist — hangar row is the seed

### 1.1 Key

- Ride existing `WORLD_FIELDS` **`hangar`** (`save.js` 94).
- **Forbidden:** `'seed'`, `'gift'`, `'pirateSeed'`, cargo SKU, mystery clue, nested `loadout`.
- Snapshot already calls `sanitizeHangar` (`save.js` 952). Restore omit hangar → delete, then sanitize (`save.js` 1168, 1216). Keep that.

### 1.2 Shared row shape (allowlist via `sanitizeHangarRecord`)

A seed **is** an unmounted living hangar row:

| Field | Gift | Pirate |
|---|---|---|
| `id` | **`hull_seed_gift`** exactly | `nextHullId` stem `seed_pirate` → `hull_seed_pirate_1`… Never `hull_seed_gift` |
| `hullKind` | `'living'` | `'living'` |
| `faction` | `'beautiful'` | `'beautiful'` |
| `classKey` | `'light'` | `'light'` |
| `grafted` | **absent** | **absent** |
| Price / debit | **0** | **0** (not a sale) |
| Remount | **No** | **No** |

Heal through `sanitizeHangarRecord` (`hangar.js` 211–241). If the healer returns null, fail closed. Living rows drop `grafted` (`hangar.js` 93–98).

Stock vitals: same as `buildStockRow` (`shipyard.js` 141–174) — empty cargo, scanner 0, no launcher/turret unless class seats them (`light` seats none).

### 1.3 Once vs many

- Gift: **once**. If any hull `id === 'hull_seed_gift'`, skip. Do not rename. Do not mint `hull_seed_gift_2`.
- Pirate: **not** once-by-id. Rare repeats may add another `hull_seed_pirate_N` until cap. Cap 8 still fail-closes.

### 1.4 Cap 8 fail-closed

Helper (later, prefer `hangar.js`):

1. `sanitizeHangar(ctx)`.
2. If `!canAcceptPurchase(ctx)` → `{ ok: false, reason: 'full' }`. **Stop.** Do not `capHulls`. Do not delete a row.
3. `parkMounted`; push sanitized row; **restore `mountedId`** (yard buy pattern `shipyard.js` 212–215).
4. `requestAutosave(ctx)`.

`reason: 'full'` copy: `'The hangar is full.'` (live buy line).

### 1.5 Prototype / ids

- `hull_seed_gift` matches `SAFE_ID` and is not in `RESERVED_IDS`. Keep it literal. Do not take gift id from player text.
- Pirate ids from `nextHullId` (`shipyard.js` 124–138) after a `^[a-z0-9_]+$` stem. Null id → fail closed.
- Never `for…in` merge a raw blob onto a hangar row.

---

## 2. Sworn gift

### 2.1 Gate (all must hold)

| Gate | Rule |
|---|---|
| Docked | `ctx.flags.docked` |
| Banner | `dockFactionOf(ctx) === 'beautiful'` |
| Rank | `rankFor(dockReputation(ctx, 'beautiful')).min >= 50` **or** equivalent `rep >= 50` using live `RANK_LADDER` Sworn (`state.js` 672–673). Do not invent a rung above Sworn. |
| Hostile | `rep < 0` → no gift (`No gift.`). |
| Once | `hull_seed_gift` not already in `hulls` |
| Cap | `canAcceptPurchase` |
| Graft | Gift is **not** a graft. Do not call `graftMounted`. |

UI hide is not authorization. The grant helper re-checks every gate.

### 2.2 Desk

- Surface: **People** desk at a Beautiful dock (`station.js` `renderPeople`).
- Not a new `DOCK_KEY_SERVICES` key. Digit 0 stays shipyard.
- Two-step confirm like yard papers (`shipyard-desk.js` 196–211): arm pending → **Confirm papers** → grant.
- Esc / KeyB cancel: no write.
- Price 0. Do not debit credits. Do not show a fake UU.
- Copy (static; `textContent`):
  - Arm: `The berth answers. Confirm the sworn gift.`
  - Success: `A living seed rests in the hangar.`
  - Full: `The hangar is full.`
  - Already: `You already carry that gift.`
  - Rank / banner / hostile: `No gift.`
- Digit: optional later **People level-2 Digit 1** to arm/confirm **only while the gift row is visible**. Must not change dock level-1 Digit 0.
- Reduced motion: keep the same words. No extra animation required.

### 2.3 After grant

Mounted hull unchanged. HUD family unchanged until the player Hangar-mounts the new row. Then living → `bio` via read of `hullKind`. HUD still does not write `hullKind`.

---

## 3. Pirate seed

### 3.1 Persist

Same living `light` Beautiful row as §1.2. Distinct ids. Not cargo. Not a pod.

### 3.2 Drop — fail closed (no invented percent)

**Trigger (all must hold):**

1. Victim `record.faction` or `state.faction` === `'beautiful'`.
2. `lastAttackerOf(live) === 'player'` (`npc.js` 1045–1051). NPC-NPC → no grant.
3. Path is player **piracy**: destroy (`handleDestroyed` / `spillShipCargo`) **or** player-forced jettison/capitulate dump of that Beautiful hull.
4. Not Unknowables. Not a graft flag. Victim is a Beautiful **ship**, not a station.

**Fail closed (no grant) when:**

- Hangar missing / not array / `!canAcceptPurchase` (cap 8).
- Sanitize returns null.
- Id collides with `hull_seed_gift` or reserved proto ids.
- Rate helper missing, non-finite, `<= 0`, or `> 1`.
- Owner line still **defer** with no shippable rate — **do not invent one**. Skip the roll.
- `Math.random` (match live data-drop style) fails the owner rate **after** that rate exists as a copied named constant.

**Forbidden:**

- Invent a drop percent or UU in this contract or the brief.
- Copy `DATA_DROP_RATE` 0.20.
- Spawn `livingRock` / a new commodity as a stand-in.
- Evict a hangar row.
- Remount.
- Write `player.hullKind`.
- New standing delta.

**Owner-open number:** pirate drop rate. Pointer: `docs/OwnerDecisionsWave82.md` section “BIO graft / gift / pirate / frigate” pirate-seed row. Later impl may copy **that** owner rate into a named constant on `hangar.js` or a BIO-obtain helper (`PIRATE_SEED_DROP_RATE`). It must not pick a different number. This file does **not** re-author the digits.

### 3.3 Player-facing (no new chrome)

- Success: `commLine` `{ text, from }` primitives. Copy: `A living seed is yours. It waits in the hangar.`
- Full: `commLine` `The hangar is full.` (same words as buy). No cargo consolation.
- Missed roll / ineligible: **silent**. No tease.
- `from` allowlist: `'echo'` or omit. Do not put NPC names through HTML.

Do not add a frozen event if `commLine` can carry the line (`ctx.js` 219). If a later owner proves it cannot, list one freeze-comment line — payload primitives only. Never `{ ...hangar }`.

---

## 4. Commodity (deferred)

Live SKU: **none**. Keep deferred. Owner-open. Pointer: `docs/OwnerDecisionsWave82.md` (do not invent UU). Expensive obtain that already ships is Beautiful yard buy (`YARD_LIST_UU`).

---

## 5. Yards already in (do not re-solve)

Beautiful `LIVING_STOCK` light/cutter/heavy. Unknowables living light. Buy adds a row; no remount-on-buy. Hostile `rep < 0` is no sale. Gift is **not** a fourth yard SKU.

---

## 6. `hullKind` / HUD / `isBeautiful`

**Writers:** hangar sanitize / load / switch / yard buy / save / Unknowables force / **BIO-01 grant helper** (sets the **row** `hullKind: 'living'` only; does not assign HUD).

**Never write `hullKind`:** `hud.js`, `bio.js`, `origins.js`, `organic.js`, gift **UI**, pirate toast.

HUD family (`hud.js` 72–80): built → mech; living → bio. Grafted built stays mech. Gift/pirate do not create `grafted`.

`isBeautiful` (`organic.js` 67–69) is faction art. Starter independent living hull must still receive gift/pirate rows.

---

## 7. Security

1. World strings: `textContent` / `h()` / `el()`. No `innerHTML`.
2. Ids: `isSafeHullId`. Gift id is a source literal, not save-attacker-controlled except through the same healer.
3. Emit: fresh literals. Do not smash `type`.
4. Rank/cap checks in the **helper**, not only CSS/hide.
5. No new `localStorage` key.
6. No path join / remote URL / `eval` for obtain.
7. Prototype keys never become hull ids or reputation keys.
8. Do not invent economy numbers.

---

## 8. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| Hangar rows (gift/pirate) | later `hangar.js` grant helper | desk, save, switchTo |
| `player.hullKind` | hangar switch / Unknowables / save — **not** gift UI | HUD `hudFamily` |
| People gift pending | `station.js` ui bag (session) | People render |
| Pirate roll | later npc/hangar helper after live spill | hangar |
| `RANK_LADDER` | **none this serial** | `rankFor` |
| `COMMODITIES` | **none** | — |
| `state.js` | dedicated PR **only** if owner opens seed SKU | everyone |

`ctx.js` bag: no new persist field. Optional freeze-comment only if a new event is proven necessary.

---

## 9. PR plan (serial, later wave)

Named PRs only. **Do not land them in Wave 86.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 persist helper** | `grantLivingSeedRow(ctx, spec)` + pins (cap 8, restore mountedId, sanitize, gift id reserved). Probe: helper refuse full / proto / bad kind | Desk chrome, pirate roll, `state.js` |
| **PR2 Sworn gift desk** | Beautiful People two-step confirm; gates §2; copy §2.2; autosave | Pirate, commodity, Digit 0 steal, grafts |
| **PR3 pirate fail-closed** | Hook after player Beautiful wreck/jettison; copy §3.3; rate **only** if copied from Wave 82 owner line; else skip roll | Invented %, cargo SKU, standing delta, remount |
| **PR4 boot pins** | Gift once; pirate silent miss; HUD does not write kind; Digit 0 shipyard; no `innerHTML` | Wishlist / PROGRESS.md; WAVE4/26/35 “fixes” |
| **PR5 `state.js` (optional, skip default)** | **Only** if owner opens a seed commodity SKU | Drive-by `COMMODITIES.seed` |

Prefer authored pirate rate constant on `hangar.js` or `shipyard.js` next to `GRAFT_LIST_UU` **after** owner un-defer. Not `state.js`.

---

## 10. Closed / non-goals

- BIO-02 class evolution / growth-center Digit.
- BIO-03 bake / new GLBs.
- BIO-04 psionics.
- Unknowables dock (Wave 42).
- Power ledger / lock box.
- Police leave.
- NAV plot.
- Living frigate/ace/freighter **buy**.
- Remount-on-buy / remount-on-gift.
- HUD write of `hullKind`.
- Wave 72 graft reopen.
- New rank above Sworn.
- Invented drop % / UU / standing delta.
- `innerHTML`.
- New `localStorage` key.
- Sibling-doc edits listed in the header.

---

## 11. Boot / known FAILs

Later impl may add BIO-01 pins to `scripts/boot-test.mjs`. Do **not** “fix” WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
