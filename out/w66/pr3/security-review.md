# Security Review: Wave 66 PR3 Gilded People transfer desk

**Scope:** `src/systems/station.js`, `out/w66/pr3/probe.mjs`
**Mode:** Deep audit (XSS via name/faction, Digit-complete debit, pending buyer vs live dock, innerHTML, proto keys in pending, double-click).
**Pass:** final (no HIGH/CRITICAL to fix).

### Risk Level: Low

### Summary
The desk is fail-closed. Offer writes a two-key RAM literal. Confirm re-reads own pending keys and pays only through `applySurvivorSale(..., currentDef.faction)`. Digits do not debit. `h()` stays `textContent`. `row.name` never reaches the panel.

### Findings

#### 🟢 LOW: `renderTrafficDesk` is a public debit helper
**Location:** `src/systems/station.js` `renderTrafficDesk` 1041–1098
**Issue:** A caller can pass `dockFaction === 'gilded'` and a fake `ui` without the station overlay.
**Impact:** Local sim. The mutator already requires a gilded dock argument and a live eligible lot.
**Status:** open — probe uses the export; boot does not expose it on `window`.
**Justification:** Same class as exported `applySurvivorSale`. No network.

#### 🟢 LOW: vanished-pending sets `ui.notice` during render
**Location:** `src/systems/station.js` 1050–1052
**Issue:** A stale proto / empty pending clears during paint and writes the vanished line.
**Impact:** No debit. Notice is a static string.
**Status:** open
**Justification:** Fail-closed for a vanished lot. Confirm click uses the same copy.

### Resolved this pass
1. **HIGH (closed in impl):** proto-inherited pending keys cannot arm a lot. `pendingLotKey` requires `Object.hasOwn` on `faction` and `source`. Probe: `protoPendingNoConfirm`, `protoFactionPendingDropped`.
2. **HIGH (closed in impl):** Confirm does not trust `ui.trafficPending` as buyer. `dockFaction` is the live dock (`currentDef.faction`). Non-gilded draw grows no Confirm. Probe: `liveDockNotPendingBuyer`, `confirmUsesLiveGilded`.
3. **HIGH (closed in impl):** `row.name` / HTML payloads never enter lot copy. `h()` assigns `textContent`. Probe: `noRowName`. Faction display uses `FACTIONS[faction].name` after `Object.hasOwn`.
4. **HIGH (closed in impl):** People level-2 has no Digit handler. Digit 0 does not open Shipyard at level 2. Confirm is click-only. Probe: `peopleHasNoDigitHandler`, `dockKeyPeopleIndex6`.
5. **HIGH (closed in impl):** `ui.trafficBusy` plus `!ui.trafficPending` refuse a second Confirm. Trafficking `saleInFlight` still blocks re-entry. Probe: `busyNoDebit`, `doubleClickNoSecondDebit`.
6. **HIGH (closed in impl):** `priceOf` returns 0 for `'survivor'` before any `world.prices` read. `tryTrade` still refuses. `removeCargo('survivor')` still no-ops.

### Passed checks
- [x] No secrets in station / probe
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` on desk nodes
- [x] `h()` uses `textContent`
- [x] No `row.name` interpolation
- [x] No raw faction id when a FACTIONS name exists
- [x] Pending literal keys `faction` + `source` only
- [x] Pending read uses `Object.hasOwn`
- [x] Buyer is live `dockFaction === 'gilded'`
- [x] Digits do not debit
- [x] `DOCK_KEY_SERVICES` stays 10 keys; People is index 6; last is Shipyard
- [x] Double-click / busy do not second-debit
- [x] Unknowables / proto / empty / non-Gilded fail closed
- [x] Copy has no forbidden UI words (slave, meat, stock, bargain, special, debug)
- [x] No new `WORLD_FIELDS`; pending is RAM on `ui`

### Recommendations
1. PR4: toast / `commLine` stay `textContent`. Do not print `row.name`.
2. PR5: live overlay pins (Gilded Digit 7, Freehold no Offer, Market A/S).
