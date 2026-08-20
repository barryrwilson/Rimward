## Code Review: out/w63/shp-01-shipyards.md

### Summary
Design note matches locked HUD `hullKind` law and current `DOCK_KEY_SERVICES` order. FIRST SLICE vs LATER DEPTH are labeled. No source diffs. Blocker contradictions found in review were fixed in the note (hangar stub fail-closed, restore remount allowlist).

### What's done well
- Cites `station.js` 116 and the Wave 6 append precedent.
- Recommends APPEND, and names the digit-key regression table.
- Does not replace the living starter. Unknowables stay `'living'`.
- Prices from authored floors, not `bookValue`.
- Generated docks do not dump `SHIP_CLASSES`.
- PR plan reports `state.js` as read-only for feature workers.

### Findings

#### 🟡 Minor: Patrol-rep default reaches outside SHP-01
**Location:** §5, Q2
**Issue:** Default freeze proposes awarding `PATROL_REP` to dock faction. Today `tickPatrolJob` writes `reputation.freehold` only (`station.js` 1305).
**Fix:** Keep it an owner freeze. FIRST SLICE still plays if only Freehold Known is reachable.

#### 💡 Suggestion: `Digit0` later may surprise numpad users
**Location:** §1
**Issue:** Some layouts fire `Digit0` for other chrome. FIRST SLICE has no tenth key, so no break.

### Locked-decision check
- [x] `hullKind` `'built' | 'living'`; SHP writes; HUD reads; HUD never writes
- [x] Unknowables purchased hulls `'living'`
- [x] Unset kind stays living-HUD default
- [x] Living starter not replaced by a plated hull
- [x] Digit keys: append only
- [x] Hangar persist schema not specified
- [x] Loadouts named only as “stock loadout by hull”
- [x] `state.js` changes reported, not taken
