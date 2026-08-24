## UI Audit: Wave 92 BIO-02 Hangar train papers

### Summary
Beautiful Hangar adds a full-width train row under hull cards. Papers reuse `.shipyard-buy-row.shipyard-confirm`. Hostile and ineligible states use notes, not mute buttons.

### What's done well
- Eligible / short credits: `Train hull` button plus UU
- Hostile: `No sale.` note, no Train button
- Already heavy / off-ladder / built / Unknowables: one note, no stack
- Papers: hop name `light → heavy`, cargo-keep `screen-note`, Confirm papers (warm) before Esc — Cancel
- Non-Beautiful docks hide train chrome
- Digit 1 Hangar / Digit 2 Yard unchanged; Digit 0 Shipyard
- Beautiful Hangar legend appends `Train on Hangar · Esc cancels papers`
- `h()` / `btn()` / `textContent` only

### Findings

No Blocker or Major issues.

#### 🟡 Minor: Mounted-id header remains on papers
**Location:** Hangar pane `Mounted id …` line
**Issue:** Pre-existing header stays while confirm papers replace the hull list.
**Fix:** Out of first-impl scope (graft does the same).

#### 💡 Suggestion: Price on papers uses live `trainListPrice`
Rank discount can change if standing changes between Offer and Confirm. Confirm re-reads debit in `trainMounted`.

### Keyboard
- Esc cancels papers without debit (same gate as graft/yard)
- Digit 3+ no-op while pending
- KeyB undock clears `trainPending`
