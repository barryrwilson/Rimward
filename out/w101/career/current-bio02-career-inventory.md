# Current BIO-02 remaining career-branch inventory (Wave 101)

**Wave:** 101. Design only. No `src/`. No GLBs. No live bindings.  
**Rule:** Live `src/` wins over comments, Wave 86 line numbers, wishlist wording, and this inventory if they disagree. Re-open the cited files before an impl serial.  
**Scope:** Wishlist BIO-02 leftover — specialized career forms. First-impl class-ladder is **DONE**. This file does **not** re-author growth, train dest membership, or living **buy** SKUs.

This file is the source of truth for “BIO-02 career remainder today.” The integrator brief and `shared-contract.md` must not invent class keys that are not here.

Siblings (read only; **do not edit**): [`docs/Bio02EvolutionDesign.md`](../../../docs/Bio02EvolutionDesign.md); [`docs/BioLivingShipsDesign.md`](../../../docs/BioLivingShipsDesign.md); [`docs/Bio05AbominationsDesign.md`](../../../docs/Bio05AbominationsDesign.md); [`docs/OwnerDecisionsWave92.md`](../../../docs/OwnerDecisionsWave92.md); [`docs/OwnerDecisionsWave93.md`](../../../docs/OwnerDecisionsWave93.md); [`docs/OwnerDecisionsWave94.md`](../../../docs/OwnerDecisionsWave94.md); [`docs/OwnerDecisionsWave97.md`](../../../docs/OwnerDecisionsWave97.md).

Live line numbers: **2026-08-23**.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/game/state.js` | `SHIP_CLASSES` six keys, `MOUNT_TABLE`, `MINING_LASERS`, `HIDDEN_MOUNTS`, `RANK_LADDER`. **READ-ONLY** |
| `src/game/shipyard.js` | `LIVING_STOCK`, `livingTrainDests`, `YARD_LIST_UU`, `MIN_REP`, `yardPrice`, `trainListPrice`, buy SKUs |
| `src/game/hangar.js` | `trainMounted`, envelope, heal, `writeMountedGear`, cargo keep |
| `src/systems/shipyard-desk.js` | Hangar train papers, Digit 1/2 panes, `h()` host, `TRAIN_HEAVY_NOTE` unused |
| `src/systems/station.js` | Digit 0 Shipyard; Digit 6 Outfitting kits; `h()` `textContent` |
| `src/game/save.js` | `WORLD_FIELDS.hangar`; no career key |
| `src/systems/hud.js` | Reads `hullKind`; never writes |
| `src/game/bio.js` | Growth scale only |
| `src/systems/ship.js` | Living remount; silhouette by some classKeys |
| `src/core/ctx.js` | `emit` spread; HUD never owns `hullKind` |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | BIO-02 ~1222–1239 (career branches stay later) |

---

## 1. Class catalog (live six keys only — no career keys)

`SHIP_CLASSES` (`state.js` 37–44):

| Key | cruise | burn | hull | cargo | role |
|---|---|---|---|---|---|
| `light` | 120 | 240 | 100 | 20 | player |
| `heavy` | 90 | 180 | 160 | 48 | combat |
| `freighter` | 60 | 120 | 220 | 160 | trade |
| `ace` | 135 | 270 | 140 | 20 | ace |
| `cutter` | 105 | 210 | 80 | 32 | pirate |
| `frigate` | 22 | 45 | 900 | 80 | capital |

There is **no** `combat` / `mining` / `trade` / `exploration` / `stealth` / `support` class key.

`MOUNT_TABLE` (`state.js` 66–73):

| Key | general | mining | scanner | qship | missile | turret |
|---|---|---|---|---|---|---|
| `light` | 2 | 1 | 1 | 1 | 0 | 0 |
| `cutter` | 2 | 1 | 1 | 1 | 0 | 0 |
| `freighter` | 2 | 1 | 1 | 1 | 0 | 0 |
| `heavy` | 2 | 1 | 1 | 1 | 2 | 2 |
| `ace` | 2 | 1 | 1 | 1 | 2 | 1 |
| `frigate` | 2 | 1 | 1 | 1 | 4 | 4 |

`classKeyOf` (`hangar.js` 40–42): `hasOwnProperty` on `SHIP_CLASSES`, else `'light'`. Extra tokens become `light`.

`state.js` header (7–9): READ-ONLY for feature workers.

---

## 2. First impl is DONE (do not re-stage as missing)

| Surface | Today | Cite |
|---|---|---|
| Growth | `min(1, bond*0.7 + fedCount*0.05)` → visual scale. No `classKey` write | `bio.js` 156–161 |
| Train dests | **Any other** `LIVING_STOCK` key. Same class: empty dest list | `shipyard.js` 33–43 |
| Train mutate | Same hangar row `classKey`; `hullKind: 'living'`; debit `trainListPrice`; envelope `burn/cruise`; remount; cargo keep | `hangar.js` 786–885, 563–577 |
| Desk | Beautiful Hangar Offers + Confirm papers. Digit 1 Hangar / 2 Yard | `shipyard-desk.js` 207–232, 376–435, 439–496 |
| Hostile Beautiful | `No sale.` note, no Offer | `shipyard-desk.js` 221–222, 86 |
| Short credits | Offers stay; Confirm refuses `Not enough credits.` | `hangar.js` 815–818; desk 87 |
| Rank gate | `minRepFor(dest)` on Beautiful standing | `hangar.js` 809–810; `shipyard.js` 64–71, 96–100 |
| Unknowables hull | Refuse even at a Bloom | `hangar.js` 798–800; desk 211–213 |
| Grafted / built | Refuse train | `hangar.js` 801–802 |
| Success standing | **None** | `trainMountedUnlocked` writes credits + row only |
| `trainPending` cancel | Esc, Back, `selectService`, dock, undock, leave Hangar pane | `station.js` 5817–5823, 5841–5851, 5859–5906, 5931; desk 104–111, 128–132 |

Wave 86 first-impl dest `heavy` only is **stale**. Wave 94 law is live.

`TRAIN_HEAVY_NOTE` (`shipyard-desk.js` 94) still says the hull is as large as this dock trains. `trainPaint` does **not** use it. Dead string. Do not revive it as career law.

---

## 3. Hangar train dests (live)

`livingTrainDests` (`shipyard.js` 33–43):

- `fromClass` must be a string in `LIVING_STOCK` and own `SHIP_CLASSES`.
- Dest = every other `LIVING_STOCK` key that owns `SHIP_CLASSES`.
- Same class is never a dest.

Example: `livingTrainDests('light')` includes `cutter`, `heavy`, `freighter`, `ace`, `frigate`. It omits `light`.

`livingTrainDest` / `nextTrainClass` return the **first** dest in that list (not a career picker).

Ace / freighter / frigate as **train dests** are **DONE ladder**, not a missing career verb.

---

## 4. `LIVING_STOCK` and living **buy** (code wins)

`LIVING_STOCK` (`shipyard.js` 29):

```
['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']
```

`UNKNOWABLES_STOCK` is the same list (`shipyard.js` 30). Beautiful and Unknowables yards sell the full live class set as `hullKind: 'living'` (`shipyard.js` 12–13, 51–62, 91–94).

`YARD_LIST_UU` (`shipyard.js` 16–23) and `MIN_REP` (`shipyard.js` 64–71):

| Class | List UU | Min rep |
|---|---|---|
| light | 8000 | 0 |
| cutter | 11000 | 0 |
| heavy | 20000 | 0 |
| freighter | 24000 | 0 |
| ace | 28000 | 10 |
| frigate | 80000 | 25 |

`yardPrice` (`shipyard.js` 110–120): `Math.round(list * (1 - disc))` from `rankFor`. Tier ≥1 −5%, ≥2 −10%, ≥3 −15%. Hostile `rep < 0` still `No sale.`

`trainListPrice` (`shipyard.js` 123–126): **is** `yardPrice(dest, beautifulRep)`. Dest must sit in `LIVING_STOCK`.

**Stale docs:** Wave 86 inventory / Wave 93 “living frigate buy omit” / Bio02 overview table that still says Beautiful stock is `light`/`cutter`/`heavy` only. **Live Wave 94 sells all six.** Remaining career work must **not** strip those SKUs and must **not** append more keys.

Graft list stays `GRAFT_LIST_UU = 4000` (`shipyard.js` 26). Do not reopen.

---

## 5. Digit 0 desk and papers

| Surface | Today | Cite |
|---|---|---|
| Dock services | `DOCK_KEY_SERVICES` last key `shipyard`; Digit **0** selects it | `station.js` 186, 5802–5804, 5917–5925 |
| Shipyard panes | Digit **1** Hangar, Digit **2** Yard. Not dock services | `shipyard-desk.js` 18–20, 469–476 |
| Hangar hull digits | Digit **3+** mount hull 0–6. Digit **0** on Hangar = hull index 7 | `shipyard-desk.js` 143–151, 487–496 |
| Train Offers | Click `Offer {dest}`. **No** extra Digit | `shipyard-desk.js` 426–434 |
| Train papers | Hop `{from} → {dest}`; `{price} UU · Confirm papers`; cargo-keep note | `shipyard-desk.js` 376–394 |
| Copy host | `h()` sets `textContent`. `overlay.textContent = ''` clears | `station.js` 4302–4306, 5787 |
| `innerHTML` | None in `shipyard-desk.js`. None in station `h()` | grep 2026-08-23 |

A career Digit on the dock list would steal Shipyard (0), Repair (5), Outfitting (6), or hull 3+. **Forbidden.**

---

## 6. Outfitter loadout (live career kits already)

Dock Digit **6** is Outfitting (`station.js` 186, labels 5801). Live SKUs write through `writeMountedGear` (`hangar.js` 483–518). Unknown patch keys ignored. No remount. No new persist key.

| Kit | Live cost | Writer |
|---|---|---|
| Hold rack +10, max 2 | `CARGO_UPGRADE_COST` **600** | `station.js` 197–199, 4375–4381 |
| Wolfeye Mk I | `SCANNER_COST` **400** | `station.js` 200, 4384–4390 |
| Wolfeye Mk II | `SCANNER2_COST` **900** | `station.js` 201, 4392–4399 |
| Concealed mounts | `HIDDEN_MOUNTS.cost` **900** | `state.js` 343; `station.js` 4401–4408 |
| Mining Mk II / III / IV | **1400** / **4200** / **11000** | `state.js` 90–107; `station.js` 4415–4427 |
| Stock mining Mk I | cost **0** (index 0, not sold) | `state.js` 83–89 |
| Launcher / turret | existing outfitter Confirm papers | `station.js` 5384+ |

`RANK_LADDER` (`state.js` 714–721): Sworn 50 / Trusted 25 / Known 10 / Stranger −10 / Suspect −25 / Marked −1000.

---

## 7. Persist, HUD, growth, mesh

| Surface | Today | Cite |
|---|---|---|
| Persist | `WORLD_FIELDS` includes `hangar` (94), `scanner`, `concealedMounts`, `miningLaser`, launcher mirrors. **No** career / train key | `save.js` 76–101 |
| Autosave | `requestAutosave` after train debit | `hangar.js` 867 |
| HUD family | Reads `p.hullKind`. Built → mech. Living → bio. Never assigns `player.hullKind` | `hud.js` 80–88, 1064–1069 |
| HUD `HAIR_CAREER` | Layout inset **18**, not a career flag | `hud.js` 101 |
| Growth | Visual only | `bio.js` 156–161 |
| Living remount | `buildLivingVisual(classKey)` → `makeLivingHull(classKey)` | `ship.js` 274–282, 382–388, 559–560 |
| Silhouette | `cutter` / `heavy` modest scale. Other keys identity `{1,1,1}` | `ship.js` 259–263 |
| Envelope | `applyFlightEnvelope`: `multiplier = burn/cruise` | `hangar.js` 573 |
| `emit` | `{ type, t, ...data }` | `ctx.js` 263–264 |
| SHP / HUD | `player.hullKind` owned by SHP / save. HUD reads only | `ctx.js` 19–21 |

---

## 8. Wave 97 graft fence (do not reopen)

| Item | Live / owner | Cite |
|---|---|---|
| Graft UU | 4000 | `shipyard.js` 26 |
| Ungraft | **forbidden** | `docs/OwnerDecisionsWave97.md` |
| NPC grafted | **off** | grep `npc.js` / `traffic.js` |
| Train on grafted | refuse | `hangar.js` 801–802 |

---

## 9. Wishlist remainder vs live

Wishlist BIO-02 (~1231): “Career branches stay later.” Supported forms: combat, mining, trade, exploration, stealth, support.

Live already covers **class identity** for combat (`heavy`/`ace`), trade (`freighter`), capital (`frigate`), pirate/cutter, starter (`light`) via Hangar train among `LIVING_STOCK`. Loadout for mining / scan / stealth already sells at Outfitting.

**Missing product:** a named career **class key**. That gap is **intentional**. Remaining work must map careers onto **existing** keys + **existing** gear, not mint six rows.

---

## 10. What a naive later PR would break

- Six new `SHIP_CLASSES` keys → fights `state.js` READ-ONLY and `MOUNT_TABLE`.
- Digit 3 Train / Career tab → steals hull 3+.
- Digit 0 Career dock service → steals Shipyard.
- New `WORLD_FIELDS.career` → persist law.
- `innerHTML` career blurb with hull `name` → XSS.
- HUD write of `hullKind` from career → HUD-02.
- Strip frigate from `LIVING_STOCK` “to keep buy omit” → undoes Wave 94 live buy.
- Append career SKUs to `LIVING_STOCK` → SKU sneak.
- Graft / ungraft / NPC grafted as career flavor → Wave 97.
- `bio.growth` remount as career evolve → growth ≠ class.
- `switchTo(same id)` for a kit → `already-mounted`.
- Invented kit UU instead of live scanner / mining / rack / `yardPrice` → owner law.
