# Code Review: Wave 85 NAV chart + recalc

**Scope:** PR3 chart click / plot layer / `chartOpen`; PR4 `systemLoaded` recalc / `commLine`.  
**Method:** self-applied checklist (`reviewer.md` + orchestrator `code-review.md`).  
**Date:** 2026-08-21

## Code Review: galaxychart.js + nav.js

### Summary
Plot paint retargets by nav identity without rebuilding the SVG. Recalc follows contract §4.2. Persist BFS / sanitize / `autopilot: false` stay intact.

### What's done well
- Hit discs sit above nodes; hub rings, labels, plot strokes, and the current marker use `pointer-events: none`.
- Painted `NODE_R` stays 8; hit radius is viewBox × CSS size at open/resize (24 CSS px diameter floor).
- Plot class is `.rw-galaxy-plot`, not `.rw-galaxy-route`.
- `initNav` sits after `initJump` and consumes same-frame `systemLoaded` only (no `jumpRequested` / `dockPressed`).
- First update `recalcIfNeeded` heals a dest-only blocked bag without a jump.
- Emit stays fresh literals; names for Echo lines go through `stripControlChars`.

### Findings

#### 🟡 Minor: Idle clear still toasts
**Location:** `src/game/nav.js` `clearRoute`
**Issue:** Click current / Clear always emits `Route cleared.` even when `world.nav` is already omitted.
**Fix:** Optional: emit `commLine` only when a bag existed. Contract does not require that guard.
**Status:** accepted

#### 💡 Suggestion: `lastEvents` fallback unused
**Location:** `src/game/nav.js` `initNav`
**Issue:** Contract allows `lastEvents` if nav inits before jump. Live order is after jump, so `ctx.events` is enough.
**Fix:** None unless init order moves.

### Passed
- Off-path hop with no BFS path → `blocked`, dest kept
- Dest arrival → `arrived`
- Click current → `clearRoute`
- Uncharted dest still fail-closed on plot
- No teleport; no `jumpRequested` emit from nav

WAVE85 persist + chart boot pins all true. No Blocker/Major.
