# Wave 86 BIO-01 live inventory

**Wave:** 86. Design only. No `src/` in this worker.  
**Rule:** Code wins over stale comments. Cites are live file:line as of this inventory.  
**Scope:** remaining BIO-01 obtain — Sworn gift + pirate seed persist/fail-closed. Commodity only if a live SKU exists.

---

## 0. Files read

| File | Why |
|---|---|
| `src/game/hangar.js` | Cap 8, sanitize rows, `hullKind`, graft, add/park |
| `src/game/shipyard.js` | `LIVING_STOCK`, prices, buy, no remount |
| `src/systems/shipyard-desk.js` | Digit panes, confirm papers, graft desk |
| `src/systems/station.js` | Digit 0 shipyard, People desk, `h()` `textContent` |
| `src/game/save.js` | `WORLD_FIELDS.hangar`, snapshot/restore sanitize |
| `src/game/state.js` | `SHIP_CLASSES`, `RANK_LADDER` Sworn 50, `COMMODITIES` |
| `src/systems/ship.js` | `hullKind` mesh, Unknowables force, `makeLivingHull` |
| `src/systems/organic.js` | `isBeautiful` faction test |
| `src/systems/hud.js` | HUD family reads `hullKind`; never writes it |
| `src/core/ctx.js` | Ownership: SHP writes `hullKind`; hangar on world |
| `src/systems/npc.js` | Wreck spill / pirate lastAttacker |
| `src/game/data-trade.js` | Fail-closed drop pattern (data cubes, not seeds) |
| `src/game/origins.js` | Beautiful origin is bond/rock, not a second hull |
| `docs/BioLivingShipsDesign.md` | Gift freeze §3.2 — **do not edit** |
| `docs/OwnerDecisionsWave82.md` | Owner numbers; do not invent further rates |

`hull_seed_gift` is **absent** from `src/` (Wave 72 pin). Gift is not live.

---

## 1. Hangar cap 8

| Surface | Today | Cite |
|---|---|---|
| Cap constant | `HANGAR_CAP = 8` | `hangar.js` 26 |
| Accept buy | `hulls.length < HANGAR_CAP` after sanitize | `hangar.js` 188–193 |
| Append row | Refuse `{ ok: false, reason: 'full' }` at `>= HANGAR_CAP` | `hangar.js` 196–207 |
| Restore overflow | `capHulls` keeps mounted + extras to cap 8 | `hangar.js` 322–331, 377–381 |
| Re-export | `shipyard.js` re-exports `HANGAR_CAP` | `shipyard.js` 4, 235 |
| Buy refuse copy | `'The hangar is full.'` | `shipyard-desk.js` 29–30 |

Sanitize **does not evict** a mounted hull to make room. Overflow drops **unmounted extras** only when a blob already exceeds cap (`hangar.js` 322–331). A live grant that sees `length >= 8` must refuse. It must not call `capHulls` to steal a slot.

---

## 2. `hullKind` living / built

| Surface | Today | Cite |
|---|---|---|
| Allowlist on row | `'living'` \| `'built'` else omit | `hangar.js` 237–239 |
| Player heal | same allowlist; else `delete` | `hangar.js` 405–412 |
| Unknowables force | row and player → `'living'`; drop `grafted` | `hangar.js` 86–90, 412, 432 |
| Mesh | Unknowables living; `built` plated; **unset → living** | `ship.js` 503–508 |
| Remount force | Unknowables writes `'living'` then remounts | `ship.js` 514–528 |
| Boot mesh | `buildLivingVisual` before hangar overlay | `ship.js` 549–553 |
| Player create | `createShipState('light')`, faction default `'independent'` | `ship.js` 591; `state.js` 140–146 |
| Starter migrate | `hullKind: 'living'` | `hangar.js` 277–319, 334–341 |
| HUD read | `built` → mech; `living` → bio; else bio | `hud.js` 72–80 |
| HUD write | **none.** Cache `last.kind` is a read | `hud.js` 1013, 1598–1605 |
| ctx ownership | SHP / save own `player.hullKind`; HUD reads | `ctx.js` 18–24 |

`isBeautiful` is **not** the living-player test (`organic.js` 67–69). Starter faction is `independent` (`state.js` 146). HUD may fall through `isBeautiful(p.faction)` only after `hullKind` (`hud.js` 79). That is art family, not obtain.

---

## 3. Beautiful `LIVING_STOCK` / Unknowables living light

| Surface | Today | Cite |
|---|---|---|
| List prices | light 8000 / cutter 11000 / heavy 20000 / ace 28000 / freighter 24000 / frigate 80000 | `shipyard.js` 16–23 |
| Graft list | `GRAFT_LIST_UU = 4000` (Wave 82) | `shipyard.js` 26 |
| `LIVING_STOCK` | `light`, `cutter`, `heavy` frozen | `shipyard.js` 29 |
| Unknowables stock | `light` only | `shipyard.js` 30 |
| Yard map | `beautiful: LIVING_STOCK`; `unknowables: UNKNOWABLES_STOCK` | `shipyard.js` 32–43 |
| Kind from banner | beautiful / unknowables → `'living'`; else `'built'` | `shipyard.js` 72–75 |
| Min-rep | light/cutter/heavy 0; ace 10; frigate 25 | `shipyard.js` 45–52 |
| Buy list | `listYardOffers` walks stock + `SHIP_CLASSES` + `YARD_LIST_UU` | `shipyard.js` 108–122 |
| Buy | docked; stock; kind; hangar room; `rep < 0` or below min → no sale; debit; **restore `mountedId`** | `shipyard.js` 176–221 |
| No remount-on-buy | comment + `mountedId` restore | `shipyard.js` 212–215, 224 |
| Classes | six keys only: light heavy freighter ace cutter frigate | `state.js` 35–42 |

**No** living frigate / ace / freighter **buy**. Persist may still store those `classKey` values. Gift class: live SKU that already exists is living **`light`** (also in `LIVING_STOCK`). Do not add a class key.

---

## 4. Graft path (Wave 72 — do not reopen)

| Surface | Today | Cite |
|---|---|---|
| Flag | `grafted: true` only; living / Unknowables drop it | `hangar.js` 82–98 |
| Desk | Gilded hangar pane; two-step warn; confirm | `shipyard-desk.js` 48–65, 142–180, 238–275 |
| Apply | Mounted **built** only; debit 4000; no remount | `hangar.js` 731–764 |
| Hostility | `anyGrafted` → Beautiful `min(current, -10)` | `hangar.js` 111–155, 762 |
| HUD | grafted built stays `mech` (`hullKind` still `'built'`) | `hud.js` 77; `hangar.js` 748 |

BIO-01 obtain must **not** flip `hullKind` to `'living'` to mean tissue. Gift/pirate rows are living hulls, not grafts.

---

## 5. `RANK_LADDER` Sworn min 50

| Surface | Today | Cite |
|---|---|---|
| Ladder | Sworn min **50** tier 3; Trusted 25; Known 10; Stranger −10; Suspect −25; Marked −1000 | `state.js` 672–678 |
| `rankFor` | first rung with `rep >= min` | `state.js` 680–682 |
| Yard discount | tier ≥ 3 → 15% | `shipyard.js` 91–100 |
| Desk copy | Sworn name from `ladderNameAt(50)` | `station.js` 1095–1140 |

Gift freeze (`docs/BioLivingShipsDesign.md` §3.2): Sworn ≥ 50, reserved id `hull_seed_gift`. Live code has the rank. Live code has **no** gift grant.

---

## 6. Digit 0 shipyard / People / yard desks

| Surface | Today | Cite |
|---|---|---|
| Dock keys | market jobs bar feed repair outfitting people launch epics **shipyard** | `station.js` 174 |
| Level-1 Digit 0 | last service = **shipyard** | `station.js` 5710–5715 |
| KeyY | also shipyard | `station.js` 5709 |
| Shipyard panes | Digit **1 Hangar**, **2 Yard**. Not dock services | `shipyard-desk.js` 14–16, 279–334 |
| Digit 3+ / 0 | index hulls (Hangar) or papers (Yard). Digit 0 = **row 8** | `shipyard-desk.js` 104–113, 301–334 |
| Yard confirm | Digit 3+ **arms papers**. Confirm papers buys. Esc cancel | `shipyard-desk.js` 301–322, 126–134, 196–211 |
| Buy copy | `'Papers filed. Hull stored in hangar.'` | `shipyard-desk.js` 130–132 |
| People desk | contacts + rescue + traffic. **No gift row.** No Digit branch | `station.js` 5319–5377 vs 5747–5775 |
| `h()` | `textContent` only | `station.js` 4230–4233 |
| `innerHTML` | **none** in `shipyard-desk.js` | grep 0 |

Level-1 Digit 0 stays shipyard. Gift must not steal it. People has click buttons, not digits. Yard Digit 0 is hangar row 8 **inside** shipyard level-2.

---

## 7. Save sanitize of hangar rows

| Surface | Today | Cite |
|---|---|---|
| Persist key | `WORLD_FIELDS` includes `'hangar'` | `save.js` 76–101 (hangar at 94) |
| Autosave key | `rimward-save-v1` (+ slots 1..3) | `save.js` 66–67 |
| Snapshot | `sanitizeHangar` then copy defined fields | `save.js` 951–957 |
| Restore | assign fields; **omit hangar → delete**; then `sanitizeHangar` | `save.js` 1164–1221 |
| Row healer | `sanitizeHangarRecord`: `SAFE_ID`, reserved ids, allowlist, vitals | `hangar.js` 163–241 |
| Ids | `SAFE_ID` `/^[a-z0-9_]+$/i`, `ID_MAX` 64 | `save.js` 104–106 |
| Reserved | `__proto__` family — `SAFE_ID` matches `__proto__` | `save.js` 108–113; `hangar.js` 28–32 |
| `hull_seed_gift` | valid `SAFE_ID`; **not** in reserved set; **not** in live hulls | inventory grep |

No second hangar blob. No nested `loadout`. Gift/pirate must ride **existing** `hangar` rows.

---

## 8. `isBeautiful` vs living-player test

| Surface | Today | Cite |
|---|---|---|
| Helper | `faction === 'beautiful'` | `organic.js` 67–69 |
| Uses | Bloom station, gates, landmarks, HUD fallback | `station.js` 295; `hud.js` 79 |
| Living mesh | `meshKindFor` uses `hullKind` + Unknowables, **not** `isBeautiful` | `ship.js` 503–508 |
| Starter | independent living light | `state.js` 146; `ship.js` 591 |
| Beautiful origin | bond 0.35, hunger 0.4, two `livingRock`. No remount. No `hullKind` write | `state.js` 716–719; `origins.js` 51–66 |

Starter is independent. Gift/pirate must not use `isBeautiful(player.faction)` to decide living.

---

## 9. Wreck / piracy (no seed today)

| Surface | Today | Cite |
|---|---|---|
| Spill cargo | remaining manifest → scoop pods; empty → nothing | `npc.js` 1364–1387 |
| Data extra | `maybeSpawnDataFromWreck` after spill | `npc.js` 1385; `data-trade.js` 181–185 |
| Data rate | `DATA_DROP_RATE = 0.20` (Wave 82 EXP, **not** BIO) | `data-trade.js` 18–19 |
| Destroy | spill + survivor; `applyPlayerKillStanding` | `npc.js` 2146–2177 |
| lastAttacker | instance only; not saved | `npc.js` 229, 1045–1051 |
| Jettison | hail / capitulate dumps cargo pods | `npc.js` 1328, 1399–1407 |

No hangar grant on wreck. No seed commodity in pods. Pirate seed must **not** reuse `spawnPod` / `COMMODITIES`.

---

## 10. Commodity SKU — seed **absent**

| Surface | Today | Cite |
|---|---|---|
| `COMMODITIES` | provisions, metals, restricted, rawOre, **livingRock**, seven ores | `state.js` 308–322 |
| `livingRock` | food, base 600 | `state.js` 313 |
| Data tokens | `dataCrystal` / `dataCube` — **not** `COMMODITIES` | `data-trade.js` 7–8 |
| Seed SKU | **none** | grep `COMMODITIES` / hangar |

**Commodity obtain stays deferred and owner-open.** Do not add a `COMMODITIES` row in BIO-01. Do not overload `livingRock`. Expensive obtain that already exists is the Beautiful **yard hull** (`YARD_LIST_UU.light` 8000).

---

## 11. Events / strings / persist

| Surface | Today | Cite |
|---|---|---|
| Emit spread | `{ type, t, ...data }` | `ctx.js` 248–249 |
| Frozen events | `commLine` `{text, from}` already listed | `ctx.js` 219 |
| Desk notice | `ui.notice` via `textContent` | `station.js` 4230–4233 |
| New `WORLD_FIELDS` | hangar already exists; **no** seed key | `save.js` 76–101 |
| `state.js` | feature workers READ-ONLY this wave | task + Wave 70 law |

---

## 12. Prior freeze (honor; do not edit those files)

| Freeze | Where |
|---|---|
| Gift at Sworn ≥ 50; id `hull_seed_gift`; hangar row; no remount; full → refuse; once; price 0 | `docs/BioLivingShipsDesign.md` §3.2; `out/w70/bio/shared-contract.md` §3.3 |
| Pirate / commodity deferred in Wave 70/82 src | Wave 82 BIO table; living-ships open Q 3–4 |
| Wave 82 pirate line | **defer**. If a later wave ships it: rate **0.05**, hangar row not cargo. **This inventory does not copy that rate into a live constant.** |
| Living frigate buy omit | Wave 82; `LIVING_STOCK` |

---

## 13. Gaps (this brief must freeze)

1. No Sworn gift desk or grant helper.
2. No pirate-seed hangar grant; wrecks only spill `COMMODITIES`.
3. No seed SKU.
4. Hangar-full grant path does not exist (buy already fail-closes).
5. People desk has no rank-gated gift confirm.
6. `hull_seed_gift` absent until a later serial PR.

---

## 14. Code-win notes vs stale comments

- Wave 70 inventory line numbers for `ship.js` / `hangar.js` are stale. Use this file.
- `WORLD_FIELDS` now includes `'nav'` (`save.js` 99–100). BIO-01 still must not add a second persist key.
- Graft debit **is** live (`GRAFT_LIST_UU`). Do not reopen it.
- HUD `isBeautiful` fallback is live; living-player test remains `hullKind` / Unknowables / unset→living.
