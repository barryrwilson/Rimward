## Code Review: Wave 94 Unknowables origin dock

### Summary
Authored `veil` docks at The Quiet with a dedicated lens/void station, Archive mirror of Assembly, one dockmaster, and a Models Browser row. Probe `out/w94/unk/probe.mjs` pins the contract. No Blocker or Major defects in the write-set.

### What's done well
- `buildStationMesh` / `buildStationModel` dispatch like Beautiful: `isUnknowable` before `DETAIL_STATIONS`, never placeholder.
- Kit returns through `stationRecord` (beacon at `DETAIL_BEACON_Y`, halo, ringGroup spin).
- `archiveDeskAllowed('unknowables')` is true only while `UNKNOWABLES_STATION_PATH` is true.
- Assembly `archiveFilePrice` is unchanged; Unknowables UU lives in `archivePriceAtDesk`.
- Hostile standing is per dock faction, so Assembly hostility does not close The Quiet.
- Hush clue count stays 2; authored total stays 6; `th_veil` is a landmark only.
- Seed papers, `cancelSeedPending` before `cancelDataPending`, and Digit1 arm are untouched.
- `LIVING_STOCK` is not reverted.

### Findings

#### 🟡 Minor: galaxy chart has no authored label for `veil`
**Location:** `src/systems/galaxychart.js` `AUTHORED_IDS` (outside write-set)
**Issue:** Chart nodes come from `SYSTEMS`, but labels use a hard six-id set. `veil` draws as an unlabeled node.
**Fix:** Orchestrator may add `'veil'` to `AUTHORED_IDS` in a later write-set.

#### 🟡 Minor: old saves keep the persisted roster
**Location:** `src/game/contacts.js` `initContacts` / `save.js` restore
**Issue:** Fresh runs get Voice-Without. A save that already holds a non-empty contacts list does not merge the new authored row.
**Fix:** None in this write-set. Same restore pattern as prior roster growth.

#### 💡 Suggestion: `EPICS` pane is empty at The Quiet
**Location:** `src/game/epics.js` `epicEffects` / station Standing
**Issue:** Wave 94 omits an Unknowables epic. `epicEffects` returns `{}` when `EPICS[faction]` is missing.
**Fix:** None. Empty pane is legal.

### Test coverage
- `out/w94/unk/probe.mjs` pins system/gate/clue/landmark, dedicated dispatch, envelope, Archive own/rival/hostile/illegal, Assembly unchanged, contacts, portrait, catalog, seed chrome, Digit 0, no `EPICS.unknowables`.

### Verdict
Approve. No High/Blocker items to fix.
