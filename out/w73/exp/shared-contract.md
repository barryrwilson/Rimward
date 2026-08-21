# EXP exploration / data-trade shared contract

**Wave:** 73. Design only. No EXP feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/ExpDataTradeDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Pod02TraffickingDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/MsnMissionsDesign.md`, `docs/Tgt05ReticleLockDesign.md`, `docs/RepStandingDesign.md`, or sibling `out/w73/{tgt05,rep}` files.  
**Locked sources:** wishlist Initiative EXP (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~806–844); live inventory `out/w73/exp/current-exp-inventory.md`; `src/game/mystery.js`; `src/systems/landmarks.js`; `src/game/save.js`; `src/game/pods.js`; `src/systems/npc.js`; `src/game/world.js`; `src/game/state.js` (READ-ONLY); `src/game/market.js`; `src/systems/station.js`; `src/game/contacts.js`; `src/core/ctx.js`; `src/game/hangar.js`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 73 is markdown only. Implementation is a later **serial** wave. Do not schedule or land EXP PRs here.
2. Do **not** replace mystery/landmarks/Echoes. EXP-01 may **read** clue / landmark / conversation as knowledge. First cargo slice is **EXP-02 items**.
3. Data items persist as **hangar-travel cargo rows** on the mounted hull (SHP: cargo travels with hull). No new `WORLD_FIELDS` key. No nested `loadout`. No `world.data` map.
4. Autosave stays `rimward-save-v1`. No new `localStorage` key.
5. Provenance follows POD: extra **allowlisted** fields on the row. Do **not** reuse survivor keys (`faction` as victim, `playerKill` / `other`, `name`). Reserved ids fail closed.
6. Market vs desk: **dedicated desk**. Not `COMMODITY_KEYS`. Not `tryTrade`. Not `priceOf` for payout. Not a new `DOCK_KEY_SERVICES` entry. Not People Digit 7 (POD).
7. Unknowables have **no live system or dock** (inventory §5; Wave 42 content decision). First impl **cannot** “buy at Unknowables dock.” Do not invent a system. Assembly docks **`as_census`** and **`as_archive`** are the only live home desks.
8. Two-way trade: legal buy-own / high buy-other **only where a live dock exists**. First impl: Assembly desk only. Unknowables desk **deferred**. If drop rate is unset, wreck spawn is **skipped**.
9. EXP-03 launder: illegal in **origin faction** until a live **fixer** contact confirms. Price **proposed, needs owner**. Do not invent contact ids. Live fixers: Veridian `Lias Corrow`, Redmarch `Six-Finger Brack`. If UU unset, **do not debit and do not flip `source`**.
10. Drop rates **proposed, needs owner**. Do not ship a percent. Freeze persist shape + wreck path (data **pod**, not aftermath mesh, not survivor pod).
11. World strings: `textContent` / existing `h()` / `commLine`. No `innerHTML`. Display names are authored constants, never save-authored HTML.
12. Commodity keys allowlisted. Never `__proto__` / `RESERVED_IDS`. Ordinary rows after PR1: `COMMODITIES` or survivor or data keys only.
13. `state.js` is READ-ONLY. Do not add `COMMODITIES.dataCrystal`. Named later serial data owner only if someone reopens market SKUs (**forbidden** for first impl).
14. No new frozen `ctx.js` event unless an existing emit cannot carry the line. Prefer `commLine` / desk `ui.notice`.
15. Do not reopen POD, BIO grafts, SHP yards, HUD-02, AST rock ids, MSN mining slots.
16. MSN exploration family is **later** and depends on this persist shape. Do not design mission numbers.
17. TGT-05 may later lock landmarks/anomalies. EXP does not change targeting. Do not steal `ctx.targets`.
18. `priceOf` / `cargoValue` for data keys fail closed at **0**. Desk uses an authored table (owner) or does not pay.

---

## 1. Persist and sanitize

### 1.1 Where it lives

| Store | Rule |
|---|---|
| Mounted hold | `ctx.cargo` array |
| Parked hulls | `hangar.hulls[].cargo` via existing `sanitizeCargoList` |
| World | **No** extra field |
| Snapshot | Existing `cargo:` plus hangar rows already on `WORLD_FIELDS` `'hangar'` |

Park/load already copies cargo (`hangar.js` 433–436, 593). EXP adds **row shape**, not a new packer.

### 1.2 Commodity allowlist (PR1)

`sanitizeCargoRow` (`save.js` 452) becomes:

1. Reject non-objects, arrays, empty/`commodity` longer than `COMMODITY_MAX` (64).
2. If `RESERVED_IDS.has(commodity)` or `commodity === '__proto__'` → **drop**.
3. If `commodity === 'survivor'` → existing POD path. Unchanged.
4. If `commodity` is a **data key** (`dataCrystal` \| `dataCube`) → §1.3.
5. Else if `Object.hasOwn(COMMODITIES, commodity)` → `{ commodity, units }` with `sanitizeUnits`. Units ≤ 0 → drop.
6. Else → **drop**.

This is a fail-closed tighten of today’s “any string” ordinary path. Honest saves only hold `COMMODITIES` + `survivor`.

### 1.3 Data row shape

```
{
  commodity: 'dataCrystal' | 'dataCube',
  units: integer ≥ 1 (sanitizeUnits, cap same as ordinary),
  source: 'legal' | 'captured' | 'stolen',
  originFaction: 'unknowables' | 'assembly'
}
```

| Field | Rule |
|---|---|
| `commodity` | Exact tokens above. **Proposed names**; they are **not** `COMMODITIES` keys |
| `units` | Finite integer ≥ 1. Else drop |
| `source` | Exact three tokens. Else drop the **row** (do not default to `legal`) |
| `originFaction` | Exact `unknowables` or `assembly`. `Object.hasOwn(FACTIONS, …)`. Reserved ids drop the row |
| Extra keys | **Omit.** No `faction`, no `name`, no `playerKill`, no `price`, no `legal` boolean |
| `stolen` | Allowlisted for later theft. **No spawn path** in first impl |

**Stacking:** same `commodity` + `source` + `originFaction` only (pods `cargoRowsMatch` + desk lots).

**Fail closed:** missing `source` or `originFaction` → drop. Do not heal `source: 'legal'` on restore (that would launder via save).

### 1.4 Display names (authored, not persist)

| Key | Label |
|---|---|
| `dataCrystal` | Data crystal |
| `dataCube` | Data cube |

Never persist a player/NPC `name` on a data row in the first impl (XSS). UI prints the table via `textContent`.

### 1.5 Helpers (later impl names, not shipped here)

Prefer a tiny `src/game/data-trade.js` (POD `trafficking.js` precedent) over stuffing `station.js`. Feature workers do not edit `state.js`.

Must not use `addCargo` / `removeCargo` / `holdUnits` for mixed lots. Those ignore provenance (`station.js` 939–1416).

---

## 2. Desk vs market

### 2.1 Freeze: dedicated Archive desk

| May | Must not |
|---|---|
| Additive block on the **Market pane** after the `COMMODITY_KEYS` table | New Digit / `DOCK_KEY_SERVICES` key |
| Gate `ui.level === 2 && ui.service === 'market'` | `tryTrade`, `isMarketCommodity`, `COMMODITY_KEYS.forEach` |
| Two-step confirm (arm pending → Confirm) | One-click Digit Q/W/A/S debit for data |
| Assembly docks: `currentDef.faction === 'assembly'` **and** `Object.hasOwn(DETAIL_STATIONS, 'assembly')` | Placeholder station (`buildStationMesh` fallback), Gilded People, Bar Mara flavor, Shipyard Digit 0 |
| Authored UU table (owner) | `priceOf(ctx, 'dataCrystal')` or stuffed `world.prices` |

Session field `ui.dataPending` is RAM only. Clear on undock / Back / vanished lot. Same family as `ui.trafficPending` and yard papers.

### 2.2 Who buys / sells (live docks)

**Assembly (`as_census`, `as_archive`):**

| Verb | Item | `source` gate | Rate |
|---|---|---|---|
| Buy (player pays) | `dataCube` | desk writes `legal`, `originFaction: 'assembly'` | **own legal** — proposed, needs owner |
| Sell (desk pays) | `dataCube` | `originFaction === 'assembly'` **and** `source === 'legal'` | **own legal** — proposed |
| Sell | `dataCrystal` | `originFaction === 'unknowables'` (any allowed source) | **rival high** — proposed |
| Sell | `dataCube` captured/stolen | **Refuse** at Assembly (illegal in origin) until laundered | — |
| Buy | `dataCrystal` | **Refuse** (Unknowables sell their own; no Assembly SKU for crystals) | — |

**Unknowables dock:** **deferred.** Mirror of the table with cube/crystal swapped, only after a content owner lands a live Unknowables system **and** `DETAIL_STATIONS.unknowables` (or an explicit grown path). First impl does **not** open the desk on the placeholder fallback (`station.js` 234–238). Independent/Hollow/Beautiful never host this desk.

Hostile standing: follow live yard `rep < 0` no-sale **if** the serial owner pins it. Default: desk still lists; **proposed**. Do not invent a rank gate here.

### 2.3 `priceOf` / `cargoValue` fail closed

Later impl **must** pin:

```
priceOf: if isDataCommodity(key) return 0
cargoValue: data rows contribute 0
```

Same class as `priceOf('survivor')` (`station.js` 1417–1418). Pirate tribute must not bank stuffed crystal prices.

Desk payouts read an authored constant map in `data-trade.js` (or equivalent), never `ctx.world.prices`.

Until the owner sets UU, PR3 **renders the desk but does not debit or credit**. Persist and scoop still work.

### 2.4 Confirm copy (tone)

Voice matches station `textContent`: short, no slang joke, no comedy debug.

Allowed nouns: archive, filing, crystal, cube, hold, UU, captured, legal.

Forbidden: slave (POD), innerHTML, raw commodity id as the only label (print the authored name).

---

## 3. Spawn / wreck path

### 3.1 Path freeze

On **jettison** and **destroy** of a live ship whose `record.faction` (else `state.faction`) is `assembly` or `unknowables`:

- Keep existing `spillShipCargo` for bulk (strips extras — do not put data in `traderCargo`).
- Additionally call a **`spawnDataPod`** helper (pods.js sibling of `spawnSurvivorPod`) **if and only if** the owner has set a drop rate.
- Contents: one data row, `units: 1` unless owner says otherwise.
- `source: 'captured'`.
- Assembly hull → `dataCube` + `originFaction: 'assembly'`.
- Unknowables hull → `dataCrystal` + `originFaction: 'unknowables'`.
- Tint: authored hex **proposed, needs owner**. Default until then: untinted `spawnPod` steel (valid 4-arg call).
- **Not** `spawnSurvivorPod`. **Not** aftermath wreck mesh (`world.js` 1314). **Not** landmark `kind: 'wreck'`.

`spillShipCargo` must **skip** data keys if they ever sit on an NPC hold (flattening would strip provenance). First impl does not put data on NPC manifests.

Empty bulk hold still yields **no** fake provisions pods. Data spawn is a separate roll, not fake bulk.

### 3.2 Drop rate

**Proposed, needs owner.** Do not ship `%`.

Default until set: **PR2 skips spawn.** Honest play then has legal cubes only after PR3 Assembly buy (if UU set) or not at all.

Unknowable crystals still need either (a) someone spawning Unknowable ships, or (b) an Unknowables dock. EXP does not add Unknowable traffic.

### 3.3 Scoop

Extend `isDataCargo` / `copyCargoEntry` / `cargoRowsMatch` so scoop keeps `source` + `originFaction`. Proto / reserved origin drops the incoming row. Merge only on exact triple.

Capacity: data `units` count toward `ctx.cargoCapacity` like any cargo.

---

## 4. EXP-01 knowledge (non-cargo)

| Source | First impl |
|---|---|
| Clues / landmarks | **Read only.** Do not push cargo on `clueFound` / `landmarkFound` |
| Conversations | **Read only.** Bar / `rumorFor` / keeper ledger stay |
| Intercepted signals | **Absent.** Do not invent a signal item |
| Distant systems | Travel + existing mystery. No new chart marks (HUD-02 closed) |

A later EXP-01 serial may surface knowledge in UI. It must not rewrite `mystery.found` grammar or consume clue ids into the hold.

---

## 5. EXP-03 provenance and laundering

### 5.1 Illegal where

A row is **illegal in origin** when `source !== 'legal'` and the dock faction equals `originFaction`.

| Dock | Illegal to sell |
|---|---|
| Assembly | captured/stolen `dataCube` (`originFaction: 'assembly'`) |
| Unknowables (later) | captured/stolen `dataCrystal` |
| Anywhere else | Origin rule does not block **rival** sales (Assembly **wants** captured crystals) |

Legal buy always writes `source: 'legal'`.

### 5.2 Launder

| Gate | Freeze |
|---|---|
| Who | `contact.role === 'fixer'` at that dock’s roster (live: veridian, redmarch) |
| Where | People Digit 7, **after** rescue; **not** Gilded Offer block; not Freehold fence locker |
| What | One lot: flip `source` to `'legal'`; keep `commodity`, `originFaction`, `units` |
| Price | **Proposed, needs owner** |
| Confirm | Two-step. Esc cancels. Recompute lot at confirm |
| UU unset | **No debit, no flip** |
| Fence | Does **not** launder data (restrictedComponents locker only) |
| New contacts | **Forbidden** |

Do not invent `contact-assembly-fixer`. Assembly dockmasters stay dockmasters.

### 5.3 Tamper

Save-editor `source: 'legal'` is local single-player. Sanitize still requires the allowlist. Do not add a signature/HMAC. Do not write a parallel `world.laundered` list.

---

## 6. Events, XSS, proto

- No new frozen event. Desk success → `ui.notice` + optional `commLine`. Scoop already emits `podCollected`.
- Milestone: **none** required. If a later owner wants one, reuse `world.milestones` + existing `milestone` emit with a `SAFE_ID` token (not this first impl).
- `RESERVED_IDS` on commodity, originFaction, any id used as an object key. Walk cargo with index `for`, never `for…in`.
- Never `markets[system][dataKey] =`. Never `prices[dataKey] =`.
- Reputation: EXP first impl **does not** write standing. Do not copy POD victim-rep. Do not `for…in` `world.reputation`.

---

## 7. Closed / deferred

| Topic | Freeze |
|---|---|
| POD | Closed. Do not share `applySurvivorSale` or survivor `source` |
| BIO | Closed. Data is not a graft or seed |
| SHP yards / hangar API | Closed. Reuse sanitize/park/load |
| HUD-02 / `ctx.targets` | Closed |
| AST | Closed |
| MSN mining | Closed |
| MSN exploration jobs | Later. Depend on §1.3 row shape + desk lots. No pay numbers here |
| TGT-05 landmark lock | Later targeting. EXP does not add target ids |
| REP | Later. No data-standing table here |
| `state.js` COMMODITIES | READ-ONLY |
| Unknowables home system | Content owner, Wave 42. Not EXP |

---

## 8. Serial PR plan (later — do not implement)

| PR | Scope |
|---|---|
| **PR1** | `sanitizeCargoRow` allowlist + data shape; `copyCargoEntry` / match; `priceOf`/`cargoValue` 0 for data keys; hangar already calls sanitize |
| **PR2** | `spawnDataPod` on destroy/jettison **if owner drop rate exists**; else **skip spawn** |
| **PR3** | Archive desk on Assembly Market pane; buy/sell per §2.2; no debit until UU owner |
| **PR4** | Illegal refuse + fixer launder **if UU owner**; else skip flip |
| **PR5** | Boot pins: persist roundtrip, proto drop, Assembly desk gate (`DETAIL_STATIONS.assembly`), Unknowables dock absent, placeholder faction must **not** open the desk, `priceOf` 0, scoop keeps provenance |

Order is mandatory: sanitize before spawn before pay.

---

## 9. Owner questions (defaults)

| Question | Default until owner answers |
|---|---|
| Drop % | Skip spawn (PR2 no-op) |
| Legal / rival UU | Desk visible; no debit/credit |
| Launder UU | No debit; no `source` flip |
| Unknowables dock | Wait. Do not generate a system |
| Hostile-rep no-sale on Archive desk | Unspecified; desk lists |
| Data pod tint | Untinted steel |
| Units per drop | 1 |

Do not invent a new system, contact, `COMMODITIES` row, Digit, or frozen event to dodge these.
