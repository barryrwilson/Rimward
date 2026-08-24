## Code Review: NAV-04 galaxy-map hover

### Summary
PR1–PR4 land a pure `hoverModel` plus chart pointer/readout. Click-to-plot is unchanged. Live standing rebuilds each `update` while hovered. No Blocker or Major after the idle-strip layout fix.

### What's done well
- `hoverModel` is DOM-free and persist-free; pins do not need jsdom.
- Political mapping matches contract: Independent, Unknown, Unknowables, Hollow Reach.
- Pointerover + svg `pointerleave` gives sticky hover without child `pointerout` flicker.
- `retargetPlot` still removes only `is-dest` / `is-hop` / `is-unreachable`, so `.is-hover` survives.
- `setOpen(false)` clears hover id, highlight, and readout.

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: `hoverModel` allocates each open-chart frame while hovered

**Location:** `src/systems/galaxychart.js` `update()` → `applyHoverId`  
**Issue:** Contract requires a live `standingRead`/`rankFor` rebuild. The object is tiny; `paintHoverReadout` skips `textContent` when id + standing text are unchanged.  
**Fix:** None. Required freshness.

#### 💡 Suggestion: reserved-key set is duplicated

**Location:** `src/game/chart-hover.js` `RESERVED_IDS`  
**Issue:** Same list as `nav.js` / `data-trade.js`. `nav.js` does not export `reservedId`.  
**Fix:** Leave local. Do not edit `nav.js`.

### Verdict
Approve.
