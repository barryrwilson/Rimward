# RIMWARD SHP remaining catalog leftovers

| Field | Value |
|---|---|
| **Title** | RIMWARD SHP remaining catalog leftovers |
| **Author** | Wave 115 SHP remaining-catalog integrator |
| **Date** | 2026-08-24 |
| **Status** | **CONSUME.** Named remaining serial **none**. Markdown only. |
| **Wave** | 115 — design freeze. No `src/`. Bindings do not change here. |
| **Owner request** | Wishlist SHP-01 still says Beautiful and Unknowables omit frigate. Census live yards. If remaining SHP wishlist holes are already live or owner-omitted, freeze **CONSUME**. Do not invent a seventh class, a new `WEAPONS` id, a mount power ledger, kit mutate, aim-glass gauges, or HUD-02 tokens. |
| **Merge law** | [`out/w115/shp/shared-contract.md`](../out/w115/shp/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Honor** | HUD-01 empty hub. Digit 0 shipyard. Digit 8/9 stay (launch / Standing at dock; launcher / turret papers in outfitting). `state.js` READ-ONLY later. No new persist key. `innerHTML` forbidden later. Six live class keys. No seventh. No new `WEAPONS` id. No mount power ledger. Kit mutate omit. Living Beautiful / Unknowables catalogs are `LIVING_STOCK`. Plated others `CORE_STOCK`. Wave 94 frigate buy **live** — do not restore Wave 86 omit. Wave 112 yard UU / `MIN_REP` / `RANK_LADDER` consume. Do not retune prices. Do **not** edit sibling Bio/Hud/Msn/Rep/Phy/Tgt/Owner docs, the wishlist, `PROGRESS.md`, `docs/ShpDesign.md`, or `docs/Shp03WeaponsDesign.md`. Do **not** write `docs/OwnerDecisionsWave115.md`. Do **not** steal `out/w115/hud02tgt/**` or `out/w115/hud03vis/**`. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w115/shp/current-shp-remaining-inventory.md`](../out/w115/shp/current-shp-remaining-inventory.md) |
| Merge law | [`out/w115/shp/shared-contract.md`](../out/w115/shp/shared-contract.md) |
| Security review | [`out/w115/shp/security-review.md`](../out/w115/shp/security-review.md) |
| Design-doc review | [`out/w115/shp/code-review.md`](../out/w115/shp/code-review.md) |
| UI audit | [`out/w115/shp/ui-audit.md`](../out/w115/shp/ui-audit.md) |
| Notes | [`out/w115/shp/notes.md`](../out/w115/shp/notes.md) |

Siblings HUD-02 / HUD-03, BIO kit mutate, TGT, MSN, REP, PHY, FX, wishlist, `PROGRESS.md`, frozen SHP first-slice / SHP-03 records, and `docs/OwnerDecisions*.md` are **other workers**. **Cite, do not edit.** Wave 115 this worker does **not** write `src/`.

**This leftover is a catalog freeze.** It is **not** a seventh class. It is **not** a new weapon family. It is **not** a mount power ledger. It is **not** kit mutate. It is **not** HUD-02 tokens.

---

## Overview

Wave 64 shipped Digit 0 Shipyard, magical hangar cap 8, and authored faction catalogs. Wave 65 added plated cutter + ace. Wave 67 added plated frigate to `CORE_STOCK` (80000 UU, Trusted 25) and **kept** Independent / Hollow yards empty. Wave 68 shipped SHP-03 missiles / turrets / seat-count mass. Wave 94 reversed the living-frigate park: Beautiful and Unknowables yards sell the **full live class set**, including `frigate`. Wave 112 deputized: consume live catalogs; no seventh class; no new `WEAPONS` id; no mount power ledger; keep live `YARD_LIST_UU` / `MIN_REP` / `RANK_LADDER`.

Wishlist SHP-01 still says “Beautiful and Unknowables still omit frigate” (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~742). That line is **stale**. Live `LIVING_STOCK` is six keys including `frigate` (`src/game/shipyard.js` 29). Code wins.

Census (code wins): faction yards **LIVE**. Hangar cap 8 **LIVE**. Digit 0 shipyard **LIVE**. Six class keys **LIVE** on both `CORE_STOCK` and `LIVING_STOCK`. Frigate buy **LIVE** on plated yards and living yards. Missiles / turrets / seat-count mass **LIVE**. Power-as-mount-ledger **OUT** (Wave 93 / Wave 112 §2). Wave 94 `POWER` is afterburner + psionic only — **not** a fifth limiter. BIO-02 kit mutate **OMIT** (no successor owner file opened it). Independent / Hollow catalogs **empty by Wave 64/67 law**, not a missing SKU.

This leftover is **CONSUME**. Named remaining serial: **none**.

This brief is the integrator document for that freeze. Wave 115 this worker lands markdown only. Bindings do not change here.

HUD-01 empty aim glass stays empty. `state.js` stays READ-ONLY. No new persist key. Digit 0 stays shipyard. Digit 8/9 stay. Do not invent UU. Do not restore Wave 86 omit. Do not append a seventh class. Do not reopen kit mutate.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w115/shp/current-shp-remaining-inventory.md`](../out/w115/shp/current-shp-remaining-inventory.md). Code wins over stale wishlist SHP-01 omit-frigate copy and stale BIO comments that still list three-key `LIVING_STOCK`.

| Surface | Today | Cite |
|---|---|---|
| Class keys | six: `light` `heavy` `freighter` `ace` `cutter` `frigate` | `state.js` 37–44 |
| `CORE_STOCK` | those six (plated) | `shipyard.js` 28 |
| `LIVING_STOCK` | those six (living), **includes frigate** | `shipyard.js` 29 |
| Unknowables stock | `LIVING_STOCK` alias | `shipyard.js` 30 |
| Yard UU | 8000 / 11000 / 20000 / 24000 / 28000 / 80000 | `shipyard.js` 16–23 |
| Min rep | 0 / 0 / 0 / 0 / 10 / 25 | `shipyard.js` 64–71 |
| Rank | Known 10, Trusted 25, Sworn 50 | `state.js` 714–721 |
| Hangar cap | **8** fail-closed | `hangar.js` 27, 201–205 |
| Digit 0 | last `DOCK_KEY_SERVICES` = shipyard | `station.js` 188, 6100–6102 |
| Digit 8/9 dock | Launch / Standing | `station.js` 188, 5963 |
| Digit 8/9 outfit | launcher / turret papers | `station.js` 1644–1712 |
| Mounts | `MOUNT_TABLE` six keys | `state.js` 66–73 |
| Weapons | cannon, disruptor, mining, missile, turret, psionic | `state.js` 116–145 |
| Power pool | afterburner + psionic; **not** mount ledger | `state.js` 147; Wave 112 §2 |
| Empty flags | `independent` / `hollow` not in `YARD_STOCK` | `shipyard.js` 51–62, 85–88 |
| `innerHTML` | none in desk / station `h()` | `station.js` 4398–4402 |
| Persist | `hangar` already on `WORLD_FIELDS` | `save.js` 93–96 |
| Hub | 80 px + RANGE | `hud.css` 184–189 |

### Pain points

- A naive later PR that “fixes” wishlist SHP-01 by **stripping** living `frigate` would restore the Wave 86 omit Wave 94 reversed.
- A naive later PR that **appends** a seventh `SHIP_CLASSES` key would smash Wave 112 §4.
- A naive later PR that fills Independent / Hollow with `CORE_STOCK` would invent catalogs Wave 64/67 left empty and Wave 112 told workers to **consume**.
- A naive later PR that adds rail / flak / beam-combat would mint a new `WEAPONS` id (Wave 112 §1 **Forbidden**).
- A naive later PR that gates cannon on `POWER` would reopen the SHP-03 mount power ledger (Wave 112 §2 **Forbidden**).
- A naive later PR that mutates Hangar kits would reopen BIO-02 kit mutate (**omit**; no successor owner file).
- A naive later PR that retunes `YARD_LIST_UU` / `MIN_REP` “for feel” would smash Wave 112 §5.
- A naive later PR that puts a class pip on the 80 px hub would reopen HUD-01.
- A naive later PR that steals Digit 0 / 8 / 9 would smash shipyard, launch, Standing, or outfitting papers.
- A naive later PR that adds a persist catalog key would invent a `WORLD_FIELDS` row the hangar does not need.
- Stale BIO docs still say living yards omit frigate. **Do not edit those docs here.** Code wins.

### Why now (design) / why not now (code)

The owner asked for the SHP remaining-catalog integrator so later serials do **not** invent SKUs against a stale wishlist line. Inventory shows yards, hangar, six-key living frigate buy, SHP-03 guns, and Digit 0 already live. Owner files already omit seventh class, new weapons, mount power ledger, kit mutate, and price retune. Merge law can freeze **CONSUME** without touching `src/`. Wave 115 this worker does not ship `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live `CORE_STOCK` / `LIVING_STOCK` / Digit 0 / hangar cap 8 / `MOUNT_TABLE` / `YARD_LIST_UU` / `MIN_REP` from **live code**.
2. Mark wishlist SHP-01 “omit frigate” as **stale**. Wave 94 living frigate buy is **LIVE**. Do not restore omit.
3. Freeze six live class keys. No seventh.
4. Freeze live weapon ids. No new `WEAPONS` family.
5. Freeze mount power ledger **out**. Wave 94 `POWER` consume as afterburner / psionic only.
6. Freeze SHP-03 missiles / turrets / seat-count mass as **LIVE consume**.
7. Freeze Independent / Hollow empty catalogs as **explicit omit** (Wave 64/67), not a remaining serial.
8. Freeze BIO-02 kit mutate **omit**.
9. Freeze Digit 0 shipyard. Digit 8/9 stay. No new persist key. `state.js` READ-ONLY. `innerHTML` forbidden later.
10. Freeze Wave 112 yard UU / min-rep / rank. Do not retune.
11. Name remaining serial **none**. Do not invent PR1.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in this worker.
- No seventh `SHIP_CLASSES` key. No plated Beautiful / Unknowables frigate SKU (living frigate already sells).
- No new `WEAPONS` id. No rail / flak / beam-combat family.
- No mount power ledger. Do not gate cannon on `POWER`.
- No kit mutate. No career-key invent. BIO-02 labels already Wave 102.
- No HUD-02 class tokens (sibling `out/w115/hud02tgt/**`). No HUD-03 vis (sibling).
- No aim-glass gauges. No class pip on `.rw-reticle`.
- No price / rank retune. No new Digit. No new `WORLD_FIELDS` key.
- Do not fill Independent / Hollow yards without a successor owner file.
- Do not edit the wishlist, `PROGRESS.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, Bio/Hud/Msn/Rep/Phy/Tgt/Owner docs.
- Do not write `docs/OwnerDecisionsWave115.md`.

---

## Frozen live law (copy, do not re-author)

Integers stay copied from live code and [`docs/OwnerDecisionsWave112.md`](OwnerDecisionsWave112.md). Cite that file. Do not edit it.

| Item | Live | Cite |
|---|---|---|
| Weapon keys | cannon, disruptor, mining, missile, turret, psionic | `state.js` `WEAPONS` 116–145 |
| Heat | max 100, cool 12/s, unlock 40 | `HEAT` 146 |
| Power pool | max 100, regen 8/s, afterburner 16/s | `POWER` 147 — **not** a mount ledger |
| Mass | seat-count | Wave 68; `MOUNT_TABLE` 66–73 |
| Mounts | light/cutter/freighter missile 0 turret 0; heavy 2/2; ace 2/1; frigate 4/4 | `MOUNT_TABLE` |
| Yard list | light 8000, cutter 11000, heavy 20000, freighter 24000, ace 28000, frigate 80000 | `YARD_LIST_UU` |
| Min rep | light/cutter/heavy/freighter 0; ace 10; frigate 25 | `MIN_REP` |
| Rank | Known 10, Trusted 25, Sworn 50 | `RANK_LADDER` |
| Hangar | cap 8; buy refuse `'full'` | `hangar.js` |
| Hull kind | Beautiful / Unknowables `'living'`; others `'built'` | `hullKindFor` 91–94 |
| Hostile | `rep < 0` paints `No sale.` | `shipyard-desk.js` 364–366 |
| Rank discount | Known 5%, Trusted 10%, Sworn 15% | `yardPrice` 110–120 |
| Graft | 4000 UU; ungraft forbidden | `GRAFT_LIST_UU`; Wave 97 |
| Seed market | 40000 UU hangar hull, not cargo | Wave 94 / 112 §9 |
| Launcher SKU | `dart` only | `weapon-fit.js` 33–44 |
| Turret SKU | `auto` only | `weapon-fit.js` 46–54 |

Train dests stay Wave 94: any other `LIVING_STOCK` key on Beautiful Hangar. That is BIO-02 ladder, not a SHP catalog leftover.

---

## Wishlist holes vs live (CONSUME table)

| Wishlist claim | Live verdict | Action |
|---|---|---|
| SHP-01 faction yards + rep/price gate | **LIVE** Wave 64+ | **CONSUME** |
| SHP-01 cutter + ace buy | **LIVE** Wave 65 | **CONSUME** |
| SHP-01 plated frigate 80000 / Trusted 25 | **LIVE** Wave 67 | **CONSUME** |
| SHP-01 “Beautiful and Unknowables still omit frigate” | **STALE.** Wave 94 six-key `LIVING_STOCK` | **CONSUME live. Do not omit-restore** |
| SHP-02 hangar cap 8, buy adds a row, switch any dock | **LIVE** Wave 64 | **CONSUME** |
| SHP-03 first-slice hull fields | **LIVE** Wave 64 | **CONSUME** |
| SHP-03 missiles / turrets / seat-count mass | **LIVE** Wave 68 | **CONSUME** |
| SHP-03 power ledger | **OUT** as mount ledger (Wave 93 / 112 §2). Wave 94 `POWER` is afterburner + psionic | **CONSUME out. Do not reopen** |
| Extra conventional weapon families | **none** Wave 112 §1 | **CONSUME omit** |
| Seventh ship class | **Forbidden** Wave 112 §4 | **CONSUME omit** |
| Independent / Hollow hull catalogs | **Empty** Wave 64/67 on purpose | **CONSUME omit** |
| BIO-02 Hangar kit mutate | **Omit** Wave 101/102; no successor owner file | **OMIT. Not this leftover** |
| HUD-02 class tokens | sibling | **Not this leftover** |
| Aim-glass gauges | HUD-01 empty hub | **Forbidden** |
| Seed hangar “not for sale” copy | Wave 112 §9 optional later; not a catalog SKU | **Not this leftover** |

No row in this table is a **real missing player-facing SHP catalog hole** that this wave may name as a serial.

---

## Remaining serial

**none.**

Do not schedule PR1. Do not land `src/`. A later wave that wants a catalog change needs a **successor owner file** that names the integer or SKU. Until then, live `shipyard.js` / `MOUNT_TABLE` / `WEAPONS` win.

---

## Honor (later, if any SHP catalog PR ever exists)

These rules still bind a hypothetical successor. They are not a schedule.

1. Digit 0 stays Shipyard. Digit 1 Hangar / Digit 2 Yard stay panes. Digit 3+ hull / papers. Digit 0 on Hangar = row 8.
2. Digit 8 dock root stays Launch. Digit 9 dock root stays Standing / epics. Outfitting Digit 8/9 stay launcher / turret papers.
3. HUD-01 empty **80 px** hub. No class pip on `.rw-reticle`.
4. `state.js` READ-ONLY unless a named catalog PR is separately owned. Default: **no** `state.js` write.
5. No new `WORLD_FIELDS` key. Hangar already persists.
6. `innerHTML` forbidden. `textContent` / `h()` / `el()` only.
7. Prototype-safe `hasOwn` on `SHIP_CLASSES` / `YARD_STOCK` / `YARD_LIST_UU`. No `for-in` merge from a save blob into the catalog.
8. Buy still Confirm papers. One debit. No remount-on-buy. Hangar cap 8 fail-closed.
9. Hostile `rep < 0` still `No sale.`
10. Unknowables purchased hulls stay `hullKind: 'living'`.
11. HUD never writes `hullKind`.
12. WAVE64 / WAVE65 / WAVE67 / WAVE68 / WAVE94 catalog pins **stay**. Do not invert.

---

## Fail closed (already live — do not invert)

| Case | Live |
|---|---|
| Unknown faction | `yardStockFor` → `[]` → `This dock has no hull catalog. No sale.` |
| Independent / Hollow dock | same empty path |
| Unknown `classKey` | not in `SHIP_CLASSES` → skip offer / buy `'stock'` |
| Hostile | note `No sale.`; Confirm still reputation-refuses |
| Hangar full | `'full'` / `The hangar is full.` |
| Short credits | Offer stays; Confirm `'credits'` |
| Buy in flight | `'busy'` |
| Unknowables non-living | `'release'` |
| Unknown mount class | `canSeat` uses `light` (missile 0 / turret 0) |

Never freeze the sim. Never throw on a bad flag. Never `innerHTML` a fallback catalog.

---

## Serial PR plan

**None named.** Wave 115 does not ship `src/`. Wave 115 does not queue a catalog worker.

Optional playtest successors (not this leftover; not scheduled):

- Retune one live UU **only** if a successor owner file names that integer.
- Hangar seed “not for sale” copy (Wave 112 §9) — BIO/SHP desk copy, not a SKU.
- Kit mutate — still omit until a successor owner file opens it.

---

## What this does not schedule

HUD-02 remaining tokens stay a sibling write-set. HUD-03 vis stays a sibling. BIO kit mutate stays omit. SHP-03 guns stay closed. Power-as-mount-ledger stays out. Seventh class stays forbidden.

Wave 115 SHP remaining catalog does **not** ship `src/`.
