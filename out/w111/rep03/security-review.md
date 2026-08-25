## Security Review: Wave 111 REP-03 PR1 Digit 9 climb copy

### Risk Level: Low

### Summary
Digit 9 adds a copy-only `standingRemedialNotes` helper and prints it with live `h()` `textContent` under HOW STANDING MOVES. The helper does not write reputation, persist, or UU. Faction names use hardcoded keys through `factionDisplayName` (`Object.hasOwn(FACTIONS, key)`). No `innerHTML`. No new `WORLD_FIELDS`.

### Findings

No CRITICAL or HIGH issues.

#### 🟢 LOW: Fail-closed `catch` swallows helper throws
**Location:** `src/systems/station.js` `renderEpics` climb try/catch
**Issue:** If `standingRemedialNotes` throws, Digit 9 still paints Pay restitution plus `standingMoveNotes` / `standingLiveNotes`. The catch does not log.
**Impact:** Availability over diagnostics. Contract §0.16 requires never throw / never blank Standing. No user HTML path.
**Fix:** None this PR. Do not add `innerHTML` or player-name logs later.
**Status:** open (documented; fail-closed by design)

### Passed Checks
- [x] No secrets in code (`station.js` helper / `renderEpics` climb path)
- [x] No `innerHTML` in `station.js`
- [x] `h()` still sets `node.textContent = text`
- [x] Climb lines are authored strings + live `MINING_REP` / `PATROL_REP` / `ladderNameAt`
- [x] `factionDisplayName('beautiful')` and `factionDisplayName('freehold')` only; `Object.hasOwn(FACTIONS, key)`
- [x] No user-string indexing into reputation bags
- [x] No `for-in` merge from save reputation in the new helper
- [x] `__proto__` / `constructor` / `prototype` not used as faction keys in the helper
- [x] Helper does not call `writeFactionStanding` or debit UU
- [x] No new `WORLD_FIELDS`, `wanted`, `remedial`, or `localStorage` key
- [x] Digit 0/2/8/9 bind untouched
- [x] Restitution `< 0` block still independent of climb notes
- [x] Empty hub: no new `.rw-reticle` child
- [x] No `kind: 'remedial'`

### Recommendations
1. Keep Digit 9 notes on `textContent` / `h()`.
2. Keep fail-closed: missing helper must not blank Standing.

### Method
Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` plus persona `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Focus: innerHTML/XSS on Digit 9 notes, prototype pollution on reputation bags, no user-string indexing without `Object.hasOwn(FACTIONS, key)`. No `[security-auditor]` spawn tool in this worker.
