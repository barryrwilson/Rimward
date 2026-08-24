# Code Review: Wave 85 NAV persist

**Scope:** `src/game/nav.js`, `src/game/save.js` hooks, `src/core/ctx.js` event comment, WAVE85 pins.  
**Method:** self-applied checklist (`reviewer.md` + orchestrator `code-review.md`).  
**Date:** 2026-08-21

## Code Review: nav persist

### Summary
PR1/PR2 persist + BFS + NAV-03 `autopilot: false` land on one `world.nav` key. Heal, omit-delete, and plot/clear match merge law. Empty-path blocked restore was a real drop bug; it is fixed.

### What's done well
- Allowlist write via `writeNav`; raw save object is never assigned onto live `nav`
- Neighbors are `gates[].to` plus one-way `hub.routes` with no invented reverse
- Uncharted dest is not plottable; unknown dest is a no-op
- Same-id plot clears; no path persists `blocked` with dest kept
- `WORLD_FIELDS` gains only `'nav'`; autosave key unchanged
- Pins cover slice, omit-delete, proto, hopIndex/`active`, autopilot, BFS, emit source, and `state.js`

### Findings

#### 🟠 Major: Empty blocked path deleted the bag (fixed)
**Location:** `src/game/nav.js:124-137` (was `length < 1` → null)
**Issue:** `sanitizePath` treated `[]` as invalid, so a legal `status: 'blocked'` blob with empty path was dropped.
**Fix:** Allow empty arrays; plotted still requires dest-last and length ≥ 2 after slice. Pin `blockedEmptyKeep`.
**Status:** resolved

#### 🟡 Minor: `systemCount()` allocates `Object.keys` on each heal/BFS
**Location:** `src/game/nav.js:17-19`
**Issue:** Cap is catalog size (~100). Extra key walks per sanitize/plot.
**Fix:** Cache at module load, or use a constant next to `save.js` `N_SYSTEMS`. Not required for this slice.
**Status:** accepted (small N; tests may inject a catalog key)

#### 💡 Suggestion: `sanitizeSystemId` is exported before chart callers exist
**Location:** `src/game/nav.js:30`
**Issue:** Extra public surface. Chart PR will need it.
**Fix:** Keep export.
**Status:** accepted

### Recheck
Major empty-path drop is resolved. Unused remaining temp removed. No remaining Blocker/Major. WAVE85 pin-check all true.
