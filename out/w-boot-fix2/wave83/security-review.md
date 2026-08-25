## Security Review: WAVE83 missiles toastCopy capture snapshot

### Risk Level: Low

### Summary
Harness-only pin. `scripts/boot-test.mjs` WAVE83 missiles stores dart toast copy as a string at capture. No product HUD, persist, or innerHTML change.

### Findings

None at CRITICAL or HIGH.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` (capture still uses `textContent`)
- [x] No new HUD node, persist key, or WORLD_FIELDS
- [x] Literal stays `Incoming dart.` (`INCOMING_DART_TOAST`)
- [x] Digit 2 / 0 / 8 / 9 untouched
- [x] HUD-01 empty hub untouched
- [x] Missile pool, dart cadence, and `npc.js` untouched

### Recommendations
1. Keep WAVE83 `toastCopy` on the capture string, not the live recycled slot.
2. Do not lengthen `TOAST_LIFETIME` to hide later live ticks.
