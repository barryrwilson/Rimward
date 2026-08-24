# RIMWARD BIO-02 remaining career branches

| Field | Value |
|---|---|
| **Title** | RIMWARD BIO-02 remaining career branches |
| **Author** | Wave 102 BIO-02 career PR1 |
| **Date** | 2026-08-23 |
| **Status** | Wave 102 PR1 labels. Static career words on Beautiful Hangar train Offers. Kit mutate still omit. |
| **Wave** | 102 — PR1 labels. |
| **Owner request** | Wishlist BIO-02 still names specialized career forms. Freeze remaining work so a later serial does not invent six class keys, does not undo live Wave 94 living buy, does not steal Digit 0, and does not impersonate UU. |
| **Merge law** | [`out/w101/career/shared-contract.md`](../out/w101/career/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Honor** | [`docs/Bio02EvolutionDesign.md`](Bio02EvolutionDesign.md) is **read-only** sibling history. [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §4. **Do not edit** those files. Code wins over stale Wave 86 comments (including stock omit and dest=`heavy` only). |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w101/career/current-bio02-career-inventory.md`](../out/w101/career/current-bio02-career-inventory.md) |
| Merge law | [`out/w101/career/shared-contract.md`](../out/w101/career/shared-contract.md) |
| Wave 102 PR1 probe | [`out/w102/career/probe.mjs`](../out/w102/career/probe.mjs) |
| Security review | [`out/w102/career/security-review.md`](../out/w102/career/security-review.md) |
| Code review | [`out/w102/career/code-review.md`](../out/w102/career/code-review.md) |
| UI audit | [`out/w102/career/ui-audit.md`](../out/w102/career/ui-audit.md) |

Siblings BIO-01 / BIO-03 / BIO-04 / BIO-05 / NPC turrets / TGT-03 are **other workers**. **Do not edit** those files, the wishlist, `PROGRESS.md`, or `docs/OwnerDecisions*.md`.

---

## Overview

Wave 92 shipped Beautiful Hangar training. Wave 94 widened dests to **any other** `LIVING_STOCK` key and sold the full live class set on Beautiful and Unknowables yards. Live `bio.growth` stays scale. Ace / freighter / frigate train dests are **already** the class ladder.

Wishlist BIO-02 still says specialized career forms / “Career branches stay later” (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~1231). Wave 86 froze those forms **out of first impl**. That freeze is complete. This brief is the integrator document for a **later** serial that must **not** mint six career keys.

Wave 102 PR1 lands static career words on existing Hangar train Offers. Kit mutate stays omit.

HUD never writes `hullKind`. Digit 0 stays Shipyard. Reuse Hangar papers. No new persist key. `innerHTML` forbidden. Living **buy** list stays the live six keys (do not restore Wave 86 omit; do not append). Graft 4000 / ungraft forbidden / NPC grafted off stay closed (Wave 97).

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w101/career/current-bio02-career-inventory.md`](../out/w101/career/current-bio02-career-inventory.md). Code wins over stale Wave 86 comments in [`docs/Bio02EvolutionDesign.md`](Bio02EvolutionDesign.md).

| Surface | Today | Cite |
|---|---|---|
| Class keys | Six: `light` `heavy` `freighter` `ace` `cutter` `frigate`. No career keys | `state.js` 37–44 |
| Train dests | Any other `LIVING_STOCK` key | `shipyard.js` 33–43 |
| Living buy | Full six keys. Beautiful + Unknowables | `shipyard.js` 29–30, 51–62 |
| Train debit | `trainListPrice` = `yardPrice(dest)` | `shipyard.js` 110–126 |
| Rank | ace 10, frigate 25, else 0 | `shipyard.js` 64–71 |
| Desk | Digit 0 Shipyard; pane 1 Hangar / 2 Yard; hull 3+ | `station.js` 186, 5920–5922; `shipyard-desk.js` 18–20, 143–151 |
| Papers | Train Confirm `{from} → {dest}` | `shipyard-desk.js` 376–394 |
| Outfitter kits | scanner 400/900, racks 600, concealed 900, mining 1400/4200/11000 | `station.js` 197–201, 4375–4427; `state.js` 83–107, 343 |
| Persist | `WORLD_FIELDS.hangar` only. No career key | `save.js` 76–101 |
| HUD | Reads `hullKind`; never writes | `hud.js` 80–88 |
| Growth | Scale. No `classKey` | `bio.js` 156–161 |
| Graft | 4000 UU. Train refuses grafted | `shipyard.js` 26; `hangar.js` 801–802 |

### Pain points

- Wishlist still lists combat / mining / trade / exploration / stealth / support as if they needed new hull types. A naive later PR that adds six `SHIP_CLASSES` rows would fight `state.js` READ-ONLY and SHP mount tables.
- Wave 86 comments still say living frigate **buy omit** and dest=`heavy` only. Live Wave 94 already sells and trains the six keys. Restoring omit would undo shipped buy. Ignoring live dests would duplicate ace/freighter as “new career verbs.”
- A Career Digit would steal Shipyard (0), hull 3+, Repair (5), or Outfitting (6).
- A `WORLD_FIELDS.career` flag would fight hangar allowlist law.
- Invented kit UU would impersonate owner integers.

### Why now (design) / why not now (code)

The owner asked for the remaining BIO-02 integrator so a later serial maps careers onto **existing** keys and **existing** outfitter SKUs. Implementation waits so Digit reuse, persist, and UU copy exist as law before anyone paints a fake class.

---

## Goals & Non-Goals

### Goals

1. Document live train dests, `SHIP_CLASSES`, `LIVING_STOCK`, Digit 0 desk, papers, `yardPrice`, persist, and outfitter kits from **live code**.
2. Freeze first impl as **DONE**. This brief owns remaining career branches only.
3. Freeze careers as **loadout + existing class**. No new `SHIP_CLASSES` rows.
4. Freeze living buy list as the live six keys. Do not strip. Do not append.
5. Freeze ace / freighter / frigate train as **DONE ladder**, not a new verb.
6. Freeze Digit 0 Shipyard, Hangar papers reuse, no new persist, HUD never writes `hullKind`, `textContent` only.
7. Freeze graft 4000 / ungraft forbidden / NPC grafted off (Wave 97).
8. Pick playable defaults (no parked owner wait) for career skins and Hangar kit mutate **omit**.
9. Freeze a serial PR plan. This wave writes the brief.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 101.
- No six career class keys.
- No BIO-03 rebake. No BIO-04 psionic rewrite. No BIO-05 reopen.
- No NPC turret (sibling). No TGT-03 closure (sibling).
- Do not edit `docs/Bio02EvolutionDesign.md`.
- Do not fix known boot FAILs (WAVE4 / WAVE26 / WAVE35).
- No `state.js` write. No new Digit. No new persist key. No `innerHTML`.
- No invented UU or standing deltas.
- Do not edit the wishlist, `PROGRESS.md`, Living-ships, or `docs/OwnerDecisions*.md`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Wave 101 `src/`? | **No.** Markdown only | Task; contract §0.1 |
| New class keys? | **No.** Six live keys only | `state.js` 37–44; contract §0.3 |
| Careers are what? | Loadout + existing class | Deputize; contract §1.2 |
| Living frigate buy? | **Live in** (six-key `LIVING_STOCK`). Do not omit-restore. Do not append | `shipyard.js` 29; Wave 94 |
| Train dests? | Keep Wave 94 any other `LIVING_STOCK` key | `livingTrainDests` |
| Ace / freighter dest? | **DONE ladder.** Not a new career verb | Inventory §3 |
| Hangar kit mutate? | **Omit** unless a successor owner file opens it | Contract §2.2 |
| Dest labels? | Wave 102 PR1: static career words on Hangar Offers | Contract §2.3 |
| Desk? | Digit 0 Shipyard. Hangar pane | `station.js` 5920–5922 |
| New Digit? | **No** | Contract §0.6 |
| New persist? | **No.** Hangar row only | `save.js` 94 |
| Train / kit UU? | Copy live `yardPrice` / outfitter integers | Contract §0.10 / §2.4 |
| Standing on success? | **None** | Live train writes none |
| HUD `hullKind`? | HUD never writes | HUD-02 |
| `innerHTML`? | **No** | `textContent` / `h()` |
| Graft / ungraft / NPC grafted? | Do not reopen | Wave 97 |
| `state.js`? | READ-ONLY | Header 7–9 |

### 2. Player outcome (later serial)

**Already live (do not re-stage):** Dock a Beautiful Bloom. Open Shipyard (Digit 0). Hangar (Digit 1). A living non-grafted hull that is not Unknowables-faction shows Offers into **every other** living class. Confirm papers debit `yardPrice` of dest. Same creature keeps its hold. Envelope follows dest. Swim stays on. Growth stays scale. Outfitter (Digit 6) already sells scanner, mining heads, concealed mounts, and hold racks.

**PR1 (Wave 102):** those Offers show a static career word on the **name** line next to the dest key (`heavy` combat, `ace` hunter, `freighter` trade, `light` explore, `frigate` capital). The Offer **button** stays `Offer {dest}` (`Offer heavy`) so WAVE92 exact lookup keeps working. Cutter stays `cutter`. No new key. No new Digit. Confirm hop stays `{from} → {dest}`. Confirm still passes the **key**, not the word. HUD `HAIR_CAREER` is a hairline inset, not this feature.

**Not in first remaining serial:** a Hangar “Fit career kit” mutate. Player buys kits at Outfitting with live prices.

Hostile Bloom still paints `No sale.` Short credits keep Offers. Esc still cancels papers.

### 3. Preserve: living player ship

The shipped player living hull **is** the product.

`makeLivingHull` still sculpts the manta/whale. Live remount passes `classKey` for rest scale. `cutter` / `heavy` get a modest silhouette; other keys stay identity (`ship.js` 259–263). Career work must **not** replace this with an NPC GLB “because the career is now ace.”

Point at [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §2 / §4. This brief does not re-litigate grafts, gift, or NPC fleet look.

### 4. Career skins (existing keys)

See contract §2.1.

```
combat       → heavy     (hunter skin → ace)
mining       → cutter    + miningLaser at outfitter
trade        → freighter
exploration  → light     + scanner at outfitter
stealth      → cutter    + concealedMounts at outfitter
support      → heavy     (capital skin → frigate)
```

No seventh key. `cutter` may be mining or stealth by gear, not by a new class.

### 5. Desk, Digit, papers

See contract §0.6 and §2.2–2.3.

Training stays Beautiful Hangar. Career labels ride those Offers. Digit 0 stays Shipyard. Digit 1/2 stay panes. Digit 3+ stay hulls. Outfitter stays Digit 6.

`trainPending` cancel sites stay the graft family. Do not add a persisted pending blob.

### 6. Price / reputation

See contract §2.4. Copy live `YARD_LIST_UU` / `MIN_REP` / `yardPrice` rank discount. Copy live outfitter integers. Success writes no standing. Hostile `No sale.`

### 7. Persist, HUD, events

Hangar `classKey` + existing gear fields. Restore already runs `applyMountedFlight` (`hangar.js` 734–741). HUD family stays `bio` while `hullKind === 'living'`. No career flag. No new `ctx.emit` in first remaining serial.

### 8. Security (later impl)

See contract §0.9–0.14 and [`out/w101/career/security-review.md`](../out/w101/career/security-review.md).

Threats this freeze exists to kill: six fake keys, Digit steal, persist smuggle, `innerHTML` copy, `emit` smash, invented UU, SKU sneak or omit-restore, HUD `hullKind` write, graft reopen, proto dest.

---

## Serial PR plan (later impl wave — not Wave 101)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 labels** | **Landed Wave 102.** Static career words on existing train Offers | New keys, Digit, persist, kit mutate |
| **PR2 kit mutate** | **Skipped** unless a successor owner file opens contract §2.2 | New UU, `classKey` write, Digit steal |
| **PR3 pins** | No career keys in `SHIP_CLASSES`; Digit 0 shipyard; `LIVING_STOCK` six live keys | WAVE4/26/35 fixes |

Wave 102 lands PR1 only. PR2 stays skipped. PR3 pins stay later.

---

## Security & persist (freeze)

| Control | Rule |
|---|---|
| Copy | Static literals; `textContent` |
| Dest keys | `LIVING_STOCK.includes` + `hasOwnProperty(SHIP_CLASSES)` |
| Persist | Hangar row only |
| Standing | No write on train/career success |
| Emit | No hangar blob |
| Digit 0 | Shipyard |

---

## Acceptance (later serial)

Testable later; not this wave.

1. `SHIP_CLASSES` still has exactly the six live keys. No `mining` / `stealth` / `support` / `exploration` / `combat` / `trade` **key**.
2. `LIVING_STOCK` still lists those six. Frigate buy still present. No seventh SKU.
3. Beautiful Hangar still trains to any other living key. Ace / freighter dests still work. Same class: no Offer.
4. Digit 0 still shipyard. Digit 1/2 still Hangar/Yard. Digit 3+ still hulls. No Career Digit.
5. No new `WORLD_FIELDS` key. HUD did not write `hullKind`. No `innerHTML`.
6. Dest Offers show static career words (Wave 102 PR1). Confirm hop still `{from} → {dest}`. `TRAIN_HEAVY_NOTE` is not the dest stop law.
7. Graft still 4000. Ungraft still absent. NPC `grafted` still off.
8. `bio.growth` still does not remount.
9. `state.js` untouched unless a named catalog PR (out of this serial by default).

Chrome vite verify and `npm run test:boot` are later-impl. Known boot FAILs stay.

---

## Open questions

**None parked.** Wave 101 deputize defaults live in [`out/w101/career/shared-contract.md`](../out/w101/career/shared-contract.md) §2.

- Hangar kit mutate: **omit**.
- Career skins: existing keys in §4.
- Prices: copy live `yardPrice` / outfitter rungs.
- No new Digit. No new class keys.

A successor owner file may reopen §2.2 kit papers. This wave does not wait.

---

## Alternatives

| Alternative | Why rejected |
|---|---|
| Six new `SHIP_CLASSES` rows | Fights READ-ONLY catalog and mount tables |
| Restore living-frigate buy omit | Undoes live Wave 94 SKUs |
| New Career dock Digit | Steals Shipyard or hull 3+ |
| Hangar bundle kit at a new UU | Impersonates owner integers; duplicates Digit 6 |
| Drive class from `bio.growth` | Skips papers, debit, envelope |
| Ace/freighter as a new train verb | Already dests |

---

## Observability

Later impl: desk notice only. No new frozen `ctx.emit`. No career HUD pip. Reduced-motion: no extra pulse (copy only).

---

## Rollout

Wave 102 PR1 labels in `shipyard-desk.js`. Optional later PR3 pins. PR2 skipped until a successor owner file. No feature flag. No `localStorage` kill-switch.
