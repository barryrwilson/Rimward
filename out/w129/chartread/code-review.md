## Code Review: NAV-09 PR1 itinerary last-hop gate type

### Summary
`paintItinerary` now lists plotted **legs**, not path nodes. A 1-jump Freehold→Veridian row uses `gateTypeToken('freehold','veridian')` (`gate` in authored data) instead of fail-closed `unknown` on the dest node.

### What's done well
- Loop is `i` in `0 .. path.length-2` with `hasOwn` on both ends; identity fields read the arrival `to`.
- Hidden itinerary still: `status !== 'plotted'` or `path.length < 2`.
- `unknown` remains only inside `gateTypeToken` when neither gate nor hub.
- `#rw-galaxy-dest` kept; `showApLive` and Autopilot close paths untouched.
- `textContent` still; no `hud.css` rewrite this pass.

### Findings

No Blocker or Major issues after the last-hop re-dispatch.

#### 🟡 Minor: `applyFilters` / `paintItinerary` run every open frame
**Location:** `update()` when `open`  
**Issue:** 101 discs and dest options are retoggled each frame so standing changes while open stay live.  
**Fix:** Optional dirty signature if profiling shows cost.  
**Justification:** n=101 is cheap; standing can change under an open chart.

#### 💡 Suggestion: Hide when every leg sanitizes empty
**Location:** `src/systems/galaxychart.js` `paintItinerary` after the leg loop  
**Issue:** A plotted path of length ≥ 2 with no valid `from`/`to` pairs still shows an empty `ol`.  
**Fix:** Call `hideItinerary()` if `parts.length === 0`.  
**Justification:** Live NAV-01 paths are sanitized ids; not an acceptance miss.

### WAVE85
`preventDefault` / `stopPropagation` are still absent so the existing `noPrevent` pin stays green.

### Last-hop (closed)
Previous Minor “last itinerary hop uses gate type `unknown`” is closed. Dest row is no longer a hop with no next id. Authored `freehold.gates` includes `{ to: 'veridian' }`; hub routes from Freehold do not include Veridian, so the token is `gate`.
