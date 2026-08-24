## UI Audit: Hangar train dest Offers + Beautiful Market seed papers

### Summary
Hangar lists one dest Offer per living class and Confirm repeats `{from} → {dest}`. Seed papers sit on Beautiful Market; sworn gift stays on People. Copy uses `textContent`. No Blocker. No Major.

### Scope
- `src/systems/shipyard-desk.js` Hangar dest Offers and Confirm
- `src/systems/station.js` `renderSeedPapers` / `renderMarket` / People gift / keys
- `src/ui/screens.css` dock chrome (`.shipyard-*`, `.screen-btn`, focus)
- Owner Wave 94 §1–§3

### Checklist

| Check | Result |
|---|---|
| Multiple dest Offers | Pass. `trainPaint` returns `dests[]`; Hangar loops one card per dest. |
| Confirm `{from} → {dest}` | Pass. Offer name and Confirm name use the same hop. |
| Hostile `No sale.` | Pass. Train note; Beautiful Market seed note; Offer hidden. |
| Seed papers vs gift People | Pass. Seed is Market only. Gift is People only. |
| `textContent` | Pass. `h()` writes `textContent`. No `innerHTML` on these desks. |
| Focus | Partial. Real `<button>` + `:focus-visible`. Full-panel rebuild drops focus. |
| Reduced-motion | Pass for this slice. No extra pulse on train or seed. Graft already shortens copy. |

### What's done well
- Dest Offers are extra Hangar cards. Digit 0 stays Shipyard on the dock menu (`station.js:5861-5863`).
- Same-class dests never appear (`livingTrainDests` skips `fromClass`; `setTrainPending` refuses same class).
- Rank-gated dests (ace 10, frigate 25) get no Offer (`shipyard-desk.js:224-226`).
- Hostile Beautiful train paints `No sale.` and does not list Offers (`shipyard-desk.js:222`).
- Unknowables-faction and grafted / non-living hulls get a note, not an Offer (`shipyard-desk.js:211-216`).
- Train Confirm is exclusive: pending returns before hull Mount rows (`shipyard-desk.js:376-395`).
- Confirm hop is `{from} → {dest}` (`shipyard-desk.js:381, 384, 427-429`).
- Short credits keep the Offer; Confirm refuses with yard copy (`TRAIN_REFUSE_LINES.credits`).
- Seed is not a `COMMODITIES` row. Gift remains `renderGiftPapers` on People (`station.js:5473`).
- Hostile Beautiful Market hides the seed Offer and paints `No sale.` (`station.js:4491-4494`).
- Seed Offer stays when the hangar is full; Confirm uses `The hangar is full.`
- `h()` always uses `textContent` (`station.js:4246-4251`). Labels are class keys and frozen lines.
- Buttons are `type="button"` with `.screen-btn:focus-visible` outline (`screens.css:96-99`).
- Train / seed Confirm add no turntable preview and no CSS animation. Reduced-motion has nothing extra to freeze.

### Findings

#### 🟡 Minor: Five dest Offers lengthen Hangar
**Location:** `src/systems/shipyard-desk.js:426-435`
**Issue:** A living hull can show five dest cards under up to eight hull rows. `.shipyard-hull` and `.shipyard-buy-row` share the same chrome (`screens.css:385-392`). The pane already scrolls (`.screen-panel` `max-height: 82vh`).
**Why it matters:** Mount and Offer read as the same card family. Owner allows more than one dest Offer.
**Fix:** Keep the list. Optional later: a `TRAIN` `screen-sub` above the dest cards. Do not collapse dests.

#### 🟡 Minor: Train dests have no digit
**Location:** `src/systems/shipyard-desk.js:431-434` and `469-496`
**Issue:** Digits 3+ / 0 Mount hangar rows. Digit 1/2 switch panes. Dest Offers are click / Tab only. After click, `render()` rebuilds the overlay (`station.js:5731`) and focus is not restored. A 1 s dock refresh also calls `render()` (`station.js:5985-5987`).
**Why it matters:** Keyboard reach to Confirm is Tab onto a button that the rebuild can drop. Mouse Confirm still works. Owner did not assign dest digits (Digit 0 stays Shipyard).
**Fix:** Optional: focus the Confirm papers control after arming. Do not steal Digit 0.

#### 🟡 Minor: Seed Confirm does not lock Market
**Location:** `src/systems/station.js:4496-4508` and `4520-4546`; keys `5889-5901`
**Issue:** Hangar train Confirm returns early and hides Mount. Seed Confirm paints the box, then the commodity table and archive still render. Q/W/A/S still trade. Archive can arm a second Confirm on the same panel.
**Why it matters:** Two warm Confirm actions can sit on one Market. Esc cancels seed first (`station.js:5874`), then archive.
**Fix:** None required this wave if the archive desk is the precedent. Esc already cancels seed papers first.

#### 💡 Suggestion: Hostile seed `No sale.` has no seed name
**Location:** `src/systems/station.js:4491-4494`
**Issue:** On hostile Beautiful, the note is only `No sale.` above a live commodity table. Yard / train use the same copy family.
**Why it matters:** A reader can read the whole Market as closed. Trade buttons still work.
**Fix:** Optional: `Living seed · No sale.` Owner copy is `No sale.` — do not change unless the owner asks.

#### 💡 Suggestion: Overlay rebuild drops focus
**Location:** `src/systems/station.js:5722-5731` and `5985-5987`
**Issue:** Dock chrome wipes `overlay.textContent` and does not call `focus()`. Seed Digit 1 can still arm without focus. Train dests cannot.
**Fix:** Out of this write-set unless Hangar dests get a focus restore on Confirm.

### Keyboard
- Dock Digit 0: Shipyard. Unchanged.
- Market Digit 1: arm seed papers when visible and not pending.
- People Digit 1: arm sworn gift. Unchanged.
- Hangar 1 / 2: Hangar / Yard. 3+ / 0: Mount only.
- Esc: cancel seed / train / gift papers, then back.

### Reduced-motion
- `screens.css` has no `@keyframes` on `.shipyard-confirm` or Market seed cards.
- Train Confirm has no graft-style warn, so no reduced copy branch.
- Archive already shortens its subhead (`station.js:1353-1358`). Seed does not need that.
- Station mesh still freezes under `ctx.settings.reducedMotion` (`station.js:5955-5975`). Unrelated to these desks.

### Theming
- New cards reuse `.shipyard-buy-row` / `.shipyard-confirm`. Confirm uses cyan `border-left` (`screens.css:409-411`).
- High-contrast already lifts `.shipyard-buy-meta` (`screens.css:601-606`).
- Hardcoded card fill `#0d1522` is old dock chrome, not new tokens.

### Verdict
Approve Hangar dest Offers and Beautiful Market seed papers for UI. No Blocker. No Major. Gift stays on People. Confirm hop matches `{from} → {dest}`. Hostile paints `No sale.`
