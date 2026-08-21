## Code Review: REP-04 kill attribution (Wave 80 first impl)

### Summary
PR1–PR4 landed fail-closed. Helper, single `handleDestroyed` bind, and WAVE80 boot pins match merge law. Delta stays `null`. Digit 9 copy is unchanged.

Method: self-applied `reviewer` persona plus `code-review.md`. No UI Digit 9 change; design audit not applicable.

### What's done well
- Delta gate is first; every call returns `{ ok: false, reason: 'no-delta' }` until an owner integer exists.
- Write shape matches trafficking `canWriteRep` + `standingRead`. Never `standingOf`. Never `npc.js` incident `causer`.
- Bind sits after the `npcDestroyed` de-dupe emit and after `deathHandled`.
- `state.js`, `save.js`, `ctx.js`, `world.js`, `combat.js`, `station.js` stay read-only for this task.
- WAVE80 pins cover no crimeScore, NPC-vs-NPC, pirate, trader-no-write, proto keys, ladder, Digit 9 silence, one bind.

### Findings

No open Blocker or Major items.

#### 🟡 Minor: local witness is not `lastAttackerOf`
**Location:** `src/game/kill-standing.js:38-44`
**Issue:** Helper does not import `lastAttackerOf` (avoids a cycle with `npc.js`). It treats own `ai.lastAttacker === 'player'` as the witness, which is the standing-relevant case of `lastAttackerOf === 'player'`.
**Fix:** Keep as-is unless witness logic is extracted to a third module.
**Status:** accepted — equivalent for `'player'`; dead ship refs and `'npc'` still skip.

#### 💡 Suggestion: `commLine` copy is unused until a delta exists
**Location:** `src/game/kill-standing.js:69-77,125`
**Issue:** Authored line is in the write branch only. Digit 9 does not claim kills move standing.
**Fix:** Leave until the owner delta ships.
**Status:** accepted — matches PR3 fail-closed.

### Verdict
Approve for Wave 80 fail-closed land. Do not invent a delta. Do not retarget patrol Freehold.
