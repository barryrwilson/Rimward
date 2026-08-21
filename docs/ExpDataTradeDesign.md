# RIMWARD EXP exploration, information, and data trade

| Field | Value |
|---|---|
| **Title** | RIMWARD EXP exploration, information, and data trade |
| **Author** | Wave 73 EXP integrator |
| **Date** | 2026-08-20 |
| **Status** | Implemented. Wave 73 was markdown. Wave 74 shipped persist + Assembly desk (no UU). Wave 82 ships drop 0.20, own 400, rival 900, launder 250. |
| **Wave** | 73 — design. 74 — first impl. |
| **Owner request** | EXP design brief. Do not ship data cargo, desks, or `src/` in this wave. |
| **Merge law** | [`out/w73/exp/shared-contract.md`](../out/w73/exp/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w73/exp/current-exp-inventory.md`](../out/w73/exp/current-exp-inventory.md) |
| Merge law | [`out/w73/exp/shared-contract.md`](../out/w73/exp/shared-contract.md) |
| Security review | [`out/w73/exp/security-review.md`](../out/w73/exp/security-review.md) |
| Design-doc review | [`out/w73/exp/code-review.md`](../out/w73/exp/code-review.md) |

---

## Overview

Exploration today yields places and voiced lines: mystery clues, landmarks, keeper ledgers, bar rumors. The hold still carries bulk, ore, and survivors. Wishlist EXP wants information as cargo. Unknowables and Assembly pay well for each other’s data. Legal purchase differs from captured salvage. Captured lots can be laundered.

This brief is the integrator document for a **later** implementation wave. It freezes persist (hangar cargo rows, not a new world key), dedicated Archive desk vs market SKU, live Assembly docks vs missing Unknowables station, provenance fields that are not survivor keys, wreck-pod spawn shape without a drop percent, fixer launder without new contact ids, and a serial PR plan. Wave 73 lands this markdown only.

Mystery and landmarks stay. HUD-02, SHP yards, POD People sale, BIO grafts, AST rock ids, and MSN mining slots stay closed. `src/game/state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “EXP today”: [`out/w73/exp/current-exp-inventory.md`](../out/w73/exp/current-exp-inventory.md). Code wins over stale comments.

| Surface | Today | Cite |
|---|---|---|
| Clues / landmarks | Proximity 35 u / 100 u; permanent ids on `world.mystery` | `mystery.js` 37–38, 107–128 |
| Persist mystery | `WORLD_FIELDS` `'mystery'` | `save.js` 78 |
| Ordinary cargo | `{ commodity, units }`; **not** `COMMODITIES`-allowlisted | `save.js` 451–474 |
| Survivor cargo | `{ commodity:'survivor', units, faction, source, name? }` | `pods.js` 19–21 |
| Scoop extras | Survivor only; generic `copyCargoEntry` drops other fields | `pods.js` 489–497 |
| Wreck loot | `spillShipCargo` flattens to `{commodity, units}` | `npc.js` 1344–1357 |
| Aftermath | Visual mesh; no pod | `world.js` 1314–1324 |
| Market | `COMMODITY_KEYS` every dock; `priceOf('survivor')` 0 | `station.js` 2041, 1417–1421 |
| Data SKUs | Absent from `COMMODITIES` | `state.js` 308–322 |
| Assembly docks | `as_census`, `as_archive` + `DETAIL_STATIONS.assembly` | `galaxy.generated.js` 6769–6854; `station.js` 487 |
| Unknowables dock | **No system.** Wave 42 content hole | `PROGRESS.md` 3350–3355 |
| Unknowables crew | Survivor spawn skip | `npc.js` 1322 |
| Fixers | Veridian Lias Corrow; Redmarch Six-Finger Brack | `contacts.js` 91–109 |
| Cargo with hull | Hangar row `cargo` | `hangar.js` 233, 433–436 |

### Pain points

- Wishlist EXP-01: knowledge is voiced and flagged, not cargo.
- Wishlist EXP-02: no crystals, no cubes, no two-way desk. Market cannot do faction-specific SKUs without listing them at every dock.
- Wishlist EXP-02 “their stations”: Unknowables have no live dock. A worker who authored buy-at-Unknowables would ship a dead verb.
- Wishlist EXP-03: only survivor provenance exists, and those keys must not be reused.
- `priceOf` / `cargoValue` would honor a stuffed `prices.dataCrystal`.
- `sanitizeCargoRow` keeps unknown commodity strings, including reserved ids.

### Why now (design) / why not now (code)

The owner asked for the EXP brief after POD provenance, SHP cargo-with-hull, and MSN mining. Inventory and merge law exist. Implementation waits so sanitize, desk, and spawn land against a frozen contract instead of a drive-by `COMMODITIES` row.

---

## Goals & Non-Goals

### Goals

1. Document live mystery, cargo, wrecks, and which docks can actually trade data **today**.
2. Freeze EXP-02 persist: data crystals/cubes as hangar cargo rows with allowlisted provenance.
3. Freeze **dedicated Archive desk** (not market SKU, not People, not a new Digit).
4. Freeze two-way trade only on **live** docks: Assembly first; Unknowables deferred.
5. Freeze EXP-03 illegal-in-origin + fixer launder without inventing contacts or UU.
6. Freeze wreck path (`spawnDataPod`) without shipping a drop percent.
7. Name MSN exploration as a later consumer of this row shape. Do not number those jobs.
8. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No impl in Wave 73. No `src/` edits.
- No Echoes rewrite. No clue→cargo conversion.
- No new `WORLD_FIELDS`. No new `localStorage` key.
- No `COMMODITIES` data rows. No `tryTrade` of crystals.
- No new `DOCK_KEY_SERVICES` key. No Digit 0 work.
- No Unknowables home system. No invented contact ids.
- No drop %, no desk UU, no launder UU invented here.
- No new frozen event.
- No POD/BIO/SHP/HUD-02/AST/MSN-mining reopen.
- No `ctx.targets` changes (TGT-05).
- Do not edit the wishlist or `PROGRESS.md`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Hangar / `ctx.cargo` rows | SHP cargo-with-hull. Contract §0.3 |
| Replace mystery? | **No.** Read-only for EXP-01 | Contract §0.2 |
| Market SKU? | **No.** Dedicated Archive desk on Market pane | Contract §0.6, §2 |
| People Digit 7? | **No** for data (POD lives there) | Contract §0.6 |
| Unknowables buy? | **Deferred** until a live dock | Inventory §5; Wave 42 |
| Assembly desk? | `as_census` / `as_archive` only | Live `DETAIL_STATIONS.assembly` |
| Survivor field reuse? | **No.** `originFaction` + `legal\|captured\|stolen` | Contract §0.5, §1.3 |
| Drop %? | Unset → skip spawn | Contract §3.2 |
| Launder who? | Existing `role === 'fixer'` | `contacts.js` 91–109 |
| Launder UU? | Unset → no flip | Contract §5.2 |
| `priceOf` data? | **0** | Contract §0.18, §2.3 |
| New event? | **No** | Contract §0.14 |
| MSN exploration? | Later; depends on §1.3 | Contract §0.16 |

### 2. Player outcome

Exploration yields **information cargo**, not only places. The player scoops or buys crystals and cubes. Assembly files its own cubes at Census and Archive. It pays highly for Unknowable crystals. Captured Assembly cubes will not file at Assembly until a fixer launders them. Unknowable home trade waits on content.

### 3. EXP-01 — discoverable knowledge

Keep `mystery.js` / `landmarks.js`. First cargo slice does not spawn hold rows from `clueFound` or `landmarkFound`.

Knowledge sources the later UI may **read**:

- `mystery.found` / `visited` (and existing convergence flags);
- `commLine` already voiced on discovery;
- bar and People conversation (`rumorFor`, keeper ledger).

Intercepted signals are **not live**. Do not invent them in the first impl.

MSN-02 “exploration and information recovery” is a **later job family**. It should ask for data rows already in the hold (this persist shape), not invent a parallel `world.intel` array.

### 4. EXP-02 — data crystals and data cubes

#### 4.1 Items

Two commodity tokens, **not** in `COMMODITIES`:

| Token | Label | Origin faction |
|---|---|---|
| `dataCrystal` | Data crystal | `unknowables` |
| `dataCube` | Data cube | `assembly` |

Units count toward hold capacity. Names are authored constants. No persist `name`.

#### 4.2 How they enter the hold

1. **Legal buy** at a live origin desk (Assembly cubes in first impl), `source: 'legal'`.
2. **Captured pod** from destroy/jettison of a matching-faction hull, `source: 'captured'`, **only if** the owner sets a drop rate.
3. Save tamper that survives sanitize (allowlisted shape only).

No `traderCargo` injection. No landmark wreck scoop. No survivor pod.

#### 4.3 Two-way trade (honest)

Wishlist: each faction sells its own legally and pays highly for the other.

Live today: **Assembly docks yes; Unknowables docks no.**

First impl therefore:

- Assembly buys cubes (legal) and sells legal cubes at **own** rate.
- Assembly buys crystals (rival, high) when the player has them.
- Unknowable legal cube buy / crystal sale: **deferred**.
- Without a drop rate **and** without Unknowable spawns, crystals never appear in honest play. The contract states that gap; it does not fake a dock.

### 5. EXP-03 — provenance and laundering

| `source` | Meaning |
|---|---|
| `legal` | Bought at origin desk, or laundered |
| `captured` | Data pod from destroy/jettison |
| `stolen` | Reserved; no first-impl spawn |

Illegal **in origin faction** when `source !== 'legal'`. Assembly will not buy captured cubes. Assembly **will** buy captured crystals (rival intelligence).

Launder: existing fixer on People at Veridian or Redmarch. Two-step confirm. Price proposed. UU unset → no flip. Fence locker stays restricted-components only.

Do not reuse `playerKill` / `other`. Those mean “who killed the crew.”

### 6. Dock UI

Shipped (`station.js` 132):

```js
export const DOCK_KEY_SERVICES = Object.freeze([
  'market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard',
]);
```

Later implementation: additive `renderArchiveDesk` from `renderMarket` **after** the commodity table. Gate:

- `ui.level === 2 && ui.service === 'market'`
- `currentDef.faction === 'assembly'` **and** `Object.hasOwn(DETAIL_STATIONS, 'assembly')`
- Unknowables later: same pattern only after a real Unknowables station module exists — **never** the placeholder fallback

Q/W/A/S remain `COMMODITY_KEYS` only. Confirm is a button pair, yard-papers family. Digits do not debit data.

People Digit 7 stays rescue + Gilded Offer + contacts. Launder (PR4) is a **fixer** card action there, not the Gilded transfer helper.

### 7. Persist, XSS, proto

PR1 extends `sanitizeCargoRow` / `sanitizeCargoList` (already used by snapshot and hangar). Walk with index `for`. Drop reserved commodity keys. Data rows require `source` + `originFaction` or they vanish (fail closed — no heal-to-legal).

UI: `h(..., authoredLabel)` `textContent`. No `innerHTML`. No `row.name`.

`priceOf` and `cargoValue` treat data keys as 0 so stuffed `world.prices` cannot inflate tribute.

No new frozen event.

### 8. Serial PR plan (later)

See contract §8.

| PR | Ships |
|---|---|
| PR1 | Allowlist sanitize + scoop copy + `priceOf`/`cargoValue` 0 |
| PR2 | `spawnDataPod` **or skip** if no drop-rate owner |
| PR3 | Assembly Archive desk; no UU → no debit |
| PR4 | Illegal refuse + fixer launder; no UU → no flip |
| PR5 | Boot pins |

Do not implement in Wave 73.

### 9. Coupling (file-disjoint from TGT-05 / REP)

| Sibling | Boundary |
|---|---|
| TGT-05 | May lock landmarks later. EXP does not write `ctx.targets` or reticle code |
| REP | No data-standing table in this brief. Desk may later read live `rep < 0` if owner pins it |
| MSN | Exploration jobs consume §1.3 rows later |
| POD | Survivor path untouched |
| BIO / SHP | Hangar cargo already travels; do not add `grafted` or yard SKUs |

---

## Testing / verification (later impl)

Wave 73: markdown only. Later serial:

- Restore stuffed `__proto__` / missing `source` data rows → dropped.
- Park/remount preserves data lots on the hull.
- Assembly Market shows Archive block; Freehold Market does not.
- `priceOf('dataCube') === 0` on a stuffed prices table.
- Scoop of a data pod keeps `captured` + origin.
- Unknowables dock path untested because it does not exist — pin the absence.

---

## Migration / compatibility

Old saves: ordinary `COMMODITIES` + survivors unchanged. Unknown commodity strings **start dropping** in PR1 (fail closed). No mystery migration. No new save key.

---

## Open questions (owner)

**Closed Wave 82** — [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

| Item | Decision |
|---|---|
| Drop % | `DATA_DROP_RATE = 0.20` |
| Own UU | cube **400** / crystal **400** |
| Rival UU | **900** |
| Launder UU | **250** per lot |
| Unknowables system | Wait (Wave 42 content) |
| Archive hostile-rep gate | `standingRead(assembly) < 0` → no sale |
| Data tint | Untinted steel |

Do not invent a system, SKU, Digit, or contact. Unknowables docks stay later.
