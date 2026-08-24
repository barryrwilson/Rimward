## UI Audit: BIO-02 training desk (Wave 86 design freeze)

### Summary

No live UI this wave. Checklist: `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Digit **0 Shipyard**, Hangar Digit **1**. Beautiful Hangar matrix is merge law §4.2 (hostile `No sale.` note, short-credits Offer, no graft hide). `ui.trainPending` dies on live graft chrome sites. Cargo-keep is a pending `screen-note`. Never “not available.”

### What's done well

- Existing Digit map unchanged (`DOCK_KEY_SERVICES` 10 keys; 0 = shipyard).
- Two-step Confirm papers matches yard buy (`shipyard-desk.js` 196–206).
- Hostile copy reuses live yard **`No sale.`** as a Hangar **note** (no Train button). Not graft hide.
- Short credits **keep** the Offer so papers can show dest + cargo-keep.
- Offer **hidden** on non-Beautiful docks (no dead control).
- `h()` / `btn()` / `textContent` (station 4230–4238).
- `reducedMotion` must keep the cargo-keep sentence (not drop the fact).

### Desk freeze (existing Digit, not a new one)

| Control | Live | BIO-02 |
|---|---|---|
| Digit 0 / KeyY | Shipyard | Unchanged |
| Digit 1 (in yard) | Hangar pane | Unchanged |
| Digit 2 | Yard pane | Unchanged |
| Digit 3+ / 0 | Hull mount / papers | Unchanged (mount, not train) |
| Digit 4 (menu) | Feed & tend | Unchanged — **not** training |
| New dock service | — | **Forbidden** |
| Train tab Digit 3 | — | **Forbidden** (steals hull 3+) |
| Train control | — | Full-width Hangar row **after** `hulls.forEach` (graft). Pending **replaces** the list |
| Confirm | — | Pending pane + Confirm papers + Esc |
| Legend (Beautiful Hangar) | — | Append `Train on Hangar · Esc cancels papers` |

Graft already occupies Hangar at Gilded. Train occupies Hangar at Beautiful. They do not share a dock banner. No dual-offer collision. Do **not** copy `graftOfferVisible` reputation early-return.

### Hangar matrix (merge law §4.2 — designer Major 1)

Beautiful banner only. First-match notes (§4.3): Unknowables → built/grafted → off-ladder/already-heavy → hostile `No sale.` Never stack.

| State | Control | Copy |
|---|---|---|
| Eligible + owner UU | `Train hull` button + price | none extra |
| Hostile `rep < 0` | **no** Train button | note `No sale.` |
| Short credits | keep **Offer**; Confirm refuses | `Not enough credits.` |
| Already `heavy` | **no** Train button | `This hull is already as large as this dock trains.` |
| Built / grafted | **no** Train button | `Training is for living hulls.` |
| Unknowables | **no** Train button | `The Unknowables do not train here.` |
| Ace / freighter / frigate living | **no** Train button | `This dock does not train that class.` |
| Owner UU still open | **omit** offer | do not invent a price |
| Non-Beautiful dock | Hide all Train chrome | — |

Credits are a confirm refuse, not a hidden desk.

### Papers

Arm `ui.trainPending = { fromClass, destClass: 'heavy', mountedId }` next to `ui.graftPending`. Confirm pane:

- **Name:** class hop `light → heavy` or `cutter → heavy`. Never `mountedId`.
- **Meta:** `{price} UU · Confirm papers`
- **Note:** `Hold stays with this hull. The yard does not dump cargo.` (own `screen-note`; keep under `reducedMotion`)
- Confirm papers (warm `btn()`, first) / Esc — Cancel

Digit 3+ while pending: no-op (`handleShipyardDigit` 324). Never one-click debit from a hull digit.

### `trainPending` cancel sites (merge law §7.2 — designer Major 2)

| Site | Live graft | Train |
|---|---|---|
| Leave Hangar | `setShipyardPane` 78–79 | Null when pane ≠ Hangar |
| Esc level-2 shipyard | `station.js` 5723 | `cancelTrainPending` in the same `\|\|` gate |
| Esc fallthrough | 5732 | Null with other pendings |
| ← Back | 5628–5635 | Null |
| `selectService` | 5655 | Null |
| `dock` | 5674 | Null |
| `undock` (incl. KeyB) | 5697 | Null |
| Confirm `mountedId` | desk 165–167 | Mismatch → refuse, no debit |
| Confirm redraw | — | `redraw()` so CREDITS/HOLD update |

No new overlay or z-index. Reuse `.shipyard-buy-row.shipyard-confirm`.

### Cargo-keep copy

Mandatory on the pending pane, not only in a later toast. Success notice: `The hull takes the heavy form.` Hold remains visible in the station head (`CREDITS … · HOLD used/cap`, `station.js` 5608–5609) so the player can see units did not drop except at true cap (should not, because capacity is kept).

### Never “not available”

Use the Hangar matrix above. **Forbidden string:** `not available` (and close paraphrases like “N/A”, “unavailable”). No mute disabled Train button.

### Findings

#### 🔴 Blocker (fixed in freeze)

##### B1: “Not available” empty state

**Issue:** A generic disabled Train button on every hangar would fail the owner UI law and hide *why*.  
**Fix applied:** Hangar matrix §4.2. Hide vs one Echo line. No mute button.

##### B2: New Digit / Digit 3 tab

**Issue:** New dock service shifts 5–0. Digit 3 tab fights hull 3+.  
**Fix applied:** Digit 0 reuse; Hangar offer only.

##### B3: Papers skip / cargo silent dump

**Issue:** One-click evolve or a hold wipe without copy is a trust break (wishlist regression).  
**Fix applied:** Two-step papers + cargo-keep sentence.

#### 🟠 Major (fixed in freeze — designer PREVIOUS_BUGS)

##### D1: Hostile / short-credits hangar matrix

**Issue:** §4 “visible only when all gates hold” fought the copy table. `graftOfferVisible` would hide `No sale.`  
**Fix applied:** Contract §4.2 / brief merge table / this matrix. Hostile = note, no button. Short credits = keep Offer.

##### D2: `trainPending` chrome wiring

**Issue:** Esc-only cancel left papers armed after B-launch / Back / Yard tab.  
**Fix applied:** Contract §7.2 names `ui.trainPending`, `cancelTrainPending` on Esc + Back + `selectService` + dock + undock + leave Hangar; confirm `mountedId` + `redraw()`.

##### M1: Contrast / color-only “trained” cue

Do not mark dest only with a green name. Class token is text (`heavy`). Price is numeric UU. Colorblind / high-contrast already wrap station chrome; later CSS must not add a hue-only badge.

##### M2: Hit target

Confirm papers must be a real `<button>` via `btn()`, same as yard. Not a clickable `div`. Live `btn()` already sets `type="button"` (4237–4241).

##### M3: Reduced motion dropping warning text

Graft uses a shorter warn when `reducedMotion` (`GRAFT_WARN_REDUCED`). Train **must not** drop cargo-keep in that branch. Contract §7.3.

#### 🟡 Minor (fixed in freeze)

##### m1: Confirm name / no `mountedId`

Confirm `shipyard-buy-name` is `light → heavy` or `cutter → heavy`. Do not print `mountedId`.

##### m2: Focus order

Pending pane: Confirm before Cancel, matching graft/yard.

##### m3: Layout

Offer after `hulls.forEach`, full-width `shipyard-buy-row`. Pending replaces the hull list.

##### m4: Legend

Beautiful Hangar: `Train on Hangar · Esc cancels papers`.

##### m5: Refuse priority

First match §4.3. Never stack.

#### 💡 Suggestion

Later CSS: reuse `.shipyard-buy-row.shipyard-confirm` (already on graft/yard). Do not invent a new overlay z-index.

### Accessibility (later impl)

- Buttons have visible labels (`1 — Hangar`, `Confirm papers`).
- Notice line should stay a text node in the panel (`station-notice`) — polite live region is optional; do not use `innerHTML`.
- Keyboard: Digit 0 / 1 / Esc only. Do not steal Digit 1–4 weapon map while **undocked**; dock UI already consumes digits when `ui.open` (`station.js` 5704–5718).

### Residual after freeze

None at Blocker/Major. Designer Majors D1 (hangar matrix) and D2 (`trainPending` chrome) are **in merge law**. Owner UU still gates whether Eligible shows a price (omit until PR4 — accepted).
