## Code Review: Wave 107 REP-05 PR3 Digit 9 copy

### Summary
`standingLiveNotes()` now names police leave, covering, and inbound jump refuse with the live LINE / gate constants. Existing hunt, yards, locker, graft, restitution, and Digit 0/9 bind stay. Probe imports `standingLiveNotes` from `station.js` (Node import works with the CSS stub).

### What's done well
- Uses `POLICE_LEAVE_LINE`, `POLICE_LEAVE_RADIUS`, `COVERING_LINE`, `COVERING_STANDING_MIN`, `JUMP_REFUSE_LINE`, `JUMP_REFUSE_STANDING`, `JUMP_REFUSE_SKIP` so copy cannot drift from sim.
- Leave band copy matches live `standing < 0 && standing > -10`. Jump copy names Marked exclusive, skip flags, and open dock.
- Skip names go through `factionDisplayName` (hasOwn) and drop empty names.
- Renderer loop unchanged: `screen-note` + `textContent`.
- No Digit remap, no hail card, no hub child, no `state.js` write.

### Findings

No Blocker or Major issues.

#### 🟡 Minor: `station.js` now imports `jump.js`
**Location:** `src/systems/station.js:78`
**Issue:** Jump already imports `npc.js` and THREE. Station did not need that graph for Digit 9 copy. No cycle today (`npc.js` does not import `station.js`).
**Fix:** Leave as-is this PR (task wants exported LINE constants). Do not extract unless a later cycle appears.

#### 💡 Suggestion: Ace min-rep still uses a literal `10` beside `COVERING_STANDING_MIN`
**Location:** `src/systems/station.js:1183-1184`
**Issue:** Ace copy still says `Known 10` via `ladderNameAt(10)`. Covering uses `COVERING_STANDING_MIN`. Both are 10 live.
**Fix:** None required. Do not retune ace min-rep.

### Passed
- Hunt-at-−10, yards below 0, restitution 1200, locker, graft, ace Known, frigate Trusted still present.
- Digit 0 remains last `DOCK_KEY_SERVICES` entry (`shipyard`). Digit 9 remains `epics`.
- Police-leave / covering / jump behavior files only read for constants.
- `node out/w107/rep05/probe.mjs` exit 0.
- No `standing-notes.js` extract (Node import of `station.js` succeeded).

### Method
Self-applied `orchestrator/references/code-review.md` and `shared/personas/reviewer.md`. Correctness first. Did not spawn a separate reviewer agent.
