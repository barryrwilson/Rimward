# SHP remaining catalog shared contract

**Wave:** 115. Design only. No catalog feature ships in this wave.  
**Status:** MERGE LAW for `docs/ShpRemainingCatalogDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/ShpDesign.md` (frozen Wave 63/64 record — **cite only**), `docs/Shp03WeaponsDesign.md` (frozen Wave 67/68 record — **cite only**), `docs/Bio*.md`, `docs/Hud*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Tgt*.md`, `docs/Phy*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave115.md`. Do not steal sibling Wave 115 paths (`out/w115/hud02tgt/**`, `out/w115/hud03vis/**`).  
**Locked sources:** wishlist SHP-01/02/03 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~724–781); live inventory `out/w115/shp/current-shp-remaining-inventory.md` (code wins); `docs/OwnerDecisionsWave94.md` §1 living six-key buy; `docs/OwnerDecisionsWave112.md` §1–§5 (cite, do not edit); live `src/game/shipyard.js`, `src/game/hangar.js`, `src/game/state.js` (READ-ONLY), `src/game/weapon-fit.js`, `src/systems/shipyard-desk.js`, `src/systems/station.js`, `src/game/save.js`.

Integrator rule: remaining SHP catalog work is **CONSUME**. Inventory cites live code. Code wins over stale “omit frigate” wishlist copy.

**This leftover is a freeze.** It is **not** a seventh class. It is **not** a new weapon family. It is **not** a mount power ledger. It is **not** kit mutate. It is **not** HUD-02 tokens.

**Named remaining serial: none.** Do not invent PR1. Do not land `src/` in this worker or as a queued catalog serial.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. There is **no** later named catalog PR in this leftover. A hypothetical successor needs a **new owner file** that names the integer or SKU. Until then, live tables win.
2. HUD-01 empty **80 px hub**. No class pip, yard meter, or SKU name on the aim glass. RANGE stays TGT-01. **Do not** put catalog chrome inside `.rw-reticle`.
3. Digit 0 stays **shipyard** (`station.js` 188, 6100–6102). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 1644–1712). **No new Digit.** Catalog freeze is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. Live `h()` already uses `textContent` (`station.js` 4398–4402).
5. `src/game/state.js` is READ-ONLY later. **No** new `SHIP_CLASSES` keys. **No** new `WEAPONS` ids. **No** `MOUNT_TABLE` rewrite. **No** catalog fields added to `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit.
6. Persist: **no** new `WORLD_FIELDS` key. Hangar already stores rows (`save.js` 93–96). Prices stay authored in `shipyard.js`, never on the blob. Autosave stays `rimward-save-v1`. **No** `world.yardCatalog`. **No** new `localStorage` key.
7. Prototype-safe later helpers: `hasOwn` / `Object.prototype.hasOwnProperty.call` on `SHIP_CLASSES`, `YARD_STOCK`, `YARD_LIST_UU`, `MIN_REP`. Never `for-in` merge a save blob into the catalog. Do not `Object.assign` a hangar row onto `YARD_LIST_UU`.
8. Six live class keys. `CORE_STOCK` and `LIVING_STOCK` both list `light` `cutter` `heavy` `freighter` `ace` `frigate` (`shipyard.js` 28–29). **Do not append.** **Do not strip** `frigate` / `ace` / `freighter` to restore Wave 86 omit.
9. Beautiful / Unknowables sell `LIVING_STOCK` (`hullKind: 'living'`). Other `YARD_STOCK` flags sell plated `CORE_STOCK` (`hullKind: 'built'`). Unknowables force `'living'` on buy. HUD never writes `hullKind`.
10. Independent / Hollow catalogs stay **empty** (`yardStockFor` → `[]`). Wave 64/67 omit. Wave 112 consume live. **Do not fill** without a successor owner file.
11. Kit mutate omit. Career labels already Wave 102. Do **not** reopen BIO-02 mutate. Do **not** steal HUD-02 tokens or HUD-03 vis.
12. SHP-03 missiles / turrets / seat-count mass **LIVE consume**. Digit 8/9 outfit papers stay. `LAUNCHER_IDS` stays `dart` only. `TURRET_IDS` stays `auto` only.
13. Mount power ledger **out**. Wave 94 `POWER` is afterburner + psionic only. Do not gate cannon on power. Do not add a fifth limiter.
14. Extra conventional weapon families **none**. Do not add rail, flak, beam-combat, or a seventh `WEAPONS` id (`docs/OwnerDecisionsWave112.md` §1).
15. Do not retune `YARD_LIST_UU` / `MIN_REP` / `RANK_LADDER` / graft 4000 / seed 40000 for “feel” (`docs/OwnerDecisionsWave112.md` §5). Hostile `rep < 0` still paints `No sale.` Rank discounts stay the live `yardPrice` table.
16. Buy: Confirm papers, one debit, **no remount-on-buy**, hangar cap **8** fail-closed. Train dests stay Wave 94 any other `LIVING_STOCK` key (BIO ladder, not a SHP SKU sneak).
17. WAVE64 / WAVE65 / WAVE67 / WAVE68 / WAVE94 catalog pins **stay**. Do not invert `LIVING_STOCK` membership, Digit 0, or `HANGAR_CAP === 8`.
18. CPU freeze: **no** per-frame catalog rebuild from JSON.parse of save prices. Authored tables stay module constants.
19. Fail closed: unknown faction → empty catalog copy. Unknown classKey → skip / `'stock'`. Never freeze the sim. Never throw. Never `innerHTML` a fallback list.
20. Do not edit sibling Bio/Hud/Msn/Rep/Phy/Tgt/Shp/Owner docs, wishlist, `PROGRESS.md`. Do not write `docs/OwnerDecisionsWave115.md`. Deputize defaults live in **this** contract.
21. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate).
22. Do not steal `out/w115/hud02tgt/**` or `out/w115/hud03vis/**`.

---

## 0.1 Wave 115 deputize (owner may override after playtest)

Pick the freeze. Inventory proves **catalogs are LIVE** (six keys, living frigate included) and **remaining SHP wishlist holes are LIVE or owner-omitted**. Do not park a fake serial. Do not invent UU / SKU / Digit.

### Live knobs (do not retune as the leftover)

| Knob | Live | Cite |
|---|---|---|
| `SHIP_CLASSES` | six keys | `state.js` 37–44 |
| `CORE_STOCK` | six plated | `shipyard.js` 28 |
| `LIVING_STOCK` | six living **including frigate** | `shipyard.js` 29 |
| `YARD_LIST_UU` | 8000 / 11000 / 20000 / 24000 / 28000 / 80000 | 16–23 |
| `MIN_REP` | 0 / 0 / 0 / 0 / 10 / 25 | 64–71 |
| `RANK_LADDER` | Known 10, Trusted 25, Sworn 50 | `state.js` 714–721 |
| `HANGAR_CAP` | 8 | `hangar.js` 27 |
| Digit 0 | shipyard | `station.js` 188, 6100–6102 |
| `MOUNT_TABLE` | six class rows | `state.js` 66–73 |
| `WEAPONS` | six ids | `state.js` 116–145 |
| `POWER` | afterburner + psionic | `state.js` 147 |
| Independent / Hollow | empty | `yardStockFor` 85–88 |
| Hub | 80 px | `hud.css` 184–189 |

Do **not** “fix” SHP-01 by omitting living frigate or by adding a seventh class. That inverts Wave 94 / Wave 112.

### Smallest additive leftover

**Name:** **none.** Consume live catalogs.

| Piece | Freeze |
|---|---|
| Remaining serial | **none** |
| Fail-closed | Keep live empty-catalog / `No sale.` / cap-8 paths. Never throw. Never `innerHTML`. |
| Not PR1 | seventh class; new `WEAPONS` id; mount power ledger; kit mutate; Independent/Hollow fill; UU retune; hub pip; Digit steal; persist catalog key |
| Home | no `src/` this wave |
| Persist | **none new** |

Owner freeze (do not invert):

- Prefer **consume live** over a paper SKU.
- Living Beautiful / Unknowables frigate buy stays **in**.
- Independent / Hollow empty stays **omit**.
- Kit mutate stays **omit**.

---

## 1. DONE vs remaining

### 1.1 DONE — do not re-author

| Item | Law |
|---|---|
| Digit 0 desk | Shipyard after `epics` |
| Hangar | Magical, cap 8, buy adds a row, no remount-on-buy |
| Plated catalogs | `CORE_STOCK` six keys including frigate |
| Living catalogs | `LIVING_STOCK` six keys including frigate (Wave 94) |
| Cutter / ace | Wave 65 |
| Frigate UU / rank | 80000 / Trusted 25 |
| SHP-03 guns | dart + auto; seat-count mass; Digit 8/9 outfit papers |
| Power as mount ledger | **Out** |
| Wave 94 POWER | Afterburner + psionic pool. Not this leftover |
| Train dests | Any other `LIVING_STOCK` key (BIO-02) |
| Empty flags | Independent / Hollow |

### 1.2 Remaining

**None** that this leftover may name. Wishlist SHP-01 omit-frigate is stale copy, not a hole.

Forbidden-as-remaining (do not schedule as SHP catalog work):

| Temptation | Verdict |
|---|---|
| New `WEAPONS` id | Forbidden Wave 112 §1 |
| Mount power ledger | Forbidden Wave 112 §2 |
| Seventh ship class | Forbidden Wave 112 §4 |
| Retune yard UU | Forbidden Wave 112 §5 until successor |
| Kit mutate | Omit BIO-02 |
| HUD-02 tokens | Sibling |
| Aim-glass gauges | HUD-01 |

---

## 2. Fail closed (live — keep)

| Case | Result |
|---|---|
| Faction not in `YARD_STOCK` | `[]` + `This dock has no hull catalog. No sale.` |
| `classKey` not on `SHIP_CLASSES` | skip offer; buy `'stock'` |
| Hostile `rep < 0` | `No sale.` |
| Below `MIN_REP` | `'reputation'` |
| Hangar length ≥ 8 | `'full'` |
| Short credits | Offer stays; Confirm refuses |
| Buy in flight | `'busy'` |
| Unknowables row not living | `'release'` |
| Unknown mount class | `canSeat` uses light (no missile/turret) |

Never `speed = 0`. Never freeze sim on a bad SKU string.

---

## 3. Serial PR plan

**No PR1.** Wave 115 SHP remaining catalog does not queue implementation.

If a successor owner file opens one integer, that file must **name** the integer. It must not dump `Object.keys(SHIP_CLASSES)` onto Independent docks. It must not restore Wave 86 omit.

---

## 4. Write-set (this worker)

Allowed:

- `docs/ShpRemainingCatalogDesign.md`
- `out/w115/shp/**`

Forbidden:

- `src/**`
- wishlist, `PROGRESS.md`, Owner docs, frozen SHP/BIO/HUD design docs
- `out/w115/hud02tgt/**`, `out/w115/hud03vis/**`
