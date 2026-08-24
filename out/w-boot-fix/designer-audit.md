## UI Audit: station overlay (people fence favor, gift papers, Digit0/Digit2, shipyard train)

### Summary
People fence favor, gift papers, Digit0 Shipyard, Digit2 from market, and Hangar train papers keep a two-level desk with Confirm papers plus Esc cancel. Keyboard reach, empty/error copy, and focus rings are usable. No Blocker or Major defects on these paths.

### What's done well
- Level-1 menu labels Digit0 as `0 — Shipyard` (`station.js:5886-5890`).
- Market Digit2/Digit0 still pick dock services (`station.js:6063-6074`); Digit1 stays seed papers.
- Gift arm uses `GIFT_ARM_LINE` and Confirm papers; Esc — Cancel and keyboard Esc call `cancelGiftPending` (`station.js:5587-5598`, `6031-6033`).
- Train confirm shows `{from} → {dest}`, price, cargo-keep note, Confirm papers (`shipyard-desk.js:377-395`).
- Hangar legend names `Train on Hangar`, `Train hull`, and `Esc cancels papers` on Beautiful docks (`shipyard-desk.js:458-461`).
- Yard Digit 3+/0 arms papers only; Confirm papers buys (`shipyard-desk.js:466-486`).
- Fence / keeper / generated dockmaster share the `Call in a favor` label; spent-marker errors go through `ui.notice` (`station.js:5676-5718`).
- Overlay buttons are real `<button type="button">` with `.screen-btn:focus-visible` rings (`station.js:4357-4361`, `screens.css:95-99`).
- Notices use `aria-live="polite"` (`station.js:5918-5920`).
- Yard empty catalog, hostile yard, empty People, locker refusal, and train refuse notes are plain text, not `innerHTML`.
- Portraits expose `alt` from name and role (`station.js:5640-5642`).
- Graft confirm shortens the hunt warning when reduced motion is on (`shipyard-desk.js:361-366`).

### Findings

#### 🟡 Minor: Unarmed gift card already says Confirm
**Location:** `src/systems/station.js:5601-5603`
**Issue:** The unarmed Sworn gift card repeats `The berth answers. Confirm the sworn gift.` Market seed unarmed shows price only (`station.js:4620-4622`). The gift meta reads as if papers are already armed.
**Fix:** Keep `GIFT_ARM_LINE` on the pending row and `ui.notice`. On the unarmed card, use a quieter berth line (price 0 / Papers).

#### 🟡 Minor: First Esc after berth does not launch
**Location:** `src/systems/station.js:6011-6013`, legend `5899`
**Issue:** `justDocked` eats the first Escape on the services list. Legend still says `Esc/B launch`. KeyB still launches. Digit0 still reads `0 — Shipyard`.
**Fix:** Keep for the WAVE92 pin, or change the level-1 legend to `Esc once, then Esc/B launch`.

#### 🟡 Minor: Legend says Esc back while papers are armed
**Location:** `src/systems/station.js:5915`; `src/systems/shipyard-desk.js:458-461`
**Issue:** Keyboard Esc cancels pending gift / train / yard / graft papers and stays on the desk. The level-2 legend still says `Esc back`. Shipyard adds `Esc cancels papers` only on Beautiful Hangar, not Yard papers or Gilded graft. The confirm row `Esc — Cancel` is the true copy. Click `← Back (Esc)` leaves the service and drops pending (`station.js:5902-5912`).
**Fix:** When any pending papers flag is set, set the legend to `Esc cancels papers`. Keep Back as leave-service, not as a second Esc twin.

#### 🟡 Minor: Call in a favor stays live at 0 markers
**Location:** `src/systems/station.js:5679-5700`
**Issue:** Fence and keeper still render a live button when `favors` is 0. Click then writes the hands-spread notice. Error copy is clear. Disabled / hover / focus-on-disabled is missing. The notice sits under the legend (`station.js:5918`), so a long People list can hide it until scroll.
**Fix:** Set `disabled` (or `aria-disabled`) when `favors <= 0`. Keep the same refuse line. Optionally pin `station-notice` under the head.

#### 🟡 Minor: Confirm papers does not take focus after Digit arm
**Location:** `src/systems/station.js:5863-5872`; gift `5591`; train `shipyard-desk.js:388`; yard `324`
**Issue:** `render()` rebuilds the overlay and drops focus. Digits must not debit (correct). After Digit1 gift or Digit 3+ papers, Enter does not confirm until the user Tabs to Confirm papers.
**Fix:** After arm, `focus()` the Confirm papers button. Do not bind a digit to debit.

#### 💡 Suggestion: Market legend hides Digit2 / Digit0
**Location:** `src/systems/station.js:5915` vs `6063-6074`
**Issue:** Digit2 from market opens Jobs. Digit0 opens Shipyard. Level-2 legend is the generic Esc line. That jump also drops armed seed/archive papers via `selectService`.
**Fix:** On market only, add `2 Jobs · 0 Shipyard`. Keep the jump; it is the Digit2 pin.

#### 💡 Suggestion: Overlay has no accessible name
**Location:** `src/systems/station.js:4315-4317`
**Issue:** The dock overlay is a `div` with no `role`, `aria-modal`, or `aria-label`. Digit hotkeys still work. Buttons have names.
**Fix:** Set `role="dialog"`, `aria-modal="false"` (world still ticks), and label from the station title.

### Severity mapping
- 🔴 Blocker: 0
- 🟠 Major: 0
- 🟡 Minor: 4
- 💡 Suggestion: 2
