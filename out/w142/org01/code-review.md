## Code Review: Org01 origin consequence preview (Wave 142 PR1)

### Summary

PR1 lands derived compact preview sublines on the origin overlay before one-press Digit/click confirm. Authored Digit order, `applyEffects` vocabulary, pause, listener remove, and `ctx.world.origin` write stay. `state.js` is read-only. No Blocker or Major findings remain.

### What's done well

- Authored `ORIGIN_DIGIT_IDS` in `origins.js` (`greenhand` … `drifter`). Skip does not compact Digit numbers.
- One `choose(id)` per Digit or click. No second confirm screen.
- Preview derives hull from `SHIP_CLASSES.light` + `MINING_LASERS[0]`, money from 350 + `setCredits`/`addCredits`, standings from `FACTIONS` + `rankFor`, danger from start/fear/debt/bond/hunger/cargo/clue, experience from the frozen words.
- Node derive check matches the deputized compact table (350 / −1150 / 600, Ledger ranks, Beautiful living-ship care, Drifter Redmarch + `clue tally-board`).
- Beautiful cargo is a danger cargo part, not a kit mutate.
- Greenhand omits fear (no `setFear`).
- Fail-closed paint and choose. Digit path uses the same `hasOwn` / record guard as Agent.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: `applyEffects` catch after mutation

**Location:** `src/game/origins.js` **96–141**  
**Issue:** A throw after `addCredits` returns false and leaves the overlay open.  
**Fix:** leave as fail-closed; authored effects do not throw.

#### 💡 Suggestion: extract preview helpers only if tests need them

**Location:** `origins.js` preview functions  
**Issue:** Helpers are module-private. Verifier can still read the overlay DOM.  
**Fix:** do not export unless a later stills PR asks.

### Contract checks

- [x] No `state.js` preview table
- [x] No Digit remap
- [x] No kit mutate
- [x] No credit/fear/rep retune
- [x] No Onb01 / Ctl05 / AI-05 / creditor steal
- [x] No `.screen-panel` / `.screen-btn` reuse
- [x] Compact sublines primary; list `overflow-y` is backup
- [x] `node --check src/game/origins.js` passed
