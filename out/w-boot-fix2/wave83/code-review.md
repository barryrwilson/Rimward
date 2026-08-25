## Code Review: WAVE83 missiles `toastCopy` capture snapshot

### Summary
Five synthetic `npcFire` missile emits still require exactly one visible `Incoming dart.` toast. `toastCopy` now compares the string snapped at that capture, not the same DOM node after pirate/ace/unk/trader/miner/patrol ticks. Pin keys are unchanged. HUD expire (`TOAST_LIFETIME` 4s) is correct; live ticks overwrite recycled slots.

### What's done well
- Pin not deleted; `toastLiteral` still sources `INCOMING_DART_TOAST = 'Incoming dart.'`
- `toastThrottle` still uses capture `dartToasts.length === 1` and `cannonGrewDart === false`
- Product toast slot recycle left alone (`src/systems/hud.js` `pushToast` / expire)
- `npc-fire-toast.js` gap and copy unchanged

### Findings

#### 💡 Suggestion: capture filter already requires the literal
**Location:** `scripts/boot-test.mjs` WAVE83 missiles `dartToasts` filter and `dartToastText`
**Issue:** The walk already keeps nodes whose `textContent === 'Incoming dart.'`, so a one-element capture always snaps that string. The pin still names the literal so a later filter change cannot drop the copy contract.
**Fix:** Keep. Dual check is the WAVE83 contract.

### Severity mapping
- No Blocker/Major. Suggestion documented; no further code change.
