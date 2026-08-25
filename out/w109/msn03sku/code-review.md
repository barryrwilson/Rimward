## Code Review: Wave 109 MSN-03 remaining unique SKU grants

### Summary
PR1–PR4 match the Wave 108 merge law. Veridian seats `auto`, Hollow seats `dart`, light fail-closed +2 UU, Digit 2 hint uses catalog names. No Blocker/Major product defects.

### What's done well
- `CHAIN_GRANT` freeze reuses live ids and the live row shape.
- `grantChainSku` is boolean-only and verifies the seated field.
- Fail UU lives only in `finishChainStep` after `parsed.step < 3` returns.
- Jobs copy stays on Digit 2, uses `h()` / `textContent`, and never prints 6500/4200.
- Probe and WAVE109 boot pins cover proto drop, unique-four no-grant, Digit 0/2/8/9, and persist freeze.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 🟡 Minor: WAVE83 last-step pins now disagree with live grants
**Location:** `scripts/boot-test.mjs:18438-18511` (WAVE83 STATION, out of this worker’s write set)
**Issue:** Wave 83 still expects light last-step credits `+ payQuoted` only, and Veridian/Hollow last-step to seat no SKU. Wave 109 adds +2 UU on grant false and seats Veridian `auto` / Hollow `dart` when `canSeat`.
**Fix:** A later boot-hygiene wave may retune those three WAVE83 pins. Do not rewrite WAVE83 in this leftover.

#### 💡 Suggestion: `parseChainId` runs twice on each chain card
**Location:** `src/systems/station.js:5126` and `5236`
**Issue:** Title copy and SKU hint each parse the id.
**Fix:** Optional later share of one parsed value. Not load-bearing.

### Verdict
Approve. Contract law holds. Unique four, chain splice, shop prices, `state.js`, and Digit 0/8/9 stay closed.
