# Security Review: Wave 85 NAV chart + recalc

**Scope:** `src/systems/galaxychart.js`, `src/ui/hud.css`, `src/systems/controls.js` (`fireHeld` vs `chartOpen`), `src/core/ctx.js` (`flags.chartOpen`), `src/game/nav.js` (initNav / recalc / commLine), `src/main.js` init order, WAVE85 chart pins.  
**Mode:** Deep audit (DOM click + emit + session flag).  
**Method:** self-applied checklist (`security-auditor.md` + orchestrator `security-review.md`).  
**Date:** 2026-08-21

## Security Review: chart click / plot / commLine

### Risk Level: Low

### Summary
Chart clicks sanitize `data-system-id` before plot. Status and labels use `textContent`. Emit payloads are fresh literals. `fireHeld` is gated on `ctx.flags.chartOpen`, not a DOM class. No HIGH or CRITICAL issues.

### Findings

#### 🟢 LOW: Chart status names skip `stripControlChars`
**Location:** `src/systems/galaxychart.js` `destLabel`
**Issue:** Map status reads `SYSTEMS[id].name` into `textContent` without the save-string strip used by `commLine`.
**Impact:** Catalog names are authored, not save blobs. `textContent` still cannot inject HTML.
**Fix:** Optional strip if a later wave copies names from save into `SYSTEMS`.
**Status:** accepted (contract: chart names via `SYSTEMS` then `textContent`)

### Passed Checks
- [x] No `innerHTML` in `galaxychart.js` or `nav.js`
- [x] SVG `svgEl` uses literal attribute maps only (no save blobs as attrs)
- [x] Click dest runs `sanitizeSystemId` on `data-system-id`; fail → ignore
- [x] Prototype / reserved ids cannot become dest or path ids
- [x] `navRoute` is a fresh `{ dest, hops, status }` literal (no `world.nav` spread, no `type` smash)
- [x] `commLine` is `{ text, from: 'Echo' }` with static templates; names stripped via `stripControlChars`
- [x] No `ctx.targets.current` write; no KeyV / KeyT / Digit 0–9 / KeyG steal
- [x] No `ctx.world.mystery` / clue / landmark read on the chart
- [x] Chart does not call `preventDefault(` or `stopPropagation(`
- [x] `setOpen` is the only `flags.chartOpen` writer; not a `WORLD_FIELDS` key
- [x] `controls.js` forces `fireHeld` false while `chartOpen` (held LMB cannot fire through)
- [x] No new localStorage key; no secrets

### Recommendations
1. Keep persist pin-check's old `!chartOpen` source fence out of boot-test; session flag is now required.
2. Do not add a `ctx.autopilot` channel.

## Recheck
WAVE85 persist pins all true. WAVE85 chart pins all true. Probe PASS. No new HIGH/CRITICAL.
