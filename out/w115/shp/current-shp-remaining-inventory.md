# SHP remaining catalog — live inventory

**Wave:** 115. Markdown only. Code wins over wishlist / PROGRESS / stale BIO comments.  
**Census date:** 2026-08-24.  
**Scope:** leftover SHP **faction catalogs / first-slice remainders** after Wave 64 yards+hangar, Wave 65 cutter/ace, Wave 67 plated frigate, Wave 68 SHP-03 guns, Wave 94 living six-key buy, Wave 112 consume-live deputize.  
**Not this leftover:** kit mutate (BIO-02 omit). Seventh class. New `WEAPONS` id. Mount power ledger. Aim-glass gauges. HUD-02 tokens (sibling). Price retune.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

**Verdict:** remaining player-facing SHP catalog hole = **none**. Freeze **CONSUME**. Named remaining serial **none**.

---

## 0. Wishlist / owner files (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| SHP first slice DONE Wave 64 | wishlist 724–731 | **True.** Digit 0 desk, hangar cap 8, authored catalogs |
| Cutter + ace buy Wave 65 | wishlist 739–741 | **True.** Both lists include those keys |
| Plated frigate buy Wave 67; 80000 UU, Trusted 25 | wishlist 741–742 | **True.** `CORE_STOCK` includes `frigate`; `YARD_LIST_UU.frigate === 80000`; `MIN_REP.frigate === 25` |
| “Beautiful and Unknowables still omit frigate” | wishlist 742 | **STALE.** `LIVING_STOCK` includes `frigate` (`shipyard.js` 29). Wave 94 §1 |
| SHP-02 hangar cap 8 | wishlist 748–757 | **LIVE.** `HANGAR_CAP === 8` |
| SHP-03 missiles / turrets / seat-count mass Wave 68 | wishlist 760–766 | **LIVE.** `WEAPONS.missile` / `.turret`; `MOUNT_TABLE`; Digit 8/9 outfit papers |
| Power ledger out | wishlist 730–731, 766; Wave 93 | **OUT as mount ledger.** Wave 94 `POWER` is afterburner + psionic only |
| No seventh class; no new `WEAPONS` id | `docs/OwnerDecisionsWave112.md` §1, §4 | **Binding.** Cite, do not edit |
| Consume live catalogs / UU / `MIN_REP` | Wave 112 §4–§5 | **Binding.** Do not retune |
| Living six keys including frigate | `docs/OwnerDecisionsWave94.md` §1 | **LIVE.** Do not restore Wave 86 omit |
| Independent / Hollow catalogs empty | PROGRESS Wave 64/67 | **LIVE omit.** `YARD_STOCK` has neither key |
| Kit mutate omit | `docs/Bio02CareerDesign.md`; Wave 101 contract §2.2 | **Omit.** No successor owner file opened it |

Wave 112 live integers (cite only): weapon keys six; heat 100/12/40; power 100/8/16; yard 8000/11000/20000/24000/28000/80000; min-rep 0/0/0/0/10/25; rank Known 10, Trusted 25, Sworn 50. Census matches.

---

## 1. Class set (`src/game/state.js`)

`SHIP_CLASSES` keys (`state.js` 37–44):

| Key | role | cruise | cargo |
|---|---|---|---|
| `light` | player | 120 | 20 |
| `heavy` | combat | 90 | 48 |
| `freighter` | trade | 60 | 160 |
| `ace` | ace | 135 | 20 |
| `cutter` | pirate | 105 | 32 |
| `frigate` | capital | 22 | 80 |

**Count: 6.** No career keys. No seventh class.

---

## 2. Yard catalogs (`src/game/shipyard.js`)

### 2.1 Prices and gates

`YARD_LIST_UU` 16–23 (frozen object):

| Class | List UU |
|---|---|
| light | 8000 |
| cutter | 11000 |
| heavy | 20000 |
| ace | 28000 |
| freighter | 24000 |
| frigate | 80000 |

Wave 112 table order light/cutter/heavy/freighter/ace/frigate = 8000/11000/20000/24000/28000/80000. Live values match. Object key order in source lists `ace` before `freighter`; **values** are the law.

`MIN_REP` 64–71:

| Class | Min rep |
|---|---|
| light | 0 |
| cutter | 0 |
| heavy | 0 |
| freighter | 0 |
| ace | 10 (Known) |
| frigate | 25 (Trusted) |

`GRAFT_LIST_UU = 4000` (26). Not a hull SKU.

`yardPrice` 110–120: list × rank discount (Known 0.05, Trusted 0.10, Sworn 0.15), `Math.round`. Hostile handled at desk (`rep < 0` → `No sale.`), not by a negative price.

`RANK_LADDER` (`state.js` 714–721): Sworn 50 / Trusted 25 / Known 10 / Stranger −10 / Suspect −25 / Marked −1000.

### 2.2 Stock lists

```
CORE_STOCK   = ['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']  // 28
LIVING_STOCK = ['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']  // 29
UNKNOWABLES_STOCK = LIVING_STOCK                                          // 30
```

**Frigate is on both lists.** Beautiful living frigate buy is **not** omitted.

`YARD_STOCK` 51–62:

| Faction | Stock |
|---|---|
| freehold | `CORE_STOCK` |
| veridian | `CORE_STOCK` |
| redledger | `CORE_STOCK` |
| ferrous | `CORE_STOCK` |
| gilded | `CORE_STOCK` |
| assembly | `CORE_STOCK` |
| congregation | `CORE_STOCK` |
| lamplighter | `CORE_STOCK` |
| beautiful | `LIVING_STOCK` |
| unknowables | `UNKNOWABLES_STOCK` (= living six) |

**Absent keys:** `independent`, `hollow`. `yardStockFor` 85–88: missing faction → `[]`.

`hullKindFor` 91–94: `beautiful` / `unknowables` → `'living'`; else `'built'`.

`listYardOffers` 133–147: walk stock; skip keys not on `SHIP_CLASSES` or `YARD_LIST_UU`; each offer `{ classKey, minRep, hullKind }`.

`livingTrainDests` 33–43: every other `LIVING_STOCK` key that exists on `SHIP_CLASSES`. Same class never a dest. BIO-02 ladder. **Not** a missing SHP SKU.

### 2.3 Buy path

`purchaseYardHull` 249–258 wraps `purchaseYardHullUnlocked` 201–247 with `buyInFlight`. Fail closed: not docked, unknown class, not in stock, Unknowables non-living, hangar full, `rep < 0` or below `minRepFor`, bad price, short credits, id exhaust, row mismatch. Success: append row, **do not remount** (`mountedId` restored 240–241), debit once, autosave.

`canReleaseSku` 128–131: class must be on `SHIP_CLASSES`; hullKind `'living'` or `'built'` only.

---

## 3. Independent / Hollow empty (explicit omit)

`FACTIONS` (`state.js` 591–606) includes `hollow` and `independent`.

Authored Hollow docks: `hollowreach` 125–128, `hush` 161–164, `verge` 198–201 (`authored-systems.js`). Digit 0 still opens Shipyard. Yard pane paints `This dock has no hull catalog. No sale.` (`shipyard-desk.js` 336–338).

Independent: no authored flag station. Generated systems **do** use `"faction": "independent"` (`galaxy.generated.js` multiple). Those docks also get the empty-catalog path.

Wave 64: “Independent/hollow catalogs stay empty.” Wave 67: “Independent / hollow stay empty.” Wave 112 §4: consume live catalogs. **Not a remaining serial.** Filling them would invent SKUs.

---

## 4. Hangar (`src/game/hangar.js`)

| Item | Live | Cite |
|---|---|---|
| Cap | **8** | 27 |
| Purchase gate | `hulls.length < HANGAR_CAP` | 201–205 |
| Overflow sanitize | keep mounted + fill to cap | 335+ |
| Persist | `WORLD_FIELDS` includes `'hangar'` | `save.js` 93–94 |
| Mirrors | `launcher`, `missileAmmo`, `turret` | `save.js` 95–96 |

SHP-02 magical hangar **LIVE**. Buy adds a row. Switch from any dock. Cap 8 fail-closed. Seed / gift grants also fail-closed on cap (Wave 112 §9). No new persist key needed for catalogs — prices live in `shipyard.js`, not the blob.

---

## 5. Digit map (`src/systems/station.js` + `shipyard-desk.js`)

`DOCK_KEY_SERVICES` 188:

`['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard']`

Level-1 labels 5963: Market … Launch, Standing, Shipyard.

Digit 0 selects last service = **shipyard** (6100–6102). Digit 8 = launch. Digit 9 = epics / Standing.

Shipyard panes (`shipyard-desk.js` 18–20): Digit 1 Hangar, Digit 2 Yard. Digit 3+ (and 0 as row 8) index the active pane (`hullDigitLabel` 173–176; `handleShipyardDigit` 502–530). Yard Digit 3+ **arms papers**; Confirm buys.

Outfitting Digit 8/9 (`station.js` 1644–1712): bind only `ui.level === 2 && ui.service === 'outfitting'`. Digit 8 launcher papers (`outfitLauncherState`). Digit 9 turret papers (`outfitTurretState`). Dock-root 8/9 stay launch / Standing.

**Do not steal Digit 0/8/9.**

---

## 6. Mounts and weapons (SHP-03 LIVE)

`MOUNT_TABLE` (`state.js` 66–73):

| Class | general | mining | scanner | qship | missile | turret |
|---|---|---|---|---|---|---|
| light | 2 | 1 | 1 | 1 | 0 | 0 |
| cutter | 2 | 1 | 1 | 1 | 0 | 0 |
| freighter | 2 | 1 | 1 | 1 | 0 | 0 |
| heavy | 2 | 1 | 1 | 1 | 2 | 2 |
| ace | 2 | 1 | 1 | 1 | 2 | 1 |
| frigate | 2 | 1 | 1 | 1 | 4 | 4 |

Unknown classKey → `light` at `weapon-fit.js` `canSeat` 56–60.

`WEAPONS` keys (`state.js` 116–145): `cannon`, `disruptor`, `mining`, `missile`, `turret`, `psionic`. **Six ids. No seventh family.**

`LAUNCHER_IDS.dart` only (`weapon-fit.js` 33–44). `TURRET_IDS.auto` only (46–54).

`HEAT` 146. `POWER` 147: max 100, regen 8/s, afterburner 16/s, min 15. Drain: afterburner + `WEAPONS.psionic.powerPerShot` 10. Cannon / disruptor / mining / dart / turret **no** power field. **Not a mount ledger.**

Mass = seat-count (Wave 68). Do not persist mass. Do not reopen a fifth limiter.

---

## 7. Desk copy and DOM

`shipyard-desk.js`:

- Empty catalog: `This dock has no hull catalog. No sale.` (37, 336–338)
- Hostile: `No sale.` (36 reputation, 364–366)
- Full: `The hangar is full.` (34)
- Confirm: `{price} UU · Confirm papers` (352)
- Train hop: `{from} → {dest}` (411)

`station.js` `h()` 4398–4402: `textContent` only. Grep `innerHTML` in `station.js` / `shipyard-desk.js` / `hangar.js` / `shipyard.js`: **none**.

HUD never writes `hullKind`. `hudFamily` reads it (`hud.js` 81–89).

Hub: `.rw-reticle` 80×80 px (`hud.css` 184–189). RANGE stays TGT-01. No catalog pip.

---

## 8. What is **not** missing

| Temptation | Why it is not a SHP remaining serial |
|---|---|
| Living frigate SKU | Already on `LIVING_STOCK` |
| Plated frigate SKU | Already on `CORE_STOCK` |
| Ace / cutter buy | Live Wave 65 |
| Seventh class | Wave 112 forbidden |
| New weapon family | Wave 112 forbidden |
| Mount power ledger | Wave 112 forbidden; `POWER` is other |
| Kit mutate | BIO-02 omit; no owner reopen |
| Independent / Hollow stock | Explicit empty catalogs |
| Price retune | Wave 112 keep live integers |
| HUD-02 tokens | Sibling pack |
| Aim-glass gauges | HUD-01 empty hub |
| Seed “not for sale” copy | Wave 112 §9 optional; not a catalog hole |
| Career class keys | BIO-02; loadout + live six |

---

## 9. Remaining hole

**None.** Player-facing SHP catalog surfaces the wishlist still names are **LIVE** or **owner-omitted**. Freeze **CONSUME**. Named remaining serial **none**.
