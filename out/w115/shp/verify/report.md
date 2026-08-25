# SHP remaining catalog Wave 115 — verifier report

**Status:** CLEAN  
**Domain:** data (static census; no Vite, no Chrome)  
**Date:** 2026-08-24  
**Worker write-set checked:** `docs/ShpRemainingCatalogDesign.md`, `out/w115/shp/*.md` (not `verify/`)

Graph: `graph_resolve` returned `execute_workflows` for `codex/workflow-automation-management` (coverage 0.07, terms `report`/`verify`). That trigger is automation create/inspect/update. This task is a data freeze check. Scheduler was not used. Evidence writes are markdown only; the destructive-change gate was not crossed.

---

## What I tested

1. Read brief, inventory, contract, notes, security-review, code-review, ui-audit.
2. Grep/read live `src/game/shipyard.js` `CORE_STOCK` / `LIVING_STOCK` / `frigate`.
3. Grep/read live `src/systems/station.js` `DOCK_KEY_SERVICES` and `d === 0`.
4. Spot-check cited integers: `SHIP_CLASSES`, `MOUNT_TABLE`, `WEAPONS`, `HEAT`, `POWER`, `YARD_LIST_UU`, `MIN_REP`, `RANK_LADDER`, `HANGAR_CAP`, hangar persist, empty Independent/Hollow, desk copy, `innerHTML`, hub 80 px, `LAUNCHER_IDS`/`TURRET_IDS`.
5. Compare wishlist SHP-01 omit-frigate vs Wave 94 / Wave 112 owner law.
6. Confirm freeze: **CONSUME**, named remaining serial **none**, no invented UU/SKU, no `src/` in this write-set, no sibling HUD pack edits by this worker, no `docs/OwnerDecisionsWave115.md`.

---

## Live evidence

### Six-key catalogs including frigate

`src/game/shipyard.js` 28–30:

```
CORE_STOCK   = ['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']
LIVING_STOCK = ['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']
UNKNOWABLES_STOCK = LIVING_STOCK
```

Both lists have six keys. `frigate` is on both. `YARD_STOCK.beautiful` aliases `LIVING_STOCK`. `unknowables` aliases `UNKNOWABLES_STOCK`. `independent` and `hollow` are absent. `yardStockFor` missing faction → `[]`.

`SHIP_CLASSES` (`state.js` 37–44) is the same six keys. No seventh class.

### Digit 0 = shipyard

`DOCK_KEY_SERVICES` (`station.js` 188) ends with `'shipyard'`.

Level-1 Digit handler (`station.js` 6100–6102): `d === 0` selects `DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1]` → shipyard.

A second dock Digit-0 path at `station.js` 6145–6147 does the same last-key select. Digit 8 = launch. Digit 9 = epics / Standing.

### Wishlist SHP-01 omit-frigate is stale

`docs/PLAYER-EXPERIENCE-WISHLIST.md` 742 still says “Beautiful and Unknowables still omit frigate.”

Wave 94 §1 authored six-key `LIVING_STOCK` including `frigate`. Wave 112 §4: consume live catalogs; no seventh class. Pack marks the wishlist line **STALE** and freezes **CONSUME**. That matches live code.

### Remaining serial none / no invented UU or SKU

Brief, inventory, and contract all say **CONSUME** and named remaining serial **none**. No PR1. No seventh class. No new `WEAPONS` id. No fill of Independent/Hollow. Kit mutate stays omit (`docs/Bio02CareerDesign.md`).

Copied integers match live:

| Knob | Live |
|---|---|
| `YARD_LIST_UU` | 8000 / 11000 / 20000 / 24000 / 28000 / 80000 |
| `MIN_REP` | 0 / 0 / 0 / 0 / 10 / 25 |
| Rank | Known 10, Trusted 25, Sworn 50 |
| `HANGAR_CAP` | 8 |
| `WEAPONS` | six ids |
| `POWER` | max 100, regen 8, afterburner 16; not a mount ledger |
| Graft | 4000 |
| Seed market | 40000 (Wave 112 §9; not a catalog SKU) |

Object key order in `YARD_LIST_UU` lists `ace` before `freighter`. Values still match Wave 112. Pack documents that; it does not retune.

### Write-set bounds

Git at census:

- Untracked SHP pack: `docs/ShpRemainingCatalogDesign.md`, `out/w115/shp/*.md`
- `docs/OwnerDecisionsWave115.md` does **not** exist
- No `src/` under `out/w115/shp/`
- Sibling trees `out/w115/hud02tgt/` and `out/w115/hud03vis/` exist as **other** untracked packs; SHP files do not write into them

Dirty `src/systems/station.js` (+64/−5) is chain-grant / standing-remedial copy, not Digit 0 or yard catalog. Diff does not mention `DOCK_KEY_SERVICES` or `d === 0`. Not this worker’s write-set.

`innerHTML`: none in `station.js`, `shipyard-desk.js`, `hangar.js`, `shipyard.js`. Live `h()` uses `textContent` (`station.js` 4398–4402). Empty-yard copy: `This dock has no hull catalog. No sale.` (`shipyard-desk.js` 37, 336–338). Hostile: `No sale.` (364–366).

---

## Bugs found

None that invert the freeze, invent a serial, or mismatch live six-key catalogs / Digit 0.

Non-blocking citation notes (not bugs):

- Inventory cites `hud.js` 81–89 for `hudFamily`. Live file is `src/systems/hud.js` (not `src/ui/hud.js`). Line range is correct.
- Digit 0 last-key select also exists at `station.js` 6145–6147 in addition to 6100–6102.

---

## Evidence paths

- This report: `out/w115/shp/verify/report.md`
- Write-set list: `out/w115/shp/verify/write-set.txt`
- Live: `src/game/shipyard.js` 16–30, 51–71, 85–88
- Live: `src/systems/station.js` 188, 6100–6102
- Owner: `docs/OwnerDecisionsWave94.md` §1; `docs/OwnerDecisionsWave112.md` §1–§5
- Wishlist stale line: `docs/PLAYER-EXPERIENCE-WISHLIST.md` 742
