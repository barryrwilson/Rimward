# Code Review: Wave 66 PR3 Gilded People transfer desk

**Scope:** `src/systems/station.js`, `out/w66/pr3/probe.mjs`
**Pass:** final (no Blocker/Major open).

### Summary
People level-2 grows a Gilded transfer desk after Return. Gate is fail-closed. Offer arms `{ faction, source }`. Confirm recomputes lots and pays `TRAFFIC_LIST_UU` through `applySurvivorSale` with the live dock faction. Digits stay inert. Market `priceOf('survivor')` is 0.

### What's done well
- Gate `ui.level === 2 && ui.service === 'people'` before any transfer nodes.
- `renderPeople` calls `renderTrafficDesk` after `renderRescue`. Level-1 home stays Return-only.
- Pending is a two-key literal. Confirm reads own keys only.
- Live `currentDef.faction` is the buyer. Pending is never the buyer.
- Frozen lot copy. `FACTIONS[faction].name`. No `row.name`.
- Esc cancels pending and stays on People. Back / `selectService` / undock / dock clear RAM fields.
- `requestAutosave` after a successful payload (same gates as the yard).
- Isolated probe covers priceOf, digit law, chrome gates, proto pending, busy, and double-click.

### Findings

#### 🟡 Minor: vanished pending writes `ui.notice` during paint
**Location:** `src/systems/station.js` 1050–1052
**Issue:** `renderTrafficDesk` mutates notice while `render()` builds the panel.
**Fix:** Optional: clear pending only and let Confirm click set the vanished line.
**Status:** open
**Justification:** Contract wants the vanished line when the lot is gone. Notice is a static string.

#### 💡 Suggestion: `renderTrafficDesk` is exported
**Location:** `src/systems/station.js` 1041
**Issue:** Extra public surface beyond the overlay closure.
**Fix:** None required. Probe needs a DOM-free entry.
**Status:** open
**Justification:** Matches `renderShipyardDesk` host injection (`h` / `btn`).

### Resolved this pass
1. **Major (fixed in impl):** a second Confirm on a stale button after success no longer overwrites the success line or attempts a second debit. `confirmTrafficTransfer` returns when `trafficBusy` or pending is missing.

### Test coverage
Probe `out/w66/pr3/probe.mjs` (all-true, exit 0):

- `priceOf('survivor') === 0` with stuffed `world.prices.survivor = 999`
- `DOCK_KEY_SERVICES` length 10, People index 6, last Shipyard
- trafficking import
- tryTrade refuse / removeCargo no-op / priceOf first line (source pin)
- level-1 / wrong service / non-Gilded / empty hold hide chrome
- ineligible-only refuse
- lot line, Offer, Confirm copy; reduced copy
- pending allowlist; proto pending dropped
- Confirm pays 160 / 240 list UU
- live dock buyer; busy no debit; double-click no second debit
- vanished lot; Esc cancel helper

### Verdict
Approve for PR4 (HUD toast) / PR5 (boot pins). Do not bind Digit-complete sale.
