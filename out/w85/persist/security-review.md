# Security Review: Wave 85 NAV persist

**Scope:** `src/game/nav.js`, `src/game/save.js` (`WORLD_FIELDS` / snapshot / restore), `src/core/ctx.js` freeze comment, WAVE85 boot pins.  
**Mode:** Deep audit (save-blob trust boundary).  
**Method:** self-applied checklist (`security-auditor.md` + orchestrator `security-review.md`).  
**Date:** 2026-08-21

## Security Review: world.nav persist

### Risk Level: Low

### Summary
Route persist heals with an allowlist, reserved-id dest/path checks, omit-delete, and `autopilot: false` on every keep. Emit uses a fresh `{ dest, hops, status }` literal. No HIGH or CRITICAL issues after the empty-path keep fix.

### Findings

#### 🟢 LOW: Uncharted dest may survive restore
**Location:** `src/game/nav.js:157-160`
**Issue:** `sanitizeNav` keeps a dest that is a catalog key even when `SYSTEMS[id].chart` is missing. `plotRoute` already fails closed for uncharted dest.
**Impact:** A stuffed blob can persist a blocked/plotted dest that the chart will not offer as a click target. BFS may still walk the id as a transit node (contract).
**Fix:** Out of this slice unless owner wants sanitize to drop uncharted dest. Plot verb stays fail-closed.
**Status:** accepted (contract §1.5 dest = SYSTEMS key; uncharted rule is plot/click)

#### 🟢 LOW: Snapshot copies the bag by reference
**Location:** `src/game/save.js:957`
**Issue:** `world[k] = ctx.world[k]` aliases `nav` until `JSON.stringify`, same as hangar/jobs.
**Impact:** A later in-memory mutate of live `nav` before serialize could change the snapshot object.
**Fix:** Pre-existing WORLD_FIELDS pattern. JSON autosave still stringifies.
**Status:** accepted (match hangar)

### Passed Checks
- [x] No secrets in code
- [x] Prototype dest/path (`__proto__`, `constructor`, full `RESERVED_IDS`) drop the bag
- [x] `SAFE_ID` match of `__proto__` does not bypass reserved check
- [x] Object.hasOwn only; no `for…in`; fresh `{}` write
- [x] Unknown keys (`hopIndex`, `cursor`, stuffed `type`) never copied
- [x] `status: 'active'|'recalc'|'broken'` deletes the bag
- [x] `autopilot: true` cannot round-trip; healer always writes `false`
- [x] `ctx.emit('navRoute', { dest, hops, status })` is a fresh literal (no `world.nav` spread, no type smash)
- [x] No `innerHTML`; no DOM; no new localStorage key
- [x] Omit-key restore deletes a live bag
- [x] `state.js` has no NAV table write

### Recommendations
1. Later chart PR must read `data-system-id` through `sanitizeSystemId` and must not emit `world.nav`.
2. Keep restore healer as the only writer of persist `autopilot` until NAV-03 engage exists.

## Recheck
Empty-path blocked bags now keep dest (HIGH correctness, not a new XSS). Pins including proto dest, stuffed `active`, autopilot false, and emit source all true. No new HIGH/CRITICAL.
