# Code Review: Wave 66 PR2 trafficking mutator

**Scope:** `src/game/trafficking.js`, `out/w66/pr2/probe.mjs`
**Pass:** final (no Blocker/Major open).

### Summary
Pure data module matches merge law. Eligibility, lot grouping, Gilded-only debit, frozen UU, victim / Gilded standing, per-lot fear, milestone once, and busy re-entry all hold under the headless probe. No DOM. `pods.js` / `station.js` / `save.js` / `state.js` untouched.

### What's done well
- Frozen `TRAFFIC_LIST_UU` / `TRAFFIC_REP` / `TRAFFIC_FEAR` (same shape as `YARD_LIST_UU`).
- Duplicate `isSurvivorCargo` one-liner instead of importing `pods.js` (no THREE).
- Same `RESERVED_IDS` set as `save.js` / `hangar.js`.
- `trafficLots` groups with a `Map`, not an object keyed by faction.
- Pay tables re-read inside apply; lot objects from `trafficLots` cannot author UU.
- Remove filters eligible + faction + normalized source (does not call `removeSurvivorsForFaction`).
- Gilded victim applies both deltas; `repDelta` stays victim-only.
- Fear clamp + `fearChanged` matches `npc.js` `bumpFear` shape.
- Probe covers the contract pins including re-entry busy, parked hangar, and mixed lots.

### Findings

#### 🟡 Minor: `isTrafficEligible` does not floor a bad `cap` argument
**Location:** `src/game/trafficking.js` `survivorUnitCount` 47–52
**Issue:** Direct callers that pass `NaN` treat `u > cap` as false, so a finite stack can look eligible. `trafficLots` / apply always pass `holdCap(ctx)`.
**Fix:** Optional: reject non-finite `cap` inside `isTrafficEligible`. Not needed for the sale path.
**Status:** open — sale path uses `holdCap`.
**Justification:** Matches `station.js` `survivorUnitCount` 937–941. PR3 should not call eligibility with a raw cap.

#### 💡 Suggestion: `addRep` skips a true `0` victim write
**Location:** `src/game/trafficking.js` 78–81
**Issue:** `other` victim delta is 0, so the victim key is left unchanged (including absent).
**Fix:** None required. Adding 0 is a no-op.
**Status:** open
**Justification:** Probe `victimOther0` pins the observable standing.

#### 💡 Suggestion: busy flag is process-global
**Location:** `src/game/trafficking.js` 28, 201–208
**Issue:** One in-flight sale for the module, not per `ctx`.
**Fix:** None. One player, one desk.
**Status:** open
**Justification:** Same pattern as `shipyard.js` `buyInFlight`.

### Resolved this pass
1. **Major (fixed in impl):** a post-remove `total` refuse could drop cargo with no credit. Apply now pays `unitPrice * count` after a non-zero remove. Overflow / non-finite purse is refused **before** remove.

### Test coverage
Probe `out/w66/pr2/probe.mjs` (all-true, exit 0):

- other 160 / playerKill 240
- victim 0 / −8, gilded +2 per unit, gilded victim net
- fear +1 / +2 per lot; clamp 0..100
- unknowables / `__proto__` / reserved / oversize / empty / non-Gilded / non-finite credits
- mixed lots sell one; oversize sibling of the same pair stays
- double apply: in-flight re-entry null; same lot after success null
- parked hangar ignored
- milestone once
- `world.prices` unused
- no `reputation['__proto__']` write
- name not interpolated; no `atrocity`

### Verdict
Approve for PR3 (People desk). Do not bind Digit-complete sale. Recompute lots at Confirm.
