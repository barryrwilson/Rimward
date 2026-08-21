## UI Audit: NAV-01 galaxy chart plot (design freeze)

### Summary

NAV-01 is map UI on the existing Wave 21 overlay (KeyM, no pause). The freeze adds click-to-plot, a plot stroke layer that does **not** reuse hub gold, dest/hop/unreachable states, remaining-hop status, and a Clear button. Designer Major (16 chart-unit disc / hub rings steal clicks) is now fail-closed in contract §3.3.1 (24 CSS px, fill, paint order). This is the worker self-audit after that patch.

### What's done well

- Chart already has `role="dialog"`, labelled title, described copy, real Close `<button>`, `aria-modal="false"` (gameplay continues).
- Current system is **not** fill-only: thick outline + dashed marker + pulse (`hud.css` 1525–1562). Reduced-motion kills the pulse (`1619–1623`). Colorblind / contrast tokens already wrap `.rw-galaxy-chart` (`1599–1618`).
- Hub vs physical gate is already pattern + hue (solid slate vs dashed gold).
- Toasts already `aria-live="polite"` (`hud.js` 723–727) for `commLine` reports.
- Plot paint stays on the map; HUD-01 rails / KeyV lock are not a competing glance row in this slice (NAV-02).

### Findings

#### 🔴 Blocker

None remaining.

#### 🟠 Major (fixed in freeze)

##### U1: Click would fire guns

**Location:** `controls.js` 314–316; `hud.css` 1429–1432 full-screen overlay.  
**Issue:** Window LMB is fire. Overlay is z-index 30 inset 0.  
**Fix applied:** `ctx.flags.chartOpen`; controls ignores LMB. Chart does not stopPropagation (law 4).

##### U2: Player plot vs hub route collision

**Location:** `hud.css` 1510–1516 `.rw-galaxy-route`.  
**Issue:** Same class would make plots look like Lamplighter one-ways.  
**Fix applied:** `.rw-galaxy-plot*` with a **solid** stroke + dest shape (not gold dash, not current dashed cyan ring). Color is not the only cue.

##### U3: Unreachable vs far

**Location:** wishlist NAV-01.  
**Issue:** A hop number on a dead dest reads as “far”.  
**Fix applied:** Blocked status text has **no** hop count (`No route from here.`). `.is-unreachable` outline. Far dests plot and show `N jumps`.

##### U4: Hit target 16 chart units was not 24 CSS px (designer Major)

**Location:** `galaxychart.js` 35, 194–198; `hud.css` 1530–1536; designer-audit Major.  
**Issue:** `r = 16` chart units ≈ 10 CSS px. `fill: none` is not a disc. Hub rings sit on the node and intercept.  
**Fix applied:** Contract §3.3.1 — diameter ≥ **24 CSS px** from live viewBox scale; filled hit (`transparent` / `fill-opacity: 0` or `pointer-events: all`); hub rings / labels / current marker / plot strokes `pointer-events: none`; paint order gates → hub routes → plot overlay → painted nodes + rings → **hit discs** → labels → current marker. Painted `NODE_R` stays 8. Topmost disc wins on overlap. PR3 named.

#### 🟡 Minor

##### U5: Keyboard node pick

**Issue:** Chart does not pause; arrow/WASD picker would steal flight. 100 tabindex nodes is a tab trap.  
**Default:** Click is the plot verb. Close + Clear are real buttons. Status `aria-live`.  
**Why not Major:** Fail-closed owner Q4. Designer may later add a docked-only list; not this slice (chart is **closed** while docked).

##### U6: Desc copy still says “M or Escape closes”

**Location:** `galaxychart.js` 109.  
**Issue:** Impl should extend the static description to mention click-to-plot and Clear, still `textContent`.  
**Accept:** Named as impl copy; no innerHTML.

##### U7: Remaining hops while map closed

**Issue:** Player flying with the map shut only hears `commLine` until they press M.  
**Why not Major:** Owner Q3 / NAV-02 owns in-flight HUD. NAV-01 must not steal HUD-01.

##### U8: `aria-modal="false"` + new Clear button

Focus is not trapped (by design: flight continues). Tab may leave the overlay into the page. Live today for Close. Clear should sit in the header next to Close so the two chrome buttons are adjacent.

#### 💡 Suggestion

- Dest marker: diamond or double ring so it cannot be mistaken for the current dashed pulse ring.
- Blocked dest: `aria-invalid` or `aria-description` “no route” in addition to the status line.
- Colorblind: keep plot on `--white` / high-contrast stroke, not a new hue that collapses to gold.

### Passed Checks

- [x] No `innerHTML`
- [x] Names via `textContent`
- [x] Reduced-motion already on the overlay
- [x] Contrast / colorblind tokens exist to inherit
- [x] Close control is a button
- [x] Chart does not pause
- [x] Landmark HUD diamonds are not a plot source
- [x] Digit 0–9 / KeyV not used as plot
- [x] Hit floor ≥ 24 CSS px, filled disc, hub rings `pointer-events: none`, plot above rings (contract §3.3.1)

### Re-review (after U1–U4, designer Major)

Blocker/Major remaining: **0**. U4 now uses a CSS-px floor, fill, hub-ring none, and paint order. U5 keyboard reach stays owner Q4. Designer minors (dest diamond, Clear disabled, legend plot item, hover cursor) stay PR3 CSS notes — not freeze holes.
