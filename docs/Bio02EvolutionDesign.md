# RIMWARD BIO-02 Beautiful Ones growth-and-training

| Field | Value |
|---|---|
| **Title** | RIMWARD BIO-02 Beautiful Ones growth-and-training |
| **Author** | Wave 86 BIO-02 integrator |
| **Date** | 2026-08-21 |
| **Status** | Wave 92 impl. Wave 94: living train dests are any other `LIVING_STOCK` key. Beautiful / Unknowables yards sell the full live class set. Live `bio.growth` stays scale. |
| **Wave** | 92 — impl. |
| **Owner request** | BIO-02 Beautiful Ones growth-and-training that evolves a living ship into a larger **existing** class for a price. Use live `SHIP_CLASSES` keys only. Do not invent six career class keys. Do not ship `src/` or GLBs in this wave. |
| **Merge law** | [`out/w86/bio02/shared-contract.md`](../out/w86/bio02/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Sibling** | [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §4 (Wave 70; **read only**). [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md). BIO-01 / BIO-03 / BIO-04 are **other workers**. **Do not edit** those files. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w86/bio02/current-bio02-inventory.md`](../out/w86/bio02/current-bio02-inventory.md) |
| Merge law | [`out/w86/bio02/shared-contract.md`](../out/w86/bio02/shared-contract.md) |
| Security review | [`out/w86/bio02/security-review.md`](../out/w86/bio02/security-review.md) |
| Design-doc review | [`out/w86/bio02/code-review.md`](../out/w86/bio02/code-review.md) |
| UI audit | [`out/w86/bio02/ui-audit.md`](../out/w86/bio02/ui-audit.md) |

---

## Overview

Every origin already flies one living `light` hull: `makeLivingHull` with swim, breath, heartbeat, and vein skin. Companion growth is a +15% visual scale from `bio.growth`. Beautiful yards already sell living `light` / `cutter` / `heavy`. Hangar `switchTo` is the only class remount and already calls `applyFlightEnvelope` (multiplier **`burn / cruise`**). There is no training desk, no class-ladder verb, and no career class keys.

Wishlist BIO-02 wants Beautiful growth-and-training centers that evolve a living ship into larger classes for a price, plus specialized career forms. **This brief freezes career forms out of first impl.** First impl is a class-ladder among **existing** keys: living `light` or `cutter` → **`heavy`**, for a price, at a Beautiful dock only.

Wave 86 lands this markdown only. Bindings do not change here. A later serial mutates the same hangar row, heals illegal seats, keeps cargo, applies the live envelope helper, and remounts the living CPU hull.

HUD-02 stays closed (HUD never writes `hullKind`). SHP-03 stays closed (starter cannon ungated). Living-frigate **buy** stays omitted. Frigate **evolution** is Wave 93 owned living `heavy` → `frigate`. Train debit is `yardPrice` of dest class. Success writes no standing.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “BIO-02 today”: [`out/w86/bio02/current-bio02-inventory.md`](../out/w86/bio02/current-bio02-inventory.md). Code wins over stale comments. Wave 70 cites are re-checked against today’s files.

| Surface | Today | Cite |
|---|---|---|
| Class keys | Six: `light` `heavy` `freighter` `ace` `cutter` `frigate` | `state.js` 35–42 |
| Growth | `min(1, bond*0.7 + fedCount*0.05)` → `flesh.scale` +15%. No `classKey` write | `bio.js` 156–161; `ship.js` 98, 991–995 |
| Envelope | `switchTo` / `applyMountedFlight` → `applyFlightEnvelope`. `multiplier = burn/cruise` | `hangar.js` 551–566, 697–728 |
| Same-id swap | `already-mounted` refuse | `hangar.js` 692 |
| Seats | `healLauncher` / `healTurret` via `canSeat` | `hangar.js` 54–61; `weapon-fit.js` 57–61 |
| Cargo | Row `cargo` + `cargoCapacity` (min 20, outfitter upgrades). Live hold `ctx.cargo` | `hangar.js` 64–79, 675–678 |
| Living remount | `buildLivingVisual()` — **no classKey** | `ship.js` 354–428, 514–528 |
| Yards | Beautiful `LIVING_STOCK` light/cutter/heavy. No living frigate/ace/freighter **buy** | `shipyard.js` 16–42 |
| Desk | Digit 0 Shipyard; pane 1 Hangar / 2 Yard; hull 3+ | `station.js` 174, 5710–5717; `shipyard-desk.js` 14–16, 284–298 |
| Papers | Yard Confirm papers; Gilded graft two-step on Hangar | `shipyard-desk.js` 196–206, 238–252 |
| Persist | `WORLD_FIELDS.hangar` only. No train key | `save.js` 76–101 |
| HUD | Reads `hullKind`; never writes | `hud.js` 72–80 |
| Unknowables | Force living. **No station** (D3) | `hangar.js` 86–90; `station.js` 533–551 |
| Owner UU | Graft 4000. **No train UU** | `OwnerDecisionsWave82.md` 87–99 |
| `state.js` | READ-ONLY for feature workers | `state.js` 7–9 |
| `emit` | Spreads `data` onto `{ type, t }` | `ctx.js` 248–249 |
| innerHTML | None in `shipyard-desk.js`; station `h()` uses `textContent` | `station.js` 4230–4235 |

There is no training action. Growth does not remount.

### Pain points

- Wishlist BIO-02: the player cannot pay a Beautiful dock to evolve a living hull into a larger existing class. Growth is scale, not class.
- A naive `bio.growth === 1 → classKey = 'heavy'` would skip papers, skip debit, skip envelope, and could leave a heavy on the light 120/30 cruise (Wave 64 already fixed that for hangar swap).
- Wishlist also asks specialized career forms. Inventing six keys would fight `state.js` READ-ONLY and SHP mount tables.
- `switchTo(mountedId)` cannot be the in-place evolve call (`already-mounted`).
- Living player mesh ignores `classKey`. Waiting on BIO-03 GLBs would block the ladder for no live player visual gain.
- Living frigate **buy** omit must not be undone by a training dest that is a SKU sneak.
- No owner UU for training. Inventing 20000 in the brief would violate Wave 82 law.

### Why now (design) / why not now (code)

The owner asked for the BIO-02 integrator so a later serial can land Beautiful Hangar papers against a frozen ladder instead of a drive-by `classKey` write in `bio.js`. Implementation waits so envelope, seat heal, cargo-keep, Digit reuse, and owner UU exist as law before the first confirm remounts.

---

## Goals & Non-Goals

### Goals

1. Document live growth, `switchTo` / `applyFlightEnvelope` / living remount, `LIVING_STOCK`, Digit map, persist, and HUD from **live code**.
2. Freeze growth ≠ remount.
3. Freeze first impl = class-ladder among existing keys: `light`/`cutter` → `heavy`. No new class keys. No new Digit.
4. Freeze Beautiful-dock Hangar papers, cargo-keep, seat heal, envelope `burn/cruise`, living remount via `applyMountedFlight`.
5. Freeze grafted built and Unknowables **out**. HUD never writes `hullKind`.
6. Freeze living-frigate **buy** omit. Frigate evolution Wave 93: owned living `heavy` → `frigate`.
7. Freeze train debit as `yardPrice` of dest class. Success writes no standing. Pointer: Wave 92 / Wave 93.
8. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/`, GLBs, or live bindings in Wave 86.
- No six career class keys (combat / mining / trade / exploration / stealth / support).
- No `light` → `cutter` lateral. No `cutter` → `light`.
- No train dest `ace` / `freighter` / `frigate` in first impl.
- No living frigate / ace / freighter **buy** SKU.
- No Unknowables dock or training desk.
- No BIO-01 gift / pirate seed. No BIO-03 bake. No BIO-04 psionics.
- No power ledger, police leave, NAV, lock box.
- No `state.js` write. No new persist key. No new frozen event. No `innerHTML`.
- No invented UU or standing deltas.
- No growth-center gate on the starter cannon.
- Do not edit the wishlist, `PROGRESS.md`, or `docs/BioLivingShipsDesign.md`.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Does `bio.growth` remount? | **No** | Inventory §2; Wave 70 §4 |
| New class keys? | **No** | Live six only; `state.js` READ-ONLY |
| Career forms? | **Out** of first impl | Wishlist 1073–1076; contract §3.4 |
| First-impl dest? | **`heavy`** from `light` or `cutter` | Larger living-buy class; `LIVING_STOCK` top |
| Train to frigate? | **Yes** owned living `heavy` → `frigate`. Not `LIVING_STOCK` | [`OwnerDecisionsWave93.md`](OwnerDecisionsWave93.md) |
| Ace / freighter dest? | **No** | Career-adjacent. Wave 93 |
| Where is the desk? | Beautiful Shipyard **Hangar pane** | Graft pattern; no new Digit |
| New `DOCK_KEY_SERVICES`? | **No.** Digit 0 stays Shipyard | Wave 70 §4.3; `station.js` 174 |
| Digit 3 Train tab? | **No** | Steals hull Digit 3+ |
| In-place remount? | `applyFlightEnvelope` + `applyMountedFlight` / `callRemount` | `switchTo` same id refuses |
| Envelope multiplier? | **`burn / cruise`** | `hangar.js` 561 |
| Keep cargo? | Yes. Keep `cargoCapacity`. Trim only if over cap | Inventory §3.4 |
| Illegal seats? | Existing heal drop | `hangar.js` 54–61 |
| Starter cannon gated? | **No** | SHP-03; Wave 70 §4 |
| HUD `hullKind`? | HUD never writes. Stays `living` → `bio` | HUD-02 |
| Grafted built? | **Refuse** | Not living |
| Unknowables? | Beautiful-dock-only. Unknowables fail closed | No dock; contract §0.6 |
| Train UU? | `yardPrice` of dest class (`heavy` Wave 92; `frigate` Wave 93) | [`OwnerDecisionsWave93.md`](OwnerDecisionsWave93.md) |
| Standing delta on success? | **None** | Do not invent |
| Hostile Beautiful? | Paint `No sale.` — **no** Train button. Do **not** graft-hide | Contract §4.2; yard 214–216 |
| Short credits? | Keep Offer; Confirm refuses `Not enough credits.` | Contract §4.2 |
| Hangar ineligible hull? | Note, no button. First-match priority | Contract §4.3 |
| `trainPending` chrome? | Null with graft sites: Esc, Back, selectService, dock, undock, leave Hangar | Contract §7.2 |
| Confirm name? | `light → heavy` / `cutter → heavy`. Never `mountedId` | Contract §7.2 |
| New persist key? | **No** | Mutate hangar `classKey` |
| New event? | **No** first impl | Desk notice |
| Player per-class mesh? | Keep `buildLivingVisual()` | `ship.js` 526–528; not BIO-03 |
| `innerHTML`? | **No** | `textContent` / `h()` |

### 2. Player outcome (later serial)

Dock a Beautiful Bloom. Open Shipyard (Digit 0). Hangar (Digit 1). If the mounted hull is a living `light` or `cutter` and standing is not hostile, **Train hull** sits **under** the hull list and offers papers into a **heavy**. Confirm shows `light → heavy` (or `cutter → heavy`), the debit, and the cargo-keep note. Credits debit (once owner-authored). The same creature keeps its hold. Illegal seats heal. Flight envelope becomes the heavy row. The living CPU mesh remounts with swim still on. Growth scale still tracks care. The starter could already fire cannon before this visit.

If standing is hostile, Hangar still says **`No sale.`** and does not hide like Gilded graft. If UU is short, the Offer stays so papers can show dest and cargo-keep; Confirm refuses. If the hull is already heavy, the desk says it is as large as this dock trains (no button). Plated, grafted, Unknowables, and off-ladder living hulls get one specific note. Other docks hide the offer. Esc, Back, Yard tab, dock, and B-launch clear pending.

### 3. Preserve: living player ship

The shipped player living hull **is** the product.

`makeLivingHull` sculpts a manta/whale sphere. Each frame the living rig mutates vertices: swim along the spine (idle 0.5 Hz → cruise 2.3 Hz), wing flap, ~4 s breath, 1.1 Hz heartbeat, amoeba shimmer, mood-tinted veins. Thrust is a bioluminescent surge, not a nozzle. `GROWTH_SCALE_MAX` 0.15 scales `flesh` from `ctx.bio.growth`.

Later BIO-02 work must **not**:

- Skip vertex swim after a class evolve.
- Replace player `makeLivingHull` with an NPC Beautiful GLB “because the class is now heavy.”
- Drive `classKey` from `bio.growth`.
- Treat `isBeautiful(player.faction)` as the living test (starter is `independent`).

Point at [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §2 / §4. This brief does not re-litigate grafts, gift, or NPC fleet look.

### 4. Growth stays visual

See contract §2.1. Feed Digit 4 still feeds. Bond and `fedCount` still raise `bio.growth`. That scale remains after a heavy remount. It never becomes the train trigger.

### 5. Class ladder (existing keys)

See contract §3.

Authored hull HP among `LIVING_STOCK`: cutter 80, light 100, heavy 160. First impl dest is the **top living buy class** `heavy`, not a walk through cutter.

```
light  → heavy
cutter → heavy
heavy  → stop
other  → stop
```

`SHIP_CLASSES` continues to admit `frigate` / `ace` / `freighter` on persist. Training ignores them in first impl.

### 6. Beautiful dock training action

See contract §4–§7.

Mounted-only. Beautiful banner. Hangar matrix §4.2 (hostile note, short-credits Offer, hull notes, no `graftOfferVisible` hide). Two-step Confirm papers. Pending **replaces** the hull list. Cargo-keep is a `screen-note` under `{price} UU · Confirm papers`. In-flight lock. Snap/restore on throw like `switchTo`.

`ui.trainPending` lives next to `ui.graftPending`. `cancelTrainPending` shares the Esc gate at `station.js` 5723. Null it on Back, `selectService`, `dock`, `undock`, and `setShipyardPane` when the pane is not Hangar. Confirm re-reads `mountedId` (mismatch → no debit) and calls `redraw()` so CREDITS / HOLD update. No new overlay.

Remount stack (must call, in order, after mutate):

1. `applyFlightEnvelope(ctx, 'heavy')`
2. living remount (`applyMountedFlight` or `callRemount` after `loadMountedRow`)

Do not re-author cruise/burn/creep/stopTime. Do not set `afterburner.multiplier = cls.burn`.

### 7. Frigate / Unknowables / SKU fence

Beautiful `LIVING_STOCK` stays `light` `cutter` `heavy`. Training to `heavy` is an owned-hull class change of a hull the yard **already sells**. That is not a SKU sneak.

Training to `frigate` would mint a living class the yard will not sell. Too close to a SKU sneak without an owner line. **Fail closed.** Owner-open: a later Owned-hull-only frigate evolve, still **not** a `LIVING_STOCK` append.

Unknowables living light: training is Beautiful-dock-only (recommended and frozen). Unknowables have no dock. Fail closed: no Unknowables train helper, no invented dock, refuse Unknowables-faction rows at a Bloom.

### 8. Price / reputation

See contract §6. Do not invent UU. Point at [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).

Fail-closed **candidate** (needs owner check-off): `yardPrice('heavy', beautifulRep)` so rank discount matches buy. Hostile `rep < 0` uses the live yard **copy** (`No sale.`) on Hangar, not graft hide. Short credits keep the Offer; Confirm refuses. Success writes **no** standing.

### 9. Persist, HUD, events

See contract §8. Hangar `classKey` is the persist. Restore already runs `applyMountedFlight` (`save.js` 1216–1221). HUD family stays `bio` while `hullKind === 'living'`. No train flag. No `localStorage` key.

### 10. Serial PR plan

Matches contract §11. **Do not schedule or land in Wave 86.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 helper + refuse** | Ladder dest `heavy`; Beautiful / living / Unknowables refuse | Desk debit |
| **PR2 papers desk** | Hangar matrix; `trainPending` cancel sites; hop name; cargo-keep note | New Digit; graft-style hostile hide |
| **PR3 mutate + remount** | Same-row class; envelope; living remount; cargo keep; seat heal | Career keys; GLBs |
| **PR4 owner debit** | Integer after OwnerDecisions line | Invented UU |
| **PR5 boot pins** | Ungated cannon; growth not remounting; Digit 0 | WAVE4/26/35 fixes |

`state.js` untouched unless a **named catalog PR** is separately owned. Prefer `shipyard.js` next to `LIVING_STOCK` for dest membership and `hangar.js` for mutate+envelope.

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave (not this worker).

### 11. Security (later impl)

See contract §9 and [`out/w86/bio02/security-review.md`](../out/w86/bio02/security-review.md).

Threats this freeze exists to kill: `bio.growth` remount, proto/`__proto__` dest keys, `innerHTML` copy, `emit` smash, invented UU, frigate SKU sneak, Digit steal, HUD `hullKind` write, cargo dump, envelope `multiplier = burn`.

### 12. Ownership

See contract §10. BIO writes hangar `classKey` on confirm only. SHP still owns `hullKind`. `bio.js` still owns growth. HUD reads.

---

## Key Decisions

1. Growth does not remount. Training is a Beautiful Hangar papers verb.
2. Live six class keys only. Career forms out of first impl.
3. First-impl dest = `heavy`. Stop at `heavy`.
4. Digit 0 Shipyard. Hangar pane offer. No new Digit.
5. In-place remount = `applyFlightEnvelope` + `applyMountedFlight`, not `switchTo(same id)`.
6. Multiplier = `burn / cruise`. Keep cargo. Heal seats.
7. HUD never writes `hullKind`. Grafted built out. Unknowables out.
8. Living frigate buy omit. Frigate evolve Wave 93: owned living `heavy` → `frigate`.
9. Train debit `yardPrice` of dest class. Success writes no standing. Point at Wave 92 / Wave 93.
10. `state.js` READ-ONLY. No new persist key. No `innerHTML`.
11. Beautiful Hangar matrix: hostile `No sale.` (no button); short credits keep Offer. `trainPending` dies on graft chrome sites.

---

## Open owner questions (fail-closed defaults)

**Closed Wave 92 / Wave 93** — [`docs/OwnerDecisionsWave92.md`](OwnerDecisionsWave92.md), [`docs/OwnerDecisionsWave93.md`](OwnerDecisionsWave93.md).

1. **Train list UU?** Reuse `yardPrice` of dest class. Wave 94: `trainListPrice(rep, dest)`.
2. **Train dests?** **Closed Wave 94.** Any other `LIVING_STOCK` key. Same class: no Offer.
3. **Living frigate / ace / freighter buy?** **Closed Wave 94 — in.** Full live class set on Beautiful and Unknowables yards.
4. **Unknowables-faction living hull at a Beautiful Bloom?** **Refuse.**
5. **Copy strings** (contract §7.3). Static Echo lines. Owner may retune wording only.

---

## Regression risks

| Risk | Freeze |
|---|---|
| `bio.growth` changes class | Contract §0.2, §2.1 |
| New career keys | §0.3 |
| New dock Digit | §0.7; Digit 0 shipyard |
| Digit 3 Train steals hull 3+ | Hangar offer, not a tab |
| Hostile Bloom hides Train | §4.2 note `No sale.` no button |
| Short UU hides papers | Keep Offer; Confirm refuses |
| `trainPending` survives B-launch / Back / Yard | Null with graft chrome sites |
| `switchTo` already-mounted | `applyMountedFlight` |
| `multiplier = burn` | `hangar.js` 561; contract §1 |
| Cargo dump / cap reset to 20 | Keep `cargoCapacity`; keep cargo |
| Illegal seats linger | Existing heal |
| Starter cannon gated | §0.13 |
| HUD writes `hullKind` | Forbidden |
| Grafted built trains | Refuse |
| Unknowables desk | Fail closed |
| Frigate SKU sneak | Dest `heavy` only; `LIVING_STOCK` unchanged |
| Invented UU / +standing | Owner-open; no success write |
| `emit` smash | No new event; never spread row |
| `innerHTML` / proto dest | `textContent`; `hasOwn` SHIP_CLASSES |
| Player GLB swap | Keep `buildLivingVisual` |
| `state.js` catalog drive-by | READ-ONLY; named catalog PR only |
| WAVE4/26/35 “fix” | Out |

Wishlist BIO regressions to call out (`PLAYER-EXPERIENCE-WISHLIST.md` 1105–1108): weakening player-ship animation; growth invalidating installed equipment or cargo. This freeze keeps CPU swim, heals seats via live helpers, and keeps cargo.

---

## Acceptance direction (later impl)

Testable later; not this wave.

1. `bio.growth` at 1.0 does not change `classKey` or envelope.
2. Beautiful Hangar, living `light` or `cutter`, standing ≥ 0, owner-confirmed price paid → same row `classKey === 'heavy'`, `hullKind === 'living'`, cargo kept, envelope is heavy (`maxSpeed` 90, multiplier 2).
3. `switchTo` still swaps **other** rows. In-place evolve does not use `switchTo(same id)`.
4. Built / grafted / Unknowables / already-heavy: note, no Train button, no mutate. Hostile Beautiful Hangar: `No sale.` note, no button, no mutate. Short credits: Offer stays; Confirm refuses. Non-Beautiful: hide. Never “not available.”
5. Esc, Back, Yard tab, dock, and B-launch clear `trainPending` with no debit.
6. Starter cannon fires without a training visit.
7. Digit 0 still shipyard. Digit 1/2 still Hangar/Yard. No new `DOCK_KEY_SERVICES` key.
8. No `innerHTML`. HUD does not write `hullKind`. `LIVING_STOCK` still omits frigate.
9. `state.js` untouched unless a named catalog PR (out of this serial by default).

Chrome vite+swiftshader verify and `npm run test:boot` are later-impl. Known boot FAILs stay.
