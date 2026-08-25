## Security Review: PHY-04 remaining NPC avoid (Wave 109)

### Risk Level: Low

### Summary
Live two-sample lookahead and frame hold retarget stay in `npc.js`. No persist blob, no DOM, no freeze-in-place, no extra bag alloc. Bag kinds stay engine `===` tests. No CRITICAL or HIGH.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` and persona `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Did not spawn `[security-auditor]`.

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟢 LOW: Chord-through dest does not rewrite hold

**Location:** `src/systems/npc.js` `writeFrameHold` (stationKeepOutHits then `stationCylHits` on dest)

**Issue:** Hold rewrite needs dest inside the D5 cylinder. A gate dest whose XZ chord only punches the cylinder keeps live keep-out, not a hold rewrite. That avoids parking a trader on a hold while `dist < 25` would skip the gate waypoint.

**Impact:** None for secrets, persist, or freeze-in-place. Hulls still move.

**Fix:** None. Fail-closed dest + keep-out. Do not persist a detour.

**Status:** documented; not blocking

### Passed Checks
- [x] No persist blob / no `WORLD_FIELDS` avoid key
- [x] No `for-in` merge from save into avoid state
- [x] Bag `kind` compared with `===` (`station|gate|...`); no `obj[kind]()` dispatch
- [x] No extra `{ count, items }` alloc in `applyAvoidBias`
- [x] Missing bag / `!_phyOn` / missing writer → dest or live 40 u bias; never `speed = 0`
- [x] No new DOM / `innerHTML`
- [x] No secrets, API keys, or player-name logs beside `avoidHits`
- [x] Digit 0/8/9 unused
- [x] `state.js` not written

### Recommendations
1. Keep avoid as live steering. Do not add a save field later.
2. Playtest PR3 80 u only if rocks still ram on long chords.
