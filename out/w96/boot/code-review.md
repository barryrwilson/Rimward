## Code Review: scripts/boot-test.mjs

### Summary
WAVE23 now treats veil as authored, so lmSeparationOk23 never reads empty landmarks. Galaxy and roster pins match 101 systems / 104 contacts / 101 dockmasters.

### What's done well
- Fail-closed: veil is in AUTHORED_IDS23; no fake generated landmark
- hush authored landmark string includes th_veil in live order
- WAVE24 splice-corrupt pin is 103 (104 minus one)
- generatedCount94 and nonHubCount91 stay 94 / 91

### Findings
None at blocker or major.

### Passed
- AUTHORED_IDS23 includes veil
- countOk / nodeCount101 === 101 and equal systemIds.length
- Roster pins 104; dockmaster pins 101; authored names 13
