# RIMWARD BIO-01 obtain remaining: Sworn gift and pirate seed

| Field | Value |
|---|---|
| **Title** | RIMWARD BIO-01 obtain remaining: Sworn gift and pirate seed |
| **Author** | Wave 86 BIO-01 integrator |
| **Date** | 2026-08-21 |
| **Status** | Wave 92 impl. Wave 94 seed is Beautiful Market papers (not a `COMMODITIES` key). |
| **Wave** | 92 — impl. |
| **Owner request** | Remaining BIO-01: Beautiful Ones Sworn gift of a living-ship seed, plus pirate seed (rare piracy of a seed from a Beautiful Ones ship). Optional seed-as-commodity only if live code already has a SKU; otherwise keep commodity deferred and owner-open. Do not ship `src/`, GLBs, or live bindings. |
| **Merge law** | [`out/w86/bio01/shared-contract.md`](../out/w86/bio01/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Honor** | [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §3.2 gift freeze. **Do not edit** that file. Do not reopen Wave 72 grafts. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w86/bio01/current-bio01-inventory.md`](../out/w86/bio01/current-bio01-inventory.md) |
| Merge law | [`out/w86/bio01/shared-contract.md`](../out/w86/bio01/shared-contract.md) |
| Security review | [`out/w86/bio01/security-review.md`](../out/w86/bio01/security-review.md) |
| Design-doc review | [`out/w86/bio01/code-review.md`](../out/w86/bio01/code-review.md) |
| UI audit | [`out/w86/bio01/ui-audit.md`](../out/w86/bio01/ui-audit.md) |

Siblings BIO-02 / BIO-03 / BIO-04 are **other workers**. **Do not edit** `docs/Bio02EvolutionDesign.md`, `docs/Bio03FleetDesign.md`, `docs/Bio03ClassLookDesign.md`, `docs/Bio04PsionicsDesign.md`, `docs/BioLivingShipsDesign.md`, or `out/w86/bio02/**` / `out/w86/bio04/**`.

---

## Overview

Every origin already flies one living `light` hull. Beautiful yards already sell living `light` / `cutter` / `heavy` into the hangar (no remount-on-buy). Unknowables yards sell living `light` only. Wave 72 shipped Gilded grafts on **built** hulls. Wishlist BIO-01 still names two extra obtain paths that are **not live**: a Sworn gift of a living-ship seed, and rare piracy of a seed from a Beautiful Ones ship. A seed commodity SKU is **not** in live `COMMODITIES`.

This brief is the integrator document for a **later** implementation wave. It freezes gift id `hull_seed_gift`, Sworn ≥ 50, hangar cap 8 fail-closed, no remount-on-grant, pirate persist shape, fail-closed drop (no invented percent), Digit 0 shipyard, `textContent` only, and a serial PR plan. Wave 86 lands this markdown only. Bindings do not change here.

HUD never writes `hullKind`. Grafted built stays `mech`. `state.js` stays READ-ONLY this wave. Later impl may need a dedicated serial `state.js` PR **only** if the owner opens a seed commodity SKU. Default: no `state.js` write.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “BIO-01 obtain today”: [`out/w86/bio01/current-bio01-inventory.md`](../out/w86/bio01/current-bio01-inventory.md). Code wins over stale comments. Wave 70 cites are re-checked against today’s files.

| Surface | Today | Cite |
|---|---|---|
| Hangar cap | `HANGAR_CAP` **8**; buy refuse `'full'`; overflow keeps mounted | `hangar.js` 26, 188–207, 322–331 |
| `hullKind` | row/player `'living'` \| `'built'`; Unknowables force living | `hangar.js` 86–90, 237–239, 405–412 |
| Mesh | unset/`living` → `makeLivingHull`; `'built'` plated | `ship.js` 503–508, 258–307 |
| Starter | `createShipState('light')`, faction `independent` | `ship.js` 591; `state.js` 146 |
| Beautiful stock | `LIVING_STOCK` light/cutter/heavy. No frigate/ace/freighter **buy** | `shipyard.js` 16–43 |
| Unknowables stock | living `light` only | `shipyard.js` 30, 72–75 |
| Buy | adds hangar row; **restores `mountedId`**; hostile `rep < 0` no sale | `shipyard.js` 176–221 |
| Graft | mounted built; Gilded; 4000 UU; HUD `mech` | `hangar.js` 731–764; `shipyard.js` 26 |
| Sworn | `RANK_LADDER` min **50** tier 3 | `state.js` 672–678 |
| Digit 0 | dock level-1 → shipyard (last `DOCK_KEY_SERVICES`) | `station.js` 174, 5710–5715 |
| Yard digits | 1 Hangar, 2 Yard, 3+/0 hull or papers | `shipyard-desk.js` 14–16, 301–334 |
| People desk | contacts/rescue; **no gift** | `station.js` 5319–5377 |
| Save | `WORLD_FIELDS.hangar`; omit → delete; `sanitizeHangar` | `save.js` 66, 94, 951–957, 1168, 1216 |
| `isBeautiful` | `faction === 'beautiful'`. Not living-player | `organic.js` 67–69 |
| HUD family | reads `hullKind`; never writes | `hud.js` 72–80, 1598–1605 |
| Wreck spill | cargo pods only; data extra is EXP 0.20 | `npc.js` 1364–1387; `data-trade.js` 18–19 |
| Commodity seed | **absent**. `livingRock` is food | `state.js` 308–322 |
| Gift id | **absent** in `src/` | Wave 72 pin; inventory §0 |
| `h()` | `textContent` | `station.js` 4230–4233 |
| Ownership | SHP writes `hullKind`; hangar on world | `ctx.js` 18–24 |

Gift freeze already in [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §3.2: gift at Sworn (≥50), reserved hangar id `hull_seed_gift`. This brief honors that. It does not reopen it.

### Pain points

- Wishlist BIO-01: Sworn gift and pirate seed do not exist. Origin does not add a hull.
- A naive gift that remounts would steal the mounted starter (Wave 64 already forbade remount-on-buy).
- A naive pirate drop into cargo would overload `livingRock` or invent a `COMMODITIES` SKU (`state.js` READ-ONLY).
- Hangar cap 8: a grant that evicts a hull would break SHP-02 magical hangar.
- `isBeautiful(player.faction)` as a living test would skip the independent starter.
- Digit 0 is shipyard. A new dock service would steal it.
- Inventing a pirate percent here would fight `docs/OwnerDecisionsWave82.md`.

### Why now (design) / why not now (code)

The owner asked for the remaining BIO-01 obtain brief so a later serial can land gift + pirate persist against a frozen contract instead of a drive-by `hull_seed_gift` in the yard catalog. Wave 72 explicitly left that id absent. Implementation waits so cap-8 fail-closed, proto ids, no-remount, and no invented drop % exist before the first grant writes a row.

---

## Goals & Non-Goals

### Goals

1. Document live hangar, yards, rank, desks, save, `hullKind`, `isBeautiful`, and wreck spill from **live code**.
2. Honor Sworn gift: ≥50, id `hull_seed_gift`, living `light`, Beautiful faction, price 0, once, no remount.
3. Freeze pirate seed persist shape + fail-closed drop. Do **not** invent drop % or UU.
4. Freeze hangar cap 8 fail-closed. Do not evict.
5. Freeze Digit 0 shipyard. Gift lives on Beautiful **People** confirm papers.
6. Freeze HUD never writes `hullKind`. Grafted built stays `mech`.
7. Freeze commodity **deferred** (no live SKU).
8. Freeze XSS / proto / emit-smash / no-`innerHTML` / no new `localStorage` key.
9. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 86. No GLBs.
- No BIO-02 evolution / growth-center / new class keys.
- No BIO-03 bake. No BIO-04 psionics.
- No Unknowables dock. No power ledger. No police leave. No NAV.
- No living frigate / ace / freighter **buy**.
- No remount-on-buy or remount-on-grant.
- No Wave 72 graft reopen. No HUD write of `hullKind`.
- No invented drop %, UU, or standing delta. Point leftover numbers at [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).
- No `state.js` write this wave. No `COMMODITIES.seed`.
- No `innerHTML`. No new frozen event unless `commLine` cannot carry the pirate line.
- Do not edit the wishlist, `PROGRESS.md`, or sibling BIO/NAV/SHP files.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Ride `hangar` | Inventory §7; contract §1.1 |
| Seed shape? | Unmounted hangar row `hullKind: 'living'` | Living-ships §3.2; contract §1.2 |
| Gift id? | **`hull_seed_gift`** | Honor §3.2 |
| Gift rank? | Sworn `RANK_LADDER` min **50** | `state.js` 672–673 |
| Gift class? | living **`light`** | Best existing SKU; no new key |
| Gift desk? | Beautiful **People**, two-step confirm papers | Digit 0 stays shipyard |
| Gift price? | **0**. No debit | Wave 70 §3.3 |
| Gift once? | Yes. Existing id → skip | Contract §1.3 |
| Pirate id? | `hull_seed_pirate_N` via `nextHullId`. Never gift id | Contract §1.2 |
| Pirate % / UU? | **Not invented here.** Owner-open → Wave 82 | Task; contract §3.2 |
| Commodity? | **Deferred.** No live SKU | `state.js` 308–322 |
| Hangar full? | Fail closed. Do not evict | `HANGAR_CAP` 8 |
| Remount on grant? | **No.** Restore `mountedId` | Yard buy 212–215 |
| Living frigate buy? | **Keep omit** | `LIVING_STOCK` |
| HUD `hullKind`? | HUD never writes. Grafted stays `mech` | HUD-02 |
| `isBeautiful` living test? | **No.** Starter is `independent` | `organic.js` 67–69 |
| Grafts? | Closed. Gift/pirate are living rows, not `grafted` | Wave 72 |
| `innerHTML`? | **No** | `textContent` / `h()` |
| `state.js`? | READ-ONLY this wave. Optional later SKU PR only | Contract §0.8 |
| New event? | Prefer `commLine`. No hangar blob spread | `ctx.js` 219, 248–249 |
| Digit 0? | Untouched (shipyard) | `station.js` 5710–5715 |

### 2. Player outcome (later serial)

Dock a Beautiful station at Sworn (standing ≥ 50). Open People. Confirm papers. A living `light` seed appears in the hangar as `hull_seed_gift`. The mounted hull does not change. If the hangar already holds eight hulls, the gift refuses and no hull leaves the bay.

Pirate a Beautiful Ones ship (player last attacker, destroy or forced dump). Rarely, when the owner rate exists, another living `light` row appears in the hangar. If the hangar is full, the seed is lost. It does not become cargo. Missed rolls stay silent.

The player mounts the seed later from Hangar. HUD stays on the mounted hull until then.

### 3. Persist / sanitize

See contract §1.

Later PR1: add `grantLivingSeedRow` in `hangar.js` (THREE-free). Reuse `sanitizeHangarRecord`, `canAcceptPurchase`, `parkMounted`, restore `mountedId`. Snapshot/restore stay on `WORLD_FIELDS.hangar`. Idle gift is **absence** of that row, not a second bag.

Do not persist meshes, `targets.current`, or pirate RNG state. `lastAttacker` stays instance-only (`npc.js` 229).

#### Gift row (literal)

```
id: 'hull_seed_gift'
hullKind: 'living'
faction: 'beautiful'
classKey: 'light'
grafted: (omit)
```

Price 0. `SAFE_ID` already matches this id.

#### Pirate row

Same allowlist. `id` from `nextHullId(hangar, 'seed_pirate')`. If that returns null or `hull_seed_gift`, fail closed.

### 4. Sworn gift desk

See contract §2.

Beautiful People desk. Two-step confirm papers. Helper re-checks dock, banner, `rep >= 50`, once, cap. UI hide is not a gate.

Level-1 Digit 0 remains shipyard. People may later use level-2 Digit 1 **only** while the gift confirm is on screen.

### 5. Pirate fail-closed drop

See contract §3.

Hook after the live spill path (`npc.js` `spillShipCargo` / destroy / player jettison), **not** inside `spawnPod`. Grant is a hangar row. Empty hold still may roll the seed (seed is not cargo). Fail closed on cap 8, bad id, missing helper, or missing owner rate.

**Do not invent a drop percent.** Later impl copies the pirate-seed line from [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md) into a named constant beside hangar/yard helpers, or skips the roll. Do not copy `DATA_DROP_RATE` 0.20. Do not invent standing deltas (kill standing stays `applyPlayerKillStanding`).

### 6. UI

See contract §2.2, §3.3 and [`out/w86/bio01/ui-audit.md`](../out/w86/bio01/ui-audit.md).

**Later chrome (do not edit this wave):** People gift confirm row, reuse `.shipyard-buy-row.shipyard-confirm` or a People equivalent. Real `<button>`s. `aria-live` polite on `ui.notice` (dock overlay already redraws). Pirate: `commLine` toast only. No new glance HUD.

Labels: `textContent`. Never `innerHTML`. Reduced motion: same copy, no extra motion.

### 7. Events

Prefer live `'commLine' { text, from }`. Payload is a fresh literal. Never spread `world.hangar`.

Do not add a `ctx.js` freeze line unless PR3 proves `commLine` cannot carry pirate success/full.

### 8. Ownership

See contract §8.

Hangar grant helper owns rows. `ship.js` remount stays Hangar `switchTo`. HUD reads `hullKind`. `state.js` stays closed. Wave 94 seed is Market papers, not a `COMMODITIES` key.

### 9. Security

See contract §7 and [`out/w86/bio01/security-review.md`](../out/w86/bio01/security-review.md).

Threats this freeze exists to kill: XSS via desk copy, proto hull ids, persist-smuggled `grafted` on a living gift, emit smash, invented economy numbers, remount-on-grant, evict-on-full, `innerHTML`, new `localStorage` key.

### 10. PR plan (serial, later wave)

See contract §9. Named PR1–PR5 only. **Do not schedule or land them in Wave 86.** PR5 `state.js` is skip-by-default.

---

## Key Decisions

1. Persist: existing **`hangar`** rows only.
2. Gift id: **`hull_seed_gift`**. Sworn ≥ **50**. Class living **`light`**. Price **0**. Once.
3. Gift desk: Beautiful **People** confirm papers. Digit 0 stays shipyard.
4. Pirate: hangar row, not cargo. Fail-closed drop. **No invented %.**
5. Cap 8: refuse. Do not evict. Do not remount.
6. Commodity: deferred. No live SKU.
7. HUD never writes `hullKind`. `isBeautiful` is not the living test.
8. Grafts closed. Living gift/pirate are not Abominations.
9. `textContent` only. Prototype-safe sanitize.
10. `state.js` READ-ONLY this wave.

---

## Open owner questions (fail-closed defaults)

Do not invent UU / drop rates / standing deltas while waiting. Pointer: [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

1. **Pirate drop rate for the later impl serial?**  
   **Default: owner-open.** Copy the Wave 82 pirate-seed line or skip the roll. This brief does not author a percent.

2. **Pirate once-per-run vs repeatable rare drops?**  
   **Default: repeatable** until hangar cap, unique `hull_seed_pirate_N` ids. Gift stays once.

3. **People Digit 1 to arm the gift?**  
   **Default: button-first.** Digit 1 may arm only while the gift row is visible. Never steal dock Digit 0.

4. **Seed commodity SKU / UU?**  
   **Closed Wave 94 — open as Market papers.** Not a `COMMODITIES` key. `SEED_MARKET_UU = 40000`. Stem `seed_market`. Pointer: [`docs/OwnerDecisionsWave94.md`](OwnerDecisionsWave94.md).

5. **Copy strings** for gift / pirate (`commLine` / desk).  
   **Default: the static Echo lines in the contract.** Owner may retune wording only.

---

## Regression risks

| Risk | Freeze |
|---|---|
| Remount-on-gift steals the mounted hull | Restore `mountedId`; no `switchTo` |
| Full hangar evicts a hull | `canAcceptPurchase` refuse; never `capHulls` to grant |
| Gift twice | Reserved id skip |
| Pirate becomes `livingRock` cargo | Hangar row only; no `COMMODITIES` |
| Invented drop % | Contract §3.2; Wave 82 pointer |
| `isBeautiful` living test skips starter | Mesh/`hullKind` law; starter independent |
| HUD writes `hullKind` | HUD-02 closed; grant writes **row** only |
| Grafted gift | Living sanitize deletes `grafted` |
| Digit 0 stolen | People desk; no new dock service |
| Proto id hull | `isSafeHullId` / `RESERVED_IDS` |
| Emit smash | Literal `commLine` only |
| `innerHTML` names | `textContent` / `h()` |
| New localStorage key | Ride `hangar` on `rimward-save-v1` |
| Living frigate SKU sneak | `LIVING_STOCK` omit |
| `state.js` drive-by seed | PR5 skip default |
| Wave 72 graft reopen | Gift/pirate are not `graftMounted` |
| WAVE4/26/35 “fixes” | Explicit non-goal |

Wishlist BIO-01 regressions: origin-as-second-hull (already not); gift missing (this serial); pirate cargo (forbidden); expensive commodity (deferred).

---

## Acceptance direction (later impl)

Testable later; not this wave.

1. Beautiful People at Sworn ≥ 50, hangar with room: confirm papers → hangar gains `hull_seed_gift`, `hullKind: 'living'`, `classKey: 'light'`, `faction: 'beautiful'`. Mounted id unchanged.
2. Same dock, id already present → `You already carry that gift.` No second row.
3. Hangar length 8 → gift and pirate refuse `'The hangar is full.'` No eviction.
4. Standing below 50 or not Beautiful banner → `No gift.` No write.
5. Pirate: player last attacker on a Beautiful ship; hangar room; owner rate present → at most one new `hull_seed_pirate_*` living light row. No remount. No cargo SKU.
6. Pirate hangar full → toast full; no cargo consolation.
7. HUD never assigns `player.hullKind`. Grafted built still `mech`.
8. Digit 0 still shipyard. No `innerHTML`. No new `WORLD_FIELDS` key. No `state.js` change unless PR5 owner-opened.
9. `isBeautiful` still faction-only. Independent starter still living.

`state.js` untouched in the default serial. Digit 0 still shipyard. Grafts still Gilded-only.

---

## Ownership (summary)

See contract §8.

| Object | Writer | Reader |
|---|---|---|
| Gift/pirate hangar rows | later grant helper | save, Hangar pane, `switchTo` |
| `player.hullKind` | hangar switch / save / Unknowables | HUD |
| People gift pending | station ui (session) | People render |
| Pirate roll | later npc/hangar hook | hangar |
| `RANK_LADDER` | none | `rankFor` |

---

## Serial PR plan (implementable later)

Wave 86 does **not** touch `src/`. Later:

1. **PR1** `hangar.js` `grantLivingSeedRow` + refuse pins (full, proto, bad kind, restore mount).
2. **PR2** `station.js` People gift confirm; helper gates; copy; autosave.
3. **PR3** pirate hook on Beautiful player piracy; fail-closed; `commLine`; rate only from Wave 82 copy.
4. **PR4** boot pins. Do not “fix” WAVE4/26/35.
5. **PR5** dedicated `state.js` **skip** unless owner opens commodity SKU.

No GLB, no `package.json`, no sibling-doc edits.
