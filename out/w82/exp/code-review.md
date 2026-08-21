## Code Review: Wave 82 EXP economy (drop / Archive / launder)

### Summary
Drop 0.20, Archive 400/900, and fixer launder 250 match the owner freeze. Fail-closed spawn and desk paths match the merge law. No Blocker or Major remains after unit-cap and proto-own-key fixes.

### What's done well
- Authored UU lives in `data-trade.js` and station imports it. `state.js` is untouched.
- `spawnDataPod` writes one captured row, matching hull token, 4-arg steel pod.
- Confirm recomputes the lot, uses `dataBusy` / `launderBusy`, and restores sell units if credit add overflows.
- People Digit 7 launder sits on the fixer card. No new Digit. No Gilded helper.

### Findings

#### 🟡 Minor: `data-trade.js` imports `pods.js`
**Location:** `src/game/data-trade.js:3`
**Issue:** `pods.js` already imports `data-trade.js`. The cycle is lazy (spawn only after init). The Wave 82 probe loaded both modules.
**Fix:** Leave it. A later owner can move `spawnDataPod` next to `spawnSurvivorPod` if the cycle becomes a load bug.

#### 🟡 Minor: Wave 74 boot pin still expects spawn skip
**Location:** `scripts/boot-test.mjs` (read only)
**Issue:** `spawnSkip` still wants `hasDataDropRate() === false` and `spawnDataPod(...) === null`.
**Fix:** Out of scope. Do not edit `boot-test.mjs` in this write-set.

#### 💡 Suggestion: Display merge does not cap units
**Location:** `src/systems/station.js:1156`
**Issue:** `dataHoldLots` does `lots[j].units += row.units` for the desk list. Pay helpers cap. Display does not.
**Fix:** Optional. Sanitize already caps each source row.

### Re-run
First pass Major was unit overflow on stack merge. `addDataCargoRow` and `launderDataLot` now cap with `sanitizeUnits`. Desk lots no longer spread extra keys. Verdict: approve.
