## UI Audit: Beautiful Market seed papers + Hangar train dests

### Summary
Market seed and Hangar train dests reuse the live Confirm-papers family: real buttons, `textContent`, Esc cancel. No Blocker or Major findings.

### What's done well
- Hostile Beautiful Market paints `No sale.` and hides the seed Offer.
- Seed Offer stays up when credits are short; Confirm refuses with yard copy.
- Hangar lists one Offer per dest (`{from} → {dest}`) and Confirm repeats that hop.
- Rank-gated dests (ace 10, frigate 25) get no Offer.
- Unknowables-faction and grafted hulls get a note, not an Offer.
- Digit 0 remains Shipyard on the dock menu. Market Digit 1 only arms seed papers.
- Gift stays on People. Seed does not add a dock service.

### Findings

#### 🟡 Minor: Five dest Offers lengthen Hangar
**Location:** `src/systems/shipyard-desk.js:426-435`
**Issue:** A living hull can show five dest Offers under the hull list. The pane scrolls with the existing station panel.
**Fix:** Keep as specified (“more than one dest Offer”). No collapse.

#### 💡 Suggestion: Market Q/W still trades while seed papers are armed
**Location:** `src/systems/station.js:5888-5900`
**Issue:** Same as the archive desk: commodity keys stay live during pending papers.
**Fix:** None this wave. Esc cancels seed papers first.

### Keyboard
- Dock Digit 0: Shipyard.
- Market Digit 1: arm seed papers when visible and not pending.
- Esc: cancel seed / train papers, then back.
