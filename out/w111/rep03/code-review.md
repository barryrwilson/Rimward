## Code Review: Wave 111 REP-03 PR1 Digit 9 climb copy

### Summary
`standingRemedialNotes()` names live +2 job families as the climb from restitution 0. `renderEpics` prints those lines under HOW STANDING MOVES with fail-closed `typeof` + try/catch. Restitution stays gated on standing `< 0`. Digit 0/2/8/9, `state.js`, and `MINING_REP` / `RESTITUTION_UU` stay.

### What's done well
- Climb notes sit after HOW STANDING MOVES, not inside the `< 0` RESTITUTION block, so they remain at standing 0 and standing > 0.
- Copy uses live `MINING_REP`, `PATROL_REP`, `ladderNameAt(-10)` / `ladderNameAt(10)`, and `factionDisplayName` (Beautiful Ones / Freehold Compact).
- Fail-closed: missing or throwing helper still paints `standingMoveNotes` / `standingLiveNotes` and Pay restitution.
- `h(..., textContent)` only. No `kind: 'remedial'`. No new persist key. No Digit steal.
- Isolated `out/w111/rep03/probe.mjs` and `wave111-pins.mjs` do not dock the live game.

### Findings

No Blocker or Major issues.

#### 🟡 Minor: Climb copy duplicates mining +2 already in move notes
**Location:** `src/systems/station.js` `standingMoveNotes` mining line vs `standingRemedialNotes`
**Issue:** HOW STANDING MOVES already says mining jobs add +2 to the dock flag. The new lines add families, Jobs board, Known 10, graft, and patrol-Freehold-only.
**Fix:** None this PR. Contract wants the after-0 loop named, not a move-notes rewrite.

#### 💡 Suggestion: `typeof standingRemedialNotes === 'function'` is always true while the export lives in this module
**Location:** `src/systems/station.js` `renderEpics`
**Issue:** Same-module `typeof` is the named fail-closed pattern. It protects a later delete of the helper without blanking Standing.
**Fix:** Keep. Do not call the helper unguarded.

### Passed
- Restitution subhead still only when `standingRead(...) < 0`.
- Digit 0 `shipyard`, Digit 2 `jobs`, Digit 8 `launch`, Digit 9 `epics`.
- `const MINING_REP = 2`, `const PATROL_REP = 5` untouched.
- No `REMEDIAL_` in `state.js`.
- `node out/w111/rep03/probe.mjs` PASS. `node out/w111/rep03/wave111-pins.mjs` WAVE111 REP-03 PASS.

### Method
Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` plus persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did not spawn a separate reviewer agent.
