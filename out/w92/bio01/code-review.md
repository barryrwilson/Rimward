## Code Review: BIO-01 remaining obtain (gift + pirate seed)

### Summary
Helpers match the Wave 86 merge law: hangar row persist, Sworn gift once, pirate fail-closed at 0.05, no remount, no cargo SKU. People desk is two-step papers. NPC only calls the pirate helper on player destroy or dump.

### What's done well
- `grantLivingSeedRow` sanitizes, refuses cap 8, parks, restores `mountedId`, autosaves.
- Gift gates use live `rankFor` + `dockReputation` + Beautiful banner.
- Pirate latch `ai.pirateSeedRolled` blocks dump-then-destroy doubles.
- Rate is named `PIRATE_SEED_DROP_RATE = 0.05`. `DATA_DROP_RATE` is not copied.
- Boot pins cover grant, already, full, rank refuse, forced rng, HUD/Digit 0 source pins.

### Findings

#### 🟡 Minor: Unarmed gift row repeats the arm line
**Location:** `src/systems/station.js` `renderGiftPapers`
**Issue:** The papers card meta uses `GIFT_ARM_LINE` before confirm. Confirm still needs a second click.
**Fix:** Optional later: a shorter unarmed meta. Copy is still the contract arm line.
**Justification:** Two-step confirm remains. No extra invented success/fail strings.

#### 💡 Suggestion: `grantLivingSeedRow` sanitizes twice
**Location:** `src/game/hangar.js`
**Issue:** Helper sanitizes the raw row, then `addPurchasedHull` sanitizes again.
**Fix:** Leave it. Yard buy uses the same belt.

### Passed
- No THREE in hangar/bio-seed
- No `combat.js` edit
- No `state.js` edit
- Kill standing stays `applyPlayerKillStanding`
- Digit 0 stays shipyard; People Digit 1 arms only while the gift row is visible

### Re-review (Wave 92 pin fix)
The WAVE92 `srcPins.rate` fail was a comment that named `DATA_DROP_RATE`. Comment now says "archive data-drop constant". Rate is still 0.05. No Blocker/Major. Pin left unchanged.
